import { coverageLimitations } from "./e2e-completo-cobertura.mjs";
import { supplementWhatsAppLimitations } from "./e2e-completo-whatsapp-complemento.mjs";
import { identitySupplementLimitations } from "./e2e-completo-identidad-complemento.mjs";
import { domainSupplementLimitations } from "./e2e-completo-dominio-complemento.mjs";
import { platformWhatsAppLimitations } from "./e2e-completo-whatsapp-plataforma.mjs";

// Los estados técnicos existentes no acreditan DNS ni aprobación de plantillas por proveedores reales.
export const verificationLimitations = {
  ...coverageLimitations, ...supplementWhatsAppLimitations, ...identitySupplementLimitations, ...domainSupplementLimitations, ...platformWhatsAppLimitations,
  "BACK-RE-007": {
    partialExecutionIds: ["PLAT-C-07"], missing: "Revisar un pedido que perdió su cuenta y sólo permite Rechazar.",
    reason: "El alta de recuperaciones rechaza el destino anterior sin cuenta. La rama histórica tras purgar la cuenta no se prepara por UI ni con el control publicado; no se agregaron semillas ni se alteró la base.",
    source: ["src/ArquitecturaBaseMultitenant.Application/Services/Auth/AccountRecoveryGuard.cs", "src/ArquitecturaBaseMultitenant.Application/Services/Platform/PlatformRecoveryDecisionService.cs"],
  },
  "BACK-WA-011": {
    partialExecutionIds: [], missing: "WindowClosed después de 24 horas y ReadOnly con número desconectado.",
    reason: "El control publica entradas con la hora UTC actual y prepara orgNumber Connected; no expone reloj ni antigüedad de 24 horas. Desconectar por UI por sí solo no acredita el vencimiento de la ventana.",
    source: ["tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/TestFeatures/WhatsAppBrowser/WhatsAppBrowserControl.Organization.cs"],
  },
  "BACK-PL-010": {
    partialExecutionIds: [], missing: "Reintentar provisión fallida comprobando los mismos IDs de una empresa y un miembro ya existentes.",
    reason: "El callback core 5b comprueba el reintento del alta interrumpida sembrada y los conteos 1/1. No expone una fixture propia con IDs parciales previos para acreditar su conservación y no se agregaron semillas ni fallas de producto.",
    source: ["scripts/test-e2e-real.test.mjs#5b"],
  },
  "BACK-CF-005": { ...domainSupplementLimitations["BACK-CF-005"], manualReason: "Necesita una prueba TXT en DNS real. El dominio Verified del preparador no acredita la verificación DNS." },
  "BACK-WA-023": { ...platformWhatsAppLimitations["BACK-WA-023"], manualReason: "Crear y borrar plantillas necesita Meta real. Bot y equipos de Plataforma se comprueban localmente en WAP-01." },
  "BACK-WA-017": {
    partialExecutionIds: [], missing: "Estimar, programar y cancelar con una plantilla Marketing realmente Approved para la WABA.",
    manualReason: "Necesita una plantilla Marketing aprobada por Meta; el entorno local no prepara esa aprobación.",
    reason: "No hay plantilla aprobada sembrada ni comando IPC para prepararla. RecorridoWhatsAppModule sustituye el transporte, pero IWhatsAppTemplateClient sigue apuntando a Graph. El resolver exige Marketing y Approved de esa WABA.",
    source: ["tools/ArquitecturaBaseMultitenant.RealE2ESetup/RecorridoWhatsAppModule.cs", "src/ArquitecturaBaseMultitenant.Infrastructure/Modules/WhatsApp/WhatsAppInfrastructureModule.cs", "src/ArquitecturaBaseMultitenant.Application/Modules/WhatsApp/Services/WhatsAppBroadcastChannelResolver.cs"],
  },
  "BACK-WA-018": { ...supplementWhatsAppLimitations["BACK-WA-018"], manualReason: "La baja del bot se prueba localmente en WAS-06; certificar que una difusión pendiente la relee requiere una plantilla aprobada por Meta." },
};
