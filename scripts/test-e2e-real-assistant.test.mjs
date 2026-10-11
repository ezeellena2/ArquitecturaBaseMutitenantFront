import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { PassThrough } from "node:stream";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { assistantCheck, assistantChecks, assistantFixtureProtocol } from "./test-e2e-real-assistant.mjs";

function channel() {
  const input = new PassThrough(); const output = new PassThrough(); let sent = "";
  output.on("data", (chunk) => { sent += chunk; });
  const ipc = assistantFixtureProtocol(input, output, { environment: { MT_E2E_ISOLATED: "1" } });
  return { input, output, ipc, sent: () => sent };
}

test("exige aislamiento antes de abrir el canal privado", () => {
  const input = new PassThrough(); const output = new PassThrough();
  for (const value of [undefined, "0", "true"]) {
    assert.throws(() => assistantFixtureProtocol(input, output, { environment: { MT_E2E_ISOLATED: value } }), /entorno E2E aislado/);
    assert.equal(input.listenerCount("data"), 0);
  }
});

test("transporta los cinco comandos acordados sólo por FIXTURE y conserva respuestas privadas", async () => {
  const own = channel();
  try {
    for (const kind of ["prepare", "quotas", "clock", "providerScenario", "providerCounters"]) {
      const pending = own.ipc.request({ kind }); own.input.write('{"ok":true}\n');
      assert.deepEqual(await pending, { ok: true });
    }
    assert.equal(own.sent(), ["prepare", "quotas", "clock", "providerScenario", "providerCounters"].map((kind) => `FIXTURE ${JSON.stringify({ kind })}\n`).join(""));
    assert.ok(!own.sent().includes("CHECK"));
  } finally { own.ipc.close(); }
});

test("rechaza comandos ajenos, ciclos y líneas mayores a 2048 bytes sin publicarlos", async () => {
  const own = channel(); const cycle = { kind: "prepare" }; cycle.private = cycle;
  try {
    await assert.rejects(own.ipc.request({ kind: "webhook" }), /Operación privada/);
    await assert.rejects(own.ipc.request({ kind: "prepare", toJSON: () => ({ kind: "webhook" }) }), /Operación privada/);
    await assert.rejects(own.ipc.request(cycle), { message: "Petición privada de Asistente inválida." });
    for (const privateText of ["x".repeat(2048), "á".repeat(1024)])
      await assert.rejects(own.ipc.request({ kind: "prepare", privateText }), /demasiado grande/);
    assert.equal(own.sent(), "");
  } finally { own.ipc.close(); }
});

test("CHECK sólo admite IDs públicos, fase y ancho; descarta cuerpos, claves y pasos inexistentes", () => {
  const valid = assistantCheck("OK", "E8B-10-1", 1440);
  const noise = ['FIXTURE {"proof":"private"}', "CHECK OK texto privado 390", "CHECK OK E8B-10-3 390", "CHECK OK E8B-10-1 768", "CHECK OK E8B-10-1 390 private-key", "CHECK OK E8B-10-1 390" + " ".repeat(2048)].join("\n");
  assert.deepEqual(assistantChecks(valid + noise), [valid.trim()]);
  for (const args of [["OK", "private-text", 1440], ["OK", "E8B-10-1", 768], ["private", "E8B-10-1", 390]])
    assert.throws(() => assistantCheck(...args), { message: "Hito E8b inválido." });
});

test("conserva una operación pendiente y sanea el error privado del host", async () => {
  const own = channel();
  try {
    const pending = own.ipc.request({ kind: "prepare" });
    await assert.rejects(own.ipc.request({ kind: "providerCounters" }), /operación pendiente/);
    own.input.write('{"error":"private-key"}\n');
    await assert.rejects(pending, { message: "El fixture no completó la operación." });
    await assert.rejects(own.ipc.request({ kind: "clock" }), /canal privado/);
  } finally { own.ipc.close(); }
});

test("la entrada todavía pendiente falla sin imprimir un pase E2E ni iniciar la app", async () => {
  await assert.rejects(promisify(execFile)(process.execPath, [fileURLToPath(new URL("./test-e2e-real-assistant.mjs", import.meta.url))]),
    (error) => error.code === 1 && error.stdout === "" && error.stderr === "T14 pendiente: el runner real todavía no está conectado al fixture Asistente.\n");
});
