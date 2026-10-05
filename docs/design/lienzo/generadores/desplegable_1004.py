"""Dónde se abre un desplegable (decisión del usuario del 2026-10-05, opción A): debajo del campo y del mismo ancho, como los filtros
y el ⋮ de una fila; la app lo cambia en una sola pieza (`Select` con `position="popper"`).
- Criterio · Formularios: la regla en la pieza «Desplegable».
- Los seis tableros con la pieza vieja de campo (`.campo2.envoltura` + `.menu.lista`): la lista medía lo que su texto (mínimo 200)
  porque `.menu` pisaba el `min-width: 100%` de `.lista`; ahora va del ancho del campo.
Lleva `data-vuelta="1004-desplegable"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import rep  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-desplegable"'
CSS = ".campo2.envoltura .menu.lista { left: 0; right: 0; width: auto; min-width: 0; max-width: none; }\n"

escritos = 0
for nombre in ["Config-Plat", "Empresa", "Empresas", "Legales", "Organizaciones", "Usuarios", "Criterio-Formularios"]:
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    css = ""
    if nombre == "Criterio-Formularios":
        t = rep(t, "<strong>Desplegable</strong><p>Elegir una opción de una lista. Con más de 10 opciones, suma un buscador arriba.</p>",
                "<strong>Desplegable</strong><p>Elegir una opción de una lista. Con más de 10 opciones, suma un buscador arriba. "
                "Se abre debajo del campo y del mismo ancho, como los filtros y el ⋮ de una fila.</p>")
    else:
        assert 'class="campo2 envoltura"' in t and 'class="menu lista"' in t, nombre
        css = CSS
    assert t.count("</helmet>") == 1, nombre
    ruta.write_text(t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>"), encoding="utf-8")
    escritos += 1
print("tableros", escritos)
