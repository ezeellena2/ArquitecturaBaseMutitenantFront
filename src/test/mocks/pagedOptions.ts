/** Una página corta de opciones para fixtures; los tests de volumen generan sus páginas según el pedido. */
export function pagedOptions<T>(items: readonly T[]) {
  return { items: [...items], page: 1, pageSize: 10, totalCount: items.length, totalPages: items.length === 0 ? 0 : 1,
    hasPrevious: false, hasNext: false };
}
