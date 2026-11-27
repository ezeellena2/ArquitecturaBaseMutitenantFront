import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { AssistantProposalResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import type { FormCatalogItemRow, FormCatalogResponse, UpdateFormCatalogRequest } from "../api/types";
import { formsOwner, mountForms } from "../test/support";

// FRM-Catalogo-Opciones-Propuesta y su M-: el editor abierto desde una propuesta del asistente (catalogoptions.edit@1).
const base = "/api/organization/forms/catalogs";
const proposalUrl = "/api/organization/assistant/proposals/p-1";
const path = "/org/formularios/catalogos/c-motivos?proposal=p-1";
const catalog = (extra: Partial<FormCatalogResponse> = {}): FormCatalogResponse => ({
  id: "c-motivos", name: "Motivos de visita", description: "Por qué se visita a un cliente.", source: "Manual", valueType: "Text",
  isActive: true, usable: true, canManage: true, itemCounts: { total: 4, active: 4 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 7, ...extra,
});
const item = (id: string, position: number, text: string, code: string, detail: string): FormCatalogItemRow =>
  ({ id, position, text, code, detail, value: null, isActive: true, textRepeated: false });
const motivos = [
  item("i-seg", 1, "Seguimiento", "SEG", "Visita programada a un cliente actual"),
  item("i-ven", 2, "Venta nueva", "VEN", "Primera visita a un cliente"),
  item("i-vma", 3, "Venta mayorista", "VMA", "Visita a un cliente que compra por mayor"),
  item("i-rec", 4, "Reclamo", "REC", "Hay un problema para resolver"),
];
// Una opción de otra página: la propuesta la cambia y se ve igual.
const lejana = item("i-pos", 11, "Posventa", "POS", "Después de la venta");

function proposal(extra: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse {
  return {
    id: "p-1", conversationId: "c-1", kind: "action", action: "catalogoptions.edit", version: 1, state: "new",
    target: { id: "c-motivos", label: "Motivos de visita", version: 7 }, baseVersion: 7,
    values: [
      { field: "options", value: { op: "add", key: "GAR", row: { code: "GAR", text: "Garantía", detail: "Revisar un equipo en garantía" } } },
      { field: "options", value: { op: "add", key: "INS", row: { code: "INS", text: "Instalación", detail: "Instalar un equipo vendido" } } },
      { field: "options", value: { op: "change", key: "i-ven", row: { detail: "Primera visita a un cliente nuevo" } }, label: "Venta nueva", doubt: "Assistant.Action.Doubt.Similar" },
      { field: "options", value: { op: "remove", key: "i-rec" }, label: "Reclamo" },
    ],
    ...extra,
  };
}

let puts: UpdateFormCatalogRequest[] = [];
let applied: unknown[] = [];
function serve(response: AssistantProposalResponse = proposal(), detail = catalog()) {
  puts = [];
  applied = [];
  server.use(
    http.get(`${base}/c-motivos`, () => HttpResponse.json(detail)),
    http.get(`${base}/c-motivos/items`, ({ request }) => {
      const search = new URL(request.url).searchParams.get("search")?.toLowerCase();
      const items = search ? [...motivos, lejana].filter((row) => row.text.toLowerCase().includes(search) || row.code.toLowerCase().includes(search)) : motivos;
      return HttpResponse.json({ items, page: 1, pageSize: search ? 100 : 10, totalCount: search ? items.length : 11, totalPages: search ? 1 : 2, hasPrevious: false, hasNext: !search });
    }),
    http.put(`${base}/c-motivos`, async ({ request }) => {
      puts.push(await request.json() as UpdateFormCatalogRequest);
      return HttpResponse.json({ version: 8, itemIdentityMap: [{ localId: "proposal-GAR", itemId: "i-gar" }, { localId: "proposal-INS", itemId: "i-ins" }] });
    }),
    http.get(proposalUrl, () => HttpResponse.json(response)),
    http.post(`${proposalUrl}/applied`, async ({ request }) => {
      applied.push(await request.json());
      return HttpResponse.json(proposal({ state: "applied" }));
    }),
  );
}

async function openProposal() {
  const mounted = mountForms(formsOwner, path);
  await screen.findByRole("textbox", { name: "Texto de Garantía" });
  return mounted;
}

const changes = () => within(screen.getByRole("table", { name: "Lo que cambia" }));
const saveButton = () => screen.getByRole("button", { name: "Guardar cambios" });

beforeAll(async () => { await import("./CatalogEditorPage"); });

describe("la propuesta del asistente en el editor de un catálogo (FRM-Catalogo-Opciones-Propuesta)", () => {
  it("todo lo propuesto se ve: la marca, «Lo que cambia» con lo que se suma, cambia y quita, las filas cargadas sin guardar y «Revisá»", async () => {
    serve();
    const { container } = await openProposal();
    expect(screen.getByText("Propuesta del asistente")).toBeInTheDocument();
    const [, row] = changes().getAllByRole("row");
    const [added, changed, removed] = within(row).getAllByRole("cell");
    expect(added).toHaveTextContent("Garantía,Instalación");
    expect(changed).toHaveTextContent("Detalle de Venta nuevaRevisá");
    expect(removed).toHaveTextContent("Reclamo");
    expect(screen.getByRole("textbox", { name: "Detalle de Instalación" })).toHaveValue("Instalar un equipo vendido");
    expect(screen.getByRole("textbox", { name: "Detalle de Venta nueva" })).toHaveValue("Primera visita a un cliente nuevo");
    expect(screen.getByText("Se borra al guardar")).toBeInTheDocument();
    expect(screen.getByText("Hay más de una opción parecida.")).toBeInTheDocument();
    expect(screen.queryByText(/cambió desde la propuesta/)).not.toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("se manda lo que se ve, con lo que la persona cambió después, y la propuesta pasa a aplicada con la versión nueva", async () => {
    serve();
    const { user } = await openProposal();
    const text = screen.getByRole("textbox", { name: "Texto de Instalación" });
    await user.clear(text);
    await user.type(text, "Instalación nueva");
    expect(changes().getAllByRole("cell")[0]).toHaveTextContent("Garantía,Instalación nueva");
    await user.click(saveButton());
    await waitFor(() => expect(applied).toEqual([{ version: 8 }]));
    expect(puts).toHaveLength(1);
    expect(puts[0]).toEqual({
      version: 7, isActive: true, name: "Motivos de visita", description: "Por qué se visita a un cliente.",
      items: [
        { itemId: "i-ven", code: "VEN", text: "Venta nueva", detail: "Primera visita a un cliente nuevo", value: null, isActive: true },
        { localId: "proposal-GAR", code: "GAR", text: "Garantía", detail: "Revisar un equipo en garantía", value: null, isActive: true },
        { localId: "proposal-INS", code: "INS", text: "Instalación nueva", detail: "Instalar un equipo vendido", value: null, isActive: true },
      ],
      deleteItems: ["i-rec"],
    });
    await waitFor(() => expect(screen.queryByText("Propuesta del asistente")).not.toBeInTheDocument());
  });

  it("una opción de otra página que cambia se ve en la tabla y viaja en el guardado", async () => {
    serve(proposal({ values: [{ field: "options", value: { op: "change", key: "i-pos", row: { text: "Posventa técnica" } }, label: "Posventa" }] }));
    const { user } = mountForms(formsOwner, path);
    expect(await screen.findByRole("textbox", { name: "Texto de Posventa técnica" })).toBeInTheDocument();
    expect(changes().getAllByRole("cell")[1]).toHaveTextContent("Texto de Posventa");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0].items).toEqual([{ itemId: "i-pos", code: "POS", text: "Posventa técnica", detail: "Después de la venta", value: null, isActive: true }]);
  });

  it("si el catálogo cambió desde la propuesta, lo dice arriba", async () => {
    serve(proposal({ baseVersion: 6 }));
    await openProposal();
    expect(screen.getByText("El catálogo Motivos de visita cambió desde la propuesta.")).toBeInTheDocument();
  });

  it("«Descartar» vuelve a lo guardado y descarta la propuesta", async () => {
    serve();
    const { user, router } = await openProposal();
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(screen.queryByText("Propuesta del asistente")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Texto de Garantía" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Detalle de Venta nueva" })).toHaveValue("Primera visita a un cliente");
  });

  it("una propuesta de otro catálogo no se abre: el editor sigue como siempre", async () => {
    serve(proposal({ target: { id: "c-otro", label: "Otro", version: 1 } }));
    mountForms(formsOwner, path);
    await screen.findByRole("textbox", { name: "Texto de Seguimiento" });
    expect(screen.queryByText("Propuesta del asistente")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Texto de Garantía" })).not.toBeInTheDocument();
  });
});
