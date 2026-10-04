"""Mi cuenta tampoco revela si un correo o un teléfono tiene cuenta (ADR 0041, 2026-10-03). Si alguien quiere sumar a su
cuenta un correo o un número que ya es de otra, la pantalla sigue igual («Te mandamos un código a…»), no llega ningún código y
al dueño le llega un aviso. Este script suma ese aviso a Mensajes: «Método de ingreso: ya es de una cuenta», por correo y por
WhatsApp (plantilla `metodo_ingreso_en_uso`, Utility, sin variables). El estado de error sale de cuenta_wa_1004.py y de
cuenta_wa_telefonos_1004.py. Lleva `data-vuelta="1004-sin-revelar-cuenta"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-sin-revelar-cuenta"'


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


ruta = PROJ / "Mensajes.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '"Método principal cambiado",', '"Método principal cambiado","Método de ingreso: ya es de una cuenta",')
    nuevo = """  {
    n: 'Método de ingreso: ya es de una cuenta',
    // ADR 0041: si alguien quiere sumar a su cuenta un correo o un número que ya es de otra, le llega esto al dueño y no hay código.
    // La pantalla de quien lo quiso sumar sigue igual: no revela que ese correo o número tiene cuenta.
    correo: {
      asunto: 'Ya tenés una cuenta con este correo',
      para: 'ana.gomez@gmail.com',
      titulo: 'Ya tenés una cuenta con este correo',
      parrafos: [P('Alguien quiso agregar este correo para entrar a otra cuenta de ArquitecturaBase. Este correo ya es de una cuenta, así que no lo agregamos y no mandamos ningún código.'),
        P('Si fuiste vos, entrá con este correo: ya tenés una cuenta.')],
      notas: [P('Si no fuiste vos, ignorá este mensaje.')],
    },
    // Plantilla `metodo_ingreso_en_uso`: sin variables.
    wa: { plantilla: 'metodo_ingreso_en_uso', texto: [N('Alguien quiso agregar este número para entrar a otra cuenta de ArquitecturaBase, pero este número ya es de una cuenta. Si fuiste vos, entrá con este número: ya tenés una cuenta. Si no fuiste vos, ignorá este mensaje.')] },
  },
"""
    i = t.index("    n: 'Método principal cambiado',")
    j = t.index("\n  {\n", i) + 1  # el comienzo del mensaje siguiente
    t = t[:j] + nuevo + t[j:]
    t = rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Mensajes")
