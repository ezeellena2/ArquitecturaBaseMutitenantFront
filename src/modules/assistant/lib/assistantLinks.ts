import { toSearch } from "@/shared/api/toSearch";
import type { AssistantLinkResponse, AssistantRouteKey } from "@/modules/assistant/api/types";
import { homeOf } from "@/tenancy/access";
import type { AssistantScope } from "../api/assistant";

/** T11 entrega permisos del acceso actual; ninguna URL del proveedor se acepta. */
export interface AssistantLinkContext {
  scope: AssistantScope;
  hasPermission: (permission: string) => boolean;
  organizationIds?: readonly string[];
  /** Nombres de /api/me, nunca etiquetas suministradas por el modelo. */
  organizationNames?: Readonly<Record<string, string>>;
  onOpenOrganization?: (id: string) => void;
}

const routes: Record<AssistantRouteKey, { access: AssistantScope["access"]; path: string; permission?: string; id?: keyof AssistantLinkResponse["parameters"] }> = {
  "business.users": { access: "business", path: "/org/usuarios", permission: "users.read", id: "userId" },
  "business.roles": { access: "business", path: "/org/roles", permission: "roles.read", id: "roleId" },
  "business.companies": { access: "business", path: "/org/empresas", permission: "companies.read", id: "companyId" },
  "business.audit": { access: "business", path: "/org/auditoria", permission: "audit.read" },
  "business.home": { access: "business", path: homeOf("business") },
  "platform.organizations": { access: "platform", path: "/plataforma/organizaciones", permission: "platform.tenants.read", id: "tenantId" },
  "platform.accounts": { access: "platform", path: "/plataforma/cuentas", permission: "platform.accounts.read", id: "userId" },
  "platform.recoveries": { access: "platform", path: "/plataforma/recuperaciones", permission: "platform.recoveries.manage" },
  "platform.audit": { access: "platform", path: "/plataforma/auditoria", permission: "platform.audit.read" },
  "platform.assistant.usage": { access: "platform", path: "/plataforma/asistente/uso", permission: "platform.assistant.read" },
  "personal.account": { access: "consumer", path: "/cuenta" },
  "personal.organizations": { access: "consumer", path: "/" },
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveAssistantLink(link: AssistantLinkResponse, context: AssistantLinkContext): { to?: string; organizationId?: string; organizationName?: string; labelKey: string } | null {
  if (!Object.hasOwn(routes, link.routeKey)) return null;
  const route = routes[link.routeKey];
  if (route.access !== context.scope.access || route.permission && !context.hasPermission(route.permission)) return null;
  if (link.routeKey === "personal.organizations") {
    const tenantId = link.parameters.tenantId;
    const name = tenantId ? context.organizationNames?.[tenantId] : undefined;
    return tenantId && uuid.test(tenantId) && context.organizationIds?.includes(tenantId) && context.onOpenOrganization
      ? { organizationId: tenantId, ...(name ? { organizationName: name } : {}), labelKey: name ? "links.personal.organization" : "links.personal.organizations" } : null;
  }
  const id = route.id ? link.parameters[route.id] : null;
  if (id && !uuid.test(id)) return null;
  const query: Record<string, string | number> = {};
  if (!id) {
    const status = link.query.status;
    if (link.routeKey === "business.users" && status) query.state = status === "Pending" ? "Invited" : status;
    if (link.routeKey === "platform.organizations" && status) query.status = status === "Pending" ? "PendingApproval" : status;
    if (link.routeKey === "platform.recoveries" && status) query.status = status;
    if (link.query.search) query.search = link.query.search;
    for (const key of ["page", "pageSize"] as const) {
      const value = link.query[key];
      if (value != null && Number.isSafeInteger(value) && value > 0) query[key] = value;
    }
  }
  return { to: `${route.path}${id ? `/${encodeURIComponent(id)}` : ""}${toSearch(query, true)}`, labelKey: `links.${link.routeKey}` };
}
