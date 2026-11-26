"""El detalle de una respuesta y la aprobación, de la E19 a la E21, con el traspaso 18 (tanda 3B de Diseño, grupo F1, 2026-11-26):
`FRM-Respuesta-19`, `FRM-Respuesta-20` y `FRM-Respuesta-Aprobacion`, con sus teléfonos, redibujados en su lugar.

**En los seis** (266 y 267, con la 174, la 209, la 211, la 261, la 263 y la 275):
- **la respuesta se lee como el formulario:** las zonas de la carga («Datos», una por título y «Fotos y documentos»), en el orden
  del autor, con la grilla de hasta tres por renglón en la pantalla completa, dos en la vista rápida y una en el teléfono. Cada
  pregunta es su control de solo lectura: el recuadro gris claro con el valor en negro; elegir y el Sí o No, la pieza cerrada con su
  flecha fina (262); «Elegir varias», entera, separada por coma y sin «y N más» (174); un cálculo, en gris y con su fórmula en la
  (i); cada dato de una opción de catálogo, su campo gris «Pregunta · Dato» en el mismo renglón que su pregunta; la ubicación, su
  punto con la precisión y «Ver en el mapa»; el bloque, su tabla en la pantalla completa (el número sin encabezado y el dato del
  catálogo y el cálculo del ítem como columnas grises), y un recuadro por ítem, «Ítem 2» en su banda, en la vista rápida y en el
  teléfono. Lo que una condición ocultó no aparece, y una pregunta que la versión no tenía, tampoco (263 y E19);
- **la forma de la E15** (`e15_respuesta_1004.py`, de la tanda 3A, que no se importa porque puede cambiar): las mismas zonas,
  controles, recuadros y columnas, con sus medidas y sus textos;
- **arriba, solo la línea gris de quién y cuándo** («La respondió Tomás Acosta por WhatsApp el 15/10/2026, 11:47»): los momentos
  pasan a la actividad. La versión va al lado del número («VIS-000126 Versión 4»), en la banda de la pantalla completa, en el
  renglón del título de la vista rápida y en la barra del teléfono, y después el estado si pide aprobación;
- **la vista rápida** lleva las pestañas «Respuesta» y «Actividad» (sin «Fotos» ni «PDF»: las fotos son su zona y cada PDF es un
  renglón de la actividad); **la actividad** va en recuadros en la vista rápida y en el teléfono, con «Qué pasó» arriba y los demás
  datos con su nombre, de a dos, y en ocho columnas en la pantalla completa (Fecha, Hora, Qué pasó, Quién, Canal, Detalle, Estado y
  Acciones), con las bandas por momento como renglones que separan y «—» donde no aplica. Lo de un renglón va en su ⋮ (261): ver y
  bajar el PDF, «Reintentar» y «Revisar en la bandeja»; en el teléfono, el ⋮ abre una hoja con esas opciones. «Qué pasó» lo dice
  como la E15 y ArquitecturaBase, corto para que entre en su columna sin bajar de renglón (solo «Detalle» ocupa varias líneas,
  267): «La mandó», «Se pidió la ubicación», «Llegó la ubicación» o «Siguió sin la ubicación», «La respondió» o «La cargó», «Aviso a quien la
  cargó», «Se pidió aprobación», «La aprobó» o «La rechazó», «Se armó el PDF», «Mandar por correo», «Aviso a un rol» (un renglón por
  persona), «Pidió reintentar» y «Se revisó el envío»; una acción que no se pudo, con el nombre de la acción («Pedir aprobación a
  un rol»). Lo que hacen las personas en la app va con el canal «App»; los avisos, con «WhatsApp» o «Correo». En el teléfono,
  «Abrir conversación» es un ícono de la barra de arriba, así el renglón de ↑ ↓ entra con «1 de 2 por aprobar» desde 320 px;
- el panel de «Gestión de formularios» en dos grupos (275), en los de la compu.

**Por tablero:**
- `FRM-Respuesta-19` y `M-FRM-Respuesta-19` (263 y 266): «Pedido de materiales», versión 3. «Monto» no aparece cuando «¿Se concretó
  la venta?» es No, y «Total», que lo suma, queda vacío y gris con su fórmula en la (i) («Suma de Productos · Importe + Monto.»);
  «Productos» es su tabla con «Producto · Precio» e «Importe» en gris, o un recuadro por ítem. Estados nuevos: «La fórmula del
  total», «De antes del bloque» (PED-000039, versión 2, sin el bloque ni el total), «Actividad» y «Pantalla completa: un cálculo
  sin respuesta»; en el teléfono, «La fórmula del total» y «Actividad».
- `FRM-Respuesta-20` y `M-FRM-Respuesta-20` (266 y 267): PED-000046, cargada en la app, como el formulario de la versión 4, con
  «Proveedor · CUIT» y «Lugar de entrega» en su renglón; sin «Abrir conversación». «La cargó» y el pedido de ubicación por
  WhatsApp («Se pidió la ubicación», «Llegó la ubicación» o «Siguió sin la ubicación», E20) son renglones de la actividad. Estados
  nuevos: «Actividad», «Por WhatsApp, con la ubicación» y «Por WhatsApp, siguió sin la ubicación» (dos de «Visita a cliente»); en
  el teléfono, «Actividad», «Por WhatsApp, con la ubicación» y «Actividad: el pedido de ubicación».
- `FRM-Respuesta-Aprobacion` y `M-FRM-Respuesta-Aprobacion` (266, 267, 261, 276, 240 y 281): «Visita a cliente», versión 4, con
  «Ubicación de la visita» (la de `WA-Chats-Formulario-20`). «Rechazar» y «Aprobar» van arriba de las pestañas mientras espera (en
  el teléfono, fijos abajo); «Corregir» a la vista, el lápiz primero en la vista rápida y con texto en la banda de la pantalla
  completa, y «Anular» sigue en el ⋮. La actividad, renglón por renglón: la aprobación y el rechazo con quién y el motivo en
  «Detalle», o «Sin motivo» (276); cada PDF, su renglón con «Ver PDF» y «Bajar PDF» en el ⋮; cada persona de un aviso, con su
  estado y el nombre actual del rol en «Detalle»; cada pedido de reintento y cada revisión, su renglón («Pidió reintentar», «Se
  revisó el envío»). **«Sin confirmar»** (240, 281 y ADR 0066 §2, §4 y §7): la persona de un aviso por WhatsApp a un rol queda «Sin
  confirmar», la cola no lo repite, y el ⋮ lleva a revisarlo en la bandeja; revisado, su «Detalle» suma «Lo revisó Ana Gómez el
  13/10/2026, 16:40.», la revisión es su renglón y el ⋮ ofrece «Reintentar». El correo con el PDF también puede quedar «Sin
  confirmar»: no se repite solo, la respuesta queda «Por resolver» (la columna «Reglas» de la planilla de atrás) y quien tiene
  «Administrar reglas y PDF» ve «Reintentar» en el ⋮, que pide confirmar con «Puede que ya le haya llegado. ¿Mandarlo otra vez?»;
  mandado, el renglón vuelve a «Hecho», suma «Pidió reintentar» y deja de estar por resolver. Sin ese permiso no hay ⋮; un correo
  no lleva «Revisar» ni «Lo revisó», porque no tiene bandeja. «1 de 2 por aprobar» cuenta y recorre la cola igual en el panel y en
  la pantalla completa (O22). El PDF ya no es una pestaña: «PDF» es el ⋮ abierto de su renglón y «Copia fija», el visor.
  Estados nuevos: «Rechazar: motivo opcional», «Rechazada sin motivo», «Desde «Por aprobar»», «Actividad: sin confirmar»,
  «Actividad: sin confirmar, revisado», «Actividad: correo sin confirmar», «Reintentar el correo», «Actividad: correo mandado otra
  vez», «Sin permiso para reintentar» y cuatro de pantalla completa; en el teléfono, los mismos que le tocan.

**Las piezas que exporta** (las importa el grupo que sigue, corregir, anular y las planillas de la E21):
- `P(nombre, valor, tipo, **kw)`: una pregunta respondida. Tipos: `texto`, `largo` (todo el renglón), `numero` y `fecha`
  (angostos), `sino`, `una` y `varias` (la pieza cerrada; varias, entera), `calculo` (gris, con `formula` en la (i)), `dato` (el
  campo gris de un catálogo), `ubicacion` (`precision` en m), `fotos` (lista de nombres), `documento` ((nombre, peso)) y `bloque`
  (`columnas` de `C(...)` e `items`). Con `editable=True` el control queda blanco para corregir, `antes` dibuja «Antes: …» debajo y
  `error`, el error del campo.
- `catalogo(nombre, valor, datos, tipo="una")`: la pregunta de un catálogo con sus datos sellados, cada uno su campo «Pregunta ·
  Dato» en el mismo renglón.
- `C(nombre, clase="", formula=None)`: una columna del bloque; `clase` con `g` (gris: dato del catálogo o cálculo) y `r` (a la
  derecha, números).
- `Z(titulo, preguntas, plegada=None)`: una zona; `plegada` es lo que dice su banda («3 de 5 respondidas»).
- `respuesta(zonas, cols=3, tel=False, i_abierta=None)`: la respuesta entera, con la grilla de `cols` por renglón (3 en la pantalla
  completa, 2 en la vista rápida, 1 en el teléfono); `i_abierta`, la pregunta cuya (i) se dibuja abierta.
- `control(p, cols, tel, i_abierta, ancho)`: una pregunta con su etiqueta y su control.
- `bloque_tabla(p)` y `bloque_recuadros(p, tel)`: el bloque en su tabla, o un recuadro por ítem con «Ítem N» en su banda.
- `linea(texto)`: la línea gris de quién y cuándo.
- `R(fecha, hora, que, quien, canal, detalle, estado, menu, que_i, abierto, tip)` y `B(titulo, filas)`: un renglón de la actividad y
  su banda; `estado` es `E(clase, texto, info)` (clase `ok`, `pend`, `aten`, `mal` o vacía); `menu`, las opciones del ⋮ (`M_VER`,
  `M_BAJAR`, `M_REINTENTAR`, `M_BANDEJA` o las que armes con `(ícono, texto, clase, href)`); `abierto`, el ⋮ abierto en la compu.
- `actividad_tabla(bandas, rev)`: la actividad en ocho columnas, en su caja, para la pantalla completa.
- `actividad_recuadros(bandas, rev, desde, tel)`: la actividad en recuadros (vista rápida y teléfono); `desde` dibuja desde esa
  banda, como desplazada.
- `actividad_tel(bandas, rev, desde)`: la sección «Actividad» del teléfono.
- `menu_fila(opciones)`, `hoja_menu(titulo, opciones)`, `dialogo_confirmar(...)`, `hoja_confirmar(...)`, `toast(texto)` y
  `toast_tel(texto)`: el ⋮ abierto, su hoja en el teléfono, la confirmación y el aviso de abajo.
- `vista_rapida(numero, cuerpo, ...)`, `decision(...)`, `aviso(texto)`: el panel de la vista rápida, con el lápiz, los íconos, la
  línea gris, «Rechazar» y «Aprobar» y las pestañas.
- `banda_completa(numero, ...)`, `acciones_banda(...)` y `cuerpo_completa(...)`: la pantalla completa, con «Versión N» en la banda.
- `pagina_tel(numero, cuerpo, version=, linea_gris=, ...)` y `fijo_tel(...)`: la pantalla del teléfono, con el número y su versión en
  la barra, la línea gris debajo y «Rechazar» y «Aprobar» fijos abajo.
- `rehacer_compu(nombre, estados, ...)` y `rehacer_tel(nombre, estados, ...)`: cambian los estados de un tablero (cada uno,
  `dict(banda=, cuerpo=, aside=, capa=)` en la compu y `dict(cuerpo=, capa=)` en el teléfono) y conservan el marco.
- `viejos_compu(t)` y `viejos_tel(t)`: los `sc-if` de un tablero por estado, para copiar la planilla de atrás o un diálogo.
- `seleccionar(cuerpo, numero)` y `por_resolver(cuerpo, numero)`: la fila elegida y «Por resolver» en la columna «Reglas».
- `CSS_COMPU` y `CSS_TEL`: el CSS de todo esto, con las medidas de antes de la escala.

Cambia los tableros en su lugar; no corre dos veces (el bloque `<style data-t3b="e21-respuesta">` lo frena). Al final pasa
`traspaso10_piezas_1004.py --tableros <los seis>`, que pone la escala de la compu, y parte en dos grupos el panel de los tres de la
compu (275). Los altos cambian: `FRM-Respuesta-19` a 1000, `FRM-Respuesta-20` a 1100 y `FRM-Respuesta-Aprobacion` a 1500.

Uso: `python e21_respuesta_1004.py`.
"""
import io
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e14_panel_1004 as e14p  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
GRUPO = "e21-respuesta"
MARCA = f'<style data-t3b="{GRUPO}">'
SUFIJO = " · para aprobar"
NADA = "—"
TABLEROS = ["FRM-Respuesta-19", "M-FRM-Respuesta-19", "FRM-Respuesta-20", "M-FRM-Respuesta-20", "FRM-Respuesta-Aprobacion",
            "M-FRM-Respuesta-Aprobacion"]

# ---------------------------------------------------------------------------------------------------------------- íconos
_TR = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
       'stroke-linejoin="round" aria-hidden="true">')
_TR2 = _TR.replace('stroke-width="1.75"', 'stroke-width="2"')
SVG_COMPLETA = _TR + '<path d="M14 4h6v6"/><path d="m20 4-7 7"/><path d="M10 20H4v-6"/><path d="m4 20 7-7"/></svg>'
SVG_CONVERSACION = _TR + '<path d="M5 5h14v10H9l-4 4z"/></svg>'
SVG_ARRIBA = _TR2 + '<path d="m6 15 6-6 6 6"/></svg>'
SVG_ABAJO = _TR2 + '<path d="m6 9 6 6 6-6"/></svg>'
SVG_CERRAR = _TR2 + '<path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>'
SVG_VOLVER = _TR2 + '<path d="M14.5 5.5 8 12l6.5 6.5"/></svg>'
SVG_KEB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
           '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
SVG_BAJAR = _TR + '<path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/></svg>'
SVG_MAPA = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/>'
            '<path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>')
SVG_CHEV = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>')
SVG_OK = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/></svg>')
SVG_LAPIZ, SVG_VER, SVG_REINTENTAR = b2.SVG_LAPIZ, b2.SVG_REVISAR, b2.SVG_REENVIAR

# Las opciones del ⋮ de un renglón (261): (ícono, texto, clase, enlace).
M_VER = (SVG_VER, "Ver PDF", "", None)
M_BAJAR = (SVG_BAJAR, "Bajar PDF", "", None)
M_REINTENTAR = (SVG_REINTENTAR, "Reintentar", "", None)
M_BANDEJA = (SVG_CONVERSACION, "Revisar en la bandeja", "", "WA-Chats-Avisos.dc.html")
M_BANDEJA_TEL = (SVG_CONVERSACION, "Revisar en la bandeja", "", "M-WA-Conversacion-Avisos.dc.html")

# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala: la pasada de las piezas las achica en la compu (180). Nada empieza con `.ap-` ni `.tel-`, que la
# escala salta por ser del teléfono.
CSS_RESPUESTA = """
/* F1 · La respuesta como el formulario (266), con la forma de la E15 (`e15_respuesta_1004.py`): las zonas de la carga con su banda,
   la grilla de hasta tres por renglón y cada pregunta en su control de solo lectura, el recuadro gris claro con el valor en negro;
   un cálculo y el dato de una opción de catálogo, con el valor en gris (263). */
.rf { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.rf-linea { margin: 0; font-size: 13.5px; line-height: 1.4; color: var(--t2); }
.rf-z { background: #fff; border: 1px solid var(--borde); border-radius: 3px; }
.rf-zc { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 8px 0 16px; background: oklch(0.945 0.027 95); border-bottom: 1px solid oklch(0.89 0.031 95); border-radius: 3px 3px 0 0; font-size: 13px; font-weight: 600; color: var(--t1); }
.rf-zc .t { flex: 1; min-width: 0; }
.rf-zc .res { font-weight: 400; color: var(--t2); white-space: nowrap; }
.rf-zc > button { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--t2); }
.rf-z:not(.pl) .rf-zc > button svg { transform: rotate(180deg); }
.rf-z.pl .rf-zc { border-bottom: 0; border-radius: 3px; }
.rf-f { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding: 12px 16px; border-top: 1px solid var(--borde); align-items: start; }
.rf-zc + .rf-f { border-top: 0; }
.rf-f.c2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.rf-f.c1 { grid-template-columns: minmax(0, 1fr); }
.rf-q { position: relative; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.rf-q.s2 { grid-column: span 2; }
.rf-q.s3 { grid-column: 1 / -1; }
.rf-f.c2 .rf-q.s2, .rf-f.c1 .rf-q.s2 { grid-column: 1 / -1; }
.rf-et { display: inline-flex; align-items: center; gap: 2px; font-size: 12.5px; font-weight: 600; color: var(--t2); }
.rf-et .b2-i { margin-left: 4px; }
.rf-v { display: flex; align-items: center; gap: 8px; box-sizing: border-box; min-height: 36px; padding: 7px 12px; border: 1px solid var(--borde); border-radius: 3px; background: oklch(0.972 0.006 95); color: var(--t1); font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; }
.rf-v .tx { flex: 1; min-width: 0; }
.rf-v > svg { flex: none; color: var(--t3); }
.rf-v.ang { width: 168px; max-width: 100%; }
.rf-v.num { font-variant-numeric: tabular-nums; }
.rf-v.gris { color: var(--t2); }
.rf-v.area { align-items: flex-start; min-height: 72px; }
.rf-v.vac { color: var(--t3); }
.rf-v.ar { padding: 8px 10px; }
.rf-v.ed { background: #fff; border-color: var(--borde2); }
.rf-v.err { border-color: var(--peligro); }
.rf-antes { font-size: 12.5px; color: var(--t2); }
.rf-error { font-size: 12.5px; color: var(--peligro); }
.rf-ub { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.rf-ub .rf-v { flex: 0 1 auto; }
.rf-ub .prec { font-size: 13px; color: var(--t2); white-space: nowrap; }
.rf-ub a { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--marca-tx); white-space: nowrap; text-decoration: none; }
/* Fotos y documentos (E18): las miniaturas, que abren el visor, y cada documento con su nombre, que lo baja, y su tamaño al lado. */
.rf-ths { display: flex; flex-wrap: wrap; gap: 8px; }
.rf-th { width: 72px; height: 72px; padding: 0; border: 1px solid var(--borde); border-radius: 3px; background: linear-gradient(135deg, oklch(0.86 0.04 140), oklch(0.72 0.06 160)); cursor: zoom-in; }
.rf-th.b { background: linear-gradient(135deg, oklch(0.88 0.03 80), oklch(0.74 0.05 60)); }
.rf-docs { display: flex; flex: 1; flex-direction: column; gap: 6px; min-width: 0; }
.rf-doc { display: flex; align-items: center; gap: 10px; min-width: 0; }
.rf-doc .pdf { flex: none; display: inline-flex; width: 28px; height: 32px; align-items: center; justify-content: center; border-radius: 3px; background: oklch(0.55 0.18 25); color: #fff; font-size: 9px; font-weight: 700; }
.rf-doc .nm { min-width: 0; color: var(--marca-tx); font-weight: 600; text-decoration: none; overflow-wrap: anywhere; }
.rf-doc .kb { flex: none; padding-left: 10px; border-left: 1px solid var(--borde); color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* F1 · El bloque (E19 y 266): su tabla, un ítem por fila con el número en una columna sin encabezado; el dato del catálogo y el
   cálculo del ítem, en gris, son una columna más. No ordena: el orden de los ítems es un dato (264). */
.rf-bt { display: grid; border: 1px solid var(--borde); border-radius: 3px; background: #fff; font-size: 13.5px; }
.rf-bt > span { display: flex; align-items: center; min-width: 0; padding: 7px 10px; border-top: 1px solid var(--borde); line-height: 1.4; overflow-wrap: anywhere; }
.rf-bt > span + span:not(.n) { box-shadow: inset 1px 0 0 var(--borde); }
.rf-bt > .h { border-top: 0; background: oklch(0.945 0.027 95); font-size: 13px; font-weight: 600; color: var(--t2); }
.rf-bt > .n { justify-content: flex-end; color: var(--t2); font-variant-numeric: tabular-nums; }
.rf-bt > .r { justify-content: flex-end; text-align: right; font-variant-numeric: tabular-nums; }
.rf-bt > .g:not(.h) { color: var(--t2); }
.rf-bt .b2-i { margin-left: 4px; }
/* En la vista rápida y en el teléfono, un recuadro por ítem, con «Ítem 2» en su banda y cada dato con su nombre (263). */
.rf-its { display: flex; flex-direction: column; gap: 8px; }
.rf-it { border: 1px solid var(--borde); border-radius: 3px; background: #fff; }
.rf-it .bn { display: block; padding: 6px 12px; border-bottom: 1px solid var(--borde); border-radius: 3px 3px 0 0; background: oklch(0.945 0.027 95); font-size: 13px; font-weight: 600; color: var(--t1); }
.rf-it dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; margin: 0; padding: 10px 12px; }
.rf-it dl > div { min-width: 0; }
.rf-it dt { display: inline-flex; align-items: center; font-size: 12.5px; line-height: 1.3; color: var(--t2); }
.rf-it dd { margin: 2px 0 0; font-size: 14px; line-height: 1.4; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.rf-it dd.g { color: var(--t2); }
"""

CSS_ACTIVIDAD = """
/* F1 · La actividad, renglón por renglón (267), con la forma de la E15: ocho columnas con una línea fina entre ellas (137), la
   banda por momento como renglón que separa y «—» donde no aplica; «Detalle» es la única celda que ocupa varias líneas. Lo de un
   renglón, en su ⋮ (261). */
.ra-caja { background: #fff; border: 1px solid var(--borde); border-radius: 3px; }
.ra-cab { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 16px; background: oklch(0.945 0.027 95); border-bottom: 1px solid oklch(0.89 0.031 95); border-radius: 3px 3px 0 0; font-size: 13px; font-weight: 600; }
.ra-cab .meta { margin-left: auto; font-weight: 400; color: var(--t2); }
.ra-t { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 14px; color: var(--t1); }
.ra-t th, .ra-t td { padding: 10px 12px; border-top: 1px solid var(--borde); text-align: left; vertical-align: top; line-height: 1.4; overflow-wrap: anywhere; }
.ra-t thead th { border-top: 0; background: oklch(0.945 0.027 95); font-size: 13px; font-weight: 600; color: var(--t2); white-space: nowrap; }
.ra-t td + td, .ra-t thead th + th { box-shadow: inset 1px 0 0 var(--borde); }
.ra-t .bd th { padding: 7px 12px; background: oklch(0.975 0.01 95); font-size: 13px; font-weight: 600; color: var(--t2); }
.ra-t td:nth-child(-n+2) { font-variant-numeric: tabular-nums; }
.ra-t .nada { color: var(--t3); }
.ra-t .acc { text-align: right; overflow: visible; }
.ra-t td.acc { padding-top: 5px; padding-bottom: 5px; }
.ra-que { display: inline-flex; align-items: center; gap: 2px; font-weight: 500; }
.ra-que .b2-i { margin-left: 4px; }
.ra-kw { position: relative; display: inline-flex; }
.ra-keb { width: 28px; height: 28px; }
.ra-menu { position: absolute; z-index: 30; right: 0; top: calc(100% + 4px); display: flex; flex-direction: column; min-width: 210px; padding: 6px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); text-align: left; }
.ra-mi { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 3px; font-size: 13.5px; font-weight: 400; color: var(--t1); white-space: nowrap; text-decoration: none; }
.ra-mi:first-child { background: var(--s2); }
.ra-mi svg { flex: none; color: var(--t2); }
.ra-mi.pel { color: var(--peligro); }
/* Donde no entran ocho columnas (la vista rápida y el teléfono), un recuadro por renglón, como la E15: «Qué pasó» arriba y los
   demás datos con su nombre, de a dos, con «—» donde no aplica; el ⋮ del renglón, en su esquina. */
.ra-bs { display: flex; flex-direction: column; gap: 8px; }
.ra-rev { margin: 0; font-size: 12.5px; color: var(--t2); }
.ra-g { display: flex; flex-direction: column; gap: 8px; }
.ra-bn { margin: 2px 0 0; font-size: 12.5px; font-weight: 600; color: var(--t2); }
.ra-b { position: relative; padding: 10px 12px 12px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; }
.ra-b .q { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; padding-right: 32px; font-size: 14px; font-weight: 600; color: var(--t1); }
.ra-b .q .b2-i { margin-left: 4px; }
.ra-b > .ra-kw { position: absolute; top: 5px; right: 5px; }
.ra-b dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; margin: 8px 0 0; }
.ra-b dl > div { min-width: 0; }
.ra-b dt { font-size: 12.5px; color: var(--t2); }
.ra-b dd { margin: 0; font-size: 14px; color: var(--t1); overflow-wrap: anywhere; }
.ra-b .nada { color: var(--t3); }
/* Lo que una confirmación dice que va a hacer, en una lectura de dos columnas. */
.ra-lec { display: grid; grid-template-columns: 110px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 3px; font-size: 13.5px; }
.ra-lec > span { padding: 7px 10px; border-top: 1px solid var(--borde); overflow-wrap: anywhere; }
.ra-lec > span:nth-child(-n+2) { border-top: 0; }
.ra-lec .k { background: oklch(0.975 0.006 95); color: var(--t2); }
"""

CSS_MARCO = """
/* F1 · La vista rápida (E15 y E21): el número con su versión, el estado y los íconos en el renglón del título, con el lápiz primero
   (266); debajo, la línea gris de quién y cuándo, «Rechazar» y «Aprobar» mientras espera, y las pestañas «Respuesta» y «Actividad». */
.d2-h .rq-t { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
.d2-h .rq-t b { flex: none; }
.rq-t .w-est { font-size: 12.5px; }
.rq-ic { display: inline-flex; align-items: center; gap: 2px; }
.rq-ic .ib { text-decoration: none; color: var(--t1); }
.rq-sep { align-self: center; width: 1px; height: 20px; margin: 0 4px; background: oklch(0.85 0.03 95); }
.rq-linea { margin: 0; padding: 12px 20px 0; font-size: 13.5px; line-height: 1.4; color: var(--t2); }
.rq-dec { display: flex; align-items: center; gap: 8px; padding: 12px 20px 0; }
.rq-dec .cb { height: 32px; font-size: 13px; }
.rq-apag { position: relative; display: inline-flex; }
.rq-apag .cb { opacity: 0.5; cursor: default; }
.rq-apag .acc-tip { left: 0; }
.rq-av { margin: 12px 20px 0; }
.d2 .rq-tabs { margin: 10px 20px 0; }
/* La pantalla completa: el número con su versión y su estado en la banda, la línea gris debajo y la actividad en su caja. */
.rq-ht { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rq-ht .w-est { font-size: 13px; }
.rq-ver { font-size: 13px; font-weight: 500; letter-spacing: 0; color: var(--t2); }
.w-bnd .ac .rq-bk { width: 36px; height: 36px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; color: var(--t1); }
.w-body.rf-pc { gap: 12px; overflow: visible; }
"""

CSS_TEL_EXTRA = """
/* F1 · En el teléfono, como la E15: el número con su versión en la barra y, debajo, solo la línea gris de quién y cuándo; la
   respuesta en una columna, la actividad en recuadros y el ⋮ de un renglón, que abre su hoja (261). */
.ap-bar .rq-ver { margin-left: 8px; font-size: 13.5px; font-weight: 500; letter-spacing: 0; color: var(--t2); }
.ap .rq-quien { flex-shrink: 0; margin: 0; padding: 0 16px 10px 52px; background: #fff; font-size: 13.5px; line-height: 1.4; color: var(--t2); }
.ap .rf { gap: 12px; padding: 12px 16px 0; }
.ap .rf-z { border-radius: 12px; overflow: hidden; }
.ap .rf-zc { min-height: 48px; padding: 0 2px 0 14px; border-radius: 0; font-size: 15px; }
.ap .rf-zc .res { font-size: 13.5px; }
.ap .rf-zc > button { width: 44px; height: 44px; }
.ap .rf-f { gap: 12px; padding: 12px 14px; }
.ap .rf-et { font-size: 13.5px; }
.ap .rf-v { min-height: 44px; padding: 10px 12px; border-radius: 10px; font-size: 16px; }
.ap .rf-v.ang { width: 180px; }
.ap .rf-v.area { min-height: 88px; }
.ap .rf-v.ar { padding: 10px 12px; }
.ap .rf-ub { gap: 6px 12px; }
.ap .rf-ub .rf-v { flex: 1 1 100%; width: auto; }
.ap .rf-ub .prec, .ap .rf-ub a { font-size: 14px; }
.ap .rf-ub a { min-height: 44px; }
.ap .rf-th { width: 64px; height: 64px; border-radius: 8px; }
.ap .rf-doc .pdf { width: 30px; height: 36px; font-size: 10px; }
.ap .rf-doc .nm { display: inline-flex; align-items: center; min-height: 44px; }
.ap .rf-it { border-radius: 10px; }
.ap .rf-it .bn { padding: 8px 14px; border-radius: 10px 10px 0 0; font-size: 14px; }
.ap .rf-it dl { gap: 10px 14px; padding: 12px 14px; }
.ap .rf-it dt { font-size: 13px; }
.ap .rf-it dd { font-size: 15px; }
.ap .ra-sec { padding: 20px 16px 24px; }
.ap .ra-st { margin: 0 0 10px; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; color: var(--t1); }
.ap .ra-bs, .ap .ra-g { gap: 10px; }
.ap .ra-rev, .ap .ra-bn { font-size: 13.5px; }
.ap .ra-b { padding: 12px 14px 14px; border-radius: 12px; }
.ap .ra-b .q { padding-right: 40px; font-size: 16px; }
.ap .ra-b > .ra-kw { top: 2px; right: 2px; }
.ap .ra-keb { width: 44px; height: 44px; }
.ap .ra-b dl { gap: 10px 14px; margin-top: 10px; }
.ap .ra-b dd { font-size: 15px; }
.ap .ra-hops { display: flex; flex-direction: column; }
.ap .ra-hop { display: flex; align-items: center; gap: 14px; min-height: 56px; border-bottom: 1px solid var(--borde); color: var(--t1); font-size: 16px; text-decoration: none; }
.ap .ra-hop:last-child { border-bottom: 0; }
.ap .ra-hop svg { width: 20px; height: 20px; flex: none; color: var(--t2); }
.ap .ra-lec { grid-template-columns: 96px minmax(0, 1fr); border-radius: 10px; font-size: 15px; }
.ap .ra-lec > span { padding: 10px 12px; }
.ap .rq-tsub { display: flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 500; color: var(--t2); }
.ap .rq-tsub .w-est { font-size: 12.5px; color: var(--t2); }
.ap .tr-nav .pos { white-space: nowrap; }
.ap .rq-txt { margin: 0; font-size: 15px; line-height: 1.5; color: var(--t2); }
.ap .rf-et .b2-i .acc-tip { left: -40px; }
.ap .rf-et .b2-i .acc-tip::after { left: 44px; }
"""

CSS_COMPU = b2.css() + CSS_RESPUESTA + CSS_ACTIVIDAD + CSS_MARCO
CSS_TEL = b2.css(True) + CSS_RESPUESTA + CSS_ACTIVIDAD + CSS_TEL_EXTRA


# ---------------------------------------------------------------------------------------------------------------- la respuesta
def P(nombre, valor="", tipo="texto", **kw):
    """Una pregunta respondida: su nombre, lo respondido y su tipo (ver el docstring del módulo)."""
    return dict(nombre=nombre, valor=valor, tipo=tipo, **kw)


def catalogo(nombre, valor, datos, tipo="una"):
    """La pregunta de un catálogo con cada dato sellado de la opción elegida en su campo gris, «Pregunta · Dato» (266)."""
    return P(nombre, valor, tipo, datos=[P(f"{nombre} · {d}", v, "dato") for d, v in datos])


def C(nombre, clase="", formula=None):
    """Una columna del bloque: `g`, gris (dato del catálogo o cálculo); `r`, a la derecha; `formula`, la (i) del cálculo."""
    return dict(nombre=nombre, clase=clase, formula=formula)


def Z(titulo, preguntas, plegada=None):
    """Una zona del formulario: «Datos», un título de sección o «Fotos y documentos»."""
    return dict(titulo=titulo, preguntas=preguntas, plegada=plegada)


def linea(texto):
    return f'<p class="rf-linea">{texto}</p>'


ANCHO = {"largo": 3, "bloque": 3, "fotos": 3, "documento": 3, "ubicacion": 2}


def _ancho(p, cols):
    return min(ANCHO.get(p["tipo"], 1), cols)


def _empaquetar(preguntas, cols):
    """Los renglones de una zona: en el orden del autor, la que no entra baja de renglón, y una pregunta va en el mismo renglón que
    sus datos del catálogo; si no entran juntos, empiezan otro (E15)."""
    filas, fila, libre = [], [], cols
    for p in preguntas:
        grupo = [p] + p.get("datos", [])
        if sum(_ancho(q, cols) for q in grupo) > libre and fila:
            filas.append(fila)
            fila, libre = [], cols
        for q in grupo:
            w = _ancho(q, cols)
            if w > libre:
                filas.append(fila)
                fila, libre = [], cols
            fila.append((q, w))
            libre -= w
    if fila:
        filas.append(fila)
    return filas


def _ib(tel):
    return "ap-ib" if tel else "ib"


def bloque_tabla(p):
    """El bloque en su tabla (pantalla completa): el número sin encabezado y una columna por pregunta."""
    cols, items = p["columnas"], p.get("items") or []
    if not items:
        return f'<div class="rf-v vac" role="textbox" aria-readonly="true" aria-label="{p["nombre"]}">Sin respuesta</div>'
    plantilla = "40px " + " ".join("minmax(0, 1.4fr)" if k == 0 else "minmax(0, 1fr)" for k in range(len(cols)))
    cab = '<span class="h n" aria-hidden="true"></span>' + "".join(
        f'<span class="h{" r" if "r" in c["clase"] else ""}{" g" if "g" in c["clase"] else ""}" role="columnheader">{c["nombre"]}'
        f'{b2.info(c["formula"]) if c["formula"] else ""}</span>' for c in cols)
    filas = "".join(f'<span class="n">{k}</span>' + "".join(
        f'<span class="{" ".join(x for x in ("r" if "r" in c["clase"] else "", "g" if "g" in c["clase"] else "") if x)}">{v}</span>'
        for c, v in zip(cols, it)) for k, it in enumerate(items, 1))
    filas = filas.replace('<span class="">', "<span>")
    return (f'<div class="rf-bt" role="table" aria-label="{p["nombre"]}" style="grid-template-columns: {plantilla};">'
            f'{cab}{filas}</div>')


def bloque_recuadros(p, tel=False):
    """El bloque en la vista rápida y en el teléfono: un recuadro por ítem, «Ítem 2» en su banda, cada dato con su nombre (E19)."""
    cols, items = p["columnas"], p.get("items") or []
    if not items:
        return f'<div class="rf-v vac" role="textbox" aria-readonly="true" aria-label="{p["nombre"]}">Sin respuesta</div>'
    cajas = []
    for k, it in enumerate(items, 1):
        dl = "".join(f'<div><dt>{c["nombre"]}{b2.info(c["formula"]) if c["formula"] else ""}</dt>'
                     f'<dd class="{"g" if "g" in c["clase"] else ""}">{v}</dd></div>' for c, v in zip(cols, it))
        cajas.append(f'<div class="rf-it" role="group" aria-label="Ítem {k} de {p["nombre"]}"><span class="bn">Ítem {k}</span>'
                     f'<dl>{dl}</dl></div>')
    return f'<div class="rf-its">{"".join(cajas)}</div>'


def control(p, cols=3, tel=False, i_abierta=False, ancho=1):
    """Una pregunta con su etiqueta arriba y lo respondido adentro de su control, sin poder tocarlo (266)."""
    t, n, v = p["tipo"], p["nombre"], p.get("valor")
    texto_i = p.get("formula") if t == "calculo" else p.get("info")
    info = b2.info(texto_i, i_abierta) if texto_i else ""
    et = f'<span class="rf-et">{n}{info}</span>'
    mods = (" ed" if p.get("editable") else "") + (" err" if p.get("error") else "")
    ro = "" if p.get("editable") else ' aria-readonly="true"'
    vacio = v in (None, "", [])

    def caja(clases, adentro, rol="textbox"):
        return f'<div class="rf-v{clases}{mods}" role="{rol}"{ro} aria-label="{n}">{adentro}</div>'

    if t == "texto":
        c = caja("", v or "")
    elif t in ("numero", "fecha"):
        c = caja(" ang num", v or "")
    elif t in ("sino", "una", "varias"):
        c = caja(" pk", f'<span class="tx">{v or ""}</span>{b2.SVG_FLECHA}', "combobox")
    elif t == "largo":
        c = caja(" area", v or "")
    elif t == "calculo":
        c = caja(" gris ang num", v or "")
    elif t == "dato":
        c = caja(" gris", v or "")
    elif t == "ubicacion":
        if vacio:
            c = caja(" ang", "")
        else:
            mapa = "https://www.google.com/maps?q=" + v.replace(" ", "")
            c = (f'<div class="rf-ub">{caja(" num", v)}<span class="prec">± {p.get("precision", 15)} m</span>'
                 f'<a href="{mapa}" target="_blank" rel="noopener noreferrer">Ver en el mapa {SVG_MAPA}</a></div>')
    elif t == "fotos":
        if vacio:
            c = caja("", "")
        else:
            hay = "".join(f'<button type="button" class="rf-th{" b" if k % 2 else ""}" aria-label="Ver {f}"></button>'
                          for k, f in enumerate(v))
            c = f'<div class="rf-v ar" aria-readonly="true" aria-label="{n}"><span class="rf-ths">{hay}</span></div>'
    elif t == "documento":
        if vacio:
            c = caja("", "")
        else:
            nombre, peso = v
            c = (f'<div class="rf-v ar" aria-readonly="true" aria-label="{n}"><span class="rf-docs"><span class="rf-doc"><span class="pdf">PDF</span>'
                 f'<a class="nm" href="#" download="{nombre}">{nombre}</a><span class="kb">{peso}</span></span></span></div>')
    elif t == "bloque":
        c = bloque_tabla(p) if cols == 3 and not tel else bloque_recuadros(p, tel)
    else:
        raise ValueError(t)
    extra = (f'<span class="rf-antes">Antes: {p["antes"]}</span>' if p.get("antes") else "")
    extra += (f'<span class="rf-error" role="alert">{p["error"]}</span>' if p.get("error") else "")
    return f'<div class="rf-q s{ancho}">{et}{c}{extra}</div>'


def respuesta(zonas, cols=3, tel=False, i_abierta=None):
    """La respuesta como el formulario: una zona por título, con su banda y sus renglones de `cols` columnas. Una zona sin nada que
    mostrar no se ve (E19)."""
    partes = []
    for z in zonas:
        filas = _empaquetar(z["preguntas"], cols)
        if not filas:
            continue
        abierta = not z.get("plegada")
        res = f'<span class="res">{z["plegada"]}</span>' if z.get("plegada") else ""
        boton = (f'<button type="button" class="{_ib(tel)}" aria-expanded="{"true" if abierta else "false"}" '
                 f'aria-label="{"Plegar" if abierta else "Desplegar"} {z["titulo"]}">{SVG_CHEV}</button>')
        cuerpo = "" if not abierta else "".join(
            f'<div class="rf-f c{cols}">' + "".join(control(q, cols, tel, q["nombre"] == i_abierta, w) for q, w in fila) + "</div>"
            for fila in filas)
        partes.append(f'<section class="rf-z{"" if abierta else " pl"}" aria-label="{z["titulo"]}"><div class="rf-zc">'
                      f'<span class="t">{z["titulo"]}</span>{res}{boton}</div>{cuerpo}</section>')
    return f'<div class="rf">{"".join(partes)}</div>'


# ---------------------------------------------------------------------------------------------------------------- la actividad
def E(clase, texto, info=None):
    """El estado de un renglón: el punto y la palabra (`ok`, `pend`, `aten`, `mal` o vacía, gris), con su (i) si hace falta."""
    return (clase, texto, info)


def R(fecha, hora, que, quien=None, canal=None, detalle=None, estado=None, menu=(), que_i=None, abierto=False, tip=False):
    """Un renglón de la actividad (267). `detalle` puede ser una lista: cada parte, un renglón de la celda."""
    if isinstance(detalle, (list, tuple)):
        detalle = "<br>".join(detalle)
    return dict(fecha=fecha, hora=hora, que=que, quien=quien, canal=canal, detalle=detalle, estado=estado, menu=list(menu),
                que_i=que_i, abierto=abierto, tip=tip)


def B(titulo, filas):
    """Una banda por momento: «Al recibirla», «Aprobación», «Al aprobarla» o «Al rechazarla»."""
    return dict(titulo=titulo, filas=filas)


def _nada():
    return f'<span class="nada">{NADA}</span>'


def _estado(r, tip_clase=""):
    clase, texto, info = r["estado"]
    return b2.est(clase, texto, info, r["tip"], tip_clase)


def _que(r):
    return f'<span class="ra-que">{r["que"]}{b2.info(r["que_i"]) if r["que_i"] else ""}</span>'


def menu_fila(opciones):
    """El ⋮ de un renglón, abierto: cada opción con su ícono; lo que destruye, al final y en rojo (209)."""
    items = "".join(f'<a class="ra-mi{" " + clase if clase else ""}" role="menuitem" href="{href or "#"}">{ic}<span>{tx}</span></a>'
                    for ic, tx, clase, href in opciones)
    return f'<div class="ra-menu" role="menu">{items}</div>'


def _keb(r, tel=False):
    if not r["menu"]:
        return ""
    sobre = r["que"] + (f" · {r['quien']}" if r["quien"] else "")
    exp = "true" if r["abierto"] else "false"
    boton = (f'<button type="button" class="{_ib(tel)} ra-keb" aria-label="Acciones de {sobre}" aria-haspopup="menu" '
             f'aria-expanded="{exp}">{SVG_KEB}</button>')
    return f'<span class="ra-kw">{boton}{menu_fila(r["menu"]) if r["abierto"] and not tel else ""}</span>'


COLUMNAS = ["Fecha", "Hora", "Qué pasó", "Quién", "Canal", "Detalle", "Estado", "Acciones"]
ANCHOS = ["88px", "52px", "180px", "150px", "76px", None, "130px", "72px"]


def _fila_tabla(r):
    celdas = [r["fecha"], r["hora"], _que(r), r["quien"] or _nada(), r["canal"] or _nada(),
              r["detalle"] or _nada(), _estado(r, "b2-tip-der") if r["estado"] else _nada()]
    return ("<tr>" + "".join(f"<td>{c}</td>" for c in celdas) + f'<td class="acc">{_keb(r)}</td></tr>')


def actividad_tabla(bandas, rev=None):
    """La actividad en ocho columnas, en su caja «Actividad», abierta y sin plegar (163), para la pantalla completa."""
    cg = "<colgroup>" + "".join(f'<col style="width: {a};">' if a else "<col>" for a in ANCHOS) + "</colgroup>"
    cab = "<thead><tr>" + "".join(f'<th scope="col" class="{"acc" if c == "Acciones" else ""}">{c}</th>' for c in COLUMNAS) + "</tr></thead>"
    cuerpo = "".join(f'<tbody><tr class="bd"><th colspan="8" scope="rowgroup">{b["titulo"]}</th></tr>'
                     + "".join(_fila_tabla(r) for r in b["filas"]) + "</tbody>" for b in bandas)
    meta = f'<span class="meta">{rev}</span>' if rev else ""
    return (f'<section class="ra-caja" aria-label="Actividad"><div class="ra-cab"><span>Actividad</span>{meta}</div>'
            f'<table class="ra-t">{cg}{cab}{cuerpo}</table></section>')


def _recuadro(r, tel=False):
    """Un renglón como recuadro, como la E15: «Qué pasó» arriba, el ⋮ en su esquina y los seis datos con su nombre, de a dos, con
    «—» donde no aplica."""
    campos = [("Fecha", r["fecha"]), ("Hora", r["hora"]), ("Quién", r["quien"] or _nada()), ("Canal", r["canal"] or _nada()),
              ("Detalle", r["detalle"] or _nada()), ("Estado", _estado(r) if r["estado"] else _nada())]
    dl = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in campos)
    return (f'<div class="ra-b" role="group" aria-label="{r["que"]}"><span class="q">{r["que"]}'
            f'{b2.info(r["que_i"]) if r["que_i"] else ""}</span>{_keb(r, tel)}<dl>{dl}</dl></div>')


def actividad_recuadros(bandas, rev=None, desde=0, tel=False):
    """La actividad en la vista rápida y en el teléfono: un recuadro por renglón, con «Qué pasó» arriba y los demás datos con su
    nombre, de a dos; lo que no aplica no va. `desde` dibuja desde esa banda, como si estuviera desplazada."""
    partes = [f'<p class="ra-rev">{rev}</p>'] if rev and desde == 0 else []
    for b in bandas[desde:]:
        partes.append(f'<section class="ra-g" aria-label="{b["titulo"]}"><h3 class="ra-bn">{b["titulo"]}</h3>'
                      + "".join(_recuadro(r, tel) for r in b["filas"]) + "</section>")
    return f'<div class="ra-bs">{"".join(partes)}</div>'


def actividad_tel(bandas, rev=None, desde=0):
    return (f'<section class="ra-sec" aria-label="Actividad"><h2 class="ra-st">Actividad</h2>'
            f'{actividad_recuadros(bandas, rev, desde, tel=True)}</section>')


def hoja_menu(titulo, opciones):
    """El ⋮ de un renglón en el teléfono: una hoja con sus opciones (261)."""
    ops = "".join(f'<a class="ra-hop{" " + clase if clase else ""}" role="menuitem" href="{href or "#"}">{ic}<span>{tx}</span></a>'
                  for ic, tx, clase, href in opciones)
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="{titulo}"><span class="asa"></span>'
            f'<div class="hc"><div><h2>{titulo}</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{b2.SVG_X}</button></div>'
            f'<div class="hb"><div class="ra-hops" role="menu" aria-label="{titulo}">{ops}</div></div><div class="hp"></div></div>')


def _lectura(filas):
    return '<div class="ra-lec">' + "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in filas) + "</div>"


def dialogo_confirmar(titulo, texto, filas, boton):
    """Una confirmación que no se deshace (161): la frase, lo que va a hacer en una lectura y el foco en «Cancelar»."""
    return (f'<div class="w-oscuro" style="z-index: 8;"><div class="w-dlg dec" role="alertdialog" aria-modal="true" aria-label="{titulo}">'
            f'<div class="dc"><span>{titulo}</span><button type="button" class="ib" aria-label="Cerrar">{SVG_CERRAR}</button></div>'
            f'<div class="db una"><p class="d-tx">{texto}</p>{_lectura(filas)}</div><div class="df">'
            f'<button type="button" class="cb cb-sec foco">Cancelar</button><button type="button" class="cb cb-pri">{boton}</button></div></div></div>')


def hoja_confirmar(titulo, texto, filas, boton):
    return (f'<div class="ap-velo"></div><div class="ap-hoja dec" role="alertdialog" aria-label="{titulo}"><span class="asa"></span>'
            f'<div class="hc"><div><h2>{titulo}</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{b2.SVG_X}</button></div>'
            f'<div class="hb"><p class="rq-txt">{texto}</p>{_lectura(filas)}</div><div class="hp">'
            f'<button type="button" class="cb cb-pri lleno">{boton}</button><button type="button" class="cb cb-sec foco">Cancelar</button></div></div>')


def toast(texto):
    return (f'<div class="f-toast" role="status"><span class="ok">{SVG_OK}</span><span>{texto}</span>'
            f'<button type="button" class="ib" aria-label="Cerrar">{SVG_CERRAR}</button></div>')


def toast_tel(texto):
    return f'<div class="t-toast" role="status"><span class="ok">{SVG_OK}</span><span>{texto}</span></div>'


# ---------------------------------------------------------------------------------------------------------------- el marco
def _est(estado):
    if not estado:
        return ""
    clase, texto = estado
    return f'<span class="w-est{" " + clase if clase else ""}">{texto}</span>'


def decision(apagada=None, tip_abierto=True):
    """«Rechazar» y «Aprobar», arriba de las pestañas mientras espera (266); apagados, con el motivo en su tooltip (211)."""
    if apagada:
        tip = b2.tip(apagada) if tip_abierto else ""
        return (f'<div class="rq-dec"><span class="rq-apag"><button type="button" class="cb cb-sec" aria-disabled="true">Rechazar</button></span>'
                f'<span class="rq-apag"><button type="button" class="cb cb-pri" aria-disabled="true">Aprobar</button>{tip}</span></div>')
    return ('<div class="rq-dec"><button type="button" class="cb cb-sec">Rechazar</button>'
            '<button type="button" class="cb cb-pri">Aprobar</button></div>')


def aviso(texto):
    return f'<div class="acc-av aten rq-av" role="status">{b2.SVG_ATEN}<span>{texto}</span></div>'


def vista_rapida(numero, cuerpo, *, linea_gris, pestana="Respuesta", estado=None, version=None, lapiz=False, completa=None,
                 conversacion=None, bajar=False, keb=False, anterior=True, siguiente=True, arriba="", pie="1 de 10"):
    """La vista rápida, al costado de la planilla (E15): en el renglón del título, el número, el estado y los íconos (el lápiz
    primero, 266), ↑ ↓ y ✕; la versión con que se cargó («Versión 3»), como en la banda de la pantalla completa; debajo, la línea
    gris, `arriba` (un aviso o la decisión) y las pestañas «Respuesta» y «Actividad»."""
    ic = []
    if lapiz:
        ic.append(f'<a class="ib" href="FRM-Respuesta-Corregir.dc.html" aria-label="Corregir" title="Corregir">{SVG_LAPIZ}</a>')
    if completa:
        ic.append(f'<a class="ib" href="{completa}" aria-label="Abrir en pantalla completa" title="Abrir en pantalla completa">{SVG_COMPLETA}</a>')
    if conversacion:
        ic.append(f'<a class="ib" href="{conversacion}" aria-label="Abrir conversación" title="Abrir conversación">{SVG_CONVERSACION}</a>')
    if bajar:
        ic.append(f'<button type="button" class="ib" aria-label="Bajar PDF" title="Bajar PDF">{SVG_BAJAR}</button>')
    if keb:
        ic.append(f'<button type="button" class="ib" aria-label="Más acciones" title="Más acciones" aria-haspopup="menu" '
                  f'aria-expanded="false">{SVG_KEB}</button>')
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)"{"" if anterior else " disabled"}>{SVG_ARRIBA}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)"{"" if siguiente else " disabled"}>{SVG_ABAJO}</button>'
           f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{SVG_CERRAR}</button>')
    ver = f'<span class="rq-ver">{version}</span>' if version else ""
    tabs = ('<div class="o-tabs rq-tabs" role="tablist">' + "".join(
        f'<span role="tab" aria-selected="{"true" if t == pestana else "false"}" class="{"on" if t == pestana else ""}">{t}</span>'
        for t in ("Respuesta", "Actividad")) + "</div>")
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {numero}"><div class="d2-h"><span class="rq-t"><b>{numero}</b>{ver}{_est(estado)}</span>'
            f'<span class="rq-ic">{"".join(ic)}</span><span class="rq-sep" aria-hidden="true"></span>{nav}</div>'
            f'<p class="rq-linea">{linea_gris}</p>{arriba}{tabs}<div class="d2-b" role="tabpanel" aria-label="{pestana}">{cuerpo}</div>'
            f'<div class="d2-pie">{pie}</div></aside>')


def acciones_banda(corregir=False, decidir=False, conversacion=None, bajar=False, keb=False):
    """Lo de la banda de la pantalla completa, en el orden de la 209: la tarea, con la principal al final; ir y bajar; el ⋮."""
    a = []
    if corregir:
        a.append('<a class="cb cb-sec" href="FRM-Respuesta-Corregir.dc.html">Corregir</a>')
    if decidir:
        a += ['<button type="button" class="cb cb-sec">Rechazar</button>', '<button type="button" class="cb cb-pri">Aprobar</button>']
    if conversacion:
        a.append(f'<a class="cb cb-sec" href="{conversacion}">Abrir conversación</a>')
    if bajar:
        a.append(f'<button type="button" class="cb cb-sec">{SVG_BAJAR} Bajar PDF</button>')
    if keb:
        a.append(f'<button type="button" class="ib rq-bk" aria-label="Más acciones" title="Más acciones" aria-haspopup="menu" '
                 f'aria-expanded="false">{SVG_KEB}</button>')
    return "".join(a)


def banda_completa(numero, *, linea_gris, version, estado=None, acciones="", pos="1 de 10", anterior=False, siguiente=True,
                   volver="#"):
    """La banda de la pantalla completa: el número, el estado y «Versión 4»; debajo, la línea gris; a la derecha, sus acciones,
    dónde va y ↑ ↓ (E15 y 266)."""
    nav = (f'<span class="rc-pos">{pos}</span>'
           f'<button type="button" class="nv" aria-label="Respuesta anterior"{"" if anterior else " disabled"}>{SVG_ARRIBA}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente"{"" if siguiente else " disabled"}>{SVG_ABAJO}</button>')
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="{volver}" aria-label="Volver a las respuestas">{SVG_VOLVER}</a>'
            f'<div><div class="rq-ht"><h1>{numero}</h1><span class="rq-ver">{version}</span>{_est(estado)}</div>'
            f'<p class="res">{linea_gris}</p></div></div><div class="ac">{acciones}{nav}</div></div>')


def cuerpo_completa(resp, act, arriba=""):
    """Las zonas a todo el ancho y, debajo, «Actividad», abierta (E15)."""
    return f'<div class="w-body rf-pc">{arriba}{resp}{act}</div>'


def fijo_tel(apagada=None):
    """«Rechazar» y «Aprobar» fijos abajo en el teléfono; apagados, con el motivo en su tooltip (211)."""
    if apagada:
        return (f'<div class="ap-fijo"><span class="acc-apagado"><button type="button" class="cb cb-sec full" aria-disabled="true">Rechazar</button></span>'
                f'<span class="acc-apagado"><button type="button" class="cb cb-pri full" aria-disabled="true">Aprobar</button>{b2.tip(apagada)}</span></div>')
    return ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Rechazar</button>'
            '<button type="button" class="cb cb-pri full">Aprobar</button></div>')


def pagina_tel(numero, cuerpo, *, version, linea_gris, estado=None, pos="1 de 10", anterior=False, siguiente=True, conversacion=None,
               lapiz=False, keb=False, fijo="", volver="#", desplazar=0):
    """La pantalla de una respuesta en el teléfono, como la E15: en la barra, el número con su versión, el estado (si pide aprobación)
    y los íconos (el lápiz primero, «Abrir conversación» y el ⋮), que dejan lugar en el renglón de ↑ ↓ para «1 de 2 por aprobar»
    desde 320 px; debajo, solo la línea gris de quién y cuándo; la respuesta en una columna con su actividad debajo, todo a la vista
    (163). `desplazar` (px) la dibuja desplazada hacia abajo."""
    if desplazar:
        cuerpo = f'<div class="rq-desp" style="margin-top: -{desplazar}px;">{cuerpo}</div>'
    acc = ""
    if lapiz:
        acc += f'<a class="ap-ib" href="M-FRM-Respuesta-Corregir.dc.html" aria-label="Corregir">{SVG_LAPIZ}</a>'
    if conversacion:
        acc += f'<a class="ap-ib" href="{conversacion}" aria-label="Abrir conversación">{SVG_CONVERSACION}</a>'
    if keb:
        acc += f'<button type="button" class="ap-ib" aria-label="Más acciones">{SVG_KEB}</button>'
    sub = f'<span class="rq-tsub">{_est(estado)}</span>' if estado else ""
    return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{volver}">{SVG_VOLVER}</a><div class="tit">'
            f'<h1>{numero}<span class="rq-ver">{version}</span></h1>{sub}</div>{acc}</div><p class="rq-quien">{linea_gris}</p>'
            f'<div class="tr-nav"><span class="pos">{pos}</span>'
            f'<button type="button" class="ap-ib" aria-label="Respuesta anterior"{"" if anterior else " disabled"}>{SVG_ARRIBA}</button>'
            f'<button type="button" class="ap-ib" aria-label="Respuesta siguiente"{"" if siguiente else " disabled"}>{SVG_ABAJO}</button></div>'
            f'<div class="tr-scroll">{cuerpo}</div>{fijo}')


# ---------------------------------------------------------------------------------------------------------------- los tableros
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    return s.replace("\r\n", "\n"), nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def fin_sc_if(t, i):
    prof = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        prof += 1 if m.group(0) == "<sc-if" else -1
        if prof == 0:
            return i + m.end()
    raise AssertionError("sc-if sin cerrar")


def _seguidos(t, i):
    """Los `sc-if` seguidos desde `i`: ([(variable, contenido)], fin)."""
    out, pos = [], i
    while True:
        m = re.compile(r'\s*<sc-if value="\{\{(\w+)\}\}"[^>]*>').match(t, pos)
        if not m:
            return out, pos
        ini = m.start() + len(m.group(0)) - len(m.group(0).lstrip())
        fin = fin_sc_if(t, ini)
        out.append((m.group(1), t[m.end():fin - len("</sc-if>")]))
        pos = fin


def _nombres_viejos(t):
    m = re.search(r"const k = (\[.*?\])\.indexOf\(", t)
    return json.loads(m.group(1))


def viejos_compu(t):
    """Los `sc-if` de un tablero de la compu, por nombre de estado: banda, cuerpo, panel y capas (lo de después del panel)."""
    i = t.index("</header>") + len("</header>")
    bloques, j = _seguidos(t, i)
    nombres = _nombres_viejos(t)
    v = {"banda": {}, "cuerpo": {}, "aside": {}, "capa": {}}
    for var, c in bloques:
        e = nombres[int(var[1:])]
        s = c.lstrip()
        if s.startswith('<div class="w-bnd"'):
            v["banda"][e] = c
        elif s.startswith('<div class="w-body"'):
            v["cuerpo"][e] = c
        elif s.startswith("<aside"):
            k = c.index("</aside>") + len("</aside>")
            v["aside"][e], resto = c[:k], c[k:]
            if resto.strip():
                v["capa"][e] = resto
        elif s:
            v["capa"][e] = v["capa"].get(e, "") + c
    return i, j, v


RAYA = '<span class="ap-raya"></span>'


def viejos_tel(t):
    """Los `sc-if` de un tablero del teléfono, por nombre de estado: el cuerpo (antes de la raya) y las capas (después)."""
    i = t.index('<div class="ap-est">')
    i = b2.fin_div(t, i)
    bloques, j = _seguidos(t, i)
    k = t.index(RAYA, j)
    capas, l = _seguidos(t, k + len(RAYA))
    nombres = _nombres_viejos(t)
    v = {"cuerpo": {nombres[int(a[1:])]: c for a, c in bloques}, "capa": {nombres[int(a[1:])]: c for a, c in capas}}
    return i, j, k, l, v


def _sc(k, html):
    return f'<sc-if value="{{{{s{k}}}}}" hint-placeholder-val="{{{{{"si" if k == 0 else "no"}}}}}">{html}</sc-if>'


def con_titulo(t):
    m = re.search(r"<title>(.*?)</title>", t)
    assert not m.group(1).endswith(SUFIJO), m.group(1)
    return t[:m.start(1)] + m.group(1) + SUFIJO + t[m.end(1):]


def con_css(t, css):
    assert MARCA not in t
    return t.replace("</helmet>", f"{MARCA}\n{css}</style>\n</helmet>", 1)


def con_script(t, nombres, ancho, alto, vals=None):
    """El Tweak «estado» con los estados nuevos y `renderVals` con cada `sN` y los valores por estado (`miga`, `yo`…)."""
    props = {"estado": {"editor": "enum", "options": nombres, "default": nombres[0], "section": "Estado"},
             "$preview": {"width": ancho, "height": alto}}
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    lineas = [f"      s{k}: k === {k}," for k in range(len(nombres))]
    for var, valores in (vals or {}).items():
        assert len(valores) == len(nombres), var
        lineas.append(f"      {var}: {json.dumps(valores, ensure_ascii=False)}[k],")
    js = ("<script type=\"text/x-dc\" data-dc-script data-props='" + texto + "'>\n"
          "class Component extends DCLogic {\n  renderVals() {\n"
          f"    const e = this.props.estado ?? {json.dumps(nombres[0], ensure_ascii=False)};\n"
          f"    const k = {json.dumps(nombres, ensure_ascii=False)}.indexOf(e);\n"
          "    return {\n      si: true, no: false,\n" + "\n".join(lineas) + "\n    };\n  }\n}\n</script>")
    m = re.search(r'<script type="text/x-dc" data-dc-script.*?</script>', t, re.S)
    return t[:m.start()] + js + t[m.end():]


def rehacer_compu(nombre, estados, alto, vals=None, css=CSS_COMPU):
    """Cambia los estados de un tablero de la compu y conserva su marco (el menú, el panel y la barra de arriba). `estados`:
    [(nombre, dict(banda=, cuerpo=, aside=, capa=))]; `vals`: {variable: [valor por estado]}."""
    t, nl = leer(nombre)
    assert MARCA not in t, f"{nombre} ya tiene el bloque {GRUPO}: restauralo antes de volver a correr"
    i, j, _ = viejos_compu(t)
    partes = []
    for clave in ("banda", "cuerpo", "aside", "capa"):
        partes += [_sc(k, p[clave]) for k, (_, p) in enumerate(estados) if p.get(clave)]
    t = t[:i] + "".join(partes) + t[j:]
    t = con_css(con_titulo(t), css + f"/* F1 · El tablero crece para leer la pantalla completa entera. */\n.w-app {{ height: {alto}px !important; }}\n")
    t = con_script(t, [n for n, _ in estados], 1440, alto, vals)
    escribir(nombre, t, nl)


def rehacer_tel(nombre, estados, vals=None, css=CSS_TEL):
    """Cambia los estados de un tablero del teléfono: `dict(cuerpo=, capa=)`; las capas (hojas y avisos) van después de la raya."""
    t, nl = leer(nombre)
    assert MARCA not in t, f"{nombre} ya tiene el bloque {GRUPO}: restauralo antes de volver a correr"
    i, j, k, l, _ = viejos_tel(t)
    cuerpos = "".join(_sc(n, p["cuerpo"]) for n, (_, p) in enumerate(estados))
    capas = "".join(_sc(n, p["capa"]) for n, (_, p) in enumerate(estados) if p.get("capa"))
    t = t[:i] + cuerpos + t[j:k] + RAYA + capas + t[l:]
    t = con_css(con_titulo(t), css)
    t = con_script(t, [n for n, _ in estados], 390, 844, vals)
    escribir(nombre, t, nl)


def seleccionar(cuerpo, numero):
    """La planilla de atrás con la fila de `numero` elegida."""
    c = cuerpo.replace('<div class="w-tr pl sel">', '<div class="w-tr pl">')
    k = c.index(f">{numero}</a>")
    i = c.rindex('<div class="w-tr pl">', 0, k)
    return c[:i] + '<div class="w-tr pl sel">' + c[i + len('<div class="w-tr pl">'):]


def por_resolver(cuerpo, numero, cuenta=3):
    """«Por resolver» en la columna «Reglas» de la fila de `numero` (228), y la cuenta de su vista."""
    k = cuerpo.index(f">{numero}</a>")
    i = cuerpo.rindex('<div class="w-tr pl', 0, k)
    j = b2.fin_div(cuerpo, i)
    fila = cuerpo[i:j]
    viejo = '<span><span class="pl-g">—</span></span>'
    assert viejo in fila, numero
    fila = fila.replace(viejo, '<span><span class="w-est pend">Por resolver</span></span>', 1)
    c = cuerpo[:i] + fila + cuerpo[j:]
    return re.sub(r"Por resolver \(\d+\)", f"Por resolver ({cuenta})", c)


# ---------------------------------------------------------------------------------------------------------------- los datos
# «Pedido de materiales»: «Monto» aparece si «¿Se concretó la venta?» es Sí, e «Importe» y «Total» son cálculos (E19).
F_IMPORTE = "Cantidad × Producto · Precio."
F_TOTAL = "Suma de Productos · Importe + Monto."
PRODUCTOS = [C("Producto"), C("Producto · Precio", "g r"), C("Cantidad", "r"), C("Importe", "g r", F_IMPORTE)]


def pedido(cliente, concreto, motivo, monto, entrega, items, total, obs, v4=None):
    datos = [P("Cliente", cliente), P("¿Se concretó la venta?", concreto, "sino"), P("Motivo", motivo, "una")]
    if concreto == "Sí":
        datos.append(P("Monto", monto, "numero"))
    entregas = [P("Fecha de entrega", entrega, "fecha")]
    if v4:
        entregas = [P("Zona", v4["zona"], "una"), P("Fecha de entrega", entrega, "fecha"),
                    catalogo("Proveedor", v4["proveedor"], [("CUIT", v4["cuit"])]),
                    P("Lugar de entrega", v4["lugar"], "ubicacion", precision=v4["precision"])]
    if items is not None:
        entregas += [P("Productos", "", "bloque", columnas=PRODUCTOS, items=items), P("Total", total, "calculo", formula=F_TOTAL)]
    entregas.append(P("Observaciones", obs, "largo"))
    zonas = [Z("Datos", datos), Z("Entrega", entregas)]
    if v4:
        zonas.append(Z("Fotos y documentos", [P("Foto del remito", v4["fotos"], "fotos")]))
    return zonas


PED45 = pedido("Corralón El Puente", "Sí", "Venta nueva", "48.000,00", "20/10/2026",
               [["Caño de 1/2 pulgada", "$ 4.200,00", "10", "$ 42.000,00"], ["Codo de 90°", "$ 850,00", "40", "$ 34.000,00"],
                ["Cinta de teflón", "$ 950,00", "20", "$ 19.000,00"]], "$ 143.000,00", "Pidieron entrega el lunes.")
PED44 = pedido("Obra Centro", "No", "Seguimiento", None, "22/10/2026",
               [["Caño de 1/2 pulgada", "$ 4.200,00", "6", "$ 25.200,00"], ["Codo de 90°", "$ 850,00", "12", "$ 10.200,00"]], "",
               "Falta confirmar el flete.")
PED39 = pedido("Corralón El Puente", "Sí", "Venta nueva", "96.300,00", "18/10/2026", None, None, "Entrega parcial.")
PED46 = pedido("Ferretería Sur", "Sí", "Venta nueva", "30.000,00", "22/10/2026",
               [["Caño de 1/2 pulgada", "$ 4.200,00", "5", "$ 21.000,00"], ["Codo de 90°", "$ 850,00", "20", "$ 17.000,00"]],
               "$ 68.000,00", "Retira el cliente.",
               v4=dict(zona="Centro", proveedor="Aceros Rosario", cuit="30-70988123-4", lugar="-34.603722, -58.381592", precision=15,
                       fotos=["IMG_2231.jpg", "IMG_2232.jpg"]))


def visita(cliente, fecha, ubicacion, precision, concreto, monto, motivo, fallas, obs, fotos, remito):
    """«Visita a cliente», versión 4, como la E15 y la E18 (`e15_respuesta_1004.py` y `e18_respuesta_1004.py`): «Datos», con
    «Ubicación de la visita» de la E20 (que va en «Datos», como al cargar); «Resultado de la visita», el título del autor, y al final
    «Fotos y documentos»."""
    return [
        Z("Datos", [P("Cliente", cliente), P("Fecha de la visita", fecha, "fecha"),
                    P("Ubicación de la visita", ubicacion, "ubicacion", precision=precision)]),
        Z("Resultado de la visita", [P("¿Se concretó la venta?", concreto, "sino"), P("Monto estimado", monto, "numero"),
                                     P("Motivo", motivo, "una"), P("Fallas", fallas, "varias"), P("Observaciones", obs, "largo")]),
        Z("Fotos y documentos", [P("Fotos de la visita", fotos, "fotos"), P("Remito firmado", remito, "documento")]),
    ]


def visita_v3(cliente, fecha, concreto, monto, motivo, obs):
    """La versión 3, como la E15: todavía sin el título, «Fallas», la ubicación ni los archivos; todo va en «Datos»."""
    return [Z("Datos", [P("Cliente", cliente), P("Fecha de la visita", fecha, "fecha"), P("¿Se concretó la venta?", concreto, "sino"),
                        P("Monto estimado", monto, "numero"), P("Motivo", motivo, "una"), P("Observaciones", obs, "largo")])]


# Los valores de la E15 y la E18 para las mismas respuestas (269); la ubicación, de la E20.
VIS130 = visita("Corralón El Puente", "15/10/2026", "-34.620514, -58.442718", 12, "No", "", "Seguimiento", "Frío",
                "Pidieron presupuesto para la ampliación.", ["acopio.jpg", "frente-obra.jpg"], ("remito-0815.pdf", "1,1 MB"))
VIS126 = visita("Ferretería Rosales", "13/10/2026", "-34.583190, -58.420411", 8, "Sí", "125.500,00", "Venta nueva", "Frío, Ruido",
                "Cerramos el pedido de octubre.", ["frente-local.jpg", "gondola.jpg"], ("remito-0810.pdf", "1,2 MB"))
VIS131 = visita("Distribuidora Norte", "15/10/2026", "-34.637420, -58.401131", 18, "Sí", "64.000,00", "Venta nueva",
                "Ruido en el compresor, Pérdida de gas en la unidad exterior, Puerta que no cierra bien", "", ["deposito.jpg"], "")
VIS123 = visita_v3("Ferretería Rosales", "13/10/2026", "No", "0,00", "Seguimiento", "")
VIS118 = visita("Obra Centro", "11/10/2026", "-34.603722, -58.381592", 15, "No", "", "Reclamo", "Pérdida de agua en la unidad interior",
                "El equipo gotea sobre el tablero eléctrico.", ["equipo.jpg", "tablero.jpg"], "")
VIS117 = visita("Ferretería Sur", "11/10/2026", "", None, "Sí", "18.400,00", "Venta nueva", "Frío", "", [], "")

# La actividad (267). «Hecho», «Leído», «Entregado»: el punto y la palabra.
HECHO, LEIDO, ENTREGADO = E("ok", "Hecho"), E("ok", "Leído"), E("ok", "Entregado")
APROBADA, RECHAZADA, POR_APROBAR = E("ok", "Aprobada"), E("mal", "Rechazada"), E("aten", "Por aprobar")
WA, APP, CORREO = "WhatsApp", "App", "Correo"
PIDE_UB = "Para completar «Visita a cliente», mandanos tu ubicación."
NO_SE_PUDO_I = ("Le manda el aviso solo a esta persona; a las demás no se les repite. Antes, revisá que tenga el WhatsApp vinculado "
                "en su perfil y que haya escrito en las últimas 24 horas.")
SIN_CONF_WA = "No sabemos si le llegó: WhatsApp no confirmó el envío. No se repite solo; revisalo en la bandeja."
SIN_CONF_WA_REV = "No sabemos si le llegó: WhatsApp no confirmó el envío. Revisarlo no lo reenvía ni dice que llegó."
SIN_CONF_CORREO = "No sabemos si le llegó: el servidor de correo cortó la conexión antes de confirmarlo. No se repite solo."
REVISION_I = "Revisar no lo reenvía ni dice que llegó."
ROL_SIN_I = "Pide la aprobación otra vez. Antes, sumá al rol a alguien que pueda decidirla: quien la cargó no cuenta."
CORREO_DIR = "administracion@delta.ejemplo.com"
CON_PDF = f"{CORREO_DIR}, con el PDF"
LO_REVISO = "Lo revisó Ana Gómez el 13/10/2026, 16:40."
REINTENTAR_TXT = "Puede que ya le haya llegado. ¿Mandarlo otra vez?"
BOTON_REINTENTAR = "Mandar otra vez"
LECTURA_CORREO = [("Para", CORREO_DIR), ("Asunto", "Visita a cliente · VIS-000126"), ("Adjunto", "Comprobante-VIS-000126.pdf")]


def recibida_wa(numero, d, mando, pidio, llego, respondio, quien, ubicacion=True, mensaje=True):
    """«Al recibirla» de una respuesta por WhatsApp: se la mandó, el pedido de ubicación (E20), la respondió y el mensaje de la regla."""
    f = [R(d, mando, "La mandó", "Lucía Fernández", WA, None, HECHO), R(d, pidio, "Se pidió la ubicación", None, WA, PIDE_UB, HECHO)]
    f.append(R(d, llego, "Llegó la ubicación", quien, WA, None, HECHO) if ubicacion else
             R(d, llego, "Siguió sin la ubicación", quien, WA, None, HECHO))
    f.append(R(d, respondio, "La respondió", quien, WA, None, HECHO))
    if mensaje:
        f.append(R(d, respondio, "Aviso a quien la cargó", quien, WA,
                   f"«Recibimos {numero}. Te avisamos cuando la aprueben.»", LEIDO))
    return f


ACT130 = [B("Al recibirla", recibida_wa("VIS-000130", "15/10/2026", "09:10", "09:10", "16:12", "16:20", "Paula Méndez")),
          B("Aprobación", [R("15/10/2026", "16:20", "Se pidió aprobación", None, None, "Rol Supervisor", POR_APROBAR)])]
ACT123 = [B("Al recibirla", [R("13/10/2026", "09:40", "La mandó", "Lucía Fernández", WA, None, HECHO),
                             R("13/10/2026", "11:04", "La respondió", "Tomás Acosta", WA, None, HECHO),
                             R("13/10/2026", "11:04", "Aviso a quien la cargó", "Tomás Acosta", WA,
                               "«Recibimos VIS-000123. Te avisamos cuando la aprueben.»", ENTREGADO)]),
          B("Aprobación", [R("13/10/2026", "11:04", "Se pidió aprobación", None, None, "Rol Supervisor", POR_APROBAR)])]


def act125(motivo):
    m = motivo or "Sin motivo"
    aviso_txt = f"«Rechazaron VIS-000125: {motivo}»" if motivo else "«Rechazaron VIS-000125.»"
    rec = [R("13/10/2026", "14:02", "Se pidió la ubicación", None, WA, PIDE_UB, HECHO),
           R("13/10/2026", "14:03", "Siguió sin la ubicación", "Persona sin información", WA, None, HECHO),
           R("13/10/2026", "14:10", "La respondió", "Persona sin información", WA, None, HECHO),
           R("13/10/2026", "14:10", "Aviso a quien la cargó", "Persona sin información", WA,
             "«Recibimos VIS-000125. Te avisamos cuando la aprueben.»", LEIDO)]
    return [B("Al recibirla", rec),
            B("Aprobación", [R("13/10/2026", "14:10", "Se pidió aprobación", None, None, "Rol Supervisor"),
                             R("14/10/2026", "09:10", "La rechazó", "Lucía Fernández", APP, m, RECHAZADA)]),
            B("Al rechazarla", [R("14/10/2026", "09:10", "Aviso a quien la cargó", "Persona sin información", WA, aviso_txt,
                                  ENTREGADO)])]


ACT122 = [B("Al recibirla", [R("12/10/2026", "17:31", "Se pidió la ubicación", None, WA, PIDE_UB, HECHO),
                             R("12/10/2026", "17:35", "Llegó la ubicación", "Martín Paz", WA, None, HECHO),
                             R("12/10/2026", "17:40", "La respondió", "Martín Paz", WA, None, HECHO),
                             R("12/10/2026", "17:40", "Aviso a quien la cargó", "Martín Paz", WA,
                               "«Recibimos VIS-000122. Te avisamos cuando la aprueben.»", LEIDO)]),
          B("Aprobación", [R("12/10/2026", "17:40", "Pedir aprobación a un rol", None, None,
                             ["Rol Supervisor", "Nadie del rol Supervisor puede decidirla."], E("mal", "No se pudo", ROL_SIN_I),
                             [M_REINTENTAR], abierto=True)])]


def act126(martin="entregado", correo="hecho", carlos=False, menu_abierto=None, permiso=True):
    """La actividad de VIS-000126, aprobada. `martin`: entregado, no se pudo, reintentado, sin confirmar o revisado; `correo`:
    hecho, sin confirmar o reintentado; `menu_abierto`: el renglón con su ⋮ abierto (pdf, martin o correo)."""
    rec = recibida_wa("VIS-000126", "13/10/2026", "11:20", "11:20", "15:24", "15:30", "Tomás Acosta")
    apr = [R("13/10/2026", "15:30", "Se pidió aprobación", None, None, "Rol Supervisor"),
           R("13/10/2026", "16:05", "La aprobó", "Lucía Fernández", APP, None, APROBADA)]
    pdf = R("13/10/2026", "16:05", "Se armó el PDF", None, None, "Comprobante-VIS-000126.pdf", HECHO, [M_VER, M_BAJAR],
            abierto=menu_abierto == "pdf")
    msj = R("13/10/2026", "16:05", "Aviso a quien la cargó", "Tomás Acosta", WA,
            "«Aprobaron VIS-000126. Te mandamos el comprobante.»", ENTREGADO)
    if correo == "sin confirmar":
        mails = [R("13/10/2026", "16:05", "Mandar por correo", None, CORREO, CON_PDF, E("aten", "Sin confirmar", SIN_CONF_CORREO),
                   [M_REINTENTAR] if permiso else [], abierto=menu_abierto == "correo")]
    elif correo == "reintentado":
        mails = [R("13/10/2026", "17:01", "Pidió reintentar", "Lucía Fernández", APP, f"El correo a {CORREO_DIR}"),
                 R("13/10/2026", "17:02", "Mandar por correo", None, CORREO, CON_PDF, HECHO)]
    else:
        mails = [R("13/10/2026", "16:05", "Mandar por correo", None, CORREO, CON_PDF, HECHO)]
    rol = [R("13/10/2026", "16:05", "Aviso a un rol", "Ana Gómez", WA, "Rol Dueño", LEIDO)]
    if carlos:
        rol.append(R("13/10/2026", "16:05", "Aviso a un rol", "Carlos Ruiz", None, "Ya no tiene el rol Dueño.", E("", "No aplica")))
    abierto_m = menu_abierto == "martin"
    if martin == "entregado":
        rol.append(R("13/10/2026", "16:05", "Aviso a un rol", "Martín Paz", WA, "Rol Dueño", ENTREGADO))
    elif martin == "no se pudo":
        rol.append(R("13/10/2026", "16:05", "Aviso a un rol", "Martín Paz", WA,
                     ["Rol Dueño", "WhatsApp no aceptó el mensaje: no tiene el WhatsApp vinculado."], E("mal", "No se pudo", NO_SE_PUDO_I),
                     [M_REINTENTAR], abierto=abierto_m))
    elif martin == "reintentado":
        rol += [R("13/10/2026", "16:20", "Pidió reintentar", "Lucía Fernández", APP, "El aviso a Martín Paz"),
                R("13/10/2026", "16:21", "Aviso a un rol", "Martín Paz", WA,
                  ["Rol Dueño", "WhatsApp no aceptó el mensaje: no tiene el WhatsApp vinculado."], E("mal", "No se pudo", NO_SE_PUDO_I),
                  [M_REINTENTAR], abierto=abierto_m)]
    elif martin == "sin confirmar":
        rol.append(R("13/10/2026", "16:05", "Aviso a un rol", "Martín Paz", WA, "Rol Dueño", E("aten", "Sin confirmar", SIN_CONF_WA),
                     [M_BANDEJA], abierto=abierto_m))
    elif martin == "revisado":
        rol += [R("13/10/2026", "16:05", "Aviso a un rol", "Martín Paz", WA, ["Rol Dueño", LO_REVISO],
                  E("aten", "Sin confirmar", SIN_CONF_WA_REV), [M_REINTENTAR], abierto=abierto_m),
                R("13/10/2026", "16:40", "Se revisó el envío", "Ana Gómez", APP, "El aviso a Martín Paz", que_i=REVISION_I)]
    return [B("Al recibirla", rec), B("Aprobación", apr), B("Al aprobarla", [pdf, msj] + mails + rol)]


ACT45 = [B("Al recibirla", [R("15/10/2026", "10:51", "La mandó", "Lucía Fernández", WA, None, HECHO),
                            R("15/10/2026", "11:47", "La respondió", "Tomás Acosta", WA, None, HECHO)])]
ACT44 = [B("Al recibirla", [R("15/10/2026", "10:20", "La mandó", "Lucía Fernández", WA, None, HECHO),
                            R("15/10/2026", "11:04", "La respondió", "Tomás Acosta", WA, None, HECHO)])]
ACT39 = [B("Al recibirla", [R("13/10/2026", "11:40", "La mandó", "Lucía Fernández", WA, None, HECHO),
                            R("13/10/2026", "12:20", "La respondió", "Tomás Acosta", WA, None, HECHO)])]
ACT46 = [B("Al recibirla", [R("15/10/2026", "12:32", "La cargó", "Tomás Acosta", APP, None, HECHO)])]
ACT118 = [B("Al recibirla", recibida_wa("VIS-000118", "11/10/2026", "09:30", "09:30", "10:05", "10:12", "Paula Méndez", mensaje=False))]
ACT117 = [B("Al recibirla", recibida_wa("VIS-000117", "11/10/2026", "08:50", "08:50", "09:02", "09:15", "Marta Gil", ubicacion=False,
                                        mensaje=False))]
REV = "Reglas de la revisión 3"
MIGA_PED = "Inicio / Gestión de formularios / Formularios / Pedido de materiales"
MIGA_VIS = "Inicio / Gestión de formularios / Formularios / Visita a cliente"


def resp_wa(quien, fecha, hora):
    return f"La respondió {quien} por WhatsApp el {fecha}, {hora}"


# ---------------------------------------------------------------------------------------------------------------- E19
def frm_respuesta_19():
    t, _ = leer("FRM-Respuesta-19")
    _, _, v = viejos_compu(t)
    banda = v["banda"]["Respuesta"]
    f45, f44 = v["cuerpo"]["Respuesta"], v["cuerpo"]["Un cálculo sin respuesta"]
    f39 = seleccionar(f45, "PED-000039")
    l45, l44 = resp_wa("Tomás Acosta", "15/10/2026", "11:47"), resp_wa("Tomás Acosta", "15/10/2026", "11:04")
    l39 = resp_wa("Tomás Acosta", "13/10/2026", "12:20")

    def vr(num, cuerpo, linea_gris, pie, anterior=True, pestana="Respuesta"):
        return vista_rapida(num, cuerpo, linea_gris=linea_gris, pestana=pestana, version="Versión 3", completa="FRM-Respuesta-19.dc.html",
                            conversacion="WA-Chats-Respuesta-19.dc.html", anterior=anterior, pie=pie)

    def completa(num, zonas, act, linea_gris, pos, anterior):
        return dict(banda=banda_completa(num, linea_gris=linea_gris, version="Versión 3", pos=pos, anterior=anterior,
                                         acciones=acciones_banda(conversacion="WA-Chats-Respuesta-19.dc.html"),
                                         volver="FRM-Respuestas-19.dc.html"),
                    cuerpo=cuerpo_completa(respuesta(zonas, 3), actividad_tabla(act)))

    estados = [
        ("Respuesta", dict(banda=banda, cuerpo=f45, aside=vr("PED-000045", respuesta(PED45, 2), l45, "1 de 10", anterior=False))),
        ("Un cálculo sin respuesta", dict(banda=banda, cuerpo=f44, aside=vr("PED-000044", respuesta(PED44, 2), l44, "2 de 10"))),
        ("La fórmula del total", dict(banda=banda, cuerpo=f45, aside=vr("PED-000045", respuesta(PED45, 2, i_abierta="Total"), l45,
                                                                         "1 de 10", anterior=False))),
        ("De antes del bloque", dict(banda=banda, cuerpo=f39, aside=vista_rapida(
            "PED-000039", respuesta(PED39, 2), linea_gris=l39, version="Versión 2", completa="FRM-Respuesta-19.dc.html",
            conversacion="WA-Chats-Respuesta-19.dc.html", pie="7 de 10"))),
        ("Actividad", dict(banda=banda, cuerpo=f45, aside=vr("PED-000045", actividad_recuadros(ACT45), l45, "1 de 10", anterior=False,
                                                              pestana="Actividad"))),
        ("Pantalla completa", completa("PED-000045", PED45, ACT45, l45, "1 de 10", False)),
        ("Pantalla completa: un cálculo sin respuesta", completa("PED-000044", PED44, ACT44, l44, "2 de 10", True)),
    ]
    rehacer_compu("FRM-Respuesta-19", estados, 1000, {"miga": [MIGA_PED] * len(estados)})


def m_frm_respuesta_19():
    l45, l44 = resp_wa("Tomás Acosta", "15/10/2026", "11:47"), resp_wa("Tomás Acosta", "15/10/2026", "11:04")

    def pag(num, linea_gris, cuerpo, pos, anterior=True, desplazar=0):
        return pagina_tel(num, cuerpo, version="Versión 3", linea_gris=linea_gris, pos=pos, anterior=anterior,
                          conversacion="M-WA-Conversacion-Respuesta-19.dc.html", volver="M-FRM-Respuestas-19.dc.html", desplazar=desplazar)

    estados = [
        ("Respuesta", dict(cuerpo=pag("PED-000045", l45, respuesta(PED45, 1, True) + actividad_tel(ACT45), "1 de 45", False))),
        ("Un cálculo sin respuesta", dict(cuerpo=pag("PED-000044", l44, respuesta(PED44, 1, True) + actividad_tel(ACT44), "2 de 45"))),
        ("La fórmula del total", dict(cuerpo=pag("PED-000045", l45, respuesta(PED45, 1, True, i_abierta="Total") + actividad_tel(ACT45),
                                                 "1 de 45", False, desplazar=900))),
        ("Actividad", dict(cuerpo=pag("PED-000045", l45, actividad_tel(ACT45), "1 de 45", False))),
    ]
    rehacer_tel("M-FRM-Respuesta-19", estados)


# ---------------------------------------------------------------------------------------------------------------- E20
def frm_respuesta_20():
    t, _ = leer("FRM-Respuesta-20")
    _, _, v = viejos_compu(t)
    banda, f46 = v["banda"]["Respuesta"], v["cuerpo"]["Respuesta"]
    l46 = "La cargó Tomás Acosta en la app el 15/10/2026, 12:32"
    l118, l117 = resp_wa("Paula Méndez", "11/10/2026", "10:12"), resp_wa("Marta Gil", "11/10/2026", "09:15")

    def vr(cuerpo, pestana="Respuesta"):
        return vista_rapida("PED-000046", cuerpo, linea_gris=l46, pestana=pestana, version="Versión 4", completa="FRM-Respuesta-20.dc.html",
                            anterior=False, pie="1 de 10")

    def completa_vis(num, zonas, act, linea_gris, pos):
        return dict(banda=banda_completa(num, linea_gris=linea_gris, version="Versión 4", pos=pos, anterior=True,
                                         acciones=acciones_banda(conversacion="WA-Chats-Formulario-20.dc.html"),
                                         volver="FRM-Respuestas-20.dc.html"),
                    cuerpo=cuerpo_completa(respuesta(zonas, 3), actividad_tabla(act)))

    estados = [
        ("Respuesta", dict(banda=banda, cuerpo=f46, aside=vr(respuesta(PED46, 2)))),
        ("Actividad", dict(banda=banda, cuerpo=f46, aside=vr(actividad_recuadros(ACT46), "Actividad"))),
        ("Pantalla completa", dict(banda=banda_completa("PED-000046", linea_gris=l46, version="Versión 4", pos="1 de 10",
                                                        volver="FRM-Respuestas-20.dc.html"),
                                   cuerpo=cuerpo_completa(respuesta(PED46, 3), actividad_tabla(ACT46)))),
        ("Por WhatsApp, con la ubicación", completa_vis("VIS-000118", VIS118, ACT118, l118, "3 de 12")),
        ("Por WhatsApp, siguió sin la ubicación", completa_vis("VIS-000117", VIS117, ACT117, l117, "4 de 12")),
    ]
    migas = [MIGA_PED, MIGA_PED, MIGA_PED, MIGA_VIS, MIGA_VIS]
    rehacer_compu("FRM-Respuesta-20", estados, 1100, {"miga": migas})


def m_frm_respuesta_20():
    l46 = "La cargó Tomás Acosta en la app el 15/10/2026, 12:32"
    l118 = resp_wa("Paula Méndez", "11/10/2026", "10:12")

    def p46(cuerpo):
        return pagina_tel("PED-000046", cuerpo, version="Versión 4", linea_gris=l46, pos="1 de 46", volver="M-FRM-Respuestas-20.dc.html")

    def p118(cuerpo):
        return pagina_tel("VIS-000118", cuerpo, version="Versión 4", linea_gris=l118, pos="3 de 12", anterior=True,
                          conversacion="M-WA-Chats-Formulario-20.dc.html", volver="M-FRM-Respuestas-20.dc.html")

    estados = [
        ("Respuesta", dict(cuerpo=p46(respuesta(PED46, 1, True) + actividad_tel(ACT46)))),
        ("Actividad", dict(cuerpo=p46(actividad_tel(ACT46)))),
        ("Por WhatsApp, con la ubicación", dict(cuerpo=p118(respuesta(VIS118, 1, True) + actividad_tel(ACT118)))),
        ("Actividad: el pedido de ubicación", dict(cuerpo=p118(actividad_tel(ACT118)))),
    ]
    rehacer_tel("M-FRM-Respuesta-20", estados)


# ---------------------------------------------------------------------------------------------------------------- E21
SIN_DECIDIR = "Otra persona con el rol Supervisor tiene que aprobarla: la cargaste vos."
DECIDIO_OTRO = "Martín Paz la aprobó mientras la mirabas. Se muestra su decisión."


def cola(cuerpo):
    """La vista «Por aprobar» de la planilla (148): una cola corta, de la más vieja a la más nueva, sin filtros ni orden (264), con
    «Revisar» en el ⋮ de cada fila (261)."""
    i = cuerpo.index('<div class="pa-vis">')
    seg = ('<div class="pa-vis"><span class="ab-seg" role="radiogroup" aria-label="Vista"><span class="on" role="radio" '
           'aria-checked="true">Por aprobar (2)</span><span class="" role="radio" aria-checked="false">Por resolver (2)</span>'
           '<span class="" role="radio" aria-checked="false">Todas</span></span></div>')
    filas = [("VIS-000123", "Tomás Acosta", '<span class="pl-g">—</span>', "13/10/2026, 11:04"),
             ("VIS-000127", "Marta Gil", "Sí", "14/10/2026, 09:30")]
    html = "".join(f'<div class="w-tr pl{" sel" if k == 0 else ""}"><span><a class="pl-num" href="FRM-Respuesta-Aprobacion.dc.html">{n}</a></span>'
                   f'<span>{q}</span><span>{c}</span><span>{r}</span><span>Supervisor</span><span>'
                   f'<button type="button" class="ib" aria-label="Acciones de {n}" aria-haspopup="menu" aria-expanded="false">{SVG_KEB}</button>'
                   f'</span></div>' for k, (n, q, c, r) in enumerate(filas))
    tabla = ('<div class="w-caja pl-caja" style="--pl-cols: 112px 220px 96px 136px 140px 56px;"><div class="pl-scroll"><div class="w-th pl">'
             '<span>N°</span><span>Cargó</span><span>Es cliente</span><span>Recibida</span><span>Rol</span><span><span class="sr">Acciones</span></span>'
             f'</div>{html}</div><div class="w-pie"><span>1–2 de 2</span></div></div>')
    return cuerpo[:i] + seg + tabla + "</div>"


def frm_respuesta_aprobacion():
    t, _ = leer("FRM-Respuesta-Aprobacion")
    _, _, v = viejos_compu(t)
    bnd, cpo, capa = v["banda"], v["cuerpo"], v["capa"]
    l130, l126 = resp_wa("Paula Méndez", "15/10/2026", "16:20"), resp_wa("Tomás Acosta", "13/10/2026", "15:30")
    l125, l122 = resp_wa("Persona sin información", "13/10/2026", "14:10"), resp_wa("Martín Paz", "12/10/2026", "17:40")
    l123 = resp_wa("Tomás Acosta", "13/10/2026", "11:04")
    l131 = "La cargó Lucía Fernández en la app el 15/10/2026, 17:10"
    conv = "WA-Chats-Avisos.dc.html"
    yo = "FRM-Respuesta-Aprobacion.dc.html"

    def vr(num, cuerpo, linea_gris, *, estado, pestana="Respuesta", lapiz=True, conversacion=conv, bajar=False, keb=True, arriba="",
           pie="1 de 10", anterior=False, version="Versión 4"):
        return vista_rapida(num, cuerpo, linea_gris=linea_gris, pestana=pestana, estado=estado, version=version, lapiz=lapiz, completa=yo,
                            conversacion=conversacion, bajar=bajar, keb=keb, arriba=arriba, pie=pie, anterior=anterior)

    POR = ("pend", "Por aprobar")
    APR = ("", "Aprobada")
    q130 = vr("VIS-000130", respuesta(VIS130, 2), l130, estado=POR, arriba=decision())

    def q126(act, desde=2, permiso=True):
        return vr("VIS-000126", actividad_recuadros(act, REV, desde), l126, estado=APR, pestana="Actividad", bajar=True,
                  lapiz=permiso, keb=permiso, pie="5 de 10", anterior=True)

    f126 = cpo["Actividad"]
    f126r = por_resolver(f126, "VIS-000126")
    rechazar_opc = capa["Rechazar"].replace(' <span class="req">*</span>', "").replace(
        "Falta la firma del cliente en el remito.", "").replace("39 / 500", "0 / 500")
    assert rechazar_opc != capa["Rechazar"]

    def completa(num, zonas, act, linea_gris, *, estado, acciones, pos, anterior=True, siguiente=True, version="Versión 4"):
        return dict(banda=banda_completa(num, linea_gris=linea_gris, version=version, estado=estado, acciones=acciones, pos=pos,
                                         anterior=anterior, siguiente=siguiente, volver="FRM-Respuestas-21.dc.html"),
                    cuerpo=cuerpo_completa(respuesta(zonas, 3), actividad_tabla(act, REV)))

    martin = "Martín Paz"
    estados = [
        ("Por aprobar", dict(banda=bnd["Por aprobar"], cuerpo=cpo["Por aprobar"], aside=q130)),
        ("¿Aprobar?", dict(banda=bnd["¿Aprobar?"], cuerpo=cpo["¿Aprobar?"], aside=q130, capa=capa["¿Aprobar?"])),
        ("Aprobando", dict(banda=bnd["Aprobando"], cuerpo=cpo["Aprobando"], aside=q130, capa=capa["Aprobando"])),
        ("Aprobada", dict(banda=bnd["Aprobada"], cuerpo=cpo["Aprobada"], aside=vr("VIS-000130", respuesta(VIS130, 2), l130, estado=APR),
                          capa=capa["Aprobada"])),
        ("Rechazar", dict(banda=bnd["Rechazar"], cuerpo=cpo["Rechazar"], aside=q130, capa=capa["Rechazar"])),
        ("Rechazar: motivo opcional", dict(banda=bnd["Rechazar"], cuerpo=cpo["Rechazar"], aside=q130, capa=rechazar_opc)),
        ("Rechazada", dict(banda=bnd["Rechazada"], cuerpo=cpo["Rechazada"], aside=vr(
            "VIS-000125", actividad_recuadros(act125("Falta la foto del frente de la obra."), REV), l125, estado=("mal", "Rechazada"),
            pestana="Actividad", pie="6 de 10", anterior=True))),
        ("Rechazada sin motivo", dict(banda=bnd["Rechazada"], cuerpo=cpo["Rechazada"], aside=vr(
            "VIS-000125", actividad_recuadros(act125(None), REV), l125, estado=("mal", "Rechazada"), pestana="Actividad", pie="6 de 10",
            anterior=True))),
        ("La cargaste vos", dict(banda=bnd["La cargaste vos"], cuerpo=cpo["La cargaste vos"], aside=vr(
            "VIS-000131", respuesta(VIS131, 2), l131, estado=POR, conversacion=None, arriba=decision(SIN_DECIDIR)))),
        ("Sin el rol", dict(banda=bnd["Sin el rol"], cuerpo=cpo["Sin el rol"], aside=vr(
            "VIS-000130", respuesta(VIS130, 2), l130, estado=POR, lapiz=False, keb=False))),
        ("Otra persona decidió", dict(banda=bnd["Otra persona decidió"], cuerpo=cpo["Otra persona decidió"], aside=vr(
            "VIS-000130", respuesta(VIS130, 2), l130, estado=APR, arriba=aviso(DECIDIO_OTRO)))),
        ("Desde «Por aprobar»", dict(banda=bnd["Por aprobar"], cuerpo=cola(cpo["Por aprobar"]), aside=vr(
            "VIS-000123", respuesta(VIS123, 2), l123, estado=POR, arriba=decision(), pie="1 de 2 por aprobar", version="Versión 3"))),
        ("Actividad", dict(banda=bnd["Actividad"], cuerpo=f126, aside=q126(act126(), desde=0))),
        ("Actividad: no se pudo", dict(banda=bnd["Actividad: no se pudo"], cuerpo=por_resolver(cpo["Actividad: no se pudo"], "VIS-000126"),
                                       aside=q126(act126("no se pudo", menu_abierto="martin")))),
        ("Actividad: después de reintentar", dict(banda=bnd["Actividad: después de reintentar"],
                                                  cuerpo=por_resolver(cpo["Actividad: después de reintentar"], "VIS-000126"),
                                                  aside=q126(act126("reintentado", carlos=True)))),
        ("Actividad: el rol sin personas", dict(banda=bnd["Actividad: el rol sin personas"], cuerpo=cpo["Actividad: el rol sin personas"],
                                                aside=vr("VIS-000122", actividad_recuadros(ACT122, REV), l122, estado=("off", "Recibida"),
                                                         pestana="Actividad", pie="9 de 10", anterior=True))),
        ("Actividad: sin confirmar", dict(banda=bnd["Actividad"], cuerpo=f126r, aside=q126(act126("sin confirmar", menu_abierto="martin")))),
        ("Actividad: sin confirmar, revisado", dict(banda=bnd["Actividad"], cuerpo=f126,
                                                    aside=q126(act126("revisado", menu_abierto="martin")))),
        ("Actividad: correo sin confirmar", dict(banda=bnd["Actividad"], cuerpo=f126r,
                                                 aside=q126(act126(correo="sin confirmar", menu_abierto="correo")))),
        ("Reintentar el correo", dict(banda=bnd["Actividad"], cuerpo=f126r, aside=q126(act126(correo="sin confirmar")),
                                      capa=dialogo_confirmar("Reintentar el correo de VIS-000126", REINTENTAR_TXT, LECTURA_CORREO,
                                                             BOTON_REINTENTAR))),
        ("Actividad: correo mandado otra vez", dict(banda=bnd["Actividad"], cuerpo=f126, aside=q126(act126(correo="reintentado")),
                                                    capa=toast("Mandamos el correo otra vez."))),
        ("Sin permiso para reintentar", dict(banda=bnd["Sin el rol"], cuerpo=f126r,
                                             aside=q126(act126(correo="sin confirmar", permiso=False), permiso=False))),
        ("PDF", dict(banda=bnd["PDF"], cuerpo=cpo["PDF"], aside=q126(act126(menu_abierto="pdf")))),
        ("Copia fija", dict(banda=bnd["Copia fija"], cuerpo=cpo["Copia fija"], aside=q126(act126()), capa=capa["Copia fija"])),
        ("Pantalla completa", completa("VIS-000130", VIS130, ACT130, l130, estado=POR, pos="1 de 10", anterior=False,
                                       acciones=acciones_banda(True, True, conv, keb=True))),
        ("Pantalla completa: desde «Por aprobar»", completa(
            "VIS-000123", VIS123, ACT123, l123, estado=POR, pos="1 de 2 por aprobar", anterior=False, version="Versión 3",
            acciones=acciones_banda(True, True, conv, keb=True))),
        ("Pantalla completa: aprobada", completa("VIS-000126", VIS126, act126(menu_abierto="pdf"), l126, estado=APR, pos="5 de 10",
                                                 acciones=acciones_banda(True, False, conv, True, True))),
        ("Pantalla completa: sin confirmar", completa(
            "VIS-000126", VIS126, act126("sin confirmar", "sin confirmar", menu_abierto="correo"), l126, estado=APR, pos="5 de 10",
            acciones=acciones_banda(True, False, conv, True, True))),
    ]
    nombres = [n for n, _ in estados]
    martin_ve = {"Sin el rol", "Sin permiso para reintentar"}
    vals = {"miga": [MIGA_VIS] * len(estados),
            "yo": [martin if n in martin_ve else "Lucía Fernández" for n in nombres],
            "yoIni": ["M" if n in martin_ve else "L" for n in nombres],
            "yoCorreo": ["martin.paz@delta.ejemplo.com" if n in martin_ve else "lucia.fernandez@delta.ejemplo.com" for n in nombres]}
    rehacer_compu("FRM-Respuesta-Aprobacion", estados, 1500, vals)


def m_frm_respuesta_aprobacion():
    t, _ = leer("M-FRM-Respuesta-Aprobacion")
    _, _, _, _, v = viejos_tel(t)
    capa = v["capa"]
    l130, l123 = resp_wa("Paula Méndez", "15/10/2026", "16:20"), resp_wa("Tomás Acosta", "13/10/2026", "11:04")
    l131 = "La cargó Lucía Fernández en la app el 15/10/2026, 17:10"
    conv = "M-WA-Conversacion-Avisos.dc.html"
    volver = "M-FRM-Respuestas-21.dc.html"
    POR, APR = ("pend", "Por aprobar"), ("", "Aprobada")

    l126, l125 = resp_wa("Tomás Acosta", "13/10/2026", "15:30"), resp_wa("Persona sin información", "13/10/2026", "14:10")
    l122 = resp_wa("Martín Paz", "12/10/2026", "17:40")

    def pag(num, linea_gris, cuerpo, *, estado, pos, anterior=True, lapiz=True, keb=True, fijo="", conversacion=conv, version="Versión 4"):
        return pagina_tel(num, cuerpo, version=version, linea_gris=linea_gris, estado=estado, pos=pos, anterior=anterior,
                          conversacion=conversacion, lapiz=lapiz, keb=keb, fijo=fijo, volver=volver)

    def p130(estado=POR, fijo=None):
        return pag("VIS-000130", l130, respuesta(VIS130, 1, True) + actividad_tel(ACT130, REV), estado=estado, pos="1 de 10",
                   anterior=False, fijo=fijo_tel() if fijo is None else fijo)

    def p126(act, desde=2, permiso=True):
        return pag("VIS-000126", l126, actividad_tel(act, REV, desde), estado=APR, pos="5 de 10", lapiz=permiso, keb=permiso)

    def p125(motivo):
        return pag("VIS-000125", l125, actividad_tel(act125(motivo), REV, 1), estado=("mal", "Rechazada"), pos="6 de 10")

    rechazar_opc = capa["Rechazar"].replace(' <span class="rq">*</span>', "").replace(
        "Falta la firma del cliente en el remito.", "").replace("39 / 500", "0 / 500")
    assert rechazar_opc != capa["Rechazar"]
    estados = [
        ("Por aprobar", dict(cuerpo=p130())),
        ("¿Aprobar?", dict(cuerpo=p130(), capa=capa["¿Aprobar?"])),
        ("Aprobando", dict(cuerpo=p130(), capa=capa["Aprobando"])),
        ("Aprobada", dict(cuerpo=p130(APR, ""), capa=capa["Aprobada"])),
        ("Rechazar", dict(cuerpo=p130(), capa=capa["Rechazar"])),
        ("Rechazar: motivo opcional", dict(cuerpo=p130(), capa=rechazar_opc)),
        ("Rechazada", dict(cuerpo=p125("Falta la foto del frente de la obra."))),
        ("Rechazada sin motivo", dict(cuerpo=p125(None))),
        ("La cargaste vos", dict(cuerpo=pag("VIS-000131", l131, respuesta(VIS131, 1, True), estado=POR, pos="1 de 10",
                                            anterior=False, conversacion=None, fijo=fijo_tel(SIN_DECIDIR)))),
        ("Desde «Por aprobar»", dict(cuerpo=pag("VIS-000123", l123, respuesta(VIS123, 1, True), estado=POR, version="Versión 3",
                                                pos="1 de 2 por aprobar", anterior=False, fijo=fijo_tel()))),
        ("Actividad", dict(cuerpo=p126(act126(), 0))),
        ("Actividad: no se pudo", dict(cuerpo=p126(act126("no se pudo", menu_abierto="martin")), capa=hoja_menu("Martín Paz", [M_REINTENTAR]))),
        ("Actividad: después de reintentar", dict(cuerpo=p126(act126("reintentado", carlos=True)))),
        ("Actividad: el rol sin personas", dict(cuerpo=pag("VIS-000122", l122, actividad_tel(ACT122, REV), estado=("off", "Recibida"),
                                                           pos="9 de 10"),
                                                capa=hoja_menu("Pedir aprobación a un rol", [M_REINTENTAR]))),
        ("Actividad: sin confirmar", dict(cuerpo=p126(act126("sin confirmar", menu_abierto="martin")), capa=hoja_menu("Martín Paz", [M_BANDEJA_TEL]))),
        ("Actividad: sin confirmar, revisado", dict(cuerpo=p126(act126("revisado", menu_abierto="martin")), capa=hoja_menu("Martín Paz", [M_REINTENTAR]))),
        ("Actividad: correo sin confirmar", dict(cuerpo=p126(act126(correo="sin confirmar", menu_abierto="correo")), capa=hoja_menu("Mandar por correo", [M_REINTENTAR]))),
        ("Reintentar el correo", dict(cuerpo=p126(act126(correo="sin confirmar")),
                                      capa=hoja_confirmar("Reintentar el correo de VIS-000126", REINTENTAR_TXT, LECTURA_CORREO,
                                                          BOTON_REINTENTAR))),
        ("Actividad: correo mandado otra vez", dict(cuerpo=p126(act126(correo="reintentado")), capa=toast_tel("Mandamos el correo otra vez."))),
        ("Sin permiso para reintentar", dict(cuerpo=p126(act126(correo="sin confirmar", permiso=False), permiso=False))),
        ("PDF", dict(cuerpo=p126(act126(menu_abierto="pdf")), capa=hoja_menu("Comprobante-VIS-000126.pdf", [M_VER, M_BAJAR]))),
    ]
    rehacer_tel("M-FRM-Respuesta-Aprobacion", estados)


# ---------------------------------------------------------------------------------------------------------------- todo
def _partir(p):
    """Como `e14_panel_1004.partir`, también cuando «Formularios» lleva su número («Formularios 4»)."""
    if e14p.SEP in p:
        return p
    m = e14p.CATALOGOS.search(p)
    i = p.find("Formularios")
    assert i >= 0 and m and m.start() > i, "el panel no tiene «Formularios» antes de «Catálogos»"
    return p[:m.start()] + e14p.SEP + p[m.start():]


def panel(nombre):
    """El panel de «Gestión de formularios» en dos grupos (275), con la pieza de `e14_panel_1004.py`."""
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    nuevo, n = e14p.PANEL.subn(lambda m: _partir(m.group(0)), t)
    if e14p.BLOQUE not in nuevo:
        nuevo = nuevo.replace("</helmet>", e14p.CSS + "</helmet>", 1)
    if nuevo != t:
        ruta.write_text(nuevo, encoding="utf-8", newline="")
    print("ok panel", nombre, n)


HACER = [("FRM-Respuesta-19", frm_respuesta_19), ("M-FRM-Respuesta-19", m_frm_respuesta_19), ("FRM-Respuesta-20", frm_respuesta_20),
         ("M-FRM-Respuesta-20", m_frm_respuesta_20), ("FRM-Respuesta-Aprobacion", frm_respuesta_aprobacion),
         ("M-FRM-Respuesta-Aprobacion", m_frm_respuesta_aprobacion)]

if __name__ == "__main__":
    hechos = []
    for nombre, hacer in HACER:
        t, _ = leer(nombre)
        if MARCA in t:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        hacer()
        hechos.append(nombre)
    if hechos:
        subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(hechos)], check=True)
        for nombre in hechos:
            if not nombre.startswith("M-"):
                panel(nombre)
