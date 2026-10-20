// Análisis offline del core observado el 20/10/2026. Se enlaza por el nombre
// exacto que conserva el parser; no cambia el fallo ni acredita otros pasos.
const triageByName = new Map([
  ["A8: sesiones antiguas abren ambas puertas y conservan Plataforma a 1440 y 390", {
    analysis: "Se comprobaron las dos cookies independientes y el ingreso consumer. Luego expectProfile agotó 15 segundos tras recargar Plataforma. Este fallo no demuestra pérdida de la cookie ni de la sesión de Plataforma.",
    area: "Marco y sesión de Plataforma; localización probable del bloqueo de UI",
    route: "/plataforma",
  }],
  ["A9: el Dueño invitado ingresa con código sin abrir el enlace a 1440 y 390", {
    analysis: "Falló createPlatformOrganization durante la preparación de Plataforma, antes de navegar la pestaña de la persona invitada, que seguía en about:blank. No llegó a ejercitar el ingreso de la persona invitada. Las capturas reales baseline-A9-plataforma.png y baseline-A9-invitado.png miden 1280 × 720; el nombre del grupo no acredita una ejecución a 1440 px.",
    area: "Plataforma · creación de organización durante la preparación del caso",
    route: "/plataforma/organizaciones; pestaña invitada: about:blank",
    image: "baseline-A9-plataforma.png",
  }],
  ["A3: Plataforma y persona conviven en el mismo navegador", {
    analysis: "Pasaron la coexistencia de las dos sesiones, las recargas y la salida pública. El fallo ocurrió en el clic en Salir de Plataforma. Un aviso del Asistente sin aceptar es una hipótesis no confirmada; no se le atribuye la causa del bloqueo.",
    area: "Marco de Plataforma · acción Salir",
    route: "/plataforma",
  }],
]);

/** Agrega metadatos ausentes sin mutar incidentes, resultados ni análisis previos. */
export function enrichBaselineIncidents(incidents = []) {
  return incidents.map((incident) => {
    const triage = triageByName.get(incident.name);
    if (!triage) return incident;
    const enriched = { ...incident };
    for (const [field, value] of Object.entries(triage)) {
      if (enriched[field] === undefined || enriched[field] === null) enriched[field] = value;
    }
    return enriched;
  });
}
