import assert from "node:assert/strict";
import { test } from "node:test";
import { safeAuthenticationEvent } from "./e2e-completo-oidc.mjs";

const base = new URL("https://localtest.me:5174");
const reply = (path, location, status = 302) => ({ url: () => new URL(path, base).href, headers: () => ({ location }), status: () => status });
test("el diagnóstico conserva sólo el código de dominio y omite identidad, state, tokens y enlaces", () => {
  const result = safeAuthenticationEvent(reply("/connect/authorize?access=business&state=secreto", "/auth/callback?error=access_denied&error_description=Tenancy.Tenant.PendingApproval%7CNombre%20privado&code=secreto&state=secreto"), base);
  assert.deepEqual(result, { route: "/connect/authorize", status: 302, access: "business", error: "access_denied", domainCode: "Tenancy.Tenant.PendingApproval" });
  assert.equal(JSON.stringify(result).includes("secreto"), false);
  assert.equal(JSON.stringify(result).includes("privado"), false);
});
test("una descripción libre, retorno externo y errores arbitrarios no se publican", () => {
  assert.deepEqual(safeAuthenticationEvent(reply("/connect/authorize", "/auth/callback?error=privado&error_description=Nombre%20de%20persona"), base), { route: "/connect/authorize", status: 302 });
  assert.deepEqual(safeAuthenticationEvent(reply("/connect/authorize", "https://example.com/auth/callback?error=access_denied&error_description=Identity.Account.Suspended"), base), { route: "/connect/authorize", status: 302 });
  assert.equal(safeAuthenticationEvent(reply("https://example.com/connect/authorize", null), base), null);
  assert.equal(safeAuthenticationEvent(reply("/api/me", null), base), null);
  assert.deepEqual(safeAuthenticationEvent(reply("/connect/token?code=secreto", "/auth/callback?error=access_denied", 400), base), { route: "/connect/token", status: 400 });
});
