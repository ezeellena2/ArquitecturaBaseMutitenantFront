import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { test } from "node:test";
import { reloadResponse, responsesForAction, safeActionErrorKind } from "./test-e2e-real-whatsapp-action.mjs";

test("prepara todas las esperas antes de actuar y entrega sus respuestas juntas", async () => {
  const order = []; const responses = [{ id: "verified" }, { id: "submitted" }];
  const page = { waitForResponse(predicate) { order.push(`wait-${predicate}`); return Promise.resolve(responses[predicate]); } };
  assert.deepEqual(await responsesForAction(page, [0, 1], () => { order.push("action"); }), responses);
  assert.deepEqual(order, ["wait-0", "wait-1", "action"]);
});

test("F5 ignora consultas anteriores aunque su respuesta llegue después del commit principal", async () => {
  const page = new EventEmitter(); const main = {}; const child = {}; const old = {}; const beforeCommit = {}; const inChild = {}; const fresh = {};
  let filter; const seen = []; let complete;
  page.mainFrame = () => main;
  page.waitForResponse = (predicate) => { filter = predicate; return new Promise((resolve) => { complete = resolve; }); };
  const reply = (request) => { const response = { request: () => request }; if (filter(response)) complete(response); };
  page.reload = async () => {
    page.emit("request", beforeCommit);
    page.emit("framenavigated", child); page.emit("request", inChild);
    page.emit("framenavigated", main);
    reply(old); reply(beforeCommit); reply(inChild);
    page.emit("request", fresh); reply(fresh);
  };
  const response = await reloadResponse(page, (value) => { seen.push(value.request()); return true; });
  assert.equal(response.request(), fresh); assert.deepEqual(seen, [fresh]);
  assert.equal(page.listenerCount("request"), 0); assert.equal(page.listenerCount("framenavigated"), 0);
});

for (const source of ["reload", "response"]) test(`F5 retira listeners cuando falla ${source}`, async () => {
  const page = new EventEmitter(); const failure = new Error("Fallo local");
  page.mainFrame = () => ({});
  page.waitForResponse = () => source === "response" ? Promise.reject(failure) : new Promise((resolve) => { setImmediate(resolve); });
  page.reload = () => source === "reload" ? Promise.reject(failure) : Promise.resolve();
  await assert.rejects(reloadResponse(page, () => true), (error) => error === failure);
  assert.equal(page.listenerCount("request"), 0); assert.equal(page.listenerCount("framenavigated"), 0);
});

test("diagnóstico de acción sólo devuelve categorías fijas y nunca el mensaje privado", () => {
  for (const message of ["response.body: Response body is unavailable", "Protocol error: No resource with given identifier found", "Protocol error: No data found for resource with given identifier"])
    assert.equal(safeActionErrorKind(new Error(message)), "bodyUnavailable");
  assert.equal(safeActionErrorKind(new Error('Navigation to "https://example.test/private" is interrupted by another navigation')), "navInterrupted");
  assert.equal(safeActionErrorKind(new Error("Navigation interrupted the evaluation")), "navInterrupted");
  assert.equal(safeActionErrorKind(new Error("private proof value")), "unknown");
  assert.equal(safeActionErrorKind({ message: 123 }), "unknown");
});

for (const source of ["action", "response"]) test(`rechazo de ${source} conserva un handler para la otra espera pendiente`, () => {
  // Child estricto demuestra que el rechazo tardío no mata al runner después de haber capturado el primero.
  const moduleUrl = new URL("./test-e2e-real-whatsapp-action.mjs", import.meta.url).href;
  const script = `import { responsesForAction } from ${JSON.stringify(moduleUrl)};
    const later = () => new Promise((_, reject) => setImmediate(() => reject(new Error('late'))));
    const page = { waitForResponse: () => ${source === "response" ? "Promise.reject(new Error('first'))" : "later()"} };
    const unavailableControl = { click: () => ${source === "action" ? "Promise.reject(new Error('first'))" : "later()"} };
    try { await responsesForAction(page, [() => true], () => unavailableControl.click()); process.exitCode = 2; }
    catch (error) { if (error.message !== 'first') process.exitCode = 3; }
    await new Promise(setImmediate);`;
  execFileSync(process.execPath, ["--unhandled-rejections=strict", "--input-type=module", "--eval", script], { stdio: "pipe" });
});
