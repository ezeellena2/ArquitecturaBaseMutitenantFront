import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { confirmRecentAuthenticationWhenAsked, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { openPlatformSettings, restorableSettings, savePlatformSettings, withRestoredSettings } from "./test-e2e-real-whatsapp-settings.mjs";
import { assertPlatformProblem, createPlatformRecorder } from "./e2e-completo-plataforma.mjs";
import { requireSyntheticEmail, syntheticEmail } from "./e2e-completo-soporte.mjs";

const definition = (number, actor, action, route, expected, covers = []) => ({
  id: `POL-${String(number).padStart(2, "0")}`, area: "Políticas de registro", actor, action, route, expected, covers, critical: true,
  source: "back:docs/features/identidad.md; back:docs/features/organizaciones.md; back:docs/features/plataforma.md",
});

export const policyDefinitions = [
  definition(1, "Operador completo", "Ingresar y conservar las políticas iniciales", "/plataforma/configuracion", "Ingreso por correo y autenticador; se leen las políticas originales desde la UI y su GET."),
  definition(2, "Operador completo", "Cerrar ambos registros desde Configuración", "/plataforma/configuracion", "Personas Cerrado y organizaciones Cerrada persisten después de F5 con motivo.", ["BACK-PL-026", "SCREEN-config-plat"]),
  definition(3, "Visitante nuevo", "Intentar crear cuenta con registro personal cerrado", "/registro", "403 Auth.Signup.Closed, sin OTP, con el estado cerrado y la salida Ir al ingreso.", ["BACK-ID-005"]),
  definition(4, "Visitante nuevo", "Intentar registro empresarial cerrado", "/registro/empresa", "403 Auth.BusinessSignup.Closed, sin OTP, con el estado cerrado y Volver al inicio.", ["BACK-OR-005"]),
  definition(5, "Operador completo", "Abrir registros y fijar máximo de una organización", "/plataforma/configuracion", "Personas Abierto, organizaciones Abierta y máximo1 persisten por UI y F5.", ["BACK-PL-026"]),
  definition(6, "Dueño nuevo", "Registrar su primera organización con máximo1", "/registro/empresa", "La organización y la primera empresa se crean por UI; hay acceso Business y no se crea Personal automáticamente.", ["BACK-OR-001"]),
  definition(7, "Dueño con formulario de alta abierto", "Probar dirección inválida, reservada y ocupada", "/registro/empresa", "La API y el campo indican Invalid, Reserved y Taken; los tres impiden enviar una nueva organización.", ["BACK-OR-003"]),
  definition(8, "Dueño de una organización", "Intentar crear una segunda organización", "/registro/empresa", "409 Tenancy.Organization.LimitReached con limit1 y aviso del límite; conserva una sola organización.", ["BACK-OR-004"]),
  definition(9, "Operador completo", "Exigir aprobación para nuevas organizaciones", "/plataforma/configuracion", "RequiresApproval persiste por UI y F5; se cierra por UI la sesión pública anterior.", ["BACK-PL-026"]),
  definition(10, "Dueño nuevo sin otras organizaciones", "Registrar una organización que requiere aprobación", "/registro/empresa", "HTTP200 requiresApproval=true; muestra Recibimos el pedido y no ofrece Entrar a la organización.", ["BACK-OR-006"]),
  definition(11, "Dueño de organización pendiente", "Intentar entrar antes de la aprobación", "/org", "Muestra Estamos revisando la organización y no presenta datos empresariales.", ["BACK-OR-006"]),
  definition(12, "Operador completo", "Restaurar las políticas iniciales antes de salir", "/plataforma/configuracion", "Registro personal, empresarial, máximo y contactos restaurables coinciden con la lectura inicial después de F5."),
];

export async function requireClosedSignup(response, access) {
  assert.ok(["consumer", "business"].includes(access));
  return assertPlatformProblem(response, 403, access === "consumer" ? "Auth.Signup.Closed" : "Auth.BusinessSignup.Closed");
}

export async function requireOrganizationLimit(response, limit) {
  const problem = await assertPlatformProblem(response, 409, "Tenancy.Organization.LimitReached");
  assert.equal(problem.limit, limit, "La respuesta debe indicar el límite que se configuró.");
  return problem;
}

export async function requireSlugAvailability(response, slug, availability) {
  assert.equal(response.status(), 200, "La disponibilidad válida debe responder 200.");
  const actual = await response.json();
  assert.equal(actual.slug, slug, "La respuesta debe corresponder al valor recién escrito.");
  assert.equal(actual.availability, availability, "El estado de disponibilidad debe coincidir.");
}

const endpoint = (route, method = "POST") => (response) => new URL(response.url()).pathname === route && response.request().method() === method;

async function closedRegistration(h, page, access) {
  const email = syntheticEmail(`cerrado-${access}`);
  await page.goto(new URL(access === "consumer" ? "/registro" : "/registro/empresa", h.base).href);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await page.getByRole("textbox", { name: access === "consumer" ? "Correo electrónico" : "Tu correo electrónico", exact: true }).fill(email);
  const response = page.waitForResponse(endpoint(access === "consumer" ? "/api/auth/signup" : "/api/auth/business-signup/code"));
  await page.getByRole("button", { name: access === "consumer" ? "Crear cuenta" : "Continuar", exact: true }).click();
  await requireClosedSignup(await response, access);
  await page.getByRole("heading", { name: access === "consumer" ? "Por ahora no se pueden crear cuentas" : "Por ahora no se pueden registrar empresas", exact: true }).waitFor();
  await page.getByRole("link", { name: access === "consumer" ? "Ir al ingreso" : "Volver al inicio", exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).count(), 0);
}

async function openNewBusinessDetails(h, page, email) {
  requireSyntheticEmail(email);
  await page.goto(new URL("/registro/empresa", h.base).href);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await page.getByRole("textbox", { name: "Tu correo electrónico", exact: true }).fill(email);
  const before = new Set(await h.env.files());
  for (let attempt = 0; attempt < 2; attempt++) {
    const sent = page.waitForResponse(endpoint("/api/auth/business-signup/code"), { timeout: 90_000 });
    // Repetir el alta con el mismo Dueño respeta el contador real que la UI muestra tras el 429 del destino.
    await page.getByRole("button", { name: "Continuar", exact: true }).click({ timeout: 90_000 });
    const response = await sent;
    if (response.status() !== 429 || attempt === 1) { assert.equal(response.status(), 202); break; }
    await assertPlatformProblem(response, 429, "Auth.LoginCode.ResendTooSoon");
  }
  await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
  await fillOtp(page, await h.env.code(email, before));
  const verified = page.waitForResponse(endpoint("/api/auth/business-signup/verify"));
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  assert.equal((await verified).status(), 204);
  await page.getByRole("heading", { name: "Tu organización", exact: true }).waitFor();
}

async function fillOrganization(page, name, slug) {
  await page.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill(name);
  await page.getByRole("textbox", { name: /Dirección de tu página/ }).fill(slug);
  await page.getByRole("textbox", { name: "Primera empresa", exact: true }).fill(`${name} Centro`);
  await page.getByText("Disponible", { exact: true }).waitFor();
}

async function closePublicIdentity(h, page, state) {
  if (!state.publicIdentity) return;
  // El alta empresarial puede tener cookie sin ningún acceso todavía. Elegir la puerta Personal explícitamente
  // crea ese acceso de la identidad ya probada y ofrece el menú Salir; nunca se borran cookies desde el runner.
  await page.goto(new URL("/login", h.base).href);
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForFunction(() => !!document.querySelector('nav[aria-label="Secciones"], button[aria-haspopup="menu"]'));
  const response = await h.api(page, "/api/me");
  assert.equal(response.status(), 200);
  assert.equal((await response.json()).access, "consumer");
  await h.signOut(page);
  state.publicIdentity = false;
}

export async function runPolicyCases(h) {
  const operatorPage = await h.newPage();
  const publicPage = await h.newPage();
  const state = { operatorSignedIn: false, publicIdentity: false };
  const operatorEmail = h.width === 1440 ? "e2e-5a-operator@example.test" : "e2e-a8-operator@example.test";
  const step = createPlatformRecorder(h);
  const record = (number, page, action, dependencies = []) => step(`POL-${String(number).padStart(2, "0")}`, page, action, dependencies.map((id) => `POL-${String(id).padStart(2, "0")}`));
  let current; let business; let pendingOrganization; let secondDetailsReady = false;
  const observeVerification = (response) => { if (endpoint("/api/auth/business-signup/verify")(response) && response.ok()) state.publicIdentity = true; };
  publicPage.on("response", observeVerification);
  const setPolicy = async (values, reason) => {
    current = await openPlatformSettings(operatorPage, h.base.origin);
    current = await savePlatformSettings(operatorPage, current, { ...restorableSettings(current), ...values }, reason);
  };
  await withRestoredSettings({
    read: async () => {
      const result = await record(1, operatorPage, async () => {
        const me = await h.login(operatorPage, operatorEmail, "platform"); state.operatorSignedIn = true;
        assert.equal(me.access, "platform");
        await confirmRecentAuthenticationWhenAsked(operatorPage, operatorEmail);
        current = await openPlatformSettings(operatorPage, h.base.origin);
        return "Operador con autenticador ingresó y leyó las políticas originales por UI y GET real.";
      });
      assert.ok(result.ok, "No se obtuvieron las políticas originales; no se cambian registros.");
      return current;
    },
    prepare: async () => {
      await record(2, operatorPage, async () => {
        await setPolicy({ consumerSignup: "Closed", businessSignup: "Closed" }, "Prueba integral: cerrar ambos registros temporalmente.");
        return "Registros personal y empresarial cerrados desde Configuración; F5 confirmó los valores.";
      }, [1]);
    },
    body: async () => {
      await record(3, publicPage, async () => {
        await closedRegistration(h, publicPage, "consumer");
        return "Registro personal devolvió 403 Auth.Signup.Closed y mostró el estado cerrado sin pasar al código.";
      }, [2]);
      await record(4, publicPage, async () => {
        await closedRegistration(h, publicPage, "business");
        return "Registro empresarial devolvió 403 Auth.BusinessSignup.Closed y mostró Volver al inicio sin pasar al código.";
      }, [2]);
      await record(5, operatorPage, async () => {
        await setPolicy({ consumerSignup: "Open", businessSignup: "Open", maxOwnedOrganizations: 1 }, "Prueba integral: abrir registros con máximo de una organización.");
        return "Ambos registros abiertos y máximo de una organización persistidos y releídos después de F5.";
      }, [1]);
      await record(6, publicPage, async () => {
        business = await h.registerBusiness(publicPage);
        assert.equal(business.me.access, "business");
        assert.equal(business.me.hasPersonalSpace, false);
        assert.equal(business.me.organizations.length, 1);
        return "Se creó por UI la primera organización de una cuenta nueva, sin Personal automático.";
      }, [5]);
      await record(7, publicPage, async () => {
        await h.signOut(publicPage); state.publicIdentity = false;
        await openNewBusinessDetails(h, publicPage, business.email);
        secondDetailsReady = true;
        await publicPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill("Segunda organización bloqueada");
        await publicPage.getByRole("textbox", { name: "Primera empresa", exact: true }).fill("Empresa bloqueada");
        let creates = 0;
        const requested = (request) => { if (new URL(request.url()).pathname === "/api/auth/business-signup" && request.method() === "POST") creates++; };
        publicPage.on("request", requested);
        try {
          for (const [slug, availability, text] of [["-invalida", "Invalid", "Usá letras minúsculas, números y guiones."], ["admin", "Reserved", "Esa dirección está reservada."], [business.slug, "Taken", "Esa dirección ya la usa otra organización."]]) {
            const checked = publicPage.waitForResponse((response) => endpoint("/api/public-site/slug-availability", "GET")(response) && new URL(response.url()).searchParams.get("slug") === slug);
            await publicPage.getByRole("textbox", { name: /Dirección de tu página/ }).fill(slug);
            const response = await checked;
            if (availability === "Invalid") await assertPlatformProblem(response, 400, "Tenancy.TenantSlug.Invalid");
            else await requireSlugAvailability(response, slug, availability);
            await publicPage.getByText(text, { exact: true }).waitFor();
            await publicPage.getByRole("button", { name: "Crear organización", exact: true }).click();
          }
          assert.equal(creates, 0, "Las tres direcciones inválidas no deben enviar un alta.");
        } finally { publicPage.off("request", requested); }
        return "Direcciones inválida, admin reservada y slug ocupado muestran sus errores; ninguna envió una creación.";
      }, [6]);
      if (!secondDetailsReady) await h.block("POL-08", "No se pudo abrir el formulario de una segunda organización del Dueño.", publicPage);
      else await record(8, publicPage, async () => {
        const name = `Segunda integral ${h.width}`;
        await fillOrganization(publicPage, name, `limite-${h.width}-${randomUUID().slice(0, 8)}`);
        const created = publicPage.waitForResponse(endpoint("/api/auth/business-signup"));
        await publicPage.getByRole("button", { name: "Crear organización", exact: true }).click();
        await requireOrganizationLimit(await created, 1);
        await publicPage.getByText("Llegaste al límite de 1 organización propia.", { exact: false }).first().waitFor();
        const tenants = await h.api(operatorPage, `/api/platform/tenants/paged?page=1&pageSize=10&search=${encodeURIComponent(name)}`);
        assert.equal(tenants.status(), 200);
        assert.equal((await tenants.json()).items.length, 0, "La segunda organización rechazada no debe existir.");
        return "La segunda organización fue rechazada con 409 Tenancy.Organization.LimitReached, limit1 y aviso visible; sigue habiendo una sola.";
      }, [6]);
      await record(9, operatorPage, async () => {
        await closePublicIdentity(h, publicPage, state);
        await setPolicy({ consumerSignup: "Open", businessSignup: "RequiresApproval", maxOwnedOrganizations: 1 }, "Prueba integral: exigir aprobación de nuevas organizaciones.");
        return "La sesión pública anterior se cerró por UI y RequiresApproval quedó confirmado después de F5.";
      }, [1]);
      await record(10, publicPage, async () => {
        pendingOrganization = `Pendiente integral ${h.width} ${randomUUID().slice(0, 8)}`;
        await openNewBusinessDetails(h, publicPage, syntheticEmail("aprobacion"));
        await fillOrganization(publicPage, pendingOrganization, `pendiente-${h.width}-${randomUUID().slice(0, 8)}`);
        const created = publicPage.waitForResponse(endpoint("/api/auth/business-signup"));
        await publicPage.getByRole("button", { name: "Crear organización", exact: true }).click();
        const response = await created; assert.equal(response.status(), 200);
        assert.equal((await response.json()).requiresApproval, true);
        await publicPage.getByRole("heading", { name: "Recibimos el pedido", exact: true }).waitFor();
        assert.equal(await publicPage.getByRole("button", { name: `Entrar a ${pendingOrganization}`, exact: true }).count(), 0);
        return "Alta real con requiresApproval=true: Recibimos el pedido, sin botón de entrada empresarial.";
      }, [9]);
      await record(11, publicPage, async () => {
        await publicPage.goto(new URL("/org", h.base).href);
        await publicPage.getByRole("heading", { name: `Estamos revisando ${pendingOrganization}`, exact: true }).waitFor();
        await publicPage.getByText("Te avisamos por correo cuando esté aprobada.", { exact: true }).waitFor();
        assert.equal(await publicPage.getByRole("link", { name: `${pendingOrganization} Centro`, exact: true }).count(), 0);
        return "La puerta empresarial no presentó datos privados: mostró la organización pendiente de aprobación y su explicación.";
      }, [10]);
    },
    restore: async (baseline) => {
      const result = await record(12, operatorPage, async () => {
        current = await openPlatformSettings(operatorPage, h.base.origin);
        current = await savePlatformSettings(operatorPage, current, restorableSettings(baseline), "Prueba integral: restaurar las políticas iniciales antes de salir.");
        return "Políticas, máximo y contactos restaurables originales restaurados por UI y verificados después de F5.";
      });
      assert.ok(result.ok, "La restauración de políticas por UI no se completó; revisar POL-12 antes de seguir otras suites.");
    },
    close: async () => {
      const failures = [];
      try { await closePublicIdentity(h, publicPage, state); } catch (error) { failures.push(error); }
      if (state.operatorSignedIn) { try { await h.signOut(operatorPage); } catch (error) { failures.push(error); } }
      publicPage.off("response", observeVerification);
      for (const page of [operatorPage, publicPage]) {
        try { await stopConfirmingRecentAuthentication(page); await page.close(); } catch (error) { failures.push(error); }
      }
      if (failures.length) throw new AggregateError(failures, "No se completó la salida por UI de las identidades de políticas.");
    },
  });
}
