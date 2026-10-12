import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const kinds = new Set(["prepare", "quotas", "clock", "providerScenario", "providerCounters"]);
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** Control local del setup aislado; nunca agrega rutas técnicas al producto. */
export function createAssistantControl(command) {
  return async (kind, args = {}) => {
    assert.ok(kinds.has(kind) && record(args), "Orden Asistente no admitida.");
    const id = randomUUID();
    const message = { id, kind, args };
    assert.ok(Buffer.byteLength(JSON.stringify(message), "utf8") <= 2048, "Orden Asistente demasiado grande.");
    const reply = await command("assistant", message);
    assert.ok(record(reply) && reply.id === id && reply.ok === true && record(reply.data)
      && Object.keys(reply).length === 3, "El preparador no completó la orden Asistente.");
    if (kind === "providerCounters") assert.ok(Object.keys(reply.data).length === 3
      && ["calls", "titleCalls", "toolCycles"].every((key) => Number.isSafeInteger(reply.data[key]) && reply.data[key] >= 0),
    "Contadores Asistente inválidos.");
    return reply.data;
  };
}

export function parseAssistantArguments(args) {
  assert.ok(args.every((argument) => ["--no-build", "--width=1440", "--width=390", "--only=E8B-10-1", "--after=E8B-10-1"].includes(argument)), "Argumentos Asistente no admitidos.");
  const widths = args.filter((argument) => argument.startsWith("--width="));
  assert.ok(widths.length <= 1, "Seleccioná un solo ancho.");
  assert.ok(!(args.includes("--only=E8B-10-1") && args.includes("--after=E8B-10-1")), "Seleccioná el hito pendiente o su continuación.");
  return { build: !args.includes("--no-build"), widths: widths.length ? [Number(widths[0].slice(8))] : [1440, 390],
    ...(args.includes("--only=E8B-10-1") ? { onlyNotice: true } : {}), ...(args.includes("--after=E8B-10-1") ? { afterNotice: true } : {}) };
}
