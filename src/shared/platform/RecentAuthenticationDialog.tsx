import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { api, recentAuthenticationPath } from "@/shared/api/httpClient";
import { registerRecentAuthenticationHost, settleRecentAuthentication, useRecentAuthentication } from "@/shared/api/recentAuthentication";
import type { ApiSchemas } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { OtpInput } from "@/shared/ui/OtpInput";

type Method = ApiSchemas["TwoFactorMethod"];
type Attempt = { method: Method; code: string };
const codeLength = 6;
const recoveryPattern = /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/iu;

const confirm = (attempt: Attempt, key: string) =>
  api.post<ApiSchemas["PlatformReauthenticationResponse"]>(recentAuthenticationPath, attempt, { headers: { "Idempotency-Key": key } });

/// El anfitrión de «Confirmá que sos vos» en Plataforma: muestra el diálogo cuando una escritura lo pide y lo cancela si
/// la persona navega o sale de Plataforma, sin repetir el pedido.
export function RecentAuthenticationHost() {
  const pending = useRecentAuthentication();
  const location = useLocation();
  const where = location.pathname + location.search;
  const opened = useRef(where);
  useEffect(() => registerRecentAuthenticationHost(), []);
  useEffect(() => {
    if (opened.current === where) return;
    opened.current = where;
    settleRecentAuthentication(false);
  }, [where]);
  return pending ? <RecentAuthenticationDialog purpose={pending.purpose} /> : null;
}

/// «Confirmá que sos vos» (tableros Cuenta-Plat y M-Cuenta-Plat, Recuperaciones, Legales y Config-Plat, Etapa 9): el código
/// de la app o uno de recuperación, cada uno con su error; el bloqueo de la cuenta apaga todo. Reemplaza al diálogo de la
/// acción, que se oculta detrás (`Dialog`); «Cancelar» lo devuelve con lo cargado. Confirmado, la acción se repite sola, una
/// vez, con su mismo cuerpo, versión y clave.
function RecentAuthenticationDialog({ purpose }: { purpose: string | null }) {
  const { t } = useTranslation(["common", "errors"]);
  const hintId = useId();
  const [method, setMethod] = useState<Method>("authenticator");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [incomplete, setIncomplete] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const verify = useIdempotentMutation(confirm, { meta: { handlesError: true },
    sameOperation: (previous, next) => previous.method === next.method && previous.code === next.code });
  const app = method === "authenticator";
  const locked = error?.code === "Identity.Account.LockedOut";
  const reason = purpose ?? t("recentAuthentication.purposeDefault");

  async function submit() {
    const value = app ? code : recovery.trim().toUpperCase();
    if (app ? value.length !== codeLength : !recoveryPattern.test(value)) { setIncomplete(true); return; }
    setError(null);
    try {
      await verify.mutateAsync({ method, code: value });
      settleRecentAuthentication(true);
    } catch (caught) {
      if (caught instanceof ApiError) setError(caught);
    }
  }
  function toggle() {
    setMethod(app ? "recoveryCode" : "authenticator");
    setIncomplete(false);
    setError(null);
  }

  const fieldError = incomplete ? t(app ? "code.incomplete" : "recentAuthentication.recoveryIncomplete")
    : error?.code === "Auth.TwoFactor.Invalid" || error?.code === "Validation.Failed" && error.errors?.code?.length ? t("recentAuthentication.codeInvalid")
      : error?.code === "Auth.TwoFactor.RecoveryInvalid" ? t("recentAuthentication.recoveryInvalid")
        : locked ? t("recentAuthentication.locked") : null;
  // Lo que no es del código (sin conexión, el servidor) va en la franja, arriba de los botones.
  const failure = error && !fieldError ? apiErrorMessage(error, t) : null;

  return <Dialog open recentAuthentication onOpenChange={(open) => { if (!open) settleRecentAuthentication(false); }}>
    <DialogContent size="sm" showCloseButton={false}>
      <DialogHeader><DialogTitle>{t("recentAuthentication.title")}</DialogTitle></DialogHeader>
      <form noValidate onSubmit={(event) => { event.preventDefault(); void submit(); }} className="flex min-h-0 flex-col">
        <DialogBody>
          <DialogDescription id={hintId}>{t(app ? "recentAuthentication.app" : "recentAuthentication.recovery", { purpose: reason })}</DialogDescription>
          {app ? <OtpInput length={codeLength} value={code} variant="auth" label={t("code.label")} autoFocus disabled={locked || verify.isPending}
            error={fieldError} aria-describedby={hintId} onChange={(next) => { setCode(next); setIncomplete(false); if (!locked) setError(null); }} />
            : <FormField label={t("recentAuthentication.recoveryLabel")} error={fieldError ?? undefined}>
              <Input autoComplete="off" spellCheck={false} placeholder="XXXX-XXXX" value={recovery} disabled={verify.isPending} autoFocus
                className="h-11 font-mono tracking-[0.08em]" onChange={(event) => { setRecovery(event.target.value); setIncomplete(false); setError(null); }} />
            </FormField>}
          <Button type="button" variant="link" className="self-start text-[13.5px] leading-[normal]" disabled={locked} onClick={toggle}>
            {t(app ? "recentAuthentication.useRecovery" : "recentAuthentication.useApp")}
          </Button>
          <FormError message={failure} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => settleRecentAuthentication(false)}>{t("actions.cancel")}</Button>
          <Button type="submit" disabled={locked} pending={verify.isPending} pendingLabel={t("recentAuthentication.confirming")}>{t("recentAuthentication.confirm")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
