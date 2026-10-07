import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { ApiError } from "@/shared/api/ApiError";
import { updateMe } from "./account";
import { addLoginEmail, removeLoginMethod, makeLoginMethodPrimary, verifyLoginMethod, fetchLoginMethods, linkGoogle } from "@/shared/account/api/loginMethods";
import { requestAccountDeletion } from "./deletion";

describe("clientes de la cuenta", () => {
  it("vincula Google con antiforgery por header y contenido de protocolo", async () => {
    server.use(
      http.get("/api/auth/external/google/antiforgery", () => HttpResponse.json({ requestToken: "csrf" })),
      http.post("/api/me/external/google", async ({ request }) => {
        expect(request.headers.get("RequestVerificationToken")).toBe("csrf");
        expect(request.headers.get("Content-Type")).toBeNull();
        expect(await request.text()).toBe("");
        return HttpResponse.json({ redirectUrl: "https://accounts.google.com/authorize" });
      }),
    );
    await expect(linkGoogle()).resolves.toEqual({ redirectUrl: "https://accounts.google.com/authorize" });
  });

  it("envía la versión y conserva el error real de concurrencia", async () => {
    server.use(http.put("/api/me", async ({ request }) => {
      expect(await request.json()).toEqual({ displayName: "Persona", culture: "en-US", timeZoneId: "UTC", version: 42 });
      return HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 });
    }));
    await expect(updateMe({ displayName: "Persona", culture: "en-US", timeZoneId: "UTC", version: 42 })).rejects.toBeInstanceOf(ApiError);
  });

  it("verifica el correo nuevo con su código propio y cambia métodos y baja sin confirmación", async () => {
    const calls: Array<{ method: string; body: unknown; key: string | null }> = [];
    function reply(status = 204, body?: object) {
      return async ({ request }: { request: Request }) => {
        calls.push({ method: request.method, body: await request.text().then(text => text ? JSON.parse(text) : null), key: request.headers.get("Idempotency-Key") });
        return body ? HttpResponse.json(body, { status }) : new HttpResponse(null, { status });
      };
    }
    server.use(
      http.get("/api/me/login-methods", () => HttpResponse.json({ methods: [], canLinkGoogle: true })),
      http.post("/api/me/login-methods", reply(202, { methodId: "method-1", resendAfterSeconds: 60 })),
      http.post("/api/me/login-methods/method-1/verify", reply()),
      http.delete("/api/me/login-methods/method-1", reply()),
      http.put("/api/me/login-methods/method-1/primary", reply()),
      http.post("/api/me/deletion", reply(200, { scheduledForUtc: "2026-10-30T00:00:00Z" })),
    );
    expect((await fetchLoginMethods()).canLinkGoogle).toBe(true);
    await addLoginEmail({ email: "personal@example.test" }, "add-key");
    await verifyLoginMethod("method-1", { code: "123456" }, "verify-key");
    await removeLoginMethod("method-1");
    await makeLoginMethodPrimary("method-1");
    await requestAccountDeletion({ reason: "Ya no la uso" }, "deletion-key");
    expect(calls.map(call => call.key)).toEqual(["add-key", "verify-key", null, null, "deletion-key"]);
    expect(calls[0]).toEqual({ method: "POST", body: { email: "personal@example.test" }, key: "add-key" });
    expect(calls[2]).toEqual({ method: "DELETE", body: null, key: null });
  });
});
