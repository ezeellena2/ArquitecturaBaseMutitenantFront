import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { CompanyResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";

export function createCompanyColumns(t: TFunction): Column<CompanyResponse>[] {
  return [
    {
      id: "name", header: t("companies:columns.name"), type: "custom", mobile: "primary", sortable: true,
      cell: (company) => <Link className="block truncate font-medium text-[var(--marca-tx)] hover:underline" to={`/org/empresas/${encodeURIComponent(company.id)}`}>{company.name}</Link>,
    },
    { id: "taxId.number", header: t("companies:columns.taxId"), type: "taxId", value: (company) => company.taxId ?? null },
    { id: "timeZoneId", header: t("companies:columns.timeZone"), type: "timeZone", value: (company) => company.timeZoneId },
    { id: "memberCount", header: t("companies:columns.members"), type: "integer", value: (company) => company.memberCount },
    { id: "status", header: t("companies:columns.status"), type: "status", enum: "CompanyStatus", value: (company) => company.status, mobile: "status" },
    { id: "actions", header: t("companies:columns.actions"), type: "actions", cell: () => <EmptyValue /> },
  ];
}

export function createCompanyMemberColumns(t: TFunction): Column<import("@/shared/api/types").CompanyMemberResponse>[] {
  return [
    { id: "displayName", header: t("companies:memberColumns.name"), type: "text", value: (member) => member.displayName, mobile: "primary", sortable: true },
    { id: "email", header: t("companies:memberColumns.email"), type: "text", value: (member) => member.email },
    { id: "roles", header: t("companies:memberColumns.roles"), type: "text", value: (member) => member.roles.map((role) => role.name).join(", ") || null },
    { id: "state", header: t("companies:memberColumns.state"), type: "custom", mobile: "status", cell: (member) => <span className="text-[13px] text-[var(--t2)]">{t(member.membershipStatus === "Inactive" ? "companies:memberStates.Inactive" : `companies:memberStates.${member.state}`)}</span> },
  ];
}
