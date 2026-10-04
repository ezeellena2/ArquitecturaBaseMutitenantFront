"""Mi cuenta › Agregar, estado «WhatsApp: elegir el país»: sin el buscador «Buscar país» mientras la lista tenga un solo país
(decisión del usuario del 2026-10-04, la marcó «Paquete 0 · Errores visibles»). Criterio · Formularios pide el buscador recién con
más de 10 opciones, y `SearchSelect` lo muestra igual; la semilla habilita solo Argentina. Queda la fila de Argentina, elegida con el
tilde, en la compu y en la hoja del teléfono. Corre después de paises_lista_1004.py. Lleva `data-vuelta="1004-paises-sin-buscador"`;
si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-paises-sin-buscador"'
BUSCADORES = {
    "Cuenta-Agregar": re.compile(r'<div class="bus"><svg[^>]*>.*?</svg><span>Buscar país</span></div>', re.S),
    "M-Cuenta-Agregar": re.compile(r'<div class="ap-bus"><svg[^>]*>.*?</svg> Buscar país</div>', re.S),
}

for nombre, buscador in BUSCADORES.items():
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    t, n = buscador.subn("", t)
    assert n == 1 and "Buscar país" not in t, (nombre, n)
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre)
