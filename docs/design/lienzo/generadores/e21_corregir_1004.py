"""Corregir, anular y las planillas de la E21 con el traspaso 18 (tanda 3B de Diseño, grupo F2, 2026-11-26), redibujados en su
lugar con la forma que dejó el grupo F1 en `FRM-Respuesta-Aprobacion` (`e21_respuesta_1004.py`, que se importa sin cambiarlo) y la
barra de la planilla de la E19 (`e19_planillas_1004.py`, también importado tal cual).

**En todos** (261 a 264, 266, 267, 211 y 275):
- **la respuesta se lee como el formulario** (266), con las piezas de F1: las zonas de la carga, la grilla de hasta tres por renglón
  (dos en la vista rápida, una en el teléfono), cada pregunta en su control de solo lectura y, arriba, solo la línea gris de quién y
  cuándo; la vista rápida con «Respuesta» y «Actividad», y **la actividad renglón por renglón** (267), en ocho columnas en la
  pantalla completa y en recuadros en la vista rápida y en el teléfono;
- **«Corregir» a la vista** (266, que cambia la 209): el lápiz primero en la vista rápida y en la barra del teléfono, y con texto en
  la banda de la pantalla completa; el ⋮ «Más acciones» tiene solo «Anular», en rojo (209). Sin permiso no se dibujan (93);
- **la planilla** como la de la E15 y la E19 (264 y 262): cada filtro con su botón, que abre la pieza; «Ordenar por», último y
  separado, dice el orden con palabras, y el encabezado lleva la flecha en el color de la marca. «Por aprobar | Por resolver |
  Todas» siguen como vistas de lo mismo (148 y 228, que la 262 deja afuera). Como la planilla de la E20, suma «Canal»;
- en el teléfono, cada fila es una tarjeta con cada dato con su nombre, sin nada unido con «·» debajo del número (263), y «Ordenar
  por» va arriba de la lista, a lo ancho;
- lo apagado dice su motivo en un tooltip sobre el control (211); el panel «Gestión de formularios» en dos grupos (275), con `partir`
  de `e19_e25_registrar_1004.py`, que acepta «Formularios 4» y un panel sin «Catálogos».

**Por tablero:**
- `FRM-Respuesta-Corregir` (266 y 267): **corregir en el lugar**, en la vista rápida y en la pantalla completa, sin panel ni página:
  el título pasa a «Corregir VIS-000126» con la versión activa al lado, y la banda queda con «Cancelar» y «Guardar corrección», sin
  ⋮, flechas ni actividad. Los controles son los de la carga, blancos y en la misma grilla; lo obligatorio, con su asterisco; la
  ubicación, con la ✕, «Ver en el mapa» y «Volver a pedirla»; cada archivo que ya estaba, en su renglón con «Ya cargado · 86 KB» al
  lado y la ✕ para quitarlo, y debajo, sumar otros dentro del tope («2 de 3»). «Antes: 125.500,00» va debajo de lo que cambió y el
  motivo, obligatorio, al final, después de una línea, con su cuenta («51 / 500»). Corregida, el detalle dice «Corregida» junto al
  estado, la línea gris suma quién la corrigió y la actividad suma la banda «Al corregirla»: «Corregida», con quién y el motivo en
  «Detalle» y, en su ⋮, «Ver la versión anterior» y su PDF; el aviso a quien la cargó, que vuelve a salir, y «Por aprobar otra vez»,
  con «El PDF nuevo sale al aprobarla.». Quien la corrigió no la decide: «Rechazar» y «Aprobar» apagados, con el motivo en el tooltip
  (276). La planilla suma la columna «Corregida», después de «Reglas» (206). «La versión anterior» se lee como estaba, con
  «Reemplazada», el aviso con «Ver la actual» y sin acciones. «Corregir: el panel» pasa a «Corregir en la vista rápida», y el
  `<title>` deja la ruta `/corregir`, que ya no existe. Estados nuevos: «Corregir: otra versión» (VIS-000123, cargada con la versión 3, con el aviso de ArquitecturaBase: «Se corrige con la
  versión 4 del formulario, la activa: … arrancan vacías.»).
- `M-FRM-Respuesta-Corregir`: lo mismo en el teléfono, con «Cancelar» y «Guardar corrección» fijos abajo. Estados nuevos:
  «Corregir: sin el motivo» y «Corregir: otra versión».
- `FRM-Respuesta-Anular` (266, 267 y 262): el lápiz a la vista y «Anular» solo en el ⋮; anulada, la vista rápida dice «Anulada»,
  sin lápiz ni ⋮, y la actividad suma la banda «Al anularla» con el renglón «Anulada», quién y el motivo en «Detalle». La planilla de
  atrás es la de `FRM-Respuestas-21`; después de anular, sin VIS-000127, cuenta 23 y «Por aprobar (2)», y sin «Es cliente», que ya
  no tiene ninguna fila. «Columnas» del Excel pasa a la pieza (262), y «Incluir las anuladas» sigue como casilla suelta. Estados
  nuevos: «Estado: la pieza» (el filtro abierto, con «Anulada» elegida) y «Anulada: actividad».
- `M-FRM-Respuesta-Anular`: el ⋮ abre una hoja con «Anular» en rojo; la lista, en tarjetas. Estado nuevo: «Anulada: el detalle».
- `FRM-Respuestas-21` (264, 262 y 261): «Estado» ordena por el circuito y «Reglas», de la A a la Z, y el filtro «Estado» va en la
  pieza, con «Todos los estados» primero y separado. La cola «Por aprobar» no ordena (264): «Revisar» pasa al ⋮ de cada fila
  (261). La vista rápida de la cola y la de quien solo aprueba son las de F1: quien solo aprueba ve la tarea en «Actividad», sin
  valores ni nombres (100). Estados nuevos: «Por aprobar: el ⋮», «Ordenar por abierto», «Ordenado por Estado» y «Ordenado por
  Reglas».
- `M-FRM-Respuestas-21`: las tarjetas, «Ordenar por» y, como `M-FRM-Respuestas-20`, «Filtros» a pantalla completa con «Estado» en
  la pieza (262). Estados nuevos: «Ordenar por», «Ordenar por: columna», «Ordenado por Estado», «Filtros» y «Filtros: Estado».
- `FRM-Respuestas-Propias-21` (266, 267 y 264): la vista rápida de F1, con el lápiz y el ⋮ mientras puede (la rechazada y la que
  espera, 93); su actividad, solo con la decisión y su motivo, sin el rol ni quién decidió. «Estado» y «Reglas» ordenan, y la barra
  suma «Empresa» y «Canal», como la de la E20. «Su PDF» abre la copia fija desde la columna «PDF». Estados nuevos: «Ordenar por
  abierto», «Ordenado por Estado», «Una rechazada: actividad» y «Corregir la rechazada» (con la foto que faltaba y «Antes: sin
  respuesta»).
- `M-FRM-Respuestas-Propias-21`: las tarjetas, «Ordenar por» y la rechazada como la página de F1. Estados nuevos: «Ordenar por» y
  «Corregir la rechazada».
- `FRM-Respuestas-Propias`, estado «Una respuesta suya» (263 y 266): la vista rápida de `FRM-Respuesta-20`, con la forma del
  formulario; nada más cambia.

**La planilla de atrás** (paso aparte, bloque `<style data-t3b="e21-fondos">`): las vistas rápidas de `FRM-Respuesta-19`,
`FRM-Respuesta-20`, `FRM-Respuesta-Aprobacion` y `FRM-Cargar-Panel` muestran detrás la barra y el encabezado de la planilla
redibujada de su etapa (`FRM-Respuestas-19`, `FRM-Respuestas-20` y `FRM-Respuestas-21`): cada filtro con su botón, «Ordenar por»
último y la flecha de «Recibida». La cola «Por aprobar» no cambia, porque no ordena. Nada más de esos tableros cambia.

Cambia los tableros en su lugar; el bloque `<style data-t3b="e21-corregir">` (y `e21-fondos` en los de atrás) lo frena si ya corrió.
Al final pasa `traspaso10_piezas_1004.py --tableros <los que cambió>`, que pone la escala de la compu, y parte en dos grupos el panel
de los de la compu (275). El alto de `FRM-Respuesta-Corregir` pasa a 1500. No toca `canvas.json`.

Uso: `python e21_corregir_1004.py` (y `--solo-fondos` para correr solo la planilla de atrás; `--copia <carpeta>` lo prueba sobre una
copia de los tableros, sin la pasada de las piezas).
"""
import copy
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12e  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402
import e14_panel_1004 as e14p  # noqa: E402
import e19_planillas_1004 as P19  # noqa: E402
import e21_respuesta_1004 as R  # noqa: E402
from e19_e25_registrar_1004 import partir  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = '<style data-t3b="e21-corregir">'
MARCA_F = '<style data-t3b="e21-fondos">'
SUFIJO = R.SUFIJO
cierre = e12e.cierre

# ---------------------------------------------------------------------------------------------------------------- íconos
SVG_KEB, SVG_X, SVG_VOLVER, SVG_MAPA, SVG_VER = R.SVG_KEB, b2.SVG_X, R.SVG_VOLVER, R.SVG_MAPA, R.SVG_VER
_TR = R._TR
SVG_HIST = _TR + '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5v3.5h3.5"/><path d="M12 8v4l2.8 1.8"/></svg>'
SVG_PIN = _TR + '<path d="M12 21s-6-5.4-6-10.5a6 6 0 0 1 12 0C18 15.6 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.2"/></svg>'
SVG_MAS = _TR + '<path d="M12 6v12M6 12h12"/></svg>'
SVG_ANULAR = ""  # sale del tablero de antes (`anular_svg`)

# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala: la pasada de las piezas las achica en la compu. Nada empieza con `.ap-` ni `.tel-`.
CSS_CORREGIR = """
/* F2 · Corregir en el lugar (266): los mismos controles, blancos para tocar, en la misma grilla; lo obligatorio con su asterisco;
   «Antes: …» debajo de lo que cambió (263) y el motivo al final, después de una línea. */
.rf-req { margin-left: 3px; color: var(--peligro); font-weight: 600; }
.rf-v .tx.vac { color: var(--t3); }
.rf-v.ed > .x, .rf-fi .x { flex: none; display: inline-flex; width: 28px; height: 28px; margin: -4px -6px -4px auto; align-items: center; justify-content: center; border: 0; border-radius: 3px; background: transparent; color: var(--t2); }
.rf-ub .re { padding: 0; border: 0; background: transparent; color: var(--marca-tx); font: inherit; font-size: 13px; font-weight: 600; white-space: nowrap; }
.rf-ub .rf-v.ed { min-width: 240px; }
.rf-usar { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; }
/* Los archivos que ya estaban: cada uno en su renglón, con «Ya cargado · 86 KB» al lado y la ✕ para quitarlo; debajo, sumar otros
   dentro del tope. */
.rf-fl { display: flex; flex-direction: column; gap: 6px; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; }
.rf-fi { display: flex; align-items: center; gap: 10px; min-width: 0; }
.rf-fi .mini { flex: none; width: 36px; height: 36px; border-radius: 3px; background: linear-gradient(135deg, oklch(0.86 0.04 140), oklch(0.72 0.06 160)); }
.rf-fi .mini.b { background: linear-gradient(135deg, oklch(0.88 0.03 80), oklch(0.74 0.05 60)); }
.rf-fi .pdf { flex: none; display: inline-flex; width: 28px; height: 32px; align-items: center; justify-content: center; border-radius: 3px; background: oklch(0.55 0.18 25); color: #fff; font-size: 9px; font-weight: 700; }
.rf-fi .nm { min-width: 0; font-size: 14px; font-weight: 600; color: var(--t1); overflow-wrap: anywhere; }
.rf-fi .kb { flex: none; padding-left: 10px; border-left: 1px solid var(--borde); color: var(--t2); font-size: 13px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.rf-drop { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; box-sizing: border-box; padding: 8px 10px; border: 1px dashed var(--borde2); border-radius: 3px; background: #fff; color: var(--t2); font-size: 13.5px; }
.rf-fl .rf-drop { margin-top: 2px; }
.rf-drop .cb { height: 28px; font-size: 13px; }
.rf-drop .cnt { margin-left: auto; font-size: 12.5px; color: var(--t2); font-variant-numeric: tabular-nums; }
.rf-mot { display: flex; flex-direction: column; gap: 6px; padding-top: 14px; border-top: 1px solid var(--borde); }
.rf-mot .rf-v { min-height: 72px; }
.rf-mot .pie { display: flex; align-items: flex-start; gap: 12px; }
.rf-cnt { margin-left: auto; font-size: 12.5px; color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* La vista rápida al corregir: el título con su versión y, a la derecha, «Cancelar» y «Guardar corrección», sin ⋮ ni flechas. */
.rq-ac { display: inline-flex; align-items: center; gap: 8px; }
.rq-ac .cb { height: 32px; font-size: 13px; }
.d2 .rq-avc { margin: 12px 20px 0; }
.w-body.rf-pc .acc-av { max-width: none; }
/* «Corregida» junto al estado (166); los botones apagados de la banda, con su motivo debajo (211). */
.rq-mc { font-size: 13px; font-weight: 500; color: var(--t2); }
.w-bnd .ac .rq-apag .acc-tip { left: auto; right: 0; width: max-content; max-width: 300px; }
/* El ⋮ abierto de la vista rápida y de la banda: «Anular», en rojo (209). */
.rq-ic .ra-kw, .w-bnd .ac .ra-kw { position: relative; }
.ra-mi.pel svg { color: var(--peligro); }
.acc-av .lnk { margin-left: 8px; color: var(--marca-tx); font-weight: 600; text-decoration: none; white-space: nowrap; }
"""

CSS_TEL_CORREGIR = """
/* F2 · En el teléfono: corregir con «Cancelar» y «Guardar corrección» fijos abajo; los controles de 44 para tocar. */
.ap .rf-v.ed > .x, .ap .rf-fi .x { width: 44px; height: 44px; margin: -10px -10px -10px auto; }
.ap .rf-fi .mini { width: 44px; height: 44px; border-radius: 8px; }
.ap .rf-fi .nm { font-size: 15px; }
.ap .rf-fi .kb { font-size: 13.5px; }
.ap .rf-fl, .ap .rf-drop { border-radius: 10px; }
.ap .rf-drop { font-size: 15px; }
.ap .rf-drop .cb { height: 44px; font-size: 15px; }
.ap .rf-drop .cnt { font-size: 13.5px; }
.ap .rf-ub .re { min-height: 44px; font-size: 14px; }
.ap .rf-ub .rf-v.ed { min-width: 0; }
.ap .rf-usar { min-height: 44px; }
.ap .rf-mot { padding-top: 16px; }
.ap .rf-mot .rf-v { min-height: 88px; }
.ap .rf-cnt { font-size: 13.5px; }
.ap .rf-cor { padding-bottom: 24px; }
.ap .rq-avt { margin: 12px 16px 0; }
.ap .ra-hop.pel, .ap .ra-hop.pel svg { color: var(--peligro); }
.ap .rq-mc { margin-left: 6px; font-size: 12.5px; font-weight: 500; color: var(--t2); }
"""

# La barra de la planilla (264 y 262): lo que la E14 y la E19 suman a las piezas comunes, sin repetir `CSS_B2`.
CSS_BARRA = P19.CSS_EXPORTAR[len(b2.CSS_B2):]
CSS_TARJETAS = P19.CSS_TEL[len(b2.CSS_B2 + b2.CSS_B2_TEL):]
CSS_COMPU = R.CSS_COMPU + CSS_BARRA + CSS_CORREGIR
CSS_TEL = R.CSS_TEL + CSS_TARJETAS + CSS_CORREGIR + CSS_TEL_CORREGIR
assert P19.CSS_EXPORTAR.startswith(b2.CSS_B2) and P19.CSS_TEL.startswith(b2.CSS_B2 + b2.CSS_B2_TEL)

# ---------------------------------------------------------------------------------------------------------------- textos
MIGA = R.MIGA_VIS
MIGA_ANTERIOR = MIGA + " / Versión anterior"
REV = R.REV
ORDEN_RECIBIDA = P19.ORDEN_RECIBIDA
ORDEN_ESTADO = "Ordenar por: Estado, por el circuito"
ORDEN_REGLAS = "Ordenar por: Reglas, de la A a la Z"
RECIENTE = P19.RECIENTE
COLS_21 = ["N°", "Estado", "Reglas", "Recibida", "Es cliente", "Canal", "Cliente", "Monto estimado", "Motivo"]
COLS_PROPIAS = ["N°", "Estado", "Reglas", "Recibida", "Canal", "Cliente", "Monto estimado"]
ESTADOS = ["Todos los estados", "Recibida", "Por aprobar", "Aprobada", "Rechazada", "Anulada"]
# Por el circuito (264): Recibida, Por aprobar, Aprobada, Rechazada; con el mismo estado, el orden de siempre (la más reciente).
POR_ESTADO_21 = ["VIS-000122", "VIS-000121", "VIS-000108", "VIS-000130", "VIS-000127", "VIS-000123", "VIS-000129", "VIS-000128",
                 "VIS-000126", "VIS-000124"]
POR_REGLAS_21 = ["VIS-000122", "VIS-000108", "VIS-000130", "VIS-000129", "VIS-000128", "VIS-000127", "VIS-000126", "VIS-000125",
                 "VIS-000124", "VIS-000123"]
POR_ESTADO_PROPIAS = ["VIS-000108", "VIS-000123", "VIS-000126", "VIS-000114", "VIS-000111", "VIS-000117"]

MOTIVO_C = "El monto era 130.000,00: faltaba la segunda cámara."
MOTIVO_A = "Se cargó dos veces."
MOTIVO_R = "Falta la foto del frente del local."
MOTIVO_117 = "Sumé la foto del frente de la obra."
SIN_DECIDIR_C = "Otra persona con el rol Supervisor tiene que aprobarla: la corregiste vos."
VERSION_C = ("Se corrige con la versión 4 del formulario, la activa: «Ubicación de la visita», «Fallas», «Fotos de la visita» y "
             "«Remito firmado» arrancan vacías.")
ANTERIOR_TXT = "Versión anterior de VIS-000126: la reemplazó la corrección del 15/10/2026, 18:30."
CONV = "WA-Chats-Respuesta-21.dc.html"
CONV_TEL = "M-WA-Conversacion-Respuesta-21.dc.html"
YO = "FRM-Respuesta-Corregir.dc.html"
APROB = "FRM-Respuesta-Aprobacion.dc.html"

# ---------------------------------------------------------------------------------------------------------------- los datos
P, Z, B, E = R.P, R.Z, R.B, R.E
HECHO, ENTREGADO, POR_APROBAR = R.HECHO, R.ENTREGADO, R.POR_APROBAR
WA, APP = R.WA, R.APP
POR, APR, REC, ANU = ("pend", "Por aprobar"), ("", "Aprobada"), ("mal", "Rechazada"), ("off", "Anulada")


def renglon(*a, **k):
    return R.R(*a, **k)


VIS126 = R.VIS126
VIS126C = R.visita("Ferretería Rosales", "13/10/2026", "-34.583190, -58.420411", 8, "Sí", "130.000,00", "Venta nueva", "Frío, Ruido",
                   "Cerramos el pedido de octubre.", ["frente-local.jpg", "gondola.jpg"], ("remito-0810.pdf", "1,2 MB"))
VIS127 = R.visita("Ferretería Sur", "14/10/2026", "-34.651230, -58.462871", 20, "No", "0,00", "Reclamo", "Puerta",
                  "Reclamo por demora en la entrega.", ["puerta.jpg", "deposito-sur.jpg"], "")
VIS117 = R.visita("Obra Centro", "10/10/2026", "-34.603722, -58.381592", 15, "No", "", "Seguimiento", "",
                  "Avance de obra, segunda etapa.", [], "")
VIS123 = R.VIS123
L126 = R.resp_wa("Tomás Acosta", "13/10/2026", "15:30")
L126C = L126 + " y la corrigió Lucía Fernández el 15/10/2026, 18:30"
L127 = R.resp_wa("Marta Gil", "14/10/2026", "09:30")
L123 = R.resp_wa("Tomás Acosta", "13/10/2026", "11:04")
L117 = "La cargó Tomás Acosta en la app el 10/10/2026, 17:20"
L123_SOLO = "Se recibió por WhatsApp el 13/10/2026, 11:04"
# Los archivos que ya estaban (lo que pesan sale de `size`, E20).
PESOS = {"frente-local.jpg": "86 KB", "gondola.jpg": "92 KB", "remito-0810.pdf": "1,2 MB"}


def act126_corregida():
    """La actividad de VIS-000126 corregida (267): lo de antes, con «La aprobó» y su PDF, y la banda «Al corregirla»."""
    m_ant = (SVG_HIST, "Ver la versión anterior", "", YO)
    m_pdf = (SVG_VER, "Ver el PDF del 13/10/2026", "", None)
    cor = [renglon("15/10/2026", "18:30", "Corregida", "Lucía Fernández", APP, MOTIVO_C, None, [m_ant, m_pdf]),
           renglon("15/10/2026", "18:30", "Aviso a quien la cargó", "Tomás Acosta", WA, "«Recibimos VIS-000126. Te avisamos cuando la aprueben.»",
                   ENTREGADO),
           renglon("15/10/2026", "18:30", "Por aprobar otra vez", None, None, ["Rol Supervisor", "El PDF nuevo sale al aprobarla."],
                   POR_APROBAR)]
    return R.act126() + [B("Al corregirla", cor)]


def act127(anulada=False):
    rec = R.recibida_wa("VIS-000127", "14/10/2026", "09:05", "09:05", "09:26", "09:30", "Marta Gil")
    apr = [renglon("14/10/2026", "09:30", "Se pidió aprobación", None, None, "Rol Supervisor", None if anulada else POR_APROBAR)]
    bandas = [B("Al recibirla", rec), B("Aprobación", apr)]
    if anulada:
        bandas.append(B("Al anularla", [renglon("15/10/2026", "18:40", "Anulada", "Lucía Fernández", APP, MOTIVO_A, E("", "Anulada"))]))
    return bandas


# Lo propio (267 y E21): solo la decisión, sin el rol ni quién decidió, con el motivo del rechazo en «Detalle».
ACT117_P = [B("Al recibirla", [renglon("10/10/2026", "17:20", "La cargó", "Tomás Acosta", APP, None, HECHO)]),
            B("Aprobación", [renglon("11/10/2026", "09:15", "La rechazó", None, APP, MOTIVO_R, R.RECHAZADA)])]
ACT123_P = [B("Al recibirla", [renglon("13/10/2026", "11:04", "La respondió", "Tomás Acosta", WA, None, HECHO)])]
ACT126_P = [B("Al recibirla", [renglon("13/10/2026", "15:30", "La respondió", "Tomás Acosta", WA, None, HECHO)]),
            B("Aprobación", [renglon("13/10/2026", "16:05", "La aprobó", None, APP, None, R.APROBADA)])]
# Quien solo aprueba (100): la tarea, sin valores ni nombres.
ACT123_SOLO = [B("Al recibirla", [renglon("13/10/2026", "11:04", "La respondió", None, WA, None, HECHO)]),
               B("Aprobación", [renglon("13/10/2026", "11:04", "Se pidió aprobación", None, None, "Rol Supervisor", POR_APROBAR)])]


# ---------------------------------------------------------------------------------------------------------------- corregir
def editable(zonas, cambios=None, antes=None):
    """Las mismas zonas, con cada pregunta para tocar (266); `cambios` pone el valor nuevo y `antes`, «Antes: …» debajo (263)."""
    out = copy.deepcopy(zonas)
    for z in out:
        for p in z["preguntas"]:
            p["editable"] = True
            for d in p.get("datos", []):
                d["editable"] = True
            if cambios and p["nombre"] in cambios:
                p["valor"] = cambios[p["nombre"]]
            if antes and p["nombre"] in antes:
                p["antes"] = antes[p["nombre"]]
    return out


def _fotos_ed(nombre, fotos, nuevas=(), tel=False, tope=3):
    filas = "".join(f'<div class="rf-fi"><span class="mini{" b" if k % 2 else ""}" role="img" aria-label="{n}"></span><span class="nm">{n}</span>'
                    f'<span class="kb">{kb}</span><button type="button" class="x" aria-label="Quitar {n}">{SVG_X}</button></div>'
                    for k, (n, kb) in enumerate([(f, "Ya cargado · " + PESOS[f]) for f in fotos] + list(nuevas)))
    cuantas = len(fotos) + len(nuevas)
    if tel:
        botones = '<button type="button" class="cb cb-sec">Tomar foto</button><button type="button" class="cb cb-sec">Elegir de la galería</button>'
    else:
        botones = 'Arrastrá las fotos acá o <button type="button" class="cb cb-sec">Elegir fotos</button>'
    drop = f'<div class="rf-drop">{botones}<span class="cnt">{cuantas} de {tope}</span></div>' if cuantas < tope else ""
    return f'<div class="rf-fl" role="group" aria-label="{nombre}">{filas}{drop}</div>' if filas else drop


def _documento_ed(nombre, doc, tel=False):
    if not doc:
        texto = "" if tel else "Arrastrá el documento acá o "
        return f'<div class="rf-drop" role="group" aria-label="{nombre}">{texto}<button type="button" class="cb cb-sec">Elegir archivo</button></div>'
    n, _ = doc
    return (f'<div class="rf-fl" role="group" aria-label="{nombre}"><div class="rf-fi"><span class="pdf">PDF</span><span class="nm">{n}</span>'
            f'<span class="kb">Ya cargado · {PESOS[n]}</span><button type="button" class="x" aria-label="Quitar {n}">{SVG_X}</button></div></div>')


def respuesta_ed(zonas, cols, tel=False, obligatorias=("Cliente", "Fecha de la visita", "¿Se concretó la venta?"), nuevas=None):
    """La respuesta para corregir: los controles de la carga en la misma grilla (266), con lo obligatorio marcado, la ubicación con
    la ✕ y «Volver a pedirla» y los archivos que ya estaban con «Ya cargado» y su ✕."""
    zs = copy.deepcopy(zonas)
    archivos = {}
    for z in zs:
        for p in z["preguntas"]:
            if p["tipo"] in ("fotos", "documento"):
                archivos[p["nombre"]] = (p["tipo"], p["valor"])
                p["tipo"], p["valor"] = "largo", f"@@{p['nombre']}@@"
    h = R.respuesta(zs, cols, tel)
    for n, (tipo, valor) in archivos.items():
        viejo = f'<div class="rf-v area ed" role="textbox" aria-label="{n}">@@{n}@@</div>'
        assert viejo in h, n
        nuevo = _fotos_ed(n, valor, (nuevas or {}).get(n, ()), tel) if tipo == "fotos" else _documento_ed(n, valor, tel)
        h = h.replace(viejo, nuevo)
    for z in zs:
        for p in z["preguntas"]:
            if p["tipo"] != "ubicacion":
                continue
            n, v = p["nombre"], p["valor"]
            if v:
                viejo = f'<div class="rf-v num ed" role="textbox" aria-label="{n}">{v}</div>'
                assert viejo in h, n
                h = h.replace(viejo, f'<div class="rf-v num ed" role="textbox" aria-label="{n}"><span class="tx">{v}</span>'
                                     f'<button type="button" class="x" aria-label="Quitar la ubicación">{SVG_X}</button></div>')
                fin = f'Ver en el mapa {SVG_MAPA}</a></div>'
                assert fin in h
                h = h.replace(fin, f'Ver en el mapa {SVG_MAPA}</a><button type="button" class="re">Volver a pedirla</button></div>', 1)
            else:
                viejo = f'<div class="rf-v ang ed" role="textbox" aria-label="{n}"></div>'
                assert viejo in h, n
                h = h.replace(viejo, f'<button type="button" class="cb cb-sec rf-usar">{SVG_PIN} Usar mi ubicación</button>')
    h = h.replace('<span class="tx"></span>', '<span class="tx vac">Elegí una opción</span>')
    for n in obligatorias:
        viejo = f'<span class="rf-et">{n}</span>'
        assert viejo in h, n
        h = h.replace(viejo, f'<span class="rf-et">{n}<span class="rf-req" aria-hidden="true">*</span></span>')
    return h


def motivo(texto="", error=False):
    """«Motivo de la corrección *», al final y después de una línea, obligatorio y de hasta 500 caracteres (E21)."""
    err = '<span class="rf-error" role="alert">Escribí el motivo.</span>' if error else ""
    return (f'<div class="rf-mot"><span class="rf-et">Motivo de la corrección<span class="rf-req" aria-hidden="true">*</span></span>'
            f'<div class="rf-v area ed{" err" if error else ""}" role="textbox" aria-multiline="true" aria-required="true" '
            f'aria-label="Motivo de la corrección">{texto}</div><div class="pie">{err}<span class="rf-cnt">{len(texto)} / 500</span></div></div>')


def con_motivo(resp, mot):
    assert resp.endswith("</div>")
    return resp[:-len("</div>")] + mot + "</div>"


def botones_corregir(guardando=False, tel=False):
    full = " full" if tel else ""
    if guardando:
        return (f'<button type="button" class="cb cb-sec{full}" disabled>Cancelar</button>'
                f'<button type="button" class="cb cb-pri{full} k-trabaja" aria-disabled="true" aria-busy="true">'
                '<span class="girar2" aria-hidden="true"></span>Guardando…</button>')
    return f'<button type="button" class="cb cb-sec{full}">Cancelar</button><button type="button" class="cb cb-pri{full}">Guardar corrección</button>'


def aviso_info(texto, clase="", enlace=None):
    lnk = f'<a class="lnk" href="{enlace[1]}">{enlace[0]}</a>' if enlace else ""
    return f'<div class="acc-av {clase}" role="status">{b2.SVG_I}<span>{texto}{lnk}</span></div>'


def vista_corregir(numero, cuerpo, *, linea_gris, version="Versión 4", aviso_txt=None, guardando=False):
    """La vista rápida al corregir (266): «Corregir VIS-000126» con la versión activa al lado y, en su renglón, «Cancelar» y
    «Guardar corrección»; sin ⋮, flechas, pestañas ni actividad."""
    av = aviso_info(aviso_txt, "rq-avc") if aviso_txt else ""
    return (f'<aside class="d2" role="dialog" aria-label="Corregir {numero}"><div class="d2-h"><span class="rq-t"><b>Corregir {numero}</b>'
            f'<span class="rq-ver">{version}</span></span><span class="rq-ac">{botones_corregir(guardando)}</span></div>'
            f'<p class="rq-linea">{linea_gris}</p>{av}<div class="d2-b" role="form" aria-label="Corregir {numero}">{cuerpo}</div></aside>')


def banda(numero, *, version, linea_gris, estado=None, marca="", acciones="", nav=None, titulo=None, volver="FRM-Respuestas-21.dc.html"):
    """La banda de la pantalla completa, como la de F1: el número (o «Corregir …»), la versión, el estado y «Corregida»; debajo, la
    línea gris; a la derecha, sus acciones y, si hay, ↑ ↓."""
    nv = ""
    if nav:
        pos, anterior = nav
        nv = (f'<span class="rc-pos">{pos}</span>'
              f'<button type="button" class="nv" aria-label="Respuesta anterior"{"" if anterior else " disabled"}>{R.SVG_ARRIBA}</button>'
              f'<button type="button" class="nv" aria-label="Respuesta siguiente">{R.SVG_ABAJO}</button>')
    mc = f'<span class="rq-mc">{marca}</span>' if marca else ""
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="{volver}" aria-label="Volver a las respuestas">{SVG_VOLVER}</a>'
            f'<div><div class="rq-ht"><h1>{titulo or numero}</h1><span class="rq-ver">{version}</span>{R._est(estado)}{mc}</div>'
            f'<p class="res">{linea_gris}</p></div></div><div class="ac">{acciones}{nv}</div></div>')


def decidir_apagado(motivo_txt, abierto=False):
    tip = b2.tip(motivo_txt, "b2-tip-abajo") if abierto else ""
    return (f'<span class="rq-apag"><button type="button" class="cb cb-sec" aria-disabled="true">Rechazar</button></span>'
            f'<span class="rq-apag"><button type="button" class="cb cb-pri" aria-disabled="true">Aprobar</button>{tip}</span>')


def keb_abierto(html, opciones, clase="ib"):
    """El ⋮ «Más acciones» abierto, con sus opciones (209)."""
    viejo = (f'<button type="button" class="{clase}" aria-label="Más acciones" title="Más acciones" aria-haspopup="menu" '
             f'aria-expanded="false">{SVG_KEB}</button>')
    assert html.count(viejo) == 1, html.count(viejo)
    return html.replace(viejo, '<span class="ra-kw">' + viejo.replace('"false"', '"true"') + R.menu_fila(opciones) + "</span>")


def m_anular():
    return (SVG_ANULAR, "Anular", "pel", None)


def corregir_tel(numero, cuerpo, *, linea_gris, version="Versión 4", aviso_txt=None, volver="M-FRM-Respuestas-21.dc.html", desplazar=0):
    """Corregir en el teléfono (266): el título con la versión activa, la línea gris, la respuesta en una columna con el motivo al
    final y «Cancelar» y «Guardar corrección» fijos abajo; sin ⋮, flechas ni actividad."""
    if desplazar:
        cuerpo = f'<div class="rq-desp" style="margin-top: -{desplazar}px;">{cuerpo}</div>'
    av = aviso_info(aviso_txt, "rq-avt") if aviso_txt else ""
    return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{volver}">{SVG_VOLVER}</a><div class="tit">'
            f'<h1>Corregir {numero}<span class="rq-ver">{version}</span></h1></div></div><p class="rq-quien">{linea_gris}</p>'
            f'<div class="tr-scroll">{av}<div class="rf-cor">{cuerpo}</div></div><div class="ap-fijo">{botones_corregir(tel=True)}</div>')


# ---------------------------------------------------------------------------------------------------------------- la planilla
def filas_pl(c):
    return {re.search(r">(VIS-\d+)</a>", m.group(0)).group(1): m.group(0) for m in re.finditer(r'<div class="w-tr pl[^"]*">.*?</div>', c, re.S)}


def reordenar(c, orden, extra=None):
    """Las filas de la planilla en el orden de `orden`; `extra` suma filas de otra página (264)."""
    fs = list(re.finditer(r'<div class="w-tr pl[^"]*">.*?</div>', c, re.S))
    por = {re.search(r">(VIS-\d+)</a>", m.group(0)).group(1): m.group(0).replace(' sel"', '"') for m in fs}
    por.update(extra or {})
    a, b = fs[0].start(), fs[-1].end()
    return c[:a] + "".join(por[n] for n in orden) + c[b:]


def con_filtros(c, propias=False):
    """Como la planilla de la E20, «Canal» (y en lo propio, «Empresa») van antes de «Estado», cada uno con su botón (262)."""
    i = c.find('<div class="w-caja o-fb pl-fb">')
    if i < 0:
        return c
    j = cierre(c, i, "div")
    barra = c[i:j]
    if "aria-haspopup=\"listbox\">Canal " in barra:
        return c
    m = re.search(r'<span class="f-env"><span class="w-pil[^"]*" role="button" aria-haspopup="listbox">Estado[^<]* (<svg.*?</svg>)</span>', barra, re.S)
    svg = m.group(1)

    def env(nombre):
        return f'<span class="f-env"><span class="w-pil" role="button" aria-haspopup="listbox">{nombre} {svg}</span></span>'

    nuevos = (env("Empresa") if propias else "") + env("Canal")
    assert propias or "listbox\">Empresa " in barra
    barra = barra[:m.start()] + nuevos + barra[m.start():]
    return c[:i] + barra + c[j:]


def sin_menu_viejo(c):
    i = c.find('<span class="f-mn"')
    if i < 0:
        return c
    return c[:i] + c[cierre(c, i, "span"):]


def lista_estado(elegida="Todos los estados"):
    """El filtro «Estado» en la pieza (262): «Todos los estados» primero y separado, y los demás por el circuito, sin cantidades."""
    return b2.lista([b2.op(o, elegida=o == elegida, activa=o == elegida, sep=k == 1) for k, o in enumerate(ESTADOS)], barra=True)


def planilla(c, *, listas=None, pop="", orden=ORDEN_RECIBIDA, por="Recibida", sentido="descending", propias=False):
    """La planilla con la barra de la E19 (cada filtro con su botón y «Ordenar por» último) y la flecha en el encabezado (264)."""
    if '<div class="w-caja o-fb pl-fb">' not in c:
        return c
    c = P19.con_barra(con_filtros(sin_menu_viejo(c), propias), orden, pop, listas)
    return P19.con_flecha(c, por, sentido)


def cola(c, abierta=None):
    """La cola «Por aprobar» (148): no ordena (264); «Revisar» pasa al ⋮ de cada fila (261)."""
    viejo = '<span><a class="cb cb-sec" href="FRM-Respuesta-Aprobacion.dc.html">Revisar</a></span>'
    assert viejo in c

    def fila(m):
        f = m.group(0)
        n = re.search(r">(VIS-\d+)</a>", f).group(1)
        exp = "true" if n == abierta else "false"
        menu = R.menu_fila([(SVG_VER, "Revisar", "", APROB)]) if n == abierta else ""
        boton = (f'<span><span class="ra-kw"><button type="button" class="ib" aria-label="Acciones de {n}" aria-haspopup="menu" '
                 f'aria-expanded="{exp}">{SVG_KEB}</button>{menu}</span></span>')
        return f.replace(viejo, boton)

    c = re.sub(r'<div class="w-tr pl[^"]*">.*?</div>', fila, c, flags=re.S)
    c = c.replace("<span>Rol</span><span></span></div>", '<span>Rol</span><span><span class="sr">Acciones</span></span></div>')
    c = re.sub(r'(class="w-caja pl-caja pa-cola" style="--pl-cols: [^;]*?)110px;', r"\g<1>56px;", c)
    assert viejo not in c and "110px;" not in c[c.find("pa-cola"):c.find("pa-cola") + 120]
    return c


def pop_orden(cols, elegida="Recibida", orden=RECIENTE):
    return P19.pop_orden(cols, elegida, orden)


def celdas(fila):
    _, hs, _ = b2.hijos(fila)
    return [re.match(r"<span[^>]*>(.*)</span>$", h, re.S).group(1) for h in hs]


def editar_fila(c, numero, f):
    k = c.index(f">{numero}</a>")
    i = c.rindex('<div class="w-tr pl', 0, k)
    j = b2.fin_div(c, i)
    abre, hs, cierra = b2.hijos(c[i:j])
    return c[:i] + abre + "".join(f(hs)) + cierra + c[j:]


def _cols_ancho(c, f):
    m = re.search(r'(<div class="w-caja pl-caja[^"]*" style="--pl-cols: )([^;]*)(;)', c)
    anchos = m.group(2).split(" ")
    return c[:m.start(2)] + " ".join(f(anchos)) + c[m.end(2):]


def sumar_col(c, titulo, despues, valor):
    """Una columna más en la planilla, después de la columna `despues` (por su título); `valor(número)` da su celda."""
    th = re.search(r'<div class="w-th pl">.*?</div>', c, re.S)
    abre, hs, cierra = b2.hijos(th.group(0))
    k = next(i for i, h in enumerate(hs) if re.sub(r"<[^>]+>", "", h) == despues)
    hs.insert(k + 1, f"<span>{titulo}</span>")
    c = c[:th.start()] + abre + "".join(hs) + cierra + c[th.end():]
    c = _cols_ancho(c, lambda a: a[:k + 1] + ["104px"] + a[k + 1:])

    def fila(m):
        a, hs2, z = b2.hijos(m.group(0))
        n = re.search(r">(VIS-\d+)</a>", m.group(0)).group(1)
        hs2.insert(k + 1, valor(n))
        return a + "".join(hs2) + z

    return re.sub(r'<div class="w-tr pl[^"]*">.*?</div>', fila, c, flags=re.S)


def quitar_col(c, titulo):
    th = re.search(r'<div class="w-th pl">.*?</div>', c, re.S)
    abre, hs, cierra = b2.hijos(th.group(0))
    k = next(i for i, h in enumerate(hs) if re.sub(r"<[^>]+>", "", h) == titulo)
    del hs[k]
    c = c[:th.start()] + abre + "".join(hs) + cierra + c[th.end():]
    c = _cols_ancho(c, lambda a: a[:k] + a[k + 1:])

    def fila(m):
        a, hs2, z = b2.hijos(m.group(0))
        del hs2[k]
        return a + "".join(hs2) + z

    return re.sub(r'<div class="w-tr pl[^"]*">.*?</div>', fila, c, flags=re.S)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
GRIS = 'style="color: var(--t3);"'


def _tel(v):
    v = re.sub(r'<span class="tx">(.*?)</span>', lambda m: m.group(1), v)
    return v.replace('class="pl-g"', GRIS)


def tarjetas(c_compu, numeros, campos, href):
    """Cada fila de la planilla, una tarjeta con cada dato con su nombre (263): `campos` son (nombre, índice de la celda)."""
    fs = filas_pl(c_compu)
    out = []
    for n in numeros:
        cs = celdas(fs[n])
        out.append(b2.tarjeta(n, [(k, _tel(cs[i]) or f'<span {GRIS}>—</span>') for k, i in campos], href=href))
    return "".join(out)


def lista_tel(viejo, tarjetas_html, orden=ORDEN_RECIBIDA, ordenar=True):
    """La lista del teléfono: la cabeza de antes, «Ordenar por» arriba y a lo ancho (264) y las tarjetas."""
    i = viejo.index('<div class="ap-cuerpo">')
    j = b2.fin_div(viejo, i)
    boton = f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">{orden} {b2.SVG_FLECHA}</button></div>' if ordenar else ""
    return viejo[:i] + boton + f'<div class="ap-cuerpo">{tarjetas_html}</div>' + viejo[j:]


def volver_svg(t):
    return re.search(r'<a class="ap-ib" aria-label="Volver" href="[^"]+">(<svg.*?</svg>)</a>', t, re.S).group(1)


# ---------------------------------------------------------------------------------------------------------------- los tableros
def leer(nombre):
    return R.leer(nombre)


VIEJOS = {}


def viejo(nombre):
    """Lo de antes de cada tablero, leído una sola vez antes de escribir nada."""
    if nombre not in VIEJOS:
        t, _ = leer(nombre)
        assert MARCA not in t, f"{nombre} ya está redibujado: restaurá juntos los tableros de este generador"
        VIEJOS[nombre] = (t, R.viejos_tel(t)[4] if nombre.startswith("M-") else R.viejos_compu(t)[2])
    return VIEJOS[nombre]


def con_css(t, css, marca=MARCA):
    assert marca not in t
    return t.replace("</helmet>", f"{marca}\n{css}</style>\n</helmet>", 1)


def rehacer_compu(nombre, estados, alto, vals):
    t, nl = leer(nombre)
    assert MARCA not in t, f"{nombre} ya tiene el bloque: restauralo antes de volver a correr"
    i, j, _ = R.viejos_compu(t)
    partes = []
    for clave in ("banda", "cuerpo", "aside", "capa"):
        partes += [R._sc(k, p[clave]) for k, (_, p) in enumerate(estados) if p.get(clave)]
    t = t[:i] + "".join(partes) + t[j:]
    css = CSS_COMPU + (f"/* F2 · El tablero crece para leer la pantalla completa entera. */\n.w-app {{ height: {alto}px !important; }}\n"
                       if alto > 900 else "")
    t = R.con_script(con_css(R.con_titulo(t), css), [n for n, _ in estados], 1440, alto, vals)
    R.escribir(nombre, t, nl)


def rehacer_tel(nombre, estados):
    t, nl = leer(nombre)
    assert MARCA not in t, f"{nombre} ya tiene el bloque: restauralo antes de volver a correr"
    i, j, k, l, _ = R.viejos_tel(t)
    cuerpos = "".join(R._sc(n, p["cuerpo"]) for n, (_, p) in enumerate(estados))
    capas = "".join(R._sc(n, p["capa"]) for n, (_, p) in enumerate(estados) if p.get("capa"))
    t = t[:i] + cuerpos + t[j:k] + R.RAYA + capas + t[l:]
    t = R.con_script(con_css(R.con_titulo(t), CSS_TEL), [n for n, _ in estados], 390, 844, None)
    R.escribir(nombre, t, nl)


def anular_svg():
    global SVG_ANULAR
    t, v = viejo("FRM-Respuesta-Anular")
    SVG_ANULAR = re.search(r'<span class="f-mi pel" role="menuitem">(<svg.*?</svg>) Anular</span>', v["aside"]["Más acciones: menú"], re.S).group(1)


# ------------------------------------------------------------------------------------- FRM-Respuestas-21 (la planilla de la E21)
def p21():
    """Las planillas de `FRM-Respuestas-21` redibujadas, por estado: las usan también Corregir, Anular y la planilla de atrás."""
    _, v = viejo("FRM-Respuestas-21")
    c = v["cuerpo"]
    todas = c["Todas"]
    extra = {"VIS-000108": filas_pl(c["Por resolver"])["VIS-000108"]}
    return {
        "Por aprobar": cola(c["Por aprobar"]),
        "Por aprobar: el ⋮": cola(c["Por aprobar"], "VIS-000123"),
        "Desde la campana": R.seleccionar(cola(c["Desde la campana"]), "VIS-000123"),
        "Todas": planilla(todas),
        "Ordenar por abierto": planilla(todas, pop=pop_orden(COLS_21)),
        "Ordenado por Estado": planilla(reordenar(todas, POR_ESTADO_21, extra), orden=ORDEN_ESTADO, por="Estado", sentido="ascending"),
        "Ordenado por Reglas": planilla(reordenar(todas, POR_REGLAS_21, extra), orden=ORDEN_REGLAS, por="Reglas", sentido="ascending"),
        "Por resolver": planilla(c["Por resolver"]),
        "Por resolver: vacía": planilla(c["Por resolver: vacía"]),
        "Estado: menú": planilla(c["Estado: menú"], listas={"Estado": lista_estado()}),
        "Estado: Anulada": planilla(c["Estado: Anulada"]),
        "Quien solo ve respuestas": planilla(c["Quien solo ve respuestas"]),
        "Quien solo aprueba": cola(c["Quien solo aprueba"]),
        "Quien solo aprueba: la decisión": R.seleccionar(cola(c["Quien solo aprueba: la decisión"]), "VIS-000123"),
    }


def vista_solo_aprueba():
    """Quien solo aprueba (100): la tarea, con «Rechazar» y «Aprobar», sin valores, nombres ni pantalla completa."""
    h = R.vista_rapida("VIS-000123", R.actividad_recuadros(ACT123_SOLO), linea_gris=L123_SOLO, pestana="Actividad", estado=POR,
                       version="Versión 3", anterior=False, arriba=R.decision(), pie="1 de 3 por aprobar")
    tabs = re.search(r'<div class="o-tabs rq-tabs" role="tablist">.*?</div>', h, re.S).group(0)
    return h.replace(tabs, '<div class="o-tabs rq-tabs" role="tablist"><span role="tab" aria-selected="true" class="on">Actividad</span></div>')


def frm_respuestas_21():
    _, v = viejo("FRM-Respuestas-21")
    bnd, capa = v["banda"], v["capa"]
    pl = p21()
    campana = R.vista_rapida("VIS-000123", R.respuesta(VIS123, 2), linea_gris=L123, estado=POR, version="Versión 3", lapiz=True,
                             completa=APROB, conversacion="WA-Chats-Avisos.dc.html", keb=True, anterior=False, arriba=R.decision(),
                             pie="1 de 3 por aprobar")
    solo = vista_solo_aprueba()
    b = bnd["Todas"]
    estados = [
        ("Por aprobar", dict(banda=bnd["Por aprobar"], cuerpo=pl["Por aprobar"])),
        ("Por aprobar: el ⋮", dict(banda=bnd["Por aprobar"], cuerpo=pl["Por aprobar: el ⋮"])),
        ("Desde la campana", dict(banda=bnd["Desde la campana"], cuerpo=pl["Desde la campana"], aside=campana)),
        ("Todas", dict(banda=b, cuerpo=pl["Todas"])),
        ("Ordenar por abierto", dict(banda=b, cuerpo=pl["Ordenar por abierto"])),
        ("Ordenado por Estado", dict(banda=b, cuerpo=pl["Ordenado por Estado"])),
        ("Ordenado por Reglas", dict(banda=b, cuerpo=pl["Ordenado por Reglas"])),
        ("Por resolver", dict(banda=bnd["Por resolver"], cuerpo=pl["Por resolver"])),
        ("Por resolver: vacía", dict(banda=bnd["Por resolver: vacía"], cuerpo=pl["Por resolver: vacía"])),
        ("Estado: menú", dict(banda=bnd["Estado: menú"], cuerpo=pl["Estado: menú"])),
        ("Estado: Anulada", dict(banda=bnd["Estado: Anulada"], cuerpo=pl["Estado: Anulada"])),
        ("Quien solo ve respuestas", dict(banda=bnd["Quien solo ve respuestas"], cuerpo=pl["Quien solo ve respuestas"])),
        ("Quien solo aprueba", dict(banda=bnd["Quien solo aprueba"], cuerpo=pl["Quien solo aprueba"])),
        ("Quien solo aprueba: la decisión", dict(banda=bnd["Quien solo aprueba: la decisión"], cuerpo=pl["Quien solo aprueba: la decisión"],
                                                 aside=solo)),
        ("Quien solo aprueba: confirmar", dict(banda=bnd["Quien solo aprueba: confirmar"], cuerpo=pl["Quien solo aprueba: la decisión"],
                                               aside=solo, capa=capa["Quien solo aprueba: confirmar"])),
    ]
    nombres = [n for n, _ in estados]

    def quien(n):
        if n.startswith("Quien solo aprueba"):
            return "Martín Paz", "M", "martin.paz@delta.ejemplo.com"
        if n == "Quien solo ve respuestas":
            return "Ana Gómez", "A", "ana.gomez@delta.ejemplo.com"
        return "Lucía Fernández", "L", "lucia.fernandez@delta.ejemplo.com"

    vals = {"miga": [MIGA] * len(nombres), "yo": [quien(n)[0] for n in nombres], "yoIni": [quien(n)[1] for n in nombres],
            "yoCorreo": [quien(n)[2] for n in nombres]}
    rehacer_compu("FRM-Respuestas-21", estados, 900, vals)


# «Filtros» en el teléfono, como el de `M-FRM-Respuestas-20` (E19 y E20): cada filtro con su nombre y la pieza; un número o una
# fecha, «Desde» y «Hasta»; sin la ubicación ni los archivos, que no se filtran (143 y E20).
FILTROS_TEL = [("pieza", "Empresa", "Todas las empresas"), ("pieza", "Canal", "Todos los canales"), ("pieza", "Estado", "Todos los estados"),
               ("pieza", "Recibida", "Todas las fechas"), ("pieza", "¿Se concretó la venta?", "Todas"), ("pieza", "Motivo", "Todas"),
               ("pieza", "Fallas", "Todas"), ("rango", "Monto estimado"), ("rango", "Fecha de la visita"), ("pieza", "Cargó", "Todas"),
               ("pieza", "Versión del formulario", "Todas")]


def con_boton_filtros(cuerpo, svg):
    """El ícono «Filtros» en la barra de la lista, antes del ⋮ (como `M-FRM-Respuestas-20`)."""
    keb = '<button type="button" class="ap-ib" aria-label="Acciones de Visita a cliente">'
    assert cuerpo.count(keb) == 1
    return cuerpo.replace(keb, f'<a class="ap-ib" aria-label="Filtros" href="M-FRM-Respuestas-21.dc.html">{svg}</a>' + keb, 1)


CAMPOS_TODAS = [("Recibida", 3), ("Estado", 1), ("Reglas", 2), ("Cargó", 4), ("Canal", 6), ("Cliente", 7)]
TODAS_21 = ["VIS-000130", "VIS-000129", "VIS-000128", "VIS-000127", "VIS-000126", "VIS-000125", "VIS-000124", "VIS-000123", "VIS-000122",
            "VIS-000121"]


def m_frm_respuestas_21():
    t, v = viejo("M-FRM-Respuestas-21")
    c = v["cuerpo"]
    pl = p21()
    href = "M-FRM-Respuesta-Aprobacion.dc.html"
    cola_tj = tarjetas(pl["Por aprobar"], ["VIS-000123", "VIS-000127", "VIS-000130"], [("Recibida", 3), ("Cargó", 1), ("Es cliente", 2),
                                                                                    ("Rol", 4)], href)
    todas = tarjetas(pl["Todas"], TODAS_21, CAMPOS_TODAS, href)
    por_estado = tarjetas(pl["Ordenado por Estado"], POR_ESTADO_21, CAMPOS_TODAS, href)
    resolver = tarjetas(pl["Por resolver"], ["VIS-000122", "VIS-000108"], CAMPOS_TODAS, href)
    solo = tarjetas(pl["Quien solo aprueba"], ["VIS-000123", "VIS-000127", "VIS-000130"], [("Recibida", 1), ("Rol", 2)], href)
    vol = volver_svg(t)
    ordenar = e14l.pantalla_ordenar(vol, "M-FRM-Respuestas-21", "Recibida", RECIENTE)
    columna = b2.pk_tel("Columna", [(n, None, n == "Recibida", None) for n in COLS_21])
    t20, _ = leer("M-FRM-Respuestas-20")
    svg_f = re.search(r'<button type="button" class="ap-ib" aria-label="Filtros">(<svg.*?</svg>)</button>', t20, re.S).group(1)
    filtros = P19.filtros_tel("M-FRM-Respuestas-21", vol, FILTROS_TEL).replace(
        '<span class="sub">Pedido de materiales</span>', '<span class="sub">Visita a cliente</span>', 1)
    assert "Visita a cliente" in filtros
    estado = b2.pk_tel("Estado", [(o, None, k == 0, None, k == 1) for k, o in enumerate(ESTADOS)])
    planilla_tel = {n: con_boton_filtros(c[n], svg_f) for n in ("Todas", "Por resolver")}
    estados = [
        ("Por aprobar", dict(cuerpo=lista_tel(c["Por aprobar"], cola_tj, ordenar=False))),
        ("Todas", dict(cuerpo=lista_tel(planilla_tel["Todas"], todas))),
        ("Ordenar por", dict(cuerpo=ordenar)),
        ("Ordenar por: columna", dict(cuerpo=ordenar + columna)),
        ("Ordenado por Estado", dict(cuerpo=lista_tel(planilla_tel["Todas"], por_estado, ORDEN_ESTADO))),
        ("Filtros", dict(cuerpo=filtros)),
        ("Filtros: Estado", dict(cuerpo=filtros + estado)),
        ("Por resolver", dict(cuerpo=lista_tel(planilla_tel["Por resolver"], resolver))),
        ("Quien solo aprueba", dict(cuerpo=lista_tel(c["Quien solo aprueba"], solo, ordenar=False))),
    ]
    rehacer_tel("M-FRM-Respuestas-21", estados)


# ------------------------------------------------------------------------------------------------- FRM-Respuesta-Corregir
def frm_respuesta_corregir():
    _, v = viejo("FRM-Respuesta-Corregir")
    bnd, cpo, capa = v["banda"], v["cuerpo"], v["capa"]
    pl = p21()
    todas126 = R.seleccionar(pl["Todas"], "VIS-000126")
    conv = CONV

    def resp_ed(cols, cambiado=False):
        zs = editable(VIS126, {"Monto estimado": "130.000,00"} if cambiado else None, {"Monto estimado": "125.500,00"} if cambiado else None)
        return respuesta_ed(zs, cols)

    def completa_ed(mot, guardando=False, titulo_banda=True):
        return dict(banda=banda("VIS-000126", titulo="Corregir VIS-000126", version="Versión 4", linea_gris=L126,
                                acciones=botones_corregir(guardando) if titulo_banda else ""),
                    cuerpo=R.cuerpo_completa(con_motivo(resp_ed(3, True), mot), ""))

    acc_126 = R.acciones_banda(True, False, conv, True, True)
    respuesta_126 = dict(banda=banda("VIS-000126", version="Versión 4", linea_gris=L126, estado=APR, acciones=acc_126, nav=("5 de 10", True)),
                         cuerpo=R.cuerpo_completa(R.respuesta(VIS126, 3), R.actividad_tabla(R.act126(), REV)))
    menu_126 = dict(respuesta_126, banda=keb_abierto(respuesta_126["banda"], [m_anular()], "ib rq-bk"))

    # Corregida: «Por aprobar» otra vez, «Corregida» junto al estado, la línea gris con quién la corrigió (E21).
    acc_c = ('<a class="cb cb-sec" href="FRM-Respuesta-Corregir.dc.html">Corregir</a>' + decidir_apagado(SIN_DECIDIR_C)
             + R.acciones_banda(False, False, conv, False, True))
    corregida = dict(banda=banda("VIS-000126", version="Versión 4", linea_gris=L126C, estado=POR, marca="Corregida", acciones=acc_c,
                                 nav=("5 de 10", True)),
                     cuerpo=R.cuerpo_completa(R.respuesta(VIS126C, 3), R.actividad_tabla(act126_corregida(), REV)),
                     capa=capa["Corregida"])

    # La planilla con la columna «Corregida», después de «Reglas», y VIS-000126 otra vez por aprobar (206).
    def fila126(hs):
        hs[1] = '<span><span class="w-est pend">Por aprobar</span></span>'
        hs[9] = '<span class="r">130.000,00</span>'
        hs[-1] = "<span></span>"
        return hs

    pl_c = sumar_col(pl["Todas"], "Corregida", "Reglas", lambda n: "<span>Sí</span>" if n == "VIS-000126" else '<span><span class="pl-g">—</span></span>')
    pl_c = R.seleccionar(editar_fila(pl_c, "VIS-000126", fila126), "VIS-000126").replace("Por aprobar (3)", "Por aprobar (4)")
    vr_c = R.vista_rapida("VIS-000126", R.actividad_recuadros(act126_corregida(), REV, 3), linea_gris=L126C, pestana="Actividad",
                          estado=POR, version="Versión 4", lapiz=True, completa=YO, conversacion=conv, keb=True,
                          arriba=R.decision(SIN_DECIDIR_C), pie="5 de 10")
    vr_c = vr_c.replace(R._est(POR), R._est(POR) + '<span class="rq-mc">Corregida</span>', 1)

    # Otra versión: VIS-000123 se cargó con la versión 3 y se corrige con la 4 (266).
    zs123 = editable(R.visita("Ferretería Rosales", "13/10/2026", "", None, "No", "0,00", "Seguimiento", "", "", [], ""))
    otra = dict(banda=banda("VIS-000123", titulo="Corregir VIS-000123", version="Versión 4", linea_gris=L123, acciones=botones_corregir()),
                cuerpo=R.cuerpo_completa(con_motivo(respuesta_ed(zs123, 3), motivo()), "", aviso_info(VERSION_C)))

    anterior = dict(banda=banda("VIS-000126", version="Versión 4", linea_gris=L126, estado=("off", "Reemplazada")),
                    cuerpo=R.cuerpo_completa(R.respuesta(VIS126, 3), R.actividad_tabla(R.act126(), REV),
                                             aviso_info(ANTERIOR_TXT, enlace=("Ver la actual", YO))))
    ya_no = dict(banda=banda("VIS-000126", titulo="Corregir VIS-000126", version="Versión 4", linea_gris=L126), cuerpo=cpo["Ya no se puede corregir"])

    estados = [
        ("Respuesta", respuesta_126),
        ("Más acciones: menú", menu_126),
        ("Corregir en la vista rápida", dict(banda=bnd["Corregir: el panel"], cuerpo=todas126,
                                             aside=vista_corregir("VIS-000126", con_motivo(resp_ed(2), motivo()), linea_gris=L126))),
        ("Corregir", dict(banda=banda("VIS-000126", titulo="Corregir VIS-000126", version="Versión 4", linea_gris=L126,
                                      acciones=botones_corregir()),
                          cuerpo=R.cuerpo_completa(con_motivo(resp_ed(3), motivo()), ""))),
        ("Corregir: otra versión", otra),
        ("Con el motivo", completa_ed(motivo(MOTIVO_C))),
        ("Sin el motivo", completa_ed(motivo(error=True))),
        ("Guardando", completa_ed(motivo(MOTIVO_C), guardando=True)),
        ("¿Descartar la corrección?", dict(completa_ed(motivo(MOTIVO_C)), capa=capa["¿Descartar la corrección?"])),
        ("Corregida", corregida),
        ("Corregida: la planilla", dict(banda=bnd["Corregida: la planilla"], cuerpo=pl_c, aside=vr_c, capa=capa["Corregida: la planilla"])),
        ("Ya no se puede corregir", ya_no),
        ("La versión anterior", anterior),
    ]
    migas = [MIGA_ANTERIOR if n == "La versión anterior" else MIGA for n, _ in estados]
    rehacer_compu("FRM-Respuesta-Corregir", estados, 1500, {"miga": migas})
    # Sin ruta propia para corregir (266): la respuesta se corrige donde se lee.
    t, nl = leer("FRM-Respuesta-Corregir")
    ruta = "/org/formularios/:id/respuestas/:recordId/corregir · para aprobar</title>"
    assert ruta in t
    R.escribir("FRM-Respuesta-Corregir", t.replace(ruta, "/org/formularios/:id/respuestas?respuesta=VIS-000126 · para aprobar</title>"), nl)


def m_frm_respuesta_corregir():
    _, v = viejo("M-FRM-Respuesta-Corregir")
    capa = v["capa"]

    def pag(cuerpo, *, estado=APR, linea_gris=L126, fijo="", marca=False):
        h = R.pagina_tel("VIS-000126", cuerpo, version="Versión 4", linea_gris=linea_gris, estado=estado, pos="5 de 10", anterior=True,
                         conversacion=CONV_TEL, lapiz=True, keb=True, fijo=fijo, volver="M-FRM-Respuestas-21.dc.html")
        if marca:
            h = h.replace(f'<span class="rq-tsub">{R._est(estado)}</span>',
                          f'<span class="rq-tsub">{R._est(estado)}<span class="rq-mc">Corregida</span></span>', 1)
        return h

    resp = pag(R.respuesta(VIS126, 1, True) + R.actividad_tel(R.act126(), REV))
    zs = editable(VIS126, {"Monto estimado": "130.000,00"}, {"Monto estimado": "125.500,00"})
    ed = respuesta_ed(zs, 1, True)
    zs123 = editable(R.visita("Ferretería Rosales", "13/10/2026", "", None, "No", "0,00", "Seguimiento", "", "", [], ""))
    estados = [
        ("Respuesta", dict(cuerpo=resp)),
        ("Más acciones", dict(cuerpo=resp, capa=R.hoja_menu("Más acciones", [m_anular()]))),
        ("Corregir", dict(cuerpo=corregir_tel("VIS-000126", con_motivo(ed, motivo(MOTIVO_C)), linea_gris=L126))),
        ("Corregir: sin el motivo", dict(cuerpo=corregir_tel("VIS-000126", con_motivo(ed, motivo(error=True)), linea_gris=L126,
                                                             desplazar=980))),
        ("Corregir: otra versión", dict(cuerpo=corregir_tel("VIS-000123", con_motivo(respuesta_ed(zs123, 1, True), motivo()),
                                                            linea_gris=L123, aviso_txt=VERSION_C))),
        ("Corregida", dict(cuerpo=pag(R.actividad_tel(act126_corregida(), REV, 3), estado=POR, linea_gris=L126C,
                                      fijo=R.fijo_tel(SIN_DECIDIR_C), marca=True), capa=capa["Corregida"])),
    ]
    rehacer_tel("M-FRM-Respuesta-Corregir", estados)


# ------------------------------------------------------------------------------------------------- FRM-Respuesta-Anular
def planilla_anulada():
    """La planilla después de anular VIS-000127 (E21): sale de la lista y de los conteos; «Es cliente» se va, porque ninguna fila
    lo es, y entra VIS-000120 al final de la página."""
    _, va = viejo("FRM-Respuesta-Anular")
    pl = p21()
    c = pl["Todas"]
    viejas = filas_pl(va["cuerpo"]["Anulada"])
    hs = celdas(viejas["VIS-000120"])  # N°, Estado, Recibida, Cargó, Canal, Cliente, Monto, Motivo, PDF
    quien = re.search(r'<span class="pl-quien"[^>]*>.*?</span></span>', viejas["VIS-000120"], re.S).group(0)
    f120 = (f'<div class="w-tr pl"><span>{hs[0]}</span><span>{hs[1]}</span><span><span class="pl-g">—</span></span><span>{hs[2]}</span>'
            f'{quien}<span><span class="pl-g">—</span></span><span>{hs[4]}</span><span>{hs[5]}</span><span class="r">{hs[6]}</span>'
            f'<span>{hs[7]}</span><span>{hs[8]}</span></div>')
    orden = [n for n in TODAS_21 if n != "VIS-000127"] + ["VIS-000120"]
    c = reordenar(c, orden, {"VIS-000120": f120})
    c = quitar_col(c, "Es cliente")
    c = despues_de_anular(c)
    assert "1–10 de 24" in c
    return c.replace("1–10 de 24", "1–10 de 23")


def con_por_resolver(c):
    """«Por resolver (2)», la tercera vista (228), en una planilla de antes que no la tenía."""
    if "Por resolver (" in c:
        return c
    viejo = '<span class="" role="radio" aria-checked="false">Por aprobar (3)</span>'
    assert viejo in c
    return c.replace(viejo, viejo + '<span class="" role="radio" aria-checked="false">Por resolver (2)</span>', 1)


def despues_de_anular(c):
    c = c.replace('<span class="c">24</span>', '<span class="c">23</span>').replace("Por aprobar (3)", "Por aprobar (2)")
    assert '<span class="c">23</span>' in c and "Por aprobar (2)" in c
    return c


def frm_respuesta_anular():
    _, v = viejo("FRM-Respuesta-Anular")
    bnd, cpo, capa = v["banda"], v["cuerpo"], v["capa"]
    pl = p21()
    t127 = R.seleccionar(pl["Todas"], "VIS-000127")

    def vr(cuerpo, *, anulada=False, pestana="Respuesta", menu=False, pie="4 de 10"):
        h = R.vista_rapida("VIS-000127", cuerpo, linea_gris=L127, pestana=pestana, estado=ANU if anulada else POR, version="Versión 4",
                           lapiz=not anulada, completa=YO, conversacion="WA-Chats-Avisos.dc.html", keb=not anulada,
                           arriba="" if anulada else R.decision(), pie=pie)
        return keb_abierto(h, [m_anular()]) if menu else h

    q127 = vr(R.respuesta(VIS127, 2))
    # Con VIS-000127 ya anulada: cuenta 23 y «Por aprobar (2)», y «Por resolver (2)» sigue, porque no cuenta con los filtros (228).
    filtrada = despues_de_anular(con_por_resolver(cpo["Estado: Anulada"]))
    anu_pl = R.seleccionar(planilla(filtrada), "VIS-000127")
    pieza = planilla(filtrada, listas={"Estado": lista_estado("Anulada")})
    exportar = P19.con_grupos(capa["Exportar con las anuladas"])
    assert 'role="radio"' not in exportar
    estados = [
        ("Más acciones: menú", dict(banda=bnd["Más acciones: menú"], cuerpo=t127, aside=vr(R.respuesta(VIS127, 2), menu=True))),
        ("Anular", dict(banda=bnd["Anular"], cuerpo=t127, aside=q127, capa=capa["Anular"])),
        ("Anulando", dict(banda=bnd["Anulando"], cuerpo=t127, aside=q127, capa=capa["Anulando"])),
        ("Anulada", dict(banda=bnd["Anulada"], cuerpo=planilla_anulada(), capa=capa["Anulada"])),
        ("Estado: la pieza", dict(banda=bnd["Estado: Anulada"], cuerpo=pieza)),
        ("Estado: Anulada", dict(banda=bnd["Estado: Anulada"], cuerpo=anu_pl,
                                 aside=vr(R.respuesta(VIS127, 2), anulada=True, pie="1 de 2"))),
        ("Anulada: actividad", dict(banda=bnd["Estado: Anulada"], cuerpo=anu_pl,
                                    aside=vr(R.actividad_recuadros(act127(True), REV, 1), anulada=True, pestana="Actividad", pie="1 de 2"))),
        ("Exportar con las anuladas", dict(banda=bnd["Exportar con las anuladas"], cuerpo=pl["Todas"], capa=exportar)),
    ]
    rehacer_compu("FRM-Respuesta-Anular", estados, 900, {"miga": [MIGA] * len(estados)})


def m_frm_respuesta_anular():
    t, v = viejo("M-FRM-Respuesta-Anular")
    capa = v["capa"]
    t21, v21 = viejo("M-FRM-Respuestas-21")

    def pag(cuerpo, anulada=False):
        return R.pagina_tel("VIS-000127", cuerpo, version="Versión 4", linea_gris=L127, estado=ANU if anulada else POR,
                            pos="1 de 2" if anulada else "4 de 10", anterior=True, conversacion="M-WA-Conversacion-Avisos.dc.html",
                            lapiz=not anulada, keb=not anulada, fijo="" if anulada else R.fijo_tel(), volver="M-FRM-Respuestas-21.dc.html")

    resp = pag(R.respuesta(VIS127, 1, True) + R.actividad_tel(act127(), REV))
    c_anu = planilla_anulada()
    orden = [n for n in TODAS_21 if n != "VIS-000127"] + ["VIS-000120"]
    campos = [("Recibida", 3), ("Estado", 1), ("Reglas", 2), ("Cargó", 4), ("Canal", 5), ("Cliente", 6)]  # sin «Es cliente»
    cab = v21["cuerpo"]["Todas"].replace('<span class="c">24</span>', '<span class="c">23</span>').replace(
        "Por aprobar (3)", "Por aprobar (2)").replace("24 respuestas", "23 respuestas")
    lista = lista_tel(cab, tarjetas(c_anu, orden, campos, "M-FRM-Respuesta-Aprobacion.dc.html"))
    estados = [
        ("Más acciones", dict(cuerpo=resp, capa=R.hoja_menu("Más acciones", [m_anular()]))),
        ("Anular", dict(cuerpo=resp, capa=capa["Anular"])),
        ("Anulada", dict(cuerpo=lista, capa=capa["Anulada"])),
        ("Anulada: el detalle", dict(cuerpo=pag(R.respuesta(VIS127, 1, True) + R.actividad_tel(act127(True), REV), anulada=True))),
    ]
    rehacer_tel("M-FRM-Respuesta-Anular", estados)


# ------------------------------------------------------------------------------------------- FRM-Respuestas-Propias-21
PROPIAS = ["VIS-000126", "VIS-000123", "VIS-000117", "VIS-000114", "VIS-000111", "VIS-000108"]


def pp21():
    _, v = viejo("FRM-Respuestas-Propias-21")
    c = v["cuerpo"]["Lo suyo"]
    return {"Lo suyo": planilla(c, propias=True),
            "Ordenar por abierto": planilla(c, propias=True, pop=pop_orden(COLS_PROPIAS)),
            "Ordenado por Estado": planilla(reordenar(c, POR_ESTADO_PROPIAS), propias=True, orden=ORDEN_ESTADO, por="Estado",
                                            sentido="ascending")}


def frm_respuestas_propias_21():
    _, v = viejo("FRM-Respuestas-Propias-21")
    bnd = v["banda"]
    pl = pp21()
    yo = "FRM-Respuestas-Propias-21.dc.html"
    _, va = viejo("FRM-Respuesta-Aprobacion")
    visor = va["capa"]["Copia fija"]

    def vr(num, cuerpo, linea_gris, *, estado, version="Versión 4", puede=False, pestana="Respuesta", pie="1 de 6", bajar=False):
        h = R.vista_rapida(num, cuerpo, linea_gris=linea_gris, pestana=pestana, estado=estado, version=version, lapiz=puede,
                           completa=yo, bajar=bajar, keb=puede, anterior=pie != "1 de 6", pie=pie)
        # Lo propio se corrige en el mismo tablero («Corregir la rechazada»).
        return h.replace('href="FRM-Respuesta-Corregir.dc.html"', f'href="{yo}"')

    sel = {n: R.seleccionar(pl["Lo suyo"], n) for n in ("VIS-000117", "VIS-000123", "VIS-000126")}
    zs117 = editable(VIS117)
    ed117 = respuesta_ed(zs117, 2, nuevas={"Fotos de la visita": [("frente-obra.jpg", "2,4 MB")]})
    ed117 = antes_en(ed117, "Fotos de la visita", "sin respuesta")
    estados = [
        ("Lo suyo", dict(banda=bnd["Lo suyo"], cuerpo=pl["Lo suyo"])),
        ("Ordenar por abierto", dict(banda=bnd["Lo suyo"], cuerpo=pl["Ordenar por abierto"])),
        ("Ordenado por Estado", dict(banda=bnd["Lo suyo"], cuerpo=pl["Ordenado por Estado"])),
        ("Una rechazada", dict(banda=bnd["Una rechazada"], cuerpo=sel["VIS-000117"],
                               aside=vr("VIS-000117", R.respuesta(VIS117, 2), L117, estado=REC, puede=True, pie="3 de 6"))),
        ("Una rechazada: actividad", dict(banda=bnd["Una rechazada"], cuerpo=sel["VIS-000117"],
                                          aside=vr("VIS-000117", R.actividad_recuadros(ACT117_P), L117, estado=REC, puede=True,
                                                   pestana="Actividad", pie="3 de 6"))),
        ("Corregir la rechazada", dict(banda=bnd["Una rechazada"], cuerpo=sel["VIS-000117"],
                                       aside=vista_corregir("VIS-000117", con_motivo(ed117, motivo(MOTIVO_117)), linea_gris=L117))),
        ("Una por aprobar", dict(banda=bnd["Una por aprobar"], cuerpo=sel["VIS-000123"],
                                 aside=vr("VIS-000123", R.respuesta(VIS123, 2), L123, estado=POR, version="Versión 3", puede=True,
                                          pie="2 de 6"))),
        ("Ya aprobada", dict(banda=bnd["Ya aprobada"], cuerpo=sel["VIS-000126"],
                             aside=vr("VIS-000126", R.respuesta(VIS126, 2), L126, estado=APR, bajar=True))),
        ("Su PDF", dict(banda=bnd["Su PDF"], cuerpo=sel["VIS-000126"],
                        aside=vr("VIS-000126", R.actividad_recuadros(ACT126_P), L126, estado=APR, bajar=True, pestana="Actividad"),
                        capa=visor)),
    ]
    rehacer_compu("FRM-Respuestas-Propias-21", estados, 900, {"miga": [MIGA] * len(estados)})


def antes_en(h, nombre, antes):
    """«Antes: …» debajo de una pregunta de archivos que cambió (263)."""
    i = h.index(f'aria-label="{nombre}">')
    i = h.rindex('<div class="rf-q', 0, i)
    j = b2.fin_div(h, i)
    return h[:j - len("</div>")] + f'<span class="rf-antes">Antes: {antes}</span></div>' + h[j:]


def m_frm_respuestas_propias_21():
    t, v = viejo("M-FRM-Respuestas-Propias-21")
    c = v["cuerpo"]
    pl = pp21()
    href = re.search(r'<a class="ap-fila" href="([^"]+)"', c["Lo suyo"]).group(1)
    campos = [("Recibida", 3), ("Estado", 1), ("Reglas", 2), ("Canal", 4), ("Cliente", 5), ("Monto estimado", 6)]
    lista = lista_tel(c["Lo suyo"], tarjetas(pl["Lo suyo"], PROPIAS, campos, href))
    ordenar = e14l.pantalla_ordenar(volver_svg(t), "M-FRM-Respuestas-Propias-21", "Recibida", RECIENTE)
    volver = "M-FRM-Respuestas-Propias-21.dc.html"
    pag = R.pagina_tel("VIS-000117", R.respuesta(VIS117, 1, True) + R.actividad_tel(ACT117_P), version="Versión 4", linea_gris=L117,
                       estado=REC, pos="3 de 6", anterior=True, lapiz=True, keb=True, volver=volver)
    pag = pag.replace('href="M-FRM-Respuesta-Corregir.dc.html"', 'href="M-FRM-Respuestas-Propias-21.dc.html"')
    ed = respuesta_ed(editable(VIS117), 1, True, nuevas={"Fotos de la visita": [("frente-obra.jpg", "2,4 MB")]})
    ed = antes_en(ed, "Fotos de la visita", "sin respuesta")
    estados = [
        ("Lo suyo", dict(cuerpo=lista)),
        ("Ordenar por", dict(cuerpo=ordenar)),
        ("Una rechazada", dict(cuerpo=pag)),
        ("Corregir la rechazada", dict(cuerpo=corregir_tel("VIS-000117", con_motivo(ed, motivo(MOTIVO_117)), linea_gris=L117,
                                                           volver=volver, desplazar=900))),
    ]
    rehacer_tel("M-FRM-Respuestas-Propias-21", estados)


# ------------------------------------------------------------------------------- FRM-Respuestas-Propias (E20): «Una respuesta suya»
def frm_respuestas_propias():
    t, nl = leer("FRM-Respuestas-Propias")
    assert MARCA not in t, "FRM-Respuestas-Propias ya tiene el bloque"
    nombres = R._nombres_viejos(t)
    s = f"s{nombres.index('Una respuesta suya')}"
    l46 = "La cargó Tomás Acosta en la app el 15/10/2026, 12:32"
    vr = R.vista_rapida("PED-000046", R.respuesta(R.PED46, 2), linea_gris=l46, version="Versión 4", completa="FRM-Respuesta-20.dc.html",
                        anterior=False, pie="1 de 5")
    hechos = 0
    for i, j in reversed(e12e.sc_ifs(t, s)):
        bloque = t[i:j]
        a = bloque.index(">") + 1
        if not bloque[a:].lstrip().startswith("<aside"):
            continue
        k = bloque.index("</aside>") + len("</aside>")
        t = t[:i] + bloque[:a] + vr + bloque[k:] + t[j:]
        hechos += 1
    assert hechos == 1, hechos
    t = con_css(t, R.CSS_COMPU)
    R.escribir("FRM-Respuestas-Propias", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la planilla de atrás
CSS_FONDOS = "/* F2 · La planilla de atrás, con la barra y el encabezado de la planilla redibujada de su etapa (264 y 262). */\n" + CSS_BARRA


def barra_de(c):
    i = c.find('<div class="w-caja o-fb pl-fb">')
    return c[i:cierre(c, i, "div")] if i >= 0 else None


def fondo(nombre, referencia):
    """Cambia solo la barra y el encabezado de la planilla de atrás: la barra, como la de la planilla de su etapa; el encabezado, con
    la flecha de «Recibida». La cola «Por aprobar» queda como está (264)."""
    t, nl = leer(nombre)
    if MARCA_F in t:
        print(nombre, "ya tiene el bloque de la planilla de atrás: no hace nada")
        return False
    nombres = R._nombres_viejos(t)
    cambiados = 0
    for k, _ in enumerate(nombres):
        for i, j in reversed(e12e.sc_ifs(t, f"s{k}")):
            bloque = t[i:j]
            a = bloque.index(">") + 1
            if not bloque[a:].lstrip().startswith('<div class="w-body"') or barra_de(bloque) is None:
                continue
            nuevo = P19.con_flecha(P19.con_barra(con_filtros(bloque) if referencia.get("canal") else bloque), "Recibida")
            assert barra_de(nuevo) == referencia["barra"], (nombre, nombres[k])
            t = t[:i] + nuevo + t[j:]
            cambiados += 1
    t = con_css(t, CSS_FONDOS, MARCA_F)
    R.escribir(nombre, t, nl)
    print("  planilla de atrás:", nombre, cambiados, "estados")
    return True


def fondos():
    ref19 = {"barra": barra_de(next(iter(R.viejos_compu(leer("FRM-Respuestas-19")[0])[2]["cuerpo"].values())))}
    ref20 = {"barra": barra_de(next(iter(R.viejos_compu(leer("FRM-Respuestas-20")[0])[2]["cuerpo"].values())))}
    t21, _ = leer("FRM-Respuestas-21")
    assert MARCA in t21, "primero se redibuja FRM-Respuestas-21"
    ref21 = {"barra": barra_de(R.viejos_compu(t21)[2]["cuerpo"]["Todas"]), "canal": True}
    assert "Ordenar por" in ref19["barra"] and "Ordenar por" in ref20["barra"] and ">Canal " in ref21["barra"]
    hechos = []
    for nombre, ref in (("FRM-Respuesta-19", ref19), ("FRM-Respuesta-20", ref20), ("FRM-Cargar-Panel", ref20),
                        ("FRM-Respuesta-Aprobacion", ref21)):
        if fondo(nombre, ref):
            hechos.append(nombre)
    return hechos


# ---------------------------------------------------------------------------------------------------------------- todo
def panel(nombre):
    """El panel de «Gestión de formularios» en dos grupos (275), con `partir` de `e19_e25_registrar_1004.py`."""
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    nuevo, n = e14p.PANEL.subn(lambda m: partir(m.group(0)), t)
    if e14p.SEP in nuevo and e14p.BLOQUE not in nuevo:
        nuevo = nuevo.replace("</helmet>", e14p.CSS + "</helmet>", 1)
    if nuevo != t:
        ruta.write_text(nuevo, encoding="utf-8", newline="")
    print("ok panel", nombre, n, "(sin cambios)" if nuevo == t else "")


HACER = [("FRM-Respuestas-21", frm_respuestas_21), ("M-FRM-Respuestas-21", m_frm_respuestas_21),
         ("FRM-Respuesta-Corregir", frm_respuesta_corregir), ("M-FRM-Respuesta-Corregir", m_frm_respuesta_corregir),
         ("FRM-Respuesta-Anular", frm_respuesta_anular), ("M-FRM-Respuesta-Anular", m_frm_respuesta_anular),
         ("FRM-Respuestas-Propias-21", frm_respuestas_propias_21), ("M-FRM-Respuestas-Propias-21", m_frm_respuestas_propias_21),
         ("FRM-Respuestas-Propias", frm_respuestas_propias)]


def main():
    global PROJ
    copia = sys.argv[sys.argv.index("--copia") + 1] if "--copia" in sys.argv else None
    if copia:  # para probar: lee y escribe en una copia, sin la pasada de las piezas
        PROJ = R.PROJ = pathlib.Path(copia)
    hechos = []
    if "--solo-fondos" not in sys.argv:
        pendientes = [(n, f) for n, f in HACER if MARCA not in leer(n)[0]]
        for n, _f in HACER:
            if MARCA in leer(n)[0]:
                print(n, "ya tiene el bloque: no hace nada")
        if pendientes:
            # Todo lo de antes se lee primero, porque las planillas de un tablero las usan los demás; si alguno ya está redibujado,
            # `viejo` frena: se restauran juntos.
            for n, _f in HACER[:-1]:
                viejo(n)
            viejo("FRM-Respuesta-Aprobacion")
            anular_svg()
            for n, f in pendientes:
                f()
                hechos.append(n)
    hechos += fondos()
    if hechos and not copia:
        subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(hechos)], check=True)
        for n in hechos:
            if not n.startswith("M-"):
                panel(n)


if __name__ == "__main__":
    main()
