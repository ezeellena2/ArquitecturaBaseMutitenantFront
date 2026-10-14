import { ApiError } from "@/shared/api/ApiError";

export type BroadcastField = "kind" | "templateId";

/// Lo que el back rechaza de una difusión va debajo de su dato, con su texto: nadie que acepte (o con esa etiqueta que
/// acepte) va en «Destinatarios»; una plantilla que dejó de estar aprobada, en «Plantilla». `PaymentRequired` no es de un
/// dato: va en la franja del diálogo.
const fields: Readonly<Record<string, BroadcastField>> = {
  "WhatsApp.Broadcast.NoRecipients": "kind",
  "WhatsApp.Template.NotApproved": "templateId",
};

export function broadcastErrorField(error: unknown): BroadcastField | null {
  return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
}
