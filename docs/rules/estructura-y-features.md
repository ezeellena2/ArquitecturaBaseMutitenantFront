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
- Una ruta nueva se declara una vez en el manifiesto de su área (`layouts/navigation/<área>.ts`: camino, permiso, módulo y, si va en el menú, rótulo e ícono); `app/routes.tsx` le suma su pantalla con `lazyPage`.
- Si dos features necesitan lo mismo, se mueve a `shared/` (por ejemplo `shared/account/`, que usan Mi cuenta y el Inicio personal); no se importa de la otra feature.
- Imports con alias `@/`. `import type` para los tipos.

## Prohibido
- `import … from "@/areas/business/users/…"` desde otra feature o área.
- Componentes definidos dentro de otros.
- `any`, `@ts-ignore` o `as` para esconder un error de tipos.

## Copiá de
- `src/areas/business/roles/` completo (E4)
- `src/areas/business/companies/` para una ficha con pestañas (E6)
- `src/areas/platform/tenants/` y `src/shared/platform/ReasonDialog.tsx` (E5): features separadas por recurso y confirmación compartida; `src/shared/hooks/useDialogFailure.ts`, `src/shared/ui/DetailGrid.tsx` y `src/tenancy/publicSite.ts` son las extracciones de T20d.

## Lo verifica
- `tsc -b` estricto y `oxlint`.
- `structure.test.ts` (E0): sin imports entre features ni entre áreas.

## Detalle
[frontend.md §2](../architecture/frontend.md#2-estructura) · [arbol.md](../architecture/arbol.md)
