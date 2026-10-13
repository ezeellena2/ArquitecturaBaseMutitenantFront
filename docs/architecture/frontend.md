# Cómo agregar una pantalla al front

Esta SPA usa una cuenta con accesos Persona y Empresa, más Plataforma para operadores exclusivos.
El host público de una organización se resuelve por separado del acceso privado de la sesión.
La conducta está en las [features del back](../../../ArquitecturaBaseMutitenant/docs/features/roles.md);
las convenciones, en [AGENTS.md](../../AGENTS.md) y las [fichas](../rules/README.md).
El [árbol](arbol.md) ubica las carpetas y enlaza sus punteros.

## 1. Stack

React 19 y TypeScript estricto, Vite, React Router, TanStack Query, react-hook-form y zod.
Radix/shadcn y Tailwind usan los tokens de [tema.md](tema.md); sonner presenta avisos.
i18next carga namespaces es/en. Vitest, Testing Library, user-event, MSW y axe prueban el front.
Los tipos HTTP se generan con openapi-typescript; oxlint verifica el código.
Las versiones efectivas están en package.json y package-lock.json.

## 2. Estructura

```text
src/
├── app/                    composición, providers, rutas y guardas
├── auth/                   sesión OIDC, usuario y permisos
├── tenancy/                accesos, perfiles, host y URLs públicas
├── layouts/                marcos, navegación declarativa y Más
├── areas/
│   ├── public/             ingreso, registro, portada, directorio y legales
│   ├── storefront/         lo publicado en el subdominio
│   ├── personal/           Inicio y Mi cuenta; features B2C del producto
│   ├── business/           administración de organización y empresas
│   └── platform/           backoffice
├── modules/                módulos quitables, hoy assistant/
├── shared/
│   ├── modules/            contratos neutrales de registro y contribución
│   ├── api/                httpClient, QueryClient, errores y tipos
│   ├── hooks/              listados, edición, foco y reintentos
│   ├── format/             formato central
│   ├── referenceData/      catálogos y patrones recibidos de la API
│   ├── account/            métodos de ingreso compartidos
│   ├── platform/           confirmación con motivo
│   ├── phone/              interpretación de teléfono y banderas
│   ├── time/               reloj y conversión temporal
│   ├── i18n/               cultura efectiva
│   └── ui/                 piezas, format/, fields/ y app/
├── locales/                es/en por namespace
└── test/                   setup, fixtures y utilidades
```

Una feature organiza `api/` (HTTP y query keys), `pages/` (pantallas), `components/`
(piezas propias) y `tabs/` (grupos de una ficha), según lo que necesite.
Lo que usan varias features sube a shared; una feature o un área no importa otra.
Los punteros de capa, área, feature y módulo enlazan ficha y modelo; las subcarpetas fijas heredan.
Copiá [Roles](../../src/areas/business/roles/AGENTS.md) para un recurso nuevo.
[Estructura y features](../rules/estructura-y-features.md) define los límites de imports.

## 3. Rutas

Declarar una ruta una vez en `layouts/navigation/<área>.ts` permite reutilizar camino,
permiso, rótulo e ícono en el menú, Más y el router. La página del núcleo usa lazyPage
y RequirePermission. AccessRoute y la aceptación de legales permanecen por encima.
Las rutas de interfaz van en español: Persona inicia en `/`, Empresa en `/org`
y Plataforma en `/plataforma`. `tenancy/access.ts` concentra inicios y puertas;
no se reconstruyen desde un rol ni desde la última pantalla visitada.

`routesForHost` monta el dominio principal o el sitio público. En un subdominio válido
solo monta la página publicada, el callback y la frontera uniforme No disponible.
`tenancy/publicSite.ts` construye URLs desde el issuer fijo; un host no cambia el tenant
privado del token. La [feature pública](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md)
describe portada, directorio, página, menús y retorno al principal.

Un módulo aporta `registration.ts` mediante los contratos de shared/modules.
Solo `app/moduleComposition.ts` importa su registro concreto. ModuleRoutePage decide
desde `/api/me` antes de montar React.lazy; route.lazy adelantaría esa carga.
El módulo contribuye rutas, navegación, grupos de Administración y bloques de Inicio.
Su registro declara los permisos una vez; disponibilidad de chat y gestión son capacidades distintas.
La receta completa está en [estructura y features](../rules/estructura-y-features.md).
El backend decide la autorización: la guarda del front mejora la experiencia.

## 4. Convenciones

### Datos y API

Usá httpClient y TanStack Query; el estado del servidor pertenece a Query.
`shared/api/generated/schema.d.ts` nace de `npm run contracts` y no se edita.
Los alias escritos a mano del núcleo van en `shared/api/types.ts` y los exclusivos de un módulo en `modules/<nombre>/api/types.ts`; todos derivan del mismo schema generado. Los módulos contienen sus locales y fixtures, y los aportan desde `registration.ts` mediante el contrato neutral de módulos; los fixtures se cargan sólo en desarrollo.
La feature reúne sus query keys y funciones HTTP en api/; sus inputs reproducen el contrato.
Las mutaciones que crean o envían usan useIdempotentMutation, con una clave por recorrido
y el cuerpo original en cada retry. PUT y DELETE viajan con la versión que corresponda.
[Datos y API](../rules/datos-y-api.md) explica reintentos, versiones y abandono de operaciones.

### Paginado, orden y búsqueda

Un listado administrativo usa usePagedQuery: filtros, búsqueda, orden y página viven en URL.
DataTable presenta columnas tipadas y Pagination; los datos que solo crecen usan
useCursorList y LoadMore, sin total. Copiá las [columnas de Roles](../../src/areas/business/roles/columns.tsx).
Los límites y estados están en [paginado y listados](../rules/paginado-y-listados.md).

### Errores

Los errores se deciden por code. Cada error tiene un solo lugar: campo, franja de formulario,
aviso de acción directa o pantalla de lectura. QueryClient reúne avisos transversales;
meta.blocksView declara un bloqueo. Un ApiError conserva traceId y retryAfterSeconds.
[Errores](../rules/errores.md) y [formularios](../rules/formularios.md) fijan cómo reintentar,
releer tras un 409 y conservar el borrador sin mezclar operaciones de otra ficha.

### Auth

AuthProvider conserva tokens en memoria y usa un issuer fijo. Callback, canje, renovación
y logout-return corresponden al origen propio. Cambiar de acceso u organización limpia
QueryClient y retira operaciones del contexto anterior.
Las dos puertas comparten LoginPage: `/login` elige Persona y `/login/empresa`, Empresa.
Plataforma solicita su access mediante accessOfPath. Un código es un paso de la pantalla,
sin ruta propia. Ingreso, registro, invitaciones, enlace y recuperación están en
[Identidad](../../../ArquitecturaBaseMutitenant/docs/features/identidad.md).
Los métodos habilitados y países WhatsApp vienen de capacidades de la API.

### Idioma y cultura

resolveCulture elige la cultura habilitada de la cuenta, la elegida en el navegador
o la predeterminada del catálogo. AppProviders aplica esa misma cultura a i18n,
FormatProvider, referencias y Accept-Language. Los textos usan namespaces es/en;
las referencias ya vienen traducidas. [Textos](../rules/textos-y-traducciones.md)
define paridad, voseo y nombres de datos. Los tokens no se guardan en localStorage.

### Fechas y zona

Los instantes viajan con Z y las fechas civiles como yyyy-MM-dd. useFormat presenta
en la zona de la cuenta recibida por `/api/me`, igual en los tres accesos;
sin sesión usa las relaciones del catálogo. Una fecha civil no se convierte.
Los [formatos](../rules/formatos.md) son comunes a pantalla, correo y WhatsApp.

### UI y pantallas

La fuente es el [lienzo vigente](../design/lienzo/README.md), con sus tableros Criterio
y el tablero aprobado de la pantalla. [Tema](tema.md) define tokens y medidas.
ADR y decisiones posteriores del usuario gobiernan conducta; el
[complemento E8/E8b](../design/alineamiento-etapas-8-y-8b.md) registra esos ajustes.

Armá un listado, una ficha o una edición con Page y las piezas existentes.
Una ficha separa grupos en pestañas; con un solo grupo no muestra barra.
Lo corto se edita en diálogo; lo largo, en pantalla propia con useEditForm y useEditPage.
La versión de la lectura inicial y luego la respuesta del guardado gobiernan la edición;
una relectura de fondo no sustituye esa base. FormField contiene control y error;
los campos tipados de shared/ui/fields emiten el contrato común.
[Pantallas](../rules/pantallas-y-ui.md) y [formularios](../rules/formularios.md)
contienen los criterios; no se copian en cada feature.

### Presentación de datos

En tablas, la columna declara el tipo; fuera de ellas se usan DateText, MoneyText,
PhoneText y las demás piezas de shared/ui/format. useFormat sirve para el texto
accesible fuera de JSX. Monedas, culturas, países, zonas y tipos fiscales proceden
del catálogo; el front no calcula dinero. [Formatos](../rules/formatos.md) contiene
el catálogo de tipos, patrones, redondeo visible y vacíos.

### Accesibilidad y diseño adaptable

La misma pantalla elige el marco apropiado: en teléfono, AppBar, BottomNav, ListRow,
Fab y FixedActions; las páginas públicas mantienen marco web. Los tableros M-*
definen los estados móviles. No se hace una segunda versión manual de la pantalla.
Probá 390 px, teclado, foco, nombres accesibles y axe según
[responsive](../rules/responsive.md) y [accesibilidad](../rules/accesibilidad.md).

### Módulos, ediciones simultáneas y altas sin duplicados

[Accesos y permisos](../rules/accesos-y-permisos.md) decide cuándo montar una query;
[formularios](../rules/formularios.md), cuándo conservar o reiniciar versión y borrador;
[datos y API](../rules/datos-y-api.md), cuándo conservar clave y cuándo abandonar un retry.
No se infieren módulos del rol ni se usan consultas privadas para anticipar conteos.

### Tests

Probá lógica, permisos, privacidad, carreras y recorridos con providers reales y MSW.
Los DTO, textos y delegados simples no necesitan tests que repitan su implementación.
Una pantalla prueba los estados que existen, axe y los controles críticos aplicables.
El test vive junto al código; [tests](../rules/tests.md) define fixtures, aislamiento y E2E.

## 5. Cierre

Commiteá cada cambio coherente con tests focales y lint; tsc se verifica al terminar la tarea.
La puerta completa pasa una sola vez: build, lint, suite, contrato, E2E real, detector,
galería de lo nuevo o cambiado y recorrido. Tras un arreglo se corre solo lo afectado.
Las salidas quedan en .local/ y el plan contiene la tabla final.
No se hacen corridas de estabilidad ni revisiones independientes por tarea.
Las [reglas de trabajo](../../AGENTS.md#forma-de-trabajo) gobiernan el cierre.
