// La copia de partida de los generadores `base2_*.py`: el dibujo de los tableros de siempre (v179), ya armado por el lienzo,
// sin las marcas del motor (`data-dc-tpl`, `sc-interp`). Se corre una vez, desde la raíz del front:
//   node docs/design/lienzo/generadores/base2_1004/capturar.mjs [pieza …]
// y deja un `.html` por pieza en esta carpeta. Los generadores parten de esos archivos, así otra corrida da lo mismo aunque los
// tableros de siempre cambien después. `clic` abre un diálogo o un menú antes de copiar, con el texto de su botón.
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const lienzo = path.resolve(aqui, "..", "..");
const T = (nombre, tablero, props = {}, extra = {}) => ({ nombre, tablero, props, ...extra });
const M = (nombre, tablero, props = {}, extra = {}) => ({ nombre, tablero, props, w: 390, h: 844, ...extra });
const PIEZAS = [
  // Roles (260 y 269)
  T("rol_rh", "Rol", { modo: "Editar el rol Recursos humanos" }),
  T("rol_crear", "Rol", { modo: "Crear un rol" }),
  T("rol_dueno", "Rol", { modo: "Ver el rol Dueño" }),
  M("m_rol_rh", "M-Rol", { estado: "Editar el rol Recursos humanos" }),
  M("m_rol_crear", "M-Rol", { estado: "Crear un rol" }),
  M("m_rol_dueno", "M-Rol", { estado: "Ver el rol Dueño" }),
  // Plataforma: operadores (260 y la entrega de su invitación)
  T("cplat_op", "Cuenta-Plat", { cuenta: "Operador" }),
  T("cplat_perm", "Cuenta-Plat", { cuenta: "Operador: cambiar permisos" }),
  T("cplat_inv", "Cuenta-Plat", { cuenta: "Invitación de operador pendiente" }),
  M("m_cplat_op", "M-Cuenta-Plat", { estado: "Operador" }),
  M("m_cplat_perm", "M-Cuenta-Plat", { estado: "Operador: cambiar permisos" }),
  M("m_cplat_inv", "M-Cuenta-Plat", { estado: "Invitación de operador pendiente" }),
  T("cuentas", "Cuentas"),
  T("cuentas_invitar", "Cuentas", {}, { clic: "Invitar operador" }),
  M("m_cuentas", "M-Cuentas"),
  // Usuarios y empresas (269 y la entrega de una invitación)
  T("usuarios", "Usuarios", { estado: "Lista" }),
  T("usuarios_invitar", "Usuarios", { estado: "Lista" }, { clic: "Invitar usuario" }),
  M("m_usuarios", "M-Usuarios", { estado: "Lista" }),
  M("m_invitar", "M-Usuarios-Invitar"),
  T("usuario_tomas", "Usuario", { usuario: "Tomás (activo)" }),
  T("usuario_sofia", "Usuario", { usuario: "Sofía (invitación pendiente)" }),
  T("usuario_tel", "Usuario", { usuario: "Invitación por teléfono" }),
  M("m_usuario", "M-Usuario", { estado: "Editar usuario" }),
  M("m_usuario_roles", "M-Usuario", { estado: "Elegir los roles" }),
  M("m_usuario_tel", "M-Usuario", { estado: "Invitación por teléfono" }),
  T("empresa", "Empresa", { pestana: "Miembros", quien: "Administra la organización" }),
  T("empresa_agregar", "Empresa", { pestana: "Miembros", quien: "Administra la organización" }, { clic: "Agregar miembro" }),
  M("m_empresa", "M-Empresa", { estado: "Miembros" }),
  M("m_empresa_inv", "M-Empresa", { estado: "Invitación: acciones" }),
  // Criterio
  T("crit_tablas", "Criterio-Tablas", {}, { sel: ".crit" }),
  // Configuración (270 a 273) y la pieza para elegir (262)
  T("configplat", "Config-Plat", { estado: "Sin cambios" }),
  T("configplat_conflicto", "Config-Plat", { estado: "Otra persona cambió la configuración" }),
  M("m_configplat", "M-Config-Plat", { estado: "Sin cambios" }),
  T("waadmin", "WA-Admin", { estado: "Lista" }),
  M("m_waadmin", "M-WA-Admin", { estado: "Lista" }),
  T("asis_org", "Asistente-Org", { asistente: "Tope del día" }),
  M("m_asis_org", "M-Asistente-Org", { asistente: "Tope del día" }),
  T("asis_per", "Asistente-Personal", { asistente: "Tope del día" }),
  M("m_asis_per", "M-Asistente-Personal", { asistente: "Tope del día" }),
  T("asis_plat", "Asistente-Plat", { asistente: "Tope del día" }),
  M("m_asis_plat", "M-Asistente-Plat", { asistente: "Tope del día" }),
  T("waresp", "WA-Respuestas", { estado: "Configuración" }),
  T("waresp_fuera", "WA-Respuestas", { estado: "Editar fuera de horario" }),
  M("m_waresp", "M-WA-Respuestas", { estado: "Configuración" }),
  M("m_waresp_fuera", "M-WA-Respuestas", { estado: "Editar fuera de horario" }),
  T("cuenta", "Cuenta"),
  M("m_cuenta", "M-Cuenta", { estado: "Con el módulo de WhatsApp" }),
  T("configuracion", "Configuracion", { dominio: "Verificado", permiso: "Puede cambiarla" }),
  M("m_configuracion", "M-Configuracion", { estado: "Dominio verificado" }),
  // WhatsApp: «Sin confirmar» y los motivos (0066)
  T("wachats", "WA-Chats", { estado: "Clientes" }),
  T("wachats_fallo", "WA-Chats", { estado: "No se pudo mandar" }),
  M("m_waconv", "M-WA-Conversacion", { estado: "Conversación" }),
  M("m_waconv_fallo", "M-WA-Conversacion", { estado: "No se pudo mandar" }),
  T("platwachats", "Plat-WA-Chats", { estado: "Consultas" }),
  M("m_platwaconv", "M-Plat-WA-Conversacion", { estado: "Conversación" }),
  T("difres", "WA-Difusion-Resultados", { estado: "Resultados" }),
  T("difres_porque", "WA-Difusion-Resultados", { estado: "Por qué no llegó" }),
  M("m_difres", "M-WA-Difusion-Resultados", { estado: "Resultados" }),
  T("audplat", "Auditoria-Plat"),
  M("m_audplat", "M-Auditoria-Plat"),
  // Nada debajo de otro dato (263): las tablas y las filas del teléfono del núcleo
  T("legales", "Legales", { pantalla: "Documentos" }),
  T("wadifusiones", "WA-Difusiones", { estado: "Lista" }),
  M("m_roles", "M-Roles", { estado: "Lista" }),
  M("m_empresas", "M-Empresas", { estado: "Lista" }),
  M("m_orgs", "M-Organizaciones"),
  M("m_recup", "M-Recuperaciones"),
  M("m_audorg", "M-Auditoria-Org", { estado: "Lista" }),
  M("m_contactos", "M-WA-Contactos"),
  M("m_difusiones", "M-WA-Difusiones", { estado: "Lista" }),
  M("m_equipos", "M-WA-Equipos", { estado: "Lista" }),
  M("m_plantillas", "M-WA-Plantillas", { estado: "Lista" }),
  M("m_legales", "M-Legales"),
];
const soloEstas = process.argv.slice(2);
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
for (const p of PIEZAS.filter((x) => !soloEstas.length || soloEstas.includes(x.nombre))) {
  const page = await browser.newPage({ viewport: { width: p.w ?? 1440, height: p.h ?? 900 } });
  await page.goto(`${url}/${p.tablero}.dc.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof window.__dcSetProps === "function" && Boolean(window.__dcRootName?.()));
  await page.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), p.props);
  await page.locator("[data-sc-name]").first().waitFor();
  await page.waitForTimeout(400);
  if (p.clic) {
    await page.getByRole("button", { name: p.clic, exact: false }).first().click();
    await page.waitForTimeout(300);
  }
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
  }, p.sel ?? ".w-app, .ab-root, .ap, .crit");
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
