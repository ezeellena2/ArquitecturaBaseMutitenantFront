"""Bloque 0 · WhatsApp (el plan de diseño del 27/10): los tableros cerrados de WhatsApp, de la organización y de Plataforma, pasan a
las reglas del 25 y 26/10, copiando la maqueta (3b9c967, 8ba7f7f, bde7167, 3680ace, 62f34e2, d63ccce y 8b2ebca, por la Guía).

- Un dato por celda, en un renglón:
  - Números: Número, Nombre verificado, Atiende a, Estado, Este mes; «también en la app» queda en el teléfono;
  - Contactos: Contacto, Número, Etiquetas, Promociones, Última conversación; el vínculo y de dónde salió el consentimiento pasan
    a la ficha;
  - la ficha de un contacto: Conversación, Último mensaje, Equipo, La atendió, Mensajes; en la banda, «Acepta promociones» suma un
    ⓘ con de dónde salió el consentimiento, porque la maqueta lo manda a la ficha y no lo muestra en ninguna pantalla;
  - Difusiones: Difusión, Plantilla, Destinatarios, Contactos, Estado, Resultados, Fecha;
  - los resultados de una difusión: Contacto, Número, Estado, Último cambio; sin nombre, una raya;
  - Equipos: Equipo, Bandeja, Personas, Cantidad, Aviso por correo; en Plataforma, sin Bandeja;
  - Plantillas: Plantilla, Idiomas, Tipo, Estado en Meta, Última modificación; el nombre técnico y el tipo en otro idioma salen.
- Las listas cortas en un renglón: el bot y el número de Plataforma, con lo que aclara cada fila a la derecha.
- Fechas completas, contadas desde el 27/09/2026 10:45: la bandeja, el separador de días, la última conversación, las difusiones
  y las plantillas, con su hora también donde la maqueta va sin ella. Las fechas de una lista ordenada que quedaban después de esa
  fecha pasan a antes de «ayer», en el mismo orden. En el teléfono, las que la maqueta muestra sin hora van con el año.
- Con las filas más bajas, el ⋮ abierto vuelve a quedar debajo de su botón.
- En Chats, el buscador y los dos filtros en una sola fila, y el buscador dice «Buscar»; con «Limpiar filtros» a la vista, los
  filtros siguen abajo, como la maqueta.
- Un contacto sin nombre toma el de su perfil de WhatsApp: 0351 15-555-0192 es Romi Castro, el de la maqueta.
- Debajo de un estado no va una oración: «Cargar teléfonos» sin «Queda vinculado», también en el teléfono.
- «Sin medio de pago · qué significa» dice lo que la maqueta, sin «O esperá al 1/11».
El teléfono sigue con el nombre y una línea de datos. Se puede volver a correr.

Desde la v147 suma los chats de la 14 (14-texto-diseno.md, punto 5): WA-Chats-Formulario, WA-Chats-Formulario-Cliente y WA-Chats-Respuesta,
con sus teléfonos, llevan la barra de la bandeja y las fechas como WA-Chats. Llegan con las fechas del 25/10, que comparten con sus
versiones de la 18, y acá pasan al 27/09: la bandeja con las de WA-Chats y el hilo de Tomás, antes de las 10:45 de ese día. Los demás chats
de etapas posteriores siguen con la barra vieja: se pasan con su etapa. «Mis mensajes» de la 14 (WA-Mensajes-14 y M-WA-Mensaje-14) toma las
fechas de WA-Mensajes.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-b0="wa"'
HOY, AYER = "27/09/2026", "26/09/2026"
TEL, PERFIL, INICIALES = "0351 15-555-0192", "Romi Castro", "RC"
RAYA = '<span style="color: var(--t3);">—</span>'
A_LA_DERECHA = 'style="text-align: right;"'

# Cuándo fue lo último de cada uno. Las horas de hoy y de ayer salen de su hilo cuando el tablero lo dibuja; Carla Ruiz (05/10) y
# Laura Méndez (28/09), que quedaban después de hoy, pasan al 25/09, a la hora de su último mensaje y de su respuesta a la difusión.
FECHAS = {
    "Martina López": f"{HOY} 10:42", PERFIL: f"{HOY} 10:15", "Federico Díaz": f"{AYER} 18:40", "Javier Pereyra": f"{AYER} 16:25",
    "Martín Paz": f"{AYER} 17:10", "Carla Ruiz": "25/09/2026 11:07", "Laura Méndez": "25/09/2026 10:12", "Sergio Gómez": "25/09/2026 09:55",
    "Lucas Benítez": "25/09/2026 09:48", "Valeria Sosa": "25/09/2026 09:31", "Diego Romero": "24/09/2026 17:20",
    "Beto Ramírez": f"{AYER} 19:05", "Julio Pérez": f"{AYER} 15:30", "Grupo Delta": f"{AYER} 12:20", "Ferretería Rosales": "22/09/2026 17:45",
}
DIAS = {"Hoy": HOY, "Ayer": AYER, "05/10": "25/09/2026"}
# Un instante va con su hora (formatos.md y Criterio · Tablas); la maqueta muestra estas sin ella
ENVIOS = {"25/09/2026": "09:30", "02/09/2026": "10:00", "04/08/2026": "10:00", "14/07/2026": "11:00"}
PLANTILLAS = {"20/09/2026": "11:30", "18/09/2026": "16:10", "30/09/2026": "09:40", "29/09/2026": "15:25", "28/09/2026": "10:20",
              "02/10/2026": "12:05", "15/09/2026": "09:00", "04/10/2026": "09:00", "06/10/2026": "09:00", "08/10/2026": "09:00"}
CONVERSACION_HOY, CONVERSACION_VIEJA = f"{HOY} 10:39", "12/09/2026 16:20"
# Los chats de la 14: lo que llega de formularios_14_formularios_1004.py y cómo queda; el 13/10 es la «Fecha de la visita» de una respuesta
FECHAS_14 = {"25/10/2026": HOY, "24/10/2026": AYER, "26/10/2026": "28/09/2026", "13/10/2026": AYER}
HORAS_14 = {"10:48": "10:28", "10:50": "10:30", "10:51": "10:31", "11:04": "10:44"}
PERFIL_14 = "Sergio Molina"  # el nombre que le dio formularios_14_formularios_1004.py al contacto sin nombre, antes de la maqueta
MENSAJES_14 = {"25/10/2026": HOY, "24/10/2026 19:05": f"{AYER} 12:20", "28/09/2026 11:20": "22/09/2026 17:45"}  # lo que tiene WA-Mensajes en esas filas

FILA_LISTA = re.compile(r'(<span class="l1"><b>)([^<]*)(</b><span>)([^<]*)(</span>)')
COMPLETA = re.compile(r"\d{2}/\d{2}/\d{4} \d{2}:\d{2}")
CORTA_CON_HORA = re.compile(r"(<span>)(\d{2}/\d{2})( \d{2}:\d{2}</span>)")

# Las filas bajaron a 40 o a 44: el ⋮ abierto vuelve a quedar 4 px debajo de su botón
MENUS = {
    "WA-Admin": (("top: 284px; right: 40px;", "top: 260px; right: 40px;"), ("top: 227px; right: 40px;", "top: 219px; right: 40px;")),
    "WA-Contactos": (("top: 300px; right: 36px;", "top: 297px; right: 36px;"),),
    "WA-Difusiones": (("top: 354px; right: 34px;", "top: 338px; right: 34px;"),),
    "WA-Equipos": (("top: 225px; right: 40px; width: 220px;", "top: 219px; right: 40px; width: 220px;"),),
    "WA-Plantillas": (("top: 222px; right: 36px;", "top: 219px; right: 36px;"),),
    "WA-Respuestas": (("top: 652px; right: 40px; width: 220px;", "top: 601px; right: 40px; width: 220px;"),),
    "Plat-WA-Numero": (("top: 226px; right: 40px;", "top: 220px; right: 40px;"),),
}

CSS_CHATS = """.w-bandeja .filtro:not(.ta-envuelve) { flex-wrap: nowrap; align-items: center; }
.w-bandeja .filtro:not(.ta-envuelve) .w-bus { flex: 1 1 0; min-width: 100px; }
.w-bandeja .filtro:not(.ta-envuelve) .w-pil { flex: none; height: 36px; }
"""
CSS_LISTA = """.w-it { min-height: 44px; }
.w-it .dato { flex-direction: row; align-items: center; gap: 16px; }
.w-it .dato > b { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w-it .dato > span { flex: 0 1 auto; max-width: 55%; font-size: 13px; color: var(--t2); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w-it .dato > span span { font-size: inherit; }
"""
CSS_NUMEROS = """.w-th.n, .w-tr.n { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1.1fr) 176px 146px 48px; }
.w-tr.n { min-height: 40px; }
"""
CSS_CONTACTOS = """.w-th.k, .w-tr.k { grid-template-columns: minmax(0, 1.2fr) 116px minmax(0, 1fr) 104px 136px 48px; }
.w-tr.k { min-height: 40px; }
"""
CSS_CONTACTO = """.w-th.h, .w-tr.h { grid-template-columns: 116px minmax(0, 1fr) 90px 130px 70px 48px; }
.w-tr.h, .w-tr.e11b-d { min-height: 40px; }
.res .origen { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; margin-left: 6px; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--t2); vertical-align: -3px; }
"""
ORIGEN = "Por el bot · 20/08/2026 11:15"
BOTON_ORIGEN = (f'<button type="button" class="origen" aria-label="De dónde salió: {ORIGEN}" title="{ORIGEN}">'
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
                'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/></svg></button>')
CSS_DIFUSIONES = """.w-th.f, .w-tr.f { column-gap: 12px; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) 86px 68px 94px 164px 116px 48px; }
.w-tr.f { min-height: 40px; }
"""
CSS_RESULTADOS = """.w-th.r, .w-tr.r { grid-template-columns: minmax(0, 1.2fr) 130px minmax(0, 1fr) 130px 48px; }
.w-tr.r { min-height: 40px; }
"""
CSS_EQUIPOS = """.w-th.e, .w-tr.e { grid-template-columns: minmax(0, 1fr) 116px minmax(0, 2.2fr) 64px 116px 48px; }
.w-tr.e { min-height: 40px; }
"""
CSS_EQUIPOS_PLAT = """.w-th.e, .w-tr.e { grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) 64px 130px 48px; }
.w-tr.e { min-height: 40px; }
.w-tr.e b { font-weight: 500; }
"""
CSS_PLANTILLAS = """.w-th.t, .w-tr.t { grid-template-columns: minmax(0, 1fr) 130px 100px 130px 130px 48px; }
.w-tr.t { min-height: 40px; }
"""
CSS_TELEFONOS = ".w-tr.p { min-height: 40px; }\n"


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def cambiar(t, reps, n):
    for a, b in reps:
        assert a in t, (n, a[:110])
        t = t.replace(a, b)
    return t


def sub(patron, por, t, n):
    t, k = re.subn(patron, por, t, flags=re.S)
    assert k, (n, patron[:110])
    return t


def guardar(n, t, css):
    """Con la marca, el CSS y el ⋮ abierto de vuelta debajo de su botón."""
    t = cambiar(t, MENUS.get(n, ()), n).replace("</helmet>", f'<style {MARCA}>\n{css}</style>\n</helmet>', 1)
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


def perfil(t, n, compu):
    """El contacto sin nombre toma el de su perfil: el círculo con sus iniciales y, en el encabezado de la compu, su número debajo."""
    t = sub(rf'<span class="w-av g">(?:(?!</span>).)*</span>(<span class="tx">(?:<span class="l1">)?<b>){TEL}</b>',
            rf'<span class="w-av">{INICIALES}</span>\g<1>{PERFIL}</b>', t, n)
    t = t.replace(TEL, PERFIL).replace('aria-label="Acciones del chat"', f'aria-label="Acciones de {PERFIL}"')
    if compu and '<div class="hc">' in t:
        t = re.sub(rf'(<div class="hc"><span class="w-av">{INICIALES}</span><span class="tx"><b>{PERFIL}</b><span>)', rf"\g<1>{TEL} · ", t)
    return t


def fechas(t, n, ayer=()):
    """La fecha y la hora de cada fila de una bandeja o de una lista: con la hora sola es de hoy, salvo las de `ayer`."""
    def una(m):
        nombre, cuando = m[2], m[4]
        if COMPLETA.fullmatch(cuando):
            return m[0]
        if re.fullmatch(r"\d{2}:\d{2}", cuando):
            nueva = f"{AYER if nombre in ayer else HOY} {cuando}"
        else:
            assert nombre in FECHAS, (n, nombre, cuando)
            nueva = FECHAS[nombre]
        return f"{m[1]}{nombre}{m[3]}{nueva}{m[5]}"
    return FILA_LISTA.sub(una, t)


def dias(t):
    return re.sub(r'(<span class="(?:w|ap)-dia">)(Hoy|Ayer|05/10)(</span>)', lambda m: f"{m[1]}{DIAS[m[2]]}{m[3]}", t)


def ordenar_bandeja(t):
    """Martina escribió hace más de 24 horas: en esos tableros, la bandeja vuelve a ir de la más nueva a la más vieja."""
    def clave(fila):
        d, mes, a, h = re.search(r'class="l1"><b>[^<]*</b><span>(\d{2})/(\d{2})/(\d{4}) (\d{2}:\d{2})', fila).groups()
        return (a, mes, d, h)

    def bloque(m):
        filas = re.findall(r'<div class="w-conv.*?</span></span></div>', m[0], flags=re.S)
        return "".join(sorted(filas, key=clave, reverse=True))
    return re.sub(r'(?:<div class="w-conv(?:(?!<div class="w-conv).)*?</span></span></div>)+', bloque, t, flags=re.S)


def pago_como_la_maqueta(t):
    """«O esperá al 1/11» no está en la maqueta ni en la app: con el número pasado de los gratis, el paso es uno solo."""
    t = t.replace("ya usó los 1.000 mensajes gratis de este mes", "ya usó los mensajes gratis de este mes")
    return t.replace('<li><span class="n">2</span>O esperá al 1/11, cuando vuelven los 1.000 gratis</li>', "")


def un_chat(t, n):
    t = dias(fechas(t, n, ayer=("Martina López",) if n in ("WA-Chats-24h", "WA-Chats-Plantilla") else ()))
    t = t.replace("<b>Carla Ruiz</b><span>25/09/2026 11:07</span></span><span class=\"l2\"><span>¿Me lo pueden mandar por moto?",
                  "<b>Carla Ruiz</b><span>25/09/2026 11:20</span></span><span class=\"l2\"><span>¿Me lo pueden mandar por moto?")
    return pago_como_la_maqueta(t).replace("por última vez ayer a las 10:42", f"por última vez {AYER} 10:42")


def chats():
    hechos = []
    for n in ("WA-Chats", "WA-Chats-24h", "WA-Chats-Nota", "WA-Chats-Pasar", "WA-Chats-Plantilla", "WA-Chats-SinTomar", "Plat-WA-Chats"):
        t = leer(n)
        if MARCA in t:
            continue
        t = sub(r"(</svg>) Buscar por nombre o número(</span>)", r"\1 Buscar\2", t, n)
        t = perfil(t, n, compu=True)
        t = un_chat(t, n)
        if n in ("WA-Chats-24h", "WA-Chats-Plantilla"):
            t = ordenar_bandeja(t)
        guardar(n, t, CSS_CHATS)
        hechos.append(n)
    return hechos


def fechas_14(t):
    """Del 25/10 al 27/09, con las horas antes de las 10:45: el hilo, el separador de días, la hora que arma el JS y hasta cuándo se puede mandar."""
    t = re.sub(r"(?<![\d/])(\d{2}/\d{2}/2026)(?![\d/])", lambda m: FECHAS_14.get(m[1], m[1]), t)
    return re.sub(r"(?<![\d:])(10:48|10:50|10:51|11:04)(?![\d:])", lambda m: HORAS_14[m[1]], t)


def chats_14():
    """La barra, el perfil y las fechas de WA-Chats. La fila elegida sale del JS del tablero ({{hora}})."""
    def una(m):
        return f"{m[1]}{m[2]}{m[3]}{FECHAS[m[2]]}{m[5]}" if m[2] in FECHAS and not m[4].startswith("{{") else m[0]
    hechos = []
    for n in ("WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "WA-Chats-Respuesta"):
        t = leer(n)
        if MARCA in t:
            continue
        t = sub(r"(</svg>) Buscar por nombre o número(</span>)", r"\1 Buscar\2", t, n)
        t = re.sub(rf'<span class="w-av g">(?:(?!</span>).)*</span>(<span class="tx"><span class="l1"><b>){PERFIL_14}</b>', rf'<span class="w-av">{INICIALES}</span>\g<1>{PERFIL}</b>', t)
        guardar(n, fechas_14(FILA_LISTA.sub(una, t)), CSS_CHATS)
        hechos.append(n)
    return hechos


def telefonos_chats_14():
    hechos = []
    for n in ("M-WA-Chats-Formulario", "M-WA-Chats-Formulario-Cliente", "M-WA-Conversacion-Respuesta"):
        t = leer(n)
        nuevo = fechas_14(t)
        if nuevo != t:
            (PROJ / f"{n}.dc.html").write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    for n in ("WA-Mensajes-14", "M-WA-Mensaje-14"):
        t = nuevo = leer(n)
        for viejo, fecha in MENSAJES_14.items():
            nuevo = nuevo.replace(viejo, fecha)
        if nuevo != t:
            (PROJ / f"{n}.dc.html").write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    return hechos


def telefonos_chats():
    hechos = []
    for n in ("M-WA-Chats", "M-WA-Conversacion", "M-WA-24h", "M-WA-Chats-Nota", "M-WA-Chats-Pasar", "M-WA-Chats-Plantilla", "M-WA-Chats-SinTomar",
              "M-Plat-WA-Chats", "M-Plat-WA-Conversacion", "WA-Mensajes", "M-WA-Mensajes", "M-WA-Mensaje"):
        t = leer(n)
        nuevo = perfil(t, n, compu=False) if TEL in t else t
        nuevo = un_chat(nuevo, n)
        assert not re.search(r'class="(?:w|ap)-dia">(?:Hoy|Ayer|\d{2}/\d{2}<)', nuevo), n
        if nuevo != t:
            (PROJ / f"{n}.dc.html").write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    return hechos


def numeros():
    hechos = []
    for n in ("WA-Admin", "WA-Admin-Pago", "WA-Alta", "WA-Alta-Coexistencia", "WA-Alta-Meta"):
        t = leer(n)
        if MARCA in t:
            continue
        t = cambiar(t, [('<div class="w-th n"><span>Número</span><span>Atiende a</span>',
                         '<div class="w-th n"><span>Número</span><span>Nombre verificado</span><span>Atiende a</span>')], n)
        t = sub(r'(<div class="w-tr n"><span class="dos"><b>[^<]*</b>)<span>([^<]*?)(?: · también en la app)?</span></span>', r"\1</span><span>\2</span>", t, n)
        guardar(n, t, CSS_NUMEROS)
        hechos.append(n)
    return hechos


def listas_cortas():
    hechos = []
    for n in ("WA-Admin-Editar", "WA-Respuestas", "Plat-WA-Bot", "Plat-WA-Numero", "Plat-WA-Alta"):
        t = leer(n)
        if MARCA in t:
            continue
        assert '<span class="dato">' in t, n
        guardar(n, t, CSS_LISTA)
        hechos.append(n)
    return hechos


def contactos():
    def ultima(m):
        return f"{m[1]}{m[2]}{m[3]}{FECHAS[m[2]]}{m[5]}"
    hechos = []
    for n in ("WA-Contactos", "WA-Contactos-Importar"):
        t = leer(n)
        if MARCA in t:
            continue
        t = cambiar(t, [('<span>Contacto</span><span>Etiquetas</span>', '<span>Contacto</span><span>Número</span><span>Etiquetas</span>'),
                        (f'<span class="dos"><b>{TEL}</b></span><span>{RAYA}</span>', f'<span class="dos"><b>{PERFIL}</b></span><span>{TEL}</span><span>{RAYA}</span>'),
                        (f'aria-label="Acciones de {TEL}"', f'aria-label="Acciones de {PERFIL}"')], n)
        t = sub(r'<span class="dos">(<(a|b)\b[^>]*>[^<]*</\2>)<span>(\d[\d -]*)(?: · Vinculado a su cuenta)?</span></span>', r'<span class="dos">\1</span><span>\3</span>', t, n)
        t = sub(r'<span class="dos"><span class="w-est ([a-z]*)" style="font-size: 13px; color: var\(--t1\);">([^<]*)</span><span>Por [^<]*</span></span>',
                r'<span><span class="w-est \1">\2</span></span>', t, n)
        t = sub(r'(<div class="w-tr k"><span class="dos"><(?:a|b)\b[^>]*>)([^<]*)(</(?:a|b)>.*?<span>)(Hoy|Ayer|\d{2}/\d{2}/\d{4})(</span><span style="display: flex)', ultima, t, n)
        guardar(n, t, CSS_CONTACTOS)
        hechos.append(n)
    return hechos


def telefonos_contactos():
    hechos = []
    for n in ("M-WA-Contactos", "M-WA-Contactos-Importar"):
        t = leer(n)
        nuevo = perfil(t, n, compu=False) if f"<b>{TEL}</b>" in t else t
        nuevo = re.sub(rf'(<b>{PERFIL}</b><span>[^<]*</span></span>)(<span class="l3">)', rf'\1<span class="l2"><span>{TEL}</span></span>\2', nuevo)
        nuevo = fechas(nuevo, n)
        if nuevo != t:
            (PROJ / f"{n}.dc.html").write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    return hechos


def contacto():
    n = "WA-Contacto"
    t = leer(n)
    if MARCA in t:
        return []
    t = cambiar(t, [('<div class="w-th h"><span>Conversación</span><span>Equipo</span>', '<div class="w-th h"><span>Conversación</span><span>Último mensaje</span><span>Equipo</span>'),
                    ('<span class="dos">Hoy<span>Quiero hacer un pedido.</span></span>', f'<span>{CONVERSACION_HOY}</span><span>Quiero hacer un pedido.</span>'),
                    ('<span class="dos">12/09/2026<span>Hola, ¿cómo hago para pedir una factura?</span></span>',
                     f'<span>{CONVERSACION_VIEJA}</span><span>Hola, ¿cómo hago para pedir una factura?</span>'),
                    ('aria-label="Acciones de Hoy"', f'aria-label="Acciones de {CONVERSACION_HOY}"'),
                    ('aria-label="Acciones de 12/09/2026"', f'aria-label="Acciones de {CONVERSACION_VIEJA}"'),
                    ('Acepta promociones</p>', f'Acepta promociones{BOTON_ORIGEN}</p>')], n)
    t = sub(r'(<div class="w-tr e11b-d">.*?<span>)(\d{2}/\d{2}/\d{4})(</span>)', lambda m: f"{m[1]}{m[2]} {ENVIOS[m[2]]}{m[3]}", t, n)
    guardar(n, t, CSS_CONTACTO)
    return [n]


def difusiones():
    n = "WA-Difusiones"
    t = leer(n)
    if MARCA in t:
        return []
    t = cambiar(t, [('<div class="w-th f"><span>Difusión</span><span>Destinatarios</span><span>Estado</span>',
                     f'<div class="w-th f"><span>Difusión</span><span>Plantilla</span><span>Destinatarios</span><span {A_LA_DERECHA}>Contactos</span><span>Estado</span>')], n)
    t = sub(r'<span class="dos">(<(a|b)\b[^>]*>[^<]*</\2>)<span>Plantilla «([^»]*)»</span></span><span class="dos"><b style="font-weight: 400;">([^<]*)</b><span>(\d+) contactos</span></span>',
            r'<span class="dos">\1</span><span>\3</span><span>\4</span><span class="r">\5</span>', t, n)
    t = sub(r"<span>(25/09/2026|02/09/2026)</span>", lambda m: f"<span>{m[1]} {ENVIOS[m[1]]}</span>", t, n)
    guardar(n, t, CSS_DIFUSIONES)
    return [n]


def resultados():
    n = "WA-Difusion-Resultados"
    t = leer(n)
    if MARCA in t:
        return []
    celda = r'<span class="dos" style="display: flex; flex-direction: column; line-height: 1.35;"><b style="font-weight: 500;">([^<]*)</b><span style="font-size: 12px; color: var\(--t3\);">'
    t = cambiar(t, [('<div class="w-th r"><span>Contacto</span><span>Estado</span>', '<div class="w-th r"><span>Contacto</span><span>Número</span><span>Estado</span>'),
                    ("Enviada el 25/09/2026 ·", f"Enviada el 25/09/2026 {ENVIOS['25/09/2026']} ·")], n)
    t = sub(celda + r"</span></span>", rf"<span>{RAYA}</span><span>\1</span>", t, n)
    t = sub(celda + r"([^<]*)</span></span>", r'<span><b style="font-weight: 500;">\1</b></span><span>\2</span>', t, n)
    t = sub(CORTA_CON_HORA.pattern, r"\g<1>\g<2>/2026\g<3>", t, n)
    guardar(n, t, CSS_RESULTADOS)
    return [n]


def equipos():
    hechos = []
    for n in ("WA-Equipos", "WA-Equipos-Crear"):
        t = leer(n)
        if MARCA in t:
            continue
        t = cambiar(t, [('<div class="w-th e"><span>Equipo</span><span>Personas</span><span>Aviso por correo</span>',
                         f'<div class="w-th e"><span>Equipo</span><span>Bandeja</span><span>Personas</span><span {A_LA_DERECHA}>Cantidad</span><span>Aviso por correo</span>')], n)
        t = sub(r'<span class="dos"><b>([^<]*)</b><span>(Bandeja [^<]*)</span></span><span class="dos"><b style="font-weight: 400;">([^<]*)</b><span>(\d+) personas?</span></span>',
                r'<span class="dos"><b>\1</b></span><span>\2</span><span>\3</span><span class="r">\4</span>', t, n)
        guardar(n, t, CSS_EQUIPOS)
        hechos.append(n)
    n = "Plat-WA-Equipos"
    t = leer(n)
    if MARCA not in t:
        t = cambiar(t, [('<div class="w-th e"><span>Equipo</span><span>Operadores</span><span>Aviso por correo</span>',
                         f'<div class="w-th e"><span>Equipo</span><span>Operadores</span><span {A_LA_DERECHA}>Cantidad</span><span>Aviso por correo</span>')], n)
        t = sub(r'<span class="dos"><b style="font-weight: 400;">([^<]*)</b><span>(\d+) operador(?:es)?</span></span>', r'<span>\1</span><span class="r">\2</span>', t, n)
        guardar(n, t, CSS_EQUIPOS_PLAT)
        hechos.append(n)
    return hechos


def plantillas():
    hechos = []
    for n in ("WA-Plantillas", "WA-Plantilla-Nueva", "Plat-WA-Plantillas"):
        t = leer(n)
        if MARCA in t:
            continue
        t = cambiar(t, [('<div class="w-th t"><span>Plantilla</span><span>Tipo</span>', '<div class="w-th t"><span>Plantilla</span><span>Idiomas</span><span>Tipo</span>')], n)
        t = sub(r'(<div class="w-tr t"><span class="dos"><b>[^<]*</b>)<span>(?:[a-z_]+ · )?([^<]*)</span></span>', r"\1</span><span>\2</span>", t, n)
        if n == "Plat-WA-Plantillas":
            t = sub(r'<span class="dos"><span>(Marketing)</span><span>[^<]*</span></span>', r"<span>\1</span>", t, n)
        t = sub(r"<span>(\d{2}/\d{2}/\d{4})</span>", lambda m: f"<span>{m[1]} {PLANTILLAS[m[1]]}</span>", t, n)
        t = t.replace("Revisada el 29/09/2026", f"Revisada el 29/09/2026 {PLANTILLAS['29/09/2026']}")
        guardar(n, t, CSS_PLANTILLAS)
        hechos.append(n)
    return hechos


def cargar_telefonos():
    hechos = []
    n = "WA-Telefonos"
    t = leer(n)
    if MARCA not in t:
        t = sub(r'<span class="dos"><span class="w-est ([a-z]*)" style="font-size: 13px; color: var\(--t1\);">([^<]*)</span><span>[^<]*</span></span>',
                r'<span><span class="w-est \1">\2</span></span>', t, n)
        guardar(n, t, CSS_TELEFONOS)
        hechos.append(n)
    n = "M-WA-Telefonos"
    t = leer(n)
    nuevo = re.sub(r'<span class="l3">(?:Queda vinculado|Le llega una invitación por WhatsApp|No se carga)</span>', "", t)
    if nuevo != t:
        (PROJ / f"{n}.dc.html").write_text(nuevo, encoding="utf-8")
        hechos.append(n)
    return hechos


def telefonos_fechas():
    hechos = []
    n = "M-WA-Contacto"
    t = leer(n)
    nuevo = t.replace('<span class="l1">Hoy<span>', f'<span class="l1">{CONVERSACION_HOY}<span>').replace('<span class="l1">12/09/2026<span>', f'<span class="l1">{CONVERSACION_VIEJA}<span>')
    nuevo = re.sub(r'(<span class="l1">[^<]*<span>)(\d{2}/\d{2})(</span>)', lambda m: f"{m[1]}{m[2]}/2026 {ENVIOS[m[2] + '/2026']}{m[3]}", nuevo)
    if nuevo != t:
        (PROJ / f"{n}.dc.html").write_text(nuevo, encoding="utf-8")
        hechos.append(n)
    for n in ("M-WA-Difusiones", "M-WA-Difusion-Resultados"):
        t = leer(n)
        nuevo = CORTA_CON_HORA.sub(r"\g<1>\g<2>/2026\g<3>", t)
        nuevo = nuevo.replace('<span class="sub">25/09 · Promo semanal · Minorista</span>', '<span class="sub">25/09/2026 · Promo semanal · Minorista</span>')
        if nuevo != t:
            (PROJ / f"{n}.dc.html").write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    return hechos


def revisar():
    """Lo que no tiene que quedar en ningún tablero de la tanda, corra la primera vez o la segunda."""
    for n in ("WA-Chats", "WA-Chats-24h", "WA-Chats-Nota", "WA-Chats-Pasar", "WA-Chats-Plantilla", "WA-Chats-SinTomar", "Plat-WA-Chats", "WA-Mensajes", "M-WA-Mensajes",
              "M-WA-Mensaje", "M-WA-Chats", "M-WA-Conversacion", "M-WA-24h", "M-WA-Chats-Nota", "M-WA-Chats-Pasar", "M-WA-Chats-Plantilla", "M-WA-Chats-SinTomar",
              "M-Plat-WA-Chats", "M-Plat-WA-Conversacion", "WA-Contactos", "WA-Contactos-Importar", "M-WA-Contactos", "M-WA-Contactos-Importar", "WA-Contacto", "M-WA-Contacto",
              "WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "WA-Chats-Respuesta", "M-WA-Chats-Formulario", "M-WA-Chats-Formulario-Cliente", "M-WA-Conversacion-Respuesta",
              "WA-Mensajes-14", "M-WA-Mensaje-14"):
        t = leer(n)
        t = t[t.find("<x-dc>"):t.find("</x-dc>")]
        assert not re.search(r">(?:Hoy|Ayer|Lunes)<", t), n
        assert not re.search(r">\d{2}/\d{2}(?: \d{2}:\d{2})?<", t), n
        assert f"<b>{TEL}</b>" not in t, n


if __name__ == "__main__":
    for nombre, f in (("chats", chats), ("teléfonos de chats y mensajes", telefonos_chats), ("chats de la 14", chats_14), ("teléfonos de los chats de la 14", telefonos_chats_14), ("números", numeros), ("listas cortas", listas_cortas),
                      ("contactos", contactos), ("teléfonos de contactos", telefonos_contactos), ("ficha del contacto", contacto), ("difusiones", difusiones),
                      ("resultados", resultados), ("equipos", equipos), ("plantillas", plantillas), ("cargar teléfonos", cargar_telefonos),
                      ("fechas en el teléfono", telefonos_fechas)):
        print(nombre + ":", f())
    revisar()
