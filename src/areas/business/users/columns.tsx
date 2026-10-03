import type { TFunction } from "i18next";
import { Link } from "react-router";
import type { Column } from "@/shared/ui/DataTable";
import type { OrganizationUserResponse } from "@/shared/api/types";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";

export function userStateLabel(state: OrganizationUserResponse["state"], t: TFunction): string {
  return t(`users:states.${state}`);
}

export function createUserColumns(t: TFunction): Column<OrganizationUserResponse>[] {
  return [
    {
      id: "displayName", header: t("users:columns.person"), type: "custom", mobile: "primary", sortable: true,
      cell: (user) => <Link className="block truncate font-medium text-[var(--marca-tx)] hover:underline" to={`/org/usuarios/${encodeURIComponent(user.memberId)}`}>{user.displayName}</Link>,
    },
    {
      id: "email", header: t("users:columns.email"), type: "custom",
      cell: (user) => <div className="min-w-0"><span className="block truncate">{user.email ?? <EmptyValue />}</span>{user.hasManagedEmail ? <span className="block text-xs text-[var(--t3)]">{t("users:managedEmail")}</span> : null}</div>,
    },
    {
      id: "roles", header: t("users:columns.organizationRoles"), type: "text",
      value: (user) => user.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ") || null,
    },
    {
      id: "companies", header: t("users:columns.companies"), type: "text",
      value: (user) => user.companies.map((company) => company.companyName).join(", ") || null,
    },
    {
      id: "companyRoles", header: t("users:columns.companyRoles"), type: "text", priority: "low",
      value: (user) => user.companies.flatMap((company) => company.roles.map((role) => `${company.companyName}: ${role.name}`)).join(", ") || null,
    },
    {
      id: "state", header: t("users:columns.state"), type: "custom", mobile: "status",
      cell: (user) => <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--t2)]">
        <span aria-hidden="true" className={`size-2 rounded-full ${user.state === "Active" ? "bg-[var(--ok)]" : user.state === "PendingDeletion" ? "bg-[var(--alerta)]" : user.state === "Inactive" ? "bg-[var(--t3)]" : "bg-[var(--marca-tx)]"}`} />
        {userStateLabel(user.state, t)}
      </span>,
    },
    {
      id: "invitationExpiresAtUtc", header: t("users:columns.expires"), type: "date", value: (user) => user.invitationExpiresAtUtc, priority: "low",
    },
  ];
}
