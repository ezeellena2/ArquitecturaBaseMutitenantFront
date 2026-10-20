import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fillOtp, accountAddMethodName, openAccountEmailDialog } from "./test-e2e-real-ui.mjs";
import { requireE8Control, sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { clickForResponse, requireProblem } from "./e2e-completo-negocio.mjs";
import { syntheticEmail, requireSyntheticEmail } from "./e2e-completo-soporte.mjs";
import { confirmRecentAuthentication, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { parseLegalPublicationReceipt, assertPendingTerms, acceptPublishedLegalAndReturn } from "./test-e2e-real-legal.mjs";
import { journeyDate } from "./recorrido-usuario.mjs";
import { nationalPhone } from "./recorrido-usuario-e11.mjs";
import { openAction } from "./e2e-completo-plataforma.mjs";
import { selectMobileBarCases } from "./e2e-completo-seleccion-movil.mjs";

const definition = (number, actor, action, route, expected, covers) => ({ id: `IDS-${String(number).padStart(2, "0")}`, area: "Complemento de identidad", actor, action, route, expected, covers, critical: true, source: "scripts/e2e-completo-identidad-complemento.mjs" });
export const identitySupplementDefinitions = [
  definition(1, "Visitante", "Ingresar con Phone sin cuenta", "/login", "400 PhoneAccountNotFound sin pantalla de código ni autorización nueva; Crear mi cuenta conserva el número en el formulario.", ["BACK-ID-009"]),
  definition(2, "Dos personas con correo propio", "Probar posesión de un correo pendiente ajeno", "/cuenta · /registro", "La reserva sigue pendiente al emitir el OTP; sólo verificar el alta la retira de la cuenta anterior, y el correo verificado no se transfiere.", ["BACK-CU-005"]),
  definition(3, "Persona con correo y otra con Phone", "Intentar agregar el Phone ya verificado ajeno", "/cuenta", "400 Identity.LoginMethod.PhoneAlreadyUsed en phone; sin pantalla OTP ni método pendiente, y las dos cuentas conservan sus métodos.", ["BACK-CU-007"]),
  definition(4, "Persona Phone sin organizaciones", "Pedir baja con motivo y comprobar las sesiones anteriores", "/cuenta", "Gracia de30d, motivo enviado y cierre visible; ambos tokens reales anteriores quedan401.", ["BACK-CU-014"]),
  definition(5, "Cuenta Phone en baja", "Rechazar cancelación vencida y reutilizada", "/login · /api/auth/deletion/cancel", "Un ticket emitido por OTP y vencido por el control existente da403; otro permite cancelar por UI una vez y su replay da403 sin sesión ni nueva autorización.", ["BACK-ID-024"]),
  definition(6, "Última Dueña y operador con tenants.manage", "Bloquear la baja con organización activa y suspendida", "/cuenta · /plataforma/organizaciones/:id", "En ambos estados se informa la organización, Dar de baja queda apagado y POST409 LastAdmin; la organización se reactiva por UI al terminar.", ["BACK-CU-015"]),
  definition(7, "Persona con dos membresías", "Elegir y recordar la organización al volver a ingresar", "/login/empresa · /org", "Dos invitaciones aceptadas en el mismo OTP prueban el desempate por nombre; Perfiles cambia a la otra organización, otro ingreso la recuerda y Personal conserva su acceso separado. No certifica antigüedad diferenciada sin selección anterior.", ["BACK-ID-018"]),
  definition(8, "Operador de legales y persona existente", "Publicar y aceptar términos con retorno protegido", "/plataforma/legales/nueva · /aceptar-terminos", "Versión nueva publicada por UI; casilla inicialmente desmarcada, continuar sin aceptar muestra validación sin POST; aceptación explícita204 y vuelta a Mi cuenta con la misma identidad y sin pendientes.", ["BACK-CU-017"]),
  definition(9, "Miembro de tres organizaciones y operador de las fixtures", "Elegir la membresía más antigua cuando la última Business deja de estar disponible", "/login/empresa · /org · /plataforma/organizaciones/:id", "Tres invitaciones aceptadas por UI en ingresos separados tienen JoinedAtUtc distintos; al suspender la última Business recordada, otro ingreso elige la más antigua entre dos candidatas activas, aunque su nombre ordene después. La suspensión se revierte por UI.", []),
];

export const identitySupplementLimitations = {};
export const identitySupplementProofGroups = { "BACK-ID-019": [["IDS-07", "IDS-09"]] };
export const identitySupplementMobileBarDefinitions = identitySupplementDefinitions.filter(({ id }) => ["IDS-06", "IDS-09"].includes(id));

export async function runIdentityMobileBarCases(h, { run = runIdentitySupplementCases } = {}) {
  return run(selectMobileBarCases(h, { targets: identitySupplementMobileBarDefinitions.map(({ id }) => id) }));
}

export function identityPhoneFixtures(width) {
  assert.ok([1440, 390].includes(width)); const offset = width === 1440 ? 0 : 1;
  return { foreign: `+54911345678${40 + offset}`, unknown: `+54911345678${44 + offset}` };
}
export function requireThirtyDayGrace(scheduledForUtc, before, after) {
  assert.match(scheduledForUtc, /Z$/u); const scheduled = Date.parse(scheduledForUtc); const grace = 30 * 24 * 60 * 60 * 1000;
  assert.ok(Number.isFinite(scheduled) && scheduled >= before + grace && scheduled <= after + grace, "La fecha debe corresponder a treinta días desde la solicitud observada.");
}
export function requireEmailOwnership(response, email, state) {
  assert.ok(["pending", "verified", "absent"].includes(state));
  const matches = response.methods.filter((method) => method.type === "Email" && method.value === email);
  assert.equal(matches.length, state === "absent" ? 0 : 1);
  if (matches.length) assert.equal(matches[0].isVerified, state === "verified");
}
export function requireChronologicalFallback(account, organizationIds, selectedId) {
  assert.equal(organizationIds.length, 3, "La preparación necesita dos candidatas y una organización recordada.");
  assert.equal(new Set(organizationIds).size, 3);
  const memberships = organizationIds.map((id) => account.organizations.find((item) => item.tenantId === id));
  assert.ok(memberships.every(Boolean), "Deben existir las tres membresías reales de la cuenta.");
  const joined = memberships.map((item) => { assert.equal(item.status, "Active"); assert.match(item.joinedAtUtc ?? "", /Z$/u); return Date.parse(item.joinedAtUtc); });
  assert.ok(joined.every(Number.isFinite) && joined[0] < joined[1] && joined[1] < joined[2], "Los JoinedAtUtc reales deben ser distintos y aumentar en cada aceptación separada.");
  assert.equal(memberships[0].tenantStatus, "Active"); assert.equal(memberships[1].tenantStatus, "Active"); assert.equal(memberships[2].tenantStatus, "Suspended");
  assert.equal(selectedId, organizationIds[0], "El fallback debe elegir la membresía activa más antigua.");
}
export async function runIdentityDependency(h, outcomes, id, dependencies, page, action) {
  const missing = dependencies.filter((dependency) => outcomes.get(dependency)?.ok !== true);
  if (missing.length) {
    await h.block(id, "Faltó preparar: " + missing.join(", ") + ".", page);
    const result = { ok: false, blocked: true }; outcomes.set(id, result); return result;
  }
  const result = await h.record(id, () => page, action); outcomes.set(id, result); return result;
}

export async function requireSoleOwnerDeletionUi(page, organization) {
  const information = page.getByRole("button", { name: "Por qué no podés darte de baja", exact: true });
  // El GET del arnés no espera la query de React. Este control aparece en la
  // misma renderización que calcula aria-disabled a partir de soleOwnerOrganizations.
  await information.waitFor();
  assert.equal(await page.getByRole("button", { name: "Dar de baja", exact: true }).getAttribute("aria-disabled"), "true");
  await information.click();
  await page.getByRole("dialog").getByText(new RegExp(escapeRegex(organization), "u")).first().waitFor();
}

export async function requireExplicitLegalConsent(page) {
  const checkbox = page.getByRole("checkbox", { name: /Leí y acepto/u });
  assert.equal(await checkbox.isChecked(), false);
  let acceptances = 0;
  const requested = (request) => { if (request.method() === "POST" && new URL(request.url()).pathname === "/api/legal/accept") acceptances++; };
  page.on("request", requested);
  try {
    await page.getByRole("button", { name: "Aceptar y seguir", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Aceptá los Términos y la Política de privacidad." }).waitFor();
    assert.equal(acceptances, 0, "Sin marcar la casilla no debe enviarse la aceptación legal.");
    assert.equal(await checkbox.isChecked(), false);
  } finally { page.off("request", requested); }
}

const endpoint = (route, method = "POST") => (response) => new URL(response.url()).pathname === route && response.request().method() === method;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
async function read(h, page, route) { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); }
async function click(page, button, route, status = 200, method = "POST") {
  const send = () => clickForResponse(page, button, route, method, status === 202 ? undefined : status);
  if (status !== 202) return send();
  const response = await sendWithCooldown(async () => {
    const waiting = page.waitForResponse(endpoint(route)); void waiting.catch(() => {});
    await button.click({ timeout: 90_000 }); return waiting;
  });
  assert.equal(response.status(), 202); return response;
}
async function choosePhone(page, phone, label = /^(Tu )?número de WhatsApp$/iu) {
  await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
  await page.getByRole("textbox", { name: label }).fill(nationalPhone(phone));
}
function publicIdentityFrame(page) {
  // Mi cuenta usa FixedActions también sin cambios: en móvil oculta Secciones,
  // pero su título sólo se presenta después de resolver la identidad privada.
  return page.getByRole("navigation", { name: "Secciones", exact: true }).or(page.getByRole("button", { name: /, .+$/u }))
    .or(page.getByRole("heading", { name: "Mi cuenta", exact: true })).filter({ visible: true }).first();
}
async function authenticated(h, page, access) {
  await publicIdentityFrame(page).waitFor();
  const me = await read(h, page, "/api/me"); assert.equal(me.access, access); return me;
}
async function registerEmail(h, page, email) {
  requireSyntheticEmail(email); await page.goto(new URL("/registro", h.base).href);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
  const before = new Set(await h.env.files()); await click(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", 202);
  return { verify: async () => { await fillOtp(page, await h.env.code(email, before)); await click(page, page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }), "/api/auth/signup/verify", 204); await page.waitForURL((url) => url.pathname === "/"); return authenticated(h, page, "consumer"); } };
}
async function registerPhone(h, page, phone, scenario) {
  const cursor = await requireE8Control(h.env)(scenario, phone);
  await page.goto(new URL("/registro", h.base).href); await choosePhone(page, phone);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await click(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", 202);
  await fillOtp(page, (await cursor("code")).proof);
  await click(page, page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }), "/api/auth/signup/verify", 204);
  await page.waitForURL((url) => url.pathname === "/"); return authenticated(h, page, "consumer");
}
async function provePhone(h, page, phone, scenario, expectedStatus = 200) {
  const cursor = await requireE8Control(h.env)(scenario, phone);
  await page.goto(new URL("/login", h.base).href); await choosePhone(page, phone);
  await click(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 202);
  await fillOtp(page, (await cursor("code")).proof);
  const response = await click(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", expectedStatus);
  return { response, cursor };
}
async function closePublic(h, page) {
  await page.goto(new URL("/cuenta", h.base).href);
  const frame = publicIdentityFrame(page);
  const login = page.getByRole("textbox", { name: "Correo electrónico", exact: true });
  const terms = page.getByRole("heading", { name: "Actualizamos los términos", exact: true });
  await frame.or(login).or(terms).first().waitFor();
  if (await terms.isVisible()) { await page.getByRole("checkbox", { name: /Leí y acepto/ }).check(); await page.getByRole("button", { name: "Aceptar y seguir", exact: true }).click(); await frame.waitFor(); }
  if (await frame.isVisible()) await h.signOut(page);
}
export { authenticated as requireAuthenticatedIdentity, closePublic as closeIdentityPublicSession };
async function switchProfile(h, page, name, access, tenantId = null) {
  const changed = page.waitForResponse(async (response) => endpoint("/api/me", "GET")(response) && response.status() === 200 && (await response.json()).access === access && (tenantId === null || (await response.json()).activeTenantId === tenantId));
  void changed.catch(() => {});
  if (h.width === 390) { await page.goto(new URL("/mas", h.base).href); await page.getByRole("list", { name: "Perfiles", exact: true }).getByRole("button", { name: new RegExp(`^${escapeRegex(name)}`, "u") }).click(); }
  else { await page.getByRole("button", { name: /, .+$/u }).filter({ visible: true }).last().click(); await page.getByRole("menuitemradio", { name: new RegExp(`^${escapeRegex(name)}`, "u") }).click(); }
  await changed; return read(h, page, "/api/me");
}
async function inviteWithoutRoles(h, page, email) {
  await page.goto(new URL("/org/usuarios", h.base).href); await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  await click(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", 201);
  await dialog.waitFor({ state: "hidden" });
}
async function operatorClick(page, button, route, operator, status = 200) {
  await stopConfirmingRecentAuthentication(page);
  const first = page.waitForResponse(endpoint(route)); void first.catch(() => {}); await button.click(); let response = await first;
  if (response.status() === 403 && (await response.json()).code === "Auth.Platform.ReauthenticationRequired") {
    const replay = page.waitForResponse((reply) => endpoint(route)(reply) && reply.status() !== 403); void replay.catch(() => {});
    await confirmRecentAuthentication(page, operator); response = await replay;
  }
  assert.equal(response.status(), status); return response;
}
export async function changeOrganization(h, page, business, action, operator) {
  await page.goto(new URL(`/plataforma/organizaciones/${business.me.activeTenantId}`, h.base).href);
  await openAction(page, action);
  const dialog = page.getByRole("dialog").filter({ has: page.getByRole("textbox", { name: /^Motivo/ }) });
  await dialog.getByRole("textbox", { name: /^Motivo/ }).fill("Identidad: preservar a la última Dueña en la organización propia.");
  await operatorClick(page, dialog.getByRole("button", { name: action, exact: true }), `/api/platform/tenants/${business.me.activeTenantId}/${action === "Suspender" ? "suspend" : "reactivate"}`, operator);
  await dialog.waitFor({ state: "hidden" });
}

export async function runIdentitySupplementCases(h) {
  const page = await h.newPage(); const other = await h.newPage(); const operatorPage = await h.newPage();
  const outcomes = new Map(); const tag = `${h.width}-${randomUUID().slice(0, 8)}`; const phone = identityPhoneFixtures(h.width);
  const operator = h.width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test";
  const run = (number, dependencies, action) => runIdentityDependency(h, outcomes, `IDS-${String(number).padStart(2, "0")}`, dependencies.map((id) => `IDS-${String(id).padStart(2, "0")}`), page, action);
  let person; let phoneAccount; let business; let member; let operatorSignedIn = false; let suspended = false;
  const ensureOperator = async () => { if (!operatorSignedIn) { await h.login(operatorPage, operator, "platform"); operatorSignedIn = true; } };
  try {
    await run(1, [], async () => {
      await closePublic(h, page); await page.goto(new URL("/login", h.base).href); await choosePhone(page, phone.unknown);
      let authorizations = 0; const observed = (request) => { if (new URL(request.url()).pathname === "/connect/authorize") authorizations++; }; page.on("request", observed);
      try {
        await requireProblem(await click(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 400), 400, "Auth.LoginCode.PhoneAccountNotFound");
        await page.getByText("No hay una cuenta con ese número.", { exact: true }).waitFor();
        assert.equal(await page.getByRole("textbox", { name: "Código 1", exact: true }).count(), 0);
        await page.getByRole("link", { name: "Crear mi cuenta", exact: true }).click();
        assert.equal((await page.getByRole("textbox", { name: /Número de WhatsApp$/u }).inputValue()).replace(/\D/gu, "").endsWith(phone.unknown.slice(-8)), true);
        assert.equal(authorizations, 0);
      } finally { page.off("request", observed); }
      return "Phone desconocido400, sin código ni nueva autorización; el registro conservó el número sintético.";
    });
    await run(2, [], async () => {
      await closePublic(h, page); person = await h.registerPerson(page); await page.goto(new URL("/cuenta", h.base).href);
      const reserved = syntheticEmail("reserva"); const dialog = await openAccountEmailDialog(page); await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(reserved);
      await click(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", 202);
      requireEmailOwnership(await read(h, page, "/api/me/login-methods"), reserved, "pending");
      await dialog.getByRole("button", { name: "Cancelar", exact: true }).click(); await h.signOut(page);
      const signup = await registerEmail(h, other, reserved);
      await h.login(page, person.email); requireEmailOwnership(await read(h, page, "/api/me/login-methods"), reserved, "pending"); await h.signOut(page);
      const owner = await signup.verify(); assert.notEqual(owner.id, person.me.id); requireEmailOwnership(await read(h, other, "/api/me/login-methods"), reserved, "verified"); await h.signOut(other);
      await h.login(page, person.email); await page.goto(new URL("/cuenta", h.base).href); requireEmailOwnership(await read(h, page, "/api/me/login-methods"), reserved, "absent");
      const retry = await openAccountEmailDialog(page); await retry.getByRole("textbox", { name: "Correo", exact: true }).fill(reserved);
      await requireProblem(await click(page, retry.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", 400), 400, "Identity.LoginMethod.AlreadyUsed");
      assert.equal(await retry.getByRole("textbox", { name: "Código 1", exact: true }).count(), 0);
      return "La reserva se mantuvo hasta verificar posesión; el alta creó otra identidad y retiró sólo el pendiente ajeno; el método verificado quedó protegido400.";
    });
    await run(3, [], async () => {
      await closePublic(h, page); phoneAccount = await registerPhone(h, page, phone.foreign, `ids-phone-${tag}`); const owned = await read(h, page, "/api/me/login-methods"); await h.signOut(page);
      const claimant = await h.registerPerson(page); const before = await read(h, page, "/api/me/login-methods"); await page.goto(new URL("/cuenta", h.base).href);
      await page.getByRole("button", { name: accountAddMethodName }).click(); const dialog = page.getByRole("dialog"); await dialog.getByRole("button", { name: "WhatsApp", exact: true }).click(); await dialog.getByRole("textbox", { name: "Número", exact: true }).fill(nationalPhone(phone.foreign));
      const problem = await requireProblem(await click(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", 400), 400, "Identity.LoginMethod.PhoneAlreadyUsed");
      assert.ok(problem.errors?.phone?.length > 0); await dialog.getByText(problem.errors.phone[0], { exact: true }).waitFor();
      assert.equal(await dialog.getByRole("textbox", { name: "Código 1", exact: true }).count(), 0); assert.deepEqual(await read(h, page, "/api/me/login-methods"), before);
      await dialog.getByRole("button", { name: "Cancelar", exact: true }).click(); await h.signOut(page);
      await provePhone(h, page, phone.foreign, `ids-owner-${tag}`); assert.equal((await authenticated(h, page, "consumer")).id, phoneAccount.id); assert.deepEqual(await read(h, page, "/api/me/login-methods"), owned); assert.notEqual(phoneAccount.id, claimant.me.id);
      return "Phone ajeno400 bajo phone, sin pendiente ni pantalla de código; ambos catálogos de métodos quedaron intactos.";
    });
    await run(4, [3], async () => {
      await page.goto(new URL("/cuenta", h.base).href); const methods = await read(h, page, "/api/me/login-methods"); assert.equal(methods.accountDeletionGraceDays, 30);
      await other.goto(new URL("/cuenta", h.base).href); assert.equal((await authenticated(h, other, "consumer")).id, phoneAccount.id);
      await page.getByRole("button", { name: "Dar de baja", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "¿Dar de baja tu cuenta?", exact: true }); const reason = "Identidad: verificar gracia y revocación real de sesiones propias.";
      await dialog.getByRole("textbox", { name: /Motivo/u }).fill(reason); const before = Date.now(); const response = await click(page, dialog.getByRole("button", { name: "Dar de baja", exact: true }), "/api/me/deletion"); const after = Date.now();
      assert.equal(response.request().postDataJSON().reason, reason); requireThirtyDayGrace((await response.json()).scheduledForUtc, before, after);
      await page.getByRole("heading", { name: "Cerramos tu sesión", exact: true }).waitFor();
      for (const oldPage of [page, other]) await requireProblem(await h.api(oldPage, "/api/me"), 401, "Http.Unauthorized");
      return "Baja por UI con motivo y gracia exacta de30d; ambos tokens anteriores quedaron401 y la UI cerró la sesión.";
    });
    await run(5, [4], async () => {
      const scenario = `ids-expired-${tag}`; const pending = await provePhone(h, page, phone.foreign, scenario, 403); const problem = await requireProblem(pending.response, 403, "Identity.Account.PendingDeletion"); assert.ok(problem.cancelTicket);
      assert.equal((await h.env.command("whatsapp", { kind: "expireTicket", scenario, phone: phone.foreign, ticket: problem.cancelTicket })).ok, true);
      await requireProblem(await click(page, page.getByRole("button", { name: "Cancelar la baja y entrar", exact: true }), "/api/auth/deletion/cancel", 403), 403, "Legal.AccountDeletion.CancelProofInvalid");
      await page.getByRole("heading", { name: "Tu cuenta tiene la baja pedida", exact: true }).waitFor({ state: "hidden" }); await page.getByRole("button", { name: "Enviar código", exact: true }).waitFor(); assert.equal((await page.request.get(new URL("/api/me", h.base).href)).status(), 401);
      const renewed = await provePhone(h, page, phone.foreign, `ids-reused-${tag}`, 403); const valid = await requireProblem(renewed.response, 403, "Identity.Account.PendingDeletion");
      await click(page, page.getByRole("button", { name: "Cancelar la baja y entrar", exact: true }), "/api/auth/deletion/cancel"); assert.equal((await authenticated(h, page, "consumer")).id, phoneAccount.id); await h.signOut(page);
      await requireProblem(await page.request.post(new URL("/api/auth/deletion/cancel", h.base).href, { headers: { "Idempotency-Key": randomUUID() }, data: { cancelTicket: valid.cancelTicket } }), 403, "Legal.AccountDeletion.CancelProofInvalid");
      assert.equal((await page.request.get(new URL("/api/me", h.base).href)).status(), 401);
      return "Ticket vencido403 sin sesión; ticket nuevo canceló una vez por UI y su reutilización403 tampoco autenticó.";
    });
    await run(6, [], async () => {
      await closePublic(h, page); business = await h.registerBusiness(page); await page.goto(new URL("/login", h.base).href); assert.equal((await authenticated(h, page, "consumer")).id, business.me.id);
      await ensureOperator();
      const blocked = async () => {
        await page.goto(new URL("/cuenta", h.base).href); const methods = await read(h, page, "/api/me/login-methods"); assert.ok(methods.soleOwnerOrganizations.includes(business.organization));
        await requireSoleOwnerDeletionUi(page, business.organization);
        await requireProblem(await h.api(page, "/api/me/deletion", { method: "POST", headers: { "Idempotency-Key": randomUUID() }, data: { reason: "No debe borrar a la última Dueña." } }), 409, "Legal.AccountDeletion.LastAdmin");
        await page.getByRole("dialog").getByRole("button", { name: "Entendido", exact: true }).click();
      };
      await blocked(); await changeOrganization(h, operatorPage, business, "Suspender", operator); suspended = true; await blocked();
      return "Organización activa y suspendida: la cuenta sigue siendo única Dueña, aviso enumera su organización, botón apagado y servidor409 LastAdmin en ambos estados.";
    });
    if (suspended) { await changeOrganization(h, operatorPage, business, "Reactivar", operator); suspended = false; }
    await run(7, [6], async () => {
      await closePublic(h, page); member = await h.registerPerson(page); await h.signOut(page);
      await h.login(page, business.email, "business"); await inviteWithoutRoles(h, page, member.email); await h.signOut(page);
      const second = await h.registerBusiness(page); await inviteWithoutRoles(h, page, member.email); await h.signOut(page);
      const first = await h.login(page, member.email, "business"); assert.equal(first.id, member.me.id);
      const names = [business, second].sort((left, right) => left.organization.toLowerCase() < right.organization.toLowerCase() ? -1 : 1);
      assert.equal(first.activeTenantId, names[0].me.activeTenantId, "El mismo OTP activa ambas invitaciones con el mismo JoinedAtUtc; el desempate usa el nombre.");
      assert.ok(first.organizations.some((org) => org.id === business.me.activeTenantId)); assert.ok(first.organizations.some((org) => org.id === second.me.activeTenantId));
      const chosen = names[1]; assert.equal((await switchProfile(h, page, chosen.organization, "business", chosen.me.activeTenantId)).activeTenantId, chosen.me.activeTenantId); await h.signOut(page);
      const remembered = await h.login(page, member.email, "business"); assert.equal(remembered.activeTenantId, chosen.me.activeTenantId); assert.equal(remembered.id, member.me.id);
      const personal = await switchProfile(h, page, "Personal", "consumer"); assert.equal(personal.id, member.me.id); assert.equal(personal.hasPersonalSpace, true);
      const back = await switchProfile(h, page, chosen.organization, "business", chosen.me.activeTenantId); assert.equal(back.id, member.me.id);
      return "Dos invitaciones se activaron en un OTP: la selección inicial respetó el desempate por nombre; Perfiles eligió la otra organización y otro OTP la recordó. Personal mantuvo la misma identidad con acceso separado. Antigüedad diferenciada sin acreditar.";
    });
    await run(8, [], async () => {
      await closePublic(h, page); const target = await h.registerPerson(page); await h.signOut(page); await ensureOperator();
      await operatorPage.goto(new URL("/plataforma/legales", h.base).href); await operatorPage.getByRole("link", { name: "Publicar versión nueva", exact: true }).first().click();
      await operatorPage.getByRole("combobox", { name: "Documento" }).click(); await operatorPage.getByRole("option", { name: /Términos y condiciones/u }).click();
      await operatorPage.getByRole("textbox", { name: "Vigente desde" }).fill(journeyDate().split("-").reverse().join("/")); await operatorPage.getByRole("textbox", { name: "En español" }).fill(`Términos del complemento de identidad ${tag}.`); await operatorPage.getByRole("textbox", { name: "En inglés" }).fill(`Terms for identity supplement ${tag}.`);
      await operatorPage.getByRole("button", { name: "Publicar", exact: true }).click(); const published = await operatorClick(operatorPage, operatorPage.getByRole("alertdialog").getByRole("button", { name: "Publicar", exact: true }), "/api/platform/legal-documents", operator, 201); const receipt = parseLegalPublicationReceipt(await published.text());
      await acceptPublishedLegalAndReturn(operatorPage, receipt, "/api/platform/legal-documents");
      await page.goto(new URL("/cuenta", h.base).href); await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(target.email); const before = new Set(await h.env.files());
      await click(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 202); await fillOtp(page, await h.env.code(target.email, before)); await click(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify");
      await page.getByRole("heading", { name: "Actualizamos los términos", exact: true }).waitFor(); assertPendingTerms(await read(h, page, "/api/me"), receipt); await requireExplicitLegalConsent(page);
      await acceptPublishedLegalAndReturn(page, receipt, "/api/me"); await page.waitForURL((url) => url.pathname === "/cuenta"); await page.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor(); const accepted = await read(h, page, "/api/me"); assert.equal(accepted.id, target.me.id); assert.deepEqual(accepted.pendingLegalDocuments, []);
      return "Términos nuevos vigentes: gate empezó sin marcar; continuar sin aceptar mostró validación sin POST. La aceptación explícita204 incluyó versión/ID y volvió a Mi cuenta de la misma persona sin pendientes.";
    });
    await run(9, [], async () => {
      await closePublic(h, page); const fallbackMember = await h.registerPerson(page); await h.signOut(page);
      const organizations = [];
      for (const prefix of ["Zeta antigua", "Alfa reciente", "Media recordada"]) {
        const organization = await h.registerBusiness(page);
        const name = `${prefix} ${tag}`;
        await page.goto(new URL("/org/configuracion", h.base).href);
        await page.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill(name);
        await click(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/organization/settings", 200, "PUT");
        assert.equal((await read(h, page, "/api/organization/settings")).name, name);
        organization.organization = name;
        organizations.push(organization);
        await inviteWithoutRoles(h, page, fallbackMember.email); await h.signOut(page);
        const accepted = await h.login(page, fallbackMember.email, "business");
        assert.equal(accepted.id, fallbackMember.me.id);
        assert.ok(accepted.organizations.some((item) => item.id === organization.me.activeTenantId), "Cada ingreso separado debe aceptar su invitación pendiente real.");
        await h.signOut(page);
      }
      const [oldest, newer, remembered] = organizations;
      await h.login(page, fallbackMember.email, "business");
      const chosen = await switchProfile(h, page, remembered.organization, "business", remembered.me.activeTenantId);
      assert.equal(chosen.id, fallbackMember.me.id); assert.equal(chosen.activeTenantId, remembered.me.activeTenantId); await h.signOut(page);
      await ensureOperator();
      let changed = false;
      try {
        await changeOrganization(h, operatorPage, remembered, "Suspender", operator); changed = true;
        const returned = await h.login(page, fallbackMember.email, "business");
        assert.equal(returned.id, fallbackMember.me.id);
        const account = await read(h, operatorPage, `/api/platform/accounts/${fallbackMember.me.id}`);
        requireChronologicalFallback(account, organizations.map((item) => item.me.activeTenantId), returned.activeTenantId);
        const oldestMembership = account.organizations.find((item) => item.tenantId === oldest.me.activeTenantId);
        const newerMembership = account.organizations.find((item) => item.tenantId === newer.me.activeTenantId);
        assert.ok(oldestMembership.name.toLowerCase() > newerMembership.name.toLowerCase(), "Los nombres deben oponerse a la elección por antigüedad.");
        return "Tres aceptaciones UI separadas dejaron JoinedAtUtc reales distintos. Tras recordar y suspender la tercera, el nuevo ingreso eligió la más antigua de dos candidatas activas, con nombre posterior alfabéticamente; la organización se reactivó por UI al terminar.";
      } finally { if (changed) await changeOrganization(h, operatorPage, remembered, "Reactivar", operator); }
    });
  } finally {
    try { if (suspended) { await changeOrganization(h, operatorPage, business, "Reactivar", operator); suspended = false; } }
    finally {
      try { await closePublic(h, page); if (operatorSignedIn) await h.signOut(operatorPage); }
      finally { await Promise.allSettled([page.close(), other.close(), operatorPage.close()]); }
    }
  }
}
