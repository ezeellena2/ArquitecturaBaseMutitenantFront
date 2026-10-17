# Recorridos guiados

Cada archivo `<id>.json` es un recorrido: los pasos de un flujo, en orden, sobre los tableros del lienzo (`../lienzo`). La guía del lienzo los muestra con su reproductor (`../guia`), y sirven de guion para el recorrido de usuario en la app real.

## Formato

| Campo | Qué es |
|---|---|
| `id` | El nombre del archivo, sin `.json`. |
| `titulo` | El nombre del recorrido, como lo ve quien lo mira. |
| `etapa` | Una de las etapas de la guía: «Ingreso y registro», «Organización», «Página pública y directorio», «Plataforma», «Mi cuenta», «Etapa 8 · WhatsApp», «Etapa 8b · Asistente», «Etapa 12 · Formularios», «Etapa 13 · Catálogos», «Etapa 17 · Biblioteca». |
| `orden` | El orden dentro de la etapa. |
| `resumen` | Una línea: quién hace qué y cómo termina. |
| `pasos` | La lista de pasos. |

Cada paso:

| Campo | Qué es |
|---|---|
| `tablero` | El tablero del lienzo, sin `.dc.html`. |
| `tweaks` | Los valores de sus Tweaks en ese paso, por ejemplo `{ "estado": "Código enviado", "puerta": "Persona" }`. |
| `antes` | Opcional. Lo que se hace en el tablero antes de mostrarlo: `["llenar", selector, valor]` o `["clic", selector]`. |
| `resaltar` | Opcional. El selector del lugar a tocar, con la sintaxis de Playwright (`a.b-gho:text-is("Ingresar")`). Sin él, el paso no tiene nada para tocar, como una espera. |
| `actor` | Quién actúa y dónde: «Lucía · persona · web», «Martín · operador · web», «Sistema». |
| `titulo` | Qué pasa en el paso, corto. |
| `texto` | La narración. |
| `avanzar` | Cómo se sigue, como se lo dice la guía a quien mira: «Tocá «Enviar código».». |
| `ruta` | La ruta de la app en ese paso. |
| `accion` | Lo que hace la persona en la app real; es lo que repite el recorrido de usuario. |

## Cómo se ven en la guía

1. `python docs/design/guia/generar_recorrido.py <salida>` y servir el lienzo, como dice [la guía](../guia/README.md).
2. `node docs/design/guia/capturar-recorridos.mjs <salida>`: abre cada tablero con sus Tweaks, hace lo de `antes`, mide el lugar de `resaltar` y deja `<salida>/rec/<id>-<n>.png` y `<salida>/rec/cajas.json`. Si un selector o un Tweak no existe, se detiene y lo dice.
3. Volver a correr `generar_recorrido.py`: suma la sección «Recorridos guiados» y el reproductor.

Un recorrido nuevo es un archivo nuevo acá; no hace falta tocar el reproductor.
