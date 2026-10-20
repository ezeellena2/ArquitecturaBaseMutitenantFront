import { businessDefinitions } from "./e2e-completo-negocio.mjs";
import { supplementBusinessDefinitions } from "./e2e-completo-negocio-complemento.mjs";
import { roleSupplementDefinitions } from "./e2e-completo-roles-complemento.mjs";
import { platformDefinitions } from "./e2e-completo-plataforma.mjs";
import { supplementPlatformDefinitions } from "./e2e-completo-plataforma-complemento.mjs";
import { publicSupplementDefinitions } from "./e2e-completo-publico-complemento.mjs";
import { identitySupplementDefinitions } from "./e2e-completo-identidad-complemento.mjs";
import { organizationSupplementDefinitions } from "./e2e-completo-organizaciones-complemento.mjs";
import { supplementWhatsAppDefinitions } from "./e2e-completo-whatsapp-complemento.mjs";
import { platformWhatsAppDefinitions } from "./e2e-completo-whatsapp-plataforma.mjs";
import { baselineOrganizationWhatsAppDefinitions, baselineSecurityDefinitions } from "./e2e-completo-fases-baseline.mjs";
import { securitySupplementDefinitions } from "./e2e-completo-seguridad-complemento.mjs";

function plan(name, module, definitionsExport, originals, ids, runExport, preparation) {
  const definitions = ids.map((id) => {
    const definition = originals.find((row) => row.id === id);
    if (!definition) throw new Error(`No existe la definición original ${id} en ${module}.`);
    return definition;
  });
  return { name, module, definitionsExport, definitions, runExport, preparation };
}

// Sólo acciones de la barra de Page. RowActions y los menús usados únicamente
// por preparación privada quedan fuera. Los runners deben compartir el callback
// completo original: este registro nunca sustituye una acción por abrir su ruta.
export const mobileBarPlans = [
  plan("accionesmovilesnegocioarreglo", "./e2e-completo-negocio.mjs", "businessDefinitions", businessDefinitions,
    ["BIZ-19", "BIZ-20", "BIZ-21", "BIZ-22", "BIZ-34"], "runBusinessMobileBarCases",
    ["Organización y empresa propias, invitado para reenviar/revocar y miembro activo para quitar; conservar el ciclo completo de estado de empresa."]),
  plan("accionesmovilesnegocioextraarreglo", "./e2e-completo-negocio-complemento.mjs", "supplementBusinessDefinitions", supplementBusinessDefinitions,
    ["SUP-BIZ-01"], "runSupplementBusinessMobileBarCases",
    ["Organización y empresas propias del callback; editar todos sus datos y desactivar la tercera por la barra."]),
  plan("accionesmovilesrolesarreglo", "./e2e-completo-roles-complemento.mjs", "roleSupplementDefinitions", roleSupplementDefinitions,
    ["SUP-RO-06"], "runRoleMobileBarCases",
    ["Organización, empresa, rol y miembro activo con alcance de empresa; mantener vivo el mismo token durante desactivación y reactivación."]),
  plan("accionesmovilesplataformaarreglo", "./e2e-completo-plataforma.mjs", "platformDefinitions", platformDefinitions,
    ["PLAT-22", "PLAT-24", "PLAT-25", "PLAT-27", "PLAT-29", "PLAT-35", "PLAT-37"], "runPlatformMobileBarCases",
    ["Operador real con MFA, persona y organización propias para los ciclos de estado y sesiones; operador reducido propio para cambiar permisos."]),
  plan("accionesmovilesplataformaextraarreglo", "./e2e-completo-plataforma-complemento.mjs", "supplementPlatformDefinitions", supplementPlatformDefinitions,
    ["PLAT-C-01", "PLAT-C-04", "PLAT-C-17", "PLAT-C-18", "PLAT-C-20"], "runSupplementPlatformMobileBarCases",
    ["Operador real; invitación de operador propia; persona propia para ciclo de cuenta; organizaciones PendingApproval independientes para rechazar y aprobar, restaurando RequiresApproval."]),
  plan("accionesmovilespublicoarreglo", "./e2e-completo-publico-complemento.mjs", "publicSupplementDefinitions", publicSupplementDefinitions,
    ["PUB-C-02", "PUB-C-05"], "runPublicMobileBarCases",
    ["Páginas y logo propios más operador; ejecutar íntegros 404 uniformes y ETag/retiro, incluidos suspensión y retorno desde la barra de organización."]),
  plan("accionesmovilesidentidadarreglo", "./e2e-completo-identidad-complemento.mjs", "identitySupplementDefinitions", identitySupplementDefinitions,
    ["IDS-06", "IDS-09"], "runIdentityMobileBarCases",
    ["Persona y organizaciones propias; dueño único para bloqueo de baja y tres membresías ordenadas para el fallback completo."]),
  plan("accionesmovilesorganizacionesarreglo", "./e2e-completo-organizaciones-complemento.mjs", "organizationSupplementDefinitions", organizationSupplementDefinitions,
    ["ORX-01", "ORX-04"], "runOrganizationMobileBarCases",
    ["Empresa e invitaciones propias para vencida/suspendida; otra organización propia y sesiones Personal/Empresa de la misma identidad para el ciclo y revocación."]),
  plan("accionesmovileswhatsapparreglo", "./e2e-completo-whatsapp-complemento.mjs", "supplementWhatsAppDefinitions", supplementWhatsAppDefinitions,
    ["WAS-04", "WAS-05", "WAS-06", "WAS-09"], "runSupplementWhatsAppMobileBarCases",
    ["Preparar privadamente WAS-01/02/03: canal Testing real, organización, miembro y vínculo propio. Mantener carrera de tomar, mensaje, edición y lectura/desvinculación completas."]),
  plan("accionesmovileswhatsappplataformaarreglo", "./e2e-completo-whatsapp-plataforma.mjs", "platformWhatsAppDefinitions", platformWhatsAppDefinitions,
    ["WAP-02"], "runPlatformWhatsAppMobileBarCases",
    ["Canal Testing, organización y agente propios; preparación privada de la configuración necesaria de WAP-01, sin registrar ese caso; alternar operadores por Salir e ingreso UI real."]),
  plan("accionesmovilesbaselineorgwaarreglo", "./e2e-completo-fases-baseline.mjs", "baselineOrganizationWhatsAppDefinitions", baselineOrganizationWhatsAppDefinitions,
    ["BASE-E11-10", "BASE-E11-12", "BASE-E11-13"], "runBaselineOrganizationWhatsAppMobileBarCases",
    ["Fixture de organización y canal más preparación original E11-01..09; ejecutar íntegros tomar, pasar y editar contacto; omitir callbacks posteriores y limpiar por UI."]),
  plan("accionesmovilesbaselineseguridadarreglo", "./e2e-completo-fases-baseline.mjs", "baselineSecurityDefinitions", baselineSecurityDefinitions,
    ["BASE-E9-03", "BASE-E9-05"], "runBaselineSecurityMobileBarCases",
    ["Operadores originales y MFA de E9-01/02; preparar step-up E9-04 entre permisos y restablecer autenticador, sin sustituir sus evidencias."]),
  plan("accionesmovilesseguridadarreglo", "./e2e-completo-seguridad-complemento.mjs", "securitySupplementDefinitions", securitySupplementDefinitions,
    ["SEC-02"], "runSecurityStepUpRepairCases",
    ["Reutilizar la preparación completa del runner focal existente SEC-02: operador con MFA y permisos de seguridad reales."]),
];

export function collectMobileBarActionDefinitions(plans) {
  const seen = new Set();
  return plans.flatMap(({ definitions }) => definitions.map((definition) => {
    if (!definition?.id) throw new Error("La definición móvil necesita un ID original.");
    if (seen.has(definition.id)) throw new Error(`ID móvil duplicado: ${definition.id}.`);
    seen.add(definition.id);
    return definition;
  }));
}

export const mobileBarActionDefinitions = collectMobileBarActionDefinitions(mobileBarPlans);
export const mobileBarActionIds = mobileBarActionDefinitions.map(({ id }) => id);
