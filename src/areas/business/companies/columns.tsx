import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { CompanyResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import type { ReactNode } from "react";
import { ListRow, RowAvatar } from "@/shared/ui/app/ListRow";
import { defineStatusTones, type StatusTones } from "@/shared/format/statusTones";
import type { CompanyMemberState } from "@/shared/api/types";
import { DateText } from "@/shared/ui/format/DateText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { StatusDetail } from "@/shared/ui/StatusDot";

/// Tableros Empresas y Empresa: la empresa activa en verde y la inactiva en gris. También los usa la banda de la ficha.
export const companyStatusTones = defineStatusTones("CompanyStatus", { Active: "success", Inactive: "neutral" });

/// Lo que dice el estado de un miembro: el del contrato o «Invitación vencida», que no es un estado del back (decisión 98).
export type CompanyMemberDisplayState = CompanyMemberState | "Expired";

const contractMemberStateTones = defineStatusTones("CompanyMemberState", {
  Active: "success", PendingDeletion: "warning", Inactive: "neutral", Invited: "pending",
});

/// Tablero Empresa (miembros, v108): activo en verde, la baja pedida en ámbar e inactivo en gris; la invitación pendiente,
/// en petróleo, y la vencida, en ámbar, como en Usuarios. La palabra sale de `enums.CompanyMemberState`.
export const companyMemberStateTones: StatusTones<CompanyMemberDisplayState> = {
  enum: contractMemberStateTones.enum, tones: { ...contractMemberStateTones.tones, Expired: "warning" },
};

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

/// Una invitación pendiente de la empresa: la persona está invitada y su membresía sigue activa.
export function isCompanyInvitation(member: CompanyMember): boolean {
  return member.state === "Invited" && member.membershipStatus !== "Inactive";
}

// El estado de un miembro, igual en la compu y en el teléfono: quitado de la empresa es «Inactivo»; una invitación cuya
// fecha ya pasó, «Invitación vencida» (el back la deja en «Invitado», B8); si no, el de la persona.
function memberState(member: CompanyMember): CompanyMemberDisplayState {
  if (member.membershipStatus === "Inactive") return "Inactive";
  return isCompanyInvitation(member) && member.invitationExpiresAtUtc && Date.parse(member.invitationExpiresAtUtc) <= Date.now() ? "Expired" : member.state;
}

/// Hasta cuándo vale una invitación: «Vence …» o «Venció …» debajo del estado en la compu (Criterio · Tablas) y «vence …»
/// o «venció …», con la fecha corta, al lado del estado en el teléfono (tableros Empresa y M-Empresa, v108).
function invitationExpiry(member: CompanyMember, t: TFunction, phone: boolean): ReactNode {
  if (!isCompanyInvitation(member) || !member.invitationExpiresAtUtc) return null;
  const expired = memberState(member) === "Expired";
  const label = phone ? (expired ? "companies:memberColumns.expiredInline" : "companies:memberColumns.expiresInline")
    : expired ? "companies:memberColumns.expiredPrefix" : "companies:memberColumns.expiresPrefix";
  return <>{t(label)} <DateText value={member.invitationExpiresAtUtc} kind={phone ? "shortDate" : "date"} /></>;
}

/// Tablero M-Empresa: en el teléfono cada miembro es una fila con su círculo, el correo y, abajo, sus roles, el estado y,
/// si es una invitación, hasta cuándo vale. Esa línea no se corta: si no entra, sigue abajo (.w-conv .l3).
export function companyMemberPhoneRow(member: CompanyMember, t: TFunction, trailing: ReactNode): ReactNode {
  const roles = member.roles.map((role) => role.name).join(", ");
  const expiry = invitationExpiry(member, t, true);
  return <ListRow key={member.memberId} leading={<RowAvatar name={member.displayName} />} title={member.displayName} wrapLines
    lines={[member.email ?? "", <span key="state">{roles ? `${roles} · ` : null}
      <StatusBadge tones={companyMemberStateTones} value={memberState(member)} className="text-[12.5px] text-[var(--t2)]" />
      {expiry ? <>{" · "}{expiry}</> : null}</span>]}
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
    // Anchos del tablero Empresa: 1.6fr, 1.4fr y 150 px, más los márgenes de cada celda (con «Miembro» en el 41,5 %, «Roles en
    // la empresa» arranca donde el tablero). Debajo del nombre, el correo.
    { id: "displayName", header: t("companies:memberColumns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[41.5%]",
      cell: (member) => <span className="block truncate font-medium text-[var(--t1)]">{member.displayName}</span>,
      detail: (member) => member.email },
    { id: "roles", header: t("companies:memberColumns.roles"), type: "text", value: (member) => member.roles.map((role) => role.name).join(", ") || null },
    { id: "state", header: t("companies:memberColumns.state"), type: "status", tones: companyMemberStateTones, value: memberState, mobile: "status", className: "w-[162px] max-md:w-[38%]",
      // Una invitación dice hasta cuándo vale, debajo de la palabra del estado.
      detail: (member) => { const expiry = invitationExpiry(member, t, false); return expiry ? <StatusDetail>{expiry}</StatusDetail> : null; } },
  ];
}
