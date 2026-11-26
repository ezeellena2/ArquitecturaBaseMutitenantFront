import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createAssistantControl } from "./assistant-real-control.mjs";
import { acceptAssistantNoticeFromHome, assistantHomeRoute, assistantLogin } from "./assistant-real-ui.mjs";
import { baseUrl, createEnvironment } from "./recorrido-usuario-entorno.mjs";
import { accionesNames, accionesRoles, createActionRoles, inviteFromProposalInTwoTabs, startConversation } from "./recorrido-usuario-acciones.mjs";

/**
 * E2E real de las acciones del asistente (I2 del plan 2026-11-23-etapa-acciones-del-asistente): «Invitar usuario» desde una
 * propuesta del modelo falso y «Ya se guardó» en una segunda pestaña, a 1440 y a 390. El modelo falso reemplaza solo al
 * proveedor (escenario `[E2E:action]`); el front, la sesión, la base y el correo son reales. Usa el mismo paso que el
 * recorrido (`inviteFromProposalInTwoTabs`), sobre la organización de la preparación E7 del entorno aislado.
 */
export async function runActionsRealE2E({ build = false, widths = [1440, 390] } = {}) {
  assert.ok(widths.length > 0 && widths.every((width) => [1440, 390].includes(width)) && new Set(widths).size === widths.length, "Anchos de las acciones inválidos.");
  const env = await createEnvironment({ build });
  let browser;
  try {
    const control = createAssistantControl(env.command);
    browser = await chromium.launch({ headless: true });
    for (const width of widths) {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR", viewport: { width, height: width === 390 ? 844 : 900 } });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(30_000);
        await page.goto(new URL("/alive", baseUrl).href);
        await assistantLogin(page, env, baseUrl, env.businessEmail, "business");
        await control("prepare", { email: env.businessEmail, access: "business" });
        await page.goto(new URL(assistantHomeRoute("business", width), baseUrl).href);
        await acceptAssistantNoticeFromHome(page);
        // La misma organización en los dos anchos: cada uno con sus roles y su invitación.
        const names = accionesNames(width, `e${Date.now().toString(36).slice(-5)}`);
        await createActionRoles(page, accionesRoles(names).filter(([name]) => name === names.sales || name === names.wholesale));
        await startConversation(page);
        await inviteFromProposalInTwoTabs({ page, base: baseUrl, width, names });
        process.stdout.write(`CHECK OK ACC-02 ${width}\n`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await env.stop(); }
}
