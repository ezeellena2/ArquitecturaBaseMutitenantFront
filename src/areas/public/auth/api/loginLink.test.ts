import { HttpResponse, http } from "msw";
import { expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { previewLoginLink, redeemLoginLink } from "./loginLink";

it("previsualiza sin consumo y continúa como persona; token sólo en el cuerpo y clave del caller", async () => {
  const calls: Array<{ url: string; body: unknown; key: string | null }> = [];
  server.use(
    http.post("/api/auth/login-link/preview", async ({ request }) => {
      calls.push({ url: request.url, body: await request.json(), key: request.headers.get("Idempotency-Key") });
      return HttpResponse.json({ displayName: "Ana", maskedPhone: "+54 •••• 6789" });
    }),
    http.post("/api/auth/login-link/redeem", async ({ request }) => {
      calls.push({ url: request.url, body: await request.json(), key: request.headers.get("Idempotency-Key") });
      return HttpResponse.json({ access: "consumer" });
    }),
  );
  const token = "opaque-secret";
  await expect(previewLoginLink({ token })).resolves.toMatchObject({ displayName: "Ana" });
  await expect(redeemLoginLink({ token }, "attempt-key")).resolves.toEqual({ access: "consumer" });
  expect(calls.map((call) => ({ path: new URL(call.url).pathname, body: call.body, key: call.key }))).toEqual([
    { path: "/api/auth/login-link/preview", body: { token }, key: null },
    { path: "/api/auth/login-link/redeem", body: { token, access: "consumer" }, key: "attempt-key" },
  ]);
  expect(calls.every((call) => new URL(call.url).search === "" && !call.url.includes(token))).toBe(true);
});
