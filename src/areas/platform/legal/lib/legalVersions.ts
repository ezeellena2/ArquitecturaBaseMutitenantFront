import type { PlatformLegalDocumentGroupResponse } from "@/shared/api/types";
import { isPast } from "@/shared/time/serverClock";
import { parseUtcInstant } from "@/shared/time/parseUtcInstant";

export function nextVersion(document: PlatformLegalDocumentGroupResponse | undefined): number {
  return Math.max(0, ...(document?.versions.map((version) => version.version) ?? [])) + 1;
}

// Como Invitaciones/Empresas: se comparan instantes, sin formatearlos ni convertir la fecha civil del editor.
export function nextEffectiveVersion(document: PlatformLegalDocumentGroupResponse) {
  return document.versions.filter((version) => !isPast(version.effectiveAtUtc))
    .sort((left, right) => parseUtcInstant(left.effectiveAtUtc).getTime() - parseUtcInstant(right.effectiveAtUtc).getTime() || right.version - left.version)[0];
}
