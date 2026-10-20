import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { clickForResponse, invitationTokenFromMessage } from "./e2e-completo-negocio.mjs";
import { syntheticEmail, localApiUrl } from "./e2e-completo-soporte.mjs";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { confirmRecentAuthentication, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { openPublicModerationAction } from "./e2e-completo-publico-complemento.mjs";

const def = (number, actor, action, route, expected, covers = [], extra = {}) => ({ id: `ORX-${String(number).padStart(2, "0")}`, area: "Organizaciones · complemento", actor, action, route, expected, covers, critical: true, source: "scripts/e2e-completo-organizaciones-complemento.mjs", ...extra });
export const organizationSupplementDefinitions = [
  def(1, "Dos destinatarios nuevos de la organización original del entorno", "Abrir invitación vencida y otra de organización suspendida", "/invitacion", "Expired y OrganizationSuspended funcionales, sin Aceptar ni alta de membresía. La organización original se reactiva por UI; no modifica el preparador."),
  def(2, "Administrador nuevo de empresa sin roles de organización", "Contar/buscar invitados vencidos y navegar desde Inicio", "/org · /org/empresas/:id?state=Expired", "Un invitado se cuenta una vez; facet Invitados y búsqueda coinciden, Expired sobrevive a F5, Reenviar abre la empresa y Ver todas conserva Expired.", ["BACK-EM-007"]),
  def(3, "Operador y Dueña de una organización nueva", "Moderar, permitir y resolver la página desde el pendiente urgente", "/plataforma/organizaciones/:id · /org/pagina · /org", "Bloqueo impide publicar409; urgente primero y enlace al editor. Permitir conserva borrador; sólo publicar por UI retira el pendiente.", ["BACK-IN-006", "BACK-PL-013"]),
  def(4, "Operador completo y la misma identidad con Business y Personal previos", "Suspender, reactivar y cerrar la organización propia con ambos Bearer ya emitidos", "/plataforma/organizaciones/:id · /org · /cuenta", "Privadas Business antes200, después401/403 por revocación/estado; el Bearer Personal previo conserva200 e identidad tras las transiciones, con motivos y fechas UTC reales en ficha e historial.", ["BACK-OR-021"]),
];
export const organizationSupplementProofGroups = { "BACK-OR-012": [["BIZ-20", "ORX-01"]], "BACK-IN-003": [["AS-SUP-01", "ORX-02"]], "BACK-PL-009": [["PLAT-27", "PLAT-28", "PLAT-29", "ORX-04"]] };
export const proofGroups = organizationSupplementProofGroups;
export const organizationRepairDefinitions = organizationSupplementDefinitions.slice(0, 3);
export const organizationStateRepairDefinitions = organizationSupplementDefinitions.filter((entry) => entry.id === "ORX-04");

export function createOrganizationRecorder(h, { repair = false, definitions, outcomes, getPage, setCapturePage, defaultPage }) {
  const selectedIds = new Set((definitions ?? (repair ? organizationRepairDefinitions : organizationSupplementDefinitions)).map((row) => row.id));
  return async (number, action, target = defaultPage) => {
    const id = `ORX-${String(number).padStart(2, "0")}`;
    if (!selectedIds.has(id)) return;
    if (target !== undefined) setCapturePage(target);
    const outcome = await h.record(id, getPage, action); outcomes.set(number, outcome); return outcome;
  };
}

/** Sólo conserva fase, cantidad, status y comparación booleana: nunca destinos ni claves. */
export async function observeOrganizationInvitationAction(h, page, operation, { onPhase = () => {} } = {}) {
  const allowedPhases = new Set(["abrir", "empresa", "roles", "antesInvitar", "clickInvitar"]);
  const posts = []; const requests = new WeakMap(); const origin = new URL(h.base).origin;
  let currentPhase = "abrir"; let firstKey;
  const phase = (name) => { assert.ok(allowedPhases.has(name)); currentPhase = name; onPhase(name); };
  const requested = (request) => {
    const address = new URL(request.url());
    if (request.method() !== "POST" || address.origin !== origin || address.pathname !== "/api/users/invitations") return;
    const key = request.headers()["idempotency-key"];
    if (firstKey === undefined && key) firstKey = key;
    const post = { phase: currentPhase, status: null, sameKey: Boolean(key && key === firstKey) };
    posts.push(post); requests.set(request, post);
  };
  const responded = (response) => { const post = requests.get(response.request()); if (post) post.status = response.status(); };
  const summary = () => ({ phase: currentPhase, count: posts.length, posts: posts.slice(-6).map((post) => ({ ...post })) });
  const assertNoPosts = () => assert.equal(posts.length, 0, "La invitación no debe enviarse antes del intento explícito de Invitar.");
  page.on("request", requested); page.on("response", responded);
  try { phase("abrir"); return await operation({ phase, assertNoPosts, summary }); }
  catch (cause) {
    const timeout = /Timeout \d+ms exceeded/u.exec(cause?.message ?? "")?.[0];
    throw new Error(`Invitación propia: ${timeout ?? "falló la acción UI"}; ${JSON.stringify(summary())}`, { cause });
  } finally { page.off("request", requested); page.off("response", responded); }
}

export async function leaveOrganizationSession(h, page) {
  await page.goto(new URL("/cuenta", h.base).href);
  await page.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor();
  await h.signOut(page);
}

export async function readInvitedCompanyHomeSession(h, page) {
  await page.waitForURL((current) => current.pathname === "/org");
  // Tus empresas sólo se renderiza tras el GET Home real; la URL puede adelantarse al primer Bearer de la SPA.
  await page.getByRole("heading", { name: "Tus empresas", exact: true }).waitFor();
  return read(h, page, "/api/me");
}

export function requireExpiredMemberOnce(counts, listed, memberId, now = Date.now()) {
  assert.equal(counts.all, 1); assert.equal(counts.active, 0); assert.equal(counts.invited, 1);
  assert.equal(listed.totalCount, 1); assert.equal(listed.items.length, 1); const item = listed.items[0];
  assert.equal(item.memberId, memberId); assert.equal(item.state, "Invited"); assert.equal(item.membershipStatus, "Active");
  assert.ok(item.invitationId && Date.parse(item.invitationExpiresAtUtc) < now);
}
export function requireUrgentPageFirst(home) {
  const groups = home.pendingGroups; assert.ok(groups.length >= 2);
  assert.equal(groups[0].area, "publicPage"); assert.equal(groups[0].kind, "publicPageBlocked"); assert.equal(groups[0].items[0].urgent, true);
  assert.ok(groups.slice(1).some((group) => group.items.some((item) => !item.urgent)), "La prioridad necesita otro pendiente real no urgente.");
}
export function requirePreservedPersonal(before, after, businessIdentityId) {
  assert.equal(before.id, businessIdentityId); assert.equal(after.id, before.id);
  for (const account of [before, after]) { assert.equal(account.access, "consumer"); assert.equal(account.hasPersonalSpace, true); }
  assert.equal(after.activeTenantId, before.activeTenantId);
}
export function requireUnavailableInvitation(preview, member) {
  assert.ok(["Expired", "OrganizationSuspended"].includes(preview.state)); assert.equal(member.state, preview.state === "Expired" ? "Expired" : "Invited"); assert.equal(member.userId, null);
}
export function requireStateHistory(changes, history) {
  for (const change of changes) {
    const matches = history.items.filter((item) => item.reason === change.reason); assert.equal(matches.length, 1);
    const row = matches[0]; assert.match(row.occurredAtUtc, /Z$/u); assert.equal(row.occurredAtUtc, change.atUtc); assert.equal(row.action, change.action); assert.ok(row.actor && row.actorRole);
  }
}
async function problem(response, status, code) {
  assert.equal(response.status(), status); const body = await response.json(); assert.equal(body.code, code); assert.ok(body.traceId);
  for (const key of ["items", "conversation", "members", "bytes", "apiKey"]) assert.equal(Object.hasOwn(body, key), false); return body;
}
export async function requireRevokedBusiness(response) {
  const status = response.status(); assert.ok([401, 403].includes(status), "El Bearer empresarial previo no debe conservar acceso privado.");
  return problem(response, status, status === 401 ? "Http.Unauthorized" : "Tenancy.Tenant.Suspended");
}
async function read(h, page, route) { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); }
const at = (route, method = "GET") => (response) => new URL(response.url()).pathname === route && response.request().method() === method;
async function mailToken(h, email, before) {
  const deadline = Date.now() + 95_000;
  while (Date.now() < deadline) {
    for (const message of await h.env.messages(email, before)) { const token = invitationTokenFromMessage(message.body, h.base); if (token) return token; }
    await delay(250);
  }
  throw new Error("La invitación propia no llegó al pickup sintético.");
}
async function preview(h, page, token, state) {
  const received = page.waitForResponse(at("/api/invitations/preview", "POST")); void received.catch(() => {});
  await page.goto(new URL(`/invitacion#${token}`, h.base).href); const response = await received; assert.equal(response.status(), 200);
  const body = await response.json(); assert.equal(body.state, state); await page.waitForURL((current) => current.hash === ""); return body;
}
async function invite(h, page, company, email = syntheticEmail("orx-invitado"), companyRoleName, options) {
  return observeOrganizationInvitationAction(h, page, async ({ phase, assertNoPosts }) => {
    await page.goto(new URL("/org/usuarios", h.base).href); await page.getByRole("button", { name: "Invitar usuario", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
    await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email); phase("empresa");
    await dialog.getByRole("combobox", { name: "Empresa", exact: true }).click(); await page.getByRole("option", { name: company.name, exact: true }).click();
    phase("roles");
    if (companyRoleName) { await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click(); await page.getByRole("menuitemcheckbox", { name: companyRoleName, exact: true }).click(); await page.keyboard.press("Escape"); }
    const before = new Set(await h.env.files()); phase("antesInvitar"); assertNoPosts(); phase("clickInvitar");
    const response = await clickForResponse(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201); const issued = await response.json(); await dialog.waitFor({ state: "hidden" });
    const list = await read(h, page, `/api/users/paged?search=${encodeURIComponent(email)}&pageSize=100`); const member = list.items.find((item) => item.invitationId === issued.invitationId); assert.ok(member?.memberId);
    return { ...issued, email, memberId: member.memberId, token: await mailToken(h, email, before) };
  }, options);
}
function observeBearer(page) {
  let current; const listener = (request) => { const header = request.headers().authorization; if (new URL(request.url()).pathname.startsWith("/api/") && header?.startsWith("Bearer ")) current = header; };
  page.on("request", listener);
  return { take: () => { assert.ok(current, "La UI debe emitir su Bearer OIDC real antes de esta comprobación."); return current; }, stop: () => page.off("request", listener) };
}

/** InvitationCommand está ligado a la organización original: ORX01/02 sólo agregan fixtures UI propias allí. */
export async function runOrganizationSupplementCases(h) {
  return runOrganizationPlan(h, false);
}
export async function runOrganizationRepairCases(h) {
  return runOrganizationPlan(h, true);
}
export async function runOrganizationStateRepairCases(h) {
  return runOrganizationPlan(h, true, organizationStateRepairDefinitions);
}
async function runOrganizationPlan(h, repair, definitions) {
  const page = await h.newPage(); const platformPage = await h.newPage(); const invitationPage = await h.newPage(); const personalPage = await h.newPage();
  const businessObserver = observeBearer(page); const personalObserver = observeBearer(personalPage); const url = (route) => new URL(route, h.base).href;
  const operatorEmail = h.width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test";
  const tag = randomUUID().slice(0, 8); let currentEmail; let publicPage; let operatorActive = false; let original; let company; let expired; let suspendedInvitation; let companyAdmin; let own; let domain;
  let capturePage = page; const suspended = new Set(); const failures = []; const outcomes = new Map();
  const run = createOrganizationRecorder(h, { repair, definitions, outcomes, getPage: () => capturePage, setCapturePage: (target) => { capturePage = target; }, defaultPage: page });
  const inviteCurrent = (targetCompany, email, roleName) => invite(h, page, targetCompany, email, roleName, { onPhase: () => { capturePage = page; } });
  const invitationPreview = (target, token, state) => { capturePage = target; return preview(h, target, token, state); };
  const leave = async () => {
    if (!publicPage) return; capturePage = publicPage; await leaveOrganizationSession(h, publicPage); publicPage = undefined; currentEmail = undefined;
  };
  const business = async (email) => {
    if (publicPage === page && currentEmail === email) { capturePage = page; return read(h, page, "/api/me"); }
    await leave(); capturePage = page; const me = await h.login(page, email, "business"); publicPage = page; currentEmail = email; return me;
  };
  const admin = async () => {
    capturePage = platformPage;
    if (!operatorActive) { const me = await h.login(platformPage, operatorEmail, "platform"); operatorActive = true; for (const permission of ["platform.tenants.read", "platform.tenants.manage"]) assert.ok(me.effectivePermissions.platform.includes(permission)); }
  };
  const operatorClick = async (button, route, method = "POST") => {
    await stopConfirmingRecentAuthentication(platformPage); let response = await clickForResponse(platformPage, button, route, method, null);
    if (response.status() === 403) {
      await problem(response, 403, "Auth.Platform.ReauthenticationRequired"); const replay = platformPage.waitForResponse((reply) => at(route, method)(reply) && reply.status() !== 403); void replay.catch(() => {}); await confirmRecentAuthentication(platformPage, operatorEmail); response = await replay;
    }
    assert.equal(response.status(), 200); return response;
  };
  const state = async (tenantId, action, reason) => {
    await admin(); await platformPage.goto(url(`/plataforma/organizaciones/${tenantId}`));
    const button = platformPage.getByRole("button", { name: action, exact: true });
    await button.or(platformPage.getByRole("button", { name: /^Acciones de /u })).filter({ visible: true }).first().waitFor();
    if (await button.isVisible()) await button.click();
    else { await platformPage.getByRole("button", { name: /^Acciones de /u }).filter({ visible: true }).first().click(); await platformPage.getByRole("menuitem", { name: action, exact: true }).click(); }
    const dialog = platformPage.getByRole("dialog").filter({ has: platformPage.getByRole("textbox", { name: /^Motivo/u }) }); await dialog.getByRole("textbox", { name: /^Motivo/u }).fill(reason);
    const transition = { Suspender: ["suspend", "Suspended"], Reactivar: ["reactivate", "Active"], Cerrar: ["close", "Closed"] }[action]; assert.ok(transition);
    await operatorClick(dialog.getByRole("button", { name: action, exact: true }), `/api/platform/tenants/${tenantId}/${transition[0]}`);
    if (action === "Suspender") suspended.add(tenantId); else suspended.delete(tenantId);
    await dialog.waitFor({ state: "hidden" }); const detail = await read(h, platformPage, `/api/platform/tenants/${tenantId}`); assert.equal(detail.status, transition[1]); assert.equal(detail.lastStateChange.reason, reason); assert.match(detail.lastStateChange.atUtc, /Z$/u); assert.ok(Number.isFinite(Date.parse(detail.lastStateChange.atUtc))); return detail.lastStateChange;
  };
  const moderation = async (tenantId, action) => {
    await admin(); await platformPage.goto(url(`/plataforma/organizaciones/${tenantId}`)); await openPublicModerationAction(platformPage, action);
    const dialog = platformPage.getByRole("dialog").filter({ has: platformPage.getByRole("textbox", { name: /^Motivo/u }) }); await dialog.getByRole("textbox", { name: /^Motivo/u }).fill(`Moderación propia de la organización ${tag}.`);
    await operatorClick(dialog.getByRole("button", { name: action, exact: true }), `/api/platform/tenants/${tenantId}/public-site/${action === "Despublicar" ? "unpublish" : "allow-publish"}`); await dialog.waitFor({ state: "hidden" });
  };
  const expire = async (issued) => { const result = await h.env.command("invitations", { kind: "expire", email: issued.email, invitationId: issued.invitationId }); assert.equal(result.expired, true); };
  const originalFixture = async () => {
    original = await business(h.env.businessEmail); assert.equal(original.access, "business"); assert.ok(original.activeTenantId);
    if (!company) {
      await page.goto(url("/org/empresas")); await page.getByRole("button", { name: "Crear empresa", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "Crear empresa", exact: true });
      await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(`Empresa propia ORX ${tag}`); const created = await clickForResponse(page, dialog.getByRole("button", { name: "Crear empresa", exact: true }), "/api/companies", "POST", 201); company = await read(h, page, `/api/companies/${await created.json()}`); await dialog.waitFor({ state: "hidden" });
    }
  };
  const ownFixture = async () => {
    if (!own) { await leave(); capturePage = page; own = await h.registerBusiness(page); publicPage = page; currentEmail = own.email; }
    await business(own.email); assert.equal((await read(h, page, "/api/me")).activeTenantId, own.me.activeTenantId);
  };
  const publish = async () => {
    capturePage = page; await page.goto(url("/org/pagina")); const before = await read(h, page, "/api/organization/public-page"); assert.equal(before.isPublished, false);
    await clickForResponse(page, page.getByRole("switch", { name: /^Visible en /u }), "/api/organization/public-page/publish", "POST", 200); assert.equal((await read(h, page, "/api/organization/public-page")).isPublished, true);
  };
  const usingBearer = (target, token, route) => target.request.get(localApiUrl(route, h.base), { headers: { Authorization: token } });
  try {
    await run(1, async () => {
      await originalFixture(); await admin();
      expired = await inviteCurrent(company); await expire(expired);
      suspendedInvitation = await inviteCurrent(company); await leave();
      const expiredPreview = await invitationPreview(invitationPage, expired.token, "Expired");
      await invitationPage.getByRole("heading", { name: "Esta invitación venció", exact: true }).waitFor(); assert.equal(await invitationPage.getByRole("button", { name: "Aceptar invitación", exact: true }).count(), 0);
      let suspendedPreview;
      try {
        await state(original.activeTenantId, "Suspender", `Suspensión propia para invitación ${tag}.`);
        suspendedPreview = await invitationPreview(invitationPage, suspendedInvitation.token, "OrganizationSuspended");
        await invitationPage.getByRole("heading", { name: /no está disponible/u }).waitFor(); assert.equal(await invitationPage.getByRole("button", { name: "Aceptar invitación", exact: true }).count(), 0);
      } finally {
        if (suspended.has(original.activeTenantId)) await state(original.activeTenantId, "Reactivar", `Restauración de la organización original ${tag}.`);
      }
      await originalFixture();
      requireUnavailableInvitation(expiredPreview, await read(h, page, `/api/users/${expired.memberId}`));
      requireUnavailableInvitation(suspendedPreview, await read(h, page, `/api/users/${suspendedInvitation.memberId}`));
      return "Dos enlaces reales propios: vencido y organización suspendida mostraron su estado, sin Aceptar ni identidad activa. La organización original quedó Activa por UI.";
    });

    if (!outcomes.get(1)?.ok || !expired || !company) await h.block("ORX-02", "ORX-01 no completó la preparación de invitaciones vencida/suspendida y la empresa propias.", page);
    else await run(2, async () => {
      await originalFixture();
      for (let index = 0; index < 10; index++) { const issued = await inviteCurrent(company); await expire(issued); }
      const roleName = `Administrador propio ORX ${tag}`; await page.goto(url("/org/roles/nuevo")); await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(roleName);
      await page.getByRole("combobox", { name: "Vale en", exact: true }).click(); await page.getByRole("option", { name: company.name, exact: true }).click(); await page.getByRole("button", { name: "Abrir o cerrar Miembros", exact: true }).click();
      for (const permission of ["Ver miembros", "Administrar miembros"]) await page.getByRole("checkbox", { name: permission, exact: true }).check();
      const createdRole = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 201); const roleId = await createdRole.json(); await page.getByRole("heading", { name: roleName, exact: true }).waitFor();
      companyAdmin = await inviteCurrent(company, syntheticEmail("orx-admin"), roleName);
      const reserved = await read(h, page, `/api/users/${companyAdmin.memberId}`); assert.deepEqual(reserved.roles, []); assert.equal(reserved.userId, null); assert.ok(reserved.companies.find((item) => item.companyId === company.id)?.roles.some((role) => role.id === roleId));
      await leave(); await invitationPreview(page, companyAdmin.token, "NoAccount");
      await clickForResponse(page, page.getByRole("button", { name: "Aceptar invitación", exact: true }), "/api/invitations/accept", "POST", 200); publicPage = page; currentEmail = companyAdmin.email;
      await page.getByRole("button", { name: "Más tarde", exact: true }).click();
      const me = await readInvitedCompanyHomeSession(h, page); assert.equal(me.activeTenantId, original.activeTenantId); assert.equal(me.effectivePermissions.organization.includes("users.read"), false); assert.ok(me.effectivePermissions.companies[company.id].includes("company.members.read"));
      const home = await read(h, page, "/api/home"); assert.equal(home.organization, null); assert.ok(home.companies.some((item) => item.companyId === company.id));
      const group = home.pendingGroups.find((item) => item.kind === "invitationExpired" && item.companyId === company.id); assert.ok(group); assert.equal(group.totalCount, 11); assert.equal(group.items.length, 10);
      const section = page.getByRole("region", { name: "Para resolver", exact: true }); const resend = section.getByRole("link", { name: "Reenviar", exact: true }).first(); assert.equal(await resend.getAttribute("href"), `/org/empresas/${company.id}`); await resend.click(); await page.getByRole("heading", { name: company.name, exact: true }).waitFor();
      await page.goto(url("/org")); const all = page.getByRole("region", { name: "Para resolver", exact: true }).locator(`a[href="/org/empresas/${company.id}?state=Expired"]`); await all.click(); await page.getByRole("heading", { name: company.name, exact: true }).waitFor(); assert.equal(new URL(page.url()).searchParams.get("state"), "Expired");
      const search = page.getByRole("searchbox", { name: "Buscar por nombre o correo", exact: true });
      if (h.width === 1440) {
        const searched = page.waitForResponse((response) => at(`/api/companies/${company.id}/members/paged`)(response) && new URL(response.url()).searchParams.get("search") === expired.email); void searched.catch(() => {}); await search.fill(expired.email); assert.equal((await searched).status(), 200);
      } else {
        // La ficha móvil no expone filtros (phoneTools="none"); el enlace y la búsqueda de lectura conservan la URL real.
        await page.goto(url(`/org/empresas/${company.id}?state=Expired&search=${encodeURIComponent(expired.email)}`)); await page.getByRole("heading", { name: company.name, exact: true }).waitFor();
      }
      const query = `search=${encodeURIComponent(expired.email)}`;
      requireExpiredMemberOnce(await read(h, page, `/api/companies/${company.id}/members/filter-counts?${query}`), await read(h, page, `/api/companies/${company.id}/members/paged?state=Expired&${query}&pageSize=100`), expired.memberId);
      await page.reload(); await page.getByRole("heading", { name: company.name, exact: true }).waitFor(); assert.equal(new URL(page.url()).searchParams.get("state"), "Expired"); assert.equal(new URL(page.url()).searchParams.get("search"), expired.email);
      if (h.width === 1440) assert.equal(await search.inputValue(), expired.email);
      const reloaded = await read(h, page, `/api/companies/${company.id}/members/paged?state=Expired&${query}&pageSize=100`); assert.equal(reloaded.totalCount, 1); assert.equal(reloaded.items[0].memberId, expired.memberId); await page.getByText(h.width === 390 ? /venció/u : /Venció/u).first().waitFor();
      return "Administrador sólo de su empresa: Inicio-Miembro conservó la empresa, total11/vista10, Reenviar abrió su ficha y Ver todas conservó Expired. Búsqueda/facet contaron al invitado una vez y F5 mantuvo ambos parámetros.";
    });

    await run(3, async () => {
      await ownFixture(); await page.goto(url("/org/pagina")); await page.getByRole("textbox", { name: "Nombre de la página", exact: true }).fill(`Página propia ORX ${tag}`); await page.getByRole("textbox", { name: "Descripción", exact: true }).fill("Página preparada por su Dueña para resolver la moderación.");
      await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/organization/public-page", "PUT", 200);
      await page.goto(url("/org/configuracion")); await page.getByRole("button", { name: "Agregar dominio", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "Agregar dominio", exact: true }); domain = `orx-${tag}.example.test`;
      await dialog.getByRole("textbox", { name: "Dominio", exact: true }).fill(domain); const added = await clickForResponse(page, dialog.getByRole("button", { name: "Siguiente", exact: true }), "/api/organization/settings/domains", "POST", 201); assert.equal((await added.json()).status, "Pending"); await page.getByRole("dialog", { name: `Verificar ${domain}`, exact: true }).getByRole("button", { name: "Cancelar", exact: true }).click();
      await page.goto(url("/org")); assert.ok((await read(h, page, "/api/home")).pendingGroups.some((item) => item.kind === "publicPageDraft")); await page.getByRole("region", { name: "Para resolver", exact: true }).locator('a[href="/org/pagina"]').first().click(); await page.getByRole("heading", { name: "Página pública", exact: true }).waitFor(); await publish();
      await moderation(own.me.activeTenantId, "Despublicar"); capturePage = page; await page.goto(url("/org")); const urgent = await read(h, page, "/api/home"); requireUrgentPageFirst(urgent);
      const section = page.getByRole("region", { name: "Para resolver", exact: true }); assert.equal(await section.getByRole("link").first().getAttribute("href"), "/org/pagina"); await section.getByRole("link").first().click(); await page.getByRole("heading", { name: "Página pública", exact: true }).waitFor();
      const blocked = await read(h, page, "/api/organization/public-page"); assert.ok(blocked.publishBlockedAtUtc); assert.equal(blocked.isPublished, false); assert.equal(await page.getByRole("switch", { name: /^Visible en /u }).getAttribute("aria-disabled"), "true");
      await problem(await h.api(page, "/api/organization/public-page/publish", { method: "POST", data: { version: blocked.version }, headers: { "Idempotency-Key": randomUUID() } }), 409, "PublicSite.PublicPage.PublishBlocked");
      await moderation(own.me.activeTenantId, "Permitir publicar"); capturePage = page; await page.reload(); const allowed = await read(h, page, "/api/organization/public-page"); assert.equal(allowed.publishBlockedAtUtc, null); assert.equal(allowed.isPublished, false); assert.equal(await page.getByRole("switch", { name: /^Visible en /u }).isChecked(), false);
      const draft = await read(h, page, "/api/home"); assert.ok(draft.pendingGroups.some((item) => item.kind === "publicPageDraft")); assert.equal(draft.pendingGroups.some((item) => item.kind === "publicPageBlocked"), false);
      await publish(); await page.goto(url("/org")); const resolved = await read(h, page, "/api/home"); assert.equal(resolved.pendingGroups.some((item) => ["publicPageDraft", "publicPageBlocked"].includes(item.kind)), false); assert.ok(resolved.pendingGroups.some((item) => item.kind === "domainUnverified"));
      const remaining = page.getByRole("region", { name: "Para resolver", exact: true });
      if (h.width === 1440) await remaining.getByText(domain, { exact: true }).waitFor(); else await remaining.getByRole("link", { name: "Verificar", exact: true }).waitFor();
      return "La moderación dejó el pendiente urgente primero frente al dominio previo y llevó al editor; la Dueña recibió409 al publicar bloqueado. Permitir mantuvo Borrador; publicar por UI quitó sólo el pendiente de página.";
    });

    await run(4, async () => {
      await ownFixture(); await page.goto(url("/org")); await page.getByRole("region", { name: "Para resolver", exact: true }).waitFor(); const businessToken = businessObserver.take();
      const privateRoutes = ["/api/home", "/api/users/paged?pageSize=10", "/api/companies/paged?pageSize=10"];
      for (const route of privateRoutes) assert.equal((await usingBearer(page, businessToken, route)).status(), 200);
      capturePage = personalPage; await personalPage.goto(url("/login?prompt=login")); await personalPage.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(own.email); const before = new Set(await h.env.files());
      const sent = await sendWithCooldown(() => clickForResponse(personalPage, personalPage.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", "POST", null)); assert.equal(sent.status(), 202); await personalPage.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor(); await fillOtp(personalPage, await h.env.code(own.email, before)); await clickForResponse(personalPage, personalPage.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", "POST", 200); publicPage = personalPage; currentEmail = own.email;
      await personalPage.waitForURL((current) => !["/login", "/auth/callback"].includes(current.pathname)); await personalPage.goto(url("/cuenta")); await personalPage.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor();
      const personalToken = personalObserver.take(); const personalResponse = await usingBearer(personalPage, personalToken, "/api/me"); assert.equal(personalResponse.status(), 200); const personalBefore = await personalResponse.json(); requirePreservedPersonal(personalBefore, personalBefore, own.me.id);
      // Volver a comprobar el mismo token tras elegir Personal evita atribuir a suspensión una revocación anterior.
      for (const route of privateRoutes) assert.equal((await usingBearer(page, businessToken, route)).status(), 200);
      const changes = [await state(own.me.activeTenantId, "Suspender", `Suspensión con sesiones previas ${tag}.`)];
      const revokedStatuses = []; for (const route of privateRoutes) { const response = await usingBearer(page, businessToken, route); await requireRevokedBusiness(response); revokedStatuses.push(response.status()); }
      const personalCheck = async () => { capturePage = personalPage; const response = await usingBearer(personalPage, personalToken, "/api/me"); assert.equal(response.status(), 200); requirePreservedPersonal(personalBefore, await response.json(), own.me.id); assert.equal((await usingBearer(personalPage, personalToken, "/api/me/login-methods")).status(), 200); };
      await personalCheck(); changes.push(await state(own.me.activeTenantId, "Reactivar", `Reactivación propia con fecha ${tag}.`)); await personalCheck();
      changes.push(await state(own.me.activeTenantId, "Suspender", `Suspensión anterior al cierre propio ${tag}.`)); changes.push(await state(own.me.activeTenantId, "Cerrar", `Cierre de la organización propia ${tag}.`)); await personalCheck();
      await verifyOrganizationClosureHistory(h, platformPage, own.me.activeTenantId, changes, (target) => { capturePage = target; });
      capturePage = personalPage; await personalPage.reload(); await personalPage.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor(); await personalCheck();
      return `Los tres recursos Business con Bearer previo pasaron200→${revokedStatuses.join("/")}. El mismo Personal previo conservó identidad/espacio y200 antes/después de Suspender, Reactivar y Cerrar por UI; ficha e historial conservaron cada motivo y fecha UTC exacta.`;
    }, personalPage);
  } catch (error) { failures.push(error); } finally {
    for (const tenantId of [...suspended]) { try { await state(tenantId, "Reactivar", "Restauración por UI de la organización que suspendió este complemento."); } catch (error) { failures.push(error); } }
    try { await leave(); } catch (error) { failures.push(error); }
    if (operatorActive) { try { await platformPage.goto(url("/plataforma")); await h.signOut(platformPage); operatorActive = false; } catch (error) { failures.push(error); } }
    businessObserver.stop(); personalObserver.stop();
    for (const target of [page, platformPage, invitationPage, personalPage]) { try { await target.close(); } catch (error) { failures.push(error); } }
  }
  if (failures.length) throw new AggregateError(failures, "Falló una preparación o la restauración UI de las organizaciones propias.");
}

/** La línea móvil une actor y motivo; el GET conserva la comprobación completa de motivos y UTC. */
export async function verifyOrganizationClosureHistory(h, page, tenantId, changes, setCapturePage) {
  setCapturePage(page);
  const history = await read(h, page, `/api/platform/tenants/${tenantId}/history?limit=100`);
  requireStateHistory(changes, history);
  await page.reload(); await page.getByRole("tab", { name: "Historial", exact: true }).click();
  const reason = changes.at(-1)?.reason; assert.ok(reason);
  const panel = page.getByRole("tabpanel");
  if (h.width === 390) await panel.getByRole("listitem").filter({ hasText: reason }).waitFor();
  else await panel.getByText(reason, { exact: true }).filter({ visible: true }).first().waitFor();
}
