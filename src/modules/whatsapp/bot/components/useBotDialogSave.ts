import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toastSuccess } from "@/shared/ui/sonner";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { botQueryRoot } from "../api/bot";
import type { BotData, BotPatch, BotSave } from "../lib/botModel";

/// El guardado de un diálogo del bot: el PUT con la instantánea congelada al abrir el diálogo y el cambio encima
/// (nunca el caché vivo). Un error queda en la franja del diálogo; el 409 de concurrencia, además, relee el bot al cerrar.
export function useBotDialogSave<TBot extends BotData>(base: TBot, onSave: BotSave<TBot>, onClose: () => void) {
  const { t } = useTranslation("whatsapp");
  const { failure, clear, fail, close } = useDialogFailure(onClose, botQueryRoot);
  const save = useMutation({ mutationFn: ({ snapshot, patch }: { snapshot: TBot; patch: BotPatch }) => onSave(snapshot, patch) });
  return {
    failure, clear, close, pending: save.isPending,
    submit: (patch: BotPatch) => save.mutate({ snapshot: base, patch }, {
      onSuccess: () => { toastSuccess(t("bot.saved")); onClose(); },
      onError: fail,
    }),
  };
}
