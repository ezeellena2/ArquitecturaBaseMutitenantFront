import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { annotateCaptureDimensions } from "./e2e-completo-capturas.mjs";

function pngHeader(width, height) {
  const bytes = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8); bytes.write("IHDR", 12); bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  return bytes;
}

async function withCaptures(work) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "e2e-capture-header-test-"));
  const root = path.join(directory, "docs", "design", "capturas"); const output = path.join(root, "e2e-completo", "salida");
  await mkdir(output, { recursive: true });
  try { return await work({ directory, root, output }); }
  finally {
    assert.equal(path.dirname(directory), os.tmpdir()); assert.ok(path.basename(directory).startsWith("e2e-capture-header-test-"));
    await rm(directory, { recursive: true, force: true });
  }
}

test("lee las dimensiones de toda cabecera PNG y anota sólo la diferencia de ancho sin atribuir una causa", async () => withCaptures(async ({ output }) => {
  for (const [file, width, height] of [["amplia.png", 621, 1380], ["escritorio.png", 1440, 1100], ["alta.png", 390, 2200]]) await writeFile(path.join(output, file), pngHeader(width, height));
  const previousAttempts = Object.freeze([Object.freeze({ width: 390, status: "failed", image: "historica.png", actual: "Fallo anterior" })]);
  const attempts = Object.freeze([Object.freeze({ status: "failed", actual: "Otro intento" })]);
  const rows = Object.freeze([Object.freeze({ id: "CASO-GENERICO", actor: "Actor original", results: Object.freeze([
    Object.freeze({ width: 390, status: "failed", image: "amplia.png", actual: "Aserción original", previousAttempts, attempts }),
    Object.freeze({ width: 1440, status: "passed", image: "escritorio.png", actual: "Resultado original" }),
    Object.freeze({ width: 390, status: "passed", image: "alta.png", actual: "Otra altura" }),
  ]) })]);
  const before = structuredClone(rows); const actual = await annotateCaptureDimensions(rows, { output });
  assert.deepEqual(rows, before); assert.equal(actual.length, 1); assert.equal(actual[0].id, rows[0].id); assert.equal(actual[0].actor, rows[0].actor);
  const [wide, desktop, tall] = actual[0].results;
  assert.deepEqual(wide.captureSize, { width: 621, height: 1380 }); assert.deepEqual(desktop.captureSize, { width: 1440, height: 1100 }); assert.deepEqual(tall.captureSize, { width: 390, height: 2200 });
  assert.match(wide.captureNote, /Captura de 621.*1380.*viewport nominal.*390/u);
  assert.match(wide.captureNote, /fullPage puede ampliarse/u); assert.match(wide.captureNote, /no hubo medición de scrollWidth en ese momento/u);
  assert.match(wide.captureNote, /no permite inferir.*persistente.*transitoria/u);
  for (const [index, result] of actual[0].results.entries()) for (const key of Object.keys(rows[0].results[index])) assert.equal(result[key], rows[0].results[index][key], key);
  assert.equal(wide.previousAttempts, previousAttempts); assert.equal(wide.attempts, attempts); assert.equal(previousAttempts[0].captureSize, undefined);
  assert.equal(desktop.captureNote, undefined); assert.equal(tall.captureNote, undefined);
  assert.deepEqual(await annotateCaptureDimensions(actual, { output }), actual);
}));

test("permite rutas relativas de otros recorridos sólo dentro de docs/design/capturas", async () => withCaptures(async ({ root, output }) => {
  const other = path.join(root, "recorrido"); await mkdir(other); await writeFile(path.join(other, "otra.png"), pngHeader(621, 720));
  const rows = [{ id: "REFERENCIA", results: [{ width: 390, status: "failed", image: "../../recorrido/otra.png", actual: "Se conserva" }] }];
  const [actual] = await annotateCaptureDimensions(rows, { output });
  assert.deepEqual(actual.results[0].captureSize, { width: 621, height: 720 }); assert.equal(actual.results[0].image, rows[0].results[0].image);
}));

test("rechaza absolutos, esquemas, NUL y escapes sin leer fuera del árbol permitido", async () => withCaptures(async ({ directory, output }) => {
  const outside = path.join(directory, "fuera.png"); await writeFile(outside, pngHeader(621, 720));
  const images = [outside, "C:\\fuera\\imagen.png", "\\\\servidor\\recurso\\imagen.png", "https://example.test/imagen.png", "file:///fuera.png", "data:image/png;base64,AAAA", "imagen\0.png", path.relative(output, outside)];
  const rows = images.map((image, index) => ({ id: `RUTA-${index}`, results: [{ width: 390, status: "failed", image }] }));
  const actual = await annotateCaptureDimensions(rows, { output });
  for (const entry of actual) { assert.equal(entry.results[0].captureSize, undefined); assert.match(entry.results[0].captureNote, /no inspeccionada/u); }
  assert.deepEqual(await readFile(outside), pngHeader(621, 720));
}));

test("un enlace simbólico no permite salir del árbol de capturas", async () => withCaptures(async ({ directory, output }) => {
  const outside = path.join(directory, "externo"); await mkdir(outside); await writeFile(path.join(outside, "fuera.png"), pngHeader(621, 720));
  await symlink(outside, path.join(output, "enlace"), "junction");
  const [entry] = await annotateCaptureDimensions([{ results: [{ width: 390, status: "failed", image: "enlace/fuera.png" }] }], { output });
  assert.equal(entry.results[0].captureSize, undefined); assert.match(entry.results[0].captureNote, /no inspeccionada/u);
}));

test("archivo ausente o cabecera inválida deja sólo una nota y conserva el fallo original", async () => withCaptures(async ({ output }) => {
  const wrongSignature = pngHeader(621, 720); wrongSignature[0] = 0;
  const wrongChunk = pngHeader(621, 720); wrongChunk.write("IDAT", 12);
  const wrongLength = pngHeader(621, 720); wrongLength.writeUInt32BE(12, 8);
  const files = [["corta.png", pngHeader(621, 720).subarray(0, 23)], ["firma.png", wrongSignature], ["chunk.png", wrongChunk], ["longitud.png", wrongLength], ["cero.png", pngHeader(0, 720)]];
  for (const [file, data] of files) await writeFile(path.join(output, file), data);
  for (const image of ["ausente.png", ...files.map(([file]) => file)]) {
    const original = { width: 390, status: "failed", actual: "Fallo original", image, captureSize: { width: 1, height: 1 }, captureNote: "Metadatos anteriores" };
    const [entry] = await annotateCaptureDimensions([{ results: [original] }], { output }); const result = entry.results[0];
    assert.equal(result.captureSize, undefined); assert.match(result.captureNote, /no inspeccionada/u); assert.equal(result.status, "failed"); assert.equal(result.actual, original.actual);
    assert.deepEqual(original.captureSize, { width: 1, height: 1 });
  }
}));

test("no inventa viewport y elimina una nota de diferencia obsoleta al coincidir la cabecera actual", async () => withCaptures(async ({ output }) => {
  await writeFile(path.join(output, "actual.png"), pngHeader(390, 720));
  const untouched = { id: "SIN-RESULTADOS" }; const noImage = { width: 390, status: "blocked", actual: "Sin captura" };
  const rows = [untouched, { results: [noImage, { status: "failed", image: "actual.png" }, { width: 390, status: "passed", image: "actual.png", captureNote: "Diferencia anterior" }] }];
  const actual = await annotateCaptureDimensions(rows, { output });
  assert.equal(actual[0], untouched); assert.equal(actual[1].results[0], noImage);
  assert.deepEqual(actual[1].results[1].captureSize, { width: 390, height: 720 }); assert.equal(actual[1].results[1].captureNote, undefined);
  assert.equal(actual[1].results[2].captureNote, undefined);
}));
