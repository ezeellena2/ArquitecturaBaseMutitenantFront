"""E17 · Biblioteca de plantillas de formularios (docs/plans/formularios/e17-texto-diseno.md del back).

Plataforma arma plantillas (página «Plataforma · Formularios», prefijo Plat-FRM-) y la organización las usa (página «Organización ·
Formularios», prefijo FRM-). Usa las piezas de `formularios_1004.py` y `formularios_catalogos_1004.py`. Los tableros base de Plataforma se
leen como quedaron en la v123 (front d5d5edc5), para no seguir cambios posteriores de otros generadores.
"""
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402

PROJ = F.PROJ
BASES_PLAT = "d5d5edc5"


def leer_plat(nombre):
    r = subprocess.run(["git", "show", f"{BASES_PLAT}:docs/design/lienzo/{nombre}.dc.html"], cwd=PROJ, capture_output=True)
    return r.stdout.decode("utf-8") if r.returncode == 0 else (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")


BASE_PLAT = leer_plat("Plat-WA-Plantillas")
SCRIPT = """<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>
class Component extends DCLogic {
  renderVals() {
    return { si: true, no: false };
  }
}
</script>"""


def sb_plat(menu):
    """El menú principal de Plataforma. menu = "admin": Administración prendida; "propio": un ítem «Formularios» con su panel."""
    sb = re.search(r'<aside class="w-sb".*?</aside>', BASE_PLAT, re.S).group(0)
    if menu == "admin":
        return sb
    sb = sb.replace('<a class="w-ln on" href="Auditoria-Plat.dc.html">', '<a class="w-ln" href="Auditoria-Plat.dc.html">')
    whats = re.search(r'<a class="w-ln[^"]*" href="Plat-WA-Chats\.dc\.html">.*?</a>', sb, re.S).group(0)
    return sb.replace(whats, whats + f'<a class="w-ln on" href="Plat-FRM-Biblioteca.dc.html">{F.ICONO} Formularios<span class="fl">{F.FLECHA}</span></a>', 1)


def panel_plat(menu, activo="biblioteca"):
    panel = re.search(r'<aside class="w-panel".*?</aside>', BASE_PLAT, re.S).group(0)
    on_b, on_c = ("on", "") if activo == "biblioteca" else ("", "on")
    if menu == "propio":
        plegar = re.search(r'<button type="button" class="w-plegar".*?</button>', panel, re.S).group(0).replace("Cerrar Administración", "Cerrar Formularios")
        return (f'<aside class="w-panel" aria-label="Formularios">{plegar}<div class="pc">Formularios</div><nav class="w-nav">'
                f'<a class="w-ln {on_b}" href="Plat-FRM-Biblioteca.dc.html">{F.ICONO} Biblioteca</a>'
                f'<a class="w-ln {on_c}" href="Plat-FRM-Categorias.dc.html">{F.LISTA} Categorías</a></nav></aside>')
    # Administración: los grupos de los módulos (WhatsApp, Asistente) y ahora Formularios, abierto, con Biblioteca y Categorías.
    panel = re.sub(r'<div class="w-hijos">.*?</div>', "", panel, flags=re.S)
    panel = re.sub(r'<a class="w-ln on"', '<a class="w-ln"', panel)
    fl = F.FLECHA
    grupo_asis = re.search(r'<span class="w-ln grupo">(<svg.*?</svg>) Asistente <span class="fl">(<svg.*?</svg>)</span></span>', panel, re.S)
    if grupo_asis:
        panel = panel.replace(grupo_asis.group(0), f'<a class="w-ln grupo" href="Plat-Asistente-Config.dc.html">{grupo_asis.group(1)} Asistente <span class="fl">{fl}</span></a>')
    abajo = re.search(r'Asistente <span class="fl">(<svg.*?</svg>)</span>', BASE_PLAT, re.S)
    k = panel.rindex("</nav>")
    return (panel[:k] + f'<span class="w-ln grupo">{F.ICONO} Formularios <span class="fl">{F.CHEV}</span></span>'
            f'<div class="w-hijos"><a class="w-ln {on_b}" href="Plat-FRM-Biblioteca.dc.html">Biblioteca</a>'
            f'<a class="w-ln {on_c}" href="Plat-FRM-Categorias.dc.html">Categorías</a></div>' + panel[k:])


def pagina_plat(nombre, miga, banda, cuerpo, menu="admin", activo="biblioteca", css="", estados=None, js=""):
    t = BASE_PLAT
    t = t.replace(re.search(r'<aside class="w-sb".*?</aside>', t, re.S).group(0), sb_plat(menu))
    t = t.replace(re.search(r'<aside class="w-panel".*?</aside>', t, re.S).group(0), panel_plat(menu, activo))
    t = t.replace("<span>Plataforma / WhatsApp / Plantillas</span>", f"<span>{miga}</span>")
    i = t.index('<div class="w-bnd">')
    j = t.rindex("</div></div></div>\n</x-dc>")
    t = t[:i] + banda + cuerpo + t[j + len("</div></div>"):]
    t = re.sub(r'<script type="text/x-dc" data-dc-script.*?</script>', lambda m: SCRIPT, t, flags=re.S)
    t = re.sub(r"<title>[^<]*</title>", f"<title>{nombre}</title>", t)
    t = t.replace("</helmet>", f'<style data-e17="plataforma">\n{F.CSS}{F.CSS_LISTADO}{F.CSS_FILTRO}{css}</style>\n</helmet>', 1)
    if estados:
        prop, opciones = estados
        props = {prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
        t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
        t = t.replace("    return { si: true, no: false };", f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n{js}")
    return t


# ---------------------------------------------------------------- Plat-FRM-Biblioteca: las plantillas de la plataforma
PLANTILLAS = [
    ("Control de vehículo", "Logística", "off", "Borrador", "", "—"),
    ("Orden de trabajo", "Mantenimiento", "off", "Retirada", "", "—"),
    ("Visita a cliente", "Ventas", "", "Publicada · v2", "Cambios sin publicar", "La usaron 12"),
]
CSS_BIB = """.w-th.b, .w-tr.b { grid-template-columns: minmax(180px, 1.4fr) 160px 230px 150px 40px; }
.w-tr.b > span, .w-tr.b .w-est { font-weight: 400; }
.o-fb { display: flex; flex-wrap: nowrap; align-items: center; gap: 8px; }
.o-fb .w-bus { width: 360px; flex: none; }
.w-tr.b a { color: var(--t1); text-decoration: none; font-weight: 500; }
.w-tr.b .est2 { display: flex; flex-direction: column; gap: 2px; }
.w-tr.b .sucio { font-size: 12px; font-weight: 600; color: oklch(0.55 0.13 70); }
.w-tr.b .gris { color: var(--t3); }
"""


def fila_plantilla(n, cat, clase, estado, sucio, uso):
    s = f'<span class="sucio">{sucio}</span>' if sucio else ""
    u = f'<span class="gris">{uso}</span>' if uso == "—" else uso
    return (f'<div class="w-tr b"><span class="dos"><a href="Plat-FRM-Plantilla.dc.html">{n}</a></span><span>{cat}</span>'
            f'<span class="est2"><span class="w-est {clase}">{estado}</span>{s}</span><span>{u}</span>'
            f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{F.KEBAB}</button></span></div>')


def tabla_plantillas():
    return ('<div class="w-caja"><div class="w-th b"><span>Plantilla</span><span>Categoría</span><span>Estado</span><span>Uso</span><span class="sr">Acciones</span></div>'
            + "".join(fila_plantilla(*p) for p in PLANTILLAS)
            + '<div class="w-pie"><span>1–3 de 3</span><span>10 por página · Página 1 de 1</span></div></div>')


def biblioteca_opciones():
    banda = F.banda("Biblioteca de formularios", "3 plantillas · 1 publicada", f'<a class="cb cb-pri" href="Plat-FRM-Plantilla-Nueva.dc.html">{F.MAS} Nueva plantilla</a>')
    caja = (f'<div class="w-caja o-fb"><span class="w-bus">{F.BUSCAR} Buscar por nombre</span>'
            f'<span class="w-pil">Estado {F.CHEV}</span><span class="w-pil">Categoría {F.CHEV}</span></div>')
    cuerpo = '<div class="w-body">' + caja + tabla_plantillas() + "</div>"
    out = {}
    for v, menu, miga in [("A", "admin", "Plataforma / Administración / Formularios / Biblioteca"), ("B", "propio", "Plataforma / Formularios / Biblioteca")]:
        out[f"Plat-FRM-Bib-{v}"] = pagina_plat(f"Plat-FRM-Bib-{v}", miga, banda, cuerpo, menu=menu, css=CSS_BIB)
    return out


# ---------------------------------------------------------------- Plat-FRM-Biblioteca elegida (A, 14/10): «Formularios» es un grupo de Administración
ESTADOS_BIBLIOTECA = ["Todas", "Filtro abierto", "Borradores", "Sin resultados", "Cargando", "Vacía", "Error"]


def biblioteca():
    filas = []
    for p in PLANTILLAS:
        grupo = {"Borrador": "verBor", "Retirada": "verRet"}.get(p[3], "verPub")
        filas.append(f'<sc-if value="{{{{{grupo}}}}}" hint-placeholder-val="{{{{si}}}}">' + fila_plantilla(*p) + "</sc-if>")
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            + F.filtro("Estado", [("t", "Todos los estados", 3), ("p", "Publicadas", 1), ("b", "Borradores", 1), ("r", "Retiradas", 1)], "est")
            + F.filtro("Categoría", [("t", "Todas las categorías", 3), ("v", "Ventas", 1), ("l", "Logística", 1), ("m", "Mantenimiento", 1)], "cat")
            + '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></sc-if>'
            "</div></sc-if>")
    cuerpo = ('<div class="w-body">' + caja + '<div class="w-caja"><div class="w-th b"><span>Plantilla</span><span>Categoría</span><span>Estado</span><span>Uso</span>'
              '<span class="sr">Acciones</span></div>'
              '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + "".join(filas)
              + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
              '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span>'
              '<span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
              '<sc-if value="{{vacia}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay plantillas.</b></div></sc-if>'
              '<sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ninguna plantilla coincide con los filtros.</b>'
              '<button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></div></sc-if>'
              '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar las plantillas.</b>'
              '<button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div></div>')
    banda = F.banda("Biblioteca de formularios", "{{resumen}}", f'<a class="cb cb-pri" href="Plat-FRM-Plantilla-Nueva.dc.html">{F.MAS} Nueva plantilla</a>')
    js = """    const f = this.state.f ?? e;
    const ir = (x) => this.setState({ f: x, m: false });
    const lista = ['Todas', 'Filtro abierto', 'Borradores'].includes(f);
    const bor = f === 'Borradores';
    const menu = this.state.m ?? f === 'Filtro abierto';
    return {
      si: true, no: false,
      resumen: f === 'Vacía' ? 'Sin plantillas' : f === 'Cargando' || f === 'Error' ? '' : '3 plantillas · 1 publicada',
      conFiltros: f !== 'Vacía',
      estTexto: bor ? 'Estado: Borradores' : 'Estado', estClase: bor ? 'con' : '', estMenu: menu, estAlternar: () => this.setState({ m: !menu }),
      estOn_t: bor ? '' : 'on', estOn_p: '', estOn_b: bor ? 'on' : '', estOn_r: '', estC_t: '3', estC_p: '1', estC_b: '1', estC_r: '1',
      estElegir_t: () => ir('Todas'), estElegir_p: () => ir('Todas'), estElegir_b: () => ir('Borradores'), estElegir_r: () => ir('Todas'),
      catTexto: 'Categoría', catClase: '', catMenu: false, catAlternar: () => {},
      catOn_t: 'on', catOn_v: '', catOn_l: '', catOn_m: '', catC_t: '3', catC_v: '1', catC_l: '1', catC_m: '1',
      catElegir_t: () => {}, catElegir_v: () => {}, catElegir_l: () => {}, catElegir_m: () => {},
      hayFiltro: bor,
      busqueda: f === 'Sin resultados' ? 'inspección' : 'Buscar por nombre', busClase: f === 'Sin resultados' ? 'lleno' : '',
      conFilas: lista, verBor: true, verRet: !bor, verPub: !bor,
      rango: bor ? '1 de 1' : '1–3 de 3',
      cargando: f === 'Cargando', vacia: f === 'Vacía', sinResultados: f === 'Sin resultados', error: f === 'Error',
      limpiar: () => ir('Todas'),
    };"""
    return pagina_plat("Biblioteca de formularios · /plataforma/formularios", "Plataforma / Administración / Formularios / Biblioteca", banda, cuerpo,
                       css=CSS_BIB, estados=("estado", ESTADOS_BIBLIOTECA), js=js)


# ---------------------------------------------------------------- Plat-FRM-Plantilla-Nueva: el nombre y la categoría
ESTADOS_PNUEVA = ["Con los datos", "Vacío", "Sin nombre", "Sin categoría", "Creando"]


def plantilla_nueva():
    t = biblioteca()
    cuerpo = ('<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct {{nClase}}">{{nombre}}</div>'
              '<sc-if value="{{nErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{nErr}}</span></sc-if></div>'
              f'<div class="w-cmp"><span class="rt">Categoría <span class="req">*</span></span><div class="ct sel {{{{cClase}}}}" style="display: flex; justify-content: space-between;">{{{{categoria}}}}{F.CHEV}</div>'
              '<sc-if value="{{cErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{cErr}}</span></sc-if></div>')
    pie = ('<button type="button" class="cb cb-sec" disabled="{{creando}}">Cancelar</button>'
           '<button type="button" class="cb cb-pri" disabled="{{creando}}">{{boton}}</button>')
    t = F.con_dialogo(t, F.dialogo("Nueva plantilla", cuerpo, pie))
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_BIBLIOTECA, ensure_ascii=False, separators=(",", ":")) + ',"default":"Todas"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_PNUEVA, ensure_ascii=False, separators=(",", ":")) + ',"default":"Con los datos"')
    t = t.replace("    const f = this.state.f ?? e;", "    const d = e;\n    const f = this.state.f ?? 'Todas';")
    t = t.replace("      limpiar: () => ir('Todas'),", """      limpiar: () => ir('Todas'),
      nombre: d === 'Vacío' || d === 'Sin nombre' ? 'Por ejemplo, Visita a cliente' : 'Inspección de obra',
      nClase: (d === 'Vacío' || d === 'Sin nombre' ? 'ph ' : '') + (d === 'Sin nombre' ? 'mal' : ''),
      nErr: d === 'Sin nombre' ? 'Escribí un nombre.' : '',
      categoria: d === 'Vacío' || d === 'Sin categoría' ? 'Elegí una categoría' : 'Mantenimiento',
      cClase: (d === 'Vacío' || d === 'Sin categoría' ? 'ph ' : '') + (d === 'Sin categoría' ? 'mal' : ''),
      cErr: d === 'Sin categoría' ? 'Elegí una categoría.' : '',
      creando: d === 'Creando', boton: d === 'Creando' ? 'Creando…' : 'Crear plantilla',""")
    return re.sub(r"<title>[^<]*</title>", "<title>Nueva plantilla de formulario</title>", t)


# ---------------------------------------------------------------- Plat-FRM-Plantilla: el editor de la E12 en Plataforma, con la pestaña «Catálogos»
import formularios_catalogos_1004 as K  # noqa: E402

CSS_PFICHA = """.f-bnd-est .uso { color: var(--t2); }
.k-cab2 { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; padding: 0 12px 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.k-cab2 .sub { font-weight: 400; color: var(--t3); margin-left: 8px; }
.k-cab2 .ac { display: flex; gap: 6px; align-items: center; }
.k-cab2 .cb { height: 32px; font-size: 13px; }
.w-th.c, .w-tr.c { grid-template-columns: minmax(180px, 1.4fr) 120px minmax(0, 1fr) 40px; }
.w-tr.c a { color: var(--t1); text-decoration: none; font-weight: 500; }
.d-g3 { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 16px; padding: 16px; }
.d-g3 .ancho { grid-column: 1 / -1; }
.w-cmp .ct.area { height: 64px; white-space: normal; line-height: 1.45; padding-top: 8px; display: block; }
"""


def datos_plantilla():
    return ('<div class="w-caja"><div class="f-cab"><span>Datos</span></div><div class="d-g3">'
            '<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">Visita a cliente</div></div>'
            '<div class="w-cmp"><span class="rt">Prefijo sugerido <span class="req">*</span></span><div class="ct">VIS</div></div>'
            f'<div class="w-cmp"><span class="rt">Categoría <span class="req">*</span></span><div class="ct sel" style="display: flex; justify-content: space-between;">Ventas{F.CHEV}</div></div><span></span>'
            '<div class="w-cmp ancho"><span class="rt">Descripción</span><div class="ct area">Lo que pasó en la visita a un cliente: si se concretó la venta, el monto y el motivo.</div></div>'
            "</div></div>")


def plat_ficha(pestana, cuerpo_pestana, acciones, estado_banda):
    tabs = "".join(f'<a class="{"on" if n == pestana else ""}" role="tab" aria-selected="{"true" if n == pestana else "false"}" href="{h}.dc.html">{n}{c}</a>'
                   for n, c, h in [("Preguntas", ' <span class="c">6</span>', "Plat-FRM-Plantilla"), ("Inglés", "", "Plat-FRM-Plantilla"),
                                   ("Catálogos", ' <span class="c">1</span>', "Plat-FRM-Plantilla"), ("Publicación", "", "Plat-FRM-Plantilla")])
    banda = (f'<div class="w-bnd"><div class="iz"><span class="ic">{F.ICONO}</span><div><h1>Visita a cliente</h1>'
             f'<p class="res f-bnd-est">{estado_banda}</p></div></div><div class="ac">{acciones}</div></div>')
    body = f'<div class="w-body"><div class="o-tabs ficha" role="tablist">{tabs}</div>{cuerpo_pestana}</div>'
    return pagina_plat("Plantilla de formulario", "Plataforma / Administración / Formularios / Biblioteca / Visita a cliente", banda, body,
                       css=F.CSS_FICHA + F.CSS_DATOS + F.CSS_ESTADOS + K.CSS_FICHA_CAT + K.CSS_FICHA_CAT2 + CSS_PFICHA)


ESTADO_PLANTILLA = ('<span class="w-est">Publicada · v2</span><span class="f-sucio">Cambios sin publicar</span><span class="uso">La usaron 12</span>')


def catalogos_opciones():
    acciones = '<a class="cb cb-pri" href="Plat-FRM-Publicar.dc.html">Publicar</a>'
    _, tabla = K.tabla_opciones(con_caja_filtros=False)
    a_cuerpo = ('<div class="k-pila ancha"><div class="w-caja k-tab"><div class="k-cab2"><span>Motivos de visita<span class="sub">La usa la pregunta 5 · Motivo</span></span>'
                f'<span class="ac"><button type="button" class="cb cb-sec">{F.MAS} Agregar opción</button><button type="button" class="ib" aria-label="Acciones de Motivos de visita">{F.KEBAB}</button></span></div>'
                + tabla.replace('<div class="w-caja">', "", 1)
                + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{F.MAS} Agregar catálogo</button></div>')
    b_cuerpo = ('<div class="k-pila ancha"><div class="w-caja"><div class="k-cab2"><span>Catálogos de la plantilla</span>'
                f'<button type="button" class="cb cb-sec">{F.MAS} Agregar catálogo</button></div>'
                '<div class="w-th c"><span>Catálogo</span><span>Opciones</span><span>La usa</span><span class="sr">Acciones</span></div>'
                f'<div class="w-tr c"><span><a href="#">Motivos de visita</a></span><span>4</span><span>Pregunta 5 · Motivo</span>'
                f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de Motivos de visita">{F.KEBAB}</button></span></div></div></div>')
    return {"Plat-FRM-PlCat-A": plat_ficha("Catálogos", a_cuerpo, acciones, ESTADO_PLANTILLA),
            "Plat-FRM-PlCat-B": plat_ficha("Catálogos", b_cuerpo, acciones, ESTADO_PLANTILLA),
            "Plat-FRM-PlPreg": plat_ficha("Preguntas", '<div class="f-cols" style="margin-top: 16px;"><div class="f-pila">' + datos_plantilla()
                                          + F.lista_preguntas().split('<div class="w-caja"><div class="f-cab"><span>Preguntas</span>', 1)[1].join(['<div class="w-caja"><div class="f-cab"><span>Preguntas</span>', ''])
                                          + "</div>" + F.vista_previa() + "</div>", acciones, ESTADO_PLANTILLA)}


CATALOGOS_OT = [
    ("Tipos de trabajo", "Pregunta 2 · Tipo de trabajo", [("Preventivo", "Revisión programada", "PRE", True), ("Correctivo", "Algo dejó de andar", "COR", True),
                                                          ("Urgencia", "Hay que ir hoy", "URG", True)]),
    ("Equipos", "Pregunta 3 · Equipo", [("Bomba de agua", "", "BOM", True), ("Tablero eléctrico", "", "TAB", True), ("Aire acondicionado", "", "AIR", True),
                                        ("Caldera", "", "CAL", True)]),
    ("Repuestos", "Pregunta 6 · Repuestos usados", [("Filtro", "", "FIL", True), ("Correa", "", "COR", True), ("Fusible", "", "FUS", True),
                                                     ("Válvula", "", "VAL", True), ("Termostato", "", "TER", True)]),
]


def caja_catalogo(nombre, usa, opciones, abierta=True):
    filas = "".join(K.fila_opcion(k + 1, tx, det or "—", cod, act) for k, (tx, det, cod, act) in enumerate(opciones))
    cab = ('<div class="w-th o"><span>#</span><span>Texto</span><span>Detalle</span><span>Código</span><span>Estado</span><span class="sr">Acciones</span></div>')
    return (f'<div class="w-caja k-tab"><div class="k-cab2"><span>{nombre}<span class="sub">La usa la {usa.lower()}</span></span>'
            f'<span class="ac"><button type="button" class="cb cb-sec">{F.MAS} Agregar opción</button><button type="button" class="ib" aria-label="Acciones de {nombre}">{F.KEBAB}</button></span></div>'
            + cab + filas + "</div>")


def multi_opciones():
    acciones = '<a class="cb cb-pri" href="Plat-FRM-Publicar.dc.html">Publicar</a>'
    estado = '<span class="w-est">Publicada · v1</span><span class="uso">La usaron 3</span>'
    a = ('<div class="k-pila ancha">' + "".join(caja_catalogo(*c) for c in CATALOGOS_OT)
         + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{F.MAS} Agregar catálogo</button></div>')
    filas_b = "".join(f'<div class="w-tr c"><span><a href="#">{n}</a></span><span>{len(ops)}</span><span>{usa}</span>'
                      f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{F.KEBAB}</button></span></div>'
                      for n, usa, ops in CATALOGOS_OT)
    b = ('<div class="k-pila ancha"><div class="w-caja"><div class="k-cab2"><span>Catálogos de la plantilla</span>'
         f'<button type="button" class="cb cb-sec">{F.MAS} Agregar catálogo</button></div>'
         '<div class="w-th c"><span>Catálogo</span><span>Opciones</span><span>La usa</span><span class="sr">Acciones</span></div>' + filas_b + "</div></div>")
    t_a = plat_ficha("Catálogos", a, acciones, estado).replace("<h1>Visita a cliente</h1>", "<h1>Orden de trabajo</h1>").replace("/ Visita a cliente</span>", "/ Orden de trabajo</span>")
    t_a = t_a.replace('Catálogos <span class="c">1</span>', 'Catálogos <span class="c">3</span>')
    t_b = plat_ficha("Catálogos", b, acciones, estado).replace("<h1>Visita a cliente</h1>", "<h1>Orden de trabajo</h1>").replace("/ Visita a cliente</span>", "/ Orden de trabajo</span>")
    t_b = t_b.replace('Catálogos <span class="c">1</span>', 'Catálogos <span class="c">3</span>')
    n, usa, ops = CATALOGOS_OT[1]
    filas_d = "".join(K.fila_opcion(k + 1, tx, det or "—", cod, act) for k, (tx, det, cod, act) in enumerate(ops))
    dlg = F.dialogo(f"{n} · {usa}", '<div class="w-caja k-tab" style="grid-column: 1 / -1;"><div class="w-th o"><span>#</span><span>Texto</span><span>Detalle</span><span>Código</span><span>Estado</span><span class="sr">Acciones</span></div>'
                    + filas_d + "</div>", f'<button type="button" class="cb cb-sec">{F.MAS} Agregar opción</button><button type="button" class="cb cb-pri">Listo</button>', una=False)
    t_b2 = F.con_dialogo(t_b, dlg.replace('class="w-dlg"', 'class="w-dlg" style="width: 760px;"', 1))
    return {"Plat-FRM-Multi-A": t_a, "Plat-FRM-Multi-B": t_b, "Plat-FRM-Multi-B2": t_b2}


# ---------------------------------------------------------------- canvas.json: la página «Plataforma · Formularios» y los de la organización
PAGINA_PLAT = {"id": "plat-formularios", "name": "Plataforma · Formularios"}
TITULOS = {"Plat-FRM-Biblioteca": "Plataforma · Biblioteca de formularios", "Plat-FRM-Plantilla-Nueva": "Plataforma · nueva plantilla"}
LUGAR = {"Plat-FRM-Biblioteca": (0, 260, 1440, 900, "plat-formularios"), "Plat-FRM-Plantilla-Nueva": (1520, 260, 1440, 900, "plat-formularios")}


def registrar(nombres):
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    if not any(pg["id"] == PAGINA_PLAT["id"] for pg in c["pages"]):
        k = next(i for i, pg in enumerate(c["pages"]) if pg["id"] == "plataforma")
        c["pages"].insert(k + 1, PAGINA_PLAT)
    c["notes"].setdefault("t-plat-formularios", {"kind": "title1", "x": 0, "y": 0, "w": 600, "maxW": 8000, "text": PAGINA_PLAT["name"], "page": PAGINA_PLAT["id"]})
    for n in nombres:
        x, y, w, h, pagina = LUGAR[n]
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n], "page": pagina}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__" and not sys.argv[1:]:
    tableros = {"Plat-FRM-Biblioteca": biblioteca(), "Plat-FRM-Plantilla-Nueva": plantilla_nueva()}
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    registrar(tableros)
    print("tableros", list(tableros))

if __name__ == "__main__" and sys.argv[1:] == ["multi-opciones"]:
    for n, t in multi_opciones().items():
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(multi_opciones()))

if __name__ == "__main__" and sys.argv[1:] == ["catalogos-opciones"]:
    for n, t in catalogos_opciones().items():
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(catalogos_opciones()))

if __name__ == "__main__" and sys.argv[1:] == ["biblioteca-opciones"]:
    for n, t in biblioteca_opciones().items():
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(biblioteca_opciones()))
