import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { pickupCode } from "./test-e2e-real-mail.mjs";

export const baseUrl = new URL("https://localtest.me:5174/");
const back = fileURLToPath(new URL("../../ArquitecturaBaseMutitenant/", import.meta.url));
const appHostDirectory = path.join(back, "src/ArquitecturaBaseMultitenant.AppHost");
const appHostProject = path.join(appHostDirectory, "ArquitecturaBaseMultitenant.AppHost.csproj");
const execute = promisify(execFile);

async function aspire(args, env = process.env) {
  try {
    return await execute(process.platform === "win32" ? "cmd.exe" : "aspire",
      process.platform === "win32" ? ["/d", "/s", "/c", "aspire", ...args] : args,
      { cwd: appHostDirectory, env, timeout: 300_000, maxBuffer: 10 * 1024 * 1024, windowsHide: true });
  } catch { throw new Error(`Falló Aspire ${args[0]}.`); }
}

async function waitFile(file, timeout = 240_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { return await readFile(file, "utf8"); }
    catch (error) { if (error.code !== "ENOENT" && error.code !== "EBUSY") throw error; }
    await delay(250);
  }
  throw new Error("El preparador aislado no completó la orden local.");
}

/** Usa exactamente el AppHost/base efímera/pickup del E2E real; jamás detiene un AppHost ajeno. */
export async function createEnvironment({ build = true } = {}) {
  const { stdout } = await aspire(["ps", "--format", "Json", "--non-interactive"]);
  assert.equal(JSON.parse(stdout).length, 0, "Hay un AppHost activo; no se puede ocupar su puerto ni detenerlo.");
  const directory = await mkdtemp(path.join(os.tmpdir(), "arquitecturabase-recorrido-"));
  const readyFile = path.join(directory, `mt-e2e-${randomUUID()}.ready`);
  const businessEmail = `e2e-recorrido-base-${randomUUID()}@example.test`;
  let started = false;
  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    if (started) {
      await aspire(["stop", "--non-interactive", "--apphost", appHostProject]);
      const { stdout: remaining } = await aspire(["ps", "--format", "Json", "--non-interactive"]);
      assert.equal(JSON.parse(remaining).length, 0, "El AppHost propio debe quedar apagado.");
    }
    // Solo el directorio absoluto creado por este runner dentro del temporal del sistema.
    assert.equal(path.dirname(directory), os.tmpdir());
    await rm(directory, { recursive: true, force: true });
    stopped = true;
  };
  try {
    if (build) {
      try { await execute("dotnet", ["build", "ArquitecturaBaseMultitenant.slnx", "--nologo"],
        { cwd: back, timeout: 300_000, maxBuffer: 10 * 1024 * 1024, windowsHide: true }); }
      catch { throw new Error("Falló el build del entorno E2E; compilá la solución del back para ver el diagnóstico."); }
    }
    started = true;
    await aspire(["run", "--detach", "--no-build", "--non-interactive", "--nologo", "--format", "Json", "--apphost", appHostProject], {
      ...process.env, MT_E2E_ISOLATED: "1", MT_E2E_BUSINESS_EMAIL: businessEmail,
      MT_E2E_PICKUP_DIR: directory, MT_E2E_READY_FILE: readyFile,
    });
    await waitFile(readyFile);
    const files = async () => (await readdir(directory)).filter((name) => name.endsWith(".eml"));
    const messages = async (email, before) => {
      const items = [];
      for (const name of await files()) {
        if (before.has(name)) continue;
        let body;
        try { body = await readFile(path.join(directory, name), "utf8"); }
        catch (error) { if (error.code === "ENOENT" || error.code === "EBUSY") continue; throw error; }
        const to = body.match(/^To: (.*)$/im)?.[1] ?? "";
        if (to.toLowerCase().includes(email.toLowerCase())) items.push({ name, body });
      }
      return items;
    };
    const command = async (suffix, data) => {
      const file = readyFile.replace(/\.ready$/, `.${suffix}.json`);
      await rm(file, { force: true });
      await rm(`${file}.done`, { force: true });
      // Publicación atómica: el preparador nunca lee un JSON escrito a medias.
      const temporary = `${file}.tmp`;
      await writeFile(temporary, JSON.stringify(data), { flag: "wx" });
      const { rename } = await import("node:fs/promises");
      await rename(temporary, file);
      try {
        const result = await waitFile(`${file}.done`, 30_000);
        return result ? JSON.parse(result) : null;
      } finally {
        await rm(file, { force: true });
        await rm(`${file}.done`, { force: true });
      }
    };
    return { directory, businessEmail, stop, files, messages, command,
      async code(email, before) {
        const deadline = Date.now() + 95_000;
        while (Date.now() < deadline) {
          for (const { name, body } of await messages(email, before)) {
            const code = pickupCode(body);
            if (!code) continue;
            await unlink(path.join(directory, name));
            return code;
          }
          await delay(250);
        }
        throw new Error("No llegó el código al pickup aislado de este paso.");
      },
      async oldSession() {
        await command("platform", { kind: "prepare" });
        const cookie = await command("legacy-session", { kind: "issue-public-operator" });
        assert.equal(cookie.name, ".AspNetCore.Identity.Application");
        assert.equal(typeof cookie.value, "string");
        // Estado guardado local, previo a cualquier visita. Nunca sale del temporal ni del contexto propio.
        const file = path.join(directory, "sesion-anterior.json");
        await writeFile(file, JSON.stringify({ cookies: [{ ...cookie, url: baseUrl.origin,
          httpOnly: true, secure: true, sameSite: "Lax", expires: Math.floor(Date.now() / 1000) + 86400 }], origins: [] }));
        const state = JSON.parse(await readFile(file, "utf8"));
        await unlink(file);
        return state.cookies;
      },
    };
  } catch (error) {
    try { await stop(); } catch (cleanup) { throw new AggregateError([error, cleanup], "Fallaron inicio y apagado del E2E."); }
    throw error;
  }
}
