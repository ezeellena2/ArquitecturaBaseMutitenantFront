import { readFile } from "node:fs/promises";

// Preparación T14: estas definiciones no ejecutan ni certifican el recorrido real.
// Los actores conservan sus sesiones; el futuro runner usa controles de la app,
// nunca los selectores, Tweaks o datos demostrativos del lienzo.
export const assistantJourneySources = [
  { id: "asistente-primera-vez", order: 10, steps: 2 },
  { id: "una-consulta-fija", order: 20, steps: 3 },
  { id: "una-pregunta-con-herramienta", order: 30, steps: 4 },
  { id: "guardar-y-exportar", order: 40, steps: 3 },
  { id: "configurar-la-clave-propia", order: 50, steps: 4 },
  { id: "el-tope", order: 60, steps: 5 },
];

const readJourney = (id) => readFile(new URL(`../docs/design/recorridos/${id}.json`, import.meta.url), "utf8");
const nonempty = (value) => typeof value === "string" && value.trim().length > 0;

export function assistantJourneyDefinitions(source, expected) {
  const fail = () => { throw new Error(`Guion E8b inválido: ${expected.id}.`); };
  if (!source || source.id !== expected.id || source.etapa !== "Etapa 8b · Asistente" || source.orden !== expected.order
    || !nonempty(source.titulo) || !Array.isArray(source.pasos) || source.pasos.length !== expected.steps) fail();
  return source.pasos.map((step, index) => {
    if (!step || ![step.tablero, step.actor, step.titulo, step.texto, step.accion, step.ruta].every(nonempty)
      || (step.ruta !== "—" && (!step.ruta.startsWith("/") || step.ruta.startsWith("//")))) fail();
    return { id: `E8B-${expected.order}-${index + 1}`, title: `E8b · ${step.titulo}`, expected: step.texto,
      action: step.accion, actor: step.actor, board: step.tablero,
      source: { guion: expected.id, paso: index + 1, route: step.ruta },
    };
  });
}

/** Carga atómica: un guion inválido impide preparar un recorrido parcial. */
export async function loadAssistantJourneyDefinitions(readSource = readJourney) {
  const definitions = await Promise.all(assistantJourneySources.map(async (expected) => {
    let source;
    try { source = JSON.parse(await readSource(expected.id)); }
    catch { throw new Error(`No se pudo leer el guion E8b: ${expected.id}.`); }
    return assistantJourneyDefinitions(source, expected);
  }));
  return definitions.flat();
}
