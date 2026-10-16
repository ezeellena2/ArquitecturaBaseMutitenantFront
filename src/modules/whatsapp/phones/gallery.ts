import type { CompanyResponse, OrganizationUserResponse, RoleResponse } from "@/shared/api/types";
import type { WhatsAppPhoneImportPreviewResponse } from "../api/types";
import { api, click, fill, galleryApp, galleryCase, galleryPending, page, press, type GalleryAction, type GalleryCase, type GalleryPending } from "../test/gallery";

// Usuarios y «Cargar teléfonos» de los tableros Usuarios, M-Usuarios, WA-Telefonos y M-WA-Telefonos: Grupo Delta, sus tres
// empresas, sus usuarios (con las tres invitaciones por teléfono de la E11) y los seis teléfonos de la carga.
type OrganizationUserRoleRow = OrganizationUserResponse["roles"][number];
const company = (id: string, name: string, memberCount: number): CompanyResponse =>
  ({ id, name, taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount, version: 1, createdAtUtc: "2026-01-12T15:00:00Z" });
const delta = company("company-delta", "Delta S.A.", 6);
const companies = [delta, company("company-delta-sur", "Delta Sur S.R.L.", 4), company("company-delta-norte", "Delta Norte S.A.", 3)];

const owner: OrganizationUserRoleRow = { id: "role-owner", name: "Dueño", isSystemRole: true, scope: "Organization", companyId: null };
const auditor: OrganizationUserRoleRow = { id: "role-auditor", name: "Auditor", isSystemRole: false, scope: "Organization", companyId: null };
const administrator: OrganizationUserRoleRow = { id: "role-admin", name: "Administrador", isSystemRole: true, scope: "AnyCompany", companyId: null };
const readOnly = (companyId: string): OrganizationUserRoleRow => ({ id: `role-lectura-${companyId}`, name: "Solo lectura", isSystemRole: false, scope: "SpecificCompany", companyId });
const membership = (target: CompanyResponse, roles: OrganizationUserRoleRow[]) =>
  ({ companyId: target.id, companyName: target.name, status: "Active" as const, roles, companyStatus: "Active" as const });
const [, deltaSur, deltaNorte] = companies;

const user = (memberId: string, values: Partial<OrganizationUserResponse>): OrganizationUserResponse => ({
  memberId, userId: memberId, displayName: "", email: null, state: "Active", hasManagedEmail: true, roles: [], companies: [], version: 1,
  createdAtUtc: "2026-02-03T15:00:00Z", ...values,
});
const invitation = (memberId: string, contact: { email?: string; phone?: string }, expires: string, companyRow: ReturnType<typeof membership>, state: OrganizationUserResponse["state"] = "Invited") =>
  user(memberId, { userId: null, hasManagedEmail: false, state, email: contact.email ?? null, phone: contact.phone ?? null, invitationId: `invitation-${memberId}`,
    invitationIssuedAtUtc: "2026-10-13T13:00:00Z", invitationExpiresAtUtc: `${expires}T15:00:00Z`, companies: [companyRow] });

const users = {
  lucia: user("member-lucia", { displayName: "Lucía Fernández", email: "lucia.fernandez@delta.ejemplo.com", roles: [owner], companies: [membership(delta, [administrator])], createdAtUtc: "2026-01-12T15:00:00Z" }),
  tomas: user("member-tomas", { displayName: "Tomás Acosta", email: "tomas.acosta@delta.ejemplo.com", companies: [membership(delta, [readOnly(delta.id)])] }),
  julieta: user("member-julieta", { displayName: "Julieta Sosa", email: "julieta.sosa@delta.ejemplo.com", roles: [auditor] }),
  diego: user("member-diego", { displayName: "Diego Ríos", email: "diego.rios@delta.ejemplo.com", state: "PendingDeletion", deletionScheduledForUtc: "2026-10-27T15:00:00Z",
    companies: [membership(delta, [readOnly(delta.id)])], createdAtUtc: "2026-02-18T15:00:00Z" }),
  paula: user("member-paula", { displayName: "Paula Méndez", email: "paula.mendez@delta.ejemplo.com",
    companies: [membership(delta, [readOnly(delta.id)]), membership(deltaSur, [readOnly(deltaSur.id)])], createdAtUtc: "2026-03-02T15:00:00Z" }),
  martin: user("member-martin", { displayName: "Martín Paz", email: "martin.paz@delta.ejemplo.com", companies: [membership(delta, [readOnly(delta.id)])], createdAtUtc: "2026-03-10T15:00:00Z" }),
  carolina: user("member-carolina", { displayName: "Carolina Vega", email: "carolina.vega@delta.ejemplo.com",
    companies: [membership(deltaSur, [administrator]), membership(deltaNorte, [administrator])], createdAtUtc: "2026-03-10T15:00:00Z" }),
  phone8812: invitation("member-8812", { phone: "+5491155558812" }, "2026-10-20", membership(delta, [readOnly(delta.id)])),
  phone9934: invitation("member-9934", { phone: "+5491155559934" }, "2026-10-20", membership(delta, [readOnly(delta.id)])),
  phone1200: invitation("member-1200", { phone: "+5491155551200" }, "2026-10-20", membership(delta, [readOnly(delta.id)])),
  marcos: user("member-marcos", { displayName: "Marcos Giménez", email: "marcos.gimenez@delta.ejemplo.com", state: "Inactive", createdAtUtc: "2026-02-05T15:00:00Z" }),
  sofia: invitation("member-sofia", { email: "sofia.herrera@delta.ejemplo.com" }, "2026-10-02", membership(delta, [readOnly(delta.id)])),
};
const total = 14;
// La primera página de cada tablero: Usuarios en su orden y M-Usuarios, el suyo.
const desktopUsers = [users.lucia, users.tomas, users.julieta, users.diego, users.paula, users.martin, users.carolina, users.phone8812, users.phone9934, users.phone1200];
const phoneUsers = [users.lucia, users.tomas, users.julieta, users.diego, users.paula, users.phone8812, users.phone9934, users.phone1200, users.marcos, users.sofia];
// «14 usuarios · 6 activos · 6 invitaciones», con las cantidades de cada estado y de cada empresa del tablero.
const userCounts = { all: total, active: 6, pendingDeletion: 1, invited: 5, expired: 1, inactive: 1, companyAll: total, withoutCompany: 2,
  companies: { [delta.id]: 9, [deltaSur.id]: 3, [deltaNorte.id]: 2 } };

const usersApp = (rows: OrganizationUserResponse[], options: { actions?: GalleryAction[]; readySelector?: string; readyText: string }) => galleryApp("business", "/org/usuarios", [
  api("GET", "/api/users/paged", page(rows, total)),
  api("GET", "/api/users/filter-counts", userCounts),
  api("GET", "/api/companies/paged", page(companies)),
], options);

const role = (id: string, name: string, scope: RoleResponse["scope"], description: string, companyId: string | null = null): RoleResponse =>
  ({ id, name, description, scope, companyId, isSystemRole: scope === "AnyCompany", userCount: 1, permissions: [], version: 1, createdAtUtc: "2026-01-12T15:00:00Z" });
const deltaRoles = [role("role-admin", "Administrador", "AnyCompany", "Administra la empresa: sus miembros y sus roles."),
  role(`role-lectura-${delta.id}`, "Solo lectura", "SpecificCompany", "Ve los miembros de la empresa. No cambia nada.", delta.id)];

// WA-Telefonos: dos que ya son miembros (Tomás Acosta y Martín Paz), tres que se invitan y uno inválido.
const preview: WhatsAppPhoneImportPreviewResponse = {
  rows: [
    { row: 1, phone: "+5491155554521", memberName: "Tomás Acosta", outcome: "AlreadyMember" },
    { row: 2, phone: "+5491155557310", memberName: "Martín Paz", outcome: "AlreadyMember" },
    { row: 3, phone: "+5491155558812", memberName: null, outcome: "Invite" },
    { row: 4, phone: "+5491155559934", memberName: null, outcome: "Invite" },
    { row: 5, phone: "+5491155551200", memberName: null, outcome: "Invite" },
    { row: 6, phone: null, memberName: null, outcome: "Invalid" },
  ],
  alreadyMembers: 2, invites: 3, invalid: 1,
};
const phonesApp = (options: { actions: GalleryAction[]; readyText: string }) => galleryApp("business", "/org/usuarios/cargar-telefonos", [
  api("GET", "/api/companies/paged", page(companies)),
  api("GET", "/api/roles/paged", page(deltaRoles)),
  api("POST", "/api/organization/whatsapp/phone-imports/preview", preview),
], options);

/** WA-Telefonos «Pegar o subir»: Delta S.A., «Solo lectura» y los seis teléfonos, uno por renglón. */
// El desplegable de roles se abre con el teclado: en el teléfono, el clic de jsdom no lo abre (tests.md).
const paste: GalleryAction[] = [click("Empresa", "combobox"), click("Delta S.A.", "option"), press("Roles en la empresa"),
  { type: "click", label: "Solo lectura" }, { type: "press", label: "Solo lectura", key: "Escape" },
  fill("Uno por renglón, hasta 200", ["11 5555-4521", "11 5555-7310", "11 5555-8812", "11 5555-9934", "11 5555-1200", "11 4444"].join("\n"))];
const review: GalleryAction[] = [...paste, click("Revisar 6 teléfonos")];

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const phonesGalleryCases: GalleryCase[] = [
  galleryCase("telefonos", "WA-Telefonos", "Pegar o subir", phonesApp({ actions: paste, readyText: "Revisar 6 teléfonos" })),
  galleryCase("telefonos", "WA-Telefonos", "Revisar", phonesApp({ actions: review, readyText: "6 teléfonos · 2 ya son miembros · 3 invitaciones · 1 inválido" })),
  galleryCase("telefonos", "M-WA-Telefonos", "Pegar o subir", phonesApp({ actions: paste, readyText: "Revisar 6 teléfonos" })),
  galleryCase("telefonos", "M-WA-Telefonos", "Revisar", phonesApp({ actions: review, readyText: "6 teléfonos · 3 invitaciones" })),
  // «Cargar teléfonos» de la E11 en Usuarios: secundario en la banda; en el teléfono, en el ⋮ de la barra.
  galleryCase("telefonos", "Usuarios", "Lista", usersApp(desktopUsers, { readyText: "Cargar teléfonos" }), { props: {} }),
  galleryCase("telefonos", "M-Usuarios", "Lista", usersApp(phoneUsers, { readyText: "Tomás Acosta" })),
  galleryCase("telefonos", "M-Usuarios", "Menú", usersApp(phoneUsers, { actions: [press("Más acciones")], readySelector: "[role='menu']", readyText: "Cargar teléfonos" })),
];

// CC25: la ficha de una invitación por teléfono se nombra por su número, en la banda y en el subtítulo.
const phoneInvitationApp = galleryApp("business", `/org/usuarios/${users.phone8812.memberId}`, [
  api("GET", `/api/users/${users.phone8812.memberId}`, users.phone8812),
  api("GET", "/api/companies/paged", page(companies)),
  api("GET", "/api/roles/paged", page(deltaRoles)),
], { readyText: "5555-8812" });
phonesGalleryCases.push(
  galleryCase("telefonos", "Usuario", "Invitación por teléfono", phoneInvitationApp, { stateKey: "usuario" }),
  galleryCase("telefonos", "M-Usuario", "Invitación por teléfono", phoneInvitationApp),
);

// CC26: la página pública de la invitación no tiene sesión, y la galería de la E11 arma pantallas con sesión.
const publicInvitation = "La invitación se abre sin sesión y la base de la galería de la E11 solo arma pantallas con sesión.";
export const phonesGalleryPending: readonly GalleryPending[] = (["Invitacion", "M-Invitacion"] as const)
  .map((board) => galleryPending("telefonos", board, "Invitación por teléfono", publicInvitation));
