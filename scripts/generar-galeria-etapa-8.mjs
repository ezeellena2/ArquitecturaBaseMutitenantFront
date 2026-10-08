// Índice de la comparación final del front E8; no declara la puerta real ni el cierre de la etapa.
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../docs/design/capturas/etapa-8");
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const groups = { ingreso: "Ingreso", registro: "Registro", "registro-empresa": "Registro de empresa", enlace: "Enlace", recuperar: "Recuperar", cuenta: "Mi cuenta" };

export function writeGallery(folder = output) {
  const manifest = JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8"));
  const cases = manifest.cases;
  let captured = 0;
  const articles = cases.map((entry) => {
    if (!/^[a-z0-9-]+$/.test(entry.id) || !(entry.group in groups)
      || !["1440x900", "390x844"].includes(`${entry.viewport.width}x${entry.viewport.height}`)) throw new Error(`Caso inválido: ${entry.id}`);
    const stem = `${entry.group}/${entry.id}-${entry.viewport.width}x${entry.viewport.height}`;
    const files = { board: `${stem}-lienzo.png`, app: `${stem}-app.png`, pair: `${stem}-lado-a-lado.png` };
    const complete = Object.values(files).every((file) => existsSync(path.join(folder, file)) && statSync(path.join(folder, file)).size > 0);
    if (complete) captured++;
    return `<article data-group="${entry.group}" data-size="${entry.viewport.width}" data-search="${escape(`${entry.label} ${entry.id}`.toLowerCase())}"><h2>${escape(groups[entry.group])} · ${escape(entry.label)}</h2><p>${escape(entry.board)} · ${entry.viewport.width} × ${entry.viewport.height}</p>${complete ? `<a href="${files.pair}"><img loading="lazy" src="${files.pair}" alt="${escape(entry.label)}: lienzo a la izquierda, app a la derecha"></a><p><a href="${files.board}">Lienzo</a> · <a href="${files.app}">App</a> · <a href="${files.pair}">Ampliar</a></p>` : '<p class="pending">Pendiente</p>'}</article>`;
  }).join("\n");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>E8 · Front · Comparación final</title><style>
*{box-sizing:border-box}body{margin:0;background:#f8f6f2;color:#292522;font:16px/1.5 system-ui}header,main{max-width:1480px;margin:auto;padding:24px}h1{font-size:28px}h2{font-size:18px}a{color:#146463}article{background:white;border:1px solid #ddd5cb;border-radius:12px;padding:20px;margin-bottom:24px}img{width:100%;height:auto;border:1px solid #ddd5cb}label{display:inline-flex;flex-direction:column;margin-right:16px}select,input{font:inherit;padding:8px;min-height:44px}a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #146463;outline-offset:3px}.pending{color:#a33}article[hidden]{display:none}@media(max-width:600px){header,main{padding:16px}label{display:flex;margin:12px 0}}
</style></head><body><header><h1>E8 · Front · Comparación final</h1><p>${captured}/${cases.length} casos completos · ${escape(manifest.canvasVersion)} · <a href="comparacion.md">Revisión y diferencias por ADR</a> · <a href="manifest.json">Manifiesto</a></p><p>Respuesta API simulada para comparar la interfaz. Integración, E2E y WhatsApp/Meta reales corresponden a T13–T14; E8 permanece abierta.</p><label>Pantalla<select id="group"><option value="">Todas</option>${Object.entries(groups).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label><label>Tamaño<select id="size"><option value="">Ambos</option><option value="1440">Escritorio</option><option value="390">Teléfono</option></select></label><label>Estado<input id="search" type="search"></label><p id="count" role="status" aria-live="polite">${cases.length} comparaciones</p></header><main>${articles}</main><script>
const group=document.querySelector('#group'),size=document.querySelector('#size'),search=document.querySelector('#search');function filter(){let count=0;for(const article of document.querySelectorAll('article')){const visible=(!group.value||article.dataset.group===group.value)&&(!size.value||article.dataset.size===size.value)&&article.dataset.search.includes(search.value.trim().toLowerCase());article.hidden=!visible;if(visible)count++;}document.querySelector('#count').textContent=count+' comparaciones';}for(const control of [group,size,search])control.addEventListener('input',filter);
</script></body></html>\n`;
  writeFileSync(path.join(folder, "index.html"), html);
  return { captured, total: cases.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(writeGallery(process.argv[2] ? path.resolve(process.argv[2]) : output));
