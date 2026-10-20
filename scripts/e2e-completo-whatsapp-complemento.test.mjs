import assert from "node:assert/strict";
import test from "node:test";
import { closeSupplementSessions, contactImportCsv, enterAcceptedInvitation, requirePersonalClient, requirePersonalCopies, requireTakeRace, supplementWhatsAppDefinitions, supplementWhatsAppLimitations } from "./e2e-completo-whatsapp-complemento.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { screens } from "./e2e-completo-inventario-front.mjs";
import * as whatsapp from "./e2e-completo-whatsapp-complemento.mjs";

const winner = { status: 200, body: { assignee: { id: "miembro", name: "Agente sintético" } } };
const loser = { status: 409, body: { code: "WhatsApp.Conversation.TakenByOther", traceId: "traza", takenBy: "Agente sintético" } };

test("las creaciones de mensajes y notas exigen201 del recurso y POST exactos, sin cambiar Tomar200", async () => {
  for (const inbox of ["customers", "internal"]) for (const kind of ["messages", "notes"]) {
    const route = `/api/organization/whatsapp/${inbox}/conversations/propia`; const calls = [];
    const response = { url: () => `https://localtest.me${route}/${kind}`, request: () => ({ method: () => "POST" }), status: () => 201 };
    const page = { waitForResponse: async (predicate) => {
      calls.push("observar creación"); assert.equal(predicate(response), true);
      assert.equal(predicate({ ...response, url: () => `https://localtest.me${route}/take` }), false);
      assert.equal(predicate({ ...response, request: () => ({ method: () => "GET" }) }), false); return response;
    } };
    assert.equal(await whatsapp.createSupplementChatEntry(page, { click: async () => calls.push("clic UI") }, route, kind), response);
    assert.deepEqual(calls, ["observar creación", "clic UI"]);
    for (const status of [200, 204, 409]) await assert.rejects(() => whatsapp.createSupplementChatEntry({ waitForResponse: async () => ({ ...response, status: () => status }) }, { click: async () => {} }, route, kind), /201/u);
  }
  await assert.rejects(() => whatsapp.createSupplementChatEntry({ waitForResponse: async () => assert.fail("Tomar usa su contrato200") }, {}, "/api/organization/whatsapp/customers/conversations/propia", "take"));
  assert.equal(requireTakeRace([winner, loser]).winnerIndex, 0);
  assert.throws(() => requireTakeRace([{ ...winner, status: 201 }, loser]));
});

test("el código de ingreso acepta la invitación y el enlace sólo entra después de confirmar Accepted de la organización propia", async () => {
  const run = async (status, body) => {
    const calls = [];
    const business = { id: "agente", access: "business", activeTenantId: "organizacion-propia", effectivePermissions: { organization: ["whatsapp.customers"], platform: [] } };
    const meResponse = { url: () => "https://localtest.me/api/me", request: () => ({ method: () => "GET" }), status: () => 200, json: async () => business };
    const page = {
      waitForResponse: async (predicate) => {
        const preview = { url: () => "https://localtest.me/api/invitations/preview", request: () => ({ method: () => "POST" }) };
        if (predicate(preview) === true) { calls.push("observe-preview"); return { status: () => status, json: async () => body }; }
        calls.push("observe-business"); assert.equal(await predicate({ ...meResponse, json: async () => ({ ...business, access: "consumer", activeTenantId: "personal" }) }), false); assert.equal(await predicate(meResponse), true); return meResponse;
      },
      goto: async (url) => { calls.push("open"); assert.equal(new URL(url).pathname, "/invitacion"); },
      waitForURL: async (predicate) => { calls.push("enter"); assert.equal(predicate(new URL("https://localtest.me/org")), true); assert.equal(predicate(new URL("https://localtest.me/auth/callback")), false); },
    };
    await enterAcceptedInvitation({ base: new URL("https://localtest.me/") }, page, "sintetico", "organizacion-propia", "agente");
    return calls;
  };
  assert.deepEqual(await run(200, { state: "Accepted", organizationId: "organizacion-propia" }), ["observe-preview", "observe-business", "open", "enter"]);
  await assert.rejects(run(403, { state: "Accepted", organizationId: "organizacion-propia" }));
  await assert.rejects(run(200, { state: "SignInRequired", organizationId: "organizacion-propia" }));
  await assert.rejects(run(200, { state: "Accepted", organizationId: "ajena" }));
});

test("la llegada temprana a org no permite leer con el Bearer Consumer anterior", async () => {
  let releaseBusiness; const businessReady = new Promise((resolve) => { releaseBusiness = resolve; });
  let arrive; const arrived = new Promise((resolve) => { arrive = resolve; }); let done = false;
  const business = { id: "agente", access: "business", activeTenantId: "propia", effectivePermissions: { organization: ["whatsapp.customers"], platform: [] } };
  const page = {
    waitForResponse: async (predicate) => {
      const preview = { url: () => "https://localtest.me/api/invitations/preview", request: () => ({ method: () => "POST" }) };
      if (predicate(preview) === true) return { status: () => 200, json: async () => ({ state: "Accepted", organizationId: "propia" }) };
      await businessReady;
      const response = { url: () => "https://localtest.me/api/me", request: () => ({ method: () => "GET" }), status: () => 200, json: async () => business };
      assert.equal(await predicate(response), true); return response;
    }, goto: async () => {}, waitForURL: async () => arrive(),
  };
  const pending = enterAcceptedInvitation({ base: new URL("https://localtest.me/") }, page, "sintetico", "propia", "agente").then(() => { done = true; });
  await arrived; assert.equal(done, false, "URL org no acredita que la SPA haya emitido GET Me empresarial.");
  releaseBusiness(); await pending; assert.equal(done, true);
  whatsapp.requireInvitedAgent(business, { userId: "agente", organizationId: "propia" });
  for (const [patch, message] of [[{ id: "otra-persona" }, /identidad/u], [{ access: "consumer" }, /empresarial/u], [{ activeTenantId: "personal" }, /organización invitante/u]]) assert.throws(() => whatsapp.requireInvitedAgent({ ...business, ...patch }, { userId: "agente", organizationId: "propia" }), message);
});

test("la reparación prepara01/02 dentro03, bloquea dependientes si falla y no ejecuta08/10", async () => {
  assert.deepEqual(whatsapp.supplementWhatsAppRepairDefinitions.map((item) => item.id), ["WAS-03", "WAS-04", "WAS-05", "WAS-06", "WAS-07", "WAS-11", "WAS-09"]);
  for (const failure of [null, "01", "02", "03"]) {
    const calls = []; const records = []; const blocked = []; const outcomes = new Map();
    const h = { record: async (id, _page, action) => { records.push(id); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } }, block: async (id) => blocked.push(id) };
    const run = whatsapp.createSupplementWhatsAppRunner(h, { repair: true, outcomes, getPage: () => ({}), beforeAction: () => {} });
    const action = (id) => async () => { if (["08", "10"].includes(id)) assert.fail("No se repiten los independientes"); calls.push(id); if (id === failure) throw new Error("Fallo propio"); };
    for (const [id, dependencies] of [["01", []], ["02", ["01"]], ["03", ["02"]], ["04", ["03"]], ["05", ["03"]], ["06", ["03"]], ["07", ["06"]], ["08", ["01"]], ["11", ["02", "04"]], ["09", ["11"]], ["10", []]]) await run(id, dependencies, action(id));
    assert.deepEqual(records, failure ? ["WAS-03"] : ["WAS-03", "WAS-04", "WAS-05", "WAS-06", "WAS-07", "WAS-11", "WAS-09"]);
    assert.deepEqual(blocked, failure ? ["WAS-04", "WAS-05", "WAS-06", "WAS-07", "WAS-11", "WAS-09"] : []);
    assert.deepEqual(calls, failure === "01" ? ["01"] : failure === "02" ? ["01", "02"] : failure === "03" ? ["01", "02", "03"] : ["01", "02", "03", "04", "05", "06", "07", "11", "09"]);
  }
});

test("Mensajes muestra la respuesta sin datos internos ni editor y su enlace usa el número real de la organización", async () => {
  const conversation = { organizationName: "Organización propia", displayNumber: "+5491134567890" };
  const expected = { answer: "Respuesta pública posterior", note: "Nota reservada", beforeLink: "Texto previo", privateAuthors: ["Agente privado"] };
  const check = async (patch = {}) => {
    const state = { text: `${expected.answer}\nOrganización propia · 10:30`, editors: 0, send: 0, href: "https://wa.me/5491134567890", target: "_blank", rel: "noreferrer", ...patch };
    const page = { getByRole: (role) => {
      if (role === "log") return { getByText: () => ({ waitFor: async () => {} }), innerText: async () => state.text };
      if (role === "textbox") return { count: async () => state.editors };
      if (role === "button") return { count: async () => state.send };
      assert.equal(role, "link"); return { waitFor: async () => {}, getAttribute: async (key) => state[key] };
    } };
    await whatsapp.assertPersonalMessageScreen(page, conversation, expected);
  };
  await check();
  for (const patch of [{ text: "Sin respuesta" }, { text: expected.answer + expected.note }, { text: expected.answer + expected.beforeLink }, { text: expected.answer + expected.privateAuthors[0] }, { editors: 1 }, { send: 1 }, { href: "https://wa.me/5491134567899" }, { target: "_self" }, { rel: "" }]) await assert.rejects(() => check(patch));
});

test("abrir Mensajes conserva la SPA personal y reutiliza el detalle ya abierto antes de desvincular", async () => {
  for (const alreadyOpen of [false, true]) {
    let route = alreadyOpen ? "/mensajes/propia" : "/mensajes"; let clicks = 0;
    const row = { filter: () => row, waitFor: async () => {}, count: async () => 1, click: async () => { clicks++; route = "/mensajes/propia"; } };
    const page = { url: () => `https://localtest.me${route}`, goto: async () => assert.fail("No recarga ni reingresa"), getByRole: (role) => role === "heading" ? { waitFor: async () => {} } : { locator: () => row }, waitForURL: async (predicate) => assert.equal(predicate(new URL(`https://localtest.me${route}`)), true) };
    await whatsapp.openPersonalMessageDetail(page, { linkedId: "propia", organizationName: "Organización propia" });
    assert.equal(route, "/mensajes/propia"); assert.equal(clicks, alreadyOpen ? 0 : 1);
    route = "/mensajes/ajena";
    await assert.rejects(() => whatsapp.openPersonalMessageDetail(page, { linkedId: "propia", organizationName: "Organización propia" }));
  }
});

test("los teléfonos de reparación no reutilizan altas ni importaciones de la corrida completa", () => {
  const phones = [false, true].flatMap((repair) => [1440, 390].flatMap((width) => Object.values(whatsapp.supplementWhatsAppPhones(width, repair))));
  assert.equal(new Set(phones).size, phones.length);
  for (const phone of phones) assert.match(phone, /^\+54911345678\d{2}$/u);
  for (const reserved of ["+5491134567890", "+5491134567899", "+5491134567864", "+5491134567865", "+5491134567868", "+5491134567869"]) assert.equal(phones.includes(reserved), false);
  assert.throws(() => whatsapp.supplementWhatsAppPhones(800, true));
});

test("el alta Phone Consumer tiene su espacio Personal real, distinto de la organización que lo atiende", () => {
  const businessTenantId = "a2acb0c1-f43c-47b3-8857-79cd525e747f";
  const me = { access: "consumer", hasPersonalSpace: true, activeTenantId: "01a159ed-c9b8-7d86-afb3-7e87065a516e" };
  requirePersonalClient(me, businessTenantId);
  for (const changed of [{ access: "business" }, { hasPersonalSpace: false }, { activeTenantId: null }, { activeTenantId: "" }, { activeTenantId: "Personal" }, { activeTenantId: "00000000-0000-0000-0000-000000000000" }, { activeTenantId: businessTenantId }]) assert.throws(() => requirePersonalClient({ ...me, ...changed }, businessTenantId));
});

test("la carrera exige un ganador y un rechazo con el nombre real de quien tomó el chat", () => {
  assert.equal(requireTakeRace([winner, loser]).winnerIndex, 0);
  assert.equal(requireTakeRace([loser, winner]).winnerIndex, 1);
  assert.throws(() => requireTakeRace([winner, winner]));
  assert.throws(() => requireTakeRace([loser, loser]));
  assert.throws(() => requireTakeRace([winner, { ...loser, body: { ...loser.body, takenBy: "Otra persona" } }]));
  assert.throws(() => requireTakeRace([winner, { ...loser, body: { ...loser.body, traceId: "" } }]));
});

test("Mensajes exige respuesta propia y excluye notas, autores internos y texto anterior al vínculo", () => {
  const detail = { messages: { items: [{ kind: "Text", text: "Respuesta visible", author: null }] } };
  requirePersonalCopies(detail, { answer: "Respuesta visible", note: "Nota privada", beforeLink: "Mensaje anterior" });
  for (const extra of [{ kind: "Note", text: "Nota privada" }, { kind: "Text", text: "Mensaje anterior" }, { kind: "Text", text: "Algo", author: "Agente interno" }]) {
    assert.throws(() => requirePersonalCopies({ messages: { items: [...detail.messages.items, extra] } }, { answer: "Respuesta visible", note: "Nota privada", beforeLink: "Mensaje anterior" }));
  }
  assert.throws(() => requirePersonalCopies({ messages: { items: [] } }, { answer: "Respuesta visible" }));
});

test("el CSV incluye filas válidas, inválida, repetida y contacto dado de baja", () => {
  const csv = contactImportCsv({ first: "+5491134567876", second: "+5491134567878", unsubscribed: "+5491134567870" });
  assert.equal(csv.split("\n").length, 6);
  assert.match(csv, /^Nombre;Teléfono;Etiqueta;Acepta promociones\n/u);
  assert.equal(csv.split("+5491134567876").length - 1, 2);
  assert.ok(csv.endsWith(";+5491134567870;;Sí"));
});

test("los escenarios completos y la pantalla previa a desvincular enlazan filas del inventario", () => {
  assert.equal(supplementWhatsAppDefinitions.length, 11);
  assert.equal(new Set(supplementWhatsAppDefinitions.map((item) => item.id)).size, 11);
  const targets = new Set([...backendUseCases.map((item) => item.id), ...screens.map((item) => "SCREEN-" + item.id)]);
  const linked = supplementWhatsAppDefinitions.flatMap((item) => item.covers ?? []);
  assert.deepEqual(linked.sort(), ["BACK-WA-008", "BACK-WA-010", "BACK-WA-013", "BACK-WA-019", "SCREEN-mensajes-persona"]);
  for (const id of linked) assert.ok(targets.has(id));
  for (const id of ["BACK-WA-015", "BACK-WA-018", "BACK-WA-025"]) assert.equal(linked.includes(id), false);
});

test("las limitaciones nombran qué falta y no convierten un record parcial en cobertura", () => {
  const targets = new Set(backendUseCases.map((item) => item.id));
  for (const [id, limitation] of Object.entries(supplementWhatsAppLimitations)) {
    assert.ok(targets.has(id)); assert.ok(limitation.missing.length > 20); assert.ok(limitation.reason.length > 20);
    assert.ok(limitation.source.every((source) => source.endsWith(".cs")));
    for (const executionId of limitation.partialExecutionIds) {
      const definition = supplementWhatsAppDefinitions.find((item) => item.id === executionId);
      assert.ok(definition); assert.ok(definition.partialOf.includes(id)); assert.ok(!definition.covers.includes(id));
    }
  }
});

test("la salida por UI intenta todas las sesiones aunque una falle y conserva ese fallo", async () => {
  const signedIn = new Set(["persona", "dueño", "operador"]); const visited = [];
  await assert.rejects(() => closeSupplementSessions(signedIn, async (page) => {
    visited.push(page); if (page === "dueño") throw new Error("salida fallida");
  }), AggregateError);
  assert.deepEqual(visited, ["operador", "dueño", "persona"]);
  assert.deepEqual([...signedIn], ["dueño"]);
});
