"""La E16 con el traspaso 18, tanda 3 (2026-11-26): «Datos de las personas» y la ficha del usuario con sus datos, redibujados en su
lugar, con la forma que la E12 a la E14 dejaron en sus listados (`e12_listado_1004.py`, `e14_listados_1004.py`) y en la pieza
(`e13_modales_1004.py`). Mandan la spec `docs/plans/formularios/16-datos-de-las-personas.md` («Datos de las personas», «El diálogo
para definir un dato», «La ficha del usuario») y las decisiones 206 y 261 a 264 de la hoja de ruta:

- `FRM-Datos-Personas`:
  - en «Datos», Tipo y Catálogo van cada uno en su columna, nunca «De un catálogo · Zonas» (263); «De baja», que iba como texto
    debajo de «Legajo», pasa a la columna «Estado», antes de la de acciones, con el punto y la palabra, «Activo» o «De baja» (206), y
    el nombre queda solo;
  - cada fila de «Datos» y de «Personas» tiene el ⋮ en lugar del ✎ (261; estas tablas no se ordenan a mano): el de un dato abre
    «Editar» (el diálogo) y el de una persona, «Editar» (la pestaña «Datos» de su ficha). Sin `users.manage` a una persona no le queda
    nada en el ⋮: «Sin editar los valores» la dibuja sin ⋮ y sin la columna de acciones (269);
  - las dos tablas ordenan por el encabezado, con «Ordenar por» al final de su barra (264). «Datos» abre en su posición (el orden del
    servidor sin `sort`, plan §11), así que no lleva flecha y el botón dice solo «Ordenar por»; «Personas» abre por la persona, de la A
    a la Z, con la flecha después de «Persona», y suma la separación entre la búsqueda y «Ordenar por». «Lo usan» no ordena (varios
    valores);
  - en el diálogo, el Tipo va en la pieza (262), y el Catálogo también, como en el modal de campos de la E13: cerrada dice «Zonas» y
    abierta trae cada catálogo con sus opciones en gris debajo, el buscador adentro y la cantidad. En uso, las dos piezas quedan
    apagadas, con la lista de formularios que ya decía por qué;
  - estados nuevos: «Acciones de un dato» y «Acciones de una persona» (el ⋮ abierto), «Ordenar por abierto» (la pieza con «Columna»
    y «Orden» sobre «Personas»), «Ordenado por Zona» (por el valor del dato, lo vacío al final y el desempate por la persona) y
    «Elegir el tipo» (la pieza del tipo abierta);
  - «Todavía no hay datos» ya no muestra la tabla de personas con columnas de datos que no existen (269, datos de verdad): sin datos,
    «Personas» no se dibuja (pregunta en el reporte). «1 personas» pasa a «1 persona».
- `M-FRM-Datos-Personas`: cada dato es una tarjeta con Clave, Tipo, Catálogo y Estado, cada uno con su nombre, y su ⋮ en lugar del ✎;
  cada persona, una tarjeta con un dato por nombre, sin «Centro · Casa central» ni «— · —» debajo del nombre (263). «Ordenar por»
  arriba de cada lista, a todo el ancho (264). En la hoja «Agregar dato», el Tipo y el Catálogo en la pieza (262) y la (i) de la Clave,
  como en la compu. Estados nuevos: «Un dato dado de baja» (con «Estado: De baja» como su lectura), «Acciones de un dato» (su hoja),
  «Ordenar por» (su pantalla), «Sin editar los valores» (las personas sin enlace a su ficha), «Elegir el tipo» y «Elegir el catálogo»
  (la pieza a pantalla completa).
- `FRM-Usuario-Datos` y `M-FRM-Usuario-Datos` (la pestaña «Datos»): la Zona se elige con la pieza (262), no con un desplegable propio.
  La opción guardada dada de baja ya no dice «Cuyo» con «De baja» al lado (compu) ni «Cuyo · De baja» (teléfono): «Una opción dada de
  baja» abre la pieza, con la guardada primero, su tilde y «De baja» en gris debajo, y después las activas, como «Un valor de una opción
  dada de baja» de la E13. La pestaña «Acceso» es la de la ficha del núcleo (`Usuario-Base2`) y no cambia acá.

Escribe las medidas de antes de la escala en un bloque `<style data-e16="t3">`, que lo frena si ya está, y al final corre
`traspaso10_piezas_1004.py --tableros` con los cuatro, que pone la escala de la compu. Para volver a correrlo, primero se restauran los
cuatro tableros (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
"""
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12e  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
MARCA = '<style data-e16="t3">'
TABLEROS = ["FRM-Datos-Personas", "M-FRM-Datos-Personas", "FRM-Usuario-Datos", "M-FRM-Usuario-Datos"]
leer, escribir, una = e12l.leer, e12l.escribir, e12l.una
cierre, sc_ifs, renombrar, sumar_estados = e12e.cierre, e12e.sc_ifs, e12e.renombrar, e12e.sumar_estados

NADA = '<span class="dp-g">—</span>'
SVG_EDITAR = ('<svg class="mi-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>')
# Los catálogos a mano activos que puede usar un dato (`GET /person-data/catalogs`), con sus opciones.
CATALOGOS = [("Motivos de visita", "3 opciones"), ("Productos", "10 opciones"), ("Recargo por zona", "6 opciones"),
             ("Tipos de producto", "12 opciones"), ("Zonas", "6 opciones")]
TIPOS = ["Texto", "De un catálogo"]
# Las opciones activas de «Zonas»; «Cuyo» está dada de baja y una persona la conserva (spec: se conserva y sigue filtrando).
ZONAS = ["Centro", "Litoral", "Norte", "Oeste", "Patagonia", "Sur"]
ORDEN_DATOS = "Ordenar por"
ORDEN_PERSONA = "Ordenar por: Persona, de la A a la Z"
ORDEN_ZONA = "Ordenar por: Zona, de la A a la Z"
# Por «Zona», de la A a la Z: los empates por la persona y lo vacío al final (264, plan §11).
POR_ZONA = ["Juan Gómez", "Lucía Fernández", "Paula Méndez", "Martín Paz", "Sofía Herrera", "Tomás Acosta"]


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def para_aprobar(t):
    m = re.search(r"<title>([^<]*)</title>", t)
    assert "para aprobar" not in m.group(1)
    return t[:m.end(1)] + " · para aprobar" + t[m.end(1):]


def subn(rx, fn, t, esperadas):
    t, n = rx.subn(fn, t)
    assert n == esperadas, (rx.pattern[:70], n, esperadas)
    return t


def lista_catalogos():
    return b2.lista([b2.op(n, d, elegida=n == "Zonas", activa=n == "Zonas") for n, d in CATALOGOS], buscar="",
                    cantidad=f"{len(CATALOGOS)} catálogos")


def lista_tipos():
    return b2.lista([b2.op(x, elegida=x == "De un catálogo", activa=x == "De un catálogo") for x in TIPOS])


def lista_zona_baja():
    """La guardada dada de baja primero, con su tilde y «De baja» en gris; después, las activas de la fuente (E13)."""
    return b2.lista([b2.op("Cuyo", "De baja", elegida=True, activa=True)] + [b2.op(z, sep=k == 0) for k, z in enumerate(ZONAS)],
                    buscar="", cantidad=f"{len(ZONAS)} opciones")


# ---------------------------------------------------------------------------------------------------------------- la compu
CSS_COMPU = e14l.CSS_LISTADO + """
/* E16 · «Datos»: Dato, Clave, Tipo, Catálogo, Lo usan, Estado y el ⋮, cada dato en su columna (263 y 206). */
.dp-d { grid-template-columns: minmax(130px, 1fr) 120px 124px minmax(120px, 1fr) minmax(150px, 1.2fr) 104px 48px; gap: 12px; }
/* «Personas»: la persona, un dato por columna y el ⋮ (261); sin «Administrar usuarios», sin la columna de acciones (269). */
.dp-p { grid-template-columns: minmax(200px, 1.6fr) minmax(150px, 1fr) minmax(150px, 1fr) 48px; gap: 12px; }
.dp-p.sin { grid-template-columns: minmax(200px, 1.6fr) minmax(150px, 1fr) minmax(150px, 1fr); }
.w-tr.dp-p .f-menu { position: absolute; right: 12px; top: calc(100% - 6px); z-index: 20; min-width: 190px; }
.dp-ac a.f-mi { text-decoration: none; }
/* La barra de cada tabla, con «Ordenar por» último (264); en «Datos», solo él. */
.dp-fb { position: relative; z-index: 5; }
.dp-fb .w-bus { flex: 0 1 360px; }
/* El diálogo de un dato: la pieza del Tipo y la del Catálogo (262). */
.dp-form .w-cmp .b2-env { width: 100%; }
"""


def keb(nombre):
    return (f'<button type="button" class="ib" aria-label="Acciones de {nombre}" aria-haspopup="menu" aria-expanded="false">'
            f'{b2.SVG_KEB}</button>')


def ordenar(texto, pop=""):
    exp = "true" if pop else "false"
    return (f'<span class="envoltura b2-ordenar"><button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="{exp}">'
            f'{texto} {b2.SVG_FLECHA}</button>{pop}</span>')


POP_PERSONAS = ('<div class="b2-pop" role="dialog" aria-label="Ordenar por"><div class="b2-pop-c"><span class="et">Columna</span>'
                + b2.campo("Persona", abierto=True, aria="Columna",
                           extra=b2.lista([b2.op(c, elegida=k == 0, activa=k == 0) for k, c in enumerate(["Persona", "Zona", "Sucursal"])]))
                + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo("De la A a la Z", aria="Orden") + "</div></div>")

CAB_DATOS_VIEJA = ('<div class="w-th dp-d"><span>Dato</span><span>Clave</span><span>Tipo</span><span>Lo usan</span>'
                   '<span class="dp-ac">Acciones</span></div>')
# Sin `sort`, los datos van en su posición: ninguna columna ordena todavía, así que no hay flecha (264, Criterio-Tablas-Base2).
CAB_DATOS = ('<div class="dp-fb dp-ord">' + ordenar(ORDEN_DATOS) + '</div><div class="w-th dp-d"><span>Dato</span><span>Clave</span>'
             '<span>Tipo</span><span>Catálogo</span><span>Lo usan</span><span>Estado</span><span class="dp-ac">Acciones</span></div>')
FILA_DATO = re.compile(r'<div class="w-tr dp-d(?P<aten> aten)?"><span>(?P<n>[^<]+)(?P<baja><span class="sub">De baja</span>)?</span>'
                       r'<span class="mono">(?P<k>[^<]+)</span><span>(?P<tipo>[^<]+)</span><span>(?P<usan>.*?)</span>'
                       r'<span class="dp-ac"><button type="button" class="ib" aria-label="Editar (?P=n)"><svg.*?</svg></button></span></div>', re.S)


def fila_dato(m):
    tipo, _, catalogo = m["tipo"].partition(" · ")
    est = b2.est("", "De baja") if m["baja"] else b2.est("ok", "Activo")
    return (f'<div class="w-tr dp-d{m["aten"] or ""}"><span>{m["n"]}</span><span class="mono">{m["k"]}</span><span>{tipo}</span>'
            f'<span>{catalogo or NADA}</span><span>{m["usan"]}</span><span>{est}</span><span class="dp-ac">{keb(m["n"])}</span></div>')


CAB_PERSONAS = '<div class="w-th dp-p"><span>Persona</span><span>Zona</span><span>Sucursal</span><span class="dp-ac">Acciones</span></div>'
CAB_PERSONAS_SIN = '<div class="w-th dp-p"><span>Persona</span><span>Zona</span><span>Sucursal</span><span></span></div>'


def cab_personas(por="Persona", acciones=True):
    celdas = "".join(f'<span aria-sort="ascending">{c}<span class="b2-fl" aria-hidden="true">↑</span></span>' if c == por
                     else f"<span>{c}</span>" for c in ("Persona", "Zona", "Sucursal"))
    return (f'<div class="w-th dp-p{"" if acciones else " sin"}">{celdas}'
            f'{"<span class=\"dp-ac\">Acciones</span>" if acciones else ""}</div>')


FILA_PERSONA = re.compile(r'<div class="w-tr dp-p(?P<aten> aten)?"><span>(?P<n>[^<]+)</span>(?P<celdas>(?:<span(?: class="dp-g")?>[^<]*</span>){2})'
                          r'<span class="dp-ac">(?P<acc><a class="ib" href="FRM-Usuario-Datos\.dc\.html" aria-label="Editar a (?P=n)">'
                          r'<svg.*?</svg></a>)?</span></div>', re.S)


def fila_persona(m):
    if m["acc"]:
        return f'<div class="w-tr dp-p{m["aten"] or ""}"><span>{m["n"]}</span>{m["celdas"]}<span class="dp-ac">{keb(m["n"])}</span></div>'
    # Sin `users.manage` el ⋮ de una persona se queda sin «Editar», su única opción: la fila no lo lleva (269).
    return f'<div class="w-tr dp-p sin{m["aten"] or ""}"><span>{m["n"]}</span>{m["celdas"]}</div>'


BARRA_PERSONAS = re.compile(r'(<div class="dp-fb"><span class="w-bus[^"]*">.*?</span>)</div>', re.S)

TIPO_DLG = re.compile(r'<div class="ct sel">(De un catálogo|Texto)<svg.*?</svg></div>', re.S)
TIPO_USO = '<div class="ct sel" style="background: var(--s2); color: var(--t3);">De un catálogo</div>'
CAT_USO = '<div class="ct" style="background: var(--s2); color: var(--t3);">Zonas · 6 opciones</div>'
CAT_COMBO = re.compile(r'<span class="k-tab"><span class="k-in sel(?: foco)?" role="combobox" aria-expanded="(?:true|false)" aria-label="Catálogo">'
                       r'<span>Zonas · 6 opciones</span><svg.*?</svg></span>(?P<mn><span class="f-mn" role="listbox" aria-label="Catálogo">.*?</span></span>)?</span>',
                       re.S)
# En uso, el tipo y el catálogo no cambian: lo dice la lista de formularios de abajo, que ya estaba (spec), así que el tooltip
# no se dibuja abierto (211: el motivo, solo si no es obvio).
EN_USO = "Lo usa un formulario: mientras se use, no cambia."


def catalogo_dlg(m):
    if m["mn"]:
        return b2.campo("Zonas", abierto=True, aria="Catálogo", extra=lista_catalogos())
    return b2.campo("Zonas", aria="Catálogo")


def abrir_menu(cuerpo, nombre, item):
    viejo = keb(nombre)
    assert cuerpo.count(viejo) == 1, (nombre, cuerpo.count(viejo))
    menu = f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}">{item}</div>'
    return cuerpo.replace(viejo, viejo.replace('aria-expanded="false"', 'aria-expanded="true"') + menu)


def frm_datos_personas():
    t, nl = leer("FRM-Datos-Personas")
    t = para_aprobar(con_css(t, CSS_COMPU))

    # «Datos»: la barra con «Ordenar por», el encabezado y cada fila con su Catálogo, su Estado y su ⋮.
    assert t.count(CAB_DATOS_VIEJA) == 15
    t = t.replace(CAB_DATOS_VIEJA, CAB_DATOS)
    t = subn(FILA_DATO, fila_dato, t, 31)

    # «Personas»: «Ordenar por» después de la búsqueda, la flecha después de «Persona» y el ⋮ de cada fila.
    t = subn(BARRA_PERSONAS, lambda m: m.group(1) + '<span class="b2-sep" aria-hidden="true"></span>' + ordenar(ORDEN_PERSONA) + "</div>", t, 15)
    assert t.count(CAB_PERSONAS) == 13 and t.count(CAB_PERSONAS_SIN) == 1
    t = t.replace(CAB_PERSONAS, cab_personas()).replace(CAB_PERSONAS_SIN, cab_personas(acciones=False))
    t, n = FILA_PERSONA.subn(fila_persona, t)
    print("filas de personas:", n)
    assert "Editar a " not in t and '<span class="dp-ac"></span>' not in t
    t = una(t, '<span class="dp-res">1 personas</span>', '<span class="dp-res">1 persona</span>')

    # El diálogo: el Tipo y el Catálogo en la pieza (262); en uso, apagados.
    t = subn(TIPO_DLG, lambda m: b2.campo(m.group(1), aria="Tipo"), t, 6)
    t = subn(CAT_COMBO, catalogo_dlg, t, 3)
    t = una(t, TIPO_USO, b2.campo("De un catálogo", apagado=EN_USO, aria="Tipo", tip_abierto=False))
    t = una(t, CAT_USO, b2.campo("Zonas", apagado=EN_USO, aria="Catálogo", tip_abierto=False))
    assert "k-in sel" not in t and 'class="ct sel"' not in t and "· 6 opciones" not in t

    # «Todavía no hay datos»: sin datos, la tabla de personas no tiene qué mostrar.
    (b16,) = sc_ifs(t, "s16")
    cuerpo = t[b16[0]:b16[1]]
    i = cuerpo.index('<div class="w-caja"><div class="f-cab"><span>Personas</span>')
    cuerpo = cuerpo[:i] + cuerpo[cierre(cuerpo, i, "div"):]
    t = t[:b16[0]] + cuerpo + t[b16[1]:]

    # Los estados nuevos.
    nuevos = ["Acciones de un dato", "Acciones de una persona", "Ordenar por abierto", "Ordenado por Zona", "Elegir el tipo"]
    t, sv = sumar_estados(t, [("Los datos", nuevos[:4]), ("Agregar un dato", nuevos[4:])], nuevos)
    (c0,) = sc_ifs(t, "s0")
    base = t[c0[0]:c0[1]]
    cuerpos = [
        abrir_menu(renombrar(base, "s0", sv[nuevos[0]]), "Zona", f'<span class="f-mi" role="menuitem">{SVG_EDITAR} Editar</span>'),
        abrir_menu(renombrar(base, "s0", sv[nuevos[1]]), "Juan Gómez",
                   f'<a class="f-mi" role="menuitem" href="FRM-Usuario-Datos.dc.html">{SVG_EDITAR} Editar</a>'),
        una(renombrar(base, "s0", sv[nuevos[2]]), ordenar(ORDEN_PERSONA), ordenar(ORDEN_PERSONA, POP_PERSONAS)),
    ]
    por_zona = una(renombrar(base, "s0", sv[nuevos[3]]), ordenar(ORDEN_PERSONA), ordenar(ORDEN_ZONA))
    por_zona = una(por_zona, cab_personas(), cab_personas("Zona"))
    filas = {re.search(r"<span>([^<]+)</span>", f).group(1): f for f in re.findall(r'<div class="w-tr dp-p">.*?</div>', por_zona, re.S)}
    assert sorted(filas) == sorted(POR_ZONA), list(filas)
    a = por_zona.index('<div class="w-tr dp-p">')
    b = por_zona.index('<div class="w-pie">', a)
    cuerpos.append(por_zona[:a] + "".join(filas[n] for n in POR_ZONA) + por_zona[b:])
    (c1, o1) = sc_ifs(t, "s1")
    cuerpos.append(renombrar(t[c1[0]:c1[1]], "s1", sv[nuevos[4]]))
    tipo_abierto = una(renombrar(t[o1[0]:o1[1]], "s1", sv[nuevos[4]]), b2.campo("De un catálogo", aria="Tipo"),
                       b2.campo("De un catálogo", abierto=True, aria="Tipo", extra=lista_tipos()))

    # Los cuerpos, después del último cuerpo; el diálogo, después del último diálogo (primero el de más abajo).
    fin_dialogos = sc_ifs(t, "s7")[1][1]
    t = t[:fin_dialogos] + tipo_abierto + t[fin_dialogos:]
    fin_cuerpos = sc_ifs(t, "s17")[0][1]
    t = t[:fin_cuerpos] + "".join(cuerpos) + t[fin_cuerpos:]
    assert '<span class="sub">De baja</span>' not in t and " · Zonas" not in t
    escribir("FRM-Datos-Personas", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
CSS_TEL = e12l.CSS_TEL + "\n".join(l for l in e12e.CSS_TEL.splitlines() if l.startswith(".acc-pk")) + """
/* E16 · La clave de un dato, en su tipografía, en la tarjeta (263). */
.b2-tj .mono { font-family: ui-monospace, Consolas, monospace; font-size: 13.5px; }
/* La tarjeta de una persona sin «Administrar usuarios» no lleva a su ficha (269): sin enlace, el mismo dibujo. */
div.b2-tj-a { cursor: default; }
"""
FILA_DATO_TEL = re.compile(r'<div class="ap-fila"><div class="tx"><span class="l1">(?P<n>[^<]+)</span><span class="l2">(?P<tipo>[^<]+)</span>'
                           r'<span class="l3">(?P<k>[^<]+)</span></div><button type="button" class="ap-ib" aria-label="Editar (?P=n)"><svg.*?</svg></button></div>',
                           re.S)
FILA_PERSONA_TEL = re.compile(r'<a class="ap-fila" href="M-FRM-Usuario-Datos\.dc\.html"><div class="tx"><span class="l1">(?P<n>[^<]+)</span>'
                              r'<span class="l2">(?P<l2>[^<]+)</span></div></a>')
BUSCAR_TEL = '<div style="padding: 12px 0 4px;"><span class="w-bus" style="width: auto;">'


def tarjeta_dato(n, k, tipo, catalogo=None, baja=False):
    """Cada dato con su nombre, de a dos (263); el estado, como su lectura (206). El ⋮ guarda lo que hacía el ✎ (261)."""
    est = b2.est("", "De baja") if baja else b2.est("ok", "Activo")
    celdas = "".join(f'<span class="c"><span class="k">{c}</span><span class="v">{v}</span></span>'
                     for c, v in (("Clave", f'<span class="mono">{k}</span>'), ("Tipo", tipo), ("Catálogo", catalogo or b2.NADA_T), ("Estado", est)))
    return (f'<div class="b2-tj"><div class="b2-tj-a"><span class="cu"><span class="nm">{n}</span><span class="dl">{celdas}</span></span></div>'
            f'<button type="button" class="keb" aria-label="Acciones de {n}" aria-haspopup="menu" aria-expanded="false">{b2.SVG_KEB}</button></div>')


def tarjeta_persona(m):
    zona, sucursal = (b2.NADA_T if x == "—" else x for x in m["l2"].split(" · "))
    return b2.tarjeta(m["n"], [("Zona", zona), ("Sucursal", sucursal)], href="M-FRM-Usuario-Datos.dc.html")


def ordtel(texto):
    return f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">{texto} {b2.SVG_FLECHA}</button></div>'


def m_frm_datos_personas():
    t, nl = leer("M-FRM-Datos-Personas")
    t = para_aprobar(con_css(t, CSS_TEL))

    # Las filas como tarjetas (263), con el ⋮ en las de los datos (261).
    t = subn(FILA_DATO_TEL, lambda m: tarjeta_dato(m["n"], m["k"], *m["tipo"].partition(" · ")[::2]), t, 4)
    t = subn(FILA_PERSONA_TEL, tarjeta_persona, t, 6)

    # «Ordenar por» arriba de cada lista (264): en «Datos», antes de la lista; en «Personas», debajo de la búsqueda.
    for s in ("s0", "s2"):
        a = t.index(f'<sc-if value="{{{{{s}}}}}"')
        k = t.index('<div class="ap-cuerpo">', a)
        t = t[:k] + ordtel(ORDEN_DATOS) + t[k:]
    i = t.index(BUSCAR_TEL)
    j = t.index("</div>", i) + 6
    t = t[:j] + ordtel(ORDEN_PERSONA) + t[j:]

    # La hoja «Agregar dato»: la (i) de la Clave y el Tipo y el Catálogo en la pieza (262).
    t = una(t, '<span class="rt"><span>Clave <span class="rq">*</span></span></span>',
            f'<span class="rt"><span>Clave <span class="rq">*</span>{b2.info("No cambia después de guardar.")}</span></span>')
    t = subn(re.compile(r'<div class="ct sel">De un catálogo<svg.*?</svg></div>', re.S), lambda m: b2.campo("De un catálogo", aria="Tipo"), t, 1)
    t = subn(re.compile(r'<div class="ct sel">Zonas · 6 opciones<svg.*?</svg></div>', re.S), lambda m: b2.campo("Zonas", aria="Catálogo"), t, 1)

    # Los estados nuevos.
    nuevos = ["Un dato dado de baja", "Acciones de un dato", "Ordenar por", "Sin editar los valores", "Elegir el tipo", "Elegir el catálogo"]
    t, sv = sumar_estados(t, [("Datos", nuevos[:2]), ("Personas", nuevos[2:4]), ("Agregar un dato", nuevos[4:])], nuevos)
    (c0,) = sc_ifs(t, "s0")
    (c1,) = sc_ifs(t, "s1")
    (c2, o2) = sc_ifs(t, "s2")
    base0, base1, base2_, hoja2 = t[c0[0]:c0[1]], t[c1[0]:c1[1]], t[c2[0]:c2[1]], t[o2[0]:o2[1]]
    sucursal = tarjeta_dato("Sucursal", "sucursal", "Texto")
    baja = una(renombrar(base0, "s0", sv[nuevos[0]]), sucursal, sucursal + tarjeta_dato("Legajo", "legajo", "Texto", baja=True))
    acciones = una(renombrar(base0, "s0", sv[nuevos[1]]), 'aria-label="Acciones de Zona" aria-haspopup="menu" aria-expanded="false"',
                   'aria-label="Acciones de Zona" aria-haspopup="menu" aria-expanded="true"')
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-WA-Menu.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)
    pantalla = (f'<sc-if value="{{{{{sv[nuevos[2]]}}}}}" hint-placeholder-val="{{{{no}}}}">'
                + e14l.pantalla_ordenar(volver, "M-FRM-Datos-Personas", "Persona", "De la A a la Z") + "</sc-if>")
    sin_editar = renombrar(base1, "s1", sv[nuevos[3]])
    sin_editar, n = re.subn(r'<a class="b2-tj-a" href="M-FRM-Usuario-Datos\.dc\.html">(.*?)</a>', r'<div class="b2-tj-a">\1</div>', sin_editar, flags=re.S)
    assert n == 6, n
    cuerpos = [baja, acciones, pantalla, sin_editar, renombrar(base2_, "s2", sv[nuevos[4]]), renombrar(base2_, "s2", sv[nuevos[5]])]
    pk_tipo = b2.pk_tel("Tipo", [(x, None, x == "De un catálogo", None) for x in TIPOS])
    pk_cat = b2.pk_tel("Catálogo", [(n_, d, n_ == "Zonas", None) for n_, d in CATALOGOS], buscar="", cantidad=f"{len(CATALOGOS)} catálogos")
    capas = [f'<sc-if value="{{{{{sv[nuevos[1]]}}}}}" hint-placeholder-val="{{{{no}}}}">{e14l.hoja_tel(t, "Zona", "Editar")}</sc-if>',
             renombrar(hoja2, "s2", sv[nuevos[4]])[:-len("</sc-if>")] + pk_tipo + "</sc-if>",
             renombrar(hoja2, "s2", sv[nuevos[5]])[:-len("</sc-if>")] + pk_cat + "</sc-if>"]
    fin_capas = t.rindex("</div>\n</x-dc>")
    t = t[:fin_capas] + "".join(capas) + t[fin_capas:]
    t = una(t, '<span class="ap-raya"></span>', "".join(cuerpos) + '<span class="ap-raya"></span>')
    assert " · " not in "".join(re.findall(r'<span class="l2">([^<]*)</span>', t)) and 'class="ct sel"' not in t
    escribir("M-FRM-Datos-Personas", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la ficha
CSS_FICHA = b2.CSS_B2 + """
/* E16 · La pestaña «Datos»: la Zona en la pieza (262), del ancho de su campo. */
.dp-ficha .w-cmp .b2-env { width: 100%; }
"""
ZONA_FICHA = re.compile(r'<div class="ct"><span>(Centro|Norte)</span><svg.*?</svg></div>', re.S)
ZONA_BAJA = re.compile(r'<div class="ct baja"><span>Cuyo<small>De baja</small></span><svg.*?</svg></div>', re.S)


def frm_usuario_datos():
    t, nl = leer("FRM-Usuario-Datos")
    t = para_aprobar(con_css(t, CSS_FICHA))
    t = subn(ZONA_FICHA, lambda m: b2.campo(m.group(1), aria="Zona"), t, 4)
    t = subn(ZONA_BAJA, lambda m: b2.campo("Cuyo", abierto=True, aria="Zona", extra=lista_zona_baja()), t, 1)
    assert "<small>De baja</small>" not in t
    escribir("FRM-Usuario-Datos", t, nl)


def m_frm_usuario_datos():
    t, nl = leer("M-FRM-Usuario-Datos")
    t = para_aprobar(con_css(t, CSS_TEL))
    t = subn(re.compile(r'<div class="ct sel">(Centro|Norte)<svg.*?</svg></div>', re.S), lambda m: b2.campo(m.group(1), aria="Zona"), t, 3)
    t = subn(re.compile(r'<div class="ct sel">Cuyo · De baja<svg.*?</svg></div>', re.S), lambda m: b2.campo("Cuyo", abierto=True, aria="Zona"), t, 1)
    # «Una opción dada de baja»: la pieza a pantalla completa, con la guardada primero y «De baja» en gris debajo.
    pk = b2.pk_tel("Zona", [("Cuyo", "De baja", True, None)] + [(z, None, False, None, k == 0) for k, z in enumerate(ZONAS)],
                   buscar="", cantidad=f"{len(ZONAS)} opciones")
    (c3,) = sc_ifs(t, "s3")
    t = t[:c3[1] - len("</sc-if>")] + pk + t[c3[1] - len("</sc-if>"):]
    assert "De baja<svg" not in t and 'class="ct sel"' not in t
    escribir("M-FRM-Usuario-Datos", t, nl)


if __name__ == "__main__":
    for nombre, f in (("FRM-Datos-Personas", frm_datos_personas), ("M-FRM-Datos-Personas", m_frm_datos_personas),
                      ("FRM-Usuario-Datos", frm_usuario_datos), ("M-FRM-Usuario-Datos", m_frm_usuario_datos)):
        if MARCA in leer(nombre)[0]:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        f()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
