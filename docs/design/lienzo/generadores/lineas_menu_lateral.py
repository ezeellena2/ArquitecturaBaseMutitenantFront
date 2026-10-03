"""Regla del 2026-10-03: en el menú lateral y en su segundo panel va una línea fina entre cada opción, como la que separa
Administración, para distinguir las opciones más fácil. Suma un estilo marcado `data-regla="lineas-menu-lateral"`
a cada tablero con menú lateral; no se repite. Corre al final, como menus_con_lineas.py y flechita_blanca.py."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-regla="lineas-menu-lateral"'
ESTILO = f"""<style {MARCA}>
.ab-sidebar__list > li + li, .ab-sidebar__children > li + li {{ border-top: 1px solid var(--lado-borde); padding-top: 2px; }}
.w-nav > .w-ln, .w-hijos > .w-ln, .w-abajo > .w-ln {{ position: relative; }}
.w-nav > .w-ln + .w-ln::before, .w-nav > .w-hijos + .w-ln::before, .w-hijos > .w-ln + .w-ln::before, .w-abajo > .w-ln + .w-ln::before {{
  content: ""; position: absolute; left: 0; right: 0; top: -2px; height: 1px; background: oklch(0.87 0.022 75); }}
</style>"""

n = 0
for ruta in sorted(PROJ.glob("*.dc.html")):
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t or ("ab-sidebar__list" not in t and 'class="w-nav"' not in t):
        continue
    ruta.write_text(t.replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
    n += 1
print("ok", n, "tableros con menú lateral")
