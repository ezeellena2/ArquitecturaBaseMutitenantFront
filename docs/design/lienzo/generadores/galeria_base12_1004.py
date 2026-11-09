"""Los errores del lienzo que encontró la galería de la base de la 12 (lienzo v172, 2026-11-09), copiados de la app, que ya hace lo
correcto, y los correos de `Mensajes` con la fecha completa:

- Sin cantidad en la pestaña de lo que solo crece (decisión del 04/10: «Cargar más» y sin total, y la API no da ese número):
  «Historial» de la organización y «Historial de seguridad» de una cuenta, en `Organizacion`, `Cuenta-Plat` y sus teléfonos, como
  `OrganizationPage.tsx` y `AccountPage.tsx`. «Dominio verificado» y «Página pública» tampoco llevan número: leerlo obliga a entrar a la
  organización y registrar un evento de seguridad, y eso no se hace solo para numerar una pestaña (decisión del coordinador, 09/11).
- `M-Recuperaciones` y `M-WA-Difusiones` se abren desde «Más»: van con ‹ y el grupo debajo del título («Gestión», «WhatsApp»), como
  `M-Legales` y `PrivateLayoutFrame.tsx`; la barra de abajo sigue con «Más» marcado.
- Lo que cuenta el número de la campana son los avisos sin leer, así que lo contado va sin leer (en 600 y con el punto, como
  `NotificationList.tsx` e `Inicio-Personal`): en `Campana`, `Campana-Plat` y las de cada etapa (la 14, la 21, la 23 y la 25), y en sus
  teléfonos. `Campana` y `Campana-Plat` suman las reglas que les faltaban para dibujar lo sin leer, también en «Versión nueva».
- «Avisos» en el teléfono (`M-Campana`, `M-Campana-Plat` y los de cada etapa) lleva la barra de abajo, sin ninguna sección marcada, como
  `M-Campana-Personal` y `NotificationsPage.tsx`: no es un chat ni lleva una acción fija abajo.
- `M-Inicio-Miembro` suma la campana, como `M-Inicio-Org`: un miembro también recibe avisos.
- Los correos y los WhatsApp de `Mensajes` con fecha copian el texto y el formato del back (`Notifications.resx`, `WhatsAppTexts.resx` y
  `DisplayFormatter`): la baja dice «Tu cuenta se borra el 27/10/2026.» y «Se borra el 27/10/2026.», con la fecha sola, y la que inicia la
  plataforma dice «inició el borrado de tu cuenta». Los avisos del tope del asistente van con la fecha completa: «hasta el 01/11/2026» y
  «el tope de octubre de 2026».

`Criterio-Decisiones` (la decisión del 04/10 sobre la fecha sin año, reemplazada por «Las fechas» del 25/10) sale de
`criterio_decisiones.py`. Este script corre al final de todo, después de `paleta_pradera_1004.py`; al terminar imprime los tableros para
la pasada de las piezas (`python traspaso10_piezas_1004.py --tableros …`). No toca `canvas.json`. Lee y escribe sin cambiar los finales
de línea, y se puede volver a correr: lo que ya está hecho no vuelve a encontrar lo que busca.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


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


def svg(cuerpo, tam, grosor):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{grosor}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{cuerpo}</svg>')


# ---------------------------------------------------------------------------------------------------------------- las pestañas
# En la compu, la pestaña lleva su número solo si lo tiene (`conC`); en el teléfono, sin el `<span class="c">`.
CON_NUMERO = ('{{t.n}}<span class="cnt">{{t.c}}</span>',
              '{{t.n}}<sc-if value="{{t.conC}}" hint-placeholder-val="{{si}}"><span class="cnt">{{t.c}}</span></sc-if>')
MAPA = (".map((t) => ({ ...t, sel:", ".map((t) => ({ ...t, conC: t.c !== '', sel:")
PESTANAS = {
    "Organizacion": [("{ id: 'historial', n: 'Historial', c: String(s.historial.length) }", "{ id: 'historial', n: 'Historial', c: '' }"),
                     ("{ id: 'dominio', n: 'Dominio verificado', c: s.dominio ? '1' : '0' }", "{ id: 'dominio', n: 'Dominio verificado', c: '' }"),
                     ("{ id: 'pagina', n: 'Página pública', c: '1' }", "{ id: 'pagina', n: 'Página pública', c: '' }")],
    "Cuenta-Plat": [("{ id: 'historial', n: 'Historial de seguridad', c: String(s.historial.length) }",
                     "{ id: 'historial', n: 'Historial de seguridad', c: '' }")],
}
FIJAS = {"Cuenta-Plat": ('Historial de seguridad<span class="cnt">3</span>', "Historial de seguridad", 1)}
SIN_NUMERO_TEL = re.compile(r'(>(?:Historial(?: de seguridad)?|Dominio verificado|Página pública)) <span class="c">\d+</span>')
TEL_PESTANAS = {"M-Organizacion": 21, "M-Cuenta-Plat": 12}  # cuántas pestañas pierden su número


def pestanas_compu(t, nombre):
    t = cambiar(t, *CON_NUMERO, 1)
    t = cambiar(t, *MAPA, 1)
    for viejo, nuevo in PESTANAS[nombre]:
        t = cambiar(t, viejo, nuevo, 1)
    if nombre in FIJAS:
        t = cambiar(t, *FIJAS[nombre])
    return t


def pestanas_tel(t, nombre):
    t, n = SIN_NUMERO_TEL.subn(r"\1", t)
    assert n in (0, TEL_PESTANAS[nombre]), (nombre, n)
    return t


# ---------------------------------------------------------------------------------------------------------------- desde «Más»
VOLVER = svg('<path d="M15 5 8 12l7 7"/>', 24, "2")
BARRAS = {  # el tablero: (la barra de primer nivel, adónde vuelve ‹, el grupo de «Más», cuántas)
    "M-Recuperaciones": ("Recuperaciones", "Plataforma", "M-Mas-Plat", "Gestión", 1),
    "M-WA-Difusiones": ("Difusiones", "Grupo Delta", "M-WA-Menu", "WhatsApp", 4),
}


def desde_mas(t, nombre):
    titulo, antes, vuelve, grupo, veces = BARRAS[nombre]
    viejo = f'<div class="ap-bar"><div class="tit"><h1>{titulo}</h1><span class="sub">{antes}</span></div>'
    nuevo = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{vuelve}.dc.html">{VOLVER}</a>'
             f'<div class="tit"><h1>{titulo}</h1><span class="sub">{grupo}</span></div>')
    return cambiar(t, viejo, nuevo, veces)


# ---------------------------------------------------------------------------------------------------------------- la campana
# Lo contado va sin leer: en la compu, con `sin-leer`, la etiqueta que lo dice y el punto (Inicio-Personal); en el teléfono, en 600
# y con el punto en lugar de la flecha (M-Campana-Personal).
LEIDO = re.compile(r'<a class="cmp-it" href="([^"]*)"><span class="cmp-ic ([a-z]+)">(<svg\b.*?</svg>)</span>'
                   r'<span class="cmp-tx">([^<]*)<small>([^<]*)</small></span></a>', re.S)
LEIDO_TEL = re.compile(r'<a class="cp-fila" href="([^"]*)"><span class="cmp-ic ([a-z]+)">(<svg\b.*?</svg>)</span>'
                       r'<span class="tx">([^<]*)<small>([^<]*)</small></span><span class="chev"><svg\b.*?</svg></span></a>', re.S)
PUNTO_TEL = ('<span class="cmp-punto" aria-hidden="true" style="align-self: center; width: 9px; height: 9px; border-radius: 50%; '
             'background: var(--marca); flex-shrink: 0;"></span>')
# Las reglas de lo sin leer, como en las campanas de cada etapa (`CSS` de campana_1004.py): a `Campana` y `Campana-Plat` les faltaban.
LLEGO = ".cmp-ic.llego { background: var(--marca-t); color: var(--marca-tx); }\r\n"
SIN_LEER_CSS = (".cmp-ic.version { background: var(--marca-t); color: var(--marca-tx); }\r\n"
                ".cmp-it.sin-leer .cmp-tx { font-weight: 600; }\r\n"
                ".cmp-it .cmp-punto { margin-left: auto; align-self: center; width: 8px; height: 8px; border-radius: 50%; background: var(--marca); "
                "flex-shrink: 0; }\r\n")
CAMPANAS = {"Campana": 2, "Campana-Plat": 4, "Campana-14": 2, "Campana-21": 3, "Campana-23": 4, "Campana-25": 6}  # cuántos se leían
CAMPANAS_TEL = {"M-Campana": 2, "M-Campana-Plat": 4, "M-Campana-14": 2, "M-Campana-21": 3, "M-Campana-23": 4, "M-Campana-25": 6}


def sin_leer(t, nombre):
    t, n = LEIDO.subn(lambda m: (f'<a class="cmp-it sin-leer" href="{m[1]}" aria-label="{m[4]}, sin leer"><span class="cmp-ic {m[2]}">{m[3]}</span>'
                                 f'<span class="cmp-tx">{m[4]}<small>{m[5]}</small></span><span class="cmp-punto" aria-hidden="true"></span></a>'), t)
    assert n in (0, CAMPANAS[nombre]), (nombre, n)
    if ".cmp-it.sin-leer .cmp-tx" not in t:
        t = cambiar(t, LLEGO, LLEGO + SIN_LEER_CSS, 1)
    return t


def nav(tablero):
    """La barra de abajo de `tablero`, sin ninguna sección marcada: «Avisos» no es una de ellas."""
    t = leer(tablero)
    m = re.search(r'<nav class="ap-nav" aria-label="Secciones">.*?</nav>', t, re.S)
    assert m, tablero
    return m[0].replace(' class="on" aria-current="page"', "")


def avisos_tel(t, nombre):
    t, n = LEIDO_TEL.subn(lambda m: (f'<a class="cp-fila" href="{m[1]}"><span class="cmp-ic {m[2]}">{m[3]}</span>'
                                     f'<span class="tx"><b style="font-weight: 600;">{m[4]}</b><small>{m[5]}</small></span>{PUNTO_TEL}</a>'), t)
    assert n in (0, CAMPANAS_TEL[nombre]), (nombre, n)
    if '<nav class="ap-nav"' not in t:
        barra = nav("M-Mas-Plat" if nombre == "M-Campana-Plat" else "M-WA-Menu")
        t = cambiar(t, '<span class="ap-raya"></span>', barra + '<span class="ap-raya"></span>', 1)
    return t


# El Inicio del miembro, con la campana de M-Inicio-Org, a la derecha de la cabecera y con sus reglas (`CSS_TEL` de campana_1004.py).
CAMPANA_TEL = svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>', 20, "1.75")
BOTON_INICIO = f'<a class="c-campana" href="M-Campana.dc.html" aria-label="Avisos: 1">{CAMPANA_TEL}<span class="n">1</span></a>'


def inicio_miembro(t, nombre):
    if "c-campana" in re.sub(r"<style\b.*?</style>", "", t, flags=re.S):
        return t
    t = cambiar(t, '<div class="c-hola">', BOTON_INICIO + '<div class="c-hola">', 1)
    if 'data-campana="tel"' not in t:
        bloque = re.search(r'<style data-campana="tel">.*?</style>\r?\n', leer("M-Inicio-Org"), re.S)[0]
        t = cambiar(t, "</helmet>", bloque + "</helmet>", 1)
    return t


# ---------------------------------------------------------------------------------------------------------------- los mensajes
# La baja: `DeletionRequested*` de Notifications.resx y `baja_cuenta_*` de WhatsAppTexts.resx, con `FormatDate` (la fecha sola). La
# que inicia la plataforma «inició el borrado». El tope del asistente: la fecha y el mes completos.
MENSAJES = [
    ("Tu cuenta se borra el 27/10/2026 14:35.", "Tu cuenta se borra el 27/10/2026.", 3),
    ("Se borra el 27/10/2026 14:35.", "Se borra el 27/10/2026.", 3),
    ("La plataforma pidió borrar tu cuenta", "La plataforma inició el borrado de tu cuenta", 6),
    ("la plataforma pidió borrar tu cuenta", "la plataforma inició el borrado de tu cuenta", 2),
    ("de tope de octubre", "de tope de octubre de 2026", 4),
    ("el 1 de noviembre", "el 01/11/2026", 4),
]


def mensajes(t, nombre):
    for viejo, nuevo, veces in MENSAJES:
        t = cambiar(t, viejo, nuevo, veces)
    return t


# ---------------------------------------------------------------------------------------------------------------- todo
PASOS = ([(n, pestanas_compu) for n in PESTANAS] + [(n, pestanas_tel) for n in TEL_PESTANAS]
         + [(n, desde_mas) for n in BARRAS]
         + [(n, sin_leer) for n in CAMPANAS] + [(n, avisos_tel) for n in CAMPANAS_TEL]
         + [("M-Inicio-Miembro", inicio_miembro), ("Mensajes", mensajes)])


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
