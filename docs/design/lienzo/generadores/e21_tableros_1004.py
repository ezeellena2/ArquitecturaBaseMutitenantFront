"""Los tableros de números de la E19 y la E21 y dos sueltos de la E21 con el traspaso 18, tanda 3B (2026-11-26), sobre los tableros
de siempre, con la forma que la E12 a la E14 dejaron en `FRM-Formularios`, `FRM-Catalogo-14` y `FRM-Editor`. Los tableros de números
copian la forma que la tanda 3A dejó en `FRM-Tablero` y `M-FRM-Tablero` (las mismas clases, textos y estados, sin importar su
generador):

- `FRM-Tablero-19` (el tablero con un monto): arriba, «Respuestas» y la caja de la pregunta «Total», con el total, el promedio, el
  mínimo y el máximo, cada uno con su nombre y ninguno debajo de otro (263); con su moneda no entran en la letra de `FRM-Tablero`, así
  que los números de arriba van un punto más chicos. La tabla de una tarjeta ordena por sus columnas desde su encabezado, con la
  flecha en el color de la marca después del título (antes, en una de números), y «Otras» siempre al final (264). Estados nuevos,
  como `FRM-Tablero`: «Una tarjeta como tabla» («Quién cargó» por Respuestas, de mayor a menor, con ↕ en «Persona» al pasar el
  mouse) y «La tabla, ordenada por persona» (de la A a la Z, con «Otras» al final).
- `M-FRM-Tablero-19`: los mismos números en una caja, de a dos, cada uno con su nombre (263), y el estado nuevo «Una tarjeta como
  tabla», como `M-FRM-Tablero`: la vista bajada hasta «Motivo» y «Quién cargó» como tabla (264).
- `FRM-Tablero-21` y `M-FRM-Tablero-21`: lo mismo con «Monto estimado», y la tarjeta «Por estado» por el orden del circuito
  (Recibida, Por aprobar, Aprobada y Rechazada, sin las anuladas), en sus barras y en su tabla, que ordena por «Estado», con su punto y
  su palabra (264). Estado nuevo en los dos: «Por estado, como tabla» (en el teléfono, la vista bajada hasta esa tarjeta).
- `Cuenta-21`: «Vincular» de una organización sin vincular pasa a su ⋮ (261), con el estado nuevo «Sin vincular: su ⋮»; «Abrir el
  chat» es un enlace al chat de la organización, porque lleva a otro lado (261). Como `Cuenta-Base2`: «Idioma y región» y «Zona
  horaria» en la pieza (262), «Vincular» de Google en su ⋮ (261) y el teléfono con «Sin verificar».
- `M-Cuenta-21`: cada organización del chat es una tarjeta con «Estado» y «Avisos», cada uno con su nombre (263), con el ⋮ de la que
  está sin vincular (su hoja, en el estado nuevo «Sin vincular: su ⋮») y «Abrir el chat» como enlace (261). La (i) de los avisos se
  abre como tooltip sobre el control, sin la hoja chica (211). Como la compu: el idioma y la zona en la pieza, «Vincular» de Google
  en su ⋮ y el teléfono con «Sin verificar».
- `WA-Plantilla-Nueva-21` y `M-WA-Plantilla-Nueva-21`: «Encabezado» en la pieza (262), y también «Tipo», que es elegir una de dos;
  estado nuevo «Encabezado, abierto» (en la compu, la lista debajo del campo; en el teléfono, a pantalla completa). «Así llega», la
  vista previa que imita WhatsApp, no cambia.

Cambia los tableros en su lugar; no corre dos veces (el bloque `<style data-t3b="e21-tableros">` lo marca). Al final corre
`traspaso10_piezas_1004.py --tableros <los ocho>`, que pone la escala de la compu (el CSS nuevo va con las medidas de antes), y
después parte en dos grupos el panel «Gestión de formularios» (275) de `FRM-Tablero-19` y `FRM-Tablero-21`, con la pieza de
`e14_panel_1004.py` (su `partir` no espera el número de «Formularios» que la E21 suma al panel: el de acá lo acepta).

Uso: `python e21_tableros_1004.py`.
"""
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12e  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_panel_1004 as e14p  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = '<style data-t3b="e21-tableros">'
leer, escribir, una, fin_sc_if, props = e12l.leer, e12l.escribir, e12l.una, e12l.fin_sc_if, e12l.props
sc_ifs, renombrar, sumar_estados = e12e.sc_ifs, e12e.renombrar, e12e.sumar_estados
fin_div = b2.fin_div

TABLEROS = ["FRM-Tablero-19", "M-FRM-Tablero-19", "FRM-Tablero-21", "M-FRM-Tablero-21", "Cuenta-21", "M-Cuenta-21",
            "WA-Plantilla-Nueva-21", "M-WA-Plantilla-Nueva-21"]
CON_PANEL = ["FRM-Tablero-19", "FRM-Tablero-21"]


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def para_aprobar(t):
    m = re.search(r"<title>([^<]*)</title>", t)
    assert "para aprobar" not in m.group(1)
    return t[:m.end(1)] + " · para aprobar" + t[m.end(1):]


def cambiar_divs(t, inicio, nuevo):
    """Cambia cada `<div …>` que empieza con `inicio` por `nuevo(viejo)`, de atrás para adelante. Devuelve (t, cuántos)."""
    pos = [m.start() for m in re.finditer(re.escape(inicio), t)]
    for i in reversed(pos):
        j = fin_div(t, i)
        t = t[:i] + nuevo(t[i:j]) + t[j:]
    return t, len(pos)


# ---------------------------------------------------------------------------------------------------------------- el tablero
# La forma de `FRM-Tablero` y `M-FRM-Tablero` (tanda 3A): las mismas clases y medidas, escritas acá con las de antes de la escala;
# la pasada de las piezas las achica en la compu y el teléfono las conserva.
CSS_TABLERO = """
/* 263 · Los números de arriba, como `FRM-Tablero`: «Respuestas» y la caja de cada pregunta de número con el total, el promedio, el
   mínimo y el máximo, cada uno con su nombre y ninguno debajo de otro. */
.tb-kpis.e15-kpis { display: flex; flex-wrap: wrap; gap: 16px; }
.e15-kpis .e15-resp { flex: 0 0 200px; box-sizing: border-box; }
.e15-kpis .e15-g { flex: 1 1 560px; min-width: 0; }
.tb-kpi.e15-g .gt { font-size: 13px; font-weight: 600; color: var(--t1); }
.e15-g .cel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 4px; }
.e15-g .c { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 0 16px; box-shadow: inset 1px 0 0 var(--borde); }
.e15-g .c:first-child { padding-left: 0; box-shadow: none; }

/* 264 · Una tarjeta como tabla, como `FRM-Tablero`: ordena por sus columnas desde su encabezado, con la flecha en el color de la
   marca después del título (antes, en una de números); los números a la derecha, una línea fina entre columnas (137) y «Otras»
   siempre al final. */
.e15-tt { display: grid; grid-template-columns: minmax(0, 1fr) 112px 64px; border: 1px solid var(--borde); border-radius: 3px; font-size: 13px; }
.e15-tt > span { min-width: 0; padding: 8px 12px; border-top: 1px solid var(--borde); line-height: 1.4; overflow-wrap: anywhere; }
.e15-tt > span:not(:nth-child(3n+1)) { box-shadow: inset 1px 0 0 var(--borde); }
.e15-tt > .h { border-top: 0; background: oklch(0.945 0.027 95); color: var(--t2); font-weight: 600; white-space: nowrap; cursor: pointer; }
.e15-tt > .h.b2-hov { background: oklch(0.92 0.03 95); }
.e15-tt > .r { text-align: right; font-variant-numeric: tabular-nums; }
.e15-tt > .otras { color: var(--t2); }
.b2-fl { margin-left: 5px; color: var(--marca-tx); font-weight: 700; }
.b2-fl.hov { color: var(--t3); font-weight: 400; }
"""
# E19 · Un monto con su moneda («$ 1.066.650,00») no entra en un cuarto de la caja con la letra de `FRM-Tablero`: los números de
# arriba van un punto más chicos, los dos iguales.
CSS_MONTO = """
/* E19 · Los números de un monto, con su moneda: un punto más chicos, para que cada uno entre en su lugar sin cortarse. */
.e15-kpis .tb-kpi b { font-size: 22px; }
"""
CSS_MONTO_TEL = """
/* E19 · En el teléfono, el monto con su moneda entra en media caja con dos puntos menos. */
.tb-tel .e15-g .c b { font-size: 18px; }
"""
CSS_TABLERO_TEL = """
/* 263 · Los números de arriba en el teléfono, como `M-FRM-Tablero`: la caja de cada pregunta de número con cada dato nombrado, de a dos. */
.tb-kpis.t2.e15-kpis { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
.tb-kpi.e15-g .gt { font-size: 14px; font-weight: 600; color: var(--t1); }
.e15-g .cel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px 14px; margin-top: 6px; }
.e15-g .c { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tb-tel .e15-g .c b { font-size: 20px; }

/* 264 · Una tarjeta como tabla, en el teléfono, como `M-FRM-Tablero`. */
.e15-tt { display: grid; grid-template-columns: minmax(0, 1fr) 104px 56px; border: 1px solid var(--borde); border-radius: 10px; font-size: 14px; }
.e15-tt > span { min-width: 0; padding: 10px 10px; border-top: 1px solid var(--borde); line-height: 1.35; overflow-wrap: anywhere; }
.e15-tt > span:not(:nth-child(3n+1)) { box-shadow: inset 1px 0 0 var(--borde); }
.e15-tt > .h { border-top: 0; background: oklch(0.945 0.027 95); color: var(--t2); font-size: 13px; font-weight: 600; white-space: nowrap; }
.e15-tt > .r { text-align: right; font-variant-numeric: tabular-nums; }
.e15-tt > .otras { color: var(--t2); }
.b2-fl { margin-left: 5px; color: var(--marca-tx); font-weight: 700; }
"""

MEDIDAS = ["Total", "Promedio", "Mínimo", "Máximo"]


def kpis(respuestas, pregunta, valores, tel=False):
    celdas = "".join(f'<div class="c"><span>{k}</span><b>{v}</b></div>' for k, v in zip(MEDIDAS, valores))
    return (f'<div class="tb-kpis{" t2" if tel else ""} e15-kpis"><div class="tb-kpi e15-resp"><span>Respuestas</span><b>{respuestas}</b></div>'
            f'<div class="tb-kpi e15-g" role="group" aria-label="{pregunta}"><span class="gt">{pregunta}</span>'
            f'<div class="cel">{celdas}</div></div></div>')


def tabla(aria, columnas, filas, por, sentido, hover=None):
    """Una tarjeta como tabla (264), con la forma de `FRM-Tablero`: `columnas` [(nombre, es_número)], ordenada por `por` en
    `sentido`, con ↕ al pasar el mouse sobre la columna `hover`; «Otras» va siempre al final."""
    flecha = "↑" if sentido == "ascending" else "↓"
    celdas = []
    for nombre, num in columnas:
        clase = "h" + (" r" if num else "") + (" b2-hov" if nombre == hover else "")
        if nombre == por and num:
            celdas.append(f'<span class="{clase}" role="columnheader" aria-sort="{sentido}"><span class="b2-fl" aria-hidden="true" '
                          f'style="margin: 0 5px 0 0;">{flecha}</span>{nombre}</span>')
        elif nombre == por:
            celdas.append(f'<span class="{clase}" role="columnheader" aria-sort="{sentido}">{nombre}<span class="b2-fl" aria-hidden="true">'
                          f'{flecha}</span></span>')
        elif nombre == hover:
            celdas.append(f'<span class="{clase}" role="columnheader">{nombre}<span class="b2-fl hov" aria-hidden="true">↕</span></span>')
        else:
            celdas.append(f'<span class="{clase}" role="columnheader">{nombre}</span>')
    for fila in filas:
        for k, ((nombre, num), valor) in enumerate(zip(columnas, fila)):
            if num:
                celdas.append(f'<span class="r" role="cell">{valor}</span>')
            elif k == 0 and valor == "Otras":
                celdas.append('<span role="cell" class="otras">Otras</span>')
            else:
                celdas.append(f'<span role="cell">{valor}</span>')
    return f'<div class="e15-tt" role="table" aria-label="{aria}">{"".join(celdas)}</div>'


def tarjeta(t, titulo):
    """(inicio, fin) de la tarjeta `titulo`."""
    i = t.index(f'<div class="tb-card"><div class="tb-cab"><span><b>{titulo}</b>')
    return i, fin_div(t, i)


def como_tabla(card, tabla_html):
    """La misma tarjeta con su tabla en lugar del gráfico, sin el menú abierto de otro estado."""
    i = card.index('<div class="tb-cuerpo">')
    j = fin_div(card, i)
    card = card[:i] + f'<div class="tb-cuerpo">{tabla_html}</div>' + card[j:]
    return re.sub(r'<sc-if value="\{\{menu\w+\}\}" hint-placeholder-val="\{\{no\}\}">.*?</sc-if>', "", card, flags=re.S)


def vistas(t, titulo, grafico, tablas):
    """La tarjeta `titulo` como gráfico (`{{grafico}}`) y como cada tabla de `tablas` [(variable, tabla)], como `FRM-Tablero`: el
    encabezado de la tarjeta queda y su cuerpo cambia."""
    i, j = tarjeta(t, titulo)
    card = t[i:j]
    c = card.index('<div class="tb-cuerpo">')
    a = c + len('<div class="tb-cuerpo">')
    b = fin_div(card, c) - len("</div>")
    cuerpo = (f'<sc-if value="{{{{{grafico}}}}}" hint-placeholder-val="{{{{si}}}}">{card[a:b]}</sc-if>'
              + "".join(f'<sc-if value="{{{{{v}}}}}" hint-placeholder-val="{{{{no}}}}">{html}</sc-if>' for v, html in tablas))
    return t[:i] + card[:a] + cuerpo + card[b:] + t[j:]


def est_html(clase, texto):
    return f'<span class="w-est {clase}">{texto}</span>'


# «Por estado», por el orden del circuito (264): Recibida, Por aprobar, Aprobada y Rechazada, sin las anuladas.
ESTADOS = [("Recibida", "off", "4", "17%"), ("Por aprobar", "pend", "3", "13%"), ("Aprobada", "", "15", "62%"),
           ("Rechazada", "mal", "2", "8%")]
BARRAS_ESTADO = ('<div class="tb-hor">' + "".join(
    f'<div class="h"><span class="l" title="{n}">{n}</span><span class="pista"><i style="width: {p};"></i></span>'
    f'<span class="n">{c} · {p}</span></div>' for n, _, c, p in ESTADOS) + "</div>")
COLS_ESTADO = [("Estado", False), ("Respuestas", True), ("%", True)]
TABLA_ESTADO = tabla("Por estado", COLS_ESTADO, [(est_html(k, n), c, p) for n, k, c, p in ESTADOS], "Estado", "ascending")


def barras_por_estado(t):
    """Las barras de «Por estado», en el orden del circuito, en cada tarjeta que las tiene."""
    n = 0
    for m in reversed(list(re.finditer(re.escape('<div class="tb-card"><div class="tb-cab"><span><b>Por estado</b>'), t))):
        j = fin_div(t, m.start())
        card = t[m.start():j]
        a = card.index('<div class="tb-hor">')
        card = card[:a] + BARRAS_ESTADO + card[fin_div(card, a):]
        t = t[:m.start()] + card + t[j:]
        n += 1
    return t, n


# Lo de cada tablero: la pregunta de número con sus cuatro medidas y las tablas de sus estados.
E19 = {"respuestas": "45", "pregunta": "Total", "valores": ["$ 1.066.650,00", "$ 355.550,00", "$ 143.000,00", "$ 624.900,00"]}
E21 = {"respuestas": "24", "pregunta": "Monto estimado", "valores": ["1.217.381,00", "50.724,21", "0,00", "212.000,00"]}
COLS_QUIEN = [("Persona", False), ("Respuestas", True), ("%", True)]
QUIEN = [("Paula Méndez", "13", "29%"), ("Tomás Acosta", "11", "24%"), ("Florencia Fernández de la Fuente", "8", "18%"),
         ("Lucía Fernández", "6", "13%"), ("Martín Paz", "4", "9%"), ("Otras", "3", "7%")]
QUIEN_POR_NOMBRE = sorted(QUIEN[:-1]) + QUIEN[-1:]
TABLA_QUIEN_CANT = tabla("Quién cargó", COLS_QUIEN, QUIEN, "Respuestas", "descending", hover="Persona")
TABLA_QUIEN_NOMBRE = tabla("Quién cargó", COLS_QUIEN, QUIEN_POR_NOMBRE, "Persona", "ascending")
CON_DATOS = "conDatos: ['Por día', 'Una barra: su cartel', 'Por semana', 'Una tarjeta: menú', 'Agregar gráfico: menú'].includes(e),"


def numeros(t, datos, tel=False):
    t, n = cambiar_divs(t, '<div class="tb-kpis', lambda _: kpis(datos["respuestas"], datos["pregunta"], datos["valores"], tel))
    assert n >= 1
    assert "<small>promedio" not in t
    return t


def con_estados(t, nuevos):
    """Los estados nuevos van después de «Una tarjeta: menú», como en `FRM-Tablero`."""
    def cambiar(p):
        ops = p["estado"]["options"]
        k = ops.index("Una tarjeta: menú") + 1
        ops[k:k] = nuevos
    t = props(t, cambiar)
    lista = ", ".join(f"'{n}'" for n in nuevos)
    return una(t, CON_DATOS, CON_DATOS.replace("'Agregar gráfico: menú']", f"'Agregar gráfico: menú', {lista}]"))


def frm_tablero_19():
    t, nl = leer("FRM-Tablero-19")
    t = para_aprobar(con_css(t, CSS_TABLERO + CSS_MONTO))
    t = numeros(t, E19)
    t = vistas(t, "Quién cargó", "grafQuien", [("tablaCant", TABLA_QUIEN_CANT), ("tablaNom", TABLA_QUIEN_NOMBRE)])
    t = con_estados(t, ["Una tarjeta como tabla", "La tabla, ordenada por persona"])
    t = una(t, "'La tabla, ordenada por persona'].includes(e),",
            "'La tabla, ordenada por persona'].includes(e),\n"
            "      tablaCant: e === 'Una tarjeta como tabla', tablaNom: e === 'La tabla, ordenada por persona', "
            "grafQuien: e !== 'Una tarjeta como tabla' && e !== 'La tabla, ordenada por persona',")
    escribir("FRM-Tablero-19", t, nl)


def frm_tablero_21():
    t, nl = leer("FRM-Tablero-21")
    t = para_aprobar(con_css(t, CSS_TABLERO))
    t = numeros(t, E21)
    t, n = barras_por_estado(t)
    assert n == 1, n
    t = vistas(t, "Por estado", "grafEstado", [("tablaEstado", TABLA_ESTADO)])
    t = con_estados(t, ["Por estado, como tabla"])
    t = una(t, "'Por estado, como tabla'].includes(e),",
            "'Por estado, como tabla'].includes(e),\n"
            "      tablaEstado: e === 'Por estado, como tabla', grafEstado: e !== 'Por estado, como tabla',")
    escribir("FRM-Tablero-21", t, nl)


def estado_tabla_tel(t, nombre_estado, cuerpo):
    """Suma el estado de una tarjeta como tabla, como `M-FRM-Tablero`: el de «Por día» con la vista bajada, que empieza en la
    tarjeta de antes. `cuerpo(hijos)` arma lo que se ve con las piezas del cuerpo de «Por día»."""
    t, sv = sumar_estados(t, [("Una tarjeta: menú", [nombre_estado])], [nombre_estado])
    (a, b), = sc_ifs(t, "s0")
    bloque = renombrar(t[a:b], "s0", sv[nombre_estado])
    i = bloque.index('<div class="ap-cuerpo ap-gris tb-tel">')
    j = fin_div(bloque, i)
    ab, hijos, ci = b2.hijos(bloque[i:j])
    bloque = bloque[:i] + ab + "".join(cuerpo(hijos)) + ci + bloque[j:]
    return una(t, '<span class="ap-raya"></span>', bloque + '<span class="ap-raya"></span>')


def de(hijos, titulo):
    return next(h for h in hijos if h.startswith(f'<div class="tb-card"><div class="tb-cab"><span><b>{titulo}</b>'))


def m_frm_tablero_19():
    t, nl = leer("M-FRM-Tablero-19")
    t = para_aprobar(con_css(t, CSS_TABLERO_TEL + CSS_MONTO_TEL))
    t = numeros(t, E19, tel=True)
    keb = re.search(r'aria-label="Acciones de Motivo" aria-haspopup="menu">(<svg.*?</svg>)', t, re.S).group(1)
    quien = ('<div class="tb-card"><div class="tb-cab"><span><b>Quién cargó</b><small>Cantidad por persona</small></span>'
             f'<button type="button" class="ib" aria-label="Acciones de Quién cargó" aria-haspopup="menu">{keb}</button></div>'
             f'<div class="tb-cuerpo">{TABLA_QUIEN_CANT}</div></div>')
    # Como `M-FRM-Tablero`: la vista bajada hasta «Motivo», y «Quién cargó» como tabla, por Respuestas.
    t = estado_tabla_tel(t, "Una tarjeta como tabla", lambda hijos: [de(hijos, "Motivo"), quien])
    escribir("M-FRM-Tablero-19", t, nl)


def m_frm_tablero_21():
    t, nl = leer("M-FRM-Tablero-21")
    t = para_aprobar(con_css(t, CSS_TABLERO_TEL))
    t = numeros(t, E21, tel=True)
    t, n = barras_por_estado(t)
    assert n == 2, n
    # La vista bajada: desde «Cuántas llegaron», con «Por estado» como tabla.
    t = estado_tabla_tel(t, "Por estado, como tabla",
                         lambda hijos: [de(hijos, "Cuántas llegaron, por día"), como_tabla(de(hijos, "Por estado"), TABLA_ESTADO),
                                        de(hijos, "¿Se concretó la venta?"), de(hijos, "Motivo")])
    escribir("M-FRM-Tablero-21", t, nl)


# ---------------------------------------------------------------------------------------------------------------- Mi cuenta
WA_DELTA = "https://wa.me/5491155550100"  # el número conectado de Grupo Delta (`M-Filas-Base2`, «Números»)
LLEGAN = "Te llegan hasta 24 horas después de tu último mensaje a Grupo Delta."
PLANTILLA = ("Pasaron 24 horas desde tu último mensaje a Grupo Delta: te llegan solo los avisos con una plantilla aprobada. "
             "Si le escribís, vuelven a llegar todos.")
SVG_VINCULAR = ('<svg class="mi-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
                'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/>'
                '<path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>')

CSS_CUENTA = b2.css() + """
/* 261 · Lo de una fila, en su ⋮: «Vincular» de una organización y de Google (el menú de una fila de «Mi cuenta», `Cuenta-Metodo`). */
.o-fila-menu { position: relative; }
.o-mn { position: absolute; z-index: 7; right: 44px; top: 0; width: 220px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); overflow: hidden; }
.o-mn .it { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 14px; font-size: 13.5px; color: var(--t1); }
.o-mn .it .mi-ic { flex: none; color: var(--t2); }
.o-mn .it + .it { border-top: 1px solid var(--borde); }
.w-caja:has(.o-mn) { overflow: visible; }
/* «Abrir el chat» lleva a otro lado: un enlace, no un botón (261). */
.w-it > a.cb-enl { flex: none; margin-right: 8px; font-size: 13px; font-weight: 600; text-decoration: none; }
/* La pieza en «Tus datos» (262), como `Cuenta-Base2`. */
.w-cmp .b2-env { width: 100%; }
"""

CSS_CUENTA_TEL = b2.css(tel=True) + """
/* 263 · Cada organización del chat, una tarjeta con «Estado» y «Avisos», cada uno con su nombre. */
.ap-grupo.b2-vis > .b2-tj:first-child { border-radius: 14px 14px 0 0; }
.ap-grupo.b2-vis > .b2-tj:last-child { border-bottom: 0; border-radius: 0 0 14px 14px; }
.e2-chat .b2-tj-a { display: flex; }
.e2-chat .dl .w-est { font-size: 14.5px; color: var(--t1); }
/* 211 · La (i) se abre con un toque, como tooltip sobre el control, con 44 para tocar. */
.e2-chat .b2-i { padding: 14px; margin: -14px -14px -14px -9px; }
.e2-chat .b2-i .acc-tip { bottom: calc(100% - 8px); }
/* 261 · «Abrir el chat» lleva a otro lado: un enlace. */
.e2-lnk { display: inline-flex; align-items: center; min-height: 44px; margin: 2px 0 -8px; color: var(--marca-tx); font-size: 15px; font-weight: 600; text-decoration: none; }
/* La pieza en «Tus datos» (262). */
.ap-cmp .b2-env { width: 100%; }
"""


def svg_tras(t, ancla):
    i = t.index(ancla) + len(ancla)
    return t[i:t.index("</svg>", i) + 6]


def cuenta_21():
    t, nl = leer("Cuenta-21")
    t = para_aprobar(con_css(t, CSS_CUENTA))
    keb = svg_tras(t, 'aria-label="Acciones de lucia.fernandez@delta.ejemplo.com">')

    # «Idioma y región» y «Zona horaria», en la pieza (262), como `Cuenta-Base2`.
    t, n = re.subn(r'<div class="ct">Español \(Argentina\) <svg.*?</svg></div>', lambda m: b2.campo("Español (Argentina)", aria="Idioma y región"), t, flags=re.S)
    assert n == 1, n
    t, n = re.subn(r'<div class="ct">Buenos Aires \(GMT−3\) <svg.*?</svg></div>',
                   lambda m: b2.campo(b2.zona("Buenos Aires", "Argentina", "GMT−3"), aria="Zona horaria"), t, flags=re.S)
    assert n == 1, n

    # Google sin vincular: «Vincular» en su ⋮ (261), como `Cuenta-Base2`; el teléfono, «Sin verificar».
    t = una(t, '<span class="w-est off">Sin vincular</span></span><button type="button" class="cb cb-sec ch">Vincular</button></div></sc-if><sc-if value="{{googleCon}}"',
            '<span class="w-est off">Sin vincular</span></span><button type="button" class="ib" aria-label="Acciones de Google" aria-haspopup="menu" '
            f'aria-expanded="false">{keb}</button></div></sc-if><sc-if value="{{{{googleCon}}}}"')
    t = una(t, '<span class="dato"><b>011 15-5555-4521</b></span>',
            '<span class="dato"><b>011 15-5555-4521</b><span class="w-est pend">Sin verificar</span></span>')

    # El chat sin vincular: «Vincular» en el ⋮ de la organización (261), con su menú en el estado nuevo.
    i = t.index('<sc-if value="{{chatSinVincular}}"')
    j = fin_sc_if(t, i)
    fila = t[i:j]
    fila = una(fila, '<div class="w-it">', '<div class="w-it o-fila-menu">')
    menu = (f'<sc-if value="{{{{chatMenu}}}}" hint-placeholder-val="{{{{no}}}}"><div class="o-mn" role="menu" aria-label="Acciones de Grupo Delta" '
            f'style="top: 46px;"><span class="it" role="menuitem">{SVG_VINCULAR} Vincular</span></div></sc-if>')
    fila = una(fila, '<button type="button" class="cb cb-sec ch">Vincular</button>',
               '<button type="button" class="ib" aria-label="Acciones de Grupo Delta" aria-haspopup="menu" '
               f'aria-expanded="{{{{chatMenuExp}}}}">{keb}</button>{menu}')
    t = t[:i] + fila + t[j:]

    # Sin chat todavía: «Abrir el chat» es un enlace al chat de la organización (261).
    t = una(t, '<button type="button" class="cb cb-sec ch">Abrir el chat</button>',
            f'<a class="cb cb-enl" href="{WA_DELTA}" target="_blank" rel="noopener">Abrir el chat</a>')
    assert ">Vincular</button>" not in t

    # El estado nuevo y sus valores.
    t = props(t, lambda p: p["chat"]["options"].insert(p["chat"]["options"].index("Sin vincular") + 1, "Sin vincular: su ⋮"))
    t = una(t, "chatLlegan: !['Pasadas las 24 horas', 'Sin vincular', 'Sin chat todavía'].includes(this.props.chat),",
            "chatLlegan: !['Pasadas las 24 horas', 'Sin vincular', 'Sin vincular: su ⋮', 'Sin chat todavía'].includes(this.props.chat),")
    t = una(t, "chatSinVincular: this.props.chat === 'Sin vincular',",
            "chatSinVincular: ['Sin vincular', 'Sin vincular: su ⋮'].includes(this.props.chat),\n"
            "      chatMenu: this.props.chat === 'Sin vincular: su ⋮', chatMenuExp: this.props.chat === 'Sin vincular: su ⋮' ? 'true' : 'false',")
    escribir("Cuenta-21", t, nl)


def tarjeta_chat(nombre, estado, avisos, info="", keb="", enlace=""):
    """Una organización del chat en el teléfono (263): el nombre, «Estado» y «Avisos», cada uno con su nombre. No abre nada:
    lo que se hace con ella va en su ⋮ (261), y «Abrir el chat», que lleva a otro lado, es un enlace."""
    boton = f'<button type="button" class="keb" aria-label="Acciones de {nombre}" aria-haspopup="menu">{keb}</button>' if keb else ""
    lnk = f'<a class="e2-lnk" href="{WA_DELTA}">{enlace}</a>' if enlace else ""
    return (f'<div class="b2-tj e2-chat"><div class="b2-tj-a"><span class="cu"><span class="nm">{nombre}</span><span class="dl">'
            f'<span class="c"><span class="k">Estado</span><span class="v">{estado}</span></span>'
            f'<span class="c todo"><span class="k">Avisos</span><span class="v">{avisos}{info}</span></span></span>{lnk}</span></div>{boton}</div>')


def m_cuenta_21():
    t, nl = leer("M-Cuenta-21")
    t = para_aprobar(con_css(t, CSS_CUENTA_TEL))
    keb = svg_tras(t, 'class="ap-ib" aria-label="Acciones de lucia.fernandez@delta.ejemplo.com">')

    # «Idioma y región» y «Zona horaria», en la pieza (262).
    t, n = re.subn(r'<div class="ct">Español \(Argentina\)<svg.*?</svg></div>', lambda m: b2.campo("Español (Argentina)", aria="Idioma y región"), t, flags=re.S)
    assert n == 5, n
    t, n = re.subn(r'<div class="ct">Buenos Aires \(GMT−3\)<svg.*?</svg></div>',
                   lambda m: b2.campo(b2.zona("Buenos Aires", "Argentina", "GMT−3"), aria="Zona horaria"), t, flags=re.S)
    assert n == 5, n

    # Google: «Vincular» en su ⋮ (261); el teléfono, «Sin verificar».
    t, n = re.subn(re.escape('<b>Google</b><span>Sin vincular</span></span><span class="acc-t">Vincular</span>'),
                   f'<b>Google</b><span>Sin vincular</span></span><button type="button" class="ap-ib" aria-label="Acciones de Google">{keb}</button>', t)
    assert n == 5, n
    t, n = re.subn(re.escape('<b>011 15-5555-4521</b></span>'), '<b>011 15-5555-4521</b><span><span class="w-est amb">Sin verificar</span></span></span>', t)
    assert n == 5, n

    # Cada organización del chat, una tarjeta (263); la (i), como tooltip (211).
    beta = tarjeta_chat("Beta S.R.L.", est_html("amb", "Suspendida"), "No llegan")
    vinc = est_html("", "Vinculado")
    chats = {
        "c0": tarjeta_chat("Grupo Delta", vinc, "Llegan hasta el 16/10/2026, 09:40", b2.info(LLEGAN, tip_clase="b2-tip-der")),
        "c1": tarjeta_chat("Grupo Delta", vinc, "Solo con plantilla", b2.info(PLANTILLA, tip_clase="b2-tip-der")),
        "c2": tarjeta_chat("Grupo Delta", vinc, "Solo con plantilla", b2.info(PLANTILLA, abierto=True, tip_clase="b2-tip-der")),
        "c3": tarjeta_chat("Grupo Delta", est_html("off", "Sin vincular"), "No llegan", keb=keb),
        "c4": tarjeta_chat("Grupo Delta", est_html("off", "Sin chat todavía"), "No llegan", enlace="Abrir el chat"),
    }
    viejo_grupo = '<span class="ap-gtit">Chat de WhatsApp</span><div class="ap-grupo">'
    for v, html in chats.items():
        (a, b), = sc_ifs(t, v)
        bloque = t[a:b]
        i = bloque.index(viejo_grupo)
        k = i + len('<span class="ap-gtit">Chat de WhatsApp</span>')
        j = fin_div(bloque, k)
        bloque = bloque[:i] + f'<span class="ap-gtit">Chat de WhatsApp</span><div class="ap-grupo b2-vis">{html}{beta}</div>' + bloque[j:]
        if v == "c2":
            # Sale la hoja chica de la (i): el motivo va en el tooltip (211).
            h = bloque.index('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Solo con plantilla">')
            h2 = fin_div(bloque, h + len('<div class="ap-velo"></div>'))
            bloque = bloque[:h] + bloque[h2:]
        t = t[:a] + bloque + t[b:]
    assert "acc-t\">Vincular" not in t and "acc-t\">Abrir el chat" not in t and "Hasta cuándo llegan" not in t

    # El estado nuevo: la de sin vincular con su ⋮ abierto, en su hoja (261).
    (a, b), = sc_ifs(t, "c3")
    bloque = renombrar(t[a:b], "c3", "c5")
    hoja = ('<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de Grupo Delta"><span class="asa"></span>'
            '<div class="hc" style="padding-right: 20px;"><h2>Grupo Delta</h2></div><div class="hb" style="padding-bottom: 34px;">'
            '<div class="ap-acciones"><span role="menuitem">Vincular</span></div></div></div>')
    assert bloque.endswith("</div></sc-if>")
    bloque = bloque[:-len("</div></sc-if>")] + hoja + "</div></sc-if>"
    bloque = bloque.replace(f'<button type="button" class="keb" aria-label="Acciones de Grupo Delta" aria-haspopup="menu">',
                            f'<button type="button" class="keb" aria-label="Acciones de Grupo Delta" aria-haspopup="menu" aria-expanded="true">', 1)
    t = una(t, '<span class="ap-raya"></span>', bloque + '<span class="ap-raya"></span>')
    t = props(t, lambda p: p["estado"]["options"].insert(p["estado"]["options"].index("Sin vincular") + 1, "Sin vincular: su ⋮"))
    t = una(t, '      c4: e === "Sin chat todavía",\n', '      c4: e === "Sin chat todavía",\n      c5: e === "Sin vincular: su ⋮",\n')
    escribir("M-Cuenta-21", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la plantilla
CSS_PLANTILLA = b2.css() + """
/* 262 · «Tipo» y «Encabezado», en la pieza; la lista abierta, adentro del diálogo. */
.w-dlg .w-cmp .b2-env { width: 100%; }
.w-dlg:has(.b2-pkl) { overflow: visible; }
.w-dlg:has(.b2-pkl) .dc { border-radius: 12px 12px 0 0; }
"""
CSS_PLANTILLA_TEL = b2.css(tel=True) + """
/* 262 · «Tipo» y «Encabezado», en la pieza; abierta, a pantalla completa. */
.ap-cmp .b2-env { width: 100%; }
"""
ENCABEZADOS = ["Sin encabezado", "Documento (el PDF)"]


def plantilla(nombre, seg, abrir):
    """`abrir(bloque)`: el último bloque del estado nuevo (el del diálogo o la hoja), con la pieza del encabezado abierta."""
    t, nl = leer(nombre)
    t = para_aprobar(con_css(t, CSS_PLANTILLA_TEL if nombre.startswith("M-") else CSS_PLANTILLA))
    t, n = re.subn(re.escape(f'<div class="{seg}"><span class="on">Utilidad</span><span>Marketing</span></div>'),
                   b2.campo("Utilidad", aria="Tipo"), t)
    assert n == 7, n
    t, n = re.subn(re.escape(f'<div class="{seg}"><span>Sin encabezado</span><span class="on">Documento (el PDF)</span></div>'),
                   b2.campo("Documento (el PDF)", aria="Encabezado"), t)
    assert n == 1, n
    t, n = re.subn(re.escape(f'<div class="{seg}"><span class="on">Sin encabezado</span><span>Documento (el PDF)</span></div>'),
                   b2.campo("Sin encabezado", aria="Encabezado"), t)
    assert n == 6, n
    assert seg not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S).replace(f'.{seg}', "")

    # «Encabezado, abierto»: el de «Comprobante, con el PDF» con la pieza del encabezado abierta.
    bloques = sc_ifs(t, "e0")
    nuevos = [renombrar(t[a:b], "e0", "e7") for a, b in bloques]
    nuevos[-1] = abrir(nuevos[-1])
    fines = [b for _, b in sc_ifs(t, "e6")]
    assert len(fines) == len(nuevos)
    for fin, nuevo in reversed(list(zip(fines, nuevos))):
        t = t[:fin] + nuevo + t[fin:]
    t = props(t, lambda p: p["estado"]["options"].insert(2, "Encabezado, abierto"))
    t = una(t, '      e6: e === "Duplicada: «Pedido listo_2»",\n', '      e6: e === "Duplicada: «Pedido listo_2»",\n      e7: e === "Encabezado, abierto",\n')
    escribir(nombre, t, nl)


CERRADO = b2.campo("Documento (el PDF)", aria="Encabezado")


def wa_plantilla_nueva_21():
    lista = b2.lista([b2.op(o, elegida=o == "Documento (el PDF)", activa=o == "Documento (el PDF)") for o in ENCABEZADOS])
    # La lista, debajo del campo, adentro del diálogo.
    plantilla("WA-Plantilla-Nueva-21", "o-seg",
              lambda bloque: una(bloque, CERRADO, b2.campo("Documento (el PDF)", abierto=True, aria="Encabezado", extra=lista)))


def m_wa_plantilla_nueva_21():
    pieza = b2.pk_tel("Encabezado", [(o, None, o == "Documento (el PDF)", None) for o in ENCABEZADOS])

    def abrir(bloque):
        # El campo queda marcado y la pieza ocupa la pantalla, encima de la hoja (262): va al final del estado, en la pantalla.
        bloque = una(bloque, CERRADO, b2.campo("Documento (el PDF)", abierto=True, aria="Encabezado"))
        assert bloque.endswith("</sc-if>")
        return bloque[:-len("</sc-if>")] + pieza + "</sc-if>"
    plantilla("M-WA-Plantilla-Nueva-21", "ap-seg2", abrir)


# ---------------------------------------------------------------------------------------------------------------- el pase
def partir(panel_html):
    """`partir` de `e14_panel_1004.py`; en la E21, «Formularios» lleva su número («Formularios 4»), que esa pieza no espera: la
    línea va igual antes de «Catálogos»."""
    if re.search(r'Formularios <span class="cnt">\d+</span></a>', panel_html) and e14p.SEP not in panel_html:
        i = re.search(r'Formularios <span class="cnt">\d+</span></a>', panel_html).end()
        m = e14p.CATALOGOS.search(panel_html)
        assert m and m.start() >= i, "el panel no tiene «Formularios» antes de «Catálogos»"
        return panel_html[:m.start()] + e14p.SEP + panel_html[m.start():]
    return e14p.partir(panel_html)


def panel():
    """275 · El panel de «Gestión de formularios» en dos grupos, como `main` de `e14_panel_1004.py`, con estos tableros."""
    for nombre in CON_PANEL:
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        nuevo, n = e14p.PANEL.subn(lambda m: partir(m.group(0)), t)
        assert n, f"{nombre} no tiene el panel"
        if e14p.BLOQUE not in nuevo:
            nuevo = nuevo.replace("</helmet>", e14p.CSS + "</helmet>", 1)
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
        print("ok panel", nombre, n, "(sin cambios)" if nuevo == t else "")


if __name__ == "__main__":
    hechos = []
    for nombre, f in (("FRM-Tablero-19", frm_tablero_19), ("M-FRM-Tablero-19", m_frm_tablero_19),
                      ("FRM-Tablero-21", frm_tablero_21), ("M-FRM-Tablero-21", m_frm_tablero_21),
                      ("Cuenta-21", cuenta_21), ("M-Cuenta-21", m_cuenta_21),
                      ("WA-Plantilla-Nueva-21", wa_plantilla_nueva_21), ("M-WA-Plantilla-Nueva-21", m_wa_plantilla_nueva_21)):
        if MARCA in leer(nombre)[0]:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        f()
        hechos.append(nombre)
    if hechos:
        subprocess.run([sys.executable, str(pathlib.Path(__file__).resolve().parent / "traspaso10_piezas_1004.py"),
                        "--tableros", ",".join(TABLEROS)], check=True)
    panel()
