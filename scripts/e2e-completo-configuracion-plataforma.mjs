import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import settingsTexts from "../src/locales/es/platformSettings.json" with { type: "json" };
import { openPlatformSettings, reloadPlatformSettings, selectSetting, withRestoredSettings } from "./test-e2e-real-whatsapp-settings.mjs";
import { assertPlatformProblem } from "./e2e-completo-plataforma.mjs";
import { confirmRecentAuthentication, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";

export const platformConfigurationDefinitions = [{
  id: "CFG-01", area: "Configuración de Plataforma", actor: "Operador con todos los permisos", route: "/plataforma/configuracion",
  action: "Validar rangos y contactos, guardar registros y los doce límites, y restaurar todo por UI",
  expected: "Máximos1/50, contactos válidos y los doce perfiles completos persisten tras F5 con versión, motivo y confirmación reciente.0/51 y contactos inválidos no envían PUT. Los cinco campos y doce perfiles iniciales se restauran por UI.",
  covers: ["BACK-PL-026"], source: "src/areas/platform/settings/pages/PlatformSettingsPage.tsx; src/areas/platform/settings/components/RateLimitsSection.tsx; src/areas/platform/settings/lib/rateLimits.ts", critical: true,
}];
export const configurationProfileKeys = ["ip", "publicIp", "identity", "tenant", "loginCode", "loginVerify", "invitationPreview", "invitationAccept", "assistantQuickQuery", "assistantConversation", "assistantNewKey", "whatsAppWebhook"];
const fields = ["consumerSignup", "businessSignup", "maxOwnedOrganizations", "salesEmail", "supportEmail"];
const endpoint = "/api/platform/settings";
const units = { s: 1, m: 60, h: 3600 };
const unitNames = { s: /^segundos?$/u, m: /^minutos?$/u, h: /^horas?$/u };
const consumerLabels = { Open: "Abierto", Closed: "Cerrado" };
const businessLabels = { Open: "Abierta", Closed: "Cerrada", RequiresApproval: "Requiere aprobación" };

/** Copia completa y raw: ni las versiones viejas ni los borradores de UI pertenecen a la restauración. */
export function completePlatformSettings(settings) {
  assert.deepEqual(Object.keys(settings.rateLimits).sort(), [...configurationProfileKeys].sort(), "Deben estar exactamente los doce perfiles del contrato.");
  return { ...Object.fromEntries(fields.map((key) => [key, settings[key]])), rateLimits: structuredClone(settings.rateLimits) };
}
/** La unidad segundo representa cualquier ventana original exactamente, también86400. */
export function rateLimitUiDrafts(settings) {
  completePlatformSettings(settings);
  return Object.fromEntries(configurationProfileKeys.map((key) => [key, { permitLimit: settings.rateLimits[key].permitLimit, amount: settings.rateLimits[key].windowSeconds, unit: "s" }]));
}
export function configurationProbeSettings(original, maximum) {
  assert.ok([1, 50].includes(maximum));
  const drafts = Object.fromEntries(configurationProfileKeys.map((key, index) => {
    const unit = ["s", "m", "h"][index % 3];
    const permitLimit = original.rateLimits[key].permitLimit === 900 + index ? 950 + index : 900 + index;
    return [key, { permitLimit, amount: unit === "s" ? 61 + index : unit === "m" ? 2 + index : 1 + index % 3, unit }];
  }));
  const rateLimits = Object.fromEntries(configurationProfileKeys.map((key) => [key, { permitLimit: drafts[key].permitLimit, windowSeconds: drafts[key].amount * units[drafts[key].unit] }]));
  return { ...completePlatformSettings(original), consumerSignup: maximum === 1 ? "Closed" : "Open", businessSignup: maximum === 1 ? "Closed" : "Open",
    maxOwnedOrganizations: maximum, salesEmail: "ventas-configuracion@example.test", supportEmail: "soporte-configuracion@example.test", rateLimits, drafts };
}
export function assertCompleteSettingsWrite(request, target, version, reason) {
  assert.deepEqual(request, { ...completePlatformSettings(target), version, reason }, "Cada PUT conserva todos los campos, los doce perfiles, la versión leída y su motivo.");
}
/** withRestoredSettings conserva cinco campos; este cierre guarda además los doce perfiles originales. */
export async function withRestoredCompleteSettings({ read, prepare, body, restore, close }) {
  let complete;
  return withRestoredSettings({
    read: async () => { complete = structuredClone(await read()); completePlatformSettings(complete); return complete; },
    prepare: async () => prepare?.(complete), body: async () => body(complete), restore: async () => restore(complete), close,
  });
}

const isSettings = (method) => (response) => new URL(response.url()).pathname === endpoint && response.request().method() === method;
const inputFor = (page, key, field) => page.locator('input[name="rateLimits.' + key + "." + field + '"]');
async function fillCompleteSettings(page, target, drafts) {
  completePlatformSettings(target);
  await selectSetting(page, settingsTexts.fields.consumerSignup, consumerLabels[target.consumerSignup]);
  await selectSetting(page, settingsTexts.fields.businessSignup, businessLabels[target.businessSignup]);
  for (const key of ["maxOwnedOrganizations", "salesEmail", "supportEmail"]) await page.getByRole("textbox", { name: settingsTexts.fields[key], exact: true }).fill(String(target[key]));
  const group = page.getByRole("group", { name: settingsTexts.rateLimits.title, exact: true }); await group.waitFor();
  assert.equal(await group.locator('input[name^="rateLimits."]').count(), 24);
  assert.equal(await group.getByRole("combobox").count(), 12);
  for (const key of configurationProfileKeys) {
    const draft = drafts[key]; assert.ok(Number.isInteger(draft.permitLimit) && Number.isInteger(draft.amount));
    await inputFor(page, key, "permitLimit").fill(String(draft.permitLimit));
    await inputFor(page, key, "amount").fill(String(draft.amount));
    const label = settingsTexts.rateLimits.unitOf.replace("{{name}}", settingsTexts.rateLimits.profiles[key]);
    const unit = page.getByRole("combobox", { name: label, exact: true }); await unit.focus(); await unit.press("Enter");
    await page.getByRole("option", { name: unitNames[draft.unit] }).click();
  }
}
async function reloadAndRequire(page, target) {
  const actual = await reloadPlatformSettings(page);
  assert.deepEqual(completePlatformSettings(actual), completePlatformSettings(target), "F5 debe conservar los doce límites y los cinco campos raw.");
  const group = page.getByRole("group", { name: "Límites de uso", exact: true }); await group.waitFor();
  for (const key of configurationProfileKeys) {
    assert.equal(await inputFor(page, key, "permitLimit").count(), 1); assert.equal(await inputFor(page, key, "amount").count(), 1);
  }
  return actual;
}
async function saveCompleteSettings(page, current, target, reason, email, { requireProof = false, drafts = rateLimitUiDrafts(target) } = {}) {
  const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
  if (isDeepStrictEqual(completePlatformSettings(current), completePlatformSettings(target))) {
    assert.equal(requireProof, false, "La comprobación de prueba reciente necesita una escritura real.");
    await page.getByRole("button", { name: "Descartar cambios", exact: true }).click();
    assert.equal(await save.isDisabled(), true); return reloadAndRequire(page, target);
  }
  await fillCompleteSettings(page, target, drafts);
  await save.click();
  const dialog = page.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true });
  await dialog.getByRole("textbox", { name: /Motivo/u }).fill(reason);
  const answer = page.waitForResponse(isSettings("PUT")); void answer.catch(() => {});
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click(); let response = await answer;
  assertCompleteSettingsWrite(response.request().postDataJSON(), target, current.version, reason);
  if (requireProof || response.status() === 403) {
    await assertPlatformProblem(response, 403, "Auth.Platform.ReauthenticationRequired");
    const replay = page.waitForResponse((reply) => isSettings("PUT")(reply) && reply.status() !== 403); void replay.catch(() => {});
    await confirmRecentAuthentication(page, email); response = await replay;
    assertCompleteSettingsWrite(response.request().postDataJSON(), target, current.version, reason);
  }
  assert.equal(response.status(), 200);
  const written = await response.json(); assert.ok(Number.isInteger(written.version)); assert.notEqual(written.version, current.version);
  await dialog.waitFor({ state: "hidden" }); return reloadAndRequire(page, target);
}
async function rejectInvalidWithoutPut(page, field, value, message) {
  let writes = 0;
  const watch = (request) => { if (request.method() === "PUT" && new URL(request.url()).pathname === endpoint) writes++; };
  page.on("request", watch);
  try {
    const input = page.getByRole("textbox", { name: settingsTexts.fields[field], exact: true }); await input.fill(value);
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await page.getByText(message, { exact: true }).filter({ visible: true }).first().waitFor();
    assert.equal(await input.getAttribute("aria-invalid"), "true"); assert.equal(writes, 0, "La validación inválida no puede enviar PUT.");
    assert.equal(await page.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true }).isVisible(), false);
  } finally { page.off("request", watch); }
  await page.getByRole("button", { name: "Descartar cambios", exact: true }).click();
}
async function discardOwnDraft(page) {
  for (const title of ["Confirmá que sos vos", "¿Guardar la configuración?"]) {
    const dialog = page.getByRole("dialog", { name: title, exact: true });
    if (await dialog.isVisible()) await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  }
  await page.getByRole("button", { name: "Descartar cambios", exact: true }).click();
}

export async function runPlatformConfigurationCases(h) {
  const page = await h.newPage(); const email = h.width === 1440 ? "e2e-5d-operator@example.test" : "e2e-a9-operator@example.test"; let signedIn = false;
  try {
    return await h.record("CFG-01", () => page, async () => {
      const me = await h.login(page, email, "platform"); signedIn = true;
      assert.ok(me.effectivePermissions.platform.includes("platform.settings.manage"));
      await stopConfirmingRecentAuthentication(page);
      return withRestoredCompleteSettings({
        read: async () => openPlatformSettings(page, h.base.origin),
        prepare: async (original) => {
          // No se enriquece un null a mano: la UI exige correo válido y no podría devolverlo a null.
          for (const field of ["salesEmail", "supportEmail"]) assert.ok(typeof original[field] === "string" && original[field].length > 0, "La configuración inicial necesita contactos restaurables por la UI antes de cambiarla.");
        },
        body: async (original) => {
          for (const invalid of ["0", "51"]) await rejectInvalidWithoutPut(page, "maxOwnedOrganizations", invalid, settingsTexts.validation.range);
          for (const field of ["salesEmail", "supportEmail"]) await rejectInvalidWithoutPut(page, field, "correo-invalido", settingsTexts.validation.email);
          const first = configurationProbeSettings(original, 1);
          const expired = await h.env.command("recent-proof", { kind: "expire", email }); assert.ok(expired.expired >= 1);
          let current = await reloadPlatformSettings(page);
          current = await saveCompleteSettings(page, current, first, "Probar máximo uno, registros cerrados, contactos y doce límites completos.", email, { requireProof: true, drafts: first.drafts });
          const second = configurationProbeSettings(original, 50);
          current = await saveCompleteSettings(page, current, second, "Probar máximo cincuenta y ambos registros abiertos conservando los doce perfiles.", email, { drafts: second.drafts });
          await saveCompleteSettings(page, current, { ...second, businessSignup: "RequiresApproval" }, "Probar aprobación empresarial con todos los perfiles completos.", email, { drafts: second.drafts });
          return "0/51 y ambos correos inválidos mostraron error sin PUT. Máximos1/50, tres políticas empresariales y dos personales, contactos y doce perfiles enteros con unidades s/m/h persistieron tras F5. PUT completo con versión/motivo y F2 tras403 real; restauración completa verificada por UI y F5.";
        },
        restore: async (original) => {
          await discardOwnDraft(page); const current = await reloadPlatformSettings(page);
          await saveCompleteSettings(page, current, original, "Restaurar los cinco campos y los doce perfiles iniciales del recorrido.", email);
        },
      });
    });
  } finally {
    await stopConfirmingRecentAuthentication(page);
    try { if (signedIn) await h.signOut(page); }
    finally { await page.close(); }
  }
}
