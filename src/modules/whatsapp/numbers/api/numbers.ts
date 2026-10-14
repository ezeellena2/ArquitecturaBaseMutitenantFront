import { api } from "@/shared/api/httpClient";
import { toSearch } from "@/shared/api/toSearch";
import type { ApiSchemas } from "@/shared/api/types";
import { whatsappQueryRoot } from "../../api/untaken";
import type {
  CheckWhatsAppNumberRequest,
  ConnectPlatformWhatsAppNumberRequest,
  ConnectWhatsAppNumberRequest,
  PlatformWhatsAppNumberResponse,
  UpdatePlatformWhatsAppNumberRequest,
  UpdateWhatsAppNumberRequest,
  WhatsAppNumberListResponse,
  WhatsAppNumberResponse,
} from "../../api/types";

const organizationPath = "/api/organization/whatsapp/numbers";
const platformPath = "/api/platform/whatsapp/number";
const numberPath = (id: string) => `${organizationPath}/${encodeURIComponent(id)}`;
const idempotent = (key: string) => ({ headers: { "Idempotency-Key": key } });

/** Todo lo de Números cuelga de acá: una escritura relee la lista, el número abierto y el bot que lo nombra. */
export const numbersQueryRoot = [...whatsappQueryRoot, "numbers"] as const;

export interface NumbersQuery { page: number; pageSize: number }
export const numbersQueryKey = (query: NumbersQuery) => [...numbersQueryRoot, "list", query] as const;
export const fetchNumbers = (query: NumbersQuery, signal?: AbortSignal) =>
  api.get<WhatsAppNumberListResponse>(`${organizationPath}?${toSearch(query)}`, { signal });

export const numberQueryKey = (id: string) => [...numbersQueryRoot, "detail", id] as const;
export const fetchNumber = (id: string, signal?: AbortSignal) => api.get<WhatsAppNumberResponse>(numberPath(id), { signal });

/** El alta embebida: el `code` de Meta vive 30 s, así que el pedido sale apenas llegan el code y los ids. */
export const connectNumber = (request: ConnectWhatsAppNumberRequest, key: string) =>
  api.post<WhatsAppNumberResponse>(organizationPath, request, idempotent(key));
/** «Atiende a»: la empresa o, sin `companyId`, toda la organización. */
export const updateNumber = (id: string, request: UpdateWhatsAppNumberRequest) => api.put<WhatsAppNumberResponse>(numberPath(id), request);
/** «Comprobar medio de pago»: el back vuelve a preguntarle a Meta. */
export const checkNumber = (id: string, request: CheckWhatsAppNumberRequest) => api.post<WhatsAppNumberResponse>(`${numberPath(id)}/check`, request);
/** D7: sus chats quedan para leer, sin responder. */
export const disconnectNumber = (id: string, version: number) => api.delete<void>(`${numberPath(id)}?${toSearch({ version })}`);

/** Plataforma tiene un solo número; conectar otro lo reemplaza. */
export const platformNumberQueryKey = [...whatsappQueryRoot, "platform", "number"] as const;
export const fetchPlatformNumber = (signal?: AbortSignal) => api.get<PlatformWhatsAppNumberResponse>(platformPath, { signal });
export const connectPlatformNumber = (request: ConnectPlatformWhatsAppNumberRequest, key: string) =>
  api.post<PlatformWhatsAppNumberResponse>(platformPath, request, idempotent(key));
export const updatePlatformNumber = (request: UpdatePlatformWhatsAppNumberRequest) => api.put<PlatformWhatsAppNumberResponse>(platformPath, request);
export const checkPlatformNumber = (request: CheckWhatsAppNumberRequest) => api.post<PlatformWhatsAppNumberResponse>(`${platformPath}/check`, request);

/** El correo de soporte de la instalación, para «Si vuelve a pasar, escribí a…» del error de Meta. */
export const contactQueryKey = ["contact"] as const;
export const fetchContact = (signal?: AbortSignal) => api.get<ApiSchemas["PlatformContactResponse"]>("/api/contact", { signal });
