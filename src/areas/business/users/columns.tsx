import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { Column } from "@/shared/ui/DataTable";
import type { OrganizationUserResponse } from "@/shared/api/types";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { DateText } from "@/shared/ui/format/DateText";
import type { ReactNode } from "react";
import { ListRow, RowAvatar } from "@/shared/ui/app/ListRow";
import { defineStatusTones } from "@/shared/format/statusTones";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import type { FormatState } from "@/shared/format/useFormat";

/// CC25 (E11): una invitación por teléfono no tiene correo; la persona se nombra por el número invitado, en E.164.
export function userContact(user: OrganizationUserResponse): ReactNode {
  return user.email ?? (user.phone ? <PhoneText value={user.phone} /> : null);
}

/// Lo mismo como texto, para los avisos y las confirmaciones («Se revocó la invitación de …»).
export function userContactText(user: OrganizationUserResponse, format: FormatState): string {
  return user.email ?? (user.phone && !format.isLoading ? format.formatPhone(user.phone) : "");
}

/// Tablero Usuarios (ESTADOS_USUARIO): activo en verde, la invitación pendiente en celeste, la vencida y la baja pedida
/// en ámbar, deshabilitado en gris. También los usa la ficha de Usuario.
export const userStateTones = defineStatusTones("OrganizationUserState", {
  Active: "success", PendingDeletion: "warning", Inactive: "neutral", Invited: "pending", Expired: "warning",
});

/// Tablero M-Usuarios: en el teléfono cada persona es una fila con su círculo, el correo y, en la línea de abajo, el
/// estado con su punto, los roles de la organización y la empresa. Una invitación sin nombre lleva «@».
export function userPhoneRow(user: OrganizationUserResponse, t: TFunction, trailing: ReactNode): ReactNode {
  const invitation = user.state === "Invited" || user.state === "Expired";
  const organizationRoles = user.roles.filter((role) => role.scope === "Organization").map((role) => role.name);
  const [first, ...others] = user.companies;
  const company = first ? (others.length > 0 ? t("users:columns.companyAndMore", { company: first.companyName, count: others.length })
    : organizationRoles.length === 0 && first.roles.length > 0 ? `${first.companyName} · ${first.roles.map((role) => role.name).join(", ")}` : first.companyName) : null;
  const details = invitation
    ? (user.invitationExpiresAtUtc ? [<>{t(user.state === "Expired" ? "users:columns.expiredInline" : "users:columns.expiresInline")} <DateText value={user.invitationExpiresAtUtc} kind="date" /></>] : [])
    : [...organizationRoles, ...(company ? [company] : [])];
  const status = <span className="inline-flex max-w-full items-center gap-1">
    <StatusBadge tones={userStateTones} value={user.state} className="text-[0.78125rem] text-[var(--t2)]" />
    {details.map((detail, index) => <span key={index}>{" · "}{detail}</span>)}
  </span>;
  const named = Boolean(user.displayName);
  return <ListRow key={user.memberId} to={`/org/usuarios/${encodeURIComponent(user.memberId)}`}
    leading={<RowAvatar name={user.displayName || user.email || ""} invitation={!named && invitation} />}
    title={user.displayName || userContact(user) || ""}
    lines={named ? [userContact(user) ?? "", status] : [company ?? "", status]}
    trailing={trailing} />;
}

export function createUserColumns(t: TFunction): Column<OrganizationUserResponse>[] {
  return [
    {
      // Tablero Usuarios (base de la 12): un dato por celda; el correo y hasta cuándo vale una invitación, en sus columnas.
      id: "displayName", header: t("users:columns.person"), type: "custom", mobile: "primary", sortable: true, className: "w-[20%]",
      cell: (user) => <Link className="font-medium text-[var(--t1)] hover:underline" to={`/org/usuarios/${encodeURIComponent(user.memberId)}`}>{user.displayName || userContact(user) || <EmptyValue />}</Link>,
    },
    { id: "email", header: t("users:columns.email"), type: "custom", className: "w-[22%]", cell: (user) => userContact(user) ?? <EmptyValue /> },
    {
      id: "roles", header: t("users:columns.organizationRoles"), type: "text", className: "w-[15%]",
      value: (user) => user.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ") || null,
    },
    {
      id: "companies", header: t("users:columns.companies"), type: "custom",
      // Tablero Usuarios: la primera empresa con «y N más».
      cell: (user) => {
        const [first, ...others] = user.companies;
        if (!first) return <EmptyValue />;
        return <span className="text-[var(--t1)]">{others.length > 0 ? t("users:columns.companyAndMore", { company: first.companyName, count: others.length }) : first.companyName}</span>;
      },
    },
    { id: "state", header: t("users:columns.state"), type: "status", tones: userStateTones, value: (user) => user.state, mobile: "status", className: "w-40.5 max-md:w-[38%]" },
    {
      id: "invitationExpiresAtUtc", header: t("users:columns.expires"), type: "date", className: "w-30",
      value: (user) => user.state === "Invited" || user.state === "Expired" ? user.invitationExpiresAtUtc ?? null : null,
    },
  ];
}
