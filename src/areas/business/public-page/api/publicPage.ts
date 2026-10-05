import { api } from "@/shared/api/httpClient";
import type { PublicPageResponse, SetPublicPagePublicationRequest, TenantSlugAvailabilityResponse, UpdatePublicPageRequest, VersionResponse } from "@/shared/api/types";

export const publicPageQueryKey = ["organization-public-page"] as const;
export const slugAvailabilityQueryKey = (slug: string) => ["organization-public-page", "slug", slug] as const;

export function fetchPublicPage(): Promise<PublicPageResponse> {
  return api.get<PublicPageResponse>("/api/organization/public-page");
}

export function updatePublicPage(request: UpdatePublicPageRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>("/api/organization/public-page", request);
}

export function setPublicPagePublished(published: boolean, request: SetPublicPagePublicationRequest): Promise<VersionResponse> {
  return api.post<VersionResponse>(`/api/organization/public-page/${published ? "publish" : "unpublish"}`, request);
}

export function checkOrganizationSlug(slug: string): Promise<TenantSlugAvailabilityResponse> {
  return api.get<TenantSlugAvailabilityResponse>(`/api/public-site/slug-availability?slug=${encodeURIComponent(slug)}`);
}
