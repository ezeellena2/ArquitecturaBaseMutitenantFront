import { api } from "@/shared/api/httpClient";
import type { PlatformSettingsResponse, UpdatePlatformSettingsRequest, VersionResponse } from "@/shared/api/types";

export const platformSettingsKey = ["platform", "settings"] as const;
export function fetchPlatformSettings() { return api.get<PlatformSettingsResponse>("/api/platform/settings"); }
export function updatePlatformSettings(request: UpdatePlatformSettingsRequest) { return api.put<VersionResponse>("/api/platform/settings", request); }
