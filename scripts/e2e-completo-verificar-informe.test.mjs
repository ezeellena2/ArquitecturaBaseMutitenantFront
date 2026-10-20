import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { renderCompleteReport, summarizeCases } from "./e2e-completo-informe.mjs";
import { verifyCompleteReport } from "./e2e-completo-verificar-informe.mjs";

const execute = promisify(execFile);
function png(width, height = 900) {
  const bytes = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8); bytes.write("IHDR", 12);
  bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  return bytes;
}

async function fixture(work) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "e2e-report-verifier-"));
  const captures = path.join(temporary, "docs", "design", "capturas");
  const directory = path.join(captures, "e2e-completo", "fecha");
  await mkdir(directory, { recursive: true });
  const results = [1440, 390].map((width) => ({ width, status: "passed", actual: "Acción comprobada", image: `${width}.png`, captureSize: { width, height: 900 } }));
  const execution = { id: "PROPIA-01", actor: "Persona", action: "Guardar", route: "/cuenta", expected: "Guardado", results };
  const row = { ...structuredClone(execution), id: "BACK-EJEMPLO", proofIds: [execution.id], proofGroups: [[execution.id]] };
  const report = { date: "fixture", environment: { cleanup: "apagado" }, cases: [row], matrix: [structuredClone(row)], executions: [execution] };
  for (const width of [1440, 390]) await writeFile(path.join(directory, `${width}.png`), png(width));
  const publish = async () => {
    report.summary = summarizeCases(report.cases);
    report.executionSummary = summarizeCases(report.executions);
    report.matrixSummary = summarizeCases(report.matrix);
    await save();
  };
  const save = async () => {
    await writeFile(path.join(directory, "resultados.json"), JSON.stringify(report));
    await writeFile(path.join(directory, "matriz.json"), JSON.stringify({ cases: report.matrix }));
    await writeFile(path.join(directory, "index.html"), renderCompleteReport(report));
  };
  try { await publish(); await work({ temporary, captures, directory, report, publish, save }); }
  finally {
    assert.equal(path.dirname(temporary), os.tmpdir());
    assert.ok(path.basename(temporary).startsWith("e2e-report-verifier-"));
    await rm(temporary, { recursive: true, force: true });
  }
}
const codes = (items) => items.map((item) => item.code);

test("verifica un informe pequeño con antecedente relativo e historial sin reescribirlo", async () => fixture(async ({ captures, directory, report, publish }) => {
  const journey = path.join(captures, "recorrido"); await mkdir(journey);
  await writeFile(path.join(journey, "index.html"), "Antecedente propio");
  await writeFile(path.join(directory, "anterior.png"), png(621));
  report.baseline = [{ source: "Recorrido", report: "../../recorrido/index.html" }];
  report.executions[0].results[1].previousAttempts = [{ status: "failed", actual: "Hecho anterior", image: "anterior.png" }];
  await publish();
  const files = ["resultados.json", "matriz.json", "index.html", "anterior.png"];
  const before = await Promise.all(files.map((file) => readFile(path.join(directory, file))));
  const result = await verifyCompleteReport({ directory });
  assert.deepEqual(result.issues, []); assert.deepEqual(result.warnings, []);
  assert.equal(result.counts.cases, 1); assert.equal(result.counts.matrix, 1);
  assert.equal(result.counts.executions, 1); assert.equal(result.counts.checks, 2);
  assert.equal(result.counts.pngs, 3); assert.equal(result.counts.histories, 1);
  const cli = await execute(process.execPath, [path.join(import.meta.dirname, "e2e-completo-verificar-informe.mjs"), `--directory=${directory}`], { windowsHide: true });
  assert.match(cli.stdout, /0 problemas, 0 advertencias/u);
  for (let index = 0; index < files.length; index++) assert.deepEqual(await readFile(path.join(directory, files[index])), before[index]);
}));

test("detecta resúmenes alterados y discrepancia de la matriz publicada", async () => fixture(async ({ directory, report, save }) => {
  report.summary.passed = 8; report.executionSummary.checks.total = 30;
  report.matrixSummary.total = 6; await save();
  await writeFile(path.join(directory, "matriz.json"), JSON.stringify({ cases: [] }));
  const result = await verifyCompleteReport({ directory });
  for (const expected of ["SUMMARY_MISMATCH", "EXECUTION_SUMMARY_MISMATCH", "MATRIX_SUMMARY_MISMATCH", "PUBLISHED_MATRIX_MISMATCH"]) assert.ok(codes(result.issues).includes(expected), expected);
}));

test("detecta IDs duplicados, referencias inexistentes y casos distintos de matrix sin fijar totales", async () => fixture(async ({ directory, report, publish }) => {
  report.executions.push(structuredClone(report.executions[0]));
  report.cases[0].proofIds.push("NO-EXISTE"); report.cases[0].proofGroups.push(["OTRO-AUSENTE"]);
  report.matrix[0].id = "OTRA-FILA"; await publish();
  const result = await verifyCompleteReport({ directory });
  for (const expected of ["DUPLICATE_ID", "UNKNOWN_PROOF", "CASE_MATRIX_MISMATCH"]) assert.ok(codes(result.issues).includes(expected), expected);
}));

test("compara HTML con el renderer actual y rechaza enlaces absolutos, esquemas y anchors rotos", async () => fixture(async ({ directory }) => {
  const original = await readFile(path.join(directory, "index.html"), "utf8");
  await writeFile(path.join(directory, "index.html"), original + '<img src="https://example.test/imagen.png"><a href="/fuera.png">Fuera</a><a href="#no-existe">Roto</a>');
  const result = await verifyCompleteReport({ directory });
  for (const expected of ["HTML_MISMATCH", "UNSAFE_REFERENCE", "MISSING_ANCHOR"]) assert.ok(codes(result.issues).includes(expected), expected);
}));

test("no sigue escapes codificados ni junctions hacia archivos externos a capturas", async () => fixture(async ({ temporary, directory, report, publish }) => {
  const outside = path.join(temporary, "externo"); await mkdir(outside);
  await writeFile(path.join(outside, "privada.png"), "No es PNG y no debe leerse");
  await symlink(outside, path.join(directory, "enlace"), "junction");
  report.executions[0].results[0].image = "enlace/privada.png";
  report.executions[0].results[1].image = "..%2f..%2f..%2f..%2f..%2fexterno%2fprivada.png";
  await publish();
  const result = await verifyCompleteReport({ directory });
  assert.ok(codes(result.issues).includes("UNSAFE_REFERENCE"));
  assert.equal(codes(result.issues).includes("INVALID_PNG"), false);
}));

test("contrasta cabecera PNG con metadata actual y exige nota si difiere del ancho nominal", async () => fixture(async ({ directory, report, publish }) => {
  await writeFile(path.join(directory, "390.png"), png(621, 3439));
  let result = await verifyCompleteReport({ directory });
  assert.ok(codes(result.issues).includes("CAPTURE_SIZE_MISMATCH"));
  assert.ok(codes(result.issues).includes("CAPTURE_NOTE_MISSING"));
  for (const row of [...report.cases, ...report.matrix, ...report.executions]) {
    row.results[1].captureSize = { width: 621, height: 3439 };
    row.results[1].captureNote = "Imagen621 ×3439; nominal390. No determina causa.";
  }
  await publish(); result = await verifyCompleteReport({ directory });
  assert.deepEqual(result.issues, []); assert.deepEqual(result.warnings, []);
}));

test("una captura ausente sólo baja a advertencia cuando el fallo declara Timeout", async () => fixture(async ({ directory, report, publish }) => {
  const result = report.executions[0].results[0];
  result.status = "failed"; result.actual = "Timeout 15000ms exceeded"; result.image = "ausente.png";
  await publish();
  let verified = await verifyCompleteReport({ directory });
  assert.equal(codes(verified.issues).includes("MISSING_REFERENCE"), false);
  assert.ok(codes(verified.warnings).includes("MISSING_TIMEOUT_CAPTURE"));
  result.actual = "Aserción funcional fallida"; await publish();
  verified = await verifyCompleteReport({ directory });
  assert.ok(codes(verified.issues).includes("MISSING_REFERENCE"));
  delete result.image; await publish();
  verified = await verifyCompleteReport({ directory });
  assert.ok(codes(verified.issues).includes("MISSING_CAPTURE"));
  result.actual = "Timeout 15000ms exceeded"; await publish();
  verified = await verifyCompleteReport({ directory });
  assert.deepEqual(verified.issues, []);
  assert.ok(codes(verified.warnings).includes("MISSING_TIMEOUT_CAPTURE"));
}));

test("rechaza una cabecera inválida y el CLI sólo acepta directorio absoluto", async () => fixture(async ({ directory }) => {
  await writeFile(path.join(directory, "1440.png"), Buffer.from("incompleta"));
  const verified = await verifyCompleteReport({ directory });
  assert.ok(codes(verified.issues).includes("INVALID_PNG"));
  const relative = await verifyCompleteReport({ directory: "ruta/relativa" });
  assert.ok(codes(relative.issues).includes("INVALID_DIRECTORY"));
  await assert.rejects(execute(process.execPath, ["scripts/e2e-completo-verificar-informe.mjs", "--directory=relativa"], { cwd: path.resolve(import.meta.dirname, ".."), windowsHide: true }), (error) => error.code === 1 && error.stdout.includes("INVALID_DIRECTORY"));
}));
