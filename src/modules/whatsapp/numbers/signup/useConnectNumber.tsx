import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { ImportantNotice } from "@/shared/ui/ImportantNotice";
import { toastError } from "@/shared/ui/sonner";
import type { ConnectWhatsAppNumberRequest, WhatsAppSignupConfigResponse } from "../../api/types";
import { contactQueryKey, fetchContact } from "../api/numbers";
import { MetaWindowNotice } from "../components/MetaWindowNotice";
import { useEmbeddedSignup } from "./useEmbeddedSignup";

type Failure = { metaCode: string | null } | { reason: string };

const metaCodeOf = (error: ApiError): string | null => {
  const value = error.problem.metaCode;
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
};

/// El alta de un número de punta a punta (WA-Alta, Plat-WA-Alta y sus M-*): abre la ventana de Meta, y en cuanto llegan
/// el `code` y los ids los manda al back (idempotente: una respuesta perdida se reintenta con la misma clave). Conectado,
/// «Número conectado»; cancelado, «No se conectó el número»; un error de Meta, «No se pudo conectar el número» con su
/// código. Lo que no es de Meta (el número ya conectado en otra organización, red) va en el aviso rojo de abajo.
export function useConnectNumber<TResponse>({ variant, connect, onConnected }: {
  variant: "organization" | "platform";
  connect: (request: ConnectWhatsAppNumberRequest, idempotencyKey: string) => Promise<TResponse>;
  onConnected: () => Promise<void>;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const signup = useEmbeddedSignup();
  const [failure, setFailure] = useState<Failure | null>(null);
  const mutation = useIdempotentMutation((request: ConnectWhatsAppNumberRequest, key: string) => connect(request, key),
    { meta: { handlesError: true }, sameOperation: (previous, next) => previous.code === next.code });
  const contact = useQuery({ queryKey: contactQueryKey, queryFn: ({ signal }) => fetchContact(signal), staleTime: Infinity,
    enabled: failure !== null && variant === "organization", meta: { silent: true } });

  function begin(config: WhatsAppSignupConfigResponse, companyId?: string | null) {
    setFailure(null);
    signup.start(config, (outcome) => {
      if (outcome.kind === "cancelled") { toast.info(t("whatsapp:numbers.connect.cancelled")); return; }
      if (outcome.kind === "error") { setFailure({ metaCode: outcome.errorCode }); return; }
      const request: ConnectWhatsAppNumberRequest = { code: outcome.code, phoneNumberId: outcome.phoneNumberId, wabaId: outcome.wabaId,
        coexistence: outcome.coexistence, ...(variant === "organization" ? { companyId: companyId ?? null } : {}) };
      mutation.mutate(request, {
        onSuccess: async () => {
          toast.success(t("whatsapp:numbers.connect.connected"));
          await onConnected();
        },
        onError: (error) => {
          if (error.code === "WhatsApp.Number.MetaRejected") setFailure({ metaCode: metaCodeOf(error) });
          else if (error.code === "WhatsApp.Number.SignupExpired" && error.detail) setFailure({ reason: error.detail });
          else toastError(apiErrorMessage(error, t));
        },
      });
    });
  }

  const supportEmail = contact.data?.supportEmail;
  const steps = [t("whatsapp:numbers.metaError.retry"),
    ...(variant === "platform" ? [t("whatsapp:numbers.metaError.metaSupport")] : supportEmail ? [t("whatsapp:numbers.metaError.support", { email: supportEmail })] : [])];
  const ui = <>
    {signup.waiting ? <MetaWindowNotice onBack={signup.focus} onCancel={signup.cancel} /> : null}
    {failure ? <ImportantNotice open onOpenChange={(open) => { if (!open) setFailure(null); }} title={t("whatsapp:numbers.metaError.title")}
      reason={"reason" in failure ? failure.reason : t("whatsapp:numbers.metaError.reason")}
      detail={"metaCode" in failure && failure.metaCode ? t("whatsapp:numbers.metaError.code", { code: failure.metaCode }) : undefined}
      steps={steps} /> : null}
  </>;

  return { begin, prepare: signup.prepare, connecting: mutation.isPending, ui };
}
