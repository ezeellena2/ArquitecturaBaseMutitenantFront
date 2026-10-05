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
import { StatusDetail } from "@/shared/ui/StatusDot";

/// Tablero Usuarios (ESTADOS_USUARIO): activo en verde, la invitación pendiente en petróleo, la vencida y la baja pedida
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
    ? (user.invitationExpiresAtUtc ? [<>{t(user.state === "Expired" ? "users:columns.expiredInline" : "users:columns.expiresInline")} <DateText value={user.invitationExpiresAtUtc} kind="shortDate" /></>] : [])
    : [...organizationRoles, ...(company ? [company] : [])];
  const status = <span className="inline-flex max-w-full items-center gap-1">
    <StatusBadge tones={userStateTones} value={user.state} className="text-[12.5px] text-[var(--t2)]" />
    {details.map((detail, index) => <span key={index} className="truncate">{" · "}{detail}</span>)}
  </span>;
  const named = Boolean(user.displayName);
  return <ListRow key={user.memberId} to={`/org/usuarios/${encodeURIComponent(user.memberId)}`}
    leading={<RowAvatar name={user.displayName || user.email || ""} invitation={!named && invitation} />}
    title={user.displayName || user.email || ""}
    lines={named ? [user.email ?? "", status] : [company ?? "", status]}
    trailing={trailing} />;
}

export function createUserColumns(t: TFunction): Column<OrganizationUserResponse>[] {
  return [
    {
      // Anchos del tablero Usuarios: 1.6fr, 1fr, 1.3fr y 190 px, más los márgenes de cada celda. Debajo del nombre, el
      // correo (Criterio · Tablas).
      id: "displayName", header: t("users:columns.person"), type: "custom", mobile: "primary", sortable: true, className: "w-[30%]",
      cell: (user) => <Link className="block truncate font-medium text-[var(--t1)] hover:underline" to={`/org/usuarios/${encodeURIComponent(user.memberId)}`}>{user.displayName || user.email || <EmptyValue />}</Link>,
      detail: (user) => user.displayName && user.email && user.displayName !== user.email ? user.email : null,
    },
    {
      id: "roles", header: t("users:columns.organizationRoles"), type: "text", className: "w-[19%]",
      value: (user) => user.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ") || null,
    },
    {
      id: "companies", header: t("users:columns.companies"), type: "custom",
      // Tablero Usuarios: la primera empresa con «y N más», y debajo sus roles.
      cell: (user) => {
        const [first, ...others] = user.companies;
        if (!first) return <EmptyValue />;
        return <span className="block truncate text-[var(--t1)]">{others.length > 0 ? t("users:columns.companyAndMore", { company: first.companyName, count: others.length }) : first.companyName}</span>;
      },
      detail: (user) => user.companies[0]?.roles.map((role) => role.name).join(", ") || null,
    },
    {
      id: "state", header: t("users:columns.state"), type: "status", tones: userStateTones, value: (user) => user.state, mobile: "status", className: "w-[202px] max-md:w-[38%]",
      // Una invitación dice hasta cuándo vale, debajo de la palabra del estado.
      detail: (user) => user.invitationExpiresAtUtc && (user.state === "Invited" || user.state === "Expired")
        ? <StatusDetail>{t(user.state === "Expired" ? "users:columns.expiredPrefix" : "users:columns.expiresPrefix")} <DateText value={user.invitationExpiresAtUtc} kind="date" /></StatusDetail>
        : null,
    },
  ];
}
