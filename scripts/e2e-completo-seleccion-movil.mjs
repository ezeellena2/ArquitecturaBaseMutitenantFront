import assert from "node:assert/strict";

/** Ejecuta las fixtures necesarias sin recapturarlas ni sustituir sus resultados históricos. */
export function selectMobileBarCases(h, { targets, prepare = [], skippedOk = false }) {
  assert.equal(h.width, 390, "La repetición del menú de barra corresponde sólo a390 px.");
  const selected = new Set(targets); const prerequisites = new Set(prepare);
  assert.ok(selected.size > 0 && selected.size === targets.length, "Los objetivos móviles deben ser únicos.");
  assert.ok(prepare.every((id) => !selected.has(id)), "Un objetivo no puede contarse como fixture.");
  return {
    ...h,
    record: async (id, getPage, action, diagnostic) => {
      if (selected.has(id)) return h.record(id, getPage, action, diagnostic);
      if (!prerequisites.has(id)) return { ok: skippedOk, skipped: true };
      try {
        const value = await action();
        console.info(`${id} ${h.width}: preparación del menú móvil; evidencia histórica conservada.`);
        return { ok: true, value, preparationOnly: true };
      } catch (cause) {
        throw new Error(`No se preparó ${id} para los menús móviles: ${cause.message}`, { cause });
      }
    },
    block: (id, reason, page) => selected.has(id) ? h.block(id, reason, page) : { ok: false, skipped: true },
  };
}
