import assert from "node:assert/strict";
import { test } from "node:test";
import { aggregateStatus, renderCompleteReport, summarizeCases } from "./e2e-completo-informe.mjs";

const result = (width, status, extra = {}) => ({ width, status, actual: `Resultado ${width}`, ...extra });
const caseOf = (id, results, extra = {}) => ({ id, area: "Identidad", actor: "Visitante", action: "Ingresar", route: "/login", expected: "Acceso correcto", results, ...extra });
const reportOf = (cases, extra = {}) => ({ date: "2026-10-20", commits: { back: "abc", front: "def" }, environment: "Local aislado", baseline: [], cases, ...extra });

test("un reintento conserva visible el incidente anterior sin cambiar su resultado actual", () => {
  const html = renderCompleteReport(reportOf([caseOf("reanudado", [result(1440, "passed", { previousAttempts: [{ status: "failed", actual: "Pantalla blanca <script>", reason: "Aislamiento del informe", image: "intento-1.png" }] }), result(390, "passed")])]));
  assert.match(html, /data-case-id="reanudado"[^>]*data-status="passed"/);
  assert.ok(html.includes("Intentos anteriores"));
  assert.ok(html.includes("Pantalla blanca &lt;script&gt;"));
  assert.ok(html.includes('src="intento-1.png"'));
});

test("el fallo gana, luego el bloqueo y luego lo manual; sólo los dos anchos aprobados pasan", () => {
  assert.equal(aggregateStatus([result(1440, "passed"), result(390, "passed")]), "passed");
  assert.equal(aggregateStatus([result(1440, "failed"), result(390, "blocked")]), "failed");
  assert.equal(aggregateStatus([result(1440, "manual"), result(390, "blocked")]), "blocked");
  assert.equal(aggregateStatus([result(1440, "manual"), result(390, "passed")]), "manual");
  assert.equal(aggregateStatus([result(1440, "manual"), result(390, "manual")]), "manual");
});

test("un caso sin correr, incompleto o con estado desconocido queda bloqueado", () => {
  for (const results of [undefined, [], [result(1440, "passed")], [result(1440, "passed"), result(1440, "passed")], [result(1440, "passed"), result(390, "pending")]]) {
    assert.equal(aggregateStatus(results), "blocked");
  }
});

test("los totales separan casos de comprobaciones y cuentan los anchos que faltan como bloqueados", () => {
  const cases = [
    caseOf("ok", [result(1440, "passed"), result(390, "passed")]),
    caseOf("falla", [result(1440, "passed"), result(390, "failed")]),
    caseOf("manual", [result(1440, "manual"), result(390, "manual")]),
    caseOf("parcial", [result(1440, "passed")]),
    caseOf("pendiente", []),
  ];
  assert.deepEqual(summarizeCases(cases), {
    total: 5, passed: 1, failed: 1, blocked: 2, manual: 1,
    checks: { total: 10, passed: 4, failed: 1, blocked: 3, manual: 2 },
  });
});

test("cada caso muestra actor, acción, ruta, esperado y ambos anchos con falta de evidencia explícita", () => {
  const html = renderCompleteReport(reportOf([caseOf("incompleto", [result(1440, "passed", { image: "capturas/ingreso.png" })]) ]));
  for (const value of ["Visitante", "Ingresar", "/login", "Acceso correcto", "1440 px", "390 px", "Resultado 1440", "No se ejecutó la comprobación de 390 px.", "Sin captura:", 'href="capturas/ingreso.png"', 'src="capturas/ingreso.png"']) assert.ok(html.includes(value), value);
  assert.match(html, /data-case-id="incompleto"[^>]*data-status="blocked"/);
  assert.match(html, /Casos<\/th>[\s\S]*?Comprobaciones/);
});

test("los casos manuales explican la dependencia y no se aprueban por tener capturas", () => {
  const html = renderCompleteReport(reportOf([caseOf("google", [result(1440, "manual"), result(390, "manual")], { manualReason: "Requiere una cuenta real de Google." })], { screens: [{ title: "Google", image: "capturas/google.png", width: 1440 }] }));
  assert.match(html, /data-case-id="google"[^>]*data-status="manual"/);
  assert.ok(html.includes("Requiere una cuenta real de Google."));
  assert.ok(html.includes("A mano"));
  assert.ok(html.includes("capturas/google.png"));
});

test("el HTML escapa todos los textos y admite sólo enlaces relativos seguros", () => {
  const unsafe = '<script>alert("x")</script>&\'';
  const html = renderCompleteReport(reportOf([caseOf(unsafe, [result(1440, "failed", { image: 'javascript:alert(1)', actual: unsafe, probableArea: unsafe, reproduce: [unsafe], severity: unsafe }), result(390, "passed", { image: 'capturas/a" onclick="boom.png' })], { actor: unsafe, action: unsafe, route: unsafe, expected: unsafe, area: unsafe, source: unsafe, existingScripts: [unsafe], manualReason: unsafe })], {
    date: unsafe, commits: { back: unsafe }, environment: { host: unsafe }, baseline: [{ source: unsafe, summary: unsafe }], failure: unsafe,
    screens: [{ title: unsafe, image: "https://externo.example/captura.png" }, { title: "local", image: "//externo.example/captura.png" }],
  }));
  assert.equal(html.includes("<script>"), false);
  assert.equal(html.includes('src="javascript:'), false);
  assert.equal(html.includes('src="https:'), false);
  assert.equal(html.includes('src="//'), false);
  assert.equal(html.includes(' onclick="'), false);
  assert.ok(html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;"));
  assert.ok(html.includes('capturas/a&quot; onclick=&quot;boom.png'));
  assert.ok(html.includes("La ruta de la captura no es relativa y segura."));
});

test("la línea de base conserva objetos en una tabla de fuente y resumen", () => {
  const html = renderCompleteReport(reportOf([], { baseline: { e2e: { source: "npm run test:e2e:real", summary: "55/55", status: "passed", report: "../base/index.html" }, recorrido: { source: "node scripts/recorrido-usuario.mjs", summary: "196/196", status: "failed" } } }));
  for (const value of ["Línea de base", "Fuente", "Resumen", "npm run test:e2e:real", "55/55", "node scripts/recorrido-usuario.mjs", "196/196", "../base/index.html"]) assert.ok(html.includes(value), value);
});

test("las capturas rechazan rutas absolutas, controles y protocolos y conservan rutas relativas", () => {
  for (const image of ["/captura.png", "C:\\captura.png", "\\\\equipo\\captura.png", "captura\u0000.png", "data:image/png;base64,a", "file:///captura.png"]) {
    const html = renderCompleteReport(reportOf([caseOf("ruta", [result(1440, "passed", { image }), result(390, "manual")])]));
    assert.equal(html.includes("<img"), false, image);
  }
  const html = renderCompleteReport(reportOf([caseOf("ruta", [result(1440, "passed", { image: "capturas\\compu.png" }), result(390, "manual")])]));
  assert.ok(html.includes('src="capturas/compu.png"'));
});

test("las fallas finales se ordenan por gravedad y traen reproducción, captura, área y ruta", () => {
  const cases = ["low", "critical", "medium", "high"].map((severity) => caseOf(severity, [result(1440, "failed", { severity, reproduce: [`Paso ${severity}`], image: `${severity}.png`, probableArea: "back" }), result(390, "passed")], { route: `/ruta/${severity}` }));
  const html = renderCompleteReport(reportOf(cases));
  const failures = html.slice(html.indexOf('id="fallas"'));
  assert.ok(failures.indexOf('data-severity="critical"') < failures.indexOf('data-severity="high"'));
  assert.ok(failures.indexOf('data-severity="high"') < failures.indexOf('data-severity="medium"'));
  assert.ok(failures.indexOf('data-severity="medium"') < failures.indexOf('data-severity="low"'));
  for (const value of ["Paso critical", 'src="critical.png"', "back", "/ruta/critical", "1440 px"]) assert.ok(failures.includes(value), value);
});
