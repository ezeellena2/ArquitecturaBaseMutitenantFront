import { useMountedRef } from "@/shared/hooks/useMountedRef";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, apiErrorMessage } from "@/shared/api/errorMessage";
import type { PlatformAccountDetailResponse, PlatformAccountResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { accountQueryKey, accountsQueryRoot, changeAccount, fetchAccount, type AccountAction } from "../api/accounts";
import { revokeOperatorInvitation } from "../api/operators";
import { accountLabel } from "../columns";
import { accountActionError, accountStateConflictCodes } from "../errors";

export interface AccountConfirmation { account: Pick<PlatformAccountResponse, "id" | "displayName" | "primaryEmail">; action: AccountAction | "revoke"; trigger: HTMLElement | null; route: string }
interface AccountOperation { id: string; action: AccountAction; reason: string }
type Confirmation = AccountConfirmation;
/** El POST y la relectura conservan un recorrido. La baja muestra la fecha del servidor. */
export function AccountReasonDialog({ confirmation, blockedReason, onLastAdmin, onClose, onSuccess }: { confirmation: Confirmation; blockedReason?: string; onLastAdmin?: () => Promise<PlatformAccountDetailResponse | undefined>; onClose: () => void; onSuccess: (detail: PlatformAccountDetailResponse | undefined) => void }) {
  const { t } = useTranslation("platformAccounts"); const active = useMountedRef();
  const action = useIdempotentMutation(async (operation: AccountOperation, key) => {
    if (!active.current) throw new DOMException("", "AbortError");
    try {
      try {
        await changeAccount(operation.id, operation.action, { reason: operation.reason }, key);
      } catch (error) {
        if (!active.current) throw new DOMException("", "AbortError");
        const current = error instanceof ApiError && error.code === "Legal.AccountDeletion.LastAdmin" ? await onLastAdmin?.() : undefined;
        if (!active.current) throw new DOMException("", "AbortError");
        throw accountActionError(error, t, current?.soleOwnerOrganizations);
      }
      if (!active.current) throw new DOMException("", "AbortError");
      const detail = operation.action === "deletion" ? await fetchAccount(operation.id) : undefined;
      if (!active.current) throw new DOMException("", "AbortError"); return detail;
    } catch (error) {
      if (!active.current) throw new DOMException("", "AbortError");
      throw error;
    }
  }, { meta: { handlesError: true }, sameOperation: (previous, next) => previous.id === next.id && previous.action === next.action && previous.reason === next.reason });
  return <ReasonDialog key={blockedReason ?? "enabled"} title={t(`confirm.${confirmation.action}.title`, { name: accountLabel(confirmation.account, t) })} description={t(`confirm.${confirmation.action}.description`)}
    confirmLabel={t(`confirm.${confirmation.action}.button`)} pendingLabel={t(`confirm.${confirmation.action}.pending`)} destructive={confirmation.action !== "reactivate"}
    blockedReason={blockedReason} returnFocusTo={confirmation.trigger} queryRoot={accountsQueryRoot} stateConflictCodes={accountStateConflictCodes} onClose={onClose}
    mutationFn={(values) => action.mutateAsync({ id: confirmation.account.id, action: confirmation.action === "revoke" ? "revoke-sessions" : confirmation.action, reason: values.reason })}
    onSuccess={(response) => { if (active.current) onSuccess(response); }} />;
}

export function AccountDeletionDialog({ confirmation, onClose, onSuccess }: { confirmation: Confirmation; onClose: () => void; onSuccess: (detail: PlatformAccountDetailResponse | undefined) => void }) {
  const { t } = useTranslation(["platformAccounts", "common"]); const restoreFocus = useRestoreFocusOnClose(true, confirmation.trigger);
  const client = useQueryClient(); const rejected = useRef(false); const [openingVerified, setOpeningVerified] = useState(false);
  const close = () => { if (rejected.current) void client.invalidateQueries({ queryKey: accountsQueryRoot }); onClose(); };
  const account = useQuery({ queryKey: accountQueryKey(confirmation.account.id), queryFn: () => fetchAccount(confirmation.account.id), staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: false, meta: { silent: true } });
  // La apertura exige GET exitoso; relecturas posteriores conservan formulario y rechazo.
  if (!openingVerified && account.isFetchedAfterMount && account.isSuccess && !account.isFetching) setOpeningVerified(true);
  if (!openingVerified || !account.data) return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent size="sm" showCloseButton={false} onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{t("platformAccounts:confirm.deletion.title", { name: accountLabel(confirmation.account, t) })}</DialogTitle></DialogHeader>
    <DialogBody><DialogDescription>{t("platformAccounts:confirm.deletion.description")}</DialogDescription>{account.isError ? <FormError message={apiErrorMessage(account.error, t)} /> : <span role="status">{t("common:states.loading")}</span>}</DialogBody>
    <DialogFooter><Button variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>{account.isError ? <Button variant="outline" onClick={() => { void account.refetch(); }}>{t("common:actions.retry")}</Button> : <Button variant="destructive" disabled>{t("platformAccounts:actions.deletion")}</Button>}</DialogFooter>
  </DialogContent></Dialog>;
  return <AccountReasonDialog confirmation={confirmation} blockedReason={account.data.soleOwnerOrganizations.length ? t("platformAccounts:confirm.deletion.soleOwner", { organization: account.data.soleOwnerOrganizations.join(", ") }) : undefined}
    onLastAdmin={async () => { rejected.current = true; return (await account.refetch({ throwOnError: true })).data; }} onClose={close} onSuccess={onSuccess} />;
}

export function RevokeInvitationDialog({ confirmation, onClose, onSuccess }: { confirmation: Confirmation; onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation(["platformAccounts", "common"]); const active = useMountedRef(); const restoreFocus = useRestoreFocusOnClose(true, confirmation.trigger);
  const { failure, fail, clear, close } = useDialogFailure(onClose, accountsQueryRoot, accountStateConflictCodes);
  const revoke = useMutation({ mutationFn: async () => {
    if (!active.current) throw new DOMException("", "AbortError");
    try {
      await revokeOperatorInvitation(confirmation.account.id); if (!active.current) throw new DOMException("", "AbortError");
    } catch (error) {
      if (!active.current) throw new DOMException("", "AbortError");
      throw error;
    }
  }, onSuccess: () => { if (active.current) { onSuccess(); close(); } }, onError: (error) => { if (active.current) fail(error); } });
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent size="sm" showCloseButton={false} onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{t("platformAccounts:confirm.revoke.title", { name: accountLabel(confirmation.account, t) })}</DialogTitle></DialogHeader>
    <DialogBody><DialogDescription>{t("platformAccounts:confirm.revoke.description")}</DialogDescription><FormError message={actionErrorMessage(failure, t)} /></DialogBody>
    <DialogFooter><Button variant="outline" onClick={close}>{t("common:actions.cancel")}</Button><Button variant="destructive" pending={revoke.isPending} pendingLabel={t("platformAccounts:confirm.revoke.pending")} onClick={() => { clear(); revoke.mutate(); }}>{t("platformAccounts:confirm.revoke.button")}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
