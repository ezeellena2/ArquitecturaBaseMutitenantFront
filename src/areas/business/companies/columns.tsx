import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { CompanyResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";

export function createCompanyColumns(t: TFunction): Column<CompanyResponse>[] {
  return [
    {
      id: "name", header: t("companies:columns.name"), type: "custom", mobile: "primary", sortable: true,
      cell: (company) => <div className="min-w-0">
        <Link className="block truncate font-medium text-[var(--marca-tx)] hover:underline" to={`/org/empresas/${encodeURIComponent(company.id)}`}>{company.name}</Link>
        <span className="block truncate text-xs text-[var(--t3)]">{company.taxId ? <TaxIdText value={company.taxId} withType /> : t("companies:withoutTaxId")}</span>
      </div>,
    },
    { id: "timeZoneId", header: t("companies:columns.timeZone"), type: "timeZone", value: (company) => company.timeZoneId },
    { id: "memberCount", header: t("companies:columns.members"), type: "integer", value: (company) => company.memberCount },
    { id: "status", header: t("companies:columns.status"), type: "custom", mobile: "status", cell: (company) => <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--t2)]">
      <span aria-hidden="true" className={`size-2 rounded-full ${company.status === "Active" ? "bg-[var(--ok)]" : "bg-[var(--t3)]"}`} />
      {t(`companies:status.${company.status}`)}
    </span> },
    { id: "actions", header: t("companies:columns.actions"), type: "actions", cell: () => <EmptyValue /> },
  ];
}

export function createCompanyMemberColumns(t: TFunction): Column<import("@/shared/api/types").CompanyMemberResponse>[] {
  return [
    { id: "displayName", header: t("companies:memberColumns.name"), type: "custom", mobile: "primary", sortable: true, cell: (member) => <div className="min-w-0">
      <span className="block truncate text-[var(--t1)]">{member.displayName}</span>
      <span className="block truncate text-xs text-[var(--t3)]">{member.email ?? <EmptyValue />}</span>
    </div> },
    { id: "roles", header: t("companies:memberColumns.roles"), type: "text", value: (member) => member.roles.map((role) => role.name).join(", ") || null },
    { id: "state", header: t("companies:memberColumns.state"), type: "custom", mobile: "status", cell: (member) => <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--t2)]">
      <span aria-hidden="true" className={`size-2 rounded-full ${member.membershipStatus === "Active" && member.state === "Active" ? "bg-[var(--ok)]" : member.state === "PendingDeletion" ? "bg-[var(--alerta)]" : "bg-[var(--t3)]"}`} />
      {t(member.membershipStatus === "Inactive" ? "companies:memberStates.Inactive" : `companies:memberStates.${member.state}`)}
    </span> },
  ];
}
