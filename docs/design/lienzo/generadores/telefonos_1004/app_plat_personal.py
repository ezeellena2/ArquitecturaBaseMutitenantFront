"""Teléfonos de Plataforma y del perfil personal en formato app (2026-10-03), con los datos de los tableros de la compu.
Plataforma: barra de abajo con Organizaciones, Cuentas, Recuperaciones, Consultas y «Más» (desde el 2026-10-03, el WhatsApp de la plataforma solo atiende consultas). Perfil personal: Inicio, Mensajes y «Más»."""
from app_estilo import ESTILO_X
from app_marco import I, barra, estado, fab, hoja, pagina, svg

ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 18, "2")
CHEV = svg('<path d="m9 6 6 6-6 6"/>', 18, "2")
OK = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 20, "2.4")
SALIR = svg('<path d="M14 5h4v14h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>', 20)
EDIFICIO = svg('<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2"/>')
LLAVE = svg('<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5 19 4"/><path d="m16 7 2 2"/>')
ESTILO = """<style data-propuesta="app-plat-personal">
.ap .cb.apag { opacity: 0.45; }
.ap-fijo .cb.full { padding: 0 10px; min-width: 0; }
.ap-fila .l1 .q { font-size: 15px; font-weight: 500; color: var(--t1); white-space: normal; overflow-wrap: anywhere; min-width: 0; flex: 1; }
.ap-tabs.desliza { display: flex; overflow: hidden; }
.ap-tabs.desliza span { flex-shrink: 0; padding: 0 16px; }
.ap-txt-l { font-size: 14.5px; line-height: 1.5; color: var(--t2); margin: 0; }
.ap-cod6 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.ap-cod6 span { height: 52px; border-radius: 12px; border: 1px solid var(--borde2); display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; }
.ap-cod6 span.on { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.15); }
.ap-sug { margin: 8px 16px 0; padding: 16px; border-radius: 16px; background: var(--marca-t); display: flex; flex-direction: column; gap: 12px; }
.ap-sug p { margin: 0; font-size: 15px; line-height: 1.5; color: oklch(0.3 0.05 195); }
.ap-sug .cb { align-self: flex-start; height: 40px; border-radius: 10px; padding: 0 18px; }
.ap-det { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-top: 1px solid var(--borde); }
.ap-det:first-child { border-top: 0; }
.ap-det span { font-size: 13px; color: var(--t3); }
.ap-det b { font-size: 15.5px; font-weight: 500; }
.ap-it .acc-t { color: var(--marca-tx); font-weight: 600; font-size: 15px; }
.ap-it .acc-t.pel { color: var(--peligro); }
</style>"""


def acc(*claves):
    return "".join(f'<button type="button" class="ap-ib" aria-label="{e}">{I[c]}</button>' for c, e in claves)


def kebab(nombre):
    return f'<button type="button" class="ap-ib" aria-label="Acciones de {nombre}">{I["kebab"]}</button>'


def campo(rotulo, valor, req=True, flecha=False):
    rq = ' <span class="rq">*</span>' if req else ""
    f = ABAJO if flecha else ""
    return f'<div class="ap-cmp"><span class="rt"><span>{rotulo}{rq}</span></span><div class="ct">{valor}{f}</div></div>'


def item(tx, sub="", izq="", der="", href=None, clase=""):
    tag, attr = ("a", f' href="{href}"') if href else ("div", "")
    s = f"<span>{sub}</span>" if sub else ""
    return f'<{tag} class="ap-it {clase}"{attr}>{izq}<span class="tx"><b>{tx}</b>{s}</span>{der}</{tag}>'


def est(clase, texto_):
    return f'<span class="w-est {clase}">{texto_}</span>'


def fila(l1, der, l2, l3="", href="#", con_kebab=True):
    d = f"<span>{der}</span>" if der else ""
    k = kebab(l1) if con_kebab else ""
    linea3 = f'<span class="l3">{l3}</span>' if l3 else ""
    return (f'<div class="ap-fila"><a class="tx" href="{href}" style="color: inherit; text-decoration: none;"><span class="l1">{l1}{d}</span>'
            f'<span class="l2">{l2}</span>{linea3}</a>{k}</div>')


def persona(ini, l1, der, l2, l3, href="#"):
    av = f'<span class="w-av{"" if ini else " g"}">{ini or "—"}</span>'
    return (f'<div class="w-conv" style="align-items: center; padding-right: 6px;"><a href="{href}" style="display: flex; gap: 14px; flex: 1; min-width: 0; color: inherit; text-decoration: none;">{av}'
            f'<span class="tx"><span class="l1"><b>{l1}</b><span>{der}</span></span>' + (f'<span class="l2"><span>{l2}</span></span>' if l2 else "")
            + f'<span class="l3">{l3}</span></span></a>{kebab(l1)}</div>')


def nav_plat(activo):
    it = [("organizaciones", EDIFICIO, "Organizaciones", "T-Plat-Organizaciones.dc.html"), ("cuentas", I["personas"], "Cuentas", "T-Plat-Cuentas.dc.html"),
          ("recuperaciones", LLAVE, "Recuperaciones", "T-Plat-Recuperaciones.dc.html"), ("consultas", I["chat"], "Consultas", "M-Plat-WA-Chats.dc.html")]
    h = '<nav class="ap-nav" aria-label="Secciones">'
    for c, ic, tx, hr in it:
        on = ' class="on" aria-current="page"' if c == activo else ""
        b = '<span class="b">2</span>' if c == "consultas" else ""
        h += f'<a{on} href="{hr}"><span class="i">{ic}{b}</span>{tx}</a>'
    on = ' class="on" aria-current="page"' if activo == "mas" else ""
    return h + f'<a{on} href="T-Plat-Mas.dc.html"><span class="i"><span class="yo">M</span></span>Más</a></nav>'


def nav_personal(activo):
    it = [("inicio", I["casa"], "Inicio", "T-Per-Inicio.dc.html"), ("mensajes", I["chat"], "Mensajes", "M-WA-Mensajes.dc.html")]
    h = '<nav class="ap-nav" aria-label="Secciones" style="grid-template-columns: repeat(3, 1fr);">'
    for c, ic, tx, hr in it:
        on = ' class="on" aria-current="page"' if c == activo else ""
        h += f'<a{on} href="{hr}"><span class="i">{ic}</span>{tx}</a>'
    on = ' class="on" aria-current="page"' if activo == "mas" else ""
    return h + f'<a{on} href="T-Per-Mas.dc.html"><span class="i"><span class="yo">L</span></span>Más</a></nav>'


def p(nombre, contenido, titulo):
    pagina(nombre, contenido, ESTILO_X + "\n" + ESTILO, f"{titulo} · teléfono")


CH = f'<span class="chev">{CHEV}</span>'
GUARDAR = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>'
BOTONES = lambda a, b, pel=False: (f'<button type="button" class="cb cb-sec">{a}</button><button type="button" class="cb cb-pri"'
                                   + (' style="background: var(--peligro); border-color: var(--peligro);"' if pel else "") + f'>{b}</button>')

# =================== Perfil personal ===================
p("T-Per-Inicio", estado() + barra("Inicio", "Personal")
  + '<div class="ap-cuerpo"><div class="ap-sug"><p>Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.</p>'
  + '<a class="cb cb-pri" href="T-Per-Agregar.dc.html">Agregar</a></div></div>' + nav_personal("inicio"), "Inicio personal")

PERFILES = (item("Personal", "Tu perfil personal", izq='<span class="ini" style="background: var(--marca-t); color: var(--marca-tx);">P</span>', der=f'<span class="ok">{OK}</span>', href="T-Per-Inicio.dc.html")
            + item("Grupo Delta", "Dueño", izq='<span class="ini">GD</span>', href="M-Inicio-Org.dc.html")
            + item("Beta S.R.L.", "Suspendida", izq='<span class="ini">BS</span>', clase="apag", href="Perfil-Suspendido.dc.html"))
SALIR_IT = item("Salir", izq=f'<span class="chev" style="color: var(--peligro);">{SALIR}</span>', clase="peligro", href="M-Ingreso.dc.html")
p("T-Per-Mas", estado() + barra("Más", "Personal") + '<div class="ap-cuerpo ap-gris">'
  + '<div class="ap-yo"><span class="w-av">L</span><span><b>Lucía Fernández</b><span>lucia.fer@gmail.com</span></span></div>'
  + f'<span class="ap-gtit">Perfiles</span><div class="ap-grupo">{PERFILES}</div>'
  + f'<div class="ap-grupo" style="margin-top: 16px;">{item("Mi cuenta", der=CH, href="T-Per-Cuenta.dc.html")}{SALIR_IT}</div>'
  + "</div>" + nav_personal("mas"), "Más · personal")

CUENTA = (estado() + barra("Mi cuenta", "Personal", volver="T-Per-Mas.dc.html")
          + '<div class="ap-cuerpo ap-gris">'
          + '<span class="ap-gtit">Tus datos</span><div class="ap-grupo" style="padding: 14px 16px; display: flex; flex-direction: column; gap: 14px;">'
          + campo("Nombre y apellido", "Lucía Fernández", req=False) + campo("Idioma y región", "Español (Argentina)", req=False, flecha=True)
          + campo("Zona horaria", "Buenos Aires (GMT−3)", req=False, flecha=True) + "</div>"
          + '<span class="ap-gtit">Cómo entrás<a href="T-Per-Agregar.dc.html">Agregar correo o teléfono</a></span><div class="ap-grupo">'
          + item("lucia.fer@gmail.com", "Principal", der=kebab("lucia.fer@gmail.com"))
          + item("lucia.fernandez@delta.ejemplo.com", "Administrado por Grupo Delta")
          + item("011 15-5555-4521", est("amb", "Sin verificar"), der='<a class="acc-t" href="T-Per-Verificar.dc.html" style="text-decoration: none;">Verificar</a>')
          + item("Google", "Sin vincular", der='<span class="acc-t">Vincular</span>') + "</div>"
          + '<span class="ap-gtit">Privacidad</span><div class="ap-grupo">'
          + item("Exportar mis datos", der='<span class="acc-t">Exportar</span>')
          + item("Dar de baja mi cuenta", der='<a class="acc-t pel" href="T-Per-Baja.dc.html" style="text-decoration: none;">Dar de baja</a>') + "</div>"
          + '<div style="height: 16px;"></div></div>' + GUARDAR)
p("T-Per-Cuenta", CUENTA, "Mi cuenta")
p("T-Per-Agregar", CUENTA + hoja("Agregar correo o teléfono",
                                 '<div class="ap-seg2"><span class="on">Correo</span><span>WhatsApp</span></div>' + campo("Correo", "lucia.trabajo@gmail.com", req=False),
                                 BOTONES("Cancelar", "Enviar código")), "Mi cuenta · agregar")
COD = '<div class="ap-cod6"><span>4</span><span>8</span><span class="on"></span><span></span><span></span><span></span></div>'
p("T-Per-Verificar", CUENTA + hoja("Verificar tu correo", '<p class="ap-txt-l">Te mandamos un código a lu•••@gmail.com.</p>' + COD, BOTONES("Cancelar", "Verificar")),
  "Mi cuenta · verificar")
BAJA = ('<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="Dar de baja tu cuenta"><span class="asa"></span>'
        '<div class="hc" style="padding-right: 20px;"><h2>¿Dar de baja tu cuenta?</h2></div><div class="hb">'
        '<p class="ap-txt-l">Cerramos todas tus sesiones. Si ingresás en los próximos 30 días, podés cancelar la baja; después eliminamos tu cuenta, tus métodos de ingreso, tu espacio personal y tus membresías.</p>'
        + campo("Motivo", "Ya no la uso.") + '<div class="ap-cmp"><span class="rt"><span>Código que te mandamos a lu•••@gmail.com</span></span>' + COD + "</div></div>"
        f'<div class="hp">{BOTONES("Cancelar", "Dar de baja", True)}</div></div>')
p("T-Per-Baja", CUENTA + BAJA, "Mi cuenta · dar de baja")

# =================== Plataforma ===================
PLAT = "Plataforma"
O = [("Gamma S.A.", "27/09/2026", "Julio Pérez · 1 empresa · 1 miembro", est("amb", "Espera aprobación") + " · Autoservicio"),
     ("Épsilon S.R.L.", "26/09/2026", "Morena Paz · 1 empresa · 1 miembro", est("amb", "Espera aprobación") + " · Autoservicio"),
     ("Grupo Delta", "12/01/2026", "Lucía Fernández · 3 empresas · 11 miembros", est("", "Activa") + " · Autoservicio"),
     ("Omega S.A.", "20/09/2026", "gerencia@omega.ejemplo.com · 1 empresa · 1 miembro", est("", "Activa") + " · Plataforma"),
     ("Beta S.R.L.", "03/02/2026", "Beto Ramírez · 1 empresa · 6 miembros", est("mal", "Suspendida") + " · Autoservicio"),
     ("Sigma S.A.", "27/09/2026", "Rosa Luna · sin empresas", est("mal", "Falló el alta") + " · Autoservicio"),
     ("Kappa S.R.L.", "15/03/2026", "Pablo Ortiz · 2 empresas · 4 miembros", est("off", "Cerrada") + " · Plataforma")]
p("T-Plat-Organizaciones", estado() + barra("Organizaciones", PLAT, acc(("lupa", "Buscar"), ("filtro", "Filtros")))
  + '<div class="ap-cuerpo">' + "".join(fila(a, b, c, d, href="T-Plat-Organizacion.dc.html" if a == "Grupo Delta" else "#") for a, b, c, d in O) + "</div>"
  + fab("Crear organización") + nav_plat("organizaciones"), "Organizaciones")

H = [("Reactivó la organización", "20/09 11:02", "Martín Sosa · Regularizó el pago."),
     ("Suspendió la organización", "18/09 16:45", "Martín Sosa · Dos meses sin pago."),
     ("Aprobó la organización", "12/01 09:03", "Laura Díaz · Datos verificados con AFIP."),
     ("Pidió crear la organización", "12/01 08:40", "Lucía Fernández")]
p("T-Plat-Organizacion", estado() + barra("Grupo Delta", "Activa · 3 empresas · 11 miembros", kebab("Grupo Delta"), volver="T-Plat-Organizaciones.dc.html")
  + '<div class="ap-tabs desliza" role="tablist"><span class="on" role="tab">Historial <span class="c">4</span></span><span role="tab">Dueños <span class="c">1</span></span>'
  + '<span role="tab">Módulos <span class="c">2</span></span><span role="tab">Dominio verificado <span class="c">1</span></span><span role="tab">Página pública <span class="c">1</span></span></div>'
  + '<div class="ap-cuerpo">' + "".join(f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">{q}</span><span>{f}</span></span><span class="l2">{d}</span></div></div>' for q, f, d in H)
  + "</div>" + nav_plat("organizaciones"), "Ficha de una organización")

C = [("L", "Lucía Fernández", "hace 55 min", "lucia.fernandez@delta.ejemplo.com", est("", "Activa") + " · Personal + 2 organizaciones", "T-Plat-Cuenta.dc.html"),
     ("B", "Beto Ramírez", "ayer", "beto.ramirez@beta.ejemplo.com", est("", "Activa") + " · Personal + 1 organización", "#"),
     ("A", "Ana Gómez", "18/09", "ana.gomez@gmail.com", est("mal", "Suspendida") + " · Personal", "#"),
     ("", "mariana.lopez@gmail.com", "hace 8 h", "", est("", "Activa") + " · Personal", "#"),
     ("P", "Pablo Ortiz", "19/09", "pablo@kappa.ejemplo.com", est("amb", "Necesita recuperación") + " · Personal", "#"),
     ("D", "Diego Ríos", "27/09", "diego.rios@delta.ejemplo.com", est("amb", "Baja pedida") + " · Personal + 1 organización", "#"),
     ("M", "Martín Sosa", "hace 40 min", "martin.sosa@arquitecturabase.ejemplo.com", est("", "Activa") + " · Operador", "#")]
p("T-Plat-Cuentas", estado() + barra("Cuentas", PLAT, acc(("lupa", "Buscar"), ("filtro", "Filtros")))
  + '<div class="ap-cuerpo">' + "".join(persona(*x) for x in C) + "</div>" + fab("Invitar operador") + nav_plat("cuentas"), "Cuentas")

MI = [("lu•••@delta.ejemplo.com", "Correo", "Administrado por Grupo Delta · verificado el 12/01/2026", est("", "Sirve para ingresar")),
      ("011 15-••••-4521", "WhatsApp", "Verificado el 03/02/2026", est("", "Sirve para ingresar")),
      ("lu•••@gmail.com", "Correo", "Principal · verificado el 10/05/2026", est("", "Sirve para ingresar"))]
p("T-Plat-Cuenta", estado() + barra("Lucía Fernández", "Activa · último ingreso hace 55 minutos", kebab("Lucía Fernández"), volver="T-Plat-Cuentas.dc.html")
  + '<div class="ap-tabs desliza" role="tablist"><span class="on" role="tab">Métodos de ingreso <span class="c">3</span></span><span role="tab">Organizaciones <span class="c">2</span></span>'
  + '<span role="tab">Historial de seguridad <span class="c">4</span></span></div>'
  + '<div class="ap-cuerpo">' + "".join(fila(a, b, c, d, con_kebab=False) for a, b, c, d in MI) + "</div>" + nav_plat("cuentas"), "Ficha de una cuenta")

RC = [("Pablo Ortiz", "27/09 10:20", "pa•••@kappa.ejemplo.com → pa•••@gmail.com", est("amb", "Pendiente")),
      ("Sin cuenta", "26/09 18:05", "ma•••@omega.ejemplo.com → 011 15-••••-3310", est("amb", "Pendiente")),
      ("Rosa Luna", "22/09 09:40", "ro•••@sigma.ejemplo.com → ro•••@gmail.com", est("", "Aprobado")),
      ("Carla Núñez", "15/09 13:12", "0351 15-••••-2204 → ca•••@gmail.com", est("mal", "Rechazado"))]
p("T-Plat-Recuperaciones", estado() + barra("Recuperaciones", PLAT, acc(("filtro", "Filtros")))
  + '<div class="ap-cuerpo">' + "".join(fila(a, b, c, d) for a, b, c, d in RC) + "</div>" + nav_plat("recuperaciones"), "Recuperaciones")

p("T-Plat-Legales", estado() + barra("Documentos legales", "Administración", volver="T-Plat-Mas.dc.html")
  + '<div class="ap-cuerpo">' + fila("Términos y condiciones", "Versión 2", "Vigente desde 01/06/2026", "2 versiones")
  + fila("Política de privacidad", "Versión 1", "Vigente desde 12/01/2026", "1 versión") + "</div>"
  + fab("Publicar versión nueva") + nav_plat("mas"), "Documentos legales")

p("T-Plat-Config", estado() + barra("Configuración", "Administración", volver="T-Plat-Mas.dc.html")
  + '<div class="ap-cuerpo" style="padding: 4px 20px 0; gap: 14px;">'
  + '<span class="ap-gtit" style="margin: 4px 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1);">Registro y altas</span>'
  + campo("Registro de personas", "Abierto", req=False, flecha=True) + campo("Alta de organizaciones", "Requiere aprobación", req=False, flecha=True)
  + campo("Organizaciones propias por persona", "3", req=False)
  + '<span class="ap-gtit" style="margin: 14px 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1);">Contacto</span>'
  + campo("Correo de ventas", "ventas@ejemplo.com", req=False) + campo("Correo de soporte", "soporte@ejemplo.com", req=False) + "</div>" + GUARDAR,
  "Configuración de la plataforma")

AU = [("Ingresó con el autenticador", "27/09 10:55", "Plataforma · Martín Sosa", ""),
      ("Cuenta bloqueada 15 minutos por 10 códigos incorrectos", "27/09 10:20", "mariana.lopez@gmail.com · Sistema", ""),
      ("Falló el alta de la organización", "27/09 09:55", "Sigma S.A. · Sistema", ""),
      ("Suspendió la cuenta", "26/09 17:30", "Ana Gómez · Laura Díaz", "Denuncia de uso indebido."),
      ("Cambió el alta de organizaciones a Requiere aprobación", "22/09 12:00", "Plataforma · Martín Sosa", "Muchas altas de prueba."),
      ("Reactivó la organización", "20/09 11:02", "Grupo Delta · Martín Sosa", "Regularizó el pago.")]
AUDITORIA = (estado() + barra("Auditoría", "Últimos 30 días", acc(("filtro", "Filtros")), volver="T-Plat-Mas.dc.html")
             + '<div class="ap-cuerpo">' + "".join(
                 f'<a class="ap-fila" href="{"T-Plat-AuditoriaDetalle.dc.html" if q == "Suspendió la cuenta" else "#"}"><div class="tx"><span class="l1"><span class="q">{q}</span><span>{f}</span></span>'
                 f'<span class="l2">{d}</span>' + (f'<span class="l3">{m}</span>' if m else "") + "</div></a>" for q, f, d, m in AU)
             + '<div style="display: flex; justify-content: center; padding: 14px 16px 20px;"><button type="button" class="cb cb-sec" style="height: 44px; padding: 0 22px; border-radius: 12px;">Cargar más</button></div></div>'
             + nav_plat("mas"))
p("T-Plat-Auditoria", AUDITORIA, "Auditoría de la plataforma")
DET = "".join(f'<div class="ap-det"><span>{a}</span><b>{b}</b></div>' for a, b in (("Fecha y hora", "26/09/2026 17:30"), ("Sobre", "Ana Gómez"), ("Quién", "Laura Díaz · Operador"),
                                                                                ("Motivo", "Denuncia de uso indebido."), ("Dirección IP", "181.45.•••.30")))
p("T-Plat-AuditoriaDetalle", AUDITORIA + hoja("Suspendió la cuenta", f'<div style="display: flex; flex-direction: column;">{DET}</div>',
                                              '<button type="button" class="cb cb-sec">Cerrar</button>'), "Auditoría de la plataforma · detalle")

p("T-Plat-Mas", estado() + barra("Más", PLAT) + '<div class="ap-cuerpo ap-gris">'
  + '<div class="ap-yo"><span class="w-av">M</span><span><b>Martín Sosa</b><span>martin.sosa@arquitecturabase.ejemplo.com</span></span></div>'
  + '<span class="ap-gtit">Administración</span><div class="ap-grupo">' + item("Auditoría", der=CH, href="T-Plat-Auditoria.dc.html")
  + item("Documentos legales", der=CH, href="T-Plat-Legales.dc.html") + item("Configuración", der=CH, href="T-Plat-Config.dc.html") + "</div>"
  + '<span class="ap-gtit">WhatsApp</span><div class="ap-grupo">' + item("Número", der=CH, href="M-Plat-WA-Numero.dc.html") + item("Bot", der=CH, href="M-Plat-WA-Bot.dc.html")
  + item("Equipos", der=CH, href="M-Plat-WA-Equipos.dc.html") + item("Plantillas", der=CH, href="M-Plat-WA-Plantillas.dc.html") + "</div>"
  + f'<div class="ap-grupo" style="margin-top: 16px;">{item("Mi cuenta", der=CH, href="M-Cuenta.dc.html")}{SALIR_IT}</div>'
  + '<div style="height: 16px;"></div></div>' + nav_plat("mas"), "Más · plataforma")
print("ok")
