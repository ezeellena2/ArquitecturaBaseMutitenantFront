"""«Visita a cliente», versión 4, también en sus editores (decisión 287, 2026-11-26), sin decisión nueva: sigue a
`v189_formularios_1004.py`, que dejó una sola versión 4 en la carga (`FRM-Cargar-Respuesta-21`) y en la respuesta
(`FRM-Respuesta-Aprobacion`, `-Corregir` y `-Anular`): «Datos» con Cliente, Fecha de la visita, Correo del cliente y Ubicación de
la visita; «Resultado de la visita» con ¿Se concretó la venta?, Monto estimado, Motivo, Fallas y Observaciones; y «Fotos y
documentos». A los editores de esa versión les faltaba la ubicación; lo demás (el monto, el orden) ya era así.

1. **`FRM-Editor-21` y `M-FRM-Editor-21`:** la lista de preguntas de «Visita a cliente · versión 4» suma «Ubicación de la visita»
   (Ubicación, no obligatoria) después de «Correo del cliente», como cuarta, y las que siguen corren un número (de 4–10 a 5–11).
   La fila es la de «Monto estimado» de la misma lista con el nombre y el tipo de la ubicación, que da la misma fila que dibuja
   `FRM-Editor-Ubicacion` (se comprueba); en el teléfono, la tarjeta de «Monto estimado» con el tipo «Ubicación». En la compu,
   en «El tipo «Correo»» y «Tipos de respuesta: menú»; en el teléfono, en «El formulario». «El tipo en el bloque» es de «Pedido
   de materiales» y no cambia.
   Los títulos («Resultado de la visita») no se suman: ningún editor del lienzo dibuja un título como fila de la lista de
   preguntas (solo el botón «Agregar título»), y dibujarlo sería pieza nueva. Ninguna regla ni estado de estos tableros nombra
   una pregunta de «Visita a cliente» por su número.
2. **`FRM-Editor-Reglas` y `M-FRM-Reglas`, «Agregar dato»:** la lista ofrece el número y las preguntas, «sin fotos ni
   documentos», y «una «Ubicación» va con el punto y, en el renglón siguiente, el enlace al mapa» (spec de la E21, «El mensaje con
   datos», 149 y 230): suma «Ubicación de la visita» después de «Correo del cliente», y la cantidad pasa a «10 datos». Lo que
   excluye la ubicación es la variable de una plantilla («sin el bloque ni la ubicación», 197 y 230), que estos tableros no
   abren.

Sin cambios, porque ya están bien: `FRM-Editor-Reglas-Bloque` y `M-FRM-Reglas-Bloque` listan las preguntas de «Pedido de
materiales», no las de «Visita a cliente»; y `FRM-Pdf`, en «Preguntas de El resultado», ofrece ¿Se concretó la venta?, Monto
estimado, Motivo, Fallas y Observaciones, las de la versión 4 (las secciones del PDF, «La visita» y «El resultado», son otra cosa
y se quedan).

Sin altos nuevos: en `FRM-Editor-21` la lista suma un renglón (41 px), y «El tipo en el bloque», con 14 filas y la lista de tipos
abierta, ya entra en el mismo 1400; el teléfono se desplaza; las dos listas de «Agregar dato» suman una opción y siguen enteras
(la de la compu, debajo de su tope de 320 px; la del teléfono, dentro de 844).

Corre una vez: cada tablero suma `<style data-t3b="v189-version4">` y, si ya lo tiene, no cambia. Lee y escribe sin cambiar los
finales de línea.

Uso: `python v189_version4_1004.py`
"""
import io
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from e14_editor_1004 import cierre  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
MARCA = 'data-t3b="v189-version4"'
UBIC = "Ubicación de la visita"
# La versión 4, en el orden del editor (sin la ubicación, antes de esta corrida).
V4_ANTES = ["Cliente", "Fecha de la visita", "Correo del cliente", "¿Se concretó la venta?", "Monto estimado", "Motivo", "Fallas",
            "Observaciones", "Fotos de la visita", "Remito firmado"]
DATOS_ANTES = ["Número", "Cliente", "Fecha de la visita", "Correo del cliente", "¿Se concretó la venta?", "Monto estimado", "Motivo",
               "Fallas", "Observaciones"]


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    t = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in t else "\n"
    return t.replace("\r\n", "\n"), nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def con_marca(t, css):
    assert MARCA not in t
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def cuerpo_de(t):
    """(inicio, fin) de lo que se ve: entre `</helmet>` y el guion."""
    return t.index("</helmet>"), t.index('<script type="text/x-dc"')


def tablero(nombre, css, cambiar):
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return
    print(nombre)
    t = con_marca(t, css)
    a, b = cuerpo_de(t)
    c = cambiar(t[a:b])
    escribir(nombre, t[:a] + c + t[b:], nl)


def en_cuerpo(c, cambiar_lista, abre, cuenta):
    """Aplica `cambiar_lista` a cada contenedor que abre con `abre` (una expresión) y tiene la versión 4; devuelve el cuerpo."""
    partes, pos, n = [], 0, 0
    for m in re.finditer(abre, c):
        if m.start() < pos:
            continue
        fin = cierre(c, m.start(), "div")
        nuevo = cambiar_lista(c[m.start():fin])
        if nuevo is None:
            continue
        partes += [c[pos:m.start()], nuevo]
        pos, n = fin, n + 1
    assert n == cuenta, (n, cuenta)
    return "".join(partes) + c[pos:]


# ---------------------------------------------------------------------------------------------------------------- 1 · el editor
CSS_EDITOR = """/* v189 · «Visita a cliente», versión 4, como la carga y la respuesta: «Ubicación de la visita» después de «Correo del cliente»
   (spec de la E20 y de la E21). */
"""
FILA = r'<div class="q-it"><span class="num">(\d+)</span><span class="dato"><b>([^<]*)</b>'


def fila_de_referencia():
    """La fila cerrada de la ubicación en `FRM-Editor-Ubicacion` (la versión 3, donde es la tercera)."""
    u, _ = leer("FRM-Editor-Ubicacion")
    i = u.index(f'<div class="q-it"><span class="num">3</span><span class="dato"><b>{UBIC}</b>')
    return u[i:cierre(u, i, "div")]


def lista_compu(caja):
    filas = [(m.start(), int(m.group(1)), m.group(2)) for m in re.finditer(FILA, caja)]
    if [f[2] for f in filas] != V4_ANTES:
        return None
    assert [f[1] for f in filas] == list(range(1, 11)), [f[1] for f in filas]
    # La fila nueva: la de «Monto estimado» con el nombre, el número y el tipo de la ubicación.
    m0 = filas[4][0]
    monto = caja[m0:cierre(caja, m0, "div")]
    assert monto.count('<span class="q-tp">Número</span>') == 1 and '<span class="q-ob">No</span>' in monto
    nueva = (monto.replace("Monto estimado", UBIC).replace('<span class="q-tp">Número</span>', '<span class="q-tp">Ubicación</span>')
             .replace('<span class="num">5</span>', '<span class="num">4</span>', 1))
    ref = fila_de_referencia().replace('<span class="num">3</span>', '<span class="num">4</span>', 1)
    assert nueva == ref, "la fila no es la de FRM-Editor-Ubicacion"
    # Va después de «Correo del cliente», cerrada o abierta (`q-ab`, con su editor).
    c0 = filas[2][0]
    abierta = caja.endswith('<div class="q-ab">', 0, c0)
    if abierta:
        c0 -= len('<div class="q-ab">')
    c1 = cierre(caja, c0, "div")
    resto = re.sub(r'(<div class="q-it"><span class="num">)(\d+)(</span>)', lambda m: f"{m.group(1)}{int(m.group(2)) + 1}{m.group(3)}",
                   caja[c1:])
    caja = caja[:c1] + nueva + resto
    despues = [(int(m.group(1)), m.group(2)) for m in re.finditer(FILA, caja)]
    assert despues == list(enumerate(V4_ANTES[:3] + [UBIC] + V4_ANTES[3:], 1)), despues
    print(f"  la lista con «{UBIC}»", "(«Correo del cliente» abierta)" if abierta else "")
    return caja


def editor_compu(c):
    return en_cuerpo(c, lista_compu, r'<div class="w-caja"><div class="f-cab"><span>Preguntas</span>', 2)


TARJETA = r'<div class="b2-tj q-tj"><span class="num">(\d+)</span><span class="nm">([^<]*)</span>'


def lista_tel(grupo):
    tarjetas = [(m.start(), int(m.group(1)), m.group(2)) for m in re.finditer(TARJETA, grupo)]
    if [x[2] for x in tarjetas] != V4_ANTES:
        return None
    assert [x[1] for x in tarjetas] == list(range(1, 11)), [x[1] for x in tarjetas]
    m0 = tarjetas[4][0]
    monto = grupo[m0:cierre(grupo, m0, "div")]
    tipo = '<span class="k">Tipo</span><span class="v">Número</span>'
    assert monto.count(tipo) == 1 and '<span class="k">Obligatoria</span><span class="v">No</span>' in monto
    nueva = (monto.replace("Monto estimado", UBIC).replace(tipo, '<span class="k">Tipo</span><span class="v">Ubicación</span>')
             .replace('<span class="num">5</span>', '<span class="num">4</span>', 1))
    c1 = cierre(grupo, tarjetas[2][0], "div")
    resto = re.sub(r'(<div class="b2-tj q-tj"><span class="num">)(\d+)(</span>)',
                   lambda m: f"{m.group(1)}{int(m.group(2)) + 1}{m.group(3)}", grupo[c1:])
    grupo = grupo[:c1] + nueva + resto
    despues = [(int(m.group(1)), m.group(2)) for m in re.finditer(TARJETA, grupo)]
    assert despues == list(enumerate(V4_ANTES[:3] + [UBIC] + V4_ANTES[3:], 1)), despues
    print(f"  las tarjetas con «{UBIC}»")
    return grupo


def editor_tel(c):
    return en_cuerpo(c, lista_tel, r'<div class="ap-grupo">', 1)


# ---------------------------------------------------------------------------------------------------------------- 2 · las reglas
CSS_REGLAS = """/* v189 · «Agregar dato» de «Visita a cliente», versión 4, con «Ubicación de la visita» (spec de la E21, 149 y 230: va con
   el punto y el enlace al mapa). */
"""


def sumar_dato(lista, op_re, nombre_de):
    """Copia la opción de «Correo del cliente» con el nombre de la ubicación, justo después, y pasa a «10 datos»."""
    ops = [(m.start(), nombre_de(m)) for m in re.finditer(op_re, lista)]
    if [o[1] for o in ops] != DATOS_ANTES:
        return None
    assert lista.count('role="status">9 datos</div>') == 1, "sin «9 datos»"
    i = ops[3][0]
    j = cierre(lista, i, "div")
    correo = lista[i:j]
    assert correo.count("Correo del cliente") == 1 and ' act"' not in correo and " sep" not in correo
    lista = lista[:j] + correo.replace("Correo del cliente", UBIC) + lista[j:]
    lista = lista.replace('role="status">9 datos</div>', 'role="status">10 datos</div>')
    despues = [nombre_de(m) for m in re.finditer(op_re, lista)]
    assert despues == DATOS_ANTES[:4] + [UBIC] + DATOS_ANTES[4:], despues
    print(f"  «Agregar dato» con «{UBIC}»: 10 datos")
    return lista


OP_COMPU = r'<div class="b2-op[^"]*" role="option" aria-selected="(?:true|false)"><span class="mk" aria-hidden="true"></span><span class="tx"><span>([^<]*)</span>'
OP_TEL = r'<div class="op[^"]*" role="option" aria-selected="(?:true|false)"><span class="mk"></span><span class="n2"><span>([^<]*)</span>'


def reglas_compu(c):
    return en_cuerpo(c, lambda x: sumar_dato(x, OP_COMPU, lambda m: m.group(1)), r'<div class="b2-pkl barra" role="listbox">', 1)


def reglas_tel(c):
    return en_cuerpo(c, lambda x: sumar_dato(x, OP_TEL, lambda m: m.group(1)), r'<div class="acc-pk" role="dialog" aria-label="Agregar dato">', 1)


# ---------------------------------------------------------------------------------------------------------------- correr
if __name__ == "__main__":
    tablero("FRM-Editor-21", CSS_EDITOR, editor_compu)
    tablero("M-FRM-Editor-21", CSS_EDITOR, editor_tel)
    tablero("FRM-Editor-Reglas", CSS_REGLAS, reglas_compu)
    tablero("M-FRM-Reglas", CSS_REGLAS, reglas_tel)
