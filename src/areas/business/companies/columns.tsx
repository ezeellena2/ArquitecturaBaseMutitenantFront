import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { CompanyResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import type { ReactNode } from "react";
import { ListRow, RowAvatar } from "@/shared/ui/app/ListRow";
import { StatusDot } from "@/shared/ui/StatusDot";

/// Tablero M-Empresas: en el teléfono cada empresa es una fila con sus miembros a la derecha, el CUIT y, abajo, el
/// estado con su punto y la zona.
export function companyPhoneRow(company: CompanyResponse, t: TFunction, trailing: ReactNode): ReactNode {
  return <ListRow key={company.id} to={`/org/empresas/${encodeURIComponent(company.id)}`} title={company.name}
    meta={t("companies:phone.members", { count: company.memberCount })}
    lines={[company.taxId ? <TaxIdText value={company.taxId} withType /> : t("companies:withoutTaxId"),
      <span className="inline-flex max-w-full items-center gap-1"><StatusDot tone={company.status === "Active" ? "success" : "neutral"} label={t(`companies:status.${company.status}`)} className="text-[13px] text-[var(--t2)]" />
        <span className="truncate">{" · "}<TimeZoneText value={company.timeZoneId} /></span></span>]}
    trailing={trailing} />;
}

/// Tablero M-Empresa: en el teléfono cada miembro es una fila con su círculo, el correo y, abajo, sus roles y el estado.
export function companyMemberPhoneRow(member: import("@/shared/api/types").CompanyMemberResponse, t: TFunction, trailing: ReactNode): ReactNode {
  const roles = member.roles.map((role) => role.name).join(", ");
  const active = member.membershipStatus === "Active" && member.state === "Active";
  const label = t(member.membershipStatus === "Inactive" ? "companies:memberStates.Inactive" : `companies:memberStates.${member.state}`);
  return <ListRow key={member.memberId} leading={<RowAvatar name={member.displayName} />} title={member.displayName}
    lines={[member.email ?? "", <span className="inline-flex max-w-full items-center gap-1">{roles ? <span className="truncate">{roles}{" · "}</span> : null}
      <StatusDot tone={active ? "success" : member.state === "PendingDeletion" ? "warning" : "neutral"} label={label} className="text-[13px] text-[var(--t2)]" /></span>]}
    trailing={trailing} />;
}

export function createCompanyColumns(t: TFunction): Column<CompanyResponse>[] {
  return [
    {
      // Anchos del tablero Empresas: 1.6fr, 1.4fr, 100 px y 150 px, más los márgenes de cada celda.
      id: "name", header: t("companies:columns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[35%]",
      cell: (company) => <div className="min-w-0">
        <Link className="block truncate font-medium text-[var(--t1)] hover:underline" to={`/org/empresas/${encodeURIComponent(company.id)}`}>{company.name}</Link>
        <span className="block truncate text-xs text-[var(--t3)]">{company.taxId ? <TaxIdText value={company.taxId} withType /> : t("companies:withoutTaxId")}</span>
      </div>,
    },
    { id: "timeZoneId", header: t("companies:columns.timeZone"), type: "timeZone", value: (company) => company.timeZoneId },
    { id: "memberCount", header: t("companies:columns.members"), type: "integer", className: "w-[112px]", value: (company) => company.memberCount },
    { id: "status", header: t("companies:columns.status"), type: "custom", mobile: "status", className: "w-[162px] max-md:w-[38%]", cell: (company) => <span className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-[var(--t1)]">
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${company.status === "Active" ? "bg-[var(--punto-ok)]" : "bg-[var(--punto-apagado)]"}`} />
      <span className="min-w-0 truncate">{t(`companies:status.${company.status}`)}</span>
    </span> },
    { id: "actions", header: t("companies:columns.actions"), type: "actions", cell: () => <EmptyValue /> },
  ];
}

export function createCompanyMemberColumns(t: TFunction): Column<import("@/shared/api/types").CompanyMemberResponse>[] {
  return [
    // Anchos del tablero Empresa: 1.6fr, 1.4fr y 150 px, más los márgenes de cada celda.
    { id: "displayName", header: t("companies:memberColumns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[42%]", cell: (member) => <div className="min-w-0">
      <span className="block truncate font-medium text-[var(--t1)]">{member.displayName}</span>
      <span className="block truncate text-xs text-[var(--t3)]">{member.email ?? <EmptyValue />}</span>
    </div> },
    { id: "roles", header: t("companies:memberColumns.roles"), type: "text", value: (member) => member.roles.map((role) => role.name).join(", ") || null },
    { id: "state", header: t("companies:memberColumns.state"), type: "custom", mobile: "status", className: "w-[162px] max-md:w-[38%]", cell: (member) => <span className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-[var(--t1)]">
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${member.membershipStatus === "Active" && member.state === "Active" ? "bg-[var(--punto-ok)]" : member.state === "PendingDeletion" ? "bg-[var(--punto-alerta)]" : "bg-[var(--punto-apagado)]"}`} />
      <span className="min-w-0 truncate">{t(member.membershipStatus === "Inactive" ? "companies:memberStates.Inactive" : `companies:memberStates.${member.state}`)}</span>
    </span> },
  ];
}
