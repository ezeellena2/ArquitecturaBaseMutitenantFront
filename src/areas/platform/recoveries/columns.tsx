import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { RecoveryMethodText } from "./components/RecoveryMethodText";
import type { PlatformRecoveryResponse } from "@/shared/api/types";
import { recoveryStatusTones } from "@/shared/format/statusTones";
export { recoveryStatusTones } from "@/shared/format/statusTones";
import { ListCard } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";

/// Tablero M-Filas-Base2 (M-Recuperaciones, 263): en el teléfono cada pedido es una tarjeta con su estado, la fecha y hora y los
/// dos métodos, cada dato con su nombre; tocarla lo abre.
export function recoveryPhoneRow(recovery: PlatformRecoveryResponse, t: TFunction, trailing: ReactNode, onClick: () => void): ReactNode {
  return <ListCard key={recovery.id} title={recovery.accountId ? recovery.accountName || <EmptyValue /> : t("platformRecoveries:noAccount")} fields={[
    { label: t("platformRecoveries:columns.status"), value: <StatusBadge tones={recoveryStatusTones} value={recovery.status} /> },
    { label: t("platformRecoveries:columns.createdAt"), value: <DateText value={recovery.createdAtUtc} kind="dateTime" /> },
    { label: t("platformRecoveries:columns.previous"), value: <RecoveryMethodText type={recovery.previousMethodType} value={recovery.previousMethod} /> },
    { label: t("platformRecoveries:columns.new"), value: <RecoveryMethodText type={recovery.newMethodType} value={recovery.newMethod} /> },
  ]} onClick={onClick} trailing={trailing} />;
}
export function createRecoveryColumns(t: TFunction): Column<PlatformRecoveryResponse>[] {
  return [
    // Tablero Recuperaciones (base de la 12): un dato por celda; la fecha y hora del pedido, en su columna.
    { id: "accountName", sortable: true, header: t("platformRecoveries:columns.account"), type: "custom", mobile: "primary",
      cell: (recovery) => recovery.accountId ? <Link className="font-medium text-[var(--t1)] hover:underline" to={`/plataforma/cuentas/${encodeURIComponent(recovery.accountId)}`}>{recovery.accountName || <EmptyValue />}</Link> : <span className="text-[var(--t3)]">{t("platformRecoveries:noAccount")}</span> },
    { id: "createdAtUtc", sortable: true, header: t("platformRecoveries:columns.createdAt"), type: "dateTime", className: "w-40", value: (recovery) => recovery.createdAtUtc },
    { id: "previousMethod", header: t("platformRecoveries:columns.previous"), type: "custom", cell: (recovery) => <RecoveryMethodText type={recovery.previousMethodType} value={recovery.previousMethod} /> },
    { id: "newMethod", header: t("platformRecoveries:columns.new"), type: "custom", cell: (recovery) => <RecoveryMethodText type={recovery.newMethodType} value={recovery.newMethod} /> },
    { id: "status", sortable: true, header: t("platformRecoveries:columns.status"), type: "status", tones: recoveryStatusTones, value: (recovery) => recovery.status, mobile: "status" },
  ];
}
