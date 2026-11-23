// Uso: node .local/galeria-base-12/ver-tablero.mjs <Tablero> '<props JSON>' <salida.png> [entero]
// Fotografía un tablero del lienzo en un estado, como lo abre capturar-etapa.mjs, y deja su texto visible en <salida>.txt.
// Con «entero», la foto es de toda la página (la portada mide más que la pantalla).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { boardWidth, canvas, openBoard, startCanvasServer, viewports } from "../../scripts/capturar-etapa.mjs";

const [board, propsText = "{}", out, mode] = process.argv.slice(2);
if (!board || !out) throw new Error("Uso: ver-tablero.mjs <Tablero> '<props JSON>' <salida.png> [entero]");
const viewport = boardWidth(path.join(canvas, `${board}.dc.html`)) === viewports.phone.width ? viewports.phone : viewports.desktop;
const server = await startCanvasServer();
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: "es-AR" });
  const page = await openBoard(context, server.url, { board, props: JSON.parse(propsText) });
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  await page.screenshot({ path: out, fullPage: mode === "entero" });
  writeFileSync(out.replace(/\.png$/, ".txt"), await page.locator("body").innerText(), "utf8");
  console.log(out);
} finally {
  await browser.close();
  await server.close();
}
