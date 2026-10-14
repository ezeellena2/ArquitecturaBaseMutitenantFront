import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { StatusDetail } from "@/shared/ui/StatusDot";
import type { WhatsAppPhoneImportRowResponse } from "../api/types";
import { PhoneCell, type TypedLine } from "./components/PhoneCell";
import { phoneImportOutcomeTones } from "./tones";

/// Tablero WA-Telefonos («Revisar»): el teléfono, la persona si ya es miembro y qué va a pasar, con lo que significa
/// debajo. Solo los tres resultados del back: nunca si un número tiene cuenta (ADR 0038, precisión del 11/10).
export function createPhoneImportColumns(t: TFunction, typed: TypedLine = (row) => row.phone ?? ""): Column<WhatsAppPhoneImportRowResponse>[] {
  return [
    { id: "phone", header: t("whatsapp:phones.columns.phone"), type: "custom", mobile: "primary", className: "w-[30%]", cell: (row) => <PhoneCell row={row} typed={typed} /> },
    { id: "memberName", header: t("whatsapp:phones.columns.person"), type: "text", value: (row) => row.memberName },
    { id: "outcome", header: t("whatsapp:phones.columns.outcome"), type: "status", tones: phoneImportOutcomeTones, value: (row) => row.outcome,
      detail: (row) => <StatusDetail>{t(`whatsapp:phones.outcome.${row.outcome}`)}</StatusDetail> },
  ];
}

/// M-WA-Telefonos: el teléfono con qué va a pasar a la derecha; debajo, la persona si ya es miembro y lo que significa.
export function phoneImportPhoneRow(row: WhatsAppPhoneImportRowResponse, t: TFunction, typed: TypedLine): ReactNode {
  return <ListRow key={row.row} title={<PhoneCell row={row} typed={typed} />} meta={<StatusBadge tones={phoneImportOutcomeTones} value={row.outcome} />}
    lines={row.memberName ? [row.memberName, t(`whatsapp:phones.outcome.${row.outcome}`)] : [t(`whatsapp:phones.outcome.${row.outcome}`)]} />;
}
