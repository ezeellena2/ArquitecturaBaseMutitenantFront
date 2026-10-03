"""Plataforma en la compu, refinada con el criterio el 2026-10-03 (mismas reglas que la vuelta de Organización).
Antes corre aplicar_criterio.py y criterio_marcado.py sobre los ocho tableros (estado con punto, banda en segunda línea, medidas).
Acá: celdas de dos líneas, auditoría sin ojo ni cantidad y con el detalle en una grilla, la ficha de organización con sus pestañas,
la configuración con su encabezado y WhatsApp en el menú (decisión «Plataforma → B» del 2026-10-03).
Cada tablero lleva `data-vuelta="1004-<tablero>"`; si ya la tiene, no se toca. Corre después de menu_plataforma.py."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

DOS_LINEAS = """.tt-f .dos { display: flex; flex-direction: column; gap: 1px; line-height: 1.35; min-width: 0; }
.tt-f .dos > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tt-f .dos .n2 { font-size: 12px; color: var(--t3); }
.tt-f .dos .c1 { font-weight: 500; }
.tt-f.o-alto { min-height: 52px !important; }"""
O_LINK = """.o-link { border: 0; background: none; padding: 0; font: inherit; color: var(--t1); text-align: left; cursor: pointer; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.o-link:hover { color: var(--marca-tx); text-decoration: underline; text-underline-offset: 3px; }"""


def svg(d, w=20):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>')
CHAT = svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/>')
PERSONAS = svg('<circle cx="9" cy="8" r="3.5"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4"/><path d="M18 14.8c1.6.7 2.7 2.3 3 4.7"/>')
MEGAFONO = svg('<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>')
ROBOT = svg('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4"/><circle cx="9.5" cy="13.5" r="1"/><circle cx="14.5" cy="13.5" r="1"/>')
DOC = svg('<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4"/><path d="M9 12.5h6M9 16h4"/>')
FLECHA = '<svg class="adm-flecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'
VOLVER = svg('<path d="m15 6-6 6 6 6"/>')


class Tablero:
    def __init__(self, nombre):
        self.nombre = nombre
        self.ruta = PROJ / f"{nombre}.dc.html"
        self.t = self.ruta.read_text(encoding="utf-8")
        self.marca = f'data-vuelta="1004-{nombre}"'

    @property
    def hecho(self):
        return self.marca in self.t

    def rep(self, a, b, n=1):
        assert self.t.count(a) == n, (self.nombre, a[:90], self.t.count(a))
        self.t = self.t.replace(a, b)

    def entre(self, ini, fin, desde=0):
        i = self.t.index(ini, desde)
        j = self.t.index(fin, i) + len(fin)
        return self.t[i:j]

    def guardar(self, css=""):
        self.rep("</helmet>", f"<style {self.marca}>\n{css}\n</style>\n</helmet>")
        self.ruta.write_text(self.t, encoding="utf-8")
        print("ok", self.nombre)


def tabla(b, cols_viejas, cols, titulos, celdas, acciones=True):
    """Cambia encabezado y celdas de la tabla de `b`: la fila va hasta el ⋮ (o hasta el cierre si no tiene)."""
    estilo = f'style="grid-template-columns: {cols_viejas};"'
    pos = b.t.index(estilo)
    i = b.t.rindex('<div class="tt-h"', 0, pos)
    cab = b.t[i:b.t.index("</div>", i) + len("</div>")]
    b.rep(cab, f'<div class="tt-h" style="grid-template-columns: {cols};">' + "".join(f"<span>{x}</span>" for x in titulos)
          + ('<span class="sr">Acciones</span>' if acciones else "") + "</div>")
    pos = b.t.index(estilo)
    f_ini = b.t.rindex("<div", 0, pos)
    fin = b.t.find('<span class="der envoltura">', f_ini)
    viejo = b.t[f_ini:fin]
    clase = re.search(r'<div class="tt-f([^"]*)"', viejo).group(1)
    b.rep(viejo, f'<div class="tt-f{clase} o-alto" style="grid-template-columns: {cols};">\n              ' + celdas + "\n              ")


def organizaciones():
    b = Tablero("Organizaciones")
    if b.hecho:
        return
    viejas = "minmax(0, 1.4fr) 80px minmax(0, 1.1fr) minmax(0, 1.6fr) 84px 96px 110px 150px 28px"
    cols = "minmax(0, 1.5fr) minmax(0, 1.6fr) 90px 90px 180px 28px"
    celdas = ('<span class="dos"><a class="c1" href="Organizacion.dc.html">{{o.n}}</a><span class="n2">Alta {{o.alta}} · {{o.origen}}</span></span>'
              '<span class="dos"><span>{{o.admin}}</span><span class="n2">{{o.email}}</span></span>'
              '<span class="num">{{o.empresasN}}</span><span class="num">{{o.miembros}}</span>'
              '<span><span class="pill {{o.pill}}">{{o.textoEstado}}</span></span>')
    tabla(b, viejas, cols, ["Organización", "Dueño", '<span style="display: block; text-align: right;">Empresas</span>',
                            '<span style="display: block; text-align: right;">Miembros</span>', "Estado"], celdas)
    b.guardar(DOS_LINEAS)


def cuentas():
    b = Tablero("Cuentas")
    if b.hecho:
        return
    viejas = "minmax(0, 1.1fr) minmax(0, 1.8fr) 130px minmax(0, 1.4fr) 120px minmax(0, 1.1fr) 160px 28px"
    cols = "minmax(0, 1.8fr) 150px minmax(0, 1.3fr) minmax(0, 1.2fr) 190px 28px"
    celdas = ('<span class="dos"><a class="c1 {{c.claseNombre}}" href="Cuenta-Plat.dc.html">{{c.nombre}}</a><span class="n2">{{c.email2}}</span></span>'
              '<span class="c1 n {{c.claseTel}}">{{c.tel}}</span><span class="c1 n">{{c.perfiles}}</span>'
              '<span class="dos"><span>{{c.ultimo}}</span><span class="n2">{{c.metodo}}</span></span>'
              '<span><span class="pill {{c.pill}}">{{c.textoEstado}}</span></span>')
    tabla(b, viejas, cols, ["Cuenta", "Teléfono", "Perfiles", "Último ingreso", "Estado"], celdas)
    # Sin nombre, el correo va arriba y la segunda línea queda vacía (como en Usuarios).
    b.rep("          nombre: c.n || '—',", "          nombre: c.n || c.email || '—',\n          email2: c.n ? (c.email || '') : '',")
    b.guardar(DOS_LINEAS)


def recuperaciones():
    b = Tablero("Recuperaciones")
    if b.hecho:
        return
    viejas = "140px minmax(0, 1.5fr) minmax(0, 1.5fr) minmax(0, 1.2fr) 120px 28px"
    cols = "minmax(0, 1.3fr) minmax(0, 1.5fr) minmax(0, 1.5fr) 140px 28px"
    celdas = ('<span class="dos"><sc-if value="{{r.hayCuenta}}" hint-placeholder-val="{{si}}"><a class="c1" href="Cuenta-Plat.dc.html">{{r.cuenta}}</a></sc-if>'
              '<sc-if value="{{r.sinCuenta}}" hint-placeholder-val="{{no}}"><span style="color: var(--t3);">Sin cuenta</span></sc-if><span class="n2">{{r.fecha}}</span></span>'
              '<span class="c1 n">{{r.antes}}</span><span class="c1 n">{{r.nuevo}}</span>'
              '<span><span class="pill {{r.pill}}">{{r.textoEstado}}</span></span>')
    tabla(b, viejas, cols, ["Cuenta", "Método de antes", "Método nuevo", "Estado"], celdas)
    b.guardar(DOS_LINEAS)


def cuenta_plat():
    b = Tablero("Cuenta-Plat")
    if b.hecho:
        return
    viejas = "110px minmax(0, 1.6fr) 100px minmax(0, 1.3fr) 120px minmax(0, 1.3fr)"
    cols = "minmax(0, 1.8fr) minmax(0, 1.3fr) 130px 200px"
    cab = b.entre('<div class="tt-h"', "</div>", b.t.index(f"grid-template-columns: {viejas};") - 60)
    b.rep(cab, f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Método</span><span>Administrado por</span><span>Verificado el</span><span>Estado</span></div>')
    fila = b.entre(f'<div class="tt-f" style="grid-template-columns: {viejas};">', "</div>")
    b.rep(fila, f'<div class="tt-f o-alto" style="grid-template-columns: {cols};">'
          '<span class="dos"><span class="c1">{{m.valor}}</span><span class="n2">{{m.tipoPrincipal}}</span></span>'
          '<span class="c1 n {{m.claseOrg}}">{{m.org}}</span><span class="c1 n">{{m.verificado}}</span>'
          '<span><span class="pill {{m.pill}}">{{m.estado}}</span></span></div>')
    b.rep("        principal: m.principal ? 'Principal' : '—',", "        principal: m.principal ? 'Principal' : '—',\n        tipoPrincipal: m.principal ? m.tipo + ' · Principal' : m.tipo,")
    b.guardar(DOS_LINEAS)


def auditoria_plat():
    b = Tablero("Auditoria-Plat")
    if b.hecho:
        return
    viejas = "140px minmax(0, 2.2fr) minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1.6fr) 28px"
    cols = "140px minmax(0, 2.4fr) minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1.6fr)"
    b.rep('<p class="res">{{resumen}}</p>', "")
    b.rep(f'<div class="tt-h" style="grid-template-columns: {viejas};"><span>Fecha y hora</span><span>Qué pasó</span><span>Sobre</span><span>Quién</span><span>Motivo</span><span class="sr">Detalle</span></div>',
          f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Fecha y hora</span><span>Qué pasó</span><span>Sobre</span><span>Quién</span><span>Motivo</span></div>')
    b.rep(f'<div class="tt-f" style="grid-template-columns: {viejas};">', f'<div class="tt-f" style="grid-template-columns: {cols};">')
    b.rep('<span class="c1">{{a.que}}</span>', '<button type="button" class="c1 o-link" aria-label="{{a.aria}}" onClick="{{a.ver}}">{{a.que}}</button>')
    b.rep(b.entre('<span class="der"><button type="button" class="ico-btn" aria-label="{{a.aria}}"', "</button></span>"), "")
    b.guardar(O_LINK)


def organizacion():
    """Ficha de una organización: quedan las pestañas (el usuario las prefiere a las secciones apiladas, 2026-10-03).
    Dueños en dos líneas, sin el texto que explica los módulos, y el primer módulo es WhatsApp."""
    b = Tablero("Organizacion")
    if b.hecho:
        return
    b.rep('<div class="pie"><span>Los módulos los define cada producto.</span></div>', "")
    b.rep("{ id: 'a', n: 'Módulo A',", "{ id: 'a', n: 'WhatsApp',")
    viejas = "minmax(0, 1.4fr) minmax(0, 2fr) minmax(0, 1.2fr) 120px"
    cols = "minmax(0, 2fr) minmax(0, 1.2fr) 160px"
    b.rep(f'<div class="tt-h" style="grid-template-columns: {viejas};"><span>Nombre</span><span>Correo</span><span>Último ingreso</span><span>Estado</span></div>',
          f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Dueño</span><span>Último ingreso</span><span>Estado</span></div>')
    b.rep(f'<div class="tt-f" style="grid-template-columns: {viejas};">\n                <span class="c1">Lucía Fernández</span>\n                <span class="c1 n">lucia.fernandez@delta.ejemplo.com</span>',
          f'<div class="tt-f o-alto" style="grid-template-columns: {cols};">\n                <span class="dos"><span class="c1">Lucía Fernández</span><span class="n2">lucia.fernandez@delta.ejemplo.com</span></span>')
    b.guardar(DOS_LINEAS)


# El detalle de un evento: los datos en una grilla con líneas (rótulo a la izquierda, sobre arena clara), no sueltos sobre blanco.
DETALLE = """.dlg .cambios { display: grid !important; grid-template-columns: 170px minmax(0, 1fr) !important; gap: 0 !important; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
.dlg .cambios > span, .dlg .cambios sc-for > span { padding: 10px 14px; border-top: 1px solid var(--borde); font-size: 13.5px; line-height: 1.45; color: var(--t1); }
.dlg .cambios .k { background: oklch(0.975 0.008 78); color: var(--t2) !important; font-weight: 500; border-right: 1px solid var(--borde); }
.dlg .cambios > span:nth-child(-n+2) { border-top: 0; }
.dlg .dlg-t:has(.cambios) { padding: 16px 20px 20px; }"""


def detalle_ordenado(nombre):
    b = Tablero(nombre)
    marca = f'data-vuelta="1004-detalle-{nombre}"'
    if marca in b.t:
        return
    assert '<div class="cambios">' in b.t, nombre
    b.rep("</helmet>", f"<style {marca}>\n{DETALLE}\n</style>\n</helmet>")
    b.ruta.write_text(b.t, encoding="utf-8")
    print("ok detalle", nombre)


def config_plat():
    b = Tablero("Config-Plat")
    if b.hecho:
        return
    b.rep('<div class="hoja" role="form" aria-label="Configuración de la plataforma">',
          '<div class="hoja" role="form" aria-label="Configuración de la plataforma">\n            <h2>Registro y altas</h2>')
    b.guardar()


def menu_whatsapp(nombre):
    """«WhatsApp» entre Gestión y Administración abre su panel (Chats, Contactos, Difusiones); la configuración de WhatsApp
    queda en el panel de Administración, bajo el título «WhatsApp» (Números, Bot, Equipos, Plantillas)."""
    b = Tablero(nombre)
    marca = f'data-vuelta="1004-menu-{nombre}"'
    if marca in b.t:
        return
    boton = ('<li><button type="button" class="ab-sidebar__link adm-btn {{plClaseWhatsapp}}" aria-controls="pl-panel" aria-expanded="{{plExpWhatsapp}}" '
             f'onClick="{{{{plAbrirWhatsapp}}}}">{WA}<span class="ab-sidebar__link-label">WhatsApp</span>'
             '<span style="margin-left: auto; font-size: 12px; font-weight: 600; color: var(--marca-tx);">1</span>' + FLECHA + "</button></li>")
    b.rep('<span class="ab-sidebar__link-label">Gestión</span>' + FLECHA + "</button></li></ul>",
          '<span class="ab-sidebar__link-label">Gestión</span>' + FLECHA + "</button></li>" + boton + "</ul>")

    def li(texto, href, icono, extra=""):
        return f'<li><a class="ab-sidebar__link" href="{href}">{icono}<span class="ab-sidebar__link-label">{texto}</span>{extra}</a></li>'

    cuenta = '<span style="margin-left: auto; font-size: 12px; font-weight: 600; color: var(--marca-tx);">1</span>'
    panel = ('<sc-if value="{{plEsWhatsapp}}" hint-placeholder-val="{{no}}"><div class="adm-cab"><strong>WhatsApp</strong>'
             f'<button type="button" class="adm-cerrar" aria-label="Cerrar WhatsApp" onClick="{{{{plCerrar}}}}">{VOLVER}</button></div>'
             '<nav class="ab-sidebar__nav" aria-label="WhatsApp"><ul class="ab-sidebar__list">'
             + li("Chats", "WA-Chats.dc.html", CHAT, cuenta) + li("Contactos", "WA-Contactos.dc.html", PERSONAS) + li("Difusiones", "WA-Difusiones.dc.html", MEGAFONO)
             + "</ul></nav></sc-if>")
    config = ('<span class="adm-sub">WhatsApp</span><ul class="ab-sidebar__list">' + li("Números", "WA-Admin.dc.html", WA) + li("Bot", "WA-Respuestas.dc.html", ROBOT)
              + li("Equipos", "WA-Equipos.dc.html", PERSONAS) + li("Plantillas", "WA-Plantillas.dc.html", DOC) + "</ul>")
    b.rep("</ul></nav></sc-if></aside>", "</ul>" + config + "</nav></sc-if>" + panel + "</aside>")
    b.rep("      plTitulo: s.plNav === 'gestion' ? 'Gestión' : 'Administración',",
          "      plTitulo: s.plNav === 'gestion' ? 'Gestión' : s.plNav === 'whatsapp' ? 'WhatsApp' : 'Administración',\n"
          "      plEsWhatsapp: s.plNav === 'whatsapp', plExpWhatsapp: s.plNav === 'whatsapp' ? 'true' : 'false',\n"
          "      plClaseWhatsapp: s.plNav === 'whatsapp' ? 'ab-sidebar__link--active' : '',\n"
          "      plAbrirWhatsapp: () => this.setState({ plNav: s.plNav === 'whatsapp' ? null : 'whatsapp' }),")
    b.rep("</helmet>", f"<style {marca}>\n.adm-sub {{ display: block; padding: 14px 12px 4px; font-size: 11.5px; font-weight: 600; color: var(--lado-t3, var(--t3)); }}\n</style>\n</helmet>")
    b.ruta.write_text(b.t, encoding="utf-8")
    print("ok menú", nombre)


if __name__ == "__main__":
    organizaciones()
    cuentas()
    recuperaciones()
    cuenta_plat()
    auditoria_plat()
    organizacion()
    config_plat()
    for n in ("Organizaciones", "Organizacion", "Cuentas", "Cuenta-Plat", "Recuperaciones", "Auditoria-Plat", "Legales", "Config-Plat"):
        menu_whatsapp(n)
    for n in ("Auditoria-Plat", "Auditoria-Org"):
        detalle_ordenado(n)
