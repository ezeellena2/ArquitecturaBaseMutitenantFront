import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { CompanyResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import type { ReactNode } from "react";
import { ListRow, RowAvatar } from "@/shared/ui/app/ListRow";
import { StatusDot, type StatusTone } from "@/shared/ui/StatusDot";

/// Tablero M-Empresas: en el teléfono cada empresa es una fila con sus miembros a la derecha, el CUIT y, abajo, el
/// estado con su punto y la zona.
export function companyPhoneRow(company: CompanyResponse, t: TFunction, trailing: ReactNode): ReactNode {
  return <ListRow key={company.id} to={`/org/empresas/${encodeURIComponent(company.id)}`} title={company.name}
    meta={t("companies:phone.members", { count: company.memberCount })}
    lines={[company.taxId ? <TaxIdText key="taxId" value={company.taxId} withType /> : t("companies:withoutTaxId"),
      <span key="state" className="inline-flex max-w-full items-center gap-1"><StatusDot tone={company.status === "Active" ? "success" : "neutral"} label={t(`companies:status.${company.status}`)} className="text-[13px] text-[var(--t2)]" />
        <span className="truncate">{" · "}<TimeZoneText value={company.timeZoneId} /></span></span>]}
    trailing={trailing} />;
}

type CompanyMember = import("@/shared/api/types").CompanyMemberResponse;

// El estado de un miembro, igual en la compu y en el teléfono: activo en verde, la baja pedida en ámbar y el resto en gris.
function memberTone(member: CompanyMember): StatusTone {
  return member.membershipStatus === "Active" && member.state === "Active" ? "success" : member.state === "PendingDeletion" ? "warning" : "neutral";
}

function memberStateLabel(member: CompanyMember, t: TFunction): string {
  return t(member.membershipStatus === "Inactive" ? "companies:memberStates.Inactive" : `companies:memberStates.${member.state}`);
}

/// Tablero M-Empresa: en el teléfono cada miembro es una fila con su círculo, el correo y, abajo, sus roles y el estado.
export function companyMemberPhoneRow(member: CompanyMember, t: TFunction, trailing: ReactNode): ReactNode {
  const roles = member.roles.map((role) => role.name).join(", ");
  return <ListRow key={member.memberId} leading={<RowAvatar name={member.displayName} />} title={member.displayName}
    lines={[member.email ?? "", <span key="state" className="inline-flex max-w-full items-center gap-1">{roles ? <span className="truncate">{roles}{" · "}</span> : null}
      <StatusDot tone={memberTone(member)} label={memberStateLabel(member, t)} className="text-[12.5px] text-[var(--t2)]" /></span>]}
    trailing={trailing} />;
}

export function createCompanyColumns(t: TFunction): Column<CompanyResponse>[] {
  return [
    {
      // Anchos del tablero Empresas: 1.6fr, 1.4fr, 100 px y 150 px, más los márgenes de cada celda. Debajo del nombre, el
      // CUIT o «Sin CUIT» (Criterio · Tablas).
      id: "name", header: t("companies:columns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[35%]",
      cell: (company) => <Link className="block truncate font-medium text-[var(--t1)] hover:underline" to={`/org/empresas/${encodeURIComponent(company.id)}`}>{company.name}</Link>,
      detail: (company) => company.taxId ? <TaxIdText value={company.taxId} withType /> : t("companies:withoutTaxId"),
    },
    { id: "timeZoneId", header: t("companies:columns.timeZone"), type: "timeZone", value: (company) => company.timeZoneId },
    { id: "memberCount", header: t("companies:columns.members"), type: "integer", className: "w-[112px]", value: (company) => company.memberCount },
    { id: "status", header: t("companies:columns.status"), type: "custom", mobile: "status", className: "w-[162px] max-md:w-[38%]",
      cell: (company) => <StatusDot tone={company.status === "Active" ? "success" : "neutral"} label={t(`companies:status.${company.status}`)} /> },
  ];
}

export function createCompanyMemberColumns(t: TFunction): Column<CompanyMember>[] {
  return [
    // Anchos del tablero Empresa: 1.6fr, 1.4fr y 150 px, más los márgenes de cada celda. Debajo del nombre, el correo.
    { id: "displayName", header: t("companies:memberColumns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[42%]",
      cell: (member) => <span className="block truncate font-medium text-[var(--t1)]">{member.displayName}</span>,
      detail: (member) => member.email },
    { id: "roles", header: t("companies:memberColumns.roles"), type: "text", value: (member) => member.roles.map((role) => role.name).join(", ") || null },
    { id: "state", header: t("companies:memberColumns.state"), type: "custom", mobile: "status", className: "w-[162px] max-md:w-[38%]",
      cell: (member) => <StatusDot tone={memberTone(member)} label={memberStateLabel(member, t)} /> },
  ];
}
