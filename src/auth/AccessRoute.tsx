import { useAuth } from "react-oidc-context";
import { Navigate, Outlet } from "react-router";
import { homeOf, parseAccess, type Access } from "@/tenancy/access";

export function AccessRoute({ access }: { access: Access }) {
  const auth = useAuth();
  const currentAccess = parseAccess(auth.user?.profile.access);

  // ProtectedRoute conserva el árbol durante la recuperación tras F5.
  if (!auth.user) return <Outlet />;
  if (!currentAccess) return <Navigate to="/sin-permiso" replace />;
  if (currentAccess !== access) return <Navigate to={homeOf(currentAccess)} replace />;
  return <Outlet />;
}
