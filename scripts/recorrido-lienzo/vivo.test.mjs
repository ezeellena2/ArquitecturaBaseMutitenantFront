import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { loadCases } from "./casos.mjs";
import { startLiveServer } from "./servidor.mjs";
import { openLiveView } from "./vista.mjs";
import { ensureVite } from "./vite.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("reproduce el código de recuperación escribiendo en campos con etiqueta, en compu y teléfono", { timeout: 30_000 }, async () => {
  const cases = [
    { id: "prueba/codigo-escritorio", device: "Compu", board: "Recuperar", viewport: { width: 1440, height: 900 } },
    { id: "prueba/codigo-movil", device: "Teléfono", board: "M-Recuperar", viewport: { width: 390, height: 844 } },
  ].map((item) => ({ ...item, etapa: "prueba", pair: "codigo", boardViewport: item.viewport,
    props: { paso: "2. Un correo o WhatsApp nuevo", whatsapp: "Sin WhatsApp (hasta la Etapa 8)" },
    boardActions: [
      { type: "fill", name: "Correo electrónico nuevo", value: "lucia.fer@gmail.com" },
      { type: "click", role: "button", name: "Enviar código" },
    ],
    app: { path: "about:blank", responses: [], actions: [] },
  }));
  // Esta prueba verifica solo el tablero: la ruta de la app todavía no se programó.
  const viteUrl = "about:blank";
  const live = await startLiveServer({ cases, viteUrl });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext({ viewport: { width: 1800, height: 1000 }, locale: "es-AR" });
    const pageErrors = [];
    context.on("page", (page) => page.on("pageerror", (error) => pageErrors.push(error.message)));
    for (const item of cases) {
      const page = await openLiveView(context, { url: live.url, cases, viteUrl, initial: item.id });
      const board = page.frameLocator("iframe[title='Tablero']");
      await board.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor({ timeout: 5_000 });
      assert.equal(await board.getByText("lucia.fer@gmail.com", { exact: true }).count(), 1);
      assert.equal(await board.getByRole("group", { name: "Código", exact: true }).count(), 1);
      assert.deepEqual(pageErrors, []);
      await page.close();
    }
  } finally {
    await browser.close();
    await live.close();
  }
});

test("muestra el tablero al lado de la app con sus datos de prueba y cambia a teléfono", { timeout: 180_000 }, async () => {
  const cases = loadCases(path.join(root, "docs/design/capturas"), path.join(root, "docs/design/lienzo"));
  const vite = await ensureVite("http://localhost:5199", root);
  const live = await startLiveServer({ cases, viteUrl: vite.url });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext({ viewport: { width: 1800, height: 1000 }, locale: "es-AR" });
    const page = await openLiveView(context, { url: live.url, cases, viteUrl: vite.url, initial: "etapa-6/usuarios-lista-escritorio" });

    await page.getByRole("heading", { level: 1, name: "usuarios-lista" }).waitFor();
    const app = page.frameLocator("iframe[title='App']");
    // Datos del manifiesto: la lista de Usuarios con Tomás Acosta, que no existe sin los datos de prueba.
    await app.getByText("Tomás Acosta").first().waitFor({ timeout: 60_000 });
    await page.frameLocator("iframe[title='Tablero']").getByText("Tomás Acosta").first().waitFor({ timeout: 30_000 });
    // La app sale del servidor de Vite con su cliente de recarga: un cambio del código llega solo a la ventana.
    assert.equal(await app.locator("script[src='/@vite/client']").count(), 1);

    await page.getByRole("button", { name: "Teléfono" }).click();
    await app.getByRole("navigation", { name: "Secciones" }).waitFor({ timeout: 60_000 });
    assert.equal(await page.getByRole("button", { name: "Teléfono" }).getAttribute("aria-pressed"), "true");

    // Las acciones del caso (abrir «Invitar usuario») se hacen solas, también en la compu, donde la app se ve achicada.
    await page.getByRole("combobox", { name: "Pantalla" }).selectOption("etapa-6/usuarios-invitar");
    await page.getByRole("button", { name: "Compu" }).click();
    await app.getByRole("dialog", { name: "Invitar usuario" }).waitFor({ timeout: 60_000 });

    // Una tanda de la consolidación que escribe en un campo del tablero: aparece «Cambios sin guardar» en los dos.
    await page.getByRole("combobox", { name: "Pantalla" }).selectOption("consolidacion/f7/configuracion-cambios-sin-guardar");
    await page.frameLocator("iframe[title='Tablero']").getByText("Cambios sin guardar").first().waitFor({ timeout: 30_000 });
    await app.getByText("Cambios sin guardar").first().waitFor({ timeout: 60_000 });
  } finally {
    await browser.close();
    await live.close();
    await vite.close();
  }
});
