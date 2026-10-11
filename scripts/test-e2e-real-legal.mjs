import assert from "node:assert/strict";
import { responsesForAction } from "./test-e2e-real-whatsapp-action.mjs";

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
