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

Decisión del usuario (2026-10-11): cada raíz de capa, área, módulo, proyecto y shared/ lleva AGENTS.md (hasta tres líneas: responsabilidad, ficha, modelo) y CLAUDE.md (`@AGENTS.md`). Las subcarpetas api/, pages/, components/ y tabs/ de una feature del front heredan su puntero.

| Carpeta | Qué va | Fichas | Copiá de | Puntero |
|---|---|---|---|---|
| `src/` | Piezas de la SPA. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/App.tsx` | [AGENTS.md](../../src/AGENTS.md) |
| `src/app/` | Piezas de la SPA. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/app/RequirePermission.tsx` | [AGENTS.md](../../src/app/AGENTS.md) |
| `src/areas/` | una carpeta por área. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/business/audit/api/audit.ts` | [AGENTS.md](../../src/areas/AGENTS.md) |
| `src/areas/business/` | Piezas de la SPA. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/business/AGENTS.md) |
| `src/areas/business/audit/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/business/audit/AGENTS.md) |
| `src/areas/business/companies/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/business/companies/AGENTS.md) |
| `src/areas/business/home/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/business/home/AGENTS.md) |
| `src/areas/business/public-page/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/business/public-page/AGENTS.md) |
| `src/areas/business/roles/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/business/roles/AGENTS.md) |
| `src/areas/business/settings/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/business/settings/AGENTS.md) |
| `src/areas/business/users/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/business/users/AGENTS.md) |
| `src/areas/personal/` | acceso Consumer. | [personal.md](../rules/personal.md) | `docs/rules/personal.md` | [AGENTS.md](../../src/areas/personal/AGENTS.md) |
| `src/areas/personal/account/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/personal/account/AGENTS.md) |
| `src/areas/personal/home/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/personal/home/AGENTS.md) |
| `src/areas/platform/` | Piezas de la SPA. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/platform/AGENTS.md) |
| `src/areas/platform/accounts/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/platform/accounts/AGENTS.md) |
| `src/areas/platform/audit/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/platform/audit/AGENTS.md) |
| `src/areas/platform/home/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/platform/home/AGENTS.md) |
| `src/areas/platform/legal/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/platform/legal/AGENTS.md) |
| `src/areas/platform/recoveries/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/platform/recoveries/AGENTS.md) |
| `src/areas/platform/settings/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/platform/settings/AGENTS.md) |
| `src/areas/platform/tenants/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/platform/tenants/AGENTS.md) |
| `src/areas/public/` | Piezas de la SPA. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/public/AGENTS.md) |
| `src/areas/public/auth/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/public/auth/AGENTS.md) |
| `src/areas/public/errors/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/public/errors/AGENTS.md) |
| `src/areas/public/legal/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/public/legal/AGENTS.md) |
| `src/areas/public/site/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/public/site/AGENTS.md) |
| `src/areas/storefront/` | Piezas de la SPA. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/storefront/AGENTS.md) |
| `src/areas/storefront/site/` | Feature: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/storefront/site/AGENTS.md) |
| `src/auth/` | sesión, accesos, cambio de acceso u organización, permisos. | [accesos-y-permisos.md](../rules/accesos-y-permisos.md) | `src/auth/AccessRoute.tsx` | [AGENTS.md](../../src/auth/AGENTS.md) |
| `src/layouts/` | layouts por área y navegación declarativa. | [accesos-y-permisos.md](../rules/accesos-y-permisos.md) | `src/layouts/navigation/business.ts` | [AGENTS.md](../../src/layouts/AGENTS.md) |
| `src/locales/` | un namespace por módulo, es = en. | [textos-y-traducciones.md](../rules/textos-y-traducciones.md) | `src/locales/es/roles.json` | [AGENTS.md](../../src/locales/AGENTS.md) |
| `src/modules/assistant/` | implementación quitable. | [asistente.md](../../../ArquitecturaBaseMutitenant/docs/features/asistente.md) | `src/modules/assistant/registration.ts` | [AGENTS.md](../../src/modules/assistant/AGENTS.md) |
| `src/modules/assistant/usage/` | Piezas de la SPA. | [asistente.md](../../../ArquitecturaBaseMutitenant/docs/features/asistente.md) | `src/modules/assistant/usage/AssistantUsagePage.tsx` | [AGENTS.md](../../src/modules/assistant/usage/AGENTS.md) |
| `src/shared/` | Piezas de la SPA. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/shared/account/AddLoginMethodDialog.tsx` | [AGENTS.md](../../src/shared/AGENTS.md) |
| `src/shared/account/` | lo de la cuenta que usan varias áreas (ADR 0033): agregar y. | [formularios.md](../rules/formularios.md) | `src/shared/account/AddLoginMethodDialog.tsx` | [AGENTS.md](../../src/shared/account/AGENTS.md) |
| `src/shared/api/` | httpClient, errores, los avisos comunes (queryClient, errorMessage), useIdempotentMutation y tipos generados (generated/. | [datos-y-api.md](../rules/datos-y-api.md) | `src/shared/api/ApiError.ts` | [AGENTS.md](../../src/shared/api/AGENTS.md) |
| `src/shared/format/` | **único** lugar que formatea. | [formatos.md](../rules/formatos.md) | `src/shared/format/cultureName.ts` | [AGENTS.md](../../src/shared/format/AGENTS.md) |
| `src/shared/hooks/` | hooks compartidos, cada uno con su test: el listado paginado (usePagedQuery, sobre. | [paginado-y-listados.md](../rules/paginado-y-listados.md) | `src/shared/hooks/usePagedQuery.ts` | [AGENTS.md](../../src/shared/hooks/AGENTS.md) |
| `src/shared/modules/` | contratos y composición neutrales de rutas, navegación, inicio y UI de organización. | [estructura-y-features.md](../rules/estructura-y-features.md) | `src/shared/modules/ModuleRegistry.tsx` | [AGENTS.md](../../src/shared/modules/AGENTS.md) |
| `src/shared/phone/` | interpretación telefónica y banderas SVG. | [telefonos.md](../rules/telefonos.md) | `src/shared/phone/CountryFlag.tsx` | [AGENTS.md](../../src/shared/phone/AGENTS.md) |
| `src/shared/platform/` | piezas que usan varias features de Plataforma. | [formularios.md](../rules/formularios.md) | `src/shared/platform/ReasonDialog.tsx` | [AGENTS.md](../../src/shared/platform/AGENTS.md) |
| `src/shared/referenceData/` | carga los cinco catálogos y patrones de GET /api/reference-data. | [datos-y-api.md](../rules/datos-y-api.md) | `src/shared/referenceData/useReferenceData.ts` | [AGENTS.md](../../src/shared/referenceData/AGENTS.md) |
| `src/shared/time/` | la zona efectiva para mostrar instantes UTC (useEffectiveTimeZone) y la del navegador. | [formatos.md](../rules/formatos.md) | `src/shared/time/useEffectiveTimeZone.ts` | [AGENTS.md](../../src/shared/time/AGENTS.md) |
| `src/shared/ui/` | piezas genéricas. | [pantallas-y-ui.md](../rules/pantallas-y-ui.md) | `src/shared/ui/DataTable.tsx` | [AGENTS.md](../../src/shared/ui/AGENTS.md) |
| `src/shared/ui/fields/` | un campo por tipo (TaxIdNumberField para un número fiscal) y selectores de. | [formularios.md](../rules/formularios.md) | `src/shared/ui/fields/MoneyField.tsx` | [AGENTS.md](../../src/shared/ui/fields/AGENTS.md) |
| `src/shared/ui/format/` | cómo se ve cada tipo de dato (DateText, MoneyText, PercentText, PhoneText, StatusBadge. | [formatos.md](../rules/formatos.md) | `src/shared/ui/format/MoneyText.tsx` | [AGENTS.md](../../src/shared/ui/format/AGENTS.md) |
| `src/tenancy/` | sesión, accesos, cambio de acceso u organización, permisos. | [accesos-y-permisos.md](../rules/accesos-y-permisos.md) | `src/tenancy/AccessMenu.tsx` | [AGENTS.md](../../src/tenancy/AGENTS.md) |
| `src/test/` | setup mínimo en E0. | [tests.md](../rules/tests.md) | `src/test/mocks/currentUsers.ts` | [AGENTS.md](../../src/test/AGENTS.md) |
