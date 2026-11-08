"""Las decisiones 79 y 80 del usuario (2026-10-25), pedidas por la Guía.

- 79: una sola lista «Formularios», con los borradores y los publicados, el estado en WhatsApp, Por aprobar, Respuestas, la
  última respuesta y el ⋮ de cada fila, y «Nuevo formulario ▾» arriba. Cada formulario se abre en su ficha, con las pestañas
  Respuestas, Tablero y Diseño (las dos primeras, si ya se publicó). Copia la maqueta (6d859a8, /org/formularios) con las
  piezas de MF1 (`gestion_formularios_1004.py`) y de la E12b:
  - FRM-Formularios y M-FRM-Formularios (nuevo) son la lista; FRM-Listado y M-FRM-Listado van al Archivo, y M-FRM-Respuestas
    queda como la pestaña Respuestas en el teléfono;
  - FRM-Tablero y M-FRM-Tablero (nuevos): el tablero que se arma solo (decisión 57), como en la maqueta;
  - las pestañas, en la planilla, el editor y lo que se abre sobre ellos;
  - sale «Diseñar formularios» del panel, de Más en el teléfono, de las migas y de los enlaces de todos los tableros vigentes.
- 80: salen «Envío sin confirmar», «Ya lo revisé» y «Resolver el envío»; lo que no se sabe si salió se reintenta solo. Lo del
  chat lo saca `formularios_e12_sin_idioma_1004.py`; acá, la actividad de una respuesta (FRM-Respuesta-Aprobacion).

Corre después de `formularios_e12b_ciclo_de_vida_1004.py` y antes de `campana_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_e12b_ciclo_de_vida_1004 as B  # noqa: E402
import gestion_formularios_1004 as G  # noqa: E402
import menus_y_solo_lectura_1004 as M  # noqa: E402
import formularios_etapas_1004 as ET  # noqa: E402

PROJ = A.PROJ
APROBADO = True  # el usuario la aprobó el 25/10 («publicalo y commitea», versión 141)
PARA_APROBAR = " · para aprobar"
svg, MAS, CHEV, TILDE, ALERTA = A.svg, A.MAS, A.CHEV, A.TILDE, A.ALERTA
mi, SEP, r = B.mi, B.SEP, B.r

# El panel ya no tiene «Diseñar formularios» (79)
G.ENTRADAS[:] = [e for e in G.ENTRADAS if e[0] != "disenar"]


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


def con_css(t, marca, bloque):
    t = re.sub(rf'<style data-f79="{marca}">.*?</style>\n', "", t, flags=re.S)
    return t.replace("</helmet>", f'<style data-f79="{marca}">\n{bloque}</style>\n</helmet>', 1)


def quitar_bloque(t, inicio):
    """Saca un <sc-if> entero, con lo que tenga adentro."""
    i = t.index(inicio)
    nivel = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        nivel += 1 if m.group(0) == "<sc-if" else -1
        if nivel == 0:
            return t[:i] + t[i + m.end():]
    raise ValueError(inicio)


def opciones_de(t):
    return json.loads(re.search(r"data-props='([^']*)'", t).group(1)).get("estado", {}).get("options", [])


def sin_estados(t, quitar, defecto=None):
    """Saca estados del Tweak sin renumerar las banderas: la lógica sigue buscando en la lista vieja."""
    props = json.loads(re.search(r"data-props='([^']*)'", t).group(1))
    viejas = props["estado"]["options"]
    for e in quitar:
        k = viejas.index(e)
        while f'<sc-if value="{{{{s{k}}}}}"' in t:
            t = quitar_bloque(t, next(x.group(0) for x in re.finditer(rf'<sc-if value="\{{\{{s{k}\}}\}}"[^>]*>', t)))
    props["estado"]["options"] = [e for e in viejas if e not in quitar]
    if defecto:
        props["estado"]["default"] = defecto
        t = re.sub(r'const e = this\.props\.estado \?\? "[^"]*";', f'const e = this.props.estado ?? "{defecto}";', t, count=1)
    m = re.search(r"data-props='([^']*)'", t)
    return t[:m.start()] + "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'" + t[m.end():]


# ================================================================ La lista «Formularios» (79), según la etapa (78)
class Etapa:
    """Lo que existe hasta una etapa (decisión 78): la 15 suma las respuestas, la 17 el ciclo de vida, la 21 la aprobación
    y la 22 las plantillas. Cada versión de la lista es un tablero aparte, con su etapa en el nombre (decisión del usuario, 25/10)."""

    def __init__(self, n):
        self.n, self.resp, self.ciclo, self.aprob, self.plantilla = n, n >= 15, n >= 17, n >= 21, n >= 22
        self.carga = n >= 20


# (nombre, clave, (clase, estado en WhatsApp, ⓘ), preguntas, último cambio, por aprobar, respuestas, última o None)
# Un dato por celda, en un renglón (decisión del usuario del 25/10): sin el prefijo debajo del nombre ni quién hizo el último cambio;
# las fechas, completas y con su hora (formatos.md, 25/10).
# La última respuesta, como la maqueta (3b9c967): su número en una columna y cuándo llegó en otra («Recibida»).
FILAS = [
    ("Pedido de materiales", "Ped", ("", "Solo en la app · versión 4", "Usa una lista dependiente."), 11, "15/10/2026 12:10", 0, 46, ("PED-000046", "15/10/2026 12:32", "FRM-Respuesta-20.dc.html")),
    ("Visita a cliente", "Vis", ("{{estVisClase}}", "{{estVis}}", ""), 7, "08/10/2026 14:20", 3, 24, ("VIS-000130", "15/10/2026 16:20", "FRM-Respuesta-Aprobacion.dc.html")),
    ("Entrega de pedido", "Ent", ("", "Publicado · versión 1", ""), 5, "02/10/2026 09:15", 1, 48, ("ENT-000048", "14/10/2026 10:05", "FRM-Respuesta.dc.html")),
    ("Control de vehículo", "Con", ("mal", "No se pudo publicar", "La versión 2 publicada sigue activa."), 7, "12/10/2026 17:40", 0, 31,
     ("VEH-000031", "12/10/2026 18:05", "FRM-Respuesta.dc.html")),
    ("Reclamo", "Rec", ("off", "Borrador", ""), 4, "14/10/2026 11:05", 0, 0, None),
    ("Relevamiento de obra", "Rel", ("baja", "Dado de baja · versión 2", "Se deprecan en WhatsApp cuando venzan los 2 envíos abiertos."), 6,
     "09/10/2026 16:30", 0, 12, ("REL-000012", "30/09/2026 10:15", "FRM-Respuesta.dc.html")),
]
COPIAR = mi("duplicar", "Copiar", "FRM-Copiar.dc.html")
BORRAR_NO = SEP + mi("borrar", "Borrar", off=B.CON_RESPUESTAS, tip=True)  # con respuestas queda grisado, con su motivo (43 y 132)
MENUS = {  # como la maqueta: Editar (o Ver, sin permiso de diseñar), y lo de la 17 según el estado y el permiso
    "Vis": mi("editar", "Editar", "FRM-Editor.dc.html") + COPIAR + mi("cancelar", "Dar de baja", "FRM-Dar-De-Baja.dc.html") + BORRAR_NO,
    "VisPub": mi("editar", "Editar", "FRM-Editor.dc.html") + COPIAR + mi("cancelar", "Dar de baja", off=B.NO_PUBLICA, tip=True) + BORRAR_NO,
    "VisSoloPublica": mi("ver", "Ver", "FRM-Editor.dc.html") + mi("cancelar", "Dar de baja", "FRM-Dar-De-Baja.dc.html"),
    "VisLectura": mi("ver", "Ver", "FRM-Editor.dc.html"),
    "Rec": mi("editar", "Editar", "FRM-Editor.dc.html") + COPIAR + SEP + mi("borrar", "Borrar", "FRM-Reactivar-Eliminar.dc.html", peligro=True),
    "Rel": mi("editar", "Editar", "FRM-Editor-Baja.dc.html") + mi("reenviar", "Reactivar", "FRM-Reactivar-Eliminar.dc.html") + COPIAR + BORRAR_NO,
}


def estados_lista(e):
    est = ["Activos" if e.ciclo else "Lista", "Estado: menú"]
    if e.aprob:
        est.append("Aprobación: menú")
    est += ["Publicados", "Borradores"]
    if e.aprob:
        est.append("Con algo por aprobar")
    if e.ciclo:
        est.append("Dados de baja")
    if e.plantilla:
        est.append("Nuevo formulario: menú")
    if e.ciclo:
        est += ["Acciones de un publicado", "Acciones de un borrador", "Acciones de un dado de baja", "Acciones mientras se publica", "Solo puede publicar"]
    else:
        est.append("Publicando")
    est.append("Solo lectura")
    if e.resp:
        est.append("Quien solo ve respuestas")
    if e.ciclo:
        est.append("Quien solo ve respuestas: dados de baja")  # sin el filtro, no llegaría a las respuestas de un dado de baja
    if e.carga:
        est += ["Uno solo para clientes", "Quien solo carga", "Quien solo carga: dados de baja"]
    if e.aprob:
        est.append("Quien solo aprueba")
    return est + ["Sin coincidencias", "Cargando", "Todavía no hay formularios", "No se pudo cargar", "Sin permiso"]


CSS_LISTA = """.w-th.fx14, .w-tr.fx14 { grid-template-columns: minmax(200px, 1.4fr) 100px minmax(200px, 1.2fr) minmax(220px, 1.2fr); }
.w-th.fx15, .w-tr.fx15 { grid-template-columns: minmax(200px, 1.3fr) minmax(190px, 1.1fr) 100px 136px 150px; }
.w-th.fx17, .w-tr.fx17 { grid-template-columns: minmax(170px, 1.2fr) minmax(180px, 1.1fr) 96px 130px 146px 40px; }
.w-th.fx21, .w-tr.fx21 { grid-template-columns: minmax(150px, 1.15fr) minmax(170px, 1.1fr) 88px 92px 122px 140px 40px; }
.w-th.fx20, .w-tr.fx20 { grid-template-columns: minmax(160px, 1fr) minmax(190px, 1.1fr) 88px 112px 132px 72px 40px; }
.w-th.fx21c, .w-tr.fx21c { grid-template-columns: minmax(150px, 1.05fr) minmax(176px, 1.05fr) 84px 88px 110px 132px 72px 40px; }
.w-tr.fx21c { position: relative; min-height: 40px; }
.w-th.fx1, .w-tr.fx1 { grid-template-columns: minmax(0, 1fr) 72px; }
.w-tr .cb-ch { height: 30px; padding: 0 10px; font-size: 13px; justify-self: end; }
.w-tr > .e-tipw { justify-self: end; overflow: visible; }
.w-tr .cb-ch[disabled] { opacity: 0.55; cursor: default; }
.w-body .w-caja:has(.e-tip) { overflow: visible; }
.w-th.fx3, .w-tr.fx3 { grid-template-columns: minmax(220px, 1.4fr) 110px 136px 150px; }
.w-th .ord { margin-left: 4px; font-size: 10px; color: var(--t2); }
.w-tr .fx-num { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; color: var(--t1); text-decoration: none; }
.w-th.fx2, .w-tr.fx2 { grid-template-columns: minmax(220px, 1fr) 160px; }
.w-tr.fx14, .w-tr.fx15, .w-tr.fx17, .w-tr.fx20, .w-tr.fx1, .w-tr.fx21, .w-tr.fx3, .w-tr.fx2 { position: relative; min-height: 40px; }
.w-tr .fx-f { color: var(--t1); text-decoration: none; font-variant-numeric: tabular-nums; }
.fx-n, .fx-u { display: flex; flex-direction: column; gap: 2px; min-width: 0; line-height: 1.35; }
.fx-n a { color: var(--t1); font-weight: 500; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fx-n a:hover { text-decoration: underline; }
.fx-n small, .fx-u small { font-size: 12.5px; color: var(--t3); display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.fx-u .pl-num { font-weight: 600; color: var(--t1); font-variant-numeric: tabular-nums; letter-spacing: 0.02em; text-decoration: none; font-size: 13px; }
.w-tr .est2 { display: flex; align-items: center; gap: 2px; min-width: 0; }
.w-tr .num { font-variant-numeric: tabular-nums; justify-self: start; text-align: left; }
.w-tr .f-menu { position: absolute; right: 12px; top: calc(100% - 8px); left: auto; z-index: 25; min-width: 220px; }
.w-body .w-caja:has(.f-menu) { overflow: visible; }
.fm-cnt { min-width: 22px; height: 22px; padding: 0 7px; box-sizing: border-box; border-radius: 999px; background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.fm-no { color: var(--t3); }
.w-est.amb { color: oklch(0.45 0.1 70); }
.w-est.amb::before { background: oklch(0.72 0.15 70); }
.w-est.off::before { background: var(--t3); }
.w-est.baja { color: var(--t2); }
.w-est.baja::before { background: var(--t3); }
.w-est.pend::before { background: oklch(0.72 0.15 70); }
.pl-pagina { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; color: var(--t1); min-height: 520px; }
.pl-pagina .ic { width: 52px; height: 52px; border-radius: 14px; background: var(--s2); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.pl-pagina b { font-size: 18px; font-weight: 600; }
.w-us .tx b span, .um .tx b span { color: inherit; font-size: inherit; }
"""


def c_nombre(n, abre):
    return f'<span class="fx-n"><a href="{abre}">{n}</a></span>'


def c_whatsapp(clase, texto, info):
    return f'<span class="est2"><span class="w-est {clase}">{texto}</span>{F.info(info) if info else ""}</span>'


def c_aprobar(apr):
    return f'<span><span class="fm-cnt" aria-label="{apr} por aprobar">{apr}</span></span>' if apr else '<span class="fm-no">—</span>'


def c_ultima(u, e):
    """La última respuesta: su número, que la abre, y cuándo llegó, cada uno en su columna; lo que espera aprobación lo dice
    «Por aprobar» desde la 21."""
    if not u:
        return '<span class="fm-no">—</span><span class="fm-no">—</span>'
    num, cuando, destino = u
    return f'<span><a class="fx-num" href="{destino if e.aprob or "-20." in destino else "FRM-Respuesta.dc.html"}">{num}</a></span><span class="num">{cuando}</span>'


def grilla_de(e):
    return "fx21c" if e.aprob and e.carga else "fx21" if e.aprob else "fx20" if e.carga else "fx17" if e.ciclo else "fx15" if e.resp else "fx14"


SOLO_CLIENTES = "Es solo para clientes: se responde por WhatsApp."


def c_cargar(n, k):
    """«Cargar» al final de la fila (83): no aparece en un borrador ni en un dado de baja, y en uno solo para clientes queda grisado, con su motivo (43)."""
    if k in ("Rec", "Rel"):
        return "<span></span>"
    if k == "Ent":
        tip = f'<sc-if value="{{{{tipCliente}}}}" hint-placeholder-val="{{{{no}}}}"><span class="e-tip" role="tooltip">{SOLO_CLIENTES}</span></sc-if>'
        return f'<span class="e-tipw"><button type="button" class="cb cb-sec cb-ch" disabled title="{SOLO_CLIENTES}" aria-label="Cargar {n}">Cargar</button>{tip}</span>'
    return f'<a class="cb cb-sec cb-ch" href="FRM-Cargar-Respuesta.dc.html" aria-label="Cargar {n}">Cargar</a>'


# Lo de quien solo carga (153, que cambia la 83): cuántas cargó de cada formulario y la última, con su número y cuándo llegó; sin cargas,
# «Todavía no cargaste». Nunca los totales de la organización. Es Tomás Acosta: coincide con lo propio (5 de «Pedido de materiales», con
# PED-000046, en la 20; 6 de «Visita a cliente», con VIS-000126, en la 21) y con los dados de baja (REL-000012).
MIS_CARGAS = {"Pedido de materiales": (5, "PED-000046", "15/10/2026 12:32"), "Visita a cliente": (6, "VIS-000126", "13/10/2026 15:30"),
              "Relevamiento de obra": (2, "REL-000012", "30/09/2026 10:15")}
NO_CARGO = "Todavía no cargaste"
CSS_MIS = """.w-th.fx1c, .w-tr.fx1c { grid-template-columns: minmax(200px, 1.4fr) 110px 150px 150px 72px; }
.w-tr.fx1c { position: relative; min-height: 40px; }
"""


def c_mis(n):
    """«Mis cargas», «Mi última carga», que abre lo suyo, y «Recibida»; sin cargas, «Todavía no cargaste»."""
    d = MIS_CARGAS.get(n)
    if not d:
        return f'<span class="num">0</span><span class="fm-no">{NO_CARGO}</span><span class="fm-no">—</span>'
    return f'<span class="num">{d[0]}</span><span><a class="fx-num" href="FRM-Respuestas-Propias.dc.html">{d[1]}</a></span><span class="num">{d[2]}</span>'


def fila(f, cols, e):
    n, k, (clase, texto, info), preg, cambio, apr, resp, ult = f
    defecto = "no" if k == "Rel" else "si"
    abre = "FRM-Respuestas.dc.html" if e.resp and k != "Rec" else ("FRM-Editor-Baja.dc.html" if k == "Rel" else "FRM-Editor.dc.html")
    if k == "Ped":
        abre = "FRM-Respuestas-20.dc.html"
    if cols == "todas":
        if not e.resp:
            celdas = c_nombre(n, abre) + f'<span class="num">{preg}</span>' + c_whatsapp(clase, texto, info) + f'<span class="num">{cambio}</span>'
        else:
            celdas = c_nombre(n, abre) + c_whatsapp(clase, texto, info) + (c_aprobar(apr) if e.aprob else "") + f'<span class="num">{resp}</span>' + c_ultima(ult, e)
            if e.carga:
                celdas += c_cargar(n, k)
            if e.ciclo:
                menus = "".join(f'<sc-if value="{{{{m{clave}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="f-menu" role="menu" aria-label="Acciones de {n}">{h}</div></sc-if>'
                                for clave, h in MENUS.items() if clave.startswith(k))
                celdas += f'<span><button type="button" class="ib" aria-label="Acciones de {n}" aria-haspopup="menu">{A.KEBAB}</button></span>{menus}'
        grilla = grilla_de(e)
    elif cols == "lee":
        celdas = c_nombre(n, abre) + f'<span class="num">{resp}</span>' + c_ultima(ult, e)
        grilla = "fx3"
    elif cols == "carga":  # `formrecords.create` sin `formrecords.read`: sus formularios, con lo suyo y sin los totales de la organización (85 y 153)
        celdas = c_nombre(n, "FRM-Respuestas-Propias.dc.html") + c_mis(n) + c_cargar(n, k)
        grilla = "fx1c"
    elif cols == "lectura":  # `forms.read` sin `formrecords.read`: sin las columnas de respuestas
        celdas = c_nombre(n, "FRM-Editor-Baja.dc.html" if k == "Rel" else "FRM-Editor.dc.html") + f'<span class="num">{preg}</span>' + c_whatsapp(clase, texto, info) + f'<span class="num">{cambio}</span>'
        grilla = "fx14"
    else:
        celdas = c_nombre(n, abre) + c_aprobar(apr)
        grilla = "fx2"
    return f'<sc-if value="{{{{r{k}}}}}" hint-placeholder-val="{{{{{defecto}}}}}"><div class="w-tr {grilla}">{celdas}</div></sc-if>'


def tabla(cols, bandera, e):
    if cols == "todas":
        cab = ["Formulario", "Preguntas", "En WhatsApp", "Último cambio"] if not e.resp else (
            ["Formulario", "En WhatsApp"] + (["Por aprobar"] if e.aprob else []) + ["Respuestas", "Última respuesta", "Recibida"]
            + (['<span class="sr">Cargar</span>'] if e.carga else []) + (['<span class="sr">Acciones</span>'] if e.ciclo else []))
        clase = grilla_de(e)
    elif cols == "lee":
        cab, clase = ["Formulario", "Respuestas", "Última respuesta", "Recibida"], "fx3"
    elif cols == "lectura":
        cab, clase = ["Formulario", "Preguntas", "En WhatsApp", "Último cambio"], "fx14"
    elif cols == "carga":
        cab, clase = ["Formulario", "Mis cargas", "Mi última carga", "Recibida", '<span class="sr">Cargar</span>'], "fx1c"
    else:
        cab, clase = ["Formulario", "Por aprobar"], "fx2"
    # La columna por la que está ordenada muestra ▲ (el usuario, 25/10)
    th = f'<div class="w-th {clase}">' + "".join(c if c.startswith("<span") else f'<span aria-sort="ascending">{c}<span class="ord" aria-hidden="true">▲</span></span>'
                                                 if c == "Formulario" else f"<span>{c}</span>" for c in cab) + "</div>"
    filas = "".join(fila(f, cols, e) for f in FILAS if (cols in ("todas", "lectura") or f[1] != "Rec") and (e.ciclo or f[1] != "Rel") and (e.carga or f[1] != "Ped"))
    return f'<sc-if value="{{{{{bandera}}}}}" hint-placeholder-val="{{{{{"si" if cols == "todas" else "no"}}}}}">{th}{filas}</sc-if>'


def cuerpo_lista(e):
    aprob = ('<sc-if value="{{conAprobacion}}" hint-placeholder-val="{{si}}">'
             + F.filtro("Aprobación", [("t", "Todos", 4), ("c", "Con algo por aprobar", 2), ("n", "Nada por aprobar", 2)], "apr") + "</sc-if>") if e.aprob else ""
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            '<sc-if value="{{conEstado}}" hint-placeholder-val="{{si}}">'
            + F.filtro("Estado", ([("t", "Activos", 4), ("p", "Publicados", 3), ("b", "Borradores", 1), ("d", "Dados de baja", 1)] if e.ciclo
                                  else [("t", "Todos los estados", 4), ("p", "Publicados", 3), ("b", "Borradores", 1)]), "est") + "</sc-if>" + aprob
            + '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl">Limpiar filtros</button></sc-if>'
            '<span class="tot">{{total}}</span></div></sc-if>')
    tablas = tabla("todas", "colsTodas", e) + (tabla("lee", "colsLee", e) + tabla("lectura", "colsLectura", e) if e.resp else "") + (tabla("aprueba", "colsAprueba", e) if e.aprob else "")
    if e.carga:
        tablas += tabla("carga", "colsCarga", e)
    lista = ('<sc-if value="{{conTabla}}" hint-placeholder-val="{{si}}"><div class="w-caja">'
             '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + tablas
             + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
             '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
             '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay formularios.</b></div></sc-if>'
             '<sc-if value="{{sinCoincidencias}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ningún formulario coincide con los filtros.</b><button type="button" class="cb cb-enl">Limpiar filtros</button></div></sc-if>'
             '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar los formularios.</b><button type="button" class="cb cb-sec">Reintentar</button></div></sc-if>'
             "</div></sc-if>")
    sin_permiso = (f'<sc-if value="{{{{sinPermiso}}}}" hint-placeholder-val="{{{{no}}}}"><div class="pl-pagina"><span class="ic">{G.CANDADO}</span>'
                   '<b>No tenés permiso para ver esta página.</b><a class="cb cb-sec" href="Inicio-Org.dc.html">Ir al inicio</a></div></sc-if>')
    return '<div class="w-body">' + caja + lista + sin_permiso + "</div>"


def acciones_lista(e):
    if e.plantilla:
        return B.acciones_listado()
    return ('<sc-if value="{{conNuevo}}" hint-placeholder-val="{{si}}">'
            f'<a class="cb cb-pri" href="FRM-Editor.dc.html">{MAS} Nuevo formulario</a></sc-if>')


def js_carga(js, aprob=False):
    """La 20 y la 21: suman «Pedido de materiales» y quien solo carga; la 21 conserva lo que espera aprobación."""
    if aprob:
        filas = ("const filas = baja || bor ? 1 : conAlgo || aprueba ? 2 : carga ? 3 : pub || lee ? 4 : 5;",
                 ": baja ? '1 dado de baja' : carga ? '3 activos' : lee ? '4 activos' : aprueba ? '4 por aprobar' : '5 activos · 4 por aprobar',")
        filas_r = ("rPed: lista && !baja && !bor && !conAlgo && !aprueba, rVis: lista && !baja && !bor, rEnt: lista && !baja && !bor && !carga, rCon: lista && !baja && !bor && !conAlgo && !aprueba,",
                   "rRec: lista && !baja && !pub && !conAlgo && !lee && !aprueba && !carga, rRel: baja,")
        for a, b in [("aprC_t: '4', aprC_c: '2', aprC_n: '2',", "aprC_t: '5', aprC_c: '2', aprC_n: '3',")]:
            assert a in js, a
            js = js.replace(a, b)
    else:
        filas = ("const filas = baja || bor ? 1 : carga ? 3 : pub || lee ? 4 : 5;", ": baja ? '1 dado de baja' : carga ? '3 activos' : lee ? '4 activos' : '5 activos · 1 dado de baja',")
        filas_r = ("rPed: lista && !baja && !bor, rVis: lista && !baja && !bor, rEnt: lista && !baja && !bor && !carga, rCon: lista && !baja && !bor,",
                   "rRec: lista && !baja && !pub && !lee && !carga, rRel: baja,")
    for a, b in [("const leeBaja = v === 'Quien solo ve respuestas: dados de baja';",
                  "const leeBaja = v === 'Quien solo ve respuestas: dados de baja', cargaBaja = v === 'Quien solo carga: dados de baja', carga = v === 'Quien solo carga' || cargaBaja;"),
                 ("const baja = v === 'Dados de baja' || v === 'Acciones de un dado de baja' || leeBaja;", "const baja = v === 'Dados de baja' || v === 'Acciones de un dado de baja' || leeBaja || cargaBaja;"),
                 ("const disena = !lee && !aprueba && v !== 'Sin permiso';", "const disena = !lee && !aprueba && !carga && v !== 'Sin permiso';"),
                 ("const quien = lee ? ", "const quien = carga ? ['Tomás Acosta', 'tomas.acosta@delta.ejemplo.com', 'T'] : lee ? "),
                 ("const filas = baja || bor ? 1 : conAlgo ? 2 : pub || lee || aprueba ? 3 : 4;", filas[0]),
                 (": baja ? '1 dado de baja' : lee ? '3 activos' : aprueba ? '4 por aprobar' : !CI ? '4 formularios' : AP ? '4 activos · 4 por aprobar' : '4 activos · 1 dado de baja',", filas[1]),
                 ("conEstado: disena || (CI && lee),", "conEstado: disena || lee || carga,"),
                 # quien solo carga no ve lo que espera aprobación de la organización: ni el filtro «Aprobación» ni la cuenta del panel (153)
                 ("conCnt: AP && !lee,", "conCnt: AP && !lee && !carga,"),
                 ("conAprobacion: !lee && v !== 'Sin permiso' && !baja,", "conAprobacion: !lee && !carga && v !== 'Sin permiso' && !baja,"),
                 ("estC_t: '4', estC_p: '3', estC_b: '1', estC_d: '1',", "estC_t: '5', estC_p: '4', estC_b: '1', estC_d: '1',"),
                 ("colsTodas: disena && !(R && lectura), colsLee: lee, colsLectura: R && lectura,", "colsTodas: disena && !(R && lectura), colsLee: lee, colsLectura: R && lectura, colsCarga: carga, conWa: !carga, tipCliente: v === 'Uno solo para clientes',"),
                 ("rVis: lista && !baja && !bor, rEnt: lista && !baja && !bor, rCon: lista && !baja && !bor && !conAlgo,", filas_r[0]),
                 ("rRec: lista && !baja && !pub && !conAlgo && !lee && !aprueba, rRel: baja,", filas_r[1])]:
        assert a in js, a
        js = js.replace(a, b)
    return js


def js_lista(vista, e):
    js = js_base(vista, e)
    return js_carga(js, e.aprob) if e.carga else js


def js_base(vista, e):
    R, CI, AP = (json.dumps(x) for x in (e.resp, e.ciclo, e.aprob))
    return f"""    const v = {vista};
    const R = {R}, CI = {CI}, AP = {AP};
    const leeBaja = v === 'Quien solo ve respuestas: dados de baja';
    const lee = v === 'Quien solo ve respuestas' || leeBaja, aprueba = v === 'Quien solo aprueba', soloPub = v === 'Solo puede publicar', lectura = v === 'Solo lectura';
    const baja = v === 'Dados de baja' || v === 'Acciones de un dado de baja' || leeBaja;
    const pub = v === 'Publicados', bor = v === 'Borradores', conAlgo = v === 'Con algo por aprobar';
    const estMenu = v === 'Estado: menú', aprMenu = v === 'Aprobación: menú', nuevoMenu = v === 'Nuevo formulario: menú';
    const publicando = v === 'Acciones mientras se publica' || v === 'Publicando';
    const lista = !['Sin coincidencias', 'Cargando', 'Todavía no hay formularios', 'No se pudo cargar', 'Sin permiso'].includes(v);
    const disena = !lee && !aprueba && v !== 'Sin permiso';
    const quien = lee ? ['Julieta Sosa', 'julieta.sosa@delta.ejemplo.com', 'J'] : aprueba ? ['Martín Paz', 'martin.paz@delta.ejemplo.com', 'M']
      : v === 'Sin permiso' ? ['Tomás Acosta', 'tomas.acosta@delta.ejemplo.com', 'T'] : ['Lucía Fernández', 'lucia.fernandez@delta.ejemplo.com', 'L'];
    const filas = baja || bor ? 1 : conAlgo ? 2 : pub || lee || aprueba ? 3 : 4;
    return {{
      si: true, no: false,
      yo: quien[0], yoCorreo: quien[1], yoIni: quien[2], conAdmin: disena, verFormularios: v !== 'Sin permiso', verDisena: disena,
      conCnt: AP && !lee, cntMenu: '4', conBanda: v !== 'Sin permiso',
      resumen: v === 'Cargando' || v === 'No se pudo cargar' ? '' : v === 'Todavía no hay formularios' ? 'Sin formularios'
        : baja ? '1 dado de baja' : lee ? '3 activos' : aprueba ? '4 por aprobar' : !CI ? '4 formularios' : AP ? '4 activos · 4 por aprobar' : '4 activos · 1 dado de baja',
      conNuevo: disena && !soloPub && !lectura, menuNuevo: nuevoMenu, expNuevo: nuevoMenu ? 'true' : 'false',
      conFiltros: !['Todavía no hay formularios', 'Sin permiso'].includes(v), conEstado: disena || (CI && lee), conAprobacion: !lee && v !== 'Sin permiso' && !baja,
      busqueda: v === 'Sin coincidencias' ? 'inspección' : 'Buscar formulario', busClase: v === 'Sin coincidencias' ? 'lleno' : '',
      estTexto: pub ? 'Estado: Publicados' : bor ? 'Estado: Borradores' : baja ? 'Estado: Dados de baja' : 'Estado', estClase: pub || bor || baja ? 'con' : '', estMenu, estAlternar: () => {{}},
      estOn_t: pub || bor || baja ? '' : 'on', estOn_p: pub ? 'on' : '', estOn_b: bor ? 'on' : '', estOn_d: baja ? 'on' : '', estC_t: '4', estC_p: '3', estC_b: '1', estC_d: '1',
      estElegir_t: () => {{}}, estElegir_p: () => {{}}, estElegir_b: () => {{}}, estElegir_d: () => {{}},
      aprTexto: conAlgo ? 'Aprobación: Con algo por aprobar' : 'Aprobación', aprClase: conAlgo ? 'con' : '', aprMenu, aprAlternar: () => {{}},
      aprOn_t: conAlgo ? '' : 'on', aprOn_c: conAlgo ? 'on' : '', aprOn_n: '', aprC_t: '4', aprC_c: '2', aprC_n: '2',
      aprElegir_t: () => {{}}, aprElegir_c: () => {{}}, aprElegir_n: () => {{}},
      hayFiltro: pub || bor || baja || conAlgo || v === 'Sin coincidencias',
      total: v === 'Sin coincidencias' ? '0 formularios' : filas === 1 ? '1 formulario' : filas + ' formularios',
      conTabla: v !== 'Sin permiso', conFilas: lista, colsTodas: disena && !(R && lectura), colsLee: lee, colsLectura: R && lectura, colsAprueba: aprueba,
      rango: filas === 1 ? '1 de 1' : '1–' + filas + ' de ' + filas,
      rVis: lista && !baja && !bor, rEnt: lista && !baja && !bor, rCon: lista && !baja && !bor && !conAlgo,
      rRec: lista && !baja && !pub && !conAlgo && !lee && !aprueba, rRel: baja,
      estVis: publicando ? 'Publicando la versión 4' : 'Publicado · versión 3', estVisClase: publicando ? 'pend' : '',
      mVis: v === 'Acciones de un publicado', mVisPub: v === 'Acciones mientras se publica', mVisSoloPublica: soloPub, mVisLectura: CI && lectura,
      mRec: v === 'Acciones de un borrador', mRel: v === 'Acciones de un dado de baja',
      cargando: v === 'Cargando', vacio: v === 'Todavía no hay formularios', sinCoincidencias: v === 'Sin coincidencias', error: v === 'No se pudo cargar',
      sinPermiso: v === 'Sin permiso',
"""


def pagina_lista(nombre, estados, vista, capas=None, css="", e=None):
    """La lista de una etapa; con `capas`, un diálogo por estado encima (FRM-Copiar y FRM-Reactivar-Eliminar, de la 17)."""
    e = e or Etapa(17)
    flags = "".join(f"      c{i}: e === {json.dumps(k, ensure_ascii=False)},\n" for i, k in enumerate(estados)) if capas else ""
    js = js_lista(vista, e) + flags + "    };"
    banda = '<sc-if value="{{conBanda}}" hint-placeholder-val="{{si}}">' + F.banda("Formularios", "{{resumen}}", acciones_lista(e)) + "</sc-if>"
    t = A.pagina_ab(nombre, "Inicio / Formularios / Formularios", banda, cuerpo_lista(e),
                    css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + E.CSS_E12 + B.CSS_E12B + css, estados=("estado", estados), js=js)
    if capas:
        over = "".join(f'<sc-if value="{{{{c{estados.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
        t = F.con_dialogo(t, over, F.CSS_PUBLICAR + F.CSS_GRILLA + A.CSS_PUB)
    t = E.post(nombre if nombre.startswith("FRM-") else "FRM-Formularios", t)
    # El panel según los permisos, y quién mira (como MF1); el panel de cada etapa lo deja `panel_de_la_etapa`
    t = G.PANEL_RE.sub(lambda m: ET.panel(e.n, "formularios", {"formularios": "verFormularios", "catalogos": "verDisena", "faltan": "verDisena"}, "{{cntMenu}}"), t)
    t = t.replace('<span class="cnt">{{cntMenu}}</span>', '<sc-if value="{{conCnt}}" hint-placeholder-val="{{si}}"><span class="cnt">{{cntMenu}}</span></sc-if>')
    t = r(t, '<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>',
          '<div class="w-us"><span class="w-av">{{yoIni}}</span><span class="tx"><b>{{yo}}</b><span>{{yoCorreo}}</span></span></div>')
    t = re.sub(r'(<summary class="um"[^>]*>)<span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b>',
               r'\1<span class="w-av">{{yoIni}}</span><span class="tx"><b>{{yo}}</b>', t, count=1)
    t = re.sub(r'(<div class="w-abajo">)(<a class="w-ln" href="WA-Admin\.dc\.html">.*?</a>)',
               lambda m: m.group(1) + '<sc-if value="{{conAdmin}}" hint-placeholder-val="{{si}}">' + m.group(2) + "</sc-if>", t, count=1, flags=re.S)
    if e.carga:  # quien solo carga no ve WhatsApp
        t = re.sub(r'<a class="w-ln" href="WA-Chats\.dc\.html">.*?</a>', lambda m: '<sc-if value="{{conWa}}" hint-placeholder-val="{{si}}">' + m.group(0) + "</sc-if>", t, count=1, flags=re.S)
    return con_css(t, "lista", CSS_LISTA)


B.pagina_listado = pagina_lista  # FRM-Copiar y FRM-Reactivar-Eliminar, sobre la lista de la 17

LISTAS = {"FRM-Formularios": 14, "FRM-Formularios-15": 15, "FRM-Formularios-17": 17, "FRM-Formularios-20": 20, "FRM-Formularios-21": 21, "FRM-Formularios-22": 22}


def lista(n):
    e = Etapa(LISTAS[n])
    t = pagina_lista(n, estados_lista(e), "e", e=e)
    if e.resp:  # desde la 15, la planilla ya tiene respuestas de la versión 4
        t = t.replace("Publicado · versión 3", "Publicado · versión 4")
    if e.carga:
        t = con_css(t, "mis-cargas", CSS_MIS)
    return re.sub(r"<title>[^<]*</title>", f"<title>Formularios · /org/formularios · etapa {e.n}</title>", t)


# ================================================================ La lista en el teléfono
# (nombre, preguntas, respuestas, estado en WhatsApp, por aprobar, destino con respuestas)
T_FILAS = [("Visita a cliente", 7, 24, "Publicado · versión 3", "3"), ("Entrega de pedido", 5, 48, "Publicado · versión 1", "1"),
           ("Control de vehículo", 7, 31, "No se pudo publicar", ""), ("Reclamo", 4, 0, "Borrador", "")]
T_BAJA = ("Relevamiento de obra", 6, 12, "Dado de baja · versión 2", "")
CSS_TLISTA = """.ap-fila.fx { display: flex; align-items: center; gap: 8px; }
.ap-fila.fx a.tx { flex: 1; min-width: 0; text-decoration: none; color: inherit; display: flex; flex-direction: column; }
.ap-fila .l3 { font-size: 13px; color: var(--t3); }
.ap-fila .cb-ch { height: 36px; padding: 0 12px; font-size: 14px; flex-shrink: 0; }
.ap-fila .cb-ch[disabled] { opacity: 0.55; }
.ap-fila .fm-cnt { min-width: 24px; height: 24px; padding: 0 8px; box-sizing: border-box; border-radius: 999px; background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
"""
TLISTAS = {"M-FRM-Formularios": 14, "M-FRM-Formularios-15": 15, "M-FRM-Formularios-17": 17, "M-FRM-Formularios-20": 20, "M-FRM-Formularios-21": 21, "M-FRM-Formularios-22": 22}


def enlaces_21(t):
    """La lista de la 21 abre lo de la 21."""
    for a in ["FRM-Respuestas", "FRM-Cargar-Respuesta", "FRM-Editor", "FRM-Respuestas-Propias", "FRM-Dar-De-Baja"]:
        t = t.replace(f'"{a}.dc.html"', f'"{a}-21.dc.html"').replace(f'"M-{a}.dc.html"', f'"M-{a}-21.dc.html"')
    return t.replace('"M-FRM-Dar-De-Baja-21.dc.html"', '"M-FRM-Formularios-21.dc.html"')


def enlaces_de(n, t):
    """La lista de la 21 abre lo de la 21; la de la 22 también, y «Desde cero» abre el editor de un formulario nuevo."""
    if n.endswith("-22"):
        t = enlaces_21(t).replace('"M-FRM-Formularios-21.dc.html"', '"M-FRM-Formularios-22.dc.html"')
        return re.sub(r'href="(M-)?FRM-Editor-21\.dc\.html">((?:(?!</a>).)*?Desde cero)', r'href="\1FRM-Editor.dc.html">\2', t, flags=re.S)
    return enlaces_21(t) if n.endswith("-21") else t


def t_fila(f, e, menu=True, cuenta=True):
    n, preg, resp, est, apr = f
    href = "M-FRM-Respuestas.dc.html" if e.resp and est != "Borrador" else "M-FRM-Editor.dc.html"
    l2 = est if e.carga else f"{resp} respuestas · {est}" if e.resp else f"{preg} preguntas · {est}"
    c = f'<span class="fm-cnt" aria-label="{apr} por aprobar">{apr}</span>' if apr and e.aprob and cuenta else ""
    k = f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button>' if menu and e.ciclo else ""
    if n == "Pedido de materiales":
        href = "M-FRM-Respuestas-20.dc.html"
    l3 = f'<span class="l3">{resp} respuestas</span>' if e.carga else ""
    if e.carga and est != "Borrador":
        cnt = c  # desde la 21, lo que espera aprobación va antes de «Cargar»
        if n == "Entrega de pedido":  # lo apagado dice por qué: en el teléfono, debajo (43)
            c = cnt + '<button type="button" class="cb cb-sec cb-ch" disabled>Cargar</button>'
            l3 += f'<span class="l3">{SOLO_CLIENTES}</span>'
        else:
            c = cnt + '<a class="cb cb-sec cb-ch" href="M-FRM-Cargar-Respuesta.dc.html">Cargar</a>'
    return f'<div class="ap-fila fx"><a class="tx" href="{href}"><span class="l1">{n}</span><span class="l2">{l2}</span>{l3}</a>{c}{k}</div>'


def t_carga(f, baja=False):
    """Quien solo carga: sus formularios, con cuántas cargó y la última (153), y «Cargar» (85); en uno dado de baja ve lo suyo, sin «Cargar» (101)."""
    c = "" if baja else '<a class="cb cb-sec cb-ch" href="M-FRM-Cargar-Respuesta.dc.html">Cargar</a>'
    d = MIS_CARGAS.get(f[0])
    l2 = f"{d[0]} cargas · la última, {d[1]}, el {d[2]}" if d else NO_CARGO
    return f'<div class="ap-fila fx"><a class="tx" href="M-FRM-Respuestas-Propias.dc.html"><span class="l1">{f[0]}</span><span class="l2">{l2}</span></a>{c}</div>'


def tel_lista(n):
    e = Etapa(TLISTAS[n])
    bar = C.t_bar("Formularios", "Gestión de formularios", "M-WA-Menu.dc.html",
                  f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>')
    fab = f'<a class="ap-fab" aria-label="Nuevo formulario" href="{"#" if e.plantilla else "M-FRM-Editor.dc.html"}">{F.TFAB}</a>'

    def seg(baja, act="4"):
        return ""
    t_filas = ([("Pedido de materiales", 11, 46, "Solo en la app · versión 4", "")] + T_FILAS) if e.carga else T_FILAS
    activos = bar + seg(False) + '<div class="ap-cuerpo">' + "".join(t_fila(f, e) for f in t_filas) + "</div>" + fab
    esq = bar + seg(False) + '<div class="ap-cuerpo"><div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div></div>'
    error = bar + seg(False) + '<div class="ap-cuerpo"><div class="ap-vacio">No pudimos cargar los formularios.<button type="button" class="cb cb-sec">Reintentar</button></div></div>'
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")

    def grupo(tit, ops):  # como la hoja de filtros de Catálogos: cada opción con su cantidad a la derecha
        return f'<div class="p-tit2">{tit}</div>' + "".join(f'<span class="t-opc {"on" if k == 0 else ""}" role="menuitemradio" aria-checked="{"true" if k == 0 else "false"}">{x}'
                                                         f'<span class="d">{c}{tilde if k == 0 else ""}</span></span>' for k, (x, c) in enumerate(ops))
    filtros = grupo("Estado", [("Activos" if e.ciclo else "Todos los estados", 4), ("Publicados", 3), ("Borradores", 1)] + ([("Dados de baja", 1)] if e.ciclo else []))
    if e.aprob:
        filtros += grupo("Aprobación", [("Todos", 4), ("Con algo por aprobar", 2), ("Nada por aprobar", 2)])
    capas = {"Filtros": F.thoja("Filtros", filtros, '<button type="button" class="cb cb-pri">Ver 4 formularios</button>').replace('<div class="hb">', '<div class="hb lst">', 1)}
    if not e.ciclo:
        E_T = ["Lista", "Filtros", "Cargando", "No se pudo cargar"]
        cuerpo = {"Lista": activos, "Filtros": activos, "Cargando": esq, "No se pudo cargar": error}
    else:
        E_T = ["Activos", "Filtros", "Dados de baja", "Acciones de un publicado", "Acciones de un borrador", "Acciones de un dado de baja",
               "Copiar", "Dar de baja", "Reactivar", "Borrar"] + (["Nuevo formulario: elegir"] if e.plantilla else []) + ["Quien solo ve respuestas", "Quien solo ve respuestas: filtros"]
        E_T += (["Quien solo carga", "Quien solo carga: dados de baja"] if e.carga else []) + (["Quien solo aprueba"] if e.aprob else []) + ["Cargando", "No se pudo cargar"]
        bajas = bar + seg(True) + '<div class="ap-cuerpo">' + t_fila(T_BAJA, e) + "</div>" + fab
        lee = bar + seg(False, "3") + '<div class="ap-cuerpo">' + "".join(t_fila(f, e, menu=False, cuenta=False) for f in t_filas[:3]) + "</div>"
        cuerpo = {x: (bajas if x in ("Dados de baja", "Acciones de un dado de baja", "Reactivar") else lee if x.startswith("Quien solo ve respuestas")
                      else esq if x == "Cargando" else error if x == "No se pudo cargar" else activos) for x in E_T}
        if e.n == 17:  # 131 (v169): «Reactivar» de la lista lleva al formulario y abre ahí su hoja, como en M-FRM-Editor-Baja
            cuerpo["Reactivar"] = B.t_pantalla_baja(f"{n}.dc.html")
        if e.carga:
            cuerpo["Quien solo carga"] = bar + '<div class="ap-cuerpo">' + "".join(t_carga(f) for f in [t_filas[0], t_filas[1], t_filas[3]]) + "</div>"
            cuerpo["Quien solo carga: dados de baja"] = bar + '<div class="ap-cuerpo">' + t_carga(T_BAJA, baja=True) + "</div>"
        if e.aprob:  # quien solo aprueba: los formularios con algo para decidir, sin respuestas (100)
            cuerpo["Quien solo aprueba"] = bar + '<div class="ap-cuerpo">' + "".join(
                f'<div class="ap-fila fx"><a class="tx" href="M-FRM-Respuestas.dc.html"><span class="l1">{f[0]}</span><span class="l2">Por aprobar</span></a>'
                f'<span class="fm-cnt" aria-label="{f[4]} por aprobar">{f[4]}</span></div>' for f in T_FILAS if f[4]) + "</div>"
        copiar_h = F.tcampo("Nombre", "Visita a cliente (copia)", req=True) + F.tcampo("Prefijo de numeración", "VIS2", req=True)
        baja_h = ('<div class="p-tit2">Qué deja de pasar</div><span class="t-lin">' + B.CHAT + ' No se manda más desde el chat.</span>'
                  '<div class="p-tit2">Envíos abiertos y WhatsApp</div><span class="t-lin">' + B.RELOJ + ' 2 envíos abiertos: el último vence el 25/10/2026 a las 18:40.</span>'
                  '<div class="t-aviso">' + ALERTA + '<span>En WhatsApp no se deshace. Al vencer los envíos abiertos, se deprecan sus Flows. Para volver a usarlo, se reactiva con una versión nueva.</span></div>'
                  '<div class="p-tit2">Lo que se conserva</div><span class="t-lin">' + TILDE + ' Se conservan las 24 respuestas.</span>')
        pie2 = lambda b, cls="cb-pri": f'<button type="button" class="cb {cls}">{b}</button><button type="button" class="cb cb-sec">Cancelar</button>'
        capas.update({
            "Acciones de un publicado": M.hoja("Visita a cliente", '<a role="menuitem" href="M-FRM-Editor.dc.html">Editar</a><span role="menuitem">Copiar</span><span role="menuitem">Dar de baja</span><span class="sep" role="separator"></span>' + B.BORRAR_OFF),
            "Acciones de un borrador": M.hoja("Reclamo", '<a role="menuitem" href="M-FRM-Editor.dc.html">Editar</a><span role="menuitem">Copiar</span><span class="sep" role="separator"></span><span role="menuitem" class="pel">Borrar</span>'),
            "Acciones de un dado de baja": M.hoja("Relevamiento de obra", '<a role="menuitem" href="M-FRM-Editor-Baja.dc.html">Editar</a><span role="menuitem">Reactivar</span><span role="menuitem">Copiar</span><span class="sep" role="separator"></span>' + B.BORRAR_OFF),
            "Copiar": F.thoja("Copiar «Visita a cliente»", copiar_h, pie2("Copiar")),
            "Dar de baja": F.thoja("Dar de baja «Visita a cliente»", baja_h, pie2("Dar de baja")),
            "Reactivar": F.thoja(B.TIT_REACTIVAR, B.REACTIVAR_T, B.PIE_REACTIVAR_T),
            "Borrar": F.thoja("¿Borrar «Reclamo»?", '<p class="d-tx">Deja de aparecer en la lista y no se puede volver a usar. El prefijo REC queda reservado.</p>', pie2("Borrar", "cb-pel lleno")),
            "Quien solo ve respuestas: filtros": F.thoja("Filtros", grupo("Estado", [("Activos", 3), ("Dados de baja", 1)]), '<button type="button" class="cb cb-pri">Ver 3 formularios</button>').replace('<div class="hb">', '<div class="hb lst">', 1),
        })
        if e.plantilla:
            capas["Nuevo formulario: elegir"] = M.hoja("Nuevo formulario", '<a role="menuitem" href="M-FRM-Editor.dc.html">Desde cero</a><a role="menuitem" href="M-FRM-Biblioteca.dc.html">Desde una plantilla</a>')
    t = C.tel_pagina(cuerpo, E_T, capas, f"Formularios · teléfono · etapa {e.n}", A.CSS_TCHAT_AB + E.CSS_E12 + B.CSS_E12B + E.CSS_TED_E12 + F.CSS_TFILTRO + B.CSS_TDET
                     + (B.CSS_TBAJA if e.n == 17 else ""))
    if e.resp:
        t = t.replace("Publicado · versión 3", "Publicado · versión 4")
    t = M.css(t, M.CSS_HOJA, "hoja")
    if e.n == 17:  # el formulario de «Reactivar», con sus pestañas, como cuando se abre
        t = con_pestanas_tel(t, "diseno")
    return con_css(E.post(n, t), "tlista", CSS_TLISTA)


# ================================================================ Las pestañas de la ficha (79)
FICHAS = {"Visita a cliente": ("24", "FRM-Editor.dc.html", "M-FRM-Editor.dc.html"),
          "Relevamiento de obra": ("12", "FRM-Editor-Baja.dc.html", "M-FRM-Editor-Baja.dc.html"),
          "Control de vehículo": ("31", "FRM-Editor.dc.html", "M-FRM-Editor.dc.html"),
          "Pedir repuesto": ("18", "FRM-Editor.dc.html", "M-FRM-Editor.dc.html"),
          "Reclamo": ("0", "FRM-Editor.dc.html", "M-FRM-Editor.dc.html"), "Pedido de herramientas": ("0", "FRM-Editor.dc.html", "M-FRM-Editor.dc.html")}
CSS_PESTANAS = """.f-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--borde); flex-shrink: 0; }
.f-tabs a { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; text-decoration: none; }
.f-tabs a:hover { color: var(--t1); }
.f-tabs a.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.f-tabs .c { margin-left: 6px; font-size: 12px; font-weight: 600; color: var(--t3); }
"""
CSS_PTABS = """.f-ptabs { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--borde); flex-shrink: 0; background: #fff; }
.f-ptabs a { height: 48px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 15px; font-weight: 600; color: var(--t2); border-bottom: 2.5px solid transparent; text-decoration: none; }
.f-ptabs a.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.f-ptabs .c { color: var(--t3); font-weight: 500; }
"""
RESPUESTAS_TAB = ["FRM-Respuestas", "FRM-Respuestas-Filtros", "FRM-Respuestas-Exportar", "FRM-Respuesta", "FRM-Respuesta-Cadena"]
# los de la 14 (el editor, publicar y cómo termina) van sin pestañas: en la 14 la ficha tiene solo «Diseño» (78);
# los de la 21 (las reglas y la decisión) los arma formularios_21_reglas_1004.py, con su pestaña «Reglas»
DISENO_TAB = ["FRM-Editor-Baja", "FRM-Dar-De-Baja", "FRM-Reactivar-Eliminar", "FRM-Editor-Sugerencias", "FRM-Editor-Asistente"]


def pestanas(titulo, sel, tel=False):
    cnt, diseno, tdiseno = FICHAS[titulo]
    m = "M-" if tel else ""
    items = [("respuestas", "Respuestas", f' <span class="c">{cnt}</span>', f"{m}FRM-Respuestas.dc.html"), ("tablero", "Tablero", "", f"{m}FRM-Tablero.dc.html"),
             ("diseno", "Diseño", "", tdiseno if tel else diseno)]
    a = "".join(f'<a class="{"on" if k == sel else ""}" role="tab" aria-selected="{"true" if k == sel else "false"}" href="{h}">{txt}{c}</a>' for k, txt, c, h in items)
    return f'<div class="{"f-ptabs" if tel else "f-tabs"}" role="tablist" aria-label="Vistas del formulario">{a}</div>'


def con_pestanas(t, sel, excluir=("Sin permiso",)):
    if 'class="f-tabs"' in t:
        return t
    opciones = opciones_de(t)
    titulos = {int(m.group(1)): m.group(2) for m in
               re.finditer(r'<sc-if value="\{\{s(\d+)\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}"><div class="w-bnd">(?:(?!</h1>).)*?<h1>([^<]*)</h1>', t, re.S)}
    hs = re.findall(r'<div class="w-bnd">(?:(?!</h1>).)*?<h1>([^<]*)</h1>', t, re.S)
    unico = hs[0] if hs and len(set(hs)) == 1 else None

    def poner(m):
        s = int(m.group(2))
        estado = opciones[s] if s < len(opciones) else ""
        tit = titulos.get(s, unico)
        if estado in excluir or tit not in FICHAS:
            return m.group(0)
        return m.group(0) + pestanas(tit, sel)
    nuevo = re.sub(r'(<sc-if value="\{\{s(\d+)\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}"><div class="w-body">)', poner, t)
    if nuevo == t and unico in FICHAS:
        nuevo = t.replace('<div class="w-body">', '<div class="w-body">' + pestanas(unico, sel))
    return con_css(nuevo, "pestanas", CSS_PESTANAS)


def con_pestanas_tel(t, sel):
    if 'class="f-ptabs"' in t:
        return t
    salida, i = [], 0
    for m in re.finditer(r'<div class="ap-bar int">', t):
        k = t.index('<div class="tit">', m.start())
        h1 = re.search(r"<h1>([^<]*)</h1>", t[k:k + 300]).group(1)
        fin_tit = t.index("</div>", k) + len("</div>")
        fin = t.index("</div>", fin_tit) + len("</div>")
        if h1 in FICHAS:
            salida.append((fin, pestanas(h1, sel, tel=True)))
    for fin, h in reversed(salida):
        t = t[:fin] + h + t[fin:]
    return con_css(t, "ptabs", CSS_PTABS) if salida else t


# ================================================================ El tablero (decisión 57, como la maqueta)
DIAS = ["26", "27", "28", "29", "30", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"]
LLEGARON = [1, 0, 2, 1, 0, 1, 2, 1, 0, 1, 3, 1, 0, 2, 1, 1, 0, 2, 2, 3]
MONTO = [125.5, 0, 87.9, 15.7, 0, 54.2, 212.0, 31.0, 0, 125.5, 160.3, 0, 0, 98.4, 42.0, 15.8, 0, 76.6, 54.3, 118.4]
SEMANAS = [("28/09 al 04/10", 7), ("05/10 al 11/10", 6), ("12/10 al 15/10", 8), ("21/09 al 27/09", 3)]
OPCIONES = {
    "venta": ("¿Se concretó la venta?", "Cuántas veces salió cada opción", [("Sí", 14, 64), ("No", 8, 36)]),
    "motivo": ("Motivo", "Del catálogo Motivos de visita · cuántas veces salió cada opción", [("Venta nueva", 15, 65), ("Reclamo", 4, 17), ("Seguimiento", 4, 17)]),
    "fallas": ("Fallas", "Cada opción elegida, en cada respuesta", [("Luz", 12, 71), ("Frío", 8, 47), ("Ruido", 8, 47), ("Puerta", 5, 29)]),
    "quien": ("Quién cargó", "Cantidad por persona", [("Paula Méndez", 7, 29), ("Tomás Acosta", 6, 25), ("Florencia Fernández de la Fuente", 4, 17), ("Lucía Fernández", 3, 13), ("Martín Paz", 2, 8), ("Otras", 2, 8)]),
}
SIGMA = svg('<path d="M17 5H7l5.5 7L7 19h10"/>', 16)
TABLA_IC = svg('<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 10h16M4 14.5h16M10 10v9"/>', 16)
OJO_NO = svg('<path d="M3 3l18 18"/><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c5 0 8.5 4.4 9.5 6-.5.8-1.6 2.2-3.1 3.5"/><path d="M6.6 7.6C4.6 8.9 3.2 10.8 2.5 12c1 1.6 4.5 6 9.5 6 1.6 0 3-.4 4.3-1"/><path d="M9.9 10a3 3 0 0 0 4.1 4.1"/>', 16)
CHECK = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16, "2")
VOLVER = F.svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")
MAS22 = svg('<path d="M12 5v14M5 12h14"/>', 22)
ESTADOS_TB = ["Por día", "Por semana", "Una tarjeta: menú", "Agregar gráfico: menú", "Sin respuestas", "Ninguna coincide", "Cargando"]
CSS_TABLERO = """.tb-fb .w-bus { width: 220px !important; flex: none; }
.tb-seg { display: inline-grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); width: 192px; flex-shrink: 0; }
.tb-seg span { height: 30px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.tb-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.tb-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.tb-kpi { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.tb-kpi span { font-size: 13px; color: var(--t2); }
.tb-kpi b { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--t1); }
.tb-kpi small { font-size: 12.5px; color: var(--t3); font-variant-numeric: tabular-nums; }
.tb-grilla { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.tb-card { background: #fff; border: 1px solid var(--borde); border-radius: 12px; display: flex; flex-direction: column; position: relative; }
.tb-card.ancha { grid-column: 1 / -1; }
.tb-cab { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 12px 8px 4px 16px; }
.tb-cab > span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tb-cab b { font-size: 14px; font-weight: 600; color: var(--t1); }
.tb-cab small { font-size: 12.5px; color: var(--t3); }
.tb-cab .ib { flex-shrink: 0; }
.tb-cuerpo { padding: 8px 16px 16px; }
.tb-barras { display: flex; align-items: flex-end; gap: 6px; height: 150px; }
.tb-barras .col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; height: 100%; min-width: 0; }
.tb-barras .col i { width: 100%; max-width: 30px; background: var(--marca); border-radius: 4px 4px 0 0; display: block; }
.tb-barras .col .v { font-size: 11px; color: var(--t3); font-variant-numeric: tabular-nums; }
.tb-barras .col .d { font-size: 11px; color: var(--t3); font-variant-numeric: tabular-nums; }
.tb-hor { display: flex; flex-direction: column; gap: 10px; }
.tb-hor .h { display: grid; grid-template-columns: minmax(120px, 0.9fr) minmax(0, 1.4fr) 84px; align-items: center; gap: 12px; font-size: 13px; }
.tb-hor .h .l { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--t1); }
.tb-hor .h .pista { height: 10px; border-radius: 5px; background: var(--s3); overflow: hidden; }
.tb-hor .h .pista i { display: block; height: 100%; background: var(--marca); border-radius: 5px; }
.tb-hor .h .n { text-align: right; color: var(--t2); font-variant-numeric: tabular-nums; }
.tb-card .f-menu { position: absolute; right: 12px; top: 44px; left: auto; z-index: 25; min-width: 260px; }
.w-bnd .ac { position: relative; }
.w-bnd .ac .f-menu { position: absolute; right: 0; top: calc(100% + 6px); left: auto; z-index: 30; min-width: 240px; }
.f-mi.dim { color: var(--t3); cursor: default; }
.tb-vacio { min-height: 420px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
.tb-vacio b { font-size: 17px; font-weight: 600; }
"""


def barras(dias, valores, etiquetas=None, alto=130):
    tope = max(valores) or 1
    cols = ""
    for k, (d, val) in enumerate(zip(dias, valores)):
        h = round(val / tope * alto)
        v = (etiquetas[k] if etiquetas else str(val)) if val else ""
        cols += f'<span class="col"><span class="v">{v}</span><i style="height: {h}px;"></i><span class="d">{d}</span></span>'
    return f'<div class="tb-barras">{cols}</div>'


def horizontales(filas):
    return '<div class="tb-hor">' + "".join(f'<div class="h"><span class="l" title="{l}">{l}</span><span class="pista"><i style="width: {p}%;"></i></span>'
                                            f'<span class="n">{n} · {p} %</span></div>' for l, n, p in filas) + "</div>"


def menu_tarjeta(nombre):
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}"><span class="f-mi" role="menuitem">{CHECK} Contar: cantidad</span>'
            f'<span class="f-mi" role="menuitem">{SIGMA} Contar: total de Monto estimado</span><span class="f-mi" role="menuitem">{TABLA_IC} Ver como tabla</span>'
            f'<span class="f-mi" role="menuitem">{OJO_NO} Quitar del tablero</span></div>')


def tarjeta(nombre, sub, cuerpo, ancha=False, menu_flag=None):
    m = f'<sc-if value="{{{{{menu_flag}}}}}" hint-placeholder-val="{{{{no}}}}">{menu_tarjeta(nombre)}</sc-if>' if menu_flag else ""
    return (f'<div class="tb-card{" ancha" if ancha else ""}"><div class="tb-cab"><span><b>{nombre}</b><small>{sub}</small></span>'
            f'<button type="button" class="ib" aria-label="Acciones de {nombre}" aria-haspopup="menu">{A.KEBAB}</button></div>'
            f'<div class="tb-cuerpo">{cuerpo}</div>{m}</div>')


def plata(x):
    return f"{x:,.1f}".replace(",", "X").replace(".", ",").replace("X", ".") + " mil"


SEG_TB = ('<div class="tb-seg" role="radiogroup" aria-label="Agrupar por"><span class="{{segDia}}" role="radio">Día</span>'
          '<span class="{{segSem}}" role="radio">Semana</span><span class="tb-mes" role="radio">Mes</span></div>')


def cuerpo_tablero(filtro_caja):
    arriba = filtro_caja
    kpis = ('<div class="tb-kpis"><div class="tb-kpi"><span>Respuestas</span><b>24</b></div>'
            '<div class="tb-kpi"><span>Total de Monto estimado</span><b>1.217.381,00</b><small>promedio 50.724,21 · de 0,00 a 212.000,00</small></div></div>')
    llegaron_dia = tarjeta("Cuántas llegaron, por día", "De todas las respuestas", barras(DIAS, LLEGARON), ancha=True)
    llegaron_sem = tarjeta("Cuántas llegaron, por semana", "De todas las respuestas",
                           barras([s for s, _ in SEMANAS[3:] + SEMANAS[:3]], [n for _, n in SEMANAS[3:] + SEMANAS[:3]]), ancha=True)
    monto = tarjeta("Monto estimado, por día", "De la pregunta Monto estimado · total", barras(DIAS, [round(x * 10) for x in MONTO], [plata(x) if x >= 150 else "" for x in MONTO]))
    tarjetas = {k: tarjeta(n, s, horizontales(f), menu_flag="menuVenta" if k == "venta" else None) for k, (n, s, f) in OPCIONES.items()}
    grilla = ('<div class="tb-grilla">' + '<sc-if value="{{porDia}}" hint-placeholder-val="{{si}}">' + llegaron_dia + "</sc-if>"
              + '<sc-if value="{{porSemana}}" hint-placeholder-val="{{no}}">' + llegaron_sem + "</sc-if>"
              + monto + tarjetas["venta"] + tarjetas["motivo"] + '<sc-if value="{{conFallas}}" hint-placeholder-val="{{si}}">' + tarjetas["fallas"] + "</sc-if>"
              + tarjetas["quien"] + "</div>")
    lleno = '<sc-if value="{{conDatos}}" hint-placeholder-val="{{si}}">' + kpis + grilla + "</sc-if>"
    vacio = ('<sc-if value="{{sinRespuestas}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="tb-vacio"><b>Todavía no hay respuestas</b></div></div></sc-if>'
             '<sc-if value="{{ningunaCoincide}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="tb-vacio"><b>Ninguna respuesta con estos filtros</b>'
             '<button type="button" class="cb cb-enl">Limpiar filtros</button></div></div></sc-if>'
             '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="f-cuerpo izq"><div class="esq"><span style="width: 70%;"></span>'
             '<span style="width: 55%;"></span><span style="width: 80%;"></span><span style="width: 62%;"></span></div></div></div></sc-if>')
    return '<div class="w-body">' + pestanas("Visita a cliente", "tablero") + arriba + lleno + vacio + "</div>"


def tablero():
    planilla = leer("FRM-Respuestas")
    caja = re.search(r'<div class="w-caja o-fb pl-fb">.*?</div>(?=<div class="w-caja)', planilla, re.S)
    caja = caja.group(0) if caja else '<div class="w-caja o-fb">' + f'<span class="w-bus">{F.BUSCAR} Buscar en Observaciones</span></div>'
    # «Columnas» es de la planilla; en su lugar, Día | Semana | Mes
    caja, n = re.subn(r'<span class="pl-env"><span class="w-pil"[^>]*>Columnas(?:(?!</span>).)*</span></span>', SEG_TB, caja, flags=re.S)
    assert n == 1, "la caja de filtros de la planilla cambió"
    # la cantidad ya está en «Respuestas», arriba de los gráficos
    caja = re.sub(r'<span class="tot">[^<]*</span>', "", caja).replace('<div class="w-caja o-fb pl-fb">', '<div class="w-caja o-fb pl-fb tb-fb">', 1)
    agregar = ('<span class="e-kw"><button type="button" class="cb cb-sec" aria-haspopup="menu" aria-expanded="{{expAgregar}}">' + MAS + ' Agregar gráfico</button>'
               '<sc-if value="{{menuAgregar}}" hint-placeholder-val="{{no}}"><div class="f-menu" role="menu" aria-label="Agregar gráfico">'
               '<span class="f-mi" role="menuitem">' + F.LISTA + ' Fallas</span>' + SEP
               + '<span class="f-mi" role="menuitem">' + TABLA_IC + ' Volver al automático</span></div></sc-if></span>')
    banda = (f'<div class="w-bnd"><div class="iz"><a class="vol" href="FRM-Formularios.dc.html" aria-label="Volver a Formularios">{VOLVER}</a>'
             f'<div><h1>Visita a cliente</h1><p class="res">Respuestas · versión 4 publicada</p></div></div><div class="ac">{agregar}</div></div>')
    js = ("    return {\n      si: true, no: false,\n"
          "      porDia: e !== 'Por semana', porSemana: e === 'Por semana', segDia: e === 'Por semana' ? '' : 'on', segSem: e === 'Por semana' ? 'on' : '',\n"
          "      menuVenta: e === 'Una tarjeta: menú', menuAgregar: e === 'Agregar gráfico: menú', expAgregar: e === 'Agregar gráfico: menú' ? 'true' : 'false',\n"
          "      conFallas: e !== 'Agregar gráfico: menú', conDatos: ['Por día', 'Por semana', 'Una tarjeta: menú', 'Agregar gráfico: menú'].includes(e),\n"
          "      sinRespuestas: e === 'Sin respuestas', ningunaCoincide: e === 'Ninguna coincide', cargando: e === 'Cargando',\n    };")
    t = A.pagina_ab("FRM-Tablero", "Inicio / Formularios / Formularios / Visita a cliente", banda, cuerpo_tablero(caja),
                    css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + E.CSS_E12, estados=("estado", ESTADOS_TB), js=js)
    t = t.replace('"$preview":{"width":1440,"height":900}', '"$preview":{"width":1440,"height":1500}')
    t = E.post("FRM-Tablero", t)
    # los estilos de la planilla que falten (la caja de filtros es la misma)
    for m in re.finditer(r'<style (data-[a-z0-9-]+="[^"]*")>.*?</style>\n', planilla, re.S):
        if m.group(1) not in t:
            t = t.replace("</helmet>", m.group(0) + "</helmet>", 1)
    t = re.sub(r"<title>[^<]*</title>", "<title>Tablero de un formulario · /org/formularios/:id/tablero</title>", t)
    t = con_css(t, "alto", ".w-app { height: 1500px !important; }\n")
    return con_css(con_css(t, "tablero", CSS_TABLERO), "pestanas", CSS_PESTANAS)


ESTADOS_TTB = ["Por día", "Una tarjeta: menú", "Sin respuestas"]


def tel_tablero():
    bar = C.t_bar("Visita a cliente", "24 respuestas", "M-FRM-Formularios.dc.html",
                  f'<button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button><button type="button" class="ap-ib" aria-label="Agregar gráfico">{MAS22}</button>')
    seg = ('<div class="ap-seg t3" role="radiogroup" aria-label="Agrupar por"><span class="on" role="radio" aria-checked="true">Día</span>'
           '<span role="radio" aria-checked="false">Semana</span><span role="radio" aria-checked="false">Mes</span></div>')
    kpis = ('<div class="tb-kpis t2"><div class="tb-kpi"><span>Respuestas</span><b>24</b></div>'
            '<div class="tb-kpi"><span>Total de Monto estimado</span><b>1.217.381</b><small>promedio 50.724,21</small></div></div>')
    cards = (tarjeta("Cuántas llegaron, por día", "De todas las respuestas", barras(DIAS[-10:], LLEGARON[-10:], alto=110))
             + tarjeta(*OPCIONES["venta"][:2], horizontales(OPCIONES["venta"][2]))
             + tarjeta(*OPCIONES["motivo"][:2], horizontales(OPCIONES["motivo"][2])))
    lleno = bar + '<div class="ap-cuerpo ap-gris tb-tel">' + seg + kpis + cards + "</div>"
    vacio = bar + '<div class="ap-cuerpo"><div class="ap-vacio">Todavía no hay respuestas</div></div>'
    cuerpo = {"Por día": lleno, "Una tarjeta: menú": lleno, "Sin respuestas": vacio}
    hoja = M.hoja("¿Se concretó la venta?", '<span role="menuitem">Contar: cantidad</span><span role="menuitem">Contar: total de Monto estimado</span>'
                  '<span role="menuitem">Ver como tabla</span><span role="menuitem">Quitar del tablero</span>')
    t = C.tel_pagina(cuerpo, ESTADOS_TTB, {"Una tarjeta: menú": hoja}, "Tablero de un formulario · teléfono", A.CSS_TCHAT_AB + E.CSS_E12)
    t = M.css(t, M.CSS_HOJA, "hoja")
    css_tel = (CSS_TABLERO + ".tb-tel { display: flex; flex-direction: column; gap: 12px; padding: 12px 12px 24px; }\n"
               ".tb-kpis.t2 { grid-template-columns: 1fr 1fr; gap: 10px; }\n.tb-tel .tb-kpi b { font-size: 22px; }\n"
               ".tb-tel .tb-hor .h { grid-template-columns: 96px minmax(0, 1fr) 72px; gap: 8px; font-size: 14px; }\n"
               ".ap-seg.t3 { grid-template-columns: repeat(3, 1fr); margin: 0; }\n")
    t = con_css(t, "tablero", css_tel)
    return con_pestanas_tel(E.post("M-FRM-Tablero", t), "tablero")


# ================================================================ M-FRM-Respuestas: la pestaña Respuestas del teléfono
def tel_respuestas():
    t = leer("M-FRM-Respuestas")
    if "Formularios" in opciones_de(t):
        t = sin_estados(t, ["Formularios"], "Respuestas")
    t = re.sub(r'(<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href=)"#"(><svg(?:(?!</svg>).)*</svg></a><div class="tit"><h1>Visita a cliente</h1>)',
               r'\1"M-FRM-Formularios.dc.html"\2', t, flags=re.S)
    return con_pestanas_tel(t, "respuestas")


# ================================================================ Sin «Diseñar formularios» en los tableros vigentes
NO_TOCAR = {"Criterio-Decisiones", "Rol", "M-Rol"}


def sin_disenar(n, t):
    def panel(m):
        bloque = m.group(0)
        estaba = re.search(r'<a class="w-ln on" href="FRM-Listado\.dc\.html">', bloque)
        bloque = re.sub(r'(?:<sc-if value="\{\{[A-Za-z]+\}\}" hint-placeholder-val="\{\{si\}\}">)?<a class="w-ln(?: on)?" href="FRM-Listado\.dc\.html">(?:(?!</a>).)*?Diseñar formularios</a>(?:</sc-if>)?',
                        "", bloque, flags=re.S)
        if estaba:
            bloque = bloque.replace('<a class="w-ln" href="FRM-Formularios.dc.html">', '<a class="w-ln on" href="FRM-Formularios.dc.html">', 1)
        return bloque
    t = G.PANEL_RE.sub(panel, t)
    t = t.replace("Gestión de formularios / Diseñar formularios", "Gestión de formularios / Formularios")
    t = t.replace('href="FRM-Listado.dc.html"', 'href="FRM-Formularios.dc.html"').replace('href="M-FRM-Listado.dc.html"', 'href="M-FRM-Formularios.dc.html"')
    t = t.replace("Volver a Diseñar formularios", "Volver a Formularios").replace("Desaparece de Diseñar formularios", "Desaparece de Formularios")
    if n == "M-WA-Menu":
        t = re.sub(r'<a class="ap-it " href="M-FRM-Formularios\.dc\.html"><span class="tx"><b>Diseñar formularios</b></span>(?:(?!</a>).)*</a>', "", t, flags=re.S)
        t = t.replace('<a class="ap-it " href="M-FRM-Respuestas.dc.html"><span class="tx"><b>Formularios</b>', '<a class="ap-it " href="M-FRM-Formularios.dc.html"><span class="tx"><b>Formularios</b>')
    return t


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
NUEVOS = {"FRM-Formularios-15": (1440, 900, "Formularios · la lista · etapa 15"), "FRM-Formularios-17": (1440, 900, "Formularios · la lista · etapa 17"),
          "FRM-Formularios-21": (1440, 900, "Formularios · la lista · etapa 21"), "FRM-Formularios-22": (1440, 900, "Formularios · la lista · etapa 22"),
          "M-FRM-Formularios": (390, 844, "Formularios · la lista · teléfono"), "M-FRM-Formularios-15": (390, 844, "Formularios · la lista · teléfono · etapa 15"),
          "M-FRM-Formularios-17": (390, 844, "Formularios · la lista · teléfono · etapa 17"), "M-FRM-Formularios-21": (390, 844, "Formularios · la lista · teléfono · etapa 21"),
          "M-FRM-Formularios-22": (390, 844, "Formularios · la lista · teléfono · etapa 22"),
          "FRM-Tablero": (1440, 1500, "Formularios · un formulario · Tablero"), "M-FRM-Tablero": (390, 844, "Formularios · un formulario · Tablero · teléfono")}
AL_ARCHIVO = {"FRM-Listado": "Formularios · diseñar formularios (hasta la v140)", "M-FRM-Listado": "Diseñar formularios · teléfono (hasta la v140)"}
TOCADOS = ["FRM-Formularios", "FRM-Copiar", "FRM-Reactivar-Eliminar", "M-FRM-Respuestas"] + RESPUESTAS_TAB + DISENO_TAB + ["M-FRM-Editor-Baja"]


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    b = c["boards"]
    arch = [v for v in b.values() if v.get("page") == "archivo"]
    for n, titulo in AL_ARCHIVO.items():
        v = b[f"{n}.dc.html"]
        if v.get("page") != "archivo":
            fondo = max(x["y"] + x["h"] for x in arch) + 120 if arch else 260
            v.update(page="archivo", title=titulo, x=0 if n == "FRM-Listado" else 1520, y=fondo)
    for n, (w, h, titulo) in NUEVOS.items():
        b.setdefault(f"{n}.dc.html", {"h": h, "is_interactive": True, "page": "formularios", "title": titulo, "w": w, "x": 0, "y": 0})
    b["FRM-Formularios.dc.html"]["title"] = "Formularios · la lista"
    b["M-FRM-Respuestas.dc.html"]["title"] = "Formularios · un formulario · Respuestas · teléfono"
    for n in TOCADOS + list(NUEVOS):
        v = b[f"{n}.dc.html"]
        v["title"] = v["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def solo():
    """--solo A,B: los tableros de la lista que se piden, nada más."""
    if "--solo" not in sys.argv:
        return None
    return {x for a in sys.argv[sys.argv.index("--solo") + 1:] for x in a.split(",") if x}


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', leer("FRM-Catalogos"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    pedidos = solo()
    if pedidos is not None:
        for n in sorted(pedidos):
            assert n in LISTAS or n in TLISTAS, f"--solo: {n} no es una lista"
            escribir(n, sin_disenar(n, enlaces_de(n, lista(n) if n in LISTAS else tel_lista(n))))
        print("listo:", ", ".join(sorted(pedidos)))
        sys.exit(0)
    for n in LISTAS:
        escribir(n, enlaces_de(n, lista(n)))
    escribir("FRM-Copiar", B.copiar())
    for n in TLISTAS:
        escribir(n, enlaces_de(n, tel_lista(n)))
    escribir("FRM-Tablero", tablero())
    escribir("M-FRM-Tablero", tel_tablero())
    escribir("M-FRM-Respuestas", tel_respuestas())
    for n in RESPUESTAS_TAB:
        escribir(n, con_pestanas(leer(n), "respuestas"))
    for n in DISENO_TAB:
        escribir(n, con_pestanas(leer(n), "diseno"))
    escribir("M-FRM-Editor-Baja", con_pestanas_tel(leer("M-FRM-Editor-Baja"), "diseno"))
    registrar()
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    archivo = {k[:-8] for k, v in c["boards"].items() if v.get("page") == "archivo"}
    cambiados = []
    for f in sorted(PROJ.glob("*.dc.html")):
        n = f.name[:-8]
        if n in archivo or n in NO_TOCAR or n.startswith("Indice"):
            continue
        t = f.read_text(encoding="utf-8")
        nuevo = sin_disenar(n, t)
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
            cambiados.append(n)
    print("sin «Diseñar formularios» en", len(cambiados), "tableros")
    restos = [f.name for f in PROJ.glob("*.dc.html") if f.name[:-8] not in archivo | NO_TOCAR and not f.name.startswith("Indice")
              and ("FRM-Listado.dc.html" in f.read_text(encoding="utf-8") or "Diseñar formularios" in f.read_text(encoding="utf-8"))]
    print("quedan", restos)
    print("listo")
