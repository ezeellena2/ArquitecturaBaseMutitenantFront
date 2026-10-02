import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertCapturedPairs, captureCase, startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { visualPersonal } from "../src/test/mocks/currentUsers.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const output = path.join(root, "docs/design/capturas/etapa-4");
export const canvas = path.join(root, "docs/design/lienzo");
export const manifestFile = path.join(output, "manifest.json");

const personal = { id: "2", type: "Email", value: "lucia.fer@gmail.com", isPrimary: true, isVerified: true, canRemove: false, canMakePrimary: false };
const company = { id: "1", type: "Email", value: "lucia.fernandez@delta.ejemplo.com", isPrimary: false, isVerified: true, managedByTenantId: "grupo-delta", managedByOrganizationName: "Grupo Delta", canRemove: true, canMakePrimary: true };
const phone = { id: "3", type: "Phone", value: "011 15-5555-4521", isPrimary: false, isVerified: false, canRemove: true, canMakePrimary: false };
const pending = { id: "4", type: "Email", value: "nuevo@ejemplo.com", isPrimary: false, isVerified: false, canRemove: true, canMakePrimary: false };
const proof = { sourceMethodId: "2", destination: "lu•••@gmail.com", resendAfterSeconds: 60 };
const api = (method, path, body, status = 200) => ({ method, path, body, status });
const accountResponses = (methods = [personal, company, phone]) => [
  api("GET", "/api/me", visualPersonal),
  api("GET", "/api/me/login-methods", { methods, canLinkGoogle: true, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30 }),
];

export function buildCases() {
  const scenarios = [
    { pair: "cuenta", board: "Cuenta", mobileBoard: "M-Cuenta", responses: accountResponses(), actions: [], readySelector: "main" },
    { pair: "agregar-correo", board: "Cuenta-Agregar", mobileBoard: "M-Cuenta", responses: [
      ...accountResponses(), api("POST", "/api/me/reauth", proof, 202), api("POST", "/api/me/reauth/verify", { reauthTicket: "visual-ticket" }),
    ], actions: [
      { type: "click", role: "button", name: "Agregar correo o teléfono" },
      { type: "otp", value: "123456" },
      { type: "click", role: "button", name: "Verificar" },
    ], readySelector: 'input[type="email"]' },
    { pair: "verificar-correo", board: "Cuenta-Verificar", mobileBoard: "M-Cuenta", responses: [
      ...accountResponses([personal, company, pending]), api("POST", "/api/me/login-methods/4/code", { methodId: "4", resendAfterSeconds: 60 }, 202),
    ], actions: [{ type: "click", role: "button", name: "Verificar" }], readySelector: 'input[inputmode="numeric"]' },
    { pair: "baja-cuenta", board: "Cuenta-Baja", mobileBoard: "M-Cuenta", responses: [
      ...accountResponses(), api("POST", "/api/me/reauth", proof, 202),
    ], actions: [{ type: "click", role: "button", name: "Dar de baja" }], readySelector: '[role="dialog"]' },
  ];

  return scenarios.flatMap((scenario) => [
    { width: 1440, height: 900, board: scenario.board, viewport: "escritorio" },
    { width: 390, height: 844, board: scenario.mobileBoard, viewport: "movil" },
  ].map(({ width, height, board, viewport }) => ({
    id: `${scenario.pair}-${viewport}`,
    pair: scenario.pair,
    group: "cuenta",
    board,
    props: {},
    viewport: { width, height },
    ...(width === 390 && scenario.pair !== "cuenta" ? { note: "El lienzo v60 no tiene tablero móvil del diálogo; M-Cuenta se conserva como referencia de marco y la app captura el diálogo abierto." } : {}),
    app: {
      path: "/src/test/visualApp.html?as=visual-personal&route=%2Fcuenta",
      captureMode: "harness",
      responses: scenario.responses,
      actions: scenario.actions.map((action) => width === 390 && action.name === "Agregar correo o teléfono"
        ? { ...action, name: "Agregar" }
        : action),
      readySelector: scenario.readySelector,
    },
  })));
}

export async function writeManifest() {
  mkdirSync(output, { recursive: true });
  const cases = buildCases();
  writeFileSync(manifestFile, `${JSON.stringify({ version: 1, cases }, null, 2)}\n`);
  validateManifest(manifestFile, canvas);
  return cases;
}

async function main() {
  const cases = await writeManifest();
  if (process.argv.includes("--verify")) {
    assertCapturedPairs(cases, output);
    console.log(`${cases.length} pares visuales E4 completos.`);
    return;
  }
  const index = process.argv.indexOf("--app-url");
  if (index < 0 || !process.argv[index + 1]) throw new Error("Indicá --app-url del servidor Vite visual.");
  const browser = await chromium.launch({ headless: true });
  const canvasServer = await startCanvasServer(canvas);
  try {
    for (const entry of cases) {
      await captureCase(browser, entry, { canvasUrl: canvasServer.url, appUrl: process.argv[index + 1], outputRoot: output });
      console.log(`${entry.id}: lienzo + app`);
    }
  } finally {
    await canvasServer.close();
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
