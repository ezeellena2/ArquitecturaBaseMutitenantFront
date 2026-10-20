import assert from "node:assert/strict";
import test from "node:test";
import { platformWhatsAppDefinitions, platformWhatsAppLimitations, requirePlatformChatAccount,
  requirePlatformAnswer, requireRecentWhatsAppProof, withRestoredWhatsAppSettings } from "./e2e-completo-whatsapp-plataforma.mjs";

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
