"""La Configuración de Formularios con los documentos de la E25 (decisiones 270 y 272), con la tanda 3B del traspaso 18 (2026-11-26):
suma estados nuevos, con «E25:» en el nombre, a los tres tableros de la E18 que dibujó la tanda 3A (v187): `FRM-Config-Org`,
`M-FRM-Config-Org` y `FRM-Config-Plat`. No se crean tableros nuevos (el lienzo publicado llegó a 510 de 512 archivos), y los estados
de la E18 quedan como están (spec `docs/plans/formularios/25-parte-datos-y-contrato.md`, «La Configuración de Formularios», y
`25-parte-pantallas-y-verificar.md`, que pedía `FRM-Config-Org-25`, su teléfono y `FRM-Config-Plat-25`).

- **La zona «Documentos recibidos»,** debajo de «Archivos de las respuestas», con los seis valores de la spec, cada uno con su (i),
  su mínimo y su máximo (270): «Formularios por planilla» (3, de 1 a 10), «Páginas de un PDF» (10, de 1 a 10, porque el proveedor no
  lee más), «Relecturas por persona y día» (5, de 1 a 100, que vuelven a las 00:00 de la organización, 271 y 283), «Parecidos para
  sugerir un formulario» (3, de 2 a 20), «Vencer los propuestos sin revisar» y «Borrar los descartados» (90 días cada uno, de 1 a
  3650, 272). La (i) de los dos plazos avisa que la política de privacidad tiene que prometer lo mismo (272).
- **La organización** (`forms.manage`): cada valor con el máximo de la plataforma a su lado, de solo lectura y con su (i), como el
  tamaño de un archivo de la E18. Estados nuevos: «E25: Documentos recibidos», «E25: la (i) de un plazo», «E25: con cambios», «E25:
  fuera de rango» (debajo del mínimo de 2 de los parecidos), «E25: por encima del máximo» (la plataforma bajó a 5 los formularios por
  planilla y se escribió 8), «E25: la plataforma bajó su máximo» (lo guardado pasa el máximo: vale el menor y la página lo dice, sin
  tocar lo guardado), «E25: otra persona cambió» (el 409 con «Volver a leer») y «E25: sin permiso» (todo apagado, el motivo en el
  tooltip sobre el control, 211, y sin los botones de guardar).
- **El teléfono de la organización:** lo mismo, uno debajo de otro como en la E18; la página corre, y «E25: la (i) de un plazo» se
  ve corrida hasta abajo, donde están los plazos. Estados nuevos: «E25: Documentos recibidos», «E25: la (i) de un plazo», «E25: por
  encima del máximo», «E25: otra persona cambió» y «E25: sin permiso».
- **Plataforma** (`platform.settings.manage`): los seis máximos para las organizaciones, de a dos por renglón, con el rango en la
  (i); al bajar uno, la página dice qué pasa con las organizaciones que eligieron más. Estados nuevos: «E25: Documentos recibidos»,
  «E25: la (i) de un plazo», «E25: con cambios», «E25: fuera de rango» (más páginas que las que lee el proveedor), «E25: otra
  persona cambió» y «E25: sin permiso».

Lo que la spec no da y se dibuja con lo que se recomienda (preguntas del reporte de la 3B): el máximo de la plataforma de entrada,
que es el tope de cada rango (como los 25 MB de la E18 y los 3650 días de los chats de WhatsApp), y los textos de los errores, como el
de la E18 («Elegí entre 1 y 10 formularios.») y, por encima del máximo de la plataforma, como `WA-Config-Base2` («…: es el máximo de
la plataforma.»).

Cambia los tableros en su lugar, con un bloque `<style data-t3b="e25-config">` antes de `</helmet>` que lo frena si ya corrió; el
`<title>` ya dice « · para aprobar». Después pasa las piezas: sobre el lienzo, con `traspaso10_piezas_1004.py --tableros`; sobre otra
carpeta (`--lienzo`, para probarlo en copias), con la misma función `pasar` de ese generador. No toca `canvas.json` ni el `$preview`
(los tres entran en su alto: la compu, 1440 × 900; el teléfono, 390 × 844, con la página que corre).

Uso: `python e25_config_1004.py` (el lienzo) o `python e25_config_1004.py --lienzo <carpeta con los tres tableros>`.
"""
import argparse
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
from base2_config_1004 import SIN_PERMISO  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-t3b="e25-config"'
SUFIJO = " · para aprobar"
TABLEROS = ["FRM-Config-Org", "M-FRM-Config-Org", "FRM-Config-Plat"]

# ---------------------------------------------------------------------------------------------------------------- lo de la E18
# Los textos de la E18 (`e18_config_1004.py`, de la 3A), copiados para dibujar su caja en los estados nuevos: no se importa.
CAJA_E18 = "Archivos de las respuestas"
ROTULO_E18 = "Tamaño máximo de un archivo"
ROTULO_PLAT = "Máximo de la plataforma"
AYUDA_E18_ORG = ("De 1 a 25 MB, y nunca más que el máximo de la plataforma (25 MB). Es el tope de cada foto y cada documento que llega "
                 "en una respuesta; el editor lo dice en «Cuántas fotos» y «Cuántos documentos». Una versión ya publicada conserva el "
                 "tamaño con el que se publicó.")
AYUDA_E18_PLAT = ("De 1 a 25 MB. Ninguna organización puede pasarlo: si lo bajás, en cada una vale el menor de los dos, sin cambiar lo "
                  "que guardó. Una versión ya publicada conserva el tamaño con el que se publicó.")
AYUDA_MAX = "Lo fija la plataforma. Si lo baja, vale el menor de los dos, sin cambiar lo que guardaste."
CONFLICTO = "Otra persona guardó la Configuración de Formularios mientras la editabas."

# ---------------------------------------------------------------------------------------------------------------- lo de la E25
CAJA = "Documentos recibidos"
CAJA_PLAT = "Documentos recibidos · máximos para las organizaciones"
POLITICA = "La política de privacidad tiene que prometer este mismo plazo."
NINGUNA = "Ninguna organización puede pasarlo: si lo bajás, en cada una vale el menor de los dos, sin cambiar lo que guardó."

# clave: (rótulo, unidad, por defecto, mínimo, máximo del rango, qué hace en la organización, qué es en Plataforma, es un plazo)
VALORES = {
    "planilla": ("Formularios por planilla", "formularios", 3, 1, 10,
                 "Cuando por WhatsApp llega una planilla con varias filas, el asistente propone por mensaje hasta esta cantidad de "
                 "formularios, en su orden; las demás filas quedan en «Documentos recibidos».",
                 "Es cuántos formularios propone por mensaje una planilla con varias filas.", False),
    "paginas": ("Páginas de un PDF", "páginas", 10, 1, 10,
                "La IA lee un PDF de hasta estas páginas: uno más largo no se lee, y a quien lo mandó se le dice con el número.",
                "El proveedor de IA no lee más de 10 páginas.", False),
    "relecturas": ("Relecturas por persona y día", "relecturas", 5, 1, 100,
                   "Al publicar un formulario armado con documentos, los que lo originaron se vuelven a leer, hasta esta cantidad por "
                   "día de quien lo armó; los demás esperan al otro día. Vuelven a las 00:00, hora de Grupo Delta.",
                   "Es cuántos documentos se vuelven a leer por día, de quien armó un formulario, al publicarlo.", False),
    "parecidos": ("Parecidos para sugerir un formulario", "documentos", 3, 2, 20,
                  "Cuando llegan esta cantidad de documentos sin clasificar del mismo tema, la campana avisa «Llegaron 3 documentos "
                  "parecidos» para armar un formulario con la IA.",
                  "Es desde cuántos documentos sin clasificar del mismo tema la campana sugiere armar un formulario.", False),
    "vencer": ("Vencer los propuestos sin revisar", "días", 90, 1, 3650,
               "Un documento propuesto que nadie revisa pasa a «Descartado» pasados estos días desde su último cambio.",
               "Es a los cuántos días vence un documento propuesto que nadie revisa.", True),
    "borrar": ("Borrar los descartados", "días", 90, 1, 3650,
               "Pasados estos días desde que se descartó, un documento se borra con lo que se leyó de él; también uno que venció sin "
               "revisar.",
               "Es a los cuántos días se borra un documento descartado, con lo que se leyó de él.", True),
}
ORDEN = list(VALORES)


def rango(clave, tope=None):
    rot, u, _, mn, mx, *_ = VALORES[clave]
    return f"De {mn} a {mx} {u}" if tope is None else f"De {mn} a {mx} {u}, y nunca más que el máximo de la plataforma ({tope} {u})"


def ayuda_org(clave, tope):
    _, _, _, _, _, que, _, plazo = VALORES[clave]
    return f"{rango(clave, tope)}. {que}" + (f" {POLITICA}" if plazo else "")


def ayuda_plat(clave):
    _, _, _, _, _, _, que, plazo = VALORES[clave]
    return f"{rango(clave)}. {NINGUNA} {que}" + (f" {POLITICA}" if plazo else "")


def error(clave, tope):
    """`Forms.Settings.Invalid` con el mínimo y el tope como parámetros (270); por encima del máximo de la plataforma lo dice."""
    _, u, _, mn, mx, *_ = VALORES[clave]
    return f"Elegí entre {mn} y {tope} {u}" + (": es el máximo de la plataforma." if tope < mx else ".")


def bajo(clave, tope):
    u = VALORES[clave][1]
    return (f"Hoy vale {tope} {u}, el máximo de la plataforma: los descartados se borran a los {tope} {u}. Si la plataforma lo sube, "
            "vuelve a valer lo que guardaste.")


def al_bajar(clave, tope):
    u = VALORES[clave][1]
    return (f"Al guardarlo, las organizaciones que eligieron más de {tope} {u} pasan a usar {tope}, sin cambiar lo que guardaron: sus "
            f"descartados se borran a los {tope} {u}.")


def estado(**cambios):
    """Un estado: los valores (`v`), los máximos de la plataforma (`m`), los errores, los avisos, la (i) abierta y lo demás."""
    e = {"v": {k: VALORES[k][2] for k in ORDEN}, "m": {k: VALORES[k][4] for k in ORDEN}, "err": {}, "aviso": {}, "i": None,
         "cambios": False, "conflicto": False, "ro": False, "abajo": False}
    for k, x in cambios.items():
        if isinstance(e.get(k), dict):
            e[k] = {**e[k], **x}
        else:
            e[k] = x
    return e


ORG = {
    "E25: Documentos recibidos": estado(),
    "E25: la (i) de un plazo": estado(i="vencer"),
    "E25: con cambios": estado(v={"planilla": 5, "vencer": 30}, cambios=True),
    "E25: fuera de rango": estado(v={"parecidos": 1}, err={"parecidos": error("parecidos", 20)}, cambios=True),
    "E25: por encima del máximo": estado(v={"planilla": 8}, m={"planilla": 5}, err={"planilla": error("planilla", 5)}, cambios=True),
    "E25: la plataforma bajó su máximo": estado(v={"borrar": 365}, m={"borrar": 180}, aviso={"borrar": bajo("borrar", 180)}),
    "E25: otra persona cambió": estado(v={"planilla": 5}, conflicto=True),
    "E25: sin permiso": estado(ro=True),
}
M_ORG = {
    "E25: Documentos recibidos": ORG["E25: Documentos recibidos"],
    "E25: la (i) de un plazo": estado(i="vencer", abajo=True),
    "E25: por encima del máximo": ORG["E25: por encima del máximo"],
    "E25: otra persona cambió": ORG["E25: otra persona cambió"],
    "E25: sin permiso": ORG["E25: sin permiso"],
}


def estado_plat(**cambios):
    e = estado(**cambios)
    e["v"] = {k: VALORES[k][4] for k in ORDEN} | cambios.get("v", {})
    return e


PLAT = {
    "E25: Documentos recibidos": estado_plat(),
    "E25: la (i) de un plazo": estado_plat(i="vencer"),
    "E25: con cambios": estado_plat(v={"borrar": 180}, aviso={"borrar": al_bajar("borrar", 180)}, cambios=True),
    "E25: fuera de rango": estado_plat(v={"paginas": 20}, err={"paginas": error("paginas", 10)}, cambios=True),
    "E25: otra persona cambió": estado_plat(v={"borrar": 180}, conflicto=True),
    "E25: sin permiso": estado_plat(ro=True),
}

CSS = """
/* E25 · «Documentos recibidos» en la Configuración de Formularios (270 y 272): la zona debajo de la de la E18, con la misma forma. */
.e25-cfg .w-caja { flex: none; }
/* E25 · en el teléfono la página corre también con un tooltip abierto, y «la (i) de un plazo» se ve corrida hasta abajo. */
.ap-cuerpo.e25-tel:has(.acc-tip) { overflow: auto !important; }
.ap-cuerpo.e25-abajo { flex-direction: column-reverse; }
.e25-pila { flex: none; display: flex; flex-direction: column; gap: 14px; }
.ap-gtit.e25-sec { margin: 14px 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1); }
.b2-i .acc-tip.e25-tip-der { left: auto; right: -14px; }
.b2-i .acc-tip.e25-tip-der::after { left: auto; right: 15px; }
"""


# ---------------------------------------------------------------------------------------------------------------- la compu
def banda(e):
    if e["ro"]:
        acciones = ""
    else:
        guardar = "" if e["cambios"] else " disabled"
        acciones = (f'<button type="button" class="cb cb-sec">Descartar cambios</button>'
                    f'<button type="button" class="cb cb-pri"{guardar}>Guardar cambios</button>')
    return (f'<div class="w-bnd"><div class="iz"><div><h1>Configuración</h1><p class="res">Formularios</p></div></div>'
            f'<div class="ac">{acciones}</div></div>')


def franja(e):
    if not e["conflicto"]:
        return ""
    return f'<div class="b2-av mal" role="alert" style="margin: 0;">{b2.SVG_ATEN}<span>{CONFLICTO}</span><a class="acc" href="#">Volver a leer</a></div>'


def valor_compu(rotulo, unidad, v, ayuda, err=None, aviso=None, ro=False, con_tip=False, i_abierta=False):
    """El número con su unidad y su (i); el error y el aviso debajo; apagado sin permiso, con el motivo en su tooltip (211)."""
    i = b2.info(ayuda, i_abierta, "b2-tip-abajo")
    clase = "ct err" if err else "ct"
    campo = f'<input class="{clase}" type="number" aria-label="{rotulo}" value="{v}"{" disabled" if ro else ""}>'
    if ro and con_tip:
        campo = f'<span class="b2-env">{campo}{b2.tip(SIN_PERMISO)}</span>'
    e = f'<span class="b2-err" role="alert">{err}</span>' if err else ""
    a = f'<div class="b2-av" role="status">{b2.SVG_ATEN}<span>{aviso}</span></div>' if aviso else ""
    return (f'<div class="w-cmp"><span class="rt b2-et">{rotulo}{i}</span><div class="b2-num">{campo}<span class="u">{unidad}</span></div>'
            f"{e}{a}</div>")


def solo_lectura_compu(rotulo, valor, unidad, ayuda):
    return (f'<div class="w-cmp"><span class="rt b2-et">{rotulo}{b2.info(ayuda)}</span><div class="b2-num"><div class="ct ro">{valor}</div>'
            f'<span class="u">{unidad}</span></div></div>')


def caja(titulo, campos):
    return f'<div class="w-caja"><div class="w-cab"><span>{titulo}</span></div><div class="as-g2">{campos}</div></div>'


def caja_e18_org(e):
    return caja(CAJA_E18, valor_compu(ROTULO_E18, "MB", 10, AYUDA_E18_ORG, ro=e["ro"])
                + solo_lectura_compu(ROTULO_PLAT, 25, "MB", AYUDA_MAX))


def caja_e18_plat(e):
    return caja(CAJA_E18, valor_compu(ROTULO_E18, "MB", 25, AYUDA_E18_PLAT, ro=e["ro"]))


def campos_e25(e, plat):
    salida = ""
    for k in ORDEN:
        rot, u = VALORES[k][0], VALORES[k][1]
        ayuda = ayuda_plat(k) if plat else ayuda_org(k, e["m"][k])
        salida += valor_compu(rot, u, e["v"][k], ayuda, e["err"].get(k), e["aviso"].get(k), e["ro"], con_tip=k == ORDEN[0],
                              i_abierta=e["i"] == k)
        if not plat:
            salida += solo_lectura_compu(ROTULO_PLAT, e["m"][k], u, AYUDA_MAX)
    return salida


def cuerpo_compu(e, plat):
    e18 = caja_e18_plat(e) if plat else caja_e18_org(e)
    return (f'<div class="w-body e18-cfg e25-cfg">{franja(e)}{e18}{caja(CAJA_PLAT if plat else CAJA, campos_e25(e, plat))}</div>')


def marco_compu(cuerpo):
    """Lo de antes de la banda y lo de después del cuerpo, del primer estado de la E18 (el menú, el panel y la barra)."""
    a = cuerpo.index('<div class="w-bnd">')
    b = cuerpo.index('<div class="w-body', a)
    return cuerpo[:a], cuerpo[b2.fin_div(cuerpo, b):], cuerpo[a:b2.fin_div(cuerpo, b)]


# ---------------------------------------------------------------------------------------------------------------- el teléfono
TITULO_TEL = '<span class="ap-gtit" style="margin: 4px 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1);">{}</span>'


def valor_tel(rotulo, unidad, v, ayuda, err=None, aviso=None, ro=False, con_tip=False, i_abierta=False, tip_clase="b2-tip-abajo"):
    i = b2.info(ayuda, i_abierta, tip_clase)
    if ro:
        t = b2.tip(SIN_PERMISO, "b2-tip-abajo") if con_tip else ""
        ct = f'<span class="b2-env"><div class="ct apag" aria-disabled="true">{v}</div>{t}</span>'
    else:
        ct = f'<div class="ct{" err" if err else ""}">{v}</div>'
    e = f'<span class="b2-err" role="alert">{err}</span>' if err else ""
    a = f'<div class="b2-av" role="status">{b2.SVG_ATEN}<span>{aviso}</span></div>' if aviso else ""
    return (f'<div class="ap-cmp"><span class="rt"><span class="b2-et">{rotulo}{i}</span></span><div class="b2-num">{ct}'
            f'<span class="u">{unidad}</span></div>{e}{a}</div>')


def maximo_tel(valor, unidad):
    return (f'<div class="ap-cmp"><span class="rt"><span class="b2-et">{ROTULO_PLAT}{b2.info(AYUDA_MAX, False, "b2-tip-abajo")}</span></span>'
            f'<div class="b2-num"><div class="ct ro">{valor}</div><span class="u">{unidad}</span></div></div>')


def cuerpo_tel(e):
    fr = (f'<div class="b2-av mal" role="alert">{b2.SVG_ATEN}<span>{CONFLICTO}</span><a class="acc" href="#">Volver a leer</a></div>'
          if e["conflicto"] else "")
    pila = fr + TITULO_TEL.format(CAJA_E18) + valor_tel(ROTULO_E18, "MB", 10, AYUDA_E18_ORG, ro=e["ro"]) + maximo_tel(25, "MB")
    pila += f'<span class="ap-gtit e25-sec">{CAJA}</span>'
    for k in ORDEN:
        rot, u = VALORES[k][0], VALORES[k][1]
        # La (i) de los plazos queda cerca del borde derecho: abre hacia la izquierda para entrar en la pantalla.
        pila += valor_tel(rot, u, e["v"][k], ayuda_org(k, e["m"][k]), e["err"].get(k), e["aviso"].get(k), e["ro"], con_tip=k == ORDEN[0],
                          i_abierta=e["i"] == k, tip_clase="b2-tip-abajo e25-tip-der" if VALORES[k][7] else "b2-tip-abajo")
        pila += maximo_tel(e["m"][k], u)
    clase = "ap-cuerpo e25-tel" + (" e25-abajo" if e["abajo"] else "")
    fijo = "" if e["ro"] else ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button>'
                               f'<button type="button" class="cb cb-pri full{"" if e["cambios"] else " apag"}">Guardar cambios</button></div>')
    return f'<div class="{clase}" style="padding: 4px 20px 16px; overflow: auto;"><div class="e25-pila">{pila}</div></div>{fijo}'


def marco_tel(cuerpo):
    """Lo de antes del cuerpo (la barra de estado y la de arriba) y lo de después de los botones fijos, del primer estado."""
    a = cuerpo.index('<div class="ap-cuerpo"')
    b = b2.fin_div(cuerpo, a)
    if cuerpo.startswith('<div class="ap-fijo">', b):
        b = b2.fin_div(cuerpo, b)
    return cuerpo[:a], cuerpo[b:]


# ---------------------------------------------------------------------------------------------------------------- sumar los estados
SC_IF = re.compile(r'<sc-if value="\{\{e(\d+)\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">')


def primer_estado(t):
    m = SC_IF.search(t)
    assert m and m.group(1) == "0"
    fin = t.index("</sc-if>", m.end())
    cuerpo = t[m.end():fin]
    assert "<sc-if" not in cuerpo, "el primer estado tiene un sc-if adentro"
    return cuerpo


def sumar(t, estados, cuerpos):
    """Suma los estados al Tweak «estado» (`data-props` y `renderVals`), un `sc-if` por estado después de los de la E18, y el CSS."""
    assert t.count("data-props='") == 1
    m = re.search(r"data-props='(.*?)'>", t, re.S)
    props = json.loads(m.group(1))
    viejos = props["estado"]["options"]
    assert not set(viejos) & set(estados), "un estado repetido"
    todos = viejos + estados
    props["estado"]["options"] = todos
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    lista = re.search(r"const k = (\[.*?\])\.indexOf\(this\.props\.estado \?\? ", t)
    assert lista and json.loads(lista.group(1)) == viejos and t.count("const k = [") == 1
    t = t[:lista.start(1)] + json.dumps(todos, ensure_ascii=False) + t[lista.end(1):]
    vals = ", ".join(f"e{i}: k === {i}" for i in range(len(todos)))
    viejo = "return { si: true, no: false, " + ", ".join(f"e{i}: k === {i}" for i in range(len(viejos))) + " };"
    t = b2.una_vez(t, viejo, "return { si: true, no: false, " + vals + " };")
    assert len(SC_IF.findall(t)) == len(viejos)
    fin = t.rindex("</sc-if>", 0, t.index("</x-dc>")) + len("</sc-if>")
    nuevos = "".join(f'<sc-if value="{{{{e{len(viejos) + k}}}}}" hint-placeholder-val="{{{{no}}}}">{c}</sc-if>' for k, c in enumerate(cuerpos))
    assert "{{" not in re.sub(r"\{\{(e\d+|si|no)\}\}", "", nuevos), "una variable sin valor en un estado nuevo"
    t = t[:fin] + nuevos + t[fin:]
    t = b2.una_vez(t, "</helmet>", f"<style {MARCA}>\n{CSS}</style>\n</helmet>")
    titulo = re.search(r"<title>(.*?)</title>", t).group(1)
    if not titulo.endswith(SUFIJO):
        t = b2.una_vez(t, f"<title>{titulo}</title>", f"<title>{titulo}{SUFIJO}</title>")
    return t


def frm_config(t, plat):
    antes, despues, e18 = marco_compu(primer_estado(t))
    # La caja de la E18 que se dibuja en los estados nuevos es la misma que la del primer estado.
    assert caja_e18_plat(estado()) in e18 if plat else caja_e18_org(estado()) in e18, "la caja de la E18 cambió"
    estados = PLAT if plat else ORG
    return sumar(t, list(estados), [antes + banda(e) + cuerpo_compu(e, plat) + despues for e in estados.values()])


def m_frm_config_org(t):
    primero = primer_estado(t)
    antes, despues = marco_tel(primero)
    assert valor_tel(ROTULO_E18, "MB", 10, AYUDA_E18_ORG) in primero, "el campo de la E18 cambió"
    return sumar(t, list(M_ORG), [antes + cuerpo_tel(e) + despues for e in M_ORG.values()])


HACER = {"FRM-Config-Org": lambda t: frm_config(t, False), "M-FRM-Config-Org": m_frm_config_org,
         "FRM-Config-Plat": lambda t: frm_config(t, True)}


def leer(ruta):
    crudo = ruta.read_bytes()
    return crudo.decode("utf-8").replace("\r\n", "\n"), "\r\n" if b"\r\n" in crudo else "\n"


def escribir(ruta, texto, fin):
    with open(ruta, "w", encoding="utf-8", newline=fin) as f:
        f.write(texto)
    print("ok", ruta.name, len(texto))


def piezas(lienzo, nombres):
    """La pasada de las piezas (la escala de la compu y las piezas comunes): sobre el lienzo, el generador de siempre; sobre otra
    carpeta, su misma función `pasar`, con el teléfono según `canvas.json`."""
    if lienzo == PROJ:
        subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(nombres)], check=True)
        return
    import traspaso10_piezas_1004 as t10
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    cuenta = {}
    for nombre in nombres:
        ruta = lienzo / f"{nombre}.dc.html"
        t, fin = leer(ruta)
        nuevo = t10.pasar(t, nombre, cuenta, t10.es_telefono(f"{nombre}.dc.html", canvas))
        if nuevo != t:
            escribir(ruta, nuevo, fin)
    print("piezas:", len(nombres), "tableros;", cuenta)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Suma los estados de la E25 a la Configuración de Formularios de la E18.")
    p.add_argument("--lienzo", default=str(PROJ), help="la carpeta de los tableros (por defecto, la del lienzo)")
    lienzo = pathlib.Path(p.parse_args().lienzo).resolve()
    hechos = []
    for nombre in TABLEROS:
        ruta = lienzo / f"{nombre}.dc.html"
        t, fin = leer(ruta)
        if MARCA in t:
            print(nombre, "ya tiene los estados de la E25: no se toca")
            continue
        assert 'data-e18="t3"' in t, f"{nombre} no es el tablero de la E18"
        escribir(ruta, HACER[nombre](t), fin)
        hechos.append(nombre)
    if hechos:
        piezas(lienzo, hechos)
