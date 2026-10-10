import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { PlatformRecoveryResponse, PlatformTenantResponse } from "@/shared/api/types";
import { recoveryStatusTones, tenantStatusTones } from "@/shared/format/statusTones";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Surface } from "@/shared/ui/Surface";
import { LoginMethodText } from "@/shared/ui/format/LoginMethodText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { fetchPendingOrganizations, fetchPendingRecoveries, platformPendingQueryKey } from "../api/pending";

type PendingRow = { kind: "organization"; data: PlatformTenantResponse } | { kind: "recovery"; data: PlatformRecoveryResponse };

/** Bloque del núcleo de Plataforma: el módulo recibe únicamente su contenido. */
export function PlatformToResolve() {
  const { t } = useTranslation(["home", "platformTenants", "platformRecoveries"]);
  const { data: me } = useCurrentUser();
  const { canPlatform } = usePermissions();
  const canOrganizations = me?.access === "platform" && canPlatform("platform.tenants.read");
  const canRecoveries = me?.access === "platform" && canPlatform("platform.recoveries.manage");
  const titleId = useId();
  const organizations = useQuery({ queryKey: platformPendingQueryKey(me?.id, "organizations"), enabled: canOrganizations, staleTime: 0,
    queryFn: ({ signal }) => fetchPendingOrganizations(signal), meta: { silent: true } });
  const recoveries = useQuery({ queryKey: platformPendingQueryKey(me?.id, "recoveries"), enabled: canRecoveries, staleTime: 0,
    queryFn: ({ signal }) => fetchPendingRecoveries(signal), meta: { silent: true } });
  if (!canOrganizations && !canRecoveries) return null;
  const rows: PendingRow[] = [
    ...(canOrganizations ? organizations.data?.flatMap((page) => page.items.map((data): PendingRow => ({ kind: "organization", data }))) ?? [] : []),
    ...(canRecoveries ? recoveries.data?.flatMap((page) => page.items.map((data): PendingRow => ({ kind: "recovery", data }))) ?? [] : []),
  ];
  const columns: Column<PendingRow>[] = [
    { id: "title", header: t("home:toResolve.pending"), type: "custom", mobile: "primary", className: "w-[33%]", cell: (row) => row.kind === "organization" ? row.data.name : <LoginMethodText type={row.data.previousMethodType} value={row.data.previousMethod} />,
      detail: (row) => row.kind === "organization" ? row.data.ownerName : row.data.accountId ? row.data.accountName : null },
    { id: "area", header: t("home:toResolve.area"), type: "text", className: "w-[21%]", value: (row) => t(row.kind === "organization" ? "platformTenants:title" : "platformRecoveries:title") },
    { id: "state", header: t("home:toResolve.state"), type: "custom", cell: (row) => row.kind === "organization" ? <StatusBadge tones={tenantStatusTones} value={row.data.status} /> : <StatusBadge tones={recoveryStatusTones} value={row.data.status} /> },
    { id: "since", header: t("home:toResolve.since"), type: "date", className: "w-[104px]", value: (row) => row.data.createdAtUtc },
    { id: "action", header: t("home:toResolve.action"), type: "actions", className: "w-[96px]!", cell: (row) => <Link className="text-[13px] font-semibold text-[var(--marca-tx)] hover:underline" to={row.kind === "organization" ? `/plataforma/organizaciones/${encodeURIComponent(row.data.id)}` : "/plataforma/recuperaciones?status=Pending"}>{t("platformRecoveries:actions.review")}</Link> },
  ];
  const error = (canOrganizations ? organizations.error : null) ?? (canRecoveries ? recoveries.error : null);
  const loading = canOrganizations && organizations.isLoading || canRecoveries && recoveries.isLoading;
  return <Surface className="overflow-hidden"><section aria-labelledby={titleId}>
    <div className="flex items-center gap-2 px-4 py-3"><h2 id={titleId} className="text-[15px] font-semibold text-[var(--t1)]">{t("home:toResolve.title")}</h2>
      {!loading && !error ? <span className="text-[13px] font-semibold text-[var(--t3)]"><NumberText value={rows.length} /></span> : null}</div>
    <DataTable columns={columns} rows={rows} rowKey={(row) => `${row.kind}:${row.data.id}`} isLoading={loading} error={error ? apiErrorMessage(error, t) : undefined}
      emptyTitle={t("home:toResolve.empty")} onRetry={() => { if (canOrganizations) void organizations.refetch(); if (canRecoveries) void recoveries.refetch(); }} />
  </section></Surface>;
}
