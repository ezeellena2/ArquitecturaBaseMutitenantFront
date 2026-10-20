import assert from "node:assert/strict";
import test from "node:test";
import { parseFunctionalBaselineIncidents, renderBaselineIncidentsHTML } from "./e2e-completo-incidentes.mjs";

test("actor y esperado explícitos se muestran saneados sin alterar el incidente", () => {
  const incident = Object.freeze({ name: "Caso", actor: "Operador <b>propio</b> 123456", expected: "Volver a https://localtest.me/plataforma?token=oculto#ticket <script>", actual: "Falló el clic", severity: "high" });
  const html = renderBaselineIncidentsHTML([incident]);
  assert.match(html, /<dt>Quién<\/dt><dd>Operador &lt;b&gt;propio&lt;\/b&gt; \[código\]<\/dd>/u);
  assert.match(html, /<dt>Esperado<\/dt><dd>Volver a https:\/\/localtest\.me\/plataforma &lt;script&gt;<\/dd>/u);
  for (const secret of ["123456", "oculto", "ticket", "<script>"]) assert.equal(html.includes(secret), false, secret);
  assert.equal(incident.actual, "Falló el clic"); assert.equal(incident.expected.includes("token=oculto"), true);
});

test("actor y esperado ausentes se explican sin deducirlos del nombre ni de la acción", () => {
  for (const missing of [undefined, null, "", "   "]) {
    const incident = Object.freeze({ name: "Dueña que vuelve a Inicio", action: "Debe salir", actual: "No salió", actor: missing, expected: missing });
    const html = renderBaselineIncidentsHTML([incident]);
    assert.match(html, /<dt>Quién<\/dt><dd>El script de línea de base no registró el actor por separado\.<\/dd>/u);
    assert.match(html, /<dt>Esperado<\/dt><dd>El script de línea de base no registró el resultado esperado por separado\.<\/dd>/u);
    assert.equal(incident.actor, missing); assert.equal(incident.expected, missing);
  }
});

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

test("el análisis posterior se distingue del resultado original y admite una captura real relativa", () => {
  const [base] = parseFunctionalBaselineIncidents("A3: convivencia: falló en “salir” [TimeoutError] No salió.");
  const html = renderBaselineIncidentsHTML([{ ...base, analysis: "Convivencia y F5 pasaron; falló sólo <b>Salir</b>. https://localhost/ruta?token=oculto", image: '../evidencia/captura "real"-123456.png' }]);
  assert.match(html, /Incidentes de la línea de base/u);
  assert.match(html, /Análisis posterior/u);
  assert.match(html, /Convivencia y F5 pasaron; falló sólo &lt;b&gt;Salir&lt;\/b&gt;/u);
  assert.match(html, /\[TimeoutError\] No salió/u);
  assert.equal(html.includes("oculto"), false);
  assert.match(html, /href="\.\.\/evidencia\/captura &quot;real&quot;-123456\.png"/u);
  assert.match(html, /<img src=/u);
  assert.equal(html.includes("El script de línea de base no guardó captura individual"), false);
});

test("una imagen absoluta, remota o insegura no oculta la falta de captura", () => {
  for (const image of ["https://localhost/captura.png", "//otro/captura.png", "/tmp/captura.png", "C:\\evidencia\\captura.png", "javascript:alert(1)", "data:image/png,abc", "captura.png?token=oculto", "captura.png#fragmento", "captura\u0000.png", ""]) {
    const html = renderBaselineIncidentsHTML([{ name: "Caso", actual: "Fallo", image }]);
    assert.equal(html.includes("<img"), false, image);
    assert.match(html, /El script de línea de base no guardó captura individual/u);
  }
  assert.match(renderBaselineIncidentsHTML([{ name: "Caso", actual: "Fallo", image: "carpeta\\captura.png" }]), /src="carpeta\/captura\.png"/u);
});
