"""Invitación de operador cuando quien invita no tiene nombre (el operador inicial): firma «El equipo de ArquitecturaBase» (lo eligió
el usuario el 2026-10-04, opción A; es lo que ya manda el back). Suma a Mensajes «Invitación como operador: sin nombre», después de
«Invitación como operador». Lleva `data-vuelta="1004-operador-sin-nombre"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-operador-sin-nombre"'

ruta = PROJ / "Mensajes.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    a = '"Invitación como operador",'
    assert t.count(a) == 1
    t = t.replace(a, '"Invitación como operador","Invitación como operador: sin nombre",')
    nuevo = """  {
    n: 'Invitación como operador: sin nombre',
    // Si quien invita no tiene nombre (el operador inicial), firma «El equipo de ArquitecturaBase».
    correo: {
      asunto: 'El equipo de ArquitecturaBase te invitó como operador',
      para: 'julieta.molina@arquitecturabase.ejemplo.com',
      titulo: 'Te invitaron como operador',
      parrafos: [P('Hola. El equipo de ArquitecturaBase te invitó a sumarte como operador de la plataforma.')],
      datos: [{ k: 'Permisos', v: 'Ver organizaciones, Ver cuentas y Recuperaciones' }, { k: 'Vence', v: '04/10/2026' }],
      boton: 'Ingresar',
      notas: [P('Para entrar, usá este correo antes de que venza la invitación: te vamos a mandar un código de acceso.'),
        P('Esta cuenta es solo para operar la plataforma: no se usa como persona ni para entrar a una organización.')],
      pie: 'Si no esperabas este correo, podés ignorarlo. Sin el código, nadie puede entrar a tu cuenta.',
    },
  },
"""
    i = t.index("    n: 'Invitación como operador',")
    j = t.index("\n  {\n", i) + 1
    t = t[:j] + nuevo + t[j:]
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Mensajes")
