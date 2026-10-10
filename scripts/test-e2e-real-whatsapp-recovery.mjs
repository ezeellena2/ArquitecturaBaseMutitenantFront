import assert from "node:assert/strict";
import { newCaseContext } from "./test-e2e-real-case.mjs";

/** Conserva el formulario leído: el servicio real marca el aviso antes de decidir, sin GET ni rebase. */
export async function decideAfterRecoveryNotice(fixture, pending, decide) {
  assert.equal(pending.status, "Pending");
  const version = pending.version;
  for (const repeat of [false, true]) {
    const notice = await fixture("recoveryNotice", { recoveryId: pending.id });
    assert.equal(notice.marked, true);
    assert.equal(notice.beforeVersion, version);
    assert.equal(notice.afterVersion, version);
    assert.ok(Number.isInteger(notice.queuedNotices));
    assert.ok(repeat ? notice.queuedNotices === 0 : notice.queuedNotices > 0);
  }
  return decide(version);
}

/** Correlaciona la respuesta observada, sin depender del nombre ni del orden de los pedidos. */
export function selectRecovery(items, previous, next) {
  const phoneMatches = (masked, phone) => typeof masked === "string" && masked.replace(/\D/g, "").endsWith(phone.slice(-4));
  const matches = items.filter((item) => item.previousMethodType === "Phone" && item.newMethodType === "Phone"
    && phoneMatches(item.previousMethod, previous) && phoneMatches(item.newMethod, next));
  if (matches.length !== 1) throw new Error("No encontramos un pedido Phone único para este recorrido.");
  return matches[0];
}

/** Usa la tarjeta real del teléfono o la fila del escritorio, sin cambiar el viewport. */
export function recoveryRow(page, item) {
  return page.getByRole(page.viewportSize().width === 390 ? "listitem" : "row")
    .filter({ has: page.getByText(item.previousMethod, { exact: true }) })
    .filter({ has: page.getByText(item.newMethod, { exact: true }) });
}

/** /plataforma también es la ruta del ingreso; sólo su interfaz privada demuestra que terminó OIDC. */
export async function waitForPlatformSession(page, submitAcceptance) {
  const terms = page.getByRole("heading", { name: "Actualizamos los términos", exact: true });
  const home = page.viewportSize().width === 390 ? page.getByRole("navigation", { name: "Secciones", exact: true })
    : page.getByRole("button", { name: /, Plataforma$/ });
  await terms.or(home).first().waitFor();
  if (await terms.isVisible()) {
    await page.getByRole("checkbox", { name: /Leí y acepto/ }).check();
    await submitAcceptance();
    await terms.waitFor({ state: "hidden" });
  }
  await home.waitFor();
}
/** Cada actor conserva su propio navegador aislado, con cierre del recorrido también ante fallos. */
export function newPlatformContext(browser, width) {
  return newCaseContext(browser, { ignoreHTTPSErrors: true, locale: "es-AR", viewport: { width, height: width === 390 ? 844 : 900 } });
}
