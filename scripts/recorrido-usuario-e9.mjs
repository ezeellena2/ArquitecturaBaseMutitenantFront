import assert from "node:assert/strict";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { checkByLabel, confirmRecentAuthentication, confirmRecentAuthenticationWhenAsked, factorKeeper, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { authenticatorAuditEvents, isOperatorWrite, openAccountActions, preparePermissions, watchResponses } from "./test-e2e-real-e9.mjs";

// E9 en el recorrido de usuario (pedido del Coordinador de la 9 para el informe de la Guía): el primer ingreso de un
// operador, «Confirmá que sos vos», restablecer el autenticador de otro operador, los límites de uso y Auditoría, en la
// compu y en el teléfono. Va al final, en la pestaña de Plataforma, y termina con el operador del recorrido adentro. El
// operador nuevo es uno del preparador que el recorrido no usa en otro paso: 5b en la compu y 5c en el teléfono, nunca los
// e9 del E2E. La clave, el QR y los códigos de recuperación se tapan en las capturas y nunca se imprimen.

const definition = (id, title, expected) => ({ id: `E9-${id}`, title: `E9 · ${title}`, expected });
export const e9Definitions = [
  definition("01", "Primer ingreso de un operador", "Después del código del correo, Plataforma pide configurar el autenticador: el QR, la clave para escribirla a mano y el código de 6 números. La captura tapa el QR y la clave."),
  definition("02", "Los ocho códigos de recuperación", "El código de la app activa el autenticador y muestra los 8 códigos para descargar o copiar; «Entrar a la plataforma» espera «Los guardé en un lugar seguro». La captura tapa los códigos."),
  definition("03", "Confirmá que sos vos", "Con la prueba reciente vencida, guardar los permisos de otro operador abre «Confirmá que sos vos» en lugar del diálogo, que queda oculto con lo cargado."),
  definition("04", "Confirmar con la app guarda una vez", "El código de la app confirma y el mismo guardado sale una sola vez más, con la misma clave: «Cambiamos los permisos de …»."),
  definition("05", "Restablecer el autenticador de otro operador", "Desde la ficha del otro operador, «Restablecer el autenticador» pide un motivo y avisa «Restablecimos el autenticador de …»."),
  definition("06", "Configuración › Límites de uso", "Configuración muestra los doce límites de uso en sus cuatro grupos (todo el servicio, Ingreso, Asistente y WhatsApp), cada uno con pedidos y «cada»."),
  definition("07", "Auditoría con los eventos del autenticador", "Auditoría muestra el alta del autenticador, el restablecimiento, la confirmación y el ingreso con el autenticador, sin códigos ni claves."),
];

export const e9ManualChecks = [
  "Celular real: escanear el QR del alta con una app de autenticación y entrar con su código; el recorrido usa la clave escrita.",
];

/** El operador que hace su primer ingreso en cada ancho. */
export const newcomerOf = (width) => width === 1440 ? "e2e-5b-operator@example.test" : "e2e-5c-operator@example.test";
/** El nombre con que el preparador crea al operador (RealE2ESetup, PlatformCommand). */
export const operatorNameOf = (email) => {
  const key = /^e2e-([a-z0-9]+)-operator@example\.test$/u.exec(email)?.[1];
  assert.ok(key, "El operador no es uno del preparador aislado.");
  return `Operador E2E ${key}`;
};

/** Lo que nunca sale en una captura: el QR del alta, la clave del autenticador y los códigos de recuperación. */
export function factorSecretMasks(page) {
  return [
    page.getByRole("img", { name: "Código QR para la app de autenticación", exact: true }),
    page.getByText(/^[A-Z2-7]{4}( [A-Z2-7]{1,4})+$/u),
    page.getByRole("list", { name: "Códigos de recuperación", exact: true }),
  ];
}

/** Sigue a la E11 en la pestaña de Plataforma: arranca y termina con el operador del recorrido adentro. */
export async function runE9Journey({ platformPage: page, width, env, base, record, signOut, login, requestCode, verify, awaitPlatformHome, operator }) {
  assert.equal(typeof env?.command, "function", "El recorrido E9 necesita las órdenes privadas del preparador en el mismo entorno.");
  const newcomer = newcomerOf(width);
  const name = operatorNameOf(newcomer);
  const size = { width, height: width === 390 ? 844 : 900 };
  let lastHttp = "";
  const failures = async (response) => {
    const { pathname } = new URL(response.url());
    if (!pathname.startsWith("/api/") || response.ok()) return;
    let code = "";
    try { const problem = await response.json(); if (/^[A-Za-z0-9.]+$/u.test(problem.code)) code = ` ${problem.code}`; } catch { /* Sin cuerpo JSON. */ }
    lastHttp = `${response.request().method()} ${pathname} HTTP ${response.status()}${code}`;
  };
  page.on("response", failures);
  const step = (id, action) => record(`E9-${id}`, width, () => page, action,
    (error) => `Ruta ${new URL(page.url()).pathname}; ${lastHttp || "sin errores HTTP"}; ${error.name}. Los códigos y la clave se omiten.`);
  const url = (route) => new URL(route, base).href;
  // La salida de Plataforma es la de la compu, como al final del recorrido; la pantalla vuelve al ancho del paso.
  const leavePlatform = async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signOut(page, "Plataforma");
    await page.setViewportSize(size);
  };
  const openAccount = async () => {
    await page.goto(url("/plataforma/cuentas"));
    await page.getByRole("searchbox", { name: "Buscar por nombre, correo o teléfono", exact: true }).fill(name);
    await page.getByRole("link", { name: new RegExp(`^${name}`, "u") }).filter({ visible: true }).first().click();
    await page.getByRole("heading", { name, exact: true }).waitFor();
  };
  const writes = watchResponses(page, isOperatorWrite);

  try {
    await step("01", async () => {
      await leavePlatform();
      await page.goto(url("/plataforma"));
      assert.equal((await verify(page, await requestCode(page, newcomer))).status(), 200);
      await page.getByRole("heading", { name: "Protegé tu cuenta de operador", exact: true }).waitFor();
      await page.getByRole("img", { name: "Código QR para la app de autenticación", exact: true }).waitFor();
      const key = await page.getByText(/^[A-Z2-7]{4}( [A-Z2-7]{1,4})+$/u).first().innerText();
      factorKeeper.remember(newcomer, key.replace(/\s+/gu, ""));
      await page.getByRole("group", { name: "Código", exact: true }).waitFor();
      return "El operador nuevo verificó su correo y Plataforma le pidió el alta: el QR, la clave para escribirla a mano y el código de 6 números (QR y clave tapados).";
    });
    await step("02", async () => {
      await fillOtp(page, await factorKeeper.code(newcomer));
      await page.getByRole("button", { name: "Activar", exact: true }).click();
      const list = page.getByRole("list", { name: "Códigos de recuperación", exact: true });
      await list.waitFor();
      const codes = (await list.getByRole("listitem").allInnerTexts()).map((code) => code.trim());
      assert.equal(codes.length, 8, "El alta muestra ocho códigos de recuperación.");
      assert.ok(codes.every((code) => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/u.test(code)));
      factorKeeper.rememberCodes(newcomer, codes);
      const enter = page.getByRole("button", { name: "Entrar a la plataforma", exact: true });
      assert.equal(await enter.isDisabled(), true, "«Entrar a la plataforma» espera «Los guardé».");
      await checkByLabel(page, "Los guardé en un lugar seguro");
      assert.equal(await enter.isDisabled(), false);
      return "El código de la app activó el autenticador; se ven los 8 códigos con Descargar y Copiar, y «Los guardé» habilitó «Entrar a la plataforma» (códigos tapados).";
    });
    await step("03", async () => {
      await page.getByRole("button", { name: "Entrar a la plataforma", exact: true }).click();
      await awaitPlatformHome(page);
      await leavePlatform();
      await login(operator, "platform", page);
      // E9-03 y E9-04 prueban «Confirmá que sos vos» a mano; después la pestaña vuelve a confirmarla sola.
      await stopConfirmingRecentAuthentication(page);
      await awaitPlatformHome(page);
      const expired = await env.command("recent-proof", { kind: "expire", email: operator });
      assert.ok(expired?.expired >= 1, "El preparador vence la prueba reciente de la sesión del operador.");
      await openAccount();
      const { form } = await preparePermissions(page, name, 0, "Recorrido E9: atiende otra área.");
      writes.seen.length = 0;
      await form.getByRole("button", { name: "Guardar cambios", exact: true }).click();
      const confirm = page.getByRole("dialog", { name: "Confirmá que sos vos", exact: true });
      await confirm.waitFor();
      await confirm.getByText(`Para guardar los permisos de ${name}, escribí el código de tu app de autenticación.`, { exact: true }).waitFor();
      assert.equal(await form.isVisible(), false, "Nunca un diálogo sobre otro: «Cambiar permisos» queda oculto con lo cargado.");
      assert.deepEqual(writes.statuses(), [403]);
      return "El operador nuevo entró a Plataforma. Con la prueba vencida, guardar sus permisos abrió «Confirmá que sos vos» en lugar del diálogo, que quedó oculto.";
    });
    await step("04", async () => {
      await confirmRecentAuthentication(page, operator);
      await confirmRecentAuthenticationWhenAsked(page, operator);
      await page.getByText(`Cambiamos los permisos de ${name}.`, { exact: true }).waitFor();
      assert.deepEqual(writes.statuses(), [403, 200], "Confirmado, el mismo guardado sale una sola vez más.");
      assert.ok(writes.seen.every((entry) => entry.key && entry.key === writes.seen[0].key), "Con la misma Idempotency-Key.");
      return "El código de la app confirmó y el guardado se repitió una vez, con la misma clave: «Cambiamos los permisos».";
    });
    await step("05", async () => {
      await openAccountActions(page, name);
      await page.getByRole("menuitem", { name: "Restablecer el autenticador", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: `¿Restablecer el autenticador de ${name}?`, exact: true });
      await dialog.getByText("Se cierran sus sesiones y sus códigos de recuperación dejan de servir.", { exact: false }).waitFor();
      await dialog.getByRole("textbox", { name: /^Motivo/u }).fill("Recorrido E9: cambió de celular.");
      await dialog.getByRole("button", { name: "Restablecer", exact: true }).click();
      await page.getByText(`Restablecimos el autenticador de ${name}.`, { exact: true }).waitFor();
      return "Desde la ficha del otro operador, «Restablecer el autenticador» pidió el motivo y avisó que lo restableció.";
    });
    await step("06", async () => {
      await page.goto(url("/plataforma/configuracion"));
      const group = page.getByRole("group", { name: "Límites de uso", exact: true });
      await group.waitFor();
      assert.equal(await group.getByRole("textbox", { name: /^Pedidos · /u }).count(), 12, "Configuración muestra los doce límites.");
      assert.equal(await group.getByRole("textbox", { name: /^Cada · /u }).count(), 12);
      for (const title of ["Para todo el servicio", "Ingreso", "Asistente", "WhatsApp"]) await group.getByRole("heading", { name: title, exact: true }).waitFor();
      await group.scrollIntoViewIfNeeded();
      return "Configuración muestra «Límites de uso» con los doce perfiles en sus cuatro grupos, con pedidos y «cada».";
    });
    await step("07", async () => {
      await page.goto(url("/plataforma/auditoria"));
      await page.getByRole("heading", { name: "Auditoría", exact: true }).waitFor();
      const wanted = ["configured", "reset", "reauthenticated", "signedInWithAuthenticator"].map((key) => authenticatorAuditEvents[key].summary);
      const missing = new Set(wanted);
      for (let round = 0; round < 15 && missing.size; round++) {
        for (const summary of [...missing]) {
          if (await page.getByText(summary, { exact: true }).filter({ visible: true }).count()) missing.delete(summary);
        }
        const more = page.getByRole("button", { name: "Cargar más", exact: true });
        if (!missing.size || !(await more.isVisible())) break;
        const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/platform/audit" && response.request().method() === "GET");
        await more.click();
        assert.equal((await loaded).status(), 200);
      }
      assert.deepEqual([...missing], [], "Auditoría muestra cada evento del autenticador del recorrido.");
      return "Auditoría muestra el alta del autenticador, el restablecimiento, la confirmación y el ingreso con el autenticador.";
    });
  } finally { writes.stop(); page.off("response", failures); }
}
