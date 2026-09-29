import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import type { NavigationConfig } from "../navigation/types";

export function Breadcrumbs({ navigation }: { navigation: NavigationConfig }) {
  const { t } = useTranslation();
  const pathname = useLocation().pathname.replace(/\/+$/, "") || "/";
  const home = navigation.links.find((entry) => entry.to !== null);
  const current = navigation.links.find((entry) => entry.to === pathname);
  if (!home) return null;

  return <nav aria-label={t("layout.breadcrumbs.label")} className="min-w-0 text-[13px] text-[var(--t2)]">
    <ol className="flex min-w-0 items-center gap-1.5 truncate">
      <li className="truncate" aria-current={pathname === home.to ? "page" : undefined}>
        {pathname === home.to ? t(home.labelKey) : <Link to={home.to!} className="hover:underline">{t(home.labelKey)}</Link>}
      </li>
      {current && current.to !== home.to ? <><li aria-hidden="true">{"/"}</li><li className="truncate font-medium text-[var(--t1)]" aria-current="page">{t(current.labelKey)}</li></> : null}
    </ol>
  </nav>;
}
