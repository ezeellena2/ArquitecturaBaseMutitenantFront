"""Lo que mandó la Guía con 6d-4b (2026-10-05) y solo alinea el lienzo con sus reglas, con la app o con lo que pidió el usuario:
- Empresa: revocar una invitación dice «El enlace deja de funcionar.», que sirve también para quien administra solo su empresa
  (no puede invitar); la invitación vencida dice «Venció …»; el ⋮ de una invitación lleva la franja antes de «Revocar
  invitación» y su ícono ✕ (Criterio · Menús); «Agregar miembro» tapa el correo también para la Dueña («una sola forma»).
- Usuarios: la invitación vencida dice «Venció …», como la app.
- Criterio · Menús: en el teléfono, el ⋮ de una fila de cualquier lista abre una hoja desde abajo con el dato de la fila como título.
Lleva `data-vuelta="1004-cola-guia-b"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import rep  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-cola-guia-b"'
textos = {}


def tocar(nombre):
    if nombre not in textos:
        t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
        textos[nombre] = None if MARCA in t else t
    return textos[nombre]


# El ✕ de «Revocar invitación» del ⋮ de Usuarios, a 16 como los otros íconos del menú de Empresa.
REVOCAR = re.search(r"(<svg(?:(?!</svg>).)*</svg>)\s*Revocar invitación", (PROJ / "Usuarios.dc.html").read_text(encoding="utf-8"), re.S).group(1)
REVOCAR = REVOCAR.replace('width="18" height="18"', 'width="16" height="16"')

t = tocar("Empresa")
if t:
    t = rep(t, "texto: 'El enlace deja de funcionar. Podés volver a invitar a esta persona cuando quieras.',", "texto: 'El enlace deja de funcionar.',")
    t = rep(t, "invitado: inv, noInvitado: !inv, vence: m.vence || '',",
            "invitado: inv, noInvitado: !inv, textoVence: (m.estado === 'vencida' ? 'Venció ' : 'Vence ') + (m.vence || ''),")
    t = rep(t, "Vence {{m.vence}}", "{{m.textoVence}}")
    t = rep(t, "d: (s.solo ? tapar(c.email) : c.email) + (c.pendiente ? ' · invitación pendiente' : '')",
            "d: tapar(c.email) + (c.pendiente ? ' · invitación pendiente' : '')")
    t = rep(t, "// Sin roles de la organización no ve la lista de Usuarios: el correo va tapado.",
            "// «Agregar miembro» tiene una sola forma: el correo va tapado para todos (lo pidió el usuario el 05/10).")
    # El ⋮ de una invitación: Reenviar, la franja y Revocar con su ✕; lo demás, como antes.
    m = re.search(r'(<button type="button" class="menu-it \{\{m\.claseAccion\}\}" role="menuitem" onClick="\{\{m\.cambiarEstado\}\}"><svg(?:(?!</svg>).)*</svg> \{\{m\.accion\}\}</button>)', t, re.S)
    assert m
    t = t[:m.start()] + ('<sc-if value="{{m.noInvitado}}" hint-placeholder-val="{{si}}">' + m.group(1) + "</sc-if>"
                         '<sc-if value="{{m.invitado}}" hint-placeholder-val="{{no}}"><button type="button" class="menu-it pel" role="menuitem" onClick="{{m.cambiarEstado}}">'
                         + REVOCAR + " Revocar invitación</button></sc-if>") + t[m.end():]
    t = rep(t, " Reenviar invitación</button></sc-if>", ' Reenviar invitación</button><div class="menu-sep" role="separator"></div></sc-if>')
    textos["Empresa"] = t

t = tocar("Usuarios")
if t:
    t = rep(t, "Vence {{u.vence}}", "{{u.textoVence}}")
    t = rep(t, "esInvitacion: invitacion,", "esInvitacion: invitacion,\n          textoVence: (u.estado === 'vencida' ? 'Venció ' : 'Vence ') + u.vence,")
    textos["Usuarios"] = t

t = tocar("Criterio-Menus")
if t:
    textos["Criterio-Menus"] = rep(t, "Si no hay lugar abajo, abre hacia arriba.</li>",
                                   "Si no hay lugar abajo, abre hacia arriba.</li> <li><strong>En el teléfono, una hoja desde abajo</strong> con el dato de la fila "
                                   "como título, como «Sofía Herrera». Vale para todas las listas.</li>")

escritos = 0
for nombre, t in textos.items():
    if t is None:
        continue
    assert t.count("</helmet>") == 1, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t.replace("</helmet>", f"<style {MARCA}></style>\n</helmet>"), encoding="utf-8")
    escritos += 1
print("tableros", escritos)
