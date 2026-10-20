// Contexto de los callbacks originales, no evidencia de que se hayan ejecutado.
// Las rutas son las entradas principales de la acción. Los IDs de recursos se
// expresan como parámetros; results.currentRoute conserva la URL observada.
const originalMetadata = new Map();
const add = (script, ids, actor, route, context = {}) => {
  for (const step of ids.split(" ")) originalMetadata.set(`BASE-${step}`, { actor, route, script: `scripts/${script}`, step, ...context });
};

const core = (ids, actor, route, context) => add("recorrido-usuario.mjs", ids, actor, route, context);
const person = "Persona titular de la cuenta personal del recorrido";
const owner = "Dueño de la organización creada por el recorrido";
const operator = "Operador de Plataforma del recorrido, con código de correo y autenticador";
core("01", "Visitante sin cuenta que intenta ingresar por correo", "/login");
core("02", "Visitante que registra su cuenta personal por correo", "/registro");
core("03", "Persona que intenta registrar el correo de su cuenta existente", "/registro");
core("04 05", person, "/login");
core("06", "Visitante que inicia el registro personal con Google", "/registro");
core("07", "Visitante que inicia el registro empresarial con Google", "/registro/empresa");
core("08", "Persona que registra una organización y entra como Dueño", "/registro/empresa");
core("09", "Persona con cuenta personal y sin pertenencia a una empresa", "/login/empresa");
core("10", owner, "/login/empresa");
core("11", operator, "/plataforma", { routesByWidth: { 1440: "/plataforma", 390: "/plataforma/organizaciones" } });
core("12", "Persona con cuenta personal y operador de Plataforma en otra pestaña del mismo contexto", "/login");
core("13", "Operador de Plataforma que intenta usar la puerta personal", "/login");
core("14 15 16 17 18", person, "/cuenta");
core("19", "Visitante que pide recuperar un correo sin cuenta", "/recuperar");
core("20", "Persona que intenta recuperar su cuenta usando el correo ocupado de otra cuenta", "/recuperar");
core("21", "Visitante que escribe un correo inválido", "/login");
core("22 23 24", "Dueño que solicita un código de correo para el acceso empresa", "/login/empresa");
core("25", owner, "/org/pagina");
core("26", "Visitante de la portada pública del dominio principal", "/");
core("27", "Visitante que busca la organización publicada en el directorio", "/empresas");
core("28", "Visitante de la página pública de la organización", "/", { hostScope: "Subdominio de la organización publicada" });
core("29", "Persona con cuenta personal que ingresa desde la página pública de la organización", "/", { hostScope: "Subdominio de la organización publicada; ingreso por /login en el dominio principal" });
core("30", "Dueño que despublica la página y visitante que vuelve al mismo subdominio", "/org/pagina", { relatedRoute: "/", hostScope: "Editor privado y subdominio público de la misma organización" });

const whatsapp = (ids, actor, route, context) => add("recorrido-usuario-whatsapp.mjs", ids, actor, route, context);
const phonePerson = "Persona con Phone principal verificado y sin nombre ni correo inicial";
const controlledWebhook = { transport: "Canal privado de Testing: webhook firmado y worker reales; no certifica Meta" };
whatsapp("E8-01", "Visitante que registra una cuenta personal sólo con WhatsApp y OTP controlado", "/registro");
whatsapp("E8-02 E8-03 E8-04", phonePerson, "/login");
whatsapp("E8-05", phonePerson, "/auth/callback");
whatsapp("E8-06", "Persona con Phone principal y operador de Plataforma con sesiones simultáneas", "/");
whatsapp("E8-07 E8-08 E8-09 E8-10 E8-11 E8-12", phonePerson, "/cuenta");
whatsapp("E8-13", "Persona con cuenta Phone existente que vuelve de registro a ingreso personal", "/registro", { relatedRoute: "/login" });
whatsapp("E8-14", "Persona con Phone verificado que escribe Hola por el transporte controlado", "/webhooks/whatsapp", controlledWebhook);
whatsapp("E8-15 E8-16 E8-17", "Persona con Phone verificado que abre el enlace de ingreso del bot", "/login/enlace");
whatsapp("E8-18", "Persona con Phone principal y correo de respaldo que visita la página pública", "/", { hostScope: "Subdominio de la organización publicada" });
whatsapp("E8-19", "Operador de Plataforma que consulta la cuenta Phone y sus métodos de ingreso", "/plataforma/cuentas/:accountId");
whatsapp("E8-20", "Titular de la cuenta Phone que solicita recuperación con un teléfono nuevo", "/recuperar");
whatsapp("E8-21 E8-22", "Operador de Plataforma que revisa y aprueba la recuperación Phone", "/plataforma/recuperaciones");
whatsapp("E8-23", "Titular de la cuenta recuperada que ingresa con el Phone nuevo", "/login");
whatsapp("E8-24", "Persona que registra una organización por WhatsApp y entra como Dueño", "/registro/empresa");
whatsapp("E8-25", "Dueño con cuenta Phone existente que vuelve de registro a ingreso empresa", "/registro/empresa", { relatedRoute: "/login/empresa" });

const assistant = (ids, actor, route, context) => add("assistant-real-ui.mjs", ids, actor, route, context);
const assistantOwner = "Dueño autenticado en acceso empresa, con Asistente habilitado en su organización";
const assistantHome = { routesByWidth: { 1440: "/org", 390: "/org/asistente" } };
assistant("E8B-10-1 E8B-10-2 E8B-20-1 E8B-20-2 E8B-30-1 E8B-30-2 E8B-30-3 E8B-30-4 E8B-40-1 E8B-40-2 E8B-40-3 E8B-60-1 E8B-60-2", assistantOwner, "/org", assistantHome);
assistant("E8B-20-3", assistantOwner, "/org/usuarios");
assistant("E8B-50-1", "Operador de Plataforma que permite clave propia al Asistente de la organización", "/plataforma/organizaciones/:organizationId?tab=modules");
assistant("E8B-50-2 E8B-50-3 E8B-50-4", assistantOwner, "/org/asistente/configuracion");
assistant("E8B-60-3 E8B-60-5", assistantOwner, "/org/asistente/uso");
assistant("E8B-60-4", "Dueño con correo verificado que recibe la alerta de presupuesto del Asistente", "/org/asistente/uso", { transport: "Umbral preparado por el control privado; alerta entregada por outbox al pickup real" });

const organizationWhatsApp = (ids, actor, route, context) => add("recorrido-usuario-e11.mjs", ids, actor, route, context);
const organizationOwner = "Dueña autenticada en acceso empresa de la organización con WhatsApp habilitado";
organizationWhatsApp("E11-01", "Operador de Plataforma que prende WhatsApp para la organización de la Dueña", "/plataforma/organizaciones/:organizationId?tab=modules");
organizationWhatsApp("E11-02", organizationOwner, "/org/whatsapp/numeros");
organizationWhatsApp("E11-03", organizationOwner, "/org/whatsapp/equipos");
organizationWhatsApp("E11-04", organizationOwner, "/org/whatsapp/bot");
organizationWhatsApp("E11-05", "Cliente que registra su cuenta personal Phone por WhatsApp y OTP controlado", "/registro");
organizationWhatsApp("E11-06 E11-07 E11-08", "Cliente con cuenta Phone que escribe al número de la organización y usa el bot", "/webhooks/whatsapp", controlledWebhook);
organizationWhatsApp("E11-09", organizationOwner, "/org/whatsapp/chats", { relatedRoute: "/org/whatsapp/chats/:conversationId" });
organizationWhatsApp("E11-10 E11-11 E11-12", "Dueña que atiende la conversación de Clientes de su organización", "/org/whatsapp/chats/:conversationId");
organizationWhatsApp("E11-13", organizationOwner, "/org/whatsapp/contactos/:contactId");
organizationWhatsApp("E11-14", "Dueña que revisa la carga de teléfonos de usuarios de su organización", "/org/usuarios/cargar-telefonos");
organizationWhatsApp("E11-15", "Cliente con cuenta Phone vinculada, autenticado en acceso Personal", "/mensajes/:conversationId");

const security = (ids, actor, route) => add("recorrido-usuario-e9.mjs", ids, actor, route);
security("E9-01 E9-02", "Operador nuevo de Plataforma (5b a 1440 px; 5c a 390 px), en su primer alta del autenticador", "/plataforma");
security("E9-03 E9-04", "Operador de Plataforma del recorrido que cambia permisos de otro operador y confirma su autenticador", "/plataforma/cuentas/:accountId");
security("E9-05", "Operador de Plataforma del recorrido que restablece el autenticador del operador nuevo", "/plataforma/cuentas/:accountId");
security("E9-06", operator, "/plataforma/configuracion");
security("E9-07", "Operador de Plataforma del recorrido que consulta los eventos del autenticador", "/plataforma/auditoria");

/** Sólo agrega contexto de fuente a los 98 IDs originales. No deduce resultados. */
export function enrichOriginalExecutions(executions) {
  return executions.map((execution) => {
    const metadata = originalMetadata.get(execution.id);
    if (!metadata) return execution;
    const { actor, route, script, step, ...context } = metadata;
    const previousSource = execution.source && typeof execution.source === "object" && !Array.isArray(execution.source) ? execution.source : {};
    return {
      ...execution,
      actor,
      route,
      sourceRoute: route,
      source: { ...previousSource, ...context, script, step },
    };
  });
}
