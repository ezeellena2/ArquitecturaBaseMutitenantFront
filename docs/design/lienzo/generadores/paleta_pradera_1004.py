"""La paleta «Pradera» (decisión del usuario del 2026-11-04, elegida sobre la app real): verde pasto como marca, marco paja y un
celeste propio para «pendiente». Reemplaza al verde petróleo y al marco arena en los 438 tableros, Archivo incluido.

Cada tablero trae su propia copia de la paleta (la de base, la C y la C2) y unos 110 valores sueltos. Este script lleva cada valor
viejo al nuevo según su papel, con la tabla de abajo:
- los que tienen par en la app salen de la tabla de `docs/architecture/tema.md` y de `src/index.css` del front (93e5efd6);
- los que la app no tiene se llevan con la misma regla: la marca (matiz 170 a 195) pasa a 128-150 con el mismo tono, un poco más
  oscura y con más color, y sus tintes claros pasan a 130 con 1,4 veces su color; el arena y los neutros claros (matiz 75 a 80 con
  poca intensidad) pasan a 95, el tono paja, con el mismo tono y un poco más de color.

No cambian los textos (--t1 a --t3, y --lado-t1 y --lado-t3, que la app no tiene), las sombras y los velos neutros, los colores de
estado (correcto, ámbar de alerta de matiz 70 a 90 con más intensidad, peligro y el punto apagado), ni lo que no es de la marca: las
fotos de ejemplo, el teléfono de WhatsApp de la vista previa, Meta y Google, el globo de lo automático y los colores del PDF que se
eligen. «Pendiente» (invitación pendiente, se invita, difusión programada, espera aprobación) deja el color de la marca y pasa a
`oklch(0.62 0.12 240)`, como --punto-pendiente de la app.

En el diseño del PDF (FRM-Pdf), el color arranca con el del sistema (decisión 82): «Verde, el del sistema» va primero, y «Petróleo»,
el del sistema de antes, queda como una opción más en el lugar del verde que había.

Corre al final de todo, después de la cola de los generadores. Se puede volver a correr: ningún valor nuevo está entre los viejos, así
que la segunda corrida no cambia nada.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

# Valor viejo (L C H, como está escrito en los tableros) → valor nuevo. La transparencia, si la hay, se conserva.
MARCA = {
    "0.5 0.1 195": "0.48 0.115 140",      # --marca; con / 0.3, --marca-sombra
    "0.51 0.099 195": "0.48 0.115 140",   # --marca de la paleta de base; con transparencia, el halo del foco y lo elegido
    "0.45 0.1 195": "0.43 0.115 140",     # --marca-h
    "0.46 0.099 195": "0.43 0.115 140",   # --marca-h de base
    "0.43 0.09 195": "0.41 0.1 140",      # --marca-tx y --lado-activo-t: el texto de la marca y el ítem activo del menú
    "0.42 0.093 195": "0.41 0.1 140",     # --marca-tx de base
    "0.58 0.11 170": "0.66 0.15 128",     # --marca-2: el segundo color del degradado del logo
    "0.48 0.099 195": "0.47 0.11 140",    # --auth-panel-start: el panel de Ingreso y el cierre de la portada
    "0.36 0.087 195": "0.35 0.09 145",    # --auth-panel-mid: el panel de Ingreso y el avatar de la organización
    "0.26 0.062 195": "0.25 0.06 150",    # --auth-panel-end
    "0.32 0.074 195": "0.31 0.078 147",   # el final del cierre de la portada, entre el medio y el final del panel de Ingreso
    "0.4 0.085 195": "0.39 0.1 143",      # el final de la tarjeta del inicio en el teléfono
    "0.47 0.08 195": "0.48 0.115 140",    # el color del PDF, que arranca con el del sistema (82)
    "0.5 0.08 180": "0.48 0.092 140",     # la sombra de una tarjeta elegida o con foco (con transparencia)
    "0.3 0.05 195": "0.3 0.06 140",       # --sugerencia-tx: el texto de lo propio en el chat y de la sugerencia
    "0.28 0.05 195": "0.28 0.06 140",     # el texto del globo propio en el teléfono
    "0.3 0.06 195": "0.3 0.07 140",       # --sombra-fab: la sombra del «+» del teléfono
    "0.26 0.05 195": "0.26 0.06 140",     # la sombra de la maqueta de la portada
    "0.82 0.08 195": "0.84 0.12 130",     # --franja-accion: «Copiar código» y «Reintentar» en la franja oscura
    "0.92 0.02 195": "0.92 0.028 130",    # el texto claro sobre el encabezado de color del PDF
}
TINTES = {
    "0.955 0.025 185": "0.955 0.035 130",  # --marca-t
    "0.95 0.025 185": "0.955 0.03 130",    # --fila-hover: la fila al pasar el mouse
    "0.975 0.015 185": "0.975 0.021 130",  # la sugerencia del asistente
    "0.96 0.03 185": "0.96 0.042 130",     # el globo del asistente
    "0.88 0.04 185": "0.88 0.056 130",     # las líneas de las respuestas rápidas del asistente
    "0.85 0.05 185": "0.85 0.07 130",      # el borde del globo del asistente
    "0.975 0.01 180": "0.975 0.014 130",   # la opción elegida de una tarjeta
    "0.93 0.04 180": "0.93 0.056 130",     # el globo propio en el teléfono
    "0.85 0.04 180": "0.85 0.056 130",     # la línea del botón dentro de un globo
    "0.86 0.04 170": "0.86 0.056 130",     # el borde de una tarjeta dentro de un globo
}
MARCO = {
    "0.925 0.02 75": "0.922 0.036 95",    # --lado y --barra: el menú lateral y la barra de arriba
    "0.87 0.022 75": "0.865 0.04 95",     # --lado-borde
    "0.895 0.022 75": "0.892 0.04 95",    # --lado-hover
    "0.905 0.022 75": "0.902 0.04 95",    # --panel: el segundo panel
    "0.875 0.024 75": "0.872 0.043 95",   # una opción del panel al pasar el mouse
    "0.85 0.026 75": "0.845 0.047 95",    # los bordes del panel
    "0.83 0.026 75": "0.825 0.047 95",    # la línea de un grupo abierto del panel
    "0.82 0.03 75": "0.815 0.052 95",     # --lado-guia
    "0.89 0.02 75": "0.887 0.036 95",     # la vía de un segmentado
    "0.945 0.018 76": "0.945 0.027 95",   # --cab: los encabezados arena de tablas, cajas y diálogos
    "0.89 0.02 76": "0.89 0.031 95",      # --borde-cab: su línea de abajo
    "0.95 0.018 76": "0.95 0.027 95",     # el borde del número de la campana
    "0.97 0.012 76": "0.97 0.018 95",     # las filas alternadas de una grilla de datos
    "0.93 0.02 76": "0.93 0.03 95",       # el fondo de un avatar sin foto
    "0.95 0.021 78": "0.95 0.032 95",     # el encabezado arena claro
    "0.88 0.032 78": "0.88 0.048 95",     # su línea de abajo
    "0.96 0.021 78": "0.96 0.032 95",     # --marca-t de base, que la paleta C tapa
    "0.94 0.028 78": "0.94 0.04 95",      # --fondo-brillo: el brillo de la página pública y de la portada
}
NEUTROS = {
    "0.985 0.004 80": "0.985 0.005 95",   # --fondo
    "0.97 0.007 80": "0.97 0.009 95",     # --s2 (y --cab de la paleta C)
    "0.945 0.009 80": "0.945 0.011 95",   # --s3
    "0.915 0.01 80": "0.915 0.013 95",    # --borde; con / 0.8, la línea entre columnas
    "0.84 0.014 80": "0.84 0.018 95",     # --borde2
    "0.968 0.012 78": "0.968 0.015 95",   # --fila-alterna
    "0.975 0.006 80": "0.975 0.008 95",   # --fondo de la paleta C, que la C2 tapa
    "0.978 0.007 80": "0.978 0.009 95",   # --fila-hover de la paleta C
    "0.965 0.008 80": "0.965 0.01 95",    # --lado y --barra de la paleta C, que la C2 tapa
    "0.935 0.01 80": "0.935 0.013 95",    # --lado-hover de la paleta C
    "0.95 0.015 80": "0.95 0.02 95",      # la vista previa de una sugerencia
    "0.975 0.003 78": "0.975 0.004 95",   # --fondo y --s2 de base
    "0.95 0.004 78": "0.95 0.005 95",     # --s3 de base
    "0.91 0.007 78": "0.91 0.009 95",     # --borde de base
    "0.83 0.01 78": "0.83 0.013 95",      # --borde2 de base
    "0.985 0.004 78": "0.985 0.005 95",   # una zona abierta
    "0.965 0.006 78": "0.965 0.008 95",   # una raya de separación
    "0.972 0.006 78": "0.972 0.008 95",   # el fondo gris del teléfono
    "0.975 0.006 78": "0.975 0.008 95",   # un encabezado tenue
    "0.985 0.006 78": "0.985 0.008 95",   # las filas tenues de una tabla
    "0.95 0.008 78": "0.95 0.01 95",      # la carga de una tarjeta
    "0.975 0.008 78": "0.975 0.01 95",    # las filas alternadas y el fondo de los mensajes
    "0.985 0.008 78": "0.985 0.01 95",    # el permiso elegido de un rol
    "0.85 0.01 78": "0.85 0.013 95",      # el interruptor apagado, como --borde2 en la app
    "0.88 0.01 78": "0.88 0.013 95",      # el interruptor apagado chico
    "0.9 0.01 78": "0.9 0.013 95",        # una barra de carga
    "0.93 0.01 78": "0.93 0.013 95",      # las barras de carga
    "0.9 0.012 78": "0.9 0.015 95",       # el avatar gris
    "0.965 0.012 78": "0.965 0.015 95",   # el fondo del chat en el teléfono
    "0.78 0.014 78": "0.78 0.018 95",     # el borde de una sección al pasar el mouse
    "0.42 0.018 60": "0.42 0.02 80",      # --lado-t2: el texto del menú lateral y del panel
}
MAPA = {**MARCA, **TINTES, **MARCO, **NEUTROS}
assert not set(MAPA.values()) & set(MAPA), "un valor nuevo no puede ser también uno viejo"

OKLCH = re.compile(r"oklch\(([0-9.]+ [0-9.]+ [0-9.]+)((?: / [0-9.]+%?)?)\)")
CELESTE = "oklch(0.62 0.12 240)"
# El punto de «pendiente»: invitación pendiente, se invita, difusión programada, espera aprobación.
PENDIENTE = re.compile(r"(\.(?:w-est\.(?:azul|prog|pend|inv|e11b-pet)|est\.pend|pill\.pend)::before \{ background: )"
                       r"var\(--marca\)((?: !important)?; \})")
TEXTOS = [
    ("/* C · Cálido y suave: neutros tibios, verde petróleo, bordes más redondos. */",
     "/* C · Cálido y suave: neutros tibios, verde pasto, bordes más redondos. */"),
    ("/* C2 · Cálido con marco arena (menú lateral y barra superior en un tono más marcado). */",
     "/* C2 · Cálido con marco paja (menú lateral y barra superior en un tono más marcado). */"),
    ("Al pasar el mouse, petróleo claro.", "Al pasar el mouse, verde claro."),
    ("verde activo, petróleo pendiente, ámbar atención", "verde activo, celeste pendiente, ámbar atención"),
    ("Escribiendo: borde petróleo", "Escribiendo: borde verde"),
    (" con letra petróleo.", " con letra verde."),
    ("<small>Petróleo, el del sistema</small>", "<small>Verde, el del sistema</small>"),
]


def muestra(nombre, color, clase):
    return (f'<span class="sw{clase}" role="radio" aria-label="{nombre}" title="{nombre}" '
            f'style="background: oklch({color});"></span>')


# Los colores del PDF: el del sistema primero (antes Petróleo, ahora Verde) y Petróleo en el lugar del verde de antes.
COLORES_VIEJOS = re.compile(re.escape(muestra("Petróleo", "0.47 0.08 195", "@1")).replace("@1", "( on)?")
                            + "(" + re.escape(muestra("Azul", "0.47 0.12 255", "@")).replace("@", "(?: on)?") + ")"
                            + re.escape(muestra("Verde", "0.5 0.1 150", "@3")).replace("@3", "( on)?"))
PETROLEO = re.compile(r'(<span class="sw(?: on)?" role="radio" aria-label="Petróleo" title="Petróleo" style="background: )'
                      r'oklch\(0\.47 0\.08 195\)(;"></span>)')
GUARDA = "\x00petroleo\x00"


def colores_pdf(t):
    return COLORES_VIEJOS.sub(lambda m: muestra("Verde", MARCA["0.47 0.08 195"], m.group(1) or "") + m.group(2)
                              + muestra("Petróleo", "0.47 0.08 195", m.group(3) or ""), t)


def pasar(t, cuenta):
    t = colores_pdf(t)
    t = PETROLEO.sub(lambda m: m.group(1) + GUARDA + m.group(2), t)  # la opción «Petróleo» del PDF conserva su color

    def valor(m):
        nuevo = MAPA.get(m.group(1))
        if nuevo is None:
            return m.group(0)
        cuenta[m.group(1)] = cuenta.get(m.group(1), 0) + 1
        return f"oklch({nuevo}{m.group(2)})"

    t = OKLCH.sub(valor, t)
    t, n = PENDIENTE.subn(lambda m: m.group(1) + CELESTE + m.group(2), t)
    cuenta["pendiente"] = cuenta.get("pendiente", 0) + n
    for viejo, nuevo in TEXTOS:
        cuenta["textos"] = cuenta.get("textos", 0) + t.count(viejo)
        t = t.replace(viejo, nuevo)
    return t.replace(GUARDA, "oklch(0.47 0.08 195)")


canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
cuenta, cambiados = {}, 0
for nombre in sorted(canvas["boards"]):
    ruta = PROJ / nombre
    t = ruta.read_text(encoding="utf-8")
    nuevo = pasar(t, cuenta)
    if nuevo != t:
        ruta.write_text(nuevo, encoding="utf-8")
        cambiados += 1

# Lo que queda de la marca vieja: solo la opción «Petróleo» del PDF y las fotos de ejemplo (matiz 170).
quedan = {}
for nombre in sorted(canvas["boards"]):
    t = PETROLEO.sub("", (PROJ / nombre).read_text(encoding="utf-8"))
    for m in OKLCH.finditer(t):
        tono = float(m.group(1).split()[2])
        if m.group(1) in MAPA or 175 <= tono <= 195:
            quedan[m.group(1)] = quedan.get(m.group(1), 0) + 1
print("ok", cambiados, "tableros;", sum(v for k, v in cuenta.items() if k in MAPA), "valores,",
      cuenta.get("pendiente", 0), "puntos de pendiente,", cuenta.get("textos", 0), "textos")
print("quedan de la marca vieja:", quedan or "nada")
