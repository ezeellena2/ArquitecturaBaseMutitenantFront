"""Tres puntos de los diálogos que marcó la Guía en R2b (2026-10-04). Entran en la tanda que aprobó el usuario.
- El cuerpo de un diálogo, con 20 de margen y 14 entre campos, como dice Criterio · Diálogos («Cuerpo: 20 px de margen; campos de
  36 px, con 14 px entre uno y otro»). La pieza vieja (`.dlg-b`, de Usuarios, Empresas, Empresa y el resto de los tableros con el
  marco viejo) usaba 16 y 20 de margen y 12 entre filas; la del criterio (`.p-dlg .db`), 16 arriba. No se toca Archivo.
- «Sumar empresa» (Usuario): «Sumar» ya no se apaga sin empresa, porque Criterio · Botones no apaga un botón. Si se toca sin elegir
  la empresa, el campo se pone rojo y dice «Elegí una empresa.». Se va al elegir una.
- M-Usuario-Empresa: «Roles en la empresa» lleva la casilla «Todos» a la derecha, como en la compu y en la app.
Lleva `data-vuelta="1004-dialogos-r2b"`; si ya la tiene, no se toca."""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-dialogos-r2b"'


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


def marcar(t, css=""):
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


paginas = {k: v.get("page") for k, v in json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))["boards"].items()}
for ruta in sorted(PROJ.glob("*.dc.html")):
    nombre = ruta.name[:-len(".dc.html")]
    if paginas.get(ruta.name) == "archivo":
        continue
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    css = ""
    if 'class="dlg-b' in t:
        css += ".dlg-b { padding: 20px; gap: 14px; }\n"
    if 'class="p-dlg' in t and 'class="db"' in t:
        css += ".p-dlg .db { padding: 20px; gap: 14px; }\n"
    if nombre == "Usuario":
        t = rep(t, "'Elegí una empresa', { alElegir: () => ({ dlgRoles: [] }) })",
                "'Elegí una empresa', { error: s.errDlgEmp ? 'Elegí una empresa.' : '', alElegir: () => ({ dlgRoles: [], errDlgEmp: false }) })")
        t = rep(t, "noAceptaDlgEmp: !s.dlgEmpresa,", "noAceptaDlgEmp: false,")
        t = rep(t, "cerrarDlgEmp: () => this.setState({ dlgEmp: null, abierto: null })",
                "cerrarDlgEmp: () => this.setState({ dlgEmp: null, abierto: null, errDlgEmp: false })")
        t = rep(t, "aceptarDlgEmp() {\n    const s = this.state;\n    if (!s.dlgEmpresa) return;",
                "aceptarDlgEmp() {\n    const s = this.state;\n    // Sin empresa no se apaga «Sumar»: avisa en el campo (Criterio · Botones).\n    if (!s.dlgEmpresa) { this.setState({ errDlgEmp: true, abierto: null }); return; }")
    if nombre == "M-Usuario-Empresa":
        t = rep(t, '<span class="rt"><span>Roles en la empresa</span></span>',
                '<span class="rt"><span>Roles en la empresa</span><label class="ap-todos"><span class="ap-chk"></span>Todos</label></span>')
        css += (".ap-todos { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--t2); }\n"
                ".ap-todos .ap-chk { width: 20px; height: 20px; box-sizing: border-box; border-radius: 6px; border: 1.5px solid var(--borde2); background: #fff; }\n")
    if not css and nombre != "Usuario":
        continue
    ruta.write_text(marcar(t, css), encoding="utf-8")
    print("ok", nombre)
