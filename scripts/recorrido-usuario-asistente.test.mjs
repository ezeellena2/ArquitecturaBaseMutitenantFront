import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { assistantJourneyDefinitions, assistantJourneySources, loadAssistantJourneyDefinitions } from "./recorrido-usuario-asistente.mjs";

const readSource = (id) => readFile(new URL(`../docs/design/recorridos/${id}.json`, import.meta.url), "utf8");

test("prepara los seis guiones reales y sus 21 pasos en el orden aprobado", async () => {
  const definitions = await loadAssistantJourneyDefinitions();
  assert.equal(definitions.length, 21);
  assert.equal(new Set(definitions.map((step) => step.id)).size, 21);
  assert.deepEqual([...new Set(definitions.map((step) => step.source.guion))], assistantJourneySources.map((source) => source.id));
  assert.deepEqual(definitions.filter((step) => step.source.paso === 1).map((step) => step.id), ["E8B-10-1", "E8B-20-1", "E8B-30-1", "E8B-40-1", "E8B-50-1", "E8B-60-1"]);
  assert.equal(definitions.find((step) => step.actor === "Lucía · correo").source.route, "—");
  assert.ok(definitions.some((step) => step.actor === "Martín · operador · web"));
});

test("no transporta selectores, Tweaks ni la clave demostrativa a las definiciones", async () => {
  const definitions = await loadAssistantJourneyDefinitions();
  assert.ok(!JSON.stringify(definitions).includes("sk-ant-api03-ejemplo"));
  for (const step of definitions) {
    assert.deepEqual(Object.keys(step).sort(), ["action", "actor", "board", "expected", "id", "source", "title"]);
    assert.ok(!("antes" in step || "resaltar" in step || "tweaks" in step));
  }
});

test("rechaza un guion truncado o reordenado sin declarar cobertura parcial", async () => {
  const expected = assistantJourneySources[0]; const source = JSON.parse(await readSource(expected.id));
  assert.throws(() => assistantJourneyDefinitions({ ...source, pasos: source.pasos.slice(1) }, expected), /Guion E8b inválido/);
  assert.throws(() => assistantJourneyDefinitions({ ...source, orden: 20 }, expected), /Guion E8b inválido/);
  await assert.rejects(loadAssistantJourneyDefinitions(async (id) => id === "el-tope" ? "{}" : readSource(id)), /Guion E8b inválido: el-tope/);
});

test("rechaza rutas externas y acciones vacías sin imprimir el contenido inválido", async () => {
  const expected = assistantJourneySources[0]; const source = JSON.parse(await readSource(expected.id));
  for (const patch of [{ ruta: "https://privado.example.test/secreto" }, { ruta: "//privado.example.test" }, { accion: " " }]) {
    const changed = { ...source, pasos: [{ ...source.pasos[0], ...patch }, ...source.pasos.slice(1)] };
    assert.throws(() => assistantJourneyDefinitions(changed, expected), { message: "Guion E8b inválido: asistente-primera-vez." });
  }
});

test("sanea errores de lectura y JSON sin devolver claves o contenido privado", async () => {
  for (const read of [async () => { throw new Error("clave-privada"); }, async () => "clave-privada"]) {
    await assert.rejects(loadAssistantJourneyDefinitions(read), { message: "No se pudo leer el guion E8b: asistente-primera-vez." });
  }
});
