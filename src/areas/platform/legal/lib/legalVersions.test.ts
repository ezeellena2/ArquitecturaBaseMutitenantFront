import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlatformLegalDocumentGroupResponse } from "@/shared/api/types";
import { nextEffectiveVersion, nextVersion } from "./legalVersions";
afterEach(() => vi.restoreAllMocks());
describe("vigencia legal", () => {
  it("elige próxima fecha UTC, no máximo número ni !isCurrent; empates por versión mayor", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-27T20:35:00Z"));
    const document: PlatformLegalDocumentGroupResponse = { kind: "Terms", currentVersion: 3, currentEffectiveAtUtc: "2026-06-01T03:00:00Z", versions: [
      { id: "past", version: 20, effectiveAtUtc: "2026-01-01T03:00:00Z", isCurrent: false },
      { id: "far", version: 15, effectiveAtUtc: "2027-01-01T03:00:00Z", isCurrent: false },
      { id: "near", version: 7, effectiveAtUtc: "2026-10-01T03:00:00Z", isCurrent: false },
      { id: "nearNew", version: 9, effectiveAtUtc: "2026-10-01T03:00:00Z", isCurrent: false },
      { id: "equal", version: 4, effectiveAtUtc: "2026-09-27T20:35:00Z", isCurrent: false },
    ] };
    expect(nextEffectiveVersion(document)?.id).toBe("nearNew"); expect(nextVersion(document)).toBe(21); expect(document.versions[0].id).toBe("past");
  });
  it("sin versiones arranca en uno y no inventa una futura", () => {
    const empty: PlatformLegalDocumentGroupResponse = { kind: "Privacy", currentVersion: null, currentEffectiveAtUtc: null, versions: [] };
    expect(nextVersion(empty)).toBe(1); expect(nextEffectiveVersion(empty)).toBeUndefined(); expect(nextVersion(undefined)).toBe(1);
  });
});
