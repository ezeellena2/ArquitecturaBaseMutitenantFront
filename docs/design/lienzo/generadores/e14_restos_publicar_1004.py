"""Un resto de la E14 del traspaso 18, tanda 3A (lienzo v187, 2026-11-26): el editor que se ve detrás de `FRM-Publicar`,
`FRM-Publicando` y `FRM-Vista-Oficial`, como el redibujado y aprobado de `FRM-Editor` (`e14_editor_1004.py`). Los tableros ya están
aprobados (285): esto solo los alinea con lo aprobado, sin « · para aprobar».

- **Las preguntas en columnas (263):** el número, el nombre, el tipo y «Obligatoria», cada uno en su columna y con su encabezado, y
  ya no debajo del nombre («Número · 2 decimales · Opcional»), ni la columna vacía de los chips; lo que iba debajo («3 opciones»,
  «2 decimales», «hasta 600 caracteres») no va en la fila (285). ↑ ↓ ✎ 🗑 siguen a la vista (127 y 261), y un título de sección
  ocupa el nombre, el tipo y «Obligatoria». Se reusan `filas_compu` y el CSS de `e14_editor_1004.py`, así la fila queda igual a la
  de `FRM-Editor`.
- **Lo que se elige, en la pieza cerrada (262):** «Para quién es» y, en «Con cambios sin guardar» de `FRM-Publicar` (la pregunta
  abierta), «Tipo de respuesta», con lo elegido.
- **La pregunta que WhatsApp rechazó** (`FRM-Publicando`, «WhatsApp rechazó una pregunta»), como la tarjeta de `M-FRM-Editor`:
  «Corregir» al lado del nombre y, debajo, su motivo en rojo, como el error de un campo (263 deja debajo solo el error de un campo),
  en lugar de la (i) con el motivo en la columna de los chips; el tipo y «Obligatoria», en sus columnas.

El contenido propio de cada modal (Publicar, Publicando, la vista oficial) no cambia: no tiene nada que se elija con radios, un
segmentado o un `<select>`; la lista de la vista oficial imita WhatsApp y queda afuera de la 262. `M-FRM-Vista-Oficial` es de
pantalla completa y no muestra el editor detrás: no cambia. El teléfono del editor que publica es `M-FRM-Editor`, que ya está.

Escribe las medidas de antes de la escala en un bloque `<style data-e14="t3p">`, que lo frena si ya está, y al final corre
`traspaso10_piezas_1004.py --tableros` con sus tableros. Para volver a correrlo, primero se restauran sus tableros
(`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
"""
import io
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e14_editor_1004 as e14  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-e14="t3p"'
SVG = r"<svg\b[^>]*>(?:(?!</svg>).)*</svg>"  # un solo ícono: nunca cruza su `</svg>`
TABLEROS = []

CSS_RECHAZADA = """
/* E14 · t3p · La pregunta que WhatsApp rechazó, como la tarjeta de M-FRM-Editor: «Corregir» al lado del nombre y, debajo, su motivo
   en rojo, como el error de un campo (263). */
.q-it .dato b .ab-chip { margin-left: 8px; vertical-align: 1px; }
.q-it.mal .dato > .q-err { color: var(--peligro); font-size: 13px; line-height: 1.4; white-space: normal; overflow: visible; }
"""


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    t = s.replace("\r\n", "\n")
    assert MARCA not in t, f"{nombre} ya tiene el bloque: restauralo antes de volver a correr"
    return t, nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    TABLEROS.append(nombre)
    print("ok", nombre, len(t))


def partir(t):
    """La cabeza (hasta `</helmet>`), el cuerpo y el guion."""
    i, j = t.index("</helmet>"), t.index('<script type="text/x-dc"')
    return t[:i], t[i:j], t[j:]


def con_css(cab, css):
    assert "</helmet>" not in cab
    return cab + f"<style {MARCA}>\n{css}</style>\n"


# ---------------------------------------------------------------------------------------------------------------- el editor detrás
def rechazadas(cuerpo, cuantas):
    """La fila que WhatsApp rechazó: «Corregir» junto al nombre, el motivo debajo y el tipo y «Obligatoria» en sus columnas."""
    patron = (r'<div class="q-it mal"><span class="num">(\d+)</span><span class="dato"><b>([^<]+)</b><span>([^<]+)</span></span>'
              r'<span class="chips"><span class="ab-chip mal">Corregir</span><span class="f-i" tabindex="0" role="img" '
              r'aria-label="([^"]+)" title="\4">' + SVG + r'</span></span>')

    def fila(m):
        num, nombre, desc, motivo = m.groups()
        tipo, ob = e14.tipo_y_obligatoria(desc)
        return (f'<div class="q-it mal"><span class="num">{num}</span><span class="dato"><b>{nombre}'
                f'<span class="ab-chip mal">Corregir</span></b><span class="q-err">{motivo}</span></span>'
                f'<span class="q-tp">{tipo}</span><span class="q-ob">{ob}</span>')
    cuerpo, n = re.subn(patron, fila, cuerpo, flags=re.S)
    assert n == cuantas and cuerpo.count('class="q-it mal"') == cuantas, (n, cuantas)
    return cuerpo


def editor_detras(nombre, piezas, mal=0):
    """Un modal con el editor de `FRM-Editor` detrás: las filas en columnas (263) y lo que se elige en la pieza cerrada (262)."""
    t, nl = leer(nombre)
    cab, cuerpo, guion = partir(t)
    cuerpo = rechazadas(cuerpo, mal)
    cuerpo = e14.filas_compu(cuerpo)
    cuerpo, n = re.subn(r'<div class="ct sel( mal)?">([^<]*)' + SVG + r'</div>',
                        lambda m: b2.campo(m.group(2), error=bool(m.group(1)), aria=e14.aria_de(m.group(2))), cuerpo, flags=re.S)
    assert n == piezas, (nombre, n, piezas)
    for viejo in ('class="chips"', 'class="ct sel', "2 decimales · ", " · Opcional</span>", " · Obligatoria</span>", "<select",
                  'role="radiogroup"', "q-rd", "q-chips", "Agregar campo"):
        assert viejo not in cuerpo, (nombre, viejo)
    css = "/* E14 · t3p: el editor de detrás, como `FRM-Editor`. */\n" + e14.CSS_COMPU + (CSS_RECHAZADA if mal else "")
    escribir(nombre, con_css(cab, css) + cuerpo + guion, nl)


if __name__ == "__main__":
    editor_detras("FRM-Publicar", piezas=13)
    editor_detras("FRM-Publicando", piezas=15, mal=1)
    editor_detras("FRM-Vista-Oficial", piezas=5)
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
