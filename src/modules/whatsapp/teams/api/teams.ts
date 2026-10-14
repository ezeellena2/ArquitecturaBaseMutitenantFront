import { api } from "@/shared/api/httpClient";
import { optionPage, type ResourceOptions } from "@/shared/api/resourceOptions";
import { toSearch } from "@/shared/api/toSearch";
import type { PagedRequest, PagedResultOfOrganizationUserHttpResponse, PagedResultOfPlatformAccountResponse } from "@/shared/api/types";
import type {
  CreateWhatsAppTeamRequest,
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

/// Quiénes pueden estar en un equipo: en la organización, sus usuarios activos (el `memberId` de Usuarios); en
/// Plataforma, los operadores activos. No hay una lectura propia del módulo: se usan las de Usuarios y Cuentas.
export function teamMemberOptions(scope: TeamScope): ResourceOptions<WhatsAppReferenceResponse> {
  return scope === "organization" ? {
    queryKeyRoot: ["whatsapp", scope, "team-members"], id: (member) => member.id,
    queryFn: async (query = optionPage, signal) => {
      const page = await api.get<PagedResultOfOrganizationUserHttpResponse>(`/api/users/paged?${toSearch({ ...query, sort: "displayName", state: "Active" })}`, { signal });
      return { ...page, items: page.items.map((user) => ({ id: user.memberId, name: user.displayName })) };
    },
  } : {
    queryKeyRoot: ["whatsapp", scope, "team-members"], id: (member) => member.id,
    queryFn: async (query = optionPage, signal) => {
      const page = await api.get<PagedResultOfPlatformAccountResponse>(`/api/platform/accounts/paged?${toSearch({ ...query, kind: "Operator", state: "Active" })}`, { signal });
      return { ...page, items: page.items.map((account) => ({ id: account.id, name: account.displayName ?? account.primaryEmail ?? account.id })) };
    },
  };
}
