"""La etapa 24, varios asistentes, uno por equipo (24-varios-asistentes.md y 24-texto-diseno.md del back).

En ArquitecturaBase no existe (lo dejó para una tercera etapa del asistente). Todo tiene modelo acá: la lista sigue a las listas de
WhatsApp, el asistente de un equipo va en el diálogo «Editar equipo» de la 11 y el chat es el de los casos de la 23, con el nombre
del asistente que contesta y el menú de equipos al empezar (68 y 77). La pantalla de cada asistente es la de la 23.

Corre después de `formularios_23_asistente_1004.py` y antes de los bloques; la fila de la etapa la pone `formularios_etapas_1004.py`.
Se puede volver a correr.
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
import formularios_23_asistente_1004 as AS  # noqa: E402
import formularios_23_chats_1004 as CH  # noqa: E402

PROJ = F.PROJ
svg, info = F.svg, F.info
CHEV, MAS, KEBAB, QUITAR, LAPIZ = F.CHEV, A.MAS, A.KEBAB, A.QUITAR, A.LAPIZ
BOT, HOY, AYER = AS.BOT, AS.HOY, AS.AYER
REACTIVAR = svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>', 15)
PRINCIPAL, SOPORTE, VENTAS, OBRAS = "Delta", "Delta Soporte", "Delta Ventas", "Delta Obras"
AY_PRINCIPAL = "Contesta los chats sin equipo y los de un equipo sin asistente. No se da de baja."
AY_ASIS_EQUIPO = "Sin elegir, contesta el principal. Un equipo tiene como mucho uno."

# nombre, equipos, activo, principal
ASISTENTES = [(PRINCIPAL, [], True, True), (SOPORTE, ["Soporte"], True, False), (VENTAS, ["Ventas"], True, False), (OBRAS, [], False, False)]

CSS_24 = """.w-th.as24, .w-tr.as24 { grid-template-columns: minmax(220px, 1.2fr) minmax(200px, 1fr) 130px 48px; }
.w-tr.as24 { position: relative; min-height: 44px; overflow: visible; }
.w-tr.as24 a { color: var(--t1); font-weight: 500; text-decoration: none; }
.w-tr.as24 .nm { display: inline-flex; align-items: center; gap: 8px; }
.w-tr.as24 .gris { color: var(--t3); }
.w-tr.as24 .f-menu { top: 40px; right: 8px; width: 230px; }
.w-caja.as24c { overflow: visible; }
.w-tr.as24 .f-mi[aria-disabled="true"] { color: var(--t3); cursor: default; }
.w-tr.as24 .e-tipw .e-tip { right: 0; left: auto; top: calc(100% + 6px); width: 230px; white-space: normal; z-index: 40; }
"""


def chip(t, clase=""):
    return f'<span class="ab-chip{" " + clase if clase else ""}">{t}</span>'


# ================================================================ WA-Asistentes: la lista, con el equipo de cada uno
def fila(a, menu=False, tip=False):
    n, eqs, activo, principal = a
    nm = f'<span class="nm"><a href="WA-Asistente.dc.html">{n}</a>{chip("Principal") if principal else ""}{info(AY_PRINCIPAL) if principal else ""}</span>'
    eq = ", ".join(eqs) if eqs else '<span class="gris">—</span>'
    est = '<span class="w-est">Activo</span>' if activo else '<span class="w-est off">De baja</span>'
    m = ""
    if menu:
        if principal:
            baja = (f'<span class="e-tipw"><span class="f-mi pel" role="menuitem" aria-disabled="true">{QUITAR} Dar de baja</span>'
                    f'<span class="e-tip" role="tooltip"{"" if tip else " hidden"}>El principal no se da de baja.</span></span>')
        elif activo:
            baja = f'<span class="f-mi pel" role="menuitem">{QUITAR} Dar de baja</span>'
        else:
            baja = f'<span class="f-mi" role="menuitem">{REACTIVAR} Reactivar</span>'
        m = (f'<div class="f-menu" role="menu" aria-label="Acciones de {n}"><a class="f-mi" role="menuitem" href="WA-Asistente.dc.html">{LAPIZ} Editar</a>'
             f'<span class="f-sep" role="separator"></span>{baja}</div>')
    return (f'<div class="w-tr as24"><span>{nm}</span><span>{eq}</span><span>{est}</span>'
            f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>{m}</div>')


def tabla(filas, n):
    cab = '<div class="w-th as24"><span>Asistente</span><span>Equipos</span><span>Estado</span><span class="sr">Acciones</span></div>'
    return f'<div class="w-caja as24c">{cab}{filas}<div class="w-pie"><span>1–{n} de {n}</span><span>10 por página · Página 1 de 1</span></div></div>'


E_AL = ["Varios", "Menú de un asistente", "Menú del principal", "Nuevo asistente", "Falta el nombre", "Creando", "Dar de baja", "Un asistente de baja",
        "Un solo asistente", "Sin equipos", "Cargando", "Error"]


def asistentes():
    lista = ASISTENTES[:3]
    base = tabla("".join(fila(a) for a in lista), 3)
    cu = {"Varios": base, "Menú de un asistente": tabla("".join(fila(a, menu=(a[0] == SOPORTE)) for a in lista), 3),
          "Menú del principal": tabla("".join(fila(a, menu=(a[0] == PRINCIPAL), tip=True) for a in lista), 3),
          "Nuevo asistente": base, "Falta el nombre": base, "Creando": base, "Dar de baja": base,
          "Un asistente de baja": tabla("".join(fila(a, menu=(a[0] == OBRAS)) for a in ASISTENTES), 4),
          "Un solo asistente": tabla(fila(ASISTENTES[0]), 1),
          "Sin equipos": tabla("".join(fila((n, [], act, pr)) for n, _e, act, pr in lista), 3),
          "Cargando": ('<div class="w-caja"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span>'
                       '<span style="width: 72%;"></span></div></div></div>'),
          "Error": '<div class="w-caja"><div class="pl-vacio2"><b>No pudimos cargar los asistentes.</b><button type="button" class="cb cb-sec">Reintentar</button></div></div>'}
    sub = {"Un asistente de baja": "4 asistentes · 1 de baja", "Un solo asistente": "1 asistente", "Cargando": "", "Error": ""}
    nuevo = f'<button type="button" class="cb cb-pri">{MAS} Nuevo asistente</button>'
    V_ = {e: (F.banda("Asistentes", sub.get(e, "3 asistentes"), nuevo).replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{BOT}</span>', 1),
              f'<div class="w-body">{cu[e]}</div>') for e in E_AL}

    def dlg(modo):
        mal, creando = modo == "falta", modo == "creando"
        cuerpo = (AS.campo("Nombre", "Escribí un nombre" if mal else "Delta Obras", ph=mal, mal="Escribí un nombre." if mal else "")
                  + '<p class="d-tx">Arranca con el perfil y los casos del principal, para cambiarlos.</p>')
        pie = (f'<button type="button" class="cb cb-sec"{" disabled" if creando else ""}>Cancelar</button>'
               + (E.trabaja("Creando…") if creando else '<a class="cb cb-pri" href="WA-Asistente.dc.html">Crear asistente</a>'))
        return F.dialogo("Nuevo asistente", cuerpo, pie)
    capas = {"Nuevo asistente": dlg("datos"), "Falta el nombre": dlg("falta"), "Creando": dlg("creando"),
             "Dar de baja": A.confirmar(f"¿Dar de baja «{SOPORTE}»?", "Deja de contestar, y Soporte pasa al principal. Si lo reactivás, vuelve a su equipo.", "Dar de baja")}
    t = AS.pagina_wa(V_, capas, E_AL, "Asistentes · /org/whatsapp/asistentes", "Inicio / WhatsApp / Asistentes", alto=900, css=CSS_24)
    return con_asistentes(t)


def con_asistentes(t):
    """En la 24, el panel de WhatsApp dice «Asistentes» y abre la lista."""
    return t.replace(f'href="WA-Asistente.dc.html">{BOT} Asistente</a>', f'href="WA-Asistentes.dc.html">{BOT} Asistentes</a>')


# ================================================================ WA-Equipo-Asistente: «Asistente de este equipo», en «Editar equipo»
CSS_EQ = """.eq-sel { position: relative; }
.eq-mn { position: absolute; z-index: 30; top: calc(100% + 4px); left: 0; right: 0; display: flex; flex-direction: column; padding: 6px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 10px 24px oklch(0.24 0.014 78 / 0.14); }
.eq-mn span { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 6px; font-size: 13.5px; }
.eq-mn span.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.eq-mn span[aria-disabled="true"] { color: var(--t3); }
.eq-mn small { font-size: 12px; color: var(--t3); }
.w-dlg .w-cmp .dato2 { font-size: 12.5px; color: var(--t3); }
.w-dlg .ct.ph { color: var(--t3); }
"""
E_EQ = ["Con su asistente", "Elegir el asistente", "Sin elegir: contesta el principal", "Un asistente de baja", "Un solo asistente"]


def campo_asistente(modo):
    rt = f'<span class="rt">Asistente de este equipo{info(AY_ASIS_EQUIPO)}</span>'
    if modo == "elegir":
        ops = (f'<span role="option">{PRINCIPAL}<small>Principal</small></span><span role="option">{SOPORTE}<small>Soporte</small></span>'
               f'<span role="option" class="on">{VENTAS}<small>Ventas</small></span><span role="option" aria-disabled="true">{OBRAS}<small>De baja</small></span>')
        return f'<div class="w-cmp eq-sel" style="grid-column: 1 / -1;">{rt}<div class="ct">{VENTAS} {CHEV}</div><span class="eq-mn" role="listbox" aria-label="Asistente de este equipo">{ops}</span></div>'
    valor, extra, clase = {"con": (VENTAS, "", ""), "sin": ("Elegí un asistente", "", " ph"),
                           "baja": (f'{OBRAS} <span class="ab-chip">De baja</span>', '<span class="dato2">Mientras esté de baja, contesta el principal.</span>', ""),
                           "uno": (f"{PRINCIPAL} · principal", "", " ro")}[modo]
    return f'<div class="w-cmp" style="grid-column: 1 / -1;">{rt}<div class="ct{clase}">{valor} {CHEV if modo != "uno" else ""}</div>{extra}</div>'


def equipo_asistente():
    t = (PROJ / "WA-Equipos.dc.html").read_text(encoding="utf-8")
    m = re.search(r'<sc-if value="\{\{e2\}\}" hint-placeholder-val="\{\{no\}\}">(<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Editar equipo">.*?</div></div></div>)</sc-if>', t, re.S)
    assert m, "el diálogo «Editar equipo»"
    dlg = m.group(1)
    ancla = '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Aviso por correo si nadie lo toma</span>'
    assert ancla in dlg
    modos = {"Con su asistente": "con", "Elegir el asistente": "elegir", "Sin elegir: contesta el principal": "sin", "Un asistente de baja": "baja", "Un solo asistente": "uno"}
    capas = "".join(f'<sc-if value="{{{{q{k}}}}}" hint-placeholder-val="{{{{{"si" if k == 0 else "no"}}}}}">'
                    + dlg.replace(ancla, campo_asistente(modos[e]) + ancla, 1) + "</sc-if>" for k, e in enumerate(E_EQ))
    # Sin los diálogos de la 11: la lista de fondo y el nuestro encima
    t = re.sub(r'<sc-if value="\{\{e[1-6]\}\}" hint-placeholder-val="\{\{no\}\}"><div class="w-oscuro">.*?</sc-if>', "", t, flags=re.S)
    k = t.rindex("</div>\n</x-dc>")
    t = t[:k] + capas + t[k:]
    props = {"estado": {"editor": "enum", "options": E_EQ, "default": E_EQ[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = re.sub(r"data-props='[^']*'", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    js = ("    const e = this.props.estado ?? " + json.dumps(E_EQ[0], ensure_ascii=False) + ";\n    return {\n      si: true, no: false, e0: true, e1: false, e2: false, e3: false, e4: false, e5: false, e6: false,\n"
          + "".join(f"      q{k}: e === {json.dumps(x, ensure_ascii=False)},\n" for k, x in enumerate(E_EQ)) + "    };")
    t = re.sub(r"    const e = this\.props\.estado \?\? \"Lista\";\n\n    return \{.*?\n    \};", lambda _m: js, t, count=1, flags=re.S)
    assert "q0:" in t, "el JS de los estados"
    t = re.sub(r"<title>[^<]*</title>", "<title>WhatsApp · el asistente de un equipo · etapa 24</title>", t)
    return t.replace("</helmet>", f'<style data-e24="equipo">\n{CSS_EQ}</style>\n</helmet>', 1)


def tel_equipo_asistente():
    est = ["Con su asistente", "Elegir el asistente"]
    eqs = [("Ventas", "Aviso a los 10 min", "Lucía Fernández, Carolina Vega", f"Bandeja Clientes · 2 personas · {VENTAS}"),
           ("Soporte", "Aviso a los 15 min", "Tomás Acosta, Paula Méndez", f"Bandeja Clientes · 2 personas · {SOPORTE}"),
           ("Atención general", "Aviso a los 10 min", "Lucía Fernández, Tomás Acosta, Martín Paz", "Bandeja Clientes · 3 personas"),
           ("Carga de pedidos", "Aviso a los 30 min", "Martín Paz", "Bandeja Internos · 1 persona")]
    filas = "".join(f'<div class="ap-fila"><div class="tx"><span class="l1">{n}<span>{av}</span></span><span class="l2">{p}</span><span class="l3">{l3}</span></div>'
                    f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>' for n, av, p, l3 in eqs)
    lista = C.t_bar("Equipos", "Administración · WhatsApp", "M-WA-Menu.dc.html") + f'<div class="ap-cuerpo">{filas}</div>'
    cuerpo = (F.tcampo("Nombre", "Ventas", req=True) + F.tcampo("Personas", "Lucía Fernández, Carolina Vega", select=True)
              + F.tcampo("Asistente de este equipo", VENTAS, select=True) + F.tcampo("Aviso por correo si nadie lo toma", "A los 10 minutos", select=True))
    pie = '<button type="button" class="cb cb-pri lleno">Guardar cambios</button><button type="button" class="cb cb-sec">Cancelar</button>'
    hoja = F.thoja("Editar equipo", cuerpo, pie)
    elegir = F.thoja("Asistente de este equipo", '<div class="ap-acciones2">' + "".join(
        f'<span role="option"{" style=" + chr(34) + "color: var(--marca-tx); font-weight: 600;" + chr(34) if n == VENTAS else ""}{" aria-disabled=" + chr(34) + "true" + chr(34) + " style=" + chr(34) + "color: var(--t3);" + chr(34) if n == OBRAS else ""}>{n}{" · principal" if n == PRINCIPAL else " · de baja" if n == OBRAS else ""}</span>'
        for n in (PRINCIPAL, SOPORTE, VENTAS, OBRAS)) + "</div>", "")
    return C.tel_pagina({e: lista for e in est}, est, {"Con su asistente": hoja, "Elegir el asistente": elegir}, "Editar equipo · el asistente · teléfono · etapa 24", F.CSS_TFICHA)


def tel_asistentes():
    est = ["Varios", "Acciones de un asistente"]
    filas = "".join(f'<div class="ap-fila"><div class="tx"><span class="l1">{n}{" · principal" if pr else ""}</span><span class="l2">{", ".join(eq) if eq else "Sin equipo"}</span>'
                    f'<span class="l3">{"Activo" if act else "De baja"}</span></div><button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>'
                    for n, eq, act, pr in ASISTENTES[:3])
    fab = f'<a class="ap-fab" aria-label="Nuevo asistente" href="#">{F.TFAB}</a>'
    lista = C.t_bar("Asistentes", "3 asistentes", "M-WA-Menu.dc.html") + f'<div class="ap-cuerpo">{filas}</div>' + fab
    hoja = F.thoja(SOPORTE, f'<div class="ap-acciones2"><span role="menuitem">{LAPIZ} Editar</span><span role="menuitem" class="pel">{QUITAR} Dar de baja</span></div>', "")
    return C.tel_pagina({e: lista for e in est}, est, {"Acciones de un asistente": hoja}, "Asistentes · teléfono · etapa 24", F.CSS_TFICHA)


# ================================================================ WA-Chats-Casos-24: quién contesta, y el menú de equipos al empezar
BOT_MSJ = "Hola, gracias por escribir a Grupo Delta. ¿En qué te ayudamos?"
OPCIONES = ["Hacer un pedido", "Consultar un pedido", "Otra consulta"]
E_C24 = ["Un chat nuevo: el menú", "Eligió Soporte", "Por qué respondió esto", "Pasó a Ventas", "Un equipo sin asistente: el principal", "Un solo asistente: sin menú"]


def asis(nombre, texto, hora, card="", quick=None, clase="w-m", pop=""):
    return CH.asis(texto, hora, card, quick, clase=clase, pop=pop).replace(f"{BOT} Asistente</span>", f"{BOT} {nombre}</span>", 1).replace(
        f"Asistente · {hora}", f"{nombre} · {hora}", 1)


def bot(hora, clase="w-m"):
    q = '<span class="as-quick">' + "".join(f"<span>{o}</span>" for o in OPCIONES) + "</span>"
    return f'<div class="{clase} sal"><span class="gl">{BOT_MSJ}{q}</span><span class="pie">Respuesta automática · {hora}</span></div>'


def por_que(nombre, equipo):
    """El globo de «Por qué respondió esto», que suma qué asistente contestó y de qué equipo."""
    t = CH.por_que("Caso 3 · Pregunta por un pedido que ya hizo", "El texto exacto del caso", "Pregunta dónde está su pedido.")
    return t.replace('<span class="g">', f'<span class="g"><span class="k">Asistente</span><span>{nombre} · del equipo {equipo}</span>', 1)


def msgs24(e_=CH.ent, s_=V.sis, clase="w-m"):
    menu = e_("Hola", "10:20") + bot("10:20", clase)
    soporte = (menu + e_("Consultar un pedido", "10:21") + s_("Eligió «Consultar un pedido» · pasó a Soporte") + e_("¿Dónde está mi pedido?", "10:21")
               + asis(SOPORTE, AS.TEXTO_PEDIDO, "10:21", clase=clase))
    ventas = (soporte + e_("Es el 4521. Y quiero comprar otra heladera.", "10:24") + asis(SOPORTE, "Gracias, Martina. Lo busco y te escribo.", "10:24", clase=clase)
              + s_("Lucía Fernández pasó la conversación a Ventas") + e_("¿Tienen de dos puertas?", "10:26")
              + asis(VENTAS, AS.PREG_BOTONES, "10:26", quick=AS.BOTONES, clase=clase))
    general = (menu + e_("Otra consulta", "10:21") + s_("Eligió «Otra consulta» · pasó a Atención general") + e_("¿Atienden los sábados?", "10:22")
               + asis(PRINCIPAL, "Sí, los sábados de 9 a 13. De lunes a viernes, de 9 a 18.", "10:22", clase=clase))
    uno = e_("Hola", "10:20") + asis(PRINCIPAL, AS.PRESENTACION, "10:20", clase=clase)
    pq = (menu + e_("Consultar un pedido", "10:21") + s_("Eligió «Consultar un pedido» · pasó a Soporte") + e_("¿Dónde está mi pedido?", "10:21")
          + asis(SOPORTE, AS.TEXTO_PEDIDO, "10:21", clase=clase, pop=por_que(SOPORTE, "Soporte") if clase == "w-m" else "")
          + e_("Es el 4521.", "10:22") + asis(SOPORTE, "Gracias, Martina. Lo busco y te escribo.", "10:22", clase=clase))
    return {"Un chat nuevo: el menú": menu, "Eligió Soporte": soporte, "Por qué respondió esto": pq, "Pasó a Ventas": ventas,
            "Un equipo sin asistente: el principal": general, "Un solo asistente: sin menú": uno}


QUIEN = {"Un chat nuevo: el menú": "Menú del bot", "Eligió Soporte": SOPORTE, "Por qué respondió esto": SOPORTE, "Pasó a Ventas": VENTAS,
         "Un equipo sin asistente: el principal": f"{PRINCIPAL} · principal", "Un solo asistente: sin menú": PRINCIPAL}
EQUIPO = {"Un chat nuevo: el menú": "Sin equipo", "Eligió Soporte": "Soporte", "Por qué respondió esto": "Soporte", "Pasó a Ventas": "Ventas",
          "Un equipo sin asistente: el principal": "Atención general", "Un solo asistente: sin menú": "Sin equipo"}


def chat24():
    msgs = msgs24()
    esc = {e: V.esc_asistente() for e in E_C24}
    t = CH.chat_martina('<div class="w-escr">' + A.con_estados([(e, esc[e]) for e in E_C24]) + "</div>", "", A.con_estados([(e, msgs[e]) for e in E_C24]),
                        F.CSS_ESTADOS + F.CSS_ENVIO + F.CSS_OFERTA + A.CSS_AB + A.CSS_CHAT_AB + A.CSS_RESP_AB + V.CSS_AS + R.CSS_AV)
    t = t.replace(f'<span class="as-modo on">{BOT} Asistente</span>', f'<span class="as-modo on">{BOT} {{{{quien}}}}</span>', 1)
    t = t.replace("<span class=\"l3\">Ventas · {{atiende}}", "<span class=\"l3\">{{equipo}} · {{quien}}", 1)
    assert "{{quien}}" in t and "{{equipo}}" in t
    props = {"estado": {"editor": "enum", "options": E_C24, "default": E_C24[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = t.replace("""data-props='{"$preview":{"width":1440,"height":900}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    vp = {e: "Respuesta automática: Hola, gracias por escribir…" for e in E_C24}
    vp.update({"Eligió Soporte": f"{SOPORTE}: {AS.TEXTO_PEDIDO}", "Por qué respondió esto": f"{SOPORTE}: Gracias, Martina. Lo busco y te escribo.", "Pasó a Ventas": f"{VENTAS}: {AS.PREG_BOTONES}",
               "Un equipo sin asistente: el principal": f"{PRINCIPAL}: Sí, los sábados de 9 a 13…", "Un solo asistente: sin menú": f"{PRINCIPAL}: ¡Hola! Soy Delta…"})
    hora = {"Un chat nuevo: el menú": "10:20", "Eligió Soporte": "10:21", "Por qué respondió esto": "10:22", "Pasó a Ventas": "10:26",
            "Un equipo sin asistente: el principal": "10:22", "Un solo asistente: sin menú": "10:20"}
    extra = ("      modoAs: true, modoMan: false, fijado: false, necesita: false, todos: true, filtro: 'Todos', filtroClase: '', envuelve: '', atiende: '',\n"
             f"      quien: {json.dumps(QUIEN, ensure_ascii=False)}[e] ?? '', equipo: {json.dumps(EQUIPO, ensure_ascii=False)}[e] ?? '',\n"
             f"      vistaPrevia: {json.dumps(vp, ensure_ascii=False)}[e] ?? '', hora: '{HOY} ' + ({json.dumps(hora, ensure_ascii=False)}[e] ?? '10:20'),\n")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(E_C24[0], ensure_ascii=False)};\n" + A.js_estados(E_C24, extra))
    t = re.sub(r"<title>[^<]*</title>", "<title>WhatsApp · Clientes · quién contesta · etapa 24</title>", t)
    return CH.a_wa(t)


def tel_chat24():
    est = ["Un chat nuevo: el menú", "Eligió Soporte", "Pasó a Ventas"]
    m = msgs24(CH.t_ent, CH.t_sis, "ap-m")
    esc = {e: CH.T_FR for e in est}
    marca = f'<span class="as-np" style="background: var(--marca-t); color: var(--marca-tx);">{BOT} {{{{quien}}}}</span>'
    t = CH.tel_chat_martina(est, esc, m, {}, "WhatsApp · quién contesta · teléfono · etapa 24", A.CSS_AB + A.CSS_TRESP_AB + CH.CSS_TCH, marca)
    return t.replace("      si: true, no: false,\n", f"      si: true, no: false, quien: {json.dumps(QUIEN, ensure_ascii=False)}[e] ?? '',\n", 1)


# ================================================================ Escribir y registrar
TITULOS = {"WA-Asistentes": ("WhatsApp · los asistentes · etapa 24", 1440, 900), "M-WA-Asistentes": ("Los asistentes · teléfono · etapa 24", 390, 844),
           "WA-Equipo-Asistente": ("WhatsApp · el asistente de un equipo · etapa 24", 1440, 900), "M-WA-Equipo-Asistente": ("El asistente de un equipo · teléfono · etapa 24", 390, 844),
           "WA-Chats-Casos-24": ("WhatsApp · Clientes · quién contesta · etapa 24", 1440, 900), "M-WA-Chats-Casos-24": ("Quién contesta · teléfono · etapa 24", 390, 844)}

if __name__ == "__main__":
    (PROJ / "WA-Asistentes.dc.html").write_text(asistentes(), encoding="utf-8")
    (PROJ / "WA-Equipo-Asistente.dc.html").write_text(equipo_asistente(), encoding="utf-8")
    (PROJ / "WA-Chats-Casos-24.dc.html").write_text(con_asistentes(AS.en_whatsapp(E.post("WA-Chats-Casos-24", chat24()), "chats", "Inicio / WhatsApp / Chats")), encoding="utf-8")
    for n, f in [("M-WA-Asistentes", tel_asistentes), ("M-WA-Equipo-Asistente", tel_equipo_asistente), ("M-WA-Chats-Casos-24", tel_chat24)]:
        (PROJ / f"{n}.dc.html").write_text(E.post(n, f()), encoding="utf-8")
    AS.registrar(TITULOS)
    print("tableros", len(TITULOS))
