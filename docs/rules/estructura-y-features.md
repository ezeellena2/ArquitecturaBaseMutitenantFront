# Estructura y features

**Regla:** el código vive en `src/areas/{public,storefront,personal,business,platform}/<feature>/`, siempre con la misma forma. Una feature no importa de otra y un área no importa de otra. Lo común sube a `shared/`.

## Cómo se hace
```
<feature>/
├── api/<recurso>.ts     query keys + funciones (tipos de generated/); un archivo por recurso (ej. companies.ts, companyMembers.ts)
├── columns.tsx          columnas tipadas del listado principal
├── <x>Columns.tsx       columnas de otra tabla de la feature (ej. memberColumns.tsx), si la hay
├── errors.ts            switch (error.code)
├── components/          diálogos y piezas propias
├── tabs/                una pestaña por archivo (<X>Tab.tsx); solo si la ficha tiene dos o más tablas grandes (pantallas-y-ui)
├── lib/                 lógica pura de la feature (con tests)
└── pages/               una pantalla por archivo, lazy en routes.tsx
```
Las carpetas que la feature no necesita no se crean (`settings/` puede tener solo `api/` y `pages/`).
- Una ruta nueva va en `app/routes.tsx` y en `layouts/navigation/<área>.ts`, con el mismo permiso.
- Si dos features necesitan lo mismo, se mueve a `shared/` (por ejemplo `shared/api/roles.ts`); no se importa de la otra feature.
- Imports con alias `@/`. `import type` para los tipos.

## Prohibido
- `import … from "@/areas/business/users/…"` desde otra feature o área.
- Componentes definidos dentro de otros.
- `any`, `@ts-ignore` o `as` para esconder un error de tipos.

## Copiá de
- `src/areas/business/roles/` completo (E4)
- `src/areas/business/companies/` para una ficha con pestañas (E6)

## Lo verifica
- `tsc -b` estricto y `oxlint`.
- `structure.test.ts`: sin imports entre features ni entre áreas (Pendiente: E0).

## Detalle
[frontend.md §2](../architecture/frontend.md#2-estructura) · [arbol.md](../architecture/arbol.md)
