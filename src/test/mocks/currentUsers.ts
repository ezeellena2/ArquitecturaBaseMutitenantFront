import type { Permission, PlatformPermission } from "@/auth/usePermissions";
import type { MeResponse } from "@/shared/api/types";

/// Como /api/me: los permisos de la organización van en `effectivePermissions` y `permissions` los repite. El mapa por
/// empresa va vacío: una empresa que no figura usa los de la organización (`canInCompany`), como los roles de toda la
/// organización en el back. Quien solo administra una empresa la tiene en el mapa (`businessCompanyAdmin`).
function withPermissions(user: MeResponse, organization: readonly Permission[]): MeResponse {
  return { ...user, permissions: [...organization], effectivePermissions: { platform: [], organization: [...organization], companies: {} } };
}

export const consumerWithoutOrganizations: MeResponse = {
  id: "ana",
  displayName: "Ana",
  firstName: "Ana",
  lastName: null,
  email: "ana@example.test",
  access: "consumer",
  activeTenantId: null,
  hasPersonalSpace: true,
  organizations: [],
  effectivePermissions: { platform: [], organization: [], companies: {} },
  features: [],
  permissions: [],
  culture: "es-AR",
  timeZoneId: "America/Argentina/Buenos_Aires",
  currencyCode: "ARS",
  organizationCountryCode: null,
  version: 42,
  needsPersonalLoginMethod: false,
  pendingLegalDocuments: [],
};

export const businessUser: MeResponse = withPermissions({
  ...consumerWithoutOrganizations,
  access: "business",
  organizationCountryCode: "AR",
  activeTenantId: "empresa-a",
  organizations: [{ id: "empresa-a", name: "Empresa A", roleName: null, status: "Active", memberStatus: "Active", isSelectable: true }],
}, ["users.read", "roles.read"]);

export const consumerWithOrganizations: MeResponse = {
  ...consumerWithoutOrganizations,
  organizations: [{ id: "empresa-a", name: "Empresa A", roleName: null, status: "Active", memberStatus: "Active", isSelectable: true }],
};

export const businessWithoutPermissions: MeResponse = withPermissions(businessUser, []);

export const businessRoleManager: MeResponse = withPermissions(businessUser, ["roles.read", "roles.manage"]);

/// La Dueña: el rol de toda la organización trae también los permisos de miembros de cada empresa.
const ownerPermissions: readonly Permission[] = ["users.read", "users.invite", "users.manage", "roles.read", "roles.manage", "companies.read", "companies.manage", "company.members.read", "company.members.manage", "settings.read", "settings.manage", "publicpage.manage", "audit.read"];

export const businessE6Admin: MeResponse = withPermissions(businessUser, ownerPermissions);

/// B4: un Administrador de empresa sin roles de la organización. /api/me trae sus permisos en el mapa de su empresa
/// (decisión 13), y la organización, vacía.
export const businessCompanyAdmin: MeResponse = {
  ...businessUser, permissions: [],
  effectivePermissions: { platform: [], organization: [], companies: { "company-1": ["company.members.read", "company.members.manage"] } },
};

/** Solo ve Configuración: los datos se leen como texto, sin campos grises. */
export const businessSettingsReader: MeResponse = withPermissions(businessUser, ["settings.read"]);

/// Operador exclusivo de Plataforma: sin perfiles, con los nueve permisos individuales.
const operatorPermissions: readonly PlatformPermission[] = [
  "platform.tenants.read", "platform.tenants.manage", "platform.accounts.read", "platform.accounts.manage",
  "platform.recoveries.manage", "platform.legal.manage", "platform.operators.manage", "platform.audit.read", "platform.settings.manage",
];

export const platformOperator: MeResponse = {
  ...consumerWithoutOrganizations,
  access: "platform",
  hasPersonalSpace: false,
  effectivePermissions: { platform: [...operatorPermissions], organization: [], companies: {} },
};

export const platformOperatorReader: MeResponse = {
  ...platformOperator,
  effectivePermissions: { platform: ["platform.tenants.read", "platform.accounts.read"], organization: [], companies: {} },
};

export const visualOperator: MeResponse = {
  ...platformOperator,
  id: "martin-sosa",
  displayName: "Martín Sosa",
  email: "martin.sosa@arquitecturabase.ejemplo.com",
};

const visualOrganizations: MeResponse["organizations"] = [
  { id: "grupo-delta", name: "Grupo Delta", roleName: "Dueño", status: "Active", memberStatus: "Active", isSelectable: true },
  { id: "beta", name: "Beta S.R.L.", roleName: "Miembro", status: "Suspended", memberStatus: "Active", isSelectable: false },
];

export const visualPersonal: MeResponse = {
  ...consumerWithoutOrganizations,
  id: "lucia",
  displayName: "Lucía Fernández",
  firstName: "Lucía",
  lastName: "Fernández",
  // Como el back (/api/me): en el perfil personal, el correo principal (Cuenta y M-Mas-Personal).
  email: "lucia.fer@gmail.com",
  organizations: visualOrganizations,
};

export const visualBusiness: MeResponse = {
  ...visualPersonal,
  access: "business",
  organizationCountryCode: "AR",
  activeTenantId: "grupo-delta",
  // Como el back (/api/me, R3c): en una organización, el correo verificado que ella administra, como los tableros.
  email: "lucia.fernandez@delta.ejemplo.com",
};

/** Lucía como Dueña de Grupo Delta: con «Administración», como en los tableros de Organización. */
export const visualOwner: MeResponse = withPermissions(visualBusiness, ownerPermissions);

export const visualRoleManager: MeResponse = withPermissions(visualBusiness, ["roles.read", "roles.manage"]);

export const visualErrorOrganization: MeResponse = {
  ...visualBusiness,
  id: "valentina",
  displayName: "Valentina Ruiz",
  email: "valentina.ruiz@gmail.com",
};

/// Valentina como Administradora de Delta S.A. (B4): sin roles de la organización y con los de su empresa en el mapa de
/// /api/me. La ficha de su empresa, en las capturas.
export const visualCompanyAdmin: MeResponse = {
  ...visualErrorOrganization,
  effectivePermissions: { platform: [], organization: [], companies: { "company-1": ["company.members.read", "company.members.manage"] } },
};

export const visualUnavailableSuspended: MeResponse = {
  ...visualBusiness,
  activeTenantId: "beta",
  organizationCountryCode: null,
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
  "consumer-compound-name": { ...consumerWithoutOrganizations, firstName: "María José", lastName: "de la Cruz", displayName: "María José de la Cruz" },
  "consumer-english-profile": { ...consumerWithoutOrganizations, culture: "en-US" },
  // «Tus datos» nunca se guardó: /api/me trae la versión 0 del perfil (identidad.md).
  "consumer-profile-never-saved": { ...consumerWithoutOrganizations, version: 0 },
  "consumer-needs-personal-method": { ...consumerWithoutOrganizations, needsPersonalLoginMethod: true },
  "consumer-new-terms": { ...consumerWithoutOrganizations, pendingLegalDocuments: [{ id: "terms-v2", kind: "Terms", version: 2 }] },
  "consumer-with-organizations": consumerWithOrganizations,
  "business-admin": businessUser,
  "business-e6-admin": businessE6Admin,
  "business-e6-admin-english": { ...businessE6Admin, culture: "en-US" },
  "business-settings-reader": businessSettingsReader,
  "business-role-manager": businessRoleManager,
  "business-no-permissions": businessWithoutPermissions,
  "business-company-admin": businessCompanyAdmin,
  "platform-operator": platformOperator,
  "platform-operator-reader": platformOperatorReader,
  "visual-operator": visualOperator,
  "visual-personal": visualPersonal,
  "visual-business": visualBusiness,
  "visual-owner": visualOwner,
  "visual-role-manager": visualRoleManager,
  "visual-error-org": visualErrorOrganization,
  "visual-company-admin": visualCompanyAdmin,
  "visual-unavailable-suspended": visualUnavailableSuspended,
  "visual-unavailable-pending": visualUnavailablePending,
  "visual-unavailable-closed": visualUnavailableClosed,
} satisfies Record<string, MeResponse>;

export type CurrentUserFixture = keyof typeof currentUsers;
