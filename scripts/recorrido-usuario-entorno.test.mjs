import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import * as environment from "./recorrido-usuario-entorno.mjs";

const temporaryRoot = path.resolve(import.meta.dirname, "../.local");
async function workspace(t) {
  const directory = await mkdtemp(path.join(temporaryRoot, "arquitecturabase-recorrido-ipc-"));
  t.after(async () => {
    assert.equal(path.dirname(directory), temporaryRoot);
    await rm(directory, { recursive: true, force: true });
  });
  return { directory, readyFile: path.join(directory, "mt-e2e-ipc.ready") };
}

test("el comando publica JSON atómico y consume el done lower camelcase sin dejar pruebas", async (t) => {
  const { directory, readyFile } = await workspace(t);
  const command = environment.createPrivateCommand(readyFile, { wait: async (done) => {
    assert.equal(done, readyFile.replace(/\.ready$/, ".whatsapp.json.done"));
    assert.deepEqual((await readdir(directory)).sort(), ["mt-e2e-ipc.whatsapp.json"]);
    assert.deepEqual(JSON.parse(await readFile(done.slice(0, -5), "utf8")), { kind: "code", scenario: "walkthrough-test", phone: "+5491134567880" });
    await writeFile(done, '{"proof":"123456"}');
    return readFile(done, "utf8");
  } });
  const reply = await command("whatsapp", { kind: "code", scenario: "walkthrough-test", phone: "+5491134567880" });
  assert.equal(reply.proof, "123456");
  assert.deepEqual(await readdir(directory), []);
});

test("un segundo comando no borra la solicitud pendiente ni reinicia su cursor", async (t) => {
  const { directory, readyFile } = await workspace(t);
  const waiting = Promise.withResolvers(); const reply = Promise.withResolvers();
  const command = environment.createPrivateCommand(readyFile, { wait: async () => { waiting.resolve(); return reply.promise; } });
  const first = command("whatsapp", { kind: "begin", scenario: "walkthrough-test", phone: "+5491134567880" });
  await waiting.promise;
  await assert.rejects(command("whatsapp", { kind: "code" }), /orden pendiente/);
  assert.equal(JSON.parse(await readFile(readyFile.replace(/\.ready$/, ".whatsapp.json"), "utf8")).kind, "begin");
  reply.resolve('{"ok":true}'); await first;
  assert.deepEqual(await readdir(directory), []);
});

test("IPC rechaza más de 2048 bytes y rutas derivadas inválidas antes de escribir", async (t) => {
  const { directory, readyFile } = await workspace(t);
  const command = environment.createPrivateCommand(readyFile);
  await assert.rejects(command("whatsapp", { value: "á".repeat(1100) }), /2048/);
  await assert.rejects(command("../fuera", {}), /sufijo/);
  assert.throws(() => environment.createPrivateCommand("mt-e2e-relative.ready"), /absoluta/);
  assert.deepEqual(await readdir(directory), []);
});

test("el fallo o JSON inválido limpia archivos privados y omite el cuerpo del error", async (t) => {
  const { directory, readyFile } = await workspace(t);
  const command = environment.createPrivateCommand(readyFile, { wait: async () => { throw new Error("OTP 123456; ticket privado"); } });
  await assert.rejects(command("whatsapp", {}), (error) => !error.message.includes("123456") && !error.message.includes("ticket"));
  assert.deepEqual(await readdir(directory), []);
  const invalid = environment.createPrivateCommand(readyFile, { wait: async () => "OTP 123456" });
  await assert.rejects(invalid("whatsapp", {}), (error) => /JSON/.test(error.message) && !error.message.includes("123456"));
  assert.deepEqual(await readdir(directory), []);
});

test("WhatsApp ata cada escenario y Phone al cursor inicial y conserva la versión recibida", async () => {
  const calls = [];
  const whatsapp = environment.createWhatsAppControl(async (suffix, request) => {
    calls.push({ suffix, request });
    return request.kind === "begin" ? { ok: true } : { marked: true, queuedNotices: 1, beforeVersion: 42, afterVersion: 42 };
  });
  const request = await whatsapp.begin("walkthrough-notice-1440", "+5491134567886");
  const recoveryId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  assert.deepEqual(await request("recoveryNotice", { recoveryId }), { marked: true, queuedNotices: 1, beforeVersion: 42, afterVersion: 42 });
  assert.deepEqual(calls, [
    { suffix: "whatsapp", request: { kind: "begin", scenario: "walkthrough-notice-1440", phone: "+5491134567886" } },
    { suffix: "whatsapp", request: { kind: "recoveryNotice", recoveryId, scenario: "walkthrough-notice-1440", phone: "+5491134567886" } },
  ]);
  await assert.rejects(whatsapp.begin("walkthrough-notice-1440", "+5491134567886"), /ya iniciado/);
  await assert.rejects(request("code", { phone: "+5491134567880" }), /parámetros/);
  await assert.rejects(request("begin"), /orden/);
  assert.equal(calls.length, 2);
});

test("el binding no publica órdenes para destinos reales, escenarios inválidos ni begin rechazado", async () => {
  let sent = 0;
  const whatsapp = environment.createWhatsAppControl(async () => { sent++; return { ok: false, proof: "123456" }; });
  await assert.rejects(whatsapp.begin("walkthrough-invalid", "+541155554521"), /sintético/);
  await assert.rejects(whatsapp.begin("../invalid", "+5491134567880"), /escenario/);
  assert.equal(sent, 0);
  await assert.rejects(whatsapp.begin("walkthrough-rejected", "+5491134567880"), (error) => /iniciar/.test(error.message) && !error.message.includes("123456"));
  assert.equal(sent, 1);
});
