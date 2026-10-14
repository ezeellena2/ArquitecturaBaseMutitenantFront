import { api } from "@/shared/api/httpClient";
import type { ResourceOptions } from "@/shared/api/resourceOptions";
import { toSearch } from "@/shared/api/toSearch";
import type { PagedRequest } from "@/shared/api/types";
import { whatsappQueryRoot } from "../../api/untaken";
import type {
  CreateWhatsAppBroadcastRequest,
  PagedResultOfWhatsAppBroadcastResponse,
  PagedResultOfWhatsAppRecipientResponse,
  WhatsAppAudienceKind,
  WhatsAppBroadcastDetailResponse,
  WhatsAppBroadcastEstimateResponse,
  WhatsAppBroadcastListResponse,
  WhatsAppBroadcastResponse,
  WhatsAppBroadcastStatus,
  WhatsAppRecipientStatus,
  WhatsAppTemplateOptionResponse,
} from "../../api/types";

const base = "/api/organization/whatsapp/broadcasts";

/** La página de difusiones con las programadas de la banda (CC07), de una sola respuesta. */
export type BroadcastsPage = PagedResultOfWhatsAppBroadcastResponse & { scheduled: number };

export type BroadcastsQuery = PagedRequest & { status?: WhatsAppBroadcastStatus };
export type RecipientsQuery = PagedRequest & { status?: WhatsAppRecipientStatus };
/** Los destinatarios paginados con la difusión de la banda y sus contadores, de una sola respuesta. */
export type BroadcastDetailPage = PagedResultOfWhatsAppRecipientResponse & { broadcast: WhatsAppBroadcastResponse };

export interface EstimateQuery {
  templateId: string;
  kind: WhatsAppAudienceKind;
  tag?: string;
}

/** Difusiones y sus opciones cuelgan de esta raíz: crear o cancelar la invalida entera. */
export const broadcastsQueryRoot = [...whatsappQueryRoot, "broadcasts"] as const;
export const broadcastsQueryKey = (query: BroadcastsQuery) => [...broadcastsQueryRoot, "list", query] as const;
export const broadcastQueryKey = (id: string, query: RecipientsQuery) => [...broadcastsQueryRoot, "detail", id, query] as const;
export const estimateQueryKey = (query: EstimateQuery) => [...broadcastsQueryRoot, "estimate", query] as const;

// El back no ordena las difusiones: el `sort` de la URL no viaja.
const paged = ({ page, pageSize, search }: PagedRequest) => ({ page, pageSize, search });

export async function fetchBroadcasts(query: BroadcastsQuery): Promise<BroadcastsPage> {
  const list = await api.get<WhatsAppBroadcastListResponse>(`${base}?${toSearch({ ...paged(query), status: query.status })}`);
  return { ...list.broadcasts, scheduled: list.scheduled };
}

// CC16: la búsqueda y el estado filtran los destinatarios.
export async function fetchBroadcast(id: string, query: RecipientsQuery): Promise<BroadcastDetailPage> {
  const detail = await api.get<WhatsAppBroadcastDetailResponse>(`${base}/${encodeURIComponent(id)}?${toSearch({ ...paged(query), status: query.status })}`);
  return { ...detail.recipients, broadcast: detail.broadcast };
}

export function fetchEstimate(query: EstimateQuery, signal?: AbortSignal): Promise<WhatsAppBroadcastEstimateResponse> {
  return api.get(`${base}/estimate?${toSearch(query)}`, { signal });
}

export function createBroadcast(request: CreateWhatsAppBroadcastRequest, idempotencyKey: string): Promise<WhatsAppBroadcastResponse> {
  return api.post(base, request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function cancelBroadcast(id: string, version: number): Promise<WhatsAppBroadcastResponse> {
  return api.post(`${base}/${encodeURIComponent(id)}/cancel`, { version });
}

/** CC04: solo las plantillas de Marketing aprobadas, con su texto para la vista previa. */
export const broadcastTemplateOptions: ResourceOptions<WhatsAppTemplateOptionResponse> = {
  queryKeyRoot: [...broadcastsQueryRoot, "template-options"], id: (template) => template.templateId,
  queryFn: (query, signal) => api.get(`${base}/template-options?${toSearch(paged(query))}`, { signal }),
};

/** CC04: las etiquetas para elegir a quiénes, con «Mandar difusiones». */
export const broadcastTagOptions: ResourceOptions<string> = {
  queryKeyRoot: [...broadcastsQueryRoot, "tags"], id: (tag) => tag,
  queryFn: (query, signal) => api.get(`${base}/tags?${toSearch(paged(query))}`, { signal }),
};

/** Duplicar (CC17): la plantilla de la original, si sigue entre las que se pueden usar; se busca por su nombre. */
export async function findTemplateOption(template: { id: string; name: string }, signal?: AbortSignal): Promise<WhatsAppTemplateOptionResponse | null> {
  const page = await broadcastTemplateOptions.queryFn({ page: 1, pageSize: 10, search: template.name }, signal);
  return page.items.find((option) => option.templateId === template.id) ?? null;
}
