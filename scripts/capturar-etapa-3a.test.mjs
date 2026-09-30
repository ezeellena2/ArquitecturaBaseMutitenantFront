import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const outputRoot = path.join(root, "docs/design/capturas/etapa-3a");

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

test("Registro cubre todos los estados aprobados de 3a en escritorio y móvil", () => {
  const cases = validateManifest(manifest, lienzo).filter((item) => item.group === "registro");
  const expected = ["Correo", "Correo inválido", "Registro cerrado", "Código enviado", "Código incorrecto"];
  assert.deepEqual([...new Set(cases.map((item) => item.props.estado))].sort(), expected.sort());
  assert.equal(cases.length, expected.length * 2);
  assert.ok(cases.every((item) => item.board === (item.viewport.width === 390 ? "M-Registro" : "Registro")));
});

test("Portada y documentos legales tienen pares de escritorio y móvil", () => {
  const cases = validateManifest(manifest, lienzo).filter((item) => item.group === "publicas");
  assert.deepEqual([...new Set(cases.map((item) => item.pair))].sort(),
    ["landing", "legal-terms", "legal-privacy"].sort());
  assert.equal(cases.length, 6);
  for (const item of cases.filter((entry) => entry.pair.startsWith("legal-"))) {
    assert.equal(item.board, item.viewport.width === 390 ? "M-Legal" : "Legal");
    assert.equal(item.app.responses?.[0]?.status, 200);
    assert.match(item.app.responses[0].body.text, /^DOCUMENTO DE DEMOSTRACIÓN\./);
  }
});

test("el servidor del lienzo ofrece Inter local para comparar la misma fuente que la app", async () => {
  const canvas = await startCanvasServer();
  try {
    const font = await fetch(`${canvas.url}/_fonts/inter-latin-wght-normal.woff2`);
    assert.equal(font.status, 200);
    assert.match(font.headers.get("content-type"), /font\/woff2/);
    assert.ok((await font.arrayBuffer()).byteLength > 0);
  } finally {
    await canvas.close();
  }
});

test("inicios y perfiles tienen pares; los dos laterales abiertos solo tienen tablero móvil", () => {
  const cases = validateManifest(manifest, lienzo).filter((entry) => entry.group === "inicios");
  const expected = ["inicio-personal", "inicio-org", "perfiles-personal", "perfiles-org", "lateral-personal", "lateral-org"];
  assert.deepEqual([...new Set(cases.map((entry) => entry.pair))].sort(), expected.sort());
  assert.equal(cases.length, 10);
  assert.ok(cases.filter((entry) => entry.id.startsWith("lateral-")).every((entry) => entry.mobileOnly === true));
  assert.ok(cases.every((entry) => entry.app.userFixture && entry.app.path.includes("visualApp.html")));
  assertCapturedPairs(cases, outputRoot);
});

test("el lateral móvil añade cobertura y solo los inicios móviles vacíos pueden repetirse", () => {
  const cases = validateManifest(manifest, lienzo).filter((entry) => entry.group === "inicios");
  assert.equal(cases.filter((entry) => entry.id.startsWith("lateral-") && entry.viewport.width === 1440).length, 0,
    "el tablero de escritorio no dibuja el lateral contraído y los casos anteriores repetían el inicio");
  for (const entry of cases.filter((item) => item.id.startsWith("lateral-"))) {
    assert.equal(entry.viewport.width, 390);
    assert.ok(entry.app.actions?.some((action) => action.type === "click" && action.name === "Abrir o contraer navegación"));
  }
  for (const kind of ["app", "board"]) {
    const hashes = new Map();
    for (const entry of cases) {
      const hash = createHash("sha256").update(readFileSync(capturePaths(outputRoot, entry)[kind])).digest("hex");
      const previous = hashes.get(hash);
      if (previous) {
        assert.deepEqual([previous, entry.id].sort(), ["inicio-org-movil", "inicio-personal-movil"].sort(),
          `${entry.id} repite ${previous} sin representar otro acceso visible`);
      }
      hashes.set(hash, entry.id);
    }
  }
});

test("cada captura del arnés visual se identifica y se distingue del recorrido real", () => {
  const cases = validateManifest(manifest, lienzo);
  const harnessCases = cases.filter((entry) => entry.app.path.startsWith("/src/test/"));
  assert.equal(harnessCases.length, 30);
  for (const entry of harnessCases) assert.equal(entry.app.captureMode, "harness", entry.id);
  for (const entry of cases.filter((item) => !item.app.path.startsWith("/src/test/"))) {
    assert.notEqual(entry.app.captureMode, "harness", entry.id);
  }
  for (const group of ["inicios", "errores"]) {
    const readme = readFileSync(path.join(outputRoot, group, "README.md"), "utf8");
    assert.match(readme, /visualApp\.html/);
    assert.match(readme, /arnés/);
  }
  const errorsReadme = readFileSync(path.join(outputRoot, "errores", "README.md"), "utf8");
  assert.doesNotMatch(errorsReadme, /aun con un 403 o 404 de la API/);
});

test("errores de organización y estados de sesión cubren toda la matriz 3a", () => {
  const cases = validateManifest(manifest, lienzo).filter((entry) => entry.group === "errores");
  const expected = [
    "error-org-403", "error-org-404", "perfil-suspendido", "perfil-espera", "perfil-cerrado",
    "sesion-iniciando", "sesion-grupo-delta", "sesion-personal", "sesion-cerrando", "sesion-error",
  ];
  assert.deepEqual([...new Set(cases.map((entry) => entry.pair))].sort(), expected.sort());
  assert.equal(cases.length, expected.length * 2);
  assert.ok(cases.filter((entry) => entry.viewport.width === 390).every((entry) =>
    entry.mobileReference === "sin tablero móvil: pendiente de aprobación del usuario"));
  assertCapturedPairs(cases, outputRoot);
});

test("los diez estados móviles sin tablero aprobado tienen solo captura de app y se declaran pendientes", () => {
  const cases = validateManifest(manifest, lienzo).filter((entry) =>
    entry.group === "errores" && entry.viewport.width === 390);
  assert.equal(cases.length, 10);
  const readme = readFileSync(path.join(outputRoot, "errores", "README.md"), "utf8");
  assert.match(readme, /sin tablero móvil: pendiente de aprobación del usuario/);
  assert.match(readme, /no tienen referencia móvil comparable/i);
  assert.doesNotMatch(readme, /recortad[ao].*referencia de textos y orden/i);
  for (const entry of cases) {
    const files = capturePaths(outputRoot, entry);
    assert.equal(existsSync(files.board), false, `${entry.id} no tiene un tablero móvil aprobado`);
    assert.equal(existsSync(files.app), true, `${entry.id} conserva su captura de app`);
  }
});

test("los tableros comparables de errores no repiten el mismo PNG entre estados", () => {
  const cases = validateManifest(manifest, lienzo).filter((entry) =>
    entry.group === "errores" && entry.viewport.width === 1440);
  const hashes = new Map();
  for (const entry of cases) {
    const board = capturePaths(outputRoot, entry).board;
    const hash = createHash("sha256").update(readFileSync(board)).digest("hex");
    assert.equal(hashes.has(hash), false, `${entry.id} repite la referencia de ${hashes.get(hash)}`);
    hashes.set(hash, entry.id);
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

test("cada estado exige ambos tamaños salvo el lateral móvil declarado", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-3a-matrix-"));
  const oneSided = path.join(directory, "manifest.json");
  writeFileSync(oneSided, JSON.stringify({ version: 1, cases: [{
    id: "landing", pair: "landing", group: "publicas", board: "Landing",
    viewport: { width: 1440, height: 900 }, props: {}, app: { path: "/" },
  }] }));
  assert.throws(() => validateManifest(oneSided, lienzo), /landing.*390x844/);
  const mobileOnly = path.join(directory, "lateral.json");
  writeFileSync(mobileOnly, JSON.stringify({ version: 1, cases: [{
    id: "lateral-personal-movil", pair: "lateral-personal", group: "inicios", board: "M-Inicio-Personal",
    mobileOnly: true, viewport: { width: 390, height: 844 }, props: {},
    app: { path: "/src/test/visualApp.html", captureMode: "harness" },
  }] }));
  assert.doesNotThrow(() => validateManifest(mobileOnly, lienzo));
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
