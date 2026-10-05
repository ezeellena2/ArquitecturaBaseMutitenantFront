import type { ComponentType } from "react";
import type { LazyRouteFunction, RouteObject } from "react-router";
import { Outlet } from "react-router";
import { SessionRecovery } from "@/auth/SessionRecovery";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { LegalAcceptanceGate } from "@/auth/LegalAcceptanceGate";
import { AccessRoute } from "@/auth/AccessRoute";
import { BusinessHomePage } from "@/areas/business/home/pages/BusinessHomePage";
import { BusinessLayout } from "@/layouts/BusinessLayout";
import { AccountLayout } from "@/layouts/AccountLayout";
import { PersonalHomePage } from "@/areas/personal/home/pages/PersonalHomePage";
import { PersonalLayout } from "@/layouts/PersonalLayout";
import { PlatformLayout } from "@/layouts/PlatformLayout";
import { SiteLayout } from "@/layouts/SiteLayout";
import { AppErrorPage } from "@/layouts/AppErrorBoundary";
import { AppShell } from "@/layouts/AppShell";
import { businessRoutes } from "@/layouts/navigation/business";
import { platformNavigation, platformRoutes } from "@/layouts/navigation/platform";
import type { AppRoute } from "@/layouts/navigation/types";
import { ForbiddenRoute, HomeRoute, NotFoundRoute, PlatformHomeRoute } from "./RouteViews";
import { RequirePermission } from "./RequirePermission";
import { homeOf, loginPathOf } from "@/tenancy/access";

/// La pantalla de una ruta, que se carga recién al entrar.
function lazyPage<TModule>(load: () => Promise<TModule>, page: (module: TModule) => ComponentType): LazyRouteFunction<RouteObject> {
  return async () => ({ Component: page(await load()) });
}

// La pantalla de cada ruta del manifiesto de la organización (salvo el Inicio, que se carga con el marco). El permiso,
// el módulo y el camino salen del manifiesto: acá no se repiten.
const businessPages: Record<Exclude<keyof typeof businessRoutes, "home">, LazyRouteFunction<RouteObject>> = {
  users: lazyPage(() => import("@/areas/business/users/pages/UsersPage"), (page) => page.UsersPage),
  user: lazyPage(() => import("@/areas/business/users/pages/UserDetailPage"), (page) => page.UserDetailPage),
  roles: lazyPage(() => import("@/areas/business/roles/pages/RolesPage"), (page) => page.RolesPage),
  newRole: lazyPage(() => import("@/areas/business/roles/pages/RoleEditorPage"), (page) => () => <page.RoleEditorPage mode="create" />),
  role: lazyPage(() => import("@/areas/business/roles/pages/RoleEditorPage"), (page) => () => <page.RoleEditorPage mode="edit" />),
  companies: lazyPage(() => import("@/areas/business/companies/pages/CompaniesPage"), (page) => page.CompaniesPage),
  company: lazyPage(() => import("@/areas/business/companies/pages/CompanyDetailPage"), (page) => page.CompanyDetailPage),
  settings: lazyPage(() => import("@/areas/business/settings/pages/SettingsPage"), (page) => page.SettingsPage),
  publicPage: lazyPage(() => import("@/areas/business/public-page/pages/PublicPagePage"), (page) => page.PublicPagePage),
  audit: lazyPage(() => import("@/areas/business/audit/pages/AuditPage"), (page) => page.AuditPage),
};

const businessPageRoutes: RouteObject[] = (Object.keys(businessPages) as (keyof typeof businessPages)[]).map((name) => {
  const route: AppRoute = businessRoutes[name];
  return { element: <RequirePermission permission={route.permission} companyPermission={route.companyPermission} feature={route.feature} />, children: [
    { path: route.path, lazy: businessPages[name], errorElement: <AppErrorPage /> },
  ] };
});

export type PlatformPages = Partial<Record<keyof typeof platformRoutes, LazyRouteFunction<RouteObject>>>;

// Las páginas se suman en T21–T23: una entrada del manifiesto sola no monta una pantalla futura.
export const platformPages: PlatformPages = {};

/// Monta sólo las páginas disponibles, con el permiso del manifiesto. El inicio elige Gestión y luego Administración.
export function createPlatformPageRoutes(pages: PlatformPages): RouteObject[] {
  const names = (Object.keys(pages) as (keyof typeof platformRoutes)[]).filter((name) => pages[name]);
  const availablePaths = new Set(names.map((name) => platformRoutes[name].path));
  const availableRoutes = [...(platformNavigation.management?.links ?? []), ...(platformNavigation.administration?.links ?? [])]
    .filter((route) => names.length === 0 || availablePaths.has(route.path));
  const pageRoutes = names.filter((name) => name !== "organizations").map((name): RouteObject => {
    const route = platformRoutes[name];
    return { element: <RequirePermission platformPermission={route.platformPermission} />, children: [
      { path: route.path, lazy: pages[name], errorElement: <AppErrorPage /> },
    ] };
  });
  return [
    { element: <PlatformHomeRoute availableRoutes={availableRoutes} pendingPages={names.length === 0} />, children: [
      { index: true, ...(pages.organizations ? { lazy: pages.organizations } : { element: <Outlet /> }), errorElement: <AppErrorPage /> },
    ] },
    ...pageRoutes,
  ];
}

export const routes: RouteObject[] = [
  { element: <AppShell />, errorElement: <AppErrorPage />, children: [
  { path: "/login", lazy: lazyPage(() => import("@/areas/public/auth/pages/LoginPage"), (page) => () => <page.LoginPage access="consumer" />), errorElement: <AppErrorPage /> },
  { path: loginPathOf("business"), lazy: lazyPage(() => import("@/areas/public/auth/pages/LoginPage"), (page) => () => <page.LoginPage access="business" />), errorElement: <AppErrorPage /> },
  { path: "/registro", lazy: lazyPage(() => import("@/areas/public/auth/pages/SignupPage"), (page) => page.SignupPage), errorElement: <AppErrorPage /> },
  { path: "/recuperar", lazy: lazyPage(() => import("@/areas/public/auth/pages/RecoverAccountPage"), (page) => page.RecoverAccountPage), errorElement: <AppErrorPage /> },
  { path: "/registro/empresa", lazy: lazyPage(() => import("@/areas/public/auth/pages/BusinessSignupPage"), (page) => page.BusinessSignupPage), errorElement: <AppErrorPage /> },
  { path: "/invitacion", lazy: lazyPage(() => import("@/areas/public/auth/pages/InvitationPage"), (page) => page.InvitationPage), errorElement: <AppErrorPage /> },
  { path: "/auth/callback", lazy: lazyPage(() => import("@/areas/public/auth/pages/CallbackPage"), (page) => page.CallbackPage), errorElement: <AppErrorPage /> },
  { path: "/terminos", lazy: lazyPage(() => import("@/areas/public/legal/pages/LegalDocumentPage"), (page) => () => <SiteLayout variant="legal"><page.LegalDocumentPage kind="terms" /></SiteLayout>), errorElement: <AppErrorPage /> },
  { path: "/privacidad", lazy: lazyPage(() => import("@/areas/public/legal/pages/LegalDocumentPage"), (page) => () => <SiteLayout variant="legal"><page.LegalDocumentPage kind="privacy" /></SiteLayout>), errorElement: <AppErrorPage /> },
  { path: "/sin-permiso", element: <ForbiddenRoute />, errorElement: <AppErrorPage /> },
  { element: <SessionRecovery />, children: [
    { path: "/", element: <HomeRoute />, errorElement: <AppErrorPage />, children: [
      { element: <ProtectedRoute />, children: [{ element: <LegalAcceptanceGate />, children: [
        { element: <AccessRoute access="consumer" />, children: [
          { index: true, element: <PersonalLayout><PersonalHomePage /></PersonalLayout> },
        ] },
      ] }] },
    ] },
    { element: <ProtectedRoute />, children: [
      { path: "/aceptar-terminos", lazy: lazyPage(() => import("@/areas/public/legal/pages/AcceptTermsPage"), (page) => page.AcceptTermsPage), errorElement: <AppErrorPage /> },
      { element: <LegalAcceptanceGate />, children: [
      { path: "/cuenta", lazy: lazyPage(() => import("@/areas/personal/account/pages/AccountPage"), (page) => () => <AccountLayout><page.AccountPage /></AccountLayout>), errorElement: <AppErrorPage /> },
      // Tableros M-Mas-Personal y M-WA-Menu: la pestaña «Más» del teléfono, en cualquiera de los accesos.
      { path: "/mas", lazy: lazyPage(() => import("@/layouts/MorePage"), (page) => () => <AccountLayout><page.MorePage /></AccountLayout>), errorElement: <AppErrorPage /> },
      { element: <AccessRoute access="business" />, children: [
        { path: homeOf("business"), element: <BusinessLayout />, children: [
          { index: true, element: <BusinessHomePage /> },
          ...businessPageRoutes,
        ] },
      ] },
      { element: <AccessRoute access="platform" />, children: [
        { path: homeOf("platform"), element: <PlatformLayout />, children: createPlatformPageRoutes(platformPages) },
      ] },
      ] },
    ] },
  ] },
  { path: "*", element: <NotFoundRoute />, errorElement: <AppErrorPage /> },
  ] },
];
