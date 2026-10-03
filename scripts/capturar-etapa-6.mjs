import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertCapturedPairs, captureCase, startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const output = path.join(root, "docs/design/capturas/etapa-6");
export const canvas = path.join(root, "docs/design/lienzo");
export const manifestFile = path.join(output, "manifest.json");

const api = (method, path, body, status = 200, query) => ({ method, path, body, status, ...(query ? { query } : {}) });
const pageOf = (items, pageSize = 10, totalCount = items.length) => ({
  items, page: 1, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize), hasPrevious: false, hasNext: totalCount > pageSize,
});

const owner = {
  id: "role-owner", name: "Dueño", description: null, scope: "Organization", companyId: null,
  isSystemRole: true, userCount: 1, permissions: ["users.read", "users.invite", "users.manage", "roles.read", "roles.manage", "roles.assign", "companies.read", "companies.manage", "settings.read", "settings.manage", "audit.read", "publicpage.manage", "company.members.read", "company.members.manage"],
  version: 1, createdAtUtc: "2026-10-02T12:00:00Z",
};
const peopleRole = {
  ...owner, id: "role-people", name: "Recursos humanos", description: "Invita, edita y deshabilita usuarios.",
  isSystemRole: false, userCount: 2, permissions: ["users.read", "users.invite", "users.manage"],
};
const companyAdmin = {
  ...owner, id: "role-company-admin", name: "Administrador", scope: "AnyCompany", companyId: null,
  permissions: ["company.members.read", "company.members.manage"], userCount: 2,
};
const companyReader = {
  ...owner, id: "role-company-reader", name: "Solo lectura", scope: "SpecificCompany", companyId: "company-1",
  isSystemRole: false, permissions: ["company.members.read"], userCount: 1,
};
const roles = [owner, peopleRole, companyAdmin, companyReader];
const company = {
  id: "company-1", name: "Delta S.A.", taxId: { country: "AR", type: "AR-CUIT", number: "30712345678" },
  timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 2, version: 3, createdAtUtc: "2026-10-02T12:00:00Z",
};
const addableCompany = {
  ...company, id: "company-2", name: "Beta S.R.L.", taxId: null, memberCount: 1, version: 1,
};
const member = {
  memberId: "member-1", userId: "user-1", displayName: "Tomás Acosta", email: "tomas@example.test", state: "Active",
  hasManagedEmail: true, membershipStatus: "Active", roles: [owner], companies: [{
    companyId: company.id, companyName: company.name, status: "Active", roles: [companyAdmin],
  }], invitationId: null, invitationIssuedAtUtc: null, invitationExpiresAtUtc: null, version: 8,
  createdAtUtc: "2026-10-02T12:00:00Z",
};
const organizationUserRows = [
  ["member-lucia", "Lucía Fernández", "lucia@example.test", "Active"],
  ["member-1", "Tomás Acosta", "tomas@example.test", "Active"],
  ["member-julieta", "Julieta Sosa", "julieta@example.test", "Active"],
  ["member-diego", "Diego Ríos", "diego@example.test", "PendingDeletion"],
  ["member-paula", "Paula Méndez", "paula@example.test", "Active"],
  ["member-martin", "Martín Paz", "martin@example.test", "Active"],
  ["member-carolina", "Carolina Vega", "carolina@example.test", "Active"],
  ["member-marcos", "Marcos Giménez", "marcos@example.test", "Inactive"],
  ["member-sofia", "Sofía Herrera", "sofia@example.test", "Invited"],
  ["member-valentina", "valentina.ruiz@gmail.com", "valentina.ruiz@gmail.com", "Invited"],
].map(([memberId, displayName, email, state]) => ({
  ...member, memberId, userId: state === "Invited" ? null : memberId.replace("member-", "user-"),
  displayName, email, state, hasManagedEmail: state === "Active",
  invitationId: state === "Invited" ? `invitation-${memberId}` : null,
}));
const companyMember = {
  memberId: member.memberId, userId: member.userId, displayName: member.displayName, email: member.email,
  state: "Active", membershipStatus: "Active", roles: [companyAdmin], version: 8, createdAtUtc: member.createdAtUtc,
};
const actors = [{ actorId: "user-owner", actorKind: "User", actorText: "Persona", displayName: "Lucía Fernández" }];
const auditEntries = [
  ["CompanyMembershipRolesChanged", "Cambió los roles de Tomás Acosta", "Delta S.A.", "Tomás Acosta", "2026-09-27T13:42:00Z"],
  ["UserInvited", "Invitó a valentina.ruiz@gmail.com", "", "valentina.ruiz@gmail.com", "2026-09-27T12:15:00Z"],
  ["OrganizationUserAdded", "Agregó a Paula Méndez", "", "Paula Méndez", "2026-09-26T21:03:00Z"],
  ["RoleCreated", "Creó el rol Recursos humanos", "", "Recursos humanos", "2026-09-26T14:20:00Z"],
  ["OrganizationUserDisabled", "Deshabilitó a Marcos Giménez", "", "Marcos Giménez", "2026-09-24T19:40:00Z"],
  ["InvitationExpired", "Venció la invitación a carla.bianchi@delta.ejemplo.com", "", "carla.bianchi@delta.ejemplo.com", "2026-09-23T11:00:00Z"],
  ["CompanyUpdated", "Cambió la zona de Delta Sur S.R.L.", "Delta Sur S.R.L.", "Delta Sur S.R.L.", "2026-09-22T15:31:00Z"],
  ["OrganizationSettingsUpdated", "Cambió el idioma y la región predeterminados", "", "Grupo Delta", "2026-09-20T18:12:00Z"],
].map(([action, actionText, whereText, affectedDisplayName, occurredAtUtc], index) => ({
  id: `audit-${index + 1}`, occurredAtUtc, action, actionText,
  entityType: index === 0 ? "CompanyMembership" : "Organization",
  entityText: index === 0 ? "Acceso a empresa" : "Organización", affectedDisplayName, whereText,
  actorKind: "User", actorText: "Persona", actorId: "user-owner", actorDisplayName: "Lucía Fernández",
  changes: index === 0 ? [{ field: "Roles", oldValue: "", newValue: "Administrador" }] : [],
}));
const permissionGroups = [
  { area: "users", name: "Usuarios", permissions: ["users.read", "users.invite", "users.manage"].map((code) => ({ code, name: code, description: "Permiso de organización." })) },
  { area: "roles", name: "Roles", permissions: ["roles.read", "roles.manage", "roles.assign"].map((code) => ({ code, name: code, description: "Permiso de organización." })) },
  { area: "companies", name: "Empresas", permissions: ["companies.read", "companies.manage"].map((code) => ({ code, name: code, description: "Permiso de organización." })) },
  { area: "settings", name: "Configuración", permissions: ["settings.read", "settings.manage"].map((code) => ({ code, name: code, description: "Permiso de organización." })) },
  { area: "audit", name: "Auditoría", permissions: [{ code: "audit.read", name: "audit.read", description: "Permiso de organización." }] },
  { area: "publicpage", name: "Página pública", permissions: [{ code: "publicpage.manage", name: "publicpage.manage", description: "Permiso de organización." }] },
];

const roleLists = [
  api("GET", "/api/roles/paged", pageOf([companyAdmin, companyReader], 10, 2), 200, { scope: "Company" }),
  api("GET", "/api/roles/paged", pageOf([owner, peopleRole], 10, 2), 200, { scope: "Organization" }),
  api("GET", "/api/roles/paged", pageOf(roles, 10, roles.length)),
];
const companyOptions = api("GET", "/api/companies/paged", pageOf([company], 100, 1), 200, { page: "1", pageSize: "100", sort: "name" });
const userCompanyOptions = api("GET", "/api/companies/paged", pageOf([company, addableCompany], 100, 2), 200, { page: "1", pageSize: "100", sort: "name" });
const companyRows = [company, {
  ...company, id: "company-3", name: "Delta Sur S.R.L.",
  taxId: { country: "AR", type: "AR-CUIT", number: "30715554442" }, timeZoneId: "America/Argentina/Cordoba", memberCount: 4,
}, {
  ...company, id: "company-4", name: "Delta Norte S.A.", taxId: null, memberCount: 3,
}];
const companiesPage = api("GET", "/api/companies/paged", pageOf(companyRows), 200, { page: "1", pageSize: "10" });
const organizationUsers = api("GET", "/api/users/paged", pageOf(organizationUserRows, 10, 11), 200, { page: "1", pageSize: "10" });

function commonAdminResponses() {
  return [
    ...roleLists,
    companyOptions,
    api("GET", "/api/users/paged", pageOf([member], 100, 1), 200, { page: "1", pageSize: "100" }),
  ];
}

function usersResponses() {
  return [
    organizationUsers,
    api("GET", "/api/users/filter-counts", { all: 11, active: 6, pendingDeletion: 1, invited: 3, expired: 0, inactive: 1 }),
    ...commonAdminResponses(),
  ];
}

function userDetailResponses() {
  return [
    api("GET", "/api/users/member-1", member),
    ...roleLists,
    userCompanyOptions,
  ];
}

function settingsResponses(domainState = "Verified") {
  const domain = {
    id: "domain-1", domain: "delta.example.test", status: domainState,
    txtRecordName: domainState === "Pending" ? "_ab-verification.delta.example.test" : null,
    txtRecordValue: domainState === "Pending" ? "ab-verification=visual-only" : null,
    createdAtUtc: "2026-10-02T12:00:00Z", verifiedAtUtc: domainState === "Verified" ? "2026-10-02T12:05:00Z" : null, version: 4,
  };
  return [
    api("GET", "/api/organization/settings", { name: "Grupo Delta", defaultCulture: "es-AR", defaultTimeZoneId: "America/Argentina/Buenos_Aires", defaultCurrency: "ARS", version: 12 }),
    api("GET", "/api/organization/settings/domains", domainState === "Sin dominio" ? [] : [domain]),
    api("PUT", "/api/organization/settings", null, 204),
    api("POST", "/api/organization/settings/domains", { ...domain, status: "Pending" }, 201),
    api("DELETE", "/api/organization/settings/domains/domain-1", null, 204),
  ];
}

function publicPageResponses(state = "Published") {
  const blocked = state === "Despublicada por la plataforma";
  const published = state === "Publicada";
  return [api("GET", "/api/organization/public-page", {
    slug: "grupo-delta", name: "Página de Grupo Delta", description: "Servicios para empresas.", logoDataUri: null,
    contactEmail: "contacto@example.test", contactPhone: null, address: null, website: null,
    isPublished: published, publishBlockedAtUtc: blocked ? "2026-09-26T12:00:00Z" : null,
    publishBlockedReason: blocked ? "Datos de contacto falsos" : null, version: 5,
  })];
}

function auditResponses() {
  return [
    api("GET", "/api/organization/audit", { items: auditEntries, nextCursor: "audit-next", hasMore: true }),
    api("GET", "/api/organization/audit/actors", actors),
  ];
}

function buildCases() {
  const scenarios = [];
  const both = ({ pair, board, mobileBoard, path, responses = [], actions = [], boardActions = [], mobileBoardActions = boardActions, props = {}, mobileProps = props, readySelector = "main", fixture = "business-e6-admin", readyText }) => {
    for (const [width, height, viewport, boardName] of [
      [1440, 900, "escritorio", board], [390, 844, "movil", mobileBoard ?? board],
    ]) {
      scenarios.push({
        id: `${pair}-${viewport}`, pair, group: "organizacion", board: boardName, props: viewport === "movil" ? mobileProps : props,
        boardActions: viewport === "movil" ? mobileBoardActions : boardActions,
        ...(viewport === "movil" && boardName === board ? { boardViewport: { width: 1440, height: 900 } } : {}),
        viewport: { width, height },
        app: {
          path: `/src/test/visualApp.html?as=${fixture}&route=${encodeURIComponent(path)}`,
          captureMode: "harness", userFixture: fixture, responses,
          actions: [...(fixture === "business-e6-admin" && viewport === "escritorio" ? [{ type: "click", role: "button", name: "Administración" }] : []), ...actions],
          readySelector, ...(readyText ? { readyText } : {}),
        },
      });
    }
  };

  const usersApi = usersResponses();
  both({ pair: "registro-empresa", board: "Registro-Empresa", mobileBoard: "M-Registro-Empresa", path: "/registro/empresa?google=complete",
    fixture: "consumer-empty", responses: [api("GET", "/api/auth/external/google/antiforgery", { requestToken: "visual-antiforgery" })], props: { estado: "Tu organización" } });
  both({ pair: "usuarios-lista", board: "Usuarios", mobileBoard: "M-Usuarios", path: "/org/usuarios", responses: usersApi });
  both({ pair: "usuarios-invitar", board: "Usuarios", mobileBoard: "M-Usuarios", path: "/org/usuarios", responses: usersApi,
    boardActions: [{ type: "click", selector: "button.b-pri" }], actions: [{ type: "click", role: "button", name: "Invitar usuario" }], readySelector: '[role="dialog"]' });

  both({ pair: "usuario-activo", board: "Usuario", mobileBoard: "M-Usuario", path: "/org/usuarios/member-1", responses: [
    ...userDetailResponses(), ...commonAdminResponses(),
  ], props: { usuario: "Tomás (activo)" } });
  both({ pair: "usuario-roles-empresa", board: "Usuario", mobileBoard: "M-Usuario", path: "/org/usuarios/member-1", responses: userDetailResponses(),
    props: { usuario: "Tomás (activo)" },
    boardActions: [{ type: "click", selector: 'button[aria-label^="Acciones de "]' }, { type: "click", selector: 'button[role="menuitem"]:not(.pel)' }],
    mobileBoardActions: [],
    actions: [{ type: "click", role: "button", name: "Acciones de Delta S.A." }, { type: "click", role: "menuitem", name: "Cambiar roles" }],
    readySelector: '[role="dialog"]' });
  both({ pair: "usuario-sumar-empresa", board: "Usuario", mobileBoard: "M-Usuario", path: "/org/usuarios/member-1", responses: userDetailResponses(),
    props: { usuario: "Tomás (activo)" }, boardActions: [{ type: "click", selector: "button.cb-sec.ch" }],
    mobileBoardActions: [],
    actions: [{ type: "click", role: "button", name: "Sumar empresa" }], readySelector: '[role="dialog"]' });
  both({ pair: "roles-lista", board: "Roles", mobileBoard: "M-Roles", path: "/org/roles", responses: roleLists });
  both({ pair: "rol-editar", board: "Rol", mobileBoard: "M-Rol", path: "/org/roles/role-people", props: { modo: "Editar el rol Recursos humanos" },
    responses: [api("GET", "/api/roles/role-people", peopleRole), api("GET", "/api/permissions", permissionGroups)] });

  both({ pair: "empresas-lista", board: "Empresas", mobileBoard: "M-Empresas", path: "/org/empresas", responses: [
    companiesPage, api("GET", "/api/companies/filter-counts", { all: 3, active: 3, inactive: 0 }),
  ] });
  both({ pair: "empresas-crear", board: "Empresas", mobileBoard: "M-Empresas", path: "/org/empresas", responses: [
    companiesPage, api("GET", "/api/companies/filter-counts", { all: 3, active: 3, inactive: 0 }),
    api("POST", "/api/companies", "company-new", 201),
  ], boardActions: [{ type: "click", selector: "button.b-pri" }],
  actions: [{ type: "click", role: "button", name: "Crear empresa" }], readySelector: '[role="dialog"]' });

  const companyResponses = [
    api("GET", "/api/companies/company-1", company),
    api("GET", "/api/companies/company-1/members/paged", pageOf([companyMember]), 200, { page: "1", pageSize: "10" }),
    api("GET", "/api/companies/company-1/members/filter-counts", { all: 2, active: 2, pendingDeletion: 0, inactive: 0, invited: 0 }),
    ...commonAdminResponses(),
  ];
  both({ pair: "empresa-miembros", board: "Empresa", mobileBoard: "M-Empresa", path: "/org/empresas/company-1", responses: companyResponses, props: { pestana: "Miembros" } });
  both({ pair: "empresa-roles", board: "Empresa", mobileBoard: "M-Empresa", path: "/org/empresas/company-1", responses: companyResponses, props: { pestana: "Roles" } });
  both({ pair: "empresa-editar", board: "Empresa", mobileBoard: "M-Empresa", path: "/org/empresas/company-1", responses: companyResponses,
    boardActions: [{ type: "click", selector: "button.b-sec" }],
    mobileBoardActions: [{ type: "click", selector: 'button[aria-label="Más acciones"]' }, { type: "click", selector: 'button[role="menuitem"]:not(.pel)' }],
    actions: [{ type: "click", role: "button", name: "Editar empresa" }], readySelector: '[role="dialog"]' });

  both({ pair: "configuracion-verificada", board: "Configuracion", mobileBoard: "M-Configuracion", path: "/org/configuracion", responses: settingsResponses("Verified"), props: { dominio: "Verificado" }, mobileProps: {} });
  both({ pair: "configuracion-pendiente", board: "Configuracion", mobileBoard: null, path: "/org/configuracion", responses: settingsResponses("Pending"), props: { dominio: "Pendiente" } });
  both({ pair: "configuracion-agregar-dominio", board: "Configuracion-Dominio", mobileBoard: "Configuracion-Dominio", path: "/org/configuracion", responses: settingsResponses("Sin dominio"),
    actions: [{ type: "click", role: "button", name: "Agregar dominio" }], readySelector: '[role="dialog"]' });
  both({ pair: "configuracion-quitar-dominio", board: "Configuracion-Quitar", mobileBoard: "Configuracion-Quitar", path: "/org/configuracion", responses: settingsResponses("Verified"),
    actions: [{ type: "click", role: "button", name: "Acciones de delta.example.test" }, { type: "click", role: "menuitem", name: "Quitar" }], readySelector: '[role="dialog"]' });

  for (const state of ["Publicada", "Borrador", "Despublicada por la plataforma"]) {
    const suffix = state === "Publicada" ? "publicada" : state === "Borrador" ? "borrador" : "bloqueada";
    both({ pair: `pagina-publica-${suffix}`, board: "Pagina-Org", mobileBoard: null, path: "/org/pagina", responses: publicPageResponses(state), props: { estado: state },
      ...(state === "Despublicada por la plataforma" ? {
        boardActions: [{ type: "click", selector: ".o-i", force: true }],
        actions: [{ type: "press", role: "button", name: "Ver el motivo y qué podés hacer", key: "Enter" }],
        readySelector: '[role="dialog"]',
        readyText: "La página fue despublicada por la plataforma",
      } : {}) });
  }

  both({ pair: "auditoria-lista", board: "Auditoria-Org", mobileBoard: "M-Auditoria-Org", path: "/org/auditoria", responses: auditResponses() });

  both({ pair: "error-organizacion", board: "Error-Org", mobileBoard: null, path: "/org/usuarios", fixture: "business-no-permissions", props: { caso: "Sin permiso (403)" } });
  both({ pair: "aviso-guardado", board: "Avisos", mobileBoard: null, path: "/org/configuracion", responses: settingsResponses("Verified"),
    actions: [{ type: "fill", role: "textbox", name: "Nombre de la organización", value: "Grupo Delta Sur" }, { type: "click", role: "button", name: "Guardar cambios" }],
    readySelector: "[data-sonner-toast]", props: { caso: "Guardado" } });
  return scenarios;
}

export async function writeManifest() {
  mkdirSync(output, { recursive: true });
  const cases = buildCases();
  writeFileSync(manifestFile, `${JSON.stringify({ version: 1, cases }, null, 2)}\n`);
  validateManifest(manifestFile, canvas);
  return cases;
}

async function main() {
  const cases = await writeManifest();
  const pairIndex = process.argv.indexOf("--pair");
  const groupIndex = process.argv.indexOf("--group");
  const pair = pairIndex < 0 ? null : process.argv[pairIndex + 1];
  const group = groupIndex < 0 ? null : process.argv[groupIndex + 1];
  const selected = cases.filter((entry) => (!pair || entry.pair === pair) && (!group || entry.group === group));
  if (selected.length === 0) throw new Error("No hay capturas para ese filtro.");
  if (process.argv.includes("--verify")) {
    assertCapturedPairs(selected, output);
    console.log(`${selected.length} capturas de escritorio/móvil de E6 verificadas.`);
    return;
  }
  const index = process.argv.indexOf("--app-url");
  if (index < 0 || !process.argv[index + 1]) throw new Error("Indicá --app-url del servidor Vite visual.");
  const browser = await chromium.launch({ headless: true });
  const canvasServer = await startCanvasServer(canvas);
  try {
    for (const entry of selected) {
      await captureCase(browser, entry, { canvasUrl: canvasServer.url, appUrl: process.argv[index + 1], outputRoot: output });
      console.log(`${entry.id}: lienzo + app`);
    }
    assertCapturedPairs(selected, output);
  } finally {
    await canvasServer.close();
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
