"""Los catálogos con filtros de la E12 con la pieza para elegir (262), en el lienzo v185 (2026-11-26): `FRM-Catalogo-Filtros`,
`FRM-Catalogo-Contactos` y sus teléfonos.

Lo que cambia (spec `docs/plans/formularios/12-catalogos.md` §10 y «Una sola pieza para elegir»):
- el texto, el detalle y el orden de cada opción, y la columna, la comparación y el valor de cada condición, en la pieza cerrada
  (`b2-pkc`); los valores, varios por su nombre, separados por coma y sin chips; el orden, dicho con palabras (224);
- la persona de ejemplo (miembros) y el cliente de ejemplo (contactos), en la pieza, que cerrada dice solo el nombre, sin la empresa;
  abierta, del servidor, con el buscador adentro. «Sin cliente» va separada (262, `Criterio-Elegir`);
- las etiquetas de una condición, sin cantidades (262), en la pieza múltiple abierta con casillas y el buscador;
- un estado nuevo en los dos tableros de los miembros, «Elegir los roles», con la pieza múltiple abierta;
- mientras el catálogo es nuevo, «De dónde salen las opciones» en la pieza, antes del nombre, como en `FRM-Catalogo`;
- en el teléfono, cada condición como tarjeta (263: sin «Si · Rol» unido con «·» ni la comparación debajo del nombre), la pieza a
  pantalla completa en «Elegir a quién», «Elegir etiquetas» y «Elegir los roles», con «Listo (N)» en las de varias.

«Sin incluir a quien lo recibe» sigue como casilla: es un sí o no suelto. La vista previa (el teléfono de quien recibe) no cambia:
imita WhatsApp.

Escribe las medidas de antes de la escala en un bloque `<style data-e12="t2">`; después va
`traspaso10_piezas_1004.py --tableros FRM-Catalogo-Filtros,M-FRM-Catalogo-Filtros,FRM-Catalogo-Contactos,M-FRM-Catalogo-Contactos`.
Parte de los tableros de la v184 y no se vuelve a correr: si el bloque ya está, no hace nada.
"""
import io
import json
import pathlib
import re
import sys

import base2_comun as bc

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-e12="t2"'
SVG = r'<svg\b[^>]*>.*?</svg>'

CSS_EXTRA = """
/* E12 · La pieza en las condiciones y en la persona de ejemplo (262). */
.k-cond .b2-env, .k-g3 .b2-env, .k-persona .b2-env { min-width: 0; }
.k-cond .b2-pkc.err .v { color: oklch(0.5 0.19 25); }
.k-persona .b2-pkc { height: 40px; }
.k-cond .b2-pkl { min-width: 260px; }
.w-caja:has(.b2-pkl), .k-conds:has(.b2-pkl), .k-sec:has(.b2-pkl) { overflow: visible !important; }
"""

CSS_EXTRA_TEL = """
/* E12 · Cada condición como tarjeta (263), adentro de su grupo. */
.ap-grupo .b2-tj:last-child { border-bottom: 0; }
.ap-hoja .b2-env { width: 100%; }
.b2-tj .v .mal { color: oklch(0.5 0.19 25); }
.b2-tj .v .ap-i { vertical-align: middle; }
"""


def leer(nombre):
    p = PROJ / f"{nombre}.dc.html"
    s = io.open(p, encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    return p, s.replace("\r\n", "\n"), nl


def guardar(p, s, nl):
    io.open(p, "w", encoding="utf-8", newline="").write(s.replace("\n", nl))
    print("ok", p.name, len(s))


def bloques(s, k, desde=0):
    """Los `<sc-if value="{{sK}}">` del tablero, con su cierre, respetando los anidados: [(inicio, fin)]."""
    res = []
    for m in re.finditer(r'<sc-if value="\{\{s%d\}\}"' % k, s[desde:]):
        st = desde + m.start()
        prof = 0
        for n in re.finditer(r"<sc-if\b|</sc-if>", s[st:]):
            prof += -1 if n.group(0) == "</sc-if>" else 1
            if prof == 0:
                res.append((st, st + n.end()))
                break
    return res


def con_css(s, tel):
    assert MARCA not in s
    css = bc.css(tel) + (CSS_EXTRA_TEL if tel else CSS_EXTRA)
    return s.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def sumar_estado(s, nombre):
    """Suma un estado al final del Tweak «estado», con su `sK` en `renderVals()`."""
    m = re.search(r"data-props='(\{.*?\})'>", s)
    props = json.loads(m.group(1))
    opciones = props["estado"]["options"]
    k = len(opciones)
    opciones.append(nombre)
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    s = s[:m.start(1)] + texto + s[m.end(1):]
    viejo = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", s)
    lista = json.loads(viejo.group(1))
    assert lista == opciones[:-1], (lista, opciones)
    s = s.replace(viejo.group(1), json.dumps(opciones, ensure_ascii=False).replace('", "', '", "'), 1)
    ult = f"      s{k - 1}: k === {k - 1},\n"
    assert ult in s
    s = s.replace(ult, ult + f"      s{k}: k === {k},\n", 1)
    return s, k


def renumerar(bloque, k_de, k_a):
    return bloque.replace(f'<sc-if value="{{{{s{k_de}}}}}" hint-placeholder-val="{{{{si}}}}">',
                          f'<sc-if value="{{{{s{k_a}}}}}" hint-placeholder-val="{{{{no}}}}">', 1).replace(
        f'<sc-if value="{{{{s{k_de}}}}}" hint-placeholder-val="{{{{no}}}}">',
        f'<sc-if value="{{{{s{k_a}}}}}" hint-placeholder-val="{{{{no}}}}">', 1)


# ---------------------------------------------------------------------------------------------------------------- los datos
ROLES_ELEGIDOS = "Supervisor, Jefe de obra"
ROLES = [("Administración de personas", False), ("Auditor", False), ("Jefe de obra", True), ("Recursos humanos", False),
         ("Supervisor", True), ("Vendedor", False), ("Ventas mayoristas", False)]
PERSONAS = [("Tomás Acosta", "Vendedor · Delta S.A."), ("Lucía Fernández", "Dueña · Delta S.A."),
            ("Martín Paz", "Supervisor · Delta S.A."), ("Paula Méndez", "Supervisor · Delta S.A."),
            ("Florencia Fernández de la Fuente", "Supervisora · Delta Norte")]
CLIENTES = ["Carla Ruiz", "Corralón El Puente", "Ferretería Rosales", "Juan Pérez"]
ETIQUETAS = [("Mayorista", True), ("Minorista", True), ("Obra", False), ("VIP", False)]
ORDEN_VIEJO, ORDEN = "Nombre, A → Z", "Nombre, de la A a la Z"


def lista_roles():
    return bc.lista([bc.op(n, elegida=on, multiple=True) for n, on in ROLES], multiple=True, buscar="")


def lista_personas():
    return bc.lista([bc.op(n, d, elegida=n == "Tomás Acosta", activa=n == "Tomás Acosta") for n, d in PERSONAS], buscar="",
                    pie='<button type="button" class="mas">Mostrar 20 más</button>')


def lista_clientes():
    ops = [bc.op("Sin cliente", elegida=True, activa=True)] + [bc.op(n, sep=i == 0) for i, n in enumerate(CLIENTES)]
    return bc.lista(ops, buscar="")


def lista_etiquetas():
    return bc.lista([bc.op(n, elegida=on, multiple=True) for n, on in ETIQUETAS], multiple=True, buscar="")


# ---------------------------------------------------------------------------------------------------------------- la compu
def compu(nombre, contactos):
    p, s, nl = leer(nombre)
    if MARCA in s:
        print("ya está", nombre)
        return
    s = con_css(s, False)
    i = s.index("</helmet>")
    cab, cuerpo = s[:i], s[i:]

    # Texto de cada opción, Detalle y Orden.
    n0 = len(re.findall(r'<div class="ct sel">([^<]*)' + SVG + r'</div>', cuerpo, flags=re.S))
    cuerpo = re.sub(r'<div class="ct sel">([^<]*)' + SVG + r'</div>',
                    lambda m: bc.campo(ORDEN if m.group(1) == ORDEN_VIEJO else m.group(1)), cuerpo, flags=re.S)
    assert n0 >= 20, n0

    # Las condiciones: la columna, la comparación y el valor, en la pieza; sin chips.
    def cond(m):
        fila = m.group(0)
        fila = re.sub(r'<span class="k-chip">Supervisor ×</span>', ROLES_ELEGIDOS, fila)
        abierta = '<span class="f-mn k-tags"' in fila
        fila = re.sub(r'<span class="f-mn k-tags".*</span>(?=</div>$)', "", fila, flags=re.S)

        def ct(mm):
            mal, valor = mm.group(1), mm.group(2)
            if abierta and valor == "Mayorista, Minorista":
                return bc.campo(valor, abierto=True, extra=lista_etiquetas())
            return bc.campo(valor, error=bool(mal))
        return re.sub(r'<div class="ct( mal)?">([^<]*)' + SVG + r'</div>', ct, fila, flags=re.S)
    cuerpo, n1 = re.subn(r'<div class="k-cond">.*?<button type="button" class="ib" aria-label="Quitar condición">' + SVG
                         + r'</button>(?:<span class="f-mn k-tags".*?</span></span>)?</div>', cond, cuerpo, flags=re.S)
    assert n1 >= 10 and "k-chip" not in cuerpo and "f-mn k-tags" not in cuerpo, n1

    # La persona o el cliente de ejemplo: cerrada, solo el nombre; abierta, del servidor y con el buscador.
    def ejemplo(m):
        mal, valor, abierta = m.group(1), m.group(2), m.group(3)
        vacio = "Elegí a quién" in valor
        if vacio:
            texto = "Elegí a quién"
        elif contactos:
            texto = "Sin cliente"
        else:
            texto = valor.replace(" · Delta S.A.", "")
        extra = (lista_clientes() if contactos else lista_personas()) if abierta else ""
        return bc.campo(texto, vacio=vacio, abierto=bool(abierta), error=bool(mal), extra=extra,
                        aria="Cliente de ejemplo" if contactos else "Persona de ejemplo")
    cuerpo, n2 = re.subn(r'<div class="ct sel( mal)?" role="combobox">(.*?)' + SVG + r'</div>(<span class="f-mn k-pers".*?</span></span>)?',
                         ejemplo, cuerpo, flags=re.S)
    assert n2 >= 10 and 'role="combobox"' not in cuerpo and "f-mn k-pers" not in cuerpo, n2
    if contactos:
        cuerpo, n3 = re.subn(r'(<div class="w-cmp k-persona"><span class="rt">)Persona(</span>)', r"\1Cliente\2", cuerpo)
        assert n3 >= 10, n3

    s = cab + cuerpo
    if not contactos:
        # «Elegir los roles»: la pieza múltiple abierta, del servidor, con las casillas y el buscador.
        s, k = sumar_estado(s, "Elegir los roles")
        (b0, b0f), (c0, c0f) = bloques(s, 0)[:2]
        (b9, b9f), (c9, c9f) = bloques(s, 9)[:2]
        banda = renumerar(s[b0:b0f], 0, k)
        cerrado = bc.campo(ROLES_ELEGIDOS)
        cuerpo0 = s[c0:c0f]
        assert cuerpo0.count(cerrado) == 1
        nuevo = renumerar(cuerpo0.replace(cerrado, bc.campo(ROLES_ELEGIDOS, abierto=True, extra=lista_roles())), 0, k)
        s = s[:c9f] + nuevo + s[c9f:]
        s = s[:b9f] + banda + s[b9f:]
    guardar(p, s, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def condicion_tel(columna, comparacion, valor):
    return bc.tarjeta(columna, [("Comparación", comparacion), ("Valor", valor)], acciones="la condición")


def telefono(nombre, contactos):
    p, s, nl = leer(nombre)
    if MARCA in s:
        print("ya está", nombre)
        return
    s = con_css(s, True)
    i = s.index("</helmet>")
    cab, cuerpo = s[:i], s[i:]
    keb = r'<button type="button" class="ap-ib" aria-label="Acciones de la condición">' + SVG + r'</button>'

    # Cada condición como tarjeta (263).
    def fila(m):
        col = m.group(1).split(" · ")[1]
        txt = m.group(2)
        for comp in ("tiene alguno de ", "tiene alguna de ", "es "):
            if txt.startswith(comp):
                valor = txt[len(comp):]
                valor = ROLES_ELEGIDOS if valor == "Supervisor" else valor
                return condicion_tel(col, comp.strip(), valor)
        mal = re.match(r'<span class="mal">Rol no disponible</span>(<button type="button" class="ap-i".*?</button>)$', txt, re.S)
        assert mal, txt[:80]
        return condicion_tel(col, "tiene alguno de", '<span class="mal">Rol no disponible</span>' + mal.group(1))
    cuerpo, n1 = re.subn(r'<div class="q-row"><span class="tx"><b>((?:Si|Y) · [^<]+)</b><span>((?:[^<]|<span class="mal">.*?</button>)*?)</span></span>'
                         + keb + r'</div>', fila, cuerpo, flags=re.S)
    assert n1 >= 10 and "q-row" not in cuerpo, (n1, cuerpo.count("q-row"))
    cuerpo = cuerpo.replace(f'<span class="v">{ORDEN_VIEJO}</span>', f'<span class="v">{ORDEN}</span>')

    # Editar una condición: la columna, la comparación y el valor, en la pieza.
    cuerpo, n2 = re.subn(r'<div class="ct sel">([^<]*)' + SVG + r'</div>',
                         lambda m: bc.campo(ROLES_ELEGIDOS if m.group(1) == "Supervisor" else
                                            ("Sin cliente" if m.group(1) == "Ninguna" else m.group(1).replace(" · Delta S.A.", "")),
                                            aria="Cliente de ejemplo" if m.group(1) == "Ninguna" else ""),
                         cuerpo, flags=re.S)
    assert n2 >= 6 and "Tomás Acosta · Delta S.A." not in cuerpo, n2
    if contactos:
        cuerpo = re.sub(r'(<div class="ap-cmp"><span class="rt"><span>)Persona(</span>)', r"\1Cliente\2", cuerpo)

    # Las listas a pantalla completa.
    def reemplazar(cuerpo, etiqueta, nuevo):
        m = re.search(r'<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="%s">' % etiqueta, cuerpo)
        assert m, etiqueta
        fin = cuerpo.index("</sc-if>", m.start())
        return cuerpo[:m.start()] + nuevo + cuerpo[fin:]
    if contactos:
        cuerpo = reemplazar(cuerpo, "Persona", bc.pk_tel("Cliente", [("Sin cliente", None, True, None)]
                                                           + [(n, None, False, None, i == 0) for i, n in enumerate(CLIENTES)], buscar=""))
        cuerpo = reemplazar(cuerpo, "Etiquetas", bc.pk_tel("Etiquetas", [(n, None, on, None) for n, on in ETIQUETAS], multiple=True,
                                                             buscar="", listo="Listo (2)"))
    else:
        cuerpo = reemplazar(cuerpo, "Persona", bc.pk_tel("Persona", [(n, d, n == "Tomás Acosta", None) for n, d in PERSONAS], buscar="",
                                                           pie_extra='<button type="button" class="mas">Mostrar 20 más</button>'))
    assert "t-opc" not in cuerpo and "Buscar persona" not in cuerpo

    s = cab + cuerpo
    if not contactos:
        # «Elegir los roles»: la pieza múltiple a pantalla completa, sobre el editor de la condición.
        s, k = sumar_estado(s, "Elegir los roles")
        b0, b0f = bloques(s, 0)[0]
        principal = renumerar(s[b0:b0f], 0, k)
        raya = s.index('<span class="ap-raya">')
        s = s[:raya] + principal + s[raya:]
        hoja = bc.pk_tel("Roles", [(n, None, on, None) for n, on in ROLES], multiple=True, buscar="", listo="Listo (2)")
        ult = s.rindex("</sc-if>") + len("</sc-if>")
        s = s[:ult] + f'<sc-if value="{{{{s{k}}}}}" hint-placeholder-val="{{{{no}}}}">{hoja}</sc-if>' + s[ult:]
    guardar(p, s, nl)


# ---------------------------------------------------------------------------------------------------------------- el origen
ORIGEN = "De dónde salen las opciones"


def origen_nuevo(nombre, estados, valor):
    """Mientras el catálogo es nuevo, el origen se elige en la pieza, antes del nombre, como en `FRM-Catalogo` (262, spec §10)."""
    p, s, nl = leer(nombre)
    if ORIGEN in s:
        print("ya está el origen", nombre)
        return
    viejo = f'<p class="k-de">{valor}</p>'
    nuevo = f'<div class="w-cmp"><span class="rt">{ORIGEN}</span>{bc.campo(valor, aria=ORIGEN)}</div>'
    for k in estados:
        ini, fin = bloques(s, k)[1]  # el primero es la banda; el segundo, el cuerpo
        bloque = s[ini:fin]
        assert bloque.count(viejo) == 1, (nombre, k)
        s = s[:ini] + bloque.replace(viejo, nuevo) + s[fin:]
    guardar(p, s, nl)


if __name__ == "__main__":
    compu("FRM-Catalogo-Filtros", contactos=False)
    compu("FRM-Catalogo-Contactos", contactos=True)
    telefono("M-FRM-Catalogo-Filtros", contactos=False)
    telefono("M-FRM-Catalogo-Contactos", contactos=True)
    # «Nuevo catálogo» y «Crear sin persona» (un catálogo que todavía no se creó); los teléfonos no tienen ese estado.
    origen_nuevo("FRM-Catalogo-Filtros", [7, 8], "De los miembros")
    origen_nuevo("FRM-Catalogo-Contactos", [8], "De los contactos de WhatsApp")
