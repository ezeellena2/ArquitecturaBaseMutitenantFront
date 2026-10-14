import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import type { WhatsAppNumberResponse } from "../api/types";
import { NumberStatus } from "./components/NumberStatus";
import { NumberUsage } from "./components/NumberUsage";

/// Lo que aclara el número, en su segunda línea gris: el nombre verificado en Meta y, si comparte el número con la app
/// WhatsApp Business (coexistencia), «también en la app».
export function numberDetail(number: WhatsAppNumberResponse, t: TFunction): string | null {
  if (number.verifiedName && number.coexistence) return t("whatsapp:numbers.detail.nameAndApp", { name: number.verifiedName });
  if (number.coexistence) return t("whatsapp:numbers.detail.app");
  return number.verifiedName ?? null;
}

/** «Atiende a»: la empresa o toda la organización. */
export const numberCompany = (number: WhatsAppNumberResponse, t: TFunction): string => number.company?.name ?? t("whatsapp:numbers.wholeOrganization");

/// Tablero WA-Admin: Número (con lo que lo aclara debajo), Atiende a, Estado, Este mes y el ⋮.
export function createNumberColumns(t: TFunction, onPaymentInfo: (number: WhatsAppNumberResponse) => void,
  actions: (number: WhatsAppNumberResponse) => ReactNode): Column<WhatsAppNumberResponse>[] {
  return [
    { id: "number", header: t("whatsapp:numbers.columns.number"), type: "custom", mobile: "primary", className: "w-[30%]",
      cell: (number) => <PhoneText value={number.displayNumber} className="block truncate font-medium text-[var(--t1)]" />,
      detail: (number) => numberDetail(number, t) },
    { id: "company", header: t("whatsapp:numbers.columns.company"), type: "text", value: (number) => numberCompany(number, t) },
    { id: "status", header: t("whatsapp:numbers.columns.status"), type: "custom", mobile: "status", className: "w-[22%]",
      cell: (number) => <NumberStatus number={number} onPaymentInfo={onPaymentInfo} /> },
    { id: "month", header: t("whatsapp:numbers.columns.month"), type: "custom", className: "w-[20%]", cell: (number) => <NumberUsage number={number} /> },
    { id: "actions", header: t("whatsapp:numbers.columns.actions"), type: "actions", cell: actions },
  ];
}

/// M-WA-Admin: el número con lo de este mes a la derecha, lo que lo aclara y, abajo, a quién atiende y su estado.
export function numberPhoneRow(number: WhatsAppNumberResponse, t: TFunction, onPaymentInfo: (number: WhatsAppNumberResponse) => void, trailing: ReactNode): ReactNode {
  return <ListRow key={number.id} title={<PhoneText value={number.displayNumber} />}
    meta={number.status === "Disconnected" ? undefined : <NumberUsage number={number} />}
    lines={[numberDetail(number, t), <span key="state" className="inline-flex items-center gap-1">{numberCompany(number, t)}{" · "}<NumberStatus number={number} onPaymentInfo={onPaymentInfo} /></span>]}
    trailing={trailing} />;
}
