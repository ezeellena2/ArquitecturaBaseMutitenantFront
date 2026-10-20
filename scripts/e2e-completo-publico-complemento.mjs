import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { forceBusinessLogin, clickForResponse } from "./e2e-completo-negocio.mjs";
import { assistantLogin } from "./assistant-real-ui.mjs";
import { requireModuleProblem, runModuleDependency } from "./e2e-completo-modulos.mjs";
import { cleanupContinuationSessions } from "./e2e-completo-continuacion.mjs";
import { assertViewport } from "./e2e-completo-personal.mjs";
import { openAction } from "./e2e-completo-plataforma.mjs";
import { selectMobileBarCases } from "./e2e-completo-seleccion-movil.mjs";

const definition = (number, actor, action, route, expected, covers = []) => ({
  id: "PUB-C-" + String(number).padStart(2, "0"), area: "Sitio público y Configuración", actor, action, route, expected, covers,
  source: "scripts/e2e-completo-publico-complemento.mjs", critical: true,
});
export const publicSupplementDefinitions = [
  definition(1, "Dueños A/B y operador", "Preparar dos organizaciones y un logo real por UI", "/registro/empresa · /org/pagina", "Organizaciones propias, nombres de actores y borradores con logo válido; operador real con MFA. No certifica otra fila."),
  definition(2, "Visitante y miembro propio", "Comparar desconocido, borrador, bloqueo y suspensión", "/api/public-site · /logo", "Los cuatro estados, página y logo, con/sin Bearer propio: mismo404 salvo traceId. Restauración por UI.", ["BACK-PU-005"]),
  definition(3, "Dueño B en host público A", "Leer publicación A y conservar aislamiento privado B", "/api/public-site · /api/organization/public-page", "Publicación sólo A; Me, borrador y empresas privados siguen en B; empresa A404 con el Bearer real de B.", ["BACK-PU-006"]),
  definition(4, "Dueño A", "Subir firma inválida y tamaño real excedido, rechazar URL", "/org/pagina", "Firma incorrecta400, archivo de512KiB+1 rechazado por UI sin PUT y URL arbitraria400; logo persistido intacto.", ["BACK-PU-008"]),
  definition(5, "Visitante", "Revalidar ETag y retirar logo por despublicación/suspensión", "/api/public-site/logo", "Bytes reales200 y ETag/304 sin cuerpo; retirado por ambas acciones404 con If-None-Match; restaura por UI.", ["BACK-PU-009"]),
  definition(6, "Dueño A", "Guardar nombre, cultura, zona y moneda del catálogo real", "/org/configuracion", "Un PUT con versión leída y opciones habilitadas de reference-data; relectura y F5 conservan los cuatro cambios.", ["BACK-CF-001"]),
  definition(7, "Dueño A", "Salir con cambios y seguir editando", "/org/configuracion", "Seguir editando conserva borrador; Salir sin guardar restaura lo persistido sin PUT ni cambiar versión.", ["BACK-CF-002"]),
  definition(8, "Dueño A", "Buscar, filtrar y abrir auditoría de persona/empresa y Plataforma", "/org/auditoria", "Cursor sin total, búsqueda y filtros reales, detalle de invitación enmascarado; Plataforma sin id/nombre/correo del operador ni motivo interno.", ["BACK-CF-007"]),
];
export const publicSupplementMobileBarDefinitions = publicSupplementDefinitions.filter(({ id }) => ["PUB-C-02", "PUB-C-05"].includes(id));
export const publicAuditRepairDefinitions = publicSupplementDefinitions.filter(({ id }) => id === "PUB-C-08");

export async function runPublicMobileBarCases(h, { run = runPublicSupplementCases } = {}) {
  return run(selectMobileBarCases(h, { targets: publicSupplementMobileBarDefinitions.map(({ id }) => id), prepare: ["PUB-C-01"] }));
}
export async function runPublicAuditRepairCases(h, { run = runPublicSupplementCases } = {}) {
  return run(selectMobileBarCases(h, { targets: ["PUB-C-08"], prepare: ["PUB-C-01"] }));
}

export function publicHostUrl(base, slug, route) {
  assert.match(slug, /^[a-z][a-z0-9-]{0,62}$/u);
  assert.ok(route.startsWith("/api/") && !route.startsWith("//"));
  const site = new URL(base); site.hostname = slug + "." + base.hostname;
  const url = new URL(route, site); assert.equal(url.origin, site.origin);
  return url;
}
export function requireUnavailableMatrix(samples) {
  const wanted = ["unknown", "draft", "blocked", "suspended"].flatMap((state) => ["anonymous", "member"].flatMap((actor) => ["/api/public-site", "/api/public-site/logo"].map((route) => state + actor + route)));
  assert.equal(samples.length, wanted.length); let expected;
  for (const sample of samples) {
    const key = sample.state + sample.actor + sample.route;
    assert.ok(wanted.includes(key)); wanted.splice(wanted.indexOf(key), 1);
    assert.equal(sample.status, 404); assert.equal(sample.body.code, "PublicSite.PublicPage.NotFound");
    assert.ok(sample.body.traceId?.length > 0);
    const { traceId: _trace, ...body } = sample.body;
    if (!expected) expected = body; else assert.deepEqual(body, expected, "No disponible no distingue la causa ni la sesión.");
  }
  assert.equal(wanted.length, 0);
}
export function chooseReferenceChanges(data, before) {
  const culture = data.cultures.find((row) => row.isEnabled && row.code !== before.defaultCulture);
  const currency = data.currencies.find((row) => row.isEnabled && row.code !== before.defaultCurrency);
  const timeZone = data.timeZones.find((row) => row.isEnabled && row.id !== before.defaultTimeZoneId
    && data.timeZones.filter((other) => other.isEnabled && other.city === row.city).length === 1);
  assert.ok(culture && currency && timeZone, "El catálogo debe ofrecer alternativas habilitadas reales.");
  return { culture, currency, timeZone };
}
export function logoFixtures() {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jh5kAAAAASUVORK5CYII=", "base64");
  const oversized = Buffer.alloc(512 * 1024 + 1); png.copy(oversized);
  return { valid: { name: "logo-propio.png", mimeType: "image/png", buffer: png },
    signature: { name: "firma-incorrecta.png", mimeType: "image/png", buffer: Buffer.from("Esto no es una imagen PNG.") },
    oversized: { name: "exceso-real.png", mimeType: "image/png", buffer: oversized } };
}
export function requireAuditPrivacy({ invitation, platforms, invitedEmail, actorId, actorEmail, companyName, operator, reason }) {
  assert.equal(invitation.actorKind, "User"); assert.equal(invitation.actorId, actorId); assert.equal(invitation.actorEmail, actorEmail);
  assert.ok(invitation.whereText.includes(companyName)); assert.ok(invitation.affectedDisplayName.includes("•••"));
  assert.equal(JSON.stringify(invitation).includes(invitedEmail), false);
  const shown = [invitation.actionText, invitation.affectedDisplayName, invitation.whereText, ...invitation.changes.flatMap((change) => [change.field, change.oldValue, change.newValue])].filter(Boolean);
  assert.ok(shown.every((value) => !/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9-]{22}/iu.test(value)), "El detalle no muestra IDs internos.");
  assert.ok(platforms.length > 0);
  for (const entry of platforms) {
    assert.equal(entry.actorKind, "PlatformOperator"); assert.equal(entry.actorText, "Plataforma");
    for (const field of ["actorId", "actorEmail", "actorDisplayName"]) assert.equal(entry[field] ?? null, null);
    const serialized = JSON.stringify(entry);
    for (const secret of [operator.id, operator.email, operator.displayName, reason].filter(Boolean)) assert.equal(serialized.includes(secret), false);
  }
}
export async function withPublicRestoration(action, restore, { getPage, setPage } = {}) {
  let value; let actionPage; const failures = [];
  try { value = await action(); } catch (error) { failures.push(error); }
  finally { actionPage = getPage?.(); }
  try { await restore(); }
  catch (error) { if (failures.length === 0) actionPage = undefined; failures.push(error); }
  finally { if (actionPage !== undefined) setPage?.(actionPage); }
  if (failures.length === 1) throw failures[0];
  if (failures.length) throw new AggregateError(failures, "Fallaron la comprobación pública y su restauración por UI.");
  return value;
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const at = (route, method = "GET") => (response) => new URL(response.url()).pathname === route && response.request().method() === method;
async function read(h, page, route) { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); }
async function discard(page) {
  const button = page.getByRole("button", { name: "Descartar cambios", exact: true }).filter({ visible: true }).first();
  if (await button.isVisible()) await button.click();
}
async function savePublicPage(h, page, name, file) {
  await page.goto(new URL("/org/pagina", h.base).href);
  await page.getByRole("textbox", { name: "Nombre de la página", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "Descripción", exact: true }).fill("Contenido público sintético propio.");
  if (file) await page.locator('input[type="file"]').setInputFiles(file);
  await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/organization/public-page", "PUT");
}
async function publication(h, page, published) {
  await discard(page); await page.goto(new URL("/org/pagina", h.base).href);
  const saved = await read(h, page, "/api/organization/public-page");
  if (saved.isPublished === published) return;
  const toggle = page.getByRole("switch", { name: /^Visible en /u });
  if (published) await clickForResponse(page, toggle, "/api/organization/public-page/publish", "POST");
  else {
    await toggle.click();
    await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Despublicar", exact: true }), "/api/organization/public-page/unpublish", "POST");
  }
  assert.equal((await read(h, page, "/api/organization/public-page")).isPublished, published);
}
export async function openPublicModerationAction(page, action) {
  await page.getByRole("tab", { name: "Página pública", exact: true }).click();
  // El menú superior ya existe mientras la fila carga; sólo el panel identifica su propia moderación.
  const actions = page.getByRole("tabpanel").getByRole("button", { name: /^Acciones de /u }).filter({ visible: true });
  await actions.waitFor(); await actions.click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}
export async function leaveOrganizationSettings(h, page) {
  assert.ok([390, 1440].includes(h.width));
  // FixedActions oculta la navegación inferior del editor móvil; la salida real es la flecha de su barra.
  const route = h.width === 390 ? "/mas" : "/org";
  const name = h.width === 390 ? "Volver a Más" : "Inicio";
  await page.getByRole("link", { name, exact: true }).filter({ visible: true }).and(page.locator(`a[href="${route}"]`)).first().click();
  return route;
}
async function operatorAction(h, page, tenantId, action, reason, moderation = false) {
  await page.goto(new URL("/plataforma/organizaciones/" + tenantId, h.base).href);
  let route;
  if (moderation) {
    await openPublicModerationAction(page, action);
    route = "/api/platform/tenants/" + tenantId + "/public-site/" + (action === "Despublicar" ? "unpublish" : "allow-publish");
  } else {
    await openAction(page, action);
    route = "/api/platform/tenants/" + tenantId + "/" + (action === "Suspender" ? "suspend" : "reactivate");
  }
  const dialog = page.getByRole("dialog").filter({ has: page.getByRole("textbox", { name: /^Motivo/u }) });
  await dialog.getByRole("textbox", { name: /^Motivo/u }).fill(reason);
  // El helper de MFA confirma el step-up real si la prueba del operador venció.
  const response = page.waitForResponse((reply) => at(route, "POST")(reply) && reply.status() !== 403);
  void response.catch(() => {});
  await dialog.getByRole("button", { name: action, exact: true }).click();
  await dialog.waitFor({ state: "hidden" }); assert.equal((await response).status(), 200);
}
async function selectReference(page, label, wanted, search) {
  const control = page.getByRole("combobox", { name: label, exact: true }); await control.click();
  const input = page.getByRole("searchbox", { name: search, exact: true });
  if (await input.isVisible()) await input.fill(wanted);
  await page.getByRole("option", { name: new RegExp(escapeRegex(wanted), "u") }).first().click();
  return control.innerText();
}
export async function auditFilter(h, page, key, label) {
  if (h.width === 390) {
    const trigger = page.getByRole("button", { name: "Filtros de auditoría", exact: true }); await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Filtros de auditoría", exact: true });
    const group = sheet.getByRole("group", { name: { period: "Período", category: "Tema", actor: "Quién" }[key], exact: true });
    const radio = group.getByRole("radio", { name: label, exact: true });
    const value = await radio.getAttribute("value"); assert.ok(value, "El filtro debe tener un valor real antes de seleccionarlo.");
    // FilterBar onChange actualiza la URL y desmonta la hoja: check no puede verificar ese mismo nodo después.
    await group.getByText(label, { exact: true }).click(); await sheet.waitFor({ state: "hidden" });
    await page.waitForURL((url) => {
      if (url.pathname !== "/org/auditoria") return false;
      const query = url.searchParams;
      if (key === "actor") return value === "all" ? !query.has("actorId") && !query.has("actorKind")
        : query.get("actorId") === value && !query.has("actorKind") || query.get("actorKind") === value && !query.has("actorId");
      return value === "all" && key === "category" || value === "30" && key === "period" ? !query.has(key) : query.get(key) === value;
    });
    await trigger.click(); await radio.waitFor({ state: "visible" });
    try { assert.equal(await radio.isChecked(), true, "El filtro elegido debe conservarse seleccionado al reabrir su hoja."); }
    finally { await page.keyboard.press("Escape"); await sheet.waitFor({ state: "hidden" }); }
  } else {
    const trigger = { period: /^(Últimos 30 días|Todo|Hoy|Últimos 7 días)$/u, category: /^(Tema: todos|Usuarios)$/u, actor: /^(Quién: todos|Plataforma)$/u }[key];
    await page.getByRole("button", { name: trigger }).first().click();
    await page.getByRole("menuitemradio", { name: label, exact: true }).click();
  }
}

export async function runPublicSupplementCases(h) {
  const pages = []; const bearers = new WeakMap();
  const newPage = async () => {
    const page = await h.newPage(); pages.push(page);
    page.on("request", (request) => { const auth = request.headers().authorization; if (new URL(request.url()).origin === h.base.origin && auth?.startsWith("Bearer ")) bearers.set(page, auth); });
    return page;
  };
  const aPage = await newPage(); const bPage = await newPage(); const platformPage = await newPage(); const visitor = await newPage();
  const outcomes = new Map(); const suiteFailures = []; const activePages = new Set(); let capturePage = aPage; let a; let b; let companyA; let companyB; let operator;
  const tag = randomUUID().slice(0, 8); const actorName = "Titular público " + tag; const pageName = "Publicación A " + tag;
  const operatorEmail = h.width === 1440 ? "e2e-5d-operator@example.test" : "e2e-a9-operator@example.test";
  const internalReason = "qa-interno-" + tag; const tenantId = () => a.me.activeTenantId;
  const run = (number, dependencies, action) => runModuleDependency(h, outcomes, "PUB-C-" + String(number).padStart(2, "0"), dependencies.map((id) => "PUB-C-" + String(id).padStart(2, "0")), () => capturePage, async () => { capturePage = aPage; return action(); });
  const asA = async () => { capturePage = aPage; await discard(aPage); const me = await forceBusinessLogin(h, aPage, a.email); activePages.add(aPage); return me; };
  const publishA = async (published) => { capturePage = aPage; return publication(h, aPage, published); };
  const operate = async (action, moderation = false) => { capturePage = platformPage; return operatorAction(h, platformPage, tenantId(), action, internalReason, moderation); };
  const siteRead = (page, slug, route, { member = false, headers = {} } = {}) => {
    const authorization = member ? bearers.get(page) : null;
    if (member) assert.ok(authorization, "Debe existir el Bearer obtenido por UI real, sólo en memoria.");
    return page.request.get(publicHostUrl(h.base, slug, route).href, { headers: { ...headers, ...(authorization ? { Authorization: authorization } : {}) } });
  };
  const restore = async () => {
    capturePage = platformPage;
    const state = await read(h, platformPage, "/api/platform/tenants/" + tenantId());
    if (state.status === "Suspended") await operate("Reactivar");
    const metadata = await read(h, platformPage, "/api/platform/tenants/" + tenantId() + "/public-site");
    if (metadata.publishBlockedAtUtc) await operate("Permitir publicar", true);
    await asA(); await publishA(true);
  };
  const withRestore = (action) => withPublicRestoration(action, restore, { getPage: () => capturePage, setPage: (target) => { capturePage = target; } });
  const unavailable = async (samples, state, slug) => {
    capturePage = aPage;
    for (const actor of ["anonymous", "member"]) for (const route of ["/api/public-site", "/api/public-site/logo"]) {
      const response = await siteRead(aPage, slug, route, { member: actor === "member" });
      samples.push({ state, actor, route, status: response.status(), body: await response.json() });
    }
    const site = publicHostUrl(h.base, slug, "/api/public-site"); site.pathname = "/";
    capturePage = visitor;
    await visitor.goto(site.href); await visitor.getByRole("heading", { name: "Esta página no está disponible", exact: true }).waitFor();
  };
  try {
    await run(1, [], async () => {
      a = await h.registerBusiness(aPage); activePages.add(aPage);
      companyA = (await read(h, aPage, "/api/companies/paged?page=1&pageSize=100")).items.find((row) => row.name === a.companyName); assert.ok(companyA?.id);
      await aPage.goto(new URL("/cuenta", h.base).href); await aPage.getByRole("textbox", { name: "Nombre", exact: true }).fill(actorName);
      await clickForResponse(aPage, aPage.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT");
      await savePublicPage(h, aPage, pageName, logoFixtures().valid); assert.equal((await read(h, aPage, "/api/organization/public-page")).isPublished, false);
      await h.signOut(aPage); activePages.delete(aPage);
      capturePage = bPage; b = await h.registerBusiness(bPage); activePages.add(bPage);
      companyB = (await read(h, bPage, "/api/companies/paged?page=1&pageSize=100")).items.find((row) => row.name === b.companyName); assert.ok(companyB?.id);
      await savePublicPage(h, bPage, "Borrador B " + tag); await h.signOut(bPage); activePages.delete(bPage);
      capturePage = platformPage; await assistantLogin(platformPage, h.env, h.base, operatorEmail, "platform");
      activePages.add(platformPage);
      operator = { ...await read(h, platformPage, "/api/me"), email: operatorEmail }; assert.equal(operator.access, "platform");
      await asA(); await aPage.goto(new URL("/org/pagina", h.base).href); await assertViewport(aPage);
      return "Dos organizaciones y borradores por UI, logo PNG real y operador con MFA; A sigue sin publicar.";
    });
    await run(2, [1], () => withRestore(async () => {
      await asA(); const samples = [];
      await unavailable(samples, "unknown", "desconocido-" + tag); await unavailable(samples, "draft", a.slug);
      await publishA(true);
      await operate("Despublicar", true); await unavailable(samples, "blocked", a.slug);
      await operate("Permitir publicar", true); await publishA(true);
      await operate("Suspender"); await unavailable(samples, "suspended", a.slug);
      requireUnavailableMatrix(samples); await assertViewport(visitor);
      return "Las16 respuestas404 de página/logo, cuatro causas y dos actores coincidieron salvo traceId; UI no disponible uniforme.";
    }));
    await run(3, [1], async () => {
      await restore(); capturePage = bPage; await forceBusinessLogin(h, bPage, b.email); activePages.add(bPage);
      const publicResponse = await siteRead(bPage, a.slug, "/api/public-site", { member: true }); assert.equal(publicResponse.status(), 200);
      const publicData = await publicResponse.json(); assert.equal(publicData.name, pageName); assert.equal(publicData.slug, a.slug);
      assert.deepEqual(Object.keys(publicData).sort(), ["address", "description", "email", "logoUrl", "name", "phone", "slug", "website"]);
      const me = await (await siteRead(bPage, a.slug, "/api/me", { member: true })).json(); assert.equal(me.activeTenantId, b.me.activeTenantId);
      const own = await siteRead(bPage, a.slug, "/api/organization/public-page", { member: true }); assert.equal(own.status(), 200);
      const draft = await own.json(); assert.equal(draft.slug, b.slug); assert.equal(draft.isPublished, false);
      const list = await siteRead(bPage, a.slug, "/api/companies/paged?page=1&pageSize=100", { member: true }); assert.equal(list.status(), 200);
      const companies = (await list.json()).items; assert.ok(companies.some((row) => row.id === companyB.id)); assert.ok(companies.every((row) => row.id !== companyA.id));
      await requireModuleProblem(await siteRead(bPage, a.slug, "/api/companies/" + companyA.id, { member: true }), 404, ["Tenancy.Company.NotFound"]);
      const site = publicHostUrl(h.base, a.slug, "/api/public-site"); site.pathname = "/";
      capturePage = visitor;
      await visitor.goto(site.href); await visitor.getByRole("heading", { name: pageName, exact: true }).waitFor(); await assertViewport(visitor);
      return "Host A publicó sólo A; Bearer real de B mantuvo Me/borrador/empresas en B y empresa privada A404.";
    });
    await run(4, [1], async () => {
      await asA(); await aPage.goto(new URL("/org/pagina", h.base).href); const before = await read(h, aPage, "/api/organization/public-page");
      const files = logoFixtures(); await aPage.locator('input[type="file"]').setInputFiles(files.signature);
      const response = await clickForResponse(aPage, aPage.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/organization/public-page", "PUT", 400);
      await requireModuleProblem(response, 400, ["PublicSite.PublicPage.InvalidLogo"]); await discard(aPage);
      let writes = 0; const watch = (request) => { if (new URL(request.url()).pathname === "/api/organization/public-page" && request.method() === "PUT") writes++; };
      aPage.on("request", watch);
      try {
        await aPage.locator('input[type="file"]').setInputFiles(files.oversized);
        await aPage.getByText("Elegí una imagen PNG, JPEG o WebP de hasta 512 KiB.", { exact: true }).first().waitFor(); assert.equal(writes, 0);
      } finally { aPage.off("request", watch); }
      assert.equal(await aPage.getByRole("textbox", { name: /URL.*logo|logo.*URL/iu }).count(), 0);
      await requireModuleProblem(await h.api(aPage, "/api/organization/public-page", { method: "PUT", data: { slug: before.slug, name: before.name, description: before.description,
        contactEmail: before.contactEmail, contactPhone: null, address: before.address, website: before.website, logoBase64: "https://externo.example.test/logo.png", logoContentType: "image/png", removeLogo: false, version: before.version } }), 400, ["Validation.Failed", "PublicSite.PublicPage.InvalidLogo"]);
      const after = await read(h, aPage, "/api/organization/public-page"); assert.equal(after.logoDataUri, before.logoDataUri); assert.equal(after.version, before.version);
      await assertViewport(aPage); return "Firma PNG falsa400 real, archivo512KiB+1 rechazado sin PUT, URL arbitraria400 y logo/version intactos.";
    });
    await run(5, [1], () => withRestore(async () => {
      await restore(); capturePage = visitor;
      const first = await siteRead(visitor, a.slug, "/api/public-site/logo"); assert.equal(first.status(), 200);
      assert.deepEqual(await first.body(), logoFixtures().valid.buffer); const etag = first.headers().etag; assert.ok(etag);
      assert.match(first.headers()["cache-control"], /max-age=0/u); assert.match(first.headers()["cache-control"], /must-revalidate/u);
      const unchanged = await siteRead(visitor, a.slug, "/api/public-site/logo", { headers: { "If-None-Match": etag } }); assert.equal(unchanged.status(), 304); assert.equal((await unchanged.body()).length, 0);
      await publishA(false); capturePage = visitor;
      await requireModuleProblem(await siteRead(visitor, a.slug, "/api/public-site/logo", { headers: { "If-None-Match": etag } }), 404, ["PublicSite.PublicPage.NotFound"]);
      await publishA(true); capturePage = visitor;
      const current = await siteRead(visitor, a.slug, "/api/public-site/logo"); assert.equal(current.status(), 200); const currentEtag = current.headers().etag; assert.ok(currentEtag);
      await operate("Suspender"); capturePage = visitor;
      await requireModuleProblem(await siteRead(visitor, a.slug, "/api/public-site/logo", { headers: { "If-None-Match": currentEtag } }), 404, ["PublicSite.PublicPage.NotFound"]);
      const site = publicHostUrl(h.base, a.slug, "/api/public-site"); site.pathname = "/"; await visitor.goto(site.href);
      await visitor.getByRole("heading", { name: "Esta página no está disponible", exact: true }).waitFor();
      return "Logo200 bytes exactos, ETag/304 sin cuerpo; despublicación y suspensión devolvieron404 aun con If-None-Match.";
    }));
    await run(6, [1], async () => {
      await asA(); await aPage.goto(new URL("/org/configuracion", h.base).href);
      const before = await read(h, aPage, "/api/organization/settings"); const data = await read(h, aPage, "/api/reference-data"); const next = chooseReferenceChanges(data, before);
      const labels = await aPage.evaluate(async ({ culture, currency }) => {
        const { nativeCultureName } = await import("/src/shared/format/cultureName.ts"); const { currencyLabel } = await import("/src/shared/referenceData/referenceData.ts");
        return { culture: nativeCultureName(culture.code, culture.name), currency: currencyLabel(currency) };
      }, next);
      await aPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill("Organización configurada " + tag);
      const selected = [
        ["Idioma y región predeterminados", await selectReference(aPage, "Idioma y región predeterminados", labels.culture, "Buscar cultura")],
        ["Zona horaria predeterminada", await selectReference(aPage, "Zona horaria predeterminada", next.timeZone.city, "Buscar zona horaria")],
        ["Moneda predeterminada", await selectReference(aPage, "Moneda predeterminada", labels.currency, "Buscar moneda")],
      ];
      const response = await clickForResponse(aPage, aPage.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/organization/settings", "PUT");
      const sent = response.request().postDataJSON(); assert.equal(sent.version, before.version);
      assert.equal(sent.defaultCulture, next.culture.code); assert.equal(sent.defaultTimeZoneId, next.timeZone.id); assert.equal(sent.defaultCurrency, next.currency.code);
      const after = await read(h, aPage, "/api/organization/settings");
      for (const key of ["name", "defaultCulture", "defaultTimeZoneId", "defaultCurrency"]) assert.equal(after[key], sent[key]); assert.notEqual(after.version, before.version);
      await aPage.reload(); assert.equal(await aPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).inputValue(), sent.name);
      for (const [label, value] of selected) assert.equal(await aPage.getByRole("combobox", { name: label, exact: true }).innerText(), value);
      assert.equal((await read(h, aPage, "/api/organization/settings")).version, after.version); await assertViewport(aPage);
      return "Un PUT versionado guardó nombre/cultura/zona/moneda elegidos del catálogo real; F5 y relectura los conservan.";
    });
    await run(7, [1], async () => {
      await asA(); await aPage.goto(new URL("/org/configuracion", h.base).href);
      const before = await read(h, aPage, "/api/organization/settings"); const draft = "Borrador sin guardar " + tag;
      let writes = 0; const watch = (request) => { if (new URL(request.url()).pathname === "/api/organization/settings" && request.method() === "PUT") writes++; }; aPage.on("request", watch);
      try {
        await aPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill(draft);
        const leave = () => leaveOrganizationSettings(h, aPage);
        await leave(); let dialog = aPage.getByRole("dialog", { name: "¿Salir sin guardar?", exact: true });
        await dialog.getByRole("button", { name: "Seguir editando", exact: true }).click();
        assert.equal(new URL(aPage.url()).pathname, "/org/configuracion"); assert.equal(await aPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).inputValue(), draft);
        assert.deepEqual(await read(h, aPage, "/api/organization/settings"), before);
        const destination = await leave(); dialog = aPage.getByRole("dialog", { name: "¿Salir sin guardar?", exact: true });
        await dialog.getByRole("button", { name: "Salir sin guardar", exact: true }).click(); await aPage.waitForURL((url) => url.pathname === destination);
        await aPage.goto(new URL("/org/configuracion", h.base).href);
        assert.equal(await aPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).inputValue(), before.name);
        assert.deepEqual(await read(h, aPage, "/api/organization/settings"), before); assert.equal(writes, 0); await assertViewport(aPage);
      } finally { aPage.off("request", watch); }
      return "Seguir editando conservó el borrador; salir lo descartó y mostró lo guardado, sin PUT ni cambio de versión.";
    });
    await run(8, [1], async () => {
      await restore();
      const invitedEmail = "auditoria-publica-" + tag + "@example.test";
      await aPage.goto(new URL("/org/usuarios", h.base).href); await aPage.getByRole("button", { name: "Invitar usuario", exact: true }).click();
      const invite = aPage.getByRole("dialog", { name: "Invitar usuario", exact: true }); await invite.getByRole("textbox", { name: "Correo", exact: true }).fill(invitedEmail);
      await invite.getByRole("combobox", { name: "Empresa", exact: true }).click(); await aPage.getByRole("option", { name: companyA.name, exact: true }).click();
      await invite.getByRole("button", { name: "Roles en la empresa", exact: true }).click(); await aPage.getByRole("menuitemcheckbox", { name: "Administrador", exact: true }).click(); await aPage.keyboard.press("Escape");
      await clickForResponse(aPage, invite.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201); await invite.waitFor({ state: "hidden" });
      // Genera el evento de Plataforma por una acción UI legítima, sin seed de auditoría.
      await operate("Despublicar", true); await restore();
      const first = await read(h, aPage, "/api/organization/audit?period=all&limit=1"); assert.deepEqual(Object.keys(first).sort(), ["hasMore", "items", "nextCursor"]); assert.equal(first.hasMore, true); assert.ok(first.nextCursor);
      const second = await read(h, aPage, "/api/organization/audit?period=all&limit=1&after=" + encodeURIComponent(first.nextCursor)); assert.ok(second.items.every((entry) => entry.id !== first.items[0].id));
      const searchResponse = aPage.waitForResponse((response) => at("/api/organization/audit")(response) && new URL(response.url()).searchParams.get("search") === actorName);
      void searchResponse.catch(() => {});
      if (h.width === 390) await aPage.goto(new URL("/org/auditoria?search=" + encodeURIComponent(actorName), h.base).href);
      else { await aPage.goto(new URL("/org/auditoria", h.base).href); await aPage.getByRole("searchbox", { name: "Buscar en la auditoría", exact: true }).fill(actorName); }
      assert.equal((await searchResponse).status(), 200);
      let query = aPage.waitForResponse((response) => at("/api/organization/audit")(response) && new URL(response.url()).searchParams.get("category") === "users"); void query.catch(() => {});
      await auditFilter(h, aPage, "category", "Usuarios"); assert.equal((await query).status(), 200);
      query = aPage.waitForResponse((response) => at("/api/organization/audit")(response) && new URL(response.url()).searchParams.get("actorId") === a.me.id); void query.catch(() => {});
      await auditFilter(h, aPage, "actor", actorName); assert.equal((await query).status(), 200);
      const own = await read(h, aPage, "/api/organization/audit?period=all&category=users&actorId=" + a.me.id + "&search=" + encodeURIComponent(actorName) + "&limit=50");
      const entry = own.items.find((row) => row.entityType === "Invitation" && row.affectedDisplayName === "au•••@example.test" && row.whereText.includes(companyA.name)); assert.ok(entry);
      const openDetail = async (row) => { await aPage.getByRole("button", { name: h.width === 390 ? new RegExp("^" + escapeRegex(row.actionText), "u") : "Ver el detalle de " + row.actionText, exact: h.width !== 390 }).first().click(); return aPage.getByRole("dialog", { name: row.actionText, exact: true }); };
      let detail = await openDetail(entry); await detail.getByText("au•••@example.test", { exact: true }).first().waitFor(); await detail.getByText(companyA.name, { exact: false }).first().waitFor(); assert.equal((await detail.innerText()).includes(invitedEmail), false);
      await detail.getByRole("button", { name: "Cerrar", exact: true }).last().click();
      await aPage.goto(new URL("/org/auditoria", h.base).href);
      query = aPage.waitForResponse((response) => at("/api/organization/audit")(response) && new URL(response.url()).searchParams.get("actorKind") === "PlatformOperator"); void query.catch(() => {});
      await auditFilter(h, aPage, "actor", "Plataforma"); assert.equal((await query).status(), 200);
      const platforms = (await read(h, aPage, "/api/organization/audit?period=all&actorKind=PlatformOperator&limit=50")).items;
      requireAuditPrivacy({ invitation: entry, platforms, invitedEmail, actorId: a.me.id, actorEmail: a.email, companyName: companyA.name, operator, reason: internalReason });
      detail = await openDetail(platforms[0]); await detail.getByText("Plataforma", { exact: true }).first().waitFor();
      for (const value of [operator.id, operator.email, operator.displayName, internalReason].filter(Boolean)) assert.equal((await detail.innerText()).includes(value), false);
      await assertViewport(aPage); return "Cursor sin total; búsqueda, filtros y detalles reales: invitación/empresa enmascaradas y Plataforma sin identidad ni motivo interno.";
    });
  } catch (error) { suiteFailures.push(error); }
  finally {
    for (const page of [aPage, bPage, platformPage]) {
      try { const close = page.getByRole("dialog").getByRole("button", { name: "Cerrar", exact: true }).last(); if (await close.isVisible()) await close.click(); await discard(page); }
      catch (error) { suiteFailures.push(error); }
    }
    for (const page of [...activePages].reverse()) {
      try { await h.signOut(page); activePages.delete(page); } catch (error) { suiteFailures.push(error); }
    }
    try { await cleanupContinuationSessions(h); } catch (error) { suiteFailures.push(error); }
    for (const page of pages) { try { await page.close(); } catch (error) { suiteFailures.push(error); } }
  }
  if (suiteFailures.length === 1) throw suiteFailures[0];
  if (suiteFailures.length > 1) throw new AggregateError(suiteFailures, "Fallaron el complemento público o su salida UI.");
  return outcomes;
}
