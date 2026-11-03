# Guía del lienzo

La guía recorre de punta a punta las pantallas del lienzo, en el orden en que una persona usa el sistema. Cada pantalla muestra:
- su captura de compu y de teléfono;
- lo que se abre desde ahí;
- para qué sirve;
- si ya está programada;
- sus estados.

Son dos guías, porque una versión de un artefacto admite hasta 511 archivos. Las dos viven en claude.ai, son privadas, de la cuenta del dueño, y cada una enlaza a la otra:
- **la del lienzo**, con todo menos Formularios: <https://claude.ai/artifact/3afhCQaqwMx6kLxY4B6gpZ>;
- **la de Formularios**, de la etapa 12 a la 25, con la biblioteca de la plataforma: <https://claude.ai/artifact/K78KMJcoq8dw6YmMjuRvEu>.

Qué va en la de Formularios lo dicen `CAPITULO_FORMULARIOS` y `BIBLIOTECA`, en `recorrido.py`: su capítulo y, aparte, las pantallas de la biblioteca de la plataforma. El índice del lienzo sigue los capítulos sin partir. Los recorridos guiados van por etapa: de la 12 en adelante, en la de Formularios.

**Se regeneran y se publican con cada versión del lienzo**, cada una en su link.

## Qué hay acá

| Archivo | Para qué |
|---|---|
| `recorrido.py` | Los datos: la versión del lienzo, los pasos y, en cada uno, las pantallas con sus tableros, su ruta, su etapa y si está programada. Una pantalla nueva se suma acá. |
| `generar_recorrido.py` | Arma `Guia-Lienzo.html` y `Guia-Formularios.html`, y pasa las capturas a JPG. |
| `capturar.mjs` | Saca las capturas de los tableros con Playwright y el Chrome del sistema. |
| `capturar-recorridos.mjs` | Saca las capturas de cada paso de los recorridos guiados ([`../recorridos`](../recorridos/README.md)) y mide el lugar a resaltar. |

## Cómo regenerarlas

1. Actualizar `VERSION` en `recorrido.py` y, si hace falta, las pantallas y el estado del código.
2. Correr `python docs/design/guia/generar_recorrido.py <salida>`. Deja `capturar.json` en la carpeta de salida, por ejemplo una carpeta temporal.
3. Servir el lienzo con `python -m http.server 8815 --directory docs/design/lienzo`.
4. Correr `node docs/design/guia/capturar.mjs <salida>` y `node docs/design/guia/capturar-recorridos.mjs <salida>`. Dejan las capturas en `<salida>/png` y `<salida>/rec`. Después, apagar el servidor.
5. Correr otra vez `python docs/design/guia/generar_recorrido.py <salida>`. Pasa las capturas a `<salida>/img` y `<salida>/img/rec`, y arma las dos guías con los recorridos guiados. Las dos usan las imágenes de `<salida>/img`.
6. Publicar cada guía con la herramienta Artifact en su URL, con estos datos:
   - `root`: `<salida>`;
   - `file_path`: `<salida>/Guia-Lienzo.html` o `<salida>/Guia-Formularios.html`;
   - `files`: cada `img/*.jpg` e `img/rec/*.jpg` que nombra esa página. Una imagen que la página ya no usa se saca con `null`.

Las capturas no se commitean.
