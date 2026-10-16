import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { TwoFactorMethod, VerifyPlatformFactorResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { saveBlobAs } from "@/shared/lib/saveFile";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { Input } from "@/shared/ui/input";
import { LockIcon } from "@/shared/ui/icons";
import { OtpInput } from "@/shared/ui/OtpInput";
import { QrCode } from "@/shared/ui/QrCode";
import { toastError } from "@/shared/ui/sonner";
import { completePlatformFactor, fetchPlatformFactor, platformFactorQueryKey, verifyPlatformFactor } from "../api/platformFactor";
import { AuthMessage, type AuthMessageContent } from "./AuthMessage";

const codeLength = 6;
const recoveryPattern = /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/iu;

type FactorAttempt = { method: TwoFactorMethod; code: string };
const sameAttempt = (previous: FactorAttempt, next: FactorAttempt) => previous.method === next.method && previous.code === next.code;

/** Lo que se hace con cada error del segundo factor: el texto de la franja, si marca el código y si traba el paso. */
function factorFailure(error: ApiError, t: TFunction): AuthMessageContent {
  switch (error.code) {
    case "Auth.TwoFactor.Invalid": return { text: t("platformFactor.codeInvalid"), details: [t("platformFactor.checkClock")] };
    case "Auth.TwoFactor.RecoveryInvalid": return { text: t("platformFactor.recoveryInvalid") };
    case "Auth.TwoFactor.InvalidState": return { text: t("platformFactor.invalidState") };
    case "Identity.Account.LockedOut": return { text: t("login.accountLocked"), details: [t("login.tryLater")] };
    default: return { text: apiErrorMessage(error, t) };
  }
}
const marksCode = (error: ApiError | null) => error?.code === "Auth.TwoFactor.Invalid" || error?.code === "Auth.TwoFactor.RecoveryInvalid"
  || error?.code === "Validation.Failed" && Boolean(error.errors?.code?.length);

/// El segundo factor del operador en el ingreso (tableros Ingreso y M-Ingreso, «Operador: …», Etapa 9). Lo que toca se
/// sabe con el desafío pendiente (GET /api/auth/platform-factor): pedir el código, configurar el autenticador o guardar los
/// códigos de recuperación. Recargar vuelve a consultarlo; el secreto y los códigos viven solo en la memoria de esa
/// consulta, sin storage ni URL. Sin desafío (vencido o anulado) se vuelve a ingresar.
export function PlatformFactorStep({ onCompleted, onRestart }: { onCompleted: (returnUrl: string) => void; onRestart: () => void }) {
  const { t } = useTranslation(["auth", "common", "errors"]);
  const client = useQueryClient();
  const [expired, setExpired] = useState(false);
  const challenge = useQuery({ queryKey: platformFactorQueryKey, queryFn: ({ signal }) => fetchPlatformFactor(signal),
    retry: false, gcTime: 0, staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false, meta: { silent: true } });
  const reload = () => { void client.invalidateQueries({ queryKey: platformFactorQueryKey }); };
  const failed = (error: ApiError) => {
    if (error.status === 401) { setExpired(true); return true; }
    if (error.code === "Auth.TwoFactor.InvalidState") reload();
    return false;
  };

  const challengeExpired = expired || challenge.error instanceof ApiError && challenge.error.status === 401;
  if (challengeExpired) return <div className="flex flex-col gap-[22px]">
    <AuthMessage message={{ text: t("platformFactor.expired") }} />
    <Button type="button" size="lg" onClick={onRestart}>{t("login.backToLogin")}</Button>
  </div>;
  if (challenge.isError) return <div className="flex flex-col gap-[22px]">
    <AuthMessage message={{ text: apiErrorMessage(challenge.error, t) }} />
    <Button type="button" size="lg" variant="outline" onClick={() => { void challenge.refetch(); }}>{t("common:actions.retry")}</Button>
  </div>;
  if (!challenge.data) return <p role="status" className="text-sm text-[var(--t2)]">{t("common:states.loading")}</p>;

  const data = challenge.data;
  if (data.state === "setup") return <FactorSetup key={data.secret} secret={data.secret} otpauthUri={data.otpauthUri} onFailure={failed} onVerified={reload} />;
  if (data.state === "recoveryCodes") return <FactorRecoveryCodes codes={data.recoveryCodes} onFailure={failed} onCompleted={onCompleted} />;
  return <FactorVerify onFailure={failed} onVerified={(response) => { if (response.next === "authorize") onCompleted(response.returnUrl); else reload(); }} />;
}

/** Verificar un código: el error marca el código y el bloqueo de la cuenta traba el paso mientras dura. */
function useFactorVerification(onFailure: (error: ApiError) => boolean, onVerified: (response: VerifyPlatformFactorResponse) => void) {
  const { t } = useTranslation(["auth", "common", "errors"]);
  const [error, setError] = useState<ApiError | null>(null);
  const retry = useRetryAfterCountdown();
  const verify = useIdempotentMutation((attempt: FactorAttempt, key) => verifyPlatformFactor(attempt, key), { meta: { handlesError: true }, sameOperation: sameAttempt });
  async function submit(attempt: FactorAttempt) {
    setError(null);
    try {
      onVerified(await verify.mutateAsync(attempt));
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (onFailure(caught)) return;
      retry.startFromError(caught);
      setError(caught);
    }
  }
  const locked = error?.code === "Identity.Account.LockedOut" && (retry.isRunning || error.retryAfterSeconds === undefined);
  return { submit, error, clear: () => setError(null), message: error ? factorFailure(error, t) : null, invalid: marksCode(error),
    pending: verify.isPending, locked, waiting: retry.isRunning, label: retry.label };
}

/// «Verificación en dos pasos»: el código de la app o, con el enlace de abajo, un código de recuperación.
function FactorVerify({ onFailure, onVerified }: { onFailure: (error: ApiError) => boolean; onVerified: (response: VerifyPlatformFactorResponse) => void }) {
  const { t } = useTranslation(["auth", "common"]);
  const hintId = useId();
  const recoveryId = useId();
  const [method, setMethod] = useState<TwoFactorMethod>("authenticator");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [incomplete, setIncomplete] = useState(false);
  const verification = useFactorVerification(onFailure, onVerified);
  const app = method === "authenticator";

  function verify() {
    const value = app ? code : recovery.trim().toUpperCase();
    if (app ? value.length !== codeLength : !recoveryPattern.test(value)) { setIncomplete(true); return; }
    void verification.submit({ method, code: value });
  }
  function toggle() {
    setMethod(app ? "recoveryCode" : "authenticator");
    setIncomplete(false);
    verification.clear();
  }

  const blocked = verification.locked;
  return <div className="flex flex-col gap-[22px]">
    <span aria-hidden="true" className="flex size-[52px] items-center justify-center self-center rounded-full bg-[var(--marca-t)] text-[var(--marca-tx)]"><LockIcon className="size-5" /></span>
    <div className="text-center">
      <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("platformFactor.verifyTitle")}</h1>
      <p id={hintId} className="mt-1.5 text-sm leading-normal text-[var(--t2)]">{t(app ? "platformFactor.verifyApp" : "platformFactor.verifyRecovery")}</p>
    </div>
    {app ? <OtpInput length={codeLength} value={code} variant="auth" label={t("common:code.label")} invalid={verification.invalid} disabled={blocked || verification.pending}
      aria-describedby={hintId} onChange={(next) => { setCode(next); setIncomplete(false); if (verification.invalid) verification.clear(); }} />
      : <div className="flex flex-col gap-1.5">
        <label htmlFor={recoveryId} className="text-[13px] font-medium text-[var(--t1)]">{t("platformFactor.recoveryLabel")}</label>
        <Input id={recoveryId} autoComplete="off" spellCheck={false} placeholder="XXXX-XXXX" value={recovery} disabled={blocked || verification.pending}
          aria-invalid={verification.invalid || undefined} aria-describedby={hintId} className="h-11 font-mono tracking-[0.08em]"
          onChange={(event) => { setRecovery(event.target.value); setIncomplete(false); if (verification.invalid) verification.clear(); }} />
      </div>}
    <AuthMessage message={incomplete ? { text: t(app ? "common:code.incomplete" : "platformFactor.recoveryIncomplete") } : verification.message} />
    <Button type="button" size="lg" onClick={verify} disabled={blocked || verification.waiting} pending={verification.pending} pendingLabel={t("common:code.verifying")}>
      {verification.label ?? t("common:code.verify")}
    </Button>
    <div className="flex justify-center">
      <Button type="button" variant="link" className="text-[13px] leading-[normal]" onClick={toggle}>{t(app ? "platformFactor.useRecovery" : "platformFactor.useApp")}</Button>
    </div>
  </div>;
}

/// «Protegé tu cuenta de operador»: el QR armado en el navegador, la clave para escribirla a mano y el primer código.
function FactorSetup({ secret, otpauthUri, onFailure, onVerified }: { secret: string; otpauthUri: string; onFailure: (error: ApiError) => boolean; onVerified: () => void }) {
  const { t } = useTranslation(["auth", "common"]);
  const stepId = useId();
  const [code, setCode] = useState("");
  const [incomplete, setIncomplete] = useState(false);
  const verification = useFactorVerification(onFailure, onVerified);
  const key = secret.replace(/\s+/gu, "").replace(/(.{4})(?=.)/gu, "$1 ");

  function activate() {
    if (code.length !== codeLength) { setIncomplete(true); return; }
    void verification.submit({ method: "authenticator", code });
  }

  return <div className="flex flex-col gap-[22px]">
    <div>
      <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("platformFactor.setupTitle")}</h1>
      <p className="mt-1.5 text-sm leading-normal text-[var(--t2)]">{t("platformFactor.setupDetail")}</p>
    </div>
    <div className="flex items-center gap-5">
      <QrCode value={otpauthUri} label={t("platformFactor.qrLabel")} className="size-[168px] max-md:size-[140px]" />
      <div className="flex min-w-0 flex-col gap-2.5 text-sm text-[var(--t2)]">
        <span><strong className="text-[var(--t1)]">{"1."}</strong> {t("platformFactor.scan")}</span>
        <span>{t("platformFactor.manual")}</span>
        <span className="font-mono text-[15px] font-semibold tracking-[0.06em] break-all text-[var(--t1)] select-all">{key}</span>
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      <span id={stepId} className="text-[13px] font-medium text-[var(--t2)]"><strong className="text-[var(--t1)]">{"2."}</strong> {t("platformFactor.typeCode")}</span>
      <OtpInput length={codeLength} value={code} variant="auth" label={t("common:code.label")} invalid={verification.invalid} disabled={verification.locked || verification.pending}
        aria-describedby={stepId} onChange={(next) => { setCode(next); setIncomplete(false); if (verification.invalid) verification.clear(); }} />
    </div>
    <AuthMessage message={incomplete ? { text: t("platformFactor.setupIncomplete") } : verification.message} />
    <Button type="button" size="lg" onClick={activate} disabled={verification.locked || verification.waiting} pending={verification.pending} pendingLabel={t("platformFactor.activating")}>
      {verification.label ?? t("platformFactor.activate")}
    </Button>
  </div>;
}

/// «Guardá tus códigos de recuperación»: los ocho del alta, para descargar o copiar desde el navegador. «Entrar a la
/// plataforma» espera a que diga que los guardó; recién ahí se completa el ingreso.
function FactorRecoveryCodes({ codes, onFailure, onCompleted }: { codes: readonly string[]; onFailure: (error: ApiError) => boolean; onCompleted: (returnUrl: string) => void }) {
  const { t } = useTranslation(["auth", "common", "errors"]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const complete = useIdempotentMutation((_saved: true, key) => completePlatformFactor(key), { meta: { handlesError: true } });
  const text = codes.join("\n") + "\n";

  async function enter() {
    setError(null);
    try {
      onCompleted((await complete.mutateAsync(true)).returnUrl);
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (!onFailure(caught)) setError(caught);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("platformFactor.copied"));
    } catch {
      toastError(t("platformFactor.copyFailed"));
    }
  }

  return <div className="flex flex-col gap-[22px]">
    <div>
      <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("platformFactor.codesTitle")}</h1>
      <p className="mt-1.5 text-sm leading-normal text-[var(--t2)]">{t("platformFactor.codesDetail")}</p>
    </div>
    <ul aria-label={t("platformFactor.codesLabel")} className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-[14px] border border-[var(--borde)] bg-[var(--s2)] px-5 py-4 font-mono text-[15px] tracking-[0.04em] max-md:rounded-[10px] max-md:px-4 max-md:py-3 max-md:text-[14px]">
      {codes.map((code) => <li key={code}>{code}</li>)}
    </ul>
    <div className="flex gap-2.5">
      <Button type="button" variant="outline" className="flex-1" onClick={() => { saveBlobAs(new Blob([text], { type: "text/plain;charset=utf-8" }), t("platformFactor.fileName")); toast.success(t("platformFactor.downloaded")); }}>
        {t("platformFactor.download")}
      </Button>
      <Button type="button" variant="outline" className="flex-1" onClick={() => { void copy(); }}>{t("platformFactor.copy")}</Button>
    </div>
    <CheckboxField label={t("platformFactor.saved")} checked={saved} onCheckedChange={setSaved} />
    <AuthMessage message={error ? factorFailure(error, t) : null} />
    <Button type="button" size="lg" onClick={() => { void enter(); }} disabled={!saved} pending={complete.isPending} pendingLabel={t("platformFactor.entering")}>
      {t("platformFactor.enter")}
    </Button>
  </div>;
}
