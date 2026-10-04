"""«Invitar operador» con un correo que ya tiene una invitación pendiente o vencida: un error propio en lugar de «Ese correo ya tiene
una cuenta…» (lo eligió el usuario el 2026-10-04). Quien invita tiene `operators.manage` y ya ve la invitación en Cuentas, así que no
revela nada nuevo (ADR 0041). Lleva `data-vuelta="1004-operador-repetido"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-operador-repetido"'
TEXTO = "Ese correo ya tiene una invitación. Reenviala desde la lista."

ruta = PROJ / "Cuentas.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    viejo = "        if (s.cuentas.some((c) => c.email === correo)) {\n"
    assert t.count(viejo) == 1
    t = t.replace(viejo, "        if (s.cuentas.some((c) => c.email === correo && (c.estado === 'invitado' || c.estado === 'vencida'))) {\n"
                  f"          this.setState({{ errCorreo: '{TEXTO}', abierto: null }});\n\n          return;\n        }}\n\n" + viejo)
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Cuentas")
