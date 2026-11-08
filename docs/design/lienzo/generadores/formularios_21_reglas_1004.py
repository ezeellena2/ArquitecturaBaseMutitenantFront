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


# ---------------------------------------------------------------- WA-Chats-Avisos con el bloque (177): un aviso con los ítems, uno por línea
# «Pedido de materiales» se carga solo en la app (lista dependiente), así que no hay tarjeta de la respuesta en el chat: llega solo el aviso de la regla
# «Si algún ítem de Productos con ¿Urgente? es Sí», el de FRM-Editor-Reglas-Bloque, con los ítems de PED-000047 numerados y sus valores con « · ».
ITEMS_47 = "1. Caño de 1/2 pulgada · 10 · Sí<br>2. Codo de 90° · 40 · No<br>3. Cinta de teflón · 20 · Sí"
TXT_URG = f"Recibimos tu pedido urgente PED-000047. Lo preparamos hoy:<br>{ITEMS_47}"
E_AV5 = E_AV + ["Con el bloque"]


def card_ped():
    return f'<span class="av-card"><span class="ic">{F.ICONO}</span><span class="t"><b>Acción del formulario</b><small>Aviso automático · {PED}</small></span></span>'


def auto_ped(tel=False):
    c = "ap-m" if tel else "w-m"
    return f'<div class="{c} sal"><span class="gl">{TXT_URG}{card_ped()}</span><span class="pie">Automático · 17:12 · Leído</span></div>'


def mensajes5(burbuja, tarjeta, tel=False):
    m = mensajes(burbuja, tarjeta, tel)
    m["Con el bloque"] = m["Al aprobarla"] + auto_ped(tel)
    return m


def chat_avisos5():
    vp = {"Al recibirla": "Automático: Recibimos VIS-000126…", "Al aprobarla": "Automático: Comprobante-VIS-000126.pdf", "Al rechazarla": "Automático: Rechazaron VIS-000126…",
          "Fuera de las 24 horas": "Automático: Comprobante-VIS-000126.pdf", "Sin plantilla aprobada": "Automático: no se pudo mandar", "Sin permiso para ver": "Mensaje automático de un formulario",
          "Con el bloque": "Automático: Recibimos tu pedido urgente PED-000047…"}
    hora = {"Al recibirla": "15:30", "Al aprobarla": "16:05", "Al rechazarla": "16:05", "Fuera de las 24 horas": "16:05", "Sin plantilla aprobada": "16:05", "Sin permiso para ver": "15:30",
            "Con el bloque": "17:12"}
    esc = {e: A.escr() for e in E_AV5}
    t = A.pagina_chat(E_AV5, esc, mensajes5(A.burbuja, A.tarjeta), {}, vp, hora, "WhatsApp · Internos · avisos automáticos de un formulario · etapa 21")
    return L.con_css(t, "e21", CSS_AV)


def tel_avisos5():
    est = ["Al aprobarla", "Sin plantilla aprobada", "Con el bloque"]
    m = mensajes5(A.t_burbuja, A.t_tarjeta, True)
    return A.pagina_tchat(est, {e: A.t_escr() for e in est}, {e: m[e] for e in est}, {}, "WhatsApp · avisos automáticos · teléfono · etapa 21", A.CSS_AB + A.CSS_TRESP_AB + A.CSS_ARCH + CSS_AV)


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


# ================================================================ Traspasos 5, 9 y 10 (2026-11-07): las piezas nuevas de la 21
# Lo de arriba queda como estaba porque lo usan la 22 y la 23. Desde acá, la 21 sigue a la 15 (139, 143, 144 y 148), a la 158 y a la 166:
# - la vista rápida alineada: el número y el estado, una vez (175), en el título; a la derecha, «Corregir» con su lápiz, el ⋮ con solo
#   «Anular», en rojo, y los íconos con su tooltip, antes de ↑ ↓ ✕ (TL3-A y CW10-A de ArquitecturaBase);
# - los momentos, uno por renglón, con la fecha a la derecha y quién debajo; el motivo de un rechazo, debajo de su momento;
# - la actividad en cuatro columnas fijas (Fecha, Qué pasó, Estado y Acciones), en bandas por momento, con «Reintentar» en el renglón
#   de cada persona, solo con la falla confirmada (158); en la vista rápida, las acciones debajo del texto;
# - la planilla con un solo «Filtros» (144) y «Estado» entre los filtros rápidos, sin cantidades (143);
# - decidir a propósito (161): «¿Aprobar VIS-000130?», sin ✕, con la principal y el foco en «Cancelar».
EXPANDIR, CHAT, KEBAB = R.EXPANDIR, R.CHAT, A.KEBAB
I_RECIBE = svg('<path d="M12 4.5v14"/><path d="m6.5 13 5.5 5.5 5.5-5.5"/>', 16)
I_APRUEBA = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16, "2")
I_RECHAZA = svg('<circle cx="12" cy="12" r="8"/><path d="m6.5 6.5 11 11"/>', 16)
I_SI = P.FILTROS
I_PIDE = svg('<path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/>', 16)
I_PDF = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/>', 16)
I_MSJ = svg('<path d="M5 5h14v10H9l-4 4z"/>', 16)
I_ROL = svg('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.6 14.6c2.3 0 4.2 1.4 4.9 4.4"/>', 16)
I_PERSONA = svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', 16)
I_CORREO = svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>', 16)
I_CLIENTE = svg('<path d="M4 12 20 4l-6 16-3-7z"/>', 16)
I_HIST = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 16)
I_DATO = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 14, "2")
I_VOLVER = svg('<path d="m15 6-6 6 6 6"/>', 16, "2")

CSS_V5 = """.d4-h { align-items: flex-start; padding-top: 12px; padding-bottom: 12px; }
.d4-t { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; min-height: 32px; }
.d2-h .d4-t b { flex: none; font-size: 17px; }
.d4-t .d4-marca { font-size: 13px; color: var(--t2); }
.d4-ac { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; }
.d4-ac .ib, .d4-nav .ib { text-decoration: none; color: var(--t1); }
.d4-co, .w-bnd .d4-co { height: 32px; font-size: 13px; gap: 6px; display: inline-flex; align-items: center; }
.d4-co svg { width: 15px; height: 15px; }
.d4-nav { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
.e-kw { position: relative; display: inline-flex; }
.e-kw .f-menu { position: absolute; top: calc(100% + 6px); right: 0; left: auto; z-index: 30; min-width: 200px; }
.f-mi.pel { color: var(--peligro); }
.d4-sub { padding: 10px 20px 0; font-size: 13.5px; color: var(--t2); }
.d4-aviso { display: flex; gap: 10px; align-items: flex-start; margin: 12px 20px 0; padding: 10px 12px; border-radius: 8px; background: var(--alerta-t); font-size: 13.5px; color: var(--t1); }
.d4-aviso svg { flex: none; color: var(--alerta); }
.d3-moms .m .t { min-width: 0; }
.d3-moms .m.esp { margin: 0 -20px; padding: 10px 20px; background: oklch(0.975 0.025 85); border-bottom-color: oklch(0.9 0.04 85); }
.d3-moms .m .mot { margin: 4px 0 0; font-size: 13.5px; color: var(--t1); white-space: pre-wrap; }
.d3-moms .m .ln, .d4-ln { color: var(--marca-tx); font-weight: 600; text-decoration: none; font-size: 12.5px; }
.d3-moms .m .h .d4-ln { font-size: 13px; }
.d4-dec { display: flex; gap: 8px; margin-top: 8px; }
.d4-dec .cb { height: 32px; font-size: 13px; }
.d4-dec .e-tipw { display: inline-flex; position: relative; }
.d4-dec .e-tip { left: 0; right: auto; top: calc(100% + 6px); width: max-content; max-width: 300px; white-space: normal; z-index: 20; }
.d4-dec .e-tip::before { left: 18px; right: auto; }
.w-caja.dc-moms, .d3-moms { overflow: visible; }
.d4-solo { padding: 4px 0; font-size: 13.5px; color: var(--t2); }
.o-tabs .c { margin-left: 4px; font-size: 12px; color: var(--t3); }
.ac5-rev { margin: 0 0 6px; text-align: right; font-size: 12.5px; color: var(--t2); }
.ac5 { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 13.5px; background: #fff; }
.ac5 .hd, .ac5 .f { display: grid; grid-template-columns: 150px minmax(0, 1fr) 140px 190px; }
.ac5.cmp .hd, .ac5.cmp .f { grid-template-columns: 92px minmax(0, 1fr) 118px; }
.ac5 .hd { background: oklch(0.945 0.018 76); color: var(--t2); font-weight: 600; font-size: 13px; border-bottom: 1px solid oklch(0.89 0.02 76); }
.ac5 .hd > span, .ac5 .f > span { padding: 8px 12px; min-width: 0; }
.ac5 .hd > span + span, .ac5 .f > span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.ac5 .bd { padding: 5px 12px; background: var(--s2); border-top: 1px solid var(--borde); font-size: 12.5px; font-weight: 600; color: var(--t2); }
.ac5 .hd + .bd { border-top: 0; }
.ac5 .f { border-top: 1px solid var(--borde); }
.ac5 .f .h { color: var(--t2); font-variant-numeric: tabular-nums; }
.ac5 .q { display: flex; flex-direction: column; gap: 1px; }
.ac5 .q small { color: var(--t2); font-size: 12.5px; }
.ac5 .q .msj { margin-top: 4px; padding: 4px 8px; border-radius: 6px; background: var(--s2); font-size: 12.5px; color: var(--t1); }
.ac5 .q.pers { padding-left: 30px; }
.ac5 .e { display: inline-flex; align-items: center; gap: 6px; }
.ac5 .e::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--ok); flex: none; }
.ac5 .e.mal { color: var(--peligro); }
.ac5 .e.mal::before { background: var(--peligro); }
.ac5 .e.esp::before { background: oklch(0.72 0.15 70); }
.ac5 .e.gris::before { background: var(--t3); }
.ac5 .e small { display: block; color: var(--t2); font-size: 12px; }
.ac5 .a, .ac5 .q .ac { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ac5 .q .ac { margin-top: 6px; }
.ac5 .a .cb, .ac5 .q .ac .cb { height: 28px; font-size: 12.5px; padding: 0 10px; }
.ac5 .a .ib, .ac5 .q .ac .ib { width: 28px; height: 28px; }
.ac5 .f-i { vertical-align: -2px; }
.pa-vis { display: flex; align-items: center; gap: 12px; }
.pa-vis .ab-seg > span { padding: 6px 16px; }
.w-dlg.dec { width: 420px; }
.w-dlg.dec .dc .ib { display: none; }
.w-dlg.dec .cb-sec.foco { box-shadow: 0 0 0 3px oklch(0.48 0.115 140 / 0.25); border-color: var(--marca); }
"""


def est(e, marca=""):
    """El estado como punto y palabra (175); «Corregida» o «Reemplazada» siguen en gris."""
    m = f'<span class="d4-marca">· {marca}</span>' if marca else ""
    return (f'<span class="w-est {CLASE.get(e, "")}">{e}</span>' if e else "") + m


def kebab_anular(num, abierto=False):
    """El ⋮ «Más acciones» con solo «Anular», en rojo (166): el PDF se baja desde los íconos y desde la actividad."""
    menu = f'<div class="f-menu" role="menu" aria-label="Más acciones de {num}"><span class="f-mi pel" role="menuitem">Anular</span></div>' if abierto else ""
    return (f'<span class="e-kw"><button type="button" class="ib" aria-label="Más acciones" title="Más acciones" aria-haspopup="menu" '
            f'aria-expanded="{"true" if abierto else "false"}">{KEBAB}</button>{menu}</span>')


def corregir_btn(destino="FRM-Respuesta-Corregir.dc.html"):
    return f'<a class="cb cb-sec d4-co" href="{destino}">{LAPIZ} Corregir</a>'


def iconos(completa="FRM-Respuesta-Corregir.dc.html", chat="WA-Chats-Avisos.dc.html", pdf=False):
    """Los íconos de la fila del título, con su tooltip (TL3-A): pantalla completa, la conversación si vino por WhatsApp y el PDF."""
    h = f'<a class="ib" href="{completa}" aria-label="Abrir en pantalla completa" title="Abrir en pantalla completa">{EXPANDIR}</a>'
    if chat:
        h += f'<a class="ib" href="{chat}" aria-label="Abrir conversación" title="Abrir conversación">{CHAT}</a>'
    if pdf:
        h += f'<button type="button" class="ib" aria-label="Descargar el PDF" title="Descargar el PDF">{DESCARGAR}</button>'
    return h


def acciones_vr(num, corregir=True, menu=False, **k):
    """La fila del título de la vista rápida: «Corregir» y ⋮ solo si quien mira puede cambiarla ahora (93), y los íconos."""
    return (corregir_btn(k.pop("destino", "FRM-Respuesta-Corregir.dc.html")) + kebab_anular(num, menu) if corregir else "") + iconos(**k)


def d4(num, estado, momentos, cuerpo, tabs=("Respuesta",), tab="Respuesta", acciones="", pos="1 de 10", primera=False, sub=f"{FORM} · versión 4", marca="", aviso=""):
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)"{" disabled" if primera else ""}>{SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{BAJA}</button>'
           f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{CERRAR}</button>')
    titulo = f'<div class="d4-t"><b>{num}</b>{est(estado, marca)}<span class="d4-ac">{acciones}</span></div>'
    av = f'<div class="d4-aviso" role="status">{F.ALERTA}<span>{aviso}</span></div>' if aviso else ""
    pest = '<div class="o-tabs" role="tablist">' + "".join(f'<span role="tab" class="{"on" if x.split(" <")[0] == tab else ""}">{x}</span>' for x in tabs) + "</div>"
    return (f'<aside class="d2 d4" role="dialog" aria-label="Respuesta {num}"><div class="d2-h d4-h">{titulo}<span class="d4-nav">{nav}</span></div>'
            f'<div class="d4-sub">{sub}</div>{av}<div class="d3-moms">{momentos}</div>{pest if tabs else ""}<div class="d2-b">{cuerpo}</div><div class="d2-pie">{pos}</div></aside>')


def tabs_v(fotos=0, actividad=True, pdf=False):
    return tuple(["Respuesta"] + ([f'Fotos <span class="c">{fotos}</span>'] if fotos else []) + (["Actividad"] if actividad else []) + (["PDF"] if pdf else []))


# ---------------------------------------------------------------- Los momentos (139)
def m4(titulo, hora="", quien="", extra="", clase=""):
    q = f"<small>{quien}</small>" if quien else ""
    h = f'<span class="h">{hora}</span>' if hora else ""
    return f'<div class="m{" " + clase if clase else ""}"><span class="t"><b>{titulo}</b>{q}{extra}</span>{h}</div>'


def hechas(n, total):
    return f'<a class="d4-ln" href="#actividad">{n} de {total} {"hecha" if total == 1 else "hechas"}</a>'


def decidir(apagado=""):
    """Rechazar y Aprobar, sin íconos (Criterio · Botones); apagados, con el motivo en el tooltip."""
    if apagado:
        return ('<span class="d4-dec"><span class="e-tipw"><button type="button" class="cb cb-sec" disabled>Rechazar</button></span>'
                f'<span class="e-tipw"><button type="button" class="cb cb-pri" disabled>Aprobar</button><span class="e-tip" role="tooltip">{apagado}</span></span></span>')
    return '<span class="d4-dec"><button type="button" class="cb cb-sec">Rechazar</button><button type="button" class="cb cb-pri">Aprobar</button></span>'


def mo_mandada(hora, quien="Lucía Fernández"):
    return m4("Mandada", hora, f"{quien}, desde el chat")


def mo_recibida(hora, quien="", canal="WhatsApp", propio=False):
    via = "En la app" if canal == "App" else "Por WhatsApp"
    return m4("Recibida", hora, via if propio or not quien else f"{via} · {quien}")


def mo_efectos(evento, n, total, acciones):
    return m4(evento, hechas(n, total), " · ".join(acciones))


def mo_por_aprobar(hace, fecha, dec="", rol=SUP, otra=False, solo=False):
    """Lo que espera: el rol debajo y, si quien mira decide, Rechazar y Aprobar. Por aprobar otra vez, después de corregir una aprobada."""
    quien = "el PDF nuevo sale al aprobarla" if otra else (f"Rol {rol}" if not solo else "")
    return m4("Por aprobar otra vez" if otra else "Por aprobar", f'<span title="{fecha}">{hace}</span>', quien, dec, "esp")


def mo_decidida(estado, fecha, quien="", rol=SUP, motivo="", pdf=""):
    partes = [x for x in [f"{quien} · rol {rol}" if quien and rol else quien, f"PDF del {pdf}" if pdf else ""] if x]
    m = f'<p class="mot">{motivo}</p>' if motivo else ""
    return m4(estado, fecha, " · ".join(partes), m)


A_REC = ["Mandarle un mensaje a quien la cargó", "Pedir aprobación a un rol"]
A_APR = ["Armar el PDF", "Mandarle un mensaje a quien la cargó", "Mandar por correo", "Avisar a un rol"]
A_RCH = ["Mandarle un mensaje a quien la cargó"]


# ---------------------------------------------------------------- La actividad (139 y 158), en columnas fijas y por momento
def fila5(fecha, que, det="", estado="Hecho", clase="", acciones="", persona=False, msj=""):
    return (fecha, que, det, estado, clase, acciones, persona, msj)


def act5(bandas, compacta=False, revision="Reglas de la revisión 3"):
    hd = "<span>Fecha</span><span>Qué pasó</span><span>Estado</span>" + ("" if compacta else "<span>Acciones</span>")
    h = f'<p class="ac5-rev">{revision}</p><div class="ac5{" cmp" if compacta else ""}"><div class="hd">{hd}</div>'
    for banda, filas in bandas:
        h += f'<div class="bd">{banda}</div>'
        for fecha, que, det, estado, clase, acc, pers, msj in filas:
            d = f"<small>{det}</small>" if det else ""
            m = f'<span class="msj">{msj}</span>' if msj else ""
            a_q = f'<span class="ac">{acc}</span>' if compacta and acc else ""
            e = f'<span><span class="e {clase}">{estado}</span></span>' if estado else "<span></span>"
            a = "" if compacta else f'<span class="a">{acc}</span>'
            h += f'<div class="f"><span class="h">{fecha}</span><span class="q{" pers" if pers else ""}">{que}{d}{m}{a_q}</span>{e}{a}</div>'
    return h + "</div>"


AY_REINTENTAR = ("Le manda el aviso solo a esta persona; a las demás no se les repite. Antes, revisá que tenga el WhatsApp vinculado en su perfil "
                 "y que haya escrito en las últimas 24 horas.")
REINTENTAR = f'<button type="button" class="cb cb-sec">Reintentar</button>{info(AY_REINTENTAR)}'


def ver_pdf(compacta=False):
    if compacta:
        return (f'<a class="ib" href="#" aria-label="Ver el PDF" title="Ver el PDF">{EXPANDIR}</a>'
                f'<button type="button" class="ib" aria-label="Descargar el PDF" title="Descargar el PDF">{DESCARGAR}</button>')
    return '<a class="cb cb-sec" href="#">Ver PDF</a><button type="button" class="cb cb-sec">Descargar</button>'


def bandas_126(modo="normal", compacta=False):
    """VIS-000126, que Tomás Acosta respondió por WhatsApp y Lucía Fernández aprobó. modo: normal o «no_se_pudo» (Martín Paz no recibió el aviso)."""
    rec = [fila5("13/10/2026 11:20", "Se mandó el formulario", "Lucía Fernández, desde el chat"),
           fila5("15:30", "Se respondió el formulario", "Por WhatsApp · Tomás Acosta"),
           fila5("15:30", "Mandarle un mensaje a quien la cargó", "Tomás Acosta", "Leído", "", msj="Recibimos VIS-000126. Te avisamos cuando la aprueben."),
           fila5("15:30", "Se pidió aprobación", f"Rol {SUP}")]
    apr = [fila5("16:05", "Lucía Fernández la aprobó", "", "Aprobada")]
    martin = (fila5("", "Martín Paz", "WhatsApp no aceptó el mensaje: no tiene el WhatsApp vinculado.", "No se pudo", "mal", REINTENTAR, True) if modo == "no_se_pudo"
              else fila5("", "Martín Paz", "", "Entregado", "", "", True))
    al = [fila5("16:05", "Armar el PDF", PDF_A, "Hecho", "", ver_pdf(compacta)),  # sin el idioma: es el de quien mira (traspaso 9)
          fila5("16:05", "Mandarle un mensaje a quien la cargó", "Tomás Acosta, con el PDF", "Entregado", msj=MENSAJE_APR.replace("{número}", NUM_A)),
          fila5("16:05", "Mandar por correo", f"{DIRECCION}, con el PDF"),
          fila5("16:05", "Avisar a un rol", "Rol Dueño", "Hecho" if modo != "no_se_pudo" else "Hecho"),
          fila5("", "Ana Gómez", "", "Leído", "", "", True), martin]
    return [("Al recibirla", rec), ("Aprobación", apr), ("Al aprobarla", al)]


# ---------------------------------------------------------------- Los diálogos de decidir a propósito (161)
def dlg_aprobar5(num=NUM_P, texto=f"{QUIEN_P} · {HORA_P}", trabajando=False):
    """Sin ✕, como toda confirmación; la principal sin rojo y el foco en «Cancelar», así Enter no aprueba."""
    cancelar = f'<button type="button" class="cb cb-sec{"" if trabajando else " foco"}"{" disabled" if trabajando else ""}>Cancelar</button>'
    aprobar = E.trabaja("Aprobando…") if trabajando else '<button type="button" class="cb cb-pri">Aprobar</button>'
    return F.dialogo(f"¿Aprobar {num}?", f'<p class="d-tx">{texto}</p>', cancelar + aprobar).replace('class="w-dlg"', 'class="w-dlg dec"', 1)


# ---------------------------------------------------------------- La planilla de la 21 con las piezas de la 15
ESTADOS_F = ["Recibida", "Por aprobar", "Aprobada", "Rechazada", "Anulada"]


def barra21(modo="normal", estado=None, menu_estado=False, empresa=True):
    """La caja de filtros de la 15 (143 y 144) con «Estado» entre los rápidos: con aprobación, sus cuatro estados, y siempre «Anulada» (92)."""
    t = R.barra5(modo)
    items = [("t", "Todos los estados")] + [(e, e) for e in ESTADOS_F]
    elegido = estado or "t"
    menu = ""
    if menu_estado:
        menu = ('<span class="f-mn" role="listbox" aria-label="Filtrar por estado">'
                + "".join(f'<span role="option" aria-selected="{"true" if k == elegido else "false"}" class="pl-op{" sel" if k == elegido else ""}">{R.tl(k == elegido)}{n}</span>'
                          for k, n in items) + "</span>")
    pil = (f'<span class="f-env"><span class="w-pil{" con" if estado else ""}" role="button" aria-haspopup="listbox">{"Estado: " + estado if estado else "Estado"} {CHEV}</span>{menu}</span>')
    marca = '<span class="pl-env"><span class="w-pil pl-fil"'
    assert marca in t, "«Filtros» en la barra de la 15"
    t = t.replace(marca, pil + marca, 1)
    if not empresa:
        t = re.sub(r'<span class="f-env"><span class="w-pil[^"]*" role="button" aria-haspopup="listbox">Empresa[^<]*' + re.escape(CHEV) + r"</span>(?:<span class=\"f-mn\".*?</span></span>)?</span>", "", t, count=1, flags=re.S)
    return t


def tabla21(filas=None, cols=COLS, sel=None, pie="1–10 de 24", pag="Página 1 de 3", destino="FRM-Respuesta-Aprobacion.dc.html", estados=None, marcas=None):
    """La planilla con «Estado» y la marca del PDF; «Corregida» va junto al número (166)."""
    filas = FILAS if filas is None else filas
    estados, marcas = estados or {}, marcas or {}

    def c(k, r):
        h = celda(k, r, destino, estados.get(r[0]))
        if k == "num" and r[0] in marcas:
            h = h.replace("</a></span>", f'</a> <span class="pl-g">{marcas[r[0]]}</span></span>', 1)
        return h
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(c(k, r) for k, *_ in cols) + "</div>" for r in filas)
    return (f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(cols)};"><div class="pl-scroll">{R.cabecera(cols)}{h}</div>'
            f'<div class="w-pie"><span>{pie}</span><span>10 por página · {pag}</span></div></div>')


def vistas(sel="Por aprobar", n=3):
    """«Por aprobar (N) | Todas» arriba de la planilla (148): el segmentado de dos vistas de lo mismo, no pestañas (79)."""
    return (f'<div class="pa-vis"><span class="ab-seg" role="radiogroup" aria-label="Vista"><span class="{"on" if sel == "Por aprobar" else ""}" role="radio" '
            f'aria-checked="{"true" if sel == "Por aprobar" else "false"}">Por aprobar ({n})</span><span class="{"on" if sel == "Todas" else ""}" role="radio" '
            f'aria-checked="{"true" if sel == "Todas" else "false"}">Todas</span></span></div>')


CSS_PL5 = R.CSS_T5 + R.CSS_D3 + CSS_V5


def fondo5(filas=None, estado=None, menu_estado=False, modo="normal", vista=None, **k):
    return R.CUERPO.format((vistas(vista) if vista else "") + barra21(modo, estado, menu_estado) + tabla21(filas, **k))


def planilla5(estados, bnd, cu, capas, titulo, css=""):
    t = R.pagina(titulo, A.con_estados([(e, bnd[e]) for e in estados]), A.con_estados([(e, cu[e]) for e in estados]), estados, css=CSS_PL + CSS_PL5 + css)
    if capas:
        k = t.rindex("</div>\n</x-dc>")
        t = t[:k] + A.con_estados([(e, capas.get(e, "")) for e in estados]) + t[k:]
    return t


def quien_mira(t, *casos):
    """El usuario de arriba según el estado: cada caso es (expresión de JS sobre `e`, nombre, correo); si ninguno se cumple, Lucía Fernández."""
    t = t.replace('<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>',
                  '<div class="w-us"><span class="w-av">{{yoIni}}</span><span class="tx"><b>{{yo}}</b><span>{{yoCorreo}}</span></span></div>')
    t = re.sub(r'(<summary class="um"[^>]*>)<span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b>', r'\1<span class="w-av">{{yoIni}}</span><span class="tx"><b>{{yo}}</b>', t, count=1)
    gancho = "      si: true, no: false,\n"
    assert gancho in t

    def cadena(i):
        s = "'" + ["Lucía Fernández", "L", "lucia.fernandez@delta.ejemplo.com"][i] + "'"
        for regla, nombre, correo in reversed(casos):
            s = f"({regla}) ? '{[nombre, nombre[0], correo][i]}' : {s}"
        return s
    return t.replace(gancho, gancho + f"      yo: {cadena(0)}, yoIni: {cadena(1)}, yoCorreo: {cadena(2)},\n", 1)


# ================================================================ FRM-Respuesta-Aprobacion: la decisión, alineada (139, 158, 161 y 166)
MANDADA_P = "15/10/2026 09:10"


def moms_130(estado="pend", dec=None, decidio="Lucía Fernández", cuando="15/10/2026 18:42", al_aprobar=(1, 4), aviso_rol=True):
    m = mo_mandada(MANDADA_P) + mo_recibida(HORA_P, QUIEN_P) + mo_efectos("Al recibirla", 2, 2, A_REC)
    if estado == "pend":
        return m + mo_por_aprobar("hace 2 horas", HORA_P, decidir() if dec is None else dec)
    return m + mo_decidida("Aprobada", cuando, decidio) + mo_efectos("Al aprobarla", *al_aprobar, A_APR)


def moms_126(problema=False):
    ef = mo_efectos("Al aprobarla", 4, 4, A_APR)
    if problema:
        ef = ef.replace("</small>", "</small><small>Martín Paz no recibió el aviso.</small>", 1)
    return (mo_mandada("13/10/2026 11:20") + mo_recibida(HORA_A, QUIEN_A) + mo_efectos("Al recibirla", 2, 2, A_REC)
            + mo_decidida("Aprobada", DEC_A, "Lucía Fernández") + ef)


def pestana_pdf5():
    """El PDF de la respuesta, sin el idioma cuando es el de quien mira (traspaso 9)."""
    return (f'<div class="pdf-cab">PDF de la respuesta{info("Es una copia fija: no cambia aunque cambien las reglas, los catálogos o el diseño.")}</div>'
            f'<div class="pdf-c"><span class="pdf">PDF</span><span class="t">{PDF_A}<small>{DEC_A} · 1 página</small></span>'
            f'<a class="cb cb-sec" href="#">Ver PDF</a><button type="button" class="cb cb-sec">{DESCARGAR} Descargar</button></div>')


E_AP5 = ["Por aprobar", "¿Aprobar?", "Aprobando", "Aprobada", "Rechazar", "Rechazada", "La cargaste vos", "Sin el rol", "Otra persona decidió", "Actividad",
         "Actividad: no se pudo", "PDF", "Copia fija"]
OWN_TIP = "Otra persona con el rol Supervisor tiene que aprobarla: la cargaste vos."


def aprobacion5():
    ac = lambda n, pdf=False: acciones_vr(n, pdf=pdf)
    pend = lambda **k: d4(NUM_P, "Por aprobar", moms_130(**k), F.grilla(VAL_P), tabs_v(2), acciones=ac(NUM_P), primera=True)
    v126 = lambda tab, cuerpo, problema=False: d4(NUM_A, "Aprobada", moms_126(problema), cuerpo, tabs_v(2, pdf=True), tab, ac(NUM_A, True), pos="5 de 10")
    rch = (mo_recibida(HORA_R, "Persona sin información") + mo_efectos("Al recibirla", 2, 2, A_REC)
           + mo_decidida("Rechazada", DEC_R, "Lucía Fernández", motivo=MOTIVO_R) + mo_efectos("Al rechazarla", 1, 1, A_RCH))
    propia = (mo_recibida(PROPIA[1], "Lucía Fernández", "App") + mo_efectos("Al recibirla", 2, 2, A_REC)
              + mo_por_aprobar("hace 10 minutos", PROPIA[1], decidir(OWN_TIP)))
    sin_rol = moms_130(dec="")  # quien tiene el permiso y no el rol ve la decisión de solo lectura
    paneles = {
        "Por aprobar": pend(), "¿Aprobar?": pend(), "Aprobando": pend(), "Rechazar": pend(),
        "Aprobada": d4(NUM_P, "Aprobada", moms_130("ok", cuando="hace un momento"), F.grilla(VAL_P), tabs_v(2), acciones=ac(NUM_P), primera=True),
        "Rechazada": d4(NUM_R, "Rechazada", rch, F.grilla(VAL_R), tabs_v(0), acciones=ac(NUM_R), pos="6 de 10"),
        "La cargaste vos": d4("VIS-000131", "Por aprobar", propia, F.grilla(VAL_PROPIA), tabs_v(1), acciones=acciones_vr("VIS-000131", chat=None), primera=True),
        "Sin el rol": d4(NUM_P, "Por aprobar", sin_rol, F.grilla(VAL_P), tabs_v(2), acciones=ac(NUM_P), primera=True),
        "Otra persona decidió": d4(NUM_P, "Aprobada", moms_130("ok", decidio="Martín Paz", cuando="hace un momento"), F.grilla(VAL_P), tabs_v(2), acciones=ac(NUM_P),
                                   primera=True, aviso="Martín Paz la aprobó mientras la mirabas. Se muestra su decisión."),
        "Actividad": v126("Actividad", act5(bandas_126(compacta=True), True)),
        "Actividad: no se pudo": v126("Actividad", act5(bandas_126("no_se_pudo", True), True), True),
        "PDF": v126("PDF", pestana_pdf5()), "Copia fija": v126("PDF", pestana_pdf5()),
    }
    capas = {"¿Aprobar?": sobre(dlg_aprobar5()), "Aprobando": sobre(dlg_aprobar5(trabajando=True)), "Rechazar": sobre(dlg_rechazar()), "Copia fija": sobre(dlg_copia()),
             "Aprobada": A.toast("Respuesta aprobada.")}
    sel = {"Rechazada": NUM_R, "La cargaste vos": "VIS-000131", "Actividad": NUM_A, "Actividad: no se pudo": NUM_A, "PDF": NUM_A, "Copia fija": NUM_A}
    estados_fila = {"Aprobada": {NUM_P: "Aprobada"}, "Otra persona decidió": {NUM_P: "Aprobada"}}
    cu = {}
    for e in E_AP5:
        filas = [PROPIA] + FILAS[:9] if e == "La cargaste vos" else FILAS
        pie = "1–10 de 25" if e == "La cargaste vos" else "1–10 de 24"
        cu[e] = fondo5(filas, vista="Todas", sel=sel.get(e, NUM_P), pie=pie,
                       estados={**({"VIS-000131": "Por aprobar"} if e == "La cargaste vos" else {}), **estados_fila.get(e, {})})
    caps = {e: paneles[e] + capas.get(e, "") for e in E_AP5}
    t = planilla5(E_AP5, {e: banda_p() for e in E_AP5}, cu, caps, "Una respuesta con aprobación · /org/formularios/:id/respuestas?respuesta=VIS-000130")
    return quien_mira(t, ("e === 'Sin el rol'", "Martín Paz", "martin.paz@delta.ejemplo.com"))


# ---------------------------------------------------------------- El teléfono de una respuesta: las piezas de la 15, con el estado y «Corregir»
CSS_TV5 = """.ap-bar .tit h1 { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.ap-bar .tit h1 .w-est { font-size: 13px; font-weight: 500; }
.ap-bar .ap-co { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; margin-left: auto; border: 1px solid var(--borde2); border-radius: 10px; background: #fff;
  color: var(--t1); font-size: 14px; font-weight: 600; text-decoration: none; white-space: nowrap; flex-shrink: 0; }
.ap-bar .ap-co svg { width: 15px; height: 15px; }
.tr-nav { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--borde); background: #fff; font-size: 14px; color: var(--t2); }
.tr-nav .pos { white-space: nowrap; }
.tr-nav .cb { height: 36px; font-size: 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
.tr-nav .ch { margin-left: auto; }
.tr-moms .m.esp { background: oklch(0.975 0.025 85); }
.tr-moms .m .mot { display: block; margin-top: 4px; font-size: 14px; color: var(--t1); }
.tr-moms .m .ln { color: var(--marca-tx); font-weight: 600; font-size: 13.5px; text-decoration: none; }
.tr-ac5 { margin: 12px 16px; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.tr-ac5 .rev { padding: 8px 14px; font-size: 13px; color: var(--t2); border-bottom: 1px solid var(--borde); }
.tr-ac5 .bd { padding: 6px 14px; background: var(--s2); font-size: 13px; font-weight: 600; color: var(--t2); border-bottom: 1px solid var(--borde); }
.tr-ac5 .it { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; border-bottom: 1px solid var(--borde); font-size: 15px; }
.tr-ac5 .it:last-child { border-bottom: 0; }
.tr-ac5 .it.pers { padding-left: 32px; }
.tr-ac5 .it .fe { font-size: 13px; color: var(--t2); font-variant-numeric: tabular-nums; }
.tr-ac5 .it small { font-size: 13.5px; color: var(--t2); }
.tr-ac5 .it .msj { margin-top: 4px; padding: 6px 10px; border-radius: 8px; background: var(--s2); font-size: 14px; }
.tr-ac5 .it .e { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; }
.tr-ac5 .it .e::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--ok); }
.tr-ac5 .it .e.mal { color: var(--peligro); }
.tr-ac5 .it .e.mal::before { background: var(--peligro); }
.tr-ac5 .it .ac { display: flex; gap: 8px; margin-top: 6px; }
.tr-ac5 .it .ac .cb { height: 36px; font-size: 14px; }
.ap-hoja.dec .hc .ap-ib { display: none; }
.ap-hoja.dec .cb-sec.foco { box-shadow: 0 0 0 3px oklch(0.48 0.115 140 / 0.25); border-color: var(--marca); }
"""


def t_m4(titulo, hora, quien="", extra="", clase=""):
    q = f"<small>{quien}</small>" if quien else ""
    return f'<div class="m{" " + clase if clase else ""}"><span><b>{titulo}</b>{q}{extra}</span><span class="h">{hora}</span></div>'


def t_hechas(n, total):
    return f'<a class="ln" href="#actividad">{n} de {total} {"hecha" if total == 1 else "hechas"}</a>'


def t_bar_v(num, estado, volver="M-FRM-Respuestas-21.dc.html", menu=True, sub=f"{FORM} · versión 4", corregir=True):
    """En el teléfono, «Corregir», con su lápiz, va en la barra, junto al ⋮ con «Anular» (166): el renglón de abajo es de la navegación."""
    co = f'<a class="ap-co" href="M-FRM-Respuesta-Corregir.dc.html">{LAPIZ} Corregir</a>' if corregir else ""
    der = co + (f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>' if menu else "")
    return C.t_bar(num, sub, volver, der).replace("</h1>", f"</h1>{est(estado)}" if estado else "</h1>", 1)


def t_nav(pos="1 de 10", primera=False, corregir=True, chat=True):
    ch = '<a class="cb cb-sec ch" href="M-WA-Conversacion-Avisos.dc.html">Abrir conversación</a>' if chat else ""
    return (f'<div class="tr-nav"><span class="pos">{pos}</span><button type="button" class="ap-ib" aria-label="Respuesta anterior"{" disabled" if primera else ""}>{SUBE}</button>'
            f'<button type="button" class="ap-ib" aria-label="Respuesta siguiente">{BAJA}</button>{ch}</div>')


def t_sec(titulo, cuerpo, abierta=True):
    return (f'<div class="tr-sec"><button type="button" class="h" aria-expanded="{"true" if abierta else "false"}">{titulo}<span class="fl{" ab" if abierta else ""}">{CHEV}</span></button>'
            + (cuerpo if abierta else "") + "</div>")


def t_grilla(vals):
    return '<div class="tr-gr">' + "".join(f'<div class="f"><span class="k">{k}</span>' + (f"<span>{v}</span>" if v is not None else '<span class="vac">Sin respuesta</span>') + "</div>"
                                           for k, v in vals) + "</div>"


def t_act5(bandas):
    """En el teléfono, el estado y las acciones bajan debajo de qué pasó, sin el encabezado (TL3-A)."""
    h = '<div class="tr-ac5"><div class="rev">Reglas de la revisión 3</div>'
    for banda, filas in bandas:
        h += f'<div class="bd">{banda}</div>'
        for fecha, que, det, estado, clase, acc, pers, msj in filas:
            h += (f'<div class="it{" pers" if pers else ""}">' + (f'<span class="fe">{fecha}</span>' if fecha else "") + f"<b>{que}</b>"
                  + (f"<small>{det}</small>" if det else "") + (f'<span class="msj">{msj}</span>' if msj else "")
                  + (f'<span class="e {clase}">{estado}</span>' if estado else "") + (f'<span class="ac">{acc}</span>' if acc else "") + "</div>")
    return h + "</div>"


def t_hoja_dec(titulo, texto, pie):
    return F.thoja(titulo, f'<p class="d-tx">{texto}</p>', pie).replace('class="ap-hoja"', 'class="ap-hoja dec"', 1)


E_TAP5 = ["Por aprobar", "¿Aprobar?", "Aprobando", "Aprobada", "Rechazar", "Rechazada", "Actividad", "PDF"]


def tel_aprobacion5():
    def moms(*ms):
        return '<div class="tr-moms">' + "".join(ms) + "</div>"
    rec_p = t_m4("Mandada", MANDADA_P, "Lucía Fernández, desde el chat") + t_m4("Recibida", HORA_P, f"Por WhatsApp · {QUIEN_P}") + t_m4("Al recibirla", t_hechas(2, 2), " · ".join(A_REC))
    pend = moms(rec_p, t_m4("Por aprobar", f'<span title="{HORA_P}">hace 2 horas</span>', f"Rol {SUP}", clase="esp"))
    aprob = moms(rec_p, t_m4("Aprobada", "hace un momento", "Lucía Fernández · rol Supervisor"), t_m4("Al aprobarla", t_hechas(1, 4), " · ".join(A_APR)))
    m126 = moms(t_m4("Mandada", "13/10/2026 11:20", "Lucía Fernández, desde el chat"), t_m4("Recibida", HORA_A, f"Por WhatsApp · {QUIEN_A}"),
                t_m4("Al recibirla", t_hechas(2, 2), " · ".join(A_REC)), t_m4("Aprobada", DEC_A, "Lucía Fernández · rol Supervisor"),
                t_m4("Al aprobarla", t_hechas(4, 4), " · ".join(A_APR)))
    rch = moms(t_m4("Recibida", HORA_R, "Por WhatsApp · Persona sin información"), t_m4("Al recibirla", t_hechas(2, 2), " · ".join(A_REC)),
               t_m4("Rechazada", DEC_R, "Lucía Fernández · rol Supervisor", f'<span class="mot">{MOTIVO_R}</span>'), t_m4("Al rechazarla", t_hechas(1, 1), A_RCH[0]))
    resp = lambda vals: t_sec("Respuesta", t_grilla(vals))
    decidir_t = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Rechazar</button><button type="button" class="cb cb-pri full">Aprobar</button></div>'

    def pantalla(num, estado, ms, cuerpo, fijo="", pos="1 de 10", primera=True):
        return t_bar_v(num, estado) + t_nav(pos, primera) + f'<div class="tr-scroll">{ms}{cuerpo}</div>' + fijo
    pdf_t = (f'<div class="tr-pdf"><span class="pdf">PDF</span><span class="t">{PDF_A}<small>{DEC_A} · 1 página</small></span><a class="cb cb-sec" href="#">Ver</a></div>')
    p130 = pantalla(NUM_P, "Por aprobar", pend, resp(R.VALORES_130), decidir_t)
    cu = {"Por aprobar": p130, "¿Aprobar?": p130, "Aprobando": p130, "Rechazar": p130,
          "Aprobada": pantalla(NUM_P, "Aprobada", aprob, resp(R.VALORES_130)),
          "Rechazada": pantalla(NUM_R, "Rechazada", rch, resp(VAL_R), pos="6 de 10", primera=False),
          "Actividad": pantalla(NUM_A, "Aprobada", m126, t_sec("Actividad", t_act5(bandas_126())), pos="5 de 10", primera=False),
          "PDF": pantalla(NUM_A, "Aprobada", m126, t_sec("PDF", pdf_t), pos="5 de 10", primera=False)}
    texto = f"{QUIEN_P} · {HORA_P}"
    capas = {"¿Aprobar?": t_hoja_dec(f"¿Aprobar {NUM_P}?", texto, '<button type="button" class="cb cb-pri lleno">Aprobar</button><button type="button" class="cb cb-sec foco">Cancelar</button>'),
             "Aprobando": t_hoja_dec(f"¿Aprobar {NUM_P}?", texto, E.trabaja("Aprobando…") + '<button type="button" class="cb cb-sec" disabled>Cancelar</button>'),
             "Rechazar": F.thoja(f"Rechazar {NUM_P}", F.tcampo("Motivo", "Falta la firma del cliente en el remito.", req=True) + '<span class="ab-sub">39 / 500</span>',
                                 '<button type="button" class="cb cb-pel lleno">Rechazar</button><button type="button" class="cb cb-sec">Cancelar</button>'),
             "Aprobada": '<div class="t-toast" role="status"><span class="ok">' + F.OK + '</span><span>Respuesta aprobada.</span></div>'}
    return C.tel_pagina(cu, E_TAP5, capas, "Aprobar o rechazar · teléfono · etapa 21",
                        W.CSS_TP + CSS_TRG + CSS_21 + R.CSS_T5_TEL + P.CSS_TPL + R.CSS_T15 + CSS_TV5 + A.CSS_ARCH + "\n.ap-fijo { gap: 8px; }\n")


# ================================================================ FRM-Editor-Reglas: en pasos (138), con el historial detrás de su botón (140) y «Agregar dato» (149)
# Las reglas ocupan todo el ancho: el historial deja la columna de la derecha y se abre al costado (HI1-A). Cada regla se lee en pasos, con su ícono,
# unidos por una línea (LR1-A): el cuándo, «Si» con una condición por renglón y cada acción con su dato aparte en una etiqueta y el mensaje entero en su
# recuadro, con los datos como etiquetas que siguen a la pregunta (MD1-A). Se conservan las clases que usa el recorrido `armar-las-reglas`.
CSS_RG5 = """.rg5 { width: 100%; }
.rg5 .f-cab .der { display: inline-flex; gap: 8px; align-items: center; }
.rg5-r { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; gap: 12px; padding: 16px; border-top: 1px solid var(--borde); align-items: start; }
.rg5 .f-cab + .rg5-r, .rg5 .f-cab + .rg2-ab { border-top: 0; }
.rg5-r > .n { font-size: 13px; font-weight: 600; color: var(--t3); padding-top: 4px; font-variant-numeric: tabular-nums; }
.rg5-r > .ac { display: inline-flex; gap: 2px; }
.rg5-p { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; min-width: 0; }
.rg5-p > li { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 10px; padding-bottom: 12px; font-size: 14px; line-height: 1.45; }
.rg5-p > li:last-child { padding-bottom: 0; }
.rg5-p > li::before { content: ""; position: absolute; left: 13.5px; top: 30px; bottom: 2px; width: 1px; background: var(--borde2); }
.rg5-p > li:last-child::before { display: none; }
.rg5-p .ic { width: 28px; height: 28px; box-sizing: border-box; border-radius: 50%; border: 1px solid var(--borde2); background: #fff; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.rg5-p .tx { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding-top: 3px; }
.rg5-p .tx > p { margin: 0; }
.rg5-p .tx > p.ti { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
.rg5-p .g { color: var(--t2); }
.rg5-p ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 2px; }
.rg5-p .ab-chip { height: 22px; font-size: 12.5px; font-weight: 500; }
.rg5-p .lnk, .rg5 .lnk { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.rg5-m { margin: 0; padding: 6px 10px; border: 1px solid var(--borde); border-radius: 6px; background: var(--s2); white-space: pre-wrap; overflow-wrap: anywhere; }
.rg5-dato { display: inline-flex; align-items: center; padding: 0 6px; border-radius: 4px; background: var(--marca-t); color: var(--marca-tx); font-weight: 600; font-size: 0.93em; line-height: 1.6; white-space: nowrap; }
.rg5-dato.mal { background: var(--peligro-t); color: var(--peligro); }
.rg5-msj .rt { display: flex !important; align-items: center; justify-content: space-between; gap: 8px; }
.rg5-msj .rt > span { display: inline-flex; align-items: center; gap: 4px; }
.rg5-msj .rt .cb { height: 28px; font-size: 12.5px; padding: 0 10px; gap: 4px; }
.rg5-msj .ct.area { display: block; height: auto; min-height: 60px; white-space: pre-wrap; line-height: 1.6; padding-top: 7px; padding-bottom: 7px; }
.rg5-hist .rv-r { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 8px; padding-top: 14px; border-top: 1px solid var(--borde); }
.rg5-hist .rv-r > .n { font-size: 13px; font-weight: 600; color: var(--t3); padding-top: 5px; }
.rg5-msj .ct.area.mal { border-color: var(--peligro); }
.rg5-msj .err2 { font-size: 13px; color: var(--peligro); }
.rg5-llega { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 10px; padding: 8px 10px; border-radius: 8px; background: var(--s2); font-size: 13px; }
.rg5-llega .k { color: var(--t2); font-weight: 600; }
.rg5-llega .v { white-space: pre-wrap; overflow-wrap: anywhere; color: var(--t1); }
.rg5-env { position: relative; }
.rg5-datos { position: absolute; z-index: 30; right: 0; top: 32px; width: 300px; display: flex; flex-direction: column; background: #fff; border: 1px solid var(--borde2); border-radius: 10px; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); overflow: hidden; font-size: 13.5px; }
.rg5-datos .bus { margin: 8px; height: 32px; display: flex; align-items: center; gap: 6px; padding: 0 10px; border: 1px solid var(--borde2); border-radius: 8px; color: var(--t3); }
.rg5-datos .gr { padding: 6px 12px 4px; font-size: 12px; font-weight: 600; color: var(--t2); border-top: 1px solid var(--borde); }
.rg5-datos .op { padding: 7px 12px; border-top: 1px solid var(--borde); }
.rg5-datos .gr + .op { border-top: 0; }
.rg5-datos .op.on { background: var(--s2); font-weight: 600; }
.rg5-datos .op small { display: block; color: var(--t2); font-weight: 400; font-size: 12px; }
.rg5-hist { position: absolute; top: 52px; right: 0; bottom: 0; width: 420px; z-index: 6; background: #fff; border-left: 1px solid var(--borde); box-shadow: -16px 0 32px oklch(0.24 0.014 78 / 0.12); display: flex; flex-direction: column; }
.rg5-hist .hh { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 0 12px 0 20px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); }
.rg5-hist .hh b { flex: 1; font-size: 15px; font-weight: 600; }
.rg5-hist .it { display: flex; flex-direction: column; gap: 2px; padding: 12px 20px; border-bottom: 1px solid var(--borde); font-size: 13.5px; text-decoration: none; color: var(--t1); }
.rg5-hist .it b { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
.rg5-hist .it small { font-size: 12.5px; color: var(--t2); }
.rg5-hist .it.nueva { background: var(--marca-t); }
.rg5-hist .cu { flex: 1; min-height: 0; overflow: auto; }
.rg5-hist .rv { padding: 14px 20px; display: flex; flex-direction: column; gap: 14px; }
.rg5-hist .rv .cab { font-size: 13px; color: var(--t2); }
.rg5-hist .rv .rg5-p > li { font-size: 13.5px; }
.rg5-cond { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) auto; gap: 8px; align-items: end; }
.rg5-cond .ct.sel { display: flex; align-items: center; justify-content: space-between; }
.rg5-cond .ib { margin-bottom: 2px; }
.rg5-algun { grid-column: 1 / -1; font-size: 13px; font-weight: 600; color: var(--t2); margin-bottom: -2px; }
"""


def datos5(texto, disponibles=None):
    """Un mensaje con sus datos: «[Número]» va como una etiqueta con el nombre de la pregunta (MD1-A); una que ya no está, en rojo."""
    def tag(m):
        n = m.group(1)
        if n.startswith("!"):
            return '<span class="rg5-dato mal">Pregunta no disponible</span>'
        return f'<span class="rg5-dato">{n}</span>'
    return re.sub(r"\[([^\]]+)\]", tag, texto)


EJEMPLOS = {"Número": "VIS-000001", "Cliente": "Ejemplo de respuesta", "Monto estimado": "12.500,5", "Motivo del rechazo": "Ejemplo de motivo", "Fecha de la visita": "16/10/2026"}


def llega5(texto, ejemplos=EJEMPLOS):
    """«Así llega»: el mensaje con los datos de ejemplo de la vista previa del PDF; una pregunta que ya no está no llega."""
    t = re.sub(r"\[([^\]]+)\]", lambda m: "" if m.group(1).startswith("!") else ejemplos.get(m.group(1), "Ejemplo de respuesta"), texto)
    return re.sub(r" +([.,:])", r"\1", t).replace("  ", " ")


def plantilla24_5(abierta=False, doc=False):
    """La de arriba, con las variables de WhatsApp a la vista: «{{1}}» lleva un espacio de ancho cero para que el motor de los tableros no la tome."""
    t = plantilla24(abierta, doc)
    return t.replace("&#123;&#123;1&#125;&#125;", "{​{1}​}").replace("&#123;&#123;2&#125;&#125;", "{​{2}​}")


AY_MSJ5 = "Con «Agregar dato», el mensaje lleva el número o lo que respondieron. Debajo se ve cómo llega, con datos de ejemplo."
M_REC, M_APR, M_CORREO = "Recibimos [Número]. Te avisamos cuando la aprueben.", "Aprobaron [Número]. Te mandamos el comprobante.", "Se aprobó [Número]."
M_DUENO, M_RCH = "Se aprobó [Número], de [Cliente], por [Monto estimado].", "Rechazaron [Número]: [Motivo del rechazo]"
PREGS_DATO = ["Cliente", "Fecha de la visita", "¿Se concretó la venta?", "Monto estimado", "Motivo", "Fallas", "Observaciones"]


def lista_datos(rechazo=False, sel="Número", preguntas=PREGS_DATO, extra=None):
    """«Agregar dato»: una lista con buscador, con el número (y el motivo, al rechazar) y las preguntas, sin fotos ni documentos (MD1-A)."""
    resp = ["Número"] + (["Motivo del rechazo"] if rechazo else [])
    ops = lambda xs: "".join(f'<span class="op{" on" if x == sel else ""}" role="option">{x}{"<small>" + extra[x] + "</small>" if extra and x in extra else ""}</span>' for x in xs)
    return (f'<div class="rg5-datos" role="listbox" aria-label="Agregar dato"><span class="bus">{F.BUSCAR} Buscar una pregunta</span>'
            f'<span class="gr">De la respuesta</span>{ops(resp)}<span class="gr">Preguntas</span>{ops(preguntas)}</div>')


def msj5(texto, ayuda=AY_MSJ5, abierta=None, error="", ejemplos=EJEMPLOS):
    """El mensaje: «Agregar dato» al final de su renglón, las etiquetas en el cuadro y «Así llega» debajo."""
    menu = abierta or ""
    boton = f'<span class="rg5-env"><button type="button" class="cb cb-sec" aria-expanded="{"true" if abierta else "false"}">{I_DATO} Agregar dato</button>{menu}</span>'
    err = f'<span class="err2" role="alert">{error}</span>' if error else ""
    return (f'<div class="w-cmp rg5-msj"><span class="rt"><span>Mensaje{info(ayuda)}</span>{boton}</span><div class="ct area{" mal" if error else ""}">{datos5(texto)}</div>{err}'
            f'<div class="rg5-llega"><span class="k">Así llega</span><span class="v">{llega5(texto, ejemplos)}</span></div></div>')


def chip5(t):
    return f'<span class="ab-chip">{t}</span>'


def paso(icono, cuerpo):
    return f'<li><span class="ic">{icono}</span><div class="tx">{cuerpo}</div></li>'


def cond_lineas(conds):
    """Una condición por renglón: «Si» y «y» en gris, la pregunta y el valor en negrita (LR1-A)."""
    return "<ul>" + "".join(f'<li><span class="g">{"Si" if i == 0 else "y"}</span> {c}</li>' for i, c in enumerate(conds)) + "</ul>"


EVENTO_I = {"Se recibe una respuesta": I_RECIBE, "Se aprueba una respuesta": I_APRUEBA, "Se rechaza una respuesta": I_RECHAZA}
ACCION_I = {"Pedir aprobación a un rol": I_PIDE, "Armar el PDF": I_PDF, "Mandarle un mensaje a quien la cargó": I_MSJ, "Avisar a un rol": I_ROL,
            "Avisar a una persona": I_PERSONA, "Mandar por correo": I_CORREO, "Mandar el PDF a un cliente": I_CLIENTE}


def pasos(evento, conds, acciones):
    """acciones: [(tipo, etiquetas, mensaje o None, extra)]."""
    h = paso(EVENTO_I[evento], f'<p class="ti"><b>{evento}</b></p>')
    if conds:
        h += paso(I_SI, cond_lineas(conds))
    for tipo, etiquetas, texto, extra in acciones:
        h += paso(ACCION_I[tipo], f'<p class="ti"><b>{tipo}</b>{"".join(chip5(x) for x in etiquetas)}{extra}</p>' + (f'<p class="rg5-m">{datos5(texto)}</p>' if texto else ""))
    return f'<ol class="rg5-p">{h}</ol>'


VER_DISENO5 = '<a class="lnk" href="FRM-Pdf.dc.html">Ver el diseño</a>'
REGLAS5 = [
    ("Se recibe una respuesta", [], [("Mandarle un mensaje a quien la cargó", [], M_REC, ""), ("Pedir aprobación a un rol", [SUP], None, "")]),
    ("Se aprueba una respuesta", [], [("Armar el PDF", ["Comprobante de visita"], None, VER_DISENO5), ("Mandarle un mensaje a quien la cargó", ["con el PDF"], M_APR, ""),
                                      ("Mandar por correo", [DIRECCION, "con el PDF"], M_CORREO, "")]),
    ("Se aprueba una respuesta", ["<b>Monto estimado</b> <span class=\"g\">desde</span> <b>100.000</b>"], [("Avisar a un rol", ["Dueño"], M_DUENO, "")]),
    ("Se rechaza una respuesta", [], [("Mandarle un mensaje a quien la cargó", [], M_RCH, "")]),
]


def regla5(n, evento, conds, acciones):
    ac = (f'<span class="ac"><button type="button" class="ib" aria-label="Editar la regla {n}">{LAPIZ}</button>'
          f'<button type="button" class="ib" aria-label="Quitar la regla {n}">{QUITAR}</button></span>')
    return f'<div class="rg5-r"><span class="n">{n}</span>{pasos(evento, conds, acciones)}{ac}</div>'


def a_msj5(k, texto=M_APR, adj=None, p24=None, abierta=None, **kw):
    return accion(k, "Mandarle un mensaje a quien la cargó", msj5(texto, abierta=abierta) + (adj if adj is not None else adjuntar()) + (p24 if p24 is not None else plantilla24_5(doc=True)), **kw)


def a_correo5(k, adj=None, **kw):
    cuerpo = ('<div class="dos">' + sel_("A quién", "Una dirección fija") + f'<div class="w-cmp"><span class="rt">Dirección</span><div class="ct">{DIRECCION}</div></div></div>'
              + msj5(M_CORREO) + (adj if adj is not None else adjuntar()))
    return accion(k, "Mandar por correo", cuerpo, **kw)


def a_rol5(k, rol="Dueño", adj=None, texto=M_DUENO, **kw):
    return accion(k, "Avisar a un rol", sel_("Rol", rol) + msj5(texto) + (adj if adj is not None else adjuntar(False)) + plantilla24_5(), **kw)


def a_persona5(k, **kw):
    cuerpo = (sel_("Persona", "Martín Paz", "Tiene que estar activa en la organización cuando corra la regla.") + msj5("Se aprobó [Número]: pasá a retirar el pedido.")
              + adjuntar(False) + plantilla24_5())
    return accion(k, "Avisar a una persona", cuerpo, **kw)


def a_cliente5(k, extra="", **kw):
    contacto = sel_("Contacto", "Elegí la pregunta", "Va al chat del contacto elegido en esa pregunta.", apagado=f"Ninguna pregunta de {FORM} elige de un catálogo «De los contactos».")
    cuerpo = contacto + msj5("Te mandamos el comprobante de [Número].") + plantilla24_5(doc=True)
    return accion(k, "Mandar el PDF a un cliente", cuerpo, extra=extra, **kw)


AGREGAR_COND = f'<button type="button" class="cb cb-sec">{MAS} Agregar condición</button>'


def cond5(pregunta, op, valor=None, algun=False):
    """Una condición que se edita: pregunta, condición y valor. Una pregunta del bloque empieza con «Algún ítem con» (177)."""
    a = '<span class="rg5-algun">Algún ítem con</span>' if algun else ""
    v = f'<div class="w-cmp"><span class="rt">Valor</span><div class="ct">{valor}</div></div>' if valor is not None else "<span></span>"
    return (f'<div class="rg5-cond">{a}{sel_("Pregunta", pregunta)}{sel_("Condición", op)}{v}'
            f'<button type="button" class="ib" aria-label="Quitar la condición">{QUITAR}</button></div>')


def regla_abierta5(n, cuando, acciones, si="", agregar=True, agregar_tip=""):
    """La regla que se edita en el lugar, con «Listo»: la misma de antes, con el mensaje de la 149."""
    return regla_abierta(n, cuando, acciones, si, agregar, agregar_tip)


def caja_reglas5(abierta=None, n_abierta=2, guardar="limpio", vacia=False, historial=True, reglas=REGLAS5):
    if guardar == "guardando":
        g = E.trabaja("Guardando…")
    elif guardar == "limpio":
        g = '<span class="e-tipw"><button type="button" class="cb cb-pri" disabled>Guardar reglas</button><span class="e-tip" role="tooltip" hidden>No hay cambios para guardar.</span></span>'
    else:
        g = '<button type="button" class="cb cb-pri">Guardar reglas</button>'
    hist = ('<button type="button" class="cb cb-sec">Historial</button>' if historial
            else '<span class="e-tipw"><button type="button" class="cb cb-sec" disabled>Historial</button><span class="e-tip" role="tooltip">Todavía no hay revisiones.</span></span>')
    cab = (f'<div class="f-cab"><span class="tt">Cuando llega una respuesta{info(AY_REGLAS)}</span><span class="der">{hist}'
           f'<button type="button" class="cb cb-sec">{MAS} Agregar regla</button>{g}</span></div>')
    if vacia:
        return f'<div class="w-caja rg2 rg5">{cab}<div class="vac">Todavía no hay reglas.</div></div>'
    filas = "".join(abierta if (abierta and n == n_abierta) else regla5(n, ev, c, a) for n, (ev, c, a) in enumerate(reglas, 1))
    return f'<div class="w-caja rg2 rg5">{cab}{filas}</div>'


HIST5 = [("Revisión 3", "15/10/2026 10:12 · Lucía Fernández", "1 regla actualizada", True), ("Revisión 2", "10/10/2026 16:40 · Lucía Fernández", "1 regla agregada", False),
         ("Revisión 1", "02/10/2026 11:05 · Lucía Fernández", "3 reglas agregadas", False)]


def panel_hist(revision=None, nueva=False):
    """El historial, al costado (HI1-A): de la más nueva a la más vieja; tocar una la lee en pasos, sin editar, con ‹ para volver."""
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{CERRAR}</button>'
    if revision:
        vol = f'<button type="button" class="ib" aria-label="Volver a las revisiones">{I_VOLVER}</button>'
        r2 = [REGLAS5[0], REGLAS5[1], REGLAS5[3]]
        cuerpo = ('<div class="rv"><span class="cab">10/10/2026 16:40 · Lucía Fernández · 1 regla agregada</span>'
                  + "".join(f'<div class="rv-r"><span class="n">{k}</span>{pasos(ev, c, a)}</div>' for k, (ev, c, a) in enumerate(r2, 1)) + "</div>")
        return f'<aside class="rg5-hist" role="dialog" aria-label="Revisión 2"><div class="hh">{vol}<b>Revisión 2</b>{cerrar}</div><div class="cu">{cuerpo}</div></aside>'
    filas = ([("Revisión 4", "15/10/2026 18:40 · Lucía Fernández", "1 regla actualizada", True)] + [(a, b, c, False) for a, b, c, _ in HIST5]) if nueva else HIST5
    it = "".join(f'<a class="it{" nueva" if nueva and i == 0 else ""}" href="#"><b>{r}{" <span class=" + chr(34) + "w-est" + chr(34) + ">Vigente</span>" if v else ""}</b><small>{q}</small><small>{c}</small></a>'
                 for i, (r, q, c, v) in enumerate(filas))
    return f'<aside class="rg5-hist" role="dialog" aria-label="Historial de las reglas"><div class="hh"><b>Historial de las reglas</b>{cerrar}</div><div class="cu">{it}</div></aside>'


def cuerpo_reglas5(**k):
    return f'<div class="w-body">{caja_reglas5(**k)}</div>'


E_RG5 = ["Reglas", "Editar una regla", "Agregar dato", "Elegir la acción", "Avisar a una persona", "Mandar por correo", "Mandar el PDF a un cliente", "Adjuntar: falta «Armar el PDF»",
         "Adjuntar: «Armar el PDF» va después", "Adjuntar: diez acciones", "Adjuntar: con aprobación", "Fuera de las 24 horas", "Una pregunta que ya no está", "Guardando",
         "Reglas guardadas", "Historial", "Una revisión", "Salir sin guardar", "Otra persona guardó", "Sin reglas"]


def reglas5():
    n2 = lambda acciones, **k: regla_abierta5(2, "Se aprueba una respuesta", acciones, **k)
    base2 = a_pdf(1, primera=True) + a_msj5(2) + a_correo5(3, ultima=True)
    con_datos = a_pdf(1, primera=True) + a_msj5(2, abierta=lista_datos(sel="Cliente")) + a_correo5(3, ultima=True)
    falta = a_msj5(1, adj=adjuntar(motivo=MOT_FALTA, arreglo=AGREGAR_PDF), primera=True, ultima=True)
    despues = a_msj5(1, adj=adjuntar(motivo=MOT_FALTA, arreglo=SUBIR), primera=True) + a_pdf(2, ultima=True)
    apagado_diez = f'<span class="e-tipw">{AGREGAR_PDF.replace("<button ", "<button disabled ")}<span class="e-tip" role="tooltip">{DIEZ}</span></span>'
    diez = a_msj5(1, adj=adjuntar(motivo=MOT_FALTA, arreglo=apagado_diez), primera=True) + "".join(
        accion(k, t, plegada=True, ultima=k == 10) for k, t in zip(range(2, 11), ["Avisar a un rol", "Avisar a una persona", "Mandar por correo", "Avisar a un rol", "Avisar a una persona",
                                                                                   "Mandar por correo", "Avisar a un rol", "Avisar a una persona", "Mandar por correo"]))
    con_aprob = (a_msj5(1, M_REC, adj=adjuntar(motivo=MOT_APROB), p24=plantilla24_5(), primera=True)
                 + a_rol5(2, SUP, adj=adjuntar(False, apagado=TIP_APROB, tip_abierto=True), texto="Llegó [Número]: esperá tu aprobación.") + a_aprobar(3, ultima=True))
    eleg = base2 + accion(4, "Elegí la acción", menu=menu_tipos(), ultima=True)
    persona = base2.replace(E.acciones_q("la acción 3", False, True, editar=False), E.acciones_q("la acción 3", False, False, editar=False)) + a_persona5(4, ultima=True)
    cliente_aviso = ('<div class="rg2-av"><span class="mot" role="alert">Para mandarlo, «Armar el PDF» tiene que ir antes de esta acción.</span>' + AGREGAR_PDF + "</div>")
    cliente = a_cliente5(1, extra=cliente_aviso, primera=True, ultima=True)
    fuera = a_pdf(1, primera=True) + a_msj5(2, p24=plantilla24_5(True, True), ultima=True)
    # Una pregunta que ya no está se ve «Pregunta no disponible», en rojo, y no deja guardar (149)
    rota = regla_abierta5(3, "Se aprueba una respuesta", accion(1, "Avisar a un rol", sel_("Rol", "Dueño") + msj5("Se aprobó [Número], de [Cliente], por [Monto estimado]. La atendió [!Supervisor].",
                                                                                                                   error="Quitá el dato que ya no está en el formulario.")
                                                                + adjuntar(False) + plantilla24_5(), primera=True, ultima=True),
                          si=cond5("Monto estimado", "Es mayor o igual a", "100.000") + AGREGAR_COND)
    sucio = dict(guardar="sucio")
    V = {"Reglas": cuerpo_reglas5(), "Editar una regla": cuerpo_reglas5(abierta=n2(base2), **sucio), "Agregar dato": cuerpo_reglas5(abierta=n2(con_datos), **sucio),
         "Elegir la acción": cuerpo_reglas5(abierta=n2(eleg), **sucio), "Avisar a una persona": cuerpo_reglas5(abierta=n2(persona), **sucio),
         "Mandar por correo": cuerpo_reglas5(abierta=n2(a_pdf(1, primera=True) + a_correo5(2, ultima=True)), **sucio),
         "Mandar el PDF a un cliente": cuerpo_reglas5(abierta=n2(cliente), **sucio), "Adjuntar: falta «Armar el PDF»": cuerpo_reglas5(abierta=n2(falta), **sucio),
         "Adjuntar: «Armar el PDF» va después": cuerpo_reglas5(abierta=n2(despues), **sucio),
         "Adjuntar: diez acciones": cuerpo_reglas5(abierta=n2(diez, agregar=False, agregar_tip=DIEZ), **sucio),
         "Adjuntar: con aprobación": cuerpo_reglas5(abierta=regla_abierta5(1, "Se recibe una respuesta", con_aprob), n_abierta=1, **sucio),
         "Fuera de las 24 horas": cuerpo_reglas5(abierta=n2(fuera), **sucio), "Una pregunta que ya no está": cuerpo_reglas5(abierta=rota, n_abierta=3, **sucio),
         "Guardando": cuerpo_reglas5(abierta=n2(base2), guardar="guardando"), "Reglas guardadas": cuerpo_reglas5(), "Historial": cuerpo_reglas5(), "Una revisión": cuerpo_reglas5(),
         "Salir sin guardar": cuerpo_reglas5(abierta=n2(base2), **sucio), "Otra persona guardó": cuerpo_reglas5(abierta=n2(base2), **sucio),
         "Sin reglas": cuerpo_reglas5(vacia=True, historial=False)}
    otra = F.dialogo("Otra persona guardó las reglas", '<p class="d-tx">Martín Paz guardó la revisión 4 mientras editabas. Para no pisar sus cambios, recargá las reglas: lo tuyo sin guardar se pierde.</p>',
                     '<button type="button" class="cb cb-sec">Seguir mirando</button><button type="button" class="cb cb-pri">Recargar las reglas</button>')
    capas = {"Reglas guardadas": A.toast("Reglas guardadas."), "Historial": panel_hist(), "Una revisión": panel_hist(revision=2), "Otra persona guardó": otra,
             "Salir sin guardar": A.confirmar("¿Salir sin guardar las reglas?", "Los cambios en las reglas se pierden.", "Salir sin guardar", cancelar="Seguir editando")}
    banda = E.banda(FORM, E.EST_PUB4, E.kebab(False), "FRM-Formularios-21.dc.html")
    return A.pagina_editor({e: (banda, V[e]) for e in E_RG5}, capas, E_RG5, "Reglas · /org/formularios/:id/reglas", E.CSS_E12 + E.CSS_CA4 + X.CSS_19 + CSS_RG + CSS_21 + CSS_RG5)


# ================================================================ FRM-Editor-Reglas-Bloque: las reglas con el bloque (146 y 177), nuevo
# «Pedido de materiales» y su bloque «Productos» (Producto, Cantidad y ¿Urgente?, como la spec 21). Al elegir una pregunta del bloque, la condición
# empieza con «Algún ítem con» y se cumple si algún ítem la cumple; varias del mismo bloque buscan un mismo ítem. En «Agregar dato», el bloque es un
# dato que trae todos sus ítems, y en «Así llega» y en el aviso, cada ítem va en su línea, numerado, con sus valores separados por « · » (RG5-A).
PED, BLOQUE = "Pedido de materiales", "Productos"
ITEMS_EJ = "1. Caño de 1/2 pulgada · 10 · Sí\n2. Codo de 90° · 25 · No"
EJ_PED = {"Número": "PED-000001", "Cliente": "Ejemplo de respuesta", "Productos": ITEMS_EJ}
M_URG_ROL = "Pedido urgente [Número], de [Cliente]:\n[Productos]"
M_URG_QUIEN = "Recibimos tu pedido urgente [Número]. Lo preparamos hoy:\n[Productos]"
M_STOCK = "[Número] pide caños en cantidad. Revisá el stock:\n[Productos]"
C_URG = '<span class="g">algún ítem de Productos con</span> <b>¿Urgente?</b> <span class="g">es</span> <b>Sí</b>'
C_STOCK = ('<span class="g">algún ítem de Productos con</span> <b>Producto</b> <span class="g">es</span> <b>Caño de 1/2 pulgada</b> '
           '<span class="g">y</span> <b>Cantidad</b> <span class="g">desde</span> <b>100</b>')
REGLAS_PED = [("Se recibe una respuesta", [C_URG], [("Avisar a un rol", ["Compras"], M_URG_ROL, ""), ("Mandarle un mensaje a quien la cargó", [], M_URG_QUIEN, "")]),
              ("Se recibe una respuesta", [C_STOCK], [("Avisar a un rol", ["Depósito"], M_STOCK, "")])]
PREGS_PED = ["Cliente", "¿Se concretó la venta?", "Motivo", "Monto", "Zona", "Fecha de entrega", "Proveedor", BLOQUE, "Total", "Observaciones"]
CSS_BLQ = """.rg5-preg { position: absolute; z-index: 30; left: 0; top: calc(100% + 4px); width: 300px; display: flex; flex-direction: column; background: #fff; border: 1px solid var(--borde2); border-radius: 10px; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); overflow: hidden; font-size: 13.5px; }
.rg5-preg span { padding: 7px 12px; border-top: 1px solid var(--borde); }
.rg5-preg span:first-child { border-top: 0; }
.rg5-preg .gr { font-weight: 600; color: var(--t2); background: var(--s2); }
.rg5-preg .sub { padding-left: 28px; }
.rg5-preg .on { background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.rg5-cond .w-cmp { position: relative; }
.rg2-si > .rg5-cond { align-self: stretch; }
"""


def lista_preguntas(sel="¿Urgente?"):
    """El selector de la condición: el bloque encabeza sus preguntas, con sangría, como en «Filtros» (146)."""
    sueltas = ["Cliente", "¿Se concretó la venta?", "Motivo", "Monto", "Zona", "Fecha de entrega", "Proveedor"]
    h = "".join(f'<span role="option">{p}</span>' for p in sueltas) + f'<span class="gr" role="presentation">{BLOQUE}</span>'
    h += "".join(f'<span role="option" class="sub{" on" if p == sel else ""}">{p}</span>' for p in ["Producto", "Cantidad", "¿Urgente?"])
    h += '<span role="option">Observaciones</span>'
    return f'<div class="rg5-preg" role="listbox" aria-label="Pregunta">{h}</div>'


def a_rol_blq(k, rol, texto, abierta=None, **kw):
    return accion(k, "Avisar a un rol", sel_("Rol", rol) + msj5(texto, abierta=abierta, ejemplos=EJ_PED) + adjuntar(False) + plantilla24_5(), **kw)


def a_quien_blq(k, texto, **kw):
    return accion(k, "Mandarle un mensaje a quien la cargó", msj5(texto, ejemplos=EJ_PED) + adjuntar(False) + plantilla24_5(), **kw)


def tabs_ped(sel="reglas", tel=False):
    m = "M-" if tel else ""
    items = [("respuestas", "Respuestas", ' <span class="c">46</span>', f"{m}FRM-Respuestas-20.dc.html"), ("tablero", "Tablero", "", f"{m}FRM-Tablero-19.dc.html"),
             ("diseno", "Diseño", "", "M-FRM-Editor-Lineas.dc.html" if tel else "FRM-Editor-Lineas.dc.html"),
             ("reglas", "Reglas", "", "M-FRM-Reglas-Bloque.dc.html" if tel else "FRM-Editor-Reglas-Bloque.dc.html")]
    a = "".join(f'<a class="{"on" if k == sel else ""}" role="tab" aria-selected="{"true" if k == sel else "false"}" href="{h}">{t}{c}</a>' for k, t, c, h in items)
    return f'<div class="{"f-ptabs" if tel else "f-tabs"}" role="tablist" aria-label="Vistas del formulario">{a}</div>'


E_BLQ = ["Las reglas", "Elegir la pregunta", "Algún ítem con", "Dos del mismo ítem", "Agregar dato: el bloque", "Así llega"]


def reglas_bloque():
    def abierta1(si, mensaje_menu=None):
        acciones = a_rol_blq(1, "Compras", M_URG_ROL, abierta=mensaje_menu, primera=True) + a_quien_blq(2, M_URG_QUIEN, ultima=True)
        return regla_abierta5(1, "Se recibe una respuesta", acciones, si=si)
    elegir = cond5("Elegí la pregunta", "Es").replace('<div class="ct sel"><span class="v">Elegí la pregunta</span>', '<div class="ct sel foco"><span class="v">Elegí la pregunta</span>', 1)
    elegir = elegir.replace("</div></div>", "</div>" + lista_preguntas() + "</div>", 1)
    urg = cond5(f"{BLOQUE} › ¿Urgente?", "Es", "Sí", algun=True) + AGREGAR_COND
    dos = (cond5(f"{BLOQUE} › Producto", "Es", "Caño de 1/2 pulgada", algun=True) + cond5(f"{BLOQUE} › Cantidad", "Es mayor o igual a", "100").replace('<div class="rg5-cond">', '<div class="rg5-cond mismo">', 1)
           + AGREGAR_COND)
    abierta2 = regla_abierta5(2, "Se recibe una respuesta", a_rol_blq(1, "Depósito", M_STOCK, primera=True, ultima=True), si=dos)
    lista = lista_datos(sel=BLOQUE, preguntas=PREGS_PED, extra={BLOQUE: "Bloque"})
    V = {"Las reglas": caja_reglas5(reglas=REGLAS_PED), "Elegir la pregunta": caja_reglas5(abierta=abierta1(elegir + AGREGAR_COND), n_abierta=1, guardar="sucio", reglas=REGLAS_PED),
         "Algún ítem con": caja_reglas5(abierta=abierta1(urg), n_abierta=1, guardar="sucio", reglas=REGLAS_PED),
         "Dos del mismo ítem": caja_reglas5(abierta=abierta2, n_abierta=2, guardar="sucio", reglas=REGLAS_PED),
         "Agregar dato: el bloque": caja_reglas5(abierta=abierta1(urg, lista), n_abierta=1, guardar="sucio", reglas=REGLAS_PED),
         "Así llega": caja_reglas5(abierta=abierta1(urg).replace('<div class="ct area">', '<div class="ct area foco">', 1), n_abierta=1, guardar="sucio", reglas=REGLAS_PED)}
    banda = E.banda(PED, '<span class="w-est">Solo en la app · versión 4</span>', E.kebab(False, PED), "FRM-Formularios-21.dc.html")
    t = A.pagina_editor({e: (banda, f'<div class="w-body">{V[e]}</div>') for e in E_BLQ}, {}, E_BLQ, "Reglas con el bloque · /org/formularios/:id/reglas · etapa 21",
                        E.CSS_E12 + E.CSS_CA4 + X.CSS_19 + CSS_RG + CSS_21 + CSS_RG5 + CSS_BLQ + ".rg5-cond.mismo { margin-top: -2px; }\n.ct.sel.foco, .ct.area.foco { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.48 0.115 140 / 0.15); }\n")
    return t


def con_tabs_ped(t):
    t = t.replace('<div class="w-body">', '<div class="w-body">' + tabs_ped())
    return L.con_css(t, "pestanas", L.CSS_PESTANAS)


def tel_reglas_bloque():
    est = ["Las reglas", "Algún ítem con", "Agregar dato", "Así llega"]
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Formularios-21.dc.html">{F.TVOLVER}</a><div class="tit"><h1>{PED}</h1><span class="sub">Solo en la app · versión 4</span></div>'
           f'<button type="button" class="ap-ib" aria-label="Acciones de {PED}">{F.TKEBAB}</button></div>')
    lista = ('<div class="ap-cuerpo"><div class="rg-gtit">Cuando llega una respuesta<span class="lk"><a href="#">Historial</a><a href="#">Agregar regla</a></span></div><div class="rg-t5">'
             + "".join(f'<div class="r"><span class="n">{n}</span>{pasos(ev, c, a)}<button type="button" class="ap-ib" aria-label="Editar la regla {n}">{LAPIZ}</button></div>'
                       for n, (ev, c, a) in enumerate(REGLAS_PED, 1)) + "</div></div>")
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Guardar reglas</button></div>'
    campo = lambda r, v: F.tcampo(r, v)
    edit = lambda cuerpo: (C.t_bar("Regla 1", PED, "M-FRM-Reglas-Bloque.dc.html") + '<div class="ap-cuerpo"><div class="rg-hb">' + campo("Cuándo", "Se recibe una respuesta") + cuerpo
                           + '</div></div><div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    cond_t = ('<div class="t-cond"><span class="al">Algún ítem con</span>' + campo("Pregunta", f"{BLOQUE} › ¿Urgente?") + campo("Condición", "Es") + campo("Valor", "Sí") + "</div>"
              + f'<span class="t-mas">{MAS} Agregar condición</span>')
    msj_t = (f'<div class="acc"><b>Acción 1 · Avisar a un rol</b>{campo("Rol", "Compras")}<div class="t-msj"><span class="rt"><span>Mensaje</span><span class="ad">{I_DATO} Agregar dato</span></span>'
             f'<div class="ct">{datos5(M_URG_ROL)}</div><div class="rg5-llega"><span class="k">Así llega</span><span class="v">{llega5(M_URG_ROL, EJ_PED)}</span></div></div></div>')
    # «Así llega» es la misma pantalla, más abajo: la acción con el mensaje y lo que llega, con un ítem por línea
    abajo = (C.t_bar("Regla 1", PED, "M-FRM-Reglas-Bloque.dc.html") + f'<div class="ap-cuerpo"><div class="rg-hb">{msj_t}<span class="t-mas">{MAS} Agregar acción</span></div></div>'
             '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    hoja = F.thoja("Agregar dato", f'<span class="t-bus">{F.TLUPA} Buscar una pregunta</span><div class="t-datos"><span class="gr">De la respuesta</span><span>Número</span>'
                   '<span class="gr">Preguntas</span>' + "".join(f'<span>{p}{"<small>Bloque</small>" if p == BLOQUE else ""}</span>' for p in PREGS_PED) + "</div>",
                   "").replace('<div class="hb">', '<div class="hb lst">', 1)
    cu = {"Las reglas": bar + lista + fijo, "Algún ítem con": edit(cond_t), "Agregar dato": abajo, "Así llega": abajo}
    css = (A.CSS_TED + E.CSS_E12 + E.CSS_TED_E12 + W.CSS_TP + CSS_TRG + CSS_RG5 + CSS_TRG5
           + ".rg-gtit { flex-wrap: wrap; gap: 4px 16px; }\n.rg-gtit .lk { display: inline-flex; gap: 16px; margin-left: auto; white-space: nowrap; }\n"
           ".t-bus { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; margin-bottom: 8px; border: 1px solid var(--borde2); border-radius: 10px; color: var(--t3); font-size: 16px; }\n"
           ".t-datos { display: flex; flex-direction: column; }\n.t-datos span { padding: 12px 4px; border-bottom: 1px solid var(--borde); font-size: 16px; }\n"
           ".t-datos .gr { padding: 10px 4px 6px; font-size: 13.5px; font-weight: 600; color: var(--t2); }\n.t-datos small { margin-left: 8px; font-size: 13.5px; color: var(--t3); }\n")
    t = C.tel_pagina(cu, est, {"Agregar dato": hoja}, "Las reglas con el bloque · teléfono · etapa 21", css)
    return con_tabs_tel_ped(t)


CSS_TRG5 = """.rg-t5 { display: flex; flex-direction: column; margin: 8px 16px 90px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; overflow: hidden; }
.rg-t5 .r { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; gap: 10px; padding: 14px 12px; border-top: 1px solid var(--borde); align-items: start; }
.rg-t5 .r:first-child { border-top: 0; }
.rg-t5 .r > .n { font-size: 14px; font-weight: 600; color: var(--t3); padding-top: 4px; }
.rg-t5 .rg5-p > li { font-size: 15px; grid-template-columns: 26px minmax(0, 1fr); }
.rg-t5 .rg5-p .ic { width: 26px; height: 26px; }
.rg-t5 .rg5-p > li::before { left: 12.5px; top: 28px; }
.t-cond { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; }
.t-cond .al { font-size: 14px; font-weight: 600; color: var(--t2); }
.t-msj { display: flex; flex-direction: column; gap: 8px; }
.t-msj .rt { display: flex; align-items: center; justify-content: space-between; font-size: 14px; font-weight: 600; color: var(--t2); }
.t-msj .ad { display: inline-flex; align-items: center; gap: 4px; color: var(--marca-tx); font-weight: 600; }
.t-msj .ct { display: block; min-height: 72px; padding: 10px 12px; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; font-size: 16px; line-height: 1.6; white-space: pre-wrap; }
.t-msj .rg5-llega { font-size: 14px; }
"""


def tel_reglas5():
    """Las reglas en el teléfono, en pasos (138); el historial ocupa la pantalla (140) y «Agregar dato» abre una hoja con buscador (149)."""
    est = ["Reglas", "Editar una regla", "Agregar dato", "Adjuntar el PDF", "Historial", "Reglas guardadas"]
    bar = t_bar_f()
    gtit = '<div class="rg-gtit">Cuando llega una respuesta<span class="lk"><a href="#">Historial</a><a href="#">Agregar regla</a></span></div>'
    lista = ('<div class="ap-cuerpo">' + gtit + '<div class="rg-t5">'
             + "".join(f'<div class="r"><span class="n">{n}</span>{pasos(ev, c, a)}<button type="button" class="ap-ib" aria-label="Editar la regla {n}">{LAPIZ}</button></div>'
                       for n, (ev, c, a) in enumerate(REGLAS5, 1)) + "</div></div>")
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Guardar reglas</button></div>'
    campo = lambda r, v: F.tcampo(r, v)
    chk_t = lambda on=True: f'<span class="q-chk">{"<i>" + TILDE + "</i>" if on else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}Adjuntar el PDF</span>'
    msj_t = (f'<div class="t-msj"><span class="rt"><span>Mensaje</span><span class="ad">{I_DATO} Agregar dato</span></span><div class="ct">{datos5(M_APR)}</div>'
             f'<div class="rg5-llega"><span class="k">Así llega</span><span class="v">{llega5(M_APR)}</span></div></div>')
    acc = lambda t, cuerpo: f'<div class="acc"><b>{t}</b>{cuerpo}</div>'
    pagina = lambda cuerpo: (C.t_bar("Regla 2", FORM, "M-FRM-Reglas.dc.html") + '<div class="ap-cuerpo"><div class="rg-hb">' + campo("Cuándo", "Se aprueba una respuesta")
                             + f'<span class="t-mas">{MAS} Agregar condición</span>' + cuerpo + f'<span class="t-mas">{MAS} Agregar acción</span></div></div>'
                             '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    edit = pagina(acc("Acción 1 · Armar el PDF", "<span>«Comprobante de visita»</span>") + acc("Acción 2 · Mandarle un mensaje a quien la cargó", msj_t + chk_t()))
    falta = pagina(acc("Acción 1 · Mandarle un mensaje a quien la cargó", msj_t + f'<div class="t-adj">{chk_t()}<span class="mot" role="alert">{MOT_FALTA}</span>{AGREGAR_PDF}</div>'))
    hoja_datos = F.thoja("Agregar dato", f'<span class="t-bus">{F.TLUPA} Buscar una pregunta</span><div class="t-datos"><span class="gr">De la respuesta</span><span>Número</span>'
                         '<span class="gr">Preguntas</span>' + "".join(f"<span>{p}</span>" for p in PREGS_DATO) + "</div>", "").replace('<div class="hb">', '<div class="hb lst">', 1)
    hist = (C.t_bar("Historial de las reglas", FORM, "M-FRM-Reglas.dc.html") + '<div class="ap-cuerpo"><div class="t-hist">'
            + "".join(f'<a href="#"><b>{r}{" <span class=" + chr(34) + "w-est" + chr(34) + ">Vigente</span>" if v else ""}</b><small>{q}</small><small>{c}</small></a>' for r, q, c, v in HIST5)
            + "</div></div>")
    ok = '<div class="cg-tban" role="status" style="margin: 12px 16px 0;">Reglas guardadas.</div>'
    cu = {"Reglas": bar + lista + fijo, "Editar una regla": edit, "Agregar dato": edit, "Adjuntar el PDF": falta, "Historial": hist, "Reglas guardadas": bar + ok + lista + fijo}
    css = A.CSS_TED + E.CSS_E12 + E.CSS_TED_E12 + W.CSS_TP + CSS_TRG + CSS_RG5 + CSS_TRG5 + """.rg-gtit { flex-wrap: wrap; gap: 4px 16px; }
.rg-gtit .lk { display: inline-flex; gap: 16px; margin-left: auto; white-space: nowrap; }
.t-bus { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; margin-bottom: 8px; border: 1px solid var(--borde2); border-radius: 10px; color: var(--t3); font-size: 16px; }
.t-datos { display: flex; flex-direction: column; }
.t-datos span { padding: 12px 4px; border-bottom: 1px solid var(--borde); font-size: 16px; }
.t-datos .gr { padding: 10px 4px 6px; font-size: 13.5px; font-weight: 600; color: var(--t2); }
.t-hist { display: flex; flex-direction: column; margin: 12px 16px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; overflow: hidden; }
.t-hist a { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-top: 1px solid var(--borde); color: var(--t1); text-decoration: none; font-size: 15px; }
.t-hist a:first-child { border-top: 0; }
.t-hist a b { display: inline-flex; align-items: center; gap: 8px; }
.t-hist a small { font-size: 13.5px; color: var(--t2); }
"""
    t = C.tel_pagina(cu, est, {"Agregar dato": hoja_datos}, "Reglas · teléfono · etapa 21", css)
    return con_tabs_tel(t, "reglas")


def con_tabs_tel_ped(t):
    t = re.sub(r'(<div class="ap-bar int">(?:(?!</h1>).)*?<h1>' + PED + r'</h1>.*?</div>(?:(?!<div).)*?</div>)', lambda m: m.group(1) + tabs_ped(tel=True), t, count=1, flags=re.S)
    return L.con_css(t, "ptabs", L.CSS_PTABS + ".f-ptabs { grid-template-columns: repeat(4, 1fr); }\n.f-ptabs a { font-size: 14px; }\n")


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Editor-Reglas": ("Formularios · las reglas · etapa 21", 1440, 1600), "M-FRM-Reglas": ("Las reglas · teléfono · etapa 21", 390, 844),
           "FRM-Pdf": ("Formularios · el diseño del PDF · etapa 21", 1440, 1500),
           "FRM-Respuesta-Aprobacion": ("Formularios · aprobar o rechazar · etapa 21", 1440, 1200), "M-FRM-Respuesta-Aprobacion": ("Aprobar o rechazar · teléfono · etapa 21", 390, 844),
           "WA-Chats-Avisos": ("WhatsApp · los avisos de un formulario · etapa 21", 1440, 900), "M-WA-Conversacion-Avisos": ("Los avisos · teléfono · etapa 21", 390, 844),
           "FRM-Editor-Reglas-Bloque": ("Formularios · las reglas con el bloque · etapa 21", 1440, 1500), "M-FRM-Reglas-Bloque": ("Las reglas con el bloque · teléfono · etapa 21", 390, 844)}


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


def solo():
    """«--solo A,B»: escribe solo esos tableros y no toca canvas.json (las tandas del traspaso 10 corren en paralelo)."""
    if "--solo" not in sys.argv:
        return None
    return {x for a in sys.argv[sys.argv.index("--solo") + 1:] for x in a.split(",") if x}


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    lista = solo()
    hechos = []

    def escribir(n, t):
        if lista is None or n in lista:
            (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
            hechos.append(n)
    compu = [("FRM-Editor-Reglas", reglas5, 1600, "reglas"), ("FRM-Pdf", pdf, 1500, None), ("FRM-Respuesta-Aprobacion", aprobacion5, 1200, "respuestas"),
             ("FRM-Editor-Reglas-Bloque", reglas_bloque, 1500, "ped")]
    for n, f, alto, pestana in compu:
        if lista is not None and n not in lista:
            continue
        t = L.sin_disenar(n, E.post(n, f(), alto))
        t = W.css_y_alto(t, alto)
        if pestana == "ped":
            t = con_tabs_ped(t)
        elif pestana:
            t = con_tabs(t, pestana)
        if n == "FRM-Pdf":
            t = t.replace(f"Formularios / {FORM}</span>", f"Formularios / {FORM} / Diseño del PDF</span>", 1)
        t = enlaces(migas(t))
        if n == "FRM-Editor-Reglas-Bloque":
            t = t.replace(f"Formularios / {FORM}", f"Formularios / {PED}")
        escribir(n, t)
    escribir("WA-Chats-Avisos", enlaces(E.post("WA-Chats-Avisos", chat_avisos5())))
    for n, f in [("M-FRM-Reglas", tel_reglas5), ("M-FRM-Respuesta-Aprobacion", tel_aprobacion5), ("M-WA-Conversacion-Avisos", tel_avisos5), ("M-FRM-Reglas-Bloque", tel_reglas_bloque)]:
        if lista is None or n in lista:
            escribir(n, enlaces(E.post(n, f())))
    if lista is None:
        registrar()
    print("tableros", len(hechos), hechos)
