import { useCurrentUser } from "@/auth/useCurrentUser";

export type TimeZoneSources = {
  access: "consumer" | "business" | "platform";
  accountTimeZoneId?: string | null;
  companyTimeZoneId?: string | null;
  organizationTimeZoneId?: string | null;
  browserTimeZoneId?: string | null;
};

export function resolveEffectiveTimeZone(sources: TimeZoneSources): string | null {
  if (sources.accountTimeZoneId) return sources.accountTimeZoneId;
  if (sources.access === "business") {
    return sources.companyTimeZoneId ?? sources.organizationTimeZoneId ?? null;
  }
  if (sources.access === "consumer") return sources.browserTimeZoneId ?? null;
  return null;
}

// En 3a /api/me entrega el resultado efectivo. La consulta por companyId se conecta
// cuando existan datos de empresa en E6; la precedencia ya vive en el helper puro.
export function useEffectiveTimeZone(_companyId?: string): string | null {
  const { data: user } = useCurrentUser();
  return user?.timeZoneId ?? null;
}
