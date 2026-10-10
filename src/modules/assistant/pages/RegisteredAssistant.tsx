import { useNavigate } from "react-router";
import { useProfiles } from "@/tenancy/useProfiles";
import { activeOrganization } from "@/tenancy/access";
import type { ModuleContentProps } from "@/shared/modules/types";
import { useModuleRegistry } from "@/shared/modules/useModules";
import { AssistantHome } from "./AssistantHome";
import { AssistantPhonePage } from "./AssistantPhonePage";

/** Adaptador del registro: el cambio de perfil conserva el recorrido OIDC del núcleo. */
function RegisteredAssistant({ me, phone, ...content }: ModuleContentProps & { phone: boolean }) {
  const navigate = useNavigate();
  const { profiles, status } = useProfiles();
  const registry = useModuleRegistry();
  const usageAvailable = registry.some((module) => module.routes.some((route) => route.path === "/plataforma/asistente/uso" && route.access === me.access && route.guard(me) === "allowed"));
  const permissions = me.access === "platform" ? me.effectivePermissions.platform : me.effectivePermissions.organization;
  const Page = phone ? AssistantPhonePage : AssistantHome;
  if (status) return <div className="fixed inset-0 z-[100]">{status}</div>;
  return <Page {...content} enabled scope={{ access: me.access, userId: me.id, tenantId: me.activeTenantId ?? null }}
    organizationName={activeOrganization(me)?.name} hasPermission={(permission) => permissions.includes(permission)}
    canOpenLink={(routeKey) => routeKey !== "platform.assistant.usage" || usageAvailable}
    organizationIds={me.access === "consumer" ? me.organizations.map((organization) => organization.id) : undefined}
    organizationNames={me.access === "consumer" ? Object.fromEntries(me.organizations.map((organization) => [organization.id, organization.name])) : undefined}
    onOpenOrganization={me.access === "consumer" ? (id) => profiles.find((profile) => profile.key === id)?.select() : undefined}
    onPrivacy={() => navigate("/privacidad")} />;
}

export function RegisteredAssistantHome(props: ModuleContentProps) {
  return <div className="flex h-full min-h-0 flex-col"><RegisteredAssistant {...props} phone={false} /></div>;
}

export function RegisteredAssistantPhone(props: ModuleContentProps) {
  return <RegisteredAssistant {...props} phone />;
}
