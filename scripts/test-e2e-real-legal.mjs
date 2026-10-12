import assert from "node:assert/strict";
import { responsesForAction } from "./test-e2e-real-whatsapp-action.mjs";

const legalHeadings = ["Actualizamos los términos", "Documentos legales", "Publicar versión nueva", "No pudimos abrir esta pantalla", "¿Salir sin guardar?"];
const legalRoutes = new Set(["/plataforma", "/plataforma/legales", "/plataforma/legales/nueva", "/aceptar-terminos"]);

/** Sólo estado HTTP y tipos/versiones legales; nunca identidad, IDs, cuerpos o enlaces. */
export function legalMeMetadata(status, body) {
  const rows = body?.pendingLegalDocuments;
  const valid = (row) => ["Terms", "Privacy"].includes(row?.kind) && Number.isSafeInteger(row.version) && row.version > 0;
  return { status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    pendingValid: Array.isArray(rows) && rows.every(valid),
    pendingKinds: Array.isArray(rows) ? rows.filter(valid).slice(0, 8).map((row) => ({ kind: row.kind, version: row.version })) : [] };
}

/** Observación pasiva y acotada del tránsito tras publicar; no provoca peticiones ni navegación. */
export function observeLegalTransition(page) {
  let published = false; let sequence = 0;
  const requests = new WeakSet(); const events = []; const jobs = new Set();
  const recordEvent = (event) => {
    events.push(event); events.sort((left, right) => left.sequence - right.sequence);
    if (events.length > 8) events.splice(0, events.length - 8);
  };
  const requested = (request) => { if (published) requests.add(request); };
  const responded = (response) => {
    const pathname = new URL(response.url()).pathname; const method = response.request().method();
    if (method === "POST" && pathname === "/api/platform/legal-documents" && response.status() === 201) { published = true; return; }
    if (!published || method !== "GET") return;
    if (pathname === "/api/platform/legal-documents") { recordEvent({ sequence: ++sequence, legalStatus: response.status() }); return; }
    if (pathname !== "/api/me") return;
    const entry = { sequence: ++sequence, startedAfterPublication: requests.has(response.request()) };
    const job = (async () => {
      let body;
      try { if (response.status() === 200) body = await response.json(); }
      catch { /* El cuerpo puede dejar de estar disponible tras navegar; no se publica el error. */ }
      recordEvent({ ...entry, bodyAvailable: body !== undefined, me: legalMeMetadata(response.status(), body) });
    })();
    jobs.add(job); void job.finally(() => jobs.delete(job));
  };
  page.on("request", requested); page.on("response", responded);
  return {
    async snapshot() {
      await Promise.allSettled([...jobs]);
      let route = "otra ruta";
      try { const pathname = new URL(page.url()).pathname; if (legalRoutes.has(pathname)) route = pathname; } catch { /* Sin URL utilizable. */ }
      const visible = await Promise.all(legalHeadings.map(async (name) => await page.getByRole("heading", { name, exact: true }).isVisible().catch(() => false) ? name : null));
      return { route, headings: visible.filter(Boolean), events: events.sort((left, right) => left.sequence - right.sequence).slice(-8) };
    },
    close() { page.off("request", requested); page.off("response", responded); },
  };
}

export function parseLegalPublicationReceipt(source) {
  const receipt = JSON.parse(source);
  assert.ok(receipt && typeof receipt.id === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(receipt.id), "El preparador debe devolver el ID real del documento publicado.");
  assert.ok(Number.isInteger(receipt.version) && receipt.version > 0, "La versión publicada debe ser un entero positivo.");
  return { id: receipt.id, version: receipt.version };
}

export function assertPublishedTerms(document, receipt) {
  assert.equal(document.kind, "Terms");
  assert.equal(document.id, receipt.id, "La API pública debe mostrar el documento que confirmó el preparador.");
  assert.equal(document.version, receipt.version, "La API pública debe mostrar la versión efectiva publicada.");
}

export function assertPendingTerms(account, receipt) {
  assert.ok(account.pendingLegalDocuments?.some((document) => document.kind === "Terms"
    && document.id === receipt.id && document.version === receipt.version), "Me debe exigir el documento recién publicado antes de probar F5.");
}

/** El tipo se confirma en la lectura real: el recibo HTTP sólo publica ID y versión. */
export function assertPublishedLegalVersion(groups, document, receipt, expectedContents) {
  assert.ok(document?.id === receipt.id && document.kind === "Privacy" && document.version === receipt.version,
    "La lectura debe corresponder a la Privacidad recién publicada.");
  assert.ok(document.isCurrent === true && typeof document.effectiveAtUtc === "string" && document.effectiveAtUtc.endsWith("Z"),
    "La Privacidad publicada debe estar vigente y entregar su fecha UTC.");
  const group = groups.find((entry) => entry.kind === "Privacy");
  assert.ok(group?.currentVersion === receipt.version && group.currentEffectiveAtUtc === document.effectiveAtUtc,
    "El grupo Privacidad debe mostrar la versión y vigencia del recibo real.");
  assert.ok(group.versions.some((version) => version.id === receipt.id && version.version === receipt.version
    && version.effectiveAtUtc === document.effectiveAtUtc && version.isCurrent === true),
    "La fila vigente de Privacidad debe identificar el documento publicado.");
  assert.ok(Array.isArray(expectedContents) && expectedContents.length > 0 && Array.isArray(document.contents)
    && expectedContents.every((expected) => document.contents.some((actual) => actual.culture === expected.culture && actual.text === expected.text)),
    "La lectura debe conservar los contenidos publicados en cada cultura.");
}

/** Aceptar exige el POST efectivo y el regreso protegido; ocultar el título no alcanza. */
export async function acceptPublishedLegalAndReturn(page, receipt, protectedPath) {
  const terms = page.getByRole("heading", { name: "Actualizamos los términos", exact: true });
  await terms.waitFor();
  await page.getByRole("checkbox", { name: /Leí y acepto/ }).check();
  let acceptanceObserved = false;
  const returnedRequests = new WeakSet();
  const requested = (request) => {
    if (acceptanceObserved && request.method() === "GET" && new URL(request.url()).pathname === protectedPath) returnedRequests.add(request);
  };
  page.on("request", requested);
  try {
    const [acceptance, protectedResponse] = await responsesForAction(page, [
      (response) => {
        const matches = new URL(response.url()).pathname === "/api/legal/accept" && response.request().method() === "POST";
        if (matches) acceptanceObserved = true;
        return matches;
      },
      (response) => returnedRequests.has(response.request()) && new URL(response.url()).pathname === protectedPath && response.request().method() === "GET",
    ], () => page.getByRole("button", { name: "Aceptar y seguir", exact: true }).click());
    assert.equal(acceptance.status(), 204, "La aceptación de legales debe confirmarse con HTTP 204.");
    assert.ok(acceptance.request().postDataJSON().documents.some((document) => document.id === receipt.id && document.version === receipt.version),
      "La aceptación debe incluir el documento y la versión recién publicados.");
    assert.equal(protectedResponse.status(), 200, "La lectura protegida debe responder 200 después de aceptar los legales.");
    await terms.waitFor({ state: "hidden" });
    return protectedResponse;
  } finally { page.off("request", requested); }
}
