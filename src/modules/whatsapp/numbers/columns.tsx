import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import { ListCard } from "@/shared/ui/app/ListRow";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import type { Column } from "@/shared/ui/DataTable";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import type { WhatsAppNumberResponse } from "../api/types";
import { NumberStatus } from "./components/NumberStatus";
import { NumberUsage } from "./components/NumberUsage";

/** «Atiende a»: la empresa o toda la organización. */
export const numberCompany = (number: WhatsAppNumberResponse, t: TFunction): string => number.company?.name ?? t("whatsapp:numbers.wholeOrganization");

/// Tablero WA-Admin (base de la 12): Número, Nombre verificado, Atiende a, Estado, Este mes y el ⋮, un dato por celda.
export function createNumberColumns(t: TFunction, onPaymentInfo: (number: WhatsAppNumberResponse) => void,
  actions: (number: WhatsAppNumberResponse) => ReactNode): Column<WhatsAppNumberResponse>[] {
  return [
    { id: "number", header: t("whatsapp:numbers.columns.number"), type: "custom", mobile: "primary", className: "w-[18%]",
      cell: (number) => <PhoneText value={number.displayNumber} className="font-medium text-[var(--t1)]" /> },
    { id: "verifiedName", header: t("whatsapp:numbers.columns.verifiedName"), type: "text", value: (number) => number.verifiedName },
    { id: "company", header: t("whatsapp:numbers.columns.company"), type: "text", value: (number) => numberCompany(number, t) },
    { id: "status", header: t("whatsapp:numbers.columns.status"), type: "custom", mobile: "status", className: "w-[22%]",
      cell: (number) => <NumberStatus number={number} onPaymentInfo={onPaymentInfo} /> },
    { id: "month", header: t("whatsapp:numbers.columns.month"), type: "custom", className: "w-[20%]", cell: (number) => <NumberUsage number={number} /> },
    { id: "actions", header: t("whatsapp:numbers.columns.actions"), type: "actions", cell: actions },
  ];
}

/// M-Filas-Base2 (M-WA-Admin, 263): una tarjeta con el estado, a quién atiende, el nombre verificado y lo de este mes, cada
/// dato con su nombre.
export function numberPhoneRow(number: WhatsAppNumberResponse, t: TFunction, onPaymentInfo: (number: WhatsAppNumberResponse) => void, trailing: ReactNode): ReactNode {
  return <ListCard key={number.id} title={<PhoneText value={number.displayNumber} />} fields={[
    { label: t("whatsapp:numbers.columns.status"), value: <NumberStatus number={number} onPaymentInfo={onPaymentInfo} /> },
    { label: t("whatsapp:numbers.columns.company"), value: numberCompany(number, t) },
    { label: t("whatsapp:numbers.columns.verifiedName"), value: number.verifiedName ?? <EmptyValue /> },
    { label: t("whatsapp:numbers.columns.month"), value: number.status === "Disconnected" ? <EmptyValue /> : <NumberUsage number={number} /> },
  ]} trailing={trailing} />;
}
