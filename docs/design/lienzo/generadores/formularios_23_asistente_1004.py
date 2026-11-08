"""La etapa 23, el asistente con Casos (23-asistente.md y 23-texto-diseno.md del back).

La pantalla «Asistente» es nueva y no tiene modelo, ni acá ni en ArquitecturaBase: el usuario eligió el 03/11 armarla «como el
editor de un formulario», con el contenido a la izquierda y «Probar» siempre a la derecha, como el teléfono de la vista previa, y
los casos que se editan en el lugar, con ↑ ↓ ✎ 🗑 (127). Tiene las pestañas Perfil, Conocimiento, Casos, Límites y Atención, y un
solo Guardar. El conocimiento sigue a «Información del negocio» de ArquitecturaBase (46), y «Preguntas sin respuesta» a
«Formularios que faltan» (67). Los chats, el editor del formulario, los catálogos y Plataforma están en `formularios_23_chats_1004.py`.

Corre después de `formularios_22_biblioteca_1004.py` y antes de los bloques; la fila de la etapa la pone `formularios_etapas_1004.py`
y la campana de la 23, `campana_1004.py`. Se puede volver a correr; con `--sin-canvas` no escribe `canvas.json`.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_reglas_1004 as R  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_20_carga_1004 as W  # noqa: E402
import formularios_22_biblioteca_1004 as B  # noqa: E402
import estados_util as U  # noqa: E402

PROJ = F.PROJ
svg, info = F.svg, F.info
CHEV, MAS, KEBAB, QUITAR, LAPIZ, TILDE = F.CHEV, A.MAS, A.KEBAB, A.QUITAR, A.LAPIZ, A.TILDE
BOT = svg('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4.5V8"/><circle cx="9.5" cy="13.5" r="1"/><circle cx="14.5" cy="13.5" r="1"/>', 16)
PREGUNTA = svg('<path d="M4 19.5 5.3 16A8 8 0 1 1 8.2 19z"/><path d="M10 9.6a2.1 2.1 0 1 1 2.8 2c-.5.2-.8.6-.8 1.1v.4"/><path d="M12 15.8h.01"/>', 16)
CHECK = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "2.25")
HOY, AYER = "27/09/2026", "26/09/2026"
GUARDADO = f"{AYER} 18:20 · Lucía Fernández"
NUMERO_TEL = "011 15-5555-6203"

# ================================================================ Los datos de ejemplo: Grupo Delta, venta y service de heladeras (23-texto-diseno.md)
# cuándo, para quién, qué hacer, lo que suma la acción, activo
CASOS = [
    ("Pregunta por envíos, precios, horarios o garantías", "Clientes", "Responder con el conocimiento", "", True),
    ("Quiere comprar una heladera", "Clientes", "Preguntar con botones", "«¿Es para tu casa o para tu comercio?» · 2 botones", True),
    ("Pregunta por un pedido que ya hizo", "Clientes", "Responder con un texto exacto", "", True),
    ("Quiere hablar con una persona", "Clientes y empleados", "Derivar", "", True),
    ("Manda publicidad o cadenas", "Clientes", "No responder", "", False),
]
ACCIONES = ["Mandar un formulario", "Responder con un texto exacto", "Responder con el conocimiento", "Preguntar con botones", "Derivar", "No responder"]
# Los formularios que ofrece: publicados, activos y con «Cuándo lo ofrece» (el bloque fijo)
OFRECE = [("Pedido de service", "Clientes", "Cuando un cliente cuenta que se rompió una heladera o que no enfría."),
          ("Visita a cliente", "Empleados", "Cuando un vendedor cuenta que visitó a un cliente: a quién, si se cerró la venta y por cuánto."),
          ("Entrega de pedido", "Empleados", "Cuando un empleado cuenta que entregó un pedido y quién lo recibió.")]
TEXTO_PEDIDO = "Pasanos el número de pedido que figura en el remito y lo buscamos."
PREG_BOTONES, BOTONES = "¿Es para tu casa o para tu comercio?", ["Para mi casa", "Para mi comercio"]
DERIVAR = "Ya le paso tu consulta a una persona del equipo. Te responde por acá."
PRESENTACION = "¡Hola! Soy Delta, el asistente de Grupo Delta. ¿En qué te ayudo?"
ZONA = "CABA y Gran Buenos Aires."

CSS_23 = """.f-cols.as23 { grid-template-columns: minmax(0, 1fr) 360px; }
.w-body.as23b { gap: 16px; }
.as23b .q-it .dato b { white-space: normal; overflow: visible; }
.as23-hor .ct, .r23 .ct { display: inline-flex; align-items: center; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 13.5px; }
.as23-hor .ct.sel { justify-content: space-between; }
.as23-tabs { margin-bottom: 0; }
.pr-caja { align-self: start; }
.pr-in { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px 16px; }
.pr-in .cb { align-self: flex-start; }
.pr-in .ct.area { min-height: 64px; }
.pr-res { display: flex; flex-direction: column; gap: 14px; padding: 14px 16px 16px; border-top: 1px solid var(--borde); }
.pr-res .pr-t { font-size: 13px; font-weight: 600; color: var(--t2); }
.pr-ac { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 10px; }
.pr-ac .n { width: 24px; height: 24px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.pr-ac .tx { display: flex; flex-direction: column; gap: 6px; min-width: 0; font-size: 13.5px; }
.pr-ac .tx > b { font-weight: 600; }
.pr-ac .caso, .pr-ac .uso { font-size: 12.5px; color: var(--t3); }
.pr-ac .por { font-size: 13px; line-height: 1.45; color: var(--t2); }
.pr-burb { align-self: flex-start; max-width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 10px; border-top-left-radius: 3px; background: #fff; border: 1px solid var(--borde); font-size: 13px; line-height: 1.45; }
.pr-burb .bts { display: flex; flex-direction: column; margin: 8px -10px -8px; border-top: 1px solid var(--borde); }
.pr-burb .bts span { padding: 7px 10px; text-align: center; color: var(--marca-tx); font-weight: 600; border-bottom: 1px solid var(--borde); }
.pr-burb .bts span:last-child { border-bottom: 0; }
.pr-burb .card { display: flex; flex-direction: column; margin-top: 6px; padding: 6px 8px; border-radius: 6px; background: var(--s2); font-size: 12.5px; }
.pr-g { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 4px 10px; font-size: 13px; line-height: 1.45; color: var(--t2); }
.pr-g .k { color: var(--t3); }
.pr-nada { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--t2); }
.pr-nada svg { color: var(--marca-tx); }
.pr-vacio { padding: 14px 16px 16px; border-top: 1px solid var(--borde); font-size: 13px; color: var(--t3); }
.q-it .dato > span { white-space: normal; }
.q-it.off .dato b { color: var(--t3); }
.q-it.fijo .num { background: var(--marca-t); color: var(--marca-tx); }
.q-it .fin { display: inline-flex; justify-self: end; }
.as23-ed { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 16px; padding: 4px 16px 16px 56px; }
.as23-ed .ancho { grid-column: 1 / -1; }
.as23-ed .ct.area, .as23-g .ct.area { height: auto; min-height: 56px; white-space: normal; line-height: 1.45; padding-top: 8px; padding-bottom: 8px; display: block; }
.as23-ed .q-pie { display: flex; justify-content: flex-end; }
.as23-bts { display: flex; flex-direction: column; gap: 8px; }
.as23-bt { display: grid; grid-template-columns: minmax(0, 1fr) 36px; gap: 8px; align-items: center; }
.as23-bt .ib { width: 36px; height: 36px; border: 1px solid var(--borde); border-radius: 8px; }
.as23-g { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 16px; padding: 14px 16px 16px; }
.as23-g .ancho { grid-column: 1 / -1; }
.as23-g .dato2, .as23-ed .dato2 { font-size: 12.5px; color: var(--t3); }
.as23-g .err2, .as23-ed .err2 { font-size: 12.5px; color: var(--peligro); }
.as23-g .ct.mal, .as23-ed .ct.mal { border-color: var(--peligro); }
.as23-g .ct.ph, .as23-ed .ct.ph { color: var(--t3); }
.as23-num { display: flex; align-items: center; gap: 8px; }
.as23-num .ct { width: 120px; flex: none; }
.as23-num span { font-size: 13.5px; color: var(--t2); }
.as23-chk { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px 16px; padding: 14px 16px 16px; }
.r23 { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px 16px; }
.r23 .op { display: flex; align-items: center; gap: 10px; font-size: 14px; flex-wrap: wrap; }
.r23 .rd { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--borde2); box-sizing: border-box; flex: none; background: #fff; }
.r23 .op.on .rd { border: 5px solid var(--marca); }
.r23 .op .ct { width: 90px; height: 32px; }
.r23 .op .ad { color: var(--t2); }
.as23-bandeja { display: flex; align-items: center; gap: 12px; }
.as23-bandeja .rt { font-size: 13px; font-weight: 600; color: var(--t2); }
.f-cab .vac { margin-left: 8px; }
.ab-chip.vac { color: var(--t3); }
.hz { display: flex; flex-direction: column; padding: 2px 16px 16px; font-size: 13.5px; }
.hz-d { display: grid; grid-template-columns: 84px 132px minmax(0, 1fr); gap: 6px 12px; align-items: start; padding: 9px 0; border-bottom: 1px solid var(--borde); }
.hz-d .dia { padding-top: 7px; font-weight: 500; }
.hz-e, .hz-h { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 32px; padding: 0 10px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 13.5px; color: var(--t1); }
.hz-h { width: 92px; font-variant-numeric: tabular-nums; }
.hz-e.mal, .hz-h.mal { border-color: var(--peligro); }
.hz-fs { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.hz-f { display: flex; align-items: center; gap: 8px; }
.hz-f .a { color: var(--t3); }
.hz-f .ib { width: 32px; height: 32px; }
.hz-sig .q-chk { font-size: 13px; color: var(--t2); }
.cb.cb-enl.hz-add { height: auto; padding: 0; font-size: 13px; }
.hz-err { grid-column: 2 / -1; }
.hz-cp { padding: 12px 0 2px; }
.hz-esp { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--borde); }
.hz-esp > b { font-size: 13.5px; font-weight: 600; }
.hz-fe { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: 12px; align-items: center; }
.hz-fe .fe { font-variant-numeric: tabular-nums; }
.hz-fe .ac { display: inline-flex; align-items: center; gap: 4px; }
.hz-fe .cb-enl { height: auto; padding: 0 6px; font-size: 13px; }
.hz-vac { color: var(--t3); }
.w-dlg.hz-dlg { width: 440px; }
.w-dlg.hz-dlg .ct.sel { display: flex; align-items: center; justify-content: space-between; }
.w-dlg.hz-dlg .ct.sel.hz-h { width: 92px; padding: 0 10px; }
.as23-faq .q-it .dato span { white-space: normal; }
.w-tr.pq, .w-th.pq { grid-template-columns: minmax(280px, 2fr) 100px 90px minmax(160px, 1fr) 48px; }
.w-tr.pq { position: relative; min-height: 56px; overflow: visible; }
.w-tr.pq .k-tc { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.w-tr.pq .k-tc b { font-weight: 600; }
.w-tr.pq .k-tc small { font-size: 12px; color: var(--t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-tr.pq .num { justify-self: start; }
.w-tr.pq .f-menu { top: 44px; right: 8px; width: 250px; }
.w-caja.pqc { overflow: visible; }
.pl-vacio2 { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 24px 16px; font-size: 14px; }
.w-bnd h1 .f-i { vertical-align: middle; }
"""


def campo(rot, valor, req=True, mal="", ph=False, ayuda="", dato="", ancho=False):
    r = ' <span class="req">*</span>' if req else ""
    e = f'<span class="err2" role="alert">{mal}</span>' if mal else (f'<span class="dato2">{dato}</span>' if dato else "")
    return (f'<div class="w-cmp{" ancho" if ancho else ""}"><span class="rt">{rot}{r}{info(ayuda) if ayuda else ""}</span>'
            f'<div class="ct{" ph" if ph else ""}{" mal" if mal else ""}">{valor}</div>{e}</div>')


def area(rot, texto, req=True, mal="", ph=False, ayuda="", ancho=True):
    r = ' <span class="req">*</span>' if req else ""
    e = f'<span class="err2" role="alert">{mal}</span>' if mal else ""
    return (f'<div class="w-cmp{" ancho" if ancho else ""}"><span class="rt">{rot}{r}{info(ayuda) if ayuda else ""}</span>'
            f'<div class="ct area{" ph" if ph else ""}{" mal" if mal else ""}">{texto}</div>{e}</div>')


def selc(rot, valor, req=True, ayuda="", ancho=False, ph=False):
    r = ' <span class="req">*</span>' if req else ""
    return (f'<div class="w-cmp{" ancho" if ancho else ""}"><span class="rt">{rot}{r}{info(ayuda) if ayuda else ""}</span>'
            f'<div class="ct sel{" ph" if ph else ""}" style="display: flex; justify-content: space-between;">{valor}{CHEV}</div></div>')


def numero(rot, valor, unidad, maximo, mal="", ayuda=""):
    e = f'<span class="err2" role="alert">{mal}</span>' if mal else f'<span class="dato2">Máximo de la plataforma: {maximo}</span>'
    return (f'<div class="w-cmp"><span class="rt">{rot} <span class="req">*</span>{info(ayuda) if ayuda else ""}</span>'
            f'<div class="as23-num"><div class="ct{" mal" if mal else ""}">{valor}</div><span>{unidad}</span></div>{e}</div>')


def chk(texto, on=True, apagado=""):
    tip = f' aria-disabled="true" title="{apagado}"' if apagado else ""
    caja = f"<i>{TILDE}</i>" if on else '<i class="no"></i>'
    return f'<span class="q-chk"{tip}>{caja}{texto}</span>'


def radio(opciones, sel=0):
    return '<div class="r23" role="radiogroup">' + "".join(
        f'<span class="op{" on" if k == sel else ""}" role="radio" aria-checked="{"true" if k == sel else "false"}"><span class="rd"></span>{o}</span>'
        for k, o in enumerate(opciones)) + "</div>"


def caja(titulo, cuerpo, ayuda="", der="", chip=""):
    return (f'<div class="w-caja"><div class="f-cab"><span class="tt">{titulo}{info(ayuda) if ayuda else ""}{chip}</span>'
            f'{f"<span class=" + chr(34) + "der" + chr(34) + ">" + der + "</span>" if der else ""}</div>{cuerpo}</div>')


# ================================================================ El marco de WhatsApp, con «Asistente» y «Preguntas sin respuesta» en el panel
PANEL_WA = re.search(r'<aside class="w-panel" aria-label="WhatsApp">.*?</aside>', (PROJ / "WA-Chats.dc.html").read_text(encoding="utf-8"), re.S).group(0)


def panel_wa(activo):
    t = PANEL_WA.replace('<a class="w-ln on" href="WA-Chats.dc.html">', '<a class="w-ln" href="WA-Chats.dc.html">')
    if activo == "chats":
        t = t.replace('<a class="w-ln" href="WA-Chats.dc.html">', '<a class="w-ln on" href="WA-Chats.dc.html">', 1)
    extra = (f'<a class="w-ln{" on" if activo == "asistente" else ""}" href="WA-Asistente.dc.html">{BOT} Asistente</a>'
             f'<a class="w-ln{" on" if activo == "preguntas" else ""}" href="WA-Preguntas-Sin-Respuesta.dc.html">{PREGUNTA} Preguntas sin respuesta<span class="cnt">3</span></a>')
    return t.replace("</nav>", extra + "</nav>", 1)


def en_whatsapp(t, activo, miga):
    """El menú principal en WhatsApp, el panel de WhatsApp de la 23 y la miga."""
    sb = re.search(r'<aside class="w-sb".*?</aside>', t, re.S).group(0)
    sb2 = re.sub(r'<a class="w-ln on" href="(FRM-[^"]+)">', r'<a class="w-ln" href="\1">', sb)
    sb2 = sb2.replace('<a class="w-ln" href="WA-Chats.dc.html">', '<a class="w-ln on" href="WA-Chats.dc.html">', 1)
    t = t.replace(sb, sb2, 1)
    t, k = re.subn(r'<aside class="w-panel".*?</aside>', lambda m: panel_wa(activo), t, count=1, flags=re.S)
    assert k == 1
    t, k = re.subn(r'<span>Inicio / [^<]*</span>', f'<span>{miga}</span>', t, count=1)
    assert k == 1
    return t


def pagina_wa(V, capas, estados, nombre, miga, activo="asistente", alto=900, css=""):
    t = A.pagina_editor(V, capas, estados, nombre, B.CSS_ORG + CSS_23 + CSS_PRE + css)
    t = E.post("WA-Asistente", t, alto)
    t = W.css_y_alto(t, alto)
    return en_whatsapp(t, activo, miga)


# ================================================================ La pantalla «Asistente»: la banda, las pestañas y «Probar»
PESTANAS = [("perfil", "Perfil", "WA-Asistente.dc.html"), ("conocimiento", "Conocimiento", "WA-Asistente-Limites.dc.html"),
            ("casos", "Casos", "WA-Asistente-Casos.dc.html"), ("limites", "Límites", "WA-Asistente-Limites.dc.html"),
            ("atencion", "Atención", "WA-Modo-Atencion.dc.html")]


def tabs(sel):
    a = "".join(f'<a class="{"on" if k == sel else ""}" role="tab" aria-selected="{"true" if k == sel else "false"}" href="{h}">{t}'
                + (f' <span class="c">{len(CASOS)}</span>' if k == "casos" else "") + "</a>" for k, t, h in PESTANAS)
    return f'<div class="f-tabs as23-tabs" role="tablist" aria-label="Partes del asistente">{a}</div>'


def acc(modo="limpio"):
    """Un solo Guardar (39): sin cambios, Descartar y Guardar grisados; guardando, el aro con su gerundio (115)."""
    limpio, g = modo == "limpio", modo == "guardando"
    d = " disabled" if (limpio or g) else ""
    a = f'<button type="button" class="cb cb-sec"{d}>Descartar</button>'
    return a + (E.trabaja("Guardando…") if g else f'<button type="button" class="cb cb-pri"{d}>Guardar cambios</button>')


def banda(modo="limpio", sub=f"Guardado el {GUARDADO}"):
    return F.banda("Asistente", sub, acc(modo)).replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{BOT}</span>', 1)


AY_PROBAR = "Prueba lo guardado y no manda nada. Cuenta en el tope de IA del mes."
TOPE = "Se agotó el tope de IA del mes."


def b_probar(modo="listo"):
    if modo == "probando":
        return E.trabaja("Probando…")
    if modo in ("sucio", "tope", "tope-tip"):
        motivo = E.MOTIVO_GUARDAR if modo == "sucio" else TOPE
        b = f'<button type="button" class="cb cb-pri" aria-disabled="true" title="{motivo}">Probar</button>'
        return f'<span class="e-tipw">{b}<span class="e-tip" role="tooltip">{motivo}</span></span>' if modo == "tope-tip" else b
    return '<button type="button" class="cb cb-pri">Probar</button>'


def burbuja(texto, botones=None, card=""):
    b = '<span class="bts">' + "".join(f"<span>{x}</span>" for x in botones) + "</span>" if botones else ""
    return f'<div class="pr-burb">{texto}{card}{b}</div>'


def oferta(nombre):
    """La oferta del asistente es fija y nombra el formulario (165): el modelo no la redacta, tampoco en Probar ni al mandar una sugerencia."""
    return f"Te preparé el formulario «{nombre}» para que lo completes."


def prellenado(filas):
    """Lo prellenado en dos columnas, debajo de «Prellenado con» (138, como el `DataList` de allá): el dato en gris y su valor al lado, nunca «Dato: valor»."""
    g = "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in filas)
    return f'<span class="as-pre"><span class="t">Prellenado con</span><span class="g">{g}</span></span>'


def pr_grilla(caso, uso, por):
    """Lo de cada acción de Probar en dos columnas, como el globo «Por qué respondió esto»: el caso, lo que usó y por qué."""
    return f'<span class="pr-g"><span class="k">Caso</span><span>{caso}</span><span class="k">Usó</span><span>{uso}</span><span class="k">Por qué</span><span>{por}</span></span>'


CSS_PRE = """.as-pre { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
.as-pre .t { font-size: 12px; color: var(--t3); }
.as-pre .g { display: grid; grid-template-columns: fit-content(60%) minmax(0, 1fr); font-size: 12.5px; line-height: 1.4; }
.as-pre .g > span { padding: 4px 0; border-top: 1px solid var(--borde); }
.as-pre .g > span:nth-child(-n+2) { border-top: 0; }
.as-pre .g .k { color: var(--t3); padding-right: 10px; }
.as-pre .g .v { color: var(--t1); }
"""
CARD_SERVICE = f'<span class="card"><b>Pedido de service</b>{prellenado([("Sucursal", "Centro")])}</span>'
# Lo que haría con cada prueba: qué hace, con qué caso, cómo lo vería la persona, por qué y qué usó
PRUEBAS = {
    "envios": ("¿Hacen envíos a Córdoba?", [
        ("Responder con el conocimiento", "Caso 1 · Pregunta por envíos, precios, horarios o garantías",
         burbuja("¿A qué ciudad de Córdoba sería? Lo consulto con el equipo y te escribe una persona por acá."),
         "Pregunta por envíos. La zona cargada es CABA y Gran Buenos Aires: de Córdoba no dice nada.", "Ubicación y zona de atención"),
        ("Derivar", "Caso 1 · sin la información cargada", burbuja(DERIVAR),
         "Falta la información: anota la pregunta en «Preguntas sin respuesta» y pasa el chat a una persona.", "El mensaje al derivar, del perfil")]),
    "heladera": ("Se rompió la heladera en la sucursal Centro", [
        ("Mandar un formulario", "Formularios · Pedido de service", burbuja(oferta("Pedido de service"), ["Abrir formulario"], CARD_SERVICE),
         "Coincide con «Cuándo lo ofrece» de Pedido de service. La sucursal sale del mensaje.", "Pedido de service · versión 2")]),
    "persona": ("Quiero hablar con alguien", [
        ("Derivar", "Caso 4 · Quiere hablar con una persona", burbuja(DERIVAR), "Pide hablar con una persona.", "El mensaje al derivar, del perfil")]),
    "hola": ("hola, ¿qué hora es?", [
        ("Responder con el conocimiento", "Cualquier otra cosa", burbuja("¡Hola! Soy Delta, el asistente de Grupo Delta. Son las 10:21. ¿En qué te ayudo?"),
         "Un saludo y la hora: lo general, sin datos de la organización.", "La presentación del perfil y la hora")]),
}


def probar(prueba=None, modo="listo", bandeja="Clientes"):
    """«Probar», siempre al costado: la bandeja, el mensaje y lo que haría, en orden, hasta 3 acciones (B7)."""
    texto = PRUEBAS[prueba][0] if prueba else ""
    msj = (f'<div class="w-cmp"><span class="rt">Mensaje</span><div class="ct area">{texto}</div></div>' if texto
           else '<div class="w-cmp"><span class="rt">Mensaje</span><div class="ct area ph">Escribí un mensaje como lo mandaría una persona</div></div>')
    seg = f'<span class="ab-seg"><span class="{"on" if bandeja == "Clientes" else ""}">Clientes</span><span class="{"on" if bandeja == "Internos" else ""}">Internos</span></span>'
    entrada = f'<div class="pr-in"><div class="w-cmp"><span class="rt">Bandeja</span>{seg}</div>{msj}{b_probar(modo)}</div>'
    if prueba and modo == "listo":
        acciones = "".join(f'<div class="pr-ac"><span class="n">{k}</span><div class="tx"><b>{que}</b>{vista}{pr_grilla(caso, uso, por)}</div></div>'
                           for k, (que, caso, vista, por, uso) in enumerate(PRUEBAS[prueba][1], 1))
        res = f'<div class="pr-res"><span class="pr-t">Lo que haría</span>{acciones}<span class="pr-nada">{CHECK} No se mandó nada.</span></div>'
    elif modo == "probando":
        res = '<div class="pr-vacio">Probando con lo guardado…</div>'
    else:
        res = ""
    return (f'<aside class="w-caja pr-caja" aria-label="Probar"><div class="f-cab"><span class="tt">Probar{info(AY_PROBAR)}</span></div>'
            f'{entrada}{res}</aside>')


def cuerpo(sel, contenido, pr=None, sup=""):
    pr = pr if pr is not None else probar()
    return f'<div class="w-body as23b">{sup}{tabs(sel)}<div class="f-cols as23"><div class="f-pila">{contenido}</div>{pr}</div></div>'


# ================================================================ Casos: los propios, el bloque de formularios y «Cualquier otra cosa»
AY_CASOS = "Usa el primero que encaja, en este orden. Las acciones son siempre estas seis."
AY_FORMS = "Los formularios publicados que dicen cuándo ofrecerlos. Se cambia en cada formulario."
AY_OTRA = "Lo que no encaja en ningún caso ni formulario. No se borra."
AY_CUANDO = "Contalo como se lo explicarías a un compañero: el asistente lo lee para decidir."


def fila_caso(k, cuando, para, accion, extra, activo, abierta=""):
    sub = f"{para} · {accion}" + (f" · {extra}" if extra else "")
    chips = '<span class="ab-chip">Inactivo</span>' if not activo else ""
    fila = (f'<div class="q-it{"" if activo else " off"}"><span class="num">{k}</span><span class="dato"><b>{cuando}</b><span>{sub}</span></span>'
            f'<span class="chips">{chips}</span>{E.acciones_q(f"el caso {k}", k == 1, k == len(CASOS))}</div>')
    return f'<div class="q-ab">{fila}{abierta}</div>' if abierta else fila


def menu_acciones(sel):
    items = "".join(f'<span role="option" class="{"on" if a == sel else ""}">{a}</span>' for a in ACCIONES)
    return f'<div class="rg2-menu" role="listbox" aria-label="Qué hacer" style="top: 64px; left: 0; right: auto; width: 300px;">{items}</div>'


def editor_caso(k, accion, mal=False, menu=False, nuevo=False):
    """El caso abierto en el lugar, como una pregunta: cuándo, para quién, el tipo de entrada, qué hacer y lo que pide esa acción."""
    cuando = CASOS[k - 1][0] if not nuevo else ""
    c_cuando = (area("Cuándo", "Escribí cuándo aplica", mal="Escribí cuándo aplica este caso.", ph=True, ayuda=AY_CUANDO) if mal
                else area("Cuándo", cuando or "Escribí cuándo aplica", ph=not cuando, ayuda=AY_CUANDO))
    para = CASOS[k - 1][1] if not nuevo else "Clientes"
    sel_que = f'<div class="w-cmp rg-sel ancho"><span class="rt">Qué hacer <span class="req">*</span></span><div class="ct sel" style="display: flex; justify-content: space-between;">{accion}{CHEV}</div>{menu_acciones(accion) if menu else ""}</div>'
    if accion == "Preguntar con botones":
        bts = BOTONES + (["Para una obra en construcción"] if mal else [])
        filas = "".join(f'<div class="as23-bt"><div class="ct{" mal" if (mal and i == 2) else ""}">{b}</div><button type="button" class="ib" aria-label="Quitar {b}">{QUITAR}</button></div>'
                        for i, b in enumerate(bts))
        err = '<span class="err2" role="alert">El botón 3 tiene más de 20 caracteres.</span>' if mal else ""
        extra = (area("Pregunta", PREG_BOTONES) + '<div class="w-cmp ancho"><span class="rt">Botones <span class="req">*</span>' + info("Hasta 3. Cada uno, hasta 20 caracteres.")
                 + f'</span><div class="as23-bts">{filas}</div>{err}'
                 + (f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar botón</button>' if len(bts) < 3 else "") + "</div>")
    elif accion == "Responder con un texto exacto":
        extra = area("Texto", TEXTO_PEDIDO)
    elif accion == "Mandar un formulario":
        extra = selc("Formulario", "Pedido de service", ancho=True)
    elif accion == "Derivar":
        extra = f'<div class="w-cmp ancho"><span class="rt">Manda</span><div class="ct ro">{DERIVAR}</div><span class="dato2">El mensaje al derivar, del perfil</span></div>'
    else:
        extra = ""
    activo = CASOS[k - 1][4] if not nuevo else True
    return ('<div class="as23-ed">' + c_cuando + selc("Para quién", para) + selc("Tipo de entrada", "Texto o audio") + sel_que + extra
            + f'<div class="w-cmp ancho" style="flex-direction: row; justify-content: space-between; align-items: center;">{chk("Activo", activo)}'
            + '<span class="q-pie"><button type="button" class="cb cb-sec">Listo</button></span></div></div>')


def caja_casos(abierto=None, accion=None, mal=False, menu=False, nuevo=False):
    filas = ""
    for k, (cuando, para, accion_k, extra, activo) in enumerate(CASOS, 1):
        ed = editor_caso(k, accion or accion_k, mal, menu) if (abierto == k and not nuevo) else ""
        filas += fila_caso(k, cuando, para, accion or accion_k if abierto == k else accion_k, extra, activo, ed)
    if nuevo:
        fila_n = (f'<div class="q-it"><span class="num">{len(CASOS) + 1}</span><span class="dato"><b>Caso nuevo</b><span>Clientes · Responder con el conocimiento</span></span>'
                  f'<span class="chips"></span>{E.acciones_q("el caso nuevo", False, True)}</div>')
        filas += f'<div class="q-ab">{fila_n}{editor_caso(1, "Responder con el conocimiento", nuevo=True)}</div>'
    der = f'<button type="button" class="cb cb-sec">{MAS} Agregar caso</button>'
    return caja("Casos", filas, AY_CASOS, der)


def caja_forms():
    filas = "".join(f'<div class="q-it fijo"><span class="num">{F.ICONO}</span><span class="dato"><b>{n}</b><span>{p} · {c}</span></span><span class="chips"></span>'
                    f'<a class="fin lnk" href="FRM-Editor-Asistente.dc.html">Abrir</a></div>' for n, p, c in OFRECE)
    return caja("Formularios", filas, AY_FORMS, '<span class="dato2">3 formularios</span>')


def caja_otra(accion="Responder con el conocimiento", abierta=False):
    fila = (f'<div class="q-it"><span class="num">{len(CASOS) + 1}</span><span class="dato"><b>Cualquier otra cosa</b><span>Clientes y empleados · {accion}</span></span><span class="chips"></span>'
            f'<span class="q-acc2"><button type="button" class="ib" aria-label="Editar Cualquier otra cosa">{LAPIZ}</button></span></div>')
    if abierta:
        ed = ('<div class="as23-ed">' + f'<div class="w-cmp rg-sel ancho"><span class="rt">Qué hacer <span class="req">*</span></span><div class="ct sel" style="display: flex; justify-content: space-between;">{accion}{CHEV}</div></div>'
              + '<div class="w-cmp ancho" style="align-items: flex-end;"><span class="q-pie"><button type="button" class="cb cb-sec">Listo</button></span></div></div>')
        fila = f'<div class="q-ab">{fila}{ed}</div>'
    return caja("Cualquier otra cosa", fila, AY_OTRA)


def contenido_casos(**k):
    otra = k.pop("otra", {})
    return caja_casos(**k) + caja_forms() + caja_otra(**otra)


# ================================================================ Perfil
AY_TONO = "Cómo escribe: cercano, con vos; formal, con usted."
AY_NOSABE = "Lo de la organización lo contesta solo si está cargado. Si falta, pregunta para entender, dice que lo consulta y deriva."
AY_DERIVAR = "Lo manda al pasar el chat a una persona, siempre igual."


def contenido_perfil(vacio=False, mal=False):
    if vacio:
        uno = (campo("Nombre", "Por ejemplo, Delta", ph=True, mal="Escribí un nombre." if mal else "") + selc("Tono", "Elegí un tono", ph=True, ayuda=AY_TONO)
               + area("Presentación", "Cómo se presenta en el primer mensaje", ph=True))
        dos = area("Qué hace", "Qué consultas atiende y qué formularios manda", ph=True) + area("Qué no hace", "Lo que no tiene que hacer nunca", req=False, ph=True)
        tres = selc("Cuando no sabe", "Preguntar para entender y derivar", ayuda=AY_NOSABE, ancho=True) + area("Mensaje al derivar", "El mensaje que manda al pasar el chat a una persona", ph=True, ayuda=AY_DERIVAR)
    else:
        uno = campo("Nombre", "Delta") + selc("Tono", "Cercano", ayuda=AY_TONO) + area("Presentación", PRESENTACION)
        dos = (area("Qué hace", "Responde consultas de clientes sobre heladeras, envíos y service, y manda los formularios para pedir un service.")
               + area("Qué no hace", "No da precios de reparaciones ni promete fechas de entrega.", req=False))
        tres = selc("Cuando no sabe", "Preguntar para entender y derivar", ayuda=AY_NOSABE, ancho=True) + area("Mensaje al derivar", DERIVAR, ayuda=AY_DERIVAR)
    return (caja("El asistente", f'<div class="as23-g">{uno}</div>') + caja("Qué hace y qué no", f'<div class="as23-g">{dos}</div>')
            + caja("Cuando no sabe", f'<div class="as23-g">{tres}</div>'))


# ================================================================ Conocimiento: la información del negocio, por secciones (46)
AY_SECCION = "Una sección vacía no se usa: si le preguntan por eso, consulta y deriva."
FAQ = [("¿Hacen service a domicilio?", "Sí, en CABA y Gran Buenos Aires, de lunes a viernes."),
       ("¿Qué garantía tienen las heladeras?", "Un año, del fabricante."),
       ("¿Cómo puedo pagar?", "En efectivo, con transferencia o con tarjeta de débito.")]


# El horario, como «Información del negocio» de ArquitecturaBase (169): cada día dice «Sin definir», «Abierto», «Cerrado» o «24 horas»; abierto,
# lleva hasta cuatro franjas de 15 en 15 minutos, «Agregar franja» debajo y la papelera en cada una cuando hay más de una; una franja que termina
# después de la medianoche lo dice con «Cierra al día siguiente». «Aplicar de lunes a viernes» copia el lunes a los días hábiles, y una fecha
# especial reemplaza su día. Las horas van en la zona horaria de la organización: no hay una zona propia del horario. La dirección se escribe.
DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
FR_DIA, FR_SAB = [("09:00", "18:00", False)], [("09:00", "13:00", False)]
FR_DOS = [("09:00", "13:00", False), ("14:00", "18:00", False)]
HORARIO = {d: ("Abierto", FR_DIA) for d in DIAS[:5]} | {"Sábado": ("Abierto", FR_SAB), "Domingo": ("Cerrado", [])}
FECHAS_ESP = [("24/12/2026", "Abierto", [("09:00", "13:00", False)])]
AY_HORARIO = "Las horas van en la zona horaria de la organización. Una fecha especial reemplaza el horario de su día."
PISAN = "Hay franjas superpuestas. Revisá también las que cierran al día siguiente."
PRODUCTOS = "Heladeras familiares y comerciales, freezers y exhibidoras. Service a domicilio y repuestos originales."
POLITICAS = "El diagnóstico a domicilio se cobra y se descuenta si se hace la reparación. Las reparaciones tienen 90 días de garantía."


def hora(h, mal=False):
    return f'<div class="ct sel hz-h{" mal" if mal else ""}">{h}{CHEV}</div>'


def franjas(dia, lista, mal=False):
    """Las franjas de un día abierto: «Desde – Hasta», la papelera si hay más de una y «Agregar franja» debajo.
    mal: dos franjas que se pisan; se marcan las dos horas que chocan (el cierre de la primera y la apertura de la segunda)."""
    h = ""
    for k, (desde, hasta, sig) in enumerate(lista, 1):
        quitar = (f'<button type="button" class="ib" aria-label="Quitar la franja {k} del {dia.lower()}">{QUITAR}</button>' if len(lista) > 1 else "")
        h += f'<div class="hz-f">{hora(desde, mal and k == 2)}<span class="a">–</span>{hora(hasta, mal and k == 1)}{quitar}</div>'
        if sig:
            h += f'<div class="hz-sig">{chk("Cierra al día siguiente")}</div>'
    h += f'<button type="button" class="cb cb-enl hz-add" aria-label="Agregar franja · {dia}">Agregar franja</button>'
    return f'<div class="hz-fs">{h}</div>'


def dia_fila(dia, estado, lista, mal=""):
    sel = f'<div class="ct sel hz-e">{estado}{CHEV}</div>'
    fr = franjas(dia, lista, bool(mal)) if estado == "Abierto" else "<span></span>"
    err = f'<span class="err2 hz-err" role="alert">{mal}</span>' if mal else ""
    return f'<div class="hz-d"><span class="dia">{dia}</span>{sel}{fr}{err}</div>'


def fechas_especiales(fechas=FECHAS_ESP):
    filas = "".join(f'<div class="hz-fe"><span class="fe">{f}</span><span>{est}' + (" · " + ", ".join(f"{a}–{b}" for a, b, _s in fr) if fr else "") + "</span>"
                    f'<span class="ac"><button type="button" class="cb cb-enl">Editar</button><button type="button" class="ib" aria-label="Quitar el {f}">{QUITAR}</button></span></div>'
                    for f, est, fr in fechas) if fechas else '<span class="hz-vac">Sin fechas especiales.</span>'
    return (f'<div class="hz-esp"><b>Feriados y fechas especiales</b>{filas}'
            f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar fecha especial</button></div>')


def caja_horario(cambios=None, mal=None):
    """cambios: {día: (estado, franjas)} sobre el horario de siempre; mal: (día, error) que se marca en ese día, al intentar guardar."""
    hz = HORARIO | (cambios or {})
    dias = "".join(dia_fila(d, *hz[d], mal=(mal[1] if mal and mal[0] == d else "")) for d in DIAS)
    cuerpo = (f'<div class="hz">{dias}<div class="hz-cp"><button type="button" class="cb cb-sec">Aplicar de lunes a viernes</button></div>'
              f'{fechas_especiales()}</div>')
    return caja("Horario de atención", cuerpo, AY_HORARIO)


def dlg_fecha():
    """«Agregar fecha especial»: la fecha y su horario, que reemplaza el de ese día."""
    cuerpo = (f'<div class="w-cmp"><span class="rt">Fecha <span class="req">*</span></span><div class="ct">24/12/2026</div></div>'
              f'<div class="w-cmp"><span class="rt">Atención</span><div class="ct sel hz-e">Abierto{CHEV}</div></div>'
              f'<div class="w-cmp"><span class="rt">Franjas</span>{franjas("24/12/2026", [("09:00", "13:00", False)])}</div>')
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Agregar fecha</button>'
    return F.dialogo("Horario de una fecha especial", cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg hz-dlg"', 1)


def contenido_conocimiento(zona_vacia=False, faq_abierta=False, horario=None, mal=None, desde=None):
    """desde: la sección con la que arranca lo que se ve, como la página corrida hasta ahí con las pestañas a la vista ("horario" o "servicios")."""
    datos = '<div class="as23-g">' + campo("Nombre del negocio", "Grupo Delta") + area("Qué hace el negocio", "Venta y service de heladeras familiares y comerciales.", ancho=False) + "</div>"
    if zona_vacia:
        ubic = ('<div class="as23-g">' + selc("Dónde atendés", "Elegí una opción", req=False, ph=True) + campo("Dirección del local", "Opcional", req=False, ph=True)
                + area("Zona de atención o entrega", "Opcional", req=False, ph=True) + "</div>")
        chip_u = '<span class="ab-chip vac">Vacía · no se usa</span>'
    else:
        ubic = ('<div class="as23-g">' + selc("Dónde atendés", "Local y zona de atención", req=False) + campo("Dirección del local", "Av. Rivadavia 4520, CABA", req=False)
                + campo("Referencia para llegar", "Frente a la plaza.", req=False) + area("Zona de atención o entrega", ZONA, req=False, ancho=False) + "</div>")
        chip_u = ""
    servicios = '<div class="as23-g">' + area("Productos y servicios", PRODUCTOS, req=False, ancho=False) + area("Políticas y condiciones", POLITICAS, req=False, ancho=False) + "</div>"
    faq = ""
    for k, (p, r) in enumerate(FAQ, 1):
        fila = (f'<div class="q-it"><span class="num">{k}</span><span class="dato"><b>{p}</b><span>{r}</span></span><span class="chips"></span>'
                f'{E.acciones_q(f"la pregunta {k}", k == 1, k == len(FAQ))}</div>')
        if faq_abierta and k == 1:
            fila = f'<div class="q-ab">{fila}<div class="as23-ed">{area("Pregunta", p)}{area("Respuesta", r)}<div class="w-cmp ancho" style="align-items: flex-end;"><span class="q-pie"><button type="button" class="cb cb-sec">Listo</button></span></div></div></div>'
        faq += fila
    agregar = f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button>'
    secciones = [("datos", caja("Datos del negocio", datos, AY_SECCION)), ("ubicacion", caja("Ubicación y zona de atención", ubic, chip=chip_u)),
                 ("horario", caja_horario(horario, mal)), ("servicios", caja("Servicios y condiciones", servicios)),
                 ("faq", f'<div class="as23-faq">{caja("Preguntas frecuentes", faq, der=agregar)}</div>')]
    k = [s for s, _h in secciones].index(desde) if desde else 0
    return "".join(h for _s, h in secciones[k:])


# ================================================================ Límites, uno por bandeja (65), con el tope de ofrecimientos (66)
AY_BANDEJA = "Cada bandeja tiene los suyos: con los clientes se puede ser más estricto que con los empleados."
AY_OFRECE = "Cuántas veces por día ofrece un formulario en una misma conversación."


def bandeja(sel="Clientes", ayuda=AY_BANDEJA):
    seg = f'<span class="ab-seg"><span class="{"on" if sel == "Clientes" else ""}">Clientes</span><span class="{"on" if sel == "Internos" else ""}">Internos</span></span>'
    return f'<div class="as23-bandeja"><span class="rt">Bandeja{info(ayuda)}</span>{seg}</div>'


def contenido_limites(sel="Clientes", mal=False):
    clientes = sel == "Clientes"
    temas = "Precios de reparaciones y diagnósticos técnicos." if clientes else "Sueldos y temas personales."
    promete = "Fechas de entrega, descuentos ni reintegros." if clientes else "Cambios de turno ni adelantos."
    no = '<div class="as23-g">' + area("Temas que no responde", temas, req=False, ancho=False) + area("Lo que no puede prometer", promete, req=False, ancho=False) + "</div>"
    largo = "700" if mal else ("400" if clientes else "600")
    topes = ('<div class="as23-g">' + numero("Largo máximo de la respuesta", largo, "caracteres", "600", "Hasta 600, el máximo de la plataforma." if mal else "")
             + numero("Respuestas por conversación y día", "20" if clientes else "30", "respuestas", "30")
             + numero("Formularios que ofrece por conversación y día", "2" if clientes else "3", "ofrecimientos", "3", ayuda=AY_OFRECE) + "</div>")
    acciones = '<div class="as23-chk">' + "".join(
        chk(a, on=(a != "Preguntar con botones" or clientes), apagado="Siempre puede derivar." if a == "Derivar" else "") for a in ACCIONES) + "</div>"
    return bandeja(sel) + caja("Lo que no responde", no) + caja("Topes", topes) + caja("Acciones que puede usar", acciones)


# ================================================================ Atención, por bandeja (52)
AY_QUIEN = "Cada chat se puede cambiar a mano. En Clientes, con una persona, primero responde el bot del menú."
AY_VUELVE = "Después de que lo tomó una persona. Un chat fijado no vuelve solo."


def contenido_atencion(sel="Clientes", quien=0, vuelve=0):
    q = radio(["El asistente", "Una persona"], quien)
    minutos = '<div class="ct">30</div><span class="ad">minutos sin mensajes</span>'
    v = radio([f"Pasado un tiempo: {minutos}", "Al marcarlo «Resuelto»", "Nunca"], vuelve)
    return bandeja(sel, "Quién atiende cada bandeja y cuándo vuelve un chat.") + caja("Quién atiende los chats nuevos", q, AY_QUIEN) + caja("Cuándo vuelve un chat al asistente", v, AY_VUELVE)


# ================================================================ WA-Asistente: la pantalla, con Perfil, Conocimiento, Casos, Límites y Atención
E_AS = ["Casos", "Perfil", "Sin perfil", "Sin perfil: faltan los datos", "Con cambios", "Guardando", "Guardado", "Otra persona guardó", "Descartar los cambios", "Cargando"]
CARGANDO = ('<div class="w-body"><div class="f-cuerpo izq"><div class="esq"><span style="width: 60%;"></span><span style="width: 80%;"></span>'
            '<span style="width: 70%;"></span></div></div></div>')


def asistente():
    sin_perfil_casos = {"otra": {"accion": "No responder"}}
    V = {"Casos": (banda(), cuerpo("casos", contenido_casos())),
         "Perfil": (banda(), cuerpo("perfil", contenido_perfil())),
         "Sin perfil": (banda("limpio", "Sin guardar"), cuerpo("perfil", contenido_perfil(vacio=True), probar(modo="sucio"))),
         "Sin perfil: faltan los datos": (banda("sucio", "Sin guardar"), cuerpo("perfil", contenido_perfil(vacio=True, mal=True), probar(modo="sucio"))),
         "Con cambios": (banda("sucio"), cuerpo("perfil", contenido_perfil(), probar("hola", modo="sucio"))),
         "Guardando": (banda("guardando"), cuerpo("perfil", contenido_perfil(), probar("hola", modo="sucio"))),
         "Guardado": (banda("limpio", f"Guardado el {HOY} 10:44 · Lucía Fernández"), cuerpo("perfil", contenido_perfil())),
         "Otra persona guardó": (banda("sucio"), cuerpo("perfil", contenido_perfil(), probar(modo="sucio"))),
         "Descartar los cambios": (banda("sucio"), cuerpo("perfil", contenido_perfil(), probar(modo="sucio"))),
         "Cargando": (F.banda("Asistente", "", "").replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{BOT}</span>', 1), CARGANDO)}
    del sin_perfil_casos
    capas = {"Guardado": A.toast("Guardamos el asistente."),
             "Otra persona guardó": A.toast("El asistente cambió mientras lo editabas. Revisá la versión guardada.", "mal", '<button type="button" class="cb cb-sec">Revisar</button>'),
             "Descartar los cambios": A.confirmar("¿Descartar los cambios?", "Vas a perder lo que cambiaste sin guardar.", "Descartar", cancelar="Seguir editando")}
    return pagina_wa(V, capas, E_AS, "Asistente · /org/whatsapp/asistente", "Inicio / WhatsApp / Asistente", alto=1300)


# ================================================================ WA-Asistente-Casos: los casos, abiertos en el lugar
E_CA = ["Casos", "Editar un caso", "Qué hacer: menú", "Preguntar con botones", "Responder con un texto exacto", "Mandar un formulario", "Derivar",
        "Un caso nuevo", "Un caso con errores", "Cualquier otra cosa", "Sin perfil: no responder"]


def asistente_casos():
    m = {"Casos": {}, "Editar un caso": {"abierto": 1}, "Qué hacer: menú": {"abierto": 1, "menu": True},
         "Preguntar con botones": {"abierto": 2}, "Responder con un texto exacto": {"abierto": 3}, "Mandar un formulario": {"abierto": 1, "accion": "Mandar un formulario"},
         "Derivar": {"abierto": 4}, "Un caso nuevo": {"nuevo": True}, "Un caso con errores": {"abierto": 2, "mal": True},
         "Cualquier otra cosa": {"otra": {"abierta": True}}, "Sin perfil: no responder": {"otra": {"accion": "No responder"}}}
    sucio = {"Casos", "Sin perfil: no responder"}
    V = {}
    for e in E_CA:
        b = banda("limpio") if e in sucio else banda("sucio")
        pr = probar("envios") if e == "Casos" else probar(modo="sucio")
        if e == "Sin perfil: no responder":
            b, pr = banda("limpio", "Sin guardar"), probar(modo="sucio")
        V[e] = (b, cuerpo("casos", contenido_casos(**m[e]), pr))
    return pagina_wa(V, {}, E_CA, "Asistente · Casos · /org/whatsapp/asistente", "Inicio / WhatsApp / Asistente", alto=1300)


# ================================================================ WA-Asistente-Probar: lo que haría, en orden, y «No se mandó nada»
E_PR = ["¿Hacen envíos a Córdoba?", "Se rompió la heladera", "Quiero hablar con alguien", "Hola y la hora", "Probando", "Con cambios sin guardar", "Tope de IA agotado"]


def asistente_probar():
    pr = {"¿Hacen envíos a Córdoba?": probar("envios"), "Se rompió la heladera": probar("heladera"), "Quiero hablar con alguien": probar("persona"),
          "Hola y la hora": probar("hola"), "Probando": probar("envios", "probando"), "Con cambios sin guardar": probar("envios", "sucio"),
          "Tope de IA agotado": probar("envios", "tope-tip")}
    V = {e: (banda("sucio" if e == "Con cambios sin guardar" else "limpio"), cuerpo("casos", contenido_casos(), pr[e])) for e in E_PR}
    return pagina_wa(V, {}, E_PR, "Asistente · Probar · /org/whatsapp/asistente", "Inicio / WhatsApp / Asistente", alto=1300)


# ================================================================ WA-Asistente-Limites: Límites y Conocimiento, que se editan ahí
E_LI = ["Límites: Clientes", "Límites: Internos", "Sobre el máximo", "Conocimiento", "Una sección vacía", "Un día con dos franjas", "Un día de 24 horas",
        "Una franja que pasa la medianoche", "Dos franjas que se pisan", "Aplicar de lunes a viernes", "Una fecha especial", "Editar una pregunta frecuente"]
# El horario de cada estado, sobre el de siempre (lunes a viernes de 9 a 18, sábado de 9 a 13 y domingo cerrado)
HZ = {"Un día con dos franjas": {"Lunes": ("Abierto", FR_DOS)}, "Un día de 24 horas": {"Sábado": ("24 horas", [])},
      "Una franja que pasa la medianoche": {"Viernes": ("Abierto", FR_DIA + [("20:00", "00:30", True)])},
      "Dos franjas que se pisan": {"Lunes": ("Abierto", [("09:00", "13:00", False), ("12:00", "18:00", False)])},
      "Aplicar de lunes a viernes": {d: ("Abierto", FR_DOS) for d in DIAS[:5]}, "Una fecha especial": {}}


def asistente_limites():
    sucio = lambda c: (banda("sucio"), cuerpo("conocimiento", c, probar(modo="sucio")))  # noqa: E731
    V = {"Límites: Clientes": (banda(), cuerpo("limites", contenido_limites())),
         "Límites: Internos": (banda(), cuerpo("limites", contenido_limites("Internos"))),
         "Sobre el máximo": (banda("sucio"), cuerpo("limites", contenido_limites(mal=True), probar(modo="sucio"))),
         "Conocimiento": (banda(), cuerpo("conocimiento", contenido_conocimiento(), probar("envios"))),
         "Una sección vacía": sucio(contenido_conocimiento(zona_vacia=True)),
         "Editar una pregunta frecuente": sucio(contenido_conocimiento(faq_abierta=True, desde="servicios"))}
    for e, hz in HZ.items():
        mal = ("Lunes", PISAN) if e == "Dos franjas que se pisan" else None
        V[e] = sucio(contenido_conocimiento(horario=hz, mal=mal, desde="horario"))
    capas = {"Una fecha especial": dlg_fecha()}
    return pagina_wa({e: V[e] for e in E_LI}, capas, E_LI, "Asistente · Límites y conocimiento · /org/whatsapp/asistente", "Inicio / WhatsApp / Asistente", alto=1300)


# ================================================================ WA-Modo-Atencion: quién atiende y cuándo vuelve, por bandeja (52)
E_AT = ["Clientes", "Internos", "Una persona atiende", "Al marcarlo «Resuelto»", "Guardando", "Guardado"]


def modo_atencion():
    V = {"Clientes": (banda(), cuerpo("atencion", contenido_atencion())),
         "Internos": (banda(), cuerpo("atencion", contenido_atencion("Internos", 0, 0))),
         "Una persona atiende": (banda("sucio"), cuerpo("atencion", contenido_atencion(quien=1), probar(modo="sucio"))),
         "Al marcarlo «Resuelto»": (banda("sucio"), cuerpo("atencion", contenido_atencion(vuelve=1), probar(modo="sucio"))),
         "Guardando": (banda("guardando"), cuerpo("atencion", contenido_atencion(vuelve=1), probar(modo="sucio"))),
         "Guardado": (banda("limpio", f"Guardado el {HOY} 10:44 · Lucía Fernández"), cuerpo("atencion", contenido_atencion(vuelve=1)))}
    capas = {"Guardado": A.toast("Guardamos el asistente.")}
    return pagina_wa(V, capas, E_AT, "Asistente · Atención · /org/whatsapp/asistente", "Inicio / WhatsApp / Asistente", alto=1000)


# ================================================================ WA-Preguntas-Sin-Respuesta: por tema, sin nombres ni mensajes (67)
TEMAS = [("Envíos al interior", "Si hacen envíos fuera de CABA y Gran Buenos Aires.", 4, 3, f"{HOY} 10:22"),
         ("Cuotas", "Si se puede pagar en cuotas con tarjeta de crédito.", 2, 2, f"{AYER} 16:40"),
         ("Repuestos", "Si venden repuestos sueltos, como burletes.", 1, 1, "25/09/2026 11:05")]
DESCARTADOS = [("Búsquedas laborales", "Si toman personal.", 2, 2, "Descartado por Lucía Fernández · 20/09/2026 10:00")]
AY_PREGUNTAS = "Lo que preguntaron y no estaba en el conocimiento. Se agrupa por tema, sin nombres ni mensajes."


def fila_tema(t, menu=False, descartado=False):
    n, d, preg, per, ult = t
    items = (f'<a class="f-mi" role="menuitem" href="WA-Asistente-Limites.dc.html">{LAPIZ} Completar el conocimiento</a>'
             + ("" if descartado else f'<span class="f-sep" role="separator"></span><span class="f-mi pel" role="menuitem">{QUITAR} Descartar</span>'))
    m = f'<div class="f-menu" role="menu" aria-label="Acciones de {n}">{items}</div>' if menu else ""
    return (f'<div class="w-tr pq"><span class="k-tc"><b>{n}</b><small>{d}</small></span><span class="num">{preg}</span><span class="num">{per}</span>'
            f'<span>{ult}</span><span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>{m}</div>')


OPS_PQ = [("Pendientes", 3), ("Descartados", 1)]
E_PQ = ["Pendientes", "Acciones de un tema", "Descartar un tema", "Estado: menú", "Descartados", "Vacío", "Cargando", "No se pudo cargar"]


def preguntas():
    def barra(sel=0, abierta=False, tot="3 temas"):
        return f'<div class="w-caja o-fb"><span class="w-bus">{F.BUSCAR} Buscar por tema</span>{B.pildora("Estado", OPS_PQ, sel, abierta)}<span class="tot">{tot}</span></div>'
    cab = ('<div class="w-th pq"><span>Tema</span><span>Preguntas</span><span>Personas</span><span>Última pregunta</span><span class="sr">Acciones</span></div>')

    def tabla(filas, n):
        return f'<div class="w-caja pqc">{cab}{filas}<div class="w-pie"><span>1–{n} de {n}</span><span>10 por página · Página 1 de 1</span></div></div>'
    pend = "".join(fila_tema(t) for t in TEMAS)
    caja_txt = lambda tx: f'<div class="w-caja"><div class="pl-vacio2">{tx}</div></div>'  # noqa: E731
    esq = ('<div class="w-caja"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span>'
           '<span style="width: 72%;"></span></div></div></div>')
    cu = {"Pendientes": barra() + tabla(pend, 3), "Acciones de un tema": barra() + tabla("".join(fila_tema(t, k == 0) for k, t in enumerate(TEMAS)), 3),
          "Descartar un tema": barra() + tabla(pend, 3), "Estado: menú": barra(abierta=True) + tabla(pend, 3),
          "Descartados": barra(1, tot="1 tema") + tabla("".join(fila_tema(t, descartado=True) for t in DESCARTADOS), 1),
          "Vacío": caja_txt("<b>No hay preguntas sin respuesta.</b>"), "Cargando": barra(tot="") + esq,
          "No se pudo cargar": barra(tot="") + caja_txt('<b>No pudimos cargar las preguntas.</b><button type="button" class="cb cb-sec">Reintentar</button>')}
    sub = {"Descartados": "1 tema descartado", "Vacío": "Sin preguntas", "Cargando": "", "No se pudo cargar": ""}
    tit = "Preguntas sin respuesta" + info(AY_PREGUNTAS)
    V = {e: (F.banda(tit, sub.get(e, "3 temas · 7 preguntas"), "").replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{PREGUNTA}</span>', 1),
             f'<div class="w-body">{cu[e]}</div>') for e in E_PQ}
    capas = {"Descartar un tema": A.confirmar("¿Descartar «Envíos al interior»?", "Pasa a Descartados. Si lo vuelven a preguntar, aparece de nuevo en Pendientes.", "Descartar")}
    return pagina_wa(V, capas, E_PQ, "Preguntas sin respuesta · /org/whatsapp/preguntas", "Inicio / WhatsApp / Preguntas sin respuesta", activo="preguntas")


# ================================================================ Los teléfonos de la pantalla «Asistente» y de las preguntas
CSS_T23 = """.t23-tabs { display: flex; gap: 6px; padding: 10px 16px; overflow-x: auto; border-bottom: 1px solid var(--borde); flex-shrink: 0; background: #fff; }
.t23-tabs span { flex: none; padding: 7px 12px; border-radius: 8px; border: 1px solid var(--borde); font-size: 14px; color: var(--t2); background: #fff; }
.t23-tabs span.on { background: var(--marca-t); border-color: oklch(0.51 0.099 195 / 0.35); color: var(--marca-tx); font-weight: 600; }
.t23-gtit { display: flex; align-items: center; justify-content: space-between; margin: 16px 16px 6px; font-size: 15px; font-weight: 600; }
.t23-gtit a { font-size: 14px; font-weight: 500; color: var(--marca-tx); text-decoration: none; }
.t23-hb { display: flex; flex-direction: column; gap: 14px; padding: 14px 16px 100px; }
.t23-ac { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; font-size: 14px; }
.t23-ac .caso, .t23-ac .uso { font-size: 13px; color: var(--t3); }
.t23-ac .por { font-size: 13.5px; color: var(--t2); line-height: 1.4; }
.t23-nada { display: inline-flex; gap: 6px; align-items: center; font-size: 14px; color: var(--t2); }
.t23-nada svg { color: var(--marca-tx); }
.ap-fila .tx .l2 { white-space: normal; }
.t23-ac .pr-g { font-size: 13.5px; }
.t23-hz { display: flex; flex-direction: column; padding: 0 16px; background: #fff; border-top: 1px solid var(--borde); border-bottom: 1px solid var(--borde); }
.t23-dia { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--borde); }
.t23-dia:last-child { border-bottom: 0; }
.t23-dia .h { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 15px; font-weight: 500; }
.t23-sel { display: flex; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; height: 40px; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; font-size: 15px; font-weight: 400; color: var(--t1); }
.t23-sel svg { color: var(--t3); flex-shrink: 0; }
.t23-dia .h .t23-sel { width: 150px; }
.t23-fr { display: flex; align-items: center; gap: 8px; }
.t23-fr .t23-sel { flex: 1; font-variant-numeric: tabular-nums; }
.t23-fr .a { color: var(--t3); }
.t23-add { align-self: flex-start; font-size: 14px; font-weight: 500; color: var(--marca-tx); text-decoration: none; }
.t23-sig .q-chk, .hz-sig .q-chk { display: inline-flex; align-items: center; gap: 8px; }
.t23-sig .q-chk { font-size: 14px; color: var(--t2); }
.t23-sig .q-chk i, .hz-sig .q-chk i { width: 16px; height: 16px; flex: none; border-radius: 4px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.t23-sig .q-chk i svg, .hz-sig .q-chk i svg { width: 12px; height: 12px; }
.t23-cp { padding: 12px 16px 0; }
.t23-cp .cb { width: 100%; height: 44px; justify-content: center; }
.t23-fe { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 12px 16px; font-size: 15px; background: #fff; border-bottom: 1px solid var(--borde); }
.t23-fe:first-of-type { border-top: 1px solid var(--borde); }
.t23-fe .fe { font-variant-numeric: tabular-nums; }
.t23-fe .ap-ib { width: 36px; height: 36px; }
.t23-mas { display: inline-flex; align-items: center; gap: 6px; margin: 12px 16px 0; font-size: 15px; font-weight: 500; color: var(--marca-tx); text-decoration: none; }
"""


def t_tabs(sel):
    return '<div class="t23-tabs" role="tablist">' + "".join(f'<span class="{"on" if k == sel else ""}" role="tab">{t}</span>' for k, t, _h in PESTANAS) + "</div>"


def t_fila(t1, t2, extra=""):
    return f'<div class="ap-fila"><div class="tx"><span class="l1">{t1}</span><span class="l2">{t2}</span></div>{extra}</div>'


def t_sel(valor):
    return f'<div class="t23-sel">{valor}{U.CHEV_CAMPO}</div>'


def t_franjas(dia, lista):
    fr = ""
    for k, (desde, hasta, sig) in enumerate(lista, 1):
        quitar = (f'<button type="button" class="ap-ib" aria-label="Quitar la franja {k} del {dia.lower()}">{QUITAR}</button>' if len(lista) > 1 else "")
        fr += f'<div class="t23-fr">{t_sel(desde)}<span class="a">–</span>{t_sel(hasta)}{quitar}</div>'
        if sig:
            fr += f'<div class="t23-sig">{chk("Cierra al día siguiente")}</div>'
    return fr + f'<a class="t23-add" href="#" aria-label="Agregar franja · {dia}">Agregar franja</a>'


def t_dia(dia, estado, lista):
    """Un día en el teléfono: el día y su estado arriba; abierto, sus franjas debajo, con «Agregar franja» (como allá a 390, apilado)."""
    fr = t_franjas(dia, lista) if estado == "Abierto" else ""
    return f'<div class="t23-dia"><div class="h"><span>{dia}</span>{t_sel(estado)}</div>{fr}</div>'


def t_horario(cambios=None, desde=None):
    """desde: el día con el que arranca lo que se ve, como la lista corrida hasta ahí (sin el título de la sección, que quedó arriba)."""
    hz = HORARIO | (cambios or {})
    fechas = "".join(f'<div class="t23-fe"><span class="fe">{f}</span><span>{est}' + (" · " + ", ".join(f"{a}–{b}" for a, b, _s in fr) if fr else "") + "</span>"
                     f'<button type="button" class="ap-ib" aria-label="Quitar el {f}">{QUITAR}</button></div>' for f, est, fr in FECHAS_ESP)
    dias = DIAS[DIAS.index(desde):] if desde else DIAS
    tit = "" if desde else '<div class="t23-gtit">Horario de atención</div>'
    return (f'{tit}<div class="t23-hz">' + "".join(t_dia(d, *hz[d]) for d in dias) + "</div>"
            '<div class="t23-cp"><button type="button" class="cb cb-sec">Aplicar de lunes a viernes</button></div>'
            f'<div class="t23-gtit">Feriados y fechas especiales</div>{fechas}<a class="t23-mas" href="#">{MAS} Agregar fecha especial</a>')


def tel_asistente():
    est = ["Casos", "Editar un caso", "Perfil", "Conocimiento", "Conocimiento: el horario", "Conocimiento: el fin de semana", "Conocimiento: una fecha especial",
           "Probar", "Probar: lo que haría"]
    probar_ic = f'<a class="ap-ib" aria-label="Probar" href="#">{BOT}</a>'
    bar = C.t_bar("Asistente", "WhatsApp", "M-WA-Menu.dc.html", probar_ic)
    fijo = lambda on: f'<div class="ap-fijo"><button type="button" class="cb cb-pri full"{"" if on else " disabled"}>Guardar cambios</button></div>'  # noqa: E731
    kebab = lambda k: f'<button type="button" class="ap-ib" aria-label="Acciones del caso {k}">{F.TKEBAB}</button>'  # noqa: E731
    casos = ('<div class="t23-gtit">Casos<a href="#">Agregar caso</a></div>'
             + "".join(t_fila(f"{k}. {c}", f"{p} · {a}" + ("" if act else " · Inactivo"), kebab(k)) for k, (c, p, a, _x, act) in enumerate(CASOS, 1))
             + '<div class="t23-gtit">Formularios</div>' + "".join(t_fila(n, f"{p} · {c}") for n, p, c in OFRECE)
             + '<div class="t23-gtit">Cualquier otra cosa</div>' + t_fila("Responder con el conocimiento", "Clientes y empleados"))
    lista = bar + t_tabs("casos") + f'<div class="ap-cuerpo">{casos}</div>' + fijo(False)
    edit = (C.t_bar("Caso 1", "Asistente", "M-WA-Asistente.dc.html") + '<div class="ap-cuerpo"><div class="t23-hb">'
            + F.tcampo("Cuándo", CASOS[0][0], req=True) + F.tcampo("Para quién", "Clientes", select=True) + F.tcampo("Tipo de entrada", "Texto o audio", select=True)
            + F.tcampo("Qué hacer", "Responder con el conocimiento", select=True) + f'<span class="q-chk"><i>{TILDE}</i>Activo</span></div></div>'
            + '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    perfil = (bar + t_tabs("perfil") + '<div class="ap-cuerpo"><div class="t23-hb">' + F.tcampo("Nombre", "Delta", req=True) + F.tcampo("Tono", "Cercano", select=True)
              + F.tcampo("Presentación", PRESENTACION, req=True) + F.tcampo("Mensaje al derivar", DERIVAR, req=True) + "</div></div>" + fijo(False))
    pr_in = (C.t_bar("Probar", "Asistente", "M-WA-Asistente.dc.html") + '<div class="ap-cuerpo"><div class="t23-hb">' + F.tcampo("Bandeja", "Clientes", select=True)
             + F.tcampo("Mensaje", PRUEBAS["envios"][0], req=True))
    acciones = "".join(f'<div class="t23-ac"><b>{k}. {que}</b>{vista}{pr_grilla(caso, uso, por)}</div>' for k, (que, caso, vista, por, uso) in enumerate(PRUEBAS["envios"][1], 1))
    pr = pr_in + "</div></div>" + '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Probar</button></div>'
    pr_res = pr_in + '<div class="t23-gtit" style="margin: 4px 0 0;">Lo que haría</div>' + acciones + f'<span class="t23-nada">{CHECK} No se mandó nada.</span></div></div>'
    # Conocimiento: la información del negocio de allá (169), apilada; el horario, con sus franjas, y una fecha especial en una hoja
    conoc = (bar + t_tabs("conocimiento") + '<div class="ap-cuerpo"><div class="t23-gtit">Datos del negocio</div><div class="t23-hb" style="padding-bottom: 6px;">'
             + F.tcampo("Nombre del negocio", "Grupo Delta", req=True) + F.tcampo("Qué hace el negocio", "Venta y service de heladeras familiares y comerciales.", req=True)
             + '</div><div class="t23-gtit">Ubicación y zona de atención</div><div class="t23-hb">' + F.tcampo("Dónde atendés", "Local y zona de atención", select=True)
             + F.tcampo("Dirección del local", "Av. Rivadavia 4520, CABA") + F.tcampo("Referencia para llegar", "Frente a la plaza.")
             + F.tcampo("Zona de atención o entrega", ZONA) + "</div></div>" + fijo(False))
    horario = (bar + t_tabs("conocimiento") + f'<div class="ap-cuerpo">{t_horario({"Lunes": ("Abierto", FR_DOS)})}'
               '<div style="height: 96px; flex-shrink: 0;"></div></div>' + fijo(True))
    finde = {"Viernes": ("Abierto", FR_DIA + [("20:00", "00:30", True)]), "Sábado": ("24 horas", [])}
    fin_semana = (bar + t_tabs("conocimiento") + f'<div class="ap-cuerpo">{t_horario(finde, desde="Viernes")}'
                  '<div style="height: 96px; flex-shrink: 0;"></div></div>' + fijo(True))
    fecha = F.thoja("Horario de una fecha especial", F.tcampo("Fecha", "24/12/2026", req=True) + F.tcampo("Atención", "Abierto", select=True)
                    + f'<div class="t23-dia" style="border: 0; padding: 0;">{t_franjas("24/12/2026", [("09:00", "13:00", False)])}</div>',
                    '<button type="button" class="cb cb-pri lleno">Agregar fecha</button><button type="button" class="cb cb-sec">Cancelar</button>')
    cu = {"Casos": lista, "Editar un caso": edit, "Perfil": perfil, "Conocimiento": conoc, "Conocimiento: el horario": horario,
          "Conocimiento: el fin de semana": fin_semana, "Conocimiento: una fecha especial": fin_semana, "Probar": pr, "Probar: lo que haría": pr_res}
    return C.tel_pagina(cu, est, {"Conocimiento: una fecha especial": fecha}, "Asistente · teléfono", E.CSS_E12 + E.CSS_TED_E12 + W.CSS_TP + CSS_T23 + CSS_23)


def tel_preguntas():
    est = ["Pendientes", "Acciones de un tema", "Descartados", "Vacío"]

    def fila(t, descartado=False):
        n, d, preg, per, ult = t
        l3 = ult if descartado else f"{preg} {'pregunta' if preg == 1 else 'preguntas'} · {per} {'persona' if per == 1 else 'personas'} · {ult}"
        return (f'<div class="ap-fila"><div class="tx"><span class="l1">{n}</span><span class="l2">{d}</span><span class="l3">{l3}</span></div>'
                f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>')
    der = f'<button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'

    def lista(c, sub="3 temas · 7 preguntas"):
        return C.t_bar("Preguntas sin respuesta", sub, "M-WA-Menu.dc.html", der) + f'<div class="ap-cuerpo">{c}</div>'
    pend = "".join(fila(t) for t in TEMAS)
    cu = {"Pendientes": lista(pend), "Acciones de un tema": lista(pend), "Descartados": lista("".join(fila(t, True) for t in DESCARTADOS), "1 tema descartado"),
          "Vacío": lista('<div class="ap-vacio">No hay preguntas sin respuesta.</div>', "Sin preguntas")}
    hoja = F.thoja("Envíos al interior", f'<div class="ap-acciones2"><span role="menuitem">{LAPIZ} Completar el conocimiento</span><span role="menuitem" class="pel">{QUITAR} Descartar</span></div>', "")
    return C.tel_pagina(cu, est, {"Acciones de un tema": hoja}, "Preguntas sin respuesta · teléfono", CSS_T23)


# ================================================================ canvas.json: la fila de la etapa la pone formularios_etapas_1004.py
TITULOS = {"WA-Asistente": ("WhatsApp · el asistente · etapa 23", 1440, 1300), "WA-Asistente-Casos": ("WhatsApp · el asistente · los casos · etapa 23", 1440, 1300),
           "WA-Asistente-Probar": ("WhatsApp · el asistente · probar · etapa 23", 1440, 1300),
           "WA-Asistente-Limites": ("WhatsApp · el asistente · límites y conocimiento · etapa 23", 1440, 1300),
           "WA-Modo-Atencion": ("WhatsApp · el asistente · atención · etapa 23", 1440, 1000),
           "WA-Preguntas-Sin-Respuesta": ("WhatsApp · preguntas sin respuesta · etapa 23", 1440, 900),
           "M-WA-Asistente": ("El asistente · teléfono · etapa 23", 390, 844), "M-WA-Preguntas-Sin-Respuesta": ("Preguntas sin respuesta · teléfono · etapa 23", 390, 844)}


def registrar(titulos):
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, v in titulos.items():
        titulo, w, h = v[:3]
        b = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        b.update(w=w, h=h, title=titulo, page=v[3] if len(v) > 3 else "formularios")
        if len(v) > 4:
            b.update(x=v[4], y=v[5])
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    import formularios_23_chats_1004 as CH  # noqa: E402
    for n, f in [("WA-Asistente", asistente), ("WA-Asistente-Casos", asistente_casos), ("WA-Asistente-Probar", asistente_probar),
                 ("WA-Asistente-Limites", asistente_limites), ("WA-Modo-Atencion", modo_atencion), ("WA-Preguntas-Sin-Respuesta", preguntas)]:
        (PROJ / f"{n}.dc.html").write_text(f(), encoding="utf-8")
    for n, f in [("M-WA-Asistente", tel_asistente), ("M-WA-Preguntas-Sin-Respuesta", tel_preguntas)]:
        (PROJ / f"{n}.dc.html").write_text(E.post(n, f()), encoding="utf-8")
    hechos = CH.escribir_todo()
    if "--sin-canvas" not in sys.argv:
        registrar(TITULOS | CH.TITULOS)
    print("tableros", len(TITULOS) + len(hechos))
