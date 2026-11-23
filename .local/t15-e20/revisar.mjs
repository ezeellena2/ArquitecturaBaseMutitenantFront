// Uso: node .local/t15-e20/revisar.mjs <Tablero,Tablero…> [<carpeta de fotos>] [<estado>]
// Abre cada tablero en cada estado, junta los errores de consola y, con carpeta, saca una foto por estado.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { boardChoices, boardWidth, canvas, openBoard, startCanvasServer, viewports } from "../../scripts/capturar-etapa.mjs";

const [lista, out, soloEstado] = process.argv.slice(2);
const server = await startCanvasServer();
const browser = await chromium.launch({ headless: true, channel: "chrome" });
let errores = 0;
try {
  for (const board of lista.split(",")) {
    const file = path.join(canvas, `${board}.dc.html`);
    const viewport = boardWidth(file) === viewports.phone.width ? viewports.phone : viewports.desktop;
    const estados = soloEstado ? [soloEstado] : boardChoices(file).estado ?? [undefined];
    for (const estado of estados) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: "es-AR" });
      const msgs = [];
      context.on("page", (p) => {
        p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) msgs.push(m.text()); });
        p.on("pageerror", (e) => msgs.push(String(e)));
        p.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) msgs.push(`${r.status()} ${r.url()}`); });
      });
      const page = await openBoard(context, server.url, { board, props: estado ? { estado } : {} });
      const fallos = await page.evaluate(() => [...document.querySelectorAll("*")].filter((n) => /\{\{\w+\}\}/.test(n.childNodes[0]?.nodeValue ?? "")).length);
      if (fallos) msgs.push(`${fallos} nodos con {{…}} sin resolver`);
      if (out) {
        mkdirSync(out, { recursive: true });
        await page.screenshot({ path: path.join(out, `${board}--${(estado ?? "base").replace(/[^\wáéíóúñÁÉÍÓÚÑ-]+/g, "_")}.png`), fullPage: true });
      }
      if (msgs.length) { errores += msgs.length; console.log(`${board} · ${estado}: ${msgs.join(" | ").slice(0, 400)}`); }
      await context.close();
    }
    console.log(`${board}: ${estados.length} estados`);
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(errores ? `${errores} errores` : "sin errores");
