/** Convierte el instante canónico del backend para SDKs que requieren Date. No elige una zona ni un reloj local. */
export function parseUtcInstant(value: string): Date {
  if (!value.endsWith("Z")) throw new Error("Un instante debe terminar en Z.");
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) throw new Error("El instante no es válido.");
  return instant;
}
