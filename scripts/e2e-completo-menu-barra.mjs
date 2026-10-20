import assert from "node:assert/strict";

/** El menú de barra móvil pertenece al dialog con el título real de la ficha o lista. */
export async function openBarMenu(page, trigger, { title, activation = "click" } = {}) {
  assert.ok(["click", "Enter"].includes(activation));
  const phone = page.viewportSize().width === 390;
  const name = title ?? (phone ? (await page.getByRole("heading", { level: 1 }).filter({ visible: true }).first().innerText()).trim() : undefined);
  if (phone) {
    assert.ok(name, "La hoja móvil necesita el nombre de la ficha o lista.");
    assert.equal(await trigger.getAttribute("aria-haspopup"), "dialog", "El ⋮ de barra móvil debe abrir una hoja.");
  }
  if (activation === "Enter") { await trigger.focus(); await trigger.press("Enter"); }
  else await trigger.click();
  const dialog = phone ? page.getByRole("dialog", { name, exact: true }) : undefined;
  if (dialog) await dialog.waitFor();
  const menu = dialog ? dialog.getByRole("menu") : page.getByRole("menu").filter({ visible: true }).last();
  await menu.waitFor();
  return { menu, dialog, waitForClosed: () => (dialog ?? menu).waitFor({ state: "hidden" }) };
}

export async function chooseBarAction(page, trigger, action, options) {
  const opened = await openBarMenu(page, trigger, options);
  await opened.menu.getByRole("menuitem", { name: action, exact: true }).click();
  await opened.waitForClosed();
}
