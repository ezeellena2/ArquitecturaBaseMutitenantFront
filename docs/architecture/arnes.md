# El arnés del front

> Es el espejo de `../ArquitecturaBaseMutitenant/docs/architecture/arnes.md`: los mismos cuatro niveles, el mismo formato de ficha y la misma verificación. Objetivo: que nadie invente un componente, un formato, un hook o un texto que ya existe.

## 1. Niveles

| Nivel | Dónde |
|---|---|
| 0. Índice | `AGENTS.md` raíz (+ `CLAUDE.md` = `@AGENTS.md`) con la tabla "si vas a tocar X, leé Y" |
| 1. Fichas | `docs/rules/<tema>.md` (formato: Regla · Cómo se hace · Prohibido · Copiá de · Lo verifica · Detalle) |
| 2. Punteros | `AGENTS.md` + `CLAUDE.md` en cada carpeta del mapa (§2), de 3 a 8 líneas |
| 3. Verificación | tests de Vitest, `oxlint`, `tsc` estricto, `format-usage.test.ts`, `parity.test.ts`, `theme-tokens.test.ts`, `harness.test.ts` |

Para una pantalla, el **«Copiá de» es el [tablero correspondiente del lienzo versionado](../design/lienzo/README.md)**; prevalece sobre cualquier descripción textual. Los archivos de código de la columna «Copiá de» muestran la convención de implementación cuando ya existen.

## 2. Mapa de carpetas → punteros

| Carpeta | Qué va / qué no | Fichas | Copiá de |
|---|---|---|---|
| `src/areas/` | una carpeta por área; ningún área importa de otra | estructura-y-features, accesos-y-permisos | `areas/business/roles/` (E4) |
| `src/areas/personal/` | acceso Consumer; Inicio y Cuenta, sin módulos de negocio de la plantilla | personal, accesos-y-permisos, estructura-y-features | receta `docs/rules/personal.md` y ficha funcional Personal del back |
| `src/areas/<área>/<feature>/api/` | query keys + funciones tipadas con `generated/`; sin interfaces a mano | datos-y-api, paginado-y-listados | `business/roles/api/roles.ts` (E4) |
| `src/areas/<área>/<feature>/pages/` | una pantalla = un `Page`; datos con Query; estado del listado en la URL | pantallas-y-ui, paginado-y-listados, errores | tablero correspondiente de `docs/design/lienzo/`; `business/roles/pages/RolesPage.tsx` y `RoleEditorPage.tsx` (E4) para el código |
| `src/areas/<área>/<feature>/components/` | diálogos y piezas propias de la feature; nada genérico (eso sube a `shared/ui`) | formularios, pantallas-y-ui | `personal/account/components/AccountDeletionDialog.tsx` (E4) para un diálogo; `business/roles/components/PermissionPicker.tsx` (E4) para una pieza |
| `src/areas/<área>/<feature>/` (raíz) | `columns.tsx` (columnas **tipadas**), `errors.ts` (por `code`, solo si traduce algo) y `lib/` (lógica pura, con sus tests) | formatos, errores, tests | `business/roles/columns.tsx`, `errors.ts` y `lib/` (E4) |
| `src/shared/format/` | **único** lugar que formatea | formatos | — |
| `src/shared/referenceData/` | carga los cinco catálogos y patrones de `GET /api/reference-data`; sin opciones fijas en código | datos-y-api, formatos, textos-y-traducciones | `useReferenceData.ts` (E1) |
| `src/shared/ui/` | piezas genéricas; shadcn en minúscula y propios en PascalCase; sin lógica de negocio | pantallas-y-ui | `DataTable.tsx`, `Page.tsx` (E1) |
| `src/shared/ui/format/` | cómo se ve cada tipo de dato (`DateText`, `MoneyText`, `PercentText`, `PhoneText`, `StatusBadge`, `EmptyValue`…); no formatea por su cuenta, usa `shared/format` | formatos, telefonos | `MoneyText.tsx` (E1) |
| `src/shared/ui/fields/` | un campo por tipo y selectores de catálogos (`CurrencySelect`, `CountrySelect`, `TimeZoneSelect`, `CultureSelect`, `TaxIdField`); sin listas fijas | formularios, formatos, telefonos, datos-y-api | `MoneyField.tsx`, `CountrySelect.tsx` (E1) |
| `src/shared/phone/` | interpretación telefónica y banderas SVG; los países salen de `shared/referenceData`; `libphonenumber-js` solo acá y en `shared/format` | telefonos | `CountryFlag.tsx` (E1) |
| `src/shared/time/` | la zona efectiva para mostrar instantes UTC (`useEffectiveTimeZone`) y la del navegador; no formatea: eso es `shared/format` | formatos | `useEffectiveTimeZone.ts` (E3) |
| `src/shared/account/` | lo de la cuenta que usan varias áreas (ADR 0033): agregar y cambiar un método de ingreso, el aviso de método propio; Mi cuenta y el Inicio personal lo importan de acá | formularios, pantallas-y-ui | `AddLoginMethodDialog.tsx` |
| `src/shared/platform/` | piezas que usan varias features de Plataforma; la confirmación con motivo y fecha civil opcional; sin APIs de un área | formularios, errores, pantallas-y-ui, accesibilidad | `ReasonDialog.tsx` (E5) |
| `src/shared/api/` | httpClient, errores, los avisos comunes (`queryClient`, `errorMessage`), `useIdempotentMutation` y tipos generados (`generated/` no se edita) | datos-y-api, errores | — |
| `src/shared/hooks/` | hooks compartidos, cada uno con su test: el listado paginado (`usePagedQuery`, sobre `usePagination` y `useFilters`), la edición (`useEditForm`, con la versión de lo que se edita, y `useEditPage`, sobre `useUnsavedChangesGuard`), `useQueryUpdate`, foco y debounce; no se reinventan en una feature | paginado-y-listados, formularios | `usePagedQuery.ts` y `useEditPage.tsx`; `usePagination.ts` (E0); `useCursorList.ts` y `useDebouncedValue.ts` (E1) |
| `src/locales/` | un namespace por módulo, es = en | textos-y-traducciones | `es/roles.json` (E4) |
| `src/auth/`, `src/tenancy/` | sesión, accesos, cambio de acceso u organización, permisos | accesos-y-permisos | — |
| `src/layouts/` | layouts por área y navegación declarativa | accesos-y-permisos, pantallas-y-ui | `navigation/business.ts` (E3) |
| `src/test/` | setup mínimo en E0; MSW en E1 y fixtures de `/api/me` en E3 | tests | `mocks/currentUsers.ts` (E3) |

La regla canónica de esos catálogos está en [datos de referencia del back](../../../ArquitecturaBaseMutitenant/docs/rules/datos-de-referencia.md) (ADR 0036). Los punteros de `shared/referenceData` y de los selectores se crean en E1 junto con sus carpetas.

## 3. "Si vas a tocar X, leé Y"

La tabla vive solo en el [`AGENTS.md` raíz](../../AGENTS.md#antes-de-escribir-código-el-arnés) y no se copia acá. Una ficha nueva suma su fila ahí, en el mismo commit.

## 4. Verificación del arnés

`src/test/harness.test.ts` usa la lista explícita `ClosedStages`, que se actualiza al cerrar cada etapa sin asumir continuidad numérica. Un «Copiá de» marcado `(E#)` se exige solo cuando esa etapa está cerrada; un rango se exige cuando todas las etapas incluidas cerraron. El test falla si:
- una carpeta del mapa que ya existe no tiene `AGENTS.md` y `CLAUDE.md`;
- hay un enlace roto en un puntero o en una ficha;
- una ficha no tiene sus secciones;
- un "Lo verifica" nombra un test cuya etapa `(E#)` ya cerró y que no existe. Los tests de etapas futuras pueden no existir todavía;
- un `pages/*Page.test.tsx` no corre axe ([accesibilidad](../rules/accesibilidad.md)).

Hasta que ambos repos estén en GitHub, cada CI usa solo su propio checkout. Los enlaces al repo hermano se verifican cuando ese checkout está presente; el checkout cruzado y su verificación obligatoria se incorporan cuando ambos repos estén en GitHub.

## 5. Cadencia de verificación

Cada cambio coherente se cierra con un test focal rojo/verde cuando hay lógica y con las comprobaciones de build y lint del alcance afectado en verde antes del commit. La puerta de etapa ejecuta `npm run build`, `npm run lint`, `npm test` y `npm run contracts:check` completos; el CI corre los mismos, pero salta `contracts:check` porque descarga un solo repo: el chequeo cruzado llega con la Etapa 10 (ADR 0016). La puerta de etapa conserva además el E2E real desde E3a y la comparación visual con el tablero aprobado. Para una pantalla nueva, los tests cubren solo los estados y recorridos que realmente existen, además de los controles críticos aplicables de [tests](../rules/tests.md).

Mantenimiento: igual que en el back ([arnes.md §6](../../../ArquitecturaBaseMutitenant/docs/architecture/arnes.md#6-mantenimiento)).
