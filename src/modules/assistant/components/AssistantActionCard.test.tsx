import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import { HttpResponse, delay, http } from "msw";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import es from "@/modules/assistant/locales/es/assistant.json";
import en from "@/modules/assistant/locales/en/assistant.json";
import commonEs from "@/locales/es/common.json";
import commonEn from "@/locales/en/common.json";
import errorsEs from "@/locales/es/errors.json";
import errorsEn from "@/locales/en/errors.json";
import formatEs from "@/locales/es/format.json";
import formatEn from "@/locales/en/format.json";
import type { AssistantMessageResponse } from "@/modules/assistant/api/types";
import { resetHttpClient } from "@/shared/api/httpClient";
import type { AssistantProposalResponse } from "@/shared/api/types";
import {
  AssistantActionRegistryProvider, AssistantProposalDialog, assistantActions, type AssistantActionAdapter,
} from "@/shared/assistant-actions";
import { server } from "@/test/mocks/server";
import { asPhone, cardData } from "@/test/utils/phone";
import { AssistantActionCard } from "./AssistantActionCard";

type MessageProposal = NonNullable<AssistantMessageResponse["proposal"]>;

const invite = (overrides: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse => ({
  id: "p-1", conversationId: "c-1", kind: "action", action: "users.invite", version: 1, state: "new",
  values: [
    { field: "email", value: "ana.lopez@delta.ejemplo.com" },
    { field: "roles", value: { op: "add", id: "r-1" }, label: "Ventas" },
    { field: "company", value: "co-1", label: "Delta S.A." },
    { field: "companyRoles", value: { op: "add", id: "cr-1" }, label: "Solo lectura" },
  ],
  ...overrides,
});

const editUser = (overrides: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse => ({
  id: "p-2", conversationId: "c-1", kind: "action", action: "users.edit", version: 1, state: "new",
  target: { id: "m-1", label: "Tomás Acosta", version: 3 },
  values: [
    { field: "roles", value: { op: "add", id: "r-1" }, label: "Ventas" },
    { field: "roles", value: { op: "remove", id: "r-2" }, label: "Recursos humanos" },
  ],
  ...overrides,
});

const removeUser = (overrides: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse => ({
  id: "p-3", conversationId: "c-1", kind: "action", action: "users.remove", version: 1, state: "new",
  target: { id: "m-2", label: "Martín Paz", version: 1, detail: "martin.paz@delta.ejemplo.com" }, values: [], ...overrides,
});

const removeRole = (overrides: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse => ({
  id: "p-4", conversationId: "c-1", kind: "action", action: "roles.remove", version: 1, state: "new",
  target: { id: "role-9", label: "Ventas mayoristas", version: 2 }, values: [], ...overrides,
});

const createRole = (overrides: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse => ({
  id: "p-5", conversationId: "c-1", kind: "action", action: "roles.create", version: 1, state: "new",
  values: [
    { field: "name", value: "Coordinación" },
    { field: "description", value: "Coordina a las personas de cada equipo." },
    { field: "scope", value: "organization", label: "Toda la organización" },
    { field: "permissions", value: { op: "add", id: "users.manage" }, label: "Administrar usuarios" },
    { field: "permissions", value: { op: "add", id: "companies.read" }, label: "Ver empresas" },
  ],
  ...overrides,
});

function InviteDialog({ onClose }: { readonly onClose: () => void }) {
  const location = useLocation();
  return <div role="dialog" aria-label="Invitar usuario">
    <p>{location.pathname}{location.search}</p>
    <button type="button" onClick={onClose}>{"Cancelar"}</button>
  </div>;
}

const adapters: AssistantActionAdapter[] = [
  { action: "users.invite@1", href: () => "/org/usuarios", Dialog: InviteDialog, appliedHref: () => "/org/usuarios", reviewHref: "/org/usuarios" },
  { action: "users.edit@1", href: (proposal) => `/org/usuarios/${proposal.target?.id}`, appliedHref: (proposal) => `/org/usuarios/${proposal.target?.id}` },
  { action: "users.remove@1", href: (proposal) => `/org/usuarios/${proposal.target?.id}` },
  { action: "roles.create@1", href: () => "/org/roles/nuevo", appliedHref: (proposal) => proposal.appliedLocation ?? undefined, reviewHref: "/org/roles" },
  { action: "roles.remove@1", href: () => "/org/roles" },
];

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}{location.search}</p>;
}

async function mount(proposal: AssistantProposalResponse, options: { language?: string; registry?: AssistantActionAdapter[]; respond?: () => Response | Promise<Response> } = {}) {
  server.use(http.get(`/api/organization/assistant/proposals/${proposal.id}`, options.respond ?? (() => HttpResponse.json(proposal))));
  const i18n = createInstance();
  await i18n.init({
    lng: options.language ?? "es", fallbackLng: false, defaultNS: "common",
    resources: {
      es: { assistant: es, common: commonEs, errors: errorsEs, format: formatEs },
      en: { assistant: en, common: commonEn, errors: errorsEn, format: formatEn },
    },
    interpolation: { escapeValue: false },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const summary: MessageProposal = { id: proposal.id, kind: proposal.kind, action: proposal.action, version: proposal.version, state: proposal.state };
  const view = (message: MessageProposal) => <I18nextProvider i18n={i18n}><QueryClientProvider client={client}>
    <AssistantActionRegistryProvider value={options.registry ?? adapters}>
      <MemoryRouter initialEntries={["/org"]}>
        <Routes>
          <Route path="/org" element={<main><p>{"Te preparé la propuesta."}</p><AssistantActionCard proposal={message} /><AssistantProposalDialog /><Where /></main>} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </AssistantActionRegistryProvider>
  </QueryClientProvider></I18nextProvider>;
  const result = render(view(summary));
  return { ...result, client, rerender: (message: MessageProposal) => result.rerender(view(message)) };
}

// La tarjeta ya leída: mientras carga ocupa su lugar con el mismo nombre y el aro.
const card = (name: string) => waitFor(() => {
  const found = screen.getByRole("group", { name });
  expect(within(found).queryByRole("status")).toBeNull();
  return found;
});

afterEach(() => resetHttpClient());

describe("AssistantActionCard", () => {
  it("nueva: cada dato con su nombre leído del servidor y el botón de la acción, sin ids", async () => {
    const app = await mount(invite());
    const found = await card("Invitación de usuario");

    expect(cardData(found)).toEqual([
      ["Correo", "ana.lopez@delta.ejemplo.com"],
      ["Roles de la organización", "Ventas"],
      ["Empresa", "Delta S.A."],
      ["Roles en la empresa", "Solo lectura"],
    ]);
    expect(within(found).getByRole("link", { name: "Revisar e invitar" })).toBeVisible();
    expect(found.textContent).not.toMatch(/r-1|co-1|cr-1/);
    expect(await axe(app.container)).toHaveNoViolations();
  });

  it("con «Revisá»: marca el valor dudoso y dice el motivo debajo; una clave sin texto deja solo la marca", async () => {
    const app = await mount(invite({
      values: [
        { field: "email", value: "ana.lopez@delta.ejemplo.com" },
        { field: "roles", value: { op: "add", id: "r-1" }, label: "Ventas", doubt: "Assistant.Action.Doubt.Similar" },
        { field: "company", value: "co-1", label: "Delta S.A.", doubt: "Assistant.Action.Doubt.Desconocida" },
      ],
    }));
    const found = await card("Invitación de usuario");

    expect(cardData(found)).toEqual([
      ["Correo", "ana.lopez@delta.ejemplo.com"],
      ["Roles de la organización", "VentasRevisá"],
      ["Motivo", "Hay más de una opción parecida."],
      ["Empresa", "Delta S.A.Revisá"],
    ]);
    expect(found.textContent).not.toContain("Assistant.Action");
    expect(await axe(app.container)).toHaveNoViolations();
  });

  it("un correo se parte después de la @ y antes de un punto del dominio, nunca en cualquier letra, también plegado", async () => {
    const app = await mount(removeUser());
    const found = await card("Quitar de la organización");
    const mail = [...found.querySelectorAll("dd")].find((dd) => dd.textContent === "martin.paz@delta.ejemplo.com");

    expect(mail?.innerHTML).toContain("martin.paz@<wbr>delta<wbr>.ejemplo<wbr>.com");
    app.unmount();

    await mount(invite({ state: "replaced" }));
    expect((await card("Invitación de usuario")).innerHTML).toContain("ana.lopez@<wbr>delta<wbr>.ejemplo<wbr>.com");
  });

  it("mientras lee la propuesta, la tarjeta ocupa su lugar con el aro, sin datos ni botón", async () => {
    const app = await mount(invite(), { respond: async () => { await delay("infinite"); return HttpResponse.json(invite()); } });
    const found = await screen.findByRole("group", { name: "Invitación de usuario" });

    expect(within(found).getByRole("status")).toHaveTextContent("Cargando…");
    expect(within(found).queryByRole("link")).toBeNull();
    expect(await axe(app.container)).toHaveNoViolations();
  });

  it("si no puede leer la propuesta, lo dice en su lugar con «Reintentar», y al reintentar se ve la tarjeta", async () => {
    let fail = true;
    const app = await mount(invite(), { respond: () => (fail ? HttpResponse.json({ traceId: "trace" }, { status: 500 }) : HttpResponse.json(invite())) });
    const failed = await card("Invitación de usuario");

    expect(await within(failed).findByRole("alert")).toHaveTextContent("Algo salió mal. Probá de nuevo en un rato.");
    expect(await axe(app.container)).toHaveNoViolations();

    fail = false;
    await userEvent.click(within(failed).getByRole("button", { name: "Reintentar" }));
    expect(await within(await card("Invitación de usuario")).findByRole("link", { name: "Revisar e invitar" })).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("editar: lo que se suma y lo que se quita, cada uno en su renglón, con la persona de ahora", async () => {
    await mount(editUser());
    const found = await card("Cambio de roles");

    expect(cardData(found)).toEqual([
      ["Persona", "Tomás Acosta"],
      ["Se suma en la organización", "Ventas"],
      ["Se quita en la organización", "Recursos humanos"],
    ]);
    expect(within(found).getByRole("link", { name: "Revisar cambios" })).toHaveAttribute("data-variant", "default");
  });

  it("quitar: la persona con su correo, que la distingue de otra con su nombre; editar nombra solo a la persona", async () => {
    const app = await mount(removeUser());
    const found = await card("Quitar de la organización");

    expect(cardData(found)).toEqual([
      ["Persona", "Martín Paz"],
      ["Correo", "martin.paz@delta.ejemplo.com"],
    ]);
    expect(await axe(app.container)).toHaveNoViolations();
    app.unmount();

    await mount(editUser({ target: { id: "m-1", label: "Tomás Acosta", version: 3, detail: "tomas.acosta@delta.ejemplo.com" } }));
    expect(cardData(await card("Cambio de roles"))[0]).toEqual(["Persona", "Tomás Acosta"]);
    expect(screen.queryByText("tomas.acosta@delta.ejemplo.com")).toBeNull();
  });

  it("crear un rol: varios permisos en un renglón, y el alcance con su nombre", async () => {
    await mount(createRole());
    const found = await card("Rol nuevo");

    expect(cardData(found)).toEqual([
      ["Nombre", "Coordinación"],
      ["Descripción", "Coordina a las personas de cada equipo."],
      ["Vale en", "Toda la organización"],
      ["Permisos", "Administrar usuarios,Ver empresas"],
    ]);
  });

  it.each([
    ["quitar", removeUser(), "Quitar de la organización", "Revisar y quitar"],
    ["dar de baja", removeRole(), "Baja de rol", "Revisar y dar de baja"],
  ])("%s lleva el botón rojo contorneado", async (_, proposal, name, button) => {
    const app = await mount(proposal);
    const found = await card(name);

    expect(within(found).getByRole("link", { name: button })).toHaveAttribute("data-variant", "danger");
    expect(await axe(app.container)).toHaveNoViolations();
  });

  it("reemplazada: plegada, con lo que nombra y sin botón", async () => {
    await mount(invite({ state: "replaced" }));
    const found = await card("Invitación de usuario");

    expect(found).toHaveTextContent("Invitación de usuarioana.lopez@delta.ejemplo.comReemplazada");
    expect(within(found).queryByRole("link")).toBeNull();
  });

  it.each([
    [editUser({ state: "unavailable", unavailableReason: "permission" }), "Cambio de roles", "Ya no tenés el permiso «Administrar usuarios»."],
    [removeUser({ state: "unavailable", unavailableReason: "target", target: null }), "Quitar de la organización", "La persona ya no está en la organización."],
    [editUser({ state: "unavailable", unavailableReason: "subject", target: null }), "Cambio de roles", "La cuenta de esa persona se dio de baja."],
    [createRole({ state: "unavailable", unavailableReason: "version" }), "Rol nuevo", "Es de una versión anterior. Pedila de nuevo."],
    [removeRole({ state: "unavailable", unavailableReason: "module" }), "Baja de rol", "Esa función ya no está habilitada en tu organización."],
  ])("ya no disponible, con su motivo: %#", async (proposal, name, reason) => {
    const app = await mount(proposal);
    const found = await card(name);

    expect(found).toHaveTextContent("Ya no disponible");
    expect(found).toHaveTextContent(reason);
    expect(within(found).queryByRole("link")).toBeNull();
    expect(await axe(app.container)).toHaveNoViolations();
  });

  it.each([
    [invite({ state: "applied" }), "Invitación de usuario", "Invitación enviada", "Ver en Usuarios", "/org/usuarios"],
    [editUser({ state: "applied" }), "Cambio de roles", "Roles cambiados", "Ver la ficha", "/org/usuarios/m-1"],
    [createRole({ state: "applied", appliedLocation: "/org/roles/role-7" }), "Rol nuevo", "Rol creado", "Ver el rol", "/org/roles/role-7"],
  ])("aplicada: se pliega con el enlace a lo hecho: %#", async (proposal, name, tag, link, to) => {
    const app = await mount(proposal);
    const found = await card(name);

    expect(found).toHaveTextContent(tag);
    expect(within(found).getByRole("link", { name: link })).toHaveAttribute("href", to);
    expect(await axe(app.container)).toHaveNoViolations();
  });

  it("aplicada sin nada que ver (quitar) se pliega sin enlace", async () => {
    await mount(removeUser({ state: "applied", target: null }));
    const found = await card("Quitar de la organización");

    expect(found).toHaveTextContent("Quitado");
    expect(within(found).queryByRole("link")).toBeNull();
  });

  it("sin confirmar: plegada, con el enlace al listado para revisarlo", async () => {
    const app = await mount(invite({ state: "unconfirmed" }));
    const found = await card("Invitación de usuario");

    expect(found).toHaveTextContent("Sin confirmar");
    expect(within(found).getByRole("link", { name: "Revisar en Usuarios" })).toHaveAttribute("href", "/org/usuarios");
    expect(await axe(app.container)).toHaveNoViolations();
  });

  it("vuelve a leer la propuesta cuando el mensaje trae otro estado", async () => {
    let state: AssistantProposalResponse["state"] = "new";
    const app = await mount(invite());
    await card("Invitación de usuario");
    server.use(http.get("/api/organization/assistant/proposals/p-1", () => HttpResponse.json(invite({ state }))));

    state = "replaced";
    app.rerender({ id: "p-1", kind: "action", action: "users.invite", version: 1, state: "replaced" });

    await waitFor(() => expect(screen.getByRole("group", { name: "Invitación de usuario" })).toHaveTextContent("Reemplazada"));
  });

  it("con el teclado, el botón de una página lleva a la pantalla de la acción con ?proposal", async () => {
    const user = userEvent.setup();
    await mount(editUser());
    const link = within(await card("Cambio de roles")).getByRole("link", { name: "Revisar cambios" });

    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("where")).toHaveTextContent("/org/usuarios/m-1?proposal=p-2");
  });

  it("con el teclado, el de un diálogo lo abre sobre el Inicio, y cerrarlo deja el Inicio como estaba", async () => {
    const user = userEvent.setup();
    await mount(invite());
    const link = within(await card("Invitación de usuario")).getByRole("link", { name: "Revisar e invitar" });

    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    expect(dialog).toHaveTextContent("/org?proposal=p-1");
    expect(screen.getByText("Te preparé la propuesta.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/org$/);
  });

  it("sin adaptador para la acción, la tarjeta se ve sin botón", async () => {
    await mount(invite(), { registry: [] });
    const found = await card("Invitación de usuario");

    expect(cardData(found)).toHaveLength(4);
    expect(within(found).queryByRole("link")).toBeNull();
  });

  it("en el teléfono, el botón va abajo, entero", async () => {
    const restore = asPhone();
    try {
      const app = await mount(invite());
      const found = await card("Invitación de usuario");
      const link = within(found).getByRole("link", { name: "Revisar e invitar" });

      expect(found.lastElementChild).toContainElement(link);
      expect(link).toHaveAttribute("data-size", "lg");
      expect(link.className).toContain("w-full");
      expect(await axe(app.container)).toHaveNoViolations();
    } finally {
      restore();
    }
  });

  it("en inglés", async () => {
    await mount(createRole({ state: "unconfirmed" }), { language: "en" });
    const found = await card("New role");

    expect(found).toHaveTextContent("Unconfirmed");
    expect(within(found).getByRole("link", { name: "Review in Roles" })).toHaveAttribute("href", "/org/roles");
  });
});

describe("los textos de la tarjeta", () => {
  type Texts = Record<string, unknown>;
  const lookup = (resources: Texts, path: string): unknown => path.split(".").reduce<unknown>((node, key) => (node as Texts | undefined)?.[key], resources);

  it.each([["es", es], ["en", en]] as const)("cada acción del contrato tiene su nombre, su botón, su estado aplicado y cada campo en %s", (_, resources) => {
    const missing = assistantActions.flatMap((action) => {
      const base = `actionCard.actions.${action.id}`;
      const keys = ["name", "open", "applied", "noPermission"];
      if (action.target) keys.push("target", "noTarget");
      if (action.kind === "create") keys.push("reviewLink");
      for (const field of action.fields) {
        if (field.type === "choices" && action.kind === "edit") keys.push(`fields.${field.name}Added`, `fields.${field.name}Removed`);
        else keys.push(`fields.${field.name}`);
      }
      return keys.map((key) => `${base}.${key}`).filter((key) => typeof lookup(resources, key) !== "string");
    });
    expect(missing).toEqual([]);
  });
});
