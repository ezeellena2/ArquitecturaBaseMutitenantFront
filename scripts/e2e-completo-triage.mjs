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

function isGenericCallbackFailure(result) {
  if (result.status !== "failed") return false;
  const callback = /\/auth\/callback(?:[?#\s"'<>)]|$)/u;
  return callback.test(String(result.currentRoute ?? ""))
    || callback.test(String(result.actual ?? ""))
    || /No pudimos iniciar tu sesión/iu.test(String(result.actual ?? ""));
}

function personalCallbackTriage(result) {
  // Sólo el diagnóstico nuevo identifica el destino de este intento. Las rutas
  // del caso, las URL del error y los intentos anteriores no lo acreditan.
  const destination = /^Destino protegido (\/org\/usuarios|\/plataforma\/cuentas) desde Personal:/u.exec(String(result.actual ?? ""))?.[1];
  const observedDestination = destination
    ? `El destino protegido registrado fue ${destination}.`
    : "El destino protegido que falló no quedó registrado en este intento; no se deduce de los intentos anteriores.";
  return {
    analysis: `El retorno de autenticación genérico no alcanzó el destino ni uno de los estados terminales esperados para una cuenta Personal. ${observedDestination} El detalle seguro de autenticación, cuando esté disponible, se conserva con este resultado; no se afirma una causa de servidor sin esa evidencia. El fallo no acredita acceso a una pantalla privada.`,
    severity: "medium",
    probableArea: "Front · retorno OIDC y recuperación de acceso en CallbackPage / SessionRecovery (inferencia).",
    reproduce: [
      "Ingresar por la UI con una cuenta Personal sin organizaciones.",
      destination
        ? `Abrir ${destination} en una pestaña nueva conservando la sesión Personal.`
        : "Abrir ambas rutas por separado en pestañas nuevas: /org/usuarios y /plataforma/cuentas. El intento guardado no identifica cuál falló.",
      "Esperar el ingreso o rechazo correspondiente, o el regreso a Inicio; registrar si queda en /auth/callback con el mensaje genérico de ingreso.",
    ],
  };
}

function pendingApprovalTriage() {
  return {
    analysis: "Tras el alta con RequiresApproval y la confirmación «Recibimos el pedido», entrar a /org terminó en el callback genérico en vez de mostrar «Estamos revisando…». CallbackPage no contempla PendingApproval, mientras LoginPage sí lo trata; esa diferencia es una causa probable por inferencia de las fuentes. El detalle seguro de autenticación, cuando esté disponible, se conserva con este resultado; no se afirma una causa de servidor sin esa evidencia.",
    severity: "medium",
    probableArea: "Front · CallbackPage, tratamiento de organización pendiente de aprobación (inferencia).",
    reproduce: [
      "Como operador completo, guardar temporalmente la política empresarial RequiresApproval y conservar su valor anterior.",
      "Registrar por la UI una organización nueva y comprobar la confirmación «Recibimos el pedido».",
      "Con la sesión pública de ese Dueño, abrir /org y esperar «Estamos revisando…»; observar si termina en /auth/callback con el mensaje genérico de ingreso.",
      "Restaurar por la UI la política empresarial anterior aunque falle el acceso.",
    ],
  };
}

/** Enriquece dos fallos observados; conserva la evidencia y nunca cambia estados. */
export function enrichExecutionFailures(executions = []) {
  return executions.map((entry) => {
    if (!["NUEVO-PER-09", "POL-11"].includes(entry.id) || !Array.isArray(entry.results)) return entry;
    let changed = false;
    const results = entry.results.map((result) => {
      if (!isGenericCallbackFailure(result)) return result;
      changed = true;
      return { ...result, ...(entry.id === "NUEVO-PER-09" ? personalCallbackTriage(result) : pendingApprovalTriage()) };
    });
    return changed ? { ...entry, results } : entry;
  });
}
