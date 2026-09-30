import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { ApiError } from "@/shared/api/ApiError";
import { updateMe } from "./account";
import { addLoginEmail, removeLoginMethod, makeLoginMethodPrimary, verifyLoginMethod, fetchLoginMethods, linkGoogle } from "./loginMethods";
import { requestReauth, verifyReauth } from "./reauth";
import { requestAccountDeletion } from "./deletion";

describe("clientes de la cuenta", () => {
  it("vincula Google con antiforgery por header y contenido de protocolo", async () => {
    server.use(
      http.get("/api/auth/external/google/antiforgery", () => HttpResponse.json({ requestToken: "csrf" })),
      http.post("/api/me/external/google", ({ request }) => {
        expect(request.headers.get("RequestVerificationToken")).toBe("csrf");
        expect(request.headers.get("Content-Type")).toBe("application/x-www-form-urlencoded");
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

  it("verifica un correo con su código propio y usa otro para quitar o elegir principal", async () => {
    const calls: Array<{ method: string; body: unknown; key: string | null }> = [];
    function reply(status = 204, body?: object) {
      return async ({ request }: { request: Request }) => {
        calls.push({ method: request.method, body: await request.json(), key: request.headers.get("Idempotency-Key") });
        return body ? HttpResponse.json(body, { status }) : new HttpResponse(null, { status });
      };
    }
    server.use(
      http.get("/api/me/login-methods", () => HttpResponse.json({ methods: [], canLinkGoogle: true })),
      http.post("/api/me/login-methods", reply(202, { methodId: "method-1", resendAfterSeconds: 60 })),
      http.post("/api/me/login-methods/method-1/verify", reply()),
      http.post("/api/me/reauth", reply(202, { sourceMethodId: "backup", destination: "pe•••@example.test", resendAfterSeconds: 60 })),
      http.post("/api/me/reauth/verify", reply(200, { reauthTicket: "opaque" })),
      http.delete("/api/me/login-methods/method-1", reply()),
      http.put("/api/me/login-methods/method-1/primary", reply()),
      http.post("/api/me/deletion", reply(200, { scheduledForUtc: "2026-10-30T00:00:00Z" })),
    );
    expect((await fetchLoginMethods()).canLinkGoogle).toBe(true);
    await addLoginEmail({ email: "personal@example.test" }, "add-key");
    await verifyLoginMethod("method-1", { code: "123456" }, "verify-key");
    await requestReauth({ action: "RemoveMethod", targetMethodId: "method-1" }, "reauth-key");
    await verifyReauth({ action: "RemoveMethod", targetMethodId: "method-1", sourceMethodId: "backup", code: "654321" }, "proof-key");
    await removeLoginMethod("method-1", { reauthTicket: "opaque" });
    await makeLoginMethodPrimary("method-1", { reauthTicket: "opaque" });
    await requestAccountDeletion({ reason: "Ya no la uso", reauthTicket: "opaque" }, "deletion-key");
    expect(calls.map(call => call.key)).toEqual(["add-key", "verify-key", "reauth-key", "proof-key", null, null, "deletion-key"]);
    expect(calls[4]).toEqual({ method: "DELETE", body: { reauthTicket: "opaque" }, key: null });
  });
});
