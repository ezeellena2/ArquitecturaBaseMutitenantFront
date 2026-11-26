"""La E15, tanda 3A (2026-11-26): lo que se ve detrás de la respuesta y del tablero, igual a la planilla redibujada en
`FRM-Respuestas` (`e15_listados_1004.py`, que se importa y no se cambia).

- `FRM-Respuesta`: la planilla de atrás de la vista rápida, en sus ocho estados, con la barra y el encabezado de `FRM-Respuestas`:
  «Empresa» es un botón que abre la pieza (262), «Columnas» abre la pieza múltiple y «Ordenar por», último y separado de los
  filtros, dice «Recibida, más reciente primero» (264); el encabezado ordena con ↓ después de «Recibida».
- `FRM-Tablero`: su barra no es la de la planilla (no tiene «Columnas» ni «Ordenar por»: el tablero no ordena, y a la derecha va
  «Día | Semana | Mes»). De la planilla toma solo «Empresa», un botón que abre la pieza, como en `FRM-Respuestas`.

La banda («Respuestas · versión 4 publicada») no cambia: `FRM-Respuestas` la dejó igual.

Corre después de `e15_respuesta_1004.py`; el bloque `<style data-e15="t3f">` lo frena si ya está. Al final corre
`traspaso10_piezas_1004.py --tableros` con los que cambió. Para volver a correrlo, se restauran los dos tableros
(`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`) y se corren los dos scripts, en orden. No toca `canvas.json`.
"""
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e15_listados_1004 as e15l  # noqa: E402
import e15_respuesta_1004 as e15r  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
MARCA = '<style data-e15="t3f">'
leer, escribir, una = e15r.leer, e15r.escribir, e15r.una

# Lo propio de la planilla de `FRM-Respuestas`, sin las piezas de la base 2, que el bloque de `e15_respuesta_1004.py` ya trae.
assert e15l.CSS_PLANILLA.startswith(b2.CSS_B2)
CSS_FONDO = e15l.CSS_PLANILLA[len(b2.CSS_B2):]
CSS_TABLERO = e15l.CSS_POP


def con_css(t, css):
    assert MARCA not in t and e15r.MARCA in t, "falta correr antes e15_respuesta_1004.py"
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def frm_respuesta():
    t, nl = leer("FRM-Respuesta")
    t = con_css(t, CSS_FONDO)
    n = t.count('<div class="w-caja o-fb pl-fb">')
    assert n == len(e15r.estados(t)), n
    t = e15l.encabezados(e15l.barras(t))
    cuerpo = t.split("</helmet>")[1]
    assert cuerpo.count(f">{e15l.ORDEN_RECIBIDA} ") == n and cuerpo.count('<span class="b2-fl" aria-hidden="true">↓</span>') == n
    assert 'class="w-pil" role="button" aria-haspopup="listbox">Empresa' not in cuerpo
    escribir("FRM-Respuesta", t, nl)


def frm_tablero():
    t, nl = leer("FRM-Tablero")
    t = con_css(t, CSS_TABLERO)
    m = e15l.EMPRESA.search(t)
    assert m and m.group(2) == "Empresa", m and m.group(0)[:200]
    con, texto, svg = m.groups()
    t = t[:m.start()] + (f'<span class="f-env"><button type="button" class="w-pil{con or ""}" aria-haspopup="listbox" '
                         f'aria-expanded="false">{texto} {svg}</button>') + t[m.end():]
    assert not e15l.EMPRESA.search(t)
    escribir("FRM-Tablero", t, nl)


if __name__ == "__main__":
    hechos = []
    for nombre, hacer in (("FRM-Respuesta", frm_respuesta), ("FRM-Tablero", frm_tablero)):
        t, _ = leer(nombre)
        if MARCA in t:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        hacer()
        hechos.append(nombre)
    if hechos:
        subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(hechos)], check=True)
