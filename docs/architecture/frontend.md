# Arquitectura del front

> Documento canónico del SPA. Copia las convenciones de `../ArquitecturaBaseFront` (su `CLAUDE.md`; de `docs/design/visual-baseline.md`, solo las migas: los colores remiten a [tema.md](tema.md)) y les suma, en una sola app, el modelo de accesos de `../ArquitecturaBaseMutitenant/docs/architecture/multitenancy.md`:
- **una cuenta con dos accesos que no se mezclan**: como persona (B2C) y como empresa (B2B);
- el **sitio de la plataforma** y la **página pública de cada organización en su subdominio**;
- el **backoffice** de la plataforma.

Suma también las empresas, los tipos generados desde OpenAPI y **una sola forma de mostrar los datos** ([`formatos.md`](formatos.md)). El backend está en `../ArquitecturaBaseMutitenant` (`docs/architecture/backend.md`); el árbol completo, archivo por archivo, está en [`arbol.md`](arbol.md). El diseño de cada pantalla está en el [lienzo versionado](../design/lienzo/README.md) (versión 35, 67 tableros): cada tablero manda sobre cualquier descripción textual. Los colores, la forma y el menú lateral están en el [tema](tema.md), y la sección «UI y pantallas» resume sus reglas.

## 1. Stack

Mismo stack y mismas versiones que ArquitecturaBaseFront. **El `node_modules` viejo** (react-router-dom 7, vite 6, eslint) **se descarta**.

| Tema | Elección |
|---|---|
| Base | React 19 + Vite 8 + TypeScript 6 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`) |
| Router | `react-router` 8, `createBrowserRouter` y `lazy` por página |
| Datos | `@tanstack/react-query` 5. Sin Redux ni Zustand: el estado del servidor va en Query y el de la UI en la URL y en `useState` |
| Auth | `oidc-client-ts` + `react-oidc-context`, Authorization Code + PKCE, tokens solo en memoria |
| Formularios | `react-hook-form` + `zod` en los formularios con reglas; `useState` con un draft en los diálogos simples |
| UI | shadcn/ui (new-york) + `radix-ui` + Tailwind 4 (CSS-first, los tokens de [tema.md](tema.md) en `index.css`; las variables de shadcn, solo como alias), `sonner`, Inter Variable |
| i18n | `i18next` + `react-i18next` + `i18next-resources-to-backend`, un namespace por módulo |
| Formatos | `shared/format`: `Intl` con patrones de `Cultures` (`GET /api/reference-data`), más `libphonenumber-js`. Sin perfiles fijos en código ni librería de fechas |
| Contratos | `openapi-typescript` genera `src/shared/api/generated/schema.d.ts` desde `../ArquitecturaBaseMutitenant/docs/contracts/openapi.json` |
| Tests | Vitest 5 + jsdom + Testing Library + user-event + MSW 2 |
| Lint | `oxlint` (sin ESLint ni Prettier) |

## 2. Estructura

```
src/
├─ app/          providers · router · routes: elige el árbol de rutas por host (dominio principal o subdominio de organización)
├─ auth/         AuthProvider · authConfig · SessionRecovery · ProtectedRoute · AccessRoute · useCurrentUser · usePermissions · Can
├─ tenancy/      useAccess · useSwitchAccess (persona ↔ empresa, y entre organizaciones) · AccessMenu · useCompanyParam · usePublicSite (subdominio)
├─ layouts/      PersonalLayout · BusinessLayout · PlatformLayout (mismo armazón: Sidebar + Topbar) · SiteLayout (sitio y páginas públicas) · AuthLayout · navigation/ · components/
├─ areas/        una feature no importa de otra, ni un área de otra; lo común sube a shared/
│  ├─ public/    auth (ingresar como persona o como empresa, registro de personas, «Registrá tu empresa», invitación) · site (portada y directorio de la plataforma) · legal (términos, privacidad y la aceptación bloqueante de una versión nueva) · errors
│  ├─ storefront/ página pública de una organización, en su subdominio + lo que publiquen los módulos del producto
│  ├─ personal/  (acceso B2C) home · account (la cuenta, vale en los dos accesos) · + módulos B2C del producto
│  ├─ business/  (acceso B2B) home · roles (REFERENCIA) · users · companies · settings · audit · public-page (mi página pública) · + módulos B2B del producto
│  └─ platform/  tenants (/plataforma) · accounts (personas y operadores) · recoveries · legal · audit · settings
├─ locales/      {es,en}/<namespace>.json + parity.test.ts
├─ shared/
│  ├─ api/       httpClient · ApiError · queryClient · formErrors · types.ts (alias) · generated/schema.d.ts (no se edita)
│  ├─ format/    ÚNICO lugar que formatea fechas, números, moneda, porcentajes, teléfonos (formatos.md)
│  ├─ referenceData/ GET /api/reference-data, catálogos compartidos y patrones de cultura
│  ├─ time/      useEffectiveTimeZone · cálculo del offset actual
│  ├─ i18n/ · hooks/ · lib/
│  └─ ui/        shadcn + propios + format/ (DateText, MoneyText…) + fields/ (campos y selectores de referencia)
└─ test/         setup · mocks · utils
```

## 3. Rutas

Van en español. El permiso de cada una se declara en `routes.tsx` y en `layouts/navigation/*.ts`.

**Dominio principal** (`plataforma.com`):

| Ruta | Pantalla | Quién |
|---|---|---|
| `/` | sin sesión: la portada de la plataforma (con «Para empresas» y el directorio de empresas publicadas). Con sesión de persona: su inicio personal | cualquiera |
| `/login`, `/registro`, `/recuperar` | ingresar **como persona**, crear una cuenta y «Recuperar mi cuenta» | público |
| `/login/empresa`, `/registro/empresa` | ingresar **como empresa** y **«Registrá tu empresa»** | público |
| `/invitacion`, `/auth/callback`, `/login/enlace` | aceptar una invitación, volver del servidor de ingreso, enlace del bot (Etapa 8) | público |
| `/terminos`, `/privacidad` | «Términos y condiciones» y «Política de privacidad» vigentes (la versión publicada, en el idioma de la persona o, sin sesión, en el de la pantalla) | público |
| `/` (con sesión), `/cuenta` + las rutas B2C del producto (`/<módulo>`) | **acceso B2C**: el lado Personal | `access=consumer` (`/cuenta`, también `business`) |
| `/org`, `/org/usuarios(/:id)`, `/org/roles(/nuevo, /:id)`, `/org/empresas(/:companyId)`, `/org/configuracion`, `/org/auditoria`, `/org/pagina` + las rutas B2B del producto | **acceso B2B**: la organización | `access=business` + el permiso de cada pantalla |
| `/plataforma` (Organizaciones, el inicio), `/plataforma/organizaciones/:id`, `/plataforma/cuentas(/:id)` (cuentas y operadores), `/plataforma/recuperaciones`, `/plataforma/legales`, `/plataforma/auditoria`, `/plataforma/configuracion` | backoffice | `access=platform` + `platform.*` |

**Subdominio de una organización** (`<slug>.plataforma.com`):

| Ruta | Pantalla | Quién |
|---|---|---|
| `/` | página pública de la organización | cualquiera (lo publicado) |
| `/<módulo>` | lo que publiquen los módulos del producto, y lo que una persona pide o contrata | cualquiera; para interactuar, `access=consumer` |
| `/auth/callback` | volver del servidor de ingreso: el canje del código va al propio origen | público |

- **Árbol de rutas por host:** `routes.tsx` mira el host. Con un subdominio de organización arma las rutas de `storefront` (y `/auth/callback`); con el dominio principal, las demás. El subdominio **nunca** da acceso a la administración de la organización: esa vive en `plataforma.com/org`.
- **Área según el acceso:** `useAccess` lee `access` de `/api/me`. Después de ingresar se va al inicio del acceso: persona → `/`, empresa → `/org`, operador → `/plataforma`. `AccessRoute` manda al inicio correcto si se entra a una ruta de otro acceso (por ejemplo, un enlace viejo).
- **Ingresar desde un subdominio:** "Ingresá para continuar" hace el ingreso **como persona** y vuelve a la misma página del subdominio. El SPA y la Api se sirven desde el **mismo origen en cada host** (dominio principal y cada subdominio), así que no hay CORS. El issuer es fijo (el dominio principal): `authorize` y `logout` navegan al dominio principal, y el canje del código, la renovación y `userinfo` van a `/connect/*` del propio subdominio (ver "Auth").
- **Inicio de cada área** (`/` con sesión de persona, `/org`): su contenido depende de cada producto. En la Etapa 3 ya existen ambos inicios vacíos con su layout, barra y menú lateral, según sus tableros (en el inicio personal, solo el aviso de método propio cuando corresponde). La administración del área B2B se suma en la Etapa 6. Sin resúmenes de relleno.
- **Menú lateral:** el mismo armazón en las tres áreas; cambian los enlaces.
  - Persona: Inicio y Mi cuenta, más los módulos B2C del producto. **No muestra organizaciones.**
  - Empresa: arriba, Inicio y los módulos B2B del producto. **Abajo de todo, «Administración»**, que abre un **segundo panel al lado del menú** (`AdminPanel`, se cierra con «‹» o tocando de nuevo «Administración»; abierto en cualquier ruta de administración) con el desplegable «Gestión de usuarios» (Usuarios, Roles y permisos), Empresas, Configuración, Página pública y Auditoría. En el teléfono no hay segundo panel: «Administración» se despliega dentro del menú.
  - Plataforma: Organizaciones (es el inicio, `/plataforma`), Cuentas (personas y operadores), Recuperaciones, Auditoría, Documentos legales y Configuración.
  - Cada enlace se muestra solo con su permiso (y su módulo, si es de un módulo).
- **Menú de la cuenta** (`AccessMenu`, arriba a la derecha): el botón muestra el nombre de la persona y dónde está ("Personal" o el nombre de la organización). El menú tiene:
  - la cabecera, con el nombre y el correo;
  - la lista «Perfiles», igual en los dos accesos: Personal («Tu perfil personal») y cada organización de la que es miembro, con su rol y su estado, y un ✓ en la activa (las suspendidas, deshabilitadas). Elegir una cambia de acceso o de organización;
  - «Mi cuenta» y «Salir».

  **Al cambiar de acceso o de organización:**
  1. pantalla completa «Cambiando a …»;
  2. `signinSilent({ extraQueryParams: { access, tenant } })`;
  3. `queryClient.clear()`, **obligatorio**;
  4. el inicio del acceso nuevo.
- **La cuenta** (`/cuenta`: nombre, idioma y región, zona y **métodos de ingreso**, con el aviso de método propio) es de la identidad y vale en los dos accesos. Desde el acceso B2B se llega por «Mi cuenta» del menú, y se ve dentro del `BusinessLayout`.
- **Aviso de método propio** (`multitenancy.md` §3.1 del back): pide agregar un método propio verificado para no perder la cuenta al dejar la empresa. En E3 ofrece correo; WhatsApp se muestra si `GET /api/auth/methods` trae el canal desde E8. Aparece mientras todos los métodos los administra una organización o solo existe el correo de la invitación, al aceptar esa invitación, en `/cuenta` y en el inicio personal. Se va solo cuando se verifica un método propio.
- **Métodos de ingreso** (en `/cuenta`; diseño en `multitenancy.md` §3.1 del back): en la Etapa 3 se gestionan correo y Google; `Phone` es solo modelo. Sumar y verificar un teléfono se habilita cuando el módulo WhatsApp registra su canal (Etapa 8); la opción aparece si `GET /api/auth/methods` trae ese canal. Sumar un método pide verificarlo con un código que llega a ese dato. Quitar un método, cambiarlo o elegir el principal pide un código en **otro** método ya verificado (`ReauthTicket`, válido 5 minutos). El diálogo muestra el destino enmascarado. Siempre tiene que quedar al menos un método propio o activo, y todo cambio se avisa en todos los métodos.
- **Baja de la cuenta** (en `/cuenta`, sección Privacidad; diseño en `multitenancy.md` §3.2 del back): diálogo con motivo y código a su método principal, la sugerencia de exportar antes, los errores de la política (único Dueño, operador, bloqueos de módulos) y, al confirmar, sesión cerrada con "Tu cuenta se elimina el dd/mm/aaaa". En la organización, un usuario con la baja pedida se ve con el estado "Baja pedida"; en la plataforma, la cuenta también.
- **Una persona nunca ve "crear empresa":** «Registrá tu empresa» (`/registro/empresa`, `BusinessSignupPage`) está en la portada, en la puerta de empresas (`/login/empresa`) y en «Crear cuenta» (`/registro`); nunca en el lado Personal ni en el menú de la cuenta.
- **Empresas del grupo:** el `companyId` sale de la URL (`useCompanyParam`) y `CanInCompany` evalúa `permissions.companies[companyId]`.
- **Organización suspendida, en espera de aprobación o cerrada:** `OrganizationUnavailablePage`, con los tres estados del tablero Perfil-Suspendido. El 403 `Tenancy.Tenant.Suspended` muestra «Suspendida», `Tenancy.Tenant.PendingApproval` muestra «Espera aprobación» y `Tenancy.Tenant.Closed` muestra «Cerrada». La página lleva el menú «Elegí otro perfil», con Personal y las otras organizaciones (en la espera no aparece la organización que se está revisando), y «Salir».

## 4. Convenciones

### Datos y API
- Todo pasa por `shared/api/httpClient`: `fetch`, rutas relativas, `Authorization: Bearer`, `Accept-Language` con la **cultura efectiva** (`es-AR`), una sola renovación silenciosa ante un 401 y reintento.
- Los tipos **salen de `generated/schema.d.ts`**; los alias legibles escritos a mano viven en `shared/api/types.ts`, que reexporta desde `generated`. El `api/*.ts` de cada feature exporta query keys (`usersQueryKeyRoot`, `usersQueryKey(q)`, `userQueryKey(id)`) y funciones (`fetchUsers`, `createUser`) tipadas con el schema.
- `useQuery` y `useMutation` se usan directo en las páginas, con `placeholderData: keepPreviousData` en los listados. Nada de `useEffect` con fetch. Una mutación invalida la raíz de su feature.
- `npm run contracts` regenera los tipos; `contracts:check` es obligatorio en local. Hasta que ambos repos estén en GitHub, el CI del front avisa y salta ese chequeo si falta el repo hermano; con ambos presentes, falla si `schema.d.ts` difiere del contrato.
- `shared/referenceData` carga una vez los cinco catálogos habilitados y traducidos con TanStack Query (`staleTime: Infinity`) desde `GET /api/reference-data`; conserva el `ETag` para revalidar. Monedas, países, zonas, culturas y tipos fiscales no se enumeran en el código. E1 usa el adaptador JSON del back; E2 cambia a tablas sin alterar el contrato.

### Presentación de datos
- **Todo dato se muestra con los componentes de `shared/ui/format` y se carga con los de `shared/ui/fields`.** Los selectores (`CurrencySelect`, `CountrySelect`, `TimeZoneSelect`, `CultureSelect` y `TaxIdField`) leen `shared/referenceData` y muestran carga hasta recibir opciones. Los patrones por cultura son datos de referencia; las reglas de presentación están en [`formatos.md`](formatos.md).
- Las columnas de `DataTable` declaran el `type` (`date`, `dateTime`, `money`, `decimal`, `percent`, `enum`, `status`…), y la tabla resuelve el formato, la alineación y el vacío.
- Está prohibido formatear fuera de `shared/format` (`toLocaleString`, `toFixed`, `Intl.`); lo verifica `format-usage.test.ts`.

### Paginado, orden y búsqueda
El contrato está en `backend.md` §9, "Paginado, orden y búsqueda". Del lado del front:
- **Por páginas:** `usePagination(result?: { items; totalCount })` guarda `page`, `pageSize`, `sort` y `search` **en la URL**, y `useFilters(keys)` hace lo mismo con los filtros. Los dos escriben con `useQueryUpdate`: una escritura por tick y `replace: true`.
- **Qué vuelve a la página 1:** cambiar la búsqueda, un filtro, el orden o el tamaño de página. La búsqueda se aplica con 300 ms de debounce.
- **Página fuera de rango:** si llegan `items` vacíos con `totalCount > 0`, `usePagination` salta solo a la última, con `replace`, sin dejar una entrada en el historial. Desde la E1 lo hace internamente, sin exponer `correctPage`.
- **`Pagination`:** muestra "1–10 de 1.234" y "Página 1 de 124", siempre con `useFormat`, y tiene un selector de 10, 20, 50 o 100 por página (**10 por defecto**; si la URL no trae `pageSize`, no se escribe).
- **`DataTable`:** una columna es ordenable si declara `sortable`. Su `id` es el campo del contrato. El encabezado lleva `aria-sort` y alterna ascendente → descendente → orden por defecto.
- **Por cursor** (auditoría y actividad): `useCursorList` sobre `useInfiniteQuery`, con el botón "Cargar más" (`LoadMore`), sin total ni número de página. Los filtros viven en la URL; el cursor no.
- Los listados usan `placeholderData: keepPreviousData`: mientras llega la página nueva, la tabla muestra la anterior atenuada y con `aria-busy`.

### Errores
- `ApiError` expone `code`, `detail`, `traceId`, `errors` y `retryAfterSeconds`. **Se decide por `code`, nunca por el texto.**
- Global (`queryClient`): un error de red da un toast con "Reintentar"; un 5xx, un toast con el `traceId`; el resto muestra el `detail`, que ya viene traducido. Se saltean los 401/403 y las queries con `meta.silent`.
- Por feature, `errors.ts` hace `switch (error.code)`. `applyApiErrorToForm` lleva los `errors` a los campos; lo que no encaja va en `<FormError>`.
- Un 403 renderiza `ForbiddenPage`, salvo los códigos que resuelve el `AppShell`: `Legal.AcceptanceRequired` muestra la pantalla bloqueante de términos nuevos (`AcceptTermsPage`), y `Tenancy.Tenant.Suspended`, `Tenancy.Tenant.PendingApproval` y `Tenancy.Tenant.Closed` muestran `OrganizationUnavailablePage` (§3). Un 404 en una ficha muestra `NotFoundPage`. Un id de otra organización o de otro acceso también da 404.
- **Casos genéricos** (como en cualquier aplicación; los resuelve `shared/api` y el `AppShell`, nunca cada pantalla):
  - **Sin conexión o error de red:** toast "No pudimos conectarnos. Revisá tu conexión." con «Reintentar». Si el navegador está sin conexión (`navigator.onLine`), además una franja fija arriba, "Sin conexión", que se va sola al volver.
  - **Error 5xx:** toast "Algo salió mal. Probá de nuevo en un rato." con el código de seguimiento (`traceId`) para copiar.
  - **429, demasiados pedidos:** con `retryAfterSeconds`, el botón que disparó el pedido queda deshabilitado con la cuenta regresiva ("Reintentá en 0:42"), como en el ingreso. Si no vino de un botón, toast "Hiciste muchos pedidos seguidos. Probá de nuevo en unos segundos." **Nunca se reintenta solo.**
  - **Sesión vencida (E3, con Auth):** si falla la renovación silenciosa, se limpia la sesión y `queryClient` y se va a `/login` (la puerta del acceso que tenía) con `returnUrl`. La pantalla de ingreso muestra "Tu sesión venció. Ingresá de nuevo." y, al volver, lleva a la misma ruta. Lo escrito en un formulario sin guardar se pierde, salvo que la pantalla lo guarde como borrador.
  - **409, alguien cambió esto:** aviso sobre la pantalla con «Ver lo nuevo» y «Seguir editando», sin perder lo escrito ([formularios](../rules/formularios.md)).
  - **Salir sin guardar:** con "Cambios sin guardar", navegar a otra ruta o cerrar la pestaña pregunta "¿Salir sin guardar?" (`useBlocker` y `beforeunload`).
  - **Versión nueva del front:** si falla la carga de un chunk después de un despliegue, franja "Hay una versión nueva" con «Actualizar», que recarga la página. No se recarga solo.
  - **Módulo apagado (E5):** su ruta muestra `NotFoundPage`, igual que un 404.
  - **Términos nuevos:** si una respuesta autenticada trae 403 `Legal.AcceptanceRequired`, se muestra `AcceptTermsPage`, que bloquea el uso hasta aceptar. Lee `GET /api/legal/current` y muestra lo que cambió (los dos documentos, solo los términos o solo la privacidad). Se acepta con `POST /api/legal/accept`. Hasta entonces, el back responde ese 403 en las rutas autenticadas de `/api`, salvo `GET /api/me`, `GET /api/legal/*` y `POST /api/legal/accept`; las rutas anónimas no pasan por ese middleware (back: `docs/rules/datos-personales.md`).

### Auth
- `authConfig`: `client_id: "web"`, `response_type: "code"`, `scope: "openid profile email offline_access api"`, `userStore: InMemoryWebStorage`, `automaticSilentRenew: false`, `silent_redirect_uri: /silent-renew.html`.
- **Issuer fijo:** `authority` es el issuer (el dominio principal), y `metadataSeed` apunta `token_endpoint`, `userinfo_endpoint` y `revocation_endpoint` a `/connect/*` del **origen propio**. Desde un subdominio, `authorize` y `logout` son navegaciones al dominio principal (donde vive la cookie de `/connect`), y el canje del código, la renovación y `userinfo` quedan en el mismo origen, sin CORS.
- `SessionRecovery` hace `signinSilent()` después de un F5. El logout es `signoutRedirect()` con `beginSignOut`.
- Los permisos del front son **solo experiencia de uso**; el backend decide.
- **Dos puertas:** `/login` (como persona) y `/login/empresa` (como empresa). Son la misma pantalla con otro título y otro destino; el servidor emite el token con `access` según la puerta. No se vuelve "al último lado": se entra al lado de la puerta elegida. Desde cada puerta, un enlace chico abajo ofrece la otra. El operador de la plataforma no tiene puerta propia: ingresa por la misma pantalla, por cualquiera de las dos puertas. Después del código pasa por la app de autenticación, el servidor le emite `access=platform` sin importar la puerta, y entra a `/plataforma`.
- **Ingreso** (`/login`, `/login/empresa`):
  - arriba, «Ingresar con Google»; debajo, Correo y el campo; WhatsApp y su `SegmentedControl` se suman si `GET /api/auth/methods` trae el canal (Etapa 8);
  - el código es un **paso de la misma pantalla**, sin ruta propia (no hay `/login/codigo`);
  - el código va en `OtpInput`, con 6 casillas. Avanza sola, acepta pegar y retrocede con Backspace;
  - «Reenviar código» se habilita a los 60 s, y un 429 muestra la cuenta regresiva en el botón («Reintentá en 0:42»);
  - los estados salen del `code`: código incorrecto (con los intentos que quedan), vencido, sin intentos, cuenta bloqueada y cuenta suspendida;
  - pedir un código responde igual exista o no la cuenta;
  - **cuenta con la baja pedida** (`Identity.Account.PendingDeletion`): después del código, "Tu cuenta tiene la baja pedida · Se elimina el dd/mm/aaaa" con «Cancelar la baja y entrar» (`POST /api/auth/deletion/cancel` con el `cancelTicket`) y «Salir»;
  - por la puerta de empresas, una cuenta sin organizaciones ve «Tu cuenta no está en ninguna empresa todavía», con «Registrá tu empresa» e «Ingresá como persona»;
  - por la puerta de empresas, si su única membresía está deshabilitada (`Tenancy.Member.Inactive`): «Tu acceso a <organización> está deshabilitado», con «Ingresá como persona» y «Registrá tu empresa»;
  - abajo, «¿No podés entrar? Recuperá tu cuenta» (`/recuperar`): el método perdido, uno nuevo verificado con código, y el pedido queda para que lo revise un operador;
  - la Etapa 3 programa los estados del tablero Ingreso **salvo** los de WhatsApp (Etapa 8) y los cinco «Operador: …» (Etapa 9).
- **Operadores** (Etapa 9; hasta entonces, el operador del seed entra sin segundo factor): después del código pasan por la app de autenticación. La primera vez ven el QR y la clave, activan la app y guardan 8 códigos de recuperación. Después pueden entrar con un código de recuperación.
- **«Registrá tu empresa»** (`/registro/empresa`):
  - la casilla «Acepto los Términos y la Política de privacidad» (también bloquea «Seguir con Google»); «Seguir con Google» o Correo y el código; WhatsApp se suma en la Etapa 8. Con una sesión ya iniciada se empieza en el paso siguiente;
  - «Tu organización» (quedás como Dueño): nombre de la organización, primera empresa, CUIT de la empresa (opcional, 11 números) y slug obligatorio para el subdominio, con consulta de disponibilidad. El slug se puede cambiar después en «Página pública» (`/org/pagina`);
  - según `BusinessSignup`: abierto, «{Organización} está lista» con «Entrar a …»; con aprobación, «Recibimos el pedido» y la organización queda en «Espera aprobación»; cerrado, «Por ahora no se pueden registrar empresas»;
  - si la persona ya llegó al límite de organizaciones propias (`MaxOwnedOrganizations` de `PlatformSettings`): «Llegaste al límite de N organizaciones propias.»;
  - abajo, «¿Tu empresa ya está registrada? Ingresá como empresa».
- **Registro de personas** (`/registro`): pide correo o WhatsApp (el estado WhatsApp, en la Etapa 8) y verifica el código. Lleva la casilla de términos y privacidad, obligatoria también para registrarse con Google (sin ella, el back responde 400 `Validation.Failed` con el error en el campo `acceptedTerms`). Si el correo ya tiene cuenta, la pantalla es la misma y el correo que llega trae un código para entrar. Con `ConsumerSignup` cerrado se ve «Por ahora no se pueden crear cuentas».
- **Invitación** (`/invitacion`): muestra quién invita, la empresa, los roles y el vencimiento, que lee con `POST /api/invitations/preview` (el token va en el cuerpo, nunca en la URL de la API). Se acepta con `POST /api/invitations/accept`. Según el caso:
  - sin cuenta: «Aceptar invitación» crea la cuenta (sin espacio personal) y entra a la organización (acceso B2B);
  - con cuenta y sin sesión: «Ingresá para aceptar»;
  - con la sesión de la misma persona (la cuenta ya tiene el correo invitado): «Aceptar invitación» la suma a la organización sin volver a ingresar;
  - con la sesión de otra persona: avisa y ofrece salir y seguir con la cuenta invitada;
  - vencida, que ya no sirve u organización suspendida: una pantalla de error propia;
  - aceptada, si la cuenta queda solo con el correo de la empresa (sin otro método propio): «Te sumaste a …» con el aviso de método propio, «Agregar ahora» y «Más tarde» (`PersonalMethodBanner`).
- **Estados de sesión**, a pantalla completa: «Iniciando sesión…», «Cambiando a …», «Cerrando sesión…» y «No pudimos iniciar tu sesión».

### Idioma y cultura
- La cultura habilitada sale de `Cultures` en `GET /api/reference-data` y define el idioma (`es` para `es-AR`) y el formato. El catálogo inicial habilita `es-AR` y `en-US`; el fallback y la cultura por defecto son datos de sus filas. Un namespace por módulo; `common` para lo compartido; `enums` para los valores de enums y estados. `parity.test.ts` exige las mismas claves en todos los idiomas habilitados.
- Español rioplatense con voseo. **"Tenant" nunca en pantalla**: se dice "Organización". `TenantAdmin` es "Dueño" y `CompanyAdmin`, "Administrador". El lado B2C se llama "Personal".
- En E1 el proveedor usa la cultura de `localStorage` (`arquitecturabasemt.culture`) si está habilitada; si no, la marcada por defecto en `Cultures` (hoy `es-AR`, con Buenos Aires y ARS por las relaciones del catálogo). En E3 la cultura de la cuenta (`PUT /api/me`) gana sobre la local y se conecta a `/api/me`. No hay un array de culturas en el componente.

### Fechas y zona
- Los DTO traen `…AtUtc` en ISO con `Z`; las fechas civiles, `yyyy-MM-dd`.
- `useEffectiveTimeZone(companyId?)` devuelve la zona de la cuenta; si no hay, la de la empresa; si no, la de la organización (en B2B) o la del navegador guardada al registrarse (en B2C). Las fechas civiles no se convierten.

### UI y pantallas
Rigen los [tableros del lienzo versionado](../design/lienzo/README.md) (versión 35; mandan sobre cualquier descripción textual), el [tema](tema.md) (tokens y colores: verde petróleo como marca y marco arena en el menú lateral y la barra superior; forma de tarjetas, botones y tablas; el `AdminPanel`) y estas reglas. De `visual-baseline.md` se mantienen solo las migas; **lo que sigue lo reemplaza**.

**Proceso y contenido**
- **Toda pantalla nueva se dibuja primero** en el lienzo y se programa después de que el usuario la elige.
- **No se inventan datos ni contenido.** Si no se sabe qué va en una pantalla, queda vacía, con la barra y el menú lateral.
- Los datos de ejemplo usan nombres neutros (Grupo Delta, Delta S.A.) y solo los roles y permisos que existen en la plantilla: nada de rubros, módulos ni roles de negocio que no se pidieron.
- Ningún texto que nadie pidió: ni ayudas bajo cada campo, ni notas al pie, ni bajadas de relleno. Quedan los rótulos, los errores, los vacíos y las confirmaciones.

**Densidad**
- Todo es compacto:
  - letra de 13 px en el texto y en las tablas;
  - filas de 42 px;
  - campos de 36 px con radio de 8;
  - botones de 34 px;
  - menú lateral de 232 px y barra superior de 52 px.
- Nada de tamaños grandes que hagan ver la pantalla tosca.

**Encabezado de página (`Page`)**
- Es una **banda blanca de ancho completo**, pegada a la barra superior y con borde abajo. Lleva:
  - a la izquierda, el ícono de la sección en un cuadrado con el fondo tenue de la marca (`--marca-t`); en una ficha o un editor, el botón «‹» para volver (`backTo`);
  - el título de 18 px/700, con la pastilla de estado o el aviso «Cambios sin guardar» a su lado;
  - debajo del título, una línea de resumen de 13 px («11 usuarios · 7 activos · 3 invitaciones»);
  - a la derecha, **las acciones de la página**.
- Botones de la página:
  - la acción principal, con el color de la marca (`--marca`), siempre al final a la derecha;
  - se ven hasta tres botones; si hay más, los que sobran van en un botón ⋮ («Más acciones») a la izquierda de la principal, con las destructivas al final y en rojo;
  - en una ficha con pestañas, la acción de la pestaña (por ejemplo «Agregar miembro») aparece solo con esa pestaña;
  - la barra de filtros no lleva botones.
- Debajo de la banda va el contenido, sobre el fondo de la pantalla (`--fondo`): la barra de filtros y la tabla, cada una en su tarjeta. **Nunca todo junto en una sola tarjeta.**
- **Sin bandas grises ni rótulos en mayúsculas.**

**Listados**
- `FilterBar` (tarjeta con radio de 16 y la sombra suave del [tema](tema.md)) + `DataTable` + `Pagination`, con el estado en la URL.
  - La barra lleva el buscador (32 px) y filtros en pastilla. Cada filtro abre un menú con el conteo de cada opción; con un valor elegido, la pastilla queda marcada. «Limpiar» aparece solo si hay filtros.
- `DataTable`:
  - **un dato por columna**: nombre, correo, rol, empresa, estado y vencimiento van en columnas propias; no se apilan dos datos en una celda;
  - encabezado sobre `--s2` (12 px/600, sin mayúsculas) y filas alternadas;
  - filas de 42 px en una sola línea;
  - el estado en `StatusBadge` (pastilla con punto);
  - los roles de la organización en pastillas;
  - los números a la derecha;
  - el vacío es «—» en gris.
- Las acciones de cada fila van en un **menú ⋮** (`RowActions`): primero las comunes y, separadas al final, las destructivas en rojo. En las últimas filas el menú se abre hacia arriba. Las opciones dependen del estado: por ejemplo, una invitación ofrece «Reenviar invitación» y «Revocar invitación»; un usuario activo, «Deshabilitar», y uno deshabilitado, «Habilitar» (nunca «Activar»).
- La auditoría usa «Cargar más» (`LoadMore`). La primera columna es «Fecha y hora», en una línea, y el detalle se abre en un diálogo de solo lectura.

**Fichas y formularios**
- La ficha usa la misma banda: «‹», el nombre, la pastilla de estado y los datos clave en la línea de resumen. Las acciones van a la derecha.
  - **Pestañas solo con dos o más tablas grandes**, debajo de la banda y con su conteo.
  - No hay pestaña «Resumen»: los datos de la entidad están en la banda y se editan con un diálogo.
- Un formulario es **una sola hoja** a ancho completo, en dos columnas, con secciones de título de 15 px. Nunca varias tarjetas sueltas.
- Una pantalla de edición deja editar: tiene campos reales, «Cancelar» y «Guardar cambios» en la banda, y el aviso de cambios sin guardar.
- Lo que es de la identidad (nombre, idioma y región, zona y métodos de ingreso) se edita en `/cuenta`, nunca en la ficha de un usuario de la organización.
- Lo corto se edita en un **diálogo** y lo largo en una **pantalla propia** con `useUnsavedChangesGuard`. Nunca un diálogo sobre otro, una tabla dentro de un diálogo, un panel desplegable ni una fila que se expande.

**Controles**
- Siempre el control más simple:
  - una opción, `Select`;
  - varias, `MultiSelect`;
  - lo que se repite, una fila de desplegables con «Sumar otra», como la empresa y sus roles.
- Las opciones del `Select` y del `MultiSelect` tienen el nombre y, si hace falta, una descripción debajo. El `MultiSelect` suma una casilla por opción. «Todos» es un check junto al rótulo, nunca una opción más.
- Campos de 36 px con radio de 8 y rótulo de 12 px/600 encima. Los obligatorios llevan un asterisco rojo.
- Botones de 34 px (40 en las pantallas públicas). El principal lleva el color de la marca (`--marca`, ver [tema](tema.md)); el secundario, blanco con borde; el destructivo, rojo.

**Diálogos y avisos**
- Diálogos de 560 px (420 para confirmar), con fondo desenfocado y título de 16 px/600. Debajo del título puede ir el nombre de lo que se edita. Los campos van en dos columnas y la botonera, a la derecha.
- Toda acción destructiva se confirma. En la plataforma, el motivo es obligatorio.
- Los resultados se avisan con un toast abajo a la derecha. Los errores de una regla (por ejemplo, «Tiene que quedar al menos un Dueño») van arriba del formulario o en el toast, según dónde se originan.

**Pantallas públicas (`AuthLayout`)**
- La pantalla va en dos mitades:
  - a la izquierda, el formulario (380 px), con la marca arriba y, abajo, el idioma y los enlaces legales;
  - a la derecha, un panel con el color de la marca.
- Títulos de 24 px, campos y botones de 40 px, código en casillas de 52 px. Los errores del servidor van en un mensaje de color arriba del botón.

**Teléfono** (hasta 767 px)
- Barra de arriba de 52 px:
  - ☰ abre el mismo menú lateral por encima del contenido, con un velo;
  - en el medio, la marca;
  - el avatar abre el menú de la cuenta (cambiar de acceso u organización, «Mi cuenta» y «Salir») en una hoja desde abajo.
- La banda del título se mantiene. El resumen va en una línea (con «…» si no entra), y la acción principal va a la derecha con un rótulo corto («+ Invitar»). Las que sobran van en ⋮.
- Filtros: el buscador ocupa todo el ancho y las pastillas van debajo.
- **Tablas:** solo las columnas que entran: el dato principal, el estado y el ⋮. El resto se ve al entrar a la fila. Nunca se apilan dos datos en una celda. La auditoría muestra la fecha y «Qué pasó».
- Los diálogos se abren como hojas desde abajo. Las de un formulario ocupan casi toda la altura, con los campos en una columna y los botones a lo ancho abajo.
- Al editar (usuario, rol, configuración, cuenta), «Cancelar» y «Guardar» van en una barra fija abajo.
- Las pantallas públicas van en una columna, sin el panel de la marca.

**Código**
- Colores solo con los tokens de [tema.md](tema.md); las variables de shadcn son alias de esos tokens. Componentes propios en PascalCase; los de shadcn se generan con `npx shadcn@4.21.0 add`.
- No se definen componentes dentro de otros. El estado derivado se calcula en el render, y en JSX va ternario en lugar de `&&`.

### Accesibilidad y diseño adaptable
- **WCAG 2.2 AA.** Cada test de pantalla corre `vitest-axe` y falla con cualquier violación. Las piezas de `shared/ui` resuelven rótulos, nombres de botones, foco y teclado. Ficha: [accesibilidad](../rules/accesibilidad.md).
- **Tres anchos: 390, 768 y 1440.** En el teléfono, `DataTable` muestra solo las columnas `mobile` (el dato principal y el estado) y el ⋮; los filtros van debajo del buscador; los diálogos se abren como hojas desde abajo (ver "Teléfono" arriba). El acceso B2C y las páginas públicas se piensan primero para el teléfono. Ficha: [responsive](../rules/responsive.md).

### Módulos, ediciones simultáneas y altas sin duplicados
- **Módulos habilitados:** `features` en `/api/me`, y `useFeature` / `<Feature>`. Rutas y links declaran `feature` además de `permission`; apagado = no existe (404).
- **Ediciones simultáneas:** la `version` viaja en cada `PUT` o `DELETE`; un 409 `General.ConcurrencyConflict` muestra el aviso con "Ver lo nuevo" y "Seguir editando".
- **Altas y envíos:** `useIdempotentMutation`, con la clave creada al abrir el formulario.
- **Datos con forma propia:** `EmailField`, `PhoneField` y `TaxIdField`. Los largos de texto salen del contrato generado.
- Fichas: [formularios](../rules/formularios.md), [datos-y-api](../rules/datos-y-api.md), [accesos-y-permisos](../rules/accesos-y-permisos.md).

### Tests
- Colocalizados. MSW con `onUnhandledRequest: "error"` y fixtures de `/api/me` para persona (con y sin organizaciones), empresa (con y sin permisos) y operador.
- Por pantalla se prueba:
  - carga, vacío, sin coincidencias, error con reintento y sin permiso;
  - el recorrido de los diálogos;
  - el `code` de cada error traducido;
  - **el formato de sus datos en es-AR y en en-US**;
  - axe sin violaciones y, si tiene tabla o formulario, la vista a 390 px.
- No se da nada por terminado sin `npm run build`, `npm run lint` y `npm test` limpios.
