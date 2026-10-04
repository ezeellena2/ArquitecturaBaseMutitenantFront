"""Dos correcciones que decidió el usuario el 2026-10-04 (las pasó la Guía al cerrar el teléfono como app):
- Mi cuenta › «Cómo entrás»: el ⋮ va solo si la fila tiene acciones, como el back. El principal, cuando es el único método
  personal, no lo lleva (no se puede quitar ni hacer principal). El correo de la empresa sí («Hacer principal» y «Quitar»), y el
  teléfono sin verificar también («Quitar»). Antes, Cuenta lo ponía en las tres filas y M-Cuenta solo en el principal. No se toca
  Cuenta-Metodo, donde hay otro correo personal.
- Rol: «Vale en toda la organización» y «Vale en cada empresa», en minúscula, como la app y el teléfono.
Cada tablero lleva `data-vuelta="1004-correcciones-cuenta-rol"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-correcciones-cuenta-rol"'


def marcar(t):
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")


PRINCIPAL_PC = re.compile(r'<button type="button" class="ib" aria-label="Acciones de lucia\.fer@gmail\.com"><svg.*?</svg></button>', re.S)
for nombre in ("Cuenta", "Cuenta-Agregar", "Cuenta-Baja", "Cuenta-Verificar"):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    t, n = PRINCIPAL_PC.subn("", t)
    assert n >= 1, nombre
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok", nombre, n)

PRINCIPAL_TEL = re.compile(r'<button type="button" class="ap-ib" aria-label="Acciones de lucia\.fer@gmail\.com">(<svg.*?</svg>)</button>', re.S)
EMPRESA = '<b>lucia.fernandez@delta.ejemplo.com</b><span>Administrado por Grupo Delta</span></span></div>'
TELEFONO = 'style="text-decoration: none;">Verificar</a></div>'
for nombre in ("M-Cuenta", "M-Cuenta-Agregar", "M-Cuenta-Baja", "M-Cuenta-Verificar"):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    m = PRINCIPAL_TEL.search(t)
    assert m, nombre
    kebab = m.group(1)
    t, n = PRINCIPAL_TEL.subn("", t)
    def boton(quien):
        return f'<button type="button" class="ap-ib" aria-label="Acciones de {quien}">{kebab}</button>'
    e = t.count(EMPRESA)
    t = t.replace(EMPRESA, EMPRESA[:-len("</div>")] + boton("lucia.fernandez@delta.ejemplo.com") + "</div>")
    f = t.count(TELEFONO)
    t = t.replace(TELEFONO, TELEFONO[:-len("</div>")] + boton("011 15-5555-4521") + "</div>")
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok", nombre, "principal", n, "empresa", e, "teléfono", f)

ruta = PROJ / "Rol.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    viejo = "detalle: m.nuevo ? '' : 'Vale en ' + LUGARES[g.vale] + ' · '"
    assert t.count(viejo) == 1
    t = t.replace(viejo, "detalle: m.nuevo ? '' : 'Vale en ' + (g.vale === 'org' || g.vale === 'cada' ? LUGARES[g.vale].charAt(0).toLowerCase() + LUGARES[g.vale].slice(1) : LUGARES[g.vale]) + ' · '")
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok Rol")
