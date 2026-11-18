"""Los tableros de Formularios con dos reglas del traspaso 15 que el usuario aprobó el 2026-11-18, las decisiones 209 y 206 de la
hoja de ruta del back (§5), que dicen `docs/rules/pantallas-y-ui.md` y `paginado-y-listados.md` del front y las specs 12, 18 y 21:

- **qué va a la vista y qué en el ⋮** (209): a la vista, con texto, la tarea de la pantalla, con la principal al final, y lo que
  lleva a otro lado o baja algo, como íconos en un panel; en el ⋮, lo demás que se hace con el objeto, con lo destructivo al final,
  en rojo y después de una línea. El orden: la tarea, ir y bajar, el ⋮ y al final ↑ ↓ ×.
  - el editor de un catálogo (`FRM-Catalogo` y sus variantes de etapa): «Dar de baja» y «Reactivar» salen de la banda y van al ⋮
    «Acciones de …», después de «Descartar» y «Guardar cambios», como el editor de formularios (`FRM-Editor-21`,
    `FRM-Dar-De-Baja`). «Dar de baja» no es destructivo (se reactiva): va con su ícono en gris, como en el ⋮ de los formularios y
    en «Criterio · Botones»; en la hoja del teléfono (`M-FRM-Catalogo`) deja el rojo por lo mismo. Sin nada para el ⋮ (un catálogo
    nuevo, la propuesta del asistente, solo lectura) no hay ⋮. `FRM-Catalogo` suma «Acciones del catálogo» y «De baja: acciones»,
    con el ⋮ abierto. La propuesta del asistente («Aprobar y activar», «Descartar propuesta») sigue a la vista: es la tarea;
  - una respuesta, en la vista rápida (`d4-ac`): «Corregir» sale de la fila del título y va al ⋮ «Más acciones», arriba de
    «Anular», que va al final, en rojo y después de una línea; el ⋮ pasa después de los íconos de ir y bajar (pantalla completa,
    conversación y el PDF), antes de ↑ ↓ ×. En la pantalla completa, lo mismo, y «5 de 10» ↑ ↓ pasan al final de la banda, también
    en las pantallas completas de antes de la 21 (`FRM-Respuesta-Completa`, `-Completa-18`, `-19` y `-20`). La vista rápida de la
    25 (`FRM-Respuesta-25`) lleva la pantalla completa y la conversación como íconos en la fila del título, como las demás.
    «Aprobar» y «Rechazar» siguen a la vista donde estaban, en el momento «Por aprobar» (y fijos al pie en el teléfono);
  - en el teléfono, el ⋮ de la barra abre la hoja con «Corregir» y «Anular» al final, en rojo; «Corregir» sale de la barra;
- **un dato por columna** (206): en la planilla, el bloque dice su cantidad («3 ítems», «1 ítem») y no los nombres, con su columna
  del ancho de ese dato, y los documentos, «1 documento» en lugar de «1 PDF»; las fotos siguen con su miniatura y «2 fotos», y el
  detalle de una respuesta y el PDF siguen mostrando cada ítem. «Corregida» va en su columna, con «Sí» o «—», y solo si alguna fila
  lo está: ninguna planilla dibujaba una fila corregida, así que `FRM-Respuesta-Corregir` suma «Corregida: la planilla», lo que se
  ve al guardar la corrección desde el panel (spec 21): la planilla releída con la columna y la vista rápida de la corrección;
- **dos diálogos con la lista de chequeo** (213): la revisión de `FRM-Catalogo-Importar` lleva Archivo, Hoja, Filas leídas y Sin
  cambios en un `DetailGrid` (`g-det`), en lugar de un renglón con « · »; «¿Aprobar VIS-000130?» dice en una frase quién la cargó
  y cuándo («La cargó Paula Méndez el 15/10/2026, 16:20.»), y quien solo aprueba lee solo cuándo («Se cargó el …»).

La segunda tanda, del mismo día:
- **«Cliente» en su columna** (206): la marca de al lado de quien cargó (o mandó, en «Documentos recibidos») pasa a una columna
  después de «Cargó», con «Sí» o «—», solo en las planillas con alguna fila de un cliente. Se llama «Es cliente» porque las planillas
  de «Visita a cliente» y «Cobro a cliente» ya tienen la columna «Cliente» de su pregunta. En el teléfono, «Cliente» va como texto en
  la línea de datos;
- **«Aprobar» y «Rechazar» en la pantalla completa** de una respuesta que espera una decisión (AC2 de ArquitecturaBase): primeros en
  la banda, antes de «Abrir conversación», y ya no en el momento «Por aprobar otra vez» de la pantalla completa;
- **el tope fuera del título** («Fallas hasta 3»): va en la (i) del título, sumado a la que ya tenga («Hasta 3 fotos. JPG o PNG…»),
  en la carga, la corrección y el diseño del PDF;
- **«Revisando» de importar** (160): el esqueleto lleva la grilla de la revisión, las pestañas y la tabla, del alto del resultado;
- **«Muchas bajas» y «Muchas filas con error»**: la pestaña, la revisión y la confirmación dicen la misma cantidad, y la tabla muestra
  la primera página con su pie.

Quedan como están, a propósito: `FRM-Editor-Baja*`, donde «Reactivar» es publicar, la tarea; las acciones de las filas y la barra
de las elegidas; el pie de los diálogos, y el Archivo (`FRM-Catalogo-Propuesta`, que pasó a la 25).

Corre después de `traspaso15_textos_1004.py`; al terminar imprime los tableros para la pasada de las piezas
(`python traspaso10_piezas_1004.py --tableros …`). Suma estados y usa las piezas que los tableros ya tienen (`e-kw`, `f-menu`,
`g-det`, `d4-*`, `f-i`, `w-pie`); el único CSS nuevo es la barra del esqueleto de importar (`data-t15f="esqueleto"`). No toca
`canvas.json`. Lee y escribe sin cambiar los finales de línea, y se puede volver a correr sin cambiar nada: lo que ya está
hecho no vuelve a encontrar lo que busca, y un estado sumado no se suma otra vez.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t)


def cambiar(t, viejo, nuevo, veces):
    """`viejo` por `nuevo`, que está `veces` veces. Si ya no está, es una corrida anterior (y `nuevo` tiene que estar)."""
    k = t.count(viejo)
    if k == 0:
        assert nuevo in t, ("no encuentro", viejo[:160])
        return t
    assert k == veces, (viejo[:160], k, veces)
    return t.replace(viejo, nuevo)


def cierre(t, i, etiqueta):
    """El fin del elemento `<etiqueta …>` que empieza en `i`, contando los del mismo nombre que tiene adentro."""
    prof = 0
    for m in re.compile(rf"<{etiqueta}\b|</{etiqueta}>").finditer(t, i):
        prof += 1 if m.group(0) != f"</{etiqueta}>" else -1
        if prof == 0:
            return m.end()
    raise AssertionError(f"<{etiqueta}> sin cerrar en {i}")


# ---------------------------------------------------------------------------------------------------------------- las piezas
def svg(trazos, clase=""):
    c = f' class="{clase}"' if clase else ""
    return (f'<svg{c} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{trazos}</svg>')


PUNTOS = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
          '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
# Los dibujos que el lienzo ya usa para cada acción: «Dar de baja» y «Reactivar» como en el ⋮ de `FRM-Formularios-21`, el lápiz
# de «Corregir» y el tacho de «Anular» como en «Criterio · Botones».
I_BAJA = svg('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>', "mi-ic")
I_REACTIVAR = svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>', "mi-ic")
I_CORREGIR = svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>', "mi-ic")
I_ANULAR = svg('<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/>', "mi-ic")
I_COMPLETA = svg('<path d="M14 4h6v6"/><path d="m20 4-7 7"/><path d="M10 20H4v-6"/><path d="m4 20 7-7"/>')
I_CHAT = svg('<path d="M5 5h14v10H9l-4 4z"/>')
LAPIZ = svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>')


def kw_banda(nombre, items=None):
    """El ⋮ de la banda de un editor, como el de `FRM-Editor-21`; con `items`, abierto."""
    etiqueta = f"Acciones de {nombre}"
    menu = f'<div class="f-menu" role="menu" aria-label="{etiqueta}">{items}</div>' if items else ""
    return (f'<span class="e-kw"><button type="button" class="ib o-borde" aria-label="{etiqueta}" aria-haspopup="menu" '
            f'aria-expanded="{"true" if items else "false"}">{PUNTOS}</button>{menu}</span>')


def mi(icono, texto, clase="f-mi", href=None):
    if href:
        return f'<a class="{clase}" role="menuitem" href="{href}">{icono} {texto}</a>'
    return f'<span class="{clase}" role="menuitem">{icono} {texto}</span>'


SEP = '<span class="f-sep" role="separator"></span>'


def menu_respuesta(corregir):
    """Lo que tiene el ⋮ «Más acciones» de una respuesta: «Corregir» y, después de una línea, «Anular» en rojo."""
    return mi(I_CORREGIR, "Corregir", href=corregir) + SEP + mi(I_ANULAR, "Anular", "f-mi pel")


# ---------------------------------------------------------------------------------------------------------------- los estados
def sumar_estado(t, base, nombre, despues_de, cambio):
    """Suma el estado `nombre` clonando los bloques del estado `base` (su índice), con `cambio` sobre lo clonado. Va en el Tweak
    después de `despues_de`, y en la lógica al final de la lista, así los estados que ya están conservan su número."""
    m = re.search(r'"estado":\{"editor":"enum","options":\[([^\]]*)\]', t)
    opciones = json.loads("[" + m.group(1) + "]")
    if nombre in opciones:
        return t
    mk = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    lista = json.loads(mk.group(1))
    nuevo = len(lista)
    opciones.insert(opciones.index(despues_de) + 1, nombre)
    t = t[:m.start(1)] + ",".join(json.dumps(o, ensure_ascii=False) for o in opciones) + t[m.end(1):]
    mk = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    t = t[:mk.start(1)] + json.dumps(lista + [nombre], ensure_ascii=False) + t[mk.end(1):]
    n = "\r\n" if "\r\n" in t else "\n"
    ultimo = f"      s{nuevo - 1}: k === {nuevo - 1},{n}"
    t = cambiar(t, ultimo, ultimo + f"      s{nuevo}: k === {nuevo},{n}", 1)
    # Lo que la lógica elige por estado (`miga: [...][k]`) lleva también el del nuevo, igual al de la base.
    for ma in list(re.finditer(r"(\w+): (\[[^\]]*\])\[k\]", t)):
        valores = json.loads(ma.group(2))
        assert len(valores) == nuevo, (ma.group(1), len(valores), nuevo)
        t = t.replace(ma.group(0), f"{ma.group(1)}: {json.dumps(valores + [valores[base]], ensure_ascii=False)}[k]", 1)
    # Cada bloque de la base, clonado justo después del suyo.
    apertura = re.compile(r'<sc-if value="\{\{s' + str(base) + r'\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">')
    bloques, i = [], 0
    for ma in apertura.finditer(t):
        fin = cierre(t, ma.start(), "sc-if")
        bloques.append((ma.start(), fin))
    assert bloques, base
    partes, i = [], 0
    for numero, (a, b) in enumerate(bloques):
        original = t[a:b]
        copia = apertura.sub(f'<sc-if value="{{{{s{nuevo}}}}}" hint-placeholder-val="{{{{no}}}}">', original, count=1)
        partes += [t[i:b], cambio(numero, copia)]
        i = b
    partes.append(t[i:])
    return "".join(partes)


# ---------------------------------------------------------------------------------------------------------------- 1 · catálogos
CATALOGOS = {  # cuántas bandas tienen «Dar de baja» a la vista
    "FRM-Catalogo": 22, "FRM-Catalogo-13": 10, "FRM-Catalogo-14": 5, "FRM-Catalogo-16": 1, "FRM-Catalogo-Campos": 1,
    "FRM-Catalogo-Contactos": 9, "FRM-Catalogo-Filtros": 8, "FRM-Catalogo-Importar": 1, "FRM-Catalogo-Opciones": 1,
    "FRM-Catalogo-Opciones-13": 1, "FRM-Catalogo-Propuesta-25": 1, "FRM-Catalogo-Tipo": 4,
}
BAJA_VISTA = '<div class="ac"><button type="button" class="cb cb-sec">Dar de baja</button>'
REACTIVAR_VISTA = '<div class="ac"><button type="button" class="cb cb-pri">Reactivar</button></div>'


def nombre_banda(t, i):
    """El nombre del catálogo: el `<h1>` de la banda que termina en `i`."""
    h = t.rfind("<h1>", 0, i)
    assert h >= 0 and t.rfind('<div class="w-bnd">', 0, i) < h, i
    return t[h + 4:t.index("</h1>", h)]


def catalogo(t, nombre, veces):
    k = t.count(BAJA_VISTA)
    if k == 0:
        assert 'class="ib o-borde" aria-label="Acciones de ' in t, nombre
    else:
        assert k == veces, (nombre, k, veces)
    while BAJA_VISTA in t:
        i = t.index(BAJA_VISTA)
        fin = t.index("</div>", i)
        assert "<div" not in t[i + len(BAJA_VISTA):fin], (nombre, t[i:fin])
        resto = t[i + len(BAJA_VISTA):fin]
        t = t[:i] + '<div class="ac">' + resto + kw_banda(nombre_banda(t, i)) + t[fin:]
    if nombre == "FRM-Catalogo":
        if REACTIVAR_VISTA in t:
            i = t.index(REACTIVAR_VISTA)
            t = t[:i] + '<div class="ac">' + kw_banda(nombre_banda(t, i)) + "</div>" + t[i + len(REACTIVAR_VISTA):]
        abrir_baja = lambda n, c: c.replace(kw_banda("Motivos de visita"), kw_banda("Motivos de visita", mi(I_BAJA, "Dar de baja")), 1)
        abrir_reactivar = lambda n, c: c.replace(kw_banda("Motivos de visita"), kw_banda("Motivos de visita", mi(I_REACTIVAR, "Reactivar")), 1)
        t = sumar_estado(t, 0, "Acciones del catálogo", "Más acciones", abrir_baja)
        t = sumar_estado(t, 19, "De baja: acciones", "De baja", abrir_reactivar)
        for clave in ("Dar de baja</span></div></span>", "Reactivar</span></div></span>"):
            assert t.count(clave) == 1, (nombre, clave, t.count(clave))
    return t


def catalogo_tel(t):
    """La hoja del ⋮ del teléfono: «Dar de baja el catálogo» al final, sin el rojo (se reactiva)."""
    return cambiar(t, '<span class="pel" role="menuitem">Dar de baja el catálogo</span>', '<span role="menuitem">Dar de baja el catálogo</span>', 1)


# ---------------------------------------------------------------------------------------------------------------- 2 · una respuesta
CO = re.compile(r'<a class="cb cb-sec d4-co" href="([^"]*)"><svg[^>]*>.*?</svg> Corregir</a>', re.S)
ANULAR_SOLO = '<span class="f-mi pel" role="menuitem">Anular</span>'


def con_menu(kw, corregir):
    """El ⋮ abierto con «Anular» solo pasa a tener «Corregir», la línea y «Anular»."""
    return kw.replace(ANULAR_SOLO, menu_respuesta(corregir), 1)


def acciones(inner, nombre):
    """Lo de la fila del título (o de la banda) sin «Corregir», con el ⋮ después de ir y bajar."""
    m = CO.search(inner)
    if not m:
        return inner
    corregir = m.group(1)
    inner = inner[:m.start()] + inner[m.end():]
    i = inner.find('<span class="e-kw">')
    assert i >= 0, (nombre, inner[:200])
    j = cierre(inner, i, "span")
    kw = con_menu(inner[i:j], corregir)
    return inner[:i] + inner[j:] + kw


def panel(t, nombre):
    """La vista rápida: `<span class="d4-ac">…</span>`."""
    partes, i, n = [], 0, 0
    for m in re.finditer(r'<span class="d4-ac">', t):
        if m.start() < i:
            continue
        fin = cierre(t, m.start(), "span")
        inner = t[m.end():fin - len("</span>")]
        partes += [t[i:m.end()], acciones(inner, nombre), "</span>"]
        i = fin
        n += 1
    partes.append(t[i:])
    return "".join(partes), n


NAV = re.compile(r'<span class="rc-pos">[^<]*</span><button type="button" class="nv" aria-label="Respuesta anterior"[^>]*>'
                 r'<svg[^>]*>.*?</svg></button><button type="button" class="nv" aria-label="Respuesta siguiente"[^>]*><svg[^>]*>.*?</svg></button>', re.S)


def pantalla(t, nombre):
    """La banda de la pantalla completa: sin «Corregir», el ⋮ después de ir y bajar y «5 de 10» ↑ ↓ al final. Cuenta también
    las que ya lo tienen al final, de una corrida anterior."""
    partes, i, n = [], 0, 0
    for m in re.finditer(r'<div class="ac">', t):
        if m.start() < i:
            continue
        fin = cierre(t, m.start(), "div")
        inner = t[m.end():fin - len("</div>")]
        if '<span class="rc-pos">' not in inner:
            continue
        n += 1
        nav = NAV.match(inner)
        if not nav:
            ya = NAV.search(inner)
            assert ya and ya.end() == len(inner) and not CO.search(inner), (nombre, inner[:200])
            continue
        resto = acciones(inner[nav.end():], nombre)
        partes += [t[i:m.start()], '<div class="ac">', resto, nav.group(0), "</div>"]
        i = fin
    partes.append(t[i:])
    return "".join(partes), n


def panel_25(t):
    """La vista rápida de la 25: la pantalla completa y la conversación, como íconos en la fila del título."""
    patron = re.compile(r'(<div class="d2-h"><b>[A-Z]{3}-\d{6}</b>)(<button type="button" class="nv" aria-label="Respuesta anterior".*?</div>)'
                        r'<div class="d2-acc"><a class="cb cb-sec" href="([^"]*)">Abrir en pantalla completa</a><a class="d2-ln" href="([^"]*)">Abrir conversación</a></div>', re.S)
    k = len(patron.findall(t))
    if k == 0:
        assert 'aria-label="Abrir en pantalla completa" title="Abrir en pantalla completa">' in t
        return t
    assert k == 3, k

    def uno(m):
        iconos = (f'<a class="ib" href="{m.group(3)}" aria-label="Abrir en pantalla completa" title="Abrir en pantalla completa">{I_COMPLETA}</a>'
                  f'<a class="ib" href="{m.group(4)}" aria-label="Abrir conversación" title="Abrir conversación">{I_CHAT}</a>')
        return m.group(1) + iconos + m.group(2)
    return patron.sub(uno, t)


RESPUESTAS = {  # tablero: (vistas rápidas con acciones, bandas de pantalla completa)
    "FRM-Respuesta-Anular": (4, 0), "FRM-Respuesta-Aprobacion": (13, 0), "FRM-Respuesta-Cadena": (3, 0),
    "FRM-Respuesta-Corregir": (0, 3), "FRM-Respuestas-21": (3, 0), "FRM-Respuestas-Propias-21": (4, 0),
    "FRM-Respuesta-Completa": (0, 4), "FRM-Respuesta-Completa-18": (0, 2), "FRM-Respuesta-19": (0, 1), "FRM-Respuesta-20": (0, 1),
}
AP_CO = '<a class="ap-co" href="M-FRM-Respuesta-Corregir.dc.html">' + LAPIZ + " Corregir</a>"
HOJA_ANULAR = '<div class="ap-acciones2"><span role="menuitem" style="color: var(--peligro);">Anular</span></div>'
HOJA_NUEVA = '<div class="ap-acciones2"><span role="menuitem">Corregir</span><span role="menuitem" style="color: var(--peligro);">Anular</span></div>'
TELEFONOS = {  # tablero: (barras con «Corregir», hojas «Más acciones»)
    "M-FRM-Respuesta-Anular": (2, 1), "M-FRM-Respuesta-Aprobacion": (8, 0), "M-FRM-Respuesta-Corregir": (3, 1),
    "M-FRM-Respuestas-Propias-21": (1, 0),
}


def telefono(t, nombre):
    barras, hojas = TELEFONOS[nombre]
    t = cambiar(t, AP_CO, "", barras) if barras and AP_CO in t else t
    assert AP_CO not in t, nombre
    if hojas:
        t = cambiar(t, HOJA_ANULAR, HOJA_NUEVA, hojas)
    return t


# ---------------------------------------------------------------------------------------------------------------- 3 · la planilla
BLOQUE = re.compile(r'<span class="pl-blq"><span class="pl-g">(\d+) ·</span> [^<]*</span>')
PLANILLAS_BLOQUE = {"FRM-Respuestas-19": 14, "FRM-Respuestas-20": 15, "FRM-Respuesta-19": 12, "FRM-Respuesta-20": 7,
                    "FRM-Respuestas-Propias": 12, "FRM-Cargar-Panel": 44}
ANCHO_BLOQUE = "110px"  # «3 ítems» y el encabezado «Productos», como «Monto»
DOCUMENTO = re.compile(r'(<span class="pl-arch"><svg[^>]*>.*?</svg>)1 PDF</span>', re.S)
PLANILLAS_DOC = {"FRM-Respuestas-18": 12, "FRM-Respuesta-18": 9}


def items(m):
    n = int(m.group(1))
    return f'<span class="pl-blq">{n} {"ítem" if n == 1 else "ítems"}</span>'


def anchos_bloque(t):
    """La columna del bloque, del ancho de su dato: en cada planilla con el encabezado «Productos»."""
    def uno(m):
        cols = m.group(1).split()
        heads = re.findall(r"<span[^>]*>(.*?)</span>", m.group(2))
        assert len(cols) == len(heads), (cols, heads)
        if "Productos" in heads:
            cols[heads.index("Productos")] = ANCHO_BLOQUE
        return f'<div class="w-caja pl-caja" style="--pl-cols: {" ".join(cols)};"><div class="pl-scroll"><div class="w-th pl">{m.group(2)}</div>'
    return re.sub(r'<div class="w-caja pl-caja" style="--pl-cols: ([^;]*);"><div class="pl-scroll"><div class="w-th pl">(.*?)</div>', uno, t)


def planilla(t, nombre):
    if nombre in PLANILLAS_BLOQUE:
        k = len(BLOQUE.findall(t))
        assert k in (0, PLANILLAS_BLOQUE[nombre]), (nombre, k)
        assert k or 'class="pl-blq">3 ítems</span>' in t or 'class="pl-blq">2 ítems</span>' in t, nombre
        t = anchos_bloque(BLOQUE.sub(items, t))
    if nombre in PLANILLAS_DOC:
        k = len(DOCUMENTO.findall(t))
        assert k in (0, PLANILLAS_DOC[nombre]), (nombre, k)
        t = DOCUMENTO.sub(r"\g<1>1 documento</span>", t)
    if nombre == "M-FRM-Respuestas-18":
        t = cambiar(t, " · 1 PDF</span>", " · 1 documento</span>", 6)
    return t


# «Corregida» en su columna: la planilla de `FRM-Respuesta-Corregir` después de corregir desde el panel.
COLS_ANTES = "--pl-cols: 112px 116px 136px 170px 96px 160px 128px 116px 56px;"
COLS_CON = "--pl-cols: 112px 116px 96px 136px 170px 96px 160px 128px 116px 56px;"
FILA_126 = re.compile(r'(<div class="w-tr pl sel"><span><a class="pl-num" href="[^"]*">VIS-000126</a></span>)<span><span class="w-est ">Aprobada</span></span>'
                      r'(<span>13/10/2026, 15:30</span>.*?<span class="r">)125\.500,00(</span><span>Venta nueva</span>)<span><button type="button" class="pl-pdf"[^>]*>'
                      r'<svg[^>]*>.*?</svg></button></span>', re.S)
EST = re.compile(r'(<div class="w-tr pl(?: sel)?"><span><a class="pl-num" href="[^"]*">VIS-\d{6}</a></span><span><span class="w-est[^"]*">[^<]*</span></span>)'
                 r'(?!<span>Sí</span>)')
NAV_PANEL = ('<span class="d4-nav"><button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)">'
             '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>'
             '<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">'
             '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>'
             '<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">'
             '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg></button></span>')


def vista_corregida(t):
    """La vista rápida de VIS-000126 corregida, con lo que ya dibuja la pantalla completa de «Corregida» (s8)."""
    i = [m.start() for m in re.finditer(r"\{\{s8\}\}", t)][1]  # el cuerpo de «Corregida»
    a = t.index('<div class="d3-moms">', i)
    momentos = t[a:cierre(t, a, "div")]
    # Lo apagado da su motivo al pasar por encima; acá el tooltip no se dibuja abierto.
    motivo = "La corregiste vos: la aprueba otra persona con el rol Supervisor."
    momentos = cambiar(momentos, f'<span class="e-tip" role="tooltip">{motivo}</span>', "", 1)
    momentos = cambiar(momentos, ' disabled>Rechazar</button>', f' disabled title="{motivo}">Rechazar</button>', 1)
    momentos = cambiar(momentos, ' disabled>Aprobar</button>', f' disabled title="{motivo}">Aprobar</button>', 1)
    g = t.index('<div class="g-det">', i)
    datos = t[g:cierre(t, g, "div")]
    navegar = NAV_PANEL
    return ('<aside class="d2 d4" role="dialog" aria-label="Respuesta VIS-000126"><div class="d2-h d4-h"><div class="d4-t"><b>VIS-000126</b>'
            '<span class="w-est pend">Por aprobar</span><span class="d4-marca">· Corregida</span><span class="d4-ac">'
            f'<a class="ib" href="FRM-Respuesta-Corregir.dc.html" aria-label="Abrir en pantalla completa" title="Abrir en pantalla completa">{I_COMPLETA}</a>'
            f'<a class="ib" href="WA-Chats-Respuesta-21.dc.html" aria-label="Abrir conversación" title="Abrir conversación">{I_CHAT}</a>'
            '<span class="e-kw"><button type="button" class="ib" aria-label="Más acciones" title="Más acciones" aria-haspopup="menu" aria-expanded="false">'
            f'{PUNTOS}</button></span></span></div>{navegar}</div><div class="d4-sub">Visita a cliente · versión 4</div>{momentos}'
            '<div class="o-tabs" role="tablist"><span role="tab" class="on">Respuesta</span><span role="tab" class="">Fotos <span class="c">2</span></span>'
            f'<span role="tab" class="">Actividad</span></div><div class="d2-b">{datos}</div><div class="d2-pie">5 de 10</div></aside>')


def corregida(t):
    if '"Corregida: la planilla"' in t and "{{s11}}" in t:
        return t  # ya está: la vista se arma con los momentos de «Corregida» de antes de subir la decisión a la banda
    vista = vista_corregida(t)

    def cambio(numero, copia):
        if 'class="w-bnd"' in copia[:200]:
            return copia  # la banda de la planilla
        if '<div class="w-body">' in copia[:200]:
            copia = cambiar(copia, COLS_ANTES, COLS_CON, 1)
            copia = cambiar(copia, "<span>Estado</span><span>Recibida</span>", "<span>Estado</span><span>Corregida</span><span>Recibida</span>", 1)
            m = FILA_126.search(copia)
            assert m, "la fila de VIS-000126"
            copia = (copia[:m.start()] + m.group(1) + '<span><span class="w-est pend">Por aprobar</span></span><span>Sí</span>'
                     + m.group(2) + "130.000,00" + m.group(3) + "<span></span>" + copia[m.end():])
            filas = EST.findall(copia)
            assert len(filas) == 9, len(filas)
            return EST.sub(r'\1<span><span class="pl-g">—</span></span>', copia)
        assert '<aside class="d2 cg-panel"' in copia, copia[:200]
        a = copia.index("<aside")
        return copia[:a] + vista + copia[cierre(copia, a, "aside"):]
    t = sumar_estado(t, 2, "Corregida: la planilla", "Corregida", cambio)
    # El aviso de abajo, como al corregir desde la pantalla completa.
    toast = re.search(r'<sc-if value="\{\{s8\}\}" hint-placeholder-val="\{\{no\}\}"><div class="f-toast" role="status">.*?</sc-if>', t, re.S).group(0)
    nuevo = toast.replace("{{s8}}", "{{s11}}", 1)
    if nuevo not in t:
        t = t.replace(toast, toast + nuevo, 1)
    return t


# ---------------------------------------------------------------------------------------------------------------- 5 · los diálogos
REVISION = re.compile(r'<div class="imp-lin"><span><b>([^<]+)</b> · (Hoja \d+) · ([\d.]+) filas leídas · ([\d.]+) no cambian</span></div>')


def revision(m):
    return (f'<div class="g-det"><span class="k">Archivo</span><span>{m.group(1)}</span><span class="k">Hoja</span><span>{m.group(2)}</span>'
            f'<span class="k">Filas leídas</span><span>{m.group(3)}</span><span class="k">Sin cambios</span><span>{m.group(4)}</span></div>')


def importar(t):
    k = len(REVISION.findall(t))
    assert k in (0, 10), k
    assert k or t.count('<span class="k">Filas leídas</span>') == 10
    return REVISION.sub(revision, t)


APROBAR = [
    ("FRM-Respuesta-Aprobacion", '<p class="d-tx">Paula Méndez · 15/10/2026, 16:20</p>', '<p class="d-tx">La cargó Paula Méndez el 15/10/2026, 16:20.</p>', 2),
    ("M-FRM-Respuesta-Aprobacion", '<p class="d-tx">Paula Méndez · 15/10/2026, 16:20</p>', '<p class="d-tx">La cargó Paula Méndez el 15/10/2026, 16:20.</p>', 2),
    # Quien solo aprueba no ve quién la cargó (100): lee solo cuándo.
    ("FRM-Respuestas-21", '<p class="d-tx">13/10/2026, 11:04</p>', '<p class="d-tx">Se cargó el 13/10/2026, 11:04.</p>', 1),
]


# ---------------------------------------------------------------------------------------------------------------- 6 · la segunda tanda
# «Cliente» en su columna (206): la marca de al lado de quien cargó (o mandó) pasa a su columna, después de «Cargó», con «Sí» o «—»,
# solo en las planillas con alguna fila de un cliente, como «Corregida». Se llama «Es cliente» porque «Visita a cliente» y «Cobro a
# cliente» tienen su pregunta «Cliente», que ya es una columna de la misma planilla. En el teléfono, «Cliente» va como texto en la
# línea de datos.
MARCA = '<span class="pl-marca">Cliente</span>'
ES_CLIENTE = "Es cliente"
ANCHO_CLIENTE = "96px"
PLANILLA = re.compile(r'<div class="w-caja pl-caja[^"]*"(?: style="--pl-cols: ([^;"]*);")?><div class="pl-scroll"><div class="w-th pl">')
CLIENTE_TEL = re.compile(r'(<span class="l2">[^<]*)<span class="pl-marca">Cliente</span>')


def hijos(html):
    """Los elementos de primer nivel de `html`: (inicio, fin)."""
    res, i = [], 0
    abre = re.compile(r"<(span|div|a|button)\b")
    while (m := abre.search(html, i)):
        fin = cierre(html, m.start(), m.group(1))
        res.append((m.start(), fin))
        i = fin
    return res


def texto(html):
    return re.sub(r"<[^>]+>", "", html).strip()


def con_cliente(region, cols_base, nombre):
    """Una planilla con alguna fila de un cliente: la columna «Es cliente» después de «Cargó» (o «Mandó»)."""
    a = region.index('<div class="w-th pl">')
    fin_h = cierre(region, a, "div")
    head = region[a + len('<div class="w-th pl">'):fin_h - len("</div>")]
    celdas = hijos(head)
    nombres = [texto(head[i:j]) for i, j in celdas]
    idx = next(k for k, n in enumerate(nombres) if n in ("Cargó", "Mandó"))
    cols = cols_base.split()
    assert len(cols) == len(celdas), (nombre, cols, nombres)
    cols.insert(idx + 1, ANCHO_CLIENTE)
    head = head[:celdas[idx][1]] + f"<span>{ES_CLIENTE}</span>" + head[celdas[idx][1]:]
    m = PLANILLA.match(region)
    apertura = m.group(0).replace(' style="--pl-cols: ' + (m.group(1) or "") + ';"', "")
    apertura = apertura.replace("><div class=\"pl-scroll\">", f' style="--pl-cols: {" ".join(cols)};"><div class="pl-scroll">', 1)
    cuerpo = region[fin_h:]
    partes, i, filas = [], 0, 0
    for mf in re.finditer(r'<div class="w-tr pl[^"]*">', cuerpo):
        if mf.start() < i:
            continue
        fin = cierre(cuerpo, mf.start(), "div")
        fila = cuerpo[mf.end():fin - len("</div>")]
        cs = hijos(fila)
        assert len(cs) == len(celdas), (nombre, len(cs), len(celdas), texto(fila)[:80])
        celda = fila[cs[idx][0]:cs[idx][1]]
        assert "pl-quien" in celda, (nombre, celda[:120])
        nueva = "<span>Sí</span>" if MARCA in celda else '<span><span class="pl-g">—</span></span>'
        fila = fila[:cs[idx][0]] + celda.replace(MARCA, "") + nueva + fila[cs[idx][1]:]
        partes += [cuerpo[i:mf.end()], fila, "</div>"]
        i = fin
        filas += 1
    partes.append(cuerpo[i:])
    assert filas, nombre
    return apertura + head + "</div>" + "".join(partes)


def clientes(t, nombre):
    if nombre.startswith("M-"):
        t = CLIENTE_TEL.sub(r"\1 · Cliente", t)
        assert MARCA not in t, (nombre, "queda «Cliente» al lado del nombre")
        return t
    base = re.search(r"--pl-cols: ([^;]+);", "".join(re.findall(r"<style.*?</style>", t, flags=re.S)))
    partes, i = [], 0
    for m in PLANILLA.finditer(t):
        if m.start() < i:
            continue
        fin = cierre(t, m.start(), "div")
        region = t[m.start():fin]
        if MARCA not in region:
            continue
        partes += [t[i:m.start()], con_cliente(region, m.group(1) or base.group(1), nombre)]
        i = fin
    partes.append(t[i:])
    t = "".join(partes)
    assert MARCA not in t, (nombre, "queda «Cliente» al lado del nombre")
    return t


CLIENTES = ["FRM-Respuesta", "FRM-Respuestas", "FRM-Respuestas-Exportar", "FRM-Respuestas-Filtros", "FRM-Respuesta-18",
            "FRM-Respuestas-18", "FRM-Respuesta-25", "FRM-Respuesta-Anular", "FRM-Respuesta-Aprobacion", "FRM-Respuesta-Cadena",
            "FRM-Respuesta-Corregir", "FRM-Respuestas-21", "FRM-Documentos", "Campana-25",
            "M-FRM-Respuestas", "M-FRM-Respuestas-16", "M-FRM-Respuestas-18"]

# «Aprobar» y «Rechazar» en la pantalla completa (209, AC2 de ArquitecturaBase): mientras espera una decisión, van a la vista y
# primeros en la banda, antes de «Abrir conversación»; en la pantalla completa dejan el momento «Por aprobar otra vez». En la vista
# rápida siguen en el momento, y en el teléfono, fijos al pie.
DECISION = ('<span class="d4-dec"><span class="e-tipw"><button type="button" class="cb cb-sec" disabled>Rechazar</button></span>'
            '<span class="e-tipw"><button type="button" class="cb cb-pri" disabled>Aprobar</button><span class="e-tip" role="tooltip">'
            'La corregiste vos: la aprueba otra persona con el rol Supervisor.</span></span></span>')
BOTONES = DECISION[len('<span class="d4-dec">'):-len("</span>")]


def decision_en_banda(t):
    m = re.search(r'<sc-if value="\{\{s8\}\}" hint-placeholder-val="\{\{no\}\}"><div class="w-bnd">', t)
    a, b = m.start(), cierre(t, m.start(), "sc-if")
    banda = t[a:b]
    if BOTONES not in banda:
        banda = cambiar(banda, '<div class="ac"><a class="cb cb-sec" href="WA-Chats-Respuesta-21.dc.html">',
                        '<div class="ac">' + BOTONES + '<a class="cb cb-sec" href="WA-Chats-Respuesta-21.dc.html">', 1)
        t = t[:a] + banda + t[b:]
    return cambiar(t, DECISION, "", 1) if DECISION in t else t


# El tope de elegir o de subir sale del título («Fallas hasta 3»): va en la (i) del título, sumado a la que ya tenga.
TOPE = re.compile(r'(<span class="rt">)([^<]*?) <span class="cg-hasta">hasta (\d+)</span>'
                  r'(?:<span class="f-i" tabindex="0" role="img" aria-label="([^"]*)" title="[^"]*">)?')
I_INFO = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/></svg>')
TOPES = {"FRM-Cargar-Archivos": 6, "FRM-Cargar-Enviada": 1, "FRM-Cargar-Lista": 9, "FRM-Cargar-Panel": 7, "FRM-Cargar-Respuesta": 7,
         "FRM-Cargar-Respuesta-21": 4, "FRM-Respuesta-Corregir": 12, "FRM-Pdf": 10, "Plat-FRM-Pdf": 6}


def tope(m):
    etiqueta, n = m.group(2), m.group(3)
    que = f"Hasta {n} fotos." if etiqueta.startswith("Foto") else f"Hasta {n} firmas." if etiqueta == "Firmas" else f"Elegí hasta {n}."
    if m.group(4):
        dice = f"{que} {m.group(4)}"
        return f'{m.group(1)}{etiqueta}<span class="f-i" tabindex="0" role="img" aria-label="{dice}" title="{dice}">'
    return f'{m.group(1)}{etiqueta}<span class="f-i" tabindex="0" role="img" aria-label="{que}" title="{que}">{I_INFO}</span>'


def topes(t, nombre):
    k = len(TOPE.findall(t))
    assert k in (0, TOPES[nombre]) and k == t.count('class="cg-hasta"'), (nombre, k, t.count('class="cg-hasta"'))
    return TOPE.sub(tope, t)


# «Revisando» de importar (160): lo que carga ocupa el alto del resultado. El esqueleto lleva la grilla de la revisión, las pestañas y
# la tabla con dos filas, como «Revisión: errores», que es lo que llega.
ESQ_VIEJO = ('<div class="imp-esq"><span style="width: 62%;"></span><span style="width: 100%;"></span><span style="width: 100%;"></span>'
             '<span style="width: 84%;"></span></div>')
COLS_ERR = "grid-template-columns: 70px 120px minmax(0, 1fr);"
COLS_BAJA = "grid-template-columns: 120px minmax(0, 1fr);"


def barra(ancho):
    return f'<i class="t15-b" style="width: {ancho};"></i>'


ESQ_NUEVO = ('<div class="g-det" aria-hidden="true">'
             + "".join(f'<span class="k">{barra(a)}</span><span>{barra(b)}</span>' for a, b in (("42%", "34%"), ("26%", "18%"), ("58%", "14%"), ("50%", "14%")))
             + '</div><div class="imp-tabs" aria-hidden="true">' + "".join(f"<span>{barra(w)}</span>" for w in ("52px", "44px", "58px", "44px"))
             + f'</div><div class="imp-tabla" aria-hidden="true"><div class="c" style="{COLS_ERR}"><span class="n">{barra("26px")}</span><span>{barra("56px")}</span><span>{barra("70px")}</span></div>'
             + "".join(f'<div class="f" style="{COLS_ERR}"><span class="n">{barra("20px")}</span><span>{barra("50px")}</span><span>{barra(w)}</span></div>' for w in ("46%", "38%"))
             + "</div>")
CSS_ESQ = ('<style data-t15f="esqueleto">\n/* 160 · «Revisando»: el esqueleto con la grilla, las pestañas y la tabla de la revisión, así no salta. */\n'
           '.t15-b { display: inline-block; vertical-align: middle; max-width: 100%; height: 10px; border-radius: 3px; background: var(--s3); }\n</style>\n')

# «Muchas bajas» y «Muchas filas con error»: la pestaña, la revisión y la confirmación dicen la misma cantidad. El catálogo tiene 1.097
# opciones: con 412 bajas (el 38%), el archivo trae 678 sin cambios, 5 cambios, 2 errores y 12 altas (697 filas); con 140 filas con
# error (el 13% de 1.106), las demás son 949 sin cambios, 12 altas y 5 cambios. Las tablas muestran la primera página, de 10.
BAJAS = [("PRV-0005", "Aluminios Cuyo"), ("PRV-0012", "Distribuidora Litoral"), ("PRV-0047", "Herrajes Mitre"), ("PRV-0103", "Maderas del Sur"),
         ("PRV-0156", "Sanitarios Centro"), ("PRV-0218", "Vidriería Rivadavia"), ("PRV-0331", "Ferretería Lomas"), ("PRV-0402", "Chapas Rosario"),
         ("PRV-0517", "Electricidad Norte"), ("PRV-0790", "Pinturas Oeste")]
ERRORES = [(37, "Código", "Está repetido en la fila 52."), (88, "Texto", "Tiene más de 30 caracteres."),
           (104, "Código", "Está repetido en la fila 131."), (152, "Texto", "Tiene más de 30 caracteres."),
           (198, "Código", "Está repetido en la fila 240."), (233, "Texto", "Tiene más de 30 caracteres."),
           (287, "Código", "Está repetido en la fila 301."), (342, "Texto", "Tiene más de 30 caracteres."),
           (415, "Código", "Está repetido en la fila 477."), (468, "Texto", "Tiene más de 30 caracteres.")]


def pie(total, paginas):
    return f'<div class="w-pie"><span>1–10 de {total}</span><span>10 por página · Página 1 de {paginas}</span></div>'


TABLA_BAJAS = (f'<div class="imp-tabla"><div class="c" style="{COLS_BAJA}"><span>Código</span><span>Texto</span></div>'
               + "".join(f'<div class="f" style="{COLS_BAJA}"><span><span class="mono">{c}</span></span><span>{x}</span></div>' for c, x in BAJAS)
               + pie("412", "42") + "</div>")
TABLA_ERRORES = (f'<div class="imp-tabla"><div class="c" style="{COLS_ERR}"><span class="n">Fila</span><span>Columna</span><span>Qué pasa</span></div>'
                 + "".join(f'<div class="f" style="{COLS_ERR}"><span class="n">{f}</span><span>{c}</span><span>{q}</span></div>' for f, c, q in ERRORES)
                 + pie("140", "14") + "</div>")
CUANTAS = {  # estado: (cambios en su diálogo, la tabla nueva)
    13: ([('<span class="k">Filas leídas</span><span>1.106</span><span class="k">Sin cambios</span><span>1.084</span>',
           '<span class="k">Filas leídas</span><span>697</span><span class="k">Sin cambios</span><span>678</span>'),
          ('<span class="on" role="tab">Bajas<span class="c">3</span></span>', '<span class="on" role="tab">Bajas<span class="c">412</span></span>')],
         TABLA_BAJAS),
    14: ([('<span class="k">Sin cambios</span><span>1.084</span>', '<span class="k">Sin cambios</span><span>949</span>'),
          ('<span class="on" role="tab">Errores<span class="c">2</span></span>', '<span class="on" role="tab">Errores<span class="c">140</span></span>')],
         TABLA_ERRORES),
}


def importar_2(t):
    t = cambiar(t, ESQ_VIEJO, ESQ_NUEVO, 1)
    n = "\r\n" if "\r\n" in t else "\n"
    if 'data-t15f="esqueleto"' not in t:
        t = t.replace("</helmet>", CSS_ESQ.replace("\n", n) + "</helmet>", 1)
    for estado, (cambios, tabla) in CUANTAS.items():
        m = re.search(r'<sc-if value="\{\{s' + str(estado) + r'\}\}" hint-placeholder-val="\{\{no\}\}"><div class="w-oscuro">', t)
        a, b = m.start(), cierre(t, m.start(), "sc-if")
        bloque = t[a:b]
        for viejo, nuevo in cambios:
            bloque = cambiar(bloque, viejo, nuevo, 1)
        if tabla not in bloque:
            i = bloque.index('<div class="imp-tabla">', bloque.index('role="tablist"'))
            bloque = bloque[:i] + tabla + bloque[cierre(bloque, i, "div"):]
        t = t[:a] + bloque + t[b:]
    return t


# ---------------------------------------------------------------------------------------------------------------- el pase
def pasar(nombre, t):
    if nombre in CATALOGOS:
        t = catalogo(t, nombre, CATALOGOS[nombre])
    if nombre == "M-FRM-Catalogo":
        t = catalogo_tel(t)
    if nombre in RESPUESTAS:
        vr, pc = RESPUESTAS[nombre]
        if nombre == "FRM-Respuesta-Corregir" and "Corregida: la planilla" in t:
            vr = 1  # la vista rápida que suma «Corregida: la planilla»
        t, n = panel(t, nombre)
        assert n == vr, (nombre, "vistas rápidas", n, vr)
        t, n = pantalla(t, nombre)
        assert n == pc, (nombre, "pantallas completas", n, pc)
        assert not CO.search(t), (nombre, "queda «Corregir» a la vista")
    if nombre == "FRM-Respuesta-25":
        t = panel_25(t)
    if nombre in TELEFONOS:
        t = telefono(t, nombre)
    t = planilla(t, nombre)
    if nombre == "FRM-Respuesta-Corregir":
        t = corregida(t)
        t = decision_en_banda(t)
    if nombre == "FRM-Catalogo-Importar":
        t = importar_2(importar(t))
    for tablero, viejo, nuevo, veces in APROBAR:
        if tablero == nombre:
            t = cambiar(t, viejo, nuevo, veces)
    if nombre in TOPES:
        t = topes(t, nombre)
    if nombre in CLIENTES:
        t = clientes(t, nombre)
    return t


TABLEROS = sorted(set(CATALOGOS) | set(RESPUESTAS) | set(TELEFONOS) | set(PLANILLAS_BLOQUE) | set(PLANILLAS_DOC)
                  | {"M-FRM-Catalogo", "FRM-Respuesta-25", "M-FRM-Respuestas-18"} | {a[0] for a in APROBAR} | set(TOPES) | set(CLIENTES))

if __name__ == "__main__":
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    archivo = [n for n in TABLEROS if canvas["boards"].get(f"{n}.dc.html", {}).get("page") in (None, "archivo")]
    assert not archivo, f"no están vivos: {archivo}"
    cambiados = []
    for nombre in TABLEROS:
        t = leer(nombre)
        nuevo = pasar(nombre, t)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    print("ok", len(TABLEROS), "tableros,", len(cambiados), "cambiados")
    if cambiados:
        print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(cambiados))
