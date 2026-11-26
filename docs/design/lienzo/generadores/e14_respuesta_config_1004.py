"""La E14 con el traspaso 18, tanda 2 (2026-11-26): la respuesta en el chat y el tiempo para contestar un formulario.

- `WA-Chats-Respuesta` y `M-WA-Conversacion-Respuesta`: el valor de una pregunta de catálogo deja de llevar «Motivos de visita · SEG»
  debajo (en el teléfono, junto con «·»): el código, el detalle y el catálogo van cada uno en su renglón de lectura, con su rótulo,
  un poco adentro, debajo de la pregunta (263). Lo demás de la tarjeta sigue: las primeras 3 respuestas, «Ver las N respuestas»,
  «Guardada como VIS-000123» y el rechazo de una opción dada de baja con «Mandar de nuevo».
- `WA-Config-Base2` y `M-WA-Config-Base2` (la Configuración de WhatsApp de la organización): suman la caja «Formularios» con «Tiempo
  para contestar un formulario», 24 horas de entrada, de 1 a 168 y nunca más que el máximo de la plataforma (`FlowSessionHours`),
  con la forma de «Guardar los mensajes de los chats»: el valor, la unidad, su (i), el error con el mínimo y el máximo, la revisión
  y el 409 de la página, y apagado sin permiso (270). Estados nuevos: su (i), fuera de rango y, en la compu, más que el máximo de
  la plataforma (que en el ejemplo bajó a 72).
- `Config-Plat-Base2` y `M-Config-Plat-Base2`: en la zona «WhatsApp», «Máximo de tiempo para contestar un formulario», 168 horas de
  entrada (`MaxFlowSessionHours`), con su (i): ninguna organización puede pasarlo (270). El mínimo y el máximo de ese máximo no
  están escritos: van de 1 a 168. Estado nuevo: su (i). La compu crece 60 px (1760 → 1820) por el renglón nuevo.

Cambia los tableros en su lugar; no corre dos veces (el bloque `data-e14="t2"` lo frena). Después va
`traspaso10_piezas_1004.py --tableros WA-Chats-Respuesta,M-WA-Conversacion-Respuesta,Config-Plat-Base2,M-Config-Plat-Base2,WA-Config-Base2,M-WA-Config-Base2`,
que pone la escala de la compu.
"""
import io
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
from base2_config_1004 import cmp_tel, numero_ab  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = '<style data-e14="t2">'
PARA_APROBAR = " · para aprobar"


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    return s.replace("\r\n", "\n"), nl


def escribir(nombre, s, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(s.replace("\n", nl))
    print("ok", nombre, len(s))


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (viejo[:120], t.count(viejo))
    return t.replace(viejo, nuevo)


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def titulo(t, nuevo=None):
    m = re.search(r"<title>(.*?)</title>", t)
    assert m and not m.group(1).endswith(PARA_APROBAR), m and m.group(1)
    return t[:m.start(1)] + (nuevo or m.group(1)) + PARA_APROBAR + t[m.end(1):]


def fin_sc_if(t, i):
    prof = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        prof += 1 if m.group(0) == "<sc-if" else -1
        if prof == 0:
            return i + m.end()
    raise AssertionError("sc-if sin cerrar")


def estados_e(t):
    """Los `sc-if` de cada estado de un tablero de la base 2 (`{{eN}}`), en orden: [(inicio, fin), …]."""
    pos = [m.start() for m in re.finditer(r'<sc-if value="\{\{e\d+\}\}"', t)]
    return [(i, fin_sc_if(t, i)) for i in pos]


def en_cada_estado(t, cambiar):
    """`cambiar(k, cuerpo)` en el cuerpo de cada estado, de atrás para adelante."""
    for k, (i, j) in reversed(list(enumerate(estados_e(t)))):
        t = t[:i] + cambiar(k, t[i:j]) + t[j:]
    return t


def bloque_e(t, k):
    i, j = estados_e(t)[k]
    return t[i:j]


def sumar_estados_e(t, despues, cuerpos):
    """Suma estados a un tablero de la base 2: al enum del `data-props` después de `despues` (o al final), a `renderVals` con su
    `eN` y su `sc-if` al final de la plantilla. `cuerpos`: [(nombre, sc-if de otro estado, que se renombra), …]."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    ops = props["estado"]["options"]
    k = ops.index(despues) + 1 if despues else len(ops)
    ops[k:k] = [n for n, _ in cuerpos]
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]

    m = re.search(r"const k = (\[.*?\])\.indexOf\(this\.props\.estado", t)
    lista = json.loads(m.group(1))
    base = len(lista)
    lista += [n for n, _ in cuerpos]
    t = t[:m.start(1)] + json.dumps(lista, ensure_ascii=False) + t[m.end(1):]
    ult = f"e{base - 1}: k === {base - 1} }};"
    t = una(t, ult, f"e{base - 1}: k === {base - 1}, " + ", ".join(f"e{base + i}: k === {base + i}" for i in range(len(cuerpos))) + " };")
    assert sorted(ops) == sorted(lista), set(ops) ^ set(lista)

    nuevos = []
    for i, (_, bloque) in enumerate(cuerpos):
        assert re.match(r'<sc-if value="\{\{e\d+\}\}" hint-placeholder-val="\{\{(si|no)\}\}">', bloque)
        nuevos.append(f'<sc-if value="{{{{e{base + i}}}}}" hint-placeholder-val="{{{{no}}}}">' + bloque[bloque.index(">") + 1:])
    _, fin = estados_e(t)[-1]
    return t[:fin] + "".join(nuevos) + t[fin:]


# ---------------------------------------------------------------------------------------------------------------- la respuesta en el chat
# El valor y, en su renglón cada uno, el código o el detalle y el catálogo (263): (pregunta, valor, [(rótulo, dato), …]).
CATALOGO = [
    ("Motivo", "Seguimiento", "Motivos de visita · SEG", [("Código", "SEG"), ("Catálogo", "Motivos de visita")]),
    ("Supervisor a cargo", "Martín Paz", "Supervisores · Delta S.A.", [("Detalle", "Delta S.A."), ("Catálogo", "Supervisores")]),
]

CSS_RESP = """
/* E14 · El valor de una pregunta de catálogo (263): el código, el detalle y el catálogo, cada uno en su renglón de lectura, con su
   rótulo un poco adentro, debajo de la pregunta; nada debajo del valor. */
.r-gr > .k.r-sub { padding-left: 28px; }
"""
CSS_RESP_TEL = """
/* E14 · El valor de una pregunta de catálogo (263): el código, el detalle y el catálogo, cada uno en su renglón de lectura, con su
   rótulo un poco adentro, debajo de la pregunta; nada junto con «·». */
.g-det > .k.g-sub { padding-left: 26px; }
"""


def wa_chats_respuesta():
    t, nl = leer("WA-Chats-Respuesta")
    t = con_css(t, CSS_RESP)
    t = titulo(t)
    for preg, valor, viejo, renglones in CATALOGO:
        sub = "".join(f'<span class="k r-sub">{r}</span><span class="v">{d}</span>' for r, d in renglones)
        t = una(t, f'<span class="k">{preg}</span><span class="v">{valor}<small>{viejo}</small></span>',
                f'<span class="k">{preg}</span><span class="v">{valor}</span>{sub}')
    assert "<small>Motivos de visita" not in t and "<small>Supervisores" not in t
    escribir("WA-Chats-Respuesta", t, nl)


def m_wa_conversacion_respuesta():
    t, nl = leer("M-WA-Conversacion-Respuesta")
    t = con_css(t, CSS_RESP_TEL)
    t = titulo(t)
    for preg, valor, viejo, renglones in CATALOGO:
        sub = "".join(f'<span class="k g-sub">{r}</span><span>{d}</span>' for r, d in renglones)
        t = una(t, f'<span class="k">{preg}</span><span>{valor} · {viejo}</span>', f'<span class="k">{preg}</span><span>{valor}</span>{sub}')
    assert "Motivos de visita · SEG" not in t and "Supervisores · Delta" not in t
    escribir("M-WA-Conversacion-Respuesta", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el tiempo para contestar
FLOW = "Tiempo para contestar un formulario"
MAX_FLOW = "Máximo de tiempo para contestar un formulario"
FUERA_FLOW = "Tiene que ser de 1 a 168."
BAJO = 72  # el máximo de la plataforma en el estado «más que el máximo»: bajó de 168 a 72
MAS_QUE_MAX = f"Tiene que ser de 1 a {BAJO}: es el máximo de la plataforma."


def ayuda_flow(maximo=168):
    return (f"De 1 a 168 horas, y hasta el máximo de la plataforma ({maximo}). Es el tiempo que tiene quien recibe un formulario "
            "para contestarlo, desde que se lo mandan. Un formulario ya mandado conserva su plazo.")


AYUDA_MAX = ("De 1 a 168 horas. Ninguna organización da más tiempo que esto para contestar un formulario. Bajarlo acorta los que se "
             "manden después, no los ya mandados.")
AYUDA_MAX_TEL = "De 1 a 168 horas. Ninguna organización da más tiempo que esto para contestar un formulario."

CSS_CONFIG = """
/* E14 · El tiempo para contestar un formulario (270): con la forma de «Guardar los mensajes de los chats» (la base 2). */
"""


def caja_flow(valor="24", error=None, ro=False, abierto=False, maximo=168):
    """La caja «Formularios» de la Configuración de WhatsApp de la organización, como la de «Chats»."""
    ayuda = b2.info(ayuda_flow(maximo), abierto, "b2-tip-abajo")
    campo = (f'<input class="ct{" err" if error else ""}" type="number" aria-label="{FLOW}" value="{valor}"{" disabled" if ro else ""}>')
    err = f'<span class="b2-err" role="alert">{error}</span>' if error else ""
    return ('<div class="w-caja o-abre"><div class="w-cab"><span>Formularios</span></div><div class="p-hoja o-col"><div class="o-fila">'
            f'<div class="w-cmp" style="width: 360px;"><span class="rt b2-et">{FLOW}{ayuda}</span>'
            f'<div class="b2-num">{campo}<span class="u">horas</span></div>{err}</div></div></div></div>')


GUARDAR_APAG = '<button type="button" class="cb cb-pri" disabled>Guardar cambios</button>'
GUARDAR = '<button type="button" class="cb cb-pri">Guardar cambios</button>'


def wa_config_base2():
    t, nl = leer("WA-Config-Base2")
    t = con_css(t, CSS_CONFIG)
    t = titulo(t, "Administración · WhatsApp · Configuración (nueva) · el plazo de los chats y el tiempo para contestar un formulario")
    nombres = json.loads(re.search(r"data-props='(\{.*?\})'", t).group(1))["estado"]["options"]
    assert nombres == ["Sin cambios", "La (i) del plazo", "Fuera de rango", "Más que el máximo de la plataforma",
                       "Otra persona cambió la configuración", "Solo lectura"], nombres

    def sumar(k, cuerpo):
        i = cuerpo.index('<div class="w-caja o-abre"><div class="w-cab"><span>Chats</span></div>')
        j = b2.fin_div(cuerpo, i)
        return cuerpo[:j] + caja_flow(ro=nombres[k] == "Solo lectura") + cuerpo[j:]

    t = en_cada_estado(t, sumar)
    base = bloque_e(t, 0)
    assert base.count(GUARDAR_APAG) == 1
    nuevos = [
        ("La (i) del tiempo para contestar", una(base, caja_flow(), caja_flow(abierto=True))),
        ("Tiempo para contestar fuera de rango", una(una(base, caja_flow(), caja_flow("0", FUERA_FLOW)), GUARDAR_APAG, GUARDAR)),
        ("Tiempo para contestar: más que el máximo de la plataforma",
         una(una(base, caja_flow(), caja_flow("96", MAS_QUE_MAX, maximo=BAJO)), GUARDAR_APAG, GUARDAR)),
    ]
    t = sumar_estados_e(t, "Más que el máximo de la plataforma", nuevos)
    assert t.count(f'aria-label="{FLOW}"') == 9
    escribir("WA-Config-Base2", t, nl)


def seccion_flow_tel(valor="24", error=None, abierto=False):
    return ('<span class="ap-sec">Formularios</span><div class="ap-tarj">'
            + cmp_tel(FLOW, valor, ayuda_flow(), "horas", error, abierto_i=abierto) + "</div>")


def m_wa_config_base2():
    t, nl = leer("M-WA-Config-Base2")
    t = con_css(t, CSS_CONFIG)
    t = titulo(t)

    def sumar(k, cuerpo):
        i = cuerpo.index('<div class="ap-tarj">', cuerpo.index('<span class="ap-sec">Chats</span>'))
        j = b2.fin_div(cuerpo, i)
        return cuerpo[:j] + seccion_flow_tel() + cuerpo[j:]

    t = en_cada_estado(t, sumar)
    base = bloque_e(t, 0)
    apag = '<button type="button" class="cb cb-pri full apag">Guardar cambios</button>'
    nuevos = [
        ("La (i) del tiempo para contestar", una(base, seccion_flow_tel(), seccion_flow_tel(abierto=True))),
        ("Tiempo para contestar fuera de rango",
         una(una(base, seccion_flow_tel(), seccion_flow_tel("0", FUERA_FLOW)), apag, apag.replace(" apag", ""))),
    ]
    t = sumar_estados_e(t, None, nuevos)
    assert t.count(f'<span class="b2-et">{FLOW}') == 5
    escribir("M-WA-Config-Base2", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el máximo de la plataforma
ALTO, ALTO_NUEVO = 1760, 1820


def config_plat_base2():
    t, nl = leer("Config-Plat-Base2")
    t = con_css(t, CSS_CONFIG)
    t = titulo(t)
    nombres = json.loads(re.search(r"data-props='(\{.*?\})'", t).group(1))["estado"]["options"]
    assert len(nombres) == 9 and nombres[-1] == "Sin permiso", nombres

    def sumar(k, cuerpo):
        i = cuerpo.index('<div class="campo2"><label class="et" for="f-Max">')
        j = b2.fin_div(cuerpo, i)
        return cuerpo[:j] + numero_ab("f-Flow", MAX_FLOW, "168", "horas", AYUDA_MAX, apagado=nombres[k] == "Sin permiso") + cuerpo[j:]

    t = en_cada_estado(t, sumar)
    base = bloque_e(t, 0)
    viejo = numero_ab("f-Flow", MAX_FLOW, "168", "horas", AYUDA_MAX)
    nuevos = [("La (i) del máximo para contestar un formulario",
               una(base, viejo, numero_ab("f-Flow", MAX_FLOW, "168", "horas", AYUDA_MAX, abierto=True)))]
    t = sumar_estados_e(t, "Sin países", nuevos)

    # El renglón nuevo de la zona «WhatsApp» alarga la página: el tablero crece para leerla entera.
    assert t.count(f"height: {ALTO}px;") == 10, t.count(f"height: {ALTO}px;")
    t = t.replace(f"height: {ALTO}px;", f"height: {ALTO_NUEVO}px;")
    t = una(t, f'"$preview":{{"width":1440,"height":{ALTO}}}', f'"$preview":{{"width":1440,"height":{ALTO_NUEVO}}}')
    assert t.count('id="f-Flow"') == 10
    escribir("Config-Plat-Base2", t, nl)


def m_config_plat_base2():
    t, nl = leer("M-Config-Plat-Base2")
    t = con_css(t, CSS_CONFIG)
    t = titulo(t)

    def sumar(k, cuerpo):
        i = cuerpo.index('<div class="ap-cmp"><span class="rt"><span class="b2-et">Máximo para las organizaciones')
        j = b2.fin_div(cuerpo, i)
        return cuerpo[:j] + cmp_tel(MAX_FLOW, "168", AYUDA_MAX_TEL, "horas") + cuerpo[j:]

    t = en_cada_estado(t, sumar)
    base = bloque_e(t, 0)
    nuevos = [("La (i) del máximo para contestar un formulario",
               una(base, cmp_tel(MAX_FLOW, "168", AYUDA_MAX_TEL, "horas"), cmp_tel(MAX_FLOW, "168", AYUDA_MAX_TEL, "horas", abierto_i=True)))]
    t = sumar_estados_e(t, None, nuevos)
    assert t.count(f'<span class="b2-et">{MAX_FLOW}') == 5
    escribir("M-Config-Plat-Base2", t, nl)


TABLEROS = [
    ("WA-Chats-Respuesta", wa_chats_respuesta), ("M-WA-Conversacion-Respuesta", m_wa_conversacion_respuesta),
    ("WA-Config-Base2", wa_config_base2), ("M-WA-Config-Base2", m_wa_config_base2),
    ("Config-Plat-Base2", config_plat_base2), ("M-Config-Plat-Base2", m_config_plat_base2),
]

if __name__ == "__main__":
    for nombre, hacer in TABLEROS:
        t, _ = leer(nombre)
        if MARCA in t:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        hacer()
