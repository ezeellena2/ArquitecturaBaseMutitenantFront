import { keepPreviousData, useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Power, RotateCw, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import type { PlatformAccountDetailResponse, PlatformAccountKind, PlatformAccountResponse, PlatformAccountState } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterBar } from "@/shared/ui/FilterBar";
import { CloseIcon, LogOutIcon, UsersIcon } from "@/shared/ui/icons";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { accountCountsQueryKey, accountQueryKey, accountsQueryKey, accountsQueryRoot, fetchAccountCounts, fetchAccounts, type AccountsQuery } from "../api/accounts";
import { resendOperatorInvitation } from "../api/operators";
import { accountName, accountPhoneRow, createAccountColumns, isOperatorInvitation } from "../columns";
import { AccountDeletionDialog, AccountReasonDialog, RevokeInvitationDialog, type AccountConfirmation as Confirmation } from "../components/AccountDialogs";
import { InviteOperatorDialog } from "../components/InviteOperatorDialog";
import { accountStateConflictCodes } from "../errors";

const filterKeys = ["kind", "state"] as const;
const kinds: readonly (PlatformAccountKind | undefined)[] = [undefined, "Person", "Operator"];
const states: readonly (PlatformAccountState | undefined)[] = [undefined, "Active", "Invited", "InvitationExpired", "Suspended", "NeedsRecovery", "PendingDeletion", "Deleted"];

/** El hook vive por cuenta: Retry A funciona aunque otro envío haya retirado su observer. */
function AccountActions({ account, self, canManage, canInvite, route, onConfirm }: { account: PlatformAccountResponse; self: boolean; canManage: boolean; canInvite: boolean; route: string; onConfirm: (confirmation: Confirmation) => void }) {
  const { t } = useTranslation("platformAccounts"); const client = useQueryClient(); const invitation = isOperatorInvitation(account);
  const operationId = useId(); const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const allowed = !self && canInvite && invitation;
  useEffect(() => client.getMutationCache().subscribe((event) => {
    if (!active.current || !allowed || event.type !== "updated" || event.action.type !== "error" || event.mutation.meta?.operatorResend !== operationId || !(event.mutation.state.error instanceof ApiError)) return;
    const error = event.mutation.state.error;
    toastActionError(error, t);
    if (error.code === "General.ConcurrencyConflict" || accountStateConflictCodes.some((code) => code === error.code)) void client.invalidateQueries({ queryKey: accountsQueryRoot });
  }), [allowed, client, operationId, t]);
  const resend = useIdempotentMutation(async (operation: { id: string; name: string }, key) => {
    if (!active.current || !allowed) throw new DOMException("", "AbortError");
    try {
      const response = await resendOperatorInvitation(operation.id, key);
      if (!active.current || !allowed) throw new DOMException("", "AbortError");
      toast.success(t("messages.resent", { name: operation.name })); void client.invalidateQueries({ queryKey: accountsQueryRoot }); return response;
    } catch (error) {
      if (!active.current || !allowed) throw new DOMException("", "AbortError");
      throw error;
    }
  }, { meta: { operatorResend: operationId }, sameOperation: (previous, next) => previous.id === next.id });
  const busy = useIsMutating({ predicate: (mutation) => mutation.meta?.operatorResend === operationId }) > 0;
  if (self || account.state === "PendingDeletion" || account.state === "Deleted") return null;
  const confirm = (action: Confirmation["action"], trigger: HTMLElement | null) => onConfirm({ account, action, trigger, route });
  return <RowActions label={t("rowActions", { name: accountName(account) })} title={accountName(account)} actions={[
    { label: t("actions.resend"), accessibleName: t("actions.resend"), icon: RotateCw, hidden: !canInvite || !invitation || busy, onSelect: () => resend.mutate({ id: account.id, name: accountName(account) }) },
    { label: t("actions.revoke-sessions"), accessibleName: t("actions.revoke-sessions"), icon: LogOutIcon, hidden: !canManage || invitation, onSelect: (trigger) => confirm("revoke-sessions", trigger) },
    { label: t("actions.reactivate"), accessibleName: t("actions.reactivate"), icon: Power, hidden: !canManage || account.state !== "Suspended", onSelect: (trigger) => confirm("reactivate", trigger) },
    { label: t("actions.revoke"), accessibleName: t("actions.revoke"), icon: CloseIcon, destructive: true, hidden: !canInvite || !invitation || busy, onSelect: (trigger) => confirm("revoke", trigger) },
    { label: t("actions.suspend"), accessibleName: t("actions.suspend"), icon: Power, destructive: true, hidden: !canManage || !["Active", "NeedsRecovery"].includes(account.state), onSelect: (trigger) => confirm("suspend", trigger) },
    { label: t("actions.deletion"), accessibleName: t("actions.deletion"), icon: Trash2, destructive: true, hidden: !canManage || invitation, onSelect: (trigger) => confirm("deletion", trigger) },
  ]} />;
}

export function AccountsPage() {
  const { t } = useTranslation(["platformAccounts", "common"]); const format = useFormat(); const client = useQueryClient(); const location = useLocation();
  const { data: currentUser } = useCurrentUser(); const { canPlatform } = usePermissions();
  const canManage = canPlatform("platform.accounts.manage"); const canInvite = canPlatform("platform.operators.manage");
  const { filters, pagination, query, result: accounts, paginationProps } = usePagedQuery({ filterKeys, defaultSort: "displayName",
    toQuery: (page, values): AccountsQuery => ({ ...page, kind: kinds.find((value) => value === values.kind), state: states.find((value) => value === values.state) }),
    queryKey: accountsQueryKey, queryFn: fetchAccounts, meta: { silent: true, blocksView: true } });
  const countQuery = { search: query.search, kind: query.kind, state: query.state };
  const counts = useQuery({ queryKey: accountCountsQueryKey(countQuery), queryFn: () => fetchAccountCounts(countQuery), placeholderData: keepPreviousData, meta: { silent: true } });
  const globalCounts = useQuery({ queryKey: accountCountsQueryKey({}), queryFn: () => fetchAccountCounts({}), meta: { silent: true } });
  const route = location.pathname + location.search;
  const [inviteRoute, setInviteRoute] = useState<string | null>(null); const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [dialogRoute, setDialogRoute] = useState(route);
  if (dialogRoute !== route) { setDialogRoute(route); setInviteRoute(null); setConfirmation(null); }
  if (inviteRoute && !canInvite) setInviteRoute(null);
  const invalidate = async () => client.invalidateQueries({ queryKey: accountsQueryRoot });
  const rowActions = (account: PlatformAccountResponse) => <AccountActions key={`${route}:${account.id}:${currentUser?.id !== account.id && canInvite && isOperatorInvitation(account)}`} account={account} route={route} self={currentUser?.id === account.id} canManage={canManage} canInvite={canInvite} onConfirm={setConfirmation} />;
  const columns: Column<PlatformAccountResponse>[] = [...createAccountColumns(t), { id: "actions", header: t("platformAccounts:columns.actions"), type: "actions", cell: rowActions }];
  const suspended = globalCounts.data?.states.find((item) => item.state === "Suspended")?.count ?? 0;
  const summary = globalCounts.data ? t("platformAccounts:summary", { total: format.formatInteger(globalCounts.data.total), suspended: format.formatInteger(suspended), count: suspended }) : undefined;
  const filtered = Boolean(pagination.search || query.kind || query.state);
  const currentTarget = accounts.data?.items.find((account) => account.id === confirmation?.account.id);
  const stateAllowsAction = currentTarget && !isOperatorInvitation(currentTarget) && !["PendingDeletion", "Deleted"].includes(currentTarget.state)
    && (confirmation?.action !== "suspend" || ["Active", "NeedsRecovery"].includes(currentTarget.state))
    && (confirmation?.action !== "reactivate" || currentTarget.state === "Suspended");
  const permitted = confirmation?.action === "revoke" ? canInvite && currentTarget && isOperatorInvitation(currentTarget) : canManage && stateAllowsAction;
  const activeConfirmation = confirmation?.route === route && permitted && currentTarget?.id !== currentUser?.id ? confirmation : null;
  if (confirmation && !activeConfirmation) setConfirmation(null);
  const close = () => setConfirmation((current) => current === activeConfirmation ? null : current);
  const success = (detail: PlatformAccountDetailResponse | undefined) => {
    if (!activeConfirmation) return;
    const name = accountName(activeConfirmation.account); const action = activeConfirmation.action;
    if (action === "deletion") {
      if (detail) client.setQueryData(accountQueryKey(detail.id), detail);
      toast.success(t(detail?.deletion?.scheduledForUtc ? "platformAccounts:messages.deletion" : "platformAccounts:messages.deletedWithoutDate", { name, date: detail?.deletion?.scheduledForUtc ? format.formatDate(detail.deletion.scheduledForUtc) : "" }));
    } else toast.success(t(action === "revoke" ? "platformAccounts:messages.revoked" : `platformAccounts:messages.${action}`, { name }));
    void invalidate();
  };
  return <>
    <Page icon={UsersIcon} title={t("platformAccounts:title")} summary={summary} phoneSubtitle={t("platformAccounts:platform")} phoneBody="flush"
      fab={canInvite ? { label: t("platformAccounts:invite.title"), onClick: () => setInviteRoute(route) } : undefined}
      actions={canInvite ? <Button onClick={() => setInviteRoute(route)}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("platformAccounts:invite.title")}</Button> : undefined}>
      <div className="flex flex-col gap-3 md:gap-3.5">
        <FilterBar label={t("platformAccounts:filters.label")} searchLabel={t("platformAccounts:filters.search")} searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch} clearLabel={t("common:actions.clear")} onClear={filters.clear}
          filters={[
            { key: "kind", label: t("platformAccounts:filters.kind"), menuLabel: t("platformAccounts:filters.kindMenu"), value: query.kind ?? "", active: query.kind !== undefined, onChange: (value) => filters.setFilter("kind", value === "all" ? undefined : value), options: kinds.map((value) => ({ value: value ?? "all", label: t(`platformAccounts:filters.kinds.${value ?? "all"}`), count: counts.data ? value ? counts.data.kinds.find((item) => item.kind === value)?.count ?? 0 : counts.data.kinds.reduce((sum, item) => sum + item.count, 0) : undefined })) },
            { key: "state", label: t("platformAccounts:filters.state"), menuLabel: t("platformAccounts:filters.stateMenu"), value: query.state ?? "", active: query.state !== undefined, onChange: (value) => filters.setFilter("state", value === "all" ? undefined : value), options: states.map((value) => ({ value: value ?? "all", label: t(`platformAccounts:filters.states.${value ?? "all"}`), count: counts.data ? value ? counts.data.states.find((item) => item.state === value)?.count ?? 0 : counts.data.states.reduce((sum, item) => sum + item.count, 0) : undefined })) },
          ]} />
        <Surface className="overflow-hidden" phoneFlush><DataTable columns={columns} rows={accounts.data?.items ?? []} rowKey={(account) => account.id} mobileRow={(account) => accountPhoneRow(account, t, rowActions(account))}
          isLoading={accounts.isPending} isFetching={accounts.isFetching} error={accounts.error ? apiErrorMessage(accounts.error, t) : undefined} onRetry={() => { void accounts.refetch(); void counts.refetch(); void globalCounts.refetch(); }}
          emptyTitle={t("platformAccounts:empty.filtered")} emptyAction={filtered ? <Button variant="outline" onClick={filters.clear}>{t("platformAccounts:empty.clear")}</Button> : undefined} sort={pagination.sort} onSortChange={pagination.toggleSort} />
          {paginationProps ? <Pagination {...paginationProps} /> : null}</Surface>
      </div>
    </Page>
    {inviteRoute === route && canInvite ? <InviteOperatorDialog key={route} onClose={() => setInviteRoute(null)} onInvited={invalidate} /> : null}
    {activeConfirmation ? activeConfirmation.action === "revoke" ? <RevokeInvitationDialog key={activeConfirmation.account.id + activeConfirmation.action + route} confirmation={activeConfirmation} onClose={close} onSuccess={() => success(undefined)} />
      : activeConfirmation.action === "deletion" ? <AccountDeletionDialog key={activeConfirmation.account.id + activeConfirmation.action + route} confirmation={activeConfirmation} onClose={close} onSuccess={success} />
        : <AccountReasonDialog key={activeConfirmation.account.id + activeConfirmation.action + route} confirmation={activeConfirmation} onClose={close} onSuccess={success} /> : null}
  </>;
}
