"""La «Pantalla de error» de Criterio · Avisos en el teléfono (lo pidió la Guía, 2026-10-04: va a ser una pieza común). Es un estado
más de M-Error-Org, «No se pudo abrir»: dentro de la app, con ‹, el título de la pantalla y el camino; al centro, el círculo gris con el
ícono de alerta en rojo, como en el criterio, «No pudimos abrir esta pantalla» y «Reintentar». Lleva `data-vuelta="1004-error-pantalla-tel"`; si ya la tiene, no
se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-error-pantalla-tel"'
ALERTA = ('<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>')

ruta = PROJ / "M-Error-Org.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    a = t.index('<sc-if value="{{e1}}"')
    b = t.index("</sc-if>", a) + len("</sc-if>")
    bloque = t[a:b].replace('<sc-if value="{{e1}}"', '<sc-if value="{{e2}}"', 1)
    bloque = re.sub(r'<span class="f-circ">.*?</svg></span>', f'<span class="f-circ" style="color: oklch(0.55 0.2 25);">{ALERTA}</span>', bloque, count=1, flags=re.S)
    assert bloque.count("No encontramos esta página") == 1
    bloque = bloque.replace("No encontramos esta página", "No pudimos abrir esta pantalla")
    viejo = re.search(r'<a class="cb cb-pri f-btn" href="[^"]*">Ir al inicio</a>', bloque).group(0)
    bloque = bloque.replace(viejo, '<button type="button" class="cb cb-sec f-btn">Reintentar</button>')
    t = t[:b] + bloque + t[b:]
    t = t.replace('"options":["Sin permiso (403)","No encontrada (404)"]', '"options":["Sin permiso (403)","No encontrada (404)","No se pudo abrir"]', 1)
    viejo = '      e1: e === "No encontrada (404)",\n'
    assert t.count(viejo) == 1
    t = t.replace(viejo, viejo + '      e2: e === "No se pudo abrir",\n')
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok M-Error-Org")
