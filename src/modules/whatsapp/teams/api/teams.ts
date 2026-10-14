import { api } from "@/shared/api/httpClient";
import { optionPage, type ResourceOptions } from "@/shared/api/resourceOptions";
import { toSearch } from "@/shared/api/toSearch";
import type { PagedRequest } from "@/shared/api/types";
import type {
  CreateWhatsAppTeamRequest,
  PagedResultOfWhatsAppReferenceResponse,
  PagedResultOfWhatsAppTeamResponse,
  UpdateWhatsAppTeamRequest,
  WhatsAppReferenceResponse,
  WhatsAppTeamDetailResponse,
  WhatsAppTeamResponse,
} from "../../api/types";

/** Los equipos de una organización (con su bandeja) o los de Plataforma (de operadores, sin bandeja). */
export type TeamScope = "organization" | "platform";

/** Página, tamaño y búsqueda: la API de equipos no ordena por columna. */
export type TeamsQuery = Pick<PagedRequest, "page" | "pageSize" | "search">;

const base = (scope: TeamScope) => `/api/${scope}/whatsapp/teams`;
const one = (scope: TeamScope, id: string) => `${base(scope)}/${encodeURIComponent(id)}`;

export const teamsQueryRoot = (scope: TeamScope) => ["whatsapp", scope, "teams"] as const;
export const teamsQueryKey = (scope: TeamScope, query: TeamsQuery) => [...teamsQueryRoot(scope), "list", query] as const;
export const teamQueryKey = (scope: TeamScope, id: string) => [...teamsQueryRoot(scope), "detail", id] as const;

export function fetchTeams(scope: TeamScope, query: TeamsQuery): Promise<PagedResultOfWhatsAppTeamResponse> {
  return api.get(`${base(scope)}${toSearch(query, true)}`);
}

export function fetchTeam(scope: TeamScope, id: string, signal?: AbortSignal): Promise<WhatsAppTeamDetailResponse> {
  return api.get(one(scope, id), { signal });
}

export function createTeam(scope: TeamScope, request: CreateWhatsAppTeamRequest, idempotencyKey: string): Promise<WhatsAppTeamResponse> {
  return api.post(base(scope), request, { headers: { "Idempotency-Key": idempotencyKey } });
}

export function updateTeam(scope: TeamScope, id: string, request: UpdateWhatsAppTeamRequest): Promise<WhatsAppTeamResponse> {
  return api.put(one(scope, id), request);
}

/** La versión viaja en la consulta (`DELETE …?version=`), como la pide el contrato. */
export function deleteTeam(scope: TeamScope, id: string, version: number): Promise<void> {
  return api.delete(`${one(scope, id)}${toSearch({ version }, true)}`);
}

/// Quiénes pueden estar en un equipo (CC11): los miembros activos de la organización (`memberId`) o los operadores de
/// Plataforma (`accountId`), con el permiso de administrar WhatsApp.
export function teamMemberOptions(scope: TeamScope): ResourceOptions<WhatsAppReferenceResponse> {
  return {
    queryKeyRoot: [...teamsQueryRoot(scope), "member-options"], id: (member) => member.id,
    queryFn: (query = optionPage, signal) => api.get<PagedResultOfWhatsAppReferenceResponse>(
      `${base(scope)}/member-options${toSearch({ page: query.page, pageSize: query.pageSize, search: query.search }, true)}`, { signal }),
  };
}
