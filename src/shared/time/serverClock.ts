import { parseUtcInstant } from "./parseUtcInstant";

let anchor: { serverMs: number; elapsedMs: number } | undefined;

/** Duraciones locales: independientes de los ajustes de fecha del dispositivo. */
export function monotonicNow(): number { return performance.now(); }

/** HTTP Date se origina en la API. Nunca se usa la fecha del dispositivo después de sincronizar. */
export function synchronizeServerClock(httpDate: string | null): void {
  if (!httpDate) return;
  const serverMs = Date.parse(httpDate);
  if (!Number.isFinite(serverMs) || (anchor && serverMs <= anchor.serverMs)) return;
  anchor = { serverMs, elapsedMs: monotonicNow() };
}

export function resetServerClock(): void { anchor = undefined; }

/** Antes de la primera respuesta sólo se dispone del reloj local; los datos remotos llegan ya sincronizados. */
export function now(): number {
  return anchor ? anchor.serverMs + Math.max(0, monotonicNow() - anchor.elapsedMs) : Date.now();
}

export function isPast(utcInstant: string): boolean { return parseUtcInstant(utcInstant).getTime() <= now(); }

/** «En N días», redondeado como el tablero de invitación; el último medio día dice «Hoy». */
export function daysUntil(utcInstant: string): number {
  return Math.max(0, Math.round((parseUtcInstant(utcInstant).getTime() - now()) / 86_400_000));
}
