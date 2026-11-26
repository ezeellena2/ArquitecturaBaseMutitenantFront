"""Los restos de la E12, la E13 y la E14 del traspaso 18, tanda 3A (lienzo v187, 2026-11-26). Los tableros ya están aprobados
(decisiones 284 y 285): esto solo los alinea con lo aprobado, sin « · para aprobar».

- **El editor del catálogo que se ve detrás de los modales, como el redibujado** (262 y 261):
  - E13 (`FRM-Catalogo-Opciones-13`, `FRM-Catalogo-Ordenar-13`, `FRM-Catalogo-Campos`), como `FRM-Catalogo-13`: «Título» y
    «Descripción» de «En WhatsApp» dejan los chips y el combo «Agregar campo» y van en la pieza múltiple cerrada, por su nombre
    («Texto»; «CUIT, Zona»); el valor de «Zona» en su celda, en la pieza cerrada; «Columnas», un botón de la barra que abre la
    pieza; la fila dada de baja deja «Reactivar» y vuelve a tener ↑ ↓ ✎ 🗑 con su ⋮, y las demás guardan el lugar del ⋮;
  - E12 (`FRM-Catalogo-Opciones`, `FRM-Catalogo-Ordenar`, `FRM-Catalogo-Importar`), como `FRM-Catalogo`: las filas, igual (261);
    en «Sin guardar: apagado» de `FRM-Catalogo-Ordenar` (un catálogo nuevo), «De dónde salen las opciones» y «Tipo de valor» en la
    pieza cerrada, antes del nombre, en lugar de «Escritas a mano · Texto»; en `FRM-Catalogo-Opciones-Propuesta`, las filas
    guardan el lugar del ⋮ y el de la por borrar se llama «Acciones de Reclamo», como en el editor;
  - los teléfonos que muestran el editor detrás de la hoja (`M-FRM-Catalogo-Ordenar` y `M-FRM-Catalogo-Ordenar-13`), como
    `M-FRM-Catalogo` y `M-FRM-Catalogo-13`: cada opción, una tarjeta con sus datos nombrados (263), «Reactivar» en el ⋮ (261) y, en
    la E13, «En WhatsApp» en la pieza múltiple y «Columnas» arriba de la lista. `FRM-Catalogo-Filtros` y `FRM-Catalogo-Contactos`
    ya estaban; los demás teléfonos son de pantalla completa y no cambian.
- **Los chats de la E14** (`WA-Chats-Formulario`, `WA-Chats-Formulario-Cliente` y sus teléfonos):
  - «No se pudo mandar» toma la forma de `WA-Chats-Base2` y `M-WA-Conversacion-Base2` (0066 §3): la palabra en rojo y, debajo, su
    motivo, uno de los ocho («WhatsApp no pudo entregarlo a ese número.»), sin la (i);
  - «Enviar formulario» apagado dice por qué en el tooltip de la 211, sin la (i) al lado: en la compu, con `aria-disabled` (se
    alcanza con Tab) y el tooltip abierto sobre el botón en cada estado que lo muestra; en el teléfono, sobre la opción de la hoja
    de acciones, abierto como con un toque;
  - la tarjeta del formulario en el chat (206 y 263): debajo del nombre, «Versión» y «Botón», cada uno con su rótulo, en renglones
    de lectura, en lugar de «Formulario · versión 3 · botón «Abrir formulario»». Lo mismo en `WA-Chats-Respuesta` y
    `M-WA-Conversacion-Respuesta`.
- **`M-WA-Chats`**, en «Clientes»: la fila de un chat cuyo último envío quedó «Sin confirmar» (240), con el punto y la palabra antes
  de la vista previa, como la fila de la compu en `WA-Chats-Formulario`.
- **«Revisar los cambios» de `FRM-Editor` y `M-FRM-Editor`** (263): la pregunta quitada «Monto estimado» deja «Número · 2 decimales
  · Opcional»; en la compu, el tipo, los decimales y si es obligatoria van cada uno en su renglón, con su nombre en la columna
  «Dato», y «Quitada» abarca los tres; en el teléfono, en renglones con rótulo bajo «Guardado actualmente».

Escribe las medidas de antes de la escala en un bloque `<style data-e14="t3">`, que lo frena si ya está, y al final corre
`traspaso10_piezas_1004.py --tableros` con sus tableros. Para volver a correrlo, primero se restauran sus tableros
(`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
"""
import io
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12  # noqa: E402
import e13_catalogo_1004 as e13  # noqa: E402
from base2_whatsapp_1004 import pies  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-e14="t3"'
SVG = r"<svg\b[^>]*>(?:(?!</svg>).)*</svg>"  # un solo ícono: nunca cruza su `</svg>`
TABLEROS = []


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    t = s.replace("\r\n", "\n")
    assert MARCA not in t, f"{nombre} ya tiene el bloque: restauralo antes de volver a correr"
    return t, nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    TABLEROS.append(nombre)
    print("ok", nombre, len(t))


def partir(t):
    """La cabeza (hasta `</helmet>`), el cuerpo y el guion."""
    i, j = t.index("</helmet>"), t.index('<script type="text/x-dc"')
    return t[:i], t[i:j], t[j:]


def con_css(cab, css):
    assert "</helmet>" not in cab
    return cab + f"<style {MARCA}>\n{css}</style>\n"


def subn(patron, cambio, t, cuantos):
    t, n = re.subn(patron, cambio, t, flags=re.S)
    assert n == cuantos, (patron[:80], n, cuantos)
    return t


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:120])
    return t.replace(viejo, nuevo)


def sufijo(css, prefijo):
    assert css.startswith(prefijo)
    return css[len(prefijo):]


# ---------------------------------------------------------------------------------------------------------------- el editor del catálogo detrás
FRM = io.open(PROJ / "FRM-Catalogo.dc.html", encoding="utf-8").read()
CSS_E12 = sufijo(e12.CSS_COMPU, b2.CSS_B2)
CSS_E13 = sufijo(e13.CSS_COMPU, b2.CSS_B2)
ORDEN_WA = ["Texto", "Código", "CUIT", "Zona", "Detalle"]


def en_whatsapp_compu(cuerpo, cuantas):
    """«Título» y «Descripción» de «En WhatsApp»: los chips y «Agregar campo» pasan a la pieza múltiple cerrada (262)."""
    out, pos, n = [], 0, 0
    for m in re.finditer(r'<span class="sels">', cuerpo):
        fin = e12.cierre(cuerpo, m.start(), "span")
        caja = cuerpo[m.start():fin]
        antes = cuerpo[:m.start()]
        parte = "Título" if antes.rfind("Título · hasta 30") > antes.rfind("Descripción · hasta 300") else "Descripción"
        nombres = sorted(re.findall(r'<span class="k-chip2">([^<]+)', caja), key=ORDEN_WA.index)
        assert nombres and 'aria-expanded="false"' in caja, caja[:120]
        out.append(cuerpo[pos:m.start()] + b2.campo(", ".join(nombres), aria=parte))
        pos, n = fin, n + 1
    out.append(cuerpo[pos:])
    assert n == cuantas, (n, cuantas)
    return "".join(out)


def catalogo_e13(nombre, estados):
    """Un modal de la E13 con el editor de `FRM-Catalogo-13` detrás, en `estados` cuerpos."""
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    flecha = re.search(r'<span class="w-pil">Columnas (' + SVG + ')', cuerpo, re.S).group(1)
    cuerpo = subn(r'<span class="w-pil">Columnas ' + SVG + r'</span>', lambda m: e13.columnas_compu(flecha), cuerpo, estados)
    cuerpo = en_whatsapp_compu(cuerpo, 2 * estados)
    cuerpo = subn(r'<span class="k-in sel"><span>([^<]+)</span>' + SVG + r'</span>', lambda m: b2.campo(m.group(1), aria="Zona"),
                  cuerpo, 10 * estados)
    cuerpo, _ = e12.filas_compu(cuerpo, de=FRM)
    for viejo in ('k-in sel', 'role="combobox"', 'class="k-chip2', '<span class="w-pil">', 'Reactivar</button>'):
        assert viejo not in cuerpo, (nombre, viejo)
    assert "<span>Agregar campo</span>" not in cuerpo and 'class="sels"' not in cuerpo, nombre
    escribir(nombre, con_css(cab, "/* E14 · t3: el editor de detrás, como `FRM-Catalogo-13`. */" + CSS_E13) + cuerpo + guion, nl)


def catalogo_e12(nombre, nuevos=0):
    """Un modal de la E12 con el editor de `FRM-Catalogo` detrás: las filas (261) y, en un catálogo nuevo, la pieza (262)."""
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    cuerpo, _ = e12.filas_compu(cuerpo, de=FRM)
    de = '<p class="k-de">Escritas a mano · Texto</p>'
    patron = re.escape(de) + r'(?=<div class="w-cmp"><span class="rt">Nombre <span class="req">\*</span></span><div class="ct ph">)'
    cuerpo = subn(patron, lambda m: e12.campos_nuevo(), cuerpo, nuevos)
    assert "Reactivar</button>" not in cuerpo
    escribir(nombre, con_css(cab, "/* E14 · t3: el editor de detrás, como `FRM-Catalogo`. */" + CSS_E12) + cuerpo + guion, nl)


def propuesta():
    """`FRM-Catalogo-Opciones-Propuesta`: las filas guardan el lugar del ⋮ (261), como en el editor."""
    nombre = "FRM-Catalogo-Opciones-Propuesta"
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    out, pos, cuenta = [], 0, {"keb": 0, "lugar": 0}
    for m in re.finditer(r'<span class="k-acc">', cuerpo):
        fin = e12.cierre(cuerpo, m.start(), "span")
        adentro = cuerpo[m.end():fin - 7]
        if 'aria-haspopup="menu"' in adentro:
            adentro = re.sub(r'aria-label="Más acciones de ([^"]+)"', r'aria-label="Acciones de \1"', adentro)
            cuenta["keb"] += 1
        else:
            adentro += '<span class="ib k-keb0" aria-hidden="true"></span>'
            cuenta["lugar"] += 1
        out.append(cuerpo[pos:m.end()] + adentro + "</span>")
        pos = fin
    out.append(cuerpo[pos:])
    print(nombre, cuenta)
    assert cuenta["keb"] == 3 and cuenta["lugar"] > 0
    css = "/* E14 · t3 · Las filas sin nada en el ⋮ guardan su lugar (261), como en `FRM-Catalogo`. */\n.k-acc .k-keb0 { visibility: hidden; }\n"
    escribir(nombre, con_css(cab, css) + "".join(out) + guion, nl)


def ordenar_tel():
    """`M-FRM-Catalogo-Ordenar`: el editor de detrás de la hoja, como `M-FRM-Catalogo` (tarjetas y ⋮)."""
    nombre = "M-FRM-Catalogo-Ordenar"
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    cuerpo, _ = e12.filas_tel(cuerpo)
    cuerpo = e12.tarjetas_tel(cuerpo)
    assert 'class="q-row' not in cuerpo and 'class="t-chip' not in cuerpo and "Reactivar</button>" not in cuerpo
    css = sufijo(e12.CSS_TEL, b2.CSS_B2 + b2.CSS_B2_TEL)
    escribir(nombre, con_css(cab, "/* E14 · t3: el editor de detrás, como `M-FRM-Catalogo`. */" + css) + cuerpo + guion, nl)


def ordenar_13_tel():
    """`M-FRM-Catalogo-Ordenar-13`: el editor de detrás de la hoja, como `M-FRM-Catalogo-13`."""
    nombre = "M-FRM-Catalogo-Ordenar-13"
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    out, pos, n = [], 0, 0
    for m in re.finditer(r'<div class="k-wa-t">', cuerpo):
        fin = e12.cierre(cuerpo, m.start(), "div")
        caja = cuerpo[m.start():fin]
        antes = cuerpo[:m.start()]
        parte = "Título" if antes.rfind("Título · hasta 30") > antes.rfind("Descripción · hasta 300") else "Descripción"
        nombres = sorted(re.findall(r'<span class="k-chip3">([^<]+)', caja), key=ORDEN_WA.index)
        assert nombres, caja[:120]
        out.append(cuerpo[pos:m.start()] + b2.campo(", ".join(nombres), aria=parte))
        pos, n = fin, n + 1
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert n == 12, n
    cuerpo = e13.tarjetas_tel(e13.filas_tel(cuerpo))
    boton = f'<div class="k-coltel"><button type="button" aria-haspopup="dialog">Columnas {b2.SVG_FLECHA}</button></div>'
    cuerpo = subn(r'(<div class="k-ops-b">.*?</div>)', lambda m: m.group(1) + boton, cuerpo, 7)
    for viejo in ('class="q-row', 'class="t-chip', 'class="k-chip3', "Reactivar</button>", 'class="ct sel"'):
        assert viejo not in cuerpo, viejo
    css = sufijo(e13.CSS_TEL, b2.css(tel=True))
    escribir(nombre, con_css(cab, "/* E14 · t3: el editor de detrás, como `M-FRM-Catalogo-13`. */" + css) + cuerpo + guion, nl)


# ---------------------------------------------------------------------------------------------------------------- los chats de la E14
MOTIVO = 2  # WhatsApp.Send.Undeliverable: «WhatsApp no pudo entregarlo a ese número.»
CARD = r'<small>Formulario · versión (\d+) · botón «([^»]+)»</small>'


def card(m):
    return (f'<span class="e14-cd"><span class="k">Versión</span><span class="v">{m.group(1)}</span>'
            f'<span class="k">Botón</span><span class="v">{m.group(2)}</span></span>')


CSS_CARD = """
/* E14 · t3 · La tarjeta del formulario en el chat (206 y 263): debajo del nombre, cada dato con su rótulo, en renglones de lectura. */
.c-card { align-items: flex-start; }
.c-card .t { flex: 1; min-width: 0; }
.c-card .e14-cd { display: grid; grid-template-columns: max-content minmax(0, 1fr); column-gap: @GAP@; row-gap: 2px; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--borde); font-size: @LETRA@; line-height: 1.35; }
.c-card .e14-cd .k { color: var(--t2); }
"""
CSS_CARD_COMPU = CSS_CARD.replace("@GAP@", "12px").replace("@LETRA@", "12px")
CSS_CARD_TEL = CSS_CARD.replace("@GAP@", "14px").replace("@LETRA@", "13px")
CSS_FALLO_COMPU = """
/* E14 · t3 · «No se pudo mandar» con su motivo debajo, como en `WA-Chats-Base2` (0066 §3). */
.w-m .pie.ta-fallo { color: var(--peligro); }
/* E14 · t3 · «Enviar formulario» apagado dice por qué en un tooltip sobre el botón (211), que se alcanza con Tab; acá, abierto. */
.w-escr .e14-apag { display: inline-flex; }
.w-escr .e14-apag .acc-tip { left: auto; right: 0; }
.w-escr .e14-apag .acc-tip::after { left: auto; right: 18px; }
"""
CSS_FALLO_TEL = """
/* E14 · t3 · «No se pudo mandar» con su motivo debajo, como en `M-WA-Conversacion-Base2` (0066 §3). */
.ap-m .pie.ta-fallo { color: var(--peligro); }
/* E14 · t3 · «Enviar formulario» apagado dice por qué en un tooltip sobre la opción, que se abre con un toque (211); acá, abierto. */
.ap-acciones .e14-apag { position: relative; }
.ap-acciones .e14-apag .acc-tip { left: 20px; bottom: calc(100% - 4px); }
"""


def apagado_compu(m):
    mot = m.group(2)
    return (f'<span class="b2-env e14-apag"><button type="button" class="cb cb-sec" aria-disabled="true" title="{mot}">{m.group(1)} '
            f'Enviar formulario</button>{b2.tip(mot)}</span>')


def apagado_tel(m):
    mot = m.group(1)
    return (f'<span role="menuitem" class="off e14-apag" aria-disabled="true" title="{mot}">Enviar formulario{b2.tip(mot)}</span>')


def chat_formulario(nombre, tel, fallos, apagados, tarjetas):
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    if tel:
        cuerpo = subn(r'<span class="pie mal">No se pudo mandar<button type="button" class="ap-i"[^>]*>' + SVG + r'</button></span>',
                      lambda m: pies(MOTIVO), cuerpo, fallos)
        cuerpo = subn(r'<span role="menuitem" class="off" aria-disabled="true" title="([^"]+)">Enviar formulario</span>', apagado_tel,
                      cuerpo, apagados)
    else:
        cuerpo = subn(r'<span class="pie mal">No se pudo mandar<span class="f-i"[^>]*>' + SVG + r'</span></span>',
                      lambda m: pies(MOTIVO), cuerpo, fallos)
        cuerpo = subn(r'<span class="f-off"><button type="button" class="cb cb-sec" disabled>(' + SVG + r') Enviar formulario</button>'
                      r'<span class="f-i" tabindex="0" role="img" aria-label="([^"]+)" title="\2">' + SVG + r'</span></span>',
                      apagado_compu, cuerpo, apagados)
    cuerpo = subn(CARD, card, cuerpo, tarjetas)
    assert "Formulario · versión" not in cuerpo and 'class="pie mal"' not in cuerpo
    assert 'class="f-off"' not in cuerpo and 'class="off" aria-disabled' not in cuerpo
    css = (CSS_FALLO_TEL + CSS_CARD_TEL) if tel else (CSS_FALLO_COMPU + CSS_CARD_COMPU)
    escribir(nombre, con_css(cab, css) + cuerpo + guion, nl)


def respuesta(nombre, tel):
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    cuerpo = subn(CARD, card, cuerpo, 10)
    escribir(nombre, con_css(cab, CSS_CARD_TEL if tel else CSS_CARD_COMPU) + cuerpo + guion, nl)


def chats_tel():
    """`M-WA-Chats`, «Clientes»: la fila de un chat con su último envío «Sin confirmar» (240), la segunda por fecha."""
    nombre = "M-WA-Chats"
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    i = cuerpo.index('<sc-if value="{{e0}}"')
    primera = cuerpo.index('<a class="w-conv" href="M-WA-Conversacion.dc.html">', i)
    fin = e12.cierre(cuerpo, primera, "a")
    assert "Martina López" in cuerpo[primera:fin]
    fila = ('<a class="w-conv" href="#"><span class="w-av">DR</span><span class="tx"><span class="l1"><b>Diego Romero</b>'
            '<span>27/09/2026, 10:33</span></span><span class="l2"><span class="e14-l2"><span class="b2-est aten">Sin confirmar</span>'
            '<span>Vos: El pedido sale mañana a primera hora.</span></span></span><span class="l3">Ventas · Lucía Fernández</span></span></a>')
    cuerpo = cuerpo[:fin] + fila + cuerpo[fin:]
    est = "\n".join(r for r in b2.CSS_B2.splitlines() if r.startswith((".b2-est {", ".b2-est::before", ".b2-est.aten::before")))
    assert est.count("\n") == 2
    css = ("\n/* E14 · t3 · La fila de un chat con un envío «Sin confirmar» (240): el punto y la palabra antes de la vista previa, como "
           "en la compu. */\n" + est + "\n.w-conv .l2 .e14-l2 { display: flex; align-items: center; gap: 8px; min-width: 0; }\n"
           ".w-conv .l2 .e14-l2 > .b2-est { flex: none; overflow: visible; color: var(--t2); }\n")
    escribir(nombre, con_css(cab, css) + cuerpo + guion, nl)


# ---------------------------------------------------------------------------------------------------------------- «Revisar los cambios»
def editor():
    nombre = "FRM-Editor"
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    cuerpo = una(cuerpo, '<span class="q dos">Monto estimado</span><span>Número · 2 decimales · Opcional</span><span><span class="g">Quitada</span></span>',
                 '<span class="q e14-r3">Monto estimado</span><span class="d">Tipo</span><span>Número</span>'
                 '<span class="e14-r3"><span class="g">Quitada</span></span><span class="d">Decimales</span><span>2</span>'
                 '<span class="d">Obligatoria</span><span>No</span>')
    css = ("\n/* E14 · t3 · Una pregunta quitada en «Revisar los cambios» (263): el tipo, los decimales y si es obligatoria, cada uno en su "
           "renglón con su nombre en «Dato»; la pregunta y «Quitada» abarcan los tres. */\n.e-cmp > .e14-r3 { grid-row: span 3; }\n")
    escribir(nombre, con_css(cab, css) + cuerpo + guion, nl)


def editor_tel():
    nombre = "M-FRM-Editor"
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    cuerpo = una(cuerpo, '<span class="v1">Número · 2 decimales · Opcional</span>',
                 '<span class="v1"><span class="e14-dl"><span class="k">Tipo</span><span>Número</span><span class="k">Decimales</span>'
                 '<span>2</span><span class="k">Obligatoria</span><span>No</span></span></span>')
    css = ("\n/* E14 · t3 · Una pregunta quitada en «Revisar los cambios» (263): lo guardado, en renglones con rótulo. */\n"
           ".t-cmp .e14-dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); column-gap: 10px; row-gap: 4px; }\n"
           ".t-cmp .e14-dl .k { color: var(--t2); }\n")
    escribir(nombre, con_css(cab, css) + cuerpo + guion, nl)


if __name__ == "__main__":
    catalogo_e13("FRM-Catalogo-Opciones-13", 1)
    catalogo_e13("FRM-Catalogo-Ordenar-13", 7)
    catalogo_e13("FRM-Catalogo-Campos", 1)
    catalogo_e12("FRM-Catalogo-Opciones")
    catalogo_e12("FRM-Catalogo-Ordenar", nuevos=1)
    catalogo_e12("FRM-Catalogo-Importar")
    propuesta()
    ordenar_tel()
    ordenar_13_tel()
    chat_formulario("WA-Chats-Formulario", False, fallos=1, apagados=4, tarjetas=6)
    chat_formulario("WA-Chats-Formulario-Cliente", False, fallos=0, apagados=2, tarjetas=5)
    chat_formulario("M-WA-Chats-Formulario", True, fallos=1, apagados=3, tarjetas=6)
    chat_formulario("M-WA-Chats-Formulario-Cliente", True, fallos=0, apagados=1, tarjetas=4)
    respuesta("WA-Chats-Respuesta", False)
    respuesta("M-WA-Conversacion-Respuesta", True)
    chats_tel()
    editor()
    editor_tel()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
