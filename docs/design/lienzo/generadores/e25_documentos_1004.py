"""Los documentos recibidos de la E25 con el traspaso 18 (tanda 3B de Diseño, grupo L, 2026-11-26): el chat, la bandeja, la
respuesta y el Inicio, redibujados en su lugar con la forma que dejaron la E14 (`e14_listados_1004.py`), la planilla de la E15 y
la respuesta de la E21 (`e21_respuesta_1004.py`, grupo F1, que se importa sin cambiarlo).

**En los ocho** (261 a 264 y 211): ninguna fila lleva un botón con texto, todo lo que se elige va en la pieza, nada va debajo de
otro dato ni unido con «·» (en la línea gris de quién y cuándo, una frase: «Lo mandó Tomás Acosta por WhatsApp el …»), y lo
apagado dice por qué en un tooltip sobre el mismo control, también en el teléfono. El panel de «Gestión de formularios» no se toca:
lo parte en dos grupos, con «Biblioteca», quien lanzó la tanda, para todos los tableros de la E22 en adelante.

**Por tablero:**
- `WA-Chats-Documento` y `M-WA-Chats-Documento` (270, 277 y 78, con la E24): el panel de WhatsApp dice «Asistentes», y el chat
  muestra el nombre del asistente que contesta, como `WA-Chats-Casos-24`: Tomás está en «Carga de pedidos», un equipo sin
  asistente, así que contesta el principal, «Delta», en la cabecera, la lista, cada respuesta y la vista previa. «Por qué lo
  propuso» deja de juntar datos con «·»: «Leyó» y «Dudoso» van en su renglón. Estados nuevos: «Un PDF de más páginas» (el PDF de
  14 páginas, con las 10 de «Páginas de un PDF» de la configuración dichas con su número, 270) y «Una cuenta sin su forma» (la
  cuenta de destino es un número interno, «Cta. Cte. 4587-02145/3», que no es CBU, CVU ni alias: no se propone, queda vacía como
  lo que no se leyó y «Por qué lo propuso» dice que quedó sin leer, 277).
- `FRM-Documentos` (261 a 264, 271, 272 y 277): **la tabla**, con la planilla de la E21 como modelo: el estado va segundo, después
  del documento, como en la planilla de respuestas de la E21 (N°, Estado), así se lee sin desplazar; «Es cliente» en todas las
  vistas (206); «Lo leído» dice solo lo leído (la fila de una planilla ya no junta «Fila 4 de 7 ·»); el encabezado ordena, con ↓
  después de «Llegó», el orden sin elegir, y «Ordenar por», último y separado de los filtros, dice «Llegó, más reciente primero»
  (264); la última columna, fija a la derecha, es el ⋮ de la fila: «Revisar» y «Descartar» de un propuesto o un sin clasificar, y
  «Volver a abrir» de un descartado (261); una confirmada o cargada no tiene ⋮ y su lugar queda. Quien solo ve no tiene ⋮. **El
  porqué del estado**, en su (i): «Protegido: tiene contraseña.», el tope del día y «Nadie lo revisó en 60 días: venció.», con los
  días de «Vencer los propuestos sin revisar» de la configuración (272; el ejemplo usa 60 para que se note que no son fijos); la
  (i) del título dice los dos plazos. **La barra:** los filtros son botones que abren la pieza, sin cantidades, y en «Filtros» cada
  pregunta es la pieza (262; «Martina López», con «Cliente» en gris debajo). **El panel:** «Formulario» es la pieza, abierta en
  «Cambiar el formulario» y apagada en «Solo ver» (286); «Cliente» y «Moneda», que se eligen, también; «Pasar al formulario»
  apagado dice por qué en su tooltip («Elegí un formulario.», o «Esperá a que termine de leer los datos.» mientras vuelve a leer);
  «La revisó» y «La cargó» separan la persona de la fecha. «Cargando» pasa de las filas esqueleto al encabezado con el aro (160).
  Estados nuevos: «Estado abierto», «Ordenar por abierto», «Ordenado por Formulario» (de la A a la Z, lo vacío al final),
  «Acciones de una fila», «Venció: volver a abrir» (sin el panel, que taparía la columna fija), «Un dato sin su forma» (277: la
  cuenta de destino del comprobante es un número interno, y queda vacía, «No se leyó», como lo que no se leyó, mientras la que tiene
  la forma y no da sigue marcada en «Un dato que no pasa») y «Relectura para mañana» (271: al publicar «Remito de entrega», que se
  armó con los remitos sin clasificar, el primero se relee y queda «Propuesto», y a los otros dos no les alcanza el cupo del día de
  quien lo armó: «Se lee de nuevo mañana: se llegó al tope de relecturas del día.», en la (i) de su estado y en el panel).
- `M-FRM-Documentos`: cada fila es una tarjeta con Formulario, Mandó, Llegó y Estado nombrados (263), el ícono del archivo y su ⋮,
  que abre una hoja con «Revisar», «Descartar» o «Volver a abrir» (261); «Ordenar por» arriba de la lista, a todo el ancho (264);
  el detalle lleva el estado en la barra y la línea gris en una frase, «Formulario» en la pieza y «Pasar al formulario» apagado con
  su motivo en un tooltip (211); «Venció», con los 60 días y su (i). Estados nuevos: «Filtros» (cada filtro con su nombre y la
  pieza), «Ordenar por», «Acciones de una fila» (la hoja del ⋮), «Un dato sin su forma» (desplazado hasta las cuentas, con
  «Cuenta de destino» vacía) y «Relectura para mañana» (el primer remito, propuesto; el segundo, con la (i) de su estado abierta).
- `FRM-Respuesta-25` y `M-FRM-Respuesta-25` (266 y 267): la respuesta como el formulario de «Cobro a cliente», versión 2, con las
  piezas de la E21: «Datos» con sus quince preguntas en su control de solo lectura (Cliente y Moneda, la pieza cerrada; Concepto, el
  renglón entero; lo que el comprobante no traía, vacío) y «Fotos y documentos» con el comprobante en su pregunta de documento.
  Arriba, solo la línea gris de quién y cuándo; los momentos y «Lectura del documento» pasan a la actividad, renglón por renglón: «La
  pasó desde un documento», con quién (Lucía Fernández), cuándo y el documento en «Detalle», que abre la bandeja; la que confirmó
  quien la mandó, «La mandó» Delta prellenada y «La respondió» Tomás; la cargada sola, «Se cargó automáticamente» y el aviso.
  Estados nuevos: la actividad de cada caso y «Pantalla completa»; en el teléfono, «Actividad».
- `Asistente-Org-25` y `M-Asistente-Org-25` (268): la tarjeta «Ya no disponible», plegada como la de una acción, con su motivo al
  lado: «Ya no disponible: sin el permiso» («Ya no tenés el permiso «Diseñar formularios».»), «Ya no disponible: sin Formularios»
  («Formularios está apagado en Grupo Delta.») y «Ya no disponible: el catálogo ya no está» («El catálogo «Proveedores» ya no
  está.», al importar).

Cambia los tableros en su lugar; no corre dos veces (el bloque `<style data-t3b="e25-documentos">` lo frena). Al final pasa
`traspaso10_piezas_1004.py --tableros <los ocho>`, que pone la escala de la compu. `FRM-Respuesta-25` crece a 1100 de alto.

Uso: `python e25_documentos_1004.py`.
"""
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12e  # noqa: E402
import e21_respuesta_1004 as e21  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
GRUPO = "e25-documentos"
MARCA = f'<style data-t3b="{GRUPO}">'
SUFIJO = " · para aprobar"
TABLEROS = ["WA-Chats-Documento", "M-WA-Chats-Documento", "FRM-Documentos", "M-FRM-Documentos", "FRM-Respuesta-25",
            "M-FRM-Respuesta-25", "Asistente-Org-25", "M-Asistente-Org-25"]
cierre, sc_ifs, renombrar = e12e.cierre, e12e.sc_ifs, e12e.renombrar
leer, escribir = e21.leer, e21.escribir

SVG_KEB, SVG_REVISAR, SVG_REABRIR = b2.SVG_KEB, b2.SVG_REVISAR, b2.SVG_REENVIAR
SVG_DESCARTAR = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
                 'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/></svg>')


# ---------------------------------------------------------------------------------------------------------------- comunes
def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (viejo[:90], t.count(viejo))
    return t.replace(viejo, nuevo)


def todas(t, viejo, nuevo, minimo=1):
    n = t.count(viejo)
    assert n >= minimo, (viejo[:90], n)
    return t.replace(viejo, nuevo)


def con_titulo(t):
    m = re.search(r"<title>([^<]*)</title>", t)
    assert not m.group(1).endswith(SUFIJO), m.group(1)
    return t[:m.end(1)] + SUFIJO + t[m.end(1):]


def con_css(t, css):
    assert MARCA not in t
    return t.replace("</helmet>", f"{MARCA}\n{css}</style>\n</helmet>", 1)


def bloques(t, rx=r'<sc-if value="\{\{(s\d+)\}\}"'):
    """Los `sc-if` de primer nivel de cada estado: [(inicio, fin, variable)], en orden."""
    out, hasta = [], -1
    for m in re.finditer(rx, t):
        if m.start() < hasta:
            continue
        fin = cierre(t, m.start(), "sc-if")
        out.append((m.start(), fin, m.group(1)))
        hasta = fin
    return out


def por_bloque(t, fn):
    """Aplica `fn(variable, bloque)` a cada `sc-if` de estado y devuelve el tablero con lo que devuelve."""
    partes, pos = [], 0
    for a, b, var in bloques(t):
        partes.append(t[pos:a] + fn(var, t[a:b]))
        pos = b
    return "".join(partes) + t[pos:]


def copiar_estado(t, base, nuevo, cambiar=lambda b: b):
    """Cada `sc-if` del estado `base`, copiado para `nuevo` justo después del suyo; `cambiar(bloque)` ajusta la copia (o la saca,
    devolviendo "")."""
    for a, b in reversed(sc_ifs(t, base)):
        t = t[:b] + cambiar(renombrar(t[a:b], base, nuevo)) + t[b:]
    return t


def var_de(t, nombre):
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    return f"s{lista.index(nombre)}"


def sumar(t, despues, nuevos):
    """Suma estados al enum y a `renderVals` (también cuando las `sN` van en un solo renglón)."""
    if re.search(r"\n      s\d+: k === \d+,\n", t):
        return e12e.sumar_estados(t, despues, nuevos)
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    ops = props["estado"]["options"]
    for ancla, nombres in despues:
        k = ops.index(ancla) + 1
        ops[k:k] = nombres
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    m = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    lista = json.loads(m.group(1))
    base = len(lista)
    lista += nuevos
    t = t[:m.start(1)] + json.dumps(lista, ensure_ascii=False) + t[m.end(1):]
    ult = f"s{base - 1}: k === {base - 1} }};"
    t = una(t, ult, f"s{base - 1}: k === {base - 1}, " + ", ".join(f"s{base + i}: k === {base + i}" for i in range(len(nuevos))) + " };")
    assert sorted(ops) == sorted(lista)
    return t, {n: f"s{base + i}" for i, n in enumerate(nuevos)}


def menu(nombre, opciones, arriba=False):
    """El ⋮ abierto de una fila (261): cada opción con su ícono; en las últimas filas, hacia arriba."""
    items = "".join(f'<button type="button" class="e25-mi" role="menuitem">{ic}<span>{tx}</span></button>' for tx, ic in opciones)
    return f'<div class="e25-menu{" arriba" if arriba else ""}" role="menu" aria-label="Acciones de {nombre}">{items}</div>'


def hoja_menu(titulo, opciones):
    return e21.hoja_menu(titulo, [(ic, tx, "", None) for tx, ic in opciones])


CSS_HOJA_TEL = """
/* El ⋮ de una fila en el teléfono: una hoja con sus opciones (261), como la E21. */
.ap .ra-hops { display: flex; flex-direction: column; }
.ap .ra-hop { display: flex; align-items: center; gap: 14px; min-height: 56px; border-bottom: 1px solid var(--borde); color: var(--t1); font-size: 16px; text-decoration: none; }
.ap .ra-hop:last-child { border-bottom: 0; }
.ap .ra-hop svg { width: 20px; height: 20px; flex: none; color: var(--t2); }
"""


# ---------------------------------------------------------------------------------------------------------------- el chat
ASISTENTE = "Delta"  # «Carga de pedidos» no tiene asistente: contesta el principal (E24)


def nombre_asistente(t, tel=False):
    """El nombre del asistente que contesta, como `WA-Chats-Casos-24`: en cada respuesta, su pie, la cabecera y la lista."""
    t = re.sub(r'(<span class="aut">(?:<svg.*?</svg>)?) Asistente</span>', rf"\1 {ASISTENTE}</span>", t, flags=re.S)
    t = todas(t, '<span class="pie">Asistente · ', f'<span class="pie">{ASISTENTE} · ')
    if tel:
        t = una(t, "'Ventas · Asistente'", f"'Carga de pedidos · {ASISTENTE}'")
    else:
        t = re.sub(r'(<span class="as-modo on">(?:<svg.*?</svg>)?) Asistente</span>', rf"\1 {ASISTENTE}</span>", t, count=1, flags=re.S)
        t = una(t, '<span class="as-tag">Asistente</span>', f'<span class="as-tag">{ASISTENTE}</span>')
        t = todas(t, '"Asistente: ', f'"{ASISTENTE}: ')
        t, n = re.subn(r'<a class="w-ln" href="WA-Asistente\.dc\.html">(<svg.*?</svg>) Asistente</a>',
                       r'<a class="w-ln" href="WA-Asistentes.dc.html">\1 Asistentes</a>', t, flags=re.S)
        assert n == 1, n
    # «Por qué lo propuso» sin datos unidos con «·» (263): cada uno en su renglón.
    if tel:
        t = todas(t, '<div class="f"><span class="k">Leyó</span><span>14 de 16 datos · 1 dudoso: Número de operación</span></div>',
                  '<div class="f"><span class="k">Leyó</span><span>14 de 16 datos</span></div>'
                  '<div class="f"><span class="k">Dudoso</span><span>Número de operación</span></div>')
    else:
        t = todas(t, '<span class="k">Leyó</span><span>14 de 16 datos · 1 dudoso: Número de operación</span>',
                  '<span class="k">Leyó</span><span>14 de 16 datos</span><span class="k">Dudoso</span><span>Número de operación</span>')
    return t


CSS_WA = "/* L · El nombre del asistente y los dos casos nuevos usan las piezas del chat: sin estilos propios. */\n"
PDF_LARGO = "Por acá leo PDF de hasta 10 páginas, y este tiene 14. Mandame solo las páginas del comprobante."
VALIDO_FORMA = "Sin IA: la cuenta de destino no tiene la forma de un CBU, un CVU ni un alias. Quedó sin leer."


def pdf_largo(bloque):
    """270 · El PDF de más páginas que las de la configuración: lo dice con los dos números."""
    if 'class="w-m ' not in bloque and 'class="ap-m ' not in bloque:
        return bloque
    bloque = una(bloque, "comprobante.pdf · 1 página · 120 KB", "resumen-de-cuenta-octubre.pdf · 14 páginas · 1,2 MB")
    bloque = una(bloque, "<span>Este PDF tiene contraseña. ¿Me mandás uno sin ella?</span>", f"<span>{PDF_LARGO}</span>")
    return bloque.replace(">10:41<", ">11:02<").replace(" · 10:41 · ", " · 11:02 · ")


def sin_forma_chat(bloque):
    """277 · La cuenta de destino es un número interno, que no es CBU, CVU ni alias: queda sin leer, como lo que no se leyó, y no
    se propone marcada."""
    if "as-pop" not in bloque and 'class="w-m ' not in bloque and 'class="ap-m ' not in bloque:
        return bloque
    bloque = una(bloque, "CUIT 30-71890123-1<br>CBU 0720321100000765432199</div>", "CUIT 30-71890123-1<br>Cta. Cte. 4587-02145/3</div>")
    bloque = una(bloque, '<span class="k">Leyó</span><span>14 de 16 datos</span>',
                 '<span class="k">Leyó</span><span>13 de 16 datos</span><span class="k">Sin leer</span><span>Concepto y Cuenta de destino</span>')
    bloque = una(bloque, "Sin IA: la cuenta de origen no da con sus dígitos verificadores. Va marcada.", VALIDO_FORMA)
    bloque = una(bloque, "<small>Prellenado · la cuenta de origen va marcada</small>", "<small>Prellenado · con el comprobante</small>")
    return bloque.replace(">10:44<", ">10:52<").replace(" · 10:44 · ", " · 10:52 · ").replace(">10:44 · <", ">10:52 · <")


def wa_chats_documento():
    t, nl = leer("WA-Chats-Documento")
    t = con_titulo(con_css(nombre_asistente(t), CSS_WA))
    nuevos = ["Un PDF de más páginas", "Una cuenta sin su forma"]
    s_pdf, s_cuenta = var_de(t, "PDF con contraseña"), var_de(t, "La cuenta no da")
    t, sv = sumar(t, [("PDF con contraseña", nuevos[:1]), ("La cuenta no da", nuevos[1:])], nuevos)
    t = copiar_estado(t, s_pdf, sv[nuevos[0]], pdf_largo)
    t = copiar_estado(t, s_cuenta, sv[nuevos[1]], sin_forma_chat)
    # La vista previa, la hora y el modo de los estados nuevos.
    t = una(t, '"El tope del día"].includes(e), modoMan',
            '"El tope del día", "Un PDF de más páginas", "Una cuenta sin su forma"].includes(e), modoMan')
    t = una(t, '"El tope del día": "Delta: Por hoy llegué al tope de documentos que puedo…"}[e]',
            '"El tope del día": "Delta: Por hoy llegué al tope de documentos que puedo…", '
            '"Un PDF de más páginas": "Delta: Por acá leo PDF de hasta 10 páginas, y este tie…", '
            '"Una cuenta sin su forma": "Delta: Te preparé el formulario «Cobro a cliente» para que…"}[e]')
    t = una(t, '"El tope del día": "03/11/2026, 10:28"}[e]',
            '"El tope del día": "03/11/2026, 10:28", "Un PDF de más páginas": "03/11/2026, 11:02", "Una cuenta sin su forma": "03/11/2026, 10:52"}[e]')
    assert "> Asistente<" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    escribir("WA-Chats-Documento", t, nl)


def m_wa_chats_documento():
    t, nl = leer("M-WA-Chats-Documento")
    t = con_titulo(con_css(nombre_asistente(t, tel=True), CSS_WA))
    nuevos = ["Un PDF de más páginas", "Una cuenta sin su forma"]
    s_pdf, s_base = var_de(t, "PDF con contraseña"), var_de(t, "Por qué lo propuso")
    t, sv = sumar(t, [("PDF con contraseña", nuevos[:1]), ("Por qué lo propuso", nuevos[1:])], nuevos)
    t = copiar_estado(t, s_pdf, sv[nuevos[0]], pdf_largo)

    def cuenta(bloque):
        # El teléfono no tenía «La cuenta no da»: parte de «Por qué lo propuso», con su ventana abierta.
        if 'class="ap-m ' in bloque:
            bloque = una(bloque, "CUIT 30-71890123-1<br>CBU 0720321100000765432199</div>", "CUIT 30-71890123-1<br>Cta. Cte. 4587-02145/3</div>")
            return bloque
        if "Por qué lo propuso" in bloque and '<span class="k">Leyó</span>' in bloque:
            bloque = una(bloque, '<div class="f"><span class="k">Leyó</span><span>14 de 16 datos</span></div>'
                                 '<div class="f"><span class="k">Dudoso</span><span>Número de operación</span></div>',
                         '<div class="f"><span class="k">Leyó</span><span>13 de 16 datos</span></div>'
                         '<div class="f"><span class="k">Sin leer</span><span>Concepto y Cuenta de destino</span></div>')
            bloque = re.sub(r'(<span class="k">Validó</span><span>)[^<]*(</span>)', rf"\g<1>{VALIDO_FORMA}\2", bloque, count=1)
        return bloque
    t = copiar_estado(t, s_base, sv[nuevos[1]], cuenta)
    assert "> Asistente<" not in re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    escribir("M-WA-Chats-Documento", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la bandeja
COLS_VIEJAS_9 = ["Documento", "Llegó", "Mandó", "Es cliente", "Formulario", "Lo leído", "Estado", "Respuesta", "Se borra"]
COLS = ["Documento", "Estado", "Llegó", "Mandó", "Es cliente", "Formulario", "Lo leído", "Respuesta", "Se borra"]
ANCHOS = {"Documento": "220px", "Estado": "190px", "Llegó": "132px", "Mandó": "160px", "Es cliente": "96px", "Formulario": "190px",
          "Lo leído": "240px", "Respuesta": "108px", "Se borra": "100px"}
PL_COLS = " ".join(ANCHOS[c] for c in COLS) + " 56px"
ORDEN_LLEGO = "Ordenar por: Llegó, más reciente primero"
ORDEN_FORM = "Ordenar por: Formulario, de la A a la Z"
DIAS_VENCER, DIAS_BORRAR = 60, 90
VENCIO = f"Nadie lo revisó en {DIAS_VENCER} días: venció."
VENCIO_I = f"Los {DIAS_VENCER} días son los de «Vencer los propuestos sin revisar», en la configuración de Formularios."
TOPE = "Sin leer: se llegó al tope de lecturas de hoy."
PROTEGIDO = "Protegido: tiene contraseña."
RELECTURA = "Se lee de nuevo mañana: se llegó al tope de relecturas del día."
ELEGI = "Elegí un formulario."
LEYENDO = "Esperá a que termine de leer los datos."
SOLO_VER = "No atendés la bandeja de donde llegó: lo podés ver, pero no revisar."
TITULO_I_VIEJO = "Lo que llega por WhatsApp a los formularios que leen documentos. Un sin clasificar o un descartado se borra a los 90 días, con su lectura."
TITULO_I = (f"Lo que llega por WhatsApp a los formularios que leen documentos. Un sin clasificar o un descartado se borra a los {DIAS_BORRAR} "
            f"días, con su lectura, y uno propuesto que nadie revisa vence a los {DIAS_VENCER}: son los plazos de la configuración de Formularios.")
MOTIVOS = {"comprobante-santander.pdf": PROTEGIDO, "comprobante-galicia.jpg": TOPE, "transferencia.jpg": VENCIO}
ACCIONES = {"Propuesto": [("Revisar", SVG_REVISAR), ("Descartar", SVG_DESCARTAR)],
            "Sin clasificar": [("Revisar", SVG_REVISAR), ("Descartar", SVG_DESCARTAR)],
            "Descartado": [("Volver a abrir", SVG_REABRIR)]}
CLASE_EST = {"pend": "pend", "amb": "aten", "off": "", "": "ok"}
FORMULARIOS = ["Cobro a cliente", "Pago a proveedor", "Rendición de gastos de viaje"]
ESTADOS = ["Propuesto", "Sin clasificar", "Confirmado", "Cargada automáticamente", "Descartado"]

CSS_DOCS = b2.css() + """
/* L · La bandeja (261 a 264): los filtros son botones que abren la pieza, sin cantidades; «Ordenar por», último y separado. */
button.w-pil { font: inherit; }
.w-pil[aria-expanded="true"] { border-color: var(--marca); }
.o-fb .b2-pkl.barra { min-width: 220px; }
.b2-ordenar { position: relative; }
.b2-pop { position: absolute; z-index: 30; right: 0; top: calc(100% + 4px); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 420px; padding: 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); white-space: normal; text-align: left; }
.b2-pop .et { display: block; margin-bottom: 5px; color: var(--t2); font-size: 13px; font-weight: 600; }
.b2-pop .b2-pkl { width: 100%; }
.pl-fmn .fd .b2-env { width: 100%; }
/* El ⋮ de la fila, en la última columna, fija a la derecha como la primera a la izquierda (261). */
.w-th.pl > .e25-acc, .w-tr.pl > .e25-acc { position: sticky; right: 0; z-index: 2; display: flex; align-items: center; justify-content: center; margin-right: -16px; padding: 0 4px !important; background: inherit; box-shadow: -1px 0 0 var(--borde); overflow: visible; }
.w-th.pl > .e25-acc { background: oklch(0.945 0.027 95); }
.pl-caja:has(.e25-acc)::after { display: none; }
.e25-kw { position: relative; display: inline-flex; }
.e25-keb { width: 28px; height: 28px; }
.e25-menu { position: absolute; z-index: 40; right: 0; top: calc(100% + 4px); display: flex; flex-direction: column; min-width: 190px; padding: 6px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); text-align: left; }
.e25-mi { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 0; border-radius: 3px; background: transparent; font: inherit; font-size: 13.5px; color: var(--t1); white-space: nowrap; text-align: left; }
.e25-mi:first-child { background: var(--s2); }
.e25-mi svg { flex: none; color: var(--t2); }
.e25-menu.arriba { top: auto; bottom: calc(100% + 4px); }
.w-tr.pl > .e25-acc:has(.e25-menu) { z-index: 6; }
/* El estado con su porqué en la (i), que se abre en un tooltip (211). */
.w-tr.pl .b2-i .acc-tip { left: -12px; bottom: calc(100% + 8px); width: max-content; max-width: 300px; white-space: normal; }
/* El panel: «Formulario», «Cliente» y «Moneda» son la pieza (262); lo apagado, con su motivo (211). */
.d25-form .b2-env { min-width: 0; }
.d25-datos .b2-env, .d25-form .b2-env { width: 100%; }
.e25-apag { position: relative; display: inline-flex; }
.e25-apag .cb { opacity: 0.5; cursor: default; }
.e25-apag .acc-tip { left: auto; right: 0; bottom: calc(100% + 8px); width: max-content; max-width: 260px; }
.e25-apag .acc-tip::after { left: auto; right: 24px; }
.d25-ro .b2-i { margin-left: 5px; }
"""

CSS_DOCS_TEL = b2.css(True) + CSS_HOJA_TEL + """
/* L · «Ordenar por» arriba de la lista, a todo el ancho (264). */
.b2-ordtel { flex-shrink: 0; padding: 4px 16px 8px; background: #fff; }
.b2-ordtel button { display: flex; width: 100%; height: 44px; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; padding: 0 14px; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; color: var(--t1); font: inherit; font-size: 14px; text-align: left; }
.b2-ordtel button > svg { flex: none; color: var(--t2); }
/* «Filtros» y «Ordenar por» a pantalla completa: cada uno con su nombre y la pieza (262). */
.t10-fl { display: flex; flex-direction: column; background: #fff; padding-bottom: 96px; }
.t10-fl .gr { display: block; padding: 20px 16px 8px; font-size: 13px; font-weight: 600; color: var(--t3); }
.t10-fl .b2-ffc { padding: 0 16px; }
.t10-pie { position: absolute; left: 0; right: 0; bottom: 0; display: flex; gap: 10px; padding: 12px 16px 28px; background: #fff; border-top: 1px solid var(--borde); }
.t10-pie .cb { flex: 1; height: 48px; }
/* Cada fila, una tarjeta con cada dato nombrado y su ⋮ (263 y 261). */
.ap-cuerpo .b2-tj { flex-shrink: 0; }
.b2-tj .d25-mini { flex: none; margin-top: 3px; }
.b2-tj .b2-i .acc-tip { left: auto; right: -40px; max-width: 250px; }
.b2-tj .b2-i .acc-tip::after { left: auto; right: 44px; }
.b2-tj:has(.acc-tip) { overflow: visible; z-index: 3; }
/* El detalle: el estado en la barra; la pieza de «Formulario»; lo apagado con su motivo (211). */
.ap-bar .tit .sub .w-est { font-size: 13px; }
.t25-cmp .b2-env { width: 100%; }
.ap-fijo .acc-apagado .acc-tip { left: auto; right: 0; }
.ap-fijo .acc-apagado .acc-tip::after { left: auto; right: 28px; }
"""


def boton_pil(m):
    con, texto, svg = m.groups()
    return (f'<button type="button" class="w-pil{con or ""}" aria-haspopup="listbox" aria-expanded="false">{texto} {svg}</button>')


PIL = re.compile(r'<span class="w-pil( con)?" role="button" aria-haspopup="listbox">([^<]+) (<svg.*?</svg>)</span>', re.S)
FILTROS_PIL = re.compile(r'<span class="w-pil pl-fil" role="button" aria-haspopup="dialog" aria-expanded="(true|false)">(<svg.*?</svg>) Filtros'
                         r'( <span class="n">\d+</span>)?</span>', re.S)
CMB = re.compile(r'<span class="cmb( ab)?" role="combobox" aria-expanded="(?:true|false)">([^<]+) (?:<svg.*?</svg>)</span>', re.S)
OPCION_LST2 = re.compile(r'<span class="sep2"></span>|<span(?: class="(?:sel)?")?><span class="tl">(?:<svg.*?</svg>)?</span>([^<]+)</span>', re.S)


def pieza_filtros(barra):
    """«Filtros»: cada pregunta, la pieza cerrada; abierta, la lista con la elegida tildada y «Todas…» primero y separada (262)."""
    out, pos = [], 0
    for m in CMB.finditer(barra):
        nombre = re.findall(r"<b>([^<]+)</b>", barra[:m.start()])[-1]
        abierta, valor = bool(m.group(1)), m.group(2)
        fin, extra = m.end(), ""
        if abierta:
            assert barra.startswith('<span class="lst2" role="listbox">', fin)
            fin_l = cierre(barra, fin, "span")
            ops = []
            for k, o in enumerate(o for o in OPCION_LST2.finditer(barra[fin:fin_l]) if o.group(1)):
                n, d = (o.group(1).split(" · ", 1) + [None])[:2]
                ops.append(b2.op(n, d, elegida=n == valor, activa=n == valor, sep=k == 1))
            extra, fin = b2.lista(ops), fin_l
        out.append(barra[pos:m.start()] + b2.campo(valor, abierto=abierta, aria=nombre, extra=extra))
        pos = fin
    return "".join(out) + barra[pos:]


def pop_orden(elegida, orden):
    return ('<div class="b2-pop" role="dialog" aria-label="Ordenar por">'
            '<div class="b2-pop-c"><span class="et">Columna</span>'
            + b2.campo(elegida, abierto=True, aria="Columna",
                       extra=b2.lista([b2.op(c, elegida=c == elegida, activa=c == elegida) for c in COLS]))
            + '</div><div class="b2-pop-c"><span class="et">Orden</span>' + b2.campo(orden, aria="Orden") + '</div></div>')


def barra_docs(barra, orden=ORDEN_LLEGO):
    barra, n = PIL.subn(boton_pil, barra)
    assert n >= 3, n
    barra = FILTROS_PIL.sub(lambda m: (f'<button type="button" class="w-pil pl-fil" aria-haspopup="dialog" aria-expanded="{m.group(1)}">'
                                       f'{m.group(2)} Filtros{m.group(3) or ""}</button>'), barra)
    barra = pieza_filtros(barra)
    i = barra.index('<span class="pl-env">')
    j = cierre(barra, i, "span")
    boton = ('<span class="b2-sep" aria-hidden="true"></span><span class="envoltura b2-ordenar">'
             f'<button type="button" class="w-pil" aria-haspopup="dialog" aria-expanded="false">{orden} {b2.SVG_FLECHA}</button></span>')
    return barra[:j] + boton + barra[j:]


def encabezado(por="Llegó", sentido="descending"):
    fl = "↑" if sentido == "ascending" else "↓"
    celdas = [f'<span aria-sort="{sentido}">{c}<span class="b2-fl" aria-hidden="true">{fl}</span></span>' if c == por else f"<span>{c}</span>"
              for c in COLS]
    return '<div class="w-th pl">' + "".join(celdas) + '<span class="e25-acc"><span class="sr">Acciones</span></span></div>'


def celda_acc(nombre, estado, abierto=False, sin=False):
    ops = [] if sin else ACCIONES.get(estado, [])
    if not ops:
        return '<span class="e25-acc"></span>'
    m = menu(nombre, ops) if abierto else ""
    return (f'<span class="e25-acc"><span class="e25-kw"><button type="button" class="ib e25-keb" aria-label="Acciones de {nombre}" '
            f'aria-haspopup="menu" aria-expanded="{"true" if abierto else "false"}">{SVG_KEB}</button>{m}</span></span>')


def datos_fila(fila, viejas):
    _, hs, _ = b2.hijos(fila)
    d = dict(zip(viejas, hs))
    assert len(hs) == len(viejas), (len(hs), viejas)
    return d


def fila_nueva(fila, viejas, abierto=False, sin=False, motivo_abierto=None, cambios=None):
    """Una fila en el orden nuevo, con «Es cliente», el porqué del estado en su (i) y su ⋮ (261 y 263)."""
    ab, hs, ci = b2.hijos(fila)
    d = dict(zip(viejas, hs))
    if "Es cliente" not in d:
        quien = re.search(r'title="([^"]+)"', d["Mandó"]).group(1)
        d["Es cliente"] = "<span>Sí</span>" if quien == "Martina López" else '<span><span class="pl-g">—</span></span>'
    d["Lo leído"] = d["Lo leído"].replace("Fila 4 de 7 · $ 21.300,00", "$ 21.300,00 de Pinturerías Oeste")
    nombre = re.search(r'<span class="n">([^<]+)</span>', d["Documento"]).group(1)
    for k, v in (cambios or {}).items():
        d[k] = v
    m = re.search(r'<span class="w-est ?([a-z]*)">([^<]+)</span>', d["Estado"])
    estado = m.group(2)
    motivo = MOTIVOS.get(nombre) if estado != "Propuesto" else None
    if cambios and "motivo" in cambios:
        motivo = cambios["motivo"]
    if motivo:
        d["Estado"] = f'<span>{m.group(0)}{b2.info(motivo, abierto=motivo_abierto == nombre)}</span>'
    if nombre == "transferencia.jpg":
        d["Se borra"] = d["Se borra"].replace("31/01/2027", "01/01/2027")
    return ab + "".join(d[c] for c in COLS) + celda_acc(nombre, estado, abierto, sin) + ci


def tabla(bloque, sin=False, abierta=None, motivo_abierto=None, cambios=None, por="Llegó", sentido="descending"):
    """La tabla de un estado: encabezado, filas, anchos y su ⋮. `abierta`: el índice de la fila con su ⋮ abierto; `cambios`:
    {índice: {columna: celda}}."""
    i = bloque.index('<div class="w-caja pl-caja"')
    j = b2.fin_div(bloque, i)
    caja = bloque[i:j]
    caja = re.sub(r'--pl-cols: [^;"]+;', f"--pl-cols: {PL_COLS};", caja, count=1)
    m = re.search(r'<div class="w-th pl">.*?</div>', caja, re.S)
    viejas = COLS_VIEJAS_9
    if not m and '<div class="f-cuerpo izq">' in caja:
        # La primera carga: el encabezado y el aro en el alto de ocho filas, en lugar de las filas esqueleto (160). La clase
        # `e25-carga` evita que la pasada de las piezas lo vuelva a las barras: no encuentra el encabezado en otra caja.
        a = caja.index('<div class="f-cuerpo izq">')
        caja = (caja[:a] + encabezado(por, sentido) + '<div class="t10-carga e25-carga" role="status" aria-label="Cargando">'
                '<span class="t10-aro" aria-hidden="true"></span></div>' + caja[b2.fin_div(caja, a):])
    elif m:
        viejas = re.findall(r"<span[^>]*>([^<]*)</span>", m.group(0))
        caja = caja[:m.start()] + encabezado(por, sentido) + caja[m.end():]
    out, pos, k = [], 0, 0
    for f in re.finditer(r'<div class="w-tr pl[^"]*">', caja):
        fin = b2.fin_div(caja, f.start())
        out.append(caja[pos:f.start()] + fila_nueva(caja[f.start():fin], viejas, abierto=abierta == k, sin=sin,
                                                    motivo_abierto=motivo_abierto, cambios=(cambios or {}).get(k)))
        pos, k = fin, k + 1
    caja = "".join(out) + caja[pos:]
    return bloque[:i] + caja + bloque[j:]


def campo_div(nombre, valor, **kw):
    return b2.campo(valor, aria=nombre, **kw)


CT_SEL = re.compile(r'<div class="ct sel( ph)?">([^<]+)(<svg.*?</svg>)</div>', re.S)
CT_ABIERTO = re.compile(r'<div class="ct sel abierto">([^<]+)<svg.*?</svg></div><div class="q-catmn"[^>]*>(.*?)</div>', re.S)


def panel(bloque, var, tip_pasar=False, motivo=ELEGI):
    """El panel del documento (263, 262 y 211)."""
    bloque = re.sub(r'<div class="d25-sub">([^<]+) · por WhatsApp · ([^<]+)</div>', r'<div class="d25-sub">Lo mandó \1 por WhatsApp el \2</div>', bloque)
    bloque = bloque.replace("Reconocido por la IA · seguro", "Reconocido por la IA, seguro")

    def abierto(m):
        ops = re.findall(r"<span[^>]*>([^<]+)</span>", m.group(2))
        return campo_div("Formulario", m.group(1), abierto=True,
                         extra=b2.lista([b2.op(o, elegida=o == m.group(1), activa=o == m.group(1)) for o in ops]))
    bloque = CT_ABIERTO.sub(abierto, bloque)
    bloque = CT_SEL.sub(lambda m: campo_div("Formulario", m.group(2), vacio=bool(m.group(1))), bloque)
    bloque = re.sub(r'<div class="ct ro">([^<]+)</div>', lambda m: campo_div("Formulario", m.group(1), apagado=SOLO_VER, tip_abierto=False), bloque)
    # «Cliente» y «Moneda» se eligen: la pieza cerrada, en la revisión.
    for q in ("Cliente", "Moneda"):
        bloque = re.sub(rf'(<div class="w-cmp"><span class="rt">{q}</span>)<div class="ct">([^<]+)</div>',
                        lambda m: m.group(1) + campo_div(q, m.group(2)), bloque)
    # «Pasar al formulario» apagado, con su motivo (211).
    tip = b2.tip(motivo) if tip_pasar else ""
    bloque = bloque.replace('<button type="button" class="cb cb-pri" disabled>Pasar al formulario</button>',
                            f'<span class="e25-apag"><button type="button" class="cb cb-pri" aria-disabled="true" aria-label="Pasar al formulario: {motivo}">'
                            f'Pasar al formulario</button>{tip}</span>')
    # La persona y la fecha, cada una en su renglón (206 y 263).
    bloque = re.sub(r'<span class="k">La revisó</span><span>([^<]+) · ([^<]+)</span>',
                    r'<span class="k">La revisó</span><span>\1</span><span class="k">Fecha de la revisión</span><span>\2</span>', bloque)
    bloque = re.sub(r'<span class="k">La cargó</span><span>(«Cargar solo si es seguro») · ([0-9/]+, [0-9:]+) (<span class="f-i".*?</span>)</span>',
                    r'<span class="k">La cargó</span><span>\1 \3</span><span class="k">Fecha de la carga</span><span>\2</span>', bloque, flags=re.S)
    # Venció, con los días de la configuración (272).
    if "Nadie lo revisó en 90 días: venció." in bloque:
        bloque = una(bloque, "<span>Nadie lo revisó en 90 días: venció.</span>", f"<span>{VENCIO}{b2.info(VENCIO_I)}</span>")
        bloque = una(bloque, '<span class="k">Se borra</span><span>31/01/2027</span>', '<span class="k">Se borra</span><span>01/01/2027</span>')
    return bloque


def frm_documentos():
    t, nl = leer("FRM-Documentos")
    t = con_titulo(con_css(t, CSS_DOCS))
    t = todas(t, TITULO_I_VIEJO, TITULO_I)
    s_solo, s_clasif, s_leyendo = var_de(t, "Solo ver"), var_de(t, "Un sin clasificar"), var_de(t, "Volviendo a leer")

    def cambiar(var, bloque):
        if '<div class="w-caja o-fb pl-fb">' in bloque:
            i = bloque.index('<div class="w-caja o-fb pl-fb">')
            j = b2.fin_div(bloque, i)
            bloque = bloque[:i] + barra_docs(bloque[i:j]) + bloque[j:]
            bloque = tabla(bloque, sin=var == s_solo)
        if '<aside class="d2 d25"' in bloque:
            bloque = panel(bloque, var, tip_pasar=var == s_clasif, motivo=LEYENDO if var == s_leyendo else ELEGI)
        return bloque
    t = por_bloque(t, cambiar)

    nuevos = ["Estado abierto", "Ordenar por abierto", "Ordenado por Formulario", "Acciones de una fila", "Venció: volver a abrir",
              "Un dato sin su forma", "Relectura para mañana"]
    base = {n: var_de(t, b) for n, b in zip(nuevos, ["Documentos", "Documentos", "Documentos", "Documentos", "Venció",
                                                       "Un dato que no pasa", "Un sin clasificar"])}
    t, sv = sumar(t, [("Documentos", nuevos[:4]), ("Venció", nuevos[4:5]), ("Un dato que no pasa", nuevos[5:6]),
                      ("Sin leer por el tope del día", nuevos[6:])], nuevos)

    # «Estado abierto»: el filtro con su botón y la pieza abierta, sin cantidades (262).
    def estado_abierto(b):
        if '<div class="w-caja o-fb pl-fb">' not in b:
            return b
        viejo = '<button type="button" class="w-pil" aria-haspopup="listbox" aria-expanded="false">Estado '
        lst = b2.lista([b2.op("Todos los estados", elegida=True, activa=True)] + [b2.op(e, sep=k == 0) for k, e in enumerate(ESTADOS)], barra=True)
        k = b.index(viejo)
        fin = b.index("</button>", k) + len("</button>")
        return b[:k] + b[k:fin].replace('aria-expanded="false"', 'aria-expanded="true"') + lst + b[fin:]
    t = copiar_estado(t, base[nuevos[0]], sv[nuevos[0]], estado_abierto)

    # «Ordenar por abierto»: «Columna» con las que ordenan y «Orden» (264).
    def orden_abierto(b):
        if "b2-ordenar" not in b:
            return b
        viejo = f'aria-expanded="false">{ORDEN_LLEGO} {b2.SVG_FLECHA}</button>'
        return una(b, viejo, viejo.replace('"false"', '"true"') + pop_orden("Llegó", "Más reciente primero"))
    t = copiar_estado(t, base[nuevos[1]], sv[nuevos[1]], orden_abierto)

    # «Ordenado por Formulario»: de la A a la Z, los empates como siempre (más reciente primero) y lo vacío al final (264).
    def por_formulario(b):
        if '<div class="w-th pl">' not in b:
            return b
        b = una(b, f">{ORDEN_LLEGO} ", f">{ORDEN_FORM} ")
        b = re.sub(r'<div class="w-th pl">.*?</span></span></div>', encabezado("Formulario", "ascending"), b, count=1, flags=re.S)
        filas = [(f.start(), b2.fin_div(b, f.start())) for f in re.finditer(r'<div class="w-tr pl[^"]*">', b)]
        html = [b[a:z] for a, z in filas]
        orden = [0, 1, 3, 9, 4, 6, 7, 2, 5, 8]
        assert len(html) == 10
        return b[:filas[0][0]] + "".join(html[k] for k in orden) + b[filas[-1][1]:]
    t = copiar_estado(t, base[nuevos[2]], sv[nuevos[2]], por_formulario)

    # «Acciones de una fila»: el ⋮ abierto del primer propuesto (261).
    def acciones(b):
        if '<div class="w-th pl">' not in b:
            return b
        viejo = 'aria-label="Acciones de comprobante.jpg" aria-haspopup="menu" aria-expanded="false">' + SVG_KEB + "</button>"
        k = b.index(viejo)
        return b[:k] + viejo.replace('"false"', '"true"') + menu("comprobante.jpg", ACCIONES["Propuesto"]) + b[k + len(viejo):]
    t = copiar_estado(t, base[nuevos[3]], sv[nuevos[3]], acciones)

    # «Venció: volver a abrir»: el ⋮ abierto del vencido, sin el panel, que tapa la columna fija (261).
    def reabrir(b):
        if '<aside class="d2 d25"' in b:
            return ""
        if '<div class="w-th pl">' not in b:
            return b
        viejo = 'aria-label="Acciones de transferencia.jpg" aria-haspopup="menu" aria-expanded="false">' + SVG_KEB + "</button>"
        b = una(b, viejo, viejo.replace('"false"', '"true"') + menu("transferencia.jpg", ACCIONES["Descartado"], arriba=True))
        return b.replace('<div class="w-tr pl sel">', '<div class="w-tr pl">')
    t = copiar_estado(t, base[nuevos[4]], sv[nuevos[4]], reabrir)

    # «Un dato sin su forma» (277): la cuenta de destino es un número interno; queda vacía, como lo que no se leyó.
    def sin_forma(b):
        if '<aside class="d2 d25"' not in b:
            return b
        b = una(b, "CUIT 30-71890123-1<br>CBU 0720321100000765432199</div>", "CUIT 30-71890123-1<br>Cta. Cte. 4587-02145/3</div>")
        b = una(b, '<div class="ct mal">0070123100000045678921</div><span class="err2" role="alert">Los números de la cuenta no dan. Copiala del comprobante.</span>',
                '<div class="ct">0070123100000045678901</div>')
        return una(b, '<span class="rt">Cuenta de destino</span><div class="ct">0720321100000765432199</div>',
                   '<span class="rt">Cuenta de destino</span><div class="ct vacio"><span class="d25-marca no">No se leyó</span></div>')
    t = copiar_estado(t, base[nuevos[5]], sv[nuevos[5]], sin_forma)

    # «Relectura para mañana» (271): al publicar «Remito de entrega», que se armó con estos remitos, el primero se relee y queda
    # propuesto; a los otros dos no les alcanza el cupo del día de quien lo armó y esperan al otro día.
    remito = "<span>Remito de entrega</span>"
    prop = '<span><span class="w-est pend">Propuesto</span></span>'

    def relectura(b):
        if '<div class="w-th pl">' in b:
            b = b.replace('<div class="w-tr pl sel">', '<div class="w-tr pl">')
            # Las filas 2, 5 y 8 son los tres remitos, ya en el orden nuevo (Documento, Estado, …).
            filas = [(f.start(), b2.fin_div(b, f.start())) for f in re.finditer(r'<div class="w-tr pl[^"]*">', b)]
            assert "remito-0412.jpg" in b[filas[2][0]:filas[2][1]] and "remito-0398.jpg" in b[filas[5][0]:filas[5][1]]
            out, pos = [], 0
            for k, (a, z) in enumerate(filas):
                f = b[a:z]
                if k == 2:
                    ab, hs, ci = b2.hijos(f)
                    hs[COLS.index("Estado")] = prop
                    hs[COLS.index("Formulario")] = remito
                    hs[COLS.index("Se borra")] = "<span></span>"
                    f = ab + "".join(hs) + ci
                elif k in (5, 8):
                    ab, hs, ci = b2.hijos(f)
                    hs[COLS.index("Estado")] = ('<span><span class="w-est amb">Sin clasificar</span>' + b2.info(RELECTURA, abierto=k == 5) + "</span>")
                    f = (ab if k == 8 else '<div class="w-tr pl sel">') + "".join(hs) + ci
                out.append(b[pos:a] + f)
                pos = z
            return "".join(out) + b[pos:]
        if '<aside class="d2 d25"' in b:
            b = b.replace("remito-0412.jpg", "remito-0398.jpg").replace("N° 0001-00000412", "N° 0001-00000398")
            b = una(b, "Lo mandó Tomás Acosta por WhatsApp el 03/11/2026, 09:58", "Lo mandó Paula Méndez por WhatsApp el 02/11/2026, 16:05")
            b = una(b, "Corralón El Puente S.R.L. · CUIT 30-70912345-5", "Sanitarios del Sur S.A. · CUIT 30-71233456-2")
            i = b.index('<div class="d25-ir">')
            j = b2.fin_div(b, i)
            b = b[:i] + f'<div class="d25-lee" role="status">{RELECTURA}</div>' + b[j:]
            b = una(b, b2.tip(ELEGI), "")  # el motivo de «Pasar al formulario» queda cerrado: se abre uno por vez
            return b.replace('<span class="pos">3 de 27</span>', '<span class="pos">6 de 27</span>')
        return b
    t = copiar_estado(t, base[nuevos[6]], sv[nuevos[6]], relectura)
    assert "<span class=\"w-pil\" role=\"button\"" not in t and " disabled>Pasar" not in t
    escribir("FRM-Documentos", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
FILA_TEL = re.compile(r'<a class="ap-fila" href="#">(<span class="d25-mini[^"]*" aria-hidden="true">[^<]*</span>)<div class="tx">'
                      r'<span class="l1">([^<]+)</span><span class="l2">([^<]*)</span><span class="l3">'
                      r'<span class="w-est ?([a-z]*)">([^<]+)</span><span>([^<]+)</span></span></div></a>')


def tarjeta_doc(m, abierta=None, motivos=None, cambios=None):
    mini, nombre, l2, clase, estado, llego = m.groups()
    formulario, quien = (l2.split(" · ") + [""])[:2]
    if formulario == "Sin clasificar":
        formulario = b2.NADA_T
    if cambios and nombre in cambios:
        formulario, estado, clase = cambios[nombre]
    motivo = (motivos or {}).get(nombre, MOTIVOS.get(nombre) if estado != "Propuesto" else None)
    est = b2.est(CLASE_EST[clase], estado, info=motivo, abierto=bool(abierta and abierta == ("motivo", nombre)))
    acciones = nombre if ACCIONES.get(estado) else None
    return b2.tarjeta(nombre, [("Formulario", formulario), ("Mandó", quien), ("Llegó", llego), ("Estado", est)], acciones=acciones, av=mini)


def boton_orden_tel(texto=ORDEN_LLEGO):
    return f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">{texto} {b2.SVG_FLECHA}</button></div>'


def campo_tel(nombre, valor):
    return f'<span class="gr">{nombre}</span><div class="b2-ffc">{b2.campo(valor, aria=nombre)}</div>'


def detalle_tel(bloque):
    """El detalle en el teléfono: el estado en la barra, la línea gris en una frase y «Formulario» en la pieza (263 y 262)."""
    m = re.search(r'<div class="t25-sub">(<span class="w-est ?[a-z]*">[^<]+</span>) · ([^<]+) · ([^<]+)</div>', bloque)
    if not m:
        return bloque
    est, quien, cuando = m.groups()
    bloque = bloque[:m.start()] + f'<div class="t25-sub">Lo mandó {quien} por WhatsApp el {cuando}</div>' + bloque[m.end():]
    bloque = una(bloque, '<span class="sub">Documentos recibidos</span>', f'<span class="sub">{est}</span>')
    bloque = bloque.replace("Reconocido por la IA · seguro", "Reconocido por la IA, seguro")
    bloque = re.sub(r'<div class="ct sel">([^<]+)<svg.*?</svg></div>', lambda x: b2.campo(x.group(1), aria="Formulario"), bloque, flags=re.S)
    bloque = re.sub(r'<div class="ct sel" style="color: var\(--t3\);">([^<]+)<svg.*?</svg></div>',
                    lambda x: b2.campo(x.group(1), vacio=True, aria="Formulario"), bloque, flags=re.S)
    for q in ("Cliente", "Moneda"):
        bloque = re.sub(rf'(<div class="t25-cmp"><span class="rt">{q}</span>)<div class="ct">([^<]+)</div>',
                        lambda x: x.group(1) + b2.campo(x.group(2), aria=q), bloque)
    bloque = bloque.replace('<button type="button" class="cb cb-pri" disabled>Pasar al formulario</button>',
                            f'<span class="acc-apagado"><button type="button" class="cb cb-pri" aria-disabled="true" aria-label="Pasar al formulario: {ELEGI}">'
                            f'Pasar al formulario</button></span>')
    if "<span>Nadie lo revisó en 90 días: venció.</span>" in bloque:
        bloque = una(bloque, "<span>Nadie lo revisó en 90 días: venció.</span>", f"<span>{VENCIO}{b2.info(VENCIO_I)}</span>")
        bloque = una(bloque, '<span class="rt">Se borra</span><span>31/01/2027</span>', '<span class="rt">Se borra</span><span>01/01/2027</span>')
    return bloque


def m_frm_documentos():
    t, nl = leer("M-FRM-Documentos")
    t = con_titulo(con_css(t, CSS_DOCS_TEL))
    s_clasif = var_de(t, "Un sin clasificar")

    def cambiar(var, b):
        if '<a class="ap-fila"' in b:
            b, n = FILA_TEL.subn(tarjeta_doc, b)
            assert n and '<a class="ap-fila"' not in b, var
            k = b.index('<div class="ap-cuerpo')
            b = b[:k] + boton_orden_tel() + b[k:]
        b = detalle_tel(b)
        if var == s_clasif and "acc-apagado" in b:
            b = b.replace('Pasar al formulario</button></span>', 'Pasar al formulario</button>' + b2.tip(ELEGI) + "</span>", 1)
        return b
    t = por_bloque(t, cambiar)

    nuevos = ["Filtros", "Ordenar por", "Acciones de una fila", "Un dato sin su forma", "Relectura para mañana"]
    s_docs, s_prop = var_de(t, "Documentos"), var_de(t, "Un propuesto")
    t, sv = sumar(t, [("Con filtros", nuevos[:3]), ("Un propuesto", nuevos[3:4]), ("Sin leer por el tope del día", nuevos[4:])], nuevos)
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-FRM-Documentos.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)

    def pantalla(titulo, campos, pie):
        return ('<div class="ap-bar int">'
                f'<a class="ap-ib" aria-label="Volver" href="M-FRM-Documentos.dc.html">{volver}</a>'
                f'<div class="tit"><h1>{titulo}</h1><span class="sub">Documentos recibidos</span></div></div><div class="ap-cuerpo"><div class="t10-fl">'
                + "".join(campo_tel(n, v) for n, v in campos) + f'</div></div><div class="t10-pie">{pie}</div>')

    filtros = pantalla("Filtros", [("Formulario", "Todos los formularios"), ("Mandó", "Todas las personas"), ("Llegó", "Cualquier fecha"),
                                    ("Estado", "Todos los estados"), ("Empresa", "Todas las empresas")],
                       '<button type="button" class="cb cb-sec">Limpiar todo</button><button type="button" class="cb cb-pri">Listo</button>')
    ordenar = pantalla("Ordenar por", [("Columna", "Llegó"), ("Orden", "Más reciente primero")],
                       '<button type="button" class="cb cb-pri">Listo</button>')
    i = t.index('<span class="ap-raya"></span>')
    t = (t[:i] + f'<sc-if value="{{{{{sv["Filtros"]}}}}}" hint-placeholder-val="{{{{no}}}}">{filtros}</sc-if>'
         f'<sc-if value="{{{{{sv["Ordenar por"]}}}}}" hint-placeholder-val="{{{{no}}}}">{ordenar}</sc-if>' + t[i:])

    # «Acciones de una fila»: la lista de siempre, con la hoja del ⋮ del primer propuesto (261).
    t = copiar_estado(t, s_docs, sv[nuevos[2]])
    k = t.rindex("</div>\n</x-dc>")
    t = t[:k] + (f'<sc-if value="{{{{{sv[nuevos[2]]}}}}}" hint-placeholder-val="{{{{no}}}}">'
                 + hoja_menu("comprobante.jpg", ACCIONES["Propuesto"]) + "</sc-if>") + t[k:]

    # «Un dato sin su forma» (277): la cuenta de destino queda vacía, como lo que no se leyó. Se dibuja desplazado hasta las cuentas
    # (la barra queda arriba), con los datos que siguen a «Banco o billetera de origen».
    def sin_forma(b):
        for clase in ("t25-sub", "t25-doc"):
            i = b.index(f'<div class="{clase}">')
            b = b[:i] + b[cierre(b, i, "div"):]
        i = b.index('<div class="t25-rev">') + len('<div class="t25-rev">')
        k = b.index('<div class="t25-cmp"><span class="rt">Banco o billetera de origen</span>')
        fin = cierre(b, k, "div")
        resto = [("Cuenta de origen", "0070123100000045678901"), ("Titular de origen", "Ferretería Rosales S.R.L."),
                 ("CUIT o CUIL de origen", "30-71458236-0"), ("Banco o billetera de destino", "Banco Santander"),
                 ("Cuenta de destino", None), ("Titular de destino", "Grupo Delta S.A."), ("CUIT o CUIL de destino", "30-71890123-1")]
        campos = "".join(f'<div class="t25-cmp"><span class="rt">{n}</span>'
                         + (f'<div class="ct">{v}</div>' if v else '<div class="ct vacio"><span class="d25-marca no">No se leyó</span></div>')
                         + "</div>" for n, v in resto)
        return b[:i] + b[k:fin] + campos + b[fin:]
    t = copiar_estado(t, s_prop, sv[nuevos[3]], sin_forma)

    # «Relectura para mañana» (271): el primer remito se releyó y quedó propuesto; el segundo espera al otro día.
    def tarjeta_de(b, nombre):
        k = b.index(f'<span class="nm">{nombre}</span>')
        a = b.rindex('<div class="b2-tj">', 0, k)
        return a, b2.fin_div(b, a)

    def relectura(b):
        a, z = tarjeta_de(b, "remito-0412.jpg")
        tj = b[a:z].replace('<span class="v">' + b2.NADA_T + "</span>", '<span class="v">Remito de entrega</span>', 1)
        tj = tj.replace('<span class="b2-est aten">Sin clasificar</span>', '<span class="b2-est pend">Propuesto</span>', 1)
        b = b[:a] + tj + b[z:]
        a, z = tarjeta_de(b, "remito-0398.jpg")
        tj = b[a:z]
        k = tj.index('<span class="b2-nw"><span class="b2-est aten">Sin clasificar</span>')
        fin = tj.index("</span></span>", k) + len("</span></span>")
        tj = tj[:k] + b2.est("aten", "Sin clasificar", info=RELECTURA, abierto=True) + tj[fin:]
        return b[:a] + tj + b[z:]
    t = copiar_estado(t, s_docs, sv[nuevos[4]], relectura)
    assert '<a class="ap-fila"' not in t and " disabled>Pasar" not in t
    escribir("M-FRM-Documentos", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la respuesta
P, Z, R, B, E = e21.P, e21.Z, e21.R, e21.B, e21.E
HECHO, LEIDO = e21.HECHO, e21.LEIDO
WA, APP = e21.WA, e21.APP
MIGA = "Inicio / Gestión de formularios / Formularios / Cobro a cliente"
VERSION = "Versión 2"


def cobro(c):
    """«Cobro a cliente», versión 2: «Datos», con las quince preguntas en el orden del autor, y «Fotos y documentos» (266)."""
    datos = [P("Cliente", c["cliente"], "una"), P("Monto", c["monto"], "numero"), P("Moneda", c["moneda"], "una"),
             P("Fecha", c["fecha"], "fecha"), P("Número de operación", c["op"]), P("Concepto", c.get("concepto", ""), "largo"),
             P("Hora", c["hora"]), P("Banco o billetera de origen", c.get("banco_o", "")), P("Cuenta de origen", c.get("cuenta_o", "")),
             P("Titular de origen", c.get("titular_o", "")), P("CUIT o CUIL de origen", c.get("cuit_o", "")),
             P("Banco o billetera de destino", c.get("banco_d", "")), P("Cuenta de destino", c.get("cuenta_d", "")),
             P("Titular de destino", c.get("titular_d", "")), P("CUIT o CUIL de destino", c.get("cuit_d", ""))]
    return [Z("Datos", datos), Z("Fotos y documentos", [P("Comprobante", c["archivo"], "documento")])]


COB125 = cobro(dict(cliente="Ferretería Rosales", monto="150.000,00", moneda="Pesos", fecha="03/11/2026", op="0458 7129 08",
                    concepto="Factura 0003-00001845", hora="10:32", banco_o="Banco Galicia", cuenta_o="0070123100000045678901",
                    titular_o="Ferretería Rosales S.R.L.", cuit_o="30-71458236-0", banco_d="Banco Santander",
                    cuenta_d="0720321100000765432199", titular_d="Grupo Delta S.A.", cuit_d="30-71890123-1",
                    archivo=("comprobante.jpg", "412 KB")))
COB123 = cobro(dict(cliente="Sanitarios del Sur S.A.", monto="32.000,00", moneda="Pesos", fecha="03/11/2026", op="88412 03317",
                    hora="09:38", banco_o="Mercado Pago", cuenta_o="0000031400000456789120", titular_o="Sanitarios del Sur S.A.",
                    titular_d="Grupo Delta S.A.", archivo=("captura.jpg", "96 KB")))


def doc(nombre, tel=False):
    return f'<a class="e25-lnk" href="{"M-FRM-Documentos" if tel else "FRM-Documentos"}.dc.html">{nombre}</a>'


def act125(tel=False):
    return [B("Al recibirla", [R("03/11/2026", "10:52", "La pasó desde un documento", "Lucía Fernández", APP, doc("comprobante.jpg", tel), HECHO)])]


def act125_wa(tel=False):
    return [B("Al recibirla", [R("03/11/2026", "10:36", "La mandó", ASISTENTE, WA, ["Prellenada con un documento", doc("comprobante.jpg", tel)], HECHO),
                               R("03/11/2026", "10:52", "La respondió", "Tomás Acosta", WA, None, HECHO)])]


def act123(tel=False):
    return [B("Al recibirla", [R("03/11/2026", "09:41", "Se cargó automáticamente", None, WA,
                                 [doc("captura.jpg", tel), "Con «Cargar solo si es seguro»"], HECHO),
                               R("03/11/2026", "09:41", "Aviso a quien la mandó", "Paula Méndez", WA,
                                 "Cargué la respuesta COB-000123 de «Cobro a cliente».", LEIDO)])]


L125 = "La mandó Tomás Acosta por WhatsApp el 03/11/2026, 10:52"
L125_WA = "La respondió Tomás Acosta por WhatsApp el 03/11/2026, 10:52"
L123 = "La mandó Paula Méndez por WhatsApp el 03/11/2026, 09:41"


def con_jpg(html):
    """El comprobante es una foto: su ícono dice «JPG», no «PDF»."""
    return re.sub(r'<span class="pdf">PDF</span>(<a class="nm" href="#" download="[^"]+\.jpg">)', r'<span class="pdf img">JPG</span>\1', html)


CSS_RESP = """
/* L · El documento de la respuesta, una foto en su pregunta de documento (266), y el enlace a la bandeja en «Detalle» (267). */
.rf-doc .pdf.img { background: oklch(0.52 0.09 200); }
.e25-lnk { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.e25-lnk:hover { text-decoration: underline; }
"""
CSS_RESP_TEL_MARCO = """
/* L · La barra de ↑ ↓ y lo que se desplaza, como el teléfono de la E15 (`M-FRM-Respuesta-20`). */
.tr-nav { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-bottom: 1px solid var(--borde); font-size: 14px; color: var(--t2); flex-shrink: 0; background: #fff; }
.tr-nav .ap-ib { width: 40px; height: 40px; border: 1px solid var(--borde); border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; }
.tr-nav .ap-ib[disabled] { opacity: 0.4; }
.tr-scroll { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; }
.tr-scroll > * { flex-shrink: 0; }
"""


def frm_respuesta_25():
    t, nl = leer("FRM-Respuesta-25")
    assert MARCA not in t
    _, _, v = e21.viejos_compu(t)
    banda = v["banda"]["La pasó alguien del equipo"]
    # La planilla de atrás, la de la E15: «Moneda» en lugar de «Motivo», que no es una pregunta de «Cobro a cliente» (269).
    cpo = {k: todas(c, ">Motivo <svg", ">Moneda <svg") for k, c in v["cuerpo"].items()}
    c125, c123 = cpo["La pasó alguien del equipo"], cpo["Cargada automáticamente"]
    yo = "FRM-Respuesta-25.dc.html"
    conv = "WA-Chats-Documento.dc.html"

    def vr(num, cuerpo, linea, pestana="Respuesta", pie="1 de 6", anterior=False):
        return e21.vista_rapida(num, con_jpg(cuerpo), linea_gris=linea, pestana=pestana, version=VERSION, lapiz=True, completa=yo,
                                conversacion=conv, keb=True, anterior=anterior, pie=pie)

    r125, r123 = e21.respuesta(COB125, 2), e21.respuesta(COB123, 2)
    estados = [
        ("La pasó alguien del equipo", dict(banda=banda, cuerpo=c125, aside=vr("COB-000125", r125, L125))),
        ("La pasó alguien del equipo: actividad", dict(banda=banda, cuerpo=c125,
                                                       aside=vr("COB-000125", e21.actividad_recuadros(act125()), L125, "Actividad"))),
        ("La confirmó quien la mandó", dict(banda=banda, cuerpo=cpo["La confirmó quien la mandó"], aside=vr("COB-000125", r125, L125_WA))),
        ("La confirmó quien la mandó: actividad", dict(banda=banda, cuerpo=cpo["La confirmó quien la mandó"],
                                                       aside=vr("COB-000125", e21.actividad_recuadros(act125_wa()), L125_WA, "Actividad"))),
        ("Cargada automáticamente", dict(banda=banda, cuerpo=c123, aside=vr("COB-000123", r123, L123, pie="3 de 6", anterior=True))),
        ("Cargada automáticamente: actividad", dict(banda=banda, cuerpo=c123, aside=vr("COB-000123", e21.actividad_recuadros(act123()), L123,
                                                                                         "Actividad", pie="3 de 6", anterior=True))),
        ("Pantalla completa", dict(banda=e21.banda_completa("COB-000125", linea_gris=L125, version=VERSION, pos="1 de 6", volver=yo,
                                                            acciones=e21.acciones_banda(corregir=True, conversacion=conv, keb=True)),
                                   cuerpo=e21.cuerpo_completa(con_jpg(e21.respuesta(COB125, 3)), e21.actividad_tabla(act125())))),
    ]
    alto = 1100
    i, j, _ = e21.viejos_compu(t)
    partes = []
    for clave in ("banda", "cuerpo", "aside", "capa"):
        partes += [e21._sc(k, p[clave]) for k, (_, p) in enumerate(estados) if p.get(clave)]
    t = t[:i] + "".join(partes) + t[j:]
    css = e21.CSS_COMPU + CSS_RESP + f"/* L · El tablero crece para leer la pantalla completa entera. */\n.w-app {{ height: {alto}px !important; }}\n"
    t = con_css(con_titulo(t), css)
    t = e21.con_script(t, [n for n, _ in estados], 1440, alto, {"miga": [MIGA] * len(estados)})
    escribir("FRM-Respuesta-25", t, nl)


def m_frm_respuesta_25():
    t, nl = leer("M-FRM-Respuesta-25")
    assert MARCA not in t
    volver = "M-FRM-Respuestas-21.dc.html"
    conv = "M-WA-Chats-Documento.dc.html"

    def pag(num, linea, cuerpo, pos, anterior=False):
        return e21.pagina_tel(num, con_jpg(cuerpo), version=VERSION, linea_gris=linea, pos=pos, anterior=anterior, conversacion=conv,
                              lapiz=True, keb=True, volver=volver)

    estados = [
        ("La pasó alguien del equipo", dict(cuerpo=pag("COB-000125", L125, e21.respuesta(COB125, 1, True) + e21.actividad_tel(act125(True)), "1 de 41"))),
        ("Cargada automáticamente", dict(cuerpo=pag("COB-000123", L123, e21.respuesta(COB123, 1, True) + e21.actividad_tel(act123(True)),
                                                    "3 de 41", anterior=True))),
        ("Actividad", dict(cuerpo=pag("COB-000125", L125, e21.actividad_tel(act125(True)), "1 de 41"))),
    ]
    i, j, k, l, _ = e21.viejos_tel(t)
    cuerpos = "".join(e21._sc(n, p["cuerpo"]) for n, (_, p) in enumerate(estados))
    t = t[:i] + cuerpos + t[j:k] + e21.RAYA + t[l:]
    t = con_css(con_titulo(t), e21.CSS_TEL + CSS_RESP + CSS_RESP_TEL_MARCO)
    t = e21.con_script(t, [n for n, _ in estados], 390, 844)
    escribir("M-FRM-Respuesta-25", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el Inicio
SIN_PERMISO = "Ya no tenés el permiso «Diseñar formularios»."
SIN_MODULO = "Formularios está apagado en Grupo Delta."
SIN_CATALOGO = "El catálogo «Proveedores» ya no está."
CSS_INICIO = """
/* L · La tarjeta «Ya no disponible», plegada como la de una acción, con su motivo al lado (268). */
.d25-card.pleg { flex-wrap: wrap; }
.d25-card .mot { color: var(--t2); }
"""
CREADO = re.compile(r'<span class="etq">Borrador creado</span><a class="lnk" href="[^"]+">Abrir el borrador</a>')


def ya_no(motivo):
    def cambiar(b):
        b, n = CREADO.subn(f'<span class="etq">Ya no disponible</span><span class="mot">{motivo}</span>', b)
        return b if n else b
    return cambiar


def importar_ya_no(b):
    if '<div class="d25-card">' not in b:
        return b
    i = b.index('<div class="d25-card">')
    j = b2.fin_div(b, i)
    assert "Importar en «Proveedores»" in b[i:j]
    return (b[:i] + '<div class="d25-card pleg"><b>Importar en «Proveedores»</b><span class="etq">Ya no disponible</span>'
            f'<span class="mot">{SIN_CATALOGO}</span></div>' + b[j:])


def inicio(nombre):
    t, nl = leer(nombre)
    t = con_titulo(con_css(t, CSS_INICIO))
    nuevos = ["Ya no disponible: sin el permiso", "Ya no disponible: sin Formularios", "Ya no disponible: el catálogo ya no está"]
    s_creado, s_imp = var_de(t, "Borrador creado"), var_de(t, "Importar en un catálogo que existe")
    t, sv = sumar(t, [("Borrador creado", nuevos[:2]), ("Importar en un catálogo que existe", nuevos[2:])], nuevos)
    t = copiar_estado(t, s_creado, sv[nuevos[0]], ya_no(SIN_PERMISO))
    t = copiar_estado(t, s_creado, sv[nuevos[1]], ya_no(SIN_MODULO))
    t = copiar_estado(t, s_imp, sv[nuevos[2]], importar_ya_no)
    assert t.count(SIN_PERMISO) == 1 and t.count(SIN_MODULO) == 1 and t.count(SIN_CATALOGO) == 1, nombre
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- todo
HACER = [("WA-Chats-Documento", wa_chats_documento), ("M-WA-Chats-Documento", m_wa_chats_documento),
         ("FRM-Documentos", frm_documentos), ("M-FRM-Documentos", m_frm_documentos),
         ("FRM-Respuesta-25", frm_respuesta_25), ("M-FRM-Respuesta-25", m_frm_respuesta_25),
         ("Asistente-Org-25", lambda: inicio("Asistente-Org-25")), ("M-Asistente-Org-25", lambda: inicio("M-Asistente-Org-25"))]

if __name__ == "__main__":
    hechos = []
    for nombre, hacer in HACER:
        t, _ = leer(nombre)
        if MARCA in t:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        hacer()
        hechos.append(nombre)
    if hechos:
        subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(hechos)], check=True)
