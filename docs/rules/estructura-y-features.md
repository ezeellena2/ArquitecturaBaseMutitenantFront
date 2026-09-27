# Estructura y features

**Regla:** el código vive en `src/areas/{public,personal,business,platform}/<feature>/`, siempre con la misma forma. Una feature no importa de otra y un área no importa de otra. Lo común sube a `shared/`.

## Cómo se hace
```
<feature>/
├── api/<feature>.ts     query keys + funciones (tipos de generated/)
├── columns.tsx          columnas tipadas del listado
├── errors.ts            switch (error.code)
├── components/          diálogos y piezas propias
├── lib/                 lógica pura de la feature (con tests)
└── pages/               una pantalla por archivo, lazy en routes.tsx
```
- Una ruta nueva va en `app/routes.tsx` y en `layouts/navigation/<área>.ts`, con el mismo permiso.
- Si dos features necesitan lo mismo, se mueve a `shared/` (por ejemplo `shared/api/roles.ts`); no se importa de la otra feature.
- Imports con alias `@/`. `import type` para los tipos.

## Prohibido
- `import … from "@/areas/business/users/…"` desde otra feature o área.
- Componentes definidos dentro de otros.
- `any`, `@ts-ignore` o `as` para esconder un error de tipos.

## Copiá de
- `src/areas/business/roles/` completo (E4)

## Lo verifica
- `tsc -b` estricto y `oxlint`.
- `structure.test.ts`: sin imports entre features ni entre áreas (Pendiente: E0).

## Detalle
[frontend.md §2](../architecture/frontend.md#2-estructura) · [arbol.md](../architecture/arbol.md)
