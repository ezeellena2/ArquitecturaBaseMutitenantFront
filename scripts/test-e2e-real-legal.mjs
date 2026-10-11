import assert from "node:assert/strict";

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
