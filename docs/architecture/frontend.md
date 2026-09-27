# Arquitectura del front

> Documento canónico del SPA. Copia las convenciones de `../ArquitecturaBaseFront` (su `CLAUDE.md` y `docs/design/visual-baseline.md`) y les suma tres áreas en una sola app: **personal (B2C)**, **organización (B2B)** y **plataforma**. Suma también el selector de perfil, las empresas, los tipos generados desde OpenAPI y **una sola forma de mostrar los datos** ([`formatos.md`](formatos.md)). El backend está en `../ArquitecturaBaseMutitenant` (`docs/architecture/backend.md`); el árbol completo, archivo por archivo, está en [`arbol.md`](arbol.md). El diseño de cada pantalla está en el [lienzo del sistema visual](https://claude.ai/artifact/WzoVTM574QGka8nCU4iFEK), y la sección «UI y pantallas» resume sus reglas.

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
├─ layouts/      PersonalLayout · BusinessLayout · PlatformLayout (el mismo armazón: Sidebar + Topbar; cambia la navegación) · AuthLayout · navigation/ · components/
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
- **Inicio de cada área** (`/`, `/org`): su contenido depende de las funciones de cada producto. Hasta que el producto lo defina, la página queda vacía, con la barra y el menú lateral. No se arman tableros ni resúmenes de relleno.
- **Menú lateral:** es el mismo en los tres perfiles; cambian los enlaces.
  - Personal: Inicio, Mis organizaciones y Mi cuenta, más los módulos B2C del producto.
  - Organización: Inicio; Administración con el desplegable «Gestión de usuarios» (Usuarios, Roles y permisos), Empresas, Configuración y Auditoría; más los módulos B2B del producto.
  - Plataforma: Organizaciones, Cuentas, Auditoría y Configuración.
  - Cada enlace se muestra solo con su permiso: alguien que solo tiene un rol en una empresa ve el Inicio y los módulos que su rol le habilita.
- **Selector de perfil** (en `UserMenu`, arriba a la derecha): el botón muestra el nombre de la persona y el perfil activo. El menú lista:
  - la cabecera, con el nombre y el correo;
  - «Personal» y las organizaciones, con el rol y un ✓ en la activa. Una organización suspendida aparece deshabilitada y con su estado;
  - «Crear una organización», «Mi cuenta» y «Salir».

  Al elegir un perfil:
  1. se ve una pantalla completa con «Cambiando a …»;
  2. `signinSilent({ extraQueryParams: { tenant: id } })`;
  3. `queryClient.clear()`, **obligatorio**, para que no queden datos del perfil anterior;
  4. navega al inicio del área nueva.
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
- **Ingreso** (`/login`):
  - arriba, «Ingresar con Google»; debajo, un `SegmentedControl` Correo | WhatsApp y el campo;
  - el código va en `OtpInput`, con 6 casillas. Avanza sola, acepta pegar y retrocede con Backspace;
  - «Reenviar código» se habilita a los 60 s, y un 429 muestra la cuenta regresiva en el botón («Reintentá en 0:42»);
  - los estados salen del `code`: código incorrecto (con los intentos que quedan), vencido, sin intentos, cuenta bloqueada y cuenta suspendida;
  - pedir un código responde igual exista o no la cuenta.
- **Operadores:** después del código pasan por la app de autenticación. La primera vez ven el QR y la clave, activan la app y guardan 8 códigos de recuperación. Después pueden entrar con un código de recuperación.
- **Registro** (`/registro`): pide correo o WhatsApp y verifica el código. Si el correo ya tiene cuenta, la pantalla es la misma y el correo que llega trae un código para entrar. Con `ConsumerSignup` cerrado se ve «Por ahora no se pueden crear cuentas».
- **Invitación** (`/invitacion`): muestra quién invita, la empresa, los roles y el vencimiento. Según el caso:
  - sin cuenta: «Aceptar invitación» crea la cuenta y entra a la organización;
  - con cuenta y sin sesión: «Ingresá para aceptar»;
  - con la sesión de otra persona: avisa y ofrece salir y seguir con la cuenta invitada;
  - vencida, que ya no sirve u organización suspendida: una pantalla de error propia.
- **Estados de sesión**, a pantalla completa: «Iniciando sesión…», «Cambiando a …», «Cerrando sesión…» y «No pudimos iniciar tu sesión».

### Idioma y cultura
- La cultura (`es-AR` por defecto, o `en-US`) define el idioma (`es`) y el formato. Un namespace por módulo; `common` para lo compartido; `enums` para los valores de enums y estados. `parity.test.ts` exige las mismas claves en los dos idiomas.
- Español rioplatense con voseo. **"Tenant" nunca en pantalla**: se dice "Organización". `TenantAdmin` es "Administrador general" y `CompanyAdmin`, "Administrador".
- La cultura se guarda en la cuenta (`PUT /api/me`) y gana sobre la de localStorage (`arquitecturabasemt.culture`).

### Fechas y zona
- Los DTO traen `…AtUtc` en ISO con `Z`; las fechas civiles, `yyyy-MM-dd`.
- `useEffectiveTimeZone(companyId?)` devuelve la zona de la cuenta; si no hay, la de la empresa; si no, la de la organización o el perfil. Las fechas civiles no se convierten.

### UI y pantallas
Rigen el [lienzo del sistema visual](https://claude.ai/artifact/WzoVTM574QGka8nCU4iFEK) y estas reglas. De `visual-baseline.md` se mantienen los tokens, la marca azul, el menú lateral y las migas; **lo que sigue lo reemplaza**.

**Proceso y contenido**
- **Toda pantalla nueva se dibuja primero** en el lienzo y se programa después de que el usuario la elige.
- **No se inventan datos ni contenido.** Si no se sabe qué va en una pantalla, queda vacía, con la barra y el menú lateral.
- Los datos de ejemplo usan nombres neutros (Grupo Delta, Delta S.A.) y solo los roles y permisos que existen en la plantilla: nada de rubros, módulos ni roles de negocio que no se pidieron.
- Ningún texto que nadie pidió: ni ayudas bajo cada campo, ni notas al pie, ni bajadas de relleno. Quedan los rótulos, los errores, los vacíos y las confirmaciones.

**Página (`Page`)**
- Título de 26 px/700. Debajo, en 14 px, una línea de resumen con conteos («11 usuarios · 7 activos · 3 invitaciones»). El botón principal va a la derecha.
- En una ficha o un editor, arriba va el enlace «‹ Volver» (`backTo`). El aviso «Cambios sin guardar» va junto al título.
- **Sin bandas grises ni rótulos en mayúsculas.**
- Letra de 14 px en el texto y en las tablas, y de 15 px en los campos.

**Listados**
- `FilterBar` (tarjeta de 14 px de radio) + `DataTable` + `Pagination`, con el estado en la URL.
  - La barra lleva el buscador (40 px) y filtros en pastilla. Cada filtro abre un menú con el conteo de cada opción; con un valor elegido, la pastilla queda marcada. «Limpiar» aparece solo si hay filtros.
- `DataTable`:
  - encabezados de 13 px/600 sin mayúsculas;
  - filas de 64 px con celdas de dos líneas: el dato en 14 px y el detalle en 13 px gris;
  - el estado en `StatusBadge` (pastilla con punto);
  - los roles en pastillas;
  - los números a la derecha.
- Las acciones de cada fila van en un **menú ⋮** (`RowActions`): primero las comunes y, separadas al final, las destructivas en rojo. En las últimas filas el menú se abre hacia arriba. Las opciones dependen del estado: por ejemplo, una invitación ofrece «Reenviar» y «Revocar».
- La auditoría usa «Cargar más» (`LoadMore`). En la columna «Cuándo» va la fecha y hora en una línea, y el detalle se abre en un diálogo de solo lectura.

**Fichas y formularios**
- La ficha tiene una tarjeta de cabecera con el nombre, el estado en pastilla, los datos clave en una línea y las acciones.
  - **Pestañas solo con dos o más tablas grandes**, debajo de la cabecera, con su conteo. La acción principal de cada pestaña va en su barra de filtros.
  - No hay pestaña «Resumen»: los datos de la entidad están en la cabecera y se editan con un diálogo.
- Un formulario es **una sola hoja** a ancho completo, en dos columnas, con secciones de título de 17 px. Nunca varias tarjetas sueltas.
- Una pantalla de edición deja editar: tiene campos reales, «Cancelar» y «Guardar cambios», y el aviso de cambios sin guardar.
- Lo que es de la identidad (nombre, idioma y región, zona y métodos de ingreso) se edita en `/cuenta`, nunca en la ficha de un usuario de la organización.
- Lo corto se edita en un **diálogo** y lo largo en una **pantalla propia** con `useUnsavedChangesGuard`. Nunca un diálogo sobre otro, una tabla dentro de un diálogo, un panel desplegable ni una fila que se expande.

**Controles**
- Siempre el control más simple:
  - una opción, `Select`;
  - varias, `MultiSelect`;
  - lo que se repite, una fila de desplegables con «Sumar otra», como la empresa y sus roles.
- Las opciones del `Select` y del `MultiSelect` tienen el nombre y, si hace falta, una descripción debajo. El `MultiSelect` suma una casilla por opción. «Todos» es un check junto al rótulo, nunca una opción más.
- Campos de 44 px con radio de 10 y rótulo de 13 px/600 encima. Los obligatorios llevan un asterisco rojo.
- Botones de 40 px (48 en las pantallas públicas). El principal es azul; el secundario, blanco con borde; el destructivo, rojo.

**Diálogos y avisos**
- Diálogos de 640 px (460 para confirmar), con fondo desenfocado y título de 19 px/600. Debajo del título puede ir el nombre de lo que se edita. Los campos van en dos columnas y la botonera, a la derecha.
- Toda acción destructiva se confirma. En la plataforma, el motivo es obligatorio.
- Los resultados se avisan con un toast abajo a la derecha. Los errores de una regla (por ejemplo, «Tiene que quedar al menos un Administrador general») van arriba del formulario o en el toast, según dónde se originan.

**Pantallas públicas (`AuthLayout`)**
- La pantalla va en dos mitades:
  - a la izquierda, el formulario (420 px), con la marca arriba y, abajo, el idioma y los enlaces legales;
  - a la derecha, un panel azul de la marca.
- Títulos de 28 px. Los errores del servidor van en un mensaje de color arriba del botón.
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
