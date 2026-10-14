import { api } from "@/shared/api/httpClient";
import { toSearch } from "@/shared/api/toSearch";
import { whatsappQueryRoot } from "../../api/untaken";
import type {
  PagedResultOfWhatsAppTeamResponse,
  PlatformWhatsAppBotResponse,
  UpdatePlatformWhatsAppBotRequest,
  UpdateWhatsAppBotRequest,
  WhatsAppBotResponse,
  WhatsAppNumberListResponse,
} from "../../api/types";

export type BotScope = "organization" | "platform";

/** El bot de cada número, el de Plataforma y lo que el bot necesita leer (los números para elegir y los equipos). */
export const botQueryRoot = [...whatsappQueryRoot, "bot"] as const;

// Hasta 100 números y equipos en una sola página: el selector del número y el «Pasa a» de cada opción los nombran.
const allPage = { page: 1, pageSize: 100 };

export const botNumbersQueryKey = [...botQueryRoot, "numbers"] as const;
export const fetchBotNumbers = (signal?: AbortSignal) =>
  api.get<WhatsAppNumberListResponse>(`/api/organization/whatsapp/numbers?${toSearch(allPage)}`, { signal });

export const botTeamsQueryKey = (scope: BotScope) => [...botQueryRoot, scope, "teams"] as const;
export const fetchBotTeams = (scope: BotScope, signal?: AbortSignal) =>
  api.get<PagedResultOfWhatsAppTeamResponse>(`/api/${scope}/whatsapp/teams?${toSearch(allPage)}`, { signal });

const numberBotPath = (numberId: string) => `/api/organization/whatsapp/numbers/${encodeURIComponent(numberId)}/bot`;
export const numberBotQueryKey = (numberId: string) => [...botQueryRoot, "organization", numberId] as const;
export const fetchNumberBot = (numberId: string, signal?: AbortSignal) => api.get<WhatsAppBotResponse>(numberBotPath(numberId), { signal });
export const updateNumberBot = (numberId: string, request: UpdateWhatsAppBotRequest) => api.put<WhatsAppBotResponse>(numberBotPath(numberId), request);

export const platformBotQueryKey = [...botQueryRoot, "platform"] as const;
export const fetchPlatformBot = (signal?: AbortSignal) => api.get<PlatformWhatsAppBotResponse>("/api/platform/whatsapp/bot", { signal });
export const updatePlatformBot = (request: UpdatePlatformWhatsAppBotRequest) => api.put<PlatformWhatsAppBotResponse>("/api/platform/whatsapp/bot", request);
