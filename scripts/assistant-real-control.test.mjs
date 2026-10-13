import assert from "node:assert/strict";
import { test } from "node:test";
import { createAssistantControl, parseAssistantArguments } from "./assistant-real-control.mjs";

test("ordena por IPC de archivos sin publicar contenido y correlaciona la respuesta", async () => {
  const control = createAssistantControl(async (suffix, message) => {
    assert.equal(suffix, "assistant"); assert.equal(message.kind, "prepare");
    assert.deepEqual(message.args, { email: "fixture@example.test", access: "business" });
    return { id: message.id, ok: true, data: { configured: true } };
  });
  assert.deepEqual(await control("prepare", { email: "fixture@example.test", access: "business" }), { configured: true });
  await assert.rejects(control("businessWrite"), /no admitida/);
  await assert.rejects(control("prepare", { content: "x".repeat(2048) }), /demasiado grande/);
});

test("los contadores fallan cerrados y no devuelven el error privado del fixture", async () => {
  for (const reply of [{ id: "wrong", ok: true, data: {} }, { ok: false, errorCode: "private" },
    { ok: true, data: { calls: -1, titleCalls: 0, toolCycles: 0 } },
    { ok: true, data: { calls: 0, titleCalls: 0, toolCycles: 0, private: "secret" } }]) {
    const control = createAssistantControl(async (_, message) => ({ id: message.id, ...reply }));
    await assert.rejects(control("providerCounters"), (error) => !error.message.includes("secret") && !error.message.includes("private"));
  }
});

test("filtros de ancho y no-build impiden corridas ajenas", () => {
  assert.deepEqual(parseAssistantArguments(["--no-build", "--width=390"]), { build: false, widths: [390] });
  assert.deepEqual(parseAssistantArguments([]), { build: true, widths: [1440, 390] });
  assert.throws(() => parseAssistantArguments(["--width=1440", "--width=390"]));
  assert.throws(() => parseAssistantArguments(["--private-key=secret"]), /no admitidos/);
});

test("el primer hito y su continuación preservan verdes sin aceptar opciones ajenas", () => {
  assert.deepEqual(parseAssistantArguments(["--no-build", "--width=1440", "--only=E8B-10-1"]), { build: false, widths: [1440], onlyNotice: true });
  assert.deepEqual(parseAssistantArguments(["--no-build", "--width=1440", "--after=E8B-10-1"]), { build: false, widths: [1440], afterNotice: true });
  assert.throws(() => parseAssistantArguments(["--only=E8B-10-1", "--after=E8B-10-1"]));
  assert.throws(() => parseAssistantArguments(["--only=E8B-20-1"]), /no admitidos/);
});

test("continúa desde la herramienta pendiente sin combinar cortes ni hitos arbitrarios", () => {
  assert.deepEqual(parseAssistantArguments(["--no-build", "--width=1440", "--from=E8B-30-2"]), { build: false, widths: [1440], fromTools: true });
  assert.throws(() => parseAssistantArguments(["--from=E8B-30-2", "--after=E8B-10-1"]));
  assert.throws(() => parseAssistantArguments(["--from=E8B-30-3"]), /no admitidos/);
});

test("continúa desde el historial pendiente sin volver a comprobar la respuesta aprobada", () => {
  assert.deepEqual(parseAssistantArguments(["--no-build", "--width=1440", "--from=E8B-40-1"]), { build: false, widths: [1440], fromHistory: true });
  assert.throws(() => parseAssistantArguments(["--from=E8B-40-1", "--from=E8B-30-2"]));
  assert.throws(() => parseAssistantArguments(["--from=E8B-40-2"]), /no admitidos/);
});

test("continúa desde reanudar transporte conservando hitos y prefijo técnico aprobados", () => {
  assert.deepEqual(parseAssistantArguments(["--no-build", "--width=1440", "--from=transport-resume"]), { build: false, widths: [1440], fromTransport: true });
  assert.throws(() => parseAssistantArguments(["--from=transport-resume", "--from=E8B-40-1"]));
  assert.throws(() => parseAssistantArguments(["--from=transport-private"]), /no admitidos/);
});

test("continúa desde attachments-five sin repetir transporte ni combinar cortes", () => {
  assert.deepEqual(parseAssistantArguments(["--no-build", "--width=1440", "--from=attachments-five"]), { build: false, widths: [1440], fromAttachments: true });
  assert.throws(() => parseAssistantArguments(["--from=attachments-five", "--from=transport-resume"]));
  assert.throws(() => parseAssistantArguments(["--from=attachments-owner"]), /no admitidos/);
});
