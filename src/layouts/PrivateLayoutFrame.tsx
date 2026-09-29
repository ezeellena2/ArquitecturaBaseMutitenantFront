import { useState, type ReactNode } from "react";
import { Outlet } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { useIsSigningOut } from "@/auth/signOutStatus";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { AdminPanel } from "./components/AdminPanel";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import type { NavigationConfig } from "./navigation/types";

interface PrivateLayoutFrameProps {
  navigation: NavigationConfig;
  children?: ReactNode;
}

export function PrivateLayoutFrame({ navigation, children }: PrivateLayoutFrameProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isSigningOut = useIsSigningOut();
  const { data: user } = useCurrentUser();
  const [collapsed, setCollapsed] = useLocalStorage("sidebarCollapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [administrationOpen, setAdministrationOpen] = useState(false);
  const name = user?.displayName || user?.email || "";
  const account = user ? { name, email: user.email ?? null } : null;

  if (isSigningOut) return <SessionStatusPage status="closing" />;

  return <div className="flex h-svh print:h-auto">
    <Sidebar
      navigation={navigation}
      account={account}
      isMobile={isMobile}
      mobileOpen={mobileOpen}
      collapsed={collapsed}
      administrationOpen={administrationOpen}
      onToggleAdministration={() => setAdministrationOpen((value) => !value)}
      onToggleCollapsed={() => setCollapsed((value) => !value)}
      onCloseMobile={() => setMobileOpen(false)}
    />
    <AdminPanel panel={navigation.administration} open={administrationOpen} isMobile={isMobile} onClose={() => setAdministrationOpen(false)} />
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Topbar
        onToggleNavigation={() => { if (isMobile) setMobileOpen((value) => !value); else setCollapsed((value) => !value); }}
        breadcrumbs={<Breadcrumbs navigation={navigation} />}
      />
      <main className="relative min-h-0 flex-1 scroll-pt-14 overflow-y-auto bg-[var(--fondo)] print:overflow-visible">{children ?? <Outlet />}</main>
    </div>
  </div>;
}
