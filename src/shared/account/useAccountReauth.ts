import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import type { RequestReauthRequest, ReauthCodeResponse } from "@/shared/api/types";
import { requestReauth, verifyReauth } from "./api/reauth";
import { loginMethodErrorField } from "./errors";

/** La prueba queda en memoria y se reutiliza si la mutación final perdió su respuesta. Como al verificar un correo
 * (Cuenta-Verificar), el código a medias y el que el back rechaza van debajo de los casilleros (`codeFailure`); lo demás
 * (vencido, sin conexión, esperá para pedir otro), en la franja del diálogo (`failure`). */
export function useAccountReauth(context: RequestReauthRequest) {
  const { t } = useTranslation("errors");
  const [proof, setProof] = useState<ReauthCodeResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [codeFailure, setCodeFailure] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const ticket = useRef<string | null>(null);
  const started = useRef(false);
  const retry = useRetryAfterCountdown();
  const request = useIdempotentMutation((_: void, key) => requestReauth(context, key), { meta: { handlesError: true } });
  const verify = useIdempotentMutation((value: string, key) => verifyReauth({ ...context, sourceMethodId: proof!.sourceMethodId, code: value }, key), { meta: { handlesError: true } });
  function showError(error: unknown) {
    retry.startFromError(error);
    if (loginMethodErrorField(error) === "code") setCodeFailure(apiErrorMessage(error, t));
    else setFailure(apiErrorMessage(error, t));
  }
  /// Un dígito nuevo saca lo que decía debajo de los casilleros y la franja.
  function changeCode(value: string) {
    setCode(value);
    setCodeFailure(null);
    setFailure(null);
  }
  /// «Criterio · Botones»: el botón no se apaga por un código a medias; lo que falta va debajo de los casilleros.
  function codeComplete() {
    if (code.length === 6) return true;
    setCodeFailure(t("common:code.incomplete"));
    return false;
  }
  async function send() {
    setFailure(null);
    setCodeFailure(null);
    try { setProof(await request.mutateAsync()); }
    catch (error) { showError(error); }
  }
  useEffect(() => {
    if (!started.current) { started.current = true; void send(); }
  });
  async function getTicket() {
    ticket.current ??= (await verify.mutateAsync(code)).reauthTicket;
    return ticket.current;
  }
  return { proof, code, changeCode, codeComplete, failure, codeFailure, setFailure, showError, getTicket, retry, send,
    isPending: request.isPending || verify.isPending };
}
