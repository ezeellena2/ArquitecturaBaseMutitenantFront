"""El editor de un formulario de la E14 con el traspaso 18, tanda 2 (2026-11-26), en `FRM-Editor` y `M-FRM-Editor`:

- **las preguntas en columnas (263):** el número, el nombre, el tipo y «Obligatoria» van cada uno en su columna, con su encabezado, y
  ya no debajo del nombre; el tipo lleva «varias, hasta N» cuando se eligen varias (spec §9). Lo demás que iba debajo («3 opciones»,
  «2 decimales», «hasta 600 caracteres», el catálogo) no va en la fila: se ve al abrir la pregunta. ↑ ↓ ✎ 🗑 siguen a la vista (127 y
  261), y un título de sección ocupa el nombre, el tipo y «Obligatoria», con las mismas acciones (88). En el teléfono, cada pregunta
  es una tarjeta, como las opciones de `M-FRM-Catalogo`: el número, el nombre y sus acciones; debajo, «Tipo» y «Obligatoria», cada
  dato con su nombre; lo que WhatsApp rechazó, con su motivo debajo, como el error de un campo;
- **lo que se elige, en la pieza (262):** «Para quién es», el tipo de respuesta, el catálogo de una pregunta «De un catálogo» (111) y
  «Qué viaja a WhatsApp» (la presentación del catálogo o la de la pregunta), cerrados con lo elegido. Abiertos: «Para quién es» y
  «Elegir el catálogo» (con el buscador adentro, cada catálogo con sus opciones en gris y los dados de baja o que no se pueden usar
  apagados, con su motivo en el tooltip) y «Sin catálogos» ya estaban; se suman «Elegir el tipo» y «Qué viaja a WhatsApp». Los campos
  del título y de la descripción de la presentación propia dejan los chips con «Agregar campo» y van en la pieza múltiple, por su
  nombre. «Permitir elegir varias» y «Obligatoria» son un sí o no suelto y quedan casilla. En el teléfono, «Para quién es», «Elegir
  el tipo» y «Elegir el catálogo» abren la pieza a pantalla completa. La vista previa («Así lo ve quien lo recibe») no cambia: imita
  WhatsApp;
- **el motivo de «Publicar en WhatsApp» apagado (211):** en el teléfono, el estado «El motivo de Publicar apagado» pierde la franja
  oscura y lo dice en el tooltip sobre el botón del pie fijo, abierto con un toque, como en la compu.

Corre una vez sobre los tableros de la v185 y después va `traspaso10_piezas_1004.py --tableros FRM-Editor,M-FRM-Editor`, que escala
el bloque nuevo de la compu. Si el bloque `data-e14="t2"` ya está, no hace nada.
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
MARCA = 'data-e14="t2"'
SUFIJO = " · para aprobar"
SVG = r"<svg\b[^>]*>.*?</svg>"

TIPOS = ["Texto corto", "Texto largo", "Número", "Fecha", "Sí o no", "Elegir una", "Elegir varias", "Elegir de un catálogo"]
PARA_QUIEN = ["Empleados", "Clientes", "Empleados y clientes"]
# Los catálogos de la organización (111): los tres orígenes; los dados de baja y los que no se pueden usar, apagados con su motivo.
CATALOGOS = [("Clientes", "46 opciones", None), ("Depósitos", "8 opciones", "Está dado de baja."),
             ("Motivos de visita", "3 opciones", None), ("Productos", "10 opciones", None),
             ("Proveedores", "1.097 opciones", None), ("Recargo por zona", "6 opciones", None),
             ("Responsables de obra", None, "No se puede usar: un rol de sus filtros ya no existe."), ("Supervisores", None, None)]
TIP_CATALOGO = "Responsables de obra"
PRESENTACION = [("Como en el catálogo", "Nombre · Empresa"), ("Propio de esta pregunta", None)]
SIN_CATALOGOS = "Todavía no hay catálogos disponibles."
MOTIVO_PUBLICAR = "Todavía no sabemos si WhatsApp recibió la versión 4."

CSS_COMPU = b2.css(False) + """
/* E14 · Las preguntas en columnas (263): el número, el nombre, el tipo (con «varias, hasta N») y «Obligatoria», cada uno en su
   columna, y ↑ ↓ ✎ 🗑 a la vista (127). Un título de sección ocupa el nombre, el tipo y «Obligatoria», con las mismas acciones (88).
   Los anchos de las columnas ya van con la escala de la compu (el número de 19,2 px y cuatro íconos de 22,2 px): la pasada no toca
   `grid-template-columns`. */
.q-th, .q-it { display: grid; grid-template-columns: 20px minmax(0, 1fr) 200px 76px 89px; column-gap: 12px; align-items: center; }
.q-th { position: relative; min-height: 40px; padding: 0 8px 0 16px; border-bottom: 1px solid oklch(0.89 0.031 95); background: oklch(0.975 0.006 95); color: var(--t2); font-size: 13px; font-weight: 600; }
.q-th > span { min-width: 0; white-space: nowrap; }
.q-th .der { text-align: right; }
.q-it .dato { min-width: 0; }
.q-it .q-tp, .q-it .q-ob { min-width: 0; color: var(--t1); font-size: 13px; line-height: 1.35; }
.q-it .q-acc2 { justify-self: stretch; }
.q-it .q-acc2 > :first-child { margin-left: auto; }
.q-it.q-tit .dato { grid-column: 2 / 5; }
/* 137 · La línea fina entre columnas, en el encabezado y en las filas. */
.q-th > * + *::after, .q-it > * + *::after { content: ""; position: absolute; top: 0; bottom: 0; width: 1px; margin-left: -6px; background: oklch(0.915 0.013 95 / 0.8); pointer-events: none; }
.q-th > * + *::after { background: oklch(0.89 0.031 95); }
/* E14 · La pieza para elegir (262) en los campos del formulario, de la pregunta y de «En WhatsApp». */
.e-g2 .w-cmp .b2-env, .q-ed .w-cmp .b2-env, .q-zona .w-cmp .b2-env { width: 100%; }
.q-zona:has(.b2-pkl) { overflow: visible; }
.b2-pkl a.mas { box-sizing: border-box; text-decoration: none; }
"""
CSS_TEL = b2.css(True) + """
/* E14 · Cada pregunta, una tarjeta (263 y 206), como las opciones de un catálogo: el número, el nombre y ↑ ↓ ✎ 🗑 a la vista;
   debajo, «Tipo» y «Obligatoria», cada dato con su nombre. Un título de sección, con su nombre y sus acciones (88). Lo que WhatsApp
   rechazó lleva su motivo debajo, como el error de un campo. */
.q-tj { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; column-gap: 12px; align-items: center; padding: 8px 6px 10px 14px; }
.ap-grupo > .q-tj:last-child { border-bottom: 0; }
.q-tj .num { grid-row: 1; grid-column: 1; width: 26px; height: 26px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.q-tj .nm { grid-row: 1; grid-column: 2; font-size: 16px; font-weight: 500; }
.q-tj .q-acc { grid-row: 1; grid-column: 3; }
.q-tj .dl { grid-row: 2; grid-column: 2 / -1; margin: 2px 0 0; }
.q-tj.q-tit { background: oklch(0.975 0.01 95); padding-bottom: 8px; }
.q-tj.q-tit .num { visibility: hidden; }
.q-tj.q-tit .nm { font-weight: 600; }
.q-tj.mal { background: oklch(0.985 0.012 25); }
.q-tj .nm .t-chip { margin-left: 8px; vertical-align: 2px; }
.q-tj .q-err { grid-row: 3; grid-column: 2 / -1; margin-top: 6px; color: var(--peligro); font-size: 14px; line-height: 1.4; }
/* E14 · La pieza para elegir (262) en los campos del formulario y de la pregunta. */
.ap-cmp .b2-env { width: 100%; }
"""


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
    """Los `sc-if` de primer nivel de un estado (`{{var}}`), en orden: [(inicio, fin), …]."""
    out, pos = [], 0
    for m in re.finditer(r'<sc-if value="\{\{%s\}\}"' % var, t):
        if m.start() < pos:
            continue
        fin = cierre(t, m.start(), "sc-if")
        out.append((m.start(), fin))
        pos = fin
    return out


def renombrar(bloque, viejo, nuevo):
    """El mismo `sc-if` para otro estado: cambia solo su apertura."""
    assert bloque.startswith(f'<sc-if value="{{{{{viejo}}}}}"'), bloque[:60]
    return f'<sc-if value="{{{{{nuevo}}}}}" hint-placeholder-val="{{{{no}}}}">' + bloque[bloque.index(">") + 1:]


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:120])
    return t.replace(viejo, nuevo)


def estados(t):
    return json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))


def s_de(t, nombre):
    return f"s{estados(t).index(nombre)}"


def sumar_estados(t, pedidos):
    """Suma estados al Tweak: cada uno va en el enum después de su ancla y, al final de `const k`, con su `sN` en `renderVals()`.
    El enum de la compu no muestra todos los de `const k` (los de etapas que vienen): no se comparan."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    ops = props["estado"]["options"]
    for ancla, nombre in pedidos:
        assert nombre not in ops, nombre
        ops.insert(ops.index(ancla) + 1, nombre)
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    m = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    lista = json.loads(m.group(1))
    base = len(lista)
    nuevos = [n for _, n in pedidos]
    lista += nuevos
    t = t[:m.start(1)] + json.dumps(lista, ensure_ascii=False) + t[m.end(1):]
    ult = f"      s{base - 1}: k === {base - 1},\n"
    assert ult in t
    t = t.replace(ult, ult + "".join(f"      s{base + i}: k === {base + i},\n" for i in range(len(nuevos))), 1)
    return t, {n: f"s{base + i}" for i, n in enumerate(nuevos)}


def con_css(t, css):
    assert MARCA not in t
    t = re.sub(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1)}{SUFIJO}</title>" if not m.group(1).endswith(SUFIJO)
               else m.group(0), t, count=1)
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def partir(t):
    """La cabeza (hasta `</helmet>`), el cuerpo del tablero y el guion: solo se cambia el cuerpo."""
    i, j = t.index("</helmet>"), t.index('<script type="text/x-dc"')
    return t[:i], t[i:j], t[j:]


# ---------------------------------------------------------------------------------------------------------------- los datos
def tipo_y_obligatoria(desc):
    """De «Elegir varias · 4 opciones · de 1 a 3 · Obligatoria» salen el tipo («Elegir varias, hasta 3») y «Sí»."""
    partes = desc.split(" · ")
    ob = {"Obligatoria": "Sí", "Opcional": "No"}[partes[-1]]
    base = partes[0].split(",")[0]
    assert base in TIPOS, desc
    medio = partes[1:-1]
    varias = next((p for p in medio if p.startswith("varias, hasta ")), None)
    rango = next((p for p in medio if re.fullmatch(r"de \d+ a \d+", p)), None)
    if base == "Elegir varias" and rango:
        tipo = f"Elegir varias, hasta {rango.split()[-1]}"
    elif varias:
        tipo = f"{base}, {varias}"
    else:
        tipo = base
    return tipo, ob


def lista_catalogos():
    return b2.lista([b2.op(n, d, elegida=n == "Motivos de visita", activa=n == "Motivos de visita", apagada=mot,
                           tip_abierto=n == TIP_CATALOGO) for n, d, mot in CATALOGOS], buscar="")


def aria_de(valor):
    if valor in PARA_QUIEN:
        return "Para quién es"
    if valor in TIPOS:
        return "Tipo de respuesta"
    return "Catálogo"


# ---------------------------------------------------------------------------------------------------------------- la compu
def filas_compu(cuerpo):
    """Cada fila de pregunta, en columnas (263); el encabezado, arriba de la primera."""
    cab = re.compile(r'<div class="q-it( q-tit)?"><span class="num">(\d*)</span><span class="dato"><b>([^<]*)</b>'
                     r'(?:<span>([^<]*)</span>)?</span>(<span class="chips"></span>)?')
    cuenta = {"preguntas": 0, "títulos": 0, "lectura": 0}
    out, pos = [], 0
    for m in cab.finditer(cuerpo):
        tit, num, nombre, desc = m.group(1), m.group(2), m.group(3), m.group(4)
        if tit:
            assert not desc and not num, m.group(0)
            nuevo = f'<div class="q-it q-tit"><span class="num"></span><span class="dato"><b>{nombre}</b></span>'
            cuenta["títulos"] += 1
        else:
            tipo, ob = tipo_y_obligatoria(desc)
            nuevo = (f'<div class="q-it"><span class="num">{num}</span><span class="dato"><b>{nombre}</b></span>'
                     f'<span class="q-tp">{tipo}</span><span class="q-ob">{ob}</span>')
            cuenta["preguntas"] += 1
        resto = cuerpo[m.end():]
        if resto.startswith('<span class="q-acc2">'):
            fin = m.end()
        else:
            # Solo lectura: el ojo de «Ver pregunta», o el lugar vacío de un título, en la columna de las acciones.
            if resto.startswith("<a "):
                largo = resto.index("</a>") + 4
            else:
                vacio = '<span class="ib" aria-hidden="true"></span>'
                assert resto.startswith(vacio), resto[:80]
                largo = len(vacio)
            nuevo += f'<span class="q-acc2">{resto[:largo]}</span>'
            fin = m.end() + largo
            cuenta["lectura"] += 1
        out.append(cuerpo[pos:m.start()] + nuevo)
        pos = fin
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert "<span>Texto corto · " not in cuerpo and 'class="chips"' not in cuerpo
    print("filas de la compu:", cuenta)

    encabezado = ('<div class="q-th" role="row"><span role="columnheader">#</span><span role="columnheader">Pregunta</span>'
                  '<span role="columnheader">Tipo</span><span role="columnheader">Obligatoria</span>'
                  '<span class="der" role="columnheader">Acciones</span></div>')
    # Sin cruzar un `</div>`: la banda de «Preguntas» de un formulario sin preguntas no lleva encabezado.
    cuerpo, n = re.subn(r'(<div class="f-cab"><span>Preguntas</span><span class="der">(?:(?!</div>).)*?</span></div>)'
                        r'(?=<div class="q-(?:it|ab)\b)', lambda m: m.group(1) + encabezado, cuerpo, flags=re.S)
    assert n == cuerpo.count('<div class="f-cab"><span>Preguntas</span>') - cuerpo.count('</div><div class="e-vacio">'), n
    print("encabezados de la compu:", n)
    return cuerpo


def piezas_compu(cuerpo):
    """Lo que se elige, en la pieza (262): cerrada con lo elegido; abierta donde el tablero ya abría la lista."""
    # Los campos del título y de la descripción de la presentación propia: la pieza múltiple, por su nombre, sin chips.
    for rotulo, aria in (("Título · hasta 30 caracteres", "Título"), ("Descripción · hasta 300", "Descripción")):
        patron = (r'(<span class="rt">%s</span>)<div class="q-chips"><span class="ab-chip">([^<]+)<span aria-hidden="true">×</span>'
                  r'</span><div class="ct sel">Agregar campo%s</div></div>' % (re.escape(rotulo), SVG))
        cuerpo, n = re.subn(patron, lambda m: m.group(1) + b2.campo(m.group(2), aria=aria), cuerpo, flags=re.S)
        assert n == 1, (rotulo, n)

    # «Qué viaja a WhatsApp»: los dos radios pasan a la pieza, cerrada con lo elegido.
    radios = (r'<div class="zb" role="radiogroup" aria-label="Qué viaja a WhatsApp"><div class="q-rd" role="radio"><i></i>'
              r'<span>Como en el catálogo<small>Nombre · Empresa</small></span></div><div class="q-rd on" role="radio"><i></i>'
              r'<span>Propio de esta pregunta</span></div>')
    cuerpo, n = re.subn(radios, '<div class="zb"><div class="w-cmp"><span class="rt">Qué viaja a WhatsApp</span>'
                        + b2.campo("Propio de esta pregunta", aria="Qué viaja a WhatsApp") + "</div>", cuerpo)
    assert n == 1, n

    # Las listas que el tablero ya abría: «Para quién es», el catálogo y «Sin catálogos».
    def abierta(m):
        clases, valor, menu = m.group(1), m.group(2), m.group(3)
        if "Para quién es" in menu:
            extra = b2.lista([b2.op(n, elegida=n == valor, activa=n == valor) for n in PARA_QUIEN])
            return b2.campo(valor, abierto=True, aria="Para quién es", extra=extra)
        if 'class="vacio"' in menu:
            assert "ph" in clases
            extra = b2.lista([], msj=SIN_CATALOGOS, pie='<a class="mas" href="FRM-Catalogos.dc.html">Ir a Catálogos</a>')
            return b2.campo(valor, vacio=True, abierto=True, aria="Catálogo", extra=extra)
        assert valor == "Motivos de visita", valor
        return b2.campo(valor, abierto=True, aria="Catálogo", extra=lista_catalogos())
    cuerpo, n = re.subn(r'<div class="ct sel abierto( ph)?">([^<]*)' + SVG + r'</div>(<div class="q-catmn" role="listbox"'
                        r' aria-label="[^"]*">.*?</div>)', abierta, cuerpo, flags=re.S)
    assert n == 3 and "q-catmn" not in cuerpo, n

    # Las demás, cerradas: «Para quién es», el tipo de respuesta y el catálogo (con su error, si lo tiene).
    cuerpo, n = re.subn(r'<div class="ct sel( mal)?">([^<]*)' + SVG + r'</div>',
                        lambda m: b2.campo(m.group(2), error=bool(m.group(1)), aria=aria_de(m.group(2))), cuerpo, flags=re.S)
    assert 'class="ct sel' not in cuerpo and "q-rd" not in cuerpo, n
    print("piezas cerradas de la compu:", n)
    return cuerpo


def compu():
    t, nl = leer("FRM-Editor")
    if MARCA in t:
        print("FRM-Editor ya tiene el bloque: no hace nada")
        return
    t = con_css(t, CSS_COMPU)
    cab, cuerpo, guion = partir(t)
    cuerpo = piezas_compu(filas_compu(cuerpo))
    t = cab + cuerpo + guion

    # Dos estados nuevos: la pieza del tipo abierta y la de «Qué viaja a WhatsApp» abierta.
    s_con, s_pres, s_ult = s_de(t, "Con cambios"), s_de(t, "Presentación propia"), s_de(t, "Editar un título")
    t, sv = sumar_estados(t, [("Para quién es", "Elegir el tipo"), ("Presentación propia", "Qué viaja a WhatsApp")])
    (b1, b1f), (c1, c1f) = sc_ifs(t, s_con)[:2]
    (b18, b18f), (c18, c18f) = sc_ifs(t, s_pres)[:2]
    cerrado = b2.campo("Elegir una", aria="Tipo de respuesta")
    abierto = b2.campo("Elegir una", abierto=True, aria="Tipo de respuesta",
                       extra=b2.lista([b2.op(n, elegida=n == "Elegir una", activa=n == "Elegir una") for n in TIPOS]))
    tipo = una(renombrar(t[c1:c1f], s_con, sv["Elegir el tipo"]), cerrado, abierto)
    cerrado = b2.campo("Propio de esta pregunta", aria="Qué viaja a WhatsApp")
    abierto = b2.campo("Propio de esta pregunta", abierto=True, aria="Qué viaja a WhatsApp",
                       extra=b2.lista([b2.op(n, d, elegida=n == "Propio de esta pregunta", activa=n == "Propio de esta pregunta")
                                       for n, d in PRESENTACION]))
    pres = una(renombrar(t[c18:c18f], s_pres, sv["Qué viaja a WhatsApp"]), cerrado, abierto)
    bandas = renombrar(t[b1:b1f], s_con, sv["Elegir el tipo"]) + renombrar(t[b18:b18f], s_pres, sv["Qué viaja a WhatsApp"])

    # Las bandas van después de la última banda de siempre; los cuerpos, después del último cuerpo.
    (ub, ubf), (uc, ucf) = sc_ifs(t, s_ult)[:2]
    t = t[:ubf] + bandas + t[ubf:ucf] + tipo + pres + t[ucf:]
    escribir("FRM-Editor", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def tarjetas_tel(cuerpo):
    """Cada fila de pregunta, una tarjeta (263): el número, el nombre y sus acciones; debajo, «Tipo» y «Obligatoria»."""
    # El tipo y si es obligatoria, por nombre, de las filas comunes: la que WhatsApp rechazó solo trae el motivo.
    datos = {}
    for m in re.finditer(r'<div class="q-row"><span class="num">\d+</span><span class="tx"><b>([^<]+)</b><span>([^<]+)</span>', cuerpo):
        datos[m.group(1)] = tipo_y_obligatoria(m.group(2))
    cuenta = {"preguntas": 0, "títulos": 0, "rechazadas": 0}
    out, pos = [], 0
    for m in re.finditer(r'<div class="q-row( q-tit| mal)?">', cuerpo):
        fin = cierre(cuerpo, m.start(), "div")
        fila = cuerpo[m.start():fin]
        clase = (m.group(1) or "").strip()
        f = re.fullmatch(r'<div class="q-row[^"]*"><span class="num">(\d*)</span><span class="tx"><b>([^<]*)(<span class="t-chip mal">[^<]*'
                         r'</span>)?</b>(?:<span>([^<]*)</span>)?</span>(<span class="q-acc">.*</span>)</div>', fila, re.S)
        assert f, fila[:200]
        num, nombre, chip, desc, acc = f.groups()
        if clase == "q-tit":
            tj = f'<div class="b2-tj q-tj q-tit"><span class="num"></span><span class="nm">{nombre}</span>{acc}</div>'
            cuenta["títulos"] += 1
        else:
            if clase == "mal":
                tipo, ob = datos[nombre]
                err = f'<span class="q-err">{desc}</span>'
                cuenta["rechazadas"] += 1
            else:
                tipo, ob = tipo_y_obligatoria(desc)
                err = ""
                cuenta["preguntas"] += 1
            dl = (f'<span class="dl"><span class="c"><span class="k">Tipo</span><span class="v">{tipo}</span></span>'
                  f'<span class="c"><span class="k">Obligatoria</span><span class="v">{ob}</span></span></span>')
            tj = (f'<div class="b2-tj q-tj{" mal" if clase == "mal" else ""}"><span class="num">{num}</span>'
                  f'<span class="nm">{nombre}{chip or ""}</span>{acc}{dl}{err}</div>')
        out.append(cuerpo[pos:m.start()] + tj)
        pos = fin
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert "q-row" not in cuerpo
    print("tarjetas del teléfono:", cuenta)
    return cuerpo


def telefono():
    t, nl = leer("M-FRM-Editor")
    if MARCA in t:
        print("M-FRM-Editor ya tiene el bloque: no hace nada")
        return
    t = con_css(t, CSS_TEL)
    cab, cuerpo, guion = partir(t)
    cuerpo = tarjetas_tel(cuerpo)
    cuerpo, n = re.subn(r'<div class="ct sel">([^<]*)' + SVG + r'</div>', lambda m: b2.campo(m.group(1), aria=aria_de(m.group(1))),
                        cuerpo, flags=re.S)
    assert 'class="ct sel' not in cuerpo, n
    print("piezas cerradas del teléfono:", n)
    t = cab + cuerpo + guion

    # «El motivo de Publicar apagado»: sin la franja oscura; el motivo, en el tooltip sobre el botón del pie fijo (211).
    s_mot = s_de(t, "El motivo de Publicar apagado")
    (c, cf), = sc_ifs(t, s_mot)
    bloque = t[c:cf]
    bloque = una(bloque, f'<div class="f-snack alto" role="status"><span class="tx">{MOTIVO_PUBLICAR}</span></div>', "")
    boton = '<button type="button" class="cb cb-pri full" aria-disabled="true">Publicar en WhatsApp</button>'
    bloque = una(bloque, f'<div class="fila">{boton}</div>',
                 f'<div class="fila"><span class="acc-apagado">{boton}{b2.tip(MOTIVO_PUBLICAR)}</span></div>')
    t = t[:c] + bloque + t[cf:]

    # Tres estados nuevos, con la pieza a pantalla completa: «Para quién es», el tipo y el catálogo.
    s0, s4, s6 = s_de(t, "Sin cambios"), s_de(t, "Editar una pregunta"), s_de(t, "Pregunta con catálogo")
    s_ult = s_de(t, "Revisar los cambios")
    t, sv = sumar_estados(t, [("Acciones del formulario", "Para quién es"), ("Editar una pregunta", "Elegir el tipo"),
                              ("Pregunta con catálogo", "Elegir el catálogo")])
    cuerpos = [renombrar(t[a:b], s, sv[n]) for n, s, (a, b) in
               (("Para quién es", s0, sc_ifs(t, s0)[0]), ("Elegir el tipo", s4, sc_ifs(t, s4)[0]),
                ("Elegir el catálogo", s6, sc_ifs(t, s6)[0]))]
    piezas = {
        "Para quién es": b2.pk_tel("Para quién es", [(n, None, n == "Empleados", None) for n in PARA_QUIEN]),
        "Elegir el tipo": b2.pk_tel("Tipo de respuesta", [(n, None, n == "Elegir una", None) for n in TIPOS]),
        "Elegir el catálogo": b2.pk_tel("Catálogo", [(n, d, n == "Motivos de visita", mot) for n, d, mot in CATALOGOS],
                                        buscar="", tip_en=TIP_CATALOGO),
    }
    capas = "".join(f'<sc-if value="{{{{{sv[n]}}}}}" hint-placeholder-val="{{{{no}}}}">{p}</sc-if>' for n, p in piezas.items())
    fin_cuerpos = sc_ifs(t, s_ult)[0][1]
    fin_capas = t.rindex("</div>\n</x-dc>")
    t = t[:fin_cuerpos] + "".join(cuerpos) + t[fin_cuerpos:fin_capas] + capas + t[fin_capas:]
    escribir("M-FRM-Editor", t, nl)


# ---------------------------------------------------------------------------------------------------------------- con mínimo 1
def obligatoria_con_minimo(nombre):
    """Una pregunta de catálogo con «varias» y mínimo 1 es obligatoria (lo dice su (i)): la columna y la tarjeta dicen «Sí». Corre
    también sobre el tablero ya pasado por las piezas, porque no toca el CSS; si ya está, no cambia nada."""
    t, nl = leer(nombre)
    t2, n = re.subn(r'(<span class="q-tp">Elegir de un catálogo, varias, hasta \d+</span><span class="q-ob">)No(</span>)', r"\1Sí\2", t)
    t2, m = re.subn(r'(<span class="k">Tipo</span><span class="v">Elegir de un catálogo, varias, hasta \d+</span></span><span class="c">'
                    r'<span class="k">Obligatoria</span><span class="v">)No(</span>)', r"\1Sí\2", t2)
    print("con mínimo 1, obligatoria:", nombre, n + m)
    if nombre == "FRM-Editor":
        # Y la casilla «Obligatoria» de esa pregunta abierta, marcada como la columna (la tilde, la de «Permitir elegir varias»).
        for estado in ("Varias de un catálogo", "Más de 20 en varias"):
            s = s_de(t2, estado)
            a, b = sc_ifs(t2, s)[1]
            cuerpo = t2[a:b]
            vacia = '<span class="q-chk"><i class="no"></i>Obligatoria</span>'
            if vacia not in cuerpo:
                assert re.search(r'<span class="q-chk"><i><svg\b.*?</svg></i>Obligatoria</span>', cuerpo, re.S), estado
                continue
            tilde = re.search(r'<span class="q-chk"><i>(<svg\b.*?</svg>)</i>Permitir elegir varias</span>', cuerpo, re.S).group(1)
            t2 = t2[:a] + una(cuerpo, vacia, f'<span class="q-chk"><i>{tilde}</i>Obligatoria</span>') + t2[b:]
            print("casilla «Obligatoria» marcada:", estado)
    if t2 != t:
        escribir(nombre, t2, nl)


if __name__ == "__main__":
    compu()
    telefono()
    obligatoria_con_minimo("FRM-Editor")
    obligatoria_con_minimo("M-FRM-Editor")
