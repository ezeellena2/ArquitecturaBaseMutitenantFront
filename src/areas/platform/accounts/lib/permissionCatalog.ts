import { useMemo } from "react";
import { platformPermissions } from "@/auth/usePermissions";
import { useModuleRegistry } from "@/shared/modules/useModules";
import type { ModuleRegistration } from "@/shared/modules/types";

export interface PlatformPermissionEntry {
  code: string;
  nameKey: string;
  descriptionKey: string;
}

const settings = "platform.settings.manage";
const core = (code: string): PlatformPermissionEntry =>
  ({ code, nameKey: `platformAccounts:permissions.${code}.name`, descriptionKey: `platformAccounts:permissions.${code}.description` });

/// Los permisos individuales de un operador (ADR 0042 y 0048): los del núcleo y los de cada módulo instalado, con los textos
/// del módulo (`<módulo>:platformPermissions.<código>`). Sin el módulo, sus permisos no aparecen. El orden es el del
/// tablero Cuenta-Plat: los del núcleo, los de los módulos y, al final, «Cambiar la configuración».
export function platformPermissionCatalog(modules: readonly ModuleRegistration[]): readonly PlatformPermissionEntry[] {
  const contributed = modules.flatMap((module) => (module.permissions?.platform ?? []).map((code) =>
    ({ code, nameKey: `${module.id}:platformPermissions.${code}.name`, descriptionKey: `${module.id}:platformPermissions.${code}.description` })));
  return [...platformPermissions.filter((code) => code !== settings).map(core), ...contributed, core(settings)];
}

export function usePlatformPermissionCatalog(): readonly PlatformPermissionEntry[] {
  const modules = useModuleRegistry();
  return useMemo(() => platformPermissionCatalog(modules), [modules]);
}
