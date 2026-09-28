# Accesos, permisos y módulos

**Regla:** cada pantalla pertenece a **un acceso** (persona, empresa o plataforma) o al **sitio público**. El front **muestra u oculta**; el backend **decide**. Dentro del acceso B2B, cada ruta y cada enlace declaran su permiso (y su módulo, si es de un módulo) en `routes.tsx` y en la navegación.

## Cómo se hace
- **Ruta por acceso:**
  - `<AccessRoute access="consumer">` para `/` con sesión, `/<módulo>` B2C;
  - `<AccessRoute access="business"><ProtectedRoute permission="roles.read" /></AccessRoute>` para `/org/…`;
  - `<AccessRoute access="platform">` para `/plataforma/…`;
  - las rutas públicas (`/` sin sesión, `/login…`, `/registro…`, `/recuperar`, `/invitacion`, `/auth/callback`, `/terminos`, `/privacidad` y las del subdominio) no llevan `AccessRoute`.
- **Host:** con el subdominio de una organización (`<slug>.plataforma.com`; una página pública por organización, no por empresa), `routes.tsx` arma **solo** las rutas de `storefront`. `usePublicSite()` devuelve el slug del subdominio y los datos públicos de esa organización.
- **Acción:** `<Can permission="roles.manage">…</Can>`. En una empresa del grupo: `<CanInCompany companyId={id} permission="company.members.manage">`.
- **Acceso activo:** `useAccess()` devuelve `access`, la organización activa (en B2B), si la persona tiene espacio personal y sus organizaciones.
- **Cambiar de acceso u organización:** `useSwitchAccess({ access, tenantId })`:
  1. pantalla «Cambiando a …»;
  2. `signinSilent({ extraQueryParams: { access, tenant } })`;
  3. `queryClient.clear()`;
  4. el inicio del acceso nuevo.
- **Módulos habilitados:** `GET /api/me` trae `features` del acceso activo.
  - `useFeature("x")` y `<Feature name="x">` muestran u ocultan.
  - Las rutas y los enlaces de un módulo declaran `feature` además de `permission`. Apagado, el enlace no aparece y la ruta muestra `NotFoundPage`, como el 404 del back.
- **Términos nuevos:** si una respuesta trae `Legal.AcceptanceRequired`, se muestra la pantalla de aceptación, que bloquea.
- **La cuenta** (`/cuenta`) es de la identidad y se ve desde los dos accesos.
- El `companyId` sale de la URL (`useCompanyParam`); nunca hay una "empresa activa" guardada.

## Prohibido
- Mostrar "crear una empresa" en el acceso B2C, o mostrar organizaciones en el espacio personal.
- Usar el subdominio para mostrar algo de la administración de la organización (esa vive en `/org`).
- Preguntar por roles (`user.roles.includes("TenantAdmin")`).
- Una ruta privada sin `AccessRoute`, o un permiso declarado en un solo lugar.
- Cambiar de acceso sin limpiar la caché.
- Guardar el acceso o la organización en localStorage: lo sabe el token.

## Copiá de
- `src/app/routes.tsx` y `src/layouts/navigation/business.ts` (E3–E4) · `src/tenancy/useSwitchAccess.ts` (E3).

## Lo verifica
- `routes.test.tsx` y `navigation.test.ts`: el mismo permiso y el mismo módulo en los dos lugares.
- `AccessRoute.test.tsx`, `useSwitchAccess.test.ts` (limpia la caché), `AccessMenu.test.tsx` (una persona sin organizaciones no ve «Ir a mi empresa»; en B2C nunca aparece «Registrá tu empresa»).
- `routes-by-host.test.ts`: un subdominio no monta rutas de `/org`.

## Detalle
[frontend.md §3](../architecture/frontend.md#3-rutas) · back: `docs/architecture/multitenancy.md` y `docs/rules/modulos-habilitados.md`
