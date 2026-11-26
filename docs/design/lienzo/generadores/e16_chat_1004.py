"""La E16 (Datos de las personas) con el traspaso 18, tanda 3A (2026-11-26): mandar un formulario desde el chat, en
`WA-Chats-Formulario-16` y `M-WA-Chats-Formulario-16`, redibujados en su lugar con la forma que la E14 dejó en `WA-Chats-Formulario` y su
teléfono (`e14_chats_formulario_1004.py`; spec `docs/plans/formularios/16-datos-de-las-personas.md`, «Enviar»):

- **el formulario se elige con la pieza (262)**, no con tarjetas que hacen de radios: cerrada, dice el elegido («Visita a cliente»);
- **del elegido se lee cada dato en su renglón (263)**, en la grilla de lectura del diálogo: «Versión», «Preguntas», las opciones de cada
  pregunta de catálogo (con su nombre como rótulo) y «Se puede mandar hasta». El motivo por el que no se puede mandar va en rojo en el
  renglón de la pregunta que lo causa («Proveedores a consultar»), en lugar de la caja de abajo: a Tomás le falta «Zona», el filtro dejó
  de funcionar, o es un cliente y la pregunta depende de un dato de la persona. «Enviar formulario» sigue apagado, y el mensaje y su
  contador no cambian.

Los tres estados de siempre («Le falta el dato», «El filtro no funciona» y «A un cliente»); no suma estados, porque los de elegir el
formulario y la lista del servidor ya están en los tableros de la E14. Escribe las medidas de antes de la escala en un bloque
`<style data-e16="t3">`, que lo frena si ya está, y al final corre `traspaso10_piezas_1004.py --tableros` con los dos, que pone la
escala de la compu. Para volver a correrlo, primero se restauran los dos (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca
`canvas.json`.
"""
import io
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import e14_chats_formulario_1004 as e14c  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-e16="t3"'
SUFIJO = " · para aprobar"
TABLEROS = ["WA-Chats-Formulario-16", "M-WA-Chats-Formulario-16"]

# La ventana de 24 horas de estos tableros (la de la E14 es otra fecha): `renglones` la lee del módulo al armar cada grilla.
e14c.HASTA = "26/10/2026, 10:48"
PREGUNTA = "Proveedores a consultar"  # la pregunta de catálogo de «Visita a cliente» con el filtro según quien lo recibe
MOTIVOS = {
    "Le falta el dato": "A Tomás le falta «Zona». Cargala en Datos de las personas.",
    "El filtro no funciona": "El filtro dejó de funcionar. Avisale a quien administra los formularios.",
    "A un cliente": "Depende de un dato de la persona: no se le puede mandar a un cliente.",
}
SPECS = {n: {"elegido": "Visita a cliente", "catalogos": [(PREGUNTA, m, True)]} for n, m in MOTIVOS.items()}
# Lo que se va de cada diálogo: las tarjetas que hacían de radios y la caja del problema, con su texto de antes.
ANTES = ["Proveedores a consultar: a Tomás le falta «Zona». Cargala en Datos de las personas.",
         "Proveedores a consultar: el filtro dejó de funcionar. Avisale a quien administra los formularios.",
         "Visita a cliente no se le puede mandar a un cliente: una pregunta depende de un dato de la persona."]


def leer(nombre):
    t = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in t else "\n"
    t = t.replace("\r\n", "\n")
    assert MARCA not in t, f"{nombre} ya tiene el bloque de la E16: restauralo antes de volver a correr"
    return t, nl


def con_css(t, css):
    m = re.search(r"<title>(.*?)</title>", t)
    assert not m.group(1).endswith(SUFIJO)
    t = t[:m.start(1)] + m.group(1) + SUFIJO + t[m.end(1):]
    return e14c.una(t, "</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


def rehacer(nombre, css, tel):
    t, nl = leer(nombre)
    t = e14c.rehacer_dialogos(t, SPECS, tel=tel)
    cuerpo = t[t.index("</helmet>"):t.index('<script type="text/x-dc"')]
    assert 'class="c-op' not in cuerpo and "p-prob" not in cuerpo and "t-prob2" not in cuerpo and not any(a in cuerpo for a in ANTES)
    assert all(m in cuerpo for m in MOTIVOS.values())
    e14c.escribir(nombre, con_css(t, css), nl)


if __name__ == "__main__":
    rehacer("WA-Chats-Formulario-16", e14c.CSS_COMPU, tel=False)
    rehacer("M-WA-Chats-Formulario-16", e14c.CSS_TEL, tel=True)
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
