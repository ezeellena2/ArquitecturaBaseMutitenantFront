import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { server } from "@/test/mocks/server";
import { resetHttpClient } from "@/shared/api/httpClient";
import type { AssistantAttachmentSummaryResponse, AssistantConversationResponse, AssistantMessageResponse, AssistantQuickResponse, AssistantStateResponse, AssistantTurnResultResponse, SendAssistantMessageRequest } from "@/shared/api/types";
import { AssistantHome, type AssistantHomeProps } from "./AssistantHome";
import { AppChromeProvider } from "@/shared/ui/app/AppChrome";
import { File as FetchFile } from "node:buffer";
import { AssistantPhonePage } from "./AssistantPhonePage";

const state: AssistantStateResponse = { configured: true, canConfigure: true, models: [], quickQueries: [{ key: "active_users", labelKey: "unknown" }], dailyLimit: 50,
  dailyResetAtUtc: "2026-10-10T21:00:00Z", remainingMessages: 40, noticeVersion: "v1", noticeAccepted: true, retentionDays: 30, maxAttachmentBytes: 10 * 1024 * 1024, maxAttachments: 5 };
const message = (id: string, role: AssistantMessageResponse["role"], text: string, status: AssistantMessageResponse["status"] = "Complete"): AssistantMessageResponse => ({
  id, role, text, status, version: 1, createdAtUtc: "2026-10-10T12:00:00Z", attachments: [], links: [],
});
const detail = (): AssistantConversationResponse => ({ conversation: { id: "chat", title: "Mi consulta", version: 1, isSaved: false, createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z" }, messages: { items: [], hasMore: false }, activeTurnId: null });
const props: AssistantHomeProps = { scope: { access: "business", userId: "user", tenantId: "org" }, enabled: true, hasPermission: () => true, onPrivacy: () => {} };
function setup(initial = state, phone = false) {
  let currentState = initial;
  let current = detail();
  const requests: SendAssistantMessageRequest[] = [];
  let created = 0;
  server.use(http.get("/api/organization/assistant", () => HttpResponse.json(currentState)),
    http.get("/api/organization/assistant/conversations", ({ request }) => HttpResponse.json({ items: created && new URL(request.url).searchParams.get("saved") === String(current.conversation.isSaved) ? [current.conversation] : [], hasMore: false })),
    http.post("/api/organization/assistant/conversations", () => { created++; return HttpResponse.json(current.conversation); }),
    http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.json(current)),
    http.post("/api/organization/assistant/conversations/chat/messages", async ({ request }) => {
      const body = await request.json() as SendAssistantMessageRequest; requests.push(body);
      const response = message("a", "assistant", "Respuesta **real**");
      current = { ...current, conversation: { ...current.conversation, version: 2 }, messages: { items: [message("u", "user", body.text ?? ""), response], hasMore: false } };
      const result: AssistantTurnResultResponse = { turnId: "turn", message: response, conversationVersion: 2, usage: { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, cost: { amount: 0, currency: "USD" }, remainingMessages: 39 } };
      return HttpResponse.json(result);
    }));
  const view = (nextProps = props) => <MemoryRouter><AppChromeProvider value={{ phone, parent: null, subtitle: null, hideBottomNav: () => {} }}>{phone ? <AssistantPhonePage {...nextProps} /> : <AssistantHome {...nextProps} />}</AppChromeProvider></MemoryRouter>;
  const result = renderWithProviders(view());
  return { ...result, user: userEvent.setup(), requests, created: () => created, changeState: (next: AssistantStateResponse) => { currentState = next; }, changeDetail: (next: AssistantConversationResponse) => { current = next; created = 1; }, rerenderAssistant: (next: AssistantHomeProps) => result.rerender(view(next)) };
}
beforeEach(() => { Element.prototype.scrollTo = vi.fn(); URL.createObjectURL = vi.fn(() => "blob:private"); URL.revokeObjectURL = vi.fn(); });
afterEach(() => { resetHttpClient(); vi.unstubAllGlobals(); });

describe("interfaz del asistente", () => {
  it("un rechazo antes de la admisión conserva texto y adjunto subido para corregir sin volver a subir", async () => {
    const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
    vi.stubGlobal("FormData", nativeForm.constructor); vi.stubGlobal("File", FetchFile);
    const app = setup();
    let uploads = 0;
    const bodies: SendAssistantMessageRequest[] = [];
    const keys: Array<string | null> = [];
    server.use(http.post("/api/organization/assistant/conversations/chat/attachments", () => { uploads++; return HttpResponse.json({ id: "upload", fileName: "uno.pdf", mediaType: "application/pdf", byteLength: 3, version: 9 } satisfies AssistantAttachmentSummaryResponse); }),
      http.post("/api/organization/assistant/conversations/chat/messages", async ({ request }) => {
        const body = await request.json() as SendAssistantMessageRequest; bodies.push(body); keys.push(request.headers.get("Idempotency-Key"));
        if (bodies.length === 1) return HttpResponse.json({ code: "Assistant.Provider.ContextTooLarge", detail: "La consulta es demasiado larga." }, { status: 400 });
        const response = message("a", "assistant", "Corregida");
        app.changeDetail({ ...detail(), conversation: { ...detail().conversation, version: 2 }, messages: { items: [message("u", "user", body.text ?? ""), response], hasMore: false } });
        return HttpResponse.json({ turnId: "turn", message: response, conversationVersion: 2, usage: { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, cost: { amount: 0, currency: "USD" }, remainingMessages: 39 } } satisfies AssistantTurnResultResponse);
      }));
    await screen.findByRole("textbox", { name: "Tu consulta" });
    await app.user.upload(screen.getByLabelText("Adjuntar", { selector: "input" }), new File(["pdf"], "uno.pdf", { type: "application/pdf" }));
    await app.user.type(screen.getByRole("textbox", { name: "Tu consulta" }), "Consulta original");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText("La consulta es demasiado larga.");
    const input = screen.getByRole("textbox", { name: "Tu consulta" });
    await waitFor(() => expect(input).toHaveValue("Consulta original"));
    expect(screen.getByRole("button", { name: "Quitar uno.pdf" })).toBeVisible();
    expect(Object.values(app.queryClient.getQueryData<Record<string, AssistantAttachmentSummaryResponse>>(["assistant", "business", "org", "user", "pendingAttachments", "chat"]) ?? {})).toEqual([expect.objectContaining({ id: "upload" })]);
    await app.user.clear(input); await app.user.type(input, "Consulta corregida");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText("Corregida");
    expect(uploads).toBe(1);
    expect(app.created()).toBe(1);
    expect(bodies).toEqual([{ text: "Consulta original", attachmentIds: ["upload"], conversationVersion: 1 }, { text: "Consulta corregida", attachmentIds: ["upload"], conversationVersion: 1 }]);
    expect(new Set(keys).size).toBe(2);
    expect(input).toHaveValue("");
  });
  it("el runtime conserva el borrador cuando falla preparar la conversación", async () => {
    const app = setup();
    let attempts = 0;
    server.use(http.post("/api/organization/assistant/conversations", () => { attempts++; return HttpResponse.json({ code: "General.ValidationError", detail: "No se pudo preparar la consulta." }, { status: 400 }); }));
    const input = await screen.findByRole("textbox", { name: "Tu consulta" });
    await app.user.type(input, "Borrador privado");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText("No se pudo preparar la consulta.");
    await waitFor(() => expect(input).toHaveValue("Borrador privado"));
    expect(attempts).toBe(1);
    expect(app.requests).toEqual([]);
  });
  it("Copiar y valorar usan el SDK con el texto y la versión durables", async () => {
    const app = setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const ratings: { rating: string | null; version: number }[] = [];
    server.use(http.put("/api/organization/assistant/conversations/chat/messages/a/feedback", async ({ request }) => {
      const body = await request.json() as { rating: string | null; version: number };
      ratings.push(body);
      app.changeDetail({ ...detail(), conversation: { ...detail().conversation, version: 2 }, messages: { items: [message("u", "user", "Consulta"), { ...message("a", "assistant", "Respuesta **real**"), rating: body.rating as AssistantMessageResponse["rating"], version: body.version + 1 }], hasMore: false } });
      return HttpResponse.json({ version: body.version + 1 });
    }));
    await app.user.type(await screen.findByRole("textbox", { name: "Tu consulta" }), "Consulta");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText("real", { selector: "strong" });
    await app.user.click(screen.getByRole("button", { name: "Copiar" }));
    await waitFor(() => expect(copy).toHaveBeenCalledExactlyOnceWith("Respuesta **real**"));
    const positive = screen.getByRole("button", { name: "Me sirvió" });
    await app.user.click(positive);
    await waitFor(() => expect(positive).toHaveAttribute("aria-pressed", "true"));
    await app.user.click(positive);
    await waitFor(() => expect(positive).toHaveAttribute("aria-pressed", "false"));
    expect(ratings).toEqual([{ rating: "up", version: 1 }, { rating: null, version: 2 }]);
  });
  it("Enter envía una sola consulta por el runtime oficial con la versión leída", async () => {
    const app = setup();
    const input = await screen.findByRole("textbox", { name: "Tu consulta" });
    await app.user.type(input, "Consulta por teclado");
    await app.user.keyboard("{Enter}");
    await waitFor(() => expect(app.requests).toHaveLength(1));
    expect(app.requests[0]).toMatchObject({ text: "Consulta por teclado", attachmentIds: [], conversationVersion: 1 });
    expect(await screen.findByText("real")).toBeVisible();
  });
  it("crea, relee y entrega exactamente una primera consulta al runtime real", async () => {
    const app = setup();
    await app.user.type(await screen.findByRole("textbox", { name: "Tu consulta" }), "Cuántos usuarios hay");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByText("real", { selector: "strong" });
    expect(app.created()).toBe(1);
    expect(app.requests).toEqual([{ text: "Cuántos usuarios hay", attachmentIds: [], conversationVersion: 1 }]);
    expect(await axe(app.container)).toHaveNoViolations();
  });
  it("persiste Entendido antes de habilitar consulta o atajos", async () => {
    const app = setup({ ...state, noticeAccepted: false });
    let noticeBody: unknown;
    server.use(http.post("/api/organization/assistant/notice", async ({ request }) => { noticeBody = await request.json(); app.changeState(state); return new HttpResponse(null, { status: 204 }); }));
    const dialog = await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "Usuarios activos", hidden: true })).toBeDisabled();
    const unavailableSend = screen.getByRole("button", { name: "Enviar", hidden: true });
    expect(unavailableSend).toBeDisabled();
    expect(within(unavailableSend).queryByText("Guardando…")).not.toBeInTheDocument();
    await app.user.click(within(dialog).getByRole("button", { name: "Entendido" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(noticeBody).toEqual({ noticeVersion: "v1" });
    expect(screen.getByRole("button", { name: "Usuarios activos" })).toBeEnabled();
  });
  it("un módulo apagado no pide HTTP ni muestra datos y clear vacía el DOM", async () => {
    const app = setup();
    await screen.findByRole("textbox", { name: "Tu consulta" });
    await app.user.type(screen.getByRole("textbox", { name: "Tu consulta" }), "Privado");
    act(() => app.queryClient.clear());
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    app.rerenderAssistant({ ...props, enabled: false });
    expect(screen.queryByText("Privado")).not.toBeInTheDocument();
  });
  it("topes mantienen historial y consultas fijas; Ver uso requiere permiso independiente", async () => {
    const app = setup({ ...state, remainingMessages: 0 });
    await screen.findByRole("button", { name: "Usuarios activos" });
    expect(screen.getByRole("button", { name: "Usuarios activos" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Enviar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva conversación" })).toBeEnabled();
    expect(await axe(app.container)).toHaveNoViolations();
  });
  it("canConfigure es el único permiso para la acción Sin configurar", async () => {
    const configure = vi.fn();
    const app = setup({ ...state, configured: false, canConfigure: false });
    app.rerenderAssistant({ ...props, onConfigure: configure });
    await screen.findByRole("heading", { name: "El asistente todavía no está configurado" });
    expect(screen.queryByRole("button", { name: "Revisar configuración" })).not.toBeInTheDocument();
  });
  it("el historial del teléfono abre una hoja accesible por teclado", async () => {
    const app = setup(state, true);
    await screen.findByRole("textbox", { name: "Tu consulta" });
    screen.getByRole("button", { name: "Conversaciones" }).focus();
    await app.user.keyboard("{Enter}");
    expect(await screen.findByRole("dialog", { name: "Conversaciones" })).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
    await app.user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("el teléfono reemplaza Historial por Acciones y Renombrar, con un solo diálogo", async () => {
    const app = setup(state, true);
    app.changeDetail(detail());
    await screen.findByRole("textbox", { name: "Tu consulta" });
    await app.user.click(screen.getByRole("button", { name: "Conversaciones" }));
    await app.user.click(await screen.findByRole("button", { name: "Acciones de Mi consulta" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await app.user.click(screen.getByRole("menuitem", { name: "Renombrar: Mi consulta" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Renombrar la conversación" })).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
    await app.user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Conversaciones" })).toHaveFocus());
  });

  it("crear tarde después de Nueva conversación no envía ni vuelve a seleccionar", async () => {
    const app = setup();
    let release!: () => void;
    let requested = false;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.post("/api/organization/assistant/conversations", async () => { requested = true; await gate; return HttpResponse.json(detail().conversation); }));
    await app.user.type(await screen.findByRole("textbox", { name: "Tu consulta" }), "Privado anterior");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(requested).toBe(true));
    const sending = screen.getByRole("button", { name: "Guardando…" });
    expect(sending).toBeDisabled();
    expect(within(sending).getByText("Guardando…")).toBeVisible();
    await app.user.click(screen.getByRole("button", { name: "Nueva conversación" }));
    await act(async () => { release(); await gate; });
    expect(app.requests).toEqual([]);
    expect(screen.getByRole("textbox", { name: "Tu consulta" })).toHaveValue("");
    expect(app.queryClient.getQueryData(["assistant", "business", "org", "user", "detail", "chat", {}])).toBeUndefined();
  });

  it("consulta fija con tope relee la ficha completa y muestra el resultado del servidor", async () => {
    const app = setup({ ...state, remainingMessages: 0 });
    const complete = { ...detail(), messages: { items: [message("u", "user", "Usuarios activos"), message("a", "assistant", "Todavía no hay usuarios.")], hasMore: false } };
    server.use(http.post("/api/organization/assistant/quick/active_users", () => {
      app.changeDetail(complete);
      const result: AssistantQuickResponse = { conversation: complete.conversation, messages: complete.messages.items, result: { text: "Todavía no hay usuarios.", links: [], data: { people: [], totalCount: 0, hasMore: false } } };
      return HttpResponse.json(result);
    }));
    await app.user.click(await screen.findByRole("button", { name: "Usuarios activos" }));
    await screen.findByText("Todavía no hay usuarios.");
    expect(app.queryClient.getQueryData(["assistant", "business", "org", "user", "detail", "chat", {}])).toEqual(complete);
    expect(app.requests).toEqual([]);
  });

  it("sube cada archivo por separado y usa versiones de conversación releídas", async () => {
    const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
    vi.stubGlobal("FormData", nativeForm.constructor);
    vi.stubGlobal("File", FetchFile);
    const app = setup();
    const versions: string[] = [];
    const keys: Array<string | null> = [];
    let version = 1;
    server.use(http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.json({ ...detail(), conversation: { ...detail().conversation, version } })),
      http.post("/api/organization/assistant/conversations/chat/attachments", async ({ request }) => {
        const body = await request.formData(); versions.push(String(body.get("conversationVersion"))); keys.push(request.headers.get("Idempotency-Key"));
        expect(body.getAll("file")).toHaveLength(1);
        version += 3;
        const attachment: AssistantAttachmentSummaryResponse = { id: `attachment-${version}`, fileName: "archivo.pdf", mediaType: "application/pdf", byteLength: 3, version: 999 };
        return HttpResponse.json(attachment);
      }));
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const input = screen.getByLabelText("Adjuntar", { selector: "input" });
    await app.user.upload(input, [new File(["pdf"], "uno.pdf", { type: "application/pdf" }), new File(["pdf"], "dos.pdf", { type: "application/pdf" })]);
    await app.user.type(screen.getByRole("textbox", { name: "Tu consulta" }), "Leé los archivos");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(app.requests).toHaveLength(1));
    expect(versions).toEqual(["1", "4"]);
    expect(new Set(keys).size).toBe(2);
    expect(app.requests[0]).toEqual({ text: "Leé los archivos", attachmentIds: ["attachment-4", "attachment-7"], conversationVersion: 7 });
    expect(screen.queryByRole("button", { name: "Quitar uno.pdf" })).not.toBeInTheDocument();
  });

  it("limita adjuntos temprano y revoca la vista previa al quitar y al limpiar Query", async () => {
    const app = setup();
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const input = screen.getByLabelText("Adjuntar", { selector: "input" });
    const file = new File(["image"], "foto.png", { type: "image/png" });
    await app.user.upload(input, file);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    await app.user.click(screen.getByRole("button", { name: "Quitar foto.png" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private");
    await app.user.upload(input, file);
    act(() => app.queryClient.clear());
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(screen.queryByAltText("foto.png")).not.toBeInTheDocument();
  });

  it("retiene el PDF excesivo, impide toda escritura y permite enviar el PNG al quitarlo", async () => {
    const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
    vi.stubGlobal("FormData", nativeForm.constructor);
    vi.stubGlobal("File", FetchFile);
    const app = setup();
    const uploads: { name: string; size: number; version: string; key: string | null }[] = [];
    let version = 1;
    server.use(http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.json({ ...detail(), conversation: { ...detail().conversation, version } })),
      http.post("/api/organization/assistant/conversations/chat/attachments", async ({ request }) => {
        const body = await request.formData();
        const file = body.get("file") as File;
        uploads.push({ name: file.name, size: file.size, version: String(body.get("conversationVersion")), key: request.headers.get("Idempotency-Key") });
        version = 4;
        const attachment: AssistantAttachmentSummaryResponse = { id: "png", fileName: file.name, mediaType: file.type, byteLength: file.size, version: 999 };
        return HttpResponse.json(attachment);
      }));
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const input = screen.getByLabelText("Adjuntar", { selector: "input" });
    const png = new File(["png"], "captura.png", { type: "image/png" });
    const pdf = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "planilla.pdf", { type: "application/pdf" });
    await app.user.upload(input, [png, pdf]);
    const removePdf = screen.getByRole("button", { name: "Quitar planilla.pdf" });
    expect(screen.getByRole("button", { name: "Quitar captura.png" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("planilla.pdf pesa más de 10 MB.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(removePdf.closest("li")).toHaveAccessibleDescription("planilla.pdf pesa más de 10 MB.");
    expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
    expect(await axe(app.container)).toHaveNoViolations();
    await app.user.type(screen.getByRole("textbox", { name: "Tu consulta" }), "Leé la captura");
    expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(app.created()).toBe(0);
    expect(uploads).toEqual([]);
    expect(app.requests).toEqual([]);
    await app.user.upload(input, new File(["pdf"], "otra.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("alert")).toHaveTextContent("planilla.pdf pesa más de 10 MB.");
    await app.user.click(screen.getByRole("button", { name: "Quitar otra.pdf" }));
    await app.user.click(removePdf);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid", "true");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(app.requests).toHaveLength(1));
    expect(app.created()).toBe(1);
    expect(uploads).toEqual([{ name: "captura.png", size: 3, version: "1", key: expect.any(String) }]);
    expect(app.requests[0]).toEqual({ text: "Leé la captura", attachmentIds: ["png"], conversationVersion: 4 });
  });

  it("acepta exactamente 10 MiB, conserva el máximo de cinco y limpia inválidos al cambiar de conversación", async () => {
    const app = setup();
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const input = screen.getByLabelText("Adjuntar", { selector: "input" });
    await app.user.upload(input, new File([new Uint8Array(10 * 1024 * 1024)], "limite.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("button", { name: "Quitar limite.pdf" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await app.user.upload(input, Array.from({ length: 4 }, (_, i) => new File(["pdf"], `${i}.pdf`, { type: "application/pdf" })));
    await app.user.upload(input, new File([new Uint8Array(10 * 1024 * 1024 + 1)], "sexto.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Podés adjuntar hasta 5 archivos.");
    expect(screen.queryByRole("button", { name: "Quitar sexto.pdf" })).not.toBeInTheDocument();
    await app.user.click(screen.getByRole("button", { name: "Nueva conversación" }));
    await app.user.upload(screen.getByLabelText("Adjuntar", { selector: "input" }), [new File(["png"], "privada.png", { type: "image/png" }), new File([new Uint8Array(10 * 1024 * 1024 + 1)], "privado.pdf", { type: "application/pdf" })]);
    expect(screen.getByRole("alert")).toHaveTextContent("privado.pdf");
    await app.user.upload(screen.getByLabelText("Adjuntar", { selector: "input" }), new File([new Uint8Array(10 * 1024 * 1024 + 1)], "otro-privado.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("button", { name: "Quitar otro-privado.pdf" }).closest("li")).toHaveAccessibleDescription("otro-privado.pdf pesa más de 10 MB.");
    await app.user.click(screen.getByRole("button", { name: "Quitar privado.pdf" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/^otro-privado\.pdf pesa más de 10 MB\.$/u);
    await app.user.click(screen.getByRole("button", { name: "Nueva conversación" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar privado.pdf" })).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private");
    expect(app.created()).toBe(0);
  });

  it("no retiene MIME rechazados aunque el exceso oculte invalidType en la validación del lote", async () => {
    const app = setup();
    await screen.findByRole("textbox", { name: "Tu consulta" });
    await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText("Adjuntar", { selector: "input" }), [
      new File(["png"], "permitido.png", { type: "image/png" }),
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "rechazado.exe", { type: "application/octet-stream" }),
    ]);
    expect(screen.getByRole("alert")).toHaveTextContent("El archivo pesa más de 10 MB.");
    expect(screen.queryByRole("button", { name: "Quitar rechazado.exe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar permitido.png" })).not.toBeInTheDocument();
    expect(app.created()).toBe(0);
    expect(app.requests).toEqual([]);
  });

  it("conserva el aviso de máximo cinco además del error nombrado del inválido retenido", async () => {
    const app = setup();
    await screen.findByRole("textbox", { name: "Tu consulta" });
    const input = screen.getByLabelText("Adjuntar", { selector: "input" });
    await app.user.upload(input, [new File([new Uint8Array(10 * 1024 * 1024 + 1)], "excesivo.pdf", { type: "application/pdf" }),
      ...Array.from({ length: 4 }, (_, i) => new File(["pdf"], `${i}.pdf`, { type: "application/pdf" }))]);
    await app.user.upload(input, new File(["pdf"], "sexto.pdf", { type: "application/pdf" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Podés adjuntar hasta 5 archivos.");
    expect(screen.getByRole("alert")).toHaveTextContent("excesivo.pdf pesa más de 10 MB.");
    expect(screen.queryByRole("button", { name: "Quitar sexto.pdf" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar excesivo.pdf" }).closest("li")).toHaveAccessibleDescription("excesivo.pdf pesa más de 10 MB.");
    expect(app.created()).toBe(0);
    expect(app.requests).toEqual([]);
  });

  it("renombrar conserva la versión original aunque el historial cambie mientras se edita", async () => {
    const app = setup();
    app.changeDetail(detail());
    (await screen.findByRole("button", { name: "Acciones de Mi consulta" })).focus();
    await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("menuitem", { name: "Renombrar: Mi consulta" }));
    app.changeDetail({ ...detail(), conversation: { ...detail().conversation, version: 9 } });
    await act(async () => { await app.queryClient.invalidateQueries({ queryKey: ["assistant", "business", "org", "user", "conversations"] }); });
    let body: unknown;
    server.use(http.put("/api/organization/assistant/conversations/chat", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 10 }); }));
    await app.user.clear(screen.getByRole("textbox", { name: "Nombre" }));
    await app.user.type(screen.getByRole("textbox", { name: "Nombre" }), "Otro nombre");
    await app.user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(body).toEqual({ title: "Otro nombre", version: 1 }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("Stop visible al reabrir no oculta un rechazo de persistencia", async () => {
    const app = setup();
    app.changeDetail({ ...detail(), activeTurnId: "turn", messages: { items: [message("u", "user", "Consulta"), message("a", "assistant", "Parcial", "Generating")], hasMore: false } });
    server.use(http.post("/api/organization/assistant/conversations/chat/turns/turn/stop", () => HttpResponse.json({ code: "Assistant.Turn.StopFailed", detail: "No se pudo detener." }, { status: 409 })));
    await app.user.click(await screen.findByRole("button", { name: "Mi consulta" }));
    await screen.findByText("Parcial");
    await app.user.click(await screen.findByRole("button", { name: "Detener" }));
    await screen.findByText("No se pudo detener.");
    expect(screen.getByText("Parcial")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Detener" })).toBeEnabled();
  });

  it("Retry de red conserva cuerpo y clave; respuesta Failed exige una nueva operación sin adjuntos", async () => {
    const app = setup();
    const bodies: unknown[] = [];
    const keys: Array<string | null> = [];
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", async ({ request }) => {
      bodies.push(await request.json()); keys.push(request.headers.get("Idempotency-Key"));
      if (keys.length === 1) return HttpResponse.error();
      const answer = message("a", "assistant", "No se pudo terminar", "Failed");
      app.changeDetail({ ...detail(), conversation: { ...detail().conversation, version: 5 }, messages: { items: [message("u", "user", "Consulta original"), answer], hasMore: false } });
      const result: AssistantTurnResultResponse = { turnId: "turn", message: answer, conversationVersion: 5, usage: { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, cost: { amount: 0, currency: "USD" }, remainingMessages: 39 } };
      return HttpResponse.json(result);
    }));
    await app.user.type(await screen.findByRole("textbox", { name: "Tu consulta" }), "Consulta original");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(keys).toHaveLength(1));
    // Es el mismo mecanismo del aviso global: MutationCache ejecuta sus variables originales.
    const failedNetwork = app.queryClient.getMutationCache().getAll().find((mutation) => mutation.state.status === "error");
    expect(failedNetwork).toBeDefined();
    await act(async () => { await failedNetwork!.execute(failedNetwork!.state.variables); });
    expect(keys[1]).toBe(keys[0]); expect(bodies[1]).toEqual(bodies[0]);
    await screen.findByText("No se pudo terminar");
    await app.user.click(within(screen.getByRole("region", { name: "Asistente" })).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(keys).toHaveLength(3));
    expect(keys[2]).not.toBe(keys[0]);
    expect(bodies[2]).toEqual({ text: "Consulta original", attachmentIds: [], conversationVersion: 5 });
  });

  it("una consulta fija tardía no selecciona ni repuebla otro acceso", async () => {
    const app = setup();
    let release!: () => void;
    let requested = false;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.post("/api/organization/assistant/quick/active_users", async () => {
      requested = true; await gate;
      const response: AssistantQuickResponse = { conversation: detail().conversation, messages: [], result: { text: "Privado anterior", links: [], data: { people: [], totalCount: 0, hasMore: false } } };
      return HttpResponse.json(response);
    }), http.get("/api/me/assistant", () => HttpResponse.json({ ...state, quickQueries: [] })),
    http.get("/api/me/assistant/conversations", () => HttpResponse.json({ items: [], hasMore: false })));
    await app.user.click(await screen.findByRole("button", { name: "Usuarios activos" }));
    await waitFor(() => expect(requested).toBe(true));
    app.rerenderAssistant({ ...props, scope: { access: "consumer", userId: "another", tenantId: null } });
    await act(async () => { release(); await gate; });
    expect(screen.queryByText("Privado anterior")).not.toBeInTheDocument();
    expect(app.queryClient.getQueriesData({ queryKey: ["assistant", "business", "org", "user"] })).toEqual([]);
  });
});

it("borrar una conversación del historial invalida su Retry anterior de exportación", async () => {
  const app = setup();
  app.changeDetail(detail());
  let exports = 0;
  let deleted = false;
  server.use(http.get("/api/organization/assistant/conversations/chat/export", () => {
    exports++;
    return exports === 1 ? HttpResponse.error() : new HttpResponse("private", { headers: { "content-type": "text/markdown" } });
  }), http.delete("/api/organization/assistant/conversations/chat", () => { deleted = true; return new HttpResponse(null, { status: 204 }); }),
  http.get("/api/organization/assistant/conversations", ({ request }) => HttpResponse.json({ items: !deleted && new URL(request.url).searchParams.get("saved") === "false" ? [detail().conversation] : [], hasMore: false })));
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  (await screen.findByRole("button", { name: "Acciones de Mi consulta" })).focus();
  await app.user.keyboard("{Enter}");
  await app.user.click(await screen.findByRole("menuitem", { name: "Exportar en Markdown: Mi consulta" }));
  await waitFor(() => expect(app.queryClient.getMutationCache().getAll().some((mutation) => mutation.state.status === "error")).toBe(true));
  const oldExport = app.queryClient.getMutationCache().getAll().find((mutation) => mutation.state.status === "error")!;
  screen.getByRole("button", { name: "Acciones de Mi consulta" }).focus();
  await app.user.keyboard("{Enter}");
  await app.user.click(await screen.findByRole("menuitem", { name: "Borrar: Mi consulta" }));
  await app.user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Borrar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(deleted).toBe(true);
  await act(async () => { await oldExport.execute(oldExport.state.variables).catch(() => {}); });
  expect.soft(exports).toBe(1);
  expect.soft(URL.createObjectURL).not.toHaveBeenCalled();
});

it("borrar invalida un Blob tardío antes de releer historial y conserva el otro turno abierto", async () => {
  const app = setup();
  const other: AssistantConversationResponse = { ...detail(), conversation: { ...detail().conversation, id: "other", title: "Otra consulta" },
    activeTurnId: "other-turn", messages: { items: [message("other-answer", "assistant", "Parcial de otra conversación", "Generating")], hasMore: false } };
  let exports = 0;
  let deleted = false;
  let releaseDelete!: () => void;
  let releaseHistory!: () => void;
  let releaseBlob!: (blob: Blob) => void;
  const deleteGate = new Promise<void>((resolve) => { releaseDelete = resolve; });
  const historyGate = new Promise<void>((resolve) => { releaseHistory = resolve; });
  const blobGate = new Promise<Blob>((resolve) => { releaseBlob = resolve; });
  let blobStarted = false;
  const originalBlob = Response.prototype.blob;
  const blobSpy = vi.spyOn(Response.prototype, "blob").mockImplementation(function (this: Response) {
    if (this.headers.get("content-type") === "text/markdown") { blobStarted = true; return blobGate; }
    return originalBlob.call(this);
  });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  server.use(http.get("/api/organization/assistant/conversations/other", () => HttpResponse.json(other)),
    http.get("/api/organization/assistant/conversations", async ({ request }) => {
      if (deleted) await historyGate;
      return HttpResponse.json({ items: new URL(request.url).searchParams.get("saved") === "false" ? deleted ? [other.conversation] : [detail().conversation, other.conversation] : [], hasMore: false });
    }), http.get("/api/organization/assistant/conversations/chat/export", () => {
      exports++;
      return exports === 1 ? HttpResponse.error() : new HttpResponse("private", { headers: { "content-type": "text/markdown" } });
    }), http.delete("/api/organization/assistant/conversations/chat", async () => { await deleteGate; deleted = true; return new HttpResponse(null, { status: 204 }); }));
  try {
    await app.user.click(await screen.findByRole("button", { name: "Otra consulta" }));
    await screen.findByText("Parcial de otra conversación");
    screen.getByRole("button", { name: "Acciones de Mi consulta" }).focus();
    await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("menuitem", { name: "Exportar en Markdown: Mi consulta" }));
    await waitFor(() => expect(app.queryClient.getMutationCache().getAll().some((mutation) => mutation.state.status === "error")).toBe(true));
    const oldExport = app.queryClient.getMutationCache().getAll().find((mutation) => mutation.state.status === "error")!;
    screen.getByRole("button", { name: "Acciones de Mi consulta" }).focus();
    await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("menuitem", { name: "Borrar: Mi consulta" }));
    await app.user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Borrar" }));
    let replay!: Promise<unknown>;
    act(() => { replay = oldExport.execute(oldExport.state.variables).catch((error: unknown) => error); });
    await waitFor(() => expect(blobStarted).toBe(true));
    act(() => releaseDelete());
    await waitFor(() => expect(deleted).toBe(true));
    // DELETE ya confirmó, pero invalidar el historial aún no terminó.
    await act(async () => { releaseBlob(new Blob(["private"])); await replay; });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    act(() => releaseHistory());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Parcial de otra conversación")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Detener" })).toBeEnabled();
  } finally { releaseDelete(); releaseHistory(); releaseBlob(new Blob()); blobSpy.mockRestore(); click.mockRestore(); }
});


it("DELETE confirmado cierra el runtime seleccionado antes de releer el historial", async () => {
  const app = setup();
  app.changeDetail(detail());
  let sends = 0;
  let deleted = false;
  let historyStarted = false;
  let releaseHistory!: () => void;
  const historyGate = new Promise<void>((resolve) => { releaseHistory = resolve; });
  server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => { sends++; return HttpResponse.error(); }),
    http.delete("/api/organization/assistant/conversations/chat", () => { deleted = true; return new HttpResponse(null, { status: 204 }); }),
    http.get("/api/organization/assistant/conversations", async ({ request }) => {
      if (deleted) { historyStarted = true; await historyGate; }
      return HttpResponse.json({ items: !deleted && new URL(request.url).searchParams.get("saved") === "false" ? [detail().conversation] : [], hasMore: false });
    }));
  try {
    await app.user.click(await screen.findByRole("button", { name: "Mi consulta" }));
    await app.user.type(await screen.findByRole("textbox", { name: "Tu consulta" }), "Consulta privada");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(app.queryClient.getMutationCache().getAll().some((mutation) => mutation.meta?.assistantOwner && mutation.state.status === "error")).toBe(true));
    const oldSend = app.queryClient.getMutationCache().getAll().find((mutation) => mutation.meta?.assistantOwner && mutation.state.status === "error")!;
    screen.getByRole("button", { name: "Acciones de Mi consulta" }).focus();
    await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("menuitem", { name: "Borrar: Mi consulta" }));
    await app.user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Borrar" }));
    await waitFor(() => expect(historyStarted).toBe(true));
    expect(deleted).toBe(true);
    await act(async () => { await oldSend.execute(oldSend.state.variables).catch(() => {}); });
    expect(sends).toBe(1);
  } finally { act(() => releaseHistory()); }
});

