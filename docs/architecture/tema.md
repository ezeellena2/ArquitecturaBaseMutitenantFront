# Tema visual (aprobado el 2026-09-27)

La fuente es el lienzo "Sistema visual · Multitenant", versión 33. Estos tokens van en `src/index.css` como variables CSS, y los componentes los usan siempre por nombre, nunca con el valor. Reemplaza los colores, la marca y el menú lateral de `visual-baseline.md`. La densidad compacta, la banda de título, los listados y las migas siguen como dice la sección "UI y pantallas" de [`frontend.md`](frontend.md).

## Colores
Tonos cálidos para el contenido, verde petróleo como marca, y un **marco arena** (menú lateral y barra superior) un tono más marcado que el centro, para que se despegue.

| Token | Valor | Uso |
|---|---|---|
| `--marca` | `oklch(0.5 0.1 195)` | botón principal, enlaces fuertes, activo |
| `--marca-2` | `oklch(0.58 0.11 170)` | segundo color del degradado del logo y del avatar |
| `--marca-h` | `oklch(0.45 0.1 195)` | hover del botón principal |
| `--marca-t` | `oklch(0.955 0.025 185)` | fondo tenue: ícono de la banda, pastilla "pendiente", fila al pasar el mouse |
| `--marca-tx` | `oklch(0.43 0.09 195)` | texto sobre `--marca-t` y el ítem activo del menú |
| `--fondo` | `oklch(0.985 0.004 80)` | fondo de la pantalla |
| `--s2` / `--s3` | `oklch(0.97 0.007 80)` / `oklch(0.945 0.009 80)` | superficies tenues (buscador, controles segmentados) |
| `--borde` / `--borde2` | `oklch(0.915 0.01 80)` / `oklch(0.84 0.014 80)` | bordes normal y fuerte |
| `--t1` / `--t2` / `--t3` | `oklch(0.24 0.012 60)` / `oklch(0.47 0.012 60)` / `oklch(0.62 0.01 60)` | texto principal, secundario y tenue |
| `--lado` | `oklch(0.925 0.02 75)` | **marco arena:** menú lateral y barra superior |
| `--lado-borde` | `oklch(0.87 0.022 75)` | bordes del marco |
| `--lado-hover` | `oklch(0.895 0.022 75)` | hover en el marco |
| `--lado-activo` | `#fff` | ítem activo del menú (pastilla blanca, con `--marca-tx`) |
| `--panel` | `oklch(0.905 0.022 75)` | segundo panel de Administración, un tono más oscuro que el marco |
| `--fila-alterna` | `oklch(0.968 0.012 78)` | filas alternadas de las tablas |
| `--fila-hover` | `oklch(0.95 0.025 185)` | fila al pasar el mouse |

Los colores de estado (ok, alerta, peligro) no cambian: son los de `statusTones`.

## Forma
- Tarjetas (filtros y tablas) con radio de 16 px y sombra suave: `0 1px 2px oklch(0.24 0.012 60 / 0.05), 0 8px 24px -12px oklch(0.24 0.012 60 / 0.14)`.
- Botones con radio de 10 px. El principal lleva un degradado vertical de `--marca` a `--marca-h` y un relieve de 1 px.
- **Tablas:** encabezado sobre `--s2`, filas alternadas (`--fila-alterna` en las pares) y encabezados que bajan de línea en lugar de pisarse.
- **Marca:** un cuadrado con degradado de `--marca` a `--marca-2` y el nombre del producto al lado. Lo mismo en el menú lateral y en las pantallas públicas.
- Los rótulos de grupo del menú van sin mayúsculas ("Administración", no "ADMINISTRACIÓN").

## Menú lateral y panel de Administración
- **Arriba:** Inicio y los módulos del producto. **Abajo de todo:** "Administración".
- **En escritorio**, "Administración" abre un **segundo panel** al lado del menú (`AdminPanel`, 232 px, fondo `--panel`):
  - arriba lleva el título y, sobre su borde derecho, un botón redondo «‹» para cerrarlo;
  - adentro va la misma lista de siempre, con el mismo estilo del menú: el desplegable «Gestión de usuarios» (Usuarios, Roles y permisos), Empresas, Configuración, Página pública y Auditoría;
  - **se abre solo en cualquier ruta de administración** y se cierra con «‹» o tocando de nuevo "Administración". Con el panel abierto, "Administración" queda activo en el menú y el botón para contraer el menú lateral se oculta.
- **En el teléfono** no hay segundo panel: "Administración" se despliega dentro del mismo menú.

## Lo verifica
- `theme-tokens.test.ts`: los tokens de esta tabla existen en `index.css`, y ningún componente usa un color literal fuera de `index.css`.
