// Galería local, sin servidor ni librerías nuevas. Lee las imágenes reales producidas por capturar-etapa-7.
// node scripts/generar-galeria-etapa-7.mjs [--out docs/design/capturas/etapa-7]
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const defaultOutput = path.join(root, "docs/design/capturas/etapa-7");
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const groups = { landing: "Landing", directorio: "Directorio", "pagina-publica": "Página pública" };
const present = (file) => existsSync(file) && statSync(file).size > 0;

export function writeGallery(outputRoot = defaultOutput) {
  const manifest = JSON.parse(readFileSync(path.join(outputRoot, "manifest.json"), "utf8"));
  const cases = [...manifest.cases, ...(manifest.supplementalCases ?? [])];
  const entries = cases.map((entry) => {
    // Solo rutas locales del catálogo; el generador también se puede invocar directamente después de capturar.
    if (!/^[a-z0-9-]+$/.test(entry.id) || !(entry.group in groups)
      || !["1440x900", "390x844"].includes(`${entry.viewport?.width}x${entry.viewport?.height}`)) throw new Error(`Caso de galería inválido: ${entry.id}`);
    const stem = `${entry.group}/${entry.id}-${entry.viewport.width}x${entry.viewport.height}`;
    const files = { board: `${stem}-lienzo.png`, app: `${stem}-app.png`, pair: `${stem}-lado-a-lado.png` };
    return { entry, files, captured: Object.values(files).every((file) => present(path.join(outputRoot, file))) };
  });
  const captured = entries.filter((entry) => entry.captured).length;
  const articles = entries.map(({ entry, files, captured: complete }) => `<article id="${escape(entry.id)}" data-group="${escape(entry.group)}" data-size="${entry.viewport.width}" data-search="${escape(`${entry.label} ${entry.id} ${entry.board}`.toLocaleLowerCase("es"))}">
      <div class="case-title"><h2>${escape(groups[entry.group])} · ${escape(entry.label)}</h2><span>${entry.viewport.width} × ${entry.viewport.height}${entry.captureExtent === "page" ? " · página completa" : ""}</span></div>
      <p class="board">${escape(entry.board)} · ${escape(entry.id)}</p>
      ${complete ? `<a class="comparison" href="${escape(files.pair)}"><img loading="lazy" src="${escape(files.pair)}" alt="${escape(`${entry.board}: tablero a la izquierda y app a la derecha, ${entry.label}`)}"></a>
      <p class="links"><a href="${escape(files.pair)}">Ampliar comparación</a><a href="${escape(files.board)}">Tablero</a><a href="${escape(files.app)}">App</a></p>` : '<p class="pending">Pendiente de captura completa</p>'}
    </article>`).join("\n");
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Etapa 7 · Galería final</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f8f6f2;color:#292522;font:16px/1.5 system-ui,sans-serif}header,main{max-width:1480px;margin:auto;padding:24px}h1{font-size:28px;line-height:1.2;margin:0 0 12px}h2{font-size:18px;line-height:1.35;margin:0}p{margin:8px 0}a{color:#146463;text-underline-offset:3px}a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #146463;outline-offset:3px}.intro{max-width:85ch;color:#625a54}.filters{display:flex;flex-wrap:wrap;gap:16px;margin-top:20px}.filters label{display:flex;flex-direction:column;gap:4px;font-size:14px;font-weight:600}input,select{min-height:44px;padding:8px 12px;border:1px solid #b8afa5;border-radius:8px;background:#fff;color:inherit;font:inherit}input{min-width:250px}article{margin:0 0 24px;padding:20px;background:#fff;border:1px solid #ddd5cb;border-radius:12px;scroll-margin-top:20px}.case-title{display:flex;gap:16px;align-items:baseline;justify-content:space-between;flex-wrap:wrap}.case-title span,.board{color:#6d655e;font-size:14px}.comparison{display:block;margin-top:16px}.comparison img{display:block;width:100%;height:auto;border:1px solid #ddd5cb}.links{display:flex;gap:20px;flex-wrap:wrap;margin-top:12px}.pending{padding:24px;background:#f8f6f2;border-radius:8px}article[hidden]{display:none}.skip{position:absolute;left:16px;top:-80px;background:#fff;padding:12px}.skip:focus{top:12px}#empty{padding:24px}@media(max-width:600px){header,main{padding:16px}.filters label,input,select{width:100%}article{padding:12px}h1{font-size:24px}}
</style></head><body><a class="skip" href="#cases">Ir a las comparaciones</a><header>
<h1>Etapa 7 · Galería final</h1><p>${captured} de ${cases.length} casos completos · ${escape(manifest.canvasVersion)} · <a href="comparacion.md">Informe de comparación</a> · <a href="manifest.json">Manifiesto</a></p>
<p class="intro">Tablero vigente a la izquierda, app a la derecha. Los estados de Landing, Directorio y Página pública incluyen sus menús. Los mocks se usan solo para estas capturas; el recorrido E2E se verifica por separado contra la API real.</p>
<div class="filters"><label>Pantalla<select id="group"><option value="">Todas</option>${Object.entries(groups).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label><label>Tamaño<select id="size"><option value="">Ambos</option><option value="1440">Escritorio · 1440 × 900</option><option value="390">Teléfono · 390 × 844</option></select></label><label>Buscar estado<input id="search" type="search" placeholder="Nombre del estado o tablero"></label></div><p id="count" role="status" aria-live="polite">${cases.length} comparaciones</p></header>
<main id="cases">${articles}<p id="empty" hidden>Ninguna comparación coincide con el filtro.</p></main>
<script>
const group=document.querySelector('#group'),size=document.querySelector('#size'),search=document.querySelector('#search');
function filter(){let count=0;for(const article of document.querySelectorAll('article')){const visible=(!group.value||article.dataset.group===group.value)&&(!size.value||article.dataset.size===size.value)&&article.dataset.search.includes(search.value.trim().toLocaleLowerCase('es'));article.hidden=!visible;if(visible)count++;}document.querySelector('#count').textContent=count+' comparaciones';document.querySelector('#empty').hidden=count!==0;}
for(const control of [group,size,search])control.addEventListener('input',filter);
</script></body></html>\n`;
  const file = path.join(outputRoot, "galeria.html");
  writeFileSync(file, html);
  return { file, captured, total: cases.length };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf("--out");
  const outputRoot = index < 0 ? defaultOutput : path.resolve(root, process.argv[index + 1]);
  const result = writeGallery(outputRoot);
  console.log(`Galería: ${result.captured}/${result.total} casos completos en ${result.file}`);
}
