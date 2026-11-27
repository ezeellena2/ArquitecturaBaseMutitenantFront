import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";

const channelUnavailable = "Invitations.Invitation.ChannelUnavailable";
const consentRequired = "WhatsApp.PhoneImport.ConsentRequired";
const dailyLimit = "WhatsApp.PhoneImport.DailyLimit";

/// El 400 de la casilla (decisión 179) va debajo de ella, como el error de un campo, y no en la franja.
export function isConsentRequired(error: unknown): boolean {
  return error instanceof ApiError && (error.code === consentRequired || Boolean(error.errors?.consentConfirmed?.length));
}

/// Si WhatsApp no puede mandar invitaciones (503 `Invitations.Invitation.ChannelUnavailable`), el texto del back o el
/// propio, y no el «Algo salió mal» de cualquier 5xx. Lo demás, con el texto común: el envío muestra también la red y
/// los 5xx en su franja (`meta.handlesError`). El tope diario de las invitaciones por WhatsApp (429
/// `WhatsApp.PhoneImport.DailyLimit`, como el del correo) dice el suyo, y la espera la cuenta el botón.
export function phoneImportErrorMessage(error: unknown, t: TFunction): string | null {
  if (error instanceof ApiError && error.code === channelUnavailable) return error.detail ?? t("whatsapp:phones.errors.channelUnavailable");
  if (error instanceof ApiError && error.code === dailyLimit) return error.detail ?? t("whatsapp:phones.errors.dailyLimit");
  return error == null ? null : apiErrorMessage(error, t);
}
