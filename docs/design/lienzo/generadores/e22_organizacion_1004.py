"""La organización en la E22 con el traspaso 18 (tanda 3B de Diseño, 2026-11-26): la lista «Formularios», la biblioteca, la vista de
una plantilla, el diálogo para usarla y las reglas que trae, redibujados en su lugar con la forma que dejaron aprobada la E14 (v186)
y la E21 de esta tanda (`e21_listas_1004.py` y `e21_reglas_1004.py`):

- `FRM-Formularios-22` y `M-FRM-Formularios-22`: la lista de `FRM-Formularios-21` redibujada, con lo suyo de la E22, «Nuevo formulario
  ▾» con «Desde cero» y «Desde una plantilla» (79). «Cargar» pasa a ser la primera opción del ⋮ (261); un dato por columna (206 y
  263): Formulario, Estado, Dónde se completa, Por aprobar (solo para quien aprueba, 275), Respuestas, Última respuesta y Recibida.
  «En WhatsApp» pasa a «Estado» y se suma «Dónde se completa» (229): «Solo en la app · versión 4» se parte en «Publicado · versión 4»
  y «App». El filtro «Estado», con su botón y la pieza, sin cantidades, suma «Con algo por aprobar», y se va el de «Aprobación» (262 y
  275); el encabezado ordena con la flecha en el color de la marca, y «Ordenar por» va último, separado (264). En el teléfono, cada
  fila es una tarjeta con cada dato con su nombre (263), «Ordenar por» va arriba de la lista y el ⋮ lleva el ícono de cada acción, con
  lo apagado y su motivo en el tooltip (211). La hoja del «+» («Nuevo formulario: elegir») lleva los mismos íconos que el menú de la
  compu. Estados nuevos, los de la 21: «Quien solo carga: Cargar», «Ordenar por abierto», «Ordenado por Formulario» y, en el
  teléfono, «Ordenar por» y «Uno solo para clientes»; sale «Aprobación: menú». Se conserva «Nuevo formulario: menú».
- `FRM-Biblioteca` y `M-FRM-Biblioteca`: cada tarjeta nombra sus datos (263), en lugar de «5 preguntas · Para clientes»: la
  descripción, para quién es, las preguntas, los catálogos y en qué formularios la usaste (198), cada uno con su nombre; la
  descripción deja de ir en gris debajo del nombre (263). Se va el total de la caja del buscador, que ya dice la banda (175). El
  esqueleto de «Cargando» mide lo que una tarjeta nueva (160).
- `FRM-Plantilla`, `M-FRM-Plantilla` y el fondo de `FRM-Plantilla-Usar`: las preguntas en columnas, «#», «Pregunta», «Tipo» y
  «Obligatoria», sin acciones porque se leen, y sin el catálogo ni sus detalles (263 y 285); en el teléfono, cada pregunta es una
  tarjeta con «Tipo» y «Obligatoria». «Catálogos que trae» pasa a una tabla con Catálogo, De dónde salen, Tipo de valor y Opciones, como
  `FRM-Catalogos` (lo de «sin filtros» ya lo dice su (i)); en el teléfono, cada catálogo es una tarjeta. «La plantilla» lleva la
  descripción como un dato más de la lectura (138 y 263), y el teléfono deja de juntar «Ventas · 8 preguntas» en la barra y los datos
  debajo de la descripción. En el teléfono, «Usar esta plantilla» sin el permiso de catálogos dice su motivo en el tooltip, y no en
  un texto debajo (211). El sugerido de las reglas de ejemplo dice «Sugerido: Supervisor», como el campo de las reglas precargadas. El
  enlace de volver dice «Volver a la biblioteca».
- `FRM-Editor-Reglas-Plantilla` y `M-FRM-Reglas-Plantilla`: lo que se elige, en la pieza (262), como `FRM-Editor-Reglas` redibujado.
  «Rol sugerido: X» deja de ir debajo del rol (263): el campo vacío dice en gris «Sugerido: Supervisor» y, abierto, la opción
  «Supervisor» lleva «Sugerido» en gris; en el teléfono, la hoja «Rol» pasa a la pieza a pantalla completa. «Pedir aprobación» suma
  sus dos casillas, «Puede decidir quien cargó» y «Exigir motivo al rechazar», con su (i) (276), como la E21. «El formulario nuevo»
  lleva las preguntas en columnas y «Dónde se completa» al lado del prefijo, con «En la app y por WhatsApp», el de una copia (229). En
  el teléfono, «Historial» apagado dice su motivo en el tooltip, que abre el toque, y no en un texto debajo (211). La compu crece a
  1700 de alto, por las dos casillas.

Cambia los tableros en su lugar; el bloque `<style data-t3b="e22-organizacion">` lo frena si ya corrió. Al final corre
`traspaso10_piezas_1004.py --tableros` con los nueve, que pone la escala de la compu. No toca el panel «Gestión de formularios» (lo
hace quien lanzó la tanda, con «Biblioteca», para la E22 en adelante) ni `canvas.json`. Uso: `python e22_organizacion_1004.py`.
"""
import json
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
import e21_listas_1004 as e21l  # noqa: E402
import e21_reglas_1004 as e21r  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
MARCA = '<style data-t3b="e22-organizacion">'
SVG = r"<svg\b[^>]*>(?:(?!</svg>).)*</svg>"
DIBUJO = "(" + SVG + ")"
COMPU = ["FRM-Formularios-22", "FRM-Biblioteca", "FRM-Plantilla", "FRM-Plantilla-Usar", "FRM-Editor-Reglas-Plantilla"]
TEL = ["M-FRM-Formularios-22", "M-FRM-Biblioteca", "M-FRM-Plantilla", "M-FRM-Reglas-Plantilla"]
leer, escribir, una, props = e12l.leer, e12l.escribir, e12l.una, e12l.props
NADA = '<span class="no">—</span>'


def con_css(t, css):
    assert MARCA not in t
    return una(e14l.para_aprobar(t), "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def alto(t, px):
    """Un tablero de la compu más alto: el `$preview` del Tweak y el alto de la app."""
    t, n = re.subn(r'"\$preview":\{"width":1440,"height":\d+\}', f'"$preview":{{"width":1440,"height":{px}}}', t)
    assert n == 1, n
    return una(t, f"{MARCA}\n", f"{MARCA}\n.w-app {{ height: {px}px !important; }}\n")


def partir(t):
    i, j = t.index("</helmet>"), t.index('<script type="text/x-dc"')
    return t[:i], t[i:j], t[j:]


def celdas(datos):
    """Cada dato con su nombre (263): (nombre, valor[, ocupa las dos columnas])."""
    return "".join(f'<span class="c{" todo" if len(d) > 2 and d[2] else ""}"><span class="k">{d[0]}</span><span class="v">{d[1]}</span></span>'
                   for d in datos)


# ---------------------------------------------------------------------------------------------------------------- la lista
# La de la E21 redibujada (`e21_listas_1004.py`), con los enlaces de la 21: la E22 no tiene editor ni planilla propios.
CFG = dict(e21l.ETAPAS["21"], compu="FRM-Formularios-22", tel="M-FRM-Formularios-22")
EST22 = list(e21l.EST21)
EST22.insert([e for e, *_ in EST22].index("Dados de baja") + 1, ("Nuevo formulario: menú", "T_def", None, {"nuevoMenu": True}))


def vals(estado, bloque, menu, x):
    v = e21l.vals(CFG, estado, bloque, menu, x)
    v["menuNuevo"] = bool(x.get("nuevoMenu"))
    v["expNuevo"] = "true" if x.get("nuevoMenu") else "false"
    return v


def lista_compu():
    t, nl = leer(CFG["compu"])
    t = con_css(t, e21l.CSS_COMPU)
    i = t.index('<div class="w-body">')
    j = b2.fin_div(t, i)
    sin_permiso = re.search(r'<sc-if value="\{\{sinPermiso\}\}".*?</sc-if>', t[i:j], re.S).group(0)
    usados = sorted({m for _, _, m, _ in EST22 if m})
    t = t[:i] + e21l.cuerpo_compu(CFG, usados).replace("@SIN_PERMISO@", sin_permiso) + t[j:]
    nombres = [e for e, *_ in EST22]
    D = {e: vals(e, b, m, x) for e, b, m, x in EST22}
    t = props(t, lambda p: p["estado"].update(options=nombres, default="Activos"))
    t = e21l.nuevo_guion(t, e21l.guion_compu(nombres, D, "Activos"))
    faltan = set(re.findall(r"\{\{(\w+)\}\}", t)) - set(D["Activos"]) - {"si", "no"}
    assert not faltan, faltan
    assert "▲" not in t and 'class="cb cb-sec cb-ch"' not in t and "En WhatsApp</span>" not in t
    escribir(CFG["compu"], t, nl)


_SVG_MENU = ('<svg class="mi-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">')
# Los íconos del menú «Nuevo formulario ▾» de la compu, en la hoja del «+» del teléfono.
NUEVO = [("Desde cero", "M-FRM-Editor.dc.html",
          _SVG_MENU + '<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/>'
          '<path d="M14 3.5V8h4.5"/><path d="M9 12.5h6"/><path d="M9 16h4"/></svg>'),
         ("Desde una plantilla", "M-FRM-Biblioteca.dc.html",
          _SVG_MENU + '<path d="M9 6.5h10.5M9 12h10.5M9 17.5h10.5"/><circle cx="4.8" cy="6.5" r="1.1"/><circle cx="4.8" cy="12" r="1.1"/>'
          '<circle cx="4.8" cy="17.5" r="1.1"/></svg>')]


def hoja_nuevo(h):
    i = h.index('<div class="ap-acciones">')
    j = b2.fin_div(h, i)
    ops = "".join(f'<a class="op" role="menuitem" href="{href}">{svg}{n}</a>' for n, href, svg in NUEVO)
    return h[:i] + f'<div class="e2-ops">{ops}</div>' + h[j:]


def lista_tel():
    """Como `lista_tel` de `e21_listas_1004.py`, con el estado de la E22 «Nuevo formulario: elegir» (la lista, con su hoja)."""
    cfg = CFG
    nombre = cfg["tel"]
    t, nl = leer(nombre)
    t = con_css(t, e21l.CSS_TEL_LISTA)
    lista_k = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    assert "Nuevo formulario: elegir" in lista_k
    s = {e: f"s{i}" for i, e in enumerate(lista_k)}
    principio, cuerpos, hojas, fin = e21l.partes_tel(t)
    cuerpo = dict(cuerpos)
    viejo0 = cuerpo["s0"]
    barra_lista = viejo0[viejo0.index(">") + 1:viejo0.index('<div class="ap-cuerpo">')]
    fab = re.search(r'<a class="ap-fab".*?</a>', viejo0, re.S).group(0)
    viejo1 = cuerpo["s1"]
    barra_filtros = viejo1[viejo1.index(">") + 1:viejo1.index('<div class="ap-cuerpo">')]
    volver = re.search(r'aria-label="Volver" href="[^"]+">(<svg.*?</svg>)</a>', barra_filtros, re.S).group(1)
    for n in ["Ordenar por", "Uno solo para clientes"]:
        s[n] = f"s{len(lista_k)}"
        lista_k.append(n)

    def ordtel(vista, por):
        return f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">{e21l.texto_orden(vista, por)} {b2.SVG_FLECHA}</button></div>'

    def lista(clave, tip=False):
        vista, nombres, por = cfg["bloques"][clave]
        tarjetas = "".join(e21l.tarjeta(cfg, vista, n, tip_cargar=tip and n == "Entrega de pedido") for n in nombres)
        return barra_lista + ordtel(vista, por) + f'<div class="ap-cuerpo">{tarjetas}</div>' + (fab if vista in ("t20", "t21") else "")

    filtros = (barra_filtros + '<div class="ap-cuerpo"><div class="t10-fl">' + e12l.campo_tel("Estado", "Activos") + "</div></div>"
               '<div class="t10-pie"><button type="button" class="cb cb-sec">Limpiar todo</button>'
               '<button type="button" class="cb cb-pri">Listo</button></div>')
    vista_d, _, por_d = cfg["bloques"]["T_def"]
    carga = barra_lista + ordtel(vista_d, por_d) + e21l.PREVIA_TEL
    error = (barra_lista + ordtel(vista_d, por_d) + '<div class="ap-cuerpo"><div class="ap-vacio">No pudimos cargar los formularios.'
             '<button type="button" class="cb cb-sec">Reintentar</button></div></div>')
    que = {"Activos": lista("T_def"), "Filtros": filtros, "Dados de baja": lista("T_baja"),
           "Acciones de un publicado": lista("T_def"), "Acciones de un borrador": lista("T_def"),
           "Acciones de un dado de baja": lista("T_baja"), "Copiar": lista("T_def"), "Dar de baja": lista("T_def"),
           "Borrar": lista("T_def"), "Nuevo formulario: elegir": lista("T_def"),
           "Quien solo ve respuestas": lista("V_def"), "Quien solo ve respuestas: filtros": filtros,
           "Quien solo carga": lista("C_def"), "Quien solo carga: dados de baja": lista("C_baja"),
           "Quien solo aprueba": lista("A_def"), "Cargando": carga, "No se pudo cargar": error,
           "Ordenar por": e14l.pantalla_ordenar(volver, nombre, por_d, e21l.ORDEN[e21l.tipo_de(vista_d, por_d)][1]),
           "Uno solo para clientes": lista("T_def", tip=True)}
    nuevos_cuerpos = []
    for e in lista_k:
        var = s[e]
        if e == "Reactivar":
            nuevos_cuerpos.append(e21l.reactivar_tel(cuerpo[var]))
            continue
        nuevos_cuerpos.append(e21l.sc(var, que[e], "si" if var == "s0" else "no"))
    acciones = e21l.hojas_tel(cfg)
    nuevas_hojas = []
    for var, h in hojas:
        e = lista_k[int(var[1:])]
        if e in acciones:
            i = h.index('<div class="ap-acciones">')
            j = b2.fin_div(h, i)
            h = h[:i] + e21l.ops_tel(acciones[e]) + h[j:]
        elif e == "Nuevo formulario: elegir":
            h = hoja_nuevo(h)
        nuevas_hojas.append(h)
    t = principio + "".join(nuevos_cuerpos) + '<span class="ap-raya"></span>' + "".join(nuevas_hojas) + fin

    def poner(p):
        ops = p["estado"]["options"]
        ops.insert(ops.index("Filtros") + 1, "Ordenar por")
        ops.insert(ops.index("Acciones de un dado de baja") + 1, "Uno solo para clientes")
    t = props(t, poner)
    clase = ("class Component extends DCLogic {\n  renderVals() {\n"
             "    const e = this.props.estado ?? \"Activos\";\n"
             f"    const k = {json.dumps(lista_k, ensure_ascii=False)}.indexOf(e);\n"
             "    return {\n      si: true, no: false,\n"
             + "".join(f"      s{i}: k === {i},\n" for i in range(len(lista_k))) + "    };\n  }\n}\n")
    t = e21l.nuevo_guion(t, clase)
    assert 'class="ap-fila' not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S), "quedó una fila vieja"
    assert 'class="ap-acciones"' not in "".join(nuevas_hojas[:4])
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- la biblioteca
# Las dos plantillas publicadas que ve la organización (spec §8): «Control de vehículo» es un borrador y «Orden de trabajo» se
# retiró, así que no están; «Calidad» no tiene plantillas.
PLANTILLAS = [
    ("Comprobante de transferencia", "Los datos de una transferencia que manda un cliente: el banco, el monto y la fecha, con el comprobante.",
     "Clientes", "5", "0", None),
    ("Visita a cliente", "Lo que pasó en la visita a un cliente: si se concretó la venta, el monto y el motivo.",
     "Empleados", "8", "2", "«Visita a cliente» y 1 más"),
]


def datos_plantilla(desc, para, preg, cat, uso):
    return [("Descripción", desc, True), ("Para quién es", para), ("Preguntas", preg), ("Catálogos", cat),
            ("La usaste en", uso or NADA, True)]


CSS_BIBLIOTECA = """
/* E22 · cada tarjeta nombra sus datos (263): la descripción, para quién es, las preguntas, los catálogos y dónde la usaste (198). */
.bt-card .bt-dl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px 14px; margin-top: 4px; }
.bt-card .bt-dl > .c { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.bt-card .bt-dl > .c.todo { grid-column: 1 / -1; }
.bt-card .bt-dl .k { font-size: 12.5px; line-height: 1.3; color: var(--t2); }
.bt-card .bt-dl .v { font-size: 13.5px; line-height: 1.45; color: var(--t1); overflow-wrap: anywhere; }
.bt-card .bt-dl .no { color: var(--t3); }
/* 160 · el esqueleto, del alto de una tarjeta con tres renglones de descripción. */
.bt-esq span { height: 180px; }
"""


def biblioteca():
    t, nl = leer("FRM-Biblioteca")
    t = con_css(t, CSS_BIBLIOTECA)
    cab, cuerpo, guion = partir(t)
    por_nombre = {p[0]: p for p in PLANTILLAS}

    def tarjeta(m):
        n, desc, para, preg, cat, uso = por_nombre[m.group(2)]
        return f'<a class="bt-card" href="{m.group(1)}"><b>{n}</b><span class="bt-dl">{celdas(datos_plantilla(desc, para, preg, cat, uso))}</span></a>'
    cuerpo, n = re.subn(r'<a class="bt-card" href="([^"]+)"><b>([^<]+)</b>.*?</a>', tarjeta, cuerpo, flags=re.S)
    assert n == 2, n
    # 175 · el total ya lo dice la banda: la caja del buscador queda con el buscador.
    cuerpo, k = re.subn(r'<span class="tot">\d+ plantillas</span>', "", cuerpo)
    assert k == 4, k
    assert 'class="p"' not in cuerpo and "preguntas ·" not in cuerpo
    escribir("FRM-Biblioteca", cab + cuerpo + guion, nl)


CSS_BIBLIOTECA_TEL = b2.css(True) + """
/* E22 · cada plantilla, una tarjeta con cada dato con su nombre (263); sin ⋮, el nombre llega hasta el borde. */
.b2-tj.bt-tj { padding-right: 16px; }
.b2-tj .v .no { color: var(--t3); }
"""


def biblioteca_tel():
    t, nl = leer("M-FRM-Biblioteca")
    t = con_css(t, CSS_BIBLIOTECA_TEL)
    cab, cuerpo, guion = partir(t)
    por_nombre = {p[0]: p for p in PLANTILLAS}

    def tarjeta(m):
        n, desc, para, preg, cat, uso = por_nombre[m.group(2)]
        tj = b2.tarjeta(n, datos_plantilla(desc, para, preg, cat, uso), href=m.group(1))
        return tj.replace('<div class="b2-tj">', '<div class="b2-tj bt-tj">', 1)
    cuerpo, n = re.subn(r'<a class="ap-fila" href="([^"]+)"><div class="tx"><span class="l1">([^<]+)</span>.*?</div></a>', tarjeta, cuerpo,
                        flags=re.S)
    assert n == 2, n
    assert "ap-fila" not in cuerpo and "preguntas ·" not in cuerpo
    escribir("M-FRM-Biblioteca", cab + cuerpo + guion, nl)


# ---------------------------------------------------------------------------------------------------------------- la plantilla
DESC_VISITA = "Lo que pasó en la visita a un cliente: si se concretó la venta, el monto y el motivo."
# Los catálogos que trae «Visita a cliente», como los muestra `FRM-Catalogos`: (nombre, de dónde salen, tipo de valor, opciones).
CATALOGOS = [("Clientes", "De los contactos de WhatsApp", None, None), ("Motivos de visita", "Escritas a mano", "Texto", "3")]
ENC_LECTURA = ('<div class="q-th" role="row"><span role="columnheader">#</span><span role="columnheader">Pregunta</span>'
               '<span role="columnheader">Tipo</span><span role="columnheader">Obligatoria</span></div>')

CSS_PLANTILLA = """
/* E22 · las preguntas de la plantilla en columnas (263 y 285): el número, el nombre, el tipo y «Obligatoria», sin acciones porque se
   leen. Los anchos ya van con la escala de la compu, como los de `FRM-Editor`: la pasada no toca `grid-template-columns`. */
.q-th, .q-it { display: grid; grid-template-columns: 20px minmax(0, 1fr) 200px 76px; column-gap: 12px; align-items: center; }
.q-th { position: relative; min-height: 40px; padding: 0 8px 0 16px; border-bottom: 1px solid oklch(0.89 0.031 95); background: oklch(0.975 0.006 95); color: var(--t2); font-size: 13px; font-weight: 600; }
.q-th > span { min-width: 0; white-space: nowrap; }
.q-it .dato { min-width: 0; }
.q-it .q-tp, .q-it .q-ob { min-width: 0; color: var(--t1); font-size: 13px; line-height: 1.35; }
/* 137 · la línea fina entre columnas. */
.q-th > * + *::after, .q-it > * + *::after { content: ""; position: absolute; top: 0; bottom: 0; width: 1px; margin-left: -6px; background: oklch(0.915 0.013 95 / 0.8); pointer-events: none; }
.q-th > * + *::after { background: oklch(0.89 0.031 95); }
/* E22 · «Catálogos que trae», una tabla como `FRM-Catalogos` (263): cada dato en su columna; el número, a la derecha (137). */
.w-th.t3b-ct, .w-tr.t3b-ct { grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr) 100px 80px; }
.w-th.t3b-ct > .nd, .w-tr.t3b-ct > .nd { text-align: right; }
.w-tr.t3b-ct .no { color: var(--t3); }
"""


def tabla_catalogos():
    th = ('<div class="w-th t3b-ct"><span aria-sort="ascending">Catálogo<span class="b2-fl" aria-hidden="true">↑</span></span>'
          '<span>De dónde salen</span><span>Tipo de valor</span><span class="nd">Opciones</span></div>')
    filas = "".join(f'<div class="w-tr t3b-ct"><span>{n}</span><span>{o}</span><span>{tv or NADA}</span>'
                    f'<span class="nd num">{c or NADA}</span></div>' for n, o, tv, c in CATALOGOS)
    return th + filas


def plantilla_cuerpo(cuerpo):
    """La vista de una plantilla en la compu (también detrás del diálogo para usarla)."""
    # Las preguntas, en columnas.
    def fila(m):
        tipo, ob = e21r.tipo_y_ob(m.group(3))
        return (f'<div class="q-it"><span class="num">{m.group(1)}</span><span class="dato"><b>{m.group(2)}</b></span>'
                f'<span class="q-tp">{tipo}</span><span class="q-ob">{ob}</span></div>')
    cuerpo, n = re.subn(r'<div class="q-it"><span class="num">(\d+)</span><span class="dato"><b>([^<]*)</b><span>([^<]*)</span></span>'
                        r'<span class="chips"></span><span class="ib" aria-hidden="true"></span></div>', fila, cuerpo)
    cuerpo, k = re.subn(r'(<div class="f-cab"><span>Preguntas</span><span class="der"></span></div>)', lambda m: m.group(1) + ENC_LECTURA, cuerpo)
    assert n == 8 * k and k >= 2, (n, k)
    # Los catálogos que trae, en su tabla.
    cuerpo, c = re.subn(r'(?:<div class="pt-it"><b>[^<]*</b><span>[^<]*</span></div>)+', lambda m: tabla_catalogos(), cuerpo)
    assert c == k, c
    # La descripción, un dato más de la lectura.
    cuerpo, d = re.subn(r'<div class="pt-d"><p>([^<]*)</p><div class="g-det">',
                        lambda m: f'<div class="pt-d"><div class="g-det"><span class="k">Descripción</span><span>{m.group(1)}</span>', cuerpo)
    assert d == k, d
    cuerpo = cuerpo.replace('<span class="sug">sugerido: ', '<span class="sug">Sugerido: ')
    cuerpo = cuerpo.replace('href="FRM-Biblioteca.dc.html" aria-label="Volver a Formularios"', 'href="FRM-Biblioteca.dc.html" aria-label="Volver a la biblioteca"')
    assert "pt-it" not in cuerpo and "sugerido:" not in cuerpo and "Volver a Formularios" not in cuerpo
    print("  preguntas:", n, "cajas:", k)
    return cuerpo


def plantilla(nombre):
    t, nl = leer(nombre)
    t = con_css(t, CSS_PLANTILLA)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    escribir(nombre, cab + plantilla_cuerpo(cuerpo) + guion, nl)


SIN_CATALOGOS = "Trae catálogos: para usarla necesitás el permiso «Administrar catálogos»."
CSS_PLANTILLA_TEL = e14e.CSS_TEL + """
/* E22 · la lectura de la plantilla y cada catálogo, con cada dato con su nombre (263); una pregunta, la tarjeta de `M-FRM-Editor`. */
.b2-tj.t3b-lec { padding: 12px 16px; }
.b2-tj.t3b-lec > .dl:first-child { margin-top: 0; }
.ap-grupo > .b2-tj:last-child { border-bottom: 0; }
.b2-tj .v .no { color: var(--t3); }
"""


def plantilla_tel():
    t, nl = leer("M-FRM-Plantilla")
    t = con_css(t, CSS_PLANTILLA_TEL)
    cab, cuerpo, guion = partir(t)
    # La barra dice la categoría, como la banda de la compu; las preguntas pasan a la lectura.
    cuerpo, n = re.subn(r'<span class="sub">Ventas · 8 preguntas</span>', '<span class="sub">Ventas</span>', cuerpo)
    assert n == 5, n
    lectura = ('<div class="b2-tj t3b-lec"><span class="dl">'
               + celdas([("Descripción", DESC_VISITA, True), ("Categoría", "Ventas"), ("Para quién es", "Empleados"), ("Preguntas", "8"),
                         ("La usaste en", "«Visita a cliente» y 1 más", True)]) + "</span></div>")
    cuerpo, n = re.subn(r'<div class="t-dato">[^<]*<small>Para empleados</small><small>La usaste en «Visita a cliente» y 1 más</small></div>',
                        lectura, cuerpo)
    assert n == 4, n

    def pregunta(m):
        tipo, ob = e21r.tipo_y_ob(m.group(3))
        return (f'<div class="b2-tj q-tj"><span class="num">{m.group(1)}</span><span class="nm">{m.group(2)}</span>'
                f'<span class="dl">{celdas([("Tipo", tipo), ("Obligatoria", ob)])}</span></div>')
    cuerpo, n = re.subn(r'<div class="q-row ro"><span class="num">(\d+)</span><span class="tx"><b>([^<]*)</b><span>([^<]*)</span></span></div>',
                        pregunta, cuerpo)
    assert n == 32, n
    por_nombre = {c[0]: c for c in CATALOGOS}

    def catalogo(m):
        n_, o, tv, c = por_nombre[m.group(1)]
        return (f'<div class="b2-tj t3b-lec"><span class="nm">{n_}</span><span class="dl">'
                + celdas([("De dónde salen", o, True), ("Tipo de valor", tv or NADA), ("Opciones", c or NADA)]) + "</span></div>")
    cuerpo, n = re.subn(r'<div class="q-row ro"><span class="tx"><b>([^<]*)</b><span>[^<]*</span></span></div>', catalogo, cuerpo)
    assert n == 8, n
    # 211 · sin el permiso de catálogos, el motivo va en el tooltip del botón, que abre el toque; no en un texto debajo.
    viejo = (f'<div class="ap-fijo col"><button type="button" class="cb cb-pri full" disabled>Usar esta plantilla</button>'
             f'<span class="mot">{SIN_CATALOGOS}</span></div>')
    nuevo = (f'<div class="ap-fijo"><span class="acc-apagado"><button type="button" class="cb cb-pri full" aria-disabled="true" '
             f'aria-label="Usar esta plantilla: no disponible. {SIN_CATALOGOS}">Usar esta plantilla</button>{b2.tip(SIN_CATALOGOS)}</span></div>')
    cuerpo = una(cuerpo, viejo, nuevo)
    cuerpo = cuerpo.replace('<span class="sug">sugerido: ', '<span class="sug">Sugerido: ')
    assert "q-row" not in cuerpo and "t-dato" not in cuerpo and "sugerido:" not in cuerpo
    escribir("M-FRM-Plantilla", cab + cuerpo + guion, nl)


# ---------------------------------------------------------------------------------------------------------------- las reglas
HIST = "Todavía no se guardaron: vienen de la plantilla."


def con_casillas(cuerpo, tilde, tel=False):
    """276 · Después del rol de «Pedir aprobación a un rol», sus dos casillas, como `con_casillas` de `e21_reglas_1004.py`; acá el
    campo del rol lleva además la clase `rg-sel`."""
    n = 0
    while True:
        i = cuerpo.find(f'aria-label="{e21r.ROL_I_VIEJO}"')
        if i < 0:
            break
        a = cuerpo.rfind('<div class="w-cmp', 0, i)
        b = e14e.cierre(cuerpo, a, "div")
        campo = cuerpo[a:b].replace(e21r.ROL_I_VIEJO, e21r.ROL_I)
        cuerpo = cuerpo[:a] + campo + e21r.casillas(tilde, tel=tel) + cuerpo[b:]
        n += 1
    print("  pedir aprobación, con sus casillas:", n)
    return cuerpo


def roles(sugerido):
    return [("Administrador", None), ("Dueño", None), ("Supervisor", "Sugerido" if sugerido == "Supervisor" else None), ("Vendedor", None)]


def rol_sugerido(cuerpo):
    """263 y 262 · «Rol sugerido: X» deja de ir debajo del rol: el campo vacío lo dice en gris y su opción lleva «Sugerido»."""
    def abierto(m):
        sug = m.group(2)
        nombres = [re.sub(r"<small>.*?</small>", "", o) for o in re.findall(r'<span role="option">(.*?)</span>', m.group(1))]
        assert nombres == [n for n, _ in roles(sug)], nombres
        lista = b2.lista([b2.op(n, d) for n, d in roles(sug)])
        return b2.campo(f"Sugerido: {sug}", vacio=True, abierto=True, aria="Rol", extra=lista)
    cuerpo, a = re.subn(r'<div class="ct sel ph"><span class="v">Elegí el rol</span>' + SVG + r'</div><div class="rg2-menu" role="listbox" '
                        r'aria-label="Rol">(.*?)</div><span class="dato2">Rol sugerido: ([^<]+)</span>', abierto, cuerpo, flags=re.S)
    cuerpo, c = re.subn(r'<div class="ct sel ph"><span class="v">Elegí el rol</span>' + SVG + r'</div><span class="dato2">Rol sugerido: ([^<]+)</span>',
                        lambda m: b2.campo(f"Sugerido: {m.group(1)}", vacio=True, aria="Rol"), cuerpo, flags=re.S)
    assert (a, c) == (1, 1), (a, c)
    # Lo demás que falta elegir, vacío en gris; la pregunta que se borró, en rojo.
    cuerpo, v = re.subn(r'<div class="ct sel ph"><span class="v">([^<]*)</span>' + SVG + r'</div>',
                        lambda m: b2.campo(m.group(1), vacio=True, aria=e21r.aria_antes(cuerpo, m.start())), cuerpo, flags=re.S)
    cuerpo, e = re.subn(r'<div class="ct sel mal"><span class="v">([^<]*)</span>' + SVG + r'</div>',
                        lambda m: b2.campo(m.group(1), error=True, aria="Pregunta"), cuerpo, flags=re.S)
    assert "dato2" not in cuerpo and "rg2-menu" not in cuerpo
    print("  rol sugerido:", a + c, "vacíos:", v, "con error:", e)
    return cuerpo


def donde_se_completa(cuerpo):
    """229 · «Dónde se completa», al lado del prefijo, con lo que trae una copia: «En la app y por WhatsApp»."""
    m = re.search(r'<div class="w-cmp"><span class="rt">Prefijo de numeración <span class="req">\*</span><span class="f-i"[^>]*>' + DIBUJO,
                  cuerpo, re.S)
    assert m and cuerpo.count("Prefijo de numeración") == 1
    campo = (f'<div class="w-cmp"><span class="rt">Dónde se completa <span class="req">*</span><span class="f-i" tabindex="0" role="img" '
             f'aria-label="{e21r.DONDE_I}" title="{e21r.DONDE_I}">{m.group(1)}</span></span>{b2.campo(e21r.DONDE, aria="Dónde se completa")}</div>')
    fin = e14e.cierre(cuerpo, m.start(), "div")
    return cuerpo[:fin] + campo + cuerpo[fin:]


def reglas_compu():
    nombre = "FRM-Editor-Reglas-Plantilla"
    t, nl = leer(nombre)
    t = alto(con_css(t, e14e.CSS_COMPU + e21r.CSS_REGLAS), 1700)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    cuerpo = e21r.filas_columnas(cuerpo)
    cuerpo = donde_se_completa(cuerpo)
    cuerpo = rol_sugerido(cuerpo)
    cuerpo = e21r.piezas_reglas(cuerpo)
    m = re.search(r'<span class="q-chk"><i>' + DIBUJO + "</i>", cuerpo, re.S)
    cuerpo = con_casillas(cuerpo, m.group(1) if m else b2.SVG_TILDE)
    cuerpo = cuerpo.replace('<span class="sug">sugerido: ', '<span class="sug">Sugerido: ')
    assert 'class="ct sel' not in cuerpo and "sugerido:" not in cuerpo
    escribir(nombre, cab + cuerpo + guion, nl)


CSS_REGLAS_TEL = b2.css(True) + e21r.CSS_TEL_REGLAS + """
/* 211 · «Historial» apagado dice su motivo en el tooltip, que abre el toque, debajo del control; ya no en un texto debajo. */
.rg-acc .t3b-hist { position: relative; display: inline-flex; align-items: center; min-height: 44px; cursor: default; }
.rg-acc .t3b-hist .acc-tip { left: -8px; }
"""


def historial(abierto):
    tip = f'<span class="acc-tip b2-tip-abajo" role="tooltip">{HIST}</span>' if abierto else ""
    return (f'<div class="rg-acc"><span class="off t3b-hist" tabindex="0" role="button" aria-disabled="true" '
            f'aria-label="Historial: no disponible. {HIST}">Historial{tip}</span><a href="#">Agregar regla</a></div>')


def reglas_tel():
    nombre = "M-FRM-Reglas-Plantilla"
    t, nl = leer(nombre)
    t = con_css(t, CSS_REGLAS_TEL)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    cuerpo = e21r.piezas_tel(cuerpo)
    # El rol vacío dice el sugerido en gris (263), y debajo van las dos casillas de «Pedir aprobación» (276).
    cuerpo, n = re.subn(r'<div class="ct ph sel">Elegí el rol' + SVG + r'</div></div><span class="ab-sub">Rol sugerido: ([^<]+)</span>',
                        lambda m: b2.campo(f"Sugerido: {m.group(1)}", vacio=True, abierto=True, aria="Rol") + "</div>"
                        + e21r.casillas(b2.SVG_TILDE, tel=True), cuerpo, flags=re.S)
    assert n == 1, n
    # La hoja «Rol» pasa a la pieza a pantalla completa (262), con «Sugerido» en gris debajo de su opción.
    i = cuerpo.index('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Rol">')
    j = b2.fin_div(cuerpo, cuerpo.index('<div class="ap-hoja"', i))
    cuerpo = cuerpo[:i] + b2.pk_tel("Rol", [(r, d, False, None) for r, d in roles("Supervisor")]) + cuerpo[j:]
    # «Historial», con su motivo en el tooltip (211): abierto en «Las reglas de la plantilla».
    viejo = ('<div class="rg-acc"><span class="off" aria-disabled="true">Historial</span><a href="#">Agregar regla</a></div>'
             f'<p class="rg-mot">{HIST}</p>')
    assert cuerpo.count(viejo) == 2
    cuerpo = cuerpo.replace(viejo, historial(True), 1).replace(viejo, historial(False), 1)
    cuerpo = cuerpo.replace('<span class="sug">sugerido: ', '<span class="sug">Sugerido: ')
    assert "ab-sub" not in cuerpo and "rg-mot" not in cuerpo and "ap-acciones2" not in cuerpo and "sugerido:" not in cuerpo
    escribir(nombre, cab + cuerpo + guion, nl)


# ---------------------------------------------------------------------------------------------------------------- todo
def main():
    hechos = [n for n in COMPU + TEL if MARCA in leer(n)[0]]
    if hechos:
        print("ya tienen el bloque, no hace nada:", ", ".join(hechos))
        return
    lista_compu()
    lista_tel()
    biblioteca()
    biblioteca_tel()
    plantilla("FRM-Plantilla")
    plantilla("FRM-Plantilla-Usar")
    plantilla_tel()
    reglas_compu()
    reglas_tel()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(COMPU + TEL)], check=True)


if __name__ == "__main__":
    main()
