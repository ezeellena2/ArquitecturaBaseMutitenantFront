import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { StrictMode } from "react";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { decodeAssistantStream } from "@/modules/assistant/api/stream";
import { fixtureAuth } from "./mocks/authContext";
import { server } from "./mocks/server";
import { asPhone } from "./utils/phone";
import { chatScenario, configurationScenario, galleryMe, galleryStream, galleryStreamEvents, type GalleryApp } from "./etapa8bVisualFixtures";

beforeAll(async () => { await import("@/modules/assistant/settings/OrganizationAssistantSettingsPage"); await import("@/modules/assistant/settings/PlatformAssistantSettingsPage"); await import("@/modules/assistant/pages/RegisteredAssistant"); });
beforeEach(() => { Element.prototype.scrollTo = vi.fn(); });
const chatBoards = ["Asistente-Org", "Asistente-Personal", "Asistente-Plat", "M-Asistente-Org", "M-Asistente-Personal", "M-Asistente-Plat"];

function mount(app: GalleryApp) {
  const calls: string[] = []; const completed = new Set<string>();
  server.use(http.all("/api/*", ({ request }) => {
    const url = new URL(request.url); calls.push(`${request.method} ${url.pathname}`);
    const response = app.responses.find((item) => item.method === request.method && item.path === url.pathname && (!item.afterResponse || completed.has(`${item.afterResponse.method} ${item.afterResponse.path}`))
      && Object.entries(item.query ?? {}).every(([key, value]) => url.searchParams.get(key) === value));
    if (!response) throw new Error(`Fixture sin ruta ${request.method} ${url.pathname}`);
    completed.add(`${response.method} ${response.path}`);
    return response.rawBody === undefined ? new HttpResponse(JSON.stringify(response.body), { status: response.status, headers: { "Content-Type": "application/json" } })
      : new HttpResponse(response.rawBody, { status: response.status, headers: { "Content-Type": response.contentType! } });
  }));
  const route = new URL(app.path, "http://localtest.me:5192").searchParams.get("route")!;
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const result = render(<StrictMode><AppProviders client={client} authContext={fixtureAuth(app.userFixture)}><RouterProvider router={router} /></AppProviders></StrictMode>);
  return { ...result, calls, client, user: userEvent.setup() };
}
async function actions(app: GalleryApp, user: ReturnType<typeof userEvent.setup>) {
  for (const action of app.actions) {
    const target = action.label ? await screen.findByLabelText(action.label, { exact: false }) : await screen.findByRole(action.role!, { name: action.name });
    if (action.type === "click") await user.click(target);
    else if (action.type === "press") { target.focus(); await user.keyboard(`{${action.key}}`); }
    else fireEvent.change(target, { target: { value: action.value } });
  }
  await waitFor(() => expect(document.querySelector(app.readySelector)).toBeVisible());
  if (app.readyText) await screen.findByText((_, node) => node?.textContent?.includes(app.readyText!) === true && ![...node.children].some((child) => child.textContent?.includes(app.readyText!)));
}

it("todos los eventos SSE tipados los decodifica el codec real", async () => {
  const events = [];
  for await (const event of decodeAssistantStream(new Response(galleryStream, { headers: { "Content-Type": "text/event-stream" } }))) events.push(event);
  expect(events).toEqual(galleryStreamEvents);
});

it.each(chatBoards)("%s Primera vez mantiene el aviso y espera un selector real sin aceptarlo", async (board) => {
  const restore = board.startsWith("M-") ? asPhone() : () => {};
  try {
    const app = chatScenario(board, "Primera vez")!; const mounted = mount(app);
    await actions(app, mounted.user);
    expect(screen.getByRole("dialog", { name: "Antes de tu primera consulta" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Entendido" })).toBeVisible();
    expect(app.actions).toHaveLength(0);
    expect(mounted.calls.some((call) => call.startsWith("POST"))).toBe(false);
    expect(screen.getByRole("button", { name: "Enviar", hidden: true })).toBeDisabled();
  } finally { restore(); }
});

it.each(chatBoards.flatMap((board) => ["Quedan 10 consultas", "Tope del día"].map((state) => ({ board, state }))))("$board $state selecciona conversación real y conserva historial y saldo", async ({ board, state }) => {
  const restore = board.startsWith("M-") ? asPhone() : () => {};
  try {
    const app = chatScenario(board, state)!; const mounted = mount(app);
    await actions(app, mounted.user);
    expect(screen.getByRole("group", { name: "Asistente" })).toBeVisible();
    expect(screen.getByText("de prueba", { selector: "strong" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "¿Qué querés consultar?" })).not.toBeInTheDocument();
    expect(mounted.calls.some((call) => call.endsWith("/conversations/gallery-chat"))).toBe(true);
    expect(mounted.calls.some((call) => call.startsWith("POST"))).toBe(false);
    if (state === "Tope del día") expect(screen.queryByRole("button", { name: "Enviar" })).not.toBeInTheDocument();
    else expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
  } finally { restore(); }
});

it("Sin configurar de otro rol conserva use y no ofrece configuración", async () => {
  const me = galleryMe("business", false);
  expect(me.organizations.find((organization) => organization.id === me.activeTenantId)?.roleName).toBe("Miembro");
  expect(me.effectivePermissions.organization).toEqual(["assistant.use"]);
  const app = chatScenario("Asistente-Org", "Sin configurar (otro rol)")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.queryByRole("button", { name: "Revisar configuración" })).not.toBeInTheDocument();
});

it.each(["Asistente-Config-Org", "Plat-Asistente-Config"])("%s rechaza clave ficticia mediante PUT real y borra el password", async (board) => {
  const app = configurationScenario(board, "Clave rechazada")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(mounted.calls).toContain(`PUT /api/${board.startsWith("Plat") ? "platform" : "organization"}/assistant/settings`);
  expect(screen.getByLabelText(board.startsWith("Plat") ? "Clave de la plataforma" : "Clave de Anthropic", { exact: false })).toHaveValue("");
  const caches = JSON.stringify({ query: mounted.client.getQueryCache().getAll().map((item) => item.state), mutations: mounted.client.getMutationCache().getAll().map((item) => item.state) });
  expect(caches).not.toContain("e8b-fictitious-write-only-key");
});

it("selector real de organización abre modelos sin pedir Chat State", async () => {
  const app = configurationScenario("Asistente-Config-Org", "Elegir el modelo")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByRole("option", { name: "Modelo de prueba B" })).toBeVisible();
  expect(mounted.calls).not.toContain("GET /api/organization/assistant");
});

it.each(["Asistente-Config-Org", "Plat-Asistente-Config"])("%s cambia por controles reales y deja el aviso de borrador", async (board) => {
  const app = configurationScenario(board, "Cambios sin guardar")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
});

it("Plataforma abre los modelos permitidos con su capability y tarifas", async () => {
  const app = configurationScenario("Plat-Asistente-Config", "Elegir los modelos permitidos")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByRole("menuitemcheckbox", { name: "Modelo de prueba A" })).toHaveAccessibleDescription("Entrada USD 0,13 · salida USD 1,00 por millón de tokens");
});

it("Catálogo real abre Agregar modelo en un diálogo", async () => {
  const app = configurationScenario("Plat-Asistente-Config", "Agregar un modelo")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByRole("dialog", { name: "Agregar modelo" })).toBeVisible();
  expect(screen.getByRole("textbox", { name: "Precio de entrada por millón" })).toBeVisible();
});

it.each(["Asistente-Config-Org", "M-Asistente-Config-Org"])("%s sin destinatario muestra política y campo de clave nueva sin máscara guardada", async (board) => {
  const restore = board.startsWith("M-") ? asPhone() : () => {};
  try {
    const app = configurationScenario(board, "La nuestra: ningún Dueño con correo verificado")!; const mounted = mount(app);
    await actions(app, mounted.user);
    expect(screen.getByRole("alert")).toHaveTextContent("algún Dueño tiene que tener un correo verificado");
    expect(screen.getByRole("link", { name: "Agregar o verificar un correo" })).toBeVisible();
    expect(screen.getByLabelText("Clave de Anthropic", { exact: false })).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Clave de Anthropic", { exact: false })).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Cambiar" })).not.toBeInTheDocument();
  } finally { restore(); }
});

it.each(["Asistente-Org", "M-Asistente-Personal", "Asistente-Plat"])("%s consume el stream y relee el DTO durable mediante acciones reales", async (board) => {
  const restore = board.startsWith("M-") ? asPhone() : () => {};
  try {
    const app = chatScenario(board, "Respuesta")!; const mounted = mount(app);
    await actions(app, mounted.user);
    expect(screen.getByText("de prueba", { selector: "strong" })).toBeVisible();
    expect(mounted.calls.filter((call) => call.includes("POST") && call.endsWith("/messages"))).toHaveLength(1);
  } finally { restore(); }
});
