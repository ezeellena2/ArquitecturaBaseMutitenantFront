"""La etapa 15 redibujada con su texto para Diseño (docs/plans/formularios/15-texto-diseno.md del back): la planilla, «Más filtros», la vista
rápida, exportar y sus teléfonos, y `FRM-Respuesta-Completa`, nueva. Muestra solo lo que existe hasta la 15 (78): sin fotos, documentos,
aprobación, estado, PDF, corregir ni «Cargar». Lo general es «Visita a cliente»; «Elegir varias» y los campos sellados, «Pedir repuesto».

Toma las piezas de `formularios_ab_planilla_1004.py`, que queda como historia. Corre antes de `formularios_lista_y_ficha_1004.py`, que les
suma las pestañas y arma la lista y el tablero de la etapa.

Desde la v150 (126), el armado real de ArquitecturaBaseFront: «Exportar a Excel» en la banda; en la barra, «Buscar en textos largos» y una pregunta como filtro rápido; «Más filtros» con
«Recibida desde» y «hasta» y, por pregunta, «Respuesta» y lo que corresponde a su tipo; exportar dice cuántas respuestas, cuántos filtros y cuántas columnas; la vista rápida
trae «Abrir en pantalla completa» como botón y, al pie, en qué respuesta va.

Desde la v160, el traspaso 5: un solo «Filtros» con chips y sin cantidades (143 y 144), la tabla con líneas entre columnas (137) y el detalle
alineado, con los momentos y la actividad en columnas (139). Las piezas de antes quedan para las etapas 18 a 21 hasta que se redibujen.

Con el traspaso 10, exportar también: la planilla de fondo tiene un solo «Filtros», con sus chips y el total al pie (`fondo5`).
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_planilla_1004 as P  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402

PROJ = F.PROJ
svg = F.svg
X, CHEV = F.X, F.CHEV
CHECK, SUBE, BAJA, TABLA, ESCUDO, FILTROS, ARCHIVO = P.CHECK, P.SUBE, P.BAJA, P.TABLA, P.ESCUDO, P.FILTROS, P.ARCHIVO
EXPANDIR = svg('<path d="M14 4h6v6"/><path d="m20 4-7 7"/><path d="M10 20H4v-6"/><path d="m4 20 7-7"/>', 16)
trabaja = E.trabaja
ARCHIVO_XLSX = P.ARCHIVO_XLSX
MOTIVO_EXPORTANDO = "Esperá a que termine de exportar."
FORMULARIO, REPUESTO = "Visita a cliente", "Pedir repuesto"

# ================================================================ Los datos
COLS = [("num", "N°", 112, ""), ("rec", "Recibida", 136, ""), ("quien", "Cargó", 200, ""), ("can", "Canal", 96, ""), ("emp", "Empresas", 150, ""),
        ("cli", "Cliente", 160, ""), ("fec", "Fecha de la visita", 128, ""), ("ven", "¿Se concretó la venta?", 160, ""), ("mon", "Monto estimado", 120, "r"),
        ("mot", "Motivo", 120, ""), ("fal", "Fallas", 110, ""), ("obs", "Observaciones", 240, ""), ("con", "Contacto en el local", 150, "")]
OCULTAS = {"fec"}
# n°, recibida, cargó, tipo, empresas, cliente, fecha, venta, monto, motivo, fallas, observaciones, versión, contacto.
# None = «Sin respuesta»; "—" = la pregunta no existía en esa versión.
RESP = [
    ("VIS-000130", "15/10/2026 16:20", "Paula Méndez", "", "Delta S.A.", "Corralón El Puente", "15/10/2026", "No", None, "Seguimiento", "Frío",
     "Pidieron presupuesto para la ampliación.", 4, "—"),
    ("VIS-000129", "15/10/2026 11:47", "Florencia Fernández de la Fuente", "", "Delta Norte S.A.", "Obra Centro", "15/10/2026", "Sí", "48.000,00", "Venta nueva", "Frío, Ruido",
     "Falta material en planta para la segunda etapa.", 4, "—"),
    ("VIS-000128", "14/10/2026 17:02", "Martín Paz", "", "Delta S.A., Delta Sur S.R.L.", "Distribuidora Norte", "14/10/2026", "Sí", "212.000,00", "Venta nueva", "Ruido",
     "Firmaron el pedido de noviembre.", 4, "—"),
    ("VIS-000127", "14/10/2026 09:30", "Marta Gil", "cliente", "—", "Ferretería Sur", "14/10/2026", "No", "0,00", "Reclamo", "Puerta",
     "Reclamo por demora en la entrega.", 4, "—"),
    ("VIS-000126", "13/10/2026 15:30", "Tomás Acosta", "", "Delta S.A.", "Ferretería Rosales", "13/10/2026", "Sí", "125.500,00", "Venta nueva", "Frío, Ruido",
     "Cerramos el pedido de octubre.", 4, "—"),
    ("VIS-000125", "13/10/2026 14:10", "Persona sin información", "sin", "—", "Obra Centro", "13/10/2026", "No", None, "Seguimiento", "—",
     "Revisión del avance de obra.", 3, "—"),
    ("VIS-000124", "13/10/2026 12:20", "Paula Méndez", "", "Delta S.A.", "Corralón El Puente", "12/10/2026", "Sí", "96.300,00", "Venta nueva", "—", None, 3, "—"),
    ("VIS-000123", "13/10/2026 11:04", "Tomás Acosta", "", "Delta S.A.", "Ferretería Rosales", "13/10/2026", "No", "0,00", "Seguimiento", "—", None, 3, "—"),
    ("VIS-000122", "12/10/2026 17:40", "Martín Paz", "", "Delta S.A., Delta Sur S.R.L.", "Distribuidora Norte", "12/10/2026", "Sí", "54.200,00", "Venta nueva", "—",
     "Entrega parcial, falta un pallet.", 2, "Juan Ortiz"),
    ("VIS-000121", "12/10/2026 10:02", "Paula Méndez", "", "Delta S.A.", "Obra Centro", "11/10/2026", "No", "15.750,00", "Seguimiento", "—", "Visita de rutina.", 2, "Marta Gil"),
]
FILTRADAS = ["VIS-000128", "VIS-000126", "VIS-000124", "VIS-000122"]  # Empresa: Delta S.A. · Recibida: últimos 7 días · Motivo: Venta nueva

# «Pedir repuesto»: las subcolumnas de los campos sellados van después de su pregunta, y una respuesta de antes de los campos dice «—»
COLS_R = [("num", "N°", 112, ""), ("rec", "Recibida", 136, ""), ("quien", "Cargó", 170, ""), ("can", "Canal", 96, ""), ("emp", "Empresas", 120, ""), ("fal", "Fallas", 150, ""),
          ("pro", "Proveedor", 170, ""), ("cuit", "Proveedor · CUIT", 150, ""), ("pla", "Proveedor · Plazo de pago", 190, ""), ("obs", "Observaciones", 230, "")]
RESP_R = [
    ("REP-000018", "15/10/2026 10:12", "Tomás Acosta", "Delta S.A.", "Frío, Ruido", "Aceros Rosario", "30-70988123-4", "30 días", "Cambiar el compresor."),
    ("REP-000017", "14/10/2026 16:40", "Paula Méndez", "Delta S.A.", "Ruido", "Aislantes Norte", "33-71011223-9", "60 días", None),
    ("REP-000016", "14/10/2026 09:05", "Martín Paz", "Delta Sur S.R.L.", "Puerta, Frío, Luz", "Abrasivos del Sur", "30-71234567-1", "30 días", "Urgente: la cámara no enfría."),
    ("REP-000015", "13/10/2026 12:30", "Tomás Acosta", "Delta S.A.", "Luz", "Aceros Rosario", "—", "—", None),
    ("REP-000014", "12/10/2026 18:15", "Paula Méndez", "Delta S.A.", "Frío", "Aislantes Norte", "—", "—", "Se pidió el burlete."),
]
FILTRADAS_R = ["REP-000018", "REP-000016", "REP-000014"]  # Fallas: alguna de 2 (Frío o Ruido, una respuesta con las dos cuenta una vez)
ARCHIVO_R = "Pedir repuesto-2026-10-15.xlsx"


def gris(t):
    return f'<span class="pl-g">{t}</span>'


def valor(v):
    return gris("Sin respuesta") if v is None else gris("—") if v == "—" else v


def plantilla(cols, ocultas=()):
    return " ".join(f"{w}px" for k, _, w, _ in cols if k not in ocultas)


def quien(nombre, tipo=""):
    marca = '<span class="pl-marca">Cliente</span>' if tipo == "cliente" else ""
    return f'<span class="pl-quien" title="{nombre}"><span class="tx{" pl-g" if tipo == "sin" else ""}">{nombre}</span>{marca}</span>'


def celda(clave, r):
    (n, rec, nom, tipo, emp, cli, fec, ven, mon, mot, fal, obs, _ver, con) = r
    if clave == "num":
        return f'<span><a class="pl-num" href="FRM-Respuesta.dc.html">{n}</a></span>'
    if clave == "quien":
        return quien(nom, tipo)
    v = {"rec": rec, "can": "WhatsApp", "emp": emp, "cli": cli, "fec": fec, "ven": ven, "mon": mon, "mot": mot, "fal": fal, "obs": obs, "con": con}[clave]
    return f'<span{" class=" + chr(34) + "r" + chr(34) if clave == "mon" else ""} title="{v if isinstance(v, str) and v != "—" else ""}">{valor(v)}</span>'


def celda_r(clave, r):
    (n, rec, nom, emp, fal, pro, cuit, pla, obs) = r
    if clave == "num":
        return f'<span><a class="pl-num" href="FRM-Respuesta.dc.html">{n}</a></span>'
    if clave == "quien":
        return quien(nom)
    v = {"rec": rec, "can": "WhatsApp", "emp": emp, "fal": fal, "pro": pro, "cuit": cuit, "pla": pla, "obs": obs}[clave]
    return f"<span>{valor(v)}</span>"


def cabecera(cols):
    return '<div class="w-th pl">' + "".join(f'<span{" class=" + chr(34) + "r" + chr(34) if c == "r" else ""}>{t}</span>' for _, t, _, c in cols) + "</div>"


def tabla(filas=None, sel=None, total=24, cuerpo=None, aten=False, mucho=False):
    """La planilla de «Visita a cliente»: cabecera, filas y pie. `cuerpo` reemplaza las filas (cargando, vacía, error)."""
    cols = [c for c in COLS if c[0] not in OCULTAS]
    if cuerpo is not None:
        return f'<div class="w-caja pl-caja"><div class="pl-scroll">{cabecera(cols)}</div>{cuerpo}</div>'
    lista = [r for r in RESP if filas is None or r[0] in filas]
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(celda(k, r) for k, *_ in cols) + "</div>" for r in lista)
    if mucho:
        pie = '<div class="w-pie"><span>1–10 de 12.430</span><span>10 por página · Página 1 de 1.243</span></div>'
    elif total == 24:
        pie = '<div class="w-pie"><span>1–10 de 24</span><span>10 por página · Página 1 de 3</span></div>'
    else:
        pie = f'<div class="w-pie"><span>1–{total} de {total}</span><span>10 por página · Página 1 de 1</span></div>'
    linea = '<div class="pl-linea" aria-hidden="true"></div>' if aten else ""
    return f'<div class="w-caja pl-caja{" aten" if aten else ""}"><div class="pl-scroll">{cabecera(cols)}{linea}{h}</div>{pie}</div>'


def tabla_r(filas=None, sel=None):
    """La planilla de «Pedir repuesto»: «elegir varias» con sus opciones en el orden en que se eligieron, y los campos sellados."""
    lista = [r for r in RESP_R if filas is None or r[0] in filas]
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(celda_r(k, r) for k, *_ in COLS_R) + "</div>" for r in lista)
    total = len(filas) if filas else 18
    pie = f'<div class="w-pie"><span>1–{min(total, 10)} de {total}</span><span>10 por página · Página 1 de {2 if total > 10 else 1}</span></div>'
    return f'<div class="w-caja pl-caja" style="--pl-cols: {plantilla(COLS_R)};"><div class="pl-scroll">{cabecera(COLS_R)}{h}</div>{pie}</div>'


def casilla(t, on=True, fija=False):
    return f'<span class="mf-ck{" on" if on else ""}{" fija" if fija else ""}" role="menuitemcheckbox" aria-checked="{"true" if on else "false"}"><span class="bx">{CHECK if on else ""}</span>{t}</span>'


def menu_columnas(repuesto=False):
    if repuesto:
        fijas = casilla("N°", fija=True) + "".join(casilla(t) for _, t, _, _ in COLS_R[1:5])
        preg = "".join(casilla(t) for _, t, _, _ in COLS_R[5:])
        retiradas = ""
    else:
        fijas = casilla("N°", fija=True) + "".join(casilla(t) for _, t, _, _ in COLS[1:5])
        preg = "".join(casilla(t, k not in OCULTAS) for k, t, _, _ in COLS[5:12])
        retiradas = '<div class="g">Retiradas</div>' + casilla("Contacto en el local")
    return ('<div class="pl-colmn" role="menu" aria-label="Columnas"><div class="g">De la respuesta</div>' + fijas + '<div class="g">Preguntas</div>' + preg + retiradas
            + '<div class="pie"><button type="button" class="cb cb-enl">Mostrar todas</button></div></div>')


def barra(modo="normal"):
    """La caja de filtros. modo: normal, columnas, empresa, filtrado, busqueda, repuesto, repuesto-columnas, repuesto-filtro."""
    emp_items = [("t", "Todas las empresas", "24"), ("a", "Delta S.A.", "17"), ("s", "Delta Sur S.R.L.", "4"), ("n", "Delta Norte S.A.", "6"), ("x", "Sin empresa", "2")]
    rec_items = [("t", "Todas las fechas", ""), ("h", "Hoy", "2"), ("7", "Últimos 7 días", "14"), ("m", "Octubre 2026", "24"), ("e", "Elegir fechas…", "")]
    filtrado, repuesto = modo == "filtrado", modo.startswith("repuesto")

    def pil(nombre, texto, items, elegido, abierto):
        menu = ""
        if abierto:
            menu = (f'<span class="f-mn" role="listbox" aria-label="Filtrar por {nombre.lower()}">'
                    + "".join(f'<span role="option" class="{"on" if k == elegido else ""}">{n}<span class="cnt">{c}</span></span>' for k, n, c in items) + "</span>")
        return f'<span class="f-env"><span class="w-pil{" con" if elegido != "t" else ""}" role="button" aria-haspopup="listbox">{texto} {CHEV}</span>{menu}</span>'
    bus = (f'<span class="w-bus lleno">{F.BUSCAR} pallet</span>' if modo == "busqueda" else f'<span class="w-bus">{F.BUSCAR} Buscar en textos largos</span>')
    h = bus + pil("Empresa", "Empresa: Delta S.A." if filtrado else "Empresa", emp_items, "a" if filtrado else "t", modo == "empresa")
    # La primera pregunta de opciones va a mano, como filtro rápido
    if repuesto:
        h += pil("Fallas", "Fallas: alguna de 2" if modo == "repuesto-filtro" else "Fallas", [], "a" if modo == "repuesto-filtro" else "t", False)
    else:
        h += pil("Motivo", "Motivo: Venta nueva" if filtrado else "Motivo", [], "a" if filtrado else "t", False)
    h += pil("Recibida", "Recibida: últimos 7 días" if filtrado else "Recibida", rec_items, "7" if filtrado else "t", False)
    h += f'<a class="w-pil" href="FRM-Respuestas-Filtros.dc.html">{FILTROS} Más filtros</a>'
    if filtrado or modo in ("busqueda", "repuesto-filtro"):
        h += '<button type="button" class="cb cb-enl">Limpiar filtros</button>'
    total = {"filtrado": "4 respuestas", "busqueda": "0 respuestas", "repuesto": "18 respuestas", "repuesto-columnas": "18 respuestas", "repuesto-filtro": "3 respuestas"}.get(modo, "24 respuestas")
    col_menu = menu_columnas(repuesto) if modo in ("columnas", "repuesto-columnas") else ""
    h += (f'<span class="pl-der"><span class="tot">{total}</span><span class="pl-env"><span class="w-pil" role="button" aria-haspopup="menu" aria-expanded="{"true" if col_menu else "false"}">'
          f'Columnas {CHEV}</span>{col_menu}</span></span>')
    return f'<div class="w-caja o-fb pl-fb">{h}</div>'


def banda(titulo=FORMULARIO, res="Respuestas · versión 4 publicada", ac=""):
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="FRM-Formularios.dc.html" aria-label="Volver a Formularios">{L.VOLVER}</a>'
            f'<div><h1>{titulo}</h1><p class="res">{res}</p></div></div><div class="ac">{ac}</div></div>')


EXPORTAR = '<a class="cb cb-sec" href="FRM-Respuestas-Exportar.dc.html">Exportar a Excel</a>'
EXPORTAR_OFF = '<button type="button" class="cb cb-sec" disabled title="Todavía no hay respuestas para exportar.">Exportar a Excel</button>'
CSS_15 = """.pl-fb .w-bus { width: 220px; flex: none; }
.pl-marca { flex-shrink: 0; padding: 0 7px; border: 1px solid var(--borde2); border-radius: 999px; font-size: 12px; line-height: 18px; color: var(--t2); }
.pl-linea { height: 2px; background: var(--marca); width: max-content; min-width: 100%; }
.pl-caja.aten .w-tr.pl { opacity: 0.5; pointer-events: none; }
.w-tr.pl > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
"""


def pagina(nombre, bnd, cuerpo, estados, css=""):
    """Las migas dicen el formulario de cada estado: los de «Elegir varias» son de «Pedir repuesto»."""
    migas = [f"Inicio / Gestión de formularios / Formularios / {REPUESTO if e.startswith('Elegir varias') else FORMULARIO}" for e in estados]
    return A.pagina_ab(nombre, "{{miga}}", bnd, cuerpo,
                       css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + E.CSS_E12 + P.CSS_PANEL + P.CSS_PL
                       + f".w-app {{ --pl-cols: {plantilla(COLS, OCULTAS)}; }}\n" + CSS_15 + css, estados=("estado", estados),
                       js=A.js_estados(estados, f"      miga: {json.dumps(migas, ensure_ascii=False)}[k],\n"))


CUERPO = '<div class="w-body">{}</div>'


def fondo(modo="normal", sel=None):
    if modo == "filtrado":
        return CUERPO.format(barra("filtrado") + tabla(FILTRADAS, total=4, sel=sel))
    if modo == "mucho":
        return CUERPO.format(barra("normal").replace("24 respuestas", "12.430 respuestas") + tabla(mucho=True))
    if modo == "repuesto":
        return CUERPO.format(barra("repuesto") + tabla_r(sel=sel))
    return CUERPO.format(barra("normal") + tabla(sel=sel))


# ================================================================ FRM-Respuestas: la planilla y sus casos
ESTADOS_PL = ["Planilla", "Columnas", "Empresa: menú", "Con filtros", "Elegir varias y campos", "Elegir varias: el filtro", "Elegir varias y campos: columnas", "Vuelve a leer", "Cargando",
              "Todavía no hay respuestas", "Sin coincidencias", "No se pudo cargar", "No se pudo actualizar", "Sin permiso", "Sin permiso para exportar"]


def respuestas():
    vacia = tabla(cuerpo=f'<div class="pl-vacio"><span class="ic">{TABLA}</span><b>Todavía no llegaron respuestas.</b><a class="cb cb-sec" href="WA-Chats-Formulario.dc.html">Ir a los chats</a></div>')
    sin_c = tabla(cuerpo='<div class="pl-vacio"><b>Ninguna respuesta coincide con los filtros.</b><button type="button" class="cb cb-enl">Limpiar filtros</button></div>')
    error = tabla(cuerpo='<div class="pl-vacio"><b>No pudimos cargar las respuestas.</b><button type="button" class="cb cb-sec">Reintentar</button></div>')
    sin_permiso = (f'<div class="pl-pagina"><span class="ic">{ESCUDO}</span><b>No tenés permiso para ver esta página.</b><a class="cb cb-sec" href="Inicio-Org.dc.html">Ir al inicio</a></div>')
    aviso = A.toast("No pudimos actualizar las respuestas. Siguen las de antes.", "mal", '<button type="button" class="cb cb-enl">Reintentar</button>')
    cuerpos = {
        "Planilla": barra() + tabla(), "Columnas": barra("columnas") + tabla(), "Empresa: menú": barra("empresa") + tabla(),
        "Con filtros": barra("filtrado") + tabla(FILTRADAS, total=4),
        "Elegir varias y campos": barra("repuesto") + tabla_r(), "Elegir varias: el filtro": barra("repuesto-filtro") + tabla_r(FILTRADAS_R),
        "Elegir varias y campos: columnas": barra("repuesto-columnas") + tabla_r(),
        "Vuelve a leer": barra("filtrado") + tabla(FILTRADAS, total=4, aten=True),
        "Cargando": barra() + tabla(cuerpo=P.ESQ), "Todavía no hay respuestas": vacia, "Sin coincidencias": barra("busqueda") + sin_c, "No se pudo cargar": barra() + error,
        "No se pudo actualizar": barra("filtrado") + tabla(FILTRADAS, total=4) + aviso, "Sin permiso": sin_permiso, "Sin permiso para exportar": barra() + tabla(),
    }

    def bnd(e):
        if e == "Sin permiso":
            return ""
        if e.startswith("Elegir varias"):
            return banda(REPUESTO, "Respuestas · versión 2 publicada", EXPORTAR)
        return banda(ac={"Todavía no hay respuestas": EXPORTAR_OFF, "Sin permiso para exportar": ""}.get(e, EXPORTAR))
    return pagina("Respuestas · /org/formularios/:id/respuestas", A.con_estados([(e, bnd(e)) for e in ESTADOS_PL]),
                  A.con_estados([(e, CUERPO.format(cuerpos[e])) for e in ESTADOS_PL]), ESTADOS_PL)


# ================================================================ FRM-Respuestas-Filtros: «Más filtros», en un panel al costado
ESTADOS_MF = ["Más filtros", "Con filtros elegidos", "Contando", "Ninguna coincide"]


CSS_MF2 = """.mf-s { gap: 8px; }
.mf-c { display: flex; flex-direction: column; gap: 4px; }
.mf-c .r { font-size: 13px; color: var(--t2); }
.mf-dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.mf-ck.dos { align-items: flex-start; padding: 4px 0; }
.mf-ck.dos .bx { margin-top: 2px; }
.mf-ck.dos .tx { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.mf-ck.dos small { font-size: 12.5px; color: var(--t3); }
.mf-f .der2 { display: inline-flex; align-items: center; gap: 8px; }
"""


def mas_filtros(modo="normal"):
    """Como ArquitecturaBase: las fechas de recibida y, por pregunta, «Respuesta» y lo que va con su tipo: desde y hasta, «Contiene» o casillas con cuántas respuestas tiene cada una."""
    elegidos, cont = modo in ("elegidos", "ninguna"), modo == "contando"

    def sec(titulo, cuerpo):
        return f'<div class="mf-s"><span class="t">{titulo}</span>{cuerpo}</div>'

    def campo(rotulo, control):
        return f'<div class="mf-c"><span class="r">{rotulo}</span>{control}</div>'

    def caja(texto="", lleno=False):
        return f'<span class="mf-in{" lleno" if lleno else ""}">{texto}</span>'

    def resp(valor="Todas"):
        return campo("Respuesta", f'<span class="mf-in sel">{valor} {CHEV}</span>')

    def rango(desde="", hasta="", d="Desde", h="Hasta"):
        return f'<div class="mf-dos">{campo(d, caja(desde, bool(desde)))}{campo(h, caja(hasta, bool(hasta)))}</div>'

    def ck(texto, n, on=False, extra=""):
        cuenta = '<span class="esq-n" style="margin: 4px 0 0;"></span>' if cont else f'<small>{n} {"respuesta" if n == 1 else "respuestas"}</small>'
        return (f'<span class="mf-ck dos{" on" if on else ""}" role="checkbox" aria-checked="{"true" if on else "false"}"><span class="bx">{P.CHECK if on else ""}</span>'
                f'<span class="tx"><span>{texto}{extra}</span>{cuenta}</span></span>')
    buscar = f'<span class="mf-in">{F.BUSCAR} Buscar opciones</span>'
    recibida = rango(d="Recibida desde", h="Recibida hasta")
    motivo = sec("Motivo", resp() + buscar + ck("Seguimiento", 9) + ck("Venta nueva", 7 if elegidos else 11, on=elegidos) + ck("Reclamo", 4) + ck("Visita técnica", 2, extra=' <span class="baja">· dada de baja</span>'))
    # Una respuesta con dos opciones cuenta en las dos
    fallas = sec("Fallas", resp() + ck("Luz", 12) + ck("Frío", 8) + ck("Ruido", 8) + ck("Puerta", 5))
    venta = sec("¿Se concretó la venta?", resp() + ck("Sí", 12) + ck("No", 10))
    monto = sec("Monto estimado", resp() + rango("10.000" if elegidos else ""))
    fecha = sec("Fecha de la visita", resp() + rango())
    cliente = sec("Cliente", resp() + campo("Contiene", caja()))
    obs = sec("Observaciones", resp() + campo("Contiene", caja()))
    cargo = sec("Cargó", buscar + ck("Paula Méndez", 7) + ck("Tomás Acosta", 6) + ck("Florencia Fernández de la Fu…", 4) + ck("Lucía Fernández", 3) + ck("Martín Paz", 2) + ck("Marta Gil", 1) + ck("Persona sin información", 1))
    version = sec("Versión del formulario", ck("Versión 4", 12) + ck("Versión 3", 8) + ck("Versión 2", 4))
    if modo == "ninguna":
        boton = '<button type="button" class="cb cb-pri" disabled>Ninguna respuesta coincide</button>'
    elif cont:
        boton = trabaja("Contando…")
    else:
        boton = f'<a class="cb cb-pri" href="FRM-Respuestas.dc.html">Ver {"4" if elegidos else "24"} respuestas</a>'
    return (f'<div class="w-oscuro lado"><aside class="mf" role="dialog" aria-modal="true" aria-label="Más filtros"><div class="mf-h"><span>Más filtros</span>'
            f'<button type="button" class="ib" aria-label="Cerrar">{X}</button></div><div class="mf-b">{sec("Recibida", recibida).replace(chr(60) + "span class=" + chr(34) + "t" + chr(34) + ">Recibida</span>", "")}{motivo}{fallas}{venta}{monto}{fecha}{cliente}{obs}{cargo}{version}</div>'
            f'<div class="mf-f"><button type="button" class="cb cb-enl">Limpiar todo</button><span class="der2"><button type="button" class="cb cb-sec">Cancelar</button>{boton}</span></div></aside></div>')


def filtros_lado():
    capas = A.con_estados([("Más filtros", mas_filtros()), ("Con filtros elegidos", mas_filtros("elegidos")), ("Contando", mas_filtros("contando")),
                           ("Ninguna coincide", mas_filtros("ninguna").replace("10.000", "900.000"))])
    t = pagina("Respuestas · Más filtros", banda(ac=EXPORTAR), A.con_estados([(e, fondo()) for e in ESTADOS_MF]), ESTADOS_MF, css=P.CSS_MF + CSS_MF2)
    return F.con_dialogo(t, capas)


# ================================================================ FRM-Respuesta: la vista rápida, al costado de la planilla
ESTADOS_D2 = ["Respuesta", "La primera de la lista", "De una versión anterior", "Elegir varias y campos", "Cargando", "No encontramos esa respuesta"]
FALLAS = "Frío<br>Ruido"
VALORES_126 = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "125.500,00"), ("Motivo", "Venta nueva"),
               ("Fallas", FALLAS), ("Observaciones", "Cerramos el pedido de octubre.")]
VALORES_130 = [("Cliente", "Corralón El Puente"), ("Fecha de la visita", "15/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", None), ("Motivo", "Seguimiento"),
               ("Fallas", "Frío"), ("Observaciones", "Pidieron presupuesto para la ampliación.")]
VALORES_123 = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", "0,00"), ("Motivo", "Seguimiento"), ("Observaciones", None)]
VALORES_R = [("Fallas", FALLAS), ("Proveedor", 'Aceros Rosario<span class="d-cmp">CUIT: 30-70988123-4</span><span class="d-cmp">Plazo de pago: 30 días</span>'),
             ("Observaciones", "Cambiar el compresor.")]
CSS_DET = """.d-cmp { display: block; color: var(--t2); font-size: 13px; }
.d2-acc { display: flex; align-items: center; gap: 12px; padding: 12px 20px 0; }
.d2-acc .cb { height: 32px; font-size: 13px; text-decoration: none; }
.d2-ln { font-size: 13px; font-weight: 600; color: var(--marca-tx); text-decoration: none; }
.d2-sub { padding-top: 8px; }
.d2-pie { padding: 10px 20px; border-top: 1px solid var(--borde); font-size: 13px; color: var(--t3); font-variant-numeric: tabular-nums; }
"""


def d2(num="VIS-000126", titulo=FORMULARIO, version=4, valores=VALORES_126, nombre="Tomás Acosta", hora="13/10/2026 15:30", primera=False, modo="normal", pos="2 de 4"):
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)"{" disabled" if primera else ""}>{SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{BAJA}</button>')
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{X}</button>'
    if modo == "cargando":
        return (f'<aside class="d2" role="dialog" aria-label="Respuesta"><div class="d2-h"><b>{num}</b>{nav}{cerrar}</div>'
                '<div class="esq"><span style="width: 60%;"></span><span style="width: 85%;"></span><span style="width: 72%;"></span><span style="width: 90%;"></span><span style="width: 66%;"></span></div></aside>')
    if modo == "falta":
        return (f'<aside class="d2" role="dialog" aria-label="Respuesta"><div class="d2-h"><b></b>{cerrar}</div>'
                '<div class="d2-msj"><b>No encontramos esta respuesta.</b><a class="cb cb-sec" href="FRM-Respuestas.dc.html">Volver a la planilla</a></div></aside>')
    sub = ('<div class="d2-acc"><a class="cb cb-sec" href="FRM-Respuesta-Completa.dc.html">Abrir en pantalla completa</a><a class="d2-ln" href="WA-Chats-Respuesta.dc.html">Abrir conversación</a></div>'
           f'<div class="d2-sub"><span>{titulo} · versión {version}</span></div>')
    mom = (f'<div class="d2-mom"><span class="ck">{CHECK}</span><span class="t"><span><b>Recibida</b><span class="h">{hora}</span></span>'
           f'<small>{P.PERSONA} La respondió {nombre} por WhatsApp · se la mandó Lucía Fernández</small></span></div>')
    pest = '<div class="o-tabs" role="tablist"><span role="tab" class="on">Respuesta</span></div>'
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {num}"><div class="d2-h"><b>{num}</b>{nav}{cerrar}</div>{sub}{mom}{pest}'
            f'<div class="d2-b">{F.grilla(valores)}</div><div class="d2-pie">{pos}</div></aside>')


def detalle():
    capas = A.con_estados([
        ("Respuesta", d2()),
        ("La primera de la lista", d2("VIS-000130", valores=VALORES_130, nombre="Paula Méndez", hora="15/10/2026 16:20", primera=True, pos="1 de 4")),
        ("De una versión anterior", d2("VIS-000123", version=3, valores=VALORES_123, hora="13/10/2026 11:04", pos="8 de 24")),
        ("Elegir varias y campos", d2("REP-000018", REPUESTO, 2, VALORES_R, hora="15/10/2026 10:12", primera=True, pos="1 de 18")),
        ("Cargando", d2(modo="cargando")),
        ("No encontramos esa respuesta", d2(modo="falta")),
    ])
    sel = {"La primera de la lista": "VIS-000130", "De una versión anterior": "VIS-000123", "No encontramos esa respuesta": None}
    cuerpo = A.con_estados([(e, fondo("repuesto", "REP-000018") if e == "Elegir varias y campos" else fondo(sel=sel.get(e, "VIS-000126"))) for e in ESTADOS_D2])
    bnd = A.con_estados([(e, banda(REPUESTO, "Respuestas · versión 2 publicada", EXPORTAR) if e == "Elegir varias y campos" else banda(ac=EXPORTAR)) for e in ESTADOS_D2])
    t = pagina("Respuesta · /org/formularios/:id/respuestas?respuesta=VIS-000126", bnd, cuerpo, ESTADOS_D2, css=F.CSS_GRILLA + P.CSS_D2 + CSS_DET + ".d2-h a.nv { text-decoration: none; }\n")
    k = t.rindex("</div>\n</x-dc>")
    return t[:k] + capas + t[k:]


# ================================================================ FRM-Respuesta-Completa: la pantalla completa, a todo el ancho (nueva)
ESTADOS_RC = ["Las dos abiertas", "Las dos plegadas", "De una versión anterior", "Abierta desde un enlace", "Cargando", "No encontramos esa respuesta"]
# 163 y 164 (traspaso 10): la pantalla completa va sin plegar, así que no hay «Las dos plegadas» ni «abiertas»
ESTADOS_RC5 = ["Respuesta", "De una versión anterior", "Abierta desde un enlace", "Cargando", "No encontramos esa respuesta"]
# sin plegar (163 y 164): solo en las pantallas completas que lo usan, para no tocar las de otras etapas
CSS_RC_FIJA = """.rc-h.fija { cursor: default; }
"""
CSS_RC = """.rc { padding: 0; overflow: hidden; }
.rc-h { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 0 16px; border: 0; background: oklch(0.945 0.018 76); font: inherit; color: var(--t1); cursor: pointer; text-align: left; }
.rc-h .t { font-size: 14px; font-weight: 600; }
.rc-h .r { flex: 1; font-size: 13.5px; color: var(--t2); }
.rc-h .fl { margin-left: auto; display: inline-flex; color: var(--t2); }
.rc-h .fl.ab { transform: rotate(180deg); }
.rc-b { padding: 16px; border-top: 1px solid oklch(0.89 0.02 76); }
.rc .g-det { grid-template-columns: 240px minmax(0, 1fr); }
.rc-act { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 10px 16px; font-size: 14px; }
.rc-act .h { color: var(--t2); font-variant-numeric: tabular-nums; }
.rc-pos { font-size: 13.5px; color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }
.w-bnd .nv { width: 32px; height: 32px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: inline-flex; align-items: center; justify-content: center; color: var(--t1); }
.rc-msj { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; min-height: 420px; }
.rc-msj b { font-size: 15px; }
"""
ACT_126 = [("13/10/2026 15:30", "La respondió Tomás Acosta por WhatsApp"), ("13/10/2026 11:20", "Se la mandó Lucía Fernández")]
ACT_123 = [("13/10/2026 11:04", "La respondió Tomás Acosta por WhatsApp"), ("13/10/2026 09:40", "Se la mandó Lucía Fernández")]


def rc_seccion(titulo, cuerpo, resumen, abierta, plegable=True):
    """Una sección de la pantalla completa. Sin `plegable` (163 y 164, traspaso 10), el título queda fijo y el contenido, siempre a la vista."""
    if not plegable:
        return f'<div class="w-caja rc"><div class="rc-h fija"><span class="t">{titulo}</span></div><div class="rc-b">{cuerpo}</div></div>'
    r = f'<span class="r">{resumen}</span>' if not abierta else ""
    b = f'<div class="rc-b">{cuerpo}</div>' if abierta else ""
    return f'<div class="w-caja rc"><button type="button" class="rc-h" aria-expanded="{"true" if abierta else "false"}"><span class="t">{titulo}</span>{r}<span class="fl{" ab" if abierta else ""}">{CHEV}</span></button>{b}</div>'


def actividad(filas):
    return '<div class="rc-act">' + "".join(f'<span class="h">{h}</span><span>{t}</span>' for h, t in filas) + "</div>"


def rc_cuerpo(valores=VALORES_126, act=ACT_126, abierta=True, resumen="7 preguntas · 7 respondidas"):
    return (CUERPO.format(rc_seccion("Respuesta", F.grilla(valores), resumen, abierta)
                          + rc_seccion("Actividad", actividad(act), f"La respondió Tomás Acosta el {act[0][0]}", abierta)))


def rc_banda(num="VIS-000126", res="Versión 4 · recibida el 13/10/2026 15:30", pos="2 de 4", primera=False):
    ac = (f'<span class="rc-pos">{pos}</span><button type="button" class="nv" aria-label="Respuesta anterior"{" disabled" if primera else ""}>{SUBE}</button>'
          f'<button type="button" class="nv" aria-label="Respuesta siguiente">{BAJA}</button><a class="cb cb-sec" href="WA-Chats-Respuesta.dc.html">Abrir conversación</a>')
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="FRM-Respuestas.dc.html" aria-label="Volver a las respuestas">{L.VOLVER}</a>'
            f'<div><h1>{num}</h1><p class="res">{res}</p></div></div><div class="ac">{ac}</div></div>')


def completa():
    bandas = {"Las dos abiertas": rc_banda(), "Las dos plegadas": rc_banda(), "De una versión anterior": rc_banda("VIS-000123", "Versión 3 · recibida el 13/10/2026 11:04", "8 de 24"),
              "Abierta desde un enlace": rc_banda(pos="5 de 24"), "Cargando": rc_banda(res=""),
              "No encontramos esa respuesta": ('<div class="w-bnd"><div class="iz"><a class="vol" href="FRM-Respuestas.dc.html" aria-label="Volver a las respuestas">' + L.VOLVER + '</a>'
                                               f'<div><h1>{FORMULARIO}</h1></div></div></div>')}
    cuerpos = {"Las dos abiertas": rc_cuerpo(), "Las dos plegadas": rc_cuerpo(abierta=False), "De una versión anterior": rc_cuerpo(VALORES_123, ACT_123),
               "Abierta desde un enlace": rc_cuerpo(), "Cargando": CUERPO.format('<div class="w-caja">' + P.ESQ + "</div>"),
               "No encontramos esa respuesta": CUERPO.format('<div class="rc-msj"><b>No encontramos esta respuesta.</b><a class="cb cb-sec" href="FRM-Respuestas.dc.html">Volver a las respuestas</a></div>')}
    return pagina("Respuesta · /org/formularios/:id/respuestas/:recordId/completa", A.con_estados([(e, bandas[e]) for e in ESTADOS_RC]),
                  A.con_estados([(e, cuerpos[e]) for e in ESTADOS_RC]), ESTADOS_RC, css=F.CSS_GRILLA + CSS_RC)


# ================================================================ FRM-Respuestas-Exportar: el diálogo de exportar
ESTADOS_EX = P.ESTADOS_EX + ["Elegir varias y campos"]
CSS_EX2 = """.w-dlg.ex { width: 520px; }
.w-dlg.ex .d-tx { margin: 0; }
.ex-rds { display: flex; flex-direction: column; gap: 10px; }
.ex-rd { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--t1); }
.ex-rd .rd { width: 16px; height: 16px; flex: none; box-sizing: border-box; border-radius: 50%; border: 1.5px solid var(--borde2); background: #fff; }
.ex-rd.on .rd { border: 5px solid var(--marca); }
.ex-arch { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--t2); }
"""


def dlg_exportar(modo="todas"):
    """Como ArquitecturaBase: cuántas respuestas, cuántos filtros, «Columnas a exportar» con la cantidad de cada opción y el nombre del archivo."""
    mucho, solo, corre, repuesto = modo == "mucho", modo == "solo", modo == "exportando", modo == "repuesto"
    n = "12.430" if mucho else "18" if repuesto else "4"
    filtros = "0 filtros aplicados" if mucho or repuesto else "3 filtros aplicados"
    linea = f'<p class="d-tx">{n} respuestas</p><p class="d-tx">{filtros}</p>'
    todas, visibles = (10, 10) if repuesto else (13, 12)

    def op(titulo, on):
        return f'<div class="ex-rd{" on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><span class="rd"></span>{titulo}</div>'
    ops = f'<div class="ex-rds" role="radiogroup" aria-label="Columnas a exportar">{op(f"Todas las preguntas ({todas} columnas)", not solo)}{op(f"Solo las visibles ({visibles} columnas)", solo)}</div>'
    aviso = ""
    if mucho:
        aviso = f'<div class="ex-av amb" role="alert">{P.TRI}<span>El máximo es 10.000 respuestas. Acotá los filtros de la planilla.</span></div>'
    elif modo == "otra":
        aviso = f'<div class="ex-av amb" role="alert">{P.TRI}<span>Ya tenés una exportación en curso. Esperá a que termine.</span></div>'
    elif modo == "error":
        aviso = f'<div class="ex-av mal" role="alert">{F.ALERTA}<span>No pudimos armar el archivo. Probá de nuevo.</span></div>'
    boton = trabaja("Exportando…") if corre else f'<button type="button" class="cb cb-pri"{" disabled" if mucho or modo == "otra" else ""}>Exportar a Excel</button>'
    cancelar = f'<button type="button" class="cb cb-sec" disabled title="{MOTIVO_EXPORTANDO}">Cancelar</button>' if corre else '<button type="button" class="cb cb-sec">Cancelar</button>'
    ayuda = "N°, recibida, quién la cargó, canal, empresas y las preguntas de todas las versiones, con todos los campos."
    archivo = f'<span class="ex-arch">{ARCHIVO} {ARCHIVO_R if repuesto else ARCHIVO_XLSX}</span>'
    d = F.dialogo("Exportar respuestas a Excel", f'{linea}<span class="ex-tit">Columnas a exportar{F.info(ayuda)}</span>{ops}{archivo}{aviso}', cancelar + boton).replace('class="w-dlg"', 'class="w-dlg ex"', 1)
    if corre:
        d = d.replace('<button type="button" class="ib" aria-label="Cerrar">', f'<button type="button" class="ib" aria-label="Cerrar" disabled title="{MOTIVO_EXPORTANDO}">', 1)
    return d


def fondo5(modo="filtrado"):
    """La planilla de fondo con un solo «Filtros» (143 y 144, traspaso 10): lo aplicado en chips y el total al pie, sin «Más filtros» ni cantidades."""
    if modo == "mucho":
        return CUERPO.format(barra5() + tabla(mucho=True))
    if modo == "repuesto":
        return CUERPO.format(barra5("repuesto") + tabla_r())
    return CUERPO.format(barra5("filtrado") + tabla(FILTRADAS, total=4))


def exportar():
    capas = A.con_estados([("Exportar", dlg_exportar()), ("Solo las columnas visibles", dlg_exportar("solo")), ("Más de 10.000", dlg_exportar("mucho")), ("Exportando", dlg_exportar("exportando")),
                           ("Exportado", A.toast(f"Se descargó «{ARCHIVO_XLSX}».")), ("Ya hay una exportación en curso", dlg_exportar("otra")), ("No se pudo exportar", dlg_exportar("error")), ("Elegir varias y campos", dlg_exportar("repuesto"))])
    cuerpo = A.con_estados([(e, fondo5("repuesto" if e == "Elegir varias y campos" else "mucho" if e == "Más de 10.000" else "filtrado")) for e in ESTADOS_EX])
    bnd = A.con_estados([(e, banda(REPUESTO, "Respuestas · versión 2 publicada", EXPORTAR) if e == "Elegir varias y campos" else banda(ac=EXPORTAR)) for e in ESTADOS_EX])
    t = pagina("Respuestas · Exportar a Excel", bnd, cuerpo, ESTADOS_EX, css=C.CSS_K2 + P.CSS_EX + CSS_EX2 + CSS_T5)
    return F.con_dialogo(t, capas)


# ================================================================ M-FRM-Respuestas: la planilla en el teléfono
ESTADOS_TPL = ["Respuestas", "Filtros", "Con filtros", "Más acciones", "Exportar", "Exportado", "Cargando", "Todavía no hay respuestas", "Sin coincidencias", "No se pudo cargar", "Sin permiso"]
CSS_T15 = """.ap-fila .pl-marca { margin-left: 6px; padding: 0 7px; border: 1px solid var(--borde2); border-radius: 999px; font-size: 12px; line-height: 18px; color: var(--t2); }
.tr-sec { margin: 12px 16px 0; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.tr-sec:last-child { margin-bottom: 16px; }
.tr-sec .h { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 48px; padding: 0 14px; border: 0; background: oklch(0.945 0.018 76); font: inherit; font-size: 15px; font-weight: 600; color: var(--t1); text-align: left; }
.tr-sec .h .r { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 400; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tr-sec .h .fl { margin-left: auto; display: inline-flex; color: var(--t2); }
.tr-sec .h .fl.ab { transform: rotate(180deg); }
.tr-sec .tr-gr { margin: 0; border: 0; border-radius: 0; }
.tr-act { display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; font-size: 15px; }
.tr-act small { display: block; color: var(--t3); font-size: 13px; }
.d-cmp { display: block; color: var(--t2); font-size: 14px; }
"""


def tel_respuestas():
    der = lambda con=False: (f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib{" con" if con else ""}" aria-label="Filtros">{F.TFILTROS}</button>'
                             f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>')
    volver = "M-FRM-Formularios.dc.html"

    def fila_t(r):
        (n, rec, nom, tipo, emp, cli, *_resto) = r
        corto = nom if len(nom) < 26 else nom[:24] + "…"
        marca = '<span class="pl-marca">Cliente</span>' if tipo == "cliente" else ""
        return (f'<a class="ap-fila" href="M-FRM-Respuesta.dc.html"><div class="tx"><span class="l1">{n}<span class="hr">{rec}</span></span>'
                f'<span class="l2">{corto}{marca} · {emp}</span><span class="l3">{cli}</span></div></a>')
    filas, filtradas = "".join(fila_t(r) for r in RESP), "".join(fila_t(r) for r in RESP if r[0] in FILTRADAS)
    esq = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span><span style="width: 66%;"></span></div>'

    def lista(cuerpo, con=False, sub="24 respuestas"):
        return C.t_bar(FORMULARIO, sub, volver, der(con)) + f'<div class="ap-cuerpo">{cuerpo}</div>'
    cuerpo = {
        "Respuestas": lista(filas), "Filtros": lista(filas), "Con filtros": lista(filtradas, True, "4 de 24 respuestas"), "Más acciones": lista(filas), "Exportar": lista(filas), "Exportado": lista(filas),
        "Cargando": lista(esq, sub="Respuestas"),
        "Todavía no hay respuestas": C.t_bar(FORMULARIO, "Sin respuestas", volver) + '<div class="ap-cuerpo"><div class="ap-vacio">Todavía no llegaron respuestas.<a class="cb cb-sec" href="M-WA-Chats-Formulario.dc.html">Ir a los chats</a></div></div>',
        "Sin coincidencias": lista('<div class="ap-vacio">Ninguna respuesta coincide con los filtros.<button type="button" class="cb cb-sec">Limpiar filtros</button></div>', True, "0 de 24 respuestas"),
        "No se pudo cargar": lista('<div class="ap-vacio">No pudimos cargar las respuestas.<button type="button" class="cb cb-sec">Reintentar</button></div>', sub=""),
        "Sin permiso": C.t_bar("Respuestas", "Gestión de formularios", volver) + '<div class="ap-cuerpo"><div class="ap-vacio">No tenés permiso para ver esta página.<a class="cb cb-sec" href="M-Inicio-Org.dc.html">Ir al inicio</a></div></div>',
    }
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")

    def grupo(tit, ops, elegido=0):
        return f'<div class="p-tit2">{tit}</div>' + "".join(f'<span class="t-opc {"on" if k == elegido else ""}">{n}<span class="d">{c}{tilde if k == elegido else ""}</span></span>' for k, (n, c) in enumerate(ops))
    filtros_h = (grupo("Empresa", [("Todas las empresas", 24), ("Delta S.A.", 17), ("Delta Sur S.R.L.", 4), ("Delta Norte S.A.", 6), ("Sin empresa", 2)])
                 + grupo("Recibida", [("Todas las fechas", ""), ("Hoy", 2), ("Últimos 7 días", 14), ("Octubre 2026", 24)]))
    menu = F.thoja(FORMULARIO, f'<div class="ap-acciones2"><span role="menuitem">{A.DESCARGAR} Exportar a Excel</span></div>', "")
    hoja_ex = F.thoja("Exportar a Excel", f'<p class="ap-txt-l">Se exportan las <b>24 respuestas</b> de {FORMULARIO}, con las preguntas de todas las versiones.</p><span class="ex-arch">{ARCHIVO} {ARCHIVO_XLSX}</span>',
                      '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Exportar a Excel</button>')
    capas = {"Filtros": F.thoja("Filtros", filtros_h, '<button type="button" class="cb cb-sec">Limpiar filtros</button><button type="button" class="cb cb-pri">Ver 24 respuestas</button>').replace('<div class="hb">', '<div class="hb lst">', 1),
             "Más acciones": menu, "Exportar": hoja_ex,
             "Exportado": f'<div class="t-toast" role="status"><span class="ok">{F.OK}</span><span>Se descargó «{ARCHIVO_XLSX}».</span></div>'}
    return C.tel_pagina(cuerpo, ESTADOS_TPL, capas, "Respuestas · teléfono", F.CSS_TFILTRO + P.CSS_TPL + CSS_T15)


# ================================================================ M-FRM-Respuesta: la pantalla completa en el teléfono, con sus dos secciones plegables
ESTADOS_TR = ["Respuesta", "Las dos plegadas", "La primera de la lista", "De una versión anterior", "Elegir varias y campos", "Cargando", "No encontramos esa respuesta"]
ESTADOS_TR5 = [e for e in ESTADOS_TR if e != "Las dos plegadas"]  # 163 y 164 (traspaso 10): sin plegar


def tel_respuesta():
    def bar(num="VIS-000126", titulo=FORMULARIO, version=4):
        return C.t_bar(num, f"{titulo} · versión {version}", "M-FRM-Respuestas.dc.html")

    def nav(pos="5 de 24", primera=False):
        return (f'<div class="tr-nav"><span>{pos}</span><button type="button" class="ap-ib" aria-label="Respuesta anterior"{" disabled" if primera else ""}>{SUBE}</button>'
                f'<button type="button" class="ap-ib" aria-label="Respuesta siguiente">{BAJA}</button><a class="cb cb-sec" href="M-WA-Conversacion-Respuesta.dc.html">Abrir conversación</a></div>')

    def grilla(valores):
        filas = "".join(f'<div class="f"><span class="k">{k}</span>' + (f"<span>{v}</span>" if v is not None else '<span class="vac">Sin respuesta</span>') + "</div>" for k, v in valores)
        return f'<div class="tr-gr">{filas}</div>'

    def sec(titulo, cuerpo, resumen, abierta):
        r = f'<span class="r">{resumen}</span>' if not abierta else ""
        return (f'<div class="tr-sec"><button type="button" class="h" aria-expanded="{"true" if abierta else "false"}">{titulo}{r}<span class="fl{" ab" if abierta else ""}">{CHEV}</span></button>'
                + (cuerpo if abierta else "") + "</div>")

    def act(filas):
        return '<div class="tr-act">' + "".join(f"<span>{t}<small>{h}</small></span>" for h, t in filas) + "</div>"

    def pantalla(num="VIS-000126", titulo=FORMULARIO, version=4, valores=VALORES_126, actv=ACT_126, pos="5 de 24", primera=False, abierta=True):
        return bar(num, titulo, version) + nav(pos, primera) + ('<div class="tr-scroll">' + sec("Respuesta", grilla(valores), "7 preguntas · 7 respondidas", abierta)
                                                                + sec("Actividad", act(actv), f"La respondió el {actv[0][0]}", abierta) + "</div>")
    esq = '<div class="ap-esq"><span style="width: 70%;"></span><span style="width: 90%;"></span><span style="width: 60%;"></span><span style="width: 84%;"></span></div>'
    cuerpo = {
        "Respuesta": pantalla(), "Las dos plegadas": pantalla(abierta=False),
        "La primera de la lista": pantalla("VIS-000130", valores=VALORES_130, actv=[("15/10/2026 16:20", "La respondió Paula Méndez por WhatsApp"), ("15/10/2026 09:10", "Se la mandó Lucía Fernández")], pos="1 de 24", primera=True),
        "De una versión anterior": pantalla("VIS-000123", version=3, valores=VALORES_123, actv=ACT_123, pos="8 de 24"),
        "Elegir varias y campos": pantalla("REP-000018", REPUESTO, 2, VALORES_R, [("15/10/2026 10:12", "La respondió Tomás Acosta por WhatsApp"), ("15/10/2026 08:45", "Se la mandó Lucía Fernández")], "1 de 18", True),
        "Cargando": bar() + nav() + esq,
        "No encontramos esa respuesta": C.t_bar("Respuesta", FORMULARIO, "M-FRM-Respuestas.dc.html") + '<div class="ap-cuerpo"><div class="ap-vacio">No encontramos esta respuesta.<a class="cb cb-sec" href="M-FRM-Respuestas.dc.html">Volver a las respuestas</a></div></div>',
    }
    return C.tel_pagina(cuerpo, ESTADOS_TR, {}, "Respuesta · teléfono", P.CSS_TPL + CSS_T15)


# ================================================================ Traspaso 5: un solo «Filtros» con chips (143 y 144), líneas entre columnas (137) y el detalle alineado (139)
# Las etapas 18 a 21 siguen usando `barra`, `mas_filtros`, `d2`, `rc_cuerpo` y `actividad` hasta que les toca su tanda.
CHAT = svg('<path d="M5 5h14v10H9l-4 4z"/>', 16)
F5_LISTA = [("rec", "Recibida"), ("cli", "Cliente"), ("fec", "Fecha de la visita"), ("ven", "¿Se concretó la venta?"), ("mon", "Monto estimado"),
            ("mot", "Motivo"), ("fal", "Fallas"), ("obs", "Observaciones"), ("quien", "Cargó"), ("ver", "Versión del formulario")]
F5_OPC = {"rec": ["Todas las fechas", "Hoy", "Últimos 7 días", "Octubre 2026", "Elegir fechas…"], "mot": ["Todas", "Seguimiento", "Venta nueva", "Reclamo", "Visita técnica"]}
CSS_T5 = """.w-th.pl, .w-tr.pl { column-gap: 0; }
.w-th.pl > span, .w-tr.pl > span { padding-left: 12px; padding-right: 12px; box-sizing: border-box; align-self: stretch; }
.w-th.pl > span { line-height: 40px; }
.w-tr.pl > span { line-height: 44px; }
.w-th.pl > span:nth-child(n+3), .w-tr.pl > span:nth-child(n+3) { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.w-th.pl > span:nth-child(n+3) { box-shadow: inset 1px 0 0 oklch(0.89 0.02 76); }
.w-tr.pl.sel > :first-child { box-shadow: inset 3px 0 0 var(--marca), 1px 0 0 var(--borde); }
.pl-fb { flex-wrap: wrap; }
.pl-chips { flex-basis: 100%; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pl-chip { height: 28px; box-sizing: border-box; display: inline-flex; align-items: center; gap: 2px; padding: 0 4px 0 12px; border-radius: 999px; background: var(--s2); border: 1px solid var(--borde); font-size: 13px; color: var(--t1); }
.pl-chip .x { width: 22px; height: 22px; border: 0; background: transparent; border-radius: 50%; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.pl-chip .x svg { width: 12px; height: 12px; }
.pl-fil .n { min-width: 18px; height: 18px; box-sizing: border-box; border-radius: 9px; background: var(--marca); color: #fff; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px; }
.f-mn > span.pl-op { justify-content: flex-start; gap: 8px; }
.f-mn > span.pl-op.sel { font-weight: 600; background: #fff; color: var(--t1); }
.pl-op .tl, .pl-fmn .tl { width: 16px; flex-shrink: 0; display: inline-flex; color: var(--marca-tx); }
.pl-fmn { position: absolute; z-index: 30; left: 0; top: calc(100% + 6px); display: grid; grid-template-columns: 220px 300px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); font-size: 13px; color: var(--t1); font-weight: 400; }
.pl-fmn .fi { border-right: 1px solid var(--borde); display: flex; flex-direction: column; }
.pl-fmn .fi > span { min-height: 38px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 14px; border-top: 1px solid var(--borde); white-space: nowrap; }
.pl-fmn .fi > span:first-child { border-top: 0; border-radius: 10px 0 0 0; }
.pl-fmn .fi > span.on { background: var(--marca-t); color: var(--marca-tx); box-shadow: inset 3px 0 0 var(--marca); font-weight: 600; }
.pl-fmn .fi .pt { width: 6px; height: 6px; border-radius: 50%; background: var(--marca); flex-shrink: 0; }
.pl-fmn .fd { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.pl-fmn .fd .r { font-size: 13px; color: var(--t2); }
.pl-fmn .cmb { height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; background: #fff; }
.pl-fmn .cmb.ab { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.15); }
.pl-fmn .lst2 { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; }
.pl-fmn .lst2 > span { min-height: 34px; display: flex; align-items: center; gap: 8px; padding: 0 12px; border-top: 1px solid var(--borde); }
.pl-fmn .lst2 > span:first-child { border-top: 0; }
.pl-fmn .lst2 > span.sel { font-weight: 600; }
.pl-fmn .lst2 .sep2 { min-height: 0; padding: 0; border-top: 1px solid var(--borde2); }
.pl-fmn .dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.pl-fmn .dos > span { display: flex; flex-direction: column; gap: 4px; }
.pl-fmn .in { height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; display: flex; align-items: center; padding: 0 10px; color: var(--t3); }
.pl-fmn .in.lleno { color: var(--t1); }
"""
CSS_D3 = """.d2-h .ib { text-decoration: none; color: var(--t1); }
.d3-moms { display: flex; flex-direction: column; padding: 6px 20px 2px; }
.d3-moms .m { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--borde); font-size: 13.5px; }
.d3-moms .m:last-child { border-bottom: 0; }
.d3-moms .t { display: flex; flex-direction: column; gap: 1px; }
.d3-moms .t b { font-weight: 600; }
.d3-moms small { color: var(--t2); font-size: 12.5px; }
.d3-moms .h { color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }
.d-sub { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 12px; margin-top: 6px; padding-left: 10px; border-left: 2px solid var(--borde2); font-size: 13px; }
.d-sub .k { color: var(--t2); }
.d-sub > span { white-space: nowrap; }
.ac4 { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 14px; }
.ac4 .hd, .ac4 .f { display: grid; grid-template-columns: 170px minmax(0, 1fr) 140px 160px; }
.ac4 .hd { background: oklch(0.945 0.018 76); color: var(--t2); font-weight: 600; font-size: 13px; border-bottom: 1px solid oklch(0.89 0.02 76); }
.ac4 .hd > span, .ac4 .f > span { padding: 10px 12px; }
.ac4 .hd > span + span, .ac4 .f > span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.ac4 .f + .f { border-top: 1px solid var(--borde); }
.ac4 .f .q small { display: block; color: var(--t2); font-size: 13px; }
.ac4 .f .h { color: var(--t2); font-variant-numeric: tabular-nums; }
.ac4 .f .e { display: inline-flex; align-items: center; gap: 8px; }
.ac4 .f .e::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }
"""
VALORES_R5 = [("Fallas", FALLAS), ("Proveedor", 'Aceros Rosario<span class="d-sub"><span class="k">CUIT</span><span>30-70988123-4</span><span class="k">Plazo de pago</span><span>30 días</span></span>'),
              ("Observaciones", "Cambiar el compresor.")]
# (fecha, qué pasó, quién o cómo, estado): la fecha una vez por día y la hora en cada renglón
ACT4_126 = [("13/10/2026 11:20", "Se la mandó", "Lucía Fernández, desde el chat", "Hecho"), ("15:30", "La respondió", "Tomás Acosta, por WhatsApp", "Hecho")]
ACT4_123 = [("13/10/2026 09:40", "Se la mandó", "Lucía Fernández, desde el chat", "Hecho"), ("11:04", "La respondió", "Tomás Acosta, por WhatsApp", "Hecho")]


def tl(si):
    return f'<span class="tl">{CHECK if si else ""}</span>'


def chips5(items):
    if not items:
        return ""
    return ('<div class="pl-chips">' + "".join(f'<span class="pl-chip">{t}<button type="button" class="x" aria-label="Quitar {t}">{X}</button></span>' for t in items)
            + '<button type="button" class="cb cb-enl">Limpiar todo</button></div>')


def menu_filtros(modo="inicio"):
    """«Filtros», como «Columnas»: a la izquierda lo que se filtra, con un punto en lo aplicado; a la derecha, lo que se elige en lo marcado.
    modo: inicio (Recibida, nada aplicado), abierta (Motivo, su combo abierto), aplicado (Motivo con «Venta nueva») y ninguna (Monto desde 900.000)."""
    aplicado, ninguna = modo == "aplicado", modo == "ninguna"
    marcados = {"rec", "mot"} if aplicado else {"mot", "mon"} if ninguna else set()
    sel = {"inicio": "rec", "abierta": "mot", "aplicado": "mot", "ninguna": "mon"}[modo]
    izq = "".join(f'<span{" class=" + chr(34) + "on" + chr(34) if k == sel else ""}>{n}{"<span class=" + chr(34) + "pt" + chr(34) + "></span>" if k in marcados else ""}</span>' for k, n in F5_LISTA)
    nombre = dict(F5_LISTA)[sel]
    if sel == "mon":
        der = (f'<b>{nombre}</b><span class="dos"><span><span class="r">Desde</span><span class="in lleno">900.000</span></span>'
               '<span><span class="r">Hasta</span><span class="in"></span></span></span>')
    else:
        ops = F5_OPC[sel]
        elegida = "Venta nueva" if aplicado else ops[0]
        abierta = modo == "abierta"
        lista = ""
        if abierta:
            lista = ('<span class="lst2" role="listbox">' + f'<span class="sel">{tl(True)}{ops[0]}</span><span class="sep2"></span>'
                     + "".join(f"<span>{tl(False)}{o}</span>" for o in ops[1:]) + "</span>")
        der = f'<b>{nombre}</b><span class="cmb{" ab" if abierta else ""}" role="combobox" aria-expanded="{"true" if abierta else "false"}">{elegida} {CHEV}</span>{lista}'
    return f'<span class="pl-fmn" role="dialog" aria-label="Filtros"><span class="fi">{izq}</span><span class="fd">{der}</span></span>'


def barra5(modo="normal"):
    """La caja de filtros (143 y 144): el buscador, «Empresa» y un solo «Filtros», con lo aplicado en chips debajo. modo: normal, columnas, empresa,
    filtrado, busqueda, repuesto, repuesto-columnas, repuesto-filtro, y filtros-inicio, filtros-abierta, filtros-aplicado y filtros-ninguna, con «Filtros» abierto."""
    emp_items = [("t", "Todas las empresas"), ("a", "Delta S.A."), ("s", "Delta Sur S.R.L."), ("n", "Delta Norte S.A."), ("x", "Sin empresa")]
    repuesto = modo.startswith("repuesto")
    fmodo = modo[8:] if modo.startswith("filtros-") else ""
    filtrado = modo == "filtrado" or fmodo in ("aplicado", "ninguna")

    def pil(nombre, texto, items, elegido, abierto):
        menu = ""
        if abierto:
            menu = (f'<span class="f-mn" role="listbox" aria-label="Filtrar por {nombre.lower()}">'
                    + "".join(f'<span role="option" aria-selected="{"true" if k == elegido else "false"}" class="pl-op{" sel" if k == elegido else ""}">{tl(k == elegido)}{n}</span>' for k, n in items) + "</span>")
        return f'<span class="f-env"><span class="w-pil{" con" if elegido != "t" else ""}" role="button" aria-haspopup="listbox">{texto} {CHEV}</span>{menu}</span>'
    bus = (f'<span class="w-bus lleno">{F.BUSCAR} pallet</span>' if modo == "busqueda" else f'<span class="w-bus">{F.BUSCAR} Buscar en textos largos</span>')
    h = bus + pil("Empresa", "Empresa: Delta S.A." if filtrado else "Empresa", emp_items, "a" if filtrado else "t", modo == "empresa")
    chips = (["Fallas: Frío"] if modo == "repuesto-filtro" else ["Motivo: Venta nueva", "Monto estimado: desde 900.000"] if fmodo == "ninguna"
             else ["Recibida: últimos 7 días", "Motivo: Venta nueva"] if filtrado else [])
    menu = menu_filtros(fmodo) if fmodo else ""
    n = f' <span class="n">{len(chips)}</span>' if chips else ""
    h += (f'<span class="pl-env"><span class="w-pil pl-fil" role="button" aria-haspopup="dialog" aria-expanded="{"true" if menu else "false"}">{FILTROS} Filtros{n}</span>{menu}</span>')
    col_menu = menu_columnas(repuesto) if modo in ("columnas", "repuesto-columnas") else ""
    h += (f'<span class="pl-der"><span class="pl-env"><span class="w-pil" role="button" aria-haspopup="menu" aria-expanded="{"true" if col_menu else "false"}">'
          f'Columnas {CHEV}</span>{col_menu}</span></span>')
    return f'<div class="w-caja o-fb pl-fb">{h}{chips5(chips)}</div>'


def respuestas5():
    vacia = tabla(cuerpo=f'<div class="pl-vacio"><span class="ic">{TABLA}</span><b>Todavía no llegaron respuestas.</b><a class="cb cb-sec" href="WA-Chats-Formulario.dc.html">Ir a los chats</a></div>')
    sin_c = tabla(cuerpo='<div class="pl-vacio"><b>Ninguna respuesta coincide con la búsqueda.</b><button type="button" class="cb cb-enl">Limpiar la búsqueda</button></div>')
    error = tabla(cuerpo='<div class="pl-vacio"><b>No pudimos cargar las respuestas.</b><button type="button" class="cb cb-sec">Reintentar</button></div>')
    sin_permiso = (f'<div class="pl-pagina"><span class="ic">{ESCUDO}</span><b>No tenés permiso para ver esta página.</b><a class="cb cb-sec" href="Inicio-Org.dc.html">Ir al inicio</a></div>')
    aviso = A.toast("No pudimos actualizar las respuestas. Siguen las de antes.", "mal", '<button type="button" class="cb cb-enl">Reintentar</button>')
    cuerpos = {
        "Planilla": barra5() + tabla(), "Columnas": barra5("columnas") + tabla(), "Empresa: menú": barra5("empresa") + tabla(),
        "Con filtros": barra5("filtrado") + tabla(FILTRADAS, total=4),
        "Elegir varias y campos": barra5("repuesto") + tabla_r(), "Elegir varias: el filtro": barra5("repuesto-filtro") + tabla_r(FILTRADAS_R),
        "Elegir varias y campos: columnas": barra5("repuesto-columnas") + tabla_r(),
        "Vuelve a leer": barra5("filtrado") + tabla(FILTRADAS, total=4, aten=True),
        "Cargando": barra5() + tabla(cuerpo=P.ESQ), "Todavía no hay respuestas": vacia, "Sin coincidencias": barra5("busqueda") + sin_c, "No se pudo cargar": barra5() + error,
        "No se pudo actualizar": barra5("filtrado") + tabla(FILTRADAS, total=4) + aviso, "Sin permiso": sin_permiso, "Sin permiso para exportar": barra5() + tabla(),
    }

    def bnd(e):
        if e == "Sin permiso":
            return ""
        if e.startswith("Elegir varias"):
            return banda(REPUESTO, "Respuestas · versión 2 publicada", EXPORTAR)
        return banda(ac={"Todavía no hay respuestas": EXPORTAR_OFF, "Sin permiso para exportar": ""}.get(e, EXPORTAR))
    return pagina("Respuestas · /org/formularios/:id/respuestas", A.con_estados([(e, bnd(e)) for e in ESTADOS_PL]),
                  A.con_estados([(e, CUERPO.format(cuerpos[e])) for e in ESTADOS_PL]), ESTADOS_PL, css=CSS_T5)


# FRM-Respuestas-Filtros: «Filtros», abierto como «Columnas» (144)
ESTADOS_F5 = ["Filtros", "Una pregunta con opciones", "Con filtros aplicados", "Ninguna coincide"]


def filtros5():
    nada = tabla(cuerpo='<div class="pl-vacio"><b>Ninguna respuesta coincide con los filtros.</b><button type="button" class="cb cb-enl">Limpiar todo</button></div>')
    cuerpos = {"Filtros": barra5("filtros-inicio") + tabla(), "Una pregunta con opciones": barra5("filtros-abierta") + tabla(),
               "Con filtros aplicados": barra5("filtros-aplicado") + tabla(FILTRADAS, total=4), "Ninguna coincide": barra5("filtros-ninguna") + nada}
    return pagina("Respuestas · Filtros", banda(ac=EXPORTAR), A.con_estados([(e, CUERPO.format(cuerpos[e])) for e in ESTADOS_F5]), ESTADOS_F5, css=CSS_T5)


def d3(num="VIS-000126", titulo=FORMULARIO, version=4, valores=VALORES_126, nombre="Tomás Acosta", hora="13/10/2026 15:30", mandada="13/10/2026 11:20",
       primera=False, modo="normal", pos="2 de 4"):
    """La vista rápida alineada (139): las acciones como íconos junto a ↑ ↓ ✕, los momentos con la fecha a la derecha y los campos de la opción debajo de su valor."""
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)"{" disabled" if primera else ""}>{SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{BAJA}</button>')
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{X}</button>'
    iconos = (f'<a class="ib" href="FRM-Respuesta-Completa.dc.html" aria-label="Abrir en pantalla completa" title="Abrir en pantalla completa">{EXPANDIR}</a>'
              f'<a class="ib" href="WA-Chats-Respuesta.dc.html" aria-label="Abrir conversación" title="Abrir conversación">{CHAT}</a>')
    if modo == "cargando":
        return (f'<aside class="d2" role="dialog" aria-label="Respuesta"><div class="d2-h"><b>{num}</b>{iconos}{nav}{cerrar}</div>'
                '<div class="esq"><span style="width: 60%;"></span><span style="width: 85%;"></span><span style="width: 72%;"></span><span style="width: 90%;"></span><span style="width: 66%;"></span></div></aside>')
    if modo == "falta":
        return d2(modo="falta")
    moms = (f'<div class="d3-moms"><div class="m"><span class="t"><b>Mandada</b><small>Lucía Fernández, desde el chat</small></span><span class="h">{mandada}</span></div>'
            f'<div class="m"><span class="t"><b>Recibida</b><small>Por WhatsApp · {nombre}</small></span><span class="h">{hora}</span></div></div>')
    pest = '<div class="o-tabs" role="tablist"><span role="tab" class="on">Respuesta</span></div>'
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {num}"><div class="d2-h"><b>{num}</b>{iconos}{nav}{cerrar}</div>'
            f'<div class="d2-sub" style="padding: 10px 20px 0;"><span>{titulo} · versión {version}</span></div>{moms}{pest}'
            f'<div class="d2-b">{F.grilla(valores)}</div><div class="d2-pie">{pos}</div></aside>')


def detalle5():
    capas = A.con_estados([
        ("Respuesta", d3()),
        ("La primera de la lista", d3("VIS-000130", valores=VALORES_130, nombre="Paula Méndez", hora="15/10/2026 16:20", mandada="15/10/2026 09:10", primera=True, pos="1 de 4")),
        ("De una versión anterior", d3("VIS-000123", version=3, valores=VALORES_123, hora="13/10/2026 11:04", mandada="13/10/2026 09:40", pos="8 de 24")),
        ("Elegir varias y campos", d3("REP-000018", REPUESTO, 2, VALORES_R5, hora="15/10/2026 10:12", mandada="15/10/2026 08:45", primera=True, pos="1 de 18")),
        ("Cargando", d3(modo="cargando")),
        ("No encontramos esa respuesta", d3(modo="falta")),
    ])
    sel = {"La primera de la lista": "VIS-000130", "De una versión anterior": "VIS-000123", "No encontramos esa respuesta": None}

    def fondo5(e):
        if e == "Elegir varias y campos":
            return CUERPO.format(barra5("repuesto") + tabla_r(sel="REP-000018"))
        return CUERPO.format(barra5() + tabla(sel=sel.get(e, "VIS-000126")))
    cuerpo = A.con_estados([(e, fondo5(e)) for e in ESTADOS_D2])
    bnd = A.con_estados([(e, banda(REPUESTO, "Respuestas · versión 2 publicada", EXPORTAR) if e == "Elegir varias y campos" else banda(ac=EXPORTAR)) for e in ESTADOS_D2])
    t = pagina("Respuesta · /org/formularios/:id/respuestas?respuesta=VIS-000126", bnd, cuerpo, ESTADOS_D2,
               css=F.CSS_GRILLA + P.CSS_D2 + CSS_DET + CSS_D3 + CSS_T5 + ".d2-h a.nv { text-decoration: none; }\n")
    k = t.rindex("</div>\n</x-dc>")
    return t[:k] + capas + t[k:]


def actividad4(filas):
    """La actividad en cuatro columnas fijas (139): Fecha, Qué pasó, Estado y Acciones."""
    return ('<div class="ac4"><div class="hd"><span>Fecha</span><span>Qué pasó</span><span>Estado</span><span>Acciones</span></div>'
            + "".join(f'<div class="f"><span class="h">{h}</span><span class="q">{q}<small>{quien}</small></span><span><span class="e">{e}</span></span><span></span></div>'
                      for h, q, quien, e in filas) + "</div>")


def completa5():
    def rc_cuerpo5(valores=VALORES_126, act=ACT4_126, resumen="7 preguntas · 7 respondidas", recibida="13/10/2026 15:30"):
        return (CUERPO.format(rc_seccion("Respuesta", F.grilla(valores), resumen, True, plegable=False)
                              + rc_seccion("Actividad", actividad4(act), f"Recibida el {recibida}", True, plegable=False)))
    bandas = {"Respuesta": rc_banda(), "De una versión anterior": rc_banda("VIS-000123", "Versión 3 · recibida el 13/10/2026 11:04", "8 de 24"),
              "Abierta desde un enlace": rc_banda(pos="5 de 24"), "Cargando": rc_banda(res=""),
              "No encontramos esa respuesta": ('<div class="w-bnd"><div class="iz"><a class="vol" href="FRM-Respuestas.dc.html" aria-label="Volver a las respuestas">' + L.VOLVER + '</a>'
                                               f'<div><h1>{FORMULARIO}</h1></div></div></div>')}
    cuerpos = {"Respuesta": rc_cuerpo5(), "De una versión anterior": rc_cuerpo5(VALORES_123, ACT4_123, recibida="13/10/2026 11:04"),
               "Abierta desde un enlace": rc_cuerpo5(), "Cargando": CUERPO.format('<div class="w-caja">' + P.ESQ + "</div>"),
               "No encontramos esa respuesta": CUERPO.format('<div class="rc-msj"><b>No encontramos esta respuesta.</b><a class="cb cb-sec" href="FRM-Respuestas.dc.html">Volver a las respuestas</a></div>')}
    return pagina("Respuesta · /org/formularios/:id/respuestas/:recordId/completa", A.con_estados([(e, bandas[e]) for e in ESTADOS_RC5]),
                  A.con_estados([(e, cuerpos[e]) for e in ESTADOS_RC5]), ESTADOS_RC5, css=F.CSS_GRILLA + CSS_RC + CSS_RC_FIJA + CSS_D3)


# Los teléfonos: «Filtros» ocupa la pantalla, sin cantidades, y lo aplicado va en chips debajo de la barra
ESTADOS_TPL5 = ["Respuestas", "Filtros", "Filtros: una pregunta", "Con filtros", "Más acciones", "Exportar", "Exportado", "Cargando", "Todavía no hay respuestas", "Sin coincidencias",
                "No se pudo cargar", "Sin permiso"]
CSS_T5_TEL = """.t-chips { display: flex; gap: 8px; flex-wrap: wrap; padding: 10px 16px; border-bottom: 1px solid var(--borde); background: #fff; }
.t-chips .pl-chip { height: 32px; font-size: 14px; }
.t-fl { display: flex; flex-direction: column; background: #fff; }
.t-fl > span { min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 16px; border-bottom: 1px solid var(--borde); font-size: 16px; }
.t-fl .v { color: var(--t2); font-size: 15px; display: inline-flex; align-items: center; gap: 6px; }
.t-fl .v.on { color: var(--marca-tx); font-weight: 600; }
.t-fl > span.op { justify-content: flex-start; }
.t-fl > span.op.sel { font-weight: 600; }
.t-fl .tl { width: 20px; display: inline-flex; color: var(--marca-tx); }
.t-pie { position: absolute; left: 0; right: 0; bottom: 0; display: flex; gap: 10px; padding: 12px 16px 28px; background: #fff; border-top: 1px solid var(--borde); }
.t-pie .cb { flex: 1; height: 48px; }
.tr-moms { margin: 12px 16px 0; border: 1px solid var(--borde); border-radius: 12px; background: #fff; }
.tr-moms .m { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px; font-size: 15px; }
.tr-moms .m + .m { border-top: 1px solid var(--borde); }
.tr-moms small { display: block; color: var(--t2); font-size: 13px; }
.tr-moms .h { color: var(--t2); font-size: 13.5px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.d-sub { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 12px; margin-top: 6px; padding-left: 10px; border-left: 2px solid var(--borde2); font-size: 14px; }
.d-sub .k { color: var(--t2); }
.d-sub > span { white-space: nowrap; }
"""


def tel_respuestas5():
    der = lambda con=False: (f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib{" con" if con else ""}" aria-label="Filtros">{F.TFILTROS}</button>'
                             f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>')
    volver = "M-FRM-Formularios.dc.html"

    def fila_t(r):
        """174 (v169): el nombre entero; si no entra, el renglón baja."""
        (n, rec, nom, tipo, emp, cli, *_resto) = r
        marca = '<span class="pl-marca">Cliente</span>' if tipo == "cliente" else ""
        return (f'<a class="ap-fila" href="M-FRM-Respuesta.dc.html"><div class="tx"><span class="l1">{n}<span class="hr">{rec}</span></span>'
                f'<span class="l2">{nom}{marca} · {emp}</span><span class="l3">{cli}</span></div></a>')
    filas, filtradas = "".join(fila_t(r) for r in RESP), "".join(fila_t(r) for r in RESP if r[0] in FILTRADAS)
    esq = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span><span style="width: 66%;"></span></div>'
    chips = ('<div class="t-chips">' + "".join(f'<span class="pl-chip">{t}<button type="button" class="x" aria-label="Quitar {t}">{X}</button></span>'
                                               for t in ("Empresa: Delta S.A.", "Recibida: últimos 7 días", "Motivo: Venta nueva")) + '<button type="button" class="cb cb-enl">Limpiar todo</button></div>')

    def lista(cuerpo, con=False, sub="24 respuestas", arriba=""):
        return C.t_bar(FORMULARIO, sub, volver, der(con)) + arriba + f'<div class="ap-cuerpo">{cuerpo}</div>'
    ir = svg('<path d="m9 6 6 6-6 6"/>', 18, "2")
    pantalla_f = (C.t_bar("Filtros", FORMULARIO, "M-FRM-Respuestas.dc.html") + '<div class="ap-cuerpo"><div class="t-fl">'
                  + "".join(f'<span>{n}<span class="v{" on" if v != "Todas" else ""}">{v}{ir}</span></span>' for n, v in
                            [("Empresa", "Todas"), ("Recibida", "Últimos 7 días"), ("Cliente", "Todas"), ("¿Se concretó la venta?", "Todas"), ("Monto estimado", "Todas"),
                             ("Motivo", "Todas"), ("Fallas", "Todas"), ("Cargó", "Todas"), ("Versión del formulario", "Todas")])
                  + '</div></div><div class="t-pie"><button type="button" class="cb cb-sec">Limpiar todo</button><button type="button" class="cb cb-pri">Listo</button></div>')
    pantalla_m = (C.t_bar("Motivo", "Filtros", "M-FRM-Respuestas.dc.html") + '<div class="ap-cuerpo"><div class="t-fl">'
                  + "".join(f'<span class="op{" sel" if o == "Venta nueva" else ""}"><span class="tl">{CHECK if o == "Venta nueva" else ""}</span>{o}</span>' for o in F5_OPC["mot"])
                  + '</div></div><div class="t-pie"><button type="button" class="cb cb-pri">Listo</button></div>')
    cuerpo = {
        "Respuestas": lista(filas), "Filtros": pantalla_f, "Filtros: una pregunta": pantalla_m,
        "Con filtros": lista(filtradas, True, "4 de 24 respuestas", chips), "Más acciones": lista(filas), "Exportar": lista(filas), "Exportado": lista(filas),
        "Cargando": lista(esq, sub="Respuestas"),
        "Todavía no hay respuestas": C.t_bar(FORMULARIO, "Sin respuestas", volver) + '<div class="ap-cuerpo"><div class="ap-vacio">Todavía no llegaron respuestas.<a class="cb cb-sec" href="M-WA-Chats-Formulario.dc.html">Ir a los chats</a></div></div>',
        "Sin coincidencias": lista('<div class="ap-vacio">Ninguna respuesta coincide con los filtros.<button type="button" class="cb cb-sec">Limpiar todo</button></div>', True, "0 de 24 respuestas", chips),
        "No se pudo cargar": lista('<div class="ap-vacio">No pudimos cargar las respuestas.<button type="button" class="cb cb-sec">Reintentar</button></div>', sub=""),
        "Sin permiso": C.t_bar("Respuestas", "Gestión de formularios", volver) + '<div class="ap-cuerpo"><div class="ap-vacio">No tenés permiso para ver esta página.<a class="cb cb-sec" href="M-Inicio-Org.dc.html">Ir al inicio</a></div></div>',
    }
    menu = F.thoja(FORMULARIO, f'<div class="ap-acciones2"><span role="menuitem">{A.DESCARGAR} Exportar a Excel</span></div>', "")
    # 109 (v169): los datos del diálogo de la compu, sin la frase; el teléfono no tiene «Columnas», así que exporta todas las preguntas
    datos_ex = "".join(f'<span class="t-lin">{x}</span>' for x in ("24 respuestas", "0 filtros aplicados", "Todas las preguntas (13 columnas)"))
    hoja_ex = F.thoja("Exportar respuestas a Excel", f'<div style="display: flex; flex-direction: column; gap: 6px;">{datos_ex}</div><span class="ex-arch">{ARCHIVO} {ARCHIVO_XLSX}</span>',
                      '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Exportar a Excel</button>')
    capas = {"Más acciones": menu, "Exportar": hoja_ex,
             "Exportado": f'<div class="t-toast" role="status"><span class="ok">{F.OK}</span><span>Se descargó «{ARCHIVO_XLSX}».</span></div>'}
    return C.tel_pagina(cuerpo, ESTADOS_TPL5, capas, "Respuestas · teléfono", F.CSS_TFILTRO + P.CSS_TPL + CSS_T15 + CSS_T5 + CSS_T5_TEL)


def tel_respuesta5():
    def bar(num="VIS-000126", titulo=FORMULARIO, version=4):
        return C.t_bar(num, f"{titulo} · versión {version}", "M-FRM-Respuestas.dc.html")

    def nav(pos="5 de 24", primera=False):
        return (f'<div class="tr-nav"><span>{pos}</span><button type="button" class="ap-ib" aria-label="Respuesta anterior"{" disabled" if primera else ""}>{SUBE}</button>'
                f'<button type="button" class="ap-ib" aria-label="Respuesta siguiente">{BAJA}</button><a class="cb cb-sec" href="M-WA-Conversacion-Respuesta.dc.html">Abrir conversación</a></div>')

    def moms(act):
        dia = act[0][0][:10]
        return '<div class="tr-moms">' + "".join(f'<div class="m"><span><b>{"Mandada" if q == "Se la mandó" else "Recibida"}</b><small>{quien}</small></span><span class="h">{h if len(h) > 5 else dia + " " + h}</span></div>' for h, q, quien, _e in act) + "</div>"

    def grilla(valores):
        filas = "".join(f'<div class="f"><span class="k">{k}</span>' + (f"<span>{v}</span>" if v is not None else '<span class="vac">Sin respuesta</span>') + "</div>" for k, v in valores)
        return f'<div class="tr-gr">{filas}</div>'

    def sec(titulo, cuerpo, _resumen):
        """Sin plegar (163 y 164, traspaso 10): el título fijo y el contenido, siempre."""
        return f'<div class="tr-sec"><div class="h">{titulo}</div>{cuerpo}</div>'

    def act(filas):
        return '<div class="tr-act">' + "".join(f"<span><b>{q}</b><small>{quien}</small><small>{h} · {e}</small></span>" for h, q, quien, e in filas) + "</div>"

    def pantalla(num="VIS-000126", titulo=FORMULARIO, version=4, valores=VALORES_126, actv=ACT4_126, pos="5 de 24", primera=False):
        return bar(num, titulo, version) + nav(pos, primera) + ('<div class="tr-scroll">' + moms(actv) + sec("Respuesta", grilla(valores), "7 preguntas · 7 respondidas")
                                                                + sec("Actividad", act(actv), f"Recibida a las {actv[-1][0][-5:]}") + "</div>")
    esq = '<div class="ap-esq"><span style="width: 70%;"></span><span style="width: 90%;"></span><span style="width: 60%;"></span><span style="width: 84%;"></span></div>'
    act130 = [("15/10/2026 09:10", "Se la mandó", "Lucía Fernández, desde el chat", "Hecho"), ("16:20", "La respondió", "Paula Méndez, por WhatsApp", "Hecho")]
    act_r = [("15/10/2026 08:45", "Se la mandó", "Lucía Fernández, desde el chat", "Hecho"), ("10:12", "La respondió", "Tomás Acosta, por WhatsApp", "Hecho")]
    cuerpo = {
        "Respuesta": pantalla(),
        "La primera de la lista": pantalla("VIS-000130", valores=VALORES_130, actv=act130, pos="1 de 24", primera=True),
        "De una versión anterior": pantalla("VIS-000123", version=3, valores=VALORES_123, actv=ACT4_123, pos="8 de 24"),
        "Elegir varias y campos": pantalla("REP-000018", REPUESTO, 2, VALORES_R5, act_r, "1 de 18", True),
        "Cargando": bar() + nav() + esq,
        "No encontramos esa respuesta": C.t_bar("Respuesta", FORMULARIO, "M-FRM-Respuestas.dc.html") + '<div class="ap-cuerpo"><div class="ap-vacio">No encontramos esta respuesta.<a class="cb cb-sec" href="M-FRM-Respuestas.dc.html">Volver a las respuestas</a></div></div>',
    }
    return C.tel_pagina(cuerpo, ESTADOS_TR5, {}, "Respuesta · teléfono", P.CSS_TPL + CSS_T15 + CSS_T5_TEL)


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Respuesta-Completa": ("Formularios · una respuesta · pantalla completa", 1440, 1000), "FRM-Respuestas": ("Formularios · Respuestas · la planilla", 1440, 900)}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (titulo, w, h) in TITULOS.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def comprobar(n, t):
    html = t[:t.index('<script type="text/x-dc"')]
    html = re.sub(r'\s(?:title|aria-label)="[^"]*"', "", html)
    for prohibido in ("Fotos de la visita", "Remito firmado", "Por aprobar", "Aprobación", "Supervisor a cargo", "Cambios sin guardar", ">Corregir<", ">Cargar<", "Descargar ▾"):
        assert prohibido not in html, (n, prohibido)


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    tableros = {"FRM-Respuestas": respuestas5(), "FRM-Respuestas-Filtros": filtros5(), "FRM-Respuesta": detalle5(), "FRM-Respuesta-Completa": completa5(), "FRM-Respuestas-Exportar": exportar(),
                "M-FRM-Respuestas": tel_respuestas5(), "M-FRM-Respuesta": tel_respuesta5()}
    for n, t in tableros.items():
        t = L.sin_disenar(n, E.post(n, t, 1000 if n == "FRM-Respuesta-Completa" else None))
        comprobar(n, t)
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    if "--sin-canvas" not in sys.argv:  # para correrlo sobre el lienzo sin tocar canvas.json
        registrar()
    print("tableros", list(tableros))
