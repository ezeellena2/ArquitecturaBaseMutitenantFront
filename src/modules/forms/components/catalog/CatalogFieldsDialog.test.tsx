import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { AppChromeProvider } from "@/shared/ui/app/AppChrome";
import { server } from "@/test/mocks/server";
import { pickerName } from "@/test/picker";
import { asPhone } from "@/test/utils/phone";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import type { FormCatalogPresentationDetail, FormCatalogRow } from "../../api/types";
import { catalogFieldLimits, newFieldDraft, type CatalogFieldDraft, type CatalogFieldsDraft } from "../../lib/catalogFields";
import { CatalogFieldsDialog } from "./CatalogFieldsDialog";

// Tablero FRM-Catalogo-Campos: «Proveedores» con CUIT (texto de hasta 13, obligatorio y único, con 1.097 valores) y Zona (de «Zonas»).
const saved = (id: string, name: string, extra: Partial<CatalogFieldDraft> = {}): CatalogFieldDraft =>
  ({ ...newFieldDraft(), localKey: id, id, key: name.toLowerCase(), keyEdited: true, name, ...extra });
const cuit = saved("f-cuit", "CUIT", { required: true, unique: true, maxLength: "13", valuesCount: 1097 });
const zona = saved("f-zona", "Zona", { type: "Catalog", sourceCatalogId: "c-zonas", sourceCatalogName: "Zonas", required: true });
const proveedores: CatalogFieldsDraft = { fields: [cuit, zona], confirmedRemovals: [] };

const row = (id: string, name: string, optionsCount: number): FormCatalogRow =>
  ({ id, name, source: "Manual", valueType: "Text", optionsCount, isActive: true, usable: true });
const catalogs = [row("c-motivos", "Motivos de visita", 3), row("c-productos", "Productos", 10), row("c-proveedores", "Proveedores", 1097),
  row("c-recargo", "Recargo por zona", 6), row("c-tipos", "Tipos de producto", 12), row("c-zonas", "Zonas", 6)];

let requests: URL[] = [];
beforeEach(() => {
  requests = [];
  server.use(http.get("/api/organization/forms/catalogs", ({ request }) => {
    const url = new URL(request.url);
    requests.push(url);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const items = catalogs.filter((catalog) => catalog.name.toLowerCase().includes(search));
    return HttpResponse.json({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
  }));
});

function mount({ value = proveedores, readOnly = false, removedKeys = [], presentation = null, phone = false }: {
  value?: CatalogFieldsDraft; readOnly?: boolean; removedKeys?: readonly string[]; presentation?: FormCatalogPresentationDetail | null; phone?: boolean;
} = {}) {
  const result: { done: CatalogFieldsDraft[]; closed: number } = { done: [], closed: 0 };
  function Harness() {
    const [open, setOpen] = useState(true);
    return open ? <CatalogFieldsDialog catalogId="c-proveedores" catalogName="Proveedores" value={value} removedKeys={removedKeys} presentation={presentation}
      readOnly={readOnly} onDone={(next) => result.done.push(next)} onClose={() => { result.closed++; setOpen(false); }} /> : null;
  }
  const chrome = { phone, parent: null, subtitle: null, hideBottomNav: () => {} };
  renderWithProviders(<AppChromeProvider value={chrome}><Harness /></AppChromeProvider>);
  return { result, user: userEvent.setup() };
}

const dialog = () => screen.getByRole("dialog", { name: "Campos de «Proveedores»" });
const items = () => within(within(dialog()).getByRole("list", { name: "Campos" })).getAllByRole("listitem");
const names = () => items().map((item) => within(item).getAllByRole("button")[0]!.querySelector("span:nth-child(2)")?.textContent);
const textbox = (name: string) => within(dialog()).getByRole("textbox", { name });

describe("CatalogFieldsDialog (FRM-Catalogo-Campos)", () => {
  it("la lista tiene el número, el nombre y el tipo, cada uno en su columna (263), y el campo, su nombre, su clave con su candado, su tipo, el largo y las reglas", async () => {
    mount();
    expect(await within(dialog()).findByText("2 de 20")).toBeInTheDocument();
    const [first, second] = items().map((item) => [...within(item).getAllByRole("button")[0]!.children].map((cell) => cell.textContent));
    expect(first).toEqual(["1", "CUIT", "", "Texto"]);
    expect(second).toEqual(["2", "Zona", "", "De un catálogo"]);
    const field = within(dialog()).getByRole("region", { name: "Campo 1 de 2" });
    expect(within(field).getByRole("textbox", { name: "Nombre" })).toHaveValue("CUIT");
    // Guardada, la clave queda fija: se lee, con su candado (130).
    expect(within(field).getByRole("textbox", { name: "Clave" })).toHaveAttribute("readonly");
    expect(within(field).getByRole("img", { name: "No cambia: el campo ya está guardado" })).toBeInTheDocument();
    expect(within(field).getByRole("button", { name: pickerName("Tipo") })).toHaveAccessibleName("Tipo Texto");
    expect(within(field).getByRole("textbox", { name: "Largo" })).toHaveValue("13");
    expect(within(field).getByRole("checkbox", { name: "Obligatorio" })).toBeChecked();
    expect(within(field).getByRole("checkbox", { name: "Único" })).toBeChecked();
    expect(await axe(dialog())).toHaveNoViolations();
  });

  it("agregar, subir, bajar y quitar: uno nuevo va con «—» y «Nuevo», su clave nace del nombre y nace opcional", async () => {
    const { user, result } = mount();
    await within(dialog()).findByText("2 de 20");
    await user.click(within(dialog()).getByRole("button", { name: "Agregar campo" }));
    expect(within(dialog()).getByText("3 de 20")).toBeInTheDocument();
    const field = within(dialog()).getByRole("region", { name: "Nuevo campo" });
    expect(within(field).getByRole("textbox", { name: "Nombre" })).toHaveFocus();
    await user.paste("Plazo de pago");
    expect(within(field).getByRole("textbox", { name: "Clave" })).toHaveValue("plazo_de_pago");
    expect(within(items()[2]!).getByText("Nuevo")).toBeInTheDocument();
    expect(within(items()[2]!).getByRole("img", { name: "Sin dato" })).toBeInTheDocument();
    // Nace opcional: «Obligatorio» apagado, con su motivo (130).
    const required = within(field).getByRole("checkbox", { name: "Obligatorio" });
    expect(required).toHaveAttribute("aria-disabled", "true");
    expect(required).toHaveAccessibleDescription("Un campo nuevo nace opcional: para hacerlo obligatorio, todas las opciones activas necesitan un valor.");
    await user.click(within(dialog()).getByRole("button", { name: "Subir Plazo de pago" }));
    expect(names()).toEqual(["CUIT", "Plazo de pago", "Zona"]);
    await user.click(within(dialog()).getByRole("button", { name: "Subir Plazo de pago" }));
    expect(names()).toEqual(["Plazo de pago", "CUIT", "Zona"]);
    expect(within(dialog()).getByRole("button", { name: "Subir Plazo de pago" })).toBeDisabled();
    await user.click(within(dialog()).getByRole("button", { name: "Bajar Plazo de pago" }));
    expect(names()).toEqual(["CUIT", "Plazo de pago", "Zona"]);
    // Uno nuevo se quita sin preguntar.
    await user.click(within(dialog()).getByRole("button", { name: "Quitar campo" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(names()).toEqual(["CUIT", "Zona"]);
    await user.click(within(dialog()).getByRole("button", { name: "Listo" }));
    expect(result.done).toEqual([proveedores]);
  });

  it("escribe en una copia hasta «Listo», que avisa si hay un campo nuevo; «Cancelar» y Esc la descartan", async () => {
    const first = mount();
    await first.user.clear(textbox("Nombre"));
    await first.user.paste("Cuit del proveedor");
    await first.user.click(within(dialog()).getByRole("button", { name: "Cancelar" }));
    expect(first.result).toEqual({ done: [], closed: 1 });
    expect(proveedores.fields[0]!.name).toBe("CUIT");
  });

  it("«Listo» deja los campos con el nuevo y avisa que se guarde el catálogo; un nuevo sin nada escrito no queda", async () => {
    const { user, result } = mount();
    await user.click(within(dialog()).getByRole("button", { name: "Agregar campo" }));
    await user.paste("Plazo de pago");
    await user.click(within(dialog()).getByRole("button", { name: "Agregar campo" }));
    await user.click(within(dialog()).getByRole("button", { name: "Listo" }));
    expect(result.done).toHaveLength(1);
    expect(result.done[0]!.fields.map((field) => [field.id, field.name, field.key, field.required])).toEqual([
      ["f-cuit", "CUIT", "cuit", true], ["f-zona", "Zona", "zona", true], [null, "Plazo de pago", "plazo_de_pago", false]]);
    expect(await screen.findByText("Guardá el catálogo para cargar los valores de los campos nuevos.")).toBeInTheDocument();
  });

  it("Esc descarta la copia", async () => {
    const { user, result } = mount();
    await user.click(within(dialog()).getByRole("button", { name: "Agregar campo" }));
    await user.keyboard("{Escape}");
    expect(result).toEqual({ done: [], closed: 1 });
  });

  it("llega al tope de 20 con su motivo en «Agregar campo»", async () => {
    const full = Array.from({ length: catalogFieldLimits.active }, (_, index) => saved(`f-${index}`, `Campo ${index + 1}`));
    mount({ value: { fields: full, confirmedRemovals: [] } });
    expect(await within(dialog()).findByText("20 de 20")).toBeInTheDocument();
    const add = within(dialog()).getByRole("button", { name: "Agregar campo" });
    expect(add).toHaveAttribute("aria-disabled", "true");
    expect(add).toHaveAccessibleDescription("Llegó a 20 campos, el máximo de un catálogo.");
  });

  it("la clave nueva se escribe hasta guardar: choca con otra sin mirar mayúsculas, y con un lugar o una quitada suma un número", async () => {
    const { user } = mount({ removedKeys: ["plazo"] });
    await user.click(within(dialog()).getByRole("button", { name: "Agregar campo" }));
    await user.paste("Cuit");
    expect(textbox("Clave")).toHaveValue("cuit");
    expect(within(dialog()).getByRole("alert")).toHaveTextContent("Ya la usa «CUIT».");
    await user.clear(textbox("Nombre"));
    await user.paste("Plazo");
    expect(textbox("Clave")).toHaveValue("plazo_2");
    await user.clear(textbox("Nombre"));
    await user.paste("Código");
    expect(textbox("Clave")).toHaveValue("codigo");
    await user.clear(textbox("Nombre"));
    await user.paste("Detail");
    expect(textbox("Clave")).toHaveValue("detail_2");
    // Escrita a mano, deja de seguir al nombre y lleva el tope del contrato (269).
    // Borrarla la devuelve al nombre; escribirla encima la deja fija hasta guardar.
    await user.clear(textbox("Clave"));
    expect(textbox("Clave")).toHaveValue("detail_2");
    await user.tripleClick(textbox("Clave"));
    await user.paste("Mi Clave");
    expect(textbox("Clave")).toHaveValue("miclave");
    expect(textbox("Clave")).toHaveAttribute("maxlength", String(catalogFieldLimits.key));
    expect(textbox("Nombre")).toHaveAttribute("maxlength", String(catalogFieldLimits.name));
    await user.type(textbox("Nombre"), "s");
    expect(textbox("Clave")).toHaveValue("miclave");
  });

  it("quitar uno guardado pregunta; con valores pide marcar la casilla, y si está en «En WhatsApp», lo dice", async () => {
    const { user, result } = mount({ presentation: { title: ["text"], description: ["field:f-zona"] } });
    await user.click(within(dialog()).getByRole("button", { name: "Quitar campo" }));
    let question = screen.getByRole("alertdialog", { name: "Quitar «CUIT»" });
    expect(question).toHaveAccessibleDescription("Se quita de la tabla, de la plantilla y del Excel.");
    const confirm = within(question).getByRole("button", { name: "Quitar el campo" });
    expect(confirm).toHaveAttribute("aria-disabled", "true");
    expect(confirm).toHaveAccessibleDescription("Marcá la confirmación para quitarlo.");
    await user.click(confirm);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(within(question).getByRole("checkbox", { name: "Sí, quitar el campo y sus 1.097 valores" }));
    await user.click(within(question).getByRole("button", { name: "Quitar el campo" }));
    expect(names()).toEqual(["Zona"]);
    await user.click(within(dialog()).getByRole("button", { name: "Quitar campo" }));
    question = screen.getByRole("alertdialog", { name: "Quitar «Zona»" });
    expect(question).toHaveAccessibleDescription("Se quita de la tabla, de la plantilla y del Excel. También se saca de «En WhatsApp» de este catálogo.");
    expect(within(question).queryByRole("checkbox")).not.toBeInTheDocument();
    await user.click(within(question).getByRole("button", { name: "Cancelar" }));
    await user.click(within(dialog()).getByRole("button", { name: "Listo" }));
    expect(result.done).toEqual([{ fields: [zona], confirmedRemovals: ["f-cuit"] }]);
  });

  it("la ✕ de la pregunta de quitar es «Cancelar»: vuelve al campo sin cerrar «Campos de …» (FRM-Catalogo-Campos, «Quitar un campo»)", async () => {
    const { user, result } = mount();
    await within(dialog()).findByText("2 de 20");
    await user.click(within(items()[1]!).getAllByRole("button")[0]!);
    await user.click(within(dialog()).getByRole("button", { name: "Quitar campo" }));
    const question = screen.getByRole("alertdialog", { name: "Quitar «Zona»" });
    await user.click(within(question).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(within(dialog()).getByRole("region", { name: "Campo 2 de 2" })).toBeInTheDocument();
    expect(names()).toEqual(["CUIT", "Zona"]);
    expect(result.closed).toBe(0);
  });

  it("«Tipo» tiene el ancho de los demás campos (FRM-Catalogo-Campos)", async () => {
    mount();
    const field = await within(dialog()).findByRole("region", { name: "Campo 1 de 2" });
    expect(within(field).getByRole("button", { name: pickerName("Tipo") }).className).not.toMatch(/max-w-/);
  });

  it("el combo del catálogo abre con los primeros a mano activos, busca adentro de la lista y cerrado dice solo el catálogo (262)", async () => {
    const { user, result } = mount();
    await user.click(within(items()[1]!).getAllByRole("button")[0]!);
    const combo = within(dialog()).getByRole("button", { name: pickerName("Catálogo") });
    expect(combo).toHaveAccessibleName("Catálogo Zonas");
    expect(requests).toHaveLength(0);
    await user.click(combo);
    const productos = await screen.findByRole("option", { name: /^Productos/ });
    expect(productos).toHaveTextContent("10 opciones");
    expect(requests[0]!.searchParams.get("source")).toBe("Manual");
    expect(requests[0]!.searchParams.get("status")).toBe("Active");
    expect(screen.getByText("6 catálogos")).toBeInTheDocument();
    // El catálogo que se edita no es su propia fuente.
    const self = screen.getByRole("option", { name: /^Proveedores/ });
    expect(self).toHaveAttribute("aria-disabled", "true");
    const search = screen.getByRole("combobox");
    expect(search).toHaveFocus();
    await user.type(search, "zo");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    expect(requests.at(-1)!.searchParams.get("search")).toBe("zo");
    await user.type(search, "rro");
    expect(await screen.findByText("Ningún catálogo coincide con «zorro».")).toBeInTheDocument();
    await user.clear(search);
    await user.click(await screen.findByRole("option", { name: /^Recargo por zona/ }));
    expect(combo).toHaveAccessibleName("Catálogo Recargo por zona");
    await user.click(within(dialog()).getByRole("button", { name: "Listo" }));
    expect(result.done[0]!.fields[1]).toMatchObject({ sourceCatalogId: "c-recargo", sourceCatalogName: "Recargo por zona" });
  });

  it("cambiar el tipo deja solo lo que le sirve: el rango de un número, el catálogo de «De un catálogo»", async () => {
    const { user, result } = mount();
    await user.click(within(dialog()).getByRole("button", { name: pickerName("Tipo") }));
    await user.click(await screen.findByRole("option", { name: "Número entero" }));
    expect(within(dialog()).queryByRole("textbox", { name: "Largo" })).not.toBeInTheDocument();
    await user.click(textbox("Desde"));
    await user.paste("0");
    await user.click(textbox("Hasta"));
    await user.paste("1.500");
    expect(within(dialog()).getByRole("alert")).toHaveTextContent(/./);
    await user.clear(textbox("Hasta"));
    await user.paste("365");
    expect(within(dialog()).queryByRole("alert")).not.toBeInTheDocument();
    await user.click(within(dialog()).getByRole("button", { name: "Listo" }));
    expect(result.done[0]!.fields[0]).toMatchObject({ type: "WholeNumber", maxLength: "", min: "0", max: "365" });
  });

  it("quien solo lee ve los mismos datos, sin editar, y lo cierra", async () => {
    const { user, result } = mount({ readOnly: true });
    expect(within(dialog()).queryByRole("button", { name: "Agregar campo" })).not.toBeInTheDocument();
    expect(within(dialog()).queryByRole("button", { name: "Quitar campo" })).not.toBeInTheDocument();
    expect(within(dialog()).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(dialog()).getByText("Hasta 13 caracteres")).toBeInTheDocument();
    expect(within(dialog()).getByText("Obligatorio · Único")).toBeInTheDocument();
    await user.click(within(dialog()).getAllByRole("button", { name: "Cerrar" }).at(-1)!);
    expect(result).toEqual({ done: [], closed: 1 });
  });

  describe("en el teléfono (M-FRM-Catalogo-Campos)", () => {
    let restore: () => void = () => {};
    beforeEach(() => { restore = asPhone(); });
    afterEach(() => restore());

    it("ocupa la pantalla: primero la lista y, al tocar un campo, el campo con «Volver a la lista»", async () => {
      const { user } = mount({ phone: true });
      const screenDialog = screen.getByRole("dialog", { name: "Campos" });
      expect(await within(screenDialog).findByText("Campos · 2 de 20")).toBeInTheDocument();
      const card = within(screenDialog).getAllByRole("listitem")[0]!;
      expect(within(card).getByText("Tipo")).toBeInTheDocument();
      expect(within(card).getByText("Texto")).toBeInTheDocument();
      await user.click(within(card).getByRole("button"));
      expect(screen.getByRole("dialog", { name: "Campo 1 de 2" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("CUIT");
      await user.click(screen.getByRole("button", { name: "Volver a la lista" }));
      expect(screen.getByRole("dialog", { name: "Campos" })).toBeInTheDocument();
      expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
    });

    it("la clave guardada empieza después del candado: el campo del teléfono lleva 14 de relleno", async () => {
      const { user } = mount({ phone: true });
      const screenDialog = screen.getByRole("dialog", { name: "Campos" });
      await user.click(within(within(screenDialog).getAllByRole("listitem")[0]!).getByRole("button"));
      expect(screen.getByRole("textbox", { name: "Clave" })).toHaveClass("pl-8", "max-md:pl-10");
      expect(screen.getByRole("img", { name: "No cambia: el campo ya está guardado" })).toHaveClass("left-3", "max-md:left-3.5");
    });

    it("quitar pregunta en una hoja sobre la pantalla del campo, con su ✕, que vuelve al campo (M-FRM-Catalogo-Campos, «Quitar un campo»)", async () => {
      const { user, result } = mount({ phone: true });
      const screenDialog = screen.getByRole("dialog", { name: "Campos" });
      await user.click(within(within(screenDialog).getAllByRole("listitem")[1]!).getByRole("button"));
      await user.click(screen.getByRole("button", { name: "Quitar campo" }));
      const question = screen.getByRole("alertdialog", { name: "Quitar «Zona»" });
      // La pantalla «Campo 2 de 2» sigue debajo de la hoja.
      expect(screen.getByText("Campo 2 de 2")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Zona")).toBeInTheDocument();
      expect(within(question).getByRole("button", { name: "Quitar el campo" })).toBeInTheDocument();
      await user.click(within(question).getByRole("button", { name: "Cerrar" }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: "Campo 2 de 2" })).toBeInTheDocument();
      // Confirmar la quita deja la lista sin el campo, en la misma pantalla.
      await user.click(screen.getByRole("button", { name: "Quitar campo" }));
      await user.click(within(screen.getByRole("alertdialog", { name: "Quitar «Zona»" })).getByRole("button", { name: "Quitar el campo" }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue("Zona")).not.toBeInTheDocument();
      expect(result.closed).toBe(0);
    });
  });
});
