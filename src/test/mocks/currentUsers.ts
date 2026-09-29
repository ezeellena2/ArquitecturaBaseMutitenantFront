import type { MeResponse } from "@/shared/api/types";

export const consumerWithoutOrganizations: MeResponse = {
  id: "ana",
  displayName: "Ana",
  email: "ana@example.test",
  access: "consumer",
  activeTenantId: null,
  hasPersonalSpace: true,
  organizations: [],
  permissions: [],
  culture: "es-AR",
  timeZoneId: "America/Argentina/Buenos_Aires",
  currencyCode: "ARS",
};

export const businessUser: MeResponse = {
  ...consumerWithoutOrganizations,
  access: "business",
  activeTenantId: "empresa-a",
  organizations: [{ id: "empresa-a", name: "Empresa A", status: "Active" }],
};
