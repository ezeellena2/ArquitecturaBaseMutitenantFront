"""El editor de un catálogo de la E12 con el traspaso 18, tanda 2 (2026-11-26), en `FRM-Catalogo` y `M-FRM-Catalogo`:

- **lo que se hace con una fila va en su ⋮ (261):** «Reactivar» de una opción dada de baja y «Restaurar» de una por borrar dejan de
  ser botones con texto. La fila dada de baja vuelve a tener ↑ ↓ ✎ 🗑 a la vista, como las demás, y su ⋮ con «Reactivar»; la por
  borrar conserva «Se borra al guardar» y su ⋮ con «Restaurar». Las filas sin nada en el ⋮ guardan su lugar, así los íconos quedan
  alineados. Dos estados nuevos abren el ⋮: «Restaurar una opción» y «Reactivar una opción» (en el teléfono, su hoja). En el
  teléfono, cada opción es una tarjeta (263 y 206): «Código» y, si no está activa, «Estado» con su punto, sin la etiqueta «De baja»;
- **un catálogo nuevo se arma en el editor (262):** `FRM-Catalogo-Nuevo` y `FRM-Catalogo-Tipo` se van como diálogos, porque solo
  servían para elegir. En «El catálogo», primero «De dónde salen las opciones» y, para las escritas a mano, «Tipo de valor», los dos en
  la pieza cerrada, antes del nombre; el `POST` sale de «Crear catálogo». Estados nuevos: la pieza del origen abierta, sin el módulo de
  WhatsApp (dos orígenes) y la del tipo abierta; en el teléfono, «Nuevo catálogo» y la pieza a pantalla completa. Lo que dibujaba
  `FRM-Catalogo-Tipo` (un catálogo tipado con la columna «Valor» y el error en el campo) pasa a cuatro estados de este tablero.

Corre una vez sobre los tableros de la v184 y después va `traspaso10_piezas_1004.py --tableros FRM-Catalogo,M-FRM-Catalogo`,
que escala el bloque nuevo de la compu. Si el bloque `data-e12="t2"` ya está, no hace nada.
"""
import io
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-e12="t2"'

ORIGENES = [
    ("Escritas a mano", "Para listas que mantiene una persona: motivos, proveedores, zonas."),
    ("De los miembros", "Se arma sola con los miembros de la organización que cumplen los filtros."),
    ("De los contactos de WhatsApp", "Se arma sola con los contactos de Clientes, por etiqueta."),
]
TIPOS = ["Texto", "Número entero", "Número decimal", "Fecha"]
SVG_RESTAURAR = ('<svg class="mi-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
                 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/>'
                 '<path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>')

CSS_COMPU = b2.CSS_B2 + """
/* E12 · El ⋮ de una fila de opciones (261): las filas sin nada en el ⋮ guardan su lugar. */
.k-acc .k-keb0 { visibility: hidden; }
.k-acc .f-menu { right: 0; top: calc(100% - 6px); }
/* E12 · La pieza en «El catálogo» de uno nuevo (262). */
.k-g1 .w-cmp .b2-env { width: 100%; }
"""
CSS_TEL = b2.CSS_B2 + b2.CSS_B2_TEL + """
/* E12 · El ⋮ de una fila de opciones en el teléfono (261). */
.q-acc .q-keb0 { visibility: hidden; }
/* E12 · La pieza a pantalla completa (262), con lo de las acciones del asistente. */
.acc-pk { position: absolute; z-index: 70; top: 44px; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; background: #fff; }
.acc-pk .bar { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 0 8px 0 20px; border-bottom: 1px solid var(--borde); }
.acc-pk .bar h2 { flex: 1; margin: 0; font-size: 18px; font-weight: 700; color: var(--t1); }
.acc-pk .bar button { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--t1); }
.acc-pk .op { position: relative; display: flex; align-items: center; gap: 14px; min-height: 56px; padding: 8px 20px; border-bottom: 1px solid var(--borde); font-size: 16px; color: var(--t1); }
.acc-pk .op .n2 { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.acc-pk .op .d { color: var(--t2); font-size: 13px; line-height: 1.35; }
"""
CSS_TARJETAS = """
/* E12 · Cada opción, una tarjeta (263 y 206): el número, el texto y sus acciones a la vista; debajo, «Código» y, si no está
   activa, «Estado» con su punto y su palabra, cada dato con su nombre. */
.q-tj { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; column-gap: 12px; align-items: center; padding: 8px 6px 10px 14px; }
.ap-grupo > .q-tj:last-child { border-bottom: 0; }
.q-tj .num { grid-row: 1; grid-column: 1; width: 26px; height: 26px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.q-tj .nm { grid-row: 1; grid-column: 2; font-size: 16px; font-weight: 500; }
.q-tj .q-acc { grid-row: 1; grid-column: 3; }
.q-tj .dl { grid-row: 2; grid-column: 2 / -1; margin: 2px 0 0; }
.q-tj .v.mono { font-family: ui-monospace, Consolas, monospace; }
.q-tj.baja .nm, .q-tj.borrar .nm { color: var(--t3); }
"""
CSS_TEL += CSS_TARJETAS


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    t = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in t else "\n"
    return t.replace("\r\n", "\n"), nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def cierre(t, i, tag):
    """El fin del elemento `tag` que abre en `i`, contando los del mismo tipo que anidan."""
    d = 0
    for m in re.finditer(rf"<{tag}\b|</{tag}>", t[i:]):
        d += -1 if m.group(0).startswith("</") else 1
        if d == 0:
            return i + m.end()
    raise ValueError(f"sin cierre de <{tag}> en {i}")


def sc_ifs(t, var):
    """Los `sc-if` de un estado (`{{var}}`), en orden: [(inicio, fin), …]."""
    return [(m.start(), cierre(t, m.start(), "sc-if")) for m in re.finditer(r'<sc-if value="\{\{%s\}\}"' % var, t)]


def renombrar(bloque, viejo, nuevo):
    """El mismo `sc-if` para otro estado: cambia solo su apertura."""
    assert bloque.startswith(f'<sc-if value="{{{{{viejo}}}}}"'), bloque[:60]
    return f'<sc-if value="{{{{{nuevo}}}}}" hint-placeholder-val="{{{{no}}}}">' + bloque[bloque.index(">") + 1:]


def svg_tras(t, ancla):
    i = t.index(ancla) + len(ancla)
    return t[i:t.index("</svg>", i) + 6]


def sumar_estados(t, despues, nuevos):
    """Suma los estados al enum del `data-props` (después de `despues`, en orden) y a `renderVals`, con su `sN`."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    ops = props["estado"]["options"]
    for ancla, nombres in despues:
        k = ops.index(ancla) + 1
        ops[k:k] = nombres
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    m = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    lista = json.loads(m.group(1))
    base = len(lista)
    lista += nuevos
    t = t[:m.start(1)] + json.dumps(lista, ensure_ascii=False).replace('", "', '", "') + t[m.end(1):]
    ult = f"      s{base - 1}: k === {base - 1},\n"
    assert ult in t
    t = t.replace(ult, ult + "".join(f"      s{base + i}: k === {base + i},\n" for i in range(len(nuevos))), 1)
    assert sorted(ops) == sorted(lista), (set(ops) ^ set(lista))
    return t, {n: f"s{base + i}" for i, n in enumerate(nuevos)}


def con_css(t, css):
    assert MARCA not in t
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


# ---------------------------------------------------------------------------------------------------------------- la compu
def filas_compu(t, de=None):
    """El ⋮ de cada fila de opciones (261). Los íconos salen de `de` (el tablero), o de `t`."""
    de = de or t
    lapiz = re.search(r'aria-label="Editar Reclamo">(<svg.*?</svg>)', de, re.S).group(1)
    keb = svg_tras(de, 'aria-label="Más acciones de las opciones" aria-haspopup="menu" aria-expanded="{{expMas}}">')
    cuenta = {"baja": 0, "borrar": 0, "resto": 0}
    out, pos = [], 0
    for m in re.finditer(r'<span class="k-acc">', t):
        if m.start() < pos:
            continue
        fin = cierre(t, m.start(), "span")
        adentro = t[m.end():fin - 7]
        r = re.search(r'<button type="button" class="cb cb-sec" aria-label="Reactivar ([^"]+)">Reactivar</button>', adentro)
        s = re.search(r'<button type="button" class="cb cb-sec" aria-label="Restaurar ([^"]+)">Restaurar</button>', adentro)
        if r:
            n = r.group(1)
            adentro = adentro.replace(r.group(0), f'<button type="button" class="ib" aria-label="Editar {n}">{lapiz}</button>')
            adentro += f'<button type="button" class="ib" aria-label="Acciones de {n}" aria-haspopup="menu" aria-expanded="false">{keb}</button>'
            cuenta["baja"] += 1
        elif s:
            n = s.group(1)
            adentro = adentro.replace(s.group(0), f'<button type="button" class="ib" aria-label="Acciones de {n}" aria-haspopup="menu" aria-expanded="false">{keb}</button>')
            cuenta["borrar"] += 1
        else:
            adentro += '<span class="ib k-keb0" aria-hidden="true"></span>'
            cuenta["resto"] += 1
        out.append(t[pos:m.end()] + adentro + "</span>")
        pos = fin
    out.append(t[pos:])
    print("filas de la compu:", cuenta)
    return "".join(out), keb


def abrir_menu(cuerpo, nombre, keb, etiqueta, icono, compu=True):
    viejo = f'aria-label="Acciones de {nombre}" aria-haspopup="menu" aria-expanded="false">{keb}</button>'
    assert cuerpo.count(viejo) == 1, (nombre, cuerpo.count(viejo))
    menu = (f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}"><span class="f-mi" role="menuitem">{icono} {etiqueta}</span></div>')
    return cuerpo.replace(viejo, viejo.replace('"false"', '"true"') + menu)


def campos_nuevo(origen_abierto=False, tipo_abierto=False, sin_wa=False):
    origenes = ORIGENES[:2] if sin_wa else ORIGENES
    lo = b2.lista([b2.op(n, d, elegida=i == 0, activa=i == 0) for i, (n, d) in enumerate(origenes)]) if origen_abierto else ""
    lt = b2.lista([b2.op(n, elegida=i == 0, activa=i == 0) for i, n in enumerate(TIPOS)]) if tipo_abierto else ""
    return (f'<div class="w-cmp"><span class="rt">De dónde salen las opciones</span>'
            f'{b2.campo(ORIGENES[0][0], abierto=origen_abierto, aria="De dónde salen las opciones", extra=lo)}</div>'
            f'<div class="w-cmp"><span class="rt">Tipo de valor</span>'
            f'{b2.campo(TIPOS[0], abierto=tipo_abierto, aria="Tipo de valor", extra=lt)}</div>')


def compu():
    t, nl = leer("FRM-Catalogo")
    if MARCA in t:
        print("FRM-Catalogo ya tiene el bloque: no hace nada")
        return
    tipo, _ = leer("FRM-Catalogo-Tipo")
    t = con_css(t, CSS_COMPU)

    nuevos = ["Nuevo: de dónde salen", "Nuevo: sin el módulo de WhatsApp", "Nuevo: tipo de valor",
              "Con tipo de valor", "Valor de otro tipo", "Agregar una opción con valor", "Falta el valor",
              "Restaurar una opción", "Reactivar una opción"]
    t, sv = sumar_estados(t, [("Falta el nombre", nuevos[0:3]), ("10.000 opciones", nuevos[3:7]), ("Se borra al guardar", nuevos[7:9])],
                          nuevos)
    # El orden de los estados en `renderVals`: «Nuevo catálogo» es s23, «Falta el nombre» s24, «Se borra al guardar» s7 y
    # «Sin cambios» s0 (sus nombres, en la lista de `const k`).
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    s_nuevo, s_falta = f"s{lista.index('Nuevo catálogo')}", f"s{lista.index('Falta el nombre')}"
    s_borra, s_sin = f"s{lista.index('Se borra al guardar')}", f"s{lista.index('Sin cambios')}"

    # El origen y el tipo, en la pieza, en «Nuevo catálogo» y «Falta el nombre» (262).
    de = '<p class="k-de">Escritas a mano · Texto</p>'
    for v in (s_nuevo, s_falta):
        (ba, bb), (ca, cb) = sc_ifs(t, v)
        cuerpo = t[ca:cb]
        assert cuerpo.count(de) == 1, v
        t = t[:ca] + cuerpo.replace(de, campos_nuevo()) + t[cb:]

    # Los estados que se van con `FRM-Catalogo-Tipo` (la banda y el cuerpo de cada uno).
    tipo_bandas, tipo_cuerpos = [], []
    for i, n in enumerate(nuevos[3:7]):
        (ba, bb), (ca, cb) = sc_ifs(tipo, f"s{i}")
        tipo_bandas.append(renombrar(tipo[ba:bb], f"s{i}", sv[n]))
        tipo_cuerpos.append(renombrar(tipo[ca:cb], f"s{i}", sv[n]))

    # Las filas: el ⋮ (261), también en las del catálogo tipado.
    tipo_cuerpos = [filas_compu(c, de=t)[0] for c in tipo_cuerpos]
    t, keb = filas_compu(t)

    # Los estados nuevos, cada uno con su banda y su cuerpo, después de los de siempre.
    (nb_a, nb_b), (nc_a, nc_b) = sc_ifs(t, s_nuevo)
    (rb_a, rb_b), (rc_a, rc_b) = sc_ifs(t, s_borra)
    (sb_a, sb_b), (scu_a, scu_b) = sc_ifs(t, s_sin)
    banda_nuevo, cuerpo_nuevo = t[nb_a:nb_b], t[nc_a:nc_b]
    banda_borra, cuerpo_borra = t[rb_a:rb_b], t[rc_a:rc_b]
    banda_sin, cuerpo_sin = t[sb_a:sb_b], t[scu_a:scu_b]
    bandas, cuerpos = [], []
    for n, kw in [(nuevos[0], dict(origen_abierto=True)), (nuevos[1], dict(origen_abierto=True, sin_wa=True)),
                  (nuevos[2], dict(tipo_abierto=True))]:
        bandas.append(renombrar(banda_nuevo, s_nuevo, sv[n]))
        cuerpos.append(renombrar(cuerpo_nuevo, s_nuevo, sv[n]).replace(campos_nuevo(), campos_nuevo(**kw)))
    bandas += tipo_bandas
    cuerpos += tipo_cuerpos
    bandas.append(renombrar(banda_borra, s_borra, sv[nuevos[7]]))
    cuerpos.append(abrir_menu(renombrar(cuerpo_borra, s_borra, sv[nuevos[7]]), "Reclamo", keb, "Restaurar", SVG_RESTAURAR))
    reactivar_svg = re.search(r'<span class="f-mi" role="menuitem">(<svg class="mi-ic".*?</svg>) Reactivar</span>', t, re.S).group(1)
    bandas.append(renombrar(banda_sin, s_sin, sv[nuevos[8]]))
    cuerpos.append(abrir_menu(renombrar(cuerpo_sin, s_sin, sv[nuevos[8]]), "Cobranza", keb, "Reactivar", reactivar_svg))

    # Las bandas van después de la última banda de siempre; los cuerpos, después del último cuerpo.
    ultimos = sc_ifs(t, "s27")
    fin_bandas, fin_cuerpos = ultimos[0][1], ultimos[1][1]
    t = t[:fin_bandas] + "".join(bandas) + t[fin_bandas:fin_cuerpos] + "".join(cuerpos) + t[fin_cuerpos:]
    escribir("FRM-Catalogo", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def filas_tel(t):
    lapiz = re.search(r'class="ap-ib" aria-label="Editar Reclamo">(<svg.*?</svg>)', t, re.S).group(1)
    keb = re.search(r'class="ap-ib" aria-label="Más acciones">(<svg.*?</svg>)', t, re.S).group(1)
    cuenta = {"baja": 0, "borrar": 0, "resto": 0}
    out, pos = [], 0
    for m in re.finditer(r'<span class="q-acc">', t):
        fin = cierre(t, m.start(), "span")
        adentro = t[m.end():fin - 7]
        r = re.search(r'<button type="button" class="cb cb-sec" aria-label="Reactivar ([^"]+)">Reactivar</button>', adentro)
        s = re.search(r'<button type="button" class="cb cb-sec" aria-label="Restaurar ([^"]+)">Restaurar</button>', adentro)
        if r:
            n = r.group(1)
            adentro = adentro.replace(r.group(0), f'<button type="button" class="ap-ib" aria-label="Editar {n}">{lapiz}</button>')
            adentro += f'<button type="button" class="ap-ib" aria-label="Acciones de {n}" aria-haspopup="menu" aria-expanded="false">{keb}</button>'
            cuenta["baja"] += 1
        elif s:
            n = s.group(1)
            adentro = adentro.replace(s.group(0), f'<button type="button" class="ap-ib" aria-label="Acciones de {n}" aria-haspopup="menu" aria-expanded="false">{keb}</button>')
            cuenta["borrar"] += 1
        else:
            adentro += '<span class="ap-ib q-keb0" aria-hidden="true"></span>'
            cuenta["resto"] += 1
        out.append(t[pos:m.end()] + adentro + "</span>")
        pos = fin
    out.append(t[pos:])
    print("filas del teléfono:", cuenta)
    return "".join(out), keb


def hoja(t, titulo, accion):
    x = re.search(r'<div class="hc"><div><h2>Motivos de visita</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">(<svg.*?</svg>)',
                  t, re.S).group(1)
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="{titulo}"><span class="asa"></span>'
            f'<div class="hc"><div><h2>{titulo}</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{x}</button></div>'
            f'<div class="hb"><div class="ap-acciones2"><span role="menuitem">{accion}</span></div></div><div class="hp"></div></div>')


def tarjetas_tel(t):
    """Cada fila de opciones, una tarjeta (263 y 206): el número, el texto y sus acciones; debajo, «Código» y, si no está
    activa, «Estado» con su punto y su palabra. Sin la etiqueta «De baja» junto al nombre ni el código debajo."""
    cuenta = {"activa": 0, "baja": 0, "borrar": 0}
    out, pos = [], 0
    for m in re.finditer(r'<div class="q-row( baja| borrar)?">', t):
        fin = cierre(t, m.start(), "div")
        fila = t[m.start():fin]
        tipo = (m.group(1) or "").strip()
        num = re.search(r'<span class="num">(\d+)</span>', fila).group(1)
        tx_a = fila.index('<span class="tx">')
        tx_b = cierre(fila, tx_a, "span")
        tx = fila[tx_a:tx_b]
        acc = fila[tx_b:-6]
        nombre = re.search(r"<b>([^<]+)", tx).group(1)
        codigo = re.search(r"</b><span>([^<]+)</span>", tx)
        if tipo == "borrar":
            # La fila por borrar no mostraba su código: sale de otra fila del tablero con el mismo nombre.
            codigo = re.search(r"<b>%s</b><span>([^<]+)</span>" % re.escape(nombre), t)
        datos = (f'<span class="c"><span class="k">Código</span><span class="v mono">{codigo.group(1)}</span></span>' if codigo else "")
        if tipo == "baja":
            datos += '<span class="c"><span class="k">Estado</span><span class="v"><span class="b2-est">De baja</span></span></span>'
        elif tipo == "borrar":
            datos += ('<span class="c"><span class="k">Estado</span><span class="v"><span class="b2-est mal">Se borra al guardar</span>'
                      '</span></span>')
        cuenta[tipo or "activa"] += 1
        out.append(t[pos:m.start()] + f'<div class="b2-tj q-tj{" " + tipo if tipo else ""}"><span class="num">{num}</span>'
                   f'<span class="nm">{nombre}</span>{acc}<span class="dl">{datos}</span></div>')
        pos = fin
    out.append(t[pos:])
    print("tarjetas del teléfono:", cuenta)
    return "".join(out)


def telefono():
    t, nl = leer("M-FRM-Catalogo")
    if MARCA in t:
        if "q-tj" in t:
            print("M-FRM-Catalogo ya tiene el bloque y las tarjetas: no hace nada")
            return
        # El tablero ya pasó por la primera vuelta (el ⋮ y el catálogo nuevo): suma las tarjetas y su CSS a su bloque.
        i = t.index(f"<style {MARCA}>")
        j = t.index("</style>", i)
        t = t[:j] + CSS_TARJETAS + t[j:]
        escribir("M-FRM-Catalogo", tarjetas_tel(t), nl)
        return
    t = con_css(t, CSS_TEL)
    nuevos = ["Restaurar una opción", "Reactivar una opción", "Nuevo catálogo", "Nuevo: de dónde salen"]
    t, sv = sumar_estados(t, [("Se borra al guardar", nuevos[0:2]), ("Sin opciones", nuevos[2:4])], nuevos)
    t, keb = filas_tel(t)
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    s_borra, s_sin, s_vacio = (f"s{lista.index(n)}" for n in ("Se borra al guardar", "Sin cambios", "Sin opciones"))
    s9 = f"s{lista.index('Solo lectura')}"

    cuerpo_borra = sc_ifs(t, s_borra)[0]
    cuerpo_sin = sc_ifs(t, s_sin)[0]
    cuerpo_vacio = sc_ifs(t, s_vacio)[0]
    fin_cuerpos = sc_ifs(t, s9)[0][1]

    # «Nuevo catálogo»: el editor vacío, con el origen y el tipo en la pieza y «Crear catálogo» al pie (262).
    nuevo = renombrar(t[cuerpo_vacio[0]:cuerpo_vacio[1]], s_vacio, sv["Nuevo catálogo"])
    viejo_tit = '<div class="tit"><h1>Motivos de visita</h1><span class="sub">No se puede usar</span></div>'
    assert viejo_tit in nuevo
    nuevo = nuevo.replace(viejo_tit, '<div class="tit"><h1>Nuevo catálogo</h1></div>')
    mas = re.search(r'<button type="button" class="ap-ib" aria-label="Más acciones">.*?</button>', nuevo, re.S).group(0)
    nuevo = nuevo.replace(mas, "", 1)
    campos = ('<div class="ap-cmp"><span class="rt"><span>De dónde salen las opciones</span></span>'
              f'{b2.campo(ORIGENES[0][0], aria="De dónde salen las opciones")}</div>'
              '<div class="ap-cmp"><span class="rt"><span>Tipo de valor</span></span>'
              f'{b2.campo(TIPOS[0], aria="Tipo de valor")}</div>')
    for viejo, nuevo_txt in [('<p class="t-de">Escritas a mano · Texto</p>', campos),
                             ('<div class="ct">Motivos de visita</div>', '<div class="ct" style="color: var(--t3);">Nombre del catálogo</div>'),
                             ('<div class="ct">Por qué se visita a un cliente.</div>', '<div class="ct" style="color: var(--t3);">Opcional</div>')]:
        assert nuevo.count(viejo) == 1, viejo
        nuevo = nuevo.replace(viejo, nuevo_txt)
    pie = ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Cancelar</button>'
           '<button type="button" class="cb cb-pri full">Crear catálogo</button></div>')
    assert nuevo.endswith("</sc-if>")
    nuevo = nuevo[:-8] + pie + "</sc-if>"
    abierto = nuevo.replace(f'{{{{{sv["Nuevo catálogo"]}}}}}', f'{{{{{sv["Nuevo: de dónde salen"]}}}}}', 1)
    pieza = b2.pk_tel("De dónde salen las opciones", [(n, d, i == 0, None) for i, (n, d) in enumerate(ORIGENES)])

    cuerpos = [renombrar(t[cuerpo_borra[0]:cuerpo_borra[1]], s_borra, sv["Restaurar una opción"]),
               renombrar(t[cuerpo_sin[0]:cuerpo_sin[1]], s_sin, sv["Reactivar una opción"]), nuevo, abierto]
    capas = [f'<sc-if value="{{{{{sv["Restaurar una opción"]}}}}}" hint-placeholder-val="{{{{no}}}}">{hoja(t, "Reclamo", "Restaurar")}</sc-if>',
             f'<sc-if value="{{{{{sv["Reactivar una opción"]}}}}}" hint-placeholder-val="{{{{no}}}}">{hoja(t, "Cobranza", "Reactivar")}</sc-if>',
             f'<sc-if value="{{{{{sv["Nuevo: de dónde salen"]}}}}}" hint-placeholder-val="{{{{no}}}}">{pieza}</sc-if>']
    fin_capas = t.rindex("</div>\n</x-dc>")
    t = t[:fin_cuerpos] + "".join(cuerpos) + t[fin_cuerpos:fin_capas] + "".join(capas) + t[fin_capas:]
    escribir("M-FRM-Catalogo", tarjetas_tel(t), nl)


if __name__ == "__main__":
    compu()
    telefono()
