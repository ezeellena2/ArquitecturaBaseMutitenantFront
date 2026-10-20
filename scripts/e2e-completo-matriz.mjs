import path from "node:path";

export function safeEvidenceText(value) {
  return String(value ?? "").replace(/(?:https?|wss?):\/\/[^\s"'<>]+/g, (raw) => {
    try { const url = new URL(raw); return `${url.origin}${url.pathname}`; }
    catch { return "[URL omitida]"; }
  }).replace(/\b\d{6}\b/g, "[código]").slice(0, 1600);
}

export function resultsFromProofs(ids, executions, widths = [1440, 390]) {
  return resultsFromProofGroups(ids.length ? [ids] : [], executions, widths);
}

function resultsFromProofGroups(groups, executions, widths = [1440, 390]) {
  return widths.map((width) => {
    const resolved = groups.filter((ids) => ids.length).map((ids) => ({ ids, proofs: ids.map((id) => executions.find((item) => item.id === id)?.results?.find((result) => result.width === width)) }));
    // Una alternativa pendiente no invalida otra completa; una falla real sí.
    const failed = resolved.flatMap(({ proofs }) => proofs).find((proof) => proof?.status === "failed");
    if (failed) return { ...failed, width };
    const passed = resolved.find(({ proofs }) => proofs.every((proof) => proof?.status === "passed"));
    if (passed) return { ...passed.proofs.at(-1), width, actual: `Verificado por ${passed.ids.join(", ")}. ${passed.proofs.map((proof) => proof.actual).filter(Boolean).join(" ")}`, proofIds: passed.ids };
    const manual = resolved.find(({ proofs }) => proofs.every((proof) => ["passed", "manual"].includes(proof?.status)))?.proofs.find((proof) => proof.status === "manual");
    if (manual) return { ...manual, width };
    return { width, status: "blocked", actual: "Sin comprobación individual ejecutada para esta acción y este ancho." };
  });
}

export function buildMatrix({ backend = [], guided = [], screens = [], executions = [], verificationLimitations = {} }) {
  return [...backend, ...guided, ...screens.filter((screen) => !screen.reference).map((screen) => ({ ...screen, id: `SCREEN-${screen.id}`, area: screen.chapter ?? "Pantallas", actor: screen.actors?.join("; "), action: `Abrir ${screen.title}`, expected: "La pantalla está disponible para su actor en su ruta a 1440 y 390 px; las capturas permiten revisar su presentación.", kind: "screen" }))].map((item) => {
    const linked = executions.filter((execution) => execution.covers?.includes(item.id)).map((execution) => execution.id);
    const priorProofs = [...new Set([...(item.proofIds ?? []), ...(item.existingCaseIds ?? [])].map((id) => id.startsWith("BASE-") || executions.some((entry) => entry.id === id) ? id : `BASE-${id}`))];
    // Los pasos originales se necesitan juntos. Cada covers ya trazado acredita
    // la acción completa por sí solo y constituye una alternativa independiente.
    const proofGroups = [...(priorProofs.length ? [priorProofs] : []), ...linked.map((id) => [id])];
    const proofIds = [...new Set(proofGroups.flat())];
    const manualReason = item.manualReason ?? (typeof item.manual === "string" ? item.manual : item.manual ? "Necesita una integración externa real; no se usaron credenciales ni datos reales." : null);
    const verificationLimitation = verificationLimitations[item.id];
    const results = resultsFromProofGroups(proofGroups, executions).map((result) => {
      if (manualReason && result.status !== "failed") return { width: result.width, status: "manual", actual: manualReason };
      if (verificationLimitation && result.status === "blocked") return { ...result, actual: `Falta comprobar: ${verificationLimitation.missing} ${verificationLimitation.reason} Comprobaciones parciales: ${verificationLimitation.partialExecutionIds?.join(", ") || "ninguna"}.` };
      return result;
    });
    return { ...item, proofIds, proofGroups, manualReason, ...(verificationLimitation ? { verificationLimitation } : {}), results };
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
        actual: safeEvidenceText(result?.actual ?? "El recorrido no llegó a ejecutar este paso."),
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
