import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { toastActionError } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import type { WhatsAppBroadcastResponse } from "../../api/types";
import { broadcastsQueryRoot, cancelBroadcast } from "../api/broadcasts";
import { duplicatePath } from "../columns";
import { countOf } from "../../lib/values";

/**
 * «Duplicar» y «Cancelar difusión» (tableros WA-Difusiones y WA-Difusion-Resultados, con sus M-*): duplicar abre Nueva
 * difusión con los datos de la original (CC17), que se crea con el alta de siempre; cancelar una programada pregunta
 * antes y manda la versión que se leyó. Un 409
 * (`WhatsApp.Broadcast.NotCancellable`: ya salió) se avisa abajo, en rojo, con el texto del back.
 */
export function useBroadcastActions() {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState<{ broadcast: WhatsAppBroadcastResponse; returnFocusTo?: HTMLElement | null } | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: broadcastsQueryRoot });
  const cancel = useMutation({ mutationFn: (broadcast: WhatsAppBroadcastResponse) => cancelBroadcast(broadcast.id, broadcast.version) });

  return {
    duplicate: (broadcast: WhatsAppBroadcastResponse) => { void navigate(duplicatePath(broadcast.id)); },
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
