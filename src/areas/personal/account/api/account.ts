import { api } from "@/shared/api/httpClient";
import type { UpdateMeRequest } from "@/shared/api/types";
import { accountPaths } from "@/shared/api/accountContract";

export function updateMe(request: UpdateMeRequest): Promise<void> {
  return api.put<void>(accountPaths.me, request);
}
