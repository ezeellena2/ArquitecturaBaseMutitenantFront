"""La lectura de documentos, la plantilla, armar con la IA y las listas de la E25 con el traspaso 18 (tanda 3B de Diseño,
2026-11-26), redibujados en su lugar con la forma que la E14 dejó aprobada en la v186 (`FRM-Editor` y `M-FRM-Editor`,
`e14_editor_1004.py`; `FRM-Catalogos-14`, `e14_listados_1004.py`) y la de `FRM-Formularios-21` redibujado (`e21_listas_1004.py`):

- `FRM-Editor-Lectura` y `Plat-FRM-Plantilla-Lectura`: **las preguntas en columnas (263):** el número, el nombre, el tipo y
  «Obligatoria», cada uno en su columna con su encabezado, y ↑ ↓ ✎ 🗑 a la vista (127); lo que iba debajo del nombre («2 decimales»,
  «Pesos, Dólares», el catálogo, «CBU, CVU o alias») no va en la fila: se ve al abrir la pregunta (285). Una pregunta de archivo dice
  «Documento, hasta 1», como la E18, y el bloque, «Bloque» y «Sí» si pide al menos un ítem, como la E19. **La tabla de la lectura:**
  el tipo de cada dato pasa de debajo del nombre a su columna, «Tipo» (263); la pregunta que lo recibe, la validación que elige un
  formulario propio o la plantilla y el cruce con catálogos van en la pieza (262), cerrada con lo elegido o en gris («Ninguna»). La
  validación fija que trae la plantilla sigue con su candado, como texto. En «Elegir la pregunta», la pieza abierta, con «Ninguna»
  («No se lee») primero y separada por una línea; en «Elegir una validación» de la plataforma, con «Ninguna» primero y los dos
  formatos que no van con una pregunta de texto apagados, con su motivo en el tooltip (211 y 269). **«Cómo viene leyendo»:** los dos
  números pasan a una lectura (138), sin «·», y la precisión por dato es una tabla con «Dato» y «Sin corregir» que ordena (264), de la
  que más se corrige a la que menos, con la flecha antes del título porque es un número. **«Ver los ejemplos»:** la tabla dice su
  orden, la más reciente primero, con la flecha después de «Fecha» (264). «Viene de» ya no junta la versión con «·». El ⋮ de la banda
  se llamaba «Acciones de Visita a cliente»: pasa al nombre del formulario o de la plantilla.
- `M-FRM-Editor-Lectura`: cada dato es una tarjeta (263), con «Pregunta que lo recibe» en la pieza (262) y «Validación fija»
  nombrada; en un formulario propio, la validación también en la pieza. La validación fija lleva su candado y dice por qué en un
  tooltip que abre el toque (211): el estado «Una validación fija» pierde la hoja chica y lo muestra abierto sobre «Cuenta de origen».
  «Cargar solo si es seguro» suma su (i), que el estado del mismo nombre muestra abierta. Esos dos estados dibujan la lectura más
  abajo, como desplazada, porque lo que abren no entra en 844 de alto (el de «Cargar solo si es seguro» ya escondía el título de los
  datos para eso). «Viene de» ya no junta la versión con «·». Estado nuevo: «Elegir la pregunta», la pieza a pantalla completa.
- `FRM-Plantilla-25` y `M-FRM-Plantilla-25`: las preguntas en columnas, sin la de acciones porque la plantilla se lee (263); «Qué
  lee», con «Tipo» en su columna. En el teléfono, cada pregunta es la tarjeta de `M-FRM-Editor` con «Tipo» y «Obligatoria»; cada
  dato que lee, una tarjeta con su «Validación fija», y la categoría, la versión y para quién es pasan de una línea con «·» a una
  lectura, «La plantilla».
- `FRM-Armar-Con-IA` y `M-FRM-Armar-Con-IA`: cada dato de una pregunta en su columna (263): Tipo, Obligatoria y «Leído en el
  primero», también las preguntas del bloque, alineadas con las de afuera; «Para quién es» y el tipo del bloque en la pieza (262). El
  documento a la vista deja «nombre · persona · fecha» y pasa a una lectura con Documento, Llegó y Mandó, los nombres de la bandeja
  (206). En el teléfono, cada pregunta es una tarjeta con «Tipo» y «Obligatoria», también las del bloque.
- `FRM-Formularios-25`: la lista de `FRM-Formularios-21` redibujado: «Cargar» es la primera opción del ⋮ (261), «Estado» y «Dónde se
  completa» en lugar de «En WhatsApp», cada dato en su columna (229, 206 y 263), el filtro «Estado» con su botón y la pieza, sin
  cantidades, con «Con algo por aprobar» (262 y 275), el encabezado que ordena y «Ordenar por» último (264). Conserva «Armar con la
  IA» y el menú de «Nuevo formulario». Estados nuevos: «Quien solo carga: Cargar», «Ordenar por abierto» y «Ordenado por Formulario»;
  se va «Aprobación: menú».
- `FRM-Catalogos-25`: como `FRM-Catalogos-14`: filtros con su botón y la pieza, sin cantidades (262), el encabezado que ordena y
  «Ordenar por» último (264). Se va la etiqueta «Propuesta del asistente» de al lado del nombre: el estado ya dice «Por aprobar» (175
  y 206), y el filtro «Estado» suma «Por aprobar». Las filas, por nombre de la A a la Z, como dice su flecha; «Proveedores de obra»,
  escrito a mano, pasa al filtro de las escritas a mano. El resumen dice solo la cantidad (284). Estados nuevos: «Ordenar por
  abierto», «Ordenado por Lo usan» y «Estado: Por aprobar».

`M-WA-Armar-Con-IA` no cambia: su resumen es el texto de un mensaje de WhatsApp, una lista que no es tabla (263 y 138), y la pieza
no aplica a lo que imita WhatsApp (262). El panel «Gestión de formularios» no se toca acá: lo parte después quien lanzó la tanda.

Uso: `python e25_editor_1004.py`. Cambia los tableros en su lugar; el bloque `<style data-t3b="e25-editor">` lo frena si ya corrió.
Al final corre `traspaso10_piezas_1004.py --tableros` con los nueve, que pone la escala de la compu. No toca `canvas.json` ni los
`$preview`: ningún tablero necesita más alto.
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
import e21_listas_1004 as e21  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = '<style data-t3b="e25-editor">'
leer, escribir, una, fin_sc_if, props = e12l.leer, e12l.escribir, e12l.una, e12l.fin_sc_if, e12l.props
cierre, sc_ifs, sumar_estados, s_de = e14e.cierre, e14e.sc_ifs, e14e.sumar_estados, e14e.s_de
COMPU = ["FRM-Editor-Lectura", "Plat-FRM-Plantilla-Lectura", "FRM-Plantilla-25", "FRM-Armar-Con-IA", "FRM-Formularios-25",
         "FRM-Catalogos-25"]
TEL = ["M-FRM-Editor-Lectura", "M-FRM-Plantilla-25", "M-FRM-Armar-Con-IA"]
SVG = r"<svg\b[^>]*>.*?</svg>"


def V(nombre):
    return "{{" + nombre + "}}"


def con_css(t, css):
    assert MARCA not in t
    return e14l.para_aprobar(una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>"))


def sin_tags(html):
    html = re.sub(SVG, "", html, flags=re.S)
    html = re.sub(r'<span class="(?:rq|req)">\*</span>', "", html)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


# ---------------------------------------------------------------------------------------------------------------- los datos
TIPOS = e14e.TIPOS + ["Foto", "Documento"]


def tipo_y_obligatoria(desc):
    """De «Documento · 1 · Obligatoria» salen «Documento, hasta 1» y «Sí» (como la E18); de «Bloque · de 1 a 10 ítems · 3 preguntas»,
    «Bloque» y «Sí» (pide al menos un ítem, como la E19); de «Texto corto · CBU, CVU o alias · Opcional», «Texto corto» y «No»: el
    detalle se ve al abrir la pregunta (285). Sin «Obligatoria» ni «Opcional» (el tipo de un dato), la segunda es None."""
    partes = [p.strip() for p in desc.split(" · ")]
    base = partes[0]
    ob = {"Obligatoria": "Sí", "Opcional": "No"}.get(partes[-1])
    if base == "Bloque":
        rango = partes[1]
        if rango.startswith("hasta "):
            return "Bloque", "No"
        return "Bloque", "Sí" if int(re.match(r"(?:de )?(\d+)", rango).group(1)) >= 1 else "No"
    if base in ("Foto", "Documento"):
        tope = next((p.split()[-1] for p in partes[1:] if re.fullmatch(r"(?:(?:de \d+ a|hasta) )?\d+", p)), None)
        return (f"{base}, hasta {tope}" if tope else base), ob
    assert base in TIPOS, desc
    return base, ob


def datos_de(t, clase):
    """Nombre → (tipo, obligatoria) de las filas de preguntas de la compu (`q-it` o `d25-q`), para las tarjetas del teléfono."""
    return {m.group(1): tipo_y_obligatoria(m.group(2)) for m in
            re.finditer(r'<div class="%s(?: sub)?"><span class="num">\d*</span><span class="dato"><b>([^<]*)</b><span>([^<]*)</span>' % clase, t)}


# ---------------------------------------------------------------------------------------------------------------- las preguntas
FILA_Q = re.compile(r'<div class="(q-it|d25-q)( sub)?"><span class="num">(\d*)</span><span class="dato"><b>([^<]*)</b><span>([^<]*)</span>'
                    r'</span>(?:<span class="chips"></span>|<span class="leido">Leído en el primero: ([^<]*)</span>)(<span></span>)?')
CAB_Q = re.compile(r'(<div class="f-cab"><span>Preguntas</span><span class="der">(?:(?!</div>).)*?</span></div>)(?=<div class="(q-it|d25-q)[ "])',
                   re.S)
TH = '<span role="columnheader">{}</span>'


def filas_preguntas(cuerpo, solo_lectura=False):
    """Cada pregunta en columnas (263): el número, el nombre, el tipo, «Obligatoria» y, en la propuesta, «Leído en el primero»; el
    encabezado arriba de la primera. `solo_lectura`: la plantilla de la biblioteca, sin la columna de las acciones."""
    cuenta = {"q-it": 0, "d25-q": 0}

    def fila(m):
        clase, sub, num, nombre, desc, leido, vacio = m.groups()
        tipo, ob = tipo_y_obligatoria(desc)
        cuenta[clase] += 1
        celdas = f'<span class="num">{num}</span><span class="dato"><b>{nombre}</b></span><span class="q-tp">{tipo}</span><span class="q-ob">{ob}</span>'
        if clase == "d25-q":
            return f'<div class="d25-q{sub or ""}">{celdas}<span class="leido">{leido}</span>{vacio or ""}'
        if vacio:
            assert solo_lectura
            return f'<div class="q-it m25-ro">{celdas}'
        return f'<div class="q-it">{celdas}'

    cuerpo = FILA_Q.sub(fila, cuerpo)
    assert 'class="chips"' not in cuerpo and "Leído en el primero:" not in cuerpo

    def cab(m):
        if m.group(2) == "d25-q":
            return m.group(1) + ('<div class="d25-qh" role="row">' + "".join(TH.format(c) for c in ("#", "Pregunta", "Tipo", "Obligatoria",
                                                                                              "Leído en el primero"))
                                 + '<span class="der" role="columnheader">Acciones</span></div>')
        if solo_lectura:
            return m.group(1) + ('<div class="q-th m25-ro" role="row">' + "".join(TH.format(c) for c in ("#", "Pregunta", "Tipo", "Obligatoria"))
                                 + "</div>")
        return m.group(1) + ('<div class="q-th" role="row">' + "".join(TH.format(c) for c in ("#", "Pregunta", "Tipo", "Obligatoria"))
                             + '<span class="der" role="columnheader">Acciones</span></div>')
    cuerpo, n = CAB_Q.subn(cab, cuerpo)
    print("  filas:", cuenta, "encabezados:", n)
    return cuerpo


# ---------------------------------------------------------------------------------------------------------------- la lectura
CT = re.compile(r'<div class="ct sel( ph| abierto)?"(?: style="[^"]*")?>([^<]*)' + SVG + r'</div>', re.S)
CATMN = re.compile(r'<div class="q-catmn" role="listbox" aria-label="[^"]*"(?: style="[^"]*")?>(.*?)</div>', re.S)
# Las validaciones fijas que no van con una pregunta de texto (269: lo que el servidor rechaza, la pantalla lo frena antes).
SOLO_PARA = {"Formato argentino: 150.000,00": ("Número", "Es para una pregunta de número."),
             "Formato argentino: 03/11/2026": ("Fecha", "Es para una pregunta de fecha.")}
ARIA = {"Pregunta que lo recibe": "Pregunta que recibe «{}»", "Validación fija": "Validación fija de «{}»"}


def lista_abierta(html_ops, tipo):
    """La lista de la pieza (262): «Ninguna» primero, separada por una línea; lo que no va con el tipo, apagado con su motivo."""
    ops = re.findall(r'<span class="(on)?" role="option">([^<]*)</span>', html_ops)
    out, primera_apagada = [], True
    ninguna = [o for o in ops if o[1].startswith("Ninguna")]
    resto = [o for o in ops if not o[1].startswith("Ninguna")]
    assert len(ninguna) == 1, ops
    on, texto = ninguna[0]
    nombre, _, desc = texto.partition(": ")
    out.append(b2.op(nombre, desc.capitalize() or None, elegida=bool(on), activa=bool(on)))
    for k, (on, texto) in enumerate(resto):
        mot = None
        if texto in SOLO_PARA and SOLO_PARA[texto][0] != tipo:
            mot = SOLO_PARA[texto][1]
        out.append(b2.op(texto, elegida=bool(on), activa=bool(on), apagada=mot, sep=k == 0, tip_abierto=bool(mot) and primera_apagada))
        if mot:
            primera_apagada = False
    return b2.lista(out)


def celda_lectura(c, nombre, col, tipo):
    """Una celda de la tabla de la lectura: lo que se elegía con `ct sel` pasa a la pieza, cerrada o abierta (262)."""
    m = CT.search(c)
    if not m:
        return c
    clase, valor = (m.group(1) or "").strip(), m.group(2)
    aria = ARIA[col].format(nombre)
    if clase == "abierto":
        mm = CATMN.search(c)
        assert mm, c[:200]
        nuevo = b2.campo(valor, abierto=True, aria=aria, extra=lista_abierta(mm.group(1), tipo))
        c = c.replace(mm.group(0), "", 1)
    else:
        nuevo = b2.campo(valor, vacio=clase == "ph", aria=aria)
    c = c[:m.start()] + nuevo + c[m.end():]
    if c.startswith('<div class="b2-env">'):
        c = f'<div class="rel">{c}</div>'
    return c


def tablas_lectura(cuerpo):
    """La tabla de lo que lee: el tipo de cada dato sale de debajo del nombre y va en su columna, «Tipo» (263)."""
    out, pos, n = [], 0, 0
    for m in re.finditer(r'<div class="d25-lt( d25-lt2)?">', cuerpo):
        i = m.start()
        j = b2.fin_div(cuerpo, i)
        ab, filas, ci = b2.hijos(cuerpo[i:j])
        assert filas[0].startswith('<div class="h">')
        a, cs, c = b2.hijos(filas[0])
        cols = [sin_tags(x) for x in cs]
        nuevas = [a + cs[0] + "<span>Tipo</span>" + "".join(cs[1:]) + c]
        for f in filas[1:]:
            a, cs, c = b2.hijos(f)
            d = re.fullmatch(r'<span class="dt">(<b[^>]*>([^<]*)</b>)<small>([^<]*)</small></span>', cs[0])
            assert d, cs[0][:200]
            nombre = d.group(2)
            tipo, _ = tipo_y_obligatoria(d.group(3))
            resto = [celda_lectura(x, nombre, cols[k + 1], tipo) for k, x in enumerate(cs[1:])]
            nuevas.append(a + f'<span class="dt">{d.group(1)}</span><span class="m25-tp">{tipo}</span>' + "".join(resto) + c)
        clase = "m25-3" if m.group(1) else "m25-4"
        out.append(cuerpo[pos:i] + ab[:-2] + f' {clase}">' + "".join(nuevas) + ci)
        pos = j
        n += 1
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    print("  tablas de la lectura:", n)
    return cuerpo


def rotulo(cuerpo, i):
    j = cuerpo.rfind('<span class="rt">', 0, i)
    assert j >= 0 and i - j < 4000, cuerpo[max(0, i - 200):i]
    return sin_tags(cuerpo[j:i])


def campos_cerrados(cuerpo):
    """Los demás `ct sel` («Para quién es», la categoría, el tipo del bloque y el cruce con catálogos), en la pieza cerrada (262)."""
    out, pos, n = [], 0, 0
    for m in CT.finditer(cuerpo):
        clase = (m.group(1) or "").strip()
        assert clase != "abierto", cuerpo[m.start():m.start() + 200]
        out.append(cuerpo[pos:m.start()] + b2.campo(m.group(2), vacio=clase == "ph", aria=rotulo(cuerpo, m.start())))
        pos = m.end()
        n += 1
    out.append(cuerpo[pos:])
    print("  piezas cerradas:", n)
    return "".join(out)


# «Cómo viene leyendo»: los dos números en una lectura (138) y la precisión por dato, una tabla que ordena (264).
PREC = re.compile(r'<span class="d25-num"><b>(\d+)</b> documentos en los últimos 30 días · <b>(\d+%)</b> de los datos, sin corregir</span>'
                  r'<span style="color: var\(--t2\);">Sin corregir, por dato</span><div class="d25-prec">(.*?)</div>', re.S)


def precision(m):
    docs, pct, celdas = m.groups()
    pares = re.findall(r"<span>([^<]+)</span><span>(\d+)%</span>", celdas)
    assert len(pares) == 4, celdas
    pares.sort(key=lambda p: (int(p[1]), p[0]))  # de la que más se corrige a la que menos
    lec = ('<div class="m25-lec"><span class="k">Documentos en los últimos 30 días</span>'
           f'<span class="v">{docs}</span><span class="k">Datos sin corregir</span><span class="v">{pct}</span></div>')
    filas = "".join(f'<div class="f" role="row"><span role="cell">{d}</span><span class="nd" role="cell">{p}%</span></div>' for d, p in pares)
    return (lec + '<div class="m25-prec" role="table" aria-label="Sin corregir, por dato"><div class="h" role="row">'
            '<span role="columnheader">Dato</span><span class="nd" role="columnheader" aria-sort="ascending">'
            '<span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">↑</span>Sin corregir</span></div>' + filas + "</div>")


def banda_keb(t):
    """El ⋮ de la banda se llamaba «Acciones de Visita a cliente»: lleva el nombre de lo que se edita."""
    out, pos = [], 0
    for m in re.finditer(r'<div class="w-bnd">', t):
        j = b2.fin_div(t, m.start())
        banda = t[m.start():j]
        h1 = re.search(r"<h1>([^<]+)</h1>", banda).group(1)
        out.append(t[pos:m.start()] + banda.replace('aria-label="Acciones de Visita a cliente"', f'aria-label="Acciones de {h1}"'))
        pos = j
    out.append(t[pos:])
    return "".join(out)


CSS_EDITOR = e14e.CSS_COMPU + """
/* E25 · La lectura: el tipo de cada dato en su columna, sin nada debajo del nombre (263); la pregunta que lo recibe, la validación
   y el cruce con catálogos, en la pieza (262). Los anchos de las columnas ya van con la escala de la compu. */
.d25-lt.m25-4 .h, .d25-lt.m25-4 .f { grid-template-columns: minmax(0, 1fr) 150px minmax(0, 1fr) minmax(0, 1.15fr); }
.d25-lt.m25-3 .h, .d25-lt.m25-3 .f { grid-template-columns: minmax(0, 1fr) 150px minmax(0, 1.3fr); }
.d25-lt .f .m25-tp { color: var(--t1); }
.d25-lt .f .rel { display: flex; align-items: center; gap: 6px; }
.d25-lt .f .b2-env, .d25-box .w-cmp .b2-env { flex: 1; width: 100%; min-width: 0; }
.d25-box:has(.b2-pkl), .d25-l:has(.b2-pkl) { overflow: visible; }
.d25-lt .b2-op .acc-tip { left: 34px; }
/* La plantilla de la biblioteca se lee: sus preguntas, sin la columna de las acciones (263). */
.q-th.m25-ro, .q-it.m25-ro { grid-template-columns: 20px minmax(0, 1fr) 200px 76px; }
/* «Cómo viene leyendo»: los dos números en una lectura (138) y la precisión por dato en una tabla que ordena (264). */
.m25-lec { display: grid; grid-template-columns: max-content minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 3px; font-size: 13px; line-height: 1.35; }
.m25-lec > span { min-width: 0; padding: 6px 12px; border-top: 1px solid var(--borde); overflow-wrap: anywhere; }
.m25-lec > span:nth-child(-n+2) { border-top: 0; }
.m25-lec .k { background: oklch(0.975 0.006 95); color: var(--t2); }
.m25-lec .v { color: var(--t1); font-variant-numeric: tabular-nums; }
.m25-prec { border: 1px solid var(--borde); border-radius: 3px; font-size: 13px; }
.m25-prec .h, .m25-prec .f { display: grid; grid-template-columns: minmax(0, 1fr) 110px; }
.m25-prec .h { background: oklch(0.945 0.027 95); color: var(--t2); font-weight: 600; }
.m25-prec .f { border-top: 1px solid var(--borde); color: var(--t1); }
.m25-prec .h > span, .m25-prec .f > span { min-width: 0; padding: 6px 12px; }
.m25-prec .h > * + *, .m25-prec .f > * + * { box-shadow: inset 1px 0 0 oklch(0.915 0.013 95 / 0.8); }
.m25-prec .nd { text-align: right; font-variant-numeric: tabular-nums; }
/* «Ver los ejemplos»: la flecha del orden, sin el relleno de las celdas. */
.d25-ej .h .b2-fl { padding: 0; }
"""

CSS_ARMAR = CSS_EDITOR + """
/* E25 · Armar con la IA: cada dato de una pregunta en su columna (263), también las del bloque, alineadas con las de afuera; el
   bloque se nota por la línea a la izquierda del nombre. */
.d25-qh, .d25-q { display: grid; grid-template-columns: 20px minmax(0, 1fr) 150px 76px minmax(0, 1fr) 89px; column-gap: 12px; align-items: center; }
.d25-qh { position: relative; min-height: 40px; padding: 0 8px 0 16px; background: oklch(0.975 0.006 95); color: var(--t2); font-size: 13px; font-weight: 600; }
.d25-qh > span { min-width: 0; white-space: nowrap; }
.d25-qh .der { text-align: right; }
.d25-q { position: relative; padding: 10px 8px 10px 16px; }
.d25-q.sub { padding-left: 16px; }
.d25-q .q-tp, .d25-q .q-ob, .d25-q .leido { min-width: 0; color: var(--t1); font-size: 13px; line-height: 1.35; overflow-wrap: anywhere; }
.d25-q .q-acc2 { justify-self: end; }
.d25-qh > * + *::after, .d25-q > * + *::after { content: ""; position: absolute; top: 0; bottom: 0; width: 1px; margin-left: -6px; background: oklch(0.915 0.013 95 / 0.8); pointer-events: none; }
.d25-qh > * + *::after { background: oklch(0.89 0.031 95); }
/* El documento a la vista: su nombre, cuándo llegó y quién lo mandó, en una lectura (138 y 206). */
.d25-docs .m25-lec { margin-top: 4px; }
"""


def editor(nombre, solo_lectura=False):
    """`FRM-Editor-Lectura`, `Plat-FRM-Plantilla-Lectura` y `FRM-Plantilla-25`."""
    print(nombre)
    t, nl = leer(nombre)
    t = con_css(t, CSS_EDITOR)
    cab, cuerpo, guion = e14e.partir(t)
    cuerpo = filas_preguntas(cuerpo, solo_lectura)
    cuerpo = tablas_lectura(cuerpo)
    cuerpo = campos_cerrados(cuerpo)
    cuerpo, n = PREC.subn(precision, cuerpo)
    print("  precisión:", n)
    cuerpo = cuerpo.replace("</b> · versión 1 de la biblioteca</span>", "</b>, versión 1 de la biblioteca</span>")
    cuerpo, n = re.subn(r'(<div class="d25-ej"><div class="h">)<span>Fecha</span>',
                        r'\1<span aria-sort="descending">Fecha<span class="b2-fl" aria-hidden="true">↓</span></span>', cuerpo)
    print("  ejemplos:", n)
    cuerpo = banda_keb(cuerpo)
    assert "q-catmn" not in cuerpo and 'class="ct sel' not in cuerpo and " · versión 1 de la biblioteca" not in cuerpo
    assert "<small>" not in re.sub(r"<style\b.*?</style>", "", cuerpo, flags=re.S)
    assert "Acciones de Visita a cliente" not in cuerpo
    escribir(nombre, cab + cuerpo + guion, nl)


# ---------------------------------------------------------------------------------------------------------------- armar con la IA
CAPTION = re.compile(r'<span class="dt">([^<·]+?) · ([^<·]+?) · (\d{2}/\d{2}/\d{4}, \d{2}:\d{2})</span>')


def armar():
    print("FRM-Armar-Con-IA")
    t, nl = leer("FRM-Armar-Con-IA")
    t = con_css(t, CSS_ARMAR)
    cab, cuerpo, guion = e14e.partir(t)
    cuerpo = filas_preguntas(cuerpo)
    cuerpo = campos_cerrados(cuerpo)
    cuerpo, n = CAPTION.subn(lambda m: ('<div class="m25-lec"><span class="k">Documento</span>'
                                         f'<span class="v">{m.group(1)}</span><span class="k">Llegó</span><span class="v">{m.group(3)}</span>'
                                         f'<span class="k">Mandó</span><span class="v">{m.group(2)}</span></div>'), cuerpo)
    print("  el documento a la vista:", n)
    assert n == 4, n
    escribir("FRM-Armar-Con-IA", cab + cuerpo + guion, nl)


# ---------------------------------------------------------------------------------------------------------------- Formularios
CFG25 = dict(e21.ETAPAS["21"], compu="FRM-Formularios-25", tel=None)
EST25 = list(e21.EST21)
EST25.insert(next(i for i, e in enumerate(EST25) if e[0] == "Dados de baja") + 1, ("Nuevo formulario: menú", "T_def", None, {"menuNuevo": True}))


def vals25(estado, bloque, menu, x):
    v = e21.vals(CFG25, estado, bloque, menu, x)
    v["menuNuevo"] = bool(x.get("menuNuevo"))
    v["expNuevo"] = "true" if x.get("menuNuevo") else "false"
    return v


def formularios():
    """La lista de `FRM-Formularios-21` redibujado, con «Armar con la IA» y el menú de «Nuevo formulario» de la E25."""
    print("FRM-Formularios-25")
    t, nl = leer("FRM-Formularios-25")
    t = con_css(t, e21.CSS_COMPU)
    i = t.index('<div class="w-body">')
    j = b2.fin_div(t, i)
    sin_permiso = re.search(r'<sc-if value="\{\{sinPermiso\}\}".*?</sc-if>', t[i:j], re.S).group(0)
    usados = sorted({m for _, _, m, _ in EST25 if m})
    t = t[:i] + e21.cuerpo_compu(CFG25, usados).replace("@SIN_PERMISO@", sin_permiso) + t[j:]
    nombres = [e for e, _, _, _ in EST25]
    D = {e: vals25(e, b, m, x) for e, b, m, x in EST25}
    t = props(t, lambda p: p["estado"].update(options=nombres, default="Activos"))
    t = e21.nuevo_guion(t, e21.guion_compu(nombres, D, "Activos"))
    faltan = set(re.findall(r"\{\{(\w+)\}\}", t)) - set(D["Activos"]) - {"si", "no"}
    assert not faltan, faltan
    assert "▲" not in t and 'class="cb cb-sec cb-ch"' not in t and "En WhatsApp" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    escribir("FRM-Formularios-25", t, nl)


# ---------------------------------------------------------------------------------------------------------------- Catálogos
CAT_COLS = e14l.CAT_COLS
ORDEN_CATALOGO, ORDEN_USAN = e14l.ORDEN_CATALOGO, e14l.ORDEN_USAN
POR_NOMBRE = ["Clientes", "Depósitos", "Motivos de visita", "Productos", "Proveedores", "Proveedores de obra", "Recargo por zona",
              "Responsables de obra", "Supervisores", "Supervisores de Delta Norte"]
# Por «Lo usan»: de mayor a menor, los empates por nombre y lo vacío («—») al final, también por nombre (264).
POR_USAN = ["Productos", "Clientes", "Motivos de visita", "Proveedores", "Supervisores", "Depósitos", "Proveedores de obra",
            "Recargo por zona", "Responsables de obra", "Supervisores de Delta Norte"]
PROPUESTAS = {"Proveedores de obra": "verPropMano", "Supervisores de Delta Norte": "verPropMiembros"}


def catalogos():
    print("FRM-Catalogos-25")
    t, nl = leer("FRM-Catalogos-25")
    t = con_css(t, e14l.CSS_CATALOGOS)
    t, n = re.subn(r'<span class="d25-prop">Propuesta del asistente</span>', "", t)
    assert n == 2, n
    t = e14l.barra(t, CAT_COLS, "De la A a la Z",
                   [("ori", ["Todos los orígenes", "Escritas a mano", "De los miembros", "De los contactos de WhatsApp"], None),
                    ("est", ["Todos los estados", "Por aprobar", "Activos", "Dados de baja"], None)])

    # El encabezado: por nombre, la flecha después de «Catálogo»; por «Lo usan», después de «Lo usan» (264).
    i = t.index('<div class="w-th k14">')
    j = b2.fin_div(t, i)
    assert '<span class="ord" aria-hidden="true">▲</span>' in t[i:j]
    t = (t[:i] + f'<sc-if value="{V("porNombre")}" hint-placeholder-val="{V("si")}">{e14l.encabezado("k14", CAT_COLS, "Catálogo", "ascending")}</sc-if>'
         f'<sc-if value="{V("porUsan")}" hint-placeholder-val="{V("no")}">{e14l.encabezado("k14", CAT_COLS, "Lo usan", "descending")}</sc-if>' + t[j:])

    # Las filas: por nombre, de la A a la Z, como dice la flecha; las dos propuestas, con su filtro de origen y el de «Por aprobar».
    i = t.index('<sc-if value="{{conFilas}}"')
    j = fin_sc_if(t, i)
    cuerpo = t[i:j]
    bloques, filas = {}, {}
    for m in re.finditer(r'<sc-if value="\{\{(ver\w+)\}\}" hint-placeholder-val="\{\{si\}\}">(<div class="w-tr k14">.*?)</sc-if>', cuerpo, re.S):
        nombre = re.search(r'<a href="[^"]+">([^<]+)</a>', m.group(2)).group(1)
        var = PROPUESTAS.get(nombre, m.group(1))
        bloques[nombre] = f'<sc-if value="{V(var)}" hint-placeholder-val="{V("si")}">{m.group(2)}</sc-if>'
        filas[nombre] = m.group(2)
    assert sorted(bloques) == sorted(POR_NOMBRE), list(bloques)
    abre = cuerpo[:cuerpo.index(">") + 1]
    pie = re.search(r'<div class="w-pie">.*?</div>', cuerpo, re.S).group(0)
    t = t[:i] + abre + "".join(bloques[n] for n in POR_NOMBRE) + pie + "</sc-if>" + t[j:]
    j = fin_sc_if(t, i)
    t = t[:j] + (f'<sc-if value="{V("porUsan")}" hint-placeholder-val="{V("no")}">' + "".join(filas[n] for n in POR_USAN)
                 + pie.replace("{{rango}}", "1–10 de 10") + "</sc-if>") + t[j:]

    # Los estados y sus valores.
    t = props(t, lambda p: p["estado"]["options"].extend(["Ordenar por abierto", "Ordenado por Lo usan", "Estado: Por aprobar"]))
    t = una(t, "const lista = ['Todos', 'Filtro abierto', 'Filtro de estado', 'Escritas a mano', 'De los miembros', 'De los contactos'].includes(f);",
            "const lista = ['Todos', 'Filtro abierto', 'Filtro de estado', 'Escritas a mano', 'De los miembros', 'De los contactos', 'Ordenar por abierto', 'Estado: Por aprobar'].includes(f);\n"
            "    const porUsan = f === 'Ordenado por Lo usan', ordMenu = f === 'Ordenar por abierto', porAprobar = f === 'Estado: Por aprobar';")
    t = una(t, "'10 catálogos · 7 activos'", "'10 catálogos'")
    t = una(t, "oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriAlternar: () => {},",
            "oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriExp: f === 'Filtro abierto' ? 'true' : 'false',")
    t = una(t, "      oriC_t: '8', oriC_m: '5', oriC_b: '2', oriC_c: '1', oriElegir_t: () => {}, oriElegir_m: () => {}, oriElegir_b: () => {}, oriElegir_c: () => {},\n", "")
    t = una(t, "estTexto: 'Estado', estClase: '', estMenu: f === 'Filtro de estado', estAlternar: () => {}, estOn_t: 'on', estOn_a: '', estOn_d: '',",
            "estTexto: porAprobar ? 'Estado: Por aprobar' : 'Estado', estClase: porAprobar ? 'con' : '', estMenu: f === 'Filtro de estado', "
            "estExp: f === 'Filtro de estado' ? 'true' : 'false',")
    t = una(t, "      estC_t: '8', estC_a: '7', estC_d: '1', estElegir_t: () => {}, estElegir_a: () => {}, estElegir_d: () => {},\n", "")
    t = una(t, "      oriOn_t: elegido ? '' : 'on', oriOn_m: mano ? 'on' : '', oriOn_b: miembros ? 'on' : '', oriOn_c: contactos ? 'on' : '',\n", "")
    t = una(t, "hayFiltro: elegido || f === 'Sin coincidencias',", "hayFiltro: elegido || porAprobar || f === 'Sin coincidencias',")
    t = una(t, "conFilas: lista, verMano: !miembros && !contactos, verMiembros: !mano && !contactos, verContactos: !mano && !miembros,",
            "conFilas: lista && !porUsan, porUsan, porNombre: !porUsan, ordMenu, ordExp: ordMenu ? 'true' : 'false',\n"
            f"      ordTexto: porUsan ? '{ORDEN_USAN}' : '{ORDEN_CATALOGO}',\n"
            "      verMano: !miembros && !contactos && !porAprobar, verMiembros: !mano && !contactos && !porAprobar, verContactos: !mano && !miembros && !porAprobar,\n"
            "      verPropMano: !miembros && !contactos, verPropMiembros: !mano && !contactos,")
    t = una(t, "rango: mano ? '1–5 de 5' : miembros ? '1–2 de 2' : contactos ? '1 de 1' : '1–10 de 10',",
            "rango: mano ? '1–6 de 6' : miembros ? '1–3 de 3' : contactos ? '1 de 1' : porAprobar ? '1–2 de 2' : '1–10 de 10',")
    assert "▲" not in t and "{{oriC_" not in t and "{{estC_" not in t and "{{total}}" not in t and "d25-prop\">" not in t
    escribir("FRM-Catalogos-25", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
CSS_TEL = e14e.CSS_TEL + """
/* E25 · Cada dato que lee, una tarjeta (263): su nombre, la pregunta que lo recibe en la pieza (262) y la validación fija con su
   nombre; la del candado dice por qué en un tooltip que abre el toque (211). */
.ap-cuerpo .b2-tj { flex-shrink: 0; }
.b2-tj.m25-tj { padding: 12px 16px; }
.m25-tj .m25-cmp { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; }
.m25-tj .m25-cmp > .k { display: inline-flex; align-items: center; color: var(--t2); font-size: 12.5px; line-height: 1.3; }
.m25-tj .m25-cmp .b2-env { width: 100%; }
.m25-tj .b2-i .acc-tip { left: -60px; }
.m25-fija { position: relative; display: inline-flex; align-items: flex-start; gap: 6px; }
.m25-fija > svg { flex: none; margin-top: 3px; color: var(--t2); }
.m25-fija .acc-tip { left: -4px; }
/* Las preguntas del bloque, con la línea a la izquierda, como en la compu. */
.q-tj.m25-sub { padding-left: 30px; background: oklch(0.985 0.004 95); }
.q-tj.m25-sub .num { visibility: hidden; }
.q-tj.m25-sub .nm { border-left: 2px solid var(--borde2); padding-left: 10px; }
.q-tj.m25-sub .dl { padding-left: 12px; }
.t23-gtit .b2-i { margin-left: 6px; margin-right: auto; }
.t23-gtit .b2-i .acc-tip { left: -150px; max-width: 300px; }
.t23-gtit .b2-i .acc-tip::after { left: 154px; }
"""
FIJA = "Viene de la plantilla: no se apaga ni depende de la IA."
RENOMBRADA = "Le cambiaste el nombre a la pregunta: sigue recibiendo «{}»."
SEGURO = ("Carga sin preguntar, a nombre de quien mandó el documento, solo con tres señales: lo reconoció sin duda, las validaciones dan "
          "bien y no está repetido, y las últimas 20 cargas de este formulario se confirmaron sin correcciones. Nunca usa la seguridad que "
          "dice la IA.")
FILA_TEL = re.compile(r'<div class="ap-fila( t25-sub-q)?"><div class="tx"><span class="l1">([^<]*)</span><span class="l2">(.*?)</span></div></div>',
                      re.S)


def tarjeta_pregunta(num, nombre, tipo, ob, sub=False):
    """La tarjeta de una pregunta de `M-FRM-Editor` (263), sin acciones: el número, el nombre, «Tipo» y «Obligatoria»."""
    dl = (f'<span class="dl"><span class="c"><span class="k">Tipo</span><span class="v">{tipo}</span></span>'
          f'<span class="c"><span class="k">Obligatoria</span><span class="v">{ob}</span></span></span>')
    return f'<div class="b2-tj q-tj{" m25-sub" if sub else ""}"><span class="num">{num}</span><span class="nm">{nombre}</span>{dl}</div>'


def tarjetas_preguntas(cuerpo, datos):
    """Las filas «1. Nombre» con su tipo debajo, como tarjetas con «Tipo» y «Obligatoria» (263); el bloque, con las suyas."""
    n = 0

    def cambio(m):
        nonlocal n
        sub, l1, l2 = m.groups()
        q = re.fullmatch(r"(\d+)\. (.+)", l1)
        if not q and not sub:
            return m.group(0)
        num, nombre = (q.group(1), q.group(2)) if q else ("", l1)
        tipo, ob = datos[nombre]
        n += 1
        return tarjeta_pregunta(num, nombre, tipo, ob, sub=bool(sub))
    cuerpo = FILA_TEL.sub(cambio, cuerpo)
    print("  tarjetas de preguntas:", n)
    return cuerpo


def fija(valor, candado, abierta=False):
    tip = b2.tip(FIJA) if abierta else ""
    return f'<span class="m25-fija" tabindex="0" aria-label="{valor}. {FIJA}">{candado}{valor}{tip}</span>'


def tarjeta_dato(dato, preg=None, val=None, propia=False, candado="", abierta=False):
    """Un dato que lee, como tarjeta (263): con `preg`, la pregunta que lo recibe en la pieza (262); la validación fija con su nombre,
    con candado si la trae la plantilla, o en la pieza en un formulario propio."""
    partes = ""
    if preg is not None:
        info = b2.info(RENOMBRADA.format(dato)) if preg != dato and not propia else ""
        partes += (f'<div class="m25-cmp"><span class="k">Pregunta que lo recibe{info}</span>'
                   f'{b2.campo(preg, aria=f"Pregunta que recibe «{dato}»")}</div>')
    if propia:
        partes += (f'<div class="m25-cmp"><span class="k">Validación fija</span>'
                   f'{b2.campo(val or "Ninguna", vacio=not val, aria=f"Validación fija de «{dato}»")}</div>')
    else:
        v = fija(val, candado, abierta) if val else b2.NADA_T
        partes += f'<span class="dl"><span class="c todo"><span class="k">Validación fija</span><span class="v">{v}</span></span></span>'
    return f'<div class="b2-tj m25-tj"><span class="nm">{dato}</span>{partes}</div>'


def l2_partes(l2):
    """De «Pregunta · <candado> Validación», «Pregunta · sin validación fija» o «<candado> Validación»: (pregunta, validación, candado)."""
    candado = re.search(SVG, l2, re.S)
    texto = re.sub(SVG, "", l2, flags=re.S)
    if " · " in texto:
        preg, val = (x.strip() for x in texto.split(" · ", 1))
    else:
        preg, val = None, texto.strip()
    if val.lower() == "sin validación fija":
        val = None
    return preg, val, candado.group(0) if candado else ""


def desplazada(bloque, tarjetas):
    """La lectura del teléfono vista más abajo, como si se hubiera desplazado (no entra en 844 de alto): sin lo de arriba de los datos
    y, con `tarjetas`, sin el título de los datos ni esa cantidad de tarjetas, para que se vea lo que el estado abre."""
    i = bloque.index('<div class="ap-cuerpo">') + len('<div class="ap-cuerpo">')
    assert bloque.startswith('<div class="t25-rev"', i)
    bloque = bloque[:i] + bloque[b2.fin_div(bloque, i):]
    if tarjetas:
        bloque, n = re.subn(r'<div class="t23-gtit"(?: style="[^"]*")?>Qué pregunta recibe cada dato</div>', "", bloque)
        assert n == 1, n
        for _ in range(tarjetas):
            assert bloque.startswith('<div class="b2-tj m25-tj">', i)
            bloque = bloque[:i] + bloque[b2.fin_div(bloque, i):]
    return bloque


def editor_tel():
    print("M-FRM-Editor-Lectura")
    t, nl = leer("M-FRM-Editor-Lectura")
    t = con_css(t, CSS_TEL)
    lista_k = e14e.estados(t)
    propio = {f"s{lista_k.index('Lo escribió la IA')}"}
    s_fija, s_seguro = f"s{lista_k.index('Una validación fija')}", f"s{lista_k.index('Cargar solo si es seguro')}"

    def cuerpo_de(var, bloque):
        def fila(m):
            sub, l1, l2 = m.groups()
            preg, val, candado = l2_partes(l2)
            return tarjeta_dato(l1, preg, val, propia=var in propio, candado=candado, abierta=var == s_fija and l1 == "Cuenta de origen")
        bloque = FILA_TEL.sub(fila, bloque)
        bloque = bloque.replace("</b> · versión 1</span>", "</b>, versión 1</span>").replace("» · versión 1</span>", "», versión 1</span>")
        info = b2.info(SEGURO, abierto=var == s_seguro)
        bloque = bloque.replace('<div class="t23-gtit">Cargar solo si es seguro</div>', f'<div class="t23-gtit">Cargar solo si es seguro{info}</div>')
        if var in (s_fija, s_seguro):
            bloque = desplazada(bloque, 6 if var == s_seguro else 0)
        return bloque

    # Los cuerpos de cada estado, y la hoja chica de «Una validación fija», que pasa al tooltip (211).
    raya = t.index('<span class="ap-raya"></span>')
    out, pos = [], 0
    for m in re.finditer(r'<sc-if value="\{\{(s\d+)\}\}"', t[:raya]):
        if m.start() < pos:
            continue
        j = fin_sc_if(t, m.start())
        out.append(t[pos:m.start()] + cuerpo_de(m.group(1), t[m.start():j]))
        pos = j
    out.append(t[pos:])
    t = "".join(out)
    raya = t.index('<span class="ap-raya"></span>')
    k = t.index(f'<sc-if value="{V(s_fija)}"', raya)
    t = t[:k] + t[fin_sc_if(t, k):]
    assert "ap-hoja" not in t[raya:] and "ap-fila" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    assert "· versión 1<" not in t and "Viene de" in t

    # Estado nuevo: «Elegir la pregunta», la pieza a pantalla completa (262), sobre la lectura de siempre.
    t, sv = sumar_estados(t, [("Lectura de documentos", "Elegir la pregunta")])
    nuevo = sv["Elegir la pregunta"]
    a, b = sc_ifs(t, "s0")[0]
    copia = e14e.renombrar(t[a:b], "s0", nuevo)
    raya = t.index('<span class="ap-raya"></span>')
    t = t[:raya] + copia + t[raya:]
    pieza = b2.pk_tel("Pregunta que recibe «Titular de origen»", [("Ninguna", "No se lee", False, None),
                                                                ("Quién transfirió", None, True, None, True), ("Concepto", None, False, None)])
    fin = t.rindex("</div>\n</x-dc>")
    t = t[:fin] + f'<sc-if value="{V(nuevo)}" hint-placeholder-val="{V("no")}">{pieza}</sc-if>' + t[fin:]
    escribir("M-FRM-Editor-Lectura", t, nl)


def plantilla_tel(datos):
    print("M-FRM-Plantilla-25")
    t, nl = leer("M-FRM-Plantilla-25")
    t = con_css(t, CSS_TEL)
    t = una(t, '<div class="t25-sub">Pagos y cobros · versión 1 · Empleados y clientes</div>',
            b2.grupo_tel("La plantilla", [("Categoría", "Pagos y cobros"), ("Versión", "1"), ("Para quién es", "Empleados y clientes")]))
    t = tarjetas_preguntas(t, datos)
    t, n = FILA_TEL.subn(lambda m: tarjeta_dato(m.group(2), None, *l2_partes(m.group(3))[1:]), t)
    print("  tarjetas de lo que lee:", n)
    assert "ap-fila" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    escribir("M-FRM-Plantilla-25", t, nl)


def armar_tel(datos):
    print("M-FRM-Armar-Con-IA")
    t, nl = leer("M-FRM-Armar-Con-IA")
    t = con_css(t, CSS_TEL)
    t, n = re.subn(r"Propuesta de la IA · desde 3 documentos", "Propuesta de la IA desde 3 documentos", t)
    assert n == 2, n
    t = tarjetas_preguntas(t, datos)
    assert "ap-fila" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    escribir("M-FRM-Armar-Con-IA", t, nl)


# ---------------------------------------------------------------------------------------------------------------- todo
def main():
    hechos = [n for n in COMPU + TEL if MARCA in leer(n)[0]]
    if hechos:
        print("ya tienen el bloque, no hace nada:", ", ".join(hechos))
        return
    datos_plantilla = datos_de(leer("FRM-Plantilla-25")[0], "q-it")
    datos_armar = datos_de(leer("FRM-Armar-Con-IA")[0], "d25-q")
    editor("FRM-Editor-Lectura")
    editor("Plat-FRM-Plantilla-Lectura")
    editor("FRM-Plantilla-25", solo_lectura=True)
    armar()
    formularios()
    catalogos()
    editor_tel()
    plantilla_tel(datos_plantilla)
    armar_tel(datos_armar)
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(COMPU + TEL)], check=True)


if __name__ == "__main__":
    main()
