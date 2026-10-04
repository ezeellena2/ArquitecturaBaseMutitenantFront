"""Auditoría de Plataforma y de la organización sin cantidades en los filtros (regla R8, decisión del usuario del 2026-10-04):
lo que solo crece se pide de a tandas con «Cargar más», sin total y sin la cantidad de cada opción de filtro, como el código.
Lleva `data-vuelta="1004-auditoria-sin-cantidades"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-auditoria-sin-cantidades"'
CANTIDAD = '<span class="menu-cnt">{{o.c}}</span>'

for nombre in ("Auditoria-Plat", "Auditoria-Org"):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    assert t.count(CANTIDAD) == 3, (nombre, t.count(CANTIDAD))
    t = t.replace(CANTIDAD, "")
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre)
