"""El eje «por día» con la fecha completa (lienzo v173, 2026-11-10). El usuario decidió ese día que, en un gráfico por día, cada
marca del eje lleva la fecha completa, 27/09/2026, y nunca «27/09», el número del día solo ni una fecha relativa; para que entren,
van menos marcas: una por semana en la compu y, en el teléfono, las que entran sin pisarse, como mínimo la primera y la última. El
cartel de cada barra también lleva la fecha completa. Precisa la regla de las fechas completas de `docs/rules/formatos.md` (25/10);
la opción descartada era el número del día con el mes y el año una vez abajo.

Lo pasa a los seis tableros con un gráfico por día, el tablero de un formulario de la 15, la 19 y la 21, con sus teléfonos:
- en la compu, «Cuántas llegaron, por día» y «Monto estimado, por día» («Total, por día» en la 19), del 26/09/2026 al 15/10/2026,
  llevan una marca cada lunes, el día en que empieza una semana del tablero (las semanas van de lunes a domingo, como en la spec de
  la 15): 28/09/2026, 05/10/2026 y 12/10/2026;
- en el teléfono, los últimos diez días, del 06/10/2026 al 15/10/2026, llevan una marca cada tres días, que es lo que entra sin
  pisarse: la primera arranca en el borde izquierdo de su barra y la última termina en el borde derecho de la suya;
- cada barra lleva su cartel (`title`) con la fecha completa y lo que vale: «03/10/2026 · 1 respuesta», «02/10/2026 · 212.000,00»
  y, en la 19, «14/10/2026 · $ 624.900,00». El estado nuevo «Una barra: su cartel» lo dibuja sobre una barra sin marca: al pasar el
  mouse en la compu y al tocarla en el teléfono;
- las barras de la compu, también las de «Por semana», van en proporción a su valor, en % del alto del gráfico: la escala de la
  180 achicaba solo las de 18 a 72 px (un 1 medía 31,8 y un 2, 87), y la más alta se aplastaba para dejar lugar a los números.

Corre al final de todo, después de `galeria_base12_1004.py` y antes de la pasada de las piezas; al terminar imprime los tableros
para esa pasada (`python traspaso10_piezas_1004.py --tableros …`). No toca `canvas.json`. Lee y escribe sin cambiar los finales de
línea, y se puede volver a correr: rehace cada gráfico desde los datos de abajo, que tienen que coincidir con lo que dibuja.
"""
import datetime
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

# Los datos de los generadores que dibujan estos tableros: `formularios_lista_y_ficha_1004.py` (la 15, que copia la 21) y
# `formularios_19_logica_1004.py`. Lo que vale cada día, del 26/09/2026 al 15/10/2026; los montos, en miles.
DIAS = [datetime.date(2026, 9, 26) + datetime.timedelta(days=k) for k in range(20)]
LLEGARON = {"15": [1, 0, 2, 1, 0, 1, 2, 1, 0, 1, 3, 1, 0, 2, 1, 1, 0, 2, 2, 3],
            "19": [3, 0, 3, 2, 2, 2, 4, 1, 0, 3, 4, 2, 3, 4, 1, 0, 3, 4, 2, 2]}
MONTO = {"15": [125.5, 0, 87.9, 15.7, 0, 54.2, 212.0, 31.0, 0, 125.5, 160.3, 0, 0, 98.4, 42.0, 15.8, 0, 76.6, 54.3, 118.4],
         "19": [0] * 17 + [298.75, 624.9, 143.0]}
TABLEROS = {"FRM-Tablero": "15", "FRM-Tablero-19": "19", "FRM-Tablero-21": "15",
            "M-FRM-Tablero": "15", "M-FRM-Tablero-19": "19", "M-FRM-Tablero-21": "15"}
TEL = 10           # el teléfono dibuja los últimos diez días
CADA_TEL = 3       # y una marca cada tres: con dos, «06/10/2026» y «08/10/2026» se pisan
ALTO_TEL = 110     # el alto de la barra más alta del teléfono, en px, como lo dibuja la 15 (el teléfono no se escala)
TOPE = 75          # la barra más alta de la compu, en % del gráfico: deja lugar al número de arriba y a la marca de abajo
TOPE_MONTO = 66    # en un monto, menos: su número («212,0 mil») no entra en el ancho de la barra y baja de renglón
ESTADO = "Una barra: su cartel"
CARTEL_COMPU, CARTEL_TEL = 7, 4  # el 03/10/2026 y el 10/10/2026: una barra sin marca y con 1 respuesta, en la 15 y en la 19


def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t)


def cambiar(t, viejo, nuevo):
    """`viejo` por `nuevo`, una vez; si ya está `nuevo`, es una corrida anterior."""
    if nuevo in t:
        return t
    assert t.count(viejo) == 1, ("no encuentro una sola vez", viejo[:160], t.count(viejo))
    return t.replace(viejo, nuevo)


def fecha(d):
    return d.strftime("%d/%m/%Y")


def cantidad(n):
    return "1 respuesta" if n == 1 else f"{n} respuestas"


def numero(miles):
    """Como `NumberText` con dos decimales en es-AR: 125.5 (miles) → «125.500,00»."""
    return f"{miles * 1000:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def monto(forma, miles):
    return f"$ {numero(miles)}" if forma == "19" else numero(miles)  # la 19 suma un Total en pesos; la 15, un número


def pct(valor, tope, techo=TOPE):
    return f"{round(valor / tope * techo, 1):g}%"


# ---------------------------------------------------------------------------------------------------------------- las barras
COL = re.compile(r'<span class="col"')
VALOR = re.compile(r'<span class="v">([^<]*)</span>')
ALTO = re.compile(r'<i style="height: ([^;"]*);"></i>')
MARCA = re.compile(r'<span class="d(?: [a-z]+)?">([^<]*)</span>')
TIP = '<span class="tb-tip" role="tooltip">{}</span>'


def col(v, alto, marca="", clase="", title="", cartel=""):
    t = f' title="{title}"' if title else ""
    d = f'<span class="d{" " + clase if clase else ""}">{marca}</span>'
    return f'<span class="col"{t}>{cartel}<span class="v">{v}</span><i style="height: {alto};"></i>{d}</span>'


def por_dia(cols, forma, cuenta, compu, cartel):
    """Las barras de un gráfico por día, rehechas desde los datos: `cuenta` (cuántas llegaron) o el monto de cada día."""
    dias = DIAS if compu else DIAS[-TEL:]
    llegaron = LLEGARON[forma] if compu else LLEGARON[forma][-TEL:]
    montos = MONTO[forma] if compu else MONTO[forma][-TEL:]
    vistos = VALOR.findall(cols)
    assert len(COL.findall(cols)) == len(dias) == len(vistos), ("las barras cambiaron", forma, len(vistos))
    if cuenta:
        assert vistos == [str(n) if n else "" for n in llegaron], ("los valores cambiaron", forma, vistos)
        valores = llegaron
    else:  # el número arriba de la barra va solo en las más altas de la 15 y en todas las de la 19 que tienen monto
        con_numero = [x >= 150 for x in montos] if forma == "15" else [x > 0 for x in montos]
        assert [bool(v) for v in vistos] == con_numero, ("los montos cambiaron", forma, vistos)
        valores = montos
    tope, ultimo, nuevas = max(valores), len(dias) - 1, ""
    for k, (d, val, v) in enumerate(zip(dias, valores, vistos)):
        if compu:
            con_marca, clase, alto = d.weekday() == 0, "", pct(val, tope, TOPE if cuenta else TOPE_MONTO)
        else:
            con_marca = k % CADA_TEL == 0
            clase = "ini" if k == 0 else "fin" if k == ultimo else ""
            alto = f"{round(val / tope * ALTO_TEL)}px"
        titulo = f"{fecha(d)} · {cantidad(val) if cuenta else monto(forma, val)}"
        tip = ""
        if cuenta and cartel is not None and k == cartel[0]:
            tip = cartel[1].format(TIP.format(titulo))
        nuevas += col(v, alto, fecha(d) if con_marca else "", clase if con_marca else "", titulo, tip)
    if not compu:  # el teléfono no se escala: sus alturas tienen que ser las que ya dibuja
        assert ALTO.findall(nuevas) == ALTO.findall(cols), ("las alturas del teléfono cambiaron", forma)
        assert ultimo % CADA_TEL == 0, "la última barra del teléfono tiene que llevar su marca"
    return nuevas


def por_semana(cols):
    """«Cuántas llegaron, por semana» (compu): las mismas barras, con la altura en proporción a su número."""
    vistos = VALOR.findall(cols)
    marcas = MARCA.findall(cols)
    assert len(vistos) == len(marcas) == 4 and all(" – " in m for m in marcas), ("las semanas cambiaron", marcas)
    tope = max(int(v) for v in vistos)
    return "".join(col(v, pct(int(v), tope), m) for v, m in zip(vistos, marcas))


def graficos(t, forma, compu, cartel=None):
    """Cada `.tb-barras` del tablero, según el título de su tarjeta. `cartel` = (barra, envoltorio) en «Cuántas llegaron, por día»."""
    vistos, salida, desde = [], "", 0
    for m in re.finditer(r'(<div class="tb-barras">)(.*?)(</div>)', t, re.S):
        cab = t.rfind('<div class="tb-cab"><span><b>', 0, m.start())
        titulo = re.match(r'<div class="tb-cab"><span><b>([^<]*)</b>', t[cab:]).group(1)
        if titulo == "Cuántas llegaron, por día":
            cols = por_dia(m.group(2), forma, True, compu, cartel)
        elif titulo in ("Monto estimado, por día", "Total, por día"):
            cols = por_dia(m.group(2), forma, False, compu, None)
        elif titulo == "Cuántas llegaron, por semana" and compu:
            cols = por_semana(m.group(2))
        else:
            raise AssertionError(("un gráfico que no conozco", titulo))
        vistos.append(titulo)
        salida += t[desde:m.start()] + m.group(1) + cols + m.group(3)
        desde = m.end()
    return salida + t[desde:], vistos


# ---------------------------------------------------------------------------------------------------------------- el estilo
CSS = """<style data-eje="por-dia">
/* v173 · El eje por día (decisión del usuario del 10/11): cada marca lleva la fecha completa y van menos marcas, para que entren;
   la primera y la última del teléfono no salen de su gráfico. El cartel de cada barra, con su fecha; las barras, en proporción. */
.tb-barras .col i { flex-shrink: 0; }
.tb-barras .col .v, .tb-barras .col .d { line-height: 1.3; }
.tb-barras .col .d { min-height: 1.3em; white-space: nowrap; }
.tb-barras .col .d.ini { align-self: flex-start; }
.tb-barras .col .d.fin { align-self: flex-end; }
.tb-tip { position: relative; z-index: 3; white-space: nowrap; padding: 8px 10px; border-radius: 8px; background: oklch(0.27 0.012 60); color: #fff; font-size: 12px; font-variant-numeric: tabular-nums; line-height: 1.4; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); }
</style>
"""


def renglon(t):
    """El final de línea del tablero, para no cambiarlo."""
    return "\r\n" if "\r\n" in t else "\n"


def con_css(t):
    """El estilo, una vez. Si ya está, queda donde está: en la compu, la pasada de las piezas le escala los px y guarda el original
    al lado (`5.8px/*8px*/`), así que se compara con los originales."""
    nuevo = CSS.replace("\n", renglon(t))
    m = re.search(r'<style data-eje="por-dia">.*?</style>\r?\n', t, flags=re.S)
    if m and re.sub(r"[\d.]+px/\*([\d.]+px)\*/", r"\1", m.group(0)) == nuevo:
        return t
    if m:
        t = t[:m.start()] + t[m.end():]
    return t.replace("</helmet>", nuevo + "</helmet>", 1)


# ---------------------------------------------------------------------------------------------------------------- los estados
def compu(t, forma):
    t, vistos = graficos(t, forma, True, (CARTEL_COMPU, '<sc-if value="{{{{cartel}}}}" hint-placeholder-val="{{{{no}}}}">{}</sc-if>'))
    assert vistos.count("Cuántas llegaron, por día") == 1 and len(vistos) == 3, vistos
    t = cambiar(t, '"options":["Por día","Por semana",', f'"options":["Por día","{ESTADO}","Por semana",')
    t = cambiar(t, "conDatos: ['Por día', 'Por semana',", f"conDatos: ['Por día', '{ESTADO}', 'Por semana',")
    n = renglon(t)
    t = cambiar(t, f"      si: true, no: false,{n}", f"      si: true, no: false, cartel: e === '{ESTADO}',{n}")
    return con_css(t)


def bloque(t, inicio):
    """Un <sc-if> entero, con lo que tenga adentro: (desde, hasta)."""
    i, nivel = t.index(inicio), 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        nivel += 1 if m.group(0) != "</sc-if>" else -1
        if nivel == 0:
            return i, i + m.end()
    raise AssertionError(("sin cierre", inicio))


S0, S2, S3 = ('<sc-if value="{{s0}}" hint-placeholder-val="{{si}}">', '<sc-if value="{{s2}}" hint-placeholder-val="{{no}}">',
              '<sc-if value="{{s3}}" hint-placeholder-val="{{no}}">')


def telefono(t, forma):
    # El estado del cartel es «Por día» con la barra tocada: se copia antes de rehacer los gráficos, y se rehace con su cartel.
    if S3 in t:
        a, b = bloque(t, S3)
        t = t[:a] + t[b:]
    a, b = bloque(t, S0)
    s3 = S3 + t[a + len(S0):b]
    s3, vistos3 = graficos(s3, forma, False, (CARTEL_TEL, "{}"))
    t, vistos = graficos(t, forma, False)
    assert vistos == ["Cuántas llegaron, por día"] * 2 and vistos3 == vistos[:1], (vistos, vistos3)
    _, fin2 = bloque(t, S2)
    t = t[:fin2] + s3 + t[fin2:]
    t = cambiar(t, '"options":["Por día","Una tarjeta: menú","Sin respuestas"]',
                f'"options":["Por día","{ESTADO}","Una tarjeta: menú","Sin respuestas"]')
    t = cambiar(t, 'const k = ["Por día", "Una tarjeta: menú", "Sin respuestas"].indexOf(e);',
                f'const k = ["Por día", "Una tarjeta: menú", "Sin respuestas", "{ESTADO}"].indexOf(e);')
    n = renglon(t)
    t = cambiar(t, f"      s2: k === 2,{n}", f"      s2: k === 2,{n}      s3: k === 3,{n}")
    return con_css(t)


if __name__ == "__main__":
    cambiados = []
    for nombre, forma in TABLEROS.items():
        t = leer(nombre)
        nuevo = telefono(t, forma) if nombre.startswith("M-") else compu(t, forma)
        assert re.search(r'<span class="d(?: [a-z]+)?">\d{1,2}</span>', nuevo) is None, (nombre, "quedó un día sin su fecha")
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    print("ok", len(TABLEROS), "tableros,", len(cambiados), "cambiados")
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(TABLEROS))
