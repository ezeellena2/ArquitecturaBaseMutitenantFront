// La copia de partida de `acciones_asistente_1004.py`: el dibujo de los tableros de siempre (v176), ya armado por el lienzo,
// sin las marcas del motor (`data-dc-tpl`, `sc-interp`). Se corre una vez, desde la raíz del front:
//   node docs/design/lienzo/generadores/acciones_asistente_1004/capturar.mjs
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
  { nombre: "inicio", tablero: "Asistente-Org-25", props: { estado: "Pedido con un texto" }, sel: ".ab-root" },
  { nombre: "usuario", tablero: "Usuario", props: { usuario: "Tomás (activo)" }, sel: ".w-app" },
  { nombre: "rol_crear", tablero: "Rol", props: { modo: "Crear un rol" }, sel: ".w-app" },
  { nombre: "rol_editar", tablero: "Rol", props: { modo: "Editar el rol Recursos humanos" }, sel: ".w-app" },
  { nombre: "roles", tablero: "Roles", props: { estado: "Lista" }, sel: ".ab-root" },
  { nombre: "m_inicio", tablero: "M-Asistente-Org", props: { asistente: "Respuesta" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_usuario", tablero: "M-Usuario", props: { estado: "Editar usuario" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_rol_crear", tablero: "M-Rol", props: { estado: "Crear un rol" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_rol_editar", tablero: "M-Rol", props: { estado: "Editar el rol Recursos humanos" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_roles", tablero: "M-Roles", props: { estado: "Lista" }, sel: ".ap", w: 390, h: 844 },
  { nombre: "m_invitar", tablero: "M-Usuarios-Invitar", props: {}, sel: ".ap", w: 390, h: 844 },
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
