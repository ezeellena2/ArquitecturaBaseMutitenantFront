import { lazy } from "react";
import { Sparkles } from "lucide-react";
import type { MeResponse } from "@/shared/api/types";
import type { ModuleAccess, ModuleRegistration } from "@/shared/modules/types";

/** Política del módulo: no consulta State y no amplía el catálogo del núcleo. */
export function assistantAccess(me: MeResponse, action: "chat" | "configure" | "usage"): ModuleAccess {
  if (me.access === "platform") {
    const capability = me.moduleCapabilities?.find((item) => item.key === "assistant");
    if (!capability) return "unavailable";
    if (action === "configure") return capability.canConfigure ? "allowed" : "forbidden";
    if (action === "usage") return capability.canReadUsage ? "allowed" : "forbidden";
    if (!me.effectivePermissions.platform.includes("platform.assistant.use")) return "forbidden";
    return capability.available ? "allowed" : "unavailable";
  }
  if (!me.features.includes("assistant")) return "unavailable";
  if (me.access === "consumer") return action === "chat" ? "allowed" : "unavailable";
  return me.effectivePermissions.organization.includes(action === "chat" ? "assistant.use" : "assistant.configure") ? "allowed" : "forbidden";
}

const Home = lazy(() => import("./pages/RegisteredAssistant").then((module) => ({ default: module.RegisteredAssistantHome })));
const Phone = lazy(() => import("./pages/RegisteredAssistant").then((module) => ({ default: module.RegisteredAssistantPhone })));
const chat = (me: MeResponse) => assistantAccess(me, "chat");
export const assistantPolicyAccess = (me: MeResponse): ModuleAccess => me.access !== "platform" ? "forbidden"
  : !me.moduleCapabilities?.some((item) => item.key === "assistant") ? "unavailable"
  : me.effectivePermissions.platform.includes("platform.tenants.read") ? "allowed" : "forbidden";
const OrganizationPolicy = lazy(() => import("./policy/OrganizationAssistantPolicy").then((module) => ({ default: module.OrganizationAssistantPolicy })));
const configure = (me: MeResponse) => assistantAccess(me, "configure");
const OrganizationSettings = lazy(() => import("./settings/OrganizationAssistantSettingsPage").then((module) => ({ default: module.OrganizationAssistantSettingsPage })));
const PlatformSettings = lazy(() => import("./settings/PlatformAssistantSettingsPage").then((module) => ({ default: module.PlatformAssistantSettingsPage })));
const settingsNavigation = { labelKey: "assistant:settings.title", icon: Sparkles, placement: "administration" as const, section: { labelKey: "assistant:title", icon: Sparkles } };

export const assistantRegistration: ModuleRegistration = {
  id: "assistant",
  organizationUi: { nameKey: "assistant:title", guard: assistantPolicyAccess, Content: OrganizationPolicy },
  home: { guard: chat, Content: Home },
  routes: [
    { access: "business", path: "/org/asistente/configuracion", guard: configure, Page: OrganizationSettings, navigation: settingsNavigation },
    { access: "platform", path: "/plataforma/asistente/configuracion", guard: configure, Page: PlatformSettings, navigation: settingsNavigation },
    { access: "consumer", path: "/asistente", guard: chat, Page: Phone, navigation: { labelKey: "assistant:title", icon: Sparkles, placement: "phone" } },
    { access: "business", path: "/org/asistente", guard: chat, Page: Phone, navigation: { labelKey: "assistant:title", icon: Sparkles, placement: "phone" } },
    { access: "platform", path: "/plataforma/asistente", guard: chat, Page: Phone, navigation: { labelKey: "assistant:title", icon: Sparkles, placement: "phone" } },
  ],
};
