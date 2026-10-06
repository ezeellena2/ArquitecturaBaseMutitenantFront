import { ApiError } from "@/shared/api/ApiError";

export function legalErrorField(error: unknown): "effectiveOn" | undefined {
  if (!(error instanceof ApiError)) return;
  switch (error.code) {
    case "Legal.Publication.EffectiveDatePast": return "effectiveOn";
    default: return;
  }
}
