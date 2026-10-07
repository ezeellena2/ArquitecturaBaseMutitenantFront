import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { useIsSigningOut } from "@/auth/signOutStatus";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { AppChromeProvider, type AppChrome } from "@/shared/ui/app/AppChrome";
import { BottomNav } from "@/shared/ui/app/BottomNav";
import { AppHomeIcon } from "@/shared/ui/icons";
import { AdminPanel } from "./components/AdminPanel";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { findNavigationPanelEntry, type NavigationPanelKey } from "./navigation/administration";
import type { NavigationConfig } from "./navigation/types";
import { visibleNavigation } from "./navigation/visible";
import { activeOrganization } from "@/tenancy/access";

interface PrivateLayoutFrameProps {
  navigation: NavigationConfig;
  scope?: "personal" | "business" | "platform";
  children?: ReactNode;
}

export function PrivateLayoutFrame({ navigation, scope, children }: PrivateLayoutFrameProps) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isSigningOut = useIsSigningOut();
  const { data: user } = useCurrentUser();
  const permissions = usePermissions();
  const shownNavigation = useMemo(() => visibleNavigation(navigation, permissions), [navigation, permissions]);
  const [collapsed, setCollapsed] = useLocalStorage("sidebarCollapsed", false);
  // En una pantalla de un panel este arranca abierto, también al recargar; en las demás, cerrado. Lo que
  // la persona abre o cierra vale hasta que cambia de pantalla. Se mira la navegación completa y no la visible,
  // que espera a los permisos: si no, al recargar el panel quedaría cerrado.
  const { pathname } = useLocation();
  const panelEntry = findNavigationPanelEntry(navigation, pathname);
  const [toggledPanel, setToggledPanel] = useState<{ pathname: string; panel: NavigationPanelKey | null } | null>(null);
  const selectedPanel = toggledPanel?.pathname === pathname ? toggledPanel.panel : panelEntry?.panel ?? null;
  const openPanel = selectedPanel && shownNavigation[selectedPanel] ? selectedPanel : null;
  const togglePanel = (panel: NavigationPanelKey) => setToggledPanel({ pathname, panel: openPanel === panel ? null : panel });
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const hideBottomNav = useCallback((hidden: boolean) => setBottomNavHidden(hidden), []);
  const [activeSectionHidden, setActiveSectionHidden] = useState(false);
  const hideActiveSection = useCallback((hidden: boolean) => setActiveSectionHidden(hidden), []);
  const [homeMarked, setHomeMarked] = useState(false);
  const markHome = useCallback((marked: boolean) => setHomeMarked(marked), []);
  const name = user?.displayName || user?.email || "";
  const account = user ? { name, email: user.email ?? null } : null;
  const organization = activeOrganization(user);
  const context = scope === "personal" ? { title: t("accessMenu.personal"), detail: t("accessMenu.personalDetail") }
    : scope === "business" && organization ? { title: organization.name, detail: t("layout.sidebar.organization") }
      : scope === "platform" ? { title: t("navigation.platform"), detail: t("layout.sidebar.platformDetail") } : null;

  // Personal suma sus módulos visibles a Inicio; los demás accesos conservan las secciones del manifiesto.
  // Hasta cuatro secciones y Más, donde también se abren los módulos que quedan afuera.
  // Las pantallas de Administración se abren desde Más y vuelven a él con ‹.
  const home = navigation.links.at(0);
  // Una pantalla que vuelve al Inicio con ‹ (la ficha de la empresa de quien la administra sola) también es del Inicio.
  const onHome = home?.path === pathname || homeMarked;
  const onMore = navigation.moreTo === pathname;
  const bottomSections = useMemo(() => shownNavigation.bottomSections?.slice(0, 4) ?? (scope === "personal"
    ? shownNavigation.links.filter((link) => link === home || link.feature).slice(0, 4)
      .map((link) => ({ link, icon: link === home ? AppHomeIcon : link.icon })) : undefined), [shownNavigation, scope, home]);
  const bottomSection = !onMore ? bottomSections?.find((section) => section.link === panelEntry?.link || section.link.path === pathname
    || (scope === "personal" && pathname.startsWith(`${section.link.path}/`))) : undefined;
  const routePanel = panelEntry ? navigation[panelEntry.panel] : null;
  const chrome = useMemo<AppChrome>(() => ({
    phone: isMobile,
    parent: isMobile && navigation.moreTo && !onHome && !onMore && !bottomSection ? { to: navigation.moreTo, label: t("layout.app.backToMore") } : null,
    subtitle: routePanel && !bottomSection && !onMore ? t(routePanel.labelKey) : context?.title ?? null,
    title: panelEntry && !onMore ? t(panelEntry.link.labelKey) : null,
    hideBottomNav,
    hideActiveSection,
    homePath: home?.path ?? navigation.breadcrumbRoot?.path ?? null,
    markHome,
  }), [isMobile, navigation.moreTo, navigation.breadcrumbRoot?.path, routePanel, onHome, onMore, bottomSection, panelEntry, context?.title, hideBottomNav, hideActiveSection, home?.path, markHome, t]);

  if (isSigningOut) return <SessionStatusPage status="closing" />;

  if (isMobile) return <AppChromeProvider value={chrome}>
    <div className="flex h-svh flex-col bg-[var(--lado-activo)]">
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">{children ?? <Outlet />}</main>
      {navigation.moreTo && !bottomNavHidden ? <BottomNav label={t("navigation.sections")} items={[
        ...(bottomSections?.map(({ link, icon: Icon }) => ({
          key: link.path, label: t(link.labelKey), to: link.path, icon: <Icon className="size-6" />, active: (link === bottomSection?.link || (link === home && onHome)) && !activeSectionHidden,
        })) ?? (home ? [{ key: "home", label: t(home.labelKey), to: home.path, icon: <AppHomeIcon className="size-6" />, active: onHome && !activeSectionHidden }] : [])),
        { key: "more", label: t("navigation.more"), to: navigation.moreTo, avatar: name.charAt(0).toUpperCase() || undefined, active: !(bottomSections ? bottomSection || onHome : onHome) && !activeSectionHidden },
      ]} /> : null}
    </div>
  </AppChromeProvider>;

  return <AppChromeProvider value={chrome}>
    <div className="flex h-svh print:h-auto">
      <Sidebar
        navigation={shownNavigation}
        account={account}
        context={context}
        collapsed={collapsed}
        managementOpen={openPanel === "management"}
        onToggleManagement={() => togglePanel("management")}
        administrationOpen={openPanel === "administration"}
        onToggleAdministration={() => togglePanel("administration")}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <AdminPanel panel={openPanel ? shownNavigation[openPanel] ?? null : null} open={openPanel !== null}
        currentLink={panelEntry?.panel === openPanel ? panelEntry.link : null}
        onClose={() => setToggledPanel({ pathname, panel: null })} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar breadcrumbs={<Breadcrumbs navigation={navigation} permissions={permissions} />} />
        <main className="relative min-h-0 flex-1 scroll-pt-14 overflow-y-auto bg-[var(--fondo)] print:overflow-visible">{children ?? <Outlet />}</main>
      </div>
    </div>
  </AppChromeProvider>;
}
