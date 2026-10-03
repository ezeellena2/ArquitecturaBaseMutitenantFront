import type { RouteObject } from "react-router";
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
  { path: "/registro/empresa", lazy: async () => {
    const { BusinessSignupPage } = await import("@/areas/public/auth/pages/BusinessSignupPage");
    return { Component: BusinessSignupPage };
  }, errorElement: <AppErrorPage /> },
  { path: "/invitacion", lazy: async () => {
    const { InvitationPage } = await import("@/areas/public/auth/pages/InvitationPage");
    return { Component: InvitationPage };
  }, errorElement: <AppErrorPage /> },
  { path: "/auth/callback", lazy: async () => {
    const { CallbackPage } = await import("@/areas/public/auth/pages/CallbackPage");
    return { Component: CallbackPage };
  }, errorElement: <AppErrorPage /> },
  { path: "/terminos", lazy: async () => {
    const { LegalDocumentPage } = await import("@/areas/public/legal/pages/LegalDocumentPage");
    return { Component: () => <SiteLayout variant="legal"><LegalDocumentPage kind="terms" /></SiteLayout> };
  }, errorElement: <AppErrorPage /> },
  { path: "/privacidad", lazy: async () => {
    const { LegalDocumentPage } = await import("@/areas/public/legal/pages/LegalDocumentPage");
    return { Component: () => <SiteLayout variant="legal"><LegalDocumentPage kind="privacy" /></SiteLayout> };
  }, errorElement: <AppErrorPage /> },
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
      { path: "/aceptar-terminos", lazy: async () => {
        const { AcceptTermsPage } = await import("@/areas/public/legal/pages/AcceptTermsPage");
        return { Component: AcceptTermsPage };
      }, errorElement: <AppErrorPage /> },
      { element: <LegalAcceptanceGate />, children: [
      { path: "/cuenta", lazy: async () => {
        const { AccountPage } = await import("@/areas/personal/account/pages/AccountPage");
        return { Component: () => <AccountLayout><AccountPage /></AccountLayout> };
      }, errorElement: <AppErrorPage /> },
      { element: <AccessRoute access="business" />, children: [
        { path: "/org", element: <BusinessLayout />, children: [
          { index: true, element: <BusinessHomePage /> },
          { path: "roles", lazy: async () => {
            const { RolesPage } = await import("@/areas/business/roles/pages/RolesPage");
            return { Component: RolesPage };
          }, errorElement: <AppErrorPage /> },
          { path: "roles/new", lazy: async () => {
            const { RoleEditorPage } = await import("@/areas/business/roles/pages/RoleEditorPage");
            return { Component: () => <RoleEditorPage mode="create" /> };
          }, errorElement: <AppErrorPage /> },
          { path: "roles/:roleId", lazy: async () => {
            const { RoleEditorPage } = await import("@/areas/business/roles/pages/RoleEditorPage");
            return { Component: () => <RoleEditorPage mode="edit" /> };
          }, errorElement: <AppErrorPage /> },
          { path: "auditoria", lazy: async () => {
            const { AuditPage } = await import("@/areas/business/audit/pages/AuditPage");
            return { Component: AuditPage };
          }, errorElement: <AppErrorPage /> },
          { path: "usuarios", lazy: async () => {
            const { UsersPage } = await import("@/areas/business/users/pages/UsersPage");
            return { Component: UsersPage };
          }, errorElement: <AppErrorPage /> },
          { path: "usuarios/:memberId", lazy: async () => {
            const { UserDetailPage } = await import("@/areas/business/users/pages/UserDetailPage");
            return { Component: UserDetailPage };
          }, errorElement: <AppErrorPage /> },
          { path: "empresas", lazy: async () => {
            const { CompaniesPage } = await import("@/areas/business/companies/pages/CompaniesPage");
            return { Component: CompaniesPage };
          }, errorElement: <AppErrorPage /> },
          { path: "empresas/:companyId", lazy: async () => {
            const { CompanyDetailPage } = await import("@/areas/business/companies/pages/CompanyDetailPage");
            return { Component: CompanyDetailPage };
          }, errorElement: <AppErrorPage /> },
          { path: "configuracion", lazy: async () => {
            const { SettingsPage } = await import("@/areas/business/settings/pages/SettingsPage");
            return { Component: SettingsPage };
          }, errorElement: <AppErrorPage /> },
          { path: "pagina", lazy: async () => {
            const { PublicPagePage } = await import("@/areas/business/public-page/pages/PublicPagePage");
            return { Component: PublicPagePage };
          }, errorElement: <AppErrorPage /> },
        ] },
      ] },
      { element: <AccessRoute access="platform" />, children: [
        { path: "/plataforma", element: <PlatformLayout /> },
      ] },
      ] },
    ] },
  ] },
  { path: "*", element: <NotFoundRoute />, errorElement: <AppErrorPage /> },
  ] },
];
