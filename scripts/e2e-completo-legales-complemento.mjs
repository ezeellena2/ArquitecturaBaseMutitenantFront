import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { clickForResponse, requireProblem } from "./e2e-completo-negocio.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { journeyDate } from "./recorrido-usuario.mjs";
import { confirmRecentAuthentication, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { parseLegalPublicationReceipt, assertPublishedTerms, assertPendingTerms, acceptPublishedLegalAndReturn } from "./test-e2e-real-legal.mjs";
import { assertViewport } from "./e2e-completo-personal.mjs";

export const legalSupplementDefinitions = [
  { id: "LEG-01", area: "Legales", actor: "Persona existente y operador con platform.legal.manage y MFA", action: "Publicar términos V1/V2 por UI mientras la persona acepta la versión anterior", route: "/plataforma/legales/nueva · /aceptar-terminos · /cuenta", expected: "Publicaciones201 con fecha civil de hoy y contenidos es/en; aceptación vieja409 Legal.Document.VersionChanged, refetch de V2 y casilla reiniciada; sin marcar no se envía, aceptación explícita204 retorna a Mi cuenta de la misma persona.", covers: ["BACK-CU-018"], critical: true, source: "src/areas/platform/legal/pages/PublishLegalVersionPage.tsx; src/areas/public/legal/pages/AcceptTermsPage.tsx; scripts/test-e2e-real-legal.mjs" },
  { id: "LEG-02", area: "Legales", actor: "Operador con platform.legal.manage y MFA", action: "Rechazar fecha pasada por UI e intentar modificar/eliminar una versión publicada", route: "/plataforma/legales/nueva · /api/platform/legal-documents/:id", expected: "400 Legal.Publication.EffectiveDatePast vinculado al campo effectiveOn sin alterar el catálogo; PUT/DELETE405 y GET idéntico conservan la versión histórica con ambos contenidos.", covers: [], critical: true, source: "src/areas/platform/legal/pages/PublishLegalVersionPage.tsx; back:src/ArquitecturaBaseMultitenant.Api/Controllers/Platform/PlatformLegalDocumentsController.cs" },
];

// Publicar, vigencia/gate e inmutabilidad son ramas necesarias de la misma fila.
export const legalSupplementProofGroups = { "BACK-PL-028": [["LEG-01", "LEG-02"]] };

export function previousCivilDate(value) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/u, "La fecha debe ser DateOnly.");
  const date = new Date(`${value}T00:00:00Z`);
  assert.ok(Number.isFinite(date.getTime())); assert.equal(date.toISOString().slice(0, 10), value, "El día civil debe existir.");
  date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0, 10);
}

export function assertLegalPublicationRequest(body, effectiveOn, contents) {
  previousCivilDate(effectiveOn);
  assert.deepEqual(Object.keys(body).sort(), ["contents", "effectiveOn", "kind"]);
  assert.equal(body.kind, "Terms"); assert.equal(body.effectiveOn, effectiveOn);
  assert.ok(contents.some((entry) => entry.culture.startsWith("es-")) && contents.some((entry) => entry.culture.startsWith("en-")));
  const ordered = (rows) => [...rows].sort((left, right) => left.culture.localeCompare(right.culture));
  assert.deepEqual(ordered(body.contents), ordered(contents), "Se deben publicar los textos exactos de todas las culturas habilitadas.");
}

export function assertStaleLegalRequest(body, first, second) {
  assert.notEqual(first.id, second.id); assert.ok(second.version > first.version);
  assert.deepEqual(body, { documents: [{ id: first.id, version: first.version }] }, "La aceptación debe enviar exactamente la versión vieja mostrada, sin sustituirla por V2.");
}

export async function requirePastLegalPublication(response) {
  const problem = await requireProblem(response, 400, "Legal.Publication.EffectiveDatePast");
  assert.ok(Array.isArray(problem.errors?.effectiveOn) && problem.errors.effectiveOn.length > 0);
  return problem;
}

const pathOf = (response) => new URL(response.url()).pathname;
const endpoint = (route, method = "POST") => (response) => pathOf(response) === route && response.request().method() === method;
const legalEndpoint = "/api/platform/legal-documents";
const termsHeading = (page) => page.getByRole("heading", { name: "Actualizamos los términos", exact: true });
const acceptance = (page) => page.getByRole("button", { name: "Aceptar y seguir", exact: true });
const agreement = (page) => page.getByRole("checkbox", { name: /Leí y acepto/u });
const read = async (h, page, route) => { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); };

function fixtureContents(cultures, tag, version) {
  return cultures.map((culture) => ({ culture: culture.code, text: culture.languageCode === "es" ? `Términos sintéticos ${tag}, publicación ${version}: uso del servicio y responsabilidades de la cuenta.` : `Synthetic terms ${tag}, publication ${version}: service use and account responsibilities.` }));
}

async function publicationForm(h, page, effectiveOn, contents, cultures) {
  await page.goto(new URL("/plataforma/legales", h.base).href);
  await page.getByRole("link", { name: "Publicar versión nueva", exact: true }).first().click();
  await page.getByRole("combobox", { name: "Documento", exact: true }).click();
  await page.getByRole("option", { name: /Términos y condiciones/u }).click();
  await page.getByRole("textbox", { name: "Vigente desde", exact: true }).fill(effectiveOn.split("-").reverse().join("/"));
  for (const content of contents) {
    const culture = cultures.find((entry) => entry.code === content.culture);
    const label = culture.languageCode === "es" ? "En español" : culture.languageCode === "en" ? "En inglés" : `En ${culture.name}`;
    await page.getByRole("textbox", { name: label, exact: true }).fill(content.text);
  }
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  return page.getByRole("alertdialog").getByRole("button", { name: "Publicar", exact: true });
}

async function submitPublication(page, button, operator, expectedStatus) {
  await stopConfirmingRecentAuthentication(page);
  let response = await clickForResponse(page, button, legalEndpoint, "POST", null); let asked = false;
  if (response.status() === 403) {
    await requireProblem(response, 403, "Auth.Platform.ReauthenticationRequired"); asked = true;
    const replay = page.waitForResponse((reply) => endpoint(legalEndpoint)(reply) && reply.status() !== 403); void replay.catch(() => {});
    await confirmRecentAuthentication(page, operator); response = await replay;
  }
  assert.equal(response.status(), expectedStatus); return { response, asked };
}

async function publishedTerms(h, page, receipt, contents, effectiveOn) {
  const document = await read(h, page, `${legalEndpoint}/${receipt.id}`); assertPublishedTerms(document, receipt);
  assert.equal(document.isCurrent, true); assert.match(document.effectiveAtUtc, /Z$/u);
  assert.equal(journeyDate(new Date(document.effectiveAtUtc)), effectiveOn);
  const ordered = (rows) => [...rows].sort((left, right) => left.culture.localeCompare(right.culture));
  assert.deepEqual(ordered(document.contents), ordered(contents));
  const group = (await read(h, page, legalEndpoint)).find((entry) => entry.kind === "Terms");
  assert.equal(group.currentVersion, receipt.version); assert.equal(group.currentEffectiveAtUtc, document.effectiveAtUtc);
  assert.ok(group.versions.some((entry) => entry.id === receipt.id && entry.version === receipt.version && entry.isCurrent));
}

async function loginToAccountGate(h, page, email, receipt) {
  await page.goto(new URL("/cuenta", h.base).href);
  await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
  const before = new Set(await h.env.files());
  const sent = await sendWithCooldown(() => clickForResponse(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", "POST", null));
  assert.equal(sent.status(), 202); await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
  await fillOtp(page, await h.env.code(email, before));
  await clickForResponse(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", "POST", 200);
  await termsHeading(page).waitFor(); assertPendingTerms(await read(h, page, "/api/me"), receipt);
  await page.getByText(new RegExp(`^Cambiaron los.*\\(versión ${receipt.version}\\)\\.$`, "u")).waitFor();
  assert.equal(await agreement(page).isChecked(), false);
}

async function checkVersionRace(h, personPage, operatorPage, state) {
  const person = await h.registerPerson(personPage); await h.signOut(personPage);
  state.operator = h.width === 1440 ? "e2e-a3-operator@example.test" : "e2e-a1-operator@example.test";
  const operator = await h.login(operatorPage, state.operator, "platform");
  assert.equal(operator.access, "platform"); assert.ok(operator.effectivePermissions.platform.includes("platform.legal.manage"));
  state.cultures = (await read(h, operatorPage, "/api/reference-data")).cultures.filter((culture) => culture.isEnabled);
  assert.ok(state.cultures.some((entry) => entry.languageCode === "es") && state.cultures.some((entry) => entry.languageCode === "en"));
  const tag = `${h.width}-${randomUUID().slice(0, 8)}`; state.contents = fixtureContents(state.cultures, tag, "V1");
  state.effectiveOn = journeyDate();
  const expired = await h.env.command("recent-proof", { kind: "expire", email: state.operator }); assert.ok(expired.expired >= 1);
  let button = await publicationForm(h, operatorPage, state.effectiveOn, state.contents, state.cultures);
  const first = await submitPublication(operatorPage, button, state.operator, 201); assert.equal(first.asked, true, "La publicación debe confirmar al operador real con MFA.");
  assertLegalPublicationRequest(first.response.request().postDataJSON(), state.effectiveOn, state.contents);
  state.first = parseLegalPublicationReceipt(await first.response.text());
  await acceptPublishedLegalAndReturn(operatorPage, state.first, legalEndpoint);
  await publishedTerms(h, operatorPage, state.first, state.contents, state.effectiveOn);

  const gateStartedAt = Date.now();
  await loginToAccountGate(h, personPage, person.email, state.first);
  await agreement(personPage).check();
  const nextContents = fixtureContents(state.cultures, tag, "V2");
  button = await publicationForm(h, operatorPage, state.effectiveOn, nextContents, state.cultures);
  const second = await submitPublication(operatorPage, button, state.operator, 201);
  assertLegalPublicationRequest(second.response.request().postDataJSON(), state.effectiveOn, nextContents);
  state.second = parseLegalPublicationReceipt(await second.response.text());
  assert.ok(state.second.version > state.first.version); assert.notEqual(state.second.id, state.first.id);
  await acceptPublishedLegalAndReturn(operatorPage, state.second, legalEndpoint);
  await publishedTerms(h, operatorPage, state.second, nextContents, state.effectiveOn);
  assert.ok(Date.now() - gateStartedAt < 5 * 60_000, "La carrera real debe mantenerse dentro de staleTime de useCurrentUser.");
  assert.equal(await agreement(personPage).isChecked(), true);
  let writes = 0; const requested = (request) => { if (new URL(request.url()).pathname === "/api/legal/accept" && request.method() === "POST") writes++; };
  personPage.on("request", requested);
  try {
    const refetched = personPage.waitForResponse(endpoint("/api/me", "GET")); void refetched.catch(() => {});
    const stale = await clickForResponse(personPage, acceptance(personPage), "/api/legal/accept", "POST", 409);
    await requireProblem(stale, 409, "Legal.Document.VersionChanged");
    assertStaleLegalRequest(stale.request().postDataJSON(), state.first, state.second);
    const refreshed = await refetched; assert.equal(refreshed.status(), 200); assertPendingTerms(await refreshed.json(), state.second);
    await personPage.getByText(new RegExp(`^Cambiaron los.*\\(versión ${state.second.version}\\)\\.$`, "u")).waitFor();
    assert.equal(await agreement(personPage).isChecked(), false); await personPage.getByRole("alert").first().waitFor();
    const afterConflict = writes; assert.equal(afterConflict, 1);
    await acceptance(personPage).click();
    await personPage.getByRole("alert").filter({ hasText: "Aceptá los Términos y la Política de privacidad." }).waitFor();
    assert.equal(writes, afterConflict, "El refetch no debe aceptar automáticamente y sin casilla no se envía otra aceptación.");
    await acceptPublishedLegalAndReturn(personPage, state.second, "/api/me");
    assert.equal(writes, afterConflict + 1);
    await personPage.waitForURL((url) => url.pathname === "/cuenta");
    await personPage.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor();
    const accepted = await read(h, personPage, "/api/me"); assert.equal(accepted.id, person.me.id); assert.equal(accepted.access, "consumer"); assert.deepEqual(accepted.pendingLegalDocuments, []);
    await assertViewport(personPage);
    return "V1 y V2 publicadas201 por UI con fecha civil y textos es/en; V1 enviada realmente produjo409 VersionChanged, refetch de V2 y casilla desmarcada. Sin marcar no hubo POST; aceptación explícita204 volvió a Mi cuenta con la misma identidad.";
  } finally { personPage.off("request", requested); }
}

async function checkPastDateAndImmutability(h, page, state) {
  const catalog = await read(h, page, legalEndpoint);
  const route = `${legalEndpoint}/${state.first.id}`; const document = await read(h, page, route);
  assertPublishedTerms(document, state.first); assert.equal(document.isCurrent, false);
  const yesterday = previousCivilDate(journeyDate());
  const button = await publicationForm(h, page, yesterday, state.contents, state.cultures);
  const { response } = await submitPublication(page, button, state.operator, 400);
  assertLegalPublicationRequest(response.request().postDataJSON(), yesterday, state.contents);
  const problem = await requirePastLegalPublication(response);
  const date = page.getByRole("textbox", { name: "Vigente desde", exact: true });
  await page.getByRole("alert").filter({ hasText: problem.errors.effectiveOn[0] }).waitFor();
  assert.equal(await date.getAttribute("aria-invalid"), "true");
  const description = await date.getAttribute("aria-describedby"); assert.ok(description);
  const accessibleError = await date.evaluate((element) => (element.getAttribute("aria-describedby") ?? "").split(/\s+/u).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? "").join(" "));
  assert.ok(accessibleError.includes(problem.errors.effectiveOn[0]), "El error de fecha debe describir el campo, además de verse en pantalla.");
  assert.equal(await date.inputValue(), yesterday.split("-").reverse().join("/"));
  for (const [language, label] of [["es", "En español"], ["en", "En inglés"]]) assert.equal(await page.getByRole("textbox", { name: label, exact: true }).inputValue(), state.contents.find((entry) => state.cultures.find((culture) => culture.code === entry.culture).languageCode === language).text);
  assert.deepEqual(await read(h, page, legalEndpoint), catalog, "La fecha rechazada no debe crear ni cambiar ninguna versión.");
  for (const method of ["PUT", "DELETE"]) {
    const rejected = await h.api(page, route, { method, ...(method === "PUT" ? { data: { kind: "Terms", effectiveOn: state.effectiveOn, contents: state.contents } } : {}) });
    assert.equal(rejected.status(), 405, `Una versión publicada no ofrece ${method}.`);
    assert.deepEqual(await read(h, page, route), document, `${method} no debe modificar el documento histórico.`);
  }
  await assertViewport(page);
  return "Ayer civil por UI dio400 EffectiveDatePast en el campo accesible effectiveOn, con borrador y catálogo intactos. GET de V1 conservó ID, versión, vigencia y textos es/en después de PUT405 y DELETE405.";
}

async function closeSessions(h, personPage, operatorPage) {
  const failures = [];
  for (const [page, cookieName, route] of [[personPage, ".AspNetCore.Identity.Application", "/cuenta"], [operatorPage, ".AspNetCore.Identity.Platform", "/plataforma"]]) {
    try {
      await stopConfirmingRecentAuthentication(page);
      if ((await h.context.cookies(h.base.href)).some((cookie) => cookie.name === cookieName)) {
        // Nueva navegación descarta sólo el borrador técnico fallido; la sesión se cierra siempre por la UI real.
        await page.goto(new URL(route, h.base).href);
        const gate = termsHeading(page); const frame = page.locator('nav[aria-label="Secciones"], button[aria-haspopup="menu"]').filter({ visible: true }).first();
        const login = page.getByRole("textbox", { name: "Correo electrónico", exact: true });
        await gate.or(frame).or(login).first().waitFor();
        if (await gate.isVisible()) { await page.getByRole("button", { name: "Salir", exact: true }).click(); await page.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().waitFor(); }
        else if (await frame.isVisible()) await h.signOut(page);
        assert.equal((await h.context.cookies(h.base.href)).some((cookie) => cookie.name === cookieName), false, "La salida UI debe retirar la sesión propia.");
      }
    } catch (error) { failures.push(error); }
    finally { try { await page.close(); } catch (error) { failures.push(error); } }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Fallaron salidas UI del complemento legal.");
}

export async function runLegalSupplementCases(h) {
  const personPage = await h.newPage(); const operatorPage = await h.newPage(); const state = {}; const outcomes = new Map();
  try {
    const first = await h.record("LEG-01", () => personPage, () => checkVersionRace(h, personPage, operatorPage, state)); outcomes.set("LEG-01", first);
    if (!first.ok) { await h.block("LEG-02", "Faltó completar LEG-01 y confirmar sus dos versiones legales reales.", operatorPage); outcomes.set("LEG-02", { ok: false, blocked: true }); }
    else outcomes.set("LEG-02", await h.record("LEG-02", () => operatorPage, () => checkPastDateAndImmutability(h, operatorPage, state)));
  } finally { await closeSessions(h, personPage, operatorPage); }
  return outcomes;
}
