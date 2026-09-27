# Árbol del front

> Estructura objetivo, archivo por archivo. `[E#]` es la etapa del plan (`../ArquitecturaBaseMutitenant/docs/plans/2026-09-27-plan-de-desarrollo.md`) en que nace; sin marca, hereda la de su carpeta. Los tests van al lado del archivo que prueban (`X.test.tsx`); acá se listan solo los que son obligatorios. `node_modules/` y `dist/` no se listan.

## Raíz

```
ArquitecturaBaseMutitenantFront/
├── .github/
│   └── workflows/
│       └── ci.yml                                   [E0] npm ci + contracts:check + build + lint + test
├── docs/
│   ├── architecture/
│   │   ├── frontend.md                              arquitectura canónica
│   │   ├── formatos.md                              catálogo de formatos (es-AR / en-US)
│   │   ├── arnes.md                                 fichas, punteros por carpeta y verificación
│   │   └── arbol.md                                 este archivo
│   ├── rules/                                       fichas del arnés: README + 10 temas
│   ├── design/
│   │   └── visual-baseline.md                       [E0] contrato visual (heredado + reglas de pantallas)
│   ├── plans/                                       planes detallados de las etapas del front
│   └── specs/
├── public/
│   └── favicon.svg
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
├── package.json                                     [E0] dev, build, lint, test, contracts, contracts:check
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json                                alias @/* → src/*
├── tsconfig.node.json
└── vite.config.ts                                   proxy /api /account /connect /.well-known /webhooks → Api (Aspire); puerto 5174
```

## src/

```
src/
├── main.tsx                                         [E0]
├── App.tsx                                          [E0] RouterProvider
├── App.test.tsx
├── index.css                                        [E0] tokens de Tailwind 4 (marca, superficies, estados, radios)
├── silent-renew.ts                                  [E3]
├── vite-env.d.ts
│
├── app/                                             [E0]
│   ├── providers.tsx                                QueryClient + Auth + i18n + Toaster
│   ├── router.tsx                                   createBrowserRouter
│   ├── routes.tsx                                   árbol por host: dominio principal (public, personal, business, platform)
│   │                                                o subdominio de empresa (storefront); lazy
│   ├── routes.test.tsx                              cada ruta con su acceso, su permiso y su módulo
│   └── routes-by-host.test.ts                       un subdominio no monta /org, /mi ni /plataforma
│
├── auth/                                            [E3]
│   ├── AuthProvider.tsx                             react-oidc-context + puente al httpClient
│   ├── authConfig.ts                                client_id web, code + PKCE, InMemoryWebStorage
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
│   └── useLanguagePreference.ts                     PUT /api/me con rollback
│
├── tenancy/                                         [E3] accesos (B2C / B2B / plataforma)
│   ├── useAccess.ts                                 acceso activo, organización activa, espacio personal, organizaciones
│   ├── useSwitchAccess.ts                           signinSilent({ access, tenant }) → queryClient.clear() → inicio del acceso
│   ├── useSwitchAccess.test.ts                      verifica el clear de la caché
│   ├── AccessMenu.tsx                               «Ir a mi empresa» / organizaciones / «Ir a mi espacio personal»
│   ├── AccessMenu.test.tsx                          en B2C nunca aparece «Registrar empresa»
│   ├── accessHome.ts                                acceso → ruta de inicio (/mi, /org, /plataforma)
│   ├── usePublicSite.ts                             [E7] slug y datos públicos del subdominio
│   └── useCompanyParam.ts                           [E6] companyId de la URL
│
├── layouts/
│   ├── AuthLayout.tsx                               [E3]
│   ├── PersonalLayout.tsx                           [E3] acceso B2C: Inicio, Mi cuenta + módulos B2C (sin organizaciones)
│   ├── SiteLayout.tsx                               [E7] portada de la plataforma y página pública del subdominio
│   ├── BusinessLayout.tsx                           [E3] sidebar + topbar con la organización
│   ├── PlatformLayout.tsx                           [E3]
│   ├── navigation/
│   │   ├── types.ts                                 grupos, ramas, links con permiso
│   │   ├── personal.ts
│   │   ├── business.ts                              "Gestión de usuarios" ▸ Usuarios, Roles y permisos
│   │   ├── platform.ts
│   │   └── navigation.test.ts                       el permiso de cada link = el de su ruta
│   └── components/
│       ├── Sidebar.tsx                              colapsable, drawer en móvil
│       ├── Sidebar.test.tsx
│       ├── Topbar.tsx
│       ├── Breadcrumbs.tsx
│       ├── Breadcrumbs.test.tsx
│       ├── UserMenu.tsx                             cuenta, idioma, AccessMenu, salir
│       └── UserMenu.test.tsx
│
├── areas/
│   ├── public/                                      dominio principal, sin sesión o con cualquier acceso
│   │   ├── site/                                    [E7] portada de la plataforma + directorio de empresas publicadas
│   │   ├── auth/                                    [E3]
│   │   │   ├── api/
│   │   │   │   ├── loginCode.ts
│   │   │   │   ├── loginLink.ts
│   │   │   │   ├── signup.ts                        registro de personas
│   │   │   │   ├── businessSignup.ts                [E6] «Registrá tu empresa» + disponibilidad del slug
│   │   │   │   └── invitations.ts
│   │   │   ├── components/
│   │   │   │   ├── EmailCodeForm.tsx
│   │   │   │   ├── WhatsAppCodeForm.tsx             [E8]
│   │   │   │   └── GoogleButton.tsx                 [E11]
│   │   │   ├── lib/
│   │   │   │   ├── returnUrl.ts
│   │   │   │   └── loginCodeState.ts
│   │   │   ├── errors.ts                            códigos Auth.* → texto o campo
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx                    /ingresar (persona) y /empresas/ingresar (empresa): misma pantalla, otra puerta
│   │   │       ├── LoginCodePage.tsx
│   │   │       ├── LoginLinkPage.tsx
│   │   │       ├── SignupPage.tsx                   /registro: crear cuenta de persona
│   │   │       ├── BusinessPortalPage.tsx           [E6] /empresas: portal Empresas
│   │   │       ├── BusinessSignupPage.tsx           [E6] /empresas/registro: «Registrá tu empresa»
│   │   │       ├── RecoverAccountPage.tsx           [E5] «Recuperar mi cuenta» (ADR 0033)
│   │   │       ├── CallbackPage.tsx
│   │   │       └── AcceptInvitationPage.tsx
│   │   └── errors/                                  [E3]
│   │       └── pages/
│   │           ├── ForbiddenPage.tsx
│   │           ├── NotFoundPage.tsx
│   │           └── OrganizationSuspendedPage.tsx    con el menú para cambiar de organización o de acceso
│   │
│   ├── storefront/                                  [E7] SUBDOMINIO de una empresa: su página pública
│   │   ├── pages/PublicPage.tsx                     nombre, logo, descripción, contacto (+ lo que publiquen los módulos)
│   │   └── <módulo público del producto>/           lo que una persona ve y pide; interactuar pide el acceso B2C
│   │
│   ├── personal/                                    ACCESO B2C (espacio personal)
│   │   ├── home/                                    [E7]
│   │   │   └── pages/PersonalHomePage.tsx           vacía hasta que el producto defina qué va
│   │   ├── account/                                 [E3] la cuenta: vale en los dos accesos
│   │   │   ├── api/account.ts
│   │   │   ├── components/
│   │   │   │   ├── AccountForm.tsx                  nombre, idioma y región, zona
│   │   │   │   ├── LoginMethodsSection.tsx          correos, teléfonos y Google; principal; administrados por una empresa
│   │   │   │   ├── AddLoginMethodDialog.tsx         sumar un correo o teléfono y verificarlo
│   │   │   │   ├── PersonalMethodBanner.tsx         «Agregá un correo personal…» (ADR 0033)
│   │   │   │   ├── VerifyDestinationDialog.tsx
│   │   │   │   └── UnlinkWhatsAppDialog.tsx         [E8]
│   │   │   ├── errors.ts
│   │   │   └── pages/AccountPage.tsx                /mi/cuenta
│   │   └── <módulo B2C del producto>/               misma forma que business/roles: api · columns · errors · components · pages
│   │
│   ├── business/                                    ACCESO B2B (la organización)
│   │   ├── home/                                    [E6]
│   │   │   └── pages/BusinessHomePage.tsx
│   │   ├── roles/                                   [E4] ← FEATURE DE REFERENCIA
│   │   │   ├── api/roles.ts                         query keys + funciones tipadas con generated/
│   │   │   ├── columns.tsx                          incluye "Vale en"
│   │   │   ├── errors.ts
│   │   │   ├── lib/
│   │   │   │   ├── permissionPicker.ts
│   │   │   │   └── systemRoles.ts
│   │   │   ├── components/
│   │   │   │   ├── PermissionPicker.tsx             desplegable por área con "Todos"
│   │   │   │   └── RoleScopeField.tsx               Organización / Empresa
│   │   │   └── pages/
│   │   │       ├── RolesPage.tsx
│   │   │       ├── RolesPage.test.tsx
│   │   │       ├── RoleEditorPage.tsx               una hoja: nombre, «Vale en», descripción y un desplegable de permisos por área
│   │   │       └── RoleEditorPage.test.tsx
│   │   ├── users/                                   [E6]
│   │   │   ├── api/users.ts
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
│   │   ├── settings/                                [E6]
│   │   │   ├── api/settings.ts
│   │   │   └── pages/SettingsPage.tsx
│   │   ├── audit/                                   [E6]
│   │   │   ├── api/audit.ts
│   │   │   ├── columns.tsx
│   │   │   ├── components/AuditFilterBar.tsx
│   │   │   └── pages/AuditPage.tsx
│   │   ├── public-page/                             [E6] /org/pagina: mi página pública (datos, subdominio, publicar)
│   │   │   ├── api/publicPage.ts
│   │   │   └── pages/PublicPageEditorPage.tsx
│   │   └── <módulo B2B del producto>/               misma forma que roles/
│   │
│   └── platform/                                    ÁREA PLATAFORMA [E5]
│       ├── home/
│       │   └── pages/PlatformHomePage.tsx
│       ├── tenants/
│       │   ├── api/tenants.ts
│       │   ├── columns.tsx
│       │   ├── errors.ts
│       │   ├── components/
│       │   │   ├── CreateOrganizationDialog.tsx
│       │   │   └── ChangeStatusDialog.tsx           aprobar, suspender, reactivar o cerrar, con motivo
│       │   └── pages/
│       │       ├── OrganizationsPage.tsx
│       │       └── OrganizationPage.tsx
│       ├── accounts/
│       │   ├── api/accounts.ts
│       │   ├── columns.tsx
│       │   ├── components/ChangeAccountStatusDialog.tsx
│       │   └── pages/
│       │       ├── AccountsPage.tsx
│       │       └── AccountPage.tsx                  identidad, sus métodos de ingreso y sus organizaciones
│       ├── operators/
│       │   ├── api/operators.ts
│       │   ├── columns.tsx
│       │   ├── components/AddOperatorDialog.tsx
│       │   └── pages/OperatorsPage.tsx
│       ├── audit/
│       │   ├── api/securityEvents.ts
│       │   ├── columns.tsx
│       │   └── pages/SecurityAuditPage.tsx
│       ├── settings/
│       │   ├── api/platformSettings.ts
│       │   └── pages/PlatformSettingsPage.tsx       ConsumerSignup, BusinessSignup, límite de organizaciones
│       └── whatsapp/                                [E8]
│           ├── api/whatsapp.ts
│           └── pages/WhatsAppPage.tsx
│
├── locales/                                         un namespace por módulo; es y en con las mismas claves
│   ├── es/
│   │   ├── common.json                              [E1]
│   │   ├── errors.json                              [E1]
│   │   ├── auth.json                                [E3]
│   │   ├── account.json                             [E3]
│   │   ├── roles.json                               [E4]
│   │   ├── platform.json                            [E5]
│   │   ├── users.json                               [E6]
│   │   ├── companies.json                           [E6]
│   │   ├── settings.json                            [E6]
│   │   ├── audit.json                               [E6]
│   │   ├── enums.json                               [E1] enums.<Enum>.<Valor>: estados y tipos traducidos
│   │   └── personal.json                            [E7]
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
│   │   └── generated/                               NO SE EDITA A MANO
│   │       ├── schema.d.ts                          salida de openapi-typescript
│   │       └── types.ts                             alias legibles: type RoleRow = Schemas["RoleRow"]
│   ├── i18n/                                        [E1]
│   │   ├── index.ts
│   │   └── i18n.test.tsx
│   ├── format/                                      [E1] ÚNICO lugar que formatea (formatos.md)
│   │   ├── cultureProfiles.ts                       es-AR y en-US: patrones, 24/12 h, separadores, espacio antes de %
│   │   ├── formatters.ts                            formatDate, formatDateTime, formatTime, formatDateLong, formatRelative,
│   │   │                                            formatDateRange, formatInteger, formatDecimal, formatQuantity,
│   │   │                                            formatPercent, formatMoney, formatCompact, formatFileSize,
│   │   │                                            formatDuration, formatPhone, formatTaxId, EMPTY
│   │   ├── parsers.ts                               entrada del usuario en su cultura → contrato de la API
│   │   ├── useFormat.ts                             cultura + zona + moneda ya resueltas → formateadores
│   │   ├── statusTones.ts                           estado → tono visual (success, warning, danger, neutral)
│   │   ├── formatters.test.ts                       recorre ../ArquitecturaBaseMutitenant/docs/contracts/format-cases.json
│   │   ├── parsers.test.ts
│   │   └── format-usage.test.ts                     falla si hay toLocaleString, toFixed o Intl. fuera de shared/format
│   ├── time/                                        [E3]
│   │   ├── useEffectiveTimeZone.ts                  cuenta → empresa → organización (en B2B)
│   │   ├── timeZones.ts                             GET /api/time-zones
│   │   └── TimeZoneSelect.tsx
│   ├── hooks/                                       [E0] copiados de la base, cada uno con su test
│   │   ├── usePagination.ts                         página, tamaño, orden y búsqueda en la URL; vuelve a la 1 al cambiar
│   │   │                                            búsqueda, filtro, orden o tamaño; corrige una página fuera de rango
│   │   ├── useCursorList.ts                         useInfiniteQuery para auditoría y actividad ("Cargar más")
│   │   ├── useDebouncedValue.ts                     300 ms para la búsqueda
│   │   ├── useFilters.ts
│   │   ├── useQueryUpdate.ts
│   │   ├── useUnsavedChangesGuard.ts
│   │   ├── useBreadcrumbLeaf.ts
│   │   ├── useRestoreFocusOnClose.ts
│   │   ├── useLocalStorage.ts                       prefijo arquitecturabasemt.
│   │   ├── useMediaQuery.ts
│   │   └── useCountdown.ts
│   ├── lib/
│   │   └── utils.ts                                 cn
│   ├── phone/                                       [E1] países y teléfonos (rules/telefonos.md)
│   │   ├── countries.ts                             lista completa de libphonenumber-js + nombres con Intl.DisplayNames
│   │   ├── priorityCountries.ts                     AR, UY, CL, PY, BR, BO, PE, MX, ES, US arriba
│   │   ├── CountryFlag.tsx                          bandera SVG (country-flag-icons), carga diferida; nunca emoji
│   │   ├── CountrySelect.tsx                        combobox con buscador por nombre, ISO o prefijo
│   │   └── countries.test.ts
│   └── ui/                                          [E0]
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
│       │   └── PhoneField.tsx                       CountrySelect + número con AsYouType → { country, number }
│       ├── badge.tsx                                shadcn (minúscula, `npx shadcn@4.21.0 add`)
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
│       ├── Avatar.tsx                               propios (PascalCase)
│       ├── Banner.tsx
│       ├── CheckboxField.tsx
│       ├── ConfirmDialog.tsx
│       ├── DataTable.tsx                            filas de 42 px, un dato por columna, encabezado gris; cada columna declara su type y la tabla usa ui/format
│       │                                            (alineación, vacío y tooltip); carga, vacío, error con reintento
│       ├── EmptyState.tsx
│       ├── FilterBar.tsx                            buscador + filtros en pastilla con conteos + «Limpiar»
│       ├── FormError.tsx
│       ├── FormField.tsx
│       ├── IconButton.tsx
│       ├── MultiSelect.tsx
│       ├── OtpInput.tsx
│       ├── Page.tsx                                 banda blanca: ícono o backTo, título de 18 px, resumen y acciones (las que sobran, en ⋮)
│       ├── Pagination.tsx                           "1–10 de 1.234" · "Página 1 de 124" · selector 10/20/50/100, 10 por defecto (números con useFormat)
│       ├── LoadMore.tsx                             paginado por cursor
│       ├── RadioGroupField.tsx
│       ├── RowActions.tsx                           menú ⋮ por fila; las destructivas al final, en rojo
│       ├── SearchInput.tsx
│       ├── SegmentedControl.tsx
│       ├── Spinner.tsx
│       ├── StatusDot.tsx
│       ├── Surface.tsx
│       ├── VerificationBadge.tsx
│       └── icons.tsx                                SVG propios, trazo 1.75
│
└── test/                                            [E0]
    ├── harness.test.ts                              punteros por carpeta, enlaces vivos, fichas completas
    ├── structure.test.ts                            sin imports entre features ni entre áreas
    ├── setup.ts                                     MSW (onUnhandledRequest: error), namespaces precargados, stubs
    ├── mocks/
    │   ├── server.ts
    │   ├── handlers.ts                              /api/me y los métodos de ingreso por defecto
    │   └── currentUsers.ts                          fixtures: personal, business (admin y sin permisos), operador
    └── utils/
        └── renderWithProviders.tsx                  renderWithProviders + renderRouteWithProviders(path, { profile })
```

## Piezas de los estándares P1 a P10 (adoptados el 2026-09-27)

```
src/shared/api/useIdempotentMutation.ts (+ test)          [E1] P6  clave al montar, repetida en reintentos
src/shared/ui/fields/EmailField.tsx                       [E1] P3  trim y minúsculas al escribir
src/shared/ui/fields/TaxIdField.tsx                       [E1] P5  tipo + número, stdnum
src/shared/ui/ConcurrencyBanner.tsx                       [E1] P1  "Otra persona cambió esto…" · Ver lo nuevo · Seguir editando
src/shared/ui/Sheet.tsx                                   [E1] P10 panel inferior de filtros en el teléfono
src/shared/ui/DataTable.tsx                               [E1] P10 tabla ↔ tarjetas según `mobile` de cada columna
src/auth/useFeature.ts · Feature.tsx                      [E5] P8  módulos del acceso activo
src/areas/public/legal/pages/AcceptTermsPage.tsx          [E3] P7  pantalla bloqueante de términos nuevos
src/test/setup.ts                                         [E0] P9  vitest-axe/extend-expect
src/shared/ui/columns-mobile.test.ts                      [E1] P10 toda definición de columnas declara `mobile`
```
