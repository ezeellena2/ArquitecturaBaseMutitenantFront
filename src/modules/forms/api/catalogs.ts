import { api } from "@/shared/api/httpClient";
import type { ResourceOptions } from "@/shared/api/resourceOptions";
import { toSearch } from "@/shared/api/toSearch";
import type { PagedRequest, VersionResponse } from "@/shared/api/types";
import type {
  CreateFormCatalogRequest,
  FormCatalogCreatedResponse,
  FormCatalogFilterCountsResponse,
  FormCatalogImportMode,
  FormCatalogImportPreviewResponse,
  FormCatalogPreviewRequest,
  FormCatalogPreviewResponse,
  FormCatalogReference,
  FormCatalogResponse,
  FormCatalogSampleContactRow,
  FormCatalogSampleMemberRow,
  FormCatalogSourceFilter,
  FormCatalogSourceResponse,
  FormCatalogStatusFilter,
  FormCatalogTagRow,
  FormCatalogUpdatedResponse,
  FormCatalogValueType,
  PagedResultOfFormCatalogItemRow,
  PagedResultOfFormCatalogRow,
  UpdateFormCatalogRequest,
} from "./types";

const base = "/api/organization/forms/catalogs";

/** El listado: el orden de la URL (264), la búsqueda, el origen y el estado. */
export type CatalogsQuery = PagedRequest & { source?: FormCatalogSourceFilter; status?: FormCatalogStatusFilter };
/**
 * Las opciones de un catálogo: de a páginas, con búsqueda y el estado; su orden es el del catálogo. `ids` (E13, hasta 100)
 * trae solo esas, para nombrar las opciones de una fuente.
 */
export type CatalogItemsQuery = Omit<PagedRequest, "sort"> & { status?: FormCatalogStatusFilter; ids?: readonly string[] };

/** Formularios cuelga de esta raíz; los catálogos, sus opciones y sus listas, de la suya: una escritura la invalida entera. */
export const formsQueryRoot = ["forms"] as const;
export const catalogsQueryRoot = [...formsQueryRoot, "catalogs"] as const;
export const catalogsQueryKey = (query: CatalogsQuery) => [...catalogsQueryRoot, "list", query] as const;
export const catalogFilterCountsQueryKey = [...catalogsQueryRoot, "filter-counts"] as const;
export const catalogQueryKey = (id: string) => [...catalogsQueryRoot, "detail", id] as const;
/** Todas las páginas y búsquedas leídas de las opciones de un catálogo. */
export const catalogItemsQueryRoot = (id: string) => [...catalogsQueryRoot, "detail", id, "items"] as const;
export const catalogItemsQueryKey = (id: string, query: CatalogItemsQuery) => [...catalogItemsQueryRoot(id), query] as const;
export const membersSourceQueryKey = [...catalogsQueryRoot, "sources", "members"] as const;
export const catalogPreviewQueryKey = (request: FormCatalogPreviewRequest) => [...catalogsQueryRoot, "preview", request] as const;
/** Lo guardado ahora cuando guardar dio un 409: una lectura por cada revisión (`round`), aparte de la ficha que se edita. */
export const catalogConflictQueryKey = (id: string, round: number, query: CatalogItemsQuery) => [...catalogsQueryRoot, "conflict", id, round, query] as const;
/** Las opciones guardadas que toca una propuesta del asistente, por la propuesta. */
export const catalogProposalTargetsQueryKey = (id: string, proposalId: string) => [...catalogsQueryRoot, "proposal-targets", id, proposalId] as const;

const paged = ({ page, pageSize, sort, search }: PagedRequest) => ({ page, pageSize, sort, search });
const catalogPath = (id: string) => `${base}/${encodeURIComponent(id)}`;

export function fetchCatalogs(query: CatalogsQuery, signal?: AbortSignal): Promise<PagedResultOfFormCatalogRow> {
  return api.get(`${base}?${toSearch({ ...paged(query), source: query.source, status: query.status })}`, { signal });
}

/** Solo el resumen del listado («7 catálogos · 6 activos», 262). */
export function fetchCatalogFilterCounts(signal?: AbortSignal): Promise<FormCatalogFilterCountsResponse> {
  return api.get(`${base}/filter-counts`, { signal });
}

/** «Crear catálogo»: 201 con el detalle y el mapa de ids de las opciones nuevas; uno a mano puede traer sus campos y su presentación (E13). */
export function createCatalog(request: CreateFormCatalogRequest, idempotencyKey: string): Promise<FormCatalogCreatedResponse> {
  return api.post(base, request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function fetchCatalog(id: string, signal?: AbortSignal): Promise<FormCatalogResponse> {
  return api.get(catalogPath(id), { signal });
}

/**
 * Guardar, «Dar de baja» y «Reactivar» mandan el mismo `PUT`, con la versión que se leyó. Desde la E13 lleva también los
 * campos, la presentación y el delta de los valores de cada opción, y responde el mapa de ids de los campos nuevos.
 */
export function updateCatalog(id: string, request: UpdateFormCatalogRequest): Promise<FormCatalogUpdatedResponse> {
  return api.put(catalogPath(id), request);
}

export function fetchCatalogItems(id: string, { page, pageSize, search, status, ids }: CatalogItemsQuery, signal?: AbortSignal): Promise<PagedResultOfFormCatalogItemRow> {
  return api.get(`${catalogPath(id)}/items?${toSearch({ page, pageSize, search, status, ids })}`, { signal });
}

/** La revisión de importar: el archivo (o lo pegado, como CSV), el modo, la versión y la página de sus listas. */
export interface CatalogImportPreviewInput {
  file: File;
  mode: NonNullable<FormCatalogImportMode>;
  version: number;
  page?: number;
  pageSize?: number;
}

/** Aplicar: el mismo archivo con el `sha256` de la revisión y lo que se confirmó. */
export interface CatalogImportInput {
  file: File;
  mode: NonNullable<FormCatalogImportMode>;
  version: number;
  sha256: string;
  skipErrorRows: boolean;
  confirmedDeactivations: number;
}

function importForm(fields: Record<string, string | number | boolean | File | undefined>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, value instanceof File ? value : String(value));
  }
  return form;
}

/** Lo que haría la importación, sin guardar. */
export function previewCatalogImport(id: string, { file, mode, version, page, pageSize }: CatalogImportPreviewInput): Promise<FormCatalogImportPreviewResponse> {
  return api.postForm(`${catalogPath(id)}/imports/previews`, importForm({ file, mode, version, page, pageSize }));
}

export function importCatalog(id: string, { file, mode, version, sha256, skipErrorRows, confirmedDeactivations }: CatalogImportInput, idempotencyKey: string): Promise<VersionResponse> {
  return api.postForm(`${catalogPath(id)}/imports`, importForm({ file, mode, version, sha256, skipErrorRows, confirmedDeactivations }), { headers: { "Idempotency-Key": idempotencyKey } });
}

/** El `.xlsx` del catálogo: binario, sin leer el cuerpo acá. */
export function exportCatalog(id: string): Promise<Response> {
  return api.response(`${catalogPath(id)}/export`, { method: "GET" });
}

/** La plantilla `.xlsx` vacía del tipo del valor; con `catalogId` (E13), también las columnas de los campos activos de ese catálogo. */
export function fetchCatalogTemplate(valueType: FormCatalogValueType, catalogId?: string): Promise<Response> {
  return api.response(`${base}/template?${toSearch({ valueType, catalogId })}`, { method: "GET" });
}

/** Las columnas de «Miembros» con sus operadores, para el editor de filtros. */
export function fetchMembersSource(signal?: AbortSignal): Promise<FormCatalogSourceResponse> {
  return api.get(`${base}/sources/members`, { signal });
}

/** La vista previa de unos filtros sin guardar: solo lee. */
export function previewCatalog(request: FormCatalogPreviewRequest, signal?: AbortSignal): Promise<FormCatalogPreviewResponse> {
  return api.post(`${base}/previews`, request, { signal });
}

function lookup<T>(path: string, key: string, id: (item: T) => string): ResourceOptions<T> {
  return { queryKeyRoot: [...catalogsQueryRoot, key], id, queryFn: (query, signal) => api.get(`${base}/${path}?${toSearch(paged(query))}`, { signal }) };
}

/** Los roles y las empresas de los filtros de «Miembros», de a páginas y con búsqueda en el servidor. */
export const memberRoleOptions = lookup<FormCatalogReference>("sources/members/roles", "roles", (role) => role.id);
export const memberCompanyOptions = lookup<FormCatalogReference>("sources/members/companies", "companies", (company) => company.id);
/** Las etiquetas de los contactos, para el filtro de «Contactos». */
export const contactTagOptions = lookup<FormCatalogTagRow>("sources/contacts/tags", "tags", (tag) => tag.name);
/** La persona y el cliente de ejemplo de la vista previa. */
export const sampleMemberOptions = lookup<FormCatalogSampleMemberRow>("sample-members", "sample-members", (member) => member.memberId);
export const sampleContactOptions = lookup<FormCatalogSampleContactRow>("sample-contacts", "sample-contacts", (contact) => contact.contactId);
