import { createServer } from "node:http";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSteps } from "./pasos.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const lienzo = path.join(root, "docs/design/lienzo");
const interFont = path.join(root, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };

export function sendFile(response, file) {
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
}

export function sendJson(response, value) {
  response.writeHead(200, { "Content-Type": types[".json"] }).end(JSON.stringify(value));
}

/// Un servidor local con las rutas propias de cada herramienta y, para lo demás, el lienzo tal cual (sin la app ni la
/// API), con la letra Inter que piden los tableros.
export async function startServer(routes) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const route = routes[url.pathname];
    if (route) return route(request, response);
    if (url.pathname === "/_fonts/inter-latin-wght-normal.woff2") return sendFile(response, interFont);
    const file = path.resolve(lienzo, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(`${lienzo}${path.sep}`)) {
      response.writeHead(404).end();
      return;
    }
    sendFile(response, file);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

/// El recorrido: la página, sus pasos y el avance guardado.
export async function startTourServer({ progressFile, withArchive = false }) {
  const steps = buildSteps(lienzo, { withArchive });
  const page = (_request, response) => sendFile(response, path.join(here, "recorrido.html"));
  const server = await startServer({
    "/": page,
    "/recorrido": page,
    "/recorrido/pasos.json": (_request, response) => sendJson(response, steps),
    "/recorrido/progreso": (request, response) => {
      if (request.method === "POST") {
        let body = "";
        request.on("data", (chunk) => { body += chunk; });
        request.on("end", () => { writeFileSync(progressFile, body); response.writeHead(204).end(); });
        return;
      }
      sendJson(response, existsSync(progressFile) ? JSON.parse(readFileSync(progressFile, "utf8")) : { index: 0 });
    },
  });
  return { steps, url: `${server.origin}/recorrido`, close: server.close };
}

/// La vista en vivo: la página y las pantallas que se pueden elegir.
export async function startLiveServer({ cases, viteUrl }) {
  const page = (_request, response) => sendFile(response, path.join(here, "vivo.html"));
  const server = await startServer({
    "/": page,
    "/vivo": page,
    "/vivo/casos.json": (_request, response) => sendJson(response, { cases, viteUrl }),
  });
  return { url: `${server.origin}/vivo`, close: server.close };
}
