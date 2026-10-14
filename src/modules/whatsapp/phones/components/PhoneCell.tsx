import { PhoneText } from "@/shared/ui/format/PhoneText";
import type { WhatsAppPhoneImportRowResponse } from "../../api/types";

/** El teléfono: el que entendió el back o, si no lo entendió, lo que se escribió en ese renglón. */
export type TypedLine = (row: WhatsAppPhoneImportRowResponse) => string;

export function PhoneCell({ row, typed }: { row: WhatsAppPhoneImportRowResponse; typed: TypedLine }) {
  return row.phone ? <PhoneText value={row.phone} /> : <span>{typed(row)}</span>;
}
