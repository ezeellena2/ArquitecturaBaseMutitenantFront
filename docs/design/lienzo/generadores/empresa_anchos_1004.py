"""Ficha de Empresa: los diálogos con uno o dos campos van en el ancho chico, 420 px, como pide Criterio · Diálogos (lo marcó la Guía,
2026-10-04). «Roles de …» (un campo) y «Agregar miembro» (dos) pasan de 560 a 420; «Editar empresa» (tres campos) queda en 560.
Lleva `data-vuelta="1004-empresa-anchos"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-empresa-anchos"'

ruta = PROJ / "Empresa.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    for d in ("dlgRoles", "dlgAgregar"):
        viejo = f'<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-{d}">'
        assert t.count(viejo) == 1, d
        t = t.replace(viejo, f'<div class="dlg chico" role="dialog" aria-modal="true" aria-labelledby="dlg-{d}">')
    assert t.count("</helmet>") == 1
    # La franja de error, con el ícono arriba si ocupa dos líneas.
    t = t.replace("</helmet>", f"<style {MARCA}>\n.aviso-mal {{ align-items: flex-start; }}\n.aviso-mal svg {{ margin-top: 1px; }}\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Empresa")
