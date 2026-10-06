"""Nombre y apellido en dos campos (ADR 0046 del back, decidida por el usuario el 2026-10-06).
- Cuenta (y los tableros que la tienen de fondo: Cuenta-Agregar, Cuenta-Baja, Cuenta-Metodo y Cuenta-Verificar): «Tus datos» lleva
  «Nombre» y «Apellido»; los cuatro datos cortos van en una fila de cuatro columnas iguales, para no estirar los campos.
- M-Cuenta y sus hojas: «Nombre» y «Apellido», uno debajo del otro.
- Criterio · Formularios: los ejemplos de texto corto dicen «Nombre».
Los tableros que solo muestran el nombre siguen con el nombre armado, «Nombre Apellido».
Lleva `data-vuelta="1004-nombre-apellido"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import rep  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-nombre-apellido"'
CSS_PC = ".o-g4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }\n"
textos, css = {}, {}


def tocar(nombre):
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    return None if MARCA in t else t


# Cuenta: con los dos campos que se editan y su conducta.
t = tocar("Cuenta")
if t:
    t = rep(t, '<div class="o-g3"><div class="w-cmp" style="width: 360px;"><span class="rt">Nombre y apellido</span><input class="ct" style="font: inherit; color: var(--t1);" type="text" aria-label="Nombre y apellido" value="{{nombre}}" onChange="{{on_nombre}}"></div>',
            '<div class="o-g3 o-g4"><div class="w-cmp"><span class="rt">Nombre</span><input class="ct" style="font: inherit; color: var(--t1);" type="text" aria-label="Nombre" value="{{nombre}}" onChange="{{on_nombre}}"></div>'
            '<div class="w-cmp"><span class="rt">Apellido</span><input class="ct" style="font: inherit; color: var(--t1);" type="text" aria-label="Apellido" value="{{apellido}}" onChange="{{on_apellido}}"></div>')
    t = rep(t, "this.state = { nombre: 'Lucía Fernández', guardado: 'Lucía Fernández',",
            "this.state = { nombre: 'Lucía', guardado: 'Lucía', apellido: 'Fernández', guardadoA: 'Fernández',")
    t = rep(t, "      on_nombre: (e) => this.setState({ nombre: e.target.value }),\n",
            "      on_nombre: (e) => this.setState({ nombre: e.target.value }),\n      apellido: s.apellido,\n"
            "      on_apellido: (e) => this.setState({ apellido: e.target.value }),\n")
    t = rep(t, "      sucio: s.nombre !== s.guardado,\n      limpio: s.nombre === s.guardado,\n      descartar: () => this.setState({ nombre: s.guardado }),\n",
            "      sucio: s.nombre !== s.guardado || s.apellido !== s.guardadoA,\n      limpio: s.nombre === s.guardado && s.apellido === s.guardadoA,\n"
            "      descartar: () => this.setState({ nombre: s.guardado, apellido: s.guardadoA }),\n")
    t = rep(t, "this.setState({ guardado: s.nombre, aviso: 'Guardamos tus datos.' });", "this.setState({ guardado: s.nombre, guardadoA: s.apellido, aviso: 'Guardamos tus datos.' });")
    textos["Cuenta"], css["Cuenta"] = t, CSS_PC

# Los tableros con Mi cuenta de fondo.
for nombre in ["Cuenta-Agregar", "Cuenta-Baja", "Cuenta-Metodo", "Cuenta-Verificar"]:
    t = tocar(nombre)
    if not t:
        continue
    t = rep(t, '<div class="o-g3"><div class="w-cmp" style="width: 360px;"><span class="rt">Nombre y apellido</span><div class="ct">Lucía Fernández </div></div>',
            '<div class="o-g3 o-g4"><div class="w-cmp"><span class="rt">Nombre</span><div class="ct">Lucía</div></div><div class="w-cmp"><span class="rt">Apellido</span><div class="ct">Fernández</div></div>')
    textos[nombre], css[nombre] = t, CSS_PC

# Los teléfonos: un campo debajo del otro; el apellido es la última palabra.
for nombre in ["M-Cuenta", "M-Cuenta-Agregar", "M-Cuenta-Baja", "M-Cuenta-Metodo", "M-Cuenta-Verificar"]:
    t = tocar(nombre)
    if not t:
        continue
    t, n = re.subn(r'<div class="ap-cmp"><span class="rt"><span>Nombre y apellido</span></span><div class="ct">(.*?) (\S+)</div></div>',
                   r'<div class="ap-cmp"><span class="rt"><span>Nombre</span></span><div class="ct">\1</div></div>'
                   r'<div class="ap-cmp"><span class="rt"><span>Apellido</span></span><div class="ct">\2</div></div>', t)
    assert n >= 1, nombre
    textos[nombre], css[nombre] = t, ""

# Criterio · Formularios: los ejemplos.
t = tocar("Criterio-Formularios")
if t:
    t = rep(t, '<span class="rot">Nombre y apellido</span><div class="ctl">Lucía Fernández</div>', '<span class="rot">Nombre</span><div class="ctl">Lucía</div>', 2)
    t = rep(t, '<span class="rot">Nombre y apellido</span><div class="ctl mal">', '<span class="rot">Nombre</span><div class="ctl mal">')
    textos["Criterio-Formularios"], css["Criterio-Formularios"] = t, ""

for nombre, t in textos.items():
    assert t.count("</helmet>") == 1, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t.replace("</helmet>", f"<style {MARCA}>\n{css[nombre]}</style>\n</helmet>"), encoding="utf-8")
print("tableros", len(textos))
