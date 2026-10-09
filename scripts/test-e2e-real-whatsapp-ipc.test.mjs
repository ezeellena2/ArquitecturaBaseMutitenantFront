import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import { fixtureChecks, fixtureProtocol } from "./test-e2e-real-whatsapp-ipc.mjs";

test("el reporte permite sólo hitos y descarta ruido privado, URLs, teléfonos y OTP", () => {
  const output = 'build output\nFIXTURE {"proof":"secret"}\nCHECK OK OTP 123456\nCHECK OK teléfono +5491134567880\nCHECK OK https://localtest.me/#t=secret\nCHECK OK user@example.test\nCHECK OK registro y OIDC consumer/F5 1440\nCHECK FALLO registro Phone 390; tipo Error; HTTP 403 Identity.Account.PendingDeletion\n';
  assert.deepEqual(fixtureChecks(output), ["CHECK OK registro y OIDC consumer/F5 1440", "CHECK FALLO registro Phone 390; tipo Error; HTTP 403 Identity.Account.PendingDeletion"]);
});

test("el canal privado conserva escenario y respuesta sin publicar la prueba", async () => {
  const input = new PassThrough(); const output = new PassThrough();
  const ipc = fixtureProtocol(input, output); let sent = "";
  output.on("data", (chunk) => { sent += chunk; });
  const pending = ipc.request({ kind: "code", scenario: "signup-1440", phone: "fixture-contact" });
  input.write('{"proof":"private-code"}\n');
  assert.deepEqual(await pending, { proof: "private-code" });
  assert.equal(sent, 'FIXTURE {"kind":"code","scenario":"signup-1440","phone":"fixture-contact"}\n');
  ipc.close();
});

for (const [label, act, message] of [
  ["EOF", (input) => input.end(), "El fixture cerró el canal privado."],
  ["JSON inválido", (input) => input.write("private-secret-invalid-json\n"), "El fixture devolvió una respuesta inválida."],
  ["error privado", (input) => input.write('{"error":"private-secret"}\n'), "El fixture no completó la operación."],
  ["timeout", () => {}, "El fixture no respondió a tiempo."],
]) test(`el canal sanea ${label} y no muestra secretos`, async () => {
  const input = new PassThrough(); const output = new PassThrough();
  const ipc = fixtureProtocol(input, output, { timeoutMs: 15 });
  const pending = ipc.request({ kind: "begin", scenario: "isolated", phone: "fixture-contact" });
  act(input);
  await assert.rejects(pending, (error) => error.message === message && !error.message.includes("private-secret"));
  ipc.close();
});

test("no permite dos solicitudes superpuestas y no acepta respuestas después del timeout", async () => {
  const input = new PassThrough(); const output = new PassThrough();
  const ipc = fixtureProtocol(input, output, { timeoutMs: 10 });
  const pending = ipc.request({ kind: "begin", scenario: "first" });
  await assert.rejects(ipc.request({ kind: "begin", scenario: "second" }), /operación pendiente/);
  await assert.rejects(pending, /a tiempo/);
  input.write('{"proof":"late-secret"}\n');
  await assert.rejects(ipc.request({ kind: "code", scenario: "second" }), /canal privado/);
  ipc.close();
});
