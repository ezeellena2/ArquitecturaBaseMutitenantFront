"""Plataforma › WhatsApp (Etapa 11, ADR 0038), aprobado pantalla por pantalla desde el 2026-10-03.
Decidido (A): el número de la plataforma solo atiende consultas, además de mandar códigos, invitaciones y avisos.
«WhatsApp» en el menú va directo a la bandeja, con su contador y sin panel; Administración › WhatsApp lleva Número, Bot,
Equipos y Plantillas. Sin Contactos ni Difusiones: quien escribe ya tiene su cuenta.
- Plat-WA-Chats: la bandeja «Consultas», copiada de WA-Chats, sin Clientes e Internos y con «Ver la cuenta».
Cada tablero nace de su par de la organización y se rehace entero cada vez."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def svg(d, w=18, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


GESTION = svg('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/>'
              '<rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>')
ESCUDO = svg('<path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z"/>')
SALIR = svg('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/>', 16)


def rep(t, a, b, n=1):
    assert t.count(a) == n, (a[:90], t.count(a))
    return t.replace(a, b)


def shell_plataforma(t, migas, activo_wa=True, panel=""):
    """Cambia el menú lateral de la organización (con el panel de WhatsApp) por el de Plataforma, y el usuario por el operador."""
    ini = t.index('<aside class="w-sb"')
    fin = t.index('<div class="w-co">')
    flecha = re.search(r'<span class="fl">(<svg.*?</svg>)</span>', t[ini:fin], flags=re.S).group(1)
    wa = re.search(r'href="WA-Chats\.dc\.html">(<svg.*?</svg>) WhatsApp', t[ini:fin], flags=re.S).group(1)
    sb = ('<aside class="w-sb" aria-label="Menú principal"><div class="w-mk"><span class="brand" style="width: 28px; height: 28px; border-radius: 8px;"></span>ArquitecturaBase</div>'
          '<div class="w-cx"><b>Plataforma</b><span>Administración del servicio</span></div><nav class="w-nav">'
          f'<a class="w-ln" href="Organizaciones.dc.html">{GESTION} Gestión <span class="fl">{flecha}</span></a>'
          f'<a class="w-ln{" on" if activo_wa else ""}" href="Plat-WA-Chats.dc.html">{wa} WhatsApp<span class="cnt">2</span></a></nav>'
          f'<div class="w-esp"></div><div class="w-abajo"><a class="w-ln{"" if activo_wa else " on"}" href="Auditoria-Plat.dc.html">{ESCUDO} Administración <span class="fl">{flecha}</span></a></div>'
          '<div class="w-us"><span class="w-av">M</span><span class="tx"><b>Martín Sosa</b><span>martin.sosa@arquitecturabase.ejemplo.com</span></span></div></aside>')
    t = t[:ini] + sb + panel + t[fin:]
    # Barra de arriba: migas y el menú del operador (sin perfiles de persona).
    i = t.index('<header class="w-tb">')
    j = t.index("</header>", i) + len("</header>")
    abajo = re.search(r'<summary class="um"[^>]*>.*?(<svg.*?</svg>)</summary>', t[i:j], flags=re.S).group(1)
    tb = (f'<header class="w-tb"><span>{migas}</span><details class="w-umd"><summary class="um" aria-label="Abrir tu menú"><span class="w-av">M</span>'
          f'<span class="tx"><b>Martín Sosa</b><span>Plataforma</span></span>{abajo}</summary><div class="w-mn" role="menu" aria-label="Menú de Martín Sosa">'
          '<div class="w-mn-cab"><span class="w-av" style="width: 36px; height: 36px; font-size: 15px;">M</span><span class="w-mn-perf"><b>Martín Sosa</b>'
          '<span class="s">martin.sosa@arquitecturabase.ejemplo.com</span></span></div><div class="w-mn-sep" role="separator"></div>'
          f'<a class="w-mn-it" role="menuitem" href="Ingreso.dc.html">{SALIR} Salir</a></div></details></header>')
    return t[:i] + tb + t[j:]


def conv(ini, nombre, hora, mensaje, equipo, quien, nuevo=False, on=False, numero=False):
    av = f'<span class="w-av g">{ini}</span>' if numero else f'<span class="w-av">{ini}</span>'
    punto = '<span class="w-punto" aria-label="Sin leer"></span>' if nuevo else ""
    clase = " on" if on else (" nuevo" if nuevo else " ")
    return (f'<div class="w-conv{clase}">{av}<span class="tx"><span class="l1"><b>{nombre}</b><span>{hora}</span></span>'
            f'<span class="l2"><span>{mensaje}</span>{punto}</span><span class="l3{" sin" if quien == "Sin tomar" else ""}">{equipo} · {quien}</span></span></div>')


def chats():
    t = (PROJ / "WA-Chats.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", "<title>Plataforma › WhatsApp › Consultas</title>", t, count=1, flags=re.S)
    t = shell_plataforma(t, "Plataforma / WhatsApp")
    t = rep(t, "<h1>Chats</h1><p class=\"res\">5 conversaciones · 2 sin tomar</p>", "<h1>Consultas</h1><p class=\"res\">4 conversaciones · 2 sin tomar</p>")
    # Una sola bandeja: sin «Clientes | Internos».
    i = t.index('<div class="o-seg" role="tablist" aria-label="Bandeja">')
    t = t[:i] + t[t.index("</div>", i) + len("</div>"):]
    numero = re.search(r'<span class="w-av g">(<svg.*?</svg>)</span>', t, flags=re.S).group(1)
    ini = t.index('<div class="w-conv on">')
    fin = t.index('</div><div class="w-hilo">')
    t = t[:ini] + (conv("LF", "Lucía Fernández", "10:42", "Por correo, a lucia.fer@gmail.com. Ya pedí dos.", "Soporte", "Martín Sosa", on=True)
                   + conv(numero, "+54 9 351 555-0192", "10:15", "¿Cómo registro mi empresa?", "Altas", "Sin tomar", nuevo=True, numero=True)
                   + conv("BR", "Beto Ramírez", "Ayer", "Nos suspendieron Beta S.R.L., ¿qué hacemos?", "Soporte", "Sin tomar", nuevo=True)
                   + conv("JP", "Julio Pérez", "Ayer", "Gracias, ya pude entrar.", "Soporte", "Laura Díaz")) + t[fin:]
    # La conversación: quien escribe tiene su cuenta y el operador la abre desde «Ver la cuenta».
    i = t.index('<div class="w-hilo"><div class="hc">')
    j = t.index('<div class="w-escr">', i)
    kebab = re.search(r'<button type="button" class="ib" aria-label="Acciones de Martina López">(<svg.*?</svg>)</button>', t[i:j], flags=re.S).group(1)
    hilo = ('<div class="w-hilo"><div class="hc"><span class="w-av">LF</span><span class="tx"><b>Lucía Fernández</b><span>+54 9 11 5555-4521 · Vinculada a su cuenta</span></span>'
            '<span class="acc"><a class="cb cb-sec ch" href="Cuenta-Plat.dc.html">Ver la cuenta</a><span class="cb cb-sec ch">Pasar</span>'
            f'<button type="button" class="ib" aria-label="Acciones de Lucía Fernández">{kebab}</button></span></div><div class="w-msjs"><span class="w-dia">Hoy</span>\n'
            '<div class="w-m ent"><span class="gl">Hola, no me llega el código para entrar.</span><span class="pie">10:39</span></div>\n'
            '<div class="w-m sal"><span class="gl">Hola, gracias por escribir a ArquitecturaBase. ¿En qué te ayudamos?<span class="bt">Ver opciones</span></span>'
            '<span class="pie">Respuesta automática · 10:39</span></div>\n'
            '<div class="w-m ent"><span class="gl">Hablar con alguien</span><span class="pie">10:40</span></div>\n'
            '<span class="o-sis">Eligió «Hablar con alguien» · pasó a Soporte</span>\n<span class="o-sis">Martín Sosa tomó la conversación</span>\n'
            '<div class="w-m sal"><span class="gl">Hola, Lucía. ¿El código te llega por correo o por WhatsApp?</span><span class="pie">Martín Sosa · 10:41</span></div>\n'
            '<div class="w-m ent"><span class="gl">Por correo, a lucia.fer@gmail.com. Ya pedí dos.</span><span class="pie">10:42</span></div></div>')
    t = t[:i] + hilo + t[j:]
    assert "Grupo Delta" not in t[t.index("</helmet>"):], "quedó algo de la organización"
    (PROJ / "Plat-WA-Chats.dc.html").write_text(t, encoding="utf-8")
    print("ok Plat-WA-Chats")


def panel_admin(t, activo):
    """El panel de Administración de Plataforma, con WhatsApp como grupo: Número, Bot, Equipos y Plantillas (sale del de la organización)."""
    ini = t.index('<aside class="w-panel"')
    fin = t.index("</aside>", ini) + len("</aside>")
    p = t[ini:fin]
    iconos = dict(re.findall(r'href="(Auditoria-Org|Configuracion)\.dc\.html">(<svg.*?</svg>)', p, flags=re.S))
    grupo = re.search(r'(<span class="w-ln grupo">.*?</span></span>)', p, flags=re.S).group(1)
    hijos = [("Número", "Plat-WA-Numero"), ("Bot", "Plat-WA-Bot"), ("Equipos", "Plat-WA-Equipos"), ("Plantillas", "Plat-WA-Plantillas")]
    legal = svg('<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4a.5.5 0 0 1 .5-.5z"/><path d="M14 3.5V8h4"/><path d="M9 12h6M9 15.5h6"/>')
    nuevo = ('<aside class="w-panel" aria-label="Administración"><div class="pc">Administración</div><nav class="w-nav">'
             f'<a class="w-ln" href="Auditoria-Plat.dc.html">{iconos["Auditoria-Org"]} Auditoría</a>'
             f'<a class="w-ln" href="Legales.dc.html">{legal} Documentos legales</a>'
             f'<a class="w-ln" href="Config-Plat.dc.html">{iconos["Configuracion"]} Configuración</a>'
             f'{grupo}<div class="w-hijos">'
             + "".join(f'<a class="w-ln{" on" if n == activo else ""}" href="{h}.dc.html">{n}</a>' for n, h in hijos)
             + "</div></nav></aside>")
    return nuevo


def tweak(t, prop, opciones):
    props = json.dumps({prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}}, ensure_ascii=False, separators=(",", ":"))
    vals = "".join(f"      e{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(opciones))
    t = rep(t, "data-props='{\"$preview\"", "data-props='" + props[:-1] + ",\"$preview\"")
    return rep(t, "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}",
               "class Component extends DCLogic {\n  renderVals() {\n"
               f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n\n    return {{\n      si: true,\n      no: false,\n{vals}    }};\n  }}\n}}")


def estados(pantallas):
    return "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{p}</sc-if>' for i, p in enumerate(pantallas) if p)


NUMERO_CSS = """<style data-vuelta="1004-Plat-WA-Numero">
.p-ic { color: var(--t3); display: inline-flex; width: 18px; justify-content: center; }
.o-der { display: inline-flex; align-items: center; gap: 12px; }
.o-gris { font-size: 13px; color: var(--t3); }
.w-it .dato b.grande { font-size: 15px; }
</style>"""


def numero():
    """Plat-WA-Numero: el número de la plataforma en filas (no una tabla de una fila), con lo que hace.
    Estados: conectado, falta medio de pago (ⓘ abre el aviso) y sin número."""
    t = (PROJ / "WA-Admin-Pago.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", "<title>Plataforma › Administración › WhatsApp › Número</title>", t, count=1, flags=re.S)
    t = shell_plataforma(t, "Plataforma / WhatsApp / Número", activo_wa=False, panel=panel_admin(t, "Número"))
    wa = re.search(r'<span class="ic">(<svg.*?</svg>)</span>', t, flags=re.S).group(1)
    kebab = re.search(r'aria-label="Acciones de \+54 9 11 5555-0100">(<svg.*?</svg>)</button>', t, flags=re.S).group(1)
    info = re.search(r'<button type="button" class="o-i"[^>]*>(<svg.*?</svg>)</button>', t, flags=re.S).group(1)
    mas = re.search(r'<button type="button" class="cb cb-pri">(<svg.*?</svg>) Conectar número</button>', t, flags=re.S).group(1)
    dlg_ini = t.index('<div class="w-oscuro">')
    dialogo = t[dlg_ini:t.index("</x-dc>")].rstrip()
    dialogo = dialogo[:-len("</div>")]  # sin el cierre de w-app
    dialogo = (dialogo.replace("+54 9 351 555-0200 no puede responder", "+54 9 11 4000-1000 no puede mandar mensajes")
               .replace("Sin medio de pago, Meta no deja mandar mensajes", "Los códigos y los avisos salen solo por correo"))
    t = t[:t.index('<div class="w-bnd">')]

    def banda(res, accion=""):
        return f'<div class="w-bnd"><div class="iz"><span class="ic">{wa}</span><div><h1>Número</h1><p class="res">{res}</p></div></div><div class="ac">{accion}</div></div>'

    def cuerpo(estado):
        fila_num = (f'<div class="w-it"><span class="p-ic">{wa}</span><span class="dato"><b class="grande">+54 9 11 4000-1000</b><span>ArquitecturaBase · desde el 12/01/2026</span></span>'
                    f'<span class="o-der">{estado}<button type="button" class="ib" aria-label="Acciones de +54 9 11 4000-1000">{kebab}</button></span></div>')
        hace = ('<div class="w-it"><span class="dato"><b>Códigos, invitaciones y avisos de la cuenta</b><span>11.900 mensajes este mes</span></span><span class="o-gris">Siempre</span></div>'
                '<div class="w-it"><span class="dato"><b>Consultas</b><span>580 de 1.000 gratis este mes</span></span>'
                '<span class="w-sw" role="switch" aria-checked="true" aria-label="Atiende consultas"></span></div>')
        return (f'<div class="w-body"><div class="w-caja"><div class="w-cab"><span>Número</span></div>{fila_num}</div>'
                f'<div class="w-caja"><div class="w-cab"><span>Qué hace</span></div>{hace}</div></div>')

    conectado = banda("Conectado") + cuerpo('<span class="w-est ">Conectado</span>')
    sin_pago = banda('<span style="color: var(--peligro);">Falta medio de pago</span>') + cuerpo(
        f'<span><span class="w-est mal">Falta medio de pago</span><button type="button" class="o-i" aria-label="Por qué no puede mandar mensajes">{info}</button></span>')
    sin_numero = (banda("Sin número", f'<button type="button" class="cb cb-pri">{mas} Conectar número</button>')
                  + '<div class="w-body"><div class="w-caja"><div class="vacio"><strong>Todavía no hay un número conectado</strong></div></div></div>')
    t += estados([conectado, sin_pago, sin_numero]) + "</div>" + f'<sc-if value="{{{{e1}}}}" hint-placeholder-val="{{{{no}}}}">{dialogo}</sc-if>' + "</div>\n"
    t += (PROJ / "WA-Admin-Pago.dc.html").read_text(encoding="utf-8")[(PROJ / "WA-Admin-Pago.dc.html").read_text(encoding="utf-8").index("</x-dc>"):]
    t = t.replace("</helmet>", NUMERO_CSS + "\n</helmet>", 1)
    t = tweak(t, "estado", ["Conectado", "Falta medio de pago", "Sin número"])
    assert "Grupo Delta" not in t[t.index("</helmet>"):], "quedó algo de la organización"
    (PROJ / "Plat-WA-Numero.dc.html").write_text(t, encoding="utf-8")
    print("ok Plat-WA-Numero")


BOT_CSS = """<style data-vuelta="1004-Plat-WA-Bot">
.o-gris { font-size: 13px; color: var(--t3); }
.o-flujo .o-col1 { display: flex; flex-direction: column; align-items: center; }
</style>"""
MENU_BOT = [("1", "Entrar a mi cuenta", "Manda el enlace para entrar", True), ("2", "No me llega el código", "Pasa a Soporte", False),
            ("3", "Registrar mi empresa", "Pasa a Altas", False), ("4", "Hablar con alguien", "Pasa a Soporte", False)]


def bot_base(fuente, titulo):
    t = (PROJ / f"{fuente}.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t, count=1, flags=re.S)
    t = shell_plataforma(t, "Plataforma / WhatsApp / Bot", activo_wa=False, panel=panel_admin(t, "Bot"))
    # Un solo número: sin el selector de número.
    i = t.index('<div class="w-caja o-fb">')
    t = t[:i] + t[t.index("</div>", i) + len("</div>"):]
    t = t.replace('href="WA-Respuestas.dc.html"', 'href="Plat-WA-Bot.dc.html"').replace('href="WA-Bot-Recorrido.dc.html"', 'href="Plat-WA-Bot-Recorrido.dc.html"')
    return t.replace("</helmet>", BOT_CSS + "\n</helmet>", 1)


def bot():
    """Plat-WA-Bot: el menú del número de la plataforma. La opción 1 manda el enlace para entrar (el bot de ingreso de la
    Etapa 8): es del sistema, no se borra. Sin «Además»: nada de promociones ni de mensajes de empleados."""
    t = bot_base("WA-Respuestas", "Plataforma › Administración › WhatsApp › Bot")
    i = t.index('<div class="w-caja"><div class="w-cab"><span>Menú</span>')
    j = t.index('<div class="w-caja"><div class="w-cab"><span>Además</span>')
    menu = t[i:j]
    cab = menu[:menu.index('<div class="w-it">')]
    kebab = re.search(r'aria-label="Acciones de Consultar un pedido">(<svg.*?</svg>)</button>', menu, flags=re.S).group(1)
    filas = "".join(f'<div class="w-it"><span class="num">{n}</span><span class="dato"><b>{a}</b><span>{b}</span></span>'
                    + ('<span class="o-gris">Del sistema</span>' if sis else "")
                    + f'<button type="button" class="ib" aria-label="Acciones de {a}">{kebab}</button></div>' for n, a, b, sis in MENU_BOT)
    fin_ademas = t.index("</div></div></div></div>", j)  # cierre de la caja «Además» y del cuerpo
    t = t[:i] + cab + filas + "</div>" + t[fin_ademas + len("</div>"):]
    assert "Grupo Delta" not in t[t.index("</helmet>"):] and "Además" not in t[t.index("</helmet>"):]
    (PROJ / "Plat-WA-Bot.dc.html").write_text(t, encoding="utf-8")
    print("ok Plat-WA-Bot")


def recorrido():
    """Plat-WA-Bot-Recorrido: sin la pregunta «¿Es un empleado?»; del menú salen el enlace para entrar y los equipos."""
    t = bot_base("WA-Bot-Recorrido", "Plataforma › Administración › WhatsApp › Bot · recorrido")
    i = t.index('<div class="o-flujo">')
    j = t.index("</div></div></div></div></div></div>", i)
    ramas = "".join(f'<div class="o-rama"><span class="o-rot">{n}</span><div class="o-nodo {c}"><b>{a}</b><span>{b}</span></div></div>'
                    for n, a, b, c in (("1", "Enlace para entrar", "Lo manda el bot", ""), ("2", "Soporte", "Equipo", "eq"),
                                       ("3", "Altas", "Equipo", "eq"), ("4", "Soporte", "Equipo", "eq")))
    flujo = ('<div class="o-flujo"><div class="o-col1"><div class="o-nodo ini"><b>Llega un mensaje</b></div><div class="o-lin"></div>'
             '<div class="o-nodo "><b>Bienvenida</b><span>o «Fuera de horario»</span></div><div class="o-lin"></div>'
             f'<div class="o-nodo sel"><b>Menú</b><span>4 opciones</span></div><div class="o-ramas">{ramas}</div></div></div>')
    t = t[:i] + flujo + t[j + len("</div></div></div>"):]
    assert "Grupo Delta" not in t[t.index("</helmet>"):] and "empleado" not in t[t.index("</helmet>"):]
    (PROJ / "Plat-WA-Bot-Recorrido.dc.html").write_text(t, encoding="utf-8")
    print("ok Plat-WA-Bot-Recorrido")


EQUIPOS = [("Soporte", "Martín Sosa, Laura Díaz", "2 operadores", "A los 10 minutos"), ("Altas", "Laura Díaz", "1 operador", "A los 30 minutos")]


def equipos():
    """Plat-WA-Equipos: los equipos de operadores que atienden las consultas. Una sola bandeja: sin «Bandeja» en la lista ni en
    «Crear equipo». Estados: la lista y «Crear equipo»."""
    t = (PROJ / "WA-Equipos-Crear.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", "<title>Plataforma › Administración › WhatsApp › Equipos</title>", t, count=1, flags=re.S)
    t = shell_plataforma(t, "Plataforma / WhatsApp / Equipos", activo_wa=False, panel=panel_admin(t, "Equipos"))
    t = rep(t, '<p class="res">4 equipos</p>', '<p class="res">2 equipos</p>')
    t = t.replace('href="WA-Equipos-Crear.dc.html"', 'href="#"')
    t = rep(t, "<span>Personas</span>", "<span>Operadores</span>")
    kebab = re.search(r'aria-label="Acciones de Ventas">(<svg.*?</svg>)</button>', t, flags=re.S).group(1)
    i = t.index('<div class="w-tr e">')
    j = t.index('<div class="w-oscuro">') - len("</div></div></div>")  # después de la última fila: cierres de caja, cuerpo y w-co
    assert t[j:j + len("</div></div></div>")] == "</div></div></div>"
    filas = "".join(f'<div class="w-tr e"><span><b>{n}</b></span><span class="dos"><b style="font-weight: 400;">{p}</b><span>{c}</span></span><span>{a}</span>'
                    f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{kebab}</button></span></div>'
                    for n, p, c, a in EQUIPOS)
    t = t[:i] + filas + t[j:]
    # «Crear equipo», solo en su estado: sin «Bandeja» y con operadores.
    d_ini = t.index('<div class="w-oscuro">')
    d_fin = t.index("</div>\n</x-dc>")  # el diálogo termina justo antes del cierre de w-app
    dlg = t[d_ini:d_fin]
    dlg = re.sub(r'<div class="w-cmp"><span class="rt">Bandeja .*?</div></div>', "", dlg, count=1, flags=re.S)
    dlg = (dlg.replace('<div class="ct">Soporte · Delta Sur</div>', '<div class="ct">Cuentas</div>')
           .replace('<div class="w-cmp"><span class="rt">Nombre', '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Nombre', 1)
           .replace("Personas <span", "Operadores <span").replace("Carolina Vega, Paula Méndez", "Martín Sosa"))
    assert "Bandeja" not in dlg and "Cuentas" in dlg
    t = t[:d_ini] + f'<sc-if value="{{{{e1}}}}" hint-placeholder-val="{{{{no}}}}">{dlg}</sc-if>' + t[d_fin:]
    t = tweak(t, "estado", ["Lista", "Crear equipo"])
    cuerpo = t[t.index("</helmet>"):]
    assert "Grupo Delta" not in cuerpo and "Bandeja" not in cuerpo
    (PROJ / "Plat-WA-Equipos.dc.html").write_text(t, encoding="utf-8")
    print("ok Plat-WA-Equipos")


# Las del sistema salen de docs/operations/whatsapp-plantillas.md (Etapa 8): nombre visible, nombre en Meta y categoría.
SISTEMA = [("Código de ingreso", "codigo_ingreso", "Autenticación"), ("Invitación a una organización", "invitacion_organizacion", "Utilidad"),
           ("Aviso de método de ingreso", "aviso_metodo_ingreso", "Utilidad"), ("Revisá tus métodos de ingreso", "revisa_metodos_ingreso", "Utilidad"),
           ("Baja pedida", "baja_cuenta_pedida", "Utilidad"), ("Baja cancelada", "baja_cuenta_cancelada", "Utilidad"),
           ("Cuenta eliminada", "cuenta_eliminada", "Utilidad"), ("Recuperación recibida", "recuperacion_recibida", "Utilidad"),
           ("Recuperación aprobada", "recuperacion_aprobada", "Utilidad"), ("Recuperación rechazada", "recuperacion_rechazada", "Utilidad")]
CONSULTAS = [("Seguimos tu consulta", "Español (Argentina)", "Utilidad", "", "Aprobada", "28/09/2026"),
             ("Tu organización ya está activa", "Español (Argentina)", "Utilidad", "rev", "En revisión", "02/10/2026")]


def plantillas():
    """Plat-WA-Plantillas: dos tablas, en pestañas. «Para consultas», las que crean los operadores para escribir pasadas las
    24 horas; «Del sistema», las de la Etapa 8 (código, invitación y avisos de la cuenta), que no se borran: su ⋮ solo deja ver el texto."""
    t = (PROJ / "WA-Plantillas.dc.html").read_text(encoding="utf-8")
    t = re.sub(r"<title>.*?</title>", "<title>Plataforma › Administración › WhatsApp › Plantillas</title>", t, count=1, flags=re.S)
    t = shell_plataforma(t, "Plataforma / WhatsApp / Plantillas", activo_wa=False, panel=panel_admin(t, "Plantillas"))
    t = rep(t, '<p class="res">4 plantillas · 2 aprobadas</p>', '<p class="res">12 plantillas · 11 aprobadas</p>')
    t = t.replace('href="WA-Plantilla-Nueva.dc.html"', 'href="#"')
    kebab = re.search(r'aria-label="Acciones de Pedido listo">(<svg.*?</svg>)</button>', t, flags=re.S).group(1)
    i = t.index('<div class="w-body">')
    j = t.index("</div></div></div></div>", t.index("Promo semanal", i)) + len("</div></div></div></div>") - len("</div>")  # sin el cierre de w-co

    def tabla(filas):
        th = '<div class="w-th t"><span>Plantilla</span><span>Tipo</span><span>Estado en Meta</span><span>Última modificación</span><span class="sr">Acciones</span></div>'
        return f'<div class="w-caja">{th}{filas}</div>'

    def fila(n, sub, tipo, clase, est, fecha):
        return (f'<div class="w-tr t"><span class="dos"><b>{n}</b><span>{sub}</span></span><span>{tipo}</span><span><span class="w-est {clase}">{est}</span></span>'
                f'<span>{fecha}</span><span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{kebab}</button></span></div>')

    def tabs(activa):
        a, b = ("on", "") if activa == 0 else ("", "on")
        return (f'<div class="o-tabs" role="tablist"><span class="{a}" role="tab">Para consultas <span class="c">2</span></span>'
                f'<span class="{b}" role="tab">Del sistema <span class="c">10</span></span></div>')

    consultas = tabla("".join(fila(*c) for c in CONSULTAS))
    sistema = tabla("".join(fila(n, f"{m} · Español e inglés", tipo, "", "Aprobada", "15/09/2026") for n, m, tipo in SISTEMA))
    cuerpo = ('<div class="w-body" style="overflow: auto;">'
              + estados([tabs(0) + consultas, tabs(1) + sistema]) + "</div>")
    t = t[:i] + cuerpo + t[j:]
    t = t.replace("</helmet>", '<style data-vuelta="1004-Plat-WA-Plantillas">\n'
                  ".o-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--borde); flex-shrink: 0; }\n"
                  ".o-tabs > span { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; }\n"
                  ".o-tabs > span.on { color: var(--marca-tx); border-bottom-color: var(--marca); }\n"
                  ".o-tabs .c { margin-left: 6px; font-size: 12px; font-weight: 600; color: var(--t3); }\n</style>\n</helmet>", 1)
    t = tweak(t, "pestana", ["Para consultas", "Del sistema"])
    cuerpo_t = t[t.index("</helmet>"):]
    assert "Grupo Delta" not in cuerpo_t and "Promo semanal" not in cuerpo_t
    (PROJ / "Plat-WA-Plantillas.dc.html").write_text(t, encoding="utf-8")
    print("ok Plat-WA-Plantillas")


TABLEROS = [("Plat-WA-Chats", "WhatsApp › Consultas · /plataforma/whatsapp", 0, 3260),
            ("Plat-WA-Numero", "Administración › WhatsApp › Número", 1520, 3260),
            ("Plat-WA-Bot", "Administración › WhatsApp › Bot", 3040, 3260),
            ("Plat-WA-Bot-Recorrido", "Administración › WhatsApp › Bot · recorrido", 4560, 3260),
            ("Plat-WA-Equipos", "Administración › WhatsApp › Equipos", 6080, 3260),
            ("Plat-WA-Plantillas", "Administración › WhatsApp › Plantillas", 7600, 3260)]


def lienzo():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for nombre, titulo, x, y in TABLEROS:
        clave = f"{nombre}.dc.html"
        datos = {"x": x, "y": y, "w": 1440, "h": 900, "title": titulo, "page": "plataforma", "is_interactive": True}
        if clave in c["boards"]:
            c["boards"][clave].update(datos)
        else:
            c["boards"][clave] = datos
            c["order"].append(clave)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8", newline="")


if __name__ == "__main__":
    lienzo()
    chats()
    numero()
    bot()
    recorrido()
    equipos()
    plantillas()
