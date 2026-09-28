export type StatusTone = "success" | "warning" | "danger" | "neutral" | "pending";

/** Solo los tonos del tema. Cada feature incorporará sus estados de negocio. */
export const statusTones = {
  available: ["success", "warning", "danger", "neutral", "pending"],
  TestStatus: { Active: "success" },
} as const satisfies { available: readonly StatusTone[]; TestStatus: Record<string, StatusTone> };

export function getStatusTone(enumName: string, value: string): StatusTone {
  const mappings: Record<string, Record<string, StatusTone>> = { TestStatus: statusTones.TestStatus };
  return mappings[enumName]?.[value] ?? "neutral";
}
