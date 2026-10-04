"""El aviso a la cuenta cuando alguien pide «Recuperar mi cuenta» (decisión del usuario del 2026-10-04, Etapa 5 T15): sale por los
métodos de ingreso de la cuenta que siguen andando, antes de que un operador revise el pedido. Respeta la ADR 0041: nunca va a quien
hizo el pedido y su pantalla no cambia. El correo de soporte es el de la configuración de la plataforma (Config-Plat › Contacto).
Suma a Mensajes «Recuperación: aviso a la cuenta», por correo y por WhatsApp (plantilla `recuperacion_aviso_cuenta`, Utility, con
el correo de soporte). Lleva `data-vuelta="1004-recuperar-aviso"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-recuperar-aviso"'


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


ruta = PROJ / "Mensajes.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '"Recuperación: pedido recibido","Recuperación: ya tiene una cuenta"',
            '"Recuperación: pedido recibido","Recuperación: aviso a la cuenta","Recuperación: ya tiene una cuenta"')
    nuevo = """  {
    n: 'Recuperación: aviso a la cuenta',
    // Decisión del 2026-10-04: al registrar un pedido de «Recuperar mi cuenta», se avisa a la cuenta por sus métodos que siguen
    // andando, antes de que lo revise un operador. Nunca a quien lo pidió (ADR 0041). El correo de soporte sale de Config-Plat › Contacto.
    correo: {
      asunto: 'Alguien pidió recuperar tu cuenta',
      para: 'pablo.ortiz@kappa.ejemplo.com',
      titulo: 'Alguien pidió recuperar tu cuenta',
      parrafos: [P('Hola, Pablo. El 27/09/2026 a las 14:35 alguien pidió recuperar tu cuenta de ArquitecturaBase y nos dio otro correo o teléfono para escribirle.'),
        P('Una persona de la plataforma revisa el pedido antes de cambiar algo. Si fuiste vos, no tenés que hacer nada.')],
      notas: [P('Si no fuiste vos, escribí a soporte@ejemplo.com.')],
    },
    // Plantilla `recuperacion_aviso_cuenta`: el correo de soporte.
    wa: { plantilla: 'recuperacion_aviso_cuenta', texto: [N('Alguien pidió recuperar tu cuenta de ArquitecturaBase. Una persona de la plataforma revisa el pedido antes de cambiar algo. Si fuiste vos, no tenés que hacer nada. Si no fuiste vos, escribí a soporte@ejemplo.com.')] },
  },
"""
    t = rep(t, "  {\n    n: 'Recuperación: ya tiene una cuenta',", nuevo + "  {\n    n: 'Recuperación: ya tiene una cuenta',")
    t = rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Mensajes")
