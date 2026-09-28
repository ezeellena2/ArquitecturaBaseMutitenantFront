# Paginado y listados

**Regla:** un listado es `FilterBar` (que ya es su propia tarjeta) y, debajo, `DataTable` + `Pagination` dentro de una `Surface` aparte; nunca todo en una sola tarjeta. El estado (página, tamaño, orden, búsqueda y filtros) vive **en la URL**, y el backend pagina: **10 filas por defecto**, con opciones de 10, 20, 50 y 100.

## Cómo se hace
- `usePagination(result?: { items; totalCount })` toma opcionalmente el resultado ya recibido por la query; `useFilters(keys)` mantiene los filtros en la URL. La query usa el estado de página, orden, búsqueda y filtros de esa URL, con `placeholderData: keepPreviousData`.
- Las columnas son ordenables con `sortable: true`, y su `id` es el campo del backend.
- Cambiar la búsqueda (con 300 ms de debounce), un filtro, el orden o el tamaño vuelve a la página 1, y lo hace `usePagination`.
- Si llegan `items` vacíos con `totalCount > 0`, `usePagination` salta solo a la última página. Desde la E1 la corrección queda dentro del hook (puede usar un helper interno): no expone `correctPage` a quien lo llama y usa `replace` para no agregar historial.
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
- `usePagination.test.tsx` (E0/E1): conserva el estado en la URL y vuelve a la página 1; desde E1 corrige una página fuera de rango solo con `items` vacíos y `totalCount > 0`, usando `replace`, y omite `pageSize=10` en la URL.
- Tests de pantalla: sin coincidencias y cambio de página.

## Detalle
[frontend.md §4, "Paginado, orden y búsqueda"](../architecture/frontend.md#paginado-orden-y-búsqueda) · back: `docs/rules/paginado-y-busqueda.md`
