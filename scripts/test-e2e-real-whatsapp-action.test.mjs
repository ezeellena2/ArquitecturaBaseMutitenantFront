import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { responsesForAction } from "./test-e2e-real-whatsapp-action.mjs";

test("prepara todas las esperas antes de actuar y entrega sus respuestas juntas", async () => {
  const order = []; const responses = [{ id: "verified" }, { id: "submitted" }];
  const page = { waitForResponse(predicate) { order.push(`wait-${predicate}`); return Promise.resolve(responses[predicate]); } };
  assert.deepEqual(await responsesForAction(page, [0, 1], () => { order.push("action"); }), responses);
  assert.deepEqual(order, ["wait-0", "wait-1", "action"]);
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
