# Paginado y listados

**Regla:** un listado es `FilterBar` + `DataTable` + `Pagination` dentro de una `Surface`. El estado (página, tamaño, orden, búsqueda y filtros) vive **en la URL**, y el backend pagina: **10 filas por defecto**, con opciones de 10, 20, 50 y 100.

## Cómo se hace
- `const p = usePagination({ defaultSort: "name" })` y `const filters = useFilters(["status", "roleId"])`.
- `useQuery({ queryKey: rolesQueryKey({ ...p.query, ...filters.values }), queryFn, placeholderData: keepPreviousData })`.
- Las columnas son ordenables con `sortable: true`, y su `id` es el campo del backend.
- Cambiar la búsqueda (con 300 ms de debounce), un filtro, el orden o el tamaño vuelve a la página 1, y lo hace `usePagination`.
- Si llega `items` vacío con `totalCount > 0`, `usePagination` salta solo a la última página.
- Los conteos de los filtros salen de `GET …/filter-counts`, con los mismos filtros.
- **Auditoría y actividad:** `useCursorList` + `<LoadMore />`, sin total.
- Vacío, sin coincidencias, carga y error: los resuelve `DataTable` (`emptyTitle`, `emptyAction`).

## Prohibido
- Paginar, ordenar o filtrar en el cliente.
- Guardar la página o los filtros en `useState`.
- Escribir la URL fuera de `useQueryUpdate`.
- Armar a mano el texto "1–10 de 1.234": lo hace `Pagination` con `useFormat`.

## Copiá de
- `src/areas/business/roles/pages/RolesPage.tsx` (E4) · `src/areas/business/users/components/UsersFilterBar.tsx` (E6)

## Lo verifica
- `usePagination.test.ts`: vuelve a la página 1, corrige una página fuera de rango y omite `pageSize=10` en la URL.
- Tests de pantalla: sin coincidencias y cambio de página.

## Detalle
[frontend.md §4, "Paginado, orden y búsqueda"](../architecture/frontend.md#paginado-orden-y-búsqueda) · back: `docs/rules/paginado-y-busqueda.md`
