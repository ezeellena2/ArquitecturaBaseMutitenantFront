/** Cuenta m:ss de una espera técnica en segundos; el texto que la acompaña pertenece a i18n. */
export function formatCountdown(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

type Translate = (key: string, options: { count: number }) => string;

const secondsPerHour = 60 * 60;

/**
 * La espera que pide un 429 («Reintentá en …»): hasta una hora, la cuenta m:ss de siempre; desde una hora, en horas y
 * minutos («22 h 53 min»), porque un tope diario (0063: los del correo y los códigos de Mi cuenta) pide esperar hasta un
 * día. Los minutos se redondean para arriba, como la cuenta lo hace al segundo: la espera nunca se muestra más corta de
 * lo que es. Las unidades son las de `format:duration`.
 */
export function formatWait(seconds: number, translate: Translate): string {
  const whole = Math.max(0, Math.ceil(seconds));
  if (whole < secondsPerHour) return formatCountdown(whole);

  const totalMinutes = Math.ceil(whole / 60);
  const hours = translate("format:duration.hours", { count: Math.floor(totalMinutes / 60) });
  const minutes = totalMinutes % 60;
  return minutes === 0 ? hours : `${hours} ${translate("format:duration.minutes", { count: minutes })}`;
}
