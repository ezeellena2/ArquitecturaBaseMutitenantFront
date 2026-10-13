import es from "./locales/es/assistant.json";
import en from "./locales/en/assistant.json";
import esEnums from "./locales/es/enums.json";
import enEnums from "./locales/en/enums.json";
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
const usage = (me: MeResponse) => assistantAccess(me, "usage");
const OrganizationUsage = lazy(() => import("./usage/OrganizationAssistantUsagePage").then((module) => ({ default: module.OrganizationAssistantUsagePage })));
const PlatformUsage = lazy(() => import("./usage/PlatformAssistantUsagePage").then((module) => ({ default: module.PlatformAssistantUsagePage })));
const settingsNavigation = { labelKey: "assistant:settings.title", icon: Sparkles, placement: "administration" as const, section: { labelKey: "assistant:title", icon: Sparkles } };

export const assistantRegistration: ModuleRegistration = {
  id: "assistant",
  resources: { es: { assistant: es, enums: esEnums }, en: { assistant: en, enums: enEnums } },
  fixtures: import.meta.env.DEV ? () => import("./test/etapa8bVisualFixtures").then((fixtures) => ({
    scenario: (board, state) => fixtures.chatScenario(board, state) ?? fixtures.configurationScenario(board, state) ?? fixtures.usageScenario(board, state),
  })) : undefined,
  permissions: {
    organization: ["assistant.use", "assistant.configure"],
    platform: ["platform.assistant.use", "platform.assistant.configure", "platform.assistant.read"],
  },
  organizationUi: { nameKey: "assistant:title", guard: assistantPolicyAccess, Content: OrganizationPolicy },
  home: { guard: chat, Content: Home },
  routes: [
    { access: "business", path: "/org/asistente/configuracion", guard: configure, Page: OrganizationSettings, navigation: settingsNavigation },
    { access: "platform", path: "/plataforma/asistente/configuracion", guard: configure, Page: PlatformSettings, navigation: settingsNavigation },
    { access: "business", path: "/org/asistente/uso", guard: usage, Page: OrganizationUsage, navigation: { ...settingsNavigation, labelKey: "assistant:usage.title" } },
    { access: "platform", path: "/plataforma/asistente/uso", guard: usage, Page: PlatformUsage, navigation: { ...settingsNavigation, labelKey: "assistant:usage.title" } },
    { access: "consumer", path: "/asistente", guard: chat, Page: Phone, navigation: { labelKey: "assistant:title", icon: Sparkles, placement: "phone" } },
    { access: "business", path: "/org/asistente", guard: chat, Page: Phone, navigation: { labelKey: "assistant:title", icon: Sparkles, placement: "phone" } },
    { access: "platform", path: "/plataforma/asistente", guard: chat, Page: Phone, navigation: { labelKey: "assistant:title", icon: Sparkles, placement: "phone" } },
  ],
};
