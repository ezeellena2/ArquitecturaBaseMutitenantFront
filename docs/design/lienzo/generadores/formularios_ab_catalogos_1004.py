"""Etapa 13 · Catálogos con la disposición de ArquitecturaBase (K1 a K7 del lienzo «Formularios por WhatsApp»).

Sigue a `formularios_ab_1004.py` (E12, versión 128): mismas piezas y mismo criterio. Donde la disposición de allá choca
con una regla escrita del lienzo, manda la nuestra (FilterBar en lugar del segmentado, ⋮ en lugar de botones sueltos en
las filas, «Guardar cambios», sin texto explicativo, el motivo en ⓘ). Multitenant: las opciones «de la base» salen solo de
los miembros de la organización (nunca de otra), y la consulta con SQL (K5) no entra: allá también quedó para después.

K1 listado, K2 nuevo (de dónde salen), K3 editor a mano (una sola pantalla, opciones que se abren en el lugar), K4 editor
con filtros (vista previa «Como si lo recibiera»). K6 (la pregunta) y K7 (al mandar y al responder) van en
`formularios_ab_1004.py`, que arma el editor y el chat. Corre después de él.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402

PROJ = F.PROJ
svg = F.svg
ALERTA, OK, X, MAS, KEBAB, CHEV, INFO = F.ALERTA, F.OK, F.X, F.MAS, F.KEBAB, F.CHEV, F.INFO
LAPIZ, ARRIBA, ABAJO, QUITAR = F.LAPIZ, F.ARRIBA, F.ABAJO, F.QUITAR
CANDADO, RELOJ, TILDE = A.CANDADO, A.RELOJ, A.TILDE
GENTE = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>', 20)
LAPIZ20 = svg('<path d="M15.5 5.5 18.5 8.5 9 18H6v-3z"/>', 20)
REACTIVAR = svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>', 16)


def banda_k(titulo, estado, acciones, volver="FRM-Catalogos.dc.html"):
    return A.banda(titulo, estado, acciones, volver).replace('aria-label="Volver a Diseñar formularios"', 'aria-label="Volver a Catálogos"', 1)


def pagina_k(nombre, miga, banda, cuerpo, css, estados, js, alto=900):
    t = A.pagina_ab(nombre, miga, banda, cuerpo, css=css + (f".w-app {{ height: {alto}px !important; }}\n" if alto != 900 else ""),
                    estados=("estado", estados), js=js, seccion="catalogos")
    if alto != 900:
        t = t.replace('"$preview":{"width":1440,"height":900}', f'"$preview":{{"width":1440,"height":{alto}}}', 1)
    return t


# ---------------------------------------------------------------- K1 · Catálogos (listado)
CATS = [  # nombre, descripción, origen, sub, opciones, lo usan, clase, estado, motivo, destino
    ("Clientes", "A quiénes se les entrega o se visita.", "Escritas a mano", "", "46", "2 formularios", "", "Activo", "", "FRM-Catalogo"),
    ("Depósitos", "De dónde sale la mercadería.", "Escritas a mano", "", "4", "—", "off", "Dado de baja", "", "FRM-Catalogo"),
    ("Motivos de visita", "Por qué se visita a un cliente.", "Escritas a mano", "", "3", "1 formulario", "", "Activo", "", "FRM-Catalogo"),
    ("Responsables de obra", "Supervisores y jefes de obra.", "De los miembros", "con filtros", "—", "1 formulario", "mal", "No se puede usar",
     "Un rol de los filtros ya no existe.", "FRM-Catalogo-Filtros"),
    ("Supervisores", "Quienes pueden aprobar una visita.", "De los miembros", "con filtros", "7", "1 formulario", "", "Activo", "", "FRM-Catalogo-Filtros"),
]
ESTADOS_CATS = ["Todos", "Filtro abierto", "Escritas a mano", "De los miembros", "Sin coincidencias", "Cargando", "Vacío", "Error"]
CSS_K1 = """.w-th.k1, .w-tr.k1 { grid-template-columns: minmax(240px, 1.6fr) 170px 100px 140px minmax(190px, 1fr); }
.w-tr.k1 .k-tc { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.w-tr.k1 .k-tc a { color: var(--t1); text-decoration: none; font-weight: 500; }
.w-tr.k1 .k-tc small { font-size: 12px; color: var(--t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-tr.k1 .gris { color: var(--t3); }
.w-tr.k1 .est2 { display: flex; flex-direction: column; gap: 2px; }
.w-tr.k1 .est2 small { font-size: 12px; color: var(--t3); }
.w-tr.k1 .usan { color: var(--marca-tx); font-weight: 500; text-decoration: none; }
.o-fb { display: flex; align-items: center; gap: 8px; }
.o-fb .w-bus { width: 320px; flex: none; }
.o-fb .tot { margin-left: auto; font-size: 13px; color: var(--t3); }
"""


def fila_k1(n, desc, origen, sub, ops, usan, clase, estado, motivo, destino):
    o = f'<span class="k-tc"><span>{origen}</span><small>{sub}</small></span>' if sub else f"<span>{origen}</span>"
    op = f'<span class="gris">{ops}</span>' if ops == "—" else f"<span>{ops}</span>"
    u = '<span class="gris">—</span>' if usan == "—" else f'<a class="usan" href="{destino}.dc.html" aria-label="Ver formularios que usan {n}">{usan}</a>'
    m = f"<small>{motivo}</small>" if motivo else ""
    grupo = "verMano" if origen == "Escritas a mano" else "verMiembros"
    return (f'<sc-if value="{{{{{grupo}}}}}" hint-placeholder-val="{{{{si}}}}"><div class="w-tr k1"><span class="k-tc"><a href="{destino}.dc.html">{n}</a><small>{desc}</small></span>'
            f'{o}{op}{u}<span class="est2"><span class="w-est {clase}">{estado}</span>{m}</span></div></sc-if>')


def catalogos():
    filas = "".join(fila_k1(*c) for c in CATS)
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            + F.filtro("Origen", [("t", "Todos los orígenes", 5), ("m", "Escritas a mano", 3), ("b", "De los miembros", 2)], "ori")
            + F.filtro("Estado", [("t", "Todos los estados", 5), ("a", "Activo", 3), ("n", "No se puede usar", 1), ("d", "Dado de baja", 1)], "est")
            + '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></sc-if>'
            '<span class="tot">{{total}}</span></div></sc-if>')
    tabla = ('<div class="w-caja"><div class="w-th k1"><span>Catálogo</span><span>De dónde salen</span><span>Opciones</span><span>Lo usan</span><span>Estado</span></div>'
             '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + filas
             + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
             '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
             '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay catálogos.</b>'
             f'<a class="cb cb-sec" href="FRM-Catalogo-Nuevo.dc.html">{MAS} Nuevo catálogo</a></div></sc-if>'
             '<sc-if value="{{sinCoincidencias}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ningún catálogo coincide con los filtros.</b>'
             '<button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></div></sc-if>'
             '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar los catálogos.</b><button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div>')
    banda = F.banda("Catálogos", "{{resumen}}", f'<a class="cb cb-pri" href="FRM-Catalogo-Nuevo.dc.html">{MAS} Nuevo catálogo</a>').replace(
        f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{F.LISTA}</span>', 1)
    js = """    const f = e;
    const mano = f === 'Escritas a mano', miembros = f === 'De los miembros', elegido = mano || miembros;
    const lista = ['Todos', 'Filtro abierto', 'Escritas a mano', 'De los miembros'].includes(f);
    return {
      si: true, no: false,
      resumen: f === 'Vacío' ? 'Sin catálogos' : f === 'Cargando' || f === 'Error' ? '' : '5 catálogos · 3 activos',
      conFiltros: f !== 'Vacío', busqueda: f === 'Sin coincidencias' ? 'proveedores' : 'Buscar por nombre', busClase: f === 'Sin coincidencias' ? 'lleno' : '',
      oriTexto: mano ? 'Origen: Escritas a mano' : miembros ? 'Origen: De los miembros' : 'Origen', oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriAlternar: () => {},
      oriOn_t: elegido ? '' : 'on', oriOn_m: mano ? 'on' : '', oriOn_b: miembros ? 'on' : '', oriC_t: '5', oriC_m: '3', oriC_b: '2',
      oriElegir_t: () => {}, oriElegir_m: () => {}, oriElegir_b: () => {},
      estTexto: 'Estado', estClase: '', estMenu: false, estAlternar: () => {}, estOn_t: 'on', estOn_a: '', estOn_n: '', estOn_d: '',
      estC_t: '5', estC_a: '3', estC_n: '1', estC_d: '1', estElegir_t: () => {}, estElegir_a: () => {}, estElegir_n: () => {}, estElegir_d: () => {},
      hayFiltro: elegido || f === 'Sin coincidencias', limpiar: () => {},
      total: mano ? '3 catálogos' : miembros ? '2 catálogos' : f === 'Sin coincidencias' ? '0 catálogos' : '5 catálogos',
      conFilas: lista, verMano: !miembros, verMiembros: !mano, rango: mano ? '1–3 de 3' : miembros ? '1–2 de 2' : '1–5 de 5',
      cargando: f === 'Cargando', vacio: f === 'Vacío', sinCoincidencias: f === 'Sin coincidencias', error: f === 'Error',
    };"""
    return pagina_k("Catálogos · /org/formularios/catalogos", "Inicio / Formularios / Catálogos", banda, '<div class="w-body">' + caja + tabla + "</div>",
                    F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + CSS_K1, ESTADOS_CATS, js)


# ---------------------------------------------------------------- K2 · Nuevo catálogo: de dónde salen las opciones (no cambia después)
CSS_K2 = """.w-dlg.k2 { width: 600px; }
.k-ops { display: flex; flex-direction: column; gap: 10px; }
.k-op { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 1px solid var(--borde); border-radius: 10px; background: #fff; }
.k-op.on { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); background: oklch(0.975 0.01 180); }
.k-op .rd { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--borde2); box-sizing: border-box; flex-shrink: 0; margin-top: 2px; background: #fff; }
.k-op.on .rd { border: 5px solid var(--marca); }
.k-op .ic { width: 34px; height: 34px; border-radius: 9px; background: var(--s2); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.k-op.on .ic { background: #fff; color: var(--marca-tx); }
.k-op .tx { display: flex; flex-direction: column; gap: 3px; line-height: 1.35; }
.k-op .tx b { font-size: 14.5px; font-weight: 600; }
.k-op .tx span { font-size: 13px; color: var(--t3); }
.k-rt { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--t2); }
"""
ESTADOS_K2 = ["Escribirlas a mano", "Tomarlas de los miembros"]


def nuevo():
    base = catalogos()
    def op(on, icono, titulo, texto):
        return (f'<div class="k-op{" on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><span class="rd"></span><span class="ic">{icono}</span>'
                f'<span class="tx"><b>{titulo}</b><span>{texto}</span></span></div>')
    def cuerpo(mano):
        return ('<span class="k-rt">De dónde salen las opciones' + F.info("No se puede cambiar después: para otro origen se arma otro catálogo.") + "</span>"
                '<div class="k-ops" role="radiogroup" aria-label="De dónde salen las opciones">'
                + op(mano, LAPIZ20, "Escribirlas a mano", "Para listas que mantiene una persona: clientes, motivos, depósitos.")
                + op(not mano, GENTE, "Tomarlas de los miembros, con filtros", "Se arma sola con los miembros de la organización que cumplen los filtros.")
                + "</div>")
    pie_m = '<button type="button" class="cb cb-sec">Cancelar</button><a class="cb cb-pri" href="FRM-Catalogo.dc.html">Continuar</a>'
    pie_f = '<button type="button" class="cb cb-sec">Cancelar</button><a class="cb cb-pri" href="FRM-Catalogo-Filtros.dc.html">Continuar</a>'
    capas = {"Escribirlas a mano": F.dialogo("Nuevo catálogo", cuerpo(True), pie_m).replace('class="w-dlg"', 'class="w-dlg k2"', 1),
             "Tomarlas de los miembros": F.dialogo("Nuevo catálogo", cuerpo(False), pie_f).replace('class="w-dlg"', 'class="w-dlg k2"', 1)}
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_K2.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = base.replace(json.dumps(ESTADOS_CATS, ensure_ascii=False, separators=(",", ":")), json.dumps(ESTADOS_K2, ensure_ascii=False, separators=(",", ":")), 1)
    t = t.replace('"default":"Todos"', '"default":"Escribirlas a mano"', 1)
    viejo = "    const f = e;\n"
    i = t.index(viejo)
    t = (t[:i] + "    const k = " + json.dumps(ESTADOS_K2, ensure_ascii=False) + ".indexOf(e);\n    const s0 = k === 0, s1 = k === 1;\n    const f = 'Todos';\n"
         + t[i + len(viejo):].replace("      si: true, no: false,\n", "      si: true, no: false, s0, s1,\n", 1))
    t = re.sub(r"<title>[^<]*</title>", "<title>Nuevo catálogo · de dónde salen las opciones</title>", t)
    return F.con_dialogo(t, over, CSS_K2)


# ---------------------------------------------------------------- K3 · Editor de un catálogo escrito a mano (una sola pantalla)
OPS = [("Seguimiento", "SEG", "Visita programada a un cliente actual", "Follow-up", True),
       ("Venta nueva", "VEN", "Primera visita a un cliente", None, True),
       ("Reclamo", "REC", "Hay un problema para resolver", "Complaint", True),
       ("Cobranza", "COB", "Cobrar un pago pendiente", "Collection", False)]
CSS_K3 = """.k-txt { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
.k-txt .rt { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.k-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; padding: 16px; }
.k-g2 .ancho { grid-column: 1 / -1; }
.k-g2 .w-cmp .ay, .k-ed .ay { font-size: 12.5px; color: var(--t3); display: inline-flex; align-items: center; gap: 4px; }
.k-g2 .w-cmp .ct.ro { background: var(--s2); color: var(--t3); display: flex; justify-content: space-between; align-items: center; }
.k-g2 .w-cmp .ct.mal, .k-ed .ct.mal { border-color: var(--peligro); }
.k-g2 .w-cmp .ct.ph, .k-ed .ct.ph { color: var(--t3); }
.k-g2 .w-cmp .err2, .k-ed .err2 { font-size: 12.5px; color: var(--peligro); }
.f-cab .der { display: inline-flex; align-items: center; gap: 10px; font-weight: 500; color: var(--t3); }
.k-fb { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--borde); position: relative; z-index: 5; }
.k-fb .w-bus { width: 280px; flex: none; }
.w-th.k3, .w-tr.k3 { grid-template-columns: 36px minmax(0, 1fr) minmax(0, 1.25fr) 110px 36px; }
.w-tr.k3 > span { min-width: 0; }
.w-tr.k3 > span:nth-child(3) { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-tr.k3 { position: relative; }
.w-tr.k3 .k-tc { display: flex; flex-direction: column; gap: 2px; }
.w-tr.k3 .k-tc small { font-family: ui-monospace, Consolas, monospace; font-size: 11.5px; color: var(--t3); }
.w-tr.k3.baja > span:nth-child(-n+3) { color: var(--t3); }
.w-tr.k3 .f-menu { position: absolute; right: 12px; top: calc(100% - 6px); z-index: 20; min-width: 190px; }
.w-body .w-caja:has(.f-menu) { overflow: visible; }
.k-ab { background: oklch(0.985 0.004 78); border-top: 1px solid var(--borde); }
.k-ed { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; padding: 4px 16px 14px 60px; }
.k-ed .ancho { grid-column: 1 / -1; }
.k-ed .w-cmp .cnt { align-self: flex-end; font-size: 12px; color: var(--t3); }
.k-chk { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
.k-chk i { width: 16px; height: 16px; border-radius: 4px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.k-pie { display: flex; justify-content: space-between; align-items: center; }
.k-col { display: flex; flex-direction: column; gap: 16px; }
.k-usan { display: flex; flex-direction: column; }
.k-usan > div { display: flex; justify-content: space-between; gap: 10px; padding: 9px 14px; border-top: 1px solid var(--borde); font-size: 13.5px; }
.k-usan > div:first-child { border-top: 0; }
.k-usan a { color: var(--marca-tx); text-decoration: none; font-weight: 500; }
.k-usan .gris { color: var(--t3); }
.tel .pv-hb.lst { padding: 0; gap: 0; }
.tel .k-li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 14px; border-bottom: 1px solid oklch(0.94 0.004 150); }
.tel .k-li .t { display: flex; flex-direction: column; line-height: 1.3; font-size: 12.5px; color: oklch(0.25 0.01 150); }
.tel .k-li .t small { font-size: 11px; color: oklch(0.5 0.01 150); }
.tel .k-li i { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid oklch(0.55 0.01 150); flex-shrink: 0; }
.tel .k-li i.on { border: 4.5px solid oklch(0.55 0.13 160); }
.k-sup { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 10px; font-size: 13.5px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.k-sup .tx { flex: 1; }
.k-sup .cb { height: 32px; font-size: 13px; }
.k-dif { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; grid-column: 1 / -1; }
.k-dif > div { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
.k-dif .c { padding: 8px 12px; background: oklch(0.945 0.018 76); font-size: 12.5px; font-weight: 600; color: var(--t2); }
.k-dif .g-det { border: 0; border-radius: 0; }
"""


def k_textos(ingles=False, distintas="1 distinta"):
    es, en = ("", "on") if ingles else ("on", "")
    return (f'<div class="w-caja k-txt"><span class="rt">Textos en</span><span class="ab-seg" role="radiogroup">'
            f'<span class="{es}" role="radio">Español · original</span><span class="{en}" role="radio">English' + (f' · <span class="falta">{distintas}</span>' if distintas else "") + '</span></span>'
            + F.info("El nombre y la descripción van en los dos idiomas. En las opciones el inglés es opcional: si no lo completás, se usa el español.") + "</div>")


def k_catalogo(nombre="Motivos de visita", desc="Por qué se visita a un cliente.", origen="Escritas a mano", ingles=False, err_nombre=False):
    if ingles:
        nombre_v, desc_v = "Visit reasons", "Why a customer is visited."
        ay_n, ay_d = '<span class="ay">En español: Motivos de visita</span>', '<span class="ay">En español: Por qué se visita a un cliente.</span>'
    else:
        nombre_v, desc_v, ay_n = nombre, desc, ""
        ay_d = '<span class="ay">La leen las personas para saber cuándo usarlo.</span>'
    n_ct = ('<div class="ct mal ph">Escribí el nombre</div><span class="err2" role="alert">Escribí el nombre del catálogo.</span>' if err_nombre
            else f'<div class="ct{" ph" if not nombre_v else ""}">{nombre_v or "Escribí el nombre"}</div>')
    return ('<div class="w-caja"><div class="f-cab"><span>El catálogo</span></div><div class="k-g2">'
            f'<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span>{n_ct}{ay_n}</div>'
            f'<div class="w-cmp"><span class="rt">De dónde salen las opciones</span><div class="ct ro">{origen}{CANDADO}</div>'
            '<span class="ay">No se cambia.' + F.info("Para otro origen se arma otro catálogo.") + "</span></div>"
            f'<div class="w-cmp ancho"><span class="rt">Descripción <span class="req">*</span></span><div class="ct{" ph" if not desc_v else ""}">{desc_v or "Para qué sirve"}</div>{ay_d}</div>'
            "</div></div>")


def k_menu(n, baja=False):
    ultimo = (f'<span class="f-mi" role="menuitem">{REACTIVAR} Reactivar</span>' if baja else
              f'<span class="f-sep" role="separator"></span><span class="f-mi pel" role="menuitem">{QUITAR} Dar de baja</span>')
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de {n}"><span class="f-mi" role="menuitem">{LAPIZ} Editar</span>'
            f'<span class="f-mi" role="menuitem">{ARRIBA} Subir</span><span class="f-mi" role="menuitem">{ABAJO} Bajar</span>{ultimo}</div>')


def k_fila(k, n, cod, det, en, activa, ingles=False, menu=False):
    texto = (en or f"<i>{n}</i>") if ingles else n
    est = '<span class="w-est">Activa</span>' if activa else '<span class="w-est off">Dada de baja</span>'
    return (f'<div class="w-tr k3{"" if activa else " baja"}"><span>{k}</span><span class="k-tc"><span>{texto}</span><small>{cod}</small></span><span>{det}</span>{est}'
            f'<span><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>{k_menu(n, not activa) if menu else ""}</div>')


def k_editando(n="Venta nueva", cod="VEN", det="Primera visita a un cliente", nueva=False, error="", ingles=False):
    cnt = f"{len(n)} / 30"
    if error == "vacia":
        t_ct = '<div class="ct mal ph">Texto</div><span class="err2" role="alert">Escribí el texto de la opción.</span>'
        c_ct = '<div class="ct mal ph">Código</div><span class="err2" role="alert">Escribí el código.</span>'
        cnt = "0 / 30"
    elif error == "codigo":
        t_ct, c_ct = f'<div class="ct">{n}</div>', f'<div class="ct mal">{cod}</div><span class="err2" role="alert">Ya hay una opción con ese código.</span>'
    elif error == "largo":
        t_ct = f'<div class="ct mal">{n}</div><span class="err2" role="alert">Puede tener hasta 30 caracteres.</span>'
        c_ct = f'<div class="ct">{cod}</div>'
        cnt = f"{len(n)} / 30"
    else:
        t_ct, c_ct = f'<div class="ct">{n}</div>', f'<div class="ct">{cod}</div>'
    if ingles:
        t_ct = '<div class="ct ph">Sin traducir</div><span class="ay">En español: Venta nueva. Si no lo completás, se usa el español.</span>'
        cnt = "0 / 30"
    tit = "Nueva opción" if nueva else ""
    cab = (f'<div class="w-tr k3"><span>—</span><span class="k-tc"><span><b>{tit}</b></span><small></small></span><span></span><span></span><span></span></div>' if nueva
           else k_fila(2, n, cod, det, None, True))
    return ('<div class="k-ab">' + cab + '<div class="k-ed">'
            f'<div class="w-cmp"><span class="rt">Texto <span class="req">*</span></span>{t_ct}<span class="cnt">{cnt}</span></div>'
            f'<div class="w-cmp"><span class="rt">Código <span class="req">*</span></span>{c_ct}<span class="ay">No se muestra en WhatsApp.</span></div>'
            f'<div class="w-cmp ancho"><span class="rt">Detalle</span><div class="ct{" ph" if not det else ""}">{det or "Opcional"}</div></div>'
            f'<div class="k-pie ancho"><span class="k-chk"><i>{TILDE}</i>Activa</span>'
            f'<button type="button" class="cb cb-sec">{svg(chr(60) + "path d=" + chr(34) + "m6 15 6-6 6 6" + chr(34) + "/" + chr(62), 14, "2")} Listo</button></div>'
            "</div></div>")


def k_opciones(modo="normal", ingles=False, menu=False, filtro="Estado", lleno=False):
    if modo == "vacia":
        filas = '<div class="f-cuerpo"><b>Todavía no hay opciones.</b></div>'
        cuenta, pie = "0 opciones", ""
    else:
        filas = ""
        for k, (n, cod, det, en, activa) in enumerate(OPS, 1):
            if modo == "editar" and k == 2:
                filas += k_editando(ingles=ingles)
            elif modo in ("vacia_err", "codigo", "largo") and k == 2:
                filas += k_editando(error={"vacia_err": "vacia", "codigo": "codigo", "largo": "largo"}[modo],
                                    n="Venta nueva para clientes del interior" if modo == "largo" else "Venta nueva",
                                    cod="SEG" if modo == "codigo" else "VEN")
            else:
                filas += k_fila(k, n, cod, det, en, activa, ingles, menu=(menu and k == 3))
        if modo == "agregar":
            filas += k_editando(n="", cod="", det="", nueva=True)
        cuenta = "4 opciones · 3 activas"
        pie = '<div class="w-pie"><span>1–4 de 4</span><span>10 por página · Página 1 de 1</span></div>'
    boton = f'<button type="button" class="cb cb-sec"{" disabled" if lleno else ""}>{MAS} Agregar opción</button>'
    lleno_i = F.info("Llegó a 500 opciones, el máximo de un catálogo. Dá de baja las que no se usan.") if lleno else ""
    fb = (f'<div class="k-fb"><span class="w-bus">{F.BUSCAR} Buscar opción</span><span class="w-pil">{filtro} {CHEV}</span></div>' if modo != "vacia" else "")
    return (f'<div class="w-caja"><div class="f-cab"><span>Opciones</span><span class="der">{cuenta}{lleno_i}{boton}</span></div>{fb}'
            '<div class="w-th k3"><span>#</span><span>Texto y código</span><span>Detalle</span><span>Estado</span><span class="sr">Acciones</span></div>'
            f"{filas}{pie}</div>")


def k_usan():
    return ('<div class="w-caja"><div class="f-cab"><span>Lo usan</span>'
            + F.info("Los cambios llegan en el próximo envío; no hace falta publicar los formularios de nuevo.") + '</div><div class="k-usan">'
            '<div><a href="FRM-Editor.dc.html">Visita a cliente</a><span class="gris">Pregunta 5 · Motivo</span></div></div></div>')


def k_vista(titulo="Motivo", items=None, ingles=False):
    items = items or [(n if not ingles else (en or n), det) for n, _, det, en, activa in OPS if activa]
    li = "".join(f'<div class="k-li"><span class="t">{n}<small>{d}</small></span><i class="{"on" if k == 0 else ""}"></i></div>' for k, (n, d) in enumerate(items))
    return ('<div class="pv"><div class="pv-tit"><span class="pv-tit2">Así lo ve el empleado</span></div><div class="tel"><div class="pv-hoja">'
            f'<div class="pv-hc"><span class="pv-x">×</span>{titulo}</div><div class="pv-hb lst">{li}</div></div></div></div>')


def k_cuerpo(sup="", ingles=False, opciones=None, nombre="Motivos de visita", desc="Por qué se visita a un cliente.", err_nombre=False, vista=True, usan=True):
    der = '<div class="k-col">' + (k_usan() if usan else "") + (k_vista(ingles=ingles) if vista else "") + "</div>"
    return ('<div class="w-body">' + sup + k_textos(ingles, "1 distinta" if nombre else "") + '<div class="f-cols"><div class="f-pila">'
            + k_catalogo(nombre, desc, ingles=ingles, err_nombre=err_nombre) + (opciones if opciones is not None else k_opciones(ingles=ingles)) + "</div>" + der + "</div></div>")


def k_acc(sucio=False, guardando=False, nuevo=False, baja=False):
    d = "" if (sucio and not guardando) else " disabled"
    g = "Guardando…" if guardando else "Crear catálogo" if nuevo else "Guardar cambios"
    kebab = "" if nuevo else f'<button type="button" class="ib" aria-label="Más acciones" aria-haspopup="menu">{KEBAB}</button>'
    desc = "Cancelar" if nuevo else "Descartar cambios"
    return (f'<button type="button" class="cb cb-sec"{" disabled" if guardando else ""}>{desc}</button>'
            f'<button type="button" class="cb cb-pri"{d}>{g}</button>{kebab}')


ACTIVO = '<span class="w-est">Activo</span>'
ACTIVO_SUCIO = ACTIVO + '<span class="f-sucio">Cambios sin guardar</span>'
ESTADOS_K3 = ["Sin cambios", "Cambios sin guardar", "Editar una opción", "Agregar una opción", "Opción sin completar", "Código repetido",
              "Texto de más de 30", "Acciones de una opción", "Textos en inglés", "Guardando", "Guardado", "No se guardó", "Otra persona guardó",
              "Más acciones", "Dar de baja el catálogo", "Sin opciones", "500 opciones", "Nuevo catálogo", "Falta el nombre", "Cargando", "No existe"]


def manual():
    tit = "Motivos de visita"
    revision = (f'<div class="k-sup" role="status">{ALERTA}<span class="tx">El catálogo puede haber cambiado. Revisá la versión actual antes de guardar de nuevo.</span>'
                '<button type="button" class="cb cb-sec">Revisar</button></div>')
    cargando = ('<div class="w-body"><div class="f-cuerpo izq"><div class="esq"><span style="width: 60%;"></span><span style="width: 80%;"></span>'
                '<span style="width: 70%;"></span></div></div></div>')
    no_existe = '<div class="w-body"><div class="w-caja"><div class="f-cuerpo"><b>No encontramos este catálogo.</b><a class="cb cb-sec" href="FRM-Catalogos.dc.html">Volver a Catálogos</a></div></div></div>'
    menu_banda = (f'<div class="f-menu" role="menu" aria-label="Más acciones" style="position: absolute; right: 0; top: calc(100% + 6px); z-index: 20; min-width: 200px;">'
                  f'<span class="f-mi pel" role="menuitem">{QUITAR} Dar de baja</span></div>')
    nuevo_cuerpo = k_cuerpo(opciones=k_opciones("vacia"), nombre="", desc="", usan=False, vista=False)
    V = {
        "Sin cambios": (banda_k(tit, ACTIVO, k_acc()), k_cuerpo()),
        "Cambios sin guardar": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), k_cuerpo()),
        "Editar una opción": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), k_cuerpo(opciones=k_opciones("editar"))),
        "Agregar una opción": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), k_cuerpo(opciones=k_opciones("agregar"))),
        "Opción sin completar": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), k_cuerpo(opciones=k_opciones("vacia_err"))),
        "Código repetido": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), k_cuerpo(opciones=k_opciones("codigo"))),
        "Texto de más de 30": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), k_cuerpo(opciones=k_opciones("largo"))),
        "Acciones de una opción": (banda_k(tit, ACTIVO, k_acc()), k_cuerpo(opciones=k_opciones(menu=True))),
        "Textos en inglés": (banda_k(tit, ACTIVO, k_acc()), k_cuerpo(ingles=True)),
        "Guardando": (banda_k(tit, ACTIVO_SUCIO, k_acc(True, True)), k_cuerpo()),
        "Guardado": (banda_k(tit, ACTIVO, k_acc()), k_cuerpo()),
        "No se guardó": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), k_cuerpo()),
        "Otra persona guardó": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), k_cuerpo(sup=revision)),
        "Más acciones": (banda_k(tit, ACTIVO, k_acc().replace('aria-haspopup="menu">', 'aria-haspopup="menu" aria-expanded="true">', 1) + menu_banda), k_cuerpo()),
        "Dar de baja el catálogo": (banda_k(tit, ACTIVO, k_acc()), k_cuerpo()),
        "Sin opciones": (banda_k(tit, ACTIVO, k_acc()), k_cuerpo(opciones=k_opciones("vacia"))),
        "500 opciones": (banda_k(tit, ACTIVO, k_acc()), k_cuerpo(opciones=k_opciones(lleno=True))),
        "Nuevo catálogo": (banda_k("Nuevo catálogo", "Escritas a mano", k_acc(nuevo=True)), nuevo_cuerpo),
        "Falta el nombre": (banda_k("Nuevo catálogo", "Escritas a mano", k_acc(True, nuevo=True)),
                            k_cuerpo(opciones=k_opciones("vacia"), nombre="", desc="", err_nombre=True, usan=False, vista=False)),
        "Cargando": (banda_k(tit, "", ""), cargando),
        "No existe": (banda_k("Catálogo", "", ""), no_existe),
    }
    assert list(V) == ESTADOS_K3
    dif = ('<div class="k-dif"><div><div class="c">Tu borrador</div><div class="g-det"><span class="k">Nombre</span><span>Motivos de visita</span>'
           '<span class="k">Descripción</span><span>Por qué se visita a un cliente.</span><span class="k">Opciones</span><span>4 · 3 activas</span></div></div>'
           '<div><div class="c">La revisión actual</div><div class="g-det"><span class="k">Nombre</span><span>Motivos de visita</span>'
           '<span class="k">Descripción</span><span>Por qué se visita a un cliente o a una obra.</span><span class="k">Opciones</span><span>5 · 4 activas</span></div></div></div>')
    capas = {
        "Guardado": A.toast("Catálogo guardado."),
        "No se guardó": A.toast("No pudimos guardar el catálogo. Lo escrito se conserva.", "mal"),
        "Otra persona guardó": F.dialogo("Revisión del catálogo", '<p class="d-tx">Laura Ríos guardó este catálogo mientras lo editabas. Tu borrador se conserva hasta que elijas.</p>' + dif,
                                         '<button type="button" class="cb cb-sec">Cerrar</button><button type="button" class="cb cb-sec">Releer</button>'
                                         '<button type="button" class="cb cb-pri">Usar la revisión actual</button>', una=False).replace('class="w-dlg"', 'class="w-dlg" style="width: 720px;"', 1),
        "Dar de baja el catálogo": A.confirmar("¿Dar de baja el catálogo?", "No se podrá elegir en preguntas nuevas ni mandar los formularios publicados que lo usan. Las respuestas anteriores se conservan.", "Dar de baja"),
    }
    t = pagina_k("Catálogo escrito a mano · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Motivos de visita",
                 A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                 F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + A.CSS_AB + CSS_K3 + ".w-bnd .ac { position: relative; }\n", ESTADOS_K3, A.js_estados(ESTADOS_K3), alto=1200)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_K3.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA)


# ---------------------------------------------------------------- K4 · Editor de un catálogo con filtros (los miembros de la organización)
CSS_K4 = """.k-cond { display: grid; grid-template-columns: 32px repeat(3, minmax(0, 1fr)) 32px; gap: 8px; align-items: center; }
.k-cond .si { font-size: 13px; color: var(--t3); }
.k-cond .ct { display: flex; justify-content: space-between; align-items: center; height: 36px; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 13.5px; color: var(--t1); }
.k-cond .ct.mal { border-color: var(--peligro); color: oklch(0.5 0.19 25); }
.k-cond .ib { width: 32px; height: 32px; border: 1px solid var(--borde); border-radius: 8px; }
.k-chip { display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 8px; border-radius: 6px; background: var(--marca-t); color: var(--marca-tx); font-size: 12.5px; font-weight: 600; }
.k-conds { display: flex; flex-direction: column; gap: 10px; }
.k-otras { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 14px 16px; align-items: start; }
.k-otras .orden { display: grid; grid-template-columns: minmax(0, 1fr) 110px; gap: 8px; }
.k-chk2 { display: flex; gap: 8px; font-size: 14px; }
.k-chk2 i { width: 16px; height: 16px; border-radius: 4px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.k-chk2 small { display: block; font-size: 12.5px; color: var(--t3); }
.k-sec { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
.k-sec .rt2 { font-size: 13px; font-weight: 600; color: var(--t2); }
.k-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 16px; }
.k-g3 .ct.ro { background: var(--s2); color: var(--t3); display: flex; justify-content: space-between; align-items: center; }
.k-g3 .ct.sel { display: flex; justify-content: space-between; align-items: center; }
.k-g3 .ay { font-size: 12.5px; color: var(--t3); }
.k-prev { display: flex; flex-direction: column; }
.k-prev .q { display: flex; flex-direction: column; gap: 6px; padding: 14px; border-bottom: 1px solid var(--borde); }
.k-prev .q .fila { display: flex; gap: 8px; }
.k-prev .q .ct { flex: 1; display: flex; justify-content: space-between; align-items: center; }
.k-prev .q .rt { font-size: 13px; font-weight: 600; color: var(--t2); }
.k-prev .li { display: flex; flex-direction: column; padding: 9px 14px; border-bottom: 1px solid var(--borde); font-size: 13.5px; }
.k-prev .li small { font-size: 12px; color: var(--t3); }
.k-prev .pie { padding: 9px 14px; font-size: 12.5px; color: var(--t3); background: var(--s2); }
.k-prev .vacio2 { padding: 22px 14px; text-align: center; font-size: 13.5px; color: var(--t2); }
.k-prev .menu2 { margin: 0 14px 10px; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); background: #fff; }
.k-prev .menu2 span { display: flex; flex-direction: column; padding: 8px 12px; font-size: 13.5px; border-top: 1px solid var(--borde); }
.k-prev .menu2 span:first-child { border-top: 0; background: var(--marca-t); }
.k-prev .menu2 small { font-size: 12px; color: var(--t3); }
.k-prev .p-esq { padding: 14px; }
.k-mas200 { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--borde); background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); font-size: 13.5px; font-weight: 500; }
"""
# Decisión 21: más de 30 caracteres se cortan con «…» y el nombre completo va en el detalle.
MIEMBROS = [("Florencia Fernández de la Fu…", "Florencia Fernández de la Fuente · Delta Norte"), ("Martín Paz", "Delta S.A."), ("Paula Méndez", "Delta S.A.")]


def f_cond(si, col, op, val, mal=False):
    return (f'<div class="k-cond"><span class="si">{si}</span><div class="ct">{col}{CHEV}</div><div class="ct">{op}{CHEV}</div>'
            f'<div class="ct{" mal" if mal else ""}">{val}{CHEV}</div><button type="button" class="ib" aria-label="Quitar condición">{X}</button></div>')


def f_fuente(rol_borrado=False):
    val_rol = "Rol no disponible" if rol_borrado else '<span class="k-chip">Supervisor ×</span>'
    conds = (f_cond("Si", "Rol", "tiene alguno de", val_rol, mal=rol_borrado) + f_cond("Y", "Activo", "es", "Sí")
             + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar condición</button>')
    err = '<span class="err2" role="alert" style="font-size: 12.5px; color: var(--peligro);">Un rol de los filtros ya no existe. Elegí otro.</span>' if rol_borrado else ""
    return ('<div class="w-caja"><div class="f-cab"><span>De dónde salen: los miembros, con filtros</span></div><div class="k-sec">'
            '<div class="k-g3">'
            f'<div class="w-cmp"><span class="rt">Vista</span><div class="ct ro">Miembros{CANDADO}</div><span class="ay">Columnas: Nombre, Rol, Empresa, Activo.</span></div>'
            f'<div class="w-cmp"><span class="rt">Texto de cada opción</span><div class="ct sel">Nombre{CHEV}</div></div>'
            f'<div class="w-cmp"><span class="rt">Detalle</span><div class="ct sel">Empresa{CHEV}</div></div></div>'
            f'<span class="rt2">Qué miembros entran</span><div class="k-conds">{conds}</div>{err}'
            '<div class="k-otras">'
            f'<span class="k-chk2"><i>{TILDE}</i><span>Sin incluir a quien lo recibe<small>Nadie se elige a sí mismo como supervisor.</small></span></span>'
            f'<div class="w-cmp"><span class="rt">Orden</span><div class="orden"><div class="ct sel" style="display: flex; justify-content: space-between; align-items: center;">Nombre{CHEV}</div>'
            f'<div class="ct sel" style="display: flex; justify-content: space-between; align-items: center;">A → Z{CHEV}</div></div></div>'
            "</div></div></div>")


def f_prev(modo="lista"):
    persona = "Tomás Acosta · Delta S.A." if modo != "sin_persona" else '<span style="color: var(--t3);">Elegí una persona</span>'
    q = (f'<div class="q"><span class="rt">Como si lo recibiera</span><div class="fila"><div class="ct{" ph" if modo == "sin_persona" else ""}">{persona}{CHEV}</div>'
         f'<button type="button" class="cb cb-sec"{" disabled" if modo == "sin_persona" else ""}>Probar</button></div></div>')
    if modo == "elegir":
        q += ('<div class="menu2" role="listbox"><span>Tomás Acosta<small>Delta S.A. · Vendedor</small></span><span>Lucía Fernández<small>Delta S.A. · Dueña</small></span>'
              '<span>Martín Paz<small>Delta S.A. · Supervisor</small></span></div>')
    if modo in ("lista", "elegir"):
        cuerpo = "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in MIEMBROS) + '<div class="pie">3 opciones · probado hoy a las 10:42</div>'
    elif modo == "probando":
        cuerpo = '<div class="p-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 70%;"></span></div>'
    elif modo == "ninguna":
        cuerpo = '<div class="vacio2">No hay opciones con estos filtros.</div><div class="pie">0 opciones · probado hoy a las 10:44</div>'
    elif modo == "mas200":
        cuerpo = (f'<div class="k-mas200" role="status">{ALERTA}<span>Más de 200: no se va a poder mandar.</span>'
                  + F.info("Se guarda igual: la cantidad cambia sola cuando la organización suma o quita miembros. Lo que frena es el envío.") + "</div>"
                  + "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in MIEMBROS[:2]) + '<div class="li" style="color: var(--t3);">…</div>'
                  + '<div class="pie">214 opciones · probado hoy a las 10:42</div>')
    elif modo == "sucio":
        cuerpo = '<div class="vacio2">Cambiaste los filtros. Tocá «Probar» para ver las opciones.</div>'
    else:
        cuerpo = '<div class="vacio2">Elegí una persona para probar antes de guardar.</div>'
    return f'<div class="w-caja"><div class="f-cab"><span>Vista previa</span></div><div class="k-prev">{q}{cuerpo}</div></div>'


ESTADOS_K4 = ["Sin cambios", "Cambios sin guardar", "Elegir a quién", "Probando", "Ninguna opción", "Más de 200", "Rol que ya no existe", "Nuevo catálogo", "Guardado"]


def filtros():
    tit = "Supervisores"
    def cuerpo(prev, rol_borrado=False, nombre="Supervisores", desc="Quienes pueden aprobar una visita."):
        return ('<div class="w-body">' + k_textos(distintas="completo" if nombre else "") + '<div class="f-cols k4"><div class="f-pila">'
                + k_catalogo(nombre, desc, origen="De los miembros") + f_fuente(rol_borrado) + "</div>" + f_prev(prev) + "</div></div>")
    nomas = '<span class="w-est mal">No se puede usar</span>'
    V = {
        "Sin cambios": (banda_k(tit, ACTIVO, k_acc()), cuerpo("lista")),
        "Cambios sin guardar": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), cuerpo("sucio")),
        "Elegir a quién": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), cuerpo("elegir")),
        "Probando": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), cuerpo("probando")),
        "Ninguna opción": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), cuerpo("ninguna")),
        "Más de 200": (banda_k(tit, ACTIVO_SUCIO, k_acc(True)), cuerpo("mas200")),
        "Rol que ya no existe": (banda_k("Responsables de obra", nomas, k_acc()), cuerpo("lista", True, "Responsables de obra", "Supervisores y jefes de obra.")),
        "Nuevo catálogo": (banda_k("Nuevo catálogo", "De los miembros", k_acc(True, nuevo=True).replace('class="cb cb-pri">', 'class="cb cb-pri" disabled>', 1)),
                           cuerpo("sin_persona", nombre="", desc="")),
        "Guardado": (banda_k(tit, ACTIVO, k_acc()), cuerpo("lista")),
    }
    assert list(V) == ESTADOS_K4
    capas = {"Guardado": A.toast("Catálogo guardado.")}
    t = pagina_k("Catálogo con filtros · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Supervisores",
                 A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                 F.CSS_FICHA + F.CSS_ESTADOS + A.CSS_AB + CSS_K3 + CSS_K4 + ".f-cols.k4 { grid-template-columns: minmax(0, 1fr) 360px; }\n", ESTADOS_K4, A.js_estados(ESTADOS_K4), alto=1000)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_K4.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over)


# ================================================================ Teléfono: una app (barra con título, hojas desde abajo y botones fijos abajo)
CSS_TK = """.ap-fila .l2 .gris { color: var(--t3); }
.k-op { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; }
.k-op.on { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); background: oklch(0.975 0.01 180); }
.k-op .rd { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--borde2); box-sizing: border-box; flex-shrink: 0; margin-top: 2px; background: #fff; }
.k-op.on .rd { border: 6px solid var(--marca); }
.k-op .tx { display: flex; flex-direction: column; gap: 3px; line-height: 1.35; }
.k-op .tx b { font-size: 16px; font-weight: 500; }
.k-op .tx span { font-size: 14px; color: var(--t3); }
.q-row .tx b .cod { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; color: var(--t3); font-weight: 400; margin-left: 6px; }
.q-row.baja .tx b { color: var(--t3); }
.ap-hoja .t-mas { text-decoration: none; }
.k-prev .li { display: flex; flex-direction: column; padding: 11px 14px; border-top: 1px solid var(--borde); font-size: 15px; }
.k-prev .li:first-child { border-top: 0; }
.k-prev .li small { font-size: 13px; color: var(--t3); }
.k-prev .pie { padding: 10px 14px; font-size: 13.5px; color: var(--t3); background: var(--s2); border-top: 1px solid var(--borde); }
.k-prev .vacio2 { padding: 22px 14px; text-align: center; font-size: 15px; color: var(--t2); }
.k-prev .pie.mal { color: oklch(0.5 0.19 25); }
.k-prueba { display: flex; gap: 8px; margin: 0 16px; }
.k-prueba .ap-cmp { flex: 1; }
.k-prueba .cb { height: 48px; align-self: flex-end; border-radius: 12px; }
.ap-dato .v.mal { color: oklch(0.5 0.19 25); }
.q-row .tx .mal { color: oklch(0.5 0.19 25); }
"""


def tel_pagina(cuerpo, estados, capas, titulo, css=""):
    t = F.pagina_tel(None, None, A.con_estados([(e, cuerpo[e]) for e in estados]), css=F.CSS_TFICHA + F.CSS_TPREGUNTA + F.CSS_TFORM + A.CSS_TED + CSS_TK + css)
    i = t.index('<nav class="ap-nav"')
    j = t.index("</nav>", i) + len("</nav>")
    t = t[:i] + t[j:]
    k = t.index('<span class="ap-raya"></span>') + len('<span class="ap-raya"></span>')
    t = t[:k] + "".join(f'<sc-if value="{{{{s{estados.index(e)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for e, h in capas.items()) + t[k:]
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
    t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)};\n" + A.js_estados(estados))
    return re.sub(r"<title>[^<]*</title>", f"<title>{titulo}</title>", t)


def t_bar(titulo, sub, volver="M-FRM-Catalogos.dc.html", derecha=""):
    return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{volver}">{F.TVOLVER}</a>'
            f'<div class="tit"><h1>{titulo}</h1><span class="sub">{sub}</span></div>{derecha}</div>')


ESTADOS_TK1 = ["Todos", "Filtros", "Sin coincidencias", "Cargando", "Vacío", "Error", "Nuevo catálogo"]


def tel_catalogos():
    filas = ""
    for n, desc, origen, sub, ops, usan, clase, estado, motivo, destino in CATS:
        o = f"{origen}, {sub}" if sub else origen
        o += "" if ops == "—" else f" · {ops} opciones"
        i = f'<button type="button" class="ap-i" aria-label="Por qué" title="{motivo}">{F.TINFO}</button>' if motivo else ""
        filas += (f'<a class="ap-fila" href="M-{destino}.dc.html"><div class="tx"><span class="l1">{n}</span><span class="l2">{o}</span>'
                  f'<span class="l3"><span class="w-est {clase}">{estado}</span>{i}</span></div></a>')
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Listado.dc.html">{F.TVOLVER}</a><div class="tit"><h1>Catálogos</h1><span class="sub">Formularios</span></div>'
           f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button></div>')
    fab = f'<a class="ap-fab" aria-label="Nuevo catálogo" href="#">{F.TFAB}</a>'
    def lista(cuerpo):
        return bar + f'<div class="ap-cuerpo">{cuerpo}</div>' + fab
    esq = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div>'
    cuerpo = {"Todos": lista(filas), "Filtros": lista(filas),
              "Sin coincidencias": lista('<div class="ap-vacio">Ningún catálogo coincide con los filtros.<button type="button" class="cb cb-sec">Limpiar filtros</button></div>'),
              "Cargando": lista(esq), "Vacío": lista('<div class="ap-vacio">Todavía no hay catálogos.</div>'),
              "Error": lista('<div class="ap-vacio">No pudimos cargar los catálogos.<button type="button" class="cb cb-sec">Reintentar</button></div>'),
              "Nuevo catálogo": lista(filas)}
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")
    def grupo(tit, ops):
        return f'<div class="p-tit2">{tit}</div>' + "".join(f'<span class="t-opc {"on" if k == 0 else ""}">{n}<span class="d">{c}{tilde if k == 0 else ""}</span></span>' for k, (n, c) in enumerate(ops))
    filtros_h = (grupo("Origen", [("Todos los orígenes", 5), ("Escritas a mano", 3), ("De los miembros", 2)])
                 + grupo("Estado", [("Todos los estados", 5), ("Activo", 3), ("No se puede usar", 1), ("Dado de baja", 1)]))
    nuevo_h = ('<div class="k-op on" role="radio" aria-checked="true"><span class="rd"></span><span class="tx"><b>Escribirlas a mano</b><span>Para listas que mantiene una persona.</span></span></div>'
               '<div class="k-op" role="radio" aria-checked="false"><span class="rd"></span><span class="tx"><b>Tomarlas de los miembros, con filtros</b><span>Se arma sola con los miembros que cumplen los filtros.</span></span></div>')
    capas = {"Filtros": F.thoja("Filtros", filtros_h, '<button type="button" class="cb cb-pri">Ver 5 catálogos</button>').replace('<div class="hb">', '<div class="hb lst">', 1),
             "Nuevo catálogo": F.thoja("Nuevo catálogo", nuevo_h, '<button type="button" class="cb cb-sec">Cancelar</button><a class="cb cb-pri" href="M-FRM-Catalogo.dc.html">Continuar</a>',
                                       sub="De dónde salen las opciones · no se cambia después")}
    t = tel_pagina(cuerpo, ESTADOS_TK1, capas, "Catálogos · teléfono", F.CSS_TFILTRO)
    return t


ESTADOS_TK3 = ["Sin cambios", "Cambios sin guardar", "Acciones de una opción", "Editar una opción", "Agregar una opción", "Código repetido",
               "Textos en inglés", "Así lo ve el empleado", "Dar de baja el catálogo", "Sin opciones"]


def tel_manual():
    OJO = F.OJO
    der = f'<button type="button" class="ap-ib" aria-label="Así lo ve el empleado">{OJO}</button><button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>'
    def seg(ingles=False):
        es, en = ("", "on") if ingles else ("on", "")
        return (f'<div class="ap-gtit">Textos en</div><div class="t-seg" role="radiogroup"><span class="{es}" role="radio">Español · original</span>'
                f'<span class="{en}" role="radio">English · <span class="falta">1 distinta</span></span></div>')
    def campos(ingles=False):
        if ingles:
            return (F.tcampo("Nombre", "Visit reasons", req=True).replace("</div></div>", '</div><span class="ay">En español: Motivos de visita</span></div>', 1)
                    + F.tcampo("Descripción", "Why a customer is visited.", req=True).replace("</div></div>", '</div><span class="ay">En español: Por qué se visita a un cliente.</span></div>', 1))
        return (F.tcampo("Nombre", "Motivos de visita", req=True)
                + f'<div class="ap-cmp"><span class="rt"><span>De dónde salen las opciones</span></span><div class="ct ro">Escritas a mano{CANDADO}</div><span class="ay">No se cambia.</span></div>'
                + F.tcampo("Descripción", "Por qué se visita a un cliente.", req=True))
    def opciones(ingles=False, vacia=False):
        if vacia:
            return '<div class="t-vacia">Todavía no hay opciones.</div>'
        h = ""
        for k, (n, cod, det, en, activa) in enumerate(OPS, 1):
            nombre = (en or f"<i>{n}</i>") if ingles else n
            chip = "" if activa else '<span class="t-chip" style="border-color: var(--borde); background: var(--s2); color: var(--t3);">Dada de baja</span>'
            h += (f'<div class="q-row{"" if activa else " baja"}"><span class="num">{k}</span><span class="tx"><b>{nombre}<span class="cod">{cod}</span>{chip}</b><span>{det}</span></span>'
                  f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>')
        return h
    def cuerpo(sub="Activo", ingles=False, vacia=False, fijo=""):
        cuenta = "0 opciones" if vacia else "4 opciones · 3 activas"
        return (t_bar("Motivos de visita", sub, derecha=der) + '<div class="ap-cuerpo">' + seg(ingles) + '<div class="ap-gtit">El catálogo</div><div class="f-campos">' + campos(ingles) + "</div>"
                + f'<div class="ap-gtit">Opciones · {cuenta}<a href="#">Agregar</a></div><div class="ap-grupo">' + opciones(ingles, vacia) + '</div><div style="height: 20px;"></div></div>' + fijo)
    sucio_fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    S = "Activo · Cambios sin guardar"
    C = {"Sin cambios": cuerpo(), "Cambios sin guardar": cuerpo(S, fijo=sucio_fijo), "Acciones de una opción": cuerpo(), "Editar una opción": cuerpo(S, fijo=sucio_fijo),
         "Agregar una opción": cuerpo(S, fijo=sucio_fijo), "Código repetido": cuerpo(S, fijo=sucio_fijo), "Textos en inglés": cuerpo(ingles=True),
         "Así lo ve el empleado": cuerpo(), "Dar de baja el catálogo": cuerpo(), "Sin opciones": cuerpo(vacia=True)}
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")
    def editar(n="Venta nueva", cod="VEN", det="Primera visita a un cliente", err=False):
        c = F.tcampo("Código", cod, req=True)
        if err:
            c = c.replace('<div class="ct">', '<div class="ct mal">', 1).replace("</div></div>", '</div><span class="t-err" role="alert">Ya hay una opción con ese código.</span></div>', 1)
        else:
            c = c.replace("</div></div>", '</div><span class="ay">No se muestra en WhatsApp.</span></div>', 1)
        texto = F.tcampo("Texto", n or "Texto", req=True, vacio=not n).replace("</div></div>", f'</div><span class="ay" style="align-self: flex-end;">{len(n)} / 30</span></div>', 1)
        return texto + c + F.tcampo("Detalle", det or "Opcional", vacio=not det) + f'<span class="t-chk"><i class="on">{tilde}</i>Activa</span>'
    pie = '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'
    vista = '<div class="ap-grupo k-prev" style="margin: 0;">' + "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, _, d, _, a in OPS if a) + "</div>"
    capas = {
        "Acciones de una opción": F.thoja("Reclamo", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span role="menuitem">Subir</span><span role="menuitem">Bajar</span>'
                                          '<span class="pel" role="menuitem">Dar de baja</span></div>', ""),
        "Editar una opción": F.thoja("Editar opción", editar(), pie),
        "Agregar una opción": F.thoja("Nueva opción", editar("", "", ""), pie),
        "Código repetido": F.thoja("Editar opción", editar("Venta nueva", "SEG", err=True), pie),
        "Así lo ve el empleado": F.thoja("Así lo ve el empleado", vista, "", sub="Motivo · la lista en WhatsApp"),
        "Dar de baja el catálogo": F.thoja("¿Dar de baja el catálogo?", '<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">No se podrá elegir en preguntas nuevas ni mandar los formularios '
                                           'publicados que lo usan. Las respuestas anteriores se conservan.</p>',
                                           '<button type="button" class="cb cb-pel lleno">Dar de baja</button><button type="button" class="cb cb-sec">Cancelar</button>'),
    }
    return tel_pagina(C, ESTADOS_TK3, capas, "Catálogo escrito a mano · teléfono")


ESTADOS_TK4 = ["Sin cambios", "Acciones de una condición", "Editar una condición", "Elegir a quién", "Probando", "Ninguna opción", "Más de 200", "Rol que ya no existe"]


def tel_filtros():
    def cuerpo(prev="lista", rol_borrado=False, banda="", titulo="Supervisores", sub="Activo"):
        conds = [("Si · Rol", "tiene alguno de Supervisor"), ("Y · Activo", "es Sí")]
        if rol_borrado:
            conds[0] = ("Si · Rol", '<span class="mal">Rol no disponible</span>')
        filas = "".join(f'<div class="q-row"><span class="tx"><b>{a}</b><span>{b}</span></span><button type="button" class="ap-ib" aria-label="Acciones de la condición">{F.TKEBAB}</button></div>'
                        for a, b in conds)
        otras = ('<div class="ap-dato"><span class="k">Texto de cada opción</span><span class="v">Nombre</span></div>'
                 '<div class="ap-dato"><span class="k">Detalle</span><span class="v">Empresa</span></div>'
                 '<div class="ap-dato"><span class="k">Orden</span><span class="v">Nombre, A → Z</span></div>'
                 '<div class="ap-dato"><span class="k">Sin incluir a quien lo recibe</span><span class="v">Sí</span></div>')
        if prev == "lista":
            res = "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in MIEMBROS) + '<div class="pie">3 opciones · probado hoy a las 10:42</div>'
        elif prev == "probando":
            res = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span></div>'
        elif prev == "ninguna":
            res = '<div class="vacio2">No hay opciones con estos filtros.</div>'
        else:
            res = "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in MIEMBROS[:2]) + '<div class="pie">214 opciones · probado hoy a las 10:42</div>'
        nombre = titulo
        desc = "Quienes pueden aprobar una visita." if titulo == "Supervisores" else "Supervisores y jefes de obra."
        return (t_bar(titulo, sub) + banda + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">'
                + F.tcampo("Nombre", nombre, req=True) + F.tcampo("Descripción", desc, req=True)
                + f'<div class="ap-cmp"><span class="rt"><span>De dónde salen las opciones</span></span><div class="ct ro">Miembros de la organización{CANDADO}</div></div></div>'
                + f'<div class="ap-gtit">Qué miembros entran<a href="#">Agregar</a></div><div class="ap-grupo">{filas}</div>'
                + f'<div class="ap-gtit">Otras opciones</div><div class="ap-grupo">{otras}</div>'
                + '<div class="ap-gtit">Vista previa</div><div class="k-prueba">' + F.tcampo("Como si lo recibiera", "Tomás Acosta", select=True)
                + '<button type="button" class="cb cb-sec">Probar</button></div>'
                + f'<div class="ap-grupo k-prev" style="margin-top: 10px;">{res}</div><div style="height: 20px;"></div></div>')
    mas200 = f'<div class="t-banda" role="status">{ALERTA}<span class="tx">Más de 200: no se va a poder mandar.<small>Se guarda igual; lo que frena es el envío.</small></span></div>'
    rol = f'<div class="t-banda mal" role="alert">{ALERTA}<span class="tx">Un rol de los filtros ya no existe: el catálogo no se puede usar hasta que elijas otro.</span></div>'
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    S = "Activo · Cambios sin guardar"
    C = {"Sin cambios": cuerpo(), "Acciones de una condición": cuerpo(), "Editar una condición": cuerpo(sub=S) + fijo, "Elegir a quién": cuerpo(sub=S) + fijo,
         "Probando": cuerpo("probando", sub=S) + fijo, "Ninguna opción": cuerpo("ninguna", sub=S) + fijo, "Más de 200": cuerpo("mas200", banda=mas200, sub=S) + fijo,
         "Rol que ya no existe": cuerpo(rol_borrado=True, banda=rol, titulo="Responsables de obra", sub="No se puede usar")}
    pie = '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")
    personas = "".join(f'<span class="t-opc {"on" if k == 0 else ""}">{n}<span class="d">{d}{tilde if k == 0 else ""}</span></span>'
                       for k, (n, d) in enumerate([("Tomás Acosta", "Vendedor"), ("Lucía Fernández", "Dueña"), ("Martín Paz", "Supervisor")]))
    capas = {
        "Acciones de una condición": F.thoja("Si · Rol", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span class="pel" role="menuitem">Quitar</span></div>', ""),
        "Editar una condición": F.thoja("Editar condición", F.tcampo("Columna", "Rol", select=True) + F.tcampo("Comparación", "tiene alguno de", select=True)
                                        + F.tcampo("Valor", "Supervisor", select=True), pie),
        "Elegir a quién": F.thoja("Como si lo recibiera", '<span class="w-bus" style="width: auto;">' + F.BUSCAR + ' Buscar persona</span>' + personas, "").replace('<div class="hb">', '<div class="hb lst">', 1),
    }
    return tel_pagina(C, ESTADOS_TK4, capas, "Catálogo con filtros · teléfono", F.CSS_TFILTRO)


# ---------------------------------------------------------------- canvas.json: los nuevos «· para aprobar»; los reemplazados, al Archivo
E13_APROBADA = True  # el usuario la aprobó el 17/10 («si publica y commitea», versión 129)
TITULOS = {"FRM-Catalogos": "Formularios · Catálogos", "FRM-Catalogo-Nuevo": "Formularios · nuevo catálogo", "FRM-Catalogo": "Formularios · catálogo escrito a mano",
           "FRM-Catalogo-Filtros": "Formularios · catálogo con filtros", "M-FRM-Catalogos": "Catálogos · teléfono", "M-FRM-Catalogo": "Catálogo escrito a mano · teléfono",
           "M-FRM-Catalogo-Filtros": "Catálogo con filtros · teléfono"}
LUGAR = {"FRM-Catalogos": (0, 3820, 1440, 900), "FRM-Catalogo-Nuevo": (1520, 3820, 1440, 900), "FRM-Catalogo": (3040, 3820, 1440, 1200),
         "FRM-Catalogo-Filtros": (4560, 3820, 1440, 1000), "M-FRM-Catalogos": (0, 5140, 390, 844), "M-FRM-Catalogo": (470, 5140, 390, 844),
         "M-FRM-Catalogo-Filtros": (940, 5140, 390, 844)}
REEMPLAZADOS = ["FRM-Catalogo-Opcion", "M-FRM-Catalogo-Opcion"]
COPIAS = list(TITULOS)
# Tableros de la E12 que suman estados de la E13 (K6 la pregunta, K7 al mandar y al responder): esperan el visto bueno de esos estados.
CON_ESTADOS_NUEVOS = ["FRM-Editor", "M-FRM-Editor", "WA-Chats-Formulario", "WA-Chats-Respuesta", "M-WA-Chats-Formulario", "M-WA-Conversacion-Respuesta"]
ENLACES = {"FRM-Catalogo-Opcion": "FRM-Catalogo", "M-FRM-Catalogo-Opcion": "M-FRM-Catalogo"}
MARCA = " · reemplazado (E13, 17/10)"


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    B = c["boards"]
    marca = "" if E13_APROBADA else A.PARA_APROBAR
    for n in COPIAS:
        k = f"{n}-v128.dc.html"
        if k not in B:
            B[k] = {"x": 0, "y": 0, "w": B[f"{n}.dc.html"]["w"], "h": B[f"{n}.dc.html"]["h"], "title": B[f"{n}.dc.html"]["title"] + " · versión 128", "page": "archivo"}
            c["order"].append(k)
    for n in REEMPLAZADOS:
        b = B[f"{n}.dc.html"]
        if not b["title"].endswith(MARCA):
            b["title"] += MARCA
        b["page"] = "archivo"
    escritorio = [n for n in REEMPLAZADOS if not n.startswith("M-")] + [f"{n}-v128" for n in COPIAS if not n.startswith("M-")]
    telefono = [n for n in REEMPLAZADOS if n.startswith("M-")] + [f"{n}-v128" for n in COPIAS if n.startswith("M-")]
    for k, n in enumerate(escritorio):
        B[f"{n}.dc.html"].update({"x": k * 1520, "y": 3320, "page": "archivo"})
    for k, n in enumerate(telefono):
        B[f"{n}.dc.html"].update({"x": k * 470, "y": 4340, "page": "archivo"})
    # La biblioteca baja 300 para dar lugar al catálogo escrito a mano de 1200.
    if B["FRM-Biblioteca.dc.html"]["y"] == 5860:
        for k, b in B.items():
            if b.get("page") == "formularios" and b["y"] >= 5860:
                b["y"] += 300
    for n, (x, y, w, h) in LUGAR.items():
        B[f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n] + marca, "page": "formularios", "is_interactive": True}
    for n in CON_ESTADOS_NUEVOS:
        b = B[f"{n}.dc.html"]
        b["title"] = b["title"].replace(A.PARA_APROBAR, "") + marca
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def reenlazar():
    fuera = set(REEMPLAZADOS)
    cambiados = []
    for f in sorted(PROJ.glob("*.dc.html")):
        if f.name[:-8] in fuera or re.search(r"-v1\d\d$", f.name[:-8]):
            continue
        t = f.read_text(encoding="utf-8")
        t2 = t
        for viejo, nuevo in ENLACES.items():
            t2 = t2.replace(f'href="{viejo}.dc.html"', f'href="{nuevo}.dc.html"')
        if t2 != t:
            f.write_text(t2, encoding="utf-8")
            cambiados.append(f.name)
    return cambiados


if __name__ == "__main__":
    tableros = {"FRM-Catalogos": catalogos(), "FRM-Catalogo-Nuevo": nuevo(), "FRM-Catalogo": manual(), "FRM-Catalogo-Filtros": filtros(),
                "M-FRM-Catalogos": tel_catalogos(), "M-FRM-Catalogo": tel_manual(), "M-FRM-Catalogo-Filtros": tel_filtros()}
    for n in COPIAS:
        assert (PROJ / f"{n}-v128.dc.html").exists(), f"falta la copia {n}-v128 (git show 05fd5444:docs/design/lienzo/{n}.dc.html)"
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    registrar()
    print("tableros", list(tableros))
    print("enlaces", reenlazar())
