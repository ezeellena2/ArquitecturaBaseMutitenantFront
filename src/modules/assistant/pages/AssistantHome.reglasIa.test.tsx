import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { File as FetchFile } from "node:buffer";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { server } from "@/test/mocks/server";
import { resetHttpClient } from "@/shared/api/httpClient";
import { AppChromeProvider } from "@/shared/ui/app/AppChrome";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import type { AssistantConversationResponse, AssistantConversationSummaryResponse, AssistantStateResponse } from "@/modules/assistant/api/types";
import { AssistantHome, type AssistantHomeProps } from "./AssistantHome";
import { AssistantPhonePage } from "./AssistantPhonePage";

// Las reglas de toda la IA sobre el Inicio (0064 §2, §4, §5 y §6): la conversación que no se puede leer, borrar con sus
// archivos y las subidas que el back frena antes de leer el archivo (tableros Asistente-Org, -Personal, -Plat y sus M-).
const state: AssistantStateResponse = { configured: true, canConfigure: true, models: [], quickQueries: [], dailyLimit: 50,
  dailyResetAtUtc: "2026-10-10T21:00:00Z", remainingMessages: 40, noticeVersion: "v1", noticeAccepted: true, retentionDays: 30, maxAttachmentBytes: 10 * 1024 * 1024, maxAttachments: 5, monthlyBudgetProgress: null };
const unreadable: AssistantConversationSummaryResponse = { id: "nd", title: null, version: 7, isSaved: false, createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z", available: false };
const chat = (): AssistantConversationResponse => ({ conversation: { id: "chat", title: "Mi consulta", version: 1, isSaved: false, createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z", available: true }, messages: { items: [], hasMore: false }, activeTurnId: null });
const props: AssistantHomeProps = { scope: { access: "business", userId: "user", tenantId: "org" }, enabled: true, hasPermission: () => true, onPrivacy: () => {} };

function setup(phone = false, conversations: AssistantConversationSummaryResponse[] = [unreadable]) {
  server.use(http.get("/api/organization/assistant", () => HttpResponse.json(state)),
    http.get("/api/organization/assistant/conversations", ({ request }) => HttpResponse.json({ items: new URL(request.url).searchParams.get("saved") === "true" ? [] : conversations, hasMore: false })),
    http.post("/api/organization/assistant/conversations", () => HttpResponse.json(chat().conversation)),
    http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.json(chat())));
  const view = <MemoryRouter><AppChromeProvider value={{ phone, parent: null, subtitle: null, hideBottomNav: () => {} }}>{phone ? <AssistantPhonePage {...props} /> : <AssistantHome {...props} />}</AppChromeProvider></MemoryRouter>;
  return { ...renderWithProviders(view), user: userEvent.setup() };
}
beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); Element.prototype.scrollTo = vi.fn(); URL.createObjectURL = vi.fn(() => "blob:private"); URL.revokeObjectURL = vi.fn(); });
afterEach(() => { resetHttpClient(); vi.unstubAllGlobals(); });

describe("las reglas de toda la IA en el Inicio", () => {
  it.each([false, true])("la conversación no disponible se ve con su título genérico, sin caja, y solo se puede borrar con sus archivos; teléfono %s", async (phone) => {
    const reads: string[] = []; const versions: Array<string | null> = [];
    server.use(http.get("/api/organization/assistant/conversations/nd", () => { reads.push("nd"); return HttpResponse.json({ code: "Assistant.Conversation.Unavailable", detail: "Esta conversación no está disponible. Podés borrarla.", traceId: "t" }, { status: 409 }); }),
      http.delete("/api/organization/assistant/conversations/nd", ({ request }) => { versions.push(new URL(request.url).searchParams.get("version")); return new HttpResponse(null, { status: 204 }); }));
    const app = setup(phone);
    if (phone) await app.user.click(await screen.findByRole("button", { name: "Conversaciones" }));
    await app.user.click(await screen.findByRole("button", { name: "Conversación no disponible" }));
    expect(await screen.findByText("No pudimos abrir esta conversación. Podés borrarla.")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos abrir esta conversación. Podés borrarla.");
    expect(screen.queryByRole("textbox", { name: "Tu consulta" })).not.toBeInTheDocument();
    if (!phone) expect(await axe(app.container)).toHaveNoViolations();
    if (phone) await app.user.click(screen.getByRole("button", { name: "Conversaciones" }));
    const kebab = await screen.findByRole("button", { name: "Acciones de Conversación no disponible" });
    if (phone) await app.user.click(kebab); else { kebab.focus(); await app.user.keyboard("{Enter}"); }
    const options = phone ? within(await screen.findByRole("menu")).getAllByRole("menuitem") : await screen.findAllByRole("menuitem");
    expect(options.map((option) => option.textContent)).toEqual(["Borrar"]);
    const reading = reads.length;
    await app.user.click(options[0]!);
    const dialog = await screen.findByRole("alertdialog", { name: "¿Borrar «Conversación no disponible»?" }).catch(() => screen.findByRole("dialog", { name: "¿Borrar «Conversación no disponible»?" }));
    expect(within(dialog).getByText("Se borra para siempre. Se borran también sus archivos.")).toBeVisible();
    expect(reads).toHaveLength(reading);
    await app.user.click(within(dialog).getByRole("button", { name: "Borrar" }));
    await waitFor(() => expect(versions).toEqual(["7"]));
    await waitFor(() => expect(screen.queryByText("No pudimos abrir esta conversación. Podés borrarla.")).not.toBeInTheDocument());
  }, 15_000);

  it("borrar una conversación que se puede leer también avisa que se van sus archivos", async () => {
    const app = setup(false, [chat().conversation]);
    (await screen.findByRole("button", { name: "Acciones de Mi consulta" })).focus(); await app.user.keyboard("{Enter}");
    await app.user.click(await screen.findByRole("menuitem", { name: "Borrar: Mi consulta" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Borrar «Mi consulta»?" }).catch(() => screen.findByRole("alertdialog", { name: "¿Borrar «Mi consulta»?" }));
    expect(within(dialog).getByText("Se borra para siempre. Se borran también sus archivos.")).toBeVisible();
  });

  it.each([
    ["Assistant.Limit.DailyReached", 429, "Llegaste a las 50 consultas de hoy. Se renuevan a las 21:00."],
    ["Assistant.Attachment.UploadBusy", 429, "Ya estás subiendo un archivo. Esperá a que termine."],
    ["Assistant.Attachment.UploadQueueFull", 429, "Hay muchos archivos subiéndose ahora. Probá de nuevo en un momento."],
    ["Assistant.Attachment.UploadTimedOut", 400, "El archivo tardó demasiado en subir. Probá de nuevo."],
  ] as const)("la subida que frena %s dice «Subiendo…» mientras espera y después su motivo debajo de la caja, sin mandar la consulta", async (code, status, detail) => {
    const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
    vi.stubGlobal("FormData", nativeForm.constructor); vi.stubGlobal("File", FetchFile);
    let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve; }); let sent = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/attachments", async () => { await gate; return HttpResponse.json({ code, detail, traceId: "t", retryAfter: 30 }, { status, headers: status === 429 ? { "Retry-After": "30" } : {} }); }),
      http.post("/api/organization/assistant/conversations/chat/messages", () => { sent++; return HttpResponse.json({}); }));
    const app = setup(false, []);
    const input = await screen.findByRole("textbox", { name: "Tu consulta" });
    await app.user.upload(screen.getByLabelText("Adjuntar imágenes o PDF", { selector: "input" }), new File(["pdf"], "uno.pdf", { type: "application/pdf" }));
    await app.user.type(input, "Revisá el archivo");
    await app.user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Subiendo…")).toBeVisible();
    await act(async () => { release(); });
    expect(await screen.findByText(detail)).toBeVisible();
    expect(screen.queryByText("Subiendo…")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tu consulta" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Quitar uno.pdf" })).toBeVisible();
    expect(screen.queryByText(/Hiciste muchas consultas seguidas/u)).not.toBeInTheDocument();
    expect(sent).toBe(0);
  });
});
