import type { components, paths } from "./generated/schema";

export type ApiPaths = paths;
export type ApiSchemas = components["schemas"];
export type ReferenceDataResponse = ApiSchemas["ReferenceDataHttpResponse"];
export type ApiProblemDetails = ApiSchemas["ProblemDetails"];
