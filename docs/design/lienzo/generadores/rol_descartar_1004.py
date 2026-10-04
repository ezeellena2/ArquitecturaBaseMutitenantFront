"""Rol y M-Rol con los botones de una edición (decisión del usuario del 2026-10-04, P63 contra R20): editar algo que ya existe
lleva «Descartar cambios», que deja los campos como estaban guardados sin salir; crear algo nuevo lleva «Cancelar», que vuelve a la
lista. En Rol: «Descartar cambios» al editar un rol y «Cancelar» al crearlo. En M-Rol (que edita): «Descartar cambios».
Corre después de los generadores de Organización (`org_vuelta_1002.py`, `org_telefonos_1004.py`).
Lleva `data-vuelta="1004-rol-descartar"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-rol-descartar"'


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


def marcar(t):
    return rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")


ruta = PROJ / "Rol.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '<a class="cb cb-sec" href="Roles.dc.html">Cancelar</a>',
            '<sc-if value="{{esNuevo}}" hint-placeholder-val="{{no}}"><a class="cb cb-sec" href="Roles.dc.html">Cancelar</a></sc-if>'
            '<sc-if value="{{noEsNuevo}}" hint-placeholder-val="{{si}}"><button type="button" class="cb cb-sec" onClick="{{descartar}}">Descartar cambios</button></sc-if>')
    t = rep(t, "      textoGuardar: s.guardando ? 'Guardando…' : m.nuevo ? 'Crear rol' : 'Guardar cambios',\n",
            "      textoGuardar: s.guardando ? 'Guardando…' : m.nuevo ? 'Crear rol' : 'Guardar cambios',\n"
            "      esNuevo: !!m.nuevo,\n      noEsNuevo: !m.nuevo,\n"
            "      descartar: () => this.setState({ ...g, elegidos: [...g.elegidos], errNombre: '', errVale: '', errPermisos: '', abierto: null }),\n")
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok Rol")

ruta = PROJ / "M-Rol.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Cancelar</button>',
            '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button>')
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok M-Rol")
