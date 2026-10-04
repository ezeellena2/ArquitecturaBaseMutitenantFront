"""El rótulo de un campo en la compu, en 12,5 con interlineado 1,5 (18,75 px), como `.rot` de Criterio · Formularios. Los tableros
con `.w-cmp .rt` lo dibujaban con el interlineado normal (15 px), así que el campo quedaba 3 px más arriba que en la app. Lo marcó
la Guía en R1 (2026-10-04) para Cuenta y Configuración; vale para todos los tableros de la compu con esa pieza. Los teléfonos
(`.ap-cmp .rt`, de 13,5) no cambian. Lleva `data-vuelta="1004-rotulos"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-rotulos"'
CSS = f"<style {MARCA}>\n.w-cmp .rt, .o-ets .rt, .cmp .rt {{ line-height: 18.75px; }}\n</style>\n"

n = 0
for ruta in sorted(PROJ.glob("*.dc.html")):
    if ruta.name.startswith("M-"):
        continue
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t or 'class="rt"' not in t:
        continue
    if not any(s in t for s in (".w-cmp .rt {", ".o-ets .rt {", ".cmp .rt {")):
        continue
    assert t.count("</helmet>") == 1, ruta.name
    ruta.write_text(t.replace("</helmet>", CSS + "</helmet>"), encoding="utf-8")
    n += 1
    print("ok", ruta.stem)
print("tableros", n)
