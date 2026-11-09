import { api } from "@/shared/api/httpClient";
import type { NotificationListResponse } from "@/shared/api/types";

/** La campana de quien mira. Al cambiar de acceso u organización, `queryClient.clear()` la vacía (useSwitchAccess). */
export const notificationsQueryKey = ["notifications"] as const;

/** K1: hasta 50 avisos, del más nuevo al más viejo. */
export function fetchNotifications(signal?: AbortSignal): Promise<NotificationListResponse> {
  return api.get<NotificationListResponse>("/api/notifications", { signal });
}

/** K1: 204 sin cuerpo y sin `Idempotency-Key`; el back ignora un id que no es de un aviso de quien mira. */
export function markNotificationRead(id: string): Promise<void> {
  return api.post<void>(`/api/notifications/${encodeURIComponent(id)}/read`);
}
