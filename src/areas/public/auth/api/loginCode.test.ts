import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { requestLoginCode, verifyLoginCode } from "./loginCode";

describe("loginCode API", () => {
  it("pide un código con la misma respuesta para cualquier correo y clave de idempotencia", async () => {
    const requests: Array<{ email: string; key: string | null }> = [];
    server.use(http.post("/api/auth/login-code", async ({ request }) => {
      const body = await request.json() as { email: string };
      requests.push({ email: body.email, key: request.headers.get("Idempotency-Key") });
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }));

    const known = await requestLoginCode("ana@example.com", "key-known");
    const unknown = await requestLoginCode("nadie@example.com", "key-unknown");

    expect(known).toEqual({ resendAfterSeconds: 60 });
    expect(unknown).toEqual(known);
    expect(requests).toEqual([
      { email: "ana@example.com", key: "key-known" },
      { email: "nadie@example.com", key: "key-unknown" },
    ]);
  });

  it("verifica el código y retorno con una sola petición autenticadora", async () => {
    let submitted: unknown;
    server.use(http.post("/api/auth/login-code/verify", async ({ request }) => {
      submitted = await request.json();
      expect(request.headers.get("Idempotency-Key")).toBe("verify-key");
      return HttpResponse.json({ returnUrl: "/" });
    }));

    await expect(verifyLoginCode({ email: "ana@example.com", code: "123456", returnUrl: "/" }, "verify-key"))
      .resolves.toEqual({ returnUrl: "/" });
    expect(submitted).toEqual({ email: "ana@example.com", code: "123456", returnUrl: "/" });
  });
});
