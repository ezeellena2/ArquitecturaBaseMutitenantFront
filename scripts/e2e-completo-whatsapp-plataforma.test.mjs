import assert from "node:assert/strict";
import test from "node:test";
import { platformWhatsAppDefinitions, platformWhatsAppLimitations, requirePlatformChatAccount,
  requirePlatformAnswer, requireRecentWhatsAppProof, withRestoredWhatsAppSettings } from "./e2e-completo-whatsapp-plataforma.mjs";
import * as platformWhatsApp from "./e2e-completo-whatsapp-plataforma.mjs";
import { selectMobileBarCases } from "./e2e-completo-seleccion-movil.mjs";

test("la repetición móvil prepara el canal y agente sin recapturar01 ni ejecutar gestión de bot/equipo", async () => {
  for (const mobile of [false, true]) {
    const calls = []; const records = [];
    const real = { width: 390, record: async (id, _page, action) => { records.push(id); return { ok: true, value: await action() }; } };
    const h = mobile ? selectMobileBarCases(real, { targets: ["WAP-02"], prepare: ["WAP-01"] }) : real;
    await platformWhatsApp.recordPlatformWhatsAppPreparation(h, {
      mobile, getPage: () => ({}), prepare: async () => calls.push("canal, organización y agente"),
      management: async () => calls.push("gestión completa"),
    });
    assert.deepEqual(records, mobile ? [] : ["WAP-01"]);
    assert.deepEqual(calls, ["canal, organización y agente", ...(mobile ? [] : ["gestión completa"])]);
  }
  let managed = false;
  await assert.rejects(() => platformWhatsApp.recordPlatformWhatsAppPreparation({ record: async (_id, _page, action) => action() }, {
    mobile: false, getPage: () => ({}), prepare: async () => { throw new Error("Fixture fallida"); }, management: async () => { managed = true; },
  }), /Fixture fallida/u);
  assert.equal(managed, false);
});

test("Ver la cuenta se inspecciona dentro de la hoja del chat y se cierra aun si su visibilidad contradice el permiso", async () => {
  for (const allowed of [false, true]) for (const count of [0, 1]) {
    const calls = [];
    const item = { count: async () => count, waitFor: async () => calls.push("enlace visible") };
    const menu = { waitFor: async () => {}, getByRole: (role, options) => {
      assert.equal(role, "menuitem"); assert.deepEqual(options, { name: "Ver la cuenta", exact: true }); return item;
    } };
    const dialog = { getByRole: (role) => { assert.equal(role, "menu"); return menu; }, waitFor: async (options) => { if (options?.state === "hidden") calls.push("hoja cerrada"); } };
    const trigger = { getAttribute: async () => "dialog", click: async () => calls.push("abrir hoja") };
    const heading = { filter: () => heading, first: () => heading, innerText: async () => "Consulta propia" };
    const page = { viewportSize: () => ({ width: 390 }), keyboard: { press: async (key) => { assert.equal(key, "Escape"); calls.push("Escape"); } },
      getByRole: (role, options) => {
        if (role === "button") return trigger;
        if (role === "heading") return heading;
        assert.equal(role, "dialog"); assert.deepEqual(options, { name: "Consulta propia", exact: true }); return dialog;
      },
    };
    const action = () => platformWhatsApp.inspectPlatformChatAccountAction(page, allowed);
    if (count === Number(allowed)) await action(); else await assert.rejects(action);
    assert.deepEqual(calls.slice(-2), ["Escape", "hoja cerrada"]);
  }
});

const operatorMe = (id, permissions) => ({ id, access: "platform", activeTenantId: null, hasPersonalSpace: false,
  organizations: [], effectivePermissions: { platform: permissions, organization: [], companies: {} } });

test("la entrada sólo cierra por UI una sesión residual con perfil Plataforma confirmado", async () => {
  for (const profileVisible of [true, false]) {
    const calls = []; const ready = { filter() { return this; }, first() { return this; }, or() { return this; }, waitFor: async () => {} };
    const profile = { ...ready, isVisible: async () => profileVisible };
    const factor = { ...ready, isVisible: async () => false };
    const page = {
      goto: async () => calls.push("abrir Plataforma"), viewportSize: () => ({ width: 390, height: 844 }),
      setViewportSize: async ({ width }) => calls.push(`ancho ${width}`),
      getByRole: (role, options) => {
        if (role === "heading") return factor;
        if (role === "textbox") return ready;
        assert.equal(role, "button"); assert.equal(options.name.test("Operador, Plataforma"), true);
        assert.equal(options.name.test("Persona, Personal"), false); return profile;
      },
    };
    const sessions = platformWhatsApp.createPlatformWhatsAppSessions({ base: new URL("https://localtest.me"),
      login: async () => { calls.push("ingreso MFA"); return operatorMe("full", ["read"]); },
      signOut: async () => calls.push("Salir UI"),
    }, { setCapturePage: () => {} });
    await sessions.enter(page, "full");
    assert.deepEqual(calls, ["abrir Plataforma", "ancho 1440", ...(profileVisible ? ["Salir UI"] : []), "ancho 390", "ingreso MFA"]);
  }
});

test("un contexto alterna operadores por logout UI y reingresa al mismo Full antes de sus lecturas", async () => {
  const calls = []; let current; let fullLogins = 0;
  const h = { login: async (page, email, access) => {
    assert.equal(access, "platform"); assert.equal(current, page); calls.push(`login ${email}`);
    if (email === "full") { fullLogins++; return operatorMe("id-full", ["manage", "read"]); }
    return operatorMe("id-agent", ["attend"]);
  } };
  const sessions = platformWhatsApp.createPlatformWhatsAppSessions(h, {
    setCapturePage: (page) => { current = page; },
    closePlatform: async (page) => { assert.equal(current, page); calls.push(`salida ${page}`); },
  });
  await sessions.enter("fullPage", "full");
  await sessions.enter("agentPage", "agent", { id: "id-agent", permissions: ["attend"] });
  await sessions.enter("fullPage", "full");
  await sessions.enter("fullPage", "full");
  await sessions.leave();
  assert.equal(fullLogins, 2);
  assert.deepEqual(calls, ["salida fullPage", "login full", "salida fullPage", "login agent", "salida agentPage", "login full", "salida fullPage"]);
});

test("el cambio conserva el fallo de salida e impide ingresar otro operador", async () => {
  const failure = new Error("Falló Salir por UI"); let logins = 0; let failLogout = false;
  const sessions = platformWhatsApp.createPlatformWhatsAppSessions({ login: async () => { logins++; return operatorMe("original", ["read"]); } }, {
    setCapturePage: () => {}, closePlatform: async () => { if (failLogout) throw failure; },
  });
  await sessions.enter("primera", "full"); failLogout = true;
  await assert.rejects(() => sessions.enter("segunda", "agent"), (error) => error === failure);
  assert.equal(logins, 1);
});

test("cada ingreso exige la identidad emitida y los permisos exactos incluso al conceder accounts.read", async () => {
  let returned = operatorMe("agent", ["attend"]);
  const sessions = platformWhatsApp.createPlatformWhatsAppSessions({ login: async () => returned }, { setCapturePage: () => {}, closePlatform: async () => {} });
  await sessions.enter("page", "agent", { id: "agent", permissions: ["attend"] }); await sessions.leave();
  returned = operatorMe("otro", ["attend", "accounts.read"]);
  await assert.rejects(() => sessions.enter("page", "agent", { id: "agent", permissions: ["attend", "accounts.read"] })); await sessions.leave();
  returned = operatorMe("agent", ["attend"]);
  await assert.rejects(() => sessions.enter("page", "agent", { id: "agent", permissions: ["attend", "accounts.read"] })); await sessions.leave();
  returned = operatorMe("agent", ["attend", "accounts.read"]);
  await sessions.enter("page", "agent", { id: "agent", permissions: ["attend", "accounts.read"] });
});

const reply = (status, code) => ({ status: () => status, json: async () => ({ code, traceId: "traza" }) });
test("dos acciones separan atención completa de gestión parcial con límite Meta concreto", () => {
  assert.deepEqual(platformWhatsAppDefinitions.map((entry) => entry.id), ["WAP-01", "WAP-02"]);
  assert.deepEqual(platformWhatsAppDefinitions.map((entry) => entry.covers), [[], ["BACK-WA-022"]]);
  assert.deepEqual(platformWhatsAppLimitations["BACK-WA-023"].partialExecutionIds, ["WAP-01"]);
  assert.match(platformWhatsAppLimitations["BACK-WA-023"].reason, /Meta/u);
});
test("cuenta asociada se omite sin lectura y coincide exactamente cuando se concede", () => {
  requirePlatformChatAccount({ conversation: {} }, null);
  requirePlatformChatAccount({ conversation: { accountId: null } }, null);
  requirePlatformChatAccount({ conversation: { accountId: "propia" } }, "propia");
  assert.throws(() => requirePlatformChatAccount({ conversation: { accountId: "propia" } }, null));
  assert.throws(() => requirePlatformChatAccount({ conversation: {} }, "propia"));
  assert.throws(() => requirePlatformChatAccount({ conversation: { accountId: "ajena" } }, "propia"));
});
test("respuesta exige toma, mensaje propio persistido y ausencia total de step-up", () => {
  const detail = { conversation: { assignee: { id: "agente" }, assignedToMe: true }, messages: { items: [{ id: "mensaje", kind: "Text", direction: "Outbound", text: "Respuesta propia" }] } };
  requirePlatformAnswer(detail, { agentId: "agente", messageId: "mensaje", text: "Respuesta propia", challenges: 0, confirmations: 0 });
  for (const patch of [{ challenges: 1 }, { confirmations: 1 }, { agentId: "otro" }, { messageId: "otro" }, { text: "otro" }]) {
    assert.throws(() => requirePlatformAnswer(detail, { agentId: "agente", messageId: "mensaje", text: "Respuesta propia", challenges: 0, confirmations: 0, ...patch }));
  }
});
test("gestión exige el desafío real403 con código y traceId", async () => {
  await requireRecentWhatsAppProof(reply(403, "Auth.Platform.ReauthenticationRequired"));
  await assert.rejects(() => requireRecentWhatsAppProof(reply(200, "Auth.Platform.ReauthenticationRequired")));
  await assert.rejects(() => requireRecentWhatsAppProof(reply(403, "Http.Forbidden")));
  await assert.rejects(() => requireRecentWhatsAppProof({ status: () => 403, json: async () => ({ code: "Auth.Platform.ReauthenticationRequired" }) }));
});
test("restauración conserva ambos ajustes incluso cuando falla la acción", async () => {
  const calls = []; const baseline = { consultationsEnabled: false, welcome: "Original" }; const failure = new Error("acción falló");
  await assert.rejects(() => withRestoredWhatsAppSettings({
    read: async () => baseline,
    action: async (previous) => { assert.equal(previous, baseline); throw failure; },
    restore: async (previous) => { calls.push(previous); },
  }), (error) => error === failure);
  assert.deepEqual(calls, [baseline]);
});
