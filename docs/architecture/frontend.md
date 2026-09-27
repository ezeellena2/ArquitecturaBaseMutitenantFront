# Arquitectura del front

> Documento canónico del SPA. Copia las convenciones de `../ArquitecturaBaseFront` (su `CLAUDE.md` y `docs/design/visual-baseline.md`) y les suma tres áreas en una sola app: **personal (B2C)**, **organización (B2B)** y **plataforma**. Suma también el selector de perfil, las empresas, los tipos generados desde OpenAPI y **una sola forma de mostrar los datos** ([`formatos.md`](formatos.md)). El backend está en `../ArquitecturaBaseMutitenant` (`docs/architecture/backend.md`); el árbol completo, archivo por archivo, está en [`arbol.md`](arbol.md).

## 1. Stack

Mismo stack y mismas versiones que ArquitecturaBaseFront. **El `node_modules` viejo** (react-router-dom 7, vite 6, eslint) **se descarta**.

| Tema | Elección |
|---|---|
| Base | React 19 + Vite 8 + TypeScript 6 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`) |
| Router | `react-router` 8, `createBrowserRouter` y `lazy` por página |
| Datos | `@tanstack/react-query` 5. Sin Redux ni Zustand: el estado del servidor va en Query y el de la UI en la URL y en `useState` |
| Auth | `oidc-client-ts` + `react-oidc-context`, Authorization Code + PKCE, tokens solo en memoria |
| Formularios | `react-hook-form` + `zod` en los formularios con reglas; `useState` con un draft en los diálogos simples |
| UI | shadcn/ui (new-york) + `radix-ui` + Tailwind 4 (CSS-first, tokens en `index.css`), `sonner`, Inter Variable |
| i18n | `i18next` + `react-i18next` + `i18next-resources-to-backend`, un namespace por módulo |
| Formatos | `shared/format`: `Intl` con perfiles fijos por cultura, más `libphonenumber-js`. Sin librería de fechas |
| Contratos | `openapi-typescript` genera `src/shared/api/generated/schema.d.ts` desde `../ArquitecturaBaseMutitenant/docs/contracts/openapi.json` |
| Tests | Vitest 5 + jsdom + Testing Library + user-event + MSW 2 |
| Lint | `oxlint` (sin ESLint ni Prettier) |

## 2. Estructura

```
src/
├─ app/          providers · router · routes (públicas + personal + business + platform)
├─ auth/         AuthProvider · authConfig · SessionRecovery · ProtectedRoute · AreaRoute · useCurrentUser · usePermissions · Can
├─ tenancy/      useActiveProfile · useProfiles · useSwitchProfile · ProfileSwitcher · useCompanyParam
├─ layouts/      PersonalLayout · BusinessLayout · PlatformLayout · AuthLayout · navigation/ · components/
├─ areas/        una feature no importa de otra, ni un área de otra; lo común sube a shared/
│  ├─ public/    auth (ingreso, registro, invitación) · errors
│  ├─ personal/  home · account (la identidad, vale para todos los perfiles) · organizations · + módulos B2C del producto
│  ├─ business/  home · roles (REFERENCIA) · users · companies · settings · audit · + módulos B2B del producto
│  └─ platform/  home · tenants · accounts · operators · audit · settings · whatsapp
├─ locales/      {es,en}/<namespace>.json + parity.test.ts
├─ shared/
│  ├─ api/       httpClient · ApiError · queryClient · formErrors · generated/ (no se edita)
│  ├─ format/    ÚNICO lugar que formatea fechas, números, moneda, porcentajes, teléfonos (formatos.md)
│  ├─ time/      useEffectiveTimeZone · TimeZoneSelect
│  ├─ i18n/ · hooks/ · lib/
│  └─ ui/        shadcn + propios + format/ (DateText, MoneyText…) + fields/ (DateField, MoneyField…)
└─ test/         setup · mocks · utils
```

## 3. Rutas

Van en español. El permiso de cada una se declara en `routes.tsx` y en `layouts/navigation/*.ts`.

| Ruta | Pantalla | Área y permiso |
|---|---|---|
| `/login`, `/login/codigo`, `/login/enlace`, `/registro`, `/auth/callback`, `/invitacion` | ingreso, registro B2C e invitación | público |
| `/`, `/cuenta`, `/mis-organizaciones` + las rutas B2C del producto | área personal | perfil personal |
| `/org`, `/org/usuarios(/:id)`, `/org/roles(/nuevo, /:id)`, `/org/empresas(/:companyId)`, `/org/configuracion`, `/org/auditoria` + las rutas B2B del producto | área de la organización | perfil business + el permiso de cada pantalla |
| `/plataforma/...` | backoffice | `account_kind=platform` + `platform.*` |

- **Área según el perfil:** `useActiveProfile` lee `accountKind` y `activeProfile.kind` de `/api/me`. `/` lleva al inicio de cada área: personal → `/`, business → `/org`, operador → `/plataforma`. `AreaRoute` redirige al inicio del área correcta cuando se entra con otro perfil, por ejemplo desde un enlace viejo.
- **Selector de perfil** (en `UserMenu`): lista "Personal" y las organizaciones. Al elegir:
  1. `signinSilent({ extraQueryParams: { tenant: id } })`;
  2. `queryClient.clear()`, **obligatorio**, para que no queden datos del perfil anterior;
  3. navega al inicio del área nueva.
- **La cuenta** (`/cuenta`: email, teléfono, cultura, zona, métodos de ingreso) es de la identidad y vale para todos los perfiles; también se llega desde el `UserMenu` de una organización.
- **Empresas:** el `companyId` sale de la URL (`useCompanyParam`) y `CanInCompany` evalúa `permissions.companies[companyId]`. No hay una "empresa activa" global.
- **Perfil suspendido:** el `code` `Tenancy.Tenant.Suspended` muestra `ProfileSuspendedPage`, con el selector para pasar a otro perfil.

## 4. Convenciones

### Datos y API
- Todo pasa por `shared/api/httpClient`: `fetch`, rutas relativas, `Authorization: Bearer`, `Accept-Language` con la **cultura efectiva** (`es-AR`), una sola renovación silenciosa ante un 401 y reintento.
- Los tipos **salen de `generated/`**. El `api/*.ts` de cada feature exporta query keys (`usersQueryKeyRoot`, `usersQueryKey(q)`, `userQueryKey(id)`) y funciones (`fetchUsers`, `createUser`) tipadas con el schema.
- `useQuery` y `useMutation` se usan directo en las páginas, con `placeholderData: keepPreviousData` en los listados. Nada de `useEffect` con fetch. Una mutación invalida la raíz de su feature.
- `npm run contracts` regenera los tipos, y el CI falla si difieren del contrato.

### Presentación de datos
- **Todo dato se muestra con los componentes de `shared/ui/format` y se carga con los de `shared/ui/fields`.** El catálogo, los perfiles por cultura y las reglas están en [`formatos.md`](formatos.md).
- Las columnas de `DataTable` declaran el `type` (`date`, `dateTime`, `money`, `decimal`, `percent`, `enum`, `status`…), y la tabla resuelve el formato, la alineación y el vacío.
- Está prohibido formatear fuera de `shared/format` (`toLocaleString`, `toFixed`, `Intl.`); lo verifica `format-usage.test.ts`.

### Paginado, orden y búsqueda
El contrato está en `backend.md` §9, "Paginado, orden y búsqueda". Del lado del front:
- **Por páginas:** `usePagination` guarda `page`, `pageSize`, `sort` y `search` **en la URL**, y `useFilters(keys)` hace lo mismo con los filtros. Los dos escriben con `useQueryUpdate`: una escritura por tick y `replace: true`.
- **Qué vuelve a la página 1:** cambiar la búsqueda, un filtro, el orden o el tamaño de página. La búsqueda se aplica con 300 ms de debounce.
- **Página fuera de rango:** si llegan `items` vacíos con `totalCount > 0`, la página salta sola a la última, con `replace`, sin dejar una entrada en el historial.
- **`Pagination`:** muestra "1–10 de 1.234" y "Página 1 de 124", siempre con `useFormat`, y tiene un selector de 10, 20, 50 o 100 por página (**10 por defecto**; si la URL no trae `pageSize`, no se escribe).
- **`DataTable`:** una columna es ordenable si declara `sortable`. Su `id` es el campo del contrato. El encabezado lleva `aria-sort` y alterna ascendente → descendente → orden por defecto.
- **Por cursor** (auditoría y actividad): `useCursorList` sobre `useInfiniteQuery`, con el botón "Cargar más" (`LoadMore`), sin total ni número de página. Los filtros viven en la URL; el cursor no.
- Los listados usan `placeholderData: keepPreviousData`: mientras llega la página nueva, la tabla muestra la anterior atenuada y con `aria-busy`.

### Errores
- `ApiError` expone `code`, `detail`, `traceId`, `errors` y `retryAfterSeconds`. **Se decide por `code`, nunca por el texto.**
- Global (`queryClient`): un error de red da un toast con "Reintentar"; un 5xx, un toast con el `traceId`; el resto muestra el `detail`, que ya viene traducido. Se saltean los 401/403 y las queries con `meta.silent`.
- Por feature, `errors.ts` hace `switch (error.code)`. `applyApiErrorToForm` lleva los `errors` a los campos; lo que no encaja va en `<FormError>`.
- Un 403 renderiza `ForbiddenPage`, y un 404 en una ficha, `NotFoundPage`. Un id de otro perfil también da 404.

### Auth
- `authConfig`: `client_id: "web"`, `response_type: "code"`, `scope: "openid profile email offline_access api"`, `userStore: InMemoryWebStorage`, `automaticSilentRenew: false`, `silent_redirect_uri: /silent-renew.html`.
- `SessionRecovery` hace `signinSilent()` después de un F5. El logout es `signoutRedirect()` con `beginSignOut`.
- Los permisos del front son **solo experiencia de uso**; el backend decide.

### Idioma y cultura
- La cultura (`es-AR` por defecto, o `en-US`) define el idioma (`es`) y el formato. Un namespace por módulo; `common` para lo compartido; `enums` para los valores de enums y estados. `parity.test.ts` exige las mismas claves en los dos idiomas.
- Español rioplatense con voseo. **"Tenant" nunca en pantalla**: se dice "Organización". `TenantAdmin` es "Administrador general" y `CompanyAdmin`, "Administrador".
- La cultura se guarda en la cuenta (`PUT /api/me`) y gana sobre la de localStorage (`arquitecturabasemt.culture`).

### Fechas y zona
- Los DTO traen `…AtUtc` en ISO con `Z`; las fechas civiles, `yyyy-MM-dd`.
- `useEffectiveTimeZone(companyId?)` devuelve la zona de la cuenta; si no hay, la de la empresa; si no, la de la organización o el perfil. Las fechas civiles no se convierten.

### UI y pantallas
Rigen las reglas de `visual-baseline.md` y las del usuario:
- **Toda pantalla nueva se dibuja primero** en el lienzo del sistema visual, con las piezas de "Gestión de usuarios", y se programa después de que el usuario la elige.
- Toda pantalla usa `Page`: una banda de 56 px con título, acciones y `backTo`.
- Listados: `FilterBar` + `DataTable` + `Pagination`, con el estado en la URL.
- Ficha propia a ancho completo. **Pestañas solo con dos o más tablas grandes**, dentro de la cabecera.
- Lo corto se edita en un **diálogo** y lo largo en una **pantalla propia** con `useUnsavedChangesGuard`. Nunca un diálogo sobre otro, una tabla dentro de un diálogo, un panel desplegable ni una fila que se expande.
- El control más simple para cada dato. Ningún texto que nadie pidió.
- Colores solo con tokens. Componentes propios en PascalCase; los de shadcn se generan con `npx shadcn@4.21.0 add`.
- No se definen componentes dentro de otros. El estado derivado se calcula en el render, y en JSX va ternario en lugar de `&&`.

### Tests
- Colocalizados. MSW con `onUnhandledRequest: "error"` y fixtures de `/api/me` para perfil personal, organización (con y sin permisos) y operador.
- Por pantalla se prueba:
  - carga, vacío, sin coincidencias, error con reintento y sin permiso;
  - el recorrido de los diálogos;
  - el `code` de cada error traducido;
  - **el formato de sus datos en es-AR y en en-US**.
- No se da nada por terminado sin `npm run build`, `npm run lint` y `npm test` limpios.
