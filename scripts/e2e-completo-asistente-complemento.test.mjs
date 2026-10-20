import assert from "node:assert/strict";
import test from "node:test";
import { assistantSupplementDefinitions, assistantSupplementProofGroups, requireProjectedAssistant, requirePrivateAttachmentMetadata, requireGlobalUsage, platformSettingsValues, requirePrivateProblem, assertGlobalSettingsRestored } from "./e2e-completo-asistente-complemento.mjs";

test("seis registros y los grupos de archivos/aislamiento nunca aprueban parcialmente", () => {
  assert.equal(assistantSupplementDefinitions.length, 6); assert.equal(new Set(assistantSupplementDefinitions.map((row) => row.id)).size, 6);
  assert.deepEqual(assistantSupplementDefinitions.flatMap((row) => row.covers).sort(), ["BACK-AS-002", "BACK-AS-017", "BACK-AS-019", "BACK-AS-020", "BACK-AS-021"]);
  assert.deepEqual(assistantSupplementProofGroups["BACK-AS-014"], [["MOD-03", "MOD-27", "AS-TEC-03"]]);
  assert.deepEqual(assistantSupplementProofGroups["BACK-AS-011"], [["BASE-E8B-30-4", "AS-SUP-06"]]);
  for (const alternatives of Object.values(assistantSupplementProofGroups)) for (const group of alternatives) {
    assert.ok(group.length > 1); assert.equal(new Set(group).size, group.length);
    const onlyOne = new Set(group.slice(0, 1)); assert.equal(alternatives.some((candidate) => candidate.every((id) => onlyOne.has(id))), false);
  }
});

test("la proyección exige empresa activa y uso sin configure ni permisos administrativos", () => {
  const me = { access: "business", activeTenantId: "org", effectivePermissions: { organization: ["assistant.use"], companies: { company: ["company.members.read"] }, platform: [] } };
  requireProjectedAssistant(me, "org", "company");
  for (const organization of [[], ["assistant.use", "assistant.configure"], ["assistant.use", "users.manage"]]) assert.throws(() => requireProjectedAssistant({ ...me, effectivePermissions: { ...me.effectivePermissions, organization } }, "org", "company"));
  assert.throws(() => requireProjectedAssistant(me, "ajena", "company")); assert.throws(() => requireProjectedAssistant(me, "org", "ajena"));
});

test("los metadatos del archivo sólo contienen contrato privado y nunca URL o clave de storage", () => {
  const metadata = { id: "propio", fileName: "propio.png", mediaType: "image/png", byteLength: 71, version: 4 };
  requirePrivateAttachmentMetadata(metadata, "propio.png", 71);
  for (const leak of [{ url: "https://public.invalid/file" }, { storageKey: "clave" }, { nested: { bytes: [1] } }]) assert.throws(() => requirePrivateAttachmentMetadata({ ...metadata, ...leak }, "propio.png", 71));
  assert.throws(() => requirePrivateAttachmentMetadata({ ...metadata, byteLength: 72 }, "propio.png", 71));
});

const usage = () => ({ month: "2026-10", cost: { amount: 15, currency: "USD" }, platformKeyCost: { amount: 10, currency: "USD" }, totalQueries: 4, rows: { items: [
  { kind: "organization", organizationId: "org", fundingMode: "PlatformKey", queries: 1, cost: { amount: 2, currency: "USD" } },
  { kind: "organization", organizationId: "org", fundingMode: "OwnKey", queries: 1, cost: { amount: 5, currency: "USD" } },
  { kind: "personal", organizationId: null, fundingMode: "PlatformKey", queries: 1, cost: { amount: 3, currency: "USD" } },
  { kind: "operator", organizationId: null, fundingMode: "PlatformKey", queries: 1, cost: { amount: 5, currency: "USD" } },
], totalCount: 4 } });
test("uso global exige las tres clases, ambas financiaciones y separación real de costos sin contenido privado", () => {
  requireGlobalUsage(usage(), "org", ["consulta privada"]);
  const missing = usage(); missing.rows.items.splice(1, 1); assert.throws(() => requireGlobalUsage(missing, "org"));
  const bad = usage(); bad.platformKeyCost.amount = 15; assert.throws(() => requireGlobalUsage(bad, "org"));
  const leaked = usage(); leaked.rows.items[0].conversationId = "secreto"; assert.throws(() => requireGlobalUsage(leaked, "org"));
  const text = usage(); text.rows.items[0].displayName = "consulta privada"; assert.throws(() => requireGlobalUsage(text, "org", ["consulta privada"]));
});

test("la restauración compara todos los campos públicos y conserva la clave write-only sin introducir secretos", () => {
  const settings = { defaultModelId: "modelo", allowedModelIds: ["modelo"], effort: "low", dailyMessageLimit: 50, monthlyOrganizationBudget: { amount: 10, currency: "USD" }, personalEnabled: true, retentionDays: 30, hasKey: true, maskedKeySuffix: "-key", version: 3 };
  const before = structuredClone(settings); const payload = platformSettingsValues(settings);
  assert.equal(Object.hasOwn(payload, "apiKey"), false); assert.equal(payload.keyAction, "keep"); assert.deepEqual(settings, before);
  assertGlobalSettingsRestored(settings, { ...settings, version: 8 });
  assertGlobalSettingsRestored({ ...settings, allowedModelIds: ["segundo", "modelo"] }, { ...settings, allowedModelIds: ["modelo", "segundo"] });
  for (const changed of [{ dailyMessageLimit: 51 }, { allowedModelIds: [] }, { personalEnabled: false }, { hasKey: false }]) assert.throws(() => assertGlobalSettingsRestored(settings, { ...settings, ...changed }));
});

test("la negativa privada exige código/traza y rechaza URL, bytes o cuerpo de conversación", async () => {
  const response = (body) => ({ status: () => 404, json: async () => body });
  await requirePrivateProblem(response({ code: "Assistant.Conversation.NotFound", traceId: "traza" }), 404, "Assistant.Conversation.NotFound");
  for (const leak of [{ url: "/public" }, { bytes: [1] }, { conversation: {} }]) await assert.rejects(() => requirePrivateProblem(response({ code: "Assistant.Conversation.NotFound", traceId: "traza", ...leak }), 404, "Assistant.Conversation.NotFound"));
  await assert.rejects(() => requirePrivateProblem(response({ code: "Http.NotFound", traceId: "traza" }), 404, "Assistant.Conversation.NotFound"));
});
