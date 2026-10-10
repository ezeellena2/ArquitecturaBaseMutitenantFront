import { Suspense, type ReactNode } from "react";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { homeOf, type Access } from "@/tenancy/access";
import type { ModuleContentProps } from "./types";
import { ModuleRegistryContext, useModuleHome, useModuleRegistry } from "./useModules";

export const ModuleRegistryProvider = ModuleRegistryContext.Provider;

/** El área conserva el inicio anterior y entrega únicamente sus bloques existentes. */
export function ModuleHome({ access, fallback, ...content }: Omit<ModuleContentProps, "me"> & { access: Access; fallback: ReactNode }) {
  const home = useModuleHome(access);
  const { data: me } = useCurrentUser();
  if (!home || !me) return fallback;
  const Content = home.Content;
  return <Suspense fallback={null}><Content key={`${me.access}:${me.activeTenantId}:${me.id}`} me={me} {...content} /></Suspense>;
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
