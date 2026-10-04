"""Mi cuenta › Agregar (compu), estado «WhatsApp: elegir el país»: la lista de países con las filas de Criterio · Formularios, como
la arma `SearchSelect` en la app (lo pidió «Paquete 0 · Errores visibles», 2026-10-04). La fila pasa de 42 px, 13,5 y sin radio a
36 px de alto mínimo, 13 px, relleno 4 y 10, radio 6 y la elegida en 500; la lista lleva 4 px alrededor. El buscador es un campo
dentro de la lista (gris, con borde y la lupa adentro), como en la app, y `role="listbox"` va solo en las filas. La lista muestra
solo Argentina porque es el único país habilitado en la semilla. M-Cuenta-Agregar no cambia: en el teléfono es una hoja.
Corre después de cuenta_wa_1004.py y banderas_1004.py. Lleva `data-vuelta="1004-paises-lista"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-paises-lista"'
CSS = f"""<style {MARCA}>
.o-paises .bus {{ position: relative; display: block; height: auto; padding: 8px; border-bottom: 1px solid var(--borde); }}
.o-paises .bus svg {{ position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--t3); }}
.o-paises .bus span {{ display: flex; align-items: center; height: 32px; box-sizing: border-box; padding: 0 12px 0 32px; border: 1px solid var(--borde2); border-radius: 8px; background: var(--s2); color: var(--t3); font-size: 13px; }}
.o-paises .ops {{ padding: 4px; }}
.o-paises .op {{ min-height: 36px; box-sizing: border-box; padding: 4px 10px; border-radius: 6px; font-size: 13px; color: var(--t1); background: transparent; font-weight: 400; }}
.o-paises .op[aria-selected="true"] {{ background: var(--marca-t); color: var(--marca-tx); font-weight: 500; }}
.o-paises .op svg:last-child:not(.bandera) {{ flex-shrink: 0; }}
</style>"""


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


ruta = PROJ / "Cuenta-Agregar.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '<div class="o-paises" role="listbox" aria-label="País"><div class="bus">', '<div class="o-paises"><div class="bus">')
    i = t.index('<div class="o-paises"><div class="bus">')
    # El texto del buscador va en su campo; las filas, en su propia lista.
    a = t.index(" Buscar país</div>", i)
    t = t[:a] + "<span>Buscar país</span></div>" + t[a + len(" Buscar país</div>"):]
    b = t.index('<div class="op" role="option"', i)
    fin = t.index("</div></div>", b) + len("</div>")
    t = t[:b] + '<div class="ops" role="listbox" aria-label="País">' + t[b:fin] + "</div>" + t[fin:]
    t = rep(t, "</helmet>", CSS + "\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Cuenta-Agregar")
