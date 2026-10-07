import type { DirectoryEntryRow, MeResponse, PublicSiteResponse } from "@/shared/api/types";

// Datos de los seis tableros públicos aprobados. Solo se consumen desde el arnés de capturas.
export const etapa7Companies: DirectoryEntryRow[] = [
  { slug: "delta", name: "Grupo Delta", description: "Grupo Delta y sus empresas, en un solo lugar.", logoUrl: null },
  { slug: "omega", name: "Omega S.A.", description: "Omega S.A., en un solo lugar.", logoUrl: null },
  { slug: "sigma", name: "Sigma S.R.L.", description: "Sigma S.R.L., en un solo lugar.", logoUrl: null },
];

export const etapa7PublicSite: PublicSiteResponse = {
  slug: "delta", name: "Grupo Delta", description: "Grupo Delta y sus empresas, en un solo lugar.", logoUrl: null,
  address: "Av. Corrientes 1234, piso 5, Buenos Aires", phone: "+541143215678",
  email: "contacto@delta.ejemplo.com", website: "https://delta.ejemplo.com",
};

// /api/me Personal real: nombre separado (ADR46), preferencias de la persona, sin inventar perfiles
// empresariales para la página publicada. El menú muestra la cuenta global Beto, no la organización del host.
export const etapa7PersonalUser: MeResponse = {
  id: "1f47a8b2-4d31-48eb-94c8-9c9b56673fd8",
  displayName: "Beto Ramírez", firstName: "Beto", lastName: "Ramírez", email: "beto.ramirez@beta.ejemplo.com",
  access: "consumer", activeTenantId: "b178541c-44f7-4d13-b81d-d5ab6fe2f808", hasPersonalSpace: true,
  organizations: [], effectivePermissions: { platform: [], organization: [], companies: {} },
  features: [], permissions: [], culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires", currencyCode: "ARS",
  organizationCountryCode: null, version: 42, needsPersonalLoginMethod: false, pendingLegalDocuments: [],
};
