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
        {user.displayName && user.email && user.displayName !== user.email ? <span className="hidden truncate text-xs text-[var(--t3)] md:block">{user.email}</span> : null}
      </div>,
    },
    {
      id: "roles", header: t("users:columns.organizationRoles"), type: "text",
      value: (user) => user.roles.filter((role) => role.scope === "Organization").map((role) => role.name).join(", ") || null,
    },
    {
      id: "companies", header: t("users:columns.companies"), type: "custom",
      // Tablero Usuarios: la primera empresa con «y N más», y debajo sus roles.
      cell: (user) => {
        const [first, ...others] = user.companies;
        if (!first) return <EmptyValue />;
        return <span className="block min-w-0">
          <span className="block truncate text-[var(--t1)]">{others.length > 0 ? t("users:columns.companyAndMore", { company: first.companyName, count: others.length }) : first.companyName}</span>
          {first.roles.length > 0 ? <span className="block truncate text-xs text-[var(--t3)]">{first.roles.map((role) => role.name).join(", ")}</span> : null}
        </span>;
      },
    },
    {
      id: "state", header: t("users:columns.state"), type: "custom", mobile: "status", className: "w-[18%] max-md:w-[38%]",
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
