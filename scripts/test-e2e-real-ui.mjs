import assert from "node:assert/strict";

export const accountAddMethodName = /^(Agregar correo o teléfono|Agregar correo|Add email or phone|Add email)$/;

/** Usa la acción publicada según la capacidad y elige explícitamente el correo si hay dos métodos. */
export async function openAccountEmailDialog(page) {
  await page.getByRole("button", { name: accountAddMethodName }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  const email = dialog.getByRole("button", { name: /^(Correo|Email)$/, exact: true });
  if (await email.isVisible()) await email.click();
  await dialog.getByRole("textbox", { name: /^(Correo|Email)$/, exact: true }).waitFor();
  return dialog;
}

/** Mi cuenta oculta la barra al mostrar acciones fijas; conserva su regreso a Más por la cabecera. */
export async function openPhoneMore(page) {
  const more = page.getByRole("navigation", { name: "Secciones", exact: true }).getByRole("link", { name: "Más", exact: true });
  const back = page.getByRole("link", { name: "Volver a Más", exact: true });
  await more.or(back).first().waitFor();
  if (await more.isVisible()) await more.click();
  else await back.click();
  await page.getByRole("heading", { name: "Más", exact: true }).waitFor();
  await more.waitFor();
  assert.equal(await more.getAttribute("aria-current"), "page", "Más debe volver a estar presente y marcado en la barra móvil.");
  return more;
}

/** Cuentas muestra la lupa en el teléfono; tocarla sólo si el buscador todavía está cerrado. */
export async function openPlatformAccountSearch(page) {
  const name = "Buscar por nombre, correo o teléfono";
  const search = page.getByRole("searchbox", { name, exact: true });
  if (page.viewportSize().width === 390 && !await search.isVisible())
    await page.getByRole("button", { name, exact: true }).click();
  await search.waitFor();
  return search;
}

/** El contrato ubica el rechazo en el campo y entrega su texto traducido. */
export async function expectRecoveryEmailInUse(page, response) {
  assert.equal(response.status(), 400);
  const problem = await response.json();
  assert.equal(problem.code, "Platform.AccountRecovery.MethodInUse");
  const message = problem.errors?.email?.[0];
  assert.ok(typeof message === "string" && message.length > 0, "El rechazo debe identificar el campo email.");
  await page.getByText(message, { exact: true }).waitFor();
  const field = page.getByRole("textbox", { name: "Correo electrónico nuevo", exact: true });
  assert.equal(await field.getAttribute("aria-invalid"), "true");
  const description = await field.evaluate((input) => (input.getAttribute("aria-describedby") ?? "").split(/\s+/)
    .map((id) => input.ownerDocument.getElementById(id)?.textContent ?? "").join(" "));
  assert.ok(description.includes(message), "El rechazo del servicio debe describir el correo nuevo.");
  assert.equal(await page.getByRole("textbox", { name: "Código 1", exact: true }).count(), 0);
}

/** Cada caso prepara su propio estado de página por la UI, aunque un caso anterior haya fallado. */
export async function ensureBusinessPageDraft(page) {
  const publish = page.getByRole("switch");
  await publish.waitFor();
  if (await publish.isChecked()) {
    await publish.click();
    await page.getByRole("dialog").getByRole("button", { name: "Despublicar", exact: true }).click();
  }
  await page.getByText("Borrador", { exact: true }).first().waitFor();
  assert.equal(await publish.isChecked(), false, "El caso debe comenzar con su página en borrador.");
}

/** La pestaña refleja el catálogo observado por la UI; no presume un catálogo vacío. */
export async function expectOrganizationModules(page, features) {
  assert.ok(Array.isArray(features), "El catálogo de módulos debe ser una lista.");
  const tab = page.getByRole("tab", { name: /^Módulos(?:\s+\d+)?$/ });
  if (!features.length) {
    await tab.waitFor({ state: "hidden" });
    assert.equal(await tab.count(), 0, "Sin catálogo no se muestra la pestaña Módulos.");
    return;
  }
  await tab.waitFor();
  await tab.click();
  const table = page.getByRole("table");
  await table.waitFor();
  assert.equal(await table.getByRole("row").count(), features.length + 1, "Cada módulo publicado tiene su fila y hay un encabezado.");
}

/** Una consulta puede exigir legales nuevos después de abrir la sección; se aceptan por UI y se conserva el destino. */
export async function waitForPrivateHeading(page, name, acceptTerms) {
  const heading = page.getByRole("heading", { name, exact: true });
  const terms = page.getByRole("heading", { name: "Actualizamos los términos", exact: true });
  await heading.or(terms).first().waitFor();
  if (await terms.isVisible()) await acceptTerms();
  await heading.waitFor();
}

/** Completa el código cuando sus seis controles accesibles están listos. */
export async function fillOtp(page, code) {
  const boxes = page.getByRole("group", { name: "Código" }).locator("input");
  await boxes.nth(5).waitFor({ state: "visible" });
  assert.equal(await boxes.count(), 6);
  for (let index = 0; index < 6; index++) await boxes.nth(index).fill(code[index]);
}
