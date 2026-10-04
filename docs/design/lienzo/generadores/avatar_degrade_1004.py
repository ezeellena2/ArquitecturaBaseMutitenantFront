"""El círculo con la inicial de una persona lleva siempre el degradé de la marca, de `--marca` a `--marca-2` en 135°, como
`.avatar`, la app (`Avatar.tsx`) y `tema.md` (decisión del usuario del 2026-10-04; lo marcó la Guía en R1). Antes, `.w-av` (el pie y
la barra de arriba del marco del criterio y los teléfonos) y `.ap-nav .yo` (la inicial de la barra de abajo del teléfono) eran
lisos. No cambian el gris (`.w-av.g`), los círculos de íconos (`.av` con `--marca-t`) ni la ventana de Meta (`.mw-av`).
Lleva `data-vuelta="1004-avatar-degrade"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-avatar-degrade"'
DEGRADE = "linear-gradient(135deg, var(--marca) 0%, var(--marca-2) 100%)"
AV_LISO = re.compile(r"(?m)^\s*\.av \{[^}]*background: var\(--marca\);")

n = 0
for ruta in sorted(PROJ.glob("*.dc.html")):
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    selectores = []
    if re.search(r'class="w-av(?![-\w])', t):
        selectores.append(".w-av:not(.g)")
    if 'class="yo"' in t:
        selectores.append(".ap-nav .yo")
    if AV_LISO.search(t) and re.search(r'class="av(?![-\w])', t):
        selectores.append(".av")
    if not selectores:
        continue
    assert t.count("</helmet>") == 1, ruta.name
    css = f"<style {MARCA}>\n{', '.join(selectores)} {{ background: {DEGRADE}; }}\n</style>\n"
    ruta.write_text(t.replace("</helmet>", css + "</helmet>"), encoding="utf-8")
    n += 1
print("tableros", n)
