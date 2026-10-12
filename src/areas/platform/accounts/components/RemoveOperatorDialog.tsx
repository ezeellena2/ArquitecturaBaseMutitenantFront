import { useMountedRef } from "@/shared/hooks/useMountedRef";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import type { PlatformAccountDetailResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { accountsQueryRoot } from "../api/accounts";
import { removeOperator } from "../api/operators";
import { accountLabel } from "../columns";
import { accountStateConflictCodes } from "../errors";

export function RemoveOperatorDialog({ account, returnFocusTo, onClose, onRemoved }: {
  account: PlatformAccountDetailResponse; returnFocusTo: HTMLElement | null; onClose: (conflicted: boolean) => void; onRemoved: () => void;
}) {
  const { t } = useTranslation("platformAccounts"); const active = useMountedRef(); const conflict = useRef(false);
  const remove = useIdempotentMutation(async (operation: { version: number | null | undefined; reason: string }, key) => {
    if (!active.current) throw new DOMException("", "AbortError");
    try {
      await removeOperator(account.id, operation, key); if (!active.current) throw new DOMException("", "AbortError");
    } catch (error) {
      if (!active.current) throw new DOMException("", "AbortError");
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") conflict.current = true;
      throw error;
    }
  }, { meta: { handlesError: true }, sameOperation: (previous, next) => previous.version === next.version && previous.reason === next.reason });
  return <ReasonDialog title={t("operator.removeTitle", { name: accountLabel(account, t) })} description={t("operator.removeDescription")}
    confirmLabel={t("operator.removeButton")} pendingLabel={t("operator.removing")} destructive returnFocusTo={returnFocusTo}
    queryRoot={accountsQueryRoot} stateConflictCodes={accountStateConflictCodes} onClose={() => onClose(conflict.current)}
    mutationFn={(values) => remove.mutateAsync({ version: account.operatorVersion, reason: values.reason })} onSuccess={() => { if (active.current) onRemoved(); }} />;
}
