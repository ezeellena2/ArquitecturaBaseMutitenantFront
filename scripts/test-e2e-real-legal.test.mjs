import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptPublishedLegalAndReturn, assertPendingTerms, assertPublishedLegalVersion, assertPublishedTerms, legalMeMetadata, observeLegalTransition, parseLegalPublicationReceipt } from "./test-e2e-real-legal.mjs";

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

test("el recibo real Privacy v3 no se sustituye con la versión 2 de Terms", () => {
  const expectedContents = [{ culture: "es-AR", text: "Privacidad de prueba" }, { culture: "en-US", text: "Test privacy" }];
  const document = { ...receipt, kind: "Privacy", effectiveAtUtc: "2026-10-11T03:00:00Z", isCurrent: true, contents: expectedContents };
  const group = { kind: "Privacy", currentVersion: receipt.version, currentEffectiveAtUtc: document.effectiveAtUtc,
    versions: [{ ...receipt, effectiveAtUtc: document.effectiveAtUtc, isCurrent: true }] };
  const terms = { kind: "Terms", currentVersion: 2, versions: [{ id: "other", version: 2, isCurrent: true }] };
  assertPublishedLegalVersion([terms, group], document, receipt, expectedContents);
  for (const changed of [{ ...document, id: "other" }, { ...document, kind: "Terms" }, { ...document, version: 2 },
    { ...document, isCurrent: false }, { ...document, contents: [] }])
    assert.throws(() => assertPublishedLegalVersion([terms, group], changed, receipt, expectedContents));
  for (const changed of [{ ...group, currentVersion: 2 }, { ...group, currentEffectiveAtUtc: "2026-10-10T03:00:00Z" },
    { ...group, versions: [{ ...group.versions[0], id: "other" }] }])
    assert.throws(() => assertPublishedLegalVersion([terms, changed], document, receipt, expectedContents));
  assert.throws(() => assertPublishedLegalVersion([terms], document, receipt, expectedContents));
});

const protectedPath = "/api/platform/legal-documents";
function reply(method, pathname, status, documents = [receipt]) {
  const request = { url: () => `https://localtest.me:5174${pathname}`, method: () => method, postDataJSON: () => ({ documents }) };
  return { url: () => `https://localtest.me:5174${pathname}`, status: () => status,
    request: () => request };
}
function pageForAcceptance(responses) {
  const waiting = []; const steps = []; const listeners = new Set(); let ignored = 0;
  return {
    steps, ignored: () => ignored,
    on(event, listener) { assert.equal(event, "request"); listeners.add(listener); },
    off(event, listener) { assert.equal(event, "request"); listeners.delete(listener); },
    listeners: () => listeners.size,
    waitForResponse(predicate) { return new Promise((resolve) => { waiting.push({ predicate, resolve, complete: false }); }); },
    getByRole(role) {
      return { waitFor: async (options) => { steps.push(options?.state === "hidden" ? "hidden" : "visible"); },
        check: async () => { assert.equal(role, "checkbox"); steps.push("checked"); },
        click: async () => {
          assert.equal(role, "button"); assert.equal(waiting.length, 2, "Las dos esperas deben existir antes del clic."); steps.push("clicked");
          for (const response of responses.filter((value) => value.earlyRequest)) for (const listener of listeners) listener(response.request());
          for (const response of responses) {
            if (!response.earlyRequest) for (const listener of listeners) listener(response.request());
            let matched = false;
            for (const waiter of waiting) if (!waiter.complete && waiter.predicate(response)) {
              waiter.complete = true; waiter.resolve(response); matched = true;
            }
            if (!matched) ignored++;
          }
        } };
    },
  };
}

test("aceptación correlacionada exige POST 204 del documento y GET protegido 200 antes de F5", async () => {
  const returned = reply("GET", protectedPath, 200);
  const oldRequest = { ...reply("GET", protectedPath, 200), earlyRequest: true };
  const page = pageForAcceptance([reply("GET", protectedPath, 200), reply("GET", "/api/legal/accept", 200),
    reply("POST", "/api/legal/accept", 204), oldRequest, returned]);
  assert.equal(await acceptPublishedLegalAndReturn(page, receipt, protectedPath), returned);
  assert.equal(page.ignored(), 3, "Un GET iniciado antes de aceptar no prueba el retorno, aunque responda después del POST.");
  assert.equal(page.listeners(), 0);
  assert.deepEqual(page.steps, ["visible", "checked", "clicked", "hidden"]);
});

for (const [label, acceptance, returned] of [
  ["aceptación HTTP 400", reply("POST", "/api/legal/accept", 400), reply("GET", protectedPath, 200)],
  ["versión vieja", reply("POST", "/api/legal/accept", 204, [{ ...receipt, version: 2 }]), reply("GET", protectedPath, 200)],
  ["documento ajeno", reply("POST", "/api/legal/accept", 204, [{ ...receipt, id: "other" }]), reply("GET", protectedPath, 200)],
  ["retorno HTTP 403", reply("POST", "/api/legal/accept", 204), reply("GET", protectedPath, 403)],
]) test(`la preparación rechaza ${label} sin tomar el título oculto como éxito`, async () => {
  const page = pageForAcceptance([acceptance, returned]);
  await assert.rejects(acceptPublishedLegalAndReturn(page, receipt, protectedPath));
  assert.ok(!page.steps.includes("hidden"));
  assert.equal(page.listeners(), 0);
});

test("metadata de Me conserva tipos/versiones y elimina identidad e IDs privados", () => {
  const metadata = legalMeMetadata(200, { email: "private@example.test", phone: "+5491100000000", token: "private-token",
    pendingLegalDocuments: [{ id: "private-id", kind: "Privacy", version: 2 }] });
  assert.deepEqual(metadata, { status: 200, pendingValid: true, pendingKinds: [{ kind: "Privacy", version: 2 }] });
  assert.ok(!JSON.stringify(metadata).includes("private"));
  assert.deepEqual(legalMeMetadata(403, undefined), { status: 403, pendingValid: false, pendingKinds: [] });
  assert.deepEqual(legalMeMetadata(200, { pendingLegalDocuments: [] }), { status: 200, pendingValid: true, pendingKinds: [] });
});

test("metadata inválida no publica tipos o versiones arbitrarios", () => {
  assert.deepEqual(legalMeMetadata(200, { pendingLegalDocuments: [{ kind: "private-secret", version: "private" }, { kind: "Privacy", version: -1 }] }),
    { status: 200, pendingValid: false, pendingKinds: [] });
});

function observedPage(url = "https://localtest.me:5174/aceptar-terminos?private-token#private") {
  const listeners = new Map();
  return { url: () => url,
    on(event, callback) { listeners.set(event, callback); }, off(event, callback) { assert.equal(listeners.get(event), callback); listeners.delete(event); },
    getByRole: (_role, { name }) => ({ isVisible: async () => name === "Actualizamos los términos" }),
    emit(event, value) { listeners.get(event)?.(value); }, listeners: () => listeners.size,
  };
}

test("observa sólo después del POST 201 y distingue Me iniciado antes de publicar", async () => {
  const page = observedPage(); const observer = observeLegalTransition(page);
  const me = { ...reply("GET", "/api/me", 200), json: async () => ({ pendingLegalDocuments: [{ kind: "Privacy", version: 2, id: "private-id" }] }) };
  page.emit("request", me.request()); page.emit("response", me);
  page.emit("response", reply("POST", protectedPath, 201));
  page.emit("response", reply("GET", protectedPath, 403)); page.emit("response", me);
  const fresh = { ...reply("GET", "/api/me", 200), json: me.json };
  page.emit("request", fresh.request()); page.emit("response", fresh);
  observer.close();
  const metadata = await observer.snapshot();
  assert.equal(page.listeners(), 0); assert.equal(metadata.route, "/aceptar-terminos");
  assert.deepEqual(metadata.headings, ["Actualizamos los términos"]);
  assert.deepEqual(metadata.events.map((event) => event.startedAfterPublication), [undefined, false, true]);
  assert.equal(metadata.events[2].bodyAvailable, true);
  assert.equal(metadata.events[0].legalStatus, 403);
  assert.ok(!JSON.stringify(metadata).includes("private"));
});

test("un cuerpo ilegible y una ruta privada quedan saneados sin ocultar el estado HTTP", async () => {
  const page = observedPage("https://localtest.me:5174/private-id?token=private"); const observer = observeLegalTransition(page);
  page.emit("response", reply("POST", protectedPath, 201));
  const me = { ...reply("GET", "/api/me", 200), json: async () => { throw new Error("private-body"); } };
  page.emit("request", me.request()); page.emit("response", me); observer.close();
  const metadata = await observer.snapshot();
  assert.equal(metadata.route, "otra ruta");
  assert.equal(metadata.events[0].bodyAvailable, false);
  assert.deepEqual(metadata.events[0].me, { status: 200, pendingValid: false, pendingKinds: [] });
  assert.ok(!JSON.stringify(metadata).includes("private"));
});
