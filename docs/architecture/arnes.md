# El arnés del front

> Es el espejo de `../ArquitecturaBaseMutitenant/docs/architecture/arnes.md`: los mismos cuatro niveles, el mismo formato de ficha y la misma verificación. Objetivo: que nadie invente un componente, un formato, un hook o un texto que ya existe.

## 1. Niveles

| Nivel | Dónde |
|---|---|
| 0. Índice | `AGENTS.md` raíz (+ `CLAUDE.md` = `@AGENTS.md`) con la tabla "si vas a tocar X, leé Y" |
| 1. Fichas | `docs/rules/<tema>.md` (formato: Regla · Cómo se hace · Prohibido · Copiá de · Lo verifica · Detalle) |
| 2. Punteros | `AGENTS.md` + `CLAUDE.md` en cada carpeta del mapa (§2), de 3 a 8 líneas |
| 3. Verificación | tests de Vitest, `oxlint`, `tsc` estricto, `format-usage.test.ts`, `parity.test.ts`, `harness.test.ts` |

## 2. Mapa de carpetas → punteros

| Carpeta | Qué va / qué no | Fichas | Copiá de |
|---|---|---|---|
| `src/areas/` | una carpeta por área; ningún área importa de otra | estructura-y-features, accesos-y-permisos | `areas/business/roles/` |
| `src/areas/<área>/<feature>/api/` | query keys + funciones tipadas con `generated/`; sin interfaces a mano | datos-y-api, paginado-y-listados | `business/roles/api/roles.ts` |
| `src/areas/<área>/<feature>/pages/` | una pantalla = un `Page`; datos con Query; estado del listado en la URL | pantallas-y-ui, paginado-y-listados, errores | `business/roles/pages/RolesPage.tsx` |
| `src/areas/<área>/<feature>/components/` | diálogos y piezas propias de la feature; nada genérico (eso sube a `shared/ui`) | formularios, pantallas-y-ui | `business/users/components/InviteUserDialog.tsx` |
| `src/areas/<área>/<feature>/` (raíz) | `columns.tsx` (columnas **tipadas**) y `errors.ts` (switch por `code`) | formatos, errores | `business/roles/columns.tsx`, `errors.ts` |
| `src/shared/format/` | **único** lugar que formatea | formatos | — |
| `src/shared/ui/` | piezas genéricas; shadcn en minúscula y propios en PascalCase; sin lógica de negocio | pantallas-y-ui | `DataTable.tsx`, `Page.tsx` |
| `src/shared/ui/format/`, `src/shared/ui/fields/` | cómo se ve y cómo se carga cada tipo de dato | formatos, formularios | `MoneyText.tsx`, `MoneyField.tsx` |
| `src/shared/phone/` | países, banderas SVG y `CountrySelect`; `libphonenumber-js` solo acá y en `shared/format` | telefonos | `CountrySelect.tsx` |
| `src/shared/ui/fields/` | un campo por tipo de dato (email, teléfono, CUIT, dinero, fecha…) | formularios, formatos, telefonos | `MoneyField.tsx` |
| `src/shared/api/` | httpClient, errores y tipos generados (`generated/` no se edita) | datos-y-api, errores | — |
| `src/locales/` | un namespace por módulo, es = en | textos-y-traducciones | `es/roles.json` |
| `src/auth/`, `src/tenancy/` | sesión, accesos, cambio de acceso u organización, permisos | accesos-y-permisos | — |
| `src/layouts/` | layouts por área y navegación declarativa | accesos-y-permisos, pantallas-y-ui | `navigation/business.ts` |
| `src/test/` | setup, MSW, fixtures de `/api/me` | tests | `mocks/currentUsers.ts` |

## 3. "Si vas a tocar X, leé Y" (en el `AGENTS.md` raíz)

| Si vas a… | Leé |
|---|---|
| mostrar una fecha, número, monto, % o vacío | `docs/rules/formatos.md` |
| hacer un listado | `paginado-y-listados.md` |
| llamar a la API o tipar un dato | `datos-y-api.md` |
| manejar un error | `errores.md` |
| hacer un formulario o diálogo | `formularios.md` |
| escribir un texto | `textos-y-traducciones.md` |
| decidir el acceso de una pantalla u ocultar algo por permiso | `accesos-y-permisos.md` |
| armar una pantalla | `pantallas-y-ui.md` (y **dibujarla primero**) |
| crear una feature | `estructura-y-features.md` |
| escribir tests | `tests.md` |

## 4. Verificación del arnés

`src/test/harness.test.ts` falla si:
- una carpeta del mapa que ya existe no tiene `AGENTS.md` y `CLAUDE.md`;
- hay un enlace roto en un puntero o en una ficha;
- una ficha no tiene sus secciones;
- un "Lo verifica" nombra un test que no existe (salvo `Pendiente:`).

Mantenimiento: igual que en el back ([arnes.md §6](../../../ArquitecturaBaseMutitenant/docs/architecture/arnes.md#6-mantenimiento)).
