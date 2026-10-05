import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { PlatformTenantResponse } from "@/shared/api/types";
import { defineStatusTones } from "@/shared/format/statusTones";
import type { Column } from "@/shared/ui/DataTable";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { EnumText } from "@/shared/ui/format/EnumText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";

export const tenantStatusTones = defineStatusTones("TenantStatus", { PendingApproval: "pending", Provisioning: "danger", Active: "success", Suspended: "warning", Closed: "neutral" });
export const organizationPath = (id: string) => `/plataforma/organizaciones/${encodeURIComponent(id)}`;

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
