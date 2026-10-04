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

function send(response, file) {
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
}

/// Sirve el lienzo tal cual (sin la app ni la API), la página del recorrido, sus pasos y el avance guardado.
export async function startTourServer({ progressFile, withArchive = false }) {
  const steps = buildSteps(lienzo, { withArchive });
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/" || url.pathname === "/recorrido") return send(response, path.join(here, "recorrido.html"));
    if (url.pathname === "/recorrido/pasos.json") {
      response.writeHead(200, { "Content-Type": types[".json"] }).end(JSON.stringify(steps));
      return;
    }
    if (url.pathname === "/recorrido/progreso") {
      if (request.method === "POST") {
        let body = "";
        request.on("data", (chunk) => { body += chunk; });
        request.on("end", () => { writeFileSync(progressFile, body); response.writeHead(204).end(); });
        return;
      }
      response.writeHead(200, { "Content-Type": types[".json"] }).end(existsSync(progressFile) ? readFileSync(progressFile) : "{\"index\":0}");
      return;
    }
    // Los tableros piden Inter por esta ruta, como en las capturas.
    if (url.pathname === "/_fonts/inter-latin-wght-normal.woff2") return send(response, interFont);
    const file = path.resolve(lienzo, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(`${lienzo}${path.sep}`)) {
      response.writeHead(404).end();
      return;
    }
    send(response, file);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    steps,
    url: `http://127.0.0.1:${server.address().port}/recorrido`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
