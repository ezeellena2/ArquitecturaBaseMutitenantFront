"""La campana de avisos (decisión del usuario del 2026-10-25, pantallas-y-ui.md del front, f922f208; pedido de la Guía).

Cada aviso en un solo lugar: lo que acabás de hacer, en el aviso de abajo; el estado del objeto, en la banda; todo lo demás
(lo que llegó, lo que falló en segundo plano, lo que espera a alguien), en la campana del encabezado, con su número, y cada
aviso lleva a donde se resuelve. Ningún cartel en el cuerpo de una pantalla, salvo el que la bloquea entera.

- La campana en el encabezado de todos los tableros de la compu con sesión (las dos formas de encabezado), al lado del nombre:
  4 en la organización, 2 en Plataforma y 1 en el perfil personal.
- En el teléfono, en la barra de arriba de las pantallas principales (Inicio, Chats, Contactos, Más y el inicio personal).
- `Campana` (la lista abierta sobre Formularios) y `M-Campana` (la lista en su pantalla), nuevos, en la página Organización.
- Desde la v143 (el usuario, 25/10, maqueta 6691dff): la versión nueva del sistema se avisa en la campana, primera, sin leer y con la
  hora; al tocarla, recarga la página. No va como franja;
  las fechas de los avisos, completas (formatos.md).
- Desde la v147 (14-texto-diseno.md, punto 2, y base-de-la-12.md): cada acceso ve solo sus avisos, y `Campana` y `M-Campana` solo los de la
  base: un método de ingreso propio (también en `M-Campana-Personal`), la versión nueva y, para un operador, una organización pendiente y
  una recuperación pedida. El operador, con otro marco, tiene `Campana-Plat` y `M-Campana-Plat`: un tablero por marco, como Otro-Acceso. Cada
  etapa dibuja su versión: `Campana-14` y `M-Campana-14` suman «WhatsApp rechazó la versión N de …». `Campana` se abre sobre Usuarios, de la
  base; la versión de la 14, sobre Formularios. El número es el de lo que lista esa campana: 1 en una organización, hasta que una etapa dibuje
  la suya (2 en la 14), y 2 en Plataforma. Los teléfonos de Plataforma suman la campana en sus pantallas principales (base-de-la-12.md).

Corre al final de todo. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import menus_y_solo_lectura_1004 as M  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
APROBADO = True  # el usuario la aprobó el 25/10 («publica y commitea», versión 140)
PARA_APROBAR = " · para aprobar"


def svg(d, w=20, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


CAMPANA = svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>')
LLEGO = svg('<path d="M4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"/><path d="M5.5 6.5h13L20 13.5v5H4v-5z"/>', 18)
FALLO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8v.2"/>', 18)
ESPERA = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 18)
VERSION = svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>', 18)
CANT = {"org": "1", "propuesta-whatsapp": "1", "formularios": "1", "plataforma": "2", "plat-formularios": "2", "personal": "1"}
METODO = "Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa"
METODO_CUANDO = "20/09/2026 10:12"
# (tipo, ícono, texto, cuándo, destino en la compu, destino en el teléfono), de lo más nuevo a lo más viejo
AVISOS = [("espera", ESPERA, METODO, METODO_CUANDO, "Cuenta.dc.html", "M-Cuenta.dc.html")]
AVISOS_14 = [("fallo", FALLO, "WhatsApp rechazó la versión 4 de Visita a cliente", "27/09/2026 10:38", "FRM-Publicando.dc.html", "M-FRM-Editor.dc.html")] + AVISOS
# La 21 suma lo que espera aprobación y el aviso que no salió (21-reglas-y-aprobacion.md)
AVISOS_21 = [("espera", ESPERA, "3 respuestas por aprobar en Visita a cliente", "15/10/2026 16:20", "FRM-Respuestas-21.dc.html", "M-FRM-Respuestas-21.dc.html"),
             ("fallo", FALLO, "No se pudo mandar el aviso de VIS-000126", "13/10/2026 16:05", "FRM-Respuesta-Aprobacion.dc.html", "M-FRM-Respuesta-Aprobacion.dc.html")] + AVISOS
# La 23 suma las preguntas sin respuesta del asistente, para quien administra WhatsApp (23-asistente.md, «La campana»)
AVISOS_23 = [("espera", ESPERA, "3 preguntas sin respuesta del asistente", "15/10/2026 17:30", "WA-Preguntas-Sin-Respuesta.dc.html", "M-WA-Preguntas-Sin-Respuesta.dc.html")] + AVISOS_21
AVISOS_PLAT = [("espera", ESPERA, "Pablo Ortiz pidió recuperar su cuenta", "27/09/2026 10:20", "Recuperaciones.dc.html", "M-Recuperaciones.dc.html"),
               ("espera", ESPERA, "Gamma S.A. espera aprobación", "27/09/2026 09:05", "Organizacion.dc.html", "M-Organizacion.dc.html")]
CSS = """.w-cmp-env { position: relative; display: inline-flex; margin-left: auto; margin-right: 6px; }
.w-campana { position: relative; width: 38px; height: 38px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: var(--t2); text-decoration: none; }
.w-campana:hover, .w-campana.on { background: oklch(0.24 0.014 78 / 0.06); color: var(--t1); }
.w-campana .n { position: absolute; top: 2px; right: 1px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px; background: var(--marca); color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; border: 2px solid oklch(0.95 0.018 76); }
.w-cmp-env + .w-umd, .w-cmp-env + .envoltura { margin-left: 0 !important; }
.cmp-lista { position: absolute; z-index: 40; top: calc(100% + 8px); right: 0; width: 420px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; box-shadow: 0 16px 40px oklch(0.24 0.014 78 / 0.18); overflow: hidden; text-align: left; }
.cmp-cab { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--borde); font-size: 15px; font-weight: 700; color: var(--t1); }
.cmp-cab span { font-size: 13px; font-weight: 500; color: var(--t3); }
.cmp-it { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; text-decoration: none; color: var(--t1); }
.cmp-it + .cmp-it { border-top: 1px solid var(--borde); }
.cmp-it:hover { background: var(--s2); }
.cmp-ic { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: var(--s2); color: var(--t2); }
.cmp-ic.fallo { background: var(--peligro-t); color: oklch(0.52 0.19 25); }
.cmp-ic.espera { background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); }
.cmp-ic.llego { background: var(--marca-t); color: var(--marca-tx); }
.cmp-ic.version { background: var(--marca-t); color: var(--marca-tx); }
.cmp-it.sin-leer .cmp-tx { font-weight: 600; }
.cmp-it .cmp-punto { margin-left: auto; align-self: center; width: 8px; height: 8px; border-radius: 50%; background: var(--marca); flex-shrink: 0; }
.cmp-tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-size: 14px; line-height: 1.35; }
.cmp-tx small { font-size: 12.5px; color: var(--t3); }
.cmp-vacia { padding: 28px 16px; text-align: center; font-size: 14px; color: var(--t2); }
.cod { white-space: nowrap; }
"""
CSS_TEL = """.ap-bar .ap-campana, .c-campana { position: relative; }
.ap-campana .n, .c-campana .n { position: absolute; top: 2px; right: 0; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px; background: var(--marca); color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; border: 2px solid #fff; }
.c-top { position: relative; }
.c-campana { position: absolute; top: 52px; right: 16px; width: 44px; height: 44px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; background: oklch(1 0 0 / 0.14); }
.c-campana .n { border-color: transparent; background: #fff; color: var(--marca-tx); }
.cp-fila { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; text-decoration: none; color: var(--t1); border-bottom: 1px solid var(--borde); }
.cp-fila .tx { display: flex; flex-direction: column; gap: 3px; font-size: 15.5px; line-height: 1.35; flex: 1; min-width: 0; }
.cp-fila .tx small { font-size: 13px; color: var(--t3); }
.cp-fila .chev { color: var(--t3); align-self: center; }
"""


def boton(n, href="Campana.dc.html", abierto=False, lista=""):
    return (f'<span class="w-cmp-env"><a class="w-campana{" on" if abierto else ""}" href="{href}" aria-label="Avisos: {n}">{CAMPANA}<span class="n">{n}</span></a>'
            f"{lista}</span>")


# La versión nueva del sistema va primera, sin leer; al tocarla vuelve a cargar la página (no va como franja: el usuario, 25/10)
AVISO_VERSION = ("version", VERSION, "Hay una versión nueva del sistema", "27/09/2026 10:40")


def lista(vacia=False, version=False, avisos=AVISOS):
    if vacia:
        cuerpo = '<div class="cmp-vacia">No hay avisos.</div>'
    else:
        cuerpo = "".join(f'<a class="cmp-it" href="{d}"><span class="cmp-ic {tipo}">{ic}</span><span class="cmp-tx">{tx}<small>{cuando}</small></span></a>'
                         for tipo, ic, tx, cuando, d, _m in avisos)
        if version:
            tipo, ic, tx, cuando = AVISO_VERSION
            cuerpo = (f'<a class="cmp-it sin-leer" href="#" aria-label="{tx}, sin leer"><span class="cmp-ic {tipo}">{ic}</span>'
                      f'<span class="cmp-tx">{tx}<small>{cuando}</small></span><span class="cmp-punto" aria-hidden="true"></span></a>') + cuerpo
    cant = "" if vacia else len(avisos) + (1 if version else 0)
    return (f'<div class="cmp-lista" role="dialog" aria-label="Avisos"><div class="cmp-cab">Avisos<span>{cant}</span></div>{cuerpo}</div>')


def css(t, bloque, marca):
    if f'data-campana="{marca}"' in t:
        return re.sub(rf'<style data-campana="{marca}">.*?</style>\n', f'<style data-campana="{marca}">\n{bloque}</style>\n', t, count=1, flags=re.S)
    return t.replace("</helmet>", f'<style data-campana="{marca}">\n{bloque}</style>\n</helmet>', 1)


def con_campana(t, n):
    """Pone la campana al lado del nombre, en las dos formas de encabezado de la compu."""
    if 'class="w-cmp-env"' in t:
        return t
    hechos = 0
    if '<details class="w-umd">' in t:
        t = t.replace('<details class="w-umd">', boton(n) + '<details class="w-umd">')
        hechos += 1
    if '<span class="envoltura">' in t and 'class="ab-topbar"' in t:
        k = t.index('class="ab-topbar"')
        i = t.index('<span class="envoltura">', k)
        t = t[:i] + boton(n) + t[i:]
        hechos += 1
    return css(t, CSS, "1") if hechos else t


TEL_RAIZ = {"M-WA-Chats": "1", "M-WA-Menu": "1", "M-WA-Contactos": "1", "M-Inicio-Personal": "1"}
TEL_RAIZ_PLAT = ["M-Organizaciones", "M-Cuentas", "M-Plat-WA-Chats", "M-Asistente-Plat", "M-Mas-Plat"]  # la barra de abajo de Plataforma


def numero(t, n):
    """El número de la campana en un tablero que ya la tiene: el de lo que lista la que abre."""
    t = re.sub(r'(<a class="(?:w-campana|ap-ib ap-campana|c-campana)" href="[^"]*" aria-label="Avisos: )\d+(">)', rf"\g<1>{n}\2", t)
    return re.sub(rf'({re.escape(CAMPANA)}<span class="n">)\d+(</span></a>)', rf"\g<1>{n}\2", t)


def con_campana_tel(t, n, destino="M-Campana"):
    if "ap-campana" in t or "c-campana" in t:
        return numero(t, n)
    b = f'<a class="ap-ib ap-campana" href="{destino}.dc.html" aria-label="Avisos: {n}">{CAMPANA}<span class="n">{n}</span></a>'
    salida, k = [], 0
    for m in re.finditer(r'<div class="ap-bar(?: as-bar)?">', t):
        i = m.start()
        uno = t.index("</div>", t.index('<div class="tit">', i)) + len("</div>")
        cierre = t.index("</div>", uno)
        salida.append((cierre, b))
    for cierre, h in reversed(salida):
        t = t[:cierre] + h + t[cierre:]
    return css(t, CSS_TEL, "tel") if salida else t


def inicio_tel():
    t = (PROJ / "M-Inicio-Org.dc.html").read_text(encoding="utf-8")
    if "c-campana" not in t:
        b = f'<a class="c-campana" href="M-Campana.dc.html" aria-label="Avisos: 1">{CAMPANA}<span class="n">1</span></a>'
        assert t.count('<div class="c-hola">') >= 1
        t = t.replace('<div class="c-hola">', b + '<div class="c-hola">')
        t = css(t, CSS_TEL, "tel")
    (PROJ / "M-Inicio-Org.dc.html").write_text(numero(t, "1"), encoding="utf-8")


# ================================================================ Campana (la lista abierta) y M-Campana
ESTADOS = ["Con avisos", "Versión nueva", "Sin avisos"]
GANCHOS = ("      si: true, no: false,\n", "      si: true,\n      no: false,\n")  # la pieza donde cada tablero arma sus valores
NUMERO = '<sc-if value="{{cmpHay}}" hint-placeholder-val="{{si}}"><span class="n">{{cmpCant}}</span></sc-if>'
# Los tableros de la 14 abren su versión, con sus dos avisos
TABLEROS_14 = ["FRM-Formularios", "FRM-Editor", "FRM-Publicar", "FRM-Publicando", "FRM-Catalogos-14", "FRM-Catalogo-14", "WA-Chats-Formulario", "WA-Chats-Respuesta",
               "WA-Chats-Formulario-Cliente"]
# Los de la 21 abren la suya, con lo que espera aprobación
TABLEROS_21 = ["FRM-Formularios-21", "FRM-Respuestas-21", "FRM-Respuesta-Aprobacion", "FRM-Editor-Reglas", "FRM-Pdf", "FRM-Tablero-21", "FRM-Respuesta-Corregir", "FRM-Respuesta-Anular",
               "FRM-Editor-21", "FRM-Cargar-Respuesta-21", "FRM-Dar-De-Baja-21", "FRM-Editor-Baja-21", "WA-Chats-Avisos"]
# Los de la 23 abren la suya, con las preguntas sin respuesta
TABLEROS_23 = ["WA-Asistente", "WA-Asistente-Casos", "WA-Asistente-Probar", "WA-Asistente-Limites", "WA-Modo-Atencion", "WA-Chats-Casos", "WA-Preguntas-Sin-Respuesta",
               "WA-Chats-Asistente", "WA-Chats-Sugerencia", "WA-Chats-Audio", "FRM-Editor-Asistente", "FRM-Editor-Sugerencias", "FRM-Editor-Reglas-23", "FRM-Catalogos-23",
               "FRM-Catalogo-Propuesta", "FRM-Respuesta-Cadena", "FRM-Faltan", "FRM-Dar-De-Baja-23", "FRM-Editor-Baja-23"]


def la_suya(n, t, pagina):
    """Cada campana abre la de su acceso y su etapa, con su número."""
    if pagina in ("plataforma", "plat-formularios"):
        return t.replace('<a class="w-campana" href="Campana.dc.html"', '<a class="w-campana" href="Campana-Plat.dc.html"')
    if pagina == "personal":
        return t
    if n in TABLEROS_14:
        return numero(t.replace('<a class="w-campana" href="Campana.dc.html"', '<a class="w-campana" href="Campana-14.dc.html"'), "2")
    if n in TABLEROS_21:
        return numero(t.replace('<a class="w-campana" href="Campana.dc.html"', '<a class="w-campana" href="Campana-21.dc.html"'), str(len(AVISOS_21)))
    if n in TABLEROS_23:
        return numero(t.replace('<a class="w-campana" href="Campana.dc.html"', '<a class="w-campana" href="Campana-23.dc.html"'), str(len(AVISOS_23)))
    return numero(t, "1")


def abierta(base, cant, avisos, destino, titulo, estados=ESTADOS):
    """La lista abierta sobre un tablero, con la campana con su número."""
    t = (PROJ / f"{base}.dc.html").read_text(encoding="utf-8")
    capas = ('<sc-if value="{{cmpCon}}" hint-placeholder-val="{{si}}">' + lista(avisos=avisos)
             + ('</sc-if><sc-if value="{{cmpVersion}}" hint-placeholder-val="{{no}}">' + lista(version=True, avisos=avisos)
                + '</sc-if><sc-if value="{{cmpSin}}" hint-placeholder-val="{{no}}">' + lista(True) if len(estados) > 1 else "") + "</sc-if>")
    viejo = re.search(r'<span class="w-cmp-env"><a class="w-campana" href="[^"]*" aria-label="Avisos: \d+">.*?</a></span>', t, re.S).group(0)
    t = t.replace(viejo, boton("{{cmpCant}}", abierto=True, lista=capas).replace('<span class="n">{{cmpCant}}</span>', NUMERO), 1)
    assert "cmp-lista" in t
    props = {"campana": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t = re.sub(r"data-props='[^']*'", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    gancho = next(g for g in GANCHOS if g in t)
    t = t.replace(gancho, gancho + "      cmpCon: (this.props.campana ?? 'Con avisos') === 'Con avisos', cmpSin: this.props.campana === 'Sin avisos', cmpHay: this.props.campana !== 'Sin avisos',\n"
                  f"      cmpVersion: this.props.campana === 'Versión nueva', cmpCant: {{'Versión nueva': '{cant + 1}', 'Sin avisos': '0'}}[this.props.campana] ?? '{cant}',\n", 1)
    t = re.sub(r"<title>[^<]*</title>", f"<title>{titulo}</title>", t)
    t = t.replace('href="Campana.dc.html" aria-label="Avisos: {{cmpCant}}"', 'href="#" aria-label="Avisos: {{cmpCant}}" aria-expanded="true"', 1)
    (PROJ / f"{destino}.dc.html").write_text(t, encoding="utf-8")


def campana():
    abierta("Usuarios", len(AVISOS), AVISOS, "Campana", "Avisos · la campana")
    abierta("FRM-Formularios", len(AVISOS_14), AVISOS_14, "Campana-14", "Avisos · la campana · etapa 14", ["Con avisos"])
    abierta("FRM-Formularios-21", len(AVISOS_21), AVISOS_21, "Campana-21", "Avisos · la campana · etapa 21", ["Con avisos"])
    abierta("WA-Asistente", len(AVISOS_23), AVISOS_23, "Campana-23", "Avisos · la campana · etapa 23", ["Con avisos"])
    abierta("Organizaciones", len(AVISOS_PLAT), AVISOS_PLAT, "Campana-Plat", "Avisos · la campana · Plataforma")


def filas_tel(avisos):
    return "".join(f'<a class="cp-fila" href="{m}"><span class="cmp-ic {tipo}">{ic}</span><span class="tx">{tx}<small>{cuando}</small></span>'
                   f'<span class="chev">{svg("<path d=" + chr(34) + "m9.5 5.5 6.5 6.5-6.5 6.5" + chr(34) + "/>", 18, "2")}</span></a>'
                   for tipo, ic, tx, cuando, _d, m in avisos)


def campana_tel():
    filas = filas_tel(AVISOS)
    bar = C.t_bar("Avisos", "Grupo Delta", "M-Inicio-Org.dc.html")
    tipo, ic, tx, cuando = AVISO_VERSION
    version = (f'<a class="cp-fila" href="#"><span class="cmp-ic {tipo}">{ic}</span><span class="tx"><b style="font-weight: 600;">{tx}</b><small>{cuando}</small></span>'
               '<span class="cmp-punto" aria-hidden="true" style="align-self: center; width: 9px; height: 9px; border-radius: 50%; background: var(--marca);"></span></a>')

    def tres(barra, avisos):
        return {"Con avisos": barra + f'<div class="ap-cuerpo">{avisos}</div>', "Versión nueva": barra + f'<div class="ap-cuerpo">{version}{avisos}</div>',
                "Sin avisos": barra + '<div class="ap-cuerpo"><div class="ap-vacio">No hay avisos.</div></div>'}
    t = C.tel_pagina(tres(bar, filas), ESTADOS, {}, "Avisos · la campana · teléfono", CSS + CSS_TEL)
    (PROJ / "M-Campana.dc.html").write_text(t, encoding="utf-8")
    t = C.tel_pagina(tres(C.t_bar("Avisos", "Plataforma", "M-Organizaciones.dc.html"), filas_tel(AVISOS_PLAT)), ESTADOS, {}, "Avisos · la campana · Plataforma · teléfono", CSS + CSS_TEL)
    (PROJ / "M-Campana-Plat.dc.html").write_text(t, encoding="utf-8")
    bar14 = C.t_bar("Avisos", "Grupo Delta", "M-Inicio-Org.dc.html")
    t = C.tel_pagina({"Con avisos": bar14 + f'<div class="ap-cuerpo">{filas_tel(AVISOS_14)}</div>'}, ["Con avisos"], {}, "Avisos · la campana · teléfono · etapa 14", CSS + CSS_TEL)
    (PROJ / "M-Campana-14.dc.html").write_text(t, encoding="utf-8")
    t = C.tel_pagina({"Con avisos": bar14 + f'<div class="ap-cuerpo">{filas_tel(AVISOS_21)}</div>'}, ["Con avisos"], {}, "Avisos · la campana · teléfono · etapa 21", CSS + CSS_TEL)
    (PROJ / "M-Campana-21.dc.html").write_text(t, encoding="utf-8")
    t = C.tel_pagina({"Con avisos": bar14 + f'<div class="ap-cuerpo">{filas_tel(AVISOS_23)}</div>'}, ["Con avisos"], {}, "Avisos · la campana · teléfono · etapa 23", CSS + CSS_TEL)
    (PROJ / "M-Campana-23.dc.html").write_text(t, encoding="utf-8")


NUEVOS = {"Campana": (4560, 2300, 1440, 900, "Avisos · la campana"), "M-Campana": (6110, 3320, 390, 844, "Avisos · la campana · teléfono"),
          "Campana-Plat": (4560, 1280, 1440, 900, "Avisos · la campana · Plataforma"),
          "M-Campana-Plat": (7990, 2300, 390, 844, "Avisos · la campana · Plataforma · teléfono"),
          "Campana-21": (0, 0, 1440, 900, "Avisos · la campana · etapa 21"), "M-Campana-21": (0, 0, 390, 844, "Avisos · la campana · teléfono · etapa 21"),
          "Campana-23": (0, 0, 1440, 900, "Avisos · la campana · etapa 23"), "M-Campana-23": (0, 0, 390, 844, "Avisos · la campana · teléfono · etapa 23")}
PAGINA = {"Campana-Plat": "plataforma", "M-Campana-Plat": "plataforma", "Campana-21": "formularios", "M-Campana-21": "formularios", "Campana-23": "formularios",
          "M-Campana-23": "formularios"}


def registrar(tocados):
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (x, y, w, h, titulo) in NUEVOS.items():
        c["boards"].setdefault(f"{n}.dc.html", {"h": h, "is_interactive": True, "page": PAGINA.get(n, "org"), "title": titulo, "w": w, "x": x, "y": y})
    for n in tocados:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    hechos = []
    for k, v in c["boards"].items():
        n = k[:-8]
        if n.startswith("M-") or v.get("page") not in CANT or n in NUEVOS or n in ("Campana-14", "Campana-21", "Campana-23"):
            continue
        f = PROJ / k
        t = f.read_text(encoding="utf-8")
        nuevo = la_suya(n, con_campana(t, CANT[v["page"]]), v["page"])
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    print("campana en", len(hechos), "tableros de la compu")
    for n, cant in TEL_RAIZ.items():
        f = PROJ / f"{n}.dc.html"
        t = f.read_text(encoding="utf-8")
        f.write_text(con_campana_tel(t, cant), encoding="utf-8")
    for n in TEL_RAIZ_PLAT:
        f = PROJ / f"{n}.dc.html"
        f.write_text(con_campana_tel(f.read_text(encoding="utf-8"), "2", "M-Campana-Plat"), encoding="utf-8")
    inicio_tel()
    campana()
    campana_tel()
    registrar(list(NUEVOS))
    print("listo")
