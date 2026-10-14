import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";

const channelUnavailable = "Invitations.Invitation.ChannelUnavailable";

/// Si WhatsApp no puede mandar invitaciones (503 `Invitations.Invitation.ChannelUnavailable`), el texto del back o el
/// propio, y no el «Algo salió mal» de cualquier 5xx. Lo demás, con el texto común: el envío muestra también la red y
/// los 5xx en su franja (`meta.handlesError`).
export function phoneImportErrorMessage(error: unknown, t: TFunction): string | null {
  if (error instanceof ApiError && error.code === channelUnavailable) return error.detail ?? t("whatsapp:phones.errors.channelUnavailable");
  return error == null ? null : apiErrorMessage(error, t);
}
