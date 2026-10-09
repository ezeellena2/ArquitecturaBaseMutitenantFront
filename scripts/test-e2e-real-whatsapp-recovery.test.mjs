import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { newPlatformContext, recoveryRow, selectRecovery, waitForPlatformSession } from "./test-e2e-real-whatsapp-recovery.mjs";

const request = { id: "approve-target", previousMethodType: "Phone", newMethodType: "Phone", previousMethod: "•••• 7880", newMethod: "•••• 7882", status: "Pending" };
const other = { ...request, id: "reject-other", newMethod: "•••• 7884" };
const previous = "+5491134567880", next = "+5491134567882";

test("selecciona un único pedido por ambos Phone enmascarados y rechaza ambigüedad", () => {
  assert.equal(selectRecovery([other, request], previous, next), request);
  for (const items of [[], [{ ...request, previousMethod: "•••• 7881" }], [{ ...request, newMethodType: "Email" }], [request, { ...request, id: "duplicate" }]]) {
    assert.throws(() => selectRecovery(items, previous, next), /pedido Phone único/);
  }
});

let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

// DOM local sólo para probar el selector; no intercepta API ni crea sesiones del runner real.
for (const width of [1440, 390]) test(`elige sólo la fila de recuperación correspondiente en ${width}`, async () => {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  try {
    const page = await context.newPage();
    const values = [other, request].map((item) => `<span>${item.previousMethod}</span><span>${item.newMethod}</span><button aria-label="Acciones de mismo nombre" onclick="document.body.dataset.selected='${item.id}'">Acciones</button>`);
    await page.setContent(width === 390 ? `<ul>${values.map((value) => `<li>${value}</li>`).join("")}</ul>` : `<table><tbody>${values.map((value) => `<tr><td>${value}</td></tr>`).join("")}</tbody></table>`);
    const row = recoveryRow(page, selectRecovery([other, request], previous, next));
    assert.equal(await row.count(), 1);
    await row.getByRole("button", { name: /^Acciones de/ }).click();
    assert.equal(await page.locator("body").getAttribute("data-selected"), request.id);
  } finally { await context.close(); }
});

for (const width of [1440, 390]) test(`la sesión de Plataforma espera la UI privada, no la ruta del formulario, en ${width}`, async () => {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  try {
    const page = await context.newPage();
    await page.setContent(`<h1>Ingresá a Plataforma</h1><button onclick="document.querySelector('#private').hidden=false">Terminar autorización</button>
      <div id="private" hidden><h1>Organizaciones</h1>${width === 390 ? '<nav aria-label="Secciones"><a href="#">Organizaciones</a></nav>' : '<button>Operador E2E, Plataforma</button>'}</div>`);
    let accepted = false;
    let ready = false; const waiting = waitForPlatformSession(page, () => { accepted = true; }).then(() => { ready = true; });
    await page.evaluate(() => document.title); assert.equal(ready, false);
    await page.getByRole("button", { name: "Terminar autorización", exact: true }).click();
    await waiting; assert.equal(ready, true); assert.equal(accepted, false);
  } finally { await context.close(); }
});

for (const width of [1440, 390]) test(`acepta términos por UI antes de esperar Plataforma en ${width}`, async () => {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  try {
    const page = await context.newPage(); page.setDefaultTimeout(2_000);
    await page.setContent(`<h1>Ingresá a Plataforma</h1><button onclick="document.querySelector('#terms').hidden=false">Terminar autorización</button>
      <section id="terms" hidden><h1>Actualizamos los términos</h1><label><input type="checkbox">Leí y acepto los Términos y la Política de privacidad</label>
      <button onclick="if(document.querySelector('input').checked){document.querySelector('#terms').hidden=true;document.querySelector('#private').hidden=false}">Aceptar y seguir</button></section>
      <div id="private" hidden><h1>Organizaciones</h1>${width === 390 ? '<nav aria-label="Secciones"><a href="#">Organizaciones</a></nav>' : '<button>Operador E2E, Plataforma</button>'}</div>`);
    let submissions = 0; let ready = false;
    const waiting = waitForPlatformSession(page, async () => {
      assert.equal(await page.getByRole("checkbox", { name: /Leí y acepto/ }).isChecked(), true);
      assert.equal(await page.getByRole("heading", { name: "Organizaciones", exact: true }).isVisible(), false);
      submissions++; await page.getByRole("button", { name: "Aceptar y seguir", exact: true }).click();
    }).then(() => { ready = true; });
    await page.evaluate(() => document.title); assert.equal(ready, false); assert.equal(submissions, 0);
    await page.getByRole("button", { name: "Terminar autorización", exact: true }).click();
    await waiting; assert.equal(submissions, 1); assert.equal(ready, true);
  } finally { await context.close(); }
});

for (const width of [1440, 390]) test(`operador obtiene un contexto propio con el viewport ${width}`, async () => {
  const person = await browser.newContext(); const operator = await newPlatformContext(browser, width);
  try {
    assert.notEqual(operator, person);
    // Cookie sintética local del test de aislamiento, sin crear autenticación ni contactar una API.
    await person.addCookies([{ name: "actor-test", value: "person-only", domain: "example.test", path: "/" }]);
    assert.equal((await person.cookies()).length, 1); assert.equal((await operator.cookies()).length, 0);
    const personPage = await person.newPage(); const operatorPage = await operator.newPage();
    assert.notEqual(operatorPage.context(), personPage.context());
    assert.deepEqual(operatorPage.viewportSize(), { width, height: width === 390 ? 844 : 900 });
    await operator.close(); assert.equal(personPage.isClosed(), false);
  } finally { await operator.close(); await person.close(); }
});
