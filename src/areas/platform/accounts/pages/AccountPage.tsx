import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ComponentType } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import type { PlatformAccountDetailResponse, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { useMountedRef } from "@/shared/hooks/useMountedRef";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { NumberText } from "@/shared/ui/format/NumberText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { Pencil, Power, RotateCw, Trash2 } from "lucide-react";
import { CloseIcon, LockIcon, LogOutIcon, UsersIcon } from "@/shared/ui/icons";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page, SublineSeparator } from "@/shared/ui/Page";
import { accountQueryKey, accountsQueryRoot, fetchAccount, type AccountAction } from "../api/accounts";
import { resendOperatorInvitation } from "../api/operators";
import { accountLabel, accountStateTones, isOperatorInvitation } from "../columns";
import { AccountDeletionDialog, AccountReasonDialog, RevokeInvitationDialog, type AccountConfirmation } from "../components/AccountDialogs";
import { OperatorPermissionsDialog } from "../components/OperatorPermissionsDialog";
import { RemoveOperatorDialog } from "../components/RemoveOperatorDialog";
import { ResetAuthenticatorDialog } from "../components/ResetAuthenticatorDialog";
import { platformAuditQueryRoot } from "@/shared/api/resourceOptions";
import { accountStateConflictCodes } from "../errors";
import { AccountHistoryTab } from "../tabs/AccountHistoryTab";
import { AccountMethodsTab } from "../tabs/AccountMethodsTab";
import { AccountOrganizationsTab } from "../tabs/AccountOrganizationsTab";
import { AccountPermissionsTab } from "../tabs/AccountPermissionsTab";

interface OwnOperatorWrite { version: number; permissions: string[] }
type Confirmation = AccountConfirmation | { account: PlatformAccountDetailResponse; action: "permissions"; trigger: HTMLElement | null }
  | { account: PlatformAccountDetailResponse; action: "removeOperator"; trigger: HTMLElement | null }
  | { account: PlatformAccountDetailResponse; action: "resetAuthenticator"; trigger: HTMLElement | null };


/** Los íconos de las acciones de una cuenta, los mismos del ⋮ de la lista de Cuentas. */
const accountActionIcons: Record<AccountAction, ComponentType<{ className?: string }>> = {
  suspend: Power, reactivate: Power, "revoke-sessions": LogOutIcon, deletion: Trash2,
};
export function AccountPage() {
  const { id = "" } = useParams();
  return <AccountDetail key={id} id={id} />;
}

function AccountDetail({ id }: { id: string }) {
  const { t } = useTranslation(["platformAccounts", "common"]); const { canPlatform } = usePermissions();
  const { data: currentUser } = useCurrentUser(); const client = useQueryClient();
  const canManage = canPlatform("platform.accounts.manage"); const canOperators = canPlatform("platform.operators.manage"); const canAudit = canPlatform("platform.audit.read");
  const query = useQuery({ queryKey: accountQueryKey(id), queryFn: () => fetchAccount(id), enabled: Boolean(id) && canPlatform("platform.accounts.read"), meta: { silent: true, blocksView: true } });
  const [written, setWritten] = useState<OwnOperatorWrite>();
  useBreadcrumbLeaf(query.data ? accountLabel(query.data, t) : undefined);
  const back = { to: "/plataforma/cuentas", label: t("platformAccounts:detail.back") };
  if (query.isPending) return <Page icon={UsersIcon} title={t("platformAccounts:detail.loading")} backTo={back}><span role="status">{t("common:states.loading")}</span></Page>;
  if (!query.data) return isNotFoundError(query.error) ? <NotFoundPage homePath="/plataforma" screen={t("platformAccounts:detail.title")} back={back} />
    : <LoadErrorPage onRetry={() => { void query.refetch(); }} screen={t("platformAccounts:detail.title")} back={back} />;
  const data = written ? { ...query.data, operatorVersion: written.version, operatorPermissions: written.permissions } : query.data;
  const self = currentUser?.id === id;
  // Un cambio de cuenta, estado o permiso abandona permanentemente borradores, reintentos y callbacks del recorrido.
  const lifetime = `${self}:${canManage}:${canOperators}:${canAudit}:${data.kind}:${data.state}:${Boolean(data.deletion)}`;
  return <AccountView key={lifetime} data={data} self={self} canManage={canManage} canOperators={canOperators} canAudit={canAudit}
    onConflict={() => setWritten(undefined)} onOperatorWrite={(response, permissions) => {
      setWritten({ version: response.version, permissions });
      client.setQueryData<PlatformAccountDetailResponse>(accountQueryKey(id), (previous) => previous ? { ...previous, operatorVersion: response.version, operatorPermissions: permissions } : previous);
    }} />;
}

function AccountView({ data, self, canManage, canOperators, canAudit, onOperatorWrite, onConflict }: {
  data: PlatformAccountDetailResponse; self: boolean; canManage: boolean; canOperators: boolean; canAudit: boolean;
  onOperatorWrite: (response: VersionResponse, permissions: string[]) => void; onConflict: () => void;
}) {
  const { t } = useTranslation(["platformAccounts", "common"]); const { phone } = useAppChrome(); const format = useFormat(); const client = useQueryClient(); const navigate = useNavigate();
  const [tab, setTab] = useState(data.kind === "Operator" ? "permissions" : "methods");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const active = useMountedRef();
  const invitation = isOperatorInvitation(data); const operator = data.kind === "Operator"; const name = accountLabel(data, t);
  const mutable = !self && !["PendingDeletion", "Deleted"].includes(data.state);
  const canResend = mutable && canOperators && invitation;
  const action = useResourceAction<{ id: string; name: string }>({
    isCurrent: () => canResend,
    onError: (error) => {
    toastActionError(error, t);
    if (accountStateConflictCodes.some((code) => code === error.code)) void client.invalidateQueries({ queryKey: accountsQueryRoot });
    },
  });
  const resend = useIdempotentMutation(action.guarded((operation, key: string) => resendOperatorInvitation(operation.id, key),
    (_response, operation) => { toast.success(t("platformAccounts:messages.resent", { name: operation.name })); void client.invalidateQueries({ queryKey: accountsQueryRoot }); }),
    { meta: action.meta, sameOperation: (previous, next) => previous.id === next.id });
  const busy = action.isPending;
  const accountActions: AccountAction[] = mutable && canManage && !operator && !invitation
    ? ["revoke-sessions", ...(data.state === "Suspended" ? ["reactivate"] as const : []), ...(["Active", "NeedsRecovery"].includes(data.state) ? ["suspend"] as const : [])] : [];
  function open(action: Confirmation["action"], trigger: HTMLElement | null) {
    setConfirmation(action === "permissions" ? { account: data, action, trigger } : action === "removeOperator" ? { account: data, action, trigger }
      : action === "resetAuthenticator" ? { account: data, action, trigger } : { account: data, action, trigger, route: data.id });
  }
  const close = () => setConfirmation((previous) => previous === confirmation ? null : previous);
  const invalidate = () => { void client.invalidateQueries({ queryKey: accountsQueryRoot }); };
  const success = (detail: PlatformAccountDetailResponse | undefined) => {
    if (!active.current || !confirmation) return;
    if (confirmation.action === "deletion") {
      if (detail) client.setQueryData(accountQueryKey(detail.id), detail);
      toast.success(t(detail?.deletion?.scheduledForUtc ? "platformAccounts:messages.deletion" : "platformAccounts:messages.deletedWithoutDate", { name, date: detail?.deletion?.scheduledForUtc ? format.formatDate(detail.deletion.scheduledForUtc) : "" }));
    } else toast.success(t(confirmation.action === "revoke" ? "platformAccounts:messages.revoked" : `platformAccounts:messages.${confirmation.action}`, { name }));
    invalidate();
    if (confirmation.action === "revoke") void navigate("/plataforma/cuentas");
  };
  const permissionCount = data.operatorPermissions?.length ?? 0;
  const expires = <>{t(data.state === "InvitationExpired" ? "platformAccounts:detail.expired" : "platformAccounts:detail.expires")} <DateText value={data.invitationExpiresAtUtc} /></>;
  const operatorSummary = <>{t("platformAccounts:profiles.operator")} {invitation ? <>{" · "}{t("platformAccounts:detail.never")} {" · "}{expires}</>
    : <> {" · "}<NumberText value={permissionCount} /> {t("platformAccounts:detail.permissionCount", { count: permissionCount })}{" · "}{t("platformAccounts:detail.lastSignInInline")} <DateText value={data.lastSignInAtUtc} kind="relative" /></>}</>;
  const personSummary = <>{t("platformAccounts:detail.created")} <DateText value={data.createdAtUtc} />{" · "}{t(data.state === "Deleted" ? "platformAccounts:detail.deleted" : "platformAccounts:detail.lastSignIn")} <DateText value={data.state === "Deleted" ? data.deletedAtUtc : data.lastSignInAtUtc} kind={data.state === "Deleted" ? "date" : "relative"} /></>;
  const managed = data.loginMethods.find((method) => !method.canSignIn && method.managedByOrganizationName);
  const matchingMemberships = data.organizations.filter((membership) => membership.name === managed?.managedByOrganizationName);
  const ended = matchingMemberships.length === 1 && ["Inactive", "Removed"].includes(matchingMemberships[0].status) ? matchingMemberships[0] : undefined;
  const banner = data.state === "Suspended" ? <Banner tone="warning"><Trans t={t} i18nKey="platformAccounts:detail.suspended" components={{ strong: <strong />, date: <DateText value={data.lastStateChange?.atUtc} />, reason: <>{data.lastStateChange?.reason || <EmptyValue />}</> }} /></Banner>
    : data.state === "PendingDeletion" ? <Banner tone="warning"><Trans t={t} i18nKey={data.deletion?.requestedByPlatform ? "platformAccounts:detail.platformDeletion" : "platformAccounts:detail.personalDeletion"}
        components={{ strong: <strong />, requested: <DateText value={data.deletion?.requestedAtUtc} />, scheduled: <DateText value={data.deletion?.scheduledForUtc} /> }} /></Banner>
      : data.state === "NeedsRecovery" ? <Banner tone="warning"><Trans t={t} i18nKey="platformAccounts:detail.recoveryDescription"
          values={{ organization: managed?.managedByOrganizationName || format.formatEmpty() }}
          components={{ strong: <strong />, ended: <DateText value={ended?.endedAtUtc} />, recoveries: <Link className="font-semibold text-[var(--marca-tx)] hover:underline" to="/plataforma/recuperaciones" /> }} /></Banner> : undefined;
  return <>
    <Page icon={UsersIcon} title={name} backTo={{ to: "/plataforma/cuentas", label: t("platformAccounts:detail.back") }} phoneBody="flush" banner={banner}
      summary={<><StatusBadge tones={accountStateTones} value={data.state} /><SublineSeparator />{operator ? operatorSummary : personSummary}</>}
      phoneSubtitle={<><StatusBadge tones={accountStateTones} value={data.state} />{" · "}{operator ? invitation ? expires : <>{t("platformAccounts:detail.operatorInline")} {" · "}<NumberText value={permissionCount} /> {t("platformAccounts:detail.permissionCount", { count: permissionCount })}</> : <>{t(data.state === "Deleted" ? "platformAccounts:detail.deletedInline" : "platformAccounts:detail.lastSignInInline")} <DateText value={data.state === "Deleted" ? data.deletedAtUtc : data.lastSignInAtUtc} kind={data.state === "Deleted" ? "date" : "relative"} /></>}</>}
      actions={!phone ? <>{accountActions.map((action) => <Button key={action} variant="outline" onClick={(event) => open(action, event.currentTarget)}>{t(action === "revoke-sessions" ? "platformAccounts:detail.closeSessions" : `platformAccounts:actions.${action}`)}</Button>)}
        {mutable && canOperators && operator && !invitation ? <Button variant="outline" onClick={(event) => open("permissions", event.currentTarget)}>{t("platformAccounts:operator.change")}</Button> : null}
        {canResend ? <Button variant="outline" pending={busy} pendingLabel={t("platformAccounts:detail.resending")} onClick={() => resend.mutate({ id: data.id, name })}>{t("platformAccounts:actions.resend")}</Button> : null}</> : undefined}
      // «Criterio · Menús»: cada opción con su ícono gris (Cuenta-Plat: candado en «Restablecer el autenticador», ✕ en «Quitar
      // operador», tacho en «Dar de baja»; las demás, las del ⋮ de la lista de Cuentas). En el teléfono, la hoja (M-Cuenta-Plat).
      moreActions={{ label: t("platformAccounts:rowActions", { name }), phoneSheet: true, items: [
        ...accountActions.map((action) => ({ label: t(action === "revoke-sessions" ? "platformAccounts:detail.closeSessions" : `platformAccounts:actions.${action}`), icon: accountActionIcons[action], hidden: !phone, destructive: action === "suspend", onSelect: (trigger: HTMLElement | null) => open(action, trigger) })),
        { label: t("platformAccounts:operator.change"), icon: Pencil, hidden: !phone || !mutable || !canOperators || !operator || invitation, onSelect: (trigger) => open("permissions", trigger) },
        { label: t("platformAccounts:actions.resend"), icon: RotateCw, hidden: !phone || !canResend || busy, onSelect: () => resend.mutate({ id: data.id, name }) },
        // Tablero Cuenta-Plat («Operador: acciones»): «Restablecer el autenticador» y, de peligro, «Quitar operador». Nunca
        // sobre la propia cuenta ni sobre una invitación sin aceptar.
        { label: t("platformAccounts:operator.reset"), icon: LockIcon, hidden: !mutable || !canOperators || !operator || invitation, onSelect: (trigger) => open("resetAuthenticator", trigger) },
        { label: t("platformAccounts:operator.remove"), icon: CloseIcon, hidden: !mutable || !canOperators || !operator || invitation, destructive: true, onSelect: (trigger) => open("removeOperator", trigger) },
        { label: t("platformAccounts:actions.revoke"), icon: CloseIcon, hidden: !canResend || busy, destructive: true, onSelect: (trigger) => open("revoke", trigger) },
        { label: t("platformAccounts:actions.deletion"), icon: Trash2, hidden: !mutable || !canManage || operator || invitation || Boolean(data.deletion), destructive: true, onSelect: (trigger) => open("deletion", trigger) },
      ] }}
      tabs={{ label: t("platformAccounts:detail.tabsLabel"), value: tab, onValueChange: setTab, phoneColumns: 2, items: [
        { value: "methods", label: t("platformAccounts:detail.methods"), count: data.loginMethods.length, hidden: operator, content: <AccountMethodsTab methods={data.loginMethods} /> },
        { value: "organizations", label: t("platformAccounts:detail.organizations"), count: data.organizations.length, hidden: operator, content: <AccountOrganizationsTab organizations={data.organizations} /> },
        { value: "permissions", label: t("platformAccounts:detail.permissions"), count: permissionCount, hidden: !operator, content: <AccountPermissionsTab permissions={data.operatorPermissions ?? []} /> },
        { value: "history", label: t("platformAccounts:detail.history"), hidden: !canAudit || invitation, content: canAudit && !invitation ? <AccountHistoryTab id={data.id} /> : null },
      ] }} />
    {confirmation ? confirmation.action === "permissions" ? <OperatorPermissionsDialog account={confirmation.account} returnFocusTo={confirmation.trigger} onClose={(conflicted) => { if (conflicted) { onConflict(); invalidate(); } close(); }} onSaved={(response, permissions) => {
      if (!active.current) return; onOperatorWrite(response, permissions); toast.success(t("platformAccounts:operator.saved", { name })); invalidate();
    }} /> : confirmation.action === "removeOperator" ? <RemoveOperatorDialog account={confirmation.account} returnFocusTo={confirmation.trigger} onClose={(conflicted) => { if (conflicted) onConflict(); close(); }} onRemoved={() => {
      if (!active.current) return; toast.success(t("platformAccounts:operator.removed", { name })); invalidate(); void navigate("/plataforma/cuentas");
    }} /> : confirmation.action === "resetAuthenticator" ? <ResetAuthenticatorDialog account={confirmation.account} returnFocusTo={confirmation.trigger} onClose={(conflicted) => { if (conflicted) { onConflict(); invalidate(); } close(); }} onReset={(response) => {
      if (!active.current) return;
      onOperatorWrite(response, data.operatorPermissions ?? []); toast.success(t("platformAccounts:operator.resetDone", { name })); invalidate();
      void client.invalidateQueries({ queryKey: platformAuditQueryRoot });
    }} /> : confirmation.action === "revoke" ? <RevokeInvitationDialog confirmation={confirmation} onClose={close} onSuccess={() => success(undefined)} />
      : confirmation.action === "deletion" ? <AccountDeletionDialog confirmation={confirmation} onClose={close} onSuccess={success} /> : <AccountReasonDialog confirmation={confirmation} onClose={close} onSuccess={success} /> : null}
  </>;
}
