"""WhatsApp pasa del menú lateral a un segundo panel, igual que Administración (2026-10-03).

Qué hace con cada tablero de escritorio que tiene el menú `w-sb`:
- saca el grupo «WhatsApp» (y sus hijos) de arriba, junto a Inicio;
- lo pone abajo, en el bloque con la línea (`w-abajo`), encima de Administración;
- si la pantalla es de WhatsApp (Chats, Contactos, Difusiones), abre el panel de WhatsApp al lado del menú.
Es idempotente: marca los tableros con `data-menu="wa-panel"`. Se corre desde `generadores/`.
"""
import glob
import os
import re

LIENZO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def svg(d, w=18, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>')
CHAT = svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/>')
GENTE = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>')
MEGA = svg('<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>')
DER = svg('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>', 14, "2")

ESTILO = ('<style data-menu="wa-panel">.w-abajo { display: flex; flex-direction: column; gap: 2px; } '
          '.w-ln .cnt + .fl { margin-left: 8px; }</style>')

# El grupo de WhatsApp del menú: un <span> o un <a> con la flecha, y a veces la lista de hijos.
GRUPO = re.compile(r'<(a|span) class="w-ln grupo"[^>]*>(?:(?!</\1>).)*?WhatsApp <span class="fl">.*?</svg></span></\1>'
                   r'(<div class="w-hijos">.*?</div>)?', re.S)
SIDEBAR = re.compile(r'<aside class="w-sb".*?</aside>', re.S)
ADMIN = re.compile(r'(<div class="w-abajo">)(<(?:a|span) class="w-ln[^"]*"[^>]*>(?:(?!</div>).)*?Administración)', re.S)


def panel(activo, cnt):
    def it(clave, href, ico, texto, extra=""):
        return f'<a class="w-ln{" on" if activo == clave else ""}" href="{href}">{ico} {texto}{extra}</a>'
    return ('<aside class="w-panel" aria-label="WhatsApp"><div class="pc">WhatsApp</div><nav class="w-nav">'
            + it("Chats", "WA-Chats.dc.html", CHAT, "Chats", f'<span class="cnt">{cnt}</span>' if cnt else "")
            + it("Contactos", "WA-Contactos.dc.html", GENTE, "Contactos")
            + it("Difusiones", "WA-Difusiones.dc.html", MEGA, "Difusiones")
            + '</nav></aside>')


def convertir(html):
    sb = SIDEBAR.search(html)
    if not sb or 'data-menu="wa-panel"' in html:
        return None
    lado = sb.group(0)
    g = GRUPO.search(lado)
    if not g or not ADMIN.search(lado):
        return None
    hijos = g.group(2) or ""
    activo = (re.search(r'<a class="w-ln on"[^>]*>(Chats|Contactos|Difusiones)', hijos) or [None, None])[1]
    cnt = (re.search(r'<span class="cnt">(\d+)</span>', hijos) or [None, "2"])[1]
    abierto = activo is not None
    lado = lado[:g.start()] + lado[g.end():]
    fila = (f'<a class="w-ln{" on" if abierto else ""}" href="WA-Chats.dc.html">{WA} WhatsApp'
            f'<span class="cnt">{cnt}</span><span class="fl">{DER}</span></a>')
    lado = ADMIN.sub(lambda m: m.group(1) + fila + m.group(2), lado, count=1)
    nuevo = ESTILO + lado + (panel(activo, cnt) if abierto else "")
    return html[:sb.start()] + nuevo + html[sb.end():]


if __name__ == "__main__":
    n = 0
    for ruta in sorted(glob.glob(os.path.join(LIENZO, "*.dc.html"))):
        with open(ruta, encoding="utf-8", newline="") as f:
            html = f.read()
        nuevo = convertir(html)
        if nuevo is None:
            continue
        with open(ruta, "w", encoding="utf-8", newline="") as f:
            f.write(nuevo)
        n += 1
        print("ok", os.path.basename(ruta))
    print(n, "tableros")
