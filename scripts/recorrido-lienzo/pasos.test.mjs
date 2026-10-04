import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { boardStatus, buildSteps } from "./pasos.mjs";

const lienzo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../docs/design/lienzo");

test("el estado del tablero sale de su título", () => {
  assert.equal(boardStatus("Usuarios"), "Validado");
  assert.equal(boardStatus("Inicio · para aprobar"), "Para aprobar");
  assert.equal(boardStatus("Página pública · por refinar"), "Por refinar");
});

test("recorre las páginas en el orden del lienzo, sin Archivo, cada una con su presentación", () => {
  const steps = buildSteps(lienzo);
  const pages = steps.filter((step) => step.kind === "page").map((step) => step.page);
  assert.equal(pages[0], "Criterio de diseño");
  assert.ok(!pages.includes("Archivo"));
  assert.ok(pages.includes("Ingreso y registro") && pages.includes("Plataforma"));
  assert.equal(steps[0].kind, "page");
  assert.deepEqual(steps.map((step) => step.index), steps.map((_, index) => index));
  assert.ok(steps.every((step) => step.total === steps.length));
  assert.ok(buildSteps(lienzo, { withArchive: true }).some((step) => step.page === "Archivo"));
});

test("cada tablero abre como en el lienzo y después muestra cada estado de a uno", () => {
  const steps = buildSteps(lienzo).filter((step) => step.file === "Ingreso.dc.html");
  assert.match(steps[0].state, /como abre/);
  assert.ok(steps.some((step) => step.state === "estado «Código enviado»" && step.props.estado === "Código enviado"));
  assert.equal(new Set(steps.map((step) => JSON.stringify(step.props))).size, steps.length);
  assert.ok(steps.every((step) => step.device === "Compu" && step.width === 1440));
});
