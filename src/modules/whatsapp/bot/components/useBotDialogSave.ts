import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { botQueryRoot } from "../api/bot";
import type { BotPatch } from "../lib/botModel";

/// El guardado de un diálogo del bot: el PUT con todo el bot y el cambio encima (lo arma la pantalla, con la versión
/// leída). Un error queda en la franja del diálogo; el 409 de concurrencia, además, relee el bot al cerrar.
export function useBotDialogSave(onSave: (patch: BotPatch) => Promise<unknown>, onClose: () => void) {
  const { t } = useTranslation("whatsapp");
  const { failure, clear, fail, close } = useDialogFailure(onClose, botQueryRoot);
  const save = useMutation({ mutationFn: onSave });
  return {
    failure, clear, close, pending: save.isPending,
    submit: (patch: BotPatch) => save.mutate(patch, {
      onSuccess: () => { toast.success(t("bot.saved")); onClose(); },
      onError: fail,
    }),
  };
}
