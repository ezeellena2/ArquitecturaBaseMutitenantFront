# Árbol del front

> Estructura objetivo, archivo por archivo. `[E#]` es la etapa del plan (`../ArquitecturaBaseMutitenant/docs/plans/2026-09-27-plan-de-desarrollo.md`) en que nace; sin marca, hereda la de su carpeta. Cada test va al lado del archivo que prueba (`X.test.tsx`) y figura en el árbol, con lo que verifica o con «tests de X». `node_modules/` y `dist/` no se listan.

## Raíz

```
ArquitecturaBaseMutitenantFront/
├── .github/
│   └── workflows/
│       └── ci.yml                                   [E0] npm ci + contracts:check + build + lint + test; sin el repo hermano, contracts:check avisa y se saltea (el chequeo cruzado llega con la Etapa 10, ADR 0016)
├── docs/
│   ├── architecture/
│   │   ├── frontend.md                              arquitectura canónica
│   │   ├── formatos.md                              catálogo de formatos (es-AR / en-US)
│   │   ├── tema.md                                  tema visual aprobado (tokens, marco arena, panel de Administración)
│   │   ├── arnes.md                                 fichas, punteros por carpeta y verificación
│   │   └── arbol.md                                 este archivo
│   ├── design/lienzo/                               el lienzo vigente (la versión, en su README): tableros .dc.html, support.js, ds/ y generadores/; fuente de las pantallas
│   │   └── README.md                                cómo servir el lienzo y ver los estados
│   ├── design/capturas/                             capturas lado a lado (tablero y app) de cada etapa y tanda, con su manifiesto
│   └── rules/                                       fichas del arnés: README + 13 temas
├── public/
│   └── favicon.svg                                 [E0]
├── scripts/
│   ├── generate-contracts.mjs                       [E1] openapi.json del back → src/shared/api/generated/schema.d.ts
│   ├── check-contracts.mjs                          [E1] falla si generated/ no coincide con el contrato; sin el repo hermano en CI, avisa y se saltea
│   ├── test-e2e-real.test.mjs                       E2E real: levanta su AppHost y un PostgreSQL efímero; front y API reales, sin mocks
│   ├── capturar-etapa-3a.mjs                        capturas de la 3a: tablero y app lado a lado, a 1440 y a 390
│   ├── capturar-etapa-3a.test.mjs                   tests de capturar-etapa-3a
│   ├── capturar-etapa-3b.mjs                        capturas de la 3b (Mi cuenta, términos, baja pedida, inicio y correos) contra el lienzo vigente
│   ├── capturar-etapa-3c.mjs                        capturas de la 3c (invitación y registro de empresa)
│   ├── capturar-etapa-4.mjs                         capturas de la Etapa 4 (Roles y Mi cuenta)
│   ├── capturar-etapa-4.test.mjs                    tests de capturar-etapa-4
│   ├── capturar-etapa-5.mjs                         [E5] tableros de Plataforma y Recuperar: 1440 y 390
│   ├── capturar-etapa-5.test.mjs                    [E5] tests de capturar-etapa-5
│   ├── capturar-etapa-6.mjs                         capturas de la Etapa 6 (Usuarios, Empresas, Configuración, Auditoría y Página pública); sus datos los reusa capturar-f7
│   ├── capturar-f7.mjs                              capturas de F7 (edición, «¿Salir sin guardar?», el 409 y el error de guardado): --tableros o --app-url
│   ├── capturar-relevamiento.mjs                    relevamiento de las etapas 1 a 6 contra el lienzo vigente, a 1440 y a 390
│   ├── capturar-relevamiento.casos.mjs              los casos del relevamiento: qué tablero, con qué estado y con qué pasos
│   ├── capturar-relevamiento.test.mjs               tests de capturar-relevamiento
│   └── recorrido-lienzo/                            recorrido del lienzo tablero por tablero (recorrido.mjs) y vista en vivo de una pantalla junto a su tablero (vivo.mjs)
├── src/                                             ver abajo
├── .gitignore
├── .npmrc
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
├── App.test.tsx                                     tests de App
├── index.css                                        [E0] tokens de tema.md (marca, superficies, marco arena, filas, estados, foco, radios); las variables de shadcn, solo como alias
├── theme-tokens.test.ts                             [E0] los tokens de tema.md existen en index.css; ningún color literal fuera de index.css; ninguna ficha ni componente usa --color-* fuera de los alias de shadcn
├── silent-renew.ts                                  [E3]
├── vite-env.d.ts
│
├── app/                                             [E0]
│   ├── providers.tsx                                AppProviders: QueryClientProvider (createQueryClient), i18n con la cultura efectiva, FormatProvider, Toaster y AuthProvider
│   ├── router.tsx                                   createBrowserRouter
│   ├── routes.tsx                                   rutas por acceso dentro del AppShell; las pantallas de la organización salen del manifiesto de layouts/navigation/business.ts, con lazyPage y RequirePermission;
│   │                                                [E7] árbol por host (dominio principal o subdominio de organización)
│   ├── routes.test.tsx                              [E3] acceso de cada ruta; cada ruta del manifiesto pide su permiso
│   ├── RouteViews.tsx                               HomeRoute, PlatformHomeRoute (primera pantalla permitida disponible), ForbiddenRoute y NotFoundRoute
│   ├── RequirePermission.tsx                        [E7] la guarda de una ruta del manifiesto: módulo apagado → 404; sin permiso → «No tenés permiso», dentro del marco; con companyPermission, también ese permiso en la empresa de la ruta (B4)
│   ├── RequirePermission.test.tsx                   [E7]
│   ├── navigationStatus.test.tsx                    la navegación OIDC transitoria («Iniciando sesión…», «Cerrando sesión…»)
│   └── routes-by-host.test.ts                       [E7] un subdominio no monta /org, /cuenta ni /plataforma
│
├── auth/                                            [E3]
│   ├── AuthProvider.tsx                             react-oidc-context + puente al httpClient
│   ├── AuthProvider.test.tsx                        tests de AuthProvider
│   ├── authConfig.ts                                client_id web, code + PKCE, InMemoryWebStorage; authority = issuer fijo y metadataSeed con token, userinfo y revocation en el origen propio
│   ├── authConfig.test.ts
│   ├── silentRenew.test.ts                          la renovación silenciosa (silent-renew.ts)
│   ├── SessionRecovery.tsx                          signinSilent después de un F5
│   ├── SessionRecovery.test.tsx
│   ├── sessionRecoveryStatus.ts                     el estado de la recuperación de la sesión, para SessionStatusPage
│   ├── recoveryAccess.ts                            el acceso que se pide al recuperar la sesión, según la ruta; la autorización sigue en los claims
│   ├── sessionExpiredNotice.ts                      recuerda «Tu sesión venció» para mostrarlo en el ingreso
│   ├── SessionStatusPage.tsx                        estados de sesión a pantalla completa: «Iniciando sesión…», «Cambiando a …», «Cerrando sesión…» y «No pudimos iniciar tu sesión»
│   ├── SessionStatusPage.test.tsx                   tests de SessionStatusPage
│   ├── signOutStatus.ts                             el estado de «Cerrando sesión…»
│   ├── signOutStatus.test.tsx                       tests de signOutStatus
│   ├── useSignOut.ts                                Salir igual en toda la app: «Cerrando sesión…», queryClient.clear() y signoutRedirect
│   ├── useSignOut.test.tsx
│   ├── deletionRequestStatus.ts                     avisa al AppShell que la baja quedó pedida, con su fecha (DeletionRequestedPage)
│   ├── ProtectedRoute.tsx                           sesión
│   ├── ProtectedRoute.test.tsx
│   ├── AccessRoute.tsx                              access="consumer" | "business" | "platform"; manda al inicio del acceso de la sesión
│   ├── AccessRoute.test.tsx
│   ├── LegalAcceptanceGate.tsx                      lee /api/me: si falla, LoadErrorPage con «Reintentar»; con pendingLegalDocuments o el 403 Legal.AcceptanceRequired, lleva a /aceptar-terminos
│   ├── LegalAcceptanceGate.test.tsx                 tests de LegalAcceptanceGate
│   ├── useCurrentUser.ts                            GET /api/me, key ["current-user"]
│   ├── useCurrentUser.test.tsx                      tests de useCurrentUser
│   ├── usePermissions.ts                            can, canInCompany, canPlatform y hasFeature (P8) sobre effectivePermissions y features de /api/me; los códigos tipados de los catálogos del back
│   └── usePermissions.test.ts                       [E7]
│
├── tenancy/                                         [E3] accesos (B2C / B2B / plataforma)
│   ├── access.ts                                    el tipo Access del contrato, homeOf, loginPathOf, accessOfPath, activeOrganization, isSelectable y los estados no disponibles: el único lugar con «/org» y «/login/empresa»
│   ├── access.test.ts
│   ├── publicSite.ts                                [E5] publicSiteHost y sufijo público compartidos; E7 los completa desde el issuer
│   ├── publicSite.test.ts                           tests de publicSite
│   ├── useAccess.ts                                 acceso activo, organización activa, espacio personal, organizaciones
│   ├── useAccess.test.tsx                           tests de useAccess
│   ├── useSwitchAccess.ts                           signinSilent({ access, tenant }) → queryClient.clear() → inicio del acceso
│   ├── useSwitchAccess.test.tsx                     verifica el clear de la caché
│   ├── AccessMenu.tsx                               menú de la cuenta, solo en la compu: el botón (nombre y «Personal» o la organización); cabecera con nombre y correo; «Perfiles»: Personal y cada organización con su rol (✓ en el perfil activo; la que no está disponible, en gris, dice por qué); «Mi cuenta»; «Salir». En el teléfono, todo eso está en «Más»
│   ├── AccessMenu.test.tsx                          en B2C nunca aparece «Registrá tu empresa»
│   ├── useProfiles.tsx                              perfiles, cambio de acceso y «Salir»: lo comparten AccessMenu y «Más»
│   └── usePublicSite.ts                             [E7] slug y datos públicos del subdominio (GET /api/public-site, PublicSiteController)
│
├── layouts/
│   ├── AppShell.tsx                                 [E1] las franjas «Sin conexión» y «Hay una versión nueva»; la baja pedida, OrganizationUnavailablePage y el 403 que bloquea la vista (ForbiddenPage); AppErrorBoundary alrededor del contenido
│   ├── AppShell.test.tsx                            [E1] casos del tablero Avisos: "Sin conexión" aparece sin red y se va sola al volver; si falla un chunk, "Hay una versión nueva" con «Actualizar», sin recargar sola
│   ├── AppErrorBoundary.tsx                         una pantalla que se rompió al pintarse o no se pudo bajar: la «Pantalla de error» con «Reintentar» (AppErrorPage)
│   ├── AuthLayout.tsx                               [E3]
│   ├── AuthLayout.test.tsx                          tests de AuthLayout
│   ├── PrivateLayoutFrame.tsx                       marco de los tres accesos: en la compu, menú lateral, panel y barra; en el teléfono, AppChrome y BottomNav con las secciones del manifiesto (sin ellas, Inicio/Más)
│   ├── PrivateLayoutFrame.test.tsx                  tests de PrivateLayoutFrame
│   ├── PersonalLayout.tsx                           [E3] acceso B2C: Inicio, Mi cuenta + módulos B2C (sin organizaciones)
│   ├── BusinessLayout.tsx                           [E3] sidebar + AdminPanel + topbar con la organización; en el teléfono, el marco de app de PrivateLayoutFrame
│   ├── PlatformLayout.tsx                           [E5] marco de Plataforma: Gestión arriba, Administración al pie, un solo panel abierto
│   ├── PlatformLayout.test.tsx                      permisos, panel activo y axe del marco desktop
│   ├── AccountLayout.tsx                            /cuenta y /mas dentro del layout del acceso activo
│   ├── MorePage.tsx                                 «Más» del teléfono (/mas; /plataforma/mas): identidad, Perfiles sólo en Personal/Empresa, Administración por permiso, Mi cuenta y Salir (M-Mas-Personal, M-WA-Menu, M-Mas-Plat); en la compu vuelve al inicio
│   ├── MorePage.test.tsx                            tests de MorePage
│   ├── SiteLayout.tsx                               [E3] portada de la plataforma; en [E7], también el directorio y la página pública del subdominio
│   ├── SiteLayout.test.tsx                          tests de SiteLayout
│   ├── navigation/
│   │   ├── types.ts                                 AppRoute (camino, permiso de organización, empresa o Plataforma, módulo, rótulo e ícono), paneles Gestión/Administración, raíz de las migas y bottomSections por referencia al mismo link
│   │   ├── administration.ts                        la opción más específica del panel de la que sale una ruta: la usan el panel, las migas y el marco
│   │   ├── administration.test.ts                   Gestión y Administración de Plataforma, incluido el inicio de Organizaciones
│   │   ├── personal.ts
│   │   ├── business.ts                              el manifiesto de rutas de la organización (businessRoutes) y el menú que sale de él: arriba Inicio + módulos B2B; abajo «Administración» (AdminPanel): «Gestión de usuarios» ▸ Usuarios, Roles y permisos · Empresas · Configuración · Página pública · Auditoría
│   │   ├── platform.ts                              Organizaciones (el inicio) · Cuentas · Recuperaciones · Auditoría · Documentos legales · Configuración; barra inferior con Gestión y Más canónico
│   │   ├── visible.ts                               [E7] el menú que la sesión puede ver (permiso y módulo): lo usan el menú lateral y «Más»; `canOpen`, también las migas
│   │   ├── visible.test.ts                          [E7] cada enlace es una ruta del manifiesto
│   │   └── navigation.test.tsx                      los enlaces de cada acceso
│   └── components/
│       ├── menuRow.ts                               las opciones del menú lateral y del panel («Criterio · Menús»): 32 de alto, ícono de 18, la activa en blanco con letra petróleo; panelEdgeButtonClass, la flecha del borde
│       ├── Sidebar.tsx                              solo en la compu: colapsable, con una línea fina entre opciones y otra antes de «Administración», que abre el AdminPanel. En el teléfono no se monta
│       ├── Sidebar.test.tsx
│       ├── AdminPanel.tsx                           segundo panel de «Administración» (solo escritorio y solo B2B; 232 px, fondo --panel; tema.md): se abre en cualquier ruta de administración y se cierra con «‹» o tocando de nuevo «Administración»; un grupo arranca abierto solo en una de sus pantallas (lienzo v102); en el teléfono no se monta
│       ├── AdminPanel.test.tsx                      se abre en una ruta de administración; «‹» lo cierra; en el teléfono no se monta
│       ├── Topbar.tsx                               solo en la compu: migas + AccessMenu (menú de la cuenta)
│       ├── Topbar.test.tsx                          tests de Topbar
│       ├── Breadcrumbs.tsx                          el camino hasta la pantalla; la opción que la sesión no abre va sin enlace, como «‹» (B4)
│       ├── Breadcrumbs.test.tsx
│       ├── OfflineBanner.tsx                        [E1] cartel «Sin conexión» (navigator.onLine + eventos online/offline): arriba en la compu; en el teléfono, banda roja clara debajo de la barra (AppNotices)
│       ├── OfflineBanner.test.tsx                   tests de OfflineBanner
│       ├── NewVersionBanner.tsx                     [E1] cartel «Hay una versión nueva» · «Actualizar» recarga la página; nunca se recarga sola; en el teléfono, banda debajo de la barra
│       └── NewVersionBanner.test.tsx                tests de NewVersionBanner
│
├── areas/
│   ├── public/                                      dominio principal, sin sesión o con cualquier acceso
│   │   ├── site/                                    [E3] portada de la plataforma (dominio principal, sin sesión)
│   │   │   └── pages/
│   │   │       ├── LandingPage.tsx                  / sin sesión: portada con «Para personas» y «Para empresas» y las entradas a «Registrá tu empresa» (tablero Landing)
│   │   │       ├── LandingPage.test.tsx             tests de LandingPage
│   │   │       └── DirectoryPage.tsx                [E7] directorio de empresas publicadas (tablero Directorio)
│   │   ├── auth/                                    [E3]
│   │   │   ├── api/
│   │   │   │   ├── loginCode.ts
│   │   │   │   ├── loginCode.test.ts                tests de loginCode
│   │   │   │   ├── loginLink.ts                     [E8]
│   │   │   │   ├── methods.ts                       GET /api/auth/methods: los canales de ingreso habilitados (WhatsApp, desde la Etapa 8)
│   │   │   │   ├── googleSignup.ts                  el antiforgery del registro con Google
│   │   │   │   ├── signup.ts                        registro de personas
│   │   │   │   ├── signup.test.ts                   tests de signup
│   │   │   │   ├── businessSignup.ts                [E6] «Registrá tu empresa» + disponibilidad del slug
│   │   │   │   ├── businessSignup.test.ts           tests de businessSignup
│   │   │   │   ├── recovery.ts                      [E5] pedir código, verificarlo y registrar recuperación pública con nonce e Idempotency-Key
│   │   │   │   └── deletion.ts                      la baja pedida al ingresar: leerla y «Cancelar la baja y entrar» (POST /api/auth/deletion/cancel con el cancelTicket)
│   │   │   ├── components/
│   │   │   │   ├── AuthStatus.tsx                   la pantalla de estado del ingreso, los registros y la invitación: círculo de 52, título de 24, bajada y botones de 44
│   │   │   │   ├── AuthStatus.test.tsx              tests de AuthStatus
│   │   │   │   ├── AuthCodeStep.tsx                 el paso del código del ingreso y de los dos registros: «Usar otro correo», los casilleros, la franja, «Verificar» y «Reenviar código»
│   │   │   │   ├── AuthCodeStep.test.tsx            tests de AuthCodeStep
│   │   │   │   ├── AuthMessage.tsx                  la franja de sus mensajes (FormError) con las líneas que los completan («Te quedan 3 intentos.»)
│   │   │   │   ├── AuthMessage.test.tsx             tests de AuthMessage
│   │   │   │   ├── AuthLink.tsx                     el enlace de texto del ingreso y los registros, en --marca-tx, y su renglón (AuthLinkRow)
│   │   │   │   ├── AuthLink.test.tsx                tests de AuthLink
│   │   │   │   ├── BusinessAccessResult.tsx         la puerta de empresa que no deja entrar (sin empresa o deshabilitado), desde el código o desde authorize
│   │   │   │   ├── PlatformAccessResult.tsx         operador probado en una puerta pública: Ir a Plataforma o Salir sólo del lado público
│   │   │   │   ├── EmailCodeForm.tsx                el correo y el paso del código, con AuthCodeStep
│   │   │   │   ├── EmailCodeForm.test.tsx           tests de EmailCodeForm
│   │   │   │   ├── WhatsAppCodeForm.tsx             [E8]
│   │   │   │   ├── GoogleButton.tsx                 [E3]
│   │   │   │   ├── GoogleButton.test.tsx            tests de GoogleButton
│   │   │   │   └── PendingDeletionPanel.tsx         "Tu cuenta tiene la baja pedida · Se elimina el dd/mm/aaaa", con «Cancelar la baja y entrar» y «Salir»
│   │   │   ├── lib/
│   │   │   │   ├── returnUrl.ts
│   │   │   │   ├── returnUrl.test.ts                tests de returnUrl
│   │   │   │   ├── loginRedirectError.ts            lleva el código de error de Google entre los dos redirects del ingreso, sin datos de identidad ni tokens
│   │   │   │   ├── loginCodeState.ts                estado del paso del código: destino enmascarado, canal y segundos para reenviar
│   │   │   │   └── loginCodeState.test.ts           tests de loginCodeState
│   │   │   ├── errors.ts                            códigos Auth.* → texto o campo; Identity.Account.PendingDeletion pasa LoginPage al estado de baja pedida
│   │   │   ├── errors.test.ts                       tests de errors
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx                    /login (persona) y /login/empresa (empresa): misma pantalla, otra puerta; el código es un paso de la pantalla (no hay /login/codigo); estados del tablero Ingreso, salvo los de WhatsApp [E8] y los de operador [E9]
│   │   │       ├── LoginPage.test.tsx               tests de LoginPage
│   │   │       ├── LoginLinkPage.tsx                [E8] /login/enlace: enlace del bot (tablero Enlace)
│   │   │       ├── SignupPage.tsx                   /registro: crear cuenta de persona
│   │   │       ├── SignupPage.test.tsx              tests de SignupPage
│   │   │       ├── BusinessSignupPage.tsx           [E6] /registro/empresa: «Registrá tu empresa», con slug obligatorio y disponibilidad
│   │   │       ├── BusinessSignupPage.test.tsx      tests de BusinessSignupPage
│   │   │       ├── InvitationPage.tsx               /invitacion: quién invita, la organización, los roles y el vencimiento (POST /api/invitations/preview, el token en el cuerpo) y aceptar según el caso (tablero Invitacion)
│   │   │       ├── InvitationPage.test.tsx          tests de InvitationPage
│   │   │       ├── RecoverAccountPage.tsx           [E5] /recuperar: correo de antes, correo nuevo, código y pedido recibido; sin WhatsApp (v111)
│   │   │       ├── RecoverAccountPage.test.tsx      tests de Recuperar: nonce, idempotencia, errores, espera y vista a 390
│   │   │       ├── CallbackPage.tsx
│   │   │       └── CallbackPage.test.tsx            tests de CallbackPage
│   │   ├── legal/                                   [E3] P7
│   │   │   ├── api/
│   │   │   │   ├── legal.ts                         GET /api/legal/terms y /api/legal/privacy
│   │   │   │   └── acceptance.ts                    POST /api/legal/accept, con useIdempotentMutation
│   │   │   └── pages/
│   │   │       ├── LegalDocumentPage.tsx            /terminos y /privacidad: el documento vigente en el idioma de la persona
│   │   │       ├── LegalDocumentPage.test.tsx       tests de LegalDocumentPage
│   │   │       ├── AcceptTermsPage.tsx              /aceptar-terminos: pantalla bloqueante de términos nuevos (pendingLegalDocuments de /api/me o Legal.AcceptanceRequired); al aceptar vuelve a la ruta de antes
│   │   │       └── AcceptTermsPage.test.tsx         tests de AcceptTermsPage
│   │   └── errors/                                  [E3]
│   │       └── pages/
│   │           ├── ErrorPageFrame.tsx               reexporta shared/ui/ErrorPageFrame
│   │           ├── ForbiddenPage.tsx                reexporta shared/ui/ForbiddenPage
│   │           ├── ForbiddenPage.test.tsx           tests de ForbiddenPage
│   │           ├── NotFoundPage.tsx                 reexporta shared/ui/NotFoundPage
│   │           ├── NotFoundPage.test.tsx            tests de NotFoundPage
│   │           ├── OrganizationUnavailablePage.tsx  [E3] 403 Tenancy.Tenant.Suspended, PendingApproval o Closed: Suspendida, Espera aprobación o Cerrada (tablero Perfil-Suspendido); «Elegí otro perfil»
│   │           └── OrganizationUnavailablePage.test.tsx tests de OrganizationUnavailablePage
│   │
│   ├── storefront/                                  [E7] SUBDOMINIO de una organización: su página pública
│   │   ├── pages/PublicPage.tsx                     nombre, logo, descripción, contacto (+ lo que publiquen los módulos): shared/ui/PublicPageCard con `links` y `signInHref`
│   │   └── <módulo público del producto>/           lo que una persona ve y pide; interactuar pide el acceso B2C
│   │
│   ├── personal/                                    ACCESO B2C (espacio personal)
│   │   ├── home/                                    [E3]
│   │   │   └── pages/
│   │   │       ├── PersonalHomePage.tsx             / con acceso B2C (tableros Inicio-Personal y M-Inicio-Personal): la banda «Inicio» y, si falta un método propio, PersonalLoginMethodNotice; lo demás lo define cada producto
│   │   │       └── PersonalHomePage.test.tsx        tests de PersonalHomePage
│   │   ├── account/                                 [E3] la cuenta: vale en los dos accesos
│   │   │   ├── api/
│   │   │   │   ├── account.ts                       el perfil de /api/me: nombre, idioma y región, y zona
│   │   │   │   ├── account.test.ts                  tests de account
│   │   │   │   ├── deletion.ts                      POST /api/me/deletion: motivo desde la sesión iniciada, con useIdempotentMutation
│   │   │   │   └── dataExport.ts                    [E10] POST /api/me/data-export, con useIdempotentMutation
│   │   │   ├── components/
│   │   │   │   ├── AccountProfileForm.tsx           «Tus datos»: nombre, apellido, idioma y región, y zona; cuatro columnas iguales, una en teléfono; React Hook Form con zod, useEditForm y useEditPage
│   │   │   │   ├── LoginMethodsTable.tsx            los métodos de ingreso en su lista, con «Principal» o «Sin verificar» en la segunda línea y su ⋮ (verificar, quitar, hacer principal)
│   │   │   │   ├── LoginMethodsTable.test.tsx       tests de LoginMethodsTable
│   │   │   │   ├── VerifyLoginMethodDialog.tsx      verificar un método sin verificar: el diálogo de shared/account/AddLoginMethodDialog
│   │   │   │   ├── AccountGoogleButton.tsx          vincular Google con OAuth directo (ADR 0045)
│   │   │   │   ├── AccountDeletionDialog.tsx        «Dar de baja mi cuenta»: motivo y confirmación sin código extra; se monta al abrirse, devuelve el foco y lleva su error arriba de los botones
│   │   │   │   ├── AccountDeletionDialog.test.tsx   tests de AccountDeletionDialog
│   │   │   │   ├── DeletionRequestedPage.tsx        «Tu cuenta se elimina el dd/mm/aaaa», después de pedir la baja (la muestra el AppShell)
│   │   │   │   └── ExportDataDialog.tsx             [E10] «Exportar mis datos»: te llega por correo
│   │   │   └── pages/
│   │   │       ├── AccountPage.tsx                  /cuenta: «Tus datos», «Métodos de ingreso» con «Agregar» y «Privacidad» con «Dar de baja mi cuenta» (con ⓘ si la cuenta es la única Dueña de una organización)
│   │   │       ├── AccountPage.test.tsx             tests de AccountPage
│   │   │       └── AccountNames.test.tsx            partes opcionales independientes, Unicode, errores, descarte, menú y axe en ambos tamaños (A6)
│   │   └── <módulo B2C del producto>/               misma forma que business/roles: api · columns · errors · components · pages
│   │
│   ├── business/                                    ACCESO B2B (la organización)
│   │   ├── home/                                    [E3] inicio de la organización (ADR 0040)
│   │   │   ├── api/home.ts                          GET /api/home: las tarjetas de las áreas o «Tus empresas», y «Para resolver», en un solo pedido
│   │   │   ├── components/
│   │   │   │   ├── HomeCards.tsx                    Inicio-Org: una tarjeta por área que la API devolvió, con su dato real (el estado de la página, con StatusBadge y sus tonos); Inicio-Miembro: «Tus empresas»
│   │   │   │   ├── ToResolve.tsx                    «Para resolver» en la compu: Pendiente, Área (o Empresa, en Inicio-Miembro), Estado, Desde y la acción; «Nada para resolver»
│   │   │   │   ├── PhoneHome.tsx                    el inicio en el teléfono, la billetera (M-Inicio-Org y M-Inicio-Miembro)
│   │   │   │   ├── pendingItems.ts                  cada fila de «Para resolver» (área y tipo) → texto, estado, ícono y enlace; un tipo desconocido no se muestra
│   │   │   │   └── companyDetail.ts                 lo que dice una empresa de «Tus empresas» debajo del nombre: sus roles y cuántos miembros tiene
│   │   │   └── pages/
│   │   │       ├── BusinessHomePage.tsx             /org: lo que la API decide para cada persona (Inicio-Org o Inicio-Miembro) y, debajo, «Para resolver» (R18, lienzo v93): solo estados que quien mira puede resolver, con su acción
│   │   │       └── BusinessHomePage.test.tsx        tests de BusinessHomePage
│   │   ├── roles/                                   [E4] ← FEATURE DE REFERENCIA
│   │   │   ├── api/roles.ts                         query keys + funciones tipadas con generated/
│   │   │   ├── columns.tsx                          las columnas (incluye «Vale en» y «De sistema» en la segunda línea) y la fila del teléfono (rolePhoneRow)
│   │   │   ├── errors.ts                            el nombre repetido va a su campo (roleErrorField)
│   │   │   ├── errors.test.ts                       tests de errors
│   │   │   ├── lib/
│   │   │   │   ├── permissionPicker.ts              qué permisos valen en cada alcance, la cuenta («1 de 2») y marcar o desmarcar
│   │   │   │   ├── permissionPicker.test.ts         tests de permissionPicker
│   │   │   │   ├── systemRoles.ts                   el nombre y la descripción en pantalla de los roles de sistema («Dueño» y «Administrador»)
│   │   │   │   └── systemRoles.test.ts              tests de systemRoles
│   │   │   ├── components/
│   │   │   │   ├── PermissionPicker.tsx             grupos por área que se abren y se cierran, con su casilla de todos y la cuenta («3 de 3»); al entrar, abiertos los que tienen algo marcado
│   │   │   │   └── RoleScopeField.tsx               «Vale en»: toda la organización o una empresa por nombre; «Cada empresa» no se ofrece (queda para la API) y un rol que ya vale en cada empresa lo dice como texto
│   │   │   └── pages/
│   │   │       ├── RolesPage.tsx                    /org/roles: el listado de referencia (usePagedQuery, FilterBar, DataTable y Pagination)
│   │   │       ├── RolesPage.test.tsx
│   │   │       ├── RoleEditorPage.tsx               /org/roles/nuevo y /org/roles/:id: datos sueltos (nombre, «Vale en», descripción) y «Permisos» en grupos que se abren; React Hook Form con zod, useEditForm, useEditPage y ReadOnlyField; al editar, «Descartar cambios», y al crear, «Cancelar»
│   │   │       └── RoleEditorPage.test.tsx
│   │   ├── users/                                   [E6]
│   │   │   ├── api/users.ts                         /api/users; invitar con POST /api/users/invitations (reenviar y revocar en /api/users/invitations/{id})
│   │   │   ├── columns.tsx                          las columnas (el correo debajo del nombre, la empresa con su rol, «Vence…» debajo del estado), la fila del teléfono y los tonos de los estados
│   │   │   ├── errors.ts                            el texto de un error de la ficha (la última Dueña según el caso, decisión 29)
│   │   │   ├── lib/
│   │   │   │   ├── access.ts                        los roles de la organización de una persona, las empresas que se pueden cambiar y las oraciones de los avisos
│   │   │   │   └── access.test.ts                   tests de access
│   │   │   ├── components/
│   │   │   │   ├── RolesField.tsx                   roles con «Todos» como casilla junto al rótulo (tablero Usuario)
│   │   │   │   ├── RolesField.test.tsx              tests de RolesField
│   │   │   │   ├── AccessSheets.tsx                 las hojas del teléfono para el estado y los roles de la organización (M-Usuario, v99)
│   │   │   │   ├── InviteUserDialog.tsx             «Invitar usuario»: el correo obligatorio y una empresa con sus roles; React Hook Form con zod; se monta solo abierto
│   │   │   │   └── UserCompanyDialog.tsx            «Sumar empresa» y «Cambiar roles» de la ficha: la empresa obligatoria y sus roles; React Hook Form con zod
│   │   │   └── pages/
│   │   │       ├── UsersPage.tsx                    /org/usuarios: filtros, tabla e «Invitar usuario» (InviteUserDialog)
│   │   │       ├── UsersPage.test.tsx
│   │   │       ├── UserDetailPage.tsx               /org/usuarios/:id: estado y roles de la organización y las empresas como lista con ⋮ y diálogos chicos (UserCompanyDialog); useEditForm y useEditPage
│   │   │       ├── UserDetailPage.test.tsx          tests de UserDetailPage
│   │   │       └── UserDetailCompanyAssignments.test.tsx las empresas de la ficha: sumar una, cambiar sus roles y desvincularla
│   │   ├── companies/                               [E6]
│   │   │   ├── api/
│   │   │   │   ├── companies.ts                     empresas, sus miembros y sus roles (la ruta de la empresa con company.members.read, o /api/roles/paged, B4)
│   │   │   │   └── companies.test.ts                tests de companies
│   │   │   ├── columns.tsx                          las columnas de Empresas y de Miembros (createCompanyColumns, createCompanyMemberColumns), sus filas del teléfono y los tonos de sus estados
│   │   │   ├── errors.ts                            el campo donde va lo que el back rechaza de un dato de la empresa o del miembro (también el CUIT repetido; el último administrador, en la franja)
│   │   │   ├── errors.test.ts                       tests de errors
│   │   │   ├── components/
│   │   │   │   ├── CompanyFields.tsx                Nombre, CUIT y «Zona de negocio», atados al formulario de CompanyDialog
│   │   │   │   ├── CompanyDialog.tsx                crear y editar (Empresas y la ficha): React Hook Form con zod y useEditForm (la versión de cuando se abrió); dueño de lo escrito, su guardado y su error
│   │   │   │   ├── AddMemberDialog.tsx              «Agregar miembro»: la persona y sus roles en la empresa; React Hook Form con zod
│   │   │   │   └── MemberRolesDialog.tsx            «Roles de …»: los roles de un miembro en la empresa; React Hook Form con zod
│   │   │   ├── tabs/
│   │   │   │   ├── CompanyMembersTab.tsx            Miembros: filtros, tabla, ⋮ y sus diálogos
│   │   │   │   ├── CompanyRolesTab.tsx              Roles que valen solo en esta empresa (alcance SpecificCompany)
│   │   │   │   ├── useCompanyMembers.ts             la lista paginada (la ficha la pide para la cantidad de la pestaña)
│   │   │   │   └── useCompanyRoles.ts               los roles asignables y los propios, en una consulta (B4: por la ruta de la empresa)
│   │   │   └── pages/
│   │   │       ├── CompaniesPage.tsx                /org/empresas: filtros, tabla con el CUIT o «Sin CUIT» en la segunda línea y «Crear empresa»
│   │   │       ├── CompaniesPage.test.tsx           tests de CompaniesPage
│   │   │       ├── CompanyDetailPage.tsx            /org/empresas/:companyId: banda con los datos en una línea; pestañas debajo; la acción de la pestaña va en la banda
│   │   │       ├── CompanyDetailInvitations.test.tsx tests de las invitaciones de la empresa, sus candidatos y la hoja del teléfono (6e)
│   │   │       └── CompanyDetailPage.test.tsx       tests de CompanyDetailPage
│   │   ├── settings/                                [E6] /org/configuracion
│   │   │   ├── api/settings.ts                      /api/organization/settings y /api/organization/settings/domains: los datos de la organización y sus dominios de correo (agregar, verificar y quitar)
│   │   │   ├── components/AddDomainDialog.tsx       «Agregar dominio»: React Hook Form con zod; se monta solo mientras está abierto
│   │   │   └── pages/
│   │   │       ├── SettingsPage.tsx                 nombre, idioma y región, zona y moneda predeterminados (useEditForm y useEditPage), y los dominios de correo con su estado y los correos administrados
│   │   │       └── SettingsPage.test.tsx            tests de SettingsPage
│   │   ├── audit/                                   [E6]
│   │   │   ├── api/audit.ts                         GET /api/organization/audit (por cursor) y /api/organization/audit/actors (el filtro «Quién»)
│   │   │   └── pages/
│   │   │       ├── AuditPage.tsx                    cuándo, qué pasó, dónde y quién (actorKind: una persona, Sistema o Plataforma); «Cargar más» con useCursorList; el detalle en un diálogo de solo lectura en grilla
│   │   │       └── AuditPage.test.tsx               tests de AuditPage
│   │   ├── public-page/                             [E6] /org/pagina: mi página pública (datos, cambio de slug, publicar)
│   │   │   ├── api/publicPage.ts                    /api/organization/public-page (leer, guardar, publicar y despublicar) y /api/public-site/slug-availability
│   │   │   └── pages/
│   │   │       ├── PublicPagePage.tsx               bloqueada por la plataforma: «Despublicada por la plataforma», con el motivo; publicar responde PublicSite.PublicPage.PublishBlocked;
│   │   │       │                                    sin publicar, «Vista previa»: shared/ui/PublicPageCard en el diálogo de 640, con lo que está escrito
│   │   │       └── PublicPagePage.test.tsx          tests de PublicPagePage
│   │   └── <módulo B2B del producto>/               misma forma que roles/
│   │
│   └── platform/                                    ÁREA PLATAFORMA [E5]
│       ├── AGENTS.md · CLAUDE.md                     permisos individuales y las nueve páginas lazy de T21–T23
│       ├── tenants/
│       │   ├── AGENTS.md · CLAUDE.md                 fuente Organizaciones y M-Organizaciones; coordinación de versión
│       │   ├── api/tenants.ts                       T21b–d: listado, alta, detalle/historial y subrecursos tipados; POST con clave, PUT/DELETE sin clave
│       │   ├── api/tenants.test.ts                  rutas, filtros, cuerpos y clave recibida
│       │   ├── columns.tsx                          columnas y filas del teléfono sin avatar; tonos de TenantStatus y Dueños derivados de identidad/membresía
│       │   ├── errors.ts                            códigos de campo del alta, conflictos de estado y campo de motivo/fecha en ReasonDialog
│       │   ├── components/
│       │   │   ├── CreateOrganizationDialog.tsx     cinco campos, defaults del operador y clave por cuerpo/recorrido
│       │   │   └── CreateOrganizationDialog.test.tsx validaciones, referencias, 400, foco, red y claves
│       │   ├── tabs/                               Historial/Dueños T21c y Módulos/Dominio/Página pública T21d
│       │   │   ├── AGENTS.md · CLAUDE.md             cursor, Dueños actuales/contacto pendiente y filas móviles
│       │   │   ├── useOrganizationHistory.ts        useCursorList global con after opaco y límite 25
│       │   │   ├── OrganizationHistoryTab.tsx       Historial: fecha y hora, qué pasó, quién y motivo (eventos de seguridad)
│       │   │   ├── OrganizationOwnersTab.tsx        Dueños: nombre/correo, último ingreso relativo y estado; fila móvil sin avatar
│       │   │   ├── OrganizationModulesTab.tsx       Módulos (P8): Prender, Extender prueba (hasta una fecha) o Apagar, con motivo
│       │   │   ├── OrganizationModulesTab.test.tsx  catálogo vacío, fechas civiles, versiones propias, permisos, errores y vida de la edición
│       │   │   ├── OrganizationDomainTab.tsx        Dominio verificado: registro TXT, Verificar o Quitar, con motivo
│       │   │   ├── OrganizationDomainTab.test.tsx   idempotencia por dominio, reintentos nativos, versiones, errores y respuestas abandonadas
│       │   │   ├── OrganizationPublicPageTab.tsx    Página pública: dirección, publicación/bloqueo y fecha/motivo real; Despublicar o Permitir con POST versionado; Ver página pendiente E7
│       │   │   ├── OrganizationPublicPageTab.test.tsx metadatos, moderación, versiones propias y vida del formulario
│       │   │   └── testSupport.ts                  TestFeatures y respuestas MSW locales de prueba de T21d, sin catálogo productivo
│       │   └── pages/
│       │       ├── OrganizationsPage.tsx            /plataforma: banda global, filtros cruzados, menú por estado, ReasonDialog y reintento directo del alta
│       │       ├── OrganizationsPage.test.tsx       tabla/móvil, filtros/URL, permisos, acciones, versión respondida, 409, red, estados y axe
│       │       ├── OrganizationPage.tsx             /plataforma/organizaciones/:id: banda, estado, acciones, carteles, Historial y Dueños; versiones propias sin fecha inventada
│       │       └── OrganizationPage.test.tsx        estados, cursor, identidad/membresía, permisos, errores, versiones, idempotencia, formatos, 390 y axe
│       ├── accounts/                                /plataforma/cuentas: cuentas y operadores
│       │   ├── api/
│       │   │   ├── accounts.ts                      [T22a] listado/conteos/detalle y acciones de cuenta; POST sólo motivo sin versión
│       │   │   ├── accounts.test.ts                 rutas/cuerpos/versionless y contratos HTTP de invitaciones
│       │   │   └── operators.ts                     [T22a–b] invitación/reenvío idempotentes, revocación204; PUT/DELETE de asignación con operatorVersion y clave
│       │   ├── columns.tsx                          [T22a] estados, perfiles reales, métodos y fecha común; tabla y ListRow móvil
│       │   ├── errors.ts                            [T22a] voz Plataforma, estado409, LastManager y único Dueño
│       │   ├── components/
│       │   │   ├── InviteOperatorDialog.tsx        [T22a] correo, nueve permisos individuales con descripción y errores junto al campo
│       │   │   ├── AccountDialogs.tsx              [T22a–b] motivo de cuenta, baja con GET fresco y revocación de invitación, compartidos dentro de Cuentas
│       │   │   ├── OperatorPermissionsDialog.tsx   [T22b] permisos y motivo, versión propia y reintento idempotente por recorrido
│       │   │   └── RemoveOperatorDialog.tsx        [T22b] quitar asignación con motivo; LastManager en la franja
│       │   ├── tabs/
│       │   │   ├── AGENTS.md · CLAUDE.md            métodos tapados, membresías globales, cursor de seguridad y permisos individuales
│       │   │   ├── AccountMethodsTab.tsx           [T22b] List de escritorio y ListRow móvil con verificación y disponibilidad
│       │   │   ├── AccountOrganizationsTab.tsx     [T22b] organización, rol canónico traducido, fecha y estado de membresía
│       │   │   ├── AccountHistoryTab.tsx           [T22b] summary humano del cursor de Auditoría, sin total y con audit.read
│       │   │   └── AccountPermissionsTab.tsx       [T22b] nueve permisos con descripción y selección actual del operador
│       │   └── pages/
│       │       ├── AccountsPage.tsx                 [T22a] banda global, filtros cruzados, búsqueda, menús por permiso, reenvío por recurso y baja con GET fresco
│       │       ├── AccountsPage.test.tsx            [T22a] filtros, permisos, errores, idempotencia, vida al navegar, baja, 1/50, idiomas, 390 y axe
│       │       ├── AccountPage.tsx                  [T22b] /plataforma/cuentas/:id: estados y evidencia, grupos de persona/operador e invitación con correo principal
│       │       └── AccountPage.test.tsx            [T22b] estados, permisos, cursor, métodos, operador, versionado, vida de acciones, errores, 390 y axe
│       ├── recoveries/                              /plataforma/recuperaciones: pedidos de «Recuperar mi cuenta» (ADR 0033)
│       │   ├── api/
│       │   │   ├── recoveries.ts                    listado, conteos y decisiones versionadas e idempotentes
│       │   │   └── recoveries.test.ts               consultas, cuerpos, claves y versión respondida
│       │   ├── columns.tsx                          cuenta nullable, métodos tapados y filas móviles
│       │   ├── errors.ts                            errores por código y conflicto de estado
│       │   ├── components/ReviewRecoveryDialog.tsx  grilla, motivo, decisiones y detalle resuelto
│       │   └── pages/
│       │       ├── RecoveriesPage.tsx               banda global, filtros y versión propia ante lectura vieja
│       │       └── RecoveriesPage.test.tsx          estados, filtros, permisos, decisiones, concurrencia y accesibilidad
│       ├── legal/                                   /plataforma/legales: términos y privacidad (P7)
│       │   ├── api/
│       │   │   ├── legalDocuments.ts                GET de grupos y POST201 idempotente de una versión nueva
│       │   │   └── legalDocuments.test.ts           cuerpo por cultura, fecha civil y clave de publicación
│       │   ├── components/LegalPublicationOwner.tsx dueño nativo por borrador/confirmación, con formulario afuera
│       │   ├── lib/
│       │   │   ├── legalPublication.ts              variables y comparación de cuerpo/vida de la publicación
│       │   │   ├── legalVersions.ts                 próxima por fecha futura y número máximo más uno
│       │   │   └── legalVersions.test.ts            vigente distinta de futura, fechas y número independiente
│       │   ├── errors.ts                            fecha anterior a hoy en su campo; los demás errores en franja
│       │   └── pages/
│       │       ├── LegalDocumentsPage.tsx           resumen, versión vigente, próxima pendiente y menú por documento
│       │       ├── LegalDocumentsPage.test.tsx      vigente/futura, resumen, menú, permisos, idiomas, 390 y axe
│       │       ├── LegalRoutes.test.tsx             rutas lazy, permisos y aceptación legal vigente
│       │       ├── LegalRefetch.test.tsx            relectura fallida con caché conserva lista, borrador y dueño de publicación
│       │       ├── LegalBack.test.tsx               Atrás conserva una sola decisión, borrador y abandono de respuestas/reintentos
│       │       ├── PublishLegalVersionPage.lifetime.test.tsx reintentos nativos, claves, borradores y respuestas tardías
│       │       ├── PublishLegalVersionPage.tsx      ruta propia, fecha civil y textos por cultura habilitada; cambios, salida y confirmación
│       │       └── PublishLegalVersionPage.test.tsx validación, culturas, publicación, errores, vida y reintentos nativos
│       ├── audit/                                   /plataforma/auditoria
│       │   ├── api/
│       │   │   ├── securityEvents.ts                 listado por cursor y opciones cruzadas con audit.read
│       │   │   └── securityEvents.test.ts            filtros, cursor opaco y query de opciones sin paginación ni organización propia
│       │   └── pages/
│       │       ├── SecurityAuditPage.tsx             cinco columnas, filtros sin cantidades y detalle con grilla/hoja móvil
│       │       └── SecurityAuditPage.test.tsx        filtros, cursor, permisos, errores, detalle, idiomas, 390 y axe
│       └── settings/                                /plataforma/configuracion
│           ├── api/
│           │   ├── platformSettings.ts              GET y PUT versionado de los cinco campos con motivo, sin clave de idempotencia
│           │   └── platformSettings.test.ts         campos/version/reason, respuesta nueva y errores de API
│           └── pages/
│               ├── PlatformSettingsPage.tsx         cinco campos de Registro y altas/Contacto, editor común, límite 1–50 y conflicto de versión
│               ├── PlatformSettingsPage.test.tsx    datos guardados, validación, motivo, versión, concurrencia, idiomas, 390 y axe
│               ├── PlatformSettingsPage.lifetime.test.tsx reintentos nativos, motivo/borrador, permiso y respuestas abandonadas
│               └── SettingsRoutes.test.tsx          Atrás con única decisión, callbacks previos al bloqueo y relecturas con caché
│
├── locales/                                         un namespace por módulo; es y en con las mismas claves
│   ├── es/
│   │   ├── common.json                              [E1]
│   │   ├── errors.json                              [E1]
│   │   ├── format.json                              [E1] textos de los formatos (vacío, relativos, tamaños, duraciones)
│   │   ├── enums.json                               [E1] enums.<Enum>.<Valor>: estados y tipos traducidos
│   │   ├── auth.json                                [E3]
│   │   ├── account.json                             [E3]
│   │   ├── personal.json                            [E3]
│   │   ├── site.json                                [E3] portada; el directorio se suma en [E7]
│   │   ├── legal.json                               [E3] /terminos, /privacidad y la aceptación bloqueante
│   │   ├── invitations.json                         la invitación (/invitacion)
│   │   ├── home.json                                el inicio de la organización: tarjetas, «Tus empresas» y «Para resolver»
│   │   ├── roles.json                               [E4]
│   │   ├── platformTenants.json                     [E5/T21b] listado, alta y confirmaciones de organizaciones
│   │   ├── platformAccounts.json                    [E5/T22a] listado, invitación, acciones y errores de cuentas y operadores
│   │   ├── platformRecoveries.json                  [E5/T23a] pedidos, revisión, resoluciones y errores
│   │   ├── platformLegal.json                       [E5/T23b] vigencia actual/futura, editor y confirmación
│   │   ├── platformAudit.json                       [E5/T23c] filtros, columnas y detalle de la auditoría de seguridad
│   │   ├── platformSettings.json                    [E5/T23d] cinco campos, descripciones, errores y confirmación con motivo
│   │   ├── users.json                               [E6]
│   │   ├── companies.json                           [E6]
│   │   ├── settings.json                            [E6]
│   │   ├── audit.json                               [E6]
│   │   ├── publicPage.json                          [E6] /org/pagina
│   │   └── storefront.json                          [E7] página pública del subdominio
│   ├── en/                                          mismos archivos
│   ├── keys.test.ts                                 cada clave que usa el código existe en los textos
│   └── parity.test.ts                               [E1]
│
├── shared/
│   ├── api/                                         [E1]
│   │   ├── httpClient.ts                            fetch, Bearer, Accept-Language, una renovación ante 401; solo transporta
│   │   ├── httpClient.test.ts
│   │   ├── httpClient.auth.test.ts                  httpClient con sesión: el Bearer y la renovación ante un 401
│   │   ├── ApiError.ts                              code, detail, traceId, errors, retryAfterSeconds
│   │   ├── problemDetails.ts
│   │   ├── accessErrorStore.ts                      el 403 que bloquea la vista (consulta principal o términos nuevos), para AppShell
│   │   ├── errorMessage.ts                          apiErrorMessage, actionErrorMessage y toastActionError: el texto de cada error, sin repetir lo que avisa el MutationCache
│   │   ├── errorMessage.test.ts
│   │   ├── queryClient.ts                           createQueryClient: avisos de red, 5xx y 429 en consultas y mutaciones (salvo meta.silent y meta.handlesError); el 403 de meta.blocksView bloquea la vista
│   │   ├── queryClient.test.ts
│   │   ├── formErrors.ts                            applyApiErrorToForm
│   │   ├── formErrors.test.ts
│   │   ├── pagedResult.ts
│   │   ├── pageSizes.ts                             los tamaños de página (10, 20, 50 y 100), iguales a PagedRequest del OpenAPI
│   │   ├── pageSizes.test.ts                        tests de pageSizes
│   │   ├── useIdempotentMutation.ts                 P6 Idempotency-Key al montar, repetida en los reintentos
│   │   ├── useIdempotentMutation.test.ts
│   │   ├── useRetryAfterCountdown.ts                la cuenta regresiva del 429 en el botón que disparó el pedido; nunca reenvía
│   │   ├── useRetryAfterCountdown.test.tsx          tests de useRetryAfterCountdown
│   │   ├── accountContract.ts                       rutas y códigos de la cuenta que usan varias áreas (/api/me, /api/legal/accept, /cuenta, /aceptar-terminos)
│   │   ├── invitationContract.ts                    las rutas de la invitación (/api/invitations/preview y /accept) y sus query keys
│   │   ├── contracts.test.ts                        los contratos OpenAPI que usa el front
│   │   ├── types.ts                                 [E1] alias legibles escritos a mano; reexporta tipos de generated/schema.d.ts
│   │   └── generated/                               NO SE EDITA A MANO
│   │       └── schema.d.ts                          [E1] única salida de openapi-typescript
│   ├── i18n/                                        [E1]
│   │   ├── index.ts                                 i18next con los textos empaquetados; resolveCulture (cuenta → este navegador → predeterminada) y useEffectiveCulture [E7]
│   │   └── i18n.test.tsx
│   ├── format/                                      [E1] ÚNICO lugar que formatea (formatos.md)
│   │   ├── cultureProfiles.ts                       adapta patrones de Cultures (JSON E1, tabla E2); sin perfiles fijos
│   │   ├── cultureName.ts                           el nombre de una cultura en su propia lengua, con la región («Español (Argentina)»)
│   │   ├── culturePreview.ts                        el ejemplo de formato de una cultura, con los patrones del catálogo
│   │   ├── decimalScale.ts                          mueve la coma decimal sin error binario
│   │   ├── formatters.ts                            formatDate, formatDateTime, formatTime, formatDateLong, formatRelative,
│   │   │                                            formatDateRange, formatInteger, formatDecimal, formatQuantity,
│   │   │                                            formatPercent, formatMoney, formatCompact, formatFileSize,
│   │   │                                            formatDuration, formatPhone, formatTaxId, formatTimeZone,
│   │   │                                            formatCulture, EMPTY
│   │   ├── formatters.test.ts                       recorre ../ArquitecturaBaseMutitenant/docs/contracts/format-cases.json
│   │   ├── parsers.ts                               entrada del usuario en su cultura → contrato de la API
│   │   ├── parsers.test.ts
│   │   ├── useFormat.ts                             la cultura efectiva (useEffectiveCulture); zona y moneda del catálogo o de /api/me
│   │   ├── useFormat.test.tsx                       tests de useFormat
│   │   ├── useFormat.account.test.tsx               el formato con la cultura y la zona de la cuenta
│   │   ├── useDateInTimeZone.ts                     una fecha y hora en la zona que se le pasa (la de una prueba de cuenta), no la del navegador
│   │   ├── personalData.ts                          el correo tapado («lu•••@gmail.com»), como PersonalDataMask.Email del back
│   │   ├── personalData.test.ts                     tests de personalData
│   │   ├── statusTones.ts                           estado → tono visual; Página pública y dominio tienen un registro común entre features, sin duplicar enums
│   │   ├── statusTones.test.ts                      tests de statusTones
│   │   └── format-usage.test.ts                     falla si se formatea fuera de shared/format y shared/time o se fijan catálogos en código
│   ├── time/                                        [E3] zona efectiva de cuenta/empresa/organización
│   │   ├── useEffectiveTimeZone.ts                  cuenta → empresa → organización (en B2B)
│   │   ├── useEffectiveTimeZone.test.tsx            tests de useEffectiveTimeZone
│   │   └── browserTimeZone.ts                       la zona IANA que informa el navegador
│   ├── referenceData/                               [E1] cinco catálogos de GET /api/reference-data
│   │   ├── referenceData.ts                         cliente tipado; opciones habilitadas y traducidas, ETag
│   │   ├── useReferenceData.ts                      TanStack Query, staleTime: Infinity; en la cultura efectiva, una carga por cultura
│   │   ├── useCuitType.ts                           el tipo CUIT del catálogo, para revisar el CUIT de una empresa: el registro de empresa y Empresas
│   │   └── referenceData.test.ts                    catálogos, ausencia de listas fijas y estado de carga
│   ├── account/                                     [E3] lo de la cuenta que usan varias áreas (ADR 0033)
│   │   ├── api/
│   │   │   ├── loginChannels.ts                     los canales con los que se entra (GET /api/auth/methods): correo, Google y, con su módulo, WhatsApp
│   │   │   ├── loginMethods.ts                      los métodos de ingreso: leer, agregar un correo, verificar, quitar, hacer principal y vincular Google
│   │   ├── AddLoginMethodDialog.tsx                 «Agregar correo o teléfono» («Agregar correo» sin el módulo de WhatsApp) y «Verificar tu correo»: el correo tapado, el código en sus casilleros y su error debajo; React Hook Form con zod
│   │   ├── AddLoginMethodDialog.test.tsx            tests de AddLoginMethodDialog
│   │   ├── ChangeLoginMethodDialog.tsx              quitar un método (o desvincular Google) o hacerlo principal, con diálogo de confirmación sin código extra (ADR 0045)
│   │   ├── ChangeLoginMethodDialog.test.tsx         tests de ChangeLoginMethodDialog
│   │   ├── AccountSessionActions.test.tsx           posesión propia del correo y confirmaciones sin OTP extra
│   │   ├── PersonalLoginMethodNotice.tsx            el aviso de método propio, con «Agregar» (Inicio-Personal y Mi cuenta); en el teléfono, la tarjeta de sugerencia
│   │   ├── useLoginChannels.ts                      si se entra con un canal: sin «whatsapp» (sin el módulo), Mi cuenta ofrece «Agregar correo»
│   │   ├── errors.ts                                el código que el back rechaza va debajo de los casilleros
│   │   └── errors.test.ts                           tests de errors
│   ├── platform/                                    [E5] piezas compartidas por las features de Plataforma
│   │   ├── AGENTS.md                                puntero a las reglas de formularios, errores, UI y accesibilidad
│   │   ├── CLAUDE.md                                @AGENTS.md
│   │   ├── ReasonDialog.tsx                         confirmación con motivo y fecha civil opcional; sin ✕; bloqueo conocido, error y respuesta original
│   │   └── ReasonDialog.test.tsx                    validación, pendientes, errores, versión, reintento global, teléfono y axe
│   ├── hooks/                                       [E0] de la base solo los hooks sin dependencias de etapas posteriores; cada uno con su test
│   │   ├── usePagination.ts                         [E0] de la base; página, tamaño, orden y búsqueda en la URL; vuelve a la 1 al cambiar
│   │   │                                            búsqueda, filtro, orden o tamaño; canoniza la URL con replace
│   │   ├── usePagination.test.tsx                   [E0] URL y canónico con replace
│   │   ├── usePagedQuery.ts                         un listado paginado: filtros, página, búsqueda con debounce, consulta, corrección de página y props de Pagination
│   │   ├── usePagedQuery.test.tsx                   la corrección de una página fuera de rango con items vacíos y totalCount > 0
│   │   ├── useCursorList.ts                         [E1] la única forma de listar por cursor: useInfiniteQuery con el cursor opaco, la lista anterior mientras llega la nueva y su meta («Cargar más»)
│   │   ├── useCursorList.test.tsx                   tests de useCursorList
│   │   ├── useDebouncedValue.ts                     [E1] 300 ms para la búsqueda
│   │   ├── useDebouncedValue.test.tsx               tests de useDebouncedValue
│   │   ├── useEditPage.tsx                          lo común de una pantalla que edita algo que ya existe: «Cambios sin guardar», el cartel del 409, la franja del error de guardado y «¿Salir sin guardar?»
│   │   ├── useEditPage.test.tsx                     tests de useEditPage
│   │   ├── useEditForm.ts                           el formulario de esa pantalla: arranca con lo guardado y manda la versión de la lectura de la que partió o, después de guardar, la que respondió; una relectura no la cambia
│   │   ├── useEditForm.test.tsx                     tests de useEditForm
│   │   ├── useDialogFailure.ts                      [E5] error de un diálogo; después de concurrencia o un 409 de estado declarado, invalida su raíz al cerrar
│   │   ├── useDialogFailure.test.ts                 tests de useDialogFailure
│   │   ├── useFilters.ts                            [E0] de la base
│   │   ├── useFilters.test.tsx                      tests de useFilters
│   │   ├── useQueryUpdate.ts                        [E0] de la base
│   │   ├── useUnsavedChangesGuard.ts                [E1] se adapta con ConfirmDialog
│   │   ├── useUnsavedChangesGuard.test.tsx          tests de useUnsavedChangesGuard
│   │   ├── useBreadcrumbLeaf.ts                    [E0] de la base
│   │   ├── useBreadcrumbLeaf.test.tsx               tests de useBreadcrumbLeaf
│   │   ├── useRestoreFocusOnClose.ts                [E0] de la base
│   │   ├── useLocalStorage.ts                       [E0] de la base; prefijo arquitecturabasemt.
│   │   ├── safeStorage.ts                           las preferencias en localStorage; si el navegador no deja guardar, quedan en memoria durante la sesión
│   │   ├── safeStorage.test.ts                      tests de safeStorage
│   │   ├── useMediaQuery.ts                         [E0] de la base
│   │   └── useCountdown.ts                          [E0] de la base
│   ├── lib/                                         [E0]
│   │   ├── initials.ts                              las iniciales de las dos primeras palabras, en mayúscula (Avatar)
│   │   ├── initials.test.ts                         tests de initials
│   │   ├── orderLike.ts                             lo elegido en el orden de lo guardado: sacar un rol y volver a ponerlo no es un cambio (Usuario, «Roles en …» y «Roles de …»)
│   │   ├── orderLike.test.ts                        tests de orderLike
│   │   └── utils.ts                                 [E0] de la base; cn; shared/lib/dateTime.ts no se copia (shared/format nace en [E1])
│   ├── phone/                                       [E1] interpretación telefónica; países desde shared/referenceData
│   │   ├── countries.ts                             ordena/filtra Countries del catálogo; libphonenumber valida prefijos
│   │   ├── countries.test.ts
│   │   ├── phoneInput.ts                            la entrada del teléfono mientras se escribe (AsYouType), para PhoneField
│   │   ├── phoneInput.test.ts                       tests de phoneInput
│   │   ├── CountryFlag.tsx                          bandera SVG (country-flag-icons), carga diferida; nunca emoji
│   │   └── CountryFlag.failure.test.tsx             si falla la importación, el código del país con su nombre accesible
│   └── ui/                                          [E0] solo primitivas shadcn independientes de la base y piezas nuevas sin dependencias posteriores; al copiarlas, --color-* pasa a los tokens de tema.md
│       ├── format/                                  [E1] cómo se VE cada dato (siempre por acá)
│       │   ├── DateText.tsx                         kind: date | dateTime | time | long | relative; <time dateTime>
│       │   ├── DateText.test.tsx                    tests de DateText
│       │   ├── DateInTimeZoneText.tsx               una fecha y hora en la zona que se le pasa (useDateInTimeZone)
│       │   ├── DateRangeText.tsx
│       │   ├── NumberText.tsx                       kind: integer | decimal | quantity | compact
│       │   ├── NumberText.test.tsx                  tests de NumberText
│       │   ├── MoneyText.tsx                        { amount, currency }
│       │   ├── MoneyText.test.tsx                   tests de MoneyText
│       │   ├── CurrencyText.tsx                     una moneda por su nombre y código, «Peso argentino (ARS)»
│       │   ├── PercentText.tsx                      fracción → 12,5 %
│       │   ├── PercentText.test.tsx                 tests de PercentText
│       │   ├── FileSizeText.tsx
│       │   ├── DurationText.tsx
│       │   ├── PhoneText.tsx
│       │   ├── PhoneText.test.tsx                   tests de PhoneText
│       │   ├── TaxIdText.tsx                        20-12345678-6
│       │   ├── TaxIdText.test.tsx                   tests de TaxIdText
│       │   ├── TimeZoneText.tsx                     [E1] ciudad traducida y desfase actual, nunca ID IANA crudo
│       │   ├── TimeZoneText.test.tsx                tests de TimeZoneText
│       │   ├── CultureText.tsx                      [E1] nombre de idioma y región, nunca código crudo
│       │   ├── EnumText.tsx                         enums.<Enum>.<Valor>
│       │   ├── EnumText.test.tsx                    tests de EnumText
│       │   ├── StatusBadge.tsx                      el punto y la palabra, con el tono de statusTones; StatusMark, solo el punto, cuando la palabra va dentro de otro texto
│       │   ├── StatusBadge.test.tsx                 tests de StatusBadge
│       │   ├── BooleanText.tsx                      Sí / No
│       │   ├── EmptyValue.tsx                       — con aria-label "Sin dato"
│       │   └── EmptyValue.test.tsx                  tests de EmptyValue
│       ├── fields/                                  [E1] cómo se CARGA cada dato (parsea la cultura y emite el contrato)
│       │   ├── DateField.tsx                        DateOnly sin zona
│       │   ├── DateField.test.tsx                   tests de DateField
│       │   ├── DateTimeField.tsx                    zona efectiva → ISO UTC
│       │   ├── DateTimeField.test.tsx               tests de DateTimeField
│       │   ├── TimeField.tsx
│       │   ├── NumberField.tsx
│       │   ├── MoneyField.tsx                       importe + CurrencySelect del catálogo
│       │   ├── MoneyField.test.tsx                  tests de MoneyField
│       │   ├── PercentField.tsx                     12,5 → 0.125
│       │   ├── PercentField.test.tsx                tests de PercentField
│       │   ├── PhoneField.tsx                       [E1] CountrySelect + AsYouType → { country, number }; usage="whatsapp" filtra países del canal de GET /api/auth/methods desde [E8]
│       │   ├── PhoneField.test.tsx                  tests de PhoneField
│       │   ├── EmailField.tsx                       P3 trim y minúsculas al escribir
│       │   ├── EmailField.test.tsx                  tests de EmailField
│       │   ├── TaxIdField.tsx                       P5 { type: TaxIdTypes.Code, number } sin separadores, stdnum en E1
│       │   ├── TaxIdField.test.tsx                  tests de TaxIdField
│       │   ├── CurrencySelect.tsx                   monedas habilitadas, ordenadas por SortOrder y nombre
│       │   ├── CurrencySelect.test.tsx              tests de CurrencySelect
│       │   ├── CountrySelect.tsx                    países habilitados; bandera, nombre traducido y CallingCode
│       │   ├── CountrySelect.test.tsx               tests de CountrySelect
│       │   ├── TimeZoneSelect.tsx                   zonas habilitadas; SortOrder, offset actual y ciudad
│       │   ├── TimeZoneSelect.test.tsx              tests de TimeZoneSelect
│       │   ├── CultureSelect.tsx                    culturas habilitadas, cada una en su propia lengua
│       │   └── CultureSelect.test.tsx               tests de CultureSelect
│       ├── button.tsx                               los cuatro tipos y tamaños de «Criterio · Botones»; pending muestra «Guardando…» con su aro
│       ├── button.test.tsx                          tests de button
│       ├── checkbox.tsx                             la bloqueada, en gris
│       ├── checkbox.test.tsx                        tests de checkbox
│       ├── dialog.tsx                               420 (`size="sm"`) o 560 («Criterio · Diálogos»); la única excepción, la vista previa de la Página pública, de 640 (`size="preview"`); DialogBody; en el teléfono, la hoja desde abajo
│       ├── dialog.test.tsx                          tests de dialog
│       ├── dialog.mobile.test.tsx                   el diálogo en el teléfono: la hoja desde abajo
│       ├── dropdown-menu.tsx
│       ├── dropdown-menu.test.tsx                   tests de dropdown-menu
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── select.test.tsx                          tests de select
│       ├── skeleton.tsx
│       ├── sonner.tsx                               los avisos pasajeros: tarjeta blanca abajo a la derecha en la compu; franja oscura abajo en el teléfono; toastErrorWithCode («Copiar código»)
│       ├── sonner.test.tsx                          tests de sonner
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── tabs.test.tsx                            tests de tabs
│       ├── textarea.tsx                             84 de alto, sin tirador
│       ├── textarea.test.tsx                        tests de textarea
│       ├── tooltip.tsx
│       ├── Avatar.tsx                               [E0] pieza nueva propia (PascalCase); el degradé de la marca
│       ├── BrandMark.tsx                            la marca: el cuadrado con degradado y el nombre del producto
│       ├── BrandMark.test.tsx                       tests de BrandMark
│       ├── Banner.tsx                               [E1] de la base, adaptado a los tokens: el cartel debajo de la banda (información, atención o problema)
│       ├── Banner.test.tsx                          tests de Banner
│       ├── CheckboxField.tsx                        [E1] después de i18n
│       ├── CheckboxField.test.tsx                   tests de CheckboxField
│       ├── ConcurrencyBanner.tsx                    [E1] P1 "Otra persona cambió esto…" · «Ver lo nuevo» · «Seguir editando»
│       ├── ConcurrencyBanner.test.tsx               tests de ConcurrencyBanner
│       ├── ConfirmDialog.tsx                        [E1] pieza propia, después de i18n
│       ├── ConfirmDialog.test.tsx                   tests de ConfirmDialog
│       ├── DetailGrid.tsx                           [E5] grilla del detalle en compu y teléfono, extraída de Auditoría sin cambiar sus clases
│       ├── DetailGrid.test.tsx                      grilla, rótulos/valores, teléfono y axe
│       ├── DataTable.tsx                            [E1] encabezado arena de 40 px; filas de 40, o de 52 con una segunda línea gris que aclara la primera; un tema por columna;
│       │                                            cada columna declara su type y la tabla usa ui/format (alineación, vacío y tooltip); carga, vacío, error con reintento;
│       │                                            en el teléfono, la fila de lista de la pantalla (`mobileRow`); sin ella, solo las columnas `mobile` y el ⋮;
│       │                                            en la tablet, sin las `priority: "low"`
│       ├── DataTable.test.tsx                       [E1] P10 a 390 px renderiza solo las columnas primary y status, y el ⋮
│       ├── columns-mobile.test.ts                   [E1] P10 toda definición de columnas tiene exactamente una mobile: "primary"
│       ├── EmptyState.tsx                           [E1] después de i18n
│       ├── EmptyState.test.tsx                      tests de EmptyState
│       ├── ErrorPageFrame.tsx                       el marco de las pantallas de error: el ícono, el título y la salida («Ir al inicio» o «Reintentar»)
│       ├── FilterBar.tsx                            [E0] pieza nueva; buscador + filtros con conteos + «Limpiar filtros», en su tarjeta; en el teléfono, lupa y filtro en la barra y los filtros en una hoja
│       ├── FilterBar.test.tsx                       tests de FilterBar
│       ├── ForbiddenPage.tsx                        «No tenés permiso» dentro del marco del acceso, con «Ir al inicio»
│       ├── FormError.tsx                            [E0] pieza nueva; la franja de error (.aviso-mal; en el teléfono, 14,5 con 12/14 y radio 12) y su tono de información
│       ├── FormError.test.tsx                       tests de FormError
│       ├── FormField.tsx                            [E1] rótulo, control, error y aria-describedby; variant="auth" para el ingreso y el registro (44, radio 10, letra 15)
│       ├── FormField.test.tsx                       tests de FormField
│       ├── IconButton.tsx                           [E1] de la base, adaptado a los tokens
│       ├── IconButton.test.tsx                      tests de IconButton
│       ├── ImportantNotice.tsx                      aviso importante: motivo en caja roja suave, «Qué podés hacer» y «Entendido»
│       ├── ImportantNotice.test.tsx                 tests de ImportantNotice
│       ├── InfoButton.tsx                           el ⓘ que abre el aviso importante
│       ├── List.tsx                                 lista corta en su caja: filas de 44 o 56, lo que aclara en la segunda línea; en el teléfono, filas de la app y la acción en texto
│       ├── List.test.tsx                            tests de List
│       ├── LoadErrorPage.tsx                        «Pantalla de error» (Criterio · Avisos, M-Error-Org «No se pudo abrir»): «No pudimos abrir esta pantalla» y «Reintentar»
│       ├── LoadErrorPage.test.tsx                   tests de LoadErrorPage
│       ├── LoadMore.tsx                             [E1] paginado por cursor
│       ├── LoadMore.test.tsx                        tests de LoadMore
│       ├── MultiSelect.tsx                          [E1] desplegable con casillas y la descripción de cada opción; «Todos» va como casilla junto al rótulo
│       ├── MultiSelect.test.tsx                     tests de MultiSelect
│       ├── NotFoundPage.tsx                         «No encontramos esta página» (Error-Org, M-Error-Org): una ruta que no existe, un módulo apagado o una ficha que el back no encuentra
│       ├── OtpInput.tsx                             [E3] ingreso y verificación de códigos
│       ├── OtpInput.test.tsx                        tests de OtpInput
│       ├── Page.tsx                                 [E1] banda blanca: ícono o backTo, título de 18 px, segunda línea, pestañas (una por grupo, con dos o más; con uno solo, sin barra), cartel y acciones (las que sobran, en ⋮); en el teléfono, la pantalla de la app: título en la barra, «+» flotante y botones fijos abajo
│       ├── Page.test.tsx                            tests de Page
│       ├── Pagination.tsx                           [E1] "1–10 de 1.234" · "Página 1 de 124" · selector 10/20/50/100; en el teléfono, «Cargar más»
│       ├── Pagination.test.tsx                      tests de Pagination
│       ├── PublicPageCard.tsx                       la tarjeta de la página pública de una organización (Pagina-Publica y M-Pagina-Publica): logo o iniciales, nombre,
│       │                                            descripción, los datos cargados con su ícono e «Ingresá para continuar»; la usan la vista previa de Página pública
│       │                                            (sin enlaces) y la página del subdominio [E7] (`links`, `signInHref`); `publicPageBackdropClass`, su fondo
│       ├── PublicPageCard.test.tsx                  tests de PublicPageCard
│       ├── RadioGroupField.tsx                     [E1] de la base, adaptado a los tokens
│       ├── RadioGroupField.test.tsx                 tests de RadioGroupField
│       ├── ReadOnlyField.tsx                        lo que no se edita, como texto (nunca un campo gris)
│       ├── RowActions.tsx                           [E1] menú ⋮ por fila; las destructivas al final, en rojo
│       ├── RowActions.test.tsx                      tests de RowActions
│       ├── SearchSelect.tsx                         desplegable de una opción; con más de 10, suma un buscador
│       ├── SearchSelect.test.tsx                    tests de SearchSelect
│       ├── Section.tsx                              una caja por tema con el título en el encabezado arena; SectionFields, el relleno de sus campos; en el teléfono, grupo blanco sobre gris, tarjeta con margen o campos sueltos
│       ├── Section.test.tsx                         tests de Section
│       ├── SegmentedControl.tsx                     [E1] de la base, adaptado a los tokens
│       ├── SegmentedControl.test.tsx                tests de SegmentedControl
│       ├── Sheet.tsx                                [E1] P10 hoja desde abajo en el teléfono, con manija y botones de 48 a lo ancho: la forma del Dialog y de la hoja de filtros
│       ├── Sheet.test.tsx                           tests de Sheet
│       ├── Spinner.tsx                              [E1] de la base, adaptado a los tokens
│       ├── Spinner.test.tsx                         tests de Spinner
│       ├── StatusDot.tsx                            [E0] pieza nueva
│       ├── StatusDot.test.tsx                       tests de StatusDot
│       ├── Surface.tsx                              [E0] pieza nueva
│       ├── IconDefaults.tsx                         el trazo 1.75 de los íconos de lucide, una sola vez en la raíz de la app
│       ├── IconDefaults.test.tsx                    tests de IconDefaults
│       ├── icons.tsx                                [E1] SVG propios, trazo 1.75; los de las áreas, con el dibujo del marco de los tableros
│       ├── icons.test.tsx                           tests de icons
│       └── app/                                     el marco de app del teléfono (tableros M-*, «Criterio · Marco y pantallas»)
│           ├── AppChrome.tsx                        si es un teléfono, a dónde vuelve «‹», qué va debajo del título y si se esconde la barra de abajo
│           ├── AppBar.tsx                           barra con el título grande o «‹» y el título; debajo, los avisos que siguen pasando
│           ├── AppBarTools.tsx                      lugar en la barra para la lupa y el filtro
│           ├── AppNotices.tsx                       la barra reclama los avisos de toda la app («Sin conexión», «Hay una versión nueva»)
│           ├── PhoneBand.tsx                        la banda debajo de la barra: sin conexión, el 409 y el error de guardado (M-Avisos, M-Usuario, M-Pagina-Org)
│           ├── BottomNav.tsx                        barra de abajo: hasta cuatro secciones y «Más»
│           ├── Fab.tsx                              el «+» flotante para crear
│           ├── FixedActions.tsx                     botones fijos abajo; esconde la barra de abajo
│           ├── ListRow.tsx                          fila de lista de borde a borde, hasta tres líneas
│           ├── SettingsGroup.tsx                    título de grupo, grupo blanco sobre gris y filas con «›»
│           ├── app.test.tsx                         la barra, la barra de abajo, el «+», los botones fijos y los grupos
│           └── lists.test.tsx                       en el teléfono, filas de lista, filtros en una hoja y «Cargar más»
│
└── test/                                            [E0]
    ├── HarnessStage.ts                              [E0] lista explícita de etapas cerradas del arnés; permite etapas no contiguas
    ├── harness.test.ts                              [E0] punteros, enlaces y fichas; exige tests solo hasta HarnessStage
    ├── structure.test.ts                            [E0] sin imports entre features ni entre áreas
    ├── setup.ts                                     [E0] mínimo: jest-dom y vitest-axe, sin i18n; MSW y namespaces se suman en [E1]
    ├── visualApp.html                               la entrada del arnés visual
    ├── visualApp.tsx                                el arnés visual de las capturas: la app con un fixture de /api/me (?as=) y createQueryClient
    ├── access-paths.test.ts                         ningún literal «/org» ni «/login/empresa» fuera de tenancy/access.ts
    ├── proxy-prefixes.test.ts                       los prefijos del proxy de Vite son los del back
    ├── submit-buttons.test.ts                       ningún botón de envío se apaga porque falta algo o porque algo está mal; solo «Guardar cambios» sin cambios y lo que espera (formularios.md)
    ├── roles-contract.test.ts                       el contrato de Roles entre back y front
    ├── platform-contract.test.ts                    los contratos de Plataforma entre back y front
    ├── organization-audit-contract.test.ts          el contrato de la auditoría de la organización entre back y front
    ├── invitation-contract.test.ts                  el contrato de las invitaciones entre back y front
    ├── business-signup-contract.test.ts             el contrato del alta de empresa entre back y front
    ├── account-contract.test.ts                     el contrato de la cuenta entre back y front
    ├── mocks/                                       [E1] no se copia en E0
    │   ├── server.ts                                [E1] MSW con onUnhandledRequest: error
    │   ├── handlers.ts                              [E1] handlers genéricos; /api/me y auth se suman en [E3]
    │   ├── mocks.test.ts                            tests de mocks
    │   ├── authContext.ts                           el contexto de sesión de un fixture, sin OIDC
    │   ├── currentUsers.ts                          [E3] fixtures: persona sin/con organizaciones, empresa admin/sin permisos y operador
    │   ├── currentUsers.test.tsx                    tests de currentUsers
    │   ├── platformReasons.ts                       confirmaciones literales v111 para capturar las piezas de Plataforma
    │   ├── platformTenants.ts                       siete organizaciones literales v111 y filas adicionales exclusivas del paginado de prueba
    │   ├── platformOrganization.ts                  ficha, Dueños e Historial de Organizacion v111 con fechas UTC para las capturas
    │   ├── platformOrganizationAdministration.ts    TestFeatures, dominios y página pública de Organizacion v111, con versiones reales del contrato
    │   ├── platformAccounts.ts                      once cuentas literales v111, fechas UTC y ficha mínima para el bloqueo real de baja en el listado
    │   ├── platformAccountDetail.ts                 ficha Cuenta-Plat: estados, métodos, roles globales, historial y permisos
    │   ├── platformRecoveries.ts                    pedidos v111 tapados y nuevo correo disponible hasta E8
    │   ├── platformLegal.ts                         versiones legales vigentes y futuras v111, fechas UTC y POST201
    │   ├── platformAudit.ts                         resúmenes del productor, ingresos sin IP, 25 filas y cursor real
    │   └── platformSettings.ts                      configuración v111 sin gracia, PUT200 con versión nueva o409
    ├── PlatformReasonCapture.tsx                    diálogo real aislado, fondo pendiente hasta implementar cada pantalla
    └── utils/
        ├── renderWithProviders.tsx                  [E1] renderWithProviders; as y host se suman con auth [E3] y subdominios [E7]; devuelve el QueryClient, para una relectura de fondo [E7]
        ├── renderWithProviders.test.tsx             tests de renderWithProviders
        ├── isolation.ts                             resetBetweenTests: lo que una prueba deja en módulos compartidos (el bloqueo de la vista, los avisos) no lo ve la siguiente
        ├── isolation.test.tsx                       tests de isolation
        └── phone.ts                                 asPhone(): simula un teléfono de 390 px y devuelve cómo deshacerlo
```

## Piezas de los estándares P1 a P10 (adoptados el 2026-09-27)

Cada pieza está en su carpeta del árbol, con su etapa.

```
P1   src/shared/ui/ConcurrencyBanner.tsx
P3   src/shared/ui/fields/EmailField.tsx
P5   src/shared/ui/fields/TaxIdField.tsx
P6   src/shared/api/useIdempotentMutation.ts
P7   src/areas/public/legal/ · src/areas/platform/legal/
P8   src/auth/usePermissions.ts (hasFeature) · src/areas/platform/tenants/tabs/OrganizationModulesTab.tsx
P9   src/test/setup.ts
P10  src/shared/ui/Sheet.tsx · src/shared/ui/DataTable.tsx · src/shared/ui/DataTable.test.tsx · src/shared/ui/columns-mobile.test.ts
```
