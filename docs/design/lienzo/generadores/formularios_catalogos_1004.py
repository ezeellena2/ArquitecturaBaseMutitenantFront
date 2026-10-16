"""E13 · Catálogos de Formularios por WhatsApp (docs/plans/formularios/e13-texto-diseno.md del back).

Usa las piezas de `formularios_1004.py` (E12) y la regla única del 13/10: los catálogos son una sección del panel «Formularios»;
sus filtros, desplegables. Corre después de `formularios_1004.py` y de `formularios_ajustes_1004.py`.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
from estados_util import CHEV_CAMPO  # noqa: E402

PROJ = F.PROJ

# ---------------------------------------------------------------- FRM-Catalogos elegido (B, 13/10): un ítem del panel «Formularios»
CATALOGOS = [
    ("Clientes mayoristas", "A mano", "0", "—", "mal", "No se puede usar", "No tiene opciones activas."),
    ("Motivos de visita", "A mano", "3", "1 formulario", "", "Se puede usar", ""),
    ("Supervisores", "Con filtros", "Según quién lo recibe", "1 formulario", "", "Se puede usar", ""),
]
ESTADOS_CATALOGOS = ["Todos", "Filtro abierto", "A mano", "Con filtros", "Sin resultados", "Cargando", "Vacío", "Error"]
CSS_CAT = """.w-th.k, .w-tr.k { grid-template-columns: minmax(170px, 1.5fr) 110px 160px 120px 180px 40px; }
.w-tr.k .gris { color: var(--t3); }
.w-tr.k a { color: var(--t1); text-decoration: none; font-weight: 500; }
.w-tr.k .usan { color: var(--marca-tx); font-weight: 500; }
"""


def fila_cat(n, origen, opciones, usan, clase, estado, motivo):
    i = F.info(motivo) if motivo else ""
    op = f'<span class="gris">{opciones}</span>' if not opciones.isdigit() else opciones
    u = f'<span class="gris">{usan}</span>' if usan == "—" else f'<span class="usan">{usan}</span>'
    destino = "FRM-Catalogo-Filtros" if origen == "Con filtros" else "FRM-Catalogo"
    return (f'<div class="w-tr k"><span class="dos"><a href="{destino}.dc.html">{n}</a></span><span>{origen}</span><span>{op}</span><span>{u}</span>'
            f'<span><span class="w-est {clase}">{estado}</span>{i}</span>'
            f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{F.KEBAB}</button></span></div>')


def banda_cat(titulo, resumen, acciones):
    return F.banda(titulo, resumen, acciones).replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{F.LISTA}</span>', 1)


def catalogos():
    filas = "".join(f'<sc-if value="{{{{{"verMano" if c[1] == "A mano" else "verFiltros"}}}}}" hint-placeholder-val="{{{{si}}}}">' + fila_cat(*c) + "</sc-if>"
                    for c in CATALOGOS)
    cab = ('<div class="w-th k"><span>Catálogo</span><span>Origen</span><span>Opciones</span><span>Lo usan</span><span>Estado</span>'
           '<span class="sr">Acciones</span></div>')
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            + F.filtro("Origen", [("t", "Todos los orígenes", 3), ("m", "A mano", 2), ("f", "Con filtros", 1)], "ori")
            + '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></sc-if>'
            "</div></sc-if>")
    cuerpo = ('<div class="w-body">' + caja + '<div class="w-caja">' + cab
              + '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + filas
              + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
              '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span>'
              '<span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
              '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay catálogos.</b></div></sc-if>'
              '<sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ningún catálogo coincide con los filtros.</b>'
              '<button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></div></sc-if>'
              '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar los catálogos.</b>'
              '<button type="button" class="cb cb-sec">Reintentar</button></div></sc-if>'
              "</div></div>")
    banda = banda_cat("Catálogos", "{{resumen}}", f'<a class="cb cb-pri" href="FRM-Catalogo-Nuevo.dc.html">{F.MAS} Nuevo catálogo</a>')
    js = """    const f = this.state.f ?? e;
    const ir = (x) => this.setState({ f: x, m: false });
    const lista = ['Todos', 'Filtro abierto', 'A mano', 'Con filtros'].includes(f);
    const elegido = f === 'A mano' || f === 'Con filtros' ? f : '';
    const menu = this.state.m ?? f === 'Filtro abierto';
    return {
      si: true, no: false,
      resumen: f === 'Vacío' ? 'Sin catálogos' : f === 'Cargando' || f === 'Error' ? '' : '3 catálogos · 2 se pueden usar',
      conFiltros: f !== 'Vacío',
      oriTexto: elegido ? 'Origen: ' + elegido : 'Origen', oriClase: elegido ? 'con' : '', oriMenu: menu,
      oriAlternar: () => this.setState({ m: !menu }),
      oriOn_t: elegido ? '' : 'on', oriOn_m: f === 'A mano' ? 'on' : '', oriOn_f: f === 'Con filtros' ? 'on' : '',
      oriC_t: '3', oriC_m: '2', oriC_f: '1',
      oriElegir_t: () => ir('Todos'), oriElegir_m: () => ir('A mano'), oriElegir_f: () => ir('Con filtros'),
      hayFiltro: !!elegido,
      busqueda: f === 'Sin resultados' ? 'proveedores' : 'Buscar por nombre', busClase: f === 'Sin resultados' ? 'lleno' : '',
      conFilas: lista, verMano: f !== 'Con filtros', verFiltros: f !== 'A mano',
      rango: f === 'A mano' ? '1–2 de 2' : f === 'Con filtros' ? '1 de 1' : '1–3 de 3',
      cargando: f === 'Cargando', vacio: f === 'Vacío', sinResultados: f === 'Sin resultados', error: f === 'Error',
      limpiar: () => ir('Todos'),
    };"""
    return F.pagina("Catálogos · /org/formularios/catalogos", "Inicio / Formularios / Catálogos", banda, cuerpo,
                    css_extra=F.CSS_LISTADO + F.CSS_FILTRO + CSS_CAT, estados=("estado", ESTADOS_CATALOGOS), js=js, seccion="catalogos")


# ---------------------------------------------------------------- FRM-Catalogo-Nuevo: el nombre y de dónde salen las opciones (no cambia después)
LAPIZ = F.svg('<path d="M15.5 5.5 18.5 8.5 9 18H6v-3z"/>', 20)
GENTE = F.svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>', 20)
CSS_NUEVO_CAT = """.w-dlg.ancho { width: 560px; }
.k-org { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.k-org.uno { grid-template-columns: 1fr; }
.k-card { display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--t1); line-height: 1.35; }
.k-card .ic { width: 36px; height: 36px; border-radius: 9px; background: var(--s2); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.k-card.on { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); background: var(--marca-t); color: var(--marca-tx); }
.k-card.on .ic { background: #fff; color: var(--marca-tx); }
.k-card.mal { border-color: var(--peligro); }
.k-card.grande { flex-direction: row; align-items: center; padding: 18px; font-size: 15px; }
.k-rt { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--t2); }
.k-paso { font-size: 12.5px; color: var(--t3); }
"""


CSS_SEG = """.o-seg { display: grid; grid-template-columns: 1fr 1.6fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.o-seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); cursor: pointer; }
.o-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
"""


def origen_cards(mano="on", filtros="", uno=False, grande=False):
    g = " grande" if grande else ""
    return (f'<div class="k-org{" uno" if uno else ""}"><span class="k-card {mano}{g}" role="radio"><span class="ic">{LAPIZ}</span>Escribirlas a mano</span>'
            f'<span class="k-card {filtros}{g}" role="radio"><span class="ic">{GENTE}</span>Tomarlas de los miembros, con filtros</span></div>')


def nuevo_cat_opciones():
    base = catalogos()
    rotulo = '<span class="k-rt">De dónde salen las opciones <span class="req">*</span>' + F.info("No se puede cambiar después.") + "</span>"
    nombre = '<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">Motivos de visita</div></div>'
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Crear catálogo</button>'
    a = F.con_dialogo(base, F.dialogo("Nuevo catálogo", nombre + '<div class="w-cmp">' + rotulo + origen_cards() + "</div>", pie).replace('class="w-dlg"', 'class="w-dlg ancho"', 1), CSS_NUEVO_CAT)
    b = F.con_dialogo(base, F.dialogo("Nuevo catálogo", '<span class="k-paso">Paso 1 de 2</span><div class="w-cmp">' + rotulo + origen_cards("", "", uno=True, grande=True) + "</div>",
                                      '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri" disabled>Siguiente</button>').replace('class="w-dlg"', 'class="w-dlg ancho"', 1), CSS_NUEVO_CAT)
    seg = ('<div class="w-cmp">' + rotulo + '<div class="o-seg" role="radiogroup"><span class="on" role="radio">Escribirlas a mano</span>'
           '<span role="radio">Tomarlas de los miembros, con filtros</span></div></div>')
    s = F.con_dialogo(base, F.dialogo("Nuevo catálogo", nombre + seg, pie).replace('class="w-dlg"', 'class="w-dlg ancho"', 1), CSS_NUEVO_CAT + CSS_SEG)
    return {"FRM-CatNuevo-A": s, "FRM-CatNuevo-B": a, "FRM-CatNuevo-C": b}


# ---------------------------------------------------------------- FRM-Catalogo-Nuevo elegido (A, 13/10): el origen con el control segmentado del lienzo
ESTADOS_CAT_NUEVO = ["A mano", "Con filtros", "Vacío", "Sin nombre", "Nombre de más de 80", "Creando"]


def nuevo_cat():
    t = catalogos()
    rotulo = '<span class="k-rt">De dónde salen las opciones <span class="req">*</span>' + F.info("No se puede cambiar después.") + "</span>"
    cuerpo = ('<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct {{nClase}}">{{nombre}}</div>'
              '<sc-if value="{{nErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{nErr}}</span></sc-if></div>'
              '<div class="w-cmp">' + rotulo + '<div class="o-seg" role="radiogroup"><span class="{{segMano}}" role="radio">Escribirlas a mano</span>'
              '<span class="{{segFiltros}}" role="radio">Tomarlas de los miembros, con filtros</span></div></div>')
    pie = ('<button type="button" class="cb cb-sec" disabled="{{creando}}">Cancelar</button>'
           '<button type="button" class="cb cb-pri" disabled="{{creando}}">{{boton}}</button>')
    t = F.con_dialogo(t, F.dialogo("Nuevo catálogo", cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg ancho"', 1), CSS_NUEVO_CAT + CSS_SEG)
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_CATALOGOS, ensure_ascii=False, separators=(",", ":")) + ',"default":"Todos"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_CAT_NUEVO, ensure_ascii=False, separators=(",", ":")) + ',"default":"A mano"')
    t = t.replace("    const f = this.state.f ?? e;", """    const d = e;
    const LARGO = 'Motivos de visita a clientes mayoristas y minoristas de la zona norte del conurbano bonaerense';
    const f = this.state.f ?? 'Todos';""")
    t = t.replace("      limpiar: () => ir('Todos'),", """      limpiar: () => ir('Todos'),
      nombre: d === 'Vacío' || d === 'Sin nombre' ? 'Por ejemplo, Motivos de visita' : d === 'Nombre de más de 80' ? LARGO : d === 'Con filtros' ? 'Supervisores' : 'Motivos de visita',
      nClase: (d === 'Vacío' || d === 'Sin nombre' ? 'ph ' : '') + (d === 'Sin nombre' || d === 'Nombre de más de 80' ? 'mal' : ''),
      nErr: d === 'Sin nombre' ? 'Escribí un nombre.' : d === 'Nombre de más de 80' ? 'Usá hasta 80 caracteres.' : '',
      segMano: d === 'Con filtros' ? '' : 'on', segFiltros: d === 'Con filtros' ? 'on' : '',
      creando: d === 'Creando', boton: d === 'Creando' ? 'Creando…' : 'Crear catálogo',""")
    return t.replace("<title>Catálogos · /org/formularios/catalogos</title>", "<title>Nuevo catálogo</title>")


# ---------------------------------------------------------------- FRM-Catalogo: la ficha de un catálogo a mano
OPCIONES = [("Seguimiento", "Visita programada a un cliente actual", "SEG", True), ("Venta nueva", "Primera visita a un cliente", "VEN", True),
            ("Reclamo", "Hay un problema para resolver", "REC", True), ("Cobranza", "Cobrar un pago pendiente", "COB", False)]
CSS_FICHA_CAT = """.w-th.o, .w-tr.o { grid-template-columns: 44px minmax(140px, 1fr) minmax(0, 1.5fr) 110px 140px 40px; }
.w-tr.o { position: relative; }
.w-tr.o .num { width: 26px; height: 26px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.w-tr.o .cod { font-family: inherit; letter-spacing: 0.03em; color: var(--t2); }
.w-tr.o .gris { color: var(--t3); }
.w-tr.o.baja > span:nth-child(2), .w-tr.o.baja > span:nth-child(3) { color: var(--t3); }
.w-tr.o.abierta { background: var(--s2); }
.w-tr.o .f-menu { top: 44px; }
.f-bnd-est { display: inline-flex; align-items: center; gap: 10px; }
.o-tabs.ficha { margin-bottom: 0; }
.o-tabs > a { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; text-decoration: none; }
.o-tabs > a.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.k-caja-cab { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 12px 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.k-caja-cab .cb { height: 32px; font-size: 13px; }
.d-g2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 16px; }
"""


def fila_opcion(k, texto, detalle, codigo, activa, menu="", clave=""):
    est = '<span class="w-est">Activa</span>' if activa else '<span class="w-est off">Dada de baja</span>'
    abierta = f" {{{{{clave}}}}}" if clave else ""
    return (f'<div class="w-tr o{"" if activa else " baja"}{abierta}"><span><span class="num">{k}</span></span><span>{texto}</span><span>{detalle}</span>'
            f'<span class="cod">{codigo}</span><span>{est}</span>'
            f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {texto}">{F.KEBAB}</button></span>{menu}</div>')


def tabla_opciones(con_caja_filtros=True, menu_en=None):
    filas = "".join(fila_opcion(k + 1, *o) for k, o in enumerate(OPCIONES))
    caja = ""
    if con_caja_filtros:
        caja = (f'<div class="w-caja o-fb"><span class="w-bus">{F.BUSCAR} Buscar por texto o código</span>'
                + F.filtro("Estado", [("t", "Todas", 4), ("a", "Activas", 3), ("b", "Dadas de baja", 1)], "est").replace("{{estTexto}}", "Estado").replace("{{estClase}}", "")
                .replace('<sc-if value="{{estMenu}}" hint-placeholder-val="{{no}}">', '<sc-if value="{{no}}" hint-placeholder-val="{{no}}">') + "</div>")
    cab = ('<div class="w-th o"><span>#</span><span>Texto</span><span>Detalle</span><span>Código</span><span>Estado</span><span class="sr">Acciones</span></div>')
    return caja, ('<div class="w-caja">' + cab + filas + '<div class="w-pie"><span>1–4 de 4</span><span>10 por página · Página 1 de 1</span></div></div>')


def banda_ficha_cat(acciones):
    return (f'<div class="w-bnd"><div class="iz"><span class="ic">{F.LISTA}</span><div><h1>Motivos de visita</h1>'
            '<p class="res f-bnd-est"><span class="w-est">Se puede usar</span><span>A mano</span></p></div></div>'
            f'<div class="ac">{acciones}</div></div>')


def ficha_cat_opciones():
    agregar = f'<button type="button" class="cb cb-pri">{F.MAS} Agregar opción</button>'
    caja, tabla = tabla_opciones()
    tabs = ('<div class="o-tabs ficha" role="tablist"><a class="on" role="tab" aria-selected="true" href="FRM-Catalogo.dc.html">Opciones <span class="c">4</span></a>'
            '<a role="tab" aria-selected="false" href="FRM-Catalogo.dc.html">Datos</a></div>')
    a = F.pagina("FRM-CatFicha-A", "Inicio / Formularios / Catálogos / Motivos de visita", banda_ficha_cat(agregar),
                 '<div class="w-body">' + tabs + '<div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">' + caja + tabla + "</div></div>",
                 css_extra=F.CSS_LISTADO + F.CSS_FILTRO + CSS_FICHA_CAT, seccion="catalogos")
    datos = ('<div class="w-caja"><div class="k-caja-cab"><span>Datos</span></div><div class="d-g2">'
             '<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">Motivos de visita</div></div>'
             '<div class="w-cmp"><span class="rt">Descripción</span><div class="ct">Por qué se visita a un cliente.</div></div></div></div>')
    tabla_b = tabla.replace('<div class="w-caja"><div class="w-th o">',
                            f'<div class="w-caja"><div class="k-caja-cab"><span>Opciones</span><button type="button" class="cb cb-sec">{F.MAS} Agregar opción</button></div><div class="w-th o">', 1)
    b = F.pagina("FRM-CatFicha-B", "Inicio / Formularios / Catálogos / Motivos de visita", banda_ficha_cat(""),
                 '<div class="w-body"><div style="display: flex; flex-direction: column; gap: 16px;">' + datos + caja + tabla_b + "</div></div>",
                 css_extra=F.CSS_LISTADO + F.CSS_FILTRO + CSS_FICHA_CAT, seccion="catalogos")
    return {"FRM-CatFicha-A": a, "FRM-CatFicha-B": b}


# ---------------------------------------------------------------- FRM-Catalogo elegida (A, 13/10): pestañas «Opciones | Datos»; la acción de la banda cambia con la pestaña
ESTADOS_FICHA_CAT = ["Opciones", "Filtro abierto", "Acciones de una opción", "Acciones de una dada de baja", "Sin opciones", "500 alcanzadas", "Conflicto",
                     "Datos", "Datos · cambios sin guardar"]
BAJA = F.svg('<circle cx="12" cy="12" r="8"/><path d="m6.5 6.5 11 11"/>', 16)
REACTIVAR = F.svg('<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 16)
CSS_FICHA_CAT2 = """.w-caja.k-tab { overflow: visible; }
.w-caja.k-tab .w-th { border-radius: 12px 12px 0 0; }
.w-caja.k-tab .w-tr.o { z-index: 1; }
.w-caja.k-tab .w-tr.o.abierta { z-index: 8; }
.k-tabla-vacia { padding: 36px 16px; text-align: center; font-size: 14px; font-weight: 600; color: var(--t1); }
.k-g { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 16px; }
.k-g .w-cmp .ct { display: block; line-height: 34px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.k-g .w-cmp .ct.area { height: 64px; white-space: normal; line-height: 1.45; padding-top: 8px; }
.k-pila { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; max-width: 980px; }
.k-pila.ancha { max-width: none; }
.ac .cb[disabled] { opacity: 0.55; cursor: default; }
.ac .k-off { display: inline-flex; align-items: center; gap: 4px; }
.g-det { display: grid; grid-template-columns: 220px minmax(0, 1fr); }
.g-det > span { padding: 10px 16px; border-top: 1px solid var(--borde); font-size: 13.5px; }
.g-det > span:nth-child(-n+2) { border-top: 0; }
.g-det > .k { background: oklch(0.975 0.008 78); color: var(--t2); font-weight: 500; border-right: 1px solid var(--borde); }
.g-det a { color: var(--marca-tx); font-weight: 500; text-decoration: none; }
"""


def ficha_cat():
    def menu(n, items, clave):
        return (f'<sc-if value="{{{{{clave}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="f-menu" role="menu" aria-label="Acciones de {n}">{items}</div></sc-if>')
    m_activa = menu("Venta nueva", f'<span class="f-mi" role="menuitem">{F.LAPIZ} Editar</span><span class="f-mi" role="menuitem">{F.ARRIBA} Subir</span>'
                    f'<span class="f-mi" role="menuitem">{F.ABAJO} Bajar</span><span class="f-sep" role="separator"></span>'
                    f'<span class="f-mi pel" role="menuitem">{BAJA} Dar de baja</span>', "menuActiva")
    m_baja = menu("Cobranza", f'<span class="f-mi" role="menuitem">{F.LAPIZ} Editar</span><span class="f-mi" role="menuitem">{F.ARRIBA} Subir</span>'
                  f'<span class="f-sep" role="separator"></span><span class="f-mi" role="menuitem">{REACTIVAR} Reactivar</span>', "menuBaja")
    filas = ""
    for k, o in enumerate(OPCIONES):
        if k == 1:
            filas += fila_opcion(k + 1, *o, menu=m_activa, clave="abiertaActiva")
        elif k == 3:
            filas += fila_opcion(k + 1, *o, menu=m_baja, clave="abiertaBaja")
        else:
            filas += fila_opcion(k + 1, *o)
    caja = ('<div class="w-caja o-fb"><span class="w-bus">' + F.BUSCAR + ' Buscar por texto o código</span>'
            + F.filtro("Estado", [("t", "Todas", 4), ("a", "Activas", 3), ("b", "Dadas de baja", 1)], "est") + "</div>")
    cab = '<div class="w-th o"><span>#</span><span>Texto</span><span>Detalle</span><span>Código</span><span>Estado</span><span class="sr">Acciones</span></div>'
    cartel = ('<sc-if value="{{conflicto}}" hint-placeholder-val="{{no}}"><div class="w-cartel" role="alert" style="margin-top: 0;">' + F.ALERTA
              + '<span class="tx">Otra persona cambió esta lista mientras la mirabas.</span><button type="button" class="cb cb-sec">Ver lo nuevo</button></div></sc-if>')
    opciones = ('<sc-if value="{{enOpciones}}" hint-placeholder-val="{{si}}"><div class="k-pila ancha">' + cartel
                + '<sc-if value="{{conOpciones}}" hint-placeholder-val="{{si}}">' + caja + "</sc-if>"
                + '<div class="w-caja k-tab">' + cab
                + '<sc-if value="{{conOpciones}}" hint-placeholder-val="{{si}}">' + filas
                + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · {{paginas}}</span></div></sc-if>'
                '<sc-if value="{{sinOpciones}}" hint-placeholder-val="{{no}}"><div class="k-tabla-vacia">Todavía no hay opciones.</div></sc-if></div></div></sc-if>')
    datos = ('<sc-if value="{{enDatos}}" hint-placeholder-val="{{no}}"><div class="k-pila">'
             '<div class="w-caja"><div class="k-caja-cab"><span>Datos</span></div><div class="k-g">'
             '<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">{{nombreEs}}</div></div>'
             '<div class="w-cmp"><span class="rt">Nombre en inglés</span><div class="ct {{enClase}}">{{nombreEn}}</div></div>'
             '<div class="w-cmp"><span class="rt">Descripción</span><div class="ct area">Por qué se visita a un cliente.</div></div>'
             '<div class="w-cmp"><span class="rt">Descripción en inglés</span><div class="ct area ph">Opcional</div></div></div></div>'
             '<div class="w-caja"><div class="k-caja-cab"><span>Lo usan</span></div><div class="g-det">'
             '<span class="k">Visita a cliente</span><span><a href="FRM-Ficha.dc.html">Pregunta 5 · Motivo</a></span></div></div></div></sc-if>')
    tabs = ('<div class="o-tabs ficha" role="tablist">'
            '<a class="{{tabOp}}" role="tab" aria-selected="{{selOp}}" onClick="{{verOpciones}}">Opciones <span class="c">{{cant}}</span></a>'
            '<a class="{{tabDa}}" role="tab" aria-selected="{{selDa}}" onClick="{{verDatos}}">Datos</a></div>')
    agregar = (f'<sc-if value="{{{{agregarOn}}}}" hint-placeholder-val="{{{{si}}}}"><a class="cb cb-pri" href="FRM-Catalogo-Opcion.dc.html">{F.MAS} Agregar opción</a></sc-if>'
               f'<sc-if value="{{{{agregarOff}}}}" hint-placeholder-val="{{{{no}}}}"><span class="k-off"><button type="button" class="cb cb-pri" disabled>{F.MAS} Agregar opción</button>'
               + F.info("Un catálogo tiene hasta 500 opciones, contando las dadas de baja.") + "</span></sc-if>")
    guardar = ('<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-sec">Descartar cambios</button></sc-if>'
               '<button type="button" class="cb cb-pri" disabled="{{limpio}}">Guardar cambios</button>')
    acciones = (f'<sc-if value="{{{{enOpciones}}}}" hint-placeholder-val="{{{{si}}}}">{agregar}</sc-if>'
                f'<sc-if value="{{{{enDatos}}}}" hint-placeholder-val="{{{{no}}}}">{guardar}</sc-if>')
    banda = (f'<div class="w-bnd"><div class="iz"><span class="ic">{F.LISTA}</span><div><h1>{{{{nombreEs}}}}</h1>'
             '<p class="res f-bnd-est"><span class="w-est {{estClase2}}">{{estado}}</span>'
             '<sc-if value="{{noUsable}}" hint-placeholder-val="{{no}}">' + F.info("No tiene opciones activas.") + '</sc-if><span>A mano</span>'
             '<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><span class="f-sucio">Cambios sin guardar</span></sc-if></p></div></div>'
             f'<div class="ac">{acciones}</div></div>')
    js = """    const tab = this.state.t ?? (e.startsWith('Datos') ? 'datos' : 'opciones');
    const vacio = e === 'Sin opciones';
    const tope = e === '500 alcanzadas';
    const sucio = e === 'Datos · cambios sin guardar';
    return {
      si: true, no: false,
      enOpciones: tab === 'opciones', enDatos: tab === 'datos',
      tabOp: tab === 'opciones' ? 'on' : '', tabDa: tab === 'datos' ? 'on' : '', selOp: tab === 'opciones' ? 'true' : 'false', selDa: tab === 'datos' ? 'true' : 'false',
      verOpciones: () => this.setState({ t: 'opciones' }), verDatos: () => this.setState({ t: 'datos' }),
      nombreEs: vacio ? 'Clientes mayoristas' : 'Motivos de visita',
      nombreEn: sucio ? 'Visit reasons' : 'Opcional', enClase: sucio ? '' : 'ph',
      estado: vacio ? 'No se puede usar' : 'Se puede usar', estClase2: vacio ? 'mal' : '', noUsable: vacio,
      cant: vacio ? '0' : tope ? '500' : '4',
      conOpciones: !vacio, sinOpciones: vacio,
      rango: tope ? '1–10 de 500' : '1–4 de 4', paginas: tope ? 'Página 1 de 50' : 'Página 1 de 1',
      agregarOn: !tope, agregarOff: tope,
      conflicto: e === 'Conflicto',
      sucio, limpio: !sucio,
      estTexto: 'Estado', estClase: '', estMenu: this.state.m ?? e === 'Filtro abierto', estAlternar: () => this.setState({ m: !(this.state.m ?? e === 'Filtro abierto') }),
      estOn_t: 'on', estOn_a: '', estOn_b: '', estC_t: '4', estC_a: '3', estC_b: '1',
      estElegir_t: () => this.setState({ m: false }), estElegir_a: () => this.setState({ m: false }), estElegir_b: () => this.setState({ m: false }),
      menuActiva: e === 'Acciones de una opción', abiertaActiva: e === 'Acciones de una opción' ? 'abierta' : '',
      menuBaja: e === 'Acciones de una dada de baja', abiertaBaja: e === 'Acciones de una dada de baja' ? 'abierta' : '',
    };"""
    return F.pagina("Catálogo · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / {{nombreEs}}", banda,
                    '<div class="w-body">' + tabs + opciones + datos + "</div>",
                    css_extra=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + CSS_FICHA_CAT + CSS_FICHA_CAT2,
                    estados=("estado", ESTADOS_FICHA_CAT), js=js, seccion="catalogos")


# ---------------------------------------------------------------- FRM-Catalogo-Opcion: el texto es/en (hasta 30, con contador), el detalle es/en y el código
CSS_OPCION = """.k-cnt { align-self: flex-end; font-size: 12px; color: var(--t3); }
.k-pie { display: flex; align-items: baseline; gap: 8px; }
.k-pie .k-cnt { margin-left: auto; }
.k-cnt.mal { color: var(--peligro); font-weight: 600; }
.w-dlg .w-cmp .ct.area { height: 64px; white-space: normal; line-height: 1.45; padding-top: 8px; }
.w-dlg .w-cmp.cod .ct { max-width: 200px; }
"""


def campo_dlg(rotulo, valor, req=False, clase="", cnt="", err="", area=False, extra=""):
    r = ' <span class="req">*</span>' if req else ""
    c = f'<span class="k-cnt {cnt[1]}">{cnt[0]}</span>' if cnt else ""
    e = f'<span class="err2" role="alert">{err}</span>' if err else ""
    return f'<div class="w-cmp {extra}"><span class="rt">{rotulo}{r}</span><div class="ct {clase}{" area" if area else ""}">{valor}</div>{e}{c}</div>'


ESTADOS_OPCION = ["Editar", "Nueva", "Sin completar", "Código repetido", "Texto de más de 30", "Guardando"]


def opcion():
    """FRM-Catalogo-Opcion elegida (A, 13/10): cada texto con su inglés a la derecha, como la pestaña Datos."""
    t = ficha_cat()
    cuerpo = ('<div class="w-cmp"><span class="rt">Texto <span class="req">*</span></span><div class="ct {{tClase}}">{{texto}}</div>'
              '<span class="k-pie"><sc-if value="{{tErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{tErr}}</span></sc-if><span class="k-cnt {{tCntClase}}">{{tCnt}}</span></span></div>'
              '<div class="w-cmp"><span class="rt">Texto en inglés</span><div class="ct {{enClase2}}">{{textoEn}}</div><span class="k-cnt">{{enCnt}}</span></div>'
              '<div class="w-cmp"><span class="rt">Detalle</span><div class="ct area {{dClase}}">{{detalle}}</div></div>'
              '<div class="w-cmp"><span class="rt">Detalle en inglés</span><div class="ct area ph">Opcional</div></div>'
              '<div class="w-cmp cod"><span class="rt">Código <span class="req">*</span></span><div class="ct {{cClase}}">{{codigo}}</div>'
              '<sc-if value="{{cErr}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{cErr}}</span></sc-if></div>')
    pie = ('<button type="button" class="cb cb-sec" disabled="{{guardando}}">Cancelar</button>'
           '<button type="button" class="cb cb-pri" disabled="{{guardando}}">{{boton}}</button>')
    t = F.con_dialogo(t, F.dialogo("{{tituloDlg}}", cuerpo, pie, una=False), CSS_OPCION)
    t = t.replace('"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_FICHA_CAT, ensure_ascii=False, separators=(",", ":")) + ',"default":"Opciones"',
                  '"estado":{"editor":"enum","options":' + json.dumps(ESTADOS_OPCION, ensure_ascii=False, separators=(",", ":")) + ',"default":"Editar"')
    t = t.replace('    const e = this.props.estado ?? "Opciones";', """    const d = this.props.estado ?? 'Editar';
    const e = 'Opciones';
    const nueva = d !== 'Editar' && d !== 'Guardando';
    const vacia = d === 'Nueva' || d === 'Sin completar';""")
    t = t.replace("      menuBaja: e === 'Acciones de una dada de baja',", """      tituloDlg: nueva ? 'Agregar opción' : 'Editar opción', boton: d === 'Guardando' ? 'Guardando…' : nueva ? 'Agregar opción' : 'Guardar opción',
      guardando: d === 'Guardando',
      texto: vacia ? 'Por ejemplo, Seguimiento' : d === 'Texto de más de 30' ? 'Primera visita a un cliente nuevo' : d === 'Código repetido' ? 'Visita técnica' : 'Venta nueva',
      tClase: (vacia ? 'ph ' : '') + (d === 'Sin completar' || d === 'Texto de más de 30' ? 'mal' : ''),
      tErr: d === 'Sin completar' ? 'Escribí el texto.' : d === 'Texto de más de 30' ? 'Usá hasta 30 caracteres.' : '',
      tCnt: vacia ? '0 / 30' : d === 'Texto de más de 30' ? '33 / 30' : d === 'Código repetido' ? '14 / 30' : '11 / 30', tCntClase: d === 'Texto de más de 30' ? 'mal' : '',
      textoEn: nueva ? 'Opcional' : 'New sale', enClase2: nueva ? 'ph' : '', enCnt: nueva ? '0 / 30' : '8 / 30',
      detalle: vacia ? 'Opcional' : d === 'Código repetido' ? 'Revisión de una instalación' : 'Primera visita a un cliente', dClase: vacia ? 'ph' : '',
      codigo: vacia ? 'Por ejemplo, SEG' : d === 'Código repetido' ? 'VEN' : d === 'Texto de más de 30' ? 'VNU' : 'VEN',
      cClase: (vacia ? 'ph ' : '') + (d === 'Sin completar' || d === 'Código repetido' ? 'mal' : ''),
      cErr: d === 'Sin completar' ? 'Escribí un código.' : d === 'Código repetido' ? 'Ya hay una opción con ese código.' : '',
      menuBaja: e === 'Acciones de una dada de baja',""")
    return t.replace("<title>Catálogo · /org/formularios/catalogos/:id</title>", "<title>Catálogo · opción</title>")


# ---------------------------------------------------------------- FRM-Catalogo-Filtros: la ficha de un catálogo con filtros, con «Como si lo recibiera» al costado
TILDE = F.svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 13, "3")
CRUZ = F.svg('<path d="M7 7l10 10M17 7 7 17"/>', 16)
CSS_FILTROS = """.k-cols { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; align-items: start; margin-top: 16px; }
.k-cond { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.k-fila { display: grid; grid-template-columns: 22px 110px 176px minmax(120px, 1fr) 32px; gap: 8px; align-items: center; }
.k-fila .si { font-size: 13px; font-weight: 600; color: var(--t2); }
.k-fila .ct, .k-otras .ct { height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 0 10px; font-size: 13.5px; min-width: 0; }
.k-fila .ct .v { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.k-fila .ct.mal { border-color: var(--peligro); }
.k-fila .err2 { grid-column: 2 / -1; }
.k-chip { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 4px 0 8px; border-radius: 6px; background: var(--s3); font-size: 12.5px; font-weight: 500; }
.k-chip svg { width: 13px; height: 13px; color: var(--t3); }
.k-mas { align-self: flex-start; }
.k-frase { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: 44px; padding: 6px 8px 6px 12px; border: 1px solid var(--borde); border-radius: 10px; font-size: 13.5px; }
.k-frase .si { font-weight: 600; color: var(--t2); }
.k-frase .pz { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 8px; border-radius: 8px; border: 1px dashed var(--borde2); background: #fff; font-weight: 600; color: var(--marca-tx); }
.k-frase .ib { margin-left: auto; }
.k-otras { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px 16px; padding: 16px; align-items: end; }
.k-otras .f-chk { grid-column: 1 / -1; }
.k-prev .k-quien { display: flex; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--borde); }
.k-prev .k-quien .ct { flex: 1; height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; font-size: 13.5px; }
.k-prev .k-quien .cb { height: 36px; }
.k-res > div { display: flex; flex-direction: column; padding: 9px 16px; border-bottom: 1px solid var(--borde); line-height: 1.35; }
.k-res b { font-weight: 500; font-size: 13.5px; }
.k-res span { font-size: 12.5px; color: var(--t3); }
.k-res-pie { padding: 10px 16px; font-size: 12.5px; color: var(--t3); }
.k-res-vacia { padding: 24px 16px; text-align: center; font-size: 13.5px; font-weight: 600; }
.k-aviso { display: flex; gap: 8px; margin: 12px 16px 0; padding: 10px 12px; border-radius: 10px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); font-size: 13px; line-height: 1.4; }
.k-aviso svg { flex-shrink: 0; margin-top: 1px; }
"""
MIEMBROS = [("Florencia Fernández de la Fu…", "Florencia Fernández de la Fuente · Delta Norte"), ("Martín Paz", "Delta S.A."), ("Paula Méndez", "Delta S.A.")]


def condiciones(variante):
    if variante == "A":
        filas = (f'<div class="k-fila"><span class="si">Si</span><span class="ct">Rol {F.CHEV}</span><span class="ct">tiene alguno de {F.CHEV}</span>'
                 f'<span class="ct"><span class="v"><span class="k-chip">Supervisor{CRUZ}</span></span>{F.CHEV}</span>'
                 f'<button type="button" class="ib" aria-label="Quitar la condición">{CRUZ}</button></div>')
    else:
        filas = (f'<div class="k-frase"><span class="si">Si</span>el <span class="pz">rol {F.CHEV}</span><span class="pz">tiene alguno de {F.CHEV}</span>'
                 f'<span class="k-chip">Supervisor{CRUZ}</span><span class="pz">+ valor</span>'
                 f'<button type="button" class="ib" aria-label="Quitar la condición">{CRUZ}</button></div>')
    return ('<div class="w-caja"><div class="k-caja-cab"><span>Condiciones</span></div><div class="k-cond">' + filas
            + f'<button type="button" class="cb cb-sec k-mas">{F.MAS} Agregar condición</button></div></div>')


def otras():
    return ('<div class="w-caja"><div class="k-caja-cab"><span>Otras opciones</span></div><div class="k-otras">'
            f'<span class="f-chk"><i class="on">{TILDE}</i>Sin incluir a quien lo recibe</span>'
            f'<div class="w-cmp"><span class="rt">Detalle</span><span class="ct">Empresas {F.CHEV}</span></div>'
            f'<div class="w-cmp"><span class="rt">Orden</span><span class="ct">Nombre, de la A a la Z {F.CHEV}</span></div></div></div>')


def vista_previa_miembros():
    res = "".join(f"<div><b>{n}</b><span>{d}</span></div>" for n, d in MIEMBROS)
    return ('<div class="w-caja k-prev"><div class="k-caja-cab"><span>Como si lo recibiera</span></div>'
            f'<div class="k-quien"><span class="ct">Tomás Acosta {F.CHEV}</span><button type="button" class="cb cb-sec">Probar</button></div>'
            f'<div class="k-res">{res}</div><div class="k-res-pie">3 opciones</div></div>')


ESTADOS_FILTROS = ["Tres opciones", "Dos condiciones", "Elegir a quién", "Probando", "Ninguna opción", "Más de 200", "Rol que ya no existe", "Datos"]
CSS_FILTROS2 = """.k-fila .ct.on { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); }
.k-chip.mal { background: var(--peligro-t); color: oklch(0.5 0.19 25); }
.k-quien { position: relative; }
.k-quien .ct.on { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); }
.k-elegir { position: absolute; left: 16px; right: 16px; top: 54px; z-index: 9; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 4px; display: flex; flex-direction: column; font-size: 13.5px; }
.k-elegir .w-bus { margin: 4px 4px 6px; height: 32px; }
.k-elegir > span:not(.w-bus) { min-height: 34px; display: flex; align-items: center; padding: 0 10px; border-radius: 6px; }
.k-elegir > span.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 500; }
.k-esq { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.k-esq span { height: 12px; border-radius: 6px; background: oklch(0.93 0.01 78); }
.k-prev .w-caja, .k-prev { overflow: visible; }
"""


def filtros_cat():
    fila1 = (f'<div class="k-fila"><span class="si">Si</span><span class="ct">Rol {F.CHEV}</span><span class="ct">{{{{op1}}}} {F.CHEV}</span>'
             f'<span class="ct {{{{v1Clase}}}}"><span class="v"><span class="k-chip {{{{chip1Clase}}}}">{{{{v1}}}}{CRUZ}</span></span>{F.CHEV}</span>'
             f'<button type="button" class="ib" aria-label="Quitar la condición">{CRUZ}</button>'
             '<sc-if value="{{rolBorrado}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">Ese rol ya no existe. Elegí otro.</span></sc-if></div>')
    fila2 = (f'<sc-if value="{{{{conFila2}}}}" hint-placeholder-val="{{{{no}}}}"><div class="k-fila"><span class="si">y</span><span class="ct">{{{{col2}}}} {F.CHEV}</span>'
             f'<span class="ct">{{{{op2}}}} {F.CHEV}</span><span class="ct"><span class="v">{{{{v2}}}}</span>{F.CHEV}</span>'
             f'<button type="button" class="ib" aria-label="Quitar la condición">{CRUZ}</button></div></sc-if>')
    cond = ('<div class="w-caja"><div class="k-caja-cab"><span>Condiciones</span></div><div class="k-cond">' + fila1 + fila2
            + f'<button type="button" class="cb cb-sec k-mas">{F.MAS} Agregar condición</button></div></div>')
    res = "".join(f'<sc-if value="{{{{ver_{k}}}}}" hint-placeholder-val="{{{{si}}}}"><div><b>{n}</b><span>{d}</span></div></sc-if>' for k, (n, d) in enumerate(MIEMBROS))
    mas = "".join(f"<div><b>{n}</b><span>{d}</span></div>" for n, d in [("Agustina Ruiz", "Delta S.A."), ("Bruno Castro", "Delta Norte"), ("Camila Díaz", "Delta S.A."),
                                                                       ("Carolina Vega", "Delta S.A."), ("Diego Ríos", "Delta Norte")])
    elegir = ('<sc-if value="{{elegir}}" hint-placeholder-val="{{no}}"><div class="k-elegir" role="listbox" aria-label="Como si lo recibiera">'
              f'<span class="w-bus">{F.BUSCAR} Buscar por nombre</span><span>Carolina Vega</span><span>Diego Ríos</span><span>Julieta Sosa</span>'
              '<span>Marcos Giménez</span><span class="on">Tomás Acosta</span></div></sc-if>')
    previa = ('<div class="w-caja k-prev"><div class="k-caja-cab"><span>Como si lo recibiera</span></div>'
              f'<div class="k-quien"><span class="ct {{{{quienClase}}}}">Tomás Acosta {F.CHEV}</span><button type="button" class="cb cb-sec" disabled="{{{{probando}}}}">{{{{textoProbar}}}}</button>{elegir}</div>'
              '<sc-if value="{{masDe200}}" hint-placeholder-val="{{no}}"><div class="k-aviso" role="status">' + F.ALERTA + '<span>Más de 200: no se va a poder mandar.</span></div></sc-if>'
              '<sc-if value="{{conLista}}" hint-placeholder-val="{{si}}"><div class="k-res">' + res + "</div></sc-if>"
              '<sc-if value="{{masDe200}}" hint-placeholder-val="{{no}}"><div class="k-res">' + mas + "</div></sc-if>"
              '<sc-if value="{{probando}}" hint-placeholder-val="{{no}}"><div class="k-esq"><span style="width: 70%;"></span><span style="width: 55%;"></span><span style="width: 62%;"></span></div></sc-if>'
              '<sc-if value="{{ninguna}}" hint-placeholder-val="{{no}}"><div class="k-res-vacia">Ninguna opción para Tomás Acosta.</div></sc-if>'
              '<sc-if value="{{sinProbar}}" hint-placeholder-val="{{no}}"><div class="k-res-vacia">Corregí la condición para probar.</div></sc-if>'
              '<sc-if value="{{conPie}}" hint-placeholder-val="{{si}}"><div class="k-res-pie">{{pie}}</div></sc-if></div>')
    filtros = ('<sc-if value="{{enFiltros}}" hint-placeholder-val="{{si}}"><div class="k-cols"><div class="k-pila" style="margin-top: 0; max-width: none;">' + cond + otras()
               + "</div>" + previa + "</div></sc-if>")
    datos = ('<sc-if value="{{enDatos}}" hint-placeholder-val="{{no}}"><div class="k-pila">'
             '<div class="w-caja"><div class="k-caja-cab"><span>Datos</span></div><div class="k-g">'
             '<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">Supervisores</div></div>'
             '<div class="w-cmp"><span class="rt">Nombre en inglés</span><div class="ct">Supervisors</div></div>'
             '<div class="w-cmp"><span class="rt">Descripción</span><div class="ct area">Quién supervisa la visita.</div></div>'
             '<div class="w-cmp"><span class="rt">Descripción en inglés</span><div class="ct area ph">Opcional</div></div></div></div>'
             '<div class="w-caja"><div class="k-caja-cab"><span>Lo usan</span></div><div class="g-det">'
             '<span class="k">Visita a cliente</span><span><a href="FRM-Ficha.dc.html">Pregunta 7 · Supervisor a cargo</a></span></div></div></div></sc-if>')
    tabs = ('<div class="o-tabs ficha" role="tablist">'
            '<a class="{{tabFi}}" role="tab" aria-selected="{{selFi}}" onClick="{{verFiltros}}">Filtros</a>'
            '<a class="{{tabDa}}" role="tab" aria-selected="{{selDa}}" onClick="{{verDatos}}">Datos</a></div>')
    acciones = ('<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-sec">Descartar cambios</button></sc-if>'
                '<button type="button" class="cb cb-pri" disabled="{{limpio}}">Guardar cambios</button>')
    banda = (f'<div class="w-bnd"><div class="iz"><span class="ic">{F.LISTA}</span><div><h1>Supervisores</h1>'
             '<p class="res f-bnd-est"><span class="w-est {{estClase2}}">{{estado}}</span>'
             '<sc-if value="{{rolBorrado}}" hint-placeholder-val="{{no}}">' + F.info("Un rol de los filtros ya no existe.") + '</sc-if><span>Con filtros</span>'
             '<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><span class="f-sucio">Cambios sin guardar</span></sc-if></p></div></div>'
             f'<div class="ac">{acciones}</div></div>')
    js = """    const tab = this.state.t ?? (e === 'Datos' ? 'datos' : 'filtros');
    const sucio = ['Dos condiciones', 'Ninguna opción', 'Más de 200'].includes(e);
    const borrado = e === 'Rol que ya no existe';
    const lista = ['Tres opciones', 'Dos condiciones', 'Elegir a quién', 'Datos'].includes(e);
    return {
      si: true, no: false,
      enFiltros: tab === 'filtros', enDatos: tab === 'datos',
      tabFi: tab === 'filtros' ? 'on' : '', tabDa: tab === 'datos' ? 'on' : '', selFi: tab === 'filtros' ? 'true' : 'false', selDa: tab === 'datos' ? 'true' : 'false',
      verFiltros: () => this.setState({ t: 'filtros' }), verDatos: () => this.setState({ t: 'datos' }),
      sucio, limpio: !sucio,
      estado: borrado ? 'No se puede usar' : 'Se puede usar', estClase2: borrado ? 'mal' : '', rolBorrado: borrado,
      op1: e === 'Más de 200' ? 'no tiene ninguno de' : 'tiene alguno de',
      v1: borrado ? 'Rol que ya no existe' : 'Supervisor', chip1Clase: borrado ? 'mal' : '', v1Clase: borrado ? 'mal' : '',
      conFila2: e === 'Dos condiciones' || e === 'Ninguna opción',
      col2: e === 'Ninguna opción' ? 'Activo' : 'Empresa', op2: e === 'Ninguna opción' ? 'es' : 'está en alguna de', v2: e === 'Ninguna opción' ? 'No' : 'Delta S.A.',
      quienClase: e === 'Elegir a quién' ? 'on' : '', elegir: e === 'Elegir a quién',
      probando: e === 'Probando', textoProbar: e === 'Probando' ? 'Probando…' : 'Probar',
      masDe200: e === 'Más de 200', conLista: lista, ver_0: e !== 'Dos condiciones', ver_1: true, ver_2: true,
      ninguna: e === 'Ninguna opción', sinProbar: borrado,
      conPie: lista || e === 'Más de 200', pie: e === 'Más de 200' ? '214 opciones' : e === 'Dos condiciones' ? '2 opciones' : '3 opciones',
    };"""
    return F.pagina("Catálogo con filtros · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Supervisores", banda,
                    '<div class="w-body">' + tabs + filtros + datos + "</div>",
                    css_extra=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_PREGUNTA + CSS_FICHA_CAT + CSS_FICHA_CAT2 + CSS_FILTROS + CSS_FILTROS2,
                    estados=("estado", ESTADOS_FILTROS), js=js, seccion="catalogos")


def filtros_opciones():
    tabs = ('<div class="o-tabs ficha" role="tablist"><a class="on" role="tab" aria-selected="true">Filtros</a>'
            '<a role="tab" aria-selected="false">Datos</a></div>')
    banda = (f'<div class="w-bnd"><div class="iz"><span class="ic">{F.LISTA}</span><div><h1>Supervisores</h1>'
             '<p class="res f-bnd-est"><span class="w-est">Se puede usar</span><span>Con filtros</span></p></div></div>'
             '<div class="ac"><button type="button" class="cb cb-pri" disabled>Guardar cambios</button></div></div>')
    out = {}
    for v in "AB":
        cuerpo = ('<div class="w-body">' + tabs + '<div class="k-cols"><div class="k-pila" style="margin-top: 0; max-width: none;">' + condiciones(v) + otras()
                  + "</div>" + vista_previa_miembros() + "</div></div>")
        out[f"FRM-CatFiltros-{v}"] = F.pagina("FRM-CatFiltros-" + v, "Inicio / Formularios / Catálogos / Supervisores", banda, cuerpo,
                                             css_extra=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_PREGUNTA + CSS_FICHA_CAT + CSS_FICHA_CAT2 + CSS_FILTROS,
                                             seccion="catalogos")
    return out


def opcion_opciones():
    base = ficha_cat()
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar opción</button>'
    pares = (campo_dlg("Texto", "Venta nueva", True, cnt=("11 / 30", "")) + campo_dlg("Texto en inglés", "New sale", cnt=("8 / 30", ""))
             + campo_dlg("Detalle", "Primera visita a un cliente", area=True) + campo_dlg("Detalle en inglés", "Opcional", clase="ph", area=True)
             + campo_dlg("Código", "VEN", True, extra="cod"))
    a = F.con_dialogo(base, F.dialogo("Editar opción", pares, pie, una=False), CSS_OPCION)
    pila = (campo_dlg("Texto", "Venta nueva", True, cnt=("11 / 30", "")) + campo_dlg("Texto en inglés", "New sale", cnt=("8 / 30", ""))
            + campo_dlg("Detalle", "Primera visita a un cliente", area=True) + campo_dlg("Detalle en inglés", "Opcional", clase="ph", area=True)
            + campo_dlg("Código", "VEN", True, extra="cod"))
    b = F.con_dialogo(base, F.dialogo("Editar opción", pila, pie, una=True), CSS_OPCION)
    return {"FRM-CatOpcion-A": a, "FRM-CatOpcion-B": b}


# ---------------------------------------------------------------- canvas.json: los tableros de la E13 van en la página «Organización · Formularios»
TITULOS = {"M-FRM-Catalogos": "Catálogos · teléfono", "M-FRM-Catalogo": "Catálogo a mano · teléfono", "M-FRM-Catalogo-Opcion": "Opción de un catálogo · teléfono", "M-FRM-Catalogo-Filtros": "Catálogo con filtros · teléfono",
           "FRM-Catalogos": "Formularios · Catálogos", "FRM-Catalogo-Nuevo": "Formularios · nuevo catálogo", "FRM-Catalogo": "Formularios · catálogo a mano",
           "FRM-Catalogo-Opcion": "Formularios · opción de un catálogo", "FRM-Catalogo-Filtros": "Formularios · catálogo con filtros"}
LUGAR = {"M-FRM-Catalogos": (0, 4340, 390, 844), "M-FRM-Catalogo": (470, 4340, 390, 844), "M-FRM-Catalogo-Opcion": (940, 4340, 390, 844), "M-FRM-Catalogo-Filtros": (1410, 4340, 390, 844),
         "FRM-Catalogos": (0, 3320, 1440, 900), "FRM-Catalogo-Nuevo": (1520, 3320, 1440, 900), "FRM-Catalogo": (3040, 3320, 1440, 900), "FRM-Catalogo-Opcion": (4560, 3320, 1440, 900), "FRM-Catalogo-Filtros": (6080, 3320, 1440, 900)}


def registrar(nombres):
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n in nombres:
        x, y, w, h = LUGAR[n]
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n], "page": F.PAGINA["id"]}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


# ================================================================ Teléfono: las mismas piezas que los teléfonos de Formularios (E12)
CSS_TCAT = """.ap-bar .sub.mal { color: oklch(0.5 0.19 25); }
.ap-i.neu { color: var(--t3); }
.ap-seg2 { display: grid; grid-template-columns: 1fr 1.7fr; gap: 3px; padding: 3px; border-radius: 12px; background: var(--s3); }
.ap-seg2 span { min-height: 38px; padding: 4px 6px; box-sizing: border-box; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; text-align: center; font-size: 14px; font-weight: 600; color: var(--t2); line-height: 1.25; }
.ap-seg2 span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.ap-hoja .hb { display: flex; flex-direction: column; gap: 14px; }
.ap-hoja .hb.lst { gap: 0; }
.k-pie { display: flex; align-items: baseline; gap: 8px; }
.k-pie .cnt { margin-left: auto; font-size: 13px; color: var(--t3); }
.k-pie .cnt.mal { color: oklch(0.5 0.19 25); font-weight: 600; }
.t-err { font-size: 14px; color: oklch(0.5 0.19 25); }
.ap-cmp .ct.mal { border-color: oklch(0.6 0.19 25) !important; }
.ap-cmp .ct.area { display: block; padding: 12px 14px; line-height: 1.5; min-height: 76px; }
.q-row.baja .tx b { color: var(--t3); }
.ap-gtit .off { color: var(--t3); font-weight: 600; font-size: 14.5px; display: inline-flex; align-items: center; gap: 4px; }
.k-res > div { display: flex; flex-direction: column; padding: 10px 14px; border-top: 1px solid var(--borde); line-height: 1.35; }
.k-res > div:first-child { border-top: 0; }
.k-res b { font-weight: 500; font-size: 15.5px; }
.k-res span { font-size: 13.5px; color: var(--t3); }
.k-pie2 { padding: 10px 14px; border-top: 1px solid var(--borde); font-size: 13.5px; color: var(--t3); }
.k-quien { display: flex; gap: 10px; padding: 12px 14px; align-items: center; }
.k-quien .ct { flex: 1; min-height: 46px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; font-size: 16px; background: #fff; }
.k-quien .cb { height: 46px; border-radius: 12px; }
.t-chk { display: flex; align-items: center; gap: 12px; font-size: 16px; min-height: 50px; padding: 0 14px; }
.t-chk i { width: 22px; height: 22px; border-radius: 6px; background: var(--marca); display: inline-flex; align-items: center; justify-content: center; color: #fff; }
"""
TILDE_T = F.svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")


def tel_base(cuerpo, fijo="", hojas="", estados=None, js="", css=""):
    """Una pantalla del teléfono sin barra de abajo (como la ficha de un formulario), con hojas encima."""
    t = F.pagina_tel(None, None, cuerpo + fijo, css=F.CSS_TFICHA + F.CSS_TFILTRO + CSS_TCAT + css)
    i = t.index('<nav class="ap-nav"')
    j = t.index("</nav>", i) + len("</nav>")
    t = t[:i] + t[j:]
    k = t.index('<span class="ap-raya"></span>') + len('<span class="ap-raya"></span>')
    t = t[:k] + hojas + t[k:]
    if estados:
        prop, opciones = estados
        props = {prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
        t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
        t = t.replace("    return { si: true, no: false };", f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n{js}")
    return t


def opciones_hoja(titulo, items, prefijo):
    tilde = F.svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")
    opc = "".join(f'<span class="t-opc {{{{{prefijo}On_{k}}}}}">{n}<span class="d">{c}<sc-if value="{{{{{prefijo}Sel_{k}}}}}" hint-placeholder-val="{{{{no}}}}">{tilde}</sc-if></span></span>'
                  for k, n, c in items)
    return F.thoja(titulo, opc, "").replace('<div class="hb">', '<div class="hb lst">', 1)


# ---------------------------------------------------------------- M-FRM-Catalogos
ESTADOS_TCATALOGOS = ["Todos", "Filtros", "A mano", "Con filtros", "Sin resultados", "Cargando", "Vacío", "Error", "Nuevo catálogo"]


def tel_catalogos():
    filas = []
    for n, origen, opciones, usan, clase, estado, motivo in CATALOGOS:
        grupo = "verMano" if origen == "A mano" else "verFiltros"
        i = f'<button type="button" class="ap-i" aria-label="Por qué no se puede usar" title="{motivo}">{F.TINFO}</button>' if motivo else ""
        op = f"{opciones} opciones" if opciones.isdigit() else opciones
        destino = "M-FRM-Catalogo-Filtros" if origen == "Con filtros" else "M-FRM-Catalogo"
        filas.append(f'<sc-if value="{{{{{grupo}}}}}" hint-placeholder-val="{{{{si}}}}"><a class="ap-fila" href="{destino}.dc.html"><div class="tx">'
                     f'<span class="l1">{n}</span><span class="l2">{origen} · {op}</span><span class="l3"><span class="w-est {clase}">{estado}</span>{i}</span></div>'
                     f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></a></sc-if>')
    cuerpo = ('<div class="ap-cuerpo"><sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + "".join(filas) + "</sc-if>"
              '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div></sc-if>'
              '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">Todavía no hay catálogos.</div></sc-if>'
              '<sc-if value="{{sinResultados}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">Ningún catálogo coincide con los filtros.'
              '<button type="button" class="cb cb-sec">Limpiar filtros</button></div></sc-if>'
              '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="ap-vacio">No pudimos cargar los catálogos.<button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div>')
    fab = f'<a class="ap-fab" aria-label="Nuevo catálogo" href="#">{F.TFAB}</a>'
    nuevo = ('<sc-if value="{{nuevo}}" hint-placeholder-val="{{no}}">'
             + F.thoja("Nuevo catálogo", F.tcampo("Nombre", "Motivos de visita", req=True)
                       + '<div class="ap-cmp"><span class="rt"><span>De dónde salen las opciones <span class="rq">*</span></span>'
                       f'<button type="button" class="ap-i neu" aria-label="Qué significa" title="No se puede cambiar después.">{F.TINFO}</button></span>'
                       '<div class="ap-seg2" role="radiogroup"><span class="on" role="radio">Escribirlas a mano</span><span role="radio">Tomarlas de los miembros, con filtros</span></div></div>',
                       '<button type="button" class="cb cb-pri lleno">Crear catálogo</button><button type="button" class="cb cb-sec">Cancelar</button>') + "</sc-if>"
             '<sc-if value="{{hojaFiltros}}" hint-placeholder-val="{{no}}">'
             + opciones_hoja("Filtrar por origen", [("t", "Todos los orígenes", 3), ("m", "A mano", 2), ("f", "Con filtros", 1)], "ori") + "</sc-if>")
    js = """    const f = e === 'Nuevo catálogo' || e === 'Filtros' ? 'Todos' : e;
    const lista = ['Todos', 'A mano', 'Con filtros'].includes(f);
    const elegido = f === 'A mano' || f === 'Con filtros' ? f : '';
    return {
      si: true, no: false,
      filClase: elegido ? 'con' : '', abrirFiltros: () => {}, hojaFiltros: e === 'Filtros',
      oriOn_t: elegido ? '' : 'on', oriOn_m: f === 'A mano' ? 'on' : '', oriOn_f: f === 'Con filtros' ? 'on' : '',
      oriSel_t: !elegido, oriSel_m: f === 'A mano', oriSel_f: f === 'Con filtros',
      conFilas: lista, verMano: f !== 'Con filtros', verFiltros: f !== 'A mano',
      cargando: f === 'Cargando', vacio: f === 'Vacío', sinResultados: f === 'Sin resultados', error: f === 'Error', nuevo: e === 'Nuevo catálogo',
    };"""
    t = F.pagina_tel("Catálogos", "Grupo Delta", cuerpo, fab=fab, estados=("estado", ESTADOS_TCATALOGOS), js=js, css=F.CSS_TFILTRO + F.CSS_TFICHA + CSS_TCAT, filtros=True)
    k = t.index("</nav>", t.index('<nav class="ap-nav"')) + len("</nav>")
    t = t[:k] + nuevo + t[k:]
    return re.sub(r"<title>[^<]*</title>", "<title>Catálogos · teléfono</title>", t)


# ---------------------------------------------------------------- M-FRM-Catalogo: la ficha a mano, con pestañas «Opciones | Datos»
ESTADOS_TFICHA_CAT = ["Opciones", "Filtros", "Acciones de una opción", "Sin opciones", "500 alcanzadas", "Conflicto", "Datos", "Datos · cambios sin guardar"]


def tel_ficha_cat(estados=ESTADOS_TFICHA_CAT, js_extra="", claves_extra="", hojas_extra="", prop="estado"):
    filas = "".join(f'<div class="q-row{"" if activa else " baja"}"><span class="num">{k + 1}</span><span class="tx"><b>{tx}</b>'
                    f'<span>{(det + " · " + cod) if activa else ("Dada de baja · " + cod)}</span></span>'
                    f'<button type="button" class="ap-ib" aria-label="Acciones de {tx}">{F.TKEBAB}</button></div>' for k, (tx, det, cod, activa) in enumerate(OPCIONES))
    agregar = ('<sc-if value="{{agregarOn}}" hint-placeholder-val="{{si}}"><a href="M-FRM-Catalogo-Opcion.dc.html">Agregar</a></sc-if>'
               f'<sc-if value="{{{{agregarOff}}}}" hint-placeholder-val="{{{{no}}}}"><span class="off">Agregar<button type="button" class="ap-i neu" aria-label="Por qué" '
               f'title="Un catálogo tiene hasta 500 opciones, contando las dadas de baja.">{F.TINFO}</button></span></sc-if>')
    opciones = ('<sc-if value="{{tabOp}}" hint-placeholder-val="{{si}}"><div class="ap-gtit">Opciones' + agregar + '</div><div class="ap-grupo">'
                '<sc-if value="{{conOpciones}}" hint-placeholder-val="{{si}}">' + filas + "</sc-if>"
                '<sc-if value="{{sinOpciones}}" hint-placeholder-val="{{no}}"><div class="t-vacia">Todavía no hay opciones.</div></sc-if></div></sc-if>')
    datos = ('<sc-if value="{{tabDa}}" hint-placeholder-val="{{no}}"><div class="ap-gtit">Datos</div><div class="f-campos">'
             + F.tcampo("Nombre", "{{nombre}}", req=True)
             + '<div class="ap-cmp"><span class="rt"><span>Nombre en inglés</span></span><div class="ct {{enClase}}">{{nombreEn}}</div></div>'
             '<div class="ap-cmp"><span class="rt"><span>Descripción</span></span><div class="ct area">Por qué se visita a un cliente.</div></div>'
             '<div class="ap-cmp"><span class="rt"><span>Descripción en inglés</span></span><div class="ct area ph">Opcional</div></div></div>'
             '<div class="ap-gtit">Lo usan</div><div class="ap-grupo"><div class="ap-dato"><span class="k">Visita a cliente</span><span class="v">Pregunta 5 · Motivo</span></div></div></sc-if>')
    tabs = ('<div class="ap-tabs" role="tablist"><a class="{{cOp}}" role="tab" href="#" onClick="{{verOp}}">Opciones <span class="c">{{cant}}</span></a>'
            '<a class="{{cDa}}" role="tab" href="#" onClick="{{verDa}}">Datos</a></div>')
    bandas = (f'<sc-if value="{{{{conflicto}}}}" hint-placeholder-val="{{{{no}}}}"><div class="t-banda" role="alert">{F.ALERTA}<span class="tx">Otra persona cambió esta lista mientras la mirabas.</span>'
              '<a href="#">Ver lo nuevo</a></div></sc-if>')
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Catalogos.dc.html">{F.TVOLVER}</a>'
           '<div class="tit"><h1>{{nombre}}</h1><span class="sub {{subClase}}">{{sub}}</span></div>'
           f'<sc-if value="{{{{tabOp}}}}" hint-placeholder-val="{{{{si}}}}"><button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button>'
           f'<button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button></sc-if></div>')
    cuerpo = bar + tabs + bandas + '<div class="ap-cuerpo">' + opciones + datos + '<div style="height: 20px;"></div></div>'
    fijo = ('<sc-if value="{{tabDa}}" hint-placeholder-val="{{no}}"><div class="ap-fijo"><sc-if value="{{sucio}}" hint-placeholder-val="{{no}}">'
            '<button type="button" class="cb cb-sec full">Descartar cambios</button></sc-if>'
            '<button type="button" class="cb cb-pri full" disabled="{{limpio}}">Guardar cambios</button></div></sc-if>')
    hojas = ('<sc-if value="{{hojaAcciones}}" hint-placeholder-val="{{no}}">'
             + F.thoja("Venta nueva", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span role="menuitem">Subir</span><span role="menuitem">Bajar</span>'
                       '<span class="pel" role="menuitem">Dar de baja</span></div>', '<button type="button" class="cb cb-sec">Cancelar</button>') + "</sc-if>"
             '<sc-if value="{{hojaFiltros}}" hint-placeholder-val="{{no}}">'
             + opciones_hoja("Filtrar por estado", [("t", "Todas", 4), ("a", "Activas", 3), ("b", "Dadas de baja", 1)], "est") + "</sc-if>" + hojas_extra)
    js = js_extra + """    const tab = this.state.t ?? (e.startsWith('Datos') ? 'da' : 'op');
    const vacio = e === 'Sin opciones';
    const tope = e === '500 alcanzadas';
    const sucio = e === 'Datos · cambios sin guardar';
    return {
      si: true, no: false,
      tabOp: tab === 'op', tabDa: tab === 'da', cOp: tab === 'op' ? 'on' : '', cDa: tab === 'da' ? 'on' : '',
      verOp: () => this.setState({ t: 'op' }), verDa: () => this.setState({ t: 'da' }),
      nombre: vacio ? 'Clientes mayoristas' : 'Motivos de visita',
      sub: (vacio ? 'No se puede usar' : 'Se puede usar') + ' · A mano', subClase: vacio ? 'mal' : '',
      nombreEn: sucio ? 'Visit reasons' : 'Opcional', enClase: sucio ? '' : 'ph',
      cant: vacio ? '0' : tope ? '500' : '4', conOpciones: !vacio, sinOpciones: vacio,
      agregarOn: !tope, agregarOff: tope, conflicto: e === 'Conflicto',
      sucio, limpio: !sucio,
      hojaAcciones: e === 'Acciones de una opción', hojaFiltros: e === 'Filtros',
      estOn_t: 'on', estOn_a: '', estOn_b: '', estSel_t: true, estSel_a: false, estSel_b: false,
""" + claves_extra + "    };"
    t = tel_base(cuerpo, fijo, hojas, estados=(prop, estados), js=js)
    return re.sub(r"<title>[^<]*</title>", "<title>Catálogo · teléfono</title>", t)


# ---------------------------------------------------------------- M-FRM-Catalogo-Opcion: la opción en una hoja, con los mismos estados que la compu
def tel_opcion():
    cuerpo = ('<div class="ap-cmp"><span class="rt"><span>Texto <span class="rq">*</span></span></span><div class="ct {{tClase}}">{{texto}}</div>'
              '<span class="k-pie"><sc-if value="{{tErr}}" hint-placeholder-val="{{no}}"><span class="t-err" role="alert">{{tErr}}</span></sc-if><span class="cnt {{tCntClase}}">{{tCnt}}</span></span></div>'
              '<div class="ap-cmp"><span class="rt"><span>Texto en inglés</span></span><div class="ct {{enClase2}}">{{textoEn}}</div><span class="k-pie"><span class="cnt">{{enCnt}}</span></span></div>'
              '<div class="ap-cmp"><span class="rt"><span>Detalle</span></span><div class="ct area {{dClase}}">{{detalle}}</div></div>'
              '<div class="ap-cmp"><span class="rt"><span>Detalle en inglés</span></span><div class="ct area ph">Opcional</div></div>'
              '<div class="ap-cmp"><span class="rt"><span>Código <span class="rq">*</span></span></span><div class="ct {{cClase}}">{{codigo}}</div>'
              '<sc-if value="{{cErr}}" hint-placeholder-val="{{no}}"><span class="t-err" role="alert">{{cErr}}</span></sc-if></div>')
    hoja = ('<sc-if value="{{si}}" hint-placeholder-val="{{si}}">'
            + F.thoja("{{tituloDlg}}", cuerpo, '<button type="button" class="cb cb-pri lleno" disabled="{{guardando}}">{{boton}}</button>'
                      '<button type="button" class="cb cb-sec" disabled="{{guardando}}">Cancelar</button>') + "</sc-if>")
    js = """    const d = e;
    const nueva = d !== 'Editar' && d !== 'Guardando';
    const vacia = d === 'Nueva' || d === 'Sin completar';
"""
    claves = """      tituloDlg: nueva ? 'Agregar opción' : 'Editar opción', boton: d === 'Guardando' ? 'Guardando…' : nueva ? 'Agregar opción' : 'Guardar opción',
      guardando: d === 'Guardando',
      texto: vacia ? 'Por ejemplo, Seguimiento' : d === 'Texto de más de 30' ? 'Primera visita a un cliente nuevo' : d === 'Código repetido' ? 'Visita técnica' : 'Venta nueva',
      tClase: (vacia ? 'ph ' : '') + (d === 'Sin completar' || d === 'Texto de más de 30' ? 'mal' : ''),
      tErr: d === 'Sin completar' ? 'Escribí el texto.' : d === 'Texto de más de 30' ? 'Usá hasta 30 caracteres.' : '',
      tCnt: vacia ? '0 / 30' : d === 'Texto de más de 30' ? '33 / 30' : d === 'Código repetido' ? '14 / 30' : '11 / 30', tCntClase: d === 'Texto de más de 30' ? 'mal' : '',
      textoEn: nueva ? 'Opcional' : 'New sale', enClase2: nueva ? 'ph' : '', enCnt: nueva ? '0 / 30' : '8 / 30',
      detalle: vacia ? 'Opcional' : d === 'Código repetido' ? 'Revisión de una instalación' : 'Primera visita a un cliente', dClase: vacia ? 'ph' : '',
      codigo: vacia ? 'Por ejemplo, SEG' : d === 'Código repetido' ? 'VEN' : d === 'Texto de más de 30' ? 'VNU' : 'VEN',
      cClase: (vacia ? 'ph ' : '') + (d === 'Sin completar' || d === 'Código repetido' ? 'mal' : ''),
      cErr: d === 'Sin completar' ? 'Escribí un código.' : d === 'Código repetido' ? 'Ya hay una opción con ese código.' : '',
"""
    t = tel_ficha_cat(estados=ESTADOS_OPCION, js_extra=js, claves_extra=claves, hojas_extra=hoja)
    t = t.replace("    const tab = this.state.t ?? (e.startsWith('Datos') ? 'da' : 'op');", "    const tab = 'op';")
    t = t.replace("    const vacio = e === 'Sin opciones';", "    const vacio = false;")
    t = t.replace("hojaAcciones: e === 'Acciones de una opción', hojaFiltros: e === 'Filtros',", "hojaAcciones: false, hojaFiltros: false,")
    return re.sub(r"<title>[^<]*</title>", "<title>Catálogo · opción · teléfono</title>", t)


# ---------------------------------------------------------------- M-FRM-Catalogo-Filtros: el editor de filtros en el teléfono (a elegir: completo o solo para ver)
def tel_filtros(variante="A"):
    res = "".join(f"<div><b>{n}</b><span>{d}</span></div>" for n, d in MIEMBROS)
    if variante == "A":
        cond = ('<div class="ap-gtit">Condiciones<a href="#">Agregar</a></div><div class="ap-grupo">'
                f'<div class="q-row"><span class="tx"><b>Si el rol tiene alguno de</b><span>Supervisor</span></span><button type="button" class="ap-ib" aria-label="Acciones de la condición">{F.TKEBAB}</button></div></div>'
                '<div class="ap-gtit">Otras opciones</div><div class="ap-grupo">'
                f'<div class="t-chk"><i>{TILDE_T}</i>Sin incluir a quien lo recibe</div></div><div class="f-campos" style="margin-top: 12px;">'
                + F.tcampo("Detalle", "Empresas", select=True) + F.tcampo("Orden", "Nombre, de la A a la Z", select=True) + "</div>")
        fijo = '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Guardar cambios</button></div>'
    else:
        cond = ('<div class="ap-gtit">Condiciones</div><div class="ap-grupo"><div class="ap-dato"><span class="k">Si el rol tiene alguno de</span><span class="v">Supervisor</span></div></div>'
                '<div class="ap-gtit">Otras opciones</div><div class="ap-grupo">'
                '<div class="ap-dato"><span class="k">Sin incluir a quien lo recibe</span><span class="v">Sí</span></div>'
                '<div class="ap-dato"><span class="k">Detalle</span><span class="v">Empresas</span></div>'
                '<div class="ap-dato"><span class="k">Orden</span><span class="v">Nombre, de la A a la Z</span></div></div>')
        fijo = ""
    previa = ('<div class="ap-gtit">Como si lo recibiera</div><div class="ap-grupo"><div class="k-quien">'
              f'<span class="ct">Tomás Acosta {CHEV_CAMPO}</span><button type="button" class="cb cb-sec">Probar</button></div>'
              f'<div class="k-res" style="border-top: 1px solid var(--borde);">{res}</div><div class="k-pie2">3 opciones</div></div>')
    tabs = '<div class="ap-tabs" role="tablist"><a class="on" role="tab" href="#">Filtros</a><a role="tab" href="#">Datos</a></div>'
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Catalogos.dc.html">{F.TVOLVER}</a>'
           '<div class="tit"><h1>Supervisores</h1><span class="sub">Se puede usar · Con filtros</span></div></div>')
    cuerpo = bar + tabs + '<div class="ap-cuerpo">' + cond + previa + '<div style="height: 20px;"></div></div>'
    return tel_base(cuerpo, fijo)


ESTADOS_TFILTROS = ["Tres opciones", "Dos condiciones", "Acciones de una condición", "Editar una condición", "Elegir a quién", "Probando", "Ninguna opción",
                    "Más de 200", "Rol que ya no existe", "Datos"]
CSS_TFILTROS = """.k-aviso { display: flex; gap: 10px; margin: 0 14px 12px; padding: 12px 14px; border-radius: 12px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); font-size: 14.5px; line-height: 1.4; }
.k-aviso svg { flex-shrink: 0; margin-top: 2px; }
.k-esq { display: flex; flex-direction: column; gap: 14px; padding: 16px 14px; }
.k-esq span { height: 12px; border-radius: 6px; background: oklch(0.93 0.01 78); }
.k-vacia { padding: 22px 14px; text-align: center; font-size: 15.5px; font-weight: 600; border-top: 1px solid var(--borde); }
.q-row .tx span.mal, .q-row .tx span.mal span { color: oklch(0.5 0.19 25); }
.q-row .tx b span { font-size: inherit; color: inherit; }
.ap-hoja .ap-cmp .ct.ph { justify-content: flex-start; gap: 8px; }
.q-row .tx .t-err, .q-row .tx .t-err span { font-size: 13.5px; color: oklch(0.5 0.19 25); }
.ap-hoja .hp { flex-wrap: wrap; }
.ap-hoja .hp .cb.pel-full { flex-basis: 100%; color: oklch(0.5 0.19 25); }
.k-chip-t { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 6px 0 10px; border-radius: 8px; background: var(--s3); font-size: 14.5px; font-weight: 500; }
.k-lista > span { display: flex; align-items: center; min-height: 50px; border-top: 1px solid var(--borde); font-size: 16px; }
.k-lista > span:first-child { border-top: 0; }
.k-lista > span.on { color: var(--marca-tx); font-weight: 600; }
"""


def tel_filtros_cat():
    res = "".join(f'<sc-if value="{{{{ver_{k}}}}}" hint-placeholder-val="{{{{si}}}}"><div><b>{n}</b><span>{d}</span></div></sc-if>' for k, (n, d) in enumerate(MIEMBROS))
    mas = "".join(f"<div><b>{n}</b><span>{d}</span></div>" for n, d in [("Agustina Ruiz", "Delta S.A."), ("Bruno Castro", "Delta Norte"), ("Camila Díaz", "Delta S.A.")])
    cond = ('<div class="ap-gtit">Condiciones<a href="#">Agregar</a></div><div class="ap-grupo">'
            '<div class="q-row"><span class="tx"><b>{{t1}}</b><span class="{{v1Clase}}">{{v1}}</span>'
            '<sc-if value="{{rolBorrado}}" hint-placeholder-val="{{no}}"><span class="t-err" role="alert">Ese rol ya no existe. Elegí otro.</span></sc-if></span>'
            f'<button type="button" class="ap-ib" aria-label="Acciones de la condición">{F.TKEBAB}</button></div>'
            '<sc-if value="{{conFila2}}" hint-placeholder-val="{{no}}"><div class="q-row"><span class="tx"><b>{{t2}}</b><span>{{v2}}</span></span>'
            f'<button type="button" class="ap-ib" aria-label="Acciones de la condición">{F.TKEBAB}</button></div></sc-if></div>'
            '<div class="ap-gtit">Otras opciones</div><div class="ap-grupo">'
            f'<div class="t-chk"><i>{TILDE_T}</i>Sin incluir a quien lo recibe</div></div><div class="f-campos" style="margin-top: 12px;">'
            + F.tcampo("Detalle", "Empresas", select=True) + F.tcampo("Orden", "Nombre, de la A a la Z", select=True) + "</div>")
    previa = ('<div class="ap-gtit">Como si lo recibiera</div><div class="ap-grupo"><div class="k-quien">'
              f'<span class="ct">Tomás Acosta {CHEV_CAMPO}</span><button type="button" class="cb cb-sec" disabled="{{{{probando}}}}">{{{{textoProbar}}}}</button></div>'
              '<sc-if value="{{masDe200}}" hint-placeholder-val="{{no}}"><div class="k-aviso" role="status">' + F.ALERTA + '<span>Más de 200: no se va a poder mandar.</span></div></sc-if>'
              '<sc-if value="{{conLista}}" hint-placeholder-val="{{si}}"><div class="k-res" style="border-top: 1px solid var(--borde);">' + res + "</div></sc-if>"
              '<sc-if value="{{masDe200}}" hint-placeholder-val="{{no}}"><div class="k-res" style="border-top: 1px solid var(--borde);">' + mas + "</div></sc-if>"
              '<sc-if value="{{probando}}" hint-placeholder-val="{{no}}"><div class="k-esq" style="border-top: 1px solid var(--borde);"><span style="width: 70%;"></span><span style="width: 55%;"></span></div></sc-if>'
              '<sc-if value="{{ninguna}}" hint-placeholder-val="{{no}}"><div class="k-vacia">Ninguna opción para Tomás Acosta.</div></sc-if>'
              '<sc-if value="{{sinProbar}}" hint-placeholder-val="{{no}}"><div class="k-vacia">Corregí la condición para probar.</div></sc-if>'
              '<sc-if value="{{conPie}}" hint-placeholder-val="{{si}}"><div class="k-pie2">{{pie}}</div></sc-if></div>')
    filtros = '<sc-if value="{{tabFi}}" hint-placeholder-val="{{si}}">' + cond + previa + "</sc-if>"
    datos = ('<sc-if value="{{tabDa}}" hint-placeholder-val="{{no}}"><div class="ap-gtit">Datos</div><div class="f-campos">'
             + F.tcampo("Nombre", "Supervisores", req=True) + F.tcampo("Nombre en inglés", "Supervisors")
             + '<div class="ap-cmp"><span class="rt"><span>Descripción</span></span><div class="ct area">Quién supervisa la visita.</div></div>'
             '<div class="ap-cmp"><span class="rt"><span>Descripción en inglés</span></span><div class="ct area ph">Opcional</div></div></div>'
             '<div class="ap-gtit">Lo usan</div><div class="ap-grupo"><div class="ap-dato"><span class="k">Visita a cliente</span><span class="v">Pregunta 7 · Supervisor a cargo</span></div></div></sc-if>')
    tabs = ('<div class="ap-tabs" role="tablist"><a class="{{cFi}}" role="tab" href="#" onClick="{{verFi}}">Filtros</a>'
            '<a class="{{cDa}}" role="tab" href="#" onClick="{{verDa}}">Datos</a></div>')
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Catalogos.dc.html">{F.TVOLVER}</a>'
           '<div class="tit"><h1>Supervisores</h1><span class="sub {{subClase}}">{{sub}}</span></div></div>')
    cuerpo = bar + tabs + '<div class="ap-cuerpo">' + filtros + datos + '<div style="height: 20px;"></div></div>'
    fijo = ('<div class="ap-fijo"><sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-sec full">Descartar cambios</button></sc-if>'
            '<button type="button" class="cb cb-pri full" disabled="{{limpio}}">Guardar cambios</button></div>')
    hojas = ('<sc-if value="{{hojaAcc}}" hint-placeholder-val="{{no}}">'
             + F.thoja("Si el rol tiene alguno de", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span class="pel" role="menuitem">Quitar</span></div>',
                       '<button type="button" class="cb cb-sec">Cancelar</button>') + "</sc-if>"
             '<sc-if value="{{hojaCond}}" hint-placeholder-val="{{no}}">'
             + F.thoja("Editar condición", F.tcampo("Columna", "Rol", req=True, select=True) + F.tcampo("Operador", "tiene alguno de", req=True, select=True)
                       + f'<div class="ap-cmp"><span class="rt"><span>Valor <span class="rq">*</span></span></span><div class="ct sel"><span class="k-chip-t">Supervisor{CRUZ}</span>{CHEV_CAMPO}</div></div>',
                       '<button type="button" class="cb cb-pri lleno">Guardar condición</button><button type="button" class="cb cb-sec">Cancelar</button>') + "</sc-if>"
             '<sc-if value="{{hojaElegir}}" hint-placeholder-val="{{no}}">'
             + F.thoja("Como si lo recibiera", f'<span class="ap-cmp"><span class="ct ph">{F.TLUPA} Buscar por nombre</span></span><div class="k-lista">'
                       '<span>Carolina Vega</span><span>Diego Ríos</span><span>Julieta Sosa</span><span>Marcos Giménez</span><span class="on">Tomás Acosta</span></div>', "") + "</sc-if>")
    js = """    const tab = this.state.t ?? (e === 'Datos' ? 'da' : 'fi');
    const sucio = ['Dos condiciones', 'Ninguna opción', 'Más de 200'].includes(e);
    const borrado = e === 'Rol que ya no existe';
    const lista = ['Tres opciones', 'Dos condiciones', 'Acciones de una condición', 'Editar una condición', 'Elegir a quién', 'Datos'].includes(e);
    return {
      si: true, no: false,
      tabFi: tab === 'fi', tabDa: tab === 'da', cFi: tab === 'fi' ? 'on' : '', cDa: tab === 'da' ? 'on' : '',
      verFi: () => this.setState({ t: 'fi' }), verDa: () => this.setState({ t: 'da' }),
      sub: (borrado ? 'No se puede usar' : 'Se puede usar') + ' · Con filtros', subClase: borrado ? 'mal' : '',
      sucio, limpio: !sucio, rolBorrado: borrado,
      t1: e === 'Más de 200' ? 'Si el rol no tiene ninguno de' : 'Si el rol tiene alguno de', v1: borrado ? 'Rol que ya no existe' : 'Supervisor', v1Clase: borrado ? 'mal' : '',
      conFila2: e === 'Dos condiciones' || e === 'Ninguna opción',
      t2: e === 'Ninguna opción' ? 'y activo es' : 'y la empresa está en alguna de', v2: e === 'Ninguna opción' ? 'No' : 'Delta S.A.',
      probando: e === 'Probando', textoProbar: e === 'Probando' ? 'Probando…' : 'Probar',
      masDe200: e === 'Más de 200', conLista: lista, ver_0: e !== 'Dos condiciones', ver_1: true, ver_2: true,
      ninguna: e === 'Ninguna opción', sinProbar: borrado,
      conPie: lista || e === 'Más de 200', pie: e === 'Más de 200' ? '214 opciones' : e === 'Dos condiciones' ? '2 opciones' : '3 opciones',
      hojaAcc: e === 'Acciones de una condición', hojaCond: e === 'Editar una condición', hojaElegir: e === 'Elegir a quién',
    };"""
    t = tel_base(cuerpo, fijo, hojas, estados=("estado", ESTADOS_TFILTROS), js=js, css=CSS_TFILTROS)
    return re.sub(r"<title>[^<]*</title>", "<title>Catálogo con filtros · teléfono</title>", t)


def ajustar_rol():
    """Rol y M-Rol: el área Formularios suma «Ver catálogos» y «Administrar catálogos» (formcatalogs.read y .manage). Se puede volver a correr."""
    ruta = PROJ / "Rol.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "formcatalogs.read" not in t:
        a = "['formrecords.read', 'Ver respuestas', 'Los valores de cada respuesta.']"
        assert t.count(a) == 1
        t = t.replace(a, a + ", ['formcatalogs.read', 'Ver catálogos', 'La lista de catálogos y su ficha.'], "
                             "['formcatalogs.manage', 'Administrar catálogos', 'Crear catálogos y editar sus opciones y filtros.']")
        ruta.write_text(t, encoding="utf-8")
        print("Rol con los permisos de catálogos")
    ruta = PROJ / "M-Rol.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if ">Ver catálogos<" not in t:
        k = t.index('<span class="n">Formularios</span><span class="c">5 de 5</span>')
        t = t[:k] + t[k:].replace('<span class="n">Formularios</span><span class="c">5 de 5</span>', '<span class="n">Formularios</span><span class="c">7 de 7</span>', 1)
        fin = t.index("Ver respuestas</div>", k) + len("Ver respuestas</div>")
        ini = t.rindex('<div class="ap-perm">', 0, fin)
        perm = t[ini:fin]
        t = t[:fin] + perm.replace("Ver respuestas", "Ver catálogos") + perm.replace("Ver respuestas", "Administrar catálogos") + t[fin:]
        ruta.write_text(t, encoding="utf-8")
        print("M-Rol con los permisos de catálogos")


if __name__ == "__main__" and not sys.argv[1:]:
    ajustar_rol()
    tableros = {"FRM-Catalogos": catalogos(), "FRM-Catalogo-Nuevo": nuevo_cat(), "FRM-Catalogo": ficha_cat(), "FRM-Catalogo-Opcion": opcion(), "FRM-Catalogo-Filtros": filtros_cat(),
                "M-FRM-Catalogos": tel_catalogos(), "M-FRM-Catalogo": tel_ficha_cat(), "M-FRM-Catalogo-Opcion": tel_opcion(), "M-FRM-Catalogo-Filtros": tel_filtros_cat()}
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    registrar(tableros)
    print("tableros", list(tableros))

if __name__ == "__main__" and sys.argv[1:] == ["tel-filtros-opciones"]:
    for v in "AB":
        (PROJ / f"M-FRM-CatFiltros-{v}.dc.html").write_text(tel_filtros(v), encoding="utf-8")
    print("opciones M-FRM-CatFiltros-A y B")

if __name__ == "__main__" and sys.argv[1:] == ["filtros-opciones"]:
    for nombre, t in filtros_opciones().items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(filtros_opciones()))

if __name__ == "__main__" and sys.argv[1:] == ["opcion-opciones"]:
    for nombre, t in opcion_opciones().items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(opcion_opciones()))

if __name__ == "__main__" and sys.argv[1:] == ["ficha-opciones"]:
    for nombre, t in ficha_cat_opciones().items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(ficha_cat_opciones()))

if __name__ == "__main__" and sys.argv[1:] == ["nuevo-opciones"]:
    for nombre, t in nuevo_cat_opciones().items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("opciones", list(nuevo_cat_opciones()))
