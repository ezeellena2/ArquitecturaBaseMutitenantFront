import { coverageLimitations } from "./e2e-completo-cobertura.mjs";
import { supplementWhatsAppLimitations } from "./e2e-completo-whatsapp-complemento.mjs";
import { identitySupplementLimitations } from "./e2e-completo-identidad-complemento.mjs";
import { domainSupplementLimitations } from "./e2e-completo-dominio-complemento.mjs";

// Los estados técnicos existentes no acreditan DNS ni aprobación de plantillas por proveedores reales.
export const verificationLimitations = {
  ...coverageLimitations, ...supplementWhatsAppLimitations, ...identitySupplementLimitations, ...domainSupplementLimitations,
  "BACK-CF-005": { ...domainSupplementLimitations["BACK-CF-005"], manualReason: "Necesita una prueba TXT en DNS real. El dominio Verified del preparador no acredita la verificación DNS." },
  "BACK-WA-017": {
    partialExecutionIds: [], missing: "Estimar, programar y cancelar con una plantilla Marketing realmente Approved para la WABA.",
    manualReason: "Necesita una plantilla Marketing aprobada por Meta; el entorno local no prepara esa aprobación.",
    reason: "No hay plantilla aprobada sembrada ni comando IPC para prepararla. RecorridoWhatsAppModule sustituye el transporte, pero IWhatsAppTemplateClient sigue apuntando a Graph. El resolver exige Marketing y Approved de esa WABA.",
    source: ["tools/ArquitecturaBaseMultitenant.RealE2ESetup/RecorridoWhatsAppModule.cs", "src/ArquitecturaBaseMultitenant.Infrastructure/Modules/WhatsApp/WhatsAppInfrastructureModule.cs", "src/ArquitecturaBaseMultitenant.Application/Modules/WhatsApp/Services/WhatsAppBroadcastChannelResolver.cs"],
  },
  "BACK-WA-018": { ...supplementWhatsAppLimitations["BACK-WA-018"], manualReason: "La baja del bot se prueba localmente en WAS-06; certificar que una difusión pendiente la relee requiere una plantilla aprobada por Meta." },
};
