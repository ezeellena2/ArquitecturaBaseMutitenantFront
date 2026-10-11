import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPendingTerms, assertPublishedTerms, parseLegalPublicationReceipt } from "./test-e2e-real-legal.mjs";

const receipt = { id: "11111111-1111-4111-8111-111111111111", version: 3 };
test("acepta el recibo efectivo v3 sin fijar una versión en Front", () => {
  assert.deepEqual(parseLegalPublicationReceipt(JSON.stringify(receipt)), receipt);
  assert.deepEqual(parseLegalPublicationReceipt(JSON.stringify({ ...receipt, version: 14 })), { ...receipt, version: 14 });
});
for (const invalid of ["", "null", "{}", JSON.stringify({ ...receipt, id: "not-id" }), JSON.stringify({ ...receipt, version: 0 }), JSON.stringify({ ...receipt, version: 1.5 }), JSON.stringify({ ...receipt, version: "3" })]) {
  test(`rechaza recibo incompleto o inválido ${invalid}`, () => assert.throws(() => parseLegalPublicationReceipt(invalid)));
}
test("la lectura pública confirma ID y versión; un documento viejo no demuestra publicación", () => {
  assertPublishedTerms({ ...receipt, kind: "Terms" }, receipt);
  assert.throws(() => assertPublishedTerms({ ...receipt, kind: "Terms", version: 2 }, receipt));
  assert.throws(() => assertPublishedTerms({ ...receipt, kind: "Privacy" }, receipt));
  assert.throws(() => assertPublishedTerms({ ...receipt, kind: "Terms", id: "other" }, receipt));
});
test("Me pendiente debe exigir el documento exacto; ni vacío ni otro documento lo sustituyen", () => {
  assertPendingTerms({ pendingLegalDocuments: [{ ...receipt, kind: "Terms" }] }, receipt);
  for (const pendingLegalDocuments of [[], [{ ...receipt, kind: "Terms", version: 2 }], [{ ...receipt, kind: "Privacy" }], [{ ...receipt, kind: "Terms", id: "other" }]])
    assert.throws(() => assertPendingTerms({ pendingLegalDocuments }, receipt));
});
