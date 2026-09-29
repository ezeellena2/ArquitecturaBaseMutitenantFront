import { useAuth } from "react-oidc-context";
import { Navigate, Outlet } from "react-router";

export type AccessKind = "consumer" | "business" | "platform";

const homeByAccess: Record<AccessKind, string> = {
  consumer: "/",
  business: "/org",
  platform: "/plataforma",
};

function isAccessKind(value: unknown): value is AccessKind {
  return value === "consumer" || value === "business" || value === "platform";
}

export function AccessRoute({ access }: { access: AccessKind }) {
  const auth = useAuth();
  const currentAccess: unknown = auth.user?.profile.access;

  // ProtectedRoute conserva el árbol durante la recuperación tras F5.
  if (!auth.user) return <Outlet />;
  if (!isAccessKind(currentAccess)) return <Navigate to="/sin-permiso" replace />;
  if (currentAccess !== access) return <Navigate to={homeByAccess[currentAccess]} replace />;
  return <Outlet />;
}
