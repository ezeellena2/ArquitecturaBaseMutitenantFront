"""«Nueva plantilla» de WhatsApp en la E21 (decisión 201 de la hoja de ruta): debajo de «Tipo», «Encabezado», con «Sin
encabezado» (el valor de entrada) o «Documento (el PDF)», en un segmentado como el de «Tipo» (Criterio · Formularios), con su (i):
la app arma el PDF de ejemplo que pide Meta, así que no se sube nada. Debajo del texto, «Así llega» (149) muestra el mensaje con los
ejemplos y, con «Documento (el PDF)», el documento arriba y después el cuerpo.

El ejemplo es «Comprobante», de Grupo Delta, de tipo Utilidad: «Aprobaron {{1}}. Te mandamos el comprobante.», con el ejemplo
VIS-000130, y el documento VIS-000130.pdf. «Tipo» ofrece Utilidad y Marketing, y Meta admite el documento en los dos (no en
Autenticación, que no se ofrece): no hay opción apagada.

Parte de `WA-Plantilla-Nueva` y `M-WA-Plantilla-Nueva` (E11) y escribe `WA-Plantilla-Nueva-21` y `M-WA-Plantilla-Nueva-21`: los
cinco estados de la E11 con «Sin encabezado», más «Comprobante, con el PDF» (el de entrada) y «Comprobante, sin encabezado». En la
compu, el menú y la campana son los de la E21. Suma los dos al final de las filas de la etapa 21 en `canvas.json` (página
«Organización · Formularios»).

Corre después de los generadores de la E11 y de la 21. Después va
`traspaso10_piezas_1004.py --tableros WA-Plantilla-Nueva-21,M-WA-Plantilla-Nueva-21`, que pone las piezas y la escala de la compu
(180) también en el CSS nuevo, escrito acá con las medidas de antes. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

COMPU, TEL = "WA-Plantilla-Nueva-21", "M-WA-Plantilla-Nueva-21"
TITULOS = {COMPU: "WhatsApp · nueva plantilla con «Encabezado» · etapa 21", TEL: "Nueva plantilla con «Encabezado» · teléfono · etapa 21"}
FILAS = {COMPU: 27626, TEL: 29346}  # las de la etapa 21 en la página de Formularios
DESPUES = {COMPU: "WA-Chats-Respuesta-21.dc.html", TEL: "M-WA-Conversacion-Respuesta-21.dc.html"}  # en `order`

AYUDA = ("Con «Documento (el PDF)», el mensaje lleva arriba el PDF de una respuesta, como un comprobante. "
         "El PDF de ejemplo que pide Meta lo armamos nosotros.")

# Los estados, en el orden del selector: los dos nuevos primero y, después, los cinco de la E11
ESTADOS = ["Comprobante, con el PDF", "Comprobante, sin encabezado", "Nueva plantilla", "Faltan datos", "Datos salteados",
           "Sin nombre ni texto", "Duplicada: «Pedido listo_2»"]
E11 = ESTADOS[2:]
CON_PDF = {"Comprobante, con el PDF"}

# «{{1}}» se escribe con la primera llave en un span, para que el lienzo no la tome como una variable (como en la E11)
PEDIDO = "Hola <span>{</span>{1}}, tu pedido <span>{</span>{2}} está listo. Podés retirarlo en el local de 9 a 18."
COMPROBANTE = "Aprobaron <span>{</span>{1}}. Te mandamos el comprobante."
# Lo que muestra «Así llega»: el texto con los ejemplos; un dato sin ejemplo queda como está. Sin texto, no va.
LLEGA = {
    "Comprobante, con el PDF": "Aprobaron VIS-000130. Te mandamos el comprobante.",
    "Comprobante, sin encabezado": "Aprobaron VIS-000130. Te mandamos el comprobante.",
    "Nueva plantilla": PEDIDO,
    "Faltan datos": PEDIDO,
    "Datos salteados": "Hola Martina, tu pedido 1038 está listo. Podés retirarlo en el local de 9 a 18.",
    "Sin nombre ni texto": None,
    "Duplicada: «Pedido listo_2»": "Hola Martina, tu pedido 1038 está listo. Podés retirarlo en el local de 9 a 18.",
}
DOCUMENTO = "VIS-000130.pdf"

SVG_I_COMPU = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/></svg>')
SVG_I_TEL = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
             'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/></svg>')

# «Así llega» es la pieza de las reglas (`rg5-llega`, 149); el documento, la tarjeta del PDF de los avisos del chat (`av-card .pdf`).
# Las medidas son las de antes de la escala: la pasada de las piezas las achica en la compu.
CSS_COMUN = """.rg5-llega { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 10px; padding: 8px 10px; border-radius: 8px; background: var(--s2); font-size: @LETRA@; }
.rg5-llega .k { color: var(--t2); font-weight: 600; }
.rg5-llega .v { white-space: pre-wrap; overflow-wrap: anywhere; color: var(--t1); }
.rg5-llega .v.e21-con-doc { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.e21-doc { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; border: 1px solid var(--borde); border-radius: 8px; background: #fff; font-weight: 600; }
.e21-doc .pdf { width: 26px; height: 30px; border-radius: 4px; background: oklch(0.55 0.18 25); color: #fff; font-size: 9px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
"""
CSS_COMPU = ("/* E21 · «Encabezado» con su (i), y «Así llega» con el documento arriba (201 y 149). */\n"
             ".f-i { display: inline-flex; vertical-align: middle; margin-left: 4px; color: var(--t3); cursor: help; }\n"
             + CSS_COMUN.replace("@LETRA@", "13px"))
CSS_TEL = ("/* E21 · «Encabezado» con su (i), y «Así llega» con el documento arriba (201 y 149). */\n"
           ".ap-i.neu { color: var(--t3); }\n"
           + CSS_COMUN.replace("@LETRA@", "14px"))
MARCA = 'data-e21="encabezado"'


def segmentado(clase, doc):
    sin, con = ("", ' class="on"') if doc else (' class="on"', "")
    return f'<div class="{clase}"><span{sin}>Sin encabezado</span><span{con}>Documento (el PDF)</span></div>'


def llega(texto, doc, compu):
    if doc:
        v = (f'<span class="v e21-con-doc"><span class="e21-doc"><span class="pdf">PDF</span><span class="t">{DOCUMENTO}</span></span>'
             f'<span>{texto}</span></span>')
    else:
        v = f'<span class="v">{texto}</span>'
    estilo = ' style="grid-column: 1 / -1;"' if compu else ""
    return f'<div class="rg5-llega"{estilo}><span class="k">Así llega</span>{v}</div>'


def una_vez(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:120])
    return t.replace(viejo, nuevo)


def bloques(t):
    """Los `sc-if` de los estados, en orden: (inicio, fin, clave, contenido). Ninguno lleva otro adentro."""
    out = [(m.start(), m.end(), m.group(1), m.group(2))
           for m in re.finditer(r'<sc-if value="\{\{(e\d)\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">(.*?)</sc-if>', t, re.S)]
    assert len(out) == t.count("<sc-if"), "hay un sc-if que no es de un estado"
    assert all("<sc-if" not in b[3] for b in out)
    return out


def sc_if(i, cuerpo):
    return '<sc-if value="{{e%d}}" hint-placeholder-val="{{%s}}">%s</sc-if>' % (i, "si" if i == 0 else "no", cuerpo)


def reemplazar_grupo(t, grupo, cuerpos):
    """Cambia los bloques de un grupo (seguidos, de e0 a e4) por un bloque por estado."""
    assert [b[2] for b in grupo] == [f"e{k}" for k in range(len(E11))]
    assert all(grupo[k][1] == grupo[k + 1][0] for k in range(len(grupo) - 1)), "los estados no están seguidos"
    nuevo = "".join(sc_if(i, c) for i, c in enumerate(cuerpos))
    return t[:grupo[0][0]] + nuevo + t[grupo[-1][1]:]


def con_estados(t):
    """El selector y `renderVals` con los siete estados; entra «Comprobante, con el PDF»."""
    viejo = re.search(r"data-props='([^']+)'", t).group(1)
    props = json.loads(viejo)
    assert json.dumps(props, ensure_ascii=False, separators=(",", ":")) == viejo
    assert props["estado"]["options"] == E11, props["estado"]["options"]
    props["estado"]["options"], props["estado"]["default"] = ESTADOS, ESTADOS[0]
    t = una_vez(t, viejo, json.dumps(props, ensure_ascii=False, separators=(",", ":")))
    m = re.search(r'    const e = this\.props\.estado \?\? "Nueva plantilla";\n\n    return \{\n      si: true,\n      no: false,\n(?:      e\d: e === "[^"]*",\n)+', t)
    assert m, "renderVals"
    lineas = "".join(f'      e{i}: e === "{e}",\n' for i, e in enumerate(ESTADOS))
    return t[:m.start()] + f'    const e = this.props.estado ?? "{ESTADOS[0]}";\n\n    return {{\n      si: true,\n      no: false,\n' + lineas + t[m.end():]


def con_css(t, css):
    t = re.sub(r'<style data-e21="encabezado">.*?</style>\n?', "", t, flags=re.S)
    return una_vez(t, "</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


# ---------------------------------------------------------------------------------------------------------------- la compu
TIPO_COMPU = ('<div class="w-cmp"><span class="rt">Tipo <span style="color: var(--peligro);">*</span></span><div class="o-seg">'
              '<span class="on">Utilidad</span><span>Marketing</span></div></div>')
ENCABEZADO_COMPU = ('<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Encabezado <span style="color: var(--peligro);">*</span>'
                    f'<span class="f-i" tabindex="0" role="img" aria-label="{AYUDA}" title="{AYUDA}">{SVG_I_COMPU}</span></span>@SEG@</div>')


def dialogo_compu(d, estado):
    doc = estado in CON_PDF
    d = una_vez(d, TIPO_COMPU, TIPO_COMPU + ENCABEZADO_COMPU.replace("@SEG@", segmentado("o-seg", doc)))
    if LLEGA[estado] is not None:
        # Debajo del texto y de sus botones, como en las reglas: el `o-datos` cierra y, enseguida, el campo «Texto»
        i = d.index('<div class="o-datos">')
        fin = d.index("</div></div>", i) + len("</div></div>")
        assert "<div" not in d[i + 1:fin - len("</div></div>")]
        d = d[:fin] + llega(LLEGA[estado], doc, True) + d[fin:]
    return d


def comprobante_compu(d):
    """El diálogo de «Nueva plantilla» de la E11 con «Comprobante»: un dato, «número», con su ejemplo."""
    d = una_vez(d, '<div class="ct">Pedido listo</div>', '<div class="ct">Comprobante</div>')
    d = una_vez(d, f'<div class="ct area">{PEDIDO}</div>', f'<div class="ct area">{COMPROBANTE}</div>')
    i, fin = d.index('<div class="w-cmp"><span class="rt">Dato 1 '), d.index('</div><div class="df">')
    datos = ('<div class="w-cmp"><span class="rt">Dato 1 <span style="color: var(--peligro);">*</span></span><div class="ct">número</div></div>'
             '<div class="w-cmp"><span class="rt">Ejemplo del dato 1 <span style="color: var(--peligro);">*</span></span><div class="ct">VIS-000130</div></div>')
    return d[:i] + datos + d[fin:]


def compu():
    t = (PROJ / "WA-Plantilla-Nueva.dc.html").read_text(encoding="utf-8")
    t = una_vez(t, "<title>Administración › WhatsApp › Plantillas · nueva</title>",
                "<title>Administración › WhatsApp › Plantillas · nueva · etapa 21</title>")
    # El menú y la campana de la etapa 21, como los demás tableros de su fila (formularios_etapas_1004.py y campana_1004.py)
    t = una_vez(t, '<a class="w-ln" href="FRM-Formularios.dc.html">', '<a class="w-ln" href="FRM-Formularios-21.dc.html">')
    otro = (PROJ / "WA-Chats-Respuesta-21.dc.html").read_text(encoding="utf-8")
    n = re.search(r'<a class="w-campana" href="Campana-21\.dc\.html" aria-label="Avisos: (\d+)">', otro).group(1)
    t, k = re.subn(r'(<a class="w-campana" href=")Campana(\.dc\.html" aria-label="Avisos: )\d+(">.*?<span class="n">)\d+(</span></a>)',
                   rf"\g<1>Campana-21\g<2>{n}\g<3>{n}\g<4>", t, flags=re.S)
    assert k == 1
    todos = bloques(t)
    assert len(todos) == 2 * len(E11)
    listas, dialogos = todos[:len(E11)], todos[len(E11):]
    assert all('class="w-bnd"' in b[3] for b in listas) and all('class="w-oscuro"' in b[3] for b in dialogos)
    base = {e: b[3] for e, b in zip(E11, dialogos)}
    base["Comprobante, con el PDF"] = base["Comprobante, sin encabezado"] = comprobante_compu(base["Nueva plantilla"])
    lista = {e: b[3] for e, b in zip(E11, listas)}
    # Primero los diálogos, que van después: así no se corren las posiciones de las listas
    t = reemplazar_grupo(t, dialogos, [dialogo_compu(base[e], e) for e in ESTADOS])
    t = reemplazar_grupo(t, bloques(t)[:len(E11)], [lista.get(e, lista["Nueva plantilla"]) for e in ESTADOS])
    t = con_estados(t)
    return con_css(t, CSS_COMPU)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
TIPO_TEL = ('<div class="ap-cmp"><span class="rt"><span>Tipo <span class="rq">*</span></span></span><div class="ap-seg2">'
            '<span class="on">Utilidad</span><span>Marketing</span></div></div>')
ENCABEZADO_TEL = ('<div class="ap-cmp"><span class="rt"><span>Encabezado <span class="rq">*</span></span>'
                  f'<button type="button" class="ap-i neu" aria-label="Qué significa" title="{AYUDA}">{SVG_I_TEL}</button></span>@SEG@</div>')
CHIPS_TEL = '<div class="ap-chips2"><span>+ Nombre del contacto</span><span>+ Otro dato</span></div>'


def pantalla_tel(p, estado):
    doc = estado in CON_PDF
    p = una_vez(p, TIPO_TEL, TIPO_TEL + ENCABEZADO_TEL.replace("@SEG@", segmentado("ap-seg2", doc)))
    if LLEGA[estado] is not None:
        p = una_vez(p, CHIPS_TEL, CHIPS_TEL + llega(LLEGA[estado], doc, False))
    return una_vez(p, '<a class="ap-fab" aria-label="Nueva plantilla" href="M-WA-Plantilla-Nueva.dc.html">',
                   f'<a class="ap-fab" aria-label="Nueva plantilla" href="{TEL}.dc.html">')


def comprobante_tel(p):
    p = una_vez(p, '<div class="ct">Pedido listo</div>', '<div class="ct">Comprobante</div>')
    p = una_vez(p, f'<div class="ct area">{PEDIDO}</div>', f'<div class="ct area">{COMPROBANTE}</div>')
    i, fin = p.index('<div class="ap-cmp"><span class="rt"><span>Dato 1 '), p.index('</div><div class="hp">')
    datos = ('<div class="ap-cmp"><span class="rt"><span>Dato 1 <span class="rq">*</span></span></span><div class="ct">número</div></div>'
             '<div class="ap-cmp"><span class="rt"><span>Ejemplo del dato 1 <span class="rq">*</span></span></span><div class="ct">VIS-000130</div></div>')
    return p[:i] + datos + p[fin:]


def tel():
    t = (PROJ / "M-WA-Plantilla-Nueva.dc.html").read_text(encoding="utf-8")
    t = una_vez(t, "<title>Nueva plantilla · teléfono</title>", "<title>Nueva plantilla · teléfono · etapa 21</title>")
    todos = bloques(t)
    assert len(todos) == len(E11) and all('class="ap-hoja' in b[3] for b in todos)
    base = {e: b[3] for e, b in zip(E11, todos)}
    base["Comprobante, con el PDF"] = base["Comprobante, sin encabezado"] = comprobante_tel(base["Nueva plantilla"])
    t = reemplazar_grupo(t, todos, [pantalla_tel(base[e], e) for e in ESTADOS])
    t = con_estados(t)
    return con_css(t, CSS_TEL)


# ---------------------------------------------------------------------------------------------------------------- canvas.json
def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (w, h) in ((COMPU, (1440, 900)), (TEL, (390, 844))):
        clave = n + ".dc.html"
        fila = [b for k, b in c["boards"].items() if k != clave and b.get("page") == "formularios" and b["y"] == FILAS[n]]
        x = max(b["x"] + b["w"] for b in fila) + 80
        c["boards"][clave] = {"h": h, "is_interactive": True, "page": "formularios", "title": TITULOS[n], "w": w, "x": x, "y": FILAS[n]}
        if clave not in c["order"]:
            c["order"].insert(c["order"].index(DESPUES[n]) + 1, clave)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    (PROJ / f"{COMPU}.dc.html").write_text(compu(), encoding="utf-8")
    (PROJ / f"{TEL}.dc.html").write_text(tel(), encoding="utf-8")
    registrar()
    print("ok", COMPU, TEL)
