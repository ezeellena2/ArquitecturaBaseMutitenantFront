import assert from "node:assert/strict";
import { test } from "node:test";
import { startAssistantOpenStream } from "./assistant-open-stream.mjs";
import { EventEmitter } from "node:events";
import { request as httpRequest } from "node:http";
import { installApiMocks, runAppActions } from "./capturar-etapa-3a.mjs";

const origin = "http://localtest.me:5192";
const path = "/api/organization/assistant/conversations/gallery-chat/messages";
const bytes = 'event: start\r\ndata: {"turnId":"ficticio"}\r\n\r\nevent: delta\r\ndata: {"text":"Sí 🧉"}\r\n\r\n';
const fixture = { method: "POST", path, status: 200, contentType: "text/event-stream; charset=utf-8", rawBody: bytes, openStream: true };

test("el fixture entrega bytes SSE y mantiene lectura abierta hasta abort; cierra conexiones propias", async () => {
  const server = await startAssistantOpenStream([fixture], origin);
  const controller = new AbortController();
  try {
    const response = await fetch(`${server.url}${path}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{}", signal: controller.signal });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), fixture.contentType);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    const reader = response.body.getReader();
    const first = await reader.read();
    assert.equal(first.done, false);
    assert.equal(new TextDecoder().decode(first.value), bytes);
    const pending = reader.read();
    // Un turno de event loop comprueba que no se emitió EOF; no readiness por timer.
    assert.equal(await Promise.race([pending.then(() => "terminó"), new Promise((resolve) => setImmediate(() => resolve("abierto")))]), "abierto");
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    reader.releaseLock();
    assert.equal(response.body.locked, false);
  } finally { controller.abort(); await server.close(); }
  assert.equal(server.connections, 0);
  await assert.rejects(fetch(`${server.url}${path}`, { method: "POST" }));
});

test("admisión exacta método, path, query, origen y OPTIONS; nada desconocido escapa", async () => {
  const server = await startAssistantOpenStream([fixture], origin);
  try {
    for (const [method, url, requestOrigin] of [["GET", path, origin], ["POST", `${path}/other`, origin], ["POST", `${path}?other=1`, origin], ["POST", path, "http://otro.test"], ["POST", path, undefined]]) {
      const response = await fetch(`${server.url}${url}`, { method, headers: requestOrigin ? { Origin: requestOrigin } : {} });
      assert.equal(response.status, 501);
      assert.deepEqual(await response.json(), { code: "Capture.UnmockedRoute", traceId: "capture" });
    }
    const headers = { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type,idempotency-key" };
    const preflight = await fetch(`${server.url}${path}`, { method: "OPTIONS", headers });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-methods"), "POST");
    assert.equal(preflight.headers.get("access-control-allow-headers"), "content-type,idempotency-key");
    for (const change of [{ "Access-Control-Request-Method": "PUT" }, { "Access-Control-Request-Headers": "x-unexpected" }, { Origin: "http://otro.test" }]) {
      assert.equal((await fetch(`${server.url}${path}`, { method: "OPTIONS", headers: { ...headers, ...change } })).status, 501);
    }
  } finally { await server.close(); }
  assert.equal(server.connections, 0);
});

test("request targets inválidos o normalizados reciben 501 y el fixture cierra sin excepción global", async () => {
  const server = await startAssistantOpenStream([fixture], origin);
  const port = new URL(server.url).port;
  let request;
  try {
    for (const target of ["//", `//127.0.0.1${path}`, `${server.url}${path}`, `${path}/../messages`, `${path}/%2e%2e/messages`, `${path}#ignored`]) {
      const response = await new Promise((resolve, reject) => {
        request = httpRequest({ hostname: "127.0.0.1", port, path: target, method: "POST", headers: { Origin: origin }, agent: false }, (incoming) => {
          if (incoming.statusCode !== 501) {
            incoming.resume();
            reject(new Error("Target indebido admitido"));
            return;
          }
          let body = "";
          incoming.setEncoding("utf8");
          incoming.on("data", (chunk) => { body += chunk; });
          incoming.on("error", reject);
          incoming.on("end", () => resolve({ status: incoming.statusCode, contentType: incoming.headers["content-type"], body }));
        });
        request.on("error", reject);
        request.end();
      });
      assert.equal(response.status, 501);
      assert.equal(response.contentType, "application/problem+json");
      assert.deepEqual(JSON.parse(response.body), { code: "Capture.UnmockedRoute", traceId: "capture" });
    }
  } finally { request?.destroy(); await server.close(); }
  assert.equal(server.connections, 0);
});

test("cleanup destruye también un lector abierto tras fallar el consumidor", async () => {
  const server = await startAssistantOpenStream([fixture], origin);
  let reader;
  try {
    const response = await fetch(`${server.url}${path}`, { method: "POST", headers: { Origin: origin } });
    reader = response.body.getReader();
    await reader.read();
  } finally { await server.close(); }
  await assert.rejects(reader.read());
  reader.releaseLock();
  await server.close();
  assert.equal(server.connections, 0);
});

test("route.continue preserva petición y AfterResponse espera respuesta real de su request exacta", async () => {
  const context = new EventEmitter();
  let handle;
  context.route = async (_pattern, handler) => { handle = handler; };
  const responses = [fixture,
    { method: "GET", path: "/api/read", status: 200, body: { pending: true }, afterResponse: { method: "POST", path } },
    { method: "GET", path: "/api/read", status: 200, body: { initial: true } }];
  const dispose = await installApiMocks(context, responses, undefined, { url: "http://127.0.0.1:51999", origin });
  let forwarded; let fulfilled;
  const request = { url: () => `${origin}${path}`, method: () => "POST", allHeaders: async () => ({ origin, "content-type": "application/json", "idempotency-key": "ficticia" }) };
  const read = async () => {
    await handle({ request: () => ({ url: () => `${origin}/api/read`, method: () => "GET" }), fulfill: async (value) => { fulfilled = value; } });
    return JSON.parse(fulfilled.body);
  };
  try {
    await handle({ request: () => request, continue: async (value) => { forwarded = value; } });
    assert.equal(forwarded.url, `http://127.0.0.1:51999${path}`);
    assert.deepEqual(forwarded.headers, await request.allHeaders());
    assert.equal(Object.hasOwn(forwarded, "method"), false);
    assert.equal(Object.hasOwn(forwarded, "postData"), false);
    assert.deepEqual(await read(), { initial: true });
    context.emit("response", { request: () => ({ ...request }), status: () => 200, headers: () => ({ "content-type": fixture.contentType }) });
    assert.deepEqual(await read(), { initial: true });
    context.emit("response", { request: () => request, status: () => 200, headers: () => ({ "content-type": fixture.contentType }) });
    assert.deepEqual(await read(), { pending: true });
    await handle({ request: () => ({ ...request, allHeaders: async () => ({ origin: "http://otro.test" }) }), fulfill: async (value) => { fulfilled = value; }, continue: async () => { assert.fail("Origen desconocido nunca sale a red"); } });
    assert.equal(fulfilled.status, 501);
    await handle({ request: () => ({ ...request, url: () => `${origin}/api/unknown` }), fulfill: async (value) => { fulfilled = value; }, continue: async () => { assert.fail("Ruta desconocida nunca sale a red"); } });
    assert.equal(fulfilled.status, 501);
  } finally { dispose(); }
  assert.equal(context.listenerCount("response"), 0);
  await assert.rejects(installApiMocks(context, responses, undefined, { url: "http://proveedor.test", origin }), /local efímero/);
});

test("la respuesta de otro contexto y una respuesta HTTP incorrecta no activan AfterResponse", async () => {
  const context = new EventEmitter(); const otherContext = new EventEmitter(); let handle; let body;
  context.route = async (_pattern, handler) => { handle = handler; };
  const dispose = await installApiMocks(context, [fixture,
    { method: "GET", path: "/api/read", status: 200, body: "final", afterResponse: { method: "POST", path } },
    { method: "GET", path: "/api/read", status: 200, body: "inicial" }], undefined, { url: "http://127.0.0.1:51999", origin });
  const request = { url: () => `${origin}${path}`, method: () => "POST", allHeaders: async () => ({ origin }) };
  try {
    await handle({ request: () => request, continue: async () => {} });
    otherContext.emit("response", { request: () => request, status: () => 200, headers: () => ({ "content-type": fixture.contentType }) });
    context.emit("response", { request: () => request, status: () => 501, headers: () => ({ "content-type": "application/problem+json" }) });
    await handle({ request: () => ({ url: () => `${origin}/api/read`, method: () => "GET" }), fulfill: async (value) => { body = value.body; } });
    assert.equal(JSON.parse(body), "inicial");
  } finally { dispose(); }
});

test("selección de historial usa contenedor accesible y conserva acciones globales previas", async () => {
  const calls = [];
  const surface = { getByRole: (role, options) => ({ click: async () => calls.push(["historial", role, options.name]) }) };
  const page = { getByRole: (role, options) => {
    if (role === "complementary" || role === "dialog") { calls.push(["contenedor", role, options.name]); return surface; }
    return { click: async () => calls.push(["global", role, options.name]) };
  } };
  await runAppActions(page, [
    { type: "click", role: "button", name: "Invitaciones vencidas", within: { role: "complementary", name: "Conversaciones" } },
    { type: "click", role: "button", name: "Mis organizaciones", within: { role: "dialog", name: "Conversaciones" } },
    { type: "click", role: "button", name: "Enviar" },
  ]);
  assert.deepEqual(calls, [["contenedor", "complementary", "Conversaciones"], ["historial", "button", "Invitaciones vencidas"],
    ["contenedor", "dialog", "Conversaciones"], ["historial", "button", "Mis organizaciones"], ["global", "button", "Enviar"]]);
});

test("manifest no reutiliza evidencia con otra versión del transporte", async () => {
  const { buildManifest, validateManifest } = await import("./capturar-etapa-8b.mjs");
  const manifest = await buildManifest();
  validateManifest(manifest);
  const stale = structuredClone(manifest);
  stale.transportSources[0].sha256 = "0".repeat(64);
  assert.throws(() => validateManifest(stale), /transporte cambió/);
});
