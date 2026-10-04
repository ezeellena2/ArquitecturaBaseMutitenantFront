import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";

/// Qué hacía la persona en la ficha cuando el back dijo que no: guardar el acceso o quitar de la organización.
export type UserAction = "save" | "remove";

/// El texto de un error de la ficha de Usuario. `Tenancy.Member.LastTenantAdmin` sale por varios caminos y el back
/// dice siempre lo mismo (decisión 29 de la consolidación): si la última Dueña se lo hace a sí misma, el texto del
/// tablero Usuario le dice qué hacer; si se lo hace otra persona, queda el del back. Lo demás, como cualquier acción:
/// `null` si ya lo avisó el MutationCache.
export function userErrorMessage(error: unknown, t: TFunction, { self, action }: { self: boolean; action: UserAction }): string | null {
  if (self && error instanceof ApiError && error.code === "Tenancy.Member.LastTenantAdmin") {
    return t(action === "remove" ? "users:errors.lastOwnerLeaving" : "users:errors.lastOwnerRemovingRole");
  }
  return actionErrorMessage(error, t);
}
