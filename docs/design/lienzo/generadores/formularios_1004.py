"""E12 · Formularios por WhatsApp (docs/plans/formularios/e12-formularios.md del back, §9): los tableros `FRM-*`.
Se arman desde WA-Contactos (el listado de la familia de WhatsApp) y van en la página «Organización · Formularios».
Uso: `python formularios_1004.py opciones` deja las opciones de cada tablero para mostrarlas (no entran en canvas.json);
sin argumentos, arma los tableros elegidos."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
BASE = (PROJ / "WA-Contactos.dc.html").read_text(encoding="utf-8")
ADMIN = (PROJ / "WA-Admin.dc.html").read_text(encoding="utf-8")


def svg(cuerpo, tam=18, grosor="1.75"):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{grosor}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{cuerpo}</svg>')


ICONO = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/>'
            '<path d="M9 12.5h6"/><path d="M9 16h4"/>')
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 16, "2")
INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 14)
KEBAB = re.search(r'<button type="button" class="ib" aria-label="Acciones de Martina López">(<svg.*?</svg>)</button>', BASE, re.S).group(1)
BUSCAR = re.search(r'<span class="w-bus">(<svg.*?</svg>)', BASE, re.S).group(1)
CHEV = re.search(r'<span class="w-pil">Etiqueta: todas (<svg.*?</svg>)</span>', BASE, re.S).group(1)

CSS = """.w-th.f, .w-tr.f { grid-template-columns: minmax(0, 1.6fr) 140px 240px 170px 48px; }
.w-tr.f { min-height: 52px; }
.w-tr .pre { font-variant-numeric: tabular-nums; letter-spacing: 0.04em; color: var(--t2); }
.w-est.mal { color: oklch(0.5 0.19 25); }
.w-est.mal::before { background: oklch(0.57 0.2 25); }
.f-i { display: inline-flex; vertical-align: middle; margin-left: 4px; color: var(--t3); cursor: help; }
.o-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--borde); flex-shrink: 0; }
.o-tabs > span { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; }
.o-tabs > span.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.o-tabs .c { margin-left: 6px; font-size: 12px; font-weight: 600; color: var(--t3); }
"""


def info(texto):
    return f'<span class="f-i" tabindex="0" role="img" aria-label="{texto}" title="{texto}">{INFO}</span>'


# ---------------------------------------------------------------- El marco: menú principal y, si va, el panel
def menu_principal(formularios_en_menu, admin_abierto=False):
    sb = re.search(r'<aside class="w-sb".*?</aside>', BASE, re.S).group(0)
    nav = re.search(r'<nav class="w-nav">.*?</nav>', sb, re.S).group(0)
    nuevo = nav.replace('<a class="w-ln on" href="WA-Chats.dc.html">', '<a class="w-ln" href="WA-Chats.dc.html">')
    if formularios_en_menu:
        # Después de formularios_ajustes_1004.py, la base ya trae «Formularios»: se prende en lugar de sumarlo otra vez.
        if 'href="FRM-Listado.dc.html"' in nuevo:
            nuevo = nuevo.replace('<a class="w-ln" href="FRM-Listado.dc.html">', '<a class="w-ln on" href="FRM-Listado.dc.html">')
        else:
            nuevo = nuevo.replace("</nav>", f'<a class="w-ln on" href="FRM-Listado.dc.html">{ICONO} Formularios</a></nav>')
    else:
        nuevo = re.sub(r'<a class="w-ln" href="FRM-Listado\.dc\.html">.*?</a>', '', nuevo, flags=re.S)
    sb = sb.replace(nav, nuevo)
    if admin_abierto:
        sb = sb.replace('<a class="w-ln" href="WA-Admin.dc.html">', '<a class="w-ln on" href="WA-Admin.dc.html">')
    return sb


def panel_admin():
    """El panel de Administración de WA-Admin, con «Formularios» después de «Asistente» y WhatsApp plegado."""
    panel = re.findall(r'<aside.*?</aside>', ADMIN[ADMIN.index("</helmet>"):], re.S)[1]
    w = re.search(r'<span class="w-ln grupo">(<svg.*?</svg>) WhatsApp <span class="fl">(<svg.*?</svg>)</span></span><div class="w-hijos">.*?</div>', panel, re.S)
    derecha = re.search(r'Asistente <span class="fl">(<svg.*?</svg>)</span>', panel, re.S).group(1)
    panel = panel.replace(w.group(0), f'<a class="w-ln grupo" href="WA-Admin.dc.html">{w.group(1)} WhatsApp <span class="fl">{derecha}</span></a>')
    k = panel.index('<a class="w-ln" href="Auditoria-Org.dc.html">')
    return panel[:k] + f'<a class="w-ln on" href="FRM-Listado.dc.html">{ICONO} Formularios</a>' + panel[k:]


def pagina(nombre, miga, banda, cuerpo, formularios_en_menu=True, css_extra="", estados=None, js=""):
    """Arma un tablero de la compu desde WA-Contactos. `estados`: (prop, opciones) del Tweak."""
    t = BASE
    sb = re.search(r'<aside class="w-sb".*?</aside>', t, re.S).group(0)
    panel = re.search(r'<aside class="w-panel".*?</aside>', t, re.S).group(0)
    t = t.replace(sb, menu_principal(formularios_en_menu, admin_abierto=not formularios_en_menu))
    t = t.replace(panel, "" if formularios_en_menu else panel_admin())
    t = t.replace("<span>Inicio / WhatsApp / Contactos</span>", f"<span>{miga}</span>")
    i = t.index('<div class="w-bnd">')
    j = t.index("</div></div></div>\n</x-dc>")
    t = t[:i] + banda + cuerpo + t[j + len("</div></div>"):]
    t = re.sub(r"<title>[^<]*</title>", f"<title>{nombre}</title>", t)
    t = t.replace("</helmet>", f'<style data-e12="formularios">\n{CSS}{css_extra}</style>\n</helmet>')
    if estados:
        prop, opciones = estados
        props = {prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
        t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
        t = t.replace("    return { si: true, no: false };", f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n{js}")
    return t


def banda(titulo, resumen, acciones):
    return (f'<div class="w-bnd"><div class="iz"><span class="ic">{ICONO}</span><div><h1>{titulo}</h1><p class="res">{resumen}</p></div></div>'
            f'<div class="ac">{acciones}</div></div>')


# ---------------------------------------------------------------- FRM-Listado
FORMULARIOS = [
    ("Control de vehículo", "VEH", "mal", "No se pudo publicar", "Una pregunta no entra en WhatsApp.", "—"),
    ("Entrega de pedido", "ENT", "", "Publicado · v1", "", "02/10/2026"),
    ("Reclamo", "REC", "off", "Borrador", "", "—"),
    ("Visita a cliente", "VIS", "", "Publicado · v3", "", "08/10/2026"),
]


def fila(n, pre, clase, estado, detalle, fecha):
    i = info(detalle) if detalle else ""
    f = f'<span style="color: var(--t3);">—</span>' if fecha == "—" else fecha
    return (f'<div class="w-tr f"><span class="dos"><a href="FRM-Ficha.dc.html">{n}</a></span><span class="pre">{pre}</span>'
            f'<span><span class="w-est {clase}">{estado}</span>{i}</span><span>{f}</span>'
            f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span></div>')


TABLA = ('<div class="w-caja"><div class="w-th f"><span>Formulario</span><span>Prefijo</span><span>Estado</span><span>Última publicación</span>'
         '<span class="sr">Acciones</span></div>' + "".join(fila(*f) for f in FORMULARIOS)
         + '<div class="w-pie"><span>1–4 de 4</span><span>10 por página · Página 1 de 1</span></div></div>')
BUSQUEDA = f'<span class="w-bus">{BUSCAR} Buscar por nombre o prefijo</span>'
PESTANAS = ('<div class="o-tabs" role="tablist"><span class="on" role="tab">Todos <span class="c">4</span></span>'
            '<span role="tab">Publicados <span class="c">2</span></span><span role="tab">Borradores <span class="c">2</span></span></div>')
BANDA_LISTADO = banda("Formularios", "4 formularios · 2 publicados", f'<a class="cb cb-pri" href="FRM-Nuevo.dc.html">{MAS} Nuevo formulario</a>')


def listado_opciones():
    con_pestanas = PESTANAS + f'<div class="w-caja o-fb">{BUSQUEDA}</div>' + TABLA
    con_desplegable = f'<div class="w-caja o-fb">{BUSQUEDA}<span class="w-pil">Estado: todos {CHEV}</span></div>' + TABLA
    return {
        "FRM-Listado-A": pagina("FRM-Listado-A", "Inicio / Formularios", BANDA_LISTADO, '<div class="w-body">' + con_pestanas + "</div>"),
        "FRM-Listado-B": pagina("FRM-Listado-B", "Inicio / Formularios", BANDA_LISTADO, '<div class="w-body">' + con_desplegable + "</div>"),
        "FRM-Listado-C": pagina("FRM-Listado-C", "Inicio / Administración / Formularios", BANDA_LISTADO, '<div class="w-body">' + con_pestanas + "</div>",
                                formularios_en_menu=False),
    }


# ---------------------------------------------------------------- FRM-Listado elegido (A, 13/10): en el menú principal, con pestañas
ESTADOS_LISTADO = ["Todos", "Publicados", "Borradores", "Sin resultados", "Cargando", "Vacío", "Error"]
CSS_LISTADO = """.esq { align-self: stretch; display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
.esq span { height: 12px; border-radius: 6px; background: oklch(0.93 0.01 78); }
.f-cuerpo { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px 16px; text-align: center; color: var(--t2); }
.f-cuerpo.izq { align-items: stretch; padding: 20px 16px; }
.f-cuerpo b { color: var(--t1); font-size: 14px; }
.f-cuerpo .cb { flex: 0 0 auto; }
.o-tabs > span { cursor: pointer; }
.w-bus.lleno { color: var(--t1); }
"""


def listado():
    filas = []
    for f in FORMULARIOS:
        grupo = "verPub" if f[3].startswith("Publicado") else "verBor"
        filas.append(f'<sc-if value="{{{{{grupo}}}}}" hint-placeholder-val="{{{{si}}}}">' + fila(*f) + "</sc-if>")
    cab = ('<div class="w-th f"><span>Formulario</span><span>Prefijo</span><span>Estado</span><span>Última publicación</span>'
           '<span class="sr">Acciones</span></div>')
    cant = lambda v: f'<sc-if value="{{{{conCant}}}}" hint-placeholder-val="{{{{si}}}}"> <span class="c">{{{{{v}}}}}</span></sc-if>'  # noqa: E731
    pestanas = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="o-tabs" role="tablist">'
                '<span class="{{tabTodos}}" role="tab" aria-selected="{{selTodos}}" onClick="{{verTodos}}">Todos' + cant("cTodos") + '</span>'
                '<span class="{{tabPub}}" role="tab" aria-selected="{{selPub}}" onClick="{{verPublicados}}">Publicados' + cant("cPub") + '</span>'
                '<span class="{{tabBor}}" role="tab" aria-selected="{{selBor}}" onClick="{{verBorradores}}">Borradores' + cant("cBor") + '</span></div>'
                f'<div class="w-caja o-fb"><span class="w-bus {{{{busClase}}}}">{BUSCAR} {{{{busqueda}}}}</span></div></sc-if>')
    cuerpo = ('<div class="w-body">' + pestanas + '<div class="w-caja">' + cab
              + '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + "".join(filas)
              + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
              '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span>'
              '<span style="width: 65%;"></span><span style="width: 72%;"></span><span style="width: 55%;"></span></div></div></sc-if>'
              '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay formularios.</b></div></sc-if>'
              '<sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ningún formulario coincide con los filtros.</b>'
              '<button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></div></sc-if>'
              '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar los formularios.</b>'
              '<button type="button" class="cb cb-sec">Reintentar</button></div></sc-if>'
              "</div></div>")
    banda_l = banda("Formularios", "{{resumen}}", f'<a class="cb cb-pri" href="FRM-Nuevo.dc.html">{MAS} Nuevo formulario</a>')
    js = """    const f = this.state.f ?? e;
    const ir = (x) => this.setState({ f: x });
    const lista = ['Todos', 'Publicados', 'Borradores'].includes(f);
    return {
      si: true, no: false,
      resumen: f === 'Vacío' ? 'Sin formularios' : f === 'Cargando' || f === 'Error' ? '' : '4 formularios · 2 publicados',
      conFiltros: f !== 'Vacío', conCant: f !== 'Cargando' && f !== 'Error',
      cTodos: f === 'Sin resultados' ? '0' : '4', cPub: f === 'Sin resultados' ? '0' : '2', cBor: f === 'Sin resultados' ? '0' : '2',
      tabTodos: f === 'Todos' || !lista ? 'on' : '', tabPub: f === 'Publicados' ? 'on' : '', tabBor: f === 'Borradores' ? 'on' : '',
      selTodos: f === 'Todos' || !lista ? 'true' : 'false', selPub: f === 'Publicados' ? 'true' : 'false', selBor: f === 'Borradores' ? 'true' : 'false',
      verTodos: () => ir('Todos'), verPublicados: () => ir('Publicados'), verBorradores: () => ir('Borradores'),
      busqueda: f === 'Sin resultados' ? 'factura' : 'Buscar por nombre o prefijo', busClase: f === 'Sin resultados' ? 'lleno' : '',
      conFilas: lista, verPub: f !== 'Borradores', verBor: f !== 'Publicados',
      rango: f === 'Todos' ? '1–4 de 4' : '1–2 de 2',
      cargando: f === 'Cargando', vacio: f === 'Vacío', sinResultados: f === 'Sin resultados', error: f === 'Error',
      limpiar: () => ir('Todos'),
    };"""
    return pagina("Formularios · /org/formularios", "Inicio / Formularios", banda_l, cuerpo, css_extra=CSS_LISTADO,
                  estados=("estado", ESTADOS_LISTADO), js=js)


# ---------------------------------------------------------------- FRM-Nuevo elegido (A, 13/10): solo el nombre; el prefijo se ve en la ficha
CERRAR = re.search(r'<div class="dc"><span>Importar contactos</span><button type="button" class="ib" aria-label="Cerrar">(<svg.*?</svg>)</button>',
                   (PROJ / "WA-Contactos-Importar.dc.html").read_text(encoding="utf-8"), re.S).group(1)
ESTADOS_NUEVO = ["Con el nombre", "Vacío", "Sin nombre", "Nombre de más de 80", "Creando"]
CSS_DLG = """.w-cmp .ct.ph { color: var(--t3); }
.w-cmp .ct.mal { border-color: var(--peligro); }
.w-cmp .err2 { font-size: 12.5px; color: var(--peligro); }
.w-dlg .df .cb:disabled { opacity: 0.6; cursor: default; }
.w-dlg .db.una { grid-template-columns: minmax(0, 1fr); }
.w-dlg .w-cmp .ct { display: block; line-height: 34px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
"""


def dialogo(titulo, cuerpo, pie, una=True):
    return (f'<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-modal="true" aria-label="{titulo}"><div class="dc"><span>{titulo}</span>'
            f'<button type="button" class="ib" aria-label="Cerrar">{CERRAR}</button></div><div class="db{" una" if una else ""}">{cuerpo}</div>'
            f'<div class="df">{pie}</div></div></div>')


def con_dialogo(t, overlay, css=""):
    k = t.rindex("</div>\n</x-dc>")
    t = t[:k] + overlay + t[k:]
    return t.replace("</helmet>", f'<style data-e12="dialogo">\n{CSS_DLG}{css}</style>\n</helmet>', 1)


def nuevo():
    t = listado()
    cuerpo = ('<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span>'
              '<div class="ct {{nClase}}">{{nombre}}</div>'
              '<sc-if value="{{nErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{nErr}}</span></sc-if></div>')
    pie = ('<button type="button" class="cb cb-sec">Cancelar</button>'
           '<button type="button" class="cb cb-pri" disabled="{{creando}}">{{boton}}</button>')
    t = con_dialogo(t, dialogo("Nuevo formulario", cuerpo, pie))
    # El Tweak del tablero pasa a ser el del diálogo; el listado de atrás queda en «Todos».
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_LISTADO, ensure_ascii=False, separators=(",", ":")) + ',"default":"Todos"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_NUEVO, ensure_ascii=False, separators=(",", ":")) + ',"default":"Con el nombre"')
    t = t.replace("    const f = this.state.f ?? e;", """    const d = e;
    const LARGO = 'Informe de inspección de obra en altura con relevamiento fotográfico de andamios y arneses';
    const f = this.state.f ?? 'Todos';""")
    t = t.replace("      limpiar: () => ir('Todos'),", """      limpiar: () => ir('Todos'),
      nombre: d === 'Vacío' || d === 'Sin nombre' ? 'Por ejemplo, Visita a cliente' : d === 'Nombre de más de 80' ? LARGO : 'Inspección de obra',
      nClase: (d === 'Vacío' || d === 'Sin nombre' ? 'ph ' : '') + (d === 'Sin nombre' || d === 'Nombre de más de 80' ? 'mal' : ''),
      nErr: d === 'Sin nombre' ? 'Escribí un nombre.' : d === 'Nombre de más de 80' ? 'Usá hasta 80 caracteres.' : '',
      creando: d === 'Creando', boton: d === 'Creando' ? 'Creando…' : 'Crear formulario',""")
    return re.sub(r"<title>[^<]*</title>", "<title>Nuevo formulario</title>", t)


# ---------------------------------------------------------------- FRM-Ficha: la ficha de un formulario, con pestañas
PREGUNTAS = [
    ("Cliente", "Texto corto · Obligatoria"),
    ("Fecha de la visita", "Fecha"),
    ("¿Se concretó la venta?", "Sí o no"),
    ("Monto estimado", "Número · 2 decimales"),
    ("Motivo", "Lista · 3 opciones"),
    ("Observaciones", "Texto largo"),
]
CSS_FICHA = """.f-cols { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
.f-pila { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.f-cab { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 12px 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.f-cab .cb { height: 32px; font-size: 13px; }
.q-it { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 8px 8px 16px; border-bottom: 1px solid var(--borde); }
.q-it:last-child { border-bottom: 0; }
.q-it .num { width: 26px; height: 26px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.q-it .dato { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }
.q-it .dato b { font-weight: 500; font-size: 14px; }
.q-it .dato span { font-size: 12.5px; color: var(--t3); }
.f-bnd-est { display: inline-flex; align-items: center; gap: 10px; }
.f-sucio { font-size: 13px; font-weight: 600; color: oklch(0.55 0.13 70); }
.f-auto { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--t3); }
.o-tabs.ficha { margin-bottom: 0; }
.o-tabs > a { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; text-decoration: none; }
.o-tabs > a.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.o-tabs .c.falta { color: oklch(0.55 0.13 70); }
.f-campo { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.f-campo .ct { max-width: 320px; }
/* La vista previa: un teléfono con el formulario como lo muestra WhatsApp. */
.pv { position: sticky; top: 0; display: flex; flex-direction: column; gap: 8px; }
.pv-tit { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--t2); }
.pv-tit .seg { display: inline-flex; border: 1px solid var(--borde); border-radius: 8px; overflow: hidden; font-size: 12px; }
.pv-tit .seg span { padding: 3px 10px; color: var(--t2); background: #fff; }
.pv-tit .seg span.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.tel { width: 300px; height: 580px; border-radius: 34px; border: 8px solid oklch(0.22 0.01 78); background: oklch(0.93 0.012 150); position: relative; overflow: hidden; box-sizing: border-box; }
.tel .pv-hoja { position: absolute; left: 0; right: 0; bottom: 0; top: 34px; background: #fff; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; }
.tel .pv-hc { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid oklch(0.92 0.005 150); font-size: 15px; font-weight: 600; color: oklch(0.22 0.01 150); }
.tel .pv-hc .pv-x { font-size: 18px; color: oklch(0.45 0.01 150); }
.tel .pv-hb { flex: 1; overflow: hidden; padding: 10px 14px; display: flex; flex-direction: column; gap: 9px; }
.tel .pv-c { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: oklch(0.3 0.01 150); }
.tel .pv-in { height: 30px; border: 1px solid oklch(0.8 0.01 150); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; font-size: 12.5px; color: oklch(0.55 0.01 150); }
.tel .pv-in.area { height: 52px; align-items: flex-start; padding-top: 8px; }
.tel .pv-ay { font-size: 11px; color: oklch(0.5 0.01 150); }
.tel .pv-rd { display: flex; gap: 14px; font-size: 12.5px; color: oklch(0.3 0.01 150); }
.tel .pv-rd span { display: inline-flex; align-items: center; gap: 6px; }
.tel .pv-rd i { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid oklch(0.55 0.01 150); }
.tel .pv-pie { padding: 10px 14px 16px; border-top: 1px solid oklch(0.92 0.005 150); }
.tel .pv-bt { width: 100%; height: 38px; border-radius: 19px; background: oklch(0.6 0.15 150); color: #fff; font-size: 13.5px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.tel .pv-c { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: oklch(0.3 0.01 150); }
"""
CAL = svg('<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16"/><path d="M8.5 3.5v4"/><path d="M15.5 3.5v4"/>', 14)
TILDE_G = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "2")


def vista_previa():
    return ('<div class="pv"><div class="pv-tit"><span>Vista previa</span><span class="seg"><span class="on">Español</span><span>Inglés</span></span></div>'
            '<div class="tel"><div class="pv-hoja"><div class="pv-hc"><span class="pv-x">×</span>Visita a cliente</div><div class="pv-hb">'
            '<div class="pv-c">Cliente<div class="pv-in"></div></div>'
            f'<div class="pv-c">Fecha de la visita (opcional)<div class="pv-in">Elegí una fecha {CAL}</div></div>'
            '<div class="pv-c">¿Se concretó la venta? (opcional)<div class="pv-rd"><span><i></i>Sí</span><span><i></i>No</span></div></div>'
            '<div class="pv-c">Monto estimado (opcional)<div class="pv-in"></div><span class="pv-ay">Usá punto para los decimales</span></div>'
            f'<div class="pv-c">Motivo (opcional)<div class="pv-in">Elegí una opción {CHEV}</div></div>'
            '<div class="pv-c">Observaciones (opcional)<div class="pv-in area"></div></div>'
            '</div><div class="pv-pie"><div class="pv-bt">Enviar</div></div></div></div></div>')


CSS_DATOS = """.d-g2 { display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 16px; padding: 16px; }
.d-ayuda { font-size: 12.5px; color: var(--t3); display: inline-flex; align-items: center; }
.w-cmp .ct.ro { background: var(--s2); color: var(--t3); border-color: var(--borde); }
.w-cmp .ct.mal { border-color: var(--peligro); }
.w-cmp .err2 { font-size: 12.5px; color: var(--peligro); }
"""


def datos_caja(nombre="{{nombre}}", prefijo="{{prefijo}}", clase="{{prefClase}}", ayuda="{{prefAyuda}}", detalle="{{prefInfo}}", err=True):
    e = '<sc-if value="{{prefErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{prefErr}}</span></sc-if>' if err else ""
    return ('<div class="w-caja"><div class="f-cab"><span>Datos</span></div><div class="d-g2">'
            f'<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">{nombre}</div></div>'
            f'<div class="w-cmp"><span class="rt">Prefijo <span class="req">*</span></span><div class="ct {clase}">{prefijo}</div>{e}'
            f'<span class="d-ayuda">{ayuda}{info(detalle)}</span></div></div></div>')


def lista_preguntas():
    items = "".join(f'<div class="q-it"><span class="num">{k + 1}</span><span class="dato"><b>{n}</b><span>{d}</span></span>'
                    f'<button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></div>' for k, (n, d) in enumerate(PREGUNTAS))
    return (datos_caja("Visita a cliente", "VIS", "ro", "Las respuestas: VIS-000124", "No cambia después de publicar.", err=False)
            + f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button></div>{items}</div>'
            '<div class="w-caja"><div class="f-cab"><span>Botón final</span></div><div class="f-campo"><div class="w-cmp"><span class="rt">Texto del botón <span class="req">*</span></span>'
            '<div class="ct">Enviar</div></div></div></div>')


def ficha(acciones, estado_banda, pestana="Preguntas", cuerpo_pestana=None):
    banda_f = (f'<div class="w-bnd"><div class="iz"><span class="ic">{ICONO}</span><div><h1>Visita a cliente</h1>'
               f'<p class="res f-bnd-est">{estado_banda}</p></div></div><div class="ac">{acciones}</div></div>')
    tabs = "".join(f'<a class="{"on" if n == pestana else ""}" role="tab" aria-selected="{"true" if n == pestana else "false"}" href="{h}.dc.html">{n}{c}</a>'
                   for n, c, h in [("Preguntas", ' <span class="c">6</span>', "FRM-Ficha"), ("Inglés", "", "FRM-Ingles"), ("Publicación", "", "FRM-Publicacion")])
    cuerpo = cuerpo_pestana or ('<div class="f-cols"><div class="f-pila">' + lista_preguntas() + "</div>" + vista_previa() + "</div>")
    body = f'<div class="w-body"><div class="o-tabs ficha" role="tablist">{tabs}</div>{cuerpo}</div>'
    return pagina("Formularios · ficha", "Inicio / Formularios / Visita a cliente", banda_f, body, css_extra=CSS_FICHA + CSS_DATOS)


ESTADO_VIS = '<span class="w-est">Publicado · v3</span><span>Prefijo VIS</span>'


def ficha_opciones():
    a = ficha('<span class="f-sucio">Cambios sin guardar</span><button type="button" class="cb cb-sec">Descartar cambios</button>'
              '<button type="button" class="cb cb-pri">Guardar cambios</button><button type="button" class="cb cb-sec">Publicar</button>', ESTADO_VIS)
    b = ficha(f'<span class="f-auto">{TILDE_G} Guardado</span><button type="button" class="cb cb-pri">Publicar</button>', ESTADO_VIS)
    return {"FRM-Ficha-A": a, "FRM-Ficha-B": b}


# ---------------------------------------------------------------- FRM-Ficha › Preguntas elegida (A, 13/10): se guarda a mano, como el resto del lienzo
ESTADOS_FICHA = ["Guardado", "Cambios sin guardar", "Guardando", "No se guardó", "Conflicto", "Acciones de una pregunta", "Recién creado"]
ALERTA = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>', 18, "2")
OK = svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>', 18, "2")
X = svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 16, "2")
CSS_ESTADOS = """.w-cartel { display: flex; align-items: center; gap: 10px; min-height: 44px; box-sizing: border-box; padding: 6px 8px 6px 14px; border-radius: 10px; font-size: 13px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); margin-top: 16px; }
.w-cartel .tx { flex: 1; }
.w-cartel .cb { flex: 0 0 auto; height: 32px; font-size: 13px; }
.f-toast { position: absolute; z-index: 41; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 14px; max-width: 460px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); font-size: 13px; color: var(--t1); }
.f-toast .ok { color: oklch(0.55 0.13 155); display: inline-flex; }
.f-toast .mal { color: oklch(0.55 0.2 25); display: inline-flex; }
.f-toast .ib { width: 28px; height: 28px; }
.ac .cb:disabled { opacity: 0.6; cursor: default; }
.q-it { position: relative; }
.q-it.abierta { background: var(--s2); }
.f-menu { position: absolute; right: 8px; top: 46px; z-index: 6; min-width: 180px; padding: 6px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); display: flex; flex-direction: column; }
.f-mi { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; font-size: 13.5px; color: var(--t1); }
.f-mi:hover { background: var(--s2); }
.f-mi.pel { color: oklch(0.5 0.19 25); }
.f-sep { height: 1px; background: var(--borde); margin: 4px 0; }
.f-vacia { padding: 32px 16px; text-align: center; color: var(--t1); font-size: 14px; font-weight: 600; }
"""
LAPIZ = svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>', 16)
ARRIBA = svg('<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>', 16)
ABAJO = svg('<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>', 16)
QUITAR = svg('<path d="M4.5 7h15"/><path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7"/><path d="m6.8 7 .8 11.1a1.5 1.5 0 0 0 1.5 1.4h5.8a1.5 1.5 0 0 0 1.5-1.4L17.2 7"/>', 16)


def ficha_final():
    items = []
    for k, (n, d) in enumerate(PREGUNTAS):
        menu = ""
        if k == 3:
            menu = ('<sc-if value="{{menuAbierto}}" hint-placeholder-val="{{no}}"><div class="f-menu" role="menu" aria-label="Acciones de Monto estimado">'
                    f'<span class="f-mi" role="menuitem">{LAPIZ} Editar</span><span class="f-mi" role="menuitem">{ARRIBA} Subir</span>'
                    f'<span class="f-mi" role="menuitem">{ABAJO} Bajar</span><span class="f-sep" role="separator"></span>'
                    f'<span class="f-mi pel" role="menuitem">{QUITAR} Quitar</span></div></sc-if>')
        clase = ' {{claseAbierta}}' if k == 3 else ""
        items.append(f'<div class="q-it{clase}"><span class="num">{k + 1}</span><span class="dato"><b>{n}</b><span>{d}</span></span>'
                     f'<button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button>{menu}</div>')
    lista = (datos_caja() + f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button></div>'
             '<sc-if value="{{conPreguntas}}" hint-placeholder-val="{{si}}">' + "".join(items) + '</sc-if>'
             '<sc-if value="{{sinPreguntas}}" hint-placeholder-val="{{no}}"><div class="f-vacia">Todavía no hay preguntas.</div></sc-if></div>'
             '<div class="w-caja"><div class="f-cab"><span>Botón final</span></div><div class="f-campo"><div class="w-cmp"><span class="rt">Texto del botón <span class="req">*</span></span>'
             '<div class="ct">Enviar</div></div></div></div>')
    previa = vista_previa().replace('<div class="pv-hc"><span class="pv-x">×</span>Visita a cliente</div><div class="pv-hb">',
                                    '<div class="pv-hc"><span class="pv-x">×</span>{{nombre}}</div><div class="pv-hb"><sc-if value="{{conPreguntas}}" hint-placeholder-val="{{si}}">')
    previa = previa.replace('</div><div class="pv-pie">', '</sc-if></div><div class="pv-pie">', 1)
    cartel = ('<sc-if value="{{conflicto}}" hint-placeholder-val="{{no}}"><div class="w-cartel" role="alert">' + ALERTA
              + '<span class="tx">Otra persona cambió esto mientras lo editabas.</span><button type="button" class="cb cb-enl">Seguir editando</button>'
              '<button type="button" class="cb cb-sec">Ver lo nuevo</button></div></sc-if>')
    cuerpo = cartel + '<div class="f-cols" style="margin-top: 16px;"><div class="f-pila">' + lista + "</div>" + previa + "</div>"
    acciones = ('<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-sec" disabled="{{guardando}}">Descartar cambios</button>'
                '<button type="button" class="cb cb-pri" disabled="{{guardando}}">{{textoGuardar}}</button>'
                '<button type="button" class="cb cb-sec" disabled="{{guardando}}">Publicar</button></sc-if>'
                '<sc-if value="{{limpio}}" hint-placeholder-val="{{si}}"><a class="cb cb-pri" href="FRM-Publicar.dc.html">Publicar</a></sc-if>')
    estado_banda = ('<span class="w-est {{claseEstado}}">{{textoEstado}}</span><span>Prefijo {{prefGuardado}}</span>'
                    '<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><span class="f-sucio">Cambios sin guardar</span></sc-if>')
    t = ficha(acciones, estado_banda, cuerpo_pestana=cuerpo)
    t = t.replace("<h1>Visita a cliente</h1>", "<h1>{{nombre}}</h1>")
    t = t.replace('Preguntas <span class="c">6</span>', 'Preguntas <span class="c">{{cant}}</span>')
    t = t.replace("Inicio / Formularios / Visita a cliente", "Inicio / Formularios / {{nombre}}")
    toast = ('<sc-if value="{{toast}}" hint-placeholder-val="{{no}}"><div class="f-toast" role="status">'
             '<sc-if value="{{toastOk}}" hint-placeholder-val="{{si}}"><span class="ok">' + OK + '</span></sc-if>'
             '<sc-if value="{{toastMal}}" hint-placeholder-val="{{no}}"><span class="mal">' + ALERTA + '</span></sc-if>'
             f'<span>{{{{toast}}}}</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div></sc-if>')
    k = t.rindex("</div>\n</x-dc>")
    t = t[:k] + toast + t[k:]
    t = t.replace("</helmet>", f'<style data-e12="ficha-estados">\n{CSS_ESTADOS}</style>\n</helmet>', 1)
    props = {"estado": {"editor": "enum", "options": ESTADOS_FICHA, "default": ESTADOS_FICHA[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", """    const e = this.props.estado ?? 'Guardado';
    const nuevo = e === 'Recién creado';
    const sucio = ['Cambios sin guardar', 'Guardando', 'No se guardó', 'Conflicto'].includes(e);
    return {
      si: true, no: false,
      nombre: nuevo ? 'Inspección de obra' : 'Visita a cliente', prefijo: nuevo ? 'INS' : 'VIS', cant: nuevo ? '0' : '6',
      prefClase: nuevo ? '' : 'ro', prefErr: '', prefGuardado: nuevo ? 'INS' : 'VIS',
      prefAyuda: nuevo ? 'Las respuestas: INS-000001' : 'Las respuestas: VIS-000124',
      prefInfo: nuevo ? 'Se puede cambiar hasta la primera publicación.' : 'No cambia después de publicar.',
      textoEstado: nuevo ? 'Borrador' : 'Publicado · v3', claseEstado: nuevo ? 'off' : '',
      sucio, limpio: !sucio, guardando: e === 'Guardando', textoGuardar: e === 'Guardando' ? 'Guardando…' : 'Guardar cambios',
      conflicto: e === 'Conflicto',
      menuAbierto: e === 'Acciones de una pregunta', claseAbierta: e === 'Acciones de una pregunta' ? 'abierta' : '',
      conPreguntas: !nuevo, sinPreguntas: nuevo,
      toast: e === 'No se guardó' ? 'Algo salió mal. Probá de nuevo en un rato.' : e === 'Guardado' ? 'Guardamos el formulario.' : '',
      toastOk: e === 'Guardado', toastMal: e === 'No se guardó',
    };""")
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · ficha · Preguntas</title>", t)


# ---------------------------------------------------------------- FRM-Pregunta elegida (A, 13/10): el diálogo en español; el inglés, en su pestaña
ESTADOS_PREGUNTA = ["Texto corto", "Texto largo", "Número", "Fecha", "Sí o no", "Lista", "Nueva pregunta", "Sin texto", "Lista sin opciones",
                    "Cambiar el tipo"]
CSS_PREGUNTA = """.w-dlg { width: 600px; }
.f-chk { display: inline-flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--t1); min-height: 36px; }
.f-chk i { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--borde2); background: #fff; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; }
.f-chk i.on { background: var(--marca); border-color: var(--marca); color: #fff; }
.f-chk i:not(.on) svg { display: none; }
.f-op .ct { flex: 1; height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; padding: 0 12px; }
.f-ops .rt { font-size: 12.5px; font-weight: 600; color: var(--t2); }
.w-dlg .w-cmp.ancho { grid-column: 1 / -1; }
.w-dlg .w-cmp .ct.sel { display: flex; }
.w-dlg .w-cmp.abajo { justify-content: flex-end; }
.f-ops { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 8px; }
.f-op { display: flex; align-items: center; gap: 6px; }
.f-op .ct { flex: 1; }
.f-ops .cb-enl { align-self: flex-start; font-size: 13.5px; }
.f-aviso { grid-column: 1 / -1; display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 13px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.f-aviso svg { flex-shrink: 0; margin-top: 1px; }
"""
TILDE_CHK = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 12, "3")


def pregunta():
    fondo = ficha('<a class="cb cb-pri" href="FRM-Publicar.dc.html">Publicar</a>', ESTADO_VIS)
    ops = "".join(f'<div class="f-op"><div class="ct">{o}</div><button type="button" class="ib" aria-label="Acciones de {o}">{KEBAB}</button></div>'
                  for o in ["Seguimiento", "Venta nueva", "Reclamo"])
    cuerpo = (
        '<sc-if value="{{cambiaTipo}}" hint-placeholder-val="{{no}}"><div class="f-aviso" role="status">' + ALERTA
        + '<span>Con otro tipo es una pregunta nueva: las respuestas que ya llegaron quedan con la anterior.</span></div></sc-if>'
        f'<div class="w-cmp ancho"><span class="rt">Tipo</span><div class="ct sel">{{{{tipo}}}}{CHEV}</div></div>'
        '<div class="w-cmp ancho"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct {{pClase}}">{{pregunta}}</div>'
        '<sc-if value="{{pErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{pErr}}</span></sc-if></div>'
        '<div class="w-cmp ancho"><span class="rt">Ayuda</span><div class="ct ph">{{ayuda}}</div></div>'
        '<sc-if value="{{conLargo}}" hint-placeholder-val="{{no}}"><div class="w-cmp"><span class="rt">Largo máximo <span class="req">*</span>'
        + info("En caracteres.") + '</span><div class="ct">{{largo}}</div></div></sc-if>'
        f'<sc-if value="{{{{conDecimales}}}}" hint-placeholder-val="{{{{no}}}}"><div class="w-cmp"><span class="rt">Decimales <span class="req">*</span>'
        + info("De 0 a 6.") + f'</span><div class="ct sel">2{CHEV}</div></div></sc-if>'
        f'<sc-if value="{{{{noLista}}}}" hint-placeholder-val="{{{{si}}}}"><div class="w-cmp abajo {{{{chkAncho}}}}"><span class="f-chk"><i class="{{{{chkClase}}}}">{TILDE_CHK}</i>Obligatoria</span></div></sc-if>'
        '<sc-if value="{{esLista}}" hint-placeholder-val="{{no}}"><div class="f-ops"><span class="rt">Opciones <span class="req">*</span></span>'
        '<sc-if value="{{conOpciones}}" hint-placeholder-val="{{si}}">' + ops + '</sc-if>'
        '<sc-if value="{{sinOpciones}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">Agregá al menos una opción.</span></sc-if>'
        f'<button type="button" class="cb cb-enl">{MAS} Agregar opción</button>'
        f'<span class="f-chk"><i class="{{{{chkClase}}}}">{TILDE_CHK}</i>Obligatoria</span></div></sc-if>')
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">{{boton}}</button>'
    t = con_dialogo(fondo, dialogo("{{titulo}}", cuerpo, pie, una=False), CSS_PREGUNTA)
    props = {"tipo": {"editor": "enum", "options": ESTADOS_PREGUNTA, "default": ESTADOS_PREGUNTA[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", """    const e = this.props.tipo ?? 'Texto corto';
    // Los seis tipos con las preguntas de «Visita a cliente»; los demás estados, sobre una pregunta nueva o la de la lista.
    const P = {
      'Texto corto': ['Texto corto', 'Cliente', 1, '80'], 'Texto largo': ['Texto largo', 'Observaciones', 0, '600'], 'Número': ['Número', 'Monto estimado', 0, ''],
      'Fecha': ['Fecha', 'Fecha de la visita', 0, ''], 'Sí o no': ['Sí o no', '¿Se concretó la venta?', 0, ''], 'Lista': ['Lista', 'Motivo', 0, ''],
      'Nueva pregunta': ['Texto corto', '', 0, '80'], 'Sin texto': ['Texto corto', '', 0, '80'], 'Lista sin opciones': ['Lista', 'Motivo', 0, ''],
      'Cambiar el tipo': ['Texto largo', 'Cliente', 1, '600'],
    }[e];
    const tipo = P[0];
    const nueva = e === 'Nueva pregunta' || e === 'Sin texto';
    return {
      si: true, no: false,
      titulo: nueva ? 'Agregar pregunta' : 'Editar pregunta', boton: nueva ? 'Agregar pregunta' : 'Guardar pregunta',
      tipo, pregunta: P[1] || 'Por ejemplo, Cliente', pClase: (P[1] ? '' : 'ph ') + (e === 'Sin texto' ? 'mal' : ''),
      pErr: e === 'Sin texto' ? 'Escribí la pregunta.' : '',
      ayuda: 'Opcional', chkClase: P[2] ? 'on' : '',
      conLargo: tipo === 'Texto corto' || tipo === 'Texto largo', largo: P[3],
      conDecimales: tipo === 'Número', chkAncho: tipo === 'Fecha' || tipo === 'Sí o no' ? 'ancho' : '',
      esLista: tipo === 'Lista', noLista: tipo !== 'Lista',
      conOpciones: e !== 'Lista sin opciones', sinOpciones: e === 'Lista sin opciones',
      cambiaTipo: e === 'Cambiar el tipo',
    };""")
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · pregunta</title>", t)


# ---------------------------------------------------------------- FRM-Ingles (FRM-Ficha › Inglés) elegida (A, 13/10): todos los textos en una tabla
TEXTOS_EN = [
    ("Nombre del formulario", "Visita a cliente", "Customer visit"),
    ("Pregunta 1", "Cliente", "Customer"),
    ("Pregunta 2", "Fecha de la visita", "Visit date"),
    ("Pregunta 3", "¿Se concretó la venta?", "Was the sale closed?"),
    ("Pregunta 4", "Monto estimado", "Estimated amount"),
    ("Pregunta 5", "Motivo", "Reason"),
    ("Opción", "Seguimiento", "Follow-up"),
    ("Opción", "Venta nueva", "New sale"),
    ("Opción", "Reclamo", "Complaint"),
    ("Pregunta 6", "Observaciones", "Notes"),
    ("Botón final", "Enviar", "Send"),
]
FALTAN = {"Venta nueva", "Observaciones"}
CSS_INGLES = """.i-tab { display: grid; grid-template-columns: 150px minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: center; padding: 8px 16px; border-bottom: 1px solid var(--borde); min-height: 52px; box-sizing: border-box; }
.i-tab:last-child { border-bottom: 0; }
.i-tab.cab { min-height: 40px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.i-tab .q { font-size: 12.5px; color: var(--t3); }
.i-tab .q.op { padding-left: 14px; }
.i-tab .es { font-size: 13.5px; color: var(--t1); }
.i-tab .en { height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; padding: 0 12px; font-size: 13.5px; }
.i-tab .en.falta { border-color: oklch(0.72 0.15 70); background: oklch(0.985 0.02 85); color: oklch(0.5 0.12 70); }
.pv-falta { color: oklch(0.55 0.13 70); font-weight: 600; }
"""
ESTADOS_INGLES = ["Faltan 2", "Completo"]


def ingles():
    filas = []
    for q, es, en in TEXTOS_EN:
        op = " op" if q == "Opción" else ""
        if es in FALTAN:
            celda = (f'<sc-if value="{{{{faltan}}}}" hint-placeholder-val="{{{{si}}}}"><div class="en falta">Falta</div></sc-if>'
                     f'<sc-if value="{{{{completo}}}}" hint-placeholder-val="{{{{no}}}}"><div class="en">{en}</div></sc-if>')
        else:
            celda = f'<div class="en">{en}</div>'
        filas.append(f'<div class="i-tab"><span class="q{op}">{q}</span><span class="es">{es}</span>{celda}</div>')
    tabla = '<div class="w-caja"><div class="i-tab cab"><span></span><span>Español</span><span>Inglés</span></div>' + "".join(filas) + "</div>"
    prev = vista_previa().replace('<span class="on">Español</span><span>Inglés</span>', '<span>Español</span><span class="on">Inglés</span>')
    for a, b in [("Visita a cliente", "Customer visit"), (">Cliente<", ">Customer<"), ("Fecha de la visita (opcional)", "Visit date (optional)"),
                 ("Elegí una fecha", "Select a date"), ("¿Se concretó la venta? (opcional)", "Was the sale closed? (optional)"), (">Sí<", ">Yes<"),
                 ("Monto estimado (opcional)", "Estimated amount (optional)"), ("Usá punto para los decimales", "Use a period for decimals"),
                 ("Motivo (opcional)", "Reason (optional)"), ("Elegí una opción", "Select an option"),
                 ("Observaciones (opcional)", '<sc-if value="{{faltan}}" hint-placeholder-val="{{si}}"><span class="pv-falta">Falta</span></sc-if>'
                  '<sc-if value="{{completo}}" hint-placeholder-val="{{no}}">Notes</sc-if> (optional)'), (">Enviar<", ">Send<")]:
        assert prev.count(a) == 1, a
        prev = prev.replace(a, b)
    acciones = ('<sc-if value="{{faltan}}" hint-placeholder-val="{{si}}"><button type="button" class="cb cb-sec">Descartar cambios</button>'
                '<button type="button" class="cb cb-pri">Guardar cambios</button><a class="cb cb-sec" href="FRM-Publicar.dc.html">Publicar</a></sc-if>'
                '<sc-if value="{{completo}}" hint-placeholder-val="{{no}}"><a class="cb cb-pri" href="FRM-Publicar.dc.html">Publicar</a></sc-if>')
    banda_est = ESTADO_VIS + '<sc-if value="{{faltan}}" hint-placeholder-val="{{si}}"><span class="f-sucio">Cambios sin guardar</span></sc-if>'
    t = ficha(acciones, banda_est, pestana="Inglés", cuerpo_pestana='<div class="f-cols" style="margin-top: 16px;"><div class="f-pila">' + tabla + "</div>" + prev + "</div>")
    t = t.replace('aria-selected="true" href="FRM-Ingles.dc.html">Inglés</a>',
                  'aria-selected="true" href="FRM-Ingles.dc.html">Inglés<sc-if value="{{faltan}}" hint-placeholder-val="{{si}}"> <span class="c falta">2</span></sc-if></a>')
    t = t.replace("</helmet>", f'<style data-e12="ingles">\n{CSS_INGLES}</style>\n</helmet>', 1)
    props = {"estado": {"editor": "enum", "options": ESTADOS_INGLES, "default": ESTADOS_INGLES[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", """    const e = this.props.estado ?? 'Faltan 2';
    return { si: true, no: false, faltan: e === 'Faltan 2', completo: e === 'Completo' };""")
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · ficha · Inglés</title>", t)


# ---------------------------------------------------------------- FRM-Prefijo: el prefijo en la caja «Datos», con sus estados
ESTADOS_PREFIJO = ["Propuesto", "Editado", "Tomado", "Formato inválido", "Bloqueado"]


def prefijo():
    t = ficha_final()
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_FICHA, ensure_ascii=False, separators=(",", ":")) + ',"default":"Guardado"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_PREFIJO, ensure_ascii=False, separators=(",", ":")) + ',"default":"Propuesto"')
    t = t.replace("""    const e = this.props.estado ?? 'Guardado';
    const nuevo = e === 'Recién creado';
    const sucio = ['Cambios sin guardar', 'Guardando', 'No se guardó', 'Conflicto'].includes(e);""", """    const pe = this.props.estado ?? 'Propuesto';
    // El prefijo de un formulario nuevo se edita hasta la primera publicación; el de uno publicado, no.
    const e = pe === 'Bloqueado' ? 'Bloqueado' : 'Recién creado';
    const nuevo = e === 'Recién creado';
    const sucio = ['Editado', 'Tomado', 'Formato inválido'].includes(pe);
    const PREF = { Propuesto: 'INS', Editado: 'INSP', Tomado: 'VIS', 'Formato inválido': '1NS', Bloqueado: 'VIS' };""")
    t = t.replace("""      nombre: nuevo ? 'Inspección de obra' : 'Visita a cliente', prefijo: nuevo ? 'INS' : 'VIS', cant: nuevo ? '0' : '6',
      prefClase: nuevo ? '' : 'ro', prefErr: '', prefGuardado: nuevo ? 'INS' : 'VIS',
      prefAyuda: nuevo ? 'Las respuestas: INS-000001' : 'Las respuestas: VIS-000124',""", """      nombre: nuevo ? 'Inspección de obra' : 'Visita a cliente', prefijo: PREF[pe], cant: nuevo ? '0' : '6',
      prefClase: pe === 'Bloqueado' ? 'ro' : pe === 'Tomado' || pe === 'Formato inválido' ? 'mal' : '',
      prefErr: pe === 'Tomado' ? 'Ese prefijo ya lo usa otro formulario.' : pe === 'Formato inválido' ? 'Usá letras y números, empezando con una letra.' : '',
      prefAyuda: 'Las respuestas: ' + (pe === 'Bloqueado' ? 'VIS-000124' : pe === 'Editado' ? 'INSP-000001' : 'INS-000001'),
      prefGuardado: nuevo ? 'INS' : 'VIS',""")
    t = t.replace("      toast: e === 'No se guardó' ? 'Algo salió mal. Probá de nuevo en un rato.' : e === 'Guardado' ? 'Guardamos el formulario.' : '',",
                  "      toast: '',")
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · prefijo</title>", t)


CSS_GRILLA = """.g-det { display: grid; grid-template-columns: 170px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; background: #fff; }
.g-det > span { padding: 9px 12px; border-top: 1px solid var(--borde); font-size: 13.5px; line-height: 1.45; color: var(--t1); min-width: 0; }
.g-det > span:nth-child(-n+2) { border-top: 0; }
.g-det > .k { background: oklch(0.975 0.008 78); color: var(--t2); font-weight: 500; border-right: 1px solid var(--borde); }
.g-det .g-vacio { color: var(--t3); font-style: italic; }
.g-det .acc { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.g-tit { font-size: 12.5px; font-weight: 600; color: var(--t2); margin-bottom: 6px; }
"""


def grilla(filas):
    """filas: [(rótulo, valor)]; valor None se muestra «Sin respuesta»."""
    return '<div class="g-det">' + "".join(f'<span class="k">{k}</span>' + (f"<span>{v}</span>" if v is not None else '<span class="g-vacio">Sin respuesta</span>')
                                           for k, v in filas) + "</div>"


# ---------------------------------------------------------------- FRM-Publicar elegido (A, 13/10): la comprobación, con los problemas en el diálogo
ESTADOS_PUBLICAR = ["Sin problemas", "Con problemas", "Primera publicación", "Borrador sin guardar", "Otra publicación en curso",
                    "WhatsApp no disponible", "Comprobando"]
CSS_PUBLICAR = """.w-dlg { width: 600px; }
.w-dlg .df .cb[disabled] { opacity: 0.55; cursor: default; }
.p-sec { display: flex; flex-direction: column; gap: 8px; }
.p-sec + .p-sec { margin-top: 14px; }
.p-tit { font-size: 12.5px; font-weight: 600; color: var(--t2); }
.p-li { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: var(--t1); line-height: 1.45; }
.p-li .pt { width: 6px; height: 6px; border-radius: 50%; background: var(--t3); margin-top: 7px; flex-shrink: 0; }
.p-prob { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid oklch(0.88 0.05 25); background: var(--peligro-t); border-radius: 8px; font-size: 13px; }
.p-prob .mal { color: oklch(0.55 0.2 25); display: inline-flex; margin-top: 1px; }
.p-prob .tx { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.p-prob .tx b { font-weight: 600; }
.p-prob .tx span { color: oklch(0.45 0.17 25); }
.p-prob a { font-weight: 600; color: var(--marca-tx); text-decoration: none; white-space: nowrap; }
.p-aviso { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 13.5px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.p-aviso.mal { background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.p-aviso svg { flex-shrink: 0; margin-top: 1px; }
.p-esq { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
.p-esq span { height: 12px; border-radius: 6px; background: oklch(0.93 0.01 78); }
"""


def publicar():
    t = ficha_final()
    li = lambda x: f'<span class="p-li"><span class="pt"></span>{x}</span>'  # noqa: E731
    cuerpo = (
        '<sc-if value="{{dCambios}}" hint-placeholder-val="{{si}}"><div class="p-sec"><span class="p-tit">Qué cambia en la versión 4</span>'
        + grilla([("Cliente", "Cambió el texto."), ("Motivo", "Suma la opción «Venta nueva».")]) + "</div></sc-if>"
        '<sc-if value="{{dFijo}}" hint-placeholder-val="{{no}}"><div class="p-sec"><span class="p-tit">Queda fijo al publicar</span>'
        + grilla([("Prefijo", "INS · las respuestas van a ser INS-000001, INS-000002…")]) + "</div></sc-if>"
        '<sc-if value="{{dProblemas}}" hint-placeholder-val="{{no}}"><div class="p-sec"><span class="p-tit">Antes hay que resolver</span>'
        f'<div class="p-prob"><span class="mal">{ALERTA}</span><span class="tx"><b>{{{{probTit}}}}</b><span>{{{{probTx}}}}</span></span><a href="{{{{probHref}}}}">{{{{probAcc}}}}</a></div></div></sc-if>'
        f'<sc-if value="{{{{dSinGuardar}}}}" hint-placeholder-val="{{{{no}}}}"><div class="p-aviso" role="status">{ALERTA}<span>Hay cambios sin guardar. Guardalos para publicarlos.</span></div></sc-if>'
        f'<sc-if value="{{{{dEnCurso}}}}" hint-placeholder-val="{{{{no}}}}"><div class="p-aviso" role="status">{ALERTA}<span>Ya hay una publicación en curso.</span></div></sc-if>'
        f'<sc-if value="{{{{dSinWa}}}}" hint-placeholder-val="{{{{no}}}}"><div class="p-aviso mal" role="alert">{ALERTA}<span>WhatsApp no está disponible: no hay un número conectado.</span></div></sc-if>'
        '<sc-if value="{{dComprobando}}" hint-placeholder-val="{{no}}"><div class="p-sec"><span class="p-tit">Comprobando…</span><div class="p-esq">'
        '<span style="width: 85%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div></div></sc-if>')
    pie = ('<button type="button" class="cb cb-sec">Cancelar</button>'
           '<sc-if value="{{pPublicar}}" hint-placeholder-val="{{si}}"><button type="button" class="cb cb-pri" disabled="{{pApagado}}">{{pTexto}}</button></sc-if>'
           '<sc-if value="{{pGuardar}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-pri">Guardar cambios</button></sc-if>'
           '<sc-if value="{{pVer}}" hint-placeholder-val="{{no}}"><a class="cb cb-pri" href="FRM-Publicacion.dc.html">Ver la publicación</a></sc-if>'
           '<sc-if value="{{pWa}}" hint-placeholder-val="{{no}}"><a class="cb cb-pri" href="WA-Admin-Vacio.dc.html">Ir a WhatsApp</a></sc-if>')
    t = con_dialogo(t, dialogo("Publicar «{{nombre}}»", cuerpo, pie), CSS_PUBLICAR + CSS_GRILLA)
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_FICHA, ensure_ascii=False, separators=(",", ":")) + ',"default":"Guardado"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_PUBLICAR, ensure_ascii=False, separators=(",", ":")) + ',"default":"Sin problemas"')
    t = t.replace("""    const e = this.props.estado ?? 'Guardado';
    const nuevo = e === 'Recién creado';
    const sucio = ['Cambios sin guardar', 'Guardando', 'No se guardó', 'Conflicto'].includes(e);""", """    const d = this.props.estado ?? 'Sin problemas';
    // El diálogo se abre sobre la ficha: la del formulario nuevo para la primera publicación; con cambios, si no se guardaron.
    const e = d === 'Primera publicación' ? 'Recién creado' : d === 'Borrador sin guardar' ? 'Cambios sin guardar' : 'Ficha';
    const nuevo = e === 'Recién creado';
    const sucio = e === 'Cambios sin guardar';
    const versionNueva = ['Sin problemas', 'Con problemas'].includes(d);""")
    t = t.replace("      toast: e === 'No se guardó' ? 'Algo salió mal. Probá de nuevo en un rato.' : e === 'Guardado' ? 'Guardamos el formulario.' : '',",
                  """      toast: '',
      dCambios: versionNueva, dFijo: nuevo, dProblemas: d === 'Con problemas' || nuevo,
      probTit: nuevo ? 'Sin preguntas' : 'Pregunta 1 · Cliente visitado y sucursal',
      probTx: nuevo ? 'Agregá al menos una pregunta.' : 'No entra en WhatsApp: 27 de 20 caracteres, en español y en inglés.',
      probAcc: nuevo ? 'Agregar pregunta' : 'Editar', probHref: nuevo ? 'FRM-Pregunta.dc.html' : 'FRM-Pregunta.dc.html',
      dSinGuardar: d === 'Borrador sin guardar', dEnCurso: d === 'Otra publicación en curso', dSinWa: d === 'WhatsApp no disponible',
      dComprobando: d === 'Comprobando',
      pPublicar: ['Sin problemas', 'Con problemas', 'Primera publicación', 'Comprobando'].includes(d),
      pApagado: d !== 'Sin problemas', pTexto: nuevo ? 'Publicar versión 1' : 'Publicar versión 4',
      pGuardar: d === 'Borrador sin guardar', pVer: d === 'Otra publicación en curso', pWa: d === 'WhatsApp no disponible',""")
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · publicar</title>", t)


# ---------------------------------------------------------------- FRM-Publicacion (FRM-Ficha › Publicación) elegida (A, 13/10): palabra corta con ⓘ
ESTADOS_PUBLICACION = ["Publicando", "Sin confirmar", "Publicado · v4", "No se pudo publicar", "Sin publicar"]
CSS_PUBLICACION = """.pb-g { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 10px 16px; padding: 16px; font-size: 13.5px; align-items: center; }
.pb-g .k { color: var(--t3); font-size: 13px; }
.pb-acc { display: flex; gap: 8px; align-items: center; }
.pb-seg { display: inline-flex; border: 1px solid var(--borde); border-radius: 8px; overflow: hidden; font-size: 12.5px; }
.pb-seg span { padding: 6px 12px; color: var(--t2); background: #fff; }
.pb-seg span.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.pb-probs { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.pb-in { padding: 16px; }
.pb-vacio { padding: 20px 16px; font-size: 14px; font-weight: 600; color: var(--t1); }
.w-est.pend { color: oklch(0.5 0.12 70); }
.w-est.pend::before { background: oklch(0.72 0.15 70); }
.ac .cb.apag { opacity: 0.55; pointer-events: none; }
"""


def publicacion():
    curso = ('<sc-if value="{{conCurso}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="f-cab"><span>Versión 4</span></div><div class="pb-in"><div class="g-det">'
             '<span class="k">Estado</span><span><span class="w-est {{curClase}}">{{curEstado}}</span>' + info("{{curInfo}}") + '</span>'
             '<span class="k">Pedida</span><span>Hoy, 10:15 · Lucía Fernández</span></div>'
             '<sc-if value="{{conProblemas}}" hint-placeholder-val="{{no}}"><div class="pb-probs">'
             f'<div class="p-prob"><span class="mal">{ALERTA}</span><span class="tx"><b>Pregunta 5 · Motivo</b><span>WhatsApp no aceptó la opción «Venta nueva» en inglés.</span></span>'
             '<a href="FRM-Ingles.dc.html">Editar</a></div></div></sc-if></div></div></sc-if>')
    activa = ('<div class="w-caja"><div class="f-cab"><span>Versión activa</span></div>'
              '<sc-if value="{{conActiva}}" hint-placeholder-val="{{si}}"><div class="pb-in"><div class="g-det"><span class="k">Versión</span><span>{{activa}}</span>'
              '<span class="k">Vista previa de WhatsApp</span><span class="acc"><span class="pb-seg"><span class="on">Español</span><span>Inglés</span></span>'
              '<a class="cb cb-sec" href="#">Abrir vista previa</a></span></div></div></sc-if>'
              '<sc-if value="{{sinActiva}}" hint-placeholder-val="{{no}}"><div class="pb-vacio">Todavía no se publicó.</div></sc-if></div>')
    banda_est = ('<span class="w-est {{claseEstado}}">{{textoEstado}}</span><span>Prefijo {{prefijo}}</span>'
                 '<sc-if value="{{conCurso}}" hint-placeholder-val="{{no}}"><span class="w-est {{curClase}}">{{curBanda}}</span></sc-if>')
    t = ficha('<a class="cb cb-pri {{pubApag}}" href="FRM-Publicar.dc.html">Publicar</a>', banda_est, pestana="Publicación",
              cuerpo_pestana='<div class="f-pila" style="margin-top: 16px; max-width: 880px;">' + curso + activa + "</div>")
    t = t.replace("<h1>Visita a cliente</h1>", "<h1>{{nombre}}</h1>").replace("Inicio / Formularios / Visita a cliente", "Inicio / Formularios / {{nombre}}")
    t = t.replace('Preguntas <span class="c">6</span>', 'Preguntas <span class="c">{{cant}}</span>')
    t = t.replace("</helmet>", f'<style data-e12="publicacion">\n{CSS_PUBLICACION}{CSS_PUBLICAR}{CSS_GRILLA}</style>\n</helmet>', 1)
    props = {"estado": {"editor": "enum", "options": ESTADOS_PUBLICACION, "default": ESTADOS_PUBLICACION[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", """    const e = this.props.estado ?? 'Publicando';
    const nuevo = e === 'Sin publicar';
    const enCurso = e === 'Publicando' || e === 'Sin confirmar';
    const CUR = {
      'Publicando': ['pend', 'Publicando', 'Publicando v4', 'WhatsApp está revisando el formulario. Puede tardar unos minutos.'],
      'Sin confirmar': ['pend', 'Sin confirmar', 'Sin confirmar v4', 'No sabemos si WhatsApp la recibió. La estamos comprobando.'],
      'No se pudo publicar': ['mal', 'No se pudo publicar', 'No se pudo publicar v4', 'WhatsApp no aceptó una pregunta. Corregila y publicá de nuevo.'],
    }[e] || ['', '', '', ''];
    return {
      si: true, no: false,
      nombre: nuevo ? 'Inspección de obra' : 'Visita a cliente', prefijo: nuevo ? 'INS' : 'VIS', cant: nuevo ? '0' : '6',
      textoEstado: nuevo ? 'Borrador' : e === 'Publicado · v4' ? 'Publicado · v4' : 'Publicado · v3', claseEstado: nuevo ? 'off' : '',
      conCurso: !!CUR[0], curClase: CUR[0], curEstado: CUR[1], curBanda: CUR[2], curInfo: CUR[3],
      conProblemas: e === 'No se pudo publicar',
      conActiva: !nuevo, sinActiva: nuevo,
      activa: e === 'Publicado · v4' ? '4 · publicada hoy, 10:21' : '3 · publicada el 08/10/2026',
      pubApag: enCurso ? 'apag' : '',
    };""")
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · ficha · Publicación</title>", t)


# ---------------------------------------------------------------- El chat de Internos: WA-Chats con la bandeja Internos y un empleado
CHATS = (PROJ / "WA-Chats.dc.html").read_text(encoding="utf-8")
NOTA = re.search(r'<button type="button" class="o-nt" aria-label="Nota interna" aria-pressed="false" title="Nota interna">(<svg.*?</svg>)</button>', CHATS, re.S).group(1)
CSS_CHAT = """.w-m .gl .f-bt { display: block; margin-top: 8px; padding-top: 8px; border-top: 1px solid oklch(0.85 0.04 180); text-align: center; font-weight: 600; color: var(--marca-tx); }
.f-tarj { display: flex; flex-direction: column; gap: 2px; }
.f-tarj .f-tt { font-size: 12px; color: var(--t3); }
"""


def chat_internos(escritura=None, overlay="", mensajes_extra="", css=""):
    t = CHATS
    i = t.index('<div class="w-chat">')
    j = t.index("</div></div></div>\n</x-dc>")
    bandeja = ('<div class="w-bandeja"><div class="o-seg" role="tablist" aria-label="Bandeja"><span role="tab" aria-selected="false">Clientes <span class="c">5</span></span>'
               '<span class="on" role="tab" aria-selected="true">Internos <span class="c">2</span></span></div>'
               f'<div class="filtro"><span class="w-bus">{BUSCAR} Buscar por nombre o número</span><span class="w-pil">Equipo: todos {CHEV}</span><span class="w-pil">Todos {CHEV}</span></div>'
               '<div class="w-conv on"><span class="w-av">TA</span><span class="tx"><span class="l1"><b>Tomás Acosta</b><span>{{hora}}</span></span>'
               '<span class="l2"><span>{{vistaPrevia}}</span></span><span class="l3">Carga de pedidos · Lucía Fernández</span></span></div>'
               '<div class="w-conv "><span class="w-av">MP</span><span class="tx"><span class="l1"><b>Martín Paz</b><span>Ayer</span></span>'
               '<span class="l2"><span>Mañana paso por el depósito.</span></span><span class="l3">Carga de pedidos · Lucía Fernández</span></span></div></div>')
    esc = escritura or (f'<div class="w-escr"><button type="button" class="o-nt" aria-label="Nota interna" aria-pressed="false" title="Nota interna">{NOTA}</button>'
                        '<span class="area">Escribí un mensaje</span><button type="button" class="cb cb-pri">Enviar</button></div>')
    hilo = ('<div class="w-hilo"><div class="hc"><span class="w-av">TA</span><span class="tx"><b>Tomás Acosta</b><span>+54 9 11 5555-4521 · Empleado · Delta S.A.</span></span>'
            f'<span class="acc"><a class="cb cb-sec ch" href="WA-Chats-Pasar.dc.html">Pasar</a><button type="button" class="ib" aria-label="Acciones de Tomás Acosta">{KEBAB}</button></span></div>'
            '<div class="w-msjs"><span class="w-dia">Hoy</span>'
            '<div class="w-m ent"><span class="gl">Hola, Lucía. Ya terminé la visita en Ferretería Rosales.</span><span class="pie">10:48</span></div>'
            '<span class="o-sis">Lucía Fernández tomó la conversación</span>'
            '<div class="w-m sal"><span class="gl">Genial, Tomás. Te mando el formulario de la visita.</span><span class="pie">Lucía Fernández · 10:50</span></div>'
            + mensajes_extra + "</div>" + esc + "</div>")
    t = t[:i] + '<div class="w-chat">' + bandeja + hilo + "</div>" + t[j:]
    if overlay:
        k = t.rindex("</div>\n</x-dc>")
        t = t[:k] + overlay + t[k:]
    return t.replace("</helmet>", f'<style data-e12="chat">\n{CSS_DLG}{CSS_CHAT}{css}</style>\n</helmet>', 1)


# ---------------------------------------------------------------- WA-Chats-Formulario elegido (A, 13/10): botón «Formulario» y diálogo con desplegable
ESTADOS_CHAT = ["Con el botón", "Elegir el formulario", "Mandando", "En cola", "No se pudo mandar", "Ventana cerrada", "No es empleado",
                "Sin formularios", "Envío pendiente"]
MENSAJE = "Completá los datos de la visita a Ferretería Rosales."
RELOJ = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 14)
CSS_ENVIO = """.w-dlg { width: 600px; }
.w-dlg .w-cmp.ancho { grid-column: 1 / -1; }
.w-dlg .w-cmp .ct.area { height: 72px; white-space: normal; line-height: 1.45; padding-top: 9px; }
.w-dlg .w-cmp .ct.sel { display: flex; }
.c-cont { align-self: flex-end; font-size: 12px; color: var(--t3); }
.c-prev { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 10px; background: oklch(0.95 0.012 150); }
.c-prev .gl { align-self: flex-end; max-width: 80%; background: oklch(0.93 0.05 165); border-radius: 10px; padding: 10px 12px; font-size: 13.5px; color: var(--t1); }
.c-prev .gl .f-bt { display: block; margin-top: 8px; padding-top: 8px; border-top: 1px solid oklch(0.82 0.05 165); text-align: center; font-weight: 600; color: var(--marca-tx); }
.c-prev .idi { align-self: flex-end; font-size: 12px; color: var(--t3); }
.w-escr .cb-sec { flex: 0 0 auto; }
.w-escr .cb[disabled] { opacity: 0.5; cursor: default; }
.f-off { display: inline-flex; align-items: center; gap: 2px; }
.w-escr .area.v24 { color: oklch(0.5 0.12 70); display: inline-flex; align-items: center; gap: 6px; }
.w-m .gl .f-tt { display: block; margin-bottom: 4px; font-size: 12px; font-weight: 600; color: var(--marca-tx); }
.w-m .pie.mal { color: oklch(0.5 0.19 25); }
.w-m .pie .lnk2 { font-weight: 600; color: var(--marca-tx); margin-left: 6px; }
.w-m .pie .rel { display: inline-flex; vertical-align: -2px; margin-right: 4px; }
"""


def chat_formulario():
    nota = f'<button type="button" class="o-nt" aria-label="Nota interna" aria-pressed="false" title="Nota interna">{NOTA}</button>'
    boton = (f'<sc-if value="{{{{btnOn}}}}" hint-placeholder-val="{{{{si}}}}"><button type="button" class="cb cb-sec">{ICONO} Formulario</button></sc-if>'
             f'<sc-if value="{{{{btnOff}}}}" hint-placeholder-val="{{{{no}}}}"><span class="f-off"><button type="button" class="cb cb-sec" disabled>{ICONO} Formulario</button>'
             + info("{{motivo}}") + "</span></sc-if>")
    esc = ('<div class="w-escr">' + nota
           + '<sc-if value="{{abierta}}" hint-placeholder-val="{{si}}"><span class="area">Escribí un mensaje</span>' + boton
           + '<button type="button" class="cb cb-pri">Enviar</button></sc-if>'
           + f'<sc-if value="{{{{cerrada}}}}" hint-placeholder-val="{{{{no}}}}"><span class="area v24">{RELOJ} Pasaron 24 horas</span>' + boton
           + '<a class="cb cb-pri" href="WA-Chats-Plantilla.dc.html">Elegir plantilla</a></sc-if></div>')
    enviado = ('<sc-if value="{{conEnvio}}" hint-placeholder-val="{{no}}"><div class="w-m sal"><span class="gl"><span class="f-tt">Formulario · Visita a cliente</span>'
               f'{MENSAJE}<span class="f-bt">Abrir formulario</span></span>'
               '<span class="pie {{pieClase}}"><sc-if value="{{enCola}}" hint-placeholder-val="{{no}}"><span class="rel">' + RELOJ + '</span></sc-if>{{pie}}'
               '<sc-if value="{{falla}}" hint-placeholder-val="{{no}}"><span class="lnk2">Reintentar</span></sc-if></span></div></sc-if>')
    prev = (f'<div class="c-prev"><span class="gl">{MENSAJE}<span class="f-bt">Abrir formulario</span></span>'
            '<span class="idi">Le llega en español, el idioma de su cuenta.</span></div>')
    cuerpo = (f'<div class="w-cmp ancho"><span class="rt">Formulario <span class="req">*</span></span><div class="ct sel">Visita a cliente · VIS{CHEV}</div></div>'
              f'<div class="w-cmp ancho"><span class="rt">Mensaje <span class="req">*</span></span><div class="ct area">{MENSAJE}</div><span class="c-cont">53 / 1024</span></div>'
              + prev)
    pie = ('<button type="button" class="cb cb-sec" disabled="{{mandando}}">Cancelar</button>'
           '<button type="button" class="cb cb-pri" disabled="{{mandando}}">{{textoMandar}}</button>')
    overlay = '<sc-if value="{{dialogo}}" hint-placeholder-val="{{no}}">' + dialogo("Mandar formulario a Tomás Acosta", cuerpo, pie, una=False) + "</sc-if>"
    t = chat_internos(esc, overlay, mensajes_extra=enviado, css=CSS_ENVIO)
    props = {"estado": {"editor": "enum", "options": ESTADOS_CHAT, "default": ESTADOS_CHAT[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", """    const e = this.props.estado ?? 'Con el botón';
    // El motivo de un botón apagado va en su ⓘ (WhatsApp.Chat.WindowClosed, NotEmployee, FormUnavailable, SendPending).
    const MOTIVO = {
      'Ventana cerrada': 'Pasaron 24 horas desde su último mensaje.',
      'No es empleado': 'Ya no es empleado activo de la organización.',
      'Sin formularios': 'No hay formularios publicados para esta persona.',
      'Envío pendiente': 'Ya tiene un formulario sin responder.',
    };
    const envio = ['En cola', 'No se pudo mandar', 'Envío pendiente'].includes(e);
    return {
      si: true, no: false,
      abierta: e !== 'Ventana cerrada', cerrada: e === 'Ventana cerrada',
      btnOn: !MOTIVO[e], btnOff: !!MOTIVO[e], motivo: MOTIVO[e] || '',
      dialogo: e === 'Elegir el formulario' || e === 'Mandando', mandando: e === 'Mandando', textoMandar: e === 'Mandando' ? 'Mandando…' : 'Mandar',
      conEnvio: envio, enCola: e === 'En cola', falla: e === 'No se pudo mandar',
      pie: e === 'En cola' ? 'En cola · 10:51' : e === 'No se pudo mandar' ? 'No se pudo mandar' : 'Lucía Fernández · 10:51',
      pieClase: e === 'No se pudo mandar' ? 'mal' : '',
      hora: envio ? '10:51' : '10:50',
      vistaPrevia: envio ? 'Vos: Formulario · Visita a cliente' : 'Vos: Genial, Tomás. Te mando el formulario de la visita.',
    };""")
    return re.sub(r"<title>[^<]*</title>", "<title>WhatsApp · chat de Internos · mandar formulario</title>", t)


# ---------------------------------------------------------------- WA-Chats-Respuesta elegida (D, 13/10): renglones con el valor a la derecha, plegada
ESTADOS_RESPUESTA = ["Esperando respuesta", "Recibida", "Recibida, desplegada", "Solo el número", "Rechazada", "Vencida"]
VALORES_VIS = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "No"),
               ("Monto estimado", "0"), ("Motivo", "Seguimiento"), ("Observaciones", None)]
CSS_RESPUESTA = """.w-m.ent:has(.r-gl) { width: 82%; }
.w-m.ent .gl.r-gl { width: 100%; box-sizing: border-box; padding: 0; overflow: hidden; background: #fff; }
.r-cab { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
.r-gl .r-cab + * { border-top: 1px solid var(--borde); }
.r-cab .ic { width: 32px; height: 32px; border-radius: 8px; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.r-cab .ic.mal { background: var(--peligro-t); color: oklch(0.55 0.2 25); }
.r-cab .t { flex: 1; display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.r-cab .t b { font-size: 14px; font-weight: 600; }
.r-cab .t small { font-size: 12px; color: var(--t3); }
.r-cab .t small.mal { color: oklch(0.5 0.19 25); font-weight: 500; }
.r-num { font-size: 12.5px; font-weight: 700; letter-spacing: 0.03em; padding: 3px 8px; border-radius: 6px; background: oklch(0.945 0.018 76); color: var(--t1); }
.r-mas { display: block; padding: 9px 12px; border-top: 1px solid var(--borde); font-size: 13px; font-weight: 600; color: var(--marca-tx); text-align: center; cursor: pointer; }
.r-tk { display: flex; flex-direction: column; padding: 4px 12px; }
.r-tk > div { display: flex; align-items: baseline; gap: 8px; padding: 7px 0; border-top: 1px dashed var(--borde2); font-size: 13.5px; }
.r-tk > div:first-child { border-top: 0; }
.r-tk .k { color: var(--t2); }
.r-tk .v { margin-left: auto; font-weight: 600; text-align: right; }
.r-tk .v.vac { font-weight: 400; font-style: italic; color: var(--t3); }
.w-m .pie.amb { color: oklch(0.5 0.12 70); }
"""


def respuesta():
    def fila_v(k, x, oculta=False):
        v = '<span class="v vac">Sin respuesta</span>' if x is None else f'<span class="v">{x}</span>'
        d = f'<div><span class="k">{k}</span>{v}</div>'
        return f'<sc-if value="{{{{todas}}}}" hint-placeholder-val="{{{{no}}}}">{d}</sc-if>' if oculta else d
    filas = "".join(fila_v(k, x, oculta=i >= 3) for i, (k, x) in enumerate(VALORES_VIS))
    enviado = (f'<div class="w-m sal"><span class="gl"><span class="f-tt">Formulario · Visita a cliente</span>{MENSAJE}<span class="f-bt">Abrir formulario</span></span>'
               '<span class="pie {{pieClase}}">{{pieEnvio}}</span></div>')
    tarjeta = ('<sc-if value="{{llego}}" hint-placeholder-val="{{si}}"><div class="w-m ent"><span class="gl r-gl">'
               f'<div class="r-cab"><span class="ic {{{{icClase}}}}">{ICONO}</span><span class="t"><b>Visita a cliente</b><small class="{{{{subClase}}}}">{{{{sub}}}}</small></span>'
               '<sc-if value="{{conNumero}}" hint-placeholder-val="{{si}}"><span class="r-num">VIS-000123</span></sc-if>'
               '<sc-if value="{{rechazada}}" hint-placeholder-val="{{no}}">' + info("Llegó un valor que el formulario no acepta. Mandalo de nuevo.") + "</sc-if>"
               '<sc-if value="{{sinPermiso}}" hint-placeholder-val="{{no}}">' + info("Para ver las respuestas hace falta el permiso «Ver respuestas».") + "</sc-if></div>"
               '<sc-if value="{{conValores}}" hint-placeholder-val="{{si}}"><div class="r-tk">' + filas + "</div>"
               '<span class="r-mas" onClick="{{alternar}}">{{textoMas}}</span></sc-if>'
               '</span><span class="pie">11:04</span></div></sc-if>')
    t = chat_internos(None, mensajes_extra=enviado + tarjeta, css=CSS_ENVIO + CSS_RESPUESTA)
    props = {"estado": {"editor": "enum", "options": ESTADOS_RESPUESTA, "default": "Recibida", "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", """    const e = this.state.e ?? (this.props.estado ?? 'Recibida');
    const llego = ['Recibida', 'Recibida, desplegada', 'Solo el número', 'Rechazada'].includes(e);
    const todas = e === 'Recibida, desplegada';
    return {
      si: true, no: false,
      llego, conValores: e === 'Recibida' || todas, todas,
      conNumero: e !== 'Rechazada', rechazada: e === 'Rechazada', sinPermiso: e === 'Solo el número',
      sub: e === 'Rechazada' ? 'La respuesta no se pudo guardar' : 'Respuesta del formulario · versión 3',
      subClase: e === 'Rechazada' ? 'mal' : '', icClase: e === 'Rechazada' ? 'mal' : '',
      textoMas: todas ? 'Ver menos' : 'Ver las 6 respuestas',
      alternar: () => this.setState({ e: todas ? 'Recibida' : 'Recibida, desplegada' }),
      pieEnvio: e === 'Esperando respuesta' ? 'Lucía Fernández · 10:51 · Esperando respuesta' : e === 'Vencida' ? 'Lucía Fernández · 10:51 · Venció sin respuesta' : 'Lucía Fernández · 10:51',
      pieClase: e === 'Esperando respuesta' ? 'amb' : '',
      hora: llego ? '11:04' : '10:51',
      vistaPrevia: llego ? 'Respuesta del formulario' : 'Vos: Formulario · Visita a cliente',
    };""")
    return re.sub(r"<title>[^<]*</title>", "<title>WhatsApp · chat de Internos · respuesta del formulario</title>", t)


# ================================================================ Teléfono (el teléfono es una app: barra, título en la barra, hojas y «+»)
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import campo as tcampo, hoja as thoja  # noqa: E402

TBASE = (PROJ / "M-WA-Plantillas.dc.html").read_text(encoding="utf-8")
TKEBAB = re.search(r'<button type="button" class="ap-ib" aria-label="Acciones de Pedido listo">(<svg.*?</svg>)</button>', TBASE, re.S).group(1)
TINFO = re.search(r'<button type="button" class="ap-i" aria-label="Por qué la rechazaron">(<svg.*?</svg>)</button>', TBASE, re.S).group(1)
TVOLVER = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-WA-Menu\.dc\.html">(<svg.*?</svg>)</a>', TBASE, re.S).group(1)
TFAB = re.search(r'<a class="ap-fab" aria-label="Nueva plantilla" href="M-WA-Plantilla-Nueva\.dc\.html">(<svg.*?</svg>)</a>', TBASE, re.S).group(1)
TLUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', 22)
CSS_TEL = """.ap-tabs { display: flex; border-bottom: 1px solid var(--borde); flex-shrink: 0; }
.ap-tabs > span, .ap-tabs > a { flex: 1; text-align: center; padding: 12px 6px; font-size: 15px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; text-decoration: none; }
.ap-tabs > .on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.ap-tabs .c { margin-left: 4px; font-weight: 500; color: var(--t3); padding: 0 !important; border: 0 !important; flex: none !important; }
.ap-tabs > a, .ap-tabs > span { display: flex; align-items: center; justify-content: center; }
.ap-tabs .c.falta { color: oklch(0.55 0.13 70); }
.ap-vacio { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 24px; text-align: center; font-size: 16px; font-weight: 600; color: var(--t1); }
.ap-vacio .cb { height: 44px; padding: 0 20px; }
.ap-esq { display: flex; flex-direction: column; gap: 18px; padding: 20px; }
.ap-esq span { height: 14px; border-radius: 7px; background: oklch(0.93 0.01 78); }
.ap-fila .l1 .pre { font-size: 13px; color: var(--t3); }
.ap-cmp .ct.ph { color: var(--t3); }
.w-est.pend { color: oklch(0.5 0.12 70); }
.w-est.pend::before { background: oklch(0.72 0.15 70); }
"""


def pagina_tel(titulo, sub, cuerpo, volver="M-WA-Menu.dc.html", fab="", estados=None, js="", css="", extra=""):
    t = TBASE
    i = t.index('<div class="ap-bar int">')
    j = t.index('<nav class="ap-nav"')
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{volver}">{TVOLVER}</a><div class="tit"><h1>{titulo}</h1><span class="sub">{sub}</span></div>'
           f'<button type="button" class="ap-ib" aria-label="Buscar">{TLUPA}</button></div>') if titulo else ""
    t = t[:i] + bar + cuerpo + fab + t[j:]
    if extra:
        k = t.index('<span class="ap-raya"></span></div>') + len('<span class="ap-raya"></span>')
        t = t[:k] + extra + t[k:]
    t = t.replace("</helmet>", f'<style data-e12="telefono">\n{CSS_TEL}{css}</style>\n</helmet>', 1)
    if estados:
        prop, opciones = estados
        props = {prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
        t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
        t = t.replace("    return { si: true, no: false };", f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n{js}")
    return t


ESTADOS_TLISTADO = ["Todos", "Publicados", "Borradores", "Sin resultados", "Cargando", "Vacío", "Error", "Nuevo formulario"]


def tel_listado():
    filas = []
    for n, pre, clase, estado, detalle, fecha in FORMULARIOS:
        grupo = "verPub" if estado.startswith("Publicado") else "verBor"
        i = f'<button type="button" class="ap-i" aria-label="Por qué no se pudo publicar" title="{detalle}">{TINFO}</button>' if detalle else ""
        f = "" if fecha == "—" else f"<span>{fecha}</span>"
        filas.append(f'<sc-if value="{{{{{grupo}}}}}" hint-placeholder-val="{{{{si}}}}"><a class="ap-fila" href="M-FRM-Ficha.dc.html"><div class="tx">'
                     f'<span class="l1">{n}{f}</span><span class="l2">{pre}</span><span class="l3"><span class="w-est {clase}">{estado}</span>{i}</span></div>'
                     f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{TKEBAB}</button></a></sc-if>')
    tabs = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="ap-tabs" role="tablist">'
            '<span class="{{tabTodos}}" role="tab" onClick="{{verTodos}}">Todos <span class="c">{{cTodos}}</span></span>'
            '<span class="{{tabPub}}" role="tab" onClick="{{verPublicados}}">Publicados <span class="c">{{cPub}}</span></span>'
            '<span class="{{tabBor}}" role="tab" onClick="{{verBorradores}}">Borradores <span class="c">{{cBor}}</span></span></div></sc-if>')
    cuerpo = ('<div class="ap-cuerpo">' + tabs
              + '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + "".join(filas) + "</sc-if>"
              '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span>'
              '<span style="width: 72%;"></span><span style="width: 50%;"></span></div></sc-if>'
              '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">Todavía no hay formularios.</div></sc-if>'
              '<sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">Ningún formulario coincide con los filtros.'
              '<button type="button" class="cb cb-sec" onClick="{{limpiar}}">Limpiar filtros</button></div></sc-if>'
              '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">No pudimos cargar los formularios.'
              '<button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div>')
    fab = f'<a class="ap-fab" aria-label="Nuevo formulario" href="#">{TFAB}</a>'
    nuevo = ('<sc-if value="{{nuevo}}" hint-placeholder-val="{{no}}">'
             + thoja("Nuevo formulario", tcampo("Nombre", "Inspección de obra", req=True),
                     '<button type="button" class="cb cb-pri lleno">Crear formulario</button><button type="button" class="cb cb-sec">Cancelar</button>')
             + "</sc-if>")
    js = """    const f = this.state.f ?? (e === 'Nuevo formulario' ? 'Todos' : e);
    const ir = (x) => this.setState({ f: x });
    const lista = ['Todos', 'Publicados', 'Borradores'].includes(f);
    return {
      si: true, no: false,
      conFiltros: f !== 'Vacío', cTodos: f === 'Sin resultados' ? '0' : '4', cPub: f === 'Sin resultados' ? '0' : '2', cBor: f === 'Sin resultados' ? '0' : '2',
      tabTodos: f === 'Todos' || !lista ? 'on' : '', tabPub: f === 'Publicados' ? 'on' : '', tabBor: f === 'Borradores' ? 'on' : '',
      verTodos: () => ir('Todos'), verPublicados: () => ir('Publicados'), verBorradores: () => ir('Borradores'),
      conFilas: lista, verPub: f !== 'Borradores', verBor: f !== 'Publicados',
      cargando: f === 'Cargando', vacio: f === 'Vacío', sinResultados: f === 'Sin resultados', error: f === 'Error',
      limpiar: () => ir('Todos'), nuevo: e === 'Nuevo formulario',
    };"""
    t = pagina_tel("Formularios", "Grupo Delta", cuerpo, fab=fab, estados=("estado", ESTADOS_TLISTADO), js=js)
    k = t.index('<nav class="ap-nav"')
    k2 = t.index("</nav>", k) + len("</nav>")
    t = t[:k2] + nuevo + t[k2:]
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · teléfono</title>", t)


# ---------------------------------------------------------------- M-FRM-Ficha elegida (A, 13/10): se edita todo, como app
ESTADOS_TFICHA = ["Guardado", "Cambios sin guardar", "Guardando", "No se guardó", "Conflicto", "Acciones de una pregunta", "Recién creado",
                  "Inglés · faltan 2", "Publicación · Publicando", "Publicación · No se pudo publicar", "Publicar"]
OJO = svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>', 22)
CSS_TFICHA = """.ap-fijo { flex-shrink: 0; display: flex; align-items: center; gap: 12px; padding: 12px 16px 34px; background: #fff; border-top: 1px solid var(--borde); }
.ap-fijo .cb { height: 50px; border-radius: 12px; font-size: 16px; padding: 0 22px; }
.ap-fijo .cb.full { flex: 1; padding: 0 10px; min-width: 0; }
.ap-fijo .cb[disabled] { opacity: 0.55; }
.ap-gtit { display: flex; justify-content: space-between; align-items: center; margin: 18px 20px 8px; font-size: 13.5px; font-weight: 600; color: var(--t2); }
.ap-gtit a { color: var(--marca-tx); font-weight: 600; text-decoration: none; font-size: 14.5px; }
.ap-grupo { margin: 0 16px; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 0 0 1px var(--borde); flex-shrink: 0; }
.q-row { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 6px 8px 14px; border-top: 1px solid var(--borde); }
.q-row:first-child { border-top: 0; }
.q-row .num { width: 26px; height: 26px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.q-row .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }
.q-row .tx b { font-size: 16px; font-weight: 500; }
.q-row .tx span { font-size: 13.5px; color: var(--t3); }
.f-campos { display: flex; flex-direction: column; gap: 14px; padding: 4px 16px 0; }
.ap-cmp .ct.ro { background: var(--s2); color: var(--t3); }
.ap-dato { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 50px; padding: 8px 14px; border-top: 1px solid var(--borde); font-size: 15px; box-sizing: border-box; }
.ap-dato:first-child { border-top: 0; }
.ap-dato .k { color: var(--t2); flex-shrink: 0; }
.ap-dato .v { text-align: right; }
.t-banda { flex-shrink: 0; display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; font-size: 14.5px; line-height: 1.4; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.t-banda.mal { background: oklch(0.96 0.03 25); color: oklch(0.45 0.17 25); }
.t-banda svg { flex-shrink: 0; margin-top: 2px; }
.t-banda .tx { flex: 1; }
.t-banda a { font-weight: 600; color: var(--marca-tx); text-decoration: none; white-space: nowrap; }
.t-vacia { padding: 28px 16px; text-align: center; font-size: 16px; font-weight: 600; }
.i-row { display: flex; flex-direction: column; gap: 6px; padding: 10px 14px; border-top: 1px solid var(--borde); }
.i-row:first-child { border-top: 0; }
.i-row .q { font-size: 12.5px; color: var(--t3); }
.i-row .es { font-size: 15px; }
.i-row .en { height: 44px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 10px; display: flex; align-items: center; padding: 0 12px; font-size: 15px; }
.i-row .en.falta { border-color: oklch(0.72 0.15 70); background: oklch(0.985 0.02 85); color: oklch(0.5 0.12 70); }
.t-prob { display: flex; gap: 10px; padding: 12px 14px; border-top: 1px solid var(--borde); background: var(--peligro-t); font-size: 14px; color: oklch(0.45 0.17 25); }
.t-prob b { color: var(--t1); font-weight: 600; display: block; }
.t-prob svg { flex-shrink: 0; margin-top: 2px; }
.ap-acciones2 { display: flex; flex-direction: column; }
.ap-acciones2 span { padding: 14px 4px; font-size: 16px; border-top: 1px solid var(--borde); }
.ap-acciones2 span:first-child { border-top: 0; }
.ap-acciones2 span.pel { color: oklch(0.5 0.19 25); }
.ap-hoja .p-tit2 { font-size: 13.5px; font-weight: 600; color: var(--t2); margin: 4px 0 8px; }
"""


def tel_ficha(estados=ESTADOS_TFICHA, prop="estado", js_extra="", extra_hojas="", claves_extra=""):
    preg = "".join(f'<div class="q-row"><span class="num">{k + 1}</span><span class="tx"><b>{n}</b><span>{d}</span></span>'
                   f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{TKEBAB}</button></div>' for k, (n, d) in enumerate(PREGUNTAS))
    preguntas = ('<sc-if value="{{tabPreg}}" hint-placeholder-val="{{si}}"><div class="ap-gtit">Datos</div><div class="f-campos">'
                 '<div class="ap-cmp"><span class="rt"><span>Nombre <span class="rq">*</span></span></span><div class="ct">{{nombre}}</div></div>'
                 '<div class="ap-cmp"><span class="rt"><span>Prefijo <span class="rq">*</span></span></span><div class="ct {{prefClase}}">{{prefijo}}</div></div></div>'
                 '<div class="ap-gtit">Preguntas<a href="M-FRM-Pregunta.dc.html">Agregar</a></div><div class="ap-grupo">'
                 '<sc-if value="{{conPreguntas}}" hint-placeholder-val="{{si}}">' + preg + '</sc-if>'
                 '<sc-if value="{{sinPreguntas}}" hint-placeholder-val="{{no}}"><div class="t-vacia">Todavía no hay preguntas.</div></sc-if></div>'
                 '<div class="ap-gtit">Botón final</div><div class="f-campos">' + tcampo("Texto del botón", "Enviar", req=True) + "</div></sc-if>")
    ing_filas = []
    for q, es, en in TEXTOS_EN:
        if es in FALTAN:
            c = '<div class="en falta">Falta</div>'
        else:
            c = f'<div class="en">{en}</div>'
        ing_filas.append(f'<div class="i-row"><span class="q">{q}</span><span class="es">{es}</span>{c}</div>')
    ingles_t = '<sc-if value="{{tabIng}}" hint-placeholder-val="{{no}}"><div class="ap-gtit">Textos en inglés</div><div class="ap-grupo">' + "".join(ing_filas) + "</div></sc-if>"
    pub = ('<sc-if value="{{tabPub}}" hint-placeholder-val="{{no}}"><div class="ap-gtit">Versión 4</div><div class="ap-grupo">'
           f'<div class="ap-dato"><span class="k">Estado</span><span class="v"><span class="w-est {{{{curClase}}}}">{{{{curEstado}}}}</span>'
           f'<button type="button" class="ap-i" aria-label="Qué significa" title="{{{{curInfo}}}}">{TINFO}</button></span></div>'
           '<div class="ap-dato"><span class="k">Pedida</span><span class="v">Hoy, 10:15 · Lucía Fernández</span></div>'
           f'<sc-if value="{{{{conProblemas}}}}" hint-placeholder-val="{{{{no}}}}"><div class="t-prob">{ALERTA}<span><b>Pregunta 5 · Motivo</b>WhatsApp no aceptó la opción «Venta nueva» en inglés.</span></div></sc-if></div>'
           '<div class="ap-gtit">Versión activa</div><div class="ap-grupo"><div class="ap-dato"><span class="k">Versión</span><span class="v">3 · publicada el 08/10/2026</span></div>'
           '<div class="ap-dato"><span class="k">Vista previa</span><span class="v"><a class="cb cb-sec" href="#" style="height: 36px;">Abrir</a></span></div></div></sc-if>')
    bandas = (f'<sc-if value="{{{{conflicto}}}}" hint-placeholder-val="{{{{no}}}}"><div class="t-banda" role="alert">{ALERTA}<span class="tx">Otra persona cambió esto mientras lo editabas.</span>'
              '<a href="#">Ver lo nuevo</a></div></sc-if>'
              f'<sc-if value="{{{{noGuardo}}}}" hint-placeholder-val="{{{{no}}}}"><div class="t-banda mal" role="alert">{ALERTA}<span class="tx">Algo salió mal. Probá de nuevo en un rato.</span></div></sc-if>')
    tabs = ('<div class="ap-tabs" role="tablist"><a class="{{cPreg}}" role="tab" href="#" onClick="{{verPreg}}">Preguntas <span class="c">{{cant}}</span></a>'
            '<a class="{{cIng}}" role="tab" href="#" onClick="{{verIng}}">Inglés<sc-if value="{{faltan}}" hint-placeholder-val="{{si}}"> <span class="c falta">2</span></sc-if></a>'
            '<a class="{{cPub}}" role="tab" href="#" onClick="{{verPub}}">Publicación</a></div>')
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Listado.dc.html">{TVOLVER}</a>'
           f'<div class="tit"><h1>{{{{nombre}}}}</h1><span class="sub">{{{{sub}}}}</span></div><button type="button" class="ap-ib" aria-label="Vista previa">{OJO}</button></div>')
    cuerpo = bar + tabs + bandas + '<div class="ap-cuerpo">' + preguntas + ingles_t + pub + '<div style="height: 20px;"></div></div>'
    fijo = ('<div class="ap-fijo"><sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-sec full" disabled="{{guardando}}">Descartar cambios</button>'
            '<button type="button" class="cb cb-pri full" disabled="{{guardando}}">{{textoGuardar}}</button></sc-if>'
            '<sc-if value="{{limpio}}" hint-placeholder-val="{{si}}"><button type="button" class="cb cb-pri full" disabled="{{pubApag}}">Publicar</button></sc-if></div>')
    hojas = ('<sc-if value="{{hojaAcciones}}" hint-placeholder-val="{{no}}">'
             + thoja("Monto estimado", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span role="menuitem">Subir</span><span role="menuitem">Bajar</span>'
                     '<span class="pel" role="menuitem">Quitar</span></div>', '<button type="button" class="cb cb-sec">Cancelar</button>') + "</sc-if>"
             '<sc-if value="{{hojaPublicar}}" hint-placeholder-val="{{no}}">'
             + thoja("Publicar «Visita a cliente»", '<div class="p-tit2">Qué cambia en la versión 4</div><div class="ap-grupo" style="margin: 0;">'
                     '<div class="ap-dato"><span class="k">Cliente</span><span class="v">Cambió el texto.</span></div>'
                     '<div class="ap-dato"><span class="k">Motivo</span><span class="v">Suma la opción «Venta nueva».</span></div></div>',
                     '<button type="button" class="cb cb-pri lleno">Publicar versión 4</button><button type="button" class="cb cb-sec">Cancelar</button>') + "</sc-if>"
             + extra_hojas)
    t = pagina_tel(None, None, cuerpo + fijo, css=CSS_TFICHA)
    i = t.index('<nav class="ap-nav"')
    j = t.index("</nav>", i) + len("</nav>")
    t = t[:i] + t[j:]
    k = t.index('<span class="ap-raya"></span>') + len('<span class="ap-raya"></span>')
    t = t[:k] + hojas + t[k:]
    props = {prop: {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
    t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", f"""    const e0 = this.props.{prop} ?? {json.dumps(estados[0], ensure_ascii=False)};
{js_extra}    const e = this.state.e ?? e0;
    const nuevo = e === 'Recién creado';
    const tab = this.state.tab ?? (e.startsWith('Inglés') ? 'ing' : e.startsWith('Publicación') ? 'pub' : 'preg');
    const sucio = ['Cambios sin guardar', 'Guardando', 'No se guardó', 'Conflicto', 'Inglés · faltan 2'].includes(e);
    const CUR = {{
      'Publicación · Publicando': ['pend', 'Publicando', 'WhatsApp está revisando el formulario. Puede tardar unos minutos.'],
      'Publicación · No se pudo publicar': ['mal', 'No se pudo publicar', 'WhatsApp no aceptó una pregunta. Corregila y publicá de nuevo.'],
    }}[e] || ['pend', 'Publicando', 'WhatsApp está revisando el formulario. Puede tardar unos minutos.'];
    return {{
      si: true, no: false,
      nombre: nuevo ? 'Inspección de obra' : 'Visita a cliente', prefijo: nuevo ? 'INS' : 'VIS', prefClase: nuevo ? '' : 'ro', cant: nuevo ? '0' : '6',
      sub: nuevo ? 'Borrador · INS' : e === 'Publicación · Publicando' ? 'Publicado · v3 · Publicando v4' : 'Publicado · v3 · VIS',
      tabPreg: tab === 'preg', tabIng: tab === 'ing', tabPub: tab === 'pub',
      cPreg: tab === 'preg' ? 'on' : '', cIng: tab === 'ing' ? 'on' : '', cPub: tab === 'pub' ? 'on' : '',
      verPreg: () => this.setState({{ tab: 'preg' }}), verIng: () => this.setState({{ tab: 'ing' }}), verPub: () => this.setState({{ tab: 'pub' }}),
      faltan: !nuevo, conPreguntas: !nuevo, sinPreguntas: nuevo,
      sucio, limpio: !sucio, guardando: e === 'Guardando', textoGuardar: e === 'Guardando' ? 'Guardando…' : 'Guardar cambios',
      pubApag: e === 'Publicación · Publicando',
      conflicto: e === 'Conflicto', noGuardo: e === 'No se guardó',
      curClase: CUR[0], curEstado: CUR[1], curInfo: CUR[2], conProblemas: e === 'Publicación · No se pudo publicar',
      hojaAcciones: e === 'Acciones de una pregunta', hojaPublicar: e === 'Publicar',
{claves_extra}    }};""")
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · ficha · teléfono</title>", t)


# ---------------------------------------------------------------- M-FRM-Pregunta: la pregunta en una hoja, con los mismos estados que la compu
CSS_TPREGUNTA = """.t-chk { display: inline-flex; align-items: center; gap: 12px; font-size: 16px; min-height: 44px; }
.t-chk i { width: 22px; height: 22px; border-radius: 6px; border: 1.5px solid var(--borde2); background: #fff; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; color: #fff; }
.t-chk i.on { background: var(--marca); border-color: var(--marca); }
.t-chk i:not(.on) svg { display: none; }
.t-op { display: flex; align-items: center; gap: 6px; }
.t-op .ct { flex: 1; }
.ap-hoja .hb { display: flex; flex-direction: column; gap: 14px; }
.t-err { font-size: 14px; color: oklch(0.5 0.19 25); }
.ap-cmp .ct.mal { border-color: oklch(0.6 0.19 25) !important; }
.t-aviso { display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); font-size: 14.5px; line-height: 1.4; }
.t-aviso svg { flex-shrink: 0; margin-top: 2px; }
.t-mas { align-self: flex-start; font-size: 15px; font-weight: 600; color: var(--marca-tx); }
"""


def tel_pregunta():
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")
    ops = "".join(f'<div class="t-op"><div class="ap-cmp" style="flex: 1;"><div class="ct">{o}</div></div>'
                  f'<button type="button" class="ap-ib" aria-label="Acciones de {o}">{TKEBAB}</button></div>' for o in ["Seguimiento", "Venta nueva", "Reclamo"])
    cuerpo = (f'<sc-if value="{{{{cambiaTipo}}}}" hint-placeholder-val="{{{{no}}}}"><div class="t-aviso">{ALERTA}<span>Con otro tipo es una pregunta nueva: las respuestas que ya llegaron quedan con la anterior.</span></div></sc-if>'
              + tcampo("Tipo", "{{tipo}}", select=True)
              + '<div class="ap-cmp"><span class="rt"><span>Pregunta <span class="rq">*</span></span></span><div class="ct {{pClase}}">{{pregunta}}</div>'
              '<sc-if value="{{pErr}}" hint-placeholder-val="{{no}}"><span class="t-err" role="alert">{{pErr}}</span></sc-if></div>'
              + tcampo("Ayuda", "Opcional", vacio=True)
              + '<sc-if value="{{conLargo}}" hint-placeholder-val="{{no}}">' + tcampo("Largo máximo en caracteres", "{{largo}}", req=True) + "</sc-if>"
              + '<sc-if value="{{conDecimales}}" hint-placeholder-val="{{no}}">' + tcampo("Decimales (de 0 a 6)", "2", req=True, select=True) + "</sc-if>"
              + '<sc-if value="{{esLista}}" hint-placeholder-val="{{no}}"><div class="ap-cmp"><span class="rt"><span>Opciones <span class="rq">*</span></span></span></div>'
              '<sc-if value="{{conOpciones}}" hint-placeholder-val="{{si}}">' + ops + '</sc-if>'
              '<sc-if value="{{sinOpciones}}" hint-placeholder-val="{{no}}"><span class="t-err" role="alert">Agregá al menos una opción.</span></sc-if>'
              '<span class="t-mas">+ Agregar opción</span></sc-if>'
              f'<span class="t-chk"><i class="{{{{chkClase}}}}">{tilde}</i>Obligatoria</span>')
    hoja = ('<sc-if value="{{hojaPregunta}}" hint-placeholder-val="{{si}}">'
            + thoja("{{titulo}}", cuerpo, '<button type="button" class="cb cb-pri lleno">{{boton}}</button><button type="button" class="cb cb-sec">Cancelar</button>')
            + "</sc-if>")
    claves = """      hojaPregunta: true,
      titulo: nueva ? 'Agregar pregunta' : 'Editar pregunta', boton: nueva ? 'Agregar pregunta' : 'Guardar pregunta',
      tipo, pregunta: P[1] || 'Por ejemplo, Cliente', pClase: (P[1] ? '' : 'ph ') + (e0 === 'Sin texto' ? 'mal' : ''),
      pErr: e0 === 'Sin texto' ? 'Escribí la pregunta.' : '', chkClase: P[2] ? 'on' : '',
      conLargo: tipo === 'Texto corto' || tipo === 'Texto largo', largo: P[3], conDecimales: tipo === 'Número',
      esLista: tipo === 'Lista', conOpciones: e0 !== 'Lista sin opciones', sinOpciones: e0 === 'Lista sin opciones', cambiaTipo: e0 === 'Cambiar el tipo',
"""
    js = """    const P = {
      'Texto corto': ['Texto corto', 'Cliente', 1, '80'], 'Texto largo': ['Texto largo', 'Observaciones', 0, '600'], 'Número': ['Número', 'Monto estimado', 0, ''],
      'Fecha': ['Fecha', 'Fecha de la visita', 0, ''], 'Sí o no': ['Sí o no', '¿Se concretó la venta?', 0, ''], 'Lista': ['Lista', 'Motivo', 0, ''],
      'Nueva pregunta': ['Texto corto', '', 0, '80'], 'Sin texto': ['Texto corto', '', 0, '80'], 'Lista sin opciones': ['Lista', 'Motivo', 0, ''],
      'Cambiar el tipo': ['Texto largo', 'Cliente', 1, '600'],
    }[e0];
    const tipo = P[0];
    const nueva = e0 === 'Nueva pregunta' || e0 === 'Sin texto';
"""
    t = tel_ficha(estados=ESTADOS_PREGUNTA, prop="tipo", js_extra=js, extra_hojas=hoja, claves_extra=claves)
    t = t.replace("    const e = this.state.e ?? e0;", "    const e = 'Guardado';")
    t = t.replace("</helmet>", f'<style data-e12="pregunta-tel">\n{CSS_TPREGUNTA}</style>\n</helmet>', 1)
    return re.sub(r"<title>[^<]*</title>", "<title>Formularios · pregunta · teléfono</title>", t)


# ---------------------------------------------------------------- El chat de Internos en el teléfono: M-WA-Conversacion con un empleado
TCONV = (PROJ / "M-WA-Conversacion.dc.html").read_text(encoding="utf-8")
TNOTA = re.search(r'<button type="button" class="ap-red nt" aria-label="Nota interna" aria-pressed="false">(<svg.*?</svg>)</button>', TCONV, re.S).group(1)
TENVIAR = re.search(r'<button type="button" class="ap-red env" aria-label="Enviar">(<svg.*?</svg>)</button>', TCONV, re.S).group(1)
TCKEBAB = re.search(r'<button type="button" class="ap-ib" aria-label="Acciones de Martina López">(<svg.*?</svg>)</button>', TCONV, re.S).group(1)
TCVOLVER = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-WA-Chats\.dc\.html">(<svg.*?</svg>)</a>', TCONV, re.S).group(1)
T24 = (PROJ / "M-WA-24h.dc.html").read_text(encoding="utf-8")
TRELOJ = re.search(r'<span class="ap-24">(<svg.*?</svg>)', T24, re.S).group(1)
TINFO24 = re.search(r'<button type="button" class="ap-i" aria-label="Qué significa">(<svg.*?</svg>)</button>', T24, re.S).group(1)
CSS_TCHAT = """.ap-m .gl .f-tt { display: block; margin-bottom: 4px; font-size: 12.5px; font-weight: 600; color: var(--marca-tx); }
.ap-m .pie.mal { color: oklch(0.5 0.19 25); }
.ap-m .pie.amb { color: oklch(0.5 0.12 70); }
.ap-m .pie .lnk2 { font-weight: 600; color: var(--marca-tx); margin-left: 6px; }
.ap-m .pie .rel { display: inline-flex; vertical-align: -2px; margin-right: 4px; }
.ap-m .pie .rel svg { width: 13px; height: 13px; }
.ap-i.neu { color: var(--t3); }
"""


def tel_chat(escritura, mensajes_extra="", overlay="", estados=None, js="", css=""):
    t = TCONV
    i = t.index('<div class="ap-cbar">')
    j = t.index('<span class="ap-raya"></span></div>\n</x-dc>')
    barra = (f'<div class="ap-cbar"><a class="ap-ib" aria-label="Volver" href="M-WA-Chats.dc.html">{TCVOLVER}</a><span class="w-av">TA</span>'
             '<span class="tx"><b>Tomás Acosta</b><span>Empleado · Delta S.A.</span></span>'
             f'<button type="button" class="ap-ib" aria-label="Acciones de Tomás Acosta">{TCKEBAB}</button></div>')
    chat = ('<div class="ap-chat"><span class="ap-dia">Hoy</span>'
            '<div class="ap-m ent"><span class="gl">Hola, Lucía. Ya terminé la visita en Ferretería Rosales.</span><span class="pie">10:48</span></div>'
            '<span class="ap-sis">Lucía Fernández tomó la conversación</span>'
            '<div class="ap-m sal"><span class="gl">Genial, Tomás. Te mando el formulario de la visita.</span><span class="pie">Lucía Fernández · 10:50</span></div>'
            + mensajes_extra + "</div>")
    t = t[:i] + barra + chat + escritura + overlay + t[j:]
    t = t.replace("</helmet>", f'<style data-e12="chat-tel">\n{CSS_TEL}{CSS_TCHAT}{css}</style>\n</helmet>', 1)
    if estados:
        prop, opciones, defecto = estados
        props = {prop: {"editor": "enum", "options": opciones, "default": defecto, "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
        t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
        t = t.replace("    return { si: true, no: false };", js)
    return t


# ---------------------------------------------------------------- M-WA-Chats-Formulario elegido (C, 13/10): «Mandar formulario» en el menú ⋮ del chat
# El menú aguanta lo que sumen las etapas 13 a 17 sin llenar de botones el lugar donde se escribe.
CSS_TFORM = """.ap-menu .sub { display: block; font-size: 13px; color: var(--t3); margin-top: 2px; line-height: 1.35; }
.ap-menu .sub span { display: inline; min-height: 0; padding: 0; border: 0; font-size: inherit; }
.ap-menu span.off { color: var(--t3); flex-direction: column; align-items: flex-start; justify-content: center; padding: 10px 18px; }
.ap-cmp .ct.area { display: block; padding: 12px 14px; line-height: 1.5; min-height: 76px; }
.ap-cmp .cont { align-self: flex-end; font-size: 13px; color: var(--t3); }
.ap-burb { padding: 10px 14px; border-radius: 14px; font-size: 15px; line-height: 1.4; }
.ap-burb .bt { display: block; margin-top: 8px; padding-top: 8px; border-top: 1px solid oklch(0.51 0.099 195 / 0.2); text-align: center; font-weight: 600; color: var(--marca-tx); }
.ap-idi { align-self: flex-end; font-size: 13px; color: var(--t3); }
.ap-hoja .hp { display: flex; gap: 12px; padding: 12px 20px 34px; }
.ap-hoja .hp .cb { flex: 1; height: 50px; border-radius: 12px; font-size: 16px; }
.ap-hoja .hp .cb[disabled] { opacity: 0.6; }
"""
ESTADOS_TCHAT = ["Menú abierto", "Elegir el formulario", "Mandando", "En cola", "No se pudo mandar", "Ventana cerrada", "No es empleado",
                 "Sin formularios", "Envío pendiente"]


def tel_chat_formulario():
    nota = f'<button type="button" class="ap-red nt" aria-label="Nota interna" aria-pressed="false">{TNOTA}</button>'
    escritura = ('<div class="ap-escr">' + nota
                 + '<sc-if value="{{abierta}}" hint-placeholder-val="{{si}}"><span class="campo">Mensaje</span>'
                 f'<button type="button" class="ap-red env" aria-label="Enviar">{TENVIAR}</button></sc-if>'
                 f'<sc-if value="{{{{cerrada}}}}" hint-placeholder-val="{{{{no}}}}"><span class="ap-24">{TRELOJ} Pasaron 24 horas'
                 f'<button type="button" class="ap-i" aria-label="Qué significa">{TINFO24}</button></span>'
                 '<a class="ap-pill" href="M-WA-Chats-Plantilla.dc.html">Elegir plantilla</a></sc-if></div>')
    menu = ('<sc-if value="{{conMenu}}" hint-placeholder-val="{{si}}"><div class="ap-menu" role="menu"><span role="menuitem">Pasar</span>'
            '<span role="menuitem">Ver ficha del contacto</span>'
            '<sc-if value="{{btnOn}}" hint-placeholder-val="{{si}}"><span role="menuitem">Mandar formulario</span></sc-if>'
            '<sc-if value="{{btnOff}}" hint-placeholder-val="{{no}}"><span role="menuitem" class="off" aria-disabled="true">Mandar formulario'
            '<small class="sub">{{motivo}}</small></span></sc-if></div></sc-if>')
    enviado = ('<sc-if value="{{conEnvio}}" hint-placeholder-val="{{no}}"><div class="ap-m sal"><span class="gl"><span class="f-tt">Formulario · Visita a cliente</span>'
               f'{MENSAJE}<span class="bt">Abrir formulario</span></span>'
               f'<span class="pie {{{{pieClase}}}}"><sc-if value="{{{{enCola}}}}" hint-placeholder-val="{{{{no}}}}"><span class="rel">{TRELOJ}</span></sc-if>{{{{pie}}}}'
               '<sc-if value="{{falla}}" hint-placeholder-val="{{no}}"><span class="lnk2">Reintentar</span></sc-if></span></div></sc-if>')
    cuerpo = (tcampo("Formulario", "Visita a cliente · VIS", req=True, select=True)
              + f'<div class="ap-cmp"><span class="rt"><span>Mensaje <span class="rq">*</span></span></span><div class="ct area">{MENSAJE}</div><span class="cont">53 / 1024</span></div>'
              + f'<div class="ap-burb">{MENSAJE}<span class="bt">Abrir formulario</span></div><span class="ap-idi">Le llega en español, el idioma de su cuenta.</span>')
    hoja = ('<sc-if value="{{dialogo}}" hint-placeholder-val="{{no}}">'
            + thoja("Mandar formulario", cuerpo, '<button type="button" class="cb cb-sec" disabled="{{mandando}}">Cancelar</button>'
                    '<button type="button" class="cb cb-pri" disabled="{{mandando}}">{{textoMandar}}</button>') + "</sc-if>")
    js = """    const e = this.props.estado ?? 'Menú abierto';
    // El motivo del ítem apagado va debajo, en gris (WhatsApp.Chat.WindowClosed, NotEmployee, FormUnavailable, SendPending).
    const MOTIVO = {
      'Ventana cerrada': 'Pasaron 24 horas desde su último mensaje.',
      'No es empleado': 'Ya no es empleado activo de la organización.',
      'Sin formularios': 'No hay formularios publicados para esta persona.',
      'Envío pendiente': 'Ya tiene un formulario sin responder.',
    };
    const envio = ['En cola', 'No se pudo mandar', 'Envío pendiente'].includes(e);
    return {
      si: true, no: false,
      abierta: e !== 'Ventana cerrada', cerrada: e === 'Ventana cerrada',
      conMenu: e === 'Menú abierto' || !!MOTIVO[e], btnOn: !MOTIVO[e], btnOff: !!MOTIVO[e], motivo: MOTIVO[e] || '',
      dialogo: e === 'Elegir el formulario' || e === 'Mandando', mandando: e === 'Mandando', textoMandar: e === 'Mandando' ? 'Mandando…' : 'Mandar',
      conEnvio: envio, enCola: e === 'En cola', falla: e === 'No se pudo mandar',
      pie: e === 'En cola' ? 'En cola · 10:51' : e === 'No se pudo mandar' ? 'No se pudo mandar' : 'Lucía Fernández · 10:51',
      pieClase: e === 'No se pudo mandar' ? 'mal' : '',
    };"""
    t = tel_chat(escritura, mensajes_extra=enviado, overlay=menu + hoja, estados=("estado", ESTADOS_TCHAT, ESTADOS_TCHAT[0]), js=js, css=CSS_TFORM)
    return re.sub(r"<title>[^<]*</title>", "<title>WhatsApp · chat de Internos · mandar formulario · teléfono</title>", t)


# ---------------------------------------------------------------- M-WA-Conversacion-Respuesta elegida (B, 13/10): la tarjeta D plegada; «Ver las 6 respuestas» abre una hoja en grilla
CSS_TRESP = """.ap-chat { justify-content: flex-end; }
.ap-m.ent:has(.r-gl) { width: 86%; max-width: 86%; }
.ap-m.ent .gl.r-gl { width: 100%; box-sizing: border-box; padding: 0; overflow: hidden; background: #fff; }
.r-cab { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
.r-gl .r-cab + * { border-top: 1px solid var(--borde); }
.r-cab .ic { width: 34px; height: 34px; border-radius: 9px; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.r-cab .ic.mal { background: var(--peligro-t); color: oklch(0.55 0.2 25); }
.r-cab .t { flex: 1; display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.r-cab .t b { font-size: 15px; font-weight: 600; }
.r-cab .t small { font-size: 12.5px; color: var(--t3); }
.r-cab .t small.mal { color: oklch(0.5 0.19 25); font-weight: 500; }
.r-num { font-size: 12.5px; font-weight: 700; letter-spacing: 0.03em; padding: 3px 8px; border-radius: 6px; background: oklch(0.945 0.018 76); color: var(--t1); white-space: nowrap; }
.r-mas { display: block; padding: 11px 12px; border-top: 1px solid var(--borde); font-size: 14.5px; font-weight: 600; color: var(--marca-tx); text-align: center; }
.r-tk { display: flex; flex-direction: column; padding: 4px 12px; }
.r-tk > div { display: flex; align-items: baseline; gap: 8px; padding: 8px 0; border-top: 1px dashed var(--borde2); font-size: 14.5px; }
.r-tk > div:first-child { border-top: 0; }
.r-tk .k { color: var(--t2); }
.r-tk .v { margin-left: auto; font-weight: 600; text-align: right; }
.r-tk .v.vac { font-weight: 400; font-style: italic; color: var(--t3); }
.g-det { display: grid; grid-template-columns: 172px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.g-det > span { padding: 11px 12px; border-top: 1px solid var(--borde); font-size: 14.5px; line-height: 1.4; color: var(--t1); min-width: 0; }
.g-det > span:nth-child(-n+2) { border-top: 0; }
.g-det > .k { background: oklch(0.975 0.008 78); color: var(--t2); font-weight: 500; border-right: 1px solid var(--borde); }
.g-det .g-vacio { color: var(--t3); font-style: italic; }
.ap-hoja .hp:empty { display: none; }
.ap-hoja .hb:has(+ .hp:empty) { padding-bottom: 34px; }
.ap-hoja .h-sub { display: block; font-size: 13.5px; color: var(--t3); margin-top: 2px; }
"""
ESTADOS_TRESP = ESTADOS_RESPUESTA


def tel_respuesta(variante="B"):
    """A: «Ver las 6 respuestas» despliega la tarjeta en el chat, como en la compu. B: abre una hoja con todas las respuestas en grilla."""
    def fila_v(k, x, oculta=False):
        v = '<span class="v vac">Sin respuesta</span>' if x is None else f'<span class="v">{x}</span>'
        d = f'<div><span class="k">{k}</span>{v}</div>'
        return f'<sc-if value="{{{{todas}}}}" hint-placeholder-val="{{{{no}}}}">{d}</sc-if>' if oculta else d
    filas = "".join(fila_v(k, x, oculta=i >= 3) for i, (k, x) in enumerate(VALORES_VIS))
    enviado = (f'<div class="ap-m sal"><span class="gl"><span class="f-tt">Formulario · Visita a cliente</span>{MENSAJE}<span class="bt">Abrir formulario</span></span>'
               '<span class="pie {{pieClase}}">{{pieEnvio}}</span></div>')
    tarjeta = ('<sc-if value="{{llego}}" hint-placeholder-val="{{si}}"><div class="ap-m ent"><span class="gl r-gl">'
               f'<div class="r-cab"><span class="ic {{{{icClase}}}}">{ICONO}</span><span class="t"><b>Visita a cliente</b><small class="{{{{subClase}}}}">{{{{sub}}}}</small></span>'
               '<sc-if value="{{conNumero}}" hint-placeholder-val="{{si}}"><span class="r-num">VIS-000123</span></sc-if>'
               f'<sc-if value="{{{{rechazada}}}}" hint-placeholder-val="{{{{no}}}}"><button type="button" class="ap-i neu" aria-label="Por qué" title="Llegó un valor que el formulario no acepta. Mandalo de nuevo.">{TINFO}</button></sc-if>'
               f'<sc-if value="{{{{sinPermiso}}}}" hint-placeholder-val="{{{{no}}}}"><button type="button" class="ap-i neu" aria-label="Por qué" title="Para ver las respuestas hace falta el permiso «Ver respuestas».">{TINFO}</button></sc-if></div>'
               '<sc-if value="{{conValores}}" hint-placeholder-val="{{si}}"><div class="r-tk">' + filas + "</div>"
               '<span class="r-mas" onClick="{{alternar}}">{{textoMas}}</span></sc-if>'
               '</span><span class="pie">11:04</span></div></sc-if>')
    hoja = ""
    if variante == "B":
        hoja = ('<sc-if value="{{hoja}}" hint-placeholder-val="{{no}}">'
                + thoja("Visita a cliente", grilla(VALORES_VIS), "", sub="VIS-000123 · Tomás Acosta · hoy, 11:04") + "</sc-if>")
    escritura = (f'<div class="ap-escr"><button type="button" class="ap-red nt" aria-label="Nota interna" aria-pressed="false">{TNOTA}</button>'
                 f'<span class="campo">Mensaje</span><button type="button" class="ap-red env" aria-label="Enviar">{TENVIAR}</button></div>')
    js = """    const e = this.state.e ?? (this.props.estado ?? 'Recibida');
    const llego = ['Recibida', 'Recibida, desplegada', 'Solo el número', 'Rechazada'].includes(e);
    const abierta = e === 'Recibida, desplegada';
    const enHoja = VARIANTE === 'B';
    return {
      si: true, no: false,
      llego, conValores: e === 'Recibida' || abierta, todas: abierta && !enHoja, hoja: abierta && enHoja,
      conNumero: e !== 'Rechazada', rechazada: e === 'Rechazada', sinPermiso: e === 'Solo el número',
      sub: e === 'Rechazada' ? 'La respuesta no se pudo guardar' : 'Respuesta del formulario · versión 3',
      subClase: e === 'Rechazada' ? 'mal' : '', icClase: e === 'Rechazada' ? 'mal' : '',
      textoMas: abierta && !enHoja ? 'Ver menos' : 'Ver las 6 respuestas',
      alternar: () => this.setState({ e: abierta ? 'Recibida' : 'Recibida, desplegada' }),
      pieEnvio: e === 'Esperando respuesta' ? 'Lucía Fernández · 10:51 · Esperando respuesta' : e === 'Vencida' ? 'Lucía Fernández · 10:51 · Venció sin respuesta' : 'Lucía Fernández · 10:51',
      pieClase: e === 'Esperando respuesta' ? 'amb' : '',
    };""".replace("VARIANTE", f"'{variante}'")
    t = tel_chat(escritura, mensajes_extra=enviado + tarjeta, overlay=hoja, estados=("estado", ESTADOS_TRESP, "Recibida"), js=js, css=CSS_TRESP)
    return re.sub(r"<title>[^<]*</title>", "<title>WhatsApp · Internos · respuesta del formulario · teléfono</title>", t)


# ---------------------------------------------------------------- canvas.json: la página «Organización · Formularios»
PAGINA = {"id": "formularios", "name": "Organización · Formularios"}
TITULOS = {"FRM-Listado": "Formularios · /org/formularios", "FRM-Nuevo": "Formularios · nuevo formulario",
           "FRM-Ficha": "Formularios · ficha · /org/formularios/:id", "FRM-Pregunta": "Formularios · agregar o editar una pregunta",
           "FRM-Ingles": "Formularios · ficha · Inglés", "FRM-Prefijo": "Formularios · prefijo de numeración",
           "FRM-Publicar": "Formularios · publicar (comprobación)", "FRM-Publicacion": "Formularios · ficha · Publicación",
           "WA-Chats-Formulario": "WhatsApp · Internos · mandar formulario", "WA-Chats-Respuesta": "WhatsApp · Internos · respuesta del formulario",
           "M-FRM-Listado": "Formularios · teléfono", "M-FRM-Ficha": "Formularios · ficha · teléfono", "M-FRM-Pregunta": "Formularios · pregunta · teléfono",
           "M-WA-Chats-Formulario": "WhatsApp · Internos · mandar formulario · teléfono",
           "M-WA-Conversacion-Respuesta": "WhatsApp · Internos · respuesta del formulario · teléfono"}
LUGAR = {"FRM-Listado": (0, 260, 1440, 900), "FRM-Nuevo": (1520, 260, 1440, 900), "FRM-Ficha": (3040, 260, 1440, 900), "FRM-Pregunta": (4560, 260, 1440, 900), "FRM-Ingles": (6080, 260, 1440, 900), "FRM-Prefijo": (7600, 260, 1440, 900), "FRM-Publicar": (9120, 260, 1440, 900), "FRM-Publicacion": (10640, 260, 1440, 900), "WA-Chats-Formulario": (0, 1280, 1440, 900), "WA-Chats-Respuesta": (1520, 1280, 1440, 900), "M-FRM-Listado": (0, 2300, 390, 844), "M-FRM-Ficha": (470, 2300, 390, 844), "M-FRM-Pregunta": (940, 2300, 390, 844), "M-WA-Chats-Formulario": (1410, 2300, 390, 844), "M-WA-Conversacion-Respuesta": (1880, 2300, 390, 844)}


def registrar(nombres):
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    if not any(pg["id"] == PAGINA["id"] for pg in c["pages"]):
        k = next(i for i, pg in enumerate(c["pages"]) if pg["id"] == "propuesta-whatsapp")
        c["pages"].insert(k + 1, PAGINA)
    c["notes"].setdefault("t-formularios", {"kind": "title1", "x": 0, "y": 0, "w": 600, "maxW": 8000, "text": PAGINA["name"], "page": PAGINA["id"]})
    for n in nombres:
        x, y, w, h = LUGAR[n]
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n], "page": PAGINA["id"]}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__" and not sys.argv[1:]:
    tableros = {"FRM-Listado": listado(), "FRM-Nuevo": nuevo(), "FRM-Ficha": ficha_final(), "FRM-Pregunta": pregunta(), "FRM-Ingles": ingles(), "FRM-Prefijo": prefijo(), "FRM-Publicar": publicar(), "FRM-Publicacion": publicacion(), "WA-Chats-Formulario": chat_formulario(), "WA-Chats-Respuesta": respuesta(), "M-FRM-Listado": tel_listado(), "M-FRM-Ficha": tel_ficha(), "M-FRM-Pregunta": tel_pregunta(), "M-WA-Chats-Formulario": tel_chat_formulario(), "M-WA-Conversacion-Respuesta": tel_respuesta()}
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    registrar(tableros)
    print("tableros", list(tableros))

if __name__ == "__main__" and sys.argv[1:] == ["ficha-opciones"]:
    for nombre, t in ficha_opciones().items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(ficha_opciones()))

if __name__ == "__main__" and sys.argv[1:] == ["opciones"]:
    for nombre, t in listado_opciones().items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(listado_opciones()))
