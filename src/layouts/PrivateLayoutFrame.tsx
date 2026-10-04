import { useMemo, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useIsSigningOut } from "@/auth/signOutStatus";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { AdminPanel } from "./components/AdminPanel";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { findAdministrationEntry } from "./navigation/administration";
import type { NavigationConfig } from "./navigation/types";

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
  const visibleNavigation = useMemo(() => {
    const permissions = new Set(user?.permissions ?? []);
    const visible = (entry: { permission?: string }) => !entry.permission || permissions.has(entry.permission);
    const links = navigation.links.filter(visible);
    const source = navigation.administration;
    const sections = source?.sections?.map((section) => ({ ...section, links: section.links.filter(visible) }))
      .filter((section) => section.links.length > 0);
    const panelLinks = source?.links.filter(visible) ?? [];
    const administration = source && (panelLinks.length > 0 || (sections?.length ?? 0) > 0)
      ? { ...source, links: panelLinks, ...(source.sections ? { sections } : {}) }
      : null;
    return { ...navigation, links, administration };
  }, [navigation, user?.permissions]);
  const [collapsed, setCollapsed] = useLocalStorage("sidebarCollapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // En una pantalla de Administración el panel arranca abierto, también al recargar; en las demás, cerrado. Lo que
  // la persona abre o cierra vale hasta que cambia de pantalla. Se mira la navegación completa y no la visible,
  // que espera a los permisos: si no, al recargar el panel quedaría cerrado.
  const { pathname } = useLocation();
  const onAdministrationRoute = findAdministrationEntry(navigation.administration, pathname) !== null;
  const [toggledAdministration, setToggledAdministration] = useState<{ pathname: string; open: boolean } | null>(null);
  const administrationOpen = toggledAdministration?.pathname === pathname ? toggledAdministration.open : onAdministrationRoute;
  const name = user?.displayName || user?.email || "";
  const account = user ? { name, email: user.email ?? null } : null;
  const activeOrganization = user?.organizations.find((item) => item.id === user.activeTenantId);
  const context = scope === "personal" ? { title: t("accessMenu.personal"), detail: t("accessMenu.personalDetail") }
    : scope === "business" && activeOrganization ? { title: activeOrganization.name, detail: t("layout.sidebar.organization") }
      : null;

  if (isSigningOut) return <SessionStatusPage status="closing" />;

  return <div className="flex h-svh print:h-auto">
    <Sidebar
      navigation={visibleNavigation}
      account={account}
      context={context}
      isMobile={isMobile}
      mobileOpen={mobileOpen}
      collapsed={collapsed}
      administrationOpen={administrationOpen}
      onToggleAdministration={() => setToggledAdministration({ pathname, open: !administrationOpen })}
      onToggleCollapsed={() => setCollapsed((value) => !value)}
      onCloseMobile={() => setMobileOpen(false)}
    />
    <AdminPanel panel={visibleNavigation.administration} open={administrationOpen} isMobile={isMobile} onClose={() => setToggledAdministration({ pathname, open: false })} />
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Topbar
        onToggleNavigation={() => { if (isMobile) setMobileOpen((value) => !value); else setCollapsed((value) => !value); }}
        breadcrumbs={<Breadcrumbs navigation={navigation} />}
      />
      <main className="relative min-h-0 flex-1 scroll-pt-14 overflow-y-auto bg-[var(--fondo)] print:overflow-visible">{children ?? <Outlet />}</main>
    </div>
  </div>;
}
