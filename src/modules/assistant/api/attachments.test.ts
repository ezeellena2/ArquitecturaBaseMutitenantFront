import { File as FetchFile } from "node:buffer";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { configureHttpClient, resetHttpClient } from "@/shared/api/httpClient";
import { deleteAssistantAttachment, downloadAssistantAttachment, uploadAssistantAttachment } from "./attachments";
import { exportAssistantConversation } from "./export";
import type { AssistantScope } from "./assistant";

const scope: AssistantScope = { access: "consumer", tenantId: null, userId: "person" };
afterEach(() => { resetHttpClient(); vi.unstubAllGlobals(); });

describe("Assistant archivos privados", () => {
  it("sube un archivo con conversationVersion, conserva key/cuerpo tras renovar y recibe versión de adjunto", async () => {
    vi.stubGlobal("File", FetchFile);
    const fixture = await new Request("http://localhost/form", { method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=fixture" },
      body: '--fixture\r\nContent-Disposition: form-data; name="file"; filename="image.png"\r\nContent-Type: image/png\r\n\r\nbytes\r\n--fixture--\r\n',
    }).formData();
    vi.stubGlobal("FormData", fixture.constructor);
    const file = fixture.get("file");
    if (!file || typeof file === "string") throw new Error("Missing fixture file");
    const seen: unknown[] = [];
    server.use(http.post("/api/me/assistant/conversations/chat/attachments", async ({ request }) => {
      const form = await request.formData();
      const uploaded = form.get("file");
      if (!uploaded || typeof uploaded === "string") throw new Error("Missing upload file");
      seen.push({ authorization: request.headers.get("authorization"), key: request.headers.get("idempotency-key"),
        contentType: request.headers.get("content-type"), version: form.get("conversationVersion"), file: uploaded.name,
        bytes: await uploaded.text(), fields: [...form.keys()] });
      return seen.length === 1 ? HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })
        : HttpResponse.json({ id: "attachment", version: 91 }, { status: 201 });
    }));
    configureHttpClient({ getAccessToken: () => "old", renewAccessToken: async () => "new" });
    await expect(uploadAssistantAttachment(scope, "chat", { file, conversationVersion: 7 }, "upload-key")).resolves.toEqual({ id: "attachment", version: 91 });
    expect(seen).toEqual(["old", "new"].map((token) => ({ authorization: `Bearer ${token}`, key: "upload-key",
      contentType: expect.stringMatching(/^multipart\/form-data; boundary=/), version: "7", file: "image.png",
      bytes: "bytes", fields: ["file", "conversationVersion"] })));
  });

  it("descarga y exporta mediante Bearer, no-store y respuesta intacta; borra con versión query", async () => {
    const seen: unknown[] = [];
    server.use(http.all("/api/me/assistant/conversations/:id/*", async ({ request }) => {
      const url = new URL(request.url);
      seen.push({ method: request.method, path: url.pathname + url.search, bearer: request.headers.get("authorization"),
        cache: request.cache, accept: request.headers.get("accept"), body: await request.text() });
      return request.method === "DELETE" ? new HttpResponse(null, { status: 204 })
        : new HttpResponse("private-bytes", { headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="result.pdf"' } });
    }));
    configureHttpClient({ getAccessToken: () => "private" });
    const attachment = await downloadAssistantAttachment(scope, "chat/a", "attachment/a");
    const exported = await exportAssistantConversation(scope, "chat/a", { format: "pdf" });
    expect(attachment.bodyUsed).toBe(false);
    expect(exported.bodyUsed).toBe(false);
    expect(await attachment.text()).toBe("private-bytes");
    expect(exported.headers.get("content-disposition")).toContain("result.pdf");
    await deleteAssistantAttachment(scope, "chat/a", "attachment/a", 91);
    expect(seen).toEqual([
      { method: "GET", path: "/api/me/assistant/conversations/chat%2Fa/attachments/attachment%2Fa", bearer: "Bearer private", cache: "no-store", accept: "image/png, image/jpeg, image/webp, application/pdf", body: "" },
      { method: "GET", path: "/api/me/assistant/conversations/chat%2Fa/export?format=pdf", bearer: "Bearer private", cache: "no-store", accept: "text/markdown, application/pdf", body: "" },
      { method: "DELETE", path: "/api/me/assistant/conversations/chat%2Fa/attachments/attachment%2Fa?version=91", bearer: "Bearer private", cache: "default", accept: "application/json", body: "" },
    ]);
  });

  it("transporta errores privados por code y permite cancelar antes del envío", async () => {
    server.use(http.get("/api/me/assistant/conversations/chat/export", () => HttpResponse.json({ code: "Assistant.Conversation.NotFound", traceId: "trace" }, { status: 404 })));
    await expect(exportAssistantConversation(scope, "chat", {})).rejects.toMatchObject({ status: 404, code: "Assistant.Conversation.NotFound", traceId: "trace" });
    const controller = new AbortController(); controller.abort();
    await expect(downloadAssistantAttachment(scope, "chat", "file", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    await expect(exportAssistantConversation(scope, "chat", {}, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});
