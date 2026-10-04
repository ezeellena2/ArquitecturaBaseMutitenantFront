# Hooks compartidos

Acá van hooks reutilizables, cada uno con su test al lado; no se duplican dentro de una feature.
Leé [paginado y listados](../../../docs/rules/paginado-y-listados.md) y [formularios](../../../docs/rules/formularios.md).
Un listado paginado usa [usePagedQuery.ts](usePagedQuery.ts); uno que solo crece, `useCursorList.ts`.
Una pantalla que edita algo que ya existe usa [useEditPage.tsx](useEditPage.tsx): cartel del 409, «Cambios sin guardar», franja de error y «¿Salir sin guardar?».
