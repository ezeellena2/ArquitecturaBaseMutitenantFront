import type { ReactNode } from "react";
import { useAuth } from "react-oidc-context";
import { Navigate, Outlet, useLocation } from "react-router";
import { NotFoundPage } from "@/areas/public/errors/pages/NotFoundPage";
import { OtherAccessPage } from "@/areas/public/errors/pages/OtherAccessPage";
import { BusinessLayout } from "@/layouts/BusinessLayout";
import { PersonalLayout } from "@/layouts/PersonalLayout";
import { homeOf, isSelectable, parseAccess, type Access } from "@/tenancy/access";
import { useCurrentUser } from "./useCurrentUser";

const isPerson = (access: Access): access is "consumer" | "business" => access === "consumer" || access === "business";

export function AccessRoute({ access }: { access: Access }) {
  const auth = useAuth();
  const currentAccess = parseAccess(auth.user?.profile.access);

  // ProtectedRoute conserva el árbol durante la recuperación tras F5.
  if (!auth.user) return <Outlet />;
  if (!currentAccess) return <Navigate to="/sin-permiso" replace />;
  if (currentAccess === access) return <Outlet />;
  return <OtherAccessRoute access={access} currentAccess={currentAccess} />;
}

/// F7 (tableros Otro-Acceso y Otro-Acceso-Persona; accesos-y-permisos.md): un link del otro acceso de una persona no la
/// manda al inicio sin decir nada; dice de quién es y ofrece entrar con ese acceso, y al entrar abre el link. Si la cuenta
/// no tiene ese acceso (Plataforma, o una empresa sin organizaciones para elegir), el link no existe para ella. El inicio
/// personal («/») es el inicio de siempre, no un link, y un operador sigue yendo al inicio de Plataforma.
function OtherAccessRoute({ access, currentAccess }: { access: Access; currentAccess: Access }) {
  const location = useLocation();
  const { data: me } = useCurrentUser();

  if (!isPerson(currentAccess) || location.pathname === homeOf("consumer")) return <Navigate to={homeOf(currentAccess)} replace />;
  const frame = (content: ReactNode) => currentAccess === "consumer" ? <PersonalLayout>{content}</PersonalLayout> : <BusinessLayout>{content}</BusinessLayout>;
  const organizations = (me?.organizations ?? []).filter(isSelectable);
  if (!isPerson(access) || (access === "business" && organizations.length === 0)) return frame(<NotFoundPage homePath={homeOf(currentAccess)} />);
  return frame(<OtherAccessPage target={access} returnTo={`${location.pathname}${location.search}${location.hash}`} organizations={organizations} />);
}
