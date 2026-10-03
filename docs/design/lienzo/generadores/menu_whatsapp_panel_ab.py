"""WhatsApp abajo, con la línea, en las pantallas con el menú `ab-sidebar` y en el cajón del teléfono (2026-10-03).

Continúa a `menu_whatsapp_panel.py`:
- escritorio con `ab-sidebar`: «WhatsApp» sale de arriba y va encima de «Administración», con su propio panel; los dos paneles
  se excluyen (uno abre y el otro cierra) con el estado del componente;
- teléfono con `ab-sidebar`: el enlace a WhatsApp baja al bloque de Administración (no hay segundo panel en el teléfono);
- cajón de M-WA-Menu: el grupo WhatsApp baja al bloque con la línea, encima de Administración.
Idempotente (marca `data-menu="wa-ab"`). No toca las versiones «-Anterior» (archivo). Se corre desde `generadores/`.
"""
import glob
import os
import re

LIENZO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def svg(d, w=20, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


CHAT = svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/>')
GENTE = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>')
MEGA = svg('<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>')
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 18)

ESTILO = """<style data-menu="wa-ab">
.wa-btn { cursor: pointer; user-select: none; width: 100%; border: 0; background: transparent; font-family: inherit; text-align: left; }
.wa-btn .adm-flecha { margin-left: auto; transition: transform 0.15s; }
.wa-btn .wa-cnt { margin-left: auto; font-size: 12px; font-weight: 600; color: oklch(0.43 0.09 195); }
.wa-btn .wa-cnt + .adm-flecha { margin-left: 8px; }
.ab-root .adm-panel.wa-panel { display: none; }
.ab-root.wa-abierto .adm-panel.wa-panel { display: flex; }
.ab-root.wa-abierto .wa-btn { background: var(--lado-activo) !important; color: var(--lado-activo-t) !important; font-weight: 600 !important; box-shadow: 0 1px 2px oklch(0.24 0.012 60 / 0.08), 0 0 0 1px var(--borde); }
.ab-root.wa-abierto .wa-btn .adm-flecha { transform: rotate(180deg); }
.ab-root.wa-abierto .ab-sidebar__toggle { display: none; }
.wa-panel .wa-cnt { margin-left: auto; font-size: 12px; font-weight: 600; color: oklch(0.43 0.09 195); }
</style>
"""

WA_LI = re.compile(r'<li><a class="ab-sidebar__link" href="(M-)?WA-Chats\.dc\.html">(<svg.*?</svg>)<span class="ab-sidebar__link-label">WhatsApp</span></a></li>', re.S)
ADM_LI = re.compile(r'<li><button type="button" class="ab-sidebar__link adm-btn"[^>]*>.*?</button></li>', re.S)
PANEL_FIN = re.compile(r'(<aside class="adm-panel" id="adm-panel".*?</aside>)', re.S)


def escritorio(html):
    m = WA_LI.search(html)
    a = ADM_LI.search(html)
    if not m or not a or m.group(1):
        return None
    icono = m.group(2)
    html = html[:m.start()] + html[m.end():]
    a = ADM_LI.search(html)
    boton = a.group(0)
    boton = boton.replace('adm-btn', 'wa-btn').replace('aria-controls="adm-panel"', 'aria-controls="wa-panel"')
    boton = boton.replace('{{admExp}}', '{{waExp}}').replace('{{alternarAdm}}', '{{alternarWa}}')
    boton = re.sub(r'<svg.*?</svg>', lambda _: icono, boton, count=1, flags=re.S)
    boton = boton.replace('>Administración<', '>WhatsApp<')
    boton = re.sub(r'(<span class="ab-sidebar__link-label">WhatsApp</span>)', lambda g: g.group(1) + '<span class="wa-cnt">2</span>', boton, count=1)
    html = html[:a.start()] + boton + html[a.start():]
    item = lambda href, ico, txt, cnt="": (f'<li><a class="ab-sidebar__link" href="{href}">{ico}<span class="ab-sidebar__link-label">{txt}</span>{cnt}</a></li>')
    panel = ('\n  <aside class="adm-panel wa-panel" id="wa-panel" aria-label="WhatsApp">\n'
             f'    <div class="adm-cab"><strong>WhatsApp</strong><button type="button" class="adm-cerrar" aria-label="Cerrar WhatsApp" onClick="{{{{alternarWa}}}}">{X}</button></div>\n'
             '    <nav class="ab-sidebar__nav" aria-label="WhatsApp"><ul class="ab-sidebar__list">'
             + item("WA-Chats.dc.html", CHAT, "Chats", '<span class="wa-cnt">2</span>')
             + item("WA-Contactos.dc.html", GENTE, "Contactos") + item("WA-Difusiones.dc.html", MEGA, "Difusiones")
             + '</ul></nav>\n  </aside>')
    p = PANEL_FIN.search(html)
    if not p:
        return None
    html = html[:p.end()] + panel + html[p.end():]
    html = html.replace('{{admClase}}"', '{{admClase}} {{waClase}}"', 1)
    html = html.replace('this.state = { adm:', 'this.state = { wa: false, adm:', 1)
    viejo = "alternarAdm: () => this.setState({ adm: !this.state.adm }),"
    if viejo not in html:
        return None
    html = html.replace(viejo, "alternarAdm: () => this.setState({ adm: !this.state.adm, wa: false }), "
                        "waClase: this.state.wa ? 'wa-abierto' : '', waExp: this.state.wa ? 'true' : 'false', "
                        "alternarWa: () => this.setState({ wa: !this.state.wa, adm: false }),", 1)
    return html.replace('<div class="ab-root', ESTILO + '<div class="ab-root', 1)


def telefono(html):
    m = WA_LI.search(html)
    if not m or not m.group(1):
        return None
    html = html[:m.start()] + html[m.end():]
    enlace = f'<ul class="ab-sidebar__list">{m.group(0)}</ul>'
    return html.replace('<div class="admin-grupo">', '<div class="admin-grupo">' + enlace, 1)


GRUPO_CAJON = re.compile(r'\s*<span class="w-ln grupo">(?:(?!</span></span>).)*?WhatsApp<span class="fl">.*?</span></span>\s*<div class="w-hijos">.*?</div>', re.S)


def cajon(html):
    if 'class="w-cajon"' not in html:
        return None
    g = GRUPO_CAJON.search(html)
    if not g:
        return None
    bloque = g.group(0).strip()
    html = html[:g.start()] + html[g.end():]
    marca = '<div class="w-abajo"><nav class="w-nav" style="padding: 0;">'
    if marca not in html:
        return None
    return html.replace(marca, marca + '\n      ' + bloque, 1)


if __name__ == "__main__":
    n = 0
    for ruta in sorted(glob.glob(os.path.join(LIENZO, "*.dc.html"))):
        nombre = os.path.basename(ruta)
        if "-Anterior" in nombre:
            continue
        with open(ruta, encoding="utf-8", newline="") as f:
            html = f.read()
        if 'data-menu="wa-ab"' in html or 'ab-sidebar' not in html and 'w-cajon' not in html:
            continue
        marcado = None
        for fn in (cajon, telefono, escritorio):
            marcado = fn(html)
            if marcado:
                break
        if not marcado:
            continue
        if 'data-menu="wa-ab"' not in marcado:
            marcado = marcado.replace('<div class="w-app', '<!-- data-menu="wa-ab" --><div class="w-app', 1) if 'w-cajon' in marcado else marcado
        with open(ruta, "w", encoding="utf-8", newline="") as f:
            f.write(marcado)
        n += 1
        print("ok", nombre)
    print(n, "tableros")
