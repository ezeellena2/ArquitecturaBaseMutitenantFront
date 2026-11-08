"""La etapa 25, documentos por WhatsApp y la IA que arma formularios y catálogos (25-documentos.md, sus partes y 25-texto-diseno.md
del back). Ninguno de estos tableros estaba dibujado: se arman con las piezas del lienzo, sin dibujar nada a mano.

Lo que tiene modelo en ArquitecturaBase lo sigue (126), con nuestras piezas: la bandeja como planilla con el documento en un panel
al costado (DOC5-A), los tres casos y los difíciles en el chat (DOC2 y DOC4), el formulario prellenado (DOC3), la lectura en el
editor (DOC1), «Armar formulario con la IA» (DOC6), la tarjeta del Inicio, «Ver cómo queda», el clip y el micrófono (IA1-A e IA4),
el resumen por WhatsApp (IA3-A) y el catálogo que propone el asistente (H4, la captura `catalog-manual-proposal`).

Valen las de toda la app (160 a 164, 173 a 175 y 180): lo que carga dibuja su encabezado y el aro, lo que no se deshace pide
confirmar con el foco en «Cancelar», el texto largo entero y el estado dicho una vez. La pasada de las piezas del traspaso 10
(`traspaso10_piezas_1004.py`) corre después sobre estos tableros, como sobre todos.

Las dos que eligió el usuario el 2026-11-07 (en DECISIONES):
- 181: un documento con ítems deja el bloque vacío para cargarlo a mano en el Flow;
- 182: «Casos» muestra arriba el bloque fijo «Armar formularios y catálogos», sin editar.

Uso: `python formularios_25_documentos_1004.py [--salida <carpeta>]`. Sin `--salida` escribe en el lienzo; con ella, en esa
carpeta (para probar). Lee los tableros base del lienzo. No toca `canvas.json`: sus entradas están en TITULOS.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_asistente_1004 as V  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_planilla_1004 as P  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import formularios_15_respuestas_1004 as R  # noqa: E402
import formularios_20_carga_1004 as W  # noqa: E402
import formularios_21_reglas_1004 as K  # noqa: E402
import formularios_22_biblioteca_1004 as B  # noqa: E402
import formularios_23_asistente_1004 as AS  # noqa: E402
import formularios_23_chats_1004 as CH  # noqa: E402
import gestion_formularios_1004 as G  # noqa: E402
import campana_1004 as CA  # noqa: E402

PROJ = F.PROJ
SALIDA = PROJ
svg, info = F.svg, F.info
CHEV, MAS, KEBAB, QUITAR, LAPIZ, TILDE, INFO, ALERTA = F.CHEV, A.MAS, A.KEBAB, A.QUITAR, A.LAPIZ, A.TILDE, F.INFO, F.ALERTA
BOT, CHECK, CHISPA, PLAY = AS.BOT, AS.CHECK, CH.CHISPA, CH.PLAY
DESCARGAR, X = A.DESCARGAR, A.X

# Decisiones 181 y 182 de la hoja de ruta (el usuario, 2026-11-07)
DECISIONES = {"bloque_en_documento": "vacio", "armar_en_casos": "visible"}

HOY, AYER, ANTEAYER = "03/11/2026", "02/11/2026", "01/11/2026"
ORG = "Grupo Delta"
LUCIA, TOMAS, PAULA, MARTIN, MARTINA = "Lucía Fernández", "Tomás Acosta", "Paula Méndez", "Martín Paz", "Martina López"

# ================================================================ Íconos propios de la etapa
DOCS_IC = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/><path d="M12 10.5v6"/><path d="m9.5 14 2.5 2.5 2.5-2.5"/>')
CANDADO = svg('<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.5"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>', 13)
ACERCAR = svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/><path d="M11 8.5v5M8.5 11h5"/>', 15)
ALEJAR = svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/><path d="M8.5 11h5"/>', 15)
GIRAR = svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>', 15)
CLIP = svg('<path d="m20.5 11.5-8.3 8.3a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/>', 18)
MICRO = svg('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v2.5"/>', 18)
ENVIAR = svg('<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>', 18, "2")
PARAR = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>'
UBICACION = svg('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>', 16)
CONTACTO = svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', 16)
FLECHA = svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', 14, "2")
LISTA_WA = svg('<path d="M9 6.5h10.5M9 12h10.5M9 17.5h10.5"/><circle cx="4.8" cy="6.5" r="1.1"/><circle cx="4.8" cy="12" r="1.1"/><circle cx="4.8" cy="17.5" r="1.1"/>', 16)
ESPERA = CA.ESPERA


def esc_html(t):
    return t.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


# ================================================================ El marco de la etapa: el panel de «Gestión de formularios» suma «Documentos recibidos»
ENTRADA_DOCS = ("documentos", "FRM-Documentos.dc.html", DOCS_IC, "Documentos recibidos", "6")


def panel25(activo="formularios"):
    """El panel de la 25: Formularios (con lo que espera tu decisión), Documentos recibidos (con los que esperan a alguien), Catálogos y
    Formularios que faltan. «Documentos recibidos» va debajo de «Formularios» (25-texto-diseno.md, 3)."""
    viejas = list(G.ENTRADAS)
    # Las de la 25: cada entrada lleva a su tablero de la etapa, y «Formularios que faltan» cuenta el tema que suman los documentos
    destino = {"formularios": "FRM-Formularios-25.dc.html", "catalogos": "FRM-Catalogos-25.dc.html", "faltan": "FRM-Faltan-25.dc.html"}
    entradas = [(c, destino.get(c, h), i, tx, "4" if c == "faltan" else n) for c, h, i, tx, n in viejas if c != "disenar"]
    k = next(i for i, e in enumerate(entradas) if e[0] == "formularios") + 1
    G.ENTRADAS[:] = entradas[:k] + [ENTRADA_DOCS] + entradas[k:]
    try:
        return G.panel(activo, None, "4")
    finally:
        G.ENTRADAS[:] = viejas


def marco25(n, t, activo="formularios", miga=None, alto=None):
    """Los tableros de «Gestión de formularios» de la 25: el menú, el panel de la etapa, las migas y el alto."""
    t = E.post(n, t, alto)
    t = W.css_y_alto(t, alto)
    t, k = G.PANEL_RE.subn(lambda m: panel25(activo), t)
    assert k == 1, (n, k)
    if miga:
        t, k = re.subn(r'<span>Inicio / [^<{]*</span>', f'<span>{miga}</span>', t, count=1)
        assert k == 1, n
    return t


def con_titulo(t, titulo):
    return re.sub(r"<title>[^<]*</title>", f"<title>{titulo}</title>", t, count=1)


def estilo(t, marca, bloque):
    """Un bloque de estilo propio de la etapa, una sola vez por marca."""
    t = re.sub(rf'<style data-e25="{marca}">.*?</style>\n', "", t, flags=re.S)
    return t.replace("</helmet>", f'<style data-e25="{marca}">\n{bloque}</style>\n</helmet>', 1)


def capas_en(t, estados, capas):
    """Lo que va encima (un panel al costado, un diálogo, un aviso), un sc-if por estado, al final del tablero."""
    if not capas:
        return t
    k = t.rindex("</div>\n</x-dc>")
    return t[:k] + "".join(f'<sc-if value="{{{{s{estados.index(e)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for e, h in capas.items()) + t[k:]


def boton(texto, clase="cb-sec", href=None, apagado="", extra=""):
    if apagado:
        return (f'<span class="e-tipw"><button type="button" class="cb {clase}" aria-disabled="true">{texto}</button>'
                f'<span class="e-tip" role="tooltip">{apagado}</span></span>')
    if href:
        return f'<a class="cb {clase}" href="{href}"{extra}>{texto}</a>'
    return f'<button type="button" class="cb {clase}"{extra}>{texto}</button>'


# ================================================================ Los datos de ejemplo (25-texto-diseno.md): Grupo Delta, sus formularios con lectura y sus documentos
CUIT_DELTA = "30-71890123-1"
CBU_GALICIA = "0070123100000045678901"
CBU_GALICIA_MAL = "0070123100000045678921"  # el dígito verificador no da: la lectura lo confundió
CBU_NACION = "0110456500000098765436"
CVU_MP = "0000031400000456789120"
CBU_DELTA = "0720321100000765432199"
PLANTILLA = "Comprobante de transferencia"
COBRO, PAGO, GASTOS, REMITO = "Cobro a cliente", "Pago a proveedor", "Rendición de gastos de viaje", "Remito de entrega"

# Lo que leyó de comprobante.jpg, el comprobante de Tomás: (pregunta, valor, marca) con marca "", "dudoso" o "no"
LEIDO_COB = [("Cliente", "Ferretería Rosales", ""), ("Monto", "150.000,00", ""), ("Moneda", "Pesos", ""), ("Fecha", "03/11/2026", ""),
             ("Número de operación", "0458 7129 03", "dudoso"), ("Concepto", None, "no"), ("Hora", "10:32", ""),
             ("Banco o billetera de origen", "Banco Galicia", ""), ("Cuenta de origen", CBU_GALICIA, ""), ("Titular de origen", "Ferretería Rosales S.R.L.", ""),
             ("CUIT o CUIL de origen", "30-71458236-0", ""), ("Banco o billetera de destino", "Banco Santander", ""), ("Cuenta de destino", CBU_DELTA, ""),
             ("Titular de destino", "Grupo Delta S.A.", ""), ("CUIT o CUIL de destino", CUIT_DELTA, "")]

# n, nombre del archivo, tipo, llegó, mandó, tipo de quien manda, formulario, resumen, estado, respuesta, se borra, empresa
DOCS = [
    ("d1", "comprobante.jpg", "img", f"{HOY} 10:35", TOMAS, "", COBRO, "$ 150.000,00 del Banco Galicia", "Propuesto", "", "", "Delta S.A."),
    ("d2", "comprobante-nacion.pdf", "pdf", f"{HOY} 10:20", MARTINA, "cliente", COBRO, "$ 86.500,00 del Banco Nación", "Confirmado", "COB-000124", "", ""),
    ("d3", "remito-0412.jpg", "remito", f"{HOY} 09:58", TOMAS, "", None, "Remito de Corralón El Puente", "Sin clasificar", "", "01/02/2027", "Delta S.A."),
    ("d4", "captura.jpg", "mp", f"{HOY} 09:40", PAULA, "", COBRO, "$ 32.000,00 por Mercado Pago", "Cargada automáticamente", "COB-000123", "", "Delta Sur S.R.L."),
    ("d5", "comprobante.jpg", "img", f"{AYER} 18:12", MARTIN, "", PAGO, "$ 68.500,00 del Banco Macro", "Propuesto", "", "", "Delta Norte S.A."),
    ("d6", "remito-0398.jpg", "remito", f"{AYER} 16:05", PAULA, "", None, "Remito de Sanitarios del Sur", "Sin clasificar", "", "31/01/2027", "Delta Sur S.R.L."),
    ("d7", "orden-de-pago.docx", "docx", f"{AYER} 11:47", MARTIN, "", PAGO, "$ 412.000,00 a Corralón El Puente", "Confirmado", "PAG-000017", "", "Delta Norte S.A."),
    ("d8", "ticket.jpg", "ticket", f"{ANTEAYER} 20:10", TOMAS, "", GASTOS, "$ 52.360,00 en Estación Ruta 8", "Descartado", "", "30/01/2027", "Delta S.A."),
    ("d9", "remito-0377.jpg", "remito", f"{ANTEAYER} 12:30", TOMAS, "", None, "Remito de Pinturerías Oeste", "Sin clasificar", "", "30/01/2027", "Delta S.A."),
    ("d10", "pagos-semana.xlsx", "xlsx", "31/10/2026 17:20", MARTINA, "cliente", COBRO, "Fila 4 de 7 · $ 21.300,00", "Confirmado", "COB-000119", "", ""),
]
DOC = {d[0]: d for d in DOCS}
CLASE_DOC = {"Propuesto": "pend", "Sin clasificar": "amb", "Confirmado": "", "Cargada automáticamente": "", "Descartado": "off"}

CSS_25 = """/* E25 · documentos y la IA que arma */
.w-est.amb { color: var(--alerta); }
.w-est.amb::before { background: oklch(0.72 0.15 70); }
.d25-mini { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 36px; flex: none; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 3px;
  background: #fff; font-size: 8.5px; font-weight: 700; letter-spacing: 0.02em; color: #fff; }
.d25-mini.img, .d25-mini.mp, .d25-mini.remito, .d25-mini.ticket { background: repeating-linear-gradient(180deg, #fff 0 5px, oklch(0.9 0.006 95) 5px 6px); }
.d25-mini.pdf { background: oklch(0.55 0.18 25); border-color: oklch(0.55 0.18 25); }
.d25-mini.docx { background: oklch(0.5 0.13 255); border-color: oklch(0.5 0.13 255); }
.d25-mini.xlsx { background: oklch(0.5 0.12 150); border-color: oklch(0.5 0.12 150); }
.d25-arch { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
.d25-arch .n { min-width: 0; overflow-wrap: anywhere; }
.d25-g { color: var(--t3); }
"""


def mini(tipo):
    letras = {"pdf": "PDF", "docx": "DOCX", "xlsx": "XLSX"}.get(tipo, "")
    return f'<span class="d25-mini {tipo}" aria-hidden="true">{letras}</span>'


def archivo(nombre, tipo):
    return f'<span class="d25-arch">{mini(tipo)}<span class="n">{nombre}</span></span>'


def est_doc(e):
    return f'<span class="w-est {CLASE_DOC[e]}">{e}</span>'


# ================================================================ Los documentos dibujados: lo que mandaron, como imagen (datos ficticios)
CSS_DOCUMENTO = """.d25-doc { box-sizing: border-box; width: 280px; padding: 14px 16px; background: #fff; border: 1px solid oklch(0.88 0.008 95); border-radius: 2px;
  font-size: 11px; line-height: 1.45; color: oklch(0.3 0.01 250); text-align: left; flex: none; }
.d25-doc .b { font-size: 13px; font-weight: 700; color: oklch(0.25 0.02 250); }
.d25-doc .s { color: oklch(0.55 0.01 250); font-size: 10px; }
.d25-doc .m { font-size: 19px; font-weight: 700; margin: 6px 0 4px; color: oklch(0.22 0.02 250); }
.d25-doc .k { display: block; margin-top: 5px; color: oklch(0.55 0.01 250); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; }
.d25-doc .sep { border-top: 1px dashed oklch(0.85 0.008 95); margin: 7px 0 2px; }
.d25-doc .fila { display: flex; justify-content: space-between; gap: 10px; }
.d25-doc table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10.5px; }
.d25-doc td { border-top: 1px solid oklch(0.9 0.006 95); padding: 3px 0; vertical-align: top; }
.d25-doc td.c { width: 34px; text-align: right; padding-right: 8px; font-variant-numeric: tabular-nums; }
.d25-doc.ticket { font-family: ui-monospace, Consolas, monospace; font-size: 10.5px; }
.d25-doc.papel { background: oklch(0.985 0.012 90); }
.d25-doc.movida { filter: blur(1.6px); }
.d25-doc.mp .b { color: oklch(0.5 0.13 245); }
.d25-doc.chico { width: 200px; padding: 10px 11px; font-size: 8.5px; }
.d25-doc.chico .b { font-size: 10px; } .d25-doc.chico .m { font-size: 14px; } .d25-doc.chico .k { font-size: 7.5px; } .d25-doc.chico table { font-size: 8px; }
.d25-doc.chico .s { font-size: 8px; }
"""


def documento(tipo="img", clase=""):
    """El documento que llegó, dibujado como la foto o la primera página: un comprobante, una captura, un remito en papel o un ticket."""
    c = f"d25-doc {tipo} {clase}".strip()
    if tipo == "mp":
        return (f'<div class="{c}" role="img" aria-label="Captura de una transferencia de Mercado Pago"><span class="b">Mercado Pago</span><br><span class="s">Transferencia enviada</span>'
                f'<div class="m">$ 32.000,00</div><span class="s">{HOY} · 09:38</span><span class="k">De</span>Sanitarios del Sur S.A.<br>CVU {CVU_MP}'
                f'<span class="k">Para</span>Grupo Delta S.A.<span class="k">Número de operación</span>88412 03317</div>')
    if tipo == "remito":
        return (f'<div class="{c} papel" role="img" aria-label="Foto de un remito en papel"><div class="fila"><span class="b">REMITO</span><span>N° 0001-00000412</span></div>'
                f'<span class="s">Corralón El Puente S.R.L. · CUIT 30-70912345-5</span><div class="sep"></div>Fecha: {HOY}<br>Entregar a: Grupo Delta S.A. · Av. Rivadavia 4520'
                '<table><tr><td class="c">12</td><td>Bolsas de cemento de 50 kg</td></tr><tr><td class="c">4</td><td>Caños de PVC de 110 mm</td></tr>'
                '<tr><td class="c">30</td><td>Ladrillos huecos de 12 × 18 × 33</td></tr></table><div class="sep"></div><span class="s">Recibí conforme: ____________</span></div>')
    if tipo == "ticket":
        return (f'<div class="{c}" role="img" aria-label="Foto de un ticket de combustible"><span class="b">ESTACIÓN RUTA 8 S.R.L.</span><br>CUIT 30-71122334-3 · Ticket 0004-00087211<br>'
                f'{ANTEAYER} · 20:04<div class="sep"></div><div class="fila"><span>Nafta súper</span><span>38,50 L</span></div><div class="fila"><span>Patente</span><span>AB 123 CD</span></div>'
                '<div class="sep"></div><div class="fila"><b>TOTAL</b><b>$ 52.360,00</b></div></div>')
    return (f'<div class="{c}" role="img" aria-label="Foto de un comprobante de transferencia"><span class="b">Banco Galicia</span><br><span class="s">Transferencia inmediata</span>'
            f'<div class="m">$ 150.000,00</div><span class="k">Fecha y hora</span>{HOY} · 10:32<span class="k">N° de operación</span>0458 7129 08'
            f'<div class="sep"></div><span class="k">Origen</span>Ferretería Rosales S.R.L.<br>CUIT 30-71458236-0<br>CBU {CBU_GALICIA}'
            f'<span class="k">Destino</span>Grupo Delta S.A.<br>CUIT {CUIT_DELTA}<br>CBU {CBU_DELTA}</div>')


# ================================================================ FRM-Documentos: la bandeja, una planilla con el documento en un panel al costado (DOC5-A)
AY_DOCS = "Lo que llega por WhatsApp a los formularios que leen documentos. Un sin clasificar o un descartado se borra a los 90 días, con su lectura."
COLS_DOC = [("arch", "Documento", 220, ""), ("lle", "Llegó", 132, ""), ("quien", "Mandó", 160, ""), ("form", "Formulario", 190, ""), ("res", "Lo leído", 240, ""),
            ("est", "Estado", 180, ""), ("resp", "Respuesta", 108, ""), ("borra", "Se borra", 100, "")]
SUBE, BAJA, CERRAR = R.SUBE, R.BAJA, K.CERRAR


def celda_doc(clave, d):
    n, nombre, tipo, lle, quien, qt, form, res, est, resp, borra, _emp = d
    if clave == "arch":
        return f'<span><a class="pl-num d25-a" href="#">{archivo(nombre, tipo)}</a></span>'
    if clave == "quien":
        return R.quien(quien, qt)
    if clave == "form":
        return f"<span>{form}</span>" if form else f'<span>{R.gris("—")}</span>'
    if clave == "est":
        return f"<span>{est_doc(est)}</span>"
    if clave == "resp":
        return f'<span><a class="pl-num" href="FRM-Respuesta-25.dc.html">{resp}</a></span>' if resp else "<span></span>"
    if clave == "borra":
        return f"<span>{borra}</span>"
    return "<span>" + {"lle": lle, "res": res}[clave] + "</span>"


def tabla_doc(docs=None, sel=None, pie="1–10 de 27", pag="Página 1 de 3", cuerpo=None, aten=False):
    docs = DOCS if docs is None else docs
    if cuerpo is None:
        cuerpo = "".join(f'<div class="w-tr pl{" sel" if d[0] == sel else ""}">' + "".join(celda_doc(k, d) for k, *_ in COLS_DOC) + "</div>" for d in docs)
    pie_html = f'<div class="w-pie"><span>{pie}</span><span>10 por página · {pag}</span></div>' if pie else ""
    return (f'<div class="w-caja pl-caja{" aten" if aten else ""}" style="--pl-cols: {R.plantilla(COLS_DOC)};"><div class="pl-scroll">{R.cabecera(COLS_DOC)}{cuerpo}</div>'
            f'{pie_html}</div>')


F_LISTA = [("quien", "Mandó"), ("lle", "Llegó")]
F_OPC = {"quien": ["Todas las personas", TOMAS, PAULA, MARTIN, f"{MARTINA} · Cliente"], "lle": ["Todas las fechas", "Hoy", "Últimos 7 días", "Octubre 2026", "Elegir fechas…"]}


def menu_filtros_doc(sel="quien", elegido=None):
    """«Filtros», como «Columnas» (144): a la izquierda lo que se filtra, a la derecha lo que se elige en lo marcado."""
    izq = "".join(f'<span{" class=" + chr(34) + "on" + chr(34) if k == sel else ""}>{n}</span>' for k, n in F_LISTA)
    ops = F_OPC[sel]
    e = elegido or ops[0]
    lista = ('<span class="lst2" role="listbox">' + "".join(f'<span class="{"sel" if o == e else ""}">{R.tl(o == e)}{o}</span>' for o in ops) + "</span>")
    der = f'<b>{dict(F_LISTA)[sel]}</b><span class="cmb ab" role="combobox" aria-expanded="true">{e} {CHEV}</span>{lista}'
    return f'<span class="pl-fmn" role="dialog" aria-label="Filtros"><span class="fi">{izq}</span><span class="fd">{der}</span></span>'


def pil(nombre, texto, items=(), elegido=None, abierto=False):
    menu = ""
    if abierto:
        menu = (f'<span class="f-mn" role="listbox" aria-label="Filtrar por {nombre.lower()}">'
                + "".join(f'<span role="option" aria-selected="{"true" if i == elegido else "false"}" class="pl-op{" sel" if i == elegido else ""}">{R.tl(i == elegido)}{o}</span>'
                          for i, o in enumerate(items)) + "</span>")
    con = " con" if texto != nombre else ""
    return f'<span class="f-env"><span class="w-pil{con}" role="button" aria-haspopup="listbox">{texto} {CHEV}</span>{menu}</span>'


ESTADOS_FILTRO = ["Todos los estados", "Propuesto", "Sin clasificar", "Confirmado", "Cargada automáticamente", "Descartado"]


def barra_doc(modo="normal"):
    """El buscador, «Formulario», «Estado» y «Empresa» a la vista, y lo demás en un solo «Filtros», con lo aplicado en chips (143 y 144)."""
    buscando = modo == "busqueda"
    bus = (f'<span class="w-bus lleno">{F.BUSCAR} 150000</span>' if buscando else f'<span class="w-bus">{F.BUSCAR} Monto, CUIT u operación</span>')
    filtrado = modo == "filtrado"
    h = bus + pil("Formulario", "Formulario")
    h += pil("Estado", "Estado: Sin clasificar" if filtrado else "Estado", ESTADOS_FILTRO, 2 if filtrado else 0, modo == "estado")
    h += pil("Empresa", "Empresa")
    chips = ["Estado: Sin clasificar", "Llegó: últimos 7 días"] if filtrado else []
    menu = menu_filtros_doc() if modo == "filtros" else ""
    n = ' <span class="n">1</span>' if filtrado else ""
    h += (f'<span class="pl-env"><span class="w-pil pl-fil" role="button" aria-haspopup="dialog" aria-expanded="{"true" if menu else "false"}">{R.FILTROS} Filtros{n}</span>{menu}</span>')
    return f'<div class="w-caja o-fb pl-fb">{h}{R.chips5(chips)}</div>'


CSS_BANDEJA = """.d25-a { text-decoration: none; color: var(--t1); }
.w-oscuro { z-index: 40 !important; }
.w-caja.o-fb.pl-fb { overflow: visible; }
.pl-fb .pl-fmn { width: 520px; left: auto !important; right: 0 !important; }
.d25-a:hover .n { text-decoration: underline; }
.w-tr.pl > span:first-child { display: flex; align-items: center; }
.w-tr.pl .d25-arch { line-height: 1.3; }
.w-tr.pl > span { line-height: 1.35 !important; padding-top: 9px; padding-bottom: 9px; display: flex; align-items: center; }
.d2.d25 { width: 640px; }
.d25-sub { padding: 8px 20px 0; font-size: 13px; color: var(--t2); }
.d25-visor { margin: 12px 20px 0; border: 1px solid var(--borde); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
.d25-vbar { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-bottom: 1px solid var(--borde); background: #fff; font-size: 12.5px; color: var(--t2); }
.d25-vbar .ib { width: 28px; height: 28px; }
.d25-vbar .pg { margin-left: 6px; }
.d25-vbar .cb { margin-left: auto; height: 28px; font-size: 12.5px; }
.d25-vfondo { display: flex; justify-content: center; align-items: flex-start; height: 236px; overflow: hidden; padding: 14px; box-sizing: border-box; background: var(--s3); }
.d25-rev { padding: 14px 20px 6px; display: flex; flex-direction: column; gap: 12px; }
.d25-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: end; }
.d25-form .ct { display: flex; justify-content: space-between; align-items: center; }
.d25-rec { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 3px; font-size: 12.5px; color: var(--t2); white-space: nowrap; }
.d25-rec svg { color: var(--marca-tx); }
.d25-datos { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px 14px; }
.d25-datos .w-cmp .ct { position: relative; overflow-wrap: anywhere; }
.d25-datos .ct.duda { border-color: oklch(0.72 0.15 70); box-shadow: inset 0 0 0 1px oklch(0.72 0.15 70); }
.d25-datos .ct.vacio { color: var(--t3); }
.d25-datos .ct.mal { border-color: var(--peligro); }
.d25-marca { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); height: 20px; padding: 0 6px; border-radius: 3px; display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 600; background: var(--alerta-t); color: var(--alerta); }
.d25-marca svg { width: 12px; height: 12px; }
.d25-marca.no { background: var(--s3); color: var(--t2); }
.d25-datos .err2 { font-size: 12.5px; color: var(--peligro); }
.d25-ro { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 7px 14px; font-size: 13.5px; }
.d25-ro .k { color: var(--t2); }
.d25-ro > span { overflow-wrap: anywhere; }
.d25-rev .sep2 { border-top: 1px solid var(--borde); }
.d25-pie { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--borde); background: #fff; flex-shrink: 0; }
.d25-pie .pos { margin-right: auto; font-size: 13px; color: var(--t3); }
.d25-sc { flex: 1; min-height: 0; overflow: auto; }
.d25-lee { display: flex; align-items: center; gap: 10px; padding: 26px 0; color: var(--t2); font-size: 13.5px; }
.d25-ir { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 4px 0 8px; font-size: 13.5px; }
.pl-vacio { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 28px 16px; font-size: 14px; }
"""


def dato(rot, valor, marca="", err=""):
    """Un dato leído, para corregir: lo dudoso con «Revisá» y el borde de atención; lo que no se leyó, vacío con «No se leyó» (DOC3 y DOC5-A)."""
    if marca == "no":
        ct = '<div class="ct vacio"><span class="d25-marca no">No se leyó</span></div>'
    elif marca == "dudoso":
        ct = f'<div class="ct duda">{valor}<span class="d25-marca">{ALERTA} Revisá</span></div>'
    else:
        ct = f'<div class="ct{" mal" if err else ""}">{valor}</div>'
    e = f'<span class="err2" role="alert">{err}</span>' if err else ""
    return f'<div class="w-cmp"><span class="rt">{rot}</span>{ct}{e}</div>'


def datos_cob(err_cuenta=False, corregido=False):
    filas = []
    for rot, v, marca in LEIDO_COB:
        if corregido and rot in ("Número de operación", "Concepto"):
            v, marca = ("0458 7129 08" if rot == "Número de operación" else "Factura 0003-00001845"), ""
        if err_cuenta and rot == "Cuenta de origen":
            filas.append(dato(rot, CBU_GALICIA_MAL, err="Los números de la cuenta no dan. Copiala del comprobante."))
            continue
        filas.append(dato(rot, v, marca))
    return '<div class="d25-datos">' + "".join(filas) + "</div>"


def lectura_ro(filas):
    return '<div class="d25-ro">' + "".join(f'<span class="k">{k}</span><span>{v}</span>' for k, v in filas) + "</div>"


def visor(doc_html, paginas="Página 1 de 1"):
    barra = (f'<div class="d25-vbar"><button type="button" class="ib" aria-label="Acercar">{ACERCAR}</button><button type="button" class="ib" aria-label="Alejar">{ALEJAR}</button>'
             f'<span>100 %</span><button type="button" class="ib" aria-label="Girar">{GIRAR}</button><span class="pg">{paginas}</span>'
             f'<button type="button" class="cb cb-sec">{DESCARGAR} Descargar</button></div>')
    return f'<div class="d25-visor">{barra}<div class="d25-vfondo">{doc_html}</div></div>'


def sel_form(valor=COBRO, abierto=False, rec="Reconocido por la IA · seguro", apagado=False):
    ops = [COBRO, PAGO, GASTOS]
    menu = ""
    if abierto:
        menu = ('<div class="q-catmn" role="listbox" aria-label="Formulario" style="top: 58px; left: 0; right: auto; width: 100%;">'
                + "".join(f'<span class="{"on" if o == valor else ""}" role="option">{o}</span>' for o in ops) + "</div>")
    vacio = valor is None
    ct = (f'<div class="ct ro">{valor}</div>' if apagado else
          f'<div class="ct sel{" ph" if vacio else ""}{" abierto" if abierto else ""}">{"Elegí un formulario" if vacio else valor}{CHEV}</div>')
    r = f'<span class="d25-rec">{CHISPA} {rec}</span>' if rec else "<span></span>"
    return f'<div class="d25-form"><div class="w-cmp q-cat" style="position: relative;"><span class="rt">Formulario</span>{ct}{menu}</div>{r}</div>'


def panel_doc(d, cuerpo, pie, pos="1 de 27", primera=True):
    _n, nombre, _tipo, lle, quien, qt, _form, _res, est, *_ = d
    nav = (f'<button type="button" class="nv" aria-label="Documento anterior" title="Anterior (↑)"{" disabled" if primera else ""}>{SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Documento siguiente" title="Siguiente (↓)">{BAJA}</button>')
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{CERRAR}</button>'
    quien_txt = f"{quien} · Cliente" if qt == "cliente" else quien
    pie_html = f'<div class="d25-pie"><span class="pos">{pos}</span>{pie}</div>'
    return (f'<aside class="d2 d25" role="region" aria-label="Documento {nombre}"><div class="d2-h"><b>{nombre}</b>{est_doc(est)}{nav}{cerrar}</div>'
            f'<div class="d25-sc"><div class="d25-sub">{quien_txt} · por WhatsApp · {lle}</div>{cuerpo}</div>{pie_html}</aside>')


ARO = '<span class="t10-aro" aria-hidden="true"></span>'
CSS_ARO = """.t10-aro { width: 22px; height: 22px; box-sizing: border-box; border-radius: 50%; border: 2.5px solid oklch(0.89 0.031 95); border-top-color: var(--marca); animation: t10-gira 0.9s linear infinite; display: inline-block; flex: none; }
@keyframes t10-gira { to { transform: rotate(360deg); } }
.t10-carga { height: 320px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--borde); }
"""


def panel_propuesto(modo="normal"):
    """Un propuesto: el documento arriba, el formulario que reconoció y sus datos, para corregir; «Descartar» y «Pasar al formulario» abajo."""
    d = DOC["d1"]
    if modo == "leyendo":
        rev = sel_form(PAGO, rec="") + f'<div class="d25-lee" role="status">{ARO} Leyendo los datos para {PAGO}…</div>'
        pie = boton("Descartar", extra=" disabled") + boton("Pasar al formulario", "cb-pri", extra=" disabled")
        return panel_doc(d, visor(documento()) + f'<div class="d25-rev">{rev}</div>', pie)
    if modo == "ver":
        filas = [(r, v if v else R.gris("No se leyó")) for r, v, _m in LEIDO_COB]
        rev = sel_form(COBRO, apagado=True) + lectura_ro(filas)
        return panel_doc(d, visor(documento()) + f'<div class="d25-rev">{rev}</div>', "")
    pasa = E.trabaja("Pasando…") if modo == "pasando" else boton("Pasar al formulario", "cb-pri")
    descartar = boton("Descartar", extra=" disabled" if modo == "pasando" else "")
    rev = sel_form(COBRO, abierto=modo == "menu") + datos_cob(err_cuenta=modo == "mal", corregido=modo in ("pasando", "corregido"))
    return panel_doc(d, visor(documento()) + f'<div class="d25-rev">{rev}</div>', descartar + pasa)


def panel_confirmado():
    d = ("d1", "comprobante.jpg", "img", f"{HOY} 10:35", TOMAS, "", COBRO, "", "Confirmado", "COB-000125", "", "")
    filas = [("Formulario", COBRO), ("Respuesta", '<a class="lnk" href="FRM-Respuesta-25.dc.html">COB-000125</a>'), ("La revisó", f"{LUCIA} · {HOY} 10:52")]
    datos = [(r, {"Número de operación": "0458 7129 08", "Concepto": "Factura 0003-00001845"}.get(r, v)) for r, v, _m in LEIDO_COB]
    return panel_doc(d, visor(documento()) + f'<div class="d25-rev">{lectura_ro(filas)}<div class="sep2"></div>{lectura_ro(datos)}</div>', "")


def panel_sin_clasificar():
    d = DOC["d3"]
    rev = sel_form(None, rec="") + '<div class="d25-ir"><a class="cb cb-sec" href="FRM-Armar-Con-IA.dc.html">Armar formulario con la IA</a></div>'
    return panel_doc(d, visor(documento("remito")) + f'<div class="d25-rev">{rev}</div>', boton("Descartar") + boton("Pasar al formulario", "cb-pri", extra=" disabled"),
                     pos="3 de 27", primera=False)


def panel_auto():
    d = DOC["d4"]
    porque = info("Reconocido sin duda, con las validaciones bien y sin duplicado, y sus últimas 20 cargas se confirmaron sin correcciones.")
    filas = [("Formulario", COBRO), ("Respuesta", '<a class="lnk" href="FRM-Respuesta-25.dc.html">COB-000123</a>'), ("La cargó", f"«Cargar solo si es seguro» · {HOY} 09:41 {porque}")]
    datos = [("Cliente", "Sanitarios del Sur S.A."), ("Monto", "32.000,00"), ("Moneda", "Pesos"), ("Fecha", HOY), ("Número de operación", "88412 03317"),
             ("Banco o billetera de origen", "Mercado Pago"), ("Cuenta de origen", CVU_MP)]
    return panel_doc(d, visor(documento("mp")) + f'<div class="d25-rev">{lectura_ro(filas)}<div class="sep2"></div>{lectura_ro(datos)}</div>',
                     '<a class="cb cb-sec" href="FRM-Respuesta-25.dc.html">Abrir COB-000123</a>', pos="4 de 27", primera=False)


def dlg_descartar():
    return F.dialogo("¿Descartar comprobante.jpg?", '<p class="d-tx">Se borra el 01/02/2027, con su lectura. Hasta entonces lo podés volver a abrir.</p>',
                     '<button type="button" class="cb cb-sec" autofocus>Cancelar</button><button type="button" class="cb cb-pel lleno">Descartar</button>')


def dlg_pasar():
    return F.dialogo(f"¿Pasar comprobante.jpg a {COBRO}?", f'<p class="d-tx">Se guarda como una respuesta de {TOMAS}, por WhatsApp, y corren las reglas del formulario.</p>',
                     '<button type="button" class="cb cb-sec" autofocus>Cancelar</button><button type="button" class="cb cb-pri">Pasar al formulario</button>')


E_DOCS = ["Documentos", "Un propuesto", "Cambiar el formulario", "Volviendo a leer", "Un dato que no pasa", "Pasar al formulario", "Pasando", "Confirmado",
          "Descartar", "Un sin clasificar", "Cargada automáticamente", "Filtros", "Con filtros", "Buscando un monto", "Solo ver", "Cargando", "Sin documentos"]
CSS_PAGINA_DOCS = (F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + E.CSS_E12 + P.CSS_PANEL + P.CSS_PL + R.CSS_15 + R.CSS_T5 + F.CSS_GRILLA
                   + P.CSS_D2 + R.CSS_D3 + CSS_25 + CSS_DOCUMENTO + CSS_BANDEJA + CSS_ARO + ".w-bnd h1 .f-i { vertical-align: middle; margin-left: 6px; }\n")


def banda_docs(cargando=False):
    b = F.banda("Documentos recibidos" + info(AY_DOCS), "" if cargando else "6 por revisar", "")
    return b.replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{DOCS_IC}</span>', 1)


def documentos():
    sin_clas = [d for d in DOCS if d[8] == "Sin clasificar"]
    carga = f'<div class="t10-carga" role="status" aria-label="Cargando">{ARO}</div>'
    vacio = '<div class="pl-vacio"><b>Todavía no llegó ningún documento.</b></div>'
    fondo = {"Filtros": barra_doc("filtros") + tabla_doc(), "Con filtros": barra_doc("filtrado") + tabla_doc(sin_clas, pie="1–3 de 3", pag="Página 1 de 1"),
             "Buscando un monto": barra_doc("busqueda") + tabla_doc([DOC["d1"]], pie="1–1 de 1", pag="Página 1 de 1"),
             "Cargando": barra_doc() + tabla_doc(cuerpo=carga, pie=""), "Sin documentos": barra_doc() + tabla_doc(cuerpo=vacio, pie="0 de 0", pag="Página 1 de 1")}
    sel = {"Documentos": None, "Un sin clasificar": "d3", "Cargada automáticamente": "d4"}
    cuerpos = {e: '<div class="w-body">' + fondo.get(e, barra_doc() + tabla_doc(sel=sel.get(e, "d1"))) + "</div>" for e in E_DOCS}
    paneles = {"Un propuesto": panel_propuesto(), "Cambiar el formulario": panel_propuesto("menu"), "Volviendo a leer": panel_propuesto("leyendo"),
               "Un dato que no pasa": panel_propuesto("mal"), "Pasar al formulario": panel_propuesto("corregido"), "Pasando": panel_propuesto("pasando"),
               "Confirmado": panel_confirmado(), "Descartar": panel_propuesto(), "Un sin clasificar": panel_sin_clasificar(), "Cargada automáticamente": panel_auto(),
               "Solo ver": panel_propuesto("ver")}
    dialogos = {"Descartar": dlg_descartar(), "Pasar al formulario": dlg_pasar(), "Confirmado": A.toast("Guardamos COB-000125.")}
    t = A.pagina_ab("Documentos recibidos · /org/formularios/documentos", "Inicio / Gestión de formularios / Documentos recibidos",
                    A.con_estados([(e, banda_docs(e == "Cargando")) for e in E_DOCS]), A.con_estados([(e, cuerpos[e]) for e in E_DOCS]), css=CSS_PAGINA_DOCS,
                    estados=("estado", E_DOCS), js=A.js_estados(E_DOCS))
    t = capas_en(t, E_DOCS, paneles)
    t = F.con_dialogo(t, "".join(f'<sc-if value="{{{{s{E_DOCS.index(e)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for e, h in dialogos.items()),
                      F.CSS_PUBLICAR + F.CSS_GRILLA)
    return marco25("FRM-Documentos", t, "documentos", "Inicio / Gestión de formularios / Documentos recibidos")


# ================================================================ La campana de la 25: los documentos por revisar y los parecidos
AVISOS_25 = [("espera", ESPERA, "6 documentos por revisar", f"{HOY} 10:40", "FRM-Documentos.dc.html", "M-FRM-Documentos.dc.html"),
             ("espera", ESPERA, "Llegaron 3 documentos parecidos: remitos de entrega", f"{HOY} 09:58", "FRM-Armar-Con-IA.dc.html", "M-FRM-Armar-Con-IA.dc.html")] + CA.AVISOS_23
CANT_25 = str(len(AVISOS_25))


def con_campana25(t):
    """La campana del encabezado abre la de la 25, con su número (la regla de avisos del 25/10)."""
    t = CA.con_campana(t, CANT_25)
    t = CA.numero(t, CANT_25)
    return re.sub(r'(<a class="w-campana[^"]*" href=")[^"]*(")', r"\1Campana-25.dc.html\2", t)


def campana25():
    """Como `abierta` de campana_1004.py, sobre la bandeja de la 25."""
    t = con_campana25(documentos())
    lista = CA.lista(avisos=AVISOS_25)
    viejo = re.search(r'<span class="w-cmp-env"><a class="w-campana" href="[^"]*" aria-label="Avisos: \d+">.*?</a></span>', t, re.S).group(0)
    nuevo = CA.boton(CANT_25, href="#", abierto=True, lista=lista).replace('href="#" aria-label', 'href="#" aria-expanded="true" aria-label', 1)
    t = t.replace(viejo, nuevo, 1)
    props = {"campana": {"editor": "enum", "options": ["Con avisos"], "default": "Con avisos", "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = re.sub(r"data-props='[^']*'", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    return con_titulo(t, "Avisos · la campana · etapa 25")


def tel_campana25():
    bar = C.t_bar("Avisos", ORG, "M-Inicio-Org.dc.html")
    return C.tel_pagina({"Con avisos": bar + f'<div class="ap-cuerpo">{CA.filas_tel(AVISOS_25)}</div>'}, ["Con avisos"], {}, "Avisos · la campana · teléfono · etapa 25",
                        CA.CSS + CA.CSS_TEL)


# ================================================================ Las listas: «Armar con la IA» junto a «Nuevo formulario» y «Nuevo catálogo», y en cada tema (154)
ARMAR_FORM = '<a class="cb cb-sec" href="Asistente-Org-25.dc.html">Armar con la IA</a>'


def entrada_panel(clave, cond=None):
    _c, href, icono, texto, cnt = {"documentos": ENTRADA_DOCS, "faltan": ("faltan", "FRM-Faltan-25.dc.html", G.ICONOS["FRM-Faltan.dc.html"], "Formularios que faltan", "4")}[clave]
    a = f'<a class="w-ln" href="{href}">{icono} {texto} <span class="cnt">{cnt}</span></a>'
    return f'<sc-if value="{{{{{cond}}}}}" hint-placeholder-val="{{{{si}}}}">{a}</sc-if>' if cond else a


def formularios25():
    """La lista de la 22 con «Armar con la IA» antes de «Nuevo formulario», para quien puede diseñar, y el panel de la 25."""
    t = (PROJ / "FRM-Formularios-22.dc.html").read_text(encoding="utf-8")
    mis = getattr(CH.K2, "con_mis_cargas", None)  # «Mis cargas» y «Mi última carga» de quien solo carga (153), como FRM-Formularios-21
    if mis:
        t = mis(t)
    ancla = '<sc-if value="{{conNuevo}}" hint-placeholder-val="{{si}}"><a class="cb cb-pri" href="#" aria-haspopup="menu"'
    assert t.count(ancla) == 1, "Nuevo formulario"
    t = t.replace(ancla, f'<sc-if value="{{{{conNuevo}}}}" hint-placeholder-val="{{{{si}}}}">{ARMAR_FORM}</sc-if>' + ancla, 1)
    panel = G.PANEL_RE.search(t).group(0)
    m = re.search(r'<sc-if value="\{\{verFormularios\}\}" hint-placeholder-val="\{\{si\}\}"><a class="w-ln on" href="FRM-Formularios\.dc\.html">.*?</a></sc-if>', panel, re.S)
    assert m, "la entrada Formularios"
    nuevo = panel.replace(m.group(0), m.group(0) + entrada_panel("documentos", "verFormularios"), 1).replace("</nav>", entrada_panel("faltan", "verDisena") + "</nav>", 1)
    nuevo = nuevo.replace('href="FRM-Formularios.dc.html"', 'href="FRM-Formularios-25.dc.html"').replace('href="FRM-Catalogos.dc.html"', 'href="FRM-Catalogos-25.dc.html"')
    t = t.replace(panel, nuevo, 1)
    t = re.sub(r'href="Campana-[^"]*"', 'href="Campana-25.dc.html"', t)
    return con_titulo(con_campana25(t), "Formularios · la lista · etapa 25")


CATALOGOS_PROPUESTOS = [("Proveedores de obra", "FRM-Catalogo-Propuesta-25.dc.html", "Escritas a mano"), ("Supervisores de Delta Norte", "FRM-Catalogo-Propuesta-25.dc.html", "De los miembros")]


def catalogos25():
    """La lista de la 14 con «Armar con la IA» antes de «Nuevo catálogo» y, arriba, los dos que propuso el asistente, con su etiqueta (167)."""
    t = (PROJ / "FRM-Catalogos-14.dc.html").read_text(encoding="utf-8")
    ancla = re.search(r'<a class="cb cb-pri" href="FRM-Catalogo-Nuevo\.dc\.html">', t)
    assert ancla, "Nuevo catálogo"
    t = t.replace(ancla.group(0), ARMAR_FORM + ancla.group(0))
    m = re.search(r'<sc-if value="\{\{(\w+)\}\}" hint-placeholder-val="\{\{si\}\}"><div class="w-tr k14"><span class="k-tc"><a href="FRM-Catalogo-Filtros\.dc\.html">Supervisores</a>.*?</sc-if>', t, re.S)
    assert m, "la fila de Supervisores"
    fila = m.group(0)
    nuevas = ""
    for nombre, destino, origen in CATALOGOS_PROPUESTOS:
        f = fila.replace(">Supervisores</a>", f'>{nombre}</a><span class="d25-prop">Propuesta del asistente</span>').replace('href="FRM-Catalogo-Filtros.dc.html"', f'href="{destino}"')
        f = re.sub(r'<span class="est2"><span class="w-est [^"]*">[^<]*</span></span>', '<span class="est2"><span class="w-est pend">Por aprobar</span></span>', f, count=1)
        f = re.sub(r'<a class="usan"[^>]*>[^<]*</a>', R.gris("—"), f, count=1)
        if origen == "Escritas a mano":
            f = f.replace("De los miembros", "Escritas a mano")
            f = re.sub(r"(</span><span>)(\d+)(</span>)", r"\g<1>0\3", f, count=1)
        nuevas += f
    primera = re.search(r'<sc-if value="\{\{(\w+)\}\}" hint-placeholder-val="\{\{si\}\}"><div class="w-tr k14">', t)
    t = t[:primera.start()] + nuevas + t[primera.start():]
    t = re.sub(r"(\d+) catálogos", lambda x: f"{int(x[1]) + 2} catálogos", t).replace("1–8 de 8", "1–10 de 10")
    t, k = G.PANEL_RE.subn(lambda _m: panel25("catalogos"), t)
    assert k == 1
    t = estilo(t, "catalogos", ".d25-prop { margin-left: 8px; padding: 1px 6px; border: 1px solid var(--borde2); border-radius: 3px; font-size: 12px; font-weight: 500; color: var(--t2); white-space: nowrap; }\n"
               + ".w-est.pend { color: oklch(0.5 0.12 70); }\n.w-est.pend::before { background: oklch(0.72 0.15 70); }\n")
    return con_titulo(con_campana25(t), "Formularios · Catálogos · etapa 25")


TEMA_DOCS = ("Remitos de proveedores", "Fotos de remitos en papel que no encajan en ningún formulario.", 3, 2, f"{HOY} 09:58")


def faltan25():
    """«Formularios que faltan» con «Armar con la IA» en cada tema, antes de su ⋮, y el tema que anotaron los documentos «Otro»."""
    t = (PROJ / "FRM-Faltan.dc.html").read_text(encoding="utf-8")
    kebab = re.compile(r'<span style="display: flex; justify-content: flex-end;">(<button type="button" class="ib" aria-label="Acciones de ([^"]+)">)')
    t, k = kebab.subn(lambda m: f'<span class="d25-acc"><a class="cb cb-sec" href="Asistente-Org-25.dc.html">Armar con la IA</a>{m.group(1)}', t)
    assert k >= 3, k
    fila = re.search(r'<div class="w-tr ft"><span class="k-tc"><b>Reclamos de clientes</b>.*?</button></span></div>', t, re.S)
    assert fila, "la fila de Reclamos"
    n, d, ped, per, ult = TEMA_DOCS
    nueva = re.sub(r"<b>Reclamos de clientes</b><small>[^<]*</small>", f"<b>{n}</b><small>{d}</small>", fila.group(0))
    nueva = re.sub(r'<span class="r">5</span><span class="r">3</span><span>[^<]*</span>', f'<span class="r">{ped}</span><span class="r">{per}</span><span>{ult}</span>', nueva)
    nueva = nueva.replace("Acciones de Reclamos de clientes", f"Acciones de {n}")
    t = t.replace(fila.group(0), nueva + fila.group(0))
    t = t.replace("3 temas · 9 pedidos", "4 temas · 12 pedidos").replace("1–3 de 3", "1–4 de 4")
    t, k = G.PANEL_RE.subn(lambda _m: panel25("faltan"), t)
    assert k == 1
    t = estilo(t, "faltan", ".w-th.ft, .w-tr.ft { grid-template-columns: minmax(280px, 2fr) 90px 90px minmax(150px, 1fr) 190px !important; }\n"
               ".d25-acc { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }\n.d25-acc .cb { height: 30px; font-size: 13px; }\n")
    return con_titulo(con_campana25(t), "Formularios · formularios que faltan · etapa 25")


# ================================================================ M-FRM-Documentos: la bandeja en el teléfono, y el documento en su pantalla
CSS_TDOCS = """.ap-fila .d25-mini { margin-right: 12px; }
.ap-fila .tx .l3 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.t25-doc { padding: 12px 16px 0; }
.t25-doc .d25-visor { margin: 0; }
.t25-doc .d25-vfondo { height: 210px; }
.t25-rev { display: flex; flex-direction: column; gap: 14px; padding: 14px 16px 120px; }
.t25-rec { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--t2); }
.t25-rec svg { color: var(--marca-tx); }
.t25-cmp { display: flex; flex-direction: column; gap: 6px; }
.t25-cmp .rt { font-size: 14px; font-weight: 600; color: var(--t2); }
.t25-cmp .ct { position: relative; min-height: 44px; box-sizing: border-box; padding: 11px 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; font-size: 15px; overflow-wrap: anywhere; }
.t25-cmp .ct.duda { border-color: oklch(0.72 0.15 70); box-shadow: inset 0 0 0 1px oklch(0.72 0.15 70); padding-right: 92px; }
.t25-cmp .ct.vacio { padding-right: 104px; }
.t25-cmp .ct.sel { display: flex; justify-content: space-between; align-items: center; }
.t25-cmp .d25-marca { right: 8px; }
.t25-sub { padding: 10px 16px 0; font-size: 14px; color: var(--t2); }
.ap-fijo.dos { display: flex; gap: 10px; }
.ap-fijo.dos .cb { flex: 1; }
"""


def t_dato(rot, valor, marca=""):
    if marca == "no":
        ct = '<div class="ct vacio"><span class="d25-marca no">No se leyó</span></div>'
    elif marca == "dudoso":
        ct = f'<div class="ct duda">{valor}<span class="d25-marca">{ALERTA} Revisá</span></div>'
    else:
        ct = f'<div class="ct">{valor}</div>'
    return f'<div class="t25-cmp"><span class="rt">{rot}</span>{ct}</div>'


def tel_documentos():
    est = ["Documentos", "Con filtros", "Un propuesto", "Descartar", "Un sin clasificar", "Solo ver"]
    der = f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'
    bar = C.t_bar("Documentos recibidos", "6 por revisar", "M-FRM-Formularios-22.dc.html", der)

    def fila(d):
        _n, nombre, tipo, lle, quien, qt, form, _res, e, *_ = d
        q = f"{quien} · Cliente" if qt == "cliente" else quien
        return (f'<a class="ap-fila" href="#">{mini(tipo)}<div class="tx"><span class="l1">{nombre}</span><span class="l2">{form or "Sin clasificar"} · {q}</span>'
                f'<span class="l3">{est_doc(e)}<span>{lle}</span></span></div></a>')
    lista = "".join(fila(d) for d in DOCS[:7])
    chips = ('<div class="t-chips"><span class="pl-chip">Estado: Sin clasificar<button type="button" class="x" aria-label="Quitar Estado: Sin clasificar">'
             f'{X}</button></span><button type="button" class="cb cb-enl">Limpiar todo</button></div>')
    filtrada = "".join(fila(d) for d in DOCS if d[8] == "Sin clasificar")
    d = DOC["d1"]
    bar_doc = C.t_bar("comprobante.jpg", "Documentos recibidos", "M-FRM-Documentos.dc.html")
    cab = f'<div class="t25-sub">{est_doc(d[8])} · {TOMAS} · {d[3]}</div><div class="t25-doc">{visor(documento())}</div>'
    form = f'<div class="t25-cmp"><span class="rt">Formulario</span><div class="ct sel">{COBRO}{CHEV}</div></div><span class="t25-rec">{CHISPA} Reconocido por la IA · seguro</span>'
    datos = "".join(t_dato(r, v, m) for r, v, m in LEIDO_COB[:8])
    fijo = '<div class="ap-fijo dos"><button type="button" class="cb cb-sec">Descartar</button><button type="button" class="cb cb-pri">Pasar al formulario</button></div>'
    propuesto = bar_doc + f'<div class="ap-cuerpo">{cab}<div class="t25-rev">{form}{datos}</div></div>' + fijo
    ver = bar_doc + (f'<div class="ap-cuerpo">{cab}<div class="t25-rev"><div class="t25-cmp"><span class="rt">Formulario</span><span>{COBRO}</span></div>'
                     + "".join(f'<div class="t25-cmp"><span class="rt">{r}</span><span>{v or R.gris("No se leyó")}</span></div>' for r, v, _m in LEIDO_COB[:8]) + "</div></div>")
    s = DOC["d3"]
    bar_sc = C.t_bar("remito-0412.jpg", "Documentos recibidos", "M-FRM-Documentos.dc.html")
    sin = (bar_sc + f'<div class="ap-cuerpo"><div class="t25-sub">{est_doc(s[8])} · {TOMAS} · {s[3]}</div><div class="t25-doc">{visor(documento("remito"))}</div>'
           f'<div class="t25-rev"><div class="t25-cmp"><span class="rt">Formulario</span><div class="ct sel" style="color: var(--t3);">Elegí un formulario{CHEV}</div></div>'
           '<a class="cb cb-sec full" href="M-FRM-Armar-Con-IA.dc.html">Armar formulario con la IA</a></div></div>'
           '<div class="ap-fijo dos"><button type="button" class="cb cb-sec">Descartar</button><button type="button" class="cb cb-pri" disabled>Pasar al formulario</button></div>')
    cu = {"Documentos": bar + f'<div class="ap-cuerpo">{lista}</div>', "Con filtros": bar + chips + f'<div class="ap-cuerpo">{filtrada}</div>',
          "Un propuesto": propuesto, "Descartar": propuesto, "Un sin clasificar": sin, "Solo ver": ver}
    hoja = F.thoja("¿Descartar comprobante.jpg?", '<p class="ap-txt-l" style="margin: 0;">Se borra el 01/02/2027, con su lectura. Hasta entonces lo podés volver a abrir.</p>',
                   '<button type="button" class="cb cb-pel lleno">Descartar</button><button type="button" class="cb cb-sec" autofocus>Cancelar</button>')
    t = C.tel_pagina(cu, est, {"Descartar": hoja}, "Formularios · documentos recibidos · teléfono · etapa 25",
                     R.CSS_T5_TEL + CSS_25 + CSS_DOCUMENTO + CSS_BANDEJA + CSS_TDOCS)
    return G.marco("M-FRM-Documentos", t)


# ================================================================ WA-Asistente-Casos-25: el tipo de entrada «Documento» y el bloque fijo de armar (171)
AY_ARMAR = ("Se atiende antes de los casos y no se configura: a una cuenta vinculada que puede diseñar formularios o administrar catálogos le propone uno, "
            "y lo crea con un botón.")
CASO_DOC = ("Manda su currículum", "Clientes · Documento", "Responder con un texto exacto", "", True)
TEXTO_CV = "Gracias. Las búsquedas de personal se cargan en delta.ejemplo.com/empleos."
TIPOS_ENTRADA = ["Texto o audio", "Documento"]


def bloque_armar():
    fila = (f'<div class="q-it fijo"><span class="num">{CHISPA}</span><span class="dato"><b>Pide que arme un formulario o un catálogo</b>'
            '<span>Cuentas vinculadas con permiso · Proponer y crearlo con un botón</span></span><span class="chips"></span><span></span></div>')
    return AS.caja("Armar formularios y catálogos", fila, AY_ARMAR)


def con_caso_doc(f, *a, **k):
    viejos = list(AS.CASOS)
    AS.CASOS[:] = viejos + [CASO_DOC]
    try:
        return f(*a, **k)
    finally:
        AS.CASOS[:] = viejos


def editor_doc(menu=False):
    """El caso 6 abierto: «Tipo de entrada» dice «Documento» y responde con un texto exacto."""
    h = con_caso_doc(AS.editor_caso, 6, "Responder con un texto exacto")
    h = h.replace(AS.TEXTO_PEDIDO, TEXTO_CV).replace(">Clientes · Documento<", ">Clientes<")
    ancla = re.search(r'(<span class="rt">Tipo de entrada <span class="req">\*</span></span><div class="ct sel"[^>]*>)Texto o audio', h)
    assert ancla, "el tipo de entrada"
    h = h.replace(ancla.group(0), ancla.group(1) + "Documento", 1)
    if menu:
        lista = ('<div class="rg2-menu" role="listbox" aria-label="Tipo de entrada" style="top: 64px; left: 0; right: auto; width: 260px;">'
                 + "".join(f'<span role="option" class="{"on" if o == "Documento" else ""}">{o}</span>' for o in TIPOS_ENTRADA) + "</div>")
        h = h.replace('<div class="w-cmp"><span class="rt">Tipo de entrada', '<div class="w-cmp rg-sel"><span class="rt">Tipo de entrada', 1)
        i = h.index('<span class="rt">Tipo de entrada')
        j = h.index("</div></div>", i) + len("</div>")
        h = h[:j] + lista + h[j:]
    return h


def contenido_casos25(abierto=False, menu=False):
    casos = con_caso_doc(AS.caja_casos)
    if abierto:
        fila = re.search(r'<div class="q-it"><span class="num">6</span>.*?</button></span></div>', casos, re.S)
        assert fila, "la fila del caso 6"
        casos = casos.replace(fila.group(0), f'<div class="q-ab">{fila.group(0)}{editor_doc(menu)}</div>', 1)
    armar_ = bloque_armar() if DECISIONES["armar_en_casos"] == "visible" else ""
    return armar_ + casos + AS.caja_forms() + AS.caja_otra()


E_CA25 = ["Casos", "Un caso con un documento", "Tipo de entrada: menú"]


def asistente_casos25():
    V_ = {"Casos": (AS.banda(), AS.cuerpo("casos", contenido_casos25(), AS.probar("envios"))),
          "Un caso con un documento": (AS.banda("sucio"), AS.cuerpo("casos", contenido_casos25(True), AS.probar(modo="sucio"))),
          "Tipo de entrada: menú": (AS.banda("sucio"), AS.cuerpo("casos", contenido_casos25(True, True), AS.probar(modo="sucio")))}
    t = AS.pagina_wa(V_, {}, E_CA25, "Asistente · Casos · /org/whatsapp/asistente · etapa 25", "Inicio / WhatsApp / Asistente", alto=1500)
    t = t.replace('>Casos <span class="c">5</span>', '>Casos <span class="c">6</span>').replace('<span class="ab-chip">Inactivo</span>', '<span class="ab-chip">De baja</span>')
    return con_titulo(con_campana25(t), "WhatsApp · el asistente · los casos · etapa 25")


# ================================================================ FRM-Armar-Con-IA: la propuesta, con los documentos a la vista y lo que se repite como un bloque (DOC6, 146 y 177)
# El formulario que propone desde los remitos en papel: (nombre, tipo, obligatoria, leído en el primero); el bloque lleva sus preguntas
REM_PREGUNTAS = [("Número de remito", "Texto corto", True, "0001-00000412"), ("Fecha de entrega", "Fecha", True, HOY),
                 ("Proveedor", "Texto corto", True, "Corralón El Puente S.R.L."), ("Zona de entrega", "Elegir de un catálogo · Zonas, ya existe", True, "Zona Oeste"),
                 ("Productos", "Bloque · de 1 a 10 ítems · 3 preguntas", False, "3 ítems"), ("Foto del remito", "Foto · 1", True, "la foto que llegó")]
REM_BLOQUE = [("Producto", "Texto corto", True, "Bolsas de cemento de 50 kg"), ("Cantidad", "Número", True, "12"), ("Unidad", "Elegir una · Unidades, Cajas, Kilos", False, "Unidades")]
REM_RECONOCER = ("Remito en papel de un proveedor: el número, la fecha, el proveedor con su CUIT, a quién se entrega y una tabla con la cantidad y la "
                 "descripción de cada producto.")
CSS_ARMAR = """.f-cols.d25-cols { grid-template-columns: minmax(0, 1fr) 380px; align-items: start; }
.d25-q { display: grid; grid-template-columns: 28px minmax(0, 1.1fr) minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px 16px; border-top: 1px solid var(--borde); font-size: 13.5px; }
.d25-q .num { color: var(--t3); font-variant-numeric: tabular-nums; }
.d25-q .dato { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.d25-q .dato b { font-weight: 600; }
.d25-q .dato > span, .d25-q .leido { font-size: 12.5px; color: var(--t2); }
.d25-q.sub { padding-left: 44px; background: oklch(0.985 0.004 95); }
.d25-q.sub .dato { border-left: 2px solid var(--borde2); padding-left: 10px; }
.d25-q .q-acc2 { display: inline-flex; gap: 2px; }
.d25-docs { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px 16px; }
.d25-docs .d25-vfondo { height: 300px; border: 1px solid var(--borde); border-radius: 3px; }
.d25-ths { display: flex; gap: 8px; }
.d25-ths .t { width: 64px; height: 76px; border: 1px solid var(--borde2); border-radius: 3px; background: repeating-linear-gradient(180deg, oklch(0.985 0.012 90) 0 6px, oklch(0.9 0.006 95) 6px 7px); }
.d25-ths .t.on { box-shadow: 0 0 0 2px var(--marca); }
.d25-docs .dt { font-size: 13px; color: var(--t2); line-height: 1.45; }
.d25-aviso { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; font-size: 13.5px; }
.d25-aviso .acc { display: flex; gap: 8px; margin-top: 8px; }
.d25-aviso.mal { border-color: oklch(0.85 0.06 25); background: var(--peligro-t); }
.d25-aviso svg { flex: none; margin-top: 2px; color: var(--marca-tx); }
.d25-aviso.mal svg { color: var(--peligro); }
.d25-arma { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 380px; font-size: 14px; color: var(--t2); }
.e-g2 .w-cmp.ancho { grid-column: 1 / -1; }
.e-g2 .ct.area { height: auto; min-height: 56px; white-space: normal; line-height: 1.45; display: block; padding-top: 8px; padding-bottom: 8px; }
.d25-qab { border-top: 1px solid var(--borde); background: oklch(0.985 0.004 95); }
.d25-qab .e-g2 { padding: 10px 16px 14px 56px; }
"""


def fila_q(k, n, tipo, ob, leido, sub=False, total=6):
    acc = "<span></span>" if sub else E.acciones_q(n, k == 1, k == total)
    t = tipo if tipo.startswith("Bloque") else f"{tipo} · {'Obligatoria' if ob else 'Opcional'}"
    return (f'<div class="d25-q{" sub" if sub else ""}"><span class="num">{"" if sub else k}</span><span class="dato"><b>{n}</b><span>{t}</span></span>'
            f'<span class="leido">Leído en el primero: {leido}</span>{acc}</div>')


def caja_preguntas_rem(abierta=None):
    filas = ""
    for k, (n, tipo, ob, leido) in enumerate(REM_PREGUNTAS, 1):
        filas += fila_q(k, n, tipo, ob, leido)
        if abierta == k:
            filas += ('<div class="d25-qab"><div class="e-g2">' + AS.campo("Pregunta", n) + AS.selc("Tipo de respuesta", "Bloque" if tipo.startswith("Bloque") else tipo.split(" · ")[0])
                      + AS.campo("Mínimo de ítems", "1") + AS.campo("Máximo de ítems", "10")
                      + '<div class="w-cmp ancho" style="align-items: flex-end;"><span class="q-pie"><button type="button" class="cb cb-sec">Listo</button></span></div></div></div>')
        if tipo.startswith("Bloque"):
            filas += "".join(fila_q(0, bn, bt, bo, bl, sub=True) for bn, bt, bo, bl in REM_BLOQUE)
    der = f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button>'
    return f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der">{der}</span></div>{filas}</div>'


def caja_form_rem(nombre=REMITO, prefijo="REM"):
    return ('<div class="w-caja"><div class="f-cab"><span>El formulario</span></div><div class="e-g2">'
            + AS.campo("Nombre", nombre) + AS.campo("Prefijo de numeración", prefijo) + AS.campo("Texto del botón final", "Cargar remito") + AS.selc("Para quién es", "Empleados")
            + AS.area("Cómo reconocerlo", REM_RECONOCER, ayuda="Lo que tienen en común los documentos. Sirve para reconocer los próximos.") + "</div></div>")


def caja_docs_rem():
    ay = "Los sin clasificar que se parecen. Al publicar el formulario, se leen con él y quedan propuestos en la bandeja."
    ths = ('<div class="d25-ths"><span class="t on" role="img" aria-label="remito-0412.jpg"></span><span class="t" role="img" aria-label="remito-0398.jpg"></span>'
           '<span class="t" role="img" aria-label="remito-0377.jpg"></span></div>')
    cuerpo = (f'<div class="d25-docs"><div class="d25-vfondo">{documento("remito")}</div>{ths}'
              f'<span class="dt">remito-0412.jpg · {TOMAS} · {HOY} 09:58</span><span class="dt">De {TOMAS} y {PAULA}, del {ANTEAYER} al {HOY}.</span></div>')
    return f'<div class="w-caja"><div class="f-cab"><span>Los 3 documentos{info(ay)}</span></div>{cuerpo}</div>'


def caja_plantilla_rem(parecida=False):
    if parecida:
        cuerpo = (f'<div class="d25-aviso" style="margin: 14px 16px 16px;">{F.ICONO}<div><b>Se parece a «Remito de compra», de la biblioteca.</b>'
                  '<div class="acc"><a class="cb cb-pri" href="FRM-Plantilla-25.dc.html">Usar la plantilla</a><button type="button" class="cb cb-sec">Armar igual con la IA</button></div></div></div>')
    else:
        cuerpo = '<div style="padding: 14px 16px 16px; font-size: 13.5px; color: var(--t2);">Ninguna de la biblioteca.</div>'
    return f'<div class="w-caja"><div class="f-cab"><span>Se parece a una plantilla</span></div>{cuerpo}</div>'


def banda_armar(modo="listo"):
    if modo == "creando":
        acc = boton("Descartar la propuesta", extra=" disabled") + E.trabaja("Creando…")
    elif modo in ("armando", "error"):
        acc = boton("Descartar la propuesta") + boton("Crear borrador", "cb-pri", extra=" disabled")
    else:
        acc = boton("Descartar la propuesta") + boton("Crear borrador", "cb-pri", href="FRM-Editor-Lectura.dc.html")
    b = A.banda("Armar formulario con la IA", "Propuesta de la IA", acc, volver="FRM-Documentos.dc.html")
    return b.replace("Volver a Diseñar formularios", "Volver a Documentos recibidos")


def cuerpo_armar(modo="listo"):
    if modo == "armando":
        return f'<div class="w-body"><div class="w-caja"><div class="d25-arma" role="status">{ARO} Leyendo los 3 documentos y armando la propuesta…</div></div></div>'
    if modo == "error":
        return (f'<div class="w-body"><div class="d25-aviso mal" role="alert">{ALERTA}<div><b>No pudimos armar la propuesta.</b> Los documentos siguen en la bandeja.'
                '<div class="acc"><button type="button" class="cb cb-sec">Reintentar</button></div></div></div></div>')
    izq = caja_form_rem() + caja_preguntas_rem(5 if modo == "editar" else None) + caja_plantilla_rem(modo == "parecida")
    return f'<div class="w-body"><div class="f-cols d25-cols"><div class="f-pila">{izq}</div>{caja_docs_rem()}</div></div>'


E_ARMAR = ["La propuesta", "Armando", "Editar el bloque", "Se parece a una plantilla", "Creando", "No se pudo armar"]


def armar():
    modos = {"La propuesta": "listo", "Armando": "armando", "Editar el bloque": "editar", "Se parece a una plantilla": "parecida", "Creando": "creando",
             "No se pudo armar": "error"}
    V_ = {e: (banda_armar(m), cuerpo_armar(m)) for e, m in modos.items()}
    t = A.pagina_editor(V_, {}, E_ARMAR, "Armar formulario con la IA · /org/formularios/documentos/armar", E.CSS_E12 + CSS_25 + CSS_DOCUMENTO + CSS_BANDEJA + CSS_ARO + CSS_ARMAR)
    t = marco25("FRM-Armar-Con-IA", t, "documentos", "Inicio / Gestión de formularios / Documentos recibidos / Armar formulario con la IA", 1100)
    return con_titulo(con_campana25(t), "Formularios · armar un formulario con la IA · etapa 25")


def tel_armar():
    est = ["La propuesta", "Armando", "Creando"]
    bar = C.t_bar("Armar con la IA", "Documentos recibidos", "M-FRM-Documentos.dc.html")
    ths = '<div class="d25-ths" style="padding: 12px 16px 0;"><span class="t on"></span><span class="t"></span><span class="t"></span></div>'
    form = (f'<div class="t25-rev" style="padding-bottom: 8px;"><span class="t25-rec">{CHISPA} Propuesta de la IA · desde 3 documentos</span>'
            + "".join(f'<div class="t25-cmp"><span class="rt">{r}</span><div class="ct">{v}</div></div>' for r, v in
                      [("Nombre", REMITO), ("Prefijo de numeración", "REM"), ("Texto del botón final", "Cargar remito"), ("Cómo reconocerlo", REM_RECONOCER)])
            + "</div>")
    filas = '<div class="t23-gtit">Preguntas<a href="#">Agregar pregunta</a></div>'
    for k, (n, tipo, ob, _l) in enumerate(REM_PREGUNTAS, 1):
        t = tipo if tipo.startswith("Bloque") else f"{tipo} · {'Obligatoria' if ob else 'Opcional'}"
        filas += AS.t_fila(f"{k}. {n}", t)
        if tipo.startswith("Bloque"):
            filas += "".join(AS.t_fila(bn, bt).replace('class="ap-fila"', 'class="ap-fila t25-sub-q"', 1) for bn, bt, _o, _l2 in REM_BLOQUE)
    lista = bar + f'<div class="ap-cuerpo">{ths}{form}{filas}<div style="height: 110px;"></div></div>'
    cu = {"La propuesta": lista + '<div class="ap-fijo"><a class="cb cb-pri full" href="M-FRM-Editor-Lectura.dc.html">Crear borrador</a></div>',
          "Armando": bar + f'<div class="ap-cuerpo"><div class="d25-arma" role="status" style="flex-direction: column; text-align: center; padding: 0 24px;">{ARO}Leyendo los 3 documentos y armando la propuesta…</div></div>',
          "Creando": lista + f'<div class="ap-fijo">{E.trabaja("Creando…", "cb-pri full")}</div>'}
    css = AS.CSS_T23 + CSS_25 + CSS_DOCUMENTO + CSS_BANDEJA + CSS_ARMAR + CSS_TDOCS + CSS_ARO + ".t25-sub-q { padding-left: 34px !important; background: oklch(0.985 0.004 95); }\n"
    return G.marco("M-FRM-Armar-Con-IA", C.tel_pagina(cu, est, {}, "Formularios · armar con la IA · teléfono · etapa 25", css))


# ================================================================ FRM-Respuesta-25: de qué documento salió y quién la revisó (99)
COLS_COB = [("num", "N°", 112, ""), ("rec", "Recibida", 136, ""), ("quien", "Cargó", 170, ""), ("can", "Canal", 96, ""), ("cli", "Cliente", 190, ""),
            ("mon", "Monto", 128, "r"), ("mot", "Banco o billetera de origen", 210, "")]
FILAS_COB = [("COB-000125", f"{HOY} 10:52", TOMAS, "", "WhatsApp", "Ferretería Rosales", "150.000,00", "Banco Galicia"),
             ("COB-000124", f"{HOY} 10:24", MARTINA, "cliente", "WhatsApp", "Distribuidora Norte", "86.500,00", "Banco Nación"),
             ("COB-000123", f"{HOY} 09:41", PAULA, "", "WhatsApp", "Sanitarios del Sur S.A.", "32.000,00", "Mercado Pago"),
             ("COB-000122", f"{AYER} 17:30", MARTIN, "", "WhatsApp", "Pinturerías Oeste", "41.200,00", "Banco Macro"),
             ("COB-000121", f"{AYER} 12:05", TOMAS, "", "App", "Corralón El Puente", "18.900,00", "Banco Galicia"),
             ("COB-000120", f"{ANTEAYER} 16:40", PAULA, "", "WhatsApp", "Ferretería Rosales", "75.000,00", "Banco Santander")]
VAL_125 = [("Cliente", "Ferretería Rosales"), ("Monto", "150.000,00"), ("Moneda", "Pesos"), ("Fecha", HOY), ("Número de operación", "0458 7129 08"),
           ("Concepto", "Factura 0003-00001845"), ("Banco o billetera de origen", "Banco Galicia"), ("Cuenta de origen", CBU_GALICIA),
           ("CUIT o CUIL de origen", "30-71458236-0"), ("Comprobante", f'<span class="d25-arch">{mini("img")}<span class="n">comprobante.jpg</span></span>')]
VAL_123 = [("Cliente", "Sanitarios del Sur S.A."), ("Monto", "32.000,00"), ("Moneda", "Pesos"), ("Fecha", HOY), ("Número de operación", "88412 03317"),
           ("Banco o billetera de origen", "Mercado Pago"), ("Cuenta de origen", CVU_MP), ("Comprobante", f'<span class="d25-arch">{mini("mp")}<span class="n">captura.jpg</span></span>')]
CSS_RESP25 = """.d25-lect { margin-top: 18px; }
.d25-lect .tit { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; font-weight: 600; }
.d25-lect .tit a { font-weight: 500; font-size: 13px; }
.d25-lect .cambio { color: var(--t2); }
.d25-lect .cambio b { color: var(--t1); font-weight: 600; }
"""


def lectura_doc(modo="revisada"):
    """La lectura del documento, en dos columnas (138): qué reconoció, qué se corrigió y quién, y qué se validó sin IA."""
    if modo == "auto":
        filas = [("Documento", f"captura.jpg · llegó el {HOY} 09:40"), ("Reconoció", f"{COBRO} · seguro"), ("La cargó", "«Cargar solo si es seguro», sin revisar")]
    else:
        quien = LUCIA if modo == "revisada" else TOMAS
        filas = [("Documento", f"comprobante.jpg · llegó el {HOY} 10:35"), ("Reconoció", f"{COBRO} · seguro"),
                 (f"Corrigió {quien.split()[0]}", '<span class="cambio"><b>Número de operación</b>: 0458 7129 03 → 0458 7129 08</span>'),
                 (f"Completó {quien.split()[0]}", '<span class="cambio"><b>Concepto</b>: no se había leído</span>')]
    filas.append(("Validó sin IA", "Cuentas, CUIT y CUIL, montos y fechas · no está repetido"))
    return (f'<div class="d25-lect"><div class="tit">Lectura del documento<a class="lnk" href="FRM-Documentos.dc.html">Ver en Documentos recibidos</a></div>'
            f"{F.grilla(filas)}</div>")


def respuesta25():
    est = ["La pasó alguien del equipo", "La confirmó quien la mandó", "Cargada automáticamente"]
    moms = {"La pasó alguien del equipo": K.mom("", CHECK, "Recibida", f"{HOY} 10:52", f"{K.PERSONA} La mandó {TOMAS} por WhatsApp · la revisó {LUCIA}"),
            "La confirmó quien la mandó": K.mom("", CHECK, "Recibida", f"{HOY} 10:52", f"{K.PERSONA} La confirmó {TOMAS} en WhatsApp, desde su documento"),
            "Cargada automáticamente": K.mom("", CHECK, "Recibida", f"{HOY} 09:41", f"{K.PERSONA} La mandó {PAULA} por WhatsApp · la cargó «Cargar solo si es seguro»")}
    cuerpos = {"La pasó alguien del equipo": F.grilla(VAL_125) + lectura_doc("revisada"), "La confirmó quien la mandó": F.grilla(VAL_125) + lectura_doc("confirmada"),
               "Cargada automáticamente": F.grilla(VAL_123) + lectura_doc("auto")}
    auto = "Cargada automáticamente"
    paneles = {e: K.vista("COB-000123" if e == auto else "COB-000125", "", moms[e], None, cuerpo=cuerpos[e], fotos=0, pos="3 de 6" if e == auto else "1 de 6",
                          primera=e != auto) for e in est}
    paneles = {e: p.replace(f"{K.FORM} · versión 4", f"{COBRO} · versión 2") for e, p in paneles.items()}
    banda = R.banda(COBRO, "Respuestas · versión 2 publicada", '<a class="cb cb-sec" href="FRM-Respuestas-Exportar.dc.html">Exportar a Excel</a>')
    cu = {e: K.fondo(FILAS_COB, cols=COLS_COB, sel="COB-000123" if e == auto else "COB-000125", pie="1–6 de 41", pag="Página 1 de 5",
                     destino="FRM-Respuesta-25.dc.html") for e in est}
    t = K.planilla(est, {e: banda for e in est}, cu, paneles, "Una respuesta · de qué documento salió · etapa 25")
    t = t.replace("Formularios / Visita a cliente", f"Formularios / {COBRO}").replace('href="WA-Chats-Avisos.dc.html"', 'href="WA-Chats-Documento.dc.html"')
    t = estilo(t, "respuesta", CSS_25 + CSS_RESP25)
    t = marco25("FRM-Respuesta-25", t, "formularios")
    return con_titulo(con_campana25(t), "Formularios · una respuesta · de qué documento salió · etapa 25")


def tel_respuesta25():
    est = ["La pasó alguien del equipo", "Cargada automáticamente"]

    def cuerpo(vals, lect, mom):
        v = "".join(f'<div class="t25-cmp"><span class="rt">{k}</span><span>{x}</span></div>' for k, x in vals)
        lt = "".join(f'<div class="t25-cmp"><span class="rt">{k}</span><span>{x}</span></div>' for k, x in lect)
        return (f'<div class="ap-cuerpo"><div class="t25-sub">{mom}</div><div class="t25-rev">{v}'
                f'<div class="t23-gtit" style="margin: 8px 0 0;">Lectura del documento</div>{lt}<a class="lnk" href="M-FRM-Documentos.dc.html">Ver en Documentos recibidos</a></div></div>')
    l1 = [("Documento", f"comprobante.jpg · llegó el {HOY} 10:35"), ("Reconoció", f"{COBRO} · seguro"), ("Corrigió Lucía", "Número de operación: 0458 7129 03 → 0458 7129 08"),
          ("Completó Lucía", "Concepto: no se había leído"), ("Validó sin IA", "Cuentas, CUIT y CUIL, montos y fechas · no está repetido")]
    l2 = [("Documento", f"captura.jpg · llegó el {HOY} 09:40"), ("Reconoció", f"{COBRO} · seguro"), ("La cargó", "«Cargar solo si es seguro», sin revisar"),
          ("Validó sin IA", "Cuentas, CUIT y CUIL, montos y fechas · no está repetido")]
    cu = {"La pasó alguien del equipo": C.t_bar("COB-000125", COBRO, "M-FRM-Respuestas-21.dc.html")
          + cuerpo(VAL_125[:9], l1, f"Recibida el {HOY} 10:52 · la mandó {TOMAS} por WhatsApp · la revisó {LUCIA}"),
          "Cargada automáticamente": C.t_bar("COB-000123", COBRO, "M-FRM-Respuestas-21.dc.html")
          + cuerpo(VAL_123[:7], l2, f"Recibida el {HOY} 09:41 · la mandó {PAULA} por WhatsApp")}
    return G.marco("M-FRM-Respuesta-25", C.tel_pagina(cu, est, {}, "Formularios · una respuesta · de qué documento salió · teléfono · etapa 25",
                                                      AS.CSS_T23 + CSS_25 + CSS_TDOCS))


# ================================================================ La «Lectura de documentos» (DOC1): en el editor, en la plantilla de Plataforma y en la vista de una plantilla
# (dato de la plantilla, su tipo, la pregunta que lo recibe en «Cobro a cliente», la validación fija o "")
DATOS_TRF = [("Banco o billetera de origen", "Texto corto", "Banco o billetera de origen", "Sale de la cuenta, con la tabla de entidades del BCRA"),
             ("Cuenta de origen", "Texto corto · CBU, CVU o alias", "Cuenta de origen", "Dígitos verificadores del CBU y del CVU"),
             ("Titular de origen", "Texto corto", "Quién transfirió", ""),
             ("CUIT o CUIL de origen", "Texto corto", "CUIT o CUIL de origen", "Dígito verificador"),
             ("Banco o billetera de destino", "Texto corto", "Banco o billetera de destino", "Sale de la cuenta, con la tabla de entidades del BCRA"),
             ("Cuenta de destino", "Texto corto · CBU, CVU o alias", "Cuenta de destino", "Dígitos verificadores del CBU y del CVU"),
             ("Titular de destino", "Texto corto", "Titular de destino", ""), ("CUIT o CUIL de destino", "Texto corto", "CUIT o CUIL de destino", "Dígito verificador"),
             ("Monto", "Número · 2 decimales", "Monto", "Formato argentino: 150.000,00"), ("Moneda", "Elegir una · Pesos, Dólares", "Moneda", ""),
             ("Fecha", "Fecha", "Fecha", "Formato argentino: 03/11/2026"), ("Hora", "Texto corto", "Hora", ""),
             ("Número de operación", "Texto corto", "Número de operación", "Con el monto y la fecha, avisa si está repetido"),
             ("Concepto", "Texto largo", "Concepto", ""), ("Comprobante", "Documento · 1", "Comprobante", "El documento original, adjunto")]
RECONOCER_TRF = ("Comprobante de una transferencia que nos hizo un cliente: banco o billetera, cuentas de origen y de destino, titulares con CUIT, monto, fecha y "
                 "número de operación. El destino es Grupo Delta S.A. (CUIT 30-71890123-1).")
RECONOCER_PLANT = ("Comprobante de una transferencia o de un pago con billetera: banco o billetera, cuentas de origen y de destino, titulares con CUIT, monto, "
                   "fecha, hora y número de operación.")
PRECISION = [("Número de operación", "88 %"), ("Concepto", "71 %"), ("Cuenta de origen", "97 %"), ("Monto", "99 %")]
AY_LECTURA = ("La IA reconoce el documento, lee sus datos y le propone este formulario prellenado a quien lo mandó. Nunca carga sola, salvo con «Cargar solo si "
              "es seguro». Prenderla o cambiarla se guarda en el borrador y sale al publicar.")
AY_SEGURO = ("Carga sin preguntar, a nombre de quien mandó el documento, solo con tres señales: lo reconoció sin duda, las validaciones dan bien y no está "
             "repetido, y las últimas 20 cargas de este formulario se confirmaron sin correcciones. Nunca usa la seguridad que dice la IA.")
AY_CANDADO = "Viene de la plantilla: no se apaga ni depende de la IA."
AY_CANDADO_PLAT = "Las organizaciones que usen la plantilla la reciben con candado: no la pueden apagar."
CSS_LECTURA = """.d25-l { display: flex; flex-direction: column; gap: 14px; padding: 14px 16px 16px; }
.d25-l .lin { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--t2); flex-wrap: wrap; }
.d25-l .lin b { color: var(--t1); font-weight: 600; }
.d25-l .lin .cb { height: 28px; font-size: 13px; }
.d25-lt { border: 1px solid var(--borde); border-radius: 3px; overflow: visible; }
.d25-lt .h, .d25-lt .f { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr); align-items: center; }
.d25-lt .h { background: oklch(0.945 0.027 95); font-size: 12.5px; font-weight: 600; color: var(--t2); }
.d25-lt .h > span, .d25-lt .f > span, .d25-lt .f > div { padding: 8px 12px; min-width: 0; }
.d25-lt .h > span + span, .d25-lt .f > * + * { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); align-self: stretch; display: flex; align-items: center; }
.d25-lt .f { border-top: 1px solid var(--borde); font-size: 13.5px; }
.d25-lt .f .dt { display: flex; flex-direction: column; gap: 1px; }
.d25-lt .f .dt small { font-size: 12px; color: var(--t3); }
.d25-lt .f .ct { width: 100%; height: 32px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; }
.d25-lt .f .val { display: inline-flex; align-items: flex-start; gap: 6px; }
.d25-lt .f .val svg { flex: none; margin-top: 2px; color: var(--t2); }
.d25-lt .f .rel { position: relative; }
.d25-lt .q-catmn { top: 44px; left: 12px; right: 12px; width: auto; }
.d25-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.d25-box { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border: 1px solid var(--borde); border-radius: 3px; font-size: 13px; line-height: 1.45; }
.d25-box > b { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; }
.d25-box .w-cmp .rt { font-size: 12.5px; }
.d25-box .ct { height: 32px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; }
.d25-sw { display: inline-flex; align-items: center; gap: 10px; font-size: 13.5px; }
.d25-sw i { width: 32px; height: 18px; border-radius: 9px; background: var(--borde2); position: relative; flex: none; }
.d25-sw i::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; }
.d25-sw.on i { background: var(--marca); }
.d25-sw.on i::after { left: 16px; }
.d25-prec { display: grid; grid-template-columns: minmax(0, 1fr) 70px; border-top: 1px solid var(--borde); }
.d25-prec span { padding: 5px 0; border-bottom: 1px solid var(--borde); }
.d25-prec span:nth-child(2n) { text-align: right; font-variant-numeric: tabular-nums; box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.d25-num { font-size: 13px; color: var(--t2); }
.d25-num b { font-size: 15px; color: var(--t1); }
"""


def sel_ct(valor, abierto=False, ph=False):
    return f'<div class="ct sel{" ph" if ph else ""}{" abierto" if abierto else ""}">{valor}{CHEV}</div>'


def tabla_lectura(modo="org", menu=None):
    """Qué pregunta recibe cada dato y su validación fija. modo: org (de una plantilla, con candado), plat (la plantilla, que elige) o propio (sin plantilla)."""
    h = '<div class="h"><span>Dato de la plantilla</span><span>Pregunta que lo recibe</span><span>Validación fija</span></div>' if modo != "propio" else \
        '<div class="h"><span>Dato</span><span>Pregunta que lo recibe</span><span>Validación fija</span></div>'
    filas = ""
    for dato_, tipo, preg, val in DATOS_TRF:
        if modo == "plat":
            preg_ct, val_ct = f"<span>{dato_}</span>", f'<div class="rel">{sel_ct(val or "Ninguna", ph=not val)}</div>'
        else:
            nombre = preg if modo == "org" else dato_
            extra = info(f"Le cambiaste el nombre a la pregunta: sigue recibiendo «{dato_}».") if (modo == "org" and nombre != dato_) else ""
            abierto = menu == dato_
            lista = ""
            if abierto:
                lista = ('<div class="q-catmn" role="listbox" aria-label="Pregunta que recibe Concepto">'
                         + "".join(f'<span class="{"on" if o == "Concepto" else ""}" role="option">{o}</span>' for o in ["Concepto", "Quién transfirió", "Ninguna: no se lee"]) + "</div>")
            preg_ct = f'<div class="rel">{sel_ct(nombre, abierto)}{lista}</div>' if not extra else f'<div class="rel" style="gap: 6px;">{sel_ct(nombre)}{extra}</div>'
            if modo == "org":
                val_ct = f'<span class="val">{CANDADO}{val}</span>' if val else f"<span>{R.gris('—')}</span>"
            else:
                val_ct = sel_ct(val or "Ninguna", ph=not val)
        filas += f'<div class="f"><span class="dt"><b style="font-weight: 600;">{dato_}</b><small>{tipo}</small></span>{preg_ct}{val_ct if val_ct.startswith("<") else val_ct}</div>'
    return f'<div class="d25-lt">{h}{filas}</div>'


def sw(texto, on=True, apagado=""):
    tip = f' aria-disabled="true" title="{apagado}"' if apagado else ""
    return f'<span class="d25-sw{" on" if on else ""}" role="switch" aria-checked="{"true" if on else "false"}"{tip}><i></i>{texto}</span>'


def caja_lectura(modo="org", menu=None, seguro=True):
    """La sección del editor (y de la plantilla): de dónde viene, cómo reconocerlo, los ejemplos, los datos, el cruce, los duplicados,
    «Cargar solo si es seguro» y cómo viene leyendo (DOC1 y 71)."""
    lin = [AS.chk("Leer los documentos que lleguen por WhatsApp", True)]
    if modo == "org":
        lin.append(f'<span class="lin">{F.ICONO}<span>Viene de <b>«{PLANTILLA}»</b> · versión 1 de la biblioteca</span></span>')
    reconocer = AS.area("Cómo reconocerlo", RECONOCER_PLANT if modo == "plat" else RECONOCER_TRF,
                        ayuda="Para la IA: qué es el documento y cómo distinguirlo de otro. Escribí lo propio de tu negocio, como de quién es la cuenta de destino.")
    ejemplos = ("" if modo == "plat" else
                '<span class="lin">Se suman como ejemplos las correcciones de la bandeja: <b>6</b> en los últimos 30 días.'
                '<button type="button" class="cb cb-sec">Ver los ejemplos</button></span>')
    candado = info(AY_CANDADO_PLAT if modo == "plat" else AY_CANDADO)
    cruce = ('<div class="d25-box"><b>Cruce con catálogos</b>' + AS.selc("Dato leído", "CUIT o CUIL de origen", req=False)
             + AS.selc("Se busca en", "Clientes · campo CUIT", req=False) + AS.selc("Y completa", "Cliente", req=False) + "</div>")
    if modo == "plat":
        cruce = ('<div class="d25-box"><b>Cruce con catálogos</b><span>Lo arma cada organización con sus catálogos.</span></div>')
    dup = (f'<div class="d25-box"><b>{CANDADO if modo != "propio" else ""} Duplicados{candado if modo != "propio" else ""}</b>'
           '<span>El mismo archivo, o la misma operación con el mismo monto y la misma fecha: avisa y no lo vuelve a proponer.</span></div>')
    if modo == "plat":
        cajas3 = cruce + dup + '<div class="d25-box"><b>Cargar solo si es seguro</b><span>Lo decide cada organización, en su formulario.</span></div>'
    else:
        seg = (f'<div class="d25-box"><b>Cargar solo si es seguro{info(AY_SEGURO)}</b>{sw("Cargar solo si es seguro", seguro)}'
               '<span class="d25-num">Lleva <b>14</b> cargas seguidas sin correcciones; carga sola desde las <b>20</b>.</span></div>')
        cajas3 = cruce + dup + seg
    prec = ""
    if modo != "plat":
        tabla = '<div class="d25-prec">' + "".join(f"<span>{d}</span><span>{p}</span>" for d, p in PRECISION) + "</div>"
        prec = (f'<div class="d25-box"><b>Cómo viene leyendo</b><span class="d25-num"><b>118</b> documentos en los últimos 30 días · <b>96 %</b> de los datos, sin corregir'
                f'</span><span style="color: var(--t2);">Sin corregir, por dato</span>{tabla}</div>')
    cuerpo = ('<div class="d25-l">' + "".join(lin) + reconocer + ejemplos + tabla_lectura(modo, menu) + f'<div class="d25-3">{cajas3}</div>' + prec + "</div>")
    return f'<div class="w-caja"><div class="f-cab"><span>Lectura de documentos{info(AY_LECTURA)}</span></div>{cuerpo}</div>'


# El formulario «Cobro a cliente», copiado de la plantilla, con «Cliente» propio y «Titular de origen» renombrada
PREG_COB = [("Cliente", "Elegir de un catálogo · Clientes", True), ("Monto", "Número · 2 decimales", True), ("Moneda", "Elegir una · Pesos, Dólares", True),
            ("Fecha", "Fecha", True), ("Número de operación", "Texto corto", True), ("Concepto", "Texto largo", False), ("Hora", "Texto corto", False),
            ("Banco o billetera de origen", "Texto corto", False), ("Cuenta de origen", "Texto corto", False), ("Quién transfirió", "Texto corto", False),
            ("CUIT o CUIL de origen", "Texto corto", False), ("Banco o billetera de destino", "Texto corto", False), ("Cuenta de destino", "Texto corto", False),
            ("Titular de destino", "Texto corto", False), ("CUIT o CUIL de destino", "Texto corto", False), ("Comprobante", "Documento · 1", True)]


def caja_preguntas_cob(solo_ver=False, preguntas=PREG_COB):
    filas = "".join(f'<div class="q-it"><span class="num">{k}</span><span class="dato"><b>{n}</b><span>{t} · {"Obligatoria" if ob else "Opcional"}</span></span>'
                    f'<span class="chips"></span>{"<span></span>" if solo_ver else E.acciones_q(n, k == 1, k == len(preguntas))}</div>' for k, (n, t, ob) in enumerate(preguntas, 1))
    der = "" if solo_ver else f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button>'
    return f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der">{der}</span></div>{filas}</div>'


def pv_cobro(titulo=COBRO, boton_="Enviar comprobante"):
    """«Así lo ve quien lo recibe»: la primera pantalla del Flow (la pieza de la vista previa)."""
    campos = "".join(f'<div class="pv-c">{n}<div class="pv-in">{v}</div></div>' for n, v in [("Cliente", f"Elegí una opción {CHEV}"), ("Monto", ""), ("Moneda", f"Elegí una opción {CHEV}"),
                                                                                       ("Fecha", f"Elegí una fecha {CHEV}"), ("Número de operación", ""), ("Concepto (opcional)", "")])
    return (f'<div class="pv"><div class="pv-tit"><span class="pv-tit2">Así lo ve quien lo recibe</span></div><div class="tel"><div class="pv-hoja"><div class="pv-hc">'
            f'<span class="pv-x">×</span>{titulo}</div><div class="pv-hb">{campos}</div><div class="pv-pie"><div class="pv-bt">Continuar</div></div></div></div></div>')


CSS_EDITOR25 = CSS_25 + CSS_LECTURA + """.f-cols.d25-ed { grid-template-columns: minmax(0, 1fr) 320px; align-items: start; }
.q-it .dato, .d25-q .dato { display: flex; flex-direction: column; align-items: flex-start; padding: 0; border-radius: 0; background: none; color: inherit; font-weight: inherit; font-size: inherit; line-height: inherit; white-space: normal; }
.w-body > .w-caja.d25-ancho { margin-top: 16px; }
.e-g2 .w-cmp.ancho { grid-column: 1 / -1; }
.e-g2 .ct.area, .d25-l .ct.area { height: auto; min-height: 56px; white-space: normal; line-height: 1.45; display: block; padding-top: 8px; padding-bottom: 8px; }
.d25-l > .w-cmp { display: flex; flex-direction: column; gap: 6px; }
"""
EJEMPLOS = [(f"{HOY} 10:52", LUCIA, "Número de operación", "0458 7129 03", "0458 7129 08"), (f"{AYER} 16:20", TOMAS, "Concepto", R.gris("No se leyó"), "Factura 0003-00001790"),
            (f"{AYER} 11:05", PAULA, "Cuenta de origen", "0110456500000098765486", CBU_NACION), ("31/10/2026 18:40", MARTIN, "Número de operación", "77210 4419", "77210 4418")]


def dlg_ejemplos():
    filas = "".join(f'<div class="f"><span>{h}</span><span>{q}</span><span>{d}</span><span>{a}</span><span>{b}</span></div>' for h, q, d, a, b in EJEMPLOS)
    cuerpo = (f'<div class="d25-ej"><div class="h"><span>Fecha</span><span>Quién</span><span>Dato</span><span>Leído</span><span>Confirmado</span></div>{filas}</div>')
    css = ('<style>.w-dlg.ej { width: 820px; } .d25-ej { border: 1px solid var(--borde); border-radius: 3px; font-size: 13px; }'
           '.d25-ej .h, .d25-ej .f { display: grid; grid-template-columns: 130px 130px 150px minmax(0, 1fr) minmax(0, 1fr); }'
           '.d25-ej .h { background: oklch(0.945 0.027 95); font-weight: 600; color: var(--t2); } .d25-ej span { padding: 8px 10px; overflow-wrap: anywhere; }'
           '.d25-ej .f { border-top: 1px solid var(--borde); } .d25-ej .h span + span, .d25-ej .f span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }</style>')
    return css + F.dialogo(f"Ejemplos de {COBRO}", cuerpo, '<button type="button" class="cb cb-sec">Cerrar</button>').replace('class="w-dlg"', 'class="w-dlg ej"', 1)


E_EDL = ["Lectura de documentos", "Elegir la pregunta", "Ver los ejemplos", "Cargar solo si es seguro: apagado", "Un formulario propio"]


def editor_lectura():
    vol = "FRM-Formularios-25.dc.html"

    def cuerpo(modo="org", menu=None, seguro=True, nombre=COBRO, prefijo="COB"):
        pila = E.caja_formulario(nombre=nombre, boton="Enviar comprobante", prefijo=prefijo, modo="fijo") + caja_preguntas_cob()
        lect = caja_lectura(modo, menu, seguro).replace('<div class="w-caja">', '<div class="w-caja d25-ancho">', 1)
        return f'<div class="w-body"><div class="f-cols d25-ed"><div class="f-pila">{pila}</div>{pv_cobro(nombre)}</div>{lect}</div>'
    V_ = {"Lectura de documentos": (E.banda(COBRO, E.EST_PUB4, E.acc("limpio"), vol), cuerpo()),
          "Elegir la pregunta": (E.banda(COBRO, E.EST_PUB4, E.acc("cambios"), vol), cuerpo(menu="Concepto")),
          "Ver los ejemplos": (E.banda(COBRO, E.EST_PUB4, E.acc("limpio"), vol), cuerpo()),
          "Cargar solo si es seguro: apagado": (E.banda(COBRO, E.EST_PUB4, E.acc("cambios"), vol), cuerpo(seguro=False)),
          "Un formulario propio": (E.banda("Pago de servicios", E.EST_PUB4, E.acc("limpio"), vol), cuerpo("propio", nombre="Pago de servicios", prefijo="SER"))}
    t = A.pagina_editor(V_, {"Ver los ejemplos": dlg_ejemplos()}, E_EDL, "Editor · lectura de documentos · etapa 25", E.CSS_E12 + E.CSS_CA4 + CSS_EDITOR25)
    t = marco25("FRM-Editor-Lectura", t, "formularios", f"Inicio / Gestión de formularios / Formularios / {COBRO}", 2350)
    t = CH.con_tabs23(t, "diseno").replace('"FRM-Formularios-22.dc.html"', '"FRM-Formularios-25.dc.html"')
    return con_titulo(con_campana25(t), "Formularios · la lectura de documentos · etapa 25")


def tel_editor_lectura():
    est = ["Lectura de documentos", "Una validación fija", "Cargar solo si es seguro"]
    bar = C.t_bar(COBRO, "Lectura de documentos", "M-FRM-Formularios-22.dc.html")
    filas = "".join(AS.t_fila(d, f"{p} · {CANDADO + ' ' + v if v else 'sin validación fija'}") for d, _t, p, v in DATOS_TRF[:8])
    cab = (f'<div class="t25-rev" style="padding-bottom: 6px;"><span class="q-chk"><i>{TILDE}</i>Leer los documentos que lleguen por WhatsApp</span>'
           f'<span class="t25-rec">{F.ICONO} Viene de «{PLANTILLA}» · versión 1</span><div class="t25-cmp"><span class="rt">Cómo reconocerlo</span><div class="ct">{RECONOCER_TRF}</div></div>'
           '<a class="lnk" href="#">Ver los 6 ejemplos</a></div>')
    pie = (f'<div class="t23-gtit">Cargar solo si es seguro</div><div class="t25-rev" style="padding-top: 0;">{sw("Cargar solo si es seguro")}'
           '<span class="d25-num">Lleva <b>14</b> cargas seguidas sin correcciones; carga sola desde las <b>20</b>.</span>'
           '<span class="d25-num"><b>96 %</b> de los datos, sin corregir, en los últimos 30 días.</span></div>')
    lista = bar + f'<div class="ap-cuerpo">{cab}<div class="t23-gtit">Qué pregunta recibe cada dato</div>{filas}{pie}<div style="height: 90px;"></div></div>'
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Guardar cambios</button></div>'
    hoja = F.thoja("Cuenta de origen", f'<div class="t25-rev" style="padding: 0;"><span class="t25-rec">{CANDADO} Dígitos verificadores del CBU y del CVU</span>'
                   f'<span class="d25-num">{AY_CANDADO}</span></div>', "")
    cu = {"Lectura de documentos": lista + fijo, "Una validación fija": lista + fijo, "Cargar solo si es seguro": lista.replace('<div class="t23-gtit">Qué pregunta', '<div class="t23-gtit" style="display: none;">Qué pregunta') + fijo}
    chk = (".q-chk { display: inline-flex; align-items: center; gap: 10px; font-size: 15px; } .q-chk i { width: 20px; height: 20px; flex: none; border-radius: 3px; "
           "background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }\n")
    t = C.tel_pagina(cu, est, {"Una validación fija": hoja}, "Formularios · la lectura de documentos · teléfono · etapa 25", AS.CSS_T23 + CSS_25 + CSS_TDOCS + CSS_LECTURA + chk)
    return G.marco("M-FRM-Editor-Lectura", t)


def plat_plantilla_lectura():
    """La misma sección en la pestaña «Plantilla» de Plataforma: la plataforma elige las validaciones, que la copia trae con candado."""
    preg = [(n, t) for n, t, _p, _v in DATOS_TRF]
    filas = "".join(B.fila_q(k, n, f"{t} · {'Obligatoria' if n in ('Monto', 'Fecha', 'Número de operación', 'Comprobante') else 'Opcional'}") for k, (n, t) in enumerate(preg, 1))
    pregs = f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der"><button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button></span></div>{filas}</div>'
    plantilla = ('<div class="w-caja"><div class="f-cab"><span>La plantilla</span></div><div class="e-g2">' + B.campo("Nombre", PLANTILLA) + B.selc("Categoría", "Pagos y cobros")
                 + B.campo("Prefijo sugerido", "TRF") + E.para_quien(False, "Empleados y clientes") + B.campo("Texto del botón final", "Enviar comprobante") + "<span></span>"
                 + B.area("Descripción", "Para cargar los comprobantes de transferencia que llegan por WhatsApp.", req=False) + "</div></div>")
    est = ["Plantilla", "Con cambios", "Elegir una validación"]
    menu_val = ('<div class="q-catmn" role="listbox" aria-label="Validación fija" style="top: 44px; left: 12px; right: 12px; width: auto;">'
                + "".join(f'<span class="{"on" if o == "Dígito verificador" else ""}" role="option">{o}</span>' for o in
                          ["Ninguna", "Dígitos verificadores del CBU y del CVU", "Dígito verificador", "Sale de la cuenta, con la tabla de entidades del BCRA",
                           "Formato argentino: 150.000,00", "Formato argentino: 03/11/2026", "Con el monto y la fecha, avisa si está repetido"]) + "</div>")

    def cuerpo(menu=False):
        lect = caja_lectura("plat")
        if menu:
            ancla = 'Dígito verificador' + CHEV + "</div>"
            k = lect.index(ancla)
            lect = lect[:k + len(ancla)] + menu_val + lect[k + len(ancla):]
            lect = lect.replace('<div class="ct sel">Dígito verificador', '<div class="ct sel abierto">Dígito verificador', 1)
        lect = lect.replace('<div class="w-caja">', '<div class="w-caja d25-ancho">', 1)
        return f'<div class="w-body">{B.tabs_pl("plantilla", "0")}<div class="f-cols d25-ed"><div class="f-pila">{plantilla}{pregs}</div>{pv_cobro(PLANTILLA)}</div>{lect}</div>'
    V_ = {"Plantilla": (B.banda_pl(PLANTILLA, B.EST["Publicada"], B.acc_pl()), cuerpo()), "Con cambios": (B.banda_pl(PLANTILLA, B.EST["Publicada"], B.acc_pl("cambios")), cuerpo()),
          "Elegir una validación": (B.banda_pl(PLANTILLA, B.EST["Publicada"], B.acc_pl("cambios")), cuerpo(True))}
    t = B.pagina_plat(V_, {}, est, "Plataforma · plantilla · lectura de documentos · etapa 25", f"Plataforma / Formularios / Biblioteca / {PLANTILLA}",
                      css=CSS_EDITOR25, alto=2300)
    return con_titulo(t, "Plataforma · plantilla · lectura de documentos · etapa 25")


# FRM-Plantilla-25: la vista de una plantilla de la biblioteca dice qué lee y sus validaciones fijas, con candado
def caja_que_lee():
    filas = "".join(f'<div class="f"><span class="dt"><b style="font-weight: 600;">{d}</b><small>{t}</small></span>'
                    + (f'<span class="val">{CANDADO}{v}</span>' if v else f"<span>{R.gris('—')}</span>") + "</div>" for d, t, _p, v in DATOS_TRF)
    tabla = f'<div class="d25-lt d25-lt2"><div class="h"><span>Dato que lee</span><span>Validación fija</span></div>{filas}</div>'
    return (f'<div class="w-caja"><div class="f-cab"><span>Qué lee{info("Al usarla, la copia trae la lectura prendida y las validaciones fijas con candado.")}</span></div>'
            f'<div class="d25-l"><div class="w-cmp"><span class="rt">Cómo lo reconoce</span><span style="font-size: 13.5px; line-height: 1.45;">{RECONOCER_PLANT}</span></div>{tabla}</div></div>')


def plantilla25():
    est = ["Con permiso", "Sin permiso para usarla"]
    datos = F.grilla([("Categoría", "Pagos y cobros"), ("Para quién es", "Empleados y clientes"), ("Prefijo sugerido", "TRF"), ("Texto del botón final", "Enviar comprobante")])
    caja_pl = f'<div class="w-caja"><div class="f-cab"><span>La plantilla</span></div><div style="padding: 14px 16px 16px;">{datos}</div></div>'
    preg = [(n, t, n in ("Monto", "Fecha", "Número de operación", "Comprobante")) for n, t, _p, _v in DATOS_TRF]
    cuerpo = (f'<div class="w-body"><div class="f-cols d25-ed"><div class="f-pila">{caja_pl}{caja_preguntas_cob(True, preg)}{caja_que_lee()}</div>'
              f'{pv_cobro(PLANTILLA)}</div></div>')
    usar = '<a class="cb cb-pri" href="FRM-Plantilla-Usar.dc.html">Usar esta plantilla</a>'
    V_ = {"Con permiso": (A.banda(PLANTILLA, "Pagos y cobros · versión 1", usar, "FRM-Biblioteca.dc.html").replace("Volver a Diseñar formularios", "Volver a la biblioteca"), cuerpo),
          "Sin permiso para usarla": (A.banda(PLANTILLA, "Pagos y cobros · versión 1", "", "FRM-Biblioteca.dc.html").replace("Volver a Diseñar formularios", "Volver a la biblioteca"), cuerpo)}
    css = CSS_EDITOR25 + ".d25-lt2 .h, .d25-lt2 .f { grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); }\n"
    t = A.pagina_editor(V_, {}, est, "Biblioteca · una plantilla · etapa 25", E.CSS_E12 + css)
    t = marco25("FRM-Plantilla-25", t, "formularios", f"Inicio / Gestión de formularios / Formularios / Biblioteca / {PLANTILLA}", 2000)
    return con_titulo(con_campana25(t), "Formularios · una plantilla · qué lee · etapa 25")


def tel_plantilla25():
    est = ["Con permiso"]
    bar = C.t_bar(PLANTILLA, "Biblioteca", "M-FRM-Biblioteca.dc.html")
    preg = "".join(AS.t_fila(f"{k}. {n}", t) for k, (n, t, _p, _v) in enumerate(DATOS_TRF[:6], 1))
    lee = "".join(AS.t_fila(d, f"{CANDADO} {v}" if v else "Sin validación fija") for d, _t, _p, v in DATOS_TRF)
    cu = {"Con permiso": bar + (f'<div class="ap-cuerpo"><div class="t25-sub">Pagos y cobros · versión 1 · Empleados y clientes</div>'
                                f'<div class="t23-gtit">Preguntas</div>{preg}<a class="lnk" href="#" style="display: block; padding: 10px 16px;">Ver las 15 preguntas</a>'
                                f'<div class="t23-gtit">Qué lee</div><div class="t25-sub" style="padding-top: 0;">{RECONOCER_PLANT}</div>{lee}<div style="height: 90px;"></div></div>'
                                '<div class="ap-fijo"><a class="cb cb-pri full" href="M-FRM-Plantilla.dc.html">Usar esta plantilla</a></div>')}
    return G.marco("M-FRM-Plantilla-25", C.tel_pagina(cu, est, {}, "Formularios · una plantilla · qué lee · teléfono · etapa 25", AS.CSS_T23 + CSS_25 + CSS_TDOCS))


# ================================================================ FRM-Catalogo-Propuesta-25: el catálogo que deja «Crear catálogo», que se edita como cualquiera (167)
CAT = "Proveedores de obra"  # «Proveedores» ya existe en Catálogos desde la 12: la IA no repite un nombre
PIDIO25 = f"La pidió {LUCIA} en el chat del Inicio el {HOY} 10:00."
FILAS_CAT = [("30-70912345-5", "Corralón El Puente S.R.L.", "Materiales", "Oeste"), ("30-71122334-3", "Sanitarios del Sur S.A.", "Sanitarios", "Sur"),
             ("20-23456789-7", "Electricidad Norte", "Electricidad", "Norte")]
CSS_CAT25 = """.d25-pl { display: flex; align-items: center; gap: 10px; }
.d25-pl h1 { margin: 0; }
.d25-etq { padding: 1px 7px; border: 1px solid oklch(0.72 0.15 70); border-radius: 3px; font-size: 12px; font-weight: 600; color: oklch(0.5 0.12 70); background: oklch(0.97 0.04 85); white-space: nowrap; }
.d25-quien { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; font-size: 13.5px; color: var(--t2); }
.d25-ops .h, .d25-ops .f { display: grid; grid-template-columns: 44px 150px minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) 90px; align-items: center; }
.d25-ops .h { background: oklch(0.945 0.027 95); font-size: 12.5px; font-weight: 600; color: var(--t2); }
.d25-ops .h span, .d25-ops .f span { padding: 9px 12px; }
.d25-ops .h span + span, .d25-ops .f span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.d25-ops .f { border-top: 1px solid var(--borde); font-size: 13.5px; }
.d25-ops .vac { padding: 16px; font-size: 13.5px; color: var(--t2); border-top: 1px solid var(--borde); }
.d25-campos .f, .d25-campos .h { display: grid; grid-template-columns: minmax(0, 1fr) 140px 120px; }
.w-dlg.imp { width: 760px; }
.d25-imp { display: flex; flex-direction: column; gap: 12px; }
.d25-imp .arch { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 3px; font-size: 13.5px; }
.d25-imp .rev { display: flex; gap: 18px; font-size: 13.5px; }
.d25-imp .rev b { font-variant-numeric: tabular-nums; }
.d25-cond { display: grid; grid-template-columns: 40px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); gap: 8px; align-items: center; padding: 0 16px 10px; font-size: 13.5px; }
.d25-cond .si { color: var(--t3); }
.d25-cond .ct { height: 34px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; }
"""


def banda_cat(nombre=CAT, modo="pendiente", quien=PIDIO25):
    pend = modo in ("pendiente", "aprobando", "sin_permiso")
    titulo = f'<span class="d25-pl"><h1>{nombre}</h1>{"<span class=" + chr(34) + "d25-etq" + chr(34) + ">Propuesta del asistente</span>" if pend else ""}</span>'
    estado = '<span class="w-est pend">Por aprobar</span> · Escritas a mano' if pend else '<span class="w-est">Activo</span> · Escritas a mano'
    if modo == "aprobando":
        acc = (boton("Descartar propuesta", extra=" disabled") + boton("Descartar", extra=" disabled") + boton("Guardar", extra=" disabled") + E.trabaja("Aprobando…"))
    elif modo == "sin_permiso":
        acc = ""
    elif modo == "aprobado":
        acc = boton("Dar de baja") + boton("Descartar", extra=" disabled") + boton("Guardar cambios", "cb-pri", extra=" disabled")
    elif modo == "sucio":
        acc = boton("Descartar propuesta") + boton("Descartar") + boton("Guardar") + boton("Aprobar y activar", "cb-pri", apagado="Primero guardá los cambios.")
    else:
        acc = boton("Descartar propuesta") + boton("Descartar", extra=" disabled") + boton("Guardar", extra=" disabled") + boton("Aprobar y activar", "cb-pri")
    b = A.banda("TITULO", estado, acc, "FRM-Catalogos-25.dc.html").replace("Volver a Diseñar formularios", "Volver a Catálogos")
    return b.replace("<h1>TITULO</h1>", titulo, 1)


def caja_ops(filas=None, total=0):
    h = '<div class="h"><span>#</span><span>Código</span><span>Texto</span><span>Rubro</span><span>Zona</span><span>Estado</span></div>'
    if not filas:
        cuerpo = '<div class="vac">Todavía no hay opciones.</div>'
    else:
        cuerpo = "".join(f'<div class="f"><span class="r">{k}</span><span style="white-space: nowrap;">{c}</span><span>{t}</span><span>{r}</span><span>{z}</span><span><span class="w-est">Activa</span></span></div>'
                         for k, (c, t, r, z) in enumerate(filas, 1))
    der = (f'<button type="button" class="cb cb-sec">{MAS} Agregar opción</button><button type="button" class="cb cb-sec">Importar</button>'
           f'<button type="button" class="ib o-borde" aria-label="Más acciones de las opciones">{KEBAB}</button>')
    pie = f'<div class="w-pie"><span>{"0 de 0" if not filas else f"1–{len(filas)} de {total}"}</span><span>20 por página</span></div>'
    return f'<div class="w-caja d25-ops"><div class="f-cab"><span>Opciones</span><span class="der">{der}</span></div>{h}{cuerpo}{pie}</div>'


def caja_cat(nombre=CAT, desc="Proveedores de materiales para las obras, con su CUIT.", ro=False):
    c = lambda r, v, req=True: (f'<div class="w-cmp"><span class="rt">{r}</span><span>{v}</span></div>' if ro else AS.campo(r, v, req=req))  # noqa: E731
    return ('<div class="w-caja"><div class="f-cab"><span>El catálogo</span></div><div class="e-g2">' + c("Nombre", nombre) + c("Tipo de valor", "Texto")
            + (f'<div class="w-cmp ancho"><span class="rt">Descripción</span><span>{desc}</span></div>' if ro else AS.area("Descripción", desc, req=False)) + "</div></div>")


def caja_campos():
    filas = "".join(f'<div class="f"><span>{n}</span><span>Texto</span><span>Opcional</span></div>' for n in ("Rubro", "Zona"))
    return (f'<div class="w-caja d25-ops d25-campos"><div class="f-cab"><span>Campos</span><span class="der"><button type="button" class="cb cb-sec">Agregar campos</button></span></div>'
            f'<div class="h"><span>Campo</span><span>Tipo</span><span>Obligatorio</span></div>{filas}</div>')


def pv_cat(nombre=CAT, filas=()):
    items = "".join(f'<div class="pv-c" style="display: flex; justify-content: space-between;"><span>{t}<span class="pv-ay" style="display: block;">{r} · {z}</span></span>'
                    '<i style="width: 16px; height: 16px; border: 1.5px solid var(--borde2); border-radius: 50%;"></i></div>' for _c, t, r, z in filas)
    return (f'<div class="pv"><div class="pv-tit"><span class="pv-tit2">Así lo ve quien lo recibe</span></div><div class="tel"><div class="pv-hoja"><div class="pv-hc">'
            f'<span class="pv-x">‹</span>{nombre}</div><div class="pv-hb">{items or "<div class=" + chr(34) + "pv-c" + chr(34) + ">Elegí una opción</div>"}</div></div></div></div>')


def cuerpo_cat(filas=(), total=0, quien=PIDIO25, ro=False, miembros=False):
    sup = f'<div class="d25-quien">{INFO}<span>{quien}</span></div>' if quien else ""
    if miembros:
        cond = "".join(f'<div class="d25-cond"><span class="si">{s}</span>{sel_ct(a)}{sel_ct(b)}{sel_ct(c)}</div>' for s, a, b, c in
                       [("Si", "Rol", "tiene alguno de", "Supervisor"), ("Y", "Activo", "es", "Sí"), ("Y", "Empresa", "es", "Delta Norte S.A.")])
        pila = (caja_cat("Supervisores de Delta Norte", "Supervisores activos de Delta Norte S.A.").replace("Texto</div>", "De los miembros</div>", 1)
                + f'<div class="w-caja"><div class="f-cab"><span>Qué miembros entran</span><span class="der"><button type="button" class="cb cb-sec">{MAS} Agregar condición</button></span></div>'
                f'<div style="height: 12px;"></div>{cond}</div>')
        return f'<div class="w-body">{sup}<div class="f-cols d25-ed"><div class="f-pila">{pila}</div>{pv_cat("Supervisor", [("", "Florencia Fernández de la Fuente", "Delta Norte", "Supervisora"), ("", "Martín Paz", "Delta Norte", "Supervisor")])}</div></div>'
    pila = caja_cat(ro=ro) + caja_campos() + caja_ops(list(filas), total)
    return f'<div class="w-body">{sup}<div class="f-cols d25-ed"><div class="f-pila">{pila}</div>{pv_cat(CAT, filas)}</div></div>'


def dlg_importar():
    filas = "".join(f'<div class="f"><span>{c}</span><span>{t}</span><span>{r}</span><span>{z}</span></div>' for c, t, r, z in FILAS_CAT)
    cuerpo = (f'<div class="d25-imp"><div class="arch">{mini("xlsx")}<span>proveedores-de-obra.xlsx · 86 filas · 24 KB</span></div>'
              '<div class="rev"><span><b>86</b> altas</span><span><b>0</b> cambios</span><span><b>0</b> errores</span></div>'
              f'<div class="d25-ops"><div class="h" style="grid-template-columns: 150px minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr);"><span>Código</span><span>Texto</span><span>Rubro</span><span>Zona</span></div>'
              f'{filas.replace("class=" + chr(34) + "f" + chr(34), "class=" + chr(34) + "f" + chr(34) + " style=" + chr(34) + "grid-template-columns: 150px minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr);" + chr(34))}'
              '<div class="vac">y 83 filas más</div></div></div>')
    return F.dialogo("Importar opciones", cuerpo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Importar</button>').replace('class="w-dlg"', 'class="w-dlg imp"', 1)


E_CAT = ["A mano, sin opciones", "Con un Excel: importar", "Importado, sin guardar", "De los miembros", "Pedido por WhatsApp", "Descartar la propuesta", "Aprobando",
         "Aprobado", "Sin permiso para aprobar"]


def catalogo_propuesta25():
    filas = FILAS_CAT
    V_ = {"A mano, sin opciones": (banda_cat(), cuerpo_cat()), "Con un Excel: importar": (banda_cat(), cuerpo_cat()),
          "Importado, sin guardar": (banda_cat(modo="sucio"), cuerpo_cat(filas, 86)),
          "De los miembros": (banda_cat("Supervisores de Delta Norte"), cuerpo_cat(miembros=True)),
          "Pedido por WhatsApp": (banda_cat(), cuerpo_cat(quien=f"La pidió {LUCIA} por WhatsApp el {HOY} 09:40.")),
          "Descartar la propuesta": (banda_cat(), cuerpo_cat()), "Aprobando": (banda_cat(modo="aprobando"), cuerpo_cat(filas, 86)),
          "Aprobado": (banda_cat(modo="aprobado"), cuerpo_cat(filas, 86, quien="")), "Sin permiso para aprobar": (banda_cat(modo="sin_permiso"), cuerpo_cat(filas, 86, ro=True))}
    capas = {"Con un Excel: importar": dlg_importar(),
             "Descartar la propuesta": F.dialogo(f"¿Descartar la propuesta «{CAT}»?", '<p class="d-tx">El catálogo se borra y no se puede deshacer.</p>',
                                                 '<button type="button" class="cb cb-sec" autofocus>Cancelar</button><button type="button" class="cb cb-pel lleno">Descartar propuesta</button>'),
             "Aprobado": A.toast(f"Aprobamos {CAT}. Ya se puede usar en los formularios.")}
    t = A.pagina_editor(V_, capas, E_CAT, "Catálogo propuesto por el asistente · etapa 25", E.CSS_E12 + CSS_EDITOR25 + CSS_CAT25)
    t = marco25("FRM-Catalogo-Propuesta-25", t, "catalogos", f"Inicio / Gestión de formularios / Catálogos / {CAT}", 1100)
    return con_titulo(con_campana25(t), "Formularios · el catálogo que propone el asistente · etapa 25")


# ================================================================ WA-Chats-Documento: lo que manda Tomás, en su chat de Internos (DOC2 y DOC4)
CSS_CHDOC = """.w-m .gl.d25-gl, .ap-m .gl.d25-gl { display: flex; flex-direction: column; gap: 6px; }
.d25-gl .d25-doc.chico { border-radius: 2px; }
.d25-fn { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--t2); }
.d25-fn .d25-mini { width: 22px; height: 27px; font-size: 6.5px; }
.d25-ub { display: flex; flex-direction: column; gap: 4px; min-width: 210px; }
.d25-ub .mapa { height: 84px; border-radius: 2px; background: repeating-linear-gradient(45deg, oklch(0.93 0.02 140) 0 10px, oklch(0.95 0.015 140) 10px 20px); display: flex; align-items: center; justify-content: center; color: oklch(0.55 0.15 25); }
.d25-ub b { font-weight: 600; }
.as-card small + small { margin-top: 1px; }
.d25-lst { display: block; margin-top: 6px; font-size: 12.5px; color: var(--t2); }
.d25-gl .movida { filter: blur(1.6px); }
"""


def msg_doc(tipo, nombre, peso, texto="", hora="10:35", pop="", movida=False, dibujo=True, clase="w-m", pq="Por qué lo propuso"):
    """Un documento que llegó: su imagen o su ícono, el nombre y, debajo, «Por qué lo propuso» (se abre en un globo, como en la 23)."""
    img = documento(tipo if tipo in ("mp", "remito", "ticket") else "img", "chico" + (" movida" if movida else "")) if dibujo else ""
    fn = f'<span class="d25-fn">{mini(tipo)}{nombre} · {peso}</span>'
    tx = f"<span>{texto}</span>" if texto else ""
    enlace = (f' · <span class="as-pqw"><button type="button" class="as-pq" aria-expanded="{"true" if pop else "false"}">{pq}</button>{pop}</span>' if pq else "")
    return f'<div class="{clase} ent"><span class="gl d25-gl">{img}{fn}{tx}</span><span class="pie">{hora}{enlace}</span></div>'


def pop_doc(filas, titulo="Por qué lo propuso"):
    g = '<span class="g">' + "".join(f'<span class="k">{k}</span><span>{v}</span>' for k, v in filas) + "</span>"
    return f'<span class="as-pop" role="dialog" aria-label="{titulo}"><b>{INFO} {titulo}</b>{g}</span>'


POR_SEGURO = [("Reconoció", f"{COBRO}, seguro"), ("Leyó", "14 de 16 datos · 1 dudoso: Número de operación"), ("Validó", "Sin IA: cuentas y CUIT bien; no está repetido")]
POR_CBU = [("Reconoció", f"{COBRO}, seguro"), ("Leyó", "14 de 16 datos"), ("Validó", "Sin IA: la cuenta de origen no da con sus dígitos verificadores. Va marcada.")]


def card_doc(form=COBRO, linea="Prellenado · con el comprobante", boton_="Abrir formulario"):
    return (f'<span class="as-card"><span>{F.ICONO}</span><span class="t"><b>{form}</b><small>Formulario · botón «{boton_}»</small><small>{linea}</small></span></span>')


def asis(texto, hora="10:35", card="", quick=None, lista=""):
    q = '<span class="as-quick">' + "".join(f"<span>{b}</span>" for b in quick) + "</span>" if quick else ""
    ls = f'<span class="d25-lst">{LISTA_WA} {lista}</span>' if lista else ""
    return (f'<div class="w-m sal asis"><span class="gl"><span class="aut">{BOT} Asistente</span><span>{texto}</span>{card}{ls}{q}</span>'
            f'<span class="pie">Asistente · {hora} · Leído</span></div>')


def ent(texto, hora="10:36"):
    return f'<div class="w-m ent"><span class="gl">{texto}</span><span class="pie">{hora}</span></div>'


def msgs_doc():
    seguro_t = "Recibí un comprobante de transferencia de $ 150.000,00 del Banco Galicia. ¿Lo cargo?"
    seguro = msg_doc("img", "comprobante.jpg", "412 KB", "Te paso la transferencia de Ferretería Rosales") + asis(seguro_t, card=card_doc())
    lista_forms = "Lista «Elegir formulario»: Visita a cliente · Entrega de pedido · Control de vehículo · Cobro a cliente · Pago a proveedor · Otro"
    return {
        "Seguro": seguro,
        "Por qué lo propuso": msg_doc("img", "comprobante.jpg", "412 KB", "Te paso la transferencia de Ferretería Rosales", pop=pop_doc(POR_SEGURO)) + asis(seguro_t, card=card_doc()),
        "Con duda: botones": (msg_doc("mp", "captura.jpg", "96 KB", hora="10:20", pq="Por qué preguntó") + asis("¿Qué es este documento?", "10:20", quick=[COBRO, PAGO, "Otro"])
                              + ent(COBRO, "10:21") + asis("Listo: te preparé el formulario con el comprobante. Revisalo y confirmalo.", "10:21", card_doc())),
        "Con duda: lista": (msg_doc("ticket", "ticket.jpg", "88 KB", hora="10:22", pq="Por qué preguntó")
                            + asis("¿Qué es este documento?", "10:22", lista=f"Lista «Elegir formulario»: {GASTOS} · {PAGO} · Otro")),
        "Sin reconocer": (msg_doc("remito", "remito-0412.jpg", "640 KB", hora="09:58", pq="") + asis("No reconocí este documento. ¿Qué querés cargar con él?", "09:58", lista=lista_forms)
                          + ent("Otro", "09:59") + asis("Listo, lo dejé para que lo revise el equipo. Si hace falta, te escriben por acá.", "09:59")
                          + V.sis("Quedó en Documentos recibidos como «Sin clasificar» y se anotó en Formularios que faltan")),
        "Un PDF": msg_doc("pdf", "comprobante-nacion.pdf", "2 páginas · 180 KB", dibujo=False, hora="10:20")
        + asis("Recibí un comprobante de transferencia de $ 86.500,00 del Banco Nación. ¿Lo cargo?", "10:20", card_doc()),
        "Un Word": msg_doc("docx", "orden-de-pago.docx", "36 KB", dibujo=False, hora="11:47")
        + asis("Recibí una orden de pago de $ 412.000,00 a Corralón El Puente. ¿La cargo?", "11:47", card_doc(PAGO, "Prellenado · con el documento")),
        "Un Excel con varias filas": (msg_doc("xlsx", "pagos-semana.xlsx", "7 filas · 18 KB", dibujo=False, hora="17:20")
                                      + asis("La planilla tiene 7 pagos. Te propongo los 3 primeros; los otros 4 quedan para que los revise el equipo.", "17:20")
                                      + "".join(asis(f"Fila {k}: $ {m} de {c}.", "17:20", card_doc(COBRO, f"Prellenado · fila {k} de la planilla")) for k, m, c in
                                                [(1, "21.300,00", "Pinturerías Oeste"), (2, "18.900,00", "Corralón El Puente"), (3, "75.000,00", "Ferretería Rosales")])),
        "La ubicación y un contacto": (asis("Te preparé el formulario de la entrega.", "11:02", card_doc("Entrega de pedido", "Prellenado · Cliente"))
                                       + f'<div class="w-m ent"><span class="gl d25-gl"><span class="d25-ub"><span class="mapa">{UBICACION}</span><b>Ubicación</b><span>Av. Rivadavia 4520, CABA</span></span></span><span class="pie">11:05</span></div>'
                                       + asis("Completé «Dirección de entrega» con la ubicación.", "11:05", card_doc("Entrega de pedido", "Prellenado · Cliente y Dirección de entrega"))
                                       + f'<div class="w-m ent"><span class="gl d25-gl"><span class="d25-fn">{CONTACTO} <b>Carlos Ibáñez</b> · 011 15-5555-7788</span></span><span class="pie">11:06</span></div>'
                                       + asis("Completé «Recibió» y «Teléfono de quien recibe» con el contacto.", "11:06",
                                              card_doc("Entrega de pedido", "Prellenado · Cliente, Dirección de entrega, Recibió y Teléfono de quien recibe"))),
        "Foto movida": msg_doc("img", "comprobante.jpg", "380 KB", hora="10:40", movida=True, pq="")
        + asis("No se lee bien el número de operación ni la cuenta de origen. ¿Me mandás otra foto, con el comprobante entero y con buena luz?", "10:40"),
        "PDF con contraseña": msg_doc("pdf", "comprobante.pdf", "1 página · 120 KB", dibujo=False, hora="10:41", pq="")
        + asis("El PDF tiene contraseña y no lo puedo abrir. Mandame uno sin contraseña o una captura del comprobante.", "10:41"),
        "Repetido": msg_doc("img", "comprobante.jpg", "412 KB", hora="10:43", pq="") + asis(f"Ese comprobante ya se cargó el {AYER} 16:05, en COB-000118.", "10:43"),
        "La cuenta no da": msg_doc("img", "comprobante.jpg", "412 KB", hora="10:44", pop=pop_doc(POR_CBU))
        + asis("Recibí un comprobante de transferencia de $ 150.000,00 del Banco Galicia. ¿Lo cargo?", "10:44", card_doc(COBRO, "Prellenado · la cuenta de origen va marcada")),
        "No se le puede mandar": (msg_doc("img", "comprobante.jpg", "402 KB", hora="10:46", pq="Por qué lo derivó")
                                  + asis("Gracias, recibí tu comprobante de $ 412.000,00. No lo puedo cargar desde acá: se lo pasé a una persona del equipo para que lo revise.", "10:46")
                                  + V.sis("Pasó a atención manual · Necesita una persona")),
        "Un formato viejo": msg_doc("xlsx", "pagos.xls", "44 KB", dibujo=False, hora="10:48", pq="")
        + asis("No puedo abrir planillas de Excel viejas (.xls). Mandame un PDF o guardala como .xlsx.", "10:48"),
    }


E_CHDOC = list(msgs_doc())


def chat_documento():
    msgs = msgs_doc()
    msgs = {k: f'<span class="w-dia">{HOY}</span>' + v for k, v in msgs.items()}
    flags = {e: ("man" if e == "No se le puede mandar" else "as") for e in E_CHDOC}
    esc = {e: (A.escr() if flags[e] == "man" else V.esc_asistente()) for e in E_CHDOC}
    vp = {e: "Asistente: " + re.sub(r"<[^>]+>", "", re.findall(r'<span class="aut">.*?</span><span>(.*?)</span>', msgs[e], re.S)[-1])[:46] + "…" for e in E_CHDOC}
    hora = {e: f"{HOY} 10:48" for e in E_CHDOC}
    t = V.pagina_chat_as(E_CHDOC, esc, msgs, {}, vp, hora, "WhatsApp · Internos · documentos · etapa 25", flags)
    t = CH.a_wa(t)
    t = L.con_css(t, "e25", CSS_25 + CSS_DOCUMENTO + CSS_CHDOC + CH.CSS_CH)
    t = AS.en_whatsapp(E.post("WA-Chats-Documento", t), "chats", "Inicio / WhatsApp / Chats")
    return con_titulo(con_campana25(t), "WhatsApp · Internos · documentos · etapa 25")


def tel_chat(E_, esc, msgs, capas, titulo, nombre, sub, css=""):
    """El chat en el teléfono de quien atiende, como `tel_chat_martina` de la 23."""
    t = F.TCONV
    i = t.index('<div class="ap-cbar">')
    j = t.index('<span class="ap-raya"></span></div>\n</x-dc>')
    ini = "".join(p[0] for p in nombre.split()[:2]) if nombre[0].isalpha() else "#"
    barra = (f'<div class="ap-cbar"><a class="ap-ib" aria-label="Volver" href="M-WA-Chats.dc.html">{F.TCVOLVER}</a><span class="w-av">{ini}</span>'
             f'<span class="tx"><b>{nombre}</b><span>{sub}</span></span><button type="button" class="ap-ib" aria-label="Acciones de {nombre}">{F.TCKEBAB}</button></div>')
    chat = f'<div class="ap-chat"><span class="ap-dia">{HOY}</span>' + A.con_estados([(e, msgs.get(e, "")) for e in E_]) + "</div>"
    over = "".join(f'<sc-if value="{{{{s{E_.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = t[:i] + barra + chat + A.con_estados([(e, esc[e]) for e in E_]) + over + t[j:]
    t = t.replace("</helmet>", f'<style data-e12="chat-tel">\n{F.CSS_TEL}{F.CSS_TCHAT}{F.CSS_TFORM}{A.CSS_TCHAT_AB}{css}</style>\n</helmet>', 1)
    props = {"estado": {"editor": "enum", "options": E_, "default": E_[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
    t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(E_[0], ensure_ascii=False)};\n" + A.js_estados(E_))
    return con_titulo(t, titulo)


def tel_chat_documento():
    est = ["Seguro", "Por qué lo propuso", "Con duda: botones", "Sin reconocer", "Un Excel con varias filas", "Foto movida", "Un número que no es contacto"]
    m = msgs_doc()
    m = {k: v.replace('class="w-m ', 'class="ap-m ') for k, v in m.items()}
    m["Por qué lo propuso"] = m["Seguro"]
    m["Un número que no es contacto"] = (msg_doc("img", "comprobante.jpg", "380 KB", hora="10:50", pq="", clase="ap-m")
                                         + '<span class="ap-sis">No se leyó: el número no es un contacto de la organización. Lo atiende una persona.</span>')
    esc = {e: (A.t_escr() if e == "Un número que no es contacto" else CH.T_FR) for e in est}
    capas = {"Por qué lo propuso": CH.hoja_pq(POR_SEGURO).replace("Por qué respondió esto", "Por qué lo propuso")}
    css = CSS_25 + CSS_DOCUMENTO + CSS_CHDOC + CH.CSS_TCH + F.CSS_TFICHA + A.CSS_AB + A.CSS_TRESP_AB
    t = tel_chat(est, esc, m, capas, "WhatsApp · Internos · documentos · teléfono · etapa 25", TOMAS, "Ventas · Asistente", css)
    t = t.replace("<b>Tomás Acosta</b><span>Ventas · Asistente</span>", "<b>{{nombreChat}}</b><span>{{subChat}}</span>")
    raro = "Un número que no es contacto"
    return t.replace("      si: true, no: false,\n", f"      si: true, no: false, nombreChat: e === '{raro}' ? '011 15-5555-9911' : '{TOMAS}', subChat: e === '{raro}' ? 'Sin contacto' : 'Ventas · Asistente',\n", 1)


# ================================================================ M-WA-Flow-Prellenado: el formulario en el celular de quien mandó el documento (DOC3)
CSS_WA = """.wa-tel { position: absolute; inset: 0; display: flex; flex-direction: column; background: #efeae2; font-family: Inter, system-ui, sans-serif; }
.wa-est { height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 22px; font-size: 15px; font-weight: 600; color: #fff; background: #075e54; flex: none; }
.wa-cab { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #075e54; color: #fff; flex: none; }
.wa-cab .av { width: 34px; height: 34px; border-radius: 50%; background: #fff; color: #075e54; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.wa-cab .tx { display: flex; flex-direction: column; line-height: 1.25; } .wa-cab .tx b { font-size: 15.5px; font-weight: 600; } .wa-cab .tx span { font-size: 12px; opacity: 0.85; }
.wa-hilo { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px; padding: 10px 10px 8px; }
.wa-m { max-width: 82%; padding: 6px 9px 4px; border-radius: 7.5px; background: #fff; font-size: 14.5px; line-height: 1.35; color: #111b21; box-shadow: 0 1px 0.5px rgb(0 0 0 / 0.13); align-self: flex-start; }
.wa-m.yo { background: #d9fdd3; align-self: flex-end; }
.wa-m .h { display: block; text-align: right; font-size: 11px; color: #667781; margin-top: 2px; }
.wa-m b { font-weight: 600; }
.wa-m .lnk2 { color: #027eb5; overflow-wrap: anywhere; }
.wa-bts { display: flex; flex-direction: column; gap: 2px; align-self: flex-start; width: 82%; }
.wa-bts span { padding: 9px; border-radius: 7.5px; background: #fff; text-align: center; color: #027eb5; font-size: 14.5px; font-weight: 500; box-shadow: 0 1px 0.5px rgb(0 0 0 / 0.13); }
.wa-aud { display: flex; align-items: center; gap: 10px; min-width: 200px; }
.wa-aud .pl { width: 30px; height: 30px; border-radius: 50%; background: #00a884; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.wa-aud .onda { flex: 1; height: 18px; background: repeating-linear-gradient(90deg, #8696a0 0 2px, transparent 2px 5px); opacity: 0.6; border-radius: 2px; }
.wa-doc { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 5px; background: rgb(0 0 0 / 0.05); min-width: 210px; font-size: 13.5px; }
.wa-pie { display: flex; align-items: center; gap: 8px; padding: 6px 8px 22px; flex: none; }
.wa-pie .in { flex: 1; height: 42px; border-radius: 21px; background: #fff; display: flex; align-items: center; padding: 0 16px; color: #8696a0; font-size: 15px; }
.wa-pie .mic { width: 42px; height: 42px; border-radius: 50%; background: #00a884; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.wa-velo { position: absolute; inset: 0; background: rgb(0 0 0 / 0.35); }
.wa-flow { position: absolute; left: 0; right: 0; bottom: 0; top: 62px; background: #fff; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; }
.wa-fcab { display: flex; align-items: center; justify-content: space-between; height: 52px; padding: 0 16px; border-bottom: 1px solid #e9edef; font-size: 16px; font-weight: 600; color: #111b21; flex: none; }
.wa-fcab span { width: 24px; color: #54656f; font-weight: 400; font-size: 20px; text-align: center; }
.wa-fcu { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; }
.wa-aviso { display: flex; gap: 8px; padding: 10px 12px; border-radius: 8px; background: #fff8e1; color: #6b5300; font-size: 13.5px; line-height: 1.4; }
.wa-c { position: relative; border: 1px solid #c4cbd0; border-radius: 8px; padding: 7px 12px 8px; min-height: 30px; }
.wa-c small { display: block; font-size: 12px; color: #667781; }
.wa-c .v { font-size: 15.5px; color: #111b21; overflow-wrap: anywhere; }
.wa-c.duda { border: 2px solid #e8a33d; }
.wa-c.mal { border: 2px solid #d33b3b; }
.wa-c .tag { position: absolute; right: 8px; top: 8px; padding: 2px 7px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #fff3d6; color: #8a5a00; }
.wa-c .tag.no { background: #eef1f3; color: #54656f; }
.wa-c .tag.mal { background: #fde8e8; color: #b42318; }
.wa-err { margin-top: -6px; font-size: 13px; color: #b42318; }
.wa-sub { font-size: 15px; font-weight: 600; color: #111b21; }
.wa-sub2 { font-size: 13px; color: #667781; margin-top: -8px; }
.wa-arch { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e9edef; border-radius: 8px; font-size: 14px; }
.wa-arch .tx { flex: 1; display: flex; flex-direction: column; } .wa-arch .tx small { color: #667781; font-size: 12.5px; }
.wa-cambiar { display: flex; align-items: center; justify-content: center; gap: 8px; height: 42px; border: 1px solid #c4cbd0; border-radius: 8px; color: #008069; font-size: 15px; font-weight: 600; }
.wa-rd { display: flex; gap: 18px; font-size: 15px; } .wa-rd span { display: inline-flex; align-items: center; gap: 8px; } .wa-rd i { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #8696a0; box-sizing: border-box; }
.wa-fpie { flex: none; padding: 10px 16px 24px; border-top: 1px solid #e9edef; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.wa-fpie .bt { width: 100%; height: 44px; border-radius: 22px; background: #008069; color: #fff; font-size: 15.5px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.wa-fpie small { font-size: 12px; color: #667781; } .wa-fpie small b { color: #027eb5; font-weight: 500; }
"""


def wa_marco(cuerpo, encima=""):
    return (f'<div class="wa-tel"><div class="wa-est"><span>9:41</span><span>●●● ▮</span></div><div class="wa-cab"><span class="av">GD</span><span class="tx"><b>{ORG}</b>'
            f'<span>Cuenta de empresa</span></span></div>{cuerpo}{encima}</div>')


def wa_c(rot, valor, marca=""):
    tag = {"duda": f'<span class="tag">{ALERTA} Revisá</span>', "no": '<span class="tag no">No se leyó</span>', "mal": '<span class="tag mal">No pasa</span>'}.get(marca, "")
    return f'<div class="wa-c{" " + marca if marca in ("duda", "mal") else ""}"><small>{rot}</small><span class="v">{valor or "&nbsp;"}</span>{tag}</div>'


def wa_flow(titulo, campos, boton_="Continuar"):
    hilo = f'<div class="wa-hilo"><div class="wa-m yo">Te paso la transferencia de Ferretería Rosales<span class="h">10:35 ✓✓</span></div></div>'
    flow = (f'<div class="wa-velo"></div><div class="wa-flow"><div class="wa-fcab"><span>✕</span>{titulo}<span>⋮</span></div><div class="wa-fcu">{campos}</div>'
            f'<div class="wa-fpie"><span class="bt">{boton_}</span><small>Administrado por la empresa. <b>Más información</b></small></div></div>')
    return wa_marco(hilo, flow)


def tel_flow():
    aviso = f'<div class="wa-aviso">{ALERTA}<span>Lo completamos con el comprobante que mandaste. Revisá lo marcado antes de confirmar.</span></div>'
    s1 = aviso + wa_c("Cliente", "Ferretería Rosales") + wa_c("Monto", "150.000,00") + wa_c("Moneda", "Pesos") + wa_c("Fecha", HOY) + wa_c("Número de operación", "0458 7129 03", "duda") + wa_c("Concepto", "", "no")
    s2 = (wa_c("Hora", "10:32") + wa_c("Banco o billetera de origen", "Banco Galicia") + wa_c("Cuenta de origen", CBU_GALICIA) + wa_c("Quién transfirió", "Ferretería Rosales S.R.L.")
          + wa_c("CUIT o CUIL de origen", "30-71458236-0") + wa_c("Banco o billetera de destino", "Banco Santander"))
    arch = f'<div class="wa-arch">{mini("img")}<span class="tx">comprobante.jpg<small>412 KB · lo mandaste por WhatsApp</small></span><span>✕</span></div>'
    s3 = (wa_c("Cuenta de destino", CBU_DELTA) + wa_c("Titular de destino", "Grupo Delta S.A.") + wa_c("CUIT o CUIL de destino", CUIT_DELTA)
          + '<span class="wa-sub">Comprobante</span>' + arch + f'<span class="wa-cambiar">{CLIP} Cambiar documento</span>')
    s3b = (wa_c("Cuenta de destino", CBU_DELTA) + wa_c("Titular de destino", "Grupo Delta S.A.") + wa_c("CUIT o CUIL de destino", CUIT_DELTA)
           + '<span class="wa-sub">Comprobante</span>' + f'<div class="wa-arch">{mini("img")}<span class="tx">Adjuntamos tu documento<small>comprobante.jpg · lo mandaste por WhatsApp</small></span></div>')
    s4 = (wa_c("Hora", "10:32") + wa_c("Banco o billetera de origen", "Banco Galicia") + wa_c("Cuenta de origen", CBU_GALICIA_MAL, "mal")
          + '<span class="wa-err">Revisá la cuenta: los números no dan. Copiala del comprobante.</span>' + wa_c("Quién transfirió", "Ferretería Rosales S.R.L."))
    bloque = DECISIONES["bloque_en_documento"] == "vacio"
    s5 = ('<span class="wa-sub">Productos · ítem 1</span>' + wa_c("Producto", "" if bloque else "Bolsas de cemento de 50 kg") + wa_c("Cantidad", "" if bloque else "12")
          + wa_c("Unidad (opcional)", "" if bloque else "Unidades") + '<span class="wa-sub" style="margin-top: 6px;">¿Agregás otro ítem?</span>'
          + '<div class="wa-rd"><span><i></i>Sí</span><span><i></i>No</span></div>')
    remito = (f'<div class="wa-aviso">{ALERTA}<span>Lo completamos con el remito que mandaste. Revisá lo marcado antes de confirmar.</span></div>'
              + wa_c("Número de remito", "0001-00000412") + wa_c("Fecha de entrega", HOY) + wa_c("Proveedor", "Corralón El Puente S.R.L.") + wa_c("Zona de entrega", "", "no"))
    est = ["Lo leído", "Origen y destino", "El comprobante, adjunto", "Adjuntamos tu documento", "La cuenta no pasa", "Un remito", "Un remito: el bloque"]
    cu = {"Lo leído": wa_flow(COBRO, s1), "Origen y destino": wa_flow(COBRO, s2), "El comprobante, adjunto": wa_flow(COBRO, s3, "Cargar comprobante"),
          "Adjuntamos tu documento": wa_flow(COBRO, s3b, "Cargar comprobante"), "La cuenta no pasa": wa_flow(COBRO, s4),
          "Un remito": wa_flow(REMITO, remito), "Un remito: el bloque": wa_flow(REMITO, s5)}
    t = C.tel_pagina(cu, est, {}, "WhatsApp · el formulario prellenado · teléfono · etapa 25", CSS_25 + CSS_WA)
    return estilo(t, "flow", ".ap-cuerpo, .ap-bar { display: none; }\n")


# ================================================================ M-WA-Armar-Con-IA: pedir por WhatsApp que arme (155 y 171), en el chat de la cuenta vinculada
def wa_chat(mensajes, fin=""):
    return wa_marco(f'<div class="wa-hilo">{mensajes}</div><div class="wa-pie"><span class="in">Mensaje</span><span class="mic">{MICRO}</span></div>', fin)


def wm(texto, h="10:00", yo=False):
    return f'<div class="wa-m{" yo" if yo else ""}">{texto}<span class="h">{h}{" ✓✓" if yo else ""}</span></div>'


def wa_audio(dur, h, yo=True):
    return f'<div class="wa-m{" yo" if yo else ""}"><span class="wa-aud"><span class="pl">{PLAY}</span><span class="onda"></span><span>{dur}</span></span><span class="h">{h}{" ✓✓" if yo else ""}</span></div>'


def wbts(*b):
    return '<div class="wa-bts">' + "".join(f"<span>{x}</span>" for x in b) + "</div>"


def resumen(con_recibio=False):
    pregs = ["Número de remito · texto corto", "Fecha de entrega · fecha", "Proveedor · texto corto", "Zona de entrega · catálogo Zonas",
             "Productos · bloque de 1 a 10 ítems", "Foto del remito · foto"] + (["Recibió · texto corto"] if con_recibio else [])
    lista = "<br>".join(f"{k}. {p}" for k, p in enumerate(pregs, 1))
    return f"Te propongo este formulario:<br><b>{REMITO}</b> · REM<br>{lista}<br>¿Lo armo?"


ENLACE = "https://delta.ejemplo.com/org/formularios/borradores/remito-de-entrega"


def tel_wa_armar():
    pedido = wa_audio("0:18", "10:00")
    uno = pedido + wm(resumen(), "10:00") + wbts("Crear borrador", "Cambiar algo")
    cambio = (uno + wm("Cambiar algo", "10:01", True) + wm("Decime qué cambio, por escrito o con un audio.", "10:01") + wa_audio("0:07", "10:02")
              + wm(resumen(True), "10:02") + wbts("Crear borrador", "Cambiar algo"))
    crear = (pedido + wm(resumen(), "10:00") + wm("Crear borrador", "10:01", True)
             + wm(f'Listo: armé el borrador <b>{REMITO}</b>. Revisalo y publicalo desde la app:<br><span class="lnk2">{ENLACE}</span>', "10:01"))
    cat = (f'<div class="wa-m yo"><span class="wa-doc">{mini("xlsx")}<span>proveedores-de-obra.xlsx<br><small>86 filas · 24 KB</small></span></span>'
           f'<span class="h">09:40 ✓✓</span></div>' + wm("Armame un catálogo con esta planilla", "09:40", True)
           + wm(f"Te propongo el catálogo <b>{CAT}</b>: el código es el CUIT, cada opción la razón social y los campos Rubro y Zona. Son 86 filas. ¿Lo armo?", "09:40")
           + wbts("Crear catálogo", "Cambiar algo"))
    cat_creado = cat + wm("Crear catálogo", "09:41", True) + wm(f'Listo: armé el catálogo <b>{CAT}</b>. Revisalo y aprobalo desde la app:<br><span class="lnk2">https://delta.ejemplo.com/org/catalogos/proveedores-de-obra</span>', "09:41")
    sin = wm("Armame un formulario para los pedidos de repuestos", "11:10", True) + wm(f"No tenés permiso para diseñar formularios. Pedíselo a quien administra los roles de {ORG}.", "11:10")
    existe = (wm("Cambiá el formulario Pedido de service para que pida la foto de la heladera", "11:12", True)
              + wm('Por ahora no cambio formularios que ya existen. Lo podés cambiar desde la app:<br><span class="lnk2">https://delta.ejemplo.com/org/formularios/pedido-de-service</span>', "11:12"))
    viejo = cambio + wm("Crear borrador", "10:03", True) + wm("Esa propuesta ya cambió. Usá los botones de la última.", "10:03")
    est = ["Pedido con un audio", "Cambiar algo", "Crear el borrador", "Un catálogo", "Catálogo creado", "Sin permiso", "Ya existe", "Un botón viejo"]
    cu = {"Pedido con un audio": wa_chat(uno), "Cambiar algo": wa_chat(cambio), "Crear el borrador": wa_chat(crear), "Un catálogo": wa_chat(cat),
          "Catálogo creado": wa_chat(cat_creado), "Sin permiso": wa_chat(sin), "Ya existe": wa_chat(existe), "Un botón viejo": wa_chat(viejo)}
    t = C.tel_pagina(cu, est, {}, "WhatsApp · pedir que arme un formulario o un catálogo · teléfono · etapa 25", CSS_25 + CSS_WA)
    return estilo(t, "wa", ".ap-cuerpo, .ap-bar { display: none; }\n")


# ================================================================ Asistente-Org-25: armar en el chat del Inicio (IA1-A e IA4; 154 a 156 y 171)
CSS_INICIO25 = """.d25-card { border: 1px solid var(--borde2); border-radius: 3px; background: #fff; margin-top: 6px; font-size: 13px; }
.d25-card .cab { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-bottom: 1px solid var(--borde); background: oklch(0.975 0.006 95); }
.d25-card .cab b { font-weight: 600; margin-right: auto; }
.d25-card .cab .cb { height: 26px; font-size: 12.5px; padding: 0 10px; }
.d25-card .cu { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px 12px; }
.d25-card .nm { font-size: 14px; font-weight: 600; }
.d25-card .s { color: var(--t2); margin-top: -5px; }
.d25-card .q { display: flex; flex-direction: column; gap: 1px; }
.d25-card .q small { color: var(--t2); font-size: 12px; }
.d25-card .q .nueva { margin-left: 6px; padding: 0 5px; border: 1px solid var(--borde2); border-radius: 3px; font-size: 11px; color: var(--marca-tx); }
.d25-card .sub { display: flex; flex-direction: column; gap: 5px; margin: 4px 0 0 4px; padding-left: 10px; border-left: 2px solid var(--borde2); }
.d25-card .err2 { color: var(--peligro); font-size: 12.5px; }
.d25-card.pleg { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
.d25-card.pleg b { font-weight: 600; }
.d25-card .etq { padding: 0 6px; border: 1px solid var(--borde2); border-radius: 3px; font-size: 11.5px; color: var(--t2); }
.d25-card .mues { border: 1px solid var(--borde); border-radius: 3px; font-size: 12px; }
.d25-card .mues .f { display: grid; grid-template-columns: 110px minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 0.8fr); }
.d25-card .mues .f span { padding: 5px 8px; } .d25-card .mues .f span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.d25-card .mues .f + .f { border-top: 1px solid var(--borde); }
.d25-card .mues .h { background: oklch(0.945 0.027 95); font-weight: 600; color: var(--t2); }
.d25-card .mues .mas { padding: 5px 8px; border-top: 1px solid var(--borde); color: var(--t2); }
.d25-au { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.d25-au .cb { height: 26px; font-size: 12.5px; }
.d25-au .tr { color: var(--t3); font-size: 12px; max-width: 420px; text-align: right; }
.d25-grab { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13px; }
.d25-grab .pt { width: 9px; height: 9px; border-radius: 50%; background: var(--peligro); }
.d25-grab .esp { flex: 1; }
.d25-grab .cb { height: 28px; font-size: 12.5px; }
.d25-aud { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border: 1px solid var(--borde); border-radius: 3px; font-size: 12.5px; color: var(--t2); }
.d25-aud .onda { flex: 1; height: 16px; background: repeating-linear-gradient(90deg, var(--borde2) 0 2px, transparent 2px 5px); }
.as-tool .t10-aro { width: 14px; height: 14px; border-width: 2px; }
.as-adj.d25-no { border-color: var(--peligro); }
.as-chips .as-chip.d25-sug { border-color: var(--marca); color: var(--marca-tx); }
.w-dlg.cq { width: 460px; }
.w-dlg.cq .pv { margin: 0 auto; }
"""
PEDIDO_REM = "Armame un formulario para registrar los remitos de entrega de los proveedores, con los productos que trae cada uno."


def yo(texto="", adj="", audio=None):
    a = f'<span class="as-adj"><span class="ic">{mini(adj[1])}</span><span class="n">{adj[0]}</span><span class="p">{adj[2]}</span></span>' if adj else ""
    if audio:
        return (f'<div class="as-yo"><span class="as-burb d25-au"><button type="button" class="cb cb-sec">{PLAY} Escuchar · {audio[0]}</button>'
                f'<span class="tr">{audio[1]}</span></span></div>')
    b = f'<span class="as-burb">{texto}</span>' if texto else ""
    return f'<div class="as-yo">{a}{b}</div>'


def el(texto="", extra="", tool=""):
    t = f'<span class="as-tool">{tool}</span>' if tool else ""
    md = f'<div class="as-md"><p>{texto}</p></div>' if texto else ""
    return f'<div class="as-el"><span class="as-av">{CHISPA}</span><div class="as-cont">{t}{md}{extra}</div></div>'


def card_form(nueva=False, botones="normal", error=""):
    pregs = list(REM_PREGUNTAS) + ([("Recibió", "Texto corto", True, "")] if nueva else [])
    h = ""
    for k, (n, tipo, ob, _l) in enumerate(pregs, 1):
        t = tipo if tipo.startswith("Bloque") else f"{tipo} · {'Obligatoria' if ob else 'Opcional'}"
        etq = '<span class="nueva">Nueva</span>' if (nueva and n == "Recibió") else ""
        sub = ""
        if tipo.startswith("Bloque"):
            sub = '<div class="sub">' + "".join(f'<div class="q"><span>{bn}</span><small>{bt} · {"Obligatoria" if bo else "Opcional"}</small></div>' for bn, bt, bo, _x in REM_BLOQUE) + "</div>"
        h += f'<div class="q"><span>{k}. {n}{etq}</span><small>{t}</small>{sub}</div>'
    if botones == "creando":
        acc = boton("Ver cómo queda", extra=" disabled") + E.trabaja("Creando…")
    else:
        acc = boton("Ver cómo queda") + boton("Crear borrador", "cb-pri")
    err = f'<span class="err2" role="alert">{error}</span>' if error else ""
    return (f'<div class="d25-card"><div class="cab"><b>Formulario</b>{acc}</div><div class="cu"><span class="nm">{REMITO}</span>'
            f'<span class="s">REM · {len(pregs)} preguntas</span>{err}{h}</div></div>')


def card_cat():
    filas = "".join(f'<div class="f"><span>{c}</span><span>{t}</span><span>{r}</span><span>{z}</span></div>' for c, t, r, z in FILAS_CAT)
    cols = "".join(f'<div class="q"><span>{a}</span><small>{b}</small></div>' for a, b in [("Código", "CUIT · columna A"), ("Opción", "Razón social · columna B"),
                                                                                             ("Rubro", "Texto · columna C"), ("Zona", "Texto · columna D")])
    return (f'<div class="d25-card"><div class="cab"><b>Catálogo</b>{boton("Crear catálogo", "cb-pri")}</div><div class="cu"><span class="nm">{CAT}</span>'
            f'<span class="s">Texto · 2 campos · 86 filas</span>{cols}<div class="mues"><div class="f h"><span>CUIT</span><span>Razón social</span><span>Rubro</span><span>Zona</span></div>'
            f'{filas}<div class="mas">y 83 filas más</div></div></div></div>')


def plegada(clase, nombre, etq, enlace=""):
    a = f'<a class="lnk" href="{enlace[1]}">{enlace[0]}</a>' if enlace else ""
    return f'<div class="d25-card pleg"><b>{clase}</b><span>{nombre}</span><span class="etq">{etq}</span>{a}</div>'


def caja(placeholder="Preguntá lo que quieras sobre Grupo Delta", adj=None, grabando=False, audio=False, err=""):
    if grabando:
        dentro = (f'<div class="d25-grab"><span class="pt"></span><span>Grabando · 0:12</span><span class="esp"></span>'
                  f'{boton("Descartar")}{boton("Detener", "cb-pri")}</div>')
        return f'<div class="as-caja">{dentro}</div>'
    a = ""
    if adj:
        no = " d25-no" if adj[3] else ""
        a = (f'<div class="as-adjs"><span class="as-adj{no}"><span class="ic">{mini(adj[1])}</span><span class="n">{adj[0]}</span><span class="p">{adj[2]}</span>'
             f'<button type="button" class="as-ib mini" aria-label="Quitar {adj[0]}">{X}</button></span></div>')
    au = (f'<div class="d25-aud"><button type="button" class="as-ib mini" aria-label="Escuchar">{PLAY}</button><span class="onda"></span><span>0:12</span>'
          f'<button type="button" class="as-ib mini" aria-label="Descartar el audio">{X}</button></div>') if audio else ""
    ph = "Agregá un texto, si querés…" if audio else placeholder
    acc = (f'<div class="as-acc"><button type="button" class="as-ib" aria-label="Adjuntar un archivo">{CLIP}</button><span class="as-esp"></span>'
           f'<button type="button" class="as-ib" aria-label="Grabar un audio">{MICRO}</button><button type="button" class="as-env" aria-label="Enviar">{ENVIAR}</button></div>')
    e = f'<span class="as-err" role="alert">{err}</span>' if err else ""
    return f'<div class="as-caja">{a}{au}<textarea class="as-tx" aria-label="Tu consulta" placeholder="{ph}"></textarea>{acc}</div>{e}'


CON_PROP = "Pedí un cambio o hacé otra consulta…"
EXPLICA = ("Te propongo este formulario. Lo que se repite en cada remito, los productos, va como un bloque. Usé el catálogo Zonas, que ya existe; "
           "el proveedor quedó como texto. Si querés, armo también un catálogo de proveedores.")


def hilo(msgs, caja_):
    return f'<div class="as-hilo"><div class="as-col">{msgs}</div></div><div class="as-pie"><div class="as-col">{caja_}</div></div>'


def estados_inicio():
    p1 = yo(PEDIDO_REM) + el(EXPLICA, card_form())
    ajuste = (yo(PEDIDO_REM) + el(EXPLICA, plegada("Formulario", REMITO, "Reemplazada")) + yo("Agregá quién lo recibió.")
              + el("Agregué «Recibió», obligatoria.", card_form(nueva=True)))
    foto = yo("Armame un formulario con esto", ("remito-0412.jpg", "img", "640 KB"))
    audio = yo(audio=("0:21", "«Armame un formulario para los remitos de los proveedores, con los productos y las cantidades.»"))
    excel = yo("Armame un catálogo de proveedores de obra con esta planilla", ("proveedores-de-obra.xlsx", "xlsx", "86 filas · 24 KB"))
    cat = "Te propongo este catálogo, con la planilla. El código es el CUIT y cada opción, la razón social."
    sugs = ('<div class="as-chips" role="group" aria-label="Sugerencias"><button type="button" class="as-chip d25-sug">Armame un formulario para…</button>'
            '<button type="button" class="as-chip d25-sug">Armame un catálogo con una planilla</button><button type="button" class="as-chip">Usuarios activos</button>'
            '<button type="button" class="as-chip">Invitaciones vencidas</button></div>')
    vacio = (f'<div class="as-bien"><div class="as-col"><div class="as-cab"><span class="as-av">{CHISPA}</span><h2 class="as-h">¿Qué querés consultar?</h2></div>'
             f'{caja("Preguntale al sistema o pedile que arme un formulario…")}{sugs}</div></div>')
    E_ = {
        "Inicio vacío": vacio,
        "Pedido con un texto": hilo(p1, caja(CON_PROP)),
        "Ver cómo queda": hilo(p1, caja(CON_PROP)),
        "Un ajuste": hilo(ajuste, caja(CON_PROP)),
        "Creando": hilo(yo(PEDIDO_REM) + el(EXPLICA, card_form(botones="creando")), caja(CON_PROP)),
        "Borrador creado": hilo(yo(PEDIDO_REM) + el(EXPLICA, plegada("Formulario", REMITO, "Borrador creado", ("Abrir el borrador", "FRM-Editor-Lectura.dc.html"))), caja(CON_PROP)),
        "El prefijo en uso": hilo(yo(PEDIDO_REM) + el(EXPLICA, card_form(error="El prefijo REM ya es de otro formulario. Pedime otro.")), caja(CON_PROP)),
        "Leyendo la foto": hilo(foto + el(tool=f"{ARO} Leyendo remito-0412.jpg…"), caja(CON_PROP)),
        "Pedido con la foto de un remito": hilo(foto + el(EXPLICA, card_form()), caja(CON_PROP)),
        "Pedido con un audio": hilo(audio + el(EXPLICA, card_form()), caja(CON_PROP)),
        "Pedido con un Excel": hilo(excel + el(cat, card_cat()), caja(CON_PROP)),
        "Catálogo creado": hilo(excel + el(cat, plegada("Catálogo", CAT, "Catálogo creado", ("Abrir el catálogo", "FRM-Catalogo-Propuesta-25.dc.html"))), caja(CON_PROP)),
        "Sin permiso": hilo(yo(PEDIDO_REM) + el(f"No tenés permiso para diseñar formularios. Pedíselo a quien administra los roles de {ORG}."), caja()),
        "Ya existe": hilo(yo("Cambiá el formulario Pedido de service para que pida la foto de la heladera.")
                          + el('Por ahora no cambio formularios que ya existen. Lo podés cambiar desde la app: <a class="as-ir" href="FRM-Editor-21.dc.html">Abrir Pedido de service</a>'), caja()),
        "El clip: un archivo que no se lee": hilo(yo(PEDIDO_REM) + el(EXPLICA, card_form()),
                                                  caja(CON_PROP, ("pagos.xls", "xlsx", "44 KB", True), err="No se puede leer un Excel viejo (.xls). Guardalo como .xlsx o .csv.")),
        "Grabando": hilo(yo(PEDIDO_REM) + el(EXPLICA, card_form()), caja(grabando=True)),
        "Audio listo": hilo(yo(PEDIDO_REM) + el(EXPLICA, card_form()), caja(CON_PROP, audio=True)),
        "Sin permiso del micrófono": hilo(yo(PEDIDO_REM) + el(EXPLICA, card_form()), caja(CON_PROP, err="El navegador no dio permiso para usar el micrófono.")),
        "Un audio que no se entendió": hilo(yo(PEDIDO_REM) + el(EXPLICA, card_form()),
                                            caja(CON_PROP, audio=True, err="No entendimos el audio. Grabalo de nuevo o escribí tu consulta.")),
    }
    return E_


def dlg_como_queda():
    campos = "".join(f'<div class="pv-c">{n}{"" if ob else " (opcional)"}<div class="pv-in">{v}</div></div>' for n, ob, v in
                     [("Número de remito", True, ""), ("Fecha de entrega", True, f"Elegí una fecha {CHEV}"), ("Proveedor", True, ""), ("Zona de entrega", True, f"Elegí una opción {CHEV}")])
    pv = (f'<div class="pv"><div class="tel"><div class="pv-hoja"><div class="pv-hc"><span class="pv-x">×</span>{REMITO}</div><div class="pv-hb">{campos}</div>'
          '<div class="pv-pie"><div class="pv-bt">Continuar</div></div></div></div></div>')
    return F.dialogo(f"Cómo queda · {REMITO}", pv, f'{boton("Cerrar")}{boton("Crear borrador", "cb-pri")}').replace('class="w-dlg"', 'class="w-dlg cq"', 1)


COMENTARIO = re.compile(r"/\*.*?\*/", re.S)


def reglas(fuente, *clases):
    """Las reglas de estilo de otro tablero cuyos selectores nombran alguna de estas clases (un diálogo en un marco que no lo trae)."""
    css = COMENTARIO.sub("", "".join(re.findall(r"<style[^>]*>(.*?)</style>", fuente, re.S)))
    return "".join(m.group(0).strip() + "\n" for m in re.finditer(r"[^{}]+\{[^{}]*\}", css) if any(c in m.group(0).split("{")[0] for c in clases))


def inicio25():
    t = (PROJ / "Asistente-Org.dc.html").read_text(encoding="utf-8")
    E_ = estados_inicio()
    est = list(E_)
    i = t.index('<section class="as-chat"')
    j = t.index("</section>", i) + len("</section>")
    t = t[:i] + f'<section class="as-chat" aria-label="Asistente">{A.con_estados([(e, E_[e]) for e in est])}</section>' + t[j:]
    props = {"estado": {"editor": "enum", "options": est, "default": est[1], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = re.sub(r"data-props='[^']*'", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    viejo = "    return { ...this.renderValsBase(), ...this.asistente() };"
    assert viejo in t, "renderVals del Inicio"
    js = (f"    const e = this.props.estado ?? {json.dumps(est[1], ensure_ascii=False)};\n    const k = {json.dumps(est, ensure_ascii=False)}.indexOf(e);\n"
          "    return { ...this.renderValsBase(), ...this.asistente(), si: true, no: false, " + ", ".join(f"s{n}: k === {n}" for n in range(len(est))) + " };")
    t = t.replace(viejo, js, 1)
    t = capas_en(t, est, {"Ver cómo queda": dlg_como_queda()})
    dialogo = reglas(F.BASE, ".w-oscuro", ".w-dlg") + F.CSS_DLG + reglas("<style>" + F.CSS_FICHA + "</style>", ".pv", ".tel")
    t = estilo(t, "inicio", dialogo + CSS_25 + CSS_ARO + CSS_INICIO25 + E.CSS_E12
               + ".w-oscuro { position: absolute; inset: 0; z-index: 60; }\n.pv { display: flex; flex-direction: column; } .pv .tel { margin: 0 auto; }\n")
    t = t.replace(">Invitaciones vencidas</", ">Un formulario para los remitos</", 1)
    return con_titulo(con_campana25(t), "Asistente · inicio de la organización · armar con la IA · etapa 25")


def tel_inicio25():
    est = ["Pedido con un texto", "Ver cómo queda", "Pedido con un Excel", "Borrador creado", "Grabando", "Un audio que no se entendió"]
    E_ = estados_inicio()
    bar = (f'<div class="ap-bar"><a class="ap-ib" aria-label="Historial" href="#">{svg("<path d=" + chr(34) + "M4 6h16M4 12h16M4 18h10" + chr(34) + "/>", 22, "2")}</a>'
           f'<div class="tit"><h1>Asistente</h1><span class="sub">{ORG}</span></div></div>')
    cu = {e: bar + f'<div class="ap-cuerpo t25-as">{E_[e]}</div>' for e in est}
    hoja = F.thoja(f"Cómo queda · {REMITO}", re.search(r'<div class="pv">.*</div></div></div></div>', dlg_como_queda(), re.S).group(0), f'{boton("Crear borrador", "cb-pri lleno")}{boton("Cerrar")}')
    base = reglas((PROJ / "Asistente-Org.dc.html").read_text(encoding="utf-8").split("</helmet>")[0], ".as-")
    css = (base + CSS_25 + CSS_ARO + CSS_INICIO25 + E.CSS_E12 + ".t25-as { display: flex; flex-direction: column; } .t25-as .as-hilo { flex: 1; padding: 12px 14px 4px; }"
           " .t25-as .as-pie { padding: 4px 10px 14px; } .t25-as .as-burb { max-width: 86%; } .t25-as .d25-card .cab { flex-wrap: wrap; }\n")
    t = C.tel_pagina(cu, est, {"Ver cómo queda": hoja}, "Asistente · organización · armar con la IA · teléfono · etapa 25", css)
    return t


# ================================================================ Escribir y registrar
TEXTO_PRADERA = (pathlib.Path(__file__).resolve().parent / "paleta_pradera_1004.py").read_text(encoding="utf-8")
PRADERA = {"__file__": str(pathlib.Path(__file__).resolve().parent / "paleta_pradera_1004.py"), "__name__": "paleta_pradera_piezas"}
exec(compile(TEXTO_PRADERA.split("\ncanvas = json.loads(")[0], "paleta_pradera_1004.py", "exec"), PRADERA)  # solo las piezas: el script recorre todo el lienzo al final


def escribir(n, t):
    """Cada tablero sale con la paleta Pradera (lo que paleta_pradera_1004.py hace con todos al final)."""
    (SALIDA / f"{n}.dc.html").write_text(PRADERA["pasar"](t, {}), encoding="utf-8")


CONSTRUCTORES = {"FRM-Documentos": lambda: con_campana25(documentos()), "M-FRM-Documentos": tel_documentos, "Campana-25": campana25, "M-Campana-25": tel_campana25,
                 "FRM-Formularios-25": formularios25, "FRM-Catalogos-25": catalogos25, "FRM-Faltan-25": faltan25, "WA-Asistente-Casos-25": lambda: asistente_casos25(),
                 "FRM-Armar-Con-IA": lambda: armar(), "M-FRM-Armar-Con-IA": lambda: tel_armar(), "FRM-Respuesta-25": lambda: respuesta25(),
                 "M-FRM-Respuesta-25": lambda: tel_respuesta25(), "FRM-Editor-Lectura": lambda: editor_lectura(), "M-FRM-Editor-Lectura": lambda: tel_editor_lectura(),
                 "Plat-FRM-Plantilla-Lectura": lambda: plat_plantilla_lectura(), "FRM-Plantilla-25": lambda: plantilla25(), "M-FRM-Plantilla-25": lambda: tel_plantilla25(),
                 "FRM-Catalogo-Propuesta-25": lambda: catalogo_propuesta25(), "WA-Chats-Documento": lambda: chat_documento(),
                 "M-WA-Chats-Documento": lambda: tel_chat_documento(), "M-WA-Flow-Prellenado": lambda: tel_flow(), "M-WA-Armar-Con-IA": lambda: tel_wa_armar(),
                 "Asistente-Org-25": lambda: inicio25(), "M-Asistente-Org-25": lambda: tel_inicio25()}

# Para canvas.json (lo carga la coordinadora): título, ancho, alto y página. La fila de la etapa va debajo de la 24, en este orden.
PAG, PAG_PLAT = "formularios", "plat-formularios"
TITULOS = {
    "FRM-Documentos": ("Formularios · documentos recibidos · etapa 25", 1440, 900, PAG), "Campana-25": ("Avisos · la campana · etapa 25", 1440, 900, PAG),
    "WA-Chats-Documento": ("WhatsApp · Internos · documentos · etapa 25", 1440, 900, PAG),
    "FRM-Armar-Con-IA": ("Formularios · armar un formulario con la IA · etapa 25", 1440, 1100, PAG),
    "FRM-Respuesta-25": ("Formularios · una respuesta · de qué documento salió · etapa 25", 1440, 900, PAG),
    "FRM-Editor-Lectura": ("Formularios · la lectura de documentos · etapa 25", 1440, 2350, PAG),
    "FRM-Plantilla-25": ("Formularios · una plantilla · qué lee · etapa 25", 1440, 2000, PAG),
    "WA-Asistente-Casos-25": ("WhatsApp · el asistente · los casos · etapa 25", 1440, 1500, PAG),
    "Asistente-Org-25": ("Asistente · inicio de la organización · armar con la IA · etapa 25", 1440, 900, PAG),
    "FRM-Catalogo-Propuesta-25": ("Formularios · el catálogo que propone el asistente · etapa 25", 1440, 1100, PAG),
    "FRM-Formularios-25": ("Formularios · la lista · etapa 25", 1440, 900, PAG), "FRM-Catalogos-25": ("Formularios · Catálogos · etapa 25", 1440, 900, PAG),
    "FRM-Faltan-25": ("Formularios · formularios que faltan · etapa 25", 1440, 900, PAG),
    "M-FRM-Documentos": ("Formularios · documentos recibidos · teléfono · etapa 25", 390, 844, PAG), "M-Campana-25": ("Avisos · la campana · teléfono · etapa 25", 390, 844, PAG),
    "M-WA-Chats-Documento": ("WhatsApp · Internos · documentos · teléfono · etapa 25", 390, 844, PAG),
    "M-WA-Flow-Prellenado": ("WhatsApp · el formulario prellenado · teléfono · etapa 25", 390, 844, PAG),
    "M-FRM-Armar-Con-IA": ("Formularios · armar con la IA · teléfono · etapa 25", 390, 844, PAG),
    "M-FRM-Respuesta-25": ("Formularios · una respuesta · de qué documento salió · teléfono · etapa 25", 390, 844, PAG),
    "M-FRM-Editor-Lectura": ("Formularios · la lectura de documentos · teléfono · etapa 25", 390, 844, PAG),
    "M-FRM-Plantilla-25": ("Formularios · una plantilla · qué lee · teléfono · etapa 25", 390, 844, PAG),
    "M-Asistente-Org-25": ("Asistente · organización · armar con la IA · teléfono · etapa 25", 390, 844, PAG),
    "M-WA-Armar-Con-IA": ("WhatsApp · pedir que arme un formulario o un catálogo · teléfono · etapa 25", 390, 844, PAG),
    "Plat-FRM-Plantilla-Lectura": ("Plataforma · plantilla · lectura de documentos · etapa 25", 1440, 2300, PAG_PLAT),
}
assert set(TITULOS) == set(CONSTRUCTORES), set(TITULOS) ^ set(CONSTRUCTORES)


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--salida" in args:
        SALIDA = pathlib.Path(args[args.index("--salida") + 1]).resolve()
        SALIDA.mkdir(parents=True, exist_ok=True)
    solo = [a for a in args if not a.startswith("--") and (args.index(a) == 0 or args[args.index(a) - 1] != "--salida")]
    hechos = []
    for n, f in CONSTRUCTORES.items():
        if solo and n not in solo:
            continue
        escribir(n, f())
        hechos.append(n)
    print("tableros", len(hechos), "en", SALIDA)
