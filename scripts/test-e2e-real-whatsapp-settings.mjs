import assert from "node:assert/strict";
import { expect } from "playwright/test";
import { reloadResponse, responsesForAction } from "./test-e2e-real-whatsapp-action.mjs";

const endpoint = "/api/platform/settings";
const consumerLabels = { Open: "Abierto", Closed: "Cerrado" };
const businessLabels = { Open: "Abierta", RequiresApproval: "Requiere aprobación", Closed: "Cerrada" };
const settingFields = ["consumerSignup", "businessSignup", "maxOwnedOrganizations", "salesEmail", "supportEmail"];
const isSettings = (method) => (reply) => new URL(reply.url()).pathname === endpoint && reply.request().method() === method;

/** La baseline conserva valores raw; version pertenece siempre a la lectura actual de la UI. */
export function editableSettings(settings) {
  return Object.fromEntries(settingFields.map((field) => [field, settings[field]]));
}

/** La UI exige contactos válidos: un null original sólo puede conservarse enriquecido. */
export function restorableSettings(baseline) {
  return { ...editableSettings(baseline), salesEmail: baseline.salesEmail ?? "e8-settings-sales@example.test",
    supportEmail: baseline.supportEmail ?? "e8-settings-support@example.test" };
}

export function sameSettings(left, right) {
  return settingFields.every((field) => left[field] === right[field]);
}

/** El finally se arma antes de preparar: guardar puede commitear y la verificación posterior fallar. */
export async function withRestoredSettings({ read, prepare, body, restore, close }) {
  const failures = []; let result;
  try {
    const baseline = editableSettings(await read());
    try { await prepare(baseline); result = await body(); }
    catch (error) { failures.push(error); }
    finally {
      try { await restore(baseline); }
      catch (error) { failures.push(error); }
    }
  } catch (error) { failures.push(error); }
  finally {
    try { await close?.(); }
    catch (error) { failures.push(error); }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Fallaron fases del recorrido, restauración o cierre del operador.");
  return result;
}

/** ItemText contiene el label; la descripción también puede formar parte del nombre accesible. */
export async function selectSetting(page, field, label) {
  const control = page.getByRole("combobox", { name: field, exact: true });
  if ((await control.innerText()).trim() === label) return;
  await control.focus(); await control.press("Enter");
  await page.getByRole("option").filter({ has: page.getByText(label, { exact: true }) }).click();
  await control.getByText(label, { exact: true }).waitFor();
}

async function readResponse(page, response) {
  assert.equal(response.status(), 200);
  const settings = await response.json();
  await page.getByRole("heading", { name: "Configuración", exact: true }).waitFor();
  await verifySettingsUi(page, settings);
  return settings;
}

export async function openPlatformSettings(page, base) {
  const [response] = await responsesForAction(page, [isSettings("GET")], () => page.goto(`${base}/plataforma/configuracion`));
  return readResponse(page, response);
}

export async function reloadPlatformSettings(page) {
  return readResponse(page, await reloadResponse(page, isSettings("GET")));
}

async function verifySettingsUi(page, expected) {
  for (const [field, label] of [["Registro de personas", consumerLabels[expected.consumerSignup]], ["Alta de organizaciones", businessLabels[expected.businessSignup]]])
    await page.getByRole("combobox", { name: field, exact: true }).getByText(label, { exact: true }).waitFor();
  for (const [field, value] of [["Organizaciones propias por persona", String(expected.maxOwnedOrganizations)], ["Correo de ventas", expected.salesEmail ?? ""], ["Correo de soporte", expected.supportEmail ?? ""]])
    await expect(page.getByRole("textbox", { name: field, exact: true })).toHaveValue(value, { timeout: 30_000 });
}

/** Sólo escribe por UI existente, sin mandar ni restaurar un version capturado por el runner. */
export async function savePlatformSettings(page, current, expected, reason) {
  const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
  if (sameSettings(current, expected)) {
    await verifySettingsUi(page, expected);
    assert.equal(await save.isDisabled(), true); // No-op real: no esperar un PUT inexistente.
  } else {
    await selectSetting(page, "Registro de personas", consumerLabels[expected.consumerSignup]);
    await selectSetting(page, "Alta de organizaciones", businessLabels[expected.businessSignup]);
    for (const [key, field] of [["maxOwnedOrganizations", "Organizaciones propias por persona"], ["salesEmail", "Correo de ventas"], ["supportEmail", "Correo de soporte"]]) {
      if (current[key] !== expected[key]) await page.getByRole("textbox", { name: field, exact: true }).fill(String(expected[key]));
    }
    await save.click();
    const dialog = page.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true });
    await dialog.getByRole("textbox", { name: /Motivo/ }).fill(reason);
    const [response] = await responsesForAction(page, [isSettings("PUT")], () => dialog.getByRole("button", { name: "Guardar", exact: true }).click());
    assert.equal(response.status(), 200);
    assert.equal(typeof (await response.json()).version, "number");
    await dialog.waitFor({ state: "hidden" });
  }
  const persisted = await reloadPlatformSettings(page);
  assert.deepEqual(editableSettings(persisted), editableSettings(expected));
  return persisted;
}
