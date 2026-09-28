# Árbol del front

> Estructura objetivo, archivo por archivo. `[E#]` es la etapa del plan (`../ArquitecturaBaseMutitenant/docs/plans/2026-09-27-plan-de-desarrollo.md`) en que nace; sin marca, hereda la de su carpeta. Los tests van al lado del archivo que prueban (`X.test.tsx`); acá se listan solo los que son obligatorios. `node_modules/` y `dist/` no se listan.

## Raíz

```
ArquitecturaBaseMutitenantFront/
├── .github/
│   └── workflows/
│       └── ci.yml                                   [E0] npm ci + build + lint + test; contracts:check se suma en [E1]
├── docs/
│   ├── architecture/
│   │   ├── frontend.md                              arquitectura canónica
│   │   ├── formatos.md                              catálogo de formatos (es-AR / en-US)
│   │   ├── tema.md                                  tema visual aprobado (tokens, marco arena, panel de Administración)
│   │   ├── arnes.md                                 fichas, punteros por carpeta y verificación
│   │   └── arbol.md                                 este archivo
│   ├── design/lienzo/                               versión 35: 67 tableros .dc.html, support.js y ds/; fuente de las pantallas
│   │   └── README.md                                cómo servir el lienzo y ver los estados
│   ├── rules/                                       fichas del arnés: README + 13 temas
│   ├── plans/                                       planes detallados de las etapas del front
│   └── specs/
├── public/
│   └── favicon.svg                                 [E0]
├── scripts/
│   ├── generate-contracts.mjs                       [E1] openapi.json del back → src/shared/api/generated/schema.d.ts
│   └── check-contracts.mjs                          [E1] falla si generated/ no coincide con el contrato
├── src/                                             ver abajo
├── .gitignore
├── .oxlintrc.json                                   [E0]
├── AGENTS.md
├── CLAUDE.md                                        @AGENTS.md
├── LICENSE
├── README.md
├── components.json                                  [E0] shadcn new-york
├── index.html                                       [E0] lang="es"
├── silent-renew.html                                [E3]
├── package.json                                     [E0] dev, build, lint, test; contracts y contracts:check se suman en [E1]
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json                                alias @/* → src/*
├── tsconfig.node.json
└── vite.config.ts                                   [E0] proxy /api /account /connect /.well-known /webhooks /signin-google → Api (Aspire), igual en cada host (*.localtest.me): mismo origen, sin CORS; puerto 5174; la entrada silent-renew.html se suma en [E3]
```

## src/

```
src/
├── main.tsx                                         [E0]
├── App.tsx                                          [E0] RouterProvider
├── App.test.tsx
├── index.css                                        [E0] tokens de tema.md (marca, superficies, marco arena, filas, estados, foco, radios); las variables de shadcn, solo como alias
├── theme-tokens.test.ts                             [E0] los tokens de tema.md existen en index.css; ningún color literal fuera de index.css; ninguna ficha ni componente usa --color-* fuera de los alias de shadcn
├── silent-renew.ts                                  [E3]
├── vite-env.d.ts
│
├── app/                                             [E0]
│   ├── providers.tsx                                [E0] solo QueryClientProvider con QueryClient mínimo local; la configuración de shared/api/queryClient, i18n y Toaster se suman en [E1], Auth en [E3]
│   ├── router.tsx                                   createBrowserRouter
│   ├── routes.tsx                                   [E0] una ruta vacía; [E3] rutas por acceso y AppShell;
│   │                                                [E7] árbol por host (dominio principal o subdominio de organización)
│   ├── routes.test.tsx                              [E3] acceso de cada ruta; permiso en [E4] y módulo en [E5]
│   └── routes-by-host.test.ts                       [E7] un subdominio no monta /org, /cuenta ni /plataforma
│
├── auth/                                            [E3]
│   ├── AuthProvider.tsx                             react-oidc-context + puente al httpClient
│   ├── authConfig.ts                                client_id web, code + PKCE, InMemoryWebStorage; authority = issuer fijo y metadataSeed con token, userinfo y revocation en el origen propio
│   ├── authConfig.test.ts
│   ├── SessionRecovery.tsx                          signinSilent después de un F5
│   ├── SessionRecovery.test.tsx
│   ├── sessionRecoveryStatus.ts
│   ├── signOutStatus.ts
│   ├── ProtectedRoute.tsx                           sesión + permiso
│   ├── ProtectedRoute.test.tsx
│   ├── AccessRoute.tsx                              access="consumer" | "business" | "platform"
│   ├── AccessRoute.test.tsx
│   ├── useCurrentUser.ts                            GET /api/me, key ["current-user"]
│   ├── usePermissions.ts                            [E4]
│   ├── usePermissions.test.ts                       [E4]
│   ├── Can.tsx                                      [E4]
│   ├── CanInCompany.tsx                             [E6]
│   ├── useFeature.ts                                [E5] P8 módulos del acceso activo (features de /api/me); apagado = 404
│   ├── Feature.tsx                                  [E5] P8 muestra u oculta según el módulo
│   └── useLanguagePreference.ts                     PUT /api/me con rollback
│
├── tenancy/                                         [E3] accesos (B2C / B2B / plataforma)
│   ├── useAccess.ts                                 acceso activo, organización activa, espacio personal, organizaciones
│   ├── useSwitchAccess.ts                           signinSilent({ access, tenant }) → queryClient.clear() → inicio del acceso
│   ├── useSwitchAccess.test.ts                      verifica el clear de la caché
│   ├── AccessMenu.tsx                               menú de la cuenta entero: el botón (nombre y «Personal» o la organización; en el teléfono, el avatar); cabecera con nombre y correo; «Perfiles»: Personal y cada organización con su rol (✓ en el perfil activo; las suspendidas, deshabilitadas); «Mi cuenta»; «Salir»
│   ├── AccessMenu.test.tsx                          en B2C nunca aparece «Registrá tu empresa»
│   ├── accessHome.ts                                acceso → ruta de inicio (/, /org, /plataforma)
│   ├── usePublicSite.ts                             [E7] slug y datos públicos del subdominio
│   └── useCompanyParam.ts                           [E6] companyId de la URL
│
├── layouts/
│   ├── AppShell.tsx                                 [E1] envuelve layouts y resuelve "Sin conexión" y "Hay una versión nueva"; [E3] muestra AcceptTermsPage u OrganizationUnavailablePage ante sus 403; [E7] envuelve también rutas del subdominio
│   ├── AppShell.test.tsx                            [E1] casos del tablero Avisos: "Sin conexión" aparece sin red y se va sola al volver; si falla un chunk, "Hay una versión nueva" con «Actualizar», sin recargar sola
│   ├── AuthLayout.tsx                               [E3]
│   ├── PersonalLayout.tsx                           [E3] acceso B2C: Inicio, Mi cuenta + módulos B2C (sin organizaciones)
│   ├── SiteLayout.tsx                               [E3] portada de la plataforma; en [E7], también el directorio y la página pública del subdominio
│   ├── BusinessLayout.tsx                           [E3] sidebar + AdminPanel + topbar con la organización
│   ├── PlatformLayout.tsx                           [E3]
│   ├── navigation/
│   │   ├── types.ts                                 grupos, ramas, links con permiso
│   │   ├── personal.ts
│   │   ├── business.ts                              arriba Inicio + módulos B2B; abajo «Administración» (AdminPanel): «Gestión de usuarios» ▸ Usuarios, Roles y permisos · Empresas · Configuración · Página pública · Auditoría
│   │   ├── platform.ts                              Organizaciones (el inicio) · Cuentas · Recuperaciones · Auditoría · Documentos legales · Configuración
│   │   └── navigation.test.ts                       el permiso de cada link = el de su ruta
│   └── components/
│       ├── Sidebar.tsx                              colapsable, drawer en móvil; en el teléfono «Administración» se despliega adentro
│       ├── Sidebar.test.tsx
│       ├── AdminPanel.tsx                           [E3] segundo panel de «Administración» (solo escritorio y solo B2B; 232 px, fondo --panel; tema.md): se abre en cualquier ruta de administración y se cierra con «‹» o tocando de nuevo «Administración»; vacío hasta [E6], que le suma sus enlaces de navigation/business.ts; en el teléfono no se monta
│       ├── AdminPanel.test.tsx                      se abre en una ruta de administración; «‹» lo cierra; en el teléfono no se monta
│       ├── Topbar.tsx                               migas + AccessMenu (menú de la cuenta); en el teléfono, ☰, la marca y el avatar
│       ├── Breadcrumbs.tsx
│       ├── Breadcrumbs.test.tsx
│       ├── OfflineBanner.tsx                        [E1] franja fija arriba "Sin conexión" (navigator.onLine + eventos online/offline), sobre shared/ui/Banner
│       └── NewVersionBanner.tsx                     [E1] franja "Hay una versión nueva" · «Actualizar» recarga la página; nunca se recarga sola
│
├── areas/
│   ├── public/                                      dominio principal, sin sesión o con cualquier acceso
│   │   ├── site/                                    [E3] portada de la plataforma (dominio principal, sin sesión)
│   │   │   └── pages/
│   │   │       ├── LandingPage.tsx                  / sin sesión: portada con «Para personas» y «Para empresas» (tablero Landing)
│   │   │       └── DirectoryPage.tsx                [E7] directorio de empresas publicadas (tablero Directorio)
│   │   ├── auth/                                    [E3]
│   │   │   ├── api/
│   │   │   │   ├── loginCode.ts
│   │   │   │   ├── loginLink.ts                     [E8]
│   │   │   │   ├── signup.ts                        registro de personas
│   │   │   │   ├── businessSignup.ts                [E6] «Registrá tu empresa» + disponibilidad del slug
│   │   │   │   ├── invitations.ts                   POST /api/invitations/preview (el token en el cuerpo, nunca en la URL) y POST /api/invitations/accept
│   │   │   │   └── deletionCancel.ts                POST /api/auth/deletion/cancel con el cancelTicket
│   │   │   ├── components/
│   │   │   │   ├── EmailCodeForm.tsx
│   │   │   │   ├── WhatsAppCodeForm.tsx             [E8]
│   │   │   │   ├── GoogleButton.tsx                 [E3]
│   │   │   │   └── PendingDeletionNotice.tsx        "Tu cuenta tiene la baja pedida · Se elimina el dd/mm/aaaa", con «Cancelar la baja y entrar» y «Salir»
│   │   │   ├── lib/
│   │   │   │   ├── returnUrl.ts
│   │   │   │   └── loginCodeState.ts                estado del paso del código: destino enmascarado, canal y segundos para reenviar
│   │   │   ├── errors.ts                            códigos Auth.* → texto o campo; Identity.Account.PendingDeletion pasa LoginPage al estado de baja pedida
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx                    /login (persona) y /login/empresa (empresa): misma pantalla, otra puerta; el código es un paso de la pantalla (no hay /login/codigo); estados del tablero Ingreso, salvo los de WhatsApp [E8] y los de operador [E9]
│   │   │       ├── LoginLinkPage.tsx                [E8] /login/enlace: enlace del bot (tablero Enlace)
│   │   │       ├── SignupPage.tsx                   /registro: crear cuenta de persona
│   │   │       ├── BusinessSignupPage.tsx           [E6] /registro/empresa: «Registrá tu empresa», con slug obligatorio y disponibilidad
│   │   │       ├── RecoverAccountPage.tsx           [E5] «Recuperar mi cuenta» (ADR 0033)
│   │   │       ├── CallbackPage.tsx
│   │   │       └── AcceptInvitationPage.tsx
│   │   ├── legal/                                   [E3] P7
│   │   │   ├── api/legal.ts                         GET /api/legal/current, POST /api/legal/accept
│   │   │   └── pages/
│   │   │       ├── LegalDocumentPage.tsx            /terminos y /privacidad: el documento vigente en el idioma de la persona
│   │   │       └── AcceptTermsPage.tsx              pantalla bloqueante de términos nuevos (Legal.AcceptanceRequired)
│   │   └── errors/                                  [E3]
│   │       └── pages/
│   │           ├── ForbiddenPage.tsx
│   │           ├── NotFoundPage.tsx
│   │           └── OrganizationUnavailablePage.tsx  [E3] 403 Tenancy.Tenant.Suspended, PendingApproval o Closed: Suspendida, Espera aprobación o Cerrada (tablero Perfil-Suspendido); «Elegí otro perfil»
│   │
│   ├── storefront/                                  [E7] SUBDOMINIO de una organización: su página pública
│   │   ├── pages/PublicPage.tsx                     nombre, logo, descripción, contacto (+ lo que publiquen los módulos)
│   │   └── <módulo público del producto>/           lo que una persona ve y pide; interactuar pide el acceso B2C
│   │
│   ├── personal/                                    ACCESO B2C (espacio personal)
│   │   ├── home/                                    [E3]
│   │   │   └── pages/PersonalHomePage.tsx           / con acceso B2C (tablero Inicio-Personal); vacía hasta que el producto defina qué va; el aviso «Agregá un correo personal…» (ADR 0033) llega en la 3b; en [E7] queda lista para sumar los módulos B2C
│   │   ├── account/                                 [E3] la cuenta: vale en los dos accesos
│   │   │   ├── api/
│   │   │   │   ├── account.ts
│   │   │   │   ├── deletion.ts                      POST /api/me/deletion: motivo + ReauthTicket, con useIdempotentMutation
│   │   │   │   └── dataExport.ts                    [E10] POST /api/me/data-export, con useIdempotentMutation
│   │   │   ├── components/
│   │   │   │   ├── AccountForm.tsx                  nombre, idioma y región, zona
│   │   │   │   ├── LoginMethodsSection.tsx          [E3] parte 3b: gestión de correo y Google; principal; administrados por una empresa; teléfono se suma con el canal de WhatsApp en [E8]
│   │   │   │   ├── AddLoginMethodDialog.tsx         [E3] parte 3b: sumar y verificar un correo; teléfono se habilita en [E8] cuando se registra su canal
│   │   │   │   ├── VerifyDestinationDialog.tsx
│   │   │   │   ├── ConfirmLoginMethodChangeDialog.tsx quitar un método (o desvincular Google) o hacerlo principal, con código en otro método verificado (ReauthTicket de 5 min)
│   │   │   │   ├── PrivacySection.tsx               Privacidad: «Dar de baja mi cuenta» y, en [E10], «Exportar mis datos»
│   │   │   │   ├── DeleteAccountDialog.tsx          «Dar de baja mi cuenta»: motivo + código al método principal (ReauthTicket); errores de la política (único Dueño, operador, módulos); al confirmar, sesión cerrada y "Tu cuenta se elimina el dd/mm/aaaa"; la sugerencia de exportar antes se suma en [E10]
│   │   │   │   └── ExportDataDialog.tsx             [E10] «Exportar mis datos»: te llega por correo
│   │   │   ├── errors.ts                            también Legal.AccountDeletion.* (ReauthRequired, PlatformOperator, AlreadyPending, Blocked; LastAdmin con sus organizaciones, desde [E4])
│   │   │   └── pages/AccountPage.tsx                /cuenta: datos, métodos de ingreso y Privacidad
│   │   └── <módulo B2C del producto>/               misma forma que business/roles: api · columns · errors · components · pages
│   │
│   ├── business/                                    ACCESO B2B (la organización)
│   │   ├── home/                                    [E3]
│   │   │   └── pages/BusinessHomePage.tsx           /org: inicio vacío del tablero en [E3]; la administración se suma en [E6]
│   │   ├── roles/                                   [E4] ← FEATURE DE REFERENCIA
│   │   │   ├── api/roles.ts                         query keys + funciones tipadas con generated/
│   │   │   ├── columns.tsx                          incluye "Vale en"
│   │   │   ├── errors.ts
│   │   │   ├── lib/
│   │   │   │   ├── permissionPicker.ts
│   │   │   │   └── systemRoles.ts
│   │   │   ├── components/
│   │   │   │   ├── PermissionPicker.tsx             desplegable por área con "Todos"
│   │   │   │   └── RoleScopeField.tsx               Toda la organización / Cada empresa / Solo en <empresa>
│   │   │   └── pages/
│   │   │       ├── RolesPage.tsx
│   │   │       ├── RolesPage.test.tsx
│   │   │       ├── RoleEditorPage.tsx               una hoja: nombre, «Vale en», descripción y un desplegable de permisos por área
│   │   │       └── RoleEditorPage.test.tsx
│   │   ├── users/                                   [E6]
│   │   │   ├── api/users.ts                         /api/users; invitar con POST /api/users/invitations (reenviar y revocar en /api/users/invitations/{id})
│   │   │   ├── columns.tsx
│   │   │   ├── errors.ts
│   │   │   ├── testData.ts
│   │   │   ├── components/
│   │   │   │   ├── UsersFilterBar.tsx
│   │   │   │   ├── InviteUserDialog.tsx
│   │   │   │   └── UserCompaniesField.tsx           filas empresa + roles, con «Sumar otra empresa»
│   │   │   └── pages/
│   │   │       ├── UsersPage.tsx
│   │   │       ├── UsersPage.test.tsx
│   │   │       └── UserPage.tsx                     editar el acceso: estado, roles de la organización y empresas; «Cambios sin guardar»
│   │   ├── companies/                               [E6]
│   │   │   ├── api/
│   │   │   │   ├── companies.ts
│   │   │   │   └── companyMembers.ts
│   │   │   ├── columns.tsx
│   │   │   ├── memberColumns.tsx
│   │   │   ├── errors.ts
│   │   │   ├── components/
│   │   │   │   ├── CompanyDialog.tsx
│   │   │   │   ├── AddMemberDialog.tsx
│   │   │   │   └── MemberRolesDialog.tsx
│   │   │   ├── tabs/
│   │   │   │   ├── CompanyMembersTab.tsx            Miembros
│   │   │   │   └── CompanyRolesTab.tsx              Roles que valen solo en esta empresa (alcance SpecificCompany)
│   │   │   └── pages/
│   │   │       ├── CompaniesPage.tsx
│   │   │       └── CompanyPage.tsx                  banda con los datos en una línea; pestañas debajo; la acción de la pestaña va en la banda
│   │   ├── settings/                                [E6] /org/configuracion
│   │   │   ├── api/settings.ts
│   │   │   ├── api/emailDomain.ts                   dominio de correo: agregar, comprobar el registro TXT y quitar
│   │   │   ├── components/EmailDomainSection.tsx    «Dominio de correo»: sin dominio (campo + «Verificar»); pendiente (registro TXT con «Copiar», «Comprobar» y «Quitar»); verificado (correos administrados y «Quitar» con ConfirmDialog y motivo)
│   │   │   └── pages/SettingsPage.tsx               nombre de la organización, idioma y región, zona y moneda predeterminados, y dominio de correo
│   │   ├── audit/                                   [E6]
│   │   │   ├── api/audit.ts
│   │   │   ├── columns.tsx
│   │   │   ├── components/AuditFilterBar.tsx
│   │   │   └── pages/AuditPage.tsx
│   │   ├── public-page/                             [E6] /org/pagina: mi página pública (datos, cambio de slug, publicar)
│   │   │   ├── api/publicPage.ts                    /api/public-site
│   │   │   └── pages/PublicPageEditorPage.tsx       bloqueada por la plataforma: «Despublicada por la plataforma», con el motivo; publicar responde PublicSite.PublicPage.PublishBlocked
│   │   └── <módulo B2B del producto>/               misma forma que roles/
│   │
│   └── platform/                                    ÁREA PLATAFORMA [E5]
│       ├── tenants/
│       │   ├── api/tenants.ts                       estado, dueños, módulos, dominio verificado y página pública de una organización
│       │   ├── columns.tsx                          ⋮ por fila: Ver ficha, Aprobar, Rechazar, Reintentar el alta (solo en «Falló el alta», directo y sin motivo), Reactivar, Suspender, Cerrar
│       │   ├── errors.ts
│       │   ├── components/
│       │   │   ├── CreateOrganizationDialog.tsx
│       │   │   └── ChangeStatusDialog.tsx           aprobar, rechazar, suspender, reactivar o cerrar, con motivo
│       │   ├── tabs/
│       │   │   ├── OrganizationHistoryTab.tsx       Historial: fecha y hora, qué pasó, quién y motivo (eventos de seguridad)
│       │   │   ├── OrganizationOwnersTab.tsx        Dueños
│       │   │   ├── OrganizationModulesTab.tsx       Módulos (P8): Prender, Extender prueba (hasta una fecha) o Apagar, con motivo
│       │   │   ├── OrganizationDomainTab.tsx        Dominio verificado: registro TXT, Verificar o Quitar, con motivo
│       │   │   └── OrganizationPublicPageTab.tsx    Página pública: Ver página, Despublicar (vuelve a borrador con el bloqueo) o Permitir publicar (levanta el bloqueo), con motivo: POST /api/platform/tenants/{id}/public-site/unpublish y …/allow-publish
│       │   └── pages/
│       │       ├── OrganizationsPage.tsx            /plataforma: el listado es el inicio del acceso platform (accessHome.ts)
│       │       └── OrganizationPage.tsx             /plataforma/organizaciones/:id: banda con el estado y sus acciones (y el motivo si está suspendida o cerrada); pestañas debajo
│       ├── accounts/                                /plataforma/cuentas: cuentas y operadores
│       │   ├── api/
│       │   │   ├── accounts.ts                      incluye POST /api/platform/accounts/{id}/deletion (ADR 0035)
│       │   │   └── operators.ts                     invitar operador (PlatformOperatorsController)
│       │   ├── columns.tsx                          una sola tabla; Perfiles muestra «Operador»
│       │   ├── components/
│       │   │   ├── ChangeAccountStatusDialog.tsx    suspender o reactivar, con motivo
│       │   │   ├── RevokeSessionsDialog.tsx         «Cerrar sesiones», con motivo
│       │   │   ├── DeleteAccountDialog.tsx          «Dar de baja», con motivo; bloqueada si es el único Dueño de una organización no cerrada; la plataforma no puede cancelarla
│       │   │   └── AddOperatorDialog.tsx            «Invitar operador»: correo y permisos de plataforma
│       │   └── pages/
│       │       ├── AccountsPage.tsx                 filtro Tipo (Personas | Operadores) y «Invitar operador»
│       │       └── AccountPage.tsx                  /plataforma/cuentas/:id: pestañas Métodos de ingreso, Organizaciones e Historial de seguridad; estados Baja pedida, Baja iniciada por la plataforma y Eliminada (sin acciones)
│       ├── recoveries/                              /plataforma/recuperaciones: pedidos de «Recuperar mi cuenta» (ADR 0033)
│       │   ├── api/recoveries.ts                    pedidos; aprobar o rechazar
│       │   ├── columns.tsx
│       │   ├── errors.ts
│       │   ├── components/ReviewRecoveryDialog.tsx  revisar el pedido: aprobar o rechazar, con motivo
│       │   └── pages/RecoveriesPage.tsx             pedidos y estado vacío «Sin pedidos»
│       ├── legal/                                   /plataforma/legales: términos y privacidad (P7)
│       │   ├── api/legalDocuments.ts                documentos y publicación de una versión nueva
│       │   ├── columns.tsx                          documento, vigente desde, versión vigente, versiones
│       │   ├── errors.ts
│       │   └── pages/
│       │       ├── LegalDocumentsPage.tsx
│       │       └── PublishLegalVersionPage.tsx      hoja con «‹»: documento, vigente desde, texto en español y en inglés; «Cambios sin guardar» y confirmación antes de publicar (una versión publicada no se edita)
│       ├── audit/                                   /plataforma/auditoria
│       │   ├── api/securityEvents.ts
│       │   ├── columns.tsx
│       │   └── pages/SecurityAuditPage.tsx
│       └── settings/                                /plataforma/configuracion
│           ├── api/platformSettings.ts
│           └── pages/PlatformSettingsPage.tsx       ConsumerSignup, BusinessSignup, límite de organizaciones y días de gracia de la baja
│
├── locales/                                         un namespace por módulo; es y en con las mismas claves
│   ├── es/
│   │   ├── common.json                              [E1]
│   │   ├── errors.json                              [E1]
│   │   ├── auth.json                                [E3]
│   │   ├── account.json                             [E3]
│   │   ├── site.json                                [E3] portada; el directorio se suma en [E7]
│   │   ├── legal.json                               [E3] /terminos, /privacidad y la aceptación bloqueante
│   │   ├── roles.json                               [E4]
│   │   ├── platform.json                            [E5]
│   │   ├── users.json                               [E6]
│   │   ├── companies.json                           [E6]
│   │   ├── settings.json                            [E6]
│   │   ├── audit.json                               [E6]
│   │   ├── publicPage.json                          [E6] /org/pagina
│   │   ├── enums.json                               [E1] enums.<Enum>.<Valor>: estados y tipos traducidos
│   │   ├── personal.json                            [E3]
│   │   └── storefront.json                          [E7] página pública del subdominio
│   ├── en/                                          mismos archivos
│   └── parity.test.ts                               [E1]
│
├── shared/
│   ├── api/                                         [E1]
│   │   ├── httpClient.ts                            fetch, Bearer, Accept-Language, una renovación ante 401
│   │   ├── httpClient.test.ts
│   │   ├── ApiError.ts                              code, detail, traceId, errors, retryAfterSeconds
│   │   ├── problemDetails.ts
│   │   ├── queryClient.ts                           manejo global de errores
│   │   ├── queryClient.test.ts
│   │   ├── formErrors.ts                            applyApiErrorToForm
│   │   ├── formErrors.test.ts
│   │   ├── pagedResult.ts
│   │   ├── useIdempotentMutation.ts                 P6 Idempotency-Key al montar, repetida en los reintentos
│   │   ├── useIdempotentMutation.test.ts
│   │   ├── types.ts                                 [E1] alias legibles escritos a mano; reexporta tipos de generated/schema.d.ts
│   │   └── generated/                               NO SE EDITA A MANO
│   │       └── schema.d.ts                          [E1] única salida de openapi-typescript
│   ├── i18n/                                        [E1]
│   │   ├── index.ts
│   │   └── i18n.test.tsx
│   ├── format/                                      [E1] ÚNICO lugar que formatea (formatos.md)
│   │   ├── cultureProfiles.ts                       es-AR y en-US: patrones, 24/12 h, separadores, espacio antes de %
│   │   ├── formatters.ts                            formatDate, formatDateTime, formatTime, formatDateLong, formatRelative,
│   │   │                                            formatDateRange, formatInteger, formatDecimal, formatQuantity,
│   │   │                                            formatPercent, formatMoney, formatCompact, formatFileSize,
│   │   │                                            formatDuration, formatPhone, formatTaxId, formatTimeZone,
│   │   │                                            formatCulture, EMPTY
│   │   ├── parsers.ts                               entrada del usuario en su cultura → contrato de la API
│   │   ├── useFormat.ts                             cultura + zona + moneda ya resueltas → formateadores
│   │   ├── statusTones.ts                           estado → tono visual (success, warning, danger, neutral, pending); colores en tema.md
│   │   ├── formatters.test.ts                       recorre ../ArquitecturaBaseMutitenant/docs/contracts/format-cases.json
│   │   ├── parsers.test.ts
│   │   └── format-usage.test.ts                     falla si se formatea fuera de shared/format y shared/time; en shared/phone solo permite Intl.DisplayNames para nombres de países
│   ├── time/                                        [E1]
│   │   ├── useEffectiveTimeZone.ts                  [E3] cuenta → empresa → organización (en B2B)
│   │   ├── timeZones.ts                             [E1] GET /api/time-zones, catálogo traducido
│   │   └── TimeZoneSelect.tsx                       [E1] agrupado por país
│   ├── account/                                     [E3] lo de la cuenta que usan varias áreas (ADR 0033)
│   │   ├── PersonalMethodBanner.tsx                 [E3] parte 3b: avisa que falta un método propio y lleva a /cuenta; ofrece correo; WhatsApp aparece si el canal llega en GET /api/auth/methods desde [E8]
│   │   ├── needsPersonalMethod.ts                   true mientras la cuenta no tenga un método de ingreso propio verificado
│   │   └── needsPersonalMethod.test.ts
│   ├── hooks/                                       [E0] de la base solo los hooks sin dependencias de etapas posteriores; cada uno con su test
│   │   ├── usePagination.ts                         [E0] de la base; página, tamaño, orden y búsqueda en la URL; vuelve a la 1 al cambiar
│   │   │                                            búsqueda, filtro, orden o tamaño; [E1] corrige internamente una página fuera de rango, sin exponer `correctPage`
│   │   ├── usePagination.test.tsx                   [E0] desde la base; prueba URL y última página
│   │   ├── useCursorList.ts                         [E1] se crea: useInfiniteQuery para auditoría y actividad ("Cargar más")
│   │   ├── useDebouncedValue.ts                     [E1] se crea: 300 ms para la búsqueda
│   │   ├── useFilters.ts                            [E0] de la base
│   │   ├── useQueryUpdate.ts                        [E0] de la base
│   │   ├── useUnsavedChangesGuard.ts                [E1] se adapta con ConfirmDialog
│   │   ├── useBreadcrumbLeaf.ts                    [E0] de la base
│   │   ├── useRestoreFocusOnClose.ts                [E0] de la base
│   │   ├── useLocalStorage.ts                       [E0] de la base; prefijo arquitecturabasemt.
│   │   ├── useMediaQuery.ts                         [E0] de la base
│   │   └── useCountdown.ts                          [E0] de la base
│   ├── lib/                                         [E0]
│   │   └── utils.ts                                 [E0] de la base; cn; shared/lib/dateTime.ts no se copia (shared/format nace en [E1])
│   ├── phone/                                       [E1] países y teléfonos (rules/telefonos.md)
│   │   ├── countries.ts                             lista completa de libphonenumber-js + nombres con Intl.DisplayNames
│   │   ├── priorityCountries.ts                     AR, UY, CL, PY, BR, BO, PE, MX, ES, US arriba
│   │   ├── CountryFlag.tsx                          bandera SVG (country-flag-icons), carga diferida; nunca emoji
│   │   ├── CountrySelect.tsx                        combobox con buscador por nombre, ISO o prefijo
│   │   └── countries.test.ts
│   └── ui/                                          [E0] solo primitivas shadcn independientes de la base y piezas nuevas sin dependencias posteriores; al copiarlas, --color-* pasa a los tokens de tema.md
│       ├── format/                                  [E1] cómo se VE cada dato (siempre por acá)
│       │   ├── DateText.tsx                         kind: date | dateTime | time | long | relative; <time dateTime>
│       │   ├── DateRangeText.tsx
│       │   ├── NumberText.tsx                       kind: integer | decimal | quantity | compact
│       │   ├── MoneyText.tsx                        { amount, currency }
│       │   ├── PercentText.tsx                      fracción → 12,5 %
│       │   ├── FileSizeText.tsx
│       │   ├── DurationText.tsx
│       │   ├── PhoneText.tsx
│       │   ├── TaxIdText.tsx                        20-12345678-6
│       │   ├── TimeZoneText.tsx                     [E1] ciudad traducida y desfase actual, nunca ID IANA crudo
│       │   ├── CultureText.tsx                      [E1] nombre de idioma y región, nunca código crudo
│       │   ├── EnumText.tsx                         enums.<Enum>.<Valor>
│       │   ├── StatusBadge.tsx                      texto + tono desde statusTones
│       │   ├── BooleanText.tsx                      Sí / No
│       │   └── EmptyValue.tsx                       — con aria-label "Sin dato"
│       ├── fields/                                  [E1] cómo se CARGA cada dato (parsea la cultura y emite el contrato)
│       │   ├── DateField.tsx                        DateOnly sin zona
│       │   ├── DateTimeField.tsx                    zona efectiva → ISO UTC
│       │   ├── TimeField.tsx
│       │   ├── NumberField.tsx
│       │   ├── MoneyField.tsx                       importe + moneda (por defecto, la de la organización)
│       │   ├── PercentField.tsx                     12,5 → 0.125
│       │   ├── PhoneField.tsx                       [E1] CountrySelect + AsYouType → { country, number }; usage="whatsapp" filtra países del canal de GET /api/auth/methods desde [E8]
│       │   ├── EmailField.tsx                       P3 trim y minúsculas al escribir
│       │   └── TaxIdField.tsx                       P5 tipo + número, validado con stdnum
│       ├── badge.tsx                                [E0] primitiva shadcn (minúscula, `npx shadcn@4.21.0 add`)
│       ├── button.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── tooltip.tsx
│       ├── Avatar.tsx                               [E0] pieza nueva propia (PascalCase)
│       ├── Banner.tsx                               [E1] de la base, adaptado a los tokens
│       ├── CheckboxField.tsx                        [E1] después de i18n
│       ├── ConcurrencyBanner.tsx                    [E1] P1 "Otra persona cambió esto…" · «Ver lo nuevo» · «Seguir editando»
│       ├── ConfirmDialog.tsx                        [E1] pieza propia, después de i18n
│       ├── DataTable.tsx                            [E1] filas de 42 px, un dato por columna, encabezado gris; cada columna declara su type y la tabla usa ui/format
│       │                                            (alineación, vacío y tooltip); carga, vacío, error con reintento;
│       │                                            [E1] P10: en el teléfono solo las columnas `mobile` (primary y status) y el ⋮, nunca tarjetas;
│       │                                            en la tablet, sin las `priority: "low"`
│       ├── DataTable.test.tsx                       [E1] P10 a 390 px renderiza solo las columnas primary y status, y el ⋮
│       ├── columns-mobile.test.ts                   [E1] P10 toda definición de columnas tiene exactamente una mobile: "primary"
│       ├── EmptyState.tsx                           [E1] después de i18n
│       ├── FilterBar.tsx                            [E0] pieza nueva; buscador + filtros en pastilla con conteos + «Limpiar» por props
│       ├── FormError.tsx                            [E0] pieza nueva; mensaje recibido por props
│       ├── FormField.tsx                            [E1] campos con i18n
│       ├── IconButton.tsx                           [E1] de la base, adaptado a los tokens
│       ├── MultiSelect.tsx                          [E1] de la base, adaptado a los tokens
│       ├── OtpInput.tsx                             [E3] ingreso y verificación de códigos
│       ├── Page.tsx                                 [E1] banda blanca: ícono o backTo, título de 18 px, resumen y acciones (las que sobran, en ⋮)
│       ├── Pagination.tsx                           [E1] se copia y adapta de la base cuando existen pagedResult y shared/format; "1–10 de 1.234" · "Página 1 de 124" · selector 10/20/50/100
│       ├── LoadMore.tsx                             [E1] paginado por cursor
│       ├── RadioGroupField.tsx                     [E1] de la base, adaptado a los tokens
│       ├── RowActions.tsx                           [E1] menú ⋮ por fila; las destructivas al final, en rojo
│       ├── SearchInput.tsx                          [E1] de la base, adaptado a los tokens
│       ├── SegmentedControl.tsx                     [E1] de la base, adaptado a los tokens
│       ├── Sheet.tsx                                [E1] P10 hoja desde abajo en el teléfono: la forma del Dialog (el de un formulario, casi a toda altura) y del menú de la cuenta; nunca filtros
│       ├── Spinner.tsx                              [E1] de la base, adaptado a los tokens
│       ├── StatusDot.tsx                            [E0] pieza nueva
│       ├── Surface.tsx                              [E0] pieza nueva
│       ├── VerificationBadge.tsx                   [E1] de la base, adaptado a los tokens
│       └── icons.tsx                                [E1] SVG propios, trazo 1.75
│
└── test/                                            [E0]
    ├── HarnessStage.ts                              [E0] etapa cerrada única del arnés; se sube al cerrar cada etapa
    ├── harness.test.ts                              [E0] punteros, enlaces y fichas; exige tests solo hasta HarnessStage
    ├── structure.test.ts                            [E0] sin imports entre features ni entre áreas
    ├── setup.ts                                     [E0] mínimo: jest-dom y vitest-axe, sin i18n; MSW y namespaces se suman en [E1]
    ├── mocks/                                       [E1] no se copia en E0
    │   ├── server.ts                                [E1] MSW con onUnhandledRequest: error
    │   ├── handlers.ts                              [E1] handlers genéricos; /api/me y auth se suman en [E3]
    │   └── currentUsers.ts                          [E3] fixtures: persona sin/con organizaciones, empresa admin/sin permisos y operador
    └── utils/
        └── renderWithProviders.tsx                  [E1] renderWithProviders; as y host se suman con auth [E3] y subdominios [E7]
```

## Piezas de los estándares P1 a P10 (adoptados el 2026-09-27)

Cada pieza está en su carpeta del árbol, con su etapa.

```
P1   src/shared/ui/ConcurrencyBanner.tsx
P3   src/shared/ui/fields/EmailField.tsx
P5   src/shared/ui/fields/TaxIdField.tsx
P6   src/shared/api/useIdempotentMutation.ts
P7   src/areas/public/legal/ · src/areas/platform/legal/
P8   src/auth/useFeature.ts · src/auth/Feature.tsx · src/areas/platform/tenants/tabs/OrganizationModulesTab.tsx
P9   src/test/setup.ts
P10  src/shared/ui/Sheet.tsx · src/shared/ui/DataTable.tsx · src/shared/ui/DataTable.test.tsx · src/shared/ui/columns-mobile.test.ts
```
