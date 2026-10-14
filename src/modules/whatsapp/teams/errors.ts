import { ApiError } from "@/shared/api/ApiError";

/// Los datos del equipo que pueden llevar un error debajo.
export type TeamField = "name" | "inbox" | "memberIds" | "notice";

const fields: Readonly<Record<string, TeamField>> = { "WhatsApp.Team.NameTaken": "name" };

/// El nombre repetido va debajo del nombre, con el texto del back; lo demás (el 409 de otra persona), en la franja.
export function teamErrorField(error: unknown): TeamField | null {
  return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
}
