import { api } from "@/shared/api/httpClient";
import type { PagedResult } from "@/shared/api/pagedResult";
import type { DirectoryEntryRow, PagedRequest } from "@/shared/api/types";

export type DirectoryQuery = PagedRequest;

export const directoryQueryKeyRoot = ["directory"] as const;
export const directoryQueryKey = (query: DirectoryQuery) => [...directoryQueryKeyRoot, query] as const;

export function fetchDirectory(query: DirectoryQuery): Promise<PagedResult<DirectoryEntryRow>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return api.get<PagedResult<DirectoryEntryRow>>(`/api/directory${search ? `?${search}` : ""}`);
}
