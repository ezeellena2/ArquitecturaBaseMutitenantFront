import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { PlatformRecoveryResponse } from "@/shared/api/types";
import { defineStatusTones } from "@/shared/format/statusTones";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";

export const recoveryStatusTones = defineStatusTones("AccountRecoveryStatus", { Pending: "pending", Approved: "success", Rejected: "danger" });
export function recoveryPhoneRow(recovery: PlatformRecoveryResponse, t: TFunction, trailing: ReactNode, onClick: () => void): ReactNode {
  return <ListRow key={recovery.id} title={recovery.accountId ? recovery.accountName || <EmptyValue /> : t("platformRecoveries:noAccount")}
    meta={<DateText value={recovery.createdAtUtc} kind="shortDateTime" />} lines={[t("platformRecoveries:methods", { previous: recovery.previousMethod, next: recovery.newMethod }), <StatusBadge key="status" tones={recoveryStatusTones} value={recovery.status} />]}
    onClick={onClick} trailing={trailing} />;
}
export function createRecoveryColumns(t: TFunction): Column<PlatformRecoveryResponse>[] {
  return [
    { id: "accountName", header: t("platformRecoveries:columns.account"), type: "custom", mobile: "primary",
      cell: (recovery) => recovery.accountId ? <Link className="block truncate font-medium text-[var(--t1)] hover:underline" to={`/plataforma/cuentas/${encodeURIComponent(recovery.accountId)}`}>{recovery.accountName || <EmptyValue />}</Link> : <span className="text-[var(--t3)]">{t("platformRecoveries:noAccount")}</span>,
      detail: (recovery) => <DateText value={recovery.createdAtUtc} kind="dateTime" /> },
    { id: "previousMethod", header: t("platformRecoveries:columns.previous"), type: "text", value: (recovery) => recovery.previousMethod },
    { id: "newMethod", header: t("platformRecoveries:columns.new"), type: "text", value: (recovery) => recovery.newMethod },
    { id: "status", header: t("platformRecoveries:columns.status"), type: "status", tones: recoveryStatusTones, value: (recovery) => recovery.status, mobile: "status" },
  ];
}
