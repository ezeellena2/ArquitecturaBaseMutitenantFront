"""Avisos que seguían piezas viejas. Los marcó la Guía en R2a (2026-10-04) y entran en la tanda que aprobó el usuario.
- M-Avisos usaba `.ap-txt-l` sin definirla y el texto salía en 16, oscuro y con los márgenes del navegador. Ahora va en 14,5 gris,
  como en los otros 31 teléfonos.
- Invitacion y M-Invitacion, «Aceptada: solo con el correo de la empresa»: «Agregá un correo personal…» pasa de `.aviso-linea` al
  cartel de atención de Criterio · Avisos, ámbar y con el triángulo, sin botón porque debajo están «Agregar ahora» y «Más tarde».
- La franja de los mensajes de ingreso y registro (`.msj`, en los 12 tableros que la usan):
  - el ícono va en el color del mensaje: círculo con «!» si es un error y triángulo si es de atención (antes, el círculo rojo
    también en los ámbar);
  - en la compu, radio 8 e ícono 16, como `.aviso-mal`;
  - en el teléfono, la franja del teléfono de la v100: 14,5 con interlineado 1,4, relleno 12 y 14 y radio 12.
Lleva `data-vuelta="1004-avisos"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-avisos"'


def svg(d, w=16):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


CIRCULO_ROJO = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(0.57 0.2 25)" stroke-width="2" stroke-linecap="round" '
                'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>')
ICONOS = (svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>').replace("<svg ", '<svg class="ic-mal" ')
          + svg('<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>').replace("<svg ", '<svg class="ic-aten" '))
CSS_MSJ = """.msj .ic-aten { display: none; }
.msj.alerta .ic-mal { display: none; }
.msj.alerta .ic-aten { display: inline-block; }"""
CSS_MSJ_PC = ".msj { border-radius: 8px; }\n.msj svg { width: 16px; height: 16px; margin-top: 2px; }"
CSS_MSJ_TEL = ".msj { padding: 12px 14px; font-size: 14.5px; line-height: 1.4; border-radius: 12px; }\n.msj svg { width: 16px; height: 16px; margin-top: 2px; }"
LINEA = re.compile(r'<div class="aviso-linea alerta" role="status"><svg.*?</svg><span>', re.S)
CARTEL = '<div class="cartel aten" role="status">' + svg('<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>', 18) + '<span class="tx">'
CSS_CARTEL = """.cartel { display: flex; align-items: center; gap: 10px; min-height: 44px; box-sizing: border-box; padding: 6px 8px 6px 14px; border-radius: 10px; font-size: 13px; text-align: left; }
.cartel svg { flex-shrink: 0; }
.cartel .tx { flex: 1; }
.cartel.aten { background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }"""


def marcar(t, css):
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}\n</style>\n</helmet>")


for ruta in sorted(PROJ.glob("*.dc.html")):
    t = ruta.read_text(encoding="utf-8")
    nombre = ruta.name[:-len(".dc.html")]
    if MARCA in t:
        continue
    css = []
    if nombre == "M-Avisos":
        assert "ap-txt-l" in t and ".ap-txt-l {" not in t
        css.append(".ap-txt-l { font-size: 14.5px; line-height: 1.5; color: var(--t2); margin: 0; }")
    if nombre in ("Invitacion", "M-Invitacion"):
        t, n = LINEA.subn(lambda m: CARTEL, t)
        assert n == 1, nombre
        css.append(CSS_CARTEL)
    if 'class="msj' in t:
        t = t.replace(CIRCULO_ROJO, ICONOS)
        css.append(CSS_MSJ)
        css.append(CSS_MSJ_TEL if nombre.startswith("M-") else CSS_MSJ_PC)
    if not css:
        continue
    ruta.write_text(marcar(t, "\n".join(css)), encoding="utf-8")
    print("ok", nombre)
