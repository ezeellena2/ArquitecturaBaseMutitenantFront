import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync } from "node:fs";
import { buildManifest, inventory, selectCases, validateManifest, expectedApiFailure, safeOutput, main } from "./capturar-etapa-8b.mjs";
import { installApiMocks, runAppActions } from "./capturar-etapa-3a.mjs";

test("inventario del HTML actual preserva estados y asimetría", () => {
  const cases = inventory();
  assert.equal(cases.length, 129);
  assert.equal(cases.filter((entry) => entry.group === "chat").length, 96);
  assert.equal(cases.filter((entry) => entry.group === "configuracion").length, 22);
  assert.equal(cases.filter((entry) => entry.group === "uso").length, 11);
  assert.ok(cases.some((entry) => entry.board === "Asistente-Org" && entry.state === "Detenida"));
  assert.ok(!cases.some((entry) => entry.board === "M-Asistente-Org" && entry.state === "Detenida"));
});

test("completa bloquea y selección parcial nunca declara galería completa", async () => {
  const manifest = await buildManifest();
  assert.equal(manifest.cases.filter((entry) => entry.group === "configuracion").length, 22);
  assert.ok(manifest.pending.some((entry) => entry.group === "uso"));
  assert.throws(() => selectCases(manifest), /pendientes/);
  const selection = selectCases(manifest, { groups: ["configuracion"] });
  assert.equal(selection.cases.length, 22);
  assert.equal(selection.complete, false);
  assert.throws(() => selectCases(manifest, { groups: ["uso"] }), /pendientes/);
  assert.throws(() => selectCases(manifest, { ids: ["inexistente"] }), /desconocida/);
});

test("entrada completa bloquea antes de crear output, server o browser", async () => {
  const output = `.local/e8b-bloqueado-${process.pid}`;
  assert.equal(existsSync(safeOutput(output)), false);
  await assert.rejects(main(["--out", output]), /pendientes/);
  assert.equal(existsSync(safeOutput(output)), false);
});

test("validator no acepta estados, viewports, mappers ni omisiones falsos", async () => {
  const manifest = await buildManifest();
  validateManifest(manifest);
  for (const mutate of [
    (copy) => { copy.cases[0].state = "Inventado"; },
    (copy) => { copy.cases[0].viewport.width = 390; },
    (copy) => { copy.pending.pop(); },
    (copy) => { copy.cases[0].props = { asistente: "Primera vez" }; },
    (copy) => { copy.cases[0].app.path = "/org/asistente"; },
  ]) {
    const copy = structuredClone(manifest); mutate(copy);
    assert.throws(() => validateManifest(copy));
  }
  assert.throws(() => validateManifest(manifest, [...inventory(), { ...inventory()[0], id: "nuevo-estado", state: "Nuevo" }]), /mapear|inventario/);
});

async function mockRequest(responses, method = "POST", pathname = "/api/test") {
  let handler; let fulfilled;
  await installApiMocks({ route: async (_pattern, callback) => { handler = callback; } }, responses);
  const invoke = async (requestMethod = method, requestPath = pathname) => {
    await handler({ request: () => ({ url: () => `http://localtest.me:5192${requestPath}`, method: () => requestMethod }), fulfill: async (value) => { fulfilled = value; } });
    return fulfilled;
  };
  return invoke;
}

test("raw SSE preserva bytes y content type; JSON y ruta sin mock conservan defaults", async () => {
  const rawBody = 'event: delta\r\ndata: {"text":"Sí 🧉"}\r\n\r\n';
  const raw = await mockRequest([{ method: "POST", path: "/api/test", status: 200, rawBody, contentType: "text/event-stream; charset=utf-8" }]);
  assert.deepEqual(await raw(), { status: 200, body: rawBody, contentType: "text/event-stream; charset=utf-8", headers: {} });
  const json = await mockRequest([{ method: "POST", path: "/api/test", status: 202, body: { ok: true } }]);
  assert.deepEqual(await json(), { status: 202, body: '{"ok":true}', contentType: "application/json", headers: {} });
  const missing = await mockRequest([]);
  assert.equal((await missing()).status, 501);
  const sequence = await mockRequest([
    { method: "GET", path: "/api/test", status: 200, body: { final: true }, afterResponse: { method: "POST", path: "/api/test" } },
    { method: "GET", path: "/api/test", status: 200, body: { first: true } },
    { method: "POST", path: "/api/test", status: 200, rawBody, contentType: "text/event-stream" },
  ], "GET");
  assert.equal((await sequence()).body, '{"first":true}');
  assert.equal((await sequence()).body, '{"first":true}');
  await sequence("POST");
  assert.equal((await sequence()).body, '{"final":true}');
});

test("errores esperados exigen método, ruta, query y status exactos; 501 nunca se permite", () => {
  const responses = [{ method: "PUT", path: "/api/test", status: 400, query: { mode: "a" } }];
  assert.equal(expectedApiFailure(responses, "PUT", new URL("http://localtest.me/api/test?mode=a"), 400), true);
  for (const [method, url, status] of [["GET", "/api/test?mode=a", 400], ["PUT", "/api/other?mode=a", 400], ["PUT", "/api/test?mode=b", 400], ["PUT", "/api/test?mode=a", 503]]) {
    assert.equal(expectedApiFailure(responses, method, new URL(url, "http://localtest.me"), status), false);
  }
  assert.equal(expectedApiFailure([{ method: "PUT", path: "/api/test", status: 501 }], "PUT", new URL("http://localtest.me/api/test"), 501), false);
});

test("password se llena por label; acciones previas por rol se conservan", async () => {
  const calls = [];
  await runAppActions({ getByLabel: (name) => ({ fill: async (value) => { calls.push([name, value]); } }), getByRole: (role, options) => ({ fill: async (value) => { calls.push([role, options.name, value]); } }) }, [
    { type: "fill", label: "Clave de Anthropic", value: "ficticia" },
    { type: "fill", role: "textbox", name: "Nombre", value: "Prueba" },
  ]);
  assert.deepEqual(calls, [["Clave de Anthropic", "ficticia"], ["textbox", "Nombre", "Prueba"]]);
});

test("output exige destino local y rechaza escape", () => {
  assert.ok(safeOutput(".local/e8b-prueba").endsWith("e8b-prueba"));
  assert.throws(() => safeOutput("../ArquitecturaBaseMutitenant"), /destino/);
  assert.throws(() => safeOutput("docs/design/guia"), /destino/);
});
