"""El listado de catálogos de la E12 con el traspaso 18, tanda 2 (v184, 2026-11-26), sobre los tableros de siempre:

- `FRM-Catalogos`: «Origen» y «Estado», filtros con su botón y sin cantidades, que abren la pieza (262); el encabezado ordena con
  la flecha en el color de la marca después del título, y «Ordenar por», último en la barra y separado de los filtros, dice el
  orden con palabras y abre la pieza con «Columna» y «Orden» (264). Suma dos estados: «Ordenar por abierto» y «Ordenado por
  Opciones», con la flecha antes del título en la columna de números, que va a la derecha (137), y lo vacío al final (264).
- `M-FRM-Catalogos`: «Ordenar por» arriba de la lista, a todo el ancho, que abre su pantalla con «Columna» y «Orden» (el estado
  «Ordenar por»); «Filtros» a pantalla completa con cada filtro en la pieza, sin cantidades (262); cada fila como una tarjeta, con
  cada dato con su nombre y nada unido con «·» debajo del nombre (263); «Nuevo catálogo» abre el editor, sin la hoja de elegir el
  origen (262), que sale con su estado.
- Los enlaces a `FRM-Catalogo-Nuevo` y `FRM-Catalogo-Tipo`, que se van con la 262, pasan a `FRM-Catalogo` en `FRM-Catalogos`,
  `FRM-Catalogos-14`, `-23`, `-25` e `Indice-formularios`.

Cambia los tableros en su lugar; no corre dos veces (el bloque `data-e12="t2"` lo marca). Después va
`traspaso10_piezas_1004.py --tableros FRM-Catalogos,M-FRM-Catalogos`, que pone la escala de la compu.
"""
import io
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = '<style data-e12="t2">'


def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    return s.replace("\r\n", "\n"), nl


def escribir(nombre, s, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(s.replace("\n", nl))
    print("ok", nombre, len(s))


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (viejo[:80], t.count(viejo))
    return t.replace(viejo, nuevo)


def fin_sc_if(t, i):
    prof = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        prof += 1 if m.group(0) == "<sc-if" else -1
        if prof == 0:
            return i + m.end()
    raise AssertionError("sc-if sin cerrar")


def con_css(t, css):
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def props(t, cambiar):
    m = re.search(r"data-props='(.*?)'>", t)
    p = json.loads(m.group(1))
    cambiar(p)
    texto = json.dumps(p, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    return t[:m.start(1)] + texto + t[m.end(1):]


# ---------------------------------------------------------------------------------------------------------------- la compu
CSS_COMPU = b2.CSS_B2 + """
/* E12 · el listado de catálogos: los filtros son botones que abren la pieza (262), y «Ordenar por» abre «Columna» y «Orden» (264). */
button.w-pil { font-family: inherit; }
.w-pil[aria-expanded="true"] { border-color: var(--marca); }
.o-fb .b2-pkl.barra { min-width: 220px; }
.b2-ordenar { position: relative; }
.b2-pop { position: absolute; z-index: 30; right: 0; top: calc(100% + 4px); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 420px; padding: 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); white-space: normal; }
.b2-pop .et { display: block; margin-bottom: 5px; color: var(--t2); font-size: 13px; font-weight: 600; }
.b2-pop .b2-pkl { width: 100%; }
/* 137 · los números a la derecha: la cantidad de opciones. */
.w-th.k12 > :nth-child(4), .w-tr.k12 > :nth-child(4) { text-align: right; }
"""

ORDEN_CATALOGO = "Ordenar por: Catálogo, de la A a la Z"
ORDEN_OPCIONES = "Ordenar por: Opciones, de mayor a menor"


def frm_catalogos():
    t, nl = leer("FRM-Catalogos")
    assert MARCA not in t
    t = con_css(t, CSS_COMPU)
    t = una(t, 'href="FRM-Catalogo-Nuevo.dc.html"', 'href="FRM-Catalogo.dc.html"')
    t = una(t, 'href="FRM-Catalogo-Tipo.dc.html"', 'href="FRM-Catalogo.dc.html"')

    # La barra: los filtros con su botón y la pieza abierta, sin cantidades; «Ordenar por», último y separado (262 y 264).
    i = t.index('<div class="w-caja o-fb">')
    j = b2.fin_div(t, i)
    viejo = t[i:j]
    flecha_pil = re.search(r'\{\{oriTexto\}\} (<svg.*?</svg>)', viejo, re.S).group(1)
    lupa = re.search(r'<span class="w-bus \{\{busClase\}\}">(<svg.*?</svg>)', viejo, re.S).group(1)
    ori = b2.lista([b2.op("Todos los orígenes", elegida=True, activa=True), b2.op("Escritas a mano", sep=True),
                    b2.op("De los miembros"), b2.op("De los contactos de WhatsApp")], barra=True)
    estl = b2.lista([b2.op("Todos los estados", elegida=True, activa=True), b2.op("Activos", sep=True), b2.op("Dados de baja")],
                    barra=True)
    pop = ('<div class="b2-pop" role="dialog" aria-label="Ordenar por">'
           '<div class="b2-pop-c"><span class="et">Columna</span>'
           + b2.campo("Catálogo", abierto=True, aria="Columna",
                      extra=b2.lista([b2.op("Catálogo", elegida=True, activa=True), b2.op("De dónde salen"), b2.op("Tipo de valor"),
                                      b2.op("Opciones"), b2.op("Estado")]))
           + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo("De la A a la Z", aria="Orden") + '</div></div>')
    nuevo = ('<div class="w-caja o-fb">'
             f'<span class="w-bus {{{{busClase}}}}">{lupa} {{{{busqueda}}}}</span>'
             f'<span class="f-env"><button type="button" class="w-pil {{{{oriClase}}}}" aria-haspopup="listbox" aria-expanded="{{{{oriExp}}}}">'
             f'{{{{oriTexto}}}} {flecha_pil}</button><sc-if value="{{{{oriMenu}}}}" hint-placeholder-val="{{{{no}}}}">{ori}</sc-if></span>'
             f'<span class="f-env"><button type="button" class="w-pil {{{{estClase}}}}" aria-haspopup="listbox" aria-expanded="{{{{estExp}}}}">'
             f'{{{{estTexto}}}} {flecha_pil}</button><sc-if value="{{{{estMenu}}}}" hint-placeholder-val="{{{{no}}}}">{estl}</sc-if></span>'
             '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl">Limpiar filtros</button></sc-if>'
             '<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar">'
             '<button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="{{ordExp}}">{{ordTexto}} ' + b2.SVG_FLECHA + '</button>'
             f'<sc-if value="{{{{ordMenu}}}}" hint-placeholder-val="{{{{no}}}}">{pop}</sc-if></span></div>')
    t = t[:i] + nuevo + t[j:]

    # El encabezado: por nombre, la flecha después de «Catálogo»; por la cantidad de opciones, antes del título (264).
    i = t.index('<div class="w-th k12">')
    j = b2.fin_div(t, i)
    assert '<span class="ord" aria-hidden="true">▲</span>' in t[i:j]
    por_nombre = ('<div class="w-th k12"><span aria-sort="ascending">Catálogo<span class="b2-fl" aria-hidden="true">↑</span></span>'
                  '<span>De dónde salen</span><span>Tipo de valor</span><span>Opciones</span><span>Estado</span></div>')
    por_opciones = ('<div class="w-th k12"><span>Catálogo</span><span>De dónde salen</span><span>Tipo de valor</span>'
                    '<span aria-sort="descending"><span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">↓</span>Opciones</span>'
                    '<span>Estado</span></div>')
    t = (t[:i] + f'<sc-if value="{{{{porNombre}}}}" hint-placeholder-val="{{{{si}}}}">{por_nombre}</sc-if>'
         f'<sc-if value="{{{{porOpciones}}}}" hint-placeholder-val="{{{{no}}}}">{por_opciones}</sc-if>' + t[j:])

    # Las filas por la cantidad de opciones: de mayor a menor, los empates por nombre y lo vacío («—») al final (264).
    i = t.index('<sc-if value="{{conFilas}}"')
    j = fin_sc_if(t, i)
    cuerpo = t[i:j]
    filas = {}
    for m in re.finditer(r'<sc-if value="\{\{ver\w+\}\}" hint-placeholder-val="\{\{si\}\}">(<div class="w-tr k12">.*?)</sc-if>', cuerpo, re.S):
        nombre = re.search(r'<a href="[^"]+">([^<]+)</a>', m.group(1)).group(1)
        filas[nombre] = m.group(1)
    assert len(filas) == 7, list(filas)
    orden = ["Proveedores", "Supervisores", "Recargo por zona", "Depósitos", "Motivos de visita", "Clientes", "Responsables de obra"]
    pie = re.search(r'<div class="w-pie">.*?</div>', cuerpo, re.S).group(0).replace("{{rango}}", "1–7 de 7")
    t = t[:j] + (f'<sc-if value="{{{{porOpciones}}}}" hint-placeholder-val="{{{{no}}}}">' + "".join(filas[n] for n in orden)
                 + pie + "</sc-if>") + t[j:]

    # Los estados y sus valores.
    t = props(t, lambda p: p["estado"]["options"].extend(["Ordenar por abierto", "Ordenado por Opciones"]))
    t = una(t, "const lista = ['Todos', 'Filtro abierto', 'Filtro de estado', 'Escritas a mano', 'De los miembros', 'De los contactos'].includes(f);",
            "const lista = ['Todos', 'Filtro abierto', 'Filtro de estado', 'Escritas a mano', 'De los miembros', 'De los contactos', 'Ordenar por abierto'].includes(f);\n"
            "    const porOpciones = f === 'Ordenado por Opciones', ordMenu = f === 'Ordenar por abierto';")
    t = una(t, "oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriAlternar: () => {},",
            "oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriExp: f === 'Filtro abierto' ? 'true' : 'false',")
    t = una(t, "      oriC_t: '7', oriC_m: '4', oriC_b: '2', oriC_c: '1', oriElegir_t: () => {}, oriElegir_m: () => {}, oriElegir_b: () => {}, oriElegir_c: () => {},\n", "")
    t = una(t, "estTexto: 'Estado', estClase: '', estMenu: f === 'Filtro de estado', estAlternar: () => {}, estOn_t: 'on', estOn_a: '', estOn_d: '',",
            "estTexto: 'Estado', estClase: '', estMenu: f === 'Filtro de estado', estExp: f === 'Filtro de estado' ? 'true' : 'false',")
    t = una(t, "      estC_t: '7', estC_a: '6', estC_d: '1', estElegir_t: () => {}, estElegir_a: () => {}, estElegir_d: () => {},\n", "")
    t = una(t, "      oriOn_t: elegido ? '' : 'on', oriOn_m: mano ? 'on' : '', oriOn_b: miembros ? 'on' : '', oriOn_c: contactos ? 'on' : '',\n", "")
    t = una(t, "conFilas: lista,",
            "conFilas: lista, porOpciones, porNombre: !porOpciones, ordMenu, ordExp: ordMenu ? 'true' : 'false',\n"
            f"      ordTexto: porOpciones ? '{ORDEN_OPCIONES}' : '{ORDEN_CATALOGO}',")
    assert "▲" not in t and "{{oriC_" not in t and "{{estC_" not in t and "{{total}}" not in t
    escribir("FRM-Catalogos", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
CSS_TEL = b2.CSS_B2 + b2.CSS_B2_TEL + """
/* E12 · «Ordenar por» arriba de la lista, a todo el ancho, que abre su pantalla (264, `SortBy` del teléfono). */
.b2-ordtel { flex-shrink: 0; padding: 4px 16px 8px; background: #fff; }
.b2-ordtel button { display: flex; width: 100%; height: 44px; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; padding: 0 14px; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; color: var(--t1); font: inherit; font-size: 14px; text-align: left; }
.b2-ordtel button > svg { flex: none; color: var(--t2); }
/* «Filtros» y «Ordenar por» a pantalla completa: cada uno con su nombre arriba y la pieza debajo (262). */
.t10-fl .b2-ffc { padding: 0 16px; }
.ap-cuerpo .b2-tj { flex-shrink: 0; }
"""

FILA_TEL = re.compile(r'<a class="ap-fila" href="([^"]+)"><div class="tx"><span class="l1">([^<]+)</span><span class="l2">([^<]*)</span>'
                      r'<span class="l3">(.*?)</span></div></a>', re.S)
CLASE = {"Activo": "ok", "De baja": "", "No se puede usar": "mal"}


def tarjeta_tel(m):
    href, nombre, l2, l3 = m.groups()
    partes = [x.strip() for x in l2.split(" · ")]
    origen = partes[0]
    opciones = partes[1].removesuffix(" opciones") if len(partes) > 1 else b2.NADA_T
    estado = re.search(r'<span class="w-est[^"]*">([^<]+)</span>', l3).group(1)
    por_que = re.search(r'title="([^"]+)"', l3)
    est = b2.est(CLASE[estado], estado, info=por_que.group(1) if por_que else None)
    return b2.tarjeta(nombre, [("De dónde salen", origen), ("Opciones", opciones), ("Estado", est)], href=href)


def campo_tel(nombre, valor):
    return f'<span class="gr">{nombre}</span><div class="b2-ffc">{b2.campo(valor, aria=nombre)}</div>'


def m_frm_catalogos():
    t, nl = leer("M-FRM-Catalogos")
    assert MARCA not in t
    t = con_css(t, CSS_TEL)

    # Sale el estado «Nuevo catálogo» (la hoja de elegir el origen, 262): en su lugar, la pantalla «Ordenar por» (264).
    a = t.index('<sc-if value="{{s6}}"')
    b = fin_sc_if(t, a)
    c = t.index('<sc-if value="{{s6}}"', b)
    d = fin_sc_if(t, c)
    assert 'aria-label="Nuevo catálogo"' in t[c:d]
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-FRM-Catalogos.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)
    ordenar = ('<sc-if value="{{s6}}" hint-placeholder-val="{{no}}"><div class="ap-bar int">'
               f'<a class="ap-ib" aria-label="Volver" href="M-FRM-Catalogos.dc.html">{volver}</a>'
               '<div class="tit"><h1>Ordenar por</h1></div></div><div class="ap-cuerpo"><div class="t10-fl">'
               + campo_tel("Columna", "Catálogo") + campo_tel("Orden", "De la A a la Z")
               + '</div></div><div class="t10-pie"><button type="button" class="cb cb-pri">Listo</button></div></sc-if>')
    t = t[:a] + ordenar + t[b:c] + t[d:]
    t = props(t, lambda p: p["estado"]["options"].__setitem__(6, "Ordenar por"))
    t = una(t, '"Nuevo catálogo"].indexOf(e);', '"Ordenar por"].indexOf(e);')

    # «Filtros»: cada filtro con su nombre y la pieza, sin cantidades (262).
    i = t.index('<div class="t10-fl">')
    j = b2.fin_div(t, i)
    assert 'role="radiogroup" aria-label="Origen"' in t[i:j]
    t = t[:i] + '<div class="t10-fl">' + campo_tel("Origen", "Todos los orígenes") + campo_tel("Estado", "Todos los estados") + "</div>" + t[j:]

    # Las filas como tarjetas (263) y «Nuevo catálogo» al editor (262).
    t, n = FILA_TEL.subn(tarjeta_tel, t)
    assert n == 7, n
    t, n = re.subn(r'<a class="ap-fab" aria-label="Nuevo catálogo" href="#">', '<a class="ap-fab" aria-label="Nuevo catálogo" href="M-FRM-Catalogo.dc.html">', t)
    assert n == 5, n

    # «Ordenar por» arriba de la lista, salvo sin catálogos (264).
    boton = ('<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">' + ORDEN_CATALOGO + " " + b2.SVG_FLECHA + "</button></div>")
    for s in ("s0", "s2", "s3", "s5"):
        a = t.index(f'<sc-if value="{{{{{s}}}}}"')
        k = t.index('<div class="ap-cuerpo', a)
        assert k < fin_sc_if(t, a)
        t = t[:k] + boton + t[k:]
    assert " · " not in "".join(re.findall(r'<span class="l2">([^<]*)</span>', t))
    escribir("M-FRM-Catalogos", t, nl)


# ---------------------------------------------------------------------------------------------------------------- los enlaces
def enlaces():
    for nombre in ("FRM-Catalogos-14", "FRM-Catalogos-23", "FRM-Catalogos-25", "Indice-formularios"):
        t, nl = leer(nombre)
        t2 = re.sub(r'href="FRM-Catalogo-(?:Nuevo|Tipo)\.dc\.html"', 'href="FRM-Catalogo.dc.html"', t)
        if t2 != t:
            escribir(nombre, t2, nl)


if __name__ == "__main__":
    frm_catalogos()
    m_frm_catalogos()
    enlaces()
