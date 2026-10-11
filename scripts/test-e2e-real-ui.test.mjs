import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { ensureBusinessPageDraft, expectOrganizationModules, expectRecoveryEmailInUse, fillOtp, openAccountEmailDialog, openPhoneMore, waitForPrivateHeading } from "./test-e2e-real-ui.mjs";

for (const width of [1440, 390]) for (const whatsapp of [false, true]) test(`Agregar correo conserva el destino con WhatsApp ${whatsapp} en ${width}`, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.setContent(`<button onclick="document.querySelector('[role=dialog]').hidden=false">${whatsapp ? "Agregar correo o teléfono" : "Agregar correo"}</button>
      <section role="dialog" hidden>${whatsapp ? '<button onclick="document.querySelector(\'input\').type=\'email\'">Correo</button><button>Teléfono</button>' : ''}
      <label>Correo<input type="${whatsapp ? 'hidden' : 'email'}"></label><button>Enviar código</button></section>`);
    const dialog = await openAccountEmailDialog(page);
    await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill("ocupado@example.test");
    assert.equal(await dialog.getByRole("textbox", { name: "Correo", exact: true }).inputValue(), "ocupado@example.test");
    assert.equal(await dialog.getByRole("textbox", { name: "Código 1", exact: true }).count(), 0);
  } finally { await browser.close(); }
});

for (const bar of [false, true]) test(`Más móvil usa ${bar ? "la barra visible" : "Volver a Más desde Mi cuenta sin barra"} y espera la barra restituida`, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.setContent(bar ? '<main><h1>Inicio</h1></main><nav aria-label="Secciones"><a href="#">Más</a></nav>'
      : '<main><h1>Mi cuenta</h1><a href="#" aria-label="Volver a Más">‹</a><footer>Guardar cambios</footer></main>');
    await page.evaluate(() => {
      document.querySelector("a").addEventListener("click", (event) => {
        event.preventDefault();
        document.body.dataset.entrance = event.currentTarget.getAttribute("aria-label") === "Volver a Más" ? "back" : "bar";
        document.body.innerHTML = '<main><h1>Más</h1></main>';
        // El título aparece antes de la barra que restituye el desmontaje de las acciones fijas.
        requestAnimationFrame(() => document.body.insertAdjacentHTML("beforeend", '<nav aria-label="Secciones"><a href="#" aria-current="page">Más</a></nav>'));
      });
    });
    const more = await openPhoneMore(page);
    assert.equal(await page.locator("body").getAttribute("data-entrance"), bar ? "bar" : "back");
    assert.equal(await more.getAttribute("aria-current"), "page");
    if (!bar) {
      await more.evaluate((link) => link.removeAttribute("aria-current"));
      await assert.rejects(openPhoneMore(page), /Más debe volver a estar presente y marcado/);
    }
  } finally { await browser.close(); }
});

test("el rechazo real de Recuperar se lee del contrato y describe el campo nuevo", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const message = "Ese método de ingreso ya es de otra cuenta.";
    await page.setContent(`<label>Correo electrónico nuevo<input aria-invalid="true" aria-describedby="error"></label><p id="error">${message}</p>`);
    const response = { status: () => 400, json: async () => ({ code: "Platform.AccountRecovery.MethodInUse", errors: { email: [message] } }) };
    await expectRecoveryEmailInUse(page, response);
    await page.getByRole("textbox").evaluate((input) => input.removeAttribute("aria-describedby"));
    await assert.rejects(expectRecoveryEmailInUse(page, response), /debe describir el correo nuevo/);
    await assert.rejects(expectRecoveryEmailInUse(page, { ...response, json: async () => ({ code: "Platform.AccountRecovery.MethodInUse", errors: { phone: [message] } }) }), /campo email/);
  } finally { await browser.close(); }
});

for (const published of [false, true]) test(`prepara borrador por UI desde ${published ? "Publicada" : "Borrador"} sin depender de otro caso`, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<input type="checkbox" role="switch" ${published ? "checked" : ""}
      onclick="document.querySelector('[role=dialog]').hidden=false;return false">
      <span id="state">${published ? "Publicada" : "Borrador"}</span>
      <section role="dialog" hidden><button onclick="window.confirmations=(window.confirmations||0)+1;document.querySelector('input').checked=false;document.querySelector('#state').textContent='Borrador';this.parentElement.hidden=true">Despublicar</button></section>`);
    await ensureBusinessPageDraft(page);
    assert.equal(await page.getByRole("switch").isChecked(), false);
    assert.equal(await page.evaluate(() => window.confirmations ?? 0), published ? 1 : 0);
  } finally { await browser.close(); }
});

for (const count of [0, 2]) test(`Módulos conserva el catálogo publicado de ${count} filas`, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(count ? `<button role="tab" onclick="document.querySelector('table').hidden=false">Módulos ${count}</button>
      <table hidden><tr><th>Módulo</th></tr>${Array.from({ length: count }, (_, index) => `<tr><td>Módulo ${index}</td></tr>`).join("")}</table>` : "<h1>Organización</h1>");
    await expectOrganizationModules(page, Array.from({ length: count }, (_, index) => ({ key: `module-${index}` })));
    if (count) await assert.rejects(expectOrganizationModules(page, [{ key: "incomplete" }]), /Cada módulo publicado/);
  } finally { await browser.close(); }
});

for (const changed of [false, true]) test(`la sección privada ${changed ? 'acepta los legales reales por UI' : 'no inventa aceptación sin pendientes'}`, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<section id="terms" ${changed ? '' : 'hidden'}><h1>Actualizamos los términos</h1>
      <label><input type="checkbox">Leí y acepto los Términos y la Política de privacidad</label>
      <button onclick="if(document.querySelector('input').checked){document.querySelector('#terms').hidden=true;document.querySelector('#page').hidden=false}">Aceptar y seguir</button></section>
      <section id="page" ${changed ? 'hidden' : ''}><h1>Documentos legales</h1></section>`);
    let accepted = 0;
    await waitForPrivateHeading(page, "Documentos legales", async () => {
      assert.equal(await page.getByRole("heading", { name: "Documentos legales", exact: true }).isVisible(), false);
      await page.getByRole("checkbox", { name: /Leí y acepto/ }).check();
      await page.getByRole("button", { name: "Aceptar y seguir", exact: true }).click();
      accepted++;
    });
    assert.equal(accepted, changed ? 1 : 0);
    assert.equal(await page.getByRole("heading", { name: "Documentos legales", exact: true }).isVisible(), true);
  } finally { await browser.close(); }
});

test("el código espera los controles que aparecen después del título", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<h1>Revisá tu correo</h1>");
    const entry = fillOtp(page, "123456").then(() => null, error => error);
    // La carga del paso es independiente de la entrega del correo. Sin sleeps ni red simulada.
    await page.evaluate(() => {
      const group = document.createElement("div");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Código");
      for (let index = 0; index < 6; index++) group.append(document.createElement("input"));
      document.body.append(group);
    });
    assert.equal(await entry, null);
    assert.deepEqual(await page.getByRole("group", { name: "Código" }).locator("input").evaluateAll(inputs => inputs.map(input => input.value)),
      ["1", "2", "3", "4", "5", "6"]);
  } finally { await browser.close(); }
});
