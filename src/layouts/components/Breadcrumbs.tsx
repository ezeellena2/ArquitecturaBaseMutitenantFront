import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { useCurrentBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import type { NavigationConfig } from "../navigation/types";

export function Breadcrumbs({ navigation }: { navigation: NavigationConfig }) {
  const { t } = useTranslation();
  const pathname = useLocation().pathname.replace(/\/+$/, "") || "/";
  const leaf = useCurrentBreadcrumbLeaf();
  const home = navigation.links.find((entry) => entry.to !== null);
  const current = navigation.links.find((entry) => entry.to === pathname);
  const sectionEntry = navigation.administration?.sections?.flatMap((section) => section.links)
    .find((entry) => entry.to !== null && (entry.to === pathname || pathname.startsWith(`${entry.to}/`)));
  const section = sectionEntry && navigation.administration?.sections?.find((item) => item.links.includes(sectionEntry));
  if (!home) return null;

  return <nav aria-label={t("layout.breadcrumbs.label")} className="min-w-0 text-[13px] text-[var(--t2)]">
    <ol className="flex min-w-0 items-center gap-1.5 truncate">
      <li className={`truncate ${pathname === home.to ? "font-semibold text-[var(--t1)]" : ""}`} aria-current={pathname === home.to ? "page" : undefined}>
        {pathname === home.to ? t(home.labelKey) : <Link to={home.to!} className="hover:underline">{t(home.labelKey)}</Link>}
      </li>
      {sectionEntry && section ? <>
        <li aria-hidden="true">{"/"}</li>
        <li className={`truncate ${pathname === sectionEntry.to && !leaf ? "font-medium text-[var(--t1)]" : ""}`}>
          {pathname === sectionEntry.to && !leaf ? t(section.labelKey) : <span>{t(section.labelKey)}</span>}
        </li>
        <li aria-hidden="true">{"/"}</li>
        <li className="truncate font-medium text-[var(--t1)]" aria-current="page">{leaf ?? t(sectionEntry.labelKey)}</li>
      </> : null}
      {current && current.to !== home.to ? <><li aria-hidden="true">{"/"}</li><li className="truncate font-medium text-[var(--t1)]" aria-current="page">{t(current.labelKey)}</li></> : null}
    </ol>
  </nav>;
}
