import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existingScriptCases } from "./e2e-completo-inventario-front.mjs";
import { cleanupContinuationSessions } from "./e2e-completo-continuacion.mjs";
import { forceBusinessLogin, clickForResponse } from "./e2e-completo-negocio.mjs";
import { requireSyntheticEmail, withSuccessToastClearance } from "./e2e-completo-soporte.mjs";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { assistantLogin } from "./assistant-real-ui.mjs";
import { runE8Journey, sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { runE11Journey } from "./recorrido-usuario-e11.mjs";
import { runE9Journey } from "./recorrido-usuario-e9.mjs";
import { waitForPlatformHome } from "./recorrido-usuario.mjs";

const definitionsFor = (select) => existingScriptCases.filter((entry) => select(entry.id)).map((entry) => ({
  id: "BASE-" + entry.id, area: "Fase original del recorrido", actor: "Actor sintético del recorrido original",
  action: entry.title, route: entry.route ?? "/", expected: entry.expected, source: entry.source,
  existingScripts: [entry.script], critical: true,
}));
export const baselineWhatsAppDefinitions = definitionsFor((id) => id.startsWith("E8-") || id === "30");
const assistantEvidenceDefinitions = [
  { id: "AS-TEC-01", actor: "Dueña de la organización propia", route: "/org/asistente",
    action: "Comprobar transporte real, replay, desconexión, Detener y límites de archivos e historial",
    expected: "SSE informa inicio, deltas y fin; replay conserva turno y consumo, desconexión no cancela y Detener queda persistido. Se mantienen las aserciones originales de archivos e historial.",
    source: "scripts/assistant-real-ui.mjs#assistantTransportCases", covers: ["BACK-AS-008"] },
  { id: "AS-TEC-02", actor: "Dueña de la organización propia", route: "/api/organization/assistant/conversations/:id/attachments",
    action: "Enviar cinco adjuntos propios y rechazar seis",
    expected: "Cinco archivos reales se suben y quedan en el mensaje; el envío con seis recibe400.",
    source: "scripts/assistant-real-ui.mjs#assistantAttachmentQuantityCases", covers: [] },
  { id: "AS-TEC-03", actor: "Misma persona en acceso Personal y operador de Plataforma", route: "/asistente · /plataforma/asistente",
    action: "Intentar leer una conversación de Empresa desde Personal y Plataforma",
    expected: "Ambos accesos reciben404 con Assistant.Conversation.NotFound y traceId para la conversación Business y conservan sus atajos propios.",
    source: "scripts/assistant-real-ui.mjs#assistantAccessCases", covers: [] },
].map((entry) => ({ ...entry, area: "Asistente: comprobaciones originales sin callback", existingScripts: ["assistant-real-ui.mjs"], critical: true }));
export const baselineAssistantDefinitions = [...definitionsFor((id) => id.startsWith("E8B-")), ...assistantEvidenceDefinitions];
export const baselineOrganizationWhatsAppDefinitions = definitionsFor((id) => id.startsWith("E11-"));
export const baselineSecurityDefinitions = definitionsFor((id) => id.startsWith("E9-"));

export const assistantEvidenceModuleUrl = new URL("./assistant-real-ui.mjs?e2e-completo-evidencia", import.meta.url).href;

/** Observa sólo los dos pedidos originales, sin emitir ni repetir llamadas. */
export async function observeAssistantIsolation({ page, platformPage, ownBusinessId }, action) {
  const pending = []; const seen = new Set();
  const observe = (access) => (response) => {
    if (response.request().method() !== "GET" || new URL(response.url()).pathname !== "/api/" + access + "/assistant/conversations/" + ownBusinessId) return;
    const read = (async () => {
      assert.equal(response.status(), 404, "El cruce de acceso debe responder404.");
      const body = await response.json();
      assert.equal(body.code, "Assistant.Conversation.NotFound");
      assert.ok(typeof body.traceId === "string" && body.traceId.trim().length > 0, "El404 debe incluir traceId.");
      seen.add(access);
    })();
    pending.push(read); void read.catch(() => {});
  };
  const personal = observe("me"); const platform = observe("platform");
  page.on("response", personal); platformPage.on("response", platform);
  let value; let failure;
  try { value = await action(); }
  catch (error) { failure = error; }
  finally {
    page.off("response", personal); platformPage.off("response", platform);
    const reads = await Promise.allSettled(pending);
    if (!failure) failure = reads.find((result) => result.status === "rejected")?.reason;
  }
  if (failure) throw failure;
  assert.deepEqual([...seen].sort(), ["me", "platform"], "Deben observarse los dos accesos con su código404 real.");
  return value;
}

/** Sólo agrega un adaptador sobre declaraciones locales; ninguna aserción original se transforma. */
export function exposeAssistantEvidence(source) {
  assert.ok(!source.includes("export async function runCompleteAssistantJourney("), "El asistente ya fue adaptado.");
  for (const marker of ["export async function runAssistantJourney(", "async function assistantTransportCases(",
    "async function assistantAccessCases(", "export async function assistantAttachmentQuantityCases("]) {
    assert.equal(source.split(marker).length, 2, "El adaptador requiere las funciones locales originales únicas.");
  }
  return source + "\n\n" + observeAssistantIsolation.toString() + `

export async function runCompleteAssistantJourney(options) {
  const transport = assistantTransportCases;
  const quantity = assistantAttachmentQuantityCases;
  const access = assistantAccessCases;
  assistantTransportCases = (args) => options.record("AS-TEC-01", args.width, () => args.page, async () => {
    await transport(args);
    return "Pasaron las aserciones originales de SSE, replay sin consumo duplicado, desconexión, Detener persistido, archivos e historial.";
  });
  assistantAttachmentQuantityCases = (page, root, width) => options.record("AS-TEC-02", width, () => page, async () => {
    await quantity(page, root, width);
    return "Cinco adjuntos propios se persistieron en el mensaje; seis fueron rechazados con400.";
  });
  assistantAccessCases = (args) => {
    let capturePage = args.page;
    return options.record("AS-TEC-03", args.width, () => capturePage, async () => {
      try {
        await observeAssistantIsolation(args, () => access(args));
        capturePage = args.platformPage;
        return "Personal y Plataforma recibieron404 con Assistant.Conversation.NotFound y traceId para la conversación Business propia; sus atajos originales siguieron visibles.";
      } catch (error) {
        if (error.assistantStage?.startsWith("access.platform")) capturePage = args.platformPage;
        throw error;
      }
    });
  };
  try {
    return await runAssistantJourney(options);
  } finally {
    assistantTransportCases = transport;
    assistantAttachmentQuantityCases = quantity;
    assistantAccessCases = access;
  }
}
`;
}

/** Hook de Node acotado al módulo privado; importarlo no inicia ninguna fase ni entorno. */
export async function loadAssistantEvidence({ register = registerHooks, importModule = (url) => import(url) } = {}) {
  const hooks = register({
    load: (url, context, nextLoad) => {
      const loaded = nextLoad(url, context);
      if (url !== assistantEvidenceModuleUrl) return loaded;
      assert.equal(loaded.format, "module");
      return { ...loaded, source: exposeAssistantEvidence(typeof loaded.source === "string" ? loaded.source : Buffer.from(loaded.source).toString("utf8")) };
    },
  });
  try { return await importModule(assistantEvidenceModuleUrl); }
  finally { hooks.deregister(); }
}

const phaseOperator = (width) => {
  assert.ok([1440, 390].includes(width));
  // 5b y 5c quedan exclusivamente para el primer ingreso que prueba E9.
  return width === 1440 ? "e2e-a3-operator@example.test" : "e2e-a1-operator@example.test";
};
const asError = (error) => error instanceof Error ? error : new Error("La fase no se completó.");
const isPassed = (h, id) => h.resultFor?.(id, h.width)?.status === "passed";
async function blockUnvisited(h, definitions, visited, error, page) {
  for (const entry of definitions) {
    if (!visited.has(entry.id) && !isPassed(h, entry.id)) {
      await h.block(entry.id, "La fase original no llegó a este paso (" + error.name + "). No se certifica por preparación ni por otra corrida.", page);
    }
  }
}

/** Ejecuta los callbacks originales. Un h.record fallido debe volver a cortar el flujo original. */
export async function runOriginalBaselinePhase(h, definitions, run, { page } = {}) {
  const ids = new Set(definitions.map((entry) => entry.id)); const visited = new Set();
  assert.equal(ids.size, definitions.length, "La fase no puede repetir IDs de evidencia.");
  const record = async (id, width, getPage, action, diagnostic) => {
    assert.equal(width, h.width, "La fase original conserva el ancho elegido.");
    const targetId = ids.has(id) ? id : "BASE-" + id;
    assert.ok(ids.has(targetId), "La fase no puede registrar un ID de otra fase.");
    assert.ok(!visited.has(targetId), "Un paso original se ejecuta una sola vez en la fase.");
    visited.add(targetId);
    const perform = targetId === "BASE-E11-03" && h.width === 390 ? () => withSuccessToastClearance(getPage(), action) : action;
    const result = await h.record(targetId, getPage, perform, diagnostic);
    if (result?.ok !== true) throw asError(result?.error);
    return result;
  };
  try {
    await run(record);
    assert.equal(visited.size, ids.size, "La función original debe visitar todos los pasos declarados de la fase.");
    return { visited: [...visited] };
  } catch (caught) {
    const error = asError(caught);
    await blockUnvisited(h, definitions, visited, error, page);
    error.baselinePhaseBlocked = true;
    throw error;
  }
}

async function publishBaselinePage(h, fixture) {
  const { page, owner } = fixture;
  fixture.site = new URL(h.base); fixture.site.hostname = owner.slug + "." + h.base.hostname;
  await page.goto(new URL("/org/pagina", h.base).href);
  await page.getByRole("textbox", { name: "Nombre de la página", exact: true }).fill("Página de la fase " + h.width);
  await page.getByRole("textbox", { name: "Descripción", exact: true }).fill("Publicación sintética para la fase original de WhatsApp.");
  await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/organization/public-page", "PUT");
  const visible = page.getByRole("switch", { name: "Visible en " + fixture.site.host, exact: true });
  await clickForResponse(page, visible, "/api/organization/public-page/publish", "POST");
  assert.equal(await visible.isChecked(), true);
  await page.getByRole("link", { name: "Ver página", exact: true }).waitFor();
}

/** Preparación propia por UI; no aprueba ninguno de los IDs BASE del núcleo. */
export async function prepareBaselineFixture(h, fixture, { business = true, publish = false }, {
  registerBusiness = (page) => h.registerBusiness(page),
  publish: publishPage = (current) => publishBaselinePage(h, current),
  signOut = (page) => h.signOut(page),
  operatorLogin = (page, email) => assistantLogin(page, h.env, h.base, email, "platform"),
} = {}) {
  assert.ok(!publish || business, "Publicar requiere la organización creada por UI.");
  fixture.operator = phaseOperator(h.width);
  if (business) {
    fixture.owner = await registerBusiness(fixture.page);
    requireSyntheticEmail(fixture.owner.email);
    assert.equal(fixture.owner.me.access, "business"); assert.ok(fixture.owner.me.activeTenantId);
    if (publish) await publishPage(fixture);
    await signOut(fixture.page);
  }
  await operatorLogin(fixture.platformPage, fixture.operator);
  return fixture;
}

/** Cada fase usa pestañas propias dentro del contexto existente y cierra sus sesiones por UI. */
export async function withBaselineFixture(h, options, journey, {
  prepare = prepareBaselineFixture,
  cleanup = (current) => cleanupContinuationSessions(current),
} = {}) {
  const fixture = {}; const pages = []; const failures = [];
  try {
    fixture.page = await h.newPage(); pages.push(fixture.page);
    fixture.platformPage = await h.newPage(); pages.push(fixture.platformPage);
    for (const page of pages) { page.setDefaultTimeout?.(30_000); page.setDefaultNavigationTimeout?.(60_000); }
    await prepare(h, fixture, options);
    await journey(fixture);
  } catch (caught) {
    const error = asError(caught); failures.push(error);
    if (!error.baselinePhaseBlocked) await blockUnvisited(h, options.definitions, new Set(), error, fixture.page);
  } finally {
    try { await cleanup(h, fixture); } catch (error) { failures.push(error); }
    for (const page of pages) {
      try { await page.close(); } catch (error) { failures.push(error); }
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Fallaron la fase y su salida por UI.");
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
function phaseUi(h, fixture) {
  const { page, owner } = fixture;
  const signOut = (target = page) => h.signOut(target);
  const awaitApp = async (target, profile = "Personal", route = "/") => {
    await target.waitForURL((url) => url.origin === h.base.origin && url.pathname === route);
    if (h.width === 390) await target.getByRole("navigation", { name: "Secciones", exact: true }).waitFor();
    else await target.getByRole("button", { name: new RegExp(", " + escapeRegex(profile) + "$", "u") }).waitFor();
  };
  // Asistente espera (page,email,access); E9 espera (email,access,page).
  const loginAssistant = (target, email, access) => access === "business"
    ? forceBusinessLogin(h, target, email) : assistantLogin(target, h.env, h.base, email, access);
  const loginSecurity = (email, access = "consumer", target = fixture.platformPage) => assistantLogin(target, h.env, h.base, email, access);
  const loginBusiness = () => forceBusinessLogin(h, page, owner.email);
  const requestCode = async (target, email) => {
    requireSyntheticEmail(email);
    await target.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
    const before = new Set(await h.env.files());
    await sendWithCooldown(() => clickForResponse(target, target.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", "POST", null), { signal: h.signal });
    await target.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
    return h.env.code(email, before);
  };
  const verify = async (target, code) => {
    await fillOtp(target, code);
    return clickForResponse(target, target.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", "POST");
  };
  return { signOut, awaitApp, loginAssistant, loginSecurity, loginBusiness, requestCode, verify };
}

/** La misma acción y aserciones de 30 en recorrido-usuario.mjs, con la organización propia de esta fase. */
async function unpublishOriginalPage(h, fixture, ui) {
  const { page, site } = fixture;
  await ui.loginBusiness();
  await page.goto(new URL("/org/pagina", h.base).href);
  const visible = page.getByRole("switch", { name: "Visible en " + site.host, exact: true });
  await visible.waitFor();
  const response = page.waitForResponse((reply) => new URL(reply.url()).pathname === "/api/organization/public-page/unpublish" && reply.request().method() === "POST");
  void response.catch(() => {});
  await visible.click();
  await page.getByRole("dialog").getByRole("button", { name: "Despublicar", exact: true }).click();
  assert.equal((await response).status(), 200);
  await page.waitForFunction(() => [...document.querySelectorAll('[role="switch"]')].some((item) => item.getAttribute("aria-checked") === "false"));
  assert.equal(await visible.isChecked(), false);
  await ui.signOut(page);
  await page.goto(site.href);
  await page.getByRole("heading", { name: "Esta página no está disponible", exact: true }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Ir a ArquitecturaBase", exact: true }).getAttribute("href"), h.base.href);
  return "Tras despublicar por UI, el mismo subdominio mostró Esta página no está disponible y un regreso al inicio.";
}

export async function runBaselineWhatsAppCases(h) {
  return withBaselineFixture(h, { definitions: baselineWhatsAppDefinitions, business: true, publish: true }, async (fixture) => {
    const ui = phaseUi(h, fixture);
    await runOriginalBaselinePhase(h, baselineWhatsAppDefinitions, async (record) => {
      const failures = [];
      try {
        await runE8Journey({ page: fixture.page, platformPage: fixture.platformPage, width: h.width, env: h.env, base: h.base,
          site: fixture.site, record, signOut: ui.signOut, awaitApp: ui.awaitApp, awaitPlatformHome: waitForPlatformHome, signal: h.signal });
      } catch (error) { failures.push(error); }
      // 30 sólo depende de la publicación propia, por lo que un fallo E8 no impide esta acción explícita.
      try { await record("30", h.width, () => fixture.page, () => unpublishOriginalPage(h, fixture, ui)); }
      catch (error) { failures.push(error); }
      if (failures.length === 1) throw failures[0];
      if (failures.length > 1) throw new AggregateError(failures, "Fallaron WhatsApp y la despublicación dirigida.");
    }, { page: fixture.page });
  });
}

export async function runBaselineAssistantCases(h) {
  const { runCompleteAssistantJourney } = await loadAssistantEvidence();
  return withBaselineFixture(h, { definitions: baselineAssistantDefinitions, business: true }, async (fixture) => {
    const ui = phaseUi(h, fixture);
    await runOriginalBaselinePhase(h, baselineAssistantDefinitions, (record) => runCompleteAssistantJourney({
      page: fixture.page, platformPage: fixture.platformPage, width: h.width, env: h.env, base: h.base,
      businessEmail: fixture.owner.email, operatorEmail: fixture.operator, organizationName: fixture.owner.organization,
      record, login: ui.loginAssistant, signOut: ui.signOut,
    }), { page: fixture.page });
  });
}

export async function runBaselineOrganizationWhatsAppCases(h) {
  return withBaselineFixture(h, { definitions: baselineOrganizationWhatsAppDefinitions, business: true }, async (fixture) => {
    const ui = phaseUi(h, fixture);
    await runOriginalBaselinePhase(h, baselineOrganizationWhatsAppDefinitions, (record) => runE11Journey({
      page: fixture.page, platformPage: fixture.platformPage, width: h.width, env: h.env, base: h.base,
      record, signOut: ui.signOut, awaitApp: ui.awaitApp, loginBusiness: ui.loginBusiness, organization: fixture.owner.organization,
    }), { page: fixture.page });
  });
}

export async function runBaselineSecurityCases(h) {
  return withBaselineFixture(h, { definitions: baselineSecurityDefinitions, business: false }, async (fixture) => {
    const ui = phaseUi(h, fixture);
    await runOriginalBaselinePhase(h, baselineSecurityDefinitions, (record) => runE9Journey({
      platformPage: fixture.platformPage, width: h.width, env: h.env, base: h.base, record, signOut: ui.signOut,
      login: ui.loginSecurity, requestCode: ui.requestCode, verify: ui.verify, awaitPlatformHome: waitForPlatformHome, operator: fixture.operator,
    }), { page: fixture.platformPage });
  });
}

export const baselinewhatsapp = { definitions: baselineWhatsAppDefinitions, run: runBaselineWhatsAppCases };
export const baselineasistente = { definitions: baselineAssistantDefinitions, run: runBaselineAssistantCases };
export const baselineorgwa = { definitions: baselineOrganizationWhatsAppDefinitions, run: runBaselineOrganizationWhatsAppCases };
export const baselineseguridad = { definitions: baselineSecurityDefinitions, run: runBaselineSecurityCases };
