import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { boardChoices } from "./capturar-etapa-3a.mjs";
import { loadCases } from "./recorrido-lienzo/casos.mjs";
import { buildCases, canvas, output } from "./capturar-etapa-5.mjs";

const groups = ["plataforma-marco", "plataforma-organizaciones", "plataforma-organizacion", "plataforma-cuentas",
  "plataforma-cuenta", "plataforma-recuperaciones", "plataforma-legales", "plataforma-auditoria", "plataforma-configuracion", "recuperar"];

test("T23b recorre Legales real y conserva la referencia móvil base del editor", () => {
  const cases = buildCases().filter((entry) => entry.group === "plataforma-legales");
  assert.equal(cases.length, 10);
  for (const entry of cases) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    assert.equal(params.get("route"), "/plataforma/legales", entry.id);
    assert.equal(entry.app.captureMode, "harness", entry.id);
    assert.match(entry.app.scenario, /Legales real T23b/, entry.id);
    if (entry.viewport.width === 390 && entry.pair !== "legales-documentos") assert.equal(entry.boardReference.kind, "base", entry.id);
  }
});

test("T23b distingue versión vigente de futura con datos y respuesta del contrato", () => {
  for (const entry of buildCases().filter((item) => item.group === "plataforma-legales")) {
    const docs = entry.app.responses.find((row) => row.method === "GET" && row.path === "/api/platform/legal-documents").body;
    assert.equal(docs.length, 2);
    assert.equal(docs.reduce((sum, doc) => sum + doc.versions.length, 0), 4);
    const privacy = docs.find((doc) => doc.kind === "Privacy");
    assert.equal(privacy.currentVersion, 1);
    assert.equal(privacy.currentEffectiveAtUtc, "2026-01-12T03:00:00Z");
    assert.equal(privacy.versions.find((row) => row.version === 2).isCurrent, false);
    assert.equal(privacy.versions.find((row) => row.version === 2).effectiveAtUtc, "2026-11-01T03:00:00Z");
    const publish = entry.app.responses.find((row) => row.method === "POST" && row.path === "/api/platform/legal-documents");
    assert.equal(publish.status, 201);
    assert.equal(publish.body.version, 3);
    assert.match(publish.body.id, /^[a-f0-9-]{36}$/);
  }
});

test("T23b captura validación y confirmación mediante acciones del editor real", () => {
  for (const entry of buildCases().filter((item) => item.group === "plataforma-legales" && item.pair !== "legales-documentos")) {
    assert.equal(entry.app.actions[0].name, "Publicar versión nueva", entry.id);
    assert.equal(entry.app.actions[0].role, "link", entry.id);
    assert.ok(entry.app.readySelector, entry.id);
    if (entry.pair === "legales-errores") assert.equal(entry.app.readyText, "Escribí la fecha de vigencia.");
    if (entry.pair === "legales-fecha-invalida") assert.ok(entry.app.actions.some((action) => action.type === "fill" && action.value === "01/11"));
    if (entry.pair === "legales-confirmacion") {
      assert.equal(entry.app.readyText, "¿Publicar la versión 3 de Términos y condiciones?");
      assert.equal(entry.app.actions.filter((action) => action.type === "fill").length, 3);
      assert.equal(entry.app.readySelector, '[role="alertdialog"]');
    }
  }
});

test("T23a recorre Recuperaciones real con estados y métodos tapados en ambos tamaños", () => {
  const cases = buildCases().filter((entry) => entry.group === "plataforma-recuperaciones");
  assert.equal(cases.length, 16);
  for (const entry of cases) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    assert.equal(params.get("route"), "/plataforma/recuperaciones", entry.id);
    assert.equal(entry.app.captureMode, "harness", entry.id);
    assert.match(entry.app.scenario, /lista real T23a/, entry.id);
    const rows = entry.app.responses.find((row) => row.path === "/api/platform/recoveries/paged" && !row.query).body.items;
    assert.ok(rows.every((row) => row.previousMethod.includes("•••") && row.newMethod.includes("•••")), entry.id);
    assert.ok(rows.every((row) => row.newMethodType === "Email"), entry.id);
    if (entry.pair === "recuperaciones-sin-pedidos") assert.equal(rows.length, 0);
    else assert.equal(rows.length, 4);
  }
});

test("T23a distingue cuenta ausente, estados resueltos y cantidades del contrato", () => {
  for (const entry of buildCases().filter((item) => item.group === "plataforma-recuperaciones")) {
    const counts = entry.app.responses.find((row) => row.path === "/api/platform/recoveries/filter-counts" && !row.query).body;
    const rows = entry.app.responses.find((row) => row.path === "/api/platform/recoveries/paged" && !row.query).body.items;
    assert.equal(counts.total, rows.length);
    for (const status of counts.statuses) assert.equal(status.count, rows.filter((row) => row.status === status.status).length);
    if (entry.pair === "recuperaciones-sin-pedidos") continue;
    const noAccount = rows.find((row) => row.id === "r2");
    assert.equal(noAccount.accountId, null);
    assert.equal(noAccount.accountName, null);
    assert.equal(rows.find((row) => row.id === "r3").decidedBy, "Laura Díaz");
    assert.ok(rows.filter((row) => row.status !== "Pending").every((row) => row.reason && row.decidedAtUtc >= row.createdAtUtc && row.version > 1));
    const approve = entry.app.responses.find((row) => row.method === "POST" && row.path.endsWith("/approve"));
    assert.equal(approve.status, 200);
    assert.deepEqual(approve.body, { version: 2 });
  }
});

test("T23a fotografía los diálogos y errores reales aun con referencia móvil base", () => {
  for (const entry of buildCases().filter((item) => item.group === "plataforma-recuperaciones" && !["recuperaciones-pedidos", "recuperaciones-sin-pedidos"].includes(item.pair))) {
    assert.equal(entry.app.readySelector, '[role="dialog"]', entry.id);
    assert.ok(entry.app.actions.some((action) => action.name === "Revisar" || action.name === "Ver detalle"), entry.id);
    if (entry.pair.startsWith("recuperaciones-error-")) assert.equal(entry.app.readyText, "Escribí el motivo.");
    if (entry.viewport.width === 390) assert.equal(entry.boardReference.kind, "base");
  }
});

test("T22b recorre la ficha real por id y conserva métodos tapados y evidencia por estado", () => {
  const cases = buildCases().filter((entry) => entry.group === "plataforma-cuenta");
  assert.equal(cases.length, 32);
  for (const entry of cases) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    assert.equal(entry.app.captureMode, "harness", entry.id);
    assert.match(params.get("route"), /^\/plataforma\/cuentas\/account-/, entry.id);
    assert.equal(params.get("reason"), null);
    assert.equal(entry.app.now, entry.pair.endsWith("invitacion-de-operador-vencida") ? "2026-10-05T20:35:00Z" : "2026-09-27T20:35:00Z");
    const detail = entry.app.responses.find((item) => item.path === `/api/platform/accounts/${params.get("route").split("/").at(-1)}`)?.body;
    assert.ok(detail, entry.id);
    assert.ok(!Object.hasOwn(detail, "version"));
    assert.ok(detail.loginMethods.every((method) => !Object.hasOwn(method, "value") && method.maskedValue.includes("•••")));
    if (detail.state === "Deleted") assert.equal(detail.primaryEmail, null);
    if (detail.state === "InvitationExpired") assert.ok(detail.invitationExpiresAtUtc < entry.app.now);
    if (entry.pair === "cuenta-estado-suspendida") assert.equal(detail.lastStateChange.reason, "Denuncia de uso indebido.");
    if (entry.pair === "cuenta-estado-baja-iniciada-por-la-plataforma") assert.equal(detail.deletion.requestedByPlatform, true);
  }
});

test("T22b distingue invitación sin nombre, permiso propio, LastManager y cursor de cuenta", () => {
  const cases = buildCases();
  for (const entry of cases.filter((item) => item.group === "plataforma-cuenta")) {
    const detail = entry.app.responses.find((item) => /^\/api\/platform\/accounts\/account-/.test(item.path))?.body;
    if (entry.pair.includes("invitacion-de-operador")) {
      assert.equal(detail.displayName, null);
      assert.equal(detail.primaryEmail, "julieta.molina@arquitecturabase.ejemplo.com");
      assert.equal(detail.operatorPermissions.length, 3);
    }
    if (entry.pair === "cuenta-tipo-operador-quitar-operador") {
      assert.ok(entry.app.actions.some((action) => action.name === "Quitar operador"));
      assert.ok(entry.app.responses.some((item) => item.method === "DELETE" && item.status === 409 && item.body.code === "Platform.Operator.LastManager"));
      assert.ok(entry.app.readyText.includes("Tiene que quedar"));
    }
    if (entry.pair === "cuenta-pestana-historial-de-seguridad") {
      assert.ok(entry.app.actions.some((action) => action.role === "tab" && action.name === "Historial de seguridad"));
      const audit = entry.app.responses.find((item) => item.path === "/api/platform/audit");
      assert.equal(audit.query.period, "all");
      assert.equal(audit.query.accountId, detail.id);
      assert.ok(!Object.hasOwn(audit.body, "totalCount"));
      assert.equal(audit.body.items[0].summary, "Ingresó con un código por correo");
    }
  }
});

test("T22b los datos de prueba no inventan ingresos posteriores a eliminar la cuenta", () => {
  for (const entry of buildCases().filter((item) => item.pair === "cuenta-estado-eliminada")) {
    const detail = entry.app.responses.find((item) => item.path.endsWith("/account-deleted"))?.body;
    const audit = entry.app.responses.find((item) => item.path === "/api/platform/audit")?.body;
    assert.ok(audit.items.every((row) => row.occurredAtUtc <= detail.deletedAtUtc));
    assert.equal(audit.items[0].action, "AccountDeleted");
    assert.equal(audit.items[0].actor, "Sistema");
  }
});

test("T22b conserva el método principal aprovisionado del operador y una invitación sin ingresos", () => {
  for (const entry of buildCases().filter((item) => item.pair.startsWith("cuenta-tipo-") && item.pair !== "cuenta-tipo-persona")) {
    const detail = entry.app.responses.find((item) => item.path.startsWith("/api/platform/accounts/") && item.method === "GET")?.body;
    assert.ok(detail.loginMethods.some((method) => method.type === "Email" && method.isPrimary && method.verifiedAtUtc && method.canSignIn), entry.id);
    if (detail.state === "Invited" || detail.state === "InvitationExpired") {
      const audit = entry.app.responses.find((item) => item.path === "/api/platform/audit")?.body;
      assert.ok(audit.items.every((row) => row.action !== "SignIn" && row.action !== "SignInFailed"), entry.id);
    }
  }
});

test("T22b el índice de únicos Dueños no incluye membresías terminadas", () => {
  for (const entry of buildCases().filter((item) => item.pair === "cuenta-estado-necesita-recuperacion")) {
    const detail = entry.app.responses.find((item) => item.path.endsWith("/account-pablo"))?.body;
    assert.ok(detail.soleOwnerOrganizations.every((name) => detail.organizations.some((membership) => membership.name === name && membership.status === "Active")));
  }
});

test("T22b el teléfono conserva su verificación sin un canal de ingreso habilitado", () => {
  for (const entry of buildCases().filter((item) => item.pair === "cuenta-tipo-persona")) {
    const detail = entry.app.responses.find((item) => item.path.endsWith("/account-lucia"))?.body;
    const phone = detail.loginMethods.find((method) => method.type === "Phone");
    assert.ok(phone.verifiedAtUtc);
    assert.equal(phone.canSignIn, false);
  }
});

test("T22b la última entrada y la suspensión usan la misma historia temporal del backend", () => {
  for (const entry of buildCases().filter((item) => item.pair === "cuenta-estado-activa" || item.pair === "cuenta-estado-suspendida")) {
    const detail = entry.app.responses.find((item) => item.method === "GET" && item.path.startsWith("/api/platform/accounts/"))?.body;
    const audit = entry.app.responses.find((item) => item.path === "/api/platform/audit")?.body;
    assert.equal(audit.items.find((row) => row.action === "SignIn")?.occurredAtUtc, detail.lastSignInAtUtc);
    if (detail.state === "Suspended") assert.ok(detail.lastStateChange.atUtc >= detail.lastSignInAtUtc);
  }
});

test("T22b el historial copia rol automático y destino de organización del backend", () => {
  for (const entry of buildCases().filter((item) => ["cuenta-estado-necesita-recuperacion", "cuenta-estado-eliminada"].includes(item.pair))) {
    const detail = entry.app.responses.find((item) => item.method === "GET" && item.path.startsWith("/api/platform/accounts/"))?.body;
    const audit = entry.app.responses.find((item) => item.path === "/api/platform/audit")?.body;
    for (const row of audit.items) {
      if (row.actor === "Sistema") assert.equal(row.actorRole, "Automático");
      if (row.targetTenantId) assert.equal(row.target, detail.organizations.find((membership) => membership.tenantId === row.targetTenantId)?.name);
    }
  }
});

test("T22a recorre Cuentas real y sus estados en los dos tamaños, sin diálogo aislado", () => {
  const cases = buildCases().filter((entry) => entry.group === "plataforma-cuentas");
  assert.equal(cases.length, 36);
  for (const entry of cases) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    assert.equal(params.get("route"), "/plataforma/cuentas", entry.id);
    assert.equal(params.get("frame"), null, entry.id);
    assert.equal(params.get("reason"), null, entry.id);
    assert.equal(entry.app.captureMode, "harness", entry.id);
    assert.equal(entry.app.now, "2026-09-27T20:35:00Z", entry.id);
    assert.ok(entry.app.responses.some((item) => item.path === "/api/platform/accounts/paged"), entry.id);
    assert.ok(entry.app.responses.some((item) => item.path === "/api/platform/accounts/filter-counts"), entry.id);
  }
});

test("T22a captura la baja con evidencia real y respeta que tu propia cuenta no tiene menú", () => {
  const cases = buildCases();
  for (const entry of cases.filter((item) => item.pair === "cuentas-baja-bloqueada")) {
    const detail = entry.app.responses.find((item) => item.path === "/api/platform/accounts/account-lucia");
    assert.deepEqual(detail?.body.soleOwnerOrganizations, ["Grupo Delta"], entry.id);
    assert.equal(detail?.body.deletedAtUtc, null);
    assert.equal(detail?.body.lastStateChange, null);
    assert.ok(!Object.hasOwn(detail.body, "version"));
    assert.ok(entry.app.actions.some((action) => action.name === "Dar de baja"), entry.id);
  }
  for (const entry of cases.filter((item) => item.pair === "cuentas-menu-martin-sosa")) {
    assert.ok(!entry.app.actions.some((action) => action.name === "Acciones de Martín Sosa"), entry.id);
    assert.match(entry.app.scenario, /propia cuenta sin acciones/, entry.id);
  }
});

test("T22a espera cada error real también cuando el tablero móvil sólo es una referencia base", () => {
  const cases = buildCases();
  const desktop = cases.filter((entry) => entry.pair.startsWith("cuentas-invitar-error-") && entry.viewport.width === 1440);
  assert.equal(desktop.length, 4);
  for (const entry of desktop) {
    const mobile = cases.find((item) => item.pair === entry.pair && item.viewport.width === 390);
    assert.equal(mobile.boardReference.kind, "base");
    assert.equal(mobile.app.readyText, entry.boardReadyText, mobile.id);
  }
});

test("T22a la selección de permisos espera el menú accesible, sin depender del título tapado por la capa modal", () => {
  for (const entry of buildCases().filter((item) => item.pair === "cuentas-invitar-con-permisos")) {
    assert.equal(entry.app.readySelector, '[role="menu"]', entry.id);
    assert.equal(entry.app.readyHeading, undefined, entry.id);
  }
});

test("T22a lista móvil conserva las ocho cuentas dibujadas y desktop sus once cuentas", () => {
  const cases = buildCases();
  const response = (entry, path) => entry.app.responses.find((item) => item.path === path && !item.query)?.body;
  const mobile = cases.find((entry) => entry.id === "cuentas-lista-movil");
  const desktop = cases.find((entry) => entry.id === "cuentas-lista-escritorio");
  assert.deepEqual(response(mobile, "/api/platform/accounts/paged").items.map((row) => row.id),
    ["account-lucia", "account-beto", "account-ana", "account-mariana", "account-pablo", "account-diego", "martin-sosa", "account-julieta"]);
  assert.equal(response(mobile, "/api/platform/accounts/filter-counts").total, 8);
  assert.equal(response(desktop, "/api/platform/accounts/filter-counts").total, 11);
  const invited = cases.find((entry) => entry.id === "cuentas-menu-julieta-molina-arquitecturabase-ejemplo-com-movil");
  assert.ok(!invited.app.actions.some((action) => action.name === "Cargar más"));
});

test("T21d recorre las tres pestañas administrativas y sus acciones por la ficha real", () => {
  const cases = buildCases().filter((entry) => entry.group === "plataforma-organizacion"
    && /^organizacion-(pagina-|dominio-|modulo-|pestana-(modulos|dominio-verificado|pagina-publica)$)/.test(entry.pair));
  assert.equal(cases.length, 30);
  for (const entry of cases) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    assert.equal(params.get("route"), "/plataforma/organizaciones/tenant-1", entry.id);
    assert.equal(params.get("frame"), null, entry.id);
    assert.equal(params.get("reason"), null, entry.id);
    assert.equal(entry.app.captureMode, "harness", entry.id);
    assert.match(entry.app.scenario, /administración real T21d/, entry.id);
    assert.equal(entry.app.now, "2026-09-27T20:35:00Z", entry.id);
    assert.ok(entry.app.actions.some((action) => action.role === "tab"), entry.id);
    for (const action of entry.app.actions) assert.ok(action.role && !action.selector, entry.id);
  }
});

test("T21d conserva catálogo TestFeatures y estados privados aunque el móvil use referencia base", () => {
  const cases = buildCases();
  for (const entry of cases.filter((entry) => entry.pair === "organizacion-pestana-modulos")) {
    const rows = entry.app.responses.find((item) => item.path.endsWith("/features")).body;
    assert.deepEqual(rows.map((row) => row.key), ["WhatsApp", "Módulo B"]);
    assert.deepEqual(rows.map((row) => row.source), ["Plan", "Trial"]);
    assert.equal(rows[1].expiresOn, "2026-10-27");
    assert.ok(rows.every((row) => !Object.hasOwn(row, "name")));
  }
  for (const entry of cases.filter((entry) => entry.pair === "organizacion-dominio-pendiente")) {
    const rows = entry.app.responses.find((item) => item.path.endsWith("/domains")).body;
    assert.equal(rows[0].txtRecordName, rows[0].domain);
    assert.equal(rows[0].txtRecordValue, "ab-verificacion=7f3c9a2e41b8d605");
  }
  for (const entry of cases.filter((entry) => entry.pair === "organizacion-pagina-despublicada-por-la-plataforma")) {
    const page = entry.app.responses.find((item) => item.path.endsWith("/public-site")).body;
    assert.equal(page.isPublished, false);
    assert.equal(page.publishBlockedReason, "Datos de contacto falsos.");
    assert.ok(entry.app.actions.some((action) => action.name === "Página pública"));
  }
});

test("T21c compara estados, Historial, Dueños y confirmaciones con la ficha real sin lecturas privadas", () => {
  const cases = buildCases().filter((entry) => entry.group === "plataforma-organizacion"
    && /^organizacion-(estado-|duenos-|confirmar-|confirmacion-error$|pestana-(historial|duenos)$)/.test(entry.pair));
  assert.equal(cases.length, 32);
  for (const entry of cases) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    assert.equal(params.get("route"), "/plataforma/organizaciones/tenant-1", entry.id);
    assert.equal(params.get("frame"), null, entry.id);
    assert.equal(params.get("reason"), null, entry.id);
    assert.equal(entry.app.captureMode, "harness", entry.id);
    assert.match(entry.app.scenario, /ficha real T21c/, entry.id);
    assert.equal(entry.app.now, "2026-09-27T20:35:00Z", entry.id);
    assert.ok(entry.app.responses.some((item) => item.path === "/api/platform/tenants/tenant-1"), entry.id);
    assert.ok(entry.app.responses.some((item) => item.path.endsWith("/history")), entry.id);
    assert.deepEqual(entry.app.responses.find((item) => item.path.endsWith("/features")).body.map((item) => item.key), ["WhatsApp", "Módulo B"], entry.id);
    assert.ok(!entry.app.responses.some((item) => /\/(domains|public-site)$/.test(item.path)), entry.id);
    for (const action of entry.app.actions) assert.ok(action.role && !action.selector, entry.id);
  }
});

test("T21c muestra el menú de Falló el alta dibujado en M-Organizacion", () => {
  const entry = buildCases().find((item) => item.id === "organizacion-estado-fallo-el-alta-movil");
  assert.deepEqual(entry.app.actions, [{ type: "click", role: "button", name: "Acciones de Grupo Delta", exact: true }]);
  assert.equal(entry.app.readySelector, '[role="menu"]');
  assert.equal(entry.app.readyText, "Reintentar el alta");
  assert.equal(entry.app.readyHeading, undefined);
});

test("T21c conserva Action traducida y Summary técnico del contrato real de Historial", () => {
  const entry = buildCases().find((item) => item.pair === "organizacion-pestana-historial");
  const rows = entry.app.responses.find((item) => item.path.endsWith("/history")).body.items;
  assert.equal(rows[0].action, "Reactivó la organización");
  assert.deepEqual(JSON.parse(rows[0].summary), { status: { before: "Suspended", after: "Active" } });
  assert.deepEqual(JSON.parse(rows.at(-1).summary), {});
});

test("T21c usa estado e historial efectivo y contacto pendiente sin inventar un Dueño", () => {
  const cases = buildCases();
  const detailOf = (pair) => cases.find((entry) => entry.pair === pair && entry.viewport.width === 1440)?.app.responses
    ?.find((item) => item.path === "/api/platform/tenants/tenant-1")?.body;
  assert.equal(detailOf("organizacion-estado-suspendida")?.lastStateChange?.reason, "Dos meses sin pago.");
  assert.equal(detailOf("organizacion-estado-cerrada")?.lastStateChange?.atUtc, "2026-09-26T15:30:00Z");
  const pending = detailOf("organizacion-duenos-sin-dueno-todavia");
  assert.deepEqual(pending?.owners, []);
  assert.equal(pending.ownerEmail, "lucia.fernandez@delta.ejemplo.com");
  const suspended = detailOf("organizacion-duenos-con-el-dueno-suspendido");
  assert.equal(suspended?.owners[0]?.identityStatus, "Suspended");
});

test("T21c conserva estado y Dueños de la app cuando el teléfono usa un tablero base", () => {
  const cases = buildCases();
  for (const [pair, expected] of [["organizacion-estado-espera-aprobacion", "PendingApproval"], ["organizacion-estado-suspendida", "Suspended"],
    ["organizacion-estado-cerrada", "Closed"], ["organizacion-confirmar-aprobar", "PendingApproval"], ["organizacion-confirmar-cerrar", "Suspended"]]) {
    const entries = cases.filter((entry) => entry.pair === pair);
    assert.equal(entries.length, 2, pair);
    for (const entry of entries) {
      assert.equal(entry.app.responses.find((item) => item.path === "/api/platform/tenants/tenant-1")?.body.status, expected, entry.id);
    }
  }
  for (const entry of cases.filter((item) => item.pair === "organizacion-duenos-sin-dueno-todavia")) {
    assert.deepEqual(entry.app.responses.find((item) => item.path === "/api/platform/tenants/tenant-1")?.body.owners, [], entry.id);
    assert.ok(entry.app.actions.some((item) => item.role === "tab" && item.name === "Dueños"), entry.id);
  }
});

test("T21b compara todas las variantes de Organizaciones con la lista real", () => {
  const cases = buildCases().filter((entry) => entry.group === "plataforma-organizaciones");
  assert.equal(cases.length, 28);
  for (const entry of cases) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    assert.equal(params.get("frame"), null, entry.id);
    assert.equal(params.get("reason"), null, entry.id);
    assert.equal(params.get("route"), "/plataforma", entry.id);
    assert.equal(params.get("as"), "visual-operator", entry.id);
    assert.equal(entry.app.captureMode, "harness", entry.id);
    assert.match(entry.app.scenario, /lista real T21b/, entry.id);
    assert.ok(entry.app.responses.some((response) => response.path === "/api/platform/tenants/paged"));
    for (const action of entry.app.actions) assert.ok(action.role && !action.selector, entry.id);
  }
});

test("T21b captura siete filas del tablero y cincuenta datos de prueba sin falsear la referencia", () => {
  const cases = buildCases();
  for (const entry of cases.filter((entry) => entry.pair === "organizaciones-lista")) {
    const data = entry.app.responses.find((response) => response.path === "/api/platform/tenants/paged" && !response.query).body;
    assert.equal(data.totalCount, 7);
    assert.ok(data.items.some((row) => row.name === "Omega S.A." && row.ownerName === null));
    assert.ok(data.items.some((row) => row.name === "Sigma S.A." && row.status === "Provisioning" && row.companyCount === 0));
  }
  for (const entry of cases.filter((entry) => entry.pair === "organizaciones-50-filas")) {
    const data = entry.app.responses.find((response) => response.query?.pageSize === "50").body;
    assert.equal(data.items.length, 50);
    assert.equal(data.totalCount, 50);
    assert.equal(entry.boardReference.kind, "base");
  }
});

test("registra cada grupo T24 y cada caso en ambos tamaños nativos", () => {
  const cases = buildCases();
  assert.deepEqual([...new Set(cases.map((entry) => entry.group))].sort(), groups.sort());
  for (const pair of new Set(cases.map((entry) => entry.pair))) {
    assert.deepEqual(cases.filter((entry) => entry.pair === pair).map((entry) => entry.viewport), [
      { width: 1440, height: 900 }, { width: 390, height: 844 },
    ]);
  }
  for (const entry of cases) {
    assert.equal(entry.board.startsWith("M-"), entry.viewport.width === 390, entry.id);
    assert.equal(entry.boardViewport, undefined, entry.id);
    assert.ok(entry.app.path.startsWith("/"), entry.id);
  }
});

test("descubre y cubre todos los Tweaks v111 de Plataforma con los tableros actuales", () => {
  const cases = buildCases();
  for (const board of ["Organizacion", "M-Organizacion", "Cuenta-Plat", "M-Cuenta-Plat", "Recuperaciones", "Legales"]) {
    for (const [prop, choices] of Object.entries(boardChoices(path.join(canvas, `${board}.dc.html`)))) {
      for (const value of choices) assert.ok(cases.some((entry) => entry.board === board && entry.props[prop] === value), `${board}: ${prop}=${value}`);
    }
  }
});

test("Recuperar captura los pasos, código y errores reales sin WhatsApp", () => {
  const cases = buildCases().filter((entry) => entry.group === "recuperar");
  const pairs = new Set(cases.map((entry) => entry.pair));
  for (const pair of ["recuperar-paso-1", "recuperar-paso-2", "recuperar-paso-3", "recuperar-codigo",
    "recuperar-correo-anterior-invalido", "recuperar-correo-nuevo-invalido", "recuperar-codigo-incompleto",
    "recuperar-enlace-persona", "recuperar-enlace-empresa"]) assert.ok(pairs.has(pair), pair);
  for (const entry of cases.filter((entry) => entry.board.endsWith("Recuperar"))) {
    assert.equal(entry.props.whatsapp, "Sin WhatsApp (hasta la Etapa 8)", entry.id);
  }
  for (const entry of cases.filter((entry) => entry.pair === "recuperar-codigo")) {
    assert.deepEqual(entry.boardActions, [
      { type: "fill", role: "textbox", name: "Correo electrónico nuevo", value: "lucia.fer@gmail.com" },
      { type: "click", role: "button", name: "Enviar código" },
    ]);
    assert.equal(entry.boardReference.kind, "drawn");
  }
});

test("Recuperar reproduce la app por su recorrido con los tres contratos públicos", () => {
  const cases = buildCases().filter((entry) => entry.group === "recuperar");
  for (const entry of cases) {
    assert.match(entry.app.path, /^\/src\/test\/visualApp\.html\?/);
    assert.equal(entry.app.captureMode, "harness");
    assert.ok(entry.app.readyText || entry.app.readyHeading, entry.id);
  }
  const received = cases.find((entry) => entry.id === "recuperar-paso-3-escritorio");
  assert.deepEqual(received.app.responses.map((response) => [response.method, response.path, response.status]), [
    ["POST", "/api/account-recovery/code", 202], ["POST", "/api/account-recovery/verify", 204], ["POST", "/api/account-recovery", 202],
  ]);
  assert.ok(received.app.actions.some((action) => action.type === "otp"));
  const code = cases.find((entry) => entry.id === "recuperar-codigo-escritorio");
  assert.equal(code.app.readyHeading, "Revisá tu correo");
  assert.deepEqual(code.app.actions.slice(0, 2), [
    { type: "fill", role: "textbox", name: "Correo electrónico", value: "lucia.fernandez@delta.ejemplo.com" },
    { type: "click", role: "button", name: "Seguir" },
  ]);
  for (const entry of cases.filter((item) => item.pair.startsWith("recuperar-enlace-"))) {
    const route = new URL(entry.app.path, "http://example.test").searchParams.get("route");
    assert.ok(route.includes("returnUrl="), entry.id);
  }
});

test("mantiene 50 filas y 409 como casos futuros con referencia real y limitación explícita", () => {
  const cases = buildCases();
  for (const pair of ["organizaciones-50-filas", "organizaciones-409", "configuracion-409"]) {
    const entries = cases.filter((entry) => entry.pair === pair);
    assert.equal(entries.length, 2, pair);
    for (const entry of entries) {
      assert.equal(entry.boardReference.kind, "base");
      assert.ok(entry.boardReference.note.length > 20);
      assert.ok(entry.app.scenario.length > 0);
    }
  }
});

test("una referencia base móvil no finge errores, confirmaciones ni pestañas no dibujadas", () => {
  const cases = buildCases();
  const mobile = cases.find((entry) => entry.id === "organizacion-pestana-modulos-movil");
  assert.ok(mobile);
  assert.equal(mobile.board, "M-Organizacion");
  assert.deepEqual(mobile.props, { estado: "Historial" });
  assert.equal(mobile.boardReference.kind, "base");
  assert.deepEqual(mobile.boardActions, []);
});

test("las variantes de dueño, página y dominio se comprueban en la pestaña donde se ven", () => {
  for (const entry of buildCases().filter((entry) => entry.board === "Organizacion")) {
    for (const [prop, tab] of [["duenos", "Dueños"], ["pagina", "Página pública"], ["dominio", "Dominio verificado"]]) {
      if (entry.props[prop]) {
        assert.equal(entry.props.pestana, tab, entry.id);
        assert.ok(entry.boardReadyText || entry.boardReadySelector, entry.id);
      }
    }
  }
});

test("invitaciones y acciones de operador verifican el estado visible sin mezclar pestañas de persona", () => {
  for (const entry of buildCases().filter((entry) => entry.pair.startsWith("cuenta-tipo-") && entry.props.cuenta !== "Persona")) {
    assert.equal(entry.props.pestana, undefined, entry.id);
    if (entry.pair.endsWith("invitacion-de-operador-pendiente")) assert.equal(entry.boardReadyText, "Invitación pendiente", entry.id);
    if (entry.pair.endsWith("invitacion-de-operador-vencida")) assert.equal(entry.boardReadyText, "Invitación vencida", entry.id);
    if (entry.pair.endsWith("operador-acciones")) assert.equal(entry.boardReadySelector, '[role="menu"]', entry.id);
  }
});

test("los tres pasos de Recuperar comprueban su título visible antes de capturar", () => {
  const cases = buildCases();
  for (const [step, text] of [[1, "Recuperar mi cuenta"], [2, "¿Dónde te escribimos?"], [3, "Recibimos tu pedido"]]) {
    for (const entry of cases.filter((entry) => entry.pair === `recuperar-paso-${step}`)) assert.equal(entry.boardReadyText, text, entry.id);
  }
});

test("Más usa su ruta móvil y conserva la referencia Administración desktop", () => {
  const cases = buildCases();
  const phone = cases.find((entry) => entry.id === "marco-mas-movil");
  assert.equal(new URL(phone.app.path, "http://example.test").searchParams.get("route"), "/plataforma/mas");
  const desktop = cases.find((entry) => entry.id === "marco-mas-escritorio");
  assert.equal(new URL(desktop.app.path, "http://example.test").searchParams.get("route"), "/plataforma/configuracion");
});

test("el marco usa la app real aislada y declara el contenido pendiente sin montar features", () => {
  for (const entry of buildCases().filter((item) => item.group === "plataforma-marco")) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    const realMore = entry.viewport.width === 390 && params.get("route") === "/plataforma/mas";
    assert.equal(params.get("frame"), realMore ? null : "platform", entry.id);
    assert.equal(params.get("as"), "visual-operator", entry.id);
    assert.ok(params.get("route").startsWith("/plataforma"), entry.id);
    assert.equal(entry.app.captureMode, "harness");
    assert.match(entry.app.scenario, /contenido pendiente T21–T23/);
    assert.equal(entry.app.readySelector, "main");
  }
  const menu = buildCases().find((entry) => entry.id === "marco-tu-menu-escritorio");
  assert.deepEqual(menu.app.actions, [{ type: "click", role: "button", name: "Martín Sosa, Plataforma" }]);
});

test("Más de Plataforma a 390 usa su ruta real y espera el título, sin marco vacío", () => {
  for (const entry of buildCases().filter((item) => item.group === "plataforma-marco" && item.viewport.width === 390)) {
    const params = new URL(entry.app.path, "http://example.test").searchParams;
    if (params.get("route") !== "/plataforma/mas") continue;
    assert.equal(params.get("frame"), null, entry.id);
    assert.equal(entry.app.readyHeading, "Más", entry.id);
    assert.match(entry.app.scenario, /Más real T20c/);
  }
});

test("el manifest escrito es consumible por el recorrido vivo con el id exacto del plan", () => {
  // Cuando existe, también se verifica el archivo generado; el catálogo siempre se valida en memoria.
  const cases = buildCases();
  assert.ok(cases.some((entry) => entry.id === "recuperar-paso-1-escritorio"));
  const capturesDir = path.dirname(output);
  const manifest = path.join(output, "manifest.json");
  try { readFileSync(manifest, "utf8"); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  const loaded = loadCases(capturesDir, canvas).find((entry) => entry.id === "etapa-5/recuperar-paso-1-escritorio");
  assert.ok(loaded);
  assert.equal(new URL(loaded.app.path, "http://example.test").searchParams.get("route"), "/recuperar");
});
