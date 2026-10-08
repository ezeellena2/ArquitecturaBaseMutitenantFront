import type { LoginDestination } from "@/shared/api/types";

export interface CodeStep {
  readonly kind: "code";
  readonly destination: string;
  readonly sentAtMs: number;
  readonly loginDestination?: LoginDestination;
  readonly resendAfterSeconds?: number;
}

export function beginCodeStep(destination: string, sentAtMs: number, loginDestination?: LoginDestination, resendAfterSeconds?: number): CodeStep {
  return { kind: "code", destination, sentAtMs, ...(loginDestination ? { loginDestination } : {}), ...(resendAfterSeconds !== undefined ? { resendAfterSeconds } : {}) };
}

export function secondsUntilResend(sentAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((sentAtMs + 60_000 - nowMs) / 1_000));
}
