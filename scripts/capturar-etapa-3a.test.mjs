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
  installApiMocks,
  runAppActions,
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

test("Ingreso cubre sus estados 3a en ambas puertas sin estados de etapas futuras", () => {
  const cases = validateManifest(manifest, lienzo).filter((item) => item.group === "ingreso");
  const actual = new Set(cases.map((item) => `${item.props.estado}/${item.props.puerta}`));
  const expected = [
    "Correo/Persona", "Correo/Empresa", "Correo inválido/Persona",
    "Esperá para pedir otro código/Persona", "Demasiados pedidos/Persona",
    "No pudimos entrar con Google/Persona", "Código enviado/Persona",
    "Código incorrecto/Persona", "Código vencido/Persona", "Sin intentos/Persona",
    "Cuenta bloqueada/Persona", "Cuenta suspendida/Persona",
    "Empresa: la cuenta no está en ninguna empresa/Empresa",
    "Empresa: acceso deshabilitado/Empresa", "Tu sesión venció/Persona",
  ];
  assert.deepEqual([...actual].sort(), [...expected].sort());
  assert.equal(cases.length, expected.length * 2);
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

test("los pasos de app usan roles accesibles y completan el código de seis dígitos", async () => {
  const calls = [];
  const page = {
    getByRole: (role, { name }) => ({
      fill: async (value) => { calls.push(["fill", role, name, value]); },
      click: async () => { calls.push(["click", role, name]); },
    }),
    keyboard: { type: async (value) => { calls.push(["type", value]); } },
  };
  await runAppActions(page, [
    { type: "fill", role: "textbox", name: "Correo electrónico", value: "ana@example.test" },
    { type: "click", role: "button", name: "Enviar código" },
    { type: "otp", value: "123456" },
  ]);
  assert.deepEqual(calls, [
    ["fill", "textbox", "Correo electrónico", "ana@example.test"],
    ["click", "button", "Enviar código"],
    ["click", "textbox", "Código 1"],
    ["type", "123456"],
  ]);
});

test("la respuesta simulada se aplica sólo al método y ruta elegidos", async () => {
  let handler;
  const context = { route: async (_, next) => { handler = next; } };
  await installApiMocks(context, [{
    method: "POST", path: "/api/auth/login-code", status: 202,
    body: { resendAfterSeconds: 60 },
  }]);
  let fulfilled;
  const matching = {
    request: () => ({ method: () => "POST", url: () => "http://localhost/api/auth/login-code" }),
    fulfill: async (response) => { fulfilled = response; },
  };
  await handler(matching);
  assert.equal(fulfilled.status, 202);
  assert.deepEqual(JSON.parse(fulfilled.body), { resendAfterSeconds: 60 });
});

test("no intercepta módulos Vite cuya carpeta contiene api", async () => {
  let handler;
  const context = { route: async (_, next) => { handler = next; } };
  await installApiMocks(context);
  let continued = false;
  await handler({
    request: () => ({ method: () => "GET", url: () => "http://localhost/src/shared/api/queryClient.ts" }),
    continue: async () => { continued = true; },
    fulfill: async () => { throw new Error("Interceptó un módulo de Vite"); },
  });
  assert.equal(continued, true);
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
