"""La E14, tanda 2 del traspaso 18 (2026-11-26): mandar un formulario desde el chat, en `WA-Chats-Formulario`,
`WA-Chats-Formulario-Cliente` y sus teléfonos, redibujados en su lugar (spec `docs/plans/formularios/14-formularios.md` §9, «Enviar»,
y la ADR 0066, punto 2):

- **el formulario se elige con la pieza (262)**, no con tarjetas que hacen de radios. La lista es del servidor: el buscador va adentro,
  con la cantidad debajo; trae más con «Mostrar 20 más»; dice «Buscando…», «Ninguna opción coincide con «…».» (sin «0 formularios») o
  «No pudimos traer las opciones.» con «Reintentar», y pone primero el elegido de otra página. Como en ArquitecturaBase (`FormComposer`),
  el diálogo abre sin ninguno elegido («Elegí un formulario», en gris; el mensaje dice «Completá este formulario.» y «Enviar formulario»
  espera la elección). En el teléfono, la pieza va a pantalla completa. En `-Cliente`, la lista trae solo los formularios para clientes o
  para los dos (49 y 50);
- **del elegido se lee cada dato en su renglón (263)**, en la grilla de lectura del diálogo: «Versión», «Preguntas», las opciones de cada
  pregunta de catálogo (con su nombre como rótulo) y «Se puede mandar hasta». Un problema de la oferta va en rojo en el renglón de su
  pregunta, en lugar de la caja de abajo; el de todo el formulario («No está publicado para este número»), en el renglón «En WhatsApp».
  El formulario que ya no está es el error del campo, debajo de la pieza. Siguen el mensaje (hasta 1024; al elegir propone
  «Completá el formulario «…».», sin pisar lo escrito) y su contador;
- **el envío «Sin confirmar» con su revisión (240)**, con la forma aprobada de la segunda parte de la base (`base2_whatsapp_1004.py`):
  el punto y la palabra con su (i), «Marcar como revisado» y, revisado, «Lo revisó Ana Gómez · 19/11/2026, 14:35», sin reenviar. El
  chat no queda trabado: «Enviar formulario» sigue prendido. En la compu, la fila de la lista de chats dice el estado antes de la vista
  previa. Tres estados nuevos por tablero: «Sin confirmar», «Sin confirmar: por qué» y «Revisado».

Escribe las medidas de antes de la escala en un bloque `<style data-e14="t2">`, que lo frena si ya está, y al final corre
`traspaso10_piezas_1004.py --tableros` con los cuatro, que pone la escala de la compu. Para volver a correrlo, primero se restauran los
cuatro tableros (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
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
from base2_whatsapp_1004 import CSS_CHAT, pies  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-e14="t2"'
SUFIJO = " · para aprobar"
TABLEROS = ["WA-Chats-Formulario", "M-WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente"]

# ---------------------------------------------------------------------------------------------------------------- los datos
# (versión, preguntas) de cada formulario publicado, en el orden del servidor: por nombre.
FORMS = {"Alta de cliente": (1, 6), "Control de vehículo": (2, 7), "Entrega de pedido": (1, 5), "Inspección de obra": (1, 9),
         "Pedido de repuesto": (2, 5), "Reclamo de cliente": (2, 4), "Visita a cliente": (3, 7)}
TRES = ["Control de vehículo", "Entrega de pedido", "Visita a cliente"]
# La primera página de 48: se ven las primeras y, al final, «Mostrar 20 más».
PRIMERA = ["Alta de cliente", "Control de vehículo", "Entrega de pedido", "Inspección de obra", "Pedido de repuesto", "Reclamo de cliente"]
# Para un cliente: solo los formularios para clientes o para los dos (49 y 50).
DE_CLIENTES = ["Entrega de pedido", "Pedido de repuesto", "Reclamo de cliente"]
TOTAL = "48 formularios"
MAS = '<button type="button" class="mas">Mostrar 20 más</button>'
HASTA = "28/09/2026, 10:28"
ELEGI = "Elegí un formulario"
SIN_ELEGIR = "Completá este formulario."
BUSCADO = "Inspección de planta"

CATALOGOS = [("Motivo", "3 opciones"), ("Supervisor a cargo", "7 opciones")]


def con_problema(pregunta, texto):
    return [(p, texto, True) if p == pregunta else (p, v) for p, v in CATALOGOS]


PROBLEMAS = {
    "Más de 200 opciones": con_problema("Supervisor a cargo", "Supera las 200 opciones que admite WhatsApp. Ajustá el catálogo antes de mandar."),
    "Ninguna opción": con_problema("Supervisor a cargo", "No tiene opciones y la pregunta es obligatoria."),
    "Menos que el mínimo": con_problema("Motivo", "Tiene 1 opción y se piden al menos 2."),
    "Una opción que no entra": con_problema("Supervisor a cargo", "Una opción es más larga de lo que admite WhatsApp."),
    "Catálogo que no se puede usar": con_problema("Supervisor a cargo", "El catálogo no se puede usar. Avisale a quien lo administra."),
}
NO_PUBLICADO = "No está publicado para este número. Avisale a quien publica los formularios."
YA_NO_ESTA = "Visita a cliente ya no está disponible para Tomás. Elegí otro."

SIN_CONFIRMAR = ["Sin confirmar", "Sin confirmar: por qué", "Revisado"]
CASOS = ["sin", "sin-i", "revisado"]


def mensaje(nombre):
    return f"Completá el formulario «{nombre}»."


# ---------------------------------------------------------------------------------------------------------------- estilos
CSS_COMPU = b2.css() + CSS_CHAT + """
/* E14 · El formulario, en la pieza (262): el campo ocupa el ancho del diálogo y su lista se abre encima. */
.w-dlg .w-cmp .b2-env { width: 100%; }
/* E14 · Lo que se lee del elegido (263): cada dato en su renglón; un problema de la oferta, en rojo en el renglón de su pregunta. */
.t15-dg > .e14-mal { display: flex; align-items: flex-start; gap: 6px; color: var(--peligro); }
.t15-dg > .e14-mal svg { flex: none; width: 14px; height: 14px; margin-top: 1px; }
/* E14 · La fila de la lista de chats con un envío «Sin confirmar» (240): el punto y la palabra, antes de la vista previa. */
.w-conv .l2 .e14-l2 { display: flex; align-items: center; gap: 8px; min-width: 0; }
.w-conv .l2 .e14-l2 > .b2-est { flex: none; overflow: visible; color: var(--t2); }
"""

CSS_TEL = b2.css(True) + CSS_CHAT + """
/* E14 · El formulario, en la pieza (262), con el radio de los campos de la hoja; abierta, ocupa la pantalla. */
.ap .b2-pkc { border-radius: 12px; }
.ap-hoja .b2-err { font-size: 13px; }
/* E14 · Un problema de la oferta, en rojo en el renglón de su pregunta (263). */
.t15-det .ap-det b.e14-mal { display: flex; align-items: flex-start; gap: 6px; color: var(--peligro); }
.t15-det .ap-det b.e14-mal svg { flex: none; margin-top: 2px; }
"""


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    t = s.replace("\r\n", "\n")
    assert MARCA not in t, f"{nombre} ya tiene el bloque de la E14: restauralo antes de volver a correr"
    return t, nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:120])
    return t.replace(viejo, nuevo)


def cierre(t, i, tag):
    d = 0
    for m in re.finditer(rf"<{tag}\b|</{tag}>", t[i:]):
        d += -1 if m.group(0).startswith("</") else 1
        if d == 0:
            return i + m.end()
    raise AssertionError(f"<{tag}> sin cerrar en {i}")


def bloque(t, var, empieza):
    """(inicio, fin) del `sc-if` de `var` cuyo contenido empieza con `empieza`."""
    for m in re.finditer(r'<sc-if value="\{\{%s\}\}"[^>]*>' % var, t):
        if t.startswith(empieza, m.end()):
            return m.start(), cierre(t, m.start(), "sc-if")
    raise AssertionError(f"sin el sc-if de {var} que empieza con {empieza[:30]}")


def adentro(t, i, j):
    """El contenido de un `sc-if` que va de `i` a `j`."""
    return t[t.index(">", i) + 1:j - len("</sc-if>")]


def sc(var, cuerpo):
    return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{no}}}}">{cuerpo}</sc-if>'


def con_titulo(t):
    m = re.search(r"<title>(.*?)</title>", t)
    assert not m.group(1).endswith(SUFIJO)
    return t[:m.start(1)] + m.group(1) + SUFIJO + t[m.end(1):]


def con_css(t, css):
    return una(t, "</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


def sumar_estados(t, despues, nombres):
    """Suma `nombres` al Tweak «estado» después de `despues`; los de antes conservan su `sN` y los nuevos toman los que siguen."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    viejos = list(props["estado"]["options"])
    k = viejos.index(despues) + 1
    nuevos = viejos[:k] + nombres + viejos[k:]
    props["estado"]["options"] = nuevos
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    lista = lambda xs: "[" + ", ".join(json.dumps(x, ensure_ascii=False) for x in xs) + "]"  # noqa: E731
    t = una(t, lista(viejos) + ".indexOf(e);", lista(nuevos) + ".indexOf(e);")
    for i, v in enumerate(viejos):
        t = una(t, f"      s{i}: k === {i},\n", f"      s{i}: k === {nuevos.index(v)},\n")
    ult = f"      s{len(viejos) - 1}: k === {nuevos.index(viejos[-1])},\n"
    variables = {n: f"s{len(viejos) + j}" for j, n in enumerate(nombres)}
    t = una(t, ult, ult + "".join(f"      {variables[n]}: k === {nuevos.index(n)},\n" for n in nombres))
    return t, variables


def sumar_a_dicc(t, clave, valores):
    """Suma entradas al diccionario por estado de `renderVals` (`vistaPrevia: {…}[e]` u `hora: {…}[e]`)."""
    m = re.search(rf"{clave}: (\{{.*?\}})\[e\]", t)
    d = json.loads(m.group(1))
    d.update(valores)
    return t[:m.start(1)] + json.dumps(d, ensure_ascii=False) + t[m.end(1):]


def con_var(t, nombre, expresion):
    return una(t, "      si: true, no: false,\n", f"      si: true, no: false,\n      {nombre}: {expresion},\n")


# ---------------------------------------------------------------------------------------------------------------- la pieza
def lista_compu(cual, elegido=None, opciones=None):
    """La lista abierta de la pieza en la compu, del servidor (Criterio · Elegir)."""
    if cual == "pocas":
        return b2.lista([b2.op(n, elegida=n == elegido, activa=n == elegido) for n in opciones], buscar="",
                        cantidad=f"{len(opciones)} formularios")
    if cual == "muchas":
        return b2.lista([b2.op(n) for n in PRIMERA], buscar="", cantidad=TOTAL, pie=MAS)
    if cual == "otra pagina":
        return b2.lista([b2.op(elegido, elegida=True, activa=True)] + [b2.op(n, sep=i == 0) for i, n in enumerate(PRIMERA)],
                        buscar="", cantidad=TOTAL, pie=MAS)
    if cual == "sin coincidencias":
        return b2.lista([], buscar=BUSCADO, msj=f"Ninguna opción coincide con «{BUSCADO}».")
    if cual == "buscando":
        return b2.lista([], buscar="", msj="Buscando…")
    if cual == "falla":
        return b2.lista([], buscar="", msj='No pudimos traer las opciones. <span class="rein">Reintentar</span>')
    raise ValueError(cual)


def pieza_tel(cual, elegido=None, opciones=None):
    """La pieza a pantalla completa en el teléfono (262)."""
    if cual == "pocas":
        return b2.pk_tel("Formulario", [(n, None, n == elegido, None) for n in opciones], buscar="",
                         cantidad=f"{len(opciones)} formularios")
    if cual == "otra pagina":
        return b2.pk_tel("Formulario", [(elegido, None, True, None)] + [(n, None, False, None, i == 0) for i, n in enumerate(PRIMERA)],
                         buscar="", cantidad=TOTAL, pie_extra=MAS)
    if cual == "buscando":
        return b2.pk_tel("Formulario", [], buscar="", msj="Buscando…")
    raise ValueError(cual)


def renglones(elegido, catalogos=None, problema=None, hasta=True):
    """Lo que se lee del elegido (263): (rótulo, valor, en rojo)."""
    filas = []
    if elegido:
        version, preguntas = FORMS[elegido]
        filas += [("Versión", str(version), False), ("Preguntas", str(preguntas), False)]
        filas += [(f[0], f[1], len(f) > 2 and f[2]) for f in (catalogos or [])]
        if problema:
            filas.append(("En WhatsApp", problema, True))
    if hasta:
        filas.append(("Se puede mandar hasta", HASTA, False))
    return filas


def grilla_compu(filas):
    celdas = "".join(f'<span>{k}</span>' + (f'<span class="e14-mal">{b2.SVG_ERR}<span>{v}</span></span>' if mal else f"<span>{v}</span>")
                     for k, v, mal in filas)
    return f'<div class="t15-dg">{celdas}</div>'


def grilla_tel(filas):
    celdas = "".join(f'<div class="ap-det"><span>{k}</span>'
                     + (f'<b class="e14-mal">{b2.SVG_ERR}<span>{v}</span></b>' if mal else f"<b>{v}</b>") + "</div>"
                     for k, v, mal in filas)
    return f'<div class="t15-det">{celdas}</div>'


def con_mensaje(bloque_msj, texto):
    """El mensaje propuesto y su contador."""
    m = re.search(r'<div class="ct area">[^<]*</div><span class="c-ay"><span></span><span>\d+ / 1024</span></span>', bloque_msj)
    assert m, bloque_msj[:200]
    nuevo = f'<div class="ct area">{texto}</div><span class="c-ay"><span></span><span>{len(texto)} / 1024</span></span>'
    return bloque_msj[:m.start()] + nuevo + bloque_msj[m.end():]


# ---------------------------------------------------------------------------------------------------------------- el diálogo
def campo_compu(spec):
    elegido = spec.get("elegido")
    extra = lista_compu(spec["lista"], elegido, spec.get("opciones")) if spec.get("lista") else ""
    c = b2.campo(elegido or ELEGI, vacio=not elegido, abierto=bool(extra), error=bool(spec.get("error")), aria="Formulario", extra=extra)
    err = f'<span class="b2-err" role="alert">{spec["error"]}</span>' if spec.get("error") else ""
    return f'<div class="w-cmp"><span class="rt">Formulario <span class="req">*</span></span>{c}{err}</div>'


def campo_tel(spec):
    elegido = spec.get("elegido")
    c = b2.campo(elegido or ELEGI, vacio=not elegido, error=bool(spec.get("error")), aria="Formulario")
    err = f'<span class="b2-err" role="alert">{spec["error"]}</span>' if spec.get("error") else ""
    return f'<div class="ap-cmp"><span class="rt"><span>Formulario <span class="rq">*</span></span></span>{c}{err}</div>'


def filas_de(spec):
    elegido = None if spec.get("error") else spec.get("elegido")
    return renglones(elegido, spec.get("catalogos"), spec.get("problema"), spec.get("hasta", True))


def dialogo_compu(dlg, spec):
    """Rehace el cuerpo de un diálogo «Enviar un formulario a …» de la compu según `spec`."""
    i = dlg.index('<div class="db una">')
    j = b2.fin_div(dlg, i)
    _, hijos, _ = b2.hijos(dlg[i:j])
    msj = [h for h in hijos if h.startswith('<div class="w-cmp"><span class="rt">Mensaje que lo acompaña')]
    assert len(msj) == 1
    msj = msj[0]
    if spec.get("mensaje"):
        msj = con_mensaje(msj, spec["mensaje"])
    aviso = [h for h in hijos if h.startswith('<div class="c-aviso"')]
    preparando = [h for h in hijos if h.startswith('<div class="c-est">') and "Preparando" in h]
    for h in hijos:  # lo que se va: el buscador de afuera, las tarjetas, la grilla vieja y la caja del problema
        assert (h is msj or h.startswith(('<span class="w-bus c-bus', '<div class="w-cmp"><span class="rt">Formulario', '<div class="t15-dg">',
                                           '<div class="p-prob">', '<div class="c-aviso"', '<div class="c-est">', '<div class="w-cmp"><span class="rt">Mensaje'))), h[:80]
    cuerpo = (campo_compu(spec) + grilla_compu(filas_de(spec)) + "".join(preparando) + msj
              + ("" if spec.get("error") else "".join(aviso)))
    nuevo = dlg[:i] + '<div class="db una">' + cuerpo + "</div>" + dlg[j:]
    if spec.get("apagar"):
        nuevo = una(nuevo, '<button type="button" class="cb cb-pri">Enviar formulario</button>',
                    '<button type="button" class="cb cb-pri" disabled>Enviar formulario</button>')
    assert "c-op" not in nuevo and "p-prob" not in nuevo
    return nuevo


def hoja_tel(hoja, spec):
    """Rehace el cuerpo de la hoja «Enviar un formulario» del teléfono según `spec`."""
    i = hoja.index('<div class="hb">')
    j = b2.fin_div(hoja, i)
    _, hijos, _ = b2.hijos(hoja[i:j])
    msj = [h for h in hijos if h.startswith('<div class="ap-cmp"><span class="rt"><span>Mensaje que lo acompaña')]
    assert len(msj) == 1
    msj = msj[0]
    if spec.get("mensaje"):
        msj = con_mensaje(msj, spec["mensaje"])
    aviso = [h for h in hijos if h.startswith('<div class="t-aviso"')]
    for h in hijos:
        assert (h is msj or h.startswith(('<span class="t-bus"', '<div class="ap-cmp"><span class="rt"><span>Formulario', '<div class="c-ops"',
                                           '<div class="t-pag"', '<div class="c-est"', '<div class="t15-det"', '<div class="t-prob2"',
                                           '<div class="t-aviso"', '<div class="ap-cmp"><span class="rt"><span>Mensaje'))), h[:80]
    cuerpo = campo_tel(spec) + grilla_tel(filas_de(spec)) + msj + ("" if spec.get("error") else "".join(aviso))
    nuevo = hoja[:i] + '<div class="hb">' + cuerpo + "</div>" + hoja[j:]
    if spec.get("apagar"):
        nuevo = una(nuevo, '<button type="button" class="cb cb-pri">Enviar formulario</button>',
                    '<button type="button" class="cb cb-pri" disabled>Enviar formulario</button>')
    if spec.get("lista"):
        nuevo += pieza_tel(spec["lista"], spec.get("elegido"), spec.get("opciones"))
    assert "c-op" not in nuevo and "t-prob2" not in nuevo
    return nuevo


def estado_var(t, nombre):
    """La variable `sN` de un estado, por su nombre."""
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    return f"s{lista.index(nombre)}"


def rehacer_dialogos(t, specs, tel=False):
    empieza = '<div class="ap-velo"></div><div class="ap-hoja" role="dialog"' if tel else '<div class="w-oscuro">'
    for nombre, spec in specs.items():
        var = estado_var(t, nombre)
        i, j = bloque(t, var, empieza)
        cuerpo = adentro(t, i, j)
        nuevo = hoja_tel(cuerpo, spec) if tel else dialogo_compu(cuerpo, spec)
        t = t[:i] + sc(var, nuevo) + t[j:]
    return t


# ---------------------------------------------------------------------------------------------------------------- «Sin confirmar»
def burbuja(globo, caso):
    """El globo del formulario enviado, con lo de abajo de la segunda parte de la base (240)."""
    k = globo.index('<span class="pie')
    j = globo.rindex("</div>")
    return globo[:k] + pies(caso) + globo[j:]


def sumar_sin_confirmar(t, despues, en_cola, composer_de, globo_clase, composer_empieza):
    """Los tres estados de un envío «Sin confirmar»: el globo, sacado del de «En cola», y el compositor prendido de `composer_de`."""
    t, vs = sumar_estados(t, despues, SIN_CONFIRMAR)
    v_cola, v_desp, v_comp = estado_var(t, en_cola), estado_var(t, despues), estado_var(t, composer_de)
    i, j = bloque(t, v_cola, f'<div class="{globo_clase} sal">')
    globo = adentro(t, i, j)
    assert globo.count(f'<div class="{globo_clase} sal">') == 1
    globos = "".join(sc(vs[n], burbuja(globo, c)) for n, c in zip(SIN_CONFIRMAR, CASOS))
    i, j = bloque(t, v_desp, f'<div class="{globo_clase} sal">')
    t = t[:j] + globos + t[j:]
    i, j = bloque(t, v_comp, composer_empieza)
    comp = adentro(t, i, j)
    i, j = bloque(t, v_desp, composer_empieza)
    t = t[:j] + "".join(sc(vs[n], comp) for n in SIN_CONFIRMAR) + t[j:]
    return t, vs


def fila_sin_confirmar(t, vista):
    """La fila de la lista de chats: el punto y la palabra antes de la vista previa, en los tres estados (240)."""
    t = una(t, '<span class="l2"><span>{{vistaPrevia}}</span></span>',
            '<span class="l2"><sc-if value="{{filaSin}}" hint-placeholder-val="{{no}}"><span class="e14-l2"><span class="b2-est aten">Sin confirmar</span>'
            '<span>{{vistaPrevia}}</span></span></sc-if><sc-if value="{{filaComun}}" hint-placeholder-val="{{si}}"><span>{{vistaPrevia}}</span></sc-if></span>')
    lista = json.dumps(SIN_CONFIRMAR, ensure_ascii=False)
    t = con_var(t, "filaSin", f"{lista}.includes(e)")
    t = con_var(t, "filaComun", f"!{lista}.includes(e)")
    t = sumar_a_dicc(t, "vistaPrevia", {n: vista for n in SIN_CONFIRMAR})
    return sumar_a_dicc(t, "hora", {n: "27/09/2026, 10:31" for n in SIN_CONFIRMAR})


# ---------------------------------------------------------------------------------------------------------------- los tableros
VISITA = {"elegido": "Visita a cliente"}
ENTREGA = {"elegido": "Entrega de pedido"}
NADA = {"elegido": None, "apagar": True, "mensaje": SIN_ELEGIR}

INTERNOS = {
    "Elegir el formulario": dict(NADA, lista="pocas", opciones=TRES),
    "Elegir otro formulario": ENTREGA,
    "Lo escrito se conserva": ENTREGA,
    "Muchos formularios": dict(NADA, lista="muchas"),
    "Elegido en otra página": dict(VISITA, lista="otra pagina"),
    "Sin coincidencias": {"elegido": None, "lista": "sin coincidencias"},
    "Cargando formularios": {"elegido": None, "lista": "buscando"},
    "La lista no carga": {"elegido": None, "lista": "falla"},
    "Falta el mensaje": VISITA,
    "Mensaje muy largo": VISITA,
    "Enviando": VISITA,
    "Se cerró la ventana": dict(VISITA, hasta=False),
    "El formulario ya no está": dict(VISITA, error=YA_NO_ESTA),
    "Con catálogos": dict(VISITA, catalogos=CATALOGOS),
    "Preparando las opciones": VISITA,
    **{n: dict(VISITA, catalogos=c) for n, c in PROBLEMAS.items()},
    "No está publicado para este número": dict(VISITA, problema=NO_PUBLICADO),
}
INTERNOS_TEL = {
    "Elegir el formulario": dict(NADA, lista="pocas", opciones=TRES),
    "Elegir otro formulario": ENTREGA,
    "Lo escrito se conserva": ENTREGA,
    "Elegido en otra página": dict(VISITA, lista="otra pagina"),
    "Cargando formularios": {"elegido": None, "lista": "buscando"},
    "Falta el mensaje": VISITA,
    "Enviando": VISITA,
    "Se cerró la ventana": dict(VISITA, hasta=False),
    "El formulario ya no está": dict(VISITA, error=YA_NO_ESTA),
    "Con catálogos": dict(VISITA, catalogos=CATALOGOS),
    **{n: dict(VISITA, catalogos=PROBLEMAS[n]) for n in ("Más de 200 opciones", "Ninguna opción", "Catálogo que no se puede usar")},
    "No está publicado para este número": dict(VISITA, problema=NO_PUBLICADO),
}
CLIENTES = {
    "Elegir el formulario": dict(NADA, lista="pocas", opciones=DE_CLIENTES),
    "Enviando": ENTREGA,
    "No está publicado para este número": dict(ENTREGA, problema=NO_PUBLICADO),
}
CLIENTES_TEL = {
    "Elegir el formulario": dict(NADA, lista="pocas", opciones=DE_CLIENTES),
    "No está publicado para este número": dict(ENTREGA, problema=NO_PUBLICADO),
}
COMPOSER_COMPU = '<button type="button" class="o-nt"'
COMPOSER_TEL = '<div class="ap-escr">'


def wa_chats_formulario():
    t, nl = leer("WA-Chats-Formulario")
    t = rehacer_dialogos(con_titulo(t), INTERNOS)
    t, _ = sumar_sin_confirmar(t, "No se pudo mandar", "En cola", "Leído", "w-m", COMPOSER_COMPU)
    t = fila_sin_confirmar(t, "Vos: Formulario · Visita a cliente")
    escribir("WA-Chats-Formulario", con_css(t, CSS_COMPU), nl)


def wa_chats_formulario_cliente():
    t, nl = leer("WA-Chats-Formulario-Cliente")
    t = rehacer_dialogos(con_titulo(t), CLIENTES)
    t, _ = sumar_sin_confirmar(t, "Leído", "En cola", "Leído", "w-m", COMPOSER_COMPU)
    t = fila_sin_confirmar(t, "Vos: Formulario · Entrega de pedido")
    escribir("WA-Chats-Formulario-Cliente", con_css(t, CSS_COMPU), nl)


def m_wa_chats_formulario():
    t, nl = leer("M-WA-Chats-Formulario")
    t = rehacer_dialogos(con_titulo(t), INTERNOS_TEL, tel=True)
    t, _ = sumar_sin_confirmar(t, "No se pudo mandar", "En cola", "Menú abierto", "ap-m", COMPOSER_TEL)
    escribir("M-WA-Chats-Formulario", con_css(t, CSS_TEL), nl)


def m_wa_chats_formulario_cliente():
    t, nl = leer("M-WA-Chats-Formulario-Cliente")
    t = rehacer_dialogos(con_titulo(t), CLIENTES_TEL, tel=True)
    t, _ = sumar_sin_confirmar(t, "En cola", "En cola", "Menú abierto", "ap-m", COMPOSER_TEL)
    escribir("M-WA-Chats-Formulario-Cliente", con_css(t, CSS_TEL), nl)


if __name__ == "__main__":
    wa_chats_formulario()
    wa_chats_formulario_cliente()
    m_wa_chats_formulario()
    m_wa_chats_formulario_cliente()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
