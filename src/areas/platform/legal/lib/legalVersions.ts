import type { PlatformLegalDocumentGroupResponse } from "@/shared/api/types";

export function nextVersion(document: PlatformLegalDocumentGroupResponse | undefined): number {
  return Math.max(0, ...(document?.versions.map((version) => version.version) ?? [])) + 1;
}

// Como Invitaciones/Empresas: se comparan instantes, sin formatearlos ni convertir la fecha civil del editor.
export function nextEffectiveVersion(document: PlatformLegalDocumentGroupResponse) {
  return document.versions.filter((version) => Date.parse(version.effectiveAtUtc) > Date.now())
    .sort((left, right) => Date.parse(left.effectiveAtUtc) - Date.parse(right.effectiveAtUtc) || right.version - left.version)[0];
}
