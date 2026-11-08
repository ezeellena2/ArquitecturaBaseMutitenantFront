"""La etapa 23, segunda parte: los chats (los casos, el modo de atención, el asistente, la sugerencia y los audios), el formulario
(«Cuándo lo ofrece», «Sugerencias» y «Armar desde un texto»), dar de baja, los formularios que faltan, de dónde vino una respuesta y los
máximos de Plataforma. Lo llama `formularios_23_asistente_1004.py`.

Lo que tiene modelo en ArquitecturaBase lo sigue, con nuestras piezas: el chat con el modo, «Por qué lo mandó», la sugerencia y los
audios («Escuchar audio» y la transcripción debajo), «Qué sugerir después» (acá, una pestaña, como las reglas de la 21: 79) y «Cómo
empezó» en el detalle de una respuesta. Los chats llevan la barra de la bandeja y las fechas de WA-Chats: el 27/09/2026, antes de las 10:45.

Con el traspaso 10 (2026-11-07): la oferta del asistente es fija y nombra el formulario (165), también en una sugerencia que manda una
persona; lo prellenado va en dos columnas (138, el `DataList` de allá); las sugerencias se leen en pasos y su historial va detrás de su
botón (138 y 140), y el catálogo que propone el asistente pasa a la E25 (167): `FRM-Catalogos-23` y `FRM-Catalogo-Propuesta` se dejan
de generar y quedan en el Archivo tal como estaban.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_asistente_1004 as V  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_reglas_1004 as R  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import formularios_19_logica_1004 as X  # noqa: E402
import formularios_20_carga_1004 as W  # noqa: E402
import formularios_21_reglas_1004 as K  # noqa: E402
import formularios_21_respuestas_1004 as K2  # noqa: E402
import formularios_23_asistente_1004 as AS  # noqa: E402
import bloque0_wa_1004 as B0  # noqa: E402

PROJ = F.PROJ
svg, info = F.svg, F.info
CHEV, MAS, KEBAB, QUITAR, LAPIZ, TILDE, INFO = F.CHEV, A.MAS, A.KEBAB, A.QUITAR, A.LAPIZ, A.TILDE, F.INFO
BOT, CHECK, HOY, AYER = AS.BOT, AS.CHECK, AS.HOY, AS.AYER
FORM, SUP = K.FORM, K.SUP
PIN = svg('<path d="M9 4h6l-1 6 3 3v1.5H7V13l3-3z"/><path d="M12 14.5V20"/>', 14)
CHISPA = svg('<path d="M12 3.5 13.8 9 19.5 10.5 13.8 12 12 17.5 10.2 12 4.5 10.5 10.2 9z"/><path d="M18.5 16v4M16.5 18h4"/>', 15)
PLAY = svg('<path d="M8 5.5v13l10.5-6.5z"/>', 13, "1.5")

# ================================================================ Los chats: la barra y las fechas de WA-Chats
HORAS = {"10:48": "10:28", "10:50": "10:30", "11:20": "10:33", "11:21": "10:34", "11:23": "10:36", "11:04": "10:39", "11:34": "10:40"}
CSS_CH = """.as-np { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; margin-left: 6px; border-radius: 6px; background: oklch(0.96 0.06 85); color: oklch(0.42 0.1 70); font-size: 12px; font-weight: 600; white-space: nowrap; }
.w-conv .l3 .as-np { height: 18px; font-size: 11px; padding: 0 6px; }
.hc .acc .as-np { height: 26px; font-size: 12.5px; }
.as-pq { border: 0; padding: 0; background: none; font: inherit; color: var(--marca-tx); text-decoration: underline; cursor: pointer; }
.as-pqw { position: relative; display: inline-block; }
.as-pop { position: absolute; z-index: 30; top: calc(100% + 6px); right: 0; width: 330px; box-sizing: border-box; padding: 12px 14px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.18); font-size: 13px; line-height: 1.45; color: var(--t1); text-align: left; white-space: normal; }
.as-pop > b { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px; font-weight: 600; }
.as-pop .g { display: grid; grid-template-columns: 70px minmax(0, 1fr); gap: 4px 10px; }
.as-pop .g .k { color: var(--t3); }
.t-pq { display: flex; flex-direction: column; gap: 12px; }
.t-pq .f { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 8px; font-size: 15px; line-height: 1.4; }
.t-pq .k { color: var(--t3); }
.as-sug.borr .t span { color: var(--t1); }
.w-msjs .w-m.ent + .w-m.ent { margin-top: -4px; }
.au-bt { height: 30px; font-size: 13px; gap: 6px; }
.au .pl2 { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
.au .dur { font-size: 12.5px; color: var(--t3); font-variant-numeric: tabular-nums; }
"""


def a_wa(t, chats=True):
    """«Buscar» y los filtros en una fila, las fechas completas (también en el separador de días) y las horas antes de las 10:45 del 27/09."""
    if chats:
        t = re.sub(r"(</svg>) Buscar por nombre o número(</span>)", r"\1 Buscar\2", t)
        t = t.replace("<b>Martín Paz</b><span>Ayer</span>", f"<b>Martín Paz</b><span>{AYER} 17:10</span>")
        t = L.con_css(t, "wa23", B0.CSS_CHATS + CSS_CH + CSS_PRE_CH)
    t = re.sub(r'(<span class="(?:w|ap)-dia">)Hoy(</span>)', rf"\g<1>{HOY}\2", t)
    return re.sub(r"(?<![\d:/.])(10:48|10:50|11:20|11:21|11:23|11:04|11:34)(?![\d:])", lambda m: HORAS[m[1]], t)


def dlg_pasar(nombre="Tomás Acosta"):
    cuerpo = (f'<p class="d-tx">El asistente va a atender la conversación con {nombre}, con los casos de la organización. Nunca guarda una respuesta solo.</p>'
              '<p class="d-tx">Podés tomar la atención manual cuando quieras.</p>')
    return F.dialogo("Pasar a modo Asistente", cuerpo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Pasar a Asistente</button>')


def menu_chat(nombre="Tomás Acosta", manual=True, top=112):
    items = ((f'<span class="f-mi" role="menuitem">{BOT} Pasar a modo Asistente</span><span class="f-mi" role="menuitem">{PIN} Fijar la atención manual</span>'
              f'<span class="f-mi" role="menuitem">{CHECK} Marcar como resuelta</span>') if manual
             else f'<span class="f-mi" role="menuitem">{PIN} Fijar en el asistente</span>')
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}" style="top: {top}px; right: 24px; min-width: 250px;">{items}'
            '<span class="f-sep" role="separator"></span><a class="f-mi" role="menuitem" href="WA-Contacto.dc.html" style="text-decoration: none;">Ver ficha del contacto</a></div>')


# ---------------------------------------------------------------- WA-Chats-Asistente: el modo Asistente con Tomás (Internos)
VALORES_132 = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", HOY), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "128.000,00")]
NO_DISPONIBLE = "El asistente no está disponible: se agotó el tope de IA del mes. La conversación sigue en atención manual."
E_H1 = ["Modo Asistente", "Por qué respondió esto", "Menú del chat", "Pasar a modo Asistente", "Tomar atención a mitad de un envío", "El asistente no está disponible",
        "Pregunta si duda", "Después de un «ahora no»", "No hay formulario", "Fuera de las 24 horas"]
POR_132 = ("Formularios · Visita a cliente", "«Cuándo lo ofrece» de Visita a cliente",
           "Reconoció una visita a un cliente. Propuso Cliente, ¿Se concretó la venta? y Monto estimado, del mensaje de Tomás.")
# La oferta fija que nombra el formulario (165) y lo prellenado en dos columnas (138): la tarjeta del chat, la sugerencia y «Revisar y enviar»
OFERTA_VIS = AS.oferta("Visita a cliente")
PRE_132 = [("Cliente", "Ferretería Rosales"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "125.500,00")]
CSS_PRE_CH = AS.CSS_PRE + """.as-card .as-pre, .as-sug .as-pre { min-width: 260px; }
.as-sug .t .as-pre .t { color: var(--t3); }
.as-sug .t .as-pre .g span { color: var(--t1); }
.as-sug .t .as-pre .g .k { color: var(--t3); }
.w-dlg .rg-ck { align-items: flex-start; }
.w-dlg .rg-ck .tx { display: flex; flex-direction: column; gap: 1px; }
.w-dlg .rg-ck .tx small { font-size: 13px; color: var(--t2); }
.w-dlg .rv-f { font-size: 14px; }
"""


def card_visita(pre=PRE_132):
    """La tarjeta del formulario que manda el asistente: el nombre, el botón y lo prellenado en dos columnas."""
    return (f'<span class="as-card"><span>{F.ICONO}</span><span class="t"><b>Visita a cliente</b><small>Formulario · versión 4 · botón «Abrir formulario»</small>'
            f'{AS.prellenado(pre)}</span></span>')


def sugerencia(pre=PRE_132):
    """En atención manual, el asistente sugiere un formulario: lo prellenado va debajo de «Prellenado con», en dos columnas (como allá)."""
    return (f'<div class="as-sug" role="status"><span style="color: var(--marca-tx); margin-top: 1px;">{BOT}</span><span class="t"><b>El asistente sugiere mandarle Visita a cliente</b>'
            f'{AS.prellenado(pre)}</span><span class="acc"><button type="button" class="cb cb-sec">No, gracias</button><button type="button" class="cb cb-pri">Revisar y enviar</button></span></div>')


def dlg_revisar():
    """«Revisar y enviar», como allá: el formulario y su versión, y cada dato prellenado con su casilla y el valor debajo. Sin mensaje propio:
    sale la oferta fija que nombra el formulario (165)."""
    filas = PRE_132 + [("Fecha de la visita", HOY)]
    pre = "".join(f'<span class="rg-ck on"><span class="bx">{TILDE}</span><span class="tx"><b>{k}</b><small>{v}</small></span></span>' for k, v in filas)
    cuerpo = (f'<div class="w-cmp"><span class="rt">Formulario</span><span class="rv-f">Visita a cliente · versión 4</span></div>'
              f'<div class="c-pre"><span class="rt2">Datos que van prellenados {info("Tomás los ve cargados y los puede cambiar. Lo que destildes va vacío.")}</span>{pre}</div>')
    return F.dialogo("Enviar un formulario a Tomás Acosta", cuerpo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Enviar formulario</button>')


def con_enlaces(h):
    """Cada respuesta del asistente lleva «Por qué respondió esto» en su pie, cerrado: nunca aparece abierto solo."""
    return re.sub(r'(<span class="pie">Asistente · \d{2}:\d{2} · [^<]+)</span>', lambda m: m[1] + enlace_pq() + "</span>", h)


def chat_asistente():
    resp = A.tarjeta(A.grilla_r(VALORES_132) + A.r_ok("VIS-000132"))
    auto = R.automatico("Recibimos VIS-000132. Te avisamos cuando la aprueben.", "Regla de Visita a cliente · 11:34 · Entregado", R.card_aviso())
    te = OFERTA_VIS
    msgs = {
        "Modo Asistente": V.PASO + V.MSJ_TOMAS + V.asistente_burbuja(te, card_visita()) + resp + auto,
        "Por qué respondió esto": V.PASO + V.MSJ_TOMAS + V.asistente_burbuja(te, card_visita(), "Asistente · 11:21 · Leído" + enlace_pq(por_que(*POR_132))) + resp + auto,
        "Menú del chat": V.MSJ_TOMAS, "Pasar a modo Asistente": V.MSJ_TOMAS,
        "Tomar atención a mitad de un envío": V.PASO + V.MSJ_TOMAS + V.asistente_burbuja(te, card_visita(), "Asistente · 11:21 · Enviando")
        + V.sis("Lucía Fernández tomó la atención manual")
        + f'<div class="as-aviso inf" role="status">{INFO}<span>Tomaste la atención manual. El asistente estaba mandando un formulario: ese envío termina y queda en la conversación.</span></div>',
        "El asistente no está disponible": V.MSJ_TOMAS + f'<div class="as-aviso amb" role="status">{V.TRI}<span>{NO_DISPONIBLE}</span></div>',
        "Pregunta si duda": V.PASO + V.ent("Pasé por lo de Rosales.") + V.asistente_burbuja("¿Fue una visita o una entrega?", quick=["Visita", "Entrega"]),
        "Después de un «ahora no»": V.PASO + V.MSJ_TOMAS + V.asistente_burbuja(te, card_visita(), "Asistente · 11:21 · Leído")
        + V.ent("Ahora no, después lo cargo.", "11:23") + V.asistente_burbuja("Dale, cuando quieras pedímelo.", pie="Asistente · 11:23 · Leído"),
        "No hay formulario": V.PASO + V.ent("Quiero cargar un reclamo de Ferretería Rosales.")
        + V.asistente_burbuja("Todavía no hay un formulario para registrar reclamos. Ya anoté el pedido para que lo armen.", pie="Asistente · 11:21 · Leído"),
        "Fuera de las 24 horas": V.PASO + V.sis(f"Último mensaje de Tomás: {AYER} 09:10") + V.sis("El asistente espera a que Tomás escriba"),
    }
    msgs = {k: con_enlaces(v) for k, v in msgs.items()}
    man = {"Menú del chat", "Pasar a modo Asistente", "Tomar atención a mitad de un envío", "El asistente no está disponible"}
    esc = {e: (A.escr() if e in man else V.esc_asistente()) for e in E_H1}
    capas = {"Menú del chat": menu_chat(), "Pasar a modo Asistente": dlg_pasar()}
    vp = {e: "Asistente: Recibimos VIS-000132…" for e in E_H1}
    vp.update({"Menú del chat": "Recién salgo de Ferretería Rosales…", "Pasar a modo Asistente": "Recién salgo de Ferretería Rosales…",
               "El asistente no está disponible": "Recién salgo de Ferretería Rosales…", "Pregunta si duda": "Asistente: ¿Fue una visita o una entrega?",
               "Después de un «ahora no»": "Asistente: Dale, cuando quieras pedímelo.", "No hay formulario": "Asistente: Todavía no hay un formulario…",
               "Fuera de las 24 horas": "Gracias, mañana sigo."})
    hora = {e: f"{HOY} 10:40" for e in E_H1}
    hora["Fuera de las 24 horas"] = f"{AYER} 09:10"
    flags = {e: ("man" if e in man else "as") for e in E_H1}
    return a_wa(V.pagina_chat_as(E_H1, esc, msgs, capas, vp, hora, "WhatsApp · Internos · el asistente atiende · etapa 23", flags))


# ---------------------------------------------------------------- WA-Chats-Sugerencia: en atención manual, sugiere un formulario
def chat_sugerencia():
    E_ = V.ESTADOS_H2
    msgs = {"Sugerencia": V.MSJ_TOMAS + sugerencia(), "Revisar y enviar": V.MSJ_TOMAS + sugerencia(),
            "No, gracias": V.MSJ_TOMAS + V.sis("Descartaste la sugerencia del asistente")}
    t = V.pagina_chat_as(E_, {e: A.escr() for e in E_}, msgs, {"Revisar y enviar": dlg_revisar()}, {e: "Recién salgo de Ferretería Rosales…" for e in E_},
                         {e: f"{HOY} 10:33" for e in E_}, "WhatsApp · Internos · el asistente sugiere · etapa 23", {e: "man" for e in E_})
    t = t.replace("</helmet>", '<style data-asistente="revisar">\n.rg-ck { display: flex; align-items: center; gap: 10px; font-size: 13.5px; min-height: 26px; }\n'
                  ".rg-ck .bx { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--borde2); display: inline-flex; align-items: center; justify-content: center; background: #fff; box-sizing: border-box; }\n"
                  ".rg-ck.on .bx { background: var(--marca); border-color: var(--marca); color: #fff; }\n</style>\n</helmet>", 1)
    return a_wa(t)


# ---------------------------------------------------------------- WA-Chats-Audio: «Escuchar audio» y la transcripción debajo (AB)
TRANSCRIPCION = "«Recién salgo de Ferretería Rosales, cerramos la venta. Son unos 125.500.»"


def audio(estado="transcripto", clase="w-m"):
    boton = f'<span class="pl2"><button type="button" class="cb cb-sec au-bt">{PLAY} Escuchar audio</button><span class="dur">0:24</span></span>'
    if estado == "cargando":
        boton = f'<span class="pl2">{E.trabaja("Cargando audio…", "cb-sec au-bt")}<span class="dur">0:24</span></span>'
    elif estado == "escuchando":
        onda = "".join(f'<i style="height: {h}px;"></i>' for h in V.ONDA)
        boton = f'<span class="pl"><span class="bt">{V.PLAY}</span><span class="onda">{onda}</span><span class="dur">0:09 / 0:24</span></span>'
    if estado == "pasando":
        tr = f'<span class="tr est">{A.RELOJ} Pasando el audio a texto…</span>'
    elif estado == "error":
        tr = f'<span class="tr est">{INFO} No pudimos pasar este audio a texto.</span>'
    elif estado == "vencido":
        return f'<div class="{clase} ent"><span class="gl au"><span class="tr est">{INFO} El audio y su transcripción ya no están disponibles.</span></span><span class="pie">11:20</span></div>'
    else:
        tr = f'<span class="tr"><small>Transcripción</small>{TRANSCRIPCION}</span>'
    return f'<div class="{clase} ent"><span class="gl au">{boton}{tr}</span><span class="pie">11:20</span></div>'


E_H6 = ["Pasando a texto", "Transcripto", "Escuchar el audio", "En modo Asistente", "En atención manual, sugiere", "No se pudo pasar a texto", "Ya no está"]


def chat_audio():
    msgs = {"Pasando a texto": audio("pasando"), "Transcripto": audio(), "Escuchar el audio": audio("escuchando"),
            "En modo Asistente": V.PASO + audio() + V.asistente_burbuja(OFERTA_VIS, card_visita()),
            "En atención manual, sugiere": audio() + sugerencia(),
            "No se pudo pasar a texto": V.PASO + audio("error") + V.sis("El asistente no pudo leer el audio · Necesita una persona"),
            "Ya no está": audio("vencido")}
    msgs = {k: con_enlaces(v) for k, v in msgs.items()}
    flags = {e: ("as" if e in ("En modo Asistente", "No se pudo pasar a texto") else "man") for e in E_H6}
    esc = {e: (V.esc_asistente() if flags[e] == "as" else A.escr()) for e in E_H6}
    vp = {e: "Audio · 0:24" for e in E_H6}
    vp["En modo Asistente"] = "Asistente: Te preparé el formulario «Visita a cliente»…"
    hora = {e: f"{HOY} 10:34" for e in E_H6}
    hora["Ya no está"] = "12/09/2026 16:20"
    t = V.pagina_chat_as(E_H6, esc, msgs, {}, vp, hora, "WhatsApp · Internos · audios · etapa 23", flags)
    return a_wa(t)


def tel_chat_asistente():
    t = V.tel_chat_asistente()
    viejo = V.audio().replace('class="w-m ent"', 'class="ap-m ent"')
    assert viejo in t
    t = t.replace(viejo, audio(clase="ap-m"))
    t = t.replace(V.dlg_pasar().split('<p class="d-tx">')[1].split("</p>")[0], dlg_pasar().split('<p class="d-tx">')[1].split("</p>")[0])
    t, k = re.subn(r'<div class="t-por">.*?</div>', "", t, flags=re.S)
    assert k, "el porqué abierto del teléfono"
    # La oferta fija que nombra el formulario (165) y lo prellenado en dos columnas (138), en la tarjeta y en la sugerencia
    for viejo in ("Te preparé el formulario de la visita con lo que me contaste. Revisalo y confirmalo.", "Te preparé el formulario de la visita con lo que me contaste."):
        assert f"<span>{viejo}</span>" in t, viejo
        t = t.replace(f"<span>{viejo}</span>", f"<span>{OFERTA_VIS}</span>")
    card = '<span><b>Visita a cliente</b><small>Prellenado: Cliente, ¿Se concretó la venta? y Monto estimado</small></span>'
    assert card in t, "la tarjeta del teléfono"
    t = t.replace(card, f'<span class="t"><b>Visita a cliente</b>{AS.prellenado(PRE_132)}</span>')
    sug = "<span>Prellenado con Cliente, ¿Se concretó la venta? y Monto estimado.</span>"
    assert sug in t, "la sugerencia del teléfono"
    t = t.replace(sug, AS.prellenado(PRE_132))
    t, k = re.subn(r'<div class="ap-hoja" role="dialog" aria-label="Enviar un formulario a Tomás">.*?<div class="hp">.*?</div></div>', lambda m: hoja_revisar_tel(), t, count=1, flags=re.S)
    assert k == 1, "«Revisar y enviar» del teléfono"
    t = con_enlaces(t)
    return a_wa(t, chats=False).replace("</helmet>", f'<style data-wa23="audio">\n{CSS_CH}{CSS_PRE_CH}{CSS_PRE_TEL}</style>\n</helmet>', 1)


CSS_PRE_TEL = """.ap-m .as-card .t { display: flex; flex-direction: column; min-width: 0; }
.ap-m .as-pre .g, .t-sug .as-pre .g { font-size: 14px; }
.ap-m .as-pre .t, .t-sug .as-pre .t { font-size: 13px; color: var(--t3); }
.t-sug .as-pre .g span { color: var(--t1); }
.t-sug .as-pre .g .k { color: var(--t3); }
.t-opc .tx { display: flex; flex-direction: column; gap: 2px; }
.t-opc .tx small { font-size: 14px; color: var(--t2); font-weight: 400; }
.t-ro { display: block; padding: 6px 0 2px; font-size: 16px; color: var(--t1); }
"""


def hoja_revisar_tel():
    """«Revisar y enviar» en el teléfono, como en la compu: el formulario y cada dato prellenado con su valor debajo; sin mensaje propio (165)."""
    tilde = F.svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")
    pre = "".join(f'<span class="t-opc on"><span class="tx"><b>{k}</b><small>{v}</small></span><span class="d">{tilde}</span></span>'
                  for k, v in PRE_132 + [("Fecha de la visita", HOY)])
    cuerpo = ('<div class="ap-cmp"><span class="rt"><span>Formulario</span></span><span class="t-ro">Visita a cliente · versión 4</span></div>'
              f'<div class="p-tit2">Datos que van prellenados{A.t_info("Tomás los ve cargados y los puede cambiar. Lo que destildes va vacío.")}</div>{pre}')
    h = F.thoja("Enviar un formulario a Tomás", cuerpo, '<button type="button" class="cb cb-pri lleno">Enviar formulario</button><button type="button" class="cb cb-sec">Cancelar</button>')
    return h.split('<div class="ap-velo"></div>', 1)[1]


# ================================================================ WA-Chats-Casos: Martina López, en Clientes, con los casos
CLIENTES = [("RC", "Romi Castro", f"{HOY} 10:15", "Quiero consultar un pedido.", "Ventas · Sin tomar", True),
            ("FD", "Federico Díaz", f"{AYER} 18:40", "¿Siguen abiertos el sábado?", "Soporte · Sin tomar", True),
            ("JP", "Javier Pereyra", f"{AYER} 16:25", "Perfecto, gracias.", "Soporte · Tomás Acosta", False),
            ("CR", "Carla Ruiz", "25/09/2026 11:07", "Vos: Te esperamos.", "Ventas · Lucía Fernández", False)]


def conv(ini, nombre, cuando, vp, l3, nuevo):
    punto = '<span class="w-punto" aria-label="Sin leer"></span>' if nuevo else ""
    return (f'<div class="w-conv{" nuevo" if nuevo else " "}"><span class="w-av">{ini}</span><span class="tx"><span class="l1"><b>{nombre}</b><span>{cuando}</span></span>'
            f'<span class="l2"><span>{vp}</span>{punto}</span><span class="l3{" sin" if "Sin tomar" in l3 else ""}">{l3}</span></span></div>')


def si(var, h, defecto="no"):
    return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{{defecto}}}}}">{h}</sc-if>'


def chat_martina(escritura, overlay, mensajes, css):
    """Como F.chat_internos, en la bandeja Clientes: Martina López arriba, con su modo, si necesita una persona y el filtro."""
    t = F.CHATS
    i = t.index('<div class="w-chat">')
    j = t.index("</div></div></div>\n</x-dc>")
    martina = ('<div class="w-conv on"><span class="w-av">ML</span><span class="tx"><span class="l1"><b>Martina López</b><span>{{hora}}</span></span>'
               '<span class="l2"><span>{{vistaPrevia}}</span></span><span class="l3">Ventas · {{atiende}}' + si("necesita", '<span class="as-np">Necesita una persona</span>') + "</span></span></div>")
    pil = f'<span class="w-pil {{{{filtroClase}}}}">{{{{filtro}}}} {CHEV}</span>'
    bandeja = ('<div class="w-bandeja"><div class="o-seg" role="radiogroup" aria-label="Bandeja"><span class="on" role="radio" aria-checked="true">Clientes <span class="c">5</span></span>'
               '<span role="radio" aria-checked="false">Internos <span class="c">2</span></span></div>'
               f'<div class="filtro {{{{envuelve}}}}"><span class="w-bus">{F.BUSCAR} Buscar</span><span class="w-pil">Equipo: todos {CHEV}</span>{pil}</div>'
               + martina + si("todos", "".join(conv(*c) for c in CLIENTES), "si") + "</div>")
    modo = (si("modoAs", f'<span class="as-modo on">{BOT} Asistente</span>', "si") + si("modoMan", '<span class="as-modo man">Atención manual</span>')
            + si("fijado", f'<span class="as-modo man">{PIN} Fijada</span>') + si("necesita", '<span class="as-np">Necesita una persona</span>'))
    hilo = ('<div class="w-hilo"><div class="hc"><span class="w-av">ML</span><span class="tx"><b>Martina López</b><span>011 15-5555-6203 · Vinculada a su cuenta · Mayorista</span></span>'
            f'<span class="acc">{modo}<a class="cb cb-sec ch" href="WA-Chats-Pasar.dc.html">Pasar</a><button type="button" class="ib" aria-label="Acciones de Martina López">{KEBAB}</button></span></div>'
            f'<div class="w-msjs"><span class="w-dia">{HOY}</span>{mensajes}</div>{escritura}</div>')
    t = t[:i] + '<div class="w-chat">' + bandeja + hilo + "</div>" + t[j:]
    k = t.rindex("</div>\n</x-dc>")
    t = t[:k] + overlay + t[k:]
    return t.replace("</helmet>", f'<style data-e12="chat">\n{F.CSS_DLG}{F.CSS_CHAT}{css}</style>\n</helmet>', 1)


def ent(texto, hora):
    return f'<div class="w-m ent"><span class="gl">{texto}</span><span class="pie">{hora}</span></div>'


def enlace_pq(pop=""):
    """«Por qué respondió esto» en el pie: se abre al tocarlo, en un globo que no corre el chat (elegido por el usuario el 03/11)."""
    return f' · <span class="as-pqw"><button type="button" class="as-pq" aria-expanded="{"true" if pop else "false"}">Por qué respondió esto</button>{pop}</span>'


def asis(texto, hora, card="", quick=None, estado="Leído", pq=True, clase="w-m", pop=""):
    q = '<span class="as-quick">' + "".join(f"<span>{b}</span>" for b in quick) + "</span>" if quick else ""
    p = enlace_pq(pop) if pq else ""
    return (f'<div class="{clase} sal asis"><span class="gl"><span class="aut">{BOT} Asistente</span><span>{texto}</span>{card}{q}</span>'
            f'<span class="pie">Asistente · {hora} · {estado}{p}</span></div>')


def filas_pq(caso, uso, por):
    return [("Caso", caso), ("Usó", uso), ("Por qué", por)]


def por_que(caso, uso, por, clase="as-pop"):
    """El globo, abierto: el caso, lo que usó y por qué. En el teléfono es una hoja (hoja_pq)."""
    g = '<span class="g">' + "".join(f'<span class="k">{k}</span><span>{v}</span>' for k, v in filas_pq(caso, uso, por)) + "</span>"
    return f'<span class="{clase}" role="dialog" aria-label="Por qué respondió esto"><b>{INFO} Por qué respondió esto</b>{g}</span>'


def hoja_pq(filas):
    return F.thoja("Por qué respondió esto", '<div class="t-pq">' + "".join(f'<div class="f"><span class="k">{k}</span><span>{v}</span></div>' for k, v in filas) + "</div>", "")


CARD_SERVICE = (f'<span class="as-card"><span>{F.ICONO}</span><span class="t"><b>Pedido de service</b><small>Formulario · versión 2 · botón «Abrir formulario»</small>'
                f'{AS.prellenado([("Sucursal", "Centro")])}</span></span>')
OFERTA_SERVICE = AS.oferta("Pedido de service")
DERIVA = "Ya le paso tu consulta a una persona del equipo. Te responde por acá."
NECESITA = "Pasó a atención manual · Necesita una persona"
POR_SAB = ("Caso 1 · Pregunta por envíos, precios, horarios o garantías", "Horario de atención", "Pregunta si atienden los sábados: está cargado.")
E_CS = ["Responde con el conocimiento", "Por qué respondió esto", "Sin la información: deriva", "Manda un formulario", "Pregunta con botones", "El texto exacto",
        "Quiere hablar con alguien", "Una ráfaga: tres acciones", "El tope del día", "Atención manual: el borrador", "Cambiar el modo", "Fijada", "Resuelta",
        "Filtro: necesita una persona"]


def msgs_casos(e_=ent, a_=asis, s_=V.sis, pq_=por_que):
    hola = e_("hola", "10:20") + a_(AS.PRESENTACION, "10:20") + e_("¿qué hora es?", "10:21") + a_("Son las 10:21.", "10:21")
    sabado = e_("¿Atienden los sábados?", "10:22") + a_("Sí, los sábados de 9 a 13. De lunes a viernes, de 9 a 18.", "10:22")
    envios = (e_("¿Hacen envíos a Córdoba?", "10:30") + a_("¿A qué ciudad de Córdoba sería? Lo consulto con el equipo.", "10:30")
              + a_(DERIVA, "10:30") + s_(NECESITA))
    heladera = e_("Se rompió la heladera en la sucursal Centro", "10:32") + a_(OFERTA_SERVICE, "10:32", CARD_SERVICE)
    botones = e_("Quiero comprar una heladera", "10:34") + a_(AS.PREG_BOTONES, "10:34", quick=AS.BOTONES)
    texto = e_("¿Dónde está mi pedido?", "10:35") + a_(AS.TEXTO_PEDIDO, "10:35")
    persona = e_("Quiero hablar con alguien", "10:36") + a_(DERIVA, "10:36") + s_(NECESITA)
    rafaga = (e_("Hola", "10:38") + e_("Se rompió la heladera de la sucursal Centro", "10:38") + e_("Y quiero hablar con alguien", "10:38")
              + a_("¡Hola, Martina! Lamento lo de la heladera.", "10:38") + a_(OFERTA_SERVICE, "10:38", CARD_SERVICE)
              + a_(DERIVA, "10:38") + s_(NECESITA))
    tope = hola + sabado + e_("¿Y los domingos?", "10:39") + s_("Llegó al tope de 20 respuestas de hoy · Necesita una persona")
    borrador = (envios + s_("Lucía Fernández tomó la conversación") + e_("¿Hacen service a domicilio?", "10:41")
                + f'<div class="as-sug borr" role="status"><span style="color: var(--marca-tx); margin-top: 1px;">{BOT}</span><span class="t"><b>Borrador del asistente</b>'
                '<span>Sí, en CABA y Gran Buenos Aires, de lunes a viernes.</span></span><span class="acc"><button type="button" class="cb cb-sec">Descartar</button>'
                '<button type="button" class="cb cb-pri">Usar el borrador</button></span></div>')
    tomada = envios + s_("Lucía Fernández tomó la conversación") + f'<div class="w-m sal"><span class="gl">Hola, Martina. Hacemos envíos a todo el país con un transporte. ¿A qué ciudad sería?</span><span class="pie">Lucía Fernández · 10:42</span></div>'
    fijada = tomada + s_("Lucía Fernández fijó la atención manual")
    resuelta = tomada + s_("Lucía Fernández la marcó como resuelta · volvió al asistente")
    sab = "Sí, los sábados de 9 a 13. De lunes a viernes, de 9 a 18."
    pq = (e_("¿Atienden los sábados?", "10:22") + (a_(sab, "10:22", pop=pq_(*POR_SAB)) if pq_ else a_(sab, "10:22"))
          + e_("Gracias, paso el sábado.", "10:23") + a_("¡Te esperamos, Martina!", "10:23"))
    return {"Responde con el conocimiento": hola + sabado, "Por qué respondió esto": hola + pq, "Sin la información: deriva": envios, "Manda un formulario": heladera,
            "Pregunta con botones": botones, "El texto exacto": texto, "Quiere hablar con alguien": persona, "Una ráfaga: tres acciones": rafaga,
            "El tope del día": tope, "Atención manual: el borrador": borrador, "Cambiar el modo": tomada, "Fijada": fijada, "Resuelta": resuelta,
            "Filtro: necesita una persona": envios}


def chat_casos():
    msgs = msgs_casos()
    asistente = {"Responde con el conocimiento", "Por qué respondió esto", "Manda un formulario", "Pregunta con botones", "El texto exacto", "Resuelta"}
    necesita = {"Sin la información: deriva", "Quiere hablar con alguien", "Una ráfaga: tres acciones", "El tope del día", "Filtro: necesita una persona"}
    tomada = {"Atención manual: el borrador", "Cambiar el modo", "Fijada"}
    esc = {e: (V.esc_asistente() if e in asistente else A.escr()) for e in E_CS}
    vp = {"Responde con el conocimiento": "Asistente: Sí, los sábados de 9 a 13…", "Por qué respondió esto": "Asistente: ¡Te esperamos, Martina!",
          "Sin la información: deriva": f"Asistente: {DERIVA}", "Manda un formulario": "Asistente: Pedido de service", "Pregunta con botones": f"Asistente: {AS.PREG_BOTONES}",
          "El texto exacto": f"Asistente: {AS.TEXTO_PEDIDO}", "Quiere hablar con alguien": f"Asistente: {DERIVA}", "Una ráfaga: tres acciones": f"Asistente: {DERIVA}",
          "El tope del día": "¿Y los domingos?", "Atención manual: el borrador": "¿Hacen service a domicilio?", "Cambiar el modo": "Vos: Hola, Martina. Hacemos envíos…",
          "Fijada": "Vos: Hola, Martina. Hacemos envíos…", "Resuelta": "Vos: Hola, Martina. Hacemos envíos…", "Filtro: necesita una persona": f"Asistente: {DERIVA}"}
    hora = {"Responde con el conocimiento": "10:22", "Por qué respondió esto": "10:23", "Sin la información: deriva": "10:30", "Manda un formulario": "10:32",
            "Pregunta con botones": "10:34", "El texto exacto": "10:35", "Quiere hablar con alguien": "10:36", "Una ráfaga: tres acciones": "10:38", "El tope del día": "10:39",
            "Atención manual: el borrador": "10:41", "Cambiar el modo": "10:42", "Fijada": "10:42", "Resuelta": "10:42", "Filtro: necesita una persona": "10:30"}
    capas = {"Cambiar el modo": menu_chat("Martina López")}
    js = {"modoAs": [e for e in E_CS if e in asistente], "modoMan": [e for e in E_CS if e not in asistente], "fijado": ["Fijada"], "necesita": sorted(necesita),
          "todos": [e for e in E_CS if e != "Filtro: necesita una persona"]}
    atiende = {e: ("Asistente" if e in asistente else "Lucía Fernández" if e in tomada else "Sin tomar") for e in E_CS}
    over = "".join(f'<sc-if value="{{{{s{E_CS.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = chat_martina('<div class="w-escr">' + A.con_estados([(e, esc[e]) for e in E_CS]) + "</div>", over, A.con_estados([(e, msgs[e]) for e in E_CS]),
                     F.CSS_ESTADOS + F.CSS_ENVIO + F.CSS_OFERTA + A.CSS_AB + A.CSS_CHAT_AB + A.CSS_RESP_AB + V.CSS_AS + R.CSS_AV)
    props = {"estado": {"editor": "enum", "options": E_CS, "default": E_CS[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    extra = "".join(f"      {k}: {json.dumps(v, ensure_ascii=False)}.includes(e),\n" for k, v in js.items())
    extra += (f"      vistaPrevia: {json.dumps(vp, ensure_ascii=False)}[e] ?? '',\n      hora: '{HOY} ' + ({json.dumps(hora, ensure_ascii=False)}[e] ?? '10:22'),\n"
              f"      atiende: {json.dumps(atiende, ensure_ascii=False)}[e] ?? '',\n"
              "      filtro: e === 'Filtro: necesita una persona' ? 'Necesita una persona' : 'Todos', filtroClase: e === 'Filtro: necesita una persona' ? 'con' : '',\n"
              "      envuelve: e === 'Filtro: necesita una persona' ? 'ta-envuelve' : '',\n")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(E_CS[0], ensure_ascii=False)};\n" + A.js_estados(E_CS, extra))
    t = re.sub(r"<title>[^<]*</title>", "<title>WhatsApp · Clientes · los casos del asistente · etapa 23</title>", t)
    return a_wa(t)


# ---------------------------------------------------------------- Los teléfonos de Martina: los casos y el modo de atención
def tel_chat_martina(E_, esc, msgs, capas, titulo, css="", marca=""):
    t = F.TCONV
    i = t.index('<div class="ap-cbar">')
    j = t.index('<span class="ap-raya"></span></div>\n</x-dc>')
    barra = (f'<div class="ap-cbar"><a class="ap-ib" aria-label="Volver" href="M-WA-Chats.dc.html">{F.TCVOLVER}</a><span class="w-av">ML</span>'
             f'<span class="tx"><b>Martina López</b><span>Mayorista{marca}</span></span>'
             f'<button type="button" class="ap-ib" aria-label="Acciones de Martina López">{F.TCKEBAB}</button></div>')
    chat = f'<div class="ap-chat"><span class="ap-dia">{HOY}</span>' + A.con_estados([(e, msgs.get(e, "")) for e in E_]) + "</div>"
    over = "".join(f'<sc-if value="{{{{s{E_.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = t[:i] + barra + chat + A.con_estados([(e, esc[e]) for e in E_]) + over + t[j:]
    t = t.replace("</helmet>", f'<style data-e12="chat-tel">\n{F.CSS_TEL}{F.CSS_TCHAT}{F.CSS_TFORM}{A.CSS_TCHAT_AB}{css}</style>\n</helmet>', 1)
    props = {"estado": {"editor": "enum", "options": E_, "default": E_[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
    t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(E_[0], ensure_ascii=False)};\n" + A.js_estados(E_))
    return re.sub(r"<title>[^<]*</title>", f"<title>{titulo}</title>", t)


CSS_TCH = V.CSS_AS.replace(".w-m", ".ap-m") + V.CSS_TAS + CSS_CH + CSS_PRE_CH + CSS_PRE_TEL + """.t-por .g { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 4px 8px; margin-top: 6px; }
.t-por .g .k { color: var(--t3); }
.t-sug.borr span { color: var(--t1); }
.ap-cbar .as-np { font-size: 11px; height: 18px; padding: 0 6px; }
"""


def t_ent(texto, hora):
    return f'<div class="ap-m ent"><span class="gl">{texto}</span><span class="pie">{hora}</span></div>'


def t_asis(texto, hora, card="", quick=None, estado="Leído", pq=True):
    return asis(texto, hora, card.replace("as-card", "as-card"), quick, estado, pq, clase="ap-m")


def t_sis(texto):
    return f'<span class="ap-sis">{texto}</span>'


T_FR = f'<div class="t-fr"><span>{BOT} El asistente atiende esta conversación.</span><button type="button" class="cb cb-pri">Tomar atención manual</button></div>'


def tel_casos():
    est = ["Responde con el conocimiento", "Por qué respondió esto", "Sin la información: deriva", "Manda un formulario", "Una ráfaga: tres acciones", "Atención manual: el borrador"]
    m = msgs_casos(t_ent, t_asis, t_sis, None)
    m["Atención manual: el borrador"] = m["Atención manual: el borrador"].replace('class="as-sug borr"', 'class="t-sug borr"')
    esc = {e: (T_FR if e in ("Responde con el conocimiento", "Por qué respondió esto", "Manda un formulario") else A.t_escr()) for e in est}
    marca = si("necesita", '<span class="as-np">Necesita una persona</span>')
    capas = {"Por qué respondió esto": hoja_pq(filas_pq(*POR_SAB))}
    t = tel_chat_martina(est, esc, m, capas, "WhatsApp · Clientes · los casos · teléfono · etapa 23", F.CSS_TFICHA + A.CSS_AB + A.CSS_TRESP_AB + F.CSS_TFILTRO + CSS_TCH, marca)
    return t.replace("      si: true, no: false,\n", "      si: true, no: false, necesita: ['Sin la información: deriva', 'Una ráfaga: tres acciones'].includes(e),\n", 1)


def tel_modo():
    est = ["Asistente", "Cambiar el modo", "Atención manual", "Fijada", "Resuelta"]
    m = msgs_casos(t_ent, t_asis, t_sis, None)
    msgs = {"Asistente": m["Responde con el conocimiento"], "Cambiar el modo": m["Cambiar el modo"], "Atención manual": m["Cambiar el modo"], "Fijada": m["Fijada"],
            "Resuelta": m["Resuelta"]}
    esc = {e: (T_FR if e in ("Asistente", "Resuelta") else A.t_escr()) for e in est}
    hoja = F.thoja("Martina López", f'<div class="ap-acciones2"><span role="menuitem">{BOT} Pasar a modo Asistente</span><span role="menuitem">{PIN} Fijar la atención manual</span>'
                   f'<span role="menuitem">{CHECK} Marcar como resuelta</span><span role="menuitem">Ver ficha del contacto</span></div>', "")
    marca = si("fijada", f'<span class="as-np" style="background: var(--s3); color: var(--t2);">{PIN} Fijada</span>')
    t = tel_chat_martina(est, esc, msgs, {"Cambiar el modo": hoja}, "WhatsApp · el modo de atención · teléfono · etapa 23", F.CSS_TFICHA + A.CSS_AB + A.CSS_TRESP_AB + CSS_TCH, marca)
    return t.replace("      si: true, no: false,\n", "      si: true, no: false, fijada: e === 'Fijada',\n", 1)


# ================================================================ El formulario: las pestañas de la 23 suman «Sugerencias»
def tabs23(sel):
    items = [("respuestas", "Respuestas", ' <span class="c">24</span>', "FRM-Respuestas-21.dc.html"), ("tablero", "Tablero", "", "FRM-Tablero-21.dc.html"),
             ("diseno", "Diseño", "", "FRM-Editor-Asistente.dc.html"), ("reglas", "Reglas", "", "FRM-Editor-Reglas-23.dc.html"),
             ("sugerencias", "Sugerencias", "", "FRM-Editor-Sugerencias.dc.html")]
    a = "".join(f'<a class="{"on" if k == sel else ""}" role="tab" aria-selected="{"true" if k == sel else "false"}" href="{h}">{t}{c}</a>' for k, t, c, h in items)
    return f'<div class="f-tabs" role="tablist" aria-label="Vistas del formulario">{a}</div>'


def con_tabs23(t, sel):
    t = t.replace('<div class="w-body">', '<div class="w-body">' + tabs23(sel))
    return L.con_css(t, "pestanas", L.CSS_PESTANAS)


def enlaces23(t):
    for a, b in [("FRM-Formularios-21.dc.html", "FRM-Formularios-22.dc.html"), ("FRM-Formularios.dc.html", "FRM-Formularios-22.dc.html"),
                 ("WA-Chats-Avisos.dc.html", "WA-Chats-Asistente.dc.html")]:
        t = t.replace(f'"{a}"', f'"{b}"')
    return t


def escribir_frm(n, html, alto=None, pestana=None):
    t = L.sin_disenar(n, E.post(n, html, alto))
    t = W.css_y_alto(t, alto)
    if pestana:
        t = con_tabs23(t, pestana)
    (PROJ / f"{n}.dc.html").write_text(enlaces23(K.migas(t)), encoding="utf-8")


# ---------------------------------------------------------------- FRM-Editor-Asistente: «Cuándo lo ofrece el asistente», en «El formulario»
CUANDO_VIS = AS.OFRECE[1][2]
AY_OFRECE = "Lo ofrece cuando el mensaje encaja con esto. Sin este texto, no lo ofrece. Cambiarlo no pide volver a publicar."
E_ED = ["Con «Cuándo lo ofrece»", "Sin «Cuándo lo ofrece»", "Sin el asistente"]


@K2.con_visita
def cuerpo_editor(modo="con"):
    c = X.cuerpo(pv=K2.PV_CORREO)
    ancla = E.para_quien()
    assert c.count(ancla) == 1
    if modo == "sin_asistente":
        return c
    texto = '<div class="ct area ph">Escribí cuándo conviene ofrecerlo</div>' if modo == "vacio" else f'<div class="ct area">{CUANDO_VIS}</div>'
    campo = f'<div class="w-cmp ancho"><span class="rt">Cuándo lo ofrece el asistente{info(AY_OFRECE)}</span>{texto}</div>'
    return c.replace(ancla, ancla + campo, 1)


def editor_asistente():
    vol = "FRM-Formularios-22.dc.html"
    V_ = {"Con «Cuándo lo ofrece»": (E.banda(FORM, E.EST_PUB4, E.acc("limpio"), vol), cuerpo_editor()),
          "Sin «Cuándo lo ofrece»": (E.banda(FORM, E.EST_PUB4, E.acc("cambios"), vol), cuerpo_editor("vacio")),
          "Sin el asistente": (E.banda(FORM, E.EST_PUB4, E.acc("limpio"), vol), cuerpo_editor("sin_asistente"))}
    css = E.CSS_E12 + E.CSS_CA4 + E.CSS_TITULOS + X.CSS_19 + K.CSS_RG + K.CSS_21 + ".e-g2 .w-cmp.ancho { grid-column: 1 / -1; }\n.e-g2 .ct.area { height: auto; min-height: 56px; white-space: normal; line-height: 1.45; display: block; padding-top: 8px; padding-bottom: 8px; }\n"
    return A.pagina_editor(V_, {}, E_ED, "Editor · cuándo lo ofrece el asistente · etapa 23", css)


# ---------------------------------------------------------------- FRM-Editor-Sugerencias: la pestaña «Sugerencias», como las reglas
# Cada sugerencia se lee en pasos (138), con las piezas de las reglas de la 21 y como allá: el formulario con su modo, cuándo (si decide la IA),
# la condición (si pregunta siempre) y los datos que pasan. «Historial» va primero en la cabecera y abre su panel al costado (140).
# (formulario, modo, cuándo, condiciones, datos que pasan)
SUGS = [("Entrega de pedido", "La IA decide", "Cuando se cerró una venta y hay que coordinar la entrega al cliente.", [], ["Cliente", "Observaciones"]),
        ("Control de vehículo", "Preguntar siempre", "", ['<b>¿Se concretó la venta?</b> <span class="g">es</span> <b>Sí</b>'], ["Cliente"])]
BAJA = ("Relevamiento de obra", "Preguntar siempre", "", ['<b>Motivo</b> <span class="g">es</span> <b>Reclamo</b>'], ["Cliente"])
AY_SUGS = "Después de una respuesta, ofrece estos formularios a quien respondió. Solo los que son para el mismo destinatario, hasta 20. Valen al guardar, sin volver a publicar."
AY_BAJA = "No se ofrece mientras esté dado de baja. Vuelve si lo reactivan."
SIN_REVISIONES = "Todavía no hay revisiones."
HIST_S = [("Revisión 2", "14/10/2026 11:30 · Lucía Fernández", "1 sugerencia agregada", True), ("Revisión 1", "10/10/2026 09:15 · Lucía Fernández", "1 sugerencia agregada", False)]
I_FORM = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/><path d="M8.5 12.5h7M8.5 16h5"/>', 16)
I_PASAN = svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>', 16)


def pasos_sug(s, baja=False, solo_siempre=False):
    """Una sugerencia en pasos: el formulario con su modo, cuándo, la condición y los datos que pasan, cada uno con su ícono (138)."""
    n, modo, cuando, conds, pasan = s
    if solo_siempre:
        modo, cuando = "Preguntar siempre", ""
    chips = K.chip5(modo) + (f'<span class="ab-chip mal">Dado de baja</span>{info(AY_BAJA)}' if baja else "")
    h = K.paso(I_FORM, f'<p><b>{n}</b>{chips}</p>')
    if cuando:
        h += K.paso(K.I_MSJ, f'<p>{cuando}</p>')
    if conds:
        h += K.paso(K.I_SI, K.cond_lineas(conds))
    if pasan:
        h += K.paso(I_PASAN, '<p><span class="g">Pasan</span>' + K.datos5("".join(f"[{p}]" for p in pasan)) + "</p>")
    return f'<ol class="rg5-p">{h}</ol>'


def fila_sug(k, s, baja=False, solo_siempre=False):
    lapiz = "" if baja else f'<button type="button" class="ib" aria-label="Editar la sugerencia {k}">{LAPIZ}</button>'
    ac = f'<span class="ac">{lapiz}<button type="button" class="ib" aria-label="Quitar la sugerencia {k}">{QUITAR}</button></span>'
    return f'<div class="rg5-r"><span class="n">{k}</span>{pasos_sug(s, baja, solo_siempre)}{ac}</div>'


def b_hist(on=True):
    """«Historial», primero en la cabecera, como en las reglas de la 21; sin revisiones, apagado y con el motivo en su tooltip (140)."""
    if on:
        return '<button type="button" class="cb cb-sec">Historial</button>'
    return (f'<span class="e-tipw"><button type="button" class="cb cb-sec" disabled>Historial</button>'
            f'<span class="e-tip" role="tooltip">{SIN_REVISIONES}</span></span>')


def caja_sugs(abierta=None, guardar="limpio", vacia=False, baja=False, solo_siempre=False, historial=True):
    if guardar == "guardando":
        g = E.trabaja("Guardando…")
    else:
        g = f'<button type="button" class="cb cb-pri"{" disabled" if guardar == "limpio" else ""}>Guardar sugerencias</button>'
    ay = AY_SUGS + (" Sin el asistente, se ofrecen siempre, sin IA." if solo_siempre else "")
    cab = (f'<div class="f-cab"><span class="tt">Qué sugerir después{info(ay)}</span><span class="der">{b_hist(historial)}'
           f'<button type="button" class="cb cb-sec">{MAS} Agregar sugerencia</button>{g}</span></div>')
    if vacia:
        return f'<div class="w-caja rg2 rg5">{cab}<div class="vac">Todavía no sugiere otros formularios.</div></div>'
    filas = ""
    lista = SUGS + ([BAJA] if baja else [])
    for k, s in enumerate(lista, 1):
        filas += abierta if (abierta and k == 1 + (abierta.count("data-segunda") > 0)) else fila_sug(k, s, baja=(baja and s is BAJA), solo_siempre=solo_siempre)
    return f'<div class="w-caja rg2 rg5">{cab}{filas}</div>'


def panel_hist_s(revision=False):
    """El historial de las sugerencias, al costado, como el de las reglas de la 21: tocar una revisión la lee en pasos, sin editar."""
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{F.CERRAR}</button>'
    if revision:
        vol = f'<button type="button" class="ib" aria-label="Volver a las revisiones">{K.I_VOLVER}</button>'
        cuerpo = f'<div class="rv"><span class="cab">10/10/2026 09:15 · Lucía Fernández · 1 sugerencia agregada</span><div>{pasos_sug(SUGS[0])}</div></div>'
        return f'<aside class="rg5-hist" role="dialog" aria-label="Revisión 1"><div class="hh">{vol}<b>Revisión 1</b>{cerrar}</div><div class="cu">{cuerpo}</div></aside>'
    it = "".join(f'<a class="it" href="#"><b>{r}{" <span class=" + chr(34) + "w-est" + chr(34) + ">Vigente</span>" if v else ""}</b><small>{q}</small><small>{c}</small></a>'
                 for r, q, c, v in HIST_S)
    return f'<aside class="rg5-hist" role="dialog" aria-label="Historial de las sugerencias"><div class="hh"><b>Historial de las sugerencias</b>{cerrar}</div><div class="cu">{it}</div></aside>'


def abierta_sug(modo="ia", error=False, segunda=False):
    t = V.sg_abierta(modo, error)
    return t.replace('<div class="sg-fila abierta">', f'<div class="sg-fila abierta"{" data-segunda" if segunda else ""}>', 1)


E_SG = ["Sugerencias", "Editar una sugerencia", "Preguntar siempre", "Un dato de otro tipo", "Hacia un dado de baja", "Guardando", "Sugerencias guardadas",
        "Historial", "Una revisión", "Sin sugerencias", "Sin el asistente"]


def editor_sugerencias():
    def cu(**k):
        return f'<div class="w-body">{caja_sugs(**k)}</div>'
    V_ = {"Sugerencias": cu(), "Editar una sugerencia": cu(abierta=abierta_sug(), guardar="sucio"), "Preguntar siempre": cu(abierta=abierta_sug("siempre", segunda=True), guardar="sucio"),
          "Un dato de otro tipo": cu(abierta=abierta_sug("ia", True), guardar="sucio"), "Hacia un dado de baja": cu(baja=True),
          "Guardando": cu(abierta=abierta_sug(), guardar="guardando"), "Sugerencias guardadas": cu(), "Historial": cu(), "Una revisión": cu(),
          "Sin sugerencias": cu(vacia=True, historial=False), "Sin el asistente": cu(solo_siempre=True)}
    banda = E.banda(FORM, E.EST_PUB4, E.kebab(False), "FRM-Formularios-22.dc.html")
    capas = {"Sugerencias guardadas": A.toast("Sugerencias guardadas."), "Historial": panel_hist_s(), "Una revisión": panel_hist_s(True)}
    css = (E.CSS_E12 + E.CSS_CA4 + X.CSS_19 + K.CSS_RG + K.CSS_21 + K.CSS_RG5 + C.CSS_K4 + C.CSS_K2 + V.CSS_SG
           + ".rg2 .sg-fila.abierta { border-top: 1px solid var(--borde); }\n.rg5-p .tx > p .f-i { margin-left: -4px; }\n"
           + ".rg5 > .f-cab .e-tipw .e-tip { left: auto; right: 0; top: calc(100% + 6px); width: 220px; white-space: normal; z-index: 40; }\n"
           + ".w-caja.rg5:has(.e-tip) { overflow: visible; }\n")
    return A.pagina_editor({e: (banda, V_[e]) for e in E_SG}, capas, E_SG, "Sugerencias · /org/formularios/:id/sugerencias · etapa 23", css)


# ---------------------------------------------------------------- FRM-Editor-Reglas-23: «Armar desde un texto» (63), sobre las reglas en pasos de la 21
AY_ARMAR = "La IA la convierte en una regla normal, que revisás antes de guardar. Después corre sin IA. Cuenta en el tope de IA del mes."
TOPE_REGLA = "Se agotó el tope de IA del mes. Armá la regla a mano."
TEXTO_REGLA = "Cuando se aprueba una visita de más de 100.000, avisale al gerente."
E_RG = ["Reglas", "Armar desde un texto", "Armando", "La regla propuesta", "No se pudo armar", "Tope de IA agotado", "Sin el asistente"]


def b_armar(modo="on"):
    if modo == "tope":
        return (f'<span class="e-tipw"><button type="button" class="cb cb-sec" aria-disabled="true">{CHISPA} Armar desde un texto</button>'
                f'<span class="e-tip" role="tooltip">{TOPE_REGLA}</span></span>')
    return f'<button type="button" class="cb cb-sec">{CHISPA} Armar desde un texto</button>'


def con_armar(cuerpo, modo="on"):
    """«Armar desde un texto», al lado de «Agregar regla» (63), después de «Historial», que va primero (140)."""
    ancla = f'<button type="button" class="cb cb-sec">{MAS} Agregar regla</button>'
    assert ancla in cuerpo
    return cuerpo if modo == "no" else cuerpo.replace(ancla, b_armar(modo) + ancla, 1)


def propuesta():
    """La regla que propone la IA: una regla normal, abierta y sin guardar, con la condición y el mensaje de la 21 (149)."""
    si_ = K.cond5("Monto estimado", "Es mayor o igual a", "100.000") + K.AGREGAR_COND
    acciones = K.a_rol5(1, "Gerente", texto="Se aprobó [Número], de [Cliente], por [Monto estimado].", primera=True, ultima=True)
    return K.regla_abierta5(5, "Se aprueba una respuesta", acciones, si=si_)


def dlg_armar(modo="listo"):
    mal = modo == "error"
    err = '<span class="err2" role="alert">No pudimos armar una regla con ese texto. Contalo de otra forma o armala a mano.</span>' if mal else ""
    cuerpo = (f'<div class="w-cmp"><span class="rt">Qué tiene que pasar{info(AY_ARMAR)}</span><div class="ct area{" mal" if mal else ""}">{TEXTO_REGLA}</div>{err}</div>')
    trab = modo == "armando"
    pie = (f'<button type="button" class="cb cb-sec"{" disabled" if trab else ""}>Cancelar</button>'
           + (E.trabaja("Armando…") if trab else '<button type="button" class="cb cb-pri">Armar la regla</button>'))
    return F.dialogo("Armar una regla desde un texto", cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg motivo"', 1)


def reglas23():
    base = K.cuerpo_reglas5()
    prop = K.caja_reglas5(guardar="sucio")
    prop = prop[:prop.rindex("</div>")] + propuesta() + "</div>"
    con_prop = f'<div class="w-body">{prop}</div>'
    V_ = {"Reglas": con_armar(base), "Armar desde un texto": con_armar(base), "Armando": con_armar(base), "La regla propuesta": con_armar(con_prop),
          "No se pudo armar": con_armar(base), "Tope de IA agotado": con_armar(base, "tope"), "Sin el asistente": base}
    capas = {"Armar desde un texto": dlg_armar(), "Armando": dlg_armar("armando"), "No se pudo armar": dlg_armar("error")}
    banda = E.banda(FORM, E.EST_PUB4, E.kebab(False), "FRM-Formularios-22.dc.html")
    css = (E.CSS_E12 + E.CSS_CA4 + X.CSS_19 + K.CSS_RG + K.CSS_21 + K.CSS_RG5 + AS.B.CSS_22 + ".rg2-si .lg-c { margin: 0; }\n"
           ".rg2 > .f-cab { flex-wrap: wrap; row-gap: 8px; overflow: visible; }\n.rg2 > .f-cab .der { margin-left: auto; }\n"
           ".rg2 > .f-cab .e-tipw .e-tip { left: 0; right: auto; top: calc(100% + 6px); width: 260px; white-space: normal; z-index: 40; }\n"
           ".w-caja.rg2:has(.e-tip) { overflow: visible; }\n")
    return A.pagina_editor({e: (banda, V_[e]) for e in E_RG}, capas, E_RG, "Reglas · armar desde un texto · etapa 23", css)


def tel_reglas23():
    """El teléfono: las reglas en pasos, como la lista de la 21; «Historial» y «Armar desde un texto» debajo del título de la sección."""
    est = ["Reglas", "Armar desde un texto", "Tope de IA agotado"]

    def lista(armar):
        filas = "".join(f'<div class="r"><span class="n">{n}</span>{K.pasos(ev, c, a)}<button type="button" class="ap-ib" aria-label="Editar la regla {n}">{LAPIZ}</button></div>'
                        for n, (ev, c, a) in enumerate(K.REGLAS5, 1))
        return ('<div class="ap-cuerpo"><div class="rg-gtit">Cuando llega una respuesta<a href="#">Agregar regla</a></div>'
                f'<div class="rg-acc"><a href="#">Historial</a>{armar}</div><div class="rg-t5">{filas}</div></div>')
    on = f'<a href="#">{CHISPA} Armar desde un texto</a>'
    tope = f'<span class="off" aria-disabled="true">{CHISPA} Armar desde un texto{A.t_info(TOPE_REGLA)}</span>'
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Guardar reglas</button></div>'
    hoja = F.thoja("Armar una regla desde un texto", F.tcampo("Qué tiene que pasar", TEXTO_REGLA, req=True), '<button type="button" class="cb cb-pri lleno">Armar la regla</button><button type="button" class="cb cb-sec">Cancelar</button>')
    cu = {"Reglas": K.t_bar_f() + lista(on) + fijo, "Armar desde un texto": K.t_bar_f() + lista(on) + fijo, "Tope de IA agotado": K.t_bar_f() + lista(tope) + fijo}
    css = (A.CSS_AB + A.CSS_TED + E.CSS_E12 + E.CSS_TED_E12 + W.CSS_TP + K.CSS_TRG + K.CSS_RG5 + K.CSS_TRG5
           + ".rg-acc { display: flex; align-items: center; gap: 20px; margin: -2px 16px 0; font-size: 15px; font-weight: 500; }\n"
           + ".rg-acc a, .rg-acc .off { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }\n.rg-acc a { color: var(--marca-tx); }\n.rg-acc .off { color: var(--t3); }\n")
    t = C.tel_pagina(cu, est, {"Armar desde un texto": hoja}, "Reglas · armar desde un texto · teléfono · etapa 23", css)
    return K.con_tabs_tel(t, "reglas").replace('"M-FRM-Formularios-21.dc.html"', '"M-FRM-Formularios-22.dc.html"')


# ================================================================ Dar de baja: «Qué deja de pasar» suma el asistente y las sugerencias
def dar_de_baja23():
    t = (PROJ / "FRM-Dar-De-Baja-21.dc.html").read_text(encoding="utf-8")
    m = re.search(r'(<div class="p-card">)(<svg(?:(?!</svg>).)*</svg>)<div class="tx"><b>No se manda más desde el chat</b><span>Sale de «Enviar formulario»\.</span></div></div>', t, re.S)
    assert m, "qué deja de pasar"
    nuevo = (m.group(0) + f'{m.group(1)}{m.group(2)}<div class="tx"><b>El asistente no lo ofrece más</b><span>Sale de los formularios que ofrece.</span></div></div>'
             f'{m.group(1)}{m.group(2)}<div class="tx"><b>2 sugerencias hacia este formulario dejan de ofrecerse</b><span>Vuelven si lo reactivás.</span></div></div>')
    t = t.replace(m.group(0), nuevo, 1)
    return re.sub(r"<title>[^<]*</title>", "<title>Dar de baja · etapa 23</title>", t)


def editor_baja23():
    t = (PROJ / "FRM-Editor-Baja-21.dc.html").read_text(encoding="utf-8")
    ancla = '<span class="k">Por aprobar</span>'
    assert ancla in t
    t = t.replace(ancla, '<span class="k">El asistente</span><span>No lo ofrece.</span><span class="k">Sugerencias</span><span>2 hacia este formulario: no se ofrecen; vuelven si se reactiva.</span>' + ancla)
    return re.sub(r"<title>[^<]*</title>", "<title>Un formulario dado de baja · etapa 23</title>", t)


# ================================================================ Lo que se revisa: los formularios que faltan y de dónde vino una respuesta
def faltan(t):
    """Un dato por celda (109): el renglón de la banda cuenta, y las fechas van completas, con su hora."""
    for a, b in [("Pedidos al asistente, agrupados por tema", "3 temas · 9 pedidos"), ("Hoy, 10:42", "15/10/2026 10:42"), ("Ayer, 17:05", "14/10/2026 17:05"),
                 ("<span>03/10/2026</span>", "<span>03/10/2026 09:15</span>"), ("· 03/10/2026<", "· 03/10/2026 09:15<")]:
        t = t.replace(a, b)
    return t


VALORES_C = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "15/10/2026"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "128.000,00"), ("Motivo", "Venta nueva")]
FILA_132 = ("VIS-000132", "15/10/2026 17:40", "Tomás Acosta", "", "WhatsApp", "Ferretería Rosales", "128.000,00", "Venta nueva")
# Lo que propuso el asistente, en dos columnas (138); lo que Tomás cambió al completarlo lleva su etiqueta, como allá
PROPUESTOS = [("Cliente", "Ferretería Rosales"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", '125.500,00 <span class="ab-chip">Corregido al completar</span>'),
              ("Fecha de la visita", "15/10/2026")]
E_CD = ["La mandó el asistente", "Los datos que propuso", "La cadena"]


def cadena():
    """Sobre la vista rápida de la 21, ya alineada (139, `K.d4`): los momentos con la fecha a la derecha, «Cómo empezó» con los datos propuestos
    en dos columnas y la cadena de respuestas."""
    ver = lambda abierto: f'<button type="button" class="cb cb-enl" aria-expanded="{"true" if abierto else "false"}">{"Ocultar" if abierto else "Ver"} los datos propuestos</button>'  # noqa: E731
    como = lambda abierto: ('<div class="ca-sec"><div class="ca-tit">Cómo empezó</div>'  # noqa: E731
                           + F.grilla([("La preparó", "El asistente, en la conversación con Tomás Acosta"), ("Caso", "Formularios · Visita a cliente"),
                                       ("Por qué", "Reconoció una visita a un cliente: «Cuándo lo ofrece» de Visita a cliente.")]) + ver(abierto)
                           + (F.grilla(PROPUESTOS) if abierto else "") + "</div>")
    moms = (K.m4("Mandada", "15/10/2026 17:21", "El asistente, en la conversación") + K.mo_recibida(FILA_132[1], "Tomás Acosta")
            + K.mo_efectos("Al recibirla", 2, 2, K.A_REC) + K.mo_por_aprobar("hace 5 minutos", FILA_132[1], K.decidir()))
    cad = ('<div class="ca-sec"><div class="ca-tit">Cadena de respuestas</div><div class="ca-cad"><div class="ca-it esta"><b>' + F.ICONO
           + ' VIS-000126 <span class="ab-chip">Esta respuesta</span></b><span>Visita a cliente</span><small>Tomás Acosta · 13/10/2026 15:30</small></div>'
           f'<span class="ca-fl">{V.BAJA} sugirió «Entrega de pedido» · La IA decide · Tomás la aceptó</span>'
           f'<div class="ca-it"><a href="#">{F.ICONO} ENT-000047</a><span>Entrega de pedido</span><small>Tomás Acosta · 13/10/2026 16:10</small></div></div></div>')
    ac = K.acciones_vr("VIS-000132", corregir=False, chat="WA-Chats-Asistente.dc.html")
    paneles = {"La mandó el asistente": K.d4("VIS-000132", "Por aprobar", moms, F.grilla(VALORES_C) + como(False), K.tabs_v(0), acciones=ac, primera=True),
               "Los datos que propuso": K.d4("VIS-000132", "Por aprobar", moms, F.grilla(VALORES_C) + como(True), K.tabs_v(0), acciones=ac, primera=True),
               "La cadena": K.d4(K.NUM_A, "Aprobada", K.moms_126(), cad + F.grilla(K.VAL_A[:4]), K.tabs_v(2, pdf=True),
                                 acciones=K.acciones_vr(K.NUM_A, corregir=False, chat="WA-Chats-Asistente.dc.html", pdf=True), pos="6 de 11")}
    filas = [FILA_132] + K.FILAS
    cu = {e: K.fondo5(filas[:10], vista="Todas", sel=("VIS-000132" if e != "La cadena" else K.NUM_A), pie="1–10 de 25", estados={"VIS-000132": "Por aprobar"})
          for e in E_CD}
    t = K.planilla5(E_CD, {e: K.banda_p() for e in E_CD}, cu, paneles, "Una respuesta · de dónde vino · etapa 23")
    return L.con_css(t, "cadena", V.CSS_CA + ".ca-sec .cb-enl { margin-top: 6px; }\n.g-det .ab-chip { margin-left: 6px; vertical-align: 1px; }\n")


# ================================================================ Plataforma: los máximos de cada límite
AY_MAX = "Cada organización elige sus límites del asistente de WhatsApp dentro de estos máximos."
MAXIMOS = [("Largo máximo de la respuesta", "600", "caracteres"), ("Respuestas por conversación y día", "30", "respuestas"),
           ("Formularios que ofrece por conversación y día", "3", "ofrecimientos")]


def plat_config23():
    t = (PROJ / "Plat-Asistente-Config.dc.html").read_text(encoding="utf-8")
    ancla = '<div class="w-caja"><div class="w-cab"><span>Personas y conversaciones</span></div>'
    assert ancla in t
    campos = "".join(f'<div class="w-cmp"><span class="rt">{r} <span class="req">*</span></span><div class="ct as-din"><span>{v}</span><span class="as-pre" style="margin-left: auto;">{u}</span></div></div>'
                     for r, v, u in MAXIMOS)
    seccion = (f'<div class="w-caja"><div class="w-cab"><span>Máximos del asistente de WhatsApp{info(AY_MAX)}</span></div><div class="as-g2">{campos}</div></div>')
    t = t.replace(ancla, seccion + ancla, 1)
    return re.sub(r"<title>[^<]*</title>", "<title>Plataforma · el asistente · los máximos · etapa 23</title>", t)


def tel_plat_config23():
    t = (PROJ / "M-Plat-Asistente-Config.dc.html").read_text(encoding="utf-8")
    ancla = '<span class="ap-gtit" style="margin: 14px 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1);">Personas y conversaciones</span>'
    assert ancla in t
    campos = "".join(f'<div class="ap-cmp"><span class="rt"><span>{r} <span class="rq">*</span></span></span><div class="ct">{v} {u}</div></div>' for r, v, u in MAXIMOS)
    t = t.replace(ancla, ancla.replace("Personas y conversaciones", "Máximos del asistente de WhatsApp") + campos + ancla, 1)
    return re.sub(r"<title>[^<]*</title>", "<title>Plataforma · el asistente · los máximos · teléfono · etapa 23</title>", t)


# ================================================================ Escribir y registrar
PAG_PLAT = "plat-formularios"
TITULOS = {"WA-Chats-Casos": ("WhatsApp · Clientes · los casos del asistente · etapa 23", 1440, 900), "M-WA-Chats-Casos": ("Los casos · teléfono · etapa 23", 390, 844),
           "M-WA-Modo-Atencion": ("El modo de atención · teléfono · etapa 23", 390, 844),
           "WA-Chats-Asistente": ("WhatsApp · Internos · el asistente atiende · etapa 23", 1440, 900), "WA-Chats-Sugerencia": ("WhatsApp · Internos · el asistente sugiere · etapa 23", 1440, 900),
           "WA-Chats-Audio": ("WhatsApp · Internos · audios · etapa 23", 1440, 900), "M-WA-Conversacion-Asistente": ("WhatsApp · el asistente · teléfono · etapa 23", 390, 844),
           "FRM-Editor-Asistente": ("Formularios · cuándo lo ofrece el asistente · etapa 23", 1440, 1400),
           "FRM-Editor-Sugerencias": ("Formularios · las sugerencias · etapa 23", 1440, 1100),
           "FRM-Editor-Reglas-23": ("Formularios · armar una regla desde un texto · etapa 23", 1440, 1300), "M-FRM-Reglas-23": ("Armar una regla · teléfono · etapa 23", 390, 844),
           "FRM-Dar-De-Baja-23": ("Formularios · dar de baja · etapa 23", 1440, 900), "FRM-Editor-Baja-23": ("Formularios · un dado de baja · etapa 23", 1440, 900),
           "FRM-Faltan": ("Formularios · formularios que faltan · etapa 23", 1440, 900), "M-FRM-Faltan": ("Formularios que faltan · teléfono · etapa 23", 390, 844),
           "FRM-Respuesta-Cadena": ("Formularios · de dónde vino una respuesta · etapa 23", 1440, 900),
           "Plat-Asistente-Config-23": ("Plataforma · el asistente · los máximos · etapa 23", 1440, 1100, PAG_PLAT, 0, 3480),
           "M-Plat-Asistente-Config-23": ("Plataforma · los máximos · teléfono · etapa 23", 390, 844, PAG_PLAT, 1520, 3480)}


def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


def escribir_todo():
    for n, f in [("WA-Chats-Casos", chat_casos), ("WA-Chats-Asistente", chat_asistente), ("WA-Chats-Sugerencia", chat_sugerencia), ("WA-Chats-Audio", chat_audio)]:
        escribir(n, AS.en_whatsapp(E.post(n, f()), "chats", "Inicio / WhatsApp / Chats"))
    for n, f in [("M-WA-Chats-Casos", tel_casos), ("M-WA-Modo-Atencion", tel_modo), ("M-WA-Conversacion-Asistente", tel_chat_asistente), ("M-FRM-Reglas-23", tel_reglas23)]:
        escribir(n, E.post(n, f()))
    escribir_frm("FRM-Editor-Asistente", editor_asistente(), 1400, "diseno")
    escribir_frm("FRM-Editor-Sugerencias", editor_sugerencias(), 1100, "sugerencias")
    escribir_frm("FRM-Editor-Reglas-23", reglas23(), 1300, "reglas")
    escribir("FRM-Dar-De-Baja-23", enlaces23(dar_de_baja23()))
    escribir("FRM-Editor-Baja-23", enlaces23(editor_baja23()))
    escribir("FRM-Respuesta-Cadena", enlaces23(L.sin_disenar("FRM-Respuesta-Cadena", E.post("FRM-Respuesta-Cadena", cadena()))))
    for n in ("FRM-Faltan", "M-FRM-Faltan"):
        escribir(n, faltan((PROJ / f"{n}.dc.html").read_text(encoding="utf-8")))
    escribir("Plat-Asistente-Config-23", plat_config23())
    escribir("M-Plat-Asistente-Config-23", tel_plat_config23())
    return list(TITULOS)
