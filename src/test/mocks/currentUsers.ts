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

const visualOrganizations: MeResponse["organizations"] = [
  { id: "grupo-delta", name: "Grupo Delta", roleName: "Dueño", status: "Active", memberStatus: "Active", isSelectable: true },
  { id: "beta", name: "Beta S.R.L.", roleName: "Miembro", status: "Suspended", memberStatus: "Active", isSelectable: false },
];

export const visualPersonal: MeResponse = {
  ...consumerWithoutOrganizations,
  id: "lucia",
  displayName: "Lucía Fernández",
  email: "lucia.fernandez@delta.ejemplo.com",
  organizations: visualOrganizations,
};

export const visualBusiness: MeResponse = {
  ...visualPersonal,
  access: "business",
  activeTenantId: "grupo-delta",
};

export const visualErrorOrganization: MeResponse = {
  ...visualBusiness,
  id: "valentina",
  displayName: "Valentina Ruiz",
  email: "valentina.ruiz@gmail.com",
};

export const visualUnavailableSuspended: MeResponse = {
  ...visualBusiness,
  activeTenantId: "beta",
};

export const visualUnavailablePending: MeResponse = {
  ...visualBusiness,
  organizations: [
    { id: "grupo-delta", name: "Grupo Delta", roleName: "Dueño", status: "PendingApproval", memberStatus: "Active", isSelectable: false },
    { id: "beta", name: "Beta S.R.L.", roleName: "Miembro", status: "Suspended", memberStatus: "Active", isSelectable: false },
  ],
};

export const visualUnavailableClosed: MeResponse = {
  ...visualUnavailableSuspended,
  organizations: [
    { id: "grupo-delta", name: "Grupo Delta", roleName: "Dueño", status: "Active", memberStatus: "Active", isSelectable: true },
    { id: "beta", name: "Beta S.R.L.", roleName: "Miembro", status: "Closed", memberStatus: "Active", isSelectable: false },
  ],
};

export const currentUsers = {
  "consumer-empty": consumerWithoutOrganizations,
  "consumer-with-organizations": consumerWithOrganizations,
  "business-admin": businessUser,
  "business-no-permissions": businessWithoutPermissions,
  "platform-operator": platformOperator,
  "visual-personal": visualPersonal,
  "visual-business": visualBusiness,
  "visual-error-org": visualErrorOrganization,
  "visual-unavailable-suspended": visualUnavailableSuspended,
  "visual-unavailable-pending": visualUnavailablePending,
  "visual-unavailable-closed": visualUnavailableClosed,
} satisfies Record<string, MeResponse>;

export type CurrentUserFixture = keyof typeof currentUsers;
