import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { PlatformTenantDetailResponse, PlatformTenantHistoryResponse, PlatformTenantOwnerResponse, PlatformTenantResponse } from "@/shared/api/types";
import { tenantStatusTones, type StatusTones } from "@/shared/format/statusTones";
export { tenantStatusTones } from "@/shared/format/statusTones";
import type { Column } from "@/shared/ui/DataTable";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { EnumText } from "@/shared/ui/format/EnumText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";

export const organizationPath = (id: string) => `/plataforma/organizaciones/${encodeURIComponent(id)}`;

type OwnerState = "Active" | "Suspended" | "PendingDeletion" | "Deleted" | "Inactive" | "Removed" | "Invited";
const ownerStatusTones: StatusTones<OwnerState> = { enum: "PlatformOwnerState", tones: { Active: "success", Suspended: "warning", PendingDeletion: "warning", Deleted: "neutral", Inactive: "neutral", Removed: "neutral", Invited: "pending" } };
interface OwnerRow { id: string; name?: string | null; email?: string | null; lastSignInAtUtc?: string | null; state: OwnerState }
function ownerState(owner: PlatformTenantOwnerResponse): OwnerState {
  if (owner.identityStatus !== "Active") return owner.identityStatus;
  return owner.membershipStatus;
}
// El contacto pendiente no es una identidad ni una membresía: sólo la fila que dibuja v111 cuando todavía no hay Dueño.
export function organizationOwners(organization: PlatformTenantDetailResponse): OwnerRow[] {
  return organization.owners.length > 0
    ? organization.owners.map((owner) => ({ id: owner.id, name: owner.displayName, email: owner.email, lastSignInAtUtc: owner.lastSignInAtUtc, state: ownerState(owner) }))
    : organization.ownerEmail ? [{ id: "pending-contact", name: null, email: organization.ownerEmail, lastSignInAtUtc: null, state: "Invited" }] : [];
}
export function createOrganizationOwnerColumns(t: TFunction): Column<OwnerRow>[] {
  return [
    { id: "name", header: t("platformTenants:columns.owner"), type: "text", mobile: "primary", value: (row) => row.name, detail: (row) => row.email },
    { id: "lastSignInAtUtc", header: t("platformTenants:detail.lastSignIn"), type: "custom", cell: (row) => row.lastSignInAtUtc ? <DateText value={row.lastSignInAtUtc} kind="relative" /> : t("platformTenants:detail.never") },
    { id: "state", header: t("platformTenants:columns.status"), type: "status", mobile: "status", tones: ownerStatusTones, value: (row) => row.state },
  ];
}
export function organizationOwnerPhoneRow(row: OwnerRow, t: TFunction): ReactNode {
  return <ListRow key={row.id} title={row.name || <EmptyValue />}
    meta={row.lastSignInAtUtc ? <DateText value={row.lastSignInAtUtc} kind="relative" /> : t("platformTenants:detail.phoneNever")}
    lines={[row.email || <EmptyValue key="email" />, <StatusBadge key="state" tones={ownerStatusTones} value={row.state} />]} />;
}
export function createOrganizationHistoryColumns(t: TFunction): Column<PlatformTenantHistoryResponse>[] {
  return [
    { id: "occurredAtUtc", header: t("platformTenants:detail.historyColumns.when"), type: "dateTime", value: (row) => row.occurredAtUtc },
    { id: "action", header: t("platformTenants:detail.historyColumns.what"), type: "text", mobile: "primary", value: (row) => row.action },
    { id: "actor", header: t("platformTenants:detail.historyColumns.who"), type: "text", value: (row) => row.actor },
    { id: "reason", header: t("platformTenants:detail.historyColumns.reason"), type: "text", value: (row) => row.reason },
  ];
}

export function organizationPhoneRow(organization: PlatformTenantResponse, t: TFunction, trailing: ReactNode): ReactNode {
  return <ListRow key={organization.id} to={organizationPath(organization.id)} title={organization.name}
    meta={<DateText value={organization.createdAtUtc} kind="date" />}
    lines={[
      <>{organization.ownerName || organization.ownerEmail || <EmptyValue />}{" · "}{organization.companyCount === 0 ? t("platformTenants:columns.noCompanies") : <><NumberText value={organization.companyCount} /> {t("platformTenants:columns.company", { count: organization.companyCount })}{" · "}<NumberText value={organization.memberCount} /> {t("platformTenants:columns.member", { count: organization.memberCount })}</>}</>,
      <><StatusBadge tones={tenantStatusTones} value={organization.status} />{" · "}<EnumText enum="TenantRegistrationSource" value={organization.source} /></>,
    ]} trailing={trailing} />;
}
export function createOrganizationColumns(t: TFunction): Column<PlatformTenantResponse>[] {
  return [
    { id: "name", header: t("platformTenants:columns.organization"), type: "custom", mobile: "primary", sortable: true,
      cell: (organization) => <Link className="block truncate font-medium text-[var(--t1)] hover:underline" to={organizationPath(organization.id)}>{organization.name}</Link>,
      detail: (organization) => <>{t("platformTenants:columns.created")} <DateText value={organization.createdAtUtc} kind="date" />{" · "}<EnumText enum="TenantRegistrationSource" value={organization.source} /></> },
    { id: "ownerName", header: t("platformTenants:columns.owner"), type: "text", value: (organization) => organization.ownerName, detail: (organization) => organization.ownerEmail || null },
    { id: "companyCount", header: t("platformTenants:columns.companies"), type: "integer", value: (organization) => organization.companyCount },
    { id: "memberCount", header: t("platformTenants:columns.members"), type: "integer", value: (organization) => organization.memberCount },
    { id: "status", header: t("platformTenants:columns.status"), type: "status", mobile: "status", tones: tenantStatusTones, value: (organization) => organization.status },
  ];
}
