"""Un solo formato para los datos personales tapados, el de `PersonalDataMask` del back (commit c64b786; decisión del usuario del
2026-10-04, que pasó la Guía):
- teléfono: «•••• 4521», solo los últimos 4 dígitos, que sirve para cualquier país. Antes había tres formatos: «011 15-••••-4521»
  en Plataforma, «011 15-•••••-4521» en Cuenta y «+54 9 11 •••• 4521» en Mensajes;
- correo: «lu•••@dominio», como Cuenta-Metodo, Cuenta-Verificar y Cuenta-Baja. Mensajes todavía decía «l***@…»;
- Auditoria-Org y M-Auditoria-Org tapan el correo de una invitación («va•••@gmail.com»), como pide `auditoria.md` y como hace el
  back.
Lleva `data-vuelta="1004-enmascarado"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-enmascarado"'
TELEFONO = re.compile(r"(?:\+54 9 11 |0?\d{2,4} 15-)•{3,5}[- ](\d{4})")
CORREO = re.compile(r"\b([a-z])\*\*\*@")


def tapar(correo):
    usuario, dominio = correo.split("@")
    return f"{usuario[:2]}•••@{dominio}"


for ruta in sorted(PROJ.glob("*.dc.html")):
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    cab, cuerpo = t.split("</helmet>", 1)
    nuevo = TELEFONO.sub(lambda m: f"•••• {m.group(1)}", cuerpo)
    if ruta.name == "Mensajes.dc.html":
        # «l***@» era Lucía: «lu•••@».
        nuevo = CORREO.sub(lambda m: "lu•••@" if m.group(1) == "l" else m.group(0), nuevo)
        assert "***@" not in nuevo
    if ruta.name in ("Auditoria-Org.dc.html", "M-Auditoria-Org.dc.html"):
        n = nuevo.count("valentina.ruiz@gmail.com")
        assert n >= 1, ruta.name
        # Solo el correo de la invitación: el de quien la hizo (Lucía) va completo, como lo muestra el back a quien tiene permiso.
        nuevo = nuevo.replace("valentina.ruiz@gmail.com", tapar("valentina.ruiz@gmail.com"))
    if nuevo == cuerpo:
        continue
    ruta.write_text(cab + f"<style {MARCA}>\n</style>\n</helmet>" + nuevo, encoding="utf-8")
    print("ok", ruta.name[:-len(".dc.html")])
