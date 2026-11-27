import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { choose } from "@/test/picker";
import { asPhone } from "@/test/utils/phone";
import type { FormCatalogItemRow, FormCatalogResponse, UpdateFormCatalogRequest } from "../../api/types";
import { formsOwner, mountForms } from "../../test/support";

const base = "/api/organization/forms/catalogs";
const path = "/org/formularios/catalogos/c-motivos";
const catalog: FormCatalogResponse = {
  id: "c-motivos", name: "Motivos de visita", description: "Por qué se visita a un cliente.", source: "Manual", valueType: "Text",
  isActive: true, usable: true, canManage: true, itemCounts: { total: 4, active: 3 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 7,
};
const item = (id: string, position: number, text: string, code: string, extra: Partial<FormCatalogItemRow> = {}): FormCatalogItemRow =>
  ({ id, position, text, code, detail: null, value: null, isActive: true, textRepeated: false, ...extra });
// Tablero FRM-Catalogo-Opciones: cuatro opciones, «Cobranza» dada de baja.
const motivos = [
  item("i-seg", 1, "Seguimiento", "SEG", { detail: "Visita programada a un cliente actual" }),
  item("i-ven", 2, "Venta nueva", "VEN", { detail: "Primera visita a un cliente" }),
  item("i-rec", 3, "Reclamo", "REC", { detail: "Hay un problema para resolver" }),
  item("i-cob", 4, "Cobranza", "COB", { detail: "Cobrar un pago pendiente", isActive: false }),
];

let puts: UpdateFormCatalogRequest[] = [];
function serve(put: () => Response = () => HttpResponse.json({ version: 8, itemIdentityMap: [] })) {
  puts = [];
  server.use(
    http.get(`${base}/c-motivos`, () => HttpResponse.json(catalog)),
    http.get(`${base}/c-motivos/items`, () => HttpResponse.json({ items: motivos, page: 1, pageSize: 10, totalCount: 4, totalPages: 1, hasPrevious: false, hasNext: false })),
    http.put(`${base}/c-motivos`, async ({ request }) => { puts.push(await request.json() as UpdateFormCatalogRequest); return put(); }),
  );
}

async function openEditor() {
  const mounted = mountForms(formsOwner, path);
  await screen.findByRole("textbox", { name: "Texto de Seguimiento" });
  return mounted;
}

const textbox = (name: string) => screen.getByRole("textbox", { name });
const saveButton = () => screen.getByRole("button", { name: "Guardar cambios" });
const optionsOf = (dialog: HTMLElement, name = "Opciones") => within(within(dialog).getByRole("list", { name })).getAllByRole("button");

beforeAll(async () => { await import("../../pages/CatalogEditorPage"); });
beforeEach(() => serve());

describe("OptionsDialog (FRM-Catalogo-Opciones)", () => {
  it("«Agregar opción» abre «Opciones nuevas» con una nueva; «Listo» conserva lo escrito y quita la nueva sin nada escrito", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Agregar opción" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones nuevas de «Motivos de visita»" });
    expect(within(dialog).getByRole("region", { name: "Nueva opción" })).toBeInTheDocument();
    // El Estado va solo en una guardada.
    expect(within(dialog).queryByRole("button", { name: /^Estado/ })).not.toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox", { name: "Texto" }), "Garantía");
    expect(within(dialog).getByText("8/30")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Generar desde el texto" }));
    expect(within(dialog).getByRole("textbox", { name: "Código" })).toHaveValue("GAR");
    await user.click(within(dialog).getByRole("button", { name: "Agregar opción" }));
    expect(optionsOf(dialog, "Opciones nuevas")).toHaveLength(2);
    expect(await axe(dialog)).toHaveNoViolations();
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(textbox("Código de Garantía")).toHaveValue("GAR");
    expect(screen.queryByRole("textbox", { name: "Texto de Opción nueva" })).not.toBeInTheDocument();
  });

  it("«Cancelar» y Esc devuelven todo como estaba al abrirlo, también lo cambiado antes en la tabla", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Editar Venta nueva" }));
    let dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(within(dialog).getByRole("region", { name: "Opción 2 de 4" })).toBeInTheDocument();
    expect(within(dialog).getByText("1–4 de 4")).toBeInTheDocument();
    const text = within(dialog).getByRole("textbox", { name: "Texto" });
    await user.clear(text);
    await user.type(text, "Venta");
    await user.click(within(dialog).getByRole("button", { name: "Agregar opción" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(textbox("Texto de Venta nueva")).toHaveValue("Venta nueva");
    expect(screen.queryByRole("textbox", { name: "Texto de Opción nueva" })).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    // Pegado y no tipeado: cada letra cambia el nombre de la fila y vuelve a dibujar la tabla; cada test entra en 5 s (tests).
    await user.click(textbox("Texto de Reclamo"));
    await user.paste(" urgente");
    await user.click(screen.getByRole("button", { name: "Editar Reclamo urgente" }));
    dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    await user.click(within(dialog).getByRole("textbox", { name: "Texto" }));
    await user.paste(" y grave");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(textbox("Texto de Reclamo urgente")).toHaveValue("Reclamo urgente");
  });

  it("la lista lleva cada dato en su columna (263) y el Estado se elige en la pieza (262)", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Editar Cobranza" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    const cobranza = optionsOf(dialog)[3];
    expect(cobranza).toHaveAttribute("aria-current", "true");
    // El número, el texto, «Nueva», «Se borra al guardar» o «De baja» y el código, cada uno en su columna, ninguno debajo de
    // otro. Una de baja lo dice con su palabra, no solo con el gris del texto (accesibilidad).
    expect([...cobranza.children].map((cell) => cell.textContent)).toEqual(["4", "Cobranza", "De baja", "COB"]);
    expect(optionsOf(dialog)[0].children[2]).toHaveTextContent(/^$/);
    expect(within(dialog).getByRole("button", { name: /^Estado/ })).toHaveTextContent("De baja");
    await choose(user, "Estado", "Activa");
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    expect(screen.getByRole("checkbox", { name: "Activa: Cobranza" })).toBeChecked();
    expect(saveButton()).toBeEnabled();
  });

  it("«Quitar opción» en una guardada pregunta en el mismo diálogo y la deja «Se borra al guardar» con «Restaurar»; en una nueva, no pregunta", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Editar Reclamo" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    await user.click(within(dialog).getByRole("button", { name: "Quitar opción" }));
    const question = await screen.findByRole("alertdialog", { name: "¿Borrar «Reclamo»?" });
    // Nunca un diálogo sobre otro: la pregunta ocupa el mismo.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(within(question).getByRole("button", { name: "Borrar opción" }));
    const back = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(optionsOf(back)[2]).toHaveTextContent("Se borra al guardar");
    expect(within(within(back).getByRole("region", { name: "Opción 3 de 4" })).getByText("Se borra al guardar")).toBeInTheDocument();
    await user.click(within(back).getByRole("button", { name: "Restaurar" }));
    expect(within(back).queryByText("Se borra al guardar")).not.toBeInTheDocument();

    await user.click(within(back).getByRole("button", { name: "Agregar opción" }));
    expect(optionsOf(back)).toHaveLength(5);
    await user.click(within(back).getByRole("button", { name: "Quitar opción" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(optionsOf(back)).toHaveLength(4);
  });

  it("si «Guardar cambios» encuentra un error, el modal se abre en la primera opción con problemas y la lista la marca con el triángulo", async () => {
    serve(() => HttpResponse.json({
      code: "Forms.Catalog.DuplicateCode", status: 400, title: "Bad Request", errors: { "items.0.code": ["Ya está en la opción 1."] }, n: 1,
    }, { status: 400 }));
    const { user } = await openEditor();
    await user.clear(textbox("Código de Venta nueva"));
    await user.type(textbox("Código de Venta nueva"), "VTA");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    const option = within(dialog).getByRole("region", { name: "Opción 2 de 4" });
    expect(within(option).getByText("Ya está en la opción 1.")).toBeInTheDocument();
    const [seguimiento, venta] = optionsOf(dialog);
    expect(within(venta).getByTitle("Tiene un error")).toBeInTheDocument();
    expect(within(seguimiento).queryByTitle("Tiene un error")).not.toBeInTheDocument();
  });

  it("a 390 px ocupa la pantalla: ✎ abre la opción con «Volver a la lista», y la lista cierra con «Listo»", async () => {
    asPhone();
    const { user } = mountForms(formsOwner, path);
    await user.click(await screen.findByRole("button", { name: "Editar Venta nueva" }));
    const dialog = await screen.findByRole("dialog", { name: "Opción 2 de 4" });
    expect(within(dialog).getByText("Motivos de visita")).toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox", { name: "Texto" }), " al interior");
    await user.click(within(dialog).getByRole("button", { name: "Volver a la lista" }));
    expect(await screen.findByRole("dialog", { name: "Opciones" })).toBe(dialog);
    expect(optionsOf(dialog)).toHaveLength(4);
    await user.click(optionsOf(dialog)[3]);
    expect(screen.getByRole("dialog", { name: "Opción 4 de 4" })).toBe(dialog);
    await user.click(within(dialog).getByRole("button", { name: "Volver a la lista" }));
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Venta nueva al interior")).toBeInTheDocument();
  });
});
