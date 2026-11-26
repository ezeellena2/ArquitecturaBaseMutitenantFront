"""El editor de la E19 con el traspaso 18, tanda 3B (2026-11-26), en los siete tableros de «Pedido de materiales», con la forma del
`FRM-Editor` y el `M-FRM-Editor` aprobados en la v186 (`e14_editor_1004.py`):

- **en los siete, las preguntas en columnas (263 y 285):** el número, el nombre, el tipo y «Obligatoria», cada uno en su columna, con
  el encabezado arriba, y nada debajo del nombre. Se va lo que iba debajo: «3 opciones», «2 decimales», el catálogo, la moneda de un
  cálculo y «1 condición» se ven al abrir la pregunta (285). Las preguntas del bloque van en las mismas columnas, alineadas con las de
  afuera. Un cálculo no se responde: su «Obligatoria» queda vacía («—»). La fila que hay que corregir lleva «Corregir» y su (i) al
  lado del nombre, como el teléfono de la v186. En el teléfono, cada pregunta es una tarjeta con «Tipo» y «Obligatoria», cada dato
  con su nombre, también en el recuadro del bloque y en la hoja del bloque, sin nada unido con «·» debajo del nombre (263);
- **la fila del bloque (263, pedido del 19/11):** deja «Bloque · de 1 a 10 ítems · 3 preguntas» y dice «Bloque» en Tipo y «Sí» en
  Obligatoria si pide al menos un ítem («No» con mínimo 0); el rango se ve en su ✎, en «Ítems» (spec E19 §«El bloque»);
- **lo que se elige, en la pieza (262):** «Para quién es», «Tipo de respuesta», el catálogo, la pregunta, la condición y el valor de
  «Mostrar si» (elegir varias, en la pieza múltiple por su nombre, sin chips) y la moneda, cerrados con lo elegido; un número o una
  fecha se siguen escribiendo. «Tipo de respuesta» abierto en el bloque pasa a la lista de la pieza, con el buscador porque son once
  tipos, y Elegir varias, Foto y Documento apagadas con su motivo en el tooltip (211). La suma de una pregunta del bloque ya no abre un
  diálogo: la pieza se abre en la fórmula, en el lugar del dato nuevo. «Agregar dato ▾» sigue siendo un menú de acciones, y la vista
  previa que imita WhatsApp no cambia. La moneda sale de los datos de referencia, con su nombre («Peso argentino (ARS)», como en
  Configuración): hoy están habilitados el peso y el dólar, así que la lista no lleva buscador;
- **el aviso de una fecha (229 y 235):** en `FRM-Editor-Condiciones`, «Observaciones» suma debajo de «Fecha de entrega · es igual o
  anterior a · 31/10/2026» el aviso «WhatsApp no muestra una fecha anterior o posterior a otra.», como el de «Monto»; el teléfono no
  muestra esa condición. En `FRM-Publicar-19`, «Problemas» suma la segunda fila de «Observaciones», con «Ir a la pregunta»;
- **lo apagado dice por qué en un tooltip sobre el control, también en el teléfono (211):** `M-FRM-Editor-Lineas` suma «Agregar
  bloque apagado», con «Ya hay un bloque.» sobre el enlace, abierto con un toque;
- **el panel «Gestión de formularios» en dos grupos (275):** una línea sin título entre «Formularios» y «Catálogos», en los cuatro de
  la compu (los teléfonos no tienen panel);
- el ⋮ de la banda se llamaba «Acciones de Visita a cliente»: pasa a «Acciones de Pedido de materiales».

Estados nuevos: `FRM-Editor-Lineas` ninguno; `FRM-Editor-Condiciones` «Elegir la pregunta», «Elegir la condición» y «Elegir los
valores»; `FRM-Editor-Calculo` «Elegir la moneda» («La suma de una pregunta del bloque» pierde su diálogo); `M-FRM-Editor-Lineas`
«Agregar bloque apagado»; `M-FRM-Editor-Condiciones` «Elegir la pregunta»; `M-FRM-Editor-Calculo` «La suma de una pregunta del
bloque» y «Elegir la moneda». Los demás estados y los enlaces entre tableros se conservan.

Uso: `python e19_editor_1004.py`. Cambia los tableros en su lugar y no corre dos veces (el bloque `<style data-t3b="e19-editor">` lo
frena); después corre solo `traspaso10_piezas_1004.py --tableros <los siete>`, que pone la escala de la compu, y parte en dos grupos el
panel de los de la compu con las piezas de `e14_panel_1004.py`.
"""
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e14_editor_1004 as e14  # noqa: E402
import e14_panel_1004 as panel  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
MARCA = 'data-t3b="e19-editor"'
SUFIJO = " · para aprobar"
SVG = e14.SVG
COMPU = ["FRM-Editor-Lineas", "FRM-Editor-Condiciones", "FRM-Editor-Calculo", "FRM-Publicar-19"]
TEL = ["M-FRM-Editor-Lineas", "M-FRM-Editor-Condiciones", "M-FRM-Editor-Calculo"]
leer, escribir, cierre, sc_ifs, renombrar, una = e14.leer, e14.escribir, e14.cierre, e14.sc_ifs, e14.renombrar, e14.una
s_de, sumar_estados, partir = e14.s_de, e14.sumar_estados, e14.partir

# Los tipos de respuesta desde la E19: los de la E14, Foto y Documento (E18) y Cálculo.
TIPOS = ["Texto corto", "Texto largo", "Número", "Fecha", "Sí o no", "Elegir una", "Elegir varias", "Elegir de un catálogo", "Foto",
         "Documento", "Cálculo"]
# En una pregunta del bloque (los textos de la spec E19, «Los textos del bloque»).
APAGADOS_BLOQUE = {"Elegir varias": "En un bloque se elige una sola opción.", "Foto": "No se carga varias veces.",
                   "Documento": "No se carga varias veces."}
# Las monedas habilitadas en los datos de referencia (`habilitados.json`: ARS y USD), con el nombre de Configuración.
MONEDAS = ["Peso argentino (ARS)", "Dólar estadounidense (USD)"]
AVISO_FECHA = "WhatsApp no muestra una fecha anterior o posterior a otra."
NADA = '<span class="q-nada">—</span>'

CSS_COMPU = e14.CSS_COMPU + """
/* E19 · Las preguntas del bloque en las mismas columnas que las de afuera (263): el recuadro se acerca al borde derecho y sus
   filas no llevan relleno a la derecha, así Tipo, Obligatoria y las acciones quedan alineadas con el encabezado. El número del
   bloque («6.1») necesita más lugar. */
.q-blq { margin-right: 8px; }
.q-blq .q-it { grid-template-columns: 28px minmax(0, 1fr) 200px 76px 89px; padding-right: 0; }
/* «Corregir» y su (i), al lado del nombre (como el teléfono de la v186). */
.q-it .dato .q-nm { display: flex; align-items: center; gap: 8px; min-width: 0; }
/* Un cálculo no se responde: «Obligatoria» no corresponde. */
.q-it .q-nada { color: var(--t3); }
/* E19 · La pieza (262) en «Mostrar si» y en la fórmula, donde el dato nuevo se elige sin diálogo. */
.lg-cond .b2-env { width: 100%; }
.lg-cond .b2-pkl { min-width: 240px; }
.lg-form .lg-pk { display: inline-flex; width: 260px; }
.lg-form .lg-pk .b2-env { width: 100%; }
.lg-form .lg-pk .b2-pkc { height: 30px; }
.lg-zb:has(.b2-pkl), .lg-form:has(.b2-pkl) { overflow: visible; }
"""
CSS_TEL = e14.CSS_TEL + """
/* E19 · Las tarjetas en el recuadro del bloque (263): el número «6.1» necesita más lugar. */
.t-blq-caja .q-tj { grid-template-columns: 34px minmax(0, 1fr) auto; border-top: 1px solid var(--borde); border-bottom: 0; }
.t-blq-caja .q-tj .num { width: auto; min-width: 26px; padding: 0 5px; box-sizing: border-box; border-radius: 13px; }
/* Las preguntas de cada ítem en la hoja del bloque: el nombre y, debajo, «Tipo» y «Obligatoria», cada dato con su nombre. */
.lg-tcol .nm { font-size: 15.5px; }
.lg-tcol .dl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px 14px; margin-top: 4px; }
.lg-tcol .dl .k { display: block; color: var(--t2); font-size: 12.5px; line-height: 1.3; }
.lg-tcol .dl .v { display: block; font-size: 14.5px; line-height: 1.35; }
/* 211 · El motivo de «Agregar bloque» apagado, en un tooltip sobre el enlace, abierto con un toque (debajo: arriba lo corta la barra). */
.t-tipw { position: relative; display: inline-flex; }
.t-tipw .acc-tip { left: -10px; }
"""


# ---------------------------------------------------------------------------------------------------------------- utilidades
def con_css(t, css):
    assert MARCA not in t
    t = re.sub(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1).removesuffix(SUFIJO)}{SUFIJO}</title>", t, count=1)
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def clonar(t, base, nuevo, cambio=None, cuales=(0, 1)):
    """Copia los `sc-if` de primer nivel del estado `base` (la banda y el cuerpo en la compu; el cuerpo en el teléfono) para el estado
    `nuevo`, cada copia justo después de su original; `cambio(i, copia)` ajusta la copia `i`."""
    bloques = sc_ifs(t, base)
    for i in sorted(cuales, reverse=True):
        a, b = bloques[i]
        copia = renombrar(t[a:b], base, nuevo)
        if cambio:
            copia = cambio(i, copia)
        t = t[:b] + copia + t[b:]
    return t


def en_cuerpo(t, estado, cambio, idx=1):
    """Cambia el `sc-if` número `idx` del estado (el cuerpo, en la compu)."""
    a, b = sc_ifs(t, s_de(t, estado))[idx]
    return t[:a] + cambio(t[a:b]) + t[b:]


def rotulo(cuerpo, i):
    """El rótulo del campo que empieza en `i`: el texto del último `<span class="rt">` de su mismo campo."""
    j = cuerpo.rfind('<span class="rt">', 0, i)
    assert j >= 0 and '<div class="w-cmp' not in cuerpo[j:i] and '<div class="ap-cmp' not in cuerpo[j:i], cuerpo[i - 200:i]
    texto = re.sub(r"<svg\b.*?</svg>", "", cuerpo[j:i], flags=re.S)
    texto = re.sub(r'<span class="(?:rq|req)">\*</span>', "", texto)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", texto)).strip()


def tipo_y_obligatoria(desc):
    """De «Bloque · de 1 a 10 ítems · 3 preguntas» salen «Bloque» y «Sí» (pide al menos un ítem; con «hasta», el mínimo es 0); de
    «Cálculo · Pesos», «Cálculo» y nada (no se responde); de «Número · 2 decimales · 1 condición · Opcional», «Número» y «No»."""
    partes = desc.split(" · ")
    base = partes[0]
    if base == "Bloque":
        rango = partes[1]
        if rango.startswith("hasta "):
            return "Bloque", "No"
        return "Bloque", "Sí" if int(re.match(r"(?:de )?(\d+)", rango).group(1)) >= 1 else "No"
    if base == "Cálculo":
        return "Cálculo", None
    assert base in TIPOS, desc
    return base, {"Obligatoria": "Sí", "Opcional": "No"}[partes[-1]]


# ---------------------------------------------------------------------------------------------------------------- la compu
def filas_compu(cuerpo):
    """Cada fila de pregunta, en columnas (263), también las del bloque; el encabezado, arriba de la primera."""
    cuenta = {"preguntas": 0, "títulos": 0, "a corregir": 0}
    out, pos = [], 0
    for m in re.finditer(r'<div class="q-it( q-tit| mal)?">', cuerpo):
        fin = cierre(cuerpo, m.start(), "div")
        fila = cuerpo[m.start():fin]
        clase = (m.group(1) or "").strip()
        f = re.fullmatch(r'<div class="q-it[^"]*"><span class="num">([^<]*)</span><span class="dato"><b>(.*?)</b>(?:<span>([^<]*)</span>)?'
                         r'</span>(?:<span class="chips">(.*?)</span>)?(<span class="q-acc2">.*</span>)</div>', fila, re.S)
        assert f, fila[:300]
        num, nombre, desc, chips, acc = f.groups()
        if clase == "q-tit":
            assert not desc and not num and not chips, fila[:200]
            nuevo = f'<div class="q-it q-tit"><span class="num"></span><span class="dato"><b>{nombre}</b></span>{acc}</div>'
            cuenta["títulos"] += 1
        else:
            tipo, ob = tipo_y_obligatoria(desc)
            dato = f"<b>{nombre}</b>"
            if chips:
                dato = f'<span class="q-nm">{dato}<span class="chips">{chips}</span></span>'
                cuenta["a corregir"] += 1
            nuevo = (f'<div class="q-it{" mal" if clase == "mal" else ""}"><span class="num">{num}</span><span class="dato">{dato}</span>'
                     f'<span class="q-tp">{tipo}</span><span class="q-ob">{ob or NADA}</span>{acc}</div>')
            cuenta["preguntas"] += 1
        out.append(cuerpo[pos:m.start()] + nuevo)
        pos = fin
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert 'class="chips"></span>' not in cuerpo and not re.search(r'<span class="dato"><b>(?:(?!</b>).)*</b><span>', cuerpo, re.S)
    print("  filas:", cuenta)

    encabezado = ('<div class="q-th" role="row"><span role="columnheader">#</span><span role="columnheader">Pregunta</span>'
                  '<span role="columnheader">Tipo</span><span role="columnheader">Obligatoria</span>'
                  '<span class="der" role="columnheader">Acciones</span></div>')
    cuerpo, n = re.subn(r'(<div class="f-cab"><span>Preguntas</span><span class="der">(?:(?!</div>).)*?</span></div>)'
                        r'(?=<div class="q-(?:it|ab)\b)', lambda m: m.group(1) + encabezado, cuerpo, flags=re.S)
    assert n == cuerpo.count('<div class="f-cab"><span>Preguntas</span>'), n
    print("  encabezados:", n)
    return cuerpo


def lista_tipos():
    return b2.lista([b2.op(n, elegida=n == "Número", activa=n == "Número", apagada=APAGADOS_BLOQUE.get(n), tip_abierto=n == "Foto")
                     for n in TIPOS], buscar="", cantidad=f"{len(TIPOS)} tipos")


def piezas_compu(cuerpo):
    """Lo que se elige, en la pieza (262), cerrada con lo elegido; «Tipo de respuesta» abierto en el bloque, con la lista de la pieza."""
    # El tipo de una pregunta del bloque, abierto: la lista de la pieza, con el buscador (once tipos) y lo apagado con su motivo.
    patron = (r'<div class="ct sel abierto">Número' + SVG + r'</div><div class="q-tipomn" role="listbox" aria-label="Tipo de respuesta">')
    m = re.search(patron, cuerpo, re.S)
    if m:
        fin = cierre(cuerpo, m.end() - len('<div class="q-tipomn" role="listbox" aria-label="Tipo de respuesta">'), "div")
        cuerpo = cuerpo[:m.start()] + b2.campo("Número", abierto=True, aria="Tipo de respuesta", extra=lista_tipos()) + cuerpo[fin:]
        assert "q-tipomn" not in cuerpo
        print("  «Tipo de respuesta» abierto, en la pieza")

    # Los valores de «es alguna de»: la pieza múltiple, por su nombre y en el orden de la lista, sin chips.
    def chips(m):
        nombres = re.findall(r'<span class="ab-chip">([^<]*)<span aria-hidden="true">×</span></span>', m.group(1))
        assert nombres, m.group(0)
        return b2.campo(", ".join(nombres), aria="Valor")
    cuerpo, n = re.subn(r'<div class="lg-chips">(.*?)</div>', chips, cuerpo, flags=re.S)
    if n:
        print("  valores de una condición, en la pieza múltiple:", n)

    # Los demás, cerrados con lo elegido; la referencia rota, con su error. La moneda, con su nombre de los datos de referencia.
    out, pos, cuenta = [], 0, 0
    for m in re.finditer(r'<div class="ct sel( mal)?">(?:<span class="v">([^<]*)</span>|([^<]*))' + SVG + r'</div>', cuerpo, re.S):
        valor = m.group(2) if m.group(2) is not None else m.group(3)
        aria = rotulo(cuerpo, m.start())
        if aria == "Moneda":
            assert valor == "Pesos (ARS)", valor
            valor = MONEDAS[0]
        out.append(cuerpo[pos:m.start()] + b2.campo(valor, error=bool(m.group(1)), aria=aria))
        pos = m.end()
        cuenta += 1
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert 'class="ct sel' not in cuerpo, cuerpo[cuerpo.index('class="ct sel') - 200:cuerpo.index('class="ct sel') + 200]
    print("  piezas cerradas:", cuenta)
    return cuerpo


def comun_compu(nombre):
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return None, nl
    print(nombre)
    t = con_css(t, CSS_COMPU)
    cab, cuerpo, guion = partir(t)
    cuerpo = piezas_compu(filas_compu(cuerpo))
    n = cuerpo.count('aria-label="Acciones de Visita a cliente"')
    cuerpo = cuerpo.replace('aria-label="Acciones de Visita a cliente"', 'aria-label="Acciones de Pedido de materiales"')
    print("  el ⋮ de la banda, con el nombre del formulario:", n)
    return cab + cuerpo + guion, nl


def lineas():
    t, nl = comun_compu("FRM-Editor-Lineas")
    if t is None:
        return False
    escribir("FRM-Editor-Lineas", t, nl)
    return True


def condiciones():
    t, nl = comun_compu("FRM-Editor-Condiciones")
    if t is None:
        return False

    # 229 y 235 · El aviso debajo de la fecha anterior o posterior, en «Observaciones» (estado «Número y fecha»).
    def aviso(cuerpo):
        i = cuerpo.index('31/10/2026</div></div><button type="button" class="ib" aria-label="Quitar condición">')
        j = cuerpo.index("</button></div>", i) + len("</button></div>")
        assert cuerpo[j:].startswith('<span class="e-tipw"'), cuerpo[j:j + 80]
        return cuerpo[:j] + f'<span class="err2 adv" role="status">{AVISO_FECHA}</span>' + cuerpo[j:]
    assert t.count("31/10/2026") == 1
    t = en_cuerpo(t, "Número y fecha", aviso)

    # 262 · La pregunta, la condición y los valores, abiertos en la pieza.
    s_si, s_una = s_de(t, "Sí o no"), s_de(t, "Elegir una")
    t, sv = sumar_estados(t, [("Sí o no", "Elegir la pregunta"), ("Elegir la pregunta", "Elegir la condición"),
                              ("Elegir una", "Elegir los valores")])
    preguntas = [("Cliente", "Texto corto"), ("¿Se concretó la venta?", "Sí o no"), ("Motivo", "Elegir una")]
    abierta_preg = b2.campo("¿Se concretó la venta?", abierto=True, aria="Pregunta", extra=b2.lista(
        [b2.op(n, d, elegida=n == "¿Se concretó la venta?", activa=n == "¿Se concretó la venta?") for n, d in preguntas]))
    abierta_cond = b2.campo("es", abierto=True, aria="Condición", extra=b2.lista(
        [b2.op(n, elegida=n == "es", activa=n == "es") for n in ("es", "tiene respuesta", "no tiene respuesta")]))
    abierta_val = b2.campo("Venta nueva, Reclamo", abierto=True, aria="Valor", extra=b2.lista(
        [b2.op(n, elegida=n != "Seguimiento", multiple=True, activa=n == "Seguimiento") for n in ("Venta nueva", "Seguimiento", "Reclamo")],
        multiple=True))
    t = clonar(t, s_si, sv["Elegir la pregunta"], lambda i, c: c if i == 0 else una(c, b2.campo("¿Se concretó la venta?", aria="Pregunta"), abierta_preg))
    t = clonar(t, s_si, sv["Elegir la condición"], lambda i, c: c if i == 0 else una(c, b2.campo("es", aria="Condición"), abierta_cond))
    t = clonar(t, s_una, sv["Elegir los valores"], lambda i, c: c if i == 0 else una(c, b2.campo("Venta nueva, Reclamo", aria="Valor"), abierta_val))
    escribir("FRM-Editor-Condiciones", t, nl)
    return True


def calculo():
    t, nl = comun_compu("FRM-Editor-Calculo")
    if t is None:
        return False

    # 262 · La suma de una pregunta del bloque, sin diálogo: la pieza se abre en la fórmula, en el lugar del dato nuevo.
    s_suma = s_de(t, "La suma de una pregunta del bloque")
    bloques = sc_ifs(t, s_suma)
    assert len(bloques) == 3 and 'class="w-oscuro"' in t[bloques[2][0]:bloques[2][1]]
    t = t[:bloques[2][0]] + t[bloques[2][1]:]
    formula = ('<div class="lg-form"><span class="lg-p ">Suma de Productos · Importe<span class="x" aria-hidden="true">×</span></span>'
               '<span class="lg-p op">+</span><span class="lg-p ">Monto<span class="x" aria-hidden="true">×</span></span></div>')
    suma = b2.campo("Suma de Productos", vacio=True, abierto=True, aria="La suma de una pregunta del bloque",
                    extra=b2.lista([b2.op("Cantidad", "Número"), b2.op("Importe", "Cálculo", activa=True)]))
    nueva = ('<div class="lg-form"><span class="lg-p ">Monto<span class="x" aria-hidden="true">×</span></span><span class="lg-p op">+</span>'
             f'<div class="lg-pk">{suma}</div></div>')
    t = en_cuerpo(t, "La suma de una pregunta del bloque", lambda c: una(c, formula, nueva))

    # 262 · La moneda, abierta en la pieza: las monedas habilitadas en los datos de referencia.
    s0 = s_de(t, "La fórmula")
    t, sv = sumar_estados(t, [("La suma de una pregunta del bloque", "Elegir la moneda")])
    abierta = b2.campo(MONEDAS[0], abierto=True, aria="Moneda",
                       extra=b2.lista([b2.op(n, elegida=n == MONEDAS[0], activa=n == MONEDAS[0]) for n in MONEDAS]))
    t = clonar(t, s0, sv["Elegir la moneda"], lambda i, c: c if i == 0 else una(c, b2.campo(MONEDAS[0], aria="Moneda"), abierta))
    escribir("FRM-Editor-Calculo", t, nl)
    return True


def publicar():
    t, nl = comun_compu("FRM-Publicar-19")
    if t is None:
        return False

    # 229 y 235 · «Problemas» suma la fecha anterior o posterior de «Observaciones», con «Ir a la pregunta».
    def fila_fecha(dlg):
        i = dlg.index('<div class="z-f">')
        j = cierre(dlg, i, "div")
        fila = dlg[i:j]
        viejo = "WhatsApp no muestra una condición con números: «Monto es mayor o igual a 100.000,00»."
        assert viejo in fila and "<b>Observaciones</b>" in fila
        nueva = fila.replace(viejo, f"{AVISO_FECHA[:-1]}: «Fecha de entrega es igual o anterior a 31/10/2026».")
        return dlg[:j] + nueva + dlg[j:]
    t = en_cuerpo(t, "Una condición que WhatsApp no puede mostrar", fila_fecha, idx=2)
    escribir("FRM-Publicar-19", t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def tarjetas_tel(cuerpo):
    """Cada pregunta, una tarjeta (263): el número, el nombre y ↑ ↓ ✎ 🗑; debajo, «Tipo» y «Obligatoria», cada dato con su nombre (un
    cálculo lleva solo «Tipo»). En la hoja del bloque, sus preguntas con los mismos dos datos."""
    def celdas(tipo, ob):
        datos = [("Tipo", tipo)] + ([("Obligatoria", ob)] if ob else [])
        return ('<span class="dl">' + "".join(f'<span class="c"><span class="k">{k}</span><span class="v">{v}</span></span>'
                                              for k, v in datos) + "</span>")

    def fila(m):
        num, nombre, desc, acc = m.groups()
        return f'<div class="b2-tj q-tj"><span class="num">{num}</span><span class="nm">{nombre}</span>{acc}{celdas(*tipo_y_obligatoria(desc))}</div>'
    cuerpo, n = re.subn(r'<div class="q-row"><span class="num">([\d.]+)</span><span class="tx"><b>([^<]*)</b><span>([^<]*)</span></span>'
                        r'(<span class="q-acc">(?:(?!</div>).)*</span>)</div>', fila, cuerpo, flags=re.S)
    assert "q-row" not in cuerpo
    cuerpo, k = re.subn(r'<div class="lg-tcol">([^<]*)<small>([^<]*)</small></div>',
                        lambda m: f'<div class="lg-tcol"><span class="nm">{m.group(1)}</span>{celdas(*tipo_y_obligatoria(m.group(2)))}</div>',
                        cuerpo)
    print("  tarjetas:", n, "· en la hoja del bloque:", k)
    return cuerpo


def piezas_tel(cuerpo):
    out, pos, cuenta = [], 0, 0
    for m in re.finditer(r'<div class="ct sel">([^<]*)' + SVG + r'</div>', cuerpo, re.S):
        valor, aria = m.group(1), rotulo(cuerpo, m.start())
        if aria == "Moneda":
            assert valor == "Pesos (ARS)", valor
            valor = MONEDAS[0]
        out.append(cuerpo[pos:m.start()] + b2.campo(valor, aria=aria))
        pos = m.end()
        cuenta += 1
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert 'class="ct sel' not in cuerpo
    print("  piezas cerradas:", cuenta)
    return cuerpo


def comun_tel(nombre):
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return None, nl
    print(nombre)
    t = con_css(t, CSS_TEL)
    cab, cuerpo, guion = partir(t)
    return cab + piezas_tel(tarjetas_tel(cuerpo)) + guion, nl


def con_capas(t, capas):
    """La pieza a pantalla completa de cada estado nuevo, al final del teléfono, sobre todo lo demás."""
    fin = t.rindex("</div>\n</x-dc>")
    return t[:fin] + "".join(f'<sc-if value="{{{{{s}}}}}" hint-placeholder-val="{{{{no}}}}">{p}</sc-if>' for s, p in capas) + t[fin:]


def lineas_tel():
    t, nl = comun_tel("M-FRM-Editor-Lineas")
    if t is None:
        return False
    s0 = s_de(t, "El bloque")
    t, sv = sumar_estados(t, [("El bloque", "Agregar bloque apagado")])
    viejo = '<span class="off" aria-disabled="true" title="Ya hay un bloque.">Agregar bloque</span>'
    nuevo = ('<span class="t-tipw"><span class="off" role="button" tabindex="0" aria-disabled="true">Agregar bloque</span>'
             '<span class="acc-tip b2-tip-abajo" role="tooltip">Ya hay un bloque.</span></span>')
    t = clonar(t, s0, sv["Agregar bloque apagado"], lambda i, c: una(c, viejo, nuevo), cuales=(0,))
    escribir("M-FRM-Editor-Lineas", t, nl)
    return True


def condiciones_tel():
    t, nl = comun_tel("M-FRM-Editor-Condiciones")
    if t is None:
        return False
    s0 = s_de(t, "Mostrar si")
    t, sv = sumar_estados(t, [("Mostrar si", "Elegir la pregunta")])
    t = clonar(t, s0, sv["Elegir la pregunta"], cuales=(0,))
    pieza = b2.pk_tel("Pregunta", [("Cliente", "Texto corto", False, None), ("¿Se concretó la venta?", "Sí o no", True, None),
                                   ("Motivo", "Elegir una", False, None)])
    t = con_capas(t, [(sv["Elegir la pregunta"], pieza)])
    escribir("M-FRM-Editor-Condiciones", t, nl)
    return True


def calculo_tel():
    t, nl = comun_tel("M-FRM-Editor-Calculo")
    if t is None:
        return False
    s0 = s_de(t, "La fórmula")
    t, sv = sumar_estados(t, [("La fórmula", "La suma de una pregunta del bloque"),
                              ("La suma de una pregunta del bloque", "Elegir la moneda")])
    for n in ("La suma de una pregunta del bloque", "Elegir la moneda"):
        t = clonar(t, s0, sv[n], cuales=(0,))
    capas = [(sv["La suma de una pregunta del bloque"],
              b2.pk_tel("La suma de una pregunta del bloque", [("Cantidad", "Número", False, None), ("Importe", "Cálculo", False, None)])),
             (sv["Elegir la moneda"], b2.pk_tel("Moneda", [(n, None, n == MONEDAS[0], None) for n in MONEDAS]))]
    t = con_capas(t, capas)
    escribir("M-FRM-Editor-Calculo", t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- el panel
def partir_panel():
    """275 · El panel en dos grupos, en los de la compu (como `e14_panel_1004.main`, con esta lista)."""
    for nombre in COMPU:
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        nuevo, n = panel.PANEL.subn(lambda m: panel.partir(m.group(0)), t)
        assert n, f"{nombre} no tiene el panel"
        if panel.BLOQUE not in nuevo:
            nuevo = nuevo.replace("</helmet>", panel.CSS + "</helmet>", 1)
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
        print("panel", nombre, n, "paneles", "(sin cambios)" if nuevo == t else "")


def main():
    cambiados = [f() for f in (lineas, condiciones, calculo, publicar, lineas_tel, condiciones_tel, calculo_tel)]
    if not any(cambiados):
        return
    subprocess.run([sys.executable, str(GEN / "traspaso10_piezas_1004.py"), "--tableros", ",".join(COMPU + TEL)], check=True)
    partir_panel()


if __name__ == "__main__":
    main()
