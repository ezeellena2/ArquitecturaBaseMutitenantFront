import assert from "node:assert/strict";
import { test } from "node:test";
import { EventEmitter } from "node:events";
import { chromium } from "playwright";
import { journeyDate, journeyFailure, parseJourneyArguments, platformAssistantLimitation, renderIndex, recordedStep, safeDiagnostic, signOutMobile, waitCodeMessage, waitForPlatformHome, waitForTransientNotices, withCleanup } from "./recorrido-usuario.mjs";
import { baseUrl } from "./recorrido-usuario-entorno.mjs";
import { execFileSync } from "node:child_process";
import { e8Definitions, e8ManualChecks, e8SourceRevision, requireE8Control } from "./recorrido-usuario-whatsapp.mjs";
import * as whatsappJourney from "./recorrido-usuario-whatsapp.mjs";
import { botOption, e11Definitions, e11ManualChecks, nationalPhone, outboundCount, runE11Journey } from "./recorrido-usuario-e11.mjs";
import { e9Definitions, e9ManualChecks, factorSecretMasks, newcomerOf, operatorNameOf, runE9Journey } from "./recorrido-usuario-e9.mjs";

test("la selección de ancho conserva el recorrido completo por defecto y permite sólo un ancho vigente", () => {
  assert.deepEqual(parseJourneyArguments([]), { build: true, widths: [1440, 390] });
  assert.deepEqual(parseJourneyArguments(["--no-build", "--width=390"]), { build: false, widths: [390] });
  assert.deepEqual(parseJourneyArguments(["--width=1440"]), { build: true, widths: [1440] });
  for (const args of [["--width=800"], ["--width=390", "--width=1440"], ["--width=390", "--width=390"], ["--skip=all"]]) assert.throws(() => parseJourneyArguments(args));
});

test("el índice de una corrida móvil cuenta sólo sus 55 pasos y no inventa desktop pendiente", () => {
  const report = { date: "2026-10-11", widths: [390], finished: true, cleanup: "apagado", steps: Array.from({ length: 55 }, (_, index) => ({ id: String(index + 1), title: "Paso", expected: "Guardas del guion", results: [{ width: 390, status: "passed", actual: "Pasó" }] })) };
  const html = renderIndex(report);
  assert.ok(html.includes("55/55")); assert.ok(html.includes("Recorrido aprobado"));
  assert.equal(html.includes("1440 px"), false);
});

test("la identidad del recorrido conserva la ruta y el acceso de Me después de F5", async () => {
  const identityPage = (actualAccess, status = 200) => {
    const page = new EventEmitter(); const main = {}; const request = { method: () => "GET" }; const calls = [];
    let filter; let complete;
    const me = { access: actualAccess, displayName: null, maskedPrimaryPhone: "•••• 1111" };
    page.mainFrame = () => main;
    page.goto = async (url) => { calls.push(new URL(url).pathname); };
    page.waitForResponse = (predicate) => { filter = predicate; return new Promise((resolve) => { complete = resolve; }); };
    page.reload = async () => {
      calls.push("F5"); page.emit("framenavigated", main); page.emit("request", request);
      const reply = { url: () => new URL("/api/me", baseUrl).href, request: () => request, status: () => status, json: async () => me };
      assert.ok(filter(reply)); complete(reply);
    };
    return { page, calls, me };
  };
  for (const [access, home] of [["consumer", "/"], ["business", "/org"]]) {
    const { page, calls, me } = identityPage(access);
    assert.equal(await whatsappJourney.readJourneyIdentity(page, { base: baseUrl, access }), me);
    assert.deepEqual(calls, [home, "F5"]);
    assert.equal(page.listenerCount("request"), 0);
  }
  await assert.rejects(whatsappJourney.readJourneyIdentity(identityPage("consumer").page, { base: baseUrl, access: "business" }));
  await assert.rejects(whatsappJourney.readJourneyIdentity(identityPage("business", 401).page, { base: baseUrl, access: "business" }));
});

test("E8 conserva las dos pestañas tras F5 y propaga una sesión de Plataforma que no vuelve", async () => {
  const events = [];
  const person = { reload: async () => events.push("F5 Personal") };
  const platform = { reload: async () => events.push("F5 Plataforma") };
  const awaitApp = async (page) => { assert.equal(page, person); events.push("sesión Personal"); };
  const awaitPlatformHome = async (page) => { assert.equal(page, platform); events.push("inicio privado Plataforma"); };
  await whatsappJourney.reloadJourneySessions(person, platform, { awaitApp, awaitPlatformHome });
  assert.deepEqual(events, ["F5 Personal", "sesión Personal", "F5 Plataforma", "inicio privado Plataforma"]);
  const failure = new Error("La sesión independiente no volvió.");
  await assert.rejects(whatsappJourney.reloadJourneySessions(person, platform, { awaitApp, awaitPlatformHome: async () => { throw failure; } }), (error) => error === failure);
});

test("la puerta canónica exige una autorización consumer con state y PKCE S256 antes de enviar", () => {
  const previous = { access: "business", state: true, pkce: true, method: "S256" };
  const initial = { access: "consumer", state: true, pkce: true, method: "S256" };
  assert.equal(whatsappJourney.canonicalLoginBaseline([previous, initial], 1), 2);
  for (const patch of [{ access: "platform" }, { state: false }, { pkce: false }, { method: "plain" }])
    assert.throws(() => whatsappJourney.canonicalLoginBaseline([previous, { ...initial, ...patch }], 1));
  assert.throws(() => whatsappJourney.canonicalLoginBaseline([previous], 1));
  assert.throws(() => whatsappJourney.canonicalLoginBaseline([previous, initial, initial], 1));
});

test("una autorización nueva tras Enviar código o durante el OTP sigue siendo un fallo", () => {
  const initial = { access: "consumer", state: true, pkce: true, method: "S256" };
  const authorizations = [initial];
  const ready = whatsappJourney.canonicalLoginBaseline(authorizations, 0);
  assert.doesNotThrow(() => whatsappJourney.assertNoAuthorizationBeforeProof(authorizations, ready));
  authorizations.push(initial);
  assert.throws(() => whatsappJourney.assertNoAuthorizationBeforeProof(authorizations, ready));
  assert.throws(() => whatsappJourney.assertNoAuthorizationBeforeProof([initial], undefined));
});

test("diagnóstico HTTP del recorrido omite cuerpos, destinos, pruebas y valores arbitrarios", () => {
  assert.deepEqual(whatsappJourney.safeJourneyHttp(429, { code: "Auth.LoginCode.ResendTooSoon", retryAfter: 60, email: "private@example.test", proof: "private", detail: "private" }),
    { status: 429, code: "Auth.LoginCode.ResendTooSoon", retryAfter: 60 });
  for (const code of ["private@example.test", "Auth.Phone.1234567890", "private", "A".repeat(101)]) assert.equal(whatsappJourney.safeJourneyHttp(429, { code }).code, "none");
  for (const retryAfter of [-1, 0, 1.5, "private", 86401]) assert.equal(whatsappJourney.safeJourneyHttp(429, { retryAfter }).retryAfter, null);
  assert.deepEqual(whatsappJourney.safeJourneyHttp(0, null), { status: null, code: "none", retryAfter: null });
});

test("el diagnóstico conserva fallo por límite IP sin esperar ni reenviar", async () => {
  const observed = []; let sends = 0; let waits = 0;
  await assert.rejects(whatsappJourney.sendWithCooldown(async () => { sends++; return { status: () => 429, json: async () => ({ code: "Http.TooManyRequests", retryAfter: 30, phone: "private" }) }; },
    { observe: (value) => observed.push(value), wait: async () => { waits++; } }));
  assert.equal(sends, 1); assert.equal(waits, 0);
  assert.deepEqual(observed, [{ status: 429, code: "Http.TooManyRequests", retryAfter: 30 }]);
});

test("el reenvío WhatsApp respeta cada RetryAfter del servidor y conserva la respuesta aceptada", async () => {
  const events = [];
  const replies = [
    { status: () => 429, json: async () => ({ code: "Auth.LoginCode.ResendTooSoon", retryAfter: 3 }) },
    { status: () => 429, json: async () => ({ code: "Auth.LoginCode.ResendTooSoon", retryAfter: 1 }) },
    { status: () => 202 },
  ];
  const accepted = replies[2];
  const response = await whatsappJourney.sendWithCooldown(async () => { events.push("enviar"); return replies.shift(); },
    { wait: async (milliseconds) => { events.push(milliseconds); } });
  assert.equal(response, accepted);
  assert.deepEqual(events, ["enviar", 3000, "enviar", 1000, "enviar"]);
});

test("el reenvío no oculta una cuota diaria, un fallo HTTP ni un RetryAfter inválido", async () => {
  for (const [status, problem] of [[429, { code: "WhatsApp.LoginCode.DailyLimit", retryAfter: 3600 }], [500, {}], [429, { code: "Auth.LoginCode.ResendTooSoon", retryAfter: -1 }]]) {
    let waits = 0; let sends = 0;
    await assert.rejects(whatsappJourney.sendWithCooldown(async () => { sends++; return { status: () => status, json: async () => problem }; },
      { wait: async () => { waits++; } }));
    assert.equal(sends, 1); assert.equal(waits, 0);
  }
});

test("el reenvío se corta si el servidor nunca levanta el cooldown", async () => {
  let sends = 0; let waits = 0;
  await assert.rejects(whatsappJourney.sendWithCooldown(async () => {
    sends++; return { status: () => 429, json: async () => ({ code: "Auth.LoginCode.ResendTooSoon", retryAfter: 2 }) };
  }, { wait: async () => { waits++; } }), /cinco/);
  assert.equal(sends, 5); assert.equal(waits, 4);
});

test("cancelar el recorrido interrumpe RetryAfter sin enviar otro código", async () => {
  let sends = 0;
  await assert.rejects(whatsappJourney.sendWithCooldown(async () => {
    sends++; return { status: () => 429, json: async () => ({ code: "Auth.LoginCode.ResendTooSoon", retryAfter: 60 }) };
  }, { signal: AbortSignal.abort() }), { name: "AbortError" });
  assert.equal(sends, 1);
});

test("el recorrido E8 cubre cada paso de los guiones publicados y declara los externos controlados", () => {
  const ids = e8Definitions.map((step) => step.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const name of ["ingresar-por-whatsapp", "el-bot-y-su-enlace", "agregar-un-whatsapp", "atender-una-recuperacion"]) {
    const source = JSON.parse(execFileSync("git", ["show", `${e8SourceRevision}:docs/design/recorridos/${name}.json`], { encoding: "utf8" }));
    for (const [index, published] of source.pasos.entries()) {
      const step = e8Definitions.find((item) => item.guion === name && item.paso === index + 1);
      assert.ok(step, `${name}, paso ${index + 1}`);
      assert.equal(step.route, published.ruta);
      if (published.ruta === "—") assert.equal(step.controlled, true);
    }
  }
  for (const milestone of ["A1", "N1", "N2", "N3"]) assert.ok(e8Definitions.some((step) => step.milestones?.includes(milestone)), milestone);
  for (const step of e8Definitions) assert.ok(step.expected && step.title);
  assert.ok(e8ManualChecks.some((item) => /Google/.test(item)));
  assert.ok(e8ManualChecks.some((item) => /WhatsApp real/.test(item)));
});

test("sin control publicado el recorrido no ejecuta UI ni se declara aprobado", () => {
  assert.throws(() => requireE8Control({}), /soporte privado.*mismo entorno/);
  const begin = async () => {};
  assert.equal(requireE8Control({ whatsapp: { begin } }), begin);
});

test("el fallo E8 sólo publica el tipo y conserva privados todos los mensajes del error", () => {
  const privateText = "123456 +5491134567880 privado@example.test https://localtest.me:5174/login/enlace#ticket-secreto";
  const result = journeyFailure("E8-04 a 390", [new TypeError(privateText), new Error(privateText)]);
  assert.ok(result.includes("TypeError; Error"));
  assert.ok(result.includes("pendientes no cuentan como aprobados"));
  for (const value of privateText.split(" ")) assert.ok(!result.includes(value));
});

test("el índice E8 separa aprobación automatizada, OTP controlado y pruebas manuales", () => {
  const html = renderIndex({ date: "2026-10-10", stage: "Etapas 7 y 8", finished: true, cleanup: "apagado", manual: e8ManualChecks,
    steps: [{ ...e8Definitions.find((step) => step.controlled && step.guion), results: [1440, 390].map((width) => ({ width, status: "passed", actual: "OTP leído por canal privado; no entrega Meta." })) }],
  });
  assert.ok(html.includes("Etapas 7 y 8"));
  assert.ok(html.includes("Comprobaciones automatizadas aprobadas"));
  assert.ok(!html.includes("Recorrido aprobado"));
  for (const text of ["Para probar a mano", "OTP controlado", "WhatsApp real", "Google", e8SourceRevision]) assert.ok(html.includes(text), text);
});

test("la carpeta usa la fecha de Buenos Aires aunque UTC ya sea el día siguiente", () => {
  assert.equal(journeyDate(new Date("2026-10-08T01:30:00Z")), "2026-10-07");
});

test("el índice conserva orden, esperado, resultado real y ambos tamaños, escapando HTML", () => {
  const html = renderIndex({ date: "2026-10-07", finished: false, cleanup: "pendiente", steps: [
    { id: "01", title: "Ingreso <nuevo>", expected: "Cuenta & registro", results: [
      { width: 1440, status: "passed", actual: "Ofreció <Crear>", image: "01-1440.png" },
      { width: 390, status: "pending", actual: "Pendiente" },
    ] },
    { id: "02", title: "Registro", expected: "Personal", results: [] },
  ] });
  assert.ok(html.indexOf("01 ·") < html.indexOf("02 ·"));
  for (const text of ["Esperado", "Resultado", "1440", "390", "01-1440.png", "Pendiente", "&lt;nuevo&gt;", "Cuenta &amp; registro", "Ofreció &lt;Crear&gt;"]) assert.ok(html.includes(text), text);
  assert.ok(!html.includes("<nuevo>"));
  assert.ok(!html.includes("Recorrido aprobado"));
});

test("un paso fallido guarda captura e informe y conserva el fallo", async () => {
  const events = [];
  const error = new TypeError("detalle privado");
  const result = { width: 390, status: "pending" };
  await assert.rejects(recordedStep({ result, action: async () => { throw error; },
    capture: async () => { events.push("captura"); return "fallo.png"; },
    persist: async () => { events.push("informe"); }, diagnostic: () => "POST /api/auth/login-code HTTP 400",
  }), (caught) => caught === error);
  assert.deepEqual(events, ["captura", "informe"]);
  assert.equal(result.status, "failed");
  assert.equal(result.image, "fallo.png");
  assert.ok(result.actual.includes("HTTP 400"));
  assert.ok(!result.actual.includes("detalle privado"));
});

test("la limpieza corre en orden aunque el recorrido y el cierre del navegador fallen", async () => {
  const events = [];
  await assert.rejects(withCleanup(async () => { throw new Error("recorrido"); }, [
    async () => { events.push("browser"); throw new Error("browser"); },
    async () => { events.push("entorno"); },
  ]), AggregateError);
  assert.deepEqual(events, ["browser", "entorno"]);
});

test("los diagnósticos no publican queries OIDC, códigos ni tickets largos", () => {
  const text = safeDiagnostic(`\u001b[31mhttps://localtest.me:5174/auth/callback?code=secreto&state=privado 123456 ${"a".repeat(120)}\u001b[0m`);
  assert.equal(text, "https://localtest.me:5174/auth/callback [código] [dato omitido]");
});

test("la comprobación lee el mensaje compuesto del código junto con los intentos restantes", async () => {
  // DOM local del AuthMessage real: el texto comparte su span con el detalle. Sin red, API ni base.
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(500);
    await page.setContent('<div role="alert"><span>El código no es válido.<span style="display:block">Te quedan 4 intentos.</span></span></div>');
    await waitCodeMessage(page, "El código no es válido.");
    await page.setContent('<div role="alert"><span>El código venció. Pedí uno nuevo.</span></div>');
    await waitCodeMessage(page, "El código venció. Pedí uno nuevo.");
  } finally { await browser.close(); }
});

test("la salida móvil usa Volver a Más desde Mi cuenta, que no tiene barra de secciones", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(500);
    for (const door of ['<a href="#" aria-label="Volver a Más">‹</a>', '<nav aria-label="Secciones"><a href="#">Más</a></nav>']) {
      await page.setContent(`<main>${door}</main>`);
      await page.evaluate(() => {
        delete document.body.dataset.signedOut;
        document.querySelector("a").addEventListener("click", (event) => {
          event.preventDefault();
          document.querySelector("main").innerHTML = '<button>Salir</button>';
          document.querySelector("button").addEventListener("click", () => { document.body.dataset.signedOut = "true"; });
        });
      });
      await signOutMobile(page);
      assert.equal(await page.locator("body").getAttribute("data-signed-out"), "true");
    }
  } finally { await browser.close(); }
});

test("la captura espera todos los avisos transitorios y conserva el error persistente", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(500);
    await page.setContent('<div data-sonner-toast data-type="success">Guardamos</div><div data-sonner-toast data-type="info">Agregamos</div><div data-sonner-toast data-type="error">Error persistente</div>');
    await page.evaluate(() => {
      document.addEventListener("mousemove", () => requestAnimationFrame(() => {
        document.querySelector('[data-type="success"]').remove();
        requestAnimationFrame(() => document.querySelector('[data-type="info"]').remove());
      }), { once: true });
    });
    await waitForTransientNotices(page);
    assert.equal(await page.locator('[data-sonner-toast]:not([data-type="error"])').count(), 0);
    assert.equal(await page.locator('[data-sonner-toast][data-type="error"]').innerText(), "Error persistente");
  } finally { await browser.close(); }
});

for (const width of [1440, 390]) {
  test(`Plataforma comprueba su inicio privado vigente y tras F5 a ${width}`, async () => {
    // Documento local del núcleo vigente; no levanta el producto ni sustituye el recorrido real.
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.setDefaultTimeout(500);
      const visits = [];
      const routePath = width === 390 ? "/plataforma/organizaciones" : "/plataforma";
      const content = width === 390 ? '<h1>Organizaciones</h1><nav aria-label="Secciones"><a href="/plataforma/mas">Más</a></nav>'
        : '<h1>Inicio</h1><button aria-label="Operador, Plataforma">Cuenta</button><div role="alert">No pudimos abrir esta pantalla</div><h2>Para resolver</h2>';
      await page.route(`${baseUrl.origin}/**`, (route) => {
        visits.push(new URL(route.request().url()).pathname);
        return route.fulfill({ contentType: "text/html", body: content });
      });
      await page.goto(new URL(routePath, baseUrl).href);
      await waitForPlatformHome(page);
      await page.reload();
      await waitForPlatformHome(page);
      assert.deepEqual(visits, [routePath, routePath]);
      if (width === 1440) {
        assert.equal(await page.getByRole("alert").innerText(), "No pudimos abrir esta pantalla");
        assert.equal(await page.getByRole("heading", { name: "Para resolver", exact: true }).count(), 1);
      } else {
        await page.setContent('<h1>Organizaciones</h1>');
        await assert.rejects(waitForPlatformHome(page), { name: "TimeoutError" });
      }
    } finally { await browser.close(); }
  });
}

test("Plataforma no confunde la lista Organizaciones ni otra ruta con su Inicio", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(500);
    page.setDefaultNavigationTimeout(500);
    await page.route(`${baseUrl.origin}/**`, (route) => route.fulfill({ contentType: "text/html", body: '<h1>Organizaciones</h1>' }));
    await page.goto(new URL("/plataforma", baseUrl).href);
    await assert.rejects(waitForPlatformHome(page), { name: "TimeoutError" });
    await page.goto(new URL("/plataforma/organizaciones", baseUrl).href);
    await page.setContent('<h1>Inicio</h1>');
    await assert.rejects(waitForPlatformHome(page), { name: "TimeoutError" });
  } finally { await browser.close(); }
});

test("el ingreso exige State disponible y reserva la acreditación para los seis guiones E8b", async () => {
  await assert.rejects(platformAssistantLimitation({ ok: () => false, status: () => 501 }), { name: "AssertionError" });
  const ready = await platformAssistantLimitation({ ok: () => true });
  assert.ok(ready.includes("seis guiones E8b"));
});

test("el informe no disfraza otro fallo HTTP o código como la limitación contractual E8b", async () => {
  for (const [status, code] of [[503, "General.Contract.NotImplemented"], [501, "Tenancy.Access.PlatformOnly"]]) {
    await assert.rejects(platformAssistantLimitation({ ok: () => false, status: () => status, json: async () => ({ code }) }), { name: "AssertionError" });
  }
});

test("el recorrido E11 tiene sus pasos en orden, declara los del canal privado y deja Meta para probar a mano", () => {
  assert.deepEqual(e11Definitions.map((step) => step.id), Array.from({ length: 15 }, (_, index) => `E11-${String(index + 1).padStart(2, "0")}`));
  for (const step of e11Definitions) assert.ok(step.title.startsWith("E11 · ") && step.expected);
  // Lo que pasa por WhatsAppBrowserControl (número, entrada, bot y outbox, OTP) se declara controlado; lo demás es la app.
  assert.deepEqual(e11Definitions.filter((step) => step.controlled).map((step) => step.id), ["E11-02", "E11-05", "E11-06", "E11-07", "E11-08", "E11-10", "E11-11"]);
  for (const external of ["Meta real", "WhatsApp real"]) assert.ok(e11ManualChecks.some((item) => item.startsWith(external)), external);
  assert.ok(e11ManualChecks.some((item) => /Cargar teléfonos/.test(item)));
});

test("E11 toca la fila del menú por su título y cuenta lo que salió sin aceptar una nota", () => {
  const turn = { text: "¡Hola!", list: [{ id: `bot.option.${"b".repeat(32)}`, title: "Hacer un pedido" }], buttons: [] };
  assert.deepEqual(botOption(turn, "Hacer un pedido"), { type: "list", id: `bot.option.${"b".repeat(32)}` });
  assert.throws(() => botOption(turn, "Reclamos"), /no mostró/);
  assert.throws(() => botOption({ text: null, list: [], buttons: [] }, "Hacer un pedido"), /no mostró/);
  assert.equal(outboundCount([{ kind: "Text", status: "Pending" }, { kind: "Text", status: "Sent" }]), 2);
  assert.throws(() => outboundCount([{ kind: "Note", status: "Pending" }]), /nota/);
  assert.throws(() => outboundCount([{ kind: "Text", status: "Sent", text: undefined, body: "Hola" }].map(({ kind }) => ({ kind }))), /tipo y estado/);
  assert.equal(nationalPhone("+5491134567884"), "11 3456-7884");
  assert.throws(() => nationalPhone("+541155554521"), /sintético/);
});

test("sin el control publicado, E11 no abre pantallas ni se declara aprobada", async () => {
  const touched = [];
  const page = new Proxy({}, { get: (_, name) => { touched.push(String(name)); return () => {}; } });
  const record = async () => { touched.push("record"); };
  await assert.rejects(runE11Journey({ page, platformPage: page, width: 1440, env: {}, base: baseUrl, record, signOut: async () => {}, awaitApp: async () => {},
    loginBusiness: async () => { touched.push("login"); }, organization: "Recorrido" }), /soporte privado.*mismo entorno/);
  assert.deepEqual(touched, []);
});

test("el recorrido E9 tiene sus siete pasos en orden y deja el QR con un celular real para probar a mano", () => {
  assert.deepEqual(e9Definitions.map((step) => step.id), Array.from({ length: 7 }, (_, index) => `E9-${String(index + 1).padStart(2, "0")}`));
  for (const step of e9Definitions) assert.ok(step.title.startsWith("E9 · ") && step.expected);
  assert.ok(e9ManualChecks.some((item) => item.startsWith("Celular real")));
});

test("E9 usa un operador nuevo por ancho, propio del recorrido y nunca uno de los e9 del E2E", () => {
  const operators = [1440, 390].map(newcomerOf);
  assert.equal(new Set(operators).size, 2);
  for (const email of operators) {
    assert.doesNotMatch(email, /^e2e-(e9|a1-|a3-)/u, "Ni los e9 del E2E ni los operadores del resto del recorrido.");
    assert.match(operatorNameOf(email), /^Operador E2E [a-z0-9]+$/u);
  }
  assert.equal(operatorNameOf("e2e-5b-operator@example.test"), "Operador E2E 5b");
  assert.throws(() => operatorNameOf("laura@example.com"), /preparador/);
});

test("la captura tapa el QR, la clave y los códigos de recuperación, y nada más", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<h1>Protegé tu cuenta de operador</h1><svg role="img" aria-label="Código QR para la app de autenticación" width="40" height="40"></svg>
      <span>JBSW Y3DP EHPK 3PXP</span><span>CONFIGURACIÓN</span><ul aria-label="Códigos de recuperación"><li>7KQ2-M9XD</li><li>P4TZ-8WNE</li></ul>
      <ul aria-label="Permisos"><li>Ver organizaciones</li></ul>`);
    const [qr, key, codes] = factorSecretMasks(page);
    assert.equal(await qr.count(), 1);
    assert.equal(await key.count(), 1);
    assert.equal(await key.innerText(), "JBSW Y3DP EHPK 3PXP");
    assert.equal(await codes.getByRole("listitem").count(), 2);
    await page.screenshot({ mask: factorSecretMasks(page) });
  } finally { await browser.close(); }
});

test("sin las órdenes privadas del preparador, E9 no abre pantallas ni se declara aprobada", async () => {
  const touched = [];
  const page = new Proxy({}, { get: (_, name) => { touched.push(String(name)); return () => {}; } });
  const record = async () => { touched.push("record"); };
  await assert.rejects(runE9Journey({ platformPage: page, width: 1440, env: {}, base: baseUrl, record, signOut: async () => {}, login: async () => {},
    requestCode: async () => "", verify: async () => ({}), awaitPlatformHome: async () => {}, operator: "e2e-a3-operator@example.test" }), /órdenes privadas/);
  assert.deepEqual(touched, []);
});
