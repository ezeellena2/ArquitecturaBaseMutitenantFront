import type { ApiError } from "./ApiError";

type SetError<TField extends string> = (field: TField, error: { type: "server"; message: string }) => void;

// Devuelve true solo cuando todos los errores del backend encajan en campos del formulario.
// Si alguno no encaja, la pantalla muestra además el error general en FormError.
export function applyApiErrorToForm<TField extends string>(
  error: ApiError,
  setError: SetError<TField>,
  fieldMap: Record<string, TField>,
): boolean {
  const errors = error.errors;
  if (!errors) return false;

  let handled = false;
  let hasUnmapped = false;
  for (const [serverField, messages] of Object.entries(errors)) {
    const message = messages[0];
    if (!message || !Object.prototype.hasOwnProperty.call(fieldMap, serverField)) {
      hasUnmapped = true;
      continue;
    }

    setError(fieldMap[serverField], { type: "server", message });
    handled = true;
  }

  return handled && !hasUnmapped;
}
