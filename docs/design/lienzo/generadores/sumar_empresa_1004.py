"""«Sumar empresa» de un usuario, como la app y Criterio · Formularios (lo marcó la Guía, 2026-10-04):
- «Empresa» es obligatoria: lleva el asterisco rojo (en la compu faltaba).
- «Roles en la empresa» aparece recién al elegir la empresa, porque los roles dependen de ella, y es opcional: sin asterisco (en el
  teléfono lo tenía). Se puede sumar una empresa sin roles, como muestra «Sin roles» en la ficha de la empresa.
Cambia Usuario (diálogo) y M-Usuario-Empresa (hoja). Lleva `data-vuelta="1004-sumar-empresa"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-sumar-empresa"'


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


def marcar(t):
    return rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")


ruta = PROJ / "Usuario.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '<sc-if value="{{dlgSumar}}" hint-placeholder-val="{{si}}"><div class="w-cmp"><span class="rt">Empresa</span>',
            '<sc-if value="{{dlgSumar}}" hint-placeholder-val="{{si}}"><div class="w-cmp"><span class="rt">Empresa <span class="req" style="margin-left: -4px;">*</span></span>')
    a = t.index('<div class="w-cmp"><span class="rt">Roles en la empresa<sc-if value="{{editDlgRoles}}"')
    # El campo de roles termina donde termina su w-cmp: se busca el cierre equilibrando los div.
    i, prof = a, 0
    while True:
        abre = t.find("<div", i)
        cierra = t.find("</div>", i)
        if abre != -1 and abre < cierra:
            prof += 1
            i = abre + 4
        else:
            prof -= 1
            i = cierra + len("</div>")
            if prof == 0:
                break
    t = t[:a] + '<sc-if value="{{conRolesDlg}}" hint-placeholder-val="{{si}}">' + t[a:i] + "</sc-if>" + t[i:]
    t = rep(t, "      dlgSumar: !!s.dlgEmp && s.dlgEmp.modo === 'sumar',\n",
            "      dlgSumar: !!s.dlgEmp && s.dlgEmp.modo === 'sumar',\n      // Los roles dependen de la empresa: el campo aparece al elegirla.\n      conRolesDlg: !!s.dlgEmpresa,\n")
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok Usuario")

ruta = PROJ / "M-Usuario-Empresa.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '<span>Roles en la empresa <span class="rq">*</span></span>', '<span>Roles en la empresa</span>')
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok M-Usuario-Empresa")
