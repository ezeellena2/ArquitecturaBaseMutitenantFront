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
