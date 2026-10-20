import { safeEvidenceText } from "./e2e-completo-matriz.mjs";
import { stripVTControlCharacters } from "node:util";

const captureReason = "El script de línea de base no guardó captura individual";
const severities = ["critical", "high", "medium", "low"];
const severityLabels = { critical: "Crítica", high: "Alta", medium: "Media", low: "Baja" };

function safeText(value) {
  return safeEvidenceText(stripVTControlCharacters(String(value ?? "")))
    // oxlint-disable-next-line no-control-regex -- Excluir controles de rutas al quitar consultas y fragmentos.
    .replace(/(\/[^\u0000-\u0020"'<>?#]*)(?:\?[^\s"'<>#]*)?(?:#[^\s"'<>]*)?/gu, "$1")
    .replace(/\b[A-Z0-9]{4}-[A-Z0-9]{4}\b/gu, "[código de recuperación]");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function escape(value) {
  return escapeHTML(safeText(value));
}

function renderCapture(incident) {
  const image = typeof incident.image === "string" ? incident.image.trim() : "";
  const unsafe = [...image].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    || /^[\\/]|^[a-z][a-z0-9+.-]*:/iu.test(image) || /[?#]/u.test(image);
  if (!image || unsafe) return `<p class="missing">${captureReason}.</p>`;
  const relative = escapeHTML(image.replaceAll("\\", "/"));
  return `<a class="capture" href="${relative}"><img src="${relative}" alt="Captura real de ${escape(incident.name)}" loading="lazy"></a>`;
}

function renderIncident(incident) {
  const analysis = typeof incident.analysis === "object" && incident.analysis !== null ? JSON.stringify(incident.analysis, null, 2) : incident.analysis;
  const actor = typeof incident.actor === "string" && incident.actor.trim() ? incident.actor : "El script de línea de base no registró el actor por separado.";
  const expected = typeof incident.expected === "string" && incident.expected.trim() ? incident.expected : "El script de línea de base no registró el resultado esperado por separado.";
  return `<article class="case failed"><h3>${escape(incident.name)}</h3><p>Gravedad: ${escape(severityLabels[incident.severity] ?? "Alta")}</p>
<dl><dt>Quién</dt><dd>${escape(actor)}</dd><dt>Acción y etapa de reproducción</dt><dd>${escape(incident.action ?? incident.stage)}</dd><dt>Esperado</dt><dd>${escape(expected)}</dd><dt>Resultado real</dt><dd>${escape(incident.actual)}</dd>
<dt>Área informada</dt><dd>${escape(incident.area || "Sin determinar por el script")}</dd><dt>Ruta informada</dt><dd>${escape(incident.route || "Sin determinar por el script")}</dd>
${analysis ? `<dt>Análisis posterior</dt><dd>${escape(analysis)}</dd>` : ""}</dl>${renderCapture(incident)}
<ol>${(incident.reproduce ?? []).map((step) => `<li>${escape(step)}</li>`).join("")}</ol><pre>${escape(incident.command)}</pre></article>`;
}

/** Sólo incidentes funcionales del log recibido; no interpreta TAP ni aprueba filas de la matriz. */
export function parseFunctionalBaselineIncidents(log) {
  const incidents = [];
  const seen = new Set();
  for (const raw of String(log ?? "").split(/\r?\n/u)) {
    // Primero separar las comillas del paso: una URL no debe consumir su cierre al sanearla.
    const line = stripVTControlCharacters(raw).trim().replace(/^Error:\s*/u, "");
    const match = /^(.+): falló en [“"]([^”"]+)[”"](.*)$/u.exec(line);
    if (!match || seen.has(line)) continue;
    seen.add(line);
    const [name, stage, detail] = match.slice(1).map(safeText);
    // El runner separa filtros por comas: usar el tramo más específico conserva un solo filtro.
    const caseFilter = name.split(",").map((part) => part.trim()).sort((left, right) => right.length - left.length)[0];
    const incident = {
      name, action: stage, stage, actual: detail.trim() || "El script informó el fallo sin detalle adicional.", severity: "high",
      caseFilter,
      command: `$env:MT_E2E_ONLY_CASE = '${caseFilter.replaceAll("'", "''")}'\nnode --test --test-name-pattern='^registro real' scripts/e2e-completo-linea-base.mjs`,
      reproduce: ["Desde el repositorio del front, ejecutar el comando en un entorno aislado.", `Seguir el grupo ${name} hasta el paso: ${stage}.`],
      captureReason,
    };
    const route = /\bruta actual\s+([^\s;,)}]+)/iu.exec(detail)?.[1]?.replace(/\.+$/u, "");
    const area = /(?:^|[\s;])(?:área|area)(?: probable)?\s*[:=]\s*([^;,)}\]]+)/iu.exec(detail)?.[1]?.trim();
    if (route) incident.route = route;
    if (area) incident.area = area;
    incidents.push(incident);
  }
  return incidents;
}

/** Se agrega al final del informe; no tiene capturas, anchos ni resultados heredados de otro caso. */
export function renderBaselineIncidentsHTML(incidents = []) {
  if (!incidents.length) return "";
  const ordered = [...incidents].sort((left, right) => {
    const rank = (incident) => { const index = severities.indexOf(incident.severity); return index < 0 ? 1 : index; };
    return rank(left) - rank(right);
  });
  return `<section class="baseline-incidents"><h2>Incidentes de la línea de base</h2><p>Se conservan como incidentes individuales, sin aprobar ni cambiar los totales de la matriz. Ancho no registrado por separado.</p>${ordered.map(renderIncident).join("")}</section>`;
}
