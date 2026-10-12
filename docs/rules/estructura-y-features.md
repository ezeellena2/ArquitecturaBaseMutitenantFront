# Estructura y features

**Regla:** el código vive en `src/areas/{public,storefront,personal,business,platform}/<feature>/`, siempre con la misma forma. Una feature no importa de otra y un área no importa de otra. Lo común sube a `shared/`.

## Cómo se hace
```
<feature>/
├── api/<recurso>.ts     query keys + funciones (tipos de generated/); un archivo por recurso, con sus subrecursos (ej. companies.ts lleva también los miembros y los roles de una empresa)
├── columns.tsx          columnas tipadas de cada tabla (create<X>Columns), su fila del teléfono (<x>PhoneRow) y los tonos de sus estados (ej. createCompanyColumns y createCompanyMemberColumns)
├── errors.ts            switch (error.code)
├── components/          diálogos y piezas propias
├── tabs/                una pestaña por archivo (<X>Tab.tsx) y el hook de sus datos (use<X>.ts); una pestaña por grupo de datos (pantallas-y-ui)
├── lib/                 lógica pura de la feature (con tests)
└── pages/               una pantalla por archivo, lazy en routes.tsx
```
Las carpetas que la feature no necesita no se crean (`audit/` tiene solo `api/` y `pages/`).
- La página del subdominio es `areas/storefront/site/pages/PublicPage.tsx`: `site` es la feature. `pages` no es una feature ni cuelga directamente del área. Portada y directorio comparten `api/directory.ts` y `components/CompanyCard.tsx` dentro de `areas/public/site`.
- La sesión pública y los helpers de host se comparten desde `tenancy/`; `usePublicSite` tiene una única función HTTP y una única clave de consulta. El núcleo no importa APIs de un área. Un módulo Personal sigue la [receta B2C](personal.md).
- Una ruta nueva se declara una vez en el manifiesto de su área (`layouts/navigation/<área>.ts`: camino, permiso, módulo y, si va en el menú, rótulo e ícono); `app/routes.tsx` le suma su pantalla con `lazyPage`.
- Si dos features necesitan lo mismo, se mueve a `shared/` (por ejemplo `shared/account/`, que usan Mi cuenta y el Inicio personal); no se importa de la otra feature.
- Imports con alias `@/`. `import type` para los tipos.

### Módulos opcionales (E8b)
- Cada módulo en `src/modules/<nombre>/` aporta un `registration.ts` con rutas, navegación e inicio mediante el contrato neutral `shared/modules/types.ts`. Sólo `app/moduleComposition.ts` importa registros concretos; el núcleo, las áreas y los layouts no importan páginas ni APIs de módulos. Quitar esa entrada y su carpeta deja los inicios del núcleo operativos. El registro aporta también los recursos de idioma y el cargador de fixtures; alias, textos y datos de prueba exclusivos permanecen dentro de esa carpeta.
- `ModuleRoutePage` decide desde `/api/me` antes de montar React.lazy: espera la sesión, muestra 404 si no está instalado/habilitado y 403 sin permiso. No usar `route.lazy` para páginas de módulos: React Router lo carga antes de renderizar las guardas padre. AccessRoute y los términos siguen por encima.
- `useNavigation` compone el mismo manifiesto para el marco y Más; conserva permisos del núcleo y contribuciones independientes. Los permisos propios viven en el registro, sin ampliar los arrays de `auth/usePermissions`. Una ruta sólo aporta un enlace cuando tiene su página real.
- Administración conserva primero los grupos del núcleo y sus filas, después los grupos de módulos (`moreGroup`) y al final las filas que el manifiesto marca `afterModuleGroups`. El lienzo empresarial conserva Auditoría como fila de cierre; el componente no compara nombres de módulos, etiquetas ni rutas. Verifica `layouts/components/AdminPanel.test.tsx`.
- El inicio de cada área conserva sus consultas y componentes; `ModuleHome` recibe sus bloques y avisos mediante slots. En teléfono conserva Inicio y abre el módulo como segunda sección; hasta cuatro secciones más Más.
- Plataforma conserva Organizaciones en `/plataforma` sin chat autorizado. Con inicio de módulo usa `/plataforma/organizaciones`; ese alias siempre conserva `platform.tenants.read`. La gestión del asistente se decide por capability instalada + `canConfigure`/`canReadUsage`, independientemente de `available`; Empresa usa feature + `assistant.configure`, independientemente de `assistant.use`.
- El registro del asistente aporta chat, inicio, Configuración (T12), política de clave propia y páginas de Uso (T13) contra CC03–CC06 publicados. Configuración y Uso usan permisos independientes del chat. Uso transporta el resumen y sus filas como una única respuesta mensual; nunca suma costos, infiere financiación histórica ni consulta State para completar datos. Un error HTTP muestra el error de lectura; los fixtures de MSW/galería no acreditan implementación Back. La excepción humana aprobada el 11/10/2026 retira del resumen Business la financiación y cuota global fijas del lienzo: conserva costo/consultas/personas y presupuesto/progreso aplicables publicados; sólo DailyUsage/DailyLimit respaldan cuotas personales, sin trasladar topes actuales a meses históricos.
- Verifican `shared/modules/boundaries.test.ts`, `ModuleRegistry.test.tsx`, `modules/assistant/navigation.test.ts` y `modules/assistant/composition.test.tsx`.

## Prohibido
- `import … from "@/areas/business/users/…"` desde otra feature o área.
- Componentes definidos dentro de otros.
- `any`, `@ts-ignore` o `as` para esconder un error de tipos.

## Copiá de
- `src/areas/business/roles/` completo (E4)
- `src/areas/business/companies/` para una ficha con pestañas (E6)
- `src/areas/platform/tenants/` y `src/shared/platform/ReasonDialog.tsx` (E5): features separadas por recurso y confirmación compartida; `src/shared/hooks/useDialogFailure.ts`, `src/shared/ui/DetailGrid.tsx` y `src/tenancy/publicSite.ts` son las extracciones de T20d.

## Lo verifica
- `structure.test.ts` (E0)

## Detalle
[frontend.md §2](../architecture/frontend.md#2-estructura) · [arbol.md](../architecture/arbol.md)
