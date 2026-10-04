"""Tableros que habían quedado viejos frente al criterio (los señaló el front al programar las piezas compartidas, 2026-10-04):
- Pestañas: Criterio · Marco las pide subrayadas, con la cantidad en gris y sin etiqueta. Empresa, Organizacion y Cuenta-Plat las
  dibujaban como carpetas. Se pisa el estilo de `.tab2` en esos tres tableros.
- Íconos del panel Administración: los de Usuarios (edificio para Empresas, controles para Configuración, globo para Página pública y
  tablilla para Auditoría). Los tableros con el panel `w-panel` usaban otros. Solo se cambian dentro de ese panel: en los teléfonos de
  Plataforma el mismo dibujo es el ícono de Organizaciones y no se toca.
Cada tablero lleva `data-vuelta="1004-viejos-criterio"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-viejos-criterio"'

PESTANAS = """<style data-vuelta="1004-viejos-criterio">
.tabs2 { gap: 28px; padding: 0 4px; border-bottom: 1px solid var(--borde); }
.tab2 { height: 44px; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; color: var(--t2); font-size: 14px; font-weight: 500; gap: 6px; }
.tab2:hover { color: var(--t1); background: none !important; }
.tab2[aria-selected="true"] { color: var(--marca-tx); font-weight: 600; background: none !important; box-shadow: inset 0 -2px 0 var(--marca); }
.tab2 .cnt, .tab2[aria-selected="true"] .cnt { padding: 0 !important; border-radius: 0; background: none !important; color: var(--t3); font-size: 14px; font-weight: 400; }
</style>"""


def svg(d):
    return ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


ICONOS = {
    "Empresas": svg('<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 9h4a1 1 0 0 1 1 1v11"/><path d="M3 21h18"/><path d="M8 8h3"/><path d="M8 12h3"/><path d="M8 16h3"/>'),
    "Configuración": svg('<path d="M4 6h10"/><circle cx="16" cy="6" r="2"/><path d="M4 12h4"/><path d="M12 12h8"/><circle cx="10" cy="12" r="2"/><path d="M4 18h12"/><circle cx="18" cy="18" r="2"/>'),
    "Página pública": svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.6 3.5 5.5 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.5-3.5-8.5s1.1-5.9 3.5-8.5Z"/>'),
    "Auditoría": svg('<path d="M9 3.5h6v3H9z"/><path d="M15 5h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3"/><path d="M9 12h6"/><path d="M9 16h4"/>'),
}


def iconos_del_panel(t):
    cambios = 0

    def en_panel(m):
        nonlocal cambios
        panel = m.group(0)
        for nombre, icono in ICONOS.items():
            panel, n = re.subn(r'<svg width="18" height="18"[^>]*>(?:(?!</svg>).)*</svg> ' + re.escape(nombre) + "</a>", icono + " " + nombre + "</a>", panel, flags=re.S)
            cambios += n
        return panel

    t = re.sub(r'<aside class="w-panel"[^>]*>.*?</aside>', en_panel, t, flags=re.S)
    return t, cambios


c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
for clave, datos in sorted(c["boards"].items()):
    if datos.get("page") == "archivo" or clave.startswith("M-"):
        continue
    ruta = PROJ / clave
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    cambio = False
    if 'class="tab2"' in t:
        t = t.replace("</helmet>", PESTANAS + "\n</helmet>", 1)
        cambio = True
    if '<aside class="w-panel"' in t:
        t, n = iconos_del_panel(t)
        cambio = cambio or n > 0
    if cambio:
        if 'class="tab2"' not in t:
            t = t.replace("</helmet>", f"<style {MARCA}>\n</style>\n</helmet>", 1)
        ruta.write_text(t, encoding="utf-8")
        print("ok", clave)
