import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArguments } from "./e2e-completo.mjs";

test("el runner permite aislar suites y rechaza argumentos que ampliarían el alcance", () => {
  assert.deepEqual(parseArguments(["--suite=personal,plataforma", "--no-build"]), { inventoryOnly: false, refreshOnly: false, build: false, suites: ["personal", "plataforma"] });
  for (const args of [["--suite=azure"], ["--suite=formularios"], ["--url=https://example.com"], ["--width=800"]]) assert.throws(() => parseArguments(args));
});

test("preparar o actualizar el informe no requiere iniciar el sistema", () => {
  assert.equal(parseArguments(["--inventory-only"]).inventoryOnly, true);
  assert.equal(parseArguments(["--refresh-only"]).refreshOnly, true);
});
