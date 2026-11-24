import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { platformPermissions } from "@/auth/usePermissions";
import type { ApiSchemas } from "@/shared/api/types";
import type { PermissionAreaGroup } from "@/shared/ui/permissionAreas";
import { fetchPlatformPermissions, platformPermissionsQueryKey } from "../api/operators";
import { useModuleRegistry } from "@/shared/modules/useModules";
import type { ModuleRegistration } from "@/shared/modules/types";

export interface PlatformPermissionEntry {
  code: string;
  nameKey: string;
  descriptionKey: string;
  /** El nombre de su área (260): la del núcleo en `platformAccounts:permissionAreas`, la de un módulo en sus textos. */
  areaKey: string;
}

const settings = "platform.settings.manage";
/// El área de un permiso: su código hasta el último punto (`platform.accounts.read` es de `platform.accounts`), como la
/// arma el back (260).
export const permissionArea = (code: string) => code.slice(0, code.lastIndexOf("."));
const core = (code: string): PlatformPermissionEntry =>
  ({ code, nameKey: `platformAccounts:permissions.${code}.name`, descriptionKey: `platformAccounts:permissions.${code}.description`,
    areaKey: `platformAccounts:permissionAreas.${permissionArea(code)}` });

/// Los permisos individuales de un operador (ADR 0042 y 0048): los del núcleo y los de cada módulo instalado, con los textos
/// del módulo (`<módulo>:platformPermissions.<código>`). Sin el módulo, sus permisos no aparecen. El orden es el del
/// tablero Cuenta-Plat: los del núcleo, los de los módulos y, al final, «Cambiar la configuración».
export function platformPermissionCatalog(modules: readonly ModuleRegistration[]): readonly PlatformPermissionEntry[] {
  const contributed = modules.flatMap((module) => (module.permissions?.platform ?? []).map((code) =>
    ({ code, nameKey: `${module.id}:platformPermissions.${code}.name`, descriptionKey: `${module.id}:platformPermissions.${code}.description`,
      areaKey: `${module.id}:platformPermissionArea` })));
  return [...platformPermissions.filter((code) => code !== settings).map(core), ...contributed, core(settings)];
}

export function usePlatformPermissionCatalog(): readonly PlatformPermissionEntry[] {
  const modules = useModuleRegistry();
  return useMemo(() => platformPermissionCatalog(modules), [modules]);
}

/// Las áreas de los permisos de un operador (260, tableros Cuentas-Base2 y Cuenta-Plat-Base2), en el orden del catálogo:
/// nombres y descripciones del front, y de `GET /api/platform/permissions` solo lo que incluye cada uno y si quien pide lo
/// puede dar. Un permiso que el back no nombra no incluye nada y lo decide el back al guardar.
export function platformPermissionGroups(catalog: readonly PlatformPermissionEntry[], server: readonly ApiSchemas["PlatformPermissionItem"][] | undefined,
  t: TFunction): PermissionAreaGroup[] {
  const fromServer = new Map((server ?? []).map((item) => [item.code, item]));
  const groups = new Map<string, { area: string; name: string; permissions: PermissionAreaGroup["permissions"][number][] }>();
  for (const entry of catalog) {
    const area = permissionArea(entry.code);
    const group = groups.get(area) ?? { area, name: t(entry.areaKey), permissions: [] };
    const item = fromServer.get(entry.code);
    group.permissions.push({ code: entry.code, name: t(entry.nameKey), description: t(entry.descriptionKey), includes: item?.includes ?? [], grantable: item?.grantable ?? true });
    groups.set(area, group);
  }
  return [...groups.values()];
}

/// Las áreas con lo que incluye cada permiso y lo que quien pide puede dar; `isPending` mientras llegan del back.
export function usePlatformPermissionGroups(): { groups: PermissionAreaGroup[]; isPending: boolean } {
  const { t } = useTranslation();
  const catalog = usePlatformPermissionCatalog();
  const server = useQuery({ queryKey: platformPermissionsQueryKey, queryFn: fetchPlatformPermissions, meta: { silent: true } });
  const groups = useMemo(() => platformPermissionGroups(catalog, server.data, t), [catalog, server.data, t]);
  return { groups, isPending: server.isPending };
}
