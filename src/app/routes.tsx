import type { RouteObject } from "react-router";
import { SessionRecovery } from "@/auth/SessionRecovery";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AccessRoute } from "@/auth/AccessRoute";
import { BusinessHomePage } from "@/areas/business/home/pages/BusinessHomePage";
import { BusinessLayout } from "@/layouts/BusinessLayout";
import { PlatformLayout } from "@/layouts/PlatformLayout";
import { SiteLayout } from "@/layouts/SiteLayout";
import { AppErrorPage } from "@/layouts/AppErrorBoundary";
import { AppShell } from "@/layouts/AppShell";
import { ForbiddenRoute, HomeRoute, NotFoundRoute } from "./RouteViews";

export const routes: RouteObject[] = [
  { element: <AppShell />, errorElement: <AppErrorPage />, children: [
  { path: "/login", lazy: async () => {
    const { LoginPage } = await import("@/areas/public/auth/pages/LoginPage");
    return { Component: () => <LoginPage access="consumer" /> };
  }, errorElement: <AppErrorPage /> },
  { path: "/login/empresa", lazy: async () => {
    const { LoginPage } = await import("@/areas/public/auth/pages/LoginPage");
    return { Component: () => <LoginPage access="business" /> };
  }, errorElement: <AppErrorPage /> },
  { path: "/registro", lazy: async () => {
    const { SignupPage } = await import("@/areas/public/auth/pages/SignupPage");
    return { Component: SignupPage };
  }, errorElement: <AppErrorPage /> },
  { path: "/auth/callback", lazy: async () => {
    const { CallbackPage } = await import("@/areas/public/auth/pages/CallbackPage");
    return { Component: CallbackPage };
  }, errorElement: <AppErrorPage /> },
  { path: "/terminos", lazy: async () => {
    const { LegalDocumentPage } = await import("@/areas/public/legal/pages/LegalDocumentPage");
    return { Component: () => <SiteLayout><LegalDocumentPage kind="terms" /></SiteLayout> };
  }, errorElement: <AppErrorPage /> },
  { path: "/privacidad", lazy: async () => {
    const { LegalDocumentPage } = await import("@/areas/public/legal/pages/LegalDocumentPage");
    return { Component: () => <SiteLayout><LegalDocumentPage kind="privacy" /></SiteLayout> };
  }, errorElement: <AppErrorPage /> },
  { path: "/sin-permiso", element: <ForbiddenRoute />, errorElement: <AppErrorPage /> },
  { element: <SessionRecovery />, children: [
    { path: "/", element: <HomeRoute />, errorElement: <AppErrorPage /> },
    { element: <ProtectedRoute />, children: [
      { element: <AccessRoute access="business" />, children: [
        { path: "/org", element: <BusinessLayout />, children: [{ index: true, element: <BusinessHomePage /> }] },
      ] },
      { element: <AccessRoute access="platform" />, children: [
        { path: "/plataforma", element: <PlatformLayout /> },
      ] },
    ] },
  ] },
  { path: "*", element: <NotFoundRoute />, errorElement: <AppErrorPage /> },
  ] },
];
