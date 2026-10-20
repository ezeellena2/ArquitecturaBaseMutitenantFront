import assert from "node:assert/strict";
import test from "node:test";
import { closeSupplementSessions, contactImportCsv, enterAcceptedInvitation, requirePersonalClient, requirePersonalCopies, requireTakeRace, supplementWhatsAppDefinitions, supplementWhatsAppLimitations } from "./e2e-completo-whatsapp-complemento.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";

const winner = { status: 200, body: { assignee: { id: "miembro", name: "Agente sintético" } } };
const loser = { status: 409, body: { code: "WhatsApp.Conversation.TakenByOther", traceId: "traza", takenBy: "Agente sintético" } };

test("el código de ingreso acepta la invitación y el enlace sólo entra después de confirmar Accepted de la organización propia", async () => {
  const run = async (status, body) => {
    const calls = [];
    const page = {
      waitForResponse: async (predicate) => { calls.push("observe"); assert.equal(predicate({ url: () => "https://localtest.me/api/invitations/preview", request: () => ({ method: () => "POST" }) }), true); return { status: () => status, json: async () => body }; },
      goto: async (url) => { calls.push("open"); assert.equal(new URL(url).pathname, "/invitacion"); },
      waitForURL: async (predicate) => { calls.push("enter"); assert.equal(predicate(new URL("https://localtest.me/org")), true); assert.equal(predicate(new URL("https://localtest.me/auth/callback")), false); },
    };
    await enterAcceptedInvitation({ base: new URL("https://localtest.me/") }, page, "sintetico", "organizacion-propia");
    return calls;
  };
  assert.deepEqual(await run(200, { state: "Accepted", organizationId: "organizacion-propia" }), ["observe", "open", "enter"]);
  await assert.rejects(run(403, { state: "Accepted", organizationId: "organizacion-propia" }));
  await assert.rejects(run(200, { state: "SignInRequired", organizationId: "organizacion-propia" }));
  await assert.rejects(run(200, { state: "Accepted", organizationId: "ajena" }));
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

test("sólo los cuatro escenarios completos enlazan filas del inventario", () => {
  assert.equal(supplementWhatsAppDefinitions.length, 10);
  assert.equal(new Set(supplementWhatsAppDefinitions.map((item) => item.id)).size, 10);
  const targets = new Set(backendUseCases.map((item) => item.id));
  const linked = supplementWhatsAppDefinitions.flatMap((item) => item.covers ?? []);
  assert.deepEqual(linked.sort(), ["BACK-WA-008", "BACK-WA-010", "BACK-WA-013", "BACK-WA-019"]);
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
