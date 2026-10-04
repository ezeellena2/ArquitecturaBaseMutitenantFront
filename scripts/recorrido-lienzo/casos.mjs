import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// La 3b compara contra la copia v35 del lienzo hasta pasarla al vigente (plan de consolidación): sus estados no son los
// de los tableros vigentes.
const outdated = new Set(["etapa-3b"]);

/// Las pantallas para ver en vivo: cada caso de los manifiestos de capturas, con su tablero vigente, su estado, el tamaño
/// y los datos de prueba de la app. Los correos quedan afuera: no son pantallas de la app.
export function loadCases(capturesDir, lienzoDir) {
  const cases = [];
  for (const etapa of readdirSync(capturesDir).filter((name) => name.startsWith("etapa-") && !outdated.has(name)).sort()) {
    const file = path.join(capturesDir, etapa, "manifest.json");
    if (!existsSync(file)) continue;
    for (const entry of JSON.parse(readFileSync(file, "utf8")).cases) {
      if (entry.email || !entry.app?.path || entry.app.path.includes("/correos/")) continue;
      if (!existsSync(path.join(lienzoDir, `${entry.board}.dc.html`))) continue;
      cases.push({
        id: `${etapa}/${entry.id}`, etapa, pair: entry.pair ?? entry.id, device: entry.viewport.width <= 500 ? "Teléfono" : "Compu",
        board: entry.board, props: entry.props ?? {}, boardActions: entry.boardActions ?? [],
        boardViewport: entry.boardViewport ?? entry.viewport, viewport: entry.viewport,
        app: { path: entry.app.path, responses: entry.app.responses ?? [], userFixture: entry.app.userFixture, actions: entry.app.actions ?? [] },
      });
    }
  }
  return cases;
}

/// Una pantalla que todavía no tiene caso de captura: su tablero y la ruta de la app, con el usuario de prueba elegido.
export function adHocCase({ board, route = "/", as = "visual-owner", phone = false }) {
  const viewport = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  return {
    id: "a-mano", etapa: "a mano", pair: board, device: phone ? "Teléfono" : "Compu", board, props: {}, boardActions: [],
    boardViewport: viewport, viewport,
    app: { path: `/src/test/visualApp.html?${new URLSearchParams({ as, route })}`, responses: [], userFixture: as, actions: [] },
  };
}
