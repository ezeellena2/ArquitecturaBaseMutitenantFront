// Recorrido visual del lienzo: sirve docs/design/lienzo tal cual (sin la app ni la API) y abre una ventana de Chrome
// que va página por página, tablero por tablero y estado por estado. Avanza solo con «Siguiente» o la flecha →, y
// recuerda dónde quedaste para retomar otro día.
//
// Uso: node scripts/recorrido-lienzo/recorrido.mjs [--desde-cero] [--con-archivo]
import { writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { startTourServer } from "./servidor.mjs";

// El avance se guarda fuera del repo, en la carpeta de la persona.
const progressFile = path.join(os.homedir(), ".recorrido-lienzo.json");
if (process.argv.includes("--desde-cero")) writeFileSync(progressFile, JSON.stringify({ index: 0 }));

const tour = await startTourServer({ progressFile, withArchive: process.argv.includes("--con-archivo") });
console.log(`Recorrido del lienzo: ${tour.steps.length} pasos en ${tour.steps.filter((step) => step.kind === "page").length} páginas.`);
console.log(`Abriendo ${tour.url}. Cerrá la ventana para terminar.`);

const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--start-maximized"] });
const context = await browser.newContext({ viewport: null, locale: "es-AR" });
const page = await context.newPage();
await page.goto(tour.url);
await new Promise((resolve) => {
  browser.on("disconnected", resolve);
  page.on("close", () => { void browser.close(); });
});
await tour.close();
