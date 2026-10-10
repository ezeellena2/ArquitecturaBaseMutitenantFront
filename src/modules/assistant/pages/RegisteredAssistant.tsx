import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { useProfiles } from "@/tenancy/useProfiles";
import { activeOrganization, homeOf } from "@/tenancy/access";
import type { ModuleContentProps } from "@/shared/modules/types";
import { useModuleRegistry } from "@/shared/modules/useModules";
import { Page } from "@/shared/ui/Page";
import { HomeIcon } from "@/shared/ui/icons";
import { AssistantHome } from "./AssistantHome";
import { AssistantPhonePage } from "./AssistantPhonePage";

/** Adaptador del registro: el cambio de perfil conserva el recorrido OIDC del núcleo. */
function RegisteredAssistant({ me, phone, ...content }: ModuleContentProps & { phone: boolean }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { profiles, status } = useProfiles();
  const registry = useModuleRegistry();
  const configurationPath = me.access === "platform" ? "/plataforma/asistente/configuracion" : "/org/asistente/configuracion";
  const configurationAvailable = registry.some((module) => module.routes.some((route) => route.path === configurationPath && route.access === me.access && route.guard(me) === "allowed"));
  const usageAvailable = registry.some((module) => module.routes.some((route) => route.path === "/plataforma/asistente/uso" && route.access === me.access && route.guard(me) === "allowed"));
  const permissions = me.access === "platform" ? me.effectivePermissions.platform : me.effectivePermissions.organization;
  const Page = phone ? AssistantPhonePage : AssistantHome;
  if (status) return <div className="fixed inset-0 z-[100]">{status}</div>;
  return <Page {...content} enabled scope={{ access: me.access, userId: me.id, tenantId: me.activeTenantId ?? null }}
    onUnavailable={content.onUnavailable ?? (() => { void client.invalidateQueries({ queryKey: currentUserQueryKey }); void navigate(homeOf(me.access), { replace: true }); })}
    organizationName={activeOrganization(me)?.name} hasPermission={(permission) => permissions.includes(permission)}
    canOpenLink={(routeKey) => routeKey !== "platform.assistant.usage" || usageAvailable}
    organizationIds={me.access === "consumer" ? me.organizations.map((organization) => organization.id) : undefined}
    organizationNames={me.access === "consumer" ? Object.fromEntries(me.organizations.map((organization) => [organization.id, organization.name])) : undefined}
    onOpenOrganization={me.access === "consumer" ? (id) => profiles.find((profile) => profile.key === id)?.select() : undefined}
    onConfigure={configurationAvailable ? () => navigate(configurationPath) : undefined}
    onPrivacy={() => navigate("/privacidad")} />;
}

export function RegisteredAssistantHome(props: ModuleContentProps) {
  const { t } = useTranslation();
  const summary = props.me.access === "platform" ? t("navigation.platform") : activeOrganization(props.me)?.name;
  return <div className="flex h-full min-h-0 flex-col"><Page icon={HomeIcon} title={t("home.title")} summary={summary}
    bodyClassName="flex min-h-0 flex-1 flex-col"><RegisteredAssistant {...props} phone={false} /></Page></div>;
}

export function RegisteredAssistantPhone(props: ModuleContentProps) {
  return <RegisteredAssistant {...props} phone />;
}
