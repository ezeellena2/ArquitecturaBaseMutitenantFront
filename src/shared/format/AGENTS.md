# Formatos de presentación

Este es el único lugar que formatea fechas, números, dinero, teléfonos y datos de referencia.
Leé `../../../docs/rules/formatos.md` y `../../../docs/architecture/formatos.md`; para catálogos, `../referenceData/AGENTS.md`.
Los patrones vienen de `Cultures` y los símbolos/decimales de `Currencies`. No agregues listas fijas de códigos.
Los textos salen de `src/locales/{es,en}/format.json` y `enums.json`. Verificá `formatters.test.ts` y `format-usage.test.ts`.
