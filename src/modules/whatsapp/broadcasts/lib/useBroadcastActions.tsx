import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { toastActionError } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import type { WhatsAppBroadcastResponse } from "../../api/types";
import { broadcastsQueryRoot, cancelBroadcast, duplicateBroadcast } from "../api/broadcasts";
import { broadcastPath } from "../columns";
import { countOf } from "./broadcastText";

/**
 * «Duplicar» y «Cancelar difusión» (tableros WA-Difusiones y WA-Difusion-Resultados, con sus M-*): duplicar es un alta
 * idempotente que lleva a la copia; cancelar una programada pregunta antes y manda la versión que se leyó. Un 409
 * (`WhatsApp.Broadcast.NotCancellable`: ya salió) se avisa abajo, en rojo, con el texto del back.
 */
export function useBroadcastActions() {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState<{ broadcast: WhatsAppBroadcastResponse; returnFocusTo?: HTMLElement | null } | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: broadcastsQueryRoot });
  // Otra difusión es otra operación: la clave de un reintento sin conexión no pasa de una a otra.
  const duplicate = useIdempotentMutation((broadcast: WhatsAppBroadcastResponse, key) => duplicateBroadcast(broadcast.id, key),
    { sameOperation: (previous, next) => previous.id === next.id });
  const cancel = useMutation({ mutationFn: (broadcast: WhatsAppBroadcastResponse) => cancelBroadcast(broadcast.id, broadcast.version) });

  return {
    duplicate: (broadcast: WhatsAppBroadcastResponse) => duplicate.mutate(broadcast, {
      onSuccess: async (copy) => {
        toast.success(t("whatsapp:broadcasts.duplicated", { name: broadcast.name }));
        await invalidate();
        void navigate(broadcastPath(copy.id));
      },
      onError: (error) => toastActionError(error, t),
    }),
    askCancel: (broadcast: WhatsAppBroadcastResponse, returnFocusTo?: HTMLElement | null) => setCancelling({ broadcast, returnFocusTo }),
    dialog: cancelling ? <ConfirmDialog open onOpenChange={(open) => { if (!open) setCancelling(null); }} destructive
      title={t("whatsapp:broadcasts.cancel.title", { name: cancelling.broadcast.name })}
      description={t("whatsapp:broadcasts.cancel.description", countOf(format, cancelling.broadcast.recipients))}
      cancelLabel={t("whatsapp:broadcasts.cancel.back")} confirmLabel={t("whatsapp:broadcasts.cancel.confirm")} returnFocusTo={cancelling.returnFocusTo}
      onConfirm={() => cancel.mutate(cancelling.broadcast, {
        onSuccess: async () => { toast.success(t("whatsapp:broadcasts.cancel.done", { name: cancelling.broadcast.name })); await invalidate(); },
        onError: async (error) => { toastActionError(error, t); await invalidate(); },
      })} /> : null,
  };
}
