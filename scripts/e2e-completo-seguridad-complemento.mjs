import assert from "node:assert/strict";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { syntheticEmail, requireSyntheticEmail } from "./e2e-completo-soporte.mjs";
import { completeOperatorFactor, confirmRecentAuthentication, factorKeeper, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { preparePermissions, watchResponses, isOperatorWrite } from "./test-e2e-real-e9.mjs";

const source = "scripts/e2e-completo-seguridad-complemento.mjs";
const definition = (number, actor, action, route, expected, covers = []) => ({ id: `SEC-${String(number).padStart(2, "0")}`, area: "Complemento de seguridad", actor, action, route, expected, covers, critical: true, source });
export const securitySupplementDefinitions = [
  definition(1, "Operador nuevo con todos los permisos", "Configurar MFA y comprobar el uso único de los códigos de recuperación", "/login · /plataforma", "El primer código permite ingresar; reutilizarlo responde400 RecoveryInvalid y conserva el ingreso; otro código completa la misma puerta.", ["BACK-PL-002"]),
  definition(2, "Operador con todos los permisos", "Cancelar dos veces Confirmá que sos vos con la prueba vencida", "/plataforma/cuentas/:id", "Ambos intentos responden403 con la misma Idempotency-Key, sin replay ni confirmación; cancelar conserva el motivo y la selección, y el destino no cambia.", ["BACK-PL-005"]),
  definition(3, "Operador nuevo con MFA", "Agotar diez intentos, recargar e intentar el código correcto", "/login", "Nueve400 Invalid y el décimo429 LockedOut; Retry-After coincide con retryAfter; tras F5 el código correcto recibe el mismo bloqueo y Verificar queda apagado.", ["BACK-ID-025"]),
  definition(4, "Operador sólo de Auditoría y operador sin pantalla permitida", "Abrir Inicio con cada permiso individual", "/plataforma · /plataforma/auditoria", "audit.read llega a la primera sección Auditoría; accounts.manage sin lectura permanece en Inicio con Sin permiso; ambos son operadores sin Personal ni organizaciones."),
];

// Estas dos ramas completan PL003 sólo junto a las siete pruebas ya existentes, nunca por sí solas.
export const securitySupplementProofGroups = {
  "BACK-PL-003": [["PLAT-01", "PLAT-02", "PLAT-03", "PLAT-04", "PLAT-05", "PLAT-06", "PLAT-07", "SEC-04"]],
};

async function requireProblem(response, status, code) {
  assert.equal(response.status(), status, `Se esperaba HTTP ${status}.`);
  const problem = await response.json();
  assert.equal(problem.code, code); assert.ok(typeof problem.traceId === "string" && problem.traceId.length > 0);
  return problem;
}
export const requireRecoveryRejected = (response) => requireProblem(response, 400, "Auth.TwoFactor.RecoveryInvalid");
async function requireLocked(response) {
  const problem = await requireProblem(response, 429, "Identity.Account.LockedOut");
  assert.ok(Number.isInteger(problem.retryAfter) && problem.retryAfter >= 1 && problem.retryAfter <= 900);
  assert.equal(response.headers()["retry-after"], String(problem.retryAfter));
}
export async function requireTenFailuresAndReload(attempts, afterReload) {
  assert.equal(attempts.length, 10, "El bloqueo debe llegar en el décimo fallo propio.");
  for (const attempt of attempts.slice(0, 9)) await requireProblem(attempt, 400, "Auth.TwoFactor.Invalid");
  await requireLocked(attempts[9]); await requireLocked(afterReload);
}
const permissionState = (account) => ({ id: account.id, state: account.state, operatorVersion: account.operatorVersion, permissions: account.operatorPermissions });
export function requireCancelledStepUp(writes, proofs, before, after) {
  assert.equal(writes.length, 2); assert.equal(proofs.length, 0, "Cancelar no debe confirmar el segundo factor.");
  assert.ok(before.id && Number.isInteger(before.operatorVersion) && before.operatorVersion >= 0 && Array.isArray(before.operatorPermissions));
  assert.ok(writes[0].key, "La UI debe conservar una clave de operación real.");
  for (const write of writes) {
    assert.equal(write.status, 403); assert.equal(write.code, "Auth.Platform.ReauthenticationRequired");
    assert.equal(write.key, writes[0].key); assert.notEqual(write.replayed, "true");
  }
  assert.deepEqual(permissionState(after), permissionState(before));
}
export function requireExclusivePlatformActor(me, permissions) {
  assert.equal(me.access, "platform"); assert.equal(me.activeTenantId, null); assert.equal(me.hasPersonalSpace, false);
  assert.deepEqual(me.organizations, []); assert.deepEqual([...me.effectivePermissions.platform].sort(), [...permissions].sort());
  assert.deepEqual(me.effectivePermissions.organization, []); assert.deepEqual(me.effectivePermissions.companies, {});
}

export async function prepareSecurityPermissions(page, name, toggle, reason) {
  // La lectura HTTP del arnés no espera que la ficha renderice sus acciones.
  // El helper original decide botón/menú después de esta barrera de UI real.
  const change = page.getByRole("button", { name: "Cambiar permisos", exact: true });
  const actions = page.getByRole("button", { name: `Acciones de ${name}`, exact: true });
  await change.or(actions).filter({ visible: true }).first().waitFor();
  return preparePermissions(page, name, toggle, reason);
}

const matches = (route, method = "POST") => (response) => new URL(response.url()).pathname === route && response.request().method() === method;
async function clickResponse(page, button, route, method = "POST") {
  const answered = page.waitForResponse(matches(route, method), { timeout: 90_000 }); void answered.catch(() => {});
  await button.click({ timeout: 90_000 }); return answered;
}
async function read(h, page, route) {
  const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json();
}
async function platformMe(h, page) {
  await page.waitForURL((url) => url.pathname.startsWith("/plataforma"));
  await page.locator('nav[aria-label="Secciones"], button[aria-haspopup="menu"]').filter({ visible: true }).first().waitFor();
  const me = await read(h, page, "/api/me"); assert.equal(me.access, "platform"); return me;
}
async function firstFactor(h, page, email) {
  requireSyntheticEmail(email); await page.goto(new URL("/plataforma", h.base).href);
  await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
  const before = new Set(await h.env.files());
  const sent = await sendWithCooldown(() => clickResponse(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code"));
  assert.equal(sent.status(), 202);
  await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
  await fillOtp(page, await h.env.code(email, before));
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  await page.getByRole("heading", { name: "Verificación en dos pasos", exact: true }).waitFor();
}

/** Toda persistencia de preparación sale de la UI; el único IPC corre el vencimiento de una prueba reciente propia. */
export async function runSecuritySupplementCases(h) {
  const page = await h.newPage(); const url = (route) => new URL(route, h.base).href;
  const seedEmail = h.width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test";
  let possibleSession = false; let currentEmail; let recovery; let lockout; let audit; let screenless;
  const run = (number, action) => h.record(`SEC-${String(number).padStart(2, "0")}`, () => page, action);

  const leave = async () => {
    await stopConfirmingRecentAuthentication(page);
    if (!possibleSession) return;
    // Navegar descarta sólo el formulario propio; permite salir también si un assert interrumpió un diálogo.
    await page.goto(url("/plataforma"));
    const original = page.viewportSize(); await page.setViewportSize({ width: 1440, height: 900 });
    try {
      const profile = page.getByRole("button", { name: /, Plataforma$/u }).filter({ visible: true }).first();
      const loginOrFactor = page.getByRole("textbox", { name: "Correo electrónico", exact: true })
        .or(page.getByRole("heading", { name: /^(Verificación en dos pasos|Protegé tu cuenta de operador)$/u }));
      await profile.or(loginOrFactor).filter({ visible: true }).first().waitFor();
      if (await profile.isVisible()) await h.signOut(page);
      // Un desafío de factor sin completar no es una sesión: se abandona sin tocar cookies.
      possibleSession = false; currentEmail = undefined;
    } finally { if (original) await page.setViewportSize(original); }
  };
  const login = async (email) => {
    await leave(); possibleSession = true; currentEmail = email; const me = await h.login(page, email, "platform"); return me;
  };
  const admin = async () => {
    const me = await login(recovery?.activated ? recovery.email : seedEmail);
    for (const permission of ["platform.operators.manage", "platform.accounts.read", "platform.accounts.manage"]) assert.ok(me.effectivePermissions.platform.includes(permission));
    return me;
  };
  const invite = async (label, permissionLabel) => {
    const email = syntheticEmail(label); requireSyntheticEmail(email);
    await page.goto(url("/plataforma/cuentas"));
    await page.getByRole("button", { name: "Invitar operador", exact: true }).filter({ visible: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "Invitar operador", exact: true });
    await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
    const picker = dialog.getByRole("button", { name: "Permisos de plataforma", exact: true });
    await picker.focus(); await picker.press("ArrowDown");
    const options = page.getByRole("menuitemcheckbox"); const count = await options.count(); assert.ok(count >= 14);
    if (permissionLabel === "all") {
      for (let index = 0; index < count; index++) if (await options.nth(index).getAttribute("aria-checked") !== "true") await options.nth(index).click();
    } else await page.getByRole("menuitemcheckbox", { name: permissionLabel, exact: true }).click();
    await page.keyboard.press("Escape");
    await stopConfirmingRecentAuthentication(page);
    const send = () => clickResponse(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/platform/operators/invitations");
    let response = await send();
    if (response.status() === 403) {
      await requireProblem(response, 403, "Auth.Platform.ReauthenticationRequired");
      const replay = page.waitForResponse((reply) => matches("/api/platform/operators/invitations")(reply) && reply.status() !== 403);
      void replay.catch(() => {}); await confirmRecentAuthentication(page, currentEmail); response = await replay;
    }
    assert.equal(response.status(), 201); const issued = await response.json(); assert.ok(issued.id);
    await dialog.waitFor({ state: "hidden" });
    const detail = await read(h, page, `/api/platform/accounts/${issued.id}`);
    assert.equal(detail.kind, "Operator"); assert.equal(detail.state, "Invited"); assert.equal(detail.hasPersonalSpace, false); assert.deepEqual(detail.organizations, []);
    if (permissionLabel === "all") assert.equal(detail.operatorPermissions.length, count);
    else assert.deepEqual(detail.operatorPermissions, [permissionLabel === "Ver la auditoría" ? "platform.audit.read" : "platform.accounts.manage"]);
    return { email, id: issued.id, permissions: detail.operatorPermissions, activated: false };
  };
  const ensureLockout = async () => {
    if (!lockout) { await admin(); lockout = await invite("mfa-bloqueo", "Ver la auditoría"); }
    if (!lockout.activated) {
      const me = await login(lockout.email); requireExclusivePlatformActor(me, lockout.permissions);
      assert.equal(factorKeeper.recoveryCodes(lockout.email).length, 8); lockout.activated = true;
      await leave();
    }
  };

  try {
    await run(1, async () => {
      await admin(); recovery = await invite("mfa-recupera", "all");
      const me = await login(recovery.email); requireExclusivePlatformActor(me, recovery.permissions);
      assert.equal(factorKeeper.recoveryCodes(recovery.email).length, 8); recovery.activated = true; await leave();
      // Los valores permanecen en factorKeeper y estas variables locales; nunca se devuelven ni se imprimen.
      const used = factorKeeper.recoveryCodes(recovery.email)[0];
      await firstFactor(h, page, recovery.email); possibleSession = true;
      assert.equal(await completeOperatorFactor(page, recovery.email, { recoveryCode: true, confirmWhenAsked: false }), "recoveryCode");
      assert.equal((await platformMe(h, page)).id, recovery.id); await leave();
      await firstFactor(h, page, recovery.email);
      const rejected = page.waitForResponse(matches("/api/auth/platform-factor/verify")); void rejected.catch(() => {});
      await completeOperatorFactor(page, recovery.email, { recoveryCode: used, confirmWhenAsked: false });
      await requireRecoveryRejected(await rejected);
      await page.getByText("Ese código no es válido o ya lo usaste.", { exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, "/login");
      await page.getByRole("textbox", { name: "Código de recuperación", exact: true }).fill(factorKeeper.takeRecoveryCode(recovery.email));
      possibleSession = true;
      const accepted = await clickResponse(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/platform-factor/verify");
      assert.equal(accepted.status(), 200); const recovered = await platformMe(h, page);
      assert.equal(recovered.id, recovery.id); requireExclusivePlatformActor(recovered, recovery.permissions);
      return "MFA real configurado; un código permitió ingresar, su reutilización falló400 RecoveryInvalid y otro código completó el ingreso de la misma cuenta.";
    });
    await run(2, async () => {
      await ensureLockout(); await admin();
      await page.goto(url(`/plataforma/cuentas/${lockout.id}`));
      const before = await read(h, page, `/api/platform/accounts/${lockout.id}`); assert.equal(before.state, "Active");
      await stopConfirmingRecentAuthentication(page);
      const expired = await h.env.command("recent-proof", { kind: "expire", email: currentEmail }); assert.ok(expired.expired >= 1);
      const reason = "Prueba propia: cancelar la confirmación sin guardar permisos.";
      const { form, picker, selection } = await prepareSecurityPermissions(page, before.displayName || lockout.email, 0, reason);
      const proofs = watchResponses(page, (method, path) => method === "POST" && path === "/api/platform/reauthentication");
      const writes = watchResponses(page, isOperatorWrite); const attempts = [];
      try {
        for (let attempt = 0; attempt < 2; attempt++) {
          const response = await clickResponse(page, form.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/platform/accounts/${lockout.id}/operator`, "PUT");
          const problem = await requireProblem(response, 403, "Auth.Platform.ReauthenticationRequired");
          const confirm = page.getByRole("dialog", { name: "Confirmá que sos vos", exact: true }); await confirm.waitFor();
          assert.equal(await form.isVisible(), false);
          await confirm.getByRole("button", { name: "Cancelar", exact: true }).click(); await confirm.waitFor({ state: "hidden" }); await form.waitFor();
          assert.equal(await form.getByRole("textbox", { name: /^Motivo/u }).inputValue(), reason); assert.equal(await picker.innerText(), selection);
          attempts.push({ status: response.status(), code: problem.code, key: response.request().headers()["idempotency-key"], replayed: response.headers()["idempotent-replayed"] });
        }
        const after = await read(h, page, `/api/platform/accounts/${lockout.id}`);
        assert.deepEqual(writes.statuses(), [403, 403]); requireCancelledStepUp(attempts, proofs.seen, before, after);
        // RecentPlatformProofFilter es de autorización; IdempotencyFilter reserva después, en resource execution.
        return "Dos403 ReauthenticationRequired con la misma clave y sin replay; cero confirmaciones; ambos Cancelar conservaron selección/motivo y el destino mantuvo permisos y versión.";
      } finally { writes.stop(); proofs.stop(); }
    });
    await run(3, async () => {
      await ensureLockout(); await leave(); await firstFactor(h, page, lockout.email);
      const verify = page.getByRole("button", { name: "Verificar", exact: true }); const attempts = [];
      for (let attempt = 1; attempt <= 10; attempt++) {
        await fillOtp(page, factorKeeper.invalidCode(lockout.email, attempt));
        const response = await clickResponse(page, verify, "/api/auth/platform-factor/verify"); attempts.push(response);
        if (attempt < 10) await requireProblem(response, 400, "Auth.TwoFactor.Invalid"); else await requireLocked(response);
      }
      await page.getByText("Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos.").first().waitFor();
      assert.equal(await verify.isDisabled(), true);
      await page.reload(); await page.getByRole("heading", { name: "Verificación en dos pasos", exact: true }).waitFor();
      await fillOtp(page, await factorKeeper.code(lockout.email));
      const afterReload = await clickResponse(page, verify, "/api/auth/platform-factor/verify");
      await requireTenFailuresAndReload(attempts, afterReload);
      await page.getByText("Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos.").first().waitFor();
      assert.equal(await verify.isDisabled(), true); assert.equal(new URL(page.url()).pathname, "/login");
      return "Diez fallos propios bloquearon la cuenta; 429 LockedOut y Retry-After válido también tras F5 usando un código correcto; Verificar quedó apagado.";
    });
    await run(4, async () => {
      await admin(); audit = await invite("solo-auditoria", "Ver la auditoría"); screenless = await invite("sin-pantalla", "Administrar cuentas");
      const auditMe = await login(audit.email); requireExclusivePlatformActor(auditMe, ["platform.audit.read"]);
      const [auditResponse] = await Promise.all([
        page.waitForResponse(matches("/api/platform/audit", "GET")), page.goto(url("/plataforma")),
      ]);
      assert.equal(auditResponse.status(), 200);
      await page.waitForURL((location) => location.pathname === "/plataforma/auditoria");
      await page.getByRole("heading", { name: "Auditoría", exact: true }).waitFor();
      requireExclusivePlatformActor(await read(h, page, "/api/me"), ["platform.audit.read"]); await leave();
      const screenlessMe = await login(screenless.email); requireExclusivePlatformActor(screenlessMe, ["platform.accounts.manage"]);
      await page.goto(url("/plataforma")); await page.getByRole("heading", { name: "No tenés permiso para ver esta página", exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, "/plataforma");
      requireExclusivePlatformActor(await read(h, page, "/api/me"), ["platform.accounts.manage"]);
      assert.equal(await page.locator('a[href="/plataforma/cuentas"], a[href="/plataforma/organizaciones"], a[href="/plataforma/auditoria"], a[href="/plataforma/recuperaciones"], a[href="/plataforma/legales"], a[href="/plataforma/configuracion"]').filter({ visible: true }).count(), 0);
      return "audit.read sin otros permisos llevó de Inicio a Auditoría con lectura200; accounts.manage sin lectura quedó en Sin permiso, sin enlaces de sección; ambos operadores carecen de Personal y organizaciones.";
    });
  } finally {
    try { await leave(); } finally { await page.close(); }
  }
}
