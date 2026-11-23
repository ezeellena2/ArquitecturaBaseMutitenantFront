import { chromium } from "playwright";
import { openBoard, startCanvasServer, viewports } from "../../scripts/capturar-etapa.mjs";
const [board, estado, sel] = process.argv.slice(2);
const server = await startCanvasServer();
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext({ viewport: viewports.desktop, deviceScaleFactor: 1 });
const page = await openBoard(context, server.url, { board, props: { estado } });
const r = await page.evaluate((sel) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => {
  const b = e.getBoundingClientRect();
  const cs = getComputedStyle(e);
  return { cls: e.className, x: Math.round(b.x), w: Math.round(b.width), sw: e.scrollWidth, wrap: cs.flexWrap, gap: cs.columnGap, kids: [...e.children].map(k => [k.textContent.trim().slice(0, 24), Math.round(k.getBoundingClientRect().width), Math.round(k.getBoundingClientRect().y)]) };
}), sel);
console.log(JSON.stringify(r, null, 1));
await browser.close(); await server.close();
