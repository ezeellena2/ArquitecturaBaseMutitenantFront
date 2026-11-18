"""Las fechas y los números del traspaso 15 en los tableros vivos (lienzo v175, 2026-11-18), con las decisiones 205 y 208 de la
hoja de ruta del back, que dicen `docs/rules/formatos.md` del front y `docs/rules/fechas-y-zonas.md` del back:

- **la hora va después de una coma** (205): «27/09/2026, 14:35» y «09/27/2026, 2:35 PM», en las pantallas, los correos y los
  WhatsApp de `Mensajes`, y en los datos de cada estado (`data-props` y los scripts de los tableros), así el estado que se elige con
  Tweak dibuja lo mismo;
- **el mes nunca va en letras** (205): un mes se escribe como su rango. En la banda y en el selector de «Uso del asistente»
  (`Asistente-Uso-Org` y `Plat-Asistente-Uso`, con sus teléfonos), «01/10/2026 – 31/10/2026»; en los cuatro correos del tope de
  `Mensajes`, «del 01/10/2026 al 31/10/2026» dentro de la frase y el rango en su dato «Mes». El eje por mes del tablero de un
  formulario no tiene tablero (v174);
- **el porcentaje va pegado al número** (208): «64%», «12,5%», en las dos regiones.

Quedan como están, a propósito: lo que escribió una persona (el nombre de la difusión «20 % en empanadas»), lo que no es una fecha
con hora (un rango de fechas, la hora sola de una burbuja o de la actividad), las hojas de estilo y el Archivo. Los textos de las
reglas en los `Criterio-*` los pone `reglas_t15_1004.py`.

Corre al final de todo, después de `dolares_1004.py` y antes de `reglas_t15_1004.py` y de la pasada de las piezas; al terminar
imprime los tableros para esa pasada. Solo cambia textos: no suma medidas ni toca `canvas.json`. Lee y escribe sin cambiar los
finales de línea, y se puede volver a correr: lo que ya está hecho no vuelve a encontrar lo que busca.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

# Una fecha con su hora, sin coma: «27/09/2026 14:35» y «09/27/2026 2:35 PM». Un rango («21/09/2026 – 27/09/2026») no la tiene.
MOMENTO = re.compile(r"(?<![\d/])(\d{2}/\d{2}/\d{4}) (\d{1,2}:\d{2})(?!\d)")
# Un porcentaje con espacio: «64 %», «12,5 %». Lo escrito por una persona va en `PROTEGIDOS`.
PORCENTAJE = re.compile(r"(?<![\w.,])(\d+(?:[.,]\d+)?) %")
PROTEGIDOS = ["20 % en empanadas"]
ESTILO = re.compile(r"<style.*?</style>", re.S)

MES = "01/10/2026 – 31/10/2026"
MESES = {
    "Mensajes": [
        ("de tope de octubre de 2026", "de tope del 01/10/2026 al 31/10/2026", 4),
        ("{ k: 'Mes', v: 'Octubre de 2026' }", "{ k: 'Mes', v: '" + MES + "' }", 4),
    ],
    "Asistente-Uso-Org": [(">Octubre de 2026<", ">" + MES + "<", 2)],
    "Plat-Asistente-Uso": [(">Octubre de 2026<", ">" + MES + "<", 2)],
    "M-Asistente-Uso-Org": [("Asistente · octubre de 2026", "Asistente · " + MES, 1)],
    "M-Plat-Asistente-Uso": [("Asistente · octubre de 2026", "Asistente · " + MES, 1)],
}


def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t)


def cambiar(t, viejo, nuevo, veces):
    """`viejo` por `nuevo`, que está `veces` veces. Si ya no está, es una corrida anterior."""
    k = t.count(viejo)
    if k == 0:
        assert nuevo in t, ("no encuentro", viejo[:120])
        return t
    assert k == veces, (viejo[:120], k, veces)
    return t.replace(viejo, nuevo)


def fuera_de_estilos(t, cambio):
    """Aplica `cambio` al texto que no está en un `<style>`."""
    partes, i = [], 0
    for m in ESTILO.finditer(t):
        partes.append(cambio(t[i:m.start()]))
        partes.append(m.group(0))
        i = m.end()
    partes.append(cambio(t[i:]))
    return "".join(partes)


def porcentajes(texto):
    guardados = {p: f"\x00{n}\x00" for n, p in enumerate(PROTEGIDOS)}
    for p, marca in guardados.items():
        texto = texto.replace(p, marca)
    texto = PORCENTAJE.sub(r"\1%", texto)
    for p, marca in guardados.items():
        texto = texto.replace(marca, p)
    return texto


def pasar(t, nombre):
    t = fuera_de_estilos(t, lambda x: porcentajes(MOMENTO.sub(r"\1, \2", x)))
    for viejo, nuevo, veces in MESES.get(nombre, []):
        t = cambiar(t, viejo, nuevo, veces)
    return t


if __name__ == "__main__":
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    vivos = sorted(n.removesuffix(".dc.html") for n, b in canvas["boards"].items() if b.get("page") != "archivo")
    faltan = [n for n in MESES if n not in vivos]
    assert not faltan, faltan
    cambiados = []
    for nombre in vivos:
        t = leer(nombre)
        nuevo = pasar(t, nombre)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    print("ok", len(vivos), "tableros vivos,", len(cambiados), "cambiados")
    if cambiados:
        print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(cambiados))
