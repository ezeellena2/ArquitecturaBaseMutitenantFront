import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { CompanyResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { TaxIdText } from "@/shared/ui/format/TaxIdText";
import { TimeZoneText } from "@/shared/ui/format/TimeZoneText";
import type { ReactNode } from "react";
import { ListCard, RowAvatar } from "@/shared/ui/app/ListRow";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { NumberText } from "@/shared/ui/format/NumberText";
import { defineStatusTones, type StatusTones } from "@/shared/format/statusTones";
import type { CompanyMemberState } from "@/shared/api/types";
import { DateText } from "@/shared/ui/format/DateText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { isPast } from "@/shared/time/serverClock";
import { InvitationDeliveryBadge, type InvitationChannel } from "@/shared/ui/InvitationDelivery";

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

/// Tablero M-Filas-Base2 (M-Empresas, 263): en el teléfono cada empresa es una tarjeta con su estado, sus miembros, el CUIT
/// (sin CUIT, una raya) y la zona, cada dato con su nombre.
export function companyPhoneRow(company: CompanyResponse, t: TFunction, trailing: ReactNode): ReactNode {
  return <ListCard key={company.id} to={`/org/empresas/${encodeURIComponent(company.id)}`} title={company.name} fields={[
    { label: t("companies:columns.status"), value: <StatusBadge tones={companyStatusTones} value={company.status} /> },
    { label: t("companies:columns.members"), value: <NumberText value={company.memberCount} /> },
    { label: t("companies:columns.taxId"), value: <TaxIdText value={company.taxId} /> },
    { label: t("companies:columns.timeZone"), value: <TimeZoneText value={company.timeZoneId} /> },
  ]} trailing={trailing} />;
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

/// Por dónde salió la invitación de un miembro: por correo o, la de un teléfono (sin correo), por WhatsApp.
export function memberInvitationChannel(member: CompanyMember): InvitationChannel {
  return member.email ? "email" : "whatsapp";
}

/// Cómo salió la invitación pendiente de un miembro (Empresa-Base2, 0066 §4), con su porqué en la (i); sin invitación, la raya.
function invitationDelivery(member: CompanyMember): ReactNode {
  return <InvitationDeliveryBadge value={isCompanyInvitation(member) ? member.invitationDelivery : null} channel={memberInvitationChannel(member)} />;
}

/// Hasta cuándo vale una invitación, en su columna «Vence» (un dato por celda) y en su dato de la tarjeta del teléfono.
function invitationExpiresAt(member: CompanyMember): string | null {
  return isCompanyInvitation(member) ? member.invitationExpiresAtUtc ?? null : null;
}

/// Tablero M-Empresa-Base2 (263): en el teléfono cada miembro es una tarjeta con su círculo, sus roles y su estado; una
/// invitación lleva primero el estado y su entrega (0066 §4), con su (i), y suma hasta cuándo vale. Cada dato con su nombre,
/// sin el correo.
export function companyMemberPhoneRow(member: CompanyMember, t: TFunction, trailing: ReactNode): ReactNode {
  const roles = { label: t("companies:card.roles"), value: member.roles.map((role) => role.name).join(", ") || <EmptyValue /> };
  const state = { label: t("companies:memberColumns.state"), value: <StatusBadge tones={companyMemberStateTones} value={memberState(member)} /> };
  const expiresAt = invitationExpiresAt(member);
  return <ListCard key={member.memberId} leading={<RowAvatar name={member.displayName} />} title={member.displayName}
    fields={expiresAt ? [state, { label: t("common:invitationDelivery.column"), value: invitationDelivery(member) }, roles,
      { label: t("companies:memberColumns.expires"), value: <DateText value={expiresAt} kind="dateTime" /> }] : [roles, state]}
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
    // Tablero Empresa-Base2 (0066 §4): cómo salió la invitación, después del estado.
    { id: "invitationDelivery", header: t("common:invitationDelivery.column"), type: "custom", className: "w-40", cell: invitationDelivery },
    { id: "invitationExpiresAtUtc", header: t("companies:memberColumns.expires"), type: "date", className: "w-30", value: invitationExpiresAt },
  ];
}
