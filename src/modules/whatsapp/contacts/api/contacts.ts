import { api } from "@/shared/api/httpClient";
import type { ResourceOptions } from "@/shared/api/resourceOptions";
import { toSearch } from "@/shared/api/toSearch";
import type { PagedRequest } from "@/shared/api/types";
import { whatsappQueryRoot } from "../../api/untaken";
import type {
  PagedResultOfWhatsAppContactBroadcastResponse,
  PagedResultOfWhatsAppContactConversationResponse,
  PagedResultOfWhatsAppContactResponse,
  UpdateWhatsAppContactRequest,
  WhatsAppConsent,
  WhatsAppContactListResponse,
  WhatsAppContactResponse,
  WhatsAppImportPreviewResponse,
  WhatsAppImportResponse,
} from "../../api/types";

const base = "/api/organization/whatsapp/contacts";

export type ContactsQuery = PagedRequest & { tag?: string; consent?: WhatsAppConsent };

/** La página de contactos con el resumen de la banda (`total` y `accepting`), de una sola respuesta. */
export type ContactsPage = PagedResultOfWhatsAppContactResponse & { summary: Pick<WhatsAppContactListResponse, "total" | "accepting"> };

/** Contactos, sus etiquetas y su importación cuelgan de esta raíz: una escritura la invalida entera. */
export const contactsQueryRoot = [...whatsappQueryRoot, "contacts"] as const;
export const contactsQueryKey = (query: ContactsQuery) => [...contactsQueryRoot, "list", query] as const;
export const contactQueryKey = (id: string) => [...contactsQueryRoot, "detail", id] as const;
export const contactConversationsQueryKey = (id: string, query: PagedRequest) => [...contactsQueryRoot, "detail", id, "conversations", query] as const;
export const contactBroadcastsQueryKey = (id: string, query: PagedRequest) => [...contactsQueryRoot, "detail", id, "broadcasts", query] as const;

// El back no ordena los contactos: el `sort` de la URL no viaja.
const paged = ({ page, pageSize, search }: PagedRequest) => ({ page, pageSize, search });

export async function fetchContacts(query: ContactsQuery, signal?: AbortSignal): Promise<ContactsPage> {
  const list = await api.get<WhatsAppContactListResponse>(`${base}?${toSearch({ ...paged(query), tag: query.tag, consent: query.consent })}`, { signal });
  return { ...list.contacts, summary: { total: list.total, accepting: list.accepting } };
}

export function fetchContact(id: string, signal?: AbortSignal): Promise<WhatsAppContactResponse> {
  return api.get(`${base}/${encodeURIComponent(id)}`, { signal });
}

export function fetchContactConversations(id: string, query: PagedRequest): Promise<PagedResultOfWhatsAppContactConversationResponse> {
  return api.get(`${base}/${encodeURIComponent(id)}/conversations?${toSearch(paged(query))}`);
}

export function fetchContactBroadcasts(id: string, query: PagedRequest): Promise<PagedResultOfWhatsAppContactBroadcastResponse> {
  return api.get(`${base}/${encodeURIComponent(id)}/broadcasts?${toSearch(paged(query))}`);
}

export function updateContact(id: string, request: UpdateWhatsAppContactRequest): Promise<WhatsAppContactResponse> {
  return api.put(`${base}/${encodeURIComponent(id)}`, request);
}

/** Las etiquetas de los contactos, de a páginas y con búsqueda en el servidor (filtro, edición e importación). */
export const contactTagOptions: ResourceOptions<string> = {
  queryKeyRoot: [...contactsQueryRoot, "tags"], id: (tag) => tag,
  queryFn: (query, signal) => api.get(`${base}/tags?${toSearch(paged(query))}`, { signal }),
};

/** El `.xlsx` de ejemplo (Nombre, Teléfono, Etiqueta y Acepta promociones): binario, sin leer el cuerpo acá. */
export function fetchImportSample(): Promise<Response> {
  return api.response(`${base}/import-sample`, { method: "GET" });
}

export interface ImportContactsInput {
  file: File;
  tag: string | null;
}

function importForm({ file, tag }: ImportContactsInput): FormData {
  const form = new FormData();
  form.append("file", file);
  if (tag) form.append("tag", tag);
  return form;
}

/** CC05: lo que haría la importación, sin guardar. */
export function previewImport(input: ImportContactsInput): Promise<WhatsAppImportPreviewResponse> {
  return api.postForm(`${base}/import/preview`, importForm(input));
}

export function importContacts(input: ImportContactsInput, idempotencyKey: string): Promise<WhatsAppImportResponse> {
  return api.postForm(`${base}/import`, importForm(input), { headers: { "Idempotency-Key": idempotencyKey } });
}
