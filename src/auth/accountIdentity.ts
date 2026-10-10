import type { MeResponse } from "@/shared/api/types";
import { initials } from "@/shared/lib/initials";

/** Identidad de la cuenta global: la máscara recibida nunca se usa como una inicial. */
export function accountIdentity(account: Pick<MeResponse, "displayName" | "email" | "maskedPrimaryPhone"> | undefined) {
  const displayName = account?.displayName?.trim() || "";
  const phone = account?.maskedPrimaryPhone || null;
  const name = displayName || phone || account?.email || "";
  const initialSource = displayName || (phone ? "" : account?.email || "");
  return {
    name,
    detail: phone ? displayName ? phone : null : account?.email ?? null,
    avatarInitials: initials(initialSource).slice(0, 1) || "—",
    avatarMuted: !initialSource,
  };
}

export type AccountIdentity = ReturnType<typeof accountIdentity>;
