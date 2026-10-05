# Guía del lienzo

La guía recorre de punta a punta las pantallas del lienzo, en el orden en que una persona usa el sistema. Cada pantalla muestra:
- su captura de compu y de teléfono;
- lo que se abre desde ahí;
- para qué sirve;
- si ya está programada;
- sus estados.

Vive en claude.ai: <https://claude.ai/artifact/3afhCQaqwMx6kLxY4B6gpZ> (privada, de la cuenta del dueño).

**Se regenera y se publica con cada versión del lienzo**, en el mismo link.

## Qué hay acá

| Archivo | Para qué |
|---|---|
| `recorrido.py` | Los datos: la versión del lienzo, los pasos y, en cada uno, las pantallas con sus tableros, su ruta, su etapa y si está programada. Una pantalla nueva se suma acá. |
| `generar_recorrido.py` | Arma `Guia-Lienzo.html` y pasa las capturas a JPG. |
| `capturar.mjs` | Saca las capturas de los tableros con Playwright y el Chrome del sistema. |

## Cómo regenerarla

1. Actualizar `VERSION` en `recorrido.py` y, si hace falta, las pantallas y el estado del código.
2. Correr `python docs/design/guia/generar_recorrido.py <salida>`. Deja `capturar.json` en la carpeta de salida, por ejemplo una carpeta temporal.
3. Servir el lienzo con `python -m http.server 8815 --directory docs/design/lienzo`.
4. Correr `node docs/design/guia/capturar.mjs <salida>`. Deja las capturas en `<salida>/png`. Después, apagar el servidor.
5. Correr otra vez `python docs/design/guia/generar_recorrido.py <salida>`. Pasa las capturas a `<salida>/img` y arma `<salida>/Guia-Lienzo.html`.
6. Publicar con la herramienta Artifact en la misma URL, con estos datos:
   - `root`: `<salida>`;
   - `file_path`: `<salida>/Guia-Lienzo.html`;
   - `files`: cada `img/*.jpg`.

Las capturas no se commitean.
