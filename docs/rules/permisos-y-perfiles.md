# Permisos y perfiles

**Regla:** el front **muestra u oculta**; el backend **decide**. Cada ruta pertenece a un área (personal, business o platform) y declara su permiso en dos lugares: `routes.tsx` y la navegación.

## Cómo se hace
- **Ruta:** `<AreaRoute area="business"><ProtectedRoute permission="roles.read" /></AreaRoute>` en `app/routes.tsx`, y el mismo `permission` en `layouts/navigation/business.ts`.
- **Acción:** `<Can permission="roles.manage">…</Can>`. Una acción de empresa usa `<CanInCompany companyId={id} permission="company.members.manage">`.
- **Perfil activo:** `useActiveProfile()` (tipo y nombre). Para cambiarlo, `useSwitchProfile(id)`, que hace `signinSilent({ tenant })`, luego `queryClient.clear()` y navega al inicio del área.
- La cuenta (`/cuenta`) es de la identidad y se ve desde cualquier perfil.
- El `companyId` sale de la URL (`useCompanyParam`); nunca hay una "empresa activa" guardada.

## Prohibido
- Preguntar por roles (`user.roles.includes("TenantAdmin")`).
- Una ruta sin `AreaRoute`.
- Un permiso declarado en un solo lugar.
- Cambiar de perfil sin limpiar la caché.
- Guardar el perfil en localStorage (lo sabe el token).

## Copiá de
- `src/app/routes.tsx` y `src/layouts/navigation/business.ts` (E3–E4)

## Lo verifica
- `routes.test.ts` y `navigation.test.ts`: el mismo permiso en los dos lugares.
- `AreaRoute.test.tsx`, `useSwitchProfile.test.ts`.

## Detalle
[frontend.md §3](../architecture/frontend.md#3-rutas) · back: `docs/architecture/multitenancy.md`
