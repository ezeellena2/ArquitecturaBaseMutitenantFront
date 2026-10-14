import { createContext, useContext } from "react";
import { useCurrentUser } from "@/auth/useCurrentUser";
import type { Access } from "@/tenancy/access";
import type { ModuleRegistration } from "./types";

export const ModuleRegistryContext = createContext<readonly ModuleRegistration[]>([]);
export const useModuleRegistry = () => useContext(ModuleRegistryContext);

export function useModuleHome(access: Access) {
  const registry = useModuleRegistry();
  const { data: me } = useCurrentUser();
  return me?.access === access ? registry.find((module) => module.home?.guard(me) === "allowed")?.home : undefined;
}

/** Las acciones que los módulos suman a la banda de una pantalla del núcleo, ya filtradas por su guarda. */
export function useModulePageActions(page: "users") {
  const registry = useModuleRegistry();
  const { data: me } = useCurrentUser();
  return me ? registry.flatMap((module) => module.pageActions?.[page] ?? []).filter((action) => action.guard(me) === "allowed") : [];
}

/** Lo que los módulos suman al Inicio de la organización: sus tarjetas y sus tipos de «Para resolver». */
export function useModuleBusinessHome() {
  const registry = useModuleRegistry();
  return {
    cards: registry.flatMap((module) => module.businessHome?.cards ?? []),
    pending: registry.flatMap((module) => module.businessHome?.pending ?? []),
  };
}
