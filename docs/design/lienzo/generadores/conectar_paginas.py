"""Conecta las páginas del lienzo: el menú de usuario (Perfiles, Mi cuenta, Salir) en los tableros que lo tenían
dibujado sin enlaces, el menú de WhatsApp hacia el resto de Organización y la entrada «WhatsApp» en los menús de
Organización. Trabaja sobre los archivos ya generados y se puede volver a correr: lo que ya está conectado no se toca.
Uso: python conectar_paginas.py"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
SCR = pathlib.Path(__file__).resolve().parent
PROJ = SCR.parent  # docs/design/lienzo: los tableros y canvas.json

fuente = (SCR / "whatsapp_tableros.py").read_text(encoding="utf-8")
g = {"__file__": __file__}  # el mismo directorio: las rutas de whatsapp_tableros.py se resuelven igual
exec(fuente[:fuente.index("TABLEROS = {}")], g)
I = g["I"]

TABLEROS = set(json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))["boards"])


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


PERSONA = svg('<circle cx="12" cy="8" r="3.75"/><path d="M5 20a7 7 0 0 1 14 0"/>')
SALIR = svg('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h10"/>')
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16, "2.25")
WA_D = '<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>'
WA_20 = svg(WA_D, 20)

CSS = """  <style data-menu-usuario="">
/* Tu menú, arriba a la derecha (criterio de menús): se abre al tocar tu nombre. */
.w-umd { position: relative; }
.w-umd > summary { list-style: none; cursor: pointer; }
.w-umd > summary::-webkit-details-marker { display: none; }
.w-umd > summary:hover, .w-umd[open] > summary { background: oklch(0.24 0.014 78 / 0.06); }
.w-umd > summary.av-tel { display: inline-flex; border-radius: 50%; }
.w-mn { position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; width: 320px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 4px; display: flex; flex-direction: column; font-size: 13px; color: var(--t1); text-align: left; }
.w-mn .w-mn-it { display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 0 10px; border-radius: 6px; white-space: nowrap; color: var(--t1); text-decoration: none; }
.w-mn .w-mn-it:hover { background: var(--s2); }
.w-mn .w-mn-it[role="menuitemradio"] { min-height: 44px; }
.w-mn .w-mn-it svg { color: var(--t3); flex-shrink: 0; }
.w-mn .w-mn-it.on { background: var(--marca-t); color: var(--marca-tx); }
.w-mn .w-mn-it.on svg { color: var(--marca-tx); }
.w-mn .w-mn-it.apag { color: var(--t3); }
.w-mn .w-mn-sep { height: 1px; background: var(--borde); margin: 4px 0; }
.w-mn .w-mn-tit { padding: 8px 10px 4px; font-size: 12.5px; font-weight: 600; color: var(--t3); }
.w-mn .w-mn-cab { display: flex; align-items: center; gap: 10px; padding: 10px; }
.w-mn .w-mn-perf { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.w-mn .w-mn-perf b { font-weight: 600; }
.w-mn .w-mn-perf .s { font-size: 12.5px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; }
.w-mn .w-mn-it.on .w-mn-perf .s { color: var(--marca-tx); }
.w-mn .w-mn-ico { width: 28px; height: 28px; border-radius: 8px; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; flex-shrink: 0; }
.w-mn .w-mn-it.on .w-mn-ico { background: #fff; color: var(--marca-tx); }
.w-mn .w-mn-on { margin-left: auto; }
.w-tel .w-mn { width: 300px; right: -4px; }
  </style>"""


def destino(nombre, movil):
    """El tablero de teléfono si existe; si no, el de computadora."""
    return f"M-{nombre}.dc.html" if movil and f"M-{nombre}.dc.html" in TABLEROS else f"{nombre}.dc.html"


def menu(perfil, movil):
    correo = "lucia.fer@gmail.com" if perfil == "personal" else "lucia.fernandez@delta.ejemplo.com"

    def perfil_it(clave, ini, nombre, detalle, tablero, clase=""):
        on = perfil == clave
        return (f'<a class="w-mn-it{" on" if on else ""}{clase}" role="menuitemradio" aria-checked="{"true" if on else "false"}" href="{destino(tablero, movil)}">'
                f'<span class="w-mn-ico">{ini}</span><span class="w-mn-perf">{nombre}<span class="s">{detalle}</span></span>'
                f'{f"<span class=\"w-mn-on\">{TILDE}</span>" if on else ""}</a>')

    return (f'<div class="w-mn" role="menu" aria-label="Menú de Lucía Fernández">'
            f'<div class="w-mn-cab"><span class="w-av" style="width: 36px; height: 36px; font-size: 15px;">L</span>'
            f'<span class="w-mn-perf"><b>Lucía Fernández</b><span class="s">{correo}</span></span></div>'
            f'<div class="w-mn-sep" role="separator"></div><div class="w-mn-tit">Perfiles</div>'
            + perfil_it("personal", "P", "Personal", "Tu perfil personal", "Inicio-Personal")
            + perfil_it("delta", "GD", "Grupo Delta", "Dueño", "Inicio-Org")
            + perfil_it("beta", "BS", "Beta S.R.L.", "Suspendida", "Perfil-Suspendido", " apag")
            + f'<div class="w-mn-sep" role="separator"></div>'
            f'<a class="w-mn-it" role="menuitem" href="{destino("Cuenta", movil)}">{PERSONA} Mi cuenta</a>'
            f'<div class="w-mn-sep" role="separator"></div>'
            f'<a class="w-mn-it" role="menuitem" href="{destino("Ingreso", movil)}">{SALIR} Salir</a></div>')


def con_css(t):
    if "data-menu-usuario" in t:
        return t
    i = t.index("</helmet>")
    return t[:i] + CSS + "\n" + t[i:]


def menu_web(t, perfil):
    """El nombre de arriba a la derecha abre tu menú."""
    patron = r'<span class="um">(<span class="w-av">L</span><span class="tx"><b>[^<]*</b><span>[^<]*</span></span><svg.*?</svg>)</span>'
    t, n = re.subn(patron, lambda m: f'<details class="w-umd"><summary class="um" aria-label="Abrir tu menú">{m.group(1)}</summary>{menu(perfil, False)}</details>', t, flags=re.S)
    return con_css(t) if n else t, n


def menu_tel(t, perfil):
    """En el teléfono, el avatar de la barra abre tu menú."""
    patron = r'(<header class="w-tb">(?:(?!</header>).)*?)<span class="w-av chico">L</span>(</header>)'
    t, n = re.subn(patron, lambda m: f'{m.group(1)}<details class="w-umd"><summary class="av-tel" aria-label="Abrir tu menú"><span class="w-av chico">L</span></summary>{menu(perfil, True)}</details>{m.group(2)}', t, flags=re.S)
    return con_css(t) if n else t, n


def enlazar_span(t, texto, href, grupo=False):
    """Un renglón del menú dibujado como texto pasa a ser un enlace."""
    un_svg = r'<svg[^>]*>(?:(?!</svg>).)*</svg>'
    patron = (r'<span class="w-ln( [a-z]+)*">((?:' + un_svg + r')? ?' + re.escape(texto) + r'(?: ?<span class="(?:fl|cnt)">(?:' + un_svg + r'|[^<]*)</span>)?)</span>')
    return re.subn(patron, lambda m: f'<a class="w-ln{m.group(1) or ""}" href="{href}">{m.group(2)}</a>', t, count=1, flags=re.S)


def whatsapp_web(t):
    n = 0
    for texto, href in [("Inicio", "Inicio-Org.dc.html"), ("Gestión de usuarios", "Usuarios.dc.html"), ("Empresas", "Empresas.dc.html"),
                        ("Configuración", "Configuracion.dc.html"), ("Página pública", "Pagina-Org.dc.html"), ("Auditoría", "Auditoria-Org.dc.html")]:
        t, k = enlazar_span(t, texto, href)
        n += k
    return t, n


def whatsapp_menu_tel(t):
    n = 0
    for texto, href in [("Inicio", "M-Inicio-Org.dc.html"), ("Gestión de usuarios", "M-Usuarios.dc.html"), ("Empresas", "M-Empresas.dc.html"),
                        ("Configuración", "M-Configuracion.dc.html"), ("Página pública", "Pagina-Org.dc.html"), ("Auditoría", "M-Auditoria-Org.dc.html")]:
        t, k = enlazar_span(t, texto, href)
        n += k
    return t, n


def org_formulario_whatsapp(t):
    """Configuración y Página pública (tableros nuevos): WhatsApp en el menú principal y en Administración."""
    if "WA-Chats.dc.html" in t:
        return t, 0
    grupo_sb = f'<a class="w-ln grupo" href="WA-Chats.dc.html">{I["wa"]} WhatsApp <span class="fl">{I["der"]}</span></a>'
    grupo_adm = f'<a class="w-ln grupo" href="WA-Admin.dc.html">{I["wa"]} WhatsApp <span class="fl">{I["der"]}</span></a>'
    t, a = re.subn(r'(<a class="w-ln" href="Inicio-Org\.dc\.html">.*?</a>)(</nav>)', lambda m: m.group(1) + grupo_sb + m.group(2), t, count=1, flags=re.S)
    t, b = re.subn(r'(<a class="w-ln[^"]*" href="Auditoria-Org\.dc\.html">)', lambda m: grupo_adm + m.group(1), t, count=1)
    return t, a + b


def org_vieja_whatsapp(t, movil):
    """Tableros de Organización con el menú del tema: WhatsApp después de Inicio y en Administración, antes de Auditoría."""
    if "WA-Chats.dc.html" in t:
        return t, 0
    m_ = "M-" if movil else ""
    li_sb = f'<li><a class="ab-sidebar__link" href="{m_}WA-Chats.dc.html">{WA_20}<span class="ab-sidebar__link-label">WhatsApp</span></a></li>'
    li_adm = f'<li><a class="ab-sidebar__link" href="{m_}WA-Admin.dc.html">{WA_20}<span class="ab-sidebar__link-label">WhatsApp</span></a></li>'
    t, a = re.subn(r'(<li><a class="ab-sidebar__link[^"]*" href="' + m_ + r'Inicio-Org\.dc\.html"[^>]*>.*?</a></li>)',
                   lambda m: m.group(1) + li_sb, t, count=1, flags=re.S)
    t, b = re.subn(r'(<li><a class="ab-sidebar__link[^"]*" href="' + m_ + r'Auditoria-Org\.dc\.html")', lambda m: li_adm + m.group(1), t, count=1)
    return t, a + b


def beta_abre_su_pantalla(t, movil):
    """Un perfil que no está disponible, al tocarlo, abre la pantalla que lo explica (criterio de menús)."""
    href = destino("Perfil-Suspendido", movil)
    return re.subn(r'<span class="menu-it apagado"[^>]*>(<span class="ico-perfil">BS</span><span class="perfil-t">.*?</span></span>)</span>',
                   lambda m: f'<a class="menu-it apagado" role="menuitem" href="{href}">{m.group(1)}</a>', t, flags=re.S)


PERSONAL_WEB = ["Inicio-Personal", "Cuenta", "Cuenta-Agregar", "Cuenta-Verificar", "Cuenta-Baja"]
PERSONAL_TEL = ["M-Inicio-Personal", "M-Cuenta"]
WA_WEB = ["WA-Chats", "WA-Contactos", "WA-Contacto", "WA-Admin", "WA-Admin-Vacio", "WA-Respuestas", "WA-Admin-Editar", "WA-Plantillas"]
WA_TEL = ["M-WA-Menu", "M-WA-Chats", "M-WA-Contacto", "M-WA-Admin", "M-WA-Editar"]
ORG_NUEVOS_WEB = ["Configuracion", "Configuracion-Dominio", "Configuracion-Verificar", "Configuracion-Quitar", "Pagina-Org", "Pagina-Org-Despublicar"]
ORG_NUEVOS_TEL = ["M-Configuracion"]


def main():
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    org_viejos = [k[:-8] for k, v in canvas["boards"].items()
                  if v.get("page") == "org" and k[:-8] not in ORG_NUEVOS_WEB + ORG_NUEVOS_TEL]
    tocados = []

    def trabajar(nombre, *pasos):
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        cuentas = []
        for paso in pasos:
            t, n = paso(t)
            cuentas.append(n)
        ruta.write_text(t, encoding="utf-8")
        tocados.append(nombre)
        print(f"{nombre}: {cuentas}")

    for n in PERSONAL_WEB:
        trabajar(n, lambda t: menu_web(t, "personal"))
    for n in PERSONAL_TEL:
        trabajar(n, lambda t: menu_tel(t, "personal"))
    for n in WA_WEB:
        trabajar(n, lambda t: menu_web(t, "delta"), whatsapp_web)
    for n in WA_TEL:
        pasos = [lambda t: menu_tel(t, "delta")] + ([whatsapp_menu_tel] if n == "M-WA-Menu" else [])
        trabajar(n, *pasos)
    for n in ORG_NUEVOS_WEB:
        trabajar(n, lambda t: menu_web(t, "delta"), org_formulario_whatsapp)
    for n in ORG_NUEVOS_TEL:
        trabajar(n, lambda t: menu_tel(t, "delta"))
    for n in org_viejos:
        movil = n.startswith("M-")
        trabajar(n, lambda t, m=movil: org_vieja_whatsapp(t, m), lambda t, m=movil: beta_abre_su_pantalla(t, m))
    print("tocados:", len(tocados))


if __name__ == "__main__":
    main()
