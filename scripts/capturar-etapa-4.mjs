import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertCapturedPairs, captureCase, startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { visualPersonal } from "../src/test/mocks/currentUsers.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const output = path.join(root, "docs/design/capturas/etapa-4");
export const canvas = path.join(root, "docs/design/lienzo");
export const manifestFile = path.join(output, "manifest.json");

const personal = { id: "2", type: "Email", value: "lucia.fer@gmail.com", isPrimary: true, isVerified: true, canRemove: false, canMakePrimary: false };
const company = { id: "1", type: "Email", value: "lucia.fernandez@delta.ejemplo.com", isPrimary: false, isVerified: true, managedByTenantId: "grupo-delta", managedByOrganizationName: "Grupo Delta", canRemove: true, canMakePrimary: true };
const phone = { id: "3", type: "Phone", value: "011 15-5555-4521", isPrimary: false, isVerified: false, canRemove: true, canMakePrimary: false };
const pending = { id: "4", type: "Email", value: "nuevo@ejemplo.com", isPrimary: false, isVerified: false, canRemove: true, canMakePrimary: false };
const proof = { sourceMethodId: "2", destination: "lu•••@gmail.com", resendAfterSeconds: 60 };
const api = (method, path, body, status = 200, query) => ({ method, path, body, status, ...(query ? { query } : {}) });
const accountResponses = (methods = [personal, company, phone]) => [
  api("GET", "/api/me", visualPersonal),
  api("GET", "/api/me/login-methods", { methods, canLinkGoogle: true, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30 }),
];

const ownerRole = {
  id: "role-owner", name: "TenantAdmin", description: null, scope: "Organization",
  companyId: null, isSystemRole: true, userCount: 1,
  permissions: ["users.read", "users.invite", "users.manage", "roles.read", "roles.manage", "roles.assign", "companies.read", "companies.manage", "settings.read", "settings.manage", "audit.read", "publicpage.manage", "company.members.read", "company.members.manage"],
  version: 1, createdAtUtc: "2026-09-27T12:00:00Z",
};
const humanResourcesRole = {
  ...ownerRole, id: "role-human-resources", name: "Recursos humanos", description: "Invita, edita y deshabilita usuarios.",
  isSystemRole: false, userCount: 0, permissions: ["users.read", "users.invite", "users.manage"],
};
const auditorRole = {
  ...ownerRole, id: "role-auditor", name: "Auditor", description: "Ve los usuarios y la auditoría. No cambia nada.",
  isSystemRole: false, userCount: 1, permissions: ["users.read", "audit.read"],
};
const companyAdminRole = {
  ...ownerRole, id: "role-company-admin", name: "CompanyAdmin", description: null,
  scope: "AnyCompany", isSystemRole: true, userCount: 2, permissions: ["company.members.read", "company.members.manage"],
};
const companyReaderRole = {
  ...ownerRole, id: "role-company-reader", name: "Solo lectura", description: "Ve los miembros de la empresa. No cambia nada.",
  scope: "SpecificCompany", companyId: "20000000-0000-0000-0000-000000000001", isSystemRole: false, userCount: 4,
  permissions: ["company.members.read"],
};
const companyReaderSurRole = { ...companyReaderRole, id: "role-company-reader-sur", companyId: "20000000-0000-0000-0000-000000000002", userCount: 1 };
const companyReaderNorthRole = { ...companyReaderRole, id: "role-company-reader-north", companyId: "20000000-0000-0000-0000-000000000003", userCount: 0 };
const permissionGroups = [
  { area: "users", name: "Usuarios", permissions: [
    { code: "users.read", name: "Ver usuarios", description: "El listado de usuarios y sus datos." },
    { code: "users.invite", name: "Invitar usuarios", description: "Invitar, reenviar y revocar invitaciones." },
    { code: "users.manage", name: "Administrar usuarios", description: "Editar, deshabilitar y activar usuarios." },
  ] },
  { area: "roles", name: "Roles", permissions: [
    { code: "roles.read", name: "Ver roles", description: "Los roles y sus permisos." },
    { code: "roles.manage", name: "Administrar roles", description: "Crear, editar e inactivar roles." },
    { code: "roles.assign", name: "Asignar roles", description: "Dar y quitar roles a los usuarios." },
  ] },
  { area: "companies", name: "Empresas", permissions: [
    { code: "companies.read", name: "Ver empresas", description: "El listado de empresas de la organización." },
    { code: "companies.manage", name: "Administrar empresas", description: "Crear y administrar empresas." },
  ] },
  { area: "settings", name: "Configuración", permissions: [
    { code: "settings.read", name: "Ver configuración", description: "La configuración de la organización." },
    { code: "settings.manage", name: "Administrar configuración", description: "Cambiar la configuración de la organización." },
  ] },
  { area: "audit", name: "Auditoría", permissions: [
    { code: "audit.read", name: "Ver auditoría", description: "Los eventos de auditoría." },
  ] },
  { area: "publicpage", name: "Página pública", permissions: [
    { code: "publicpage.manage", name: "Administrar página pública", description: "Configurar la página pública." },
  ] },
  { area: "company", name: "Miembros de empresa", permissions: [
    { code: "company.members.read", name: "Ver miembros", description: "El listado de miembros de la empresa." },
    { code: "company.members.manage", name: "Administrar miembros", description: "Editar y administrar miembros de la empresa." },
  ] },
];

const allVisualRoles = [ownerRole, humanResourcesRole, auditorRole, companyAdminRole, companyReaderRole, companyReaderSurRole, companyReaderNorthRole];
const pageOf = (items) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
const roleListResponses = [
  api("GET", "/api/roles/paged", pageOf(allVisualRoles.filter((role) => role.scope !== "Organization")), 200, { scope: "Company" }),
  api("GET", "/api/roles/paged", pageOf(allVisualRoles.filter((role) => role.scope === "Organization")), 200, { scope: "Organization" }),
  api("GET", "/api/roles/paged", pageOf(allVisualRoles)),
];

function editorResponses(role) {
  return [api("GET", `/api/roles/${role.id}`, role), api("GET", "/api/permissions", permissionGroups)];
}

export function buildCases() {
  const scenarios = [
    { pair: "cuenta", board: "Cuenta", mobileBoard: "M-Cuenta", responses: accountResponses(), actions: [], readySelector: "main" },
    { pair: "agregar-correo", board: "Cuenta-Agregar", mobileBoard: "M-Cuenta", responses: [
      ...accountResponses(), api("POST", "/api/me/reauth", proof, 202), api("POST", "/api/me/reauth/verify", { reauthTicket: "visual-ticket" }),
    ], actions: [
      { type: "click", role: "button", name: "Agregar correo o teléfono" },
      { type: "otp", value: "123456" },
      { type: "click", role: "button", name: "Verificar" },
    ], readySelector: 'input[type="email"]' },
    { pair: "verificar-correo", board: "Cuenta-Verificar", mobileBoard: "M-Cuenta", responses: [
      ...accountResponses([personal, company, pending]), api("POST", "/api/me/login-methods/4/code", { methodId: "4", resendAfterSeconds: 60 }, 202),
    ], actions: [{ type: "click", role: "button", name: "Verificar" }], readySelector: 'input[inputmode="numeric"]' },
    { pair: "baja-cuenta", board: "Cuenta-Baja", mobileBoard: "M-Cuenta", responses: [
      ...accountResponses(), api("POST", "/api/me/reauth", proof, 202),
    ], actions: [{ type: "click", role: "button", name: "Dar de baja" }], readySelector: '[role="dialog"]' },
  ];

  const accountCases = scenarios.flatMap((scenario) => [
    { width: 1440, height: 900, board: scenario.board, viewport: "escritorio" },
    { width: 390, height: 844, board: scenario.mobileBoard, viewport: "movil" },
  ].map(({ width, height, board, viewport }) => ({
    id: `${scenario.pair}-${viewport}`,
    pair: scenario.pair,
    group: "cuenta",
    board,
    props: {},
    viewport: { width, height },
    ...(width === 390 && scenario.pair !== "cuenta" ? { note: "El lienzo v60 no tiene tablero móvil del diálogo; M-Cuenta se conserva como referencia de marco y la app captura el diálogo abierto." } : {}),
    app: {
      path: "/src/test/visualApp.html?as=visual-personal&route=%2Fcuenta",
      captureMode: "harness",
      responses: scenario.responses,
      actions: scenario.actions.map((action) => width === 390 && action.name === "Agregar correo o teléfono"
        ? { ...action, name: "Agregar" }
        : action),
      readySelector: scenario.readySelector,
    },
  })));

  const roleScenarios = [
    { pair: "roles-lista", board: "Roles", mobileBoard: "M-Roles", path: "/org/roles", responses: roleListResponses, readyText: "Dueño" },
    { pair: "rol-crear", board: "Rol", mobileBoard: "M-Rol", path: "/org/roles/new", boardMode: "Crear un rol", responses: [api("GET", "/api/permissions", permissionGroups)], readyText: "Elegí dónde vale el rol para ver sus permisos." },
    { pair: "rol-recursos-humanos", board: "Rol", mobileBoard: "M-Rol", path: `/org/roles/${humanResourcesRole.id}`, boardMode: "Editar el rol Recursos humanos", role: humanResourcesRole, responses: editorResponses(humanResourcesRole) },
    { pair: "rol-solo-lectura", board: "Rol", mobileBoard: "M-Rol", path: `/org/roles/${companyReaderRole.id}`, boardMode: "Editar el rol Solo lectura", role: companyReaderRole, responses: editorResponses(companyReaderRole) },
    { pair: "rol-dueno", board: "Rol", mobileBoard: "M-Rol", path: `/org/roles/${ownerRole.id}`, boardMode: "Ver el rol Dueño", role: ownerRole, responses: editorResponses(ownerRole) },
  ];
  const roleCases = roleScenarios.flatMap((scenario) => [
    { width: 1440, height: 900, board: scenario.board, viewport: "escritorio" },
    { width: 390, height: 844, board: scenario.mobileBoard, viewport: "movil" },
  ].map(({ width, height, board, viewport }) => ({
    id: `${scenario.pair}-${viewport}`,
    pair: scenario.pair,
    group: "roles",
    board,
    props: scenario.boardMode ? { modo: scenario.boardMode } : {},
    viewport: { width, height },
    app: {
      path: `/src/test/visualApp.html?as=visual-role-manager&route=${encodeURIComponent(scenario.path)}`,
      captureMode: "harness",
      userFixture: "visual-role-manager",
      responses: scenario.responses,
      readySelector: "main",
      ...(width === 1440 ? { actions: [{ type: "click", role: "button", name: "Administración" }] } : {}),
      ...(scenario.readyText ? { readyText: scenario.readyText } : {}),
    },
  })));

  return [...accountCases, ...roleCases];
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
  if (process.argv.includes("--verify")) {
    assertCapturedPairs(cases, output);
    console.log(`${cases.length} pares visuales E4 completos.`);
    return;
  }
  const index = process.argv.indexOf("--app-url");
  if (index < 0 || !process.argv[index + 1]) throw new Error("Indicá --app-url del servidor Vite visual.");
  const browser = await chromium.launch({ headless: true });
  const canvasServer = await startCanvasServer(canvas);
  try {
    for (const entry of cases) {
      await captureCase(browser, entry, { canvasUrl: canvasServer.url, appUrl: process.argv[index + 1], outputRoot: output });
      console.log(`${entry.id}: lienzo + app`);
    }
  } finally {
    await canvasServer.close();
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
