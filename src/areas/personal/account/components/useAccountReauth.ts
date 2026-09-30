import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import type { RequestReauthRequest, ReauthCodeResponse } from "@/shared/api/types";
import { requestReauth, verifyReauth } from "../api/reauth";

/** La prueba queda en memoria y se reutiliza si la mutación final perdió su respuesta. */
export function useAccountReauth(context: RequestReauthRequest) {
  const { t } = useTranslation("errors");
  const [proof, setProof] = useState<ReauthCodeResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const ticket = useRef<string | null>(null);
  const started = useRef(false);
  const retry = useRetryAfterCountdown();
  const request = useIdempotentMutation((_: void, key) => requestReauth(context, key));
  const verify = useIdempotentMutation((value: string, key) => verifyReauth({ ...context, sourceMethodId: proof!.sourceMethodId, code: value }, key));
  function showError(error: unknown) {
    retry.startFromError(error);
    setFailure(error instanceof ApiError ? error.detail ?? t(error.isNetworkError ? "network" : "server") : t("server"));
  }
  async function send() {
    setFailure(null);
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
  return { proof, code, setCode, failure, setFailure, showError, getTicket, retry, send,
    isPending: request.isPending || verify.isPending };
}
