import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { journeyDate, renderIndex, recordedStep, safeDiagnostic, signOutMobile, waitCodeMessage, waitForTransientNotices, withCleanup } from "./recorrido-usuario.mjs";

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
