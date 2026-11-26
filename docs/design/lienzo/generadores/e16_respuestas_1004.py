"""La planilla de la E16 (Datos de las personas) con el traspaso 18, tanda 3A (2026-11-26): lo que la E15 acaba de redibujar en
`FRM-Respuestas` y `M-FRM-Respuestas` (`e15_listados_1004.py`) se ve igual acá, con las mismas funciones, y encima lo propio de la
E16: la subcolumna de un campo de papel «Filtro» sale apagada y se prende en «Columnas»; el teléfono no tiene columnas (spec de la
E16, «El papel de un campo», y F6 del plan).

- `FRM-Respuestas-16` («Pedir repuesto», el formulario con «Proveedor», cuyo campo «Zona» tiene el papel «Filtro»): «Empresa» es un
  filtro con su botón, que abre la pieza (262); «Columnas» pasa de la lista de casillas a la pieza múltiple de la E15, con sus grupos,
  N° apagada con su motivo (211) y «Mostrar todas» al pie, y ahora con el buscador y la cantidad, «11 columnas», porque con
  «Proveedor · Zona» son más de diez (262); «Ordenar por», último y separado de los filtros, dice «Recibida, más reciente primero»
  (264), y el encabezado ordena con ↓ después de «Recibida», el orden sin elegir. Lo de la E16 sigue en sus dos estados: «Columnas»,
  con «Proveedor · Zona» sin tildar y fuera de la tabla, y «Prendida», con la casilla tildada y la columna en la tabla; en
  «Prendida», el ↕ al pasar sobre «Proveedor · Zona» dice que la subcolumna de un filtro, una vez prendida, ordena como cualquier
  dato sellado (264 y la spec de la E15: «los campos sellados … ordenan»). No suma estados.
- `M-FRM-Respuestas-16`: era el teléfono de la E15 con otro título (el teléfono no tiene «Columnas», así que lo de la E16 no se ve
  ahí). Pasa entero por `e15_listados_1004.m_frm_respuestas`: cada fila es una tarjeta con Recibida, Cargó, Empresas o «Es cliente»
  y Cliente, sin datos unidos con «·» (263 y 206); «Ordenar por», a todo el ancho arriba de la lista, con su pantalla (264);
  «Filtros», con cada filtro con su nombre y la pieza, y la pieza de una pregunta del servidor con el buscador (262); la hoja de
  exportar, sin «Columnas». Suma, como la E15, «Filtros: una pregunta del servidor» y «Ordenar por».

Cambia los tableros en su lugar; no corre dos veces (el bloque `data-e16="t3r"` lo marca). Al final corre
`traspaso10_piezas_1004.py --tableros` con los dos, que pone la escala de la compu. Para volver a correrlo, primero se restauran los
dos tableros (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json` ni `e15_listados_1004.py`: lo importa y,
para el teléfono, le presta por un momento el tablero de la E16 y esta marca.
"""
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import e12_editor_1004 as e12e  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e15_listados_1004 as e15  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
MARCA = '<style data-e16="t3r">'
TABLEROS = ["FRM-Respuestas-16", "M-FRM-Respuestas-16"]
leer, escribir, una = e12l.leer, e12l.escribir, e12l.una
sc_ifs = e12e.sc_ifs
ZONA = "Proveedor · Zona"


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def casilla(bloque, nombre):
    """Si la opción `nombre` de la pieza múltiple de «Columnas» está tildada."""
    m = re.search(r'<div class="b2-op[^"]*" role="option" aria-selected="(true|false)"[^>]*>(?:(?!</div>).)*?<span>'
                  + re.escape(nombre) + r'</span>', bloque, re.S)
    assert m, nombre
    return m.group(1) == "true"


def frm_respuestas_16():
    t, nl = leer("FRM-Respuestas-16")
    t = e15.para_aprobar(con_css(t, e15.CSS_PLANILLA))
    # La barra y el encabezado de la E15: «Empresa» y «Columnas» en la pieza (262); «Ordenar por», último (264); ↓ en «Recibida».
    t = e15.encabezados(e15.barras(t))
    # «Prendida»: la subcolumna del filtro ordena como cualquier dato sellado; ↕ al pasar sobre ella (264).
    for a, b in reversed(sc_ifs(t, "s1")):
        if '<div class="w-th pl">' in t[a:b]:
            t = t[:a] + e15.encabezados(t[a:b], hov=ZONA) + t[b:]

    # Lo de la E16: «Proveedor · Zona», sin tildar y fuera de la tabla en «Columnas»; tildada y en la tabla en «Prendida».
    (a0, b0), = [x for x in sc_ifs(t, "s0") if "b2-pkl" in t[x[0]:x[1]]]
    (a1, b1), = [x for x in sc_ifs(t, "s1") if "b2-pkl" in t[x[0]:x[1]]]
    s0, s1 = t[a0:b0], t[a1:b1]
    assert not casilla(s0, ZONA) and casilla(s1, ZONA) and casilla(s0, "Proveedor · CUIT")
    th = [re.search(r'<div class="w-th pl">.*?</div>', s, re.S).group(0) for s in (s0, s1)]
    assert ZONA not in th[0] and ZONA in th[1]
    assert f'<span class="b2-hov">{ZONA}<span class="b2-fl hov" aria-hidden="true">↕</span></span>' in s1
    for s in (s0, s1):
        assert s.count("11 columnas") == 1 and s.count('aria-sort="descending">Recibida<span class="b2-fl"') == 1
        assert s.count("Ordenar por: Recibida, más reciente primero") == 1
    sin_css = re.sub(r"<style\b.*?</style>", "", t, flags=re.S)
    assert "mf-ck" not in sin_css and 'role="menu" aria-label="Columnas"' not in sin_css and 'role="menuitemcheckbox"' not in sin_css
    assert t.count("b2-fl hov") == 1
    escribir("FRM-Respuestas-16", t, nl)


def m_frm_respuestas_16():
    """El teléfono de la E15, con las funciones de `e15_listados_1004` sobre el tablero de la E16 y esta marca."""
    previo = (e15.leer, e15.escribir, e15.MARCA)

    def leer_16(nombre):
        assert nombre == "M-FRM-Respuestas", nombre
        return leer("M-FRM-Respuestas-16")

    def escribir_16(nombre, t, nl):
        assert nombre == "M-FRM-Respuestas", nombre
        assert "Respuestas · teléfono · etapa 16 · para aprobar</title>" in t
        escribir("M-FRM-Respuestas-16", t, nl)

    e15.leer, e15.escribir, e15.MARCA = leer_16, escribir_16, MARCA
    try:
        e15.m_frm_respuestas()
    finally:
        e15.leer, e15.escribir, e15.MARCA = previo


if __name__ == "__main__":
    for nombre, f in (("FRM-Respuestas-16", frm_respuestas_16), ("M-FRM-Respuestas-16", m_frm_respuestas_16)):
        if MARCA in leer(nombre)[0]:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        f()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
