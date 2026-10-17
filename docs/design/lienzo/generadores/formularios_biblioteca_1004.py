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


# ---------------------------------------------------------------- Plat-FRM-Plantilla elegida (Catálogos B, 16/10): la ficha con sus cuatro pestañas
ESTADOS_PFICHA = ["Preguntas", "Cambios sin guardar", "Otra persona cambió", "Inglés", "Catálogos", "Un catálogo abierto",
                  "Publicación", "Publicación: menú", "Publicación: borrador", "Publicación: retirada"]
RETIRAR = F.svg('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>', 16)
CSS_PFICHA2 = """.w-bnd .ac { position: relative; }
.w-bnd .ac .f-menu { top: calc(100% + 6px); right: 0; left: auto; }
.w-th.v, .w-tr.v { grid-template-columns: 90px 170px 170px minmax(0, 1fr); }
.f-sucio.pub { color: oklch(0.55 0.13 70); font-weight: 600; }
"""


def plat_partes(pestana, cuerpo_pestana, acciones, estado_banda, nombre="Visita a cliente", cuentas=("6", "1")):
    """La banda y el cuerpo de la ficha de una plantilla (para armar los estados con sc-if)."""
    cp, cc = cuentas
    tabs = "".join(f'<a class="{"on" if n == pestana else ""}" role="tab" aria-selected="{"true" if n == pestana else "false"}" href="Plat-FRM-Plantilla.dc.html">{n}{c}</a>'
                   for n, c in [("Preguntas", f' <span class="c">{cp}</span>'), ("Inglés", ""),
                                ("Catálogos", f' <span class="c">{cc}</span>' if cc != "0" else ""), ("Publicación", "")])
    banda = (f'<div class="w-bnd"><div class="iz"><span class="ic">{F.ICONO}</span><div><h1>{nombre}</h1>'
             f'<p class="res f-bnd-est">{estado_banda}</p></div></div><div class="ac">{acciones}</div></div>')
    return banda, f'<div class="w-body"><div class="o-tabs ficha" role="tablist">{tabs}</div>{cuerpo_pestana}</div>'


def preguntas_plantilla():
    return ('<div class="f-cols" style="margin-top: 16px;"><div class="f-pila">' + datos_plantilla()
            + F.lista_preguntas().split('<div class="w-caja"><div class="f-cab"><span>Preguntas</span>', 1)[1].join(['<div class="w-caja"><div class="f-cab"><span>Preguntas</span>', ''])
            + "</div>" + F.vista_previa() + "</div>")


def ingles_plantilla():
    filas = "".join(f'<div class="i-tab"><span class="q{" op" if q == "Opción" else ""}">{q}</span><span class="es">{es}</span><div class="en">{en}</div></div>'
                    for q, es, en in F.TEXTOS_EN)
    tabla = '<div class="w-caja"><div class="i-tab cab"><span></span><span>Español</span><span>Inglés</span></div>' + filas + "</div>"
    prev = F.vista_previa().replace('<span class="on">Español</span><span>Inglés</span>', '<span>Español</span><span class="on">Inglés</span>')
    for a, b in [("Visita a cliente", "Customer visit"), (">Cliente<", ">Customer<"), ("Fecha de la visita (opcional)", "Visit date (optional)"),
                 ("Elegí una fecha", "Select a date"), ("¿Se concretó la venta? (opcional)", "Was the sale closed? (optional)"), (">Sí<", ">Yes<"),
                 ("Monto estimado (opcional)", "Estimated amount (optional)"), ("Usá punto para los decimales", "Use a period for decimals"),
                 ("Motivo (opcional)", "Reason (optional)"), ("Elegí una opción", "Select an option"), ("Observaciones (opcional)", "Notes (optional)"), (">Enviar<", ">Send<")]:
        assert prev.count(a) == 1, a
        prev = prev.replace(a, b)
    return '<div class="f-cols" style="margin-top: 16px;"><div class="f-pila">' + tabla + "</div>" + prev + "</div>"


def catalogos_plantilla():
    return ('<div class="k-pila ancha" style="margin-top: 16px;"><div class="w-caja"><div class="k-cab2"><span>Catálogos de la plantilla</span>'
            f'<button type="button" class="cb cb-sec">{F.MAS} Agregar catálogo</button></div>'
            '<div class="w-th c"><span>Catálogo</span><span>Opciones</span><span>La usa</span><span class="sr">Acciones</span></div>'
            f'<div class="w-tr c"><span><a href="#">Motivos de visita</a></span><span>4</span><span>Pregunta 5 · Motivo</span>'
            f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de Motivos de visita">{F.KEBAB}</button></span></div></div></div>')


def dialogo_catalogo():
    _, tabla = K.tabla_opciones(con_caja_filtros=False)
    tabla = tabla.replace('<div class="w-caja">', '<div class="w-caja k-tab" style="grid-column: 1 / -1;">', 1)
    dlg = F.dialogo("Motivos de visita · Pregunta 5 · Motivo", tabla, f'<button type="button" class="cb cb-sec">{F.MAS} Agregar opción</button><button type="button" class="cb cb-pri">Listo</button>', una=False)
    return dlg.replace('class="w-dlg"', 'class="w-dlg" style="width: 760px;"', 1)


def publicacion_plantilla(tipo):
    """tipo: publicada, borrador o retirada."""
    if tipo == "publicada":
        estado = F.grilla([("Estado", '<span class="w-est">Publicada · v2</span> <span class="f-sucio pub">Cambios sin publicar</span>'),
                           ("La usaron", "12 organizaciones"), ("Última publicación", "05/10/2026 11:20 · Laura Díaz")])
        versiones = [("2", "05/10/2026 11:20", "Laura Díaz", "Agrega el monto estimado."), ("1", "28/09/2026 16:05", "Martín Sosa", "Primera versión.")]
    elif tipo == "retirada":
        estado = F.grilla([("Estado", '<span class="w-est off">Retirada</span>'), ("La usaron", "3 organizaciones"),
                           ("Retirada", "10/10/2026 09:40 · Martín Sosa"), ("Motivo", "Se reemplaza por una más corta.")])
        versiones = [("1", "01/10/2026 15:30", "Laura Díaz", "Primera versión.")]
    else:
        estado = F.grilla([("Estado", '<span class="w-est off">Borrador</span>'), ("La usaron", None)]).replace("Sin respuesta", "Todavía nadie")
        versiones = []
    filas = "".join(f'<div class="w-tr v"><span>{n}</span><span>{f}</span><span>{p}</span><span>{m}</span></div>' for n, f, p, m in versiones)
    tabla = ('<div class="w-th v"><span>Versión</span><span>Publicada</span><span>Por</span><span>Motivo</span></div>' + filas) if versiones \
        else '<div class="pb-vacio">Todavía no se publicó.</div>'
    return ('<div class="f-pila" style="margin-top: 16px; max-width: 880px;"><div class="w-caja"><div class="f-cab"><span>Estado</span></div>'
            f'<div class="pb-in">{estado}</div></div><div class="w-caja"><div class="f-cab"><span>Versiones</span></div>{tabla}</div></div>')


def plantilla_ficha():
    pub = '<a class="cb cb-pri" href="Plat-FRM-Publicar.dc.html">Publicar</a>'
    kebab = f'<button type="button" class="ib o-borde" aria-label="Acciones de la plantilla" aria-haspopup="menu">{F.KEBAB}</button>'
    menu = (f'<div class="f-menu" role="menu" aria-label="Acciones de la plantilla"><a class="f-mi pel" role="menuitem" href="Plat-FRM-Retirar.dc.html">{RETIRAR} Retirar</a></div>')
    sucio_acc = ('<button type="button" class="cb cb-sec">Descartar cambios</button><button type="button" class="cb cb-pri">Guardar cambios</button>'
                 '<button type="button" class="cb cb-sec">Publicar</button>')
    est = ESTADO_PLANTILLA
    est_sucio = est.replace('<span class="f-sucio">Cambios sin publicar</span>', '<span class="f-sucio">Cambios sin guardar</span>')
    cartel = ('<div class="w-cartel" role="alert" style="margin-top: 16px;">' + F.ALERTA
              + '<span class="tx">Otra persona cambió esto mientras lo editabas.</span><button type="button" class="cb cb-enl">Seguir editando</button>'
              '<button type="button" class="cb cb-sec">Ver lo nuevo</button></div>')
    partes = {
        "Preguntas": plat_partes("Preguntas", preguntas_plantilla(), pub + kebab, est),
        "Cambios sin guardar": plat_partes("Preguntas", preguntas_plantilla(), sucio_acc, est_sucio),
        "Otra persona cambió": plat_partes("Preguntas", cartel + preguntas_plantilla(), sucio_acc, est_sucio),
        "Inglés": plat_partes("Inglés", ingles_plantilla(), pub + kebab, est),
        "Catálogos": plat_partes("Catálogos", catalogos_plantilla(), pub + kebab, est),
        "Un catálogo abierto": plat_partes("Catálogos", catalogos_plantilla(), pub + kebab, est),
        "Publicación": plat_partes("Publicación", publicacion_plantilla("publicada"), pub + kebab, est),
        "Publicación: menú": plat_partes("Publicación", publicacion_plantilla("publicada"), pub + kebab + menu, est),
        "Publicación: borrador": plat_partes("Publicación", publicacion_plantilla("borrador"), pub, '<span class="w-est off">Borrador</span>',
                                             nombre="Control de vehículo", cuentas=("5", "0")),
        "Publicación: retirada": plat_partes("Publicación", publicacion_plantilla("retirada"), '<a class="cb cb-pri" href="Plat-FRM-Publicar.dc.html">Volver a publicar</a>',
                                             '<span class="w-est off">Retirada</span><span class="uso">La usaron 3</span>', nombre="Orden de trabajo", cuentas=("6", "3")),
    }
    banda = "".join(f'<sc-if value="{{{{s{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{b}</sc-if>' for i, (b, _) in enumerate(partes.values()))
    cuerpo = "".join(f'<sc-if value="{{{{s{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{c}</sc-if>' for i, (_, c) in enumerate(partes.values()))
    miga = "Plataforma / Administración / Formularios / Biblioteca / {{nombre}}"
    js = ("    const k = " + json.dumps(ESTADOS_PFICHA, ensure_ascii=False) + ".indexOf(e);\n"
          "    return {\n      si: true, no: false,\n"
          + "".join(f"      s{i}: k === {i},\n" for i in range(len(ESTADOS_PFICHA)))
          + "      nombre: e === 'Publicación: borrador' ? 'Control de vehículo' : e === 'Publicación: retirada' ? 'Orden de trabajo' : 'Visita a cliente',\n"
          "    };")
    t = pagina_plat("Plantilla de formulario · /plataforma/formularios/:id", miga, banda, cuerpo,
                    css=F.CSS_FICHA + F.CSS_DATOS + F.CSS_ESTADOS + F.CSS_INGLES + F.CSS_PUBLICACION + F.CSS_GRILLA + K.CSS_FICHA_CAT + K.CSS_FICHA_CAT2 + CSS_PFICHA + CSS_PFICHA2,
                    estados=("estado", ESTADOS_PFICHA), js=js)
    return F.con_dialogo(t, '<sc-if value="{{s5}}" hint-placeholder-val="{{no}}">' + dialogo_catalogo() + "</sc-if>")


# ---------------------------------------------------------------- Plat-FRM-Publicar: el motivo y la comprobación (B8), sobre la ficha
ESTADOS_PPUBLICAR = ["Sin problemas", "Con problemas", "Sin motivo", "Primera publicación", "Volver a publicar", "Comprobando", "Publicando", "Otra persona cambió"]
INDICES_PFICHA = {"Primera publicación": 8, "Volver a publicar": 9}


def plantilla_publicar():
    t = plantilla_ficha()
    motivo = ('<div class="p-sec"><div class="w-cmp"><span class="rt">Motivo <span class="req">*</span></span><div class="ct area {{mClase}}">{{motivo}}</div>'
              '<sc-if value="{{mErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{mErr}}</span></sc-if></div></div>')
    prob = lambda tit, tx, acc, href: (f'<div class="p-prob"><span class="mal">{F.ALERTA}</span><span class="tx"><b>{tit}</b><span>{tx}</span></span>'  # noqa: E731
                                       f'<a href="{href}">{acc}</a></div>')
    cuerpo = (
        '<sc-if value="{{dCambios}}" hint-placeholder-val="{{si}}"><div class="p-sec"><span class="p-tit">Qué cambia en la versión 3</span>'
        + F.grilla([("Pregunta 6 · Observaciones", "Ahora es obligatoria."), ("Motivos de visita", "Suma la opción «Cobranza».")]) + "</div></sc-if>"
        '<sc-if value="{{dMisma}}" hint-placeholder-val="{{no}}"><div class="p-sec"><span class="p-tit">Vuelve a la biblioteca</span>'
        + F.grilla([("Versión", "1 · la misma que estaba publicada")]) + "</div></sc-if>"
        '<sc-if value="{{dProblemas}}" hint-placeholder-val="{{no}}"><div class="p-sec"><span class="p-tit">Antes hay que resolver</span>'
        + prob("Pregunta 6 · Observaciones", "Falta el texto en inglés.", "Editar", "Plat-FRM-Plantilla.dc.html")
        + prob("Catálogo · Motivos de visita", "La opción «Cobranza» no tiene texto en inglés.", "Ver el catálogo", "Plat-FRM-Plantilla.dc.html") + "</div></sc-if>"
        f'<sc-if value="{{{{dConflicto}}}}" hint-placeholder-val="{{{{no}}}}"><div class="p-aviso mal" role="alert">{F.ALERTA}<span>Otra persona cambió esto mientras lo editabas.</span></div></sc-if>'
        '<sc-if value="{{dComprobando}}" hint-placeholder-val="{{no}}"><div class="p-sec"><span class="p-tit">Comprobando…</span><div class="p-esq">'
        '<span style="width: 85%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
        '<sc-if value="{{dMotivo}}" hint-placeholder-val="{{si}}">' + motivo + "</sc-if>")
    pie = ('<button type="button" class="cb cb-sec" disabled="{{pOcupado}}">Cancelar</button>'
           '<sc-if value="{{pPublicar}}" hint-placeholder-val="{{si}}"><button type="button" class="cb cb-pri" disabled="{{pApagado}}">{{pTexto}}</button></sc-if>'
           '<sc-if value="{{dConflicto}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-pri">Ver lo nuevo</button></sc-if>')
    t = F.con_dialogo(t, '<sc-if value="{{conPublicar}}" hint-placeholder-val="{{si}}">' + F.dialogo("{{dTitulo}}", cuerpo, pie) + "</sc-if>",
                      F.CSS_PUBLICAR + ".w-dlg .w-cmp .ct.area { height: 72px; }\n.w-dlg .w-cmp .ct.area.ph { color: var(--t3); }\n.w-dlg .w-cmp .ct.area.mal { border-color: var(--peligro); }\n")
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_PFICHA, ensure_ascii=False, separators=(",", ":")) + ',"default":"Preguntas"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_PPUBLICAR, ensure_ascii=False, separators=(",", ":")) + ',"default":"Sin problemas"')
    viejo = "    const k = " + json.dumps(ESTADOS_PFICHA, ensure_ascii=False) + ".indexOf(e);\n"
    assert viejo in t
    t = t.replace(viejo, "    // El diálogo se abre sobre la pestaña Publicación de cada plantilla.\n    const d = e;\n"
                  f"    const k = {json.dumps(INDICES_PFICHA, ensure_ascii=False)}[d] ?? 6;\n")
    t = t.replace("      nombre: e === 'Publicación: borrador'", """      conPublicar: true,
      dTitulo: d === 'Volver a publicar' ? 'Volver a publicar «Orden de trabajo»' : d === 'Primera publicación' ? 'Publicar «Control de vehículo»' : 'Publicar «Visita a cliente»',
      dCambios: ['Sin problemas', 'Con problemas', 'Sin motivo', 'Publicando'].includes(d), dMisma: d === 'Volver a publicar',
      dProblemas: d === 'Con problemas', dConflicto: d === 'Otra persona cambió', dComprobando: d === 'Comprobando',
      dMotivo: !['Con problemas', 'Otra persona cambió', 'Comprobando'].includes(d),
      motivo: ['Sin problemas', 'Publicando'].includes(d) ? 'Observaciones obligatoria y opción Cobranza.' : d === 'Volver a publicar' ? 'Se vuelve a ofrecer.' : 'Contá por qué se publica',
      mClase: ['Sin problemas', 'Publicando', 'Volver a publicar'].includes(d) ? '' : d === 'Sin motivo' ? 'ph mal' : 'ph',
      mErr: d === 'Sin motivo' ? 'Escribí el motivo.' : '',
      pPublicar: d !== 'Otra persona cambió', pApagado: ['Con problemas', 'Comprobando', 'Publicando'].includes(d), pOcupado: d === 'Publicando',
      pTexto: d === 'Publicando' ? 'Publicando…' : d === 'Volver a publicar' ? 'Volver a publicar' : d === 'Primera publicación' ? 'Publicar versión 1' : 'Publicar versión 3',
      nombre: d === 'Primera publicación' ? 'Control de vehículo' : d === 'Volver a publicar' ? 'Orden de trabajo' : 'Visita a cliente',
      nombre2: e === 'Publicación: borrador'""")
    return re.sub(r"<title>[^<]*</title>", "<title>Publicar una plantilla de formulario</title>", t)


# ---------------------------------------------------------------- Plat-FRM-Retirar: el motivo; las copias ya hechas no cambian
ESTADOS_PRETIRAR = ["Con el motivo", "Sin motivo", "Retirando", "Otra persona cambió"]


def plantilla_retirar():
    t = plantilla_ficha()
    cuerpo = ('<sc-if value="{{dConflicto}}" hint-placeholder-val="{{no}}">'
              f'<div class="p-aviso mal" role="alert">{F.ALERTA}<span>Otra persona cambió esto mientras lo editabas.</span></div></sc-if>'
              '<sc-if value="{{dMotivo}}" hint-placeholder-val="{{si}}"><div class="p-sec"><div class="w-cmp"><span class="rt">Motivo <span class="req">*</span></span>'
              '<div class="ct area {{mClase}}">{{motivo}}</div><sc-if value="{{mErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{mErr}}</span></sc-if></div></div></sc-if>')
    pie = ('<button type="button" class="cb cb-sec" disabled="{{pOcupado}}">Cancelar</button>'
           '<sc-if value="{{dMotivo}}" hint-placeholder-val="{{si}}"><button type="button" class="cb cb-pel lleno" disabled="{{pOcupado}}">{{pTexto}}</button></sc-if>'
           '<sc-if value="{{dConflicto}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-pri">Ver lo nuevo</button></sc-if>')
    texto = '<p class="d-tx">Deja de aparecer en la biblioteca de las organizaciones. Las copias que ya hicieron no cambian.</p>'
    dlg = F.dialogo("Retirar «Visita a cliente»", texto + cuerpo, pie)
    t = F.con_dialogo(t, dlg, F.CSS_PUBLICAR + ".w-dlg .w-cmp .ct.area { height: 72px; }\n.w-dlg .w-cmp .ct.area.ph { color: var(--t3); }\n"
                      ".w-dlg .w-cmp .ct.area.mal { border-color: var(--peligro); }\n.w-dlg .d-tx { grid-column: 1 / -1; margin: 0; font-size: 14px; line-height: 1.5; color: var(--t2); }\n"
                      ".w-dlg .df .cb-pel[disabled] { opacity: 0.55; }\n")
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_PFICHA, ensure_ascii=False, separators=(",", ":")) + ',"default":"Preguntas"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_PRETIRAR, ensure_ascii=False, separators=(",", ":")) + ',"default":"Con el motivo"')
    viejo = "    const k = " + json.dumps(ESTADOS_PFICHA, ensure_ascii=False) + ".indexOf(e);\n"
    assert viejo in t
    t = t.replace(viejo, "    // El diálogo sale del ⋮ de la banda, en la pestaña Publicación.\n    const d = e;\n    const k = 6;\n")
    t = t.replace("      nombre: e === 'Publicación: borrador'", """      dConflicto: d === 'Otra persona cambió', dMotivo: d !== 'Otra persona cambió',
      motivo: d === 'Sin motivo' ? 'Contá por qué se retira' : 'Se reemplaza por «Visita comercial».',
      mClase: d === 'Sin motivo' ? 'ph mal' : '', mErr: d === 'Sin motivo' ? 'Escribí el motivo.' : '',
      pOcupado: d === 'Retirando', pTexto: d === 'Retirando' ? 'Retirando…' : 'Retirar',
      nombre: e === 'Publicación: borrador'""")
    return re.sub(r"<title>[^<]*</title>", "<title>Retirar una plantilla de formulario</title>", t)


# ---------------------------------------------------------------- Plat-FRM-Categorias: la lista corta de la plataforma, con su orden y motivo
CATEGORIAS = [("Ventas", "Sales", 1), ("Logística", "Logistics", 1), ("Mantenimiento", "Maintenance", 1), ("Calidad", "Quality", 0)]
ESTADOS_CAT = ["Lista", "Menú de una sin plantillas", "Menú de una en uso", "Nueva categoría", "Editar", "Subir", "Borrar", "Sin motivo", "Vacía"]
CSS_CAT = """.w-th.g, .w-tr.g { grid-template-columns: 56px minmax(0, 1fr) 160px 40px; }
.w-tr.g { position: relative; }
.w-tr.g .num { display: inline-flex; width: 26px; height: 26px; align-items: center; justify-content: center; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12.5px; font-weight: 600; }
.w-tr.g .f-menu { top: 40px; right: 8px; }
.f-mi.off { color: var(--t3); cursor: default; align-items: flex-start; }
.f-mi.off svg { color: var(--t3); margin-top: 2px; }
.f-mi .mot { display: flex; flex-direction: column; gap: 2px; }
.f-mi .mot small { font-size: 12.5px; color: var(--t3); white-space: normal; }
.f-menu.ancho { min-width: 280px; }
.w-body .w-caja:has(.f-menu) { overflow: visible; }
.w-caja:has(.f-menu) .w-th.g { border-radius: 12px 12px 0 0; }
.w-tr.g .f-menu.arriba { top: auto; bottom: 40px; }
.w-dlg .w-cmp .ct.area { height: 72px; }
.w-dlg .w-cmp .ct.ph { color: var(--t3); }
.w-dlg .w-cmp .ct.mal { border-color: var(--peligro); }
.w-dlg .d-tx { grid-column: 1 / -1; margin: 0; font-size: 14px; line-height: 1.5; color: var(--t2); }
"""


def menu_categoria(k, en_uso_variante="A"):
    n, _, usos = CATEGORIAS[k]
    items = [f'<span class="f-mi" role="menuitem">{F.LAPIZ} Editar</span>']
    if k > 0:
        items.append(f'<span class="f-mi" role="menuitem">{F.ARRIBA} Subir</span>')
    if k < len(CATEGORIAS) - 1:
        items.append(f'<span class="f-mi" role="menuitem">{F.ABAJO} Bajar</span>')
    items.append('<span class="f-sep" role="separator"></span>')
    if usos and en_uso_variante == "A":
        mot = f'La usa {usos} plantilla. Cambiale la categoría primero.' if usos == 1 else f'La usan {usos} plantillas. Cambiales la categoría primero.'
        items.append(f'<span class="f-mi off" role="menuitem" aria-disabled="true">{F.QUITAR}<span class="mot">Borrar<small>{mot}</small></span></span>')
    else:
        items.append(f'<span class="f-mi pel" role="menuitem">{F.QUITAR} Borrar</span>')
    clase = (" ancho" if usos else "") + (" arriba" if k == len(CATEGORIAS) - 1 else "")
    return f'<div class="f-menu{clase}" role="menu" aria-label="Acciones de {n}">' + "".join(items) + "</div>"


def categorias(variante="A"):
    filas = []
    for k, (es, en, usos) in enumerate(CATEGORIAS):
        menus = ""
        if k == 3:
            menus += '<sc-if value="{{c1}}" hint-placeholder-val="{{no}}">' + menu_categoria(k, variante) + "</sc-if>"
        if k == 1 and variante == "A":
            menus += '<sc-if value="{{c2}}" hint-placeholder-val="{{no}}">' + menu_categoria(k, variante) + "</sc-if>"
        uso = f"{usos} plantilla" if usos == 1 else ('<span class="gris">—</span>' if usos == 0 else f"{usos} plantillas")
        filas.append(f'<div class="w-tr g"><span><span class="num">{k + 1}</span></span><span class="dos"><b style="font-weight: 500;">{es}</b><span class="n2">{en}</span></span>'
                     f'<span>{uso}</span><span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {es}">{F.KEBAB}</button></span>{menus}</div>')
    cuerpo = ('<div class="w-body"><div class="w-caja"><div class="w-th g"><span>Orden</span><span>Categoría</span><span>Plantillas</span><span class="sr">Acciones</span></div>'
              '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + "".join(filas)
              + '<div class="w-pie"><span>1–4 de 4</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
              '<sc-if value="{{vacia}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay categorías.</b></div></sc-if></div></div>')
    banda = F.banda("Categorías", "{{resumen}}", f'<a class="cb cb-pri" href="#">{F.MAS} Nueva categoría</a>')
    campo = lambda r, v, cl="": f'<div class="w-cmp"><span class="rt">{r} <span class="req">*</span></span><div class="ct {cl}">{v}</div></div>'  # noqa: E731
    motivo = ('<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Motivo <span class="req">*</span></span><div class="ct area {{mClase}}">{{motivo}}</div>'
              '<sc-if value="{{mErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{mErr}}</span></sc-if></div>')
    pie = lambda b, cl="cb-pri": f'<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb {cl}">{b}</button>'  # noqa: E731
    dialogos = (
        '<sc-if value="{{dNueva}}" hint-placeholder-val="{{no}}">' + F.dialogo("Nueva categoría", campo("En español", "Recursos humanos") + campo("En inglés", "Human resources") + motivo, pie("Crear categoría"), una=False) + "</sc-if>"
        '<sc-if value="{{dEditar}}" hint-placeholder-val="{{no}}">' + F.dialogo("Editar «Logística»", campo("En español", "Logística y flota") + campo("En inglés", "Logistics and fleet") + motivo, pie("Guardar cambios"), una=False) + "</sc-if>"
        '<sc-if value="{{dSubir}}" hint-placeholder-val="{{no}}">' + F.dialogo("Subir «Logística»", '<p class="d-tx">Pasa al lugar 1, antes de «Ventas».</p>' + motivo, pie("Subir")) + "</sc-if>"
        '<sc-if value="{{dBorrar}}" hint-placeholder-val="{{no}}">' + F.dialogo("¿Borrar «Calidad»?", '<p class="d-tx">Ninguna plantilla la usa.</p>' + motivo, pie("Borrar", "cb-pel lleno")) + "</sc-if>")
    if variante == "B":
        dialogos += ('<sc-if value="{{c2}}" hint-placeholder-val="{{no}}">' + F.dialogo("No se puede borrar «Logística»",
                     f'<div class="p-aviso" role="status">{F.ALERTA}<span>La usa 1 plantilla, «Control de vehículo». Cambiale la categoría primero.</span></div>',
                     '<a class="cb cb-sec" href="Plat-FRM-Biblioteca.dc.html">Ver la biblioteca</a><button type="button" class="cb cb-pri">Entendido</button>') + "</sc-if>")
    js = ("    const k = " + json.dumps(ESTADOS_CAT, ensure_ascii=False) + ".indexOf(e);\n"
          "    const conMotivo = ['Nueva categoría', 'Editar', 'Subir', 'Borrar', 'Sin motivo'].includes(e);\n"
          "    return {\n      si: true, no: false,\n"
          "      c1: k === 1, c2: k === 2, conFilas: e !== 'Vacía', vacia: e === 'Vacía', resumen: e === 'Vacía' ? 'Sin categorías' : '4 categorías',\n"
          "      dNueva: e === 'Nueva categoría' || e === 'Sin motivo', dEditar: e === 'Editar', dSubir: e === 'Subir', dBorrar: e === 'Borrar',\n"
          "      motivo: e === 'Sin motivo' ? 'Contá por qué' : e === 'Subir' ? 'Es la que más se usa.' : e === 'Borrar' ? 'No se usó nunca.' : e === 'Editar' ? 'Suma las plantillas de la flota.' : 'Plantillas para personal.',\n"
          "      mClase: e === 'Sin motivo' ? 'ph mal' : '', mErr: e === 'Sin motivo' ? 'Escribí el motivo.' : '',\n"
          "    };")
    t = pagina_plat("Categorías de formularios · /plataforma/formularios/categorias", "Plataforma / Administración / Formularios / Categorías", banda, cuerpo,
                    activo="categorias", css=CSS_BIB + F.CSS_ESTADOS + F.CSS_PUBLICAR + CSS_CAT, estados=("estado", ESTADOS_CAT), js=js)
    return F.con_dialogo(t, dialogos, ".w-dlg { width: 560px; }\n")


# ---------------------------------------------------------------- Organización (A, 17/10): «Nuevo formulario ▾» con «Desde cero» y «Desde una plantilla»
ESTADOS_BIB_ORG = ["Con plantillas", "Sin resultados", "Sin plantillas", "Cargando", "Error"]
DESC_VIS = "Lo que pasó en la visita a un cliente: si se concretó la venta, el monto y el motivo."
CSS_BIB_ORG = """.bt-grupo { display: flex; flex-direction: column; gap: 10px; }
.bt-grupo h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--t1); }
.bt-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.bt-card { display: flex; flex-direction: column; gap: 6px; padding: 16px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; color: inherit; text-decoration: none; }
.bt-card:hover { border-color: var(--borde2); box-shadow: 0 6px 16px oklch(0.24 0.014 78 / 0.08); }
.bt-card b { font-size: 15px; font-weight: 600; color: var(--t1); }
.bt-card .d { font-size: 13.5px; line-height: 1.45; color: var(--t2); }
.bt-card .p { margin-top: 4px; font-size: 12.5px; color: var(--t3); }
.o-fb .w-bus { width: 360px; flex: none; }
.bt-esq { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.bt-esq span { height: 112px; border-radius: 12px; background: oklch(0.95 0.008 78); }
"""


def boton_nuevo(abierto=False):
    b = f'<a class="cb cb-pri" href="#" aria-haspopup="menu" aria-expanded="{"true" if abierto else "false"}">{F.MAS} Nuevo formulario {F.CHEV}</a>'
    if not abierto:
        return b
    return (b + f'<div class="f-menu" role="menu" aria-label="Nuevo formulario"><a class="f-mi" role="menuitem" href="FRM-Nuevo.dc.html">{F.ICONO} Desde cero</a>'
            f'<a class="f-mi" role="menuitem" href="FRM-Biblioteca.dc.html">{F.LISTA} Desde una plantilla</a></div>')


def biblioteca_org():
    tarjeta = (f'<a class="bt-card" href="FRM-Plantilla.dc.html"><b>Visita a cliente</b><span class="d">{DESC_VIS}</span>'
               '<span class="p">6 preguntas · 1 catálogo</span></a>')
    cuerpo = ('<div class="w-body"><sc-if value="{{conBusqueda}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
              f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span></div></sc-if>'
              '<sc-if value="{{conTarjetas}}" hint-placeholder-val="{{si}}"><div class="bt-grupo"><h2>Ventas</h2><div class="bt-grid">' + tarjeta + "</div></div></sc-if>"
              '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="bt-esq"><span></span><span></span><span></span></div></sc-if>'
              '<sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="f-cuerpo"><b>Ninguna plantilla coincide con la búsqueda.</b>'
              '<button type="button" class="cb cb-enl">Limpiar la búsqueda</button></div></div></sc-if>'
              '<sc-if value="{{vacia}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="f-cuerpo"><b>Todavía no hay plantillas.</b></div></div></sc-if>'
              '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="f-cuerpo"><b>No pudimos cargar las plantillas.</b>'
              '<button type="button" class="cb cb-sec">Reintentar</button></div></div></sc-if></div>')
    banda = F.banda("Biblioteca de formularios", "{{resumen}}", "")
    js = """    return {
      si: true, no: false,
      resumen: e === 'Sin plantillas' ? 'Sin plantillas' : e === 'Cargando' || e === 'Error' ? '' : '1 plantilla',
      conBusqueda: e !== 'Sin plantillas', busqueda: e === 'Sin resultados' ? 'inspección' : 'Buscar por nombre', busClase: e === 'Sin resultados' ? 'lleno' : '',
      conTarjetas: e === 'Con plantillas', cargando: e === 'Cargando', sinResultados: e === 'Sin resultados', vacia: e === 'Sin plantillas', error: e === 'Error',
    };"""
    return F.pagina("Biblioteca de formularios · /org/formularios/biblioteca", "Inicio / Formularios / Biblioteca", banda, cuerpo,
                    css_extra=F.CSS_LISTADO + CSS_BIB_ORG, estados=("estado", ESTADOS_BIB_ORG), js=js)


ESTADOS_PLANT_ORG = ["Con permiso", "Sin permiso de catálogos"]


def plantilla_org():
    items = "".join(f'<div class="q-it"><span class="num">{k + 1}</span><span class="dato"><b>{n}</b><span>{d}</span></span></div>' for k, (n, d) in enumerate(F.PREGUNTAS))
    izq = ('<div class="f-pila"><div class="w-caja"><div class="f-cab"><span>Descripción</span></div><div class="f-campo" style="font-size: 14px; line-height: 1.5; color: var(--t2);">'
           + DESC_VIS + '</div></div>'
           f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span></div>{items}</div>'
           '<div class="w-caja"><div class="f-cab"><span>Catálogos que trae</span></div>'
           '<div class="q-it"><span class="dato"><b>Motivos de visita</b><span>3 opciones · Seguimiento, Venta nueva y Reclamo</span></span></div></div></div>')
    acciones = ('<sc-if value="{{conPermiso}}" hint-placeholder-val="{{si}}"><a class="cb cb-pri" href="FRM-Plantilla-Usar.dc.html">Usar esta plantilla</a></sc-if>'
                '<sc-if value="{{sinPermiso}}" hint-placeholder-val="{{no}}"><span class="f-apag"><button type="button" class="cb cb-pri" disabled>Usar esta plantilla</button>'
                + F.info("Trae catálogos: para usarla necesitás el permiso «Administrar catálogos».") + "</span></sc-if>")
    banda = F.banda("Visita a cliente", "Ventas · 6 preguntas · 1 catálogo", acciones)
    cuerpo = '<div class="w-body"><div class="f-cols">' + izq + F.vista_previa() + "</div></div>"
    js = """    return { si: true, no: false, conPermiso: e === 'Con permiso', sinPermiso: e === 'Sin permiso de catálogos' };"""
    return F.pagina("Plantilla de formulario · /org/formularios/biblioteca/:id", "Inicio / Formularios / Biblioteca / Visita a cliente", banda, cuerpo,
                    css_extra=F.CSS_FICHA + F.CSS_LISTADO + ".f-apag { display: inline-flex; align-items: center; gap: 6px; }\n.ac .cb[disabled] { opacity: 0.55; cursor: default; }\n",
                    estados=("estado", ESTADOS_PLANT_ORG), js=js)


ESTADOS_USAR = ["Prefijo tomado", "Prefijo libre", "Sin nombre", "Creando", "Se retiró"]


def plantilla_usar():
    t = plantilla_org()
    cuerpo = ('<sc-if value="{{dRetiro}}" hint-placeholder-val="{{no}}">'
              f'<div class="p-aviso mal" role="alert">{F.ALERTA}<span>Esta plantilla ya no está en la biblioteca.</span></div></sc-if>'
              '<sc-if value="{{dCampos}}" hint-placeholder-val="{{si}}">'
              '<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct {{nClase}}">{{nombre}}</div>'
              '<sc-if value="{{nErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{nErr}}</span></sc-if></div>'
              '<div class="w-cmp"><span class="rt">Prefijo</span><div class="ct ro">{{prefijo}}</div>'
              '<span class="d-ayuda">{{prefAyuda}}' + F.info("{{prefInfo}}") + "</span></div></sc-if>")
    pie = ('<button type="button" class="cb cb-sec" disabled="{{creando}}">Cancelar</button>'
           '<sc-if value="{{dCampos}}" hint-placeholder-val="{{si}}"><button type="button" class="cb cb-pri" disabled="{{creando}}">{{boton}}</button></sc-if>'
           '<sc-if value="{{dRetiro}}" hint-placeholder-val="{{no}}"><a class="cb cb-pri" href="FRM-Biblioteca.dc.html">Volver a la biblioteca</a></sc-if>')
    t = F.con_dialogo(t, F.dialogo("Usar «Visita a cliente»", cuerpo, pie), F.CSS_DATOS + F.CSS_PUBLICAR + ".w-dlg { width: 520px; }\n")
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_PLANT_ORG, ensure_ascii=False, separators=(",", ":")) + ',"default":"Con permiso"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_USAR, ensure_ascii=False, separators=(",", ":")) + ',"default":"Prefijo tomado"')
    t = t.replace("""    return { si: true, no: false, conPermiso: e === 'Con permiso', sinPermiso: e === 'Sin permiso de catálogos' };""",
                  """    // POST /api/organization/forms/templates/{id}/use: el prefijo lo propone la organización con la regla de la E12 (B4).
    const libre = e === 'Prefijo libre';
    return {
      si: true, no: false, conPermiso: true, sinPermiso: false,
      dRetiro: e === 'Se retiró', dCampos: e !== 'Se retiró',
      nombre: e === 'Sin nombre' ? 'Escribí un nombre' : 'Visita a cliente', nClase: e === 'Sin nombre' ? 'ph mal' : '', nErr: e === 'Sin nombre' ? 'Escribí un nombre.' : '',
      prefijo: libre ? 'VIS' : 'VIS2', prefAyuda: 'Las respuestas: ' + (libre ? 'VIS' : 'VIS2') + '-000001',
      prefInfo: libre ? 'Se puede cambiar hasta la primera publicación.' : 'VIS ya lo usa otro formulario. Se puede cambiar hasta la primera publicación.',
      creando: e === 'Creando', boton: e === 'Creando' ? 'Creando…' : 'Crear el formulario',
    };""")
    return re.sub(r"<title>[^<]*</title>", "<title>Usar una plantilla de formulario</title>", t)


CSS_MENU_NUEVO = """.w-bnd .ac { position: relative; }
.w-bnd .ac .f-menu { position: absolute; top: calc(100% + 6px); right: 0; left: auto; z-index: 20; min-width: 220px; padding: 6px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); display: flex; flex-direction: column; }
.w-bnd .ac .f-mi { display: flex; align-items: center; gap: 10px; min-height: 38px; padding: 0 10px; border-radius: 6px; font-size: 14px; color: var(--t1); text-decoration: none; }
.w-bnd .ac .f-mi:hover { background: var(--s2); }
.w-bnd .ac .f-mi svg { color: var(--t3); }
"""


def listado_con_menu():
    """FRM-Listado (E12): «Nuevo formulario» pasa a abrir «Desde cero» y «Desde una plantilla» (A, 17/10). Se puede volver a correr."""
    ruta = PROJ / "FRM-Listado.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "Desde una plantilla" in t:
        return
    boton = re.search(r'<a class="cb cb-pri" href="FRM-Nuevo\.dc\.html">.*?</a>', t, re.S).group(0)
    t = t.replace(boton, '<a class="cb cb-pri" href="#" aria-haspopup="menu" aria-expanded="{{expNuevo}}">' + boton.split('">', 1)[1].replace("Nuevo formulario</a>", f"Nuevo formulario {F.CHEV}</a>")
                  + '<sc-if value="{{menuNuevo}}" hint-placeholder-val="{{no}}">' + boton_nuevo(True).split("</a>", 1)[1] + "</sc-if>", 1)
    t = t.replace('"estado":{"editor":"enum","options":["Todos","Filtro abierto",', '"estado":{"editor":"enum","options":["Todos","Nuevo formulario: menú","Filtro abierto",', 1)
    viejo = "const lista = ['Todos', 'Filtro abierto', 'Publicados', 'Borradores'].includes(f);"
    assert viejo in t
    t = t.replace(viejo, "const lista = ['Todos', 'Nuevo formulario: menú', 'Filtro abierto', 'Publicados', 'Borradores'].includes(f);", 1)
    i = t.index("const lista = ")
    j = t.index("    return {", i) + len("    return {")
    t = (t[:j] + "\n      // E17: «Nuevo formulario» abre «Desde cero» y «Desde una plantilla».\n"
         "      menuNuevo: f === 'Nuevo formulario: menú', expNuevo: f === 'Nuevo formulario: menú' ? 'true' : 'false'," + t[j:])
    t = t.replace("</helmet>", f'<style data-e17="nuevo">\n{CSS_MENU_NUEVO}</style>\n</helmet>', 1)
    ruta.write_text(t, encoding="utf-8")


# ---------------------------------------------------------------- Teléfonos (app): la biblioteca y una plantilla de la organización; la de Plataforma, solo para ver
import formularios_catalogos_1004 as KC  # noqa: E402

CSS_TBIB = """.bt-gm { margin: 18px 20px 6px; font-size: 13.5px; font-weight: 600; color: var(--t2); }
.ap-fila .l2.d { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ap-fijo .mot { display: block; margin-top: 6px; font-size: 13px; color: var(--t3); text-align: center; }
.ap-fijo.col { flex-direction: column; align-items: stretch; gap: 0; }
.ap-fijo .cb.full[disabled] { opacity: 0.55; }
.ap-fijo.col .cb.full { flex: none; height: 50px; display: flex; align-items: center; justify-content: center; }
.q-row.ro { padding-right: 14px; }
"""
ESTADOS_TBIB_ORG = ["Con plantillas", "Sin resultados", "Sin plantillas", "Cargando", "Error"]


def tel_biblioteca_org():
    fila = (f'<a class="ap-fila" href="M-FRM-Plantilla.dc.html"><div class="tx"><span class="l1">Visita a cliente</span><span class="l2 d">{DESC_VIS}</span>'
            '<span class="l3">6 preguntas · 1 catálogo</span></div></a>')
    cuerpo = ('<div class="ap-cuerpo"><sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}"><div class="bt-gm">Ventas</div>' + fila + "</sc-if>"
              '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div></sc-if>'
              '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">Todavía no hay plantillas.</div></sc-if>'
              '<sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">Ninguna plantilla coincide con «inspección».<button type="button" class="cb cb-sec">Limpiar la búsqueda</button></div></sc-if>'
              '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">No pudimos cargar las plantillas.<button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div>')
    js = """    return { si: true, no: false, conFilas: e === 'Con plantillas', cargando: e === 'Cargando', vacio: e === 'Sin plantillas', sinResultados: e === 'Sin resultados', error: e === 'Error' };"""
    t = F.pagina_tel("Biblioteca", "Formularios", cuerpo, volver="M-FRM-Listado.dc.html", estados=("estado", ESTADOS_TBIB_ORG), js=js, css=CSS_TBIB)
    return re.sub(r"<title>[^<]*</title>", "<title>Biblioteca de formularios · teléfono</title>", t)


ESTADOS_TPLANT_ORG = ["Con permiso", "Sin permiso de catálogos", "Usar: prefijo tomado", "Usar: se retiró"]


def tel_plantilla_org():
    preg = "".join(f'<div class="q-row ro"><span class="num">{k + 1}</span><span class="tx"><b>{n}</b><span>{d}</span></span></div>' for k, (n, d) in enumerate(F.PREGUNTAS))
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Biblioteca.dc.html">{F.TVOLVER}</a><div class="tit"><h1>Visita a cliente</h1>'
           f'<span class="sub">Ventas · 6 preguntas</span></div><button type="button" class="ap-ib" aria-label="Vista previa">{F.OJO}</button></div>')
    cuerpo = (bar + '<div class="ap-cuerpo"><div class="ap-gtit">Descripción</div><div class="ap-grupo"><div class="ap-dato" style="font-size: 15px; line-height: 1.45;">'
              + DESC_VIS + '</div></div><div class="ap-gtit">Preguntas</div><div class="ap-grupo">' + preg + "</div>"
              '<div class="ap-gtit">Catálogos que trae</div><div class="ap-grupo"><div class="q-row ro"><span class="tx"><b>Motivos de visita</b>'
              '<span>3 opciones · Seguimiento, Venta nueva y Reclamo</span></span></div></div><div style="height: 16px; flex-shrink: 0;"></div></div>')
    fijo = ('<div class="ap-fijo col"><sc-if value="{{conPermiso}}" hint-placeholder-val="{{si}}"><a class="cb cb-pri full lleno" href="#">Usar esta plantilla</a></sc-if>'
            '<sc-if value="{{sinPermiso}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-pri full lleno" disabled>Usar esta plantilla</button>'
            '<span class="mot">Trae catálogos: necesitás el permiso «Administrar catálogos».</span></sc-if></div>')
    usar = ('<sc-if value="{{hojaUsar}}" hint-placeholder-val="{{no}}">'
            + F.thoja("Usar «Visita a cliente»", F.tcampo("Nombre", "Visita a cliente", req=True)
                      + '<div class="ap-cmp"><span class="rt"><span>Prefijo</span>'
                      f'<button type="button" class="ap-i neu" aria-label="Qué significa" title="VIS ya lo usa otro formulario. Se puede cambiar hasta la primera publicación.">{F.TINFO}</button></span>'
                      '<div class="ct ro">VIS2</div></div>',
                      '<button type="button" class="cb cb-pri lleno">Crear el formulario</button><button type="button" class="cb cb-sec">Cancelar</button>') + "</sc-if>"
            '<sc-if value="{{hojaRetiro}}" hint-placeholder-val="{{no}}">'
            + F.thoja("Usar «Visita a cliente»", '<div class="t-banda mal" style="border-radius: 12px;">' + F.ALERTA + '<span class="tx">Esta plantilla ya no está en la biblioteca.</span></div>',
                      '<a class="cb cb-pri lleno" href="M-FRM-Biblioteca.dc.html">Volver a la biblioteca</a>') + "</sc-if>")
    js = """    return { si: true, no: false, conPermiso: e !== 'Sin permiso de catálogos', sinPermiso: e === 'Sin permiso de catálogos',
      hojaUsar: e === 'Usar: prefijo tomado', hojaRetiro: e === 'Usar: se retiró' };"""
    t = KC.tel_base(cuerpo, fijo=fijo, hojas=usar, estados=("estado", ESTADOS_TPLANT_ORG), js=js, css=CSS_TBIB)
    return re.sub(r"<title>[^<]*</title>", "<title>Plantilla de formulario · teléfono</title>", t)


ESTADOS_TBIB_PLAT = ["Todas", "Filtros", "Sin resultados", "Vacía", "Cargando", "Error"]


def tel_biblioteca_plat():
    base = leer_plat("M-Legales")
    filas = ""
    for n, cat, clase, estado, sucio, uso in PLANTILLAS:
        extra = f' · <span style="color: oklch(0.55 0.13 70); font-weight: 600;">{sucio}</span>' if sucio else ""
        u = f"<span>{uso}</span>" if uso != "—" else ""
        filas += (f'<div class="ap-fila"><div class="tx"><span class="l1">{n}{u}</span><span class="l2">{cat}</span>'
                  f'<span class="l3"><span class="w-est {clase}">{estado}</span>{extra}</span></div></div>')
    cuerpo = ('<div class="ap-cuerpo"><sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + filas + "</sc-if>"
              '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div></sc-if>'
              '<sc-if value="{{vacia}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">Todavía no hay plantillas.</div></sc-if>'
              '<sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">Ninguna plantilla coincide con los filtros.<button type="button" class="cb cb-sec">Limpiar filtros</button></div></sc-if>'
              '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">No pudimos cargar las plantillas.<button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div>')
    i = base.index('<div class="ap-bar int">')
    j = base.index('<nav class="ap-nav"')
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-Mas-Plat.dc.html">{F.TVOLVER}</a><div class="tit"><h1>Biblioteca de formularios</h1>'
           f'<span class="sub">Administración</span></div><button type="button" class="ap-ib {{{{filClase}}}}" aria-label="Filtros">{F.TFILTROS}</button></div>')
    t = base[:i] + bar + cuerpo + base[j:]
    hoja = ('<sc-if value="{{hojaFiltros}}" hint-placeholder-val="{{no}}">'
            + KC.opciones_hoja("Filtrar por estado", [("t", "Todos los estados", 3), ("p", "Publicadas", 1), ("b", "Borradores", 1), ("r", "Retiradas", 1)], "est") + "</sc-if>")
    k = t.index('<span class="ap-raya"></span>') + len('<span class="ap-raya"></span>')
    t = t[:k] + hoja + t[k:]
    t = t.replace("</helmet>", f'<style data-e17="telefono">\n{F.CSS_TEL}{F.CSS_TFILTRO}</style>\n</helmet>', 1)
    props = {"estado": {"editor": "enum", "options": ESTADOS_TBIB_PLAT, "default": ESTADOS_TBIB_PLAT[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
    t = re.sub(r"data-props='[^']*'", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    t = re.sub(r"  renderVals\(\) \{.*?\n  \}", lambda m: """  renderVals() {
    const e = this.props.estado ?? 'Todas';
    // En el teléfono de Plataforma la biblioteca es solo para ver: sin «Nueva plantilla» ni ⋮.
    return {
      si: true, no: false, filClase: '', hojaFiltros: e === 'Filtros',
      estOn_t: 'on', estOn_p: '', estOn_b: '', estOn_r: '', estSel_t: true, estSel_p: false, estSel_b: false, estSel_r: false,
      conFilas: e === 'Todas' || e === 'Filtros', cargando: e === 'Cargando', vacia: e === 'Vacía', sinResultados: e === 'Sin resultados', error: e === 'Error',
    };
  }""", t, count=1, flags=re.S)
    return re.sub(r"<title>[^<]*</title>", "<title>Biblioteca de formularios · Plataforma · teléfono</title>", t)


def tel_listado_elegir():
    """M-FRM-Listado (E12): el «+» abre «Desde cero» y «Desde una plantilla» (A, 17/10). Se puede volver a correr."""
    ruta = PROJ / "M-FRM-Listado.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "Desde una plantilla" in t:
        return
    hoja = ('<sc-if value="{{elegir}}" hint-placeholder-val="{{no}}">'
            + F.thoja("Nuevo formulario", '<div class="ap-acciones2"><span role="menuitem">Desde cero</span><span role="menuitem">Desde una plantilla</span></div>', "")
            + "</sc-if>")
    hoja = hoja.replace('<div class="hp"></div>', "")
    k = t.index("</nav>", t.index('<nav class="ap-nav"')) + len("</nav>")
    t = t[:k] + hoja + t[k:]
    t = t.replace(',"Nuevo formulario"],"default":"Todos"', ',"Nuevo formulario","Nuevo formulario: elegir"],"default":"Todos"', 1)
    t = t.replace("(e === 'Nuevo formulario' || e === 'Filtros' ? 'Todos' : e)", "(e === 'Nuevo formulario' || e === 'Nuevo formulario: elegir' || e === 'Filtros' ? 'Todos' : e)", 1)
    t = t.replace("      limpiar: () => ir('Todos'), nuevo: e === 'Nuevo formulario',",
                  "      limpiar: () => ir('Todos'), nuevo: e === 'Nuevo formulario',\n      // E17: el «+» primero pregunta «Desde cero» o «Desde una plantilla»; «Desde cero» sigue con el nombre.\n      elegir: e === 'Nuevo formulario: elegir',", 1)
    assert "elegir: e ===" in t and '"Nuevo formulario: elegir"' in t
    if ".ap-acciones2 {" not in t:
        t = t.replace("</helmet>", '<style data-e17="elegir">\n.ap-acciones2 { display: flex; flex-direction: column; }\n'
                      '.ap-acciones2 span { padding: 14px 4px; font-size: 16px; border-top: 1px solid var(--borde); }\n'
                      '.ap-acciones2 span:first-child { border-top: 0; }\n</style>\n</helmet>', 1)
    ruta.write_text(t, encoding="utf-8")


# ---------------------------------------------------------------- canvas.json: la página «Plataforma · Formularios» y los de la organización
PAGINA_PLAT = {"id": "plat-formularios", "name": "Plataforma · Formularios"}
TITULOS = {"Plat-FRM-Biblioteca": "Plataforma · Biblioteca de formularios", "Plat-FRM-Plantilla-Nueva": "Plataforma · nueva plantilla",
           "Plat-FRM-Plantilla": "Plataforma · plantilla de formulario", "Plat-FRM-Publicar": "Plataforma · publicar una plantilla", "Plat-FRM-Retirar": "Plataforma · retirar una plantilla", "Plat-FRM-Categorias": "Plataforma · categorías de formularios",
           "FRM-Biblioteca": "Formularios · biblioteca", "FRM-Plantilla": "Formularios · una plantilla", "FRM-Plantilla-Usar": "Formularios · usar una plantilla",
           "M-FRM-Biblioteca": "Formularios · biblioteca · teléfono", "M-FRM-Plantilla": "Formularios · una plantilla · teléfono", "M-Plat-FRM-Biblioteca": "Plataforma · biblioteca de formularios · teléfono"}
LUGAR = {"Plat-FRM-Biblioteca": (0, 260, 1440, 900, "plat-formularios"), "Plat-FRM-Plantilla-Nueva": (1520, 260, 1440, 900, "plat-formularios"),
         "Plat-FRM-Plantilla": (3040, 260, 1440, 900, "plat-formularios"), "Plat-FRM-Publicar": (4560, 260, 1440, 900, "plat-formularios"), "Plat-FRM-Retirar": (6080, 260, 1440, 900, "plat-formularios"), "Plat-FRM-Categorias": (0, 1280, 1440, 900, "plat-formularios"),
         "FRM-Biblioteca": (0, 5360, 1440, 900, "formularios"), "FRM-Plantilla": (1520, 5360, 1440, 900, "formularios"), "FRM-Plantilla-Usar": (3040, 5360, 1440, 900, "formularios"),
         "M-FRM-Biblioteca": (0, 6380, 390, 844, "formularios"), "M-FRM-Plantilla": (470, 6380, 390, 844, "formularios"), "M-Plat-FRM-Biblioteca": (0, 2300, 390, 844, "plat-formularios")}


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
    tableros = {"Plat-FRM-Biblioteca": biblioteca(), "Plat-FRM-Plantilla-Nueva": plantilla_nueva(), "Plat-FRM-Plantilla": plantilla_ficha(), "Plat-FRM-Publicar": plantilla_publicar(), "Plat-FRM-Retirar": plantilla_retirar(), "Plat-FRM-Categorias": categorias(),
                "FRM-Biblioteca": biblioteca_org(), "FRM-Plantilla": plantilla_org(), "FRM-Plantilla-Usar": plantilla_usar(),
                "M-FRM-Biblioteca": tel_biblioteca_org(), "M-FRM-Plantilla": tel_plantilla_org(), "M-Plat-FRM-Biblioteca": tel_biblioteca_plat()}
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    registrar(tableros)
    listado_con_menu()
    tel_listado_elegir()
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
