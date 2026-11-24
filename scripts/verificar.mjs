#!/usr/bin/env node
/**
 * Los tipos, el lint, los tests y el contrato del front con la salida mínima (ADR 0071 del back): muestra solo el
 * resumen y lo que falló, y deja el log entero en .local/verificar/. Lo usan los agentes del conductor para no
 * llenar su contexto con la consola.
 *
 *   node scripts/verificar.mjs                   tipos, lint, todos los tests y el contrato
 *   node scripts/verificar.mjs --cambiados       solo los tests que tocan los cambios sin commitear (mientras trabajás)
 *   node scripts/verificar.mjs --archivos <a> <b> solo esos archivos de test
 *
 * Sale 0 si todo pasó y 1 si algo falló.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAXIMO = 15;

export function parsear(argv) {
  const o = { completo: true, cambiados: false, archivos: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cambiados") { o.cambiados = true; o.completo = false; }
    else if (a === "--archivos") { o.completo = false; while (argv[i + 1] && !argv[i + 1].startsWith("--")) o.archivos.push(argv[++i]); }
    else throw new Error(`Opción desconocida: ${a}`);
  }
  if (!o.completo && !o.cambiados && !o.archivos.length) throw new Error("--archivos necesita al menos un archivo.");
  return o;
}

/** Los comandos que corre, en orden. vitest escribe su resultado en JSON para leer solo lo que falló. */
export function planDe(o, json) {
  const vitest = ["npx", "--no-install", "vitest", "run", "--reporter=json", `--outputFile=${json}`];
  if (o.cambiados) vitest.push("--changed");
  vitest.push(...o.archivos);
  const pasos = [];
  if (o.completo) pasos.push({ nombre: "tipos", comando: ["npx", "--no-install", "tsc", "-b", "--pretty", "false"] });
  if (o.completo) pasos.push({ nombre: "lint", comando: ["npx", "--no-install", "oxlint"] });
  pasos.push({ nombre: "tests", comando: vitest });
  if (o.completo) pasos.push({ nombre: "contrato", comando: ["node", "scripts/check-contracts.mjs"] });
  return pasos;
}

export function erroresDeTipos(texto) {
  return [...new Set(texto.split(/\r?\n/).filter((l) => /\(\d+,\d+\): error TS\d+:/.test(l)).map((l) => l.trim()))];
}

export function fallosDeVitest(resultado) {
  const fallos = [];
  for (const archivo of resultado.testResults || []) {
    const nombre = path.relative(process.cwd(), archivo.name || "").replace(/\\/g, "/") || archivo.name;
    const fallidos = (archivo.assertionResults || []).filter((a) => a.status === "failed");
    for (const a of fallidos) fallos.push({ test: `${nombre} › ${a.fullName}`, detalle: primeras(a.failureMessages && a.failureMessages[0]) });
    if (!fallidos.length && archivo.status === "failed") fallos.push({ test: nombre, detalle: primeras(archivo.message) });
  }
  return fallos;
}

function primeras(mensaje) {
  return String(mensaje || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^at /.test(l) && !/node_modules/.test(l))
    .slice(0, 6)
    .map((l) => (l.length > 300 ? `${l.slice(0, 300)}…` : l));
}

/** Lo que se muestra de un paso: una línea si pasó; lo que falló, si no. */
export function informe(paso, codigo, texto, segundos, vitest) {
  if (paso === "tests" && vitest) {
    const cuenta = `${vitest.numPassedTests} de ${vitest.numTotalTests}`;
    const fallos = fallosDeVitest(vitest);
    if (codigo === 0 && !fallos.length) return [`tests: ok, ${cuenta} (${segundos} s)`];
    const salida = [`tests: ${vitest.numFailedTests || fallos.length} con error, ${cuenta} pasaron (${segundos} s)`];
    for (const f of fallos.slice(0, MAXIMO)) salida.push(`  ✖ ${f.test}`, ...f.detalle.map((d) => `      ${d}`));
    if (fallos.length > MAXIMO) salida.push(`  … y ${fallos.length - MAXIMO} más en el log`);
    return salida;
  }
  if (codigo === 0) return [`${paso}: ok (${segundos} s)`];
  const lineas = paso === "tipos" ? erroresDeTipos(texto) : [];
  const muestra = lineas.length ? lineas : texto.trim().split(/\r?\n/).filter(Boolean);
  return [`${paso}: con error (${segundos} s)`, ...muestra.slice(0, 20).map((l) => `  ${l}`), ...(muestra.length > 20 ? [`  … y ${muestra.length - 20} líneas más en el log`] : [])];
}

function correr(comando, cwd) {
  // En Windows, npx es un .cmd y necesita la consola: el comando va como una sola línea, con cada argumento entre comillas si hace falta.
  const opciones = { cwd, encoding: "utf8", windowsHide: true, maxBuffer: 1024 ** 3 };
  const r = process.platform === "win32"
    ? spawnSync(comando.map((a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)).join(" "), { ...opciones, shell: true })
    : spawnSync(comando[0], comando.slice(1), opciones);
  return { codigo: r.status ?? 1, texto: `${r.stdout || ""}${r.stderr || ""}` };
}

export async function ejecutar(argv, { cwd = process.cwd(), escribir = (s) => process.stdout.write(`${s}\n`), correr: correrPaso = correr } = {}) {
  let o;
  try { o = parsear(argv); } catch (e) { escribir(e.message); return 1; }
  const logs = path.join(cwd, ".local", "verificar");
  mkdirSync(logs, { recursive: true });
  const json = path.join(logs, "vitest.json");
  let final = 0;
  for (const paso of planDe(o, json)) {
    if (paso.nombre === "tests") rmSync(json, { force: true });
    const desde = Date.now();
    const { codigo, texto } = correrPaso(paso.comando, cwd);
    const log = path.join(logs, `${paso.nombre}.log`);
    writeFileSync(log, texto);
    let vitest = null;
    if (paso.nombre === "tests" && existsSync(json)) {
      try { vitest = JSON.parse(readFileSync(json, "utf8")); } catch { vitest = null; }
    }
    for (const l of informe(paso.nombre, codigo, texto, Math.round((Date.now() - desde) / 1000), vitest)) escribir(l);
    if (codigo !== 0) { final = 1; escribir(`Log entero: ${log}`); }
  }
  return final;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await ejecutar(process.argv.slice(2));
}
