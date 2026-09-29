import type { components, paths } from "./generated/schema";

export type ApiPaths = paths;
export type ApiSchemas = components["schemas"];
export type ReferenceDataResponse = ApiSchemas["ReferenceDataHttpResponse"];
export type ApiProblemDetails = ApiSchemas["ProblemDetails"];

// Contrato E3a hasta que la Api exporte OpenAPI y `contracts` genere estos alias en la tarea 61b.
export interface OrganizationSummary {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

export interface MeResponse {
  readonly id: string;
  readonly displayName: string | null;
  readonly email: string | null;
  readonly access: "consumer" | "business" | "platform";
  readonly activeTenantId: string | null;
  readonly hasPersonalSpace: boolean;
  readonly organizations: readonly OrganizationSummary[];
  readonly permissions: readonly string[];
  readonly culture: string;
  readonly timeZoneId: string;
  readonly currencyCode: string;
}

export interface UpdateMeRequest {
  readonly displayName: string | null;
  readonly culture: string;
  readonly timeZoneId: string;
}
