import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  assertCapturedPairs,
  boardChoices,
  captureCase,
  capturePaths,
  startCanvasServer,
  validateManifest,
} from "./capturar-etapa-3a.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = path.join(root, "docs/design/capturas/etapa-3a/manifest.json");
const lienzo = path.join(root, "docs/design/lienzo");

test("la matriz de 3a declara tablero real, estado aprobado y ambos tamaños", () => {
  const cases = validateManifest(manifest, lienzo);
  assert.ok(cases.length >= 2);
  assert.ok(cases.some((item) => item.viewport.width === 1440 && item.viewport.height === 900));
  assert.ok(cases.some((item) => item.viewport.width === 390 && item.viewport.height === 844));
  for (const item of cases) {
    const choices = boardChoices(path.join(lienzo, `${item.board}.dc.html`));
    for (const [key, value] of Object.entries(item.props)) {
      assert.ok(choices[key].includes(value), `${item.id}: ${key}=${value} no figura en ${item.board}`);
    }
  }
});

test("la verificación falla si falta la app o el tablero del mismo caso", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-3a-captures-"));
  const cases = [{ id: "ingreso-correo", group: "ingreso", viewport: { width: 390, height: 844 } }];
  const files = capturePaths(directory, cases[0]);
  mkdirSync(path.dirname(files.board), { recursive: true });
  writeFileSync(files.board, "board");
  assert.throws(() => assertCapturedPairs(cases, directory), /ingreso-correo.*app/);
  writeFileSync(files.app, "app");
  assert.doesNotThrow(() => assertCapturedPairs(cases, directory));
});

test("nombra pares por grupo, caso y viewport sin sobrescribir otro estado", () => {
  const first = capturePaths("C:/capturas", { id: "correo", group: "ingreso", viewport: { width: 1440, height: 900 } });
  const second = capturePaths("C:/capturas", { id: "codigo", group: "ingreso", viewport: { width: 1440, height: 900 } });
  assert.match(first.board, /ingreso[\\/]correo-1440x900-lienzo\.png$/);
  assert.match(first.app, /ingreso[\\/]correo-1440x900-app\.png$/);
  assert.notEqual(first.board, second.board);
});

test("cada estado del manifest exige versión de escritorio y móvil", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-3a-matrix-"));
  const oneSided = path.join(directory, "manifest.json");
  writeFileSync(oneSided, JSON.stringify({ version: 1, cases: [{
    id: "landing", pair: "landing", group: "publicas", board: "Landing",
    viewport: { width: 1440, height: 900 }, props: {}, app: { path: "/" },
  }] }));
  assert.throws(() => validateManifest(oneSided, lienzo), /landing.*390x844/);
});

test("Playwright fija el estado del tablero y captura app/lienzo al viewport pedido", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-3a-playwright-"));
  const canvasRoot = path.join(directory, "lienzo");
  mkdirSync(canvasRoot);
  writeFileSync(path.join(canvasRoot, "Prueba.dc.html"), `<!doctype html><html><body>
    <div data-sc-name="Prueba"><span id="state">default</span></div>
    <script data-dc-script data-props='{"estado":{"options":["Listo"],"default":"Listo"}}'></script>
    <script>window.__dcRootName = () => "Prueba";
      window.__dcSetProps = (_, props) => { document.querySelector("#state").textContent = props.estado; };</script>
    </body></html>`);
  const canvas = await startCanvasServer(canvasRoot);
  const app = createServer((_, response) => response.writeHead(200, { "Content-Type": "text/html" })
    .end("<!doctype html><html><body><main>Aplicación de prueba</main></body></html>"));
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    const entry = {
      id: "prueba", group: "ingreso", board: "Prueba", props: { estado: "Listo" },
      viewport: { width: 390, height: 844 }, app: { path: "/", readySelector: "main" },
    };
    const files = await captureCase(browser, entry, {
      canvasUrl: canvas.url, appUrl: `http://127.0.0.1:${app.address().port}`, outputRoot: directory,
    });
    assertCapturedPairs([entry], directory);
    for (const file of Object.values(files)) {
      const png = readFileSync(file);
      assert.equal(png.subarray(1, 4).toString(), "PNG");
      assert.equal(png.readUInt32BE(16), 390);
      assert.equal(png.readUInt32BE(20), 844);
    }
  } finally {
    await browser.close();
    await canvas.close();
    await new Promise((resolve) => app.close(resolve));
  }
});
