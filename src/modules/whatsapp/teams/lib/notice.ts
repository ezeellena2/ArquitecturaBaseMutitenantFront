/// D6: el correo «Chats esperando» sale cuando el chat más viejo sin tomar pasa 10, 15 o 30 minutos, o no sale («No
/// avisar», que la API recibe como `null`). Son las opciones que acepta el back (`WhatsAppFeature.NotifyAfterMinutesOptions`).
export const noticeMinutes = [10, 15, 30] as const;

/** El valor de «No avisar» en el desplegable: el campo trabaja con texto y la API con minutos o `null`. */
export const noNotice = "none";

export function noticeFieldValue(minutes: number | null | undefined): string {
  return minutes == null ? noNotice : String(minutes);
}

export function noticeMinutesFrom(value: string): number | null {
  const minutes = noticeMinutes.find((option) => String(option) === value);
  return minutes ?? null;
}
