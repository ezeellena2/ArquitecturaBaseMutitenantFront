"""La etapa 21, reglas, aprobación, PDF y avisos (21-reglas-y-aprobacion.md del back), primera parte: las reglas, el diseño del PDF, la decisión
y los avisos en el chat. Sigue el front real de ArquitecturaBaseFront (126 y 135): la caja «Cuando llega una respuesta» con «Agregar regla» y
«Guardar reglas» en su cabecera, cada regla con ✎ 🗑 y cada acción con ↑ ↓ 🗑, «Historial de las reglas» al costado y una regla que se edita en
el lugar y se cierra con «Listo»; «El comprobante» con «Guardar diseño» y la vista previa al costado; la decisión en la vista rápida, con los
momentos arriba de las pestañas, y «Aprobar» que pide confirmar (114). Lo que allá no existe sale de la spec: las reglas son una pestaña (79),
el PDF tiene tres estilos, color, secciones y firmas (59 y 82), y la actividad no muestra «Sin confirmar» (80).

El ejemplo es «Visita a cliente», versión 4, que pide aprobación al rol Supervisor. La segunda parte, `formularios_21_respuestas_1004.py`,
usa la planilla de acá. Corre después de `formularios_20_carga_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_planilla_1004 as P  # noqa: E402
import formularios_ab_reglas_1004 as G  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import formularios_15_respuestas_1004 as R  # noqa: E402
import formularios_19_logica_1004 as X  # noqa: E402
import formularios_20_carga_1004 as W  # noqa: E402

PROJ = F.PROJ
svg = F.svg
CHEV, MAS, TILDE, CERRAR, INFO = F.CHEV, A.MAS, A.TILDE, F.X, F.INFO
SUBE, BAJA, CHECK, PERSONA, DESCARGAR = P.SUBE, P.BAJA, P.CHECK, P.PERSONA, A.DESCARGAR
RELOJ = A.RELOJ
APROBAR = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16, "2")
LAPIZ, QUITAR = F.LAPIZ, F.QUITAR
FORM, SUP = "Visita a cliente", "Supervisor"
info = F.info

# ================================================================ Los datos de «Visita a cliente»
NUM_P, QUIEN_P, HORA_P = "VIS-000130", "Paula Méndez", "15/10/2026 16:20"
NUM_A, QUIEN_A, HORA_A, DEC_A = "VIS-000126", "Tomás Acosta", "13/10/2026 15:30", "13/10/2026 16:05"
NUM_R, HORA_R, DEC_R, MOTIVO_R = "VIS-000125", "13/10/2026 14:10", "14/10/2026 09:10", "Falta la foto del frente de la obra."
PDF_A = "Comprobante-VIS-000126.pdf"
DIRECCION = "administracion@delta.ejemplo.com"
# Tres por aprobar, como dice la lista: VIS-000130, la de un cliente (127) y una de Tomás Acosta (123), la más vieja
ESTADO = {"VIS-000131": "Por aprobar", "VIS-000130": "Por aprobar", "VIS-000129": "Aprobada", "VIS-000128": "Aprobada", "VIS-000127": "Por aprobar",
          "VIS-000126": "Aprobada", "VIS-000125": "Rechazada", "VIS-000124": "Aprobada", "VIS-000123": "Por aprobar", "VIS-000122": "Recibida", "VIS-000121": "Recibida"}
CLASE = {"Por aprobar": "pend", "Aprobada": "", "Rechazada": "mal", "Recibida": "off", "Anulada": "off", "Corregida": ""}
# n°, recibida, cargó, tipo, canal, cliente, monto, motivo; el estado y el PDF salen de ESTADO
FILAS = [("VIS-000130", HORA_P, QUIEN_P, "", "WhatsApp", "Corralón El Puente", None, "Seguimiento"),
         ("VIS-000129", "15/10/2026 11:47", "Florencia Fernández de la Fuente", "", "WhatsApp", "Obra Centro", "48.000,00", "Venta nueva"),
         ("VIS-000128", "14/10/2026 17:02", "Martín Paz", "", "App", "Distribuidora Norte", "212.000,00", "Venta nueva"),
         ("VIS-000127", "14/10/2026 09:30", "Marta Gil", "cliente", "WhatsApp", "Ferretería Sur", "0,00", "Reclamo"),
         ("VIS-000126", HORA_A, QUIEN_A, "", "WhatsApp", "Ferretería Rosales", "125.500,00", "Venta nueva"),
         ("VIS-000125", HORA_R, "Persona sin información", "sin", "WhatsApp", "Obra Centro", None, "Seguimiento"),
         ("VIS-000124", "13/10/2026 12:20", "Paula Méndez", "", "WhatsApp", "Corralón El Puente", "96.300,00", "Venta nueva"),
         ("VIS-000123", "13/10/2026 11:04", QUIEN_A, "", "WhatsApp", "Ferretería Rosales", "0,00", "Seguimiento"),
         ("VIS-000122", "12/10/2026 17:40", "Martín Paz", "", "WhatsApp", "Distribuidora Norte", "54.200,00", "Venta nueva"),
         ("VIS-000121", "12/10/2026 10:02", "Paula Méndez", "", "WhatsApp", "Obra Centro", "15.750,00", "Seguimiento")]
PROPIA = ("VIS-000131", "15/10/2026 17:10", "Lucía Fernández", "", "App", "Distribuidora Norte", "64.000,00", "Venta nueva")
COLS = [("num", "N°", 112, ""), ("est", "Estado", 116, ""), ("rec", "Recibida", 136, ""), ("quien", "Cargó", 170, ""), ("can", "Canal", 96, ""), ("cli", "Cliente", 160, ""),
        ("mon", "Monto estimado", 128, "r"), ("mot", "Motivo", 116, ""), ("pdf", "PDF", 56, "")]


def con_fotos(valores, fotos=2, doc=True):
    """El orden de la 18: las fotos y el remito van después de «Motivo»; sin fotos, «Sin respuesta»."""
    return valores[:5] + [("Fotos de la visita", A.thumbs(fotos) if fotos else None), ("Remito firmado", A.doc_chip() if doc else None)] + valores[5:]


VAL_P = con_fotos(R.VALORES_130)
VAL_A = con_fotos(R.VALORES_126)
VAL_R = con_fotos([("Cliente", "Obra Centro"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", None), ("Motivo", "Seguimiento"),
                   ("Fallas", R.gris("—")), ("Observaciones", "Revisión del avance de obra.")], 0, False)
VAL_PROPIA = con_fotos([("Cliente", "Distribuidora Norte"), ("Fecha de la visita", "15/10/2026"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "64.000,00"), ("Motivo", "Venta nueva"),
                        ("Fallas", "Ruido"), ("Observaciones", None)], 1, False)

CSS_21 = """.w-est.pend { color: oklch(0.5 0.12 70); }
.w-est.pend::before { background: oklch(0.72 0.15 70); }
.w-est.off { color: var(--t2); }
.w-est.off::before { background: oklch(0.72 0.01 78); }
.rg2-ab .cb, .pd-b .cb, .rg2-av .cb { height: 34px; font-size: 13.5px; }
.cg-q .q-chk, .w-dlg .q-chk, .rg-hb .q-chk, .ap-cuerpo .q-chk { display: inline-flex; align-items: center; gap: 8px; }
.cg-q .q-chk i, .w-dlg .q-chk i, .rg-hb .q-chk i, .ap-cuerpo .q-chk i { width: 16px; height: 16px; flex: none; border-radius: 4px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.cg-q .q-chk i.no, .w-dlg .q-chk i.no, .rg-hb .q-chk i.no, .ap-cuerpo .q-chk i.no { background: #fff; border: 1.5px solid var(--borde2); box-sizing: border-box; }
.cg-q .q-chk i svg, .w-dlg .q-chk i svg, .rg-hb .q-chk i svg, .ap-cuerpo .q-chk i svg { width: 12px; height: 12px; }
.f-mi.off { flex-direction: column; align-items: flex-start; gap: 2px; white-space: normal; }
.pl-pdf { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--borde); background: #fff; color: var(--t2); }
.pl-pdf svg { width: 15px; height: 15px; }
.d2-acc .der { margin-left: auto; }
.ac-it .tx .ln { color: var(--marca-tx); font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.ac-est.gris { color: var(--t2); background: var(--s2); border-color: var(--borde); }
.pdf-cab { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--t2); margin-bottom: 8px; }
.pdf-c .ab-chip { margin-right: 4px; }
.w-dlg.apr { width: 460px; }
.w-dlg.apr .df .cb-sec.foco { box-shadow: 0 0 0 3px oklch(0.5 0.08 180 / 0.25); border-color: var(--marca); }
.w-dlg.pdfv { width: 760px; }
.w-dlg.pdfv .db { background: var(--s2); display: flex; justify-content: center; padding: 20px; }
"""

# ================================================================ La hoja del PDF (59): tres estilos, el color, el encabezado, secciones, firmas
COLORES = [("Petróleo", "oklch(0.47 0.08 195)"), ("Azul", "oklch(0.47 0.12 255)"), ("Verde", "oklch(0.5 0.1 150)"), ("Bordó", "oklch(0.45 0.13 15)"), ("Gris", "oklch(0.42 0.01 260)")]
SECCIONES = [("La visita", [("Cliente", True), ("Fecha de la visita", True)]),
             ("El resultado", [("¿Se concretó la venta?", True), ("Monto estimado", True), ("Motivo", True), ("Fallas", False), ("Observaciones", True)]),
             ("Archivos", [("Fotos de la visita", True), ("Remito firmado", True)])]
VAL_HOJA = dict(R.VALORES_126) | {"Remito firmado": "remito-0810.pdf", "Fallas": "Frío, Ruido"}
FIRMAS = ["Firma del cliente", "Firma del supervisor"]
PIE_PDF = "Gracias por elegirnos."
CSS_HOJA = """.pdf-a4 { --pc: oklch(0.47 0.08 195); width: 100%; max-width: 420px; aspect-ratio: 210 / 297; box-sizing: border-box; background: #fff; box-shadow: 0 2px 10px oklch(0.24 0.014 78 / 0.16); border-radius: 2px;
  display: flex; flex-direction: column; gap: 10px; padding: 24px 26px; font-family: Georgia, 'Times New Roman', serif; font-size: 8.5px; line-height: 1.4; color: #222; overflow: hidden; }
.pdf-hd { display: flex; align-items: center; gap: 10px; padding-bottom: 8px; border-bottom: 1.5px solid var(--pc); }
.pdf-hd .lg { width: 30px; height: 30px; border-radius: 6px; background: var(--pc); color: #fff; font: 700 14px Inter, sans-serif; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.pdf-hd .org { display: flex; flex-direction: column; gap: 1px; }
.pdf-hd .org b { font-size: 11px; }
.pdf-hd .org small { font-size: 7.5px; color: #666; }
.pdf-tt { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.pdf-tt b { font-size: 13px; color: var(--pc); }
.pdf-tt span { font-size: 8px; color: #555; font-variant-numeric: tabular-nums; }
.pdf-sec .st { font-size: 7.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #444; background: #f1f1ef; padding: 3px 6px; }
.pdf-sec .rw { display: grid; grid-template-columns: 42% 58%; gap: 6px; padding: 3px 6px; border-bottom: 0.5px solid #ddd; }
.pdf-sec .rw span:first-child { color: #555; }
.pdf-sec .fts { display: flex; gap: 6px; padding: 5px 6px; }
.pdf-sec .fts i { width: 58px; height: 44px; border-radius: 2px; background: linear-gradient(135deg, oklch(0.84 0.03 170), oklch(0.66 0.05 170)); }
.pdf-ap { font-size: 8px; color: #333; padding: 4px 6px; border-left: 2px solid var(--pc); }
.pdf-fi { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: auto; padding-top: 18px; }
.pdf-fi span { border-top: 0.75px solid #444; padding-top: 3px; font-size: 7.5px; color: #555; text-align: center; }
.pdf-pie { display: flex; justify-content: space-between; font-size: 7px; color: #777; border-top: 0.5px solid #ddd; padding-top: 4px; }
.pdf-a4.moderno { font-family: Inter, Arial, sans-serif; padding: 0 0 22px; gap: 10px; }
.pdf-a4.moderno .pdf-hd { background: var(--pc); color: #fff; padding: 14px 26px; border: 0; }
.pdf-a4.moderno .pdf-hd .lg { background: #fff; color: var(--pc); }
.pdf-a4.moderno .pdf-hd .org small { color: oklch(0.92 0.02 195); }
.pdf-a4.moderno > :not(.pdf-hd) { margin: 0 26px; }
.pdf-a4.moderno .pdf-tt b { font-size: 14px; }
.pdf-a4.moderno .pdf-sec .st { background: none; color: var(--pc); border-left: 2.5px solid var(--pc); padding: 1px 6px; text-transform: none; letter-spacing: 0; font-size: 9px; }
.pdf-a4.moderno .pdf-sec .rw { border: 0; }
.pdf-a4.moderno .pdf-sec .rw:nth-child(even) { background: #f6f7f7; }
.pdf-a4.compacto { font-family: Inter, Arial, sans-serif; font-size: 7.5px; padding: 18px 20px; gap: 7px; }
.pdf-a4.compacto .pdf-hd { padding-bottom: 5px; }
.pdf-a4.compacto .pdf-hd .lg { width: 20px; height: 20px; font-size: 10px; border-radius: 4px; }
.pdf-a4.compacto .pdf-tt b { font-size: 10.5px; }
.pdf-a4.compacto .pdf-sec { display: grid; grid-template-columns: 1fr 1fr; column-gap: 10px; }
.pdf-a4.compacto .pdf-sec .st { grid-column: 1 / -1; background: none; padding: 2px 0; border-bottom: 0.75px solid var(--pc); color: var(--pc); }
.pdf-a4.compacto .pdf-sec .rw { grid-template-columns: 1fr; gap: 0; padding: 3px 0; border: 0; }
.pdf-a4.compacto .pdf-sec .rw span:first-child { font-size: 6.5px; text-transform: uppercase; letter-spacing: 0.04em; }
.pdf-a4.compacto .pdf-sec .fts { grid-column: 1 / -1; padding: 3px 0; }
.pdf-a4.compacto .pdf-sec .fts i { width: 44px; height: 33px; }
.pdf-a4.sin-logo .pdf-hd .lg { display: none; }
"""


def hoja(estilo="clasico", logo=True, fotos=True, color=None, num=NUM_A, hora=HORA_A, aprobo="Aprobada por Lucía Fernández el 13/10/2026 16:05", pie=PIE_PDF):
    org = ('<span class="org"><b>Grupo Delta</b><small>Av. Corrientes 1234, CABA · ventas@delta.ejemplo.com · 011 4321-0000</small></span>' if logo
           else '<span class="org"><b>Grupo Delta</b></span>')
    secs = ""
    for titulo, preguntas in SECCIONES:
        filas = ""
        for p, ver in preguntas:
            if not ver:
                continue
            if p == "Fotos de la visita":
                filas += ('<div class="fts"><i></i><i></i></div>' if fotos else f'<div class="rw"><span>{p}</span><span>2 fotos</span></div>')
            else:
                v = VAL_HOJA.get(p)
                filas += f'<div class="rw"><span>{p}</span><span>{v if v else "Sin respuesta"}</span></div>'
        secs += f'<div class="pdf-sec"><div class="st">{titulo}</div>{filas}</div>'
    estilo_css = f' style="--pc: {color};"' if color else ""
    firmas = "".join(f"<span>{f}</span>" for f in FIRMAS)
    return (f'<div class="pdf-a4 {estilo}{"" if logo else " sin-logo"}"{estilo_css} role="img" aria-label="Vista previa del PDF">'
            f'<div class="pdf-hd"><span class="lg">D</span>{org}</div><div class="pdf-tt"><b>Comprobante de visita</b><span>{num} · {hora}</span></div>{secs}'
            f'<div class="pdf-ap">{aprobo}</div><div class="pdf-fi">{firmas}</div><div class="pdf-pie"><span>{pie}</span><span>Página 1 de 1</span></div></div>')


# ================================================================ Las pestañas de la 21: suma «Reglas» (79)
def tabs(sel, tel=False):
    m = "M-" if tel else ""
    items = [("respuestas", "Respuestas", ' <span class="c">24</span>', f"{m}FRM-Respuestas-21.dc.html"), ("tablero", "Tablero", "", f"{m}FRM-Tablero-21.dc.html"),
             ("diseno", "Diseño", "", f"{m}FRM-Editor-21.dc.html"), ("reglas", "Reglas", "", "M-FRM-Reglas.dc.html" if tel else "FRM-Editor-Reglas.dc.html")]
    a = "".join(f'<a class="{"on" if k == sel else ""}" role="tab" aria-selected="{"true" if k == sel else "false"}" href="{h}">{t}{c}</a>' for k, t, c, h in items)
    return f'<div class="{"f-ptabs" if tel else "f-tabs"}" role="tablist" aria-label="Vistas del formulario">{a}</div>'


def con_tabs(t, sel):
    t = t.replace('<div class="w-body">', '<div class="w-body">' + tabs(sel))
    return L.con_css(t, "pestanas", L.CSS_PESTANAS)


def con_tabs_tel(t, sel):
    t = re.sub(r'(<div class="ap-bar int">(?:(?!</h1>).)*?<h1>' + FORM + r'</h1>.*?</div>(?:(?!<div).)*?</div>)', lambda m: m.group(1) + tabs(sel, True), t, flags=re.S)
    return L.con_css(t, "ptabs", L.CSS_PTABS + ".f-ptabs { grid-template-columns: repeat(4, 1fr); }\n.f-ptabs a { font-size: 14px; }\n")


# ================================================================ La planilla con «Estado» (la usa también la segunda parte)
def celda(k, r, destino="FRM-Respuesta-Aprobacion.dc.html", estado=None):
    n, rec, quien, tipo, can, cli, mon, mot = r
    if k == "num":
        return f'<span><a class="pl-num" href="{destino}">{n}</a></span>'
    if k == "est":
        e = estado or ESTADO[n]
        return f'<span><span class="w-est {CLASE[e]}">{e}</span></span>'
    if k == "quien":
        return R.quien(quien, tipo)
    if k == "pdf":
        e = estado or ESTADO[n]
        return (f'<span><button type="button" class="pl-pdf" aria-label="Ver el PDF de {n}" title="Ver el PDF de {n}">{A.DOC}</button></span>' if e == "Aprobada" else "<span></span>")
    v = {"rec": rec, "can": can, "cli": cli, "mon": mon, "mot": mot}[k]
    return f'<span{" class=" + chr(34) + "r" + chr(34) if k == "mon" else ""}>{R.valor(v)}</span>'


def tabla(filas=None, cols=COLS, sel=None, pie="1–10 de 24", pag="Página 1 de 3", destino="FRM-Respuesta-Aprobacion.dc.html", estados=None):
    filas = FILAS if filas is None else filas
    estados = estados or {}
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(celda(k, r, destino, estados.get(r[0])) for k, *_ in cols) + "</div>" for r in filas)
    return (f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(cols)};"><div class="pl-scroll">{R.cabecera(cols)}{h}</div>'
            f'<div class="w-pie"><span>{pie}</span><span>10 por página · {pag}</span></div></div>')


ESTADOS_MENU = [("Todos los estados", "24"), ("Recibida", "4"), ("Por aprobar", "3"), ("Aprobada", "15"), ("Rechazada", "2"), ("Anulada", "1")]


def barra(estado="normal"):
    """La barra de la 20 con «Estado» entre los filtros rápidos; el menú cuenta las vigentes, y «Anulada» va aparte (92)."""
    t = W.barra()
    menu = ""
    if estado == "menu":
        menu = ('<span class="f-mn" role="listbox" aria-label="Filtrar por estado">' + "".join(f'<span role="option" class="{"on" if i == 0 else ""}">{n}<span class="cnt">{c}</span></span>'
                                                                                              for i, (n, c) in enumerate(ESTADOS_MENU)) + "</span>")
    p = W.pil(f"Estado: {estado}", True) if estado not in ("normal", "menu") else W.pil("Estado", menu=menu)
    marca = '<span class="f-env"><span class="w-pil" role="button" aria-haspopup="listbox">Recibida'
    t = t.replace(marca, p + marca, 1)
    if estado not in ("normal", "menu"):
        t = t.replace('<span class="pl-der">', '<button type="button" class="cb cb-enl">Limpiar filtros</button><span class="pl-der">', 1)
    return t


def fondo(filas=None, estado="normal", **k):
    return R.CUERPO.format(barra(estado) + tabla(filas, **k))


EXPORTAR = '<a class="cb cb-sec" href="FRM-Respuestas-Anular.dc.html">Exportar a Excel</a>'
AGREGAR = EXPORTAR + '<a class="cb cb-pri" href="FRM-Cargar-Respuesta-21.dc.html">Agregar respuesta</a>'


def banda_p(ac=AGREGAR):
    return R.banda(FORM, "Respuestas · versión 4 publicada", ac).replace('href="FRM-Formularios.dc.html"', 'href="FRM-Formularios-21.dc.html"')


CSS_PL = W.CSS_PL + W.CSS_20 + A.CSS_ARCH + G.CSS_D2A + CSS_21 + CSS_HOJA


def planilla(estados, bnd, cu, capas, titulo):
    t = R.pagina(titulo, A.con_estados([(e, bnd[e]) for e in estados]), A.con_estados([(e, cu[e]) for e in estados]), estados, css=CSS_PL)
    if capas:
        k = t.rindex("</div>\n</x-dc>")
        t = t[:k] + A.con_estados([(e, capas.get(e, "")) for e in estados]) + t[k:]
    return t


# ================================================================ La vista rápida con los momentos (AB: TEST-000002 con «Por aprobar»)
def mom(clase, icono, titulo, hora, linea="", acc="", extra=""):
    l = f"<small>{linea}</small>" if linea else ""
    return (f'<div class="d2-mom{" " + extra if extra else ""}"><span class="ck{" " + clase if clase else ""}">{icono}</span>'
            f'<span class="t"><span><b>{titulo}</b><span class="h">{hora}</span></span>{l}{acc}</span></div>')


def recibida(quien, hora, canal="WhatsApp"):
    linea = f"{PERSONA} En la app, la cargó {quien}" if canal == "App" else f"{PERSONA} La respondió {quien} por WhatsApp · se la mandó Lucía Fernández"
    return mom("", CHECK, "Recibida", hora, linea)


def botones(apagado=""):
    if apagado:
        return (f'<span class="acc"><span class="e-tipw"><button type="button" class="cb cb-sec" disabled>Rechazar</button></span>'
                f'<span class="e-tipw"><button type="button" class="cb cb-pri" disabled>{APROBAR} Aprobar</button><span class="e-tip" role="tooltip">{apagado}</span></span></span>')
    return f'<span class="acc"><button type="button" class="cb cb-sec">Rechazar</button><button type="button" class="cb cb-pri">{APROBAR} Aprobar</button></span>'


def moms(estado, quien=QUIEN_P, hora=HORA_P, canal="WhatsApp", hace="hace 2 horas", apagado="", decidio="Lucía Fernández", cuando=DEC_A, motivo="", al_aprobar="3 de 3 hechas"):
    m = recibida(quien, hora, canal) + mom("", CHECK, "Al recibirla", "2 de 2 hechas")
    if estado == "pend":
        return m + mom("esp", RELOJ, "Por aprobar", hace, f"Lo aprueba alguien con el rol {SUP}", botones(apagado), "esp")
    if estado == "ok":
        aprobar = (mom("esp", RELOJ, "Al aprobarla", "en curso") if al_aprobar == "curso" else mom("", CHECK, "Al aprobarla", al_aprobar))
        return m + mom("", CHECK, "Aprobada", cuando, f"{decidio} · rol {SUP}") + aprobar
    return m + mom("no", CERRAR, "Rechazada", cuando, f'{decidio} · <span class="mot">{motivo}</span>') + mom("", CHECK, "Al rechazarla", "1 de 1 hecha")


CHIP = {"Por aprobar": '<span class="w-est pend">Por aprobar</span>', "Aprobada": '<span class="w-est">Aprobada</span>', "Rechazada": '<span class="w-est mal">Rechazada</span>'}


def vista(num, chip, momentos, valores, tab="Respuesta", cuerpo=None, fotos=2, pdf=False, pos="1 de 10", aviso="", primera=True):
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)"{" disabled" if primera else ""}>{SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{BAJA}</button>')
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{CERRAR}</button>'
    desc = f'<span class="der"><button type="button" class="cb cb-sec">{DESCARGAR} Descargar {CHEV}</button></span>' if pdf else ""
    acc = (f'<div class="d2-acc"><a class="cb cb-sec" href="FRM-Respuesta-Corregir.dc.html">Abrir en pantalla completa</a><a class="d2-ln" href="WA-Chats-Avisos.dc.html">Abrir conversación</a>{desc}</div>'
           f'<div class="d2-sub"><span>{FORM} · versión 4</span></div>')
    av = f'<div class="d2-aviso" role="status">{F.ALERTA}<span>{aviso}</span></div>' if aviso else ""
    ts = ["Respuesta"] + ([f'Fotos <span class="c">{fotos}</span>'] if fotos else []) + ["Actividad"] + (["PDF"] if pdf else [])
    pest = '<div class="o-tabs" role="tablist">' + "".join(f'<span role="tab" class="{"on" if x.split(" ")[0] == tab else ""}">{x}</span>' for x in ts) + "</div>"
    c = cuerpo if cuerpo is not None else F.grilla(valores)
    return (f'<aside class="d2" role="region" aria-label="Detalle de la respuesta"><div class="d2-h"><b>{num}</b>{chip}{nav}{cerrar}</div>{acc}{av}'
            f'<div class="d2-moms">{momentos}</div>{pest}<div class="d2-b">{c}</div><div class="d2-pie">{pos}</div></aside>')


def ac_it(h, texto, est, clase, extra=""):
    return f'<div class="ac-it"><span class="h">{h}</span><span class="tx"><span>{texto}</span>{extra}</span><span class="ac-est {clase}">{est}</span></div>'


def actividad(modo="normal"):
    """Lo que hizo cada regla, con su estado (80: sin «Sin confirmar»: la cola de WhatsApp reintenta sola)."""
    rec = (f'<div class="ac-mo">{CHECK} Recibida <small>13/10/2026</small></div>'
           + ac_it("11:20", "Lucía Fernández le mandó el formulario desde el chat.", "Hecho", "ok", '<a class="ln" href="WA-Chats-Avisos.dc.html">Abrir conversación</a>')
           + ac_it("15:30", "Tomás Acosta lo respondió. Se guardó como VIS-000126.", "Hecho", "ok"))
    al_rec = (f'<div class="ac-mo">{CHECK} Al recibirla <small>2 de 2 hechas</small></div>'
              + ac_it("15:30", "Se le mandó a Tomás Acosta: «Recibimos VIS-000126. Te avisamos cuando la aprueben.»", "Leído", "ok")
              + ac_it("15:30", f"Se pidió aprobación a alguien con el rol {SUP}.", "Hecho", "ok"))
    apr = f'<div class="ac-mo">{CHECK} Aprobada <small>Lucía Fernández · esperó 35 minutos</small></div>'
    if modo == "no_se_pudo":
        envio = ac_it("16:05", "No se le pudo mandar el PDF a Tomás Acosta: pasaron 24 horas desde su último mensaje y la regla no tiene una plantilla aprobada.", "No se pudo", "mal",
                      '<small>Sin plantilla aprobada. El PDF quedó guardado.</small><button type="button" class="cb cb-sec">Reintentar</button>')
        hechas = "2 de 3 hechas"
    else:
        envio = ac_it("16:05", "Se le mandó el PDF a Tomás Acosta: «Aprobaron VIS-000126. Te mandamos el comprobante.»", "Entregado", "ok")
        hechas = "3 de 3 hechas"
    al_apr = (f'<div class="ac-mo">{CHECK if modo != "no_se_pudo" else F.ALERTA} Al aprobarla <small>{hechas}</small></div>'
              + ac_it("16:05", "Se armó el PDF «Comprobante de visita».", "Hecho", "ok", f'<a class="ln" href="#">{DESCARGAR} {PDF_A}</a>')
              + envio + ac_it("16:05", f"Se mandó por correo a {DIRECCION}, con el PDF.", "Hecho", "ok")
              + ac_it("16:05", "Se avisó a las personas con el rol Dueño.", "Hecho", "ok"))
    return f'<div class="ac-g"><div class="ac-cab"><span>Actividad</span><span>Reglas de la revisión 3</span></div>{rec}{al_rec}{apr}{al_apr}</div>'


def pestana_pdf():
    return (f'<div class="pdf-cab">PDF de la respuesta{info("Es una copia fija: no cambia aunque cambien las reglas, los catálogos o el diseño.")}</div>'
            f'<div class="pdf-c"><span class="pdf">PDF</span><span class="t">{PDF_A}<small>{DEC_A} · 1 página</small></span><span class="ab-chip">Español</span>'
            f'<a class="cb cb-sec" href="#">Ver PDF</a><button type="button" class="cb cb-sec">{DESCARGAR} Descargar</button></div>')


def dlg_aprobar(num=NUM_P, quien=QUIEN_P, hora=HORA_P, trabajando=False, solo=False):
    texto = hora if solo else f"{quien} · {hora}"
    cancelar = f'<button type="button" class="cb cb-sec{"" if trabajando else " foco"}"{" disabled" if trabajando else ""}>Cancelar</button>'
    aprobar = E.trabaja("Aprobando…") if trabajando else '<button type="button" class="cb cb-pri">Aprobar</button>'
    t = F.dialogo(f"¿Aprobar {num}?", f'<p class="d-tx">{texto}</p>', cancelar + aprobar)
    return t.replace('class="w-dlg"', 'class="w-dlg apr"', 1)


def dlg_rechazar(num=NUM_P):
    cuerpo = ('<div class="w-cmp"><span class="rt">Motivo <span class="req">*</span></span><div class="ct area">Falta la firma del cliente en el remito.</div></div>'
              '<span class="cont">39 / 500</span>')
    t = F.dialogo(f"Rechazar {num}", cuerpo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Rechazar</button>')
    t = t.replace('class="w-dlg"', 'class="w-dlg rch"', 1)
    return t.replace(f"<span>Rechazar {num}</span>", f'<span class="rg-tit">Rechazar {num} {info("El motivo queda en la respuesta y, si una regla lo pide, se le manda a quien la cargó.")}</span>', 1)


def dlg_copia():
    t = F.dialogo(f"Copia fija · {PDF_A}", hoja(), f'<button type="button" class="cb cb-sec">{DESCARGAR} Descargar</button><button type="button" class="cb cb-sec">Cerrar</button>')
    return t.replace('class="w-dlg"', 'class="w-dlg pdfv"', 1)


def sobre(capa):
    return capa.replace('class="w-oscuro"', 'class="w-oscuro" style="z-index: 8;"', 1)


E_AP = ["Por aprobar", "¿Aprobar?", "Aprobando", "Aprobada", "Rechazar", "Rechazada", "La cargaste vos", "Otra persona decidió", "Actividad", "Actividad: no se pudo", "PDF", "Copia fija"]


def aprobacion():
    pend = lambda **k: vista(NUM_P, CHIP["Por aprobar"], moms("pend", **k), VAL_P)
    ok_a = dict(quien=QUIEN_A, hora=HORA_A, cuando=DEC_A)
    aprobada_a = lambda tab, cuerpo: vista(NUM_A, CHIP["Aprobada"], moms("ok", **ok_a), VAL_A, tab, cuerpo, pdf=True, pos="5 de 10", primera=False)
    paneles = {
        "Por aprobar": pend(), "¿Aprobar?": pend(), "Aprobando": pend(), "Rechazar": pend(),
        "Aprobada": vista(NUM_P, CHIP["Aprobada"], moms("ok", cuando="hace un momento", al_aprobar="curso"), VAL_P, pdf=False),
        "Rechazada": vista(NUM_R, CHIP["Rechazada"], moms("no", quien="Persona sin información", hora=HORA_R, cuando=DEC_R, motivo=MOTIVO_R), VAL_R, fotos=0, pos="6 de 10", primera=False),
        "La cargaste vos": vista("VIS-000131", CHIP["Por aprobar"], moms("pend", quien="Lucía Fernández", hora=PROPIA[1], canal="App", hace="hace 10 minutos",
                                                                          apagado="Otra persona con el rol Supervisor tiene que aprobarla: la cargaste vos."), VAL_PROPIA, fotos=1, pos="1 de 10"),
        "Otra persona decidió": vista(NUM_P, CHIP["Aprobada"], moms("ok", decidio="Martín Paz", cuando="hace un momento", al_aprobar="curso"), VAL_P,
                                      aviso="Martín Paz la aprobó mientras la mirabas. Se muestra su decisión."),
        "Actividad": aprobada_a("Actividad", actividad()), "Actividad: no se pudo": aprobada_a("Actividad", actividad("no_se_pudo")),
        "PDF": aprobada_a("PDF", pestana_pdf()), "Copia fija": aprobada_a("PDF", pestana_pdf()),
    }
    capas = {"¿Aprobar?": sobre(dlg_aprobar()), "Aprobando": sobre(dlg_aprobar(trabajando=True)), "Rechazar": sobre(dlg_rechazar()), "Copia fija": sobre(dlg_copia()),
             "Aprobada": A.toast("Respuesta aprobada.")}
    sel = {"Rechazada": NUM_R, "La cargaste vos": "VIS-000131", "Actividad": NUM_A, "Actividad: no se pudo": NUM_A, "PDF": NUM_A, "Copia fija": NUM_A}
    estados_fila = {"Aprobada": {NUM_P: "Aprobada"}, "Otra persona decidió": {NUM_P: "Aprobada"}}
    cu = {}
    for e in E_AP:
        filas = [PROPIA] + FILAS[:9] if e == "La cargaste vos" else FILAS
        pie = "1–10 de 25" if e == "La cargaste vos" else "1–10 de 24"
        cu[e] = fondo(filas, sel=sel.get(e, NUM_P), pie=pie, estados={**({"VIS-000131": "Por aprobar"} if e == "La cargaste vos" else {}), **estados_fila.get(e, {})})
    caps = {e: paneles[e] + capas.get(e, "") for e in E_AP}
    return planilla(E_AP, {e: banda_p() for e in E_AP}, cu, caps, "Una respuesta con aprobación · /org/formularios/:id/respuestas?respuesta=VIS-000130")


# ================================================================ FRM-Editor-Reglas: la pestaña «Reglas» (79, 113 y la de AB)
AY_REGLAS = "Se guardan aparte del diseño y valen sin publicar. Cada respuesta usa las reglas vigentes cuando llegó."
AY_MSJ = "Usá {número}, {motivo} y el nombre de una pregunta entre llaves, como {Cliente}."
AY_SI = "Hasta 10 condiciones, y se tienen que cumplir todas."
AY_PLANTILLA = "Pasadas 24 horas desde su último mensaje, WhatsApp solo deja mandar una plantilla aprobada."
AY_ROL = "Decide alguien con este rol que no la haya cargado ni corregido."
AY_HIST = "Cada guardado es una revisión. Las respuestas recuerdan con cuál llegaron."
MENSAJE_REC = "Recibimos {número}. Te avisamos cuando la aprueben."
MENSAJE_APR = "Aprobaron {número}. Te mandamos el comprobante."
MENSAJE_DUENO = "Se aprobó {número}, de {Cliente}, por {Monto estimado}."
MENSAJE_RCH = "Rechazaron {número}: {motivo}"
VER_DISENO = '<a class="lnk" href="FRM-Pdf.dc.html">Ver el diseño</a>'
CON_PDF = ' <span class="ad">· con el PDF</span>'
REGLAS = [
    (1, "se recibe una respuesta", None, [f"Mandarle un mensaje a quien la cargó: «{MENSAJE_REC}»", f"Pedir aprobación a alguien con el rol <b>{SUP}</b>"]),
    (2, "se aprueba una respuesta", None, [f"Armar el PDF «Comprobante de visita» · {VER_DISENO}", f"Mandarle un mensaje a quien la cargó: «{MENSAJE_APR}»{CON_PDF}",
                                          f"Mandar por correo a {DIRECCION}: «Se aprobó {{número}}.»{CON_PDF}"]),
    (3, "se aprueba una respuesta", "Monto estimado es mayor o igual a 100.000", [f"Avisar a las personas con el rol <b>Dueño</b>: «{MENSAJE_DUENO}»"]),
    (4, "se rechaza una respuesta", None, [f"Mandarle un mensaje a quien la cargó: «{MENSAJE_RCH}»"]),
]
HIST = [("Revisión 3", "15/10/2026 10:12 · Lucía Fernández", "1 regla cambiada", True), ("Revisión 2", "10/10/2026 16:40 · Lucía Fernández", "1 regla agregada", False),
        ("Revisión 1", "02/10/2026 11:05 · Lucía Fernández", "3 reglas agregadas", False)]
TIPOS = ["Pedir aprobación a un rol", "Armar el PDF", "Mandarle un mensaje a quien la cargó", "Avisar a un rol", "Avisar a una persona", "Mandar por correo", "Mandar el PDF a un cliente"]
CSS_RG = """.rg2-cols { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
.rg2 .f-cab .tt, .rg2-hi .f-cab .tt { display: inline-flex; align-items: center; gap: 6px; }
.rg2-r { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--borde); align-items: start; }
.rg2 .f-cab + .rg2-r, .rg2 .f-cab + .rg2-ab { border-top: 0; }
.rg2-r .n, .rg2-ab .cab .n { font-size: 13px; font-weight: 600; color: var(--t3); padding-top: 3px; font-variant-numeric: tabular-nums; }
.rg2-r .tx { display: flex; flex-direction: column; gap: 8px; font-size: 14px; line-height: 1.45; min-width: 0; }
.rg2-r .l { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: 8px; align-items: start; }
.rg2-r .l .ab-chip { justify-content: center; }
.rg2-r ol { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
.rg2-r .ac, .rg2-ab .cab .ac { display: inline-flex; gap: 2px; }
.rg2 .lnk { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.rg2 .ad { color: var(--t3); }
.rg2-ab { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-top: 1px solid var(--borde); background: oklch(0.985 0.006 78); }
.rg2-ab .cab { display: flex; align-items: center; justify-content: space-between; }
.rg2-ab .w-cmp .rt { display: inline-flex; align-items: center; gap: 4px; }
.rg2-ab .ct.sel { display: flex; align-items: center; justify-content: space-between; }
.rg2-ab .w-cmp > .e-tipw { display: flex; width: 100%; }
.rg2-ab .w-cmp > .e-tipw > .ct { flex: 1; }
.rg2-ab .w-cmp > .e-tipw > .e-tip { left: 0; right: auto; top: calc(100% + 6px); }
.rg2-ab .w-cmp > .e-tipw > .e-tip::before { left: 18px; right: auto; }
.rg2-ab .ct.sel.des { opacity: 0.6; }
.rg2-ab .ct.area { height: auto; min-height: 60px; white-space: normal; line-height: 1.45; padding-top: 8px; }
.rg2-si { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.rg2-hz { display: flex; flex-direction: column; gap: 10px; }
.rg2-hz > .rt { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.rg2-a { position: relative; display: flex; flex-direction: column; gap: 12px; padding: 12px 14px; border: 1px solid var(--borde); border-radius: 10px; background: #fff; }
.rg2-a .h { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: end; }
.rg2-a .h .q-acc2 { padding-bottom: 3px; }
.rg2-a.min { padding: 8px 12px; }
.rg2-a.min .h { grid-template-columns: 22px minmax(0, 1fr) auto; align-items: center; }
.rg2-a.min .k { font-size: 13px; font-weight: 600; color: var(--t3); font-variant-numeric: tabular-nums; }
.rg2-a.min .ct.sel { height: 34px; }
.rg2-a .dos { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
.rg2-adj { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; margin: -4px -6px; border-radius: 8px; }
.rg2-adj.mal { background: oklch(0.975 0.02 25); }
.rg2-adj .mot { font-size: 13px; color: var(--peligro); }
.rg2-adj .cb { align-self: flex-start; height: 30px; font-size: 13px; }
.rg2-adj .q-chk.des { opacity: 0.55; }
.rg2-adj .e-tipw { align-self: flex-start; }
.rg2-adj .e-tip { left: 0; right: auto; top: calc(100% + 6px); }
.rg2-adj .e-tip::before { left: 18px; right: auto; }
.rg2-av { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-radius: 8px; background: oklch(0.975 0.02 25); }
.rg2-av .mot { font-size: 13px; color: var(--peligro); }
.rg2-av .cb { align-self: flex-start; height: 30px; font-size: 13px; }
.rg2-vars { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 8px 10px; align-items: center; padding: 10px; border: 1px solid var(--borde); border-radius: 8px; background: oklch(0.985 0.006 78); }
.rg2-vars .k { font: 600 12.5px 'JetBrains Mono', monospace; color: var(--t2); }
.rg2-vars .pv { grid-column: 1 / -1; font-size: 13px; color: var(--t2); }
.rg2-menu { position: absolute; z-index: 30; left: 14px; right: 120px; top: 64px; display: flex; flex-direction: column; padding: 4px; background: #fff; border: 1px solid var(--borde2); border-radius: 10px; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); }
.rg2-menu span { display: flex; flex-direction: column; gap: 1px; padding: 7px 10px; border-radius: 6px; font-size: 14px; color: var(--t1); }
.rg2-menu span.on { background: var(--s2); font-weight: 600; }
.rg2-menu span.off { color: var(--t3); }
.rg2-menu small { font-size: 12.5px; color: var(--t3); font-weight: 400; }
.rg2-pie { display: flex; justify-content: flex-end; }
.rg2 .vac, .rg2-hi .vac { padding: 16px; font-size: 14px; color: var(--t3); }
.rg2-hi .it { display: flex; flex-direction: column; gap: 2px; padding: 10px 16px; border-top: 1px solid var(--borde); font-size: 13.5px; text-decoration: none; color: var(--t1); }
.rg2-hi .f-cab + .it { border-top: 0; }
.rg2-hi .it b { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
.rg2-hi .it small { font-size: 12.5px; color: var(--t3); }
.rg2-hi .it.nueva { background: var(--marca-t); }
.w-dlg.rev { width: 560px; }
.w-dlg.rev .rv { display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 1.45; }
.w-dlg.rev ol { margin: 0; padding-left: 18px; }
"""


def resumen(n, cuando, si, acciones):
    s = f'<div class="l"><span class="ab-chip">Si</span><span>{si}</span></div>' if si else ""
    ac = (f'<span class="ac"><button type="button" class="ib" aria-label="Editar la regla {n}">{LAPIZ}</button>'
          f'<button type="button" class="ib" aria-label="Quitar la regla {n}">{QUITAR}</button></span>')
    return (f'<div class="rg2-r"><span class="n">{n}</span><div class="tx"><div class="l"><span class="ab-chip">Cuando</span><span>{cuando}</span></div>{s}'
            f'<div class="l"><span class="ab-chip">Hacer</span><ol>{"".join(f"<li>{a}</li>" for a in acciones)}</ol></div></div>{ac}</div>')


def sel_(rot, valor, ayuda="", apagado=None, menu=""):
    r = f'<span class="rt">{rot}{info(ayuda) if ayuda else ""}</span>'
    c = f'<div class="ct sel{" des" if apagado else ""}"><span class="v">{valor}</span>{CHEV}</div>'
    if apagado:
        c = f'<span class="e-tipw">{c}<span class="e-tip" role="tooltip">{apagado}</span></span>'
    return f'<div class="w-cmp">{r}{c}{menu}</div>'


def area_(rot, texto, ayuda=AY_MSJ):
    return f'<div class="w-cmp"><span class="rt">{rot}{info(ayuda) if ayuda else ""}</span><div class="ct area">{texto}</div></div>'


def adjuntar(marcado=True, motivo="", arreglo="", apagado="", tip_abierto=False):
    """113: la casilla nunca se desmarca sola; el motivo va debajo en el momento, con el botón que lo arregla."""
    caja = f'<i>{TILDE}</i>' if marcado else '<i class="no"></i>'
    chk = f'<span class="q-chk{" des" if apagado else ""}">{caja}Adjuntar el PDF</span>'
    if apagado:
        chk = f'<span class="e-tipw">{chk}<span class="e-tip" role="tooltip"{"" if tip_abierto else " hidden"}>{apagado}</span></span>'
    m = f'<span class="mot" role="alert">{motivo}</span>' if motivo else ""
    return f'<div class="rg2-adj{" mal" if motivo else ""}">{chk}{m}{arreglo}</div>'


def plantilla24(abierta=False, doc=False):
    nombre = "Comprobante · con documento" if doc else "Aviso de formulario"
    s = sel_("Fuera de las 24 horas, con la plantilla", nombre, AY_PLANTILLA)
    if not abierta:
        return s
    # Las variables de WhatsApp van con entidades: «{{1}}» es una variable para el motor de los tableros
    v1, v2 = "&#123;&#123;1&#125;&#125;", "&#123;&#123;2&#125;&#125;"
    pv = (f"Tenés novedades de {v1}, de {v2}. Escribinos si necesitás algo." if not doc else f"Te mandamos el comprobante de {v1}, de {v2}.")
    return (s + f'<div class="rg2-vars"><span class="k">{v1}</span><div class="ct sel"><span class="v">Número de la respuesta</span>' + CHEV + '</div>'
            f'<span class="k">{v2}</span><div class="ct sel"><span class="v">Nombre del formulario</span>' + CHEV + f'</div><span class="pv">{pv}</span></div>')


def accion(k, tipo, cuerpo="", primera=False, ultima=False, menu="", extra="", plegada=False):
    """Una acción, con su tipo y ↑ ↓ 🗑 a la vista; plegada, solo su renglón (para mostrar las diez)."""
    if plegada:
        return (f'<div class="rg2-a min"><div class="h"><span class="k">{k}</span><div class="ct sel"><span class="v">{tipo}</span>{CHEV}</div>'
                f'{E.acciones_q(f"la acción {k}", primera, ultima, editar=False)}</div></div>')
    h = (f'<div class="h">{sel_(f"Acción {k}", tipo, menu=menu)}{E.acciones_q(f"la acción {k}", primera, ultima, editar=False)}</div>')
    return f'<div class="rg2-a">{h}{cuerpo}</div>{extra}'


def a_pdf(k, **kw):
    return accion(k, "Armar el PDF", f'<span>«Comprobante de visita» · {VER_DISENO}</span>', **kw)


def a_msj(k, texto=MENSAJE_APR, adj=None, p24=None, **kw):
    return accion(k, "Mandarle un mensaje a quien la cargó", area_("Mensaje", texto) + (adj if adj is not None else adjuntar()) + (p24 if p24 is not None else plantilla24(doc=True)), **kw)


def a_correo(k, adj=None, **kw):
    cuerpo = ('<div class="dos">' + sel_("A quién", "Una dirección fija") + f'<div class="w-cmp"><span class="rt">Dirección</span><div class="ct">{DIRECCION}</div></div></div>'
              + area_("Mensaje", "Se aprobó {número}.") + (adj if adj is not None else adjuntar()))
    return accion(k, "Mandar por correo", cuerpo, **kw)


def a_rol(k, rol="Dueño", adj=None, texto=MENSAJE_DUENO, **kw):
    return accion(k, "Avisar a un rol", sel_("Rol", rol) + area_("Mensaje", texto) + (adj if adj is not None else adjuntar(False)) + plantilla24(), **kw)


def a_persona(k, **kw):
    cuerpo = (sel_("Persona", "Martín Paz", "Tiene que estar activa en la organización cuando corra la regla.") + area_("Mensaje", "Se aprobó {número}: pasá a retirar el pedido.")
              + adjuntar(False) + plantilla24())
    return accion(k, "Avisar a una persona", cuerpo, **kw)


def a_cliente(k, extra="", **kw):
    contacto = sel_("Contacto", "Elegí la pregunta", "Va al chat del contacto elegido en esa pregunta.",
                    apagado=f"Ninguna pregunta de {FORM} elige de un catálogo «De los contactos».")
    cuerpo = contacto + area_("Mensaje", "Te mandamos el comprobante de {número}.") + '<span class="ad">Siempre va con el PDF.</span>' + plantilla24(doc=True)
    return accion(k, "Mandar el PDF a un cliente", cuerpo, extra=extra, **kw)


def a_aprobar(k, **kw):
    return accion(k, "Pedir aprobación a un rol", sel_("Rol", SUP, AY_ROL), **kw)


def regla_abierta(n, cuando, acciones, si="", agregar=True, agregar_tip=""):
    cab = (f'<div class="cab"><span class="n">{n}</span><span class="ac"><button type="button" class="ib" aria-label="Editar la regla {n}" aria-pressed="true">{LAPIZ}</button>'
           f'<button type="button" class="ib" aria-label="Quitar la regla {n}">{QUITAR}</button></span></div>')
    si_html = si or f'<button type="button" class="cb cb-sec">{MAS} Agregar condición</button>'
    if agregar:
        boton = f'<button type="button" class="cb cb-sec">{MAS} Agregar acción</button>'
    else:
        boton = f'<button type="button" class="cb cb-sec" disabled title="{agregar_tip}">{MAS} Agregar acción</button>'
    return (f'<div class="rg2-ab">{cab}{sel_("Cuándo", cuando)}<div class="w-cmp"><span class="rt">Si (opcional){info(AY_SI)}</span><div class="rg2-si">{si_html}</div></div>'
            f'<div class="rg2-hz"><span class="rt">Hacer, en este orden</span>{acciones}<span>{boton}</span></div><div class="rg2-pie"><button type="button" class="cb cb-sec">Listo</button></div></div>')


def caja_reglas(abierta=None, n_abierta=2, guardar="limpio", vacia=False):
    if guardar == "guardando":
        g = E.trabaja("Guardando…")
    elif guardar == "limpio":
        g = '<span class="e-tipw"><button type="button" class="cb cb-pri" disabled>Guardar reglas</button><span class="e-tip" role="tooltip" hidden>No hay cambios para guardar.</span></span>'
    else:
        g = '<button type="button" class="cb cb-pri">Guardar reglas</button>'
    cab = (f'<div class="f-cab"><span class="tt">Cuando llega una respuesta{info(AY_REGLAS)}</span><span class="der">'
           f'<button type="button" class="cb cb-sec">{MAS} Agregar regla</button>{g}</span></div>')
    if vacia:
        return f'<div class="w-caja rg2">{cab}<div class="vac">Todavía no hay reglas.</div></div>'
    filas = "".join(abierta if (abierta and n == n_abierta) else resumen(n, c, s, a) for n, c, s, a in REGLAS)
    return f'<div class="w-caja rg2">{cab}{filas}</div>'


def caja_historial(nueva=False, vacia=False):
    cab = f'<div class="f-cab"><span class="tt">Historial de las reglas{info(AY_HIST)}</span></div>'
    if vacia:
        return f'<div class="w-caja rg2-hi">{cab}<div class="vac">Todavía no hay revisiones.</div></div>'
    filas = HIST if not nueva else [("Revisión 4", "15/10/2026 18:40 · Lucía Fernández", "1 acción agregada", True)] + [(a, b, c, False) for a, b, c, _ in HIST]
    it = "".join(f'<a class="it{" nueva" if nueva and i == 0 else ""}" href="#"><b>{r}{" <span class=" + chr(34) + "w-est" + chr(34) + ">Vigente</span>" if v else ""}</b><small>{q}</small><small>{c}</small></a>'
                 for i, (r, q, c, v) in enumerate(filas))
    return f'<div class="w-caja rg2-hi">{cab}{it}</div>'


def cuerpo_reglas(**k):
    hist = k.pop("hist", {})
    return f'<div class="w-body"><div class="rg2-cols">{caja_reglas(**k)}{caja_historial(**hist)}</div></div>'


E_RG = ["Reglas", "Editar una regla", "Elegir la acción", "Avisar a una persona", "Mandar por correo", "Mandar el PDF a un cliente", "Adjuntar: falta «Armar el PDF»",
        "Adjuntar: «Armar el PDF» va después", "Adjuntar: diez acciones", "Adjuntar: con aprobación", "Fuera de las 24 horas", "Guardando", "Reglas guardadas",
        "Una revisión", "Salir sin guardar", "Otra persona guardó", "Sin reglas"]
SUBIR = '<button type="button" class="cb cb-sec">Subir «Armar el PDF»</button>'
AGREGAR_PDF = '<button type="button" class="cb cb-sec">Agregar «Armar el PDF» antes</button>'
MOT_FALTA = "Para adjuntarlo, «Armar el PDF» tiene que ir antes de este mensaje."
MOT_APROB = "Este formulario pide aprobación: el PDF se arma al aprobarla. Sacá el adjunto o cambiá «Cuándo»."
TIP_APROB = "Este formulario pide aprobación: el PDF se arma al aprobarla."
DIEZ = "Una regla tiene hasta 10 acciones."


def menu_tipos():
    o = ""
    for t in TIPOS:
        if t == "Pedir aprobación a un rol":
            o += f'<span role="option" aria-disabled="true" class="off">{t}<small>Solo cuando se recibe una respuesta, y va última.</small></span>'
        else:
            o += f'<span role="option" class="{"on" if t == "Avisar a una persona" else ""}">{t}</span>'
    return f'<div class="rg2-menu" role="listbox" aria-label="Acción 4">{o}</div>'


def reglas():
    n2 = lambda acciones, **k: regla_abierta(2, "Se aprueba una respuesta", acciones, **k)
    base2 = a_pdf(1, primera=True) + a_msj(2) + a_correo(3, ultima=True)
    falta = a_msj(1, adj=adjuntar(motivo=MOT_FALTA, arreglo=AGREGAR_PDF), primera=True, ultima=True)
    despues = a_msj(1, adj=adjuntar(motivo=MOT_FALTA, arreglo=SUBIR), primera=True) + a_pdf(2, ultima=True)
    apagado_diez = f'<span class="e-tipw">{AGREGAR_PDF.replace("<button ", "<button disabled ")}<span class="e-tip" role="tooltip">{DIEZ}</span></span>'
    diez = a_msj(1, adj=adjuntar(motivo=MOT_FALTA, arreglo=apagado_diez), primera=True) + "".join(
        accion(k, t, plegada=True, ultima=k == 10) for k, t in zip(range(2, 11), ["Avisar a un rol", "Avisar a una persona", "Mandar por correo", "Avisar a un rol", "Avisar a una persona",
                                                                                   "Mandar por correo", "Avisar a un rol", "Avisar a una persona", "Mandar por correo"]))
    con_aprob = (a_msj(1, MENSAJE_REC, adj=adjuntar(motivo=MOT_APROB), p24=plantilla24(), primera=True)
                 + a_rol(2, SUP, adj=adjuntar(False, apagado=TIP_APROB, tip_abierto=True), texto="Llegó {número}: esperá tu aprobación.") + a_aprobar(3, ultima=True))
    eleg = base2 + accion(4, "Elegí la acción", menu=menu_tipos(), ultima=True)
    persona = base2.replace(E.acciones_q("la acción 3", False, True, editar=False), E.acciones_q("la acción 3", False, False, editar=False)) + a_persona(4, ultima=True)
    cliente_aviso = ('<div class="rg2-av"><span class="mot" role="alert">Para mandarlo, «Armar el PDF» tiene que ir antes de esta acción.</span>' + AGREGAR_PDF + "</div>")
    cliente = a_cliente(1, extra=cliente_aviso, primera=True, ultima=True)
    fuera = a_pdf(1, primera=True) + a_msj(2, p24=plantilla24(True, True), ultima=True)
    sucio = dict(guardar="sucio")
    V = {"Reglas": cuerpo_reglas(), "Editar una regla": cuerpo_reglas(abierta=n2(base2), **sucio), "Elegir la acción": cuerpo_reglas(abierta=n2(eleg), **sucio),
         "Avisar a una persona": cuerpo_reglas(abierta=n2(persona), **sucio), "Mandar por correo": cuerpo_reglas(abierta=n2(a_pdf(1, primera=True) + a_correo(2, ultima=True)), **sucio),
         "Mandar el PDF a un cliente": cuerpo_reglas(abierta=n2(cliente), **sucio), "Adjuntar: falta «Armar el PDF»": cuerpo_reglas(abierta=n2(falta), **sucio),
         "Adjuntar: «Armar el PDF» va después": cuerpo_reglas(abierta=n2(despues), **sucio),
         "Adjuntar: diez acciones": cuerpo_reglas(abierta=n2(diez, agregar=False, agregar_tip=DIEZ), **sucio),
         "Adjuntar: con aprobación": cuerpo_reglas(abierta=regla_abierta(1, "Se recibe una respuesta", con_aprob), n_abierta=1, **sucio),
         "Fuera de las 24 horas": cuerpo_reglas(abierta=n2(fuera), **sucio), "Guardando": cuerpo_reglas(abierta=n2(base2), guardar="guardando"),
         "Reglas guardadas": cuerpo_reglas(hist=dict(nueva=True)), "Una revisión": cuerpo_reglas(), "Salir sin guardar": cuerpo_reglas(abierta=n2(base2), **sucio),
         "Otra persona guardó": cuerpo_reglas(abierta=n2(base2), **sucio), "Sin reglas": cuerpo_reglas(vacia=True, hist=dict(vacia=True))}
    rev = F.dialogo("Revisión 2", '<div class="rv"><b>Cuando se aprueba una respuesta</b><ol><li>Armar el PDF «Comprobante de visita».</li>'
                    f'<li>Mandarle un mensaje a quien la cargó: «{MENSAJE_APR}», con el PDF.</li></ol><small class="ab-sub">10/10/2026 16:40 · Lucía Fernández · 1 regla agregada</small></div>',
                    '<button type="button" class="cb cb-sec">Cerrar</button>').replace('class="w-dlg"', 'class="w-dlg rev"', 1)
    otra = F.dialogo("Otra persona guardó las reglas", '<p class="d-tx">Martín Paz guardó la revisión 4 mientras editabas. Para no pisar sus cambios, recargá las reglas: lo tuyo sin guardar se pierde.</p>',
                     '<button type="button" class="cb cb-sec">Seguir mirando</button><button type="button" class="cb cb-pri">Recargar las reglas</button>')
    capas = {"Reglas guardadas": A.toast("Reglas guardadas."), "Una revisión": rev, "Otra persona guardó": otra,
             "Salir sin guardar": A.confirmar("¿Salir sin guardar las reglas?", "Los cambios en las reglas se pierden.", "Salir sin guardar", cancelar="Seguir editando")}
    banda = E.banda(FORM, E.EST_PUB4, E.kebab(False), "FRM-Formularios-21.dc.html")
    return A.pagina_editor({e: (banda, V[e]) for e in E_RG}, capas, E_RG, "Reglas · /org/formularios/:id/reglas", E.CSS_E12 + E.CSS_CA4 + X.CSS_19 + CSS_RG + CSS_21)


# ================================================================ FRM-Pdf: el diseño (59 y 82), con «Guardar diseño» y la vista previa al costado
CSS_PDF = """.pd-cols { display: grid; grid-template-columns: minmax(0, 1fr) 480px; gap: 20px; align-items: start; }
.cg-hasta { font-size: 12.5px; font-weight: 400; color: var(--t3); }
.pd-caja .f-cab .tt, .pd-vista .f-cab .tt { display: inline-flex; align-items: center; gap: 6px; }
.pd-b { display: flex; flex-direction: column; gap: 16px; padding: 16px; }
.pd-b .w-cmp .rt { display: inline-flex; align-items: center; gap: 4px; }
.pd-est { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.pd-est .op { display: flex; flex-direction: column; gap: 6px; padding: 8px; border: 1.5px solid var(--borde); border-radius: 10px; background: #fff; font-size: 13.5px; font-weight: 600; color: var(--t1); }
.pd-est .op.on { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.5 0.08 180 / 0.14); }
.pd-est .op small { font-weight: 400; color: var(--t3); font-size: 12px; }
.pd-est .mini { box-sizing: border-box; height: 64px; border-radius: 6px; background: #fff; border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 4px; padding: 6px; overflow: hidden; }
.pd-est .mini i { display: block; height: 4px; border-radius: 2px; background: var(--s3); }
.pd-est .mini i.c { background: var(--pcm, oklch(0.47 0.08 195)); }
.pd-est .mini.moderno { padding: 0; } .pd-est .mini.moderno i.c { height: 14px; border-radius: 0; margin-bottom: 2px; } .pd-est .mini.moderno i:not(.c) { margin: 0 6px; }
.pd-est .mini.compacto { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 6px; align-content: start; } .pd-est .mini.compacto i.c { grid-column: 1 / -1; height: 3px; }
.pd-col { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pd-col .sw { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--borde2); }
.pd-col .sw.on { box-shadow: 0 0 0 2px var(--marca); }
.pd-col small { font-size: 12.5px; color: var(--t3); margin-left: 4px; }
.pd-enc { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 10px; background: oklch(0.985 0.006 78); font-size: 13.5px; }
.pd-enc .lg { width: 32px; height: 32px; border-radius: 6px; background: oklch(0.47 0.08 195); color: #fff; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.pd-enc .tx { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pd-enc .tx small { color: var(--t3); font-size: 12.5px; }
.pd-enc a { font-size: 13px; font-weight: 600; color: var(--marca-tx); text-decoration: none; white-space: nowrap; }
.pd-secs { display: flex; flex-direction: column; gap: 10px; }
.pd-sec { border: 1px solid var(--borde); border-radius: 10px; background: #fff; overflow: hidden; }
.pd-sec .h { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px 8px 14px; background: oklch(0.975 0.008 78); border-bottom: 1px solid var(--borde); font-size: 13.5px; font-weight: 600; }
.pd-sec .qs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 14px; padding: 10px 14px; }
.pd-firmas { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.pd-firmas .ab-chip { height: 30px; gap: 6px; font-size: 13px; }
.pd-vista .pv-b { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px; background: var(--s2); }
.pd-vista .pv-b small { font-size: 12.5px; color: var(--t3); }
.pd-vista .pv-esp { width: 100%; max-width: 420px; aspect-ratio: 210 / 297; border-radius: 2px; background: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13.5px; color: var(--t2); }
"""
AY_COMPROBANTE = "El diseño se guarda aparte y vale sin publicar. Los PDF que ya se armaron no cambian."
AY_ENC = "El logo y los datos salen de la página pública de la organización."
AY_SECS = "Cada sección lleva su título y sus preguntas, en el orden que elijas."
AY_FOTOS = "Sin marcar, el PDF dice cuántas fotos hay."
ESTILOS = [("clasico", "Clásico", "Con líneas"), ("moderno", "Moderno", "Con el color arriba"), ("compacto", "Compacto", "En dos columnas")]


def estilos(sel="clasico"):
    mini = lambda k: f'<span class="mini {k}"><i class="c"></i><i style="width: 70%;"></i><i></i><i style="width: 85%;"></i><i></i></span>'
    return ('<div class="pd-est" role="radiogroup" aria-label="Estilo">' + "".join(f'<span class="op{" on" if k == sel else ""}" role="radio" aria-checked="{"true" if k == sel else "false"}">{mini(k)}{t}<small>{d}</small></span>'
                                                                                 for k, t, d in ESTILOS) + "</div>")


def colores(sel=0):
    return ('<div class="pd-col" role="radiogroup" aria-label="Color">' + "".join(f'<span class="sw{" on" if i == sel else ""}" role="radio" aria-label="{n}" title="{n}" style="background: {c};"></span>'
                                                                                for i, (n, c) in enumerate(COLORES)) + f'<small>{COLORES[sel][0]}{", el del sistema" if sel == 0 else ""}</small></div>')


def secciones():
    out = ""
    for i, (t, ps) in enumerate(SECCIONES):
        acc = E.acciones_q(f"la sección {t}", i == 0, i == len(SECCIONES) - 1)
        qs = "".join(f'<span class="q-chk">{"<i>" + TILDE + "</i>" if v else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}{p}</span>' for p, v in ps)
        out += f'<div class="pd-sec"><div class="h"><span>{t}</span>{acc}</div><div class="qs">{qs}</div></div>'
    return f'<div class="pd-secs">{out}<span><button type="button" class="cb cb-sec">{MAS} Agregar sección</button></span></div>'


def chk(texto, on=True, ayuda=""):
    return f'<span class="q-chk">{"<i>" + TILDE + "</i>" if on else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}{texto}{info(ayuda) if ayuda else ""}</span>'


def caja_pdf(estilo="clasico", logo=True, fotos=True, guardar="limpio"):
    if guardar == "guardando":
        g = E.trabaja("Guardando…")
    elif guardar == "limpio":
        g = '<button type="button" class="cb cb-pri" disabled title="No hay cambios para guardar.">Guardar diseño</button>'
    else:
        g = '<button type="button" class="cb cb-pri">Guardar diseño</button>'
    if logo:
        enc = ('<div class="pd-enc"><span class="lg">D</span><span class="tx"><b>Grupo Delta</b><small>Av. Corrientes 1234, CABA · ventas@delta.ejemplo.com · 011 4321-0000</small></span>'
               '<a href="Pagina-Org.dc.html">Editar la página pública</a></div>')
    else:
        enc = ('<div class="pd-enc"><span class="tx"><b>Grupo Delta</b><small>Sin página pública: el PDF lleva el nombre, sin logo ni datos.</small></span>'
               '<a href="Pagina-Org.dc.html">Publicar la página</a></div>')
    firmas = ('<div class="pd-firmas">' + "".join(f'<span class="ab-chip">{f}<button type="button" class="ib" aria-label="Editar {f}">{LAPIZ}</button><button type="button" class="ib" aria-label="Quitar {f}">{QUITAR}</button></span>' for f in FIRMAS)
              + f'<button type="button" class="cb cb-sec">{MAS} Agregar firma</button></div>')
    b = (f'<div class="w-cmp"><span class="rt">Nombre del PDF <span class="req">*</span></span><div class="ct">Comprobante de visita</div></div>'
         f'<div class="w-cmp"><span class="rt">Estilo</span>{estilos(estilo)}</div><div class="w-cmp"><span class="rt">Color</span>{colores()}</div>'
         f'<div class="w-cmp"><span class="rt">Encabezado{info(AY_ENC)}</span>{enc}</div><div class="w-cmp"><span class="rt">Secciones{info(AY_SECS)}</span>{secciones()}</div>'
         f'<div class="w-cmp">{chk("Incluir las fotos", fotos, AY_FOTOS)}</div><div class="w-cmp">{chk("Quién la aprobó y cuándo")}</div>'
         f'<div class="w-cmp"><span class="rt">Firmas <span class="cg-hasta">hasta 3</span></span>{firmas}</div>'
         f'<div class="w-cmp"><span class="rt">Texto al pie (opcional)</span><div class="ct">{PIE_PDF}</div></div>')
    return (f'<div class="w-caja pd-caja"><div class="f-cab"><span class="tt">El comprobante{info(AY_COMPROBANTE)}</span><span class="der">{g}</span></div>'
            f'<div class="pd-b">{b}</div></div>')


def caja_vista(contenido, armando=False):
    boton = E.trabaja("Armando…", "cb-sec") if armando else '<button type="button" class="cb cb-sec">Vista previa</button>'
    return (f'<div class="w-caja pd-vista"><div class="f-cab"><span class="tt">Vista previa</span><span class="der">{boton}</span></div>'
            f'<div class="pv-b">{contenido}<small>Con {NUM_A} de ejemplo · Español</small></div></div>')


E_PDF = ["Diseño", "Estilo moderno", "Estilo compacto", "Sin página pública", "Armando la vista previa", "Sin las fotos", "Guardando", "Diseño guardado", "Salir sin guardar"]


def pdf():
    def cu(estilo="clasico", logo=True, fotos=True, guardar="sucio", vista=None):
        v = vista if vista is not None else caja_vista(hoja(estilo, logo, fotos))
        return f'<div class="w-body"><div class="pd-cols">{caja_pdf(estilo, logo, fotos, guardar)}{v}</div></div>'
    esp = caja_vista(f'<div class="pv-esp">{E.GIRA} Armando la vista previa…</div>', armando=True)
    V = {"Diseño": cu(guardar="limpio"), "Estilo moderno": cu("moderno"), "Estilo compacto": cu("compacto"), "Sin página pública": cu(logo=False, guardar="limpio"),
         "Armando la vista previa": cu("moderno", vista=esp), "Sin las fotos": cu(fotos=False), "Guardando": cu("moderno", guardar="guardando"),
         "Diseño guardado": cu("moderno", guardar="limpio"), "Salir sin guardar": cu("moderno")}
    capas = {"Diseño guardado": A.toast("Diseño guardado."), "Salir sin guardar": A.confirmar("¿Salir sin guardar el diseño?", "Los cambios en el diseño del PDF se pierden.", "Salir sin guardar", cancelar="Seguir editando")}
    descartar = lambda on: f'<button type="button" class="cb cb-sec"{"" if on else " disabled"}>Descartar</button>'
    bnd = {e: A.banda("Comprobante de visita", f"Diseño del PDF · {FORM}", descartar(e not in ("Diseño", "Sin página pública", "Diseño guardado")), "FRM-Editor-Reglas.dc.html")
           .replace("Volver a Diseñar formularios", "Volver a las reglas") for e in E_PDF}
    return A.pagina_editor({e: (bnd[e], V[e]) for e in E_PDF}, capas, E_PDF, "Diseño del PDF · /org/formularios/:id/pdf", E.CSS_E12 + CSS_RG + CSS_PDF + CSS_HOJA + CSS_21)


# ================================================================ WA-Chats-Avisos: los avisos automáticos (AB: «Acción del formulario»)
CSS_AV = """.w-m.sal .av-card, .ap-m.sal .av-card { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: #fff; border: 1px solid var(--borde); }
.av-card .ic { display: inline-flex; color: var(--t2); }
.av-card .pdf { width: 26px; height: 30px; border-radius: 4px; background: oklch(0.55 0.18 25); color: #fff; font-size: 9px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.av-card .t { display: flex; flex-direction: column; line-height: 1.3; font-size: 13px; }
.av-card .t small { font-size: 12px; color: var(--t3); }
.w-m .pie.mal, .ap-m .pie.mal { color: oklch(0.5 0.19 25); }
"""


def card(doc=False, num=NUM_A):
    if doc:
        return f'<span class="av-card"><span class="pdf">PDF</span><span class="t"><b>Comprobante-{num}.pdf</b><small>Acción del formulario · Documento</small></span></span>'
    return f'<span class="av-card"><span class="ic">{F.ICONO}</span><span class="t"><b>Acción del formulario</b><small>Aviso automático · {FORM}</small></span></span>'


def auto(texto, pie, doc=False, mal=False, tel=False):
    c = "ap-m" if tel else "w-m"
    return f'<div class="{c} sal"><span class="gl">{texto}{card(doc)}</span><span class="pie{" mal" if mal else ""}">Automático · {pie}</span></div>'


E_AV = ["Al recibirla", "Al aprobarla", "Al rechazarla", "Fuera de las 24 horas", "Sin plantilla aprobada", "Sin permiso para ver"]
TXT_REC = "Recibimos VIS-000126. Te avisamos cuando la aprueben."
TXT_APR = "Aprobaron VIS-000126. Te mandamos el comprobante."
TXT_RCH = "Rechazaron VIS-000126: falta la firma del cliente en el remito."


def mensajes(burbuja, tarjeta, tel=False):
    env = burbuja("Lucía Fernández · 15:22 · Leído")
    resp = tarjeta(A.grilla_r(A.VALORES_ARCH) + A.r_ok(NUM_A))
    rec = auto(TXT_REC, "15:30 · Leído", tel=tel)
    sin = tarjeta(A.r_st("No tenés permiso para ver las respuestas de este formulario.", A.CANDADO) + A.r_ok(NUM_A))
    return {"Al recibirla": env + resp + rec, "Al aprobarla": env + resp + rec + auto(TXT_APR, "16:05 · Entregado", True, tel=tel),
            "Al rechazarla": env + resp + rec + auto(TXT_RCH, "16:05 · Entregado", tel=tel),
            "Fuera de las 24 horas": env + resp + rec + auto(TXT_APR + " (con la plantilla «Comprobante · con documento»)", "16:05 del día siguiente · Entregado", True, tel=tel),
            "Sin plantilla aprobada": env + resp + rec + auto(TXT_APR, "No se pudo · Sin plantilla aprobada", True, True, tel=tel),
            "Sin permiso para ver": env + sin + auto("Mensaje automático de un formulario.", "15:30", tel=tel)}


def chat_avisos():
    vp = {"Al recibirla": "Automático: Recibimos VIS-000126…", "Al aprobarla": "Automático: Comprobante-VIS-000126.pdf", "Al rechazarla": "Automático: Rechazaron VIS-000126…",
          "Fuera de las 24 horas": "Automático: Comprobante-VIS-000126.pdf", "Sin plantilla aprobada": "Automático: no se pudo mandar", "Sin permiso para ver": "Mensaje automático de un formulario"}
    hora = {"Al recibirla": "15:30", "Al aprobarla": "16:05", "Al rechazarla": "16:05", "Fuera de las 24 horas": "16:05", "Sin plantilla aprobada": "16:05", "Sin permiso para ver": "15:30"}
    esc = {e: A.escr() for e in E_AV}
    t = A.pagina_chat(E_AV, esc, mensajes(A.burbuja, A.tarjeta), {}, vp, hora, "WhatsApp · Internos · avisos automáticos de un formulario · etapa 21")
    return L.con_css(t, "e21", CSS_AV)


def tel_avisos():
    est = ["Al aprobarla", "Sin plantilla aprobada"]
    m = mensajes(A.t_burbuja, A.t_tarjeta, True)
    return A.pagina_tchat(est, {e: A.t_escr() for e in est}, {e: m[e] for e in est}, {}, "WhatsApp · avisos automáticos · teléfono · etapa 21", A.CSS_AB + A.CSS_TRESP_AB + A.CSS_ARCH + CSS_AV)


# ================================================================ Los teléfonos de las reglas y de la decisión
CSS_TRG = G.CSS_T16 + CSS_21 + """.rg-t .r .tx .ad { color: var(--t3); }
.rg-hb { display: flex; flex-direction: column; gap: 14px; padding: 14px 16px 90px; }
.rg-hb .t-adj { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: 12px; background: oklch(0.975 0.02 25); }
.rg-hb .t-adj .mot { font-size: 14px; color: var(--peligro); line-height: 1.4; }
.rg-hb .t-adj .cb { align-self: flex-start; }
.rg-hb .q-chk { font-size: 15px; }
.rg-gtit { display: flex; align-items: center; justify-content: space-between; margin: 16px 16px 0; font-size: 15px; font-weight: 600; }
.rg-gtit a { font-size: 14px; color: var(--marca-tx); text-decoration: none; }
"""


def t_regla(n, cuando, si, acciones):
    s = f"<small>Si {si}</small>" if si else ""
    ac = "".join(f"<span>{k}. {a}</span>" for k, a in enumerate(acciones, 1))
    return f'<div class="r"><span class="n">{n}</span><span class="tx"><b>Cuando {cuando}</b>{s}{ac}</span><button type="button" class="ap-ib" aria-label="Editar la regla {n}">{F.TLAPIZ if hasattr(F, "TLAPIZ") else LAPIZ}</button></div>'


def t_bar_f():
    return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Formularios-21.dc.html">{F.TVOLVER}</a><div class="tit"><h1>{FORM}</h1><span class="sub">Publicado · versión 4</span></div>'
            f'<button type="button" class="ap-ib" aria-label="Acciones de {FORM}">{F.TKEBAB}</button></div>')


def tel_reglas():
    est = ["Reglas", "Editar una regla", "Adjuntar el PDF", "Reglas guardadas"]
    bar = t_bar_f()
    lista = ('<div class="ap-cuerpo"><div class="rg-gtit">Cuando llega una respuesta<a href="#">Agregar regla</a></div><div class="rg-t">'
             + "".join(t_regla(n, c, s, a) for n, c, s, a in REGLAS) + "</div></div>")
    fijo = lambda on: f'<div class="ap-fijo"><button type="button" class="cb cb-pri full"{"" if on else " disabled"}>Guardar reglas</button></div>'
    acc = lambda t, cuerpo: f'<div class="acc"><b>{t}</b>{cuerpo}</div>'
    campo = lambda r, v: F.tcampo(r, v)
    chk_t = lambda on=True: f'<span class="q-chk">{"<i>" + TILDE + "</i>" if on else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}Adjuntar el PDF</span>'
    edit = (C.t_bar("Regla 2", FORM, "M-FRM-Reglas.dc.html") + '<div class="ap-cuerpo"><div class="rg-hb">' + campo("Cuándo", "Se aprueba una respuesta") + '<span class="t-mas">' + MAS + " Agregar condición</span>"
            + acc("Acción 1 · Armar el PDF", "<span>«Comprobante de visita»</span>") + acc("Acción 2 · Mandarle un mensaje a quien la cargó", campo("Mensaje", MENSAJE_APR) + chk_t())
            + f'<span class="t-mas">{MAS} Agregar acción</span></div></div><div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    falta = (C.t_bar("Regla 2", FORM, "M-FRM-Reglas.dc.html") + '<div class="ap-cuerpo"><div class="rg-hb">' + campo("Cuándo", "Se aprueba una respuesta")
             + acc("Acción 1 · Mandarle un mensaje a quien la cargó", campo("Mensaje", MENSAJE_APR) + f'<div class="t-adj">{chk_t()}<span class="mot" role="alert">{MOT_FALTA}</span>{AGREGAR_PDF}</div>')
             + f'<span class="t-mas">{MAS} Agregar acción</span></div></div><div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    ok = '<div class="cg-tban" role="status" style="margin: 12px 16px 0;">Reglas guardadas.</div>'
    cu = {"Reglas": bar + lista + fijo(False), "Editar una regla": edit, "Adjuntar el PDF": falta, "Reglas guardadas": bar + ok + lista + fijo(False)}
    t = C.tel_pagina(cu, est, {}, "Reglas · teléfono · etapa 21", A.CSS_TED + E.CSS_E12 + E.CSS_TED_E12 + W.CSS_TP + CSS_TRG)
    return con_tabs_tel(t, "reglas")


def t_moms(estado, quien=QUIEN_P, hora=HORA_P, motivo=""):
    def m(clase, icono, tit, h, linea=""):
        return f'<div class="tr-mom{" esp" if clase == "esp" else ""}"><span class="ck{" " + clase if clase else ""}">{icono}</span><span class="t"><b>{tit}</b><span class="h">{h}</span>{"<small>" + linea + "</small>" if linea else ""}</span></div>'
    base = m("", CHECK, "Recibida", hora, f"La respondió {quien} por WhatsApp") + m("", CHECK, "Al recibirla", "2 de 2 hechas")
    if estado == "pend":
        return base + m("esp", RELOJ, "Por aprobar", "hace 2 horas", f"Lo aprueba alguien con el rol {SUP}")
    if estado == "ok":
        return base + m("", CHECK, "Aprobada", "hace un momento", f"Lucía Fernández · rol {SUP}") + m("esp", RELOJ, "Al aprobarla", "en curso")
    return base + m("no", CERRAR, "Rechazada", DEC_R, f"Lucía Fernández · {motivo}")


def tel_aprobacion():
    est = ["Por aprobar", "¿Aprobar?", "Aprobando", "Aprobada", "Rechazar", "Actividad", "PDF"]
    grilla = lambda vals: "".join(f'<div class="f"><span class="k">{k}</span><span>{R.valor(v)}</span></div>' for k, v in vals)

    def pantalla(num, chip, moms_, cuerpo, fijo=""):
        return (C.t_bar(num, f"{FORM} · versión 4", "M-FRM-Respuestas-21.dc.html").replace("</h1>", f"</h1>{chip}", 1) + '<div class="tr-scroll"><div class="tr-moms">' + moms_ + "</div>"
                + cuerpo + "</div>" + fijo)
    resp = lambda vals: f'<div class="tr-sec"><button type="button" class="h" aria-expanded="true">Respuesta<span class="fl ab">{CHEV}</span></button><div class="tr-gr">{grilla(vals)}</div></div>'
    decidir = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Rechazar</button><button type="button" class="cb cb-pri full">Aprobar</button></div>'
    pend = pantalla(NUM_P, CHIP["Por aprobar"], t_moms("pend"), resp([(k, v) for k, v in R.VALORES_130]), decidir)
    hoja_ok = F.thoja(f"¿Aprobar {NUM_P}?", f'<p class="d-tx">{QUIEN_P} · {HORA_P}</p>', '<button type="button" class="cb cb-pri lleno">Aprobar</button><button type="button" class="cb cb-sec">Cancelar</button>')
    hoja_trab = F.thoja(f"¿Aprobar {NUM_P}?", f'<p class="d-tx">{QUIEN_P} · {HORA_P}</p>', E.trabaja("Aprobando…") + '<button type="button" class="cb cb-sec" disabled>Cancelar</button>')
    hoja_rch = F.thoja(f"Rechazar {NUM_P}", F.tcampo("Motivo", "Falta la firma del cliente en el remito.", req=True) + '<span class="ab-sub">39 / 500</span>',
                       '<button type="button" class="cb cb-pel lleno">Rechazar</button><button type="button" class="cb cb-sec">Cancelar</button>')
    acts = ('<div class="tr-acts"><div class="mo">Al recibirla<small>2 de 2 hechas</small></div><div class="it"><span class="h">15:30</span><span>Se le mandó a Tomás Acosta: «Recibimos VIS-000126.»</span><span class="ac-est ok">Leído</span></div>'
            '<div class="mo">Al aprobarla<small>3 de 3 hechas</small></div><div class="it"><span class="h">16:05</span><span>Se armó el PDF «Comprobante de visita».</span><span class="ac-est ok">Hecho</span></div>'
            '<div class="it"><span class="h">16:05</span><span>Se le mandó el PDF a Tomás Acosta.</span><span class="ac-est ok">Entregado</span></div></div>')
    pdf_t = f'<div class="tr-pdf"><span class="pdf">PDF</span><span class="t">{PDF_A}<small>{DEC_A} · Español</small></span><a class="cb cb-sec" href="#">Ver</a></div>'
    ok_a = t_moms("ok", QUIEN_A, HORA_A).replace("hace un momento", DEC_A).replace('<span class="ck esp">' + RELOJ + '</span><span class="t"><b>Al aprobarla</b><span class="h">en curso</span>',
                                                                                 '<span class="ck">' + CHECK + '</span><span class="t"><b>Al aprobarla</b><span class="h">3 de 3 hechas</span>')
    cu = {"Por aprobar": pend, "¿Aprobar?": pend, "Aprobando": pend, "Rechazar": pend,
          "Aprobada": pantalla(NUM_P, CHIP["Aprobada"], t_moms("ok"), resp([(k, v) for k, v in R.VALORES_130])),
          "Actividad": pantalla(NUM_A, CHIP["Aprobada"], ok_a, acts), "PDF": pantalla(NUM_A, CHIP["Aprobada"], ok_a, pdf_t)}
    capas = {"¿Aprobar?": hoja_ok, "Aprobando": hoja_trab, "Rechazar": hoja_rch}
    return C.tel_pagina(cu, est, capas, "Una respuesta con aprobación · teléfono · etapa 21", W.CSS_TP + CSS_TRG + CSS_21 + ".ap-bar .tit h1 .w-est { margin-left: 8px; vertical-align: 2px; }\n.ap-fijo { gap: 8px; }\n")


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Editor-Reglas": ("Formularios · las reglas · etapa 21", 1440, 1600), "M-FRM-Reglas": ("Las reglas · teléfono · etapa 21", 390, 844),
           "FRM-Pdf": ("Formularios · el diseño del PDF · etapa 21", 1440, 1500),
           "FRM-Respuesta-Aprobacion": ("Formularios · aprobar o rechazar · etapa 21", 1440, 900), "M-FRM-Respuesta-Aprobacion": ("Aprobar o rechazar · teléfono · etapa 21", 390, 844),
           "WA-Chats-Avisos": ("WhatsApp · los avisos de un formulario · etapa 21", 1440, 900), "M-WA-Conversacion-Avisos": ("Los avisos · teléfono · etapa 21", 390, 844)}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (titulo, w, h) in TITULOS.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def migas(t, hoja=""):
    return t.replace(f"Formularios / {FORM}\"", f"Formularios / {FORM}{' / ' + hoja if hoja else ''}\"").replace("Inicio / Formularios / Respuestas / Visita a cliente", f"Inicio / Gestión de formularios / Formularios / {FORM}")


def enlaces(t):
    for a, b in [("FRM-Respuesta.dc.html", "FRM-Respuesta-Aprobacion.dc.html"), ("FRM-Respuestas.dc.html", "FRM-Respuestas-21.dc.html"), ("FRM-Formularios.dc.html", "FRM-Formularios-21.dc.html"),
                 ("FRM-Editor.dc.html", "FRM-Editor-21.dc.html"), ("M-FRM-Respuestas.dc.html", "M-FRM-Respuestas-21.dc.html"), ("M-FRM-Formularios.dc.html", "M-FRM-Formularios-21.dc.html"),
                 ("M-FRM-Editor.dc.html", "M-FRM-Editor-21.dc.html"), ("WA-Chats-Respuesta.dc.html", "WA-Chats-Avisos.dc.html")]:
        t = t.replace(f'"{a}"', f'"{b}"')
    return t


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    for n, f, alto, pestana in [("FRM-Editor-Reglas", reglas, 1600, "reglas"), ("FRM-Pdf", pdf, 1500, None), ("FRM-Respuesta-Aprobacion", aprobacion, None, "respuestas")]:
        t = L.sin_disenar(n, E.post(n, f(), alto))
        t = W.css_y_alto(t, alto)
        if pestana:
            t = con_tabs(t, pestana)
        if n == "FRM-Pdf":
            t = t.replace(f"Formularios / {FORM}</span>", f"Formularios / {FORM} / Diseño del PDF</span>", 1)
        (PROJ / f"{n}.dc.html").write_text(enlaces(migas(t)), encoding="utf-8")
    (PROJ / "WA-Chats-Avisos.dc.html").write_text(enlaces(E.post("WA-Chats-Avisos", chat_avisos())), encoding="utf-8")
    for n, f in [("M-FRM-Reglas", tel_reglas), ("M-FRM-Respuesta-Aprobacion", tel_aprobacion), ("M-WA-Conversacion-Avisos", tel_avisos)]:
        (PROJ / f"{n}.dc.html").write_text(enlaces(E.post(n, f())), encoding="utf-8")
    registrar()
    print("tableros", len(TITULOS))
