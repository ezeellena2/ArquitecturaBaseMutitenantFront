"""La etapa 15 redibujada con su texto para Diseño (docs/plans/formularios/15-texto-diseno.md del back): la planilla, «Más filtros», la vista
rápida, exportar y sus teléfonos, y `FRM-Respuesta-Completa`, nueva. Muestra solo lo que existe hasta la 15 (78): sin fotos, documentos,
aprobación, estado, PDF, corregir ni «Cargar». Lo general es «Visita a cliente»; «Elegir varias» y los campos sellados, «Pedir repuesto».

Toma las piezas de `formularios_ab_planilla_1004.py`, que queda como historia. Corre antes de `formularios_lista_y_ficha_1004.py`, que les
suma las pestañas y arma la lista y el tablero de la etapa.
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
    bus = (f'<span class="w-bus lleno">{F.BUSCAR} pallet</span>' if modo == "busqueda" else f'<span class="w-bus">{F.BUSCAR} Buscar en Observaciones</span>')
    h = bus + pil("Empresa", "Empresa: Delta S.A." if filtrado else "Empresa", emp_items, "a" if filtrado else "t", modo == "empresa")
    h += pil("Recibida", "Recibida: últimos 7 días" if filtrado else "Recibida", rec_items, "7" if filtrado else "t", False)
    if modo == "repuesto-filtro":
        h += pil("Fallas", "Fallas: alguna de 2", [], "a", False)
    h += (f'<a class="w-pil con" href="FRM-Respuestas-Filtros.dc.html">{FILTROS} Más filtros · 1</a>' if filtrado
          else f'<a class="w-pil" href="FRM-Respuestas-Filtros.dc.html">{FILTROS} Más filtros</a>')
    if filtrado or modo in ("busqueda", "repuesto-filtro"):
        h += '<button type="button" class="cb cb-enl">Limpiar filtros</button>'
    total = {"filtrado": "4 respuestas", "busqueda": "0 respuestas", "repuesto": "18 respuestas", "repuesto-columnas": "18 respuestas", "repuesto-filtro": "3 respuestas"}.get(modo, "24 respuestas")
    col_menu = menu_columnas(repuesto) if modo in ("columnas", "repuesto-columnas") else ""
    texto = "Columnas" if repuesto else "Columnas · 1 oculta"
    h += (f'<span class="pl-der"><span class="tot">{total}</span><span class="pl-env"><span class="w-pil" role="button" aria-haspopup="menu" aria-expanded="{"true" if col_menu else "false"}">'
          f'{texto} {CHEV}</span>{col_menu}</span></span>')
    return f'<div class="w-caja o-fb pl-fb">{h}</div>'


def banda(titulo=FORMULARIO, res="Respuestas · versión 4 publicada", ac=""):
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="FRM-Formularios.dc.html" aria-label="Volver a Formularios">{L.VOLVER}</a>'
            f'<div><h1>{titulo}</h1><p class="res">{res}</p></div></div><div class="ac">{ac}</div></div>')


EXPORTAR = '<a class="cb cb-sec" href="FRM-Respuestas-Exportar.dc.html">Exportar</a>'
EXPORTAR_OFF = '<button type="button" class="cb cb-sec" disabled title="Todavía no hay respuestas para exportar.">Exportar</button>'
CSS_15 = """.pl-marca { flex-shrink: 0; padding: 0 7px; border: 1px solid var(--borde2); border-radius: 999px; font-size: 12px; line-height: 18px; color: var(--t2); }
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


def mas_filtros(modo="normal"):
    elegidos, cont = modo in ("elegidos", "ninguna"), modo == "contando"

    def sec(titulo, cuerpo):
        return f'<div class="mf-s"><span class="t">{titulo}</span>{cuerpo}</div>'

    def ck(texto, n, on=False, extra=""):
        return P.ck(texto, n, on, extra, cont)
    motivo = sec("Motivo", ck("Seguimiento", 9) + ck("Venta nueva", 7 if elegidos else 11, on=elegidos) + ck("Reclamo", 4) + ck("Visita técnica", 2, extra=' <span class="baja">· dada de baja</span>'))
    # Una respuesta con dos opciones cuenta en las dos
    fallas = sec("Fallas", ck("Luz", 12) + ck("Frío", 8) + ck("Ruido", 8) + ck("Puerta", 5))
    venta = sec("¿Se concretó la venta?", ck("Sí", 12) + ck("No", 10) + ck("Sin respuesta", 0))
    monto = sec("Monto estimado", f'<div class="mf-rg"><span class="mf-in{" lleno" if elegidos else ""}">{"10.000" if elegidos else "Mínimo"}</span>a<span class="mf-in">Máximo</span></div>'
                + ck("Con respuesta", 19) + ck("Sin respuesta", 3) + ck("No existía en esa versión", 2))
    fecha = sec("Fecha de la visita", '<div class="mf-rg"><span class="mf-in">Desde</span>a<span class="mf-in">Hasta</span></div>')
    cliente = sec("Cliente", f'<div class="mf-txt"><span class="mf-in sel">contiene {CHEV}</span><span class="mf-in">Escribí un texto</span></div>')
    cargo = sec("Cargó", ck("Paula Méndez", 7) + ck("Tomás Acosta", 6) + ck("Florencia Fernández de la Fu…", 4) + ck("Lucía Fernández", 3) + ck("Martín Paz", 2) + ck("Marta Gil", 1) + ck("Persona sin información", 1))
    version = sec("Versión del formulario", ck("Versión 4", 12) + ck("Versión 3", 8) + ck("Versión 2", 4))
    if modo == "ninguna":
        boton = '<button type="button" class="cb cb-pri" disabled>Ninguna respuesta coincide</button>'
    elif cont:
        boton = trabaja("Contando…")
    else:
        boton = f'<a class="cb cb-pri" href="FRM-Respuestas.dc.html">Ver {"4" if elegidos else "24"} respuestas</a>'
    return (f'<div class="w-oscuro lado"><aside class="mf" role="dialog" aria-modal="true" aria-label="Más filtros"><div class="mf-h"><span>Más filtros</span>'
            f'<button type="button" class="ib" aria-label="Cerrar">{X}</button></div><div class="mf-b">{motivo}{fallas}{venta}{monto}{fecha}{cliente}{cargo}{version}</div>'
            f'<div class="mf-f"><button type="button" class="cb cb-enl">Limpiar filtros</button>{boton}</div></aside></div>')


def filtros_lado():
    capas = A.con_estados([("Más filtros", mas_filtros()), ("Con filtros elegidos", mas_filtros("elegidos")), ("Contando", mas_filtros("contando")),
                           ("Ninguna coincide", mas_filtros("ninguna").replace("10.000", "900.000"))])
    t = pagina("Respuestas · Más filtros", banda(ac=EXPORTAR), A.con_estados([(e, fondo()) for e in ESTADOS_MF]), ESTADOS_MF, css=P.CSS_MF)
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
CSS_DET = ".d-cmp { display: block; color: var(--t2); font-size: 13px; }\n"


def d2(num="VIS-000126", titulo=FORMULARIO, version=4, valores=VALORES_126, nombre="Tomás Acosta", hora="13/10/2026 15:30", primera=False, modo="normal"):
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)"{" disabled" if primera else ""}>{SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{BAJA}</button>'
           f'<a class="nv" href="FRM-Respuesta-Completa.dc.html" aria-label="Abrir en pantalla completa" title="Abrir en pantalla completa">{EXPANDIR}</a>')
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{X}</button>'
    if modo == "cargando":
        return (f'<aside class="d2" role="dialog" aria-label="Respuesta"><div class="d2-h"><b>{num}</b>{nav}{cerrar}</div>'
                '<div class="esq"><span style="width: 60%;"></span><span style="width: 85%;"></span><span style="width: 72%;"></span><span style="width: 90%;"></span><span style="width: 66%;"></span></div></aside>')
    if modo == "falta":
        return (f'<aside class="d2" role="dialog" aria-label="Respuesta"><div class="d2-h"><b></b>{cerrar}</div>'
                '<div class="d2-msj"><b>No encontramos esta respuesta.</b><a class="cb cb-sec" href="FRM-Respuestas.dc.html">Volver a la planilla</a></div></aside>')
    sub = f'<div class="d2-sub"><span>{titulo} · versión {version}</span><a class="cb cb-sec" href="WA-Chats-Respuesta.dc.html">Abrir conversación</a></div>'
    mom = (f'<div class="d2-mom"><span class="ck">{CHECK}</span><span class="t"><span><b>Recibida</b><span class="h">{hora}</span></span>'
           f'<small>{P.PERSONA} La respondió {nombre} por WhatsApp · se la mandó Lucía Fernández</small></span></div>')
    pest = '<div class="o-tabs" role="tablist"><span role="tab" class="on">Respuesta</span></div>'
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {num}"><div class="d2-h"><b>{num}</b>{nav}{cerrar}</div>{sub}{mom}{pest}'
            f'<div class="d2-b">{F.grilla(valores)}</div></aside>')


def detalle():
    capas = A.con_estados([
        ("Respuesta", d2()),
        ("La primera de la lista", d2("VIS-000130", valores=VALORES_130, nombre="Paula Méndez", hora="15/10/2026 16:20", primera=True)),
        ("De una versión anterior", d2("VIS-000123", version=3, valores=VALORES_123, hora="13/10/2026 11:04")),
        ("Elegir varias y campos", d2("REP-000018", REPUESTO, 2, VALORES_R, hora="15/10/2026 10:12", primera=True)),
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


def rc_seccion(titulo, cuerpo, resumen, abierta):
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


def dlg_exportar(modo="todas"):
    mucho, solo, corre, repuesto = modo == "mucho", modo == "solo", modo == "exportando", modo == "repuesto"
    n = "12.430" if mucho else "18" if repuesto else "4"
    chips = "" if mucho or repuesto else '<div class="ex-chips"><span class="ab-chip">Empresa: Delta S.A.</span><span class="ab-chip">Recibida: últimos 7 días</span><span class="ab-chip">Motivo: Venta nueva</span></div>'
    linea = f'<p class="d-tx">Se exportan las <b>{n} respuestas</b> de {REPUESTO if repuesto else FORMULARIO}{"" if mucho or repuesto else " que coinciden con los filtros"}.</p>' + chips

    def op(titulo, ayuda, on):
        return (f'<div class="k-op{" on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><span class="rd"></span><span class="tx"><b>{titulo}{F.info(ayuda)}</b></span></div>')
    ops = '<div class="k-ops">' + op("Todas las preguntas", "N°, recibida, quién la cargó, canal, empresas y las preguntas de todas las versiones, con todos los campos.", not solo) + op("Solo las columnas visibles", "Las 12 que se ven ahora en la planilla.", solo) + "</div>"
    aviso = ""
    if mucho:
        aviso = f'<div class="ex-av amb" role="alert">{P.TRI}<span>El máximo es 10.000 respuestas. Acotá los filtros de la planilla.</span></div>'
    elif modo == "otra":
        aviso = f'<div class="ex-av amb" role="alert">{P.TRI}<span>Ya tenés una exportación en curso. Esperá a que termine.</span></div>'
    elif modo == "error":
        aviso = f'<div class="ex-av mal" role="alert">{F.ALERTA}<span>No pudimos armar el archivo. Probá de nuevo.</span></div>'
    if corre:
        boton = trabaja("Exportando…")
    else:
        boton = f'<button type="button" class="cb cb-pri"{" disabled" if mucho or modo == "otra" else ""}>Exportar</button>'
    cancelar = f'<button type="button" class="cb cb-sec" disabled title="{MOTIVO_EXPORTANDO}">Cancelar</button>' if corre else '<button type="button" class="cb cb-sec">Cancelar</button>'
    pie = f'<div class="ex-pie"><span class="arch">{ARCHIVO} {ARCHIVO_R if repuesto else ARCHIVO_XLSX}</span>{cancelar}{boton}</div>'
    d = F.dialogo("Exportar a Excel", linea + '<span class="ex-tit">Columnas</span>' + ops + aviso, pie).replace('class="w-dlg"', 'class="w-dlg ex"', 1)
    if corre:
        d = d.replace('<button type="button" class="ib" aria-label="Cerrar">', f'<button type="button" class="ib" aria-label="Cerrar" disabled title="{MOTIVO_EXPORTANDO}">', 1)
    return d


def exportar():
    capas = A.con_estados([("Exportar", dlg_exportar()), ("Solo las columnas visibles", dlg_exportar("solo")), ("Más de 10.000", dlg_exportar("mucho")), ("Exportando", dlg_exportar("exportando")),
                           ("Exportado", A.toast(f"Se descargó «{ARCHIVO_XLSX}».")), ("Ya hay una exportación en curso", dlg_exportar("otra")), ("No se pudo exportar", dlg_exportar("error")), ("Elegir varias y campos", dlg_exportar("repuesto"))])
    cuerpo = A.con_estados([(e, fondo("repuesto" if e == "Elegir varias y campos" else "mucho" if e == "Más de 10.000" else "filtrado")) for e in ESTADOS_EX])
    bnd = A.con_estados([(e, banda(REPUESTO, "Respuestas · versión 2 publicada", EXPORTAR) if e == "Elegir varias y campos" else banda(ac=EXPORTAR)) for e in ESTADOS_EX])
    t = pagina("Respuestas · Exportar a Excel", bnd, cuerpo, ESTADOS_EX, css=C.CSS_K2 + P.CSS_EX)
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
                      '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Exportar</button>')
    capas = {"Filtros": F.thoja("Filtros", filtros_h, '<button type="button" class="cb cb-sec">Limpiar filtros</button><button type="button" class="cb cb-pri">Ver 24 respuestas</button>').replace('<div class="hb">', '<div class="hb lst">', 1),
             "Más acciones": menu, "Exportar": hoja_ex,
             "Exportado": f'<div class="t-toast" role="status"><span class="ok">{F.OK}</span><span>Se descargó «{ARCHIVO_XLSX}».</span></div>'}
    return C.tel_pagina(cuerpo, ESTADOS_TPL, capas, "Respuestas · teléfono", F.CSS_TFILTRO + P.CSS_TPL + CSS_T15)


# ================================================================ M-FRM-Respuesta: la pantalla completa en el teléfono, con sus dos secciones plegables
ESTADOS_TR = ["Respuesta", "Las dos plegadas", "La primera de la lista", "De una versión anterior", "Elegir varias y campos", "Cargando", "No encontramos esa respuesta"]


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
    tableros = {"FRM-Respuestas": respuestas(), "FRM-Respuestas-Filtros": filtros_lado(), "FRM-Respuesta": detalle(), "FRM-Respuesta-Completa": completa(), "FRM-Respuestas-Exportar": exportar(),
                "M-FRM-Respuestas": tel_respuestas(), "M-FRM-Respuesta": tel_respuesta()}
    for n, t in tableros.items():
        t = L.sin_disenar(n, E.post(n, t, 1000 if n == "FRM-Respuesta-Completa" else None))
        comprobar(n, t)
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    registrar()
    print("tableros", list(tableros))
