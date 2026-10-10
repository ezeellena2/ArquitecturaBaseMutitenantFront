import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { StrictMode } from "react";
import { File as FetchFile } from "node:buffer";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { decodeAssistantStream } from "@/modules/assistant/api/stream";
import { fixtureAuth } from "./mocks/authContext";
import { server } from "./mocks/server";
import { asPhone } from "./utils/phone";
import { galleryUploadBytes } from "./galleryUploadFiles";
import type { AssistantAttachmentSummaryResponse, AssistantConversationResponse } from "@/shared/api/types";
import { chatScenario, configurationScenario, galleryConversation, galleryMe, galleryMonthlyLimitProbe, galleryOversizedAttachmentProbe, galleryStream, galleryStreamEvents, type GalleryApp } from "./etapa8bVisualFixtures";

beforeAll(async () => { await import("@/modules/assistant/settings/OrganizationAssistantSettingsPage"); await import("@/modules/assistant/settings/PlatformAssistantSettingsPage"); await import("@/modules/assistant/pages/RegisteredAssistant"); });
beforeEach(() => { Element.prototype.scrollTo = vi.fn(); URL.createObjectURL = vi.fn(() => "blob:gallery-fixture"); URL.revokeObjectURL = vi.fn(); });
afterEach(() => vi.unstubAllGlobals());
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
    if (action.type === "upload") {
      await user.upload(await screen.findByLabelText(action.label, { selector: 'input[type="file"]' }), action.files.map((file) => new File([galleryUploadBytes(file)], file.name, { type: file.mimeType })));
      continue;
    }
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

it("Bienvenida acepta el aviso por POST y conserva consultas fijas e historial", async () => {
  const app = chatScenario("Asistente-Org", "Bienvenida")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByRole("heading", { name: "¿Qué querés consultar?" })).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Usuarios activos" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Mi consulta" })).toBeVisible();
  expect(mounted.calls).toContain("POST /api/organization/assistant/notice");
});

it.each(["Asistente-Org", "M-Asistente-Personal"])("%s conserva adjuntos en el compositor sin subirlos antes de Enviar", async (board) => {
  const restore = board.startsWith("M-") ? asPhone() : () => {};
  try {
    const app = chatScenario(board, "Con adjuntos")!; const mounted = mount(app);
    await actions(app, mounted.user);
    expect(screen.getByRole("button", { name: "Quitar captura-usuarios.png" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Quitar planilla-ventas.pdf" })).toBeVisible();
    expect(mounted.calls.some((call) => call.startsWith("POST"))).toBe(false);
  } finally { restore(); }
});

it("un PDF mayor a 10 MiB muestra validación cliente sin subirlo", async () => {
  expect(chatScenario("Asistente-Org", "Adjunto de más de 10 MB")).toBeUndefined();
  const app = galleryOversizedAttachmentProbe("Asistente-Org"); const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByRole("alert")).toHaveTextContent("El archivo pesa más de 10 MB.");
  expect(screen.queryByRole("button", { name: "Quitar planilla-ventas.pdf" })).not.toBeInTheDocument();
  expect(mounted.calls.some((call) => call.startsWith("POST"))).toBe(false);
});

it.each(["Detenida", "Falló la respuesta"])("%s viene del DTO durable y deja el SDK terminal", async (state) => {
  const app = chatScenario("Asistente-Org", state)!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.queryByRole("button", { name: "Detener" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
  if (state === "Falló la respuesta") {
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeVisible();
    expect(screen.queryByText("Respuesta parcial del arnés.")).not.toBeInTheDocument();
  } else {
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    expect(screen.getByText("Respuesta parcial del arnés.")).toBeVisible();
  }
});

it.each(["Asistente-Org", "M-Asistente-Personal"])("%s abre acciones, renombrar y borrar con una sola capa", async (board) => {
  const restore = board.startsWith("M-") ? asPhone() : () => {};
  try {
    const app = chatScenario(board, "Renombrar")!; const mounted = mount(app);
    await actions(app, mounted.user);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Mi consulta");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    await mounted.user.click(screen.getByRole("button", { name: "Cancelar" }));
    if (board.startsWith("M-")) await mounted.user.click(screen.getByRole("button", { name: "Conversaciones" }));
    await mounted.user.click(screen.getByRole("button", { name: "Acciones de Mi consulta" }));
    await mounted.user.click(await screen.findByRole("menuitem", { name: "Borrar: Mi consulta" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "¿Borrar «Mi consulta»?" })).toBeVisible();
  } finally { restore(); }
});

it("Historial móvil conserva bienvenida bajo la hoja y permite seleccionar", async () => {
  const restore = asPhone();
  try {
    const app = chatScenario("M-Asistente-Org", "Historial")!; const mounted = mount(app);
    await actions(app, mounted.user);
    expect(screen.getByRole("dialog", { name: "Conversaciones" })).toBeVisible();
    await mounted.user.click(screen.getByRole("button", { name: "Mi consulta" }));
    expect(await screen.findByText("de prueba", { selector: "strong" })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  } finally { restore(); }
});

it("Tope del mes se obtiene de HTTP 429 y conserva conversación sin enviar otra vez", async () => {
  expect(chatScenario("Asistente-Org", "Tope del mes")).toBeUndefined();
  const app = galleryMonthlyLimitProbe("Asistente-Org"); const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByText("de prueba", { selector: "strong" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Enviar" })).not.toBeInTheDocument();
  expect(mounted.calls.filter((call) => call.endsWith("/messages"))).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Mi consulta" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Ver uso" })).not.toBeInTheDocument();
});

it.each(["Asistente-Personal", "M-Asistente-Personal"])("%s my_messages vacío usa Quick gratis y adopta su detalle sin llamar Messages", async (board) => {
  const restore = board.startsWith("M-") ? asPhone() : () => {};
  try {
    const app = chatScenario(board, "Mis mensajes con empresas: sin mensajes")!; const mounted = mount(app);
    await actions(app, mounted.user);
    expect(screen.getByText("Todavía no tenés mensajes con empresas.")).toBeVisible();
    expect(mounted.calls).toContain("POST /api/me/assistant/quick/my_messages");
    expect(mounted.calls.some((call) => call.endsWith("/messages"))).toBe(false);
  } finally { restore(); }
});

it("Historial plegado conserva la conversación y puede volver a mostrarla", async () => {
  const app = chatScenario("Asistente-Org", "Historial plegado")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByText("de prueba", { selector: "strong" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Mi consulta" })).not.toBeInTheDocument();
  await mounted.user.click(screen.getByRole("button", { name: "Mostrar las conversaciones" }));
  expect(await screen.findByRole("button", { name: "Mi consulta" })).toHaveAttribute("aria-current", "true");
});

it("Enviar sube el PDF por multipart, relee la versión y usa el id de adjunto", async () => {
  const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
  vi.stubGlobal("FormData", nativeForm.constructor);
  vi.stubGlobal("File", FetchFile);
  const app = chatScenario("Asistente-Org", "Con adjuntos")!;
  const path = "/api/organization/assistant/conversations/gallery-chat";
  const empty: AssistantConversationResponse = { ...galleryConversation, messages: { items: [], hasMore: false } };
  const uploaded: AssistantConversationResponse = { ...empty, conversation: { ...empty.conversation, version: 3 } };
  const attachment: AssistantAttachmentSummaryResponse = { id: "gallery-pdf", fileName: "planilla-ventas.pdf", mediaType: "application/pdf", byteLength: 1258291, version: 1 };
  const final: AssistantConversationResponse = { ...galleryConversation, conversation: { ...galleryConversation.conversation, version: 4 }, messages: { items: [
    { ...galleryConversation.messages.items[0], attachments: [attachment] }, galleryConversation.messages.items[1],
  ], hasMore: false } };
  const stream = galleryStreamEvents.map((event) => event.event === "start" || event.event === "done" ? { ...event, data: { ...event.data, conversationVersion: 4 } } : event)
    .map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");
  app.responses.unshift({ method: "GET", path, status: 200, body: uploaded, afterResponse: { method: "POST", path: `${path}/attachments` } }, { method: "GET", path, status: 200, body: empty });
  app.actions.unshift({ type: "click", role: "button", name: "Mi consulta", exact: true });
  const mounted = mount(app);
  await actions(app, mounted.user);
  let uploadedFile: File | null = null; let uploadedVersion = ""; let sent: unknown;
  server.use(
    http.post(`${path}/attachments`, async ({ request }) => {
      const data = await request.formData(); uploadedFile = data.get("file") as File; uploadedVersion = String(data.get("conversationVersion"));
      return HttpResponse.json(attachment);
    }),
    http.get(path, () => HttpResponse.json(uploadedFile ? uploaded : empty)),
    http.post(`${path}/messages`, async ({ request }) => {
      sent = await request.json();
      server.use(http.get(path, () => HttpResponse.json(final)));
      return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream" } });
    }),
  );
  await mounted.user.click(screen.getByRole("button", { name: "Quitar captura-usuarios.png" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Tu consulta" }), { target: { value: "Cuántos usuarios hay" } });
  await mounted.user.click(screen.getByRole("button", { name: "Enviar" }));
  expect(await screen.findByText("de prueba", { selector: "strong" })).toBeVisible();
  expect(uploadedVersion).toBe("2");
  expect(uploadedFile).toMatchObject({ name: "planilla-ventas.pdf", type: "application/pdf", size: 1258291 });
  expect(sent).toEqual({ text: "Cuántos usuarios hay", attachmentIds: ["gallery-pdf"], conversationVersion: 3 });
});
