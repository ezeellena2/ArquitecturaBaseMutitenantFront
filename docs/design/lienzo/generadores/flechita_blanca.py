"""Regla del 2026-10-03: el botón redondo que contrae y despliega el menú lateral (la flechita) va en blanco, con su borde arena.
Suma un estilo marcado `data-regla="flechita-blanca"` a cada tablero que lo tiene; no se repite. Corre al final, como menus_con_lineas.py.
En el código es `bg-[var(--lado-activo)]` en src/layouts/components/Sidebar.tsx."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-regla="flechita-blanca"'
ESTILO = f"""<style {MARCA}>
.ab-sidebar__toggle {{ background: #fff !important; border-color: var(--lado-borde) !important; color: var(--t2) !important; }}
</style>"""

n = 0
for ruta in sorted(PROJ.glob("*.dc.html")):
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t or "ab-sidebar__toggle" not in t:
        continue
    ruta.write_text(t.replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
    n += 1
print("ok", n, "tableros con la flechita del menú")
