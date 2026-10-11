import { pathToFileURL } from "node:url";
import { assistantJourneySources } from "./recorrido-usuario-asistente.mjs";
import { fixtureProtocol } from "./test-e2e-real-whatsapp-ipc.mjs";

// Preparación ConsoleFake T14. No configura servicios ni sustituye HTTP, Meta o E11.
const kinds = new Set(["prepare", "quotas", "clock", "providerScenario", "providerCounters"]);
const phases = new Set(["INICIO", "OK", "FINAL", "FALLO"]);
const milestones = new Set(assistantJourneySources.flatMap((source) =>
  Array.from({ length: source.steps }, (_, index) => `E8B-${source.order}-${index + 1}`)));
const maxLineBytes = 2048;

/** Sólo IDs públicos de los pasos; ningún cuerpo privado es una evidencia CHECK. */
export function assistantChecks(stdout = "") {
  return stdout.split(/\r?\n/).filter((line) => {
    if (Buffer.byteLength(line, "utf8") > maxLineBytes) return false;
    const match = /^CHECK (INICIO|OK|FINAL|FALLO) (E8B-\d+-\d+) (1440|390)$/u.exec(line);
    return match !== null && milestones.has(match[2]);
  });
}

export function assistantCheck(phase, milestone, width) {
  if (!phases.has(phase) || !milestones.has(milestone) || ![1440, 390].includes(width)) throw new Error("Hito E8b inválido.");
  return `CHECK ${phase} ${milestone} ${width}\n`;
}

/** Reutiliza el canal privado de E8; los payloads concretos los publica el fixture Back. */
export function assistantFixtureProtocol(input, output, { environment = process.env, timeoutMs = 60_000 } = {}) {
  if (environment.MT_E2E_ISOLATED !== "1") throw new Error("El fixture Asistente requiere un entorno E2E aislado.");
  const ipc = fixtureProtocol(input, output, { timeoutMs });
  return {
    async request(message) {
      if (!message || typeof message !== "object" || Array.isArray(message)) throw new Error("Operación privada de Asistente inválida.");
      let serialized; let body;
      try { serialized = JSON.stringify(message); body = JSON.parse(serialized); }
      catch { throw new Error("Petición privada de Asistente inválida."); }
      if (!body || Array.isArray(body) || !kinds.has(body.kind)) throw new Error("Operación privada de Asistente inválida.");
      if (Buffer.byteLength(`FIXTURE ${serialized}\n`, "utf8") > maxLineBytes) throw new Error("Petición privada de Asistente demasiado grande.");
      return ipc.request(body);
    },
    close() { ipc.close(); },
  };
}

// El host aún no puede lanzar este archivo como un recorrido aprobado vacío.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.stderr.write("T14 pendiente: el runner real todavía no está conectado al fixture Asistente.\n");
  process.exitCode = 1;
}
