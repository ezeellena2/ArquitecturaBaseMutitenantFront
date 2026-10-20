import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArguments, createReportStore, reusePassedPreparation, collectSuiteDefinitions, buildCaseDiagnostic, archivePreviousAttempt } from "./e2e-completo.mjs";

test("el historial omite la página de error del navegador y retira sólo su captura propia antes de archivarla", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "historial-e2e-"));
  const image = "CIERRE-01-1440.png";
  try {
    await writeFile(path.join(directory, image), "URL OAuth sintética");
    const prior = Object.freeze({ status: "failed", actual: "Protocol error", image, currentHost: "chromewebdata" });
    const hidden = await archivePreviousAttempt({ id: "CIERRE-01", width: 1440, prior, output: directory });
    assert.equal(hidden.image, undefined);
    assert.equal(hidden.actual, prior.actual);
    assert.match(hidden.reason, /parámetros OAuth/);
    await assert.rejects(stat(path.join(directory, image)), { code: "ENOENT" });
    assert.equal(prior.image, image);
    await writeFile(path.join(directory, image), "Captura normal");
    const kept = await archivePreviousAttempt({ id: "CIERRE-01", width: 1440, prior: { ...prior, currentHost: "localtest.me:5174" }, output: directory });
    assert.equal(await readFile(path.join(directory, kept.image), "utf8"), "Captura normal");
    assert.equal(await readFile(path.join(directory, image), "utf8"), "Captura normal");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("agotar la cuota diaria requiere selección explícita y un único ancho", () => {
  assert.equal(parseArguments([]).suites.includes("cuotawhatsapp"), false);
  assert.deepEqual(parseArguments(["--suite=cuotawhatsapp", "--width=390", "--resume", "--no-build"]).suites, ["cuotawhatsapp"]);
  assert.throws(() => parseArguments(["--suite=cuotawhatsapp"]), /único ancho/);
  assert.throws(() => parseArguments(["--suite=personal,cuotawhatsapp", "--width=1440"]), /aislada/);
});

test("la cuota compartida de una petición no se mezcla con otros casos ni anchos", () => {
  assert.equal(parseArguments([]).suites.includes("cuotacontrato"), false);
  assert.deepEqual(parseArguments(["--suite=cuotacontrato", "--width=1440", "--resume"]).suites, ["cuotacontrato"]);
  assert.throws(() => parseArguments(["--suite=cuotacontrato"]), /único ancho/);
  assert.throws(() => parseArguments(["--suite=contratoextra,cuotacontrato", "--width=390"]), /aislada/);
});

test("el bloqueo del clic se resume antes de truncar sin copiar el contenido del elemento superpuesto", () => {
  const error = new Error('locator.click: Timeout\n - waiting for button Perfil\n <div role="dialog" data-state="open">contenido-privado</div> intercepts pointer events');
  const actual = buildCaseDiagnostic(error);
  assert.match(actual, /role=dialog/);
  assert.match(actual, /open/);
  assert.match(actual, /waiting for button Perfil/);
  assert.equal(actual.includes("contenido-privado"), false);
  assert.match(buildCaseDiagnostic(new Error("HTTP inesperado"), () => "Ruta /login; fase methods"), /fase methods.*HTTP inesperado/);
});

test("seleccionar una suite y su reparación conserva una sola definición y no reintenta por defecto", () => {
  assert.deepEqual(collectSuiteDefinitions([{ definitions: [{ id: "A", expected: "viejo" }] }, { definitions: [{ id: "A", expected: "corregido" }, { id: "B" }] }]), [{ id: "A", expected: "corregido" }, { id: "B" }]);
  assert.equal(parseArguments([]).suites.some((name) => name.includes("arreglo") || name.startsWith("baseline")), false);
});

test("una preparación verde que ahora falla pierde la reutilización y conserva el error sin repetir la acción", async () => {
  const error = new Error("La sesión de Plataforma ya no aparece");
  let calls = 0;
  const result = await reusePassedPreparation({ previous: { status: "passed" }, preserve: true, action: async () => { calls++; throw error; } });
  assert.deepEqual(result, { reused: false, error });
  assert.equal(calls, 1);
  assert.deepEqual(await reusePassedPreparation({ previous: { status: "passed" }, preserve: true, action: async () => "fixture" }), { reused: true, value: "fixture" });
  assert.deepEqual(await reusePassedPreparation({ previous: { status: "passed" }, preserve: true, blockedReason: "No se visitó", action: async () => { throw error; } }), { reused: true });
  assert.deepEqual(await reusePassedPreparation({ previous: { status: "failed" }, preserve: true, action: async () => { throw error; } }), { reused: false });
});

test("el runner permite aislar suites y rechaza argumentos que ampliarían el alcance", () => {
  assert.deepEqual(parseArguments(["--suite=personal,plataforma", "--no-build", "--resume"]), { inventoryOnly: false, refreshOnly: false, resume: true, build: false, suites: ["personal", "plataforma"] });
  assert.deepEqual(parseArguments(["--suite=negocioextra,plataformaextra,whatsappextra"]).suites, ["negocioextra", "plataformaextra", "whatsappextra"]);
  assert.deepEqual(parseArguments(["--suite=continuacion", "--width=390"]).widths, [390]);
  assert.deepEqual(parseArguments(["--suite=baselinewhatsapp,baselineasistente,baselineorgwa,baselineseguridad"]).suites, ["baselinewhatsapp", "baselineasistente", "baselineorgwa", "baselineseguridad"]);
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
