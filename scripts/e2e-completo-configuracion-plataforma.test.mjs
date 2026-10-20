import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { platformConfigurationDefinitions, configurationProfileKeys, completePlatformSettings, rateLimitUiDrafts,
  configurationProbeSettings, assertCompleteSettingsWrite, withRestoredCompleteSettings } from "./e2e-completo-configuracion-plataforma.mjs";

const baseline = () => ({ consumerSignup: "Open", businessSignup: "RequiresApproval", maxOwnedOrganizations: 7,
  salesEmail: "ventas@example.test", supportEmail: "soporte@example.test", version: 19,
  rateLimits: Object.fromEntries(configurationProfileKeys.map((key, index) => [key, { permitLimit: 200 + index, windowSeconds: (index + 1) * 60 }])) });

test("único record declara el contrato completo y los doce perfiles coinciden con la fuente cerrada", async () => {
  assert.equal(platformConfigurationDefinitions.length, 1);
  assert.deepEqual(platformConfigurationDefinitions[0].covers, ["BACK-PL-026"]);
  const source = await readFile(new URL("../src/areas/platform/settings/lib/rateLimits.ts", import.meta.url), "utf8");
  assert.deepEqual([...source.matchAll(/key: "([A-Za-z]+)"/gu)].map((match) => match[1]), configurationProfileKeys);
});
test("instantánea conserva cinco campos y doce perfiles raw sin alias ni versión vieja", () => {
  const source = baseline(); const snapshot = completePlatformSettings(source);
  assert.equal(snapshot.version, undefined); assert.deepEqual(snapshot.rateLimits, source.rateLimits);
  source.rateLimits.ip.permitLimit = 1; assert.equal(snapshot.rateLimits.ip.permitLimit, 200);
  const missing = baseline(); delete missing.rateLimits.ip; assert.throws(() => completePlatformSettings(missing));
  const extra = baseline(); extra.rateLimits.otro = { permitLimit: 1, windowSeconds: 1 }; assert.throws(() => completePlatformSettings(extra));
});
test("borradores de restauración en segundos conservan cualquier ventana raw y todos sus enteros", () => {
  const original = baseline(); original.rateLimits.ip.windowSeconds = 86400; original.rateLimits.publicIp.windowSeconds = 61;
  const drafts = rateLimitUiDrafts(original);
  assert.deepEqual(Object.keys(drafts), configurationProfileKeys);
  for (const key of configurationProfileKeys) assert.deepEqual(drafts[key], { permitLimit: original.rateLimits[key].permitLimit, amount: original.rateLimits[key].windowSeconds, unit: "s" });
});
test("propuesta cambia doce perfiles con enteros válidos y unidades s/m/h", () => {
  const original = baseline(); const proposed = configurationProbeSettings(original, 1);
  assert.equal(proposed.maxOwnedOrganizations, 1); assert.equal(proposed.consumerSignup, "Closed"); assert.equal(proposed.businessSignup, "Closed");
  assert.deepEqual(new Set(Object.values(proposed.drafts).map((entry) => entry.unit)), new Set(["s", "m", "h"]));
  for (const key of configurationProfileKeys) {
    const quota = proposed.rateLimits[key]; const draft = proposed.drafts[key];
    assert.ok(Number.isInteger(quota.permitLimit) && quota.permitLimit >= 900 && quota.permitLimit <= 1_000_000);
    assert.ok(Number.isInteger(draft.amount) && quota.windowSeconds >= 1 && quota.windowSeconds <= 86400);
    assert.equal(quota.windowSeconds, draft.amount * { s: 1, m: 60, h: 3600 }[draft.unit]);
  }
  assert.equal(original.maxOwnedOrganizations, 7);
  original.rateLimits.ip.permitLimit = 900;
  assert.notEqual(configurationProbeSettings(original, 1).rateLimits.ip.permitLimit, 900, "La primera escritura sigue siendo real aunque coincida con una propuesta anterior.");
});
test("cada PUT exige los cinco campos, los doce perfiles, versión actual y motivo exactos", () => {
  const target = completePlatformSettings(baseline()); const sent = { ...target, version: 23, reason: "Motivo real" };
  assertCompleteSettingsWrite(sent, target, 23, "Motivo real");
  for (const change of [{ version: 19 }, { reason: "" }, { rateLimits: { ip: target.rateLimits.ip } }, { otro: true }]) {
    assert.throws(() => assertCompleteSettingsWrite({ ...sent, ...change }, target, 23, "Motivo real"));
  }
});
test("finally recibe los doce perfiles originales aunque withRestoredSettings recorte sus cinco campos", async () => {
  const original = baseline(); let restored;
  const failure = new Error("validación falló");
  await assert.rejects(() => withRestoredCompleteSettings({
    read: async () => original, prepare: async () => {}, body: async () => { throw failure; },
    restore: async (snapshot) => { restored = snapshot; },
  }), (error) => error === failure);
  assert.deepEqual(completePlatformSettings(restored), completePlatformSettings(original));
  assert.equal(restored.version, 19);
});
