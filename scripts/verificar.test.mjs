import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { ejecutar, erroresDeTipos, fallosDeVitest, informe, parsear, planDe } from "./verificar.mjs";

// Ningún test corre tsc, oxlint ni vitest: los pasos se responden con salidas fijas.
const VITEST = {
  numTotalTests: 3,
  numPassedTests: 1,
  numFailedTests: 2,
  testResults: [
    {
      name: path.join(process.cwd(), "src", "roles", "Roles.test.tsx"),
      status: "failed",
      assertionResults: [
        { fullName: "Roles muestra el 403", status: "failed", failureMessages: ["AssertionError: expected 'Hola' to be 'Sin permiso'\n    at Roles.test.tsx:40:5\n    at node_modules/vitest/dist/x.js:1:1"] },
        { fullName: "Roles lista", status: "passed", failureMessages: [] },
      ],
    },
    { name: path.join(process.cwd(), "src", "x", "Roto.test.tsx"), status: "failed", message: "Failed to resolve import \"./nada\"", assertionResults: [] },
  ],
};

test("verificar del front: los fallos de vitest salen con su archivo, su nombre y el mensaje, sin la pila", () => {
  const fallos = fallosDeVitest(VITEST);
  assert.deepEqual(fallos.map((f) => f.test), ["src/roles/Roles.test.tsx › Roles muestra el 403", "src/x/Roto.test.tsx"]);
  assert.deepEqual(fallos[0].detalle, ["AssertionError: expected 'Hola' to be 'Sin permiso'"]);
  assert.deepEqual(fallos[1].detalle, ['Failed to resolve import "./nada"']);
  assert.equal(informe("tests", 1, "", 30, VITEST)[0], "tests: 2 con error, 1 de 3 pasaron (30 s)");
  assert.deepEqual(informe("tests", 0, "", 30, { numTotalTests: 5, numPassedTests: 5, numFailedTests: 0, testResults: [] }), ["tests: ok, 5 de 5 (30 s)"]);
});

test("verificar del front: los tipos muestran cada error una vez", () => {
  const texto = "src/a.ts(10,5): error TS2322: Type 'string' is not assignable.\nsrc/a.ts(10,5): error TS2322: Type 'string' is not assignable.\nFound 1 error.";
  assert.deepEqual(erroresDeTipos(texto), ["src/a.ts(10,5): error TS2322: Type 'string' is not assignable."]);
  assert.match(informe("tipos", 2, texto, 9).join("\n"), /tipos: con error[\s\S]*TS2322/);
});

test("verificar del front: completo corre todo; --cambiados y --archivos, solo los tests", () => {
  assert.deepEqual(planDe(parsear([]), "v.json").map((p) => p.nombre), ["tipos", "lint", "tests", "contrato"]);
  const cambiados = planDe(parsear(["--cambiados"]), "v.json");
  assert.deepEqual(cambiados.map((p) => p.nombre), ["tests"]);
  assert.ok(cambiados[0].comando.includes("--changed"));
  assert.deepEqual(planDe(parsear(["--archivos", "a.test.tsx", "b.test.tsx"]), "v.json")[0].comando.slice(-2), ["a.test.tsx", "b.test.tsx"]);
  assert.throws(() => parsear(["--archivos"]), /al menos un archivo/);
  assert.throws(() => parsear(["--todo"]), /Opción desconocida/);
});

test("verificar del front: deja los logs en .local/verificar y sale 1 si algo falló", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "verificar-front-"));
  try {
    const salida = [];
    const correr = (comando) => {
      if (comando.includes("vitest")) {
        const json = comando.find((c) => c.startsWith("--outputFile=")).slice("--outputFile=".length);
        writeFileSync(json, JSON.stringify(VITEST));
        return { codigo: 1, texto: "" };
      }
      return { codigo: 0, texto: "todo bien" };
    };
    assert.equal(await ejecutar([], { cwd: dir, escribir: (s) => salida.push(s), correr }), 1);
    assert.deepEqual(salida.slice(0, 2), ["tipos: ok (0 s)", "lint: ok (0 s)"]);
    assert.match(salida.join("\n"), /✖ .*Roles muestra el 403[\s\S]*Log entero: .*tests\.log[\s\S]*contrato: ok/);
    assert.equal(readFileSync(path.join(dir, ".local", "verificar", "lint.log"), "utf8"), "todo bien");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
