# Accesos, permisos y módulos

**Regla:** cada pantalla pertenece a **un acceso** (persona, empresa o plataforma) o al **sitio público**. El front **muestra u oculta**; el backend **decide**. Dentro del acceso B2B, cada ruta declara su permiso (y su módulo, si es de un módulo) una sola vez, en el manifiesto de su área, del que salen `routes.tsx` y el menú.

## Cómo se hace
- **Ruta por acceso:**
  - `<AccessRoute access="consumer">` para `/` con sesión, `/<módulo>` B2C;
  - `<AccessRoute access="business">` para `/org/…`;
  - `<AccessRoute access="platform">` para `/plataforma/…`;
  - las rutas públicas (`/` sin sesión, `/login…`, `/registro…`, `/recuperar`, `/invitacion`, `/auth/callback`, `/terminos`, `/privacidad` y las del subdominio) no llevan `AccessRoute`.
- **Manifiesto de rutas:** cada ruta del área se declara una vez en `layouts/navigation/<área>.ts` (`businessRoutes`): camino, permiso, módulo y, si va en el menú, rótulo e ícono. El menú (`businessNavigation`) usa esas mismas entradas y muestra cada una solo con su permiso y su módulo (`visibleNavigation`). `app/routes.tsx` le suma a cada una su pantalla con `lazyPage` y la guarda `<RequirePermission>`: sin el permiso, «No tenés permiso» dentro del marco; con el módulo apagado, `NotFoundPage`. La pantalla no repite la comprobación. Una ruta de una empresa (`:companyId`) puede declarar además `companyPermission`: también se abre con ese permiso en esa empresa (`canInCompany`), como `[HasCompanyPermission(…, organizationPermission: …)]` del back. La ficha de Empresa pide `companies.read` o `company.members.read` de esa empresa (B4).
- **Plataforma:** `platformRoutes` declara `platformPermission`, del catálogo de nueve códigos del back; `canPlatform` lee sólo `effectivePermissions.platform`. `platformPages` suma las pantallas disponibles: el constructor de rutas no monta las que todavía no existen. Si el operador no abre Organizaciones (el inicio `/plataforma`), el inicio lo lleva con `replace` a la primera pantalla disponible que pueda abrir, en el orden Gestión y luego Administración; sin ninguna, muestra `ForbiddenPage` dentro del marco. Mientras no hay páginas implementadas, el índice conserva sólo la guarda y el `Outlet` del marco: sin permiso para ninguna sección muestra `ForbiddenPage`, y con permiso no inventa contenido ni navega a rutas futuras.
- **Paneles de la compu:** `navigation.management` abre Gestión arriba y `navigation.administration`, Administración al pie. Se ve cada panel sólo si le queda alguna opción permitida, y se abre uno a la vez. Al entrar o recargar arranca abierto el de la ruta; `findNavigationPanelEntry` elige la opción más específica para que `/plataforma` no tape Cuentas. `breadcrumbRoot` identifica Plataforma cuando el inicio es una opción del panel: «Plataforma / Organizaciones / nombre». El operador no tiene Perfiles en el menú de cuenta: ve Plataforma, Mi cuenta y Salir.
- **Barra inferior del teléfono:** `navigation.bottomSections` referencia las mismas entradas del manifiesto y declara sólo sus íconos móviles; `visibleNavigation` aplica `canOpen` a cada una. En Plataforma muestra Organizaciones, Cuentas y Recuperaciones según su permiso, más «Más» siempre. Los detalles conservan la sección de su panel; Administración y Mi cuenta marcan Más. Sin `bottomSections`, Personal y Empresa conservan Inicio/Más. `navigation.moreTo` declara la ruta canónica de Más: `/plataforma/mas` se monta bajo `AccessRoute platform`, independiente de las páginas parciales T21–T23 y sin pedir un permiso de sección; `/mas` de un operador en teléfono redirige ahí con `replace`. Más muestra la identidad, Administración según permisos, Mi cuenta y Salir, sin Perfiles ni WhatsApp (fuera de E5). En la compu vuelve al inicio del acceso.
- **Host (E7):** con el subdominio de una organización (`<slug>.plataforma.com`; una página pública por organización, no por empresa), `routes.tsx` arma **solo** las rutas de `storefront` (y `/auth/callback`: el ingreso desde el subdominio vuelve a su propio origen). `usePublicSite()` devuelve el slug del subdominio y los datos públicos de esa organización (`GET /api/public-site`, `PublicSiteController` del back).
- **Dirección pública visible (E5):** `tenancy/publicSite.ts` comparte `publicSiteHost(slug)` y el sufijo que muestra Página pública, sin modificar su URL real de desarrollo. E7 completa el dominio desde el issuer junto con las rutas del sitio público.
- **Acción:** `const { can, canInCompany } = usePermissions()`. `can("roles.manage")` lee `effectivePermissions.organization` de `/api/me`. En una empresa del grupo, `canInCompany(companyId, "company.members.manage")` lee la lista de esa empresa en `effectivePermissions.companies` (el back la llena desde B4); si la empresa no figura, la de la organización. Los códigos son una unión tipada (`OrganizationPermission` y `CompanyPermission`), copia del catálogo del back.
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

## Lo verifica
- `routes.test.tsx` (E3): cada ruta del manifiesto pide su permiso; `visible.test.ts` (E7): el menú son rutas del manifiesto y cada enlace se ve solo con su permiso y su módulo; `RequirePermission.test.tsx` (E7): sin el permiso, «No tenés permiso»; con el módulo apagado, la ruta no existe; con el permiso de empresa como alternativa, abre la ficha de su empresa y no la de otra. `CompanyDetailPage.test.tsx` (E7): un Administrador de empresa sin roles de la organización ve los miembros, los roles y los filtros de su empresa.
- `PlatformLayout.test.tsx`, `administration.test.ts` y `Breadcrumbs.test.tsx` (E5): un solo panel de Plataforma abierto, su opción marcada y el camino de cada ficha. `routes.test.tsx` (E5): rutas parciales, permiso de cada entrada y primera pantalla permitida al ingresar sin `platform.tenants.read`. `currentUsers.test.tsx`: los operadores no tienen perfiles, los permisos copian el catálogo y Node puede importar sus datos para las capturas.
- `PrivateLayoutFrame.test.tsx`, `MorePage.test.tsx` y `visible.test.ts` (E5): barra inferior de Plataforma por permiso y sección actual, Administración vuelve a Más, ruta canónica de Más, identidad y enlaces permitidos sin Perfiles ni WhatsApp. `SessionRecovery.test.tsx`: F5 en `/plataforma/cuentas` canjea la cookie con `access=platform` y conserva la ruta.
- `AccessRoute.test.tsx` (E3), `useSwitchAccess.test.tsx` (E3) y `AccessMenu.test.tsx` (E3): limpia la caché al cambiar; una persona sin organizaciones no ve «Ir a mi empresa» y en B2C nunca aparece «Registrá tu empresa».
- `routes-by-host.test.ts` (E7): un subdominio no monta rutas de `/org`.
- `publicSite.test.ts` (E5): el host visible y el sufijo público compartido conservan lo que mostraba Página pública; `PublicPagePage.test.tsx` (E7) conserva sus recorridos al usar la función común.
- `usePermissions.test.ts` (E7): `can` lee `effectivePermissions`; `canInCompany`, la empresa del mapa o, si no figura, la organización; los códigos son los del catálogo del back.
- `access.test.ts` (E7): el inicio, la puerta, la ruta y los estados de cada acceso; `access-paths.test.ts` (E7): ningún literal `"/org"` ni `"/login/empresa"` fuera de `tenancy/access.ts`; `useSignOut.test.tsx` (E7).

## Detalle
[frontend.md §3](../architecture/frontend.md#3-rutas) · back: `docs/architecture/multitenancy.md` y `docs/rules/modulos-habilitados.md`
