import { api } from "@/shared/api/httpClient";
import type {
  BusinessSignupRequest,
  BusinessSignupResponse,
  RequestLoginCodeResponse,
  SignupRequest,
  TenantSlugAvailabilityResponse,
  VerifySignupRequest,
} from "@/shared/api/types";

export function requestBusinessSignupCode(input: SignupRequest, key: string): Promise<RequestLoginCodeResponse> {
  return api.post<RequestLoginCodeResponse>("/api/auth/business-signup/code", input, {
    headers: { "Idempotency-Key": key },
  });
}

export function verifyBusinessSignupCode(input: VerifySignupRequest, key: string): Promise<void> {
  return api.post<void>("/api/auth/business-signup/verify", input, {
    headers: { "Idempotency-Key": key },
  });
}

export function checkBusinessSlug(slug: string): Promise<TenantSlugAvailabilityResponse> {
  return api.get<TenantSlugAvailabilityResponse>(
    `/api/public-site/slug-availability?${new URLSearchParams({ slug })}`,
  );
}

export function createBusinessOrganization(input: BusinessSignupRequest, key: string,
  requestVerificationToken: string): Promise<BusinessSignupResponse> {
  return api.postCookie<BusinessSignupResponse>("/api/auth/business-signup", input, {
    headers: {
      "Idempotency-Key": key,
      "RequestVerificationToken": requestVerificationToken,
    },
  });
}
