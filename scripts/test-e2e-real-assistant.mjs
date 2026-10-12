import { pathToFileURL } from "node:url";
import { assistantJourneySources } from "./recorrido-usuario-asistente.mjs";
import { fixtureProtocol } from "./test-e2e-real-whatsapp-ipc.mjs";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { baseUrl, createEnvironment } from "./recorrido-usuario-entorno.mjs";
import { assistantLogin, runAssistantJourney } from "./assistant-real-ui.mjs";
import { parseAssistantArguments } from "./assistant-real-control.mjs";

// Preparación ConsoleFake T14. No configura servicios ni sustituye HTTP, Meta o E11.
const kinds = new Set(["prepare", "quotas", "clock", "providerScenario", "providerCounters"]);
const phases = new Set(["INICIO", "OK", "FINAL", "FALLO"]);
const milestones = new Set(assistantJourneySources.flatMap((source) =>
  Array.from({ length: source.steps }, (_, index) => `E8B-${source.order}-${index + 1}`)));
const maxLineBytes = 2048;
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value, keys) => record(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

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
  const usedIds = new Set();
  function rejectReply(message) { ipc.close(); throw new Error(message); }
  return {
    async request(message) {
      if (!message || typeof message !== "object" || Array.isArray(message)) throw new Error("Operación privada de Asistente inválida.");
      let serialized; let body;
      try { serialized = JSON.stringify(message); body = JSON.parse(serialized); }
      catch { throw new Error("Petición privada de Asistente inválida."); }
      if (!exactKeys(body, ["id", "kind", "args"]) || typeof body.id !== "string" || !body.id.trim()
        || !kinds.has(body.kind) || !record(body.args)) throw new Error("Operación privada de Asistente inválida.");
      if (Buffer.byteLength(`FIXTURE ${serialized}\n`, "utf8") > maxLineBytes) throw new Error("Petición privada de Asistente demasiado grande.");
      if (usedIds.has(body.id)) throw new Error("Identificador privado de Asistente reutilizado.");
      usedIds.add(body.id);
      const reply = await ipc.request(body);
      if (reply.id !== body.id) rejectReply("La respuesta privada de Asistente no corresponde a la operación.");
      if (reply.ok === false && exactKeys(reply, ["id", "ok", "errorCode"]) && typeof reply.errorCode === "string" && reply.errorCode.trim())
        rejectReply("El fixture no completó la operación.");
      if (reply.ok !== true || !exactKeys(reply, ["id", "ok", "data"])) rejectReply("Respuesta privada de Asistente inválida.");
      if (body.kind === "providerCounters" && (!exactKeys(reply.data, ["calls", "titleCalls", "toolCycles"])
        || !Object.values(reply.data).every((value) => Number.isSafeInteger(value) && value >= 0))) rejectReply("Respuesta privada de Asistente inválida.");
      return reply;
    },
    close() { ipc.close(); },
  };
}

/** E2E real completo E8b. Fake reemplaza sólo el proveedor; front/auth/DB/archivos son reales. */
export async function runAssistantRealE2E({ build = false, widths = [1440, 390] } = {}) {
  assert.ok(widths.length > 0 && widths.every((width) => [1440, 390].includes(width)) && new Set(widths).size === widths.length, "Anchos Asistente inválidos.");
  const env = await createEnvironment({ build });
  let browser;
  try {
    await env.command("platform", { kind: "prepare" });
    browser = await chromium.launch({ headless: true });
    for (const width of widths) {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR", viewport: { width, height: width === 390 ? 844 : 900 } });
      try {
        const page = await context.newPage(); const platformPage = await context.newPage();
        page.setDefaultTimeout(30_000); platformPage.setDefaultTimeout(30_000);
        // Sólo espera disponibilidad; no simula una sesión ni altera las cookies.
        await page.goto(new URL("/alive", baseUrl).href);
        const operatorEmail = width === 1440 ? "e2e-a3-operator@example.test" : "e2e-a1-operator@example.test";
        await assistantLogin(platformPage, env, baseUrl, operatorEmail, "platform");
        const signOut = async (target) => {
          const mobileMore = target.getByRole("navigation", { name: "Secciones", exact: true }).getByRole("link", { name: "Más", exact: true });
          if (await mobileMore.isVisible()) await mobileMore.click();
          else if (!await target.getByRole("button", { name: "Salir", exact: true }).isVisible()) await target.getByRole("button", { name: /, .+$/ }).last().click();
          const exit = target.getByRole("button", { name: "Salir", exact: true }).or(target.getByRole("menuitem", { name: "Salir", exact: true }));
          await exit.first().click();
          await target.waitForURL((url) => !url.pathname.startsWith("/org") && !url.pathname.startsWith("/plataforma"));
        };
        await runAssistantJourney({ page, platformPage, width, env, base: baseUrl, businessEmail: env.businessEmail, operatorEmail, signOut,
          record: async (id, currentWidth, _getPage, action) => {
            process.stdout.write(assistantCheck("INICIO", id, currentWidth));
            try { await action(); process.stdout.write(assistantCheck("OK", id, currentWidth)); }
            catch { process.stdout.write(assistantCheck("FALLO", id, currentWidth)); throw new Error(`Falló ${id} a ${currentWidth}; no se publican datos privados.`); }
          },
        });
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await env.stop(); }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try { await runAssistantRealE2E(parseAssistantArguments(process.argv.slice(2))); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
