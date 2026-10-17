"""E17 · ajuste en Cuenta-Plat y M-Cuenta-Plat: los permisos del operador suman «Administrar la biblioteca de formularios»
(platform.formtemplates.manage, del módulo Formularios), después de «Cambiar la configuración», en la lista y en «Cambiar permisos».
Se puede volver a correr."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
N = "Administrar la biblioteca de formularios"
D = "Armar, publicar y retirar las plantillas de formularios y sus categorías."
CONF = ("Cambiar la configuración", "Registro de personas y alta de organizaciones.")


def poner(nombre, viejo, nuevo, minimo):
    ruta = PROJ / nombre
    t = ruta.read_text(encoding="utf-8")
    if N in t:
        print(nombre, "ya tiene el permiso")
        return
    n = 0
    for a, b in zip(viejo, nuevo):
        c = t.count(a)
        t = t.replace(a, a + b)
        n += c
    assert n >= minimo, (nombre, n)
    ruta.write_text(t, encoding="utf-8")
    print(nombre, ":", n, "lugares")


q, d = CONF
poner("Cuenta-Plat.dc.html",
      [f'<div class="o-fila"><span class="dos"><span class="c1">{q}</span><span class="n2">{d}</span></span><span class="o-perm no">—</span></div>',
       f'<label class="op2"><input type="checkbox"><span><span class="opn">{q}</span><span class="opd">{d}</span></span></label>'],
      [f'<div class="o-fila"><span class="dos"><span class="c1">{N}</span><span class="n2">{D}</span></span><span class="o-perm no">—</span></div>',
       f'<label class="op2"><input type="checkbox"><span><span class="opn">{N}</span><span class="opd">{D}</span></span></label>'], 3)
poner("M-Cuenta-Plat.dc.html",
      [f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">{q}</span><span class="ap-perm no">—</span></span><span class="l2">{d}</span></div></div>'],
      [f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">{N}</span><span class="ap-perm no">—</span></span><span class="l2">{D}</span></div></div>'], 10)
