"""WhatsApp de escritorio aprobado el 2026-10-03, pantalla por pantalla.
1. Corre las propuestas elegidas (whatsapp_1003/propuestas) sobre la copia de partida (whatsapp_1003/base).
2. Deja cada tablero con su nombre final, sus enlaces y el menú de WhatsApp completo.
3. Suma lo de WhatsApp a tableros que ya existen, con marca `data-vuelta="1003-<tablero>"` (no se repite).
4. Acomoda la página «Organización · WhatsApp» en canvas.json; los teléfonos M-WA-* quedan «· por refinar».
Corre después de whatsapp_tableros.py, conectar_paginas.py y org_vuelta_1002.py. Se puede volver a correr."""
import json
import pathlib
import re
import runpy
import sys

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
W = GEN / "whatsapp_1003"
SALIDA = W / "salida"
ORDEN = ["wa_chats", "wa_tomar", "wa_pasar", "wa_nota", "wa_24h", "wa_elegir", "wa_contactos", "wa_contacto", "wa_difusiones",
         "wa_resultados", "wa_numeros", "wa_bot", "wa_opcion", "wa_equipos", "wa_plantillas", "wa_telefonos", "wa_mensajes"]

# Propuesta elegida → (tablero, título, qué entrada del grupo WhatsApp va marcada en el menú principal).
FINAL = {
    "V-WA-Chats-A": ("WA-Chats", "WhatsApp › Chats", "chats"),
    "V-WA-Tomar-A": ("WA-Chats-SinTomar", "WhatsApp › Chats · sin tomar", "chats"),
    "V-WA-Pasar-B": ("WA-Chats-Pasar", "WhatsApp › Chats · pasar", "chats"),
    "V-WA-Nota-A": ("WA-Chats-Nota", "WhatsApp › Chats · nota interna", "chats"),
    "V-WA-24h-B": ("WA-Chats-24h", "WhatsApp › Chats · pasaron 24 horas", "chats"),
    "V-WA-Elegir-A": ("WA-Chats-Plantilla", "WhatsApp › Chats · elegir plantilla", "chats"),
    "V-WA-Contactos-A": ("WA-Contactos", "WhatsApp › Contactos", "contactos"),
    "V-WA-Contactos-A2": ("WA-Contactos-Importar", "WhatsApp › Contactos · importar", "contactos"),
    "V-WA-Contacto-B": ("WA-Contacto", "WhatsApp › Ficha del contacto", "contactos"),
    "V-WA-Difusiones": ("WA-Difusiones", "WhatsApp › Difusiones", "difusiones"),
    "V-WA-Difusion-Nueva-A": ("WA-Difusion-Nueva", "WhatsApp › Nueva difusión", "difusiones"),
    "V-WA-Resultados-A": ("WA-Difusion-Resultados", "WhatsApp › Resultados de una difusión", "difusiones"),
    "V-WA-Numeros-A": ("WA-Admin", "Administración › WhatsApp › Números", None),
    "V-WA-Numeros-A2": ("WA-Admin-Pago", "Administración › WhatsApp › Números · falta medio de pago", None),
    "V-WA-Bot-C1": ("WA-Respuestas", "Administración › WhatsApp › Bot · configuración", None),
    "V-WA-Bot-C2": ("WA-Bot-Recorrido", "Administración › WhatsApp › Bot · recorrido", None),
    "V-WA-Opcion-A": ("WA-Admin-Editar", "Administración › WhatsApp › Bot · editar opción", None),
    "V-WA-Equipos-A": ("WA-Equipos", "Administración › WhatsApp › Equipos", None),
    "V-WA-Equipos-A2": ("WA-Equipos-Crear", "Administración › WhatsApp › Equipos · crear", None),
    "V-WA-Plantillas": ("WA-Plantillas", "Administración › WhatsApp › Plantillas", None),
    "V-WA-Plantilla-Nueva-B": ("WA-Plantilla-Nueva", "Administración › WhatsApp › Plantillas · nueva", None),
    "V-Telefonos-A": ("WA-Telefonos", "Usuarios › Cargar teléfonos de empleados", None),
    "V-Mensajes-A": ("WA-Mensajes", "Perfil personal › Mensajes", None),
}
VACIO = ("WA-Admin-Vacio", "Administración › WhatsApp › Números · sin números")

# Ubicación en la página: filas de 6 tableros de escritorio y, debajo, los teléfonos.
FILAS = [["WA-Chats", "WA-Chats-SinTomar", "WA-Chats-Pasar", "WA-Chats-Nota", "WA-Chats-24h", "WA-Chats-Plantilla"],
         ["WA-Contactos", "WA-Contactos-Importar", "WA-Contacto", "WA-Difusiones", "WA-Difusion-Nueva", "WA-Difusion-Resultados"],
         ["WA-Admin", "WA-Admin-Pago", "WA-Admin-Vacio", "WA-Respuestas", "WA-Bot-Recorrido", "WA-Admin-Editar"],
         ["WA-Equipos", "WA-Equipos-Crear", "WA-Plantillas", "WA-Plantilla-Nueva", "WA-Telefonos", "WA-Mensajes"]]
TELEFONOS = ["M-WA-Menu", "M-WA-Chats", "M-WA-Conversacion", "M-WA-24h", "M-WA-Contacto", "M-WA-Admin", "M-WA-Editar"]
PLATAFORMA = ["Organizaciones", "Organizacion", "Cuentas", "Cuenta-Plat", "Recuperaciones", "Legales", "Config-Plat", "Auditoria-Plat"]
PERSONAL = ["Inicio-Personal", "Cuenta", "Cuenta-Agregar", "Cuenta-Verificar", "Cuenta-Baja"]


def svg(d, w=18):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>')
CHAT = svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/>')


def boton_a_enlace(t, texto, href):
    """El primer botón «cb» que contiene `texto` pasa a ser un enlace a `href`."""
    m = re.search(r'<button type="button" class="(cb [^"]*)"([^>]*)>((?:(?!</button>).)*?' + re.escape(texto) + r'(?:(?!</button>).)*?)</button>', t, flags=re.S)
    assert m, texto
    return t[:m.start()] + f'<a class="{m.group(1)}" href="{href}"{m.group(2)}>{m.group(3)}</a>' + t[m.end():]


def volver_a(t, href):
    m = re.search(r'<span class="vol">(<svg.*?</svg>)</span>', t, flags=re.S)
    return t if not m else t[:m.start()] + f'<a class="vol" href="{href}" aria-label="Volver">{m.group(1)}</a>' + t[m.end():]


def menu_whatsapp(t, activo):
    """En el menú principal, el grupo WhatsApp lleva Chats, Contactos y Difusiones."""
    if activo is None:
        return t
    aside = re.search(r'<aside class="w-sb".*?</aside>', t, flags=re.S)
    if not aside or "w-hijos" not in aside.group(0):
        return t
    hijos = re.search(r'<div class="w-hijos">.*?</div>', aside.group(0), flags=re.S).group(0)
    ln = lambda clave, texto, href, extra="": f'<a class="w-ln{" on" if clave == activo else ""}" href="{href}">{texto}{extra}</a>'
    nuevos = ('<div class="w-hijos">' + ln("chats", "Chats", "WA-Chats.dc.html", '<span class="cnt">2</span>') + ln("contactos", "Contactos", "WA-Contactos.dc.html")
              + ln("difusiones", "Difusiones", "WA-Difusiones.dc.html") + "</div>")
    return t.replace(aside.group(0), aside.group(0).replace(hijos, nuevos, 1), 1)


def enlaces(t):
    for v, (n, _, _) in FINAL.items():
        t = t.replace(f"{v}.dc.html", f"{n}.dc.html")
    # En el panel de Administración, cada entrada de WhatsApp va a su tablero.
    return t.replace('href="WA-Respuestas.dc.html">Equipos', 'href="WA-Equipos.dc.html">Equipos')


def titulo(t, texto):
    return re.sub(r"<title>.*?</title>", f"<title>{texto}</title>", t, count=1, flags=re.S)


def armar_tableros():
    SALIDA.mkdir(exist_ok=True)
    for s in ORDEN:
        runpy.run_path(str(W / "propuestas" / f"{s}.py"), run_name="__main__")
    hechos = {}
    for v, (n, tit, activo) in FINAL.items():
        t = (SALIDA / f"{v}.dc.html").read_text(encoding="utf-8")
        hechos[n] = titulo(menu_whatsapp(enlaces(t), activo), tit)
    # Enlaces que llevan de una pantalla a la que sigue.
    hechos["WA-Chats"] = boton_a_enlace(hechos["WA-Chats"], "Pasar", "WA-Chats-Pasar.dc.html")
    hechos["WA-Chats-24h"] = boton_a_enlace(hechos["WA-Chats-24h"], "Elegir plantilla", "WA-Chats-Plantilla.dc.html")
    hechos["WA-Contactos"] = boton_a_enlace(hechos["WA-Contactos"], "Importar contactos", "WA-Contactos-Importar.dc.html")
    hechos["WA-Equipos"] = boton_a_enlace(hechos["WA-Equipos"], "Crear equipo", "WA-Equipos-Crear.dc.html")
    hechos["WA-Plantillas"] = boton_a_enlace(hechos["WA-Plantillas"], "Nueva plantilla", "WA-Plantilla-Nueva.dc.html")
    hechos["WA-Difusiones"] = hechos["WA-Difusiones"].replace(
        "<b>20 % en empanadas</b>", '<a href="WA-Difusion-Resultados.dc.html" style="font-weight: 500; color: var(--t1);">20 % en empanadas</a>', 1)
    hechos["WA-Admin"] = re.sub(r'<button type="button" class="o-i"([^>]*)>(.*?)</button>', r'<a class="o-i" href="WA-Admin-Pago.dc.html"\1>\2</a>',
                                hechos["WA-Admin"], count=1, flags=re.S)
    hechos["WA-Respuestas"] = hechos["WA-Respuestas"].replace('<span class="" role="tab">Recorrido</span>',
                                                              '<a class="" role="tab" href="WA-Bot-Recorrido.dc.html" style="text-decoration: none;">Recorrido</a>', 1)
    hechos["WA-Respuestas"] = re.sub(r'<button type="button" class="ib" aria-label="Acciones de Hacer un pedido">(.*?)</button>',
                                     r'<a class="ib" href="WA-Admin-Editar.dc.html" aria-label="Acciones de Hacer un pedido">\1</a>', hechos["WA-Respuestas"], count=1, flags=re.S)
    hechos["WA-Bot-Recorrido"] = hechos["WA-Bot-Recorrido"].replace('<span class="" role="tab">Configuración</span>',
                                                                    '<a class="" role="tab" href="WA-Respuestas.dc.html" style="text-decoration: none;">Configuración</a>', 1)
    hechos["WA-Difusion-Resultados"] = volver_a(hechos["WA-Difusion-Resultados"], "WA-Difusiones.dc.html")
    hechos["WA-Telefonos"] = volver_a(hechos["WA-Telefonos"], "Usuarios.dc.html")
    # Números sin ningún número conectado.
    t = hechos["WA-Admin"]
    t = t.replace("2 números · 1 sin medio de pago", "Sin números", 1)
    t = t[:t.index('<div class="w-body">')] + ('<div class="w-body"><div class="w-caja"><div class="w-vacio"><b>Todavía no hay números conectados.</b></div></div></div>'
                                            + t[t.index("</div></div>\n</x-dc>"):])
    hechos[VACIO[0]] = titulo(t, VACIO[1])
    for n, t in hechos.items():
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    print("ok", len(hechos), "tableros de WhatsApp")


def marcar(nombre, cambio):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    marca = f'data-vuelta="1003-{nombre}"'
    if marca in t:
        return
    t = cambio(t).replace("</helmet>", f"<style {marca}></style>\n</helmet>", 1)
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre)


def rol(t):
    ancla = "  { n: 'Página pública', ps: [['publicpage.manage', 'Administrar la página pública', 'Editarla, publicarla y despublicarla.']] },\n"
    assert t.count(ancla) == 1
    return t.replace(ancla, ancla + "  { n: 'WhatsApp', ps: [['whatsapp.customers', 'Atender clientes', 'Ver y responder la bandeja de Clientes y ver los contactos.'], "
                     "['whatsapp.internal', 'Atender internos', 'Ver y responder la bandeja de Internos.'], ['whatsapp.broadcasts', 'Mandar difusiones', 'Crear y mandar difusiones.'], "
                     "['whatsapp.manage', 'Administrar WhatsApp', 'Números, bot, equipos y plantillas.']] },\n", 1)


def mensajes(t):
    ancla = "  {\n    n: 'Método de ingreso agregado',"
    assert t.count(ancla) == 1
    entrada = """  {
    n: 'Chats esperando',
    // Aviso al equipo cuando un chat queda sin tomar más del tiempo que eligió el Dueño. Solo por correo y sin copiar mensajes ni teléfonos de clientes.
    correo: {
      asunto: 'Tenés 3 chats esperando en Ventas',
      para: 'lucia.fernandez@delta.ejemplo.com',
      titulo: '3 chats esperando en Ventas',
      parrafos: [P('Hola, Lucía. Hay 3 chats de WhatsApp sin tomar en Ventas, de Grupo Delta. El más viejo espera hace 25 minutos.')],
      boton: 'Ver los chats',
      pie: 'Te llega porque estás en el equipo Ventas. El Dueño elige cuándo se manda este aviso.',
    },
  },
"""
    return t.replace(ancla, entrada + ancla, 1).replace('"options":["Código de ingreso",', '"options":["Código de ingreso","Chats esperando",', 1)


def usuarios(t):
    ancla = '<div class="acciones"><button type="button" class="b b-pri" onClick="{{abrirInvitar}}">'
    assert t.count(ancla) == 1
    return t.replace(ancla, '<div class="acciones"><a class="b b-sec" href="WA-Telefonos.dc.html">Cargar teléfonos</a><button type="button" class="b b-pri" onClick="{{abrirInvitar}}">', 1)


def personal(t):
    nav = re.search(r'<nav class="w-nav">(<a class="w-ln[^"]*" href="Inicio-Personal\.dc\.html">.*?</a>)', t, flags=re.S)
    assert nav
    return t.replace(nav.group(0), nav.group(0) + f'<a class="w-ln" href="WA-Mensajes.dc.html">{CHAT} Mensajes</a>', 1)


def plataforma(t):
    ini = t.index('<ul class="ab-sidebar__list">')
    fin = t.index("</ul>", ini) + len("</ul>")
    lista = t[ini:fin]
    items = {re.search(r'href="([^"]+)"', li).group(1): li for li in re.findall(r"<li>.*?</li>", lista, flags=re.S)}
    assert len(items) == 6, items.keys()
    activo_conf = "ab-sidebar__link--active" in items["Config-Plat.dc.html"]
    icono_conf = re.search(r"(<svg.*?</svg>)", items["Config-Plat.dc.html"], flags=re.S).group(1)

    def hijo(texto, href, on=False, cnt=""):
        clase = "ab-sidebar__link ab-sidebar__link--active" if on else "ab-sidebar__link"
        extra = f'<span style="margin-left: auto; font-size: 12px; font-weight: 600; color: var(--marca-tx);">{cnt}</span>' if cnt else ""
        return f'<li><a class="{clase}" href="{href}"><span class="ab-sidebar__link-label">{texto}</span>{extra}</a></li>'

    def grupo(texto, icono, hijos):
        return (f'<li><span class="ab-sidebar__branch ab-sidebar__link">{icono}<span class="ab-sidebar__link-label">{texto}</span></span>'
                f'<ul class="ab-sidebar__children">{"".join(hijos)}</ul></li>')

    sub = lambda texto: f'<li style="padding: 6px 8px 2px; font-size: 11.5px; font-weight: 600; color: var(--lado-t3, var(--t3));">{texto}</li>'
    nueva = ('<ul class="ab-sidebar__list">' + items["Organizaciones.dc.html"] + items["Cuentas.dc.html"] + items["Recuperaciones.dc.html"]
             + grupo("WhatsApp", WA, [hijo("Chats", "WA-Chats.dc.html", cnt="2"), hijo("Contactos", "WA-Contactos.dc.html"), hijo("Difusiones", "WA-Difusiones.dc.html")])
             + items["Auditoria-Plat.dc.html"] + items["Legales.dc.html"]
             + grupo("Configuración", icono_conf, [hijo("General", "Config-Plat.dc.html", on=activo_conf), sub("WhatsApp"), hijo("Números", "WA-Admin.dc.html"),
                                                   hijo("Bot", "WA-Respuestas.dc.html"), hijo("Equipos", "WA-Equipos.dc.html"), hijo("Plantillas", "WA-Plantillas.dc.html")])
             + "</ul>")
    return t[:ini] + nueva + t[fin:]


def lienzo():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    titulos = {n: tit for n, tit, _ in FINAL.values()}
    titulos[VACIO[0]] = VACIO[1]
    for y, fila in zip((260, 1280, 2300, 3320), FILAS):
        for i, n in enumerate(fila):
            clave = f"{n}.dc.html"
            b = c["boards"].get(clave, {})
            b.update({"h": 900, "page": "propuesta-whatsapp", "title": titulos[n], "w": 1440, "x": i * 1520, "y": y})
            c["boards"][clave] = dict(sorted(b.items()))
            if clave not in c["order"]:
                c["order"].append(clave)
    for i, n in enumerate(TELEFONOS):
        b = c["boards"][f"{n}.dc.html"]
        b["x"], b["y"] = i * 470, 4340
        if " · por refinar" not in b["title"]:
            b["title"] += " · por refinar"
    c["notes"]["t-propuesta-whatsapp"]["maxW"] = 8000
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ok canvas.json")


armar_tableros()
marcar("Rol", rol)
marcar("Mensajes", mensajes)
marcar("Usuarios", usuarios)
for n in PERSONAL:
    marcar(n, personal)
for n in PLATAFORMA:
    marcar(n, plataforma)
lienzo()
