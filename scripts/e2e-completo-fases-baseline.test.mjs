import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EventEmitter } from "node:events";
import { registerHooks } from "node:module";
import test from "node:test";
import { existingScriptCases } from "./e2e-completo-inventario-front.mjs";
import { baselinewhatsapp, baselineasistente, baselineorgwa, baselineseguridad,
  assistantEvidenceModuleUrl, exposeAssistantEvidence, loadAssistantEvidence, observeAssistantIsolation,
  prepareBaselineFixture, runOriginalBaselinePhase, withBaselineFixture } from "./e2e-completo-fases-baseline.mjs";

const definitions = ["E8-01", "E8-02", "E8-03"].map((id) => ({ id: "BASE-" + id }));
function harness(statuses = {}) {
  const calls = []; const blocks = [];
  const h = { width: 1440, resultFor: (id) => ({ status: statuses[id] ?? "pending" }),
    record: async (id, getPage, action) => {
      calls.push({ id, page: getPage() });
      try { return { ok: true, value: await action() }; }
      catch (error) { statuses[id] = "failed"; return { ok: false, error }; }
    }, block: async (id, reason, page) => { blocks.push({ id, reason, page }); } };
  return { h, calls, blocks };
}

test("bridge conserva callback original y no omite pasos por antecedentes verdes", async () => {
  const { h, calls } = harness({ "BASE-E8-01": "passed" }); let actions = 0;
  await runOriginalBaselinePhase(h, [definitions[0]], async (record) => {
    const action = async () => { actions++; return "comprobado"; };
    const result = await record("E8-01", 1440, () => "pantalla", action);
    assert.equal(result.value, "comprobado");
  });
  assert.equal(actions, 1); assert.deepEqual(calls, [{ id: "BASE-E8-01", page: "pantalla" }]);
});

test("record fallido corta el flujo original y bloquea sólo pendientes no visitados de la fase", async () => {
  const { h, calls, blocks } = harness({ "BASE-E8-03": "passed" }); const failure = new Error("falló la acción"); let continued = false;
  await assert.rejects(() => runOriginalBaselinePhase(h, definitions, async (record) => {
    await record("E8-01", 1440, () => "fallo", async () => { throw failure; }); continued = true;
  }), (error) => error === failure);
  assert.equal(continued, false); assert.equal(calls.length, 1);
  assert.deepEqual(blocks.map((item) => item.id), ["BASE-E8-02"]);
  assert.ok(blocks[0].reason.includes("no llegó"));
});

test("bridge rechaza ancho o ID ajeno antes de registrar evidencia", async () => {
  for (const [id, width] of [["E8-01", 390], ["E9-01", 1440]]) {
    const { h, calls } = harness();
    await assert.rejects(() => runOriginalBaselinePhase(h, definitions, (record) => record(id, width, () => "pantalla", async () => "no")));
    assert.equal(calls.length, 0);
  }
});

test("un fallo previo no visitado queda bloqueado y conserva los verdes y la falla propia visitada", async () => {
  const { h, blocks } = harness({ "BASE-E8-02": "failed", "BASE-E8-03": "passed" });
  h.isPending = () => false;
  const failure = new Error("falló el primer paso");
  await assert.rejects(() => runOriginalBaselinePhase(h, definitions, (record) => record("E8-01", 1440, () => "p", async () => { throw failure; })), (error) => error === failure);
  assert.deepEqual(blocks.map((item) => item.id), ["BASE-E8-02"]);
});

test("preparación usa registro y publicación UI sólo cuando la fase lo necesita", async () => {
  const events = []; const owner = { email: "preparacion@example.test", organization: "Organización propia", slug: "propia", me: { access: "business", activeTenantId: "tenant-real" } };
  const fixture = { page: "persona", platformPage: "operador" };
  await prepareBaselineFixture({ width: 1440 }, fixture, { business: true, publish: true }, {
    registerBusiness: async (page) => { events.push(["registro", page]); return owner; },
    publish: async (current) => { assert.equal(current.owner, owner); events.push(["publicar", current.page]); current.site = new URL("https://propia.localtest.me:5174"); },
    signOut: async (page) => { events.push(["salir", page]); },
    operatorLogin: async (page, email) => { events.push(["operador MFA", page, email]); },
  });
  assert.deepEqual(events, [["registro", "persona"], ["publicar", "persona"], ["salir", "persona"], ["operador MFA", "operador", "e2e-a3-operator@example.test"]]);
  assert.equal(fixture.owner, owner); assert.ok(fixture.site);
});

test("seguridad reserva5b/5c sin usarlos para preparar al operador", async () => {
  const seen = [];
  await prepareBaselineFixture({ width: 390 }, { page: "p", platformPage: "o" }, { business: false, publish: false }, {
    registerBusiness: async () => { throw new Error("no corresponde"); }, publish: async () => { throw new Error("no corresponde"); },
    signOut: async () => { throw new Error("no hay sesión pública de setup"); }, operatorLogin: async (_page, email) => { seen.push(email); },
  });
  assert.deepEqual(seen, ["e2e-a1-operator@example.test"]);
});

test("fallar preparando bloquea la fase y ejecuta salida UI y cierre de ambas pestañas", async () => {
  const { h, blocks } = harness(); const events = [];
  const page = { close: async () => { events.push("cerrar persona"); } };
  const platformPage = { close: async () => { events.push("cerrar operador"); } };
  const queue = [page, platformPage]; h.newPage = async () => queue.shift();
  const failure = new Error("preparación falló"); let ran = false;
  await assert.rejects(() => withBaselineFixture(h, { definitions }, async () => { ran = true; }, {
    prepare: async () => { throw failure; }, cleanup: async () => { events.push("salida UI"); },
  }), (error) => error === failure);
  assert.equal(ran, false); assert.equal(blocks.length, 3);
  assert.deepEqual(events, ["salida UI", "cerrar persona", "cerrar operador"]);
});

test("fallo de salida conserva el error y cierra todas las pestañas", async () => {
  const { h } = harness(); const closed = []; h.newPage = async () => ({ close: async () => { closed.push(true); } });
  await assert.rejects(() => withBaselineFixture(h, { definitions }, async () => {}, {
    prepare: async () => {}, cleanup: async () => { throw new Error("salida UI falló"); },
  }), /salida UI falló/u);
  assert.equal(closed.length, 2);
});

test("cuatro suites conservan69 IDs originales y agregan tres evidencias explícitas del asistente", () => {
  const suites = [baselinewhatsapp, baselineasistente, baselineorgwa, baselineseguridad];
  assert.deepEqual(suites.map((suite) => suite.definitions.length), [26, 24, 15, 7]);
  const known = new Set(existingScriptCases.map((entry) => "BASE-" + entry.id));
  const ids = suites.flatMap((suite) => suite.definitions.map((entry) => entry.id));
  assert.equal(new Set(ids).size, 72);
  const original = ids.filter((id) => id.startsWith("BASE-")); assert.equal(original.length, 69);
  for (const id of original) { assert.ok(known.has(id)); assert.ok(!/^BASE-(?:0[1-9]|[12]\d)$/u.test(id)); }
  const extra = baselineasistente.definitions.filter((entry) => !entry.id.startsWith("BASE-"));
  assert.deepEqual(extra.map((entry) => entry.id), ["AS-TEC-01", "AS-TEC-02", "AS-TEC-03"]);
  assert.deepEqual(extra.map((entry) => entry.covers ?? []), [["BACK-AS-008"], [], []]);
  for (const entry of extra) { assert.ok(entry.actor && entry.route && entry.action && entry.expected && entry.source); }
  for (const suite of suites) assert.equal(typeof suite.run, "function");
});

test("adaptación del asistente sólo agrega código después de la fuente real intacta", async () => {
  const original = await readFile(new URL("./assistant-real-ui.mjs", import.meta.url), "utf8");
  const transformed = exposeAssistantEvidence(original);
  assert.equal(transformed.slice(0, original.length), original);
  assert.throws(() => exposeAssistantEvidence(transformed), /ya fue adaptado/u);
  assert.throws(() => exposeAssistantEvidence(original.replace("async function assistantTransportCases(", "async function changedTransport(")), /funciones locales/u);
});

test("loader adapta únicamente su URL privada y desregistra aun si falla la importación", async () => {
  const original = await readFile(new URL("./assistant-real-ui.mjs", import.meta.url), "utf8");
  for (const fail of [false, true]) {
    let hooks; let unregistered = 0; const untouched = { format: "module", source: "otro módulo" };
    const result = () => loadAssistantEvidence({
      register: (value) => { hooks = value; return { deregister: () => { unregistered++; } }; },
      importModule: async (url) => {
        assert.equal(url, assistantEvidenceModuleUrl);
        for (const other of [url.replace("?e2e-completo-evidencia", ""), url + "-otro"]) {
          assert.equal(hooks.load(other, {}, () => untouched), untouched);
        }
        const transformed = hooks.load(url, {}, () => ({ format: "module", source: Buffer.from(original) }));
        assert.ok(transformed.source.startsWith(original));
        if (fail) throw new Error("importación falló");
        return { runCompleteAssistantJourney: "adaptado" };
      },
    });
    if (fail) await assert.rejects(result, /importación falló/u);
    else assert.equal((await result()).runCompleteAssistantJourney, "adaptado");
    assert.equal(unregistered, 1);
  }
});

const isolationReply = (access, body, status = 404, json = async () => body) => ({
  url: () => "https://app.example.test/api/" + access + "/assistant/conversations/propio",
  request: () => ({ method: () => "GET" }), status: () => status, json,
});
test("observador lee inmediatamente los dos404 reales, exige código y traceId y quita listeners", async () => {
  const page = new EventEmitter(); const platformPage = new EventEmitter(); const reads = [];
  const problem = { code: "Assistant.Conversation.NotFound", traceId: "traza-real" };
  const value = await observeAssistantIsolation({ page, platformPage, ownBusinessId: "propio" }, async () => {
    page.emit("response", isolationReply("me", problem, 404, async () => { reads.push("personal"); return problem; }));
    platformPage.emit("response", isolationReply("platform", problem, 404, async () => { reads.push("plataforma"); return problem; }));
    assert.deepEqual(reads, ["personal", "plataforma"]);
    return "acción original";
  });
  assert.equal(value, "acción original");
  assert.equal(page.listenerCount("response"), 0); assert.equal(platformPage.listenerCount("response"), 0);
});
test("observador no aprueba códigos o estados distintos ni un cuerpo perdido ni respuestas ausentes", async () => {
  for (const [status, body, json] of [
    [403, { code: "Assistant.Conversation.NotFound", traceId: "t" }],
    [404, { code: "Otro.Error", traceId: "t" }],
    [404, { code: "Assistant.Conversation.NotFound" }],
    [404, {}, async () => { throw new Error("cuerpo perdido"); }],
  ]) {
    const page = new EventEmitter(); const platformPage = new EventEmitter();
    await assert.rejects(() => observeAssistantIsolation({ page, platformPage, ownBusinessId: "propio" }, async () => {
      page.emit("response", isolationReply("me", body, status, json));
      platformPage.emit("response", isolationReply("platform", { code: "Assistant.Conversation.NotFound", traceId: "t" }));
    }));
    assert.equal(page.listenerCount("response"), 0); assert.equal(platformPage.listenerCount("response"), 0);
  }
  await assert.rejects(() => observeAssistantIsolation({ page: new EventEmitter(), platformPage: new EventEmitter(), ownBusinessId: "propio" }, async () => {}), /dos accesos/u);
});
test("observador espera lecturas en curso al fallar y conserva el error original", async () => {
  const page = new EventEmitter(); const platformPage = new EventEmitter(); const failure = new Error("acción original falló");
  let finishRead; let completed = false;
  const pending = observeAssistantIsolation({ page, platformPage, ownBusinessId: "propio" }, async () => {
    page.emit("response", isolationReply("me", {}, 404, () => new Promise((resolve) => { finishRead = resolve; })));
    throw failure;
  }).finally(() => { completed = true; });
  await Promise.resolve(); await Promise.resolve(); assert.equal(completed, false);
  finishRead({ code: "Assistant.Conversation.NotFound", traceId: "t" });
  await assert.rejects(() => pending, (error) => error === failure);
  assert.equal(page.listenerCount("response"), 0); assert.equal(platformPage.listenerCount("response"), 0);
});

test("fuente real importada envuelve los bindings locales una vez y los restaura tras éxito o fallo", async () => {
  // Este apéndice existe sólo en el módulo privado del test; no cambia archivos ni helpers originales.
  const testingAppendix = `
export function testReplaceLocalFunctions(next) {
  runAssistantJourney = next.journey;
  assistantTransportCases = next.transport;
  assistantAttachmentQuantityCases = next.quantity;
  assistantAccessCases = next.access;
}
export function testLocalFunctions() {
  return { journey: runAssistantJourney, transport: assistantTransportCases,
    quantity: assistantAttachmentQuantityCases, access: assistantAccessCases };
}
`;
  const module = await loadAssistantEvidence({ register: (hooks) => registerHooks({
    load: (url, context, nextLoad) => {
      const loaded = hooks.load(url, context, nextLoad);
      return url === assistantEvidenceModuleUrl ? { ...loaded, source: loaded.source + testingAppendix } : loaded;
    },
  }) });
  for (const fail of [false, true]) {
    const count = { transport: 0, quantity: 0, access: 0 }; const recorded = []; const failure = new Error("aserción original");
    const page = new EventEmitter(); const platformPage = new EventEmitter();
    const originals = {
      journey: async (options) => {
        const current = module.testLocalFunctions();
        await current.transport({ page: options.page, width: options.width });
        await current.quantity(options.page, "/api/organization/assistant", options.width);
        await current.access({ page: options.page, platformPage: options.platformPage, width: options.width, ownBusinessId: "propio" });
      },
      transport: async () => { count.transport++; },
      quantity: async () => { count.quantity++; if (fail) throw failure; },
      access: async () => {
        count.access++;
        const body = { code: "Assistant.Conversation.NotFound", traceId: "traza" };
        page.emit("response", isolationReply("me", body)); platformPage.emit("response", isolationReply("platform", body));
      },
    };
    module.testReplaceLocalFunctions(originals);
    const { h, blocks } = harness();
    const defs = baselineasistente.definitions.filter((entry) => entry.id.startsWith("AS-TEC-"));
    const run = () => runOriginalBaselinePhase(h, defs, (record) => module.runCompleteAssistantJourney({
      page, platformPage, width: 1440,
      record: async (...args) => {
        try { return await record(...args); }
        finally { recorded.push({ id: args[0], width: args[1], page: args[2]() }); }
      },
    }));
    if (fail) await assert.rejects(run, (error) => error === failure);
    else await run();
    assert.deepEqual(module.testLocalFunctions(), originals);
    assert.deepEqual(count, { transport: 1, quantity: 1, access: fail ? 0 : 1 });
    assert.deepEqual(recorded, [
      { id: "AS-TEC-01", width: 1440, page },
      { id: "AS-TEC-02", width: 1440, page },
      ...fail ? [] : [{ id: "AS-TEC-03", width: 1440, page: platformPage }],
    ]);
    assert.deepEqual(blocks.map((entry) => entry.id), fail ? ["AS-TEC-03"] : []);
  }
});
