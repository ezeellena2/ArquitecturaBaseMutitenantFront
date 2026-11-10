"""El dólar con su símbolo (lienzo v174, 2026-11-10). En es-AR el dólar estadounidense se escribe «US$ 160,00»: es el
`DisplaySymbol` de USD para esa cultura en el dato de referencia del back (`currencies.json`, que sale de CLDR), y así lo muestran
`DisplayFormatter` en el back, `MoneyText` en el front (`format-cases.json`: «US$ 1.234,50») y los correos de los avisos del tope
del asistente (back `121f18ae`). Los tableros decían «USD 160,00»: era un error del lienzo, porque manda la regla de datos de
referencia. Es una corrección, no una decisión.

Cambia solo los importes, como los dibuja `MoneyText`: el símbolo y los decimales de la moneda (MinorUnits 2), así que «USD 100»
pasa a «US$ 100,00» y «USD 2» a «US$ 2,00». Pasa en «Mensajes» (los cuatro avisos del tope) y en las pantallas del asistente:
`Asistente-Uso-Org`, `Asistente-Config-Org` (el precio de cada modelo), `Asistente-Plat` (lo que responde), `Plat-Asistente-Uso`,
`Plat-Asistente-Config` y `Plat-Asistente-Config-23`, con sus teléfonos. No hay tableros con importes en dólares en inglés.

Quedan como están, a propósito, los lugares donde la app muestra el código:
- el prefijo de un `MoneyField` con `fixedCurrency` (el tope del mes y los precios de un modelo al editarlo), que dibuja el código
  de la moneda («USD» y el número);
- el selector de monedas de Configuración, que dice «Dólar estadounidense (USD)», como `currencyLabel` (su ejemplo ya era
  «US$ 1.234,50»), y el valor `USD` de los datos de los tableros.

Con los decimales, en el teléfono del uso con el tope cerca la cifra ya no entra en un renglón: ahí lo que no entra baja entero, sin
partir un importe (174).

Corre al final de todo, después de `eje_por_dia_1004.py` y antes de la pasada de las piezas; al terminar imprime los tableros para
esa pasada. Cambia textos, suma ese estilo y no toca `canvas.json`. Lee y escribe sin cambiar los finales de línea, y se puede volver a correr:
lo que ya está hecho no vuelve a encontrar lo que busca.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

TABLEROS = ["Mensajes", "Asistente-Uso-Org", "M-Asistente-Uso-Org", "Asistente-Config-Org", "Asistente-Plat", "M-Asistente-Plat",
            "Plat-Asistente-Uso", "M-Plat-Asistente-Uso", "Plat-Asistente-Config", "M-Plat-Asistente-Config",
            "Plat-Asistente-Config-23", "M-Plat-Asistente-Config-23"]
# Un importe en es-AR: miles con punto y, si los tiene, dos decimales con coma («1.234», «0,10», «160,00»).
IMPORTE = re.compile(r"USD (\d{1,3}(?:\.\d{3}(?!\d))*)(?:,(\d{2})(?!\d))?(?![\d.,]\d)")
# Lo que la app muestra con el código, y queda: el prefijo de un MoneyField fijo y el selector de monedas con su valor.
CODIGO = re.compile(r'<span class="as-pre">USD</span>|\(USD\)|\'USD\'')
# En el teléfono del uso, con el tope cerca, «US$ 92,10», «de US$ 100,00» y «Cerca del tope» no entran en un renglón: un importe
# no se parte (174), así que lo que no entra baja entero, al renglón de abajo.
CIFRA = ("M-Asistente-Uso-Org", '<style data-dolares="cifra">\n/* v174 · Un importe no se parte: lo que no entra baja entero, alineado a la izquierda. */\n'
         '.as-cifra { flex-wrap: wrap; row-gap: 4px; }\n.as-cifra b, .as-cifra > span { white-space: nowrap; }\n.as-cifra .pill { margin-left: 0; }\n'
         '</style>\n')


def con_cifra(t):
    """El estilo, una vez y en su lugar: si ya está igual no se toca, porque la pasada de las piezas corre su bloque al final."""
    n = "\r\n" if "\r\n" in t else "\n"
    estilo = CIFRA[1].replace("\n", n)
    m = re.search(r'<style data-dolares="cifra">.*?</style>\r?\n', t, flags=re.S)
    if m:
        return t if m.group(0) == estilo else t[:m.start()] + estilo + t[m.end():]
    return t.replace("</helmet>", estilo + "</helmet>", 1)


def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t)


def importe(m):
    """Como `MoneyText`: «US$» y los dos decimales del dólar."""
    return f"US$ {m.group(1)},{m.group(2) or '00'}"


def vivos():
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    return sorted(n.removesuffix(".dc.html") for n, b in canvas["boards"].items() if b.get("page") != "archivo")


if __name__ == "__main__":
    cambiados, vistos = [], {}
    for nombre in TABLEROS:
        t = leer(nombre)
        for m in IMPORTE.finditer(t):
            vistos[m.group(0)] = importe(m)
        nuevo = IMPORTE.sub(importe, t)
        if nombre == CIFRA[0]:
            nuevo = con_cifra(nuevo)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    # En todo el lienzo vivo, lo único que queda con «USD» es lo que la app muestra con el código.
    for nombre in vivos():
        resto = CODIGO.sub("", leer(nombre))
        assert "USD" not in resto, (nombre, resto[max(0, resto.find("USD") - 80):resto.find("USD") + 40])
    for viejo, nuevo in sorted(vistos.items()):
        print(f"  {viejo} → {nuevo}")
    print("ok", len(TABLEROS), "tableros,", len(cambiados), "cambiados")
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(TABLEROS))
