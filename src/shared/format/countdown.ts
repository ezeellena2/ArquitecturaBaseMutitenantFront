/** Cuenta m:ss de una espera técnica en segundos; el texto que la acompaña pertenece a i18n. */
export function formatCountdown(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
