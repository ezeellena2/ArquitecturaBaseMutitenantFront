# Paginado y listados

**Regla:** un listado es `FilterBar` (que ya es su propia tarjeta) y, debajo, `DataTable` + `Pagination` dentro de una `Surface` aparte; nunca todo en una sola tarjeta. El estado (página, tamaño, orden, búsqueda y filtros) vive **en la URL**, y el backend pagina: **10 filas por defecto**, con opciones de 10, 20, 50 y 100.

El aspecto sigue «Criterio · Tablas y listas»: encabezado arena de 40 px, texto sin mayúsculas, filas alternadas de 40 px (52 con una segunda línea gris que aclara la primera), estados como punto y palabra (nunca pastilla) y el paginado al pie, dentro de la misma caja. El orden se anuncia con `aria-sort` sin flecha visible. El buscador está siempre, con hasta tres filtros a la vista; cada opción dice cuántas filas trae y «Limpiar filtros» aparece solo si hay algo elegido.

**En el teléfono** (tableros M-*): cada listado declara su fila (`mobileRow` con `ListRow`), de borde a borde y con hasta tres líneas; la lupa y el filtro son íconos de la barra y el filtro abre una hoja con las opciones y su conteo; el paginado es «Cargar más», que pide el tamaño de página siguiente; crear es un «+» flotante ([responsive](responsive.md)).

## Cómo se hace
- **Un listado paginado es `usePagedQuery`**: compone `useFilters(keys)`, `usePagination`, la búsqueda con 300 ms de debounce, la consulta con `placeholderData: keepPreviousData`, la corrección de una página fuera de rango y las props de `Pagination`:
  ```ts
  const { filters, pagination, query, result: roles, paginationProps } = usePagedQuery({
    filterKeys: roleFilterKeys, defaultSort: "name",
    toQuery: (page, values): RolesQuery => ({ ...page, scope: values.vale === "Organization" ? "Organization" : undefined }),
    queryKey: rolesQueryKey, queryFn: fetchRoles, enabled: canRead, meta: { silent: true, blocksView: true },
  });
  // …
  {paginationProps ? <Pagination {...paginationProps} /> : null}
  ```
  `filterKeys` es una constante del módulo; `query` es la consulta ya armada (los conteos toman de ahí la búsqueda y los filtros) y `pagination` da la búsqueda escrita, el orden y sus cambios para `FilterBar` y `DataTable`.
- Las columnas son ordenables con `sortable: true`, y su `id` es el campo del backend.
- **La segunda línea gris** (lo que aclara la celda: el correo debajo del nombre, los roles debajo de la empresa, «Vence…» debajo del estado) la declara la columna con `detail: (row) => …` y la dibuja `DataTable`, en 12 y `--t3`; sin nada que aclarar, `null`. Si alguna fila la tiene, todas las filas de la tabla miden 52. Debajo de un estado va con `StatusDetail`, bajo la palabra y no bajo el punto. La celda nunca arma su propia segunda línea.
- Cambiar la búsqueda (con 300 ms de debounce), un filtro, el orden o el tamaño vuelve a la página 1, y lo hace `usePagination`.
- `usePagination` normaliza `page` a un entero seguro desde 1 y `pageSize` a 10, 20, 50 o 100. Un valor inválido vuelve a 1/10; los valores por defecto se omiten de la URL y la corrección usa `replace`, sin agregar historial. Si el orden inicial es descendente (`-campo`), pulsar esa columna alterna a `campo` ascendente y de regreso al descendente.
- Los tamaños disponibles viven una sola vez en `shared/api/pageSizes.ts`, tipados con el `PagedRequest` generado. El hook y `Pagination` los comparten; `pageSizes.test.ts` compara su lista y orden con el enum del OpenAPI del back.
- Si llegan `items` vacíos con `totalCount > 0` (por ejemplo, se borró la única fila de la última página), `usePagedQuery` salta solo a la última página que tiene filas, con `replace` y sin agregar historial. Mira solo la respuesta de esa página, nunca la anterior que se muestra mientras carga. No expone `correctPage` a quien lo llama.
- Los conteos de los filtros salen de `GET …/filter-counts`, con los mismos filtros.
- **Auditoría y actividad** (lo que solo crece) son **`useCursorList`** + `<LoadMore />`, la única forma de listar por cursor: de a tandas con el cursor opaco del back y sin total. Los filtros van en la clave y en la URL; el cursor, solo en la consulta. Al cambiar un filtro vuelve a la primera tanda y muestra la anterior mientras llega la nueva (`placeholderData: keepPreviousData`, como `usePagedQuery`); `meta` va como en cualquier consulta:
  ```ts
  const audit = useCursorList([...auditQueryRoot, baseQuery],
    (after) => fetchAudit({ ...baseQuery, after: after ?? undefined, limit: 25 }),
    { meta: { silent: true, blocksView: true } });
  // …
  <DataTable rows={audit.items} … />
  <LoadMore hasMore={audit.hasNextPage} isLoading={audit.isFetchingNextPage} onLoadMore={() => { void audit.fetchNextPage(); }} />
  ```
- **El pie** de `Pagination` va en letra de 12: «1–10 de 11» o, con una sola fila en la página, «1 de 1» (`pagination.single`), y el tamaño de página en una píldora de 28. «Cargar más» es siempre `LoadMore`: en la compu, el botón normal (36 y letra de 14); en el teléfono, el de 44, también como paginado de `Pagination`.
- Vacío, sin coincidencias, carga y error: los resuelve `DataTable` (`emptyTitle`, `emptyAction`).

## Prohibido
- Paginar, ordenar o filtrar en el cliente.
- Guardar la página o los filtros en `useState`.
- Escribir la URL fuera de `useQueryUpdate`.
- Armar a mano el texto "1–10 de 1.234": lo hace `Pagination` con `useFormat`.
- `useInfiniteQuery` fuera de `useCursorList`.

## Copiá de
- `src/areas/business/roles/pages/RolesPage.tsx` y `roles/columns.tsx` (E4): `usePagedQuery`, `FilterBar`, `DataTable`, `Pagination`, «Ningún rol coincide con los filtros» y la fila del teléfono
- `src/areas/platform/tenants/pages/OrganizationsPage.tsx` (E5/T21b): banda con conteos globales y opciones con conteos cruzados; el backend ordena por nombre; fila móvil sin avatar y fecha completa del tablero M-Organizaciones.
- por cursor: `src/areas/business/audit/pages/AuditPage.tsx` (E7): `useCursorList`, los filtros en la URL y `LoadMore`
- `src/areas/platform/audit/pages/SecurityAuditPage.tsx` y `src/areas/platform/tenants/tabs/useOrganizationHistory.ts` (E5): filtros en la URL, tandas por cursor opaco y Cargar más sin total.

## Lo verifica
- `usePagination.test.tsx` (E0/E1): conserva el estado en la URL y vuelve a la página 1, canoniza página/tamaño inválidos con `replace`, alterna el orden descendente predeterminado y omite `pageSize=10` en la URL.
- `usePagedQuery.test.tsx` (E7): la URL llega a la consulta, la búsqueda con debounce, la corrección de una página fuera de rango (solo con `items` vacíos y `totalCount > 0`) y las props de `Pagination`; `RolesPage.test.tsx` (E7): al inactivar el único rol de la última página, vuelve a la anterior.
- `pageSizes.test.ts` (E2): exige concordancia exacta con `PagedRequest.properties.pageSize.enum` del OpenAPI; el repo hermano es obligatorio en local y solo ese chequeo se omite con aviso en CI aislado.
- Tests de pantalla: sin coincidencias y cambio de página; en el teléfono, la lista y su «+».
- `OrganizationsPage.test.tsx`, `AccountsPage.test.tsx` y `RecoveriesPage.test.tsx` (E5): banda global, filtros cruzados, búsqueda en URL, vacío/sin coincidencias y 1/50 filas; Recuperaciones no muestra pie con total 0. `SecurityAuditPage.test.tsx` y `OrganizationPage.test.tsx` (E5): cursor, filtros y Cargar más sin total.
- `src/shared/ui/app/lists.test.tsx` (E5): en el teléfono, filas de lista, filtros en una hoja y «Cargar más».
- `Pagination.test.tsx` (E7): el pie en 12 y «1 de 1» con una sola fila en la página, en es-AR y en-US; `LoadMore.test.tsx` (E7): en la compu, «Cargar más» es el botón normal.
- `useCursorList.test.tsx` (E7): las tandas por cursor opaco, sin total; con otros filtros vuelve a la primera tanda y muestra la anterior mientras llega la nueva; lleva su `meta`; y es lo único que usa `useInfiniteQuery`. `AuditPage.test.tsx` (E7): «Cargar más» pide la tanda siguiente con el cursor y los mismos filtros, y un 403 del historial muestra «No tenés permiso».
- `DataTable.test.tsx` (E7): la segunda línea que declara la columna, gris de 12, y las filas de 52 si alguna la tiene; si no, de 40. `UsersPage.test.tsx`, `CompaniesPage.test.tsx`, `CompanyDetailPage.test.tsx` y `RolesPage.test.tsx` (E7): el correo, los roles de la empresa, «Vence…», el CUIT y «De sistema» van en esa línea.

## Detalle
[frontend.md §4, "Paginado, orden y búsqueda"](../architecture/frontend.md#paginado-orden-y-búsqueda) · back: `docs/rules/paginado-y-busqueda.md`
