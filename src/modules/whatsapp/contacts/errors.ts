import { ApiError } from "@/shared/api/ApiError";

/** Los rechazos del archivo van debajo del campo «Archivo», con el texto del back. */
const importFields: Readonly<Record<string, "file">> = {
  "WhatsApp.Import.InvalidFile": "file",
  "WhatsApp.Import.TooManyRows": "file",
};

export function importErrorField(error: unknown): "file" | null {
  return error instanceof ApiError && error.code ? importFields[error.code] ?? null : null;
}
