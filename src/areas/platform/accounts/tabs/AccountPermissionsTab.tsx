import { useTranslation } from "react-i18next";
import { platformPermissions } from "@/auth/usePermissions";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { CheckIcon } from "@/shared/ui/icons";
import { List, ListItem } from "@/shared/ui/List";
import { Surface } from "@/shared/ui/Surface";

export function AccountPermissionsTab({ permissions }: { permissions: readonly string[] }) {
  const { t } = useTranslation("platformAccounts");
  return <Surface phoneFlush><List label={t("detail.permissions")}>
    {platformPermissions.map((permission) => <ListItem key={permission} title={t(`permissions.${permission}.name`)} detail={t(`permissions.${permission}.description`)}>
      {permissions.includes(permission) ? <span className="text-[var(--ok)]"><CheckIcon aria-hidden="true" className="size-4" /><span className="sr-only">{t("detail.permissionGranted")}</span></span> : <EmptyValue />}
    </ListItem>)}
  </List></Surface>;
}
