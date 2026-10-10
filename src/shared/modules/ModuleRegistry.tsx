import { Suspense, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { currentUserQueryKey, useCurrentUser } from "@/auth/useCurrentUser";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { homeOf, type Access } from "@/tenancy/access";
import type { ModuleContentProps, ModuleOrganizationUiProps, ModuleRegistration } from "./types";
import { ModuleRegistryContext, useModuleHome, useModuleRegistry } from "./useModules";

export const ModuleRegistryProvider = ModuleRegistryContext.Provider;

/** Se monta sólo para una fila real autorizada; el fallback conserva las acciones genéricas. */
export function ModuleOrganizationUi({ moduleId, children, ...props }: Omit<ModuleOrganizationUiProps, "me"> & { moduleId: string }) {
  const registry = useModuleRegistry();
  const { data: me } = useCurrentUser();
  const contribution = registry.find((module) => module.id === moduleId)?.organizationUi;
  const fallback = children({});
  if (!me || !contribution || !props.feature.enabled || props.organization.status === "Closed" || contribution.guard(me) !== "allowed") return fallback;
  const Content = contribution.Content;
  return <Suspense fallback={fallback}><Content key={`${me.access}:${me.activeTenantId}:${me.id}:${props.organization.id}`} me={me} {...props}>{children}</Content></Suspense>;
}


/** El área conserva el inicio anterior y entrega únicamente sus bloques existentes. */
export function ModuleHome({ access, fallback, ...content }: Omit<ModuleContentProps, "me"> & { access: Access; fallback: ReactNode }) {
  const home = useModuleHome(access);
  const { data: me } = useCurrentUser();
  if (!home || !me) return fallback;
  return <AvailableModuleHome key={`${me.access}:${me.activeTenantId}:${me.id}`} home={home} me={me} fallback={fallback} {...content} />;
}

function AvailableModuleHome({ home, fallback, ...content }: ModuleContentProps & { home: NonNullable<ModuleRegistration["home"]>; fallback: ReactNode }) {
  const [unavailable, setUnavailable] = useState(false);
  const client = useQueryClient();
  if (unavailable) return fallback;
  const Content = home.Content;
  return <Suspense fallback={null}><Content {...content} onUnavailable={() => {
    setUnavailable(true);
    void client.invalidateQueries({ queryKey: currentUserQueryKey });
  }} /></Suspense>;
}

export function ModuleRoutePage({ moduleId, path }: { moduleId: string; path: string }) {
  const registry = useModuleRegistry();
  const { data: me } = useCurrentUser();
  if (!me) return null;
  const route = registry.find((module) => module.id === moduleId)?.routes.find((entry) => entry.path === path);
  const status = route ? route.access === me.access ? route.guard(me) : "forbidden" : "unavailable";
  if (!route || status === "unavailable") return <NotFoundPage homePath={homeOf(me.access)} />;
  if (status === "forbidden") return <ForbiddenPage homePath={homeOf(me.access)} />;
  const Page = route.Page;
  return <Suspense fallback={null}><Page key={`${me.access}:${me.activeTenantId}:${me.id}`} me={me} /></Suspense>;
}
