"""Las fechas completas en los tableros vivos (lienzo v171, 2026-11-09), con la decisión del usuario del 2026-10-25 que dice
`docs/rules/formatos.md`: una fecha va completa, con su año (27/09/2026), y un momento con su hora, en la zona de quien mira
(27/09/2026 14:35); nunca «hace 2 horas», «En 6 días», «Hoy», «Ayer» ni «27/09». La app la cumple desde la F4 (front `47822f6d`)
y acá la siguen los tableros que todavía no:

- la invitación (`Invitacion` y `M-Invitacion`), como `InvitationPage.tsx` y su test: «Dueño · 30/09/2026 09:00» y «Vence
  07/10/2026 09:00», en lugar de «hace 1 día» y «En 6 días»;
- la campana de `Criterio-Avisos` («hace 10 min», «hace 1 hora» y «hoy, 09:12»), el 27/09/2026, como en `Campana`;
- los chats y los contactos del teléfono de `Criterio-Marco` («10:42», «Ayer», «Hoy» y «29/09»), con las fechas de `M-WA-Chats`
  y `M-WA-Contactos`, y las filas de la bandeja de `WA-Chats-Formulario-16`, el 25/10/2026, como sus otras filas;
- los chats de la 19, la 20 y la 21 (`WA-Chats-Visor`, `-Avisos`, `-Formulario-20`, `-Respuesta-19` y `-Respuesta-21`, con sus
  teléfonos), que pasan en el día de la visita, el 13/10/2026, como la 18 (`WA-Chats-Adjuntos`): el separador del hilo dice la
  fecha; la fila, la fecha y la hora (Martín Paz, el día anterior a las 17:10, como en `WA-Chats`), y «Se puede mandar hasta el
  14/10/2026 10:48.», como la 12. En `WA-Chats-Avisos`, el comprobante que salía «16:05 del día siguiente» va después de su
  separador, «14/10/2026», como lo dibuja la app (`MessageThread`);
- los momentos del detalle de una respuesta de la 21 y la 23: «Por aprobar» dice desde cuándo, con la fecha que ya tenía en su
  `title`, y «hace un momento» pasa a la hora del tablero (15/10/2026 18:20, dos horas después de las 16:20 de «Por aprobar», y
  15/10/2026 18:30 al corregir);
- las semanas del tablero de un formulario (`FRM-Tablero`, `-19` y `-21`), como `DateRangeText`: «21/09/2026 – 27/09/2026».

Quedan como están, a propósito: lo que no es una fecha (lo que dura algo, como «Vence en 10 minutos»; el período de un tope, como
«Te quedan 10 consultas hoy» o «Consultas hoy», y el filtro «Hoy» de Auditoría, que la app también tiene; los horarios, y lo que
escribe una persona, un bot o el asistente en un mensaje, como «Mañana paso por el depósito.»); la hora sola de una burbuja y de
la actividad de una respuesta, porque la fecha va una vez por día, en el separador o en la primera fila, como en la app y en
ArquitecturaBase; los días del eje «por día» del tablero (26, 27…), que pasa `eje_por_dia_1004.py` (v173); el texto de una regla que nombra lo
prohibido; lo que dibuja una pantalla que no es nuestra (el correo y el WhatsApp de `Mensajes`); lo que un tablero no dibuja (`rel`
y `resumen` de `Auditoria-Org`), y el Archivo.

Corre al final de todo, después de `paleta_pradera_1004.py`; al terminar imprime los tableros para la pasada de las piezas
(`python traspaso10_piezas_1004.py --tableros …`). Solo cambia textos: no suma medidas ni toca `canvas.json`. Lee y escribe sin
cambiar los finales de línea, y se puede volver a correr: lo que ya está hecho no vuelve a encontrar lo que busca.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MOMENTO = re.compile(r"\d{2}/\d{2}/\d{4} \d{2}:\d{2}")


def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t)


def cambiar(t, viejo, nuevo, veces):
    """`viejo` por `nuevo`, que está `veces` veces. Si ya no está (o `nuevo` ya está, cuando lo contiene), es una corrida anterior."""
    if viejo in nuevo and t.count(nuevo) == veces:
        return t
    k = t.count(viejo)
    if k == 0:
        assert nuevo in t, ("no encuentro", viejo[:160])
        return t
    assert k == veces, (viejo[:160], k, veces)
    return t.replace(viejo, nuevo)


def fila(nombre, cuando):
    """La fila de una bandeja o de una lista del teléfono: el nombre y, a la derecha, cuándo."""
    return f"<b>{nombre}</b><span>{cuando}</span>"


# ---------------------------------------------------------------------------------------------------------------- la invitación
# InvitationPage.tsx: `<DateText kind="dateTime">` en quién invitó y en «Vence»; su test, con la invitación del 30/09/2026 a las
# 12:00 UTC que vence el 07/10/2026 (un día después y seis antes de lo que decían «hace 1 día» y «En 6 días»), en la zona de quien mira.
INVITACION = [
    ('<span class="n2">Dueño · hace 1 día</span>', '<span class="n2">Dueño · 30/09/2026 09:00</span>', 1),
    ('<span class="k">Vence</span><span class="v">En 6 días</span>', '<span class="k">Vence</span><span class="v">07/10/2026 09:00</span>', 1),
]

# ---------------------------------------------------------------------------------------------------------------- los Criterio
# La campana de ejemplo, el 27/09/2026 a las 10:45 (el «ahora» de WhatsApp y de `Campana`), de la más nueva a la más vieja.
CAMPANA = [
    ("<small>hace 10 min</small>", "<small>27/09/2026 10:35</small>", 1),
    ("<small>hace 1 hora</small>", "<small>27/09/2026 09:45</small>", 1),
    ("<small>hoy, 09:12</small>", "<small>27/09/2026 09:12</small>", 2),
]
# Los teléfonos de Chats y de Contactos, con las fechas de `M-WA-Chats` y `M-WA-Contactos`.
MARCO = [
    (fila("Martina López", "10:42"), fila("Martina López", "27/09/2026 10:42"), 1),
    (fila("+54 9 351 555-0192", "10:15"), fila("+54 9 351 555-0192", "27/09/2026 10:15"), 1),
    (fila("Federico Díaz", "Ayer"), fila("Federico Díaz", "26/09/2026 18:40"), 2),
    (fila("Javier Pereyra", "Ayer"), fila("Javier Pereyra", "26/09/2026 16:25"), 1),
    (fila("Martina López", "Hoy"), fila("Martina López", "27/09/2026 10:42"), 1),
    (fila("Carla Ruiz", "29/09"), fila("Carla Ruiz", "25/09/2026 11:07"), 1),
]

# ---------------------------------------------------------------------------------------------------------------- los chats
# La 16 pasa el 25/10/2026: las horas de cada uno son las de `WA-Chats`; Carla Ruiz, a la hora de su último mensaje.
E16 = [
    (fila("0351 15-555-0192", "10:15"), fila("0351 15-555-0192", "25/10/2026 10:15"), 1),
    (fila("Federico Díaz", "Ayer"), fila("Federico Díaz", "24/10/2026 18:40"), 1),
    (fila("Javier Pereyra", "Ayer"), fila("Javier Pereyra", "24/10/2026 16:25"), 1),
    (fila("Carla Ruiz", "05/10"), fila("Carla Ruiz", "05/10/2026 11:07"), 1),
]
# La 19, la 20 y la 21 pasan el día de la visita, como la 18; el día siguiente es el del comprobante fuera de las 24 horas.
HOY, AYER, MANANA = "13/10/2026", "12/10/2026", "14/10/2026"
CHATS = ["WA-Chats-Visor", "WA-Chats-Avisos", "WA-Chats-Formulario-20", "WA-Chats-Respuesta-19", "WA-Chats-Respuesta-21"]
CHATS_TEL = ["M-WA-Chats-Visor", "M-WA-Chats-Formulario-20", "M-WA-Conversacion-Avisos", "M-WA-Conversacion-Respuesta-19",
             "M-WA-Conversacion-Respuesta-21"]
APARTE = {"WA-Chats-Avisos": {"Fuera de las 24 horas": MANANA}}  # el último mensaje de ese estado es el del día siguiente
HASTA = ("Se puede mandar hasta mañana a las 10:48.", f"Se puede mandar hasta el {MANANA} 10:48.")
ENVIOS = {"WA-Chats-Formulario-20": 4, "M-WA-Chats-Formulario-20": 3}
# «Fuera de las 24 horas»: el comprobante sale al día siguiente, después de su separador, y su pie dice solo la hora.
COMPROBANTE = '<div class="w-m sal"><span class="gl">Aprobaron VIS-000126. Te mandamos el comprobante. (con la plantilla'
PIE_SIGUIENTE = ('<span class="pie">Automático · 16:05 del día siguiente · Entregado</span>',
                 '<span class="pie">Automático · 16:05 · Entregado</span>')
# La hora de la fila de la conversación abierta, que sale del JS del tablero ({{hora}}): un valor por estado y el de entrada.
HORA = re.compile(r"(hora: \{)([^}]*)(\}\[e\] \?\? ')([^']*)(')")


def horas(t, nombre):
    aparte = APARTE.get(nombre, {})

    def una(m):
        cuerpo = re.sub(r'"([^"]*)": "(\d{2}:\d{2})"', lambda x: f'"{x[1]}": "{aparte.get(x[1], HOY)} {x[2]}"', m[2])
        entrada = m[4] if MOMENTO.fullmatch(m[4]) else f"{HOY} {m[4]}"
        return m[1] + cuerpo + m[3] + entrada + m[5]

    t, n = HORA.subn(una, t)
    assert n == 1, (nombre, n)
    valores = re.findall(r'"[^"]*": "([^"]*)"', HORA.search(t)[2])
    assert valores and all(MOMENTO.fullmatch(v) for v in valores), (nombre, valores)
    return t


def chat(t, nombre):
    if nombre in CHATS:
        t = cambiar(t, '<span class="w-dia">Hoy</span>', f'<span class="w-dia">{HOY}</span>', 1)
        t = cambiar(t, fila("Martín Paz", "Ayer"), fila("Martín Paz", f"{AYER} 17:10"), 1)
        t = horas(t, nombre)
    else:
        t = cambiar(t, '<span class="ap-dia">Hoy</span>', f'<span class="ap-dia">{HOY}</span>', 1)
    if nombre in ENVIOS:
        t = cambiar(t, *HASTA, ENVIOS[nombre])
    if nombre == "WA-Chats-Avisos":
        t = cambiar(t, COMPROBANTE, f'<span class="w-dia">{MANANA}</span>' + COMPROBANTE, 1)
        t = cambiar(t, *PIE_SIGUIENTE, 1)
    return t


# ---------------------------------------------------------------------------------------------------------------- las respuestas
# «Por aprobar» decía cuánto hacía, con la fecha en su `title`: va la fecha, como `DateText` (sin `title`, que era para lo relativo).
DESDE = re.compile(r'<span title="(\d{2}/\d{2}/\d{4} \d{2}:\d{2})">hace [^<]*</span>')
RESPUESTAS = {  # cuántos `title` con «hace…», y lo que no lo tenía: el teléfono, y lo que acaba de pasar
    "FRM-Respuesta-Aprobacion": (6, [('<span class="h">hace un momento</span>', '<span class="h">15/10/2026 18:20</span>', 2)]),
    "M-FRM-Respuesta-Aprobacion": (4, [('<span class="h">hace un momento</span>', '<span class="h">15/10/2026 18:20</span>', 1)]),
    "FRM-Respuesta-Anular": (3, []),
    "M-FRM-Respuesta-Anular": (0, [('<span class="h">hace 1 día</span>', '<span class="h">14/10/2026 09:30</span>', 2)]),
    "FRM-Respuesta-Corregir": (1, []),
    "M-FRM-Respuesta-Corregir": (0, [('<span class="h">hace un momento</span>', '<span class="h">15/10/2026 18:30</span>', 1)]),
    "FRM-Respuesta-Cadena": (2, []),
    "FRM-Respuestas-21": (3, []),
    "FRM-Respuestas-Propias-21": (1, []),
}


def respuesta(t, nombre):
    titulos, otros = RESPUESTAS[nombre]
    t, n = DESDE.subn(r"\1", t)
    assert n in (0, titulos), (nombre, n, titulos)
    for viejo, nuevo, veces in otros:
        t = cambiar(t, viejo, nuevo, veces)
    return t


# ---------------------------------------------------------------------------------------------------------------- el tablero
# «Cuántas llegaron, por semana»: cada semana, del lunes al domingo (la última, hasta hoy), como `DateRangeText`.
SEMANA = re.compile(r'<span class="d">(\d{2}/\d{2}) al (\d{2}/\d{2})</span>')
TABLEROS = ["FRM-Tablero", "FRM-Tablero-19", "FRM-Tablero-21"]


def tablero(t, nombre):
    t, n = SEMANA.subn(r'<span class="d">\1/2026 – \2/2026</span>', t)
    assert n in (0, 4) and t.count('/2026 – ') >= 4, (nombre, n)
    return t


# ---------------------------------------------------------------------------------------------------------------- todo
def lista(cambios):
    """Un paso que hace los `cambios` de una lista (viejo, nuevo, veces)."""
    def paso(t, nombre):
        for viejo, nuevo, veces in cambios:
            t = cambiar(t, viejo, nuevo, veces)
        return t
    return paso


PASOS = ([(n, lista(INVITACION)) for n in ("Invitacion", "M-Invitacion")]
         + [("Criterio-Avisos", lista(CAMPANA)), ("Criterio-Marco", lista(MARCO)), ("WA-Chats-Formulario-16", lista(E16))]
         + [(n, chat) for n in CHATS + CHATS_TEL]
         + [(n, respuesta) for n in RESPUESTAS]
         + [(n, tablero) for n in TABLEROS])


if __name__ == "__main__":
    cambiados = []
    for nombre, paso in PASOS:
        t = leer(nombre)
        nuevo = paso(t, nombre)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    print("ok", len(PASOS), "tableros,", len(cambiados), "cambiados")
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(n for n, _ in PASOS))
