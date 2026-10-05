import { Outlet, useParams } from "react-router";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions } from "@/auth/usePermissions";
import { ForbiddenPage } from "@/areas/public/errors/pages/ForbiddenPage";
import { NotFoundPage } from "@/areas/public/errors/pages/NotFoundPage";
import type { AppRoute } from "@/layouts/navigation/types";
import { homeOf } from "@/tenancy/access";

/// La guarda de una ruta del manifiesto: con su módulo apagado la ruta no existe (404, como el back) y sin su permiso
/// muestra «No tenés permiso», dentro del marco del acceso. Va debajo de `LegalAcceptanceGate`, que ya leyó /api/me.
/// Con `companyPermission`, la ruta de una empresa también se abre con ese permiso en la empresa de la ruta
/// (`:companyId`), como el back (B4). Los permisos del front son solo experiencia de uso: decide el back.
export function RequirePermission({ permission, companyPermission, platformPermission, feature }: Pick<AppRoute, "permission" | "companyPermission" | "platformPermission" | "feature">) {
  const { data: me } = useCurrentUser();
  const { can, canInCompany, canPlatform, hasFeature } = usePermissions();
  const { companyId } = useParams();
  if (!me) return null;
  if (feature && !hasFeature(feature)) return <NotFoundPage homePath={homeOf(me.access)} />;
  const inCompany = Boolean(companyPermission && companyId && canInCompany(companyId, companyPermission));
  if (permission && !can(permission) && !inCompany) return <ForbiddenPage homePath={homeOf(me.access)} />;
  if (platformPermission && !canPlatform(platformPermission)) return <ForbiddenPage homePath={homeOf(me.access)} />;
  return <Outlet />;
}
