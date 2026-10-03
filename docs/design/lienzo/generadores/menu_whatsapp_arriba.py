"""Corrección del 2026-10-03: WhatsApp vuelve arriba, debajo de Inicio; abajo, con la línea, queda solo Administración.

El usuario pidió que WhatsApp siga abriendo su segundo panel, pero arriba, porque Administración es configuración y
WhatsApp es de uso diario. Esto mueve la fila que pusieron `menu_whatsapp_panel.py` y `menu_whatsapp_panel_ab.py`;
los paneles y el estado del componente no cambian. Idempotente: si la fila ya está arriba, no hace nada.
Se corre desde `generadores/`.
"""
import glob
import os
import re

LIENZO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

# w-sb (escritorio): la fila de WhatsApp estaba dentro de .w-abajo
FILA_W = re.compile(r'<a class="w-ln[^"]*" href="WA-Chats\.dc\.html">(?:(?!</a>).)*?WhatsApp<span class="cnt">.*?</a>', re.S)
# ab-sidebar (escritorio): el <li> con el botón wa-btn estaba en la lista de Administración
LI_AB = re.compile(r'<li><button type="button" class="ab-sidebar__link wa-btn".*?</button></li>', re.S)
# ab-sidebar (teléfono): una lista aparte al principio de admin-grupo
UL_MOV = re.compile(r'<div class="admin-grupo">(<ul class="ab-sidebar__list">(<li><a class="ab-sidebar__link" href="M-WA-Chats\.dc\.html">.*?</li>)</ul>)', re.S)
# cajón del teléfono: el grupo (título + hijos) estaba al principio del nav de .w-abajo
GRUPO_CAJON = re.compile(r'(<div class="w-abajo"><nav class="w-nav" style="padding: 0;">)\s*(<span class="w-ln grupo">(?:(?!</span></span>).)*?WhatsApp<span class="fl">.*?</span></span>\s*<div class="w-hijos">.*?</div>)', re.S)


def w_sb(html):
    sb = re.search(r'<aside class="w-sb".*?</aside>', html, re.S)
    if not sb:
        return None
    lado = sb.group(0)
    ab = re.search(r'<div class="w-abajo">.*?</div><div class="w-us">', lado, re.S)
    if not ab:
        return None
    f = FILA_W.search(ab.group(0))
    if not f:
        return None
    lado = lado.replace(f.group(0), "", 1)
    lado = lado.replace('</nav><div class="w-esp">', f.group(0) + '</nav><div class="w-esp">', 1)
    return html[:sb.start()] + lado + html[sb.end():]


def ab_escritorio(html):
    m = LI_AB.search(html)
    if not m or '<div class="admin-grupo">' not in html:
        return None
    ya_arriba = html.find('</ul>', html.find('<nav class="ab-sidebar__nav" aria-label="Secciones">'))
    if m.start() < ya_arriba:
        return None
    html = html[:m.start()] + html[m.end():]
    marca = re.search(r'</ul>(\s*)<div class="admin-grupo">', html)
    return html[:marca.start()] + m.group(0) + html[marca.start():]


def ab_telefono(html):
    m = UL_MOV.search(html)
    if not m:
        return None
    html = html.replace(m.group(1), "", 1)
    marca = re.search(r'</ul>(\s*)<div class="admin-grupo">', html)
    return html[:marca.start()] + m.group(2) + html[marca.start():]


def cajon(html):
    m = GRUPO_CAJON.search(html)
    if not m:
        return None
    html = html[:m.start()] + m.group(1) + html[m.end():]
    marca = re.search(r'\s*</nav>\s*<div class="w-esp"></div>', html)
    return html[:marca.start()] + "\n      " + m.group(2) + html[marca.start():]


if __name__ == "__main__":
    n = 0
    for ruta in sorted(glob.glob(os.path.join(LIENZO, "*.dc.html"))):
        nombre = os.path.basename(ruta)
        if "-Anterior" in nombre:
            continue
        with open(ruta, encoding="utf-8", newline="") as f:
            html = f.read()
        for fn in (w_sb, ab_escritorio, ab_telefono, cajon):
            nuevo = fn(html)
            if nuevo:
                with open(ruta, "w", encoding="utf-8", newline="") as f:
                    f.write(nuevo)
                n += 1
                print("ok", nombre, fn.__name__)
                break
    print(n, "tableros")
