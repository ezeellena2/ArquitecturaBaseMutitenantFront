# Accesos, permisos y módulos

**Regla:** cada pantalla pertenece a **un acceso** (persona, empresa o plataforma) o al **sitio público**. El front **muestra u oculta**; el backend **decide**. Una ruta que exige permiso lo declara (junto con su módulo, si es de un módulo) una sola vez, en el manifiesto de su área, del que salen `routes.tsx` y el menú.

## Cómo se hace
- **Ruta por acceso:**
  - `<AccessRoute access="consumer">` para `/` con sesión, `/<módulo>` B2C;
  - `<AccessRoute access="business">` para `/org/…`;
  - `<AccessRoute access="platform">` para `/plataforma/…`;
  - las rutas públicas (`/` sin sesión, `/empresas`, `/login…`, `/registro…`, `/recuperar`, `/invitacion`, `/auth/callback`, `/terminos`, `/privacidad` y las del subdominio) no llevan `AccessRoute`.
- **Manifiesto de rutas:** cada ruta del área se declara una vez en `layouts/navigation/<área>.ts` (`businessRoutes`): camino, permiso, módulo y, si va en el menú, rótulo e ícono. El menú (`businessNavigation`) usa esas mismas entradas y muestra cada una solo con su permiso y su módulo (`visibleNavigation`). `app/routes.tsx` le suma a cada una su pantalla con `lazyPage` y la guarda `<RequirePermission>`: sin el permiso, «No tenés permiso» dentro del marco; con el módulo apagado, `NotFoundPage`. La pantalla no repite la comprobación. Una ruta de una empresa (`:companyId`) puede declarar además `companyPermission`: también se abre con ese permiso en esa empresa (`canInCompany`), como `[HasCompanyPermission(…, organizationPermission: …)]` del back. La ficha de Empresa pide `companies.read` o `company.members.read` de esa empresa (B4).
- **Plataforma:** `platformRoutes` declara `platformPermission`, del catálogo de nueve códigos del back; `canPlatform` lee sólo `effectivePermissions.platform`. `platformPages` monta las nueve páginas lazy de T21–T23. El constructor admite páginas parciales para etapas futuras y no monta las ausentes; el índice siempre conserva su guarda. Si el operador no abre Organizaciones (el inicio `/plataforma`), el inicio lo lleva con `replace` a la primera pantalla disponible que pueda abrir, en el orden Gestión y luego Administración; sin ninguna, muestra `ForbiddenPage` dentro del marco.
- **Paneles de la compu:** `navigation.management` abre Gestión arriba y `navigation.administration`, Administración al pie. Se ve cada panel sólo si le queda alguna opción permitida, y se abre uno a la vez. Al entrar o recargar arranca abierto el de la ruta; `findNavigationPanelEntry` elige la opción más específica para que `/plataforma` no tape Cuentas. `breadcrumbRoot` identifica Plataforma cuando el inicio es una opción del panel: «Plataforma / Organizaciones / nombre». El operador no tiene Perfiles en el menú de cuenta: ve Plataforma, Mi cuenta y Salir.
- **Barra inferior del teléfono:** `navigation.bottomSections` referencia las mismas entradas del manifiesto y declara sólo sus íconos móviles; `visibleNavigation` aplica `canOpen` a cada una. En Plataforma muestra Organizaciones, Cuentas y Recuperaciones según su permiso, más «Más» siempre. Los detalles conservan la sección de su panel; Administración y Mi cuenta marcan Más. Sin `bottomSections`, Personal toma Inicio + módulos ya visibles, hasta cuatro y Más; Empresa conserva Inicio/Más. Más mantiene todos los módulos Personal visibles en Secciones, incluidos los que no entran en la barra. `navigation.moreTo` declara la ruta canónica de Más: `/plataforma/mas` se monta bajo `AccessRoute platform`, desde el manifiesto y sin pedir un permiso de sección; `/mas` de un operador en teléfono redirige ahí con `replace`. Más muestra la identidad, Administración según permisos, Mi cuenta y Salir, sin Perfiles ni WhatsApp (fuera de E5). En la compu vuelve al inicio del acceso.
- **Host:** `router.tsx` elige `routesForHost(location.host)`; `routes` mantiene el dominio principal para compatibilidad. `siteOfHost` acepta el principal o exactamente un slug válido con el mismo puerto del issuer, sin IP ni niveles extra. El subdominio sólo monta `storefront/site/pages`, callback y No disponible para las demás rutas. Un host desconocido ni siquiera monta callback. No hay administración ni Cuenta privada en el subdominio; una página pública pertenece a una organización, no a una empresa.
- **Datos publicados:** `usePublicSite()` centraliza función HTTP y query key por host (`GET /api/public-site`, alias generado). Sólo 404 con `code=PublicSite.PublicPage.NotFound` pasa a No disponible; otros 404/red/5xx conservan error normal y reintento con `apiErrorMessage`. El host nunca cambia el tenant del token.
- **Dirección pública:** `tenancy/publicSite.ts` deriva `publicSiteHost`, `publicSiteSuffix`, `publicSiteUrl`, `mainSiteHost` y `mainSiteUrl` del issuer fijo (`VITE_AUTH_ISSUER`, por defecto `https://localtest.me:5174`). La URL real incluye esquema y puerto; `mainSiteUrl` rechaza otro origen. No se construyen dominios en tarjetas ni pantallas.
- **Sesión en Storefront:** la CTA sin sesión usa `signinRedirect` Consumer y `state.returnTo` actual (ruta/query/hash); con sesión se oculta. Callback, silent-renew y logout-return son propios del origen. `recoveryAccess` fuerza Consumer en el subdominio y `SessionRecovery` pide iframe sin bloquear el Outlet público ni crear Personal silenciosamente. Ingreso/Registro conservan la autorización original validada, incluida la opción Creá una. `PublicAccessMenu` reutiliza los flujos centrales: Mi cuenta → principal `/cuenta`, perfil de organización → cambio Business/tenant, clear y principal `/org`; Salir → raíz propia. La cookie Platform es independiente (ADR 0044).
- **Receta Personal:** [personal.md](personal.md) vincula la ficha funcional del back. Consumer no lleva permisos ni roles personales; el backend decide 401 sin sesión, 403 por acceso equivocado y 404 de datos ajenos/gates. Las interacciones usan publicación, partes y copia mínima; la retención/baja corre exclusivamente en el backend.
- **Acción:** `const { can, canInCompany } = usePermissions()`. `can("roles.manage")` lee `effectivePermissions.organization` de `/api/me`. En una empresa del grupo, `canInCompany(companyId, "company.members.manage")` lee la lista de esa empresa en `effectivePermissions.companies` (el back la llena desde B4); si la empresa no figura, la de la organización. Los códigos son una unión tipada (`OrganizationPermission` y `CompanyPermission`), copia del catálogo del back.
- **Acceso activo:** `useAccess()` devuelve `access`, la organización activa (en B2B), si la persona tiene espacio personal y sus organizaciones.
- **Rutas y estados de cada acceso:** `tenancy/access.ts` es el único lugar que los sabe: el tipo `Access` del contrato, `homeOf(access)` (el inicio), `loginPathOf(access)` (la puerta), `accessOfPath(path)`, `activeOrganization(me)`, `isSelectable(organization)` y `unavailableCodeOf(status)`. Fuera de ahí no hay un literal `"/org"` ni `"/login/empresa"`: un acceso nuevo se suma en ese archivo.
- **Salir:** `useSignOut()`, la misma secuencia en el menú, «Más», la organización no disponible, los términos y la invitación.
- **Cambiar de acceso u organización:** `useSwitchAccess({ access, tenantId })`:
  1. pantalla «Cambiando a …»;
  2. `signinSilent({ forceIframeAuth: true, extraQueryParams: { access, tenant } })`: `oidc-client-ts` usa el refresh token si existe e ignora esos parámetros; el iframe fuerza `authorize` para emitir el token del acceso solicitado;
  3. `queryClient.clear()`;
  4. el inicio del acceso nuevo.
  Desde Storefront, `useProfiles` activa `useSwitchAccess({ mainSite: true })`: el paso 4 navega al principal, conservando la organización elegida.
- **Módulos habilitados:** `GET /api/me` trae `features` del acceso activo.
  - `usePermissions().hasFeature("x")` muestra u oculta.
  - Las rutas y los enlaces de un módulo declaran `feature` además de `permission`. Apagado, el enlace no aparece y la ruta muestra `NotFoundPage`, como el 404 del back.
- **Términos nuevos:** si una respuesta trae `Legal.AcceptanceRequired`, se muestra la pantalla de aceptación, que bloquea.
- **La cuenta** (`/cuenta`) es de la identidad y conserva el acceso actual: persona, empresa o plataforma.
- El `companyId` sale de la URL (`/org/empresas/:companyId`, con `useParams`, como `RequirePermission` y `CompanyDetailPage`); nunca hay una "empresa activa" guardada.

## Prohibido
- Mostrar "crear una empresa" en el acceso B2C, o mostrar organizaciones en el espacio personal.
- Usar el subdominio para mostrar algo de la administración de la organización (esa vive en `/org`).
- Preguntar por roles (`user.roles.includes("TenantAdmin")`) o leer la lista plana `permissions` de `/api/me`: los permisos salen de `usePermissions`.
- Una ruta privada sin `AccessRoute`, o un permiso de ruta declarado fuera del manifiesto (en la pantalla, en `routes.tsx` o en el menú).
- Cambiar de acceso sin limpiar la caché.
- Guardar el acceso o la organización en localStorage: lo sabe el token.

## Copiá de
- `src/app/routes.tsx` y `src/layouts/navigation/business.ts` (E3–E4) · `src/tenancy/useSwitchAccess.ts` (E3) · `src/auth/usePermissions.ts` (E7) · `src/app/RequirePermission.tsx` (E7).
- `src/layouts/navigation/platform.ts` y `src/auth/usePermissions.ts` (E5): permisos individuales de `/api/me`, rutas, paneles y barra inferior del mismo manifiesto.
- `src/tenancy/publicSite.ts`, `src/tenancy/usePublicSite.ts` y `src/tenancy/PublicAccessMenu.tsx` (E7): host, datos y menú público compartidos; `src/areas/storefront/site/pages/PublicPage.tsx` (E7): ingreso Consumer.

## Lo verifica
- `routes.test.tsx` (E3): cada ruta del manifiesto pide su permiso; `visible.test.ts` (E7): el menú son rutas del manifiesto y cada enlace se ve solo con su permiso y su módulo; `RequirePermission.test.tsx` (E7): sin el permiso, «No tenés permiso»; con el módulo apagado, la ruta no existe; con el permiso de empresa como alternativa, abre la ficha de su empresa y no la de otra. `CompanyDetailPage.test.tsx` (E7): un Administrador de empresa sin roles de la organización ve los miembros, los roles y los filtros de su empresa.
- `PlatformLayout.test.tsx`, `administration.test.ts` y `Breadcrumbs.test.tsx` (E5): un solo panel de Plataforma abierto, su opción marcada y el camino de cada ficha. `routes.test.tsx` (E5): las nueve páginas lazy, soporte de rutas parciales, permiso de cada entrada y primera pantalla permitida al ingresar sin `platform.tenants.read`. `currentUsers.test.tsx`: los operadores no tienen perfiles, los permisos copian el catálogo y Node puede importar sus datos para las capturas.
- `usePermissions.test.ts` y `platform-contract.test.ts` (E5): `canPlatform` consume la lista requerida `effectivePermissions.platform`; Consumer/Business no reciben permisos de Plataforma.
- `PrivateLayoutFrame.test.tsx`, `MorePage.test.tsx` y `visible.test.ts` (E5): barra inferior de Plataforma por permiso y sección actual, Administración vuelve a Más, ruta canónica de Más, identidad y enlaces permitidos sin Perfiles ni WhatsApp. `SessionRecovery.test.tsx`: F5 en `/plataforma/cuentas` canjea la cookie con `access=platform` y conserva la ruta.
- `AccessRoute.test.tsx` (E3), `useSwitchAccess.test.tsx` (E3) y `AccessMenu.test.tsx` (E3): limpia la caché al cambiar; una persona sin organizaciones no ve «Ir a mi empresa» y en B2C nunca aparece «Registrá tu empresa».
- `routes-by-host.test.ts` (E7): un subdominio no monta rutas de `/org`.
- `publicSite.test.ts` (E7): issuer/puerto, slug válido y rechazos, URL pública y retorno seguro al principal; `usePublicSite.test.tsx` (E7): sólo el 404 público exacto es No disponible; `PublicPagePage.test.tsx` (E7) conserva su edición/vista previa al usar la función común.
- `authConfig.test.ts` (E7), `recoveryAccess.test.ts` (E7), `SessionRecovery.test.tsx` (E7) y `PublicPage.session.test.tsx` (E7): autoridad fija, retorno propio, recuperación Consumer, CTA oculta y menú/salida del sitio publicado; `LoginPage.test.tsx` (E7) y `SignupPage.test.tsx` (E7): Registro conserva la autorización original.
- `navigation.test.tsx` (E7) y `MorePage.personal.test.tsx` (E7): feature Personal en menú/barra, límite de cuatro y las demás accesibles en Más.
- `usePermissions.test.ts` (E7): `can` lee `effectivePermissions`; `canInCompany`, la empresa del mapa o, si no figura, la organización; los códigos son los del catálogo del back.
- `access.test.ts` (E7): el inicio, la puerta, la ruta y los estados de cada acceso; `access-paths.test.ts` (E7): ningún literal `"/org"` ni `"/login/empresa"` fuera de `tenancy/access.ts`; `useSignOut.test.tsx` (E7).

## Detalle
[frontend.md §3](../architecture/frontend.md#3-rutas) · back: `docs/architecture/multitenancy.md` y `docs/rules/modulos-habilitados.md`
