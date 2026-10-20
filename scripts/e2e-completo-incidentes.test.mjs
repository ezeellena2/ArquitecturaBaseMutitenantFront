import assert from "node:assert/strict";
import test from "node:test";
import { parseFunctionalBaselineIncidents, renderBaselineIncidentsHTML } from "./e2e-completo-incidentes.mjs";

test("extrae sólo fallas funcionales únicas y conserva el paso sin inventar anchos, área o ruta", () => {
  const line = "A3: Plataforma y persona conviven: falló en “sale de Plataforma” (última Api: GET /api/me → 200) [TimeoutError] locator.click: Timeout 30000ms exceeded.";
  const incidents = parseFunctionalBaselineIncidents(["✔ Otro caso", line, "  " + line, "  Error: " + line, "ℹ tests 40", "not ok 1 - A3", "Error antes del entorno"].join("\n"));
  assert.equal(incidents.length, 1);
  assert.equal(incidents[0].name, "A3: Plataforma y persona conviven");
  assert.equal(incidents[0].action, "sale de Plataforma");
  assert.equal(incidents[0].stage, "sale de Plataforma");
  assert.match(incidents[0].actual, /TimeoutError/u);
  for (const field of ["width", "area", "route", "results", "image"]) assert.equal(Object.hasOwn(incidents[0], field), false, field);
  assert.equal(incidents[0].severity, "high");
  assert.match(incidents[0].command, /MT_E2E_ONLY_CASE/u);
  assert.match(incidents[0].command, /e2e-completo-linea-base\.mjs/u);
  assert.match(incidents[0].reproduce.join(" "), /sale de Plataforma/u);
  assert.equal(parseFunctionalBaselineIncidents(null).length, 0);
});

test("elimina consultas, fragmentos, OTP y códigos de recuperación antes de guardar el incidente", () => {
  const [incident] = parseFunctionalBaselineIncidents("A2: caso: falló en “abrir https://localhost:5174/cuenta?secret=oculto#ticket” [Error] /api/login?code=secreto#nonce 654321 ABCD-EFGH.");
  assert.equal(incident.action, "abrir https://localhost:5174/cuenta");
  const serialized = JSON.stringify(incident);
  for (const secret of ["oculto", "ticket", "secreto", "nonce", "654321", "ABCD-EFGH"]) assert.equal(serialized.includes(secret), false, secret);
  assert.match(incident.actual, /\[código\]/u);
});

test("usa sólo metadatos explícitos y evita comas o comillas ejecutables en el filtro de reproducción", () => {
  const [incident] = parseFunctionalBaselineIncidents("A5: correo, baja y cancelación 'propia': falló en “cancelar” [Error] área: Cuenta; ruta actual /cuenta?secret=oculto.");
  assert.equal(incident.area, "Cuenta");
  assert.equal(incident.route, "/cuenta");
  assert.equal(incident.caseFilter.includes(","), false, "El runner interpreta comas como varios filtros.");
  assert.match(incident.command, /cancelación ''propia''/u, "PowerShell duplica las comillas dentro de su literal.");
  assert.equal(Object.hasOwn(incident, "width"), false);
});

test("el HTML escapa todos los campos, ordena por gravedad y explica la captura ausente", () => {
  const [base] = parseFunctionalBaselineIncidents("A3: caso: falló en “salir” [Error] No salió.");
  const html = renderBaselineIncidentsHTML([
    { ...base, name: "baja", severity: "low" },
    { ...base, name: "alta <script>", severity: "high", action: "<img src=x onerror=alert(1)>", actual: "https://localhost/error?token=secreto 123456", command: "<script>", reproduce: ["<b>"], area: "<iframe>", route: "/ruta?token=oculto" },
    { ...base, name: "crítica", severity: "critical" },
  ]);
  assert.ok(html.indexOf("crítica") < html.indexOf("alta &lt;script&gt;"));
  assert.ok(html.indexOf("alta &lt;script&gt;") < html.indexOf(">baja<"));
  for (const unsafe of ["<script>", "<img", "<iframe>", "secreto", "oculto", "123456"]) assert.equal(html.includes(unsafe), false, unsafe);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/u);
  assert.match(html, /El script de línea de base no guardó captura individual/u);
  assert.match(html, /Ancho no registrado por separado/u);
  assert.equal(renderBaselineIncidentsHTML([base]).split("Sin determinar por el script").length - 1, 2);
  assert.equal(renderBaselineIncidentsHTML([]), "");
});
