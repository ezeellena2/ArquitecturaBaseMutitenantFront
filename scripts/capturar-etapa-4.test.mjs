import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { assertCapturedPairs, validateManifest } from "./capturar-etapa-3a.mjs";
import { buildCases, canvas, output, writeManifest } from "./capturar-etapa-4.mjs";

test("Mi cuenta y sus diálogos usan solo referencias v60 aprobadas en ambos tamaños", async () => {
  const cases = await writeManifest();
  const validated = validateManifest(path.join(output, "manifest.json"), canvas);
  assert.equal(validated.length, 8);
  assert.deepEqual([...new Set(validated.map((entry) => entry.pair))].sort(), [
    "agregar-correo", "baja-cuenta", "cuenta", "verificar-correo",
  ]);
  assert.ok(validated.some((entry) => entry.board === "M-Cuenta" && entry.viewport.width === 390));
  assert.ok(validated.some((entry) => entry.board === "Cuenta-Agregar" && entry.viewport.width === 1440));
  assert.ok(validated.some((entry) => entry.board === "Cuenta-Verificar" && entry.viewport.width === 1440));
  assert.ok(validated.some((entry) => entry.board === "Cuenta-Baja" && entry.viewport.width === 1440));
  assert.ok(validated.filter((entry) => entry.viewport.width === 390 && entry.pair !== "cuenta")
    .every((entry) => entry.note?.includes("no tiene tablero móvil del diálogo")));
  assert.ok(validated.every((entry) => entry.app.captureMode === "harness"));
  assert.equal(buildCases().length, cases.length);
});

test("la puerta visual E4 requiere las ocho capturas de lienzo y aplicación", async () => {
  const cases = await writeManifest();
  const missing = cases.filter((entry) => {
    const stem = `${entry.id}-${entry.viewport.width}x${entry.viewport.height}`;
    const folder = path.join(output, entry.group);
    return !existsSync(path.join(folder, `${stem}-lienzo.png`)) || !existsSync(path.join(folder, `${stem}-app.png`));
  });
  if (missing.length > 0) assert.throws(() => assertCapturedPairs(cases, output), /Faltan capturas comparables/);
  else {
    assertCapturedPairs(cases, output);
    const readme = readFileSync(path.join(output, "README.md"), "utf8");
    assert.match(readme, /marco móvil aprobado M-Cuenta/);
    assert.match(readme, /reautenticación antes de mostrar el formulario/);
  }
});
