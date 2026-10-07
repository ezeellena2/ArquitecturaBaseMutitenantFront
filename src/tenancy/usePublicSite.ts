import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/httpClient";
import { ApiError } from "@/shared/api/ApiError";
import type { PublicSiteResponse } from "@/shared/api/types";
import { siteOfHost } from "./publicSite";

/** El arnés de rutas puede indicar el host sin cambiar location ni el acceso de la sesión. */
export const PublicSiteHostContext = createContext<string | undefined>(undefined);
export const publicSiteQueryKey = (host: string) => ["public-site", host.toLowerCase()] as const;

/** Una única fuente de HTTP y keys, compartida por el hook y la feature storefront/site. */
export async function fetchPublicSite(signal?: AbortSignal): Promise<PublicSiteResponse | null> {
  try {
    return await api.get<PublicSiteResponse>("/api/public-site", { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === "PublicSite.PublicPage.NotFound") return null;
    throw error;
  }
}

export function usePublicSite(host?: string) {
  const contextHost = useContext(PublicSiteHostContext);
  const currentHost = host ?? contextHost ?? globalThis.location.host;
  const site = siteOfHost(currentHost);
  const query = useQuery({
    queryKey: publicSiteQueryKey(currentHost),
    queryFn: ({ signal }) => fetchPublicSite(signal),
    enabled: site.kind === "storefront",
    meta: { silent: true },
  });
  return {
    ...query,
    slug: site.kind === "storefront" ? site.slug : null,
    isUnavailable: site.kind !== "storefront" || (query.isSuccess && query.data === null),
  };
}
