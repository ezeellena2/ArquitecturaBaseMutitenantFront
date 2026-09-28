# Datos de referencia

Leé [datos-y-api](../../../docs/rules/datos-y-api.md), [formatos](../../../docs/rules/formatos.md) y [datos de referencia](../../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md). Los cinco catálogos se reciben de `GET /api/reference-data` mediante `httpClient` y TanStack Query. Nunca agregues opciones, patrones ni nombres de referencia a mano; el backend los traduce. Los campos usan `enabledOptions` para nuevas selecciones y `shared/format` muestra los valores existentes.
