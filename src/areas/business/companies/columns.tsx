import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { CompanyResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import type { ReactNode } from "react";
import { ListRow, RowAvatar } from "@/shared/ui/app/ListRow";
import { defineStatusTones } from "@/shared/format/statusTones";
import type { CompanyMemberState } from "@/shared/api/types";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";

/// Tableros Empresas y Empresa: la empresa activa en verde y la inactiva en gris. También los usa la banda de la ficha.
export const companyStatusTones = defineStatusTones("CompanyStatus", { Active: "success", Inactive: "neutral" });

/// Tablero Empresa (miembros): activo en verde, la baja pedida en ámbar e inactivo en gris; la invitación pendiente, en
/// petróleo como en Usuarios (el tablero Empresa no la dibuja).
export const companyMemberStateTones = defineStatusTones("CompanyMemberState", {
  Active: "success", PendingDeletion: "warning", Inactive: "neutral", Invited: "pending",
});

/// Tablero M-Empresas: en el teléfono cada empresa es una fila con sus miembros a la derecha, el CUIT y, abajo, el
/// estado con su punto y la zona.
export function companyPhoneRow(company: CompanyResponse, t: TFunction, trailing: ReactNode): ReactNode {
  return <ListRow key={company.id} to={`/org/empresas/${encodeURIComponent(company.id)}`} title={company.name}
    meta={t("companies:phone.members", { count: company.memberCount })}
    lines={[company.taxId ? <TaxIdText key="taxId" value={company.taxId} withType /> : t("companies:withoutTaxId"),
      <span key="state" className="inline-flex max-w-full items-center gap-1"><StatusBadge tones={companyStatusTones} value={company.status} className="text-[13px] text-[var(--t2)]" />
        <span className="truncate">{" · "}<TimeZoneText value={company.timeZoneId} /></span></span>]}
    trailing={trailing} />;
}

type CompanyMember = import("@/shared/api/types").CompanyMemberResponse;

// El estado de un miembro, igual en la compu y en el teléfono: quitado de la empresa es «Inactivo»; si no, el de la persona.
function memberState(member: CompanyMember): CompanyMemberState {
  return member.membershipStatus === "Inactive" ? "Inactive" : member.state;
}

/// Tablero M-Empresa: en el teléfono cada miembro es una fila con su círculo, el correo y, abajo, sus roles y el estado.
export function companyMemberPhoneRow(member: CompanyMember, trailing: ReactNode): ReactNode {
  const roles = member.roles.map((role) => role.name).join(", ");
  return <ListRow key={member.memberId} leading={<RowAvatar name={member.displayName} />} title={member.displayName}
    lines={[member.email ?? "", <span key="state" className="inline-flex max-w-full items-center gap-1">{roles ? <span className="truncate">{roles}{" · "}</span> : null}
      <StatusBadge tones={companyMemberStateTones} value={memberState(member)} className="text-[12.5px] text-[var(--t2)]" /></span>]}
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
    { id: "status", header: t("companies:columns.status"), type: "status", tones: companyStatusTones, value: (company) => company.status, mobile: "status", className: "w-[162px] max-md:w-[38%]" },
  ];
}

export function createCompanyMemberColumns(t: TFunction): Column<CompanyMember>[] {
  return [
    // Anchos del tablero Empresa: 1.6fr, 1.4fr y 150 px, más los márgenes de cada celda. Debajo del nombre, el correo.
    { id: "displayName", header: t("companies:memberColumns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[42%]",
      cell: (member) => <span className="block truncate font-medium text-[var(--t1)]">{member.displayName}</span>,
      detail: (member) => member.email },
    { id: "roles", header: t("companies:memberColumns.roles"), type: "text", value: (member) => member.roles.map((role) => role.name).join(", ") || null },
    { id: "state", header: t("companies:memberColumns.state"), type: "status", tones: companyMemberStateTones, value: memberState, mobile: "status", className: "w-[162px] max-md:w-[38%]" },
  ];
}
