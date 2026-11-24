import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { Column } from "@/shared/ui/DataTable";
import type { OrganizationUserResponse } from "@/shared/api/types";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { DateText } from "@/shared/ui/format/DateText";
import type { ReactNode } from "react";
import { ListCard, RowAvatar } from "@/shared/ui/app/ListRow";
import { defineStatusTones } from "@/shared/format/statusTones";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { EmailText } from "@/shared/ui/format/EmailText";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import type { FormatState } from "@/shared/format/useFormat";
import { InvitationDeliveryBadge, type InvitationChannel } from "@/shared/ui/InvitationDelivery";

/// CC25 (E11): una invitación por teléfono no tiene correo; la persona se nombra por el número invitado, en E.164.
export function userContact(user: OrganizationUserResponse): ReactNode {
  return user.email ? <EmailText value={user.email} /> : user.phone ? <PhoneText value={user.phone} /> : null;
}

/// Lo mismo como texto, para los avisos y las confirmaciones («Se revocó la invitación de …»).
export function userContactText(user: OrganizationUserResponse, format: FormatState): string {
  return user.email ?? (user.phone && !format.isLoading ? format.formatPhone(user.phone) : "");
}

/// Por dónde salió la invitación de una persona: por correo o, la de un teléfono (CC25), por WhatsApp.
export function userInvitationChannel(user: OrganizationUserResponse): InvitationChannel {
  return !user.email && user.phone ? "whatsapp" : "email";
}

const isUserInvitation = (user: OrganizationUserResponse) => user.state === "Invited" || user.state === "Expired";

/// Tablero Usuarios (ESTADOS_USUARIO): activo en verde, la invitación pendiente en celeste, la vencida y la baja pedida
/// en ámbar, deshabilitado en gris. También los usa la ficha de Usuario.
export const userStateTones = defineStatusTones("OrganizationUserState", {
  Active: "success", PendingDeletion: "warning", Inactive: "neutral", Invited: "pending", Expired: "warning",
});

/// La primera empresa de la persona con «y N más» (tablero Usuarios), igual en la compu y en el teléfono.
function companiesText(user: OrganizationUserResponse, t: TFunction): string | null {
  const [first, ...others] = user.companies;
  if (!first) return null;
  return others.length > 0 ? t("users:columns.companyAndMore", { company: first.companyName, count: others.length }) : first.companyName;
}

/// Tablero M-Usuarios-Base2 (263): en el teléfono cada persona es una tarjeta con su círculo, su estado, sus roles de la
/// organización y su empresa; una invitación lleva el estado, su entrega (0066 §4), la empresa y hasta cuándo vale. Cada dato
/// con su nombre, sin el correo. Una invitación sin nombre lleva «@», o el teléfono si es por teléfono, y se nombra por su
/// correo o su número. La entrega va sin su (i): la tarjeta abre la ficha, que la muestra con su porqué.
export function userPhoneRow(user: OrganizationUserResponse, t: TFunction, trailing: ReactNode): ReactNode {
  const invitation = isUserInvitation(user);
  const state = { label: t("users:columns.state"), value: <StatusBadge tones={userStateTones} value={user.state} /> };
  const company = { label: t("users:columns.companies"), value: companiesText(user, t) ?? <EmptyValue /> };
  const roles = user.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ");
  const fields = invitation
    ? [state, { label: t("common:invitationDelivery.column"), value: <InvitationDeliveryBadge value={user.invitationDelivery} channel={userInvitationChannel(user)} info={false} /> },
      company, { label: t("users:columns.expires"), value: <DateText value={user.invitationExpiresAtUtc} kind="dateTime" /> }]
    : [state, { label: t("users:card.role"), value: roles || <EmptyValue /> }, company];
  const named = Boolean(user.displayName);
  return <ListCard key={user.memberId} to={`/org/usuarios/${encodeURIComponent(user.memberId)}`}
    leading={<RowAvatar name={user.displayName || user.email || ""} invitation={!named && invitation} phone={!user.email && Boolean(user.phone)} />}
    title={user.displayName || userContact(user) || ""} fields={fields} trailing={trailing} />;
}

export function createUserColumns(t: TFunction): Column<OrganizationUserResponse>[] {
  return [
    {
      // Tablero Usuarios (base de la 12): un dato por celda; el correo y hasta cuándo vale una invitación, en sus columnas.
      id: "displayName", header: t("users:columns.person"), type: "custom", mobile: "primary", sortable: true, className: "w-[20%]",
      cell: (user) => <Link className="font-medium text-[var(--t1)] hover:underline" to={`/org/usuarios/${encodeURIComponent(user.memberId)}`}>{user.displayName || userContact(user) || <EmptyValue />}</Link>,
    },
    // Tablero Usuarios: el correo, en gris; una invitación por teléfono no tiene correo y va con «—».
    { id: "email", header: t("users:columns.email"), type: "custom", className: "w-[22%]",
      cell: (user) => user.email ? <span className="text-[var(--t2)]"><EmailText value={user.email} /></span> : <EmptyValue /> },
    {
      id: "roles", header: t("users:columns.organizationRoles"), type: "text", className: "w-[15%]",
      value: (user) => user.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ") || null,
    },
    {
      id: "companies", header: t("users:columns.companies"), type: "custom",
      // Tablero Usuarios: la primera empresa con «y N más».
      cell: (user) => {
        const companies = companiesText(user, t);
        return companies ? <span className="text-[var(--t1)]">{companies}</span> : <EmptyValue />;
      },
    },
    { id: "state", header: t("users:columns.state"), type: "status", tones: userStateTones, value: (user) => user.state, mobile: "status", className: "w-40.5 max-md:w-[38%]" },
    // Tablero Usuarios-Base2 (0066 §4): cómo salió la invitación, después del estado, con su porqué en la (i).
    { id: "invitationDelivery", header: t("common:invitationDelivery.column"), type: "custom", className: "w-40",
      cell: (user) => <InvitationDeliveryBadge value={isUserInvitation(user) ? user.invitationDelivery : null} channel={userInvitationChannel(user)} /> },
    {
      id: "invitationExpiresAtUtc", header: t("users:columns.expires"), type: "date", className: "w-30",
      value: (user) => isUserInvitation(user) ? user.invitationExpiresAtUtc ?? null : null,
    },
  ];
}
