import { api } from "@/shared/api/httpClient";
import type { UpdateMeRequest, VersionResponse } from "@/shared/api/types";
import { accountPaths } from "@/shared/api/accountContract";

export function updateMe(request: UpdateMeRequest): Promise<VersionResponse> {
  return api.put<VersionResponse>(accountPaths.me, request);
}
