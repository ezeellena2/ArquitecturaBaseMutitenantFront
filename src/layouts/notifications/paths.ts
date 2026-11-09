/** La pantalla «Avisos» del teléfono (M-Campana y M-Campana-Personal), como «Más»: en Personal y en la organización. */
export const notificationsPath = "/avisos";

/** La de Plataforma (M-Campana-Plat), debajo de `/plataforma` como su «Más». */
export const platformNotificationsPath = "/plataforma/avisos";

/** Una ruta de la app («/plataforma/recuperaciones»): ni otro sitio («//otro», «/\otro») ni una dirección entera. */
export function isAppPath(value: string): boolean {
  return /^\/(?![\\/])/.test(value);
}
