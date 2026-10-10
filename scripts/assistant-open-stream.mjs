import { createServer } from "node:http";

// Fixture de captura exclusivamente local. No lee cuerpos ni registra headers/datos privados.
export async function startAssistantOpenStream(responses, origin) {
  if (origin !== "http://localtest.me:5192") throw new Error("Origen del arnés inválido");
  const streams = responses.filter((response) => response.openStream);
  if (!streams.length || streams.some((response) => response.method !== "POST" || !response.path.startsWith("/api/")
    || response.status !== 200 || typeof response.rawBody !== "string" || response.contentType?.split(";", 1)[0].trim() !== "text/event-stream")) {
    throw new Error("Fixture SSE abierto inválido");
  }
  const allowedHeaders = new Set(["content-type", "idempotency-key", "authorization", "accept-language"]);
  const sockets = new Set();
  const server = createServer((request, response) => {
    request.resume(); // Drena sin conservar ni imprimir el cuerpo ficticio original.
    let url;
    try {
      const parsed = new URL(request.url, "http://127.0.0.1");
      // Sólo origin-form exacto: normalizar un target indebido nunca admite una ruta declarada.
      if (request.url === `${parsed.pathname}${parsed.search}`) url = parsed;
    } catch { /* El mismo rechazo 501 de admisión atiende targets que no se pueden parsear. */ }
    const fixture = url && streams.find((item) => item.path === url.pathname
      && url.searchParams.toString() === new URLSearchParams(item.query ?? {}).toString());
    const requestedHeaders = String(request.headers["access-control-request-headers"] ?? "").toLowerCase().split(",").map((value) => value.trim()).filter(Boolean);
    const preflight = request.method === "OPTIONS" && request.headers["access-control-request-method"] === "POST"
      && requestedHeaders.every((header) => allowedHeaders.has(header));
    if (!fixture || request.headers.origin !== origin || (request.method !== fixture.method && !preflight)) {
      response.writeHead(501, { "Content-Type": "application/problem+json" });
      response.end(JSON.stringify({ code: "Capture.UnmockedRoute", traceId: "capture" }));
      return;
    }
    const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", Vary: "Origin" };
    if (preflight) {
      response.writeHead(204, { ...cors, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": requestedHeaders.join(",") });
      response.end();
      return;
    }
    response.writeHead(fixture.status, { ...cors, "Content-Type": fixture.contentType, "Cache-Control": "no-store" });
    response.write(fixture.rawBody);
    // Sin end: el SDK mantiene consulting/writing hasta abort o cierre del contexto.
  });
  server.on("connection", (socket) => { sockets.add(socket); socket.on("close", () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => { server.off("error", reject); resolve(); });
  });
  let closing;
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    get connections() { return sockets.size; },
    close() {
      closing ??= (async () => {
        const closed = new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        const connectionsClosed = [...sockets].map((socket) => new Promise((resolve) => {
          socket.once("close", resolve);
          socket.destroy();
        }));
        await Promise.all([closed, ...connectionsClosed]);
      })();
      return closing;
    },
  };
}
