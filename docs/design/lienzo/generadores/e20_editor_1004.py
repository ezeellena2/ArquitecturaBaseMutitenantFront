"""El editor y publicar de la E20 con el traspaso 18, tanda 3B (2026-11-26), como el `FRM-Editor` aprobado de la E14 (v186): todo
lo que se elige va en la pieza (262), nada va debajo de otro dato (263), lo de una fila va en su ⋮ salvo ↑ ↓ ✎ 🗑 (261), el motivo de
lo apagado va en un tooltip, también en el teléfono (211), y el panel va en dos grupos (275).

En los ocho tableros:
- **las preguntas en columnas (263, como `FRM-Editor`):** el número, el nombre, el tipo y «Obligatoria», cada uno en su columna, con
  su encabezado. Lo que iba debajo del nombre («hasta 60 caracteres», «3 opciones», «2 decimales», «1 condición», «Zonas», «1 filtro»,
  «Pesos», «hasta 3») no va en la fila: se ve al abrir la pregunta (285). El bloque dice «Bloque» y «Sí» si pide al menos un ítem, con
  el rango en su ✎ (spec de la E19); un cálculo no se responde y su «Obligatoria» dice «—». En el teléfono, cada pregunta es la tarjeta
  de `M-FRM-Editor`, con «Tipo» y «Obligatoria» nombrados, sin «·» debajo del nombre;
- **lo que se elige, en la pieza (262):** «Dónde se completa» (antes un segmentado), «Para quién es», el tipo de respuesta, y la
  pregunta, la condición y el valor de «Mostrar si» (un número o una fecha se siguen escribiendo, spec de la E19). La pieza nunca crece,
  así «Dónde se completa» entra en su tarjeta también a 1024 px (O18);
- **la vista previa «Nueva respuesta» (SA2-A, 262 y 266):** la de la app, con «Solo en la app», lleva el Sí o No en la pieza, vacía
  con «Elegí una opción» como en la carga, y el catálogo también («Buscar en Zona» era el buscador, que va adentro de la lista).
  «Enviar», apagado con su motivo y alcanzable con Tab (211). La que imita WhatsApp no cambia (262).

Por tablero:
- `FRM-Editor-20` y su teléfono: en «Uno solo para clientes», la pieza abierta con «Solo en la app» apagada y «Los clientes responden
  solo por WhatsApp.» en el tooltip (229 y 211); en el teléfono, a pantalla completa. En «Una condición con números», debajo de la
  condición de «Fecha de entrega», «WhatsApp no muestra una fecha anterior o posterior a otra.» con «Pasar a «Solo en la app»» al
  lado, como en la de «Monto» (229 y 235); «Pasó a «Solo en la app»» sigue sin avisos. El teléfono suma esa condición en los dos
  estados y el estado nuevo «La condición con una fecha», con la hoja bajada hasta ella (no entra en 844 de alto con la de «Monto»).
- `FRM-Publicar-20` y su teléfono: el editor de atrás como `FRM-Editor-20` (los siete y los seis segmentados, los dos Sí o No y las
  filas). El diálogo no cambia: es el de `FRM-Publicar`, aprobado.
- `FRM-Editor-Ubicacion` y su teléfono: el tipo en la pieza; «Tipos de respuesta: menú» es la pieza abierta, con los doce tipos, el
  buscador y la cantidad, porque son más de diez (262). El teléfono suma «Elegir el tipo», a pantalla completa.
- `FRM-Editor-Listas` y su teléfono: «Dónde se completa» al lado del prefijo, en «Solo en la app», y la banda con «Publicar», sin
  «Publicar en WhatsApp» ni «Ver vista oficial» (229 y la spec de la E20: «Pedido de materiales», con su lista dependiente, se completa
  solo en la app); por eso su vista previa es la de la app (SA2-A). En «Un formulario para clientes», «Para quién es» dice «Clientes»
  (decía «Empleados») y «Dónde se completa», «En la app y por WhatsApp», con la banda y la vista previa de WhatsApp. El campo y la
  pregunta de la que depende van en la pieza (262), con dos estados nuevos: «Elegir la pregunta» (las preguntas de antes; las que no
  eligen de «Zonas», apagadas con su motivo, 269) y «Falta la pregunta», que marca solo ese campo al guardar (O16 y 269). En el
  teléfono, el filtro es una tarjeta con «Campo» y «Pregunta» y su ⋮ (261, como `M-FRM-Catalogo-Filtros`), y suma «Editar el filtro»,
  «Elegir la pregunta» y «Falta la pregunta».
- Los tableros de «Pedido de materiales» nombran bien el ⋮ de la banda («Acciones de Pedido de materiales», decía «Visita a cliente»).

Corre una vez sobre los tableros de la v175 (si el bloque `data-t3b="e20-editor"` ya está, no los toca), después pasa
`traspaso10_piezas_1004.py --tableros <los ocho>` (la escala de la compu) y al final parte en dos grupos el panel de los cuatro de la
compu (275), con las piezas de `e14_panel_1004.py`. Lee y escribe sin cambiar los finales de línea.

Uso: `python e20_editor_1004.py`
"""
import io
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e14_editor_1004 as e14e  # noqa: E402
import e14_panel_1004 as e14p  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
MARCA = 'data-t3b="e20-editor"'
SUFIJO = " · para aprobar"
SVG = r"<svg\b[^>]*>.*?</svg>"
COMPU = ["FRM-Editor-20", "FRM-Publicar-20", "FRM-Editor-Ubicacion", "FRM-Editor-Listas"]
TELEFONOS = ["M-FRM-Editor-20", "M-FRM-Publicar-20", "M-FRM-Editor-Ubicacion", "M-FRM-Editor-Listas"]

TIPOS = e14e.TIPOS + ["Foto", "Documento", "Cálculo", "Ubicación"]
BASES = TIPOS + ["Bloque"]
DONDE = ["En la app y por WhatsApp", "Solo en la app"]
TIP_CLIENTES = "Los clientes responden solo por WhatsApp."
INFO_DONDE = "Con «Solo en la app» no va por WhatsApp: se carga desde la app."
ELEGI = "Elegí una opción"
AVISO_FECHA = "WhatsApp no muestra una fecha anterior o posterior a otra."
PASAR = '<button type="button" class="cb cb-enl">Pasar a «Solo en la app»</button>'
# «Según otra respuesta» (94 y 269): las preguntas de antes de «Proveedor»; solo «Zona» elige de «Zonas».
ANTERIORES = ["Cliente", "¿Se concretó la venta?", "Motivo", "Monto", "Zona", "Fecha de entrega"]
NO_SIRVE = "No elige de «Zonas»."
TIP_ANTERIOR = "Motivo"
ELEGI_PREGUNTA = "Elegí una pregunta"
FALTA_PREGUNTA = "Elegí la pregunta de la que depende."

CSS_COMPU = e14e.CSS_COMPU + """
/* E20 · Lo que se elige, en la pieza (262): «Dónde se completa», al lado del prefijo, que nunca crece y entra en su tarjeta también a
   1024 px (O18); la pregunta, la condición y el valor de «Mostrar si»; el campo y la pregunta de «Según otra respuesta», y el Sí o No y
   el catálogo de la vista previa de la app. */
.e-g2 > .w-cmp { min-width: 0; }
.t15e-donde .b2-env, .lg-cond .w-cmp .b2-env, .q-cond .w-cmp .b2-env, .t15e-pva .w-cmp .b2-env { width: 100%; min-width: 0; }
.lg-cond:has(.b2-pkl), .q-cond:has(.b2-pkl), .q-ed:has(.b2-pkl) { overflow: visible; }
/* E20 · 263 · Las preguntas del bloque, con las mismas columnas: «6.1» entra en su número, y el tipo y «Obligatoria» quedan debajo de
   los de afuera (el bloque se corre 4,8 px del borde derecho, lo mismo que el relleno de una fila). */
.q-blq { margin-right: 6.67px; }
.q-blq .q-it { grid-template-columns: 26px minmax(0, 1fr) 200px 76px 89px; padding-right: 0; }
.q-ob .nada { color: var(--t3); }
/* E20 · SA2-A · La vista previa de la app (la que imita WhatsApp no cambia). */
.t15e-pva .t15e-pvb { display: flex; flex-direction: column; gap: 14px; padding: 16px 20px; }
.t15e-pva .t15e-pvp { display: flex; justify-content: flex-end; padding: 12px 20px; border-top: 1px solid var(--borde); }
"""
CSS_TEL = e14e.CSS_TEL + """
/* E20 · 263 · Las preguntas del bloque, como tarjetas: «9.1» entra en su número. */
.t-blq-caja .q-tj { grid-template-columns: auto minmax(0, 1fr) auto; }
.t-blq-caja .q-tj .num { width: auto; min-width: 26px; padding: 0 5px; box-sizing: border-box; border-radius: 13px; }
.t-blq-caja > .q-tj:last-child { border-bottom: 0; }
.q-tj .v .nada { color: var(--t3); }
/* E20 · 269 · El error de un campo, debajo de su pieza. */
.ap-cmp .err2 { font-size: 13px; color: var(--peligro); }
"""
NADA = '<span class="nada">—</span>'


# ---------------------------------------------------------------------------------------------------------------- utilidades
leer, escribir, cierre, sc_ifs, renombrar, una, s_de, sumar_estados, partir = (
    e14e.leer, e14e.escribir, e14e.cierre, e14e.sc_ifs, e14e.renombrar, e14e.una, e14e.s_de, e14e.sumar_estados, e14e.partir)


def con_css(t, css):
    assert MARCA not in t
    t = re.sub(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1).removesuffix(SUFIJO)}{SUFIJO}</title>", t, count=1)
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def bloque_de(t, s, k=0):
    """El `k`-ésimo `sc-if` de primer nivel del estado `s` (banda o cuerpo o capa), como (inicio, fin)."""
    return sc_ifs(t, s)[k]


def cambiar_en(t, s, k, f):
    a, b = bloque_de(t, s, k)
    return t[:a] + f(t[a:b]) + t[b:]


def fin_de_ap(t):
    """Donde termina el marco del teléfono: antes del último `</div>` de adentro de `<x-dc>`."""
    return t.rindex("</div>", 0, t.index("</x-dc>"))


# ---------------------------------------------------------------------------------------------------------------- los datos
def tipo_y_obligatoria(desc):
    """De «Elegir varias · 4 opciones · de 1 a 3 · Obligatoria» salen el tipo y «Sí»; lo demás de debajo del nombre se va (285)."""
    partes = desc.split(" · ")
    base = partes[0]
    assert base in BASES, desc
    if base == "Cálculo":
        return "Cálculo", NADA
    if base == "Bloque":
        rango = partes[1]
        assert re.fullmatch(r"(de \d+ a \d+|hasta \d+) ítems", rango), desc
        return "Bloque", "Sí" if re.match(r"de [1-9]", rango) else "No"
    ob = {"Obligatoria": "Sí", "Opcional": "No"}[partes[-1]]
    medio = partes[1:-1]
    rango = next((p for p in medio if re.fullmatch(r"de \d+ a \d+", p)), None)
    if base == "Elegir varias" and rango:
        return f"Elegir varias, hasta {rango.split()[-1]}", ob
    return base, ob


# ---------------------------------------------------------------------------------------------------------------- las piezas
def donde_campo(valor, clientes=False, abierto=False):
    """«Dónde se completa» en la pieza (229 y 262): abierta en uno solo para clientes, con «Solo en la app» apagada y su motivo."""
    if not abierto:
        return b2.campo(valor, aria="Dónde se completa")
    ops = [b2.op(n, elegida=n == valor, activa=n == valor,
                 apagada=TIP_CLIENTES if clientes and n == "Solo en la app" else None,
                 tip_abierto=clientes and n == "Solo en la app") for n in DONDE]
    return b2.campo(valor, abierto=True, aria="Dónde se completa", extra=b2.lista(ops))


SEG_DONDE = re.compile(r'<span class="e-tipw t15e-seg"><span class="ab-seg" role="radiogroup" aria-label="Dónde se completa">'
                       r'((?:<span [^>]*>[^<]*</span>)+)</span>(<span class="e-tip" role="tooltip">[^<]*</span>)?</span>')


def donde_en_pieza(cuerpo, abrir_tip=True):
    """Los segmentados de «Dónde se completa», en la pieza; el que mostraba el tooltip abierto, abierto (solo en la compu)."""
    def f(m):
        opciones = m.group(1)
        valor = re.search(r'<span class="on" role="radio" aria-checked="true">([^<]*)</span>', opciones).group(1)
        clientes = 'class="off"' in opciones
        return donde_campo(valor, clientes, abierto=bool(m.group(2)) and abrir_tip)
    cuerpo, n = SEG_DONDE.subn(f, cuerpo)
    assert "t15e-seg" not in cuerpo, "quedó un segmentado de «Dónde se completa»"
    print("  «Dónde se completa» en la pieza:", n)
    return cuerpo


def sino_en_pieza(cuerpo):
    """El Sí o No de la vista previa de la app, en la pieza, vacío como en la carga (262 y 266); el catálogo, también."""
    cuerpo, n = re.subn(r'(<div class="w-cmp"><span class="rt">([^<]*?) <span class="req">\*</span></span>)<span class="ab-seg" '
                        r'role="radiogroup" aria-label="Sí o no"><span>Sí</span><span>No</span></span>',
                        lambda m: m.group(1) + b2.campo(ELEGI, vacio=True, aria=m.group(2)), cuerpo)
    cuerpo, k = re.subn(r'<div class="ct sel">Buscar en ([^<]*?) ' + SVG + r'</div>',
                        lambda m: b2.campo(ELEGI, vacio=True, aria=m.group(1)), cuerpo, flags=re.S)
    cuerpo, e = re.subn(r'<button type="button" class="cb cb-pri" disabled title="Es una vista previa: no se envía.">Enviar</button>',
                        '<button type="button" class="cb cb-pri" aria-disabled="true" title="Es una vista previa: no se envía.">Enviar'
                        '</button>', cuerpo)
    assert 'aria-label="Sí o no"' not in cuerpo
    print("  vista previa de la app: Sí o No", n, "· catálogo", k, "· «Enviar»", e)
    return cuerpo


def rotulo_antes(cuerpo, i):
    """El rótulo del campo que termina en `i`: el texto de su `<span class="rt">`."""
    k = cuerpo.rfind('<span class="rt">', 0, i)
    assert k >= 0 and i - k < 2000, cuerpo[max(0, i - 200):i]
    return re.match(r'<span class="rt">(?:<span>)?([^<]*)', cuerpo[k:]).group(1).strip()


def sel_en_pieza(cuerpo):
    """Los desplegables de siempre (`ct sel`), en la pieza cerrada con lo elegido; con su error, si lo tienen."""
    patron = re.compile(r'<div class="ct sel( mal)?">(?:<span class="v">([^<]*)</span>|([^<]*))' + SVG + r'</div>', re.S)
    out, pos, n = [], 0, 0
    for m in patron.finditer(cuerpo):
        valor = (m.group(2) if m.group(2) is not None else m.group(3)).strip()
        out.append(cuerpo[pos:m.start()] + b2.campo(valor, error=bool(m.group(1)), aria=rotulo_antes(cuerpo, m.start())))
        pos = m.end()
        n += 1
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert 'class="ct sel' not in cuerpo, "quedó un desplegable de antes"
    print("  desplegables en la pieza:", n)
    return cuerpo


def banda_bien_nombrada(cuerpo):
    """El ⋮ de la banda nombra el formulario que se edita (decía «Visita a cliente» en los de «Pedido de materiales»)."""
    if "<h1>Pedido de materiales</h1>" not in cuerpo:
        return cuerpo
    n = cuerpo.count('aria-label="Acciones de Visita a cliente"')
    print("  ⋮ de la banda, bien nombrado:", n)
    return cuerpo.replace('aria-label="Acciones de Visita a cliente"', 'aria-label="Acciones de Pedido de materiales"')


# ---------------------------------------------------------------------------------------------------------------- las filas
def filas_compu(cuerpo):
    """Cada fila de pregunta, en columnas (263), como `FRM-Editor`; el encabezado, arriba de la primera."""
    cab = re.compile(r'<div class="q-it( q-tit)?"><span class="num">([\d.]*)</span><span class="dato"><b>([^<]*)</b>'
                     r'(?:<span>([^<]*)</span>)?</span>(?:<span class="chips"></span>)?(?=<span class="q-acc2">)')
    cuenta = {"preguntas": 0, "títulos": 0}

    def f(m):
        tit, num, nombre, desc = m.groups()
        if tit:
            assert not desc and not num, m.group(0)
            cuenta["títulos"] += 1
            return f'<div class="q-it q-tit"><span class="num"></span><span class="dato"><b>{nombre}</b></span>'
        tipo, ob = tipo_y_obligatoria(desc)
        cuenta["preguntas"] += 1
        return (f'<div class="q-it"><span class="num">{num}</span><span class="dato"><b>{nombre}</b></span>'
                f'<span class="q-tp">{tipo}</span><span class="q-ob">{ob}</span>')
    cuerpo = cab.sub(f, cuerpo)
    assert not re.search(r'<span class="dato"><b>[^<]*</b><span>', cuerpo) and 'class="chips"' not in cuerpo
    encabezado = ('<div class="q-th" role="row"><span role="columnheader">#</span><span role="columnheader">Pregunta</span>'
                  '<span role="columnheader">Tipo</span><span role="columnheader">Obligatoria</span>'
                  '<span class="der" role="columnheader">Acciones</span></div>')
    cuerpo, n = re.subn(r'(<div class="f-cab"><span>Preguntas</span><span class="der">(?:(?!</div>).)*?</span></div>)'
                        r'(?=<div class="q-(?:it|ab)\b)', lambda m: m.group(1) + encabezado, cuerpo, flags=re.S)
    assert n == cuerpo.count('<div class="f-cab"><span>Preguntas</span>'), n
    print("  filas en columnas:", cuenta, "· encabezados:", n)
    return cuerpo


def tarjetas_tel(cuerpo):
    """Cada fila de pregunta, la tarjeta de `M-FRM-Editor` (263): el número, el nombre y ↑ ↓ ✎ 🗑; debajo, «Tipo» y «Obligatoria»."""
    cuenta = {"preguntas": 0, "títulos": 0}
    out, pos = [], 0
    for m in re.finditer(r'<div class="q-row( q-tit)?">', cuerpo):
        fin = cierre(cuerpo, m.start(), "div")
        fila = cuerpo[m.start():fin]
        f = re.fullmatch(r'<div class="q-row[^"]*"><span class="num">([\d.]*)</span><span class="tx"><b>([^<]*)</b>'
                         r'(?:<span>([^<]*)</span>)?</span>(<span class="q-acc">.*</span>)</div>', fila, re.S)
        assert f, fila[:200]
        num, nombre, desc, acc = f.groups()
        if m.group(1):
            tj = f'<div class="b2-tj q-tj q-tit"><span class="num"></span><span class="nm">{nombre}</span>{acc}</div>'
            cuenta["títulos"] += 1
        else:
            tipo, ob = tipo_y_obligatoria(desc)
            dl = (f'<span class="dl"><span class="c"><span class="k">Tipo</span><span class="v">{tipo}</span></span>'
                  f'<span class="c"><span class="k">Obligatoria</span><span class="v">{ob}</span></span></span>')
            tj = f'<div class="b2-tj q-tj"><span class="num">{num}</span><span class="nm">{nombre}</span>{acc}{dl}</div>'
            cuenta["preguntas"] += 1
        out.append(cuerpo[pos:m.start()] + tj)
        pos = fin
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert "q-row" not in cuerpo
    print("  tarjetas del teléfono:", cuenta)
    return cuerpo


# ---------------------------------------------------------------------------------------------------------------- lo de siempre
def comunes_compu(cuerpo):
    cuerpo = banda_bien_nombrada(cuerpo)
    cuerpo = donde_en_pieza(cuerpo)
    cuerpo = sino_en_pieza(cuerpo)
    cuerpo = sel_en_pieza(cuerpo)
    return filas_compu(cuerpo)


def comunes_tel(cuerpo):
    cuerpo = donde_en_pieza(cuerpo, abrir_tip=False)
    cuerpo = sel_en_pieza(cuerpo)
    return tarjetas_tel(cuerpo) if "q-row" in cuerpo else cuerpo


def compu(nombre, propio=None):
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return
    print(nombre)
    t = con_css(t, CSS_COMPU)
    if propio:
        t = propio(t)
    cab, cuerpo, guion = partir(t)
    escribir(nombre, cab + comunes_compu(cuerpo) + guion, nl)


def telefono(nombre, propio=None):
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return
    print(nombre)
    t = con_css(t, CSS_TEL)
    if propio:
        t = propio(t)
    cab, cuerpo, guion = partir(t)
    escribir(nombre, cab + comunes_tel(cuerpo) + guion, nl)


# ---------------------------------------------------------------------------------------------------------------- FRM-Editor-20
def aviso(texto):
    return f'<span class="err2 adv t15e-adv" role="status"><span>{texto}</span>{PASAR}</span>'


def editor20(t):
    """«Una condición con números»: el aviso también debajo de la condición de «Fecha de entrega» (229 y 235)."""
    def f(c):
        i = c.index('<span class="v">Fecha de entrega</span>')
        a = c.rindex('<div class="lg-cond">', 0, i)
        j = cierre(c, a, "div")
        return c[:j] + aviso(AVISO_FECHA) + c[j:]
    return cambiar_en(t, s_de(t, "Una condición con números"), 1, f)


# ---------------------------------------------------------------------------------------------------------------- M-FRM-Editor-20
def cond_fecha_tel(con_aviso):
    campos = (f'<div class="ap-cmp"><span class="rt"><span>Pregunta</span></span>{b2.campo("Fecha de entrega", aria="Pregunta")}</div>'
              f'<div class="ap-cmp"><span class="rt"><span>Condición</span></span>{b2.campo("es igual o anterior a", aria="Condición")}'
              '</div><div class="ap-cmp"><span class="rt"><span>Valor</span></span><div class="ct">31/10/2026</div></div>')
    return f'<div class="t-cond">{campos}{aviso(AVISO_FECHA) if con_aviso else ""}</div>'


def editor20_tel(t):
    """La condición de la fecha en la hoja de «Observaciones»; «Uno solo para clientes», con la pieza a pantalla completa."""
    s_num, s_cli, s_paso = s_de(t, "Una condición con números"), s_de(t, "Uno solo para clientes"), s_de(t, "Pasó a «Solo en la app»")
    for s, con_aviso in ((s_num, True), (s_paso, False)):
        t = cambiar_en(t, s, 1, lambda c: una(c, '<span class="t-mas">', cond_fecha_tel(con_aviso) + '<span class="t-mas">'))

    # «Uno solo para clientes»: la hoja de «Monto» da lugar a la pieza abierta, con «Solo en la app» apagada y su motivo (211).
    pieza = b2.pk_tel("Dónde se completa", [("En la app y por WhatsApp", None, True, None), ("Solo en la app", None, False, TIP_CLIENTES)],
                      tip_en="Solo en la app")
    a, b = bloque_de(t, s_cli, 1)
    t = t[:a] + f'<sc-if value="{{{{{s_cli}}}}}" hint-placeholder-val="{{{{no}}}}">{pieza}</sc-if>' + t[b:]

    # «La condición con una fecha»: el mismo estado, con la hoja bajada hasta el final (no entran las dos condiciones en 844).
    s_ult = s_de(t, "Pasó a «Solo en la app»")
    t, sv = sumar_estados(t, [("Una condición con números", "La condición con una fecha")])
    s_nuevo = sv["La condición con una fecha"]
    s_num = s_de(t, "Una condición con números")
    cuerpo = renombrar(t[slice(*bloque_de(t, s_num, 0))], s_num, s_nuevo)
    capa = renombrar(t[slice(*bloque_de(t, s_num, 1))], s_num, s_nuevo)
    capa = una(capa, '<div class="hb">', '<div class="hb" style="justify-content: flex-end;">')
    (c, cf), (k, kf) = sc_ifs(t, s_ult)[:2]
    return t[:cf] + cuerpo + t[cf:kf] + capa + t[kf:]


# ---------------------------------------------------------------------------------------------------------------- Ubicación
def lista_tipos(elegido):
    html = b2.lista([b2.op(n, elegida=n == elegido, activa=n == elegido) for n in TIPOS], buscar="", cantidad=f"{len(TIPOS)} tipos")
    # Los doce entran enteros: el elegido es el último.
    return html.replace('<div class="ops">', '<div class="ops" style="max-height: none;">', 1)


def ubicacion(t):
    """«Tipos de respuesta: menú»: la pieza abierta, con los doce tipos, el buscador y la cantidad (262: más de diez)."""
    def f(c):
        a = c.index('<div class="rg2-menu"')
        c = c[:a] + c[cierre(c, a, "div"):]
        cerrado = re.search(r'<div class="ct sel">Ubicación' + SVG + r'</div>', c, re.S).group(0)
        return una(c, cerrado, b2.campo("Ubicación", abierto=True, aria="Tipo de respuesta", extra=lista_tipos("Ubicación")))
    return cambiar_en(t, s_de(t, "Tipos de respuesta: menú"), 1, f)


def ubicacion_tel(t):
    """El tipo en la pieza, y «Elegir el tipo» a pantalla completa (262)."""
    t = una(t, '<div class="ct">Ubicación</div>', b2.campo("Ubicación", aria="Tipo de respuesta"))
    t, sv = sumar_estados(t, [("El tipo «Ubicación»", "Elegir el tipo")])
    s0, s1 = s_de(t, "El tipo «Ubicación»"), sv["Elegir el tipo"]
    a, b = bloque_de(t, s0, 0)
    cuerpo = renombrar(t[a:b], s0, s1)
    pieza = b2.pk_tel("Tipo de respuesta", [(n, None, n == "Ubicación", None) for n in TIPOS], buscar="", cantidad=f"{len(TIPOS)} tipos")
    capa = f'<sc-if value="{{{{{s1}}}}}" hint-placeholder-val="{{{{no}}}}">{pieza}</sc-if>'
    t = t[:b] + cuerpo + t[b:]
    k = fin_de_ap(t)
    return t[:k] + capa + t[k:]


# ---------------------------------------------------------------------------------------------------------------- Listas
BANDA_WA = ('<button type="button" class="cb cb-pri" aria-disabled="true" title="Primero guardá los cambios.">Publicar en WhatsApp</button>'
            '<a class="cb cb-sec" href="FRM-Publicar-20.dc.html">Ver vista oficial</a>')
BANDA_APP = '<button type="button" class="cb cb-pri" aria-disabled="true" title="Primero guardá los cambios.">Publicar</button>'
PREGUNTA_ZONA = re.compile(r'<span class="rt">Pregunta</span><div class="ct sel"><span class="v">Zona</span>' + SVG + r'</div>', re.S)


def info_donde(c):
    """La (i) de «Dónde se completa», con el ícono de la (i) del prefijo."""
    m = re.search(r'<span class="f-i" tabindex="0" role="img" aria-label="Las respuestas se numeran [^"]*" title="[^"]*">(' + SVG
                  + r')</span>', c, re.S)
    return f'<span class="f-i" tabindex="0" role="img" aria-label="{INFO_DONDE}" title="{INFO_DONDE}">{m.group(1)}</span>'


def con_donde(c, valor):
    """«Dónde se completa» al lado del prefijo (229), como en `FRM-Editor-20`."""
    i = c.index('<div class="w-cmp"><span class="rt">Prefijo de numeración')
    j = cierre(c, i, "div")
    campo = (f'<div class="w-cmp t15e-donde"><span class="rt">Dónde se completa <span class="req">*</span>{info_donde(c)}</span>'
             f'{donde_campo(valor)}</div>')
    return c[:j] + campo + c[j:]


def vista_app(c):
    """La vista previa de la app (SA2-A), con las mismas preguntas que la de WhatsApp de ese estado."""
    i = c.index('<div class="pv">')
    j = cierre(c, i, "div")
    campos = []
    for m in re.finditer(r'<div class="pv-c">([^<]*)(<div class="pv-(in|rd)[^"]*">.*?</div>)</div>', c[i:j], re.S):
        rotulo, control, clase = m.group(1).strip(), m.group(2), m.group(3)
        opcional = rotulo.endswith("(opcional)")
        rotulo = rotulo.removesuffix("(opcional)").strip()
        if clase == "rd" or ELEGI in control:
            ctl = b2.campo(ELEGI, vacio=True, aria=rotulo)
        else:
            ctl = '<div class="ct area"></div>' if "area" in control else '<div class="ct"></div>'
        req = "" if opcional else ' <span class="req">*</span>'
        campos.append(f'<div class="w-cmp"><span class="rt">{rotulo}{req}</span>{ctl}</div>')
    assert campos
    pv = ('<div class="pv"><div class="w-caja t15e-pva" role="region" aria-label="Vista previa en la app"><div class="f-cab"><span>Nueva '
          f'respuesta</span></div><div class="t15e-pvb">{"".join(campos)}</div><div class="t15e-pvp"><button type="button" '
          'class="cb cb-pri" aria-disabled="true" title="Es una vista previa: no se envía.">Enviar</button></div></div></div>')
    return c[:i] + pv + c[j:]


def lista_anteriores():
    return b2.lista([b2.op(n, elegida=n == "Zona", activa=n == "Zona", apagada=None if n == "Zona" else NO_SIRVE,
                           tip_abierto=n == TIP_ANTERIOR) for n in ANTERIORES])


def listas(t):
    """«Dónde se completa» en «Solo en la app» y «Publicar» (229); la pregunta de la que depende, en la pieza (262 y 269)."""
    nombres = ["Según otra respuesta", "Agregar filtro: menú", "La pregunta va después", "Sin preguntas que sirvan"]
    s_cli = s_de(t, "Un formulario para clientes")
    for n in nombres:
        s = s_de(t, n)
        t = cambiar_en(t, s, 0, lambda c: una(c, BANDA_WA, BANDA_APP))
        t = cambiar_en(t, s, 1, lambda c: vista_app(con_donde(c, "Solo en la app")))
    t = cambiar_en(t, s_cli, 1, lambda c: con_donde(una(c, '<div class="ct sel">Empleados', '<div class="ct sel">Clientes'),
                                                     "En la app y por WhatsApp"))

    # Dos estados nuevos, del primero: la pregunta abierta, y guardar sin elegirla (O16).
    s0 = s_de(t, "Según otra respuesta")
    t, sv = sumar_estados(t, [("Según otra respuesta", "Elegir la pregunta"), ("La pregunta va después", "Falta la pregunta")])
    (b, bf), (c, cf) = sc_ifs(t, s0)[:2]
    banda, cuerpo = t[b:bf], t[c:cf]
    s_e, s_f = sv["Elegir la pregunta"], sv["Falta la pregunta"]
    abierta = '<span class="rt">Pregunta</span>' + b2.campo("Zona", abierto=True, aria="Pregunta", extra=lista_anteriores())
    falta = ('<span class="rt">Pregunta</span>' + b2.campo(ELEGI_PREGUNTA, vacio=True, error=True, aria="Pregunta")
             + f'<span class="err2" role="alert">{FALTA_PREGUNTA}</span>')
    c_e, n = PREGUNTA_ZONA.subn(lambda m: abierta, renombrar(cuerpo, s0, s_e))
    assert n == 1, n
    c_f, n = PREGUNTA_ZONA.subn(lambda m: falta, renombrar(cuerpo, s0, s_f))
    assert n == 1, n
    c_f = re.sub(r'<div class="q-res">.*?</div>', "", c_f, count=1, flags=re.S)
    bandas = renombrar(banda, s0, s_e) + renombrar(banda, s0, s_f)
    s_ult = s_de(t, "Un formulario para clientes")
    (ub, ubf), (uc, ucf) = sc_ifs(t, s_ult)[:2]
    return t[:ubf] + bandas + t[ubf:ucf] + c_e + c_f + t[ucf:]


def tarjeta_filtro(pregunta):
    datos = (f'<span class="c"><span class="k">Campo</span><span class="v">Zona</span></span>'
             f'<span class="c"><span class="k">Pregunta</span><span class="v">{pregunta}</span></span>')
    return ('<div class="ap-grupo"><div class="b2-tj"><a class="b2-tj-a" href="#"><span class="cu"><span class="nm">Según otra respuesta</span>'
            f'<span class="dl">{datos}</span></span></a><button type="button" class="keb" aria-label="Acciones del filtro">{b2.SVG_KEB}'
            '</button></div></div>')


def hoja_filtro(pregunta_html):
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Según otra respuesta"><span class="asa"></span>'
            f'<div class="hc"><div><h2>Según otra respuesta</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{b2.SVG_X}'
            f'</button></div><div class="hb"><div class="ap-cmp"><span class="rt"><span>Campo</span></span>{b2.campo("Zona", aria="Campo")}'
            f'</div><div class="ap-cmp"><span class="rt"><span>Pregunta</span></span>{pregunta_html}</div></div>'
            '<div class="hp"><button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'
            '</div></div>')


FILA_FILTRO = re.compile(r'<div class="ap-grupo"><div class="q-row"><span class="tx"><b>Zona</b><span>Según otra respuesta · Zona</span>'
                         r'</span><button type="button" class="ap-ib" aria-label="Quitar el filtro">' + SVG + r'</button></div></div>', re.S)


def listas_tel(t):
    """El filtro, una tarjeta con su ⋮ (261 y 263); el campo y la pregunta, en la pieza, en la hoja del filtro (262 y 269)."""
    t, n = FILA_FILTRO.subn(lambda m: tarjeta_filtro("Zona"), t)
    assert n == 2, n
    s0, s_menu = s_de(t, "Según otra respuesta"), s_de(t, "Agregar filtro")
    t, sv = sumar_estados(t, [("Según otra respuesta", "Editar el filtro"), ("Editar el filtro", "Elegir la pregunta"),
                              ("Agregar filtro", "Falta la pregunta")])
    a, b = bloque_de(t, s0, 0)
    base = t[a:b]
    cuerpos, capas = "", ""
    pk = b2.pk_tel("Pregunta", [(n, None, n == "Zona", None if n == "Zona" else NO_SIRVE) for n in ANTERIORES], tip_en=TIP_ANTERIOR)
    falta = (b2.campo(ELEGI_PREGUNTA, vacio=True, error=True, aria="Pregunta") + f'<span class="err2" role="alert">{FALTA_PREGUNTA}</span>')
    for nombre, capa in (("Editar el filtro", hoja_filtro(b2.campo("Zona", aria="Pregunta"))), ("Elegir la pregunta", pk),
                         ("Falta la pregunta", hoja_filtro(falta))):
        s = sv[nombre]
        cuerpo = renombrar(base, s0, s)
        if nombre == "Falta la pregunta":
            cuerpo = una(cuerpo, tarjeta_filtro("Zona"), tarjeta_filtro(b2.NADA_T))
            cuerpo = re.sub(r'<div class="ap-txt-l"[^>]*><b>[^<]*</b></div>', "", cuerpo, count=1)
        cuerpos += cuerpo
        capas += f'<sc-if value="{{{{{s}}}}}" hint-placeholder-val="{{{{no}}}}">{capa}</sc-if>'
    (c, cf), (k, kf) = sc_ifs(t, s_menu)[:2]
    return t[:cf] + cuerpos + t[cf:kf] + capas + t[kf:]


# ---------------------------------------------------------------------------------------------------------------- después
def pasada_y_panel():
    """La escala de la compu (`traspaso10_piezas_1004.py`) y el panel en dos grupos (275), sin cambiar los finales de línea."""
    tableros = ",".join(COMPU + TELEFONOS)
    subprocess.run([sys.executable, str(GEN / "traspaso10_piezas_1004.py"), "--tableros", tableros], check=True)
    for nombre in COMPU:
        ruta = PROJ / f"{nombre}.dc.html"
        t = io.open(ruta, encoding="utf-8", newline="").read()
        nl = "\r\n" if "\r\n" in t else "\n"
        t = t.replace("\r\n", "\n")
        nuevo, n = e14p.PANEL.subn(lambda m: e14p.partir(m.group(0)), t)
        assert n, f"{nombre} no tiene el panel"
        if e14p.BLOQUE not in nuevo:
            nuevo = nuevo.replace("</helmet>", e14p.CSS + "</helmet>", 1)
        if nuevo != t:
            io.open(ruta, "w", encoding="utf-8", newline="").write(nuevo.replace("\n", nl))
        print("panel en dos grupos:", nombre, n, "(sin cambios)" if nuevo == t else "")


if __name__ == "__main__":
    compu("FRM-Editor-20", editor20)
    telefono("M-FRM-Editor-20", editor20_tel)
    compu("FRM-Publicar-20")
    telefono("M-FRM-Publicar-20")
    compu("FRM-Editor-Ubicacion", ubicacion)
    telefono("M-FRM-Editor-Ubicacion", ubicacion_tel)
    compu("FRM-Editor-Listas", listas)
    telefono("M-FRM-Editor-Listas", listas_tel)
    pasada_y_panel()
