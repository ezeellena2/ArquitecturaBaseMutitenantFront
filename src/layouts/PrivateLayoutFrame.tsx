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
import { findAdministrationEntry } from "./navigation/administration";
import type { NavigationConfig } from "./navigation/types";
import { visibleNavigation } from "./navigation/visible";
import { activeOrganization } from "@/tenancy/access";

interface PrivateLayoutFrameProps {
  navigation: NavigationConfig;
  scope?: "personal" | "business";
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
  // En una pantalla de Administración el panel arranca abierto, también al recargar; en las demás, cerrado. Lo que
  // la persona abre o cierra vale hasta que cambia de pantalla. Se mira la navegación completa y no la visible,
  // que espera a los permisos: si no, al recargar el panel quedaría cerrado.
  const { pathname } = useLocation();
  const administrationEntry = findAdministrationEntry(navigation.administration, pathname);
  const onAdministrationRoute = administrationEntry !== null;
  const [toggledAdministration, setToggledAdministration] = useState<{ pathname: string; open: boolean } | null>(null);
  const administrationOpen = toggledAdministration?.pathname === pathname ? toggledAdministration.open : onAdministrationRoute;
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const hideBottomNav = useCallback((hidden: boolean) => setBottomNavHidden(hidden), []);
  const [activeSectionHidden, setActiveSectionHidden] = useState(false);
  const hideActiveSection = useCallback((hidden: boolean) => setActiveSectionHidden(hidden), []);
  const name = user?.displayName || user?.email || "";
  const account = user ? { name, email: user.email ?? null } : null;
  const organization = activeOrganization(user);
  const context = scope === "personal" ? { title: t("accessMenu.personal"), detail: t("accessMenu.personalDetail") }
    : scope === "business" && organization ? { title: organization.name, detail: t("layout.sidebar.organization") }
      : null;

  // Tableros M-* («Criterio · Marco»): en el teléfono, Inicio y «Más» abajo; las demás pantallas se abren desde
  // «Más» y vuelven a él con ‹. Debajo del título va el camino («Administración») o la organización.
  const home = navigation.links.at(0);
  const onHome = home?.path === pathname;
  const onMore = navigation.moreTo === pathname;
  const chrome = useMemo<AppChrome>(() => ({
    phone: isMobile,
    parent: isMobile && navigation.moreTo && !onHome && !onMore ? { to: navigation.moreTo, label: t("layout.app.backToMore") } : null,
    subtitle: administrationEntry && navigation.administration ? t(navigation.administration.labelKey) : context?.title ?? null,
    title: administrationEntry ? t(administrationEntry.link.labelKey) : null,
    hideBottomNav,
    hideActiveSection,
  }), [isMobile, navigation.moreTo, navigation.administration, onHome, onMore, administrationEntry, context?.title, hideBottomNav, hideActiveSection, t]);

  if (isSigningOut) return <SessionStatusPage status="closing" />;

  if (isMobile) return <AppChromeProvider value={chrome}>
    <div className="flex h-svh flex-col bg-[var(--lado-activo)]">
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">{children ?? <Outlet />}</main>
      {home && navigation.moreTo && !bottomNavHidden ? <BottomNav label={t("navigation.sections")} items={[
        { key: "home", label: t(home.labelKey), to: home.path, icon: <AppHomeIcon className="size-6" />, active: onHome && !activeSectionHidden },
        { key: "more", label: t("navigation.more"), to: navigation.moreTo, avatar: name.charAt(0).toUpperCase() || undefined, active: !onHome && !activeSectionHidden },
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
        administrationOpen={administrationOpen}
        onToggleAdministration={() => setToggledAdministration({ pathname, open: !administrationOpen })}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <AdminPanel panel={shownNavigation.administration} open={administrationOpen} onClose={() => setToggledAdministration({ pathname, open: false })} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar onToggleNavigation={() => setCollapsed((value) => !value)} breadcrumbs={<Breadcrumbs navigation={navigation} />} />
        <main className="relative min-h-0 flex-1 scroll-pt-14 overflow-y-auto bg-[var(--fondo)] print:overflow-visible">{children ?? <Outlet />}</main>
      </div>
    </div>
  </AppChromeProvider>;
}
