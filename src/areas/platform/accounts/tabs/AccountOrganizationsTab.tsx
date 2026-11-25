import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { PlatformAccountMembershipResponse } from "@/shared/api/types";
import { ListCard } from "@/shared/ui/app/ListRow";
import { usePagination } from "@/shared/hooks/usePagination";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Surface } from "@/shared/ui/Surface";
import { sortRows } from "@/shared/ui/tableSort";

/// El circuito de una membresía (264): el orden del enum en el back.
const membershipCircuit: readonly PlatformAccountMembershipResponse["status"][] = ["Invited", "Active", "Inactive", "Removed"];

/// Las organizaciones llegan enteras con la cuenta: ordenan en el navegador, con el orden en la dirección (264).
export function AccountOrganizationsTab({ organizations }: { organizations: readonly PlatformAccountMembershipResponse[] }) {
  const { t } = useTranslation("platformAccounts");
  const { sort, setSort } = usePagination({ prefix: "organizaciones." });
  const path = (id: string) => `/plataforma/organizaciones/${encodeURIComponent(id)}`;
  const role = (membership: PlatformAccountMembershipResponse) => membership.roleName || <EmptyValue />;
  const state = (membership: PlatformAccountMembershipResponse) => <StatusDot tone={membership.status === "Active" ? "success" : membership.status === "Invited" ? "pending" : "neutral"}
    label={t(membership.status === "Active" ? "detail.membershipActive" : membership.status === "Invited" ? "detail.membershipInvited" : "detail.membershipEnded")} />;
  const columns: Column<PlatformAccountMembershipResponse>[] = [
    { id: "name", sortable: true, sortValue: (row) => row.name, header: t("detail.organization"), type: "custom", mobile: "primary", cell: (row) => <Link className="block wrap-break-word font-medium text-[var(--t1)] hover:underline" to={path(row.tenantId)}>{row.name}</Link> },
    { id: "roleName", sortable: true, sortValue: (row) => row.roleName, header: t("detail.role"), type: "custom", cell: role },
    { id: "joinedAtUtc", sortable: true, header: t("detail.since"), type: "date", value: (row) => row.joinedAtUtc },
    { id: "status", sortable: true, sortAs: "status", sortValue: (row) => membershipCircuit.indexOf(row.status), header: t("detail.membershipState"), type: "custom", cell: state },
  ];
  return <Surface phoneFlush><DataTable columns={columns} rows={sortRows(organizations, columns, sort)} rowKey={(row) => row.tenantId} emptyTitle={t("detail.organizationsEmpty")}
    sort={sort} onSortChange={setSort}
    // 263: en el teléfono cada organización es una tarjeta con el rol, el estado y desde cuándo, cada dato con el nombre de su
    // columna.
    mobileRow={(row) => <ListCard key={row.tenantId} to={path(row.tenantId)} title={row.name} fields={[
      { label: t("detail.role"), value: role(row) },
      { label: t("detail.membershipState"), value: state(row) },
      { label: t("detail.since"), value: <DateText value={row.joinedAtUtc} kind="date" /> },
    ]} />} /></Surface>;
}
