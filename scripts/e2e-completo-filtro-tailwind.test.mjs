import assert from "node:assert/strict";
import { mkdtemp, mkdir, open, writeFile, readFile, unlink, lstat, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createScriptScanFence } from "./e2e-completo-filtro-tailwind.mjs";

const expected = "# Temporal del E2E completo: evitar que Tailwind escanee sus propios scripts.\ne2e-completo*.mjs\n";

async function withScripts(work) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "e2e-tailwind-fence-test-"));
  const directory = path.join(temporary, "scripts"); await mkdir(directory);
  try { return await work({ directory, file: path.join(directory, ".gitignore"), temporary }); }
  finally {
    assert.equal(path.dirname(temporary), os.tmpdir()); assert.ok(path.basename(temporary).startsWith("e2e-tailwind-fence-test-"));
    await rm(temporary, { recursive: true, force: true });
  }
}

test("crea sólo el literal .gitignore con el contenido exacto y release es idempotente", async () => withScripts(async ({ directory, file }) => {
  const fence = await createScriptScanFence({ directory }); assert.equal(typeof fence.release, "function");
  assert.equal(await readFile(file, "utf8"), expected);
  await Promise.all([fence.release(), fence.release()]); await fence.release();
  await assert.rejects(lstat(file), { code: "ENOENT" });
}));

test("un archivo previo permanece intacto incluso si contiene exactamente nuestro filtro", async () => {
  for (const content of ["# Reglas propias de otro chat\n*.log\n", expected]) await withScripts(async ({ directory, file }) => {
    await writeFile(file, content); const before = await lstat(file, { bigint: true });
    const fence = await createScriptScanFence({ directory }); await fence.release();
    assert.equal(await readFile(file, "utf8"), content); const after = await lstat(file, { bigint: true });
    assert.equal(after.ino, before.ino); assert.equal(after.mtimeNs, before.mtimeNs); assert.equal(after.ctimeNs, before.ctimeNs);
  });
});

test("la carrera EEXIST conserva un único propietario y las otras invocaciones no borran", async () => withScripts(async ({ directory, file }) => {
  const owner = await createScriptScanFence({ directory });
  const late = await Promise.all(Array.from({ length: 8 }, () => createScriptScanFence({ directory })));
  await Promise.all(late.map((fence) => fence.release())); assert.equal(await readFile(file, "utf8"), expected);
  await owner.release(); await assert.rejects(lstat(file), { code: "ENOENT" });
  const raced = await Promise.all(Array.from({ length: 8 }, () => createScriptScanFence({ directory })));
  assert.equal(await readFile(file, "utf8"), expected); await Promise.all(raced.map((fence) => fence.release()));
  await assert.rejects(lstat(file), { code: "ENOENT" });
}));

test("preserva un filtro propio modificado y no recupera propiedad si luego vuelve al contenido original", async () => withScripts(async ({ directory, file }) => {
  const fence = await createScriptScanFence({ directory }); const changed = `${expected}# Cambio de otro chat\n`;
  await writeFile(file, changed); await fence.release(); assert.equal(await readFile(file, "utf8"), changed);
  await writeFile(file, expected); await fence.release(); assert.equal(await readFile(file, "utf8"), expected);
}));

test("preserva un reemplazo ajeno aun cuando tiene el mismo contenido", async () => withScripts(async ({ directory, file }) => {
  const fence = await createScriptScanFence({ directory }); const oldFile = await open(file, "r");
  try {
    await unlink(file); await writeFile(file, expected, { flag: "wx" });
    assert.notEqual((await lstat(file, { bigint: true })).ino, (await oldFile.stat({ bigint: true })).ino);
    await fence.release(); assert.equal(await readFile(file, "utf8"), expected);
  } finally { await oldFile.close(); }
}));

test("release tolera que ya hayan retirado el archivo y nunca borra otro destino", async () => withScripts(async ({ directory, file, temporary }) => {
  const outside = path.join(temporary, ".gitignore"); await writeFile(outside, expected);
  const fence = await createScriptScanFence({ directory }); await unlink(file); await fence.release();
  assert.equal(await readFile(outside, "utf8"), expected);
}));

test("los errores de creación no se ocultan como EEXIST y una ruta relativa no escribe", async () => withScripts(async ({ directory, file }) => {
  await assert.rejects(() => createScriptScanFence({ directory: path.join(directory, "inexistente") }), { code: "ENOENT" });
  await assert.rejects(() => createScriptScanFence({ directory: "scripts" }), /absoluta/u);
  await assert.rejects(lstat(file), { code: "ENOENT" });
}));
