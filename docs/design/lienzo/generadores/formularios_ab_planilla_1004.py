"""Etapa 15 · Planilla, detalle y Excel con la disposición de ArquitecturaBase (T1, T2, T4, T5 y D2 del lienzo «Formularios por WhatsApp»).

Sigue a `formularios_ab_1004.py` (E12), `formularios_ab_catalogos_1004.py` (E13) y `formularios_ab_archivos_1004.py` (E14), con las mismas
piezas. Spec: `docs/plans/formularios/e15-planilla.md` del back. Donde la disposición de allá choca con una regla escrita del lienzo, manda la
nuestra: «Respuestas» es un grupo del panel como «Gestión de usuarios»; lo elegido va en el filtro («Empresa: Delta S.A.») y no en una fila
de chips; los atajos de ↑ ↓ y Esc van en el tooltip y no en una línea de ayuda; la aclaración de los archivos al exportar va en ⓘ.
Multitenant: «Empresa ▾» y la columna «Empresas», que se oculta desde «Columnas» (decisión 24). Solo lee: no hay estado ni aprobación (E16).

Tableros: FRM-Respuestas (planilla y casos), FRM-Respuestas-Filtros (Más filtros), FRM-Respuesta (D2), FRM-Respuestas-Exportar,
M-FRM-Respuestas y M-FRM-Respuesta. Además suma «Respuestas» al panel de los demás tableros de Formularios y a Más › Formularios del
teléfono. Corre después de `formularios_ab_archivos_1004.py` y antes de `criterio_decisiones.py`, `indices_1004.py` y `alineamiento_e9_app_1004.py`.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402

PROJ = F.PROJ
svg = F.svg
X, CHEV, INFO, ALERTA, OK = F.X, F.CHEV, F.INFO, F.ALERTA, F.OK
TILDE = A.TILDE
DESCARGAR = A.DESCARGAR
TABLA = svg('<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 10h16"/><path d="M10 10v9"/>', 18)
FILTROS = svg('<path d="M4 6.5h16"/><path d="M7 12h10"/><path d="M10 17.5h4"/>', 16)
CHAT = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/>', 14)
PERSONA = svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', 13)
SUBE = svg('<path d="m6 15 6-6 6 6"/>', 16, "2")
BAJA = svg('<path d="m6 9 6 6 6-6"/>', 16, "2")
ESCUDO = svg('<path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/>', 24)
ARCHIVO = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/>', 14)
CHECK = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 12, "3")
FLECHA = F.FLECHA
ABIERTO = re.search(r'<span class="w-ln grupo">(?:<svg.*?</svg>) WhatsApp <span class="fl">(<svg.*?</svg>)</span></span><div class="w-hijos">', F.ADMIN[F.ADMIN.index("</helmet>"):], re.S).group(1)
E15_APROBADA = True


# ---------------------------------------------------------------- El panel: «Respuestas» es un grupo, como «Gestión de usuarios»
FORMS_PUB = [("Visita a cliente", "FRM-Respuestas"), ("Entrega de pedido", "#"), ("Control de vehículo", "#")]
FORMS_MAS = [("Inspección de obra", "#"), ("Pedido de materiales", "#"), ("Reclamo de cliente", "#")]


def grupo_respuestas(abierto, muchos=False):
    if not abierto:
        return f'<a class="w-ln grupo" href="FRM-Respuestas.dc.html">{TABLA} Respuestas <span class="fl">{FLECHA}</span></a>'
    lista = FORMS_PUB + (FORMS_MAS if muchos else [])
    hijos = "".join(f'<a class="w-ln{" on" if k == 0 else ""}" href="{d if d == "#" else d + ".dc.html"}">{n}</a>' for k, (n, d) in enumerate(lista))
    if muchos:
        hijos += '<a class="w-ln ver" href="#">Ver todos (12)</a>'
    return f'<span class="w-ln grupo">{TABLA} Respuestas <span class="fl">{ABIERTO}</span></span><div class="w-hijos">{hijos}</div>'


def poner_panel(t, dinamico=True):
    """Reemplaza el panel de Formularios por el de la E15: «Respuestas» abierto (pocos o muchos formularios) y, sin el permiso, sin el grupo."""
    i = t.index('<aside class="w-panel" aria-label="Formularios">')
    j = t.index("</aside>", i)
    panel = t[i:j]
    k = panel.index('<nav class="w-nav">') + len('<nav class="w-nav">')
    panel = panel.replace('<a class="w-ln on" href="FRM-Listado.dc.html">', '<a class="w-ln" href="FRM-Listado.dc.html">')
    if dinamico:
        grupo = (f'<sc-if value="{{{{panelPocos}}}}" hint-placeholder-val="{{{{si}}}}">{grupo_respuestas(True)}</sc-if>'
                 f'<sc-if value="{{{{panelMuchos}}}}" hint-placeholder-val="{{{{no}}}}">{grupo_respuestas(True, True)}</sc-if>')
    else:
        grupo = grupo_respuestas(True)
    return t[:i] + panel[:k] + grupo + panel[k:] + t[j:]


CSS_PANEL = """.w-hijos { margin-left: 18px; padding-left: 10px; border-left: 1px solid oklch(0.82 0.03 75); display: flex; flex-direction: column; gap: 2px; margin-bottom: 4px; }
.w-hijos > .w-ln { position: relative; }
.w-ln.grupo { font-weight: 600; color: var(--t1); }
.w-hijos .w-ln.ver { color: var(--marca-tx); font-weight: 500; }
"""


# ---------------------------------------------------------------- Los datos: «Visita a cliente», 24 respuestas, la versión 4 trae fotos y remito
# columnas: clave, rótulo, ancho, clase
COLS = [("num", "N°", 112, ""), ("rec", "Recibida", 132, ""), ("quien", "Cargó", 180, ""), ("emp", "Empresas", 150, ""),
        ("cli", "Cliente", 160, ""), ("fec", "Fecha de la visita", 128, ""), ("ven", "¿Se concretó la venta?", 112, ""), ("mon", "Monto estimado", 120, "r"),
        ("mot", "Motivo", 120, ""), ("sup", "Supervisor a cargo", 150, ""), ("fot", "Fotos de la visita", 112, ""), ("rem", "Remito firmado", 112, ""),
        ("obs", "Observaciones", 230, ""), ("con", "Contacto en el local", 150, "")]
OCULTAS = {"fec"}
# n°, recibida, cargó, empresas, cliente, fecha, venta, monto, motivo, supervisor, fotos, remito, observaciones, versión, contacto
# None = «Sin respuesta»; "—" = la pregunta no existía en esa versión.
RESP = [
    ("VIS-000130", "15/10/2026 16:20", "Paula Méndez", "Delta S.A.", "Corralón El Puente", "15/10/2026", "No", None, "Seguimiento", "Martín Paz", 3, None,
     "Pidieron presupuesto para la ampliación.", 4, "—"),
    ("VIS-000129", "15/10/2026 11:47", "Florencia Fernández de la Fuente", "Delta Norte S.A.", "Obra Centro", "15/10/2026", "Sí", "48.000,00", "Venta nueva",
     "Paula Méndez", 1, 1, "Falta material en planta para la segunda etapa.", 4, "—"),
    ("VIS-000128", "14/10/2026 17:02", "Martín Paz", "Delta S.A., Delta Sur S.R.L.", "Distribuidora Norte", "14/10/2026", "Sí", "212.000,00", "Venta nueva",
     "Martín Paz", 4, 1, "Firmaron el pedido de noviembre.", 4, "—"),
    ("VIS-000127", "14/10/2026 09:30", "Tomás Acosta", "Delta S.A.", "Ferretería Sur", "14/10/2026", "No", "0,00", "Reclamo", "Martín Paz", 2, None,
     "Reclamo por demora en la entrega.", 4, "—"),
    ("VIS-000126", "13/10/2026 15:30", "Tomás Acosta", "Delta S.A.", "Ferretería Rosales", "13/10/2026", "Sí", "125.500,00", "Venta nueva", "Martín Paz", 2, 1,
     "Cerramos el pedido de octubre.", 4, "—"),
    ("VIS-000125", "13/10/2026 14:10", "Florencia Fernández de la Fuente", "Delta Norte S.A.", "Obra Centro", "13/10/2026", "No", None, "Seguimiento",
     "Paula Méndez", "—", "—", "Revisión del avance de obra.", 3, "—"),
    ("VIS-000124", "13/10/2026 12:20", "Paula Méndez", "Delta S.A.", "Corralón El Puente", "12/10/2026", "Sí", "96.300,00", "Venta nueva", "Martín Paz",
     "—", "—", None, 3, "—"),
    ("VIS-000123", "13/10/2026 11:04", "Tomás Acosta", "Delta S.A.", "Ferretería Rosales", "13/10/2026", "No", "0,00", "Seguimiento", None, "—", "—", None, 3, "—"),
    ("VIS-000122", "12/10/2026 17:40", "Martín Paz", "Delta S.A., Delta Sur S.R.L.", "Distribuidora Norte", "12/10/2026", "Sí", "54.200,00", "Venta nueva",
     "—", "—", "—", "Entrega parcial, falta un pallet.", 2, "Juan Ortiz"),
    ("VIS-000121", "12/10/2026 10:02", "Paula Méndez", "Delta S.A.", "Obra Centro", "11/10/2026", "No", "15.750,00", "Seguimiento", "—", "—", "—",
     "Visita de rutina.", 2, "Marta Gil"),
]
FILTRADAS = ["VIS-000128", "VIS-000126", "VIS-000124", "VIS-000122"]  # Empresa: Delta S.A. · Recibida: últimos 7 días · Motivo: Venta nueva
ARCHIVO_XLSX = "Visita a cliente-2026-10-15.xlsx"


def gris(t):
    return f'<span class="pl-g">{t}</span>'


def valor(v):
    if v is None:
        return gris("Sin respuesta")
    if v == "—":
        return gris("—")
    return v


def celda(clave, r, num):
    (n, rec, quien, emp, cli, fec, ven, mon, mot, sup, fot, rem, obs, ver, con) = r
    if clave == "num":
        return f'<span><a class="pl-num" href="FRM-Respuesta.dc.html">{num}</a></span>'
    if clave == "rec":
        return f"<span>{rec}</span>"
    if clave == "quien":
        return f'<span class="pl-quien" title="{quien}"><span class="ic" role="img" aria-label="Por WhatsApp">{CHAT}</span><span class="tx">{quien}</span></span>'
    if clave == "emp":
        return f'<span title="{emp}">{emp}</span>'
    if clave == "fot":
        if fot in (None, "—"):
            return f"<span>{valor(fot)}</span>"
        return f'<span class="pl-ft"><span class="r-th" role="img" aria-label="Primera foto"></span>{fot}</span>'
    if clave == "rem":
        if rem in (None, "—"):
            return f"<span>{valor(rem)}</span>"
        return f'<span class="pl-doc"><span class="pdf">PDF</span>{rem}</span>'
    v = {"cli": cli, "fec": fec, "ven": ven, "mon": mon, "mot": mot, "sup": sup, "obs": obs, "con": con}[clave]
    clase = ' class="r"' if clave == "mon" else ""
    return f"<span{clase}>{valor(v)}</span>"


def cols_visibles(ocultas=OCULTAS):
    return [c for c in COLS if c[0] not in ocultas]


def plantilla_cols(ocultas=OCULTAS):
    return " ".join(f"{w}px" for _, _, w, _ in cols_visibles(ocultas))


def fila(r, sel=False, num=None, ocultas=OCULTAS):
    return (f'<div class="w-tr pl{" sel" if sel else ""}">' + "".join(celda(k, r, num or r[0]) for k, *_ in cols_visibles(ocultas)) + "</div>")


def tabla(filas=None, sel=None, total=24, mucho=False, cuerpo=None):
    """La planilla: cabecera, filas y pie. `cuerpo` reemplaza las filas (cargando, vacía, error)."""
    cab = '<div class="w-th pl">' + "".join(f'<span{" class=" + chr(34) + "r" + chr(34) if c == "r" else ""}>{t}</span>' for _, t, _, c in cols_visibles()) + "</div>"
    if cuerpo is not None:
        return f'<div class="w-caja pl-caja"><div class="pl-scroll">{cab}</div>{cuerpo}</div>'
    lista = [r for r in RESP if filas is None or r[0] in filas]
    filas_h = "".join(fila(r, sel=(r[0] == sel), num=(f"VIS-0{12430 - k:05d}" if mucho else None)) for k, r in enumerate(lista))
    if mucho:
        pie = '<div class="w-pie"><span>1–10 de 12.430</span><span>10 por página · Página 1 de 1.243</span></div>'
    elif total == 24:
        pie = '<div class="w-pie"><span>1–10 de 24</span><span>10 por página · Página 1 de 3</span></div>'
    else:
        pie = f'<div class="w-pie"><span>1–{total} de {total}</span><span>10 por página · Página 1 de 1</span></div>'
    return f'<div class="w-caja pl-caja"><div class="pl-scroll">{cab}{filas_h}</div>{pie}</div>'


ESQ = ('<div class="f-cuerpo izq"><div class="esq"><span style="width: 92%;"></span><span style="width: 78%;"></span><span style="width: 86%;"></span>'
       '<span style="width: 70%;"></span><span style="width: 82%;"></span></div></div>')


def menu_columnas():
    def ck(t, on=True, fija=False):
        return f'<span class="mf-ck{" on" if on else ""}{" fija" if fija else ""}" role="menuitemcheckbox" aria-checked="{"true" if on else "false"}"><span class="bx">{CHECK if on else ""}</span>{t}</span>'
    fijas = ck("N°", fija=True) + "".join(ck(t) for k, t, _, _ in COLS[1:4])
    preg = "".join(ck(t, k not in OCULTAS) for k, t, _, _ in COLS[4:13])
    return ('<div class="pl-colmn" role="menu" aria-label="Columnas"><div class="g">De la respuesta</div>' + fijas
            + '<div class="g">Preguntas</div>' + preg + '<div class="g">Retiradas</div>' + ck("Contacto en el local")
            + '<div class="pie"><button type="button" class="cb cb-enl">Mostrar todas</button></div></div>')


def barra(modo="normal"):
    """La caja de filtros. modo: normal, columnas, empresa, filtrado, busqueda."""
    emp_items = [("t", "Todas las empresas", "24"), ("a", "Delta S.A.", "17"), ("s", "Delta Sur S.R.L.", "4"), ("n", "Delta Norte S.A.", "6"), ("x", "Sin empresa", "1")]
    rec_items = [("t", "Todas las fechas", ""), ("h", "Hoy", "2"), ("7", "Últimos 7 días", "14"), ("m", "Octubre 2026", "24"), ("e", "Elegir fechas…", "")]
    filtrado = modo == "filtrado"

    def pil(nombre, texto, items, elegido, abierto):
        menu = ""
        if abierto:
            menu = (f'<span class="f-mn" role="listbox" aria-label="Filtrar por {nombre.lower()}">'
                    + "".join(f'<span role="option" class="{"on" if k == elegido else ""}">{n}<span class="cnt">{c}</span></span>' for k, n, c in items) + "</span>")
        clase = " con" if elegido != "t" else ""
        return f'<span class="f-env"><span class="w-pil{clase}" role="button" aria-haspopup="listbox">{texto} {CHEV}</span>{menu}</span>'
    bus = (f'<span class="w-bus lleno">{F.BUSCAR} pallet</span>' if modo == "busqueda" else f'<span class="w-bus">{F.BUSCAR} Buscar en Observaciones</span>')
    h = (bus + pil("Empresa", "Empresa: Delta S.A." if filtrado else "Empresa", emp_items, "a" if filtrado else "t", modo == "empresa")
         + pil("Recibida", "Recibida: últimos 7 días" if filtrado else "Recibida", rec_items, "7" if filtrado else "t", False)
         + (f'<a class="w-pil con" href="FRM-Respuestas-Filtros.dc.html">{FILTROS} Más filtros · 1</a>' if filtrado
            else f'<a class="w-pil" href="FRM-Respuestas-Filtros.dc.html">{FILTROS} Más filtros</a>'))
    if filtrado or modo == "busqueda":
        h += '<button type="button" class="cb cb-enl">Limpiar filtros</button>'
    total = {"filtrado": "4 respuestas", "busqueda": "0 respuestas"}.get(modo, "24 respuestas")
    col_menu = menu_columnas() if modo == "columnas" else ""
    h += (f'<span class="pl-der"><span class="tot">{total}</span><span class="pl-env"><span class="w-pil" role="button" aria-haspopup="menu" aria-expanded="{"true" if col_menu else "false"}">'
          f'Columnas · 1 oculta {CHEV}</span>{col_menu}</span></span>')
    return f'<div class="w-caja o-fb pl-fb">{h}</div>'


def banda_pl(exportar=True, apagado=False, titulo="Visita a cliente", sub="Respuestas · versión 4 publicada"):
    acc = ""
    if exportar:
        dis = ' disabled title="No hay respuestas para exportar"' if apagado else ""
        acc = f'<a class="cb cb-sec" href="FRM-Respuestas-Exportar.dc.html"{dis}>{DESCARGAR} Exportar</a>'
    return F.banda(titulo, sub, acc).replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{TABLA}</span>', 1)


CSS_PL = """.pl-fb { flex-wrap: wrap; row-gap: 8px; }
.pl-fb .w-bus { width: 240px; flex: none; }
.pl-fb .w-pil { white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
.pl-fb .pl-der { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; }
.pl-fb .tot { font-size: 13px; color: var(--t3); white-space: nowrap; }
.f-mn .cnt:empty { display: none; }
.pl-caja { padding: 0; position: relative; }
.pl-caja::after { content: ""; position: absolute; top: 0; right: 0; bottom: 49px; width: 32px; pointer-events: none; background: linear-gradient(90deg, transparent, oklch(0.3 0.014 78 / 0.08)); }
.pl-scroll { overflow-x: auto; overflow-y: hidden; }
.w-th.pl, .w-tr.pl { grid-template-columns: var(--pl-cols); width: max-content; min-width: 100%; box-sizing: border-box; padding: 0 16px; }
.w-tr.pl { min-height: 44px; cursor: pointer; }
.w-tr.pl:nth-child(even) { background: #fff; }
.w-th.pl > :first-child, .w-tr.pl > :first-child { position: sticky; left: 0; z-index: 1; background: inherit; margin-left: -16px; padding-left: 16px; box-shadow: 1px 0 0 var(--borde); }
.w-th.pl > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-th.pl .r, .w-tr.pl .r { text-align: right; font-variant-numeric: tabular-nums; }
.w-tr.pl.sel { background: var(--marca-t) !important; box-shadow: inset 3px 0 0 var(--marca); }
.pl-num { color: var(--t1); font-weight: 600; font-variant-numeric: tabular-nums; text-decoration: none; }
.pl-g { color: var(--t3); }
.pl-quien { display: inline-flex !important; align-items: center; gap: 6px; max-width: 100%; }
.pl-quien .ic { display: inline-flex; color: var(--t3); flex-shrink: 0; }
.pl-quien .tx { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-ft { display: inline-flex !important; align-items: center; gap: 6px; }
.pl-ft .r-th { width: 26px; height: 26px; border-radius: 5px; }
.pl-doc { display: inline-flex !important; align-items: center; gap: 6px; }
.pl-doc .pdf { width: 18px; height: 22px; border-radius: 3px; background: oklch(0.55 0.18 25); color: #fff; font-size: 7px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.pl-env { position: relative; display: inline-flex; }
.pl-colmn { position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; width: 290px; max-height: 680px; overflow: auto; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 6px; display: flex; flex-direction: column; }
.pl-colmn .g { padding: 8px 10px 4px; font-size: 12.5px; font-weight: 600; color: var(--t3); }
.pl-colmn .mf-ck { padding: 4px 10px; border-radius: 6px; }
.pl-colmn .mf-ck.fija { color: var(--t3); }
.pl-colmn .mf-ck.fija .bx { background: var(--s3); border-color: var(--borde2); color: var(--t3); }
.pl-colmn .pie { border-top: 1px solid var(--borde); margin-top: 6px; padding: 6px 4px 2px; }
.mf-ck { display: flex; align-items: center; gap: 10px; font-size: 13.5px; min-height: 28px; color: var(--t1); }
.mf-ck .bx { width: 16px; height: 16px; border: 1.5px solid var(--borde2); border-radius: 4px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: #fff; box-sizing: border-box; }
.mf-ck.on .bx { background: var(--marca); border-color: var(--marca); color: #fff; }
.mf-ck .n { margin-left: auto; font-size: 12.5px; color: var(--t3); font-variant-numeric: tabular-nums; }
.mf-ck .baja { font-size: 12px; color: var(--t3); }
.pl-vacio { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 56px 16px; text-align: center; color: var(--t2); }
.pl-vacio .ic { color: var(--t3); display: inline-flex; }
.pl-vacio b { color: var(--t1); font-size: 15px; }
.pl-pagina { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; color: var(--t1); }
.pl-pagina .ic { width: 52px; height: 52px; border-radius: 14px; background: var(--s2); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.pl-pagina b { font-size: 18px; font-weight: 600; }
"""


def css_cols(ocultas=OCULTAS):
    return f".w-app {{ --pl-cols: {plantilla_cols(ocultas)}; }}\n"


def pagina_pl(nombre, banda, cuerpo, estados, js, css="", alto=900, dinamico=True):
    t = A.pagina_ab(nombre, "Inicio / Formularios / Respuestas / Visita a cliente", banda, cuerpo,
                    css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + A.CSS_ARCH + CSS_PANEL + CSS_PL + css_cols() + css
                    + (f".w-app {{ height: {alto}px !important; }}\n" if alto != 900 else ""),
                    estados=("estado", estados), js=js)
    if alto != 900:
        t = t.replace('"$preview":{"width":1440,"height":900}', f'"$preview":{{"width":1440,"height":{alto}}}', 1)
    return poner_panel(t, dinamico)


def planilla_fondo(modo="normal", sel=None):
    """La planilla de fondo de los tableros con panel, diálogo o detalle encima."""
    if modo == "filtrado":
        return '<div class="w-body">' + barra("filtrado") + tabla(FILTRADAS, total=4, sel=sel) + "</div>"
    if modo == "mucho":
        return '<div class="w-body">' + barra("normal").replace("24 respuestas", "12.430 respuestas") + tabla(mucho=True) + "</div>"
    return '<div class="w-body">' + barra("normal") + tabla(sel=sel) + "</div>"


# ---------------------------------------------------------------- T1 + T4 · FRM-Respuestas: la planilla y sus casos
ESTADOS_PL = ["Planilla", "Columnas", "Empresa: menú", "Con filtros", "Cargando", "Todavía no hay respuestas", "Sin coincidencias",
              "No se pudo cargar", "No se pudo actualizar", "Sin permiso", "Muchos formularios", "Sin permiso para exportar"]


def respuestas():
    E = ESTADOS_PL
    def cuerpo(*partes):
        return '<div class="w-body">' + "".join(partes) + "</div>"
    vacia = tabla(cuerpo=(f'<div class="pl-vacio"><span class="ic">{TABLA}</span><b>Todavía no llegaron respuestas.</b>'
                          '<a class="cb cb-sec" href="WA-Chats-Formulario.dc.html">Ir a los chats</a></div>'))
    sin_c = tabla(cuerpo='<div class="pl-vacio"><b>Ninguna respuesta coincide con los filtros.</b><button type="button" class="cb cb-enl">Limpiar filtros</button></div>')
    error = tabla(cuerpo='<div class="pl-vacio"><b>No pudimos cargar las respuestas.</b><button type="button" class="cb cb-sec">Reintentar</button></div>')
    sin_permiso = (f'<div class="w-body"><div class="pl-pagina"><span class="ic">{ESCUDO}</span><b>No tenés permiso para ver esta página.</b>'
                   '<a class="cb cb-sec" href="Inicio-Org.dc.html">Ir al inicio</a></div></div>')
    variantes = [
        ("Planilla", cuerpo(barra(), tabla())),
        ("Columnas", cuerpo(barra("columnas"), tabla())),
        ("Empresa: menú", cuerpo(barra("empresa"), tabla())),
        ("Con filtros", cuerpo(barra("filtrado"), tabla(FILTRADAS, total=4))),
        ("Cargando", cuerpo(barra(), tabla(cuerpo=ESQ))),
        ("Todavía no hay respuestas", cuerpo(vacia)),
        ("Sin coincidencias", cuerpo(barra("busqueda"), sin_c)),
        ("No se pudo cargar", cuerpo(barra(), error)),
        ("No se pudo actualizar", cuerpo(barra("filtrado"), tabla(FILTRADAS, total=4))
         + A.toast("No pudimos actualizar las respuestas. Siguen las de antes.", "mal", '<button type="button" class="cb cb-enl">Reintentar</button>')),
        ("Sin permiso", sin_permiso),
        ("Muchos formularios", cuerpo(barra(), tabla())),
        ("Sin permiso para exportar", cuerpo(barra(), tabla())),
    ]
    banda = ('<sc-if value="{{conBanda}}" hint-placeholder-val="{{si}}">'
             '<sc-if value="{{conExportar}}" hint-placeholder-val="{{si}}">' + banda_pl() + "</sc-if>"
             '<sc-if value="{{exportarApagado}}" hint-placeholder-val="{{no}}">' + banda_pl(apagado=True, sub="Respuestas · versión 4 publicada · sin respuestas") + "</sc-if>"
             '<sc-if value="{{sinExportar}}" hint-placeholder-val="{{no}}">' + banda_pl(exportar=False) + "</sc-if></sc-if>")
    extra = ("      conBanda: e !== 'Sin permiso', conExportar: !['Sin permiso', 'Todavía no hay respuestas', 'Sin permiso para exportar'].includes(e),\n"
             "      exportarApagado: e === 'Todavía no hay respuestas', sinExportar: e === 'Sin permiso para exportar',\n"
             "      panelPocos: !['Muchos formularios', 'Sin permiso'].includes(e), panelMuchos: e === 'Muchos formularios',\n")
    t = pagina_pl("Respuestas · /org/formularios/:id/respuestas", banda, A.con_estados(variantes), E, A.js_estados(E, extra))
    return t


# ---------------------------------------------------------------- T2 · FRM-Respuestas-Filtros: Más filtros, en un panel al costado
ESTADOS_MF = ["Más filtros", "Con filtros elegidos", "Contando", "Ninguna coincide"]
CSS_MF = """.w-oscuro.lado { justify-content: flex-end; align-items: stretch; }
.mf { width: 460px; background: #fff; display: flex; flex-direction: column; box-shadow: -16px 0 32px oklch(0.2 0.014 78 / 0.2); }
.mf-h { display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: 0 12px 0 20px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 15px; font-weight: 600; }
.mf-b { flex: 1; min-height: 0; overflow: auto; }
.mf-s { padding: 14px 20px; border-bottom: 1px solid var(--borde); display: flex; flex-direction: column; gap: 6px; }
.mf-s .t { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.mf-s .t small { font-weight: 400; color: var(--t3); font-size: 12.5px; margin-left: 6px; }
.mf-rg { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; font-size: 13px; color: var(--t3); }
.mf-in { height: 34px; border: 1px solid var(--borde2); border-radius: 8px; padding: 0 10px; display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--t3); background: #fff; box-sizing: border-box; }
.mf-in.lleno { color: var(--t1); }
.mf-in.sel { justify-content: space-between; color: var(--t1); }
.mf-txt { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 8px; }
.mf-ver { color: var(--marca-tx); font-size: 13px; font-weight: 500; }
.mf-f { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid var(--borde); }
.mf-f .cb[disabled] { opacity: 0.55; cursor: default; }
.mf .esq-n { width: 18px; height: 10px; border-radius: 5px; background: oklch(0.93 0.01 78); margin-left: auto; }
"""


def ck(texto, n, on=False, extra="", contando=False):
    num = '<span class="esq-n"></span>' if contando else f'<span class="n">{n}</span>'
    return (f'<span class="mf-ck{" on" if on else ""}" role="checkbox" aria-checked="{"true" if on else "false"}"><span class="bx">{CHECK if on else ""}</span>'
            f'{texto}{extra}{num}</span>')


def mas_filtros(modo="normal"):
    elegidos = modo in ("elegidos", "ninguna")
    cont = modo == "contando"
    def sec(titulo, tipo, cuerpo):
        return f'<div class="mf-s"><span class="t">{titulo}<small>{tipo}</small></span>{cuerpo}</div>'
    motivo = sec("Motivo", "Lista", ck("Seguimiento", 9, contando=cont) + ck("Venta nueva", 11 if not elegidos else 7, on=elegidos, contando=cont)
                 + ck("Reclamo", 4, contando=cont) + ck("Visita técnica", 2, extra=' <span class="baja">· dada de baja</span>', contando=cont))
    sup = sec("Supervisor a cargo", "Catálogo · Supervisores",
              f'<span class="mf-in">{F.BUSCAR} Buscar en Supervisores</span>' + ck("Martín Paz", 9, contando=cont) + ck("Paula Méndez", 6, contando=cont)
              + ck("Florencia Fernández de la Fu…", 3, contando=cont) + '<a class="mf-ver" href="#">Ver los 7</a>')
    venta = sec("¿Se concretó la venta?", "Sí o no", ck("Sí", 12, contando=cont) + ck("No", 10, contando=cont) + ck("Sin respuesta", 0, contando=cont))
    monto_min = "10.000" if elegidos else "Mínimo"
    monto = sec("Monto estimado", "Número con decimales",
                f'<div class="mf-rg"><span class="mf-in{" lleno" if elegidos else ""}">{monto_min}</span>a<span class="mf-in">Máximo</span></div>'
                + ck("Con respuesta", 19, contando=cont) + ck("Sin respuesta", 3, contando=cont) + ck("No existía en esa versión", 2, contando=cont))
    fecha = sec("Fecha de la visita", "Fecha", '<div class="mf-rg"><span class="mf-in">Desde</span>a<span class="mf-in">Hasta</span></div>')
    cliente = sec("Cliente", "Texto corto", f'<div class="mf-txt"><span class="mf-in sel">contiene {CHEV}</span><span class="mf-in">Escribí un texto</span></div>')
    fotos = sec("Fotos de la visita", "Foto", ck("Con fotos", 12, contando=cont) + ck("No existía en esa versión", 12, contando=cont))
    cargo = sec("Cargó", "Persona", ck("Tomás Acosta", 9, contando=cont) + ck("Paula Méndez", 7, contando=cont)
                + ck("Florencia Fernández de la Fu…", 5, contando=cont) + ck("Martín Paz", 3, contando=cont))
    version = sec("Versión del formulario", "", ck("Versión 4", 12, contando=cont) + ck("Versión 3", 8, contando=cont) + ck("Versión 2", 4, contando=cont))
    if modo == "ninguna":
        boton = '<button type="button" class="cb cb-pri" disabled>Ninguna respuesta coincide</button>'
    elif cont:
        boton = '<button type="button" class="cb cb-pri" disabled>Contando…</button>'
    else:
        boton = f'<a class="cb cb-pri" href="FRM-Respuestas.dc.html">Ver {"4" if elegidos else "24"} respuestas</a>'
    cuerpo = motivo + sup + venta + monto + fecha + cliente + fotos + cargo + version
    return (f'<div class="w-oscuro lado"><aside class="mf" role="dialog" aria-modal="true" aria-label="Más filtros">'
            f'<div class="mf-h"><span>Más filtros</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
            f'<div class="mf-b">{cuerpo}</div><div class="mf-f"><button type="button" class="cb cb-enl">Limpiar filtros</button>{boton}</div></aside></div>')


def filtros_lado():
    E = ESTADOS_MF
    capas = A.con_estados([("Más filtros", mas_filtros()), ("Con filtros elegidos", mas_filtros("elegidos")), ("Contando", mas_filtros("contando")),
                           ("Ninguna coincide", mas_filtros("ninguna").replace("10.000", "900.000"))])
    t = pagina_pl("Respuestas · Más filtros", banda_pl(), planilla_fondo(), E, A.js_estados(E, "      panelPocos: true, panelMuchos: false,\n"), css=CSS_MF)
    return F.con_dialogo(t, capas)


# ---------------------------------------------------------------- D2 · FRM-Respuesta: la respuesta al costado de la planilla
ESTADOS_D2 = ["Respuesta", "Fotos", "Ver una foto", "La primera de la lista", "De una versión anterior", "Cargando", "No encontramos esa respuesta"]
CSS_D2 = """.d2 { position: absolute; top: 52px; right: 0; bottom: 0; width: 560px; z-index: 6; background: #fff; border-left: 1px solid var(--borde); box-shadow: -16px 0 32px oklch(0.24 0.014 78 / 0.12); display: flex; flex-direction: column; }
.d2-h { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 0 12px 0 20px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); }
.d2-h b { flex: 1; font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
.d2-h .nv { width: 32px; height: 32px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: inline-flex; align-items: center; justify-content: center; color: var(--t1); }
.d2-h .nv[disabled] { opacity: 0.4; cursor: default; }
.d2-sub { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 20px 0; font-size: 13.5px; color: var(--t2); }
.d2-sub .cb { height: 32px; font-size: 13px; text-decoration: none; }
.d2-mom { margin: 12px 20px 0; border: 1px solid var(--borde); border-radius: 10px; display: flex; gap: 10px; padding: 10px 12px; align-items: flex-start; }
.d2-mom .ck { width: 20px; height: 20px; border-radius: 5px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.d2-mom .t { display: flex; flex-direction: column; gap: 3px; font-size: 13.5px; }
.d2-mom .t b { font-weight: 600; } .d2-mom .t .h { color: var(--t3); margin-left: 6px; font-weight: 400; }
.d2-mom .t small { font-size: 12.5px; color: var(--t3); display: inline-flex; align-items: center; gap: 4px; }
.d2 .o-tabs { margin: 12px 20px 0; }
.d2-b { flex: 1; min-height: 0; overflow: auto; padding: 14px 20px 20px; }
.d2 .g-det { grid-template-columns: 160px minmax(0, 1fr); }
.d2 .g-det .r-th { cursor: zoom-in; }
.d2-fotos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.d2-fotos .f { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.d2-fotos .f .r-th { width: 100%; height: 160px; border-radius: 8px; cursor: zoom-in; }
.d2-fotos .f small { color: var(--t3); font-size: 12px; }
.d2-msj { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; padding: 24px; }
.d2-msj b { font-size: 15px; }
.d2 .esq { padding: 18px 20px; }
"""
VALORES_126 = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "125.500,00"),
               ("Motivo", "Venta nueva"), ("Supervisor a cargo", "Martín Paz"), ("Fotos de la visita", A.thumbs(2)), ("Remito firmado", A.doc_chip()),
               ("Observaciones", "Cerramos el pedido de octubre.")]
VALORES_130 = [("Cliente", "Corralón El Puente"), ("Fecha de la visita", "15/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", None),
               ("Motivo", "Seguimiento"), ("Supervisor a cargo", "Martín Paz"), ("Fotos de la visita", A.thumbs(3)), ("Remito firmado", None),
               ("Observaciones", "Pidieron presupuesto para la ampliación.")]
VALORES_123 = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", "0,00"),
               ("Motivo", "Seguimiento"), ("Supervisor a cargo", None), ("Observaciones", None)]


def d2(num="VIS-000126", version=4, valores=VALORES_126, quien="Tomás Acosta", hora="13/10/2026 15:30", fotos=2, primera=False, tab="Respuesta", modo="normal"):
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)"{" disabled" if primera else ""}>{SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{BAJA}</button>')
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{X}</button>'
    if modo == "cargando":
        return (f'<aside class="d2" role="dialog" aria-label="Respuesta"><div class="d2-h"><b>{num}</b>{nav}{cerrar}</div>'
                '<div class="esq"><span style="width: 60%;"></span><span style="width: 85%;"></span><span style="width: 72%;"></span><span style="width: 90%;"></span>'
                '<span style="width: 66%;"></span></div></aside>')
    if modo == "falta":
        return (f'<aside class="d2" role="dialog" aria-label="Respuesta"><div class="d2-h"><b></b>{cerrar}</div>'
                '<div class="d2-msj"><b>No encontramos esta respuesta.</b><a class="cb cb-sec" href="FRM-Respuestas.dc.html">Volver a la planilla</a></div></aside>')
    sub = (f'<div class="d2-sub"><span>Visita a cliente · versión {version}</span>'
           f'<a class="cb cb-sec" href="WA-Chats-Respuesta.dc.html">{CHAT} Abrir conversación</a></div>')
    mom = (f'<div class="d2-mom"><span class="ck">{CHECK}</span><span class="t"><span><b>Recibida</b><span class="h">{hora}</span></span>'
           f'<small>{PERSONA} La respondió {quien} por WhatsApp · se la mandó Lucía Fernández</small></span></div>')
    pest = '<div class="o-tabs" role="tablist"><span role="tab" class="{}">Respuesta</span>'.format("on" if tab == "Respuesta" else "")
    if fotos:
        pest += '<span role="tab" class="{}">Fotos <span class="c">{}</span></span>'.format("on" if tab == "Fotos" else "", fotos)
    pest += "</div>"
    if tab == "Fotos":
        nombres = [("frente-local.jpg", "3,4 MB"), ("gondola.jpg", "2,9 MB")]
        cuerpo = '<div class="d2-fotos">' + "".join(f'<span class="f"><span class="r-th{" b" if k else ""}" role="img" aria-label="Foto {k + 1}"></span>'
                                                    f'<span>{n}<small> · {p}</small></span></span>' for k, (n, p) in enumerate(nombres)) + "</div>"
    else:
        cuerpo = F.grilla(valores)
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {num}"><div class="d2-h"><b>{num}</b>{nav}{cerrar}</div>'
            f'{sub}{mom}{pest}<div class="d2-b">{cuerpo}</div></aside>')


def detalle():
    E = ESTADOS_D2
    visor = A.dlg_visor(0).replace('class="w-oscuro"', 'class="w-oscuro" style="z-index: 8;"', 1)
    capas = A.con_estados([
        ("Respuesta", d2()),
        ("Fotos", d2(tab="Fotos")),
        ("Ver una foto", d2() + visor),
        ("La primera de la lista", d2("VIS-000130", 4, VALORES_130, "Paula Méndez", "15/10/2026 16:20", 3, primera=True)),
        ("De una versión anterior", d2("VIS-000123", 3, VALORES_123, "Tomás Acosta", "13/10/2026 11:04", 0)),
        ("Cargando", d2(modo="cargando")),
        ("No encontramos esa respuesta", d2(modo="falta")),
    ])
    fondo = A.con_estados([(e, planilla_fondo(sel={"La primera de la lista": "VIS-000130", "De una versión anterior": "VIS-000123",
                                                    "No encontramos esa respuesta": None}.get(e, "VIS-000126"))) for e in E])
    t = pagina_pl("Respuesta · /org/formularios/:id/respuestas?respuesta=VIS-000126", banda_pl(), fondo, E,
                  A.js_estados(E, "      panelPocos: true, panelMuchos: false,\n"), css=F.CSS_GRILLA + A.CSS_VISOR + CSS_D2)
    k = t.rindex("</div>\n</x-dc>")
    return t[:k] + capas + t[k:]


# ---------------------------------------------------------------- T5 · FRM-Respuestas-Exportar: el diálogo de exportar
ESTADOS_EX = ["Exportar", "Solo las columnas visibles", "Más de 10.000", "Exportando", "Exportado", "Ya hay una exportación en curso", "No se pudo exportar"]
CSS_EX = """.w-dlg.ex { width: 600px; }
.ex-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ex-tit { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--t2); }
.ex-pie { display: flex; align-items: center; gap: 10px; width: 100%; }
.ex-pie .arch { margin-right: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--t2); }
.ex-av { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 13px; line-height: 1.45; }
.ex-av.amb { background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.ex-av.mal { background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.ex-av svg { flex-shrink: 0; margin-top: 1px; }
.w-dlg.ex .db { display: flex; flex-direction: column; gap: 14px; }
.w-dlg.ex .df .cb[disabled] { opacity: 0.55; cursor: default; }
.gira { width: 14px; height: 14px; border-radius: 50%; border: 2px solid oklch(1 0 0 / 0.45); border-top-color: #fff; display: inline-block; }
"""
TRI = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" '
       'aria-hidden="true"><path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>')


def dlg_exportar(modo="todas"):
    mucho = modo == "mucho"
    n = "12.430" if mucho else "4"
    chips = "" if mucho else ('<div class="ex-chips"><span class="ab-chip">Empresa: Delta S.A.</span><span class="ab-chip">Recibida: últimos 7 días</span>'
                              '<span class="ab-chip">Motivo: Venta nueva</span></div>')
    linea = (f'<p class="d-tx">Se exportan las <b>{n} respuestas</b> de Visita a cliente{"" if mucho else " que coinciden con los filtros"}.</p>' + chips)
    solo = modo == "solo"
    ops = (f'<div class="k-ops"><div class="k-op{"" if solo else " on"}" role="radio" aria-checked="{"false" if solo else "true"}"><span class="rd"></span>'
           '<span class="tx"><b>Todas las preguntas</b><span>N°, recibida, quién la cargó, empresas y las preguntas de todas las versiones.</span></span></div>'
           f'<div class="k-op{" on" if solo else ""}" role="radio" aria-checked="{"true" if solo else "false"}"><span class="rd"></span>'
           '<span class="tx"><b>Solo las columnas visibles</b><span>Las 13 que se ven ahora en la planilla.</span></span></div></div>')
    cols = (f'<span class="ex-tit">Columnas {F.info("Las fotos y los documentos no van dentro del Excel: cada celda dice cuántos hay y sus nombres.")}</span>' + ops)
    aviso = ""
    if mucho:
        aviso = f'<div class="ex-av amb" role="alert">{TRI}<span>El máximo es 10.000 respuestas. Acotá los filtros de la planilla.</span></div>'
    elif modo == "otra":
        aviso = f'<div class="ex-av amb" role="alert">{TRI}<span>Ya tenés una exportación en curso. Esperá a que termine.</span></div>'
    elif modo == "error":
        aviso = f'<div class="ex-av mal" role="alert">{ALERTA}<span>No pudimos armar el archivo. Probá de nuevo.</span></div>'
    apagado = mucho or modo in ("otra", "exportando")
    if modo == "exportando":
        boton = '<button type="button" class="cb cb-pri" disabled><span class="gira"></span> Exportando…</button>'
    else:
        boton = f'<button type="button" class="cb cb-pri"{" disabled" if apagado else ""}>{DESCARGAR} Exportar</button>'
    cancelar = f'<button type="button" class="cb cb-sec"{" disabled" if modo == "exportando" else ""}>Cancelar</button>'
    pie = f'<div class="ex-pie"><span class="arch">{ARCHIVO} {ARCHIVO_XLSX}</span>{cancelar}{boton}</div>'
    t = F.dialogo("Exportar a Excel", linea + cols + aviso, pie)
    return t.replace('class="w-dlg"', 'class="w-dlg ex"', 1)


def exportar():
    E = ESTADOS_EX
    capas = A.con_estados([
        ("Exportar", dlg_exportar()), ("Solo las columnas visibles", dlg_exportar("solo")), ("Más de 10.000", dlg_exportar("mucho")),
        ("Exportando", dlg_exportar("exportando")), ("Exportado", A.toast(f"Se descargó «{ARCHIVO_XLSX}».")),
        ("Ya hay una exportación en curso", dlg_exportar("otra")), ("No se pudo exportar", dlg_exportar("error")),
    ])
    fondo = A.con_estados([(e, planilla_fondo("mucho" if e == "Más de 10.000" else "filtrado")) for e in E])
    t = pagina_pl("Respuestas · Exportar a Excel", banda_pl(), fondo, E, A.js_estados(E, "      panelPocos: true, panelMuchos: false,\n"), css=C.CSS_K2 + CSS_EX)
    return F.con_dialogo(t, capas)


# ---------------------------------------------------------------- Teléfono: Más › Formularios › Respuestas, la lista y la respuesta a pantalla completa
CSS_TPL = """.ap-fila .l1 .hr { float: right; font-size: 13px; font-weight: 400; color: var(--t3); }
.ap-fila .l3 .ft { display: inline-flex; align-items: center; gap: 4px; }
.ap-bar .ap-ib.con { position: relative; }
.ap-bar .ap-ib.con::after { content: ""; position: absolute; top: 9px; right: 9px; width: 8px; height: 8px; border-radius: 50%; background: var(--marca); }
.tr-nav { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-bottom: 1px solid var(--borde); font-size: 14px; color: var(--t2); flex-shrink: 0; background: #fff; }
.tr-nav .ap-ib { width: 40px; height: 40px; border: 1px solid var(--borde); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; }
.tr-nav .ap-ib[disabled] { opacity: 0.4; }
.tr-nav .cb { margin-left: auto; height: 40px; font-size: 14px; text-decoration: none; }
.tr-mom { margin: 12px 16px 0; padding: 12px; border: 1px solid var(--borde); border-radius: 12px; display: flex; gap: 10px; background: #fff; }
.tr-mom .ck { width: 22px; height: 22px; border-radius: 6px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tr-mom .t { display: flex; flex-direction: column; gap: 3px; font-size: 15px; } .tr-mom .t .h { color: var(--t3); margin-left: 6px; }
.tr-mom .t small { font-size: 13px; color: var(--t3); }
.tr-tabs { margin: 8px 0 0; }
.tr-gr { margin: 12px 16px 16px; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.tr-gr .f { display: grid; grid-template-columns: 118px minmax(0, 1fr); gap: 10px; padding: 11px 14px; border-top: 1px solid var(--borde); font-size: 15px; line-height: 1.35; }
.tr-gr .f:first-child { border-top: 0; }
.tr-gr .k { color: var(--t2); font-size: 14px; }
.tr-gr .vac { color: var(--t3); font-style: italic; }
.tr-gr .r-th { width: 52px; height: 52px; }
.tr-fotos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 12px 16px; }
.tr-fotos .r-th { width: 100%; height: 150px; border-radius: 10px; }
.tr-fotos span.f { display: flex; flex-direction: column; gap: 6px; font-size: 14px; } .tr-fotos small { color: var(--t3); font-size: 12.5px; }
.tr-scroll { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; }
.t-toast { position: absolute; left: 12px; right: 12px; bottom: 34px; z-index: 40; display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); font-size: 15px; }
.t-toast .ok { color: oklch(0.55 0.13 155); display: inline-flex; }
.ap-hoja .ex-arch { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--t2); }
"""
ESTADOS_TPL = ["Formularios", "Respuestas", "Filtros", "Con filtros", "Más acciones", "Exportar", "Exportado", "Cargando", "Todavía no hay respuestas",
               "Sin coincidencias", "No se pudo cargar", "Sin permiso"]


def tel_respuestas():
    E = ESTADOS_TPL
    t_kebab = F.TKEBAB
    forms = (f'<a class="ap-fila" href="#"><div class="tx"><span class="l1">Visita a cliente</span><span class="l2">24 respuestas · versión 4</span></div></a>'
             '<a class="ap-fila" href="#"><div class="tx"><span class="l1">Entrega de pedido</span><span class="l2">8 respuestas · versión 1</span></div></a>'
             '<a class="ap-fila" href="#"><div class="tx"><span class="l1">Control de vehículo</span><span class="l2">31 respuestas · versión 2</span></div></a>')
    bar_forms = C.t_bar("Respuestas", "Formularios", "M-WA-Menu.dc.html")

    def bar_lista(con=False, sub="24 respuestas"):
        der = (f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button>'
               f'<button type="button" class="ap-ib{" con" if con else ""}" aria-label="Filtros">{F.TFILTROS}</button>'
               f'<button type="button" class="ap-ib" aria-label="Más acciones">{t_kebab}</button>')
        return C.t_bar("Visita a cliente", sub, "#", der)

    def fila_t(r):
        (n, rec, quien, emp, cli, fec, ven, mon, mot, sup, fot, rem, obs, ver, con) = r
        hora = rec[:5] + " " + rec[-5:]
        corto = quien if len(quien) < 26 else quien[:24] + "…"
        extra = f' · <span class="ft">{fot} {"foto" if fot == 1 else "fotos"}</span>' if isinstance(fot, int) else ""
        return (f'<a class="ap-fila" href="M-FRM-Respuesta.dc.html"><div class="tx"><span class="l1">{n}<span class="hr">{hora}</span></span>'
                f'<span class="l2">{corto} · {emp}</span><span class="l3">{cli}{extra}</span></div></a>')
    filas = "".join(fila_t(r) for r in RESP)
    filtradas = "".join(fila_t(r) for r in RESP if r[0] in FILTRADAS)
    esq = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span><span style="width: 66%;"></span></div>'

    def lista(cuerpo, con=False, sub="24 respuestas"):
        return bar_lista(con, sub) + f'<div class="ap-cuerpo">{cuerpo}</div>'
    cuerpo = {
        "Formularios": bar_forms + f'<div class="ap-cuerpo">{forms}</div>',
        "Respuestas": lista(filas), "Filtros": lista(filas), "Con filtros": lista(filtradas, True, "4 de 24 respuestas"),
        "Más acciones": lista(filas), "Exportar": lista(filas), "Exportado": lista(filas),
        "Cargando": lista(esq, sub="Respuestas"),
        "Todavía no hay respuestas": C.t_bar("Visita a cliente", "Sin respuestas", "#") + '<div class="ap-cuerpo"><div class="ap-vacio">Todavía no llegaron respuestas.'
        '<a class="cb cb-sec" href="M-WA-Chats-Formulario.dc.html">Ir a los chats</a></div></div>',
        "Sin coincidencias": lista('<div class="ap-vacio">Ninguna respuesta coincide con los filtros.<button type="button" class="cb cb-sec">Limpiar filtros</button></div>',
                                   True, "0 de 24 respuestas"),
        "No se pudo cargar": lista('<div class="ap-vacio">No pudimos cargar las respuestas.<button type="button" class="cb cb-sec">Reintentar</button></div>', sub=""),
        "Sin permiso": C.t_bar("Respuestas", "Formularios", "M-WA-Menu.dc.html") + '<div class="ap-cuerpo"><div class="ap-vacio">No tenés permiso para ver esta página.'
        '<a class="cb cb-sec" href="M-Inicio-Org.dc.html">Ir al inicio</a></div></div>',
    }
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")

    def grupo(tit, ops, elegido=0):
        return f'<div class="p-tit2">{tit}</div>' + "".join(f'<span class="t-opc {"on" if k == elegido else ""}">{n}<span class="d">{c}{tilde if k == elegido else ""}</span></span>'
                                                            for k, (n, c) in enumerate(ops))
    filtros_h = (grupo("Empresa", [("Todas las empresas", 24), ("Delta S.A.", 17), ("Delta Sur S.R.L.", 4), ("Delta Norte S.A.", 6), ("Sin empresa", 1)])
                 + grupo("Recibida", [("Todas las fechas", ""), ("Hoy", 2), ("Últimos 7 días", 14), ("Octubre 2026", 24)]))
    menu = F.thoja("Visita a cliente", f'<div class="ap-acciones2"><span role="menuitem">{DESCARGAR} Exportar a Excel</span></div>', "")
    hoja_ex = F.thoja("Exportar a Excel", '<p class="ap-txt-l">Se exportan las <b>24 respuestas</b> de Visita a cliente, con las preguntas de todas las versiones.</p>'
                      f'<span class="ex-arch">{ARCHIVO} {ARCHIVO_XLSX}</span>',
                      f'<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">{DESCARGAR} Exportar</button>')
    capas = {"Filtros": F.thoja("Filtros", filtros_h, '<button type="button" class="cb cb-sec">Limpiar filtros</button><button type="button" class="cb cb-pri">Ver 24 respuestas</button>').replace(
                 '<div class="hb">', '<div class="hb lst">', 1),
             "Más acciones": menu, "Exportar": hoja_ex,
             "Exportado": f'<div class="t-toast" role="status"><span class="ok">{OK}</span><span>Se descargó «{ARCHIVO_XLSX}».</span></div>'}
    return C.tel_pagina(cuerpo, E, capas, "Respuestas · teléfono", F.CSS_TFILTRO + A.CSS_ARCH + CSS_TPL)


ESTADOS_TR = ["Respuesta", "Fotos", "Ver una foto", "La primera de la lista", "De una versión anterior", "Cargando", "No encontramos esa respuesta"]


def tel_respuesta():
    E = ESTADOS_TR

    def bar(num="VIS-000126", version=4):
        return C.t_bar(num, f"Visita a cliente · versión {version}", "M-FRM-Respuestas.dc.html")

    def nav(pos="5 de 24", primera=False):
        return (f'<div class="tr-nav"><span>{pos}</span><button type="button" class="ap-ib" aria-label="Respuesta anterior"{" disabled" if primera else ""}>{SUBE}</button>'
                f'<button type="button" class="ap-ib" aria-label="Respuesta siguiente">{BAJA}</button>'
                f'<a class="cb cb-sec" href="M-WA-Conversacion-Respuesta.dc.html">Abrir conversación</a></div>')

    def mom(quien="Tomás Acosta", hora="13/10/2026 15:30"):
        return (f'<div class="tr-mom"><span class="ck">{CHECK}</span><span class="t"><span><b>Recibida</b><span class="h">{hora}</span></span>'
                f'<small>La respondió {quien} · se la mandó Lucía Fernández</small></span></div>')

    def pest(tab="Respuesta", fotos=2):
        h = f'<div class="ap-tabs tr-tabs" role="tablist"><span class="{"on" if tab == "Respuesta" else ""}" role="tab">Respuesta</span>'
        if fotos:
            h += f'<span class="{"on" if tab == "Fotos" else ""}" role="tab">Fotos <span class="c">{fotos}</span></span>'
        return h + "</div>"

    def grilla(valores):
        filas = "".join(f'<div class="f"><span class="k">{k}</span>' + (f"<span>{v}</span>" if v is not None else '<span class="vac">Sin respuesta</span>') + "</div>"
                        for k, v in valores)
        return f'<div class="tr-gr">{filas}</div>'

    def pantalla(num="VIS-000126", version=4, valores=VALORES_126, quien="Tomás Acosta", hora="13/10/2026 15:30", fotos=2, pos="5 de 24", primera=False, tab="Respuesta"):
        if tab == "Fotos":
            cuerpo = ('<div class="tr-fotos">' + "".join(f'<span class="f"><span class="r-th{" b" if k else ""}" role="img" aria-label="Foto {k + 1}"></span>{n}<small>{p}</small></span>'
                                                         for k, (n, p) in enumerate([("frente-local.jpg", "3,4 MB"), ("gondola.jpg", "2,9 MB")])) + "</div>")
        else:
            cuerpo = grilla(valores)
        return bar(num, version) + nav(pos, primera) + f'<div class="tr-scroll">{mom(quien, hora)}{pest(tab, fotos)}{cuerpo}</div>'
    esq = '<div class="ap-esq"><span style="width: 70%;"></span><span style="width: 90%;"></span><span style="width: 60%;"></span><span style="width: 84%;"></span></div>'
    cuerpo = {
        "Respuesta": pantalla(), "Fotos": pantalla(tab="Fotos"), "Ver una foto": pantalla(),
        "La primera de la lista": pantalla("VIS-000130", 4, VALORES_130, "Paula Méndez", "15/10/2026 16:20", 3, "1 de 24", True),
        "De una versión anterior": pantalla("VIS-000123", 3, VALORES_123, "Tomás Acosta", "13/10/2026 11:04", 0, "8 de 24"),
        "Cargando": bar() + nav() + esq,
        "No encontramos esa respuesta": C.t_bar("Respuesta", "Visita a cliente", "M-FRM-Respuestas.dc.html")
        + '<div class="ap-cuerpo"><div class="ap-vacio">No encontramos esta respuesta.<a class="cb cb-sec" href="M-FRM-Respuestas.dc.html">Volver a las respuestas</a></div></div>',
    }
    visor = ('<div class="tv" role="dialog" aria-label="Fotos de la visita"><div class="tv-bar">'
             f'<button type="button" class="ap-ib" aria-label="Cerrar">{X}</button><span class="tit"><b>Fotos de la visita</b><span>Foto 1 de 2 · VIS-000126</span></span></div>'
             '<div class="tv-img"><div class="tv-foto" role="img" aria-label="Foto 1 de 2"></div></div>'
             '<div class="tv-tira"><span class="r-th on"></span><span class="r-th b"></span></div>'
             f'<div class="tv-pie"><span class="t">frente-local.jpg<small>3,4 MB · sacada con la cámara</small></span><button type="button" class="cb cb-sec">{DESCARGAR} Descargar</button></div></div>')
    return C.tel_pagina(cuerpo, E, {"Ver una foto": visor}, "Respuesta · teléfono", A.CSS_ARCH + A.CSS_TVISOR + CSS_TPL)


# ---------------------------------------------------------------- Los demás tableros: «Respuestas» en el panel y en Más › Formularios
def panel_en_los_demas(c):
    """Suma «Respuestas ›» al panel de Formularios de los demás tableros (no los del Archivo) y lo deja idempotente."""
    hechos = []
    for f in sorted(PROJ.glob("*.dc.html")):
        nombre = f.name[:-8]
        if nombre in TITULOS or re.search(r"-v1\d\d$", nombre) or c["boards"].get(f.name, {}).get("page") == "archivo":
            continue
        t = f.read_text(encoding="utf-8")
        if '<aside class="w-panel" aria-label="Formularios">' not in t or 'href="FRM-Respuestas.dc.html"' in t:
            continue
        i = t.index('<aside class="w-panel" aria-label="Formularios">')
        k = t.index('<nav class="w-nav">', i) + len('<nav class="w-nav">')
        t = t[:k] + grupo_respuestas(False) + t[k:]
        if ".w-ln.grupo {" not in t:
            t = t.replace("</helmet>", f'<style data-e15="panel">\n{CSS_PANEL}</style>\n</helmet>', 1)
        f.write_text(t, encoding="utf-8")
        hechos.append(nombre)
    return hechos


def menu_telefono():
    """Más › Formularios del teléfono: «Respuestas» primero y «Formularios» pasa a «Diseñar formularios», como en la compu."""
    f = PROJ / "M-WA-Menu.dc.html"
    t = f.read_text(encoding="utf-8")
    if 'href="M-FRM-Respuestas.dc.html"' in t:
        return False
    viejo = '<span class="ap-gtit">Formularios</span><div class="ap-grupo"><a class="ap-it " href="M-FRM-Listado.dc.html"><span class="tx"><b>Formularios</b></span>'
    assert t.count(viejo) == 1, "Más › Formularios cambió"
    chev = re.search(r'<a class="ap-it " href="M-FRM-Listado\.dc\.html"><span class="tx"><b>Formularios</b></span><span class="chev">(<svg.*?</svg>)</span></a>', t, re.S).group(1)
    nuevo = ('<span class="ap-gtit">Formularios</span><div class="ap-grupo">'
             f'<a class="ap-it " href="M-FRM-Respuestas.dc.html"><span class="tx"><b>Respuestas</b></span><span class="chev">{chev}</span></a>'
             '<a class="ap-it " href="M-FRM-Listado.dc.html"><span class="tx"><b>Diseñar formularios</b></span>')
    f.write_text(t.replace(viejo, nuevo), encoding="utf-8")
    return True


# ---------------------------------------------------------------- canvas.json
TITULOS = {"FRM-Respuestas": "Formularios · Respuestas · la planilla", "FRM-Respuestas-Filtros": "Formularios · Respuestas · más filtros",
           "FRM-Respuesta": "Formularios · Respuestas · una respuesta al costado", "FRM-Respuestas-Exportar": "Formularios · Respuestas · exportar a Excel",
           "M-FRM-Respuestas": "Formularios · Respuestas · teléfono", "M-FRM-Respuesta": "Formularios · una respuesta · teléfono"}
LUGAR = {"FRM-Respuestas": (0, 8200, 1440, 900), "FRM-Respuestas-Filtros": (1520, 8200, 1440, 900), "FRM-Respuesta": (3040, 8200, 1440, 900),
         "FRM-Respuestas-Exportar": (4560, 8200, 1440, 900), "M-FRM-Respuestas": (0, 9220, 390, 844), "M-FRM-Respuesta": (470, 9220, 390, 844)}
CON_ESTADOS_NUEVOS = ["M-WA-Menu"]  # suma «Respuestas» en Más › Formularios


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    marca = "" if E15_APROBADA else A.PARA_APROBAR
    for n, (x, y, w, h) in LUGAR.items():
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n] + marca, "page": "formularios", "is_interactive": True}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    for n in CON_ESTADOS_NUEVOS:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(A.PARA_APROBAR, "") + marca
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    return c


if __name__ == "__main__":
    tableros = {"FRM-Respuestas": respuestas(), "FRM-Respuestas-Filtros": filtros_lado(), "FRM-Respuesta": detalle(), "FRM-Respuestas-Exportar": exportar(),
                "M-FRM-Respuestas": tel_respuestas(), "M-FRM-Respuesta": tel_respuesta()}
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    c = registrar()
    print("tableros", list(tableros))
    print("panel", panel_en_los_demas(c))
    print("menú del teléfono", menu_telefono())
