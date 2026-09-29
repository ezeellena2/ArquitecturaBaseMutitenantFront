import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { requestSignup, verifySignup } from "./signup";

describe("signup API", () => {
  it("envía aceptación explícita y clave tanto al pedir como al verificar", async () => {
    const calls: Array<{ path: string; body: unknown; key: string | null }> = [];
    server.use(
      http.post("/api/auth/signup", async ({ request }) => {
        calls.push({ path: "/api/auth/signup", body: await request.json(), key: request.headers.get("Idempotency-Key") });
        return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
      }),
      http.post("/api/auth/signup/verify", async ({ request }) => {
        calls.push({ path: "/api/auth/signup/verify", body: await request.json(), key: request.headers.get("Idempotency-Key") });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    expect(await requestSignup({ email: "ana@example.com", acceptedTerms: true }, "request-key"))
      .toEqual({ resendAfterSeconds: 60 });
    expect(await verifySignup({ email: "ana@example.com", code: "123456", acceptedTerms: true }, "verify-key")).toBeUndefined();
    expect(calls).toEqual([
      { path: "/api/auth/signup", body: { email: "ana@example.com", acceptedTerms: true }, key: "request-key" },
      { path: "/api/auth/signup/verify", body: { email: "ana@example.com", code: "123456", acceptedTerms: true }, key: "verify-key" },
    ]);
  });
});
