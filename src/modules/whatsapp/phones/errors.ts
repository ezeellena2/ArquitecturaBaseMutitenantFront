import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { countOf } from "@/shared/format/countOf";
import type { FormatState } from "@/shared/format/useFormat";

const channelUnavailable = "Invitations.Invitation.ChannelUnavailable";
const consentRequired = "WhatsApp.PhoneImport.ConsentRequired";
const dailyLimit = "WhatsApp.PhoneImport.DailyLimit";
const tooManyInvitations = "WhatsApp.PhoneImport.TooManyInvitations";

/// El 400 de la casilla (decisión 179) va debajo de ella, como el error de un campo, y no en la franja.
export function isConsentRequired(error: unknown): boolean {
  return error instanceof ApiError && (error.code === consentRequired || Boolean(error.errors?.consentConfirmed?.length));
}

/// Si WhatsApp no puede mandar invitaciones (503 `Invitations.Invitation.ChannelUnavailable`), el texto del back o el
/// propio, y no el «Algo salió mal» de cualquier 5xx. Lo demás, con el texto común: el envío muestra también la red y
/// los 5xx en su franja (`meta.handlesError`). El tope diario de las invitaciones por WhatsApp (429
/// `WhatsApp.PhoneImport.DailyLimit`, como el del correo) dice el suyo, y la espera la cuenta el botón. Una carga con más
/// invitaciones que ese tope (400 `WhatsApp.PhoneImport.TooManyInvitations`, B9) no entra ni esperando: el texto dice el
/// máximo del día, que llega en `dailyLimit`, y que hay que partirla.
export function phoneImportErrorMessage(error: unknown, t: TFunction, format: FormatState): string | null {
  if (error instanceof ApiError && error.code === channelUnavailable) return error.detail ?? t("whatsapp:phones.errors.channelUnavailable");
  if (error instanceof ApiError && error.code === dailyLimit) return error.detail ?? t("whatsapp:phones.errors.dailyLimit");
  if (error instanceof ApiError && error.code === tooManyInvitations && typeof error.problem.dailyLimit === "number")
    return t("whatsapp:phones.errors.tooManyInvitations", countOf(format, error.problem.dailyLimit));
  return error == null ? null : apiErrorMessage(error, t);
}
