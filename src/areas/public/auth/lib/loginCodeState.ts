export interface CodeStep {
  readonly kind: "code";
  readonly destination: string;
  readonly sentAtMs: number;
}

export function beginCodeStep(destination: string, sentAtMs: number): CodeStep {
  return { kind: "code", destination, sentAtMs };
}

export function secondsUntilResend(sentAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((sentAtMs + 60_000 - nowMs) / 1_000));
}
