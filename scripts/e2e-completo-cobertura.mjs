// Trazabilidad adicional del informe, sin ejecutar ni aprobar pruebas.
// Cada fila describe una acción efectivamente escrita en la suite. El informe
// debe agregar estos covers a las ejecuciones conservando results por ancho.
// Un enlace sin resultado sigue Bloqueado; el estado lo resuelve buildMatrix.
const row = (executionId, matrixIds, source, evidence) => ({ executionId, matrixIds, source, evidence });

export const additionalCoverageRows = [
  row("BIZ-01", [
    "GUIA-registrar-empresa-02", "GUIA-registrar-empresa-03", "SCREEN-registro-empresa",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-01",
  "registerBusiness marca los términos, escribe el correo, pide el código, lee el pickup y verifica por UI; luego completa nombre, slug y primera empresa y entra con la cuenta Dueña. No carga CUIT."),

  row("BIZ-02", [
    "GUIA-crear-un-rol-y-asignarlo-02", "SCREEN-rol",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-02",
  "createReadRole completa Nombre, Vale en y Ver usuarios por UI, crea el rol, espera su encabezado y relee el recurso para exigir exactamente users.read. No pulsa Crear rol desde el listado."),

  row("BIZ-03", [
    "GUIA-crear-un-rol-y-asignarlo-04", "SCREEN-usuario",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-03",
  "Abre la ficha de la persona invitada, marca el rol recién creado en Roles de la organización, guarda por UI y exige que la ficha real conserve exactamente esa asignación. El acceso a la ficha es por URL, no desde una fila."),

  row("BIZ-05", [
    "GUIA-invitar-y-aceptar-01", "GUIA-invitar-y-aceptar-02", "SCREEN-usuarios",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-05",
  "invite abre Invitar usuario desde Usuarios, escribe correo, selecciona la empresa y Administrador y confirma; la ficha leída por API verifica la empresa y la ausencia de roles de organización."),

  row("BIZ-06", [
    "GUIA-invitar-y-aceptar-04", "GUIA-invitar-y-aceptar-05",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-06",
  "La cuenta invitada entra por h.login en la puerta empresarial con el OTP del pickup; el Me real exige tenant A y exactamente users.read, y la UI/API Usuarios funcionan. No certifica el inicio con roles de empresa."),

  row("BIZ-10", [
    "SCREEN-avisos",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-10",
  "Dos editores guardan el mismo rol: el segundo obtiene General.ConcurrencyConflict real, con Ver lo nuevo y Seguir editando visibles, y la lectura conserva la descripción ganadora."),

  row("BIZ-12", [
    "GUIA-configuracion-y-dominio-01", "GUIA-configuracion-y-dominio-02", "SCREEN-configuracion",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-12",
  "Pulsa Agregar dominio, escribe el dominio sintético y Siguiente; el POST devuelve Pending y la UI abre Verificar con el TXT que también aparece en la lectura real. No carga ni verifica un TXT en DNS."),

  row("BIZ-15", [
    "SCREEN-error-org",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-15",
  "Comprueba 404 de recursos que existen en B usando token A y abre la ficha ajena: la UI de organización muestra No encontramos esta página, sin datos ajenos."),

  row("BIZ-19", [
    "GUIA-invitar-y-aceptar-03",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-19",
  "Lee los correos reales del destinatario en el pickup y extrae la URL de invitación del cuerpo de cada .eml; el reenvío emite una prueba distinta y la anterior se rechaza. No certifica entrega a un buzón externo."),

  row("BIZ-26", [
    "SCREEN-roles",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-26",
  "Crea un rol específico de la empresa y exige scope, companyId y permisos exactos; filtra Vale en en el listado, comprueba companyId en API/URL y el enlace visible del rol creado."),

  row("BIZ-27", [
    "SCREEN-empresa",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-27",
  "El Dueño abre la empresa y su miembro, usa Cambiar roles y Roles en la empresa, guarda y verifica userCount=1 del rol asignado. Es la ficha editable del Dueño; el Administrador de BIZ-09 sólo probó su variante restringida."),

  row("BIZ-35", [
    "GUIA-sumar-una-empresa-01", "GUIA-sumar-una-empresa-02", "SCREEN-empresas",
  ], "scripts/e2e-completo-negocio.mjs#BIZ-35",
  "Desde Empresas pulsa Crear empresa, completa nombre y CUIT sintético válido y obtiene 201; la lectura del listado contiene el ID creado. El segundo alta verifica además rechazo del CUIT duplicado."),

  row("PLAT-28", [
    "SCREEN-no-disponible",
  ], "scripts/e2e-completo-plataforma.mjs#PLAT-28",
  "El Dueño de una organización suspendida verifica su código real, obtiene Tenancy.Tenant.Suspended y ve el encabezado específico de esa organización sin entrar a /org."),

  row("PLAT-34", [
    "SCREEN-avisos",
  ], "scripts/e2e-completo-plataforma.mjs#PLAT-34",
  "Dos pestañas guardan Configuración; el segundo PUT responde 409, la UI conserva el aviso de otra edición y Ver lo nuevo, y el caso restaura el valor original por UI."),

  row("POL-10", [
    "GUIA-registrar-empresa-05",
  ], "scripts/e2e-completo-politicas.mjs#POL-10",
  "Con RequiresApproval, completa un alta real, exige requiresApproval=true y Recibimos el pedido y comprueba que no exista el botón Entrar a la organización. No certifica su aprobación ni el aviso posterior."),

  row("POL-11", [
    "SCREEN-no-disponible",
  ], "scripts/e2e-completo-politicas.mjs#POL-11",
  "El acceso /org de la organización pendiente muestra Estamos revisando y su explicación; el caso exige la ausencia del enlace a datos de su empresa."),

  row("NUEVO-PER-07", [
    "GUIA-registrarse-02", "GUIA-registrarse-03", "GUIA-registrarse-04", "GUIA-registrarse-05", "SCREEN-registro",
  ], "scripts/e2e-completo-personal.mjs#NUEVO-PER-07",
  "registerPerson marca los términos, escribe un correo sintético, envía y verifica el OTP real y espera el inicio; el caso exige access=consumer, cero organizaciones y ancho correcto. No pulsa Crear mi cuenta desde la portada."),

  row("MOD-17", [
    "GUIA-asistente-primera-vez-01",
  ], "scripts/e2e-completo-modulos.mjs#MOD-17",
  "prepareAssistant elimina sólo la aceptación del escenario de la organización nueva mediante el bridge; la UI acepta Entendido y State debe confirmar noticeAccepted=true para la cuenta Dueña. No certifica la bienvenida, consultas fijas ni Para resolver."),
];

// No se incorporan resultados ni estados de aprobación a este mapa.
// Tampoco se completan automáticamente covers por ruta, área o similitud textual.
export const additionalCovers = Object.fromEntries(additionalCoverageRows.map(({ executionId, matrixIds }) => [executionId, matrixIds]));

// Estos registros conservan su resultado y su captura, pero sólo ejercen una
// parte de la fila agrupada. El filtro se limita al par exacto, sin afectar
// pruebas originales ni otras alternativas que acrediten la acción completa.
export const coverageLimitations = {
  "BACK-PL-003": {
    partialExecutionIds: ["PLAT-01", "PLAT-02", "PLAT-03", "PLAT-04", "PLAT-05", "PLAT-06", "PLAT-07"],
    missing: ["Abrir /plataforma y comprobar la primera sección disponible.", "Ingresar con un operador sin ninguna sección accesible y exigir permiso denegado."],
    reason: "PLAT-01 consulta Organizaciones y oculta dos controles; PLAT-02 a PLAT-07 deniegan otras rutas. Ni cada registro ni su conjunto preparan las dos ramas restantes del menú y del inicio.",
    source: "scripts/e2e-completo-plataforma.mjs#PLAT-01..07",
  },
  "BACK-PL-026": {
    partialExecutionIds: ["POL-02", "POL-05", "POL-09"],
    missing: ["Validar los extremos permitidos 1–50 y los valores fuera de rango.", "Rechazar correos inválidos y comprobar los doce perfiles de límites completos."],
    reason: "Estos registros guardan políticas de registro y el máximo de una organización con motivo; no ejercen todas las validaciones y los límites incluidos en la fila de Configuración.",
    source: "scripts/e2e-completo-politicas.mjs#POL-02,05,09",
  },
  "BACK-EM-005": {
    partialExecutionIds: ["BIZ-22"],
    missing: ["Mientras la empresa está inactiva, comprobar que sus roles dejan de aportar permisos efectivos."],
    reason: "BIZ-22 depende de la inactivación BIZ-21 y confirma la reactivación con los mismos IDs de miembros; no consulta permisos de un actor que dependiera exclusivamente de esa empresa mientras estuvo inactiva.",
    source: "scripts/e2e-completo-negocio.mjs#BIZ-21..22",
  },
  "BACK-RO-007": {
    partialExecutionIds: ["BIZ-27"],
    missing: ["Intentar cambiar el alcance y comprobar ScopeChangeHasUsers.", "Ejercitar asignaciones de personas invitadas y desactivadas, además de la persona activa."],
    reason: "BIZ-27 asigna el rol a una persona activa, muestra controles bloqueados y comprueba DELETE HasUsers; no envía el cambio de alcance ni prepara los otros estados de asignación de la fila.",
    source: "scripts/e2e-completo-negocio.mjs#BIZ-27",
  },
  "BACK-ID-018": {
    partialExecutionIds: ["BIZ-16"],
    missing: ["Salir y volver a ingresar por la puerta empresarial para comprobar la última organización elegida.", "Comprobar la separación de Personal en ese reingreso de la misma identidad."],
    reason: "BIZ-16 comprueba las dos membresías y cambia de A a B con sus permisos propios; no vuelve a autenticar para comprobar la selección recordada ni Personal en ese reingreso.",
    source: "scripts/e2e-completo-negocio.mjs#BIZ-16",
  },
  "BACK-AS-014": {
    partialExecutionIds: ["MOD-03", "MOD-27"],
    missing: ["Comprobar el recurso privado de otro acceso de la misma identidad.", "Comprobar el rechazo del operador de Plataforma ante la conversación privada ajena."],
    reason: "MOD-03 comprueba otra persona consumer y MOD-27 otra organización Business. Son fronteras reales, pero ninguna alternativa individual ni ambas juntas acreditan los otros accesos y Plataforma descritos en la fila.",
    source: "scripts/e2e-completo-modulos.mjs#MOD-03,27",
  },
};

export function applyAdditionalCoverage(executions) {
  return executions.map((execution) => {
    const additional = additionalCovers[execution.id];
    if (!additional && !execution.covers) return { ...execution };
    const covers = [...new Set([...(execution.covers ?? []), ...(additional ?? [])])]
      .filter((id) => !coverageLimitations[id]?.partialExecutionIds.includes(execution.id));
    return { ...execution, covers };
  });
}
