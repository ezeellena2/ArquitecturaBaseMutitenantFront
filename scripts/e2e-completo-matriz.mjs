import path from "node:path";

export function resultsFromProofs(ids, executions, widths = [1440, 390]) {
  return widths.map((width) => {
    const proofs = ids.map((id) => executions.find((item) => item.id === id)?.results?.find((result) => result.width === width));
    const failed = proofs.find((proof) => proof?.status === "failed");
    const manual = proofs.find((proof) => proof?.status === "manual");
    if (failed) return { ...failed, width };
    if (!ids.length || proofs.some((proof) => !proof || proof.status === "blocked")) return { width, status: "blocked", actual: "Sin comprobación individual ejecutada para esta acción y este ancho." };
    if (manual) return { ...manual, width };
    return { ...proofs.at(-1), width, actual: `Verificado por ${ids.join(", ")}. ${proofs.map((proof) => proof.actual).join(" ")}`, proofIds: ids };
  });
}

export function buildMatrix({ backend = [], guided = [], screens = [], executions = [] }) {
  return [...backend, ...guided, ...screens.map((screen) => ({ ...screen, id: `SCREEN-${screen.id}`, area: screen.chapter ?? "Pantallas", actor: screen.actors?.join("; "), action: `Abrir ${screen.title}`, expected: "La pantalla está disponible para su actor en su ruta, con la disposición de 1440 y 390 px.", kind: "screen" }))].map((item) => {
    const linked = executions.filter((execution) => execution.covers?.includes(item.id)).map((execution) => execution.id);
    const priorProofs = [...(item.proofIds ?? []), ...(item.existingCaseIds ?? [])].map((id) => executions.some((entry) => entry.id === id) ? id : `BASE-${id}`);
    const proofIds = [...new Set([...linked, ...priorProofs])];
    const manualReason = item.manualReason ?? (typeof item.manual === "string" ? item.manual : item.manual ? "Necesita una integración externa real; no se usaron credenciales ni datos reales." : null);
    return { ...item, proofIds, manualReason, results: manualReason
      ? [1440, 390].map((width) => ({ width, status: "manual", actual: manualReason }))
      : resultsFromProofs(proofIds, executions) };
  });
}

export function importedJourneySteps(journey, journeyDirectory, outputDirectory) {
  return (journey.steps ?? []).map((step) => ({
    id: `BASE-${step.id}`, area: step.id.startsWith("E11") ? "WhatsApp de atención" : step.id.startsWith("E9") ? "Plataforma" : step.id.startsWith("E8B") ? "Asistente" : step.id.startsWith("E8") ? "WhatsApp e identidad" : "Identidad y sitio público",
    actor: step.actor ?? "Actor del recorrido de usuario", action: step.title, expected: step.expected,
    route: step.source?.route ?? "Ver paso del recorrido", source: step.source ?? "scripts/recorrido-usuario.mjs",
    existingScripts: ["scripts/recorrido-usuario.mjs"],
    results: [1440, 390].map((width) => {
      const result = step.results?.find((entry) => entry.width === width);
      return { ...result, width, status: ["passed", "failed"].includes(result?.status) ? result.status : "blocked",
        actual: result?.actual ?? "El recorrido no llegó a ejecutar este paso.",
        image: result?.image ? path.relative(outputDirectory, path.join(journeyDirectory, result.image)).replaceAll("\\", "/") : undefined,
        severity: result?.status === "failed" ? "high" : undefined,
        reproduce: ["Ejecutar node scripts/recorrido-usuario.mjs --no-build en un entorno aislado.", `Seguir el recorrido hasta ${step.id}: ${step.title}.`], probableArea: "Determinar con la respuesta HTTP y la captura del paso" };
    }),
  }));
}

export function parseTapSummary(log) {
  const counts = Object.fromEntries(["tests", "pass", "fail", "cancelled", "skipped"].map((key) => [key, Number(log.match(new RegExp(`[#ℹ] ${key} (\\d+)`, "u"))?.[1] ?? 0)]));
  const failedNames = [...log.matchAll(/^\s*(?:not ok \d+ - |✖ )(.+)$/gm)].map((match) => match[1]);
  return { ...counts, status: counts.tests > 0 && counts.pass > 0 && counts.fail === 0 && counts.cancelled === 0 ? "passed" : "failed", failedNames };
}
