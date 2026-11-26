"""Lo que falta, las sugerencias y la cadena de la E23 y la E25 con el traspaso 18 (tanda 3B de Diseño, grupo K, 2026-11-26): diez
tableros redibujados en su lugar, con la forma de los aprobados de la E12 a la E14 (`FRM-Formularios`, `M-FRM-Formularios`,
`FRM-Editor`, `FRM-Catalogo-14`) y de los redibujados de la E21 (`FRM-Respuesta-Aprobacion` y `FRM-Editor-Reglas`).

**En todos** (211, 261, 262, 263 y 264): nada va debajo de otro dato; lo de una fila va en su ⋮; lo apagado dice su motivo en un
tooltip sobre el control, también en el teléfono; todo lo que se elige va en la pieza, y «Ordenar por» va último en la barra (en el
teléfono, arriba de la lista, a todo el ancho). El panel de «Gestión de formularios» no se toca: lo parte en dos grupos, con
«Biblioteca», quien lanzó la tanda.

**Por tablero:**
- `WA-Preguntas-Sin-Respuesta`, `FRM-Faltan` y `FRM-Faltan-25` (262 a 264 y la spec de la E23): la descripción gris que iba debajo
  del tema pasa a su columna, «Descripción», y el tema queda solo, en negrita (263). Toda columna ordena; sin orden elegido va la
  última pregunta (o el último pedido), de la más reciente a la más vieja, con la flecha en el color de la marca después del título;
  en una columna de números, antes, y los números a la derecha (137 y 264). El filtro «Estado» es un botón que abre la pieza, sin
  cantidades, con «Pendientes» primero y separado (262); la barra pierde el total (143) y la banda cuenta los temas y las preguntas o
  los pedidos del filtro elegido («1 tema sin revisar · 4 preguntas»). «Ordenar por», último y separado del filtro, dice el orden con
  palabras y abre la pieza con «Columna» y «Orden». Estados nuevos: «Ordenar por abierto» y «Ordenado por Tema» (de la A a la Z). En
  `FRM-Faltan-25`, «Armar con la IA» de cada tema deja de ser un botón con texto y pasa al ⋮, después de «Crear formulario» (261 y la
  spec de la E25); la fila queda solo con su ⋮.
- `M-WA-Preguntas-Sin-Respuesta` y `M-FRM-Faltan` (262 a 264): cada tema es una tarjeta con su ⋮ y cada dato nombrado
  (Descripción, a todo el ancho; Preguntas o Pedidos, Personas, la última y Estado), sin «4 preguntas · 3 personas · fecha»
  debajo del nombre (263); en Descartados, «Lo descartó» y «Descartado el» en lugar de Estado. «Ordenar por» arriba de la lista.
  Estados nuevos: «Filtros» (con «Estado» en la pieza), «Elegir el estado» (la pieza a pantalla completa, sin cantidades) y
  «Ordenar por» (con «Columna» y «Orden»), como `M-FRM-Formularios`. Sin teléfono de la E25 (decisión del 23/11).
- `FRM-Editor-Sugerencias` (262 y 258): «Formulario a sugerir», «Cómo se ofrece» (antes dos radios con su descripción), cada parte
  de «Solo si» y las dos preguntas de cada dato que pasa van en la pieza cerrada; los datos que pasan llevan arriba el nombre de cada
  formulario, como encabezado, y dejan de repetirlo adelante de cada pregunta («Visita · Cliente»). La descripción de cada manera de
  ofrecerlo queda en gris debajo de su nombre, en la lista abierta. Estados nuevos: «Cómo se ofrece abierto», «Hacia uno de la app»
  (una sugerencia hacia «Pedido de materiales», que se completa solo en la app, marcada como la que va hacia un dado de baja, con
  «Se completa solo en la app.» en su (i); no se ofrece y vuelve si lo pasan a WhatsApp) y «Solo en la app» (en un formulario que se
  completa solo en la app, la pestaña «Sugerencias» queda apagada con «Se completa solo en la app.» en su tooltip y conserva lo
  cargado; como una pestaña apagada no se abre, se dibuja en «Diseño», donde se elige «Dónde se completa», con la banda y el cuerpo
  del estado «Solo en la app» de `FRM-Editor-Asistente`, que por eso corre antes).
- `FRM-Editor-Asistente` (263, 262, 229 y 258): las preguntas en columnas, con «Tipo» y «Obligatoria» (como `FRM-Editor-21`);
  «Para quién es» en la pieza, y «Dónde se completa» al lado del prefijo. Estado nuevo «Solo en la app»: «Dónde se completa» dice
  «Solo en la app»; «Cuándo lo ofrece el asistente» queda apagado, con su texto (se conserva) y «Se completa solo en la app.» en el
  tooltip; la pestaña «Sugerencias», apagada; la banda, con «Publicar» (sin «Ver vista oficial») apagado hasta guardar, y la vista
  previa es la de la app, como en la E20.
- `FRM-Editor-Reglas-23` y `M-FRM-Reglas-23` (271, 283, 262 y 211): lo que se elige en la regla propuesta, en la pieza, como
  `FRM-Editor-Reglas`. Estado nuevo «Cupo del día agotado»: «Armar desde un texto» apagado con el texto del cupo del día en una
  organización (`LimitReached`, F13 de la base 2): dice que fue el cupo de hoy y cuándo vuelve, en la zona de la organización y
  nombrándola (283), distinto de «Se agotó el tope de IA del mes.». La (i) de «Qué tiene que pasar» suma que gasta el cupo del día.
  El motivo de «Armar desde un texto» apagado va en el tooltip arriba del control, también en «Tope de IA agotado» (211: en la compu
  iba debajo; en el teléfono, en una (i) al lado, que se va, y se abre con un toque).
- `FRM-Respuesta-Cadena` (266, 267 y 263): la vista rápida redibujada de la E21 (`e21_respuesta_1004.py`): la línea gris de quién y
  cuándo, «Rechazar» y «Aprobar» arriba de las pestañas «Respuesta» y «Actividad», y la respuesta con la forma del formulario. «Cómo
  empezó» va después de las zonas, como en ArquitecturaBase, con «La preparó» y «Por qué» en una lectura; «Ver los datos
  propuestos» abre una tabla con «Pregunta», «Propuso» y «Al completar» («Corregido»), sin la etiqueta junto al valor. La cadena de
  respuestas es una tabla con N°, Formulario, «La respondió», Recibida y Sugerencia, un dato por columna: deja «Tomás Acosta ·
  fecha» debajo del número; la respuesta que se mira, marcada, y las demás, con su número como enlace. No ordena: su orden es un
  dato (264). La planilla de atrás no cambia. Estado nuevo «Actividad»: el renglón «La mandó», con «El asistente» en «Quién» (267
  y la spec de la E23). El tablero crece a 1200 de alto, para leer la vista rápida entera.

Cambia los tableros en su lugar; no corre dos veces (el bloque `<style data-t3b="e23-formularios">` lo frena). Al final pasa
`traspaso10_piezas_1004.py --tableros <los diez>`, que pone la escala de la compu. Uso: `python e23_formularios_1004.py`.
"""
import pathlib
import re
import subprocess
import sys
import unicodedata

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_editor_1004 as e14e  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402
import e21_reglas_1004 as e21r  # noqa: E402
import e21_respuesta_1004 as e21  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
GRUPO = "e23-formularios"
MARCA = f'<style data-t3b="{GRUPO}">'
SUFIJO = " · para aprobar"
SVG = e21r.SVG
DIBUJO = e21r.DIBUJO
RAYA = '<span class="ap-raya"></span>'
TABLEROS = ["WA-Preguntas-Sin-Respuesta", "M-WA-Preguntas-Sin-Respuesta", "FRM-Faltan", "M-FRM-Faltan", "FRM-Faltan-25",
            "FRM-Editor-Sugerencias", "FRM-Editor-Asistente", "FRM-Editor-Reglas-23", "M-FRM-Reglas-23", "FRM-Respuesta-Cadena"]


# ---------------------------------------------------------------------------------------------------------------- utilidades
leer, escribir, fin_sc_if, sc = e21.leer, e21.escribir, e21.fin_sc_if, e21._sc


def con_css(t, css):
    assert MARCA not in t
    t = re.sub(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1).removesuffix(SUFIJO)}{SUFIJO}</title>", t, count=1)
    return t.replace("</helmet>", f"{MARCA}\n{css}</style>\n</helmet>", 1)


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:120])
    return t.replace(viejo, nuevo)


def alto_de(t):
    return int(re.search(r'"\$preview":\{"width":\d+,"height":(\d+)\}', t).group(1))


def bloques(t, i, j):
    """Los `sc-if` de primer nivel entre `i` y `j`: [(variable, contenido)]."""
    out, pos = [], i
    while True:
        k = t.find("<sc-if ", pos)
        if k < 0 or k >= j:
            return out
        fin = fin_sc_if(t, k)
        var = re.match(r'<sc-if value="\{\{(\w+)\}\}"', t[k:]).group(1)
        out.append((var, t[t.index(">", k) + 1:fin - len("</sc-if>")]))
        pos = fin


def viejos(t):
    """Lo de un tablero de la compu entre la barra de arriba y el final, por estado: banda, cuerpo, panel (aside) y capas; y la
    banda fija, si va afuera de los estados."""
    i = t.index("</header>") + len("</header>")
    j = t.rindex("</div>\n</x-dc>")
    nombres = e21._nombres_viejos(t)
    v = {"banda": {}, "cuerpo": {}, "aside": {}, "capa": {}}
    for var, c in bloques(t, i, j):
        e = nombres[int(var[1:])]
        s = c.lstrip()
        clave = ("banda" if s.startswith('<div class="w-bnd"') else "cuerpo" if s.startswith('<div class="w-body"')
                 else "aside" if s.startswith("<aside") else "capa")
        v[clave][e] = v[clave].get(e, "") + c
    fija = t[i:b2.fin_div(t, i)] if t.startswith('<div class="w-bnd">', i) else None
    return i, j, v, fija


def rehacer_compu(t, estados, css, alto=None, vals=None):
    """Los estados de un tablero de la compu (`dict(banda=, cuerpo=, aside=, capa=)`), con su marco de siempre."""
    i, j, _, _ = viejos(t)
    partes = []
    for clave in ("banda", "cuerpo", "aside", "capa"):
        partes += [sc(k, p[clave]) for k, (_, p) in enumerate(estados) if p.get(clave)]
    h = alto or alto_de(t)
    t = t[:i] + "".join(partes) + t[j:]
    t = con_css(t, css + (f"/* K · El tablero crece para leer la vista rápida entera. */\n.w-app {{ height: {alto}px !important; }}\n"
                          if alto else ""))
    return e21.con_script(t, [n for n, _ in estados], 1440, h, vals)


def rehacer_tel(t, estados, css):
    """Los estados de un tablero del teléfono: `dict(cuerpo=, capa=)`; las capas (hojas, avisos y la pieza a pantalla completa)
    van después de la raya."""
    i, j, k, l, _ = e21.viejos_tel(t)
    cuerpos = "".join(sc(n, p["cuerpo"]) for n, (_, p) in enumerate(estados))
    capas = "".join(sc(n, p["capa"]) for n, (_, p) in enumerate(estados) if p.get("capa"))
    t = t[:i] + cuerpos + t[j:k] + RAYA + capas + t[l:]
    return e21.con_script(con_css(t, css), [n for n, _ in estados], 390, 844)


def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


# ---------------------------------------------------------------------------------------------------------------- los temas
SIN_REVISAR_I = "El asistente no usa este tema con otras personas hasta que alguien lo revisa."
ESTADOS = ["Pendientes", "Sin revisar", "Abiertos", "Descartados"]
TEMAS = {
    "WA-Preguntas-Sin-Respuesta": dict(
        titulo="Preguntas sin respuesta", tel="M-WA-Preguntas-Sin-Respuesta", cuenta="Preguntas", ultima="Última pregunta",
        unidad=("pregunta", "preguntas"), abrir="Envíos al interior", vacio_tel="Sin preguntas",
        temas=[("Envíos al interior", "Si hacen envíos fuera de CABA y Gran Buenos Aires.", 4, 3, "27/09/2026, 10:22", "Sin revisar"),
               ("Cuotas", "Si se puede pagar en cuotas con tarjeta de crédito.", 2, 2, "26/09/2026, 16:40", "Abierto"),
               ("Repuestos", "Si venden repuestos sueltos, como burletes.", 1, 1, "25/09/2026, 11:05", "Abierto")],
        descartados=[("Búsquedas laborales", "Si toman personal.", 2, 2, "19/09/2026, 18:05", "Lucía Fernández", "20/09/2026, 10:00")]),
    "FRM-Faltan": dict(
        titulo="Formularios que faltan", tel="M-FRM-Faltan", cuenta="Pedidos", ultima="Último pedido", unidad=("pedido", "pedidos"),
        abrir="Reclamos de clientes", vacio_tel="Sin pedidos",
        temas=[("Reclamos de clientes", "Dejar asentado el reclamo de un cliente: qué pasó y qué pide.", 5, 3, "15/10/2026, 10:42", "Sin revisar"),
               ("Pedidos de materiales", "Pedir materiales para una obra, con cantidades.", 3, 2, "14/10/2026, 17:05", "Abierto"),
               ("Horas extra", "Registrar horas trabajadas fuera del horario.", 1, 1, "03/10/2026, 09:15", "Abierto")],
        descartados=[("Encuesta de clima", "Preguntar cómo se siente el equipo.", 2, 2, "09/10/2026, 16:20", "Lucía Fernández", "10/10/2026, 09:12"),
                     ("Cambio de turno", "Pedir cambiar un turno con un compañero.", 1, 1, "07/10/2026, 11:30", "Lucía Fernández", "08/10/2026, 17:40")]),
}
TEMAS["FRM-Faltan-25"] = dict(TEMAS["FRM-Faltan"], tel=None, temas=[
    ("Remitos de proveedores", "Fotos de remitos en papel que no encajan en ningún formulario.", 3, 2, "03/11/2026, 09:58", "Sin revisar")]
    + TEMAS["FRM-Faltan"]["temas"])

CSS_LISTA = b2.css(False) + e14l.CSS_LISTADO[len(b2.CSS_B2):] + """
/* K · Los temas (262 a 264): el filtro con su botón y la pieza, sin cantidades; «Ordenar por» último y separado. */
.f-env { position: relative; display: inline-flex; }
.w-caja.o-fb { overflow: visible; position: relative; z-index: 5; }
/* Cada dato en su columna (263): la descripción deja de ir debajo del tema. Los números, a la derecha (137). */
.w-caja.tmc { overflow: visible; }
.w-th.tm23, .w-tr.tm23 { grid-template-columns: minmax(130px, 1fr) minmax(200px, 1.6fr) 76px 70px 116px 104px 40px; }
.tmc.dsc .w-th.tm23, .tmc.dsc .w-tr.tm23 { grid-template-columns: minmax(110px, 1fr) minmax(150px, 1.4fr) 70px 64px 112px 110px 112px 92px 40px; }
.w-tr.tm23 { position: relative; min-height: 56px; overflow: visible; }
.w-tr.tm23 > span { min-width: 0; overflow-wrap: anywhere; }
.w-tr.tm23 .tm-n b { font-weight: 600; }
.w-tr.tm23 .tm-d { padding: 8px 0; color: var(--t1); line-height: 1.4; }
.w-th.tm23 > .num, .w-tr.tm23 > .num { justify-self: stretch; text-align: right; font-variant-numeric: tabular-nums; }
.w-tr.tm23 .tm-e { display: flex; align-items: center; gap: 2px; }
.w-tr.tm23 .tm-acc { display: flex; justify-content: flex-end; }
.w-tr.tm23 .f-menu { top: 44px; right: 8px; left: auto; width: 250px; }
"""
CSS_LISTA_TEL = b2.css(True) + e12l.CSS_TEL[len(b2.CSS_B2 + b2.CSS_B2_TEL):] + """
/* K · Cada tema, una tarjeta con su ⋮ (261 y 263): la descripción a todo el ancho y los demás datos con su nombre, de a dos. */
.b2-tj .b2-tj-a { cursor: default; }
"""


def svgs_lista(t):
    """Los dibujos del tablero de siempre: la lupa, la (i) y el ⋮ de una fila."""
    lupa = re.search(r'<span class="w-bus">' + DIBUJO, t, re.S).group(1)
    f_i = re.search(r'<span class="f-i" tabindex="0" role="img" aria-label="%s" title="[^"]*">' % re.escape(SIN_REVISAR_I) + DIBUJO, t, re.S).group(1)
    keb = re.search(r'<button type="button" class="ib" aria-label="Acciones de [^"]+">' + DIBUJO, t, re.S).group(1)
    return lupa, f_i, keb


def contar(n, unidad):
    return f"{n} {unidad[0] if n == 1 else unidad[1]}"


def resumen(cfg, filtro):
    """Lo que dice la banda: los temas y las preguntas (o los pedidos) del filtro elegido (262: el filtro no lleva cantidades)."""
    if filtro == "Descartados":
        ts = cfg["descartados"]
        palabra = "tema descartado" if len(ts) == 1 else "temas descartados"
    else:
        ts = [x for x in cfg["temas"] if filtro == "Pendientes" or x[5] == "Sin revisar"]
        palabra = ("tema" if len(ts) == 1 else "temas") + ("" if filtro == "Pendientes" else " sin revisar")
    return f"{len(ts)} {palabra} · {contar(sum(x[2] for x in ts), cfg['unidad'])}"


def columnas(cfg, descartados=False):
    medio = ["Lo descartó", "Descartado el"] if descartados else []
    return ["Tema", "Descripción", cfg["cuenta"], "Personas", cfg["ultima"]] + medio + ["Estado"]


def orden_texto(cfg, por):
    return f"Ordenar por: {cfg['ultima']}, más reciente primero" if por == cfg["ultima"] else f"Ordenar por: {por}, de la A a la Z"


def barra(cfg, lupa, filtro="Pendientes", lista_abierta=False, orden_abierto=False, por=None):
    """La barra (262 y 264): la búsqueda, «Estado» con su botón y la pieza, y «Ordenar por», último y separado."""
    por = por or cfg["ultima"]
    con = filtro != "Pendientes"
    lst = (b2.lista([b2.op(o, elegida=o == filtro, activa=o == filtro, sep=k == 1) for k, o in enumerate(ESTADOS)], barra=True)
           if lista_abierta else "")
    pil = (f'<span class="f-env"><button type="button" class="w-pil{" con" if con else ""}" aria-haspopup="listbox" '
           f'aria-expanded="{"true" if lista_abierta else "false"}">{"Estado: " + filtro if con else "Estado"} {b2.SVG_FLECHA}</button>{lst}</span>')
    limpiar = '<button type="button" class="cb cb-enl">Limpiar filtros</button>' if con else ""
    pop = ""
    if orden_abierto:
        cols = columnas(cfg)
        pop = ('<div class="b2-pop" role="dialog" aria-label="Ordenar por"><div class="b2-pop-c"><span class="et">Columna</span>'
               + b2.campo(por, abierto=True, aria="Columna", extra=b2.lista([b2.op(c, elegida=c == por, activa=c == por) for c in cols]))
               + '</div><div class="b2-pop-c"><span class="et">Orden</span>'
               + b2.campo("Más reciente primero" if por == cfg["ultima"] else "De la A a la Z", aria="Orden") + "</div></div>")
    orden = (f'<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar"><button type="button" class="w-pil" '
             f'aria-haspopup="dialog" aria-expanded="{"true" if orden_abierto else "false"}">{orden_texto(cfg, por)} {b2.SVG_FLECHA}</button>{pop}</span>')
    return f'<div class="w-caja o-fb"><span class="w-bus">{lupa} Buscar por tema</span>{pil}{limpiar}{orden}</div>'


def encabezado(cfg, por, descartados=False):
    """El encabezado que ordena (264): ↓ o ↑ en el color de la marca después del título; en una columna de números, antes."""
    celdas = []
    numeros = (cfg["cuenta"], "Personas")
    for c in columnas(cfg, descartados):
        clase = ' class="num"' if c in numeros else ""
        if c != por:
            celdas.append(f"<span{clase}>{c}</span>")
            continue
        sentido, flecha = ("descending", "↓") if c in numeros or c in (cfg["ultima"], "Descartado el") else ("ascending", "↑")
        if c in numeros:
            celdas.append(f'<span{clase} aria-sort="{sentido}"><span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">{flecha}</span>{c}</span>')
        else:
            celdas.append(f'<span aria-sort="{sentido}">{c}<span class="b2-fl" aria-hidden="true">{flecha}</span></span>')
    celdas.append('<span class="sr">Acciones</span>')
    return f'<div class="w-th tm23">{"".join(celdas)}</div>'


def celda_estado(estado, f_i, tip=False):
    if estado == "Sin revisar":
        i = f'<span class="f-i" tabindex="0" role="img" aria-label="{SIN_REVISAR_I}" title="{SIN_REVISAR_I}">{f_i}</span>'
        if tip:
            i = f'<span class="e-tipw t4a-tipi">{i}<span class="e-tip" role="tooltip">{SIN_REVISAR_I}</span></span>'
        return f'<span class="w-est pend">Sin revisar</span>{i}'
    if estado == "Descartado":
        return '<span class="w-est off">Descartado</span>'
    return '<span class="w-est">Abierto</span>'


def fila(tema, keb, f_i, estado=None, tip=False, menu=""):
    nombre, desc, n, p, ult, est = tema[:6]
    medio = "".join(f"<span>{x}</span>" for x in tema[6:8]) if len(tema) > 6 else ""
    est = "Descartado" if len(tema) > 6 else (estado or est)
    if len(tema) > 6:
        ult = tema[4]
    boton = (f'<span class="tm-acc"><button type="button" class="ib" aria-label="Acciones de {nombre}" aria-haspopup="menu" '
             f'aria-expanded="{"true" if menu else "false"}">{keb}</button></span>')
    return (f'<div class="w-tr tm23"><span class="tm-n"><b>{nombre}</b></span><span class="tm-d">{desc}</span><span class="num">{n}</span>'
            f'<span class="num">{p}</span><span>{ult}</span>{medio}<span class="tm-e">{celda_estado(est, f_i, tip)}</span>{boton}{menu}</div>')


def descartados_como_filas(cfg):
    """Un tema descartado: (tema, descripción, cantidad, personas, la última, quién y cuándo lo descartó) + el estado."""
    return [(n, d, c, p, u, "Descartado", quien, cuando) for n, d, c, p, u, quien, cuando in cfg["descartados"]]


def pie(n):
    return f'<div class="w-pie"><span>1–{n} de {n}</span><span>10 por página · Página 1 de 1</span></div>'


def cuerpo_lista(cfg, svgs, *, filtro="Pendientes", lista_abierta=False, orden_abierto=False, por=None, revisado=None, menu=None,
                 tip=False):
    """El cuerpo de la lista para un estado: la barra y la tabla de los temas que entran por el filtro."""
    lupa, f_i, keb = svgs
    por = por or cfg["ultima"]
    dsc = filtro == "Descartados"
    if dsc:
        temas = descartados_como_filas(cfg)
    else:
        temas = [x for x in cfg["temas"] if filtro == "Pendientes" or x[5] == "Sin revisar"]
    if por == "Tema":
        temas = sorted(temas, key=lambda x: sin_tildes(x[0]))
    filas = []
    for k, x in enumerate(temas):
        est = "Abierto" if x[0] == revisado else None
        filas.append(fila(x, keb, f_i, estado=est, tip=tip and k == 0, menu=menu if x[0] == cfg["abrir"] and menu else ""))
    tabla = (f'<div class="w-caja tmc{" dsc" if dsc else ""}">{encabezado(cfg, por, dsc)}{"".join(filas)}{pie(len(filas))}</div>')
    return f'<div class="w-body">{barra(cfg, lupa, filtro, lista_abierta, orden_abierto, por)}{tabla}</div>'


def cuerpo_carga(cfg, svgs):
    """«Cargando»: la barra y el encabezado; la pasada de las piezas pone el aro en el alto de ocho filas (160)."""
    barras = '<span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span>'
    return (f'<div class="w-body">{barra(cfg, svgs[0])}<div class="w-caja tmc">{encabezado(cfg, cfg["ultima"])}'
            f'<div class="f-cuerpo izq"><div class="esq">{barras}</div></div></div></div>')


def sin_barra_vieja(cuerpo, cfg, lupa):
    """Un cuerpo de siempre (el error) con la barra nueva."""
    i = cuerpo.find('<div class="w-caja o-fb">')
    if i < 0:
        return cuerpo
    return cuerpo[:i] + barra(cfg, lupa) + cuerpo[b2.fin_div(cuerpo, i):]


def menu_viejo(cuerpo, nombre):
    i = cuerpo.index(f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}">')
    return cuerpo[i:b2.fin_div(cuerpo, i)]


def banda_con(plantilla, res):
    nueva, n = re.subn(r'<p class="res">[^<]*</p>', f'<p class="res">{res}</p>', plantilla, count=1)
    assert n == 1
    return nueva


def lista_compu(nombre, asistente_svg=None):
    cfg = TEMAS[nombre]
    t, nl = leer(nombre)
    _, _, v, fija = viejos(t)
    svgs = svgs_lista(t)
    plantilla = fija or v["banda"]["Pendientes"]
    menu = menu_viejo(v["cuerpo"]["Acciones de un tema"], cfg["abrir"])
    if nombre == "FRM-Faltan-25":
        # 261 y la spec de la E25: «Armar con la IA» de cada tema pasa a su ⋮, después de «Crear formulario».
        crear = re.search(r'<a class="f-mi" role="menuitem" href="FRM-Editor\.dc\.html">' + SVG + " Crear formulario</a>", menu, re.S).group(0)
        menu = una(menu, crear, crear + f'<a class="f-mi" role="menuitem" href="Asistente-Org-25.dc.html">{asistente_svg} Armar con la IA</a>')
        assert "Armar con la IA</a>" not in "".join(v["cuerpo"].values()).replace('class="cb cb-sec" href="Asistente-Org-25.dc.html">Armar con la IA</a>', "")

    def est(filtro="Pendientes", **kw):
        return dict(banda=banda_con(plantilla, resumen(cfg, filtro)), cuerpo=cuerpo_lista(cfg, svgs, filtro=filtro, **kw))
    a = cfg["abrir"]
    vacio = "Sin preguntas" if "Preguntas" in cfg["cuenta"] else "Sin pedidos"
    estados = [
        ("Pendientes", est()),
        ("Acciones de un tema", est(menu=menu)),
        ("Marcado como revisado", dict(est(revisado=a), capa=v["capa"]["Marcado como revisado"])),
        ("Otra persona ya lo revisó", dict(est(revisado=a), capa=v["capa"]["Otra persona ya lo revisó"])),
        ("Descartar un tema", dict(est(), capa=v["capa"]["Descartar un tema"])),
        ("Estado: menú", est(lista_abierta=True)),
        ("Ordenar por abierto", est(orden_abierto=True)),
        ("Ordenado por Tema", est(por="Tema")),
        ("Sin revisar", est("Sin revisar", tip=True)),
        ("Descartados", est("Descartados")),
        ("Vacío", dict(banda=banda_con(plantilla, vacio), cuerpo=v["cuerpo"]["Vacío"])),
        ("Cargando", dict(banda=banda_con(plantilla, ""), cuerpo=cuerpo_carga(cfg, svgs))),
        ("No se pudo cargar", dict(banda=banda_con(plantilla, ""), cuerpo=sin_barra_vieja(v["cuerpo"]["No se pudo cargar"], cfg, svgs[0]))),
    ]
    t = rehacer_compu(t, estados, CSS_LISTA)
    assert 'class="k-tc"' not in t and "<small>" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S).split("</header>", 1)[1]
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- los temas (teléfono)
def tarjeta_tema(tema, cfg, estado=None):
    """Un tema, una tarjeta con su ⋮ (261 y 263): cada dato con su nombre; la descripción, a todo el ancho."""
    nombre, desc, n, p, ult = tema[:5]
    datos = [("Descripción", desc, True), (cfg["cuenta"], str(n), False), ("Personas", str(p), False), (cfg["ultima"], ult, False)]
    if len(tema) > 6:
        datos += [("Lo descartó", tema[6], False), ("Descartado el", tema[7], False)]
    else:
        e = estado or tema[5]
        datos.append(("Estado", b2.est("pend", e, info=SIN_REVISAR_I) if e == "Sin revisar" else b2.est("", e), False))
    celdas = "".join(f'<span class="c{" todo" if largo else ""}"><span class="k">{k}</span><span class="v">{val}</span></span>'
                     for k, val, largo in datos)
    return (f'<div class="b2-tj"><div class="b2-tj-a"><span class="cu"><span class="nm">{nombre}</span><span class="dl">{celdas}</span>'
            f'</span></div><button type="button" class="keb" aria-label="Acciones de {nombre}" aria-haspopup="menu">{b2.SVG_KEB}</button></div>')


def lista_tel(nombre):
    cfg = TEMAS[{"M-WA-Preguntas-Sin-Respuesta": "WA-Preguntas-Sin-Respuesta", "M-FRM-Faltan": "FRM-Faltan"}[nombre]]
    t, nl = leer(nombre)
    _, _, _, _, v = e21.viejos_tel(t)
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="[^"]+">' + DIBUJO, t, re.S).group(1)
    filtros = re.search(r'<button type="button" class="ap-ib" aria-label="Filtros">' + DIBUJO, t, re.S).group(1)
    atras = re.search(r'<a class="ap-ib" aria-label="Volver" href="([^"]+)">', t).group(1)
    vacio = re.search(r'<div class="ap-vacio">[^<]*</div>', v["cuerpo"]["Vacío"]).group(0)
    titulo = cfg["titulo"]

    def barra_tel(sub):
        return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{atras}">{volver}</a><div class="tit"><h1>{titulo}</h1>'
                f'<span class="sub">{sub}</span></div><button type="button" class="ap-ib" aria-label="Filtros">{filtros}</button></div>')
    ordenar = f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">{orden_texto(cfg, cfg["ultima"])} {b2.SVG_FLECHA}</button></div>'

    def lst(filtro="Pendientes", revisado=None):
        temas = descartados_como_filas(cfg) if filtro == "Descartados" else cfg["temas"]
        tj = "".join(tarjeta_tema(x, cfg, "Abierto" if x[0] == revisado else None) for x in temas)
        return f'{barra_tel(resumen(cfg, filtro))}{ordenar}<div class="ap-cuerpo">{tj}</div>'

    filtros_pant = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{nombre}.dc.html">{volver}</a><div class="tit"><h1>Filtros</h1>'
                    f'<span class="sub">{titulo}</span></div></div><div class="ap-cuerpo"><div class="t10-fl">{e12l.campo_tel("Estado", "Pendientes")}'
                    '</div></div><div class="t10-pie"><button type="button" class="cb cb-sec">Limpiar todo</button>'
                    '<button type="button" class="cb cb-pri">Listo</button></div>')
    pieza = b2.pk_tel("Estado", [(o, None, o == "Pendientes", None, k == 1) for k, o in enumerate(ESTADOS)])
    a = cfg["abrir"]
    estados = [
        ("Pendientes", dict(cuerpo=lst())),
        ("Acciones de un tema", dict(cuerpo=lst(), capa=v["capa"]["Acciones de un tema"])),
        ("Marcado como revisado", dict(cuerpo=lst(revisado=a), capa=v["capa"]["Marcado como revisado"])),
        ("Otra persona ya lo revisó", dict(cuerpo=lst(revisado=a), capa=v["capa"]["Otra persona ya lo revisó"])),
        ("Descartados", dict(cuerpo=lst("Descartados"))),
        ("Vacío", dict(cuerpo=f'{barra_tel(cfg["vacio_tel"])}<div class="ap-cuerpo">{vacio}</div>')),
        ("Filtros", dict(cuerpo=filtros_pant)),
        ("Elegir el estado", dict(cuerpo=filtros_pant, capa=pieza)),
        ("Ordenar por", dict(cuerpo=e14l.pantalla_ordenar(volver, nombre, cfg["ultima"], "Más reciente primero"))),
    ]
    t = rehacer_tel(t, estados, CSS_LISTA_TEL)
    assert 'class="l2"' not in t and 'class="l3"' not in t
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- las sugerencias
FORM = {"Visita": "Visita a cliente", "Entrega": "Entrega de pedido", "Control": "Control de vehículo"}
COMO = [("La IA decide", "Lo ofrece si encaja con el «cuándo» o si la persona lo pide."),
        ("Preguntar siempre", "Lo ofrece después de cada respuesta, sin IA. Se puede limitar con «Solo si».")]
SOLO_APP = "Se completa solo en la app."
SOLO_APP_I = "Se completa solo en la app. Vuelve a ofrecerse si lo pasan a WhatsApp."
CSS_SUG = """
/* K · La pieza (262) en una sugerencia: el formulario, cómo se ofrece, cada parte de «Solo si» y cada dato que pasa. */
.sg-ed .w-cmp .b2-env, .k-cond .b2-env, .sg-map .b2-env { width: 100%; min-width: 0; }
.sg-ed:has(.b2-pkl), .sg-fila:has(.b2-pkl), .rg5:has(.b2-pkl) { overflow: visible; }
.sg-map.t3k-mh { min-height: 0; font-size: 12.5px; font-weight: 600; color: var(--t2); }
/* 258 · La pestaña apagada, con su motivo en el tooltip (211); no cambia de lugar ni de forma. */
.f-tabs .t3k-off { position: relative; padding: 10px 14px; margin-bottom: -1px; border-bottom: 2px solid transparent; font-size: 13.5px; font-weight: 600; color: var(--t3); cursor: default; }
.f-tabs .t3k-off .acc-tip { left: 0; bottom: calc(100% + 4px); }
.f-tabs:has(.acc-tip) { overflow: visible; }
"""


def tab_apagada(tip_abierto):
    tip = b2.tip(SOLO_APP) if tip_abierto else ""
    return (f'<span class="t3k-off" role="tab" aria-selected="false" aria-disabled="true" tabindex="0" aria-label="Sugerencias, no '
            f'disponible: {SOLO_APP}">Sugerencias{tip}</span>')


TAB_SUG = '<a class="" role="tab" aria-selected="false" href="FRM-Editor-Sugerencias.dc.html">Sugerencias</a>'


def piezas_sugerencias(cuerpo):
    cuenta = {}

    def mas(k):
        cuenta[k] = cuenta.get(k, 0) + 1

    # «Formulario a sugerir»: la pieza cerrada, con el elegido.
    def formulario(m):
        mas("formulario")
        return m.group(1) + b2.campo(m.group(2), aria="Formulario a sugerir")
    cuerpo = re.sub(r'(<span class="rt">Formulario a sugerir</span>)<div class="ct sel">([^<]*)' + SVG + "</div>", formulario, cuerpo, flags=re.S)

    # «Cómo se ofrece»: los dos radios, con su descripción, pasan a la pieza cerrada; la descripción va en la lista abierta.
    out, pos = [], 0
    for m in re.finditer(r'<div class="k-ops">', cuerpo):
        fin = e14e.cierre(cuerpo, m.start(), "div")
        sel = re.search(r'class="k-op on"[^>]*><span class="rd"></span><span class="tx"><b>([^<]+)</b>', cuerpo[m.start():fin]).group(1)
        out.append(cuerpo[pos:m.start()] + b2.campo(sel, aria="Cómo se ofrece"))
        pos = fin
        mas("cómo se ofrece")
    cuerpo = "".join(out) + cuerpo[pos:]

    # «Solo si»: la pregunta, la condición y el valor, cada uno en la pieza.
    def condicion(m):
        partes = iter(("Pregunta", "Condición", "Valor"))

        def ct(x):
            mas("solo si")
            v = x.group(2)
            return b2.campo(v[:1].upper() + v[1:], error=bool(x.group(1)), aria=next(partes))
        return re.sub(r'<div class="ct( mal)?">([^<]*)' + SVG + "</div>", ct, m.group(0), flags=re.S)
    cuerpo = re.sub(r'<div class="k-cond">.*?<button type="button" class="ib" aria-label="Quitar condición">', condicion, cuerpo, flags=re.S)

    # Los datos que pasan: cada pregunta en la pieza; el formulario de cada lado, una vez, arriba (263).
    def dato(m):
        mas("datos")
        return b2.campo(m.group(3), error=bool(m.group(1)), aria=f"{FORM[m.group(2)]} · {m.group(3)}")
    viejo = re.compile(r'<div class="ct( mal)?"><span><small>(\w+) ·</small>([^<]*)</span>' + SVG + "</div>", re.S)
    out, pos = [], 0
    for m in re.finditer(r'<span class="rt">Datos que pasan', cuerpo):
        k = cuerpo.find('<div class="sg-map">', m.end())
        de, a = re.findall(r"<small>(\w+) ·</small>", cuerpo[k:k + 2000])[:2]
        out.append(cuerpo[pos:k] + f'<div class="sg-map t3k-mh" aria-hidden="true"><span>{FORM[de]}</span><span></span><span>{FORM[a]}</span><span></span></div>')
        pos = k
    cuerpo = viejo.sub(dato, "".join(out) + cuerpo[pos:])
    assert 'class="ct sel' not in cuerpo and "k-op" not in cuerpo and "<small>" not in cuerpo.split("rg5-hist")[0], cuerpo.count("<small>")
    print("  piezas:", cuerpo_cuenta(cuenta))
    return cuerpo


def cuerpo_cuenta(c):
    return ", ".join(f"{k} {v}" for k, v in c.items())


def sugerencias():
    nombre = "FRM-Editor-Sugerencias"
    t, nl = leer(nombre)
    print(nombre)
    # Con lo del editor (las preguntas en columnas, «Cuándo lo ofrece» apagado y la vista previa de la app) para «Solo en la app».
    t = con_css(t, e14e.CSS_COMPU + e21r.CSS_EDITOR + CSS_ASIS)
    cab, cuerpo, guion = e21r.partir(t)
    t = cab + piezas_sugerencias(cuerpo) + guion

    # «Cómo se ofrece abierto»: la pieza con las dos maneras y su descripción en gris (262).
    def abierta(k, b):
        if k != 1:
            return b
        lst = b2.lista([b2.op(n, d, elegida=i == 0, activa=i == 0) for i, (n, d) in enumerate(COMO)])
        return una(b, b2.campo("La IA decide", aria="Cómo se ofrece"), b2.campo("La IA decide", abierto=True, aria="Cómo se ofrece", extra=lst))
    t, _ = e21r.clonar(t, "Editar una sugerencia", "Cómo se ofrece abierto", "Editar una sugerencia", abierta)

    # «Hacia uno de la app» (258): la tercera, hacia «Pedido de materiales», que se completa solo en la app, marcada como la que va
    # hacia un dado de baja; no se ofrece y vuelve si lo pasan a WhatsApp.
    def hacia_app(k, b):
        if k != 1:
            return b
        b = una(b, "<b>Relevamiento de obra</b>", "<b>Pedido de materiales</b>")
        b = una(b, '<span class="ab-chip mal">De baja</span>', '<span class="ab-chip mal">Solo en la app</span>')
        b = una(b, 'aria-label="No se ofrece mientras esté dado de baja. Vuelve si lo reactivan." title="No se ofrece mientras esté dado de baja. Vuelve si lo reactivan."',
                f'aria-label="{SOLO_APP_I}" title="{SOLO_APP_I}"')
        return una(b, '<b>Motivo</b> <span class="g">es</span> <b>Reclamo</b>', '<b>¿Se concretó la venta?</b> <span class="g">es</span> <b>Sí</b>')
    t, _ = e21r.clonar(t, "Hacia un dado de baja", "Hacia uno de la app", "Hacia un dado de baja", hacia_app)

    # «Solo en la app» (258): en un formulario que se completa solo en la app, la pestaña «Sugerencias» queda apagada con su motivo.
    # Una pestaña apagada no se abre: el estado se ve en «Diseño», donde se elige «Dónde se completa», con la banda y el cuerpo del
    # estado «Solo en la app» de `FRM-Editor-Asistente` (que corre antes), con el tooltip de la pestaña abierto y no el de «Cuándo».
    asis, _ = leer("FRM-Editor-Asistente")
    assert MARCA in asis, "FRM-Editor-Asistente tiene que correr antes"
    (ba, bb), (ca, cb) = e14e.sc_ifs(asis, e14e.s_de(asis, "Solo en la app"))[:2]
    banda, diseno = (x[x.index(">") + 1:-len("</sc-if>")] for x in (asis[ba:bb], asis[ca:cb]))
    diseno = una(diseno, tab_apagada(False), tab_apagada(True))
    diseno = una(diseno, f'<div class="ct area">{CUANDO}</div>{b2.tip(SOLO_APP)}</div>', f'<div class="ct area">{CUANDO}</div></div>')

    def solo_app(k, b):
        return b[:b.index(">") + 1] + (banda if k == 0 else diseno) + "</sc-if>" if k < 2 else b
    t, _ = e21r.clonar(t, "Sugerencias", "Solo en la app", "Sin el asistente", solo_app)
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- «Cuándo lo ofrece»
CUANDO = "Cuando un vendedor cuenta que visitó a un cliente: a quién, si se cerró la venta y por cuánto."
CSS_ASIS = CSS_SUG + """
/* 258 · «Cuándo lo ofrece» apagado en un formulario «Solo en la app»: conserva su texto, en gris, con el motivo en el tooltip. */
.t3k-apag { position: relative; display: block; }
.t3k-apag > .ct { background: var(--s3); color: var(--t3); cursor: default; }
.t3k-apag > .acc-tip { left: 0; }
.e-g2:has(.acc-tip), .w-caja:has(.t3k-apag) { overflow: visible; }
/* SA2-A · Con «Solo en la app», la vista previa es la de la app: el panel de «Nueva respuesta», como en la E20. */
.t15e-pva .t15e-pvb { display: flex; flex-direction: column; gap: 14px; padding: 16px 20px; }
.t15e-pva .t15e-pvp { display: flex; justify-content: flex-end; padding: 12px 20px; border-top: 1px solid var(--borde); }
.t15e-pva .w-cmp .b2-env { width: 100%; }
"""
PV_APP = ('<div class="pv"><div class="w-caja t15e-pva" role="region" aria-label="Vista previa en la app"><div class="f-cab"><span>Nueva respuesta</span>'
          '</div><div class="t15e-pvb"><div class="w-cmp"><span class="rt">Cliente <span class="req">*</span></span><div class="ct"></div></div>'
          '<div class="w-cmp"><span class="rt">Fecha de la visita <span class="req">*</span></span><div class="ct"></div></div>'
          '<div class="w-cmp"><span class="rt">Correo del cliente</span><div class="ct"></div></div>'
          '<div class="w-cmp"><span class="rt">¿Se concretó la venta? <span class="req">*</span></span>'
          + b2.campo("Elegí una opción", vacio=True, aria="¿Se concretó la venta?") + '</div></div><div class="t15e-pvp"><button type="button" '
          'class="cb cb-pri" aria-disabled="true" title="Es una vista previa: no se envía.">Enviar</button></div></div></div>')


def asistente():
    nombre = "FRM-Editor-Asistente"
    t, nl = leer(nombre)
    print(nombre)
    t = con_css(t, e14e.CSS_COMPU + e21r.CSS_EDITOR + CSS_ASIS)
    cab, cuerpo, guion = e21r.partir(t)
    t = cab + e21r.piezas_editor(e21r.donde_se_completa(e21r.filas_columnas(cuerpo))) + guion

    def solo_app(k, b):
        if k == 0:
            # La banda: con el cambio sin guardar, «Descartar» y «Guardar cambios»; «Publicar», sin WhatsApp, apagado hasta guardar.
            b, n = re.subn(r'<button type="button" class="cb cb-sec" disabled>Descartar</button>.*?Ver vista oficial</a>',
                           '<button type="button" class="cb cb-sec">Descartar</button><button type="button" class="cb cb-sec">Guardar cambios</button>'
                           '<button type="button" class="cb cb-pri" aria-disabled="true" title="Primero guardá los cambios.">Publicar</button>', b, flags=re.S)
            assert n == 1, n
            return b
        if k != 1:
            return b
        b = una(b, TAB_SUG, tab_apagada(False))
        b = una(b, b2.campo(e21r.DONDE, aria="Dónde se completa"), b2.campo("Solo en la app", aria="Dónde se completa"))
        b = una(b, f'<div class="ct area">{CUANDO}</div>',
                f'<div class="t3k-apag" tabindex="0" aria-disabled="true" aria-label="Cuándo lo ofrece el asistente, no disponible: {SOLO_APP}">'
                f'<div class="ct area">{CUANDO}</div>{b2.tip(SOLO_APP)}</div>')
        i = b.index('<div class="pv">')
        return b[:i] + PV_APP + b[e14e.cierre(b, i, "div"):]
    t, _ = e21r.clonar(t, "Con «Cuándo lo ofrece»", "Solo en la app", "Sin el asistente", solo_app)
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- armar una regla
MES = "Se agotó el tope de IA del mes. Armá la regla a mano."
# El texto del cupo del día en una organización (`LimitReached`, F13 de la base 2): fue el cupo de hoy, y vuelve a la medianoche de
# la organización, nombrándola (271 y 283).
CUPO = "Usaste tus 50 consultas de hoy en Grupo Delta. Vuelven el 16/10/2026, a las 00:00, hora de Grupo Delta."
I_TEXTO = "La IA la convierte en una regla normal, que revisás antes de guardar. Después corre sin IA. Cuenta en el tope de IA del mes."
I_TEXTO_NUEVO = ("La IA la convierte en una regla normal, que revisás antes de guardar. Después corre sin IA. Cuenta en el tope de IA "
                 "del mes y en tu cupo del día.")
CSS_R23 = """
/* K · El motivo de «Armar desde un texto» apagado, en el tooltip arriba del control (211); el del cupo del día dice cuándo vuelve
   (271 y 283). */
.t3k-ap { position: relative; display: inline-flex; }
.t3k-ap > .acc-tip { left: 0; }
.f-cab:has(.t3k-ap), .rg5:has(.t3k-ap) { overflow: visible; }
"""
CSS_TEL_R23 = """
/* K · El motivo de «Armar desde un texto» apagado, en el tooltip sobre el control, abierto con un toque (211): sin la (i) al lado. */
.rg-acc .t3k-off { position: relative; }
.rg-acc .t3k-off .acc-tip { left: -80px; bottom: calc(100% + 8px); width: 280px; max-width: 280px; font-size: 14px; }
.rg-acc .t3k-off .acc-tip::after { left: 94px; }
"""


def reglas23():
    nombre = "FRM-Editor-Reglas-23"
    t, nl = leer(nombre)
    print(nombre)
    t = con_css(t, b2.css(False) + e21r.CSS_REGLAS + CSS_R23)
    cab, cuerpo, guion = e21r.partir(t)
    cuerpo = e21r.piezas_reglas(cuerpo)
    m = re.search(r'<span class="q-chk"><i>' + DIBUJO + "</i>", cuerpo, re.S)
    cuerpo = e21r.con_casillas(cuerpo, m.group(1) if m else b2.SVG_TILDE)
    assert cuerpo.count(I_TEXTO) == 6, cuerpo.count(I_TEXTO)
    cuerpo = cuerpo.replace(I_TEXTO, I_TEXTO_NUEVO)
    # 211 · El motivo de «Armar desde un texto» apagado va en el tooltip arriba del control, como las piezas de la base 2.
    cuerpo, n = re.subn(r'<span class="e-tipw">(<button type="button" class="cb cb-sec" aria-disabled="true">' + SVG + r' Armar desde un texto'
                        r'</button>)<span class="e-tip" role="tooltip">' + re.escape(MES) + "</span></span>",
                        lambda m: f'<span class="t3k-ap">{m.group(1)}{b2.tip(MES)}</span>', cuerpo, flags=re.S)
    assert n == 1, n
    t = cab + cuerpo + guion

    def cupo(k, b):
        return b if k != 1 else una(b, b2.tip(MES), b2.tip(CUPO))
    t, _ = e21r.clonar(t, "Tope de IA agotado", "Cupo del día agotado", "Tope de IA agotado", cupo)
    escribir(nombre, t, nl)


def m_reglas23():
    nombre = "M-FRM-Reglas-23"
    t, nl = leer(nombre)
    print(nombre)
    t = con_css(t, b2.css(True) + CSS_TEL_R23)

    def tooltip(m):
        return (f'<span class="off acc-apagado t3k-off" role="button" tabindex="0" aria-disabled="true" aria-label="Armar desde un texto, '
                f'no disponible: {MES}">{m.group(1)} Armar desde un texto{b2.tip(MES)}</span>')
    t, n = re.subn(r'<span class="off" aria-disabled="true">' + DIBUJO + r' Armar desde un texto<button type="button" class="ap-i" '
                   r'aria-label="Qué significa" title="' + re.escape(MES) + '">' + SVG + "</button></span>", tooltip, t, flags=re.S)
    assert n == 1, n

    def cupo(k, b):
        return b.replace(MES, CUPO)
    t, _ = e21r.clonar(t, "Tope de IA agotado", "Cupo del día agotado", "Tope de IA agotado", cupo)
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- la cadena
VIS132 = e21.visita("Ferretería Rosales", "15/10/2026", "-34.583190, -58.420411", 10, "Sí", "128.000,00", "Venta nueva", "Frío",
                    "Quieren dos equipos más para el local nuevo, en Palermo.", ["mostrador.jpg"], "")
POR_QUE = "Reconoció una visita a un cliente: «Cuándo lo ofrece» de Visita a cliente."
PROPUESTOS = [("Cliente", "Ferretería Rosales", "Sin cambios"), ("¿Se concretó la venta?", "Sí", "Sin cambios"),
              ("Monto estimado", "125.500,00", "Corregido"), ("Fecha de la visita", "15/10/2026", "Sin cambios")]
CADENA = [("VIS-000126", "Visita a cliente", "Tomás Acosta", "13/10/2026, 15:30", None),
          ("ENT-000047", "Entrega de pedido", "Tomás Acosta", "13/10/2026, 16:10", "La IA decide")]
ACT132 = [e21.B("Al recibirla", [e21.R("15/10/2026", "17:21", "La mandó", "El asistente", e21.WA, POR_QUE, e21.HECHO),
                                 e21.R("15/10/2026", "17:40", "La respondió", "Tomás Acosta", e21.WA, None, e21.HECHO),
                                 e21.R("15/10/2026", "17:40", "Aviso a quien la cargó", "Tomás Acosta", e21.WA,
                                       "«Recibimos VIS-000132. Te avisamos cuando la aprueben.»", e21.LEIDO)]),
          e21.B("Aprobación", [e21.R("15/10/2026", "17:40", "Se pidió aprobación", None, None, "Rol Supervisor", e21.POR_APROBAR)])]
CSS_CADENA = e21.CSS_COMPU + """
/* K · «Cómo empezó», después de las zonas (como en ArquitecturaBase): la lectura de quién la preparó y por qué, «Ver los datos
   propuestos» y la cadena de respuestas, cada dato en su columna (263); la que se mira, marcada con la barra de la marca (142). */
.d2-b > .t3k-ce { margin-top: 12px; }
.t3k-ce .b2-lec { grid-template-columns: 116px minmax(0, 1fr); }
.t3k-ce .b2-cab + .t3k-st { border-top: 0; }
.t3k-ce .t3k-ac { padding: 8px 14px 10px; border-top: 1px solid var(--borde); }
.t3k-ce .t3k-ac .cb-enl { padding: 0; font-size: 13.5px; }
.t3k-st { padding: 10px 14px 6px; border-top: 1px solid var(--borde); font-size: 13px; font-weight: 600; color: var(--t2); }
.t3k-tw { padding: 0 14px 14px; }
.t3k-t { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid var(--borde); font-size: 13.5px; color: var(--t1); }
.t3k-t th, .t3k-t td { padding: 7px 10px; border-top: 1px solid var(--borde); text-align: left; vertical-align: top; line-height: 1.4; overflow-wrap: anywhere; }
.t3k-t thead th { border-top: 0; background: oklch(0.945 0.027 95); font-size: 13px; font-weight: 600; color: var(--t2); }
.t3k-t td + td, .t3k-t th + th { box-shadow: inset 1px 0 0 var(--borde); }
.t3k-t td:nth-child(4) { font-variant-numeric: tabular-nums; }
.t3k-t tr.sel td { background: oklch(0.965 0.02 140); }
.t3k-t tr.sel td:first-child { box-shadow: inset 3px 0 0 var(--marca); font-weight: 600; }
.t3k-t a { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.t3k-t .nada { color: var(--t3); }
"""


def tabla(titulo, cols, anchos, filas, sel=None):
    colg = "".join(f'<col style="width: {a};">' if a else "<col>" for a in anchos)
    cab = "".join(f"<th>{c}</th>" for c in cols)
    cuerpo = "".join(f'<tr{" class=\"sel\" aria-current=\"true\"" if k == sel else ""}>' + "".join(f"<td>{c}</td>" for c in f) + "</tr>"
                     for k, f in enumerate(filas))
    return (f'<div class="t3k-st">{titulo}</div><div class="t3k-tw"><table class="t3k-t" aria-label="{titulo}"><colgroup>{colg}</colgroup>'
            f"<thead><tr>{cab}</tr></thead><tbody>{cuerpo}</tbody></table></div>")


def como_empezo(preparo=None, por_que=None, propuestos=None, abiertos=False, cadena=None, actual=None):
    filas = [(k, v) for k, v in (("La preparó", preparo), ("Por qué", por_que)) if v]
    html = '<div class="b2-caja t3k-ce" role="region" aria-label="Cómo empezó"><div class="b2-cab"><span>Cómo empezó</span></div>'
    if filas:
        html += '<div class="b2-lec">' + "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in filas) + "</div>"
    if propuestos:
        html += (f'<div class="t3k-ac"><button type="button" class="cb cb-enl" aria-expanded="{"true" if abiertos else "false"}">'
                 f'{"Ocultar" if abiertos else "Ver"} los datos propuestos</button></div>')
        if abiertos:
            html += tabla("Datos propuestos", ["Pregunta", "Propuso", "Al completar"], [None, "150px", "112px"], propuestos)
    if cadena:
        nada = '<span class="nada">—</span>'
        filas_c = [[n if n == actual else f'<a href="#">{n}</a>', f, q, r, s or nada] for n, f, q, r, s in cadena]
        sel = next(k for k, c in enumerate(cadena) if c[0] == actual)
        html += tabla("Cadena de respuestas", ["N°", "Formulario", "La respondió", "Recibida", "Sugerencia"],
                      ["96px", None, "104px", "116px", "96px"], filas_c, sel)
    return html + "</div>"


def cadena():
    nombre = "FRM-Respuesta-Cadena"
    t, nl = leer(nombre)
    print(nombre)
    _, _, v, _ = viejos(t)
    bnd, cpo = v["banda"], v["cuerpo"]
    l132 = e21.resp_wa("Tomás Acosta", "15/10/2026", "17:40")
    l126 = e21.resp_wa("Tomás Acosta", "13/10/2026", "15:30")
    yo, conv = f"{nombre}.dc.html", "WA-Chats-Asistente.dc.html"

    def vr132(cuerpo, pestana="Respuesta"):
        return e21.vista_rapida("VIS-000132", cuerpo, linea_gris=l132, pestana=pestana, estado=("pend", "Por aprobar"), version="Versión 4",
                                lapiz=True, completa=yo, conversacion=conv, keb=True, arriba=e21.decision(), pie="1 de 10", anterior=False)
    ce = dict(preparo="El asistente, en la conversación con Tomás Acosta", por_que=POR_QUE, propuestos=PROPUESTOS)
    v126 = e21.vista_rapida("VIS-000126", e21.respuesta(e21.VIS126, 2) + como_empezo(cadena=CADENA, actual="VIS-000126"), linea_gris=l126,
                            estado=("", "Aprobada"), version="Versión 4", lapiz=True, completa=yo, conversacion=conv, bajar=True, keb=True,
                            pie="6 de 10")
    estados = [
        ("La mandó el asistente", dict(banda=bnd["La mandó el asistente"], cuerpo=cpo["La mandó el asistente"],
                                       aside=vr132(e21.respuesta(VIS132, 2) + como_empezo(**ce)))),
        ("Los datos que propuso", dict(banda=bnd["Los datos que propuso"], cuerpo=cpo["Los datos que propuso"],
                                       aside=vr132(e21.respuesta(VIS132, 2) + como_empezo(abiertos=True, **ce)))),
        ("La cadena", dict(banda=bnd["La cadena"], cuerpo=cpo["La cadena"], aside=v126)),
        ("Actividad", dict(banda=bnd["La mandó el asistente"], cuerpo=cpo["La mandó el asistente"],
                           aside=vr132(e21.actividad_recuadros(ACT132, e21.REV), "Actividad"))),
    ]
    miga = "Inicio / Gestión de formularios / Formularios / Visita a cliente"
    t = rehacer_compu(t, estados, CSS_CADENA, alto=1200, vals={"miga": [miga] * len(estados)})
    assert "d3-moms" not in t.split("</helmet>", 1)[1].split("<script", 1)[0] and "ab-chip" not in t.split("</helmet>", 1)[1].split("<script", 1)[0]
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- todo
def main():
    wa, _ = leer("WA-Preguntas-Sin-Respuesta")
    robot = re.search(r'<a class="w-ln" href="WA-Asistente\.dc\.html">' + DIBUJO, wa, re.S).group(1)
    hacer = [("WA-Preguntas-Sin-Respuesta", lambda: lista_compu("WA-Preguntas-Sin-Respuesta")),
             ("M-WA-Preguntas-Sin-Respuesta", lambda: lista_tel("M-WA-Preguntas-Sin-Respuesta")),
             ("FRM-Faltan", lambda: lista_compu("FRM-Faltan")),
             ("M-FRM-Faltan", lambda: lista_tel("M-FRM-Faltan")),
             ("FRM-Faltan-25", lambda: lista_compu("FRM-Faltan-25", robot)),
             ("FRM-Editor-Asistente", asistente), ("FRM-Editor-Sugerencias", sugerencias), ("FRM-Editor-Reglas-23", reglas23),
             ("M-FRM-Reglas-23", m_reglas23), ("FRM-Respuesta-Cadena", cadena)]
    hechos = []
    for nombre, f in hacer:
        if MARCA in leer(nombre)[0]:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        f()
        hechos.append(nombre)
    if hechos:
        subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(hechos)], check=True)


if __name__ == "__main__":
    main()
