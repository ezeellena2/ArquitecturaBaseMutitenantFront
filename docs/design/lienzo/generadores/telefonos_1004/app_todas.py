"""Todos los teléfonos de WhatsApp en el marco de app (2026-10-03). Respeta lo aprobado pantalla por pantalla y decide el resto
con los mismos criterios: hojas desde abajo, «+» flotante, ⋮ solo con acciones, filas de tres líneas, acción principal fija abajo."""
from app_estilo import ESTILO_X
from app_marco import I, barra, estado, fab, hoja, nav, pagina, svg

ENVIAR = svg('<path d="M4.5 12 19.5 4.5 15 19.5l-3.5-6z"/><path d="m11.5 13.5 8-9"/>', 22, "1.9")
NOTA = svg('<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/><path d="M8.5 12h7"/><path d="M8.5 16h5"/>', 22)
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 22, "2.2")
RELOJ = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 18, "2")
CHEV = svg('<path d="m9 6 6 6-6 6"/>', 18, "2")
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 18, "2")
BAJAR = svg('<path d="M12 4.5v10"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>', 16, "2")
OK = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 20, "2.4")
SALIR = svg('<path d="M14 5h4v14h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>', 20)


def acc(*claves):
    return "".join(f'<button type="button" class="ap-ib" aria-label="{e}">{I[c]}</button>' for c, e in claves)


def campo(rotulo, valor, req=True, extra="", flecha=False, area=False):
    rq = ' <span class="rq">*</span>' if req else ""
    f = ABAJO if flecha else ""
    return (f'<div class="ap-cmp"><span class="rt"><span>{rotulo}{rq}</span>{extra}</span>'
            f'<div class="ct{" area" if area else ""}">{valor}{f}</div></div>')


def seg(a, b, on=0):
    return f'<div class="ap-seg2"><span{" class=\"on\"" if on == 0 else ""}>{a}</span><span{" class=\"on\"" if on == 1 else ""}>{b}</span></div>'


def kebab(nombre):
    return f'<button type="button" class="ap-ib" aria-label="Acciones de {nombre}">{I["kebab"]}</button>'


def p(nombre, contenido, titulo):
    pagina(nombre, contenido, ESTILO_X, f"{titulo} · teléfono")


# ---------- Chats ----------
def conv(ini, nombre, prev, hora, nuevo, l3, sin, href="#"):
    av = f'<span class="w-av{"" if ini else " g"}">{ini or I["wa"]}</span>'
    punto = '<span class="w-punto" aria-label="Sin leer"></span>' if nuevo else ""
    return (f'<a class="w-conv{" nuevo" if nuevo else ""}" href="{href}">{av}<span class="tx"><span class="l1"><b>{nombre}</b><span>{hora}</span></span>'
            f'<span class="l2"><span>{prev}</span>{punto}</span><span class="l3{" sin" if sin else ""}">{l3}</span></span></a>')


CHATS = [("ML", "Martina López", "2 cajas de tornillos. ¿Atienden hasta las 18?", "10:42", False, "Ventas · Lucía Fernández", False, "T-App-Conversacion.dc.html"),
         ("", "+54 9 351 555-0192", "Quiero hacer un pedido.", "10:15", True, "Ventas · Sin tomar", True, "T-App-SinTomar.dc.html"),
         ("FD", "Federico Díaz", "¿Siguen abiertos el sábado?", "Ayer", True, "Soporte · Sin tomar", True, "#"),
         ("JP", "Javier Pereyra", "Perfecto, gracias.", "Ayer", False, "Soporte · Tomás Acosta", False, "T-App-24h.dc.html"),
         ("CR", "Carla Ruiz", "Vos: Te esperamos.", "Lunes", False, "Ventas · Lucía Fernández", False, "#"),
         ("LM", "Laura Méndez", "¿Tienen envío a domicilio?", "Lunes", False, "Ventas · Carolina Vega", False, "#")]
p("T-App-Chats", estado() + barra("Chats", "Grupo Delta", acc(("lupa", "Buscar"), ("filtro", "Filtros")))
  + '<div class="ap-seg" role="tablist" aria-label="Bandeja"><span class="on" role="tab">Clientes <span class="c">5</span></span><span role="tab">Internos <span class="c">2</span></span></div>'
  + '<div class="ap-cuerpo">' + "".join(conv(*c) for c in CHATS) + "</div>" + nav("chats"), "Chats")

# ---------- Conversación ----------
def cbar(ini, nombre, sub, sin=False, volver="T-App-Chats.dc.html"):
    av = f'<span class="w-av{"" if ini else " g"}">{ini or I["wa"]}</span>'
    return (f'<div class="ap-cbar"><a class="ap-ib" aria-label="Volver" href="{volver}">{I["volver"]}</a>{av}'
            f'<span class="tx"><b>{nombre}</b><span{" class=\"sin\"" if sin else ""}>{sub}</span></span>{kebab(nombre)}</div>')


def m(lado, texto, pie, boton=""):
    bt = f'<span class="bt">{boton}</span>' if boton else ""
    return f'<div class="ap-m {lado}"><span class="gl">{texto}{bt}</span><span class="pie">{pie}</span></div>'


BOT = m("sal", "Hola, gracias por escribir a Grupo Delta. ¿En qué te ayudamos?", "Respuesta automática · 10:39", "Ver opciones")
CONV = ('<div class="ap-chat"><span class="ap-dia">Hoy</span>'
        + m("ent", "Hola, buen día. Quiero hacer un pedido.", "10:39") + BOT + m("ent", "Hacer un pedido", "10:40")
        + '<span class="ap-sis">Eligió «Hacer un pedido» · pasó a Ventas</span><span class="ap-sis">Lucía Fernández tomó la conversación</span>'
        + m("sal", "Hola, Martina. ¿Qué te gustaría pedir?", "Lucía Fernández · 10:41")
        + m("ent", "2 cajas de tornillos. ¿Atienden hasta las 18?", "10:42"))
ESCR = (f'<div class="ap-escr"><button type="button" class="ap-red nt" aria-label="Nota interna" aria-pressed="false">{NOTA}</button>'
        f'<span class="campo">Mensaje</span><button type="button" class="ap-red env" aria-label="Enviar">{ENVIAR}</button></div>')
CAB_ML = cbar("ML", "Martina López", "Vinculada a su cuenta · Mayorista")
p("T-App-Conversacion", estado() + CAB_ML + CONV + "</div>" + ESCR, "Conversación")
MENU_CONV = '<div class="ap-menu" role="menu"><span role="menuitem">Pasar</span><span role="menuitem">Ver ficha del contacto</span></div>'

# ---------- Sin tomar (menú abierto) ----------
SIN = ('<div class="ap-chat"><span class="ap-dia">Hoy</span>' + m("ent", "Hola, quiero hacer un pedido.", "10:14")
       + m("sal", "Hola, gracias por escribir a Grupo Delta. ¿En qué te ayudamos?", "Respuesta automática · 10:14", "Ver opciones")
       + m("ent", "Hacer un pedido", "10:15") + '<span class="ap-sis">Eligió «Hacer un pedido» · pasó a Ventas</span></div>')
p("T-App-SinTomar", estado() + cbar("", "+54 9 351 555-0192", "Sin tomar · Ventas", True) + SIN + ESCR
  + '<div class="ap-menu" role="menu"><span role="menuitem">Tomar</span><span role="menuitem">Pasar</span><span role="menuitem">Ver ficha del contacto</span></div>',
  "Chat sin tomar")

# ---------- Pasar ----------
PASAR = hoja("Pasar a", '<div class="ap-lst" role="menu"><span class="tit">Equipos</span>'
             '<span class="it" role="menuitem">Soporte<span>2 personas</span></span><span class="it" role="menuitem">Atención general<span>3 personas</span></span>'
             '<span class="tit">Personas de Ventas</span><span class="it" role="menuitem">Carolina Vega<span>3 chats tomados</span></span>'
             '<span class="it" role="menuitem">Diego Ramos<span>1 chat tomado</span></span></div>')
p("T-App-Pasar", estado() + CAB_ML + CONV + "</div>" + ESCR + PASAR, "Pasar")

# ---------- Nota interna ----------
NOTA_TX = '<div class="ap-nota"><span class="q">Nota interna · Lucía Fernández · 10:43</span>Es mayorista: confirmar precio con Carolina antes de responder.</div>'
ESCR_NOTA = (f'<div class="ap-escr"><button type="button" class="ap-red nt on" aria-label="Nota interna" aria-pressed="true">{NOTA}</button>'
             f'<span class="campo nota">Nota para el equipo</span><button type="button" class="ap-red gua" aria-label="Guardar nota">{TILDE}</button></div>')
p("T-App-Nota", estado() + CAB_ML + CONV + NOTA_TX + "</div>" + ESCR_NOTA, "Nota interna")

# ---------- 24 horas ----------
ESCR_24 = (f'<div class="ap-escr"><button type="button" class="ap-red nt" aria-label="Nota interna" aria-pressed="false">{NOTA}</button>'
           f'<span class="ap-24">{RELOJ} Pasaron 24 horas<button type="button" class="ap-i" aria-label="Qué significa">{I["info"]}</button></span>'
           '<a class="ap-pill" href="T-App-Plantilla.dc.html">Elegir plantilla</a></div>')
CONV_AYER = CONV.replace('<span class="ap-dia">Hoy</span>', '<span class="ap-dia">Ayer</span>', 1)
p("T-App-24h", estado() + CAB_ML + CONV_AYER + "</div>" + ESCR_24, "Pasaron 24 horas")

# ---------- Elegir plantilla ----------
PLANT = hoja("Mandar plantilla",
             campo("Plantilla", "Pedido listo · Utilidad", flecha=True) + campo("Nombre", "Martina") + campo("Número de pedido", "1043")
             + '<div class="ap-burb">Hola <b>Martina</b>, tu pedido <b>1043</b> está listo. Podés retirarlo en el local de 9 a 18.</div>'
             + '<span class="ap-costo">Costo estimado: US$ 0,02</span>',
             '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Mandar</button>')
p("T-App-Plantilla", estado() + CAB_ML + CONV_AYER + "</div>" + ESCR_24 + PLANT, "Elegir plantilla")

# ---------- Contactos ----------
CONT = [("ML", "Martina López", "+54 9 11 5555-4521 · Vinculada", "Mayorista · ", "", "Acepta", "Hoy"),
        ("", "+54 9 351 555-0192", "", "", "off", "Sin respuesta", "Hoy"),
        ("FD", "Federico Díaz", "+54 9 11 5555-2087", "Minorista · ", "off", "No acepta", "Ayer"),
        ("JP", "Javier Pereyra", "+54 9 11 5555-7310 · Vinculado", "Mayorista · ", "", "Acepta", "Ayer"),
        ("CR", "Carla Ruiz", "+54 9 11 5555-1146", "", "baja", "Se dio de baja", "29/09"),
        ("LM", "Laura Méndez", "+54 9 11 5555-3378", "Minorista · ", "", "Acepta", "28/09"),
        ("SG", "Sergio Gómez", "+54 9 11 5555-9021", "", "off", "No acepta", "25/09")]


def contacto(ini, nombre, l2, etq, cl, promo, ult):
    av = f'<span class="w-av{"" if ini else " g"}">{ini or I["wa"]}</span>'
    linea2 = f'<span class="l2"><span>{l2}</span></span>' if l2 else ""
    return (f'<a class="w-conv" href="T-App-Ficha.dc.html">{av}<span class="tx"><span class="l1"><b>{nombre}</b><span>{ult}</span></span>'
            f'{linea2}<span class="l3">{etq}<span class="w-est {cl}">{promo}</span></span></span></a>')


IMPORTAR_BTN = '<button type="button" class="ap-txt">Importar</button>'
CONTACTOS = (estado() + barra("Contactos", "Grupo Delta", acc(("lupa", "Buscar"), ("filtro", "Filtros")) + IMPORTAR_BTN)
             + '<div class="ap-cuerpo">' + "".join(contacto(*c) for c in CONT) + "</div>" + nav("contactos"))
p("T-App-Contactos", CONTACTOS, "Contactos")

# ---------- Importar ----------
IMP = hoja("Importar contactos",
           campo("Archivo", 'clientes-mayoristas.xlsx<span style="color: var(--marca-tx); font-weight: 600; font-size: 15px;">Cambiar</span>',
                 extra=f'<a class="ej" href="#">{BAJAR} Descargar ejemplo</a>')
           + campo("Etiqueta para todos", "Mayorista", req=False, flecha=True),
           '<button type="button" class="cb cb-sec" style="flex: 0 0 auto; padding: 0 20px;">Cancelar</button><button type="button" class="cb cb-pri">Importar 48 contactos</button>')
p("T-App-Importar", CONTACTOS + IMP, "Importar contactos")

# ---------- Ficha del contacto ----------
FICHA_FILAS = ('<a class="ap-fila" href="T-App-Conversacion.dc.html"><div class="tx"><span class="l1">Hoy<span>8 mensajes</span></span>'
               '<span class="l2">Quiero hacer un pedido.</span><span class="l3">Ventas · Lucía Fernández</span></div></a>'
               '<div class="ap-fila"><div class="tx"><span class="l1">12/09/2026<span>9 mensajes</span></span>'
               '<span class="l2">Hola, ¿cómo hago para pedir una factura?</span><span class="l3">Soporte · Tomás Acosta</span></div></div>')
p("T-App-Ficha", estado() + barra("", "", kebab("Martina López"), volver="T-App-Contactos.dc.html")
  + '<div class="ap-perfil"><span class="w-av">ML</span><h2>Martina López</h2><p>+54 9 11 5555-4521 · Vinculada a su cuenta<br>Mayorista · Acepta promociones</p></div>'
  + '<div class="ap-tabs" role="tablist"><span class="on" role="tab">Conversaciones <span class="c">2</span></span><span role="tab">Difusiones <span class="c">3</span></span></div>'
  + f'<div class="ap-cuerpo">{FICHA_FILAS}</div>'
  + '<div class="ap-fijo"><a class="cb cb-pri full" href="T-App-Conversacion.dc.html">Abrir chat</a></div>', "Ficha del contacto")

# ---------- Difusiones ----------
DIF = [("20 % en empanadas", "25/09/2026", "Promo semanal · Minorista · 124 contactos", "", "Enviada", "118 entregados · 86 leídos", "T-App-Resultados.dc.html"),
       ("Horario de fiestas", "20/12 09:00", "Aviso de horario · Los que aceptan · 312 contactos", "prog", "Programada", "", "#"),
       ("Nuevos productos", "02/09/2026", "Novedades · Mayorista · 48 contactos", "", "Enviada", "47 entregados · 40 leídos", "#")]


def difusion(nombre, fecha, l2, cl, est, res, href):
    l3 = f'<span class="w-est {cl}">{est}</span>' + (f" · {res}" if res else "")
    return (f'<a class="ap-fila" href="{href}"><div class="tx"><span class="l1">{nombre}<span>{fecha}</span></span>'
            f'<span class="l2">{l2}</span><span class="l3">{l3}</span></div></a>')


p("T-App-Difusiones", estado() + barra("Difusiones", "Grupo Delta", acc(("lupa", "Buscar"), ("filtro", "Filtros")))
  + '<div class="ap-cuerpo">' + "".join(difusion(*d) for d in DIF) + "</div>" + fab("Nueva difusión", "T-App-DifusionNueva.dc.html") + nav("difusiones"),
  "Difusiones")

# ---------- Nueva difusión ----------
p("T-App-DifusionNueva", estado() + barra("Nueva difusión", "Borrador", volver="T-App-Difusiones.dc.html")
  + '<div class="ap-cuerpo" style="padding: 4px 20px 0; gap: 14px;">'
  + campo("Nombre", "Horario de fiestas") + campo("Plantilla", "Aviso de horario · Marketing", flecha=True)
  + f'<div class="ap-cmp"><span class="rt"><span>Destinatarios <span class="rq">*</span></span></span>{seg("Los que aceptan", "Una etiqueta", 1)}</div>'
  + campo("Etiqueta", "Mayorista", flecha=True)
  + f'<div class="ap-cmp"><span class="rt"><span>Cuándo</span></span>{seg("Ahora", "Programar", 1)}</div>'
  + campo("Fecha y hora", "20/12/2026 09:00", req=False, flecha=True)
  + '<span class="ap-gtit" style="margin: 6px 0 -4px;">Vista previa</span>'
  + '<div class="ap-burb" style="align-self: flex-start; border-top-right-radius: 14px; border-top-left-radius: 4px;">Hola Martina, te contamos el horario de fiestas de Grupo Delta: el 24 y el 31 atendemos de 9 a 13. Te esperamos.<span class="bt">No recibir más</span></div>'
  + "</div>"
  + '<div class="ap-fijo"><span class="costo"><b>48 contactos · US$ 2,97</b><span>Costo estimado</span></span><button type="button" class="cb cb-pri">Programar</button></div>',
  "Nueva difusión")

# ---------- Resultados ----------
RES = [("LM", "Laura Méndez", "+54 9 11 5555-3378", "", "Respondió", "25/09 10:12"),
       ("FD", "Federico Díaz", "+54 9 11 5555-2087", "", "Leído", "25/09 09:48"),
       ("CR", "Carla Ruiz", "+54 9 11 5555-1146", "baja", "Se dio de baja", "25/09 09:40"),
       ("SG", "Sergio Gómez", "+54 9 11 5555-9021", "off", "Entregado", "25/09 09:31"),
       ("", "+54 9 11 5555-6650", "", "mal", "No llegó", "25/09 09:30")]


def resultado(ini, nombre, num, cl, est, hora):
    av = f'<span class="w-av{"" if ini else " g"}">{ini or I["wa"]}</span>'
    l2 = f'<span class="l2"><span>{num}</span></span>' if num else ""
    i = f'<button type="button" class="ap-i" aria-label="Por qué no llegó">{I["info"]}</button>' if cl == "mal" else ""
    return (f'<div class="w-conv">{av}<span class="tx"><span class="l1"><b>{nombre}</b><span>{hora}</span></span>'
            f'{l2}<span class="l3"><span class="w-est {cl}">{est}</span>{i}</span></span></div>')


NUMS = [("124", "Mandados"), ("118", "Entregados"), ("86", "Leídos"), ("12", "Respondieron"), ("2", "Se dieron de baja"), ("6", "No llegaron")]
p("T-App-Resultados", estado() + barra("20 % en empanadas", "25/09 · Promo semanal · Minorista", acc(("lupa", "Buscar")) + kebab("la difusión"),
                                       volver="T-App-Difusiones.dc.html")
  + '<div class="ap-chips" role="tablist" aria-label="Filtrar por estado">'
  + "".join(f'<span{" class=\"on\"" if i == 0 else ""} role="tab"><b>{n}</b><i>{l}</i></span>' for i, (n, l) in enumerate(NUMS)) + "</div>"
  + '<div class="ap-cuerpo" style="border-top: 1px solid var(--borde);">' + "".join(resultado(*r) for r in RES) + "</div>" + nav("difusiones"),
  "Resultados de una difusión")

# ---------- Sin números (A: el «+» de siempre) ----------
WA_GRANDE = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>', 34, "1.6")
p("T-App-SinNumeros", estado() + barra("Números", "Administración · WhatsApp", volver="T-App-Mas.dc.html")
  + '<div class="ap-cuerpo" style="align-items: center; justify-content: center; gap: 16px; padding: 0 32px 80px; text-align: center;">'
  + f'<span style="width: 72px; height: 72px; border-radius: 50%; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center;">{WA_GRANDE}</span>'
  + '<b style="font-size: 17px; font-weight: 600;">Todavía no hay números conectados.</b></div>' + fab("Conectar número") + nav("mas"), "Números · sin números")

# ---------- Bot · Configuración ----------
def item(tx, sub="", izq="", der="", href=None, clase=""):
    tag, attr = ("a", f' href="{href}"') if href else ("div", "")
    s = f"<span>{sub}</span>" if sub else ""
    return f'<{tag} class="ap-it {clase}"{attr}>{izq}<span class="tx"><b>{tx}</b>{s}</span>{der}</{tag}>'


SW = '<span class="ap-sw" role="switch" aria-checked="true"></span>'
CH = f'<span class="chev">{CHEV}</span>'
BOT_CAB = (estado() + barra("Bot", "Administración · WhatsApp", volver="T-App-Mas.dc.html")
           + f'<div class="ap-selnum">+54 9 11 5555-0100 · Toda la organización{ABAJO}</div>')
TABS_BOT = lambda on: ('<div class="ap-tabs" role="tablist"><span' + (' class="on"' if on == 0 else "") + ' role="tab">Configuración</span><span'
                       + (' class="on"' if on == 1 else "") + ' role="tab">Recorrido</span></div>')
OPC = [("1", "Hacer un pedido", "Pasa a Ventas"), ("2", "Consultar un pedido", "Pasa a Soporte"),
       ("3", "Horarios y dirección", "Contesta: «Estamos en Av. Corrientes 1234, de 9 a 18»"), ("4", "Hablar con alguien", "Pasa a Atención general")]
BOT_CONF = (BOT_CAB + TABS_BOT(0) + '<div class="ap-cuerpo ap-gris">'
            + '<span class="ap-gtit">Respuestas automáticas</span><div class="ap-grupo">'
            + item("Bienvenida", "La primera vez que alguien escribe", der=SW) + item("Fuera de horario", "Lunes a viernes, de 9 a 18", der=SW) + "</div>"
            + '<span class="ap-gtit">Menú<a href="#">Agregar opción</a></span><div class="ap-grupo">'
            + "".join(item(t, s, izq=f'<span class="num">{n}</span>', der=CH, href="T-App-BotOpcion.dc.html" if n == "1" else None) for n, t, s in OPC) + "</div>"
            + '<span class="ap-gtit">Además</span><div class="ap-grupo">'
            + item("Preguntar por promociones", "Al terminar la primera conversación", der=SW)
            + item("Ofrecer vincular su cuenta", "Si el número es de una persona registrada", der=SW)
            + item("Mensajes de empleados", "Pasan a Carga de pedidos, sin menú", der=CH) + "</div><div style=\"height: 16px;\"></div></div>"
            + nav("mas"))
p("T-App-Bot", BOT_CONF, "Bot · configuración")

# ---------- Bot · Recorrido ----------
REC = ('<div class="ap-rec">'
       '<div class="ap-n"><span class="pt">1</span><div class="cj"><b>Llega un mensaje</b></div></div>'
       '<div class="ap-n"><span class="pt q">?</span><div class="cj"><b>¿Es un empleado?</b><span>Su número está en una cuenta de la organización</span>'
       '<div class="ap-rama"><span class="r"><span class="et">Sí</span>Carga de pedidos<span class="d">Internos</span></span></div></div></div>'
       '<div class="ap-n"><span class="pt">2</span><div class="cj"><b>Bienvenida</b><span>o «Fuera de horario»</span></div></div>'
       '<div class="ap-n"><span class="pt">3</span><div class="cj"><b>Menú</b><span>4 opciones</span><div class="ap-rama">'
       '<span class="r"><span class="et">1</span>Ventas<span class="d">Equipo</span></span>'
       '<span class="r"><span class="et">2</span>Soporte<span class="d">Equipo</span></span>'
       '<span class="r"><span class="et">3</span>Horarios y dirección<span class="d">Contesta</span></span>'
       '<span class="r"><span class="et">4</span>Atención general<span class="d">Equipo</span></span></div></div></div></div>')
p("T-App-BotRecorrido", BOT_CAB + TABS_BOT(1) + f'<div class="ap-cuerpo ap-gris">{REC}</div>' + nav("mas"), "Bot · recorrido")

# ---------- Editar opción ----------
OPCION = hoja("Editar opción 1",
              campo("Texto de la opción", "Hacer un pedido")
              + f'<div class="ap-cmp"><span class="rt"><span>Qué hace</span></span>{seg("Pasa a un equipo", "Contesta un texto", 0)}</div>'
              + campo("Equipo", "Ventas", flecha=True),
              '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button>')
p("T-App-BotOpcion", BOT_CONF + OPCION, "Bot · editar opción")

# ---------- Equipos ----------
EQ = [("Ventas", "A los 10 min", "Lucía Fernández, Carolina Vega", "Clientes · 2 personas"),
      ("Soporte", "A los 15 min", "Tomás Acosta, Paula Méndez", "Clientes · 2 personas"),
      ("Atención general", "A los 10 min", "Lucía Fernández, Tomás Acosta, Martín Paz", "Clientes · 3 personas"),
      ("Carga de pedidos", "A los 30 min", "Martín Paz", "Internos · 1 persona")]


def equipo(n, aviso, personas, l3):
    return (f'<div class="ap-fila"><div class="tx"><span class="l1">{n}<span>Aviso {aviso.lower()}</span></span><span class="l2">{personas}</span>'
            f'<span class="l3">Bandeja {l3}</span></div>{kebab(n)}</div>')


EQUIPOS = (estado() + barra("Equipos", "Administración · WhatsApp", volver="T-App-Mas.dc.html")
           + '<div class="ap-cuerpo">' + "".join(equipo(*e) for e in EQ) + "</div>" + fab("Crear equipo", "T-App-EquipoCrear.dc.html") + nav("mas"))
p("T-App-Equipos", EQUIPOS, "Equipos")
CREAR = hoja("Crear equipo",
             campo("Nombre", "Soporte · Delta Sur")
             + f'<div class="ap-cmp"><span class="rt"><span>Bandeja <span class="rq">*</span></span></span>{seg("Clientes", "Internos", 0)}</div>'
             + campo("Personas", "Carolina Vega, Paula Méndez", flecha=True)
             + campo("Aviso por correo si nadie lo toma", "A los 10 minutos", req=False, flecha=True),
             '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Crear equipo</button>')
p("T-App-EquipoCrear", EQUIPOS + CREAR, "Crear equipo")

# ---------- Plantillas ----------
PL = [("Pedido listo", "20/09/2026", "Utilidad · Español (Argentina)", "", "Aprobada"),
      ("Recordatorio de turno", "18/09/2026", "Utilidad · Español (Argentina)", "", "Aprobada"),
      ("Novedades", "30/09/2026", "Marketing · Español (Argentina)", "amb", "En revisión"),
      ("Promo semanal", "29/09/2026", "Marketing · Español (Argentina)", "mal", "Rechazada")]


def plantilla(n, fecha, l2, cl, est):
    i = f'<button type="button" class="ap-i" aria-label="Por qué la rechazaron">{I["info"]}</button>' if cl == "mal" else ""
    return (f'<div class="ap-fila"><div class="tx"><span class="l1">{n}<span>{fecha}</span></span><span class="l2">{l2}</span>'
            f'<span class="l3"><span class="w-est {cl}">{est}</span>{i}</span></div>{kebab(n)}</div>')


PLANTILLAS = (estado() + barra("Plantillas", "Administración · WhatsApp", volver="T-App-Mas.dc.html")
              + '<div class="ap-cuerpo">' + "".join(plantilla(*x) for x in PL) + "</div>" + fab("Nueva plantilla", "T-App-PlantillaNueva.dc.html") + nav("mas"))
p("T-App-Plantillas", PLANTILLAS, "Plantillas")
NUEVA = hoja("Nueva plantilla",
             campo("Nombre", "Pedido listo")
             + f'<div class="ap-cmp"><span class="rt"><span>Tipo <span class="rq">*</span></span></span>{seg("Utilidad", "Marketing", 0)}</div>'
             + campo("Texto", 'Hola <span class="ap-var">nombre</span>, tu pedido <span class="ap-var">número de pedido</span> está listo. Podés retirarlo en el local de 9 a 18.', area=True)
             + '<div class="ap-chips2"><span>+ Nombre del contacto</span><span>+ Otro dato</span></div>',
             '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Mandar a Meta</button>')
p("T-App-PlantillaNueva", PLANTILLAS + NUEVA, "Nueva plantilla")

# ---------- Cargar teléfonos de empleados ----------
TEL = [("+54 9 11 5555-4521", "Tomás Acosta", "", "Ya es miembro", "Queda vinculado"),
       ("+54 9 11 5555-7310", "Martín Paz", "", "Ya es miembro", "Queda vinculado"),
       ("+54 9 11 5555-8812", "Gabriel Ortiz", "azul", "Tiene cuenta", "Le llega una invitación a Grupo Delta"),
       ("+54 9 11 5555-9934", "", "off", "Sin cuenta", "Le llega una invitación por WhatsApp"),
       ("+54 9 11 5555-1200", "", "off", "Sin cuenta", "Le llega una invitación por WhatsApp"),
       ("11 4444", "", "mal", "Número inválido", "No se carga")]


def tel(num, persona, cl, est, que):
    l2 = f'<span class="l2">{persona}</span>' if persona else ""
    return (f'<div class="ap-fila"><div class="tx"><span class="l1">{num}<span><span class="w-est {cl}">{est}</span></span></span>{l2}'
            f'<span class="l3">{que}</span></div></div>')


p("T-App-Telefonos", estado() + barra("Cargar teléfonos", "6 teléfonos · 3 invitaciones", volver="M-Usuarios.dc.html")
  + '<div class="ap-cuerpo">'
  + '<span class="ap-gtit" style="margin-top: 8px;">A los que se invitan</span><div class="ap-grupo" style="margin-bottom: 8px;">'
  + item("Empresa", "Delta S.A.", der=CH) + item("Roles en la empresa", "Solo lectura", der=CH) + "</div>"
  + "".join(tel(*x) for x in TEL) + "</div>"
  + '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Vincular y mandar 3 invitaciones</button></div>', "Cargar teléfonos de empleados")

# ---------- Mensajes (perfil personal) ----------
def nav_personal(activo):
    it = [("inicio", I["casa"], "Inicio", "M-Inicio-Personal.dc.html"), ("mensajes", I["chat"], "Mensajes", "T-App-Mensajes.dc.html")]
    h = '<nav class="ap-nav" aria-label="Secciones" style="grid-template-columns: repeat(3, 1fr);">'
    for c, ic, tx, hr in it:
        h += f'<a{" class=\"on\" aria-current=\"page\"" if c == activo else ""} href="{hr}"><span class="i">{ic}</span>{tx}</a>'
    return h + '<a href="#"><span class="i"><span class="yo">L</span></span>Más</a></nav>'


ORGS = [("LC", "La Clementina", "Vos: Gracias, paso a las 17.", "10:42", "T-App-Mensaje.dc.html"),
        ("GD", "Grupo Delta", "Tu pedido 1043 está listo.", "Ayer", "#"),
        ("FR", "Ferretería Rosales", "Te esperamos.", "28/09", "#")]
p("T-App-Mensajes", estado() + barra("Mensajes", "Personal", acc(("lupa", "Buscar")))
  + '<div class="ap-cuerpo">' + "".join(
      f'<a class="w-conv" href="{h}"><span class="w-av">{i}</span><span class="tx"><span class="l1"><b>{n}</b><span>{t}</span></span>'
      f'<span class="l2"><span>{pr}</span></span></span></a>' for i, n, pr, t, h in ORGS) + "</div>" + nav_personal("mensajes"), "Mensajes")
CLEM = ('<div class="ap-chat"><span class="ap-dia">Hoy</span>'
        + m("sal", "Hola, ¿tienen empanadas de humita para hoy?", "10:30") + m("ent", "Hola Lucía, sí. ¿Cuántas querés?", "La Clementina · 10:35")
        + m("sal", "Una docena. Paso a las 17.", "10:40") + m("ent", "Perfecto, te las dejamos listas.", "La Clementina · 10:41")
        + m("sal", "Gracias, paso a las 17.", "10:42") + "</div>")
p("T-App-Mensaje", estado() + cbar("LC", "La Clementina", "Vinculada desde el 20/09/2026", volver="T-App-Mensajes.dc.html") + CLEM
  + f'<div class="ap-fijo"><a class="cb cb-pri full" href="#">{I["wa"]}&nbsp; Seguir en WhatsApp</a></div>', "Mensajes · conversación")

# ---------- Más ----------
PERF = (item("Personal", "Tu perfil personal", izq='<span class="ini">P</span>', href="M-Inicio-Personal.dc.html")
        + item("Grupo Delta", "Dueño", izq='<span class="ini" style="background: var(--marca-t); color: var(--marca-tx);">GD</span>', der=f'<span class="ok">{OK}</span>', href="M-Inicio-Org.dc.html")
        + item("Beta S.R.L.", "Suspendida", izq='<span class="ini">BS</span>', clase="apag", href="Perfil-Suspendido.dc.html"))
ADMIN = "".join(item(t, der=CH, href=h) for t, h in (("Usuarios", "M-Usuarios.dc.html"), ("Roles", "M-Roles.dc.html"), ("Empresas", "M-Empresas.dc.html"),
                                                      ("Configuración", "M-Configuracion.dc.html"), ("Página pública", "Pagina-Org.dc.html"), ("Auditoría", "M-Auditoria-Org.dc.html")))
WAADM = "".join(item(t, der=CH, href=h) for t, h in (("Números", "T-App-Numeros.dc.html"), ("Bot", "T-App-Bot.dc.html"),
                                                      ("Equipos", "T-App-Equipos.dc.html"), ("Plantillas", "T-App-Plantillas.dc.html")))
p("T-App-Mas", estado() + barra("Más", "Grupo Delta")
  + '<div class="ap-cuerpo ap-gris">'
  + '<div class="ap-yo"><span class="w-av">L</span><span><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>'
  + f'<span class="ap-gtit">Perfiles</span><div class="ap-grupo">{PERF}</div>'
  + f'<span class="ap-gtit">Administración</span><div class="ap-grupo">{ADMIN}</div>'
  + f'<span class="ap-gtit">WhatsApp</span><div class="ap-grupo">{WAADM}</div>'
  + f'<div class="ap-grupo" style="margin-top: 16px;">{item("Mi cuenta", der=CH, href="M-Cuenta.dc.html")}{item("Salir", izq=f"<span class=\"chev\" style=\"color: var(--peligro);\">{SALIR}</span>", clase="peligro", href="M-Ingreso.dc.html")}</div>'
  + '<div style="height: 16px;"></div></div>' + nav("mas"), "Más")
print("ok")
