import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { useCurrentBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { findAdministrationEntry } from "../navigation/administration";
import type { NavigationConfig } from "../navigation/types";

// Tableros Empresas, Empresa, Auditoría, Usuarios, Usuario y Rol: el camino real hasta la pantalla. Inicio, la
// sección de Administración si la hay, la opción (enlace si estás en una ficha) y el nombre de la ficha.
export function Breadcrumbs({ navigation }: { navigation: NavigationConfig }) {
  const { t } = useTranslation();
  const pathname = useLocation().pathname.replace(/\/+$/, "") || "/";
  const leaf = useCurrentBreadcrumbLeaf();
  const home = navigation.links.at(0);
  if (!home) return null;

  const crumbs: { label: string; to?: string }[] = [];
  const administration = findAdministrationEntry(navigation.administration, pathname);
  if (administration) {
    const { link, section } = administration;
    if (section) crumbs.push({ label: t(section.labelKey) });
    crumbs.push(pathname === link.path ? { label: t(link.labelKey) } : { label: t(link.labelKey), to: link.path });
    if (pathname !== link.path && leaf) crumbs.push({ label: leaf });
  } else {
    const current = navigation.links.find((entry) => entry !== home && entry.path === pathname);
    if (current) crumbs.push({ label: t(current.labelKey) });
  }

  return <nav aria-label={t("layout.breadcrumbs.label")} className="min-w-0 text-[13px] text-[var(--t2)]">
    <ol className="flex min-w-0 items-center gap-1.5 truncate">
      <li className={`truncate ${pathname === home.path ? "font-semibold text-[var(--t1)]" : ""}`} aria-current={pathname === home.path ? "page" : undefined}>
        {pathname === home.path ? t(home.labelKey) : <Link to={home.path} className="hover:underline">{t(home.labelKey)}</Link>}
      </li>
      {crumbs.map((crumb, index) => {
        const current = index === crumbs.length - 1 && !crumb.to;
        return [
          <li key={`${crumb.label}-separador`} aria-hidden="true">{"/"}</li>,
          <li key={crumb.label} className={`truncate ${current ? "font-medium text-[var(--t1)]" : ""}`} aria-current={current ? "page" : undefined}>
            {crumb.to ? <Link to={crumb.to} className="hover:underline">{crumb.label}</Link> : crumb.label}
          </li>,
        ];
      })}
    </ol>
  </nav>;
}
