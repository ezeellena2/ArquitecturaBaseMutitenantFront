"""Las reglas, el PDF y el editor de la E21 con el traspaso 18 (tanda 3B de Diseño, 2026-11-26), en ocho tableros, como el
`FRM-Editor` aprobado de la E14 (v186): todo lo que se elige, en la pieza (262); nada debajo de otro dato (263); lo de una fila en
su ⋮ salvo ↑ ↓ ✎ 🗑 (261); el motivo de lo apagado en un tooltip, también en el teléfono (211), y el panel en dos grupos (275).

- **`FRM-Editor-Reglas` y `M-FRM-Reglas`:** cada lista que se elige pasa a la pieza: «Cuándo», el tipo de una acción, el rol, la
  persona, «A quién», la plantilla, cada variable, la pregunta y la condición de una condición, y su valor si es una opción. «Elegí la
  acción» abre la lista de la pieza, con «Pedir aprobación a un rol» apagada y su motivo en el tooltip, y «Agregar dato» conserva su
  botón y abre la misma lista, con el buscador adentro, el número primero y separado, y las preguntas (también «Correo del cliente»).
  El diseño que arma «Armar el PDF» pasa a su campo, «Diseño del PDF», y deja de ir debajo del tipo, y la plantilla se nombra sola
  («Comprobante», sin «· con documento» al lado) (206 y 263). «Pedir aprobación» suma,
  debajo del rol, «Puede decidir quien cargó» (sin marcar) y «Exigir motivo al rechazar» (marcada), cada una con su (i), y la (i)
  del rol deja de decir quién no decide, porque con la primera marcada ya no es cierto (276). Estados nuevos: «Pedir aprobación»
  (la regla 1 abierta, con la (i) de la primera casilla a la vista) y «Una opción que ya no está» (una condición sobre «Garantía»,
  que la versión 4 ya no tiene: la condición en rojo, «Esa opción ya no está: elegí otra.» debajo, y la regla no se guarda,
  `Forms.Rules.OptionUnavailable`, 239 y O41). En el teléfono, «Cuándo», cada parte de una condición, el tipo de cada acción y el
  rol son la pieza; «Agregar dato» la abre a pantalla completa, y los dos estados nuevos también están (262 y 276). La compu crece a
  1700 de alto, por las dos casillas.
- **`FRM-Editor-Reglas-Bloque` y `M-FRM-Reglas-Bloque`:** lo mismo, con «Elegí la pregunta» abierta en la pieza (once preguntas, con
  el buscador; las del bloque, «Productos › …»), el valor de cada condición en la pieza y el bloque en «Agregar dato» con «Bloque» en
  gris debajo (262).
- **`FRM-Pdf`:** el estilo, el color y las preguntas de cada sección, en la pieza (262; una lista de casillas para elegir pasa a la
  pieza múltiple); el encabezado del diseño lleva el logo y el nombre, y los datos de la página pública ya no van debajo del nombre
  (263: se ven en la vista previa), ni la leyenda de «Sin página pública» (lo dicen «Publicar la página» y la vista previa). En el PDF de «Pedido de materiales», cada dato de la opción de un catálogo va en su renglón
  («Proveedor · CUIT» y «Proveedor · Plazo de pago») y, en el bloque, en su columna («Producto · Precio») (263). La hoja del PDF no
  cambia de estilo. Estados nuevos: «Elegir el estilo», «Elegir el color» y «Preguntas de una sección».
- **`FRM-Editor-21` y `M-FRM-Editor-21`:** las preguntas en columnas, con «Tipo» y «Obligatoria» (263, como `FRM-Editor`); «Para
  quién es» y el tipo, en la pieza; «Dónde se completa» al lado del prefijo, con WhatsApp conectado (229, desde la E20). El tipo
  abierto trae los trece tipos con el buscador; estado nuevo «El tipo en el bloque», con «Pedido de materiales»: en una pregunta
  del bloque, «Correo» apagado con su motivo en el tooltip, como «Foto», «Documento» y «Ubicación», y «Elegir varias» con el suyo
  (196 y 262). En el teléfono, el tipo en la pieza, y estados nuevos «Elegir el tipo», «El tipo en el bloque» y «El formulario» (con
  «Dónde se completa» y cada pregunta como tarjeta, como `M-FRM-Editor`).
- **`FRM-Dar-De-Baja-21`:** «Deja de pasar» de «Visita a cliente», que es para empleados, suma «App · No se carga más» antes de
  «Chat · No se manda más», cada dato en su columna (229, 206 y 263); el editor de atrás, en columnas, con la pieza y «Dónde se
  completa», como `FRM-Editor-21`.

Corre una vez sobre los tableros de la v188 (si el bloque `<style data-t3b="e21-reglas">` ya está, no hace nada) y después pasa
`traspaso10_piezas_1004.py --tableros <los ocho>`, que escala el bloque nuevo de la compu, y parte en dos el panel de los cinco de la
compu (275, con las piezas de `e14_panel_1004.py`). Uso: `python e21_reglas_1004.py`.
"""
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e14_editor_1004 as e14e  # noqa: E402
import e14_panel_1004 as e14p  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-t3b="e21-reglas"'
SUFIJO = " · para aprobar"
SVG = r"<svg\b[^>]*>(?:(?!</svg>).)*</svg>"  # un dibujo, sin cruzar al siguiente
DIBUJO = "(" + SVG + ")"
COMPU = ["FRM-Editor-Reglas", "FRM-Editor-Reglas-Bloque", "FRM-Pdf", "FRM-Editor-21", "FRM-Dar-De-Baja-21"]
TELS = ["M-FRM-Reglas", "M-FRM-Reglas-Bloque", "M-FRM-Editor-21"]
TABLEROS = COMPU + TELS

leer, escribir, cierre, sc_ifs, renombrar, una, s_de, sumar_estados = (
    e14e.leer, e14e.escribir, e14e.cierre, e14e.sc_ifs, e14e.renombrar, e14e.una, e14e.s_de, e14e.sumar_estados)

# ---------------------------------------------------------------------------------------------------------------- los datos
TIPOS = ["Texto corto", "Texto largo", "Número", "Fecha", "Sí o no", "Correo", "Elegir una", "Elegir varias", "Elegir de un catálogo",
         "Foto", "Documento", "Cálculo", "Ubicación"]
# En una pregunta del bloque (177, 196 y 230), con los motivos de ArquitecturaBase («rows.notRepeated» y «rows.multipleReason»).
NO_VARIAS = "No se carga varias veces."
UNA_SOLA = "En un bloque se elige una sola opción."
EN_BLOQUE = {"Elegir varias": UNA_SOLA, "Correo": NO_VARIAS, "Foto": NO_VARIAS, "Documento": NO_VARIAS, "Ubicación": NO_VARIAS}
DONDE = "En la app y por WhatsApp"
DONDE_I = "Con «Solo en la app» no va por WhatsApp: se carga desde la app."
# 276, con los textos de ArquitecturaBase («rules.authorMayDecideHelp» y «rules.requireReasonHelp»), sin lo que llega en la E25
# (pasarla desde un documento) ni lo que no siempre es cierto (que el motivo le llega a quien cargó).
AUTOR = ("Puede decidir quien cargó", "Quien cargó la respuesta o la corrigió también puede aprobarla o rechazarla. Sirve cuando el "
         "rol tiene una sola persona: sin marcar, lo que ella carga no lo puede decidir nadie.")
MOTIVO = ("Exigir motivo al rechazar", "Marcada, para rechazar hay que escribir por qué. Sin marcar, el motivo es opcional.")
ROL_I_VIEJO = "Decide alguien con este rol que no la haya cargado ni corregido."
ROL_I = "Decide alguien con este rol."
# 239 y O41: una condición sobre una opción que la versión ya no tiene. «Motivo» tiene tres en la versión 4 (Venta nueva,
# Seguimiento y Reclamo); «Garantía» estaba en la 3.
IDA = "Garantía"
IDA_ERR = "Esa opción ya no está: elegí otra."
ELEGIR = ("Cuándo", "Pregunta", "Condición", "Rol", "Persona", "A quién", "Contacto", "Acción")
ESTILOS = [("Clásico", "Con líneas"), ("Moderno", "Con el color arriba"), ("Compacto", "En dos columnas")]
DISENO = "Diseño del PDF"
# La plantilla elegida, por su nombre: que lleva el documento se ve en gris en su lista, no junto al nombre (206 y 263).
NOMBRE = {"Comprobante · con documento": "Comprobante"}
CORREO_CLIENTE = [("Fecha de la visita", "Correo del cliente")]

CSS_REGLAS = """
/* E21 · La pieza (262) en el editor de reglas: del ancho de su campo; la de «Agregar dato», debajo de su botón, a la derecha. */
.rg2-ab .w-cmp .b2-env, .rg2-vars .b2-env, .rg2-a.min .b2-env { width: 100%; }
.rg2-a.min .b2-pkc { height: 34px; }
.rg5-env .b2-pkl { left: auto; right: 0; width: 300px; max-width: none; }
.rg2-ab:has(.b2-pkl), .rg2-a:has(.b2-pkl), .rg2-hz:has(.b2-pkl), .rg5-cond:has(.b2-pkl) { overflow: visible; }
.rg2-ab .w-cmp .b2-env > .acc-tip { left: 0; }
/* E21 · El diseño que arma «Armar el PDF», en su campo (263): el nombre y, a su lado, el enlace. */
.t3b-lee { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 14px; min-height: 36px; font-size: 14px; color: var(--t1); }
.t3b-lee .lnk { font-size: 13.5px; }
/* 276 · «Pedir aprobación»: las dos casillas debajo del rol, cada una con su (i). */
.t3b-apr { display: flex; align-items: center; gap: 2px; min-height: 24px; }
.t3b-apr .q-chk { font-size: 14px; }
.t3b-apr + .t3b-apr { margin-top: -6px; }
.t3b-apr .b2-i .acc-tip { left: -12px; max-width: 360px; }
/* 239 · La condición sobre una opción que ya no está, en rojo: el valor con su error y el texto debajo. */
.rg5-cond.t3b-mal { padding: 8px 10px; margin: 0 -10px; border-radius: 8px; background: oklch(0.975 0.02 25); }
.rg5-cond > .err2 { grid-column: 3; margin-top: -3px; font-size: 13px; color: var(--peligro); }
"""

CSS_TEL_REGLAS = """
/* E21 · La pieza (262) en el editor de reglas del teléfono. */
.rg-hb .ap-cmp .b2-env, .t-cond .b2-env { width: 100%; }
.t3b-lee { display: flex; align-items: center; min-height: 32px; font-size: 16px; color: var(--t1); }
/* 276 · Las dos casillas de «Pedir aprobación», con su (i), de 44 para tocar. */
.t3b-apr { display: flex; align-items: center; gap: 2px; min-height: 44px; margin: -6px 0; }
.t3b-apr .q-chk { font-size: 15px; }
.t3b-apr .b2-i { width: 44px; height: 44px; justify-content: center; align-items: center; margin-left: 0; }
.rg-hb .q-chk.t3b-des { opacity: 0.55; }
/* 239 · La condición sobre una opción que ya no está, en rojo. */
.t-cond.t3b-mal { border-color: oklch(0.85 0.06 25); background: oklch(0.975 0.02 25); }
.t-cond .err2 { display: block; margin-top: 6px; font-size: 14px; line-height: 1.4; color: var(--peligro); }
.ap-cmp .b2-pkc.err { border-color: oklch(0.6 0.19 25); box-shadow: 0 0 0 1px oklch(0.6 0.19 25); }
"""

CSS_EDITOR = """
/* E21 · «Dónde se completa», al lado del prefijo (229), y el tipo abierto en la pieza, con los trece tipos y el buscador (262). */
.q-ed .w-cmp .b2-pkl { min-width: 340px; }
.q-ed:has(.b2-pkl), .q-ab:has(.b2-pkl), .q-blq:has(.b2-pkl) { overflow: visible; }
/* E21 · Las preguntas del bloque, con las mismas columnas que las de afuera (263): el número es una pastilla («8.2») y la fila
   termina donde terminan las de afuera, así el tipo, «Obligatoria» y las acciones quedan alineados. */
.q-blq .q-it { grid-template-columns: 28px minmax(0, 1fr) 200px 76px 89px; padding-right: 6.6px; }
.q-blq { margin-right: 0; }
.e-tipw { position: relative; display: inline-flex; }
"""

CSS_TEL_EDITOR = """
/* E21 · «Dónde se completa» (229) y el tipo en la pieza (262), del ancho del campo. */
.ap-cmp .b2-env { width: 100%; }
/* Las tres maneras de sumar, debajo del título, como en la E20: no entran al lado. */
.ap-gtit.t3b-gacc { flex-direction: column; align-items: stretch; gap: 8px; }
.ap-gtit.t3b-gacc .acc { display: flex; justify-content: space-between; gap: 8px; }
"""

CSS_PDF = """
/* E21 · El estilo, el color y las preguntas de cada sección, en la pieza (262): el campo del ancho de la caja; el color, con su
   muestra al lado del nombre. */
.pd-b .w-cmp .b2-env { width: 100%; }
.t3b-sw { display: inline-block; flex: none; width: 14px; height: 14px; margin-right: 8px; border-radius: 50%; vertical-align: -2px; box-shadow: 0 0 0 1px var(--borde2); }
.t3b-qs { padding: 10px 14px 12px; }
.t3b-qs .w-cmp .rt { display: inline-flex; align-items: center; gap: 4px; }
.pd-sec:has(.b2-pkl) { overflow: visible; }
"""

# ---------------------------------------------------------------------------------------------------------------- utilidades
def con_css(t, css):
    assert MARCA not in t
    t = re.sub(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1).removesuffix(SUFIJO)}{SUFIJO}</title>", t, count=1)
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def partir(t):
    i, j = t.index("</helmet>"), t.index('<script type="text/x-dc"')
    return t[:i], t[i:j], t[j:]


def alto(t, px):
    """Un tablero más alto: el `$preview` del Tweak y el alto de la app, que pisa los de antes."""
    t, n = re.subn(r'"\$preview":\{"width":1440,"height":\d+\}', f'"$preview":{{"width":1440,"height":{px}}}', t)
    assert n == 1, n
    return t.replace(f"<style {MARCA}>\n", f"<style {MARCA}>\n.w-app {{ height: {px}px !important; }}\n", 1)


def svg_aria(t, aria):
    m = re.search(r'aria-label="%s"[^>]*>' % re.escape(aria) + DIBUJO, t, re.S)
    assert m, aria
    return m.group(1)


def clonar(t, origen, nombre, ancla, cambiar=lambda k, b: b):
    """Un estado nuevo, copia de `origen`: cada `sc-if` de primer nivel del origen se copia, renombrado, justo después del suyo, y
    `cambiar(k, bloque)` lo ajusta (k: 0 la banda, 1 el cuerpo, 2… lo que va encima)."""
    s = s_de(t, origen)
    t, sv = sumar_estados(t, [(ancla, nombre)])
    nuevo = sv[nombre]
    bloques = sc_ifs(t, s)
    for k, (a, b) in reversed(list(enumerate(bloques))):
        t = t[:b] + cambiar(k, renombrar(t[a:b], s, nuevo)) + t[b:]
    return t, nuevo


def capa(t, var, html):
    """Lo que va encima de todo en el teléfono (la pieza a pantalla completa), adentro del marco."""
    k = t.rindex("</div>\n</x-dc>")
    return t[:k] + f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{no}}}}">{html}</sc-if>' + t[k:]


def es_vacio(valor):
    return valor.startswith("Elegí")


def op_de(nombre, desc=None, **kw):
    return b2.op(nombre, desc, **kw)


def mas(nombres, tope=58):
    """Varias, por su nombre, y «y N más» si no entran (262)."""
    texto = ", ".join(nombres)
    if len(texto) <= tope:
        return texto
    for n in range(len(nombres) - 1, 0, -1):
        corto = ", ".join(nombres[:n]) + f" y {len(nombres) - n} más"
        if len(corto) <= tope:
            return corto
    return f"{nombres[0]} y {len(nombres) - 1} más"


# ---------------------------------------------------------------------------------------------------------------- la pieza
def aria_antes(cuerpo, i):
    """El nombre del campo de lo que se elige en `i`: su rótulo, o «Acción N» en una fila compacta, o la variable."""
    ventana = cuerpo[max(0, i - 1500):i]
    m = re.search(r'<span class="k">([^<]*)</span>$', ventana)
    if m:
        k = m.group(1).replace("​", "")
        return f"Acción {k}" if k.isdigit() else f"Variable {k.strip('{}')}"
    w = ventana.rfind('<div class="w-cmp')
    m = re.search(r'<span class="rt">(?:<span>)?([^<]+)', ventana[w:] if w >= 0 else ventana)
    return m.group(1).replace("*", "").strip() if m else ""


def ops_rg2(menu):
    """Las opciones de una lista vieja (`rg2-menu`): (nombre, descripción o motivo, apagada, activa, elegida)."""
    out = []
    for m in re.finditer(r'<span role="option"( aria-disabled="true")? class="(\w*)">([^<]*)(?:<small>([^<]*)</small>)?</span>', menu):
        apag, clase, nombre, small = bool(m.group(1)), m.group(2), m.group(3), m.group(4)
        out.append((nombre, small, apag, clase == "on"))
    assert out, menu[:200]
    return out


def lista_datos(menu, agregar=()):
    """«Agregar dato» (149): el número (y el motivo del rechazo) primero y separados, después las preguntas, con el buscador."""
    de_la_respuesta, preguntas, grupo = [], [], None
    for m in re.finditer(r'<span class="gr">([^<]*)</span>|<span class="op( on)?" role="option">([^<]*)(?:<small>([^<]*)</small>)?</span>', menu):
        if m.group(1):
            grupo = m.group(1)
            continue
        (de_la_respuesta if grupo == "De la respuesta" else preguntas).append((m.group(3), m.group(4), bool(m.group(2))))
    for despues, nuevo in agregar:
        if nuevo not in [p[0] for p in preguntas]:
            k = [p[0] for p in preguntas].index(despues)
            preguntas.insert(k + 1, (nuevo, None, False))
    ops = [op_de(n, d, activa=a) for n, d, a in de_la_respuesta]
    ops += [op_de(n, d, activa=a, sep=k == 0) for k, (n, d, a) in enumerate(preguntas)]
    return b2.lista(ops, buscar="", cantidad=f"{len(ops)} datos", barra=True), de_la_respuesta + preguntas


def piezas_reglas(cuerpo, agregar=()):
    """Todo lo que se elige en el editor de reglas, en la pieza (262)."""
    cuenta = {}

    # Apagada con su motivo (211): el contacto de «Mandar el PDF a un cliente».
    def apagada(m):
        cuenta["apagadas"] = cuenta.get("apagadas", 0) + 1
        return b2.campo(m.group(1), vacio=es_vacio(m.group(1)), apagado=m.group(3), aria="Contacto", tip_abierto=not m.group(2))
    cuerpo = re.sub(r'<span class="e-tipw"><div class="ct sel des"><span class="v">([^<]*)</span>' + SVG +
                    r'</div><span class="e-tip" role="tooltip"( hidden)?>([^<]*)</span></span>', apagada, cuerpo, flags=re.S)

    # «Elegí la acción», abierta: la lista de los menús, con lo apagado y su motivo en el tooltip.
    def accion(m):
        cuenta["acción abierta"] = cuenta.get("acción abierta", 0) + 1
        ops = [op_de(n, None if apag else d, apagada=d if apag else None, tip_abierto=apag, activa=act)
               for n, d, apag, act in ops_rg2(m.group(3))]
        # El motivo de la primera, debajo de ella, así no tapa el campo.
        lista = b2.lista(ops).replace('<span class="acc-tip " role="tooltip">', '<span class="acc-tip b2-tip-abajo" role="tooltip">', 1)
        return b2.campo(m.group(1), vacio=True, abierto=True, aria=m.group(2), extra=lista)
    cuerpo = re.sub(r'<div class="ct sel"><span class="v">(Elegí la acción)</span>' + SVG + r'</div><div class="rg2-menu" role="listbox" '
                    r'aria-label="([^"]*)">(.*?)</div>', accion, cuerpo, flags=re.S)

    # «Elegí la pregunta» de una condición, abierta: once preguntas, con el buscador; las del bloque, «Productos › …».
    def pregunta(m):
        cuenta["pregunta abierta"] = cuenta.get("pregunta abierta", 0) + 1
        ops, grupo = [], None
        for x in re.finditer(r'<span class="gr" role="presentation">([^<]*)</span>|<span role="option"(?: class="(sub)?( on)?")?>([^<]*)</span>',
                             m.group(2)):
            if x.group(1):
                grupo = x.group(1)
                continue
            nombre = f"{grupo} › {x.group(4)}" if x.group(2) else x.group(4)
            ops.append(op_de(nombre, activa=bool(x.group(3))))
        return b2.campo(m.group(1), vacio=True, abierto=True, aria="Pregunta",
                        extra=b2.lista(ops, buscar="", cantidad=f"{len(ops)} preguntas"))
    cuerpo = re.sub(r'<div class="ct sel foco"><span class="v">([^<]*)</span>' + SVG + r'</div><div class="rg5-preg" role="listbox" '
                    r'aria-label="Pregunta">(.*?)</div>', pregunta, cuerpo, flags=re.S)

    # «Agregar dato» conserva su botón y abre la lista de la pieza (149 y 262).
    def datos(m):
        cuenta["agregar dato"] = cuenta.get("agregar dato", 0) + 1
        return lista_datos(m.group(1), agregar)[0]
    cuerpo = re.sub(r'<div class="rg5-datos" role="listbox" aria-label="Agregar dato">(.*?)</div>', datos, cuerpo, flags=re.S)

    # El valor de una condición, si es una opción (un Sí o No, una opción de un catálogo): la pieza.
    def valor(m):
        if re.fullmatch(r"[\d.,]+", m.group(2)):
            return m.group(0)
        cuenta["valores"] = cuenta.get("valores", 0) + 1
        return m.group(1) + b2.campo(m.group(2), aria="Valor")
    cuerpo = re.sub(r'(<span class="rt">Valor</span>)<div class="ct">([^<]*)</div>', valor, cuerpo)

    # Las demás, cerradas, con lo elegido.
    def cerrada(m):
        clase, v1, v2 = m.group(1), m.group(2), m.group(3)
        assert not clase, clase
        v = NOMBRE.get(v1 if v1 is not None else v2, v1 if v1 is not None else v2)
        cuenta["cerradas"] = cuenta.get("cerradas", 0) + 1
        return b2.campo(v, vacio=es_vacio(v), aria=aria_antes(cuerpo, m.start()))
    cuerpo = re.sub(r'<div class="ct sel( [a-z]+)?">(?:<span class="v">([^<]*)</span>|([^<]*))' + SVG + r'</div>', cerrada, cuerpo, flags=re.S)
    assert 'class="ct sel' not in cuerpo and "rg2-menu" not in cuerpo and "rg5-datos" not in cuerpo and "rg5-preg" not in cuerpo

    # El diseño que arma «Armar el PDF», en su campo, y no debajo del tipo (263).
    cuerpo, n = re.subn(r'<span>«([^»]+)» · (<a class="lnk" href="FRM-Pdf\.dc\.html">Ver el diseño</a>)</span>',
                        lambda m: f'<div class="w-cmp"><span class="rt">{DISENO}</span><span class="t3b-lee">{m.group(1)}{m.group(2)}</span></div>',
                        cuerpo)
    cuenta["diseño"] = n
    print("  piezas:", cuenta)
    return cuerpo


def casillas(tilde, abierta=False, tel=False):
    """276 · Las dos casillas de «Pedir aprobación», debajo del rol, cada una con su (i)."""
    autor = (f'<div class="t3b-apr"><span class="q-chk" role="checkbox" aria-checked="false"><i class="no"></i>{AUTOR[0]}</span>'
             f'{b2.info(AUTOR[1], abierto=abierta)}</div>')
    motivo = (f'<div class="t3b-apr"><span class="q-chk" role="checkbox" aria-checked="true"><i>{tilde}</i>{MOTIVO[0]}</span>'
              f'{b2.info(MOTIVO[1])}</div>')
    return autor + motivo


def con_casillas(cuerpo, tilde):
    """Después del rol de cada «Pedir aprobación a un rol» abierta: sus dos casillas; la (i) del rol, cierta con las dos."""
    n = 0
    while True:
        i = cuerpo.find(f'aria-label="{ROL_I_VIEJO}"')
        if i < 0:
            break
        a = cuerpo.rfind('<div class="w-cmp">', 0, i)
        b = cierre(cuerpo, a, "div")
        campo = cuerpo[a:b].replace(ROL_I_VIEJO, ROL_I)
        cuerpo = cuerpo[:a] + campo + casillas(tilde) + cuerpo[b:]
        n += 1
    print("  pedir aprobación, con sus casillas:", n)
    return cuerpo


# ---------------------------------------------------------------------------------------------------------------- reglas (compu)
def reglas_compu(nombre, agregar=()):
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    t = con_css(t, b2.css(False) + CSS_REGLAS)
    if nombre == "FRM-Editor-Reglas":
        t = alto(t, 1700)  # la regla 1 abierta suma las dos casillas de «Pedir aprobación»
    cab, cuerpo, guion = partir(t)
    print(nombre)
    cuerpo = piezas_reglas(cuerpo, agregar)
    m = re.search(r'<span class="q-chk"><i>' + DIBUJO + '</i>', cuerpo, re.S)
    cuerpo = con_casillas(cuerpo, m.group(1) if m else b2.SVG_TILDE)
    t = cab + cuerpo + guion

    if nombre == "FRM-Editor-Reglas":
        # «Pedir aprobación»: la regla 1 abierta, sin el adjunto que no va (el PDF se arma al aprobar), con la (i) de la primera
        # casilla a la vista.
        adj_mal = re.compile(r'<div class="rg2-adj mal"><span class="q-chk"><i>' + SVG + r'</i>Adjuntar el PDF</span><span class="mot" '
                             r'role="alert">[^<]*</span></div>', re.S)
        motivo_pdf = "Este formulario pide aprobación: el PDF se arma al aprobarla."

        def aprobacion(k, b):
            if k != 1:
                return b
            b, n = adj_mal.subn('<div class="rg2-adj"><span class="e-tipw"><span class="q-chk des" aria-disabled="true"><i class="no"></i>'
                                f'Adjuntar el PDF</span><span class="e-tip" role="tooltip" hidden>{motivo_pdf}</span></span></div>', b)
            assert n == 1, n
            b = una(b, f'<span class="e-tip" role="tooltip">{motivo_pdf}</span>', f'<span class="e-tip" role="tooltip" hidden>{motivo_pdf}</span>')
            return una(b, b2.info(AUTOR[1]), b2.info(AUTOR[1], abierto=True))
        t, _ = clonar(t, "Adjuntar: con aprobación", "Pedir aprobación", "Editar una regla", aprobacion)

        # «Una opción que ya no está» (239, O41): la regla 3 con una condición sobre «Garantía»; el mensaje, sin el dato que falta.
        def opcion(k, b):
            if k != 1:
                return b
            b, n = re.subn(r'<div class="ct area mal">.*?</div><span class="err2" role="alert">[^<]*</span><div class="rg5-llega">.*?</div>',
                           '<div class="ct area">Se aprobó <span class="rg5-dato">Número</span>, de <span class="rg5-dato">Cliente</span>, por '
                           '<span class="rg5-dato">Monto estimado</span>.</div><div class="rg5-llega"><span class="k">Así llega</span>'
                           '<span class="v">Se aprobó VIS-000001, de Ejemplo de respuesta, por 12.500,5.</span></div>', b, flags=re.S)
            assert n == 1, n
            i = b.index('<div class="rg5-cond">')
            j = cierre(b, i, "div")
            quitar = re.search(r'<button type="button" class="ib" aria-label="Quitar la condición">' + SVG + "</button>", b[i:j], re.S).group(0)
            fila = ('<div class="rg5-cond t3b-mal">'
                    f'<div class="w-cmp"><span class="rt">Pregunta</span>{b2.campo("Motivo", aria="Pregunta")}</div>'
                    f'<div class="w-cmp"><span class="rt">Condición</span>{b2.campo("Es", aria="Condición")}</div>'
                    f'<div class="w-cmp"><span class="rt">Valor</span>{b2.campo(IDA, error=True, aria="Valor")}</div>'
                    f'{quitar.replace("Quitar la condición", "Quitar la condición 2")}'
                    f'<span class="err2" role="alert">{IDA_ERR}</span></div>')
            return b[:j] + fila + b[j:]
        t, _ = clonar(t, "Una pregunta que ya no está", "Una opción que ya no está", "Una pregunta que ya no está", opcion)
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- reglas (teléfono)
def piezas_tel(cuerpo):
    """En el teléfono: cada campo que se elige es la pieza (262), y el tipo de cada acción deja de ir junto a su número (263)."""
    cuenta = {}

    def campo(m):
        rot, valor = m.group(2), m.group(3)
        if rot not in ELEGIR and not (rot == "Valor" and not re.fullmatch(r"[\d.,]+", valor)):
            return m.group(0)
        cuenta["campos"] = cuenta.get("campos", 0) + 1
        return m.group(1) + b2.campo(valor, vacio=es_vacio(valor), aria=rot)
    cuerpo = re.sub(r'(<div class="ap-cmp"><span class="rt"><span>([^<]+)</span>(?:<span class="f-i"[^>]*>' + SVG + r'</span>)?</span>)'
                    r'<div class="ct">([^<]*)</div>', campo, cuerpo, flags=re.S)

    def accion(m):
        cuenta["acciones"] = cuenta.get("acciones", 0) + 1
        return (f'<div class="ap-cmp"><span class="rt"><span>Acción {m.group(1)}</span></span>'
                f'{b2.campo(m.group(2), aria=f"Acción {m.group(1)}")}</div>')
    cuerpo = re.sub(r'<b>Acción (\d+) · ([^<]+)</b>', accion, cuerpo)
    cuerpo, n = re.subn(r'(Armar el PDF</span>' + SVG + r'</button></div></div>)<span>«([^»]+)»</span>',
                        lambda m: m.group(1) + f'<div class="ap-cmp"><span class="rt"><span>{DISENO}</span></span>'
                                               f'<span class="t3b-lee">{m.group(2)}</span></div>', cuerpo, flags=re.S)
    cuenta["diseño"] = n
    print("  piezas del teléfono:", cuenta)
    return cuerpo


def hoja_datos(t, agregar=()):
    """La hoja «Agregar dato» pasa a la pieza a pantalla completa, con el buscador (262)."""
    m = re.search(r'<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Agregar dato">.*?<div class="t-datos">(.*?)</div>'
                  r'</div><div class="hp">.*?</div></div>', t, re.S)
    assert m, "sin la hoja «Agregar dato»"
    filas, grupo, primero = [], None, True
    for x in re.finditer(r'<span class="gr">([^<]*)</span>|<span>([^<]*)(?:<small>([^<]*)</small>)?</span>', m.group(1)):
        if x.group(1):
            grupo = x.group(1)
            continue
        sep = grupo == "Preguntas" and primero
        if grupo == "Preguntas":
            primero = False
        filas.append((x.group(2), x.group(3), False, None, sep))
    for despues, nuevo in agregar:
        nombres = [f[0] for f in filas]
        if nuevo not in nombres:
            filas.insert(nombres.index(despues) + 1, (nuevo, None, False, None, False))
    pieza = b2.pk_tel("Agregar dato", filas, buscar="", cantidad=f"{len(filas)} datos")
    print("  «Agregar dato» a pantalla completa:", len(filas), "datos")
    return t[:m.start()] + pieza + t[m.end():]


def mensaje_tel(ad, texto, llega):
    return (f'<div class="t-msj"><span class="rt"><span>Mensaje</span>{ad}</span><div class="ct">{texto}</div>'
            f'<div class="rg5-llega"><span class="k">Así llega</span><span class="v">{llega}</span></div></div>')


def reglas_tel(nombre, agregar=()):
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    t = con_css(t, b2.css(True) + CSS_TEL_REGLAS)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    cuerpo = hoja_datos(piezas_tel(cuerpo), agregar)
    t = cab + cuerpo + guion

    if nombre == "M-FRM-Reglas":
        ad = re.search(r'<span class="ad">' + SVG + r' Agregar dato</span>', t, re.S).group(0)
        t_mas = re.search(r'<span class="t-mas">' + SVG + r' Agregar condición</span>', t, re.S).group(0)
        t_acc = re.search(r'<span class="t-mas">' + SVG + r' Agregar acción</span>', t, re.S).group(0)
        tilde = re.search(r'<span class="q-chk"><i>' + DIBUJO + '</i>', t, re.S).group(1)
        dato = '<span class="rg5-dato">Número</span>'

        def cuerpo_regla(b, titulo, hb):
            b = una(b, "<h1>Regla 2</h1>", f"<h1>{titulo}</h1>")
            i = b.index('<div class="rg-hb">')
            j = cierre(b, i, "div")
            return b[:i] + f'<div class="rg-hb">{hb}</div>' + b[j:]

        # «Pedir aprobación» (276): la regla 1, con las dos casillas debajo del rol.
        hb = (f'<div class="ap-cmp"><span class="rt"><span>Cuándo</span></span>{b2.campo("Se recibe una respuesta", aria="Cuándo")}</div>{t_mas}'
              '<div class="acc"><div class="ap-cmp"><span class="rt"><span>Acción 1</span></span>'
              f'{b2.campo("Mandarle un mensaje a quien la cargó", aria="Acción 1")}</div>'
              + mensaje_tel(ad, f"Recibimos {dato}. Te avisamos cuando la aprueben.", "Recibimos VIS-000001. Te avisamos cuando la aprueben.")
              + '<span class="q-chk t3b-des" role="checkbox" aria-checked="false" aria-disabled="true"><i class="no"></i>Adjuntar el PDF</span></div>'
              '<div class="acc"><div class="ap-cmp"><span class="rt"><span>Acción 2</span></span>'
              f'{b2.campo("Pedir aprobación a un rol", aria="Acción 2")}</div>'
              f'<div class="ap-cmp"><span class="rt"><span>Rol</span></span>{b2.campo("Supervisor", aria="Rol")}</div>'
              f'{casillas(tilde, tel=True)}</div>{t_acc}')
        t, _ = clonar(t, "Editar una regla", "Pedir aprobación", "Editar una regla", lambda k, b: cuerpo_regla(b, "Regla 1", hb))

        # «Una opción que ya no está» (239, O41): la regla 3, con la condición sobre «Garantía» en rojo.
        cond1 = ('<div class="t-cond">'
                 f'<div class="ap-cmp"><span class="rt"><span>Pregunta</span></span>{b2.campo("Monto estimado", aria="Pregunta")}</div>'
                 f'<div class="ap-cmp"><span class="rt"><span>Condición</span></span>{b2.campo("Es mayor o igual a", aria="Condición")}</div>'
                 '<div class="ap-cmp"><span class="rt"><span>Valor</span></span><div class="ct">100.000</div></div></div>')
        cond2 = ('<div class="t-cond t3b-mal">'
                 f'<div class="ap-cmp"><span class="rt"><span>Pregunta</span></span>{b2.campo("Motivo", aria="Pregunta")}</div>'
                 f'<div class="ap-cmp"><span class="rt"><span>Condición</span></span>{b2.campo("Es", aria="Condición")}</div>'
                 f'<div class="ap-cmp"><span class="rt"><span>Valor</span></span>{b2.campo(IDA, error=True, aria="Valor")}'
                 f'<span class="err2" role="alert">{IDA_ERR}</span></div></div>')
        hb = (f'<div class="ap-cmp"><span class="rt"><span>Cuándo</span></span>{b2.campo("Se aprueba una respuesta", aria="Cuándo")}</div>'
              f'{cond1}{cond2}{t_mas}'
              '<div class="acc"><div class="ap-cmp"><span class="rt"><span>Acción 1</span></span>'
              f'{b2.campo("Avisar a un rol", aria="Acción 1")}</div>'
              f'<div class="ap-cmp"><span class="rt"><span>Rol</span></span>{b2.campo("Dueño", aria="Rol")}</div>'
              + mensaje_tel(ad, f'Se aprobó {dato}, de <span class="rg5-dato">Cliente</span>, por <span class="rg5-dato">Monto estimado</span>.',
                            "Se aprobó VIS-000001, de Ejemplo de respuesta, por 12.500,5.")
              + '<span class="q-chk" role="checkbox" aria-checked="false"><i class="no"></i>Adjuntar el PDF</span></div>' + t_acc)
        t, _ = clonar(t, "Editar una regla", "Una opción que ya no está", "Pedir aprobación", lambda k, b: cuerpo_regla(b, "Regla 3", hb))
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- el editor (compu)
def tipo_y_ob(desc):
    """De «Elegir varias · 4 opciones · de 1 a 3 · Obligatoria» salen el tipo («Elegir varias, hasta 3») y «Sí»; lo demás que iba
    debajo («3 opciones», «2 decimales», «1 condición», «hasta 600 caracteres») se ve al abrir la pregunta."""
    partes = desc.split(" · ")
    ob = {"Obligatoria": "Sí", "Opcional": "No"}[partes[-1]]
    base = partes[0].split(",")[0]
    base = "Elegir de un catálogo" if base == "De un catálogo" else base
    assert base in TIPOS, desc
    medio = partes[1:-1]
    rango = next((p for p in medio if re.fullmatch(r"de \d+ a \d+", p)), None)
    hasta = next((p for p in medio if re.fullmatch(r"hasta \d+", p)), None)
    if base == "Elegir varias" and rango:
        return f"Elegir varias, hasta {rango.split()[-1]}", ob
    if base == "Foto" and hasta:
        return f"Foto, {hasta}", ob
    return base, ob


ENCABEZADO = ('<div class="q-th" role="row"><span role="columnheader">#</span><span role="columnheader">Pregunta</span>'
              '<span role="columnheader">Tipo</span><span role="columnheader">Obligatoria</span>'
              '<span class="der" role="columnheader">Acciones</span></div>')


def filas_columnas(cuerpo):
    """Cada pregunta en columnas (263), como `FRM-Editor`: el número, el nombre, el tipo y «Obligatoria»; el encabezado arriba."""
    cab = re.compile(r'<div class="q-it( q-tit)?"><span class="num">(\d*)</span><span class="dato"><b>([^<]*)</b>'
                     r'(?:<span>([^<]*)</span>)?</span>(<span class="chips"></span>)?')
    out, pos, cuenta = [], 0, {"preguntas": 0, "títulos": 0}
    for m in cab.finditer(cuerpo):
        tit, num, nombre, desc = m.group(1), m.group(2), m.group(3), m.group(4)
        if tit:
            nuevo = f'<div class="q-it q-tit"><span class="num"></span><span class="dato"><b>{nombre}</b></span>'
            cuenta["títulos"] += 1
        else:
            tipo, ob = tipo_y_ob(desc)
            nuevo = (f'<div class="q-it"><span class="num">{num}</span><span class="dato"><b>{nombre}</b></span>'
                     f'<span class="q-tp">{tipo}</span><span class="q-ob">{ob}</span>')
            cuenta["preguntas"] += 1
        assert cuerpo[m.end():].startswith('<span class="q-acc2">'), cuerpo[m.end():m.end() + 80]
        out.append(cuerpo[pos:m.start()] + nuevo)
        pos = m.end()
    out.append(cuerpo[pos:])
    cuerpo = "".join(out)
    assert 'class="chips"' not in cuerpo
    cuerpo, n = re.subn(r'(<div class="f-cab"><span>Preguntas</span><span class="der">(?:(?!</div>).)*?</span></div>)'
                        r'(?=<div class="q-(?:it|ab)\b)', lambda m: m.group(1) + ENCABEZADO, cuerpo, flags=re.S)
    assert n == cuerpo.count('<div class="f-cab"><span>Preguntas</span>'), n
    print("  filas en columnas:", cuenta, "encabezados:", n)
    return cuerpo


def donde_se_completa(cuerpo):
    """229 · «Dónde se completa», al lado del prefijo, en la pieza; con su (i)."""
    i_svg = re.search(r'aria-label="Las respuestas se numeran [A-Z]+-000001\." title="[^"]*">' + DIBUJO, cuerpo, re.S).group(1)
    campo = (f'<div class="w-cmp"><span class="rt">Dónde se completa <span class="req">*</span><span class="f-i" tabindex="0" role="img" '
             f'aria-label="{DONDE_I}" title="{DONDE_I}">{i_svg}</span></span>{b2.campo(DONDE, aria="Dónde se completa")}</div>')
    out, pos, n = [], 0, 0
    for m in re.finditer(r'<div class="w-cmp"><span class="rt">Prefijo de numeración', cuerpo):
        fin = cierre(cuerpo, m.start(), "div")
        out.append(cuerpo[pos:fin] + campo)
        pos = fin
        n += 1
    out.append(cuerpo[pos:])
    print("  «Dónde se completa»:", n)
    return "".join(out)


def piezas_editor(cuerpo):
    """«Para quién es» y el tipo, cerrados, en la pieza (262)."""
    def cerrada(m):
        v = m.group(1)
        aria = "Para quién es" if v in ("Empleados", "Clientes", "Empleados y clientes") else "Tipo de respuesta"
        return b2.campo(v, aria=aria)
    cuerpo, n = re.subn(r'<div class="ct sel">([^<]*)' + SVG + r'</div>', cerrada, cuerpo, flags=re.S)
    assert 'class="ct sel' not in cuerpo
    print("  piezas cerradas:", n)
    return cuerpo


def lista_tipos(elegida, bloque=False, tip=None):
    ops = [op_de(n, elegida=n == elegida, activa=n == elegida, apagada=EN_BLOQUE.get(n) if bloque else None, tip_abierto=n == tip)
           for n in TIPOS]
    return b2.lista(ops, buscar="", cantidad=f"{len(TIPOS)} tipos")


def acciones(nombre, primero, ultimo, svgs):
    return (f'<span class="q-acc2"><button type="button" class="ib" aria-label="Subir {nombre}" aria-disabled="{"true" if primero else "false"}">'
            f'{svgs[0]}</button><button type="button" class="ib" aria-label="Bajar {nombre}" aria-disabled="{"true" if ultimo else "false"}">'
            f'{svgs[1]}</button><button type="button" class="ib" aria-label="Editar {nombre}">{svgs[2]}</button>'
            f'<button type="button" class="ib" aria-label="Quitar {nombre}">{svgs[3]}</button></span>')


def fila(num, nombre, tipo, ob, svgs, primero=False, ultimo=False):
    return (f'<div class="q-it"><span class="num">{num}</span><span class="dato"><b>{nombre}</b></span><span class="q-tp">{tipo}</span>'
            f'<span class="q-ob">{ob}</span>{acciones(nombre, primero, ultimo, svgs)}</div>')


# «Pedido de materiales», como en las reglas con el bloque y su PDF.
PEDIDO = [("1", "Cliente", "Texto corto", "Sí"), ("2", "¿Se concretó la venta?", "Sí o no", "Sí"), ("3", "Motivo", "Elegir una", "No"),
          ("4", "Monto", "Número", "No"), ("5", "Zona", "Elegir una", "No"), ("6", "Fecha de entrega", "Fecha", "No"),
          ("7", "Proveedor", "Elegir de un catálogo", "No"), ("8", "Productos", "Bloque", "Sí")]
PEDIDO_BLOQUE = [("8.1", "Producto", "Elegir de un catálogo", "Sí"), ("8.2", "Cantidad", "Número", "Sí"), ("8.3", "¿Urgente?", "Sí o no", "No")]
PEDIDO_FIN = [("9", "Total", "Cálculo", "—"), ("10", "Observaciones", "Texto largo", "No"), ("11", "Foto del remito", "Foto", "No")]


def preguntas_pedido(t, svgs, f_i, plus):
    """La caja «Preguntas» de «Pedido de materiales», en columnas, con «Cantidad», del bloque, abierta y su tipo en la pieza."""
    filas = [fila(n, nm, tp, ob, svgs, primero=n == "1") for n, nm, tp, ob in PEDIDO]
    blq = [f'<div class="q-blq-cab"><span>Preguntas de cada ítem</span><button type="button" class="cb cb-sec">{plus} Agregar pregunta</button></div>']
    for n, nm, tp, ob in PEDIDO_BLOQUE:
        f = fila(n, nm, tp, ob, svgs, primero=n == "8.1", ultimo=n == "8.3")
        if nm == "Cantidad":
            tilde = f"<i>{b2.SVG_TILDE}</i>"
            ed = ('<div class="q-ed"><div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">Cantidad</div></div>'
                  f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span>'
                  f'{b2.campo("Número", abierto=True, aria="Tipo de respuesta", extra=lista_tipos("Número", bloque=True, tip="Correo"))}</div>'
                  '<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>'
                  f'<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk">{tilde}Obligatoria</span></div>'
                  f'<div class="w-cmp lg-varias"><span class="q-chk">{tilde}Se carga varias veces</span><span class="f-i" tabindex="0" role="img" '
                  f'aria-label="Se carga una vez por ítem." title="Se carga una vez por ítem.">{f_i}</span></div>'
                  '<div class="q-pie ancho"><button type="button" class="cb cb-sec">Listo</button></div></div>')
            f = f'<div class="q-ab">{f}{ed}</div>'
        blq.append(f)
    filas.append(f'<div class="q-blq">{"".join(blq)}</div>')
    filas += [fila(n, nm, tp, ob, svgs, ultimo=n == "11") for n, nm, tp, ob in PEDIDO_FIN]
    return "".join(filas)


PV_BLOQUE = ('<div class="pv-hoja"><div class="pv-hc"><span class="pv-x">×</span>Productos · ítem 1</div><div class="pv-hb">'
             '<div class="pv-c">Producto<div class="pv-in">Elegí una opción @F@</div></div><div class="pv-c">Cantidad<div class="pv-in"></div></div>'
             '<div class="pv-c">¿Urgente? (opcional)<div class="pv-rd"><span><i></i>Sí</span><span><i></i>No</span></div></div>'
             '<div class="pv-c">¿Agregás otro ítem?<div class="pv-rd"><span><i></i>Sí</span><span><i></i>No</span></div></div></div>'
             '<div class="pv-pie"><div class="pv-bt">Continuar</div></div></div>')


def editor_compu():
    nombre = "FRM-Editor-21"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    t = con_css(t, e14e.CSS_COMPU + CSS_EDITOR)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    cuerpo = piezas_editor(donde_se_completa(filas_columnas(cuerpo)))
    t = cab + cuerpo + guion

    # «Tipos de respuesta: menú»: la pieza abierta, con los trece tipos y el buscador (262); la lista vieja se va.
    s1 = s_de(t, "Tipos de respuesta: menú")
    a, b = sc_ifs(t, s1)[1]
    bloque = t[a:b]
    bloque, n = re.subn(r'<div class="rg2-menu" role="listbox" aria-label="Tipo de respuesta"[^>]*>.*?</div>', "", bloque, flags=re.S)
    assert n == 1, n
    bloque = una(bloque, b2.campo("Correo", aria="Tipo de respuesta"),
                 b2.campo("Correo", abierto=True, aria="Tipo de respuesta", extra=lista_tipos("Correo")))
    t = t[:a] + bloque + t[b:]

    # «El tipo en el bloque»: «Pedido de materiales», con «Cantidad», del bloque, abierta: «Correo» apagado con su motivo (196).
    svgs = [svg_aria(t, f"{v} Cliente") for v in ("Subir", "Bajar", "Editar", "Quitar")]
    f_i = re.search(r'<span class="f-i" tabindex="0" role="img" aria-label="Las respuestas[^"]*" title="[^"]*">' + DIBUJO, t, re.S).group(1)
    plus = re.search(r'<button type="button" class="cb cb-sec">' + DIBUJO + ' Agregar pregunta</button>', t, re.S).group(1)

    def bloque_pedido(k, b):
        b = b.replace("Visita a cliente", "Pedido de materiales").replace("VIS-000001", "PED-000001").replace('<div class="ct ro">VIS</div>', '<div class="ct ro">PED</div>')
        if k == 0:
            return b
        b = una(b, 'Respuestas <span class="c">24</span>', 'Respuestas <span class="c">46</span>')
        b, n = re.subn(r'<button type="button" class="cb cb-sec">' + DIBUJO + ' Agregar bloque</button>',
                       lambda m: f'<span class="e-tipw"><button type="button" class="cb cb-sec" aria-disabled="true">{m.group(1)} Agregar bloque</button>'
                                 '<span class="e-tip" role="tooltip" hidden>Ya hay un bloque.</span></span>', b, flags=re.S)
        assert n == 1, n
        i = b.index(ENCABEZADO) + len(ENCABEZADO)
        caja = b.rfind('<div class="w-caja">', 0, i)
        j = cierre(b, caja, "div") - len("</div>")
        b = b[:i] + preguntas_pedido(t, svgs, f_i, plus) + b[j:]
        i = b.index('<div class="pv-hoja">')
        j = cierre(b, i, "div")
        return b[:i] + PV_BLOQUE.replace("@F@", b2.SVG_FLECHA) + b[j:]
    t, _ = clonar(t, "El tipo «Correo»", "El tipo en el bloque", "Tipos de respuesta: menú", bloque_pedido)
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- el editor (teléfono)
VISITA = [("1", "Cliente", "Texto corto", "Sí"), ("2", "Fecha de la visita", "Fecha", "Sí"), ("3", "Correo del cliente", "Correo", "No"),
          ("4", "¿Se concretó la venta?", "Sí o no", "Sí"), ("5", "Monto estimado", "Número", "No"), ("6", "Motivo", "Elegir una", "No"),
          ("7", "Fallas", "Elegir varias", "No"), ("8", "Observaciones", "Texto largo", "No"), ("9", "Fotos de la visita", "Foto, hasta 3", "No"),
          ("10", "Remito firmado", "Documento", "No")]


def editor_tel():
    nombre = "M-FRM-Editor-21"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    t = con_css(t, e14e.CSS_TEL + CSS_TEL_EDITOR)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    cuerpo = una(cuerpo, '<div class="ct">Correo</div>', b2.campo("Correo", aria="Tipo de respuesta"))
    t = cab + cuerpo + guion

    # «Elegir el tipo»: la pieza a pantalla completa, con los trece tipos y el buscador (262).
    t, v = clonar(t, "El tipo «Correo»", "Elegir el tipo", "El tipo «Correo»")
    t = capa(t, v, b2.pk_tel("Tipo de respuesta", [(n, None, n == "Correo", None) for n in TIPOS], buscar="", cantidad=f"{len(TIPOS)} tipos"))

    # «El tipo en el bloque»: «Cantidad», de «Productos»; «Correo» apagado con su motivo en el tooltip, abierto con un toque (211).
    def cantidad(k, b):
        b = una(b, "<h1>Correo del cliente</h1>", "<h1>Cantidad</h1>")
        b = una(b, '<span class="sub">Pregunta</span>', '<span class="sub">Pregunta del bloque Productos</span>')
        b = una(b, '<div class="ct">Correo del cliente</div>', '<div class="ct">Cantidad</div>')
        b = una(b, b2.campo("Correo", aria="Tipo de respuesta"), b2.campo("Número", aria="Tipo de respuesta"))
        b, n = re.subn(r'<button type="button" class="ap-i" aria-label="Qué significa" title="[^"]*">' + SVG + "</button>", "", b, flags=re.S)
        assert n == 1, n
        return b.replace('<span class="q-chk"><i class="no"></i>Obligatoria</span>', f'<span class="q-chk"><i>{b2.SVG_TILDE}</i>Obligatoria</span>')
    t, v = clonar(t, "El tipo «Correo»", "El tipo en el bloque", "Elegir el tipo", cantidad)
    t = capa(t, v, b2.pk_tel("Tipo de respuesta", [(n, None, n == "Número", EN_BLOQUE.get(n)) for n in TIPOS], buscar="",
                             cantidad=f"{len(TIPOS)} tipos", tip_en="Correo"))

    # «El formulario»: «Dónde se completa» al lado del prefijo (229) y cada pregunta como tarjeta (263), como `M-FRM-Editor`.
    m = (PROJ / "M-FRM-Editor.dc.html").read_text(encoding="utf-8")
    sv = {k: svg_aria(m, a) for k, a in (("volver", "Volver"), ("ver", "Así lo ve quien lo recibe"), ("keb", "Acciones de Visita a cliente"),
                                         ("subir", "Subir Cliente"), ("bajar", "Bajar Cliente"), ("editar", "Editar Cliente"), ("quitar", "Quitar Cliente"))}
    i_svg = svg_aria(t, "Qué significa")

    def tarjeta(n, nm, tp, ob, primero, ultimo):
        acc = (f'<span class="q-acc"><button type="button" class="ap-ib" aria-label="Subir {nm}" aria-disabled="{"true" if primero else "false"}">{sv["subir"]}</button>'
               f'<button type="button" class="ap-ib" aria-label="Bajar {nm}" aria-disabled="{"true" if ultimo else "false"}">{sv["bajar"]}</button>'
               f'<button type="button" class="ap-ib" aria-label="Editar {nm}">{sv["editar"]}</button>'
               f'<button type="button" class="ap-ib" aria-label="Quitar {nm}">{sv["quitar"]}</button></span>')
        return (f'<div class="b2-tj q-tj"><span class="num">{n}</span><span class="nm">{nm}</span>{acc}<span class="dl"><span class="c"><span class="k">Tipo</span>'
                f'<span class="v">{tp}</span></span><span class="c"><span class="k">Obligatoria</span><span class="v">{ob}</span></span></span></div>')

    def cmp(rot, valor, i=None, req=True):
        ii = (f'<button type="button" class="ap-i" aria-label="Qué significa" title="{i}">{i_svg}</button>' if i else "")
        return f'<div class="ap-cmp"><span class="rt"><span>{rot}{" <span class=\"rq\">*</span>" if req else ""}</span>{ii}</span>{valor}</div>'
    formulario = ('<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Formularios-21.dc.html">' + sv["volver"] + '</a>'
                  '<div class="tit"><h1>Visita a cliente</h1><span class="sub">Publicado · versión 4</span></div>'
                  f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{sv["ver"]}</button>'
                  f'<button type="button" class="ap-ib" aria-label="Acciones de Visita a cliente">{sv["keb"]}</button></div>'
                  '<div class="ap-cuerpo"><div class="ap-gtit">El formulario</div><div class="f-campos">'
                  + cmp("Nombre", '<div class="ct">Visita a cliente</div>') + cmp("Texto del botón final", '<div class="ct">Enviar</div>')
                  + cmp("Prefijo de numeración", '<div class="ct ro">VIS</div>', "Las respuestas se numeran VIS-000001.")
                  + cmp("Dónde se completa", b2.campo(DONDE, aria="Dónde se completa"), DONDE_I)
                  + cmp("Para quién es", b2.campo("Empleados", aria="Para quién es"))
                  + '</div><div class="ap-gtit t3b-gacc"><span>Preguntas</span><span class="acc"><a href="#">Agregar título</a>'
                  '<a href="#">Agregar bloque</a><a href="#">Agregar pregunta</a></span></div>'
                  '<div class="ap-grupo">' + "".join(tarjeta(n, nm, tp, ob, n == "1", n == "10") for n, nm, tp, ob in VISITA) + '</div></div>'
                  '<div class="ap-fijo"><a class="cb cb-pri full" href="#">Publicar en WhatsApp</a></div>')

    def form(k, b):
        i = b.index(">") + 1
        return b[:i] + formulario + "</sc-if>"
    t, _ = clonar(t, "El tipo «Correo»", "El formulario", "El tipo en el bloque", form)
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- dar de baja
def baja():
    nombre = "FRM-Dar-De-Baja-21"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    t = con_css(t, e14e.CSS_COMPU)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    cuerpo = piezas_editor(donde_se_completa(filas_columnas(cuerpo)))
    # 229 · «Visita a cliente» es para empleados: deja de cargarse en la app y de mandarse por el chat, cada uno en su renglón.
    cuerpo = una(cuerpo, '<div class="t15-dg"><span>Chat</span><span>No se manda más</span></div>',
                 '<div class="t15-dg"><span>App</span><span>No se carga más</span><span>Chat</span><span>No se manda más</span></div>')
    escribir(nombre, cab + cuerpo + guion, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- el PDF
def campo_color(nombre, fondo, **kw):
    return b2.campo(f'<i class="t3b-sw" style="background: {fondo};"></i>{nombre}', aria="Color", **kw)


def campo_preguntas(seccion, elegidas, abierta=False, opciones=()):
    extra = ""
    if abierta:
        extra = b2.lista([op_de(n, d, elegida=n in elegidas, multiple=True) for n, d in opciones], multiple=True)
    # En la columna del diseño entran unos 72 caracteres antes de «y N más».
    return b2.campo(mas(elegidas, tope=72), abierto=abierta, aria=f"Preguntas de {seccion}", extra=extra)


def pdf():
    nombre = "FRM-Pdf"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return False
    t = con_css(t, b2.css(False) + CSS_PDF)
    cab, cuerpo, guion = partir(t)
    print(nombre)
    colores = []

    def estilo(m):
        on = re.search(r'<span class="op on" role="radio" aria-checked="true"><span class="mini [a-z]+">.*?</span>([^<]+)<small>', m.group(0), re.S).group(1)
        return b2.campo(on, aria="Estilo")
    cuerpo, n1 = re.subn(r'<div class="pd-est" role="radiogroup" aria-label="Estilo">.*?</div>', estilo, cuerpo, flags=re.S)

    def color(m):
        sws = re.findall(r'<span class="sw( on)?" role="radio" aria-label="([^"]+)" title="[^"]*" style="background: ([^;]+);"></span>', m.group(0))
        if not colores:
            colores.extend((n, f) for _, n, f in sws)
        on = next((n, f) for o, n, f in sws if o)
        return campo_color(*on)
    cuerpo, n2 = re.subn(r'<div class="pd-col" role="radiogroup" aria-label="Color">.*?</div>', color, cuerpo, flags=re.S)

    def seccion(m):
        cabeza, nombre_sec, qs = m.group(1), m.group(2), m.group(3)
        opciones, elegidas, info = [], [], ""
        for x in re.finditer(r'<span class="q-chk"><i( class="no")?>(?:' + SVG + r')?</i>([^<]+)(<small class="pd-blq">Bloque</small>)?'
                             r'(<span class="f-i"[^>]*aria-label="([^"]*)"[^>]*>' + SVG + r'</span>)?</span>', qs, re.S):
            opciones.append((x.group(2), "Bloque" if x.group(3) else None))
            if not x.group(1):
                elegidas.append(x.group(2))
            if x.group(5):
                info = b2.info("El bloque va entero, en una tabla con el número del ítem y una columna por pregunta. Si no entra en la página, "
                               "sigue en la siguiente con su encabezado.")
        assert opciones, nombre_sec
        campo = (f'<div class="t3b-qs"><div class="w-cmp"><span class="rt">Preguntas{info}</span>'
                 f'{campo_preguntas(nombre_sec, elegidas)}</div></div>')
        return cabeza + campo
    cuerpo, n3 = re.subn(r'(<div class="h"><span>([^<]+)</span>.*?</div>)<div class="qs">(.*?)</div>', seccion, cuerpo, flags=re.S)
    # El encabezado del diseño: el logo y el nombre; los datos de la página pública se ven en la vista previa, y sin página
    # pública, el enlace «Publicar la página» y la vista previa ya lo dicen (263 y la lista de chequeo: sin leyendas).
    cuerpo, n4 = re.subn(r'(<div class="pd-enc">(?:<span class="lg">D</span>)?<span class="tx"><b>Grupo Delta</b>)<small>[^<]*</small>', r"\1", cuerpo)
    assert "pd-est" not in cuerpo.replace(".pd-est", "") and 'class="qs"' not in cuerpo
    print("  estilos:", n1, "colores:", n2, "secciones:", n3, "encabezados:", n4)
    t = cab + cuerpo + guion

    # El PDF de «Pedido de materiales»: cada dato de la opción de un catálogo en su renglón y, en el bloque, en su columna (263).
    s9 = s_de(t, "Con el bloque")
    a, b = sc_ifs(t, s9)[1]
    bl = t[a:b]
    bl = una(bl, '<div class="rw"><span>Proveedor</span><span>Aceros Rosario</span></div>',
             '<div class="rw"><span>Proveedor</span><span>Aceros Rosario</span></div><div class="rw"><span>Proveedor · CUIT</span>'
             '<span>30-70988123-4</span></div><div class="rw"><span>Proveedor · Plazo de pago</span><span>30 días</span></div>')
    bl = una(bl, "<th>Producto</th>", '<th>Producto</th><th class="r">Producto · Precio</th>')
    bl = una(bl, "<td>Caño de 1/2 pulgada</td>", '<td>Caño de 1/2 pulgada</td><td class="r">$ 4.300,00</td>')
    bl = una(bl, "<td>Codo de 90°</td>", '<td>Codo de 90°</td><td class="r">$ 1.000,00</td>')
    t = t[:a] + bl + t[b:]

    # Tres estados nuevos, sobre «Diseño»: el estilo, el color y las preguntas de una sección, abiertos.
    def abrir(viejo, nuevo):
        return lambda k, b: una(b, viejo, nuevo) if k == 1 else b
    t, _ = clonar(t, "Diseño", "Elegir el estilo", "Estilo compacto",
                  abrir(b2.campo("Clásico", aria="Estilo"),
                        b2.campo("Clásico", abierto=True, aria="Estilo",
                                 extra=b2.lista([op_de(n, d, elegida=n == "Clásico", activa=n == "Clásico") for n, d in ESTILOS]))))
    verde = colores[0]
    t, _ = clonar(t, "Diseño", "Elegir el color", "Elegir el estilo",
                  abrir(campo_color(*verde),
                        campo_color(*verde, abierto=True, extra=b2.lista([op_de(f'<i class="t3b-sw" style="background: {f};"></i>{n}',
                                                                                 "El del sistema" if k == 0 else None, elegida=k == 0, activa=k == 0)
                                                                          for k, (n, f) in enumerate(colores)]))))
    res = ["¿Se concretó la venta?", "Monto estimado", "Motivo", "Fallas", "Observaciones"]
    eleg = [n for n in res if n != "Fallas"]
    t, _ = clonar(t, "Diseño", "Preguntas de una sección", "Elegir el color",
                  abrir(campo_preguntas("El resultado", eleg),
                        campo_preguntas("El resultado", eleg, abierta=True, opciones=[(n, None) for n in res])))
    escribir(nombre, t, nl)
    return True


# ---------------------------------------------------------------------------------------------------------------- el panel
def panel(nombre):
    """275 · El panel en dos grupos: la línea sin título antes de «Catálogos». En la E21, «Formularios» lleva su número, que la
    pieza de la E14 no espera: la línea va acá, y `e14_panel_1004.partir` después ya la encuentra."""
    t, nl = leer(nombre)  # conserva el fin de renglón del tablero

    def partir_panel(m):
        p = m.group(0)
        if e14p.SEP in p:
            return p
        c = e14p.CATALOGOS.search(p)
        assert c and re.search(r"Formularios(?: <span class=\"cnt\">\d+</span>)?</a>", p[:c.start()]), nombre
        return p[:c.start()] + e14p.SEP + p[c.start():]
    nuevo, n = e14p.PANEL.subn(partir_panel, t)
    assert n, nombre
    if e14p.BLOQUE not in nuevo:
        nuevo = nuevo.replace("</helmet>", e14p.CSS + "</helmet>", 1)
    if nuevo != t:
        escribir(nombre, nuevo, nl)
    print("ok panel", nombre, n)


# ---------------------------------------------------------------------------------------------------------------- todo
if __name__ == "__main__":
    hechos = [reglas_compu("FRM-Editor-Reglas", agregar=CORREO_CLIENTE), reglas_compu("FRM-Editor-Reglas-Bloque"),
              reglas_tel("M-FRM-Reglas", agregar=CORREO_CLIENTE), reglas_tel("M-FRM-Reglas-Bloque"),
              pdf(), editor_compu(), editor_tel(), baja()]
    if any(hechos):
        subprocess.run([sys.executable, str(PROJ / "generadores" / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
        for nombre in COMPU:
            panel(nombre)
