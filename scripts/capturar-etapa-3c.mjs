import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertCapturedPairs, capturePaths, installApiMocks, otpMaskStyle, startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "docs/design/capturas/etapa-3c");
const manifestFile = path.join(output, "manifest.json");
const invitationToken = "captura-sintetica";
const organizationId = "11111111-1111-4111-8111-111111111111";
const basePreview = {
  state: "NoAccount", organizationId, organizationName: "Empresa E2E",
  email: "marta.ruiz@example.test", inviterName: "Lucía Fernández",
  issuedAtUtc: "2026-09-30T12:00:00Z", expiresAtUtc: "2026-10-07T12:00:00Z",
  canUseEmailCode: false, canUseGoogle: false, needsPersonalLoginMethod: false,
};

const states = [
  { id: "sin-cuenta", boardState: "Sin cuenta", preview: { state: "NoAccount" }, fixture: "visual-personal" },
  { id: "cuenta-sin-sesion", boardState: "Con cuenta y sin sesión", preview: { state: "SignInRequired", canUseEmailCode: true, canUseGoogle: true }, fixture: "visual-personal" },
  { id: "sesion-propia", boardState: "Con la sesión de la misma persona", preview: { state: "Ready", canUseEmailCode: true }, fixture: "visual-business" },
  { id: "sesion-ajena", boardState: "Con la sesión de otra persona", preview: { state: "WrongSession", currentAccountEmail: "lucia@example.test" }, fixture: "visual-personal" },
  { id: "vencida", boardState: "Vencida", preview: { state: "Expired" }, fixture: "visual-personal" },
  { id: "ya-no-sirve", boardState: "Ya no sirve", preview: { state: "Invalid" }, fixture: "visual-personal" },
  { id: "organizacion-suspendida", boardState: "Organización suspendida", preview: { state: "OrganizationSuspended" }, fixture: "visual-personal" },
  { id: "aceptada-sin-metodo-personal", boardState: "Aceptada: solo con el correo de la empresa", preview: { state: "Accepted", needsPersonalLoginMethod: true }, fixture: "visual-personal" },
];

const cases = [];
for (const scenario of states) {
  for (const width of [1440, 390]) {
    const params = new URLSearchParams({ as: scenario.fixture, route: `/invitacion#${invitationToken}` });
    cases.push({
      id: `${scenario.id}-${width === 390 ? "movil" : "escritorio"}`, pair: scenario.id, group: "estados",
      board: `${width === 390 ? "M-" : ""}Invitacion`, props: { estado: scenario.boardState },
      viewport: { width, height: width === 390 ? 844 : 900 },
      app: { path: `/src/test/visualApp.html?${params}`, captureMode: "harness", responses: [
        { method: "GET", path: "/api/auth/external/google/antiforgery", body: { requestToken: "capture-antiforgery" } },
        { method: "POST", path: "/api/invitations/preview", body: { ...basePreview, ...scenario.preview } },
        { method: "POST", path: "/api/invitations/accept", body: { organizationId, createdAccount: true, needsPersonalLoginMethod: true } },
      ] },
    });
  }
}

for (const id of ["carga", "envio", "error"]) {
  for (const width of [1440, 390]) {
    const params = new URLSearchParams({ as: "visual-personal", route: `/invitacion#${invitationToken}` });
    cases.push({
      id: `${id}-${width === 390 ? "movil" : "escritorio"}`, pair: id, group: "acciones",
      board: `${width === 390 ? "M-" : ""}Invitacion`, props: { estado: "Sin cuenta" },
      viewport: { width, height: width === 390 ? 844 : 900 },
      app: { path: `/src/test/visualApp.html?${params}`, captureMode: "harness", action: id, responses: [
        { method: "GET", path: "/api/auth/external/google/antiforgery", body: { requestToken: "capture-antiforgery" } },
        { method: "POST", path: "/api/invitations/preview", body: basePreview },
        { method: "POST", path: "/api/invitations/accept", status: 500, body: { code: "Invitations.Invitation.Unavailable", detail: "No pudimos aceptar la invitación. Probá de nuevo." } },
      ] },
      note: "El lienzo no dibuja carga, envío ni error de red; se conserva su estado estable como referencia y se fotografía el estado transitorio real de la app.",
    });
  }
}

for (const [variant, suffix] of [["sin-codigo", "sin-codigo"], ["con-codigo", "con-codigo"]]) {
  for (const [culture, cultureCode] of [["es", "es-AR"], ["en", "en-US"]]) {
    for (const width of [1440, 390]) {
      const id = `correo-${variant}-${culture}-${width === 390 ? "movil" : "escritorio"}`;
      cases.push({
        id, pair: `correo-${variant}-${culture}`, group: "correos", board: "Mensajes",
        props: { mensaje: "Invitación a una organización", canal: "Correo" },
        viewport: { width, height: width === 390 ? 844 : 900 }, email: true,
        note: "El correo de invitación HTML lo genera el renderer real. El tablero de Mensajes es la referencia estática en español; el caso inglés y el ancho móvil se verifican sobre el mismo HTML traducido.",
        app: { path: `/docs/design/capturas/etapa-3c/correos/html/invitacion-${cultureCode}-${suffix}.html` },
      });
    }
  }
}

mkdirSync(output, { recursive: true });
writeFileSync(manifestFile, JSON.stringify({ version: 1, cases }, null, 2) + "\n");
validateManifest(manifestFile, path.join(root, "docs/design/lienzo"));

async function capture(browser, canvasUrl, appUrl, entry) {
  const files = capturePaths(output, entry);
  mkdirSync(path.dirname(files.app), { recursive: true });
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR", ignoreHTTPSErrors: true });
  try {
    const board = await context.newPage();
    await board.goto(`${canvasUrl}/${entry.board}.dc.html`, { waitUntil: "domcontentloaded" });
    await board.waitForFunction(() => typeof window.__dcSetProps === "function");
    await board.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), entry.props);
    await board.locator("[data-sc-name]").first().waitFor();
    await board.addStyleTag({ content: '@font-face { font-family: Inter; src: url("/_fonts/inter-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; }' + otpMaskStyle });
    await board.evaluate(() => document.fonts.ready);

    if (entry.email) {
      await board.locator(".plantilla").screenshot({ path: files.board });
      await context.route("https://ejemplo.com/favicon.svg", (route) => route.fulfill({ contentType: "image/svg+xml", body: readFileSync(path.join(root, "public/favicon.svg")) }));
      const app = await context.newPage();
      await app.goto(new URL(entry.app.path, appUrl).href, { waitUntil: "domcontentloaded" });
      await app.locator("table").nth(1).screenshot({ path: files.app });
      return;
    }

    await board.screenshot({ path: files.board });
    await installApiMocks(context, entry.app.responses, "visual-personal");
    if (entry.app.action === "carga") {
      await context.route("**/api/auth/external/google/antiforgery", () => new Promise(() => {}));
    }
    const app = await context.newPage();
    await app.goto(new URL(entry.app.path, appUrl).href, { waitUntil: "domcontentloaded" });
    if (entry.app.action === "carga") {
      await app.getByRole("status").waitFor();
    } else {
      const previewState = entry.app.responses.find((response) => response.path === "/api/invitations/preview")?.body.state;
      const expectedHeading = {
        NoAccount: "Te sumás a Empresa E2E",
        SignInRequired: "Te sumás a Empresa E2E",
        Ready: "Te sumás a Empresa E2E",
        WrongSession: "Te sumás a Empresa E2E",
        Expired: "Esta invitación venció",
        Invalid: "Esta invitación ya no sirve",
        OrganizationSuspended: "Empresa E2E no está disponible",
        Accepted: "Te sumaste a Empresa E2E",
      }[previewState];
      if (!expectedHeading) throw new Error(`Estado de invitación visual desconocido: ${previewState}`);
      await app.getByRole("heading", { name: expectedHeading }).waitFor();
      if (entry.app.action === "envio" || entry.app.action === "error") {
        await app.getByRole("checkbox", { name: /Términos y la Política de privacidad/ }).check();
        if (entry.app.action === "envio") {
          await context.route("**/api/invitations/accept", () => new Promise(() => {}));
          await app.getByRole("button", { name: "Aceptar invitación" }).click();
          await app.getByRole("button", { name: "Aceptando…" }).waitFor();
        } else {
          await app.getByRole("button", { name: "Aceptar invitación" }).click();
          await app.getByText("No pudimos aceptar la invitación. Probá de nuevo.").waitFor();
        }
      }
    }
    await app.evaluate(() => document.fonts.ready);
    await app.addStyleTag({ content: otpMaskStyle });
    await app.screenshot({ path: files.app });
  } finally { await context.close(); }
}

if (process.argv.includes("--verify")) {
  assertCapturedPairs(cases, output);
  console.log(`${cases.length} pares visuales 3c completos.`);
} else if (process.argv.includes("--manifest-only")) {
  console.log(`Manifest 3c válido: ${cases.length} pares visuales.`);
} else {
  const appArg = process.argv.indexOf("--app-url");
  if (appArg < 0 || !process.argv[appArg + 1]) throw new Error("Indicá --app-url del servidor Vite visual.");
  const filterArg = process.argv.indexOf("--id");
  const filter = filterArg >= 0 ? process.argv[filterArg + 1] : null;
  const browser = await chromium.launch({ headless: true });
  const canvas = await startCanvasServer(path.join(root, "docs/design/lienzo"));
  try {
    for (const entry of cases.filter((item) => !filter || item.pair === filter)) {
      await capture(browser, canvas.url, process.argv[appArg + 1], entry);
      console.log(`${entry.id}: lienzo + app`);
    }
  } finally { await canvas.close(); await browser.close(); }
}
