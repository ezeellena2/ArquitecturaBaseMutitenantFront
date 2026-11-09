/// Una frase escrita por alguien (un motivo) termina en punto, como en los tableros (`t10nPunto`): «Dos meses sin pago.».
export function endWithPeriod(text: string): string {
  const trimmed = text.trim();
  return /[.!?…]$/u.test(trimmed) ? trimmed : `${trimmed}.`;
}
