// Captura cada tablero que usa la guía, desde el lienzo servido en http://localhost:8815 (ver README.md).
// Uso: node docs/design/guia/capturar.mjs <carpeta de salida>  (lee <salida>/capturar.json y deja <salida>/png/*.png)
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(raiz, 'package.json'));
const { chromium } = require('playwright');
const salida = process.argv[2];
const lista = JSON.parse(fs.readFileSync(path.join(salida, 'capturar.json'), 'utf8'));
fs.mkdirSync(path.join(salida, 'png'), { recursive: true });
const navegador = await chromium.launch({ channel: 'chrome' });
let errores = 0;
for (const { t, w, h } of lista) {
  // Los tableros altos (la portada, los mensajes) se capturan hasta 2200 de alto.
  const alto = Math.min(h, 2200);
  const pagina = await navegador.newPage({ viewport: { width: w, height: Math.min(alto, 900) } });
  pagina.on('pageerror', (e) => { errores++; console.log('error en', t, e.message); });
  await pagina.goto(`http://localhost:8815/${t}.dc.html?v=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
  await pagina.waitForTimeout(500);
  if (alto > 900) await pagina.setViewportSize({ width: w, height: alto });
  await pagina.screenshot({ path: path.join(salida, 'png', `${t}.png`), clip: { x: 0, y: 0, width: w, height: alto } });
  await pagina.close();
}
console.log('capturas', lista.length, 'errores', errores);
await navegador.close();
