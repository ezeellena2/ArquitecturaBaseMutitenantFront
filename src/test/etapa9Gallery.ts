import { api, click, fill, galleryApp, galleryCase, galleryPending, otp, press, type GalleryAction, type GalleryApiResponse, type GalleryCase, type GalleryPending } from "./gallery";
import { currentUsers } from "./mocks/currentUsers";
import { platformAccountDetailFixture } from "./mocks/platformAccountDetail";

// Galería de la E9 (scripts/capturas/etapa-9.json): solo las pantallas nuevas o cambiadas en la etapa, al lado de su
// tablero. Datos ficticios del arnés: no acredita el back. La reautenticación (F2), la configuración de cuotas y el aviso
// del límite (F4), Roles con «Inactivar» apagado (R10) y los eventos nuevos de Auditoría entran cuando su tablero salga
// con la v125 del lienzo y su tarea esté programada.

/** La hora de los tableros de Cuenta-Plat: el último ingreso de Laura fue hace 5 días. */
const now = "2026-09-27T21:00:00Z";
const factorPath = "/api/auth/platform-factor";
const loginRoute = `/login?${new URLSearchParams({ returnUrl: "/connect/authorize?client_id=web&access=platform", factor: "pending" })}`;
const expiresAtUtc = "2026-09-27T21:10:00Z";
const verifyChallenge = api("GET", factorPath, { state: "verify", expiresAtUtc });
const setupChallenge = api("GET", factorPath, { state: "setup", expiresAtUtc, secret: "JBSWY3DPEHPK3PXP",
  otpauthUri: "otpauth://totp/ArquitecturaBase:martin.sosa%40arquitecturabase.ejemplo.com?secret=JBSWY3DPEHPK3PXP&issuer=ArquitecturaBase" });
// Los ocho códigos del tablero Ingreso («Operador: guardar los códigos»).
const recoveryCodes = ["7KQ2-M9XD", "P4TZ-8WNE", "H2RC-QA6V", "ZL9B-3YFK", "E5MU-T7JP", "W8GD-2NHS", "C3XV-R6LQ", "N9AF-K4PB"];
const codesChallenge = api("GET", factorPath, { state: "recoveryCodes", expiresAtUtc, recoveryCodes });
const verifyFails = (body: unknown, status = 400): GalleryApiResponse => api("POST", `${factorPath}/verify`, body, status);

function ingreso(board: "Ingreso" | "M-Ingreso"): GalleryCase[] {
  const login = (state: string, responses: GalleryApiResponse[], readyText: string, actions: GalleryAction[] = []) =>
    galleryCase("ingreso", board, state, galleryApp("anonymous", loginRoute, responses, { now, readyText, actions }));
  return [
    login("Operador: segundo factor", [verifyChallenge], "Escribí el código de 6 números de tu app de autenticación."),
    login("Operador: código del autenticador incorrecto", [verifyChallenge, verifyFails({ code: "Auth.TwoFactor.Invalid" })],
      "Revisá que la hora de tu celular esté bien.", [otp("120934"), click("Verificar")]),
    login("Operador: demasiados códigos incorrectos", [verifyChallenge, verifyFails({ code: "Identity.Account.LockedOut", retryAfter: 900 }, 429)],
      "Probá de nuevo en 15 minutos.", [otp("774201"), click("Verificar")]),
    login("Operador: código de recuperación", [verifyChallenge], "Escribí uno de los códigos de recuperación que guardaste.", [click("Usar un código de recuperación")]),
    login("Operador: código de recuperación incorrecto", [verifyChallenge, verifyFails({ code: "Auth.TwoFactor.RecoveryInvalid" })],
      "Ese código no es válido o ya lo usaste.", [click("Usar un código de recuperación"), fill("Código de recuperación", "P4TZ-8WNE"), click("Verificar")]),
    login("Operador: configurar el autenticador", [setupChallenge], "JBSW Y3DP EHPK 3PXP"),
    login("Operador: configurar · código incorrecto", [setupChallenge, verifyFails({ code: "Auth.TwoFactor.Invalid" })],
      "Revisá que la hora de tu celular esté bien.", [otp("551203"), click("Activar")]),
    login("Operador: guardar los códigos", [codesChallenge], "N9AF-K4PB"),
  ];
}

function cuentaPlat(board: "Cuenta-Plat" | "M-Cuenta-Plat"): GalleryCase[] {
  const laura = platformAccountDetailFixture({ kind: "Operador" });
  const responses = [api("GET", `/api/platform/accounts/${laura.id}`, laura), api("GET", "/api/me", currentUsers["visual-operator"])];
  const open = press("Acciones de Laura Díaz", "button", "ArrowDown");
  const reset = (state: string, readyText: string, actions: GalleryAction[]) => galleryCase("cuenta-plat", board, state,
    galleryApp("visual-operator", `/plataforma/cuentas/${laura.id}`, responses, { now, readyText, actions }),
    board === "Cuenta-Plat" ? { stateKey: "cuenta", props: { estado: "Activa", cuenta: state } } : {});
  return [
    reset("Operador: acciones", "Restablecer el autenticador", [open]),
    reset("Operador: restablecer el autenticador", "Se cierran sus sesiones y sus códigos de recuperación dejan de servir.", [open, click("Restablecer el autenticador", "menuitem"),
      fill("Motivo", "Cambió de celular y perdió los códigos.", { role: "dialog", name: "¿Restablecer el autenticador de Laura Díaz?" })]),
  ];
}

export const etapa9GalleryCases: GalleryCase[] = [...ingreso("Ingreso"), ...ingreso("M-Ingreso"), ...cuentaPlat("Cuenta-Plat"), ...cuentaPlat("M-Cuenta-Plat")];

const v125 = "Su tablero sale con la v125 del lienzo, pendiente de aprobación del usuario.";
export const etapa9GalleryPending: GalleryPending[] = [
  ...["Operador: confirmar que sos vos", "Operador: confirmar que sos vos · código incorrecto", "Operador: confirmar con un código de recuperación",
    "Operador: confirmar · código de recuperación incorrecto", "Operador: confirmar · demasiados intentos", "Operador: cancelar la confirmación"]
    .flatMap((state) => [galleryPending("cuenta-plat", "Cuenta-Plat", state, `F2 (reautenticación) todavía no está programada. ${v125}`),
      galleryPending("cuenta-plat", "M-Cuenta-Plat", state, `F2 (reautenticación) todavía no está programada. ${v125}`)]),
  galleryPending("config-plat", "Config-Plat", "Cuotas", `F4 (editor de cuotas y aviso del límite) todavía no está programada. ${v125}`),
  galleryPending("config-plat", "M-Config-Plat", "Cuotas", `F4 (editor de cuotas y aviso del límite) todavía no está programada. ${v125}`),
  galleryPending("roles", "Roles", "Menú de un rol con usuarios", `R10 ya está programado. ${v125}`),
  galleryPending("auditoria", "Auditoria-Plat", "Eventos del segundo factor", v125),
  galleryPending("auditoria", "M-Auditoria-Plat", "Eventos del segundo factor", v125),
];
