import { renderBaselineIncidentsHTML } from "./e2e-completo-incidentes.mjs";

const widths = [1440, 390];
const statusLabels = { passed: "Pasó", failed: "Falló", blocked: "Bloqueado", manual: "A mano" };
const statusOrder = ["failed", "blocked", "manual", "passed"];
const severityOrder = ["critical", "high", "medium", "low"];
const severityLabels = { critical: "Crítica", high: "Alta", medium: "Media", low: "Baja" };

function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function describe(value, fallback = "Sin dato registrado.") {
  if (value == null || value === "") return fallback;
  return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
}

function statusOf(result) {
  return Object.hasOwn(statusLabels, result?.status) ? result.status : "blocked";
}

function strongestStatus(results) {
  return statusOrder.find((status) => results.some((result) => statusOf(result) === status)) ?? "blocked";
}

function resultsByWidth(results) {
  return widths.map((width) => {
    const matches = (Array.isArray(results) ? results : []).filter((result) => result?.width === width);
    if (!matches.length) return { width, status: "blocked", actual: `No se ejecutó la comprobación de ${width} px.` };
    const status = strongestStatus(matches);
    const selected = matches.find((result) => statusOf(result) === status);
    return { ...selected, width, status, actual: describe(selected.actual, "No se registró el resultado real de la comprobación.") };
  });
}

export function aggregateStatus(results) {
  const recorded = Array.isArray(results) ? results : [];
  return strongestStatus([...recorded, ...resultsByWidth(recorded)]);
}

function emptyCounts() {
  return { total: 0, passed: 0, failed: 0, blocked: 0, manual: 0 };
}

export function summarizeCases(cases = []) {
  const summary = { ...emptyCounts(), checks: emptyCounts() };
  for (const item of cases) {
    summary.total++;
    summary[aggregateStatus(item.results)]++;
    for (const result of resultsByWidth(item.results)) {
      summary.checks.total++;
      summary.checks[result.status]++;
    }
  }
  return summary;
}

function badge(status) {
  const safeStatus = statusOf({ status });
  return `<span class="status ${safeStatus}">${statusLabels[safeStatus]}</span>`;
}

function relativePath(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const path = value.trim();
  if ([...path].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || /^[\\/]|^[a-z][a-z0-9+.-]*:/i.test(path)) return null;
  return path.replaceAll("\\", "/");
}

function capture(image, label, reason) {
  const path = relativePath(image);
  if (path) return `<a class="capture" href="${escape(path)}"><img src="${escape(path)}" alt="${escape(label)}" loading="lazy"></a>`;
  const missing = image ? "La ruta de la captura no es relativa y segura." : describe(reason, "No se adjuntó una captura a esta comprobación.");
  return `<p class="missing">Sin captura: ${escape(missing)}</p>`;
}

function summaryTable(summary) {
  const row = (label, counts) => `<tr><th scope="row">${label}</th><td>${counts.total}</td>${["passed", "failed", "blocked", "manual"].map((status) => `<td>${counts[status]}</td>`).join("")}</tr>`;
  return `<table><caption>Casos y comprobaciones por ancho</caption><thead><tr><th scope="col">Unidad</th><th scope="col">Total</th>${["passed", "failed", "blocked", "manual"].map((status) => `<th scope="col">${badge(status)}</th>`).join("")}</tr></thead><tbody>${row("Casos", summary)}${row("Comprobaciones", summary.checks)}</tbody></table><p>Un caso pasa sólo si las comprobaciones de 1440 y 390 px pasaron. Un ancho sin ejecutar cuenta como Bloqueado. Las capturas y los scripts previos no aprueban casos por sí solos.</p>`;
}

function baselineRows(baseline) {
  if (Array.isArray(baseline)) return baseline.map((value, index) => [String(index + 1), value]);
  if (baseline && typeof baseline === "object") {
    return ["source", "summary", "command", "script"].some((key) => Object.hasOwn(baseline, key)) ? [["Línea de base", baseline]] : Object.entries(baseline);
  }
  return baseline ? [["Línea de base", baseline]] : [];
}

function renderBaseline(baseline) {
  const rows = baselineRows(baseline);
  if (!rows.length) return `<section><h2>Línea de base</h2><p>No se registraron resultados de la línea de base.</p></section>`;
  return `<section><h2>Línea de base</h2><table><thead><tr><th scope="col">Fuente</th><th scope="col">Resumen</th></tr></thead><tbody>${rows.map(([key, value]) => {
    const object = value && typeof value === "object" ? value : {};
    const source = object.source ?? object.command ?? object.script ?? key;
    const link = relativePath(object.report ?? object.image);
    return `<tr><th scope="row">${escape(describe(source))}</th><td>${object.status ? badge(object.status) : ""}<pre>${escape(describe(value))}</pre>${link ? `<a href="${escape(link)}">Ver evidencia de base</a>` : ""}</td></tr>`;
  }).join("")}</tbody></table><p>La línea de base se conserva como antecedente; cada caso necesita sus propias comprobaciones.</p></section>`;
}

function renderCase(item, index) {
  const status = aggregateStatus(item.results);
  return `<section id="caso-${index}" data-case-id="${escape(item.id)}" data-status="${status}"><h2>${escape(item.id)} · ${escape(item.action)} ${badge(status)}</h2><dl><dt>Área / pantalla</dt><dd>${escape(describe(item.area))}</dd><dt>Quién</dt><dd>${escape(describe(item.actor))}</dd><dt>Qué</dt><dd>${escape(describe(item.action))}</dd><dt>Ruta</dt><dd><code>${escape(describe(item.route))}</code></dd><dt>Esperado</dt><dd>${escape(describe(item.expected))}</dd>${item.source ? `<dt>Fuente</dt><dd><pre>${escape(describe(item.source))}</pre></dd>` : ""}<dt>Cobertura previa</dt><dd><pre>${escape(describe(item.existingScripts, "Caso nuevo o sin script previo identificado."))}</pre></dd></dl>${item.manualReason ? `<p><strong>A mano:</strong> ${escape(describe(item.manualReason))}</p>` : ""}<div class="pair">${resultsByWidth(item.results).map((result) => `<article data-width="${result.width}"><h3>${result.width} px · ${badge(result.status)}</h3><p><strong>Lo que pasó:</strong> ${escape(result.actual)}</p>${result.currentRoute ? `<p><strong>Ruta observada:</strong> <code>${escape((result.currentHost ?? "") + result.currentRoute)}</code></p>` : ""}${capture(result.image, `${item.id} · ${result.width} px`, item.manualReason ?? result.actual)}${renderAttempts(result)}</article>`).join("")}</div></section>`;
}

function renderAttempts(result) {
  if (!result.previousAttempts?.length) return "";
  return `<details><summary>Intentos anteriores</summary>${result.previousAttempts.map((attempt) => `<p>${badge(attempt.status)} ${escape(attempt.actual)} · ${escape(attempt.reason)}</p>${attempt.image ? capture(attempt.image, "Captura del intento anterior", attempt.actual) : ""}`).join("")}</details>`;
}

function renderFailures(cases) {
  const failures = cases.flatMap((item) => resultsByWidth(item.results).filter((result) => result.status === "failed").map((result) => ({ item, result })));
  const rank = (severity) => severityOrder.includes(severity) ? severityOrder.indexOf(severity) : severityOrder.length;
  failures.sort((left, right) => rank(left.result.severity) - rank(right.result.severity));
  return `<section id="fallas"><h2>Fallas por gravedad</h2>${failures.length ? failures.map(({ item, result }) => {
    const severity = severityOrder.includes(result.severity) ? result.severity : "unrated";
    const steps = Array.isArray(result.reproduce) ? result.reproduce : [];
    return `<article class="failure" data-severity="${severity}"><h3>${severityLabels[severity] ?? "Sin clasificar"} · ${escape(item.id)} · ${result.width} px</h3><p><strong>Quién / acción:</strong> ${escape(describe(item.actor))} · ${escape(describe(item.action))}</p><p><strong>Área probable:</strong> ${escape(describe(result.probableArea, "Sin determinar."))} · <strong>Pantalla:</strong> ${escape(describe(item.area))} · <strong>Ruta:</strong> <code>${escape(describe(item.route))}</code></p><p><strong>Esperado:</strong> ${escape(describe(item.expected))}</p><p><strong>Lo que pasó:</strong> ${escape(result.actual)}</p><h4>Cómo reproducir</h4>${steps.length ? `<ol>${steps.map((step) => `<li>${escape(describe(step))}</li>`).join("")}</ol>` : `<p>No se registraron pasos de reproducción.</p>`}${capture(result.image, `${item.id} · falla a ${result.width} px`, result.actual)}</article>`;
  }).join("") : `<p>No hay fallas registradas. Los casos bloqueados o a mano siguen pendientes.</p>`}</section>`;
}

function renderScreens(screens) {
  if (!Array.isArray(screens) || !screens.length) return "";
  return `<section><h2>Capturas complementarias</h2><p>Estas capturas no cambian el resultado de los casos.</p><div class="pair">${screens.map((screen, index) => {
    const item = typeof screen === "string" ? { image: screen } : screen ?? {};
    const title = item.title ?? item.id ?? `Captura ${index + 1}`;
    return `<article><h3>${escape(title)}${item.width ? ` · ${escape(item.width)} px` : ""}</h3>${capture(item.image ?? item.path, title, item.actual ?? item.reason)}</article>`;
  }).join("")}</div></section>`;
}

export function renderCompleteReport(report) {
  const cases = Array.isArray(report.cases) ? report.cases : [];
  const summary = summarizeCases(cases);
  const executions = Array.isArray(report.executions) ? report.executions : [];
  const executionEvidence = executions.length ? `<section id="comprobaciones"><h2>Comprobaciones directas</h2><p>La matriz enlaza estas comprobaciones por su ID. Sus totales se muestran separados para no contar dos veces una acción.</p>${summaryTable(summarizeCases(executions))}</section>${executions.map((item, index) => renderCase(item, `ejecucion-${index}`)).join("")}` : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Prueba completa · ${escape(report.date)}</title><style>
body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#f3f5f7;color:#192630}header,main{max-width:1440px;margin:auto;padding:24px}section{background:#fff;border:1px solid #cbd3d9;border-radius:10px;padding:24px;margin:24px 0}h1,h2,h3{line-height:1.3}h2{margin-top:0}a{color:#174b80}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd3d9;padding:10px;text-align:left;vertical-align:top}caption{text-align:left;font-weight:700;margin-bottom:8px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;margin:0}code{overflow-wrap:anywhere}dt{font-weight:700}dd{margin:0 0 10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}.pair article{min-width:0}.status{display:inline-block;border-radius:5px;padding:2px 8px;font-size:14px;white-space:nowrap}.passed{color:#145c35;background:#d9f3e2}.failed{color:#8e1627;background:#ffe0e6}.blocked{color:#744900;background:#fff0c2}.manual{color:#29459a;background:#e7ecff}.missing{padding:12px;border:1px dashed #9aa7b1;background:#f5f7f9}.capture img{display:block;width:100%;height:auto;border:1px solid #cbd3d9}.failure{border-top:1px solid #cbd3d9;padding-top:16px;margin-top:24px}.failure img{max-width:900px}nav{display:flex;flex-wrap:wrap;gap:8px 16px}@media(max-width:760px){header,main{padding:12px}section{padding:16px}.pair{grid-template-columns:1fr}table{font-size:13px}th,td{padding:5px}}
</style></head><body><header><h1>Prueba completa del sistema</h1><p>${escape(describe(report.date))}</p>${summaryTable(summary)}<details><summary>Commits y entorno</summary><h2>Commits</h2><pre>${escape(describe(report.commits))}</pre><h2>Entorno</h2><pre>${escape(describe(report.environment))}</pre></details><nav aria-label="Casos">${cases.map((item, index) => `<a href="#caso-${index}">${escape(item.id)}</a>`).join("")}<a href="#comprobaciones">Comprobaciones directas</a><a href="#fallas">Fallas por gravedad</a></nav></header><main>${renderBaseline(report.baseline)}${report.failure ? `<section><h2>Interrupción de la ejecución</h2><pre>${escape(describe(report.failure))}</pre><p>Los pasos sin resultado quedan bloqueados.</p></section>` : ""}${cases.map(renderCase).join("")}${executionEvidence}${renderScreens(report.screens)}${renderFailures([...cases, ...executions.filter((entry) => !cases.some((item) => item.proofIds?.includes(entry.id)))])}${renderBaselineIncidentsHTML(report.baselineFunctionalIncidents)}</main></body></html>`;
}
