import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { chromium } from "playwright";
import { build } from "vite";
import { buildManifest, canvasRevision, expectedServerFailure, prepareCanvasSource } from "./capturar-etapa-8.mjs";
import { startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { openApp, openBoard } from "./capturar-relevamiento.mjs";
import { writeGallery } from "./generar-galeria-etapa-8.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("la ficha móvil de Cuenta usa dos columnas y conserva tres grupos legibles con teclado a 390 px", { timeout: 30_000 }, async () => {
  const manifest = await buildManifest();
  const entry = manifest.cases.find((item) => item.id === "n2-ficha-phone-sin-nombre-mobile");
  assert.ok(entry);
  const output = mkdtempSync(path.join(root, ".local", "e8-n2-tabs-"));
  // El bundle de prueba evita el optimizador de dependencias de Vite dev durante la carrera.
  await build({ root, logLevel: "silent", build: { outDir: output, emptyOutDir: false, rolldownOptions: { input: { visual: path.join(root, "src/test/etapa8VisualApp.html") } } } });
  const app = await startCanvasServer(output);
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: "chrome" });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    context.setDefaultTimeout(10_000);
    const page = await openApp(context, app.url, entry);
    const tabs = page.getByRole("tab");
    assert.equal(await tabs.count(), 3);
    const boxes = await tabs.evaluateAll((items) => items.map((item) => {
      const box = item.getBoundingClientRect();
      const label = document.createRange(); label.selectNodeContents(item);
      const text = label.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, textLeft: text.left, textRight: text.right };
    }));
    assert.equal(boxes[0].top, boxes[1].top);
    assert.ok(boxes[2].top >= boxes[0].bottom);
    for (const box of boxes) {
      assert.ok(box.left >= 0 && box.right <= 390);
      assert.ok(box.textLeft >= box.left && box.textRight <= box.right);
    }
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await page.locator('[role="tab"][aria-selected="true"]').filter({ hasText: "Organizaciones" }).waitFor();
    assert.equal(await tabs.nth(1).getAttribute("aria-selected"), "true");
    assert.equal(await page.getByRole("tabpanel").isVisible(), true);
    await page.keyboard.press("ArrowRight");
    await page.locator('[role="tab"][aria-selected="true"]').filter({ hasText: "Historial de seguridad" }).waitFor();
    assert.equal(await tabs.nth(2).getAttribute("aria-selected"), "true");
    assert.equal(await page.getByRole("tabpanel").isVisible(), true);
  } finally {
    await browser?.close();
    await app.close();
  }
});

test("los rechazos de ingreso y enlace copian el HTTP publicado sin intentos en vencido o suspendido", async () => {
  const manifest = await buildManifest();
  const entries = manifest.cases.filter((entry) => /^(ingreso-(consumer|business)-(codigo-incorrecto|codigo-vencido|cuenta-suspendida)|enlace-suspendida)-(desktop|mobile)$/.test(entry.id));
  assert.equal(entries.length, 14);
  for (const entry of entries) {
    const response = entry.app.responses.find((item) => item.path.endsWith("/verify") || item.path.endsWith("/preview"));
    const body = response.body;
    assert.equal(body.title, "Solicitud rechazada", entry.id);
    assert.equal(body.status, response.status, entry.id);
    if (body.code === "Auth.LoginCode.Invalid") {
      assert.equal(body.detail, "El código no es válido.", entry.id);
      assert.equal(body.attemptsLeft, 3, entry.id); // prueba activa creada por la acción previa.
    } else {
      assert.equal(body.detail, body.code === "Auth.LoginCode.Expired" ? "El código venció. Pedí uno nuevo." : "Tu cuenta está suspendida.", entry.id);
      assert.equal(Object.hasOwn(body, "attemptsLeft"), false, entry.id);
    }
  }
});

test("Cuenta vencida conserva Expired de la API y muestra cumplida la espera de reenvío", async () => {
  const manifest = await buildManifest();
  const entries = manifest.cases.filter((entry) => /^cuenta-verificar-vencido-(desktop|mobile)$/.test(entry.id));
  assert.equal(entries.length, 2);
  for (const entry of entries) {
    const sent = entry.app.responses.find((item) => item.method === "POST" && item.path === "/api/me/login-methods");
    const rejected = entry.app.responses.find((item) => item.path.endsWith("/verify"));
    assert.equal(sent.body.resendAfterSeconds, 0, entry.id);
    assert.equal(rejected.body.code, "Auth.LoginCode.Expired", entry.id);
    assert.equal(rejected.status, 400, entry.id);
    assert.equal(rejected.body.detail, "El código venció. Pedí uno nuevo.", entry.id);
    assert.equal(Object.hasOwn(rejected.body, "attemptsLeft"), false, entry.id);
    assert.ok(entry.app.actions.some((action) => action.type === "click" && action.name === "Verificar"), entry.id);
  }
});

test("N3 abre todos los menús desktop sobre el DOM real de la fuente v116", { timeout: 30_000 }, async () => {
  const manifest = await buildManifest();
  assert.equal(manifest.canvasRevision, "21f227bcf6fd7a910272c682d5085338f8e2039c");
  const entries = manifest.cases.filter((entry) => /^n3-menu-/.test(entry.id) && entry.viewport.width === 1440);
  assert.equal(entries.length, 8);
  const canvas = await startCanvasServer(prepareCanvasSource());
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: "chrome" });
    const context = await browser.newContext();
    context.setDefaultTimeout(2_000);
    for (const entry of entries) {
      const page = await openBoard(context, canvas.url, entry);
      try {
        assert.equal(await page.getByRole("menu").count(), 1, entry.id);
        assert.equal(await page.getByRole("menu").isVisible(), true, entry.id);
        if (entry.board === "Cuenta") {
          assert.equal(await page.locator("details.w-umd").getAttribute("open"), "", entry.id);
          // v116 conserva CSS .um-btn de otros marcos, pero Cuenta no tiene ese control en el DOM.
          assert.equal(await page.locator(".um-btn").count(), 0, entry.id);
        }
      } finally { await page.close(); }
    }
  } finally {
    await browser?.close();
    await canvas.close();
  }
});

test("N2/N3 preservan las 108 escenas, corrigen sólo 16 mocks vigentes y añaden 36 comparaciones pertinentes", async () => {
  const previous = JSON.parse(execFileSync("git", ["show", "9e1e4b9c:docs/design/capturas/etapa-8/manifest.json"], { encoding: "utf8", cwd: root }));
  const current = await buildManifest();
  assert.equal(current.canvasVersion, "v116 · 21f227bc");
  assert.equal(current.canvasRevision, canvasRevision);
  assert.equal(previous.cases.length, 108); assert.equal(current.cases.length, 144);
  for (const entry of previous.cases) {
    const expected = structuredClone(entry);
    if (/^(ingreso-(consumer|business)-(codigo-incorrecto|codigo-vencido|cuenta-suspendida)|enlace-suspendida)-(desktop|mobile)$/.test(entry.id)) {
      const response = expected.app.responses.find((item) => item.path.endsWith("/verify") || item.path.endsWith("/preview"));
      const code = response.body.code;
      response.body = { type: "about:blank", title: "Solicitud rechazada", status: response.status, code, traceId: "visual-e8",
        detail: code === "Auth.LoginCode.Invalid" ? "El código no es válido." : code === "Auth.LoginCode.Expired" ? "El código venció. Pedí uno nuevo." : "Tu cuenta está suspendida.",
        ...(code === "Auth.LoginCode.Invalid" ? { attemptsLeft: 3 } : {}),
      };
    }
    if (/^cuenta-verificar-vencido-(desktop|mobile)$/.test(entry.id)) {
      expected.app.responses.find((item) => item.method === "POST" && item.path === "/api/me/login-methods").body.resendAfterSeconds = 0;
    }
    assert.deepEqual(current.cases.find((candidate) => candidate.id === entry.id), expected, entry.id);
  }
  const added = current.cases.filter((entry) => !previous.cases.some((candidate) => candidate.id === entry.id));
  assert.equal(added.filter((entry) => entry.group === "cuentas-plataforma").length, 16);
  assert.equal(added.filter((entry) => entry.group === "identidad").length, 20);
  assert.deepEqual(added.map((entry) => entry.viewport.width), Array.from({ length: 18 }, () => [1440, 390]).flat());
  for (const entry of added) assert.match(entry.note, /El tablero no tiene Tweak/);
  const boards = new Set(added.map((entry) => entry.board));
  for (const board of ["Cuentas", "M-Cuentas", "Cuenta-Plat", "M-Cuenta-Plat", "Cuenta", "M-Cuenta", "M-Mas-Personal", "M-WA-Menu", "Pagina-Publica", "M-Pagina-Publica"]) assert.ok(boards.has(board), board);
});

test("las variantes mantienen Phone principal, respaldo verificado y ausencia de máscara para Phone secundario", async () => {
  const manifest = await buildManifest();
  for (const entry of manifest.cases.filter((entry) => /^n2-ficha-phone-/.test(entry.id))) {
    const account = entry.app.responses[0].body;
    assert.equal(account.maskedPrimaryPhone, "•••• 4521");
    assert.ok(account.loginMethods.some((method) => method.type === "Phone" && method.isPrimary && method.verifiedAtUtc));
    assert.ok(account.loginMethods.some((method) => method.type === "Email" && !method.isPrimary && method.verifiedAtUtc));
  }
  for (const entry of manifest.cases.filter((entry) => /^n2-ficha-email-principal/.test(entry.id))) {
    const account = entry.app.responses[0].body;
    assert.equal(account.maskedPrimaryPhone, null);
    assert.ok(account.loginMethods.some((method) => method.type === "Email" && method.isPrimary));
    assert.ok(account.loginMethods.some((method) => method.type === "Phone" && !method.isPrimary));
  }
  const business = manifest.cases.find((entry) => entry.id === "n3-menu-empresa-phone-sin-nombre-desktop");
  const me = business.app.responses.find((response) => response.path === "/api/me").body;
  assert.equal(me.maskedPrimaryPhone, "•••• 4521"); assert.equal(me.displayName, null);
  assert.equal(me.email, "lucia.fernandez@delta.ejemplo.com");
  assert.equal(me.access, "business");
  const mobile = manifest.cases.find((entry) => entry.id === "n3-menu-personal-phone-sin-nombre-mobile");
  assert.equal(mobile.board, "M-Mas-Personal"); assert.deepEqual(mobile.boardActions, []);
  assert.equal(new URL(mobile.app.path, "https://example.test").searchParams.get("route"), "/mas");
});

test("la fuente sale del commit aprobado y rechaza referencias al WIP", () => {
  assert.throws(() => prepareCanvasSource("HEAD"), /revisión aprobada/);
  const source = prepareCanvasSource();
  assert.ok(source.includes(canvasRevision));
  for (const board of ["Cuenta-Plat", "M-Cuenta-Plat", "Criterio-Decisiones"]) {
    const actual = readFileSync(path.join(source, `${board}.dc.html`), "utf8").replaceAll("\r\n", "\n");
    const published = execFileSync("git", ["show", `${canvasRevision}:docs/design/lienzo/${board}.dc.html`], { cwd: root, encoding: "utf8" }).replaceAll("\r\n", "\n");
    assert.equal(actual, published);
  }
});

test("preparar el manifiesto en otra carpeta no relabela las capturas históricas ni acredita PNG nuevos", () => {
  const historical = path.join(root, "docs/design/capturas/etapa-8");
  const oldManifest = readFileSync(path.join(historical, "manifest.json"));
  const oldIndex = readFileSync(path.join(historical, "index.html"));
  const folder = mkdtempSync(path.join(root, ".local", "e8-n2-n3-gallery-test-"));
  execFileSync(process.execPath, [path.join(root, "scripts/capturar-etapa-8.mjs"), "--manifiesto", "--output", folder], { cwd: root });
  const file = path.join(folder, "manifest.json");
  assert.equal(validateManifest(file, prepareCanvasSource()).length, 144);
  assert.deepEqual(readdirSync(folder), ["manifest.json"]);
  assert.deepEqual(writeGallery(folder), { captured: 0, total: 144 });
  const html = readFileSync(path.join(folder, "index.html"), "utf8");
  assert.ok(html.includes("0/144 casos completos")); assert.ok(html.includes("Cuentas de Plataforma"));
  assert.ok(html.includes("El tablero no tiene Tweak"));
  assert.deepEqual(readFileSync(path.join(historical, "manifest.json")), oldManifest);
  assert.deepEqual(readFileSync(path.join(historical, "index.html")), oldIndex);
});

test("sólo el 5xx declarado para la acción exacta es un error de captura esperado", () => {
  const responses = [{ method: "POST", path: "/api/auth/deletion/cancel", status: 503 }];
  assert.equal(expectedServerFailure(responses, "POST", "/api/auth/deletion/cancel", 503), true);
  for (const [method, path, status] of [["GET", "/api/auth/deletion/cancel", 503], ["POST", "/api/auth/deletion/cancel", 500], ["POST", "/api/me", 503], ["POST", "/api/auth/deletion/cancel", 403]]) {
    assert.equal(expectedServerFailure(responses, method, path, status), false);
  }
});
