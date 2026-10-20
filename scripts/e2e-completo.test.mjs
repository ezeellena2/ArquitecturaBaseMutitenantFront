import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArguments, createReportStore } from "./e2e-completo.mjs";

test("el runner permite aislar suites y rechaza argumentos que ampliarían el alcance", () => {
  assert.deepEqual(parseArguments(["--suite=personal,plataforma", "--no-build", "--resume"]), { inventoryOnly: false, refreshOnly: false, resume: true, build: false, suites: ["personal", "plataforma"] });
  for (const args of [["--suite=azure"], ["--suite=formularios"], ["--url=https://example.com"], ["--width=800"]]) assert.throws(() => parseArguments(args));
});

test("los avances quedan fuera del informe escaneado hasta publicar con el entorno apagado", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "informe-e2e-"));
  const output = path.join(directory, "docs");
  const checkpoint = path.join(directory, ".local");
  try {
    const store = await createReportStore(output, checkpoint);
    const report = { date: "2026-10-20", cases: [], matrix: [], environment: { cleanup: "en ejecución" }, commits: {} };
    await store.save(report);
    assert.equal(JSON.parse(await readFile(path.join(checkpoint, "resultados.json"), "utf8")).environment.cleanup, "en ejecución");
    for (const name of ["index.html", "resultados.json", "matriz.json"]) await assert.rejects(stat(path.join(output, name)), { code: "ENOENT" });
    assert.match(await readFile(path.join(output, ".gitignore"), "utf8"), /^\*\n/);
    report.environment.cleanup = "apagado";
    await store.save(report, { publish: true });
    assert.equal(JSON.parse(await readFile(path.join(output, "resultados.json"), "utf8")).environment.cleanup, "apagado");
    assert.match(await readFile(path.join(output, "index.html"), "utf8"), /2026-10-20/);
  } finally {
    assert.equal(path.dirname(directory), os.tmpdir());
    await rm(directory, { recursive: true, force: true });
  }
});

test("preparar o actualizar el informe no requiere iniciar el sistema", () => {
  assert.equal(parseArguments(["--inventory-only"]).inventoryOnly, true);
  assert.equal(parseArguments(["--refresh-only"]).refreshOnly, true);
});
