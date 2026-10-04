# Tema visual (aprobado el 2026-09-27)

La fuente de cada pantalla es el [lienzo vigente "Sistema visual · Multitenant"](../design/lienzo/README.md): mandan los ocho tableros «Criterio» y, para cada pantalla, su tablero validado, sobre cualquier descripción textual. Estos tokens van en `src/index.css` como variables CSS, y los componentes los usan siempre por nombre, nunca con el valor. Reemplaza los colores, la marca y el menú lateral de `visual-baseline.md`. La densidad compacta, la banda de título, los listados y las migas siguen como dice la sección "UI y pantallas" de [`frontend.md`](frontend.md).

## Colores
Tonos cálidos para el contenido, verde petróleo como marca, y un **marco arena** (menú lateral y barra superior) un tono más marcado que el centro, para que se despegue.

| Token | Valor | Uso |
|---|---|---|
| `--marca` | `oklch(0.5 0.1 195)` | botón principal, enlaces fuertes, activo |
| `--marca-2` | `oklch(0.58 0.11 170)` | segundo color del degradado del logo y del avatar |
| `--marca-sombra` | `oklch(0.5 0.1 195 / 0.3)` | sombra corta de la marca |
| `--marca-h` | `oklch(0.45 0.1 195)` | hover del botón principal |
| `--auth-panel-start` / `--auth-panel-mid` / `--auth-panel-end` | `oklch(0.48 0.099 195)` / `oklch(0.36 0.087 195)` / `oklch(0.26 0.062 195)` | degradado del panel de Ingreso y Registro, copiado del lienzo |
| `--auth-panel-grid` | `oklch(1 0 0 / 0.06)` | cuadrícula tenue del mismo panel |
| `--marca-t` | `oklch(0.955 0.025 185)` | fondo tenue: ícono de la banda, cartel de información, sugerencia del teléfono |
| `--sugerencia-tx` | `oklch(0.3 0.05 195)` | texto de la tarjeta de sugerencia del teléfono (M-Inicio-Personal) |
| `--marca-tx` | `oklch(0.43 0.09 195)` | texto sobre `--marca-t` y el ítem activo del menú |
| `--fondo` | `oklch(0.985 0.004 80)` | fondo de la pantalla |
| `--cab` | `oklch(0.945 0.018 76)` | encabezados arena de tablas, cajas y diálogos |
| `--s2` / `--s3` | `oklch(0.97 0.007 80)` / `oklch(0.945 0.009 80)` | superficies tenues (buscador, controles segmentados) |
| `--borde` / `--borde2` | `oklch(0.915 0.01 80)` / `oklch(0.84 0.014 80)` | bordes normal y fuerte |
| `--borde-bandera` | `oklch(0.24 0.014 78 / 0.12)` | borde suave de una bandera (selector de país) |
| `--t1` / `--t2` / `--t3` | `oklch(0.24 0.012 60)` / `oklch(0.47 0.012 60)` / `oklch(0.62 0.01 60)` | texto principal, secundario y tenue |
| `--velo` | `oklch(0.2 0.014 78 / 0.42)` | velo detrás de diálogos y hojas móviles, igual al lienzo |
| `--lado` | `oklch(0.925 0.02 75)` | **marco arena:** menú lateral y barra superior |
| `--lado-borde` | `oklch(0.87 0.022 75)` | bordes del marco |
| `--lado-hover` | `oklch(0.895 0.022 75)` | hover en el marco |
| `--lado-t2` | `oklch(0.42 0.018 60)` | texto de las opciones del menú lateral y del panel que no están activas |
| `--lado-guia` | `oklch(0.82 0.03 75)` | línea a la izquierda de las opciones de un grupo abierto del panel («Gestión de usuarios») |
| `--lado-activo` | `#fff` | ítem activo del menú (pastilla blanca, con `--marca-tx`) |
| `--panel` | `oklch(0.905 0.022 75)` | segundo panel de Administración, un tono más oscuro que el marco |
| `--fila-alterna` | `oklch(0.968 0.012 78)` | filas alternadas de las tablas |
| `--fila-hover` | `oklch(0.95 0.025 185)` | fila al pasar el mouse |
| `--ok` / `--ok-t` | `oklch(0.44 0.12 155)` / `oklch(0.95 0.05 155)` | estado correcto: texto y fondo tenue |
| `--alerta` / `--alerta-t` | `oklch(0.5 0.12 70)` / `oklch(0.96 0.06 85)` | alerta: texto y fondo tenue |
| `--alerta-tx` | `oklch(0.4 0.1 70)` | texto de la banda ámbar del teléfono («Otra persona cambió esto») |
| `--peligro` / `--peligro-t` | `oklch(0.568 0.2 25)` / `oklch(0.97 0.02 25)` | peligro (errores, acciones destructivas): texto y fondo tenue |
| `--peligro-tx` / `--peligro-borde` | `oklch(0.45 0.17 25)` / `oklch(0.57 0.2 25 / 0.4)` | texto rojo de los avisos sobre fondo tenue (la franja de error, el cartel de problema, la banda «Sin conexión» del teléfono y el motivo del aviso importante) y borde del botón de peligro |
| `--punto-ok` / `--punto-alerta` / `--punto-apagado` | `oklch(0.6 0.13 155)` / `oklch(0.72 0.15 70)` / `oklch(0.75 0.01 78)` | punto de estado: activo, atención y apagado |
| `--franja` / `--franja-ok` / `--franja-mal` / `--franja-accion` | `oklch(0.27 0.012 60)` / `oklch(0.78 0.14 155)` / `oklch(0.75 0.15 25)` / `oklch(0.82 0.08 195)` | franja oscura de los avisos pasajeros del teléfono: fondo, ícono de lo que salió bien, ícono de lo que falló y acción («Copiar código») |
| `--aviso-ok` | `oklch(0.55 0.13 155)` | ícono de lo que salió bien en el aviso pasajero de la compu (tarjeta blanca, abajo a la derecha) |
| `--foco` | `var(--marca)` | anillo de foco |
| `--foco-halo` | `oklch(0.51 0.099 195 / 0.15)` | halo de 3 px alrededor del foco |

Los nombres de esta tabla son los **únicos** que usan los componentes. Los `--color-*` de ArquitecturaBaseFront no se heredan. Las variables de shadcn (`--primary`, `--ring`, `--destructive`, `--border`, `--input`, `--background`…) existen en `index.css` solo como **alias** de estos tokens: `--primary: var(--marca)`, `--ring: var(--foco)`, `--destructive: var(--peligro)`, `--border: var(--borde)`, `--input: var(--t3)`, `--background: var(--fondo)`. El borde de control alcanza al menos 3:1 sobre `--fondo` y `--peligro` sobre `--peligro-t` alcanza al menos 4,5:1.

El estado es un **punto de 8 px y la palabra, sin fondo** («Criterio · Tablas y listas»). Los tonos de `statusTones` pintan el punto (`StatusDot`, `StatusBadge`); la palabra va en el color del texto:

| Tono | Punto |
|---|---|
| `success` | `--punto-ok` (activo, verificado, publicada) |
| `warning` | `--punto-alerta` (vencida, baja pedida, sin verificar) |
| `danger` | `--peligro` (despublicada por la plataforma) |
| `neutral` | `--punto-apagado` (deshabilitado, borrador) |
| `pending` | `--marca` (invitación pendiente) |

## Forma
- Tarjetas (filtros y tablas) con radio de 16 px y sombra suave: `0 1px 2px oklch(0.24 0.012 60 / 0.05), 0 8px 24px -12px oklch(0.24 0.012 60 / 0.14)`.
- Botones normales de 36 px y 14 px de texto; los compactos, de 32 px y 13 px. Ambos usan radio de 8 px. El principal es sólido en `--marca` y el botón de una confirmación irreversible es sólido en `--peligro`.
- **Tablas:** encabezado sobre `--cab`, filas alternadas (`--fila-alterna` desde la primera) y encabezados que bajan de línea en lugar de pisarse.
- **Marca:** un cuadrado con degradado de `--marca` a `--marca-2`, sombra `0 2px 6px -1px var(--marca-sombra)` y un cuadrado blanco abierto del lado derecho, rotado −45° como en el lienzo. Lleva el nombre del producto al lado. Lo mismo en el menú lateral y en las pantallas públicas.
- Los rótulos de grupo del menú van sin mayúsculas ("Administración", no "ADMINISTRACIÓN").
- **Teléfono:** el «+» flotante lleva `--sombra-fab` (`0 6px 16px oklch(0.3 0.06 195 / 0.3), 0 2px 4px oklch(0.3 0.06 195 / 0.2)`); la hoja que sube desde abajo, `--sombra-hoja` (`0 -8px 24px oklch(0.2 0.014 78 / 0.12)`), y la franja de los avisos, `--sombra-franja` (`0 8px 24px oklch(0.2 0.01 60 / 0.3)`). Los grupos son blancos sobre `--s2`, con radio de 14 px y un borde de 1 px en `--borde`.
- **Avisos pasajeros en la compu** (tablero Avisos): abajo a la derecha, una tarjeta blanca de 340 con borde, radio de 10 y `--sombra-aviso` (`0 12px 32px oklch(0.24 0.014 78 / 0.16)`); solo el ícono lleva color (`--aviso-ok`, `--peligro`).

## Menú lateral y panel de Administración
- **Arriba:** Inicio y los módulos del producto. **Abajo de todo:** "Administración".
- **Las opciones** («Criterio · Menús», `layouts/components/menuRow.ts`, igual en el menú y en el panel): miden 32, con 2 px
  entre una y otra y la línea fina adentro de ese espacio (34 de una a otra, lienzo v92). Las que no están activas van en
  `--lado-t2`; la activa, en blanco con `--marca-tx`; el grupo que se despliega, en 600 y `--t1`.
- **La barra de arriba** lleva las migas a la izquierda, todas en `--t2`, y tu menú a la derecha («Criterio · Marco»). El ☰
  que contrae el menú lateral va solo donde hay panel de Administración, porque con el panel abierto la flechita del borde
  se oculta; en Personal el menú se contrae con la flechita (tableros Inicio-Personal y Cuenta).
- **En escritorio**, "Administración" abre un **segundo panel** al lado del menú (`AdminPanel`, 232 px, fondo `--panel`):
  - arriba lleva el título y, sobre su borde derecho, un botón redondo «‹» para cerrarlo;
  - adentro va la misma lista de siempre, con el mismo estilo del menú: el desplegable «Gestión de usuarios» (Usuarios, Roles y permisos), Empresas, Configuración, Página pública y Auditoría;
  - un grupo arranca abierto solo si estás en una de sus pantallas («Gestión de usuarios» en Usuarios, Roles y sus fichas), con sus opciones a 18 de sangría y la línea `--lado-guia`; en las demás pantallas va cerrado, con la flechita a la derecha, y lleva a su primera opción. Lo que la persona abre o cierra a mano vale mientras está en esa pantalla (lienzo v102);
  - **se abre solo en cualquier ruta de administración** y se cierra con «‹» o tocando de nuevo "Administración". Con el panel abierto, "Administración" queda activo en el menú y el botón para contraer el menú lateral se oculta.
- **En el teléfono** no hay menú lateral ni segundo panel: la Administración es un grupo de «Más», abajo («Criterio · Marco y pantallas»).

## Lo verifica
- `theme-tokens.test.ts`: los tokens de esta tabla existen en `index.css`, ningún componente usa un color literal fuera de `index.css`, y ninguna ficha ni componente usa `--color-*` fuera de los alias de shadcn en `index.css`.
