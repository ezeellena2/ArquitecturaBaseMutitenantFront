import { api } from "@/shared/api/httpClient";
import { toSearch } from "@/shared/api/toSearch";
import type { PagedRequest } from "@/shared/api/types";
import type {
  CreateWhatsAppTemplateRequest,
  WhatsAppTemplateGroup,
  WhatsAppTemplateListResponse,
  WhatsAppTemplateResponse,
  WhatsAppTemplateStatus,
} from "../../api/types";

/** Las plantillas de una organización o las de Plataforma («Para consultas» y «Del sistema»). */
export type TemplateScope = "organization" | "platform";

/** Página, tamaño, búsqueda y estado; en Plataforma, también el grupo. La API no ordena por columna. */
export type TemplatesQuery = Pick<PagedRequest, "page" | "pageSize" | "search"> & {
  status?: WhatsAppTemplateStatus;
  group?: NonNullable<WhatsAppTemplateGroup>;
};

const base = (scope: TemplateScope) => `/api/${scope}/whatsapp/templates`;
const one = (scope: TemplateScope, id: string) => `${base(scope)}/${encodeURIComponent(id)}`;

export const templatesQueryRoot = (scope: TemplateScope) => ["whatsapp", scope, "templates"] as const;
export const templatesQueryKey = (scope: TemplateScope, query: TemplatesQuery) => [...templatesQueryRoot(scope), "list", query] as const;

export function fetchTemplates(scope: TemplateScope, query: TemplatesQuery): Promise<WhatsAppTemplateListResponse> {
  return api.get(`${base(scope)}${toSearch(query, true)}`);
}

/** La página de la lista con el resumen al lado (`approved`, CC07, y en Plataforma los conteos por grupo, CC19): es lo
 *  que lee `usePagedQuery`. */
export type TemplatePage = WhatsAppTemplateListResponse["templates"] & Pick<WhatsAppTemplateListResponse, "approved" | "consultations" | "system">;

export async function fetchTemplatePage(scope: TemplateScope, query: TemplatesQuery): Promise<TemplatePage> {
  const { templates, approved, consultations, system } = await fetchTemplates(scope, query);
  return { ...templates, approved, consultations, system };
}

/** También «Duplicar» (CC17): el formulario nuevo con los datos de la original, que se manda como una plantilla nueva. */
export function createTemplate(scope: TemplateScope, request: CreateWhatsAppTemplateRequest, idempotencyKey: string): Promise<WhatsAppTemplateResponse> {
  return api.post(base(scope), request, { headers: { "Idempotency-Key": idempotencyKey } });
}

/** La versión viaja en la consulta (`DELETE …?version=`), como la pide el contrato. */
export function deleteTemplate(scope: TemplateScope, id: string, version: number): Promise<void> {
  return api.delete(`${one(scope, id)}${toSearch({ version }, true)}`);
}
