// Vista en vivo de una pantalla mientras se programa: en una ventana de Chrome, su tablero validado al lado de la app con
// datos de prueba. La app sale del servidor de Vite, así que cada cambio del código se ve solo, sin tocar nada.
//
// Uso: node scripts/recorrido-lienzo/vivo.mjs [<etapa>/<caso>]
//        por ejemplo etapa-6/usuarios-lista-escritorio; la pantalla también se elige en la ventana.
//      node scripts/recorrido-lienzo/vivo.mjs --tablero <Tablero> --ruta </ruta> [--como visual-owner] [--telefono]
//        para una pantalla que todavía no tiene caso en un manifiesto de capturas.
// Usa Vite en http://localhost:5199 (--vite <url>); si no está prendido, lo prende y lo apaga al cerrar la ventana.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { adHocCase, loadCases } from "./casos.mjs";
import { startLiveServer } from "./servidor.mjs";
import { openLiveView } from "./vista.mjs";
import { ensureVite } from "./vite.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const valued = new Set(["--tablero", "--ruta", "--como", "--vite"].map((name) => option(name)));

let cases = loadCases(path.join(root, "docs/design/capturas"), path.join(root, "docs/design/lienzo"));
let initial = args.find((arg) => !arg.startsWith("--") && !valued.has(arg));
if (option("--tablero")) {
  const item = adHocCase({ board: option("--tablero"), route: option("--ruta"), as: option("--como"), phone: args.includes("--telefono") });
  cases = [item, ...cases];
  initial = item.id;
}
if (initial && !cases.some((item) => item.id === initial)) throw new Error(`No hay una pantalla «${initial}». Elegila en la ventana o usá --tablero.`);

const vite = await ensureVite(option("--vite") ?? "http://localhost:5199", root);
const live = await startLiveServer({ cases, viteUrl: vite.url });
console.log(`Vista en vivo: ${cases.length} pantallas. La app sale de ${vite.url}${vite.started ? " (prendido ahora)" : ""}.`);
console.log("Cerrá la ventana para terminar.");

const browser = await chromium.launch({ headless: false, channel: "chrome", args: ["--start-maximized"] });
const context = await browser.newContext({ viewport: null, locale: "es-AR" });
const page = await openLiveView(context, { url: live.url, cases, viteUrl: vite.url, initial });
await new Promise((resolve) => {
  browser.on("disconnected", resolve);
  page.on("close", () => { void browser.close(); });
});
await live.close();
await vite.close();
