import assert from "node:assert/strict";
import { open, lstat, realpath, unlink } from "node:fs/promises";
import path from "node:path";

const content = "# Temporal del E2E completo: evitar que Tailwind escanee sus propios scripts.\ne2e-completo*.mjs\n";

/** directory es la carpeta scripts absoluta; release se llama después de apagar el entorno. */
export async function createScriptScanFence({ directory }) {
  assert.ok(typeof directory === "string" && path.isAbsolute(directory), "La carpeta scripts debe ser absoluta.");
  const scriptsDirectory = await realpath(directory);
  const target = path.join(scriptsDirectory, ".gitignore");
  assert.equal(path.dirname(target), scriptsDirectory);
  let created;
  try { created = await open(target, "wx"); }
  catch (error) { if (error.code === "EEXIST") return { release: async () => {} }; throw error; }
  let ownStat;
  try { await created.writeFile(content, "utf8"); ownStat = await created.stat({ bigint: true }); }
  finally { await created.close(); }
  const unchanged = (stat) => stat.isFile() && ["dev", "ino", "size", "mtimeNs", "ctimeNs"].every((key) => stat[key] === ownStat[key]);
  let released;
  const removeOwnFile = async () => {
    try {
      if (!unchanged(await lstat(target, { bigint: true }))) return;
      const current = await open(target, "r");
      try {
        if (!unchanged(await current.stat({ bigint: true })) || await current.readFile("utf8") !== content) return;
        if (unchanged(await lstat(target, { bigint: true }))) await unlink(target);
      } finally { await current.close(); }
    } catch (error) { if (error.code !== "ENOENT") throw error; }
  };
  return { release: () => released ??= removeOwnFile() };
}
