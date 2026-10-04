import { Outlet } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { ForbiddenPage } from "@/areas/public/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@/areas/public/errors/pages/NotFoundPage";
import type { AppRoute } from "@/layouts/navigation/types";
import { homeOf } from "@/tenancy/access";

/// La guarda de una ruta del manifiesto: con su módulo apagado la ruta no existe (404, como el back) y sin su permiso
/// muestra «No tenés permiso», dentro del marco del acceso. Va debajo de `LegalAcceptanceGate`, que ya leyó /api/me.
/// Los permisos del front son solo experiencia de uso: decide el back.
export function RequirePermission({ permission, feature }: Pick<AppRoute, "permission" | "feature">) {
  const { data: me } = useCurrentUser();
  const { can, hasFeature } = usePermissions();
  if (!me) return null;
  if (feature && !hasFeature(feature)) return <NotFoundPage homePath={homeOf(me.access)} />;
  if (permission && !can(permission)) return <ForbiddenPage homePath={homeOf(me.access)} />;
  return <Outlet />;
}
