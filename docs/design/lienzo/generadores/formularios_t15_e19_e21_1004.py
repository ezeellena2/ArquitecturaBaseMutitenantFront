"""Los tableros de la E19 y la E21 con las decisiones del traspaso 15 que el usuario tomó el 2026-11-18 (§5 de la hoja de ruta del
back: 204, 206, 227, 228, 230, 233, 235, 236, 237 y 239), con la lista de chequeo de diseño (213).

E19, el bloque, los cálculos y las condiciones:
- **el cálculo, también dentro del bloque** (233): «Pedido de materiales» suma «Importe» (6.3), un cálculo de cada ítem,
  «Cantidad × Producto · Precio», en todos los tableros de la etapa que dibujan el bloque (el editor, las condiciones, publicar), y
  «Total» suma el importe («Suma de Productos · Importe + Monto»): la suma del bloque ya no multiplica ítem por ítem, así que su
  diálogo pide solo la pregunta. En «Tipo de respuesta» de una pregunta del bloque, «Cálculo» ya no está apagado. `FRM-Editor-Calculo`
  suma «Un cálculo en el bloque»: «Agregar dato» ofrece solo los datos del ítem; el teléfono, su hoja;
- **la pantalla de cierre** (204): `FRM-Editor-Lineas` suma «El bloque al final», con «Observaciones» antes del bloque y el teléfono
  en la pantalla de cierre (el nombre, «Tocá «Enviar» para mandar el formulario.» y el botón); después del bloque queda solo
  «Total», que no se ve en WhatsApp. El teléfono suma «Así lo ve: el bloque al final»;
- **lo que WhatsApp no muestra** (235): el aviso debajo de una condición con números en el editor de condiciones, y el título de
  sección que se ve siempre cuando sus preguntas tienen condiciones distintas; publicar lo dice y frena;
- **las respuestas** (206 y 227): el importe es una columna más del bloque en el detalle, la pantalla completa y la tarjeta del
  chat, y un filtro más en «Filtros»; los chips de una pregunta del bloque dicen «(en algún ítem de Productos)». `FRM-Respuestas-
  Exportar-19`, nuevo: el diálogo de exportar de la E15 con «Filas» y el tope de 100.000 filas.

E21, las reglas:
- **«Por resolver (N)» y la columna «Reglas»** (228), en la planilla y en lo propio;
- **la actividad** (239): quién pidió el último reintento y cuándo, «No aplica» de quien dejó el rol y la falla del rol sin
  personas que puedan decidir; el error del servidor al guardar una regla que cita preguntas sin «Ver respuestas»;
- **el PDF** (236 y 230): las horas con la zona de quien cargó y la «Ubicación»;
- **el aviso a quien cargó** cuando su regla se frena (237);
- **«Ubicación»**, que llega en la E20 (230), última en «Tipo de respuesta» de `FRM-Editor-21`, como en `FRM-Editor-Ubicacion` (78).

Corre después de `formularios_t15_1004.py` y `dialogos_t15_1004.py`, y antes de la pasada de las piezas
(`python traspaso10_piezas_1004.py --tableros …`, que imprime al terminar). Usa las piezas que los tableros ya tienen y no toca
`canvas.json`. Lee y escribe sin cambiar los finales de línea, y se puede volver a correr sin cambiar nada.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from formularios_t15_1004 import PROJ, cambiar, cierre, escribir, hijos, leer, sumar_estado, texto  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")


def estados(t):
    return json.loads("[" + re.search(r'"estado":\{"editor":"enum","options":\[([^\]]*)\]', t).group(1) + "]")


def indice(t, nombre):
    return json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1)).index(nombre)


def bloques(t, k):
    """Los bloques `<sc-if>` del estado `k`: [(inicio, fin)]."""
    return [(m.start(), cierre(t, m.start(), "sc-if"))
            for m in re.finditer(r'<sc-if value="\{\{s' + str(k) + r'\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">', t)]


def en_estado(t, k, cambio, cual=None):
    """`cambio` sobre los bloques del estado `k` (o solo el número `cual`)."""
    partes, i = [], 0
    for n, (a, b) in enumerate(bloques(t, k)):
        partes.append(t[i:a])
        partes.append(cambio(t[a:b]) if cual is None or n == cual else t[a:b])
        i = b
    partes.append(t[i:])
    return "".join(partes)


def sacar_svg(html):
    return re.sub(r"<svg.*?</svg>", "", html, flags=re.S)


# ================================================================================================================ E19
# ---------------------------------------------------------------------------------------------------- el importe del bloque
FILA = {"q-blq": "q-it", "t-blq-caja": "q-row"}  # la caja de las preguntas de cada ítem (compu, teléfono) y su fila


def fila_de(t, caja, num, nombre):
    """La fila cerrada de la pregunta `num` del bloque en la caja `caja`: el `<div>` de su encabezado."""
    m = re.search(rf'<div class="{FILA[caja]}"><span class="num">{re.escape(num)}</span><span class="(?:dato|tx)"><b>{nombre}</b>', t)
    assert m, (caja, num, nombre)
    return t[m.start():cierre(t, m.start(), "div")]


def con_importe(t):
    """En cada caja del bloque que termina en «Cantidad», suma «Importe», un cálculo de cada ítem, y el resumen dice 3 preguntas."""
    for caja in FILA:
        if f'<div class="{caja}">' not in t:
            continue
        partes, i, molde = [], 0, None
        for m in re.finditer(rf'<div class="{caja}">', t):
            if m.start() < i:
                continue
            fin = cierre(t, m.start(), "div")
            region = t[m.start():fin]
            ultimo = re.findall(rf'<span class="num">(\d+)\.(\d+)</span><span class="(?:dato|tx)"><b>([^<]+)</b>', region)
            if not ultimo or ultimo[-1][2] != "Cantidad" or ">Importe</b>" in region:
                partes.append(t[i:fin])
                i = fin
                continue
            n, j, _ = ultimo[-1]
            molde = molde or fila_de(t, caja, f"{n}.{j}", "Cantidad")
            importe = (molde.replace(f'<span class="num">{n}.{j}</span>', f'<span class="num">{n}.{int(j) + 1}</span>', 1)
                       .replace("Cantidad", "Importe").replace("<span>Número · Obligatoria</span>", "<span>Cálculo · Pesos</span>", 1))
            assert "Subir Importe" in importe and "Cálculo · Pesos" in importe, caja
            region = cambiar(region, 'aria-label="Bajar Cantidad" aria-disabled="true"', 'aria-label="Bajar Cantidad" aria-disabled="false"', 1)
            region = region[:-len("</div>")] + importe + "</div>"
            antes = t[i:m.start()]
            k = antes.rfind(f'<span class="num">{n}</span>')
            assert k >= 0, caja
            antes = antes[:k] + re.sub(r"(ítems · )2 preguntas<", r"\g<1>3 preguntas<", antes[k:], count=1)
            partes += [antes, region]
            i = fin
        partes.append(t[i:])
        t = "".join(partes)
    return t.replace("y sus 2 preguntas.", "y sus 3 preguntas.")


# ---------------------------------------------------------------------------------------------------- el bloque al final
def fila_num(t, cls, num):
    m = re.search(rf'<div class="{cls}"><span class="num">{re.escape(num)}</span>', t)
    assert m, (cls, num)
    return m.start(), cierre(t, m.start(), "div")


def bloque_al_final(region, cls, caja):
    """«Observaciones» pasa antes del bloque: 6 Observaciones, 7 Productos (7.1 a 7.3) y 8 Total, que no se ve en WhatsApp."""
    a, _ = fila_num(region, cls, "6")
    c = region.index(f'<div class="{caja}">', a)
    c2 = cierre(region, c, "div")
    t0, t1 = fila_num(region, cls, "7")
    o0, o1 = fila_num(region, cls, "8")
    assert c2 == t0 and t1 == o0, (cls, "las filas no van seguidas")
    bloque = region[a:c2]
    for viejo, nuevo in (('"num">6.3<', '"num">7.3<'), ('"num">6.2<', '"num">7.2<'), ('"num">6.1<', '"num">7.1<'), ('"num">6<', '"num">7<')):
        bloque = cambiar(bloque, viejo, nuevo, 1)
    obs = region[o0:o1].replace('"num">8<', '"num">6<', 1)
    obs = cambiar(obs, 'aria-label="Bajar Observaciones" aria-disabled="true"', 'aria-label="Bajar Observaciones" aria-disabled="false"', 1)
    total = region[t0:t1].replace('"num">7<', '"num">8<', 1)
    total = cambiar(total, 'aria-label="Bajar Total" aria-disabled="false"', 'aria-label="Bajar Total" aria-disabled="true"', 1)
    return region[:a] + obs + bloque + total + region[o1:]


CIERRE_TEL = ('<div class="pv-hoja"><div class="pv-hc"><span class="pv-x">×</span>Pedido de materiales</div><div class="pv-hb">'
              '<div class="pv-c">Tocá «Enviar» para mandar el formulario.</div></div><div class="pv-pie"><div class="pv-bt">Enviar</div></div></div>')
CERRAR_HOJA = ('<button type="button" class="ap-ib" aria-label="Cerrar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" '
               'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
               '<path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg></button>')
HOJA_CIERRE = ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Así lo ve quien lo recibe"><span class="asa"></span>'
               '<div class="hc"><div><h2>Así lo ve quien lo recibe</h2><span class="h-sub">Pedido de materiales · borrador</span></div>'
               f'{CERRAR_HOJA}</div><div class="hb"><p class="d-tx">Tocá «Enviar» para mandar el formulario.</p></div>'
               '<div class="hp"><button type="button" class="cb cb-pri" disabled>Enviar</button></div></div>')


def lineas(t):
    t = con_importe(t)
    t = cambiar(t, '<span class="off" aria-disabled="true" title="No se carga varias veces.">Cálculo</span>', "<span>Cálculo</span>", 1)

    def cambio(numero, copia):
        if 'class="w-body"' not in copia[:200]:
            return copia  # la banda
        copia = cambiar(copia, '<span class="e-tip" role="tooltip">Ya hay un bloque.</span>', "", 1)
        copia = bloque_al_final(copia, "q-it", "q-blq")
        a = copia.index('<div class="pv-hoja">')
        return copia[:a] + CIERRE_TEL + copia[cierre(copia, a, "div"):]
    return sumar_estado(t, indice(t, "Agregar bloque apagado"), "El bloque al final", "Con mínimo 0", cambio)


def lineas_tel(t):
    t = con_importe(t)
    if '<div class="lg-tcol">Importe' not in t:
        t = cambiar(t, '<div class="lg-tcol">Cantidad<small>Número · Obligatoria</small></div>',
                    '<div class="lg-tcol">Cantidad<small>Número · Obligatoria</small></div><div class="lg-tcol">Importe<small>Cálculo · Pesos</small></div>', 1)

    def cambio(numero, copia):
        if 'class="ap-hoja"' in copia[:300]:
            return copia[:copia.index('<div class="ap-velo">')] + HOJA_CIERRE + "</sc-if>"
        return bloque_al_final(copia, "q-row", "t-blq-caja")
    return sumar_estado(t, indice(t, "Editar el bloque"), "Así lo ve: el bloque al final", "Editar el bloque", cambio)


# ---------------------------------------------------------------------------------------------------- la fórmula
SUMA_VIEJA = "Suma de Productos · Cantidad × Precio"
SUMA = "Suma de Productos · Importe"
DLG_VIEJO = ('<div class="w-cmp"><span class="rt">Pregunta del bloque</span><div class="ct sel"><span class="v">Cantidad</span>')
DLG_NUEVO = ('<div class="w-cmp ancho"><span class="rt">Pregunta del bloque</span><div class="ct sel"><span class="v">Importe</span>')
X = '<span class="x" aria-hidden="true">×</span>'
FORMULA_ITEM = (f'<div class="lg-form"><span class="lg-p ">Cantidad{X}</span><span class="lg-p op">×</span>'
                f'<span class="lg-p ">Producto · Precio{X}</span></div>')
MENU_TOTAL = ('<span class="f-mi" role="menuitem">Un número</span><span class="f-mi" role="menuitem">Una pregunta</span>'
              '<span class="f-mi" role="menuitem">Un campo del catálogo</span><span class="f-mi" role="menuitem">La suma de una pregunta del bloque</span>')
MENU_ITEM = ('<span class="f-mi" role="menuitem">Un número</span><span class="f-mi" role="menuitem">Una pregunta del ítem</span>'
             '<span class="f-mi" role="menuitem">Un campo del catálogo</span>')
AYUDA_TOTAL = "Se calcula al llegar la respuesta, con los valores que quedaron guardados. No se ve en WhatsApp."
AYUDA_ITEM = "Se calcula en cada ítem al llegar la respuesta, con los valores que quedaron guardados. No se ve en WhatsApp."


def calculo(t):
    t = con_importe(t)
    t = cambiar(t, SUMA_VIEJA, SUMA, 5)
    # La suma del bloque ya no multiplica: el diálogo pide solo la pregunta, que puede ser el importe.
    m = re.search(re.escape(DLG_VIEJO) + r".*?</div></div>(<div class=\"w-cmp\"><span class=\"rt\">Multiplicar por</span>.*?</div></div>"
                  r"<div class=\"w-cmp\"><span class=\"rt\">Campo de «Producto»</span>.*?</div></div>)</div>", t, re.S)
    if m:
        t = t[:m.start(1)] + t[m.end(1):]
        t = cambiar(t, DLG_VIEJO, DLG_NUEVO, 1)
    assert "Multiplicar por" not in t and DLG_NUEVO in t

    def cambio(numero, copia):
        if 'class="w-body"' not in copia[:200]:
            return copia
        # «Total», cerrado: queda la fila de su encabezado.
        a = copia.index('<div class="q-ab"><div class="q-it"><span class="num">7</span>')
        b = cierre(copia, a, "div")
        ab = copia[a:b]
        fila_total = ab[len('<div class="q-ab">'):cierre(ab, len('<div class="q-ab">'), "div")]
        copia = copia[:a] + fila_total + copia[b:]
        # «Importe», abierto en el bloque, con lo de «Total» de antes: su fórmula y solo los datos del ítem.
        ed = ab.replace(fila_total, "", 1)
        ed = cambiar(ed, '<div class="ct">Total</div>', '<div class="ct">Importe</div>', 1)
        ed = cambiar(ed, f'aria-label="{AYUDA_TOTAL}" title="{AYUDA_TOTAL}"', f'aria-label="{AYUDA_ITEM}" title="{AYUDA_ITEM}"', 1)
        f = ed.index('<div class="lg-form">')
        ed = ed[:f] + FORMULA_ITEM + ed[cierre(ed, f, "div"):]
        ed = cambiar(ed, MENU_TOTAL, MENU_ITEM, 1)
        i0, i1 = fila_num(copia, "q-it", "6.3")
        fila_imp = copia[i0:i1]
        return copia[:i0] + '<div class="q-ab">' + fila_imp + ed[len('<div class="q-ab">'):] + copia[i1:]
    return sumar_estado(t, indice(t, "Agregar un dato"), "Un cálculo en el bloque", "La suma de una pregunta del bloque", cambio)


def calculo_tel(t):
    t = con_importe(t)
    t = cambiar(t, SUMA_VIEJA, SUMA, 1)

    def cambio(numero, copia):
        if 'class="ap-hoja"' not in copia[:300]:
            return copia
        copia = cambiar(copia, 'aria-label="Total"><span class="asa"></span><div class="hc"><div><h2>Total</h2>',
                        'aria-label="Importe"><span class="asa"></span><div class="hc"><div><h2>Importe</h2>', 1)
        copia = cambiar(copia, '<div class="ct">Total</div>', '<div class="ct">Importe</div>', 1)
        f = copia.index('<div class="lg-form">')
        return copia[:f] + FORMULA_ITEM + copia[cierre(copia, f, "div"):]
    return sumar_estado(t, 0, "Un cálculo en el bloque", "La fórmula", cambio)


# ---------------------------------------------------------------------------------------------------- lo que WhatsApp no muestra
CSS_MARCA = "data-t15e19e21"


def con_css(t, css):
    """Suma `css` en un bloque propio antes de `</helmet>` (una vez)."""
    if f"<style {CSS_MARCA}>" in t:
        return t
    n = "\r\n" if "\r\n" in t else "\n"
    bloque = f"<style {CSS_MARCA}>{n}" + n.join(css.strip().split("\n")) + f"{n}</style>{n}"
    return t.replace("</helmet>", bloque + "</helmet>", 1)


# 235 · Un aviso, no un error: se guarda, pero publicar frena. Va debajo de la condición, como el error de una referencia rota.
CSS_ADV = ".err2.adv { color: var(--alerta); }"
ADV = '<span class="err2 adv" role="status">WhatsApp no muestra una condición con números.</span>'
COND_MONTO = re.compile(r'(<div class="lg-cond"><div class="w-cmp"><span class="rt">Pregunta</span><div class="ct sel"><span class="v">Monto</span>.*?'
                        r'<div class="ct">100\.000,00</div></div><button type="button" class="ib" aria-label="Quitar condición">.*?</button></div>)'
                        r'(?!<span class="err2 adv")', re.S)
# Un título con preguntas de condiciones distintas: en WhatsApp se ve siempre (spec 19). Las piezas de `FRM-Editor`.
CSS_TITULO = """
.q-it.q-tit { min-height: 35.5px/*48px*/; background: oklch(0.975 0.01 95); }
.q-it.q-tit .num { visibility: hidden; }
.q-it.q-tit .dato b { font-weight: 600; }
.tel .pv-sub { margin-top: 3px; font-size: 13.5px; font-weight: 700; color: oklch(0.25 0.01 150); }
"""
AYUDA_TITULO = "En WhatsApp se ve siempre: sus preguntas tienen condiciones distintas."
I_INFO = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/></svg>')


def fi(texto):
    return f'<span class="f-i" tabindex="0" role="img" aria-label="{texto}" title="{texto}">{I_INFO}</span>'


def titulo(t):
    """La fila del título «Entrega», como las de `FRM-Editor`, con la (i) de lo que hace en WhatsApp."""
    i0, i1 = fila_num(t, "q-it", "5")
    fila = t[i0:i1]
    fila = re.sub(r'<span class="num">5</span><span class="dato"><b>Fecha de entrega</b><span>Fecha · Opcional</span></span><span class="chips"></span>',
                  f'<span class="num"></span><span class="dato"><b>Entrega{fi(AYUDA_TITULO)}</b></span>', fila, count=1)
    fila = fila.replace('<div class="q-it">', '<div class="q-it q-tit">', 1).replace("Fecha de entrega", "Entrega")
    assert "Entrega" in fila and "Fecha" not in fila, fila[:200]
    return fila


def condiciones(t):
    t = con_importe(t)
    t = con_css(t, CSS_ADV + "\n" + CSS_TITULO)
    if ADV not in t:
        assert len(COND_MONTO.findall(t)) == 1
        t = COND_MONTO.sub(lambda m: m.group(1) + ADV, t, count=1)
    assert t.count(ADV) == 1

    def cambio(numero, copia):
        if 'class="w-body"' not in copia[:200]:
            return copia
        # «Monto», cerrado; arriba, el título «Entrega», y «Fecha de entrega» con su propia condición.
        a = copia.index('<div class="q-ab"><div class="q-it"><span class="num">4</span>')
        b = cierre(copia, a, "div")
        ab = copia[a:b]
        monto = ab[len('<div class="q-ab">'):cierre(ab, len('<div class="q-ab">'), "div")]
        copia = copia[:a] + titulo(copia) + monto + copia[b:]
        copia = cambiar(copia, '<b>Fecha de entrega</b><span>Fecha · Opcional</span>', '<b>Fecha de entrega</b><span>Fecha · 1 condición · Opcional</span>', 1)
        # Respondió «No»: «Monto» y «Fecha de entrega» no se ven, y el título queda.
        copia = cambiar(copia, '<div class="pv-rd"><span class="on"><i></i>Sí</span><span><i></i>No</span></div></div><div class="pv-c">Monto (opcional)<div class="pv-in"></div></div>',
                        '<div class="pv-rd"><span><i></i>Sí</span><span class="on"><i></i>No</span></div></div><div class="pv-c">Motivo (opcional)'
                        '<div class="pv-in">Elegí una opción</div></div><div class="pv-sub">Entrega</div>', 1)
        return copia
    return sumar_estado(t, 0, "Un título con condiciones distintas", "Número y fecha", cambio)


def condiciones_tel(t):
    t = con_importe(t)
    t = con_css(t, CSS_ADV)

    def cambio(numero, copia):
        if 'class="ap-hoja"' not in copia[:300]:
            return copia
        for viejo, nuevo in (('aria-label="Monto"><span class="asa"></span><div class="hc"><div><h2>Monto</h2>',
                              'aria-label="Observaciones"><span class="asa"></span><div class="hc"><div><h2>Observaciones</h2>'),
                             ('<div class="ct">Monto</div>', '<div class="ct">Observaciones</div>'),
                             ('<div class="ct sel">Número<', '<div class="ct sel">Texto largo<'),
                             ('<div class="ct sel">¿Se concretó la venta?<', '<div class="ct sel">Monto<'),
                             ('<div class="ct sel">es<', '<div class="ct sel">es mayor o igual a<')):
            copia = cambiar(copia, viejo, nuevo, 1)
        m = re.search(r'<div class="ct sel">Sí<svg.*?</svg></div>', copia, re.S)
        copia = copia[:m.start()] + '<div class="ct">100.000,00</div>' + copia[m.end():]
        i = copia.index('<div class="t-cond">')
        j = cierre(copia, i, "div")
        return copia[:j - len("</div>")] + ADV + copia[j - len("</div>"):]
    return sumar_estado(t, 0, "Una condición con números", "Mostrar si", cambio)


# ---------------------------------------------------------------------------------------------------- publicar
MOTIVO_VIEJO = "WhatsApp no puede mostrar la condición «Monto es mayor o igual a 100.000,00»."
MOTIVO = "WhatsApp no muestra una condición con números: «Monto es mayor o igual a 100.000,00»."
MOTIVO_CADENA = "WhatsApp muestra hasta tres condiciones en cadena, y esta es la cuarta."


def publicar(t):
    t = con_importe(t)
    t = cambiar(t, MOTIVO_VIEJO, MOTIVO, 1)

    def cambio(numero, copia):
        if 'class="w-oscuro"' not in copia[:200]:
            return copia
        m = re.search(r'<div class="z-f"><span class="ic">.*?</span><span class="tx"><b>Observaciones</b><span>' + re.escape(MOTIVO)
                      + r'</span></span><a class="cb cb-sec" href="FRM-Editor-Condiciones.dc.html">Ir a la pregunta</a></div>', copia, re.S)
        fila = m.group(0)
        otra = fila.replace("<b>Observaciones</b>", "<b>Fecha de entrega</b>", 1).replace(MOTIVO, MOTIVO_CADENA, 1)
        return copia[:m.end()] + otra + copia[m.end():]
    return sumar_estado(t, 0, "Dos que WhatsApp no puede mostrar", "Una condición que WhatsApp no puede mostrar", cambio)


# ---------------------------------------------------------------------------------------------------- las respuestas
IMPORTES = {("Caño de 1/2 pulgada", "10"): "42.000,00", ("Codo de 90°", "40"): "34.000,00", ("Cinta de teflón", "20"): "19.000,00",
            ("Caño de 1/2 pulgada", "6"): "25.200,00", ("Codo de 90°", "12"): "10.200,00"}
D_IT = re.compile(r'(<span class="v">([^<]+)<span class="d-sub">(?:(?!</span></span>).)*?<span class="k">Cantidad</span><span>(\d+)</span>)(</span>)', re.S)
IT_T = re.compile(r'<div class="it-t(?: imp)?" role="table" aria-label="Productos">(.*?)</div>', re.S)
TARJETA = re.compile(r'<span>(\d)\. ([^<]+) · (\d+)</span>')
CSS_IT = ".it-t.imp { grid-template-columns: 40px minmax(180px, 1fr) 110px 90px 110px; min-width: 530px; }"


def importe(producto, cantidad):
    return IMPORTES[(producto, cantidad)]


def detalle(t):
    """El importe de cada ítem: en la vista rápida, debajo de Cantidad; en la pantalla completa, una columna más."""
    t = D_IT.sub(lambda m: f'{m.group(1)}<span class="k">Importe</span><span>$ {importe(m.group(2), m.group(3))}</span>{m.group(4)}', t)

    def tabla(m):
        celdas = m.group(1)
        if ">Importe<" in celdas:
            return m.group(0)
        celdas = celdas.replace('<span class="h r">Cantidad</span>', '<span class="h r">Cantidad</span><span class="h r">Importe</span>', 1)
        celdas = re.sub(r'(<span class="r n">\d</span><span>([^<]+)</span><span class="r">[^<]+</span><span class="r">(\d+)</span>)',
                        lambda f: f'{f.group(1)}<span class="r">$ {importe(f.group(2), f.group(3))}</span>', celdas)
        return f'<div class="it-t imp" role="table" aria-label="Productos">{celdas}</div>'
    t = IT_T.sub(tabla, t)
    if 'class="it-t imp"' in t:
        t = con_css(t, CSS_IT)
    return t


def tarjeta(t):
    return TARJETA.sub(lambda m: f"<span>{m.group(1)}. {m.group(2)} · {m.group(3)} · $ {importe(m.group(2), m.group(3))}</span>", t)


CHIPS = ("Producto: Caño de 1/2 pulgada", "Cantidad: desde 10")
EN_ITEM = " (en algún ítem de Productos)"


def chips_del_bloque(t):
    for chip in CHIPS:
        t = re.sub(re.escape(chip) + r'(?=[<"])', chip + EN_ITEM, t)
    return t


def planilla_19(t):
    t = cambiar(t, '<span class="sub">Cantidad</span><span>Total</span>', '<span class="sub">Cantidad</span><span class="sub">Importe</span><span>Total</span>', 1)
    return chips_del_bloque(t)


def planilla_19_tel(t):
    m = re.search(r'(<span class="sub">Cantidad<span class="v">Todas<svg(?:(?!</svg>).)*</svg></span></span>)(<span>Total)', t, re.S)
    if m:
        t = t[:m.end(1)] + m.group(1).replace("Cantidad", "Importe", 1) + t[m.end(1):]
    assert '<span class="sub">Importe<span class="v">' in t
    return chips_del_bloque(t)


# ================================================================================================================ E21
# ---------------------------------------------------------------------------------------------------- «Por resolver» (228)
# Por resolver: VIS-000122 (Martín Paz), que no pudo pedir la aprobación porque nadie del rol Supervisor puede decidirla (239), y
# VIS-000108 (Tomás Acosta, en lo propio), de la página 3. VIS-000126 no: su aviso al rol terminó, aunque Martín Paz no lo recibió.
POR_RESOLVER = ("VIS-000122", "VIS-000108")
N_RESOLVER = len(POR_RESOLVER)
ANCHO_REGLAS = "110px"
TABLA_PL = re.compile(r'<div class="w-caja pl-caja(?! pa-cola)[^"]*" style="--pl-cols: ([^;"]*);"><div class="pl-scroll"><div class="w-th pl">')
NUM = re.compile(r'<a class="pl-num" href="[^"]*">([A-Z]{3}-\d{6})</a>')
REGLAS_SI = '<span><span class="w-est pend">Por resolver</span></span>'
REGLAS_NO = '<span><span class="pl-g">—</span></span>'


def con_reglas(t, siempre=False):
    """La columna «Reglas», después de «Estado», en cada planilla con alguna fila por resolver (o en su vista, con `siempre`)."""
    partes, i = [], 0
    for m in TABLA_PL.finditer(t):
        if m.start() < i:
            continue
        fin = cierre(t, m.start(), "div")
        region = t[m.start():fin]
        a = region.index('<div class="w-th pl">')
        fin_h = cierre(region, a, "div")
        head = region[a + len('<div class="w-th pl">'):fin_h - len("</div>")]
        celdas = hijos(head)
        nombres = [texto(head[x:y]) for x, y in celdas]
        numeros = NUM.findall(region)
        if "Reglas" in nombres or "Estado" not in nombres or not (siempre or set(numeros) & set(POR_RESOLVER)):
            continue
        idx = nombres.index("Estado")
        cols = m.group(1).split()
        assert len(cols) == len(celdas), (cols, nombres)
        cols.insert(idx + 1, ANCHO_REGLAS)
        head = head[:celdas[idx][1]] + "<span>Reglas</span>" + head[celdas[idx][1]:]
        cuerpo = region[fin_h:]
        filas, j = [], 0
        for mf in re.finditer(r'<div class="w-tr pl[^"]*">', cuerpo):
            if mf.start() < j:
                continue
            ff = cierre(cuerpo, mf.start(), "div")
            fila = cuerpo[mf.end():ff - len("</div>")]
            cs = hijos(fila)
            assert len(cs) == len(celdas), (len(cs), len(celdas), texto(fila)[:80])
            n = NUM.search(fila).group(1)
            fila = fila[:cs[idx][1]] + (REGLAS_SI if n in POR_RESOLVER else REGLAS_NO) + fila[cs[idx][1]:]
            filas += [cuerpo[j:mf.end()], fila, "</div>"]
            j = ff
        filas.append(cuerpo[j:])
        apertura = region[:a].replace(f"--pl-cols: {m.group(1)};", f"--pl-cols: {' '.join(cols)};", 1)
        partes += [t[i:m.start()], apertura, '<div class="w-th pl">', head, "</div>", "".join(filas)]
        i = fin
    partes.append(t[i:])
    return "".join(partes)


SEG_PA = re.compile(r'(<span class="(?:on)?" role="radio" aria-checked="(?:true|false)">Por aprobar \(3\)</span>)(?!<span[^>]*>Por resolver)')
SEG_PR = f'<span class="" role="radio" aria-checked="false">Por resolver ({N_RESOLVER})</span>'


def con_vista(t):
    return SEG_PA.sub(lambda m: m.group(1) + SEG_PR, t)


def elegir_vista(copia, n):
    """El segmentado con «Por resolver (n)» elegida."""
    copia = copia.replace('<span class="on" role="radio" aria-checked="true">Por aprobar (3)</span>',
                          '<span class="" role="radio" aria-checked="false">Por aprobar (3)</span>', 1)
    copia = cambiar(copia, '<span class="on" role="radio" aria-checked="true">Todas</span>', '<span class="" role="radio" aria-checked="false">Todas</span>', 1)
    return cambiar(copia, SEG_PR, f'<span class="on" role="radio" aria-checked="true">Por resolver ({n})</span>', 1)


def solo_filas(copia, numeros, extra=""):
    """La planilla con solo las filas de `numeros` (y `extra` al final), y su pie."""
    a = TABLA_PL.search(copia).start()
    fin = cierre(copia, a, "div")
    region = copia[a:fin]
    partes, j = [], 0
    for mf in re.finditer(r'<div class="w-tr pl[^"]*">', region):
        if mf.start() < j:
            continue
        ff = cierre(region, mf.start(), "div")
        partes.append(region[j:mf.start()])
        if NUM.search(region[mf.start():ff]).group(1) in numeros:
            partes.append(region[mf.start():ff].replace('<div class="w-tr pl sel">', '<div class="w-tr pl">', 1))
        j = ff
    region = "".join(partes) + extra + region[j:]  # `extra`, después de la última fila y adentro de la planilla
    return copia[:a] + region + copia[fin:]


VACIO = '<div class="pl-vacio"><b>Ninguna respuesta tiene acciones por resolver.</b></div>'


def fila_108(t):
    """VIS-000108 de Tomás Acosta, de la página 3, con las columnas de la planilla de «Todas»: copia la de VIS-000122."""
    m = re.search(r'<div class="w-tr pl"><span><a class="pl-num" href="[^"]*">VIS-000122</a></span>', t)
    fila = t[m.start():cierre(t, m.start(), "div")]
    for viejo, nuevo in (("VIS-000122", "VIS-000108"), ("12/10/2026, 17:40", "02/10/2026, 10:30"), ('title="Martín Paz"', 'title="Tomás Acosta"'),
                         ('<span class="tx">Martín Paz</span>', '<span class="tx">Tomás Acosta</span>'), ("<span>Distribuidora Norte</span>", "<span>Ferretería Sur</span>"),
                         ('<span class="r">54.200,00</span>', '<span class="r">12.000,00</span>')):
        fila = cambiar(fila, viejo, nuevo, 1)
    return fila


def planilla_21(t):
    t = con_vista(con_reglas(t))

    def vista(numero, copia):
        if 'class="w-body"' not in copia[:200]:
            return copia
        copia = solo_filas(elegir_vista(copia, N_RESOLVER), ("VIS-000122",), fila_108(copia))
        return re.sub(r'<div class="w-pie"><span>[^<]*</span><span>[^<]*</span></div>',
                      '<div class="w-pie"><span>1–2 de 2</span><span>10 por página · Página 1 de 1</span></div>', copia, count=1)

    def vacio(numero, copia):
        if 'class="w-body"' not in copia[:200]:
            return copia
        copia = solo_filas(elegir_vista(copia, 0), ())
        copia = re.sub(r'<div class="w-pie"><span>[^<]*</span><span>[^<]*</span></div>', VACIO, copia, count=1)
        return copia
    t = sumar_estado(t, indice(t, "Todas"), "Por resolver", "Todas", vista)
    return sumar_estado(t, indice(t, "Todas"), "Por resolver: vacía", "Por resolver", vacio)


L2_122 = '<span class="l2"><span class="w-est off">Recibida</span> · Distribuidora Norte</span>'
L2_108 = '<span class="l2"><span class="w-est off">Recibida</span> · Ferretería Sur</span>'
PR_TEL = '<span class="w-est pend">Por resolver</span>'


def planilla_21_tel(t):
    t = con_vista(t)
    t = t.replace(L2_122, L2_122.replace(" · Distribuidora Norte", f" · {PR_TEL} · Distribuidora Norte"))

    def vista(numero, copia):
        if 'class="ap-bar' not in copia[:200]:
            return copia
        copia = elegir_vista(copia, N_RESOLVER)
        a = copia.index('<div class="ap-cuerpo">') + len('<div class="ap-cuerpo">')
        b = cierre(copia, a - len('<div class="ap-cuerpo">'), "div") - len("</div>")
        filas = re.findall(r'<a class="ap-fila" href="[^"]*"><div class="tx">.*?</div></a>', copia[a:b], re.S)
        f122 = next(f for f in filas if "VIS-000122" in f)
        f108 = (f122.replace("VIS-000122", "VIS-000108").replace("12/10/2026, 17:40", "02/10/2026, 10:30")
                .replace("Distribuidora Norte", "Ferretería Sur").replace("Martín Paz · WhatsApp", "Tomás Acosta · WhatsApp"))
        return copia[:a] + f122 + f108 + copia[b:]
    return sumar_estado(t, indice(t, "Todas"), "Por resolver", "Todas", vista)


def propias_21(t):
    return con_reglas(t)


def propias_21_tel(t):
    return t.replace(L2_108, L2_108.replace(" · Ferretería Sur", f" · {PR_TEL} · Ferretería Sur"))


# ---------------------------------------------------------------------------------------------------- la actividad (239)
PIDIO = "Lucía Fernández pidió reintentar el 13/10/2026, 16:20."
SE_FUE = "Ya no tiene el rol Dueño."
MOTIVO_PAZ = "WhatsApp no aceptó el mensaje: no tiene el WhatsApp vinculado."
SIN_PERSONAS = "Nadie del rol Supervisor puede decidirla."
AYUDA_ROL = "Pide la aprobación otra vez. Antes, sumá al rol a alguien que pueda decidirla: quien la cargó no cuenta."


def reintento(copia):
    """Quién pidió el último reintento y cuándo, y Carlos Ruiz, que dejó el rol, «No aplica» sin frenar a los demás."""
    copia = cambiar(copia, f"Martín Paz<small>{MOTIVO_PAZ}</small>", f"Martín Paz<small>{MOTIVO_PAZ}</small><small>{PIDIO}</small>", 1)
    m = re.search(r'<div class="f"><span class="h"></span><span class="q pers">Ana Gómez</span><span><span class="e ">Leído</span></span></div>', copia)
    carlos = (f'<div class="f"><span class="h"></span><span class="q pers">Carlos Ruiz<small>{SE_FUE}</small></span>'
              '<span><span class="e gris">No aplica</span></span></div>')
    return copia[:m.end()] + carlos + copia[m.end():]


def sin_personas(aside):
    """VIS-000122, que no pudo pedir la aprobación: nadie del rol Supervisor puede decidirla. Sale de la vista rápida de VIS-000126."""
    a = aside.index('<div class="d3-moms">')
    b = cierre(aside, a, "div")
    moms = ('<div class="d3-moms"><div class="m"><span class="t"><b>Recibida</b><small>Por WhatsApp · Martín Paz</small></span>'
            '<span class="h">12/10/2026, 17:40</span></div><div class="m"><span class="t"><b>Al recibirla</b><small>Mandarle un mensaje a quien la cargó · '
            'Pedir aprobación a un rol</small><small>No se pudo pedir la aprobación.</small></span><span class="h"><a class="d4-ln" href="#actividad">1 de 2 hechas</a></span></div></div>')
    aside = aside[:a] + moms + aside[b:]
    a = aside.index('<div class="ac5 cmp">')
    b = cierre(aside, a, "div")
    filas = ('<div class="ac5 cmp"><div class="hd"><span>Fecha</span><span>Qué pasó</span><span>Estado</span></div><div class="bd">Al recibirla</div>'
             '<div class="f"><span class="h">12/10/2026, 17:40</span><span class="q">Se respondió el formulario<small>Por WhatsApp · Martín Paz</small></span>'
             '<span><span class="e ">Hecho</span></span></div><div class="f"><span class="h">17:40</span><span class="q">Mandarle un mensaje a quien la cargó'
             '<small>Martín Paz</small><span class="msj">Recibimos VIS-000122. Te avisamos cuando la aprueben.</span></span><span><span class="e ">Leído</span></span></div>'
             f'<div class="f"><span class="h">17:40</span><span class="q">Pedir aprobación a un rol<small>Rol Supervisor</small><small>{SIN_PERSONAS}</small>'
             f'<span class="ac"><button type="button" class="cb cb-sec">Reintentar</button>{fi(AYUDA_ROL)}</span></span>'
             '<span><span class="e mal">No se pudo</span></span></div></div>')
    aside = aside[:a] + filas + aside[b:]
    for viejo, nuevo in (('aria-label="Respuesta VIS-000126"', 'aria-label="Respuesta VIS-000122"'),
                         ('<b>VIS-000126</b><span class="w-est ">Aprobada</span>', '<b>VIS-000122</b><span class="w-est off">Recibida</span>'),
                         ('<span role="tab" class="">Fotos <span class="c">2</span></span>', ""), ('<span role="tab" class="">PDF</span>', ""),
                         ('<div class="d2-pie">5 de 10</div>', '<div class="d2-pie">9 de 10</div>')):
        aside = cambiar(aside, viejo, nuevo, 1)
    m = re.search(r'<button type="button" class="ib" aria-label="Descargar el PDF" title="Descargar el PDF"><svg.*?</svg></button>', aside, re.S)
    return aside[:m.start()] + aside[m.end():]


def elegir_fila(copia, numero):
    copia = copia.replace('<div class="w-tr pl sel">', '<div class="w-tr pl">')
    return re.sub(r'<div class="w-tr pl">(?=<span><a class="pl-num" href="[^"]*">' + numero + "</a>)", '<div class="w-tr pl sel">', copia, count=1)


def aprobacion(t):
    t = con_vista(con_reglas(t))
    base = indice(t, "Actividad: no se pudo")
    t = sumar_estado(t, base, "Actividad: después de reintentar", "Actividad: no se pudo",
                     lambda n, c: reintento(c) if "<aside" in c[:200] else c)

    def rol(n, copia):
        if "<aside" in copia[:200]:
            a = copia.index("<aside")
            return copia[:a] + sin_personas(copia[a:cierre(copia, a, "aside")]) + copia[cierre(copia, a, "aside"):]
        if 'class="w-body"' in copia[:200]:
            return elegir_fila(copia, "VIS-000122")
        return copia
    return sumar_estado(t, base, "Actividad: el rol sin personas", "Actividad: después de reintentar", rol)


def aprobacion_tel(t):
    base = indice(t, "Actividad")

    def reint(n, copia):
        copia = cambiar(copia, '<div class="it pers"><b>Martín Paz</b><span class="e ">Entregado</span></div>',
                        f'<div class="it pers"><b>Martín Paz</b><small>{MOTIVO_PAZ}</small><small>{PIDIO}</small><span class="e mal">No se pudo</span>'
                        '<span class="ac"><button type="button" class="cb cb-sec">Reintentar</button></span></div>'
                        f'<div class="it pers"><b>Carlos Ruiz</b><small>{SE_FUE}</small><span class="e gris">No aplica</span></div>', 1)
        return cambiar(copia, 'Mandar por correo · Avisar a un rol</small></span>',
                       'Mandar por correo · Avisar a un rol</small><small>Martín Paz no recibió el aviso.</small></span>', 1)

    def rol(n, copia):
        a = copia.index('<div class="tr-moms">')
        b = cierre(copia, a, "div")
        moms = ('<div class="tr-moms"><div class="m"><span><b>Recibida</b><small>Por WhatsApp · Martín Paz</small></span><span class="h">12/10/2026, 17:40</span></div>'
                '<div class="m"><span><b>Al recibirla</b><small>Mandarle un mensaje a quien la cargó · Pedir aprobación a un rol</small><small>No se pudo pedir la aprobación.</small>'
                '</span><span class="h"><a class="ln" href="#actividad">1 de 2 hechas</a></span></div></div>')
        copia = copia[:a] + moms + copia[b:]
        a = copia.index('<div class="tr-ac5">')
        b = cierre(copia, a, "div")
        filas = ('<div class="tr-ac5"><div class="rev">Reglas de la revisión 3</div><div class="bd">Al recibirla</div><div class="it"><span class="fe">12/10/2026, 17:40</span>'
                 '<b>Se respondió el formulario</b><small>Por WhatsApp · Martín Paz</small><span class="e ">Hecho</span></div><div class="it"><span class="fe">17:40</span>'
                 '<b>Mandarle un mensaje a quien la cargó</b><small>Martín Paz</small><span class="msj">Recibimos VIS-000122. Te avisamos cuando la aprueben.</span>'
                 f'<span class="e ">Leído</span></div><div class="it"><span class="fe">17:40</span><b>Pedir aprobación a un rol</b><small>Rol Supervisor</small><small>{SIN_PERSONAS}</small>'
                 '<span class="e mal">No se pudo</span><span class="ac"><button type="button" class="cb cb-sec">Reintentar</button></span></div></div>')
        copia = copia[:a] + filas + copia[b:]
        for viejo, nuevo in (("<h1>VIS-000126</h1><span class=\"w-est \">Aprobada</span>", "<h1>VIS-000122</h1><span class=\"w-est off\">Recibida</span>"),
                             ('<span class="pos">5 de 10</span>', '<span class="pos">9 de 10</span>')):
            copia = cambiar(copia, viejo, nuevo, 1)
        return copia
    t = sumar_estado(t, base, "Actividad: después de reintentar", "Actividad", reint)
    return sumar_estado(t, base, "Actividad: el rol sin personas", "Actividad: después de reintentar", rol)


# ---------------------------------------------------------------------------------------------------- guardar sin «Ver respuestas» (239)
OCT = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
       'aria-hidden="true"><path d="M8.7 3h6.6L21 8.7v6.6L15.3 21H8.7L3 15.3V8.7z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/></svg>')
X16 = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
       'aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>')
VER_RESPUESTAS = "No se guardaron las reglas: un aviso que cita preguntas o adjunta el PDF pide también «Ver respuestas»."
TOAST_403 = (f'<div class="f-toast" role="alert"><span class="mal">{OCT}</span><span>{VER_RESPUESTAS}</span>'
             f'<button type="button" class="ib" aria-label="Cerrar">{X16}</button></div>')
TOAST_403_TEL = f'<div class="t-toast" role="alert"><span class="mal">{OCT}</span><span>{VER_RESPUESTAS}</span></div>'
SIN_VER = "Sin «Ver respuestas»"


def reglas(t):
    def cambio(n, copia):
        if 'class="w-oscuro"' in copia[:200]:
            return copia[:copia.index('<div class="w-oscuro">')] + TOAST_403 + "</sc-if>"
        return copia
    return sumar_estado(t, indice(t, "Otra persona guardó"), SIN_VER, "Otra persona guardó", cambio)


GUARDAR_APAGADO = ('<span class="e-tipw"><button type="button" class="cb cb-pri" disabled>Guardar reglas</button>'
                   '<span class="e-tip" role="tooltip" hidden>No hay cambios para guardar.</span></span>')


def reglas_bloque(t):
    def cambio(n, copia):
        if 'class="w-body"' in copia[:200]:
            copia = cambiar(copia, GUARDAR_APAGADO, '<button type="button" class="cb cb-pri">Guardar reglas</button>', 1)  # lo editado sigue ahí
            return copia[:-len("</sc-if>")] + TOAST_403 + "</sc-if>"
        return copia
    return sumar_estado(t, 0, SIN_VER, estados(t)[-1], cambio)


def reglas_tel(t):
    def cambio(n, copia):
        copia = re.sub(r'<div class="cg-tban" role="status"[^>]*>Reglas guardadas\.</div>', "", copia, count=1)
        copia = cambiar(copia, '<button type="button" class="cb cb-pri full" disabled>Guardar reglas<', '<button type="button" class="cb cb-pri full">Guardar reglas<', 1)
        return copia[:-len("</sc-if>")] + TOAST_403_TEL + "</sc-if>"
    return sumar_estado(t, indice(t, "Reglas guardadas"), SIN_VER, "Reglas guardadas", cambio)


# ---------------------------------------------------------------------------------------------------- el PDF (236 y 230)
ZONA = " (Buenos Aires)"
HORAS_PDF = re.compile(r"(\d\d/\d\d/2026, \d\d:\d\d)(?! \()(?=</span>|</p>|</div>|</small>|</b>| ·)")
UBICACION = "-34.603722, -58.381592"
CSS_PDF = ".pdf-sec .rw .ub-mapa { display: block; color: var(--marca); text-decoration: underline; }"


def pdf(t):
    """Las horas de la copia, con la zona de quien cargó (Tomás Acosta, de Buenos Aires); y un estado con la «Ubicación» (E20)."""
    def horas(bloque):
        a = bloque.find('<div class="pdf-')
        if a < 0:
            return bloque
        return bloque[:a] + HORAS_PDF.sub(lambda m: m.group(1) + ZONA, bloque[a:])
    partes, i = [], 0
    for m in re.finditer(r'<sc-if value="\{\{s\d+\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">', t):
        if m.start() < i:
            continue
        fin = cierre(t, m.start(), "sc-if")
        partes += [t[i:m.start()], horas(t[m.start():fin])]
        i = fin
    partes.append(t[i:])
    t = "".join(partes)
    t = con_css(t, CSS_PDF)

    def cambio(n, copia):
        if 'class="w-body"' not in copia[:200]:
            return copia
        m = re.search(r'(<span class="q-chk"><i>(?:(?!</i>).)*</i>Fecha de la visita</span>)', copia, re.S)
        copia = copia[:m.end()] + m.group(1).replace("Fecha de la visita", "Ubicación") + copia[m.end():]
        fila = '<div class="rw"><span>Fecha de la visita</span><span>13/10/2026</span></div>'
        return cambiar(copia, fila, fila + f'<div class="rw"><span>Ubicación</span><span>{UBICACION}<span class="ub-mapa">Ver en el mapa</span></span></div>', 1)
    return sumar_estado(t, 0, "Con la ubicación", estados(t)[-1], cambio)


# ---------------------------------------------------------------------------------------------------- el aviso a quien cargó (237)
FRENADA = "Tu respuesta PED-000047 de «Pedido de materiales» quedó frenada. Ya le avisamos a quien la administra."
I_AVISO = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" '
           'aria-hidden="true"><path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/>'
           '<path d="M9 12.5h6"/><path d="M9 16h4"/></svg>')
ESTADO_FRENADA = "Su regla se frenó"


def frenada(cls):
    return (f'<div class="{cls} sal"><span class="gl">{FRENADA}<span class="av-card"><span class="ic">{I_AVISO}</span><span class="t">'
            '<b>Aviso de la app</b><small>Regla frenada · Pedido de materiales</small></span></span></span><span class="pie">Automático · 17:40 · Leído</span></div>')


def con_dato(t, clave, valor):
    """Suma `clave` a los diccionarios por estado de la lógica (`{"Con el bloque": …}[e]`)."""
    def uno(m):
        if f'"{clave}"' in m.group(0):
            return m.group(0)
        return m.group(0)[:-len("}[e]")] + f', "{clave}": {json.dumps(valor[m.group(1)], ensure_ascii=False)}}}[e]'
    return re.sub(r'(\w+): \{"[^{}]*\}\[e\]', uno, t)


def avisos(t, cls="w-m"):
    def cambio(n, copia):
        m = re.search(rf'<div class="{cls} sal"><span class="gl">Recibimos tu pedido urgente PED-000047\..*?</div>', copia, re.S)
        if not m:
            return copia
        return copia[:m.end()] + frenada(cls) + copia[m.end():]
    t = sumar_estado(t, indice(t, "Con el bloque"), ESTADO_FRENADA, "Con el bloque", cambio)
    return con_dato(t, ESTADO_FRENADA, {"vistaPrevia": "Automático: Tu respuesta PED-000047 de «Pedido de materiales»…", "hora": "13/10/2026, 17:40"})


# ---------------------------------------------------------------------------------------------------- «Ubicación» en la E21 (230 y 78)
# Llega en la E20 (`FRM-Editor-Ubicacion`): en «Tipo de respuesta» de la E21 va última, después de «Cálculo», como allá. El teléfono
# (`M-FRM-Editor-21`) no dibuja la lista.
TIPO_CALCULO = '<span role="option" class="">Cálculo</span></div>'
TIPO_UBICACION = '<span role="option" class="">Cálculo</span><span role="option" class="">Ubicación</span></div>'


def editor_21(t):
    return cambiar(t, TIPO_CALCULO, TIPO_UBICACION, 1)


# ================================================================================================================ el tablero nuevo
# Exportar con el bloque (227, E19): el diálogo de la E15 (226, `FRM-Respuestas-Exportar`) sobre la planilla de «Pedido de materiales»
# (`FRM-Respuestas-19`), con «Filas» y el tope de 100.000 filas, que se ve después de pedirlo, en el aviso de abajo (210), como «No se
# pudo exportar». Se arma una vez: si el tablero ya existe, no se rehace (para rehacerlo, se borra y se corre de nuevo).
EXP19 = "FRM-Respuestas-Exportar-19"
EXP19_ESTADOS = ["Exportar", "Una por respuesta", "Más de 100.000 filas"]
FILAS = ("Una por ítem de Productos", "Una por respuesta")
AYUDA_FILAS = "Una por respuesta no trae las preguntas de cada ítem."
TOPE_FILAS = "El Excel tendría más de 100.000 filas, una por ítem. Acotá los filtros o sacá el bloque de las columnas."
CSS_EXP19 = ".w-tr.pl > span.pl-blq { white-space: normal; line-height: 1.4; padding-top: 8.6px/*12px*/; padding-bottom: 8.6px/*12px*/; overflow: visible; text-overflow: clip; }"
ABRE = re.compile(r'<sc-if value="\{\{s(\d+)\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">')


def interior(t, k, empieza):
    for m in ABRE.finditer(t):
        if int(m.group(1)) == k and t[m.end():].startswith(empieza):
            return t[m.end():cierre(t, m.start(), "sc-if") - len("</sc-if>")]
    raise AssertionError((k, empieza))


def filas_dlg(elegida):
    rds = "".join(f'<div class="ex-rd{" on" if n == elegida else ""}" role="radio" aria-checked="{"true" if n == elegida else "false"}">'
                  f'<span class="rd"></span>{nombre}</div>' for n, nombre in enumerate(FILAS))
    return (f'<div class="t2-grupo" role="radiogroup" aria-label="Filas"><span class="ex-tit">Filas{fi(AYUDA_FILAS)}</span>'
            f'<div class="ex-rds">{rds}</div></div>')


def exportar_19():
    if (PROJ / f"{EXP19}.dc.html").exists():
        return None
    base, r19 = leer("FRM-Respuestas-Exportar"), leer("FRM-Respuestas-19")
    assert 'data-t15t2="exportar"' in base, "falta el diálogo de la 226 en FRM-Respuestas-Exportar"
    banda = interior(r19, indice(r19, "Con filtros"), '<div class="w-bnd">')
    con_filtros = interior(r19, indice(r19, "Con filtros"), '<div class="w-body">')
    sin_filtros = interior(r19, indice(r19, "Planilla"), '<div class="w-body">')
    for viejo, nuevo in (('Respuestas <span class="c">45</span>', 'Respuestas <span class="c">9.870</span>'),
                         ("<span>1–10 de 45</span><span>10 por página · Página 1 de 5</span>", "<span>1–10 de 9.870</span><span>10 por página · Página 1 de 987</span>")):
        sin_filtros = cambiar(sin_filtros, viejo, nuevo, 1)
    dlg = interior(base, 0, '<div class="w-oscuro">')
    chips = "".join(f'<span class="t2-chip">{c}{EN_ITEM}</span>' for c in CHIPS)
    dlg = re.sub(r'<span class="t2-chips">.*?</span></span>', f'<span class="t2-chips">{chips}</span></span>', dlg, count=1, flags=re.S)
    dlg = cambiar(dlg, '<span class="k">Respuestas</span><span>4</span>', '<span class="k">Respuestas</span><span>2</span>', 1)
    dlg = cambiar(dlg, "Visita a cliente-2026-10-15.xlsx", "Pedido de materiales-2026-10-15.xlsx", 1)
    i = dlg.index('<div class="t2-grupo" role="radiogroup" aria-label="Columnas">')
    dialogos = [dlg[:i] + filas_dlg(0) + dlg[i:], dlg[:i] + filas_dlg(1) + dlg[i:]]
    tope = re.sub(r'<span class="k">Filtros</span><span><span class="t2-chips">.*?</span></span>',
                  '<span class="k">Filtros</span><span class="g-vacio">Ninguno</span>', dialogos[0], count=1, flags=re.S)
    tope = cambiar(tope, '<span class="k">Respuestas</span><span>2</span>', '<span class="k">Respuestas</span><span>9.870</span>', 1)
    dialogos.append(tope + f'<div class="f-toast" role="alert"><span class="mal">{OCT}</span><span>{TOPE_FILAS}</span>'
                    f'<button type="button" class="ib" aria-label="Cerrar">{X16}</button></div>')
    cuerpos = [con_filtros, con_filtros, sin_filtros]
    # Los estados 0 a 2 de la E15 toman banda, cuerpo y diálogo nuevos; los demás se van.
    partes, i = [], 0
    for m in ABRE.finditer(base):
        if m.start() < i:
            continue
        fin = cierre(base, m.start(), "sc-if")
        k, dentro = int(m.group(1)), base[m.end():fin - len("</sc-if>")]
        partes.append(base[i:m.start()])
        if k < 3:
            if dentro.startswith('<div class="w-bnd">'):
                dentro = banda
            elif dentro.startswith('<div class="w-body">'):
                dentro = cuerpos[k]
            elif dentro.startswith('<div class="w-oscuro">'):
                dentro = dialogos[k]
            else:
                assert not dentro.strip(), (k, dentro[:80])
            partes.append(m.group(0) + dentro + "</sc-if>")
        i = fin
    partes.append(base[i:])
    t = "".join(partes)
    opciones = ",".join(json.dumps(e, ensure_ascii=False) for e in EXP19_ESTADOS)
    t = re.sub(r'("estado":\{"editor":"enum","options":\[)[^\]]*(\],"default":")[^"]*"', lambda m: m.group(1) + opciones + m.group(2) + EXP19_ESTADOS[0] + '"', t, count=1)
    t = re.sub(r"const k = \[.*?\]\.indexOf\(e\);", lambda m: f"const k = {json.dumps(EXP19_ESTADOS, ensure_ascii=False)}.indexOf(e);", t, count=1)
    t = re.sub(r"      s([3-9]): k === \1,\r?\n", "", t)
    t = re.sub(r"miga: \[.*?\]\[k\]", lambda m: "miga: " + json.dumps(["Inicio / Gestión de formularios / Formularios / Pedido de materiales"] * 3, ensure_ascii=False) + "[k]", t, count=1)
    t = cambiar(t, "<title>Respuestas · Exportar a Excel</title>", "<title>Respuestas · Exportar con el bloque · etapa 19</title>", 1)
    t = con_css(t, CSS_EXP19)
    assert "{{s3}}" not in t and t.count('aria-label="Exportar respuestas a Excel"') == 3, t.count('aria-label="Exportar respuestas a Excel"')
    return t


# ================================================================================================================ el pase
PASES = {
    "FRM-Editor-Lineas": lineas,
    "M-FRM-Editor-Lineas": lineas_tel,
    "FRM-Editor-Calculo": calculo,
    "M-FRM-Editor-Calculo": calculo_tel,
    "FRM-Editor-Condiciones": condiciones,
    "M-FRM-Editor-Condiciones": condiciones_tel,
    "FRM-Publicar-19": publicar,
    "FRM-Respuestas-19": planilla_19,
    "M-FRM-Respuestas-19": planilla_19_tel,
    "FRM-Respuesta-19": detalle,
    "M-FRM-Respuesta-19": detalle,
    "WA-Chats-Respuesta-19": tarjeta,
    "M-WA-Conversacion-Respuesta-19": tarjeta,
    "FRM-Respuestas-21": planilla_21,
    "M-FRM-Respuestas-21": planilla_21_tel,
    "FRM-Respuestas-Propias-21": propias_21,
    "M-FRM-Respuestas-Propias-21": propias_21_tel,
    "FRM-Respuesta-Aprobacion": aprobacion,
    "M-FRM-Respuesta-Aprobacion": aprobacion_tel,
    "FRM-Editor-Reglas": reglas,
    "M-FRM-Reglas": reglas_tel,
    "FRM-Editor-Reglas-Bloque": reglas_bloque,
    "FRM-Pdf": pdf,
    "WA-Chats-Avisos": avisos,
    "M-WA-Conversacion-Avisos": lambda t: avisos(t, "ap-m"),
    "FRM-Editor-21": editor_21,
}

if __name__ == "__main__":
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    cambiados = []
    for nombre, pase in PASES.items():
        assert canvas["boards"].get(f"{nombre}.dc.html", {}).get("page") not in (None, "archivo"), nombre
        t = leer(nombre)
        nuevo = pase(t)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    nuevo = exportar_19()
    if nuevo:
        escribir(EXP19, nuevo)
        cambiados.append(EXP19)
    print("ok", len(PASES) + 1, "tableros,", len(cambiados), "cambiados")
    if cambiados:
        print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(cambiados))
