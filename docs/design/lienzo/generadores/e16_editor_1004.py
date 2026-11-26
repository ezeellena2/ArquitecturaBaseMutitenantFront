"""La E16 (Datos de las personas) con el traspaso 18, tanda 3A (2026-11-26): el editor, el catálogo y Publicar, en `FRM-Editor-16`,
`M-FRM-Editor-16`, `FRM-Catalogo-16`, `M-FRM-Catalogo-16` y `FRM-Publicar-16`, redibujados en su lugar con la forma que la E13 y la E14
dejaron en `FRM-Editor`, `FRM-Catalogo-13` y `FRM-Catalogo-Campos` (`e14_editor_1004.py`, `e13_catalogo_1004.py` y
`e13_modales_1004.py`), más lo propio de la E16 (spec `docs/plans/formularios/16-datos-de-las-personas.md`):

- `FRM-Editor-16`: **las preguntas en columnas (263)**, como `FRM-Editor`: el número, el nombre, el tipo (con «varias, hasta N») y
  «Obligatoria», cada uno en su columna con su encabezado, y ↑ ↓ ✎ 🗑 a la vista (127). **Lo que se elige, en la pieza (262):** «Para
  quién es», el tipo de respuesta, el catálogo, el campo, el dato de la persona y el valor fijo de cada filtro, y la persona de «Como si
  lo recibiera», que cerrada dice solo el nombre («Juan Gómez»): su zona se lee debajo, en dos columnas (138). En «Solo lectura» las
  filas llevan el ojo de «Ver pregunta», sin «Agregar título» ni «Agregar pregunta», como en `FRM-Editor`, y las piezas que no se
  cambian van apagadas, salvo «Como si lo recibiera», que no guarda. Estados nuevos: «Elegir el dato de la persona» (la pieza
  abierta, con «Sucursal» apagada porque es un texto y no elige de «Zonas», con su motivo), «Elegir la persona» (la lista del servidor,
  con el buscador adentro, la cantidad y la zona de cada persona en gris) y «Sin permiso para cargar los datos» (sin el enlace, que
  aparece solo con `formpersondata.manage` y `users.manage`, 269). «Qué viaja a WhatsApp» no está abierto en ningún estado de la E16:
  «En WhatsApp» va plegado, con lo configurado en su banda (145), como en `FRM-Editor`;
- `M-FRM-Editor-16`: «Las preguntas», cada pregunta una tarjeta con «Tipo» y «Obligatoria» nombrados (263), como `M-FRM-Editor`. Cada
  filtro deja la fila con «Según quien lo recibe · Zona» debajo del nombre y va en su recuadro, con «Campo» y «Dato de la persona» en
  la pieza y la ✕ (la spec: «Cada filtro va en su recuadro»; 262 y 263). «Como si lo recibiera» en la pieza, y «2 personas sin Zona»
  suma «Cargar los datos», como en la compu. Estados nuevos: «Elegir la persona» (la pieza a pantalla completa) y «Sin permiso para
  cargar los datos»;
- `FRM-Catalogo-16`: el modal de campos con la forma de `FRM-Catalogo-Campos`: en la lista, el número, el nombre, «Nuevo», **el tipo y
  el papel, cada uno en su columna** (263); el tipo, el catálogo y **«Papel», en la pieza** (262), con «Dato» y «Filtro» y la ayuda en
  la (i); un papel que no se puede cambiar, con el motivo debajo; en «Solo lectura», el catálogo en su renglón. Detrás, el catálogo de
  `FRM-Catalogo-13` («Campos»): lo que se hace con una opción en su ⋮ (261), «Columnas» y «En WhatsApp» en la pieza. Estado nuevo:
  «Elegir el papel»;
- `M-FRM-Catalogo-16`: cada campo, una tarjeta con «Tipo» y «Papel» nombrados (263) y la cantidad en el título de la lista; el tipo, el
  catálogo y el papel en la pieza, y elegir el tipo o el catálogo a pantalla completa en lugar de la hoja (262), como
  `M-FRM-Catalogo-Campos`. Un campo nuevo suma «Papel» («Dato», el de las respuestas viejas) y nace opcional, con el motivo de
  «Obligatorio» apagado en su tooltip (211). Estado nuevo: «Elegir el papel»;
- `FRM-Publicar-16`: el editor de atrás con la forma de `FRM-Editor-16` redibujado: las preguntas en columnas y «Para quién es» en la
  pieza. El diálogo no cambia.

Escribe las medidas de antes de la escala en un bloque `<style data-e16="t3">`, que lo frena si ya está, y al final corre
`traspaso10_piezas_1004.py --tableros` con los cinco, que pone la escala de la compu. Para volver a correrlo, primero se restauran los
cinco (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
"""
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e13_catalogo_1004 as e13c  # noqa: E402
import e13_modales_1004 as e13m  # noqa: E402
import e14_editor_1004 as e14e  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-e16="t3"'
SUFIJO = " · para aprobar"
TABLEROS = ["FRM-Editor-16", "M-FRM-Editor-16", "FRM-Catalogo-16", "M-FRM-Catalogo-16", "FRM-Publicar-16"]
SVG1 = r"<svg\b[^>]*>(?:(?!</svg>).)*</svg>"  # un solo ícono: nunca cruza su `</svg>`

leer, escribir, cierre, sc_ifs, renombrar, una, partir = (e14e.leer, e14e.escribir, e14e.cierre, e14e.sc_ifs, e14e.renombrar, e14e.una,
                                                          e14e.partir)

# ---------------------------------------------------------------------------------------------------------------- los datos
# Las personas de la organización, con su «Zona» (los de `FRM-Datos-Personas`): la lista de «Como si lo recibiera» viene del servidor.
PERSONAS = [("Juan Gómez", "Centro"), ("Lucía Fernández", "Centro"), ("Martín Paz", "Sur"), ("Paula Méndez", "Norte"),
            ("Sofía Herrera", "Sin Zona"), ("Tomás Acosta", "Sin Zona")]
# Los datos de las personas: «Sucursal» es un texto, así que no sirve para un filtro según quien lo recibe sobre «Zonas» (spec y plan, 4).
DATOS = [("Zona", None), ("Sucursal", "No elige de «Zonas».")]
SOLO_VER = "Solo podés ver este formulario."
CARGAR = '2 personas sin Zona · <a href="FRM-Datos-Personas.dc.html">Cargar los datos</a>'
CARGAR_TEL = '2 personas sin Zona · <a href="M-FRM-Datos-Personas.dc.html">Cargar los datos</a>'
PAPELES = ["Dato", "Filtro"]  # en el orden de la spec («con «Dato» y «Filtro»»)
PAPEL_AYUDA = ("Filtro: decide qué opciones ve cada persona, o arma un filtro fijo de una pregunta. Dato: se muestra con la opción "
               "elegida. Los dos se guardan con la respuesta.")

# ---------------------------------------------------------------------------------------------------------------- estilos
CSS_EDITOR = e14e.CSS_COMPU + """
/* E16 · La pieza en cada filtro y en «Como si lo recibiera» (262): del ancho de su campo; abierta, encima de lo que sigue. */
.q-cond .w-cmp { position: relative; min-width: 0; }
.q-cond:has(.b2-pkl), .q-zona .zb > .w-cmp:has(.b2-pkl) { position: relative; z-index: 6; }
"""
CSS_EDITOR_TEL = e14e.CSS_TEL + """
/* E16 · Cada filtro en su recuadro (spec, 262 y 263): «Según quien lo recibe» o «Filtro fijo» con su ✕; adentro, cada dato en la pieza. */
.t16-cond { display: flex; flex-direction: column; gap: 10px; padding: 2px 12px 12px; border: 1px solid var(--borde); border-radius: 10px; background: #fff; }
.t16-cond .cab { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; font-size: 13.5px; font-weight: 600; color: var(--t2); }
.t16-cond .cab .ap-ib { margin-right: -10px; }
.t16-cond.ro { padding-top: 10px; }
.t16-cond.ro .cab { min-height: 0; }
.t16 .t-lin2 a { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
"""
CSS_CATALOGO = e13c.CSS_COMPU + e13m.CSS_CAMPOS + """
/* E16 · La lista del modal de campos suma «Papel» en su columna, después del tipo (263): la lista se ensancha para que el nombre
   conserve su lugar. */
.w-dlg.md .db { grid-template-columns: 420px minmax(0, 1fr); }
.md-it.e16c { grid-template-columns: 20px minmax(0, 1fr) 44px 104px 44px 42px; }
.md-it.e16c .pp { white-space: nowrap; }
.md-f .ctl .b2-env { width: 100%; }
"""
CSS_CATALOGO_TEL = e13m.CSS_CAMPOS_TEL + """
/* E16 · La (i) de «Papel», junto al nombre del campo (211: se abre con un toque). */
.ap-cmp .rt .b2-i { margin-left: 6px; }
"""


# ---------------------------------------------------------------------------------------------------------------- utilidades
def con_css(t, css):
    assert MARCA not in t, "ya tiene el bloque de la E16: restauralo antes de volver a correr"
    t = re.sub(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1)}{SUFIJO}</title>" if not m.group(1).endswith(SUFIJO)
               else m.group(0), t, count=1)
    return una(t, "</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


def s_de(t, nombre):
    return e14e.s_de(t, nombre)


def adentro(bloque):
    """El contenido de un `sc-if` entero."""
    assert bloque.startswith("<sc-if") and bloque.endswith("</sc-if>")
    return bloque[bloque.index(">") + 1:-len("</sc-if>")]


def en_rango(t, a, b, cambio):
    nuevo = cambio(t[a:b])
    return t[:a] + nuevo + t[b:]


def lista_personas():
    return b2.lista([b2.op(n, z, elegida=n == "Juan Gómez", activa=n == "Juan Gómez") for n, z in PERSONAS], buscar="",
                    cantidad=f"{len(PERSONAS)} personas")


def lista_datos():
    return b2.lista([b2.op(n, elegida=n == "Zona", activa=n == "Zona", apagada=mot, tip_abierto=True) for n, mot in DATOS])


# ---------------------------------------------------------------------------------------------------------------- el editor
ROTULO = re.compile(r'<span class="rt">(?P<rot>[^<]+?)(?: <span class="req">\*</span>)?(?:<span class="f-i"[^>]*>' + SVG1 + r'</span>)?</span>'
                    r'(?P<ct><div class="ct sel(?P<mal> mal)?">(?P<v>[^<]*)(?:' + SVG1 + r')?</div>)', re.S)


def piezas(cuerpo, lectura=False):
    """Cada `ct sel` con su rótulo pasa a la pieza cerrada (262). En lectura, apagada, salvo «Como si lo recibiera», que no guarda."""
    cuenta = {}

    def cambio(m):
        rot, v = m.group("rot"), m.group("v")
        if rot == "Como si lo recibiera":
            v = v.split(" · ")[0]  # la zona se lee debajo, en dos columnas (138)
        apagado = SOLO_VER if lectura and rot != "Como si lo recibiera" else None
        cuenta[rot] = cuenta.get(rot, 0) + 1
        return (m.group(0)[:m.start("ct") - m.start()]
                + b2.campo(v, error=bool(m.group("mal")), aria=rot, apagado=apagado, tip_abierto=False))
    cuerpo = ROTULO.sub(cambio, cuerpo)
    return cuerpo, cuenta


def lectura_filas(bloque, ojo):
    """«Solo lectura» como en `FRM-Editor`: sin «Agregar título» ni «Agregar pregunta», y cada pregunta con el ojo de «Ver pregunta»."""
    bloque, n = re.subn(r'(<div class="f-cab"><span>Preguntas</span><span class="der">)(?:(?!</span></div>).)*(</span></div>)',
                        r"\1\2", bloque, flags=re.S)
    assert n == 1, n
    out, pos = [], 0
    for m in re.finditer(r'<div class="q-it( q-tit)?"><span class="num">\d*</span><span class="dato"><b>([^<]*)</b>', bloque):
        i = bloque.index('<span class="q-acc2">', m.end())
        j = cierre(bloque, i, "span")
        nuevo = ('<span class="ib" aria-hidden="true"></span>' if m.group(1)
                 else f'<a class="ib" aria-label="Ver pregunta {m.group(2)}" href="#">{ojo}</a>')
        out.append(bloque[pos:i] + f'<span class="q-acc2">{nuevo}</span>')
        pos = j
    out.append(bloque[pos:])
    return "".join(out)


def frm_editor_16():
    t, nl = leer("FRM-Editor-16")
    ojo = re.search(r'aria-label="Ver pregunta Cliente" href="#">(<svg.*?</svg>)</a>', leer("FRM-Editor")[0], re.S).group(1)
    t = con_css(t, CSS_EDITOR)
    cab, cuerpo, guion = partir(t)
    s7 = s_de(t, "Solo lectura")

    # «Solo lectura»: el ojo en cada pregunta y sin los botones de agregar, antes de pasar las filas a columnas.
    a, b = sc_ifs(cuerpo, s7)[1]
    cuerpo = en_rango(cuerpo, a, b, lambda x: lectura_filas(x, ojo))

    # Las preguntas en columnas (263), con su encabezado.
    cuerpo = e14e.filas_compu(cuerpo)
    assert not re.search(r'<span class="dato"><b>[^<]*</b><span>', cuerpo)

    # Lo que se elige, en la pieza (262): primero «Solo lectura», apagado; después lo demás.
    a, b = sc_ifs(cuerpo, s7)[1]
    lect, c1 = piezas(cuerpo[a:b], lectura=True)
    cuerpo = cuerpo[:a] + lect + cuerpo[b:]
    cuerpo, c2 = piezas(cuerpo)
    assert 'class="ct sel' not in cuerpo, cuerpo[cuerpo.index('class="ct sel') - 300:cuerpo.index('class="ct sel') + 100]
    print("piezas de FRM-Editor-16:", c1, c2)
    t = cab + cuerpo + guion

    # Tres estados nuevos, sacados de «Qué opciones ve cada persona».
    s1, s9 = s_de(t, "Qué opciones ve cada persona"), s_de(t, "Una opción apagada")
    t, sv = e14e.sumar_estados(t, [("Agregar filtro", "Elegir el dato de la persona"), ("Con un filtro fijo", "Elegir la persona"),
                                   ("Solo lectura", "Sin permiso para cargar los datos")])
    (b1, b1f), (c1_, c1f) = sc_ifs(t, s1)[:2]
    banda, cuerpo1 = t[b1:b1f], t[c1_:c1f]
    assert CARGAR in cuerpo1
    cambios = {
        "Elegir el dato de la persona": (b2.campo("Zona", aria="Dato de la persona", tip_abierto=False),
                                         b2.campo("Zona", abierto=True, aria="Dato de la persona", extra=lista_datos())),
        "Elegir la persona": (b2.campo("Juan Gómez", aria="Como si lo recibiera", tip_abierto=False),
                              b2.campo("Juan Gómez", abierto=True, aria="Como si lo recibiera", extra=lista_personas())),
        "Sin permiso para cargar los datos": (f'<div class="q-sin">{CARGAR}</div>', '<div class="q-sin">2 personas sin Zona</div>'),
    }
    bandas, cuerpos = [], []
    for nombre, (viejo, nuevo) in cambios.items():
        bandas.append(renombrar(banda, s1, sv[nombre]))
        cuerpos.append(una(renombrar(cuerpo1, s1, sv[nombre]), viejo, nuevo))
    (ub, ubf), (uc, ucf) = sc_ifs(t, s9)[:2]
    t = t[:ubf] + "".join(bandas) + t[ubf:ucf] + "".join(cuerpos) + t[ucf:]
    escribir("FRM-Editor-16", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
FILTRO_TEL = re.compile(r'<div class="ap-grupo"><div class="q-row"><span class="tx"><b>(?P<campo>[^<]*)</b><span>(?P<tipo>[^<·]*?) · '
                        r'(?P<dato>[^<]*)</span></span><button type="button" class="ap-ib" aria-label="Quitar el filtro"(?P<oculto> hidden)?>'
                        r'(?P<x>' + SVG1 + r')</button></div></div>', re.S)


def filtro_tel(m):
    """El filtro en su recuadro: el tipo de filtro y la ✕; «Campo» y «Dato de la persona» (o «Valor fijo»), en la pieza (262)."""
    ro = bool(m.group("oculto"))
    segundo = "Dato de la persona" if m.group("tipo") == "Según quien lo recibe" else "Valor fijo"
    apagado = SOLO_VER if ro else None
    x = "" if ro else f'<button type="button" class="ap-ib" aria-label="Quitar el filtro">{m.group("x")}</button>'
    campos = "".join(f'<div class="ap-cmp"><span class="rt"><span>{rot}</span></span>'
                     f'{b2.campo(v, aria=rot, apagado=apagado, tip_abierto=False)}</div>'
                     for rot, v in (("Campo", m.group("campo")), (segundo, m.group("dato"))))
    return (f'<div class="t16-cond{" ro" if ro else ""}" role="group" aria-label="{m.group("tipo")}">'
            f'<div class="cab"><span>{m.group("tipo")}</span>{x}</div>{campos}</div>')


def m_frm_editor_16():
    t, nl = leer("M-FRM-Editor-16")
    t = con_css(t, CSS_EDITOR_TEL)
    cab, cuerpo, guion = partir(t)

    # Cada filtro, en su recuadro con la pieza, y «Como si lo recibiera», en la pieza (262).
    cuerpo, n = FILTRO_TEL.subn(filtro_tel, cuerpo)
    assert n == 4, n
    cuerpo, n = re.subn(r'(<div class="ap-cmp"><span class="rt"><span>Como si lo recibiera</span></span>)<div class="ct sel">([^<]*)'
                        + SVG1 + r'</div>', lambda m: m.group(1) + b2.campo(m.group(2).split(" · ")[0], aria="Como si lo recibiera"),
                        cuerpo, flags=re.S)
    assert n == 4 and 'class="ct sel' not in cuerpo, n

    # «Cargar los datos», como en la compu, donde se edita la pregunta (no en «Solo lectura»).
    for estado in ("Qué opciones ve cada persona", "Agregar filtro", "Le falta el dato"):
        (a, b), = sc_ifs(cuerpo, s_de(t, estado))[:1]
        cuerpo = en_rango(cuerpo, a, b, lambda x: una(x, '<span class="t-lin2">2 personas sin Zona</span>',
                                                       f'<span class="t-lin2">{CARGAR_TEL}</span>'))

    # «Las preguntas»: cada pregunta, una tarjeta con «Tipo» y «Obligatoria» (263), con el nombre del tipo de la compu.
    cuerpo, n = re.subn(r'(<span class="tx"><b>[^<]*</b><span>)De un catálogo · ', r"\1Elegir de un catálogo · ", cuerpo)
    assert n == 1, n
    cuerpo = e14e.tarjetas_tel(cuerpo)
    t = cab + cuerpo + guion

    # Dos estados nuevos, sacados de «Qué opciones ve cada persona»: la persona a pantalla completa y sin el permiso de cargar.
    s1, s5 = s_de(t, "Qué opciones ve cada persona"), s_de(t, "Las preguntas")
    t, sv = e14e.sumar_estados(t, [("Le falta el dato", "Elegir la persona"), ("Solo lectura", "Sin permiso para cargar los datos")])
    (c1, c1f), = sc_ifs(t, s1)[:1]
    base = t[c1:c1f]
    assert CARGAR_TEL in base
    cuerpos = (renombrar(base, s1, sv["Elegir la persona"])
               + una(renombrar(base, s1, sv["Sin permiso para cargar los datos"]), f'<span class="t-lin2">{CARGAR_TEL}</span>',
                     '<span class="t-lin2">2 personas sin Zona</span>'))
    pieza = b2.pk_tel("Como si lo recibiera", [(n, z, n == "Juan Gómez", None) for n, z in PERSONAS], buscar="",
                      cantidad=f"{len(PERSONAS)} personas")
    capa = f'<sc-if value="{{{{{sv["Elegir la persona"]}}}}}" hint-placeholder-val="{{{{no}}}}">{pieza}</sc-if>'
    fin_cuerpos = sc_ifs(t, s5)[0][1]
    fin_capas = t.rindex("</div>\n</x-dc>")
    t = t[:fin_cuerpos] + cuerpos + t[fin_cuerpos:fin_capas] + capa + t[fin_capas:]
    escribir("M-FRM-Editor-16", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el catálogo
FILA_CAMPO = re.compile(r'<div class="md-it(?P<cls>[^"]*)" role="option" aria-selected="(?P<sel>\w+)"><span class="num">(?P<num>[^<]*)</span>'
                        r'<span class="tx"><b>(?P<txt>[^<]*)</b><small>(?P<tipo>[^<·]*?) · (?P<papel>[^<]*)</small></span>'
                        r'(?P<fle><span class="md-fle">.*?</span>)?</div>', re.S)
PAPEL = re.compile(r'<span class="md-seg" role="radiogroup" aria-label="Papel">((?:<span class="[^"]*" role="radio">[^<]*</span>)+)</span>'
                   r'(?P<err><span class="err2" role="alert">)?', re.S)


def fila_campo(m):
    """El número, el nombre, «Nuevo», el tipo y el papel, cada uno en su columna (263)."""
    assert m.group("papel") in PAPELES, m.group("papel")
    return (f'<div class="md-it e13c e16c{m.group("cls")}" role="option" aria-selected="{m.group("sel")}"><span class="num">{m.group("num")}</span>'
            f'<span class="tx"><b>{m.group("txt")}</b></span><span class="mc"></span><span class="tp">{m.group("tipo")}</span>'
            f'<span class="tp pp">{m.group("papel")}</span>{m.group("fle") or ""}</div>')


def papel(m):
    elegido = re.search(r'<span class="on" role="radio">([^<]*)</span>', m.group(1)).group(1)
    return b2.campo(elegido, error=bool(m.group("err")), aria="Papel") + (m.group("err") or "")


def frm_catalogo_16():
    t, nl = leer("FRM-Catalogo-16")
    t13, _ = leer("FRM-Catalogo-13")
    t = con_css(t, CSS_CATALOGO)
    cab, cuerpo, guion = partir(t)

    # Detrás, el catálogo de `FRM-Catalogo-13` («Campos»): el ⋮ de cada opción (261), «Columnas» y «En WhatsApp» en la pieza (262).
    fondo = adentro(t13[slice(*sc_ifs(t13, "s0")[1])])
    assert fondo.startswith('<div class="w-body">') and not re.search(r"\{\{s\d+\}\}", fondo)
    i = cuerpo.index('<div class="w-body">')
    j = cierre(cuerpo, i, "div")
    assert cuerpo[j:].startswith('<sc-if value="{{s0}}"'), cuerpo[j:j + 60]
    cuerpo = cuerpo[:i] + fondo + cuerpo[j:]

    # El modal: la lista en columnas (263) y el tipo, el catálogo y el papel en la pieza (262).
    cuerpo = e13m.subn(FILA_CAMPO, fila_campo, cuerpo, 8)
    cuerpo = e13m.subn(e13m.TIPO, e13m.tipo, cuerpo, 3)
    cuerpo = e13m.subn(e13m.CATALOGO, e13m.catalogo, cuerpo, 2)
    cuerpo = e13m.subn(PAPEL, papel, cuerpo, 3)
    lee = '<div class="md-f"><span class="rt">Tipo</span><span class="ctl"><span class="lee">De un catálogo<small>Zonas · 6 opciones</small></span></span></div>'
    cuerpo = una(cuerpo, lee, '<div class="md-f"><span class="rt">Tipo</span><span class="ctl"><span class="lee">De un catálogo</span></span></div>'
                 '<div class="md-f junto"><span class="rt">Catálogo</span><span class="ctl"><span class="lee">Zonas</span></span></div>')
    assert "md-seg" not in cuerpo and "<small>Texto · " not in cuerpo and 'class="k-in sel"' not in cuerpo
    t = cab + cuerpo + guion

    # «Elegir el papel»: la pieza abierta en «Un campo de filtro».
    s0, s3 = s_de(t, "Un campo de filtro"), s_de(t, "Solo lectura")
    t, sv = e14e.sumar_estados(t, [("Un campo de filtro", "Elegir el papel")])
    (a, b), = sc_ifs(t, s0)
    abierto = b2.campo("Filtro", abierto=True, aria="Papel",
                       extra=b2.lista([b2.op(p, elegida=p == "Filtro", activa=p == "Filtro") for p in PAPELES]))
    nuevo = una(renombrar(t[a:b], s0, sv["Elegir el papel"]), b2.campo("Filtro", aria="Papel"), abierto)
    fin = sc_ifs(t, s3)[0][1]
    t = t[:fin] + nuevo + t[fin:]
    escribir("FRM-Catalogo-16", t, nl)


FILA_CAMPO_TEL = re.compile(r'<div class="q-row"><span class="num">(?P<num>\d+)</span><span class="tx"><b>(?P<txt>[^<]*)</b>'
                            r'<span>(?P<tipo>[^<·]*?) · (?P<papel>[^<]*)</span></span></div>')
PAPEL_TEL = re.compile(r'<div class="ap-cmp"><span class="rt"><span>Papel</span></span><div class="ct sel">([^<]*)' + SVG1 + r'</div></div>', re.S)


def papel_tel(valor, abierto=False):
    return (f'<div class="ap-cmp"><span class="rt"><span>Papel{b2.info(PAPEL_AYUDA)}</span></span>'
            f'{b2.campo(valor, abierto=abierto, aria="Papel")}</div>')


def m_frm_catalogo_16():
    t, nl = leer("M-FRM-Catalogo-16")
    t = con_css(t, CSS_CATALOGO_TEL)
    cab, cuerpo, guion = partir(t)

    # Cada campo, una tarjeta con «Tipo» y «Papel» (263); la cantidad, en el título de la lista.
    cuerpo = e13m.subn(FILA_CAMPO_TEL, lambda m: b2.tarjeta(m.group("txt"), [("Tipo", m.group("tipo")), ("Papel", m.group("papel"))],
                                                            av=f'<span class="num">{m.group("num")}</span>'), cuerpo, 2)
    viejo = '<span class="sub">Proveedores · 2 de 20</span></div></div><div class="ap-cuerpo"><div class="ap-gtit">Campos<a href="#">'
    cuerpo = una(cuerpo, viejo, '<span class="sub">Proveedores</span></div></div><div class="ap-cuerpo"><div class="ap-gtit">Campos · 2 de 20<a href="#">')

    # El tipo, el catálogo y el papel, en la pieza (262); un campo nuevo suma «Papel» y nace opcional (211).
    cuerpo = e13m.subn(e13m.TIPO_TEL, lambda m: m.group(1) + b2.campo(m.group(2), aria="Tipo"), cuerpo, 6)
    cuerpo = e13m.subn(e13m.CATALOGO_TEL, lambda m: b2.campo("Zonas", aria="Catálogo"), cuerpo, 3)
    cuerpo = e13m.subn(PAPEL_TEL, lambda m: papel_tel(m.group(1)), cuerpo, 4)
    obligatorio = '<span class="t-chk"><i class="no"></i>Obligatorio</span>'
    for estado, abierto in (("Un campo nuevo", True), ("Elegir el tipo", False)):
        (a, b), = sc_ifs(cuerpo, s_de(t, estado))[:1]
        apagado = (f'<span class="t-chk apag" role="checkbox" aria-checked="false"{e13m.acc.AD}><i class="no"></i>Obligatorio'
                   f'{b2.tip(e13m.OPCIONAL) if abierto else ""}</span>')
        cuerpo = en_rango(cuerpo, a, b, lambda x: una(una(x, obligatorio, apagado), '</div><a class="t-quitar" href="#">Quitar campo</a>',
                                                       '</div>' + papel_tel("Dato") + '<a class="t-quitar" href="#">Quitar campo</a>'))
    assert 'class="ct sel' not in cuerpo
    t = cab + cuerpo + guion

    # Elegir el catálogo y el tipo: la pieza a pantalla completa, en lugar de la hoja que solo servía para elegir (262).
    pk_cat = b2.pk_tel("Catálogo", [(n, d, n == "Zonas", e13m.ESTE if n == "Proveedores" else None) for n, d in e13m.CATALOGOS],
                       buscar="", cantidad=f"{len(e13m.CATALOGOS)} catálogos", tip_en="Proveedores")
    pk_tipo = b2.pk_tel("Tipo", [(x, None, x == "Texto", None) for x in e13m.TIPOS])
    for estado, aria, pk in (("Elegir el catálogo", 'aria-label="Catálogo"', pk_cat), ("Elegir el tipo", 'aria-label="Tipo"', pk_tipo)):
        i, e = e13m.sc_if(t, s_de(t, estado), f'<div class="ap-hoja" role="dialog" {aria}>')
        t = t[:i] + pk + t[e:]

    # «Elegir el papel»: el campo de un catálogo, con la pieza a pantalla completa.
    s2, s6 = s_de(t, "Un campo de un catálogo"), s_de(t, "Quitar un campo")
    t, sv = e14e.sumar_estados(t, [("Un campo de un catálogo", "Elegir el papel")])
    (a, b), = sc_ifs(t, s2)[:1]
    nuevo = renombrar(t[a:b], s2, sv["Elegir el papel"])
    pieza = b2.pk_tel("Papel", [(p, None, p == "Filtro", None) for p in PAPELES])
    capa = f'<sc-if value="{{{{{sv["Elegir el papel"]}}}}}" hint-placeholder-val="{{{{no}}}}">{pieza}</sc-if>'
    fin_cuerpos = sc_ifs(t, s6)[0][1]
    fin_capas = t.rindex("</div>\n</x-dc>")
    t = t[:fin_cuerpos] + nuevo + t[fin_cuerpos:fin_capas] + capa + t[fin_capas:]
    assert "t-opc" not in t[t.index("</helmet>"):]
    escribir("M-FRM-Catalogo-16", t, nl)


# ---------------------------------------------------------------------------------------------------------------- Publicar
def frm_publicar_16():
    t, nl = leer("FRM-Publicar-16")
    t = con_css(t, CSS_EDITOR)
    cab, cuerpo, guion = partir(t)
    cuerpo = e14e.filas_compu(cuerpo)
    cuerpo, cuenta = piezas(cuerpo)
    assert cuenta == {"Para quién es": 5} and 'class="ct sel' not in cuerpo, cuenta
    escribir("FRM-Publicar-16", cab + cuerpo + guion, nl)


PASOS = dict(zip(TABLEROS, (frm_editor_16, m_frm_editor_16, frm_catalogo_16, m_frm_catalogo_16, frm_publicar_16)))

if __name__ == "__main__":
    # `--solo A,B` rehace solo esos tableros (restaurados antes desde HEAD) y pasa las piezas solo sobre ellos.
    elegidos = sys.argv[sys.argv.index("--solo") + 1].split(",") if "--solo" in sys.argv else TABLEROS
    assert all(n in PASOS for n in elegidos), elegidos
    for nombre in elegidos:
        PASOS[nombre]()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(elegidos)], check=True)
