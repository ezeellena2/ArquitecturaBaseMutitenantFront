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

function createdReplayLocationTriage(result) {
  const finalAssertion = result.currentRoute === "/org"
    && /^El replay201 debe conservar Location del alta201\.(?:\r?\n|$)/u.test(String(result.actual ?? ""));
  const scope = finalAssertion
    ? "La firma explícita corresponde a la aserción final del callback actual, con la pestaña del Dueño en /org. Según el orden de ese callback, antes de fallar también se comprobaron: otro cuerpo con la misma clave respondió422 Request.IdempotencyKeyReused; el listado conservó una sola organización propia, con una empresa y una membresía; el historial quedó sin nuevos eventos tras el replay y el422; el Dueño pendiente no tenía cuenta; la vista previa indicó NoAccount y la aceptación200 lo llevó a Business sin Personal; el operador conservó su identidad sin perfiles públicos; y hubo un único correo de invitación. Son comprobaciones anteriores al fallo de este intento, no resultados independientes ni datos heredados de intentos históricos. El resultado sigue failed por la ausencia de Location en el replay."
    : "Este fallo no acredita duplicación de recursos, cambios de perfiles ni aceptación de la invitación: esas ramas requieren su propia evidencia del intento, incluida la posición de la aserción que se ejecutó.";
  return {
    analysis: `La comparación registrada del replay201 recibió Location ausente frente al Location del alta201. Antes de esa comparación ya coincidían el status201, el encabezado Idempotent-Replayed y el cuerpo con todos los IDs. PlatformTenantsController.Create usa ToCreatedResult para el alta, mientras IdempotencyFilter reconstruye el replay BufferedJson como ContentResult con status/cuerpo y sin restaurar Location; CompleteAsync conserva sólo status y cuerpo en ese camino. docs/rules/api-http.md exige201 con Location para un POST que crea, y docs/rules/idempotencia.md pide reproducir la respuesta guardada. La pérdida observada del encabezado es coherente con ese camino del Back. ${scope}`,
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

function isQuotaSignupNavigationFailure(result) {
  if (result.status !== "failed") return false;
  const actual = String(result.actual ?? "");
  if (!/^page\.goto: Timeout 45000ms exceeded\./u.test(actual) || !actual.includes("Captura no disponible (TimeoutError)")) return false;
  const navigation = /navigating to ["']([^"'\r\n]+)["'], waiting until ["'](?:load|domcontentloaded)["']/u.exec(actual);
  if (!navigation) return false;
  try { return new URL(navigation[1]).pathname === "/registro"; }
  catch { return false; }
}

function quotaSignupNavigationTriage(result) {
  const wait = /waiting until ["']domcontentloaded["']/u.test(String(result.actual)) ? "DOMContentLoaded" : "load";
  const previous = result.previousAttempts;
  const history = Array.isArray(previous) && previous.length === 1 && isQuotaSignupNavigationFailure(previous[0])
    ? "El primer intento y el único reintento aislado registrado se conservan en el historial. No se indican nuevas repeticiones."
    : "Se conserva el intento y el historial recibido, sin completar antecedentes que no estén registrados ni indicar nuevas repeticiones.";
  const width = [1440, 390].includes(result.width) ? `${result.width} px` : "el ancho registrado en este intento";
  return {
    analysis: `La navegación del entorno de prueba a /registro agotó 45 segundos esperando ${wait}. La ejecución quedó interrumpida y no acreditó llegar a 800 admisiones nuevas. No se comprobaron el 429 WhatsApp.LoginCode.DailyLimit, el rechazo del destino fresco ni el ingreso con OTP del Phone verificado que debe conservar la capacidad protegida. El timeout no demuestra un defecto de cuota ni la ausencia persistida de LoginCodes/outbox. La causa sigue sin confirmar; el bloqueo observado corresponde a navegación del entorno o del arnés. La captura tampoco estuvo disponible por TimeoutError, según este resultado. ${history}`,
    severity: "medium",
    probableArea: "Entorno de prueba · navegación a /registro y arnés phoneForm; causa sin confirmar, verificación de cuota pendiente.",
    reproduce: [
      `Usar runQuotaWhatsAppCases de scripts/e2e-completo-cuota-whatsapp.mjs en un entorno nuevo aislado, con control Testing real, un solo contexto de navegador y ${width}.`,
      "Seguir el registro Phone por UI, su verificación y los pedidos de emisión previstos por el script, conservando los límites reales, el cooldown y el presupuesto máximo de 1000 pedidos.",
      "Observar la navegación real a /registro y registrar si page.goto agota 45000 ms antes de que el formulario quede disponible; no deducir admisiones ni resultados de cuota a partir de ese timeout.",
      "Detener el intento al timeout y conservar su resultado con los antecedentes ya registrados, sin iniciar reintentos adicionales.",
    ],
  };
}

/** Enriquece sólo firmas observadas; conserva la evidencia y nunca cambia estados. */
export function enrichExecutionFailures(executions = []) {
  return executions.map((entry) => {
    if (!["NUEVO-PER-09", "POL-11", "PLAT-C-13", "PLAT-C-16", "CUOTA-WA-01"].includes(entry.id) || !Array.isArray(entry.results)) return entry;
    let changed = false;
    const results = entry.results.map((result) => {
      let triage;
      if (["NUEVO-PER-09", "POL-11"].includes(entry.id) && isGenericCallbackFailure(result)) triage = entry.id === "NUEVO-PER-09" ? personalCallbackTriage(result) : pendingApprovalTriage();
      else if (entry.id === "PLAT-C-13" && isMobilePendingHomeFailure(result)) triage = mobilePendingHomeTriage(result);
      else if (entry.id === "PLAT-C-16" && isCreatedReplayLocationFailure(result)) triage = createdReplayLocationTriage(result);
      else if (entry.id === "CUOTA-WA-01" && isQuotaSignupNavigationFailure(result)) triage = quotaSignupNavigationTriage(result);
      if (!triage) return result;
      changed = true;
      return { ...result, ...triage };
    });
    return changed ? { ...entry, results } : entry;
  });
}
