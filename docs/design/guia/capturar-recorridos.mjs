// Captura cada paso de los recorridos guiados (docs/design/recorridos/*.json) desde el lienzo servido en http://localhost:8815.
// Por paso: abre el tablero con sus Tweaks, hace lo de «antes» (llenar o tocar), mide el lugar a resaltar y saca la captura.
// Uso: node docs/design/guia/capturar-recorridos.mjs <carpeta de salida>  → <salida>/rec/<id>-<n>.png y <salida>/rec/cajas.json
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(raiz, 'package.json'));
const { chromium } = require('playwright');
const salida = path.join(process.argv[2], 'rec');
const carpeta = path.join(raiz, 'docs/design/recorridos');
const tableros = JSON.parse(fs.readFileSync(path.join(raiz, 'docs/design/lienzo/canvas.json'), 'utf8')).boards;
fs.mkdirSync(salida, { recursive: true });

const navegador = await chromium.launch({ channel: 'chrome' });
const cajas = {};
let errores = 0;
const faltan = [];
let pasos = 0;
for (const archivo of fs.readdirSync(carpeta).filter((f) => f.endsWith('.json')).sort()) {
  const rec = JSON.parse(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
  cajas[rec.id] = [];
  for (const [n, paso] of rec.pasos.entries()) {
    const b = tableros[`${paso.tablero}.dc.html`];
    if (!b) throw new Error(`${rec.id} paso ${n + 1}: no existe el tablero ${paso.tablero}`);
    const w = b.w;
    const h = Math.min(b.h, 900);
    const pagina = await navegador.newPage({ viewport: { width: w, height: h } });
    pagina.on('pageerror', (e) => { errores++; console.log('error en', rec.id, n + 1, e.message); });
    // Los Tweaks se fijan cambiando el valor por defecto de cada uno en data-props.
    await pagina.route(`**/${paso.tablero}.dc.html*`, async (r) => {
      const res = await r.fetch();
      let cuerpo = await res.text();
      for (const [k, v] of Object.entries(paso.tweaks || {})) {
        const re = new RegExp(`("${k}":\\{"editor":"enum","options":\\[[^\\]]*\\],"default":)"[^"]*"`);
        if (!re.test(cuerpo)) throw new Error(`${rec.id} paso ${n + 1}: ${paso.tablero} no tiene el Tweak ${k}`);
        cuerpo = cuerpo.replace(re, `$1${JSON.stringify(v)}`);
      }
      await r.fulfill({ response: res, body: cuerpo });
    });
    await pagina.goto(`http://localhost:8815/${paso.tablero}.dc.html?v=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
    await pagina.waitForTimeout(500);
    for (const [accion, selector, valor] of paso.antes || []) {
      const l = pagina.locator(selector).first();
      try {
        if (accion === 'clic') await l.click({ timeout: 3000 }); else await l.fill(valor, { timeout: 3000 });
      } catch {
        faltan.push(`${rec.id} paso ${n + 1}: no pude ${accion} «${selector}» en ${paso.tablero}`);
      }
      await pagina.waitForTimeout(300);
    }
    let caja = null;
    if (paso.resaltar) {
      const l = pagina.locator(paso.resaltar).first();
      if ((await l.count()) === 0) {
        faltan.push(`${rec.id} paso ${n + 1}: no encuentro «${paso.resaltar}» en ${paso.tablero}`);
      } else {
        await l.scrollIntoViewIfNeeded();
        await pagina.waitForTimeout(200);
        const bb = await l.boundingBox();
        caja = { x: Math.round(bb.x), y: Math.round(bb.y), w: Math.round(bb.width), h: Math.round(bb.height) };
      }
    }
    await pagina.screenshot({ path: path.join(salida, `${rec.id}-${n + 1}.png`) });
    cajas[rec.id].push({ w, h, caja });
    pasos++;
    await pagina.close();
  }
}
fs.writeFileSync(path.join(salida, 'cajas.json'), JSON.stringify(cajas, null, 1));
for (const f of faltan) console.log(f);
console.log('recorridos', Object.keys(cajas).length, 'pasos', pasos, 'errores', errores, 'faltan', faltan.length);
if (faltan.length || errores) process.exitCode = 1;
await navegador.close();
