// La copia de partida de `modulos_suscripciones_1004.py`: el dibujo de los tableros de siempre (v179), ya armado por el lienzo,
// sin las marcas del motor (`data-dc-tpl`, `sc-interp`). Se corre una vez, desde la raíz del front:
//   node docs/design/lienzo/generadores/modulos_suscripciones_1004/capturar.mjs
// y deja un `.html` por pieza en esta carpeta. El generador parte de esos archivos, así otra corrida da lo mismo aunque los
// tableros de siempre cambien después.
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const lienzo = path.resolve(aqui, "..", "..");
const PIEZAS = [
  // La compu: el marco de la organización y de Plataforma, con sus listas, su ficha, su configuración y sus estados.
  { nombre: "roles", tablero: "Roles", props: { estado: "Lista" }, sel: ".ab-root" },
  { nombre: "roles_menu", tablero: "Roles", props: { estado: "Menú de un rol con usuarios" }, sel: ".ab-root" },
  { nombre: "organizaciones", tablero: "Organizaciones", props: {}, sel: ".ab-root" },
  { nombre: "organizacion", tablero: "Organizacion", props: { pestana: "Módulos" }, sel: ".ab-root" },
  { nombre: "organizacion_suspendida", tablero: "Organizacion", props: { estado: "Suspendida", pestana: "Módulos" }, sel: ".ab-root" },
  { nombre: "organizacion_cerrada", tablero: "Organizacion", props: { estado: "Cerrada", pestana: "Módulos" }, sel: ".ab-root" },
  { nombre: "config_plat", tablero: "Config-Plat", props: { estado: "Con cambios" }, sel: ".ab-root" },
  { nombre: "config_plat_motivo", tablero: "Config-Plat", props: { estado: "Guardar: motivo" }, sel: ".ab-root" },
  { nombre: "config_plat_reauth", tablero: "Config-Plat", props: { estado: "Guardar: confirmá que sos vos" }, sel: ".ab-root" },
  { nombre: "config_plat_otra", tablero: "Config-Plat", props: { estado: "Otra persona cambió la configuración" }, sel: ".ab-root" },
  { nombre: "recuperaciones", tablero: "Recuperaciones", props: { caso: "Pedidos" }, sel: ".ab-root" },
  { nombre: "recuperaciones_revisar", tablero: "Recuperaciones", props: { caso: "Revisar un pedido" }, sel: ".ab-root" },
  { nombre: "legales_publicar", tablero: "Legales", props: { pantalla: "Publicar versión nueva" }, sel: ".ab-root" },
  { nombre: "mensajes", tablero: "Mensajes", props: { mensaje: "Exportación de datos lista" }, sel: ".msg-root" },
  { nombre: "mensajes_wa", tablero: "Mensajes", props: { mensaje: "Membresía terminada" }, sel: ".msg-root", clic: ".seg3 button:nth-child(2)" },
  // El teléfono.
  { nombre: "m_roles", tablero: "M-Roles", props: { estado: "Lista" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_catalogos_cargando", tablero: "M-FRM-Catalogos-14", props: { estado: "Cargando" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_catalogos_error", tablero: "M-FRM-Catalogos-14", props: { estado: "Error" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_catalogos_vacio", tablero: "M-FRM-Catalogos-14", props: { estado: "Vacío" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_error_org", tablero: "M-Error-Org", props: { caso: "Sin permiso (403)" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_organizaciones", tablero: "M-Organizaciones", props: {}, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_organizacion", tablero: "M-Organizacion", props: { estado: "Módulos" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_config_plat", tablero: "M-Config-Plat", props: { estado: "Con cambios" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_config_plat_motivo", tablero: "M-Config-Plat", props: { estado: "Guardar: motivo" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_recuperaciones", tablero: "M-Recuperaciones", props: {}, sel: ".ap", w: 390, h: 844 },
];
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  const p = path.join(lienzo, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": tipos[path.extname(p)] ?? "application/octet-stream" });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
for (const p of PIEZAS) {
  const page = await browser.newPage({ viewport: { width: p.w ?? 1440, height: p.h ?? 900 } });
  await page.goto(`${url}/${p.tablero}.dc.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof window.__dcSetProps === "function" && Boolean(window.__dcRootName?.()));
  await page.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), p.props);
  await page.locator("[data-sc-name]").first().waitFor();
  await page.waitForTimeout(400);
  if (p.clic) { await page.locator(p.clic).first().click(); await page.waitForTimeout(300); }
  const html = await page.evaluate((sel) => {
    const n = document.querySelector(sel);
    const c = n.cloneNode(true);
    // Lo que el motor pone como propiedad (lo tildado, lo escrito, lo apagado) pasa a atributo, para que la copia se vea igual.
    const orig = n.querySelectorAll("input, textarea");
    c.querySelectorAll("input, textarea").forEach((x, i) => {
      const o = orig[i];
      if (o.type === "checkbox" || o.type === "radio") { if (o.checked) x.setAttribute("checked", ""); else x.removeAttribute("checked"); }
      else if (x.tagName === "TEXTAREA") x.textContent = o.value;
      else x.setAttribute("value", o.value);
      if (o.disabled) x.setAttribute("disabled", "");
    });
    return c.outerHTML;
  }, p.sel);
  const limpio = html
    .replace(/​/g, "")
    .replace(/ data-dc-tpl="\d+"/g, "")
    .replace(/<span class="sc-interp">([^<]*)<\/span>/g, "$1");
  writeFileSync(path.join(aqui, p.nombre + ".html"), limpio + "\n");
  console.log(p.nombre, limpio.length);
  await page.close();
}
await browser.close();
server.close();
