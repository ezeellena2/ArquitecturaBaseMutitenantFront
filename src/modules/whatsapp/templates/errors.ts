import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";

/// Los datos de una plantilla que pueden llevar un error debajo.
export type TemplateField = "name" | "category" | "body";

const fields: Readonly<Record<string, TemplateField>> = { "WhatsApp.Template.NameTaken": "name" };

/// El nombre repetido va debajo del nombre, con el texto del back.
export function templateErrorField(error: unknown): TemplateField | null {
  return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
}

const metaRejected = "WhatsApp.Number.MetaRejected";

/// Lo que se muestra cuando Meta no recibe la plantilla (503 `WhatsApp.Number.MetaRejected`): el texto del back, que dice
/// qué respondió Meta, y no el «Algo salió mal» de cualquier 5xx. Lo demás, con el texto común: el alta y Duplicar
/// muestran también la red y los 5xx en su lugar (`meta.handlesError`), así el mismo error no sale dos veces.
export function templateErrorMessage(error: unknown, t: TFunction): string | null {
  if (error instanceof ApiError && error.code === metaRejected) return error.detail ?? t("whatsapp:templates.errors.metaRejected");
  return error == null ? null : apiErrorMessage(error, t);
}
