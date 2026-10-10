import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
import { fixtureAuth } from "@/test/mocks/authContext";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { galleryImage, galleryPdf, galleryPdfTooLarge, galleryUploadBytes } from "@/test/galleryUploadFiles";
import type { AssistantAttachmentSummaryResponse, AssistantConversationResponse, AssistantStreamHttpResponse } from "@/shared/api/types";
import { chatScenario, configurationScenario, galleryConversation, galleryMe, galleryMonthlyLimitProbe, galleryOpenStreamProbe, galleryStream, galleryStreamEvents, type GalleryApp } from "@/test/etapa8bVisualFixtures";
import type { AssistantTurnState } from "@/modules/assistant/runtime/assistantTurnState";

beforeAll(async () => { await import("@/modules/assistant/settings/OrganizationAssistantSettingsPage"); await import("@/modules/assistant/settings/PlatformAssistantSettingsPage"); await import("@/modules/assistant/pages/RegisteredAssistant"); });
beforeEach(() => { Element.prototype.scrollTo = vi.fn(); URL.createObjectURL = vi.fn(() => "blob:gallery-fixture"); URL.revokeObjectURL = vi.fn(); });
const responseListeners: (() => void)[] = [];
afterEach(() => { responseListeners.splice(0).forEach((dispose) => dispose()); vi.unstubAllGlobals(); });
const chatBoards = ["Asistente-Org", "Asistente-Personal", "Asistente-Plat", "M-Asistente-Org", "M-Asistente-Personal", "M-Asistente-Plat"];

function mount(app: GalleryApp) {
  const calls: string[] = []; const completed = new Set<string>();
  const opened: { stream: ReadableStream<Uint8Array>; cancelled: boolean; closed: boolean; emit: (event: AssistantStreamHttpResponse) => void }[] = [];
  const ownStreams = new Set<string>();
  const onResponse: Parameters<typeof server.events.on<"response:mocked">>[1] = ({ requestId, request, response }) => {
    if (!ownStreams.delete(requestId) || response.status !== 200) return;
    completed.add(`${request.method} ${new URL(request.url).pathname}`);
  };
  server.events.on("response:mocked", onResponse);
  responseListeners.push(() => server.events.removeListener("response:mocked", onResponse));
  server.use(http.all("/api/*", ({ request, requestId }) => {
    const url = new URL(request.url); calls.push(`${request.method} ${url.pathname}`);
    const response = app.responses.find((item) => item.method === request.method && item.path === url.pathname && (!item.afterResponse || completed.has(`${item.afterResponse.method} ${item.afterResponse.path}`))
      && Object.entries(item.query ?? {}).every(([key, value]) => url.searchParams.get(key) === value));
    if (!response) throw new Error(`Fixture sin ruta ${request.method} ${url.pathname}`);
    if (response.openStream) {
      ownStreams.add(requestId);
      let controller: ReadableStreamDefaultController<Uint8Array>;
      const abort = () => { record.cancelled = true; controller.error(new DOMException("", "AbortError")); request.signal.removeEventListener("abort", abort); };
      const record = { stream: new ReadableStream<Uint8Array>({
        start(value) { controller = value; controller.enqueue(new TextEncoder().encode(response.rawBody!)); },
        cancel() { record.cancelled = true; request.signal.removeEventListener("abort", abort); },
      }), cancelled: false, closed: false, emit: (event: AssistantStreamHttpResponse) => {
        controller.enqueue(new TextEncoder().encode(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`));
        if (event.event === "done" || event.event === "error") {
          record.closed = true;
          controller.close();
          request.signal.removeEventListener("abort", abort);
        }
      } };
      request.signal.addEventListener("abort", abort, { once: true });
      opened.push(record);
      return new HttpResponse(record.stream, { status: response.status, headers: { "Content-Type": response.contentType! } });
    }
    completed.add(`${response.method} ${response.path}`);
    return response.status === 204 ? new HttpResponse(null, { status: 204 }) : response.rawBody === undefined ? new HttpResponse(JSON.stringify(response.body), { status: response.status, headers: { "Content-Type": "application/json" } })
      : new HttpResponse(response.rawBody, { status: response.status, headers: { "Content-Type": response.contentType! } });
  }));
  const route = new URL(app.path, "http://localtest.me:5192").searchParams.get("route")!;
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const result = render(<StrictMode><AppProviders client={client} authContext={fixtureAuth(app.userFixture)}><RouterProvider router={router} /></AppProviders></StrictMode>);
  return { ...result, calls, client, opened, user: userEvent.setup() };
}
async function actions(app: GalleryApp, user: ReturnType<typeof userEvent.setup>) {
  for (const action of app.actions) {
    if (action.type === "upload") {
      await user.upload(await screen.findByLabelText(action.label, { selector: 'input[type="file"]' }), action.files.map((file) => new File([galleryUploadBytes(file)], file.name, { type: file.mimeType })));
      continue;
    }
    const surface = action.within ? within(await screen.findByRole(action.within.role, { name: action.within.name })) : screen;
    const target = action.label ? await surface.findByLabelText(action.label, { exact: false }) : await surface.findByRole(action.role!, { name: action.name });
    if (action.type === "click") await user.click(target);
    else if (action.type === "press") { target.focus(); await user.keyboard(`{${action.key}}`); }
    else fireEvent.change(target, { target: { value: action.value } });
  }
  await waitFor(() => expect(document.querySelector(app.readySelector)).toBeVisible());
  if (app.readyText) await screen.findByText((_, node) => node?.textContent?.includes(app.readyText!) === true && ![...node.children].some((child) => child.textContent?.includes(app.readyText!)));
  for (const text of app.readyTexts ?? []) await screen.findAllByText(text, { exact: false });
}

it.each(["Asistente-Org", "Asistente-Personal", "Asistente-Plat"].flatMap((accessBoard) => (["Consultando", "Escribiendo"] as const).map((state) => ({ board: `${state === "Escribiendo" ? "M-" : ""}${accessBoard}`, state }))))("$board $state conserva stream abierto, herramientas SDK y selección conforme fuente", async ({ board, state }) => {
  const restore = board.startsWith("M-") ? asPhone() : () => {};
  let mounted: ReturnType<typeof mount> | undefined;
  try {
    const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
    vi.stubGlobal("FormData", nativeForm.constructor);
    vi.stubGlobal("File", FetchFile);
    const app = galleryOpenStreamProbe(board, state);
    expect(chatScenario(board, state)).toEqual(app);
    mounted = mount(app);
    for (const action of app.actions) {
      if (action.type === "upload") {
        fireEvent.change(await screen.findByLabelText(action.label, { selector: 'input[type="file"]' }), { target: { files: action.files.map((file) => new FetchFile([galleryUploadBytes(file)], file.name, { type: file.mimeType })) } });
      } else if (action.type === "click" && action.name === "Enviar") fireEvent.click(await screen.findByRole("button", { name: "Enviar" }));
      else await actions({ ...app, actions: [action], readySelector: "main", readyTexts: undefined }, mounted.user);
    }
    await actions({ ...app, actions: [] }, mounted.user);
    const currentTurn = () => mounted!.client.getQueryCache().getAll().find((query) => query.queryKey.includes("turn") && query.queryKey.includes("gallery-chat"))?.state.data as AssistantTurnState | undefined;
    await waitFor(() => expect(currentTurn()?.phase).toBe(state === "Consultando" ? "consulting" : "writing"));
    const keys = board.includes("Personal") ? ["my_organizations"] : board.includes("Plat") ? ["platform_assistant_usage"] : ["org_companies", "org_users"];
    expect(currentTurn()?.tools.map(({ toolKey, labelKey, state: toolState }) => ({ toolKey, labelKey, state: toolState }))).toEqual(keys.map((toolKey, index) => ({ toolKey, labelKey: `Tool.${toolKey}`, state: state === "Escribiendo" || index < keys.length - 1 ? "complete" : "running" })));
    expect(currentTurn()?.request).toMatchObject({ conversationVersion: board.includes("Org") ? 3 : 2, attachmentIds: board.includes("Org") ? ["gallery-pdf"] : [] });
    expect(screen.getByRole("button", { name: "Detener" })).toBeEnabled();
    expect(screen.queryByRole("heading", { name: "¿Qué querés consultar?" })).not.toBeInTheDocument();
    // Refetch público: conserva phase efímera junto al activeTurnId/Generating durable real.
    await mounted.client.invalidateQueries({ predicate: (query) => query.queryKey.includes("detail") });
    await waitFor(() => expect(currentTurn()?.phase).toBe(state === "Consultando" ? "consulting" : "writing"));
    const detail = mounted.client.getQueryCache().getAll().find((query) => query.queryKey.includes("detail") && query.queryKey.includes("gallery-chat"))?.state.data as AssistantConversationResponse;
    expect(detail.activeTurnId).toBe("gallery-turn");
    expect(detail.conversation.version).toBe(currentTurn()?.start?.conversationVersion);
    expect(detail.messages.items.at(-1)?.status).toBe("Generating");
    if (board.includes("Org")) expect(detail.messages.items.at(-2)?.attachments[0]?.fileName).toBe("planilla-ventas.pdf");
    expect(mounted.calls.filter((call) => call.startsWith("POST") && call.endsWith("/messages"))).toHaveLength(1);
    expect(mounted.opened).toHaveLength(1);
    expect(mounted.opened[0].cancelled).toBe(false);
    const statuses = within(screen.getByRole("group", { name: "Asistente" })).getAllByRole("status");
    for (const status of statuses) expect.soft(status.closest("[data-message-id]")).toHaveAttribute("data-message-id", "gallery-assistant");
    const labels = board.includes("Personal") ? [state === "Consultando" ? "Consultando tus organizaciones…" : "Consultó tus organizaciones"]
      : board.includes("Plat") ? [state === "Consultando" ? "Consultando el uso del asistente…" : "Consultó el uso del asistente"]
      : state === "Consultando" ? ["Consultó Empresas", "Consultando usuarios…"] : ["Consultó Empresas y Usuarios"];
    for (const label of labels) expect(screen.getByText(label, { exact: true })).toBeVisible();
    const activeMessage = screen.getByText(labels[0], { exact: true }).closest("[data-message-id]")!;
    expect(activeMessage.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    const latestQuery = currentTurn()!.request.text!;
    expect(screen.getByText(latestQuery, { exact: true }).compareDocumentPosition(activeMessage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    if (state === "Escribiendo") {
      const delta = screen.getByText(currentTurn()!.text, { exact: true });
      expect(activeMessage).toContainElement(delta);
      expect(screen.getByText(labels[0], { exact: true }).compareDocumentPosition(delta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(statuses).toHaveLength(1);
    }
    if (board.includes("Personal")) expect(screen.queryByRole("button", { name: "Ver Beta S.R.L." })).not.toBeInTheDocument();
    const source = board.includes("Personal") ? {
      saved: ["Cómo recuperar mi cuenta"], recent: ["Por qué no puedo entrar a Beta", "Mis organizaciones", "Correos de mi cuenta"], link: undefined,
    } : board.includes("Plat") ? {
      saved: ["Altas de setiembre"], recent: ["Organizaciones por aprobar", "Recuperaciones de la semana", "Cuentas suspendidas"],
      link: { name: "Ver en Organizaciones", to: "/plataforma/organizaciones?status=PendingApproval", permission: "platform.tenants.read", scope: "platform" as const },
    } : {
      saved: ["Permisos del rol Auditor"], recent: ["Invitaciones vencidas", "Quién entró esta semana", "Empresas sin administrador", "Cambios de ayer en Roles"],
      link: { name: "Ver en Usuarios", to: "/org/usuarios?state=Expired", permission: "users.read", scope: "organization" as const },
    };
    if (source.link) {
      expect.soft(screen.queryByRole("link", { name: source.link.name })).toBeVisible();
      expect.soft(screen.queryByRole("link", { name: source.link.name })).toHaveAttribute("href", source.link.to);
      const me = app.responses.find((response) => response.path === "/api/me")?.body as ReturnType<typeof galleryMe>;
      expect.soft(me.effectivePermissions[source.link.scope]).toContain(source.link.permission);
      expect(detail.messages.items.find((message) => message.id === "gallery-previous-assistant")?.links).toEqual([{
        routeKey: board.includes("Plat") ? "platform.organizations" : "business.users", parameters: {},
        query: { status: board.includes("Plat") ? "Pending" : "Expired" }, labelKey: "Ver",
      }]);
    }
    if (board.startsWith("M-")) await mounted.user.click(screen.getByRole("button", { name: "Conversaciones" }));
    const history = within(await screen.findByRole(board.startsWith("M-") ? "dialog" : "complementary", { name: "Conversaciones" }));
    for (const [heading, titles] of [["Guardadas", source.saved], ["Recientes", source.recent]] as const) {
      const group = within(history.getByRole("heading", { name: heading === "Guardadas" ? heading : /^Recientes/ }).closest("section")!);
      expect(group.getAllByRole("button").filter((button) => !button.getAttribute("aria-label")).map((button) => button.textContent)).toEqual(titles);
      for (const title of titles) expect(group.getByRole("button", { name: title })).toBeVisible();
    }
    expect(history.getByRole("button", { name: source.recent[0] })).toHaveAttribute("aria-current", "true");
    if (board.startsWith("M-")) {
      await mounted.user.click(history.getByRole("button", { name: source.recent[0] }));
      // El SDK ignora seleccionar el hilo que ya está activo: no cancela su turno.
      expect(screen.getByRole("dialog", { name: "Conversaciones" })).toBeVisible();
      expect(currentTurn()?.phase).toBe("writing");
      expect(mounted.opened[0].cancelled).toBe(false);
      await mounted.user.click(history.getByRole("button", { name: "Cerrar" }));
      expect(screen.queryByRole("dialog", { name: "Conversaciones" })).not.toBeInTheDocument();
      expect(currentTurn()?.phase).toBe("writing");
    }
  } finally {
    mounted?.unmount();
    if (mounted?.opened.length) await waitFor(() => expect(mounted!.opened[0].cancelled).toBe(true));
    restore();
  }
});

it.each(["Complete", "Stopped"] as const)("el mensaje activo pasa de consulta a escritura con replay seguro, retira cursor al quedar $0 y limpia al cambiar de conversación", async (terminal) => {
  const app = galleryOpenStreamProbe("Asistente-Org", "Consultando");
  if (terminal === "Stopped") {
    const stopPath = "/api/organization/assistant/conversations/gallery-chat/turns/gallery-turn/stop";
    const pending = app.responses.find((response) => response.method === "GET" && response.path.endsWith("/gallery-chat") && response.afterResponse?.path.endsWith("/messages"))!.body as AssistantConversationResponse;
    const stopped: AssistantConversationResponse = { ...pending, activeTurnId: null, conversation: { ...pending.conversation, version: 5 },
      messages: { ...pending.messages, items: pending.messages.items.map((message) => message.id === "gallery-assistant" ? { ...message, status: "Stopped", text: "Respuesta parcial" } : message) } };
    app.responses.unshift({ method: "POST", path: stopPath, status: 204 }, { method: "GET", path: "/api/organization/assistant/conversations/gallery-chat", status: 200, body: stopped, afterResponse: { method: "POST", path: stopPath } });
  }
  let mounted: ReturnType<typeof mount> | undefined;
  try {
    const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
    vi.stubGlobal("FormData", nativeForm.constructor); vi.stubGlobal("File", FetchFile);
    mounted = mount(app);
    for (const action of app.actions) {
      if (action.type === "upload") fireEvent.change(await screen.findByLabelText(action.label, { selector: 'input[type="file"]' }), { target: { files: action.files.map((file) => new FetchFile([galleryUploadBytes(file)], file.name, { type: file.mimeType })) } });
      else if (action.type === "click" && action.name === "Enviar") fireEvent.click(await screen.findByRole("button", { name: "Enviar" }));
      else await actions({ ...app, actions: [action], readySelector: "main", readyTexts: undefined }, mounted.user);
    }
    await actions({ ...app, actions: [] }, mounted.user);
    const firstStatus = screen.getByText("Consultando usuarios…");
    expect(firstStatus.closest("[data-message-id]")).toHaveAttribute("data-message-id", "gallery-assistant");
    expect(mounted.container.querySelector("[data-cursor-state]")).not.toBeInTheDocument();
    const emit = mounted.opened[0].emit;
    emit({ event: "tool", data: { turnId: "gallery-turn", toolKey: "org_users", labelKey: "Tool.org_users", state: "complete" } });
    emit({ event: "tool", data: { turnId: "gallery-turn", toolKey: "org_users", labelKey: "private-replay", state: "running" } });
    emit({ event: "delta", data: { turnId: "gallery-turn", sequence: 1, text: "Respuesta parcial" } });
    emit({ event: "delta", data: { turnId: "gallery-turn", sequence: 1, text: "NO duplicar" } });
    const completed = await screen.findByText("Consultó Empresas y Usuarios");
    const delta = await screen.findByText("Respuesta parcial");
    const cursor = delta.closest("[data-cursor-state]");
    expect(cursor).toHaveAttribute("data-cursor-state", "writing");
    expect(cursor).toContainElement(delta);
    expect(cursor?.closest("[data-message-id]")).toHaveAttribute("data-message-id", "gallery-assistant");
    expect(cursor?.firstElementChild).toContainElement(delta);
    expect(mounted.container.querySelectorAll("[data-cursor-state]")).toHaveLength(1);
    const previous = mounted.container.querySelector('[data-message-id="gallery-previous-assistant"]');
    expect(previous).toBeInTheDocument();
    expect(previous?.querySelector("[data-cursor-state]")).not.toBeInTheDocument();
    expect(completed.closest("[data-message-id]")).toContainElement(delta);
    expect(completed.compareDocumentPosition(delta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(/private-replay|NO duplicar|Consultando usuarios/)).not.toBeInTheDocument();
    if (terminal === "Complete") {
      const done = galleryStreamEvents.find((event) => event.event === "done")!;
      if (done.event !== "done") throw new Error("Fixture sin done");
      emit({ event: "done", data: { ...done.data, conversationVersion: 4, message: { ...done.data.message, text: "Respuesta final" } } });
      await screen.findByText("Respuesta final");
      expect(screen.queryByText("Respuesta parcial")).not.toBeInTheDocument();
    } else {
      await mounted.user.click(screen.getByRole("button", { name: "Detener" }));
      await screen.findByText("Detuviste la respuesta.");
      expect(screen.getByText("Respuesta parcial")).toBeVisible();
      expect(mounted.calls.filter((call) => call === "POST /api/organization/assistant/conversations/gallery-chat/turns/gallery-turn/stop")).toHaveLength(1);
    }
    const turn = mounted.client.getQueryCache().getAll().find((query) => query.queryKey.includes("turn") && query.queryKey.includes("gallery-chat"))?.state.data as AssistantTurnState;
    expect(turn.phase).toBe(terminal);
    expect(mounted.container.querySelector("[data-cursor-state]")).not.toBeInTheDocument();
    await mounted.user.click(screen.getByRole("button", { name: "Nueva conversación" }));
    await screen.findByRole("heading", { name: "¿Qué querés consultar?" });
    expect(screen.queryByText("Consultó Empresas y Usuarios")).not.toBeInTheDocument();
    expect(screen.queryByText("Respuesta parcial")).not.toBeInTheDocument();
    expect(mounted.container.querySelector("[data-cursor-state]")).not.toBeInTheDocument();
    // Complete termina el transporte; Stopped aborta el productor todavía abierto.
    // MSW duplica el stream: reader.cancel no equivale a cancelación de ambas ramas.
    expect(mounted.opened[0].closed).toBe(terminal === "Complete");
    expect(mounted.opened[0].cancelled).toBe(terminal === "Stopped");
  } finally { mounted?.unmount(); }
});

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
    expect(screen.getByRole("button", { name: "Agregar un correo" })).toBeVisible();
    expect(screen.getByLabelText("Clave de Anthropic", { exact: false })).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Clave de Anthropic", { exact: false })).toHaveClass("[-webkit-text-security:disc]");
    expect(screen.getByLabelText("Clave de Anthropic", { exact: false })).toHaveAttribute("autoComplete", "off");
    expect(screen.getByLabelText("Clave de Anthropic", { exact: false })).toHaveAttribute("data-1p-ignore", "true");
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

it("la escena de PDF excesivo conserva ambos adjuntos y la alerta nombrada sin subirlos", async () => {
  const app = chatScenario("Asistente-Org", "Adjunto de más de 10 MB")!; const mounted = mount(app);
  await actions(app, mounted.user);
  expect(screen.getByRole("alert")).toHaveTextContent("planilla-ventas.pdf pesa más de 10,5 MB.");
  expect(screen.getByRole("button", { name: "Quitar captura-usuarios.png" })).toBeVisible();
  const pdfChip = screen.getByRole("button", { name: "Quitar planilla-ventas.pdf" }).closest("li")!;
  expect(pdfChip).toHaveAccessibleDescription("planilla-ventas.pdf pesa más de 10,5 MB.");
  expect(within(pdfChip).getByText("14,8 MB")).toBeVisible();
  expect(screen.getByText("240 KB")).toBeVisible();
  expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
  expect(mounted.calls.some((call) => call.startsWith("POST"))).toBe(false);
});

it("los archivos ficticios conservan bytes reales y formatos decimales de la fuente", () => {
  expect(galleryImage.byteLength).toBe(240_000);
  expect(galleryPdf.byteLength).toBe(1_200_000);
  expect(galleryPdfTooLarge.byteLength).toBe(14_800_000);
  for (const file of [galleryImage, galleryPdf, galleryPdfTooLarge]) {
    const bytes = galleryUploadBytes(file);
    expect(new File([bytes], file.name, { type: file.mimeType }).size).toBe(file.byteLength);
    if (file.mimeType === "application/pdf") {
      const pdf = new TextDecoder().decode(bytes);
      expect(pdf).toMatch(/^%PDF-1\.4/u);
      expect(pdf).toMatch(/%%EOF\n +$/u);
    } else expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  }
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
  const attachment: AssistantAttachmentSummaryResponse = { id: "gallery-pdf", fileName: galleryPdf.name, mediaType: galleryPdf.mimeType, byteLength: galleryPdf.byteLength, version: 1 };
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
  expect(uploadedFile).toMatchObject({ name: galleryPdf.name, type: galleryPdf.mimeType, size: galleryPdf.byteLength });
  expect(sent).toEqual({ text: "Cuántos usuarios hay", attachmentIds: ["gallery-pdf"], conversationVersion: 3 });
});
