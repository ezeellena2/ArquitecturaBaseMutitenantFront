import type { MeResponse } from "@/shared/api/types";

export const consumerWithoutOrganizations: MeResponse = {
  id: "ana",
  displayName: "Ana",
  email: "ana@example.test",
  access: "consumer",
  activeTenantId: null,
  hasPersonalSpace: true,
  organizations: [],
  effectivePermissions: { organization: [], companies: {} },
  features: [],
  permissions: [],
  culture: "es-AR",
  timeZoneId: "America/Argentina/Buenos_Aires",
  currencyCode: "ARS",
};

export const businessUser: MeResponse = {
  ...consumerWithoutOrganizations,
  access: "business",
  activeTenantId: "empresa-a",
  organizations: [{ id: "empresa-a", name: "Empresa A", roleName: null, status: "Active", memberStatus: "Active", isSelectable: true }],
  permissions: ["users.read", "roles.read"],
};

export const consumerWithOrganizations: MeResponse = {
  ...consumerWithoutOrganizations,
  organizations: [{ id: "empresa-a", name: "Empresa A", roleName: null, status: "Active", memberStatus: "Active", isSelectable: true }],
};

export const businessWithoutPermissions: MeResponse = {
  ...businessUser,
  permissions: [],
};

export const platformOperator: MeResponse = {
  ...consumerWithoutOrganizations,
  access: "platform",
  permissions: ["platform.tenants.read"],
};

export const currentUsers = {
  "consumer-empty": consumerWithoutOrganizations,
  "consumer-with-organizations": consumerWithOrganizations,
  "business-admin": businessUser,
  "business-no-permissions": businessWithoutPermissions,
  "platform-operator": platformOperator,
} satisfies Record<string, MeResponse>;

export type CurrentUserFixture = keyof typeof currentUsers;
