"""Lo que quedaba por alinear en los tableros de WhatsApp después de la tanda 3B (v189, 2026-11-26), sin decisión nueva: lo que el
usuario aprobó en la 287 (los tableros de la E19 a la E25 y las diferencias de la base 2, con la recomendada en cada pregunta) y lo que
las notas de la 3B dejaron pendiente (J2 y P). Cambia los tableros en su lugar:

1. **`WA-Equipos` y `M-WA-Equipos`: la columna «Asistente» que suma la E24 y el orden (264).** «Asistente» va entre «Cantidad» y
   «Aviso por correo», en el orden de los campos de «Editar equipo» (`WA-Equipo-Asistente`); un equipo sin asistente, que contesta el
   principal, dice «—» (sin dato, una raya: `Criterio-Tablas-Base2`), como «Equipos» del principal en `WA-Asistentes`. Los datos son
   los de `WA-Asistentes` en «Varios»: Delta Soporte en Soporte y Delta Ventas en Ventas. La lista abre por equipo, de la A a la Z,
   como en la app (`defaultSort: "name"`): «Equipo ↑» en el encabezado y «Ordenar por: Equipo, de la A a la Z» último en la barra, que
   en la compu lleva solo eso, porque la lista no tiene búsqueda ni filtros. Ordenan Equipo, Bandeja, Cantidad, Asistente y Aviso por
   correo; «Personas» no, porque son varios valores. Las filas van en el orden de la flecha. El ⋮ abierto de «Menú del equipo» pasa
   adentro de la fila de Ventas, que ahora es la última. Estados nuevos de la compu: «Ordenado por Asistente» (lo vacío al final) y
   «Ordenar por abierto». En el teléfono, cada equipo es una tarjeta con sus datos nombrados (263), como la de `M-Filas-Base2`: Bandeja
   y Asistente, Personas a todo el ancho y Aviso; «Ordenar por» arriba de las tarjetas, y el estado nuevo «Ordenar por», su pantalla.
2. **«Datos que van prellenados» en la pieza múltiple (262)** en `WA-Chats-Sugerencia` y `M-WA-Conversacion-Asistente`: dejan las
   casillas. Cerrada, un campo con los datos por su nombre; abierta, la lista con la casilla de cada dato y su valor debajo (en el
   teléfono, a pantalla completa con «Listo»). Estado nuevo en los dos: «Elegir los datos prellenados».
3. **Las tablas de la compu de `WA-Difusiones-Base2`, `WA-Difusion-Resultados-Base2` y `Auditoria-Plat-Base2` ordenan (264):** la
   flecha en la columna con que abre cada lista y «Ordenar por» último en la barra, separado de los filtros, como sus teléfonos de la
   3B: Difusiones por fecha, Resultados por último cambio y Auditoría por fecha y hora, las tres del más reciente primero. Las filas
   van en el orden de la flecha.

Cada tablero lleva un bloque `<style data-t3b="v189-whatsapp">` antes de `</helmet>`, que lo frena si ya corrió; los títulos no
cambian. Las medidas van sin escalar: al final corre `traspaso10_piezas_1004.py --tableros` con los que cambió. No toca `canvas.json`.

Uso: `python v189_whatsapp_1004.py`. Una segunda corrida no cambia nada.
"""
import io
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12e  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402
import e24_asistentes_1004 as e24  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-t3b="v189-whatsapp"'
sc_ifs, renombrar, sumar_estados, fin_div = e12e.sc_ifs, e12e.renombrar, e12e.sumar_estados, b2.fin_div
svg, sc, js_lista, js_mapa = e24.svg, e24.sc, e24.js_lista, e24.js_mapa
NADA = f"<span>{b2.NADA_T}</span>"


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    return s.replace("\r\n", "\n"), nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (viejo[:120], t.count(viejo))
    return t.replace(viejo, nuevo)


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


def guion(t, opciones, k_lista, defecto):
    """El enum del `data-props` con `opciones` (el orden en que se ven) y `renderVals` con un `eN` por estado de `k_lista` (el orden de
    sus variables, que conserva las de antes)."""
    assert sorted(opciones) == sorted(k_lista)
    m = re.search(r"data-props='(\{.*?\})'", t)
    p = json.loads(m.group(1))
    p["estado"]["options"], p["estado"]["default"] = opciones, defecto
    texto = json.dumps(p, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    vals = ", ".join(f"e{i}: k === {i}" for i in range(len(k_lista)))
    clase = ("class Component extends DCLogic {\n  renderVals() {\n"
             f"    const k = {json.dumps(k_lista, ensure_ascii=False)}.indexOf(this.props.estado ?? {json.dumps(defecto, ensure_ascii=False)});\n"
             f"    return {{ si: true, no: false, {vals} }};\n  }}\n}}\n")
    i = t.index("class Component extends DCLogic {")
    j = t.index("</script>", i)
    return t[:i] + clase + t[j:]


def flecha(col, sentido, antes=False):
    """El encabezado de la columna que ordena (264): ↑ o ↓ en el color de la marca, después del título (antes, en una de números)."""
    fl = "↑" if sentido == "ascending" else "↓"
    if antes:
        return f'<span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">{fl}</span>{col}'
    return f'{col}<span class="b2-fl" aria-hidden="true">{fl}</span>'


def ordenar_w(texto, pop="", separado=True):
    """«Ordenar por», último en una barra `o-fb` (264), separado de los filtros si los hay."""
    sep = '<span class="b2-sep" aria-hidden="true"></span>' if separado else ""
    return (f'{sep}<span class="envoltura b2-ordenar"><button type="button" class="w-pil" '
            f'aria-haspopup="dialog" aria-expanded="{"true" if pop else "false"}">{texto} {b2.SVG_FLECHA}</button>{pop}</span>')


def popover(columnas, columna, orden):
    """La pieza de «Ordenar por» abierta, con «Columna» y «Orden» (264), como en `WA-Asistentes`."""
    return ('<div class="b2-pop" role="dialog" aria-label="Ordenar por"><div class="b2-pop-c"><span class="et">Columna</span>'
            + b2.campo(columna, abierto=True, aria="Columna",
                       extra=b2.lista([b2.op(c, elegida=c == columna, activa=c == columna) for c in columnas]))
            + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo(orden, aria="Orden") + "</div></div>")


FECHA = re.compile(r"(\d\d)/(\d\d)/(\d{4}), (\d\d):(\d\d)")


def clave_fecha(fila):
    d, m, a, h, mi = FECHA.search(fila).groups()
    return a + m + d + h + mi


def reordenar(t, cabeza, clase_fila, clave, reverso=True):
    """En cada tabla que empieza con `cabeza`, las filas `clase_fila` que la siguen, ordenadas por `clave` (estable: con el mismo
    valor conservan su orden). Devuelve el texto y cuántas tablas tocó."""
    n, i = 0, 0
    while True:
        i = t.find(cabeza, i)
        if i < 0:
            return t, n
        a = fin_div(t, i)
        filas, j = [], a
        while t.startswith(f'<div class="{clase_fila}', j) or t.startswith(f'\n            <div class="{clase_fila}', j):
            k = t.index("<div", j)
            fin = fin_div(t, k)
            filas.append(t[j:fin])
            j = fin
        assert len(filas) >= 2, (cabeza, len(filas))
        t = t[:a] + "".join(sorted(filas, key=clave, reverse=reverso)) + t[j:]
        n += 1
        i = a


# ---------------------------------------------------------------------------------------------------------------- 1 · los equipos
# (equipo, bandeja, personas, cantidad, aviso, aviso corto, asistente). Los asistentes, los de `WA-Asistentes` en «Varios».
EQUIPOS = [("Ventas", "Clientes", "Lucía Fernández, Carolina Vega", "2", "A los 10 minutos", "A los 10 min", "Delta Ventas"),
           ("Soporte", "Clientes", "Tomás Acosta, Paula Méndez", "2", "A los 15 minutos", "A los 15 min", "Delta Soporte"),
           ("Atención general", "Clientes", "Lucía Fernández, Tomás Acosta, Martín Paz", "3", "A los 10 minutos", "A los 10 min", None),
           ("Carga de pedidos", "Internos", "Martín Paz", "1", "A los 30 minutos", "A los 30 min", None)]
POR_EQUIPO = sorted(EQUIPOS, key=lambda e: e[0])  # de la A a la Z, como abre la app (264)
POR_ASISTENTE = (sorted((e for e in EQUIPOS if e[6]), key=lambda e: (e[6], e[0]))
                 + sorted((e for e in EQUIPOS if not e[6]), key=lambda e: e[0]))  # lo vacío al final
EQ_COLS = ["Equipo", "Bandeja", "Personas", "Cantidad", "Asistente", "Aviso por correo"]
EQ_ORDENAN = [c for c in EQ_COLS if c != "Personas"]  # «Personas» son varios valores (264)
ORDEN_EQUIPO = "Ordenar por: Equipo, de la A a la Z"
ORDEN_ASISTENTE = "Ordenar por: Asistente, de la A a la Z"
SIN_AVISO = "Carga de pedidos"  # el equipo de «Equipo sin aviso»

CSS_EQUIPOS = e14l.CSS_LISTADO + """
/* v189 · Equipos: la columna «Asistente» de la E24, entre «Cantidad» y «Aviso por correo», como en «Editar equipo». */
.w-th.e.eq24, .w-tr.e.eq24 { grid-template-columns: minmax(0, 1fr) 116px minmax(0, 2fr) 64px 130px 116px 48px; }
/* «Ordenar por», último en la barra (264): la lista no tiene búsqueda ni filtros. */
.o-fb { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.w-caja.o-fb { overflow: visible; position: relative; z-index: 5; }
.o-fb button.w-pil { font: inherit; cursor: pointer; }
/* El ⋮ abierto va con su fila, que puede ser la última. */
.w-tr.eq24 { position: relative; }
.w-caja:has(.ta-menu) { overflow: visible; }
.w-tr.eq24 .ta-menu { top: 100%; right: 8px; width: 220px; }
"""
CSS_EQUIPOS_TEL = e12l.CSS_TEL + """
/* v189 · Equipos: cada equipo, una tarjeta con sus datos nombrados (263), con el asistente de la E24; «Ordenar por» arriba (264). */
.ap-cuerpo .b2-tj { flex-shrink: 0; }
"""
EQ_K = ["Lista", "Menú del equipo", "Editar equipo", "Editar equipo · errores", "Borrar equipo", "Equipo sin aviso", "Sin equipos",
        "Ordenado por Asistente", "Ordenar por abierto"]
EQ_OPCIONES = ["Lista", "Ordenado por Asistente", "Ordenar por abierto", "Menú del equipo", "Editar equipo", "Editar equipo · errores",
               "Borrar equipo", "Equipo sin aviso", "Sin equipos"]


def wa_equipos():
    nombre = "WA-Equipos"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    keb = svg(t, 'aria-label="Acciones de Ventas">')
    paginas = [sc_ifs(t, f"e{k}")[0] for k in range(7)]
    for (_, b), (a, _) in zip(paginas, paginas[1:]):
        assert b == a, "las páginas de los estados no van seguidas"
    a, b = paginas[0][0], paginas[-1][1]

    def banda(k):
        i, j = paginas[k]
        bloque = t[i:j]
        return bloque[bloque.index(">") + 1:bloque.index('<div class="w-body">')]
    banda_llena, banda_vacia = banda(0), banda(6)
    assert "4 equipos" in banda_llena and "0 equipos" in banda_vacia

    # El ⋮ de Ventas, que se abría sobre la primera fila: va adentro de su fila, sin la posición de antes.
    menus = sc_ifs(t, "e1")
    assert len(menus) == 2
    menu = re.search(r'<div class="ta-menu".*</div>', t[menus[1][0]:menus[1][1]], re.S).group(0)
    menu = re.sub(r' style="[^"]*"', "", menu, count=1)
    assert menu.startswith('<div class="ta-menu" role="menu" aria-label="Acciones de Ventas">'), menu[:80]

    def encabezado(por):
        celdas = []
        for c in EQ_COLS:
            num = c == "Cantidad"
            estilo = ' style="text-align: right;"' if num else ""
            if c == por:
                celdas.append(f'<span aria-sort="ascending"{estilo}>{flecha(c, "ascending", antes=num)}</span>')
            else:
                celdas.append(f"<span{estilo}>{c}</span>")
        return f'<div class="w-th e eq24">{"".join(celdas)}<span class="sr">Acciones</span></div>'

    def fila(eq, abierto=False, sin_aviso=False):
        n, bandeja, personas, cant, aviso, _, asis = eq
        if sin_aviso and n == SIN_AVISO:
            aviso = "Sin aviso"
        return (f'<div class="w-tr e eq24"><span class="dos"><b>{n}</b></span><span>Bandeja {bandeja}</span><span>{personas}</span>'
                f'<span class="r">{cant}</span>{f"<span>{asis}</span>" if asis else NADA}<span>{aviso}</span>'
                f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib{" on" if abierto else ""}" '
                f'aria-label="Acciones de {n}" aria-haspopup="menu" aria-expanded="{"true" if abierto else "false"}">{keb}</button></span>'
                f'{menu if abierto else ""}</div>')

    def barra(texto, abierto=False):
        pop = popover(EQ_ORDENAN, "Equipo", "De la A a la Z") if abierto else ""
        return f'<div class="w-caja o-fb">{ordenar_w(texto, pop, separado=False)}</div>'

    def pagina(filas, por="Equipo", texto=ORDEN_EQUIPO, abierto_orden=False, menu_en=None, sin_aviso=False):
        return (banda_llena + f'<div class="w-body">{barra(texto, abierto_orden)}<div class="w-caja">{encabezado(por)}'
                + "".join(fila(e, e[0] == menu_en, sin_aviso) for e in filas) + "</div></div>")

    vacia = (banda_vacia + f'<div class="w-body"><div class="w-caja">{encabezado("Equipo")}'
             '<div class="vacio"><strong>Todavía no hay equipos</strong></div></div></div>')
    plan = {
        "Lista": pagina(POR_EQUIPO),
        "Menú del equipo": pagina(POR_EQUIPO, menu_en="Ventas"),
        "Editar equipo": pagina(POR_EQUIPO),
        "Editar equipo · errores": pagina(POR_EQUIPO),
        "Borrar equipo": pagina(POR_EQUIPO),
        "Equipo sin aviso": pagina(POR_EQUIPO, sin_aviso=True),
        "Sin equipos": vacia,
        "Ordenado por Asistente": pagina(POR_ASISTENTE, por="Asistente", texto=ORDEN_ASISTENTE),
        "Ordenar por abierto": pagina(POR_EQUIPO, abierto_orden=True),
    }
    assert list(plan) == EQ_K
    t = t[:a] + "".join(sc(f"e{k}", plan[e], si=k == 0) for k, e in enumerate(EQ_K)) + t[b:]
    # Se va el ⋮ de antes, encima de todo: ahora va con su fila.
    menus = sc_ifs(t, "e1")
    assert len(menus) == 2 and "ta-menu" in t[menus[1][0]:menus[1][1]]
    t = t[:menus[1][0]] + t[menus[1][1]:]
    t = guion(t, EQ_OPCIONES, EQ_K, "Lista")
    t = con_css(t, CSS_EQUIPOS)
    escribir(nombre, t, nl)
    return True


M_EQ_K = ["Lista", "Acciones del equipo", "Editar equipo", "Editar equipo · errores", "Borrar equipo", "Equipo sin aviso",
          "Sin equipos", "Ordenar por"]
M_EQ_OPCIONES = ["Lista", "Ordenar por", "Acciones del equipo", "Editar equipo", "Editar equipo · errores", "Borrar equipo",
                 "Equipo sin aviso", "Sin equipos"]


def m_wa_equipos():
    nombre = "M-WA-Equipos"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    volver = svg(t, '<a class="ap-ib" aria-label="Volver" href="M-WA-Menu.dc.html">')
    boton = f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">{ORDEN_EQUIPO} {b2.SVG_FLECHA}</button></div>'

    def tarjetas(sin_aviso):
        out = []
        for n, bandeja, personas, _, _, corto, asis in POR_EQUIPO:
            aviso = "Sin aviso" if sin_aviso and n == SIN_AVISO else corto
            out.append(e24.tarjeta_sin_enlace(n, [("Bandeja", bandeja), ("Asistente", asis or b2.NADA_T),
                                                  ("Personas", personas, True), ("Aviso", aviso)], n))
        return "".join(out)

    for k in reversed(range(7)):
        a, b = sc_ifs(t, f"e{k}")[0]
        bloque = t[a:b]
        i = bloque.index('<div class="ap-cuerpo">')
        j = fin_div(bloque, i)
        if 'class="ap-fila"' not in bloque[i:j]:
            assert k == 6, k  # «Sin equipos»: sin lista, sin «Ordenar por»
            continue
        assert bloque[i:j].count('class="ap-fila"') == 4
        bloque = bloque[:i] + boton + f'<div class="ap-cuerpo">{tarjetas(k == 5)}</div>' + bloque[j:]
        t = t[:a] + bloque + t[b:]
    # «Ordenar por»: su pantalla, con «Columna» y «Orden» (264), como en `M-WA-Asistentes`.
    a, b = sc_ifs(t, "e0")[0]
    est = re.search(r'<div class="ap-est">.*?</div>', t[a:b], re.S).group(0)
    _, b6 = sc_ifs(t, "e6")[0]
    t = t[:b6] + sc("e7", est + e14l.pantalla_ordenar(volver, nombre, "Equipo", "De la A a la Z")) + t[b6:]
    assert "ap-fila" not in t[t.index("</helmet>"):t.index("<script")]
    t = guion(t, M_EQ_OPCIONES, M_EQ_K, "Lista")
    t = con_css(t, CSS_EQUIPOS_TEL)
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- 2 · lo prellenado
PRE = "Datos que van prellenados"
PRE_ELEGIR = "Elegir los datos prellenados"
PRE_DATOS = [("Cliente", "Ferretería Rosales"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "125.500,00"),
             ("Fecha de la visita", "27/09/2026")]
PRE_INFO = "Tomás los ve cargados y los puede cambiar. Lo que destildes va vacío."
CSS_PRE = b2.css() + """
/* v189 · «Datos que van prellenados» en la pieza múltiple (262), en lugar de las casillas; la lista abierta sale del diálogo. */
.w-dlg:has(.b2-pkl) { overflow: visible; }
.w-dlg .w-cmp .b2-env { width: 100%; }
.w-dlg .w-cmp .b2-pkl { z-index: 60; }
/* La casilla de la lista no toma las medidas del botón `.cb` del tablero. */
.b2-op .cb { height: 16px; padding: 0; gap: 0; }
"""
CSS_PRE_TEL = b2.css(True) + """
/* v189 · «Datos que van prellenados» en la pieza múltiple (262), en lugar de las casillas; abierta, a pantalla completa. */
.ap-cmp .b2-env { width: 100%; }
.ap-cmp .rt .b2-i { margin-left: 6px; }
"""


def datos_de(html, patron):
    datos = re.findall(patron, html, re.S)
    assert datos == PRE_DATOS, datos
    return datos


def wa_chats_sugerencia():
    nombre = "WA-Chats-Sugerencia"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    i = t.index('<div class="c-pre">')
    j = fin_div(t, i)
    viejo = t[i:j]
    datos_de(viejo, r'<span class="rg-ck on"><span class="bx">(?:<svg.*?</svg>)?</span><span class="tx"><b>([^<]+)</b><small>([^<]+)</small>')
    info = re.search(r'<span class="f-i" tabindex="0" role="img" aria-label="' + re.escape(PRE_INFO) + r'".*?</svg></span>', viejo, re.S).group(0)
    cerrado = mas([n for n, _ in PRE_DATOS], tope=72)  # en el campo del diálogo entran unos 72 caracteres antes de «y N más»

    def campo(abierto):
        extra = b2.lista([b2.op(n, v, elegida=True, multiple=True) for n, v in PRE_DATOS], multiple=True) if abierto else ""
        return f'<div class="w-cmp"><span class="rt">{PRE} {info}</span>{b2.campo(cerrado, abierto=abierto, aria=PRE, extra=extra)}</div>'
    t = t[:i] + campo(False) + t[j:]

    # El estado nuevo, copia de «Revisar y enviar» con la lista abierta.
    t, sv = sumar_estados(t, [("Revisar y enviar", [PRE_ELEGIR])], [PRE_ELEGIR])
    s = sv[PRE_ELEGIR]
    bloques = sc_ifs(t, "s1")
    assert len(bloques) == 3 and PRE in t[bloques[2][0]:bloques[2][1]]
    for k, (a, b) in reversed(list(enumerate(bloques))):
        copia = renombrar(t[a:b], "s1", s)
        if k == 2:
            copia = una(copia, campo(False), campo(True))
        t = t[:b] + copia + t[b:]
    t = js_lista(t, "modoMan", lambda lista: lista.append(PRE_ELEGIR))
    t = js_mapa(t, r"vistaPrevia: (\{[^}]*\})\[e\]", {PRE_ELEGIR: "Recién salgo de Ferretería Rosales…"})
    t = js_mapa(t, r"hora: (\{[^}]*\})\[e\]", {PRE_ELEGIR: "27/09/2026, 10:33"})
    assert "rg-ck" not in t[t.index("</helmet>"):t.index("<script")]
    t = con_css(t, CSS_PRE)
    escribir(nombre, t, nl)
    return True


def m_wa_conversacion_asistente():
    nombre = "M-WA-Conversacion-Asistente"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    i = t.index(f'<div class="p-tit2">{PRE}')
    j = t.index('</div><div class="hp">', i)
    viejo = t[i:j]
    datos_de(viejo, r'<span class="t-opc on"><span class="tx"><b>([^<]+)</b><small>([^<]+)</small>')
    assert viejo.count('class="t-opc') == 4
    cerrado = mas([n for n, _ in PRE_DATOS], tope=40)  # en el campo del teléfono entran unos 40 caracteres
    nuevo = (f'<div class="ap-cmp"><span class="rt"><span>{PRE}{b2.info(PRE_INFO)}</span></span>'
             f'{b2.campo(cerrado, aria=PRE)}</div>')
    t = t[:i] + nuevo + t[j:]

    # El estado nuevo: el hilo y el escritorio de «Revisar y enviar», con la pieza a pantalla completa encima (262).
    t, sv = sumar_estados(t, [("Revisar y enviar", [PRE_ELEGIR])], [PRE_ELEGIR])
    s = sv[PRE_ELEGIR]
    bloques = sc_ifs(t, "s3")
    assert len(bloques) == 3 and nuevo in t[bloques[2][0]:bloques[2][1]] and 'class="ap-escr"' in t[bloques[1][0]:bloques[1][1]]
    pieza = b2.pk_tel(PRE, [(n, v, True, None) for n, v in PRE_DATOS], multiple=True, listo=f"Listo ({len(PRE_DATOS)})")
    t = t[:bloques[2][1]] + sc(s, pieza) + t[bloques[2][1]:]
    for a, b in reversed(bloques[:2]):
        t = t[:b] + renombrar(t[a:b], "s3", s) + t[b:]
    assert "t-opc" not in t[t.index("</helmet>"):t.index("<script")]
    t = con_css(t, CSS_PRE_TEL)
    escribir(nombre, t, nl)
    return True


def mas(nombres, tope):
    """Varias, por su nombre, y «y N más» si no entran (262), como `e21_reglas_1004.mas`."""
    texto = ", ".join(nombres)
    if len(texto) <= tope:
        return texto
    for n in range(len(nombres) - 1, 0, -1):
        corto = ", ".join(nombres[:n]) + f" y {len(nombres) - n} más"
        if len(corto) <= tope:
            return corto
    return f"{nombres[0]} y {len(nombres) - 1} más"


# ---------------------------------------------------------------------------------------------------------------- 3 · las tablas de la base 2
CSS_TABLAS_W = """
/* v189 · La tabla ordena (264): la flecha en la columna con que abre y «Ordenar por», último en la barra y separado de los filtros. */
.o-fb button.w-pil { font: inherit; cursor: pointer; }
.b2-ordenar { position: relative; }
"""
CSS_TABLAS_AB = """
/* v189 · La tabla ordena (264): la flecha en la columna con que abre y «Ordenar por», último en la barra y separado de los filtros. */
"""


def con_ordenar_w(t, texto, estados):
    """«Ordenar por» al final de cada barra `o-fb` de la tabla."""
    n = 0
    for m in reversed(list(re.finditer(r'<div class="w-caja o-fb">', t))):
        j = fin_div(t, m.start())
        t = t[:j - len("</div>")] + ordenar_w(texto) + t[j - len("</div>"):]
        n += 1
    assert n == estados, (n, estados)
    return t


def wa_difusiones():
    nombre = "WA-Difusiones-Base2"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    t = con_ordenar_w(t, "Ordenar por: Fecha, más reciente primero", 1)
    t = una(t, "<span>Fecha</span><span class=\"sr\">Acciones</span>",
            f'<span aria-sort="descending">{flecha("Fecha", "descending")}</span><span class="sr">Acciones</span>')
    t, n = reordenar(t, '<div class="w-th f">', "w-tr f", clave_fecha)
    assert n == 1
    t = con_css(t, CSS_TABLAS_W)
    escribir(nombre, t, nl)
    return True


def wa_difusion_resultados():
    nombre = "WA-Difusion-Resultados-Base2"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    t = con_ordenar_w(t, "Ordenar por: Último cambio, más reciente primero", 2)
    viejo = "<span>Último cambio</span><span class=\"sr\">Acciones</span>"
    assert t.count(viejo) == 2
    t = t.replace(viejo, f'<span aria-sort="descending">{flecha("Último cambio", "descending")}</span><span class="sr">Acciones</span>')
    t, n = reordenar(t, '<div class="w-th r">', "w-tr r", clave_fecha)
    assert n == 2
    t = con_css(t, CSS_TABLAS_W)
    escribir(nombre, t, nl)
    return True


def auditoria_plat():
    nombre = "Auditoria-Plat-Base2"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    i = t.index('<div class="fb" role="search" aria-label="Filtrar la auditoría">')
    j = fin_div(t, i)
    k = t.rindex("</div>", i, j)
    t = t[:k] + b2.boton_ordenar("Fecha y hora, más reciente primero") + t[k:]
    t = una(t, "<span>Fecha y hora</span><span>Qué pasó</span>",
            f'<span aria-sort="descending">{flecha("Fecha y hora", "descending")}</span><span>Qué pasó</span>')
    # Las filas ya van de la más reciente a la más vieja.
    fechas = [clave_fecha(m.group(0)) for m in FECHA.finditer(t[t.index('<div class="tt-h"'):t.index('<div class="pie centro">')])]
    assert len(fechas) == 6 and fechas == sorted(fechas, reverse=True), fechas
    t = con_css(t, CSS_TABLAS_AB)
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- todo
TABLEROS = [("WA-Equipos", wa_equipos), ("M-WA-Equipos", m_wa_equipos), ("WA-Chats-Sugerencia", wa_chats_sugerencia),
            ("M-WA-Conversacion-Asistente", m_wa_conversacion_asistente), ("WA-Difusiones-Base2", wa_difusiones),
            ("WA-Difusion-Resultados-Base2", wa_difusion_resultados), ("Auditoria-Plat-Base2", auditoria_plat)]

if __name__ == "__main__":
    hechos = [nombre for nombre, hacer in TABLEROS if hacer()]
    if hechos:
        subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(hechos)], check=True)
