"""«Recuperar mi cuenta» no revela si el correo o el WhatsApp nuevo ya es de otra cuenta (decisión 16 del plan de la
Etapa 5, 2026-10-03). La pantalla sigue igual que siempre («Revisá tu correo»); a ese correo o número le llega un aviso de
que ya tiene una cuenta en lugar del código, así que el pedido no avanza.
- Recuperar y M-Recuperar: sale el error «Ese correo ya lo usa otra cuenta.».
- Mensajes: suma «Recuperación: ya tiene una cuenta», por correo y por WhatsApp (plantilla `recuperacion_metodo_en_uso`).
Cada tablero lleva `data-vuelta="1004-sin-revelar"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-sin-revelar"'


def rep(t, a, b):
    assert t.count(a) == 1, (a[:90], t.count(a))
    return t.replace(a, b)


def marcar(t):
    return rep(t, "</helmet>", f"<style {MARCA}>\n</style>\n</helmet>")


for nombre in ("Recuperar", "M-Recuperar"):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    t = rep(t, "const OCUPADOS = ['beto.ramirez@beta.ejemplo.com', 'ana.gomez@gmail.com'];\n",
            "// Si el correo o el WhatsApp nuevo ya es de otra cuenta, la pantalla sigue igual: le llega un aviso en lugar del código.\n")
    t = rep(t, "        if (OCUPADOS.includes(nuevo)) { this.setState({ errNuevo: 'Ese correo ya lo usa otra cuenta.' }); return; }\n", "")
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok", nombre)

ruta = PROJ / "Mensajes.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    t = rep(t, '"Recuperación: pedido recibido","Recuperación: aprobada"', '"Recuperación: pedido recibido","Recuperación: ya tiene una cuenta","Recuperación: aprobada"')
    nuevo = """  {
    n: 'Recuperación: ya tiene una cuenta',
    // Decisión 16 de la Etapa 5: si el método nuevo de «Recuperar mi cuenta» ya es de otra cuenta, le llega esto en lugar del código.
    // La pantalla de quien pidió la recuperación no cambia: no revela que ese correo o número tiene cuenta.
    correo: {
      asunto: 'Ya tenés una cuenta con este correo',
      para: 'ana.gomez@gmail.com',
      titulo: 'Ya tenés una cuenta con este correo',
      parrafos: [P('Alguien pidió recuperar una cuenta de ArquitecturaBase y nos dio este correo para escribirle. Este correo ya es de una cuenta, así que no mandamos ningún código.'),
        P('Si fuiste vos, entrá con este correo: no hace falta recuperar nada.')],
      notas: [P('Si no fuiste vos, ignorá este mensaje.')],
    },
    // Plantilla `recuperacion_metodo_en_uso`: sin variables.
    wa: { plantilla: 'recuperacion_metodo_en_uso', texto: [N('Alguien pidió recuperar una cuenta de ArquitecturaBase con este número, pero este número ya es de una cuenta. Si fuiste vos, entrá con este número: no hace falta recuperar nada. Si no fuiste vos, ignorá este mensaje.')] },
  },
"""
    t = rep(t, "  {\n    n: 'Recuperación: aprobada',", nuevo + "  {\n    n: 'Recuperación: aprobada',")
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok Mensajes")
