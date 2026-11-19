import type { QueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/httpClient";
import type { NotificationListResponse } from "@/shared/api/types";

/** La campana de quien mira. Al cambiar de acceso u organización, `queryClient.clear()` la vacía (useSwitchAccess). */
export const notificationsQueryKey = ["notifications"] as const;

/**
 * La campana vuelve a leerse: la llama cada acción que resuelve, o descubre resuelta, la fuente de un aviso (aprobar una
 * organización o una recuperación, cambiar un método de ingreso), para que el número no siga contando lo que ya no espera.
 */
export function invalidateNotifications(client: QueryClient): Promise<void> {
  return client.invalidateQueries({ queryKey: notificationsQueryKey });
}

/** K1: hasta 50 avisos, del más nuevo al más viejo. */
export function fetchNotifications(signal?: AbortSignal): Promise<NotificationListResponse> {
  return api.get<NotificationListResponse>("/api/notifications", { signal });
}

/** K1: 204 sin cuerpo y sin `Idempotency-Key`; el back ignora un id que no es de un aviso de quien mira. */
export function markNotificationRead(id: string): Promise<void> {
  return api.post<void>(`/api/notifications/${encodeURIComponent(id)}/read`);
}
