# Paginado y listados

**Regla:** un listado es `FilterBar` (que ya es su propia tarjeta) y, debajo, `DataTable` + `Pagination` dentro de una `Surface` aparte; nunca todo en una sola tarjeta. El estado (página, tamaño, orden, búsqueda y filtros) vive **en la URL**, y el backend pagina: **10 filas por defecto**, con opciones de 10, 20, 50 y 100.

El aspecto sigue «Criterio · Tablas y listas»: encabezado arena de 40 px, texto sin mayúsculas, filas alternadas de 40 px como mínimo con un dato por columna (206; un texto largo baja de renglón y la fila crece, sin «…»: 174), una línea fina entre columnas y los números a la derecha (137), estados como punto y palabra (nunca pastilla) y el paginado al pie, dentro de la misma caja, sobre la línea de la última fila. **Toda columna con un dato ordena** (264): la que ordena muestra ↑ o ↓ en el color de la marca después del título (antes, en una columna de números) y lo anuncia con `aria-sort`; las demás muestran ↕ al pasar el mouse o con el foco, con 44 px para tocar. «Ordenar por», último en `FilterBar`, mueve el mismo orden y lo dice con palabras («Recibida, más reciente primero»). El buscador está siempre, con hasta tres filtros a la vista y lo demás en un solo «Filtros» (144); las opciones no dicen cuántas filas traen (143), lo aplicado va en chips y «Limpiar todo» aparece solo si hay algo aplicado. **En el teléfono** (tableros M-*): cada listado declara su fila (`mobileRow` con `ListRow`), de borde a borde, con el nombre y una línea de datos; la lupa y el filtro son íconos de la barra, y el filtro abre «Filtros» a pantalla completa, sin conteos; el paginado es «Cargar más», que pide el tamaño de página siguiente; crear es un «+» flotante ([responsive](responsive.md)).

## Cómo se hace
- **«Para resolver»** es una vista previa por tipo y empresa: `DataTable.rowGroups` conserva un solo encabezado de columnas y cada grupo muestra título, área y `totalCount` del servidor. El límite sale de `validationConstraints.PendingGroup.items.maxItems`, generado del OpenAPI; «Ver todos» aparece sólo si el total lo supera y abre el listado ya filtrado. En el teléfono, el área o empresa queda en el encabezado del grupo y cada fila muestra sólo su estado. Los globitos suman los totales de los grupos de su área, nunca las filas de la vista previa.
- **Un listado paginado es `usePagedQuery`**: compone `useFilters(keys)`, `usePagination`, la búsqueda con 300 ms de debounce, la consulta con `placeholderData: keepPreviousData`, la corrección de una página fuera de rango y las props de `Pagination`:
  ```ts
  const { filters, pagination, query, result: roles, paginationProps } = usePagedQuery({
    filterKeys: roleFilterKeys, defaultSort: "name", toQuery: (page, values): RolesQuery => ({ ...page, scope: values.vale === "Organization" ? "Organization" : undefined }),
    queryKey: rolesQueryKey, queryFn: fetchRoles, enabled: canRead, meta: { silent: true, blocksView: true },
  });
  {paginationProps ? <Pagination {...paginationProps} /> : null}
  ```
  Dos listas en una ficha usan un `prefix` propio en `usePagedQuery`/`usePagination` (Roles: `roles.`); sus páginas y tamaños nunca se mezclan. `filterKeys` es una constante del módulo; `query` es la consulta ya armada (los conteos toman de ahí la búsqueda y los filtros) y `pagination` da la búsqueda escrita, el orden y sus cambios para `FilterBar` y `DataTable`.
- **Uso del asistente (T13)** tiene una respuesta mensual con resumen y listado `rows` anidado, cuyos metadatos publicados son opcionales. La página conserva esa respuesta indivisible con `useQuery`, señal de cancelación, `useFilters` y `usePagination`, sin aplanar el contrato ni fabricar metadatos para `PagedResult`. Corrige una página vacía sólo con `rows.totalPages` entregado por el servidor. Las claves separan actor, acceso, organización y consulta; al cambiar actor se retiran resumen y filas anteriores. `AssistantUsagePage.test.tsx` verifica la corrección con metadatos que no coinciden con un cálculo local y el retiro de datos durante la lectura del actor nuevo.
- Las columnas son ordenables con `sortable: true`, y su `id` es el campo del backend. Lo llevan todas las que muestran un dato (264), salvo las acciones, un ícono o varios valores. El primer toque ordena en el sentido útil (el texto de la A a la Z, los números de mayor a menor, las fechas de la más reciente a la más vieja, el «Sí» primero y un estado por su circuito) y el segundo lo invierte; lo vacío va al final y lo hace el back. Sin orden elegido, la lista abre como siempre; si ese orden es compuesto, no hay flecha y el botón dice «Ordenar por». Las tablas cuyo orden es un dato (las opciones, las preguntas y los campos con ↑ ↓) y las colas («Por aprobar») no ordenan por columnas. Entra con la F12 de la segunda parte de la base.
- **Un dato por columna** (206, que precisa la del 2026-10-25): lo que aclaraba una celda, como el correo, los roles o «Vence…», va en su propia columna si la persona lo necesita, o no va; una etiqueta como «Corregida» también, y el resumen de otra tabla es su cantidad («3 ítems»). **Nada debajo de otro dato** (263, que saca el texto secundario de la 206): no hay segunda línea en una celda, y `DataTable` no dibuja `detail` ([pantallas](pantallas-y-ui.md)). En el teléfono, `mobileRow` no junta datos con «·» debajo del nombre: lleva menos datos, o es una tarjeta con cada dato nombrado. En una `List`, lo que aclara la fila va en la compu a la derecha, en la misma fila, y en el teléfono en la segunda línea (Criterio · Tablas, 25/10). **El texto largo se ve entero** (174): la celda baja de renglón en lugar de cortar con «…», sin tooltip; un código con guiones no se parte y una zona horaria se corta solo en sus barras.
- Cambiar la búsqueda (con 300 ms de debounce), un filtro, el orden o el tamaño vuelve a la página 1, y lo hace `usePagination`.
- `usePagination` normaliza `page` a un entero seguro desde 1 y `pageSize` a 10, 20, 50 o 100. Un valor inválido vuelve a 1/10; los valores por defecto se omiten de la URL y la corrección usa `replace`, sin agregar historial. Si el orden inicial es descendente (`-campo`), pulsar esa columna alterna a `campo` ascendente y de regreso al descendente.
- Los tamaños disponibles viven una sola vez en `shared/api/pageSizes.ts`, tipados con el `PagedRequest` generado. El hook y `Pagination` los comparten; `pageSizes.test.ts` compara su lista y orden con el enum del OpenAPI del back.
- Si llegan `items` vacíos con `totalCount > 0` (por ejemplo, se borró la única fila de la última página), `usePagedQuery` salta solo a la última página que tiene filas, con `replace` y sin agregar historial. Mira solo la respuesta de esa página, nunca la anterior que se muestra mientras carga. No expone `correctPage` a quien lo llama.
- Los conteos de `GET …/filter-counts`, con los mismos filtros, son para ofrecer solo lo que existe y para la cantidad de una vista («Por aprobar (N)»): un filtro no los muestra, y los segmentados de filtro con su cantidad pasaron a un filtro sin cantidad (143 y 262). El resumen de la banda («14 usuarios · 6 activos») cuenta toda la lista: se pide una vez, sin la búsqueda ni los filtros, y una lista que solo lo usa no pide los filtrados.
- **Opciones para elegir un recurso que crece:** `shared/api/resourceOptions` define una sola lectura y raíz de caché por recurso; `useResourceOptions` pide páginas de 10, busca en el servidor con 300 ms de debounce y ofrece «Cargar más». `SearchSelect`, `MultiSelect` y `FilterBar` reciben su `remote`, conservando teclado, carga, error y reintento. La etiqueta de lo elegido sale de `knownItems` en QueryCache o de su lectura por id, aunque no esté en la página actual. Las empresas ofrecidas son activas por filtro del servidor; las ya asignadas se leen por id cuando hace falta conocer su estado. «Todos» en roles lee todas las páginas sólo al pulsarlo. Una mutación invalida la raíz del recurso, incluidas sus opciones.
- **Auditoría y actividad** (lo que solo crece) son **`useCursorList`** + `<LoadMore />`, la única forma de listar por cursor: de a tandas con el cursor opaco del back y sin total. Los filtros van en la clave y en la URL; el cursor, solo en la consulta. Al cambiar un filtro vuelve a la primera tanda y muestra la anterior mientras llega la nueva (`placeholderData: keepPreviousData`, como `usePagedQuery`); `meta` va como en cualquier consulta:
  ```ts
  const audit = useCursorList([...auditQueryRoot, baseQuery],
    (after) => fetchAudit({ ...baseQuery, after: after ?? undefined, limit: 25 }),
    { meta: { silent: true, blocksView: true } });
  <DataTable rows={audit.items} … />
  <LoadMore hasMore={audit.hasNextPage} isLoading={audit.isFetchingNextPage} onLoadMore={() => { void audit.fetchNextPage(); }} />
  ```
- **El pie** de `Pagination` va en letra de 12: «1–10 de 11» o, con una sola fila en la página, «1 de 1» (`pagination.single`), y el tamaño de página en una píldora de 28. «Cargar más» es siempre `LoadMore`: en la compu, el botón normal (36 y letra de 14); en el teléfono, el de 44, también como paginado de `Pagination`.
  - `useCursorList` entrega también la señal de cancelación al callback y acepta `enabled`. Las listas privadas cuya clave cambia de dueño usan `retainPreviousData: false`: no muestran filas del dueño anterior durante la lectura nueva. El historial del Asistente conserva la lista pública de assistant-ui, pero lee sus grupos Guardadas/Recientes exclusivamente con este helper y sus señales de acceso.
- Vacío, sin coincidencias, carga y error: los resuelve `DataTable` (`emptyTitle`, `emptyAction`). **La primera carga** (160): el encabezado de siempre y el aro centrado en el alto de ocho filas, sin filas esqueleto, así al llegar las filas la tabla no cambia de alto. En el teléfono, el aro en el lugar de la lista, debajo de la barra. Cambia «la primera carga conserva su aro» y el «Cargando» de `Criterio-Tablas`.

## Prohibido
- Paginar, ordenar o filtrar en el cliente una lista paginada. Una tabla que llega entera ordena en el navegador con la misma pieza (264).
- Guardar la página o los filtros en `useState`.
- Escribir la URL fuera de `useQueryUpdate`.
- Armar a mano el texto "1–10 de 1.234": lo hace `Pagination` con `useFormat`.
- `useInfiniteQuery` fuera de `useCursorList`.
- Filas esqueleto en la primera carga (160), la cantidad en las opciones de un filtro (143), «Más filtros» o el total en la barra de filtros (144).

## Copiá de
- `src/areas/business/roles/pages/RolesPage.tsx` y `roles/columns.tsx` (E4): `usePagedQuery`, `FilterBar`, `DataTable`, `Pagination`, «Ningún rol coincide con los filtros» y la fila del teléfono
- `src/areas/platform/tenants/pages/OrganizationsPage.tsx` (E5/T21b): banda con conteos globales (sus opciones pierden el conteo con la 143); el backend ordena por nombre; fila móvil sin avatar y fecha completa del tablero M-Organizaciones.
- `src/areas/public/site/pages/DirectoryPage.tsx` y `src/areas/public/site/api/directory.ts` (E7): búsqueda/paginado URL y forma web del directorio; `src/areas/public/site/components/CompanyCard.tsx` (E7): tarjeta compartida con la portada.
- por cursor: `src/areas/business/audit/pages/AuditPage.tsx` (E7): `useCursorList`, los filtros en la URL y `LoadMore`
- `src/areas/platform/audit/pages/SecurityAuditPage.tsx` y `src/areas/platform/tenants/tabs/useOrganizationHistory.ts` (E5): filtros en la URL, tandas por cursor opaco y Cargar más sin total.

## Lo verifica
- `pageSizes.test.ts` (E0)
- `option-pagination.test.ts` y `RemoteOptions.test.tsx` (E4), correctivo C2: prohíben el corte fijo en 100 y eligen recursos fuera de la primera página con búsqueda remota.
- `src/test/filter-counts.test.tsx` (base de la 12, E12; Empresas con la N30): los conteos del resumen se piden una vez, sin la búsqueda ni los filtros, en las seis listas.

## Detalle
[frontend.md §4, "Paginado, orden y búsqueda"](../architecture/frontend.md#paginado-orden-y-búsqueda) · back: `docs/rules/paginado-y-busqueda.md`
