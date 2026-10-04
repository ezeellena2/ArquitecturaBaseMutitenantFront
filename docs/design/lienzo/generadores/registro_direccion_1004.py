"""Registro de empresa, campo «Dirección de la página»: mide 44, con radio 10, como los demás campos de ingreso y registro
(Criterio · Formularios). `aplicar_criterio.py` lo había bajado a 36 con radio 8, como un campo interno, y con el borde medía 38. Lo
marcó la Guía en R1 (2026-10-04). Cambia Registro-Empresa y M-Registro-Empresa. Lleva `data-vuelta="1004-registro-direccion"`; si ya
la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-registro-direccion"'
CSS = f"<style {MARCA}>\n.in-pre {{ height: 44px; box-sizing: border-box; border-radius: 10px; }}\n</style>\n"

for nombre in ("Registro-Empresa", "M-Registro-Empresa"):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    assert 'class="in-pre' in t and t.count("</helmet>") == 1, nombre
    ruta.write_text(t.replace("</helmet>", CSS + "</helmet>"), encoding="utf-8")
    print("ok", nombre)
