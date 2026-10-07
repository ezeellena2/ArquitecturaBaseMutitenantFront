"""Solo lectura con los campos grisados (criterio nuevo del usuario, A11 de los arreglos antes de la 7, 2026-10-07): un dato que no
se puede cambiar va en el mismo campo que al editar, deshabilitado (fondo gris, texto gris, sin foco), nunca en rótulo y texto suelto.
- Criterio · Formularios: la pieza «Solo lectura» y, en «Prohibido», el rótulo con texto suelto (antes decía lo contrario).
- Rol (rol de sistema): Nombre, Vale en y Descripción como campos deshabilitados.
- M-Rol: lo mismo en el teléfono («Ver el rol Dueño») y «Vale en», que no se cambia al editar un rol.
- Usuario: Estado, Roles de la organización, los roles de cada empresa y, en el diálogo, la empresa fija, cuando no se pueden cambiar.
Los desplegables deshabilitados conservan la flechita en gris. Lleva `data-vuelta="1004-solo-lectura"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import CHEV_CAMPO, rep  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-solo-lectura"'
CSS_PC = (".o-txt { box-sizing: border-box; border: 1px solid var(--borde); border-radius: 8px; background: var(--s2); color: var(--t2) !important; "
          "padding: 0 12px; gap: 8px; cursor: default; }\n"
          ".o-txt.largo { min-height: 84px; align-items: flex-start; padding: 9px 12px; }\n"
          ".o-txt.sel::after { content: \"\"; margin-left: auto; flex-shrink: 0; width: 7px; height: 7px; border-right: 1.5px solid var(--t3); "
          "border-bottom: 1.5px solid var(--t3); transform: translateY(-2px) rotate(45deg); }\n")
CSS_TEL = (".ap-cmp .ct.ro { background: var(--s2) !important; color: var(--t2); border-color: var(--borde); }\n"
           ".ap-cmp .ct.sel { display: flex; align-items: center; justify-content: space-between; }\n.ap-cmp .ct.sel svg { color: var(--t3); flex-shrink: 0; }\n"
           ".ap-cmp .ct.area { min-height: 88px; align-items: flex-start; }\n")
textos = {}


def tocar(nombre):
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    return None if MARCA in t else t


t = tocar("Criterio-Formularios")
if t:
    t = rep(t, "<li>Campos grises de solo lectura: lo que no se edita se muestra como texto.</li>",
            "<li>Rótulo y texto suelto para un dato que no se puede cambiar: va el mismo campo, deshabilitado.</li>")
    t = rep(t, "<strong>Texto</strong><p>Un dato corto que se escribe.</p></div>",
            "<strong>Texto</strong><p>Un dato corto que se escribe.</p></div> "
            '<div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">Vale en</span><div class="ctl ro">Toda la organización</div></div></div>'
            "<strong>Solo lectura</strong><p>El mismo campo que al editar, deshabilitado: fondo y texto grises. Vale en todo el sistema.</p></div>")
    textos["Criterio-Formularios"] = (t, ".ctl.ro { background: var(--s2) !important; color: var(--t2) !important; border-color: var(--borde) !important; }\n")

t = tocar("Rol")
if t:
    t = rep(t, '<div class="o-txt">{{textoVale}}</div>', '<div class="o-txt sel">{{textoVale}}</div>')
    textos["Rol"] = (t, CSS_PC)

t = tocar("Usuario")
if t:
    for v in ["textoEstado", "textoRolesOrg", "e.textoRoles", "textoDlgEmpresa", "textoDlgRoles"]:
        t = rep(t, f'<div class="o-txt">{{{{{v}}}}}</div>', f'<div class="o-txt sel">{{{{{v}}}}}</div>')
    textos["Usuario"] = (t, CSS_PC)

t = tocar("M-Rol")
if t:
    t = rep(t, '<span class="rt"><span>Nombre</span></span><span style="font-size: 16px;">Dueño</span>',
            '<span class="rt"><span>Nombre</span></span><div class="ct ro">Dueño</div>')
    t = rep(t, '<span class="rt"><span>Vale en</span></span><span style="font-size: 16px;">Toda la organización</span>',
            f'<span class="rt"><span>Vale en</span></span><div class="ct ro sel">Toda la organización{CHEV_CAMPO}</div>', 2)
    t = rep(t, '<span class="rt"><span>Vale en</span></span><span style="font-size: 16px;">Delta S.A.</span>',
            f'<span class="rt"><span>Vale en</span></span><div class="ct ro sel">Delta S.A.{CHEV_CAMPO}</div>')
    t = rep(t, '<span class="rt"><span>Descripción</span></span><span style="font-size: 16px;">Tiene todos los permisos de la organización.</span>',
            '<span class="rt"><span>Descripción</span></span><div class="ct ro area">Tiene todos los permisos de la organización.</div>')
    textos["M-Rol"] = (t, CSS_TEL)

for nombre, (t, css) in textos.items():
    assert t.count("</helmet>") == 1, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>"), encoding="utf-8")
print("tableros", len(textos))
