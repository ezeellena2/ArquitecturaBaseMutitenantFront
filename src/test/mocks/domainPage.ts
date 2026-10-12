/** Respuestas de prueba del listado anterior conservadas como una página del contrato nuevo. */
export function domainPage<T>(items: T[]) {
  return { items, page: 1, pageSize: 10, totalCount: items.length, totalPages: items.length ? 1 : 0, hasPrevious: false, hasNext: false };
}
