// Capturas de F7 (consolidación del front): los estados de los tableros que tocan la edición con
// «Cambios sin guardar», «¿Salir sin guardar?», el 409 y el error de guardado. Mismo mecanismo que
// capturar-etapa-6.mjs (el lienzo servido en local y Playwright), pero sin la app: el usuario ve el
// tablero antes de que se programe. Uso: node scripts/capturar-f7.mjs [--id <caso>] [--browser-path <chrome>]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { otpMaskStyle, startCanvasServer } from "./capturar-etapa-3a.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canvas = path.join(root, "docs/design/lienzo");
export const output = path.join(root, "docs/design/capturas/consolidacion/f7");

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };
const fill = (name, value) => ({ type: "fill", name, value });
const click = (selector) => ({ type: "click", selector });
const toggle = (selector, text) => ({ type: "toggle", selector, text });
const openOrgRoles = click('button[aria-label="Roles de la organización"]');

// Cada caso es un estado de un tablero. `section` captura solo esa sección de un tablero «Criterio».
export const boardCases = [
  { id: "configuracion-cambios-sin-guardar", viewport: desktop, board: "Configuracion", props: { dominio: "Verificado" },
    actions: [fill("Nombre de la organización", "Grupo Delta Sur")],
    state: "Configuración: editaste el nombre y la banda dice solo «Cambios sin guardar»." },
  { id: "configuracion-salir-sin-guardar", viewport: desktop, board: "Avisos", props: { caso: "Salir sin guardar" },
    state: "Configuración con cambios: el diálogo «¿Salir sin guardar?» (Avisos › Salir sin guardar)." },
  { id: "configuracion-otra-persona-cambio", viewport: desktop, board: "Avisos", props: { caso: "Alguien cambió esto" },
    state: "Configuración: el 409, cartel «Otra persona cambió esto…» con «Seguir editando» y «Ver lo nuevo» (Avisos › Alguien cambió esto)." },
  { id: "configuracion-error-del-servidor", viewport: desktop, board: "Avisos", props: { caso: "Error del servidor" },
    state: "Configuración: un 5xx al guardar va en el aviso rojo de abajo, con «Copiar código» (Avisos › Error del servidor)." },
  { id: "pagina-publica-cambios-sin-guardar", viewport: desktop, board: "Pagina-Org", props: { estado: "Publicada" },
    actions: [fill("Nombre de la página", "Grupo Delta Sur")],
    state: "Página pública: «Publicada · Cambios sin guardar» en la banda." },
  { id: "usuario-cambios-sin-guardar", viewport: desktop, board: "Usuario", props: { usuario: "Tomás (activo)" },
    actions: [openOrgRoles, toggle(".o-lst label.op", "Auditor"), click("button.o-capa")],
    state: "Ficha de Usuario: le sumaste un rol y la banda dice «Activo · Cambios sin guardar»." },
  { id: "usuario-error-al-guardar", viewport: desktop, board: "Usuario", props: { usuario: "Lucía (vos)" },
    actions: [openOrgRoles, toggle(".o-lst label.op", "Dueño"), click("button.o-capa"), click(".w-bnd .ac button.cb-pri")],
    state: "Ficha de Usuario: una regla rechaza el guardado y el error va en un cartel debajo de la banda." },
  { id: "usuario-sumar-empresa", viewport: desktop, board: "Usuario", props: { usuario: "Tomás (activo)" },
    actions: [click("button.cb-sec.ch")],
    state: "Ficha de Usuario: el diálogo «Sumar empresa», que guarda al momento (sin estado de error dibujado)." },
  { id: "empresa-roles-error", viewport: desktop, board: "Empresa", props: { pestana: "Miembros" },
    actions: [
      click('button[aria-label="Acciones de Lucía Fernández"]'), click('[role="menu"] button[role="menuitem"]'),
      click('button[aria-labelledby="et-RolesM"]'), toggle("label.op2", "Administrador"), click(".velo button.capa"),
      click(".dlg-f button.b-pri"),
    ],
    state: "Ficha de Empresa: el diálogo «Roles de Lucía Fernández» con el error arriba de los botones." },

  { id: "configuracion-salir-sin-guardar", viewport: phone, board: "M-Avisos", props: { caso: "Salir sin guardar" },
    state: "Configuración en el teléfono: «Cambios sin guardar» en la barra y la hoja «¿Salir sin guardar?»." },
  { id: "configuracion-otra-persona-cambio", viewport: phone, board: "M-Avisos", props: { caso: "Alguien cambió esto" },
    state: "Configuración en el teléfono: el 409, cartel debajo de la barra." },
  { id: "configuracion-error-del-servidor", viewport: phone, board: "M-Avisos", props: { caso: "Error del servidor" },
    state: "Configuración en el teléfono: un 5xx al guardar, en la franja oscura de abajo." },
  { id: "pagina-publica-base", viewport: phone, board: "M-Pagina-Org",
    state: "Página pública en el teléfono: el único estado dibujado (sin cambios)." },
  { id: "usuario-base", viewport: phone, board: "M-Usuario",
    state: "Ficha de Usuario en el teléfono: el único estado dibujado (sin cambios)." },
  { id: "usuario-sumar-empresa", viewport: phone, board: "M-Usuario-Empresa",
    state: "Ficha de Usuario en el teléfono: la hoja «Sumar empresa» (sin estado de error dibujado)." },
  { id: "empresa-base", viewport: phone, board: "M-Empresa",
    state: "Ficha de Empresa en el teléfono: el único estado dibujado (sin diálogos ni errores)." },

  { id: "criterio-avisos-donde-se-muestra", viewport: desktop, board: "Criterio-Avisos", section: "¿Dónde se muestra?",
    state: "Criterio · Avisos: dónde va cada cosa (el error de un formulario, en el formulario; el de una acción directa, en el aviso rojo)." },
  { id: "criterio-avisos-donde-queda", viewport: desktop, board: "Criterio-Avisos", section: "Dónde queda cada uno en la pantalla",
    state: "Criterio · Avisos: el cartel debajo de la banda y el aviso abajo a la derecha." },
  { id: "criterio-avisos-como-se-ve", viewport: desktop, board: "Criterio-Avisos", section: "Cómo se ve cada uno",
    state: "Criterio · Avisos: cómo se ve cada uno, con la pantalla de error y «Reintentar»." },
  { id: "criterio-avisos-prohibido", viewport: desktop, board: "Criterio-Avisos", section: "Prohibido",
    state: "Criterio · Avisos: prohibido, entre otros, el mismo error en dos lugares." },
  { id: "criterio-formularios-errores", viewport: desktop, board: "Criterio-Formularios", section: "Errores",
    state: "Criterio · Formularios: el error general, en una franja roja clara arriba de los botones." },
  { id: "criterio-dialogos-confirmar", viewport: desktop, board: "Criterio-Dialogos", section: "Confirmar algo que no se deshace",
    state: "Criterio · Diálogos: la confirmación de 420 px, sin ✕." },
  { id: "criterio-dialogos-como-se-comporta", viewport: desktop, board: "Criterio-Dialogos", section: "Cómo se comporta",
    state: "Criterio · Diálogos: se cierra con ✕, Cancelar o Escape; el error general, arriba de los botones." },
  { id: "criterio-dialogos-prohibido", viewport: desktop, board: "Criterio-Dialogos", section: "Prohibido",
    state: "Criterio · Diálogos: prohibido un diálogo arriba de otro." },
];

export function boardFile(entry) {
  const size = entry.section ? `${entry.viewport.width}` : `${entry.viewport.width}x${entry.viewport.height}`;
  return path.join(output, "tableros", `${entry.id}-${size}.png`);
}

async function runBoardActions(page, actions = []) {
  for (const action of actions) {
    if (action.type === "fill") {
      const field = page.getByRole("textbox", { name: action.name });
      await field.fill(action.value);
      await field.blur();
    } else if (action.type === "click") {
      await page.locator(action.selector).first().click();
    } else if (action.type === "toggle") {
      await page.locator(action.selector).filter({ has: page.getByText(action.text, { exact: true }) }).first()
        .locator('input[type="checkbox"]').click();
    } else {
      throw new Error(`Acción de tablero desconocida: ${action.type}`);
    }
    await page.waitForTimeout(150);
  }
}

export async function captureBoard(browser, canvasUrl, entry) {
  const file = boardFile(entry);
  mkdirSync(path.dirname(file), { recursive: true });
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR" });
  try {
    const page = await context.newPage();
    await page.goto(`${canvasUrl}/${entry.board}.dc.html`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof window.__dcSetProps === "function" && Boolean(window.__dcRootName?.()));
    await page.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), entry.props ?? {});
    await page.locator("[data-sc-name]").first().waitFor();
    await page.waitForTimeout(200);
    await runBoardActions(page, entry.actions);
    await page.addStyleTag({ content: '@font-face { font-family: Inter; src: url("/_fonts/inter-latin-wght-normal.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: swap; }' });
    await page.evaluate(() => document.fonts.load("700 54px Inter"));
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: otpMaskStyle });
    if (entry.section) {
      await page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name: entry.section, exact: true }) })
        .first().screenshot({ path: file });
    } else {
      await page.screenshot({ path: file });
    }
  } finally {
    await context.close();
  }
  return file;
}

function option(args, name) {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1] ?? null;
}

async function main(args) {
  const id = option(args, "--id");
  const selected = boardCases.filter((entry) => !id || entry.id === id);
  if (selected.length === 0) throw new Error("No hay capturas para ese filtro.");
  const executablePath = option(args, "--browser-path") ?? process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  // Sin una ruta, el Chrome del sistema: el Chromium de Playwright no siempre está descargado.
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : { channel: "chrome" }) });
  const server = await startCanvasServer(canvas);
  try {
    for (const entry of selected) {
      const file = await captureBoard(browser, server.url, entry);
      console.log(`${path.relative(root, file).replaceAll("\\", "/")}: ${entry.state}`);
    }
  } finally {
    await server.close();
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
