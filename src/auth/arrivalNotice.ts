// Un aviso que tiene que verse después de salir de la app. «Cancelar el borrado y entrar» sigue el ingreso por OIDC,
// con una carga de página entera, y un aviso dado antes se pierde con ella (B12-07). Por eso se guarda en esta pestaña,
// solo la clave de su texto, y AppShell lo muestra una sola vez al llegar.
const storageKey = "arquitecturabasemt.arrivalNotice";
const arrivalNotices = ["auth:deletion.cancelled"] as const;

export type ArrivalNotice = (typeof arrivalNotices)[number];

export function rememberArrivalNotice(notice: ArrivalNotice): void {
  try { globalThis.sessionStorage.setItem(storageKey, notice); } catch { /* Sin almacenamiento, el aviso no se ve. */ }
}

/** Lo entrega una sola vez. Un valor que no es un aviso conocido no se muestra. */
export function takeArrivalNotice(): ArrivalNotice | null {
  try {
    const stored = globalThis.sessionStorage.getItem(storageKey);
    globalThis.sessionStorage.removeItem(storageKey);
    return arrivalNotices.find((notice) => notice === stored) ?? null;
  } catch {
    return null;
  }
}
