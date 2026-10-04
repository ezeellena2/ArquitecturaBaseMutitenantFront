"""Plataforma › WhatsApp en el teléfono (Etapa 11), en formato app, con lo aprobado en la compu el 2026-10-03: solo consultas.
La barra de abajo de Plataforma lleva «Consultas» en lugar de «Chats», y «Más» lleva WhatsApp (Número, Bot, Equipos, Plantillas)
sin Contactos ni Difusiones (eso lo cambia telefonos_1004/app_plat_personal.py). Pantallas:
- M-Plat-WA-Chats (la bandeja) y M-Plat-WA-Conversacion (con «Ver la cuenta» en el ⋮);
- M-Plat-WA-Numero (conectado, falta medio de pago, sin número);
- M-Plat-WA-Bot (configuración y recorrido), M-Plat-WA-Equipos (lista y crear) y M-Plat-WA-Plantillas (para consultas y del sistema).
Corre después de plat_personal_telefonos_1004.py y antes de las reglas finales. Se rehace entero cada vez."""
import json
import pathlib
import re
import runpy
import sys

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
T = GEN / "telefonos_1004"
sys.path.insert(0, str(T))
from app_estilo import ESTILO_X  # noqa: E402
from app_marco import I, SALIDA, barra, estado, fab, hoja, pagina, svg  # noqa: E402

A = runpy.run_path(str(T / "app_todas.py"))  # conv, cbar, m, item, campo, kebab y el resto de las piezas de los teléfonos de WhatsApp
P = runpy.run_path(str(T / "app_plat_personal.py"))
conv, cbar, m, item, campo, kebab, acc = (A[k] for k in ("conv", "cbar", "m", "item", "campo", "kebab", "acc"))
nav_plat = P["nav_plat"]
SW, CH, ESCR, ABAJO = A["SW"], A["CH"], A["ESCR"], A["ABAJO"]
PLAT_M = {"Organizaciones": "M-Organizaciones", "Organizacion": "M-Organizacion", "Cuentas": "M-Cuentas", "Cuenta": "M-Cuenta-Plat",
          "Recuperaciones": "M-Recuperaciones", "Mas": "M-Mas-Plat", "Auditoria": "M-Auditoria-Plat", "Legales": "M-Legales", "Config": "M-Config-Plat"}
ADM = "Administración · WhatsApp"
VOLVER = "T-Plat-Mas.dc.html"
ESTILO = """<style data-vuelta="1004-plat-wa-tel">
.ap-gris-t { font-size: 13.5px; color: var(--t3); flex-shrink: 0; }
.ap-fijo .cb.full { padding: 0 10px; min-width: 0; }
</style>"""


def tweak(t, prop, opciones):
    props = json.dumps({prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}}, ensure_ascii=False, separators=(",", ":"))
    vals = "".join(f"      e{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(opciones))
    viejo = ("data-props='{\"$preview\":{\"width\":390,\"height\":844}}'>\nclass Component extends DCLogic {\n  renderVals() {\n"
             "    return { si: true, no: false };\n  }\n}")
    nuevo = ("data-props='" + props[:-1] + ",\"$preview\":{\"width\":390,\"height\":844}}'>\nclass Component extends DCLogic {\n  renderVals() {\n"
             f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n\n    return {{\n      si: true,\n      no: false,\n{vals}    }};\n  }}\n}}")
    assert t.count(viejo) == 1
    return t.replace(viejo, nuevo)


def armar(nombre, titulo, pantallas, prop=None, opciones=None):
    if prop:
        cuerpo = "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}"><div class="ap" style="position: absolute; inset: 0;">{p}</div></sc-if>'
                         for i, p in enumerate(pantallas))
    else:
        cuerpo = pantallas[0]
    pagina(f"T-{nombre}", cuerpo, ESTILO_X + "\n" + ESTILO, titulo)
    t = (SALIDA / f"T-{nombre}.dc.html").read_text(encoding="utf-8")
    if prop:
        t = tweak(t, prop, opciones)
    t = re.sub(r"T-Plat-(\w+)\.dc\.html", lambda x: f"{PLAT_M[x.group(1)]}.dc.html", t)
    assert "T-Plat-" not in t and "T-App-" not in t, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    print("ok", nombre)


# ---------- Consultas ----------
CHATS = [("LF", "Lucía Fernández", "Por correo, a lucia.fer@gmail.com. Ya pedí dos.", "10:42", False, "Soporte · Martín Sosa", False, "M-Plat-WA-Conversacion.dc.html"),
         ("", "+54 9 351 555-0192", "¿Cómo registro mi empresa?", "10:15", True, "Altas · Sin tomar", True, "#"),
         ("BR", "Beto Ramírez", "Nos suspendieron Beta S.R.L., ¿qué hacemos?", "Ayer", True, "Soporte · Sin tomar", True, "#"),
         ("JP", "Julio Pérez", "Gracias, ya pude entrar.", "Ayer", False, "Soporte · Laura Díaz", False, "#")]
armar("M-Plat-WA-Chats", "Consultas · teléfono", [estado() + barra("Consultas", "Plataforma", acc(("lupa", "Buscar"), ("filtro", "Filtros")))
                                                  + '<div class="ap-cuerpo">' + "".join(conv(*c) for c in CHATS) + "</div>" + nav_plat("consultas")])

CONV = ('<div class="ap-chat"><span class="ap-dia">Hoy</span>'
        + m("ent", "Hola, no me llega el código para entrar.", "10:39")
        + m("sal", "Hola, gracias por escribir a ArquitecturaBase. ¿En qué te ayudamos?", "Respuesta automática · 10:39", "Ver opciones")
        + m("ent", "Hablar con alguien", "10:40")
        + '<span class="ap-sis">Eligió «Hablar con alguien» · pasó a Soporte</span><span class="ap-sis">Martín Sosa tomó la conversación</span>'
        + m("sal", "Hola, Lucía. ¿El código te llega por correo o por WhatsApp?", "Martín Sosa · 10:41")
        + m("ent", "Por correo, a lucia.fer@gmail.com. Ya pedí dos.", "10:42") + "</div>")
CAB = cbar("LF", "Lucía Fernández", "Vinculada a su cuenta", volver="M-Plat-WA-Chats.dc.html")
MENU = '<div class="ap-menu" role="menu"><span role="menuitem">Ver la cuenta</span><span role="menuitem">Pasar</span></div>'
armar("M-Plat-WA-Conversacion", "Consultas · conversación · teléfono", [estado() + CAB + CONV + ESCR, estado() + CAB + CONV + ESCR + MENU],
      "estado", ["Conversación", "Menú de la conversación"])

# ---------- Número ----------
WA = I["wa"]


def numero_body(est, extra_i=""):
    return ('<div class="ap-cuerpo ap-gris"><span class="ap-gtit">Número</span><div class="ap-grupo">'
            + item("+54 9 11 4000-1000", f"{est}{extra_i} · desde el 12/01/2026", der=kebab("+54 9 11 4000-1000"))
            + '</div><span class="ap-gtit">Qué hace</span><div class="ap-grupo">'
            + item("Códigos, invitaciones y avisos de la cuenta", "11.900 mensajes este mes", der='<span class="ap-gris-t">Siempre</span>')
            + item("Consultas", "580 de 1.000 gratis este mes", der=SW) + "</div></div>")


INFO = f'<button type="button" class="ap-i" aria-label="Por qué no puede mandar mensajes">{I["info"]}</button>'
AVISO = hoja("+54 9 11 4000-1000 no puede mandar mensajes",
             '<div class="ap-sug" style="margin: 0; background: oklch(0.96 0.03 25);"><p style="color: oklch(0.42 0.16 25);"><b>Falta medio de pago en Meta</b><br>'
             'Los códigos y los avisos salen solo por correo</p></div>'
             '<div class="ap-lst"><span class="tit">Qué podés hacer</span><span class="it">1. Entrá a tu WhatsApp Manager de Meta</span>'
             '<span class="it">2. Agregá un medio de pago a la cuenta</span><span class="it">3. Volvé acá y tocá «Comprobar»</span></div>',
             '<button type="button" class="cb cb-sec">Comprobar</button><button type="button" class="cb cb-pri">Ir a Meta</button>')
SIN_NUM = ('<div class="ap-cuerpo" style="align-items: center; justify-content: center; gap: 16px; padding: 0 32px 80px; text-align: center;">'
           f'<span style="width: 72px; height: 72px; border-radius: 50%; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center;">{A["WA_GRANDE"]}</span>'
           '<b style="font-size: 17px; font-weight: 600;">Todavía no hay un número conectado</b></div>')
BAR_NUM = estado() + barra("Número", ADM, volver=VOLVER)
armar("M-Plat-WA-Numero", "Número · teléfono", [
    BAR_NUM + numero_body('<span class="w-est">Conectado</span>') + nav_plat("mas"),
    BAR_NUM + numero_body('<span class="w-est mal">Falta medio de pago</span>', INFO) + nav_plat("mas") + AVISO,
    BAR_NUM + SIN_NUM + fab("Conectar número") + nav_plat("mas"),
], "estado", ["Conectado", "Falta medio de pago", "Sin número"])

# ---------- Bot ----------
BOT_CAB = estado() + barra("Bot", ADM, volver=VOLVER)
OPC = [("1", "Entrar a mi cuenta", "Manda el enlace para entrar", True), ("2", "No me llega el código", "Pasa a Soporte", False),
       ("3", "Registrar mi empresa", "Pasa a Altas", False), ("4", "Hablar con alguien", "Pasa a Soporte", False)]
BOT_CONF = (BOT_CAB + A["TABS_BOT"](0) + '<div class="ap-cuerpo ap-gris">'
            + '<span class="ap-gtit">Respuestas automáticas</span><div class="ap-grupo">'
            + item("Bienvenida", "La primera vez que alguien escribe", der=SW) + item("Fuera de horario", "Lunes a viernes, de 9 a 18", der=SW) + "</div>"
            + '<span class="ap-gtit">Menú<a href="#">Agregar opción</a></span><div class="ap-grupo">'
            + "".join(item(t, s, izq=f'<span class="num">{n}</span>', der=('<span class="ap-gris-t">Del sistema</span>' if sis else "") + CH) for n, t, s, sis in OPC)
            + '</div><div style="height: 16px;"></div></div>' + nav_plat("mas"))
REC = ('<div class="ap-rec">'
       '<div class="ap-n"><span class="pt">1</span><div class="cj"><b>Llega un mensaje</b></div></div>'
       '<div class="ap-n"><span class="pt">2</span><div class="cj"><b>Bienvenida</b><span>o «Fuera de horario»</span></div></div>'
       '<div class="ap-n"><span class="pt">3</span><div class="cj"><b>Menú</b><span>4 opciones</span><div class="ap-rama">'
       '<span class="r"><span class="et">1</span>Enlace para entrar<span class="d">Lo manda el bot</span></span>'
       '<span class="r"><span class="et">2</span>Soporte<span class="d">Equipo</span></span>'
       '<span class="r"><span class="et">3</span>Altas<span class="d">Equipo</span></span>'
       '<span class="r"><span class="et">4</span>Soporte<span class="d">Equipo</span></span></div></div></div></div>')
armar("M-Plat-WA-Bot", "Bot · teléfono", [BOT_CONF, BOT_CAB + A["TABS_BOT"](1) + f'<div class="ap-cuerpo ap-gris">{REC}</div>' + nav_plat("mas")],
      "pestana", ["Configuración", "Recorrido"])

# ---------- Equipos ----------
EQ = [("Soporte", "A los 10 min", "Martín Sosa, Laura Díaz", "2 operadores"), ("Altas", "A los 30 min", "Laura Díaz", "1 operador")]


def equipo(n, aviso, ops, l3):
    return (f'<div class="ap-fila"><div class="tx"><span class="l1">{n}<span>Aviso {aviso.lower()}</span></span><span class="l2">{ops}</span>'
            f'<span class="l3">{l3}</span></div>{kebab(n)}</div>')


EQUIPOS = (estado() + barra("Equipos", ADM, volver=VOLVER) + '<div class="ap-cuerpo">' + "".join(equipo(*e) for e in EQ) + "</div>"
           + fab("Crear equipo") + nav_plat("mas"))
CREAR = hoja("Crear equipo", campo("Nombre", "Cuentas") + campo("Operadores", "Martín Sosa", flecha=True)
             + campo("Aviso por correo si nadie lo toma", "A los 10 minutos", req=False, flecha=True),
             '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Crear equipo</button>')
armar("M-Plat-WA-Equipos", "Equipos · teléfono", [EQUIPOS, EQUIPOS + CREAR], "estado", ["Lista", "Crear equipo"])

# ---------- Plantillas ----------
CONS = [("Seguimos tu consulta", "28/09/2026", "Utilidad · Español (Argentina)", "", "Aprobada"),
        ("Tu organización ya está activa", "02/10/2026", "Utilidad · Español (Argentina)", "amb", "En revisión")]
SIS = [("Código de ingreso", "codigo_ingreso", "Autenticación"), ("Invitación a una organización", "invitacion_organizacion", "Utilidad"),
       ("Aviso de método de ingreso", "aviso_metodo_ingreso", "Utilidad"), ("Revisá tus métodos de ingreso", "revisa_metodos_ingreso", "Utilidad"),
       ("Baja pedida", "baja_cuenta_pedida", "Utilidad"), ("Baja cancelada", "baja_cuenta_cancelada", "Utilidad"),
       ("Cuenta eliminada", "cuenta_eliminada", "Utilidad"), ("Recuperación recibida", "recuperacion_recibida", "Utilidad"),
       ("Recuperación aprobada", "recuperacion_aprobada", "Utilidad"), ("Recuperación rechazada", "recuperacion_rechazada", "Utilidad")]
TABS_PL = lambda on: ('<div class="ap-tabs" role="tablist"><span' + (' class="on"' if on == 0 else "") + ' role="tab">Para consultas <span class="c">2</span></span><span'
                      + (' class="on"' if on == 1 else "") + ' role="tab">Del sistema <span class="c">10</span></span></div>')
PL_CAB = estado() + barra("Plantillas", ADM, volver=VOLVER)
armar("M-Plat-WA-Plantillas", "Plantillas · teléfono", [
    PL_CAB + TABS_PL(0) + '<div class="ap-cuerpo">' + "".join(A["plantilla"](*x) for x in CONS) + "</div>" + fab("Nueva plantilla") + nav_plat("mas"),
    PL_CAB + TABS_PL(1) + '<div class="ap-cuerpo">' + "".join(A["plantilla"](n, "15/09/2026", f"{mn} · {tipo}", "", "Aprobada") for n, mn, tipo in SIS) + "</div>"
    + fab("Nueva plantilla") + nav_plat("mas"),
], "pestana", ["Para consultas", "Del sistema"])

PANTALLAS = [("M-Plat-WA-Chats", "Consultas · teléfono", 4700), ("M-Plat-WA-Conversacion", "Consultas · conversación · teléfono", 5170),
             ("M-Plat-WA-Numero", "Número · teléfono", 5640), ("M-Plat-WA-Bot", "Bot · teléfono", 6110),
             ("M-Plat-WA-Equipos", "Equipos · teléfono", 6580), ("M-Plat-WA-Plantillas", "Plantillas · teléfono", 7050)]


def lienzo():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for nombre, titulo, x in PANTALLAS:
        clave = f"{nombre}.dc.html"
        datos = {"h": 844, "is_interactive": True, "page": "plataforma", "title": titulo, "w": 390, "x": x, "y": 2300}
        if clave in c["boards"]:
            c["boards"][clave].update(datos)
        else:
            c["boards"][clave] = datos
            c["order"].append(clave)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8", newline="")


lienzo()
