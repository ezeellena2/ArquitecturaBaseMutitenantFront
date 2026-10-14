# Mapa de carpetas

El árbol ubica responsabilidades. Solo enumera archivos que sirven como modelo para copiar; agregar un archivo a una carpeta existente no requiere actualizarlo. Las carpetas de historia, contratos y diseño se muestran sin desglosar sus contenidos.

## Raíz

```text
├── .github/
│   └── workflows/
├── docs/
│   ├── architecture/
│   ├── design/
│   ├── rules/  fichas del arnés: README + 14 temas, incluida personal.md (receta front y ficha funcional del back)
├── public/
├── scripts/
│   ├── capturas/  casos de cada etapa
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
    ├── auth/
    ├── layouts/
    │   ├── components/
    │   └── navigation/
    ├── locales/  un namespace por módulo; es y en con las mismas claves
    │   ├── en/  mismos archivos
    │   └── es/
    ├── modules/
    │   ├── assistant/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── lib/
    │   │   ├── locales/  textos y enums propios, aportados por registration.ts
    │   │   │   ├── en/
    │   │   │   └── es/
    │   │   ├── pages/
    │   │   ├── policy/
    │   │   ├── runtime/
    │   │   ├── settings/
    │   │   ├── test/  fixtures de pruebas y galería; registro sólo en DEV
    │   │   └── usage/
    │   └── whatsapp/  una carpeta por área (numbers, chats, contacts, broadcasts, bot, teams, templates, personal, phones), cada una con su routes.ts
    │       ├── api/  alias del schema (types.ts) y el contador del menú
    │       ├── components/  piezas que comparten las áreas
    │       └── locales/  un archivo por área en el namespace whatsapp y sus enums
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
    │   └── ui/  solo primitivas shadcn independientes de la base y piezas nuevas sin dependencias posteriores; al copiarlas, --color-* pasa a los tokens de tema.md
    │       ├── app/  el marco de app del teléfono (tableros M-*, «Criterio · Marco y pantallas»)
    │       ├── fields/  cómo se CARGA cada dato (parsea la cultura y emite el contrato)
    │       └── format/  cómo se VE cada dato (siempre por acá)
    ├── tenancy/  accesos (B2C / B2B / plataforma)
    └── test/
        ├── mocks/  no se copia en E0
        └── utils/
```

## Mapa de carpetas → punteros

Decisión del usuario (2026-10-11): cada raíz de capa, área, módulo, proyecto y shared/ lleva AGENTS.md (hasta tres líneas: responsabilidad, ficha, modelo) y CLAUDE.md (`@AGENTS.md`). Las subcarpetas api/, pages/, components/ y tabs/ de una feature del front heredan su puntero.

| Carpeta | Qué va | Fichas | Copiá de | Puntero |
|---|---|---|---|---|
| `src/` | SPA: composición en app/, accesos en areas/, módulos opcionales en modules/ y piezas comunes en shared/. | [docs/rules/estructura-y-features.md](../rules/estructura-y-features.md) | `src/App.tsx` | [AGENTS.md](../../src/AGENTS.md) |
| `src/app/` | Composición de la SPA, rutas, providers y navegación. | [docs/rules/estructura-y-features.md](../rules/estructura-y-features.md) | `src/app/RequirePermission.tsx` | [AGENTS.md](../../src/app/AGENTS.md) |
| `src/areas/` | Áreas de acceso: público, sitio de organización, persona, empresa y Plataforma. | [docs/rules/estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/business/audit/api/audit.ts` | [AGENTS.md](../../src/areas/AGENTS.md) |
| `src/areas/business/` | Features del acceso empresarial. | [docs/rules/estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/business/audit/api/audit.ts` | [AGENTS.md](../../src/areas/business/AGENTS.md) |
| `src/areas/business/audit/` | Feature audit: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/rules/formatos.md](../rules/formatos.md) | `src/areas/business/audit/api/audit.ts` | [AGENTS.md](../../src/areas/business/audit/AGENTS.md) |
| `src/areas/business/companies/` | Feature companies: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/organizaciones.md](../../../ArquitecturaBaseMutitenant/docs/features/organizaciones.md) | `src/areas/business/companies/api/companies.ts` | [AGENTS.md](../../src/areas/business/companies/AGENTS.md) |
| `src/areas/business/home/` | Feature home: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/inicio.md](../../../ArquitecturaBaseMutitenant/docs/features/inicio.md) | `src/areas/business/home/api/home.ts` | [AGENTS.md](../../src/areas/business/home/AGENTS.md) |
| `src/areas/business/public-page/` | Feature public-page: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/business/public-page/api/publicPage.ts` | [AGENTS.md](../../src/areas/business/public-page/AGENTS.md) |
| `src/areas/business/roles/` | Feature roles: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/roles.md](../../../ArquitecturaBaseMutitenant/docs/features/roles.md) | `src/areas/business/roles/api/roles.ts` | [AGENTS.md](../../src/areas/business/roles/AGENTS.md) |
| `src/areas/business/settings/` | Feature settings: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/rules/formatos.md](../rules/formatos.md) | `src/areas/business/settings/api/settings.ts` | [AGENTS.md](../../src/areas/business/settings/AGENTS.md) |
| `src/areas/business/users/` | Feature users: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/organizaciones.md](../../../ArquitecturaBaseMutitenant/docs/features/organizaciones.md) | `src/areas/business/users/api/users.ts` | [AGENTS.md](../../src/areas/business/users/AGENTS.md) |
| `src/areas/personal/` | Features del acceso personal. | [docs/rules/personal.md](../rules/personal.md) | `src/areas/personal/account/api/account.test.ts` | [AGENTS.md](../../src/areas/personal/AGENTS.md) |
| `src/areas/personal/account/` | Feature account: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/identidad.md](../../../ArquitecturaBaseMutitenant/docs/features/identidad.md) | `src/areas/personal/account/api/account.ts` | [AGENTS.md](../../src/areas/personal/account/AGENTS.md) |
| `src/areas/personal/home/` | Feature home: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/inicio.md](../../../ArquitecturaBaseMutitenant/docs/features/inicio.md) | `src/areas/personal/home/pages/PersonalHomePage.tsx` | [AGENTS.md](../../src/areas/personal/home/AGENTS.md) |
| `src/areas/platform/` | Features del acceso de Plataforma. | [docs/features/plataforma.md](../../../ArquitecturaBaseMutitenant/docs/features/plataforma.md) | `src/areas/platform/accounts/api/accounts.ts` | [AGENTS.md](../../src/areas/platform/AGENTS.md) |
| `src/areas/platform/accounts/` | Feature accounts: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/plataforma.md](../../../ArquitecturaBaseMutitenant/docs/features/plataforma.md) | `src/areas/platform/accounts/api/accounts.ts` | [AGENTS.md](../../src/areas/platform/accounts/AGENTS.md) |
| `src/areas/platform/audit/` | Feature audit: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/rules/formatos.md](../rules/formatos.md) | `src/areas/platform/audit/api/securityEvents.ts` | [AGENTS.md](../../src/areas/platform/audit/AGENTS.md) |
| `src/areas/platform/home/` | Feature home: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/inicio.md](../../../ArquitecturaBaseMutitenant/docs/features/inicio.md) | `src/areas/platform/home/api/pending.ts` | [AGENTS.md](../../src/areas/platform/home/AGENTS.md) |
| `src/areas/platform/legal/` | Feature legal: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/rules/formatos.md](../rules/formatos.md) | `src/areas/platform/legal/api/legalDocuments.ts` | [AGENTS.md](../../src/areas/platform/legal/AGENTS.md) |
| `src/areas/platform/recoveries/` | Feature recoveries: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/plataforma.md](../../../ArquitecturaBaseMutitenant/docs/features/plataforma.md) | `src/areas/platform/recoveries/api/recoveries.ts` | [AGENTS.md](../../src/areas/platform/recoveries/AGENTS.md) |
| `src/areas/platform/settings/` | Feature settings: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/rules/formatos.md](../rules/formatos.md) | `src/areas/platform/settings/api/platformSettings.ts` | [AGENTS.md](../../src/areas/platform/settings/AGENTS.md) |
| `src/areas/platform/tenants/` | Feature tenants: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/plataforma.md](../../../ArquitecturaBaseMutitenant/docs/features/plataforma.md) | `src/areas/platform/tenants/api/tenants.ts` | [AGENTS.md](../../src/areas/platform/tenants/AGENTS.md) |
| `src/areas/public/` | Features del acceso público. | [docs/rules/estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/public/auth/api/businessSignup.ts` | [AGENTS.md](../../src/areas/public/AGENTS.md) |
| `src/areas/public/auth/` | Feature auth: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/identidad.md](../../../ArquitecturaBaseMutitenant/docs/features/identidad.md) | `src/areas/public/auth/api/businessSignup.ts` | [AGENTS.md](../../src/areas/public/auth/AGENTS.md) |
| `src/areas/public/errors/` | Feature errors: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/rules/formatos.md](../rules/formatos.md) | `src/areas/public/errors/pages/ErrorPageFrame.tsx` | [AGENTS.md](../../src/areas/public/errors/AGENTS.md) |
| `src/areas/public/legal/` | Feature legal: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/rules/formatos.md](../rules/formatos.md) | `src/areas/public/legal/api/acceptance.ts` | [AGENTS.md](../../src/areas/public/legal/AGENTS.md) |
| `src/areas/public/site/` | Feature site: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/public/site/api/directory.ts` | [AGENTS.md](../../src/areas/public/site/AGENTS.md) |
| `src/areas/storefront/` | Features del acceso al sitio de una organización. | [docs/rules/estructura-y-features.md](../rules/estructura-y-features.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/storefront/AGENTS.md) |
| `src/areas/storefront/site/` | Feature site: api/ llama a la API; pages/ contiene pantallas; components/ sus piezas; tabs/ sus pestañas. | [docs/features/sitio-publico.md](../../../ArquitecturaBaseMutitenant/docs/features/sitio-publico.md) | `src/areas/storefront/site/pages/PublicPage.tsx` | [AGENTS.md](../../src/areas/storefront/site/AGENTS.md) |
| `src/auth/` | Componentes y servicios de . | [docs/rules/accesos-y-permisos.md](../rules/accesos-y-permisos.md) | `src/auth/AccessRoute.tsx` | [AGENTS.md](../../src/auth/AGENTS.md) |
| `src/layouts/` | Componentes y servicios de . | [docs/rules/accesos-y-permisos.md](../rules/accesos-y-permisos.md) | `src/layouts/navigation/business.ts` | [AGENTS.md](../../src/layouts/AGENTS.md) |
| `src/locales/` | Componentes y servicios de . | [docs/rules/textos-y-traducciones.md](../rules/textos-y-traducciones.md) | `src/locales/es/roles.json` | [AGENTS.md](../../src/locales/AGENTS.md) |
| `src/modules/assistant/` | Componentes y servicios de assistant. | [docs/features/asistente.md](../../../ArquitecturaBaseMutitenant/docs/features/asistente.md) | `src/modules/assistant/registration.ts` | [AGENTS.md](../../src/modules/assistant/AGENTS.md) |
| `src/modules/assistant/usage/` | Pantallas y componentes de uso del asistente. | [docs/features/asistente.md](../../../ArquitecturaBaseMutitenant/docs/features/asistente.md) | `src/modules/assistant/usage/AssistantUsagePage.tsx` | [AGENTS.md](../../src/modules/assistant/usage/AGENTS.md) |
| `src/modules/whatsapp/` | Atención por WhatsApp (E11): números, chats, contactos, difusiones, bot, equipos, plantillas y Mensajes; cada área en su carpeta. | [docs/features/whatsapp.md](../../../ArquitecturaBaseMutitenant/docs/features/whatsapp.md) | `src/modules/whatsapp/registration.ts` | [AGENTS.md](../../src/modules/whatsapp/AGENTS.md) |
| `src/shared/` | Componentes, hooks y servicios comunes a todas las áreas. | [docs/rules/estructura-y-features.md](../rules/estructura-y-features.md) | `src/shared/account/AddLoginMethodDialog.tsx` | [AGENTS.md](../../src/shared/AGENTS.md) |
| `src/shared/account/` | Componentes y servicios de account. | [docs/rules/formularios.md](../rules/formularios.md) | `src/shared/account/AddLoginMethodDialog.tsx` | [AGENTS.md](../../src/shared/account/AGENTS.md) |
| `src/shared/api/` | Cliente HTTP, contratos generados y alias tipados. | [docs/rules/datos-y-api.md](../rules/datos-y-api.md) | `src/shared/api/ApiError.ts` | [AGENTS.md](../../src/shared/api/AGENTS.md) |
| `src/shared/format/` | Formateadores de datos visibles. | [docs/rules/formatos.md](../rules/formatos.md) | `src/shared/format/cultureName.ts` | [AGENTS.md](../../src/shared/format/AGENTS.md) |
| `src/shared/hooks/` | Componentes y servicios de hooks. | [docs/rules/paginado-y-listados.md](../rules/paginado-y-listados.md) | `src/shared/hooks/usePagedQuery.ts` | [AGENTS.md](../../src/shared/hooks/AGENTS.md) |
| `src/shared/modules/` | Manifiestos, registro y disponibilidad de módulos opcionales. | [docs/rules/estructura-y-features.md](../rules/estructura-y-features.md) | `src/shared/modules/ModuleRegistry.tsx` | [AGENTS.md](../../src/shared/modules/AGENTS.md) |
| `src/shared/phone/` | Componentes y servicios de phone. | [docs/rules/telefonos.md](../rules/telefonos.md) | `src/shared/phone/CountryFlag.tsx` | [AGENTS.md](../../src/shared/phone/AGENTS.md) |
| `src/shared/platform/` | Componentes y servicios de platform. | [docs/rules/formularios.md](../rules/formularios.md) | `src/shared/platform/ReasonDialog.tsx` | [AGENTS.md](../../src/shared/platform/AGENTS.md) |
| `src/shared/referenceData/` | Consulta y caché de datos de referencia. | [docs/rules/datos-y-api.md](../rules/datos-y-api.md) | `src/shared/referenceData/useReferenceData.ts` | [AGENTS.md](../../src/shared/referenceData/AGENTS.md) |
| `src/shared/time/` | Zona horaria del navegador y utilidades de tiempo. | [docs/rules/formatos.md](../rules/formatos.md) | `src/shared/time/browserTimeZone.ts` | [AGENTS.md](../../src/shared/time/AGENTS.md) |
| `src/shared/ui/` | Componentes de interfaz comunes. | [docs/rules/pantallas-y-ui.md](../rules/pantallas-y-ui.md) | `src/shared/ui/DataTable.tsx` | [AGENTS.md](../../src/shared/ui/AGENTS.md) |
| `src/shared/ui/fields/` | Controles para cargar datos. | [docs/rules/formularios.md](../rules/formularios.md) | `src/shared/ui/fields/MoneyField.tsx` | [AGENTS.md](../../src/shared/ui/fields/AGENTS.md) |
| `src/shared/ui/format/` | Componentes para mostrar datos con formato. | [docs/rules/formatos.md](../rules/formatos.md) | `src/shared/ui/format/MoneyText.tsx` | [AGENTS.md](../../src/shared/ui/format/AGENTS.md) |
| `src/tenancy/` | Componentes y servicios de . | [docs/rules/accesos-y-permisos.md](../rules/accesos-y-permisos.md) | `src/tenancy/AccessMenu.tsx` | [AGENTS.md](../../src/tenancy/AGENTS.md) |
| `src/test/` | Setup de pruebas, servidor MSW y guardas del arnés. | [docs/rules/tests.md](../rules/tests.md) | `src/test/mocks/currentUsers.ts` | [AGENTS.md](../../src/test/AGENTS.md) |
| `src/shared/ui/app/` | Estructura visual de la app, navegación y avisos. | [docs/rules/pantallas-y-ui.md](../rules/pantallas-y-ui.md) | `src/shared/ui/app/app.test.tsx` | [AGENTS.md](../../src/shared/ui/app/AGENTS.md) |
