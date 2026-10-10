import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { chromium } from "playwright";
import { buildManifest, canvasRevision, expectedServerFailure, prepareCanvasSource } from "./capturar-etapa-8.mjs";
import { startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { openBoard } from "./capturar-relevamiento.mjs";
import { writeGallery } from "./generar-galeria-etapa-8.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

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

test("N2/N3 preservan las 108 definiciones históricas y añaden 36 comparaciones pertinentes", async () => {
  const previous = JSON.parse(execFileSync("git", ["show", "9e1e4b9c:docs/design/capturas/etapa-8/manifest.json"], { encoding: "utf8", cwd: root }));
  const current = await buildManifest();
  assert.equal(current.canvasVersion, "v116 · 21f227bc");
  assert.equal(current.canvasRevision, canvasRevision);
  assert.equal(previous.cases.length, 108); assert.equal(current.cases.length, 144);
  for (const entry of previous.cases) assert.deepEqual(current.cases.find((candidate) => candidate.id === entry.id), entry);
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
