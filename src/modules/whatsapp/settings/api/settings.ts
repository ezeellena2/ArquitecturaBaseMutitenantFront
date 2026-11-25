import { api } from "@/shared/api/httpClient";
import type { VersionResponse } from "@/shared/api/types";
import { whatsappQueryRoot } from "../../api/untaken";
import type {
  PlatformWhatsAppSettingsResponse, UpdatePlatformWhatsAppSettingsRequest, UpdateWhatsAppOrganizationSettingsRequest, WhatsAppOrganizationSettingsResponse,
} from "../../api/types";

/** La configuración de WhatsApp (272 y 270): la de la organización y la de Plataforma, cada una con su versión. */
export const whatsappSettingsQueryRoot = [...whatsappQueryRoot, "settings"] as const;

export const organizationWhatsAppSettingsKey = [...whatsappSettingsQueryRoot, "organization"] as const;
export const fetchOrganizationWhatsAppSettings = (signal?: AbortSignal) =>
  api.get<WhatsAppOrganizationSettingsResponse>("/api/organization/whatsapp/settings", { signal });
export const updateOrganizationWhatsAppSettings = (request: UpdateWhatsAppOrganizationSettingsRequest) =>
  api.put<VersionResponse>("/api/organization/whatsapp/settings", request);

export const platformWhatsAppSettingsKey = [...whatsappSettingsQueryRoot, "platform"] as const;
export const fetchPlatformWhatsAppSettings = (signal?: AbortSignal) =>
  api.get<PlatformWhatsAppSettingsResponse>("/api/platform/whatsapp/settings", { signal });
export const updatePlatformWhatsAppSettings = (request: UpdatePlatformWhatsAppSettingsRequest) =>
  api.put<VersionResponse>("/api/platform/whatsapp/settings", request);
