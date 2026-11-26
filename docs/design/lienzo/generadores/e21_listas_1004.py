"""Las listas de Formularios y los chats de la E20 y la E21 con el traspaso 18 (tanda 3B de Diseño, 2026-11-26), redibujados en su
lugar con la forma que la E14 dejó aprobada en la v186 (`FRM-Formularios` y `M-FRM-Formularios`, `e14_listados_1004.py`) y la de
`WA-Chats-Formulario` (`e14_chats_formulario_1004.py`):

- `FRM-Formularios-20`: «Cargar» deja de ser un botón en la fila y pasa a ser la primera opción del ⋮, con su ícono (261); uno solo
  para clientes lo muestra apagado, con su motivo en el tooltip (211). Un dato por columna (206 y 263): Formulario, Estado, Dónde se
  completa, Respuestas, Última respuesta y Recibida; quien solo carga, Mis cargas, Mi última carga y Recibida (153), cada una en su
  columna, con su ⋮ con «Cargar». El nombre abre el editor y el número de respuestas, la planilla (275). El filtro «Estado», con su
  botón y la pieza, sin cantidades (262); el encabezado ordena con la flecha en el color de la marca, y «Ordenar por» va último en la
  barra, separado del filtro (264). Las filas, por nombre de la A a la Z, como dice su flecha. Estados nuevos: «Quien solo carga:
  Cargar», «Ordenar por abierto» y «Ordenado por Recibida».
- `M-FRM-Formularios-20`: cada fila, una tarjeta con cada dato con su nombre, sin nada unido con «·» (263): Estado, Dónde se completa
  y Respuestas; quien solo carga, Mis cargas, Mi última carga y Recibida. «Cargar» sigue en la fila, al lado del ⋮ (261); el de uno
  solo para clientes, apagado con su motivo en un tooltip que abre el toque (211). «Ordenar por» arriba de la lista y su pantalla;
  «Filtros» con «Estado» en la pieza (262 y 264). El ⋮ de cada fila, con el ícono de cada acción y «Borrar» apagado con su motivo en
  el tooltip, sin texto debajo (211). Quien solo ve respuestas no tiene «Cargar», como en la compu. Detrás de «Reactivar», el
  formulario dado de baja queda como `M-FRM-Editor` de la E14: cada pregunta, una tarjeta con «Tipo» y «Obligatoria» (263), y «Para
  quién es» en la pieza (262). Estados nuevos: «Ordenar por» y «Uno solo para clientes».
- `FRM-Formularios-21`: lo mismo, más la columna «Por aprobar», solo para quien aprueba, cuyo número abre la planilla en «Por
  aprobar», y que es el orden con que le abre la lista, de mayor a menor (275). «En WhatsApp» pasa a «Estado» y se suma «Dónde se
  completa» (229). El filtro «Aprobación» se va: «Con algo por aprobar» es una opción de «Estado» (275), y con él sale el estado
  «Aprobación: menú». Quien solo aprueba ve Formulario y Por aprobar. Estados nuevos: «Quien solo carga: Cargar», «Ordenar por
  abierto» y «Ordenado por Formulario».
- `M-FRM-Formularios-21`: como `M-FRM-Formularios-20`, con «Por aprobar» en la tarjeta de quien aprueba y la tarjeta de quien solo
  aprueba. Manda la 263 sobre el pedido viejo de «Publicado · versión 4 · App» en la fila. «Filtros» pierde «Aprobación» (275).
- `Campana-21`: la lista de atrás es la de `FRM-Formularios-21` redibujada, con «Estado» y «Dónde se completa» (229).
- `WA-Chats-Formulario-20` y su teléfono: el formulario se elige con la pieza, que abre sin uno elegido, trae de a 20 y muestra solo el
  nombre (262 y 285); los que se completan solo en la app, apagados, con «Se completa solo en la app.» en el tooltip (211 y 229). Lo
  que se lee del elegido va en renglones (263). Ningún texto nombra un plazo fijo para el pedido de ubicación (270).
- `WA-Chats-Avisos` y `M-WA-Conversacion-Avisos`: el estado nuevo «Con una ubicación», con un aviso que cita la «Ubicación» con el
  punto y, en el renglón siguiente, el enlace al mapa (230).

Cambia los tableros en su lugar; el bloque `<style data-t3b="e21-listas">` lo frena si ya corrió. Al final corre
`traspaso10_piezas_1004.py --tableros` con los nueve, que pone la escala de la compu, y parte en dos grupos el panel «Gestión de
formularios» (275) de los tres de la compu que lo muestran. No toca `canvas.json`. `M-Campana-21` no cambia: es la lista de avisos,
sin la lista de formularios detrás.
"""
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_chats_formulario_1004 as e14cf  # noqa: E402
import e14_editor_1004 as e14e  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402
from e14_panel_1004 import BLOQUE as BLOQUE_PANEL, CATALOGOS, CSS as CSS_PANEL, PANEL, SEP, partir  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = '<style data-t3b="e21-listas">'
leer, escribir, una, fin_sc_if, props = e12l.leer, e12l.escribir, e12l.una, e12l.fin_sc_if, e12l.props
COMPU = ["FRM-Formularios-20", "FRM-Formularios-21", "Campana-21", "WA-Chats-Formulario-20", "WA-Chats-Avisos"]
TEL = ["M-FRM-Formularios-20", "M-FRM-Formularios-21", "M-WA-Chats-Formulario-20", "M-WA-Conversacion-Avisos"]
CON_PANEL = ["FRM-Formularios-20", "FRM-Formularios-21", "Campana-21"]


def V(nombre):
    return "{{" + nombre + "}}"


def sc(var, cuerpo, hint="no"):
    return f'<sc-if value="{V(var)}" hint-placeholder-val="{V(hint)}">{cuerpo}</sc-if>'


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def nuevo_guion(t, clase):
    """Cambia `class Component …` del script del tablero por `clase` (lo de las piezas, antes, lo rehace su pasada)."""
    i = t.index("class Component extends DCLogic {")
    j = t.index("</script>", i)
    return t[:i] + clase + t[j:]


# ---------------------------------------------------------------------------------------------------------------- los íconos
# Los íconos del ⋮, del (i) y de la barra, los de `FRM-Formularios-20` de la v175; «Cargar», nuevo en el ⋮ (261), con el mismo trazo.
_SVG = ('<svg class="mi-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">')
_TRAZO = ('<svg width="@@" height="@@" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true">')
IC = {
    "Cargar": _SVG + '<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5"/>'
                     '<path d="M12 11v6M9 14h6"/></svg>',
    "Editar": _SVG + '<path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    "Copiar": _SVG + '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    "Dar de baja": _SVG + '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/></svg>',
    "Borrar": _SVG + '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/></svg>',
    "Ver": _SVG + '<path d="M2.75 12S6 5.75 12 5.75 21.25 12 21.25 12 18 18.25 12 18.25 2.75 12 2.75 12Z"/><circle cx="12" cy="12" r="2.75"/></svg>',
    "Reactivar": _SVG + '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
    "keb": ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
            '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>'),
    "i": _TRAZO.replace("@@", "14") + '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/></svg>',
    "lupa": _TRAZO.replace("@@", "16") + '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/></svg>',
    "flecha": ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>'),
}

# ---------------------------------------------------------------------------------------------------------------- los datos
SOLO_CLIENTES = "Es solo para clientes: se responde por WhatsApp."
TIENE_RESP = "Tiene respuestas y no se puede borrar."
PUBLICANDO = "Se está publicando la versión 4."
TODAVIA = "Todavía no cargaste"
# Los formularios de la organización. `est` None es «Visita a cliente», que cambia con «Publicando» ({{estVis}}).
F = {
    "Pedido de materiales": dict(k="Ped", est=("", "Publicado · versión 4"), info=None, donde="App", preg="11", resp="46",
                                 ult="PED-000046", rec="15/10/2026, 12:32", cambio="15/10/2026, 12:10", mis="5", mult="PED-000046",
                                 mrec="15/10/2026, 12:32", cargar="si", pa=None),
    "Visita a cliente": dict(k="Vis", est=None, info=None, donde="App y WhatsApp", preg="7", resp="24", ult="VIS-000130",
                             rec="15/10/2026, 16:20", cambio="08/10/2026, 14:20", mis="6", mult="VIS-000126", mrec="13/10/2026, 15:30",
                             cargar="si", pa="3"),
    "Entrega de pedido": dict(k="Ent", est=("", "Publicado · versión 1"), info=None, donde="App y WhatsApp", preg="5", resp="48",
                              ult="ENT-000048", rec="14/10/2026, 10:05", cambio="02/10/2026, 09:15", mis="0", mult=None, mrec=None,
                              cargar="cliente", pa="1"),
    "Control de vehículo": dict(k="Con", est=("mal", "No se pudo publicar"), info="La versión 2 publicada sigue activa.",
                                donde="App y WhatsApp", preg="7", resp="31", ult="VEH-000031", rec="12/10/2026, 18:05",
                                cambio="12/10/2026, 17:40", mis="0", mult=None, mrec=None, cargar="si", pa=None),
    "Reclamo": dict(k="Rec", est=("off", "Borrador"), info=None, donde="App y WhatsApp", preg="4", resp="0", ult=None, rec=None,
                    cambio="14/10/2026, 11:05", mis=None, mult=None, mrec=None, cargar=None, pa=None),
    "Relevamiento de obra": dict(k="Rel", est=("baja", "De baja · versión 2"), info="Se deprecan en WhatsApp cuando venzan los 2 envíos abiertos.",
                                 donde="App y WhatsApp", preg="6", resp="12", ult="REL-000012", rec="30/09/2026, 10:15",
                                 cambio="09/10/2026, 16:30", mis="2", mult="REL-000012", mrec="30/09/2026, 10:15", cargar=None, pa=None),
}
ACTIVOS = sorted(n for n in F if n != "Relevamiento de obra")  # por nombre, de la A a la Z (264)
BAJA = ["Relevamiento de obra"]
PUBLICADOS = [n for n in ACTIVOS if n != "Reclamo"]
CARGA = ["Control de vehículo", "Pedido de materiales", "Visita a cliente"]  # lo que puede cargar quien solo carga


def fecha_clave(f):
    d, h = f.split(", ")
    dd, mm, aa = d.split("/")
    return aa + mm + dd + h


def por_recibida(nombres):
    """Más reciente primero; lo vacío al final (264)."""
    con = sorted((n for n in nombres if F[n]["rec"]), key=lambda n: fecha_clave(F[n]["rec"]), reverse=True)
    return con + [n for n in nombres if not F[n]["rec"]]


def por_aprobar(nombres):
    """De mayor a menor; lo vacío al final y, con el mismo valor, por nombre (264)."""
    con = sorted((n for n in nombres if F[n]["pa"]), key=lambda n: (-int(F[n]["pa"]), n))
    return con + sorted(n for n in nombres if not F[n]["pa"])


QUIEN = {"lucia": ["Lucía Fernández", "lucia.fernandez@delta.ejemplo.com", "L"],
         "lee": ["Julieta Sosa", "julieta.sosa@delta.ejemplo.com", "J"],
         "carga": ["Tomás Acosta", "tomas.acosta@delta.ejemplo.com", "T"],
         "aprueba": ["Martín Paz", "martin.paz@delta.ejemplo.com", "M"],
         "nadie": ["Tomás Acosta", "tomas.acosta@delta.ejemplo.com", "T"]}

# Las columnas de cada vista: (nombre, tipo). «ACC» es la del ⋮.
COLS = {
    "t20": [("Formulario", "txt"), ("Estado", "est"), ("Dónde se completa", "txt"), ("Respuestas", "num"), ("Última respuesta", "txt"),
            ("Recibida", "fecha"), ("ACC", None)],
    "t21": [("Formulario", "txt"), ("Estado", "est"), ("Dónde se completa", "txt"), ("Por aprobar", "num"), ("Respuestas", "num"),
            ("Última respuesta", "txt"), ("Recibida", "fecha"), ("ACC", None)],
    "lee": [("Formulario", "txt"), ("Respuestas", "num"), ("Última respuesta", "txt"), ("Recibida", "fecha")],
    "lectura": [("Formulario", "txt"), ("Preguntas", "num"), ("Estado", "est"), ("Dónde se completa", "txt"), ("Último cambio", "fecha")],
    "carga": [("Formulario", "txt"), ("Mis cargas", "num"), ("Mi última carga", "txt"), ("Recibida", "fecha"), ("ACC", None)],
    "aprueba": [("Formulario", "txt"), ("Por aprobar", "num")],
}
CLASE = {"t20": "e20t", "t21": "e21t", "lee": "e2v", "lectura": "e2r", "carga": "e2c", "aprueba": "e2a"}
ORDEN = {"txt": ("de la A a la Z", "De la A a la Z", "ascending"), "num": ("de mayor a menor", "De mayor a menor", "descending"),
         "fecha": ("más reciente primero", "Más reciente primero", "descending"), "est": ("por el circuito", "Por el circuito", "ascending")}


def tipo_de(vista, col):
    return dict(COLS[vista])[col]


def texto_orden(vista, col):
    return f"Ordenar por: {col}, {ORDEN[tipo_de(vista, col)][0]}"


# Cada etapa: sus enlaces y sus bloques (vista, filas, columna que ordena). El de siempre va último: la pasada de las piezas copia en
# «Cargando» el último encabezado de antes.
ETAPAS = {
    "20": dict(
        compu="FRM-Formularios-20", tel="M-FRM-Formularios-20", pa=False, todas="t20",
        editor={"Pedido de materiales": "FRM-Editor-20", "Relevamiento de obra": "FRM-Editor-Baja", None: "FRM-Editor"},
        planilla={"Pedido de materiales": "FRM-Respuestas-20", None: "FRM-Respuestas"},
        respuesta={"Pedido de materiales": "FRM-Respuesta-20", None: "FRM-Respuesta"},
        propias="FRM-Respuestas-Propias", cargar="FRM-Cargar-Respuesta", baja="FRM-Dar-De-Baja", aprobar=None,
        filtro=["Activos", "Publicados", "Borradores", "Dados de baja"],
        bloques={"T_rec": ("t20", por_recibida(ACTIVOS), "Recibida"), "T_pub": ("t20", PUBLICADOS, "Formulario"),
                 "T_bor": ("t20", ["Reclamo"], "Formulario"), "T_baja": ("t20", BAJA, "Formulario"),
                 "L_def": ("lectura", ACTIVOS, "Formulario"), "V_def": ("lee", PUBLICADOS, "Formulario"),
                 "V_baja": ("lee", BAJA, "Formulario"), "C_def": ("carga", CARGA, "Formulario"), "C_baja": ("carga", BAJA, "Formulario"),
                 "T_def": ("t20", ACTIVOS, "Formulario")},
        defecto={"lucia": "T_def", "lee": "V_def", "carga": "C_def", "nadie": "T_def"},
    ),
    "21": dict(
        compu="FRM-Formularios-21", tel="M-FRM-Formularios-21", pa=True, todas="t21",
        editor={"Relevamiento de obra": "FRM-Editor-Baja", None: "FRM-Editor-21"},
        planilla={"Pedido de materiales": "FRM-Respuestas-20", None: "FRM-Respuestas-21"},
        respuesta={"Visita a cliente": "FRM-Respuesta-Aprobacion", "Pedido de materiales": "FRM-Respuesta-20", None: "FRM-Respuesta"},
        propias="FRM-Respuestas-Propias-21", cargar="FRM-Cargar-Respuesta-21", baja="FRM-Dar-De-Baja-21", aprobar="FRM-Respuestas-21",
        filtro=["Activos", "Publicados", "Borradores", "Con algo por aprobar", "Dados de baja"],
        bloques={"T_nom": ("t21", ACTIVOS, "Formulario"), "T_pub": ("t21", por_aprobar(PUBLICADOS), "Por aprobar"),
                 "T_bor": ("t21", ["Reclamo"], "Por aprobar"),
                 "T_algo": ("t21", por_aprobar([n for n in ACTIVOS if F[n]["pa"]]), "Por aprobar"),
                 "T_baja": ("t21", BAJA, "Por aprobar"), "L_def": ("lectura", ACTIVOS, "Formulario"),
                 "V_def": ("lee", PUBLICADOS, "Formulario"), "V_baja": ("lee", BAJA, "Formulario"),
                 "C_def": ("carga", CARGA, "Formulario"), "C_baja": ("carga", BAJA, "Formulario"),
                 "A_def": ("aprueba", por_aprobar([n for n in ACTIVOS if F[n]["pa"]]), "Por aprobar"),
                 "T_def": ("t21", por_aprobar(ACTIVOS), "Por aprobar")},
        defecto={"lucia": "T_def", "lee": "V_def", "carga": "C_def", "aprueba": "A_def", "nadie": "T_def"},
    ),
}


def enlace(cfg, clave, nombre, tel=False):
    v = cfg[clave]
    if isinstance(v, dict):
        v = v.get(nombre, v[None])
    return ("M-" if tel else "") + v + ".dc.html"


# ---------------------------------------------------------------------------------------------------------------- el ⋮ de la compu
def item(etiqueta, href=None, motivo=None, tip=False, pel=False):
    return ("item", etiqueta, href, motivo, tip, pel)


SEPARA = ("sep",)


def menus(cfg):
    """Los ⋮ que se abren en algún estado: variable → (formulario, opciones). «Cargar» va primero (261)."""
    ed = lambda n: enlace(cfg, "editor", n)  # noqa: E731
    cg = cfg["cargar"] + ".dc.html"
    baja = cfg["baja"] + ".dc.html"
    borrar_no = item("Borrar", motivo=TIENE_RESP, tip=True)
    m = {
        "mVis": ("Visita a cliente", [item("Cargar", cg), item("Editar", ed("Visita a cliente")), item("Copiar", "FRM-Copiar.dc.html"),
                                      item("Dar de baja", baja), SEPARA, borrar_no]),
        "mVisPub": ("Visita a cliente", [item("Cargar", cg), item("Editar", ed("Visita a cliente")), item("Copiar", "FRM-Copiar.dc.html"),
                                         item("Dar de baja", motivo=PUBLICANDO, tip=True), SEPARA, item("Borrar", motivo=TIENE_RESP)]),
        "mVisSoloPublica": ("Visita a cliente", [item("Ver", ed("Visita a cliente")), item("Dar de baja", baja)]),
        "mEnt": ("Entrega de pedido", [item("Cargar", motivo=SOLO_CLIENTES, tip=True), item("Editar", ed("Entrega de pedido")),
                                       item("Copiar", "FRM-Copiar.dc.html"), item("Dar de baja", baja), SEPARA, item("Borrar", motivo=TIENE_RESP)]),
        "mRec": ("Reclamo", [item("Editar", ed("Reclamo")), item("Copiar", "FRM-Copiar.dc.html"), SEPARA,
                             item("Borrar", "FRM-Reactivar-Eliminar.dc.html", pel=True)]),
        "mRel": ("Relevamiento de obra", [item("Editar", ed("Relevamiento de obra")), item("Reactivar", "FRM-Reactivar-Eliminar.dc.html"),
                                          item("Copiar", "FRM-Copiar.dc.html"), SEPARA, borrar_no]),
        "mCar": ("Visita a cliente", [item("Cargar", cg)]),
    }
    if not cfg["pa"]:
        # «Dar de baja» de uno de la app abre su diálogo en este tablero (el estado «Dar de baja uno de la app»).
        m["mPed"] = ("Pedido de materiales", [item("Cargar", cg), item("Editar", ed("Pedido de materiales")),
                                              item("Copiar", "FRM-Copiar.dc.html"), item("Dar de baja"), SEPARA, borrar_no])
    return m


def menu_compu(nombre, opciones):
    out = []
    for o in opciones:
        if o[0] == "sep":
            out.append('<span class="f-sep" role="separator"></span>')
            continue
        _, et, href, mot, tip, pel = o
        svg = IC[et]
        if mot:
            t = f'<span class="e-tip" role="tooltip">{mot}</span>' if tip else ""
            out.append(f'<span class="f-mi off" role="menuitem" aria-disabled="true" title="{mot}">{svg} {et}{t}</span>')
        elif href:
            out.append(f'<a class="f-mi{" pel" if pel else ""}" role="menuitem" href="{href}">{svg} {et}</a>')
        else:
            out.append(f'<span class="f-mi" role="menuitem">{svg} {et}</span>')
    return f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}">{"".join(out)}</div>'


# ---------------------------------------------------------------------------------------------------------------- la tabla
NADA = '<span class="fm-no">—</span>'


def estado(f):
    if f["est"] is None:
        return f'<span class="est2"><span class="w-est {V("estVisClase")}">{V("estVis")}</span></span>'
    c, txt = f["est"]
    i = (f'<span class="f-i" tabindex="0" role="img" aria-label="{f["info"]}" title="{f["info"]}">{IC["i"]}</span>' if f["info"] else "")
    return f'<span class="est2"><span class="w-est {c}">{txt}</span>{i}</span>'


def encabezado(vista, por):
    celdas = []
    for col, tipo in COLS[vista]:
        if col == "ACC":
            celdas.append('<span class="sr">Acciones</span>')
            continue
        nd = ' class="nd"' if tipo == "num" else ""
        if col != por:
            celdas.append(f"<span{nd}>{col}</span>")
            continue
        sentido = ORDEN[tipo][2]
        fl = "↑" if sentido == "ascending" else "↓"
        if tipo == "num":  # en una columna de números, la flecha va antes del título (264)
            celdas.append(f'<span class="nd" aria-sort="{sentido}"><span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">{fl}</span>{col}</span>')
        else:
            celdas.append(f'<span aria-sort="{sentido}">{col}<span class="b2-fl" aria-hidden="true">{fl}</span></span>')
    return f'<div class="w-th {CLASE[vista]}">{"".join(celdas)}</div>'


def fila(cfg, vista, nombre, abiertos):
    """Una fila de la compu, con los ⋮ que se abren sobre ella (`abiertos`: [(variable, opciones)])."""
    f = F[nombre]
    carga = vista == "carga"
    celdas = []
    for col, tipo in COLS[vista]:
        if col == "Formulario":
            href = (enlace(cfg, "editor", nombre) if vista in ("t20", "t21", "lectura") else
                    enlace(cfg, "propias", nombre) if carga else enlace(cfg, "planilla", nombre))
            celdas.append(f'<span class="fx-n"><a href="{href}">{nombre}</a></span>')
        elif col == "Estado":
            celdas.append(estado(f))
        elif col == "Dónde se completa":
            celdas.append(f'<span>{f["donde"]}</span>')
        elif col == "Respuestas":
            v = (f'<a class="e2-n" href="{enlace(cfg, "planilla", nombre)}">{f["resp"]}</a>' if f["resp"] != "0" else "0")
            celdas.append(f'<span class="nd num">{v}</span>')
        elif col == "Por aprobar":
            celdas.append(f'<span class="nd num"><a class="e2-pa" href="{enlace(cfg, "aprobar", nombre)}" aria-label="{f["pa"]} por aprobar">'
                          f'{f["pa"]}</a></span>' if f["pa"] else f'<span class="nd">{NADA}</span>')
        elif col == "Última respuesta":
            celdas.append(f'<span><a class="fx-num" href="{enlace(cfg, "respuesta", nombre)}">{f["ult"]}</a></span>' if f["ult"] else NADA)
        elif col == "Recibida":
            r = f["mrec"] if carga else f["rec"]
            celdas.append(f'<span class="num">{r}</span>' if r else NADA)
        elif col == "Preguntas":
            celdas.append(f'<span class="nd num">{f["preg"]}</span>')
        elif col == "Último cambio":
            celdas.append(f'<span class="num">{f["cambio"]}</span>')
        elif col == "Mis cargas":
            celdas.append(f'<span class="nd num">{f["mis"]}</span>')
        elif col == "Mi última carga":
            celdas.append(f'<span><a class="fx-num" href="{enlace(cfg, "propias", nombre)}">{f["mult"]}</a></span>' if f["mult"]
                          else f'<span class="fm-no">{TODAVIA}</span>')
        elif col == "ACC":
            exp = V("x" + f["k"]) if abiertos else "false"
            celdas.append(f'<span><button type="button" class="ib" aria-label="Acciones de {nombre}" aria-haspopup="menu" '
                          f'aria-expanded="{exp}">{IC["keb"]}</button></span>')
    ms = "".join(sc(var, menu_compu(nombre, ops)) for var, ops in abiertos)
    return f'<div class="w-tr {CLASE[vista]} e2x">{"".join(celdas)}{ms}</div>'


def bloque(cfg, clave, por_fila):
    vista, nombres, por = cfg["bloques"][clave]
    n = len(nombres)
    rango = "1 de 1" if n == 1 else f"1–{n} de {n}"

    def abiertos(x):
        # los ⋮ de quien diseña van en su vista; el de quien solo carga, en la suya
        if vista in ("t20", "t21"):
            return por_fila.get(x, [])
        return por_fila.get(("carga", x), []) if vista == "carga" else []
    filas = "".join(fila(cfg, vista, x, abiertos(x)) for x in nombres)
    pie = f'<div class="w-pie"><span>{rango}</span><span>10 por página · Página 1 de 1</span></div>'
    return sc("b_" + clave, encabezado(vista, por) + filas + pie, "si" if clave == "T_def" else "no")


def barra(cfg):
    columnas = [c for c, t in COLS[cfg["todas"]] if c != "ACC"]
    vista, _, por = cfg["bloques"]["T_def"]
    lst = b2.lista([b2.op(o, elegida=k == 0, activa=k == 0, sep=k == 1) for k, o in enumerate(cfg["filtro"])], barra=True)
    filtro = sc("conEstado", f'<span class="f-env"><button type="button" class="w-pil {V("estClase")}" aria-haspopup="listbox" '
                             f'aria-expanded="{V("estExp")}">{V("estTexto")} {IC["flecha"]}</button>{sc("estMenu", lst)}</span>', "si")
    pop = ('<div class="b2-pop" role="dialog" aria-label="Ordenar por"><div class="b2-pop-c"><span class="et">Columna</span>'
           + b2.campo(por, abierto=True, aria="Columna", extra=b2.lista([b2.op(c, elegida=c == por, activa=c == por) for c in columnas]))
           + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo(ORDEN[tipo_de(vista, por)][1], aria="Orden")
           + "</div></div>")
    return ('<div class="w-caja o-fb">'
            f'<span class="w-bus {V("busClase")}">{IC["lupa"]} {V("busqueda")}</span>{filtro}'
            + sc("hayFiltro", '<button type="button" class="cb cb-enl">Limpiar filtros</button>')
            + '<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar">'
            f'<button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="{V("ordExp")}">{V("ordTexto")} {b2.SVG_FLECHA}</button>'
            + sc("ordMenu", pop) + "</span></div>")


def cuerpo_compu(cfg, usados):
    """El `w-body` entero: la barra, los bloques de la tabla y los estados sin filas. `usados`: los ⋮ que abre algún estado."""
    ms = menus(cfg)
    por_fila = {}
    for var in usados:
        nombre, ops = ms[var]
        clave = ("carga", nombre) if var == "mCar" else nombre
        por_fila.setdefault(clave, []).append((var, ops))
    bloques = "".join(bloque(cfg, c, por_fila) for c in cfg["bloques"])
    vista, _, por = cfg["bloques"]["T_def"]
    carga = sc("cargando", encabezado(vista, por) + '<div class="t10-carga" role="status" aria-label="Cargando">'
                                                    '<span class="t10-aro" aria-hidden="true"></span></div>')
    vacios = (sc("vacio", '<div class="f-cuerpo"><b>Todavía no hay formularios.</b></div>')
              + sc("sinCoincidencias", '<div class="f-cuerpo"><b>Ningún formulario coincide con los filtros.</b>'
                                       '<button type="button" class="cb cb-enl">Limpiar filtros</button></div>')
              + sc("error", '<div class="f-cuerpo"><b>No pudimos cargar los formularios.</b>'
                            '<button type="button" class="cb cb-sec">Reintentar</button></div>'))
    return ('<div class="w-body">' + sc("conFiltros", barra(cfg), "si")
            + sc("conTabla", '<div class="w-caja">' + sc("conFilas", bloques, "si") + carga + vacios + "</div>", "si")
            + "@SIN_PERMISO@</div>")


def plural(n):
    return "1 formulario" if n == 1 else f"{n} formularios"


def vals(cfg, estado_, bloque_, menu, x):
    rol = x.get("rol", "lucia")
    disena = rol == "lucia"
    q = QUIEN[rol]
    filtro = x.get("filtro")
    sin_permiso = estado_ == "Sin permiso"
    sin_coinc = estado_ == "Sin coincidencias"
    defecto = cfg["defecto"][rol]
    b = bloque_ or defecto
    vista, nombres, por = cfg["bloques"][b]
    if estado_ in ("Cargando", "No se pudo cargar", "Sin permiso"):
        resumen = ""
    elif estado_ == "Todavía no hay formularios":
        resumen = "Sin formularios"
    else:
        resumen = plural(len(nombres))
    ms = menus(cfg)
    v = {
        "yo": q[0], "yoCorreo": q[1], "yoIni": q[2], "conAdmin": disena, "verFormularios": not sin_permiso, "verDisena": disena,
        "conWa": rol != "carga", "conBanda": not sin_permiso, "resumen": resumen,
        "conNuevo": disena and not x.get("soloPub") and not x.get("lectura"),
        "conFiltros": estado_ not in ("Todavía no hay formularios", "Sin permiso"),
        "conEstado": rol in ("lucia", "lee", "carga"),
        "busqueda": "inspección" if sin_coinc else "Buscar formulario", "busClase": "lleno" if sin_coinc else "",
        "estTexto": f"Estado: {filtro}" if filtro else "Estado", "estClase": "con" if filtro else "",
        "estMenu": bool(x.get("estMenu")), "estExp": "true" if x.get("estMenu") else "false",
        "hayFiltro": bool(filtro) or sin_coinc,
        "ordMenu": bool(x.get("ordMenu")), "ordExp": "true" if x.get("ordMenu") else "false", "ordTexto": texto_orden(vista, por),
        "conTabla": not sin_permiso, "conFilas": bloque_ is not None,
        "cargando": estado_ == "Cargando", "vacio": estado_ == "Todavía no hay formularios", "sinCoincidencias": sin_coinc,
        "error": estado_ == "No se pudo cargar", "sinPermiso": sin_permiso,
        "estVis": "Publicando la versión 4" if x.get("publicando") else "Publicado · versión 4",
        "estVisClase": "pend" if x.get("publicando") else "",
    }
    v.update({"b_" + c: c == bloque_ for c in cfg["bloques"]})
    v.update({m: m == menu for m in ms})
    v.update({"x" + F[n]["k"]: "false" for n in F})
    if menu:
        v["x" + F[ms[menu][0]]["k"]] = "true"
    if cfg["pa"]:
        v["conCnt"] = rol in ("lucia", "aprueba")
        v["cntMenu"] = "4"
    else:
        v["bajaApp"] = bool(x.get("bajaApp"))
    return v


def guion_compu(estados, D, defecto, extra=""):
    base = D[defecto]
    dif = {e: {k: v for k, v in d.items() if base.get(k) != v} for e, d in D.items()}
    return ("class Component extends DCLogic {\n  renderVals() {\n"
            f"    const e = this.props.estado ?? {json.dumps(defecto, ensure_ascii=False)};\n"
            f"    const BASE = {json.dumps(base, ensure_ascii=False, separators=(',', ':'))};\n"
            f"    const D = {json.dumps(dif, ensure_ascii=False, separators=(',', ':'))};\n"
            f"    return Object.assign({{ si: true, no: false{extra} }}, BASE, D[e] ?? {{}});\n  }}\n}}\n")


# Los estados de la compu: (nombre, bloque, ⋮ abierto, lo demás). Los que ya estaban conservan su nombre.
EST20 = [
    ("Activos", "T_def", None, {}), ("Estado: menú", "T_def", None, {"estMenu": True}),
    ("Publicados", "T_pub", None, {"filtro": "Publicados"}), ("Borradores", "T_bor", None, {"filtro": "Borradores"}),
    ("Dados de baja", "T_baja", None, {"filtro": "Dados de baja"}),
    ("Acciones de un publicado", "T_def", "mVis", {}), ("Acciones de uno de la app", "T_def", "mPed", {}),
    ("Dar de baja uno de la app", "T_def", None, {"bajaApp": True}), ("Acciones de un borrador", "T_def", "mRec", {}),
    ("Acciones de un dado de baja", "T_baja", "mRel", {"filtro": "Dados de baja"}),
    ("Acciones mientras se publica", "T_def", "mVisPub", {"publicando": True}),
    ("Solo puede publicar", "T_def", "mVisSoloPublica", {"soloPub": True}), ("Solo lectura", "L_def", None, {"lectura": True}),
    ("Quien solo ve respuestas", "V_def", None, {"rol": "lee"}),
    ("Quien solo ve respuestas: dados de baja", "V_baja", None, {"rol": "lee", "filtro": "Dados de baja"}),
    ("Uno solo para clientes", "T_def", "mEnt", {}),
    ("Quien solo carga", "C_def", None, {"rol": "carga"}), ("Quien solo carga: Cargar", "C_def", "mCar", {"rol": "carga"}),
    ("Quien solo carga: dados de baja", "C_baja", None, {"rol": "carga", "filtro": "Dados de baja"}),
    ("Ordenar por abierto", "T_def", None, {"ordMenu": True}), ("Ordenado por Recibida", "T_rec", None, {}),
    ("Sin coincidencias", None, None, {}), ("Cargando", None, None, {}), ("Todavía no hay formularios", None, None, {}),
    ("No se pudo cargar", None, None, {}), ("Sin permiso", None, None, {"rol": "nadie"}),
]
EST21 = [
    ("Activos", "T_def", None, {}), ("Estado: menú", "T_def", None, {"estMenu": True}),
    ("Publicados", "T_pub", None, {"filtro": "Publicados"}), ("Borradores", "T_bor", None, {"filtro": "Borradores"}),
    ("Con algo por aprobar", "T_algo", None, {"filtro": "Con algo por aprobar"}),
    ("Dados de baja", "T_baja", None, {"filtro": "Dados de baja"}),
    ("Acciones de un publicado", "T_def", "mVis", {}), ("Acciones de un borrador", "T_def", "mRec", {}),
    ("Acciones de un dado de baja", "T_baja", "mRel", {"filtro": "Dados de baja"}),
    ("Acciones mientras se publica", "T_def", "mVisPub", {"publicando": True}),
    ("Solo puede publicar", "T_def", "mVisSoloPublica", {"soloPub": True}), ("Solo lectura", "L_def", None, {"lectura": True}),
    ("Quien solo ve respuestas", "V_def", None, {"rol": "lee"}),
    ("Quien solo ve respuestas: dados de baja", "V_baja", None, {"rol": "lee", "filtro": "Dados de baja"}),
    ("Uno solo para clientes", "T_def", "mEnt", {}),
    ("Quien solo carga", "C_def", None, {"rol": "carga"}), ("Quien solo carga: Cargar", "C_def", "mCar", {"rol": "carga"}),
    ("Quien solo carga: dados de baja", "C_baja", None, {"rol": "carga", "filtro": "Dados de baja"}),
    ("Quien solo aprueba", "A_def", None, {"rol": "aprueba"}),
    ("Ordenar por abierto", "T_def", None, {"ordMenu": True}), ("Ordenado por Formulario", "T_nom", None, {}),
    ("Sin coincidencias", None, None, {}), ("Cargando", None, None, {}), ("Todavía no hay formularios", None, None, {}),
    ("No se pudo cargar", None, None, {}), ("Sin permiso", None, None, {"rol": "nadie"}),
]

CSS_COMPU = b2.css() + e14l.CSS_LISTADO[len(b2.CSS_B2):] + """
/* E20 y E21 · la lista «Formularios»: un dato por columna (206 y 263), sin la columna «Cargar», que pasa al ⋮ (261). */
.w-th.e20t, .w-tr.e20t { grid-template-columns: minmax(160px, 1.3fr) minmax(150px, 1.1fr) 120px 92px 120px 130px 40px; }
.w-th.e21t, .w-tr.e21t { grid-template-columns: minmax(150px, 1.2fr) minmax(140px, 1fr) 112px 84px 84px 112px 124px 40px; }
.w-th.e2v, .w-tr.e2v { grid-template-columns: minmax(220px, 1.4fr) 110px 150px 160px; }
.w-th.e2r, .w-tr.e2r { grid-template-columns: minmax(200px, 1.3fr) 100px minmax(170px, 1.1fr) 150px 160px; }
.w-th.e2c, .w-tr.e2c { grid-template-columns: minmax(200px, 1.4fr) 110px 160px 160px 40px; }
.w-th.e2a, .w-tr.e2a { grid-template-columns: minmax(220px, 1fr) 160px; }
.w-tr.e2x { position: relative; min-height: 40px; }
/* 137 · los números a la derecha, también su encabezado; ahí la flecha va antes del título (264). */
.w-th > .nd, .w-tr > span.nd { justify-self: stretch; text-align: right; }
/* 275 · el número de respuestas abre la planilla, y el de «Por aprobar», la planilla en «Por aprobar». */
.w-tr a.e2-n { color: var(--t1); text-decoration: none; font-variant-numeric: tabular-nums; }
.w-tr a.e2-pa { color: var(--marca-tx); font-weight: 600; text-decoration: none; font-variant-numeric: tabular-nums; }
.w-tr a.e2-n:hover, .w-tr a.e2-pa:hover { text-decoration: underline; }
"""
assert e14l.CSS_LISTADO.startswith(b2.CSS_B2)


def lista_compu(etapa):
    cfg = ETAPAS[etapa]
    estados = EST20 if etapa == "20" else EST21
    t, nl = leer(cfg["compu"])
    t = e14l.para_aprobar(con_css(t, CSS_COMPU))
    i = t.index('<div class="w-body">')
    j = b2.fin_div(t, i)
    sin_permiso = re.search(r'<sc-if value="\{\{sinPermiso\}\}".*?</sc-if>', t[i:j], re.S).group(0)
    usados = sorted({m for _, _, m, _ in estados if m})
    t = t[:i] + cuerpo_compu(cfg, usados).replace("@SIN_PERMISO@", sin_permiso) + t[j:]
    nombres = [e for e, _, _, _ in estados]
    D = {e: vals(cfg, e, b, m, x) for e, b, m, x in estados}
    t = props(t, lambda p: p["estado"].update(options=nombres, default="Activos"))
    t = nuevo_guion(t, guion_compu(nombres, D, "Activos"))
    faltan = set(re.findall(r"\{\{(\w+)\}\}", t)) - set(D["Activos"]) - {"si", "no"}
    assert not faltan, faltan
    assert "▲" not in t and 'class="cb cb-sec cb-ch"' not in t
    escribir(cfg["compu"], t, nl)
    return D


def campana_21(D21):
    """La lista de atrás de la campana es la de `FRM-Formularios-21`, en «Activos» (229)."""
    cfg = ETAPAS["21"]
    t, nl = leer("Campana-21")
    t = e14l.para_aprobar(con_css(t, CSS_COMPU))
    i = t.index('<div class="w-body">')
    j = b2.fin_div(t, i)
    sin_permiso = re.search(r'<sc-if value="\{\{sinPermiso\}\}".*?</sc-if>', t[i:j], re.S).group(0)
    t = t[:i] + cuerpo_compu(cfg, []).replace("@SIN_PERMISO@", sin_permiso) + t[j:]
    base = {k: v for k, v in D21["Activos"].items() if not re.match(r"m[A-Z]", k)}
    clase = ("class Component extends DCLogic {\n  renderVals() {\n"
             "    const c = this.props.campana ?? 'Con avisos';\n"
             f"    const BASE = {json.dumps(base, ensure_ascii=False, separators=(',', ':'))};\n"
             "    return Object.assign({ si: true, no: false, cmpCon: c === 'Con avisos', cmpSin: c === 'Sin avisos', cmpHay: c !== 'Sin avisos',\n"
             "      cmpVersion: c === 'Versión nueva', cmpCant: {'Versión nueva': '4', 'Sin avisos': '0'}[c] ?? '3' }, BASE);\n  }\n}\n")
    t = nuevo_guion(t, clase)
    faltan = set(re.findall(r"\{\{(\w+)\}\}", t)) - set(base) - {"si", "no", "cmpCon", "cmpSin", "cmpHay", "cmpVersion", "cmpCant"}
    assert not faltan, faltan
    escribir("Campana-21", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
CSS_TEL_LISTA = b2.css(True) + e12l.CSS_TEL[len(b2.CSS_B2) + len(b2.CSS_B2_TEL):] + """
/* E20 y E21 · cada formulario, una tarjeta (263): el nombre abre el editor (275) y cada dato va con su nombre; «Cargar» sigue en la
   fila, al lado del ⋮ (261), y apagado dice por qué en un tooltip que abre el toque (211). */
.e2-tj .b2-tj-a { display: block; }
.e2-tj.cg .nm { padding-right: 92px; }
.e2-tj.cg.sinkeb .nm { padding-right: 52px; }
.e2-tj .e2-cgw { position: absolute; top: 4px; right: 52px; display: inline-flex; }
.e2-tj.sinkeb .e2-cgw { right: 12px; }
.e2-tj .e2-cg { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; height: 44px; padding: 0 16px; border-radius: 10px; font-size: 15px; font-weight: 600; text-decoration: none; }
.e2-tj .e2-cg[aria-disabled="true"] { opacity: 0.5; cursor: default; }
.e2-tj .e2-cgw .acc-tip { left: auto; right: 0; bottom: calc(100% + 6px); }
.e2-tj .e2-cgw .acc-tip::after { left: auto; right: 24px; }
.e2-tj .v a { color: var(--t1); text-decoration: underline; text-decoration-color: var(--borde2); text-underline-offset: 3px; }
.e2-tj .v a.pa { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.e2-tj .v .mono { font-family: ui-monospace, Consolas, monospace; font-size: 14px; }
.e2-tj .v .no { color: var(--t3); }
.ap-cuerpo:has(.acc-tip) { overflow: visible; }
/* 261 y 211 · el ⋮ de una fila: cada acción con su ícono; lo apagado, con su motivo en el tooltip, sin texto debajo. */
.e2-ops { display: flex; flex-direction: column; }
.e2-ops .op { position: relative; display: flex; align-items: center; gap: 14px; min-height: 52px; border-top: 1px solid var(--borde); color: var(--t1); font-size: 16px; text-decoration: none; }
.e2-ops .op:first-child, .e2-ops .sep + .op { border-top: 0; }
.e2-ops .op svg { flex: none; width: 20px; height: 20px; color: var(--t3); }
.e2-ops .op.pel { color: oklch(0.52 0.19 25); }
.e2-ops .op.pel svg { color: inherit; }
.e2-ops .op.apag { color: var(--t3); }
.e2-ops .sep { height: 6px; border-top: 1px solid var(--borde); background: var(--s2); }
.e2-ops .op .acc-tip { left: 34px; bottom: calc(100% - 4px); }
.ap-hoja:has(.acc-tip) { overflow: visible; }
""" + e14e.CSS_TEL[len(b2.css(True)):]
assert e12l.CSS_TEL.startswith(b2.CSS_B2 + b2.CSS_B2_TEL) and e14e.CSS_TEL.startswith(b2.css(True))


def reactivar_tel(cuerpo):
    """El formulario dado de baja detrás de «Reactivar», como `M-FRM-Editor` de la E14: cada pregunta, una tarjeta con «Tipo» y
    «Obligatoria» (263), y «Para quién es» en la pieza (262)."""
    cuerpo = e14e.tarjetas_tel(cuerpo)
    viejo = re.search(r'<div class="ct sel">Empleados<svg.*?</svg></div>', cuerpo, re.S)
    assert viejo, "sin «Para quién es»"
    return cuerpo.replace(viejo.group(0), b2.campo("Empleados", aria="Para quién es"), 1)
CLASE_TEL = {"": "ok", "off": "", "mal": "mal", "baja": "", "pend": "pend"}


def estado_tel(f):
    if f["est"] is None:
        return b2.est("ok", "Publicado · versión 4")
    c, txt = f["est"]
    return b2.est(CLASE_TEL[c], txt, info=f["info"])


def tarjeta(cfg, vista, nombre, tip_cargar=False):
    """Una fila del teléfono (263): el nombre, que abre como en la compu, y cada dato con su nombre, de a dos."""
    f = F[nombre]
    lk = lambda clave: enlace(cfg, clave, nombre, tel=True)  # noqa: E731
    no = '<span class="no">—</span>'
    if vista in ("t20", "t21"):
        href = lk("editor")
        datos = [("Estado", estado_tel(f), True), ("Dónde se completa", f["donde"])]
        if cfg["pa"]:
            datos.append(("Por aprobar", f'<a class="pa" href="{lk("aprobar")}">{f["pa"]}</a>' if f["pa"] else no))
        datos.append(("Respuestas", f'<a href="{lk("planilla")}">{f["resp"]}</a>' if f["resp"] != "0" else "0"))
    elif vista == "lee":
        href = lk("planilla")
        datos = [("Respuestas", f'<a href="{lk("planilla")}">{f["resp"]}</a>'),
                 ("Última respuesta", f'<a class="mono" href="{lk("respuesta")}">{f["ult"]}</a>' if f["ult"] else no),
                 ("Recibida", f["rec"] or no)]
    elif vista == "carga":
        href = lk("propias")
        datos = [("Mis cargas", f["mis"]),
                 ("Mi última carga", f'<a class="mono" href="{lk("propias")}">{f["mult"]}</a>' if f["mult"] else f'<span class="no">{TODAVIA}</span>'),
                 ("Recibida", f["mrec"] or no)]
    else:  # aprueba
        href = lk("planilla")
        datos = [("Por aprobar", f'<a class="pa" href="{lk("aprobar")}">{f["pa"]}</a>')]
    celdas = "".join(f'<span class="c{" todo" if len(d) > 2 and d[2] else ""}"><span class="k">{d[0]}</span><span class="v">{d[1]}</span></span>'
                     for d in datos)
    con_keb = vista in ("t20", "t21")
    cargar = ""
    if vista in ("t20", "t21", "carga") and f["cargar"] == "si":
        cargar = (f'<span class="e2-cgw"><a class="cb cb-sec e2-cg" href="{"M-" + cfg["cargar"]}.dc.html" aria-label="Cargar {nombre}">'
                  "Cargar</a></span>")
    elif vista in ("t20", "t21") and f["cargar"] == "cliente":
        t = b2.tip(SOLO_CLIENTES) if tip_cargar else ""
        cargar = (f'<span class="e2-cgw"><button type="button" class="cb cb-sec e2-cg" aria-disabled="true" '
                  f'aria-label="Cargar {nombre}: no disponible. {SOLO_CLIENTES}">Cargar</button>{t}</span>')
    keb = (f'<button type="button" class="keb" aria-label="Acciones de {nombre}" aria-haspopup="menu">{b2.SVG_KEB}</button>' if con_keb else "")
    clase = "b2-tj e2-tj" + (" cg" if cargar else "") + ("" if con_keb else " sinkeb")
    return (f'<div class="{clase}"><a class="b2-tj-a" href="{href}"><span class="cu"><span class="nm">{nombre}</span></span></a>'
            f'<span class="dl">{celdas}</span>{cargar}{keb}</div>')


def ops_tel(opciones):
    out = []
    for o in opciones:
        if o[0] == "sep":
            out.append('<span class="sep" role="separator"></span>')
            continue
        _, et, href, mot, tip, pel = o
        svg = IC[et]
        clase = "op" + (" pel" if pel else "") + (" apag" if mot else "")
        if mot:
            out.append(f'<span class="{clase}" role="menuitem" aria-disabled="true">{svg}{et}{b2.tip(mot) if tip else ""}</span>')
        elif href:
            out.append(f'<a class="{clase}" role="menuitem" href="{href}">{svg}{et}</a>')
        else:
            out.append(f'<span class="{clase}" role="menuitem">{svg}{et}</span>')
    return f'<div class="e2-ops">{"".join(out)}</div>'


def hojas_tel(cfg):
    ed = lambda n: enlace(cfg, "editor", n, tel=True)  # noqa: E731
    return {
        "Acciones de un publicado": [item("Editar", ed("Visita a cliente")), item("Copiar"), item("Dar de baja"), SEPARA,
                                     item("Borrar", motivo=TIENE_RESP, tip=True)],
        "Acciones de un borrador": [item("Editar", ed("Reclamo")), item("Copiar"), SEPARA, item("Borrar", pel=True)],
        "Acciones de un dado de baja": [item("Editar", ed("Relevamiento de obra")), item("Reactivar"), item("Copiar"), SEPARA,
                                        item("Borrar", motivo=TIENE_RESP, tip=True)],
    }


def partes_tel(t):
    """(principio, [(variable, cuerpo)], [(variable, hoja)], fin) del marco del teléfono."""
    est = t.index('<div class="ap-est">')
    pos = b2.fin_div(t, est)
    cuerpos, hojas, raya = [], [], '<span class="ap-raya"></span>'
    destino = cuerpos
    while True:
        if t.startswith("<sc-if", pos):
            j = fin_sc_if(t, pos)
            destino.append((re.match(r'<sc-if value="\{\{(\w+)\}\}"', t[pos:]).group(1), t[pos:j]))
            pos = j
        elif t.startswith(raya, pos):
            destino = hojas
            pos += len(raya)
        else:
            return t[:b2.fin_div(t, est)], cuerpos, hojas, t[pos:]


def lista_tel(etapa):
    cfg = ETAPAS[etapa]
    nombre = cfg["tel"]
    t, nl = leer(nombre)
    t = e14l.para_aprobar(con_css(t, CSS_TEL_LISTA))
    lista_k = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    s = {e: f"s{i}" for i, e in enumerate(lista_k)}
    principio, cuerpos, hojas, fin = partes_tel(t)
    cuerpo = dict(cuerpos)
    viejo0 = cuerpo["s0"]
    barra_lista = viejo0[viejo0.index(">") + 1:viejo0.index('<div class="ap-cuerpo">')]
    fab = re.search(r'<a class="ap-fab".*?</a>', viejo0, re.S).group(0)
    viejo1 = cuerpo["s1"]
    barra_filtros = viejo1[viejo1.index(">") + 1:viejo1.index('<div class="ap-cuerpo">')]
    volver = re.search(r'aria-label="Volver" href="[^"]+">(<svg.*?</svg>)</a>', barra_filtros, re.S).group(1)
    nuevos = ["Ordenar por", "Uno solo para clientes"]
    for n in nuevos:
        s[n] = f"s{len(lista_k)}"
        lista_k.append(n)

    def ordtel(vista, por):
        return f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">{texto_orden(vista, por)} {b2.SVG_FLECHA}</button></div>'

    def lista(clave, tip=False):
        vista, nombres, por = cfg["bloques"][clave]
        tarjetas = "".join(tarjeta(cfg, vista, n, tip_cargar=tip and n == "Entrega de pedido") for n in nombres)
        return barra_lista + ordtel(vista, por) + f'<div class="ap-cuerpo">{tarjetas}</div>' + (fab if vista in ("t20", "t21") else "")

    filtros = (barra_filtros + '<div class="ap-cuerpo"><div class="t10-fl">' + e12l.campo_tel("Estado", "Activos") + "</div></div>"
               '<div class="t10-pie"><button type="button" class="cb cb-sec">Limpiar todo</button>'
               '<button type="button" class="cb cb-pri">Listo</button></div>')
    vista_d, _, por_d = cfg["bloques"]["T_def"]
    carga = barra_lista + ordtel(vista_d, por_d) + PREVIA_TEL
    error = (barra_lista + ordtel(vista_d, por_d) + '<div class="ap-cuerpo"><div class="ap-vacio">No pudimos cargar los formularios.'
             '<button type="button" class="cb cb-sec">Reintentar</button></div></div>')
    que = {"Activos": lista("T_def"), "Filtros": filtros, "Dados de baja": lista("T_baja"),
           "Acciones de un publicado": lista("T_def"), "Acciones de un borrador": lista("T_def"),
           "Acciones de un dado de baja": lista("T_baja"), "Copiar": lista("T_def"), "Dar de baja": lista("T_def"),
           "Dar de baja uno de la app": lista("T_def"), "Borrar": lista("T_def"),
           "Quien solo ve respuestas": lista("V_def"), "Quien solo ve respuestas: filtros": filtros,
           "Quien solo carga": lista("C_def"), "Quien solo carga: dados de baja": lista("C_baja"),
           "Quien solo aprueba": lista("A_def") if cfg["pa"] else None, "Cargando": carga, "No se pudo cargar": error,
           "Ordenar por": e14l.pantalla_ordenar(volver, nombre, por_d, ORDEN[tipo_de(vista_d, por_d)][1]),
           "Uno solo para clientes": lista("T_def", tip=True)}
    nuevos_cuerpos = []
    for e in lista_k:
        var = s[e]
        if e == "Reactivar":
            nuevos_cuerpos.append(reactivar_tel(cuerpo[var]))  # el formulario dado de baja, detrás de su hoja
            continue
        nuevos_cuerpos.append(sc(var, que[e], "si" if var == "s0" else "no"))
    # Las hojas del ⋮, con el ícono de cada acción y el motivo de lo apagado en el tooltip (211).
    acciones = hojas_tel(cfg)
    nuevas_hojas = []
    for var, h in hojas:
        e = lista_k[int(var[1:])]
        if e in acciones:
            i = h.index('<div class="ap-acciones">')
            j = b2.fin_div(h, i)
            h = h[:i] + ops_tel(acciones[e]) + h[j:]
        nuevas_hojas.append(h)
    t = principio + "".join(nuevos_cuerpos) + '<span class="ap-raya"></span>' + "".join(nuevas_hojas) + fin

    def poner(p):
        ops = p["estado"]["options"]
        ops.insert(ops.index("Filtros") + 1, "Ordenar por")
        ops.insert(ops.index("Acciones de un dado de baja") + 1, "Uno solo para clientes")
    t = props(t, poner)
    clase = ("class Component extends DCLogic {\n  renderVals() {\n"
             f"    const e = this.props.estado ?? \"Activos\";\n"
             f"    const k = {json.dumps(lista_k, ensure_ascii=False)}.indexOf(e);\n"
             "    return {\n      si: true, no: false,\n"
             + "".join(f"      s{i}: k === {i},\n" for i in range(len(lista_k))) + "    };\n  }\n}\n")
    t = nuevo_guion(t, clase)
    assert 'class="ap-fila' not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S), "quedó una fila vieja"
    assert "<small>" not in "".join(nuevas_hojas[:3])
    escribir(nombre, t, nl)


PREVIA_TEL = '<div class="ap-cuerpo t10-carga-tel" role="status" aria-label="Cargando"><span class="t10-aro" aria-hidden="true"></span></div>'


# ---------------------------------------------------------------------------------------------------------------- el chat
SOLO_APP = "Se completa solo en la app."
HASTA = "14/10/2026, 10:48"
ELEGI = "Elegí un formulario"
# Los de Tomás, en el orden del servidor (por nombre); con su motivo, los que se completan solo en la app (229).
CUATRO = [("Control de vehículo", None), ("Entrega de pedido", None), ("Pedido de materiales", SOLO_APP), ("Visita a cliente", None)]
NUEVE = [("Alta de cliente", None), ("Control de vehículo", None), ("Entrega de pedido", None), ("Inspección de obra", None),
         ("Inventario de equipos", SOLO_APP), ("Pedido de materiales", SOLO_APP), ("Pedido de repuesto", SOLO_APP),
         ("Reclamo de cliente", None), ("Visita a cliente", None)]
CHAT = {
    "Uno apagado": dict(ops=CUATRO, tip="Pedido de materiales", buscar=""),
    "Tres de la app": dict(ops=NUEVE, buscar=""),
    "Una búsqueda que encuentra uno apagado": dict(ops=[("Pedido de materiales", SOLO_APP)], tip="Pedido de materiales", buscar="materiales"),
    "Uno elegido y otro apagado debajo": dict(ops=CUATRO, elegido="Visita a cliente", buscar=""),
}


def cantidad(ops):
    return plural(len(ops))


def renglones(spec):
    filas = [("Versión", "4", False), ("Preguntas", "10", False)] if spec.get("elegido") else []
    return filas + [("Se puede mandar hasta", HASTA, False)]


def mensaje_de(spec):
    return f"Completá el formulario «{spec['elegido']}»." if spec.get("elegido") else "Completá este formulario."


def dialogo_chat(dlg, spec):
    i = dlg.index('<div class="db una">')
    j = b2.fin_div(dlg, i)
    _, hijos, _ = b2.hijos(dlg[i:j])
    msj = [h for h in hijos if h.startswith('<div class="w-cmp"><span class="rt">Mensaje que lo acompaña')]
    assert len(msj) == 1
    elegido = spec.get("elegido")
    lst = b2.lista([b2.op(n, elegida=n == elegido, activa=n == elegido, apagada=mot, tip_abierto=n == spec.get("tip"))
                    for n, mot in spec["ops"]], buscar=spec["buscar"], cantidad=cantidad(spec["ops"]))
    campo = (f'<div class="w-cmp"><span class="rt">Formulario <span class="req">*</span></span>'
             f'{b2.campo(elegido or ELEGI, vacio=not elegido, abierto=True, aria="Formulario", extra=lst)}</div>')
    cuerpo = campo + e14cf.grilla_compu(renglones(spec)) + e14cf.con_mensaje(msj[0], mensaje_de(spec))
    nuevo = dlg[:i] + '<div class="db una">' + cuerpo + "</div>" + dlg[j:]
    pri = re.search(r'<button type="button" class="cb cb-pri"( disabled)?>Enviar formulario</button>', nuevo)
    boton = '<button type="button" class="cb cb-pri"' + ("" if elegido else " disabled") + ">Enviar formulario</button>"
    return nuevo[:pri.start()] + boton + nuevo[pri.end():]


def hoja_chat(hoja, spec):
    i = hoja.index('<div class="hb">')
    j = b2.fin_div(hoja, i)
    _, hijos, _ = b2.hijos(hoja[i:j])
    msj = [h for h in hijos if h.startswith('<div class="ap-cmp"><span class="rt"><span>Mensaje que lo acompaña')]
    assert len(msj) == 1
    elegido = spec.get("elegido")
    campo = (f'<div class="ap-cmp"><span class="rt"><span>Formulario <span class="rq">*</span></span></span>'
             f'{b2.campo(elegido or ELEGI, vacio=not elegido, abierto=True, aria="Formulario")}</div>')
    cuerpo = campo + e14cf.grilla_tel(renglones(spec)) + e14cf.con_mensaje(msj[0], mensaje_de(spec))
    nuevo = hoja[:i] + '<div class="hb">' + cuerpo + "</div>" + hoja[j:]
    pri = re.search(r'<button type="button" class="cb cb-pri"( disabled)?>Enviar formulario</button>', nuevo)
    boton = '<button type="button" class="cb cb-pri"' + ("" if elegido else " disabled") + ">Enviar formulario</button>"
    nuevo = nuevo[:pri.start()] + boton + nuevo[pri.end():]
    # La pieza, abierta a pantalla completa (262): sin uno elegido, de a 20 y solo con el nombre (285).
    pieza = b2.pk_tel("Formulario", [(n, None, n == elegido, mot) for n, mot in spec["ops"]], buscar=spec["buscar"] or "",
                      cantidad=cantidad(spec["ops"]), tip_en=spec.get("tip"))
    return nuevo + pieza


def chat(nombre, tel):
    t, nl = leer(nombre)
    t = e14l.para_aprobar(con_css(t, e14cf.CSS_TEL if tel else e14cf.CSS_COMPU))
    lista_k = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    empieza = '<div class="ap-velo"></div><div class="ap-hoja" role="dialog"' if tel else '<div class="w-oscuro">'
    cambiados = 0
    for e, spec in CHAT.items():
        if e not in lista_k:
            continue
        var = f"s{lista_k.index(e)}"
        i, j = e14cf.bloque(t, var, empieza)
        cuerpo = e14cf.adentro(t, i, j)
        nuevo = hoja_chat(cuerpo, spec) if tel else dialogo_chat(cuerpo, spec)
        t = t[:i] + sc(var, nuevo) + t[j:]
        cambiados += 1
    assert cambiados == (3 if tel else 4), cambiados
    assert "c-op" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S) and "24 horas" not in t
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- los avisos
MAPA = "https://www.google.com/maps?q=-34.603722,-58.381592"
AVISO_UBICACION = ("Recibimos VIS-000126 de Ferretería Rosales. Ubicación: -34.603722, -58.381592<br>"
                   f'<a class="e21-mapa" href="{MAPA}" target="_blank" rel="noopener noreferrer">{MAPA}</a>')
RECIBIMOS = "Recibimos VIS-000126. Te avisamos cuando la aprueben."
CSS_AVISOS = """
/* E21 · una «Ubicación» en un aviso (230): el punto y, en el renglón siguiente, el enlace al mapa. */
.gl a.e21-mapa { color: var(--marca-tx); text-decoration: underline; overflow-wrap: anywhere; }
"""


def avisos(nombre, tel):
    """Suma «Con una ubicación» después de «Con el bloque»: el aviso al recibirla, con la «Ubicación» de la visita."""
    t, nl = leer(nombre)
    t = e14l.para_aprobar(con_css(t, CSS_AVISOS))
    lista_k = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    nuevo = "Con una ubicación"
    var = f"s{len(lista_k)}"
    ancla = "s0"
    burbuja = "ap-m" if tel else "w-m"
    # Los mensajes: los del primer estado, hasta el aviso al recibirla, que cita la ubicación.
    i, j = e14cf.bloque(t, ancla, f'<div class="{burbuja} sal">')
    msjs = e14cf.adentro(t, i, j)
    k = msjs.index(f'<div class="{burbuja} sal"><span class="gl">{RECIBIMOS}')
    fin = b2.fin_div(msjs, k)
    aviso = msjs[k:fin].replace(RECIBIMOS, AVISO_UBICACION, 1)
    msjs = msjs[:k] + aviso
    ult = re.findall(r'<sc-if value="\{\{s\d+\}\}" hint-placeholder-val="\{\{\w+\}\}"><div class="%s ' % burbuja, t)
    # el bloque de mensajes nuevo va después del último de mensajes
    pos = [m.start() for m in re.finditer(r'<sc-if value="\{\{s\d+\}\}" hint-placeholder-val="\{\{\w+\}\}"><div class="%s ' % burbuja, t)]
    fin_msjs = fin_sc_if(t, pos[-1])
    t = t[:fin_msjs] + sc(var, msjs) + t[fin_msjs:]
    # El compositor, como el del primer estado.
    comp = '<div class="ap-escr">' if tel else '<button type="button" class="o-nt"'
    i, j = e14cf.bloque(t, ancla, comp)
    caja = e14cf.adentro(t, i, j)
    pos = [m.start() for m in re.finditer(r'<sc-if value="\{\{s\d+\}\}" hint-placeholder-val="\{\{\w+\}\}">%s' % re.escape(comp), t)]
    fin_comp = fin_sc_if(t, pos[-1])
    t = t[:fin_comp] + sc(var, caja) + t[fin_comp:]
    assert len(ult) >= 1

    def poner(p):
        ops = p["estado"]["options"]
        ops.insert(ops.index("Con el bloque") + 1, nuevo)
    t = props(t, poner)
    t = una(t, json.dumps(lista_k, ensure_ascii=False) + ".indexOf(e);", json.dumps(lista_k + [nuevo], ensure_ascii=False) + ".indexOf(e);")
    ultimo = f"      s{len(lista_k) - 1}: k === {len(lista_k) - 1},\n"
    t = una(t, ultimo, ultimo + f"      {var}: k === {len(lista_k)},\n")
    if not tel:
        t = e14cf.sumar_a_dicc(t, "vistaPrevia", {nuevo: "Automático: Recibimos VIS-000126 de Ferretería Rosales…"})
        t = e14cf.sumar_a_dicc(t, "hora", {nuevo: "13/10/2026, 15:30"})
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- el panel
def partir_panel(panel):
    """275 · una línea sin título entre «Formularios» y «Catálogos»; en la E21, «Formularios» lleva su número."""
    if SEP in panel:
        return panel
    if "Formularios</a>" in panel:
        return partir(panel)
    m = CATALOGOS.search(panel)
    i = panel.find("Formularios <sc-if")
    assert m and 0 <= i < m.start(), "el panel no tiene «Formularios» antes de «Catálogos»"
    return panel[:m.start()] + SEP + panel[m.start():]


def paneles():
    for nombre in CON_PANEL:
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        nuevo, n = PANEL.subn(lambda m: partir_panel(m.group(0)), t)
        assert n, f"{nombre} no tiene el panel"
        if BLOQUE_PANEL not in nuevo:
            nuevo = nuevo.replace("</helmet>", CSS_PANEL + "</helmet>", 1)
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
        print("ok panel", nombre, n)


# ---------------------------------------------------------------------------------------------------------------- todo
def main():
    hechos = [n for n in COMPU + TEL if MARCA in leer(n)[0]]
    if hechos:
        print("ya tienen el bloque, no hace nada:", ", ".join(hechos))
        return
    lista_compu("20")
    D21 = lista_compu("21")
    campana_21(D21)
    lista_tel("20")
    lista_tel("21")
    chat("WA-Chats-Formulario-20", False)
    chat("M-WA-Chats-Formulario-20", True)
    avisos("WA-Chats-Avisos", False)
    avisos("M-WA-Conversacion-Avisos", True)
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(COMPU + TEL)], check=True)
    paneles()


if __name__ == "__main__":
    main()
