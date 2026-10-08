# Arquitectura del front

> Documento canónico del SPA. Copia las convenciones de `../ArquitecturaBaseFront` (su `CLAUDE.md`; de `../ArquitecturaBaseFront/docs/design/visual-baseline.md`, solo las migas: los colores remiten a [tema.md](tema.md)) y les suma, en una sola app, el modelo de accesos de `../ArquitecturaBaseMutitenant/docs/architecture/multitenancy.md`:
- **una cuenta con dos accesos que no se mezclan**: como persona (B2C) y como empresa (B2B);
- el **sitio de la plataforma** y la **página pública de cada organización en su subdominio**;
- el **backoffice** de la plataforma.

Suma también las empresas, los tipos generados desde OpenAPI y **una sola forma de mostrar los datos** ([`formatos.md`](formatos.md)). El backend está en `../ArquitecturaBaseMutitenant` (`docs/architecture/backend.md`); el árbol completo, archivo por archivo, está en [`arbol.md`](arbol.md). El diseño de cada pantalla está en el [lienzo vigente](../design/lienzo/README.md): mandan los ocho tableros «Criterio» y, para cada pantalla, solo su tablero validado, sobre cualquier descripción textual. Los colores, la forma y el menú lateral están en el [tema](tema.md), y la sección «UI y pantallas» resume sus reglas.

## 1. Stack

Mismo stack y mismas versiones que ArquitecturaBaseFront. **El `node_modules` viejo** (react-router-dom 7, vite 6, eslint) **se descarta**.

| Tema | Elección |
|---|---|
| Base | React 19 + Vite 8 + TypeScript 6 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`) |
| Router | `react-router` 8, `createBrowserRouter` y `lazy` por página |
| Datos | `@tanstack/react-query` 5. Sin Redux ni Zustand: el estado del servidor va en Query y el de la UI en la URL y en `useState` |
| Auth | `oidc-client-ts` + `react-oidc-context`, Authorization Code + PKCE, tokens solo en memoria |
| Formularios | `react-hook-form` + `zod` en todo formulario, en una pantalla o en un diálogo ([formularios](../rules/formularios.md)) |
| UI | shadcn/ui (new-york) + `radix-ui` + Tailwind 4 (CSS-first, los tokens de [tema.md](tema.md) en `index.css`; las variables de shadcn, solo como alias), `sonner`, Inter Variable |
| i18n | `i18next` + `react-i18next` + `i18next-resources-to-backend`, un namespace por módulo |
| Formatos | `shared/format`: `Intl` con patrones de `Cultures` (`GET /api/reference-data`), más `libphonenumber-js`. Sin perfiles fijos en código ni librería de fechas |
| Contratos | `openapi-typescript` genera `src/shared/api/generated/schema.d.ts` desde `../ArquitecturaBaseMutitenant/docs/contracts/openapi.json` |
| Tests | Vitest 5 + jsdom + Testing Library + user-event + MSW 2 |
| Lint | `oxlint` (sin ESLint ni Prettier) |

## 2. Estructura

```
src/
├─ app/          providers · router (routesForHost) · routes (compatibilidad del dominio principal) · RequirePermission · RouteViews
├─ auth/         AuthProvider · authConfig · SessionRecovery · ProtectedRoute · AccessRoute · LegalAcceptanceGate · useCurrentUser · usePermissions (can, canInCompany, hasFeature) · useSignOut
├─ tenancy/      access.ts (inicio, puerta, organización activa y estados de cada acceso) · publicSite (host y URLs desde issuer) · useAccess · useSwitchAccess · AccessMenu · PublicAccessMenu · useProfiles · usePublicSite (HTTP/key únicos del subdominio)
├─ layouts/      AppShell · PrivateLayoutFrame (el marco de los tres accesos: Sidebar + Topbar en la compu, la app en el teléfono) con PersonalLayout · BusinessLayout · PlatformLayout · AccountLayout (/cuenta y /mas, en el marco del acceso) · MorePage · SiteLayout (sitio y páginas públicas) · AuthLayout · navigation/ (el manifiesto de rutas y el menú de cada área) · components/
├─ areas/        una feature no importa de otra, ni un área de otra; lo común sube a shared/
│  ├─ public/    auth (ingresar como persona o como empresa, registro de personas, «Registrá tu empresa», invitación) · site (portada y directorio de la plataforma) · legal (términos, privacidad y la aceptación bloqueante de una versión nueva) · errors
│  ├─ storefront/ site/{pages,api,components} según necesidad: página pública de una organización en su subdominio; lo publicado por un módulo real va en su propia feature
│  ├─ personal/  (acceso B2C) home · account (la cuenta, vale en los tres accesos) · módulos B2C reales según la receta Personal
│  ├─ business/  (acceso B2B) home · roles (REFERENCIA) · users · companies · settings · audit · public-page (mi página pública) · + módulos B2B del producto
│  └─ platform/  tenants (/plataforma) · accounts (personas y operadores) · recoveries · legal · audit · settings
├─ locales/      {es,en}/<namespace>.json + parity.test.ts
├─ shared/
│  ├─ api/       httpClient · ApiError · queryClient · errorMessage · formErrors · useIdempotentMutation · types.ts (alias) · generated/schema.d.ts (no se edita)
│  ├─ account/   lo de la cuenta que usan varias áreas: agregar y cambiar un método de ingreso, el aviso de método propio
│  ├─ format/    ÚNICO lugar que formatea fechas, números, moneda, porcentajes, teléfonos (formatos.md)
│  ├─ referenceData/ GET /api/reference-data, catálogos compartidos y patrones de cultura
│  ├─ time/      useEffectiveTimeZone · zona del navegador
│  ├─ phone/     interpretación telefónica y banderas SVG
│  ├─ i18n/ · hooks/ (usePagedQuery, useEditPage…) · lib/
│  └─ ui/        shadcn + propios + format/ (DateText, MoneyText…) + fields/ (campos y selectores de referencia) + app/ (el marco de app del teléfono)
└─ test/         setup · mocks · utils
```

## 3. Rutas

Van en español. Cada ruta de un área se declara una vez en su manifiesto (`layouts/navigation/<área>.ts`: camino, permiso, módulo y, si va en el menú, rótulo e ícono), del que salen `routes.tsx` (con `RequirePermission` y `lazyPage`) y el menú.

**Dominio principal** (`plataforma.com`):

| Ruta | Pantalla | Quién |
|---|---|---|
| `/` | sin sesión: la portada de la plataforma (tablero Landing), con «Para empresas», las entradas a «Registrá tu empresa» y la sección «Empresas en ArquitecturaBase»: buscador, tres empresas publicadas y «Ver todas las empresas», que lleva a `/empresas`; «Empresas», arriba, baja a esa sección. Con sesión de persona: su inicio personal | cualquiera |
| `/empresas` | el directorio de organizaciones publicadas (Directorio/M-Directorio): tarjetas, búsqueda en URL y paginado web también en teléfono; cada tarjeta lleva al URL público real en la misma pestaña | cualquiera |
| `/login`, `/registro`, `/recuperar` | ingresar **como persona**, crear una cuenta y «Recuperar mi cuenta» | público |
| `/login/empresa`, `/registro/empresa` | ingresar **como empresa** y **«Registrá tu empresa»** | público |
| `/invitacion`, `/auth/callback`, `/login/enlace` | aceptar una invitación, volver del servidor de ingreso, enlace del bot (Etapa 8) | público |
| `/terminos`, `/privacidad` | «Términos y condiciones» y «Política de privacidad» vigentes (la versión publicada, en el idioma de la persona o, sin sesión, en el de la pantalla) | público |
| `/` (con sesión), `/cuenta` + las rutas B2C del producto (`/<módulo>`) | **acceso B2C**: el lado Personal | `access=consumer` (`/cuenta`, también `business` y `platform`) |
| `/org`, `/org/usuarios(/:id)`, `/org/roles(/nuevo, /:id)`, `/org/empresas(/:companyId)`, `/org/configuracion`, `/org/auditoria`, `/org/pagina` + las rutas B2B del producto | **acceso B2B**: la organización | `access=business` + el permiso de cada pantalla |
| `/plataforma` (Organizaciones, el inicio), `/plataforma/organizaciones/:id`, `/plataforma/cuentas(/:id)` (cuentas y operadores), `/plataforma/recuperaciones`, `/plataforma/legales`, `/plataforma/auditoria`, `/plataforma/configuracion` | backoffice | `access=platform` + `platform.*` |

**Subdominio de una organización** (`<slug>.plataforma.com`):

| Ruta | Pantalla | Quién |
|---|---|---|
| `/` | página pública de la organización | cualquiera (lo publicado) |
| `/<módulo>` | lo que publiquen los módulos del producto, y lo que una persona pide o contrata | cualquiera; para interactuar, `access=consumer` |
| `/auth/callback` | volver del servidor de ingreso: el canje del código va al propio origen | público |

- **Árbol de rutas por host:** `router.tsx` usa `routesForHost(location.host)`; `routes` conserva el árbol principal exportado para los tests existentes. `siteOfHost` deriva el dominio y el puerto del issuer: acepta sólo el principal o exactamente un slug ASCII válido (un carácter o de 3 a 63 caracteres; dos no), sin IP, niveles extra ni puerto distinto. Un host desconocido, una ruta no montada del subdominio o un sitio no disponible muestran la misma frontera No disponible; el principal conserva su NotFoundRoute. En el subdominio válido sólo se montan `/`, `/auth/callback` y esa frontera; nunca `/org`, `/cuenta` ni `/plataforma`. El host resuelve lo publicado y nunca el tenant privado.
- **Área según el acceso:** `useAccess` lee `access` de `/api/me`. Después de ingresar se va al inicio del acceso: persona → `/`, empresa → `/org`, operador → `/plataforma` (`homeOf` en `tenancy/access.ts`, el único lugar con esas rutas y las puertas de ingreso). `AccessRoute` manda al inicio correcto si se entra a una ruta de otro acceso (por ejemplo, un enlace viejo).
- **Ingresar desde un subdominio:** sin sesión, «Ingresá para continuar» llama `signinRedirect` con `access=consumer` y `state.returnTo` de la ruta actual, incluida query y hash. `redirect_uri` es `/auth/callback` del origen propio. Ingreso → «Creá una»/«Crear mi cuenta» → Registro conserva el `returnUrl` validado de la autorización original; al completar correo o Google se continúa esa misma autorización, con su state, PKCE y callback. Con sesión se oculta la CTA. No se crea Personal por recuperación silenciosa. El SPA y la Api se sirven desde el mismo origen por host, sin CORS; la autoridad sigue fija (ver Auth).
- **Marco y datos públicos:** `SiteLayout` comparte encabezado/pie para Landing, Directorio y Storefront. La portada consulta `api/directory.ts` (página 1, tamaño 10), muestra tres tarjetas y envía Enter a `/empresas?search=…`; sin empresas conserva el buscador y oculta Ver todas. `CompanyCard` comparte logo/inicial, nombre, descripción y `publicSiteHost`/`publicSiteUrl`. El directorio usa `usePagedQuery` con búsqueda de 300 ms, página/tamaño en URL, sin filtros extra y tamaño inicial 10. `usePublicSite` mantiene una sola función HTTP y key por host con alias generado: sólo 404 `PublicSite.PublicPage.NotFound` devuelve No disponible; los demás errores usan `apiErrorMessage` y Reintentar, conservando los datos públicos ya cargados.
- **Tu cuenta en el sitio publicado:** `PublicAccessMenu` reutiliza `AccessMenu`, `useProfiles`, `useSwitchAccess` y `useSignOut`. En computadora es el menú existente; en teléfono, la hoja de M-Pagina-Publica. Mi cuenta va al principal `/cuenta`; elegir una organización cambia al token Business de esa organización, limpia Query y va al principal `/org`. Salir cierra la sesión pública y vuelve a `/` del propio origen; la sesión de Plataforma permanece independiente (ADR 0044). Las URLs salen de `tenancy/publicSite`, sin dominios armados en la UI.
- **Módulos Personal:** la [receta del front](../rules/personal.md) enlaza [Personal del back](../../../ArquitecturaBaseMutitenant/docs/features/personal.md). Una entrada con `feature` suma el módulo real al menú y barra móvil usando `visibleNavigation`; hasta cuatro secciones y Más, donde siguen todos los módulos visibles. No hay pantallas de negocio de prueba. El backend decide 401 sin sesión, 403 por acceso equivocado, 404 de datos ajenos/gates, autorización de partes y retención de la copia compartida.
- **Inicio de cada área** (`/` con sesión de persona, `/org`): lo demás depende de cada producto, sin resúmenes de relleno. El personal (Inicio-Personal) muestra solo el aviso de método propio cuando corresponde. El de la organización (ADR 0040) muestra lo que la API decide para cada persona: con permisos de la organización, las tarjetas de sus áreas (Inicio-Org); si no, «Tus empresas» (Inicio-Miembro). Debajo va «Para resolver», con solo estados que ya existen, que quien mira puede resolver y que tienen una acción: se calcula, no se guarda, y se va solo cuando se resuelve (R18 de «Criterio · Tablas», lienzo v93). En el teléfono, ese inicio es la billetera (M-Inicio-Org y M-Inicio-Miembro).
- **Menú lateral:** el mismo armazón en las tres áreas; cambian los enlaces.
  - Persona: Inicio y Mi cuenta, más los módulos B2C del producto. **No muestra organizaciones.**
  - Empresa: arriba, Inicio y los módulos B2B del producto. **Abajo de todo, «Administración»**, que abre un **segundo panel al lado del menú** (`AdminPanel`, se cierra con «‹» o tocando de nuevo «Administración»; abierto en cualquier ruta de administración) con el desplegable «Gestión de usuarios» (Usuarios, Roles y permisos; abierto solo en sus pantallas, lienzo v102), Empresas, Configuración, Página pública y Auditoría. En el teléfono no hay menú lateral: la Administración está en «Más», abajo (§4, «Teléfono»).
  - Plataforma: Organizaciones (es el inicio, `/plataforma`), Cuentas (personas y operadores), Recuperaciones, Auditoría, Documentos legales y Configuración.
  - Cada enlace se muestra solo con su permiso (y su módulo, si es de un módulo).
- **Menú de la cuenta** (`AccessMenu`, arriba a la derecha; en el teléfono, la pantalla «Más»): el botón muestra el nombre de la persona y dónde está ("Personal" o el nombre de la organización). El menú tiene:
  - la cabecera, con el nombre y el correo;
  - la lista «Perfiles», igual en los dos accesos: Personal («Tu perfil personal») y cada organización de la que es miembro, con su rol y su estado, y un ✓ en la activa (las suspendidas, deshabilitadas). Elegir una cambia de acceso o de organización;
  - «Mi cuenta» y «Salir».

  **Al cambiar de acceso o de organización:**
  1. pantalla completa «Cambiando a …»;
  2. `signinSilent({ forceIframeAuth: true, extraQueryParams: { access, tenant } })` para que la autorización use los parámetros nuevos;
  3. `queryClient.clear()`, **obligatorio**;
  4. el inicio del acceso nuevo.
- **La cuenta** (`/cuenta`: nombre y apellido separados, idioma y región, zona y **métodos de ingreso**, con el aviso de método propio) es de la identidad y conserva el marco Personal, Empresa o Plataforma del acceso actual. Desde el subdominio, Mi cuenta abre el dominio principal. Nombre y apellido son opcionales; el nombre mostrado lo compone el backend (ADR 0046), sin concatenaciones nuevas en las pantallas.
- **Aviso de método propio** (`multitenancy.md` §3.1 del back): pide agregar un método propio verificado para no perder la cuenta al dejar la empresa. En E3 ofrece correo; WhatsApp se muestra si `GET /api/auth/methods` trae el canal desde E8. Aparece mientras todos los métodos los administra una organización o solo existe el correo de la invitación, al aceptar esa invitación, en `/cuenta` y en el inicio personal (`PersonalLoginMethodNotice`, en `shared/account`). Se va solo cuando se verifica un método propio.
- **Métodos de ingreso** (en `/cuenta`; diseño en `multitenancy.md` §3.1 del back): en la Etapa 3 se gestionan correo y Google; `Phone` es solo modelo. Sumar y verificar un teléfono se habilita cuando el módulo WhatsApp registra su canal (Etapa 8); la opción aparece si `GET /api/auth/methods` trae ese canal. Sumar un método pide verificarlo con un código que llega a ese dato. La sesión iniciada autoriza quitar un método, desvincular Google o elegir principal mediante el diálogo de confirmación, sin código adicional (ADR 0045). Vincular Google inicia OAuth directamente. Siempre tiene que quedar al menos un método propio o activo, y todo cambio se avisa en todos los métodos.
- **Baja de la cuenta** (en `/cuenta`, sección Privacidad; diseño en `multitenancy.md` §3.2 del back): diálogo con motivo y confirmación desde la sesión iniciada, sin código adicional, la sugerencia de exportar antes, los errores de la política (único Dueño, operador, bloqueos de módulos) y, al confirmar, sesión cerrada con "Tu cuenta se elimina el dd/mm/aaaa". En la organización, un usuario con la baja pedida se ve con el estado "Baja pedida"; en la plataforma, la cuenta también.
- **Una persona nunca ve "crear empresa" en el lado Personal:** «Registrá tu empresa» (`/registro/empresa`, `BusinessSignupPage`) nace en E6. Desde E6 está en la portada, en la puerta de empresas (`/login/empresa`) y en «Crear cuenta» (`/registro`); nunca en el lado Personal ni en el menú de la cuenta. En 3a se ocultan todos esos controles en todas las pantallas; no se muestran deshabilitados.
- **Empresas del grupo:** el `companyId` sale de la URL (`/org/empresas/:companyId`, con `useParams`); nunca hay una «empresa activa» guardada. `canInCompany` (`usePermissions`) evalúa `effectivePermissions.companies[companyId]`; si la empresa no figura, los permisos de la organización. Una ruta de empresa declara en su manifiesto `companyPermission` además de `permission`, y `RequirePermission` la abre con cualquiera de los dos (la ficha de Empresa: `companies.read` o `company.members.read` en esa empresa, B4).
- **Organización suspendida, en espera de aprobación o cerrada:** `OrganizationUnavailablePage`, con los tres estados del tablero Perfil-Suspendido. El 403 `Tenancy.Tenant.Suspended` muestra «Suspendida», `Tenancy.Tenant.PendingApproval` muestra «Espera aprobación» y `Tenancy.Tenant.Closed` muestra «Cerrada». La página lleva el menú «Elegí otro perfil», con Personal y las otras organizaciones (en la espera no aparece la organización que se está revisando), y «Salir».

## 4. Convenciones

### Datos y API
- Todo pasa por `shared/api/httpClient`: `fetch`, rutas relativas, `Authorization: Bearer`, `Accept-Language` con la **cultura efectiva** (`es-AR`), una sola renovación silenciosa ante un 401 y reintento.
- Los tipos **salen de `generated/schema.d.ts`**; los alias legibles escritos a mano viven en `shared/api/types.ts`, que reexporta desde `generated`. El `api/*.ts` de cada feature exporta query keys (`usersQueryKeyRoot`, `usersQueryKey(q)`, `userQueryKey(id)`) y funciones (`fetchUsers`, `createUser`) tipadas con el schema.
- `useQuery` y `useMutation` se usan directo en las páginas, con `placeholderData: keepPreviousData` en los listados. Nada de `useEffect` con fetch. Una mutación invalida la raíz de su feature.
- `npm run contracts` regenera los tipos; `contracts:check` es obligatorio en local, con el repo hermano al lado, y falla si `schema.d.ts` difiere del contrato. El CI del front todavía no compara los contratos: descarga un solo repo, así que avisa y salta ese chequeo. El chequeo cruzado en el CI llega con la Etapa 10 (enmienda de la ADR 0016).
- **Organizaciones de Plataforma (T21b–c):** `platform/tenants` monta el listado `/plataforma` y la ficha `/plataforma/organizaciones/:id`. La banda del listado usa los conteos globales sin filtros; las opciones de Estado y Origen usan los conteos cruzados del mismo endpoint con búsqueda y filtros. `Provisioning` se presenta como «Falló el alta». Crear requiere `platform.tenants.manage`, cinco campos y los defaults de cultura/zona del operador. Las cinco acciones de estado componen `ReasonDialog` con un adaptador `useIdempotentMutation`; el diálogo maneja el error y el reintento global, mientras el adaptador conserva la clave y silencia su propio aviso. Reintentar el alta es directo y manda sólo versión. La versión y estado respondidos por una escritura propia coordinan las acciones siguientes, sin copiar el objeto de Query a estado local; una relectura ajena no sustituye esa base. El éxito invalida en segundo plano para cerrar el formulario antes de recibir el GET. Tras concurrencia o estado inválido, cerrar el diálogo abandona esa base y relee.
- **Ficha de Organización (T21c–d):** banda con fecha/origen/cantidades y acciones por estado, carteles de Suspensión/Cierre con `lastStateChange` real o `EmptyValue` sin evidencia. Una escritura invalida el evento anterior para no atribuirle una fecha al nuevo estado. Historial global por cursor (`useCursorList`, límite 25 y `LoadMore`) sin total ni cantidad; cuatro columnas y fila móvil con `action` traducida/fecha corta y actor/motivo. `summary` es el cambio técnico de auditoría y no se muestra. Dueños muestra las identidades y membresías actuales del contrato, con último ingreso relativo y sin avatar. Cuando `owners` está vacío y existe `ownerEmail`, la fila pendiente usa sólo ese contacto (nombre vacío, Nunca e Invitación pendiente); la cantidad cuenta las filas que están disponibles. Módulos enumera únicamente el catálogo real; la pestaña se oculta si viene vacío. Dominio verificado y Página pública requieren `platform.tenants.manage`, se consultan recién al abrir su pestaña y van sin cantidades. Cada módulo/dominio/página conserva sólo la base de versión/estado propia en el padre de la ficha, que se desmonta por id; las relecturas quedan en Query. Prender/Apagar usa Manual sin fin y Extender usa Trial con fecha civil; PUT/DELETE sin clave. Verificar manda el motivo fijo traducido y POST idempotente; Quitar pide motivo. Página usa `publicSiteHost`, `publishedAtUtc` real sólo publicada y motivo real sólo bloqueada; Despublicar/Permitir pide motivo con POST idempotente; Ver página abre el subdominio real mediante publicSiteUrl sólo cuando está publicada. Las filas del teléfono se declaran con `ListRow` a partir de los roles/datos de las columnas, sin medidas propias. Closed no tiene ⋮.
- `shared/referenceData` carga una vez todas las filas de los cinco catálogos, traducidas y con `isEnabled`, con TanStack Query (`staleTime: Infinity`) desde `GET /api/reference-data`; conserva el `ETag` para revalidar. Los selectores ofrecen solo filas habilitadas; `shared/format` puede mostrar una deshabilitada ya guardada. Monedas, países, zonas, culturas y tipos fiscales no se enumeran en el código. E1 usa el adaptador JSON del back; E2 cambia a tablas sin alterar el contrato.

### Presentación de datos
- **Todo dato se muestra con los componentes de `shared/ui/format` y se carga con los de `shared/ui/fields`.** Los selectores (`CurrencySelect`, `CountrySelect`, `TimeZoneSelect`, `CultureSelect` y `TaxIdField`) leen `shared/referenceData` y muestran carga hasta recibir opciones. Los patrones por cultura son datos de referencia; las reglas de presentación están en [`formatos.md`](formatos.md).
- Las columnas de `DataTable` declaran el `type` (`date`, `dateTime`, `money`, `decimal`, `percent`, `enum`, `status`…), y la tabla resuelve el formato, la alineación y el vacío.
- Está prohibido formatear fuera de `shared/format` (`toLocaleString`, `toFixed`, `Intl.`); lo verifica `format-usage.test.ts`.

### Paginado, orden y búsqueda
El contrato está en `backend.md` §9, "Paginado, orden y búsqueda". Del lado del front:
- **Por páginas:** `usePagedQuery` arma el listado: `usePagination()` guarda `page`, `pageSize`, `sort` y `search` **en la URL**, y `useFilters(keys)` hace lo mismo con los filtros; suma el debounce, la consulta, la corrección de página y las props de `Pagination`. Los dos escriben con `useQueryUpdate`: una escritura por tick y `replace: true`.
- **Qué vuelve a la página 1:** cambiar la búsqueda, un filtro, el orden o el tamaño de página. La búsqueda se aplica con 300 ms de debounce.
- **Página fuera de rango:** si llegan `items` vacíos con `totalCount > 0`, `usePagedQuery` salta solo a la última, con `replace`, sin dejar una entrada en el historial. Lo hace adentro, con la respuesta de esa página, sin exponer `correctPage`.
- **`Pagination`:** muestra "1–10 de 1.234" y "Página 1 de 124", siempre con `useFormat`. En el modo privado tiene selector de 10, 20, 50 o 100 (**10 por defecto**, omitido de la URL). El directorio usa `variant="web"`: conserva rango/página/flechas en teléfono y omite selector/Cargar más.
- **`DataTable`:** una columna es ordenable si declara `sortable`. Su `id` es el campo del contrato. El encabezado lleva `aria-sort` y alterna ascendente → descendente → orden por defecto.
- **Por cursor** (auditoría y actividad): `useCursorList`, la única forma (nada de `useInfiniteQuery` suelto), con el botón "Cargar más" (`LoadMore`), sin total ni número de página. Recibe `meta` como cualquier consulta. Los filtros viven en la URL y en la clave; el cursor, solo en la consulta.
- Los listados usan `placeholderData: keepPreviousData`: mientras llega la página nueva, la tabla muestra la anterior atenuada y con `aria-busy`.

### Errores
- `ApiError` expone `code`, `detail`, `traceId`, `errors` y `retryAfterSeconds`. **Se decide por `code`, nunca por el texto.**
- Global (`queryClient`): un error de red da un toast con "Reintentar"; un 5xx, un toast con el `traceId`; el resto muestra el `detail`, que ya viene traducido. Se saltean los 401/403 y las queries con `meta.silent`. En las mutaciones, el `MutationCache` avisa igual red, 5xx y 429 (salvo `meta.handlesError`) y la pantalla muestra solo lo de negocio. Los textos salen de `shared/api/errorMessage.ts` (`apiErrorMessage`, `actionErrorMessage`, `toastActionError`).
- Por feature, `errors.ts` hace `switch (error.code)`. `applyApiErrorToForm` lleva los `errors` a los campos; lo que no encaja va en `<FormError>`.
- Un 403 de la consulta principal de la pantalla (la que declara `meta: { blocksView: true }`) renderiza `ForbiddenPage`; el de una consulta secundaria queda en su lugar. `httpClient` solo transporta y `QueryCache.onError` publica el bloqueo. Salvo los códigos que se resuelven antes: `Legal.AcceptanceRequired` lleva a la pantalla bloqueante de términos nuevos (`LegalAcceptanceGate` → `AcceptTermsPage`), y en el `AppShell`, `Tenancy.Tenant.Suspended`, `Tenancy.Tenant.PendingApproval` y `Tenancy.Tenant.Closed` muestran `OrganizationUnavailablePage` (§3). Un 404 en una ficha muestra `NotFoundPage`. Un id de otra organización o de otro acceso también da 404.
- **Casos genéricos** (como en cualquier aplicación; los resuelve `shared/api` y el `AppShell`, nunca cada pantalla):
  - **Sin conexión:** si el navegador está sin conexión (`navigator.onLine`), solo el cartel «Sin conexión» arriba (en el teléfono, debajo de la barra), que se va solo al volver. TanStack Query pausa las consultas mientras tanto, así que no hay aviso aparte.
  - **Error de red con conexión:** aviso "No pudimos conectarnos. Revisá tu conexión." con «Reintentar».
  - **Error 5xx:** aviso "Algo salió mal. Probá de nuevo en un rato." con «Copiar código», que copia el código de seguimiento (`traceId`); el código no se muestra. Lo arma `toastErrorWithCode` (`sonner.tsx`): en la compu el botón va debajo del texto, como el tablero Avisos («Error del servidor»); en el teléfono, al lado, como M-Avisos.
  - **429, demasiados pedidos:** con `retryAfterSeconds`, el botón que disparó el pedido queda deshabilitado con la cuenta regresiva ("Reintentá en 0:42"), como en el ingreso. Si no vino de un botón, toast "Hiciste muchos pedidos seguidos. Probá de nuevo en unos segundos." **Nunca se reintenta solo.**
  - **Sesión vencida (E3, con Auth):** si falla la renovación silenciosa, se limpia la sesión y `queryClient` y se va a `/login` (la puerta del acceso que tenía) con `returnUrl`. La pantalla de ingreso muestra "Tu sesión venció. Ingresá de nuevo." y, al volver, lleva a la misma ruta. Lo escrito en un formulario sin guardar se pierde, salvo que la pantalla lo guarde como borrador.
  - **409, alguien cambió esto:** aviso sobre la pantalla con «Ver lo nuevo» y «Seguir editando», sin perder lo escrito ([formularios](../rules/formularios.md)).
  - **Salir sin guardar:** con "Cambios sin guardar", navegar a otra ruta o cerrar la pestaña pregunta "¿Salir sin guardar?" (`useBlocker` y `beforeunload`).
  - **Versión nueva del front:** si falla la carga de un chunk después de un despliegue, franja "Hay una versión nueva" con «Actualizar», que recarga la página. No se recarga solo.
  - **Módulo apagado (E5):** su ruta muestra `NotFoundPage`, igual que un 404, sin una línea que explique.
  - **Términos nuevos:** si `/api/me` trae `pendingLegalDocuments`, o una respuesta autenticada (de cualquier consulta o mutación) trae 403 `Legal.AcceptanceRequired`, `LegalAcceptanceGate` lleva a `/aceptar-terminos` (`AcceptTermsPage`), que bloquea el uso hasta aceptar. Muestra lo que cambió según `pendingLegalDocuments` (los dos documentos, solo los términos o solo la privacidad); se acepta con `POST /api/legal/accept` y vuelve a la ruta de antes. Hasta entonces, el back responde ese 403 en las rutas autenticadas de `/api`, salvo `GET /api/me`, `GET /api/legal/*` y `POST /api/legal/accept`; las rutas anónimas no pasan por ese middleware (back: `docs/rules/datos-personales.md`).

### Auth
- `authConfig`: `client_id: "web"`, `response_type: "code"`, `scope: "openid profile email offline_access api"`, `userStore: InMemoryWebStorage`, `automaticSilentRenew: false`, `silent_redirect_uri: /silent-renew.html`.
- **Issuer fijo:** `issuer.ts` toma `VITE_AUTH_ISSUER` o `https://localtest.me:5174`; `authority` nunca sale del host actual. `metadataSeed` fija authorize y logout en el principal, y token, userinfo y revocation en `/connect/*` del origen propio: discovery leído desde un subdominio puede anunciar endpoints con ese host, así que la autoridad sola no alcanza. `redirect_uri`, `silent_redirect_uri` y `post_logout_redirect_uri` también pertenecen a ese origen. `authorize` y `logout` navegan al principal; canje, renovación y userinfo quedan en el mismo origen, sin CORS. Tokens en memoria, state de OIDC en la pestaña; sesiones pública y Plataforma separadas según ADR 0044.
- **Reintento del callback (A8):** «Volver a ingresar» abre una autorización nueva con `prompt=login`, que pide el formulario aunque exista una cookie. Conserva la puerta y el retorno del estado validado por OIDC; sin ese estado usa Persona. No lee destinos ni errores de la URL para saltar la validación del protocolo. El backend descarta exclusivamente la cookie pública antigua de un operador; Plataforma conserva su propia cookie. `CallbackPage.test.tsx`, `LoginPage.test.tsx` y el recorrido real A8 verifican el reintento y el ingreso con sesiones anteriores.
- `recoveryAccess` pide Business desde `/org`, Platform desde `/plataforma` y respeta el último acceso de la pestaña en las rutas compartidas del principal. En un subdominio válido fuerza Consumer antes de mirar ese recuerdo. `SessionRecovery` usa `signinSilent({ forceIframeAuth: true, extraQueryParams: { access: "consumer" } })` allí y conserva el Outlet público durante la recuperación; no agrega una pantalla de bloqueo. El servidor recupera Consumer sin crear Personal silenciosamente y conserva la última organización Business. Un 401 del sitio público ofrece una autorización Consumer nueva con la ruta actual; el principal conserva su puerta local. Salir sigue `useSignOut` y `beginSignOut`.
- Los permisos del front son **solo experiencia de uso**; el backend decide.
- **Dos puertas:** `/login` (como persona) y `/login/empresa` (como empresa). Son la misma pantalla con otro título y otro destino; el servidor emite el token con `access` según la puerta. No se vuelve "al último lado": se entra al lado de la puerta elegida. Desde cada puerta, un enlace chico abajo ofrece la otra. El operador no tiene puerta propia: abre `/plataforma` y usa la pantalla compartida de Ingreso. El retorno seguro a una ruta de Plataforma pide `access=platform` en OIDC mediante `accessOfPath`, incluso con query o hash; el servidor exige que la cuenta sea operadora. Después del código entra a Plataforma; el segundo factor queda fuera de E5.
- **Ingreso** (`/login`, `/login/empresa`):
  - arriba, «Ingresar con Google»; debajo, Correo y el campo; WhatsApp y su `SegmentedControl` se suman si `GET /api/auth/methods` trae el canal (Etapa 8);
  - el código es un **paso de la misma pantalla**, sin ruta propia (no hay `/login/codigo`);
  - el código va en `OtpInput`, con 6 casillas. Avanza sola, acepta pegar y retrocede con Backspace;
  - «Reenviar código» se habilita a los 60 s, y un 429 muestra la cuenta regresiva en el botón («Reintentá en 0:42»);
  - los estados salen del `code`: código incorrecto (con los intentos que quedan), vencido, sin intentos, cuenta bloqueada y cuenta suspendida;
  - un correo sin cuenta muestra el error y ofrece crearla sin mandar código (ADR 0043); una invitación pendiente y vigente cuenta como ingreso y sí manda código (ADR 0047);
  - **cuenta con la baja pedida** (`Identity.Account.PendingDeletion`): después del código, "Tu cuenta tiene la baja pedida · Se elimina el dd/mm/aaaa" con «Cancelar la baja y entrar» (`POST /api/auth/deletion/cancel` con el `cancelTicket`) y «Salir»;
  - por la puerta de empresas, una cuenta sin organizaciones ve «Tu cuenta no está en ninguna empresa todavía», con «Ingresá como persona»; «Registrá tu empresa» aparece desde E6;
  - por la puerta de empresas, si su única membresía está deshabilitada (`Tenancy.Member.Inactive`): «Tu acceso a <organización> está deshabilitado», con «Ingresá como persona»; «Registrá tu empresa» aparece desde E6;
  - abajo, «¿No podés entrar? Recuperá tu cuenta» (`/recuperar`): el método perdido, uno nuevo verificado con código, y el pedido queda para que lo revise un operador;
  - la Etapa 3 programa los estados del tablero Ingreso **salvo** los de WhatsApp (Etapa 8) y los cinco «Operador: …» (Etapa 9).
- **Operadores** (Etapa 9; hasta entonces, el operador del seed entra sin segundo factor): después del código pasan por la app de autenticación. La primera vez ven el QR y la clave, activan la app y guardan 8 códigos de recuperación. Después pueden entrar con un código de recuperación.
- **«Registrá tu empresa»** (`/registro/empresa`):
  - la casilla «Acepto los Términos y la Política de privacidad» (también bloquea «Seguir con Google»); «Seguir con Google» o Correo y el código; WhatsApp se suma en la Etapa 8. Con una sesión ya iniciada se empieza en el paso siguiente;
  - «Tu organización» (quedás como Dueño): nombre de la organización, primera empresa, CUIT de la empresa (opcional, 11 números) y slug obligatorio para el subdominio, con consulta de disponibilidad. El slug se puede cambiar después en «Página pública» (`/org/pagina`);
  - según `BusinessSignup`: abierto, «{Organización} está lista» con «Entrar a …»; con aprobación, «Recibimos el pedido» y la organización queda en «Espera aprobación»; cerrado, «Por ahora no se pueden registrar empresas»;
  - si la persona ya llegó al límite de organizaciones propias (`MaxOwnedOrganizations` de `PlatformSettings`): «Llegaste al límite de N organizaciones propias.»;
  - abajo, «¿Tu empresa ya está registrada? Ingresá como empresa».
- **Registro de personas** (`/registro`): correo y código; WhatsApp se incorpora en E8. La aceptación de Términos y Privacidad es obligatoria también para Google. Un correo con cuenta da el error de campo «Ya tenés una cuenta con ese correo.» y el enlace exacto «Ingresar», preescrito; no pasa a código (ADR 0043). Con `ConsumerSignup` cerrado muestra el estado de registro cerrado.
- **Estados de correo A2**: ambas puertas muestran «No hay una cuenta con ese correo.» y «Crear mi cuenta»/«Registrá tu empresa» debajo del campo. `navigation state` conserva el correo al registro; hacia Ingreso, `loginEmail` cruza la navegación OIDC completa con almacenamiento temporal de la pestaña, validado y consumido una vez, sin correo en URL ni logs. Su lectura durante el render es pura, incluso en `StrictMode`; se descarta en el efecto del retorno confirmado, como `loginRedirectError`. Los términos de registro quedan sin aceptar. Recuperación consulta el anterior por POST Preview y presenta el error del nuevo ocupado sin OTP. Agregar correo ajeno muestra el error backend en el campo. Los textos de error vienen del ProblemDetails es/en; editar limpia campo/enlace. Registro empresarial reutiliza el resultado privado A1 sólo después de probar al operador.
- **Invitación** (`/invitacion`): muestra quién invita, la empresa, los roles y el vencimiento, que lee con `POST /api/invitations/preview` (el token va en el cuerpo, nunca en la URL de la API). Se acepta con `POST /api/invitations/accept`. Según el caso:
  - sin cuenta: «Aceptar invitación» crea la cuenta (sin espacio personal) y entra a la organización (acceso B2B);
  - con cuenta y sin sesión: «Ingresá para aceptar»;
  - con la sesión de la misma persona (la cuenta ya tiene el correo invitado): «Aceptar invitación» la suma a la organización sin volver a ingresar;
  - con la sesión de otra persona: avisa y ofrece salir y seguir con la cuenta invitada;
  - vencida, que ya no sirve u organización suspendida: una pantalla de error propia;
  - aceptada, si la cuenta queda solo con el correo de la empresa (sin otro método propio): «Te sumaste a …» con el aviso de método propio en un `Banner` ámbar, «Agregar ahora» (lleva a `/cuenta`) y «Más tarde» (al inicio de la organización).
- **Ingreso con invitaciones (ADR 0047):** el código prueba el correo y acepta todas sus invitaciones pendientes y vigentes, por ambas puertas. Business conserva la selección de organización (última usada o más antigua); Consumer entra a Personal. El consentimiento legal sigue explícito. Una invitación vencida/revocada no habilita ingreso; un correo administrado sin membresía sólo se rehabilita con una invitación vigente de su organización administradora.
- **Estados de sesión**, a pantalla completa: «Iniciando sesión…», «Cambiando a …», «Cerrando sesión…» y «No pudimos iniciar tu sesión».

### Idioma y cultura
- La cultura habilitada sale de `Cultures` en `GET /api/reference-data` y define el idioma (`es` para `es-AR`) y el formato. El catálogo inicial habilita `es-AR` y `en-US`; el fallback y la cultura por defecto son datos de sus filas. Un namespace por módulo; `common` para lo compartido; `enums` para los valores de enums y estados. `parity.test.ts` exige las mismas claves en todos los idiomas habilitados.
- Español rioplatense con voseo. **"Tenant" nunca en pantalla**: se dice "Organización". `TenantAdmin` es "Dueño" y `CompanyAdmin`, "Administrador". El lado B2C se llama "Personal".
- **Una sola cultura efectiva:** `resolveCulture` (`shared/i18n`) elige la de la cuenta (`/api/me`); si no, la que la persona eligió en este navegador (`arquitecturabasemt.culture`; si el navegador no deja guardar, queda en memoria durante la sesión); si no, la marcada por defecto en `Cultures` (hoy `es-AR`, con Buenos Aires y ARS por las relaciones del catálogo). Solo vale una cultura habilitada. `AppProviders` la aplica a i18n cuando llega el catálogo o cambia la cuenta, y de ahí la leen con `useEffectiveCulture` los formatos (`FormatProvider`), el catálogo (`useReferenceData` lo pide en esa cultura) y el `Accept-Language` de `httpClient`. Ningún otro lugar decide la cultura, y no hay un array de culturas en el componente.

### Fechas y zona
- Los DTO traen `…AtUtc` en ISO con `Z`; las fechas civiles, `yyyy-MM-dd`.
- `useEffectiveTimeZone(companyId?)` devuelve la zona de la cuenta; si no hay, la de la empresa; si no, la de la organización (en B2B) o la del navegador guardada al registrarse (en B2C). Las fechas civiles no se convierten.
- En 3a, `/api/me` entrega la zona efectiva para el acceso activo y el hook usa ese valor. Cuando nazcan las pantallas de empresa en E6, `companyId` conectará la zona propia de la empresa. La precedencia completa se verifica desde 3a con un helper puro.

### UI y pantallas
Rige el [lienzo vigente](../design/lienzo/README.md): **mandan los ocho tableros «Criterio»** (Marco y pantallas, Botones, Formularios y campos, Tablas y listas, Diálogos, Menús y desplegables, Avisos y errores, y Decisiones por pantalla) y, para cada pantalla, **solo su tablero validado**; lo marcado «· por refinar» no manda. Los colores y la forma salen del [tema](tema.md). Esta sección resume esos tableros; si algo no coincide, manda el tablero.

**Proceso y contenido**
- Una pantalla nueva sin fuente se dibuja primero. Desde E7 se programa directo lo aprobado: tests donde importan, sin aprobación por pantalla ni capturas por avance, con una sola puerta final según [pantallas-y-ui](../rules/pantallas-y-ui.md). ADR/decisiones posteriores prevalecen en conducta; ver [complemento E8/E8b](../design/alineamiento-etapas-8-y-8b.md).
- **No se inventan datos ni contenido.** Si no se sabe qué va en una pantalla, queda vacía, con la barra y el menú lateral.
- Los datos de ejemplo usan nombres neutros (Grupo Delta, Delta S.A.) y solo los roles y permisos que existen en la plantilla: nada de rubros, módulos ni roles de negocio que no se pidieron.
- **Sin textos que explican.** El estado se dice una vez, arriba, en la segunda línea de la banda: un punto de color y pocas palabras. Donde está la acción va solo un ⓘ; lo que no se puede usar queda apagado y abre lo mismo que el ⓘ: el aviso importante, con el motivo y qué hacer. Ningún párrafo en la pantalla, ni ayudas bajo cada campo, ni notas al pie.

**El marco** («Criterio · Marco y pantallas»)
- Menú lateral arena de 232 px (contraído, 64), igual en los tres perfiles; barra de arriba arena, con las migas a la izquierda y tu menú a la derecha, y nada más.
- Debajo, la **banda de la página** (`Page`), blanca y de ancho completo: el ícono de la sección en un cuadrado petróleo claro (en una ficha, el «‹» para volver en su lugar), el título de 18 px en negrita y, en la segunda línea, el resumen («11 usuarios · 7 activos · 3 invitaciones»), el estado (punto y palabra) o «Cambios sin guardar». Al lado del título no va nada.
- Las acciones de la página van a la derecha: hasta tres a la vista, las demás en ⋮ y la principal al final.
- El contenido va a todo el ancho, con 24 px de margen y cada cosa en su caja: los filtros por un lado, la tabla por otro. **Nunca todo en una sola tarjeta**, ni una caja a medio ancho con el resto vacío.
- **Tres tipos de pantalla:** el **listado** (banda, filtros en su caja y la tabla con su paginado), la **ficha** (una cosa con sus datos en la banda) y la **edición** (un formulario con «Guardar cambios» en la banda, secciones con título y listas en su caja).
- **Pestañas:** en una ficha, **una pestaña por cada grupo de datos, aunque tenga una sola fila** (como «Dominio verificado» en la ficha de una organización); también dos vistas del mismo contenido, como «Configuración» y «Recorrido» del bot. La cantidad va en gris al lado del nombre, sin etiqueta, y la acción de la banda cambia con la pestaña («Agregar miembro», «Crear rol»). En la compu, las pestañas abren el contenido, dentro de su margen y con la línea a lo ancho del contenido (tableros Empresa, Organizacion y Cuenta-Plat; `Page` las arma con los grupos de `tabs`); en el teléfono van en su banda blanca. **Las pestañas piden dos grupos o más:** con uno solo, la ficha va sin la barra (`Page`; decisión del usuario del 2026-10-05). **Nunca una pestaña «Resumen»**: los datos van en la banda.

**Botones** («Criterio · Botones»)
- Cuatro tipos: **principal** (la que hace avanzar; una sola por pantalla y por diálogo, la última a la derecha), **secundario** (todas las demás), **peligro** (con borde en la pantalla; relleno solo en el diálogo que confirma) y **enlace** (una acción chica dentro de una fila o de un texto, nunca la principal).
- Tamaños: normal de 36 px y letra de 14 (banda, diálogos y formularios); chico de 32 y letra de 13 (encabezado de una caja o tabla, y dentro de una fila); grande de 44 y letra de 15, solo en ingreso y registro, a todo el ancho; de ícono, 32 × 32, solo ⋮, ✕ y ‹ (el ☰, solo en el sitio público sin sesión), siempre con nombre.
- El único ícono es el «+» de agregar, crear o invitar. El texto es un verbo y qué cosa («Invitar usuario», «Descartar cambios»); nunca «Aceptar», «OK», «Sí» ni «Enviar». Mientras trabaja dice qué hace («Guardando…»). Solo «Guardar cambios» se apaga, cuando no hay cambios; lo demás queda habilitado y, si falta algo, se explica.
- **Editar algo que ya existe** lleva «Descartar cambios», que deja lo guardado sin salir; **crear algo nuevo** lleva «Cancelar», que vuelve.

**Tablas y listas** («Criterio · Tablas y listas»)
- **Tabla** (`FilterBar` + `DataTable` + `Pagination`, con el estado en la URL), para un listado largo que se filtra:
  - filtros en su propia tarjeta, arriba, sin botones: el buscador siempre, hasta tres filtros a la vista, cada opción con cuántas filas trae, el filtro elegido en petróleo y diciendo qué tiene, y «Limpiar filtros» como enlace solo si hay algo elegido;
  - encabezado de 40 px sobre arena, letra de 13 en semibold, sin mayúsculas;
  - filas de 40 px, o de 52 con segunda línea; letra de 13; una sí y otra no en arena muy suave; petróleo claro al pasar el mouse;
  - un tema por columna. **Una celda puede llevar una segunda línea gris que aclara la primera**: el correo debajo del nombre, el rol en la empresa debajo de la empresa, «Vence …» debajo del estado. Dos datos sin relación nunca van en la misma celda. Sin dato, una sola raya;
  - el estado es un punto de 8 px y la palabra, sin fondo: verde activo, petróleo pendiente, ámbar atención, gris apagado. Números y montos, a la derecha;
  - las acciones van en ⋮ (`RowActions`, columna de 48 px): las comunes arriba; las de peligro abajo, en rojo y separadas. Fuera del ⋮, a lo sumo un enlace que pida el estado;
  - con más de 10 filas, paginado al pie, dentro de la misma caja, de 10 por página. Lo que solo crece (auditoría, eventos) se pide de a tandas con «Cargar más», sin total (`LoadMore`);
  - a ancho completo; si no entra, se saca una columna, nunca se achica la letra;
  - cuando no hay filas: «Cargando», «Todavía no hay …» (se crea desde la banda), «Ningún … coincide con los filtros» con «Limpiar filtros», y el error con «Reintentar».
- **Lista** (`List`), para lo corto que vive dentro de una pantalla (hasta 10 elementos, sin filtros ni paginado; si pueden ser más, es una tabla): la caja lleva su título en el encabezado arena y a lo sumo una acción chica; sin encabezado de columnas; filas de 44 px, o de 56 con segunda línea; lo que aclara la fila («Principal», «Sin verificar») va en esa segunda línea gris, nunca como etiqueta. **Una lista se lee: cambiar una fila o sumar otra abre un diálogo chico**, desde el ⋮ o desde la acción del encabezado.
- **Lista con grupos que se abren:** solo para los permisos de un rol, y es la única que se abre y se cierra. Cada grupo tiene su casilla de «todos» y la cuenta («3 de 3»); al entrar están abiertos los que tienen algo marcado; una fila por permiso, solo con el nombre.
- La auditoría usa «Cargar más»; tocar «Qué pasó» abre el detalle en un diálogo de solo lectura.

**Formularios** («Criterio · Formularios y campos»; ficha: [formularios](../rules/formularios.md))
- El rótulo va arriba, siempre visible, con un asterisco rojo si el dato es obligatorio. Sin ayudas debajo ni ejemplos adentro; solo el buscador lleva texto adentro.
- El error va debajo del campo, en rojo, y dice qué hacer. Se revisa al tocar «Guardar cambios» y, después del primer error, mientras se escribe. Un error general va en una franja roja clara arriba de los botones; nunca en un aviso que se va solo.
- El control más simple para cada dato: texto; texto largo (tres líneas de entrada); desplegable (`Select`, `SearchSelect`, que con más de 10 opciones suma un buscador); varios a la vez en un desplegable con casillas (`MultiSelect`, con «Todos» como casilla junto al rótulo, nunca como una opción más); segmentado para dos o tres opciones fijas; casilla para un sí o no que se guarda; interruptor para lo que se aplica en el momento, sin guardar; código en seis casillas.
- **Una caja por tema, a todo el ancho** (`Section`), con el título en el encabezado arena de 40 px. Adentro, **dos columnas iguales** que ocupan todo el ancho, con las mismas columnas en todas las filas; tres sólo si todos los datos son cortos. «Tus datos» de Mi cuenta v112 usa cuatro columnas iguales (Nombre, Apellido, Idioma y región, Zona horaria), una columna en teléfono. Un texto largo ocupa las dos columnas. Lo que es una lista (correos, dominios, empresas) va en una caja de lista.
- Campos de 36 px con radio de 8; el código, de 44. Lo que no se edita se muestra como texto, nunca como un campo gris.
- Lo que es de la identidad (nombre y apellido separados, idioma y región, zona y métodos de ingreso) se edita en `/cuenta`, nunca en la ficha de un usuario de la organización.
- Lo corto se edita en un diálogo; lo largo, en una pantalla propia con `useEditForm` (el formulario y la versión de lo que se edita, que una relectura de fondo no cambia) y `useEditPage` («Cambios sin guardar», el 409, la franja del error y «¿Salir sin guardar?», con `useUnsavedChangesGuard`). Nunca un diálogo sobre otro, una tabla dentro de un diálogo, un panel que se despliega ni una fila que se expande; la única excepción son los grupos de permisos de un rol.

**Menús y desplegables** («Criterio · Menús y desplegables»)
- El ⋮ de una fila ofrece solo lo que se puede hacer con ella (nada de opciones grises), las comunes arriba y las de peligro abajo, en rojo y después de una franja; cada opción, de 36 px, con su ícono gris y un verbo («Editar», «Reenviar invitación»), y una línea fina entre opciones. Abre debajo, alineado a la derecha, o hacia arriba si no hay lugar.
- **Tu menú** (`AccessMenu`): arriba, quién sos; después, los perfiles (el actual con tilde; uno que no está disponible, en gris, dice por qué en la segunda línea y al tocarlo abre la pantalla que lo explica); al final, «Mi cuenta» y «Salir».
- El **menú lateral** es igual en los tres perfiles: arriba, Inicio y los módulos de uso diario (como WhatsApp); abajo de todo, con una línea, «Administración». Los dos abren un segundo panel al lado, uno a la vez. Un grupo con hijos se despliega en el lugar y arranca abierto solo en una de sus pantallas; en las demás va cerrado y lleva a su primera opción (lienzo v102); el activo va en blanco con letra petróleo; contraído muestra solo los íconos; hay una línea fina entre opciones; la flechita que lo contrae es blanca, redonda, de 28 px y con borde arena, y va en el borde del último panel: el de Administración si está abierto (ahí lo cierra) y, si no, el menú (lienzo v107).
- Todo menú se abre con un clic y se cierra al elegir, con Escape o con un clic afuera; uno a la vez; se recorre con las flechas. Más de 8 opciones es una pantalla o un desplegable con buscador.

**Diálogos** («Criterio · Diálogos»)
- Dos anchos: chico de 420 px (uno o dos campos, y confirmaciones) y normal de 560 (hasta seis campos en dos columnas). La única excepción es la vista previa de la Página pública, de 640 (`size="preview"`): lleva la tarjeta de la página pública tal cual, sobre su fondo (lienzo v107). Encabezado de 48 px sobre arena, con el título de 15 en semibold y el ✕, sin bajada; cuerpo con 20 px de margen; pie de 60 px con línea arriba y, a la derecha, «Cancelar» y la principal, última.
- La **confirmación** de algo que no se deshace va sin ✕: el título es la pregunta, con el nombre de lo que se toca; el texto dice qué se pierde; el botón repite la acción en rojo relleno.
- El **aviso importante** (`ImportantNotice`) se abre desde un ⓘ o desde el botón apagado: el título dice qué pasa, el motivo va en una caja roja suave y debajo «Qué podés hacer» en pasos numerados, con un solo botón, «Entendido».
- El detalle de solo lectura va en una grilla con líneas: el rótulo a la izquierda, sobre arena clara, y el valor a la derecha.
- Se abre centrado, con el cursor en el primer campo; se cierra con ✕, «Cancelar» o Escape, nunca con un clic afuera. Al terminar se cierra y un aviso confirma lo que pasó. Antes de algo que se paga, se ve el costo estimado.
- **¿Diálogo o pantalla?** Diálogo: agregar o editar algo corto (hasta seis campos), confirmar o escribir un código. Pantalla propia: más de seis campos o secciones, una tabla o lista adentro, o algo que se comparte con un enlace.
- Toda acción destructiva se confirma. En la plataforma, el motivo es obligatorio.

**Avisos y errores** («Criterio · Avisos y errores»)
- Cada cosa tiene un solo lugar:
  - salió bien: un aviso abajo a la derecha con tilde verde, que se va solo a los 4 segundos («Guardamos tus datos.»);
  - un formulario tiene algo mal: en el formulario, debajo del campo o en una franja arriba de los botones;
  - falló una acción directa (un ⋮, un botón): un aviso rojo abajo a la derecha, con ✕, que no se va solo;
  - algo que sigue pasando: un cartel arriba del contenido, debajo de la banda (petróleo si informa, ámbar si hay que hacer algo, rojo si algo no funciona), con un botón chico si hay algo para hacer;
  - la pantalla no se puede mostrar: la pantalla de error, con «Reintentar»;
  - algo que no se deshace: la confirmación, antes.
- En el teléfono (R3 de «Criterio · Avisos», lienzo v93), los dos avisos van abajo, en una franja oscura a lo ancho, encima de la barra de abajo; el cartel va debajo de la barra de arriba.
- Cómo se escribe: lo que salió bien, en pasado y en plural («Quitamos lucia.fer@gmail.com.»); lo que salió mal, «No pudimos …» y qué hacer. Nada de «Error», «Ups», «Operación exitosa», signos de exclamación, códigos técnicos ni textos en inglés.

**Pantallas públicas (`AuthLayout`)**
- La pantalla va en dos mitades: a la izquierda, el formulario (380 px), con la marca arriba y, abajo, el idioma y los enlaces legales; a la derecha, un panel con el color de la marca.
- Títulos de 24 px, botones grandes de 44 a todo el ancho y el código en seis casillas de 44. Los errores del servidor van en una franja arriba del botón.

**Teléfono** (hasta 767 px)
- **Con sesión, el teléfono es una app** (tableros M-* y «Criterio · Marco y pantallas»), no la web achicada:
  - arriba, la barra del teléfono y el título grande (`AppBar`), con la organización o el perfil debajo; en una pantalla interna, «‹» y el título, con el camino debajo («Administración»). Buscar y filtrar son íconos de esa barra; el filtro abre una hoja con las opciones y su conteo;
  - abajo, hasta cuatro secciones y «Más» con tu inicial (`BottomNav`). El manifiesto declara `bottomSections` por referencias a sus rutas e íconos móviles, filtradas con `canOpen`; Personal suma Inicio y los módulos ya visibles, hasta cuatro; Empresa mantiene Inicio/Más. Plataforma muestra Organizaciones, Cuentas y Recuperaciones según permiso, más Más (`/plataforma/mas`); sus detalles marcan la misma sección, Administración y Mi cuenta marcan Más. «Más» (`/mas` en Personal y Empresa) reúne los perfiles, los módulos Personal visibles en Secciones, la Administración, Mi cuenta y Salir; Plataforma omite Perfiles y WhatsApp (E11) y monta Más independiente de sus páginas parciales. No hay barra de abajo en un chat ni si hay una acción fija abajo;
  - las listas van de borde a borde, con filas de hasta tres líneas (`ListRow`); el ⋮ va solo si la fila tiene acciones y, si no, se toca la fila; el ⋮ abre una hoja desde abajo con el dato de la fila de título (M-Empresa, «Invitación: acciones»); el paginado es «Cargar más»;
  - una pantalla cuyo ‹ vuelve al Inicio (la ficha de la empresa de quien la administra sola) marca Inicio en la barra de abajo;
  - **crear algo nuevo es un «+» flotante** abajo a la derecha (`Fab`), también con la lista vacía;
  - lo que en la compu es un diálogo es una **hoja desde abajo**, con manija y botones de 48 a lo ancho; la confirmación, sin ✕;
  - los ajustes y las fichas van en grupos blancos sobre fondo gris (`Section`, `SettingsGroup`), con el título gris arriba y a lo sumo una acción en texto; una fila con «›» abre otra pantalla o una hoja para elegir;
  - **las pantallas de edición llevan fijos abajo «Descartar cambios» y «Guardar cambios»** (`FixedActions`); al crear, «Cancelar» y la acción;
  - los campos miden 48 px con letra de 16, y los botones, de 44 a 50;
  - lo pasajero va en una franja oscura abajo, a lo ancho; lo que sigue pasando (sin conexión, versión nueva, «Otra persona cambió esto») va en una banda debajo de la barra de arriba;
  - prohibido: la marca arriba, la banda con ícono y resumen, cajas con cabecera arena, el ☰, una versión aparte de la pantalla hecha a mano y el scroll de costado.
- **Las páginas públicas conservan marco web:** Landing-Movil y M-Directorio usan el encabezado con ☰, un Sheet y pie, sin BottomNav. El directorio mantiene rango, página y flechas de `Pagination variant="web"`, sin selector de tamaño ni Cargar más. M-Pagina-Publica conserva la tarjeta y no lleva ☰; con sesión abre Tu cuenta en el Sheet aprobado, reutilizando perfiles/salida. El ingreso y el registro van en una columna, sin el panel de la marca.

**Código**
- Colores solo con los tokens de [tema.md](tema.md); las variables de shadcn son alias de esos tokens. Componentes propios en PascalCase; los de shadcn se generan con `npx shadcn@4.21.0 add`.
- No se definen componentes dentro de otros. El estado derivado se calcula en el render, y en JSX va ternario en lugar de `&&`.

### Accesibilidad y diseño adaptable
- **WCAG 2.2 AA.** Cada test de pantalla corre `vitest-axe` y falla con cualquier violación. Las piezas de `shared/ui` resuelven rótulos, nombres de botones, foco y teclado. Ficha: [accesibilidad](../rules/accesibilidad.md).
- **Tres anchos: 390, 768 y 1440.** En el teléfono, `Page` arma la pantalla de la app (`AppChrome` le dice si es un teléfono, a dónde vuelve «‹» y qué va debajo del título), `DataTable` muestra la fila de lista de cada pantalla (`mobileRow`), los filtros pasan a la barra y los diálogos se abren como hojas (ver «Teléfono» arriba). El acceso B2C y las páginas públicas se piensan primero para el teléfono. Ficha: [responsive](../rules/responsive.md).

### Módulos, ediciones simultáneas y altas sin duplicados
- **Módulos habilitados:** `features` en `/api/me`, y `usePermissions().hasFeature`. Rutas y links declaran `feature` además de `permission`; apagado = no existe (404).
- **Ediciones simultáneas:** la `version` viaja en cada `PUT` o `DELETE`; un 409 `General.ConcurrencyConflict` muestra el aviso con "Ver lo nuevo" y "Seguir editando".
- **Altas y envíos:** `useIdempotentMutation`, con la clave creada al abrir el formulario.
- **Datos con forma propia:** `EmailField`, `PhoneField` y `TaxIdField`. Los largos de texto salen del contrato generado.
- Fichas: [formularios](../rules/formularios.md), [datos-y-api](../rules/datos-y-api.md), [accesos-y-permisos](../rules/accesos-y-permisos.md).

### Tests
- Colocalizados. MSW con `onUnhandledRequest: "error"` y fixtures de `/api/me` para persona (con y sin organizaciones), empresa (con y sin permisos) y operador.
- Por pantalla se prueban solo los estados y recorridos que realmente existen:
  - carga, vacío, sin coincidencias, error con reintento y sin permiso, cuando aplican;
  - el recorrido de los diálogos presentes;
  - el `code` de cada error traducido;
  - **el formato de los datos que muestra con es-AR y en-US**;
  - axe sin violaciones y, si tiene tabla o formulario, la vista a 390 px.
- Por cada cambio coherente con lógica, escribir primero un test focal que falle y hacerlo pasar; verificar el build y lint del alcance afectado antes del commit.
- Al cerrar una etapa, ejecutar `npm run build`, `npm run lint`, `npm test` y `npm run contracts:check` completos y limpios; el CI corre los mismos, salvo `contracts:check`, que se saltea hasta la Etapa 10 (ADR 0016). La puerta de etapa conserva el E2E real desde E3a y la comparación visual con el lienzo aprobado.
