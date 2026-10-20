// Análisis offline de fallos observados el 20/10/2026. El baseline se enlaza
// por nombre exacto y las ejecuciones por ID/firma actual; no acredita otros pasos.
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
  const observedDenial = destination === "/org/usuarios" && Array.isArray(result.authenticationTrace)
    && result.authenticationTrace.some((item) => item?.route === "/connect/authorize" && item.status === 302
      && item.access === "business" && item.error === "access_denied" && item.domainCode === "Tenancy.Access.NotMember");
  const observedAuthentication = observedDenial
    ? " En este intento, /connect/authorize registró HTTP 302, acceso business, error access_denied y código Tenancy.Access.NotMember. Esa observación no identifica la causa interna del callback genérico."
    : "";
  return {
    analysis: `El retorno de autenticación genérico no alcanzó el destino ni uno de los estados terminales esperados para una cuenta Personal. ${observedDestination}${observedAuthentication} El detalle seguro de autenticación, cuando esté disponible, se conserva con este resultado; no se afirma una causa de servidor sin esa evidencia. El fallo no acredita acceso a una pantalla privada.`,
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

function isMobilePendingHomeFailure(result) {
  if (result.status !== "failed" || result.width !== 390 || result.currentRoute !== "/plataforma/organizaciones") return false;
  const actual = String(result.actual ?? "");
  const assistantWait = actual.includes("Antes de tu primera consulta") && actual.includes("¿Qué querés consultar?") && actual.includes("El asistente todavía no está configurado");
  const pendingWait = /getByRole\(['"]region['"]/u.test(actual) && actual.includes("Para resolver");
  return /locator\.waitFor: Timeout/u.test(actual) && (assistantWait || pendingWait);
}

function mobilePendingHomeTriage(result) {
  const waitedForRegion = String(result.actual).includes("Para resolver");
  const observedWait = waitedForRegion
    ? "La espera registrada de la región «Para resolver» agotó el plazo en /plataforma/organizaciones."
    : "La espera registrada del aviso o inicio del Asistente agotó el plazo en /plataforma/organizaciones, antes de buscar la región «Para resolver».";
  return {
    analysis: `${observedWait} PlatformHomeRoute (src/app/RouteViews.tsx) deriva el inicio móvil con módulo a la primera sección permitida, Organizaciones para este operador. PlatformHomePage sólo monta PlatformToResolve en escritorio; su rama de teléfono no incluye ese bloque. La captura observada muestra el listado de Organizaciones con la solicitud pendiente visible. El arnés se detuvo antes de abrir Revisar: la aprobación y el correo quedan sin acreditar en este intento. La evidencia identifica la diferencia entre la composición móvil y el recorrido esperado; no demuestra un rechazo del API de aprobación ni una falla de autenticación.`,
    severity: "medium",
    probableArea: "Front · composición del inicio de Plataforma a 390 px y expectativa del arnés openPlatformPendingHome.",
    reproduce: [
      "A 390 px, ingresar por la UI como operador con permisos completos y conservar esa sesión de Plataforma.",
      "Preparar por el registro UI una organización propia en PendingApproval y confirmar su presencia en el listado de Organizaciones.",
      "Abrir /plataforma con el módulo Asistente habilitado y registrar el destino /plataforma/organizaciones.",
      "Buscar la región exacta Para resolver y su enlace Revisar para esa solicitud, conservando el ancho de 390 px; registrar el listado visible y la ausencia del bloque en el inicio móvil.",
    ],
  };
}

function isCreatedReplayLocationFailure(result) {
  if (result.status !== "failed") return false;
  const actual = String(result.actual ?? "");
  return /Expected values to be strictly equal|El replay201 debe conservar Location/u.test(actual)
    && /^\+ undefined\s*$/mu.test(actual)
    && /\/api\/platform\/tenants\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/iu.test(actual);
}

function createdReplayLocationTriage() {
  return {
    analysis: "La comparación registrada del replay201 recibió Location ausente frente al Location del alta201. Antes de esa comparación ya coincidían el status201, el encabezado Idempotent-Replayed y el cuerpo con todos los IDs. PlatformTenantsController.Create usa ToCreatedResult para el alta, mientras IdempotencyFilter reconstruye el replay BufferedJson como ContentResult con status/cuerpo y sin restaurar Location; CompleteAsync conserva sólo status y cuerpo en ese camino. docs/rules/api-http.md exige201 con Location para un POST que crea, y docs/rules/idempotencia.md pide reproducir la respuesta guardada. La pérdida observada del encabezado es coherente con ese camino del Back. Este fallo no acredita duplicación de recursos, cambios de perfiles ni aceptación de la invitación: esas ramas requieren su propia evidencia del intento, incluida la posición de la aserción que se ejecutó.",
    severity: "medium",
    probableArea: "Back · IdempotencyFilter, conservación de Location en replay BufferedJson de POST201.",
    reproduce: [
      "Ingresar como operador con platform.tenants.manage y crear por la UI una organización con un Dueño sintético nuevo.",
      "Conservar el cuerpo, Idempotency-Key y Location de la respuesta201 inicial de POST /api/platform/tenants.",
      "Con el token real de ese operador, repetir el mismo POST con la misma clave y cuerpo; comparar status201, Idempotent-Replayed, todos los IDs y Location con la respuesta inicial.",
      "Registrar el Location ausente del replay por separado de las comprobaciones de duplicación, perfiles e invitación; conservar sus resultados y capturas propios.",
    ],
  };
}

/** Enriquece sólo firmas observadas; conserva la evidencia y nunca cambia estados. */
export function enrichExecutionFailures(executions = []) {
  return executions.map((entry) => {
    if (!["NUEVO-PER-09", "POL-11", "PLAT-C-13", "PLAT-C-16"].includes(entry.id) || !Array.isArray(entry.results)) return entry;
    let changed = false;
    const results = entry.results.map((result) => {
      let triage;
      if (["NUEVO-PER-09", "POL-11"].includes(entry.id) && isGenericCallbackFailure(result)) triage = entry.id === "NUEVO-PER-09" ? personalCallbackTriage(result) : pendingApprovalTriage();
      else if (entry.id === "PLAT-C-13" && isMobilePendingHomeFailure(result)) triage = mobilePendingHomeTriage(result);
      else if (entry.id === "PLAT-C-16" && isCreatedReplayLocationFailure(result)) triage = createdReplayLocationTriage();
      if (!triage) return result;
      changed = true;
      return { ...result, ...triage };
    });
    return changed ? { ...entry, results } : entry;
  });
}
