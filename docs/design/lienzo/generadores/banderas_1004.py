"""Banderas en el selector de país de los teléfonos (decisión del usuario del 2026-10-04, la pasó «Paquete 0 · Errores visibles»):
cada país lleva su bandera, en la lista y en el control cerrado, que dice «[bandera] +54» en lugar de «AR +54». La bandera es una
imagen y no un emoji (en Windows el emoji se ve como «AR»): el mismo SVG 3:2 de `country-flag-icons` que usa la app, a 24×16.
Cambia los 13 tableros con un teléfono: Mi cuenta (agregar), Ingreso, Registro, Registro de empresa, Recuperar y Página pública de la
organización, en la compu y en el teléfono. No se toca la ventana de Meta (WA-Alta-Meta y WA-Alta-Coexistencia), que es de Meta.
Corre después de los generadores de esas pantallas. Lleva `data-vuelta="1004-banderas"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-banderas"'
# country-flag-icons/3x2/AR.svg
AR = ('<svg class="bandera" viewBox="0 0 513 342" width="24" height="16" aria-hidden="true"><path fill="#FFF" d="M0 0h512v342H0z"/>'
      '<path fill="#338AF3" d="M0 0h512v114H0zM0 228h512v114H0z"/><circle fill="#FFDA44" stroke="#d6ab00" stroke-width="5" cx="256.5" cy="171" r="40"/></svg>')
CSS = """<style data-vuelta="1004-banderas">
.bandera { width: 24px; height: 16px; border-radius: 2px; flex-shrink: 0; box-shadow: 0 0 0 1px oklch(0.24 0.014 78 / 0.12); vertical-align: -3px; }
.ban-pre { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
</style>"""
TABLEROS = ["Cuenta-Agregar", "M-Cuenta-Agregar", "Ingreso", "M-Ingreso", "Registro", "M-Registro", "Registro-Empresa", "M-Registro-Empresa",
            "Recuperar", "M-Recuperar", "Pagina-Org", "Pagina-Org-Despublicar", "M-Pagina-Org"]
PRE = f'<span class="ban-pre">{AR}+54</span>'

for nombre in TABLEROS:
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    cab, cuerpo = t.split("</helmet>", 1)
    n = 0
    # El control cerrado: «AR +54» (con o sin espacio antes del ícono que abre la lista).
    cuerpo, k = re.subn(r"AR \+54", PRE, cuerpo)
    n += k
    # La lista de países: «Argentina +54».
    cuerpo, k = re.subn(r'(role="option" aria-selected="true">)Argentina(<span class="c">\+54</span>)', r"\1" + AR.replace("\\", "\\\\") + r" Argentina\2", cuerpo)
    n += k
    assert n > 0, nombre
    # En M-Pagina-Org, consultas_1004.py separa después el país y el número en dos campos.
    t = cab + CSS + "\n" + f"<style {MARCA}>\n</style>\n</helmet>" + cuerpo
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre, n)
