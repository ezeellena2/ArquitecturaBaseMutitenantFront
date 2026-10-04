import { readFileSync } from "node:fs";
import path from "node:path";

/// El estado de un tablero, según la marca de su título (README del lienzo): sin marca está validado.
export function boardStatus(title) {
  if (title.includes("· para aprobar")) return "Para aprobar";
  if (title.includes("· por refinar")) return "Por refinar";
  return "Validado";
}

/// Los estados que se eligen con «Tweak»: las propiedades de tipo lista del atributo data-props.
function readStates(file) {
  const match = readFileSync(file, "utf8").match(/data-props='([^']*)'/);
  if (!match) return {};
  const meta = JSON.parse(match[1].replaceAll("&#39;", "'").replaceAll("&quot;", "\"").replaceAll("&amp;", "&"));
  return Object.fromEntries(Object.entries(meta).filter(([key, value]) => !key.startsWith("$") && value?.editor === "enum"));
}

/// Qué es cada página, de la tabla «Páginas y estado» del README del lienzo.
function pageDescriptions(readme) {
  const rows = new Map();
  for (const line of readme.split(/\r?\n/)) {
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length >= 5 && cells[1] && cells[1] !== "Página" && !/^-+$/.test(cells[1])) rows.set(cells[1], cells[3]);
  }
  return rows;
}

/// Los pasos del recorrido: cada página con su presentación y, adentro, cada tablero en el orden en que está dibujado
/// (de arriba abajo y de izquierda a derecha). Cada tablero abre como en el lienzo y después muestra cada estado de a
/// uno, con el resto como abre. «Archivo» (lo descartado) queda afuera salvo que se pida.
export function buildSteps(lienzoDir, { withArchive = false } = {}) {
  const canvas = JSON.parse(readFileSync(path.join(lienzoDir, "canvas.json"), "utf8"));
  const descriptions = pageDescriptions(readFileSync(path.join(lienzoDir, "README.md"), "utf8"));
  const pages = canvas.pages.filter((page) => withArchive || page.id !== "archivo");
  const steps = [];
  pages.forEach((page, pageIndex) => {
    const boards = Object.entries(canvas.boards).filter(([, board]) => board.page === page.id)
      .sort(([, left], [, right]) => left.y - right.y || left.x - right.x);
    const where = { page: page.name, pageIndex, pageCount: pages.length };
    steps.push({ kind: "page", ...where, boards: boards.length, description: descriptions.get(page.name) ?? "",
      // Las notas que son solo el rótulo de la página no dicen nada nuevo.
      notes: Object.values(canvas.notes ?? {}).filter((note) => note.page === page.id && note.text.trim() !== page.name).map((note) => note.text) });
    for (const [file, board] of boards) {
      const states = readStates(path.join(lienzoDir, file));
      const defaults = Object.fromEntries(Object.entries(states).map(([key, meta]) => [key, meta.default ?? meta.options[0]]));
      const base = { kind: "board", ...where, file, title: board.title, status: boardStatus(board.title),
        device: board.w <= 500 ? "Teléfono" : "Compu", width: board.w, height: board.h };
      const opening = Object.entries(defaults).map(([key, value]) => `${key} «${value}»`).join(" · ");
      steps.push({ ...base, state: opening ? `${opening}, como abre` : null, props: defaults });
      for (const [key, meta] of Object.entries(states))
        for (const option of meta.options)
          if (option !== defaults[key]) steps.push({ ...base, state: `${key} «${option}»`, props: { ...defaults, [key]: option } });
    }
  });
  return steps.map((step, index) => ({ ...step, index, total: steps.length }));
}
