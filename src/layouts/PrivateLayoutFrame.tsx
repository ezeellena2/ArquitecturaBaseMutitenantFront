import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { accountIdentity } from "@/auth/accountIdentity";
import { usePermissions } from "@/auth/usePermissions";
import { useIsSigningOut } from "@/auth/signOutStatus";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { AppBarBellProvider } from "@/shared/ui/app/AppBar";
import { AppChromeProvider, type AppChrome } from "@/shared/ui/app/AppChrome";
import { BottomNav, BottomNavBadge } from "@/shared/ui/app/BottomNav";
import { AppHomeIcon } from "@/shared/ui/icons";
import { AdminPanel } from "./components/AdminPanel";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { NotificationBell, PhoneNotificationBell } from "./notifications/NotificationBell";
import { notificationsPath, platformNotificationsPath } from "./notifications/paths";
import { findNavigationPanelEntry, navigationPanel, type NavigationPanelKey } from "./navigation/administration";
import type { NavigationConfig } from "./navigation/types";
import { visibleNavigation } from "./navigation/visible";
import { activeOrganization } from "@/tenancy/access";

interface PrivateLayoutFrameProps {
  navigation: NavigationConfig;
  scope?: "personal" | "business" | "platform";
  children?: ReactNode;
}

// Las teclas con las que el navegador mueve una página. Con Ctrl, Alt o Cmd son atajos de otra cosa.
const scrollKeys = new Set(["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", " "]);

/// «Criterio · Menús» (213): las teclas que mueven la pantalla mueven el contenido aunque el foco esté en el menú. Con
/// el alto de la pantalla (`h-svh`), el que se desplaza es `main`, así que Re Pág, Av Pág, Inicio, Fin, Espacio y las
/// flechas no movían nada con el foco en el menú, en la barra, en la barra de abajo del teléfono o en ninguna parte
/// (al abrir una pantalla, o cuando se fue el botón que lo tenía). La tecla le pasa el foco a `main` y el navegador, que
/// mira el foco recién después de avisarle a la página, mueve el contenido con esa misma tecla.
///
/// Lo que ya tiene la tecla se queda con ella: un control que la usó (`defaultPrevented`), un botón con Espacio y todo lo
/// que está adentro del contenido o fuera del armazón, como un diálogo o un menú abierto, donde un campo, un desplegable
/// o una lista siguen siendo los que la reciben.
function useScrollKeysToContent(shell: RefObject<HTMLElement | null>, content: RefObject<HTMLElement | null>) {
  useEffect(() => {
    function handOver(event: KeyboardEvent) {
      const frame = shell.current;
      const main = content.current;
      const focused = document.activeElement;
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || !scrollKeys.has(event.key)
        || frame === null || main === null || main.contains(focused)) return;
      const outsideContent = focused === null || focused === document.body || frame.contains(focused);
      if (outsideContent && !(event.key === " " && focused?.closest("button"))) main.focus({ preventScroll: true });
    }
    document.addEventListener("keydown", handOver);
    return () => document.removeEventListener("keydown", handOver);
  }, [shell, content]);
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
  const openPanel = selectedPanel && navigationPanel(shownNavigation, selectedPanel) ? selectedPanel : null;
  const togglePanel = (panel: NavigationPanelKey) => setToggledPanel({ pathname, panel: openPanel === panel ? null : panel });
  const [bottomNavHidden, setBottomNavHidden] = useState(false);
  const hideBottomNav = useCallback((hidden: boolean) => setBottomNavHidden(hidden), []);
  const [activeSectionHidden, setActiveSectionHidden] = useState(false);
  const hideActiveSection = useCallback((hidden: boolean) => setActiveSectionHidden(hidden), []);
  const [homeMarked, setHomeMarked] = useState(false);
  const markHome = useCallback((marked: boolean) => setHomeMarked(marked), []);
  const account = user ? accountIdentity(user) : null;
  const organization = activeOrganization(user);
  const context = scope === "personal" ? { title: t("accessMenu.personal"), detail: t("accessMenu.personalDetail") }
    : scope === "business" && organization ? { title: organization.name, detail: t("layout.sidebar.organization") }
      : scope === "platform" ? { title: t("navigation.platform"), detail: t("layout.sidebar.platformDetail") } : null;

  // Personal suma sus módulos visibles a Inicio; los demás accesos conservan las secciones del manifiesto.
  // Hasta cuatro secciones y Más, donde también se abren los módulos que quedan afuera.
  // Las pantallas de Administración se abren desde Más y vuelven a él con ‹.
  // Una opción que aporta un módulo («WhatsApp» de Plataforma) nunca es el Inicio, aunque quede primera.
  const home = navigation.links.find((link) => !link.contributed);
  // Una pantalla que vuelve al Inicio con ‹ (la ficha de la empresa de quien la administra sola) también es del Inicio.
  const onHome = home?.path === pathname || homeMarked;
  const onMore = navigation.moreTo === pathname;
  const bottomSections = useMemo(() => shownNavigation.bottomSections?.slice(0, 4) ?? (scope === "personal"
    ? shownNavigation.links.filter((link) => link === home || link.feature).slice(0, 4)
      .map((link) => ({ link, icon: link === home ? AppHomeIcon : link.icon })) : undefined), [shownNavigation, scope, home]);
  const bottomSection = !onMore ? bottomSections?.find((section) => section.link === panelEntry?.link || section.link.path === pathname
    || ((scope === "personal" || (section.link.contributed && !panelEntry)) && pathname.startsWith(`${section.link.path}/`))) : undefined;
  const routePanel = panelEntry ? navigationPanel(navigation, panelEntry.panel) : null;
  const chrome = useMemo<AppChrome>(() => ({
    phone: isMobile,
    parent: isMobile && navigation.moreTo && !onHome && !onMore && !bottomSection ? { to: navigation.moreTo, label: t("layout.app.backToMore") } : null,
    // La bajada nombra el panel; la pantalla de un módulo dentro de Administración suma el módulo: «Administración · WhatsApp».
    subtitle: routePanel && !bottomSection && !onMore ? panelEntry?.section?.moreGroup
      ? `${t(routePanel.labelKey)} · ${t(panelEntry.section.labelKey)}` : t(routePanel.labelKey) : context?.title ?? null,
    title: panelEntry && !onMore ? t(panelEntry.link.labelKey) : null,
    hideBottomNav,
    hideActiveSection,
    homePath: home?.path ?? navigation.breadcrumbRoot?.path ?? null,
    markHome,
  }), [isMobile, navigation.moreTo, navigation.breadcrumbRoot?.path, routePanel, onHome, onMore, bottomSection, panelEntry, context?.title, hideBottomNav, hideActiveSection, home?.path, markHome, t]);
  // Tableros M-Campana*: en el teléfono, la campana va en la barra de cada pantalla de primer nivel y lleva a «Avisos».
  const phoneBell = useMemo(() => <PhoneNotificationBell to={scope === "platform" ? platformNotificationsPath : notificationsPath} />, [scope]);
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  useScrollKeysToContent(shellRef, contentRef);

  if (isSigningOut) return <SessionStatusPage status="closing" />;

  if (isMobile) return <AppChromeProvider value={chrome}><AppBarBellProvider value={phoneBell}>
    <div ref={shellRef} className="flex h-svh flex-col bg-[var(--superficie)]">
      {/* `tabIndex={-1}`: toma el foco cuando le pasan las teclas que mueven la pantalla, sin sumarse al recorrido con Tab.
          Sin contorno: es la pantalla entera, y el foco visible lo muestran los controles de adentro. */}
      <main ref={contentRef} tabIndex={-1} className="relative flex min-h-0 flex-1 flex-col overflow-y-auto outline-none">{children ?? <Outlet />}</main>
      {navigation.moreTo && !bottomNavHidden ? <BottomNav label={t("navigation.sections")} items={[
        ...(bottomSections?.map(({ link, icon: Icon }) => ({
          key: link.path, label: t(link.phoneLabelKey ?? link.labelKey), to: link.path, icon: <Icon className="size-6" />, active: (link === bottomSection?.link || (link === home && onHome)) && !activeSectionHidden,
          ...(link.Badge ? { badge: <link.Badge>{(count) => <BottomNavBadge count={count} />}</link.Badge> } : {}),
        })) ?? (home ? [{ key: "home", label: t(home.labelKey), to: home.path, icon: <AppHomeIcon className="size-6" />, active: onHome && !activeSectionHidden }] : [])),
        { key: "more", label: t("navigation.more"), to: navigation.moreTo, avatar: account?.avatarInitials, avatarMuted: account?.avatarMuted, active: !(bottomSections ? bottomSection || onHome : onHome) && !activeSectionHidden },
      ]} /> : null}
    </div>
  </AppBarBellProvider></AppChromeProvider>;

  return <AppChromeProvider value={chrome}>
    <div ref={shellRef} className="flex h-svh print:h-auto">
      <Sidebar
        navigation={shownNavigation}
        account={account}
        context={context}
        collapsed={collapsed}
        managementOpen={openPanel === "management"}
        onToggleManagement={() => togglePanel("management")}
        administrationOpen={openPanel === "administration"}
        onToggleAdministration={() => togglePanel("administration")}
        openModulePanel={openPanel?.startsWith("module:") ? openPanel : null}
        onToggleModulePanel={togglePanel}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
      <AdminPanel panel={openPanel ? navigationPanel(shownNavigation, openPanel) : null} open={openPanel !== null}
        currentLink={panelEntry?.panel === openPanel ? panelEntry.link : null}
        onClose={() => setToggledPanel({ pathname, panel: null })} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar breadcrumbs={<Breadcrumbs navigation={navigation} permissions={permissions} />} bell={<NotificationBell />} />
        <main ref={contentRef} tabIndex={-1} className="relative min-h-0 flex-1 scroll-pt-14 overflow-y-auto bg-[var(--fondo)] outline-none print:overflow-visible">{children ?? <Outlet />}</main>
      </div>
    </div>
  </AppChromeProvider>;
}
