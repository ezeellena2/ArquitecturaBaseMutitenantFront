import assert from "node:assert/strict";
import { personalDefinitions, runPersonalCases } from "./e2e-completo-personal.mjs";
import { policyDefinitions, runPolicyCases } from "./e2e-completo-politicas.mjs";
import { supplementPlatformDefinitions, runSupplementPlatformCases } from "./e2e-completo-plataforma-complemento.mjs";

/** Las preparaciones privadas no reemplazan evidencias verdes de la corrida anterior. */
export function selectReviewedCases(h, targets, prepare) {
  const selected = new Set(targets); const prerequisites = new Set(prepare);
  assert.ok(selected.size && prepare.every((id) => !selected.has(id)));
  return { ...h,
    record: async (id, page, action, diagnostic) => {
      if (selected.has(id)) return h.record(id, page, action, diagnostic);
      if (!prerequisites.has(id)) return { ok: false, skipped: true };
      const value = await action();
      console.info(`${id} ${h.width}: preparación privada de la revisión; resultado histórico conservado.`);
      return { ok: true, value, preparationOnly: true };
    },
    block: (id, reason, page) => selected.has(id) ? h.block(id, reason, page) : { ok: false, skipped: true },
  };
}

export const reviewedPersonalDefinitions = personalDefinitions.filter(({ id }) => id === "NUEVO-PER-09");
export const reviewedPendingDefinitions = policyDefinitions.filter(({ id }) => id === "POL-11");
export const reviewedPlatformMobileDefinitions = supplementPlatformDefinitions.filter(({ id }) => id === "PLAT-C-13");
export const reviewedIdempotencyDefinitions = supplementPlatformDefinitions.filter(({ id }) => id === "PLAT-C-16");

export const runReviewedPersonalCases = (h) => runPersonalCases(selectReviewedCases(h, ["NUEVO-PER-09"], ["NUEVO-PER-07", "NUEVO-PER-17"]));
export const runReviewedPendingCases = (h) => runPolicyCases(selectReviewedCases(h, ["POL-11"], ["POL-01", "POL-09", "POL-10", "POL-12"]));
export const runReviewedIdempotencyCases = (h) => runSupplementPlatformCases(selectReviewedCases(h, ["PLAT-C-16"], ["PLAT-C-01"]));
export function runReviewedPlatformMobileCases(h) {
  assert.equal(h.width, 390);
  return runSupplementPlatformCases(selectReviewedCases(h, ["PLAT-C-13"], ["PLAT-C-01", "PLAT-C-12"]));
}
