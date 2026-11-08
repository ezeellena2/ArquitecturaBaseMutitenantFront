# Tema visual (aprobado el 2026-09-27)

La fuente de cada pantalla es el [lienzo vigente "Sistema visual · Multitenant"](../design/lienzo/README.md): mandan los ocho tableros «Criterio» y, para cada pantalla, su tablero validado, sobre cualquier descripción textual. Estos tokens van en `src/index.css` como variables CSS, y los componentes los usan siempre por nombre, nunca con el valor. Reemplaza los colores, la marca y el menú lateral de `../ArquitecturaBaseFront/docs/design/visual-baseline.md`. La densidad compacta, la banda de título, los listados y las migas siguen como dice la sección "UI y pantallas" de [`frontend.md`](frontend.md).

## Colores
Tonos cálidos para el contenido, verde pasto como marca y un **marco arena** en tono paja (menú lateral y barra superior), un tono más marcado que el centro para que se despegue. Es la paleta «Pradera» (decisión del usuario del 2026-11-04, elegida sobre la app real), que reemplaza al verde petróleo; por eso «pendiente» tiene su propio celeste, que no se confunde con el verde de la marca ni con el de «activo».

**Que no parezca plantilla** (decisión 173 del 2026-11-07, que cambia el tema del 04/10): quedan la paleta y la densidad, y salen el degradé de la marca y del avatar, la pastilla del activo y las sombras fuera de los menús; el panel del ingreso queda liso (189, del 2026-11-08). En la app entra con la base de la 12: hasta entonces `src/index.css` conserva `--marca-2`, `--marca-sombra`, `--lado-activo` y los `--auth-panel-*`, marcados abajo como «sale».

| Token | Valor | Uso |
|---|---|---|
| `--marca` | `oklch(0.48 0.115 140)` | botón principal (sólido), enlaces fuertes, la barra del activo del menú y el avatar |
| `--marca-2` | `oklch(0.66 0.15 128)` | sale con la base de la 12: era el segundo color del degradado del logo y del avatar (173) |
| `--marca-sombra` | `oklch(0.48 0.115 140 / 0.3)` | sale con la base de la 12: era la sombra corta de la marca (173) |
| `--marca-h` | `oklch(0.43 0.115 140)` | hover del botón principal |
| `--auth-panel-start` / `--auth-panel-mid` / `--auth-panel-end` | `oklch(0.47 0.11 140)` / `oklch(0.35 0.09 145)` / `oklch(0.25 0.06 150)` | salen con la base de la 12: el panel de Ingreso y Registro queda liso, en `--marca`, sin degradé (189) |
| `--auth-panel-grid` | `oklch(1 0 0 / 0.06)` | sale con la base de la 12: era la cuadrícula tenue del mismo panel (189) |
| `--marca-t` | `oklch(0.955 0.035 130)` | fondo tenue: cartel de información, sugerencia del teléfono, lo elegido (la banda ya no lleva ícono, 173) |
| `--sugerencia-tx` | `oklch(0.3 0.06 140)` | texto de la tarjeta de sugerencia del teléfono (M-Inicio-Personal) |
| `--marca-tx` | `oklch(0.41 0.1 140)` | texto sobre `--marca-t` y el ítem activo del menú |
| `--fondo` | `oklch(0.985 0.005 95)` | fondo de la pantalla |
| `--cab` | `oklch(0.945 0.027 95)` | encabezados arena de tablas, cajas y diálogos |
| `--s2` / `--s3` | `oklch(0.97 0.009 95)` / `oklch(0.945 0.011 95)` | superficies tenues (buscador, controles segmentados) |
| `--borde` / `--borde2` | `oklch(0.915 0.013 95)` / `oklch(0.84 0.018 95)` | bordes normal y fuerte |
| `--borde-cab` | `oklch(0.89 0.031 95)` | línea de abajo del encabezado arena de un diálogo o de una caja («Criterio · Diálogos», «Criterio · Formularios») |
| `--borde-bandera` | `oklch(0.24 0.014 78 / 0.12)` | borde suave de una bandera (selector de país) |
| `--t1` / `--t2` / `--t3` | `oklch(0.24 0.012 60)` / `oklch(0.47 0.012 60)` / `oklch(0.62 0.01 60)` | texto principal, secundario y tenue |
| `--velo` | `oklch(0.2 0.014 78 / 0.42)` | velo detrás de diálogos y hojas móviles, igual al lienzo |
| `--lado` | `oklch(0.922 0.036 95)` | **marco arena:** menú lateral y barra superior |
| `--lado-borde` | `oklch(0.865 0.04 95)` | bordes del marco |
| `--lado-hover` | `oklch(0.892 0.04 95)` | hover en el marco |
| `--lado-t2` | `oklch(0.42 0.02 80)` | texto de las opciones del menú lateral y del panel que no están activas |
| `--lado-guia` | `oklch(0.815 0.052 95)` | línea a la izquierda de las opciones de un grupo abierto del panel («Gestión de usuarios») |
| `--lado-activo` | `#fff` | sale con la base de la 12: era la pastilla blanca del ítem activo, que pasa a una barra de 2 px en `--marca` (173) |
| `--panel` | `oklch(0.902 0.04 95)` | segundo panel de Administración, un tono más oscuro que el marco |
| `--fila-alterna` | `oklch(0.968 0.015 95)` | filas alternadas de las tablas |
| `--fila-hover` | `oklch(0.955 0.03 130)` | fila al pasar el mouse |
| `--ok` / `--ok-t` | `oklch(0.44 0.12 155)` / `oklch(0.95 0.05 155)` | estado correcto: texto y fondo tenue |
| `--alerta` / `--alerta-t` | `oklch(0.5 0.12 70)` / `oklch(0.96 0.06 85)` | alerta: texto y fondo tenue |
| `--alerta-tx` | `oklch(0.4 0.1 70)` | texto de la banda ámbar del teléfono («Otra persona cambió esto») |
| `--peligro` / `--peligro-t` | `oklch(0.568 0.2 25)` / `oklch(0.97 0.02 25)` | peligro (errores, acciones destructivas): texto y fondo tenue |
| `--peligro-banda` | `oklch(0.96 0.03 25)` | fondo de la banda roja del teléfono, debajo de la barra («Sin conexión» y el error de guardado de una ficha) |
| `--peligro-tx` / `--peligro-borde` | `oklch(0.45 0.17 25)` / `oklch(0.57 0.2 25 / 0.4)` | texto rojo de los avisos sobre fondo tenue (la franja de error, el cartel de problema, la banda «Sin conexión» del teléfono y el motivo del aviso importante) y borde del botón de peligro |
| `--punto-ok` / `--punto-alerta` / `--punto-apagado` / `--punto-pendiente` | `oklch(0.6 0.13 155)` / `oklch(0.72 0.15 70)` / `oklch(0.75 0.01 78)` / `oklch(0.62 0.12 240)` | punto de estado: activo, atención, apagado y pendiente |
| `--casilla-fija` | `oklch(0.78 0.006 78)` | casilla marcada y fija de un rol de sistema en el teléfono (M-Rol, v108) |
| `--franja` / `--franja-ok` / `--franja-mal` / `--franja-accion` | `oklch(0.27 0.012 60)` / `oklch(0.78 0.14 155)` / `oklch(0.75 0.15 25)` / `oklch(0.84 0.12 130)` | franja oscura de los avisos pasajeros del teléfono: fondo, ícono de lo que salió bien, ícono de lo que falló y acción («Copiar código») |
| `--aviso-ok` | `oklch(0.55 0.13 155)` | ícono de lo que salió bien en el aviso pasajero de la compu (tarjeta blanca, abajo a la derecha) |
| `--foco` | `var(--marca)` | anillo de foco |
| `--foco-halo` | `oklch(0.48 0.115 140 / 0.15)` | halo de 3 px alrededor del foco |

Los nombres de esta tabla son los **únicos** que usan los componentes. Los `--color-*` de ArquitecturaBaseFront no se heredan. Las variables de shadcn (`--primary`, `--ring`, `--destructive`, `--border`, `--input`, `--background`…) existen en `index.css` solo como **alias** de estos tokens: `--primary: var(--marca)`, `--ring: var(--foco)`, `--destructive: var(--peligro)`, `--border: var(--borde)`, `--input: var(--t3)`, `--background: var(--fondo)`. El borde de control alcanza al menos 3:1 sobre `--fondo` y `--peligro` sobre `--peligro-t` alcanza al menos 4,5:1.

El estado es un **punto de 8 px y la palabra, sin fondo** («Criterio · Tablas y listas»). Los tonos de `statusTones` pintan el punto (`StatusDot`, `StatusBadge`, `StatusMark`); la palabra va en el color del texto:

| Tono | Punto |
|---|---|
| `success` | `--punto-ok` (activo, verificado, publicada) |
| `warning` | `--punto-alerta` (vencida, baja pedida, sin verificar) |
| `danger` | `--peligro` (despublicada por la plataforma) |
| `neutral` | `--punto-apagado` (deshabilitado, borrador) |
| `pending` | `--punto-pendiente` (invitación pendiente, difusión programada) |

## Forma
- **Escala de escritorio al 75 %** (decisión del usuario del 2026-11-02, como en ArquitecturaBase). Las medidas de este documento, de las fichas y de los tableros son nominales, sobre una raíz de 16 px. En la compu (≥ 1024 px y puntero fino) `src/index.css` pone la raíz en 75 % y la app entera se ve como con el zoom del navegador en 75 %: 13 px se leen 9,75 y un botón de 36 mide 27. Teléfono y tablet quedan en 16 px, con sus áreas táctiles de 44. Por eso el código mide en `rem` o en la escala de Tailwind: lo que el tablero dibuja de 220 se escribe `w-55`, y 13 de letra, `text-[0.8125rem]`. En px quedan las líneas de hasta 2, los anillos (`ring-[3px]`, `shadow-[0_0_0_…]`) y los cortes. La escala se cambia solo en esa regla de `index.css`.
- **La escala de ArquitecturaBase** (decisión 180 del 2026-11-07, que el usuario eligió viendo la misma planilla en tres escalas): las medidas que se ven en la compu.
  - **Letra:** 10,7 el cuerpo, las filas y los menús (unos 11); 11,5 un botón; 14,8 el título de la banda; nunca menos de 10,5.
  - **Altos:** botón normal 27, chico 24 y grande 33; campo 27 (33 en el ingreso); fila y encabezado de una tabla 30 (33 en la planilla); banda de la página 47; barra de arriba 38,5; opción del menú lateral 24.
  - **Rellenos:** 17 el cuerpo de una página; 12 y 14 una caja.
  - **Esquinas** de 3 como mucho, también pastillas y avatares; un círculo (un punto de estado, un radio, el aro) sigue siendo un círculo. Sin sombras, salvo en menús, desplegables y tooltips (173). Los anchos no cambian, lo cuadrado sigue cuadrado y el ícono de un botón conserva su tamaño.

  Salen de las medidas nominales de este documento: la letra × 0,82, los altos de 18 a 72 × 0,74 y los rellenos y las separaciones × 0,72. El lienzo las dibuja tal cual desde la versión 166 (`traspaso10_piezas_1004.py`); el teléfono conserva sus medidas táctiles (44 × 44). **En la app entra con la base de la 12**, que decide cómo llegar a estas medidas: la raíz al 75 % ya da casi todas (36 × 0,75 = 27; 40 × 0,75 = 30), no la letra (13 × 0,75 = 9,75) ni las esquinas. No se aplican las dos escalas encima: la letra quedaría en 8.
- **Sin sombras, salvo en menús, desplegables y tooltips** (173): la profundidad la dan el borde de 1 px y el escalón de luz entre el fondo y la superficie. Quedan `--sombra-menu` y la de un tooltip; salen las de las tarjetas, los botones, los diálogos, el aviso de abajo, la flecha del menú lateral, las hojas, la franja y el «+» del teléfono, la tarjeta de la página pública y la del directorio. Un anillo de foco o un borde dibujado con `box-shadow` (`0 0 0 1px`, `inset`) no es una sombra y queda.
- Tarjetas (filtros y tablas) con radio de 16 px, borde `--borde` y sin sombra.
- **Cajas de un formulario** («Criterio · Formularios», `.caja2`; `Section`): borde `--borde`, radio de 12 px y sin sombra; el encabezado arena de 40 lleva la línea `--borde-cab` y el botón chico a 4 del borde.
- Botones normales de 36 px y 14 px de texto; los compactos, de 32 px y 13 px. Ambos usan radio de 8 px, que es **el radio de un control**. El principal es sólido en `--marca`, sin degradé ni sombra, y `--marca-h` al pasar el mouse (173); el botón que confirma algo que destruye es sólido en `--peligro` (161).
- **Filtros, etiquetas y contadores** (173): los filtros y las etiquetas, con el radio de un control, nunca en pastilla; un contador (el de una pestaña, el de una opción del menú) va como texto, sin fondo. El número de la campana es un cuadrado chico con el mismo radio.
- **Tablas:** encabezado sobre `--cab`, filas alternadas (`--fila-alterna` desde la primera) y encabezados que bajan de línea en lugar de pisarse. **Entre columnas va una línea fina** del tono de la que separa las filas, en el encabezado y en el cuerpo. Es una sombra interior de la celda y no un borde, así una columna fija se la lleva al desplazar. La última fila conserva su línea, salvo que la tabla toque el borde de su caja (137).
- **Marca:** el nombre del producto, en 700 y `--t1`, sin cuadrado ni degradé (173). Lo mismo en el menú lateral y en las pantallas públicas. Reemplaza el cuadrado con degradé de `--marca` a `--marca-2` y su sombra.
- **Banda de la página:** el título y su segunda línea, sin ícono de la sección; una pantalla interna lleva «‹» antes del título (173).
- **Avatar:** un cuadrado chico con la inicial, relleno de `--marca` y la letra blanca en 600, con radio de 6: 24 en la barra de arriba y en el pie del menú (173). Sin círculo ni degradé. En la cabecera de tu menú y en las filas del teléfono conserva su medida, también cuadrado (radio de 8 hasta 44 y de 12 más grande); el de una invitación sin cuenta, gris.
- Los rótulos de grupo del menú van sin mayúsculas ("Administración", no "ADMINISTRACIÓN").
- **Teléfono:** el «+» flotante, la hoja que sube desde abajo y la franja oscura de los avisos van sin sombra (173): `--sombra-fab`, `--sombra-hoja` y `--sombra-franja` salen con la base de la 12. La hoja se separa con el velo; el «+» y la franja, por su color. Los grupos son blancos sobre `--s2`, con radio de 14 px y un borde de 1 px en `--borde`.
- **Página pública** (tableros Pagina-Publica y M-Pagina-Publica, `shared/ui/PublicPageCard`): la tarjeta blanca de 560 como máximo, con radio de 20 (18 en el teléfono) y borde `--borde`, sin sombra (173: `--sombra-tarjeta` y `--sombra-tarjeta-movil` salen con la base de la 12), sobre `--fondo` con el brillo `--fondo-brillo` arriba a la derecha.
- **Tarjetas del directorio** (Landing, Landing-Movil, Directorio y M-Directorio, lienzo v112, `.lp-emp a:hover`): al pasar sobre una empresa, solo el borde `--borde2`, sin `--sombra-directorio` (173). Su logo o iniciales mide 44 y su radio es 12; la tarjeta tiene radio de 16.
- **Diálogos y menús de la compu** («Criterio · Diálogos», `.cd`; los menús y listas que se abren, `.menu` y `.o-lst`): el diálogo, con borde y sin sombra, sobre el velo (`--sombra-dialogo` sale con la base de la 12); el menú, el desplegable o la lista que se abre y el tooltip conservan `--sombra-menu` (`0 12px 32px oklch(0.24 0.014 78 / 0.14)`).
- **Dos vistas de lo mismo** («Criterio · Menús», `.o-seg`; `SegmentedControl`): las opciones en partes iguales, de 30 (44 × 44 en el teléfono); **la elegida va rellena en `--marca`, con la letra blanca, y las otras, blancas, con su texto entero** (142). Reemplaza la vía `--s3` con la elegida en `--lado-activo` y `--sombra-segmento`, que no se distinguía. El foco es un anillo de 2 px por fuera, separado 2 px.
- **Lo elegido, en todo el sistema** (142): nunca solo un tinte, con 3:1 contra lo no elegido y el texto a 4,5:1. La tarjeta elegida suma un borde de 2 px en `--marca` y el fondo `--marca-t`; en un desplegable de un filtro, la elegida lleva la tilde a la izquierda, y la fila abierta de una tabla y la conversación abierta del chat, `--marca-t` y una barra de 3 px en `--marca` al inicio.
- **El ítem activo del menú** (173): una barra de 2 px en `--marca` a la izquierda, sobre `--lado-hover`, y la letra en `--marca-tx` y 600; sin pastilla blanca ni sombra. Igual en el menú lateral, en su panel y en «Administración» abierta.
- **Avisos pasajeros en la compu** (tablero Avisos): abajo a la derecha, una tarjeta blanca de 340 con borde `--borde2` y radio de 10, sin sombra (173: `--sombra-aviso` sale con la base de la 12); solo el ícono lleva color (`--aviso-ok`, `--peligro`).

## Menú lateral y panel de Administración
- **Arriba:** Inicio y los módulos de uso diario del producto. **Abajo de todo**, después de una línea en `--lado-borde`: "Administración". Un módulo de uso diario (como WhatsApp, en la E11) abre su propio panel al lado del menú, como Administración, y se abre uno a la vez («Criterio · Menús», R10).
- **Las opciones** («Criterio · Menús», `layouts/components/menuRow.ts`, igual en el menú y en el panel): miden 32, con 2 px
  entre una y otra y la línea fina adentro de ese espacio (34 de una a otra, lienzo v92). Las que no están activas van en
  `--lado-t2`; la activa, con la barra de 2 px en `--marca` y `--marca-tx` en 600 (173); el grupo que se despliega, en 600 y
  `--t1`. Un nombre largo baja de renglón en lugar de cortarse con «…» (174).
- **La barra de arriba** lleva las migas a la izquierda, todas en `--t2`, y tu menú a la derecha («Criterio · Marco»). Nada
  más: sin ☰ con sesión, también en la organización (lienzo v104). El menú lateral se contrae solo con la flecha redonda de
  28 sobre su borde («Criterio · Menús»); con el panel de Administración abierto se ve solo la flecha del panel, que lo cierra.
  Es la misma en los dos (`panelEdgeButtonClass`, lienzo v107): blanca, con borde `--borde2` y sin sombra (173:
  `--sombra-flecha` sale con la base de la 12), a 64 de arriba y la flecha de 18.
- **En escritorio**, "Administración" abre un **segundo panel** al lado del menú (`AdminPanel`, 232 px, fondo `--panel`):
  - arriba lleva el título y, sobre su borde derecho, un botón redondo «‹» para cerrarlo;
  - adentro va la misma lista de siempre, con el mismo estilo del menú: el desplegable «Gestión de usuarios» (Usuarios, Roles y permisos), Empresas, Configuración, Página pública y Auditoría;
  - un grupo arranca abierto solo si estás en una de sus pantallas («Gestión de usuarios» en Usuarios, Roles y sus fichas), con sus opciones a 18 de sangría y la línea `--lado-guia`; en las demás pantallas va cerrado, con la flechita a la derecha, y lleva a su primera opción. Lo que la persona abre o cierra a mano vale mientras está en esa pantalla (lienzo v102);
  - **se abre solo en cualquier ruta de administración** y se cierra con «‹» o tocando de nuevo "Administración". Con el panel abierto, "Administración" queda activo en el menú y el botón para contraer el menú lateral se oculta.
- **En el teléfono** no hay menú lateral ni segundo panel: la Administración es un grupo de «Más», abajo («Criterio · Marco y pantallas»).

## Lo verifica
- `theme-tokens.test.ts`: los tokens de esta tabla existen en `index.css`, ningún componente usa un color literal fuera de `index.css`, y ninguna ficha ni componente usa `--color-*` fuera de los alias de shadcn en `index.css`.
