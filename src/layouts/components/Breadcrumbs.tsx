import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import type { Permissions } from "@/auth/usePermissions";
import { useCurrentBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { findNavigationPanelEntry } from "../navigation/administration";
import type { NavigationConfig } from "../navigation/types";
import { canOpen } from "../navigation/visible";

// Tableros Empresas, Empresa, Auditoría, Usuarios, Usuario y Rol: el camino real hasta la pantalla. Inicio, la
// sección de Administración si la hay, la opción (enlace si estás en una ficha y la podés abrir) y el nombre de la
// ficha. Todo en el mismo gris, también la pantalla en la que estás («Criterio · Marco», tableros Inicio-Personal y
// Configuración). Se arma con la navegación completa, que no espera a los permisos; los permisos deciden solo el enlace.
export function Breadcrumbs({ navigation, permissions }: { navigation: NavigationConfig; permissions: Permissions }) {
  const { t } = useTranslation();
  const pathname = useLocation().pathname.replace(/\/+$/, "") || "/";
  const leaf = useCurrentBreadcrumbLeaf();
  const home = navigation.breadcrumbRoot ?? navigation.links.at(0);
  if (!home) return null;

  const crumbs: { label: string; to?: string; current?: boolean }[] = [];
  const administration = findNavigationPanelEntry(navigation, pathname);
  if (administration) {
    const { link, section } = administration;
    const onLink = pathname === link.path;
    if (section) crumbs.push({ label: t(section.labelKey) });
    // B4: en la ficha de su empresa, quien no abre Empresas (`companies.read`) ve la opción sin enlace, como «‹».
    crumbs.push(onLink ? { label: t(link.labelKey), current: true }
      : canOpen(link, permissions) ? { label: t(link.labelKey), to: link.path } : { label: t(link.labelKey) });
    if (!onLink && leaf) crumbs.push({ label: leaf, current: true });
  } else {
    const current = navigation.links.find((entry) => entry !== home && entry.path === pathname);
    if (current) crumbs.push({ label: t(current.labelKey), current: true });
  }

  return <nav aria-label={t("layout.breadcrumbs.label")} className="min-w-0 text-[13px] text-[var(--t2)]">
    {/* «Criterio · Marco» (.tb): «Inicio / Gestión de usuarios / Usuarios», con un espacio a cada lado de la barra. */}
    <ol className="flex min-w-0 items-center gap-[0.28em] truncate">
      <li className="truncate" aria-current={pathname === home.path && crumbs.length === 0 ? "page" : undefined}>
        {pathname === home.path ? t(home.labelKey) : <Link to={home.path} className="hover:underline">{t(home.labelKey)}</Link>}
      </li>
      {crumbs.map((crumb) => [
        <li key={`${crumb.label}-separador`} aria-hidden="true">{"/"}</li>,
        <li key={crumb.label} className="truncate" aria-current={crumb.current ? "page" : undefined}>
          {crumb.to ? <Link to={crumb.to} className="hover:underline">{crumb.label}</Link> : crumb.label}
        </li>,
      ])}
    </ol>
  </nav>;
}
