import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { buildManifest, expectedServerFailure } from "./capturar-etapa-8.mjs";

test("la ampliación preserva los cien casos existentes y sólo añade los ocho afectados", async () => {
  const previous = JSON.parse(execFileSync("git", ["show", "9ac6b8bb:docs/design/capturas/etapa-8/manifest.json"], { encoding: "utf8", cwd: new URL("..", import.meta.url) }));
  const current = await buildManifest();
  assert.equal(previous.cases.length, 100); assert.equal(current.cases.length, 108);
  for (const entry of previous.cases) assert.deepEqual(current.cases.find((candidate) => candidate.id === entry.id), entry);
  assert.deepEqual(current.cases.filter((entry) => !previous.cases.some((candidate) => candidate.id === entry.id)).map((entry) => entry.viewport.width), [1440, 390, 1440, 390, 1440, 390, 1440, 390]);
});

test("sólo el 5xx declarado para la acción exacta es un error de captura esperado", () => {
  const responses = [{ method: "POST", path: "/api/auth/deletion/cancel", status: 503 }];
  assert.equal(expectedServerFailure(responses, "POST", "/api/auth/deletion/cancel", 503), true);
  for (const [method, path, status] of [["GET", "/api/auth/deletion/cancel", 503], ["POST", "/api/auth/deletion/cancel", 500], ["POST", "/api/me", 503], ["POST", "/api/auth/deletion/cancel", 403]]) {
    assert.equal(expectedServerFailure(responses, method, path, status), false);
  }
});
