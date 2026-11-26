"""La E18 (Fotos y documentos) con el traspaso 18, tanda 3 (2026-11-26): el editor, publicar, dar de baja, el visor y los archivos del
chat, redibujados en su lugar (spec `docs/plans/formularios/18-fotos-y-documentos.md`, «Se redibujan con el traspaso 18, tanda 3»):

- `FRM-Editor-18` y `M-FRM-Editor-18`: la forma del editor de la E14 (`e14_editor_1004.py`): las preguntas en columnas (#, Pregunta,
  Tipo, Obligatoria y ↑ ↓ ✎ 🗑) y, en el teléfono, cada pregunta una tarjeta con «Tipo» y «Obligatoria» nombrados (263). Una pregunta
  de foto dice «Foto, hasta 4» y la de documento «Documento, hasta 1»; «Obligatoria» sale del mínimo («Sí» con mínimo 1). Lo que se
  elige va en la pieza (262): «Para quién es», el tipo de respuesta y «De dónde sale la foto» («Cámara o galería» o «Solo cámara», que
  eran dos radios). «Sin almacenamiento» abre la pieza del tipo con Foto y Documento apagados y el motivo en su tooltip (43 y 211). La
  (i) de «Cuántas fotos» y «Cuántos documentos» dice el tope por archivo de la Configuración de Formularios con su número, 10 MB, y
  cuántos archivos pide el formulario (270). En el teléfono, la (i) se abre con un toque (211) y se suman a la lista las dos preguntas
  de archivo, que faltaban (269). Estados nuevos: «De dónde sale la foto» (la pieza abierta; en el teléfono, a pantalla completa) y
  «La (i) de Cuántas fotos».
- `FRM-Publicar-18` y `FRM-Dar-De-Baja-18`: el editor de atrás con esa misma forma y con sus preguntas de foto y documento (las de
  publicar suman 12 archivos, como dice su problema), y la vista previa en la pantalla 1 de 3. Los diálogos no tenían radios,
  segmentados ni listas: solo «Qué se publica» cuenta las 9 preguntas y nombra las cambiadas.
- `WA-Chats-Visor` y `M-WA-Chats-Visor`: al pie, el nombre, el tamaño y la fecha de la foto (la del mensaje, O21 y 194), cada dato en
  su lugar, nunca uno debajo del otro (263); en el teléfono, una tarjeta con «Tamaño» y «Fecha» nombrados, y «Descargar».
- `WA-Chats-Adjuntos` y `M-WA-Chats-Adjuntos`: un archivo que manda el operador sigue la ADR 0066 como un mensaje de texto
  (`base2_whatsapp_1004.pies`): «Sin confirmar» con su (i) y «Marcar como revisado», y revisado, «Lo revisó … · fecha» (240); «No se
  pudo mandar» lleva debajo su motivo, uno de los ocho de `base2_comun.MOTIVOS_WA` («WhatsApp rechazó el mensaje.»). En la compu, la
  fila de la lista de chats dice «Sin confirmar» antes de la vista previa, como en la E14. Las horas de los archivos que llegan pasan a
  después de los mensajes de las 10:50 (269). Estados nuevos: «Sin confirmar», «Sin confirmar: por qué» y «Revisado».

Escribe las medidas de antes de la escala en un bloque `<style data-e18="t3">`, que lo frena si ya está, y al final corre
`traspaso10_piezas_1004.py --tableros` con los ocho, que pone la escala de la compu. Para volver a correrlo, primero se restauran los
ocho (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
"""
import io
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e14_chats_formulario_1004 as e14c  # noqa: E402
import e14_editor_1004 as e14  # noqa: E402
from base2_whatsapp_1004 import CSS_CHAT, pies  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-e18="t3"'
SUFIJO = " · para aprobar"
SVG = e14.SVG
TABLEROS = ["FRM-Editor-18", "M-FRM-Editor-18", "FRM-Publicar-18", "FRM-Dar-De-Baja-18", "WA-Chats-Visor", "M-WA-Chats-Visor",
            "WA-Chats-Adjuntos", "M-WA-Chats-Adjuntos"]

# ---------------------------------------------------------------------------------------------------------------- los datos
TIPOS = e14.TIPOS + ["Foto", "Documento"]
SIN_ALMACEN = "Falta configurar dónde se guardan los archivos."
TOPE_MB = 10  # el de la Configuración de Formularios de Grupo Delta (`FRM-Config-Org`)
FOTO_I = (f"Con mínimo 1, la pregunta es obligatoria; con 0, es opcional. Cada foto, hasta {TOPE_MB} MB: lo fija la Configuración de "
          "Formularios. En todo el formulario, hasta 10 archivos por respuesta: este pide hasta 5.")
DOC_I = (f"PDF, Excel, Word o imágenes JPEG y PNG. Sin CSV. Con mínimo 1, la pregunta es obligatoria; con 0, es opcional. Cada documento, "
         f"hasta {TOPE_MB} MB: lo fija la Configuración de Formularios. En todo el formulario, hasta 10 archivos por respuesta: este pide hasta 5.")
ORIGENES = [("Cámara o galería", "Saca una foto o elige una que ya tiene."), ("Solo cámara", "Saca la foto en el momento.")]
FOTO_FECHA = "13/10/2026, 11:04"  # la del mensaje de la respuesta en el chat
RECHAZO = next(i for i, (c, _) in enumerate(b2.MOTIVOS_WA) if c == "WhatsApp.Send.Rejected")
SIN_CONFIRMAR = ["Sin confirmar", "Sin confirmar: por qué", "Revisado"]
CASOS = ["sin", "sin-i", "revisado"]

# ---------------------------------------------------------------------------------------------------------------- estilos
CSS_EDITOR = e14.CSS_COMPU + """
/* E18 · El origen de la foto y «Cuántas fotos», cada uno en su mitad; la (i) con el tope de la configuración (262 y 270). */
.q-ed .w-cmp .rt .b2-i { vertical-align: -2px; }
.w-caja:has(.b2-i .acc-tip) { overflow: visible !important; }
"""
CSS_EDITOR_TEL = e14.CSS_TEL + """
/* E18 · La (i) de «Cuántas fotos» se abre con un toque, como tooltip sobre el control (211). */
.ap-hoja .hb:has(.acc-tip) { overflow: visible; }
.ap-hoja .rt .b2-i { vertical-align: -3px; }
"""
CSS_VISOR = """
/* E18 · Al pie del visor, el nombre, el tamaño y la fecha de la foto, cada uno en su lugar (O21, 194 y 263). */
.vz-dat { display: flex; align-items: center; gap: 12px; min-width: 0; font-size: 14px; color: var(--t2); }
.vz-dat b { color: var(--t1); font-weight: 600; overflow-wrap: anywhere; }
.vz-dat > * + * { padding-left: 12px; border-left: 1px solid var(--borde); white-space: nowrap; }
"""
CSS_VISOR_TEL = """
/* E18 · Al pie del visor, una tarjeta: el nombre y, nombrados, el tamaño y la fecha de la foto (O21 y 263). */
.tv-pie { align-items: flex-start !important; }
.tv-dat { flex: 1; min-width: 0; }
.tv-dat .nm { display: block; font-size: 14px; font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.tv-dat .dl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 18px; margin-top: 6px; }
.tv-dat .k { display: block; font-size: 12.5px; opacity: 0.72; }
.tv-dat .v { display: block; font-size: 14px; }
"""
CSS_ADJ = b2.css() + CSS_CHAT + """
/* E18 · Un archivo que manda el operador (0066): «Sin confirmar» con su revisión y «No se pudo mandar» con su motivo debajo. */
.w-m .pie.ta-fallo { color: var(--peligro); }
.w-m.sal:has(.acc-tip) { position: relative; z-index: 5; }
/* E18 · La fila de la lista de chats con un archivo «Sin confirmar» (240): el punto y la palabra, antes de la vista previa. */
.w-conv .l2 .e18-l2 { display: flex; align-items: center; gap: 8px; min-width: 0; }
.w-conv .l2 .e18-l2 > .b2-est { flex: none; overflow: visible; color: var(--t2); }
"""
CSS_ADJ_TEL = b2.css(True) + CSS_CHAT + """
/* E18 · Un archivo que manda el operador (0066): «Sin confirmar» con su revisión y «No se pudo mandar» con su motivo debajo. */
.ap-m .pie.ta-fallo { color: var(--peligro); }
.ap-m.sal:has(.acc-tip) { position: relative; z-index: 5; }
"""


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    t = s.replace("\r\n", "\n")
    assert MARCA not in t, f"{nombre} ya tiene el bloque de la E18: restauralo antes de volver a correr"
    return t, nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def con_css(t, css):
    m = re.search(r"<title>(.*?)</title>", t)
    if not m.group(1).endswith(SUFIJO):
        t = t[:m.start(1)] + m.group(1) + SUFIJO + t[m.end(1):]
    return e14.una(t, "</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


def tipo_y_obligatoria(desc):
    """Como el de la E14, con las preguntas de archivo: «Foto · solo cámara · de 1 a 4 · Obligatoria» da «Foto, hasta 4» y «Sí»."""
    partes = desc.split(" · ")
    if partes[0] in ("Foto", "Documento"):
        ob = {"Obligatoria": "Sí", "Opcional": "No"}[partes[-1]]
        tope = next(p.split()[-1] for p in partes[1:-1] if re.fullmatch(r"(?:de \d+ a|hasta) \d+", p))
        return f"{partes[0]}, hasta {tope}", ob
    return TIPO_E14(desc)


TIPO_E14 = e14.tipo_y_obligatoria
e14.tipo_y_obligatoria = tipo_y_obligatoria  # filas_compu y tarjetas_tel de la E14 lo leen del módulo


def aria_de(valor):
    if valor in e14.PARA_QUIEN:
        return "Para quién es"
    assert valor in TIPOS, valor
    return "Tipo de respuesta"


def campos_cerrados(cuerpo):
    """Cada `ct sel` que queda (Para quién es y el tipo de respuesta), en la pieza cerrada con lo elegido (262)."""
    cuerpo, n = re.subn(r'<div class="ct sel">([^<]*)' + SVG + r'</div>', lambda m: b2.campo(m.group(1), aria=aria_de(m.group(1))),
                        cuerpo, flags=re.S)
    assert "ct sel" not in cuerpo, n
    return cuerpo, n


def origen(abierto=False):
    extra = b2.lista([b2.op(n, d, elegida=n == "Solo cámara", activa=n == "Solo cámara") for n, d in ORIGENES]) if abierto else ""
    return b2.campo("Solo cámara", abierto=abierto, aria="De dónde sale la foto", extra=extra)


def fila_de(fila_motivo, num, nombre, desc):
    """Una fila de pregunta nueva, sacada de la de «Motivo» (con sus ↑ ↓ ✎ 🗑), en el formato de antes de la E14."""
    assert fila_motivo.count("Motivo") == 5, fila_motivo.count("Motivo")
    f = fila_motivo.replace("Motivo", nombre)
    f, n = re.subn(r'(<span class="num">)5(</span>)', rf"\g<1>{num}\2", f, count=1)
    assert n == 1
    f, n = re.subn(r"(<b>%s</b><span>)[^<]*(</span>)" % re.escape(nombre), rf"\g<1>{desc}\2", f, count=1)
    assert n == 1
    return f


def con_archivos(cuerpo, clase, fotos, remito):
    """Suma «Fotos de la visita» (6) y «Remito firmado» (7) después de «Motivo», y renumera «Fallas» y «Observaciones» (269)."""
    datos = 'dato' if clase == "q-it" else "tx"
    i = cuerpo.index(f'<div class="{clase}"><span class="num">5</span><span class="{datos}"><b>Motivo</b>')
    j = b2.fin_div(cuerpo, i)
    nuevas = fila_de(cuerpo[i:j], 6, "Fotos de la visita", fotos) + fila_de(cuerpo[i:j], 7, "Remito firmado", remito)
    cuerpo = cuerpo[:j] + nuevas + cuerpo[j:]
    for viejo, nuevo, nombre in ((6, 8, "Fallas"), (7, 9, "Observaciones")):
        cuerpo = e14.una(cuerpo, f'<span class="num">{viejo}</span><span class="{datos}"><b>{nombre}</b>',
                         f'<span class="num">{nuevo}</span><span class="{datos}"><b>{nombre}</b>')
    return cuerpo


# ---------------------------------------------------------------------------------------------------------------- el editor
def frm_editor_18():
    t, nl = leer("FRM-Editor-18")
    t = con_css(t, CSS_EDITOR)
    cab, cuerpo, guion = e14.partir(t)
    cuerpo = e14.filas_compu(cuerpo)
    # «Sin almacenamiento»: la pieza del tipo abierta, con Foto y Documento apagados y el motivo de Foto a la vista (43 y 211).
    abierta = (r'<div class="w-cmp q-cat"><span class="rt">Tipo de respuesta</span><div class="ct sel abierto">Texto corto' + SVG
               + r'</div><div class="q-tipomn" role="listbox">.*?</div></div>')
    lista = b2.lista([b2.op(n, elegida=n == "Texto corto", activa=n == "Texto corto",
                            apagada=SIN_ALMACEN if n in ("Foto", "Documento") else None, tip_abierto=n == "Foto") for n in TIPOS])
    cuerpo, n = re.subn(abierta, lambda m: '<div class="w-cmp"><span class="rt">Tipo de respuesta</span>'
                        + b2.campo("Texto corto", abierto=True, aria="Tipo de respuesta", extra=lista) + "</div>", cuerpo, flags=re.S)
    assert n == 1 and "q-tipomn" not in cuerpo, n
    # «De dónde sale la foto»: los dos radios pasan a la pieza, en su mitad, junto a «Cuántas fotos» (262).
    radios = (r'<div class="w-cmp ancho"><span class="rt">De dónde sale la foto</span><div class="q-src" role="radiogroup">'
              r'(?:<div class="op[^"]*" role="radio" aria-checked="(?:true|false)"><span class="rd"></span><span class="tx">[^<]*</span></div>)+'
              r'</div></div>')
    cuerpo, n = re.subn(radios, lambda m: '<div class="w-cmp"><span class="rt">De dónde sale la foto</span>' + origen() + "</div>",
                        cuerpo, flags=re.S)
    assert n == 1 and "q-src" not in cuerpo, n
    # La (i) de «Cuántas fotos» y «Cuántos documentos», con el tope de la configuración (270).
    for rotulo, texto, medio in (("Cuántas fotos", FOTO_I, True), ("Cuántos documentos", DOC_I, False)):
        patron = (r'<div class="w-cmp ancho"><span class="rt">%s<span class="f-i" tabindex="0" role="img" aria-label="[^"]*" title="[^"]*">'
                  % rotulo + SVG + "</span></span>")
        nuevo = f'<div class="w-cmp{"" if medio else " ancho"}"><span class="rt">{rotulo}{b2.info(texto)}</span>'
        cuerpo, n = re.subn(patron, lambda m: nuevo, cuerpo, flags=re.S)
        assert n == 1, (rotulo, n)
    cuerpo, n = campos_cerrados(cuerpo)
    print("piezas cerradas del editor:", n)
    t = cab + cuerpo + guion

    # Dos estados nuevos, copias de «Pregunta de foto»: la pieza del origen abierta y la (i) de «Cuántas fotos» abierta.
    s_foto, s_ult = e14.s_de(t, "Pregunta de foto"), e14.s_de(t, "Sin almacenamiento")
    t, sv = e14.sumar_estados(t, [("Pregunta de foto", "De dónde sale la foto"), ("De dónde sale la foto", "La (i) de Cuántas fotos")])
    (b, bf), (c, cf) = e14.sc_ifs(t, s_foto)[:2]
    bandas, cuerpos = "", ""
    for nombre, viejo, nuevo in (("De dónde sale la foto", origen(), origen(True)),
                                 ("La (i) de Cuántas fotos", b2.info(FOTO_I), b2.info(FOTO_I, abierto=True))):
        bandas += e14.renombrar(t[b:bf], s_foto, sv[nombre])
        cuerpos += e14.una(e14.renombrar(t[c:cf], s_foto, sv[nombre]), viejo, nuevo)
    (ub, ubf), (uc, ucf) = e14.sc_ifs(t, s_ult)[:2]
    t = t[:ubf] + bandas + t[ubf:ucf] + cuerpos + t[ucf:]
    escribir("FRM-Editor-18", t, nl)


def m_frm_editor_18():
    t, nl = leer("M-FRM-Editor-18")
    t = con_css(t, CSS_EDITOR_TEL)
    cab, cuerpo, guion = e14.partir(t)
    cuerpo = con_archivos(cuerpo, "q-row", "Foto · solo cámara · de 1 a 4 · Obligatoria", "Documento · hasta 1 · Opcional")
    cuerpo = e14.tarjetas_tel(cuerpo)
    # «De dónde sale la foto», en la pieza (262), y «Cuántas fotos» con su (i), que se abre con un toque (211 y 270).
    radios = (r'<div class="ap-cmp"><span class="rt"><span>De dónde sale la foto</span></span></div><span class="t-opc">Cámara o galería'
              r'<span class="d"></span></span><span class="t-opc on">Solo cámara<span class="d">' + SVG + r'</span></span>')
    cuerpo, n = re.subn(radios, lambda m: '<div class="ap-cmp"><span class="rt"><span>De dónde sale la foto</span></span>' + origen()
                        + "</div>", cuerpo, flags=re.S)
    assert n == 1 and "t-opc" not in cuerpo, n
    maximo = (r'<span>Máximo</span><button type="button" class="ap-i" aria-label="Por qué" style="[^"]*" title="[^"]*">' + SVG
              + r'</button></span>')
    cuerpo, n = re.subn(maximo, "<span>Máximo</span></span>", cuerpo, flags=re.S)
    assert n == 1, n
    rango = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;"><div class="ap-cmp"><span class="rt"><span>Mínimo</span>'
    cuerpo = e14.una(cuerpo, rango, f'<div class="ap-cmp"><span class="rt"><span>Cuántas fotos{b2.info(FOTO_I)}</span></span></div>' + rango)
    cuerpo, n = campos_cerrados(cuerpo)
    print("piezas cerradas del editor del teléfono:", n)
    t = cab + cuerpo + guion

    # Dos estados nuevos, copias de «Pregunta de foto»: la pieza del origen a pantalla completa y la (i) abierta.
    s_foto = e14.s_de(t, "Pregunta de foto")
    t, sv = e14.sumar_estados(t, [("Pregunta de foto", "De dónde sale la foto"), ("De dónde sale la foto", "La (i) de Cuántas fotos")])
    (c, cf), (h, hf) = e14.sc_ifs(t, s_foto)[:2]
    assert t[h:hf].count('<div class="ap-hoja"') == 1
    pieza = b2.pk_tel("De dónde sale la foto", [(n, d, n == "Solo cámara", None) for n, d in ORIGENES])
    cuerpos = "".join(e14.renombrar(t[c:cf], s_foto, sv[n]) for n in sv)
    hojas = (e14.renombrar(t[h:hf], s_foto, sv["De dónde sale la foto"])
             + f'<sc-if value="{{{{{sv["De dónde sale la foto"]}}}}}" hint-placeholder-val="{{{{no}}}}">{pieza}</sc-if>'
             + e14.una(e14.renombrar(t[h:hf], s_foto, sv["La (i) de Cuántas fotos"]), b2.info(FOTO_I), b2.info(FOTO_I, abierto=True)))
    t = t[:cf] + cuerpos + t[cf:hf] + hojas + t[hf:]
    escribir("M-FRM-Editor-18", t, nl)


# ---------------------------------------------------------------------------------------------------------------- publicar y dar de baja
PV_TIT = ('<div class="pv-tit"><span class="pv-tit2">Así lo ve quien lo recibe <span class="pv-pant">· pantalla 1 de 3</span>'
          '<span class="f-i" tabindex="0" role="img" aria-label="Cada pregunta de foto o documento abre su propia pantalla. Las preguntas '
          'siguientes pueden compartirla." title="Cada pregunta de foto o documento abre su propia pantalla. Las preguntas siguientes pueden '
          'compartirla.">' + b2.SVG_I + "</span></span></div>")


def editor_de_atras(nombre, fotos, remito, dialogo=None):
    """El editor de atrás de un diálogo, con la forma de `FRM-Editor-18`: sus preguntas de archivo, en columnas y con la pieza."""
    t, nl = leer(nombre)
    t = con_css(t, e14.CSS_COMPU)
    cab, cuerpo, guion = e14.partir(t)
    cuerpo = e14.filas_compu(con_archivos(cuerpo, "q-it", fotos, remito))
    cuerpo, n = campos_cerrados(cuerpo)
    # La vista previa: con una pregunta de foto después de «Motivo», la primera pantalla termina ahí y sigue con «Continuar».
    resto = (r'<div class="pv-c">Fallas<span class="pv-ay">Elegí hasta 3</span><div class="pv-ck">(?:<span><i></i>[^<]*</span>)+</div></div>'
             r'<div class="pv-c">Observaciones \(opcional\)<div class="pv-in area"></div></div>')
    cuerpo, n = re.subn(resto, "", cuerpo)
    assert n == 1, n
    cuerpo = e14.una(cuerpo, '<div class="pv-bt">Enviar</div>', '<div class="pv-bt">Continuar</div>')
    cuerpo = e14.una(cuerpo, '<div class="pv"><div class="tel">', f'<div class="pv">{PV_TIT}<div class="tel">')
    for viejo, nuevo in (dialogo or {}).items():
        cuerpo = e14.una(cuerpo, viejo, nuevo)
    assert "radiogroup" not in cuerpo and "<select" not in cuerpo and 'role="radio"' not in cuerpo
    escribir(nombre, cab + cuerpo + guion, nl)


def frm_publicar_18():
    editor_de_atras("FRM-Publicar-18", "Foto · solo cámara · de 1 a 8 · Obligatoria", "Documento · hasta 4 · Opcional", {
        '<span class="k">Preguntas</span><span>7</span>': '<span class="k">Preguntas</span><span>9</span>',
        '<span class="k">Cambiadas</span><span>Motivo y Fallas</span>':
            '<span class="k">Cambiadas</span><span>Motivo, Fotos de la visita, Remito firmado y Fallas</span>'})


def frm_dar_de_baja_18():
    editor_de_atras("FRM-Dar-De-Baja-18", "Foto · solo cámara · de 1 a 4 · Obligatoria", "Documento · hasta 1 · Opcional")


# ---------------------------------------------------------------------------------------------------------------- el visor
def wa_chats_visor():
    t, nl = leer("WA-Chats-Visor")
    t = con_css(t, CSS_VISOR)
    t, n = re.subn(r'<div class="vz-pie"><span class="t">([^<]+)<small>([^<]+)</small></span>',
                   lambda m: f'<div class="vz-pie"><span class="vz-dat"><b>{m.group(1)}</b><span>{m.group(2)}</span>'
                             f'<span title="Fecha del mensaje">{FOTO_FECHA}</span></span>', t)
    assert n == 3 and '<span class="t">frente-local.jpg<small>' not in t, n
    escribir("WA-Chats-Visor", t, nl)


def m_wa_chats_visor():
    t, nl = leer("M-WA-Chats-Visor")
    t = con_css(t, CSS_VISOR_TEL)
    t, n = re.subn(r'<div class="tv-pie"><span class="t">([^<]+)<small>([^<]+)</small></span>',
                   lambda m: f'<div class="tv-pie"><div class="tv-dat"><span class="nm">{m.group(1)}</span><span class="dl">'
                             f'<span class="c"><span class="k">Tamaño</span><span class="v">{m.group(2)}</span></span>'
                             f'<span class="c"><span class="k">Fecha</span><span class="v">{FOTO_FECHA}</span></span></span></div>', t)
    assert n == 1, n
    escribir("M-WA-Chats-Visor", t, nl)


# ---------------------------------------------------------------------------------------------------------------- los archivos del chat
HORAS = {"10:42": "10:51", "10:43": "10:52", "10:44": "10:53", "10:45": "10:54"}


def horas_en_orden(t):
    """Los archivos que llegan, después del «Hola, Martina» de las 10:50, y el que sale, a las 10:56 (269)."""
    t, n = re.subn(r'<span class="pie">(10:4[2-5])</span>', lambda m: f'<span class="pie">{HORAS[m.group(1)]}</span>', t)
    assert n > 0
    t = t.replace("Lucía Fernández · 10:52 · Entregado", "Lucía Fernández · 10:56 · Entregado")
    return t.replace('"13/10/2026, 10:45"', '"13/10/2026, 10:54"').replace('"13/10/2026, 10:52"', '"13/10/2026, 10:56"')


def con_pie_ultimo(bloque, clase, caso):
    """Lo de abajo del último archivo que salió (`w-m sal` o `ap-m sal`), como un mensaje de texto (`base2_whatsapp_1004.pies`)."""
    i = bloque.rindex(f'<div class="{clase} sal">')
    j = bloque.index("</div>", i)
    k = bloque.index('<span class="pie', i)
    assert k < j
    return bloque[:k] + pies(caso) + bloque[j:]


def sin_confirmar(t, despues, de, clase, composer):
    """Los tres estados de un archivo «Sin confirmar» (240 y 0066), con los mensajes y el compositor del estado `de`."""
    v_de, v_desp = e14c.estado_var(t, de), e14c.estado_var(t, despues)  # antes de sumar: los de antes conservan su sN
    t, vs = e14c.sumar_estados(t, despues, SIN_CONFIRMAR)
    i, j = e14c.bloque(t, v_de, f'<div class="{clase} ent">')
    msjs = e14c.adentro(t, i, j)
    nuevos = "".join(e14c.sc(vs[n], con_pie_ultimo(msjs, clase, c)) for n, c in zip(SIN_CONFIRMAR, CASOS))
    i, j = e14c.bloque(t, v_desp, f'<div class="{clase} ent">')
    t = t[:j] + nuevos + t[j:]
    i, j = e14c.bloque(t, v_de, composer)
    comp = e14c.adentro(t, i, j)
    i, j = e14c.bloque(t, v_desp, composer)
    return t[:j] + "".join(e14c.sc(vs[n], comp) for n in SIN_CONFIRMAR) + t[j:]


def no_se_pudo(t, estado, viejo):
    """«No se pudo mandar» con su motivo debajo, uno de los ocho de `MOTIVOS_WA` (0066 §3)."""
    var = e14c.estado_var(t, estado)
    i = t.index(f'<sc-if value="{{{{{var}}}}}"')
    j = e14c.cierre(t, i, "sc-if")
    bloque, n = re.subn(viejo, lambda m: pies(RECHAZO), t[i:j], flags=re.S)
    assert n == 1, n
    return t[:i] + bloque + t[j:]


def fila_sin_confirmar(t, vista, hora):
    """La fila de la lista de chats: el punto y la palabra antes de la vista previa, en los tres estados (240, como la E14)."""
    t = e14.una(t, '<span class="l2"><span>{{vistaPrevia}}</span></span>',
                '<span class="l2"><sc-if value="{{filaSin}}" hint-placeholder-val="{{no}}"><span class="e18-l2"><span class="b2-est aten">'
                'Sin confirmar</span><span>{{vistaPrevia}}</span></span></sc-if><sc-if value="{{filaComun}}" hint-placeholder-val="{{si}}">'
                '<span>{{vistaPrevia}}</span></sc-if></span>')
    import json
    lista = json.dumps(SIN_CONFIRMAR, ensure_ascii=False)
    t = e14c.con_var(t, "filaSin", f"{lista}.includes(e)")
    t = e14c.con_var(t, "filaComun", f"!{lista}.includes(e)")
    t = e14c.sumar_a_dicc(t, "vistaPrevia", {n: vista for n in SIN_CONFIRMAR})
    return e14c.sumar_a_dicc(t, "hora", {n: hora for n in SIN_CONFIRMAR})


def wa_chats_adjuntos():
    t, nl = leer("WA-Chats-Adjuntos")
    t = horas_en_orden(con_css(t, CSS_ADJ))
    t = no_se_pudo(t, "No se pudo", r'<span class="pie mal">No se pudo mandar<span class="f-i"[^>]*>' + SVG + "</span></span>")
    t = sin_confirmar(t, "Enviado", "Enviado", "w-m", '<button type="button" class="o-nt"')
    t = fila_sin_confirmar(t, "Vos: presupuesto-octubre.pdf", "13/10/2026, 10:56")
    assert t.count('class="b2-lnk">Marcar como revisado') == 2 and t.count(b2.REVISO) == 1
    escribir("WA-Chats-Adjuntos", t, nl)


def m_wa_chats_adjuntos():
    t, nl = leer("M-WA-Chats-Adjuntos")
    t = horas_en_orden(con_css(t, CSS_ADJ_TEL))
    t = no_se_pudo(t, "No se pudo", r'<span class="pie mal">No se pudo mandar</span>')
    t = sin_confirmar(t, "Enviando", "No se pudo", "ap-m", '<div class="ap-escr">')
    assert t.count('class="b2-lnk">Marcar como revisado') == 2 and t.count(b2.REVISO) == 1
    assert t.count(b2.MOTIVOS_WA[RECHAZO][1]) == 1
    escribir("M-WA-Chats-Adjuntos", t, nl)


if __name__ == "__main__":
    frm_editor_18()
    m_frm_editor_18()
    frm_publicar_18()
    frm_dar_de_baja_18()
    wa_chats_visor()
    m_wa_chats_visor()
    wa_chats_adjuntos()
    m_wa_chats_adjuntos()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
