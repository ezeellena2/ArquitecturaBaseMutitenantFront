"""El aviso de la baja que inicia la plataforma (ADR 0035, Etapa 5 T13), con sus dos variantes, en Mensajes:
- «Baja por la plataforma»: la cuenta estaba activa, pasa a baja pedida y la persona la puede cancelar ingresando antes de la fecha.
- «Baja por la plataforma: suspendida»: la cuenta sigue suspendida con la fecha de eliminación y no se puede cancelar; no lleva
  «Ingresar» porque no puede entrar, y el contacto es el correo de soporte de la configuración de la plataforma.
Por WhatsApp, una plantilla Utility por variante (`baja_cuenta_plataforma` y `baja_cuenta_plataforma_suspendida`).
Lleva `data-vuelta="1004-baja-plataforma"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-baja-plataforma"'


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


ruta = PROJ / "Mensajes.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '"Baja pedida","Baja cancelada"', '"Baja pedida","Baja por la plataforma","Baja por la plataforma: suspendida","Baja cancelada"')
    nuevo = """  {
    n: 'Baja por la plataforma',
    // ADR 0035: la plataforma inicia la baja de una cuenta activa; pasa a baja pedida y se puede cancelar ingresando antes de la fecha.
    correo: {
      asunto: 'La plataforma inició la baja de tu cuenta',
      para: 'diego.rios@delta.ejemplo.com',
      titulo: 'La plataforma inició la baja de tu cuenta',
      parrafos: [P('Hola, Diego. El 27/09/2026 a las 14:35 la plataforma inició la baja de tu cuenta de ArquitecturaBase y cerramos todas tus sesiones.'), P('Tu cuenta se elimina el 27/10/2026.')],
      boton: 'Ingresar',
      notas: [P('Si creés que es un error, ingresá antes de esa fecha para cancelarla.')],
    },
    // Plantilla `baja_cuenta_plataforma`: la fecha de eliminación.
    wa: { plantilla: 'baja_cuenta_plataforma', texto: [N('La plataforma inició la baja de tu cuenta de ArquitecturaBase y cerramos todas tus sesiones. Se elimina el 27/10/2026. Si creés que es un error, ingresá antes de esa fecha para cancelarla.')] },
  },
  {
    n: 'Baja por la plataforma: suspendida',
    // ADR 0035: sobre una cuenta suspendida, sigue suspendida con la fecha y no se puede cancelar. Sin «Ingresar»: no puede entrar.
    // El correo de soporte es el de la configuración de la plataforma (Config-Plat › Contacto).
    correo: {
      asunto: 'La plataforma inició la baja de tu cuenta',
      para: 'diego.rios@delta.ejemplo.com',
      titulo: 'La plataforma inició la baja de tu cuenta',
      parrafos: [P('Hola, Diego. El 27/09/2026 a las 14:35 la plataforma inició la baja de tu cuenta de ArquitecturaBase.'), P('Tu cuenta se elimina el 27/10/2026.')],
      notas: [P('Tu cuenta está suspendida, así que no podés cancelar la baja. Si creés que es un error, escribí a soporte@ejemplo.com.')],
    },
    // Plantilla `baja_cuenta_plataforma_suspendida`: la fecha de eliminación y el correo de soporte.
    wa: { plantilla: 'baja_cuenta_plataforma_suspendida', texto: [N('La plataforma inició la baja de tu cuenta de ArquitecturaBase. Se elimina el 27/10/2026. Tu cuenta está suspendida, así que no podés cancelar la baja. Si creés que es un error, escribí a soporte@ejemplo.com.')] },
  },
"""
    t = rep(t, "  {\n    n: 'Baja cancelada',", nuevo + "  {\n    n: 'Baja cancelada',")
    t = rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Mensajes")
