import { api } from "@/shared/api/httpClient";
import type { WhatsAppConversationListResponse, WhatsAppUntakenResponse } from "./types";

/** La raíz de todas las consultas del módulo: cada área cuelga la suya (`[...whatsappQueryRoot, "chats", …]`). */
export const whatsappQueryRoot = ["whatsapp"] as const;

/** Decisión técnica 12: las bandejas y su contador se releen cada 10 s; la conversación abierta, cada 5 s. */
export const inboxRefetchInterval = 10_000;
export const conversationRefetchInterval = 5_000;

/** CC09: los sin tomar de cada bandeja que la persona puede ver; `null` en la que no puede. */
export const untakenQueryKey = [...whatsappQueryRoot, "untaken"] as const;
export const fetchUntaken = (signal?: AbortSignal) => api.get<WhatsAppUntakenResponse>("/api/organization/whatsapp/untaken", { signal });

/** Plataforma no tiene ruta propia para el contador: los conteos llegan con la lista de Consultas. */
export const platformUntakenQueryKey = [...whatsappQueryRoot, "platform", "untaken"] as const;
export const fetchPlatformUntaken = (signal?: AbortSignal) =>
  api.get<WhatsAppConversationListResponse>("/api/platform/whatsapp/conversations?pageSize=10", { signal }).then((list) => list.counts.untaken);
