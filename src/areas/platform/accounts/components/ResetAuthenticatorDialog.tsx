import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import type { PlatformAccountDetailResponse, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useMountedRef } from "@/shared/hooks/useMountedRef";
import { ReasonDialog } from "@/shared/platform/ReasonDialog";
import { accountsQueryRoot } from "../api/accounts";
import { resetOperatorAuthenticator } from "../api/operators";
import { accountLabel } from "../columns";
import { accountStateConflictCodes } from "../errors";

/// «¿Restablecer el autenticador de …?» (tablero Cuenta-Plat, «Operador: restablecer el autenticador», Etapa 9): con
/// motivo, como «Quitar operador». Manda la versión del operador de cuando se abrió el diálogo, nunca la de una relectura.
/// El back cierra sus sesiones y anula sus códigos; al volver a entrar, configura el autenticador de nuevo.
export function ResetAuthenticatorDialog({ account, returnFocusTo, onClose, onReset }: {
  account: PlatformAccountDetailResponse; returnFocusTo: HTMLElement | null; onClose: (conflicted: boolean) => void; onReset: (response: VersionResponse) => void;
}) {
  const { t } = useTranslation("platformAccounts"); const active = useMountedRef(); const conflict = useRef(false);
  const [version] = useState(account.operatorVersion);
  const reset = useIdempotentMutation(async (operation: { version: number | null | undefined; reason: string }, key) => {
    if (!active.current) throw new DOMException("", "AbortError");
    try {
      const response = await resetOperatorAuthenticator(account.id, operation, key); if (!active.current) throw new DOMException("", "AbortError");
      return response;
    } catch (error) {
      if (!active.current) throw new DOMException("", "AbortError");
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") conflict.current = true;
      throw error;
    }
  }, { meta: { handlesError: true }, sameOperation: (previous, next) => previous.version === next.version && previous.reason === next.reason });
  return <ReasonDialog title={t("operator.resetTitle", { name: accountLabel(account, t) })} description={t("operator.resetDescription")}
    confirmLabel={t("operator.resetButton")} pendingLabel={t("operator.resetting")} destructive returnFocusTo={returnFocusTo} phoneCloseButton
    queryRoot={accountsQueryRoot} stateConflictCodes={accountStateConflictCodes} onClose={() => onClose(conflict.current)}
    mutationFn={(values) => reset.mutateAsync({ version, reason: values.reason })} onSuccess={(response) => { if (active.current) onReset(response); }} />;
}
