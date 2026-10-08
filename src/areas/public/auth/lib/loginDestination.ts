import { ApiError } from "@/shared/api/ApiError";
import { accountErrorCodes } from "@/shared/api/accountContract";
import type { LoginDestination, LoginDestinationRequest } from "@/shared/api/types";

/** La UI selecciona el tipo; el backend valida y normaliza país y número. */
export function toLoginDestinationRequest(destination: LoginDestination): LoginDestinationRequest {
  return destination.type === "email" ? { email: destination.email }
    : { phone: { ...destination.phone }, channel: "whatsapp" };
}

/** Para sameOperation: además del destino, cada formulario compara código, consentimiento y recorrido. */
export function sameLoginDestination(previous: LoginDestination, next: LoginDestination): boolean {
  if (previous.type === "email" && next.type === "email") return previous.email === next.email;
  if (previous.type === "phone" && next.type === "phone") {
    return previous.phone.country === next.phone.country && previous.phone.number === next.phone.number;
  }
  return false;
}

/** Errores de identidad Phone; el texto siempre lo entrega apiErrorMessage. */
export function loginDestinationErrorField(error: unknown): "phone" | null {
  if (!(error instanceof ApiError)) return null;
  if (error.errors?.phone?.length) return "phone";
  return phoneErrorCodes.some((code) => code === error.code) ? "phone" : null;
}

const phoneErrorCodes = [accountErrorCodes.phoneInvalid, accountErrorCodes.phoneNotMobile,
  accountErrorCodes.phoneCountryNotAllowed, accountErrorCodes.phoneAlreadyUsed,
  accountErrorCodes.signupPhoneTaken, accountErrorCodes.phoneAccountNotFound];
