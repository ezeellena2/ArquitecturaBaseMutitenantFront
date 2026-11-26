"""Los asistentes y los chats con el asistente de la E23 y la E24 con el traspaso 18, tanda 4 (tanda 3B de Diseño, grupo J2,
2026-11-26), redibujados en su lugar con los pedidos del 19/11 y el 25/11 (manda la decisión citada):

- `WA-Asistentes`: «Principal» deja de ser una etiqueta (`ab-chip`) junto a «Delta» y pasa a su columna, con «Sí» y su (i), o «—»
  (206 y `Criterio-Tablas`). La barra suma la búsqueda, el filtro «Estado» con su botón y la pieza, sin cantidades (262), y «Ordenar
  por», último y separado (264). El encabezado ordena «Asistente», «Principal» y «Estado»; «Equipos» no, porque son varios valores
  (264). Sin orden elegido va el principal primero y después por nombre, sin flecha, y el botón dice solo «Ordenar por»; con cuatro,
  «Delta Obras» va segundo. Delta Obras, de baja, conserva su equipo (Atención general), como dice la spec al darlo de baja. La frase
  de «Nuevo asistente» pasa a la (i) del título (sin leyendas). Estados nuevos: «Filtro de estado abierto», «Ordenado por Estado» y
  «Ordenar por abierto». La primera carga es el encabezado y el aro (160).
- `M-WA-Asistentes`: cada asistente es una tarjeta con Principal, Equipos y Estado nombrados; se va «Delta · principal» debajo del
  nombre (263). «Ordenar por» arriba de la lista, y Buscar y Filtros en la barra, como `M-FRM-Formularios` (264 y 262). Estados
  nuevos: «Acciones del principal» («Dar de baja» apagado con su motivo en un tooltip, también en el teléfono, 211), «Un asistente de
  baja» (con «Reactivar» en su hoja), «Filtros» y «Ordenar por».
- `WA-Equipo-Asistente` y `M-WA-Equipo-Asistente`: en «Editar equipo», todo lo que se elige va en la pieza (262): Personas (varias,
  por su nombre), «Asistente de este equipo» y el aviso por correo. Sin elegir, el campo dice en gris «Contesta el principal», que es
  también la primera opción de la lista, separada por una línea; uno dado de baja va apagado con su motivo en un tooltip (211); con un
  solo asistente, el campo queda apagado con su motivo. La bandeja, que no se cambia, se lee como texto, sin campo gris. «Un asistente
  de baja» es el equipo Atención general, cuyo asistente quedó de baja: la lista abre con Delta Obras elegido y apagado, con su motivo.
  En el teléfono, la pieza a pantalla completa, y la lista de equipos de atrás, tarjetas con cada dato nombrado (263).
- `WA-Chats-Casos` y `M-WA-Chats-Casos`: el estado nuevo «Tope de ofrecimientos»: Martina pide un tercer service en el día, el pedido
  deriva con el mensaje fijo y «Llegó al tope de ofrecimientos del día» va en la franja y en «Por qué respondió esto» (278). En el
  teléfono, además, «Por qué: el tope de ofrecimientos», con la hoja. «El tope del día» manda también el mensaje fijo al derivar (270:
  un tope que corta contesta o deriva; antes Martina quedaba sin respuesta).
- `WA-Chats-Asistente` y `M-WA-Conversacion-Asistente`: con el tope del mes agotado, el mensaje de Tomás deriva con el mensaje fijo, el
  motivo en la franja y en el porqué, y «Necesita una persona» en la cabecera y en la lista; antes quedaba sin respuesta y con un aviso
  (270). En el teléfono, los estados nuevos «El asistente no está disponible» y «Por qué derivó: el tope del mes».
- `WA-Chats-Audio`: el estado nuevo «Con el tope de ofrecimientos lleno»: con dos formularios ya ofrecidos en el día, un audio se
  transcribe igual y lo contesta su caso, con su porqué (278). «No se pudo pasar a texto» deriva de verdad: el mensaje fijo, atención
  manual y «Necesita una persona» (270 y el punto 13 de la parte pagada de la E23).

Cambia los tableros en su lugar, con un bloque `<style data-t3b="e24-asistentes">` antes de `</helmet>` que lo frena si ya corrió; cada
título suma « · para aprobar». Las medidas van sin escalar: al final corre `traspaso10_piezas_1004.py --tableros` con los nueve, que
pone la escala de la compu. Ninguno muestra el panel «Gestión de formularios». No toca `canvas.json`.

Uso: `python e24_asistentes_1004.py`. Para volver a correrlo, primero se restauran los nueve tableros
(`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`).
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

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-t3b="e24-asistentes"'
SUFIJO = " · para aprobar"
TABLEROS = ["WA-Asistentes", "M-WA-Asistentes", "WA-Equipo-Asistente", "M-WA-Equipo-Asistente", "WA-Chats-Casos",
            "M-WA-Chats-Casos", "WA-Chats-Asistente", "M-WA-Conversacion-Asistente", "WA-Chats-Audio"]
fin_div, sc_ifs, renombrar, sumar_estados = b2.fin_div, e12e.sc_ifs, e12e.renombrar, e12e.sumar_estados


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    t = s.replace("\r\n", "\n")
    assert MARCA not in t, f"{nombre} ya tiene el bloque: restauralo antes de volver a correr"
    return t, nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (viejo[:90], t.count(viejo))
    return t.replace(viejo, nuevo)


def con_css(t, css):
    return una(t, "</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


def para_aprobar(t):
    m = re.search(r"<title>([^<]*)</title>", t)
    assert SUFIJO not in m.group(1)
    return t[:m.end(1)] + SUFIJO + t[m.end(1):]


def svg(t, despues):
    """El primer `<svg>` que sigue a `despues`."""
    i = t.index(despues) + len(despues)
    i = t.index("<svg", i)
    return t[i:t.index("</svg>", i) + 6]


def sc(var, cuerpo, si=False):
    return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{{"si" if si else "no"}}}}}">{cuerpo}</sc-if>'


def guion_simple(t, estados):
    """Cambia el enum del `data-props` y la clase del guion por una con `eN` por estado (como `base2_comun.tablero`)."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    p = json.loads(m.group(1))
    p["estado"]["options"], p["estado"]["default"] = estados, estados[0]
    texto = json.dumps(p, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    vals = ", ".join(f"e{i}: k === {i}" for i in range(len(estados)))
    clase = ("class Component extends DCLogic {\n  renderVals() {\n"
             f"    const k = {json.dumps(estados, ensure_ascii=False)}.indexOf(this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)});\n"
             f"    return {{ si: true, no: false, {vals} }};\n  }}\n}}\n")
    i = t.index("class Component extends DCLogic {")
    j = t.index("</script>", i)
    return t[:i] + clase + t[j:]


def js_lista(t, nombre, cambiar):
    m = re.search(rf"{nombre}: (\[[^\]]*\])\.includes\(e\)", t)
    lista = json.loads(m.group(1))
    cambiar(lista)
    return t[:m.start(1)] + json.dumps(lista, ensure_ascii=False) + t[m.end(1):]


def js_mapa(t, patron, cambios):
    m = re.search(patron, t)
    mapa = json.loads(m.group(1))
    mapa.update(cambios)
    return t[:m.start(1)] + json.dumps(mapa, ensure_ascii=False) + t[m.end(1):]


def entre_ap(t):
    """Lo que va adentro del marco del teléfono, después de la barra de estado: (inicio, fin)."""
    i = t.index('<div class="ap-est">')
    a = fin_div(t, i)
    j = t.index("</x-dc>")
    b = t.rindex("</div>", 0, j)
    return a, b


def tarjeta_sin_enlace(nombre, datos, acciones):
    """Una tarjeta (263) de una fila que no abre nada: el nombre, cada dato con su nombre y el ⋮ (261)."""
    celdas = "".join(f'<span class="c{" todo" if largo else ""}"><span class="k">{k}</span><span class="v">{v}</span></span>'
                     for k, v, largo in ((tuple(d) + (False,))[:3] for d in datos))
    return (f'<div class="b2-tj"><div class="b2-tj-a"><span class="cu"><span class="nm">{nombre}</span><span class="dl">{celdas}</span>'
            f'</span></div><button type="button" class="keb" aria-label="Acciones de {nombre}">{b2.SVG_KEB}</button></div>')


# ---------------------------------------------------------------------------------------------------------------- los textos
PRI_INFO = "Contesta los chats sin equipo y los de un equipo sin asistente. No se da de baja."
NO_PRINCIPAL = "El principal no se da de baja."
NUEVO_INFO = "Arranca con el perfil, los casos y los límites del principal, para cambiarlos."
SIN_ELEGIR = "Contesta el principal"
EQ_INFO = "Sin elegir, contesta el principal. Un equipo tiene como mucho uno."
MOT_BAJA = "Está de baja. Para elegirlo, reactivalo en Asistentes."
MOT_BAJA_ELEGIDO = "Está de baja: mientras tanto contesta el principal. Si lo reactivás en Asistentes, vuelve a contestar en este equipo."
MOT_UNO = "No hay otro asistente para elegir."
DERIVA = "Ya le paso tu consulta a una persona del equipo. Te responde por acá."
TOPE_OFR = "Llegó al tope de ofrecimientos del día"
TOPE_MES = "El asistente no está disponible: se agotó el tope de IA del mes"
NO_SE_MANDO = "No se mandó: llegó al tope de ofrecimientos del día."
PQ_TOPE = [("Caso", "Formularios · Pedido de service"), ("Usó", "El mensaje al derivar, del perfil"),
           ("Por qué", "Cuenta que se rompió otra heladera: tocaba ofrecer Pedido de service.")]
PQ_MES = [("Por qué", TOPE_MES + ".")]
PQ_AUDIO = [("Caso", "Cualquier otra cosa"), ("Usó", "Horario de atención"), ("Por qué", "Pregunta si el depósito abre el sábado: está cargado.")]

# ---------------------------------------------------------------------------------------------------------------- estilos
CSS_COMPU_LISTA = e14l.CSS_LISTADO + """
/* J2 · Los asistentes: «Principal» en su columna (206), entre «Asistente» y «Equipos». */
.w-th.as24.t3b5, .w-tr.as24.t3b5 { grid-template-columns: minmax(220px, 1.2fr) 120px minmax(200px, 1fr) 130px 48px; }
.w-caja.o-fb { overflow: visible; position: relative; z-index: 5; }
.o-fb .f-env { position: relative; display: inline-flex; }
.w-dlg .dc .f-i { margin-left: 6px; vertical-align: -2px; }
"""
CSS_COMPU_EQUIPO = b2.css() + """
/* J2 · «Editar equipo»: lo que se elige, en la pieza (262); su lista y el motivo de lo apagado salen del diálogo. */
.w-dlg:has(.b2-pkl), .w-dlg:has(.acc-tip) { overflow: visible; }
.w-dlg .w-cmp .b2-env { width: 100%; }
.w-dlg .w-cmp .b2-pkl { z-index: 60; }
/* Lo que no se cambia se lee como texto, sin campo gris. */
.t3b-ro { display: flex; align-items: center; height: 36px; color: var(--t1); }
"""
CSS_TEL = b2.acc.CSS_TEL + e12l.CSS_TEL + """
/* J2 · El ⋮ de una tarjeta abre su hoja; lo apagado dice por qué en un tooltip sobre la opción (211). */
.ap-acciones2 .t3b-off { position: relative; color: var(--t3); cursor: default; }
.ap-acciones2 .acc-tip { left: 4px; padding: 7px 10px; border-top: 0; font-size: 14px; }
/* La pieza en una hoja (262), con el radio de sus campos; lo que no se cambia, como texto. */
.ap .b2-pkc { border-radius: 12px; }
.ap-cmp .b2-env { width: 100%; }
.ap-cmp .rt .b2-i { margin-left: 6px; }
.t3b-ro { display: flex; align-items: center; min-height: 48px; font-size: 16px; color: var(--t1); }
.ap-cuerpo .b2-tj { flex-shrink: 0; }
"""
CSS_CHAT_COMPU = """
/* J2 · El porqué de un mensaje que va último abre hacia arriba, para que no lo tape el borde del chat. */
.t3b-arriba .as-pop { top: auto; bottom: calc(100% + 6px); }
.as-pop .t4a-mot { display: block; margin-top: 6px; }
/* La tarjeta de un formulario ya ofrecido, sin lo prellenado. */
.as-card.t3b-corta { align-items: center; }
"""
CSS_CHAT_TEL = """
/* J2 · El motivo de una derivación en la hoja del porqué, en una línea. */
.t-pq .t4a-mot { margin: 0; font-size: 15px; line-height: 1.4; }
"""


# ---------------------------------------------------------------------------------------------------------------- Asistentes
AS_COLS = ["Asistente", "Principal", "Equipos", "Estado"]
# (principal, equipos, activo). Delta Obras, de baja, conserva su equipo: «Se reactiva, y sus asignaciones se conservan» (spec E24).
AS_DATOS = {"Delta": (True, None, True), "Delta Soporte": (False, "Soporte", True), "Delta Ventas": (False, "Ventas", True),
            "Delta Obras": (False, "Atención general", False)}
TRES = ["Delta", "Delta Soporte", "Delta Ventas"]
CUATRO = ["Delta", "Delta Obras", "Delta Soporte", "Delta Ventas"]  # sin orden: el principal y después por nombre (264, K1)
POR_ESTADO = ["Delta", "Delta Soporte", "Delta Ventas", "Delta Obras"]  # Estado por el circuito; empates, el orden de siempre
ORDEN_ESTADO = "Ordenar por: Estado, activos primero"
AS_ESTADOS = ["Varios", "Filtro de estado abierto", "Ordenado por Estado", "Ordenar por abierto", "Menú de un asistente",
              "Menú del principal", "Nuevo asistente", "Falta el nombre", "Creando", "Dar de baja", "Un asistente de baja",
              "Un solo asistente", "Sin equipos", "Cargando", "Error"]


def wa_asistentes():
    t, nl = leer("WA-Asistentes")
    ic = {
        "robot": svg(t, '<span class="ic">'), "mas": svg(t, '<button type="button" class="cb cb-pri">'),
        "keb": svg(t, 'aria-label="Acciones de Delta">'), "i": svg(t, '<span class="f-i" tabindex="0"'),
        "lapiz": svg(t, '<a class="f-mi" role="menuitem" href="WA-Asistente.dc.html">'),
        "baja": svg(t, '<span class="f-mi pel" role="menuitem">'),
        "react": svg(t, '<span class="f-sep" role="separator"></span><span class="f-mi" role="menuitem">'),
    }

    # Los diálogos de siempre (nuevo, falta el nombre, creando y dar de baja), con la frase de «Nuevo asistente» en la (i) del título.
    viejos = {}
    for k, nombre in ((3, "Nuevo asistente"), (4, "Falta el nombre"), (5, "Creando"), (6, "Dar de baja")):
        bloques = sc_ifs(t, f"s{k}")
        assert len(bloques) == 3, (k, len(bloques))
        a, b = bloques[2]
        cuerpo = t[a:b]
        cuerpo = cuerpo[cuerpo.index(">") + 1:-len("</sc-if>")]
        if k != 6:
            cuerpo = una(cuerpo, '<p class="d-tx">Arranca con el perfil y los casos del principal, para cambiarlos.</p>', "")
            info = (f'<span class="f-i" tabindex="0" role="img" aria-label="{NUEVO_INFO}" title="{NUEVO_INFO}">{ic["i"]}</span>')
            cuerpo = una(cuerpo, '<div class="dc"><span>Nuevo asistente</span>', f'<div class="dc"><span>Nuevo asistente{info}</span>')
        viejos[nombre] = cuerpo

    def encabezado(por=None):
        celdas = [f'<span aria-sort="ascending">{c}<span class="b2-fl" aria-hidden="true">↑</span></span>' if c == por else f"<span>{c}</span>"
                  for c in AS_COLS]
        return f'<div class="w-th as24 t3b5">{"".join(celdas)}<span class="sr">Acciones</span></div>'

    def menu(nombre, tipo):
        editar = (f'<a class="f-mi" role="menuitem" href="WA-Asistente.dc.html">{ic["lapiz"]} Editar</a>'
                  '<span class="f-sep" role="separator"></span>')
        if tipo == "baja":
            ultima = f'<span class="f-mi pel" role="menuitem">{ic["baja"]} Dar de baja</span>'
        elif tipo == "principal":
            ultima = (f'<span class="e-tipw"><span class="f-mi pel" role="menuitem" aria-disabled="true">{ic["baja"]} Dar de baja</span>'
                      f'<span class="e-tip" role="tooltip">{NO_PRINCIPAL}</span></span>')
        else:
            ultima = f'<span class="f-mi" role="menuitem">{ic["react"]} Reactivar</span>'
        return f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}">{editar}{ultima}</div>'

    def fila(nombre, abierto=None, sin_equipos=False):
        pri, equipos, activo = AS_DATOS[nombre]
        info = f'<span class="f-i" tabindex="0" role="img" aria-label="{PRI_INFO}" title="{PRI_INFO}">{ic["i"]}</span>'
        celdas = [f'<span><span class="nm"><a href="WA-Asistente.dc.html">{nombre}</a></span></span>',
                  f'<span><span class="nm">Sí{info}</span></span>' if pri else '<span><span class="gris">—</span></span>',
                  f"<span>{equipos}</span>" if equipos and not sin_equipos else '<span><span class="gris">—</span></span>',
                  '<span><span class="w-est">Activo</span></span>' if activo else '<span><span class="w-est off">De baja</span></span>',
                  f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {nombre}" '
                  f'aria-haspopup="menu" aria-expanded="{"true" if abierto else "false"}">{ic["keb"]}</button></span>']
        return f'<div class="w-tr as24 t3b5">{"".join(celdas)}{menu(nombre, abierto) if abierto else ""}</div>'

    def tabla(orden, por=None, menus=None, sin_equipos=False):
        menus = menus or {}
        n = len(orden)
        return (f'<div class="w-caja as24c">{encabezado(por)}' + "".join(fila(x, menus.get(x), sin_equipos) for x in orden)
                + f'<div class="w-pie"><span>1–{n} de {n}</span><span>10 por página · Página 1 de 1</span></div></div>')

    pop = ('<div class="b2-pop" role="dialog" aria-label="Ordenar por"><div class="b2-pop-c"><span class="et">Columna</span>'
           + b2.campo("Estado", abierto=True, aria="Columna",
                      extra=b2.lista([b2.op("Asistente"), b2.op("Principal"), b2.op("Estado", elegida=True, activa=True)]))
           + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo("Activos primero", aria="Orden") + "</div></div>")

    def barra(filtro=False, orden="Ordenar por", abierto=False):
        lista = (b2.lista([b2.op("Todos los estados", elegida=True, activa=True), b2.op("Activos", sep=True), b2.op("De baja")], barra=True)
                 if filtro else "")
        return ('<div class="w-caja o-fb">'
                f'<span class="w-bus">{b2.SVG_LUPA} Buscar por nombre</span>'
                f'<span class="f-env"><button type="button" class="w-pil" aria-haspopup="listbox" aria-expanded="{"true" if filtro else "false"}">'
                f'Estado {b2.SVG_FLECHA}</button>{lista}</span>'
                '<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar">'
                f'<button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="{"true" if abierto else "false"}">{orden} {b2.SVG_FLECHA}</button>'
                f'{pop if abierto else ""}</span></div>')

    def banda(res):
        return (f'<div class="w-bnd"><div class="iz"><span class="ic">{ic["robot"]}</span><div><h1>Asistentes</h1><p class="res">{res}</p></div></div>'
                f'<div class="ac"><button type="button" class="cb cb-pri">{ic["mas"]} Nuevo asistente</button></div></div>')

    carga = (f'<div class="w-caja">{encabezado()}<div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span>'
             '<span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></div>')
    error = ('<div class="w-caja"><div class="pl-vacio2"><b>No pudimos cargar los asistentes.</b>'
             '<button type="button" class="cb cb-sec">Reintentar</button></div></div>')
    TRES_RES, CUATRO_RES = "3 asistentes", "4 asistentes · 1 de baja"
    # estado → (resumen, barra, cuerpo, diálogo)
    plan = {
        "Varios": (TRES_RES, barra(), tabla(TRES), ""),
        "Filtro de estado abierto": (TRES_RES, barra(filtro=True), tabla(TRES), ""),
        "Ordenado por Estado": (CUATRO_RES, barra(orden=ORDEN_ESTADO), tabla(POR_ESTADO, por="Estado"), ""),
        "Ordenar por abierto": (CUATRO_RES, barra(orden=ORDEN_ESTADO, abierto=True), tabla(POR_ESTADO, por="Estado"), ""),
        "Menú de un asistente": (TRES_RES, barra(), tabla(TRES, menus={"Delta Soporte": "baja"}), ""),
        "Menú del principal": (TRES_RES, barra(), tabla(TRES, menus={"Delta": "principal"}), ""),
        "Nuevo asistente": (TRES_RES, barra(), tabla(TRES), viejos["Nuevo asistente"]),
        "Falta el nombre": (TRES_RES, barra(), tabla(TRES), viejos["Falta el nombre"]),
        "Creando": (TRES_RES, barra(), tabla(TRES), viejos["Creando"]),
        "Dar de baja": (TRES_RES, barra(), tabla(TRES), viejos["Dar de baja"]),
        "Un asistente de baja": (CUATRO_RES, barra(), tabla(CUATRO, menus={"Delta Obras": "reactivar"}), ""),
        "Un solo asistente": ("1 asistente", barra(), tabla(["Delta"]), ""),
        "Sin equipos": (TRES_RES, barra(), tabla(TRES, sin_equipos=True), ""),
        "Cargando": ("", barra(), carga, ""),
        "Error": ("", barra(), error, ""),
    }
    assert list(plan) == AS_ESTADOS
    partes = []
    for k, e in enumerate(AS_ESTADOS):
        res, bar, cuerpo, dlg = plan[e]
        partes.append(sc(f"e{k}", banda(res) + f'<div class="w-body">{bar}{cuerpo}</div>' + dlg, si=k == 0))

    # Lo de después de la cabecera hasta el último `sc-if` se reemplaza entero.
    a = t.index("<sc-if", t.index("</header>"))
    b = t.rindex("</sc-if>", 0, t.index("</x-dc>")) + len("</sc-if>")
    t = t[:a] + "".join(partes) + t[b:]
    t = guion_simple(t, AS_ESTADOS)
    t = para_aprobar(con_css(t, CSS_COMPU_LISTA))
    assert "ab-chip" not in t[t.index("</helmet>"):] and not re.search(r"\{\{s\d", t)
    escribir("WA-Asistentes", t, nl)


M_AS_ESTADOS = ["Varios", "Acciones de un asistente", "Acciones del principal", "Un asistente de baja", "Filtros", "Ordenar por"]
TEL_BUSCAR = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>')
TEL_FILTROS = ('<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>')


def m_wa_asistentes():
    t, nl = leer("M-WA-Asistentes")
    react = svg(leer_crudo("WA-Asistentes"), '<span class="f-sep" role="separator"></span><span class="f-mi" role="menuitem">')
    ic = {"volver": svg(t, '<a class="ap-ib" aria-label="Volver" href="M-WA-Menu.dc.html">'),
          "fab": svg(t, '<a class="ap-fab" aria-label="Nuevo asistente" href="#">'),
          "x": svg(t, '<button type="button" class="ap-ib" aria-label="Cerrar">'),
          "lapiz": svg(t, '<div class="ap-acciones2"><span role="menuitem">'),
          "baja": svg(t, '<span role="menuitem" class="pel">'), "react": react}

    def tarjeta(nombre):
        pri, equipos, activo = AS_DATOS[nombre]
        datos = [("Principal", "Sí" + b2.info(PRI_INFO) if pri else b2.NADA_T),
                 ("Equipos", equipos or b2.NADA_T),
                 ("Estado", b2.est("ok", "Activo") if activo else b2.est("", "De baja"))]
        return b2.tarjeta(nombre, datos, acciones=nombre, href="M-WA-Asistente.dc.html")

    def lista(orden, res):
        return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-WA-Menu.dc.html">{ic["volver"]}</a>'
                f'<div class="tit"><h1>Asistentes</h1><span class="sub">{res}</span></div>'
                f'<button type="button" class="ap-ib" aria-label="Buscar">{TEL_BUSCAR}</button>'
                f'<button type="button" class="ap-ib" aria-label="Filtros">{TEL_FILTROS}</button></div>'
                f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">Ordenar por {b2.SVG_FLECHA}</button></div>'
                f'<div class="ap-cuerpo">{"".join(tarjeta(n) for n in orden)}</div>'
                f'<a class="ap-fab" aria-label="Nuevo asistente" href="#">{ic["fab"]}</a>')

    def hoja(nombre, items):
        return (f'<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="{nombre}"><span class="asa"></span>'
                f'<div class="hc"><div><h2>{nombre}</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{ic["x"]}</button></div>'
                f'<div class="hb"><div class="ap-acciones2">{items}</div></div><div class="hp"></div></div>')

    editar = f'<span role="menuitem">{ic["lapiz"]} Editar</span>'
    baja = f'<span role="menuitem" class="pel">{ic["baja"]} Dar de baja</span>'
    baja_apag = (f'<span role="menuitem" class="t3b-off" aria-disabled="true">{ic["baja"]} Dar de baja'
                 f'<span class="acc-tip" role="tooltip">{NO_PRINCIPAL}</span></span>')
    reactivar = f'<span role="menuitem">{ic["react"]} Reactivar</span>'
    filtros = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-WA-Asistentes.dc.html">{ic["volver"]}</a>'
               '<div class="tit"><h1>Filtros</h1><span class="sub">Asistentes</span></div></div><div class="ap-cuerpo"><div class="t10-fl">'
               + e12l.campo_tel("Estado", "Todos los estados") + '</div></div><div class="t10-pie"><button type="button" class="cb cb-sec">'
               'Limpiar todo</button><button type="button" class="cb cb-pri">Listo</button></div>')
    pantallas = [lista(TRES, "3 asistentes"), lista(TRES, "3 asistentes"), lista(TRES, "3 asistentes"),
                 lista(CUATRO, "4 asistentes · 1 de baja"), filtros,
                 e14l.pantalla_ordenar(ic["volver"], "M-WA-Asistentes", "Estado", "Activos primero")]
    hojas = {1: hoja("Delta Soporte", editar + baja), 2: hoja("Delta", editar + baja_apag), 3: hoja("Delta Obras", editar + reactivar)}
    cuerpo = ("".join(sc(f"e{k}", p, si=k == 0) for k, p in enumerate(pantallas)) + '<span class="ap-raya"></span>'
              + "".join(sc(f"e{k}", h) for k, h in hojas.items()))
    a, b = entre_ap(t)
    t = t[:a] + cuerpo + t[b:]
    t = guion_simple(t, M_AS_ESTADOS)
    t = para_aprobar(con_css(t, CSS_TEL))
    assert " · principal" not in t and not re.search(r"\{\{s\d", t)
    escribir("M-WA-Asistentes", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el equipo
def opciones_asistente(elegido, tip_baja):
    """La lista de «Asistente de este equipo»: «Contesta el principal» primero y separada (262), los activos y el de baja, apagado
    con su motivo (211)."""
    return [b2.op(SIN_ELEGIR, "Delta", elegida=elegido is None, activa=elegido is None),
            b2.op("Delta Soporte", "Contesta en Soporte", sep=True),
            b2.op("Delta Ventas", "Contesta en Ventas", elegida=elegido == "Delta Ventas", activa=elegido == "Delta Ventas"),
            b2.op("Delta Obras", elegida=elegido == "Delta Obras", apagada=tip_baja, tip_abierto=True)]


# Los equipos de cada estado: (nombre, personas, aviso).
VENTAS = ("Ventas", "Lucía Fernández, Carolina Vega", "A los 10 minutos")
GENERAL = ("Atención general", "Lucía Fernández, Tomás Acosta, Martín Paz", "A los 10 minutos")


def wa_equipo_asistente():
    t, nl = leer("WA-Equipo-Asistente")
    x = svg(t, '<div class="dc"><span>Editar equipo</span><button type="button" class="ib" aria-label="Cerrar">')
    i_svg = svg(t, f'aria-label="{EQ_INFO}" title="{EQ_INFO}">')
    info = f'<span class="f-i" tabindex="0" role="img" aria-label="{EQ_INFO}" title="{EQ_INFO}">{i_svg}</span>'

    def dialogo(equipo, asistente):
        nombre, personas, aviso = equipo
        req = ' <span style="color: var(--peligro);">*</span>'
        return ('<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Editar equipo"><div class="dc"><span>Editar equipo</span>'
                f'<button type="button" class="ib" aria-label="Cerrar">{x}</button></div><div class="db">'
                f'<div class="w-cmp"><span class="rt">Nombre{req}</span><div class="ct">{nombre}</div></div>'
                '<div class="w-cmp"><span class="rt">Bandeja</span><div class="t3b-ro">Clientes</div></div>'
                f'<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Personas{req}</span>{b2.campo(personas, aria="Personas")}</div>'
                f'<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Asistente de este equipo{info}</span>{asistente}</div>'
                '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Aviso por correo si nadie lo toma</span>'
                f'{b2.campo(aviso, aria="Aviso por correo si nadie lo toma")}</div></div>'
                '<div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button></div>'
                "</div></div>")

    aria = "Asistente de este equipo"
    dialogos = [
        dialogo(VENTAS, b2.campo("Delta Ventas", aria=aria)),
        dialogo(VENTAS, b2.campo("Delta Ventas", abierto=True, aria=aria, extra=b2.lista(opciones_asistente("Delta Ventas", MOT_BAJA)))),
        dialogo(VENTAS, b2.campo(SIN_ELEGIR, vacio=True, aria=aria)),
        dialogo(GENERAL, b2.campo("Delta Obras", abierto=True, aria=aria,
                                  extra=b2.lista(opciones_asistente("Delta Obras", MOT_BAJA_ELEGIDO)))),
        dialogo(VENTAS, b2.campo(SIN_ELEGIR, vacio=True, aria=aria, apagado=MOT_UNO, tip_abierto=True)),
    ]
    a = t.index('<sc-if value="{{q0}}"')
    b = e12e.cierre(t, t.index('<sc-if value="{{q4}}"'), "sc-if")
    t = t[:a] + "".join(sc(f"q{k}", d, si=k == 0) for k, d in enumerate(dialogos)) + t[b:]
    t = para_aprobar(con_css(t, CSS_COMPU_EQUIPO))
    assert "eq-mn" not in t[t.index("</helmet>"):] and "ab-chip" not in t[t.index("</helmet>"):]
    escribir("WA-Equipo-Asistente", t, nl)


M_EQ_ESTADOS = ["Con su asistente", "Elegir el asistente", "Sin elegir: contesta el principal", "Un asistente de baja", "Un solo asistente"]
# La lista de equipos de atrás, como tarjetas (263): (nombre, bandeja, aviso, personas).
EQUIPOS_TEL = [("Ventas", "Clientes", "A los 10 minutos", "Lucía Fernández, Carolina Vega"),
               ("Soporte", "Clientes", "A los 15 minutos", "Tomás Acosta, Paula Méndez"),
               ("Atención general", "Clientes", "A los 10 minutos", "Lucía Fernández, Tomás Acosta, Martín Paz"),
               ("Carga de pedidos", "Internos", "A los 30 minutos", "Martín Paz")]


def m_wa_equipo_asistente():
    t, nl = leer("M-WA-Equipo-Asistente")
    volver = svg(t, '<a class="ap-ib" aria-label="Volver" href="M-WA-Menu.dc.html">')
    x = svg(t, '<button type="button" class="ap-ib" aria-label="Cerrar">')
    fondo = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-WA-Menu.dc.html">{volver}</a>'
             '<div class="tit"><h1>Equipos</h1><span class="sub">Administración · WhatsApp</span></div></div><div class="ap-cuerpo">'
             + "".join(tarjeta_sin_enlace(n, [("Bandeja", bandeja), ("Aviso por correo", aviso), ("Personas", personas, True)], n)
                       for n, bandeja, aviso, personas in EQUIPOS_TEL) + "</div>")

    def hoja(equipo, asistente):
        nombre, personas, aviso = equipo
        rq = ' <span class="rq">*</span>'
        return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Editar equipo"><span class="asa"></span>'
                f'<div class="hc"><div><h2>Editar equipo</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{x}</button></div><div class="hb">'
                f'<div class="ap-cmp"><span class="rt"><span>Nombre{rq}</span></span><div class="ct">{nombre}</div></div>'
                '<div class="ap-cmp"><span class="rt"><span>Bandeja</span></span><span class="t3b-ro">Clientes</span></div>'
                f'<div class="ap-cmp"><span class="rt"><span>Personas{rq}</span></span>{b2.campo(personas, aria="Personas")}</div>'
                f'<div class="ap-cmp"><span class="rt"><span>Asistente de este equipo{b2.info(EQ_INFO)}</span></span>{asistente}</div>'
                '<div class="ap-cmp"><span class="rt"><span>Aviso por correo si nadie lo toma</span></span>'
                f'{b2.campo(aviso, aria="Aviso por correo si nadie lo toma")}</div></div>'
                '<div class="hp"><button type="button" class="cb cb-pri lleno">Guardar cambios</button><button type="button" class="cb cb-sec">Cancelar</button></div></div>')

    def elegir(elegido, motivo):
        return b2.pk_tel("Asistente de este equipo",
                         [(SIN_ELEGIR, "Delta", elegido is None, None), ("Delta Soporte", "Contesta en Soporte", False, None, True),
                          ("Delta Ventas", "Contesta en Ventas", elegido == "Delta Ventas", None),
                          ("Delta Obras", None, elegido == "Delta Obras", motivo)], tip_en="Delta Obras")

    aria = "Asistente de este equipo"
    capas = [hoja(VENTAS, b2.campo("Delta Ventas", aria=aria)),
             elegir("Delta Ventas", MOT_BAJA),
             hoja(VENTAS, b2.campo(SIN_ELEGIR, vacio=True, aria=aria)),
             elegir("Delta Obras", MOT_BAJA_ELEGIDO),
             hoja(VENTAS, b2.campo(SIN_ELEGIR, vacio=True, aria=aria, apagado=MOT_UNO, tip_abierto=True))]
    cuerpo = fondo + '<span class="ap-raya"></span>' + "".join(sc(f"e{k}", c, si=k == 0) for k, c in enumerate(capas))
    a, b = entre_ap(t)
    t = t[:a] + cuerpo + t[b:]
    t = guion_simple(t, M_EQ_ESTADOS)
    t = para_aprobar(con_css(t, CSS_TEL))
    assert " · de baja" not in t and not re.search(r"\{\{s\d", t) and "Delta · principal" not in t
    escribir("M-WA-Equipo-Asistente", t, nl)


# ---------------------------------------------------------------------------------------------------------------- los chats
def pq_abierto(pq_svg, filas, motivo=None, tel=False):
    """«Por qué respondió esto» abierto: el globo de la compu, con los datos y el motivo de lo que no se mandó."""
    g = "".join(f'<span class="k">{k}</span><span>{v}</span>' for k, v in filas)
    mot = f'<span class="t4a-mot">{motivo}</span>' if motivo else ""
    return ('<span class="as-pqw"><button type="button" class="as-pq" aria-expanded="true">Por qué respondió esto</button>'
            f'<span class="as-pop" role="dialog" aria-label="Por qué respondió esto"><b>{pq_svg} Por qué respondió esto</b>'
            f'<span class="g">{g}</span>{mot}</span></span>')


PQ_CERRADO = '<span class="as-pqw"><button type="button" class="as-pq" aria-expanded="false">Por qué respondió esto</button></span>'


def hoja_pq(x, filas, motivo=None):
    """«Por qué respondió esto» en el teléfono: la hoja de siempre (`t-pq`)."""
    f = "".join(f'<div class="f"><span class="k">{k}</span><span>{v}</span></div>' for k, v in filas)
    mot = f'<p class="t4a-mot">{motivo}</p>' if motivo else ""
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Por qué respondió esto"><span class="asa"></span>'
            f'<div class="hc"><div><h2>Por qué respondió esto</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{x}</button></div>'
            f'<div class="hb"><div class="t-pq">{f}{mot}</div></div><div class="hp"></div></div>')


def burbujas(clase, bot, form_svg):
    """Las piezas del chat de un tablero: `clase` es `w-m` en la compu y `ap-m` en el teléfono."""
    def ent(texto, hora):
        return f'<div class="{clase} ent"><span class="gl">{texto}</span><span class="pie">{hora}</span></div>'

    def asis(texto, hora, extra="", pq=PQ_CERRADO, arriba=False):
        return (f'<div class="{clase} sal asis{" t3b-arriba" if arriba else ""}"><span class="gl"><span class="aut">{bot} Asistente</span>'
                f'<span>{texto}</span>{extra}</span><span class="pie">Asistente · {hora} · Leído · {pq}</span></div>')

    def tarjeta(nombre, version, prellenado=None):
        pre = ""
        if prellenado:
            pre = ('<span class="as-pre"><span class="t">Prellenado con</span><span class="g">'
                   + "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in prellenado) + "</span></span>")
        return (f'<span class="as-card{"" if prellenado else " t3b-corta"}"><span>{form_svg}</span><span class="t"><b>{nombre}</b>'
                f'<small>Formulario · versión {version} · botón «Abrir formulario»</small>{pre}</span></span>')

    return ent, asis, tarjeta


def oferta(nombre):
    return f"Te preparé el formulario «{nombre}» para que lo completes."


def wa_chats_casos():
    t, nl = leer("WA-Chats-Casos")
    bot = svg(t, '<span class="aut">')
    form_svg = svg(t, '<span class="as-card"><span>')
    pq_svg = svg(t, '<span class="as-pop" role="dialog" aria-label="Por qué respondió esto"><b>')
    ent, asis, tarjeta = burbujas("w-m", bot, form_svg)
    nuevo = "Tope de ofrecimientos"
    t, sv = sumar_estados(t, [("El tope del día", [nuevo])], [nuevo])
    s = sv[nuevo]

    # El hilo: dos services ofrecidos en el día; el tercero deriva con el mensaje fijo y el motivo, en la franja y en el porqué (278).
    hilo = (ent("Se rompió la heladera en la sucursal Centro", "10:32")
            + asis(oferta("Pedido de service"), "10:32", tarjeta("Pedido de service", 2, [("Sucursal", "Centro")]))
            + ent("La de la sucursal Norte tampoco enfría", "10:40")
            + asis(oferta("Pedido de service"), "10:40", tarjeta("Pedido de service", 2, [("Sucursal", "Norte")]))
            + ent("Y la de la sucursal Sur hace un ruido raro", "10:51")
            + asis(DERIVA, "10:51", pq=pq_abierto(pq_svg, PQ_TOPE, NO_SE_MANDO), arriba=True)
            + f'<span class="o-sis">{TOPE_OFR} · Necesita una persona</span>')
    (h8, e8) = sc_ifs(t, "s8")  # «El tope del día»: el hilo y el escritorio
    t = t[:h8[1]] + sc(s, hilo) + t[h8[1]:]
    (h2, e2), (h8, e8) = sc_ifs(t, "s2"), sc_ifs(t, "s8")
    t = t[:e8[1]] + renombrar(t[e2[0]:e2[1]], "s2", s) + t[e8[1]:]

    # «El tope del día» deriva con el mensaje fijo (270): Martina no queda sin respuesta.
    t = una(t, '<div class="w-m ent"><span class="gl">¿Y los domingos?</span><span class="pie">10:39</span></div>'
               '<span class="o-sis">Llegó al tope de 20 respuestas de hoy · Necesita una persona</span>',
            '<div class="w-m ent"><span class="gl">¿Y los domingos?</span><span class="pie">10:39</span></div>'
            + asis(DERIVA, "10:39") + '<span class="o-sis">Llegó al tope de 20 respuestas de hoy · Necesita una persona</span>')

    # Los valores del estado nuevo.
    for nombre in ("modoMan", "necesita", "todos"):
        t = js_lista(t, nombre, lambda lista: lista.append(nuevo))
    t = js_mapa(t, r"vistaPrevia: (\{[^}]*\})\[e\]", {"El tope del día": f"Asistente: {DERIVA}", nuevo: f"Asistente: {DERIVA}"})
    t = js_mapa(t, r"hora: '27/09/2026, ' \+ \((\{[^}]*\})\[e\]", {nuevo: "10:51"})
    t = js_mapa(t, r"atiende: (\{[^}]*\})\[e\]", {nuevo: "Sin tomar"})
    t = para_aprobar(con_css(t, CSS_CHAT_COMPU))
    escribir("WA-Chats-Casos", t, nl)


def m_wa_chats_casos():
    t, nl = leer("M-WA-Chats-Casos")
    bot = svg(t, '<span class="aut">')
    form_svg = svg(t, '<span class="as-card"><span>')
    x = svg(t, '<div class="hc"><div><h2>Por qué respondió esto</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">')
    ent, asis, tarjeta = burbujas("ap-m", bot, form_svg)
    nuevos = ["Tope de ofrecimientos", "Por qué: el tope de ofrecimientos"]
    t, sv = sumar_estados(t, [("No pudo responder", nuevos)], nuevos)
    hilo = (ent("Se rompió la heladera en la sucursal Centro", "10:32")
            + asis(oferta("Pedido de service"), "10:32", tarjeta("Pedido de service", 2, [("Sucursal", "Centro")]))
            + ent("La de la sucursal Norte tampoco enfría", "10:40")
            + asis(oferta("Pedido de service"), "10:40", tarjeta("Pedido de service", 2, [("Sucursal", "Norte")]))
            + ent("Y la de la sucursal Sur hace un ruido raro", "10:51")
            + asis(DERIVA, "10:51")
            + f'<span class="ap-sis">{TOPE_OFR} · Necesita una persona</span>')
    # Los hilos van después del último hilo de siempre; los escritorios, después del último escritorio.
    (h5, e5) = sc_ifs(t, "s5")
    (h2, e2) = sc_ifs(t, "s2")
    escritorio = t[e2[0]:e2[1]]
    t = t[:h5[1]] + "".join(sc(sv[n], hilo) for n in nuevos) + t[h5[1]:]
    (h5, e5) = sc_ifs(t, "s5")
    t = t[:e5[1]] + "".join(renombrar(escritorio, "s2", sv[n]) for n in nuevos) + t[e5[1]:]
    t = una(t, '<span class="ap-raya"></span>', sc(sv[nuevos[1]], hoja_pq(x, PQ_TOPE, NO_SE_MANDO)) + '<span class="ap-raya"></span>')
    t = una(t, "'Por qué derivó'].includes(e)", "'Por qué derivó', '" + "', '".join(nuevos) + "'].includes(e)")
    t = para_aprobar(con_css(t, CSS_CHAT_TEL))
    escribir("M-WA-Chats-Casos", t, nl)


def con_necesita(t, l3_viejo):
    """«Necesita una persona» en la cabecera y en la fila de la lista de chats, como en `WA-Chats-Casos` (E23, F3)."""
    t = una(t, '<a class="cb cb-sec ch" href="WA-Chats-Pasar.dc.html">Pasar</a>',
            sc("necesita", '<span class="as-np">Necesita una persona</span>') + '<a class="cb cb-sec ch" href="WA-Chats-Pasar.dc.html">Pasar</a>')
    i = t.index(l3_viejo)  # la fila de Tomás, la primera de la lista
    return t[:i] + ('<span class="l3">Carga de pedidos · {{atiende}}' + sc("necesita", '<span class="as-np">Necesita una persona</span>')
                    + "</span>") + t[i + len(l3_viejo):]


def wa_chats_asistente():
    t, nl = leer("WA-Chats-Asistente")
    bot = svg(t, '<span class="aut">')
    form_svg = svg(t, '<span class="as-card"><span>')
    pq_svg = svg(t, '<span class="as-pop" role="dialog" aria-label="Por qué respondió esto"><b>')
    ent, asis, _ = burbujas("w-m", bot, form_svg)

    # Con el tope del mes agotado, el mensaje deriva con el mensaje fijo y su motivo (270); se va el aviso que lo dejaba sin respuesta.
    (h5, e5) = sc_ifs(t, "s5")
    viejo = t[h5[0]:h5[1]]
    assert "as-aviso amb" in viejo
    hilo = ('<span class="o-sis">Lucía Fernández pasó la conversación al asistente</span>'
            + ent("Recién salgo de Ferretería Rosales, cerramos la venta. Son unos 125.500.", "10:33")
            + asis(DERIVA, "10:33", pq=pq_abierto(pq_svg, PQ_MES), arriba=True)
            + f'<span class="o-sis">{TOPE_MES} · Necesita una persona</span>')
    t = t[:h5[0]] + sc("s5", hilo) + t[h5[1]:]
    t = con_necesita(t, '<span class="l3">Carga de pedidos · Lucía Fernández</span>')
    t = una(t, "      s0: k === 0,\n",
            "      necesita: e === 'El asistente no está disponible', atiende: e === 'El asistente no está disponible' ? 'Sin tomar' : 'Lucía Fernández',\n"
            "      s0: k === 0,\n")
    t = js_mapa(t, r"vistaPrevia: (\{[^}]*\})\[e\]", {"El asistente no está disponible": f"Asistente: {DERIVA}"})
    t = para_aprobar(con_css(t, CSS_CHAT_COMPU))
    escribir("WA-Chats-Asistente", t, nl)


def m_wa_conversacion_asistente():
    t, nl = leer("M-WA-Conversacion-Asistente")
    bot = svg(t, '<span class="aut">')
    form_svg = svg(t, '<span class="as-card"><span>')
    x = svg(t, '<button type="button" class="ap-ib" aria-label="Cerrar">')
    ent, asis, _ = burbujas("ap-m", bot, form_svg)
    nuevos = ["El asistente no está disponible", "Por qué derivó: el tope del mes"]
    t, sv = sumar_estados(t, [("Audio transcripto", nuevos)], nuevos)
    hilo = ('<span class="ap-sis">Lucía Fernández pasó la conversación al asistente</span>'
            + ent("Recién salgo de Ferretería Rosales, cerramos la venta. Son unos 125.500.", "10:33")
            + asis(DERIVA, "10:33") + f'<span class="ap-sis">{TOPE_MES} · Necesita una persona</span>')
    (h4, e4) = sc_ifs(t, "s4")
    (h1, e1) = sc_ifs(t, "s1")[:2]
    escritorio = t[e1[0]:e1[1]]
    assert 'class="ap-escr"' in escritorio
    t = t[:h4[1]] + "".join(sc(sv[n], hilo) for n in nuevos) + t[h4[1]:]
    (h4, e4) = sc_ifs(t, "s4")
    t = t[:e4[1]] + "".join(renombrar(escritorio, "s1", sv[n]) for n in nuevos) + t[e4[1]:]
    t = una(t, '<span class="ap-raya"></span>', sc(sv[nuevos[1]], hoja_pq(x, PQ_MES)) + '<span class="ap-raya"></span>')
    t = una(t, '<span>Empleado · Delta S.A.</span>',
            '<span>Empleado · Delta S.A.' + sc("necesita", '<span class="as-np">Necesita una persona</span>') + "</span>")
    t = una(t, "      s0: k === 0,\n", f"      necesita: {json.dumps(nuevos, ensure_ascii=False)}.includes(e),\n      s0: k === 0,\n")
    t = para_aprobar(con_css(t, CSS_CHAT_TEL))
    escribir("M-WA-Conversacion-Asistente", t, nl)


def wa_chats_audio():
    t, nl = leer("WA-Chats-Audio")
    bot = svg(t, '<span class="aut">')
    form_svg = svg(t, '<span class="as-card"><span>')
    pq_svg = svg(leer_crudo("WA-Chats-Asistente"), '<span class="as-pop" role="dialog" aria-label="Por qué respondió esto"><b>')
    ent, asis, tarjeta = burbujas("w-m", bot, form_svg)
    nuevo = "Con el tope de ofrecimientos lleno"
    t, sv = sumar_estados(t, [("En modo Asistente", [nuevo])], [nuevo])
    s = sv[nuevo]

    # Un audio con el tope de ofrecimientos lleno se transcribe y lo contesta su caso (278).
    audio = re.search(r'<div class="w-m ent"><span class="gl au"><span class="pl2">(?:(?!</div>).)*?<span class="tr"><small>Transcripción</small>',
                      t, re.S).group(0)
    hilo = ('<span class="o-sis">Lucía Fernández pasó la conversación al asistente</span>'
            + ent("Recién salgo de Ferretería Rosales, cerramos la venta.", "10:33")
            + asis(oferta("Visita a cliente"), "10:34", tarjeta("Visita a cliente", 4))
            + ent("Ya entregué el pedido de Obra Centro.", "11:05")
            + asis(oferta("Entrega de pedido"), "11:05", tarjeta("Entrega de pedido", 1))
            + audio.replace("0:24", "0:11") + "«¿El sábado abre el depósito? Tengo que retirar mercadería.»</span></span>"
            '<span class="pie">11:40</span></div>'
            + asis("Sí, los sábados de 9 a 13.", "11:40", pq=pq_abierto(pq_svg, PQ_AUDIO), arriba=True))
    (h3, e3) = sc_ifs(t, "s3")
    t = t[:h3[1]] + sc(s, hilo) + t[h3[1]:]
    (h3, e3) = sc_ifs(t, "s3")
    t = t[:e3[1]] + renombrar(t[e3[0]:e3[1]], "s3", s) + t[e3[1]:]

    # «No se pudo pasar a texto» deriva de verdad (270): el mensaje fijo, atención manual y «Necesita una persona».
    t = una(t, '<span class="o-sis">El asistente no pudo leer el audio · Necesita una persona</span>',
            asis(DERIVA, "10:33") + '<span class="o-sis">El asistente no pudo leer el audio · Necesita una persona</span>')
    (h5, e5), (h4, e4) = sc_ifs(t, "s5"), sc_ifs(t, "s4")
    assert "as-fr" in t[e5[0]:e5[1]] and 'class="area"' in t[e4[0]:e4[1]]
    t = t[:e5[0]] + renombrar(t[e4[0]:e4[1]], "s4", "s5") + t[e5[1]:]
    t = con_necesita(t, '<span class="l3">Carga de pedidos · Lucía Fernández</span>')
    t = una(t, "      s0: k === 0,\n",
            "      necesita: e === 'No se pudo pasar a texto', atiende: e === 'No se pudo pasar a texto' ? 'Sin tomar' : 'Lucía Fernández',\n"
            "      s0: k === 0,\n")
    t = js_lista(t, "modoAs", lambda lista: (lista.remove("No se pudo pasar a texto"), lista.append(nuevo)))
    t = js_lista(t, "modoMan", lambda lista: lista.append("No se pudo pasar a texto"))
    t = js_mapa(t, r"vistaPrevia: (\{[^}]*\})\[e\]", {"No se pudo pasar a texto": f"Asistente: {DERIVA}",
                                                     nuevo: "Asistente: Sí, los sábados de 9 a 13."})
    t = js_mapa(t, r"hora: (\{[^}]*\})\[e\]", {nuevo: "27/09/2026, 11:40"})
    t = para_aprobar(con_css(t, CSS_CHAT_COMPU))
    escribir("WA-Chats-Audio", t, nl)


def leer_crudo(nombre):
    return io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read().replace("\r\n", "\n")


# ---------------------------------------------------------------------------------------------------------------- el pase
if __name__ == "__main__":
    ya = [n for n in TABLEROS if MARCA in leer_crudo(n)]
    if ya:
        print("ya tienen el bloque, no hace nada:", ", ".join(ya))
        sys.exit(0)
    for f in (wa_asistentes, m_wa_asistentes, wa_equipo_asistente, m_wa_equipo_asistente, wa_chats_casos, m_wa_chats_casos,
              wa_chats_asistente, m_wa_conversacion_asistente, wa_chats_audio):
        f()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
