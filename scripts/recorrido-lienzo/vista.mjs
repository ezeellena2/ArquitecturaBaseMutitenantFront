import { installApiMocks, runAppActions } from "../capturar-etapa-3a.mjs";

/// Abre la vista en vivo en una pestaña. Al elegir una pantalla, la página le pide a Playwright los datos de prueba de
/// ese caso (las mismas respuestas de la API que usan las capturas) y, cuando la app termina de cargar, sus acciones
/// (abrir un diálogo, escribir en un campo). Si Vite recarga la app por un cambio del código, se repiten solas.
export async function openLiveView(context, { url, cases, viteUrl, initial }) {
  const byId = new Map(cases.map((item) => [item.id, item]));
  const page = await context.newPage();
  await page.exposeFunction("__vivoPreparar", async (id) => {
    const item = byId.get(id);
    await context.unrouteAll({ behavior: "ignoreErrors" });
    await installApiMocks(context, item.app.responses, item.app.userFixture);
  });
  await page.exposeFunction("__vivoAcciones", async (id) => {
    const item = byId.get(id);
    const frame = page.frames().find((candidate) => candidate.url().startsWith(viteUrl));
    if (!item.app.actions.length || !frame) return;
    try {
      await runAppActions({ getByRole: (role, options) => frame.getByRole(role, options), keyboard: page.keyboard }, item.app.actions);
    } catch (error) {
      console.warn(`No se pudieron repetir las acciones de ${id}: ${error.message.split("\n")[0]}`);
    }
  });
  await page.goto(initial ? `${url}?caso=${encodeURIComponent(initial)}` : url);
  return page;
}
