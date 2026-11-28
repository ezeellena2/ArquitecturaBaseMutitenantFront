import { api } from "@/shared/api/httpClient";
import { defaultPageSize } from "@/shared/api/pageSizes";
import type { WhatsAppConversationListResponse, WhatsAppUntakenResponse } from "./types";

/** La raíz de todas las consultas del módulo: cada área cuelga la suya (`[...whatsappQueryRoot, "chats", …]`). */
export const whatsappQueryRoot = ["whatsapp"] as const;

/** Decisión técnica 12: las bandejas se releen cada 10 s; la conversación abierta, cada 5 s. */
export const inboxRefetchInterval = 10_000;
export const conversationRefetchInterval = 5_000;
/** Fuera de la bandeja, el contador del menú se espacia a 30 s (KAN-30); dentro de Chats no sondea. */
export const untakenRefetchInterval = 30_000;

/** CC09: los sin tomar de cada bandeja que la persona puede ver; `null` en la que no puede. */
export const untakenQueryKey = [...whatsappQueryRoot, "untaken"] as const;
export const fetchUntaken = (signal?: AbortSignal) => api.get<WhatsAppUntakenResponse>("/api/organization/whatsapp/untaken", { signal });

/** Plataforma no tiene ruta propia para el contador: los conteos llegan con la lista de Consultas usando el mínimo `pageSize` permitido por `PagedRequest` (10). */
export const platformUntakenQueryKey = [...whatsappQueryRoot, "platform", "untaken"] as const;
export const fetchPlatformUntaken = (signal?: AbortSignal) =>
  api.get<WhatsAppConversationListResponse>(`/api/platform/whatsapp/conversations?pageSize=${defaultPageSize}`, { signal }).then((list) => list.counts.untaken);
