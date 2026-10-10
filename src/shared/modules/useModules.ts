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
