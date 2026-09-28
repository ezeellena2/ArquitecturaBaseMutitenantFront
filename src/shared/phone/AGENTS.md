# Teléfonos y banderas

Leé [teléfonos](../../../docs/rules/telefonos.md), [formatos](../../../docs/rules/formatos.md) y [datos de referencia](../../../../ArquitecturaBaseMutitenant/docs/rules/datos-de-referencia.md).
Las opciones se derivan de `shared/referenceData`: habilitación, nombre traducido, `CallingCode` y `SortOrder`. `libphonenumber-js` valida prefijos; `CountryFlag` carga SVG 3:2 solo al montarse el selector. No mantengas códigos, prefijos ni prioridades fijos.
