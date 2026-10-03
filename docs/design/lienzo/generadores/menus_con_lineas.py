"""Regla del 2026-10-03: en los menús desplegables (⋮, tu menú, «Pasar a») va una línea fina entre cada opción.
Suma un estilo marcado `data-regla="menus-con-lineas"` a cada tablero con menús; no se repite. Corre al final, después de los demás generadores."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-regla="menus-con-lineas"'
# Cada opción lleva una línea arriba y se corre un píxel hacia arriba: la de la primera queda tapada por el borde del menú,
# aunque las opciones estén envueltas en <sc-if> y no sean hermanas directas.
ESTILO = f"""<style {MARCA}>
.menu[role="menu"] {{ padding: 0; overflow: hidden; }}
.menu[role="menu"] .menu-it {{ border-radius: 0; min-height: 42px; padding: 8px 14px; border-top: 1px solid var(--borde); margin-top: -1px; }}
.menu[role="menu"] .menu-sep {{ height: 6px; margin: 0; background: var(--s2); border-top: 1px solid var(--borde); }}
.o-menu {{ padding: 0; overflow: hidden; }}
.o-menu .it {{ border-radius: 0; }}
.o-menu .it + .it {{ border-top: 1px solid var(--borde); }}
</style>"""

n = 0
for ruta in sorted(PROJ.glob("*.dc.html")):
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t or ("menu-it" not in t and "o-menu" not in t):
        continue
    ruta.write_text(t.replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
    n += 1
print("ok", n, "tableros con menús")
