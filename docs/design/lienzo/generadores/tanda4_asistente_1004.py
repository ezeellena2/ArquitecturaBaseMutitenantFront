"""El asistente de WhatsApp (E23) con lo que decidió el usuario en la tanda 4 del traspaso 15 (2026-11-18): la decisión 219 de la
hoja de ruta del back (§5) y la enmienda de la ADR 0054 (Probar con hasta cinco mensajes, cuando la IA no contesta y el motivo de
una derivación). Es el Grupo A de la tanda; cada estado nuevo se suma al tablero que ya existe, con sus piezas:

- `WA-Asistente-Probar`: Probar acepta hasta cinco mensajes, uno por renglón, y varios renglones son una ráfaga. «Cinco mensajes»
  prueba la ráfaga «Hola» / «Estoy en la sucursal Centro» / «Se rompió la heladera» / «¿Me mandan a alguien?» / «Gracias», que
  saluda y manda «Pedido de service» con la sucursal; «Seis mensajes» apaga «Probar» con «Probá hasta cinco mensajes a la vez.» en
  su tooltip, abierto como el del tope de IA. «Sin Ver respuestas» es quien prueba sin `formrecords.read`: cada acción muestra el caso
  y lo que vería la persona, sin «Por qué» ni lo que llenaría el formulario, con el renglón gris que lo dice. La (i) de «Probar» suma
  cómo se escribe una ráfaga, que ninguna otra parte de la pantalla dice;
- `WA-Chats-Casos` y su teléfono: «No pudo responder», la IA que falló o venció: el chat pasa a atención manual con «Necesita una
  persona» en la cabecera, la lista y su filtro, el motivo «El asistente no pudo responder» en la franja y el mensaje fijo al
  derivar, porque la ventana de 24 horas sigue abierta. «Por qué derivó», una derivación por el validador: el globo (la hoja, en el
  teléfono) dice el caso y el motivo en una línea, «No se mandó: pasaba el largo máximo.»; en la compu, Martina contesta después,
  así el globo se abre hacia abajo sin tapar el mensaje que explica. La hora de la fila de Martina va con su coma (205), como las
  demás de la lista;
- `FRM-Faltan`, `FRM-Faltan-25`, `M-FRM-Faltan` y, con `whatsapp.manage`, `WA-Preguntas-Sin-Respuesta` y su teléfono (219): un tema
  nuevo, o uno descartado que vuelve, nace «Sin revisar». La columna Estado lo dice («Sin revisar», con su (i), «Abierto» o
  «Descartado»; en el teléfono, en su renglón, antes de los datos), y el filtro Estado suma «Sin revisar» y «Abiertos» después de
  «Pendientes», que sigue siendo el de entrada (lo que no está descartado, como «Activos» en `FRM-Formularios-21`), y antes de
  «Descartados». En el ⋮ de un tema sin revisar va primero «Marcar como revisado», que lo pasa a «Abierto». Estados nuevos:
  «Marcado como revisado», con su aviso; «Otra persona ya lo revisó», con el aviso de conflicto de siempre (el 409 de
  `General.ConcurrencyConflict`) y la fila ya releída, y, en la compu, «Sin revisar», el filtro con la (i) abierta. En `FRM-Faltan-25`
  «Armar con la IA» sigue en cada tema, también en los sin revisar, y «Acciones de un tema» suma la fila de «Remitos de proveedores»
  que le faltaba (decía «1–4 de 4» con tres filas).

Corre después de `formularios_23_asistente_1004.py`, `formularios_23_chats_1004.py` y `formularios_25_documentos_1004.py`, sobre los
tableros que ya están; al terminar imprime los que cambió para la pasada de las piezas (`python traspaso10_piezas_1004.py --tableros
…`). El CSS nuevo va en un bloque `<style data-t4a="asistente">`, en px de antes de la escala (la pasada de las piezas lo escala en
la compu). No toca `canvas.json`. Lee y escribe sin cambiar los finales de línea, y una segunda corrida no cambia nada: un estado
sumado no se suma otra vez y lo que ya está hecho no vuelve a encontrar lo que busca.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-t4a="asistente"'


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


def hijos(html):
    """Los elementos de primer nivel de `html`: (inicio, fin)."""
    res, i = [], 0
    abre = re.compile(r"<(span|div|a|button)\b")
    while (m := abre.search(html, i)):
        fin = cierre(html, m.start(), m.group(1))
        res.append((m.start(), fin))
        i = fin
    return res


def nl(t):
    return "\r\n" if "\r\n" in t else "\n"


def con_css(t, css):
    """El bloque propio antes del de las piezas (que siempre va último), una sola vez."""
    if MARCA in t:
        return t
    bloque = f"<style {MARCA}>\n{css.strip()}\n</style>\n".replace("\n", nl(t))
    i = t.find('<style data-t10="piezas">')
    i = i if i >= 0 else t.index("</helmet>")
    return t[:i] + bloque + t[i:]


# ---------------------------------------------------------------------------------------------------------------- las piezas
def svg(trazos, tam=16, ancho="2"):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{ancho}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{trazos}</svg>')


I_INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 14, "1.75")
I_REVISADO = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>')  # la tilde de lo elegido, como en Criterio · Menús
I_OK = svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>', 18)
I_MAL = svg('<path d="M8.7 3h6.6L21 8.7v6.6L15.3 21H8.7L3 15.3V8.7z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/>', 18)
I_CERRAR = svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>')
CONFLICTO = "Otra persona cambió esto. Revisá la versión más reciente antes de guardar."  # General.ConcurrencyConflict del back
SIN_REVISAR_I = "El asistente no usa este tema con otras personas hasta que alguien lo revisa."


def f_i(texto):
    return f'<span class="f-i" tabindex="0" role="img" aria-label="{texto}" title="{texto}">{I_INFO}</span>'


def aviso(texto, mal=False):
    """El aviso de abajo (210): lo que salió bien, o la acción que falló."""
    return (f'<div class="f-toast" role="status"><span class="{"mal" if mal else "ok"}">{I_MAL if mal else I_OK}</span><span>{texto}</span>'
            f'<button type="button" class="ib" aria-label="Cerrar">{I_CERRAR}</button></div>')


def aviso_tel(texto, mal=False):
    return f'<div class="t-toast" role="status"><span class="{"mal" if mal else "ok"}">{I_MAL if mal else I_OK}</span><span>{texto}</span></div>'


# ---------------------------------------------------------------------------------------------------------------- los estados
OPCIONES = re.compile(r'"estado":\{"editor":"enum","options":\[([^\]]*)\]')
LISTA_K = re.compile(r"const k = (\[.*?\])\.indexOf\(e\);")


def estados(t):
    return json.loads(LISTA_K.search(t).group(1))


def bloques(t, n):
    """Los `<sc-if>` del estado `n`: (inicio, fin)."""
    apertura = re.compile(r'<sc-if value="\{\{s' + str(n) + r'\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">')
    return [(m.start(), cierre(t, m.start(), "sc-if")) for m in apertura.finditer(t)]


def sumar_estado(t, base, nombre, despues_de, cambio, logica=None, capas=()):
    """Suma el estado `nombre` clonando los bloques del estado `base` (su nombre), con `cambio(número, copia)` sobre cada uno. Va en el
    Tweak después de `despues_de` y al final de la lista de la lógica, así los que ya están conservan su número. Lo que la lógica elige
    por estado lo hereda de la base: las listas `[…].includes(e)` lo suman si tienen la base, y los mapas `{…}[e]` le dan su valor,
    salvo lo que pise `logica`. `capas` son bloques que se suman al final del tablero (un aviso, una hoja)."""
    lista = estados(t)
    if nombre in lista:
        return t
    b, nuevo = lista.index(base), len(lista)
    m = OPCIONES.search(t)
    opciones = json.loads("[" + m.group(1) + "]")
    opciones.insert(opciones.index(despues_de) + 1, nombre)
    t = t[:m.start(1)] + ",".join(json.dumps(o, ensure_ascii=False) for o in opciones) + t[m.end(1):]
    mk = LISTA_K.search(t)
    t = t[:mk.start(1)] + json.dumps(lista + [nombre], ensure_ascii=False) + t[mk.end(1):]
    n = nl(t)
    ultimo = f"      s{nuevo - 1}: k === {nuevo - 1},{n}"
    t = cambiar(t, ultimo, ultimo + f"      s{nuevo}: k === {nuevo},{n}", 1)
    # Las listas de nombres: el nuevo entra si está la base.
    for ma in list(re.finditer(r"(\w+): \[([^\]]*)\]\.includes\(e\)", t)):
        items = re.findall(r"""(["'])(.*?)\1""", ma.group(2))
        if base in [x for _q, x in items]:
            q = items[0][0]
            t = t.replace(ma.group(0), f"{ma.group(1)}: [{ma.group(2)}, {q}{nombre}{q}].includes(e)", 1)
    # Los mapas por nombre: el valor de la base, o el que dice `logica`.
    for ma in list(re.finditer(r"(\w+): (?:'[^']*' \+ \()?(\{[^{}]*\})\[e\]", t)):
        mapa = json.loads(ma.group(2))
        mapa[nombre] = (logica or {}).get(ma.group(1), mapa.get(base, ""))
        t = t.replace(ma.group(2) + "[e]", json.dumps(mapa, ensure_ascii=False) + "[e]", 1)
    # Cada bloque de la base, clonado justo después del suyo.
    partes, i = [], 0
    for numero, (a, z) in enumerate(bloques(t, b)):
        original = t[a:z]
        copia = re.sub(r'^<sc-if value="\{\{s\d+\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">',
                       f'<sc-if value="{{{{s{nuevo}}}}}" hint-placeholder-val="{{{{no}}}}">', original, count=1)
        partes += [t[i:z], cambio(numero, copia)]
        i = z
    partes.append(t[i:])
    t = "".join(partes)
    for capa in capas:
        t = al_final(t, f'<sc-if value="{{{{s{nuevo}}}}}" hint-placeholder-val="{{{{no}}}}">{capa}</sc-if>')
    return t


def al_final(t, html):
    """Antes del cierre del contenedor del tablero (el último `</div>` antes de `</x-dc>`)."""
    i = t.rindex("</div>", 0, t.index("</x-dc>"))
    return t[:i] + html + t[i:]


def sin_cambio(_numero, copia):
    return copia


# ================================================================ 1 · WA-Asistente-Probar
PROBAR_I_VIEJO = "Prueba lo guardado y no manda nada. Cuenta en el tope de IA del mes."
PROBAR_I = "Prueba lo guardado y no manda nada. Un mensaje por renglón, hasta cinco: varios renglones son una ráfaga. Cuenta en el tope de IA del mes."
RAFAGA = ["Hola", "Estoy en la sucursal Centro", "Se rompió la heladera", "¿Me mandan a alguien?", "Gracias"]
SEXTO = "¿A qué hora vienen?"
SEIS = "Probá hasta cinco mensajes a la vez."
SIN_VER = "Sin «Ver respuestas» no se ve el porqué ni lo que llenaría el formulario."
CSS_PROBAR = """
/* Tanda 4 · Probar con una ráfaga: un mensaje por renglón, y el renglón de quien no tiene «Ver respuestas». */
.pr-in .ct.area.t4a-lineas { display: block; height: auto; padding-bottom: 9px; }
.pr-ac .pr-sin { font-size: 12.5px; line-height: 1.45; color: var(--t3); }
/* «Probar» apagado: el tooltip, debajo del botón y no en la otra punta del panel (también el del tope de IA). */
.pr-in > .e-tipw { align-self: flex-start; }
.pr-in > .e-tipw .e-tip { left: 0; right: auto; }
.pr-in > .e-tipw .e-tip::before { left: 18px; right: auto; }
"""


def area(lineas):
    return f'<div class="ct area t4a-lineas">{"<br>".join(lineas)}</div>'


def accion(n, que, burbuja, caso, uso, por):
    return (f'<div class="pr-ac"><span class="n">{n}</span><div class="tx"><b>{que}</b><div class="pr-burb">{burbuja}</div>'
            f'<span class="pr-g"><span class="k">Caso</span><span>{caso}</span><span class="k">Usó</span><span>{uso}</span>'
            f'<span class="k">Por qué</span><span>{por}</span></span></div></div>')


def resultado(copia):
    """(inicio, fin) de «Lo que haría»."""
    a = copia.index('<div class="pr-res">')
    return a, cierre(copia, a, "div")


def probar(t):
    t = cambiar(t, PROBAR_I_VIEJO, PROBAR_I, 14)
    t = con_css(t, CSS_PROBAR)
    heladera = '<div class="ct area">Se rompió la heladera en la sucursal Centro</div>'

    def cinco(numero, copia):
        if numero == 0:
            return copia  # la banda
        copia = cambiar(copia, heladera, area(RAFAGA), 1)
        a, z = resultado(copia)
        res = copia[a:z]
        i = res.index('<div class="pr-ac">')
        formulario = res[i:cierre(res, i, "div")]
        formulario = cambiar(formulario, "Coincide con «Cuándo lo ofrece» de Pedido de service. La sucursal sale del mensaje.",
                             "Pide que vaya alguien por la heladera: coincide con «Cuándo lo ofrece» de Pedido de service. "
                             "La sucursal sale del segundo mensaje.", 1)
        formulario = formulario.replace('<span class="n">1</span>', '<span class="n">2</span>', 1)
        saludo = accion(1, "Responder con el conocimiento", "¡Hola! Lamento lo de la heladera.", "Cualquier otra cosa",
                        "La presentación del perfil", "Saluda y cuenta que se rompió la heladera.")
        res = res[:i] + saludo + formulario + res[cierre(res, i, "div"):]
        return copia[:a] + res + copia[z:]

    def sin_ver(numero, copia):
        if numero == 0:
            return copia
        a, z = resultado(copia)
        res = copia[a:z]
        pre = res.index('<span class="as-pre">')
        res = res[:pre] + res[cierre(res, pre, "span"):]
        res = cambiar(res, '<span class="k">Por qué</span><span>Coincide con «Cuándo lo ofrece» de Pedido de service. La sucursal sale del mensaje.</span></span>',
                      f'</span><span class="pr-sin">{SIN_VER}</span>', 1)
        return copia[:a] + res + copia[z:]

    def seis(numero, copia):
        if numero == 0:
            return copia
        copia = cambiar(copia, '<div class="ct area">¿Hacen envíos a Córdoba?</div>', area(RAFAGA + [SEXTO]), 1)
        return cambiar(copia, "Se agotó el tope de IA del mes.", SEIS, 2)

    t = sumar_estado(t, "Se rompió la heladera", "Cinco mensajes", "Hola y la hora", cinco)
    t = sumar_estado(t, "Se rompió la heladera", "Sin Ver respuestas", "Cinco mensajes", sin_ver)
    t = sumar_estado(t, "Tope de IA agotado", "Seis mensajes", "Tope de IA agotado", seis)
    return t


# ================================================================ 2 · WA-Chats-Casos y su teléfono
DERIVAR = "Ya le paso tu consulta a una persona del equipo. Te responde por acá."
NO_PUDO = "El asistente no pudo responder"
MOTIVO_LARGO = "No se mandó: pasaba el largo máximo."
CASO_1 = "Caso 1 · Pregunta por envíos, precios, horarios o garantías"
PREG_FALLA, PREG_GARANTIA = "¿Puedo cambiar la heladera por una más grande?", "¿Qué cubre la garantía de la heladera?"
ESPERA = ["Dale, espero.", "Es la de la sucursal Centro."]
CSS_CASOS = """
/* Tanda 4 · El motivo de una derivación en el globo, en una línea. */
.as-pop .t4a-mot { display: block; margin-top: 6px; }
"""
CSS_CASOS_TEL = """
/* Tanda 4 · El motivo de una derivación en la hoja, en una línea. */
.t-pq .t4a-mot { margin: 0; font-size: 15px; line-height: 1.4; }
"""


def mensaje_del(copia, clase, texto):
    """(inicio, fin) del mensaje `w-m`/`ap-m` que dice `texto`."""
    i = copia.index(texto)
    a = copia.rindex(f'<div class="{clase}', 0, i)
    return a, cierre(copia, a, "div")


def chats(t, tel=False):
    m, sis = ("ap-m", "ap-sis") if tel else ("w-m", "o-sis")
    if not tel:
        t = cambiar(t, "hora: '27/09/2026 ' + (", "hora: '27/09/2026, ' + (", 1)
    t = con_css(t, CSS_CASOS_TEL if tel else CSS_CASOS)

    def no_pudo(numero, copia):
        if 'class="o-sis"' not in copia and 'class="ap-sis"' not in copia:
            return copia  # el pie del chat, en atención manual
        entra = "Quiero hablar con alguien" if not tel else "¿Hacen envíos a Córdoba?"
        copia = cambiar(copia, f'<span class="gl">{entra}</span>', f'<span class="gl">{PREG_FALLA}</span>', 1)
        if tel:
            a, z = mensaje_del(copia, "ap-m sal", "¿A qué ciudad de Córdoba sería?")
            copia = copia[:a] + copia[z:]
        hora = "10:36" if not tel else "10:30"
        copia = cambiar(copia, f'<span class="pie">{hora}</span>', '<span class="pie">10:44</span>', 1)
        copia = cambiar(copia, f"Asistente · {hora} · Leído", "Asistente · 10:45 · Leído", 1)
        return cambiar(copia, f'<span class="{sis}">Pasó a atención manual · Necesita una persona</span>',
                       f'<span class="{sis}">{NO_PUDO} · Necesita una persona</span>', 1)

    def derivo(numero, copia):
        if 'class="o-sis"' not in copia and 'class="ap-sis"' not in copia:
            return copia
        copia = cambiar(copia, '<span class="gl">¿Hacen envíos a Córdoba?</span>', f'<span class="gl">{PREG_GARANTIA}</span>', 1)
        a, z = mensaje_del(copia, f"{m} sal", "¿A qué ciudad de Córdoba sería?")
        copia = copia[:a] + copia[z:]
        copia = cambiar(copia, '<span class="pie">10:30</span>', '<span class="pie">10:46</span>', 1)
        copia = cambiar(copia, "Asistente · 10:30 · Leído", "Asistente · 10:46 · Leído", 1)
        if tel:
            return copia  # el porqué va en la hoja
        boton = '<button type="button" class="as-pq" aria-expanded="false">Por qué respondió esto</button>'
        copia = cambiar(copia, boton, boton.replace('"false"', '"true"') + globo, 1)
        # Martina contesta después, así el globo se abre hacia abajo, como en «Por qué respondió esto».
        franja = '<span class="o-sis">Pasó a atención manual · Necesita una persona</span>'
        sigue = "".join(f'<div class="w-m ent"><span class="gl">{x}</span><span class="pie">10:47</span></div>' for x in ESPERA)
        return cambiar(copia, franja, franja + sigue, 1)

    if not tel:
        # El globo, con el título del de «Por qué respondió esto» (el ícono incluido) y el motivo en una línea.
        titulo = re.search(r'<span class="as-pop" role="dialog" aria-label="Por qué respondió esto">(<b>.*?</b>)', t, re.S).group(1)
        globo = (f'<span class="as-pop" role="dialog" aria-label="Por qué respondió esto">{titulo}'
                 f'<span class="g"><span class="k">Caso</span><span>{CASO_1}</span></span><span class="t4a-mot">{MOTIVO_LARGO}</span></span>')
        logica = {"hora": "10:45", "vistaPrevia": f"Asistente: {DERIVAR}", "atiende": "Sin tomar"}
        t = sumar_estado(t, "Quiere hablar con alguien", "No pudo responder", "El tope del día", no_pudo, logica)
        logica = {"hora": "10:47", "vistaPrevia": ESPERA[-1], "atiende": "Sin tomar"}
        t = sumar_estado(t, "Sin la información: deriva", "Por qué derivó", "Por qué respondió esto", derivo, logica)
        return t
    # En el teléfono, el porqué es una hoja, como la de «Por qué respondió esto».
    a = t.index('<div class="ap-hoja" role="dialog" aria-label="Por qué respondió esto">')
    hoja = t[a:cierre(t, a, "div")]
    i = hoja.index('<div class="t-pq">')
    hoja = (hoja[:i] + f'<div class="t-pq"><div class="f"><span class="k">Caso</span><span>{CASO_1}</span></div>'
            f'<p class="t4a-mot">{MOTIVO_LARGO}</p></div>' + hoja[cierre(hoja, i, "div"):])
    t = sumar_estado(t, "Sin la información: deriva", "No pudo responder", "Una ráfaga: tres acciones", no_pudo)
    t = sumar_estado(t, "Sin la información: deriva", "Por qué derivó", "Por qué respondió esto", derivo,
                     capas=['<div class="ap-velo"></div>' + hoja])
    return t


# ================================================================ 3 y 4 · «Sin revisar» en los temas (219)
TEMAS = {  # tablero: (los temas sin revisar, el que tiene el ⋮ abierto en «Acciones de un tema»)
    "FRM-Faltan": (["Reclamos de clientes"], "Reclamos de clientes"),
    "FRM-Faltan-25": (["Remitos de proveedores", "Reclamos de clientes"], "Reclamos de clientes"),
    "WA-Preguntas-Sin-Respuesta": (["Envíos al interior"], "Envíos al interior"),
    "M-FRM-Faltan": (["Reclamos de clientes"], "Reclamos de clientes"),
    "M-WA-Preguntas-Sin-Respuesta": (["Envíos al interior"], "Envíos al interior"),
}
DESCARTADOS = {"Encuesta de clima", "Cambio de turno", "Búsquedas laborales"}
COLUMNAS = {  # la grilla de la tabla con «Estado» antes de las acciones
    "FRM-Faltan": ".w-th.ft, .w-tr.ft { grid-template-columns: minmax(280px, 2fr) 80px 80px minmax(150px, 1fr) 110px 48px; }",
    "FRM-Faltan-25": ".w-th.ft, .w-tr.ft { grid-template-columns: minmax(240px, 3fr) 72px 72px minmax(124px, 1fr) 110px 160px !important; }",
    "WA-Preguntas-Sin-Respuesta": ".w-th.pq, .w-tr.pq { grid-template-columns: minmax(280px, 2fr) 90px 80px minmax(160px, 1fr) 110px 48px; }",
}
CSS_TIP = """
.e-tipw { position: relative; display: inline-flex; }
.e-tip { position: absolute; z-index: 30; top: calc(100% + 8px); right: 0; padding: 6px 10px; border-radius: 6px; background: oklch(0.27 0.012 78); color: #fff; font-size: 12.5px; font-weight: 500; white-space: nowrap; box-shadow: 0 6px 18px oklch(0.24 0.014 78 / 0.2); }
.e-tip::before { content: ""; position: absolute; top: -4px; right: 3px; width: 8px; height: 8px; background: inherit; transform: rotate(45deg); }
"""
CSS_TOAST_TEL = """
/* Tanda 4 · El aviso de abajo del teléfono, como el de `M-FRM-Respuesta-Aprobacion`. */
.t-toast { position: absolute; left: 12px; right: 12px; bottom: 34px; z-index: 40; display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); font-size: 15px; line-height: 1.35; }
.t-toast .ok { color: oklch(0.55 0.13 155); display: inline-flex; }
.t-toast .mal { color: oklch(0.55 0.2 25); display: inline-flex; }
"""


def celda(estado):
    if estado == "Sin revisar":
        return f'<span><span class="w-est pend">Sin revisar</span>{f_i(SIN_REVISAR_I)}</span>'
    return f'<span><span class="w-est{" off" if estado == "Descartado" else ""}">{estado}</span></span>'


def estado_tel(estado):
    return f'<span class="l3"><span class="w-est{" pend" if estado == "Sin revisar" else ""}">{estado}</span></span>'


def con_columna(t, sin_revisar):
    """La columna Estado en el encabezado y en cada fila, antes de las acciones."""
    if "<span>Estado</span><span class=\"sr\">Acciones</span>" in t:
        return t
    t = t.replace('<span class="sr">Acciones</span>', '<span>Estado</span><span class="sr">Acciones</span>')
    partes, i, filas = [], 0, 0
    for mf in re.finditer(r'<div class="w-tr (?:ft|pq)">', t):
        if mf.start() < i:
            continue
        fin = cierre(t, mf.start(), "div")
        fila = t[mf.end():fin - len("</div>")]
        nombre = re.search(r"<b>([^<]+)</b>", fila).group(1)
        estado = "Descartado" if nombre in DESCARTADOS else "Sin revisar" if nombre in sin_revisar else "Abierto"
        acc = next(a for a, _z in hijos(fila) if fila.startswith(('<span style="display: flex', '<span class="d25-acc"'), a))
        partes += [t[i:mf.end()], fila[:acc], celda(estado), fila[acc:], "</div>"]
        i = fin
        filas += 1
    partes.append(t[i:])
    assert filas, "sin filas"
    return "".join(partes)


def fila_de(html, nombre, tel=False):
    """(inicio, fin) de la fila de `nombre`."""
    clase = '<div class="ap-fila">' if tel else '<div class="w-tr '
    i = html.index(f'<span class="l1">{nombre}</span>' if tel else f"<b>{nombre}</b>")
    a = html.rindex(clase, 0, i)
    return a, cierre(html, a, "div")


def revisado(html, nombre, tel=False):
    """La fila de `nombre` ya revisada: «Abierto»."""
    a, z = fila_de(html, nombre, tel)
    fila = html[a:z]
    fila = cambiar(fila, estado_tel("Sin revisar"), estado_tel("Abierto"), 1) if tel else cambiar(fila, celda("Sin revisar"), celda("Abierto"), 1)
    return html[:a] + fila + html[z:]


def menu_estado(html):
    """El desplegable del filtro Estado: «Pendientes», el de entrada, y después cada estado."""
    a = html.find('<span class="f-mn" role="listbox" aria-label="Filtrar por estado">')
    if a < 0:
        return html
    z = cierre(html, a, "span")
    ops = "".join(f'<span role="option" class="{"on" if k == 0 else ""}">{o}</span>'
                  for k, o in enumerate(["Pendientes", "Sin revisar", "Abiertos", "Descartados"]))
    return html[:a] + f'<span class="f-mn" role="listbox" aria-label="Filtrar por estado">{ops}</span>' + html[z:]


def temas(t, nombre):
    sin_revisar, abierto = TEMAS[nombre]
    tel = nombre.startswith("M-")
    wa = "Preguntas" in nombre
    primero = sin_revisar[-1] if nombre == "FRM-Faltan-25" else sin_revisar[0]  # el del ⋮ abierto, el que se marca
    if tel:
        return temas_tel(t, nombre, sin_revisar, abierto)
    if nombre == "FRM-Faltan-25":
        t = remitos_en_acciones(t)
    t = con_columna(t, sin_revisar)
    t = con_css(t, ("/* Tanda 4 · 219: el estado de cada tema en su columna y la (i) de «Sin revisar», abierta. */\n" + COLUMNAS[nombre]
                    + ("" if ".e-tipw {" in t else CSS_TIP) + "\n.t4a-tipi .e-tip::before { right: 3px; }"))
    # El ⋮ de un tema sin revisar: primero «Marcar como revisado».
    m = re.search(rf'<div class="f-menu" role="menu" aria-label="Acciones de {abierto}">', t)
    if "Marcar como revisado</span>" not in t[m.end():m.end() + 400]:
        t = t[:m.end()] + f'<span class="f-mi" role="menuitem">{I_REVISADO} Marcar como revisado</span>' + t[m.end():]
    t = menu_estado(t)
    lista = estados(t)

    def marcado(conflicto):
        def cambio(_numero, copia):
            return revisado(copia, primero) if "<b>" in copia else copia
        texto = CONFLICTO if conflicto else f"Marcamos «{primero}» como revisado."
        return cambio, [aviso(texto, conflicto)]

    cambio, capas = marcado(False)
    t = sumar_estado(t, "Pendientes", "Marcado como revisado", "Acciones de un tema", cambio, capas=capas)
    cambio, capas = marcado(True)
    t = sumar_estado(t, "Pendientes", "Otra persona ya lo revisó", "Marcado como revisado", cambio, capas=capas)

    def filtro(_numero, copia):
        if 'class="w-bnd"' in copia[:200]:
            return cambiar(copia, '<p class="res">3 temas · 7 preguntas</p>', '<p class="res">1 tema sin revisar</p>', 1)
        if wa:
            copia = cambiar(copia, '<span class="w-pil" role="button" aria-haspopup="listbox">Estado ',
                            '<span class="w-pil con" role="button" aria-haspopup="listbox">Estado: Sin revisar ', 1)
            copia = cambiar(copia, '<span class="tot">3 temas</span>', '<span class="tot">1 tema</span>', 1)
        else:
            copia = cambiar(copia, ">Estado: pendientes ", ">Estado: sin revisar ", 1)
            tot = {"FRM-Faltan": ("3 temas · 9 pedidos", "1 tema · 5 pedidos"), "FRM-Faltan-25": ("4 temas · 12 pedidos", "2 temas · 8 pedidos")}[nombre]
            copia = cambiar(copia, f'<span class="tot">{tot[0]}</span>', f'<span class="tot">{tot[1]}</span>', 1)
        # Solo los sin revisar, con la (i) del primero abierta.
        partes, i = [], 0
        for mf in re.finditer(r'<div class="w-tr (?:ft|pq)">', copia):
            if mf.start() < i:
                continue
            fin = cierre(copia, mf.start(), "div")
            if 'class="w-est pend">Sin revisar' in copia[mf.start():fin]:
                partes.append(copia[i:fin])
            else:
                partes.append(copia[i:mf.start()])
            i = fin
        partes.append(copia[i:])
        copia = "".join(partes)
        n = len(sin_revisar)
        copia = re.sub(r"<span>1–\d de \d</span>", f"<span>1–{n} de {n}</span>", copia, count=1)
        i = copia.index(f_i(SIN_REVISAR_I))
        abierta = f'<span class="e-tipw t4a-tipi">{f_i(SIN_REVISAR_I)}<span class="e-tip" role="tooltip">{SIN_REVISAR_I}</span></span>'
        return copia[:i] + abierta + copia[i + len(f_i(SIN_REVISAR_I)):]

    t = sumar_estado(t, "Pendientes", "Sin revisar", "Estado: menú", filtro)
    assert estados(t)[:len(lista)] == lista
    return t


def remitos_en_acciones(t):
    """`FRM-Faltan-25` · «Acciones de un tema» tenía tres filas con «1–4 de 4»: le falta la primera, la de los remitos."""
    (a, z), = [(a, z) for a, z in bloques(t, 1) if 'class="w-body"' in t[a:a + 200]]
    bloque = t[a:z]
    if "Remitos de proveedores" in bloque:
        return t
    (a0, z0), = [(a, z) for a, z in bloques(t, 0) if 'class="w-body"' in t[a:a + 200]]
    i = t.index("<b>Remitos de proveedores</b>", a0, z0)
    r0 = t.rindex('<div class="w-tr ft">', a0, i)
    remitos = t[r0:cierre(t, r0, "div")]
    j = bloque.index('<div class="w-tr ft">')
    return t[:a] + bloque[:j] + remitos + bloque[j:] + t[z:]


def temas_tel(t, nombre, sin_revisar, abierto):
    t = con_css(t, CSS_TOAST_TEL)
    # El estado en su renglón, con su punto, antes de los datos de cada tema que no está descartado.
    if '<span class="l3"><span class="w-est' not in t:
        def l3(m):
            nom, datos = m.group(1), m.group(3)
            if datos.startswith("Descartado"):
                return m.group(0)
            return m.group(0).replace(f'<span class="l3">{datos}', estado_tel("Sin revisar" if nom in sin_revisar else "Abierto") + f'<span class="l3">{datos}', 1)
        t = re.sub(r'<span class="l1">([^<]+)</span>(<span class="l2">[^<]*</span>)<span class="l3">([^<]*)</span>', l3, t)
    # La hoja del ⋮ de un tema sin revisar: primero «Marcar como revisado».
    m = re.search(rf'<div class="ap-hoja" role="dialog" aria-label="{abierto}">.*?<div class="ap-acciones2">', t, re.S)
    if "Marcar como revisado" not in t[m.end():m.end() + 300]:
        t = t[:m.end()] + f'<span role="menuitem">{I_REVISADO} Marcar como revisado</span>' + t[m.end():]
    primero = sin_revisar[0]

    def cambio(_numero, copia):
        return revisado(copia, primero, tel=True) if 'class="ap-fila"' in copia else copia
    t = sumar_estado(t, "Pendientes", "Marcado como revisado", "Acciones de un tema", cambio,
                     capas=[aviso_tel(f"Marcamos «{primero}» como revisado.")])
    t = sumar_estado(t, "Pendientes", "Otra persona ya lo revisó", "Marcado como revisado", cambio,
                     capas=[aviso_tel(CONFLICTO, mal=True)])
    return t


# ---------------------------------------------------------------------------------------------------------------- el pase
def pasar(nombre, t):
    if nombre == "WA-Asistente-Probar":
        return probar(t)
    if nombre in ("WA-Chats-Casos", "M-WA-Chats-Casos"):
        return chats(t, tel=nombre.startswith("M-"))
    return temas(t, nombre)


TABLEROS = ["WA-Asistente-Probar", "WA-Chats-Casos", "M-WA-Chats-Casos", "FRM-Faltan", "M-FRM-Faltan", "FRM-Faltan-25",
            "WA-Preguntas-Sin-Respuesta", "M-WA-Preguntas-Sin-Respuesta"]

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
