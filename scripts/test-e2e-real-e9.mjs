import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { caseDelay as delay, newCaseContext } from "./test-e2e-real-case.mjs";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { completeOperatorFactor, confirmRecentAuthentication, factorKeeper } from "./platform-factor-real.mjs";

// E9 en el E2E real (pedido del Coordinador de la 9 para I1): el segundo factor, «Confirmá que sos vos», restablecer el
// autenticador, las dos cookies, los 14 permisos, Auditoría y un límite de uso. Cada caso usa su operador del entorno
// aislado (e9a confirma y restablece, e9b es el restablecido, e9r usa códigos de recuperación y e9l se bloquea) para no
// cruzar cuotas ni bloqueos. Nada de correos, códigos ni claves en logs o capturas: los códigos viven en `factorKeeper`.

export const e9Operators = Object.fromEntries(["a", "b", "r", "l"].map((key) => [key, `e2e-e9${key}-operator@example.test`]));
/** El nombre con que el preparador crea cada operador (RealE2ESetup, PlatformCommand). */
const operatorName = (key) => `Operador E2E e9${key}`;
const lockedText = "Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos.";
const rateLimitText = "Hiciste muchos pedidos seguidos. Esperá un momento.";

/** Vence la prueba reciente de las sesiones vigentes de un operador (comando .recent-proof.json del preparador). */
export async function expireRecentProof(readyFile, email) {
  const commandFile = readyFile.replace(/\.ready$/u, ".recent-proof.json");
  // Para repetirlo se borran los dos archivos y se escribe de nuevo.
  await rm(commandFile, { force: true });
  await rm(`${commandFile}.done`, { force: true });
  await writeFile(commandFile, JSON.stringify({ kind: "expire", email }), { flag: "wx" });
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const done = JSON.parse(await readFile(`${commandFile}.done`, "utf8"));
      assert.ok(done.expired >= 1, "El preparador debe vencer al menos una sesión del operador.");
      return;
    } catch (error) { if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error; }
    await delay(250);
  }
  throw new Error("El preparador no venció la prueba reciente del operador.");
}

/** Las respuestas de la Api que le interesan al caso: método, ruta, estado e Idempotency-Key, sin cuerpos. */
function watchResponses(page, matches) {
  const seen = [];
  const listener = (response) => {
    const { pathname } = new URL(response.url());
    const method = response.request().method();
    if (matches(method, pathname)) seen.push({ method, path: pathname, status: response.status(), key: response.request().headers()["idempotency-key"] ?? null });
  };
  page.on("response", listener);
  return { seen, statuses: () => seen.map((entry) => entry.status), stop: () => page.off("response", listener) };
}

const isOperatorWrite = (method, pathname) => method === "PUT" && /^\/api\/platform\/accounts\/[^/]+\/operator$/u.test(pathname);
const isReauthentication = (method, pathname) => method === "POST" && pathname === "/api/platform/reauthentication";

/** «Cambiar permisos»: cambia una casilla del catálogo, escribe el motivo y deja el formulario listo para guardar. */
async function preparePermissions(page, name, toggle, reason) {
  await page.getByRole("button", { name: "Cambiar permisos", exact: true }).click();
  const form = page.getByRole("dialog", { name: `Cambiar permisos de ${name}`, exact: true });
  await form.waitFor();
  const picker = form.getByRole("button", { name: "Permisos de plataforma", exact: true });
  await picker.focus();
  await picker.press("ArrowDown");
  await page.getByRole("menuitemcheckbox").nth(toggle).click();
  if (await page.getByRole("menu").isVisible()) await page.keyboard.press("Escape");
  await form.getByRole("textbox", { name: /^Motivo/u }).fill(reason);
  return { form, picker, selection: await picker.innerText() };
}

/** Configuración: escribe los valores, guarda con motivo y confirma si la prueba venció. Devuelve si pidió confirmar. */
async function saveSettings(page, email, values, reason) {
  for (const [name, value] of Object.entries(values)) await page.getByRole("textbox", { name, exact: true }).fill(value);
  // El seed deja los contactos vacíos hasta el primer guardado: la UI requiere completar ambos.
  for (const [name, value] of [["Correo de ventas", "e2e-sales@example.test"], ["Correo de soporte", "e2e-support@example.test"]]) {
    const field = page.getByRole("textbox", { name, exact: true });
    if (!(await field.inputValue())) await field.fill(value);
  }
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true });
  await dialog.getByRole("textbox", { name: /^Motivo/u }).fill(reason);
  const saved = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/platform/settings"
    && response.request().method() === "PUT" && response.status() !== 403);
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Confirmá que sos vos", exact: true });
  const asked = await Promise.race([confirm.waitFor({ timeout: 10_000 }).then(() => true, () => false), saved.then(() => false)]);
  if (asked) await confirmRecentAuthentication(page, email);
  assert.equal((await saved).status(), 200, "La configuración debe guardarse.");
  await page.getByText("Guardamos la configuración.", { exact: true }).waitFor();
  return asked;
}

/** Auditoría con un tipo: cada texto tiene que aparecer, cargando más filas si hace falta. */
async function expectAuditEvents(page, baseUrl, type, summaries) {
  await page.goto(new URL(`/plataforma/auditoria?type=${type}`, baseUrl).href);
  await page.getByRole("heading", { name: "Auditoría", exact: true }).waitFor();
  await page.getByRole("button", { name: /^Ver el detalle: /u }).first().waitFor();
  const missing = new Set(summaries);
  for (let round = 0; round < 15 && missing.size; round++) {
    for (const summary of [...missing]) {
      if (await page.getByRole("button", { name: `Ver el detalle: ${summary}`, exact: true }).count()) missing.delete(summary);
    }
    const more = page.getByRole("button", { name: "Cargar más", exact: true });
    if (!missing.size || !(await more.isVisible())) break;
    const rows = page.getByRole("button", { name: /^Ver el detalle: /u });
    const before = await rows.count();
    await more.click();
    for (let wait = 0; wait < 60 && await rows.count() <= before; wait++) await delay(250);
  }
  assert.deepEqual([...missing], [], `Auditoría (${type}) debe mostrar cada evento del segundo factor.`);
}

/**
 * Los nueve casos, como recorridos de cuenta del E2E real: `[nombre, (page, setStage) => …]`. Van al final de la lista y el
 * de la cuota (E9-9), último, para no frenar a los demás. E9-8 lee lo que dejan E9-1, 2, 4 y 5.
 */
export function etapa9Cases(env) {
  const { baseUrl, readyFile } = env;
  const e9 = e9Operators;
  return [
    ["E9-1: el operador configura el autenticador, sale y vuelve con el código de la app", async (page, setStage) => {
      setStage("e9a entra por primera vez y configura el autenticador");
      assert.equal(await env.loginThroughUi(page, e9.a, "platform", setStage), "setup", "El primer ingreso de e9a pide el alta.");
      assert.equal(factorKeeper.recoveryCodes(e9.a).length, 8, "El alta muestra los ocho códigos de recuperación.");
      await env.expectProfile(page, "Plataforma", "e9a después del alta");
      setStage("sale de Plataforma");
      await env.signOut(page, "Plataforma");
      setStage("vuelve con el código de la app");
      assert.equal(await env.loginThroughUi(page, e9.a, "platform", setStage), "verify", "El segundo ingreso pide el código de la app.");
      await env.expectProfile(page, "Plataforma", "e9a con el código de la app");
    }],
    ["E9-2: un código de recuperación sirve una sola vez y otro código entra", async (page, setStage) => {
      setStage("e9r entra y configura el autenticador");
      await env.loginThroughUi(page, e9.r, "platform", setStage);
      await env.signOut(page, "Plataforma");
      setStage("entra con un código de recuperación");
      const used = factorKeeper.recoveryCodes(e9.r)[0];
      assert.equal(await env.loginThroughUi(page, e9.r, "platform", setStage, { factor: { recoveryCode: true } }), "recoveryCode");
      await env.expectProfile(page, "Plataforma", "e9r con un código de recuperación");
      await env.signOut(page, "Plataforma");
      setStage("el mismo código ya no sirve");
      await env.signInFirstFactor(page, e9.r, "platform", setStage);
      await completeOperatorFactor(page, e9.r, { recoveryCode: used });
      await page.getByText("Ese código no es válido o ya lo usaste.", { exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, "/login", "Con el código usado, sigue en el ingreso.");
      setStage("otro código de recuperación entra");
      await page.getByRole("textbox", { name: "Código de recuperación", exact: true }).fill(factorKeeper.takeRecoveryCode(e9.r));
      await page.getByRole("button", { name: "Verificar", exact: true }).click();
      await env.expectPath(page, "/plataforma", "e9r con otro código de recuperación");
      await env.expectProfile(page, "Plataforma", "e9r con otro código de recuperación");
    }],
    ["E9-3: diez códigos incorrectos bloquean la cuenta y el bloqueo sigue al recargar", async (page, setStage) => {
      setStage("e9l entra y configura el autenticador");
      await env.loginThroughUi(page, e9.l, "platform", setStage);
      await env.signOut(page, "Plataforma");
      setStage("vuelve a la verificación en dos pasos");
      await env.signInFirstFactor(page, e9.l, "platform", setStage);
      const heading = page.getByRole("heading", { name: "Verificación en dos pasos", exact: true });
      await heading.waitFor();
      const verify = page.getByRole("button", { name: "Verificar", exact: true });
      const answer = () => page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/platform-factor/verify"
        && response.request().method() === "POST");
      let attempts = 0;
      let locked = false;
      while (!locked && attempts < 11) {
        attempts++;
        setStage(`escribe un código incorrecto (${attempts})`);
        await fillOtp(page, factorKeeper.invalidCode(e9.l, attempts));
        const answered = answer();
        await verify.click();
        const response = await answered;
        const problem = await response.json().catch(() => ({}));
        if (response.status() === 429) {
          assert.equal(problem.code, "Identity.Account.LockedOut");
          locked = true;
        } else {
          assert.equal(response.status(), 400);
          assert.equal(problem.code, "Auth.TwoFactor.Invalid");
        }
      }
      assert.ok(locked && attempts >= 10, `El bloqueo llega después de diez códigos incorrectos (intentos: ${attempts}).`);
      await page.getByText(lockedText, { exact: true }).waitFor();
      await page.getByText("Probá de nuevo en 15 minutos.", { exact: true }).waitFor();
      assert.equal(await verify.isDisabled(), true, "Con la cuenta bloqueada, «Verificar» va apagado.");
      setStage("recarga: aun con el código correcto, sigue bloqueado");
      await page.reload();
      await heading.waitFor();
      await fillOtp(page, await factorKeeper.code(e9.l));
      const again = answer();
      await verify.click();
      const response = await again;
      assert.equal(response.status(), 429, "El bloqueo es de la cuenta: sobrevive a la recarga.");
      assert.equal((await response.json().catch(() => ({}))).code, "Identity.Account.LockedOut");
      await page.getByText(lockedText, { exact: true }).waitFor();
      assert.equal(await verify.isDisabled(), true);
      assert.equal(new URL(page.url()).pathname, "/login");
    }],
    ["E9-4: con la prueba vencida, «Confirmá que sos vos» reemplaza a la acción y guarda una vez", async (page, setStage) => {
      const target = operatorName("r");
      setStage("e9a entra y abre la ficha de e9r");
      await env.loginThroughUi(page, e9.a, "platform", setStage, { reauth: "manual" });
      await env.openPlatformAccount(page, target);
      const writes = watchResponses(page, isOperatorWrite);
      const proofs = watchResponses(page, isReauthentication);
      const confirm = page.getByRole("dialog", { name: "Confirmá que sos vos", exact: true });
      try {
        setStage("vence la prueba reciente de e9a");
        await expireRecentProof(readyFile, e9.a);
        setStage("guardar los permisos pide «Confirmá que sos vos»");
        const { form, picker, selection } = await preparePermissions(page, target, 0, "E2E E9: confirmación reciente.");
        await form.getByRole("button", { name: "Guardar cambios", exact: true }).click();
        await confirm.waitFor();
        await page.getByText(`Para guardar los permisos de ${target}, escribí el código de tu app de autenticación.`, { exact: true }).waitFor();
        assert.equal(await form.isVisible(), false, "Nunca un diálogo sobre otro: el de la acción queda oculto.");
        setStage("cancelar vuelve al formulario con lo cargado");
        await confirm.getByRole("button", { name: "Cancelar", exact: true }).click();
        await confirm.waitFor({ state: "hidden" });
        await form.waitFor();
        assert.equal(await form.getByRole("textbox", { name: /^Motivo/u }).inputValue(), "E2E E9: confirmación reciente.");
        assert.equal(await picker.innerText(), selection);
        setStage("guarda otra vez y confirma con la app");
        await form.getByRole("button", { name: "Guardar cambios", exact: true }).click();
        await confirmRecentAuthentication(page, e9.a);
        await page.getByText(`Cambiamos los permisos de ${target}.`, { exact: true }).waitFor();
        await form.waitFor({ state: "hidden" });
        assert.deepEqual(writes.statuses(), [403, 403, 200], "Las dos primeras piden la confirmación; la repetida guarda una vez.");
        assert.ok(writes.seen.every((entry) => entry.key && entry.key === writes.seen[0].key), "Las tres salen con la misma Idempotency-Key.");
        assert.deepEqual(proofs.statuses(), [200], "Una sola confirmación.");

        setStage("variante: vence la prueba otra vez y abre «Cambiar permisos»");
        await expireRecentProof(readyFile, e9.a);
        const first = writes.seen.length;
        const stale = await preparePermissions(page, target, 0, "E2E E9: la otra pestaña gana.");
        await stale.form.getByRole("button", { name: "Guardar cambios", exact: true }).click();
        await confirm.waitFor();
        setStage("otra pestaña cambia los permisos antes de confirmar");
        const other = await page.context().newPage();
        try {
          other.setDefaultTimeout(30_000);
          await other.goto(page.url());
          await other.getByRole("heading", { name: target, exact: true }).waitFor();
          const winner = await preparePermissions(other, target, 1, "E2E E9: cambio desde otra pestaña.");
          await winner.form.getByRole("button", { name: "Guardar cambios", exact: true }).click();
          await confirmRecentAuthentication(other, e9.a);
          await other.getByText(`Cambiamos los permisos de ${target}.`, { exact: true }).waitFor();
        } finally { await other.close(); }
        setStage("confirmar en la primera pestaña responde el 409 de siempre, sin pisar");
        await confirmRecentAuthentication(page, e9.a);
        await stale.form.getByText(/^Otra persona cambió esto/u).waitFor();
        assert.deepEqual(writes.statuses().slice(first), [403, 409], "La versión vieja no pisa el cambio de la otra pestaña.");
        await stale.form.getByRole("button", { name: "Cancelar", exact: true }).click();
      } finally { writes.stop(); proofs.stop(); }
    }],
    ["E9-5: restablecer el autenticador cierra la sesión del otro operador y su próximo ingreso pide el alta", async (page, setStage) => {
      const target = operatorName("b");
      const otherContext = await newCaseContext(env.browser, { ignoreHTTPSErrors: true, locale: "es-AR" });
      try {
        const other = await otherContext.newPage();
        other.setDefaultTimeout(30_000);
        setStage("e9b entra a Plataforma en otro navegador");
        await env.loginThroughUi(other, e9.b, "platform", setStage);
        setStage("e9a restablece el autenticador de e9b");
        await env.loginThroughUi(page, e9.a, "platform", setStage);
        await env.openPlatformAccount(page, target);
        const actions = page.getByRole("button", { name: `Acciones de ${target}`, exact: true });
        await actions.focus();
        await actions.press("ArrowDown");
        await page.getByRole("menuitem", { name: "Restablecer el autenticador", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: `¿Restablecer el autenticador de ${target}?`, exact: true });
        await dialog.getByRole("textbox", { name: /^Motivo/u }).fill("E2E E9: cambió de celular.");
        await dialog.getByRole("button", { name: "Restablecer", exact: true }).click();
        await page.getByText(`Restablecimos el autenticador de ${target}.`, { exact: true }).waitFor();
        setStage("e9b pierde la sesión al navegar");
        const panel = other.getByRole("button", { name: "Gestión", exact: true });
        if (await panel.getAttribute("aria-expanded") !== "true") await panel.click();
        await other.getByRole("navigation", { name: "Gestión", exact: true }).getByRole("link", { name: "Cuentas", exact: true }).click();
        try { await other.getByRole("textbox", { name: "Correo electrónico" }).waitFor({ timeout: 30_000 }); }
        catch { throw new Error(`e9b siguió en Plataforma después del restablecimiento (ruta ${new URL(other.url()).pathname}).`); }
        setStage("el próximo ingreso de e9b pide configurar el autenticador");
        assert.equal(await env.loginThroughUi(other, e9.b, "platform", setStage), "setup", "Restablecido, e9b vuelve a pasar por el alta.");
      } finally { await otherContext.close(); }
    }],
    ["E9-6: la sesión de una persona y la de un operador conviven en el mismo navegador", async (page, setStage) => {
      setStage("una persona se registra en este navegador");
      await env.registerPerson(page, `e2e-e9-person-${randomUUID()}@example.test`, setStage);
      const platform = await page.context().newPage();
      try {
        platform.setDefaultTimeout(30_000);
        setStage("e9a entra a Plataforma en otra pestaña del mismo navegador");
        await env.loginThroughUi(platform, e9.a, "platform", setStage);
        setStage("las dos sesiones siguen al recargar");
        await page.reload();
        await env.expectProfile(page, "Personal", "la persona con el operador al lado");
        await platform.reload();
        await env.expectProfile(platform, "Plataforma", "el operador con la persona al lado");
        await page.reload();
        await env.expectProfile(page, "Personal", "la persona después de recargar Plataforma");
      } finally { await platform.close(); }
    }],
    ["E9-7: invitar un operador ofrece los 14 permisos, también los de los módulos", async (page, setStage) => {
      setStage("e9a abre «Invitar operador»");
      await env.loginThroughUi(page, e9.a, "platform", setStage);
      await env.platformNavigate(page, "Gestión", "Cuentas");
      await page.getByRole("button", { name: "Invitar operador", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Invitar operador", exact: true });
      const picker = dialog.getByRole("button", { name: "Permisos de plataforma", exact: true });
      await picker.focus();
      await picker.press("ArrowDown");
      const options = page.getByRole("menuitemcheckbox");
      await options.first().waitFor();
      assert.equal(await options.count(), 14, "El catálogo de Plataforma tiene 14 permisos.");
      for (const name of ["Ver organizaciones", "Administrar operadores", "Usar el asistente de Plataforma", "Administrar el WhatsApp de Plataforma", "Cambiar la configuración"]) {
        assert.equal(await page.getByRole("menuitemcheckbox", { name: new RegExp(`^${name}`, "u") }).count(), 1, `Falta el permiso «${name}».`);
      }
      await page.keyboard.press("Escape");
      await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
    }],
    ["E9-8: Auditoría muestra los eventos del segundo factor", async (page, setStage) => {
      setStage("e9a abre Auditoría");
      await env.loginThroughUi(page, e9.a, "platform", setStage);
      await env.platformNavigate(page, "Administración", "Auditoría");
      setStage("Operadores: configuró, restableció, usó un código y confirmó");
      await expectAuditEvents(page, baseUrl, "operators", ["Configuró su autenticador", "Restableció el autenticador de un operador",
        "Usó un código de recuperación", "Confirmó su identidad"]);
      setStage("Ingresos: con el autenticador y con un código de recuperación");
      await expectAuditEvents(page, baseUrl, "signins", ["Ingresó con el autenticador", "Ingresó con un código de recuperación"]);
    }],
    ["E9-9: una cuota baja frena «Guardar» de un rol con su cuenta y el reintento es a mano", async (page, setStage) => {
      const operatorContext = await newCaseContext(env.browser, { ignoreHTTPSErrors: true, locale: "es-AR" });
      const operator = await operatorContext.newPage();
      operator.setDefaultTimeout(30_000);
      const quota = "Pedidos · Por organización";
      let original = null;
      let restored = true;
      const roleWrites = watchResponses(page, (method, pathname) => method === "PUT" && /^\/api\/roles\/[0-9a-f-]{36}$/iu.test(pathname));
      try {
        setStage("una persona registra su organización y crea un rol");
        await env.registerBusinessByEmail(page, readyFile, setStage);
        const roleName = `Lectura E9 ${randomUUID().slice(0, 8)}`;
        await page.goto(new URL("/org/roles/nuevo", baseUrl).href);
        await page.getByRole("textbox", { name: "Nombre" }).fill(roleName);
        await page.getByRole("combobox", { name: "Vale en" }).click();
        await page.getByRole("option", { name: "Toda la organización" }).click();
        await page.getByRole("button", { name: "Abrir o cerrar Roles", exact: true }).click();
        const permission = page.getByRole("checkbox", { name: "Ver roles", exact: true });
        await permission.focus();
        await permission.press("Space");
        await page.getByRole("button", { name: "Crear rol", exact: true }).click();
        await page.getByRole("heading", { name: roleName, exact: true }).waitFor();

        setStage("e9a baja la cuota por organización a 1 por minuto, con motivo y confirmación");
        await env.loginThroughUi(operator, e9.a, "platform", setStage, { reauth: "manual" });
        await env.platformNavigate(operator, "Administración", "Configuración");
        original = await operator.getByRole("textbox", { name: quota, exact: true }).inputValue();
        assert.notEqual(original, "1", "La cuota de arranque no puede ser 1.");
        await expireRecentProof(readyFile, e9.a);
        restored = false;
        assert.equal(await saveSettings(operator, e9.a, { [quota]: "1" }, "E2E E9: probar el aviso de un límite de uso."), true,
          "Con la prueba vencida, guardar la configuración pide «Confirmá que sos vos».");

        setStage("guardar el rol choca con el límite");
        // Las ventanas son de un minuto calendario: se arranca temprano para que la cuenta se vea correr.
        const second = new Date().getUTCSeconds();
        if (second > 35) await delay((61 - second) * 1000);
        const description = page.getByRole("textbox", { name: "Descripción", exact: true });
        let limited;
        let written = "";
        for (let attempt = 1; attempt <= 3 && !limited; attempt++) {
          written = `Ve los roles. Prueba ${attempt} del límite.`;
          await description.fill(written);
          const answered = page.waitForResponse((response) => isRoleWrite(response));
          await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
          const response = await answered;
          if (response.status() === 429) limited = response;
          else assert.equal(response.status(), 200, "Antes del límite, el rol se guarda.");
        }
        assert.ok(limited, "Con la cuota en 1 por minuto, guardar el rol llega al límite.");
        const problem = await limited.json();
        assert.equal(problem.code, "Security.RateLimit.Exceeded");
        assert.equal(typeof problem.retryAfter, "number");
        assert.equal(limited.headers()["retry-after"], String(problem.retryAfter), "El 429 trae la espera también en Retry-After.");
        await page.getByRole("alert").filter({ hasText: rateLimitText }).waitFor();
        const waiting = page.getByRole("button", { name: /^Reintentá en \d+:\d{2}$/u });
        await waiting.waitFor();
        assert.equal(await waiting.isDisabled(), true, "Mientras corre la cuenta, el botón va apagado.");
        assert.equal(await description.inputValue(), written, "Lo escrito queda.");
        const atLimit = roleWrites.seen.length;
        if (problem.retryAfter >= 5) {
          const shown = await waiting.innerText();
          await delay(2_000);
          assert.notEqual(await waiting.innerText(), shown, "La cuenta regresiva avanza.");
        }

        setStage("e9a restaura la cuota");
        await saveSettings(operator, e9.a, { [quota]: original }, "E2E E9: vuelve la cuota de arranque.");
        restored = true;
        assert.equal(roleWrites.seen.length, atLimit, "Mientras corre la cuenta, no se reenvía nada.");

        setStage("terminada la cuenta, «Guardar cambios» se toca a mano");
        const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
        await save.waitFor({ timeout: (problem.retryAfter + 15) * 1000 });
        await delay(1_500);
        assert.equal(roleWrites.seen.length, atLimit, "Al terminar la cuenta, nada se manda solo.");
        assert.equal(await save.isDisabled(), false);
        const retried = page.waitForResponse((response) => isRoleWrite(response));
        await save.click();
        assert.equal((await retried).status(), 200, "El reintento manual guarda el rol.");
        await page.getByText(`Guardamos el rol ${roleName}.`, { exact: true }).waitFor();
        assert.equal(roleWrites.seen.length, atLimit + 1);
      } finally {
        roleWrites.stop();
        // Un fallo en el medio no deja la cuota baja para el recorrido de 390 que sigue.
        if (!restored && original) {
          try {
            await env.platformNavigate(operator, "Administración", "Configuración");
            await saveSettings(operator, e9.a, { [quota]: original }, "E2E E9: vuelve la cuota de arranque.");
          } catch (error) { console.error(`E9-9: no se pudo restaurar la cuota (${error?.name ?? "Error"}).`); }
        }
        await operatorContext.close();
      }
    }],
  ];
}

function isRoleWrite(response) {
  return response.request().method() === "PUT" && /^\/api\/roles\/[0-9a-f-]{36}$/iu.test(new URL(response.url()).pathname);
}
