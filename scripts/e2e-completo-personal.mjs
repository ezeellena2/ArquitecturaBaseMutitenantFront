import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const definition = (suffix, title, route, actor, expected, covers = [], extra = {}) => ({
  id: `NUEVO-PER-${suffix}`, title, area: "Público y Personal", route, actor, action: title, expected,
  covers: covers.map((id) => ["legal", "invitacion", "enlace", "recuperar", "avisos", "cuenta"].includes(id) ? `SCREEN-${id}` : /^[A-Z]{2}-\d+$/u.test(id) ? `BACK-${id}` : id), ...extra,
});

export const personalDefinitions = [
  definition("01", "Leer los términos vigentes sin sesión", "/terminos", "Visitante sin sesión", "El documento coincide con GET /api/legal/terms, muestra versión y fecha y entra en el ancho del dispositivo.", ["legal"]),
  definition("02", "Leer la privacidad vigente sin sesión", "/privacidad", "Visitante sin sesión", "El documento coincide con GET /api/legal/privacy y entra en el ancho del dispositivo.", ["legal"]),
  definition("03", "Abrir una invitación inválida", "/invitacion", "Visitante sin sesión", "Un fragmento sintético inválido se retira de la URL, muestra «Esta invitación ya no sirve» y permite volver al ingreso.", ["invitacion"]),
  definition("04", "Abrir un enlace de ingreso inválido", "/login/enlace", "Visitante sin sesión", "El enlace sin ticket válido muestra «Este enlace ya no sirve» y ofrece ir al ingreso.", ["enlace"]),
  definition("05", "Abrir una ruta inexistente", "/no-existe-e2e-completo", "Visitante sin sesión", "Muestra «No encontramos esta página» y una salida al inicio, sin desborde.", []),
  definition("06", "Validar el correo en recuperación", "/recuperar", "Visitante sin sesión", "Un correo mal escrito queda en el campo con su error accesible y no envía una solicitud ni un código.", ["recuperar"]),
  definition("07", "Preparar una persona nueva por UI", "/registro", "Persona con correo sintético", "El registro real crea una persona sin organizaciones. Se usa sólo como preparación de los casos nuevos.", [], { setup: true }),
  definition("08", "Rechazar API de empresa y Plataforma con token Personal", "/", "Persona B2C sin organizaciones", "GET de los listados y POST de empresa responden 403 Tenancy.Access.Wrong con traceId; el token conserva access=consumer.", ["HT-006"], { critical: true }),
  definition("09", "Impedir las pantallas B2B y Plataforma desde Personal", "/org/usuarios · /plataforma/cuentas", "Persona B2C sin organizaciones", "Los enlaces directos vuelven al ingreso correspondiente; Personal no muestra Crear empresa ni administración B2B o Plataforma.", ["ID-020"], { critical: true }),
  definition("10", "Guardar el mismo perfil en dos pestañas", "/cuenta", "Persona B2C en dos pestañas", "La primera guarda; la segunda recibe 409 General.ConcurrencyConflict, conserva su borrador y muestra las dos opciones del conflicto.", ["avisos", "CU-002"], { critical: true }),
  definition("11", "Seguir editando conserva la versión vencida", "/cuenta", "Persona B2C con un borrador desactualizado", "Seguir editando conserva los datos; otro Guardar devuelve 409 con la misma versión y no sobrescribe lo guardado por la primera pestaña.", ["CU-002"], { critical: true }),
  definition("12", "Ver lo nuevo pide descartar el borrador", "/cuenta", "Persona B2C con conflicto", "Ver lo nuevo pide confirmación; al descartar carga la versión guardada por la otra pestaña y deja Guardar desactivado.", ["cuenta"]),
  definition("13", "Cancelar y confirmar la salida con cambios", "/cuenta", "Persona B2C que edita su perfil", "Inicio pregunta «¿Salir sin guardar?»; Seguir editando conserva el borrador; Salir sin guardar vuelve al inicio sin persistirlo.", ["avisos"]),
  definition("14", "Rechazar un nombre que supera los 100 caracteres", "/cuenta", "Persona B2C que edita su perfil", "La API real devuelve 400 Validation.Failed con traceId, el campo queda marcado y conserva lo escrito; el perfil guardado no cambia.", []),
  definition("15", "Editar y guardar con el navegador sin red", "/cuenta", "Persona B2C sin conexión", "Chromium está offline de verdad, muestra Sin conexión, conserva el borrador y no muestra éxito antes de reconectar.", ["avisos"]),
  definition("16", "Recuperar la conexión y persistir el mismo borrador", "/cuenta", "Persona B2C que vuelve a tener red", "La acción termina una sola vez, usando Reintentar si se ofrece; F5 conserva el valor y desaparece Sin conexión.", []),
  definition("17", "Cerrar la sesión Personal por UI", "/", "Persona B2C", "Salir vuelve a la portada y cierra la sesión Personal antes de la siguiente suite.", []),
];

/** Incluye la captura en el período offline y siempre devuelve la red al contexto compartido. */
export async function withOffline(context, action) {
  await context.setOffline(true);
  try { return await action(); }
  finally { await context.setOffline(false); }
}

export async function assertProblemResponse(response, status, code) {
  assert.equal(response.status(), status, `La API debe responder ${status}.`);
  const problem = await response.json();
  assert.equal(problem.code, code, "El rechazo debe usar el código esperado.");
  assert.ok(typeof problem.traceId === "string" && problem.traceId.length > 0, "ProblemDetails debe traer traceId.");
  return problem;
}

export async function assertViewport(page) {
  const sizes = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(Math.max(sizes.document, sizes.body) <= sizes.width + 1,
    `Hay desborde horizontal: ancho ${sizes.width}, documento ${sizes.document}, cuerpo ${sizes.body}.`);
}

const heading = (page, name) => page.getByRole("heading", { name, exact: true }).waitFor();
const visibleButton = (page, name) => page.getByRole("button", { name, exact: true }).filter({ visible: true }).first();
const nameField = (page) => page.getByRole("textbox", { name: "Nombre", exact: true });
const isProfileWrite = (response) => new URL(response.url()).pathname === "/api/me" && response.request().method() === "PUT";
const profileWrite = async (page) => {
  const result = page.waitForResponse(isProfileWrite);
  await visibleButton(page, "Guardar cambios").click();
  return result;
};
const apiMe = async (h, page) => {
  const response = await h.api(page, "/api/me");
  assert.equal(response.status(), 200);
  return response.json();
};

/** Nuevos casos reales; el harness es dueño de la base aislada, el navegador y el informe. */
export async function runPersonalCases(h) {
  const publicPage = await h.newPage();
  const pages = [publicPage];
  const record = (suffix, page, action) => h.record(`NUEVO-PER-${suffix}`, () => page, action);
  const block = (suffix, reason, page) => h.block(`NUEVO-PER-${suffix}`, reason, page);
  let person;
  let page;
  let stale;
  let oldVersion;
  let savedName;
  let draftName;
  let onlinePending = false;
  let offlineName;
  let offlineWrites = 0;
  let stopWriteObserver;
  try {
    for (const [suffix, kind, route, title] of [["01", "terms", "/terminos", "Términos y condiciones"], ["02", "privacy", "/privacidad", "Política de privacidad"]]) {
      await record(suffix, publicPage, async () => {
        await publicPage.goto(new URL(route, h.base).href);
        await heading(publicPage, title);
        const response = await publicPage.request.get(new URL(`/api/legal/${kind}`, h.base).href);
        assert.equal(response.status(), 200);
        const document = await response.json();
        const article = publicPage.getByRole("article", { name: title, exact: true });
        assert.equal((await article.innerText()).trim(), document.text.trim());
        await publicPage.getByText(/^Versión .+vigente desde/u).waitFor();
        await assertViewport(publicPage);
        return "Documento vigente real visible sin ingresar, con su texto íntegro, metadatos y ancho correcto.";
      });
    }
    await record("03", publicPage, async () => {
      await publicPage.goto(new URL("/invitacion#e2e-completo-invitacion-invalida", h.base).href);
      await heading(publicPage, "Esta invitación ya no sirve");
      assert.equal(new URL(publicPage.url()).hash, "");
      await publicPage.getByRole("link", { name: "Ir al ingreso", exact: true }).waitFor();
      assert.equal(await publicPage.getByRole("button", { name: "Aceptar invitación", exact: true }).count(), 0);
      await assertViewport(publicPage);
      return "La invitación inválida retiró el fragmento, rechazó la aceptación y ofreció una salida al ingreso.";
    });
    await record("04", publicPage, async () => {
      await publicPage.goto(new URL("/login/enlace", h.base).href);
      await heading(publicPage, "Este enlace ya no sirve");
      await publicPage.getByRole("link", { name: "Ir al ingreso", exact: true }).waitFor();
      assert.equal(await publicPage.getByRole("button", { name: "Continuar", exact: true }).count(), 0);
      await assertViewport(publicPage);
      return "Sin ticket válido no se pudo iniciar sesión ni apareció Continuar.";
    });
    await record("05", publicPage, async () => {
      await publicPage.goto(new URL("/no-existe-e2e-completo", h.base).href);
      await heading(publicPage, "No encontramos esta página");
      await publicPage.getByRole("link", { name: "Ir al inicio", exact: true }).waitFor();
      await assertViewport(publicPage);
      return "La ruta inexistente mostró el 404 de la aplicación con una salida al inicio.";
    });
    await record("06", publicPage, async () => {
      await publicPage.goto(new URL("/recuperar", h.base).href);
      await heading(publicPage, "Recuperar mi cuenta");
      const writes = [];
      const observe = (request) => { if (new URL(request.url()).pathname.startsWith("/api/account-recovery/") && request.method() === "POST") writes.push(request); };
      publicPage.on("request", observe);
      try {
        const email = publicPage.getByRole("textbox", { name: "Correo electrónico", exact: true });
        await email.fill("correo-sin-arroba");
        await visibleButton(publicPage, "Seguir").click();
        await publicPage.getByRole("alert").filter({ hasText: "Ingresá un correo electrónico válido." }).waitFor();
        assert.equal(await email.inputValue(), "correo-sin-arroba");
        assert.equal(await email.getAttribute("aria-invalid"), "true");
        assert.equal(writes.length, 0, "La validación no debe enviar una solicitud de recuperación.");
        await assertViewport(publicPage);
      } finally { publicPage.off("request", observe); }
      return "El correo mal escrito quedó en el campo con un error accesible, sin petición ni OTP.";
    });

    page = await h.newPage(); pages.push(page);
    const prepared = await record("07", page, async () => {
      person = await h.registerPerson(page);
      assert.equal(person.me.access, "consumer");
      assert.equal(person.me.organizations.length, 0);
      await assertViewport(page);
      return "Persona nueva por UI, correo sintético y código del pickup, sin organizaciones.";
    });
    if (!prepared.ok) {
      for (const suffix of ["08", "09", "10", "11", "12", "13", "14", "15", "16"]) await block(suffix, "No se pudo preparar la persona por UI.", page);
      if (await page.getByRole("button", { name: /, Personal$/ }).filter({ visible: true }).count()) {
        await record("17", page, async () => { await h.signOut(page); return "La preparación falló después del ingreso; su sesión se cerró por UI."; });
      } else await block("17", "La preparación no llegó a una sesión Personal utilizable.", page);
      return;
    }
    await record("08", page, async () => {
      for (const route of ["/api/companies/paged", "/api/platform/tenants/paged"]) await assertProblemResponse(await h.api(page, route), 403, "Tenancy.Access.Wrong");
      await assertProblemResponse(await h.api(page, "/api/companies", { method: "POST", headers: { "Idempotency-Key": randomUUID() },
        data: { name: "Empresa no permitida", timeZoneId: person.me.timeZoneId } }), 403, "Tenancy.Access.Wrong");
      assert.equal((await apiMe(h, page)).access, "consumer");
      return "Los listados y el alta empresarial devolvieron 403 Tenancy.Access.Wrong con traceId usando el token Personal real.";
    });
    await record("09", page, async () => {
      const deep = await h.newPage(); pages.push(deep);
      for (const route of ["/org/usuarios", "/plataforma/cuentas"]) {
        await deep.goto(new URL(route, h.base).href);
        await deep.waitForURL((url) => url.pathname === "/login" || url.pathname === "/login/empresa" || url.pathname === "/");
        assert.equal(await deep.getByRole("heading", { name: /^(Usuarios|Cuentas y operadores)$/ }).count(), 0);
      }
      if (h.width === 390) await page.getByRole("link", { name: "Más", exact: true }).filter({ visible: true }).click();
      else await page.getByRole("button", { name: /, Personal$/ }).filter({ visible: true }).click();
      assert.equal(await page.getByRole("link", { name: /^Crear empresa$/ }).count(), 0);
      assert.equal(await page.getByRole("button", { name: /^Crear empresa$/ }).count(), 0);
      for (const name of ["Usuarios", "Roles y permisos", "Organizaciones", "Cuentas y operadores"]) {
        assert.equal(await page.getByRole("link", { name, exact: true }).filter({ visible: true }).count(), 0);
      }
      assert.equal((await apiMe(h, page)).access, "consumer");
      await assertViewport(page);
      await deep.close();
      return "Los enlaces protegidos terminaron fuera de las áreas privadas; Personal conservó su acceso y no ofreció Crear empresa.";
    });

    const race = await h.record("NUEVO-PER-10", () => stale ?? page, async () => {
      await page.goto(new URL("/cuenta", h.base).href); await heading(page, "Mi cuenta");
      const initial = await apiMe(h, page); oldVersion = initial.version;
      stale = await h.newPage(); pages.push(stale);
      await h.login(stale, person.email, "consumer");
      await stale.goto(new URL("/cuenta", h.base).href); await heading(stale, "Mi cuenta");
      assert.equal((await apiMe(h, stale)).version, oldVersion);
      savedName = `Guardado ${h.width}`; draftName = `Borrador ${h.width}`;
      await nameField(stale).fill(draftName);
      await nameField(page).fill(savedName);
      assert.equal((await profileWrite(page)).status(), 200);
      await page.getByText("Guardamos tus datos.", { exact: true }).waitFor();
      const rejected = await profileWrite(stale);
      await assertProblemResponse(rejected, 409, "General.ConcurrencyConflict");
      assert.equal(rejected.request().postDataJSON().version, oldVersion);
      await stale.getByRole("alert").filter({ hasText: "Otra persona cambió esto mientras lo editabas." }).waitFor();
      assert.equal(await nameField(stale).inputValue(), draftName);
      await visibleButton(stale, "Seguir editando").waitFor();
      await visibleButton(stale, "Ver lo nuevo").waitFor();
      assert.equal((await apiMe(h, page)).firstName, savedName);
      await assertViewport(stale);
      return "Primera pestaña 200; segunda 409 real con el borrador intacto y las dos salidas del conflicto.";
    });
    // La captura del conflicto debe mostrar la segunda pestaña, que es la dueña del borrador.
    if (race.ok) {
      await record("11", stale, async () => {
        await visibleButton(stale, "Seguir editando").click();
        assert.equal(await nameField(stale).inputValue(), draftName);
        const again = await profileWrite(stale);
        await assertProblemResponse(again, 409, "General.ConcurrencyConflict");
        assert.equal(again.request().postDataJSON().version, oldVersion);
        assert.equal((await apiMe(h, page)).firstName, savedName);
        return "Seguir editando conservó el borrador y su versión vencida; el reintento siguió dando 409 sin sobrescribir.";
      });
      const adopted = await record("12", stale, async () => {
        await visibleButton(stale, "Ver lo nuevo").click();
        const confirmation = stale.getByRole("dialog", { name: "¿Salir sin guardar?", exact: true });
        await confirmation.waitFor();
        await confirmation.getByRole("button", { name: "Salir sin guardar", exact: true }).click();
        await stale.waitForFunction((expected) => [...document.querySelectorAll("input")].some((input) => input.autocomplete === "given-name" && input.value === expected), savedName);
        assert.equal(await nameField(stale).inputValue(), savedName);
        assert.equal(await visibleButton(stale, "Guardar cambios").isDisabled(), true);
        await assertViewport(stale);
        return "Ver lo nuevo pidió descartar y cargó el perfil actualizado, con el guardado desactivado.";
      });
      if (adopted.ok) page = stale;
    } else {
      await block("11", "Faltó el conflicto real entre dos pestañas.", stale ?? page);
      await block("12", "Faltó el conflicto real entre dos pestañas.", stale ?? page);
    }
    await record("13", page, async () => {
      if (await visibleButton(page, "Descartar cambios").isVisible().catch(() => false)) await visibleButton(page, "Descartar cambios").click();
      await page.goto(new URL("/cuenta", h.base).href); await heading(page, "Mi cuenta");
      const original = (await apiMe(h, page)).firstName;
      const draft = `Sin guardar ${h.width}`;
      await nameField(page).fill(draft);
      const home = page.getByRole("link", { name: "Inicio", exact: true }).filter({ visible: true }).first();
      await home.click();
      let dialog = page.getByRole("dialog", { name: "¿Salir sin guardar?", exact: true });
      await dialog.waitFor(); await dialog.getByRole("button", { name: "Seguir editando", exact: true }).click();
      assert.equal(await nameField(page).inputValue(), draft);
      await home.click(); dialog = page.getByRole("dialog", { name: "¿Salir sin guardar?", exact: true });
      await dialog.getByRole("button", { name: "Salir sin guardar", exact: true }).click();
      await page.waitForURL((url) => url.pathname === "/");
      assert.equal((await apiMe(h, page)).firstName, original);
      return "Cancelar la salida conservó el borrador; confirmarla volvió al inicio sin guardar el nombre.";
    });
    await record("14", page, async () => {
      const stay = page.getByRole("dialog").getByRole("button", { name: "Seguir editando", exact: true });
      if (await stay.isVisible().catch(() => false)) await stay.click();
      if (await visibleButton(page, "Descartar cambios").isVisible().catch(() => false)) await visibleButton(page, "Descartar cambios").click();
      await page.goto(new URL("/cuenta", h.base).href); await heading(page, "Mi cuenta");
      const original = (await apiMe(h, page)).firstName;
      const longName = "N".repeat(101);
      await nameField(page).fill(longName);
      const invalid = await profileWrite(page);
      const problem = await assertProblemResponse(invalid, 400, "Validation.Failed");
      assert.ok(problem.errors?.firstName?.length || problem.errors?.FirstName?.length, "La validación debe nombrar el campo Nombre.");
      await nameField(page).and(page.locator('[aria-invalid="true"]')).waitFor();
      assert.equal(await nameField(page).inputValue(), longName);
      assert.equal((await apiMe(h, page)).firstName, original);
      await assertViewport(page);
      return "101 caracteres dieron 400 de validación y error de campo; el valor guardado quedó intacto.";
    });
    // El bloque sin red se implementa fuera del record para mantener el contexto offline durante la captura.
    offlineName = `Sin red ${h.width}`;
    const observe = (response) => { if (isProfileWrite(response) && response.status() >= 200 && response.status() < 300) offlineWrites++; };
    page.on("response", observe); stopWriteObserver = () => page.off("response", observe);
    await withOffline(h.context, async () => {
      const offline = await record("15", page, async () => {
        await visibleButton(page, "Descartar cambios").click();
        await nameField(page).fill(offlineName);
        await page.mouse.move(0, 0);
        await page.getByText("Guardamos tus datos.", { exact: true }).waitFor({ state: "hidden" });
        await page.waitForFunction(() => navigator.onLine === false);
        await page.getByRole("status", { name: "Sin conexión", exact: true }).waitFor();
        await visibleButton(page, "Guardar cambios").click();
        assert.equal(await nameField(page).inputValue(), offlineName);
        assert.equal(offlineWrites, 0, "No puede haber éxito de guardado con Chromium sin conexión.");
        assert.equal(await page.getByText("Guardamos tus datos.", { exact: true }).count(), 0);
        await assertViewport(page);
        return "Chromium sin red, aviso Sin conexión y borrador intacto; el guardado no informó éxito.";
      });
      onlinePending = offline.ok;
    });
    if (onlinePending) {
      await record("16", page, async () => {
        await page.waitForFunction(() => navigator.onLine === true);
        await page.getByRole("status", { name: "Sin conexión", exact: true }).waitFor({ state: "hidden" });
        const retry = page.getByRole("button", { name: "Reintentar", exact: true }).filter({ visible: true });
        await page.getByText("Guardamos tus datos.", { exact: true }).or(retry).first().waitFor();
        if (await retry.isVisible()) await retry.click();
        await page.getByText("Guardamos tus datos.", { exact: true }).waitFor();
        assert.equal((await apiMe(h, page)).firstName, offlineName);
        assert.equal(offlineWrites, 1, "La reconexión debe producir una sola escritura exitosa.");
        await page.reload(); await heading(page, "Mi cuenta");
        assert.equal(await nameField(page).inputValue(), offlineName);
        await assertViewport(page);
        return "Volvió la red, terminó una sola escritura y F5 conservó el borrador guardado.";
      });
    } else await block("16", "No se pudo comprobar la acción sin red.", page);
    await record("17", page, async () => {
      if (await visibleButton(page, "Descartar cambios").isVisible().catch(() => false)) await visibleButton(page, "Descartar cambios").click();
      await h.signOut(page);
      await page.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().waitFor();
      return "Sesión Personal cerrada con Salir por UI.";
    });
  } finally {
    stopWriteObserver?.();
    await h.context.setOffline(false);
    for (const target of pages) if (!target.isClosed()) await target.close();
  }
}
