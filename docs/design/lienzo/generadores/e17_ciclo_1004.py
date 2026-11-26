"""La E17 (ciclo de vida) con el traspaso 18, tanda 3A (2026-11-26, lienzo v187), sobre los tableros de siempre, con la forma que la
E14 dejó en `FRM-Formularios`, `M-FRM-Formularios`, `FRM-Editor` y `M-FRM-Editor` (`e14_listados_1004.py` y `e14_editor_1004.py`).
Manda la spec `docs/plans/formularios/17-ciclo-de-vida.md` y su plan (F2 y F5):

- `FRM-Formularios-17` y la lista de atrás de `FRM-Copiar` (son la misma): el filtro «Estado» es un botón que abre la pieza, sin
  cantidades, con Activos, Publicados, Borradores y Dados de baja (262 y spec §«La lista»); el encabezado ordena con la flecha en el
  color de la marca después del título, y «Ordenar por», último y separado del filtro, dice el orden con palabras y abre «Columna» y
  «Orden» (264); «Respuestas», un número, va a la derecha (137). El nombre abre «Diseño» (el editor, o el del dado de baja) y el
  número de respuestas, la planilla (275 y E15); quien solo ve respuestas sigue abriendo «Respuestas» con el nombre. Las filas van por
  nombre, como dice el orden. Suma «Inspección de obra» (la de `WA-Chats-Formulario`), publicada sin respuestas y con envíos
  abiertos, para el otro motivo de «Borrar» apagado: «Tiene envíos abiertos y no se puede borrar.» (43 y 132; plan F2), con los
  estados «Acciones con envíos abiertos» y «Ordenar por abierto»; «Sin coincidencias» busca «mantenimiento». Con el ⋮ abierto se ve
  un solo tooltip, el de la acción del estado (211): en «Acciones mientras se publica», el de «Dar de baja». «Visita a cliente» está
  publicado en la versión 3, como en la E14 y en el editor de `FRM-Dar-De-Baja` (la 4 es la que se está publicando).
- `M-FRM-Formularios-17`: cada fila, una tarjeta con Respuestas, Última respuesta y, a todo el ancho, En WhatsApp, cada dato con su
  nombre y nada unido con «·» debajo del nombre (263), y su ⋮ (261); la tarjeta abre «Diseño» (275). Quien solo ve respuestas, sin
  ⋮ ni «En WhatsApp» (como sus columnas de la compu), abre «Respuestas». «Filtros», con «Estado» en la pieza y sin cantidades
  (262); «Ordenar por» arriba de la lista, que abre su pantalla (264, el estado «Ordenar por»). En la hoja del ⋮, «Borrar» apagado
  va sin texto debajo: el motivo se abre como tooltip sobre la opción al tocarla (211), en los estados «El motivo de Borrar apagado»
  («Tiene respuestas…») y «Acciones con envíos abiertos» («Tiene envíos abiertos…»). El formulario de atrás de «Reactivar», como el
  editor de la E14 (las preguntas en tarjetas y «Para quién es» en la pieza). «¿Borrar «Reclamo»?» dice la frase de la spec, como la
  compu.
- `FRM-Editor-Baja`, `FRM-Dar-De-Baja` y `FRM-Reactivar-Eliminar`: el editor de atrás, como el de la E14: las preguntas con el tipo
  (con «varias, hasta N») y «Obligatoria» en sus columnas (263) y «Para quién es» en la pieza, cerrada y prendida, porque el borrador
  de un dado de baja se sigue editando (262; spec §«Dar de baja»). En `FRM-Reactivar-Eliminar`, «Relevamiento de obra» suma el título
  «Estado de la obra» y «Agregar título» (88), como en `FRM-Editor-Baja`. El ⋮ de la compu ya decía el motivo de «Borrar» en su
  tooltip. Los diálogos no cambian: no eligen nada, cada dato va en su renglón y no tienen filas con botones; «Problemas», con «Ir a
  la pregunta», queda como el de `FRM-Publicar` de la E14.
- `M-FRM-Editor-Baja`: las preguntas en tarjetas, con «Tipo» y «Obligatoria» (263); «Para quién es» en la pieza (262); en la hoja del
  ⋮, «Borrar» apagado sin texto debajo, y el estado nuevo «El motivo de Borrar apagado», con el motivo en el tooltip que abre el toque
  (211).

Cambia los tableros en su lugar, con un bloque `<style data-e17="t3">` que lo frena si ya está, y al final corre
`traspaso10_piezas_1004.py --tableros` con los siete, que pone la escala de la compu. Para volver a correrlo, primero se restauran los
siete (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
"""
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_editor_1004 as e14e  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
MARCA = 'data-e17="t3"'
SUFIJO = " · para aprobar"
TABLEROS = ["FRM-Formularios-17", "M-FRM-Formularios-17", "FRM-Editor-Baja", "M-FRM-Editor-Baja", "FRM-Dar-De-Baja",
            "FRM-Reactivar-Eliminar", "FRM-Copiar"]
leer, escribir, una, sc_ifs, renombrar, sumar_estados, partir = (
    e14e.leer, e14e.escribir, e14e.una, e14e.sc_ifs, e14e.renombrar, e14e.sumar_estados, e14e.partir)
fin_sc_if, props = e12l.fin_sc_if, e12l.props
SVG = r"<svg\b[^>]*>.*?</svg>"


def con_css(t, css):
    assert MARCA not in t
    m = re.search(r"<title>([^<]*)</title>", t)
    if not m.group(1).endswith(SUFIJO):
        t = t[:m.end(1)] + SUFIJO + t[m.end(1):]
    return una(t, "</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


# ---------------------------------------------------------------------------------------------------------------- los datos
INS = "Inspección de obra"  # publicado, como en `WA-Chats-Formulario` (versión 1, 9 preguntas)
REL = "Relevamiento de obra"
SIN_RESP = "Tiene respuestas y no se puede borrar."
CON_ENVIOS = "Tiene envíos abiertos y no se puede borrar."
ORDEN_FORM = "Ordenar por: Formulario, de la A a la Z"
LISTA_COLS = ["Formulario", "En WhatsApp", "Respuestas", "Última respuesta", "Recibida"]
FILTRO_ESTADO = ["Activos", "Publicados", "Borradores", "Dados de baja"]
# Cada formulario de la lista: cuántas respuestas, la última y En WhatsApp (clase del punto, texto y su (i)).
FORMS = {
    "Control de vehículo": (31, "VEH-000031", "mal", "No se pudo publicar", "La versión 2 publicada sigue activa."),
    "Entrega de pedido": (48, "ENT-000048", "ok", "Publicado · versión 1", None),
    INS: (0, None, "ok", "Publicado · versión 1", None),
    "Reclamo": (0, None, "", "Borrador", None),
    REL: (12, "REL-000012", "", "De baja · versión 2", "Se deprecan en WhatsApp cuando venzan los 2 envíos abiertos."),
    "Visita a cliente": (24, "VIS-000130", "ok", "Publicado · versión 3", None),
}
POR_NOMBRE = sorted(FORMS)  # el orden de la lista: Formulario, de la A a la Z (264)


def diseno(nombre, tel=False):
    """Adónde lleva el nombre: «Diseño», el editor, o el del dado de baja (275)."""
    base = "FRM-Editor-Baja" if nombre == REL else "FRM-Editor"
    return f"{'M-' if tel else ''}{base}.dc.html"


# ---------------------------------------------------------------------------------------------------------------- la lista
CSS_LISTA = e14l.CSS_LISTADO + """
/* E17 · 137: los números a la derecha (Respuestas y, sin las columnas de respuestas, Preguntas). */
.w-th.fx17 > :nth-child(3), .w-th.fx3 > :nth-child(2), .w-th.fx14 > :nth-child(2) { text-align: right; }
.w-tr.fx17 > :nth-child(3), .w-tr.fx3 > :nth-child(2), .w-tr.fx14 > :nth-child(2) { justify-self: stretch; text-align: right; }
/* E17 · 275: el número de respuestas abre la planilla. */
.w-tr .fx-cnt { color: var(--t1); text-decoration: none; }
.w-tr .fx-cnt:hover { text-decoration: underline; }
"""
FILA_R = re.compile(r'<sc-if value="\{\{(r\w+)\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">')


def grupo(t, var):
    """El bloque de las columnas de una vista (`{{var}}`): (inicio, fin, encabezado, {nombre: fila})."""
    i = t.index(f'<sc-if value="{{{{{var}}}}}"')
    j = fin_sc_if(t, i)
    bloque = t[i:j]
    pos = bloque.index('<sc-if value="{{r')
    cab, filas = bloque[:pos], {}
    while FILA_R.match(bloque, pos):
        f = fin_sc_if(bloque, pos)
        fila = bloque[pos:f]
        filas[re.search(r'<span class="fx-n"><a href="[^"]+">([^<]+)</a>', fila).group(1)] = fila
        pos = f
    assert bloque[pos:] == "</sc-if>", bloque[pos:pos + 80]
    return i, j, cab, filas


def a_planilla(fila):
    """«Respuestas», el primer número entero de la fila: con alguna, abre la planilla (275). Sin respuestas no hay qué abrir."""
    return re.sub(r'<span class="num">([1-9]\d*)</span>', r'<span class="num"><a class="fx-cnt" href="FRM-Respuestas.dc.html">\1</a></span>',
                  fila, count=1)


def lista_compu(t):
    """La lista de la E17 (la de `FRM-Formularios-17`, que `FRM-Copiar` tiene atrás), con la forma de la E14."""
    t = con_css(t, CSS_LISTA)
    t = e14l.barra(t, LISTA_COLS, "De la A a la Z", [("est", FILTRO_ESTADO, "conEstado")])
    t = b2.con_orden(t)

    # Con todas las columnas: el nombre abre «Diseño» y el número de respuestas, la planilla (275).
    i, j, cab, filas = grupo(t, "colsTodas")
    assert sorted(filas) == sorted(set(FORMS) - {INS}), list(filas)
    vis = filas["Visita a cliente"]
    keb = re.search(r'aria-label="Acciones de Visita a cliente" aria-haspopup="menu">(<svg.*?</svg>)</button>', vis, re.S).group(1)
    a = vis.index('<sc-if value="{{mVis}}"')
    menu = vis[a:fin_sc_if(vis, a)].replace("Visita a cliente", INS).replace("{{mVis}}", "{{mIns}}")
    assert menu.count(SIN_RESP) == 2
    menu = menu.replace(SIN_RESP, CON_ENVIOS)
    filas = {n: a_planilla(re.sub(r'(<span class="fx-n"><a href=")[^"]+', lambda m: m.group(1) + diseno(n), f, count=1))
             for n, f in filas.items()}
    filas[INS] = ('<sc-if value="{{rIns}}" hint-placeholder-val="{{si}}"><div class="w-tr fx17">'
                  f'<span class="fx-n"><a href="{diseno(INS)}">{INS}</a></span><span class="est2"><span class="w-est ">Publicado · versión 1</span></span>'
                  '<span class="num">0</span><span class="fm-no">—</span><span class="fm-no">—</span>'
                  f'<span><button type="button" class="ib" aria-label="Acciones de {INS}" aria-haspopup="menu">{keb}</button></span>{menu}</div></sc-if>')
    t = t[:i] + cab + "".join(filas[n] for n in POR_NOMBRE) + "</sc-if>" + t[j:]

    # Quien solo ve respuestas: el nombre sigue abriendo «Respuestas», y el número también (E15).
    i, j, cab, filas = grupo(t, "colsLee")
    assert sorted(filas) == sorted(set(FORMS) - {INS, "Reclamo"}), list(filas)
    filas = {n: a_planilla(f) for n, f in filas.items()}
    filas[INS] = ('<sc-if value="{{rIns}}" hint-placeholder-val="{{si}}"><div class="w-tr fx3">'
                  f'<span class="fx-n"><a href="FRM-Respuestas.dc.html">{INS}</a></span><span class="num">0</span>'
                  '<span class="fm-no">—</span><span class="fm-no">—</span></div></sc-if>')
    t = t[:i] + cab + "".join(filas[n] for n in POR_NOMBRE if n in filas) + "</sc-if>" + t[j:]

    # Solo lectura, sin las columnas de respuestas (las de la E14).
    i, j, cab, filas = grupo(t, "colsLectura")
    assert sorted(filas) == sorted(set(FORMS) - {INS}), list(filas)
    filas[INS] = ('<sc-if value="{{rIns}}" hint-placeholder-val="{{si}}"><div class="w-tr fx14">'
                  f'<span class="fx-n"><a href="{diseno(INS)}">{INS}</a></span><span class="num">9</span>'
                  '<span class="est2"><span class="w-est ">Publicado · versión 1</span></span><span class="num">16/10/2026, 08:45</span></div></sc-if>')
    t = t[:i] + cab + "".join(filas[n] for n in POR_NOMBRE) + "</sc-if>" + t[j:]

    # Mientras se publica, el tooltip abierto es el de «Dar de baja», el que dice el estado (211); «Borrar» lo abre al pasar.
    a = t.index('<sc-if value="{{mVisPub}}"')
    b = fin_sc_if(t, a)
    t = t[:a] + una(t[a:b], f'<span class="e-tip" role="tooltip">{SIN_RESP}</span>', "") + t[b:]

    # Los valores: el filtro sin cantidades, «Ordenar por», la fila nueva y su ⋮.
    t = una(t, "estMenu, estAlternar: () => {},", "estMenu, estExp: estMenu ? 'true' : 'false',")
    t = una(t, "      estOn_t: pub || bor || baja ? '' : 'on', estOn_p: pub ? 'on' : '', estOn_b: bor ? 'on' : '', estOn_d: baja ? 'on' : '', "
               "estC_t: '4', estC_p: '3', estC_b: '1', estC_d: '1',\n"
               "      estElegir_t: () => {}, estElegir_p: () => {}, estElegir_b: () => {}, estElegir_d: () => {},\n", "")
    t = una(t, "pub || lee || aprueba ? 3 : 4;", "pub || lee || aprueba ? 4 : 5;")
    t = una(t, ": lee ? '3 activos' :", ": lee ? '4 activos' :")
    t = una(t, ": '4 activos · 1 dado de baja',", ": '5 activos · 1 dado de baja',")
    t = una(t, "rRel: baja,", "rRel: baja, rIns: lista && !baja && !bor && !conAlgo,")
    t = una(t, "mRel: v === 'Acciones de un dado de baja',", "mRel: v === 'Acciones de un dado de baja', mIns: v === 'Acciones con envíos abiertos',")
    t = una(t, "conTabla: v !== 'Sin permiso', conFilas: lista,",
            "conTabla: v !== 'Sin permiso', conFilas: lista, ordMenu: v === 'Ordenar por abierto', "
            f"ordExp: v === 'Ordenar por abierto' ? 'true' : 'false',\n      ordTexto: '{ORDEN_FORM}',")
    t = t.replace("'Publicado · versión 4'", "'Publicado · versión 3'")
    # «Sin coincidencias» busca algo que no está: «inspección» ahora encuentra «Inspección de obra».
    t = una(t, "v === 'Sin coincidencias' ? 'inspección'", "v === 'Sin coincidencias' ? 'mantenimiento'")
    assert "▲" not in t and "{{estC_" not in t and "{{total}}" not in t and "{{estAlternar}}" not in t
    assert 'class="f-mn"' not in t[t.index("</helmet>"):]
    assert "versión 4'" not in t.replace("'Publicando la versión 4'", "")
    return t


def frm_formularios_17():
    t, nl = leer("FRM-Formularios-17")
    t = lista_compu(t)

    def estados(p):
        ops = p["estado"]["options"]
        ops.insert(ops.index("Dados de baja") + 1, "Ordenar por abierto")
        ops.insert(ops.index("Acciones de un publicado") + 1, "Acciones con envíos abiertos")
    t = props(t, estados)
    # «Tiene respuestas…»: el título y el tooltip en el ⋮ de un publicado y en el de un dado de baja, y el título mientras se publica.
    assert t.count(CON_ENVIOS) == 2 and t.count(SIN_RESP) == 5, (t.count(CON_ENVIOS), t.count(SIN_RESP))
    escribir("FRM-Formularios-17", t, nl)


def frm_copiar():
    t, nl = leer("FRM-Copiar")
    t = lista_compu(t)
    assert "const v = 'Activos';" in t
    escribir("FRM-Copiar", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
ORDTEL = e12l.CSS_TEL[len(b2.CSS_B2 + b2.CSS_B2_TEL):]
assert e12l.CSS_TEL.startswith(b2.CSS_B2 + b2.CSS_B2_TEL) and ".b2-ordtel" in ORDTEL
CSS_HOJA = """
/* E17 · 211: en la hoja del ⋮, lo apagado no lleva texto debajo; el motivo se abre como tooltip sobre la opción al tocarla. */
.ap-acciones .off { position: relative; flex-direction: row; align-items: center; justify-content: flex-start; }
.ap-acciones .off .acc-tip { left: 20px; }
"""
BORRAR_SMALL = f'<span role="menuitem" class="off" aria-disabled="true">Borrar<small>{SIN_RESP}</small></span>'
BORRAR_OFF = '<span role="menuitem" class="off" aria-disabled="true">Borrar</span>'


def borrar_tip(motivo):
    return f'<span role="menuitem" class="off" aria-disabled="true">Borrar{b2.tip(motivo)}</span>'


FILA_TEL = (r'<div class="ap-fila fx"><a class="tx" href="([^"]+)"><span class="l1">([^<]+)</span><span class="l2">([^<]*)</span></a>'
            r'(<button type="button" class="ap-ib" aria-label="Acciones de [^"]+">(?:(?!</button>).)*</button>)?</div>')
# Las filas seguidas de una lista: la misma fila, sin grupos que capturen.
TANDA_TEL = re.compile(r'(?:<div class="ap-fila fx"><a class="tx" href="[^"]+"><span class="l1">[^<]+</span><span class="l2">[^<]*</span></a>'
                       r'(?:<button type="button" class="ap-ib" aria-label="Acciones de [^"]+">(?:(?!</button>).)*</button>)?</div>)+', re.S)


def tarjeta(nombre, con_keb, a_respuestas):
    resp, ult, clase, texto, info = FORMS[nombre]
    datos = [("Respuestas", str(resp)), ("Última respuesta", ult or b2.NADA_T)]
    if not a_respuestas:  # quien solo ve respuestas no tiene «En WhatsApp», como en sus columnas de la compu
        datos.append(("En WhatsApp", b2.est(clase, texto, info=info), True))
    href = "M-FRM-Respuestas.dc.html" if a_respuestas else diseno(nombre, tel=True)
    return b2.tarjeta(nombre, datos, acciones=nombre if con_keb else None, href=href)


def tanda(m):
    """Las filas de una lista, en tarjetas y por nombre; la de Activos suma «Inspección de obra»."""
    filas = list(re.finditer(FILA_TEL, m.group(0), re.S))
    nombres = [f.group(2) for f in filas]
    con_keb = bool(filas[0].group(4))
    assert all(bool(f.group(4)) == con_keb for f in filas)
    orden = [n for n in POR_NOMBRE if n in nombres or n == INS] if "Visita a cliente" in nombres else nombres
    # Sin ⋮ es quien solo ve respuestas: no tiene «Diseño», y la tarjeta abre «Respuestas» (E15).
    return "".join(tarjeta(n, con_keb, not con_keb) for n in orden)


def m_frm_formularios_17():
    t, nl = leer("M-FRM-Formularios-17")
    t = con_css(t, e14e.CSS_TEL + ORDTEL + CSS_HOJA)
    cab, cuerpo, guion = partir(t)

    # Las filas como tarjetas, por nombre (263 y 264), con su ⋮ (261).
    cuerpo, n = TANDA_TEL.subn(tanda, cuerpo)
    assert n == 9 and 'class="l2"' not in cuerpo, n

    # «Filtros»: «Estado» con su nombre y la pieza, sin cantidades (262), también para quien solo ve respuestas.
    for m in reversed(list(re.finditer(r'<div class="t10-fl"><div role="radiogroup" aria-label="Estado">', cuerpo))):
        k = b2.fin_div(cuerpo, m.start())
        cuerpo = cuerpo[:m.start()] + '<div class="t10-fl">' + e12l.campo_tel("Estado", "Activos") + "</div>" + cuerpo[k:]
    assert 'role="radiogroup"' not in cuerpo

    # El formulario de atrás de «Reactivar», como el editor de la E14: preguntas en tarjetas y «Para quién es» en la pieza.
    cuerpo = e14e.tarjetas_tel(cuerpo)
    cuerpo, n = re.subn(r'<div class="ct sel">([^<]*)' + SVG + r'</div>', lambda m: b2.campo(m.group(1), aria=e14e.aria_de(m.group(1))),
                        cuerpo, flags=re.S)
    assert n == 1 and 'class="ct sel' not in cuerpo, n

    # La hoja del ⋮: «Borrar» apagado, sin texto debajo (211). «¿Borrar «Reclamo»?», con la frase de la spec.
    assert cuerpo.count(BORRAR_SMALL) == 2
    cuerpo = cuerpo.replace(BORRAR_SMALL, BORRAR_OFF)
    cuerpo = una(cuerpo, "Deja de aparecer en la lista y no se puede volver a usar. El prefijo REC queda reservado.",
                 "Deja de aparecer en la lista, no se puede volver a usar y el prefijo REC queda reservado.")
    t = cab + cuerpo + guion

    # «Ordenar por» arriba de cada lista (264).
    t = e14l.boton_ordenar_tel(t, ("s0", "s2", "s3", "s4", "s5", "s6", "s7", "s9", "s10", "s12", "s13"), ORDEN_FORM)

    # Tres estados nuevos: los dos motivos de «Borrar» apagado, con el tooltip abierto, y la pantalla «Ordenar por».
    t, sv = sumar_estados(t, [("Acciones de un publicado", "El motivo de Borrar apagado"),
                              ("El motivo de Borrar apagado", "Acciones con envíos abiertos"), ("Filtros", "Ordenar por")])
    (c3, c3f), (h3, h3f) = sc_ifs(t, "s3")
    lista, hoja = t[c3:c3f], t[h3:h3f]
    assert BORRAR_OFF in hoja and "Visita a cliente" in hoja
    s_mot, s_env = sv["El motivo de Borrar apagado"], sv["Acciones con envíos abiertos"]
    cuerpos = renombrar(lista, "s3", s_mot) + renombrar(lista, "s3", s_env)
    hojas = (renombrar(una(hoja, BORRAR_OFF, borrar_tip(SIN_RESP)), "s3", s_mot)
             + renombrar(una(hoja.replace("Visita a cliente", INS), BORRAR_OFF, borrar_tip(CON_ENVIOS)), "s3", s_env))
    t = t[:c3f] + cuerpos + t[c3f:h3f] + hojas + t[h3f:]
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-FRM-Formularios-17.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)
    t = una(t, '<span class="ap-raya"></span>', f'<sc-if value="{{{{{sv["Ordenar por"]}}}}}" hint-placeholder-val="{{{{no}}}}">'
            + e14l.pantalla_ordenar(volver, "M-FRM-Formularios-17", "Formulario", "De la A a la Z") + '</sc-if><span class="ap-raya"></span>')
    assert "<small>" not in t[t.index("</helmet>"):] and " · " not in "".join(re.findall(r'<span class="v">([^<]*)</span>', t))
    assert "versión 4" not in t, "Visita a cliente está publicado en la versión 3"
    escribir("M-FRM-Formularios-17", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el editor
def con_titulo(cuerpo):
    """`FRM-Reactivar-Eliminar` muestra el mismo «Relevamiento de obra» que `FRM-Editor-Baja`: con el título «Estado de la obra»
    (también en la vista previa) y «Agregar título» al lado de «Agregar pregunta» (88), como el editor de la E14."""
    baja = leer("FRM-Editor-Baja")[0]
    m = re.search(r'<div class="q-it q-tit"><span class="num"></span><span class="dato"><b>Estado de la obra</b></span>', baja)
    titulo = baja[m.start():e14e.cierre(baja, m.start(), "div")]
    boton = re.search(r'<button type="button" class="cb cb-sec">(?:(?!</button>).)* Agregar título</button>', baja, re.S).group(0)
    cuerpo, n = re.subn(r'(<div class="f-cab"><span>Preguntas</span><span class="der">)(?=<button type="button" class="cb cb-sec">'
                        r'(?:(?!</button>).)* Agregar pregunta</button></span>)', lambda m: m.group(1) + boton, cuerpo, flags=re.S)
    assert n == 9, n
    pos = [m.start() for m in re.finditer(r'<div class="q-it"><span class="num">2</span><span class="dato"><b>Fecha del relevamiento</b>', cuerpo)]
    assert len(pos) == 5, len(pos)
    for p in reversed(pos):
        f = e14e.cierre(cuerpo, p, "div")
        cuerpo = cuerpo[:f] + titulo + cuerpo[f:]
    cuerpo, n = re.subn(r'(<div class="pv-c">Fecha del relevamiento \(opcional\)<div class="pv-in">Elegí una fecha ' + SVG + r'</div></div>)',
                        r'\1<div class="pv-sub">Estado de la obra</div>', cuerpo, flags=re.S)
    assert n == 5, n
    return cuerpo


CSS_TITULO = """
/* E17 · 88: el título de una sección, en la lista y en la vista previa, como en `FRM-Editor-Baja`. */
.q-it.q-tit { min-height: 48px; background: oklch(0.975 0.01 95); }
.q-it.q-tit .num { visibility: hidden; }
.q-it.q-tit .dato b { font-weight: 600; }
.tel .pv-sub { margin-top: 3px; font-size: 13.5px; font-weight: 700; color: oklch(0.25 0.01 150); }
"""


def editor_compu(nombre):
    """El editor de atrás, como el de la E14: las preguntas en columnas (263) y «Para quién es» en la pieza (262)."""
    t, nl = leer(nombre)
    t = con_css(t, e14e.CSS_COMPU + (CSS_TITULO if nombre == "FRM-Reactivar-Eliminar" else ""))
    cab, cuerpo, guion = partir(t)
    if nombre == "FRM-Reactivar-Eliminar":
        cuerpo = con_titulo(cuerpo)
    cuerpo = e14e.filas_compu(cuerpo)
    cuerpo, n = re.subn(r'<div class="ct sel">([^<]*)' + SVG + r'</div>', lambda m: b2.campo(m.group(1), aria=e14e.aria_de(m.group(1))),
                        cuerpo, flags=re.S)
    assert n > 0 and 'class="ct sel' not in cuerpo and "q-catmn" not in cuerpo and "q-rd" not in cuerpo, n
    print("piezas cerradas:", nombre, n)
    escribir(nombre, cab + cuerpo + guion, nl)


def m_frm_editor_baja():
    t, nl = leer("M-FRM-Editor-Baja")
    t = con_css(t, e14e.CSS_TEL + CSS_HOJA)
    cab, cuerpo, guion = partir(t)
    cuerpo = e14e.tarjetas_tel(cuerpo)
    cuerpo, n = re.subn(r'<div class="ct sel">([^<]*)' + SVG + r'</div>', lambda m: b2.campo(m.group(1), aria=e14e.aria_de(m.group(1))),
                        cuerpo, flags=re.S)
    assert n > 0 and 'class="ct sel' not in cuerpo, n
    print("piezas cerradas: M-FRM-Editor-Baja", n)
    cuerpo = una(cuerpo, BORRAR_SMALL, BORRAR_OFF)
    t = cab + cuerpo + guion

    # «El motivo de Borrar apagado»: la hoja del ⋮ con el tooltip abierto sobre «Borrar», como lo deja el toque (211).
    t, sv = sumar_estados(t, [("Acciones del formulario", "El motivo de Borrar apagado")])
    s = sv["El motivo de Borrar apagado"]
    (c3, c3f), (h3, h3f) = sc_ifs(t, "s3")
    cuerpo3, hoja3 = renombrar(t[c3:c3f], "s3", s), renombrar(una(t[h3:h3f], BORRAR_OFF, borrar_tip(SIN_RESP)), "s3", s)
    t = t[:c3f] + cuerpo3 + t[c3f:h3f] + hoja3 + t[h3f:]
    assert "<small>" not in t[t.index("</helmet>"):]
    escribir("M-FRM-Editor-Baja", t, nl)


if __name__ == "__main__":
    pasos = {"FRM-Formularios-17": frm_formularios_17, "M-FRM-Formularios-17": m_frm_formularios_17,
             "FRM-Editor-Baja": lambda: editor_compu("FRM-Editor-Baja"), "M-FRM-Editor-Baja": m_frm_editor_baja,
             "FRM-Dar-De-Baja": lambda: editor_compu("FRM-Dar-De-Baja"),
             "FRM-Reactivar-Eliminar": lambda: editor_compu("FRM-Reactivar-Eliminar"), "FRM-Copiar": frm_copiar}
    for nombre in TABLEROS:
        if MARCA in leer(nombre)[0]:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        pasos[nombre]()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
