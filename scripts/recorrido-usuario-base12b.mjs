import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createAssistantControl } from "./assistant-real-control.mjs";
import { checkByLabel } from "./platform-factor-real.mjs";
import { acceptAssistantNoticeFromHome } from "./assistant-real-ui.mjs";
import { pickupCode, plainTextBody } from "./test-e2e-real-mail.mjs";
import { fillOtp } from "./test-e2e-real-ui.mjs";

// Segunda parte de la base de la 12 en el recorrido de usuario (I3 del plan 2026-11-19-etapa-base-de-la-12-segunda-parte):
// lo que se probó a mano en la puerta queda acá como paso, para que la próxima puerta pase sola. Va después de la base de
// la 12, en las mismas pestañas: arranca y termina con la persona afuera y el operador del recorrido en Plataforma.
// Lo que pide un estado que el preparador todavía no deja (B-2 y B-3 de la puerta) o un proveedor real queda «para probar a
// mano», con su motivo.

const definition = (id, title, expected) => ({ id: `B12B-${id}`, title: `B12B · ${title}`, expected });
export const base12bDefinitions = [
  definition("01", "Un rol en áreas plegables", "Crear un rol que vale en toda la organización muestra las áreas cerradas, cada una con su casilla. Al marcar «Administrar usuarios», «Ver usuarios» queda marcado y apagado, y su motivo dice «Lo incluye «Administrar usuarios».». En el teléfono, igual, con la casilla del área y la flecha que se tocan por separado."),
  definition("02", "Un permiso ajeno da 403 con su texto", "Quien administra roles abre un rol nuevo con un permiso que tiene; mientras lo edita, la Dueña le saca ese permiso. Al guardar, el servidor responde 403 y la pantalla dice por qué, sin guardar el rol."),
  definition("03", "El chat del Inicio sin cupo", "Sin consultas del día, el Inicio de la organización muestra el cartel de atención (blanco, con el filo y el triángulo) que dice cuándo vuelven, a las 00:00, en la hora de la organización y nombrándola, con la (i) del cupo de cada organización."),
  definition("04", "Dos subidas a la vez", "Elegir dos archivos a la vez en el chat del Inicio sube uno por vez: el segundo espera, y los dos quedan adjuntos."),
  definition("05", "Un modelo nuevo en dos pasos", "En la configuración del asistente de Plataforma, agregar un modelo pide primero el proveedor y el modelo, y después los datos técnicos; al guardar, el modelo nuevo está en la lista."),
  definition("06", "Una fecha, un porcentaje y un mes como rango", "Uso del asistente de la organización dice el mes como rango («01/11/2026 – 30/11/2026») y el porcentaje pegado («80%»); Auditoría dice cada fecha con la hora después de una coma."),
  definition("07", "Un aviso de cada tipo", "Guardar dice que salió bien (verde, con tilde); un plazo fuera de rango marca el error en su campo (rojo); el tope del día es un cartel de atención (ámbar, con triángulo), y la (i) abre la información (gris)."),
  definition("08", "Elegir con la pieza", "La pieza elige una opción y varias, la zona horaria se busca por su ciudad y dice la hora de su país, y el filtro de Estado de Usuarios, que era un segmentado, es un filtro sin cantidad."),
  definition("09", "Ordenar una tabla", "Usuarios se ordena desde el encabezado de una columna (↑ y ↓) y desde «Ordenar por», con la columna y el orden en palabras; lo vacío va al final en los dos sentidos, y el orden queda en la dirección."),
  definition("10", "El plazo de los chats y el nombre de los correos", "La Dueña cambia el plazo de los chats de su organización y lo guarda; el operador cambia el nombre de los correos en Plataforma, y el correo con un código llega con el nombre nuevo."),
  definition("11", "Salir con dos pestañas abiertas", "Con dos pestañas de la organización abiertas, salir en una cierra la sesión también en la otra, que vuelve al ingreso."),
];

export const base12bManualChecks = [
  "Invitar hasta el tope, con la espera en horas: el entorno aislado corre con los topes de correo en 1.000.000 (TestMessageQuotas) y ningún perfil de cuotas frena el envío; falta una orden del preparador que baje el tope del día, pedida en la puerta de la base 2 (B-3).",
  "Una invitación por correo en cada estado de entrega (en la cola, enviada, «Sin confirmar» y no se pudo enviar): el preparador todavía no deja un envío de la cola en Uncertain o en Failed (B-2).",
  "Un mensaje «Sin confirmar» revisado, en la organización y en Plataforma: el preparador todavía no deja un mensaje del chat en Uncertain (B-2).",
  "La clave ilegible en la configuración del asistente de la organización y en la de Plataforma: el preparador todavía no deja una clave guardada ilegible (B-2).",
];

/** El mes como rango (formatos.md, `month`): «01/11/2026 – 30/11/2026», del primero al último día, con la raya y espacios. */
export function isMonthRange(text) {
  const match = String(text).trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) – (\d{2})\/(\d{2})\/(\d{4})$/u);
  if (!match) return false;
  const [, fromDay, fromMonth, fromYear, toDay, toMonth, toYear] = match.map(Number);
  const last = new Date(Date.UTC(fromYear, fromMonth, 0)).getUTCDate();
  return fromDay === 1 && toDay === last && fromMonth === toMonth && fromYear === toYear;
}

/** El porcentaje pegado de es-AR (formatos.md, `percent`): «80%» o «12,5%», sin espacio antes del signo. */
export function isJoinedPercent(text) {
  return /^\d{1,3}(?:,\d+)?%$/u.test(String(text).trim());
}

/**
 * Lo vacío al final (264): en una columna ordenada, las filas sin dato («—» o nada) van después de todas las que tienen,
 * en los dos sentidos. Devuelve si se cumple para los valores en el orden en que se ven.
 */
export function emptiesLast(values) {
  const empty = (value) => value === null || value === undefined || ["", "—"].includes(String(value).trim());
  const firstEmpty = values.findIndex(empty);
  return firstEmpty < 0 || values.slice(firstEmpty).every(empty);
}

/**
 * El tope del día en una organización (271 y 283): dice cuándo vuelven las consultas, a las 00:00, en la hora de la
 * organización y nombrándola («hora de Empresa E2E»). Devuelve lo que falta, o nada.
 */
export function dailyLimitProblems(text, organization) {
  const problems = [];
  const sentence = String(text).replace(/\s+/gu, " ").trim();
  if (!sentence.includes(`de hoy en ${organization}`)) problems.push("no nombra la organización del cupo");
  if (!/Vuelven el \d{2}\/\d{2}\/\d{4}, a las 00:00/u.test(sentence)) problems.push("no dice que vuelven a las 00:00 con la fecha");
  if (!sentence.includes(`hora de ${organization}`)) problems.push("no nombra la hora de la organización");
  return problems;
}

/** El nombre con que firma un correo .eml: el de su «From:» (RFC 5322), sin la dirección ni las comillas. */
export function senderNameOf(eml) {
  const from = String(eml).match(/^From:\s*(.*)$/imu)?.[1]?.trim() ?? "";
  const name = from.replace(/\s*<[^>]*>\s*$/u, "").replace(/^"(.*)"$/u, "$1").trim();
  return decodeMimeWords(name);
}

/** Un encabezado con palabras codificadas (RFC 2047, `=?utf-8?B?…?=` o `=?utf-8?Q?…?=`), en texto. */
export function decodeMimeWords(text) {
  return String(text).replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/gu, (_, charset, encoding, data) => {
    assert.match(charset, /^utf-?8$/iu, "Los correos del recorrido van en UTF-8.");
    const bytes = encoding.toUpperCase() === "B" ? Buffer.from(data, "base64")
      : Buffer.from(data.replace(/_/gu, " ").replace(/=([0-9A-F]{2})/giu, (_match, hex) => String.fromCharCode(parseInt(hex, 16))), "latin1");
    return bytes.toString("utf8");
  });
}

/** El texto de un correo de código, para buscar el nombre de la aplicación en su cuerpo. */
export const codeEmailText = (eml) => plainTextBody(eml) ?? "";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/**
 * Los pasos, cada uno una función que devuelve lo que pasó. El recorrido los corre en orden con su registro; en la puerta,
 * el conductor de la I3 los corre de a uno sobre el mismo entorno aislado para probarlos a mano.
 * `ctx`: las pestañas (`page` de la organización y `platformPage` del operador), el ancho, el entorno aislado (`env`, con
 * `command`), la base, y las sesiones del recorrido (`login(email, access, target)`, `signOut`, `awaitApp`), con la Dueña
 * (`owner`), su organización (`organization`) y el operador (`operator`).
 */
export function base12bSteps(ctx) {
  const { page, platformPage, width, env, base, owner, organization } = ctx;
  const phone = width < 768;
  // La invitación del paso 08, que el 09 ordena: propia de este ancho y de esta corrida.
  const invitee = ctx.invitee ?? `e2e-b12b-orden-${width}-${Date.now().toString(36)}@example.test`;
  // El plazo de los chats (07 y 10) y el nombre de los correos (10), distintos por ancho para ver que cambian.
  const chatRetention = width === 1440 ? 60 : 45;
  // La marca de esta corrida: los roles que se crean no chocan con los de otra corrida en la misma base.
  const tag = ctx.tag ?? Date.now().toString(36).slice(-4);
  const firstRole = `Recorrido ${width} ${tag}`;
  const adminRole = `Roles del recorrido ${width} ${tag}`;
  const appName = `Tienda Recorrido ${width}`;
  const senderName = `Avisos Recorrido ${width}`;
  // La pestaña del operador: como la de la Dueña, espera el ingreso o Plataforma, lo que aparezca.
  const ensureOperator = async () => {
    await platformPage.goto(url("/plataforma"));
    const loginBox = platformPage.getByRole("textbox", { name: "Correo electrónico", exact: true });
    const inside = platformPage.getByRole("button", { name: /, Plataforma$/u }).or(platformPage.getByRole("navigation", { name: "Secciones", exact: true }));
    await loginBox.or(inside).filter({ visible: true }).first().waitFor({ timeout: 30_000 });
    if (await loginBox.filter({ visible: true }).count()) await ctx.login(ctx.operator, "platform", platformPage);
  };
  const url = (route) => new URL(route, base).href;
  const heading = (target, name) => target.getByRole("heading", { name, exact: true }).filter({ visible: true }).first().waitFor();
  // La pestaña de la Dueña: si no tiene sesión, la redirección al ingreso llega después de cargar; se espera lo que aparezca.
  const asOwner = async (route) => {
    await page.goto(url(route));
    const loginBox = page.getByRole("textbox", { name: "Correo electrónico", exact: true }).or(page.getByRole("link", { name: "Ingresá", exact: true }));
    const inside = page.getByRole("button", { name: new RegExp(`, ${escapeRegExp(organization)}$`, "u") }).or(page.getByRole("navigation", { name: "Secciones", exact: true }));
    await loginBox.or(inside).filter({ visible: true }).first().waitFor({ timeout: 30_000 });
    if (await loginBox.filter({ visible: true }).count()) {
      await ctx.login(owner, "business", page);
      await page.goto(url(route));
      await inside.filter({ visible: true }).first().waitFor({ timeout: 30_000 });
    }
  };
  const tooltipOf = async (target, control) => {
    await control.click({ force: true });
    const tip = target.getByRole("tooltip").filter({ visible: true }).first();
    await tip.waitFor();
    return (await tip.innerText()).trim();
  };

  return {
    // 260 y F5: las áreas cerradas con su casilla, lo incluido marcado y apagado con su motivo.
    "01": async () => {
      await asOwner("/org/roles/nuevo");
      await heading(page, "Crear un rol");
      await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(firstRole);
      await page.getByRole("button", { name: /^Vale en( |$)/u }).click();
      await page.getByRole("option", { name: /^Toda la organización/u }).click();
      const users = page.getByRole("button", { name: "Abrir o cerrar Usuarios", exact: true });
      await users.waitFor();
      assert.equal(await users.getAttribute("aria-expanded"), "false", "Un rol nuevo tiene todas las áreas cerradas.");
      await page.getByRole("checkbox", { name: "Todos los permisos de Usuarios", exact: true }).waitFor();
      await users.click();
      assert.equal(await users.getAttribute("aria-expanded"), "true", "La flecha abre el área sin marcar su casilla.");
      await page.getByRole("checkbox", { name: "Administrar usuarios", exact: true }).click();
      const read = page.getByRole("checkbox", { name: "Ver usuarios", exact: true });
      assert.equal(await read.getAttribute("aria-checked"), "true", "Lo incluido queda marcado.");
      assert.ok(await read.isDisabled() || await read.getAttribute("aria-disabled") === "true", "Lo incluido queda apagado.");
      const reason = await tooltipOf(page, read);
      assert.equal(reason, "Lo incluye «Administrar usuarios».");
      // Se guarda: el paso 08 lo elige, con el del 02, en la pieza de varios.
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /^(Crear rol|Guardar cambios|Guardar)$/u }).filter({ visible: true }).last().click();
      await page.getByText(`Creamos el rol ${firstRole}.`, { exact: true }).waitFor();
      return `Áreas cerradas con su casilla; «Ver usuarios» quedó marcado y apagado con «${reason}»${phone ? ", en el teléfono" : ""}, y el rol se guardó.`;
    },
    // 269 y ADR 0061: quien edita un rol no da lo que no tiene; si se lo sacan mientras edita, el servidor responde 403.
    "02": async () => {
      const roleName = adminRole;
      const editor = `e2e-b12b-roles-${width}-${Date.now().toString(36)}@example.test`;
      const checkIn = async (target, area, permission) => {
        const toggle = target.getByRole("button", { name: `Abrir o cerrar ${area}`, exact: true });
        if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
        await target.getByRole("checkbox", { name: permission, exact: true }).click();
      };
      const newRole = async (target, name, permissions) => {
        await target.goto(url("/org/roles/nuevo"));
        await heading(target, "Crear un rol");
        await target.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
        await target.getByRole("button", { name: /^Vale en( |$)/u }).click();
        await target.getByRole("option", { name: /^Toda la organización/u }).click();
        for (const [area, permission] of permissions) await checkIn(target, area, permission);
      };
      const save = (target) => target.getByRole("button", { name: /^(Crear rol|Guardar cambios|Guardar)$/u }).filter({ visible: true }).last();
      // La Dueña arma el rol que administra roles y ve la auditoría, e invita con él.
      await asOwner("/org/roles");
      await newRole(page, roleName, [["Roles", "Administrar roles"], ["Auditoría", "Ver la auditoría"]]);
      await save(page).click();
      await page.getByText(`Creamos el rol ${roleName}.`, { exact: true }).waitFor();
      await page.goto(url("/org/usuarios"));
      await heading(page, "Usuarios");
      await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
      await dialog.getByRole("textbox", { name: /^Correo/u }).fill(editor);
      await dialog.getByRole("button", { name: /^Roles de la organización/u }).click();
      await page.getByRole("option", { name: new RegExp(`^${escapeRegExp(roleName)}`, "u") }).click();
      if (phone) await page.getByRole("button", { name: /^Listo/u }).filter({ visible: true }).first().click(); else await page.keyboard.press("Escape");
      const before = new Set(await env.files());
      await dialog.getByRole("button", { name: "Invitar", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      let link;
      for (const deadline = Date.now() + 60_000; !link && Date.now() < deadline;) {
        link = (await env.messages(editor, before)).map(({ body }) => plainTextBody(body)?.match(/https:\/\/[^\s]+\/invitacion#[A-Za-z0-9_-]+/u)?.[0]).find(Boolean);
        if (!link) await new Promise((resolve) => { setTimeout(resolve, 250); });
      }
      assert.ok(link, "Llegó la invitación al correo aislado.");
      // Quien la recibe entra en otro navegador, con su propia sesión, y abre un rol nuevo con «Ver la auditoría».
      const browser = await chromium.launch({ channel: "chrome", headless: true });
      try {
        const other = await (await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR", viewport: page.viewportSize() })).newPage();
        await other.goto(link);
        await heading(other, `Te sumás a ${organization}`);
        await other.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
        await heading(other, `Te sumaste a ${organization}`);
        await other.getByRole("button", { name: "Más tarde", exact: true }).click().catch(() => {});
        await other.waitForURL((current) => current.pathname.startsWith("/org"));
        await newRole(other, `Con auditoría ${width} ${tag}`, [["Auditoría", "Ver la auditoría"]]);
        // Mientras edita, la Dueña le saca «Ver la auditoría» a su rol.
        await page.goto(url("/org/roles"));
        await heading(page, "Roles y permisos");
        // En la compu, el nombre del rol es su link; en el teléfono, la tarjeta entera, que suma sus datos al nombre.
        await page.getByRole("link", { name: new RegExp(`^${escapeRegExp(roleName)}( |$)`, "u") }).filter({ visible: true }).first().click();
        await checkIn(page, "Auditoría", "Ver la auditoría");
        await save(page).click();
        await page.locator('[data-sonner-toast][data-type="success"]').first().waitFor();
        // Al guardar, el servidor responde 403 y la pantalla dice por qué.
        const [reply] = await Promise.all([
          other.waitForResponse((response) => new URL(response.url()).pathname.startsWith("/api/roles") && response.request().method() === "POST"),
          save(other).click(),
        ]);
        assert.equal(reply.status(), 403, "El servidor no deja dar un permiso que ya no se tiene.");
        const problem = await reply.json();
        const shown = other.getByRole("alert").filter({ hasText: /\S/u }).filter({ visible: true }).first();
        await shown.waitFor();
        const text = (await shown.innerText()).trim();
        assert.ok(text.length > 0 && !/HTTP|403|Error/u.test(text), "La pantalla dice por qué, en palabras.");
        assert.equal(await other.getByText(`Creamos el rol Con auditoría ${width} ${tag}.`, { exact: true }).count(), 0, "El rol no se guardó.");
        return `La Dueña le sacó «Ver la auditoría» mientras editaba; al guardar, 403 ${problem.code} y la pantalla dijo «${text}».`;
      } finally { await browser.close(); }
    },
    // 271, 283 y 210: sin consultas del día, el cartel de atención dice cuándo vuelven en la hora de la organización.
    "03": async () => {
      const assistant = createAssistantControl(env.command);
      await assistant("prepare", { email: owner, access: "business" });
      await assistant("quotas", { email: owner, access: "business", remainingMessages: 0, monthlyFraction: 0 });
      // En la compu el chat está en el Inicio; en el teléfono, en su pantalla.
      await asOwner(phone ? "/org/asistente" : "/org");
      await acceptAssistantNoticeFromHome(page);
      const notice = page.getByRole("status").filter({ hasText: "consultas de hoy" }).first();
      await notice.waitFor();
      const text = (await notice.innerText()).trim();
      assert.deepEqual(dailyLimitProblems(text, organization), [], `El tope del día ${dailyLimitProblems(text, organization).join(", ")}.`);
      assert.ok((await notice.getAttribute("class")).includes("border-l-[var(--alerta)]"), "Es el cartel de atención, con el filo ámbar.");
      const help = await tooltipOf(page, notice.getByRole("button"));
      assert.equal(help, "Cada organización tiene su cupo: en otra podés seguir consultando.");
      return `${text.split("\n")[0]} La (i): «${help}».`;
    },
    // F8 («Una subida a la vez»): dos archivos elegidos juntos suben de a uno al mandar, y los dos quedan en la consulta.
    "04": async () => {
      const assistant = createAssistantControl(env.command);
      await assistant("quotas", { email: owner, access: "business", remainingMessages: 50, monthlyFraction: 0 });
      await asOwner(phone ? "/org/asistente" : "/org");
      await acceptAssistantNoticeFromHome(page);
      let active = 0; let most = 0; let done = 0;
      const isUpload = (request) => request.method() === "POST" && /\/assistant\/conversations\/[^/]+\/attachments$/u.test(new URL(request.url()).pathname);
      const started = (request) => { if (isUpload(request)) { active += 1; most = Math.max(most, active); } };
      const finished = (request) => { if (isUpload(request)) { active -= 1; done += 1; } };
      page.on("request", started); page.on("requestfinished", finished); page.on("requestfailed", finished);
      try {
        const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
        await page.locator('input[type="file"]').setInputFiles([
          { name: "recorrido-uno.png", mimeType: "image/png", buffer: png },
          { name: "recorrido-dos.png", mimeType: "image/png", buffer: png },
        ]);
        for (const name of ["recorrido-uno.png", "recorrido-dos.png"]) await page.getByRole("button", { name: `Quitar ${name}`, exact: true }).waitFor();
        await page.getByRole("textbox", { name: "Tu consulta", exact: true }).fill("¿Qué dicen estas dos imágenes?");
        await page.getByRole("button", { name: "Enviar", exact: true }).click();
        const deadline = Date.now() + 60_000;
        while (done < 2 && Date.now() < deadline) await new Promise((resolve) => { setTimeout(resolve, 200); });
        assert.equal(done, 2, "Subieron los dos archivos.");
        assert.equal(most, 1, "Subieron de a uno, nunca dos a la vez.");
        for (const name of ["recorrido-uno.png", "recorrido-dos.png"]) await page.getByText(name, { exact: true }).filter({ visible: true }).first().waitFor();
        return "Dos imágenes elegidas juntas subieron de a una al mandar la consulta, y las dos quedaron adjuntas.";
      } finally { page.off("request", started); page.off("requestfinished", finished); page.off("requestfailed", finished); }
    },
    // 254 (F8): agregar un modelo va en dos pasos (en el teléfono, uno por grupo de datos técnicos) y queda en el catálogo.
    "05": async () => {
      await ensureOperator();
      await createAssistantControl(env.command)("prepare", { email: ctx.operator, access: "platform" });
      await platformPage.goto(url("/plataforma/asistente/configuracion"));
      await heading(platformPage, "Configuración");
      const catalog = platformPage.getByRole("tab", { name: /^Catálogo de modelos/u });
      if (await catalog.count()) await catalog.click();
      await platformPage.getByRole("button", { name: /^Agregar modelo$/u }).filter({ visible: true }).first().click();
      const dialog = platformPage.getByRole("dialog", { name: "Agregar modelo", exact: true });
      await dialog.waitFor();
      const model = `Recorrido ${width} ${tag}`;
      await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(model);
      await dialog.getByRole("textbox", { name: "ID", exact: true }).fill(`recorrido-${width}-${tag}`);
      await dialog.getByRole("textbox", { name: "Precio de entrada por millón", exact: true }).fill("3");
      await dialog.getByRole("textbox", { name: "Precio de salida por millón", exact: true }).fill("15");
      const steps = [];
      steps.push((await platformPage.getByText(/^Paso 1 de \d+$/u).filter({ visible: true }).first().innerText()).trim());
      // Los datos técnicos obligatorios, en la pantalla en que estén (en el teléfono, cada grupo en su paso).
      const technical = async () => {
        const current = platformPage.getByRole("dialog");
        // El contexto largo es opcional y sus tarifas se llaman como las de caché: en el teléfono, su paso queda vacío.
        if (await current.getByText("Desde (tokens)", { exact: true }).isVisible()
          && !await current.getByText("Contexto (tokens)", { exact: true }).isVisible()) return;
        // La casilla se toca por su rótulo, que cubre la fila (CheckboxField).
        if (await current.getByRole("checkbox", { name: "Medio", exact: true }).isVisible()) await checkByLabel(platformPage, "Medio");
        for (const [name, value] of [["Contexto (tokens)", "200000"], ["Salida máxima (tokens)", "64000"], ["Lectura de caché", "0,3"],
          ["Escritura de 5 minutos", "3,75"], ["Escritura de 1 hora", "6"]]) {
          const input = current.getByRole("textbox", { name, exact: true }).first();
          if (await input.isVisible() && !await input.inputValue()) await input.fill(value);
        }
      };
      // Hasta el último paso: «Siguiente»; el último dice «Agregar modelo».
      for (let guard = 0; guard < 6; guard++) {
        const next = platformPage.getByRole("dialog").getByRole("button", { name: "Siguiente", exact: true });
        if (!await next.count()) break;
        await next.click();
        await platformPage.getByRole("dialog", { name: "Datos técnicos", exact: true }).waitFor();
        steps.push((await platformPage.getByText(/^Paso \d+ de \d+$/u).filter({ visible: true }).first().innerText()).trim());
        await technical();
      }
      assert.ok(steps.length >= 2, "Agregar un modelo va en dos pasos o más.");
      await platformPage.getByRole("dialog").getByRole("button", { name: "Agregar modelo", exact: true }).click();
      await platformPage.getByText("Se guardó el modelo.", { exact: true }).first().waitFor();
      await platformPage.getByText(model, { exact: true }).filter({ visible: true }).first().waitFor();
      return `Agregar modelo pasó por ${steps.join(", ")} y «${model}» quedó en el catálogo.`;
    },
    // 205, 207 y 208: el mes como rango, el porcentaje pegado y la fecha con la hora después de una coma.
    "06": async () => {
      const assistant = createAssistantControl(env.command);
      await assistant("quotas", { email: owner, access: "business", remainingMessages: 50, monthlyFraction: 0.8 });
      await asOwner("/org/asistente/uso");
      await heading(page, "Uso");
      const month = page.getByRole("combobox", { name: "Mes", exact: true }).filter({ visible: true }).first();
      const range = (await month.innerText()).replace(/\s+/gu, " ").trim();
      assert.ok(isMonthRange(range), `El mes se dice como rango, y dice «${range}».`);
      const progress = page.getByRole("progressbar", { name: "Uso del tope mensual", exact: true });
      const percent = (await progress.getAttribute("aria-valuetext")) ?? "";
      assert.ok(isJoinedPercent(percent), `El porcentaje va pegado, y dice «${percent}».`);
      await page.goto(url("/org/auditoria"));
      await heading(page, "Auditoría");
      const when = (await page.locator("main time").filter({ visible: true }).first().innerText()).trim();
      assert.ok(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/u.test(when), `La fecha va con la hora después de una coma, y dice «${when}».`);
      return `Uso: el mes «${range}» y el tope del mes al «${percent}»; Auditoría: «${when}».`;
    },
    // 210: cada aviso según su tipo, en la configuración de WhatsApp de la organización y en el Inicio.
    "07": async () => {
      await asOwner("/org/whatsapp/configuracion");
      await heading(page, "Configuración");
      const field = page.getByRole("spinbutton", { name: /^Guardar los mensajes de los chats/u }).or(page.getByRole("textbox", { name: /^Guardar los mensajes de los chats/u })).first();
      // Información: la (i) del plazo, en gris.
      const info = await tooltipOf(page, page.getByRole("button", { name: /Guardar los mensajes de los chats/u }).filter({ visible: true }).first());
      assert.match(info, /^De 1 a /u, "La (i) dice el rango del plazo.");
      // Error: fuera de rango, en su campo y en rojo.
      await field.fill("99999");
      await page.getByRole("button", { name: /^Guardar( cambios)?$/u }).filter({ visible: true }).first().click();
      const error = page.getByRole("alert").filter({ hasText: /^Tiene que ser de 1 a /u }).first();
      await error.waitFor();
      const errorText = (await error.innerText()).trim();
      assert.ok(await field.getAttribute("aria-invalid") === "true", "El error queda en su campo.");
      // Salió bien: el plazo válido se guarda y lo dice el aviso verde con su tilde.
      await field.fill(String(chatRetention));
      await page.getByRole("button", { name: /^Guardar( cambios)?$/u }).filter({ visible: true }).first().click();
      const toast = page.locator('[data-sonner-toast][data-type="success"]').first();
      await toast.waitFor();
      const saved = (await toast.innerText()).trim();
      // Atención: el cartel del tope del día en el Inicio (como en el paso 03), con el triángulo ámbar.
      await createAssistantControl(env.command)("quotas", { email: owner, access: "business", remainingMessages: 0, monthlyFraction: 0 });
      await page.goto(url(phone ? "/org/asistente" : "/org"));
      const warning = page.getByRole("status").filter({ hasText: "consultas de hoy" }).first();
      await warning.waitFor();
      assert.ok((await warning.getAttribute("class")).includes("border-l-[var(--alerta)]"), "El tope es el cartel de atención.");
      return `Información: «${info}». Error: «${errorText}» en su campo. Salió bien: «${saved}». Atención: el tope del día, en ámbar.`;
    },
    // 262 (F11): la pieza elige una y varias, la zona se busca por su ciudad, y el filtro que era segmentado no cuenta.
    "08": async () => {
      await asOwner("/org/usuarios");
      await heading(page, "Usuarios");
      // Varias: los roles de una invitación, con «y N más» o sus nombres; la invitación queda para ordenar en el paso 09.
      await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
      await dialog.getByRole("textbox", { name: /^Correo/u }).fill(invitee);
      const roles = dialog.getByRole("button", { name: /^Roles de la organización/u });
      await roles.click();
      // Los roles que guardaron los pasos 01 y 02.
      const picked = [firstRole, adminRole];
      for (const name of picked) await page.getByRole("option", { name: new RegExp(`^${escapeRegExp(name)}`, "u") }).click();
      if (phone) await page.getByRole("button", { name: /^Listo \(2\)$/u }).click(); else await page.keyboard.press("Escape");
      const chosen = (await roles.innerText()).replace(/\s+/gu, " ").trim();
      assert.ok(picked.every((name) => chosen.includes(name)) || /y 1 más/u.test(chosen), `La pieza dice las dos elegidas por su nombre o con «y N más», y dice «${chosen}».`);
      await dialog.getByRole("button", { name: /^Invitar$|^Enviar invitación$/u }).click();
      await dialog.waitFor({ state: "hidden" });
      // Una opción: el filtro «Estado», que era un segmentado, sin cantidades. En el teléfono va en «Filtros».
      if (phone) await page.getByRole("button", { name: "Filtrar usuarios", exact: true }).click();
      const state = page.getByRole("button", { name: /^Estado/u }).filter({ visible: true }).first();
      await state.click();
      const options = await page.getByRole("option").filter({ visible: true }).allInnerTexts();
      assert.ok(options.length > 1 && options.every((text) => !/\(\d+\)|\b\d+\s*$/u.test(text.trim())), "El filtro que era segmentado no muestra cantidades.");
      await page.getByRole("option", { name: /^Invitación pendiente/u }).click();
      if (phone) await page.getByRole("dialog", { name: "Filtros", exact: true }).getByRole("button", { name: "Listo", exact: true }).click();
      await page.waitForURL((current) => [...current.searchParams.values()].some((value) => /invit/iu.test(value)));
      await page.getByText(invitee, { exact: true }).filter({ visible: true }).first().waitFor();
      // La zona horaria: se busca por su ciudad y dice la hora de su país.
      await page.goto(url("/org/configuracion"));
      await heading(page, "Configuración");
      await page.getByRole("button", { name: /^Zona horaria predeterminada/u }).click();
      // Las zonas son las del país de la organización: se busca una ciudad y la opción dice la hora de su país.
      await page.getByRole("combobox", { name: "Buscar en Zona horaria predeterminada", exact: true }).fill("Córdoba");
      const zone = page.getByRole("option", { name: /^Córdoba/u });
      const described = (await zone.innerText()).replace(/\s+/gu, " ").trim();
      assert.match(described, /hora de Argentina/u, "La zona dice la hora de su país.");
      await zone.click();
      await page.getByRole("button", { name: /^Zona horaria predeterminada Córdoba/u }).waitFor();
      await page.getByRole("button", { name: "Descartar cambios", exact: true }).click();
      return `Varias: ${chosen}; una: el filtro Estado, sin cantidades, mostró la invitación; la zona: «${described}».`;
    },
    // 264 (F12): el encabezado y «Ordenar por» ordenan, con lo vacío al final y el orden en la dirección.
    "09": async () => {
      await asOwner("/org/usuarios");
      await heading(page, "Usuarios");
      const sortOf = () => new URL(page.url()).searchParams.get("orden") ?? new URL(page.url()).searchParams.get("sort");
      if (!phone) {
        const header = page.getByRole("columnheader", { name: /^Vence/u });
        const values = async () => {
          const headers = await page.getByRole("columnheader").allInnerTexts();
          const index = headers.findIndex((text) => text.trim().startsWith("Vence"));
          const rows = page.getByRole("row").filter({ has: page.getByRole("cell") });
          return Promise.all((await rows.all()).map(async (row) => (await row.getByRole("cell").nth(index).innerText()).trim()));
        };
        // Ordena el servidor: se lee la tabla cuando llega la respuesta con el orden pedido.
        const sortedBy = (direction) => page.waitForResponse((response) => {
          const current = new URL(response.url());
          return current.pathname.startsWith("/api/users") && response.ok()
            && (current.searchParams.get("sort") ?? "").replace(/^-/u, "") === "invitationExpiresAtUtc"
            && (current.searchParams.get("sort") ?? "").startsWith("-") === (direction === "descending");
        });
        const settle = async () => { await page.locator('table[data-slot="table"]:not([aria-busy="true"])').first().waitFor(); await page.waitForTimeout(300); };
        let reply = page.waitForResponse((response) => new URL(response.url()).pathname.startsWith("/api/users") && response.ok()
          && /invitationExpiresAtUtc/u.test(new URL(response.url()).search));
        await header.getByRole("button").click();
        await reply; await settle();
        const first = await header.getAttribute("aria-sort");
        assert.ok(["ascending", "descending"].includes(first), `El encabezado dice cómo ordena, y dice «${first}».`);
        const sorted = await values();
        assert.ok(sorted.some((value) => value === "—" || value === "") && sorted.some((value) => /\d/u.test(value)),
          "Hay personas sin vencimiento y una invitación con su fecha (la del paso 08).");
        assert.ok(emptiesLast(sorted), `Ordenado ${first}, lo vacío va al final.`);
        reply = sortedBy(first === "ascending" ? "descending" : "ascending");
        await header.getByRole("button").click();
        await reply; await settle();
        const second = await header.getAttribute("aria-sort");
        assert.notEqual(second, first, "El segundo toque invierte el orden.");
        assert.ok(emptiesLast(await values()), `Ordenado ${second}, lo vacío sigue al final.`);
      }
      const by = page.getByRole("button", { name: /^Ordenar por/u }).filter({ visible: true }).first();
      await by.click();
      await page.getByRole("button", { name: /^Columna/u }).filter({ visible: true }).first().click();
      await page.getByRole("option", { name: /^Usuario/u }).click();
      await page.getByRole("button", { name: /^Orden( |$)/u }).filter({ visible: true }).first().click();
      await page.getByRole("option", { name: /^De la Z a la A/u }).click();
      if (phone) await page.getByRole("button", { name: /^Listo/u }).filter({ visible: true }).first().click().catch(() => {});
      await page.keyboard.press("Escape").catch(() => {});
      await page.getByRole("button", { name: "Ordenar por: Usuario, de la Z a la A", exact: true }).filter({ visible: true }).first().waitFor();
      const sort = sortOf();
      assert.ok(sort, "El orden queda en la dirección.");
      return `${phone ? "" : "El encabezado «Vence» ordenó en los dos sentidos con lo vacío al final; "}«Ordenar por» quedó en «Usuario, de la Z a la A» y en la dirección (${sort}).`;
    },
    // 270 y 273: el plazo de la organización quedó guardado, y el correo de un código llega con el nombre nuevo.
    "10": async () => {
      await asOwner("/org/whatsapp/configuracion");
      await heading(page, "Configuración");
      const field = page.getByRole("spinbutton", { name: /^Guardar los mensajes de los chats/u }).or(page.getByRole("textbox", { name: /^Guardar los mensajes de los chats/u })).first();
      assert.equal(await field.inputValue(), String(chatRetention), "El plazo de los chats quedó guardado.");
      // El operador cambia el nombre de los correos en Plataforma.
      await ensureOperator();
      await platformPage.goto(url("/plataforma/configuracion"));
      await heading(platformPage, "Configuración");
      // El entorno aislado arranca sin los correos de contacto, que la configuración pide para guardar.
      for (const [name, value] of [["Correo de ventas", "ventas@example.test"], ["Correo de soporte", "soporte@example.test"]]) {
        const contact = platformPage.getByRole("textbox", { name: new RegExp(`^${name}`, "u") }).first();
        if (await contact.count() && !await contact.inputValue()) await contact.fill(value);
      }
      await platformPage.getByRole("textbox", { name: /^Nombre de la aplicación/u }).fill(appName);
      await platformPage.getByRole("textbox", { name: /^Nombre del remitente/u }).fill(senderName);
      // «Así llega» lo muestra antes de guardar: el remitente y el asunto con el nombre nuevo.
      await platformPage.getByText(senderName, { exact: true }).first().waitFor();
      await platformPage.getByText(new RegExp(`es tu código de acceso a ${escapeRegExp(appName)}$`, "u")).first().waitFor();
      await platformPage.getByRole("button", { name: /^Guardar( cambios)?$/u }).filter({ visible: true }).first().click();
      // La configuración de Plataforma se guarda con un motivo.
      const confirm = platformPage.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true });
      await confirm.getByRole("textbox", { name: /^Motivo/u }).fill("Recorrido: el nombre de los correos.");
      await confirm.getByRole("button", { name: "Guardar", exact: true }).click();
      await platformPage.locator('[data-sonner-toast][data-type="success"]').first().waitFor();
      // La Dueña pide un código: el correo llega con el nombre nuevo.
      await ctx.signOut(page, organization);
      await page.goto(url("/login/empresa"));
      await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(owner);
      const before = new Set(await env.files());
      await page.getByRole("button", { name: "Enviar código", exact: true }).click();
      const deadline = Date.now() + 60_000;
      let mail;
      while (!mail && Date.now() < deadline) {
        mail = (await env.messages(owner, before)).find((item) => pickupCode(item.body));
        if (!mail) await new Promise((resolve) => { setTimeout(resolve, 250); });
      }
      assert.ok(mail, "Llegó el correo del código.");
      const sender = senderNameOf(mail.body);
      assert.equal(sender, senderName, "El correo del código llega con el nombre nuevo del remitente.");
      assert.ok(codeEmailText(mail.body).includes(appName), "El correo nombra la aplicación con su nombre nuevo.");
      await fillOtp(page, pickupCode(mail.body));
      await page.getByRole("button", { name: "Verificar", exact: true }).click();
      await page.waitForURL((current) => current.pathname.startsWith("/org"));
      return `El plazo de los chats quedó en ${chatRetention} días; el operador puso «${appName}» y «${senderName}», y el correo del código llegó de «${sender}» nombrando «${appName}».`;
    },
    // F7: salir en una pestaña cierra la sesión en las demás de ese lado (BroadcastChannel).
    "11": async () => {
      await asOwner("/org");
      await heading(page, phone ? "Inicio" : "Inicio");
      const other = await page.context().newPage();
      await other.setViewportSize(page.viewportSize());
      try {
        await other.goto(url("/org/usuarios"));
        await heading(other, "Usuarios");
        await ctx.signOut(page, organization);
        await other.waitForURL((current) => !current.pathname.startsWith("/org"), { timeout: 15_000 });
        const where = new URL(other.url()).pathname;
        await other.getByRole("link", { name: "Ingresá", exact: true }).or(other.getByRole("textbox", { name: "Correo electrónico", exact: true }))
          .filter({ visible: true }).first().waitFor();
        return `Salió en una pestaña y la otra, que estaba en Usuarios, dejó la organización sola y quedó en ${where}, con el ingreso.`;
      } finally { await other.close(); }
    },
  };
}

/** Sigue a la base de la 12 en las mismas pestañas; arranca y termina con la persona afuera y el operador en Plataforma. */
export async function runBase12bJourney(ctx) {
  assert.ok(typeof ctx?.env?.command === "function" && typeof ctx.env.files === "function",
    "La segunda parte de la base necesita las órdenes y el correo aislados del mismo entorno.");
  assert.ok([ctx.record, ctx.login, ctx.signOut, ctx.awaitApp].every((value) => typeof value === "function")
    && [ctx.owner, ctx.organization, ctx.operator].every((value) => typeof value === "string" && value.length > 0),
    "La segunda parte de la base sigue al recorrido: necesita sus sesiones, la Dueña, su organización y el operador.");
  const steps = base12bSteps(ctx);
  for (const { id } of base12bDefinitions) {
    const key = id.slice("B12B-".length);
    await ctx.record(id, ctx.width, () => ctx.page, steps[key], (error) => `Ruta ${new URL(ctx.page.url()).pathname}; ${error.name}. Los correos y los códigos se omiten.`);
  }
}
