// Uso: node .local/t15-e19-e21/ver.mjs <salida> <Tablero>[:Estado1|Estado2] ...
// Abre cada tablero en cada estado (todos si no se dicen), junta los errores de consola y deja una foto y el texto.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { boardChoices, boardWidth, canvas, openBoard, startCanvasServer, viewports } from "../../scripts/capturar-etapa.mjs";

const [out, ...boards] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const server = await startCanvasServer();
const browser = await chromium.launch({ headless: true, channel: "chrome" });
let errores = 0;
try {
  for (const spec of boards) {
    const c = spec.indexOf(":"); const [board, lista] = c < 0 ? [spec, ""] : [spec.slice(0, c), spec.slice(c + 1)];
    const file = path.join(canvas, `${board}.dc.html`);
    const viewport = boardWidth(file) === viewports.phone.width ? viewports.phone : viewports.desktop;
    const choices = boardChoices(file);
    const clave = Object.keys(choices).find(k => k === "estado") ?? Object.keys(choices)[0];
    const estados = lista ? lista.split("|") : choices[clave];
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: "es-AR" });
    for (const [i, estado] of estados.entries()) {
      const fallas = [];
      context.removeAllListeners("page");
      context.on("page", p => { p.on("pageerror", e => fallas.push("pageerror: " + e.message)); p.on("response", r => { if (r.status() >= 400 && !r.url().endsWith("/favicon.ico")) fallas.push("http " + r.status() + " " + r.url()); }); p.on("console", m => { if (m.text().startsWith("Failed to load resource")) return; if (m.type() === "error") fallas.push("console: " + m.text()); }); });
      const page = await openBoard(context, server.url, { board, props: { [clave]: estado } });
      const nombre = path.join(out, `${board}-${String(i).padStart(2, "0")}`);
      if (!process.env.SIN_FOTO) await page.screenshot({ path: nombre + ".png", fullPage: true });
      writeFileSync(nombre + ".txt", estado + "\n" + await page.locator("body").innerText(), "utf8");
      if (fallas.length) { errores++; console.log("ERROR", board, estado, fallas.join(" | ")); }
      await page.close();
    }
    console.log(board, estados.length, "estados");
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(errores ? errores + " con errores" : "sin errores");
