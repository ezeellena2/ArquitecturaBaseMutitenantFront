// node scripts/e2e-completo.mjs [--inventory-only] [--suite=personal,negocio,plataforma] [--no-build]
// Primero correr npm run test:e2e:real y node scripts/recorrido-usuario.mjs.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile, copyFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { createEnvironment, baseUrl } from "./recorrido-usuario-entorno.mjs";
import { journeyDate, safeDiagnostic } from "./recorrido-usuario.mjs";
import { factorSecretMasks } from "./recorrido-usuario-e9.mjs";
import { renderCompleteReport, summarizeCases } from "./e2e-completo-informe.mjs";
import { normalizeCaseAreas } from "./e2e-completo-areas.mjs";
import { mobileBarPlans } from "./e2e-completo-acciones-moviles.mjs";
import { annotateCaptureDimensions } from "./e2e-completo-capturas.mjs";
import { createScriptScanFence } from "./e2e-completo-filtro-tailwind.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { screens, guidedCases, existingScriptCases, inventoryMetadata } from "./e2e-completo-inventario-front.mjs";
import { buildMatrix, importedJourneySteps, parseTapSummary, safeEvidenceText } from "./e2e-completo-matriz.mjs";
import { createBrowserSupport, viewportOf } from "./e2e-completo-soporte.mjs";
import { applyAdditionalCoverage } from "./e2e-completo-cobertura.mjs";
import { parseFunctionalBaselineIncidents } from "./e2e-completo-incidentes.mjs";
import { enrichBaselineIncidents, enrichExecutionFailures } from "./e2e-completo-triage.mjs";
import { verificationLimitations } from "./e2e-completo-limitaciones.mjs";
import { enrichOriginalExecutions } from "./e2e-completo-metadatos-base.mjs";
import { securitySupplementProofGroups } from "./e2e-completo-seguridad-complemento.mjs";
import { assistantSupplementProofGroups } from "./e2e-completo-asistente-complemento.mjs";
import { legalSupplementProofGroups } from "./e2e-completo-legales-complemento.mjs";
import { organizationSupplementProofGroups } from "./e2e-completo-organizaciones-complemento.mjs";
import { identitySupplementProofGroups } from "./e2e-completo-identidad-complemento.mjs";
import { contractSupplementProofGroups } from "./e2e-completo-contrato-complemento.mjs";
import { supplementPlatformProofGroups } from "./e2e-completo-plataforma-complemento.mjs";
import { localClosureProofGroups } from "./e2e-completo-cierre-local.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const execute = promisify(execFile);
const suiteSpecs = {
  continuacion: ["./e2e-completo-continuacion.mjs", "continuationDefinitions", "runContinuationCases"],
  personal: ["./e2e-completo-personal.mjs", "personalDefinitions", "runPersonalCases"],
  negocio: ["./e2e-completo-negocio.mjs", "businessDefinitions", "runBusinessCases"],
  plataforma: ["./e2e-completo-plataforma.mjs", "platformDefinitions", "runPlatformCases"],
  politicas: ["./e2e-completo-politicas.mjs", "policyDefinitions", "runPolicyCases"],
  modulos: ["./e2e-completo-modulos.mjs", "moduleDefinitions", "runModuleCases"],
  negocioextra: ["./e2e-completo-negocio-complemento.mjs", "supplementBusinessDefinitions", "runSupplementBusinessCases"],
  plataformaextra: ["./e2e-completo-plataforma-complemento.mjs", "supplementPlatformDefinitions", "runSupplementPlatformCases"],
  whatsappextra: ["./e2e-completo-whatsapp-complemento.mjs", "supplementWhatsAppDefinitions", "runSupplementWhatsAppCases"],
  baselinewhatsapp: ["./e2e-completo-fases-baseline.mjs", "baselineWhatsAppDefinitions", "runBaselineWhatsAppCases"],
  baselineasistente: ["./e2e-completo-fases-baseline.mjs", "baselineAssistantDefinitions", "runBaselineAssistantCases"],
  baselineorgwa: ["./e2e-completo-fases-baseline.mjs", "baselineOrganizationWhatsAppDefinitions", "runBaselineOrganizationWhatsAppCases"],
  baselineseguridad: ["./e2e-completo-fases-baseline.mjs", "baselineSecurityDefinitions", "runBaselineSecurityCases"],
  politicasarreglos: ["./e2e-completo-politicas.mjs", "closedPolicyRepairDefinitions", "runClosedPolicyRepairCases"],
  modulosarreglos: ["./e2e-completo-modulos.mjs", "moduleAccessRepairDefinitions", "runModuleAccessRepairCases"],
  publicoextra: ["./e2e-completo-publico-complemento.mjs", "publicSupplementDefinitions", "runPublicSupplementCases"],
  publicoauditoriaarreglo: ["./e2e-completo-publico-complemento.mjs", "publicAuditRepairDefinitions", "runPublicAuditRepairCases"],
  identidadextra: ["./e2e-completo-identidad-complemento.mjs", "identitySupplementDefinitions", "runIdentitySupplementCases"],
  negocioarreglos: ["./e2e-completo-negocio.mjs", "businessRepairDefinitions", "runBusinessRepairCases"],
  plataformaarreglos: ["./e2e-completo-plataforma.mjs", "platformRepairDefinitions", "runPlatformRepairCases"],
  negocioinicioarreglo: ["./e2e-completo-negocio-complemento.mjs", "businessHomeRepairDefinitions", "runBusinessHomeRepairCases"],
  negociofiltrosarreglos: ["./e2e-completo-negocio-complemento.mjs", "businessFilterRepairDefinitions", "runBusinessFilterRepairCases"],
  dominioextra: ["./e2e-completo-dominio-complemento.mjs", "domainSupplementDefinitions", "runDomainSupplementCases"],
  dominiopendientesarreglo: ["./e2e-completo-dominio-complemento.mjs", "domainPendingRepairDefinitions", "runDomainPendingRepairCases"],
  rolesextra: ["./e2e-completo-roles-complemento.mjs", "roleSupplementDefinitions", "runRoleSupplementCases"],
  seguridadextra: ["./e2e-completo-seguridad-complemento.mjs", "securitySupplementDefinitions", "runSecuritySupplementCases"],
  contratoextra: ["./e2e-completo-contrato-complemento.mjs", "contractSharedDefinitions", "runContractSupplementCases"],
  cuotacontrato: ["./e2e-completo-contrato-complemento.mjs", "contractQuotaRepairDefinitions", "runContractQuotaRepairCases"],
  contratotransportearreglos: ["./e2e-completo-contrato-complemento.mjs", "contractTransportRepairDefinitions", "runContractTransportRepairCases"],
  contratoabandonoarreglo: ["./e2e-completo-contrato-complemento.mjs", "contractAbandonmentRepairDefinitions", "runContractAbandonmentRepairCases"],
  asistenteextra: ["./e2e-completo-asistente-complemento.mjs", "assistantSupplementDefinitions", "runAssistantSupplementCases"],
  whatsappplataformaextra: ["./e2e-completo-whatsapp-plataforma.mjs", "platformWhatsAppDefinitions", "runPlatformWhatsAppCases"],
  legalesextra: ["./e2e-completo-legales-complemento.mjs", "legalSupplementDefinitions", "runLegalSupplementCases"],
  configuracionplataformaextra: ["./e2e-completo-configuracion-plataforma.mjs", "platformConfigurationDefinitions", "runPlatformConfigurationCases"],
  organizacionesextra: ["./e2e-completo-organizaciones-complemento.mjs", "organizationSupplementDefinitions", "runOrganizationSupplementCases"],
  plataformasesionarreglos: ["./e2e-completo-plataforma.mjs", "platformSessionRepairDefinitions", "runPlatformSessionRepairCases"],
  cierrelocal: ["./e2e-completo-cierre-local.mjs", "localClosureDefinitions", "runLocalClosureCases"],
  cuotawhatsapp: ["./e2e-completo-cuota-whatsapp.mjs", "quotaWhatsAppDefinitions", "runQuotaWhatsAppCases"],
  negocioaccesosarreglos: ["./e2e-completo-negocio.mjs", "businessAccessRepairDefinitions", "runBusinessAccessRepairCases"],
  negociopendientesarreglo: ["./e2e-completo-negocio.mjs", "businessAccessPendingRepairDefinitions", "runBusinessAccessPendingRepairCases"],
  negocioempresarolesarreglo: ["./e2e-completo-negocio.mjs", "businessCompanyRoleRepairDefinitions", "runBusinessCompanyRoleRepairCases"],
  plataformainvitacionarreglos: ["./e2e-completo-plataforma-complemento.mjs", "platformOperatorInvitationRepairDefinitions", "runPlatformOperatorInvitationRepairCases"],
  plataformaaprobacionarreglos: ["./e2e-completo-plataforma-complemento.mjs", "platformApprovalRepairDefinitions", "runPlatformApprovalRepairCases"],
  plataformabajaarreglos: ["./e2e-completo-plataforma-complemento.mjs", "platformAccountLifecycleRepairDefinitions", "runPlatformAccountLifecycleRepairCases"],
  plataformarecuperacionarreglo: ["./e2e-completo-plataforma-complemento.mjs", "platformOccupiedRecoveryRepairDefinitions", "runPlatformOccupiedRecoveryRepairCases"],
  seguridadpermisosarreglo: ["./e2e-completo-seguridad-complemento.mjs", "securityStepUpRepairDefinitions", "runSecurityStepUpRepairCases"],
  organizacionesarreglos: ["./e2e-completo-organizaciones-complemento.mjs", "organizationRepairDefinitions", "runOrganizationRepairCases"],
  organizacionesestadoarreglo: ["./e2e-completo-organizaciones-complemento.mjs", "organizationStateRepairDefinitions", "runOrganizationStateRepairCases"],
  asistentepreparacionarreglos: ["./e2e-completo-asistente-complemento.mjs", "assistantPreparationRepairDefinitions", "runAssistantPreparationRepairCases"],
  asistenteoperadorarreglo: ["./e2e-completo-asistente-complemento.mjs", "assistantOperatorRepairDefinitions", "runAssistantOperatorRepairCases"],
  asistenteborradoarreglo: ["./e2e-completo-asistente-complemento.mjs", "assistantAttachmentRepairDefinitions", "runAssistantAttachmentRepairCases"],
  whatsappatencionarreglos: ["./e2e-completo-whatsapp-complemento.mjs", "supplementWhatsAppRepairDefinitions", "runSupplementWhatsAppRepairCases"],
  whatsappmensajesarreglo: ["./e2e-completo-whatsapp-complemento.mjs", "supplementWhatsAppTakeRepairDefinitions", "runSupplementWhatsAppTakeRepairCases"],
  whatsappgestionarreglo: ["./e2e-completo-whatsapp-plataforma.mjs", "platformWhatsAppManagementRepairDefinitions", "runPlatformWhatsAppManagementRepairCases"],
  ingresopersonarevisionarreglo: ["./e2e-completo-revision.mjs", "reviewedPersonalDefinitions", "runReviewedPersonalCases"],
  ingresopendienterevisionarreglo: ["./e2e-completo-revision.mjs", "reviewedPendingDefinitions", "runReviewedPendingCases"],
  plataformamovilrevisionarreglo: ["./e2e-completo-revision.mjs", "reviewedPlatformMobileDefinitions", "runReviewedPlatformMobileCases"],
  idempotenciarevisionarreglo: ["./e2e-completo-revision.mjs", "reviewedIdempotencyDefinitions", "runReviewedIdempotencyCases"],
  ...Object.fromEntries(mobileBarPlans.map((plan) => [plan.name, [plan.module, plan.definitionsExport, plan.runExport, plan.definitions]])),
};

export function collectSuiteDefinitions(suites) {
  return [...new Map(suites.flatMap((suite) => suite.definitions.map((entry) => [entry.id, entry]))).values()];
}

export function needsRealExecution(suites, executions, options) {
  if (!options.resume || options.repeatMobileActions) return true;
  return suites.some((suite) => suite.definitions.some((entry) => (options.widths ?? [1440, 390]).some((width) =>
    !executions.find((row) => row.id === entry.id)?.results.some((result) => result.width === width && result.status === "passed"))));
}

/** Conserva la causa de un clic bloqueado sin copiar el HTML ni el contenido del elemento superpuesto. */
export function buildCaseDiagnostic(error, diagnostic) {
  const message = String(error.message ?? error);
  const lines = message.split("\n");
  const intercepted = lines.filter((line) => line.includes("intercepts pointer events")).at(-1);
  const custom = diagnostic?.(error);
  let details = custom ? `${custom} ${lines[0]}` : message;
  if (intercepted) {
    const tag = intercepted.match(/<([a-z0-9-]+)/i)?.[1] ?? "elemento";
    const role = intercepted.match(/\brole="([a-z-]+)"/)?.[1];
    const state = intercepted.match(/\bdata-state="([a-z-]+)"/)?.[1];
    const notification = /data-(?:sonner-toast|title|toast)/.test(intercepted);
    const obstruction = `Obstáculo: ${tag}${role ? ` role=${role}` : ""}${state ? ` (${state})` : ""}${notification ? " de una notificación" : ""} interceptó el clic.`;
    details = [custom, lines[0], lines.find((line) => line.includes("waiting for")), obstruction].filter(Boolean).join(" ");
  }
  return safeEvidenceText(safeDiagnostic(details));
}

/** Las páginas de error de Chrome pueden imprimir el desafío OAuth completo, aun con credenciales sintéticas. */
export async function archivePreviousAttempt({ id, width, prior, output, reason = "Reejecutado tras ajustar aislamiento de informes y preparaciones del arnés; esta prueba no modificó producto." }) {
  let image = prior.image;
  const own = typeof image === "string" && path.dirname(path.resolve(output, image)) === path.resolve(output);
  if (prior.currentHost === "chromewebdata") {
    reason += " Se omitió la captura de error del navegador porque podía mostrar parámetros OAuth del entorno de prueba.";
    if (own && image === `${id}-${width}.png`) {
      try { await unlink(path.join(output, image)); } catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    image = undefined;
  } else if (image && own) {
    const archived = `${id}-${width}-intento-${(prior.previousAttempts?.length ?? 0) + 1}.png`;
    await copyFile(path.join(output, image), path.join(output, archived)); image = archived;
  }
  return { status: prior.status, actual: prior.actual, image, reason };
}

export function parseArguments(args) {
  assert.ok(args.every((value) => ["--inventory-only", "--no-build", "--refresh-only", "--resume", "--repeat-mobile-actions"].includes(value) || /^--suite=[a-z,]+$/.test(value) || /^--width=(1440|390)$/.test(value)), "Argumentos no admitidos.");
  const repeatMobileActions = args.includes("--repeat-mobile-actions");
  const mobileNames = mobileBarPlans.map((plan) => plan.name);
  const suites = args.find((value) => value.startsWith("--suite="))?.slice(8).split(",") ?? (repeatMobileActions ? mobileNames : Object.keys(suiteSpecs).filter((name) => !name.includes("arreglo") && !name.startsWith("baseline") && !["cuotawhatsapp", "cuotacontrato"].includes(name)));
  assert.ok(suites.length > 0 && suites.every((name) => Object.hasOwn(suiteSpecs, name)), "Suite desconocida.");
  const width = args.find((value) => value.startsWith("--width="));
  if (repeatMobileActions) {
    assert.equal(width, "--width=390", "La revalidación de barras sólo admite390 px.");
    assert.ok(args.includes("--resume"), "La revalidación conserva el avance y requiere --resume.");
    assert.ok(suites.every((name) => mobileNames.includes(name)), "La revalidación sólo admite casos del ⋮ de barra.");
    assert.ok(!args.includes("--inventory-only") && !args.includes("--refresh-only"), "La revalidación necesita ejecución real.");
  }
  if (suites.some((name) => ["cuotawhatsapp", "cuotacontrato"].includes(name))) {
    assert.equal(suites.length, 1, "La cuota necesita una suite aislada en un entorno fresco.");
    assert.ok(width, "La cuota requiere un único ancho por entorno fresco.");
  }
  return { inventoryOnly: args.includes("--inventory-only"), refreshOnly: args.includes("--refresh-only"), resume: args.includes("--resume"), build: !args.includes("--no-build"), suites: [...new Set(suites)], ...(repeatMobileActions ? { repeatMobileActions: true } : {}), ...(width ? { widths: [Number(width.slice(8))] } : {}) };
}

/** Los avances no entran al scanner de Tailwind; el HTML se publica con el entorno apagado. */
export async function createReportStore(output, checkpoint) {
  await mkdir(output, { recursive: true });
  await mkdir(checkpoint, { recursive: true });
  await writeFile(path.join(output, ".gitignore"), "*\n!.gitignore\n");
  return {
    async save(report, { publish = false } = {}) {
      await writeFile(path.join(checkpoint, "resultados.json"), `${JSON.stringify(report, null, 2)}\n`);
      if (!publish) return;
      await copyFile(path.join(checkpoint, "resultados.json"), path.join(output, "resultados.json"));
      await writeFile(path.join(output, "matriz.json"), `${JSON.stringify({ inventoryMetadata: report.inventoryMetadata, cases: report.matrix }, null, 2)}\n`);
      await writeFile(path.join(output, "index.html"), renderCompleteReport(report));
    },
  };
}

/** Reconstruir una fixture verde puede descubrir una regresión; nunca la oculta ni repite la escritura fallida. */
export async function reusePassedPreparation({ previous, preserve, blockedReason, action }) {
  if (!preserve || previous?.status !== "passed") return { reused: false };
  if (blockedReason) return { reused: true };
  try { return { reused: true, value: await action() }; }
  catch (error) { return { reused: false, error }; }
}

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
}

export async function main(options = parseArguments([])) {
  const date = journeyDate();
  const output = path.join(root, "docs/design/capturas/e2e-completo", date);
  const checkpoint = path.join(root, ".local/e2e-completo", date);
  const journeyDirectory = path.join(root, "docs/design/capturas/recorrido", date);
  await mkdir(output, { recursive: true });
  const previous = await readJson(path.join(output, "resultados.json"), {});
  const saved = options.resume ? await readJson(path.join(checkpoint, "resultados.json"), previous) : previous;
  const store = await createReportStore(output, checkpoint);
  const journey = await readJson(path.join(journeyDirectory, "resultados.json"), { steps: existingScriptCases.map((item) => ({ ...item, results: [] })) });
  const commits = {};
  for (const [name, cwd] of [["back", path.resolve(root, "../ArquitecturaBaseMutitenant")], ["front", root]]) {
    commits[name] = (await execute("git", ["rev-parse", "HEAD"], { cwd, windowsHide: true })).stdout.trim();
  }
  let e2eLog = "";
  try { e2eLog = await readFile(path.resolve(root, "../ArquitecturaBaseMutitenant/.local/e2e-completo/baseline-e2e.log"), "utf8"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const suites = [];
  if (!options.inventoryOnly) {
    for (const name of options.suites) {
      const [modulePath, definitionsName, runName, selectedDefinitions] = suiteSpecs[name];
      const module = await import(modulePath);
      assert.equal(typeof module[runName], "function", `Runner no disponible: ${runName}.`);
      suites.push({ name, definitions: selectedDefinitions ?? module[definitionsName], run: module[runName] });
    }
  }
  const imported = importedJourneySteps(journey, journeyDirectory, output);
  for (const entry of imported) {
    const prior = saved.executions?.find((item) => item.id === entry.id);
    entry.results = entry.results.map((result) => prior?.results?.find((item) => item.width === result.width && item.continued) ?? result);
  }
  const definitions = collectSuiteDefinitions(suites);
  const selectedIds = new Set(definitions.map((definition) => definition.id));
  const selectedDefinitions = new Map(definitions.map((definition) => [definition.id, definition]));
  const executions = enrichOriginalExecutions([
    ...imported,
    ...(saved.executions ?? []).filter((entry) => !entry.id.startsWith("BASE-") && (!selectedIds.has(entry.id) || options.refreshOnly || options.resume)).map((entry) => ({ ...entry, ...selectedDefinitions.get(entry.id), results: entry.results })),
    ...(!options.refreshOnly ? definitions.filter((item) => !item.id.startsWith("BASE-") && (!options.resume || !saved.executions?.some((entry) => entry.id === item.id))).map((item) => ({ ...item, results: [] })) : []),
  ]);
  const report = { date, commits, startedAtUtc: previous.startedAtUtc ?? new Date().toISOString(),
    environment: { ...previous.environment, cleanup: previous.environment?.cleanup ?? "sin iniciar", browser: "Chrome del sistema, contexto persistente", executionModel: "Lotes secuenciales con un contexto persistente por lote. La cuota diaria usa un entorno nuevo por ancho.", database: "PostgreSQL efímero; pickup .eml y control WhatsApp de Testing", scope: inventoryMetadata.scope },
    baseline: [
      { source: "npm run test:e2e:real", ...parseTapSummary(e2eLog), note: "Salida local en .local/e2e-completo/baseline-e2e.log del back; sin datos sensibles en este informe." },
      { source: "node scripts/recorrido-usuario.mjs --no-build", finished: journey.finished ?? false, cleanup: journey.cleanup ?? "pendiente", report: path.relative(output, path.join(journeyDirectory, "index.html")).replaceAll("\\", "/"), passed: journey.steps.reduce((count, entry) => count + (entry.results ?? []).filter((result) => result.status === "passed").length, 0), total: imported.length * 2, failure: journey.failure },
    ], inventoryMetadata: { ...inventoryMetadata, excludedReferences: screens.filter((screen) => screen.reference).map(({ id, title, source }) => ({ id, title, source, reason: "Lámina de referencia del diseño; no es una pantalla programable." })) }, executions, cases: [], screens: [] };
  for (const name of ["core", "assistant", "whatsapp"]) {
    try {
      const log = await readFile(path.resolve(root, `../ArquitecturaBaseMutitenant/.local/e2e-completo/baseline-e2e-${name}-retry.log`), "utf8");
      report.baseline.push({ source: `Reintento aislado por timeout: ${name}`, ...parseTapSummary(log), reason: "Una única repetición aislada para descartar arranque frío de Vite; la corrida inicial no se oculta." });
    } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  try {
    const log = await readFile(path.resolve(root, "../ArquitecturaBaseMutitenant/.local/e2e-completo/baseline-e2e-core-ajustado.log"), "utf8");
    report.baseline.push({ source: "Núcleo con infraestructura ajustada", ...parseTapSummary(log), reason: "Chrome de sistema, readiness 180 s e informes generados fuera del scanner; mismas comprobaciones originales." });
    report.baselineFunctionalIncidents = enrichBaselineIncidents(parseFunctionalBaselineIncidents(log));
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  const persist = async (publish = false) => {
    const annotatedExecutions = normalizeCaseAreas(enrichExecutionFailures(publish ? await annotateCaptureDimensions(executions, { output }) : executions));
    report.executions = annotatedExecutions;
    const matrix = normalizeCaseAreas(buildMatrix({ backend: backendUseCases, guided: guidedCases, screens, executions: applyAdditionalCoverage(annotatedExecutions), verificationLimitations, additionalProofGroups: { ...securitySupplementProofGroups, ...assistantSupplementProofGroups, ...legalSupplementProofGroups, ...organizationSupplementProofGroups, ...identitySupplementProofGroups, ...contractSupplementProofGroups, ...supplementPlatformProofGroups, ...localClosureProofGroups } }));
    report.matrix = matrix;
    report.cases = matrix;
    report.summary = summarizeCases(report.cases);
    report.executionSummary = summarizeCases(executions);
    report.matrixSummary = summarizeCases(matrix);
    await store.save(report, { publish });
  };
  await persist(options.inventoryOnly || options.refreshOnly);
  if (options.inventoryOnly || options.refreshOnly) {
    console.info(`Matriz: ${report.matrix.length} casos; informe: ${path.join(output, "index.html")}`);
    return report;
  }
  if (!needsRealExecution(suites, executions, options)) {
    await persist(true);
    console.info(`Resultado directo: ${JSON.stringify(report.executionSummary)}. Sin casos pendientes en la selección; no se inició otro entorno.`);
    return report;
  }
  let env;
  let context;
  let scanFence;
  let interrupted = false;
  const cancellation = new AbortController();
  const interrupt = () => { interrupted = true; cancellation.abort(); };
  process.once("SIGINT", interrupt); process.once("SIGTERM", interrupt);
  try {
    scanFence = await createScriptScanFence({ directory: path.join(root, "scripts") });
    env = await createEnvironment({ build: options.build });
    await env.command("platform", { kind: "prepare" });
    context = await chromium.launchPersistentContext(path.join(env.directory, "perfil-integral"), {
      channel: "chrome", headless: true, ignoreHTTPSErrors: true, locale: "es-AR", viewport: viewportOf(1440),
    });
    report.environment.cleanup = "en ejecución";
    // La API viva no implica que el optimizador de Vite haya preparado la primera página.
    const warmup = await context.newPage();
    try {
      await warmup.goto(baseUrl.href, { waitUntil: "commit", timeout: 180_000 });
      await warmup.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().waitFor({ timeout: 300_000 });
    } finally { await warmup.close(); }
    for (const width of options.widths ?? [1440, 390]) {
      const support = createBrowserSupport({ context, env, base: baseUrl, width });
      const recordResult = async (id, getPage, action, blockedReason, diagnostic) => {
        if (interrupted) throw new Error("Prueba integral interrumpida.");
        const entry = executions.find((item) => item.id === id);
        assert.ok(entry, `Caso sin definición previa: ${id}`);
        const prior = entry.results.find((item) => item.width === width);
        const repeatForMobileBar = options.repeatMobileActions && selectedIds.has(id);
        const prepared = await reusePassedPreparation({ previous: prior, preserve: !repeatForMobileBar && (id.startsWith("BASE-") || options.resume), blockedReason, action });
        if (prepared.reused) {
          if (!blockedReason) console.info(`${id} ${width}: preparación completada; evidencia verde conservada.`);
          return { ok: true, value: prepared.value, preparationOnly: true };
        }
        const result = { width, status: blockedReason ? "blocked" : "passed", actual: blockedReason ?? "", executedAtUtc: new Date().toISOString(),
          ...(repeatForMobileBar ? { revalidation: "Menú móvil de barra tras ff1fe6c0, 6960c3f1, c614e89b y 0ac4b148; build Front completado." } : {}) };
        if (prior) {
          result.previousAttempts = [...(prior.previousAttempts ?? []), await archivePreviousAttempt({ id, width, prior, output,
            ...(repeatForMobileBar ? { reason: "Revalidado a390 px por pedido del usuario tras cambiar el ⋮ de barra a hoja y reconstruir Front; la evidencia anterior se conserva." } : {}) })];
        }
        if (id.startsWith("BASE-")) result.continued = true;
        let value;
        let failure;
        try {
          if (prepared.error) throw prepared.error;
          if (!blockedReason) { value = await action(); result.actual = typeof value === "string" ? value : "La comprobación terminó correctamente."; }
        }
        catch (error) {
          failure = error; result.status = "failed"; result.actual = buildCaseDiagnostic(error, diagnostic);
          result.severity = entry.severity ?? (entry.critical ? "high" : "medium");
          result.probableArea = entry.probableArea ?? "Front o contrato Back; revisar respuesta HTTP y captura";
          result.reproduce = entry.reproduce ?? ["Ejecutar node scripts/e2e-completo.mjs --no-build en un entorno aislado.", `Ingresar como ${entry.actor}.`, `Abrir ${entry.route}.`, entry.action];
        }
        const page = getPage?.();
        if (page && !page.isClosed()) {
          if (result.status === "failed") {
            result.authenticationTrace = support.authenticationTrace(page);
            if (result.authenticationTrace.length) result.actual += ` Tránsito de autenticación: ${JSON.stringify(result.authenticationTrace)}.`;
          }
          const currentLocation = new URL(page.url());
          result.currentRoute = currentLocation.pathname;
          result.currentHost = currentLocation.host;
          const browserErrorMasks = currentLocation.host === "chromewebdata" ? [page.locator("body")] : [];
          if (browserErrorMasks.length) result.actual += " La captura de error del navegador se ocultó para no mostrar parámetros OAuth del entorno de prueba.";
          const image = `${id}-${width}.png`;
          try {
            await page.screenshot({ path: path.join(output, image), fullPage: true, animations: "disabled",
              mask: [page.locator('input[autocomplete="one-time-code"], [role="group"][aria-label="Código"] input, input[type="password"]'), page.getByRole("textbox", { name: "Código de recuperación", exact: true }), page.getByRole("textbox", { name: /^(Clave de Anthropic|Clave de la plataforma)$/ }), ...factorSecretMasks(page), ...browserErrorMasks], maskColor: "#d9d4ca" });
            result.image = image;
          } catch (error) {
            result.actual += ` Captura no disponible (${error.name}).`;
            if (result.status === "passed") result.status = "blocked";
          }
        }
        entry.results = [...entry.results.filter((item) => item.width !== width), result];
        await persist();
        console.info(`${id} ${width}: ${result.status}`);
        return { ok: result.status === "passed", value, error: failure };
      };
      const h = { ...support, width, context, env, base: baseUrl,
        output, signal: cancellation.signal,
        resultFor: (id, selectedWidth = width) => executions.find((item) => item.id === id)?.results.find((result) => result.width === selectedWidth),
        isPending: (id, selectedWidth = width) => {
          const result = executions.find((item) => item.id === id)?.results.find((entry) => entry.width === selectedWidth);
          return !result || ["blocked", "pending"].includes(result.status);
        },
        record: (id, getPage, action, diagnostic) => recordResult(id, getPage, action, undefined, diagnostic),
        block: (id, reason, page) => recordResult(id, () => page, null, reason) };
      for (const suite of suites) {
        if (options.resume && !options.repeatMobileActions && suite.definitions.every((entry) => executions.find((item) => item.id === entry.id)?.results.some((result) => result.width === width && result.status === "passed"))) continue;
        try { await suite.run(h); }
        catch (error) {
          report.failure = `${suite.name} ${width}: ${safeDiagnostic(error.message)}`;
          for (const entry of suite.definitions) {
            const target = executions.find((item) => item.id === entry.id);
            if (!target.results.some((result) => result.width === width && ["passed", "failed"].includes(result.status))) await h.block(entry.id, `La suite se interrumpió: ${safeDiagnostic(error.message)}`);
          }
        }
      }
      // El mismo perfil sigue abierto. Cada suite sale por UI de las sesiones que inició.
    }
  } catch (error) { report.failure = safeDiagnostic(error.message); }
  finally {
    const cleanupErrors = [];
    try { await context?.close(); } catch (error) { cleanupErrors.push(error.name); }
    try { await env?.stop(); } catch (error) { cleanupErrors.push(error.name); }
    // Si el arranque no devolvió entorno, se conserva el filtro hasta comprobar su apagado.
    if (env && cleanupErrors.length === 0) {
      try { await scanFence?.release(); } catch (error) { cleanupErrors.push(error.name); }
    }
    report.environment.cleanup = cleanupErrors.length ? `Falló apagado: ${cleanupErrors.join(", ")}` : "apagado";
    process.removeListener("SIGINT", interrupt); process.removeListener("SIGTERM", interrupt);
    report.finishedAtUtc = new Date().toISOString();
    await persist(true);
  }
  console.info(`Resultado directo: ${JSON.stringify(report.executionSummary)}. Índice: ${path.join(output, "index.html")}`);
  process.exitCode = report.failure || report.executionSummary.failed || report.executionSummary.blocked || report.environment.cleanup !== "apagado" ? 1 : 0;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(parseArguments(process.argv.slice(2)));
