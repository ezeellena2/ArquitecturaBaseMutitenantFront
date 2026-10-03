import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { Column } from "@/shared/ui/DataTable";
import type { OrganizationUserResponse } from "@/shared/api/types";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { DateText } from "@/shared/ui/format/DateText";

export function userStateLabel(state: OrganizationUserResponse["state"], t: TFunction): string {
  return t(`users:states.${state}`);
}

export function createUserColumns(t: TFunction): Column<OrganizationUserResponse>[] {
  return [
    {
      id: "displayName", header: t("users:columns.person"), type: "custom", mobile: "primary", sortable: true,
      cell: (user) => <div className="min-w-0">
        <Link className="block truncate font-medium text-[var(--marca-tx)] hover:underline" to={`/org/usuarios/${encodeURIComponent(user.memberId)}`}>{user.displayName || user.email || <EmptyValue />}</Link>
        {user.displayName && user.email ? <span className="block truncate text-xs text-[var(--t3)]">{user.email}</span> : null}
      </div>,
    },
    {
      id: "roles", header: t("users:columns.organizationRoles"), type: "text",
      value: (user) => user.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ") || null,
    },
    {
      id: "companies", header: t("users:columns.companies"), type: "custom",
      cell: (user) => user.companies.length === 0 ? <EmptyValue /> : <div className="flex min-w-0 flex-col gap-1">
        {user.companies.map((company) => <span key={company.companyId} className="min-w-0">
          <span className="block truncate text-[var(--t1)]">{company.companyName}</span>
          <span className="block truncate text-xs text-[var(--t3)]">{company.roles.map((role) => role.name).join(", ") || <EmptyValue />}</span>
        </span>)}
      </div>,
    },
    {
      id: "state", header: t("users:columns.state"), type: "custom", mobile: "status",
      cell: (user) => <span className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--t2)]">
          <span aria-hidden="true" className={`size-2 rounded-full ${user.state === "Active" ? "bg-[var(--ok)]" : user.state === "PendingDeletion" ? "bg-[var(--alerta)]" : user.state === "Inactive" ? "bg-[var(--t3)]" : "bg-[var(--marca-tx)]"}`} />
          {userStateLabel(user.state, t)}
        </span>
        {user.invitationExpiresAtUtc && (user.state === "Invited" || user.state === "Expired") ? <span className="text-xs text-[var(--t3)]">{t(user.state === "Expired" ? "users:columns.expiredPrefix" : "users:columns.expiresPrefix")} <DateText value={user.invitationExpiresAtUtc} kind="date" /></span> : null}
      </span>,
    },
  ];
}
