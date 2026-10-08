import type { ApiSchemas } from "@/shared/api/types";
import { PhoneText } from "@/shared/ui/format/PhoneText";

/** La API puede entregar una máscara: no se reconstruye ni se intenta interpretar. */
export function RecoveryMethodText({ type, value }: { type: ApiSchemas["LoginMethodType"]; value: string }) {
  return type === "Phone" && /^\+[1-9]\d{1,14}$/u.test(value) ? <PhoneText value={value} /> : <span>{value}</span>;
}
