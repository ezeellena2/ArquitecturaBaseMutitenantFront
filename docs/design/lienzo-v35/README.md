# Lienzo, versión 35 (congelado)

Copia congelada de la versión 35 del lienzo: 67 tableros `.dc.html`, el motor `support.js` y los recursos de `ds/`. Con ella se programaron las etapas 3a y 3b, y contra ella se tomaron sus capturas de entonces (las PNG de `docs/design/capturas/etapa-3a` y `etapa-3b`). Queda solo para mirar esas capturas viejas: ningún generador la usa. Desde la consolidación (tanda 6a), `scripts/capturar-etapa-3b.mjs` también compara con el lienzo vigente, y `src/test/harness.test.ts` falla si un generador de capturas apunta a una copia del lienzo o le inyecta estados al tablero.

**No es la fuente de las pantallas.** La fuente es el [lienzo vigente](../lienzo/README.md). Esta carpeta no se actualiza: si una pantalla de 3a o 3b se rehace con el criterio nuevo, su captura se compara contra el lienzo vigente y deja de usar esta copia.

Para verlo, serví esta carpeta con un servidor estático y abrí `<Tablero>.dc.html`.
