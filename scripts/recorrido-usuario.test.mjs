import assert from "node:assert/strict";
import { test } from "node:test";
import { EventEmitter } from "node:events";
import { chromium } from "playwright";
import { journeyDate, journeyFailure, parseJourneyArguments, platformAssistantLimitation, renderIndex, recordedStep, safeDiagnostic, signOutMobile, waitCodeMessage, waitForPlatformHome, waitForTransientNotices, withCleanup } from "./recorrido-usuario.mjs";
import { baseUrl } from "./recorrido-usuario-entorno.mjs";
import { execFileSync } from "node:child_process";
import { e8Definitions, e8ManualChecks, e8SourceRevision, requireE8Control } from "./recorrido-usuario-whatsapp.mjs";
import * as whatsappJourney from "./recorrido-usuario-whatsapp.mjs";
import { botOption, e11Definitions, e11ManualChecks, enterPersonalHome, nationalPhone, outboundCount, runE11Journey } from "./recorrido-usuario-e11.mjs";
import { e9Definitions, e9ManualChecks, factorSecretMasks, newcomerOf, operatorNameOf, runE9Journey, waitForAuditList } from "./recorrido-usuario-e9.mjs";
import { awaitHomePastNotice, base12Definitions, base12ManualChecks, bellLabel, importedPhoneOf, invitationLinkFrom, isFullDateTime, runBase12Journey,
  whileHeld, workingButtonProblems, workingButtonState } from "./recorrido-usuario-base12.mjs";
import { base12bDefinitions, base12bManualChecks, base12bPlatformCaptures, chatDeliveryOrder, chatPhones, dailyEmailLimitProblems, dailyEmailLimitText,
  dailyLimitProblems, decodeMimeWords, deliveryWords, emailDeliveryReasons, emptiesLast, invitationDeliveryOrder, invitationQuotaOrders, isJoinedPercent,
  isMonthRange, isReviewedLine, keyUnreadableText, resendUncertainText, runBase12bJourney, screenWaitProblems, senderNameOf, uncertainChatReason,
  waitInHours } from "./recorrido-usuario-base12b.mjs";
import { readFileSync } from "node:fs";

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
  const privateText = "123456 +5491134567880 privado@example.test https://localtest.me:5174/invitacion#token-secreto";
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

test("E11-15: en la compu la persona nueva acepta el aviso del asistente de su Inicio, aunque abra después del menú", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // El menú ya se ve cuando abre el aviso modal, que lo tapa: así cortó la salida de E11-15 (2026-11-19).
    await page.setContent('<header><button>•••• 7884, Personal</button></header><main></main>');
    await page.evaluate(() => {
      setTimeout(() => {
        document.querySelector("header").setAttribute("aria-hidden", "true");
        document.querySelector("main").innerHTML = '<h2>¿Qué querés consultar?</h2><div role="dialog" aria-label="Antes de tu primera consulta"><button>Entendido</button></div>';
        document.querySelector('[role="dialog"] button').addEventListener("click", () => {
          document.body.dataset.accepted = "explicit";
          document.querySelector('[role="dialog"]').remove();
          document.querySelector("header").removeAttribute("aria-hidden");
        });
      }, 50);
    });
    const awaitApp = (target) => target.getByRole("button", { name: /, Personal$/ }).waitFor({ timeout: 2_000 });
    await enterPersonalHome(page, 1440, { awaitApp });
    assert.equal(await page.locator("body").getAttribute("data-accepted"), "explicit");
    await awaitApp(page);
    // En el teléfono el Inicio no monta el asistente (vive en /asistente): no se espera un aviso que no llega.
    const order = [];
    await enterPersonalHome(page, 390, { awaitApp: async () => { order.push("app"); }, acceptNotice: async () => { order.push("aviso"); } });
    assert.deepEqual(order, ["app"]);
  } finally { await browser.close(); }
});

test("E9-07: Auditoría espera a que llegue la lista antes de buscar los eventos del autenticador", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // El encabezado ya estaba y la lista seguía cargando: la búsqueda no encontró nada y cortó E9-07 a 1440 (2026-11-26).
    await page.setContent('<h1>Auditoría</h1><table><tbody><tr><td role="status">Cargando</td></tr></tbody></table>');
    await page.evaluate(() => setTimeout(() => { document.querySelector("tbody").innerHTML = "<tr><td>Restableció el autenticador</td></tr>"; }, 100));
    assert.equal(await page.getByText("Restableció el autenticador", { exact: true }).count(), 0);
    await waitForAuditList(page, ["Configuró el autenticador", "Restableció el autenticador"]);
    assert.equal(await page.getByText("Restableció el autenticador", { exact: true }).count(), 1);
    // Con «Cargar más» a la vista y ningún evento buscado en la primera página, también sigue.
    await page.setContent('<table><tbody><tr><td>Otro evento</td></tr></tbody></table><button>Cargar más</button>');
    await waitForAuditList(page, ["Configuró el autenticador"]);
  } finally { await browser.close(); }
});

test("B12-07: en la compu, si el aviso del asistente abre antes que el menú del perfil, se acepta antes de esperar el menú", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // El aviso modal abrió primero y tapó el menú que esperaba awaitApp: así cortó B12-07 a 1440 (2026-11-26).
    await page.setContent('<header aria-hidden="true"><button>Persona Base 1440, Personal</button></header><main><div role="dialog" aria-label="Antes de tu primera consulta"><button>Entendido</button></div></main>');
    await page.evaluate(() => document.querySelector('[role="dialog"] button').addEventListener("click", () => {
      document.body.dataset.accepted = "explicit";
      document.querySelector('[role="dialog"]').remove();
      document.querySelector("header").removeAttribute("aria-hidden");
    }));
    const awaitApp = (target) => target.getByRole("button", { name: /, Personal$/ }).waitFor({ timeout: 2_000 });
    await awaitHomePastNotice(page, { awaitApp, phone: false });
    assert.equal(await page.locator("body").getAttribute("data-accepted"), "explicit");
    // Con el menú a la vista y sin aviso sigue de largo; en el teléfono no busca un aviso que no llega.
    await awaitHomePastNotice(page, { awaitApp, phone: false });
    const order = [];
    await awaitHomePastNotice(page, { awaitApp: async () => { order.push("app"); }, phone: true });
    assert.deepEqual(order, ["app"]);
  } finally { await browser.close(); }
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

test("la base de la 12 tiene sus pasos en orden, cubre la I4 por área y deja el bot real de WhatsApp para probar a mano", () => {
  assert.deepEqual(base12Definitions.map((step) => step.id), Array.from({ length: 14 }, (_, index) => `B12-${String(index + 1).padStart(2, "0")}`));
  for (const step of base12Definitions) assert.ok(step.title.startsWith("B12 · ") && step.expected && !step.controlled);
  const titles = base12Definitions.map((step) => step.title.slice("B12 · ".length));
  // La campana de los tres accesos; una tabla, una fecha y un botón, y una pantalla a 320, en cada área.
  for (const area of ["la organización", "la persona", "Plataforma"]) assert.ok(titles.includes(`La campana de ${area}`), area);
  for (const area of ["Organización", "Persona", "Plataforma"]) {
    assert.ok(titles.includes(`${area}: una tabla, una fecha y un botón`), area);
    assert.ok(titles.includes(`${area} a 320`), area);
  }
  for (const title of ["Un link del otro acceso", "Dar de baja y reactivar", "Borrar mi cuenta y cancelar el borrado", "Cargar teléfonos sin la casilla", "Cargar teléfonos con la casilla"])
    assert.ok(titles.includes(title), title);
  assert.ok(base12Definitions.find((step) => step.title.endsWith("sin la casilla")).expected.includes("WhatsApp.PhoneImport.ConsentRequired"));
  assert.ok(base12ManualChecks.some((item) => item.includes("«Entrar a mi cuenta»") && item.includes("/login")));
  assert.ok(base12ManualChecks.some((item) => item.startsWith("WhatsApp real") && item.includes("Cargar teléfonos")));
});

test("la campana se nombra con lo que tiene sin leer y una fecha se ve completa, con su año y su hora", () => {
  assert.equal(bellLabel(0), "Avisos");
  assert.equal(bellLabel(3), "Avisos: 3");
  for (const wrong of [-1, 1.5, "2"]) assert.throws(() => bellLabel(wrong));
  for (const text of ["09/11/2026, 14:05", " 01/01/2027, 00:00\n"]) assert.equal(isFullDateTime(text), true, text);
  for (const text of ["09/11/26, 14:05", "09/11/2026", "9/11/2026, 14:05", "09/11/2026, 14:05:30", "09/11/2026 14:05", "hace 2 horas",
    "hoy 14:05", "11/09/2026, 2:05 PM"])
    assert.equal(isFullDateTime(text), false, text);
});

test("el enlace de una invitación sale de su .eml, en el origen del front y con el token en el fragmento", () => {
  const eml = (line) => "To: e2e-b12@example.test\r\nContent-Type: multipart/alternative; boundary=frontera\r\n\r\n--frontera\r\n"
    + `Content-Type: text/plain; charset=utf-8\r\n\r\nTe invitaron.\r\n${line}\r\n--frontera\r\nContent-Type: text/html\r\n\r\n<p>Te invitaron.</p>\r\n--frontera--\r\n`;
  const link = `${baseUrl.origin}/invitacion#abc_DEF-123`;
  assert.equal(invitationLinkFrom(eml(link), baseUrl), link);
  assert.equal(invitationLinkFrom(eml("Sin enlace."), baseUrl), null);
  assert.throws(() => invitationLinkFrom(eml("https://otro.example.test/invitacion#abc"), baseUrl), /origen del front/);
});

test("la base de la 12 carga en «Cargar teléfonos» un celular sintético propio por ancho, que no usa otro paso", () => {
  const phones = [1440, 390].map(importedPhoneOf);
  assert.equal(new Set(phones).size, 2);
  for (const phone of phones) {
    assert.match(phone, /^\+54911345678\d{2}$/u, "Sintético de la fixture.");
    assert.ok(Number(phone.slice(-2)) > 92 && !phone.endsWith("99"), "El resto del recorrido va del 80 al 92 y el 99 es del operador.");
    assert.match(nationalPhone(phone), /^11 3456-78\d{2}$/u);
  }
});

test("un botón que trabaja queda apagado, con el aro, su gerundio y su texto, sin atenuarse ni achicarse", () => {
  const expected = { label: "Invitar", pendingLabel: "Invitando…", width: 80 };
  const working = { disabled: true, busy: "true", ring: true, text: "InvitarInvitando…", opacity: "1", width: 80 };
  assert.deepEqual(workingButtonProblems(working, expected), []);
  assert.deepEqual(workingButtonProblems({ ...working, width: 96 }, expected), [], "Si el gerundio es más largo, crece lo justo.");
  for (const [patch, problem] of [[{ disabled: false }, "acepta otro clic"], [{ busy: null }, "no avisa que trabaja"], [{ ring: false }, "no tiene el aro"],
    [{ text: "Invitar" }, "no dice «Invitando…»"], [{ text: "Invitando…" }, "perdió su texto «Invitar»"], [{ opacity: "0.5" }, "se atenúa"], [{ width: 60 }, "se achica"]])
    assert.deepEqual(workingButtonProblems({ ...working, ...patch }, expected), [problem], problem);
});

test("retener el pedido muestra el botón trabajando y después lo deja seguir, sin cambiarlo", async () => {
  // Una página local con el botón de Button.tsx mientras guarda; el pedido lo responde la ruta de la prueba, no el producto.
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(2_000);
    const served = [];
    const html = `<main><button type="button" data-slot="button">Guardar</button><p role="status"></p><button type="button">Mudo</button></main><script>
      const button = document.querySelector('[data-slot="button"]');
      button.addEventListener("click", async () => {
        button.disabled = true; button.dataset.pending = "true"; button.setAttribute("aria-busy", "true");
        button.innerHTML = '<span aria-hidden="true" style="visibility:hidden">Guardar</span><span data-slot="button-ring"></span><span>Guardando…</span>';
        const reply = await fetch("/api/guardar", { method: "POST" });
        button.disabled = false; delete button.dataset.pending; button.removeAttribute("aria-busy"); button.textContent = "Guardar";
        document.querySelector('[role="status"]').textContent = "Guardado " + reply.status;
      });</script>`;
    await page.route(`${baseUrl.origin}/**`, (route) => {
      if (new URL(route.request().url()).pathname !== "/api/guardar") return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
      served.push(route.request().method());
      return route.fulfill({ status: 204 });
    });
    await page.goto(new URL("/prueba", baseUrl).href);
    const button = page.getByRole("button", { name: "Guardar", exact: true });
    const width = (await button.boundingBox()).width;
    await whileHeld(page, { method: "POST", path: "/api/guardar" }, () => button.click(), async () => {
      assert.deepEqual(served, [], "Mientras se retiene, el pedido no llegó.");
      const state = await workingButtonState(page.locator('[data-slot="button"][data-pending="true"]'));
      assert.deepEqual(workingButtonProblems(state, { label: "Guardar", pendingLabel: "Guardando…", width }), []);
    });
    await page.getByRole("status").filter({ hasText: "Guardado 204" }).waitFor();
    assert.deepEqual(served, ["POST"]);
    // Un clic que no manda nada no se queda esperando, y la ruta que retiene no queda puesta.
    await assert.rejects(whileHeld(page, { method: "POST", path: "/api/guardar" }, () => page.getByRole("button", { name: "Mudo", exact: true }).click(),
      async () => { throw new Error("Sin pedido no hay nada que mirar."); }, { timeout: 300 }), /no mandó su pedido/);
    await page.evaluate(() => { document.querySelector('[role="status"]').textContent = ""; });
    await button.click();
    await page.getByRole("status").filter({ hasText: "Guardado 204" }).waitFor();
    assert.deepEqual(served, ["POST", "POST"]);
  } finally { await browser.close(); }
});

test("sin el correo aislado del entorno o sin las sesiones del recorrido, la base de la 12 no abre pantallas ni se declara aprobada", async () => {
  const touched = [];
  const page = new Proxy({}, { get: (_, name) => { touched.push(String(name)); return () => {}; } });
  const record = async () => { touched.push("record"); };
  const env = { files: async () => [], messages: async () => [], code: async () => "" };
  const journey = { page, platformPage: page, width: 1440, env, base: baseUrl, record, signOut: async () => {}, awaitApp: async () => {}, login: async () => {},
    requestCode: async () => "", verify: async () => ({}), owner: "e2e-recorrido-empresa@example.test", organization: "Recorrido 1440",
    person: { email: "e2e-recorrido-persona@example.test", name: "Alex Recorrido" } };
  await assert.rejects(runBase12Journey({ ...journey, env: {} }), /correo aislado/);
  await assert.rejects(runBase12Journey({ ...journey, person: undefined }), /persona del paso 14/);
  await assert.rejects(runBase12Journey({ ...journey, login: undefined }), /sesiones/);
  assert.deepEqual(touched, []);
});

test("la segunda parte de la base tiene sus pasos en orden, y lo que el preparador no dejaba (B-2 y B-3) ya es paso", () => {
  assert.deepEqual(base12bDefinitions.map((step) => step.id), Array.from({ length: 15 }, (_, index) => `B12B-${String(index + 1).padStart(2, "0")}`));
  for (const step of base12bDefinitions) assert.ok(step.title.startsWith("B12B · ") && step.expected && !step.controlled);
  const titles = base12bDefinitions.map((step) => step.title.slice("B12B · ".length));
  for (const expected of ["Un rol en áreas plegables", "Un permiso ajeno da 403 con su texto", "El chat del Inicio sin cupo", "Dos subidas a la vez",
    "Un modelo nuevo en dos pasos", "Una fecha, un porcentaje y un mes como rango", "Un aviso de cada tipo", "Elegir con la pieza", "Ordenar una tabla",
    "El plazo de los chats y el nombre de los correos", "Salir con dos pestañas abiertas", "Una invitación en cada estado de entrega",
    "Un mensaje «Sin confirmar» revisado", "La clave ilegible en las dos configuraciones", "Invitar hasta el tope"]) assert.ok(titles.includes(expected), expected);
  assert.deepEqual(base12bManualChecks, []);
});

// Los textos que esperan los pasos 12 a 15 son los de los recursos: si cambia uno, el paso cambia con él.
const locale = (file) => JSON.parse(readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8"));

test("B12B-12: la entrega de una invitación por correo, su (i) y la confirmación de reenviarla dicen lo de los recursos", () => {
  const enums = locale("locales/es/enums.json").InvitationDeliveryStatus;
  const delivery = locale("locales/es/common.json").invitationDelivery;
  assert.deepEqual(deliveryWords, enums);
  assert.deepEqual(emailDeliveryReasons, { Pending: delivery.why.Pending, Uncertain: delivery.why.UncertainEmail, Failed: delivery.why.FailedEmail });
  assert.equal(resendUncertainText, delivery.resend.descriptionEmail.replace("{{person}}", delivery.resend.thePerson));
  assert.deepEqual(invitationDeliveryOrder("e2e-b12b-entrega@example.test", "Uncertain"), { kind: "invitation", email: "e2e-b12b-entrega@example.test", outcome: "Uncertain" });
  assert.deepEqual(invitationDeliveryOrder("e2e-b12b-entrega@example.test", "Failed").outcome, "Failed");
  assert.throws(() => invitationDeliveryOrder("persona@gmail.com", "Uncertain"), /prueba/);
  assert.throws(() => invitationDeliveryOrder("e2e-b12b-entrega@example.test", "Sent"));
});

test("B12B-13: el mensaje «Sin confirmar» del chat, su (i) y quién lo revisó, en la organización y en Plataforma", () => {
  const thread = locale("modules/whatsapp/locales/es/chats.json").thread;
  assert.equal(deliveryWords.Uncertain, thread.uncertain);
  assert.equal(uncertainChatReason, thread.uncertainInfo);
  assert.equal(thread.markReviewed, "Marcar como revisado");
  assert.ok(isReviewedLine(thread.reviewedBy.replace("{{name}}", "Cuenta E2E").replace("{{when}}", "25/11/2026, 22:22")));
  assert.equal(isReviewedLine("Lo revisó Cuenta E2E · 25/11/2026 22:22"), false);
  assert.equal(isReviewedLine("Revisado · 25/11/2026, 22:22"), false);
  // El cliente de la E11 en cada ancho, y una consulta propia de Plataforma, distinta en cada ancho.
  assert.deepEqual(chatPhones(1440), { organization: "+5491134567884", platform: "+5491134567872" });
  assert.deepEqual(chatPhones(390), { organization: "+5491134567885", platform: "+5491134567873" });
  assert.throws(() => chatPhones(320));
  assert.deepEqual(chatDeliveryOrder("platform", "+5491134567872"), { kind: "chatMessage", scope: "platform", phone: "+5491134567872", outcome: "Uncertain" });
  assert.throws(() => chatDeliveryOrder("organization", "+5491155550000"), /sintético/);
  assert.throws(() => chatDeliveryOrder("company", "+5491134567872"));
});

test("B12B-14: la clave ilegible dice el texto de la configuración del asistente", () => {
  const settings = locale("modules/assistant/locales/es/assistant.json").settings;
  assert.equal(keyUnreadableText, settings.issues.keyUnreadable);
  assert.equal(settings.replaceKey, "Reemplazar clave");
});

test("B12B-15: el tope de invitaciones responde 429 con la espera en horas, y la pantalla la dice en horas en el botón", () => {
  assert.deepEqual(invitationQuotaOrders("e2e-recorrido@example.test"), { fill: { kind: "fill", email: "e2e-recorrido@example.test", remaining: 1 },
    release: { kind: "release", email: "e2e-recorrido@example.test" } });
  assert.throws(() => invitationQuotaOrders("e2e-recorrido@example.test", 11));
  assert.throws(() => invitationQuotaOrders("persona@gmail.com"));
  // Como formatWait del front: «22 h 53 min», con los minutos para arriba.
  assert.equal(waitInHours(82345), "22 h 53 min");
  assert.equal(waitInHours(3600), "1 h");
  assert.equal(waitInHours(7201), "2 h 1 min");
  assert.throws(() => waitInHours(59 * 60));
  const problem = { code: "Messaging.Email.DailyLimit", retryAfter: 83000, detail: dailyEmailLimitText };
  assert.deepEqual(dailyEmailLimitProblems(429, problem, "83000"), []);
  assert.deepEqual(dailyEmailLimitProblems(201, problem, "83000"), ["respondió 201 y no 429"]);
  assert.deepEqual(dailyEmailLimitProblems(429, { ...problem, retryAfter: 59 }, "59"), ["la espera no es de horas"]);
  assert.deepEqual(dailyEmailLimitProblems(429, problem, "60"), ["Retry-After no dice la misma espera"]);
  assert.deepEqual(dailyEmailLimitProblems(429, { ...problem, code: "Security.RateLimit.Exceeded", detail: "Hiciste muchos pedidos seguidos." }, "83000"),
    ["el código es Security.RateLimit.Exceeded", "el aviso no es el del tope del correo"]);
  // La pantalla, como Mi cuenta: «Reintentá en …» (`errors:retryIn`) en horas y minutos, que corre mientras se mira.
  const errors = locale("locales/es/errors.json");
  assert.equal(errors.retryIn.replace("{{time}}", waitInHours(82345)), "Reintentá en 22 h 53 min");
  assert.deepEqual(screenWaitProblems("Reintentá en 22 h 53 min", 82345), []);
  assert.deepEqual(screenWaitProblems(" Reintentá en\n22 h 52 min ", 82345), []);
  assert.deepEqual(screenWaitProblems("Reintentá en 23 h", 82800), []);
  assert.deepEqual(screenWaitProblems("Reintentá en 22 h 50 min", 82345), ["el botón dice 1370 min y el 429 1373 min"]);
  assert.deepEqual(screenWaitProblems("Reintentá en 23 h", 82345), ["el botón dice 1380 min y el 429 1373 min"]);
  assert.deepEqual(screenWaitProblems("Reintentá en 59:59", 3599), ["el botón dice «Reintentá en 59:59» y no la espera en horas"]);
  assert.deepEqual(screenWaitProblems("Invitar", 82345), ["el botón dice «Invitar» y no la espera en horas"]);
});

test("la segunda parte corre sus quince pasos en orden y captura en la pestaña del operador los que terminan ahí", async () => {
  const page = { url: () => "https://localtest.me:5174/org", name: "organización" };
  const platformPage = { url: () => "https://localtest.me:5174/plataforma", name: "plataforma" };
  const recorded = [];
  const record = async (id, width, getPage, action) => { recorded.push([id, getPage().name, typeof action]); };
  await runBase12bJourney({ page, platformPage, width: 1440, env: { command: async () => ({}), files: async () => [], messages: async () => [] }, base: baseUrl,
    record, signOut: async () => {}, awaitApp: async () => {}, login: async () => {}, owner: "e2e-recorrido-empresa@example.test",
    organization: "Recorrido 1440", operator: "e2e-a3-operator@example.test" });
  assert.deepEqual(recorded.map(([id]) => id), base12bDefinitions.map((step) => step.id));
  assert.deepEqual([...base12bPlatformCaptures].sort(), ["05", "13", "14"]);
  for (const [id, target, action] of recorded) {
    assert.equal(target, base12bPlatformCaptures.has(id.slice(5)) ? "plataforma" : "organización", id);
    assert.equal(action, "function", id);
  }
});

test("el mes va como rango del primero al último día, y el porcentaje va pegado", () => {
  assert.equal(isMonthRange("01/11/2026 – 30/11/2026"), true);
  assert.equal(isMonthRange("01/02/2028 – 29/02/2028"), true);
  assert.equal(isMonthRange("01/02/2027 – 29/02/2027"), false);
  assert.equal(isMonthRange("noviembre de 2026"), false);
  assert.equal(isMonthRange("01/11/2026 - 30/11/2026"), false);
  assert.equal(isJoinedPercent("80%"), true);
  assert.equal(isJoinedPercent("12,5%"), true);
  assert.equal(isJoinedPercent("80 %"), false);
});

test("lo vacío de una columna ordenada va al final", () => {
  assert.equal(emptiesLast(["20/10/2026", "21/10/2026", "—", "—"]), true);
  assert.equal(emptiesLast(["21/10/2026", "20/10/2026", ""]), true);
  assert.equal(emptiesLast(["—", "20/10/2026"]), false);
  assert.equal(emptiesLast(["20/10/2026"]), true);
});

test("el tope del día nombra la organización, vuelve a las 00:00 y dice la hora de la organización", () => {
  const ok = "Usaste tus 50 consultas de hoy en Empresa E2E. Vuelven el 26/11/2026, a las 00:00, hora de Empresa E2E.";
  assert.deepEqual(dailyLimitProblems(ok, "Empresa E2E"), []);
  assert.deepEqual(dailyLimitProblems(ok.replace("a las 00:00", "a las 21:00"), "Empresa E2E"), ["no dice que vuelven a las 00:00 con la fecha"]);
  assert.deepEqual(dailyLimitProblems(ok.replace("hora de Empresa E2E", "hora de tu perfil"), "Empresa E2E"), ["no nombra la hora de la organización"]);
});

test("el nombre con que firma un correo sale de su From, también codificado", () => {
  assert.equal(senderNameOf("To: x@example.test\r\nFrom: \"Tienda Recorrido\" <no-responder@example.test>\r\n"), "Tienda Recorrido");
  assert.equal(senderNameOf("From: =?utf-8?B?" + Buffer.from("Ñandú Recorrido").toString("base64") + "?= <a@example.test>"), "Ñandú Recorrido");
  assert.equal(decodeMimeWords("=?utf-8?Q?Caf=C3=A9_Recorrido?="), "Café Recorrido");
});

test("sin las órdenes del entorno o sin las sesiones del recorrido, la segunda parte de la base no abre pantallas ni se declara aprobada", async () => {
  const touched = [];
  const page = new Proxy({}, { get: (_, name) => { touched.push(String(name)); return () => {}; } });
  const record = async () => { touched.push("record"); };
  const env = { command: async () => ({}), files: async () => [], messages: async () => [] };
  const journey = { page, platformPage: page, width: 1440, env, base: baseUrl, record, signOut: async () => {}, awaitApp: async () => {}, login: async () => {},
    owner: "e2e-recorrido-empresa@example.test", organization: "Recorrido 1440", operator: "e2e-a3-operator@example.test" };
  await assert.rejects(runBase12bJourney({ ...journey, env: { files: env.files } }), /órdenes y el correo aislados/u);
  await assert.rejects(runBase12bJourney({ ...journey, operator: undefined }), /el operador/u);
  await assert.rejects(runBase12bJourney({ ...journey, login: undefined }), /sesiones/u);
  assert.deepEqual(touched, []);
});
