import type { components, paths } from "./generated/schema";

export type ApiPaths = paths;
export type ApiSchemas = components["schemas"];
export type ReferenceDataResponse = ApiSchemas["ReferenceDataHttpResponse"];
export type ApiProblemDetails = ApiSchemas["ProblemDetails"];
export type OrganizationSummary = ApiSchemas["OrganizationSummary"];
export type MeResponse = ApiSchemas["MeResponse"];
export type UpdateMeRequest = ApiSchemas["UpdateMeHttpRequest"];
export type LoginMethodsResponse = ApiSchemas["LoginMethodsResponse"];
export type GoogleSignupAntiforgeryResponse = ApiSchemas["GoogleSignupAntiforgeryResponse"];
export type RequestLoginCodeResponse = ApiSchemas["RequestLoginCodeResponse"];
export type VerifyLoginCodeRequest = ApiSchemas["VerifyLoginCodeHttpRequest"];
export type VerifyLoginCodeResponse = ApiSchemas["VerifyLoginCodeResponse"];
export type SignupRequest = ApiSchemas["SignupHttpRequest"];
export type SignupResponse = ApiSchemas["RequestLoginCodeResponse"];
export type VerifySignupRequest = ApiSchemas["VerifySignupHttpRequest"];
export type LegalDocumentResponse = ApiSchemas["LegalDocumentRow"];
