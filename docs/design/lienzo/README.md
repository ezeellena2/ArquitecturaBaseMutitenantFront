# Lienzo del sistema visual

Copia de la **versión 60** (2026-10-01) del lienzo «Sistema visual · Multitenant», que vive en claude.ai como artefacto de tipo Design: <https://claude.ai/artifact/WzoVTM574QGka8nCU4iFEK> (privado, de la cuenta del dueño). Tiene 109 tableros `.dc.html`, `canvas.json` (páginas, posiciones y notas), el motor `support.js`, los recursos de `ds/` y los scripts que los generan, en `generadores/`.

Esta carpeta es la fuente de cada pantalla y de sus estados: **un tablero validado manda sobre cualquier descripción textual** de la arquitectura, las fichas o el plan. Antes de programar una pantalla, buscá su tablero y copiá sus estados, contenido y disposición. Una pantalla nueva se dibuja primero y se programa después de que el usuario la elige.

## Páginas y estado

El título de cada tablero dice en qué estado está:

- **sin marca:** validado por el usuario; se puede programar;
- **«· para aprobar»:** refinado con el criterio y esperando el visto bueno;
- **«· por refinar»:** dibujado antes del criterio; no se programa así.

| Página | Tableros | Estado |
|---|---|---|
| Criterio de diseño | 7 | Validado. Es la regla de botones, tablas, diálogos, formularios, avisos, menús y marco. El lienzo abre acá. |
| Mapa general | 2 | Validado |
| Sitio público | 6 | Por refinar |
| Ingreso y registro | 18 | Validado |
| Perfil personal | 7 | Validado |
| Organización | 26 | Para aprobar |
| Organización · WhatsApp | 15 | Propuesta que le gustó al usuario; falta sumarla al plan (E11) |
| Plataforma | 12 | Por refinar |
| Textos y mensajes | 2 | Validado |
| Archivo | 14 | Descartado. Son versiones anteriores; están como referencia y no se programan. |

El código del front todavía sigue el aspecto de la versión 35. Pasarlo al criterio es un paso pendiente: primero los componentes compartidos, después Mi cuenta y después el resto.

## Verlo sin claude.ai

Serví esta carpeta con un servidor estático, por ejemplo con `python -m http.server`, y abrí `<Tablero>.dc.html`. Cada estado se elige con el control **Tweak**. El estado inicial está en el atributo `data-props` como `default`.

## Criterio, en corto

Lo que manda son los tableros «Criterio · …». Estas son las decisiones que más se repiten:

- **Compacto.** Letra de 13. Botones de 36, y de 32 los chicos; solo el ingreso y el registro usan 44. Campos de 36.
- **Encabezados con color arena:** tablas, cajas y diálogos (`oklch(0.945 0.018 76)`). Filas alternadas, sin mayúsculas.
- **Sin etiquetas.** Nada de pastillas ni rótulos con fondo al lado de un texto («Principal», «Suspendida», «De sistema»).
  - El estado va en la segunda línea, como punto de color y palabra.
  - Lo que estaba al lado del título va en la segunda línea de la banda, separado por «·».
- **Formularios:**
  - una caja por tema, con encabezado arena;
  - rótulo arriba y cada campo del ancho de su dato: nombre 360, desplegable 260, documento 200, texto largo hasta 720;
  - nada estirado y sin ayudas debajo;
  - lo que no se edita se muestra como texto, nunca como campo gris;
  - lo corto (agregar, verificar, confirmar) va en un diálogo.
- **Avisos y errores:**
  - lo que salió bien: aviso verde abajo a la derecha, que se va solo;
  - una acción directa que falló: aviso rojo con ✕, que no se va solo;
  - un error de formulario: debajo del campo, o en una franja arriba;
  - lo que sigue pasando: un cartel debajo de la banda;
  - lo que no se deshace: un diálogo de confirmación, sin ✕ y con el botón rojo lleno.
- **Botones:**
  - solo «Guardar cambios» se apaga cuando no hay cambios;
  - «Descartar cambios» siempre está habilitado;
  - nada se deshabilita sin explicar por qué;
  - el único ícono que lleva un botón es el «+».
- **Menús:**
  - las acciones de fila y las secundarias van en ⋮;
  - tu menú, arriba a la derecha, tiene Perfiles, Mi cuenta y Salir;
  - Administración es un segundo panel al lado del menú lateral.
- **Listas:** se paginan con más de 10 elementos. Pestañas, solo si hay dos tablas o más.
- **«Tenant» nunca en pantalla:** se dice «Organización».

## Generadores

Son scripts de Python 3, sin dependencias. Escriben los tableros y `canvas.json` en esta carpeta y se corren desde `generadores/`:

| Script | Qué hace |
|---|---|
| `criterio_*.py` | Los 7 tableros de «Criterio de diseño» |
| `perfil_tableros.py` | Perfil personal: Inicio, Mi cuenta y sus diálogos, con las versiones de teléfono |
| `whatsapp_tableros.py` | Los 15 de WhatsApp. Las piezas comunes (`w-*`, íconos, banda) salen de acá. |
| `org_formularios.py` | Configuración, Página pública y sus diálogos |
| `org_formularios2.py` | Usuario, Rol y Avisos. Rehace el dibujo y conserva la lógica de cada tablero. |
| `conectar_paginas.py` | Enlaces entre páginas: tu menú, el menú de WhatsApp y la entrada WhatsApp en Organización |
| `aplicar_criterio.py`, `criterio_marcado.py`, `terminos_sin_deshabilitar.py` | Pasan al criterio los tableros viejos sin rehacerlos |

Después de correr `perfil_tableros.py`, `whatsapp_tableros.py` u `org_formularios.py`, corré `conectar_paginas.py`: esos tres dibujan el menú sin enlaces. `conectar_paginas.py` y `org_formularios2.py` se pueden volver a correr sin cambiar lo que ya está. Los otros reescriben `canvas.json`, así que revisá el diff antes de publicar. Para rehacer un formulario, se copia el formato de `org_formularios.py` y nunca se maquilla con CSS encima.

## Publicar en claude.ai

Se publica desde Claude Code, con la herramienta Artifact y la `url` de arriba:

1. **Leé antes de publicar.** Leé el lienzo (`read`) y compará `canvas.json` con esta copia: el dueño también edita y guarda desde la página.
2. **Todo va bajo `project/`.** Cada archivo se publica como `project/<archivo>`, por ejemplo con `files` = `{"project/Rol.dc.html": "docs/design/lienzo/Rol.dc.html", …}`. El `file_path` es `canvas.json` publicado como `project/canvas.json`. Lo que queda fuera de `project/` no se ve.
3. **Reglas del `canvas.json`:**
   - todo tablero y toda nota llevan `page`;
   - el `maxW` de una nota no pasa de 8000;
   - un tablero sin `"is_interactive": true` no muestra Play.
4. **Enlaces entre tableros:** `<a href="X.dc.html">` mueve Play a ese tablero aunque esté en otra página. Toda pantalla nueva nace con sus enlaces.
5. **Las propuestas nuevas** van en su propia página («Propuesta · …»). Cuando se aprueban, pasan a la página de su área. Las versiones reemplazadas van al Archivo.
6. **Después de publicar,** traé la versión nueva a esta carpeta y commiteala.
