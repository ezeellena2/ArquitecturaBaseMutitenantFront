import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { pickerName } from "@/test/picker";
import { asPhone, cardData } from "@/test/utils/phone";
import type { FormCatalogRow } from "../api/types";
import { formsMember, formsOwner, formsReader, mountForms } from "../test/support";

const listPath = "/org/formularios/catalogos";
/** Una opción de la pieza con su descripción debajo: su texto empieza por el nombre. */
const startsWith = (label: string) => expect.stringMatching(new RegExp(`^${label}`));
const row = (id: string, name: string, extra: Partial<FormCatalogRow> = {}): FormCatalogRow =>
  ({ id, name, source: "Manual", valueType: "Text", optionsCount: 4, isActive: true, usable: true, ...extra });
// Tablero FRM-Catalogos: los siete catálogos de «Todos».
const catalogs: FormCatalogRow[] = [
  row("c-clientes", "Clientes", { source: "Contacts", optionsCount: null }),
  row("c-depositos", "Depósitos", { isActive: false }),
  row("c-motivos", "Motivos de visita"),
  row("c-proveedores", "Proveedores", { optionsCount: 1097 }),
  row("c-recargo", "Recargo por zona", { valueType: "DecimalNumber", optionsCount: 6 }),
  row("c-responsables", "Responsables de obra", { source: "Members", optionsCount: null, usable: false, unusableReason: "RoleMissing" }),
  row("c-supervisores", "Supervisores", { source: "Members", optionsCount: 7 }),
];
const paged = (items: FormCatalogRow[], totalCount = items.length) =>
  ({ items, page: 1, pageSize: 10, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / 10)), hasPrevious: false, hasNext: totalCount > 10 });

const counts = vi.fn((_url: URL) => HttpResponse.json({ all: 7, active: 6 }));
let requests: URL[] = [];
function serve(items: (url: URL) => FormCatalogRow[] | Response = () => catalogs) {
  requests = [];
  server.use(
    http.get("/api/organization/forms/catalogs", ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      const result = items(url);
      return result instanceof Response ? result : HttpResponse.json(paged(result));
    }),
    http.get("/api/organization/forms/catalogs/filter-counts", ({ request }) => counts(new URL(request.url))),
  );
}

beforeAll(async () => { await import("./CatalogsPage"); await import("./CatalogEditorPage"); });
beforeEach(() => {
  counts.mockClear();
  server.use(http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: null })));
});

describe("Catálogos", () => {
  it("muestra el resumen de filter-counts y lleva «Origen» y «Estado», en la pieza y sin cantidades, a la URL y a la consulta", async () => {
    serve();
    const { container, router, user } = mountForms(formsOwner, listPath);

    expect(await screen.findByRole("heading", { level: 1, name: "Catálogos" })).toBeVisible();
    // 262: el resumen sale de filter-counts, que se pide una vez, sin la búsqueda ni los filtros.
    expect(await screen.findByText("7 catálogos")).toBeVisible();
    expect(screen.getByText("6 activos")).toBeVisible();
    expect(await screen.findByRole("link", { name: "Proveedores" })).toHaveAttribute("href", `${listPath}/c-proveedores`);
    expect(screen.getByRole("cell", { name: "1.097" })).toBeVisible();
    // Uno con filtros no tiene tipo de valor, y uno de contactos o que no se puede usar no cuenta opciones: «—».
    const clientes = screen.getByRole("link", { name: "Clientes" }).closest("tr")!;
    expect(within(clientes).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["Clientes", "De los contactos de WhatsApp", "—", "—", "Activo"]);
    expect(within(screen.getByRole("link", { name: "Recargo por zona" }).closest("tr")!).getByText("Número decimal")).toBeVisible();
    expect(within(screen.getByRole("link", { name: "Depósitos" }).closest("tr")!).getByText("De baja")).toBeVisible();
    const responsables = screen.getByRole("link", { name: "Responsables de obra" }).closest("tr")!;
    expect(within(responsables).getByText("No se puede usar")).toBeVisible();
    expect(within(responsables).getByRole("img", { name: "Un rol de los filtros ya no existe." })).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: /Lo usan/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nuevo catálogo" })).toHaveAttribute("href", `${listPath}/nuevo`);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Origen: todos" }));
    const sources = await screen.findByRole("listbox");
    expect(within(sources).getAllByRole("option").map((option) => option.textContent)).toEqual(["Todos los orígenes", "Escritas a mano", "De los miembros", "De los contactos de WhatsApp"]);
    await user.click(within(sources).getByRole("option", { name: "De los miembros" }));
    await waitFor(() => expect(router.state.location.search).toContain("source=Members"));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("source")).toBe("Members"));

    await user.click(screen.getByRole("button", { name: "Estado: todos" }));
    const statuses = await screen.findByRole("listbox");
    expect(within(statuses).getAllByRole("option").map((option) => option.textContent)).toEqual(["Todos los estados", "Activos", "Dados de baja"]);
    await user.click(within(statuses).getByRole("option", { name: "Dados de baja" }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("status")).toBe("Inactive"));
    expect(requests.at(-1)?.searchParams.get("source")).toBe("Members");
    expect(router.state.location.search).toContain("status=Inactive");
    expect(counts).toHaveBeenCalledTimes(1);
    expect([...counts.mock.calls[0]![0].searchParams.keys()]).toEqual([]);
  });

  // 264: el orden de siempre es el nombre; el encabezado y «Ordenar por» mueven el mismo orden y vuelven a la página 1.
  it("ordena desde el encabezado y desde «Ordenar por», y vuelve a la página 1", async () => {
    serve();
    const { router, user } = mountForms(formsOwner, `${listPath}?page=2`);
    await screen.findByRole("link", { name: "Proveedores" });
    expect(requests.at(-1)?.searchParams.get("sort")).toBe("name");
    expect(requests.at(-1)?.searchParams.get("page")).toBe("2");
    expect(screen.getByRole("button", { name: "Ordenar por: Catálogo, de la A a la Z" })).toBeInTheDocument();

    // Las opciones, de mayor a menor al primer toque.
    await user.click(screen.getByRole("button", { name: "Opciones" }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("sort")).toBe("-optionsCount"));
    expect(requests.at(-1)?.searchParams.get("page")).toBe("1");
    expect(router.state.location.search).toContain("sort=-optionsCount");
    expect(router.state.location.search).not.toContain("page=2");
    expect(screen.getByRole("button", { name: "Ordenar por: Opciones, de mayor a menor" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ordenar por: Opciones, de mayor a menor" }));
    const piece = await screen.findByRole("dialog", { name: "Ordenar por" });
    await user.click(within(piece).getByRole("button", { name: /^Columna/ }));
    const columns = await screen.findByRole("listbox", { name: "Columna" });
    expect(within(columns).getAllByRole("option").map((option) => option.textContent)).toEqual(["Catálogo", "De dónde salen", "Tipo de valor", "Opciones", "Estado"]);
    await user.click(within(columns).getByRole("option", { name: "Estado" }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("sort")).toBe("status"));
    expect(router.state.location.search).toContain("sort=status");
  });

  it("vacío, sin coincidencias y con error dicen cada uno lo suyo", async () => {
    counts.mockImplementationOnce(() => HttpResponse.json({ all: 0, active: 0 }));
    serve(() => []);
    const view = mountForms(formsOwner, listPath);
    expect(await screen.findByText("Todavía no hay catálogos.")).toBeVisible();
    expect(await screen.findByText("Sin catálogos")).toBeVisible();
    view.unmount();

    serve((url) => url.searchParams.get("search") ? [] : catalogs);
    const filtered = mountForms(formsOwner, `${listPath}?search=herramientas`);
    expect(await screen.findByText("Ningún catálogo coincide con los filtros.")).toBeVisible();
    await filtered.user.click(screen.getAllByRole("button", { name: "Limpiar filtros" }).at(-1)!);
    expect(await screen.findByRole("link", { name: "Proveedores" })).toBeVisible();
    filtered.unmount();

    serve(() => HttpResponse.json({ status: 500, title: "Error" }, { status: 500 }));
    const failed = mountForms(formsOwner, listPath);
    expect(await screen.findByText("No pudimos cargar los catálogos.")).toBeVisible();
    expect(screen.getByText("Algo salió mal. Probá de nuevo en un rato.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeVisible();
    failed.unmount();

    // Un límite de uso: «Reintentar» espera la cuenta del Retry-After (errores, P2).
    serve(() => HttpResponse.json({ status: 429, code: "Security.RateLimit.Exceeded", title: "Too Many Requests", detail: "Hiciste muchos pedidos." }, { status: 429, headers: { "Retry-After": "41" } }));
    mountForms(formsOwner, listPath);
    expect(await screen.findByRole("button", { name: /^Reintentá en 0:4\d$/ })).toBeDisabled();
  });

  it("con solo «Ver catálogos» no ofrece «Nuevo catálogo»", async () => {
    serve();
    mountForms(formsReader, listPath);
    expect(await screen.findByRole("link", { name: "Proveedores" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Nuevo catálogo" })).not.toBeInTheDocument();
  });

  it("a 390 px cada catálogo es una tarjeta, con la lupa, «Filtros» y el «+» para uno nuevo", async () => {
    asPhone();
    serve();
    const { container } = mountForms(formsOwner, listPath);
    const card = await screen.findByRole("link", { name: /Responsables de obra/ });
    expect(card).toHaveAttribute("href", `${listPath}/c-responsables`);
    expect(cardData(card.closest("li")!).map(([label]) => label)).toEqual(["De dónde salen", "Opciones", "Estado"]);
    expect(screen.getByRole("button", { name: "Buscar por nombre" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Filtros de catálogos" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Nuevo catálogo" })).toHaveAttribute("href", `${listPath}/nuevo`);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Nuevo catálogo", () => {
  // 262: «Nuevo catálogo» abre el editor, sin un diálogo que solo sirve para elegir; el origen y el tipo van en la pieza.
  it("abre el editor, donde se eligen el origen y el tipo de valor en la pieza", async () => {
    serve();
    const { container, router, user } = mountForms(formsOwner, listPath);
    await user.click(await screen.findByRole("link", { name: "Nuevo catálogo" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Nuevo catálogo" })).toBeVisible();
    expect(router.state.location.pathname).toBe(`${listPath}/nuevo`);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const source = screen.getByRole("button", { name: pickerName("De dónde salen las opciones") });
    expect(source).toHaveTextContent("Escritas a mano");
    await user.click(screen.getByRole("button", { name: pickerName("Tipo de valor") }));
    const types = await screen.findByRole("listbox");
    expect(within(types).getAllByRole("option").map((option) => option.textContent)).toEqual(["Texto", "Número entero", "Número decimal", "Fecha"]);
    await user.click(within(types).getByRole("option", { name: "Fecha" }));
    expect(screen.getByRole("button", { name: pickerName("Tipo de valor") })).toHaveTextContent("Fecha");

    await user.click(source);
    const origins = await screen.findByRole("listbox");
    expect(within(origins).getAllByRole("option").map((option) => option.textContent)).toEqual(["Escritas a mano", "De los miembros", "De los contactos de WhatsApp"].map(startsWith));
    expect(within(origins).getByText("Se arma sola con los contactos de Clientes, por etiqueta.")).toBeVisible();
    await user.click(within(origins).getByRole("option", { name: /De los miembros/ }));
    // Uno con filtros es siempre de texto: el tipo de valor no se elige.
    expect(screen.getByRole("button", { name: pickerName("De dónde salen las opciones") })).toHaveTextContent("De los miembros");
    expect(screen.queryByRole("button", { name: pickerName("Tipo de valor") })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sin WhatsApp no se ofrece el origen de contactos", async () => {
    const { user } = mountForms(formsMember(["formcatalogs.read", "formcatalogs.manage"], ["forms"]), `${listPath}/nuevo`);
    await user.click(await screen.findByRole("button", { name: pickerName("De dónde salen las opciones") }));
    const origins = await screen.findByRole("listbox");
    expect(within(origins).getAllByRole("option").map((option) => option.textContent)).toEqual(["Escritas a mano", "De los miembros"].map(startsWith));
    expect(within(origins).queryByText(/contactos/)).not.toBeInTheDocument();
  });
});
