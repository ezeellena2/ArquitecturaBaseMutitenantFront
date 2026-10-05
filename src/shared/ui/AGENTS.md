# UI compartida

Acá van piezas genéricas sin lógica de negocio: shadcn en minúscula y piezas propias en PascalCase.
Leé [pantallas y UI](../../../docs/rules/pantallas-y-ui.md), [tema](../../../docs/architecture/tema.md) y [accesibilidad](../../../docs/rules/accesibilidad.md).
Antes de crear una, buscá la que existe: `Page`, `FilterBar`, `DataTable`, `Pagination`, `LoadMore`, `Section`, `List`, `dialog` (con `size`), `ConfirmDialog`, `FormField`, `FormError`, `Banner`, `ConcurrencyBanner`, `MultiSelect`, `SearchSelect`, `ReadOnlyField`, `LoadErrorPage`, `NotFoundPage`, `ForbiddenPage`, `PublicPageCard` y el marco del teléfono en `app/`.
Copiá [Page.tsx](Page.tsx) y [DataTable.tsx](DataTable.tsx).
