"""Las reglas en Configuración (270 a 273) y la zona horaria en la pieza (262), para la F11 y la F13 de la segunda parte de la base.
Escribe, desde la copia de `base2_1004/`:

- `Config-Plat-Base2` y su teléfono: «Nombre y correos» con «Así llega» (273), «Privacidad y retención» con los plazos de la
  plataforma (272) y, con WhatsApp instalado, la zona «WhatsApp» con «Países que reciben códigos» en la pieza, el plazo de sus chats y
  el máximo de las organizaciones (270). Cada valor con su mínimo y su máximo en la (i), el error fuera de rango, el 409 y lo apagado
  sin permiso;
- `WA-Config-Base2` y su teléfono: la configuración de WhatsApp de la organización, nueva en Administración › WhatsApp, con «Guardar
  los mensajes de los chats» (90 días, de 1 a 3650 y dentro del máximo de la plataforma) (272);
- `Asistente-Org-Base2`, `Asistente-Personal-Base2`, `Asistente-Plat-Base2` y sus teléfonos: el cupo del día agotado dice que fue el
  cupo y cuándo vuelve, a la medianoche de la organización o, fuera de una, de la zona del perfil (271);
- `WA-Respuestas-Base2` y su teléfono: «Fuera de horario» con el horario en una tabla de lectura (Día · Horario · ✎), cada día en un
  diálogo con la atención en la pieza, y la zona horaria en la pieza (262, con IN1-C de ArquitecturaBase como referencia);
- `Cuenta-Base2`, `Configuracion-Base2` y sus teléfonos: la zona horaria y el idioma en la pieza, con la ciudad y, en gris, la hora de
  su país y el desfase (262).
"""
import re

from base2_comun import (SVG_LAPIZ, campo, con_dialogo_w, con_hoja, copia, css, escribir, fin_div, info, lista, lista_zonas, op,
                         pk_tel, por_estado, reemplazar_div, tablero, tip, una_vez, zona, alto, SVG_ATEN, SVG_ERR)

POLITICA = "La política de privacidad tiene que prometer estos mismos plazos."
SIN_PERMISO = "No tenés permiso para cambiar la configuración."
BA = zona("Buenos Aires", "Argentina", "GMT−3")

CSS_CONFIG = """
/* Base 2 · un número con su unidad, su (i) con el mínimo y el máximo, y el error debajo (270). */
.b2-num { display: flex; align-items: center; gap: 8px; }
.b2-num input, .b2-num .ct { width: 110px; flex: none; }
.b2-num .u { color: var(--t2); font-size: 14px; }
.b2-et { display: inline-flex; align-items: center; gap: 2px; }
.b2-et .b2-i { margin-left: 4px; }
.in2.err, .ct.err { border-color: oklch(0.57 0.2 25) !important; box-shadow: 0 0 0 1px oklch(0.57 0.2 25); }
.in2[disabled], .ct.apag { background: var(--s3); color: var(--t3); }
.b2-tit-i { display: inline-flex; align-items: center; gap: 6px; }
.hoja h2 .b2-i, .w-cab .b2-i { font-weight: 400; }
.b2-av { display: flex; align-items: flex-start; gap: 8px; margin-top: 8px; padding: 9px 12px; border: 1px solid var(--borde2); border-left: 3px solid var(--alerta); border-radius: 3px; background: #fff; color: var(--t1); font-size: 13px; line-height: 1.45; }
.b2-av > svg { flex: none; margin-top: 1px; color: var(--alerta); }
.b2-av.mal { border-left-color: oklch(0.57 0.2 25); }
.b2-av.mal > svg { color: oklch(0.57 0.2 25); }
.b2-av .acc { margin-left: auto; color: var(--marca-tx); font-weight: 600; white-space: nowrap; }
/* «Así llega»: el correo de un código con el nombre, el remitente y el logo de la configuración (273). */
.b2-correo { grid-column: 1 / -1; border: 1px solid var(--borde); border-radius: 3px; background: oklch(0.985 0.003 95); font-size: 13px; }
.b2-correo .h { display: grid; grid-template-columns: 70px minmax(0, 1fr); gap: 4px 10px; padding: 10px 14px; border-bottom: 1px solid var(--borde); color: var(--t2); }
.b2-correo .h b { color: var(--t1); font-weight: 500; }
.b2-correo .c { max-width: 460px; margin: 16px auto; padding: 20px 24px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; color: var(--t1); line-height: 1.5; }
.b2-correo .logo { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-weight: 700; }
.b2-correo .logo .cu { width: 26px; height: 26px; border-radius: 3px; background: var(--marca); }
.b2-correo .cod { margin: 12px 0; font-size: 24px; font-weight: 700; letter-spacing: 4px; }
.b2-correo .nota { color: var(--t2); font-size: 12px; }
.b2-asi { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; margin-top: 4px; font-weight: 600; font-size: 13px; color: var(--t1); }
"""


def et(texto, ayuda, abierto=False, req=False):
    r = '<span class="req" aria-hidden="true">*</span>' if req else ""
    return f'<span class="b2-et">{texto}{r}{info(ayuda, abierto)}</span>'


def numero_ab(id_, etiqueta, valor, unidad, ayuda, error=None, apagado=False, abierto=False):
    clase = "in2" + (" err" if error else "")
    dis = " disabled" if apagado else ""
    err = f'<span class="b2-err" role="alert">{error}</span>' if error else ""
    t = tip(SIN_PERMISO) if apagado == "tip" else ""
    return (f'<div class="campo2"><label class="et" for="{id_}">{et(etiqueta, ayuda, abierto)}</label><div class="b2-num b2-env">'
            f'<input class="{clase}" id="{id_}" type="number" value="{valor}"{dis}><span class="u">{unidad}</span>{t}</div>{err}</div>')


def texto_ab(id_, etiqueta, valor, ayuda, apagado=False, ph=""):
    dis = " disabled" if apagado else ""
    return (f'<div class="campo2"><label class="et" for="{id_}">{et(etiqueta, ayuda)}</label>'
            f'<input class="in2" id="{id_}" type="text" value="{valor}" placeholder="{ph}"{dis}></div>')


def hoja(titulo, cuerpo, ayuda=None, abierto=False):
    i = info(ayuda, abierto, "b2-tip-abajo") if ayuda else ""
    return f'<div class="hoja" role="group" aria-label="{titulo}"><h2 class="b2-tit-i">{titulo}{i}</h2>{cuerpo}</div>'


def asi_llega(nombre="ArquitecturaBase", remitente="ArquitecturaBase", logo=False):
    marca = '<span class="cu"></span>' if logo else ""
    return (f'<div class="b2-asi">Así llega</div><div class="b2-correo" aria-label="Así llega el correo de un código">'
            f'<div class="h"><span>De</span><b>{remitente} &lt;no-responder@arquitecturabase.ejemplo.com&gt;</b>'
            f'<span>Asunto</span><b>483920 es tu código de acceso a {nombre}</b></div>'
            f'<div class="c"><div class="logo">{marca}{nombre}</div><b>Tu código de acceso</b><p style="margin: 6px 0 0;">Usá este código para ingresar a {nombre}:</p>'
            '<div class="cod">483920</div><div class="nota">Vence en 10 minutos. Si no lo pediste, ignorá este correo: nadie puede entrar a tu cuenta sin el código.</div></div></div>')


PAISES = [("Argentina", "+54"), ("Bolivia", "+591"), ("Brasil", "+55"), ("Chile", "+56"), ("Colombia", "+57"), ("Ecuador", "+593"),
          ("España", "+34"), ("México", "+52"), ("Paraguay", "+595"), ("Perú", "+51"), ("Uruguay", "+598"), ("Venezuela", "+58")]
COSTO = "Los códigos a números de Uruguay se pagan con la tarifa de Meta para ese país."


def lista_paises(elegidos):
    ops = [op(n, f"Código de país {c}", elegida=n in elegidos, multiple=True) for n, c in PAISES if n in elegidos]
    ops += [op(n, f"Código de país {c}", elegida=False, multiple=True, sep=k == 0) for k, (n, c) in enumerate(p for p in PAISES if p[0] not in elegidos)]
    return lista(ops, multiple=True, buscar="", cantidad="12 países habilitados")


def secciones_ab(e):
    """Las tres secciones nuevas de Config-Plat para el estado `e`."""
    ap = "tip" if e == "Sin permiso" else False
    apag = bool(ap)
    nombre = "Delta Apps" if e == "Con el nombre nuevo" else "ArquitecturaBase"
    remitente = "Equipo de Delta Apps" if e == "Con el nombre nuevo" else "ArquitecturaBase"
    correos = hoja("Nombre y correos", '<div class="b2-grid">'
                   + texto_ab("f-App", "Nombre de la aplicación", nombre, "Hasta 60 caracteres. Va en los correos, los mensajes del bot de WhatsApp y la pestaña del navegador.", apag)
                   + texto_ab("f-Rem", "Nombre del remitente", remitente, "Hasta 60 caracteres. Es el nombre con el que llegan los correos.", apag)
                   + texto_ab("f-Logo", "Logo de los correos", "https://delta.ejemplo.com/logo.png" if e == "Con el nombre nuevo" else "",
                              "Vacío, o una dirección que empieza con https://.", apag, ph="https://")
                   + asi_llega(nombre, remitente, e == "Con el nombre nuevo") + "</div>")
    fuera = e == "Un plazo fuera de rango"
    privacidad = hoja("Privacidad y retención", '<div class="b2-grid">'
                      + numero_ab("f-Ing", "Datos de los ingresos", "0" if fuera else "12", "meses", "De 1 a 120 meses. Pasado el plazo se borra la dirección IP y el navegador de cada ingreso.",
                                  "Tiene que ser de 1 a 120." if fuera else None, ap)
                      + numero_ab("f-Cod", "Códigos y enlaces", "30", "días", "De 1 a 3650 días.", apagado=apag)
                      + numero_ab("f-Inv", "Invitaciones cerradas", "30", "días", "De 7 a 3650 días. Una invitación aceptada, revocada o vencida.", apagado=apag)
                      + numero_ab("f-Ini", "Conversaciones del Inicio", "30", "días", "De 1 a 30 días. Las conversaciones con el asistente.", apagado=apag)
                      + "</div>", POLITICA, e == "La (i) de Privacidad y retención")
    elegidos = {"Argentina", "Uruguay"} if e in ("Sumar un país: el aviso de costo", "Países: la lista") else set() if e == "Sin países" else {"Argentina"}
    valor = ", ".join(n for n, _ in PAISES if n in elegidos) or "Sin países"
    extra = lista_paises(elegidos) if e == "Países: la lista" else ""
    pais = (f'<div class="campo2 ancho"><span class="et">{et("Países que reciben códigos", "Solo a números de estos países se mandan códigos de ingreso por WhatsApp, y solo de ellos se aceptan números para ingresar o vincular. Cada código se paga, con la tarifa de Meta del país del número.")}</span>'
            + campo(valor, vacio=not elegidos, abierto=bool(extra), apagado=SIN_PERMISO if apag else None, error=e == "Sin países",
                    aria="Países que reciben códigos", extra=extra, tip_abierto=False)
            + ('<span class="b2-err" role="alert">Elegí al menos un país.</span>' if e == "Sin países" else "")
            + (f'<div class="b2-av" role="status">{SVG_ATEN}<span>{COSTO}</span></div>' if e == "Sumar un país: el aviso de costo" else "")
            + "</div>")
    whatsapp = hoja("WhatsApp", '<div class="b2-grid">' + pais
                    + numero_ab("f-Chats", "Guardar los mensajes de los chats", "90", "días", "De 1 a 3650 días. Los chats del número de Plataforma.", apagado=apag)
                    + numero_ab("f-Max", "Máximo para las organizaciones", "3650", "días", "De 1 a 3650 días. Ninguna organización guarda los mensajes de sus chats más que esto.", apagado=apag)
                    + "</div>", POLITICA)
    return correos + privacidad + whatsapp


CP_ESTADOS = ["Sin cambios", "Con el nombre nuevo", "La (i) de Privacidad y retención", "Un plazo fuera de rango", "Países: la lista",
              "Sumar un país: el aviso de costo", "Sin países", "Otra persona cambió la configuración", "Sin permiso"]


def config_plat_base2():
    cuerpos = []
    for e in CP_ESTADOS:
        base = copia("configplat_conflicto" if e == "Otra persona cambió la configuración" else "configplat")
        i = base.index('<div class="hoja" role="group" aria-label="Límites de uso">')
        t = base[:i] + secciones_ab(e) + base[i:]
        if e in ("Con el nombre nuevo", "Sumar un país: el aviso de costo"):
            t = t.replace('<button type="button" class="b b-pri" disabled="">Guardar cambios</button>',
                          '<button type="button" class="b b-pri">Guardar cambios</button>', 1)
        if e == "Sin permiso":
            t = re.sub(r'<div class="acciones">.*?</div>', '<div class="acciones"></div>', t, count=1, flags=re.S)
            t = re.sub(r'(<input class="in2 "[^>]*?)(>)', r"\1 disabled\2", t)
            t = t.replace('class="in2 " aria-haspopup="listbox"', 'class="in2 " disabled aria-haspopup="listbox"')
        cuerpos.append(alto(t, 1760))
    extra = (".b2-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 18px; }\n"
             ".b2-grid .campo2.ancho { grid-column: 1 / -1; }\n.hoja .b2-grid { margin-top: 4px; }\n")
    return tablero("Config-Plat", "Configuración de la plataforma · nombre y correos, privacidad y retención, y WhatsApp", css() + CSS_CONFIG + extra,
                   por_estado(cuerpos), CP_ESTADOS, 1440, 1760)


# ---------------------------------------------------------------------------------------------------------------- teléfono
def cmp_tel(etiqueta, valor, ayuda=None, unidad=None, error=None, sel=False, abierto_i=False, vacio=False):
    i = info(ayuda, abierto_i, "b2-tip-abajo") if ayuda else ""
    u = f'<span class="u">{unidad}</span>' if unidad else ""
    ct = f'<div class="ct{" sel" if sel else ""}{" err" if error else ""}"{" style=\"color: var(--t3);\"" if vacio else ""}>{valor}</div>'
    err = f'<span class="b2-err" role="alert">{error}</span>' if error else ""
    cuerpo = f'<div class="b2-num">{ct}{u}</div>' if unidad else ct
    return f'<div class="ap-cmp"><span class="rt"><span class="b2-et">{etiqueta}{i}</span></span>{cuerpo}{err}</div>'


M_CP_ESTADOS = ["Sin cambios", "La (i) de Privacidad y retención", "Países: la lista", "Sumar un país: el aviso de costo"]


def m_config_plat_base2():
    base = copia("m_configplat")
    i = base.index('<span class="ap-sec">Límites de uso</span>')
    flecha = re.search(r'<div class="ct">Requiere aprobación(<svg.*?</svg>)</div>', base, re.S).group(1)
    cuerpos = []
    for e in M_CP_ESTADOS:
        paises = "Argentina, Uruguay" if e in ("Sumar un país: el aviso de costo", "Países: la lista") else "Argentina"
        s = ('<span class="ap-sec">Nombre y correos</span><div class="ap-tarj">'
             + cmp_tel("Nombre de la aplicación", "ArquitecturaBase", "Hasta 60 caracteres.")
             + cmp_tel("Nombre del remitente", "ArquitecturaBase", "Hasta 60 caracteres.")
             + cmp_tel("Logo de los correos", "https://", "Vacío, o una dirección que empieza con https://.", vacio=True)
             + '<a class="b2-lnk-tel" href="#">Así llega</a></div>'
             + f'<span class="ap-sec b2-tit-i">Privacidad y retención{info(POLITICA, e == "La (i) de Privacidad y retención", "b2-tip-abajo")}</span><div class="ap-tarj">'
             + cmp_tel("Datos de los ingresos", "12", "De 1 a 120 meses.", "meses")
             + cmp_tel("Códigos y enlaces", "30", "De 1 a 3650 días.", "días")
             + cmp_tel("Invitaciones cerradas", "30", "De 7 a 3650 días.", "días")
             + cmp_tel("Conversaciones del Inicio", "30", "De 1 a 30 días.", "días") + "</div>"
             + f'<span class="ap-sec b2-tit-i">WhatsApp{info(POLITICA)}</span><div class="ap-tarj">'
             + cmp_tel("Países que reciben códigos", paises + flecha, "Solo a números de estos países se mandan códigos por WhatsApp. Cada código se paga.", sel=True)
             + (f'<div class="b2-av" role="status">{SVG_ATEN}<span>{COSTO}</span></div>' if e == "Sumar un país: el aviso de costo" else "")
             + cmp_tel("Guardar los mensajes de los chats", "90", "De 1 a 3650 días.", "días")
             + cmp_tel("Máximo para las organizaciones", "3650", "De 1 a 3650 días.", "días") + "</div>")
        t = base[:i] + s + base[i:]
        if e == "Países: la lista":
            t = con_hoja(t, pk_tel("Países que reciben códigos", [(n, f"Código de país {c}", n in ("Argentina", "Uruguay"), None) for n, c in PAISES],
                                   multiple=True, buscar="", cantidad="12 países habilitados", listo="Listo (2)"))
        cuerpos.append(t)
    extra = (".b2-lnk-tel { display: inline-flex; align-items: center; min-height: 44px; color: var(--marca-tx); font-weight: 600; text-decoration: none; }\n"
             ".b2-num .ct { width: 120px; }\n.b2-num .u { font-size: 16px; }\n.ap-sec.b2-tit-i { display: flex; position: relative; }\n")
    return tablero("M-Config-Plat", "Configuración de la plataforma · teléfono", css(True) + CSS_CONFIG + extra, por_estado(cuerpos),
                   M_CP_ESTADOS, 390, 844)


# ---------------------------------------------------------------------------------------------------------------- WhatsApp de la organización
WC_ESTADOS = ["Sin cambios", "La (i) del plazo", "Fuera de rango", "Más que el máximo de la plataforma", "Otra persona cambió la configuración",
              "Solo lectura"]
AYUDA_CHATS = ("De 1 a 3650 días, y hasta el máximo de la plataforma (3650). Pasado el plazo se borra el texto de los mensajes, también lo que "
               "recibió el asistente. La política de privacidad tiene que prometer este mismo plazo.")
CONFLICTO = "Otra persona cambió la configuración de WhatsApp. Revisá los valores actuales."


def wa_config_cuerpo(e):
    t = copia("waadmin")
    t = una_vez(t, '<a class="w-ln on" href="WA-Admin.dc.html">Números</a>', '<a class="w-ln" href="WA-Admin.dc.html">Números</a>')
    t = una_vez(t, '<a class="w-ln" href="WA-Plantillas.dc.html">Plantillas</a></div>',
                '<a class="w-ln" href="WA-Plantillas.dc.html">Plantillas</a><a class="w-ln on" href="#">Configuración</a></div>')
    t = re.sub(r"Inicio / WhatsApp / Números", "Inicio / Administración / WhatsApp / Configuración", t)
    i = t.index('<div class="w-bnd">')
    j = fin_div(t, t.index('<div class="w-body"'))
    ro = e == "Solo lectura"
    con_cambios = e in ("Fuera de rango", "Más que el máximo de la plataforma")
    acciones = "" if ro else (f'<button type="button" class="cb cb-sec">Descartar cambios</button>'
                              f'<button type="button" class="cb cb-pri"{"" if con_cambios else " disabled"}>Guardar cambios</button>')
    banda = (f'<div class="w-bnd"><div class="iz"><div><h1>Configuración</h1><p class="res">WhatsApp</p></div></div>'
             f'<div class="ac">{acciones}</div></div>')
    valor = {"Fuera de rango": "0", "Más que el máximo de la plataforma": "4000"}.get(e, "90")
    error = {"Fuera de rango": "Tiene que ser de 1 a 3650.",
             "Más que el máximo de la plataforma": "Tiene que ser de 1 a 3650: es el máximo de la plataforma."}.get(e)
    ayuda = info(AYUDA_CHATS, e == "La (i) del plazo", "b2-tip-abajo")
    campo_ = (f'<input class="ct{" err" if error else ""}" type="number" aria-label="Guardar los mensajes de los chats" value="{valor}"'
              f'{" disabled" if ro else ""}>')
    if ro:
        campo_ = f'<span class="b2-env">{campo_}{tip(SIN_PERMISO)}</span>'
    franja = (f'<div class="b2-av" role="alert" style="margin: 0 0 14px;">{SVG_ATEN}<span>{CONFLICTO}</span><a class="acc" href="#">Revisar valores actuales</a></div>'
              if e == "Otra persona cambió la configuración" else "")
    cuerpo = (f'<div class="w-body" style="overflow: auto;">{franja}<div class="w-caja o-abre"><div class="w-cab"><span>Chats</span></div>'
              f'<div class="p-hoja o-col"><div class="o-fila"><div class="w-cmp" style="width: 360px;"><span class="rt b2-et">Guardar los mensajes de los chats{ayuda}</span>'
              f'<div class="b2-num">{campo_}<span class="u">días</span></div>'
              f'{f"<span class=\"b2-err\" role=\"alert\">{error}</span>" if error else ""}</div></div></div></div></div>')
    return t[:i] + banda + cuerpo + t[j:]


def wa_config_base2():
    return tablero("WA-Admin", "Administración · WhatsApp · Configuración (nueva) · el plazo de los chats", css() + CSS_CONFIG,
                   por_estado([wa_config_cuerpo(e) for e in WC_ESTADOS]), WC_ESTADOS, 1440, 900)


M_WC_ESTADOS = ["Sin cambios", "La (i) del plazo", "Fuera de rango"]


def m_wa_config_base2():
    base = copia("m_waadmin")
    base = una_vez(base, "<h1>Números</h1>", "<h1>Configuración</h1>")
    i = base.index('<div class="ap-cuerpo')
    j = fin_div(base, i)
    cuerpos = []
    for e in M_WC_ESTADOS:
        error = "Tiene que ser de 1 a 3650." if e == "Fuera de rango" else None
        s = ('<div class="ap-cuerpo ap-gris" style="padding: 8px 16px 16px;"><span class="ap-sec">Chats</span><div class="ap-tarj">'
             + cmp_tel("Guardar los mensajes de los chats", "0" if error else "90", AYUDA_CHATS, "días", error, abierto_i=e == "La (i) del plazo")
             + "</div></div>")
        fijo = ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button>'
                f'<button type="button" class="cb cb-pri full{"" if error else " apag"}">Guardar cambios</button></div>')
        t = base[:i] + s + fijo + base[j:]
        t = re.sub(r'<a class="ap-fab".*?</a>', "", t, flags=re.S)
        t = re.sub(r'<nav class="ap-nav".*?</nav>', "", t, flags=re.S)
        cuerpos.append(t)
    return tablero("M-WA-Admin", "Configuración de WhatsApp · teléfono", css(True) + CSS_CONFIG
                   + ".b2-num .ct { width: 120px; }\n.b2-num .u { font-size: 16px; }\n", por_estado(cuerpos), M_WC_ESTADOS, 390, 844,
                   otras=["M-Config-Plat", "M-Usuario"])


# ---------------------------------------------------------------------------------------------------------------- el cupo de la IA
VIEJO = "Llegaste a las 50 consultas de hoy. Se renuevan a las 21:00."
CUPO_ORG = "Usaste tus 50 consultas de hoy en Grupo Delta. Vuelven el 24/11/2026, a las 00:00, hora de Grupo Delta."
CUPO_PERFIL = "Usaste tus 50 consultas de hoy. Vuelven el 24/11/2026, a las 00:00, hora de tu perfil."
CADA_ORG = "Cada organización tiene su cupo: en otra podés seguir consultando."


def cupo(t, texto, ayuda=None):
    nuevo = texto + (info(ayuda, False) if ayuda else "")
    return una_vez(t, f"<span>{VIEJO}</span>", f"<span>{nuevo}</span>")


def cupo_abierto(t, texto, ayuda, tel=False):
    return una_vez(t, f"<span>{VIEJO}</span>", f"<span>{texto}{info(ayuda, True, '' if tel else 'b2-tip-der')}</span>")


ASIS = [
    ("Asistente-Org-Base2", "asis_org", "Asistente-Org", "Asistente · organización · el cupo del día", CUPO_ORG, CADA_ORG, False),
    ("M-Asistente-Org-Base2", "m_asis_org", "M-Asistente-Org", "Asistente · organización · el cupo del día · teléfono", CUPO_ORG, CADA_ORG, True),
    ("Asistente-Personal-Base2", "asis_per", "Asistente-Personal", "Asistente · personal · el cupo del día", CUPO_PERFIL, None, False),
    ("M-Asistente-Personal-Base2", "m_asis_per", "M-Asistente-Personal", "Asistente · personal · el cupo del día · teléfono", CUPO_PERFIL, None, True),
    ("Asistente-Plat-Base2", "asis_plat", "Asistente-Plat", "Asistente · Plataforma · el cupo del día", CUPO_PERFIL, None, False),
    ("M-Asistente-Plat-Base2", "m_asis_plat", "M-Asistente-Plat", "Asistente · Plataforma · el cupo del día · teléfono", CUPO_PERFIL, None, True),
]


def asistente(captura, base, titulo, texto, ayuda, tel):
    t = copia(captura)
    if ayuda:
        cuerpos, estados = [cupo(t, texto, ayuda), cupo_abierto(t, texto, ayuda, tel)], ["Tope del día", "Tope del día: cada organización tiene su cupo"]
    else:
        cuerpos, estados = [cupo(t, texto)], ["Tope del día"]
    return tablero(base, titulo, css(tel) + ".as-franja .b2-i .acc-tip { bottom: calc(100% + 6px); }\n", por_estado(cuerpos), estados,
                   390 if tel else 1440, 844 if tel else 900)


# ---------------------------------------------------------------------------------------------------------------- fuera de horario
DIAS = [("Lunes", "09:00 a 18:00"), ("Martes", "09:00 a 18:00"), ("Miércoles", "09:00 a 18:00"), ("Jueves", "09:00 a 18:00"),
        ("Viernes", "09:00 a 18:00"), ("Sábado", "Cerrado"), ("Domingo", "Cerrado")]
ATENCION = [("Abierto", "Atiende en un horario."), ("Cerrado", "No atiende en todo el día.")]


def tabla_dias():
    filas = "".join(f'<div class="b2-dia"><span>{d}</span><span{" class=\"g\"" if h == "Cerrado" else ""}>{h}</span>'
                    f'<button type="button" class="ib" aria-label="Editar {d}">{SVG_LAPIZ}</button></div>' for d, h in DIAS)
    return (f'<div class="b2-dias" role="table" aria-label="Días y horarios de atención"><div class="b2-dia h"><span>Día</span><span>Horario</span>'
            f'<span class="sr">Acciones</span></div>{filas}</div>')


def dialogo_dia(dia, estado, abierta=False):
    cerrado = estado == "Cerrado"
    extra = lista([op(n, d, elegida=n == estado) for n, d in ATENCION]) if abierta else ""
    horas = "" if cerrado else ('<div class="b2-horas"><div class="w-cmp"><span class="rt">Desde</span><div class="ct">09:00</div></div>'
                                '<div class="w-cmp"><span class="rt">Hasta</span><div class="ct">18:00</div></div></div>')
    return ('<div class="w-oscuro b2-2"><div class="w-dlg b2-dlg-dia" role="dialog" aria-label="' + dia + '"><div class="dc"><span>' + dia + '</span>'
            '<button type="button" class="ib" aria-label="Cerrar">✕</button></div><div class="db"><div class="w-cmp" style="grid-column: 1 / -1;">'
            f'<span class="rt">Atención</span>{campo(estado, abierto=abierta, aria="Atención", extra=extra)}</div>'
            f'<div style="grid-column: 1 / -1;">{horas}</div></div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button>'
            '<button type="button" class="cb cb-pri">Listo</button></div></div></div>')


R_ESTADOS = ["Fuera de horario", "Zona horaria: la lista", "Editar un día", "Un día cerrado"]
CSS_DIAS = """
.b2-dias { border: 1px solid var(--borde); border-radius: 3px; font-size: 14px; }
.b2-dia { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) 44px; align-items: center; min-height: 36px; border-top: 1px solid var(--borde); }
.b2-dia:first-child { border-top: 0; }
.b2-dia > span { padding: 0 12px; }
.b2-dia > span + span { box-shadow: inset 1px 0 0 var(--borde); }
.b2-dia.h { background: oklch(0.945 0.027 95); color: var(--t2); font-weight: 600; }
.b2-dia .g { color: var(--t2); }
.b2-dia .ib { justify-self: center; }
.b2-horas { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.b2-2 { z-index: 8 !important; }
.b2-dlg-dia { width: 380px !important; }
"""


def waresp_base2():
    t = copia("waresp_fuera")
    i = t.index("Días y horarios")
    a = t.rindex('<div class="w-cmp"', 0, i)
    b = fin_div(t, a)
    dias = f'<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Días y horarios de atención</span>{tabla_dias()}</div>'
    t = t[:a] + dias + t[b:]
    zona_viejo = re.search(r'<div class="ct">Buenos Aires \(GMT−3\) <svg.*?</svg></div>', t, re.S).group(0)
    cerrada = t.replace(zona_viejo, campo(BA, aria="Zona horaria"))
    abierta = t.replace(zona_viejo, campo(BA, abierto=True, aria="Zona horaria", extra=lista_zonas()))
    cuerpos = [cerrada, abierta, con_dialogo_w(cerrada, dialogo_dia("Lunes", "Abierto", True)),
               con_dialogo_w(cerrada, dialogo_dia("Sábado", "Cerrado"))]
    return tablero("WA-Respuestas", "Bot · «Fuera de horario» con el horario en una tabla y la pieza para elegir", css() + CSS_DIAS,
                   por_estado(cuerpos), R_ESTADOS, 1440, 900)


def m_waresp_base2():
    t = copia("m_waresp_fuera")
    i = t.index("Días y horarios")
    a = t.rindex('<div class="ap-cmp"', 0, i)
    b = fin_div(t, a)
    dias = f'<div class="ap-cmp"><span class="rt"><span>Días y horarios de atención</span></span>{tabla_dias()}</div>'
    t = t[:a] + dias + t[b:]
    zona_viejo = re.search(r'<div class="ct sel">Buenos Aires \(GMT−3\)<svg.*?</svg></div>', t, re.S).group(0)
    t = t.replace(zona_viejo, campo(BA, aria="Zona horaria"))
    lista_t = con_hoja(t, lista_zonas(tel=True))
    dia = con_hoja(t, pk_tel("Atención del lunes", [(n, d, n == "Abierto", None) for n, d in ATENCION]))
    return tablero("M-WA-Respuestas", "Bot · «Fuera de horario» · teléfono", css(True) + CSS_DIAS
                   + ".b2-dia { min-height: 44px; font-size: 15px; }\n.b2-dia .ib { width: 44px; height: 44px; }\n",
                   por_estado([t, lista_t, dia]), ["Fuera de horario", "Zona horaria: la lista", "La atención de un día"], 390, 844)


# ---------------------------------------------------------------------------------------------------------------- la zona horaria
IDIOMAS = [("Español (Argentina)", "Fechas 27/09/2026 y números 1.234,5"), ("Español (España)", "Fechas 27/09/2026 y números 1.234,5"),
           ("English (United States)", "Dates 09/27/2026 and numbers 1,234.5")]


def con_zona_compu(t, abierta=None):
    viejo = re.search(r'<div class="ct ?">Buenos Aires \(GMT−3\) <svg.*?</svg></div>', t, re.S).group(0)
    idioma = re.search(r'<div class="ct ?">Español \(Argentina\) <svg.*?</svg></div>', t, re.S).group(0)
    t = t.replace(viejo, campo(BA, abierto=abierta == "zona", aria="Zona horaria", extra=lista_zonas() if abierta == "zona" else ""))
    return t.replace(idioma, campo("Español (Argentina)", abierto=abierta == "idioma", aria="Idioma",
                                   extra=lista([op(n, d, elegida=n.startswith("Español (A")) for n, d in IDIOMAS]) if abierta == "idioma" else ""))


Z_ESTADOS = ["La zona horaria, cerrada", "La zona horaria, abierta", "Buscar una zona", "El idioma, abierto"]


def sin_botones_en_filas(t):
    """Mi cuenta: «Verificar» y «Vincular» dejan de ir como texto en la fila y pasan a su ⋮ (261)."""
    t = re.sub(r'<a class="cb cb-enl" href="Cuenta-Verificar.dc.html"[^>]*>Verificar</a>', "", t)
    keb = re.search(r'<button type="button" class="ib"[^>]*aria-label="Acciones de 011 15-5555-4521"[^>]*>.*?</button>', t, re.S)
    return t.replace('<button type="button" class="cb cb-sec ch">Vincular</button>',
                     keb.group(0).replace("Acciones de 011 15-5555-4521", "Acciones de Google"))


def zona_compu(captura, base, titulo):
    t = copia(captura)
    if captura == "cuenta":
        t = sin_botones_en_filas(t)
    buscar = con_zona_compu(t, "zona").replace('<span class="ph">Buscar</span>', "<span>montev</span>").replace("418 zonas", "1 zona")
    buscar = re.sub(r'<div class="ops">.*?</div>(?=</div>)', lambda m: '<div class="ops">' + op("Montevideo", "hora de Uruguay · GMT−3", activa=True) + "</div>",
                    buscar, count=1, flags=re.S)
    return tablero(base, titulo, css(), por_estado([con_zona_compu(t), con_zona_compu(t, "zona"), buscar, con_zona_compu(t, "idioma")]),
                   Z_ESTADOS, 1440, 900)


def zona_tel(captura, base, titulo, etiqueta):
    t = copia(captura)
    viejo = re.search(r'<div class="ct">Buenos Aires \(GMT−3\)<svg.*?</svg></div>', t, re.S).group(0)
    t = t.replace(viejo, campo(BA, aria=etiqueta))
    return tablero(base, titulo, css(True), por_estado([t, con_hoja(t, lista_zonas(tel=True))]),
                   ["La zona horaria, cerrada", "La zona horaria, abierta"], 390, 844)


TABLEROS = [
    ("Config-Plat-Base2", config_plat_base2), ("M-Config-Plat-Base2", m_config_plat_base2),
    ("WA-Config-Base2", wa_config_base2), ("M-WA-Config-Base2", m_wa_config_base2),
    ("WA-Respuestas-Base2", waresp_base2), ("M-WA-Respuestas-Base2", m_waresp_base2),
    ("Cuenta-Base2", lambda: zona_compu("cuenta", "Cuenta", "Mi cuenta · la zona horaria y el idioma en la pieza · /cuenta")),
    ("M-Cuenta-Base2", lambda: zona_tel("m_cuenta", "M-Cuenta", "Mi cuenta · la zona horaria · teléfono", "Zona horaria")),
    ("Configuracion-Base2", lambda: zona_compu("configuracion", "Configuracion", "Configuración · la zona horaria y el idioma en la pieza · /org/configuracion")),
    ("M-Configuracion-Base2", lambda: zona_tel("m_configuracion", "M-Configuracion", "Configuración · la zona horaria · teléfono",
                                               "Zona horaria predeterminada")),
] + [(n, (lambda a=a: asistente(*a[1:]))) for n, *_ in ASIS for a in [next(x for x in ASIS if x[0] == n)]]


def main(solo=None):
    hechos = []
    for nombre, hacer in TABLEROS:
        if solo and nombre not in solo:
            continue
        escribir(nombre, hacer())
        hechos.append(nombre)
    return hechos


if __name__ == "__main__":
    import sys
    main(sys.argv[1:] or None)
