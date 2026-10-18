"""El asistente de formularios con la disposición de ArquitecturaBase (H1 a H7, las sugerencias s1 a s4 y el campo 03 del lienzo «Formularios por WhatsApp»).

Sigue a `formularios_ab_reglas_1004.py` (E16), con las mismas piezas. Spec: `docs/plans/formularios/asistente.md` del back y el traspaso
(05 · Etapa 5). Se diseña ahora y se programa después del bloque (decisión 19). Decisiones: 27 (audios por un puerto del núcleo),
28 (pasa a modo Asistente quien tiene «Administrar WhatsApp») y 29 (solo en Internos). Donde la disposición de allá choca con una
regla escrita del lienzo, manda la nuestra: ⋮ en las filas, «Estado ▾» en lugar del segmentado, las explicaciones en ⓘ.

Tableros: WA-Chats-Asistente (H1, H3, H5), WA-Chats-Sugerencia (H2), WA-Chats-Audio (H6), FRM-Catalogo-Propuesta (H4), FRM-Faltan (H7),
FRM-Editor-Asistente (03), FRM-Editor-Sugerencias (s2), FRM-Respuesta-Cadena (s4 y el origen del asistente) y los teléfonos
M-WA-Conversacion-Asistente y M-FRM-Faltan. Además suma «Formularios que faltan» al panel de Formularios y a Más › Formularios.
Corre después de `formularios_ab_reglas_1004.py`.
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
import formularios_ab_reglas_1004 as R  # noqa: E402

PROJ = F.PROJ
svg = F.svg
X, CHEV, INFO, ALERTA, OK, MAS, KEBAB = F.X, F.CHEV, F.INFO, F.ALERTA, F.OK, F.MAS, F.KEBAB
LAPIZ, QUITAR = F.LAPIZ, F.QUITAR
CHECK, CHAT, TRI, BOT, DESCARGAR = P.CHECK, P.CHAT, P.TRI, R.BOT, A.DESCARGAR
info = F.info
FALTAN = svg('<rect x="4" y="4.5" width="16" height="15" rx="2"/><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20"/>', 18)
PLAY = svg('<path d="M8 5.5v13l10.5-6.5z"/>', 14, "1.5")
MICRO = svg('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v2.5"/>', 13)
FLECHA_D = svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', 14, "2")
BAJA = svg('<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>', 14, "2")
ASISTENTE_APROBADO = True


# ================================================================ El chat: el modo, el asistente y sus límites
CSS_AS = """.as-modo { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px; border-radius: 6px; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.as-modo.on { background: var(--marca-t); color: var(--marca-tx); border: 1px solid oklch(0.51 0.099 195 / 0.35); }
.as-modo.man { color: var(--t2); font-weight: 500; }
.w-conv .as-tag { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; margin-left: 6px; border-radius: 5px; background: var(--marca-t); color: var(--marca-tx); font-size: 11px; font-weight: 600; }
.w-m.sal.asis .gl { background: oklch(0.96 0.03 185); border: 1px solid oklch(0.85 0.05 185); }
.w-m.sal.asis .aut, .w-m.sal.auto .aut { display: flex !important; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: var(--marca-tx); margin-bottom: 4px; }
.w-m.sal.auto .gl { background: oklch(0.97 0.012 200); border: 1px dashed oklch(0.8 0.04 200); }
.as-card { display: flex; align-items: flex-start; gap: 10px; margin-top: 8px; padding: 9px 10px; border-radius: 8px; background: #fff; border: 1px solid var(--borde); }
.as-card .t { display: flex; flex-direction: column; line-height: 1.35; font-size: 13px; }
.as-card .t small { font-size: 12px; color: var(--t3); }
.as-por { align-self: flex-end; max-width: 68%; padding: 9px 12px; border: 1px dashed var(--borde2); border-radius: 10px; background: #fff; font-size: 12.5px; line-height: 1.45; color: var(--t2); }
.as-por b { color: var(--t1); display: inline-flex; align-items: center; gap: 5px; margin-bottom: 2px; }
.as-quick { display: flex; flex-direction: column; margin-top: 8px; border-top: 1px solid oklch(0.85 0.05 185); }
.as-quick span { display: flex; justify-content: center; padding: 6px 0; font-weight: 600; color: var(--marca-tx); border-bottom: 1px solid oklch(0.88 0.04 185); }
.as-quick span:last-child { border-bottom: 0; }
.as-fr { flex: 1; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--t2); }
.as-aviso { align-self: stretch; display: flex; gap: 8px; align-items: flex-start; padding: 9px 12px; border-radius: 8px; font-size: 13px; line-height: 1.45; }
.as-aviso.inf { background: var(--marca-t); color: var(--marca-tx); }
.as-aviso.amb { background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.as-aviso svg { flex-shrink: 0; margin-top: 1px; }
.as-sug { align-self: stretch; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border: 1px solid oklch(0.51 0.099 195 / 0.4); border-radius: 10px; background: oklch(0.975 0.015 185); font-size: 13px; }
.as-sug .t { flex: 1; display: flex; flex-direction: column; gap: 3px; line-height: 1.4; }
.as-sug .t b { font-size: 13.5px; }
.as-sug .t span { color: var(--t2); }
.as-sug .acc { display: flex; gap: 8px; flex-shrink: 0; }
.as-sug .cb { height: 32px; font-size: 13px; }
.au { display: flex; flex-direction: column; min-width: 340px; padding: 0 !important; overflow: hidden; background: #fff !important; border: 1px solid var(--borde); }
.au .pl { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }
.au .pl .bt { width: 30px; height: 30px; border-radius: 50%; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.au .pl .bt.off { background: var(--s3); color: var(--t3); }
.au .onda { display: inline-flex; align-items: center; gap: 2px; height: 22px; }
.au .onda i { width: 2.5px; border-radius: 2px; background: var(--marca); display: inline-block; }
.au .onda.off i { background: var(--borde2); }
.au .dur { font-size: 12.5px; color: var(--t3); font-variant-numeric: tabular-nums; }
.au .tag { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--t3); }
.au .tr { padding: 8px 12px 10px; border-top: 1px solid var(--borde); font-size: 13px; line-height: 1.45; }
.au .tr small { display: block; font-size: 12px; font-weight: 600; color: var(--t3); margin-bottom: 2px; }
.au .tr.est { display: flex; gap: 6px; align-items: flex-start; color: var(--t2); }
.au .tr.est svg { flex-shrink: 0; margin-top: 2px; }
.w-dlg .db.una { grid-template-columns: minmax(0, 1fr); }
.c-pre { display: flex; flex-direction: column; gap: 6px; }
.c-pre .rt2 { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--t2); }
"""
ONDA = [8, 14, 10, 18, 12, 20, 9, 16, 11, 19, 13, 7, 15, 10, 17, 12, 8, 14, 18, 9, 13, 11]


def audio(estado="transcripto"):
    off = estado == "borrado"
    onda = "".join(f'<i style="height: {h}px;"></i>' for h in ONDA)
    pl = (f'<span class="pl"><span class="bt{" off" if off else ""}">{PLAY}</span><span class="onda{" off" if off else ""}">{onda}</span>'
          f'<span class="dur">0:24</span><span class="tag">{MICRO} Audio</span></span>')
    if estado == "pasando":
        tr = f'<span class="tr est">{A.RELOJ} Pasando el audio a texto…</span>'
    elif estado == "error":
        tr = f'<span class="tr est">{INFO} No pudimos pasar este audio a texto. Escuchalo: el asistente no lo va a responder.</span>'
    elif estado == "borrado":
        tr = f'<span class="tr est">{INFO} El audio y su transcripción ya no están: se borran a los 90 días, como el texto de los mensajes.</span>'
    else:
        tr = '<span class="tr"><small>Transcripción</small>«Recién salgo de Ferretería Rosales, cerramos la venta. Son unos 125.500.»</span>'
    return f'<div class="w-m ent"><span class="gl au">{pl}{tr}</span><span class="pie">11:20</span></div>'


def asistente_burbuja(texto, card="", pie="Asistente · 11:21 · Leído", quick=None):
    q = '<span class="as-quick">' + "".join(f"<span>{b}</span>" for b in quick) + "</span>" if quick else ""
    return (f'<div class="w-m sal asis"><span class="gl"><span class="aut">{BOT} Asistente</span><span>{texto}</span>{card}{q}</span>'
            f'<span class="pie">{pie}</span></div>')


def card_form(prellenado="Cliente, ¿Se concretó la venta? y Monto estimado"):
    return (f'<span class="as-card"><span>{F.ICONO}</span><span class="t"><b>Visita a cliente</b><small>Formulario · versión 4 · botón «Abrir formulario»</small>'
            f'<small>Prellenado: {prellenado}</small></span></span>')


def por_que(texto):
    return f'<div class="as-por"><b>{INFO} Por qué lo mandó</b><br>{texto}</div>'


def ent(texto, hora="11:20"):
    return f'<div class="w-m ent"><span class="gl">{texto}</span><span class="pie">{hora}</span></div>'


def sis(texto):
    return f'<span class="o-sis">{texto}</span>'


PASO = sis("Lucía Fernández pasó la conversación al asistente")
MSJ_TOMAS = ent("Recién salgo de Ferretería Rosales, cerramos la venta. Son unos 125.500.")
VALORES_132 = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "15/10/2026"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "128.000,00")]
POR_QUE_132 = ("Reconoció una visita a un cliente («Cuándo lo ofrece» de Visita a cliente). Propuso Cliente = Ferretería Rosales, ¿Se concretó la venta? = Sí y "
               "Monto estimado = 125.500,00, del mensaje de Tomás; Fecha de la visita = hoy. Tomás puede cambiarlos antes de confirmar.")


def esc_asistente(boton=True):
    b = '<button type="button" class="cb cb-pri">Tomar atención manual</button>' if boton else ""
    return f'<span class="as-fr">{BOT} El asistente atiende esta conversación.</span>{b}'


def menu_chat(asistente_disponible=True):
    pasar = f'<span class="f-mi" role="menuitem">{BOT} Pasar a modo Asistente</span>' if asistente_disponible else ""
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de Tomás Acosta" style="top: 112px; right: 24px; min-width: 230px;">{pasar}'
            '<a class="f-mi" role="menuitem" href="WA-Contacto.dc.html" style="text-decoration: none;">Ver ficha del contacto</a></div>')


def dlg_pasar():
    cuerpo = ('<p class="d-tx">El asistente va a atender la conversación con Tomás Acosta: reconoce pedidos y le manda formularios prellenados. Nunca guarda una respuesta solo.</p>'
              '<p class="d-tx">Podés tomar la atención manual cuando quieras.</p>')
    return F.dialogo("Pasar a modo Asistente", cuerpo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Pasar a Asistente</button>')


def con_modo(t, flags):
    """Suma la marca del modo en la cabecera y en la fila de la lista, y las banderas al JS: flags = {estado: 'as' | 'man'}."""
    t = t.replace('<span class="acc"><a class="cb cb-sec ch" href="WA-Chats-Pasar.dc.html">Pasar</a>',
                  '<span class="acc"><sc-if value="{{modoAs}}" hint-placeholder-val="{{si}}"><span class="as-modo on">' + BOT + ' Asistente</span></sc-if>'
                  '<sc-if value="{{modoMan}}" hint-placeholder-val="{{no}}"><span class="as-modo man">Atención manual</span></sc-if>'
                  '<a class="cb cb-sec ch" href="WA-Chats-Pasar.dc.html">Pasar</a>', 1)
    t = t.replace('<b>Tomás Acosta</b><span>{{hora}}</span>', '<b>Tomás Acosta<sc-if value="{{modoAs}}" hint-placeholder-val="{{si}}"><span class="as-tag">Asistente</span></sc-if></b><span>{{hora}}</span>', 1)
    as_ = json.dumps([e for e, m in flags.items() if m == "as"], ensure_ascii=False)
    man = json.dumps([e for e, m in flags.items() if m == "man"], ensure_ascii=False)
    return t.replace("      si: true, no: false,\n", f"      si: true, no: false, modoAs: {as_}.includes(e), modoMan: {man}.includes(e),\n", 1)


def pagina_chat_as(E, esc, msgs, capas, vp, hora, titulo, flags):
    t = A.pagina_chat(E, esc, msgs, capas, vp, hora, titulo)
    t = con_modo(t, flags)
    return t.replace("</helmet>", f'<style data-asistente="chat">\n{CSS_AS}{R.CSS_AV}</style>\n</helmet>', 1)


ESTADOS_H1 = ["Modo Asistente", "Menú del chat", "Pasar a modo Asistente", "Tomar atención a mitad de un envío", "El asistente no está disponible",
              "Pregunta si duda", "Una consulta: no contesta", "Después de un «ahora no»", "No hay formulario", "Fuera de las 24 horas"]


def chat_asistente():
    E = ESTADOS_H1
    resp = A.tarjeta(A.grilla_r(VALORES_132) + A.r_ok("VIS-000132"))
    auto = R.automatico("Recibimos VIS-000132. Te avisamos cuando la aprueben.", "Regla de Visita a cliente · 11:34 · Entregado", R.card_aviso())
    modo = (PASO + MSJ_TOMAS + asistente_burbuja("Te preparé el formulario de la visita con lo que me contaste. Revisalo y confirmalo.", card_form())
            + por_que(POR_QUE_132) + resp + auto)
    msgs = {
        "Modo Asistente": modo,
        "Menú del chat": MSJ_TOMAS,
        "Pasar a modo Asistente": MSJ_TOMAS,
        "Tomar atención a mitad de un envío": PASO + MSJ_TOMAS + asistente_burbuja("Te preparé el formulario de la visita con lo que me contaste. Revisalo y confirmalo.",
                                                                                   card_form(), "Asistente · 11:21 · Enviando")
        + sis("Lucía Fernández tomó la atención manual")
        + f'<div class="as-aviso inf" role="status">{INFO}<span>Tomaste la atención manual. El asistente estaba mandando un formulario: ese envío termina y queda en la conversación.</span></div>',
        "El asistente no está disponible": MSJ_TOMAS
        + f'<div class="as-aviso amb" role="status">{TRI}<span>El asistente no está disponible: falta configurar la conexión de IA. La conversación sigue en atención manual.</span></div>',
        "Pregunta si duda": PASO + ent("Pasé por lo de Rosales.") + asistente_burbuja("¿Fue una visita o una entrega?", quick=["Visita", "Entrega"]),
        "Una consulta: no contesta": PASO + ent("¿A qué hora abre el depósito el sábado?") + sis("Sin respuesta del asistente · queda para un operador"),
        "Después de un «ahora no»": PASO + MSJ_TOMAS + asistente_burbuja("Te preparé el formulario de la visita con lo que me contaste.", card_form(), "Asistente · 11:21 · Leído")
        + ent("Ahora no, después lo cargo.", "11:23") + asistente_burbuja("Dale, cuando quieras pedímelo.", pie="Asistente · 11:23 · Leído"),
        "No hay formulario": PASO + ent("Quiero cargar un reclamo de Ferretería Rosales.")
        + asistente_burbuja("Todavía no hay un formulario para registrar reclamos. Ya anoté el pedido para que lo armen.", pie="Asistente · 11:21 · Leído"),
        "Fuera de las 24 horas": PASO + sis("Último mensaje de Tomás: ayer, 9:10") + sis("El asistente espera a que Tomás escriba"),
    }
    man = {"Menú del chat", "Pasar a modo Asistente", "Tomar atención a mitad de un envío", "El asistente no está disponible"}
    esc = {e: (A.escr() if e in man else esc_asistente()) for e in E}
    capas = {"Menú del chat": menu_chat(), "Pasar a modo Asistente": dlg_pasar()}
    vp = {e: "Asistente: Recibimos VIS-000132…" for e in E}
    vp.update({"Menú del chat": "Recién salgo de Ferretería Rosales…", "Pasar a modo Asistente": "Recién salgo de Ferretería Rosales…",
               "El asistente no está disponible": "Recién salgo de Ferretería Rosales…", "Pregunta si duda": "Asistente: ¿Fue una visita o una entrega?",
               "Una consulta: no contesta": "¿A qué hora abre el depósito el sábado?", "Después de un «ahora no»": "Asistente: Dale, cuando quieras pedímelo.",
               "No hay formulario": "Asistente: Todavía no hay un formulario…", "Fuera de las 24 horas": "Ayer: Gracias, mañana sigo."})
    hora = {e: "11:34" for e in E}
    flags = {e: ("man" if e in man else "as") for e in E}
    return pagina_chat_as(E, esc, msgs, capas, vp, hora, "WhatsApp · Internos · el asistente atiende", flags)


# ================================================================ H2 · en atención manual, sugiere
def sugerencia(audio_=False):
    sub = "Prellenado con lo que contó en el audio." if audio_ else "Prellenado con Cliente: Ferretería Rosales, ¿Se concretó la venta?: Sí y Monto estimado: 125.500,00."
    return (f'<div class="as-sug" role="status"><span style="color: var(--marca-tx); margin-top: 1px;">{BOT}</span><span class="t"><b>El asistente sugiere mandarle Visita a cliente</b>'
            f'<span>{sub}</span></span><span class="acc"><button type="button" class="cb cb-sec">No, gracias</button><button type="button" class="cb cb-pri">Revisar y enviar</button></span></div>')


def dlg_revisar():
    t = A.dlg_enviar("pocos", 0)
    pre = ('<div class="c-pre"><span class="rt2">Datos que van prellenados ' + info("Tomás los ve cargados y los puede cambiar. Lo que destildes va vacío.") + "</span>"
           + "".join(R.ck(f"{k}: {v}") for k, v in [("Cliente", "Ferretería Rosales"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "125.500,00"), ("Fecha de la visita", "hoy")])
           + "</div>")
    k = t.index('<span class="c-lin">')
    return t[:k] + pre + t[k:]


ESTADOS_H2 = ["Sugerencia", "Revisar y enviar", "No, gracias"]


def chat_sugerencia():
    E = ESTADOS_H2
    base = MSJ_TOMAS
    msgs = {"Sugerencia": base + sugerencia(), "Revisar y enviar": base + sugerencia(), "No, gracias": base + sis("Descartaste la sugerencia del asistente")}
    esc = {e: A.escr() for e in E}
    capas = {"Revisar y enviar": dlg_revisar()}
    vp = {e: "Recién salgo de Ferretería Rosales…" for e in E}
    hora = {e: "11:20" for e in E}
    t = pagina_chat_as(E, esc, msgs, capas, vp, hora, "WhatsApp · Internos · el asistente sugiere", {e: "man" for e in E})
    return t.replace("</helmet>", '<style data-asistente="revisar">\n.mf-ck, .rg-ck { display: flex; align-items: center; gap: 10px; font-size: 13.5px; min-height: 26px; }\n'
                     + ".rg-ck .bx { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--borde2); display: inline-flex; align-items: center; justify-content: center; background: #fff; box-sizing: border-box; }\n"
                     + ".rg-ck.on .bx { background: var(--marca); border-color: var(--marca); color: #fff; }\n</style>\n</helmet>", 1)


# ================================================================ H6 · audios en el chat
ESTADOS_H6 = ["Pasando a texto", "Transcripto", "En modo Asistente", "En atención manual, sugiere", "No se pudo pasar a texto", "Ya no está"]


def chat_audio():
    E = ESTADOS_H6
    msgs = {
        "Pasando a texto": audio("pasando"),
        "Transcripto": audio(),
        "En modo Asistente": PASO + audio() + asistente_burbuja("Te preparé el formulario de la visita con lo que me contaste.", card_form())
        + por_que("Del audio de Tomás: Cliente, ¿Se concretó la venta? y Monto estimado."),
        "En atención manual, sugiere": audio() + sugerencia(True),
        "No se pudo pasar a texto": PASO + audio("error") + sis("Sin leer · queda para un operador"),
        "Ya no está": audio("borrado"),
    }
    flags = {e: ("as" if e in ("En modo Asistente", "No se pudo pasar a texto") else "man") for e in E}
    esc = {e: (esc_asistente() if flags[e] == "as" else A.escr()) for e in E}
    vp = {e: "Audio · 0:24" for e in E}
    vp["En modo Asistente"] = "Asistente: Te preparé el formulario…"
    hora = {e: "11:21" for e in E}
    return pagina_chat_as(E, esc, msgs, {}, vp, hora, "WhatsApp · Internos · audios", flags)


# ================================================================ H4 · un catálogo que propone el asistente (la pantalla de K4, marcada como propuesta)
def f_fuente_prop(falta=False):
    conds = (C.f_cond("Si", "Rol", "tiene alguno de", '<span class="k-chip">Supervisor ×</span>') + C.f_cond("Y", "Activo", "es", "Sí")
             + C.f_cond("Y", "Empresa", "es", "Delta Norte S.A."))
    nota = ('<span class="k-nota" role="status">No se pudo filtrar por zona: ese dato no existe en la vista Miembros.</span>' if falta else "")
    return ('<div class="w-caja"><div class="f-cab"><span>De dónde salen: los miembros, con filtros</span></div><div class="k-sec"><div class="k-g3">'
            f'<div class="w-cmp"><span class="rt">Vista</span><div class="ct ro">Miembros{A.CANDADO}</div><span class="ay">Columnas: Nombre, Rol, Empresa, Activo.</span></div>'
            f'<div class="w-cmp"><span class="rt">Texto de cada opción</span><div class="ct sel">Nombre{CHEV}</div></div>'
            f'<div class="w-cmp"><span class="rt">Detalle</span><div class="ct sel">Rol{CHEV}</div></div></div>'
            f'<span class="rt2">Qué miembros entran</span><div class="k-conds">{conds}</div>{nota}</div></div>')


def prev_prop():
    li = [("Florencia Fernández de la Fu…", "Supervisora"), ("Julián Sosa", "Supervisor"), ("Valeria Ruiz", "Supervisora")]
    cuerpo = "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in li) + '<div class="pie">3 opciones · comprobado hoy a las 10:12</div>'
    return f'<div class="w-caja"><div class="f-cab"><span>Vista previa</span></div><div class="k-prev">{cuerpo}</div></div>'


ESTADOS_H4 = ["Propuesta", "Un dato que no existe", "Descartar propuesta", "Aprobada", "Sin permiso para aprobar"]


def catalogo_propuesta():
    E = ESTADOS_H4
    tit = "Supervisores de Delta Norte"
    chip = '<span class="w-est pend">Propuesta del asistente</span>'
    acc = '<button type="button" class="cb cb-sec">Descartar propuesta</button><button type="button" class="cb cb-pri">Aprobar y activar</button>'
    banner = (f'<div class="w-cartel info" role="status">{BOT}<span class="tx"><b>Propuesta del asistente.</b> La pidió Lucía Fernández por WhatsApp, hoy a las 10:12. '
              'No se usa hasta que alguien la apruebe.</span></div>')
    def cuerpo(falta=False, con_banner=True):
        return ('<div class="w-body">' + (banner if con_banner else "") + '<div class="f-cols k4"><div class="f-pila">'
                + C.k_catalogo(tit, "Supervisores activos de Delta Norte S.A.", origen="De los miembros") + f_fuente_prop(falta) + "</div>" + prev_prop() + "</div></div>")
    V = {"Propuesta": (C.banda_k(tit, chip, acc), cuerpo()), "Un dato que no existe": (C.banda_k(tit, chip, acc), cuerpo(True)),
         "Descartar propuesta": (C.banda_k(tit, chip, acc), cuerpo()), "Aprobada": (C.banda_k(tit, C.ACTIVO, C.k_acc()), cuerpo(con_banner=False)),
         "Sin permiso para aprobar": (C.banda_k(tit, chip, ""), cuerpo())}
    capas = {"Descartar propuesta": A.confirmar("¿Descartar la propuesta?", "El catálogo propuesto se borra. Si lo necesitan, se puede pedir de nuevo.", "Descartar propuesta"),
             "Aprobada": A.toast("Catálogo aprobado y activo.")}
    css = (F.CSS_FICHA + F.CSS_ESTADOS + A.CSS_AB + C.CSS_K3 + C.CSS_K4 + ".f-cols.k4 { grid-template-columns: minmax(0, 1fr) 360px; }\n"
           + ".k-nota { font-size: 12.5px; color: oklch(0.45 0.1 70); }\n.w-cartel.info svg { flex-shrink: 0; }\n.w-body > .w-cartel { margin-top: 0; }\n")
    t = C.pagina_k("Catálogo propuesto por el asistente · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Supervisores de Delta Norte",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]), css, E, A.js_estados(E), alto=1000)
    over = "".join(f'<sc-if value="{{{{s{E.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over)


# ================================================================ H7 · formularios que faltan
TEMAS = [("Reclamos de clientes", "Dejar asentado el reclamo de un cliente: qué pasó y qué pide.", 5, 3, "Hoy, 10:42"),
         ("Pedidos de materiales", "Pedir materiales para una obra, con cantidades.", 3, 2, "Ayer, 17:05"),
         ("Horas extra", "Registrar horas trabajadas fuera del horario.", 1, 1, "03/10/2026")]
DESCARTADOS = [("Encuesta de clima", "Preguntar cómo se siente el equipo.", 2, 2, "Descartado por Lucía Fernández · 10/10/2026"),
               ("Cambio de turno", "Pedir cambiar un turno con un compañero.", 1, 1, "Descartado por Lucía Fernández · 08/10/2026")]
CSS_FT = """.w-th.ft, .w-tr.ft { grid-template-columns: minmax(280px, 2fr) 90px 90px minmax(150px, 1fr) 48px; }
.w-tr.ft { min-height: 56px; position: relative; overflow: visible; }
.w-tr.ft .k-tc { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.w-tr.ft .k-tc b { font-weight: 600; }
.w-tr.ft .k-tc small { font-size: 12px; color: var(--t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-tr.ft .r { text-align: right; }
.w-tr.ft .f-menu { top: 44px; right: 8px; }
.w-caja.ftc { overflow: visible; }
.o-fb .w-bus { width: 300px; flex: none; }
.o-fb .tot { margin-left: auto; font-size: 13px; color: var(--t3); }
.w-bnd h1 .f-i { vertical-align: middle; }
.w-panel .w-ln { white-space: nowrap; }
"""


def fila_ft(t, menu=False, descartado=False):
    n, d, ped, per, ult = t
    items = (f'<a class="f-mi" role="menuitem" href="FRM-Editor.dc.html">{MAS} Crear formulario</a>'
             + ("" if descartado else f'<span class="f-sep" role="separator"></span><span class="f-mi pel" role="menuitem">{QUITAR} Descartar</span>'))
    m = f'<div class="f-menu" role="menu" aria-label="Acciones de {n}">{items}</div>' if menu else ""
    return (f'<div class="w-tr ft"><span class="k-tc"><b>{n}</b><small>{d}</small></span><span class="r">{ped}</span><span class="r">{per}</span>'
            f'<span>{ult}</span><span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>{m}</div>')


ESTADOS_H7 = ["Pendientes", "Acciones de un tema", "Descartar un tema", "Estado: menú", "Descartados", "Vacío", "Cargando", "No se pudo cargar"]


def faltan():
    E = ESTADOS_H7
    def barra(modo="pend"):
        menu = ""
        if modo == "menu":
            menu = ('<span class="f-mn" role="listbox" aria-label="Filtrar por estado"><span role="option" class="on">Pendientes<span class="cnt">3</span></span>'
                    '<span role="option">Descartados<span class="cnt">2</span></span></span>')
        txt = "Estado: descartados" if modo == "desc" else "Estado: pendientes"
        tot = "2 temas · 3 pedidos" if modo == "desc" else "3 temas · 9 pedidos"
        return (f'<div class="w-caja o-fb"><span class="w-bus">{F.BUSCAR} Buscar por tema</span><span class="f-env"><span class="w-pil con" role="button">{txt} {CHEV}</span>{menu}</span>'
                f'<span class="tot">{tot}</span></div>')
    cab = '<div class="w-th ft"><span>Tema</span><span class="r">Pedidos</span><span class="r">Personas</span><span>Último pedido</span><span class="sr">Acciones</span></div>'
    def tabla(filas):
        return f'<div class="w-caja ftc">{cab}{filas}<div class="w-pie"><span>1–{filas.count("w-tr ft")} de {filas.count("w-tr ft")}</span><span>10 por página · Página 1 de 1</span></div></div>'
    pend = "".join(fila_ft(t) for t in TEMAS)
    pend_menu = "".join(fila_ft(t, menu=(k == 0)) for k, t in enumerate(TEMAS))
    desc = "".join(fila_ft(t, descartado=True) for t in DESCARTADOS)
    def cuerpo(*p):
        return '<div class="w-body">' + "".join(p) + "</div>"
    variantes = [("Pendientes", cuerpo(barra(), tabla(pend))), ("Acciones de un tema", cuerpo(barra(), tabla(pend_menu))),
                 ("Descartar un tema", cuerpo(barra(), tabla(pend))), ("Estado: menú", cuerpo(barra("menu"), tabla(pend))),
                 ("Descartados", cuerpo(barra("desc"), tabla(desc))),
                 ("Vacío", cuerpo('<div class="w-caja"><div class="pl-vacio"><b>Nadie pidió formularios que no existen.</b></div></div>')),
                 ("Cargando", cuerpo(barra(), '<div class="w-caja">' + P.ESQ + "</div>")),
                 ("No se pudo cargar", cuerpo(barra(), '<div class="w-caja"><div class="pl-vacio"><b>No pudimos cargar los pedidos.</b><button type="button" class="cb cb-sec">Reintentar</button></div></div>'))]
    tit = "Formularios que faltan " + info("Lo que alguien quiso registrar por WhatsApp y no tenía un formulario que pudiera completar. El asistente los agrupa por tema; no se guardan nombres ni mensajes.")
    banda = F.banda(tit, "Pedidos al asistente, agrupados por tema", "").replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{FALTAN}</span>', 1)
    t = A.pagina_ab("Formularios que faltan · /org/formularios/faltan", "Inicio / Formularios / Formularios que faltan", banda, A.con_estados(variantes),
                    css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + P.CSS_PL + CSS_FT, estados=("estado", E), js=A.js_estados(E))
    k = t.index('<aside class="w-panel" aria-label="Formularios">')
    t = t[:k] + t[k:].replace('<a class="w-ln on" href="FRM-Listado.dc.html">', '<a class="w-ln" href="FRM-Listado.dc.html">', 1)
    t = poner_faltan(t, activo=True)
    over = f'<sc-if value="{{{{s{E.index("Descartar un tema")}}}}}" hint-placeholder-val="{{{{no}}}}">' + A.confirmar(
        "¿Descartar «Reclamos de clientes»?", "Pasa a Descartados. Si lo vuelven a pedir, aparece de nuevo en Pendientes.", "Descartar") + "</sc-if>"
    return F.con_dialogo(t, over)


# ================================================================ 03 · «Cuándo lo ofrece el asistente» en el editor
CUANDO_VIS = "Cuando un vendedor cuenta que visitó a un cliente: a quién, si se cerró la venta y por cuánto."


def cuerpo_editor_asistente(vacio=False):
    c = A.cuerpo_editor(abierta=False, modo="fijo")
    ancla = '<span class="ay">El prefijo quedó fijo al publicar por primera vez.</span></div>'
    assert c.count(ancla) == 1
    rt = '<span class="rt">Cuándo lo ofrece el asistente ' + info("El asistente lee el mensaje y, si coincide con esto, ofrece el formulario. No guarda nada sin que la persona confirme.") + "</span>"
    if vacio:
        campo = f'<div class="w-cmp ancho">{rt}<div class="ct area ph">Escribí cuándo conviene ofrecerlo</div><span class="ay">Sin esto, el asistente no lo ofrece.</span></div>'
    else:
        campo = f'<div class="w-cmp ancho">{rt}<div class="ct area">{CUANDO_VIS}</div></div>'
    return c.replace(ancla, ancla + campo, 1)


ESTADOS_03 = ["Con «Cuándo lo ofrece»", "Sin «Cuándo lo ofrece»"]


def editor_asistente():
    vol = "FRM-Listado.dc.html"
    V = {"Con «Cuándo lo ofrece»": (A.banda("Visita a cliente", A.EST_PUB, A.acc_editor(publicado=True), vol), cuerpo_editor_asistente()),
         "Sin «Cuándo lo ofrece»": (A.banda("Visita a cliente", A.EST_PUB_SUCIO, A.acc_editor(sucio=True, publicado=True), vol), cuerpo_editor_asistente(True))}
    return A.pagina_editor(V, {}, ESTADOS_03, "Editor del formulario · con el asistente · /org/formularios/:id",
                           ".e-g2 .w-cmp.ancho { grid-column: 1 / -1; }\n.e-g2 .ct.area { min-height: 60px; }\n")


# ================================================================ s2 · «Qué sugerir después», debajo de las reglas
SUGS = [("Entrega de pedido", "La IA decide", "Cuando se cerró una venta y hay que coordinar la entrega al cliente.", "cliente y observaciones"),
        ("Control de vehículo", "Preguntar siempre", "Solo si «¿Se concretó la venta?» es Sí.", "cliente")]
CSS_SG = """.sg-fila { display: grid; grid-template-columns: minmax(0, 1fr) 32px; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--borde); align-items: start; position: relative; }
.sg-fila.abierta { background: oklch(0.985 0.006 78); grid-template-columns: minmax(0, 1fr); }
.sg-fila .n { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
.sg-fila .d { font-size: 13px; color: var(--t2); margin-top: 4px; line-height: 1.45; }
.sg-fila .d small { display: block; font-size: 12.5px; color: var(--t3); }
.sg-ed { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 16px; }
.sg-ed .ancho { grid-column: 1 / -1; }
.sg-ed .k-ops { gap: 8px; }
.sg-map { display: grid; grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr) 32px; gap: 8px; align-items: center; }
.sg-map .ct { display: flex; justify-content: space-between; align-items: center; height: 36px; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 13.5px; }
.sg-map .ct small { color: var(--t3); margin-right: 4px; }
.sg-map .ct.mal { border-color: var(--peligro); }
.sg-map .ib { width: 32px; height: 32px; border: 1px solid var(--borde); border-radius: 8px; }
.sg-map > svg { color: var(--t3); }
.sg-err { grid-column: 1 / -1; font-size: 12.5px; color: oklch(0.5 0.19 25); }
.sg-prev { padding: 14px; background: oklch(0.95 0.015 80); display: flex; flex-direction: column; gap: 8px; }
.sg-prev .sg-bb { display: flex; flex-direction: column; align-self: flex-start; max-width: 90%; background: #fff; border: 1px solid var(--borde); border-radius: 10px; border-top-left-radius: 3px; overflow: hidden; font-size: 13px; line-height: 1.45; }
.sg-prev .sg-bb span { display: block; padding: 8px 10px; white-space: normal; }
.sg-prev .sg-ee { white-space: normal; }
.sg-prev > * { flex-shrink: 0; }
.sg-prev .sg-bb .bt { display: flex; justify-content: center; padding: 7px 0; border-top: 1px solid var(--borde); color: var(--marca-tx); font-weight: 600; }
.sg-prev .sg-ee { align-self: flex-end; background: oklch(0.93 0.05 150); border-radius: 10px; border-top-right-radius: 3px; padding: 7px 10px; font-size: 13px; }
"""


def chip_modo(m):
    return f'<span class="ab-chip">{m}</span>'


def sg_fila(s, menu=False):
    n, modo, cuando, pasa = s
    etiqueta = "Cuándo" if modo == "La IA decide" else "Cuándo"
    m = ""
    if menu:
        m = (f'<div class="f-menu" role="menu" aria-label="Acciones de {n}"><span class="f-mi" role="menuitem">{LAPIZ} Editar</span>'
             f'<span class="f-sep" role="separator"></span><span class="f-mi pel" role="menuitem">{QUITAR} Quitar sugerencia</span></div>')
    return (f'<div class="sg-fila"><div><span class="n">{n} {chip_modo(modo)}</span><div class="d">{etiqueta}: {cuando}<small>Pasa: {pasa}</small></div></div>'
            f'<button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button>{m}</div>')


def sg_abierta(modo="ia", error=False):
    ia = modo == "ia"
    ops = (f'<div class="k-ops"><div class="k-op{" on" if ia else ""}" role="radio" aria-checked="{"true" if ia else "false"}"><span class="rd"></span><span class="tx"><b>La IA decide</b>'
           '<span>Lo ofrece si encaja con el «cuándo» o si la persona lo pide.</span></span></div>'
           f'<div class="k-op{"" if ia else " on"}" role="radio" aria-checked="{"false" if ia else "true"}"><span class="rd"></span><span class="tx"><b>Preguntar siempre</b>'
           '<span>Lo ofrece después de cada respuesta, sin IA. Se puede limitar con «Solo si».</span></span></div></div>')
    como = f'<div class="w-cmp"><span class="rt">Cómo se ofrece</span>{ops}</div>'
    form = R.campo("Formulario a sugerir", "Entrega de pedido", sel=True)
    if ia:
        cuando = R.area("Cuándo sugerirlo", "Cuando se cerró una venta y hay que coordinar la entrega al cliente.",
                        req=True, extra_rt=" " + info("Es lo que lee el asistente para decidir. Escribilo como se lo explicarías a un compañero."))
    else:
        cuando = '<div class="w-cmp ancho"><span class="rt">Solo si (opcional)</span>' + C.f_cond("Si", "¿Se concretó la venta?", "es", "Sí") + "</div>"
    filas = [("Visita", "Cliente", "Entrega", "Cliente", False), ("Visita", "Observaciones", "Entrega", "Observaciones", False)]
    if error:
        filas.append(("Visita", "Monto estimado", "Entrega", "Fecha de entrega", True))
    mapa = "".join(f'<div class="sg-map"><div class="ct"><span><small>{a} ·</small>{b}</span>{CHEV}</div>{FLECHA_D}<div class="ct{" mal" if mal else ""}"><span><small>{c} ·</small>{d}</span>{CHEV}</div>'
                   f'<button type="button" class="ib" aria-label="Quitar dato">{X}</button></div>' + ('<span class="sg-err">Solo se unen preguntas del mismo tipo: Monto estimado es un número y Fecha de entrega, una fecha.</span>' if mal else "")
                   for a, b, c, d, mal in filas)
    datos = (f'<div class="w-cmp ancho"><span class="rt">Datos que pasan ' + info("Solo se unen preguntas del mismo tipo. El resto lo completa la persona; puede revisar todo antes de confirmar.") + "</span>"
             f'<div style="display: flex; flex-direction: column; gap: 8px;">{mapa}</div><button type="button" class="cb cb-enl" style="align-self: flex-start;">{MAS} Agregar dato</button></div>')
    listo = '<div class="ancho" style="display: flex; justify-content: flex-end;"><button type="button" class="cb cb-sec">Listo</button></div>'
    return f'<div class="sg-fila abierta"><div class="sg-ed">{form}{como}{cuando}{datos}{listo}</div></div>'


def caja_sugerencias(modo="normal"):
    tit = f'<span class="rg-tit">Qué sugerir después {info("Después de esta respuesta, el asistente puede ofrecer estos formularios a quien respondió. Se aplica al guardar: no hace falta volver a publicar.")}</span>'
    sucio = modo in ("editar", "siempre", "sucio", "error")
    insignia = '<span class="ab-chip">Revisión 2</span>' if modo == "guardadas" else ('<span class="f-sucio">Cambios sin guardar</span>' if sucio else ("" if modo == "vacio" else '<span class="ab-chip">Revisión 1</span>'))
    boton = f'<button type="button" class="cb cb-pri"{"" if sucio and modo != "error" else " disabled"}>Guardar sugerencias</button>'
    if modo == "vacio":
        filas = '<div class="rg-vacio"><b>Todavía no sugiere otros formularios.</b></div>'
    else:
        filas = ""
        for k, s in enumerate(SUGS):
            if k == 0 and modo in ("editar", "error"):
                filas += sg_abierta("ia", modo == "error")
            elif k == 1 and modo == "siempre":
                filas += sg_abierta("siempre")
            else:
                filas += sg_fila(s, menu=(modo == "menu" and k == 0))
    pie = f'<div class="rg-pie"><button type="button" class="cb cb-sec">{MAS} Agregar sugerencia</button></div>'
    return f'<div class="w-caja rg"><div class="f-cab">{tit}<span class="der">{insignia}{boton}</span></div>{filas}{pie}</div>'


def vista_sugerencia():
    return ('<div class="w-caja"><div class="f-cab"><span class="rg-tit">Así lo ve el empleado</span></div><div class="sg-prev">'
            '<span class="sg-ee">Visita a cliente · respuesta enviada</span>'
            '<span class="sg-bb"><span>Listo, quedó VIS-000126. Como se cerró la venta, te preparé el formulario de la entrega con el cliente y las observaciones.</span>'
            '<span class="bt">Abrir formulario</span></span></div></div>')


ESTADOS_SG = ["Sugerencias", "Acciones de una sugerencia", "Editar una sugerencia", "Preguntar siempre", "Un dato de otro tipo", "Cambios sin guardar",
              "Sugerencias guardadas", "Sin sugerencias"]
MODO_SG = {"Sugerencias": "normal", "Acciones de una sugerencia": "menu", "Editar una sugerencia": "editar", "Preguntar siempre": "siempre",
           "Un dato de otro tipo": "error", "Cambios sin guardar": "sucio", "Sugerencias guardadas": "guardadas", "Sin sugerencias": "vacio"}
SUBIR_SUG = 1245


def cuerpo_sugerencias(modo):
    arriba = A.cuerpo_editor(abierta=False, modo="fijo")
    arriba = arriba[len('<div class="w-body">'):-len("</div>")]
    reglas = f'<div class="rg-cols">{R.caja_reglas("normal")}{R.caja_historial("normal")}</div>'
    return (f'<div class="w-body rg-body"><div class="rg-arriba">{arriba}{reglas}</div>'
            f'<div class="rg-cols">{caja_sugerencias(modo)}{vista_sugerencia()}</div></div>')


def editor_sugerencias():
    vol = "FRM-Listado.dc.html"
    V = {e: (A.banda("Visita a cliente", A.EST_PUB, A.acc_editor(publicado=True), vol), cuerpo_sugerencias(m)) for e, m in MODO_SG.items()}
    capas = {"Sugerencias guardadas": A.toast("Sugerencias guardadas.")}
    css = C.CSS_K4 + C.CSS_K2 + R.CSS_RG + CSS_SG + f".rg-arriba {{ margin-top: -{SUBIR_SUG}px; }}\n"
    return A.pagina_editor(V, capas, ESTADOS_SG, "Editor del formulario · qué sugerir después · /org/formularios/:id", css)


# ================================================================ s4 · la cadena entre respuestas y el origen del asistente, en el detalle
CSS_CA = """.ca-sec { margin-top: 14px; }
.ca-tit { font-size: 13px; font-weight: 600; color: var(--t2); margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
.ca-cad { display: flex; flex-direction: column; gap: 6px; }
.ca-it { border: 1px solid var(--borde); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; font-size: 13px; background: #fff; }
.ca-it.esta { border-color: var(--marca); box-shadow: 0 0 0 1px var(--marca); }
.ca-it a, .ca-it b { font-weight: 600; color: var(--t1); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
.ca-it small { color: var(--t3); font-size: 12px; }
.ca-fl { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--t3); padding-left: 10px; }
.d2-mom .t small .lnk { color: var(--marca-tx); }
"""


def d2_cadena(modo):
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)">{P.SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{P.BAJA}</button>')
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{X}</button>'
    if modo == "asistente":
        num, hora, linea = "VIS-000132", "15/10/2026 11:34", f"{P.PERSONA} La mandó el asistente · la confirmó Tomás Acosta por WhatsApp"
        valores = VALORES_132 + [("Motivo", "Venta nueva"), ("Supervisor a cargo", "Martín Paz"), ("Fotos de la visita", None), ("Remito firmado", None), ("Observaciones", None)]
        extra = ('<div class="ca-sec"><div class="ca-tit">Cómo empezó</div>'
                 + F.grilla([("La mandó", "El asistente, en la conversación con Tomás Acosta"),
                             ("Por qué", "Reconoció una visita a un cliente («Cuándo lo ofrece» de Visita a cliente)."),
                             ("Propuso", "Cliente, ¿Se concretó la venta? y Monto estimado, del mensaje de Tomás; Fecha de la visita = hoy."),
                             ("Cambió", "Tomás cambió Monto estimado de 125.500,00 a 128.000,00 y la confirmó.")]) + "</div>")
    else:
        num, hora, linea = "VIS-000126", "13/10/2026 15:30", f"{P.PERSONA} La respondió Tomás Acosta por WhatsApp · se la mandó Lucía Fernández"
        valores = P.VALORES_126
        cad = ('<div class="ca-cad"><div class="ca-it esta"><b>' + F.ICONO + ' VIS-000126 <span class="ab-chip">Esta respuesta</span></b><span>Visita a cliente</span>'
               '<small>Tomás Acosta · 13/10/2026 15:30</small></div>'
               f'<span class="ca-fl">{BAJA} sugirió «Entrega de pedido» y Tomás aceptó</span>'
               f'<div class="ca-it"><a href="#">{F.ICONO} ENT-000047</a><span>Entrega de pedido</span><small>Tomás Acosta · 13/10/2026 16:10</small></div></div>')
        extra = (f'<div class="ca-sec"><div class="ca-tit">La cadena {info("Cada respuesta recuerda de dónde vino: así se arma el recorrido completo.")}</div>{cad}</div>')
    sub = (f'<div class="d2-sub"><span>Visita a cliente · versión 4</span><a class="cb cb-sec" href="WA-Chats-Asistente.dc.html">{CHAT} Abrir conversación</a></div>')
    mom = (f'<div class="d2-mom"><span class="ck">{CHECK}</span><span class="t"><span><b>Recibida</b><span class="h">{hora}</span></span><small>{linea}</small></span></div>')
    pest = '<div class="o-tabs" role="tablist"><span role="tab" class="on">Respuesta</span><span role="tab">Actividad</span></div>'
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {num}"><div class="d2-h"><b>{num}</b>{nav}{cerrar}</div>'
            f'{sub}{mom}{pest}<div class="d2-b">{F.grilla(valores)}{extra}</div></aside>')


ESTADOS_CA = ["La mandó el asistente", "La cadena"]


def respuesta_cadena():
    E = ESTADOS_CA
    capas = A.con_estados([("La mandó el asistente", d2_cadena("asistente")), ("La cadena", d2_cadena("cadena"))])
    fondo = A.con_estados([("La mandó el asistente", P.planilla_fondo()), ("La cadena", P.planilla_fondo(sel="VIS-000126"))])
    t = P.pagina_pl("Respuesta · de dónde vino · /org/formularios/:id/respuestas?respuesta=VIS-000132", P.banda_pl(), fondo, E,
                    A.js_estados(E, "      panelPocos: true, panelMuchos: false,\n"), css=F.CSS_GRILLA + P.CSS_D2 + CSS_CA)
    k = t.rindex("</div>\n</x-dc>")
    return t[:k] + capas + t[k:]


# ================================================================ Teléfono
CSS_TAS = """.ap-m.sal.asis .gl { background: oklch(0.96 0.03 185); border: 1px solid oklch(0.85 0.05 185); }
.ap-m .aut { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--marca-tx); margin-bottom: 4px; }
.ap-m .as-card { display: flex; gap: 8px; margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: #fff; border: 1px solid var(--borde); font-size: 13.5px; }
.ap-m .as-card small { display: block; font-size: 12.5px; color: var(--t3); }
.t-por { align-self: flex-end; max-width: 82%; padding: 9px 12px; border: 1px dashed var(--borde2); border-radius: 12px; background: #fff; font-size: 13.5px; line-height: 1.4; color: var(--t2); }
.t-por b { color: var(--t1); display: block; margin-bottom: 2px; }
.t-fr { display: flex; align-items: center; gap: 10px; padding: 10px 12px 30px; background: #fff; border-top: 1px solid var(--borde); flex-shrink: 0; }
.t-fr span { flex: 1; font-size: 14px; color: var(--t2); display: inline-flex; gap: 6px; align-items: center; }
.t-fr .cb { height: 40px; font-size: 14px; }
.t-sug { align-self: stretch; display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid oklch(0.51 0.099 195 / 0.4); border-radius: 12px; background: oklch(0.975 0.015 185); font-size: 14.5px; }
.t-sug b { font-size: 15px; } .t-sug span { color: var(--t2); }
.t-sug .acc { display: flex; gap: 8px; } .t-sug .cb { flex: 1; height: 40px; font-size: 14px; }
.ap-m .au { min-width: 260px; }
.ap-modo { display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 7px; margin-left: 6px; border-radius: 6px; background: var(--marca-t); color: var(--marca-tx); font-size: 12px; font-weight: 600; vertical-align: middle; }
"""
ESTADOS_TAS = ["Modo Asistente", "Pasar a modo Asistente", "Sugerencia", "Revisar y enviar", "Audio transcripto"]


def tel_chat_asistente():
    E = ESTADOS_TAS
    def burb(texto, card="", pie="Asistente · 11:21 · Leído"):
        return (f'<div class="ap-m sal asis"><span class="gl"><span class="aut">{BOT} Asistente</span><span>{texto}</span>{card}</span><span class="pie">{pie}</span></div>')
    card = (f'<span class="as-card"><span>{F.ICONO}</span><span><b>Visita a cliente</b><small>Prellenado: Cliente, ¿Se concretó la venta? y Monto estimado</small></span></span>')
    ent_ = '<div class="ap-m ent"><span class="gl">Recién salgo de Ferretería Rosales, cerramos la venta. Son unos 125.500.</span><span class="pie">11:20</span></div>'
    paso = '<span class="ap-sis">Lucía Fernández pasó la conversación al asistente</span>'
    por = '<div class="t-por"><b>Por qué lo mandó</b>Reconoció una visita a un cliente. Propuso Cliente, ¿Se concretó la venta? y Monto estimado, del mensaje de Tomás.</div>'
    sug = ('<div class="t-sug" role="status"><b>El asistente sugiere mandarle Visita a cliente</b><span>Prellenado con Cliente, ¿Se concretó la venta? y Monto estimado.</span>'
           '<span class="acc"><button type="button" class="cb cb-sec">No, gracias</button><button type="button" class="cb cb-pri">Revisar y enviar</button></span></div>')
    au = audio().replace('class="w-m ent"', 'class="ap-m ent"')
    msgs = {"Modo Asistente": paso + ent_ + burb("Te preparé el formulario de la visita con lo que me contaste. Revisalo y confirmalo.", card) + por,
            "Pasar a modo Asistente": ent_, "Sugerencia": ent_ + sug, "Revisar y enviar": ent_ + sug,
            "Audio transcripto": paso + au + burb("Te preparé el formulario de la visita con lo que me contaste.", card)}
    fr = f'<div class="t-fr"><span>{BOT} El asistente atiende esta conversación.</span><button type="button" class="cb cb-pri">Tomar atención manual</button></div>'
    esc = {e: (fr if e in ("Modo Asistente", "Audio transcripto") else A.t_escr()) for e in E}
    hoja_pasar = F.thoja("Pasar a modo Asistente", '<p class="ap-txt-l">El asistente va a atender la conversación con Tomás Acosta: reconoce pedidos y le manda formularios prellenados. '
                         'Nunca guarda una respuesta solo.</p><p class="ap-txt-l">Podés tomar la atención manual cuando quieras.</p>',
                         '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Pasar a Asistente</button>')
    pre = "".join(f'<span class="t-opc on">{k}: {v}<span class="d">{svg("<path d=" + chr(34) + "m5 12.5 4.5 4.5L19 7.5" + chr(34) + "/>", 18, "2.25")}</span></span>'
                  for k, v in [("Cliente", "Ferretería Rosales"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "125.500,00")])
    hoja_rev = F.thoja("Enviar un formulario a Tomás", F.tcampo("Formulario", "Visita a cliente", select=True) + '<div class="p-tit2">Datos que van prellenados</div>' + pre
                       + F.tcampo("Mensaje que lo acompaña", A.MENSAJE_AB, req=True), '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Enviar formulario</button>')
    capas = {"Pasar a modo Asistente": hoja_pasar, "Revisar y enviar": hoja_rev}
    css = A.CSS_AB + A.CSS_TRESP_AB + A.CSS_ARCH + F.CSS_TFILTRO + CSS_AS.replace(".w-m", ".ap-m") + CSS_TAS
    t = A.pagina_tchat(E, esc, msgs, capas, "WhatsApp · Internos · el asistente · teléfono", css)
    viejo = '<b>Tomás Acosta</b><span>Empleado · Delta S.A.</span>'
    assert t.count(viejo) == 1
    t = t.replace(viejo, '<b>Tomás Acosta<sc-if value="{{modoAs}}" hint-placeholder-val="{{si}}"><span class="ap-modo">Asistente</span></sc-if></b><span>Empleado · Delta S.A.</span>')
    assert t.count("      si: true, no: false,\n") == 1
    return t.replace("      si: true, no: false,\n", "      si: true, no: false, modoAs: ['Modo Asistente', 'Audio transcripto'].includes(e),\n", 1)


ESTADOS_TFT = ["Pendientes", "Acciones de un tema", "Descartados", "Vacío"]


def tel_faltan():
    E = ESTADOS_TFT
    def fila(t, descartado=False):
        n, d, ped, per, ult = t
        l3 = ult if descartado else f"{ped} {'pedido' if ped == 1 else 'pedidos'} · {per} {'persona' if per == 1 else 'personas'} · {ult}"
        return (f'<div class="ap-fila"><div class="tx"><span class="l1">{n}</span><span class="l2">{d}</span><span class="l3">{l3}</span></div>'
                f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>')
    der = f'<button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'
    def lista(cuerpo, sub="3 temas · 9 pedidos"):
        return C.t_bar("Formularios que faltan", sub, "M-WA-Menu.dc.html", der) + f'<div class="ap-cuerpo">{cuerpo}</div>'
    pend = "".join(fila(t) for t in TEMAS)
    cuerpo = {"Pendientes": lista(pend), "Acciones de un tema": lista(pend), "Descartados": lista("".join(fila(t, True) for t in DESCARTADOS), "Descartados · 2 temas"),
              "Vacío": lista('<div class="ap-vacio">Nadie pidió formularios que no existen.</div>', "Sin pedidos")}
    hoja = F.thoja("Reclamos de clientes", f'<div class="ap-acciones2"><span role="menuitem">{MAS} Crear formulario</span><span role="menuitem" class="pel">{QUITAR} Descartar</span></div>', "")
    return C.tel_pagina(cuerpo, E, {"Acciones de un tema": hoja}, "Formularios que faltan · teléfono", P.CSS_TPL)


# ================================================================ Los demás: «Formularios que faltan» en el panel y en Más › Formularios
def poner_faltan(t, activo=False):
    if 'href="FRM-Faltan.dc.html"' in t:
        return t
    m = re.search(r'<a class="w-ln ?(?:on)?" href="FRM-Catalogos\.dc\.html">.*?</a>', t, re.S)
    assert m, "sin Catálogos en el panel"
    link = f'<a class="w-ln{" on" if activo else ""}" href="FRM-Faltan.dc.html">{FALTAN} Formularios que faltan <span class="cnt">3</span></a>'
    t = t[:m.end()] + link + t[m.end():]
    if ".w-panel .w-ln .cnt" not in t:
        t = t.replace("</helmet>", '<style data-asistente="panel">\n.w-panel .w-ln .cnt { margin-left: auto; font-size: 12px; font-weight: 600; min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); display: inline-flex; align-items: center; justify-content: center; }\n</style>\n</helmet>', 1)
    return t


def panel_en_los_demas(c):
    hechos = []
    for f in sorted(PROJ.glob("*.dc.html")):
        nombre = f.name[:-8]
        if re.search(r"-v1\d\d$", nombre) or c["boards"].get(f.name, {}).get("page") == "archivo":
            continue
        t = f.read_text(encoding="utf-8")
        if '<aside class="w-panel" aria-label="Formularios">' not in t or 'href="FRM-Faltan.dc.html"' in t:
            continue
        f.write_text(poner_faltan(t), encoding="utf-8")
        hechos.append(nombre)
    return hechos


def menu_telefono():
    f = PROJ / "M-WA-Menu.dc.html"
    t = f.read_text(encoding="utf-8")
    if 'href="M-FRM-Faltan.dc.html"' in t:
        return False
    m = re.search(r'<a class="ap-it " href="M-FRM-Catalogos\.dc\.html"><span class="tx"><b>Catálogos</b></span><span class="chev">(<svg.*?</svg>)</span></a>', t, re.S)
    assert m, "Más › Formularios sin Catálogos"
    nuevo = m.group(0) + f'<a class="ap-it " href="M-FRM-Faltan.dc.html"><span class="tx"><b>Formularios que faltan</b></span><span class="chev">{m.group(1)}</span></a>'
    f.write_text(t.replace(m.group(0), nuevo, 1), encoding="utf-8")
    return True


# ================================================================ canvas.json
TITULOS = {"WA-Chats-Asistente": "WhatsApp · Internos · el asistente atiende", "WA-Chats-Sugerencia": "WhatsApp · Internos · el asistente sugiere",
           "WA-Chats-Audio": "WhatsApp · Internos · audios", "FRM-Catalogo-Propuesta": "Formularios · catálogo propuesto por el asistente",
           "FRM-Faltan": "Formularios · formularios que faltan", "FRM-Editor-Asistente": "Formularios · editor · cuándo lo ofrece el asistente",
           "FRM-Editor-Sugerencias": "Formularios · editor · qué sugerir después", "FRM-Respuesta-Cadena": "Formularios · una respuesta · de dónde vino",
           "M-WA-Conversacion-Asistente": "WhatsApp · el asistente · teléfono", "M-FRM-Faltan": "Formularios · formularios que faltan · teléfono"}
LUGAR = {"WA-Chats-Asistente": (0, 12800, 1440, 900), "WA-Chats-Sugerencia": (1520, 12800, 1440, 900), "WA-Chats-Audio": (3040, 12800, 1440, 900),
         "FRM-Catalogo-Propuesta": (4560, 12800, 1440, 1000), "FRM-Faltan": (0, 13880, 1440, 900), "FRM-Editor-Asistente": (1520, 13880, 1440, 1400),
         "FRM-Editor-Sugerencias": (3040, 13880, 1440, 1400), "FRM-Respuesta-Cadena": (4560, 13880, 1440, 900),
         "M-WA-Conversacion-Asistente": (0, 14880, 390, 844), "M-FRM-Faltan": (470, 14880, 390, 844)}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    marca = "" if ASISTENTE_APROBADO else A.PARA_APROBAR
    for n, (x, y, w, h) in LUGAR.items():
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n] + marca, "page": "formularios", "is_interactive": True}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    return c


if __name__ == "__main__":
    tableros = {"WA-Chats-Asistente": chat_asistente(), "WA-Chats-Sugerencia": chat_sugerencia(), "WA-Chats-Audio": chat_audio(),
                "FRM-Catalogo-Propuesta": catalogo_propuesta(), "FRM-Faltan": faltan(), "FRM-Editor-Asistente": editor_asistente(),
                "FRM-Editor-Sugerencias": editor_sugerencias(), "FRM-Respuesta-Cadena": respuesta_cadena(),
                "M-WA-Conversacion-Asistente": tel_chat_asistente(), "M-FRM-Faltan": tel_faltan()}
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    c = registrar()
    print("tableros", list(tableros))
    print("respuestas en el panel", P.panel_en_los_demas(c))
    print("por aprobar en el panel", R.panel_en_los_demas(c))
    print("faltan en el panel", panel_en_los_demas(c))
    print("menú del teléfono", menu_telefono())
