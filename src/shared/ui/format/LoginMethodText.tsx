import type { ApiSchemas } from "@/shared/api/types";
import { PhoneText } from "./PhoneText";

/** Una máscara entregada por la API se conserva, sin reconstruir el método. */
export function LoginMethodText({ type, value }: { type: ApiSchemas["LoginMethodType"]; value: string }) {
  return type === "Phone" && /^\+[1-9]\d{1,14}$/u.test(value) ? <PhoneText value={value} /> : <span>{value}</span>;
}
