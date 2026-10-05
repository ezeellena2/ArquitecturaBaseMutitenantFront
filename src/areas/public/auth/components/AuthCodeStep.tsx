import { ChevronLeft } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { OtpInput } from "@/shared/ui/OtpInput";
import { AuthMessage, type AuthMessageContent } from "./AuthMessage";

const codeLength = 6;

export interface AuthCodeStepProps {
  /** El correo al que mandamos el código. */
  destination: string;
  code: string;
  onCodeChange: (code: string) => void;
  /** «Usar otro correo». */
  onBack: () => void;
  /** Solo con los seis números: si faltan, la franja lo dice. */
  onVerify: () => void;
  onResend: () => void;
  /** Los casilleros en rojo: el código no es válido. */
  invalid?: boolean;
  /** Los casilleros bloqueados: se está verificando, el código ya no sirve o la cuenta no puede entrar. */
  locked?: boolean;
  /** El error del servidor. */
  message?: AuthMessageContent | null;
  /** «Verificar», salvo en el registro de personas («Verificar y crear la cuenta») o mientras corre la espera del servidor. */
  verifyLabel?: string;
  verifyDisabled?: boolean;
  /** Mientras se verifica: «Verificando…» con el aro («Criterio · Botones», Guardando). */
  verifyPending?: boolean;
  /** Los segundos que faltan para poder pedir otro código. */
  resendSeconds: number;
  /** La espera que pidió el servidor (429), en lugar del texto del botón. */
  resendRetryLabel?: string | null;
  resendDisabled?: boolean;
  /** Mientras se manda otro código: «Enviando…» con el aro. */
  resendPending?: boolean;
  /** Debajo de los botones: «Volver a ingresar» con la cuenta suspendida. */
  footer?: ReactNode;
}

/// El paso del código del ingreso y de los dos registros (tableros Ingreso, Registro y Registro-Empresa): es un paso de
/// la misma pantalla, sin ruta propia. «Verificar» no se apaga por un código incompleto («Criterio · Botones»): la franja
/// dice qué falta y un dígito nuevo la saca.
export function AuthCodeStep({ destination, code, onCodeChange, onBack, onVerify, onResend, invalid = false, locked = false, message,
  verifyLabel, verifyDisabled = false, verifyPending = false, resendSeconds, resendRetryLabel, resendDisabled = false, resendPending = false, footer }: AuthCodeStepProps) {
  const { t } = useTranslation("auth");
  const hintId = useId();
  const [incomplete, setIncomplete] = useState(false);
  const waiting = resendSeconds > 0 || Boolean(resendRetryLabel);

  function verify() {
    if (code.length !== codeLength) { setIncomplete(true); return; }
    onVerify();
  }

  return <div className="flex flex-col gap-[22px]">
    {/* .lnk del tablero: un enlace de texto con su flecha, a 4. */}
    <Button type="button" variant="link" onClick={onBack} className="gap-1 self-start">
      <ChevronLeft aria-hidden="true" size={16} strokeWidth={2} />{t("login.otherEmail")}
    </Button>
    <div>
      <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t("login.checkEmail")}</h1>
      <p id={hintId} className="mt-1.5 text-sm leading-normal text-[var(--t2)] wrap-anywhere">
        <Trans ns="auth" i18nKey="login.sentCode" values={{ email: destination }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" /> }} />
      </p>
    </div>
    <OtpInput length={codeLength} value={code} variant="auth" label={t("login.codeLabel")} invalid={invalid} disabled={locked} aria-describedby={hintId}
      onChange={(next) => { setIncomplete(false); onCodeChange(next); }} />
    <AuthMessage message={incomplete ? { text: t("common:code.incomplete") } : message} />
    <div className="flex flex-col gap-2.5">
      <Button type="button" size="lg" onClick={verify} disabled={verifyDisabled} pending={verifyPending} pendingLabel={t("common:code.verifying")}>{verifyLabel ?? t("login.verify")}</Button>
      <Button type="button" size="lg" variant="outline" onClick={() => { setIncomplete(false); onResend(); }} disabled={waiting || resendDisabled}
        pending={resendPending} pendingLabel={t("common:code.sending")}>
        {resendRetryLabel ?? (resendSeconds > 0 ? t("login.resendIn", { seconds: resendSeconds }) : t("login.resendCode"))}
      </Button>
    </div>
    {footer}
  </div>;
}
