# Mapa de carpetas

El árbol ubica responsabilidades. Solo enumera archivos que sirven como modelo para copiar; agregar un archivo a una carpeta existente no requiere actualizarlo. Las carpetas de historia, contratos y diseño se muestran sin desglosar sus contenidos.

## Raíz

```text
├── .artifacts/
│   └── etapa-5-propuesta/
├── .github/
│   └── workflows/
├── contracts/
├── docs/
│   ├── architecture/
│   ├── design/
│   ├── plans/
│   ├── rules/  fichas del arnés: README + 14 temas, incluida personal.md (receta front y ficha funcional del back)
│   └── specs/
├── public/
├── scripts/
│   └── recorrido-lienzo/  recorrido del lienzo tablero por tablero (recorrido.mjs) y vista en vivo de una pantalla junto a su tablero (vivo.mjs)
└── src/  ver abajo
    ├── app/
    ├── areas/
    │   ├── business/  ACCESO B2B (la organización)
    │   │   ├── audit/
    │   │   │   ├── api/
    │   │   │   └── pages/
    │   │   ├── companies/
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   ├── pages/
    │   │   │   └── tabs/
    │   │   ├── home/  inicio de la organización (ADR 0040)
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   └── pages/
    │   │   ├── public-page/  /org/pagina: mi página pública (datos, cambio de slug, publicar)
    │   │   │   ├── api/
    │   │   │   └── pages/
    │   │   ├── roles/  ← FEATURE DE REFERENCIA
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   ├── lib/
    │   │   │   └── pages/
    │   │   │       └── RolesPage.tsx  pantalla de referencia
    │   │   ├── settings/  /org/configuracion
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   └── pages/
    │   │   └── users/
    │   │       ├── api/
    │   │       ├── components/
    │   │       ├── lib/
    │   │       └── pages/
    │   ├── personal/  ACCESO B2C (espacio personal); receta docs/rules/personal.md → ficha funcional Personal del back
    │   │   ├── account/  la cuenta de la identidad: conserva el marco del acceso activo
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   └── pages/
    │   │   └── home/
    │   │       └── pages/
    │   ├── platform/  ÁREA PLATAFORMA
    │   │   ├── accounts/  /plataforma/cuentas: cuentas y operadores
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   ├── pages/
    │   │   │   └── tabs/
    │   │   ├── audit/  /plataforma/auditoria
    │   │   │   ├── api/
    │   │   │   └── pages/
    │   │   ├── home/
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   └── pages/
    │   │   ├── legal/  /plataforma/legales: términos y privacidad (P7)
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   ├── lib/
    │   │   │   └── pages/
    │   │   ├── recoveries/  /plataforma/recuperaciones: pedidos de «Recuperar mi cuenta» (ADR 0033)
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   └── pages/
    │   │   ├── settings/  /plataforma/configuracion
    │   │   │   ├── api/
    │   │   │   └── pages/
    │   │   └── tenants/
    │   │       ├── api/
    │   │       ├── components/
    │   │       ├── pages/
    │   │       └── tabs/  Historial/Dueños T21c y Módulos/Dominio/Página pública T21d
    │   ├── public/  dominio principal, sin sesión o con cualquier acceso
    │   │   ├── auth/
    │   │   │   ├── api/
    │   │   │   ├── components/
    │   │   │   ├── lib/
    │   │   │   └── pages/
    │   │   ├── errors/
    │   │   │   └── pages/
    │   │   ├── legal/  P7
    │   │   │   ├── api/
    │   │   │   └── pages/
    │   │   └── site/  portada y directorio del dominio principal (Landing/Landing-Movil, Directorio/M-Directorio)
    │   │       ├── api/
    │   │       ├── components/
    │   │       └── pages/
    │   └── storefront/  SUBDOMINIO válido: sólo lo publicado, sin administración; no elige el tenant privado
    │       └── site/  feature normal; API/keys en tenancy/usePublicSite, sin crossimports
    │           └── pages/
    ├── assets/
    │   └── fonts/
    ├── auth/
    ├── features/
    │   ├── companies/
    │   ├── members/
    │   ├── profile/
    │   ├── reports/
    │   ├── roles/
    │   ├── settings/
    │   └── users/
    ├── layouts/
    │   ├── components/
    │   └── navigation/
    ├── locales/  un namespace por módulo; es y en con las mismas claves
    │   ├── en/  mismos archivos
    │   └── es/
    ├── modules/
    │   └── assistant/
    │       ├── api/
    │       ├── components/
    │       ├── hooks/
    │       ├── lib/
    │       ├── pages/
    │       ├── policy/
    │       ├── runtime/
    │       ├── settings/
    │       └── usage/
    ├── platform/
    │   ├── api/
    │   ├── app/
    │   ├── context/
    │   ├── features/
    │   │   ├── accessLost/
    │   │   ├── audit/
    │   │   ├── profile/
    │   │   ├── tenants/
    │   │   └── whatsApp/
    │   └── layouts/
    ├── shared/
    │   ├── account/  lo de la cuenta que usan varias áreas (ADR 0033)
    │   │   └── api/
    │   ├── api/
    │   │   ├── generated/  NO SE EDITA A MANO
    │   │   └── httpClient.ts  cliente HTTP común
    │   ├── format/  ÚNICO lugar que formatea (formatos.md)
    │   ├── hooks/  de la base solo los hooks sin dependencias de etapas posteriores; cada uno con su test
    │   ├── i18n/
    │   ├── lib/
    │   ├── modules/
    │   ├── phone/  interpretación telefónica; países desde shared/referenceData
    │   ├── platform/  piezas compartidas por las features de Plataforma
    │   ├── referenceData/  cinco catálogos de GET /api/reference-data
    │   ├── time/  zona efectiva de cuenta/empresa/organización
    │   │   ├── api/
    │   │   └── components/
    │   └── ui/  solo primitivas shadcn independientes de la base y piezas nuevas sin dependencias posteriores; al copiarlas, --color-* pasa a los tokens de tema.md
    │       ├── app/  el marco de app del teléfono (tableros M-*, «Criterio · Marco y pantallas»)
    │       ├── fields/  cómo se CARGA cada dato (parsea la cultura y emite el contrato)
    │       └── format/  cómo se VE cada dato (siempre por acá)
    ├── tenancy/  accesos (B2C / B2B / plataforma)
    │   ├── api/
    │   └── components/
    └── test/
        ├── mocks/  no se copia en E0
        └── utils/
```

## Mapa de carpetas → punteros


| Carpeta | Qué va / qué no | Fichas | Copiá de |
|---|---|---|---|
| `src/areas/` | una carpeta por área; ningún área importa de otra | estructura-y-features, accesos-y-permisos | `areas/business/roles/` (E4) |
| `src/modules/<módulo>/` | implementación quitable; registro concreto sólo en `app/moduleComposition.ts`; el núcleo no la importa | estructura-y-features, datos-y-api, accesos-y-permisos | `modules/assistant/registration.ts` y su `AGENTS.md` |
| `src/shared/modules/` | contratos y composición neutrales de rutas, navegación, inicio y UI de organización; guardas antes de React.lazy | estructura-y-features, accesos-y-permisos | `ModuleRegistry.tsx`, `types.ts` y `AGENTS.md` |
| `src/areas/personal/` | acceso Consumer; Inicio y Cuenta, sin módulos de negocio de la plantilla | personal, accesos-y-permisos, estructura-y-features | receta `docs/rules/personal.md` y ficha funcional Personal del back |
| `src/areas/<área>/<feature>/api/` | query keys + funciones tipadas con `generated/`; sin interfaces a mano | datos-y-api, paginado-y-listados | `business/roles/api/roles.ts` (E4) |
| `src/areas/<área>/<feature>/pages/` | una pantalla = un `Page`; datos con Query; estado del listado en la URL | pantallas-y-ui, paginado-y-listados, errores | tablero correspondiente de `docs/design/lienzo/`; `business/roles/pages/RolesPage.tsx` y `RoleEditorPage.tsx` (E4) para el código |
| `src/areas/<área>/<feature>/components/` | diálogos y piezas propias de la feature; nada genérico (eso sube a `shared/ui`) | formularios, pantallas-y-ui | `personal/account/components/AccountDeletionDialog.tsx` (E4) para un diálogo; `business/roles/components/PermissionPicker.tsx` (E4) para una pieza |
| `src/areas/<área>/<feature>/` (raíz) | `columns.tsx` (columnas **tipadas**), `errors.ts` (por `code`, solo si traduce algo) y `lib/` (lógica pura, con sus tests) | formatos, errores, tests | `business/roles/columns.tsx`, `errors.ts` y `lib/` (E4) |
| `src/shared/format/` | **único** lugar que formatea | formatos | — |
| `src/shared/referenceData/` | carga los cinco catálogos y patrones de `GET /api/reference-data`; sin opciones fijas en código | datos-y-api, formatos, textos-y-traducciones | `useReferenceData.ts` (E1) |
| `src/shared/ui/` | piezas genéricas; shadcn en minúscula y propios en PascalCase; sin lógica de negocio | pantallas-y-ui | `DataTable.tsx`, `Page.tsx` (E1) |
| `src/shared/ui/format/` | cómo se ve cada tipo de dato (`DateText`, `MoneyText`, `PercentText`, `PhoneText`, `StatusBadge`, `EmptyValue`…); no formatea por su cuenta, usa `shared/format` | formatos, telefonos | `MoneyText.tsx` (E1) |
| `src/shared/ui/fields/` | un campo por tipo (`TaxIdNumberField` para un número fiscal) y selectores de catálogos (`CurrencySelect`, `CountrySelect`, `TimeZoneSelect`, `CultureSelect`); sin listas fijas | formularios, formatos, telefonos, datos-y-api | `MoneyField.tsx`, `CountrySelect.tsx` (E1) |
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

