# Accesos, permisos y módulos

**Regla:** cada pantalla pertenece a **un acceso** (persona, empresa o plataforma) o al **sitio público**. El front **muestra u oculta**; el backend **decide**. Dentro del acceso B2B, cada ruta declara su permiso (y su módulo, si es de un módulo) una sola vez, en el manifiesto de su área, del que salen `routes.tsx` y el menú.

## Cómo se hace
- **Ruta por acceso:**
  - `<AccessRoute access="consumer">` para `/` con sesión, `/<módulo>` B2C;
  - `<AccessRoute access="business">` para `/org/…`;
  - `<AccessRoute access="platform">` para `/plataforma/…`;
  - las rutas públicas (`/` sin sesión, `/login…`, `/registro…`, `/recuperar`, `/invitacion`, `/auth/callback`, `/terminos`, `/privacidad` y las del subdominio) no llevan `AccessRoute`.
- **Manifiesto de rutas:** cada ruta del área se declara una vez en `layouts/navigation/<área>.ts` (`businessRoutes`): camino, permiso, módulo y, si va en el menú, rótulo e ícono. El menú (`businessNavigation`) usa esas mismas entradas y muestra cada una solo con su permiso y su módulo (`visibleNavigation`). `app/routes.tsx` le suma a cada una su pantalla con `lazyPage` y la guarda `<RequirePermission>`: sin el permiso, «No tenés permiso» dentro del marco; con el módulo apagado, `NotFoundPage`. La pantalla no repite la comprobación.
- **Host:** con el subdominio de una organización (`<slug>.plataforma.com`; una página pública por organización, no por empresa), `routes.tsx` arma **solo** las rutas de `storefront` (y `/auth/callback`: el ingreso desde el subdominio vuelve a su propio origen). `usePublicSite()` devuelve el slug del subdominio y los datos públicos de esa organización.
- **Acción:** `const { can, canInCompany } = usePermissions()`. `can("roles.manage")` lee `effectivePermissions.organization` de `/api/me`. En una empresa del grupo, `canInCompany(companyId, "company.members.manage")` lee la lista de esa empresa en `effectivePermissions.companies`; si la empresa no figura (el back todavía no llena el mapa), la de la organización. Los códigos son una unión tipada (`OrganizationPermission` y `CompanyPermission`), copia del catálogo del back.
- **Acceso activo:** `useAccess()` devuelve `access`, la organización activa (en B2B), si la persona tiene espacio personal y sus organizaciones.
- **Rutas y estados de cada acceso:** `tenancy/access.ts` es el único lugar que los sabe: el tipo `Access` del contrato, `homeOf(access)` (el inicio), `loginPathOf(access)` (la puerta), `accessOfPath(path)`, `activeOrganization(me)`, `isSelectable(organization)` y `unavailableCodeOf(status)`. Fuera de ahí no hay un literal `"/org"` ni `"/login/empresa"`: un acceso nuevo se suma en ese archivo.
- **Salir:** `useSignOut()`, la misma secuencia en el menú, «Más», la organización no disponible, los términos y la invitación.
- **Cambiar de acceso u organización:** `useSwitchAccess({ access, tenantId })`:
  1. pantalla «Cambiando a …»;
  2. `signinSilent({ forceIframeAuth: true, extraQueryParams: { access, tenant } })`: `oidc-client-ts` usa el refresh token si existe e ignora esos parámetros; el iframe fuerza `authorize` para emitir el token del acceso solicitado;
  3. `queryClient.clear()`;
  4. el inicio del acceso nuevo.
- **Módulos habilitados:** `GET /api/me` trae `features` del acceso activo.
  - `usePermissions().hasFeature("x")` muestra u oculta.
  - Las rutas y los enlaces de un módulo declaran `feature` además de `permission`. Apagado, el enlace no aparece y la ruta muestra `NotFoundPage`, como el 404 del back.
- **Términos nuevos:** si una respuesta trae `Legal.AcceptanceRequired`, se muestra la pantalla de aceptación, que bloquea.
- **La cuenta** (`/cuenta`) es de la identidad y se ve desde los dos accesos.
- El `companyId` sale de la URL (`useCompanyParam`); nunca hay una "empresa activa" guardada.

## Prohibido
- Mostrar "crear una empresa" en el acceso B2C, o mostrar organizaciones en el espacio personal.
- Usar el subdominio para mostrar algo de la administración de la organización (esa vive en `/org`).
- Preguntar por roles (`user.roles.includes("TenantAdmin")`) o leer la lista plana `permissions` de `/api/me`: los permisos salen de `usePermissions`.
- Una ruta privada sin `AccessRoute`, o un permiso de ruta declarado fuera del manifiesto (en la pantalla, en `routes.tsx` o en el menú).
- Cambiar de acceso sin limpiar la caché.
- Guardar el acceso o la organización en localStorage: lo sabe el token.

## Copiá de
- `src/app/routes.tsx` y `src/layouts/navigation/business.ts` (E3–E4) · `src/tenancy/useSwitchAccess.ts` (E3) · `src/auth/usePermissions.ts` (E7) · `src/app/RequirePermission.tsx` (E7).

## Lo verifica
- `routes.test.tsx` (E3): cada ruta del manifiesto pide su permiso; `visible.test.ts` (E7): el menú son rutas del manifiesto y cada enlace se ve solo con su permiso y su módulo; `RequirePermission.test.tsx` (E7): sin el permiso, «No tenés permiso»; con el módulo apagado, la ruta no existe.
- `AccessRoute.test.tsx` (E3), `useSwitchAccess.test.tsx` (E3) y `AccessMenu.test.tsx` (E3): limpia la caché al cambiar; una persona sin organizaciones no ve «Ir a mi empresa» y en B2C nunca aparece «Registrá tu empresa».
- `routes-by-host.test.ts` (E7): un subdominio no monta rutas de `/org`.
- `usePermissions.test.ts` (E7): `can` lee `effectivePermissions`; `canInCompany`, la empresa del mapa o, si no figura, la organización; los códigos son los del catálogo del back.
- `access.test.ts` (E7): el inicio, la puerta, la ruta y los estados de cada acceso; `access-paths.test.ts` (E7): ningún literal `"/org"` ni `"/login/empresa"` fuera de `tenancy/access.ts`; `useSignOut.test.tsx` (E7).

## Detalle
[frontend.md §3](../architecture/frontend.md#3-rutas) · back: `docs/architecture/multitenancy.md` y `docs/rules/modulos-habilitados.md`
