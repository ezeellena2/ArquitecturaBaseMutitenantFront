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
  assert.ok(args.every((argument) => ["--no-build", "--width=1440", "--width=390", "--only=E8B-10-1", "--after=E8B-10-1", "--from=E8B-30-2", "--from=E8B-40-1", "--from=transport-resume", "--from=transport-keychanged", "--from=history-rename", "--from=attachments-five", "--from=E8B-50-2", "--from=E8B-50-3", "--from=access-cross"].includes(argument)), "Argumentos Asistente no admitidos.");
  const widths = args.filter((argument) => argument.startsWith("--width="));
  assert.ok(widths.length <= 1, "Seleccioná un solo ancho.");
  assert.ok(args.filter((argument) => /^(--only|--after|--from)=/.test(argument)).length <= 1, "Seleccioná el hito pendiente o su continuación.");
  return { build: !args.includes("--no-build"), widths: widths.length ? [Number(widths[0].slice(8))] : [1440, 390],
    ...(args.includes("--only=E8B-10-1") ? { onlyNotice: true } : {}), ...(args.includes("--after=E8B-10-1") ? { afterNotice: true } : {}),
    ...(args.includes("--from=E8B-30-2") ? { fromTools: true } : {}), ...(args.includes("--from=E8B-40-1") ? { fromHistory: true } : {}),
    ...(args.includes("--from=transport-resume") ? { fromTransport: true } : {}), ...(args.includes("--from=history-rename") ? { fromRename: true } : {}),
    ...(args.includes("--from=transport-keychanged") ? { fromTransport: true, keyChangedOnly: true } : {}),
    ...(args.includes("--from=attachments-five") ? { fromAttachments: true } : {}),
    ...(args.includes("--from=E8B-50-2") ? { fromKey: true } : {}), ...(args.includes("--from=E8B-50-3") ? { fromKey: true, keySaveOnly: true } : {}),
    ...(args.includes("--from=access-cross") ? { crossOnly: true } : {}) };
}
