import { useTranslation } from "react-i18next";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { CheckIcon } from "@/shared/ui/icons";
import { List, ListItem } from "@/shared/ui/List";
import { Surface } from "@/shared/ui/Surface";
import { usePlatformPermissionCatalog } from "../lib/permissionCatalog";

export function AccountPermissionsTab({ permissions }: { permissions: readonly string[] }) {
  const { t } = useTranslation("platformAccounts");
  const catalog = usePlatformPermissionCatalog();
  return <Surface phoneFlush><List label={t("detail.permissions")}>
    {catalog.map((permission) => <ListItem key={permission.code} title={t(permission.nameKey)} detail={t(permission.descriptionKey)}>
      {permissions.includes(permission.code) ? <span className="text-[var(--ok)]"><CheckIcon aria-hidden="true" className="size-4" /><span className="sr-only">{t("detail.permissionGranted")}</span></span> : <EmptyValue />}
    </ListItem>)}
  </List></Surface>;
}
