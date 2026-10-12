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
      const data = kind === "providerCounters" ? { calls: 0, titleCalls: 0, toolCycles: 0 } : { private: "fixture-only" };
      const reply = { id: kind, ok: true, data };
      const pending = own.ipc.request({ id: kind, kind, args: {} }); own.input.write(`${JSON.stringify(reply)}\n`);
      assert.deepEqual(await pending, reply);
    }
    assert.equal(own.sent(), ["prepare", "quotas", "clock", "providerScenario", "providerCounters"].map((kind) => `FIXTURE ${JSON.stringify({ id: kind, kind, args: {} })}\n`).join(""));
    assert.ok(!own.sent().includes("CHECK"));
  } finally { own.ipc.close(); }
});

test("rechaza comandos ajenos, ciclos y líneas mayores a 2048 bytes sin publicarlos", async () => {
  const own = channel(); const cycle = { id: "cycle", kind: "prepare", args: {} }; cycle.args.private = cycle;
  try {
    await assert.rejects(own.ipc.request({ kind: "webhook" }), /Operación privada/);
    await assert.rejects(own.ipc.request({ kind: "prepare", toJSON: () => ({ kind: "webhook" }) }), /Operación privada/);
    await assert.rejects(own.ipc.request(cycle), { message: "Petición privada de Asistente inválida." });
    for (const privateText of ["x".repeat(2048), "á".repeat(1024)])
      await assert.rejects(own.ipc.request({ id: "oversized", kind: "prepare", args: { privateText } }), /demasiado grande/);
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
    const pending = own.ipc.request({ id: "first", kind: "prepare", args: {} });
    await assert.rejects(own.ipc.request({ id: "second", kind: "providerCounters", args: {} }), /operación pendiente/);
    own.input.write('{"error":"private-key"}\n');
    await assert.rejects(pending, { message: "El fixture no completó la operación." });
    await assert.rejects(own.ipc.request({ id: "third", kind: "clock", args: {} }), /canal privado/);
  } finally { own.ipc.close(); }
});

test("la entrada rechaza opciones inválidas antes de iniciar la app y no imprime un pase", async () => {
  await assert.rejects(promisify(execFile)(process.execPath, [fileURLToPath(new URL("./test-e2e-real-assistant.mjs", import.meta.url)), "--unapproved"]),
    (error) => error.code === 1 && error.stdout === "" && error.stderr === "Argumentos Asistente no admitidos.\n");
});

for (const [label, reply, message] of [
  ["correlación", { id: "other", ok: true, data: {} }, "La respuesta privada de Asistente no corresponde a la operación."],
  ["envoltorio", { id: "own", ok: "true", data: {} }, "Respuesta privada de Asistente inválida."],
  ["errorCode", { id: "own", ok: false, errorCode: "Private.Secret" }, "El fixture no completó la operación."],
]) test(`el envelope valida ${label} y cierra el canal sin publicar datos`, async () => {
  const own = channel();
  try {
    const pending = own.ipc.request({ id: "own", kind: "prepare", args: {} });
    own.input.write(`${JSON.stringify(reply)}\n`);
    await assert.rejects(pending, { message });
    await assert.rejects(own.ipc.request({ id: "next", kind: "clock", args: {} }), /canal privado/);
  } finally { own.ipc.close(); }
});

test("providerCounters sólo acepta los tres contadores numéricos publicados", async () => {
  for (const data of [{ calls: "1", titleCalls: 0, toolCycles: 0 }, { calls: 1, titleCalls: 0 },
    { calls: 1, titleCalls: 0, toolCycles: 0, private: "secret" }, { calls: -1, titleCalls: 0, toolCycles: 0 }]) {
    const own = channel();
    try {
      const pending = own.ipc.request({ id: "counters", kind: "providerCounters", args: {} });
      own.input.write(`${JSON.stringify({ id: "counters", ok: true, data })}\n`);
      await assert.rejects(pending, { message: "Respuesta privada de Asistente inválida." });
    } finally { own.ipc.close(); }
  }
});

test("el envelope rechaza campos ajenos e IDs repetidos antes de escribir al canal", async () => {
  const own = channel();
  try {
    for (const message of [{ id: null, kind: "prepare", args: {} }, { id: "own", kind: "prepare" },
      { id: "own", command: "prepare", args: {} }, { id: "own", kind: "prepare", args: {}, private: "secret" }])
      await assert.rejects(own.ipc.request(message), /Operación privada/);
    assert.equal(own.sent(), "");
    const pending = own.ipc.request({ id: "own", kind: "prepare", args: {} });
    own.input.write('{"id":"own","ok":true,"data":{}}\n'); await pending;
    const before = own.sent();
    await assert.rejects(own.ipc.request({ id: "own", kind: "clock", args: {} }), /Identificador privado/);
    assert.equal(own.sent(), before);
  } finally { own.ipc.close(); }
});
