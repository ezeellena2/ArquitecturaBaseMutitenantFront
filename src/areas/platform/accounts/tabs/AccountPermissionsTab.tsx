import { useTranslation } from "react-i18next";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { PermissionPicker } from "@/shared/ui/PermissionPicker";
import { allowedPermissions } from "@/shared/ui/permissionAreas";
import { usePlatformPermissionGroups } from "../lib/permissionCatalog";

/// Los permisos de un operador en su ficha (Cuenta-Plat-Base2 y M-Cuenta-Plat-Base2, 260): se leen en áreas, solo las que
/// tienen algo y abiertas, cada permiso que tiene con su tilde, también lo incluido.
export function AccountPermissionsTab({ permissions }: { permissions: readonly string[] }) {
  const { t } = useTranslation("platformAccounts");
  const { phone } = useAppChrome();
  const { groups } = usePlatformPermissionGroups();
  return <div className={phone ? "mx-4" : undefined}>
    <PermissionPicker label={t("detail.permissions")} readOnly openWhenRead groups={groups} picked={allowedPermissions(groups, permissions)} />
  </div>;
}
