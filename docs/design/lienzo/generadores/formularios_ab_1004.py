"""Formularios con la disposición de ArquitecturaBase (pedido de la Guía y decisión del usuario, 2026-10-17).

Copia del lienzo «Formularios por WhatsApp» (https://claude.ai/artifact/HPbmDPLnr8JZ9TxevtTqJJ) y del traspaso
(docs/plans/2026-10-17-formularios-traspaso del back): qué hay en cada zona y en qué orden, qué va en un diálogo o en un
panel, los estados y qué vive en la URL. Las piezas, el criterio y el teléfono como app son los nuestros; donde la
disposición choca con una regla escrita del lienzo, manda la nuestra (anotado en Criterio · Decisiones por pantalla).
Idioma (16/10): solo el idioma original es obligatorio; la traducción es opcional y nunca frena la publicación.

Etapa 12 (F1 de allá): el listado «Diseñar formularios», el editor de una sola pantalla, publicar, mandar desde el chat
y la respuesta. Los tableros nuevos llevan «· para aprobar»; los reemplazados pasan a la página «Archivo».
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402

PROJ = F.PROJ
svg = F.svg
LAPIZ, ARRIBA, ABAJO, QUITAR, ALERTA, OK, X, MAS, KEBAB, CHEV, INFO = F.LAPIZ, F.ARRIBA, F.ABAJO, F.QUITAR, F.ALERTA, F.OK, F.X, F.MAS, F.KEBAB, F.CHEV, F.INFO
VOLVER = svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")
CANDADO = svg('<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 14)
RELOJ = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 16)
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "2.25")
PARA_APROBAR = " · para aprobar"
E12_APROBADA = True  # el usuario la aprobó el 17/10 («si publica y commitea», versión 128)


# ---------------------------------------------------------------- Caparazón: el panel de Formularios dice «Diseñar formularios»
def pagina_ab(nombre, miga, banda, cuerpo, css="", estados=None, js="", seccion="formularios"):
    t = F.pagina(nombre, miga, banda, cuerpo, css_extra=css, estados=estados, js=js, seccion=seccion)
    i = t.index('<aside class="w-panel"')
    j = t.index("</aside>", i)
    panel = t[i:j].replace(f'href="FRM-Listado.dc.html">{F.ICONO} Formularios</a>', f'href="FRM-Listado.dc.html">{LAPIZ} Diseñar formularios</a>')
    return t[:i] + panel + t[j:]


def banda(titulo, estado, acciones, volver=None):
    v = f'<a class="vol" href="{volver}" aria-label="Volver a Diseñar formularios">{VOLVER}</a>' if volver else f'<span class="ic">{F.ICONO}</span>'
    return (f'<div class="w-bnd"><div class="iz">{v}<div><h1>{titulo}</h1><p class="res f-bnd-est">{estado}</p></div></div>'
            f'<div class="ac">{acciones}</div></div>')


def con_estados(variantes):
    """variantes: [(estado, html)] → un sc-if por estado con su bandera s{i}."""
    return "".join(f'<sc-if value="{{{{s{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{h}</sc-if>' for i, (_, h) in enumerate(variantes))


def js_estados(estados, extra=""):
    return ("    const k = " + json.dumps(estados, ensure_ascii=False) + ".indexOf(e);\n    return {\n      si: true, no: false,\n"
            + "".join(f"      s{i}: k === {i},\n" for i in range(len(estados))) + extra + "    };")


def toast(texto, tipo="ok", accion=""):
    ic = OK if tipo == "ok" else ALERTA
    return (f'<div class="f-toast" role="status"><span class="{tipo}">{ic}</span><span>{texto}</span>{accion}'
            f'<button type="button" class="ib" aria-label="Cerrar">{X}</button></div>')


def confirmar(titulo, texto, boton, peligro=True, cancelar="Cancelar"):
    clase = "cb-pel lleno" if peligro else "cb-pri"
    return F.dialogo(titulo, f'<p class="d-tx">{texto}</p>', f'<button type="button" class="cb cb-sec">{cancelar}</button><button type="button" class="cb {clase}">{boton}</button>')


CSS_AB = """.d-tx { grid-column: 1 / -1; margin: 0; font-size: 14px; line-height: 1.5; color: var(--t2); }
.w-dlg .df .cb[disabled] { opacity: 0.55; cursor: default; }
.ac .cb[disabled] { opacity: 0.55; cursor: default; }
.f-toast { position: absolute; z-index: 41; right: 24px; bottom: 24px; }
.ab-sub { font-size: 12.5px; color: var(--t3); }
.ab-chip { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--borde); background: #fff; font-size: 12px; font-weight: 600; color: var(--t2); white-space: nowrap; }
.ab-chip.falta { border-color: oklch(0.85 0.08 85); background: oklch(0.97 0.04 85); color: oklch(0.45 0.1 70); }
.ab-seg { display: inline-flex; border: 1px solid var(--borde2); border-radius: 8px; overflow: hidden; background: #fff; }
.ab-seg > span { padding: 6px 14px; font-size: 13.5px; color: var(--t2); border-left: 1px solid var(--borde2); white-space: nowrap; }
.ab-seg > span:first-child { border-left: 0; }
.ab-seg > span.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.ab-seg .falta { color: oklch(0.5 0.12 70); font-weight: 500; }
"""


# ---------------------------------------------------------------- E12 · A · Diseñar formularios (listado)
FORMS = [
    ("Visita a cliente", 6, "", "Publicado · versión 3", "", "08/10/2026 · Lucía Fernández"),
    ("Entrega de pedido", 5, "", "Publicado · versión 1", "", "02/10/2026 · Tomás Acosta"),
    ("Control de vehículo", 7, "mal", "No se pudo publicar", "La versión 2 publicada sigue activa.", "12/10/2026 · Lucía Fernández"),
    ("Reclamo", 4, "off", "Borrador", "", "14/10/2026 · —"),
]
ESTADOS_LISTADO = ["Todos", "Nuevo formulario: menú", "Filtro abierto", "Publicados", "Borradores", "Sin coincidencias", "Cargando", "Vacío", "Error"]
CSS_LISTADO = """.w-th.ab, .w-tr.ab { grid-template-columns: minmax(200px, 1.5fr) 110px minmax(220px, 1.3fr) 230px; }
.w-tr.ab a { color: var(--t1); text-decoration: none; font-weight: 500; }
.w-tr.ab .est2 { display: flex; flex-direction: column; gap: 2px; }
.w-tr.ab .est2 small { font-size: 12px; color: var(--t3); }
.o-fb { display: flex; align-items: center; gap: 8px; }
.o-fb .w-bus { width: 320px; flex: none; }
.o-fb .tot { margin-left: auto; font-size: 13px; color: var(--t3); }
.w-bnd .ac { position: relative; }
.w-bnd .ac .f-menu { position: absolute; top: calc(100% + 6px); right: 0; left: auto; z-index: 20; min-width: 220px; }
.w-bnd .ac .f-mi { text-decoration: none; }
"""


def fila_form(n, preg, clase, estado, extra, cambio, grupo):
    e = f"<small>{extra}</small>" if extra else ""
    return (f'<sc-if value="{{{{{grupo}}}}}" hint-placeholder-val="{{{{si}}}}"><div class="w-tr ab"><span><a href="FRM-Editor.dc.html">{n}</a></span><span>{preg}</span>'
            f'<span class="est2"><span class="w-est {clase}">{estado}</span>{e}</span><span>{cambio}</span></div></sc-if>')


def listado():
    filas = "".join(fila_form(*f, grupo="verBor" if f[3] == "Borrador" else "verPub") for f in FORMS)
    menu = (f'<sc-if value="{{{{menuNuevo}}}}" hint-placeholder-val="{{{{no}}}}"><div class="f-menu" role="menu" aria-label="Nuevo formulario">'
            f'<a class="f-mi" role="menuitem" href="FRM-Editor.dc.html">{F.ICONO} Desde cero</a>'
            f'<a class="f-mi" role="menuitem" href="FRM-Biblioteca.dc.html">{F.LISTA} Desde una plantilla</a></div></sc-if>')
    acciones = f'<a class="cb cb-pri" href="#" aria-haspopup="menu" aria-expanded="{{{{expNuevo}}}}">{MAS} Nuevo formulario {CHEV}</a>' + menu
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            + F.filtro("Estado", [("t", "Todos los estados", 4), ("p", "Publicados", 3), ("b", "Borradores", 1)], "est")
            + '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></sc-if>'
            '<span class="tot">{{total}}</span></div></sc-if>')
    tabla = ('<div class="w-caja"><div class="w-th ab"><span>Formulario</span><span>Preguntas</span><span>En WhatsApp</span><span>Último cambio</span></div>'
             '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + filas
             + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
             '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
             '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay formularios.</b></div></sc-if>'
             '<sc-if value="{{sinCoincidencias}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ningún formulario coincide con los filtros.</b>'
             '<button type="button" class="cb cb-enl" onClick="{{limpiar}}">Limpiar filtros</button></div></sc-if>'
             '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar los formularios.</b><button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div>')
    js = """    const lista = ['Todos', 'Nuevo formulario: menú', 'Filtro abierto', 'Publicados', 'Borradores'].includes(e);
    const pub = e === 'Publicados', bor = e === 'Borradores', elegido = pub || bor;
    return {
      si: true, no: false,
      menuNuevo: e === 'Nuevo formulario: menú', expNuevo: e === 'Nuevo formulario: menú' ? 'true' : 'false',
      resumen: e === 'Vacío' ? 'Sin formularios' : e === 'Cargando' || e === 'Error' ? '' : '4 formularios · 3 publicados',
      conFiltros: e !== 'Vacío', busqueda: e === 'Sin coincidencias' ? 'inspección' : 'Buscar por nombre', busClase: e === 'Sin coincidencias' ? 'lleno' : '',
      estTexto: pub ? 'Estado: Publicados' : bor ? 'Estado: Borradores' : 'Estado', estClase: elegido ? 'con' : '', estMenu: e === 'Filtro abierto', estAlternar: () => {},
      estOn_t: elegido ? '' : 'on', estOn_p: pub ? 'on' : '', estOn_b: bor ? 'on' : '', estC_t: '4', estC_p: '3', estC_b: '1',
      estElegir_t: () => {}, estElegir_p: () => {}, estElegir_b: () => {},
      hayFiltro: elegido || e === 'Sin coincidencias', limpiar: () => {},
      total: pub ? '3 formularios' : bor ? '1 formulario' : e === 'Sin coincidencias' ? '0 formularios' : '4 formularios',
      conFilas: lista, verPub: !bor, verBor: !pub, rango: pub ? '1–3 de 3' : bor ? '1 de 1' : '1–4 de 4',
      cargando: e === 'Cargando', vacio: e === 'Vacío', sinCoincidencias: e === 'Sin coincidencias', error: e === 'Error',
    };"""
    t = pagina_ab("Diseñar formularios · /org/formularios", "Inicio / Formularios / Diseñar formularios",
                  F.banda("Diseñar formularios", "{{resumen}}", acciones), '<div class="w-body">' + caja + tabla + "</div>",
                  css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + CSS_AB + CSS_LISTADO, estados=("estado", ESTADOS_LISTADO), js=js)
    return t


# ---------------------------------------------------------------- E12 · B–E · El editor del formulario, una sola pantalla
PREGUNTAS = [
    ("Cliente", "Texto corto", True, "Customer"),
    ("Fecha de la visita", "Fecha", False, "Visit date"),
    ("¿Se concretó la venta?", "Sí o no", False, "Was the sale closed?"),
    ("Monto estimado", "Número con decimales", False, "Estimated amount"),
    ("Motivo", "Elegir de una lista · 3 opciones", False, "Reason"),
    ("Observaciones", "Texto largo, hasta 600 caracteres", False, None),
]
OPCIONES = [("Seguimiento", "Follow-up"), ("Venta nueva", None), ("Reclamo", "Complaint")]
CSS_EDITOR = """.w-app { height: 1400px !important; }
.e-txt { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
.e-txt .rt { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.e-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; padding: 16px; }
.e-g2 .w-cmp .ay { font-size: 12.5px; color: var(--t3); display: inline-flex; align-items: center; gap: 4px; }
.e-g2 .w-cmp .ct.ro { background: var(--s2); color: var(--t3); display: flex; justify-content: space-between; align-items: center; }
.e-g2 .w-cmp .ct.mal { border-color: var(--peligro); }
.e-g2 .w-cmp .err2 { font-size: 12.5px; color: var(--peligro); }
.f-cab .der { display: inline-flex; align-items: center; gap: 10px; font-weight: 500; color: var(--t3); }
.q-it .chips { display: inline-flex; gap: 6px; }
.q-it .dato i { font-style: italic; }
.q-ab { background: oklch(0.985 0.004 78); border-bottom: 1px solid var(--borde); }
.q-ab .q-it { border-bottom: 0; }
.q-ed { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; padding: 0 16px 14px 54px; }
.q-ed .ancho { grid-column: 1 / -1; }
.q-ed .w-cmp .ct.sel { display: flex; justify-content: space-between; align-items: center; }
.q-ops { display: flex; flex-direction: column; gap: 8px; }
.q-op { display: flex; align-items: center; gap: 8px; }
.q-op .ct { flex: 1; }
.q-op .ib { width: 32px; height: 32px; border: 1px solid var(--borde); border-radius: 8px; }
.q-chk { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
.q-chk i { width: 16px; height: 16px; border-radius: 4px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.q-pie { display: flex; justify-content: flex-end; }
.q-chk i.no { background: #fff; border: 1.5px solid var(--borde2); box-sizing: border-box; }
.q-ed .ay, .q-op .ay { font-size: 12.5px; color: var(--t3); }
.pv-tit2 { font-size: 12.5px; font-weight: 600; color: var(--t2); }
.pv-sf { font-size: 10.5px; color: oklch(0.55 0.12 70); font-weight: 600; }
.e-vacio { padding: 28px 16px; text-align: center; font-size: 14px; font-weight: 600; color: var(--t1); }
.e-sup { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; border-radius: 10px; font-size: 13.5px; }
.e-sup.alerta { background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.e-sup.mal { background: var(--peligro-t); color: oklch(0.45 0.17 25); border: 1px solid oklch(0.88 0.05 25); }
.e-sup.info { background: var(--marca-t); color: var(--marca-tx); }
.e-sup .fila { display: flex; align-items: center; gap: 10px; }
.e-sup .fila .tx { flex: 1; }
.e-sup .cb { height: 32px; font-size: 13px; align-self: flex-start; }
.e-pasos { display: flex; align-items: flex-start; gap: 10px; }
.e-paso { flex: 1; display: flex; align-items: flex-start; gap: 8px; }
.e-paso .bo { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--borde2); box-sizing: border-box; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; color: #fff; }
.e-paso.hecho .bo { background: var(--marca); border-color: var(--marca); }
.e-paso.ahora .bo { border-color: var(--marca); box-shadow: inset 0 0 0 3px #fff; background: var(--marca); }
.e-paso .tx { display: flex; flex-direction: column; font-size: 13px; color: var(--t1); font-weight: 600; }
.e-paso .tx small { font-weight: 400; color: var(--t3); }
.e-dif { display: grid; grid-template-columns: 200px minmax(0, 1fr) minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; grid-column: 1 / -1; font-size: 13.5px; }
.e-dif > span { padding: 9px 12px; border-top: 1px solid var(--borde); }
.e-dif > span:nth-child(-n+3) { border-top: 0; background: oklch(0.945 0.018 76); font-weight: 600; color: var(--t2); font-size: 12.5px; }
.e-dif .k { font-weight: 500; }
.e-dif .no { background: oklch(0.97 0.04 85); }
.e-dif small { display: block; font-size: 12px; color: var(--t3); }
"""


def caja_textos(ingles=False):
    es, en = ("", "on") if ingles else ("on", "")
    return (f'<div class="w-caja e-txt"><span class="rt">Textos en</span><span class="ab-seg" role="radiogroup">'
            f'<span class="{es}" role="radio">Español · original</span><span class="{en}" role="radio">English · <span class="falta">2 sin traducir</span></span></span>'
            + F.info("El tipo de respuesta, el orden, las opciones y si es obligatoria son los mismos en los dos idiomas. La traducción es opcional: si no está completa, el formulario sale entero en español.")
            + "</div>")


def caja_formulario(nombre="Visita a cliente", boton="Enviar", prefijo="VIS", modo="normal", ingles=False):
    if ingles:
        nombre, boton = "Customer visit", "Send"
        ay_n, ay_b = '<span class="ay">En español: Visita a cliente</span>', '<span class="ay">En español: Enviar</span>'
    else:
        ay_n, ay_b = "", '<span class="ay">Es lo que toca el empleado al terminar.</span>'
    if modo == "fijo" or ingles:
        pref = f'<div class="ct ro">{prefijo}{CANDADO}</div>'
        ayp = ('<span class="ay">Es el mismo en los dos idiomas.</span>' if ingles else
               '<span class="ay">El prefijo quedó fijo al publicar por primera vez.</span>')
    elif modo == "ocupado":
        pref = f'<div class="ct mal">{prefijo}</div><span class="err2" role="alert">Ya hay un formulario con ese prefijo. Elegí otro.</span>'
        ayp = ""
    else:
        pref = f'<div class="ct">{prefijo}</div>'
        ayp = f'<span class="ay">Las respuestas se numeran {prefijo}-000001.' + F.info("Se puede cambiar hasta publicar por primera vez. El ejemplo no reserva nada.") + "</span>"
    return ('<div class="w-caja"><div class="f-cab"><span>El formulario</span></div><div class="e-g2">'
            f'<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">{nombre}</div>{ay_n}</div>'
            f'<div class="w-cmp"><span class="rt">Texto del botón final <span class="req">*</span></span><div class="ct">{boton}</div>{ay_b}</div>'
            f'<div class="w-cmp"><span class="rt">Prefijo de numeración <span class="req">*</span></span>{pref}{ayp}</div>'
            "</div></div>")


def fila_pregunta(k, n, tipo, obligatoria, en, ingles=False, menu=False, solo_ver=False):
    falta = ingles and en is None
    etiqueta = f"<i>{n}</i>" if falta else (en if ingles else n)
    chips = ('<span class="ab-chip falta">Sin traducir</span>' if falta else "") + f'<span class="ab-chip">{"Obligatoria" if obligatoria else "Opcional"}</span>'
    m = ""
    if menu:
        m = (f'<div class="f-menu" role="menu" aria-label="Acciones de {n}"><span class="f-mi" role="menuitem">{LAPIZ} Editar</span>'
             f'<span class="f-mi" role="menuitem">{ARRIBA} Subir</span><span class="f-mi" role="menuitem">{ABAJO} Bajar</span>'
             f'<span class="f-sep" role="separator"></span><span class="f-mi pel" role="menuitem">{QUITAR} Quitar</span></div>')
    acc = (f'<a class="ib" aria-label="Ver pregunta {n}" href="#">{svg("<path d=\"m9 6 6 6-6 6\"/>", 16)}</a>' if solo_ver
           else f'<button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button>')
    return (f'<div class="q-it{" abierta" if menu else ""}"><span class="num">{k}</span><span class="dato"><b>{etiqueta}</b><span>{tipo}</span></span>'
            f'<span class="chips">{chips}</span>{acc}{m}</div>')


def pregunta_abierta(ingles=False):
    """«Motivo» desplegada en el lugar: pregunta, tipo, ayuda, obligatoria y opciones."""
    ops = ""
    for es, en in OPCIONES:
        if ingles:
            v = f'<div class="ct{" ph" if en is None else ""}">{en or "Sin traducir"}</div>'
            extra = f'<span class="ay" style="min-width: 150px;">En español: {es}</span>'
        else:
            v, extra = f'<div class="ct">{es}</div>', ""
        ops += f'<div class="q-op">{v}{extra}<button type="button" class="ib" aria-label="Quitar opción {es}">{X}</button></div>'
    preg = "Reason" if ingles else "Motivo"
    ay_p = '<span class="ay">En español: Motivo</span>' if ingles else ""
    return ('<div class="q-ab">' + fila_pregunta(5, "Motivo", "Elegir de una lista · 3 opciones", False, "Reason", ingles)
            + '<div class="q-ed">'
            f'<div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">{preg}</div>{ay_p}</div>'
            f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span><div class="ct sel">Elegir de una lista{CHEV}</div></div>'
            '<div class="w-cmp ancho"><span class="rt">Opciones</span><div class="q-ops">' + ops
            + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar opción</button></div></div>'
            f'<div class="w-cmp"><span class="rt">Ayuda para el empleado</span><div class="ct ph">Opcional</div></div>'
            '<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk"><i class="no"></i>Obligatoria</span></div>'
            f'<div class="q-pie ancho"><button type="button" class="cb cb-sec">{svg("<path d=\"m6 15 6-6 6 6\"/>", 14, "2")} Listo</button></div>'
            "</div></div>")


CATALOGOS_K6 = [  # E13 · K6: los catálogos que ofrece la pregunta; los que no se pueden usar se ven apagados con su motivo
    ("Clientes", "Escritas a mano · 46 opciones", ""),
    ("Depósitos", "Dado de baja", "off"),
    ("Motivos de visita", "Escritas a mano · 3 opciones", "on"),
    ("Responsables de obra", "No se puede usar: un rol de los filtros ya no existe", "off"),
    ("Supervisores", "De los miembros · según quién lo recibe", ""),
]
CSS_K6 = """.q-cat { position: relative; }
.q-cat .ct.sel.abierto { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); }
.q-catmn { position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 30; background: #fff; border: 1px solid var(--borde); border-radius: 10px;
  box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 4px; display: flex; flex-direction: column; }
.q-catmn > span { display: flex; flex-direction: column; padding: 7px 10px; border-radius: 6px; font-size: 13.5px; line-height: 1.3; }
.q-catmn > span small { font-size: 12px; color: var(--t3); }
.q-catmn > span.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 500; }
.q-catmn > span.off { color: var(--t3); }
.q-catmn > span.off small { color: oklch(0.55 0.15 25); }
.q-catmn .bus { margin: 2px 2px 6px; width: auto; height: 34px; display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 6px; padding: 0 10px; font-size: 13px; }
.q-catmn .vacio { padding: 14px 10px; font-size: 13.5px; color: var(--t2); }
.q-ed .ay a { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.w-body .w-caja:has(.q-catmn) { overflow: visible; }
"""


def pregunta_catalogo(modo="elegido"):
    """K6: «Motivo» como «Elegir de un catálogo», desplegada en el lugar; modo elegido | abierto | sin."""
    if modo == "sin":
        sel = f'<div class="ct sel abierto ph">Elegí un catálogo{CHEV}</div>'
        menu = ('<div class="q-catmn" role="listbox" aria-label="Catálogo"><span class="vacio">Todavía no hay catálogos disponibles.</span>'
                '<a class="cb cb-enl" href="FRM-Catalogos.dc.html" style="align-self: flex-start;">Ir a Catálogos</a></div>')
    else:
        sel = f'<div class="ct sel{" abierto" if modo == "abierto" else ""}">Motivos de visita{CHEV}</div>'
        menu = ""
        if modo == "abierto":
            items = "".join(f'<span class="{c}" role="option"{" aria-disabled=" + chr(34) + "true" + chr(34) if c == "off" else ""}>{n}<small>{d}</small></span>'
                            for n, d, c in CATALOGOS_K6)
            menu = f'<div class="q-catmn" role="listbox" aria-label="Catálogo"><span class="w-bus bus">{F.BUSCAR} Buscar catálogo</span>{items}</div>'
    tipo_fila = "Elegir de un catálogo · Motivos de visita" if modo != "sin" else "Elegir de un catálogo"
    return ('<div class="q-ab">' + fila_pregunta(5, "Motivo", tipo_fila, False, "Reason")
            + '<div class="q-ed">'
            '<div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">Motivo</div></div>'
            f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span><div class="ct sel">Elegir de un catálogo{CHEV}</div></div>'
            f'<div class="w-cmp ancho q-cat"><span class="rt">Catálogo <span class="req">*</span></span>{sel}{menu}'
            '<span class="ay">El empleado ve el texto y el detalle de cada opción. <a href="FRM-Catalogo.dc.html">Ver el catálogo</a></span></div>'
            '<div class="w-cmp"><span class="rt">Ayuda para el empleado</span><div class="ct ph">Opcional</div></div>'
            '<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk"><i class="no"></i>Obligatoria</span></div>'
            f'<div class="q-pie ancho"><button type="button" class="cb cb-sec">{svg("<path d=\"m6 15 6-6 6 6\"/>", 14, "2")} Listo</button></div>'
            "</div></div>")


def caja_preguntas(abierta=True, ingles=False, vacia=False, menu=False, solo_ver=False, catalogo=None):
    if vacia:
        filas = '<div class="e-vacio">Todavía no agregaste preguntas.</div>'
        cuenta = "0 preguntas"
    else:
        filas = ""
        for k, (n, tipo, ob, en) in enumerate(PREGUNTAS, 1):
            if k == 5 and catalogo:
                filas += pregunta_catalogo(catalogo)
            elif k == 5 and abierta:
                filas += pregunta_abierta(ingles)
            else:
                filas += fila_pregunta(k, n, tipo, ob, en, ingles, menu=(menu and k == 4), solo_ver=solo_ver)
        cuenta = "6 preguntas"
    boton = "" if solo_ver else f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button>'
    return f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der">{cuenta}{boton}</span></div>{filas}</div>'


def vista(ingles=False, vacia=False, nombre="Visita a cliente"):
    pv = F.vista_previa()
    pv = re.sub(r'<div class="pv-tit">.*?</div>', '<div class="pv-tit"><span class="pv-tit2">Así lo ve el empleado</span></div>', pv, count=1, flags=re.S)
    if vacia:
        pv = re.sub(r'<div class="pv-hb">.*?</div><div class="pv-pie">', '<div class="pv-hb"></div><div class="pv-pie">', pv, count=1, flags=re.S)
        pv = pv.replace(">Visita a cliente<", f">{nombre}<")
    if ingles:
        for a, b in [("Visita a cliente", "Customer visit"), (">Cliente<", ">Customer<"), ("Fecha de la visita (opcional)", "Visit date (optional)"),
                     ("Elegí una fecha", "Select a date"), ("¿Se concretó la venta? (opcional)", "Was the sale closed? (optional)"), (">Sí<", ">Yes<"),
                     ("Monto estimado (opcional)", "Estimated amount (optional)"), ("Usá punto para los decimales", "Use a period for decimals"),
                     ("Motivo (opcional)", "Reason (optional)"), ("Elegí una opción", "Select an option"),
                     ("Observaciones (opcional)", 'Observaciones (optional) <span class="pv-sf">Sin traducir</span>'), (">Enviar<", ">Send<")]:
            pv = pv.replace(a, b, 1)
    return pv


def cuerpo_editor(sup="", ingles=False, abierta=True, vacia=False, nombre="Visita a cliente", prefijo="VIS", modo="normal", menu=False, solo_ver=False, catalogo=None):
    return ('<div class="w-body">' + sup + caja_textos(ingles) + '<div class="f-cols"><div class="f-pila">'
            + caja_formulario(nombre=nombre, prefijo=prefijo, modo=modo, ingles=ingles)
            + caja_preguntas(abierta=abierta and not vacia, ingles=ingles, vacia=vacia, menu=menu, solo_ver=solo_ver, catalogo=catalogo)
            + "</div>" + vista(ingles=ingles, vacia=vacia, nombre=nombre) + "</div></div>")


def acc_editor(sucio=False, guardando=False, publicado=False, nuevo=False, solo_ver=False):
    if solo_ver:
        return '<a class="cb cb-sec" href="FRM-Publicando.dc.html">Ver vista oficial</a>' if publicado else ""
    d = " disabled" if guardando else ""
    a = f'<button type="button" class="cb cb-sec"{d}>Descartar</button>'
    if nuevo:
        return a + f'<button type="button" class="cb cb-pri"{d}>{"Guardando…" if guardando else "Guardar borrador"}</button>'
    a += f'<button type="button" class="cb cb-sec"{d}>{"Guardando…" if guardando else "Guardar borrador"}</button>'
    a += f'<a class="cb cb-pri" href="FRM-Publicar.dc.html"{d}>Publicar en WhatsApp</a>'
    if publicado:
        a += '<a class="cb cb-sec" href="FRM-Publicando.dc.html">Ver vista oficial</a>'
    return a


EST_BOR = '<span class="w-est off">Borrador</span>'
EST_SUCIO = '<span class="w-est off">Borrador</span><span class="f-sucio">Cambios sin guardar</span>'
EST_PUB = '<span class="w-est">Publicado · versión 3</span>'
EST_PUB_SUCIO = EST_PUB + '<span class="f-sucio">Cambios sin guardar</span>'
ESTADOS_EDITOR = ["Sin cambios", "Nuevo formulario", "Cambios sin guardar", "Guardando", "Guardado", "No se guardó", "Guardado sin confirmar",
                  "Otra persona guardó", "Revisión del borrador", "Textos en inglés", "Prefijo ocupado", "Acciones de una pregunta",
                  "Quitar una pregunta", "Cambiar el tipo", "Elegir de un catálogo", "Elegir el catálogo", "Sin catálogos", "Descartar cambios",
                  "Solo lectura", "Cargando", "No existe"]


def editor():
    vol = "FRM-Listado.dc.html"
    cartel_inc = ('<div class="e-sup alerta" role="status"><div class="fila">' + ALERTA
                  + '<span class="tx">No pudimos confirmar el guardado. Consultá antes de volver a guardar.</span></div>'
                  '<button type="button" class="cb cb-sec">Consultar guardado</button></div>')
    cartel_rev = ('<div class="e-sup alerta" role="status"><div class="fila">' + ALERTA
                  + '<span class="tx">Elegí qué conservar en cada diferencia antes de volver a guardar.</span>'
                  '<button type="button" class="cb cb-sec">Revisar</button></div></div>')
    cargando = ('<div class="w-body"><div class="f-cuerpo izq"><div class="esq"><span style="width: 60%;"></span><span style="width: 80%;"></span>'
                '<span style="width: 70%;"></span><span style="width: 75%;"></span></div></div></div>')
    no_existe = ('<div class="w-body"><div class="w-caja"><div class="f-cuerpo"><b>No encontramos este formulario.</b>'
                 '<button type="button" class="cb cb-sec">Reintentar</button></div></div></div>')
    V = {
        "Sin cambios": (banda("Visita a cliente", EST_PUB, acc_editor(publicado=True), vol), cuerpo_editor(modo="fijo")),
        "Nuevo formulario": (banda("Nuevo formulario", '<span class="f-sucio">Cambios sin guardar</span>', acc_editor(nuevo=True), vol),
                             cuerpo_editor(vacia=True, nombre="Inspección de obra", prefijo="OBR")),
        "Cambios sin guardar": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo")),
        "Guardando": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(guardando=True, publicado=True), vol), cuerpo_editor(modo="fijo")),
        "Guardado": (banda("Visita a cliente", EST_PUB, acc_editor(publicado=True), vol), cuerpo_editor(abierta=False, modo="fijo")),
        "No se guardó": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo")),
        "Guardado sin confirmar": (banda("Visita a cliente", '<span class="w-est pend">Guardado sin confirmar</span>', acc_editor(guardando=True, publicado=True), vol), cuerpo_editor(sup=cartel_inc, modo="fijo")),
        "Otra persona guardó": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo")),
        "Revisión del borrador": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(sup=cartel_rev, modo="fijo")),
        "Textos en inglés": (banda("Visita a cliente", EST_PUB, acc_editor(publicado=True), vol), cuerpo_editor(ingles=True, modo="fijo")),
        "Prefijo ocupado": (banda("Nuevo formulario", '<span class="f-sucio">Cambios sin guardar</span>', acc_editor(nuevo=True), vol),
                            cuerpo_editor(abierta=False, nombre="Registro de visita", prefijo="VIS", modo="ocupado")),
        "Acciones de una pregunta": (banda("Visita a cliente", EST_PUB, acc_editor(publicado=True), vol), cuerpo_editor(abierta=False, menu=True, modo="fijo")),
        "Quitar una pregunta": (banda("Visita a cliente", EST_PUB, acc_editor(publicado=True), vol), cuerpo_editor(abierta=False, modo="fijo")),
        "Cambiar el tipo": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo")),
        "Elegir de un catálogo": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo", catalogo="elegido")),
        "Elegir el catálogo": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo", catalogo="abierto")),
        "Sin catálogos": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo", catalogo="sin")),
        "Descartar cambios": (banda("Visita a cliente", EST_PUB_SUCIO, acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo")),
        "Solo lectura": (banda("Visita a cliente", EST_PUB, acc_editor(publicado=True, solo_ver=True), vol), cuerpo_editor(abierta=False, modo="fijo", solo_ver=True)),
        "Cargando": (banda("Visita a cliente", "", "", vol), cargando),
        "No existe": (banda("Formulario", "", "", vol), no_existe),
    }
    assert list(V) == ESTADOS_EDITOR
    dif = ('<div class="e-dif"><span>Qué cambió</span><span>Guardado actualmente</span><span>Mis cambios</span>'
           '<span class="k">Texto del botón final</span><span>Confirmar visita</span><span>Enviar</span>'
           '<span class="k">Observaciones</span><span>Hasta 300 caracteres</span><span>Hasta 600 caracteres</span>'
           '<span class="k">Monto estimado</span><span>—</span><span>Pregunta nueva</span>'
           '<span class="k no">Motivo · opciones</span><span class="no">Quitó «Reclamo»</span><span class="no">Le cambiaste el texto<small>No se puede conservar: la opción ya no está en lo guardado.</small></span></div>')
    capas = {
        "Guardado": toast("Guardamos el borrador de Visita a cliente."),
        "No se guardó": toast("No pudimos guardar el borrador. Lo escrito se conserva.", "mal"),
        "Otra persona guardó": toast("El formulario cambió mientras lo editabas. Revisá la versión guardada.", "mal", '<button type="button" class="cb cb-sec">Revisar</button>'),
        "Revisión del borrador": F.dialogo("Revisión del borrador", '<p class="d-tx">Laura Ríos guardó este formulario hace 2 minutos, mientras lo editabas.</p>' + dif,
                                           '<span class="ab-sub" style="margin-right: auto;">Ninguna opción guarda: después tocás «Guardar borrador».</span>'
                                           '<button type="button" class="cb cb-sec">Usar borrador actual</button><button type="button" class="cb cb-pri">Conservar mis cambios</button>', una=False)
        .replace('class="w-dlg"', 'class="w-dlg" style="width: 760px;"', 1),
        "Quitar una pregunta": confirmar("¿Quitar la pregunta?", "Dejará de pedirse en el borrador. Las respuestas anteriores se conservan.", "Quitar pregunta"),
        "Cambiar el tipo": confirmar("¿Cambiar el tipo de respuesta?", "Esta será una pregunta nueva. Las respuestas anteriores conservan el tipo original.", "Cambiar tipo", peligro=False),
        "Descartar cambios": confirmar("¿Descartar los cambios?", "Vas a perder lo que cambiaste sin guardar.", "Descartar", cancelar="Seguir editando"),
    }
    return pagina_editor(V, capas, ESTADOS_EDITOR, "Editor del formulario · /org/formularios/:id")


def pagina_editor(V, capas, estados, nombre, css_extra=""):
    """El editor con un estado por variante: V = {estado: (banda, cuerpo)}; capas = {estado: toast o diálogo encima}."""
    assert list(V) == estados, (list(V), estados)
    bandas = con_estados([(k, v[0]) for k, v in V.items()])
    cuerpos = con_estados([(k, v[1]) for k, v in V.items()])
    over = "".join(f'<sc-if value="{{{{s{estados.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = pagina_ab(nombre, "Inicio / Formularios / Diseñar formularios / Visita a cliente", bandas, cuerpos,
                  css=F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + CSS_AB + CSS_EDITOR + CSS_K6 + css_extra, estados=("estado", estados), js=js_estados(estados))
    return F.con_dialogo(t, over, F.CSS_PUBLICAR + F.CSS_GRILLA + CSS_PUB)


# ---------------------------------------------------------------- E12 · P1 · Publicar en WhatsApp: la comprobación y la aceptación
CSS_PUB = """.w-dlg.pub { width: 640px; }
.p-cap { font-size: 12px; font-weight: 600; color: var(--t2); margin: 4px 0 -2px; }
.p-card { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 8px; background: #fff; font-size: 13.5px; }
.p-card svg { flex-shrink: 0; color: var(--t3); margin-top: 2px; }
.p-card .tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.p-card .tx b { font-weight: 600; }
.p-card .tx span { font-size: 12.5px; color: var(--t3); }
.p-pasos { display: flex; flex-direction: column; gap: 10px; }
.p-paso { display: flex; gap: 10px; font-size: 13.5px; }
.p-paso .n { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--borde2); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--t2); flex-shrink: 0; }
.p-paso .tx { display: flex; flex-direction: column; gap: 2px; }
.p-paso .tx span { font-size: 12.5px; color: var(--t3); }
.w-dlg .df .izq { margin-right: auto; font-size: 12.5px; color: var(--t3); }
"""
DOC = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/>', 16)
GLOBO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.6 2.5 14.4 0 17"/><path d="M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>', 16)


def card(icono, titulo, sub=""):
    s = f"<span>{sub}</span>" if sub else ""
    return f'<div class="p-card">{icono}<div class="tx"><b>{titulo}</b>{s}</div></div>'


def pasos():
    p = [("Se manda a WhatsApp", "WhatsApp revisa cada pregunta. Puede tardar unos minutos y podés salir de esta pantalla."),
         ("Te avisamos cuando esté lista", "Recién ahí dice «Publicado» y lo podés mandar desde el chat."),
         ("Si WhatsApp rechaza algo", "Te mostramos qué pregunta corregir. Lo guardado no se pierde.")]
    return '<div class="p-pasos">' + "".join(f'<div class="p-paso"><span class="n">{k}</span><div class="tx"><b>{a}</b><span>{b}</span></div></div>' for k, (a, b) in enumerate(p, 1)) + "</div>"


def dlg_publicar(titulo, cuerpo, pie):
    return F.dialogo(titulo, cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg pub"', 1)


def p_ok(v="4", primera=False, ingles_completo=False):
    if primera:
        incluye = '<span class="p-cap">Qué incluye</span>' + card(DOC, "6 preguntas", "Cliente, Fecha de la visita, ¿Se concretó la venta?, Monto estimado, Motivo y Observaciones")
        fijo = card(TILDE, "Las preguntas de la versión 1", "Ya no se editan. Lo que cambies después se publica como versión 2.") + card(TILDE, "El prefijo VIS", "Las respuestas se numeran VIS-000001, VIS-000002… Queda fijo desde ahora.")
    else:
        incluye = ('<span class="p-cap">Qué cambia respecto de la versión 3</span>' + card(DOC, "Agregada: Observaciones", "Cambiada: Motivo (las opciones)")
                   + card(DOC, "6 preguntas", "Cliente, Fecha de la visita, ¿Se concretó la venta?, Monto estimado, Motivo y Observaciones"))
        fijo = card(TILDE, f"Las preguntas de la versión {v}", f"Ya no se editan. Lo que cambies después se publica como versión {int(v) + 1}.")
    idioma = (card(GLOBO, "En español y en inglés", "Cada empleado lo recibe en el idioma de su cuenta.") if ingles_completo else
              card(GLOBO, "En español", "El inglés tiene 2 textos sin traducir: sale cuando esté completo."))
    return incluye + idioma + '<span class="p-cap">Qué queda fijo</span>' + fijo + '<span class="p-cap">Qué va a pasar</span>' + pasos()


def pie_pub(v="4", activo=True, extra=""):
    d = "" if activo else " disabled"
    return (f'<span class="izq">Se publica el borrador guardado hoy a las 15:20.</span><button type="button" class="cb cb-sec">Cancelar</button>{extra}'
            f'<button type="button" class="cb cb-pri"{d}>Publicar versión {v}</button>')


def aviso(texto, tipo="alerta", icono=None):
    return f'<div class="p-aviso {"mal" if tipo == "mal" else ""}" role="status">{icono or ALERTA}<span>{texto}</span></div>'


ESTADOS_PUBLICAR = ["Versión nueva", "Primera publicación", "Los dos idiomas", "Comprobando", "Primero guardá los cambios", "Una pregunta no se puede mostrar",
                    "La comprobación venció", "Cambió después de comprobar", "Ya se está publicando"]


def publicar():
    vol = "FRM-Listado.dc.html"
    base = (banda("Visita a cliente", EST_PUB, acc_editor(publicado=True), vol), cuerpo_editor(abierta=False, modo="fijo"))
    sucio = (banda("Visita a cliente", EST_PUB + '<span class="f-sucio">Cambios sin guardar</span>', acc_editor(sucio=True, publicado=True), vol), cuerpo_editor(modo="fijo"))
    primera = (banda("Visita a cliente", EST_BOR, acc_editor(), vol), cuerpo_editor(abierta=False))
    V = {e: (primera if e == "Primera publicación" else sucio if e == "Primero guardá los cambios" else base) for e in ESTADOS_PUBLICAR}
    prob = ('<div class="p-prob"><span class="mal">' + ALERTA + '</span><span class="tx"><b>Motivo · opción «Seguimiento comercial con visita programada»</b>'
            '<span>Es demasiado larga para WhatsApp. Acortala.</span></span><a href="FRM-Editor.dc.html">Ir a la pregunta</a></div>')
    capas = {
        "Versión nueva": dlg_publicar("Publicar la versión 4 en WhatsApp", p_ok(), pie_pub()),
        "Primera publicación": dlg_publicar("Publicar la versión 1 en WhatsApp", p_ok("1", primera=True), pie_pub("1")),
        "Los dos idiomas": dlg_publicar("Publicar la versión 4 en WhatsApp", p_ok(ingles_completo=True), pie_pub()),
        "Comprobando": dlg_publicar("Publicar en WhatsApp", '<div class="p-sec"><span class="p-tit">Comprobando el formulario…</span><div class="p-esq">'
                                    '<span style="width: 85%;"></span><span style="width: 60%;"></span></div></div>',
                                    '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri" disabled>Publicar</button>'),
        "Primero guardá los cambios": dlg_publicar("Primero guardá los cambios", '<p class="d-tx">Tenés cambios sin guardar en <b>Visita a cliente</b>. Se publica solo lo guardado: guardá el borrador y después lo comprobamos.</p>',
                                                   '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar borrador</button>'),
        "Una pregunta no se puede mostrar": dlg_publicar("Publicar la versión 4 en WhatsApp", '<span class="p-cap">Antes hay que resolver</span>' + prob, pie_pub(activo=False)),
        "La comprobación venció": dlg_publicar("Publicar la versión 4 en WhatsApp", aviso("La comprobación venció. Volvé a comprobar el formulario antes de publicar.", icono=RELOJ),
                                               '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Comprobar de nuevo</button>'),
        "Cambió después de comprobar": dlg_publicar("Publicar la versión 4 en WhatsApp", aviso("Laura Ríos guardó cambios en este formulario hace un momento. Revisalos antes de publicar."),
                                                    '<button type="button" class="cb cb-sec">Cerrar</button><button type="button" class="cb cb-pri">Revisar cambios</button>'),
        "Ya se está publicando": dlg_publicar("Publicar la versión 4 en WhatsApp", aviso("Tomás Acosta está publicando la versión 4. Cuando termine, vas a poder publicar la 5.", icono=RELOJ),
                                              '<button type="button" class="cb cb-sec">Cerrar</button>'),
    }
    return pagina_editor(V, capas, ESTADOS_PUBLICAR, "Publicar en WhatsApp")


# ---------------------------------------------------------------- E12 · P2 y P3 · Cómo termina una publicación y la vista oficial
ESTADOS_PUBLICANDO = ["Publicando", "Publicado", "WhatsApp rechazó una pregunta", "Sin confirmar", "Necesita revisión", "Vista oficial", "Vista oficial cargando", "Vista oficial vencida"]


def sup_publicando():
    p = [("hecho", "Aceptada", "Hoy, 15:20"), ("hecho", "Enviada a WhatsApp", "15:21"), ("ahora", "WhatsApp la revisa", "Puede tardar unos minutos"), ("", "Lista para mandar", "")]
    pasos_html = "".join(f'<div class="e-paso {c}"><span class="bo">{TILDE if c == "hecho" else ""}</span><span class="tx">{a}<small>{b}</small></span></div>' for c, a, b in p)
    return ('<div class="e-sup info" role="status"><div class="fila">' + RELOJ + '<span class="tx"><b>Estamos publicando la versión 4 en WhatsApp</b></span></div>'
            f'<div class="e-pasos">{pasos_html}</div><span>Mientras tanto, la versión 3 sigue andando. Podés seguir editando: lo que guardes ahora va a la versión 5.</span></div>')


def vista_oficial(modo):
    seg = '<span class="ab-seg" style="align-self: flex-start;"><span>Borrador</span><span class="on">Versión 4 en WhatsApp</span></span>'
    pv = vista()
    pv = pv.replace('<div class="pv-tit"><span class="pv-tit2">Así lo ve el empleado</span></div>', '<div class="pv-tit"><span class="pv-tit2">Así lo ve el empleado</span></div>' + seg, 1)
    if modo == "cargando":
        pv = re.sub(r'<div class="pv-hb">.*?</div><div class="pv-pie">', '<div class="pv-hb"><div class="p-esq"><span style="width: 90%;"></span><span style="width: 70%;"></span><span style="width: 80%;"></span></div></div><div class="pv-pie">', pv, count=1, flags=re.S)
    if modo == "vencida":
        pv = re.sub(r'<div class="pv-hb">.*?</div><div class="pv-pie">', '<div class="pv-hb" style="align-items: center; justify-content: center; text-align: center; gap: 10px;">' + RELOJ
                    + '<span>La vista oficial venció.</span><button type="button" class="cb cb-sec">Cargarla de nuevo</button></div><div class="pv-pie">', pv, count=1, flags=re.S)
    if modo == "vista":
        assert pv.endswith("</div>")
        pv = pv[:-6] + '<a class="cb cb-enl" href="#" style="align-self: center;">Abrir en otra pestaña</a></div>'
    return pv


def publicando():
    vol = "FRM-Listado.dc.html"
    acc_off = acc_editor().replace('<a class="cb cb-pri" href="FRM-Publicar.dc.html">', '<a class="cb cb-pri" href="FRM-Publicar.dc.html" aria-disabled="true" style="opacity: 0.55;">')
    pub_ok = ('<div class="e-sup info" role="status"><div class="fila">' + OK + '<span class="tx">Publicado en WhatsApp: ya lo podés mandar desde el chat. Si cambiás algo, se publica como versión 5.</span></div></div>')
    rechazo = ('<div class="e-sup mal" role="alert"><div class="fila">' + ALERTA + '<span class="tx">WhatsApp rechazó la versión 4. Corregí la pregunta marcada y publicá de nuevo. La versión 3 sigue andando.</span></div>'
               '<div class="p-prob" style="background: #fff;"><span class="mal">' + ALERTA + '</span><span class="tx"><b>6 · Observaciones</b><span>WhatsApp: la ayuda de esta pregunta es más larga de lo que admite.</span></span>'
               '<a href="FRM-Editor.dc.html">Ir a la pregunta</a></div></div>')
    sin_conf = ('<div class="e-sup alerta" role="status"><div class="fila">' + RELOJ + '<span class="tx">No sabemos todavía si WhatsApp recibió la versión 4. La seguimos consultando: no la mandamos de nuevo.</span></div>'
                '<button type="button" class="cb cb-sec">Consultar ahora</button></div>')
    revision = ('<div class="e-sup mal" role="alert"><div class="fila">' + ALERTA + '<span class="tx">No pudimos confirmar qué pasó con la versión 4 en WhatsApp. Antes de publicar otra hay que revisarla. Avisale a quien administra la conexión.</span></div></div>')

    def cuerpo_pub(sup, pv_modo=None):
        c = cuerpo_editor(sup=sup, abierta=False, modo="fijo")
        if pv_modo:
            c = c.replace(vista(), vista_oficial(pv_modo), 1)
        return c
    V = {
        "Publicando": (banda("Visita a cliente", '<span class="w-est pend">Publicando versión 4…</span>', acc_off, vol), cuerpo_pub(sup_publicando())),
        "Publicado": (banda("Visita a cliente", '<span class="w-est">Publicado · versión 4</span>', acc_editor(publicado=True), vol), cuerpo_pub(pub_ok)),
        "WhatsApp rechazó una pregunta": (banda("Visita a cliente", '<span class="w-est mal">No se pudo publicar la versión 4</span>', acc_editor(publicado=True), vol), cuerpo_pub(rechazo)),
        "Sin confirmar": (banda("Visita a cliente", '<span class="w-est pend">Sin confirmar</span>', acc_off, vol), cuerpo_pub(sin_conf)),
        "Necesita revisión": (banda("Visita a cliente", '<span class="w-est mal">Necesita revisión</span>', acc_off, vol), cuerpo_pub(revision)),
        "Vista oficial": (banda("Visita a cliente", '<span class="w-est">Publicado · versión 4</span>', acc_editor(publicado=True), vol), cuerpo_pub("", "vista")),
        "Vista oficial cargando": (banda("Visita a cliente", '<span class="w-est">Publicado · versión 4</span>', acc_editor(publicado=True), vol), cuerpo_pub("", "cargando")),
        "Vista oficial vencida": (banda("Visita a cliente", '<span class="w-est">Publicado · versión 4</span>', acc_editor(publicado=True), vol), cuerpo_pub("", "vencida")),
    }
    capas = {"Publicado": toast("Publicamos la versión 4. Ya la podés mandar desde el chat.")}
    return pagina_editor(V, capas, ESTADOS_PUBLICANDO, "Publicar en WhatsApp · cómo termina")


# ---------------------------------------------------------------- E12 · C1–C5 · Enviar un formulario desde el chat (Internos, número de la organización)
MENSAJE_AB = "Completá este formulario, por favor."
RELOJ14 = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 14)
FORMS_CHAT = [("Visita a cliente", "Versión 3 · 6 preguntas"), ("Entrega de pedido", "Versión 1 · 5 preguntas"), ("Control de vehículo", "Versión 2 · 7 preguntas")]
FORMS_MUCHOS = FORMS_CHAT + [("Inspección de obra", "Versión 1 · 9 preguntas")]
CSS_CHAT_AB = """.w-dlg { width: 620px; }
.w-dlg .db { gap: 14px; }
.c-ops { display: flex; flex-direction: column; gap: 8px; }
.c-op { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 10px; background: #fff; }
.c-op.on { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); background: oklch(0.975 0.01 180); }
.c-op .rd { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--borde2); box-sizing: border-box; flex-shrink: 0; background: #fff; }
.c-op.on .rd { border: 5px solid var(--marca); }
.c-op .tx { display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.c-op .tx b { font-size: 14px; font-weight: 600; }
.c-op .tx small { font-size: 12.5px; color: var(--t3); }
.c-op.baja { border-color: oklch(0.8 0.08 25); background: var(--peligro-t); box-shadow: none; }
.c-op.baja .rd { border-color: oklch(0.55 0.2 25); }
.c-op.baja .tx b { text-decoration: line-through; color: oklch(0.45 0.17 25); }
.c-pag { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--t3); }
.c-pag .pg { display: inline-flex; align-items: center; gap: 10px; color: var(--t2); }
.c-est { display: flex; align-items: center; gap: 12px; padding: 18px 14px; border: 1px dashed var(--borde2); border-radius: 10px; font-size: 13.5px; color: var(--t2); }
.c-est .cb { margin-left: auto; height: 32px; font-size: 13px; }
.c-lin { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--t2); }
.c-lin svg { color: var(--t3); flex-shrink: 0; }
.c-ay { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; color: var(--t3); }
.c-ay.mal { color: var(--peligro); }
.w-dlg .w-cmp .ct.area.largo { overflow: hidden; }
.w-dlg .c-bus { width: auto; }
.c-aviso { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; font-size: 13.5px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.c-aviso svg { flex-shrink: 0; margin-top: 1px; }
.w-m .gl .c-card { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 9px 10px; border-radius: 8px; background: #fff; border: 1px solid oklch(0.86 0.04 170); }
.c-card .ic { color: var(--marca-tx); display: inline-flex; }
.c-card .t { display: flex; flex-direction: column; line-height: 1.3; }
.c-card .t b { font-size: 13.5px; font-weight: 600; }
.c-card .t small { font-size: 12px; color: var(--t3); }
.w-m .pie.amb { color: oklch(0.5 0.12 70); }
.w-m .pie .f-i { display: inline-flex; vertical-align: -3px; margin-left: 4px; }
.w-escr .f-off { display: inline-flex; align-items: center; gap: 4px; }
.w-escr .area.v24 { flex: 1; }
.c-prep { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: 8px; background: var(--s2); }
.f-toast { bottom: 84px; }
.w-m.sal:has(.c-card) { max-width: 60%; }
.w-m.sal .gl:has(.c-card) { max-width: none; }
"""


def b_form(modo, motivo=""):
    if modo == "on":
        return f'<button type="button" class="cb cb-sec">{F.ICONO} Enviar formulario</button>'
    if modo == "off":
        return f'<span class="f-off"><button type="button" class="cb cb-sec" disabled>{F.ICONO} Enviar formulario</button>{F.info(motivo)}</span>'
    return '<button type="button" class="cb cb-sec">Consultar envío</button>'


def escr(form="on", motivo="", area="Escribí un mensaje", aviso=False, enviar=True, cerrada=False):
    nota = f'<button type="button" class="o-nt" aria-label="Nota interna" aria-pressed="false" title="Nota interna">{F.NOTA}</button>'
    a = f'<span class="area v24">{RELOJ14} {area}</span>' if (cerrada or aviso) else f'<span class="area">{area}</span>'
    fin = ('<a class="cb cb-pri" href="WA-Chats-Plantilla.dc.html">Elegir plantilla</a>' if cerrada
           else f'<button type="button" class="cb cb-pri"{"" if enviar else " disabled"}>Enviar</button>')
    return nota + a + b_form(form, motivo) + fin


def burbuja(pie, clase="", extra="", icono=""):
    return (f'<div class="w-m sal"><span class="gl">{MENSAJE_AB}<span class="c-card"><span class="ic">{F.ICONO}</span><span class="t"><b>Visita a cliente</b>'
            f'<small>Formulario · versión 3 · botón «Abrir formulario»</small></span></span></span><span class="pie {clase}">{icono}{pie}{extra}</span></div>')


def cards(lista, sel=0, baja=False):
    h = ""
    for k, (n, d) in enumerate(lista):
        c = " baja" if (baja and k == sel) else " on" if k == sel else ""
        h += f'<div class="c-op{c}" role="radio" aria-checked="{"true" if k == sel else "false"}"><span class="rd"></span><span class="tx"><b>{n}</b><small>{d}</small></span></div>'
    return f'<div class="c-ops" role="radiogroup" aria-label="Formulario">{h}</div>'


def dlg_enviar(lista="pocos", sel=0, mensaje=MENSAJE_AB, err="", aviso="", prob="", pie="normal", buscar=None, hasta=True):
    bus = "" if buscar is None else f'<span class="w-bus c-bus{" lleno" if buscar else ""}">{F.BUSCAR} {buscar or "Buscar por nombre"}</span>'
    if lista == "pocos":
        cuerpo_lista = cards(FORMS_CHAT, sel)
    elif lista == "muchos":
        cuerpo_lista = (cards(FORMS_MUCHOS, sel) + f'<div class="c-pag"><span>1–4 de 9 formularios</span><span class="pg">{svg("<path d=\"m15 6-6 6 6 6\"/>", 14)} Página 1 de 3 '
                        f'{svg("<path d=\"m9 6 6 6-6 6\"/>", 14)}</span></div>')
    elif lista == "baja":
        cuerpo_lista = cards(FORMS_CHAT, 0, baja=True)
    elif lista == "cargando":
        cuerpo_lista = '<div class="c-est">Cargando formularios…</div>'
    elif lista == "error":
        cuerpo_lista = '<div class="c-est"><span>La lista no está disponible.</span><button type="button" class="cb cb-sec">Reintentar</button></div>'
    else:
        cuerpo_lista = '<div class="c-est">No hay formularios con ese nombre.</div>'
    largo = len(mensaje)
    if err == "vacio":
        ct, ay = '<div class="ct area mal ph">Escribí el mensaje…</div>', '<span class="c-ay mal"><span role="alert">Escribí el mensaje que acompaña al formulario.</span><span>0 / 1024</span></span>'
    elif err == "largo":
        ct, ay = (f'<div class="ct area mal largo">{mensaje}</div>', '<span class="c-ay mal"><span role="alert">Puede tener hasta 1024 caracteres.</span><span>1031 / 1024</span></span>')
    else:
        ct, ay = f'<div class="ct area">{mensaje}</div>', f'<span class="c-ay"><span>Es lo que lee arriba del botón «Abrir formulario».</span><span>{largo} / 1024</span></span>'
    cuerpo = (bus + f'<div class="w-cmp"><span class="rt">Formulario <span class="req">*</span></span>{cuerpo_lista}</div>'
              + f'<span class="c-lin">{GLOBO} Le llega en español, el idioma de su cuenta.</span>' + prob
              + f'<div class="w-cmp"><span class="rt">Mensaje que lo acompaña <span class="req">*</span></span>{ct}{ay}</div>'
              + (f'<span class="c-lin">{RELOJ14} Se puede mandar hasta mañana a las 10:48.</span>' if hasta else '') + aviso)
    if pie == "enviando":
        p = '<button type="button" class="cb cb-sec" disabled>Cancelar</button><button type="button" class="cb cb-pri" disabled>Enviando…</button>'
    else:
        p = f'<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri"{" disabled" if pie == "off" else ""}>Enviar formulario</button>'
    return F.dialogo("Enviar un formulario a Tomás Acosta", cuerpo, p)


def c_aviso(texto, icono=None):
    return f'<div class="c-aviso" role="status">{icono or ALERTA}<span>{texto}</span></div>'


def prob_catalogo(texto):
    """K7: un aviso por pregunta de catálogo; quien manda ve cantidades y problemas, nunca las opciones."""
    return f'<div class="p-prob"><span class="mal">{ALERTA}</span><span class="tx"><span>{texto}</span></span></div>'


def prep_catalogo(modo="listo"):
    if modo == "preparando":
        return f'<div class="c-est">{RELOJ14} Preparando las opciones para esta persona…</div>'
    return ('<div class="c-prep"><span class="c-lin">' + F.LISTA + ' Motivo: 3 opciones</span>'
            '<span class="c-lin">' + F.LISTA + ' Supervisor a cargo: 7 opciones</span></div>')


def pagina_chat(estados, esc, msgs, capas, vista_previa, hora, titulo):
    """Un chat de Internos con una variante por estado: composición, mensajes de más y capas encima."""
    over = "".join(f'<sc-if value="{{{{s{estados.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    escritura = '<div class="w-escr">' + con_estados([(e, esc[e]) for e in estados]) + "</div>"
    extra = con_estados([(e, msgs.get(e, "")) for e in estados])
    t = F.chat_internos(escritura, over, mensajes_extra=extra, css=F.CSS_ESTADOS + F.CSS_ENVIO + F.CSS_OFERTA + CSS_AB + CSS_CHAT_AB + CSS_RESP_AB)
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    extra_js = (f"      vistaPrevia: {json.dumps(vista_previa, ensure_ascii=False)}[e] ?? '',\n"
                f"      hora: {json.dumps(hora, ensure_ascii=False)}[e] ?? '10:50',\n")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)};\n" + js_estados(estados, extra_js))
    # El marco de la E11 de hoy: teléfono en formato nacional y la bandeja como opción única.
    for a, b in [("+54 9 11 5555-4521", "011 15-5555-4521"), ('role="tablist" aria-label="Bandeja"', 'role="radiogroup" aria-label="Bandeja"'),
                 ('role="tab" aria-selected="false"', 'role="radio" aria-checked="false"'), ('role="tab" aria-selected="true"', 'role="radio" aria-checked="true"')]:
        t = t.replace(a, b)
    return re.sub(r"<title>[^<]*</title>", f"<title>{titulo}</title>", t)


ESTADOS_CHAT_AB = ["Con el botón", "Elegir el formulario", "Muchos formularios", "Sin coincidencias", "Cargando formularios", "La lista no carga",
                   "Falta el mensaje", "Mensaje muy largo", "Enviando", "En cola", "Leído", "No se pudo mandar", "No se sabe si se guardó",
                   "Envío sin confirmar", "Confirmar la revisión", "Se cerró la ventana", "El formulario ya no está", "Ventana cerrada",
                   "Cuenta inactiva", "Sin formularios para Tomás", "Con catálogos", "Preparando las opciones", "Más de 200 opciones", "Ninguna opción",
                   "Catálogo que no se puede usar"]


def chat_enviar():
    E = ESTADOS_CHAT_AB
    esc = {e: escr() for e in E}
    esc["Envío sin confirmar"] = esc["Confirmar la revisión"] = escr("off", "Hay un envío sin confirmar en esta conversación.", "Hay un envío sin confirmar", aviso=True, enviar=False)
    esc["En cola"] = escr("off", "Hay un envío pendiente en esta conversación.", enviar=False)
    esc["No se sabe si se guardó"] = escr("consultar", enviar=False)
    esc["Ventana cerrada"] = escr("off", "Pasaron 24 horas desde su último mensaje.", "Pasaron 24 horas", cerrada=True)
    esc["Cuenta inactiva"] = escr("off", "La cuenta de Tomás está inactiva: no puede completar formularios.")
    esc["Sin formularios para Tomás"] = escr("off", "Tomás no tiene formularios publicados que pueda completar.")
    revisar = F.info("Puede que haya salido. No lo mandamos de nuevo solo.") + '<span class="lnk2">Ya lo revisé</span>'
    msgs = {
        "En cola": burbuja("En cola · 10:51", icono=f'<span class="rel">{RELOJ14}</span>'),
        "Leído": burbuja("Lucía Fernández · 10:51 · Leído"),
        "No se pudo mandar": burbuja("No se pudo mandar", "mal", F.info("El formulario no le llegó. Podés mandarlo de nuevo con «Enviar formulario».")),
        "Envío sin confirmar": burbuja("Lucía Fernández · 10:51 · Envío sin confirmar", "amb", revisar),
        "Confirmar la revisión": burbuja("Lucía Fernández · 10:51 · Envío sin confirmar", "amb", revisar),
    }
    ventana = c_aviso("Pasaron 24 horas desde su último mensaje.", RELOJ14)
    capas = {
        "Elegir el formulario": dlg_enviar(),
        "Muchos formularios": dlg_enviar("muchos", buscar=""),
        "Sin coincidencias": dlg_enviar("vacia", buscar="Inspección de planta", pie="off"),
        "Cargando formularios": dlg_enviar("cargando", pie="off"),
        "La lista no carga": dlg_enviar("error", pie="off"),
        "Falta el mensaje": dlg_enviar(err="vacio"),
        "Mensaje muy largo": dlg_enviar(err="largo", mensaje="Tomás, te paso el formulario de la visita. Acordate de anotar todo lo que revisaste en el local, si quedaron pedidos pendientes, qué productos faltaban en la góndola y cuándo conviene volver a pasar…"),
        "Enviando": dlg_enviar(pie="enviando"),
        "No se sabe si se guardó": toast("No pudimos confirmar si el pedido quedó guardado. Revisá su estado antes de repetirlo.", "mal", '<button type="button" class="cb cb-sec">Consultar envío</button>'),
        "Confirmar la revisión": confirmar("¿Ya revisaste el envío?", "Vuelve a habilitar el chat. No manda el formulario de nuevo ni lo marca como entregado.", "Confirmar que revisé", peligro=False),
        "Se cerró la ventana": dlg_enviar(aviso=ventana, pie="off", hasta=False),
        "El formulario ya no está": dlg_enviar("baja", aviso=c_aviso("Visita a cliente ya no está disponible para Tomás. Elegí otro."), pie="off"),
        "Con catálogos": dlg_enviar(prob=prep_catalogo()),
        "Preparando las opciones": dlg_enviar(prob=prep_catalogo("preparando"), pie="off"),
        "Más de 200 opciones": dlg_enviar(prob=prob_catalogo("Supervisor a cargo: supera las 200 opciones que admite WhatsApp. Ajustá el catálogo antes de mandar."), pie="off"),
        "Ninguna opción": dlg_enviar(prob=prob_catalogo("Supervisor a cargo: no tiene opciones y la pregunta es obligatoria."), pie="off"),
        "Catálogo que no se puede usar": dlg_enviar(prob=prob_catalogo("Supervisor a cargo: el catálogo no se puede usar. Avisale a quien lo administra."), pie="off"),
    }
    enviado = {"En cola": "Vos: Formulario · Visita a cliente", "Leído": "Vos: Formulario · Visita a cliente", "No se pudo mandar": "No se pudo mandar un formulario",
               "Envío sin confirmar": "Vos: Formulario · Visita a cliente", "Confirmar la revisión": "Vos: Formulario · Visita a cliente"}
    vp = {e: enviado.get(e, "Vos: Genial, Tomás. Te mando el formulario de la visita.") for e in E}
    hora = {e: "10:51" for e in enviado}
    return pagina_chat(E, esc, msgs, capas, vp, hora, "WhatsApp · Internos · enviar un formulario")


# ---------------------------------------------------------------- E12 · R1–R3 · La respuesta llega al chat
VALORES_AB = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "No"),
              ("Monto estimado", "0"), ("Motivo", "Seguimiento"), ("Observaciones", None)]
CSS_RESP_AB = """.w-msjs { justify-content: flex-end; }
.w-m.ent:has(.r-gl) { width: 86%; max-width: 86%; }
.r-cab b, .r-cab small { white-space: nowrap; }
.w-m.ent .gl.r-gl { max-width: none; }
.w-m.ent .gl.r-gl { width: 100%; box-sizing: border-box; padding: 0; overflow: hidden; background: #fff; border: 1px solid var(--borde); }
.r-cab { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: oklch(0.975 0.006 78); }
.r-cab svg { color: var(--t2); flex-shrink: 0; }
.r-cab b { font-size: 14px; font-weight: 600; }
.r-cab small { font-size: 12.5px; color: var(--t3); }
.r-cab .ab-chip { margin-left: auto; }
.r-gr { display: grid; grid-template-columns: 180px minmax(0, 1fr); font-size: 13.5px; border-top: 1px solid var(--borde); }
.r-gr > span { padding: 8px 12px; border-top: 1px solid var(--borde); }
.r-gr > span:nth-child(-n+2) { border-top: 0; }
.r-gr .k { color: var(--t2); }
.r-gr .v small { display: block; font-size: 12px; color: var(--t3); }
.r-gr .vac { font-style: italic; color: var(--t3); }
.r-mas { padding: 8px 12px; border-top: 1px solid var(--borde); }
.r-mas .cb { height: 32px; font-size: 13px; }
.r-ok { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-top: 1px solid var(--borde); background: oklch(0.97 0.03 155); color: oklch(0.4 0.1 155); font-size: 13px; }
.r-ok b { font-weight: 700; }
.r-st { display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-size: 13px; color: var(--t2); border-top: 1px solid var(--borde); }
.r-st.mal { background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.r-st svg { flex-shrink: 0; }
.r-st .cb { margin-left: auto; height: 30px; font-size: 13px; flex-shrink: 0; }
"""


def tarjeta(cuerpo, titulo="Visita a cliente", sub="Respuesta del formulario", chip=""):
    return (f'<div class="w-m ent"><span class="gl r-gl"><span class="r-cab">{F.ICONO}<b>{titulo}</b><small>{sub}</small>{chip}</span>{cuerpo}</span>'
            '<span class="pie">11:04</span></div>')


def grilla_r(filas):
    h = ""
    for k, v in filas:
        val = '<span class="v vac">Sin respuesta</span>' if v is None else f'<span class="v">{v}</span>'
        h += f'<span class="k">{k}</span>{val}'
    return f'<div class="r-gr">{h}</div>'


def r_ok(num="VIS-000123"):
    return f'<div class="r-ok">{TILDE} Guardada como <b>{num}</b></div>'


def r_st(texto, icono=None, clase="", boton=""):
    return f'<div class="r-st {clase}">{icono or INFO}<span>{texto}</span>{boton}</div>'


ESTADOS_RESP_AB = ["Guardada", "Guardada, todas", "Guardando", "No se pudo guardar", "No reconocida", "Sin permiso para ver", "Respondió en inglés",
                   "El mensaje ya no está", "Con un valor de catálogo", "Opción dada de baja", "Venció sin respuesta"]


def chat_respuesta():
    E = ESTADOS_RESP_AB
    mas = lambda t: f'<div class="r-mas"><button type="button" class="cb cb-sec">{t}</button></div>'
    sup = ("Supervisor a cargo", 'Martín Paz<small>Supervisores · Delta S.A.</small>')
    con_cat = [(k, 'Seguimiento<small>Motivos de visita · SEG</small>' if k == "Motivo" else v) for k, v in VALORES_AB] + [sup]
    env = burbuja("Lucía Fernández · 10:51 · Leído")
    msgs = {
        "Guardada": env + tarjeta(grilla_r(VALORES_AB[:3]) + mas("Ver las 6 respuestas") + r_ok()),
        "Guardada, todas": env + tarjeta(grilla_r(VALORES_AB) + mas("Mostrar menos") + r_ok()),
        "Guardando": env + tarjeta(r_st("Llegó una respuesta de formulario. La estamos guardando…", RELOJ14)),
        "No se pudo guardar": env + tarjeta(r_st("No pudimos guardar la respuesta del formulario. Podés escribirle o mandárselo de nuevo.", ALERTA, "mal")),
        "No reconocida": tarjeta(r_st("Llegó una respuesta de formulario que no pudimos relacionar con un envío. No se guardó."), titulo="Formulario"),
        "Sin permiso para ver": env + tarjeta(r_st("No tenés permiso para ver las respuestas de este formulario.", CANDADO) + r_ok()),
        "Respondió en inglés": env + tarjeta(grilla_r([("Cliente", "Ferretería Rosales"), ("Observaciones", "All good, the client signed.")]) + r_ok("VIS-000124"),
                                             chip='<span class="ab-chip">Respondió en inglés</span>'),
        "El mensaje ya no está": env + tarjeta(grilla_r(VALORES_AB[:2]) + r_ok() + r_st("El mensaje de WhatsApp ya no está disponible. La respuesta sigue guardada.")),
        "Con un valor de catálogo": env + tarjeta(grilla_r(con_cat) + mas("Mostrar menos") + r_ok("VIS-000125")),
        "Opción dada de baja": env + tarjeta(r_st("Motivo: una opción se dio de baja. No se guardó la respuesta.", ALERTA, "mal",
                                                  '<button type="button" class="cb cb-sec">Mandar de nuevo</button>')),
        "Venció sin respuesta": burbuja("Lucía Fernández · 10:51 · Venció sin respuesta", "amb"),
    }
    esc = {e: escr() for e in E}
    vp = {e: "Respondió Visita a cliente" for e in E}
    vp.update({"Guardando": "Envió un formulario · guardando", "No se pudo guardar": "No pudimos guardar un formulario", "Opción dada de baja": "No pudimos guardar un formulario",
               "No reconocida": "Llegó un formulario que no se guardó", "Venció sin respuesta": "Vos: Formulario · Visita a cliente"})
    hora = {e: ("10:51" if e == "Venció sin respuesta" else "11:04") for e in E}
    return pagina_chat(E, esc, msgs, {}, vp, hora, "WhatsApp · Internos · respuesta del formulario")


# ================================================================ Teléfono (es una app: barra con título, hojas desde abajo, botones fijos abajo)
T_TITULOS_LISTADO = {"VEH": "7 preguntas", "ENT": "5 preguntas", "REC": "4 preguntas", "VIS": "6 preguntas"}


def tel_listado_ab():
    """M-FRM-Listado: «Diseñar formularios», con las columnas de la compu (preguntas y estado en WhatsApp); la fila abre el editor."""
    ruta = PROJ / "M-FRM-Listado.dc.html"
    t = ruta.read_text(encoding="utf-8")
    t = t.replace("<h1>Formularios</h1>", "<h1>Diseñar formularios</h1>", 1)
    for pre, n in T_TITULOS_LISTADO.items():
        t = t.replace(f'<span class="l2">{pre}</span>', f'<span class="l2">{n}</span>')
    t = re.sub(r'<button type="button" class="ap-ib" aria-label="Acciones de [^"]*">.*?</button></a>', "</a>", t, flags=re.S)
    t = t.replace('href="M-FRM-Ficha.dc.html"', 'href="M-FRM-Editor.dc.html"')
    t = re.sub(r"(Publicado) · v(\d)", r"\1 · versión \2", t)
    t = re.sub(r"<title>[^<]*</title>", "<title>Diseñar formularios · teléfono</title>", t)
    assert "Diseñar formularios" in t and "M-FRM-Ficha" not in t
    return t


CSS_TED = """.t-seg { display: flex; margin: 0 16px; border: 1px solid var(--borde2); border-radius: 10px; overflow: hidden; background: #fff; flex-shrink: 0; }
.t-seg > span { flex: 1; text-align: center; padding: 10px 6px; font-size: 14px; color: var(--t2); border-left: 1px solid var(--borde2); }
.t-seg > span:first-child { border-left: 0; }
.t-seg > span.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.t-seg .falta { color: oklch(0.5 0.12 70); }
.t-chip { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-left: 6px; vertical-align: 1px;
  border: 1px solid oklch(0.85 0.08 85); background: oklch(0.97 0.04 85); color: oklch(0.45 0.1 70); }
.t-chip.mal { border-color: oklch(0.85 0.06 25); background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.ap-cmp .ay { font-size: 13px; color: var(--t3); }
.ap-cmp .ct.ro { display: flex; justify-content: space-between; align-items: center; }
.t-banda.ok { background: var(--marca-t); color: var(--marca-tx); }
.t-banda.info { background: var(--marca-t); color: var(--marca-tx); }
.t-banda small { display: block; font-size: 13px; opacity: 0.85; margin-top: 2px; }
.q-row.mal { background: oklch(0.985 0.012 25); }
.t-vp { display: flex; flex-direction: column; gap: 12px; }
.t-vp .ct { min-height: 44px; }
.t-vp .ct.area { min-height: 76px; }
.ap-hoja .hb { display: flex; flex-direction: column; gap: 14px; }
.ap-hoja .p-tit2 { margin: 2px 0 -6px; }
.t-lin { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: var(--t2); line-height: 1.4; }
.t-lin svg { flex-shrink: 0; margin-top: 2px; color: var(--t3); }
.ap-hoja .h-sub { display: block; font-size: 13.5px; color: var(--t3); margin-top: 2px; }
"""
T_PREG = [("Cliente", "Texto corto · Obligatoria", "Customer"), ("Fecha de la visita", "Fecha · Opcional", "Visit date"), ("¿Se concretó la venta?", "Sí o no · Opcional", "Was the sale closed?"),
          ("Monto estimado", "Número con decimales · Opcional", "Estimated amount"), ("Motivo", "Elegir de una lista · 3 opciones", "Reason"), ("Observaciones", "Texto largo · Opcional", None)]


def t_preguntas(ingles=False, vacia=False, mal=None):
    if vacia:
        return '<div class="t-vacia">Todavía no agregaste preguntas.</div>'
    h = ""
    for k, (n, d, en) in enumerate(T_PREG, 1):
        chip = ""
        if ingles and en is None:
            chip = '<span class="t-chip">Sin traducir</span>'
        if mal == k:
            chip = '<span class="t-chip mal">Corregir</span>'
        nombre = (en or f"<i>{n}</i>") if ingles else n
        h += (f'<div class="q-row{" mal" if mal == k else ""}"><span class="num">{k}</span><span class="tx"><b>{nombre}{chip}</b><span>{d}</span></span>'
              f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>')
    return h


def t_cuerpo_editor(ingles=False, vacia=False, fijo=True, banda_html="", mal=None, nombre="Visita a cliente", prefijo="VIS"):
    es, en = ("", "on") if ingles else ("on", "")
    seg = (f'<div class="ap-gtit">Textos en</div><div class="t-seg" role="radiogroup"><span class="{es}" role="radio">Español · original</span>'
           f'<span class="{en}" role="radio">English' + ("" if vacia else ' · <span class="falta">2 sin traducir</span>') + '</span></div>')
    if ingles:
        campos = (F.tcampo("Nombre", "Customer visit", req=True, extra="").replace("</div></div>", '</div><span class="ay">En español: Visita a cliente</span></div>', 1)
                  + F.tcampo("Texto del botón final", "Send", req=True).replace("</div></div>", '</div><span class="ay">En español: Enviar</span></div>', 1))
    else:
        boton = F.tcampo("Texto del botón final", "Enviar" if not vacia else "Enviar", req=True)
        campos = F.tcampo("Nombre", nombre, req=True) + boton
    if fijo:
        campos += (f'<div class="ap-cmp"><span class="rt"><span>Prefijo de numeración <span class="rq">*</span></span></span><div class="ct ro">{prefijo}{CANDADO}</div>'
                   '<span class="ay">Quedó fijo al publicar por primera vez.</span></div>')
    else:
        campos += (f'<div class="ap-cmp"><span class="rt"><span>Prefijo de numeración <span class="rq">*</span></span></span><div class="ct">{prefijo}</div>'
                   f'<span class="ay">Las respuestas se numeran {prefijo}-000001.</span></div>')
    cant = "0 preguntas" if vacia else "6 preguntas"
    return (banda_html + '<div class="ap-cuerpo">' + seg + '<div class="ap-gtit">El formulario</div><div class="f-campos">' + campos + "</div>"
            + f'<div class="ap-gtit">Preguntas · {cant}<a href="#">Agregar</a></div><div class="ap-grupo">' + t_preguntas(ingles, vacia, mal) + "</div>"
            + '<div style="height: 20px;"></div></div>')


def t_fijo(modo):
    if modo == "sucio":
        return '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar borrador</button></div>'
    if modo == "guardando":
        return '<div class="ap-fijo"><button type="button" class="cb cb-sec full" disabled>Descartar</button><button type="button" class="cb cb-pri full" disabled>Guardando…</button></div>'
    if modo == "off":
        return '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Publicar en WhatsApp</button></div>'
    return '<div class="ap-fijo"><a class="cb cb-pri full" href="#">Publicar en WhatsApp</a></div>'


ESTADOS_TED = ["Sin cambios", "Cambios sin guardar", "Guardando", "Textos en inglés", "Acciones de una pregunta", "Editar una pregunta", "Pregunta con catálogo", "Así lo ve el empleado",
               "Publicar", "Publicando", "Publicado", "WhatsApp rechazó una pregunta", "Nuevo formulario"]


def tel_editor():
    E = ESTADOS_TED
    def bar(titulo, sub):
        return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Listado.dc.html">{F.TVOLVER}</a>'
                f'<div class="tit"><h1>{titulo}</h1><span class="sub">{sub}</span></div><button type="button" class="ap-ib" aria-label="Así lo ve el empleado">{F.OJO}</button></div>')
    pub = "Publicado · versión 3"
    sucio = "Publicado · versión 3 · Cambios sin guardar"
    publicando = (f'<div class="t-banda info" role="status">{RELOJ}<span class="tx">Publicando la versión 4: WhatsApp la revisa.<small>La versión 3 sigue andando.</small></span></div>')
    publicado = f'<div class="t-banda ok" role="status">{OK}<span class="tx">Publicado en WhatsApp: ya lo podés mandar desde el chat.</span></div>'
    rechazo = (f'<div class="t-banda mal" role="alert">{ALERTA}<span class="tx">WhatsApp rechazó la versión 4: la ayuda de «Observaciones» es demasiado larga.'
               '<small>La versión 3 sigue andando.</small></span></div>')
    V = {
        "Sin cambios": (bar("Visita a cliente", pub), t_cuerpo_editor(), t_fijo("limpio")),
        "Cambios sin guardar": (bar("Visita a cliente", sucio), t_cuerpo_editor(), t_fijo("sucio")),
        "Guardando": (bar("Visita a cliente", sucio), t_cuerpo_editor(), t_fijo("guardando")),
        "Textos en inglés": (bar("Visita a cliente", pub), t_cuerpo_editor(ingles=True), t_fijo("limpio")),
        "Acciones de una pregunta": (bar("Visita a cliente", pub), t_cuerpo_editor(), t_fijo("limpio")),
        "Editar una pregunta": (bar("Visita a cliente", sucio), t_cuerpo_editor(), t_fijo("sucio")),
        "Pregunta con catálogo": (bar("Visita a cliente", sucio), t_cuerpo_editor(), t_fijo("sucio")),
        "Así lo ve el empleado": (bar("Visita a cliente", pub), t_cuerpo_editor(), t_fijo("limpio")),
        "Publicar": (bar("Visita a cliente", pub), t_cuerpo_editor(), t_fijo("limpio")),
        "Publicando": (bar("Visita a cliente", "Publicando versión 4…"), t_cuerpo_editor(banda_html=publicando), t_fijo("off")),
        "Publicado": (bar("Visita a cliente", "Publicado · versión 4"), t_cuerpo_editor(banda_html=publicado), t_fijo("limpio")),
        "WhatsApp rechazó una pregunta": (bar("Visita a cliente", "No se pudo publicar la versión 4"), t_cuerpo_editor(banda_html=rechazo, mal=6), t_fijo("limpio")),
        "Nuevo formulario": (bar("Nuevo formulario", "Borrador"), t_cuerpo_editor(vacia=True, fijo=False, nombre="Inspección de obra", prefijo="OBR"), t_fijo("sucio")),
    }
    assert list(V) == E
    cuerpo = con_estados([(e, v[0] + v[1] + v[2]) for e, v in V.items()])
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")
    ops = "".join(f'<div class="t-op"><div class="ap-cmp" style="flex: 1;"><div class="ct">{o}</div></div>'
                  f'<button type="button" class="ap-ib" aria-label="Quitar opción {o}">{X}</button></div>' for o in ["Seguimiento", "Venta nueva", "Reclamo"])
    editar = (F.tcampo("Pregunta", "Motivo", req=True) + F.tcampo("Tipo de respuesta", "Elegir de una lista", select=True)
              + '<div class="ap-cmp"><span class="rt"><span>Opciones</span></span></div>' + ops + f'<span class="t-mas">{MAS} Agregar opción</span>'
              + F.tcampo("Ayuda para el empleado", "Opcional", vacio=True)
              + f'<span class="t-chk"><i>{tilde}</i>Obligatoria</span>')
    vp = '<div class="t-vp">' + "".join(
        f'<div class="ap-cmp"><span class="rt"><span>{n}{"" if k == 0 else " (opcional)"}</span></span><div class="ct ph{" area" if k == 5 else ""}">{"Elegí una opción" if k == 4 else "Elegí una fecha" if k == 1 else ""}</div></div>'
        for k, (n, _, _) in enumerate(T_PREG)) + "</div>"
    publicar_h = ('<div class="p-tit2">Qué cambia respecto de la versión 3</div><div class="ap-grupo" style="margin: 0;">'
                  '<div class="ap-dato"><span class="k">Agregada</span><span class="v">Observaciones</span></div>'
                  '<div class="ap-dato"><span class="k">Cambiada</span><span class="v">Motivo (las opciones)</span></div></div>'
                  f'<span class="t-lin">{GLOBO} En español: el inglés tiene 2 textos sin traducir y sale cuando esté completo.</span>'
                  f'<span class="t-lin">{TILDE} Las preguntas de la versión 4 ya no se editan; lo que cambies después va a la versión 5.</span>'
                  f'<span class="t-lin">{RELOJ} WhatsApp la revisa unos minutos. Recién ahí se puede mandar desde el chat.</span>')
    capas = {
        "Acciones de una pregunta": F.thoja("Monto estimado", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span role="menuitem">Subir</span><span role="menuitem">Bajar</span>'
                                            '<span class="pel" role="menuitem">Quitar</span></div>', ""),
        "Editar una pregunta": F.thoja("Editar pregunta", editar, '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'),
        "Pregunta con catálogo": F.thoja("Editar pregunta", F.tcampo("Pregunta", "Motivo", req=True) + F.tcampo("Tipo de respuesta", "Elegir de un catálogo", select=True)
                                         + F.tcampo("Catálogo", "Motivos de visita", req=True, select=True).replace("</div></div>", '</div><span class="ay">El empleado ve el texto y el detalle de cada opción.</span></div>', 1)
                                         + '<a class="t-mas" href="M-FRM-Catalogo.dc.html" style="text-decoration: none;">Ver el catálogo</a>'
                                         + F.tcampo("Ayuda para el empleado", "Opcional", vacio=True) + f'<span class="t-chk"><i>{tilde}</i>Obligatoria</span>',
                                         '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'),
        "Así lo ve el empleado": F.thoja("Así lo ve el empleado", vp, '<button type="button" class="cb cb-pri" disabled>Enviar</button>', sub="Visita a cliente · borrador"),
        "Publicar": F.thoja("Publicar la versión 4", publicar_h, '<button type="button" class="cb cb-pri">Publicar versión 4</button><button type="button" class="cb cb-sec">Cancelar</button>',
                            sub="Se publica el borrador guardado hoy a las 15:20."),
    }
    hojas = "".join(f'<sc-if value="{{{{s{E.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = F.pagina_tel(None, None, cuerpo, css=F.CSS_TFICHA + F.CSS_TPREGUNTA + F.CSS_TFORM + CSS_TED)
    i = t.index('<nav class="ap-nav"')
    j = t.index("</nav>", i) + len("</nav>")
    t = t[:i] + t[j:]
    k = t.index('<span class="ap-raya"></span>') + len('<span class="ap-raya"></span>')
    t = t[:k] + hojas + t[k:]
    props = {"estado": {"editor": "enum", "options": E, "default": E[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
    t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(E[0], ensure_ascii=False)};\n" + js_estados(E))
    return re.sub(r"<title>[^<]*</title>", "<title>Editor del formulario · teléfono</title>", t)


CSS_TCHAT_AB = """.ap-m .gl .c-card { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 9px 10px; border-radius: 10px; background: #fff; border: 1px solid oklch(0.86 0.04 170); }
.c-card .ic { color: var(--marca-tx); display: inline-flex; }
.c-card .t { display: flex; flex-direction: column; line-height: 1.3; }
.c-card .t b { font-size: 14.5px; font-weight: 600; }
.c-card .t small { font-size: 12.5px; color: var(--t3); }
.ap-m .pie.mal { color: oklch(0.5 0.19 25); }
.ap-m .pie.amb { color: oklch(0.5 0.12 70); }
.ap-m .pie .lnk2 { font-weight: 600; color: var(--marca-tx); margin-left: 6px; }
.ap-m .pie .ap-i { width: 22px; height: 22px; vertical-align: middle; }
.c-ops { display: flex; flex-direction: column; gap: 8px; }
.c-op { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; }
.c-op.on { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); background: oklch(0.975 0.01 180); }
.c-op .rd { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--borde2); box-sizing: border-box; flex-shrink: 0; background: #fff; }
.c-op.on .rd { border: 6px solid var(--marca); }
.c-op .tx { display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.c-op .tx b { font-size: 16px; font-weight: 500; }
.c-op .tx small { font-size: 13.5px; color: var(--t3); }
.c-op.baja { border-color: oklch(0.8 0.08 25); background: var(--peligro-t); box-shadow: none; }
.c-op.baja .tx b { text-decoration: line-through; color: oklch(0.45 0.17 25); }
.c-est { padding: 18px 14px; border: 1px dashed var(--borde2); border-radius: 12px; font-size: 15px; color: var(--t2); }
.c-ay { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--t3); }
.c-ay.mal { color: oklch(0.5 0.19 25); }
.c-ay > span:last-child { white-space: nowrap; }
.ap-hoja .h-sub { display: block; font-size: 13.5px; color: var(--t3); margin-top: 2px; }
.ap-cmp .ct.area.mal { border-color: oklch(0.6 0.19 25) !important; }
.ap-escr .ap-24.amb { flex: 1; }
.ap-hoja .hb { display: flex; flex-direction: column; gap: 14px; }
.ap-hoja .hp { display: flex; gap: 12px; padding: 12px 20px 34px; }
.ap-hoja .hp .cb { flex: 1; height: 50px; border-radius: 12px; font-size: 16px; }
.ap-hoja .hp .cb[disabled] { opacity: 0.6; }
.t-aviso { display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); font-size: 14.5px; line-height: 1.4; }
.t-aviso svg { flex-shrink: 0; margin-top: 2px; }
.t-toast { position: absolute; left: 12px; right: 12px; bottom: 104px; z-index: 40; display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #fff; border: 1px solid var(--borde);
  border-radius: 14px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); font-size: 14px; line-height: 1.35; }
.t-toast .mal { color: oklch(0.55 0.2 25); display: inline-flex; }
.t-toast .cb { flex-shrink: 0; height: 36px; font-size: 14px; }
"""


def t_burbuja(pie, clase="", extra="", icono=""):
    return (f'<div class="ap-m sal"><span class="gl">{MENSAJE_AB}<span class="c-card"><span class="ic">{F.ICONO}</span><span class="t"><b>Visita a cliente</b>'
            f'<small>Formulario · versión 3 · botón «Abrir formulario»</small></span></span></span><span class="pie {clase}">{icono}{pie}{extra}</span></div>')


def t_info(texto):
    return f'<button type="button" class="ap-i" aria-label="Qué significa" title="{texto}">{F.TINFO}</button>'


def t_hoja_enviar(lista="pocos", err="", aviso="", prob="", pie="normal", hasta=True):
    if lista == "pocos":
        lst = cards(FORMS_CHAT)
    elif lista == "baja":
        lst = cards(FORMS_CHAT, 0, baja=True)
    else:
        lst = '<div class="c-est">Cargando formularios…</div>'
    if err == "vacio":
        msg = ('<div class="ap-cmp"><span class="rt"><span>Mensaje que lo acompaña <span class="rq">*</span></span></span><div class="ct area mal ph">Escribí el mensaje…</div>'
               '<span class="c-ay mal"><span role="alert">Escribí el mensaje que acompaña al formulario.</span><span>0 / 1024</span></span></div>')
    else:
        msg = (f'<div class="ap-cmp"><span class="rt"><span>Mensaje que lo acompaña <span class="rq">*</span></span></span><div class="ct area">{MENSAJE_AB}</div>'
               '<span class="c-ay"><span>Es lo que lee arriba del botón «Abrir formulario».</span><span>36 / 1024</span></span></div>')
    cuerpo = ('<div class="ap-cmp"><span class="rt"><span>Formulario <span class="rq">*</span></span></span></div>' + lst
              + f'<span class="t-lin">{GLOBO} Le llega en español, el idioma de su cuenta.</span>' + prob + msg
              + (f'<span class="t-lin">{RELOJ14} Se puede mandar hasta mañana a las 10:48.</span>' if hasta else "") + aviso)
    if pie == "enviando":
        p = '<button type="button" class="cb cb-sec" disabled>Cancelar</button><button type="button" class="cb cb-pri" disabled>Enviando…</button>'
    else:
        p = f'<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri"{" disabled" if pie == "off" else ""}>Enviar formulario</button>'
    return F.thoja("Enviar un formulario", cuerpo, p, sub="A Tomás Acosta")


ESTADOS_TCHAT_AB = ["Menú abierto", "Elegir el formulario", "Cargando formularios", "Falta el mensaje", "Enviando", "En cola", "Leído", "No se pudo mandar",
                    "No se sabe si se guardó", "Envío sin confirmar", "Se cerró la ventana", "El formulario ya no está", "Ventana cerrada", "Cuenta inactiva",
                    "Sin formularios para Tomás", "Con catálogos", "Más de 200 opciones", "Ninguna opción", "Catálogo que no se puede usar"]


def t_escr(cerrada=False, aviso=""):
    nota = f'<button type="button" class="ap-red nt" aria-label="Nota interna" aria-pressed="false">{F.TNOTA}</button>'
    if cerrada:
        return ('<div class="ap-escr">' + nota + f'<span class="ap-24">{F.TRELOJ} Pasaron 24 horas<button type="button" class="ap-i" aria-label="Qué significa">{F.TINFO24}</button></span>'
                '<a class="ap-pill" href="M-WA-Chats-Plantilla.dc.html">Elegir plantilla</a></div>')
    if aviso:
        return '<div class="ap-escr">' + nota + f'<span class="ap-24 amb">{F.TRELOJ} {aviso}</span></div>'
    return '<div class="ap-escr">' + nota + f'<span class="campo">Mensaje</span><button type="button" class="ap-red env" aria-label="Enviar">{F.TENVIAR}</button></div>'


def t_menu(motivo=""):
    item = ('<span role="menuitem">Enviar formulario</span>' if not motivo else
            f'<span role="menuitem" class="off" aria-disabled="true">Enviar formulario<small class="sub">{motivo}</small></span>')
    return f'<div class="ap-menu" role="menu"><span role="menuitem">Pasar</span><span role="menuitem">Ver ficha del contacto</span>{item}</div>'


def pagina_tchat(E, esc, msgs, capas, titulo, css=""):
    escritura = con_estados([(e, esc[e]) for e in E])
    extra = con_estados([(e, msgs.get(e, "")) for e in E])
    over = "".join(f'<sc-if value="{{{{s{E.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    js = f"    const e = this.props.estado ?? {json.dumps(E[0], ensure_ascii=False)};\n" + js_estados(E)
    t = F.tel_chat(escritura, mensajes_extra=extra, overlay=over, estados=("estado", E, E[0]), js=js, css=F.CSS_TFORM + CSS_TCHAT_AB + css)
    return re.sub(r"<title>[^<]*</title>", f"<title>{titulo}</title>", t)


def tel_chat_enviar():
    E = ESTADOS_TCHAT_AB
    esc = {e: t_escr() for e in E}
    esc["Envío sin confirmar"] = t_escr(aviso="Hay un envío sin confirmar")
    esc["Ventana cerrada"] = t_escr(cerrada=True)
    revisar = t_info("Puede que haya salido. No lo mandamos de nuevo solo.") + '<span class="lnk2">Ya lo revisé</span>'
    msgs = {
        "En cola": t_burbuja("En cola · 10:51", icono=f'<span class="rel">{F.TRELOJ}</span>'),
        "Leído": t_burbuja("Lucía Fernández · 10:51 · Leído"),
        "No se pudo mandar": t_burbuja("No se pudo mandar", "mal", t_info("El formulario no le llegó. Podés mandarlo de nuevo con «Enviar formulario».")),
        "Envío sin confirmar": t_burbuja("10:51 · Envío sin confirmar", "amb", revisar),
    }
    ventana = f'<div class="t-aviso">{RELOJ14}<span>Pasaron 24 horas desde su último mensaje.</span></div>'
    def prob(texto):
        return f'<div class="t-prob2">{ALERTA}<span>{texto}</span></div>'
    capas = {
        "Menú abierto": t_menu(),
        "Elegir el formulario": t_hoja_enviar(),
        "Cargando formularios": t_hoja_enviar("cargando", pie="off"),
        "Falta el mensaje": t_hoja_enviar(err="vacio"),
        "Enviando": t_hoja_enviar(pie="enviando"),
        "No se sabe si se guardó": (f'<div class="t-toast" role="alert"><span class="mal">{ALERTA}</span><span>No pudimos confirmar si el pedido quedó guardado.</span>'
                                    '<button type="button" class="cb cb-sec">Consultar envío</button></div>'),
        "Se cerró la ventana": t_hoja_enviar(aviso=ventana, pie="off", hasta=False),
        "El formulario ya no está": t_hoja_enviar("baja", aviso='<div class="t-aviso">' + ALERTA + '<span>Visita a cliente ya no está disponible para Tomás. Elegí otro.</span></div>', pie="off"),
        "Ventana cerrada": t_menu("Pasaron 24 horas desde su último mensaje."),
        "Cuenta inactiva": t_menu("La cuenta de Tomás está inactiva: no puede completar formularios."),
        "Sin formularios para Tomás": t_menu("Tomás no tiene formularios publicados que pueda completar."),
        "Con catálogos": t_hoja_enviar(prob=f'<span class="t-lin">{F.LISTA} Motivo: 3 opciones</span><span class="t-lin">{F.LISTA} Supervisor a cargo: 7 opciones</span>'),
        "Más de 200 opciones": t_hoja_enviar(prob=prob("Supervisor a cargo: supera las 200 opciones que admite WhatsApp. Ajustá el catálogo antes de mandar."), pie="off"),
        "Ninguna opción": t_hoja_enviar(prob=prob("Supervisor a cargo: no tiene opciones y la pregunta es obligatoria."), pie="off"),
        "Catálogo que no se puede usar": t_hoja_enviar(prob=prob("Supervisor a cargo: el catálogo no se puede usar. Avisale a quien lo administra."), pie="off"),
    }
    return pagina_tchat(E, esc, msgs, capas, "WhatsApp · Internos · enviar un formulario · teléfono")


CSS_TRESP_AB = """.ap-chat { justify-content: flex-end; }
.ap-m.ent:has(.r-gl) { width: 88%; max-width: 88%; }
.ap-m.ent .gl.r-gl { width: 100%; box-sizing: border-box; padding: 0; overflow: hidden; background: #fff; border: 1px solid var(--borde); }
.r-cab { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: oklch(0.975 0.006 78); flex-wrap: wrap; }
.r-cab svg { color: var(--t2); flex-shrink: 0; }
.r-cab b { font-size: 15px; font-weight: 600; }
.r-cab small { font-size: 13px; color: var(--t3); }
.r-gr { display: grid; grid-template-columns: 140px minmax(0, 1fr); font-size: 14.5px; border-top: 1px solid var(--borde); }
.r-gr > span { padding: 9px 12px; border-top: 1px solid var(--borde); }
.r-gr > span:nth-child(-n+2) { border-top: 0; }
.r-gr .k { color: var(--t2); }
.r-gr .v small { display: block; font-size: 12.5px; color: var(--t3); }
.r-gr .vac { font-style: italic; color: var(--t3); }
.r-mas { display: block; padding: 11px 12px; border-top: 1px solid var(--borde); font-size: 14.5px; font-weight: 600; color: var(--marca-tx); text-align: center; }
.r-ok { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--borde); background: oklch(0.97 0.03 155); color: oklch(0.4 0.1 155); font-size: 14px; }
.r-ok b { font-weight: 700; }
.r-st { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; font-size: 14px; line-height: 1.4; color: var(--t2); border-top: 1px solid var(--borde); }
.r-st.mal { background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.r-st svg { flex-shrink: 0; margin-top: 2px; }
.r-bt { display: block; padding: 11px 12px; border-top: 1px solid oklch(0.88 0.05 25); background: var(--peligro-t); font-size: 14.5px; font-weight: 600; color: var(--marca-tx); text-align: center; }
.g-det { display: grid; grid-template-columns: 150px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.g-det > span { padding: 11px 12px; border-top: 1px solid var(--borde); font-size: 14.5px; line-height: 1.4; color: var(--t1); min-width: 0; }
.g-det > span:nth-child(-n+2) { border-top: 0; }
.g-det > .k { background: oklch(0.975 0.008 78); color: var(--t2); font-weight: 500; border-right: 1px solid var(--borde); }
.g-det .g-vacio { color: var(--t3); font-style: italic; }
.ap-hoja .hp:empty { display: none; }
.ap-hoja .hb:has(+ .hp:empty) { padding-bottom: 34px; }
.ap-hoja .h-sub { display: block; font-size: 13.5px; color: var(--t3); margin-top: 2px; }
"""


def t_tarjeta(cuerpo, titulo="Visita a cliente", chip=""):
    return (f'<div class="ap-m ent"><span class="gl r-gl"><span class="r-cab">{F.ICONO}<b>{titulo}</b><small>Respuesta del formulario</small>{chip}</span>{cuerpo}</span>'
            '<span class="pie">11:04</span></div>')


def tel_respuesta_ab():
    E = ESTADOS_RESP_AB
    env = t_burbuja("Lucía Fernández · 10:51 · Leído")
    sup = ("Supervisor a cargo", 'Martín Paz<small>Del catálogo «Supervisores»</small>')
    msgs = {
        "Guardada": env + t_tarjeta(grilla_r(VALORES_AB[:3]) + '<span class="r-mas">Ver las 6 respuestas</span>' + r_ok()),
        "Guardada, todas": env + t_tarjeta(grilla_r(VALORES_AB[:3]) + '<span class="r-mas">Ver las 6 respuestas</span>' + r_ok()),
        "Guardando": env + t_tarjeta(r_st("Llegó una respuesta de formulario. La estamos guardando…", RELOJ14)),
        "No se pudo guardar": env + t_tarjeta(r_st("No pudimos guardar la respuesta del formulario. Podés escribirle o mandárselo de nuevo.", ALERTA, "mal")),
        "No reconocida": t_tarjeta(r_st("Llegó una respuesta de formulario que no pudimos relacionar con un envío. No se guardó."), titulo="Formulario"),
        "Sin permiso para ver": env + t_tarjeta(r_st("No tenés permiso para ver las respuestas de este formulario.", CANDADO) + r_ok()),
        "Respondió en inglés": env + t_tarjeta(grilla_r([("Cliente", "Ferretería Rosales"), ("Observaciones", "All good, the client signed.")]) + r_ok("VIS-000124"),
                                               chip='<span class="ab-chip">Respondió en inglés</span>'),
        "El mensaje ya no está": env + t_tarjeta(grilla_r(VALORES_AB[:2]) + r_ok() + r_st("El mensaje de WhatsApp ya no está disponible. La respuesta sigue guardada.")),
        "Con un valor de catálogo": env + t_tarjeta(grilla_r(VALORES_AB[:3]) + '<span class="r-mas">Ver las 7 respuestas</span>' + r_ok("VIS-000125")),
        "Opción dada de baja": env + t_tarjeta(r_st("Motivo: una opción se dio de baja. No se guardó la respuesta.", ALERTA, "mal")
                                               + '<span class="r-bt">Mandar de nuevo</span>'),
        "Venció sin respuesta": t_burbuja("Lucía Fernández · 10:51 · Venció sin respuesta", "amb"),
    }
    esc = {e: t_escr() for e in E}
    hoja = lambda filas, num: F.thoja("Visita a cliente", F.grilla(filas), "", sub=f"{num} · Tomás Acosta · hoy, 11:04")
    capas = {"Guardada, todas": hoja(VALORES_AB, "VIS-000123"),
             "Con un valor de catálogo": hoja([(k, "Seguimiento · Motivos de visita · SEG" if k == "Motivo" else v) for k, v in VALORES_AB]
                                             + [("Supervisor a cargo", "Martín Paz · Supervisores · Delta S.A.")], "VIS-000125")}
    return pagina_tchat(E, esc, msgs, capas, "WhatsApp · Internos · respuesta del formulario · teléfono", CSS_AB + CSS_TRESP_AB)


# ---------------------------------------------------------------- canvas.json: los nuevos, «· para aprobar»; los reemplazados, al Archivo
TITULOS = {
    "FRM-Listado": "Formularios · diseñar formularios", "FRM-Editor": "Formularios · editor", "FRM-Publicar": "Formularios · publicar en WhatsApp",
    "FRM-Publicando": "Formularios · cómo termina una publicación", "WA-Chats-Formulario": "WhatsApp · Internos · enviar un formulario",
    "WA-Chats-Respuesta": "WhatsApp · Internos · respuesta del formulario", "M-FRM-Listado": "Diseñar formularios · teléfono",
    "M-FRM-Editor": "Editor del formulario · teléfono", "M-WA-Chats-Formulario": "WhatsApp · Internos · enviar un formulario · teléfono",
    "M-WA-Conversacion-Respuesta": "WhatsApp · Internos · respuesta del formulario · teléfono",
}
LUGAR = {"FRM-Listado": (0, 260, 1440, 900), "FRM-Editor": (1520, 260, 1440, 1400), "FRM-Publicar": (3040, 260, 1440, 1400),
         "FRM-Publicando": (4560, 260, 1440, 1400), "WA-Chats-Formulario": (0, 1780, 1440, 900), "WA-Chats-Respuesta": (1520, 1780, 1440, 900),
         "M-FRM-Listado": (0, 2800, 390, 844), "M-FRM-Editor": (470, 2800, 390, 844), "M-WA-Chats-Formulario": (940, 2800, 390, 844),
         "M-WA-Conversacion-Respuesta": (1410, 2800, 390, 844)}
ALTOS = ("FRM-Editor", "FRM-Publicar", "FRM-Publicando")
# Los del 13/10 que el editor reemplaza quedan con su nombre; los que se rehicieron con el mismo nombre se guardan como «-v127».
REEMPLAZADOS = ["FRM-Nuevo", "FRM-Ficha", "FRM-Pregunta", "FRM-Ingles", "FRM-Prefijo", "FRM-Publicacion", "M-FRM-Ficha", "M-FRM-Pregunta"]
COPIAS = ["FRM-Listado", "FRM-Publicar", "WA-Chats-Formulario", "WA-Chats-Respuesta", "M-FRM-Listado", "M-WA-Chats-Formulario", "M-WA-Conversacion-Respuesta"]
ENLACES = {"FRM-Ficha": "FRM-Editor", "FRM-Pregunta": "FRM-Editor", "FRM-Ingles": "FRM-Editor", "FRM-Prefijo": "FRM-Editor", "FRM-Nuevo": "FRM-Editor",
           "FRM-Publicacion": "FRM-Publicando", "M-FRM-Ficha": "M-FRM-Editor", "M-FRM-Pregunta": "M-FRM-Editor"}
MARCA = " · reemplazado (E12, 17/10)"


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    B = c["boards"]
    if not any(pg["id"] == "archivo" for pg in c["pages"]):
        c["pages"].append({"id": "archivo", "name": "Archivo"})
    c["notes"].setdefault("t-archivo", {"kind": "title1", "x": 0, "y": 0, "w": 1200, "maxW": 8000,
                                        "text": "Archivo · versiones anteriores, solo de referencia", "page": "archivo"})
    escritorio = [n for n in REEMPLAZADOS if not n.startswith("M-")] + [f"{n}-v127" for n in COPIAS if not n.startswith("M-")]
    telefono = [n for n in REEMPLAZADOS if n.startswith("M-")] + [f"{n}-v127" for n in COPIAS if n.startswith("M-")]
    for n in COPIAS:  # antes de pisar la entrada, la copia hereda el título del 13/10
        k = f"{n}-v127.dc.html"
        if k not in B:
            B[k] = {"x": 0, "y": 0, "w": B[f"{n}.dc.html"]["w"], "h": B[f"{n}.dc.html"]["h"], "title": B[f"{n}.dc.html"]["title"] + " · versión 127", "page": "archivo"}
            c["order"].append(k)
    for n in REEMPLAZADOS:
        b = B[f"{n}.dc.html"]
        if not b["title"].endswith(MARCA):
            b["title"] += MARCA
        b["page"] = "archivo"
    for k, n in enumerate(escritorio):
        B[f"{n}.dc.html"].update({"x": (k % 5) * 1520, "y": 260 + (k // 5) * 1020, "page": "archivo"})
    for k, n in enumerate(telefono):
        B[f"{n}.dc.html"].update({"x": k * 470, "y": 2300, "page": "archivo"})
    # Lo de abajo en «Organización · Formularios» (Catálogos y Biblioteca) baja 500 para dar lugar al editor de 1400.
    if B["FRM-Catalogos.dc.html"]["y"] == 3320:
        for k, b in B.items():
            if b.get("page") == "formularios" and b["y"] >= 3320 and k[:-8] not in LUGAR:
                b["y"] += 500
    for n, (x, y, w, h) in LUGAR.items():
        B[f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n] + ("" if E12_APROBADA else PARA_APROBAR), "page": "formularios", "is_interactive": True}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def reenlazar():
    """Los tableros vigentes dejan de apuntar a los reemplazados; los del Archivo quedan como estaban."""
    archivo = {k[:-8] for k, b in json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))["boards"].items() if b.get("page") == "archivo"}
    # Lo que reemplaza la E13 (formularios_ab_catalogos_1004.py, que corre después) tampoco se toca.
    fuera = set(REEMPLAZADOS) | {f"{n}-v127" for n in COPIAS} | archivo | {"FRM-Catalogo-Opcion", "M-FRM-Catalogo-Opcion"}
    cambiados = []
    for f in sorted(PROJ.glob("*.dc.html")):
        if f.name[:-8] in fuera or re.search(r"-v1\d\d$", f.name[:-8]):
            continue
        t = f.read_text(encoding="utf-8")
        t2 = t
        for viejo, nuevo in ENLACES.items():
            t2 = t2.replace(f'href="{viejo}.dc.html"', f'href="{nuevo}.dc.html"')
        # El panel de Formularios dice «Diseñar formularios» en todos los tableros vigentes (como en ArquitecturaBase).
        t2 = t2.replace(f'href="FRM-Listado.dc.html">{F.ICONO} Formularios</a>', f'href="FRM-Listado.dc.html">{LAPIZ} Diseñar formularios</a>')
        if t2 != t:
            f.write_text(t2, encoding="utf-8")
            cambiados.append(f.name)
    return cambiados


if __name__ == "__main__":
    tableros = {"FRM-Listado": listado(), "FRM-Editor": editor(), "FRM-Publicar": publicar(), "FRM-Publicando": publicando(),
                "WA-Chats-Formulario": chat_enviar(), "WA-Chats-Respuesta": chat_respuesta(),
                "M-FRM-Listado": tel_listado_ab(), "M-FRM-Editor": tel_editor(), "M-WA-Chats-Formulario": tel_chat_enviar(),
                "M-WA-Conversacion-Respuesta": tel_respuesta_ab()}
    for n in COPIAS:
        assert (PROJ / f"{n}-v127.dc.html").exists(), f"falta la copia {n}-v127 (git show <v127>:docs/design/lienzo/{n}.dc.html)"
    for nombre, t in tableros.items():
        if nombre in ALTOS:
            t = t.replace('"$preview":{"width":1440,"height":900}', '"$preview":{"width":1440,"height":1400}', 1)
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    registrar()
    print("tableros", list(tableros))
    print("enlaces", reenlazar())
