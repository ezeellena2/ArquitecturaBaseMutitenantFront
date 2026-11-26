"""Las filas de ejemplo debajo de una flecha de orden van ordenadas de verdad (decisión 287, 2026-11-26), en todos los tableros del
lienzo principal que muestran una flecha en un encabezado o un «Ordenar por» en el teléfono.

Qué hace, tablero por tablero (solo las claves de `boards` de `canvas.json`; los de «Módulos» y las versiones viejas no se tocan):

- **La compu:** cada celda de encabezado con `aria-sort="ascending|descending"` (la flecha ↑/↓ de la 264 en `span.b2-fl`, o la ▲/▼
  de los tableros viejos) manda sobre las filas que la siguen en su contenedor. Formas que reconoce:
  - `div.w-th` y sus `div.w-tr` hermanos, o cualquier otro par (`tt-h`/`tt-f`, `th`/`tr`…): las filas son los hermanos que siguen
    al encabezado y comparten la clase que más se repite; lo demás (el pie con la paginación, un aviso) queda en su lugar;
  - el encabezado en su propio `<sc-if>` (uno por cada orden, como en `FRM-Catalogos`) y las filas, cada una en su `<sc-if>`,
    dentro del `<sc-if>` que sigue. Si dos encabezados de dos estados mandan sobre las mismas filas y piden órdenes distintos,
    manda el del estado que se ve de entrada (`hint-placeholder-val="{{si}}"`) y el otro sale en el informe;
  - la grilla plana de `FRM-Tablero*` (`div.e15-tt`): `role="columnheader"` y `role="cell"` hermanos, de a N celdas por fila;
  - `<tr>` con `<th aria-sort>` y las filas de su `<tbody>`.
  Cada aparición de una tabla se ordena por separado: el mismo listado en otra rama `<sc-if>` puede venir con otra columna. El
  menú ⋮ abierto de una fila (un `<sc-if>` adentro) va con la fila, y una fila envuelta en su propio `<sc-if>` se mueve con él.
- **El teléfono:** debajo de `div.b2-ordtel` («Ordenar por: X, de la A a la Z», «…, de mayor a menor», «…, más reciente primero»;
  y `div.tel-ord` en el ejemplo de `Criterio-Tablas-Base2`), las tarjetas `div.b2-tj` (o `div.tel-tj`), hermanas del «Ordenar
  por» o dentro del primer hermano que las tiene, sin salir de la rama `<sc-if>` del estado, van por el campo X: el `.v` del `.c`
  cuyo `.k` es X, o el nombre `.nm` si ninguna tarjeta tiene un campo X (X es la columna principal).
- **El orden:** texto de la A a la Z en español, sin distinguir mayúsculas ni tildes (la ñ después de la n) y con los números de
  adentro por su valor (`VEH-000031`); números con miles `.` y decimales `,`, montos con su moneda y porcentajes por su valor;
  fechas `dd/mm/aaaa` con o sin `, hh:mm`. Una columna se lee como número o fecha solo si todas sus celdas con dato lo son (un
  texto que dice que no hay dato, como «Sin respuesta» o «Nunca», cuenta como vacío); si no, como texto. «De mayor a menor» y «más
  reciente primero» (y `descending`) es al revés. Lo que no tiene dato («—», vacío) va al final en los dos sentidos, y los empates
  conservan el orden de antes. En una columna de nombres, lo que se muestra porque no hay nombre (un teléfono, un correo
  o «Cuenta borrada») también va al final, como en la app, que ordena por el nombre. Un «Estado» o un «Tipo» va por su circuito (Recibida, Por aprobar, Aprobada, Rechazada, Anulada:
  `Criterio-Tablas-Base2`), también con «Ordenar por: Estado, por el circuito»; «activos primero» pone primero las filas cuyo
  estado empieza con «Activ», y «de X a Y» pone X primero e Y último cuando entre los dos hay un solo valor.

Qué no toca: los textos, las clases y los estilos (solo cambia de lugar elementos enteros de fila o de tarjeta; lo que hay entre
ellos queda donde estaba); las filas fijas, que quedan en su lugar (la celda que ordena dice «Otras», «Otros» o «Total», o la fila
tiene una clase `tot`/`total`); un orden propio que no se deduce del texto; un «Ordenar por» del teléfono sin columna (el orden
compuesto); las tablas que arma el JavaScript del tablero (`<sc-for>`); y las filas que no tienen la celda de la columna. Todo eso
sale en el informe de `--detectar`, con el motivo.

Uso:
    python orden_filas_1004.py --detectar [--detalle]  # no escribe: cada tabla con flecha, su columna y qué cambiaría
                                                       # (--detalle: también las que ya están en orden)
    python orden_filas_1004.py --aplicar [--dir D]     # escribe en D (por defecto, la carpeta del lienzo)
Correrlo dos veces no cambia nada la segunda. Conserva los finales de línea de cada archivo (`newline=""`). No toca `canvas.json`.
"""
import argparse
import html
import json
import pathlib
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
LIENZO = pathlib.Path(__file__).resolve().parent.parent

VACIOS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
CRUDOS = {"script", "style", "textarea", "title"}
TAG = re.compile(r'<(/?)([a-zA-Z][\w:.-]*)((?:\s+[^\s=/>"\']+(?:\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>"\']+))?)*)\s*(/?)>')
SIN_DATO = {"", "—", "-", "–", "--"}
NADA = re.compile(r"^(sin |nunca|ninguno|ninguna|todavía|aún no|no )", re.I)
ORDTEL = {"b2-ordtel", "tel-ord"}  # «Ordenar por» del teléfono (tel-ord: el ejemplo de Criterio-Tablas-Base2)
TARJETA = {"b2-tj", "tel-tj"}
FIJAS = re.compile(r"^(otras|otros|total|totales)\b", re.I)
# Lo que se muestra en lugar de un nombre que no hay: un teléfono, un correo o «Cuenta borrada» (va al final, como sin dato).
SIN_NOMBRE = re.compile(r"^(\+?[\d\s()-]{7,}|[^\s@]+@[^\s@]+|(cuenta|usuario|persona) borrad[ao])$", re.I)


# ---------------------------------------------------------------- árbol con posiciones exactas en el texto
class Nodo:
    __slots__ = ("tag", "attrs", "s", "oe", "ce", "e", "padre", "hijos")

    def __init__(self, tag, attrs, s, oe, padre):
        self.tag, self.attrs, self.s, self.oe, self.padre = tag, attrs, s, oe, padre
        self.ce = self.e = oe
        self.hijos = []

    def attr(self, nombre):
        m = re.search(r'(?:^|\s)' + re.escape(nombre) + r'\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))', self.attrs)
        return None if not m else next(g for g in m.groups() if g is not None)

    def clases(self):
        return (self.attr("class") or "").split()


def arbol(src):
    raiz = Nodo("#raiz", "", 0, 0, None)
    pila, i, n, avisos = [raiz], 0, len(src), []
    while True:
        j = src.find("<", i)
        if j < 0:
            break
        if src.startswith("<!--", j):
            k = src.find("-->", j)
            i = n if k < 0 else k + 3
            continue
        m = TAG.match(src, j)
        if not m:
            i = j + 1
            continue
        cierre, tag, attrs, auto = m.group(1), m.group(2).lower(), m.group(3), m.group(4)
        if cierre:
            if any(p.tag == tag for p in pila[1:]):
                while True:
                    p = pila.pop()
                    p.ce, p.e = j, m.end()
                    if p.tag == tag:
                        break
                    avisos.append(f"<{p.tag}> sin cerrar en {p.s}")
            else:
                avisos.append(f"</{tag}> suelto en {j}")
            i = m.end()
            continue
        nodo = Nodo(tag, attrs, j, m.end(), pila[-1])
        pila[-1].hijos.append(nodo)
        if auto or tag in VACIOS:
            nodo.ce = nodo.e = m.end()
        elif tag in CRUDOS:
            k = src.lower().find(f"</{tag}", m.end())
            k = n if k < 0 else k
            nodo.ce = k
            nodo.e = src.find(">", k) + 1 if k < n else n
            i = nodo.e
            continue
        else:
            pila.append(nodo)
        i = m.end()
    for p in pila[1:]:
        p.ce = p.e = n
    raiz.ce = raiz.e = n
    return raiz, avisos


def recorrer(nodo):
    for h in nodo.hijos:
        yield h
        yield from recorrer(h)


def texto(src, nodo):
    """El texto que se ve de un nodo: sin íconos, tooltips ni lo que solo lee el lector de pantalla."""
    partes, i = [], nodo.oe

    def fuera(h):
        return (h.tag in ("svg", "script", "style") or h.attr("role") == "tooltip" or h.attr("aria-hidden") == "true"
                or {"sr", "sr-only", "e-tip"} & set(h.clases()))

    def junta(n, desde, hasta):
        pos = desde
        for h in n.hijos:
            partes.append(src[pos:h.s])
            if not fuera(h):
                junta(h, h.oe, h.ce)
            pos = h.e
        partes.append(src[pos:hasta])

    junta(nodo, i, nodo.ce)
    t = re.sub(r"<[^>]*>", " ", "".join(partes))
    return re.sub(r"\s+", " ", html.unescape(t).replace(" ", " ")).strip()


def desenvolver(n):
    """Si el nodo es un `<sc-if>` con un solo elemento adentro (y nada más), devuelve ese elemento."""
    while n.tag == "sc-if" and len(n.hijos) == 1:
        n = n.hijos[0]
    return n


# ---------------------------------------------------------------- claves de orden
def plano(t):
    t = t.casefold().replace("ñ", "n\x7f")
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^\w\x7f ]+", "", t).replace("_", "")
    return re.sub(r"\s+", " ", t).strip()


def natural(t):
    return tuple((0, int(p)) if p.isdigit() else (1, p) for p in re.split(r"(\d+)", plano(t)) if p)


FECHA = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?$")
NUM = re.compile(r"^(?:(US\$|U\$S|USD|ARS|EUR|R\$|\$|€)\s*)?([-−]?)(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)\s*(%|USD|ARS|EUR)?$")


def leer_celda(t):
    """('vacio', None) | ('f', tupla) | ('n', (valor, moneda)) | ('t', natural)."""
    t = t.strip()
    if t in SIN_DATO:
        return ("vacio", None)
    m = FECHA.match(t)
    if m:
        d, mes, a, h, mi = m.groups()
        return ("f", (int(a), int(mes), int(d), int(h or 0), int(mi or 0)))
    m = NUM.match(t)
    if m:
        mon, signo, cifra, suf = m.groups()
        v = float(cifra.replace(".", "").replace(",", "."))
        return ("n", (-v if signo else v, mon or (suf if suf != "%" else "") or ""))
    return ("t", natural(t))


def claves(textos):
    """Una clave por celda (None si no tiene dato), según el tipo de toda la columna."""
    leidas = [leer_celda(t) for t in textos]
    tipos = {k for k, _ in leidas if k != "vacio"}
    # en una columna de números o de fechas, un texto que dice que no hay dato («Sin respuesta», «Nunca») es una celda sin dato
    nada = [k == "t" and bool(NADA.match(t.strip())) for t, (k, _) in zip(textos, leidas)]
    textos_con_dato = {k for (k, _), n in zip(leidas, nada) if k != "vacio" and not n}
    if textos_con_dato in ({"f"}, {"n"}):
        tipos = textos_con_dato
    # en una columna de nombres, un teléfono, un correo o «Cuenta borrada» está en lugar del nombre que no hay: va como sin dato
    sin_nombre = [False] * len(textos)
    if tipos == {"t"}:
        marcas = [bool(SIN_NOMBRE.match(t.strip())) for t in textos]
        if any(marcas) and any(k == "t" and not m for (k, _), m in zip(leidas, marcas)):
            sin_nombre = marcas
    out = []
    for t, (k, v), n, s in zip(textos, leidas, nada, sin_nombre):
        if s:
            out.append(None)
            continue
        if k == "vacio" or (n and tipos != {"t"} and len(tipos) == 1):
            out.append(None)
        elif tipos == {"f"}:
            out.append(v)
        elif tipos == {"n"}:
            out.append((v[0], v[1]))
        else:
            out.append(natural(t))
    return out


def ordenar(items, keys, desc, fijos=()):
    """Devuelve el nuevo orden (lista de índices) de los items; los fijos quedan en su lugar y lo vacío va al final."""
    movibles = [i for i in range(len(items)) if i not in fijos]
    con = [i for i in movibles if keys[i] is not None]
    sin = [i for i in movibles if keys[i] is None]
    con.sort(key=lambda i: keys[i], reverse=desc)  # sort es estable también con reverse
    nuevos = iter(con + sin)
    return [i if i in fijos else next(nuevos) for i in range(len(items))]


# ---------------------------------------------------------------- frases de «Ordenar por»
def sentido_frase(frase):
    f = plano(frase)
    if f in ("de la a a la z", "de menor a mayor", "mas viejo primero", "mas vieja primero", "mas antiguo primero",
             "mas antigua primero", "mas viejos primero", "mas viejas primero"):
        return "asc"
    if f in ("de la z a la a", "de mayor a menor", "mas reciente primero", "mas recientes primero", "mas nuevo primero",
             "mas nueva primero", "mas nuevos primero", "mas nuevas primero"):
        return "desc"
    if f == "activos primero":
        return "activos"
    return None


ORDEN_TXT = re.compile(r"Ordenar por:\s*([^,<]+?),\s*([^<]+?)\s*$")


def frases_ordenar(src, raiz):
    """[(pos, columna, frase)] de cada botón «Ordenar por: X, frase» del tablero."""
    out = []
    for n in recorrer(raiz):
        if n.tag == "button":
            m = ORDEN_TXT.match(texto(src, n))
            if m:
                out.append((n.s, m.group(1).strip(), m.group(2).strip()))
    return out


# ---------------------------------------------------------------- tablas
def celdas(fila):
    return [h for h in fila.hijos if h.tag != "sc-if"]


def envoltorio(n):
    """El nodo con los `<sc-if>` que lo envuelven solo a él (se mueven juntos)."""
    while n.padre is not None and n.padre.tag == "sc-if" and len(n.padre.hijos) == 1:
        n = n.padre
    return n


def es_cabecera(u, cls_cab):
    return (cls_cab and cls_cab in u.clases()) or any(y.attr("aria-sort") in ("ascending", "descending") for y in recorrer(u))


def clase_filas(nodos):
    cuenta = {}
    for x in nodos:
        for k in desenvolver(x).clases():
            cuenta[k] = cuenta.get(k, 0) + 1
    return max(cuenta, key=lambda k: (cuenta[k], -list(cuenta).index(k))) if cuenta else None


def filas_div(h):
    """Las filas que siguen a un encabezado de grilla: (forma, [(item, fila)], contenedor) o (motivo, None, None).

    Las filas son los hermanos que siguen al encabezado y comparten la clase que más se repite. Si al encabezado lo siguen los
    encabezados de otros estados (cada uno en su `<sc-if>`), se saltean; si lo que sigue es un `<sc-if>` con varias cosas
    adentro, las filas son las de adentro.
    """
    cls_cab = (h.clases() or [None])[0]
    ancla = envoltorio(h)
    hermanos = [x for x in ancla.padre.hijos if x.s >= ancla.e]
    k = 0
    while k < len(hermanos) and hermanos[k].tag == "sc-if" and desenvolver(hermanos[k]).tag != "sc-if" \
            and es_cabecera(desenvolver(hermanos[k]), cls_cab):
        k += 1  # el encabezado de otro estado
    candidatos = []
    for x in hermanos[k:]:
        if es_cabecera(desenvolver(x), cls_cab):
            break  # empieza otra tabla
        candidatos.append(x)
    if not candidatos:
        return "menos de dos filas", None, None
    if any(x.tag == "sc-for" for x in candidatos):
        return "las filas las arma el JavaScript (<sc-for>)", None, None
    contenedor = ancla.padre
    primero = desenvolver(candidatos[0])
    if primero.tag == "sc-if":  # un <sc-if> con varias filas adentro
        if any(y.tag == "sc-for" for y in recorrer(primero)):
            return "las filas las arma el JavaScript (<sc-for>)", None, None
        contenedor, candidatos = primero, list(primero.hijos)
    cls = clase_filas(candidatos)
    items = [(x, desenvolver(x)) for x in candidatos if cls and cls in desenvolver(x).clases()]
    if len(items) < 2:
        return "menos de dos filas", None, None
    extra = " (en un <sc-if>)" if contenedor is not ancla.padre else ""
    return f"{h.tag}.{cls_cab} + {cls}{extra}", items, contenedor


def filas_rol(h, c):
    """Una grilla plana (`role="columnheader"` y `role="cell"` hermanos): cada fila son N celdas seguidas."""
    cab = [x for x in h.hijos if x.attr("role") == "columnheader"]
    cel = [x for x in h.hijos if x.attr("role") == "cell"]
    n = len(cab)
    if not n or len(cel) % n or cel[0].s < cab[-1].e:
        return "grilla plana con celdas sueltas", None, None
    grupos = [cel[k:k + n] for k in range(0, len(cel), n)]
    return f"{h.tag}.{(h.clases() or [''])[0]} (grilla plana)", grupos, cab.index(c)


def tablas(src, raiz, frases):
    """Cada encabezado con flecha: dict con lo que se ordena, o con el motivo para no tocarlo."""
    out = []
    for c in recorrer(raiz):
        sentido = c.attr("aria-sort")
        if sentido not in ("ascending", "descending"):
            continue
        h = c.padre
        col_nombre = texto(src, c)
        info = {"pos": c.s, "columna": col_nombre, "sentido": sentido, "forma": None, "grupo": None, "motivo": None}
        out.append(info)
        textos, fijos, faltan = [], set(), 0
        if c.attr("role") == "columnheader" and any(x.attr("role") == "cell" for x in h.hijos):
            forma, grupos, idx = filas_rol(h, c)
            info["forma"] = forma
            if grupos is None:
                info["motivo"] = forma
                continue
            spans = [(g[0].s, g[-1].e) for g in grupos]
            for i, g in enumerate(grupos):
                textos.append(texto(src, g[idx]))
                if FIJAS.match(texto(src, g[0])):
                    fijos.add(i)
            contenedor = h
        else:
            if h.tag == "sc-if" or c not in celdas(h):
                info["motivo"] = "la celda del encabezado está dentro de un <sc-if>"
                continue
            idx = celdas(h).index(c)
            if h.tag == "tr":
                info["forma"] = "table"
                cont = h.padre
                if cont.tag == "thead":
                    sig = [x for x in cont.padre.hijos if x.s >= cont.e and x.tag == "tbody"]
                    if not sig:
                        info["motivo"] = "sin <tbody>"
                        continue
                    cont, despues = sig[0], -1
                else:
                    despues = h.e
                items = [(x, desenvolver(x)) for x in cont.hijos if x.s >= despues and desenvolver(x).tag == "tr"]
                contenedor = cont
                if len(items) < 2:
                    info["motivo"] = "menos de dos filas"
                    continue
            else:
                forma, items, contenedor = filas_div(h)
                if items is None:
                    info["motivo"] = forma
                    info["forma"] = f"{h.tag}.{(h.clases() or [''])[0]}"
                    continue
                info["forma"] = forma
            spans = [(x.s, x.e) for x, _ in items]
            for i, (x, u) in enumerate(items):
                cs = celdas(u)
                if len(cs) <= idx:
                    faltan += 1
                    textos.append("")
                    fijos.add(i)
                    continue
                t = texto(src, cs[idx])
                textos.append(t)
                if FIJAS.match(t) or {"tot", "total"} & set(u.clases()):
                    fijos.add(i)
        if faltan:
            info["aviso"] = f"{faltan} fila(s) sin la celda de la columna: quedan en su lugar"
        previas = [f for f in frases if f[0] < c.s and plano(f[1]) == plano(col_nombre)]
        keys, desc = elegir_modo(col_nombre, previas[-1][2] if previas else None, sentido, textos)
        if keys is None:
            info["motivo"] = desc
            continue
        info["grupo"] = armar_grupo(spans, keys, desc, fijos)
        info["textos"] = textos
        info["contenedor"] = contenedor.s
        info["defecto"] = envoltorio(h).attr("hint-placeholder-val") in (None, "{{si}}")
    # dos encabezados (dos estados) que mandan sobre las mismas filas: manda el del estado que se ve de entrada
    por_cont = {}
    for i in out:
        if i["grupo"]:
            por_cont.setdefault(i["contenedor"], []).append(i)
    for grupo in por_cont.values():
        if len({tuple(i["grupo"]["orden"]) for i in grupo}) > 1:
            manda = next((i for i in grupo if i["defecto"]), grupo[0])
            for i in grupo:
                if i is not manda and i["grupo"]["orden"] != manda["grupo"]["orden"]:
                    i["motivo"] = (f"comparte las filas con «{manda['columna']}», del estado que se ve de entrada, "
                                   "que es el que manda")
                    i["grupo"] = None
    return out


CIRCUITOS = [("recibida", "por aprobar", "aprobada", "rechazada", "anulada")]  # Criterio-Tablas-Base2: «Un estado o un tipo ordena por su circuito»


def claves_circuito(textos):
    """La posición de cada estado en su circuito, o None si la columna no es de un circuito conocido."""
    for circ in CIRCUITOS:
        keys = []
        for t in textos:
            if t.strip() in SIN_DATO:
                keys.append(None)
                continue
            p = plano(t)
            hits = [k for k, e in enumerate(circ) if p == e or p.startswith(e + " ")]
            if not hits:
                break
            keys.append(max(hits, key=lambda k: len(circ[k])))
        else:
            return keys
    return None


def elegir_modo(col, frase, sentido, textos):
    """(claves, al_reves) para ordenar, o (None, motivo) si el orden no se puede deducir."""
    desc = sentido in ("descending", "desc")
    if frase is not None:
        s_ = sentido_frase(frase)
        if s_ in ("asc", "desc"):
            desc = s_ == "desc"
        elif s_ == "activos":
            return [None if t.strip() in SIN_DATO else (0 if plano(t).startswith("activ") else 1) for t in textos], False
        elif plano(frase) == "por el circuito":
            keys = claves_circuito(textos)
            return (keys, False) if keys else (None, f"orden propio: «{col}, {frase}» con estados fuera del circuito")
        else:
            m = re.match(r"^de (.+) a (.+)$", frase.strip())
            if m:
                a, b = plano(m.group(1)), plano(m.group(2))
                medio = {plano(t) for t in textos if t.strip() not in SIN_DATO} - {a, b}
                if len(medio) <= 1:
                    return [None if t.strip() in SIN_DATO else (0 if plano(t) == a else 2 if plano(t) == b else 1)
                            for t in textos], False
            return None, f"orden propio: «{col}, {frase}»"
    if plano(col) in ("estado", "tipo"):
        keys = claves_circuito(textos)
        if keys:
            return keys, desc
    return claves(textos), desc


def armar_grupo(spans, keys, desc, fijos=()):
    return {"spans": list(spans), "orden": ordenar(spans, keys, desc, fijos)}


# ---------------------------------------------------------------- tarjetas del teléfono
def tarjetas(src, raiz):
    out = []
    for o in recorrer(raiz):
        if not ORDTEL & set(o.clases()):
            continue
        m = ORDEN_TXT.match(texto(src, o))
        forma = "b2-ordtel + b2-tj" if "b2-ordtel" in o.clases() else "tel-ord + tel-tj"
        info = {"pos": o.s, "columna": None, "sentido": None, "forma": forma, "grupo": None, "motivo": None}
        out.append(info)
        if not m:
            info["motivo"] = f"«{texto(src, o)}» no dice columna y orden"
            continue
        col, frase = m.group(1).strip(), m.group(2).strip()
        info["columna"], info["sentido"] = col, frase
        # las tarjetas que siguen: hermanas del «Ordenar por», o adentro del primer hermano que las tiene; sube por los <sc-if>
        # que envuelven solo al «Ordenar por» y por los contenedores, pero nunca sale de la rama <sc-if> del estado
        n, items = o, None
        while n.padre is not None and items is None:
            hermanos = [x for x in n.padre.hijos if x.s >= n.e]
            directas = [x for x in hermanos if TARJETA & set(desenvolver(x).clases())]
            if directas:
                items = [(x, desenvolver(x)) for x in directas]
                break
            for x in hermanos:
                if ORDTEL & set(x.clases()) or any(ORDTEL & set(y.clases()) for y in recorrer(x)):
                    break
                tjs = [y for y in recorrer(x) if TARJETA & set(y.clases())]
                if tjs:
                    tjs = [y for y in tjs if not any(z is not y and z.s <= y.s and y.e <= z.e for z in tjs)]
                    items = [(envoltorio(y), y) for y in tjs]
                    break
            if items is not None or n.padre.tag == "#raiz" or (n.padre.tag == "sc-if" and len(n.padre.hijos) > 1):
                break
            n = n.padre
        if not items:
            info["motivo"] = "sin tarjetas debajo"
            continue
        padres = {id(x.padre) for x, _ in items}
        if len(padres) != 1:
            info["motivo"] = f"las tarjetas están en {len(padres)} contenedores distintos"
            continue
        if len(items) < 2:
            info["motivo"] = "menos de dos tarjetas"
            continue

        def campo(y):
            for c in recorrer(y):
                if "c" in c.clases():
                    k = next((z for z in c.hijos if "k" in z.clases()), None)
                    v = next((z for z in c.hijos if "v" in z.clases()), None)
                    if k is not None and v is not None and plano(texto(src, k)) == plano(col):
                        return texto(src, v)
            return None

        vals = [campo(y) for _, y in items]
        if all(v is None for v in vals):
            nm = [next((c for c in recorrer(y) if "nm" in c.clases()), None) for _, y in items]
            vals = [texto(src, c) if c is not None else "" for c in nm]
            info["campo"] = "nm"
        vals = [v or "" for v in vals]
        keys, desc = elegir_modo(col, frase, None, vals)
        if keys is None:
            info["motivo"] = desc
            continue
        info["grupo"] = armar_grupo([(x.s, x.e) for x, _ in items], keys, desc)
        info["textos"] = vals
    return out


# ---------------------------------------------------------------- aplicar
def cambios(src):
    raiz, avisos = arbol(src)
    frases = frases_ordenar(src, raiz)
    return tablas(src, raiz, frases) + tarjetas(src, raiz), avisos


def reescribir(src, grupos):
    """Aplica los grupos que no se pisan entre sí; devuelve el texto nuevo y cuántos aplicó."""
    elegidos, usados = [], []
    for g in grupos:
        a, b = g["spans"][0][0], g["spans"][-1][1]
        if any(not (b <= x or y <= a) for x, y in usados):
            continue
        usados.append((a, b))
        elegidos.append(g)
    reemplazos = []
    for g in elegidos:
        for destino, origen in enumerate(g["orden"]):
            if destino != origen:
                s, e = g["spans"][destino]
                os_, oe = g["spans"][origen]
                reemplazos.append((s, e, src[os_:oe]))
    reemplazos.sort()
    out, pos = [], 0
    for s, e, t in reemplazos:
        out.append(src[pos:s])
        out.append(t)
        pos = e
    out.append(src[pos:])
    return "".join(out), len(elegidos)


def procesar(src):
    """Ordena hasta que no queda nada por cambiar (los grupos anidados van en otra vuelta)."""
    for _ in range(20):
        infos, _ = cambios(src)
        pend = [i["grupo"] for i in infos if i["grupo"] and i["grupo"]["orden"] != sorted(i["grupo"]["orden"])]
        if not pend:
            return src
        src, n = reescribir(src, pend)
    raise RuntimeError("no se estabiliza")


def tableros(carpeta):
    boards = json.loads((carpeta / "canvas.json").read_text(encoding="utf-8"))["boards"]
    return sorted(boards)


def linea(src, pos):
    return src.count("\n", 0, pos) + 1


def corto(t, n=28):
    return t if len(t) <= n else t[: n - 1] + "…"


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--detectar", action="store_true")
    g.add_argument("--aplicar", action="store_true")
    ap.add_argument("--dir", default=str(LIENZO))
    ap.add_argument("--detalle", action="store_true", help="con --detectar, también las tablas que ya están en orden")
    a = ap.parse_args()
    carpeta = pathlib.Path(a.dir)
    tot = {"tableros": 0, "tablas": 0, "en_orden": 0, "cambian": 0, "sin_tocar": 0, "tableros_cambian": []}
    for nombre in tableros(carpeta):
        f = carpeta / nombre
        if not f.exists():
            print(f"FALTA {nombre}")
            continue
        with open(f, encoding="utf-8", newline="") as fh:
            src = fh.read()
        infos, avisos = cambios(src)
        if not infos:
            continue
        tot["tableros"] += 1
        cambia_aca = False
        renglones = []
        for i in infos:
            tot["tablas"] += 1
            donde = f"  l.{linea(src, i['pos'])} [{i['forma']}] «{i['columna']}» {i['sentido']}"
            if i["motivo"]:
                tot["sin_tocar"] += 1
                renglones.append(f"{donde}: SIN TOCAR, {i['motivo']}")
                continue
            orden = i["grupo"]["orden"]
            extra = f" ({i['aviso']})" if i.get("aviso") else ""
            if orden == sorted(orden):
                tot["en_orden"] += 1
                if a.detalle or extra:
                    renglones.append(f"{donde}: en orden{extra}")
            else:
                tot["cambian"] += 1
                cambia_aca = True
                antes = " | ".join(corto(t) for t in i["textos"])
                despues = " | ".join(corto(i["textos"][k]) for k in orden)
                renglones.append(f"{donde}: CAMBIA{extra}\n      antes:   {antes}\n      después: {despues}")
        if cambia_aca:
            tot["tableros_cambian"].append(nombre)
        if renglones:
            print(nombre + ("" if not avisos else f"  (avisos del árbol: {len(avisos)})"))
            print("\n".join(renglones))
        if a.aplicar and cambia_aca:
            nuevo = procesar(src)
            if nuevo != src:
                with open(f, "w", encoding="utf-8", newline="") as fh:
                    fh.write(nuevo)
    print()
    print(f"Tableros con flecha u «Ordenar por»: {tot['tableros']} · tablas: {tot['tablas']} · en orden: {tot['en_orden']} · "
          f"{'reordenadas' if a.aplicar else 'por reordenar'}: {tot['cambian']} · sin tocar: {tot['sin_tocar']}")
    print(f"Tableros que {'cambiaron' if a.aplicar else 'cambian'} ({len(tot['tableros_cambian'])}): "
          + ", ".join(n.removesuffix(".dc.html") for n in tot["tableros_cambian"]))


if __name__ == "__main__":
    main()
