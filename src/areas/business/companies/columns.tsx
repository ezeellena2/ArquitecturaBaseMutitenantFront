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
import { isPast } from "@/shared/time/serverClock";
import type { FormatState } from "@/shared/format/useFormat";
import { countOf } from "@/shared/format/countOf";

/// Tableros Empresas y Empresa: la empresa activa en verde y la inactiva en gris. También los usa la banda de la ficha.
export const companyStatusTones = defineStatusTones("CompanyStatus", { Active: "success", Inactive: "neutral" });

/// Lo que dice el estado de un miembro: el del contrato o «Invitación vencida», que no es un estado del back (decisión 98).
export type CompanyMemberDisplayState = CompanyMemberState | "Expired";

const contractMemberStateTones = defineStatusTones("CompanyMemberState", {
  Active: "success", PendingDeletion: "warning", Inactive: "neutral", Invited: "pending", Expired: "warning",
});

/// Tablero Empresa (miembros, v108): activo en verde, la baja pedida en ámbar e inactivo en gris; la invitación pendiente,
/// en celeste, y la vencida, en ámbar, como en Usuarios. La palabra sale de `enums.CompanyMemberState`.
export const companyMemberStateTones: StatusTones<CompanyMemberDisplayState> = {
  enum: contractMemberStateTones.enum, tones: { ...contractMemberStateTones.tones, Expired: "warning" },
};

/// Tablero M-Empresas: en el teléfono cada empresa es una fila con sus miembros a la derecha, el CUIT y, abajo, el
/// estado con su punto y la zona.
export function companyPhoneRow(company: CompanyResponse, t: TFunction, format: FormatState, trailing: ReactNode): ReactNode {
  return <ListRow key={company.id} to={`/org/empresas/${encodeURIComponent(company.id)}`} title={company.name}
    meta={t("companies:phone.members", countOf(format, company.memberCount))}
    lines={[company.taxId ? <TaxIdText key="taxId" value={company.taxId} withType /> : t("companies:withoutTaxId"),
      <span key="state"><StatusBadge tones={companyStatusTones} value={company.status} className="text-[0.8125rem] text-[var(--t2)]" />
        <span>{" · "}<TimeZoneText value={company.timeZoneId} /></span></span>]}
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
  return isCompanyInvitation(member) && member.invitationExpiresAtUtc && isPast(member.invitationExpiresAtUtc) ? "Expired" : member.state;
}

/// Hasta cuándo vale una invitación: en la compu, en su columna «Vence» (un dato por celda); en el teléfono, «vence …» o
/// «venció …» al lado del estado (tableros Empresa y M-Empresa, v108).
function invitationExpiresAt(member: CompanyMember): string | null {
  return isCompanyInvitation(member) ? member.invitationExpiresAtUtc ?? null : null;
}

function invitationExpiry(member: CompanyMember, t: TFunction): ReactNode {
  const expiresAt = invitationExpiresAt(member);
  if (!expiresAt) return null;
  const label = memberState(member) === "Expired" ? "companies:memberColumns.expiredInline" : "companies:memberColumns.expiresInline";
  return <>{t(label)} <DateText value={expiresAt} kind="date" /></>;
}

/// Tablero M-Empresa: en el teléfono cada miembro es una fila con su círculo, el correo y, abajo, sus roles, el estado y,
/// si es una invitación, hasta cuándo vale. Esa línea no se corta: si no entra, sigue abajo (.w-conv .l3).
export function companyMemberPhoneRow(member: CompanyMember, t: TFunction, trailing: ReactNode): ReactNode {
  const roles = member.roles.map((role) => role.name).join(", ");
  const expiry = invitationExpiry(member, t);
  return <ListRow key={member.memberId} leading={<RowAvatar name={member.displayName} />} title={member.displayName}
    lines={[member.email ?? "", <span key="state">{roles ? `${roles} · ` : null}
      <StatusBadge tones={companyMemberStateTones} value={memberState(member)} className="text-[0.78125rem] text-[var(--t2)]" />
      {expiry ? <>{" · "}{expiry}</> : null}</span>]}
    trailing={trailing} />;
}

export function createCompanyColumns(t: TFunction): Column<CompanyResponse>[] {
  return [
    // Tablero Empresas (base de la 12): un dato por celda; el CUIT va en su columna y, sin CUIT, una raya.
    {
      id: "name", header: t("companies:columns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[28%]",
      cell: (company) => <Link className="font-medium text-[var(--t1)] hover:underline" to={`/org/empresas/${encodeURIComponent(company.id)}`}>{company.name}</Link>,
    },
    { id: "taxId", header: t("companies:columns.taxId"), type: "taxId", className: "w-38", value: (company) => company.taxId },
    { id: "timeZoneId", header: t("companies:columns.timeZone"), type: "timeZone", value: (company) => company.timeZoneId },
    { id: "memberCount", header: t("companies:columns.members"), type: "integer", className: "w-28", value: (company) => company.memberCount },
    { id: "status", header: t("companies:columns.status"), type: "status", tones: companyStatusTones, value: (company) => company.status, mobile: "status", className: "w-40.5 max-md:w-[38%]" },
  ];
}

export function createCompanyMemberColumns(t: TFunction): Column<CompanyMember>[] {
  return [
    // Tablero Empresa (base de la 12): un dato por celda; el correo y hasta cuándo vale una invitación, en sus columnas.
    { id: "displayName", header: t("companies:memberColumns.name"), type: "custom", mobile: "primary", sortable: true, className: "w-[24%]",
      cell: (member) => <span className="font-medium text-[var(--t1)]">{member.displayName}</span> },
    { id: "email", header: t("companies:memberColumns.email"), type: "text", value: (member) => member.email },
    { id: "roles", header: t("companies:memberColumns.roles"), type: "text", value: (member) => member.roles.map((role) => role.name).join(", ") || null },
    { id: "state", header: t("companies:memberColumns.state"), type: "status", tones: companyMemberStateTones, value: memberState, mobile: "status", className: "w-40.5 max-md:w-[38%]" },
    { id: "invitationExpiresAtUtc", header: t("companies:memberColumns.expires"), type: "date", className: "w-30", value: invitationExpiresAt },
  ];
}
