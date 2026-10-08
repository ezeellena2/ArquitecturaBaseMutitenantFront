// Comparación final de T09–T12 contra v115. Sólo este arnés simula API/sesión.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { captureEntry, issuer } from "./capturar-etapa-7.mjs";
import { assertCapturedPairs, startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { assertSideBySide } from "./capturar-relevamiento.mjs";
import { output, writeGallery } from "./generar-galeria-etapa-8.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canvas = path.join(root, "docs/design/lienzo");
const api = (method, route, body, status = 200, headers) => ({ method, path: route, body, status, ...(headers ? { headers } : {}) });
const click = (name) => ({ type: "click", role: "button", name, exact: true });
const fill = (name, value) => ({ type: "fill", role: "textbox", name, value });
const code = [{ type: "otp", value: "123456" }, { type: "click", role: "button", name: "Verificar" }];
function visualPath(route, fixture = "anonymous", fragment = "") {
  return `/src/test/etapa8VisualApp.html?${new URLSearchParams({ as: fixture, route })}${fragment}`;
}
function problem(code, field, message, extra = {}) {
  return { type: "about:blank", title: "Bad Request", status: 400, code, traceId: "visual-e8", ...(field ? { errors: { [field]: [message] } } : {}), ...extra };
}

export async function buildManifest() {
  const { etapa8Channels, etapa8Code, etapa8Account, etapa8AccountVerified, etapa8MethodCode, etapa8Link, etapa8BusinessApproval } = await import("../src/test/etapa8VisualFixtures.ts");
  const cases = [];
  const on = api("GET", "/api/auth/methods", etapa8Channels);
  const off = api("GET", "/api/auth/methods", { channels: etapa8Channels.channels.filter((item) => item.key !== "whatsapp") });
  function both(pair, group, board, props, app, extra = {}) {
    const { mobileProps, ...shared } = extra;
    for (const [suffix, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
      const ownProps = suffix === "mobile" ? mobileProps ?? props : props;
      cases.push({
        id: `${pair}-${suffix}`, pair, group, label: Object.values(ownProps).join(" · "), board: suffix === "desktop" ? board : `M-${board}`,
        props: ownProps, viewport: { width, height }, captureExtent: "viewport", ...shared,
        app: { site: "main", ...app, captureMode: "harness" },
      });
    }
  }
  const phoneForm = [click("WhatsApp"), fill("WhatsApp", "11 5555-4521")];
  const terms = { type: "click", role: "checkbox", name: "Acepto los" };
  for (const [access, puerta] of [["consumer", "Persona"], ["business", "Empresa"]]) {
    const route = `${access === "consumer" ? "/login" : "/login/empresa"}?${new URLSearchParams({ returnUrl: `/connect/authorize?access=${access}` })}`;
    const app = { path: visualPath(route), responses: [on], readyHeading: access === "consumer" ? "Ingresá a tu cuenta" : "Ingresá como empresa" };
    both(`ingreso-${access}-whatsapp`, "ingreso", "Ingreso", { estado: "WhatsApp", puerta }, { ...app, actions: phoneForm });
    both(`ingreso-${access}-sin-modulo`, "ingreso", "Ingreso", { estado: "Correo", puerta }, { ...app, responses: [off] });
    both(`ingreso-${access}-sin-cuenta`, "ingreso", "Ingreso", { estado: "WhatsApp: número sin cuenta", puerta }, {
      ...app, responses: [on, api("POST", "/api/auth/login-code", problem("Auth.LoginCode.PhoneAccountNotFound", "phone", "No hay una cuenta con ese número."), 400)],
      actions: [...phoneForm, click("Enviar código")], readyText: "No hay una cuenta con ese número.",
    });
    for (const [suffix, estado, errorCode] of [["codigo", "Código enviado por WhatsApp", null], ["codigo-incorrecto", "Código incorrecto", "Auth.LoginCode.Invalid"], ["codigo-vencido", "Código vencido", "Auth.LoginCode.Expired"], ["cuenta-suspendida", "Cuenta suspendida", "Identity.Account.Suspended"]]) {
      both(`ingreso-${access}-${suffix}`, "ingreso", "Ingreso", { estado, puerta }, {
        path: app.path, responses: [on, api("POST", "/api/auth/login-code", etapa8Code, 202), ...(errorCode ? [api("POST", "/api/auth/login-code/verify", problem(errorCode, null, null, { attemptsLeft: 3 }), errorCode === "Identity.Account.Suspended" ? 403 : 400)] : [])],
        actions: [...phoneForm, click("Enviar código"), ...(errorCode ? code : [])], readyHeading: "Revisá tu WhatsApp",
      });
    }
  }
  for (const [group, board, route, title, requestPath] of [
    ["registro", "Registro", "/registro", "Creá tu cuenta", "/api/auth/signup"],
    ["registro-empresa", "Registro-Empresa", "/registro/empresa", "Registrá tu empresa", "/api/auth/business-signup/code"],
  ]) {
    const app = { path: visualPath(route), responses: [on], readyHeading: title };
    both(`${group}-whatsapp`, group, board, { estado: "Correo" }, { ...app, actions: phoneForm }, { boardActions: [click("WhatsApp"), fill(group === "registro" ? "Número de WhatsApp" : "Tu número de WhatsApp", "11 5555-4521")], label: "WhatsApp" });
    both(`${group}-sin-modulo`, group, board, { estado: "Correo" }, { ...app, responses: [off] });
    const send = click(group === "registro" ? "Crear cuenta" : "Continuar");
    both(`${group}-codigo`, group, board, { estado: "Correo" }, {
      path: app.path, responses: [on, api("POST", requestPath, etapa8Code, 202)], actions: [terms, ...phoneForm, send], readyHeading: "Revisá tu WhatsApp",
    }, { boardActions: [click("WhatsApp"), { type: "click", selector: 'input[type="checkbox"]' }, { type: "fill", selector: 'input[type="tel"]', value: "11 5555-4521" }, send], label: "Código enviado por WhatsApp" });
    if (group === "registro") both("registro-numero-ocupado", group, board, { estado: "WhatsApp: número con cuenta" }, {
      ...app, responses: [on, api("POST", requestPath, problem("Auth.Signup.PhoneTaken", "phone", "Ya tenés una cuenta con ese número."), 400)],
      actions: [terms, ...phoneForm, send], readyText: "Ya tenés una cuenta con ese número.",
    });
  }
  const businessProof = [terms, ...phoneForm, click("Continuar"), ...code];
  const businessResponses = [on, api("POST", "/api/auth/business-signup/code", etapa8Code, 202), api("POST", "/api/auth/business-signup/verify", null, 204)];
  both("registro-empresa-organizacion-phone", "registro-empresa", "Registro-Empresa", { estado: "Tu organización" }, {
    path: visualPath("/registro/empresa"), responses: businessResponses, actions: businessProof, readyHeading: "Tu organización",
  });
  both("registro-empresa-aprobacion-phone", "registro-empresa", "Registro-Empresa", { estado: "Espera aprobación" }, {
    path: visualPath("/registro/empresa"), responses: [...businessResponses,
      api("GET", "/api/public-site/slug-availability", { slug: "grupo-delta", availability: "Available" }),
      api("POST", "/api/auth/business-signup", etapa8BusinessApproval)],
    actions: [...businessProof,
      fill("Nombre de la organización", "Grupo Delta"), fill("Dirección de tu página", "grupo-delta"), fill("Primera empresa", "Delta S.A."),
      { ...click("Crear organización"), waitFor: "Disponible" }], readyHeading: "Recibimos el pedido",
  });
  // Token ficticio del arnés: fragmento real separado de su query y sin credencial de usuario.
  const linkPath = visualPath("/login/enlace", "anonymous", `#t=e8_visual_token_only_${"a".repeat(23)}`);
  for (const [suffix, estado, failure, status] of [
    ["previa", "Vista previa", null, 200],
    ["iniciando", "Iniciando sesión", null, 200],
    ["limite", "Demasiadas solicitudes", "Auth.LoginLink.TooManyRequests", 429],
    ["no-sirve", "Ya no sirve", "Auth.LoginLink.Invalid", 400],
    ["suspendida", "Cuenta suspendida", "Identity.Account.Suspended", 403],
  ]) {
    const redeem = suffix === "iniciando" || suffix === "limite";
    both(`enlace-${suffix}`, "enlace", "Enlace", { estado }, {
      path: linkPath, responses: [on,
        api("POST", "/api/auth/login-link/preview", redeem || !failure ? etapa8Link : problem(failure, null, null), redeem || !failure ? 200 : status),
        ...(suffix === "limite" ? [api("POST", "/api/auth/login-link/redeem", problem(failure, null, null, { retryAfter: 38 }), 429, { "Retry-After": "38" })] : [])],
      ...(redeem ? { actions: [click("Continuar")] } : {}),
      ...(suffix === "iniciando" ? { hang: { method: "POST", path: "/api/auth/login-link/redeem" } } : {}),
      readyHeading: suffix === "iniciando" ? "Iniciando sesión…" : suffix === "no-sirve" ? "Este enlace ya no sirve" : suffix === "suspendida" ? "No podés entrar" : "Entrar a ArquitecturaBase",
    });
  }
  both("enlace-sin-modulo", "enlace", "Enlace", { estado: "Ya no sirve" }, {
    path: linkPath, responses: [off, api("POST", "/api/auth/login-link/preview", problem("Auth.LoginLink.Invalid", null, null), 400)], readyHeading: "Este enlace ya no sirve",
  });
  const previousPhone = [click("WhatsApp"), fill("Número de WhatsApp", "11 5555-4521")];
  const newPhone = [click("WhatsApp"), fill("Número de WhatsApp nuevo", "11 5555-0142")];
  const recoveryPath = visualPath("/recuperar");
  const recoveryProps = { paso: "1. El correo o teléfono de antes", whatsapp: "Con WhatsApp" };
  const previousBoard = [click("WhatsApp"), fill("Número de WhatsApp", "11 5555-4521")];
  const nextBoard = [...previousBoard, click("Seguir"), click("WhatsApp"), fill("Número de WhatsApp nuevo", "11 5555-0142")];
  const recoveryResponses = [on, api("POST", "/api/account-recovery/preview", null, 204), api("POST", "/api/account-recovery/code", etapa8Code, 202)];
  both("recuperar-anterior-phone", "recuperar", "Recuperar", recoveryProps, {
    path: recoveryPath, responses: [on], actions: previousPhone, readyHeading: "Recuperar mi cuenta",
  }, { boardActions: previousBoard });
  both("recuperar-anterior-sin-cuenta", "recuperar", "Recuperar", { ...recoveryProps, paso: "1. Sin cuenta con ese número" }, {
    path: recoveryPath, responses: [on, api("POST", "/api/account-recovery/preview", problem("Platform.AccountRecovery.PhoneAccountNotFound", "previousPhone", "No hay una cuenta con ese número."), 400)],
    actions: [...previousPhone, click("Seguir")], readyText: "No hay una cuenta con ese número.",
  });
  both("recuperar-sin-modulo", "recuperar", "Recuperar", { ...recoveryProps, whatsapp: "Sin WhatsApp (hasta la Etapa 8)" }, {
    path: recoveryPath, responses: [off], readyHeading: "Recuperar mi cuenta",
  });
  both("recuperar-nuevo-phone", "recuperar", "Recuperar", recoveryProps, {
    path: recoveryPath, responses: recoveryResponses, actions: [...previousPhone, click("Seguir"), ...newPhone], readyHeading: "¿Dónde te escribimos?",
  }, { boardActions: nextBoard, label: "Anterior Phone · Nuevo WhatsApp" });
  both("recuperar-nuevo-ocupado", "recuperar", "Recuperar", { ...recoveryProps, paso: "2. El WhatsApp nuevo ya es de otra cuenta" }, {
    path: recoveryPath, responses: [on, api("POST", "/api/account-recovery/preview", null, 204), api("POST", "/api/account-recovery/code", problem("Platform.AccountRecovery.PhoneMethodInUse", "phone", "Ese número ya es de otra cuenta."), 400)],
    actions: [...previousPhone, click("Seguir"), ...newPhone, click("Enviar código")], readyText: "Ese número ya es de otra cuenta.",
  });
  both("recuperar-codigo-whatsapp", "recuperar", "Recuperar", recoveryProps, {
    path: recoveryPath, responses: recoveryResponses, actions: [...previousPhone, click("Seguir"), ...newPhone, click("Enviar código")], readyHeading: "Revisá tu WhatsApp",
  }, { boardActions: [...nextBoard, click("Enviar código")], label: "Código de posesión WhatsApp" });
  both("recuperar-pedido-recibido", "recuperar", "Recuperar", recoveryProps, {
    path: recoveryPath, responses: [...recoveryResponses, api("POST", "/api/account-recovery/verify", null, 204), api("POST", "/api/account-recovery", null, 202)],
    actions: [...previousPhone, click("Seguir"), ...newPhone, click("Enviar código"), ...code], readyHeading: "Recibimos tu pedido",
  }, { boardActions: [...nextBoard, click("Enviar código"), ...Array.from({ length: 6 }, (_, index) => fill(`Código ${index + 1}`, String(index + 1))), click("Verificar")], label: "Pedido recibido · Phone" });
  const accountApp = { path: visualPath("/cuenta", "visual-personal"), userFixture: "visual-personal", responses: [on, api("GET", "/api/me/login-methods", etapa8Account)], readyHeading: "Mi cuenta" };
  for (const [suffix, active] of [["whatsapp", true], ["sin-modulo", false]]) {
    const state = `${active ? "Con" : "Sin"} el módulo de WhatsApp`;
    both(`cuenta-${suffix}`, "cuenta", "Cuenta", { whatsapp: state }, { ...accountApp, responses: [active ? on : off, api("GET", "/api/me/login-methods", etapa8Account)] }, { mobileProps: { estado: state } });
  }
  const addPhone = [click("Agregar correo o teléfono"), click("WhatsApp"), fill("Número", "11 5555-4521")];
  const accountDialog = { path: accountApp.path, userFixture: accountApp.userFixture, readySelector: '[role="dialog"]' };
  both("cuenta-agregar-whatsapp", "cuenta", "Cuenta-Agregar", { estado: "WhatsApp" }, {
    ...accountDialog, responses: accountApp.responses, actions: addPhone, readyText: "Agregar correo o teléfono",
  });
  both("cuenta-elegir-pais-whatsapp", "cuenta", "Cuenta-Agregar", { estado: "WhatsApp: elegir el país" }, {
    ...accountDialog, responses: accountApp.responses,
    actions: [...addPhone, { type: "click", role: "combobox", name: "País" }], readyText: "Argentina",
  });
  both("cuenta-agregar-sin-modulo", "cuenta", "Cuenta-Agregar", { estado: "Sin el módulo de WhatsApp" }, {
    ...accountDialog, responses: [off, api("GET", "/api/me/login-methods", etapa8Account)], actions: [click("Agregar correo")], readyText: "Agregar correo",
  });
  for (const [suffix, state, errorCode, detail] of [
    ["ocupado", "WhatsApp: ya es de otra cuenta", "Identity.LoginMethod.PhoneAlreadyUsed", "Ese número ya es de otra cuenta."],
    ["pais-no-habilitado", "WhatsApp: país que WhatsApp no habilita", "WhatsApp.Phone.CountryNotAllowed", "WhatsApp no está habilitado para ese país."],
  ]) both(`cuenta-agregar-${suffix}`, "cuenta", "Cuenta-Agregar", { estado: state }, {
    ...accountDialog, responses: [...accountApp.responses, api("POST", "/api/me/login-methods", problem(errorCode, "phone", detail), 400)], actions: [...addPhone, click("Enviar código")], readyText: detail,
  });
  for (const [suffix, state, errorCode] of [
    ["codigo", "WhatsApp", null], ["incorrecto", "WhatsApp: código incorrecto", "Auth.LoginCode.Invalid"], ["vencido", "WhatsApp: código vencido", "Auth.LoginCode.Expired"],
  ]) both(`cuenta-verificar-${suffix}`, "cuenta", "Cuenta-Verificar", { estado: state }, {
    ...accountDialog, responses: [...accountApp.responses, api("POST", "/api/me/login-methods", etapa8MethodCode, 202),
      ...(errorCode ? [api("POST", "/api/me/login-methods/phone-lucia/verify", problem(errorCode, null, null, { detail: errorCode === "Auth.LoginCode.Invalid" ? "El código no es válido." : "El código venció. Pedí uno nuevo." }), 400)] : [])],
    actions: [...addPhone, click("Enviar código"), ...(errorCode ? code : [])], readyText: "Verificar tu WhatsApp",
  });
  const openPhoneMenu = { type: "click", role: "button", name: "4521" };
  const menuApp = { ...accountDialog, responses: [on, api("GET", "/api/me/login-methods", etapa8AccountVerified)] };
  both("cuenta-menu-whatsapp", "cuenta", "Cuenta-Metodo", { estado: "Menú del WhatsApp" }, { ...menuApp, actions: [openPhoneMenu], readySelector: '[role="menu"]', readyText: "Hacer principal" });
  for (const [suffix, state, action, title] of [
    ["principal", "Hacer principal el WhatsApp", "Hacer principal", "¿Hacer principal este WhatsApp?"],
    ["quitar", "Quitar el WhatsApp", "Quitar", "¿Quitar este WhatsApp?"],
  ]) both(`cuenta-${suffix}-whatsapp`, "cuenta", "Cuenta-Metodo", { estado: state }, {
    ...menuApp, actions: [openPhoneMenu, { type: "click", role: "menuitem", name: action }], readyText: title,
  });
  both("cuenta-quitar-correo-sin-reauth", "cuenta", "Cuenta-Metodo", { estado: "Quitar un correo" }, {
    ...menuApp, responses: [on, api("GET", "/api/me/login-methods", { ...etapa8AccountVerified, methods: etapa8AccountVerified.methods.map((method) => method.type === "Google" ? { ...method, canRemove: false, canMakePrimary: false } : method) })],
    actions: [{ type: "click", role: "button", name: "Acciones de lucia.fer@gmail.com", exact: true }, { type: "click", role: "menuitem", name: "Quitar", exact: true }], readyText: "¿Quitar este correo?",
  });
  return { version: 1, stage: "etapa-8-front", canvasVersion: "v115 · bb7c78de", issuer, cases };
}

function option(args, name) { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; }
async function main(args) {
  const manifestFile = path.join(output, "manifest.json");
  mkdirSync(output, { recursive: true });
  const manifest = args.includes("--verify") ? JSON.parse(readFileSync(manifestFile, "utf8")) : await buildManifest();
  if (!args.includes("--verify")) writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  validateManifest(manifestFile, canvas);
  if (args.includes("--manifiesto")) { console.log(`${manifest.cases.length} casos E8 contra v115.`); return; }
  if (args.includes("--verify")) {
    assertCapturedPairs(manifest.cases, output); assertSideBySide(manifest.cases, output); console.log(writeGallery()); return;
  }
  const groups = option(args, "--group")?.split(",");
  const ids = option(args, "--id")?.split(",");
  const selected = manifest.cases.filter((entry) => (!groups || groups.includes(entry.group)) && (!ids || ids.includes(entry.id)));
  if (!selected.length) throw new Error("Filtro de capturas vacío");
  const server = await startCanvasServer(canvas);
  // El HTTP local de captura necesita las APIs de contexto seguro usadas por el producto.
  const browser = await chromium.launch({ headless: true, args: [`--unsafely-treat-insecure-origin-as-secure=${issuer}`], ...(option(args, "--browser-path") ? { executablePath: option(args, "--browser-path") } : { channel: "chrome" }) });
  try {
    for (const entry of selected) { await captureEntry(browser, entry, server.url, option(args, "--app-url") ?? issuer, output); console.log(entry.id); }
    assertCapturedPairs(selected, output); assertSideBySide(selected, output); console.log(writeGallery());
  } finally { await browser.close(); await server.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
