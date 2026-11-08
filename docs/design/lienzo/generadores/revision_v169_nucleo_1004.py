"""La revisión del 2026-11-08 (lienzo v169), en los tableros del núcleo y en los catálogos de la E12 y la E13: lo que contradecía una
decisión de la hoja de ruta. La lista es la sección «lienzo-nucleo» de la revisión; las specs corregidas están en el back, en `d248c499`.

- El bot de WhatsApp (162, ninguna elección se descarta en silencio): en `WA-Admin-Editar` y `M-WA-Editar`, cambiar lo que hace una
  opción pregunta antes de quitar lo escrito. Dos estados nuevos: «Cambiar a un texto» («¿Cambiar a «Contesta un texto»? Se quita
  el equipo.») y «Cambiar a un equipo» («¿Cambiar a «Pasa a un equipo»? Se quita el texto.»), con «Cancelar» y «Cambiar». Es una
  confirmación (`Criterio-Dialogos`): la pregunta de título, sin ✕, la principal y el foco en «Cancelar» (161). Ocupa el lugar del
  diálogo de la opción, porque un diálogo no va arriba de otro.
- `Cuenta-Plat` y `M-Cuenta-Plat` (78): sale «Administrar la biblioteca de formularios», que nace en la E22. Deshace
  `formularios_permiso_plat_1004.py`, que no se vuelve a correr.
- «Más de 200» (12 y 22): en `FRM-Catalogo-Filtros`, `FRM-Catalogo-Contactos` y sus teléfonos, «y 212 opciones más» (211 en los
  contactos) suma su ⓘ: «Con estos filtros hay 215 opciones, y WhatsApp muestra hasta 200.».
- `FRM-Catalogo-Filtros` y su teléfono (36): el nombre que no entra se corta en 29 caracteres y «…», «Florencia Fernández de la Fue…».
- `FRM-Catalogo-Importar`: «Bajar la plantilla» pasa a «Descargar la plantilla», como en `FRM-Catalogo`.
- `FRM-Catalogo`, «Se borra al guardar» (129): ↑ ↓ siguen apagados, con su motivo en el tooltip, «Guardá o descartá el borrado
  pendiente para mover opciones.». En `M-FRM-Catalogo` estaban prendidos: se apagan, con el mismo motivo, como dice la spec.
- `M-FRM-Catalogo`, `M-FRM-Catalogo-13` y `M-FRM-Catalogo-14` (129): el 🗑 de una opción guardada dice «Borrar …», como en la compu.
  «Quitar …» queda para lo que se saca de una lista, como un campo de «Elegir qué muestra».

Corre después de `traspaso10_piezas_1004.py`; al terminar imprime la lista de tableros para volver a pasarles la pasada
(`python traspaso10_piezas_1004.py --tableros …`), que les pone la escala a lo que suma este script. No toca `canvas.json`: no hay
tableros nuevos ni cambian los tamaños. Se puede volver a correr.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
AQUI = pathlib.Path(__file__).resolve().parent
PROJ = AQUI.parent

MARCA = 'data-v169="nucleo"'
BLOQUE = re.compile(r'<style data-v169="nucleo">.*?</style>\n', re.S)


def svg(cuerpo, tam=18, grosor="1.75"):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{grosor}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{cuerpo}</svg>')


# La (i) de cada tablero: la de la compu (14, la de `.f-i`) y la del teléfono (16, la de `.ap-i`).
INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 14)
INFO_TEL = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 16, "2")


def leer(nombre):
    return (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")


def escribir(nombre, t):
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


def cambiar(t, viejo, nuevo, veces=None):
    """`viejo` por `nuevo`. Si `viejo` ya no está, tiene que estar `nuevo`: es una corrida anterior."""
    k = t.count(viejo)
    if k == 0:
        assert nuevo in t, ("no encuentro", viejo[:160])
        return t
    assert veces is None or k == veces, (viejo[:160], k, veces)
    return t.replace(viejo, nuevo)


def con_css(t, css):
    t = BLOQUE.sub("", t)
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def bloque_si(t, valor, desde=0):
    """Dónde empieza y termina el primer `<sc-if value="{{valor}}">` desde `desde`, con lo que tenga adentro."""
    ini = t.index(f'<sc-if value="{{{{{valor}}}}}"', desde)
    nivel = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[ini:]):
        nivel += 1 if m.group(0) == "<sc-if" else -1
        if nivel == 0:
            return ini, ini + m.end()
    raise AssertionError(("sc-if sin cerrar", valor))


def sin_estados(t, valores):
    """Saca los estados que suma este script (de una corrida anterior); no llevan otro `sc-if` adentro."""
    for v in valores:
        t = re.sub(r'<sc-if value="\{\{' + v + r'\}\}" hint-placeholder-val="\{\{no\}\}">.*?</sc-if>', "", t, flags=re.S)
    return t


# ================================================================================================================ el bot (162)
CAMBIOS = [  # el estado, a qué pasa la opción y qué se quita
    ("e3", "Cambiar a un texto", "Contesta un texto", "el equipo"),
    ("e4", "Cambiar a un equipo", "Pasa a un equipo", "el texto"),
]
TWEAK = '"Sin equipos · elegir"],"default"'
TWEAK_NUEVO = '"Sin equipos · elegir",' + ",".join(f'"{n}"' for _, n, _, _ in CAMBIOS) + '],"default"'
JS = '      e2: e === "Sin equipos · elegir",\n'
JS_NUEVO = JS + "".join(f'      {v}: e === "{n}",\n' for v, n, _, _ in CAMBIOS)
# La página de atrás es la de «Editar opción» (con los equipos), también en los dos estados nuevos.
JS_PAGINA = '      pag0: ' + " || ".join(f'e === "{n}"' for n in ["Editar opción"] + [n for _, n, _, _ in CAMBIOS]) + ",\n"
PAGINA = '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}"><div class="w-bnd">'
PAGINA_NUEVA = '<sc-if value="{{pag0}}" hint-placeholder-val="{{si}}"><div class="w-bnd">'


def confirmar_compu(v, a, quita):
    pregunta = f"¿Cambiar a «{a}»?"
    return (f'<sc-if value="{{{{{v}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="w-oscuro"><div class="w-dlg chico" '
            f'role="alertdialog" aria-modal="true" aria-label="{pregunta}"><div class="dc"><span>{pregunta}</span></div>'
            f'<div class="db una"><p class="d-tx">Se quita {quita}.</p></div><div class="df">'
            '<button type="button" class="cb cb-sec v169-foco">Cancelar</button>'
            '<button type="button" class="cb cb-pri">Cambiar</button></div></div></div></sc-if>')


def confirmar_tel(a, quita):
    pregunta = f"¿Cambiar a «{a}»?"
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="{pregunta}"><span class="asa"></span>'
            f'<div class="hc"><h2>{pregunta}</h2></div><div class="hb">'
            f'<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">Se quita {quita}.</p></div><div class="hp">'
            '<button type="button" class="cb cb-sec v169-foco">Cancelar</button>'
            '<button type="button" class="cb cb-pri">Cambiar</button></div></div>')


CSS_BOT = """/* 162 · Cambiar lo que hace una opción pregunta antes de quitar el texto o el equipo. Es una confirmación: la pregunta de
   título, sin ✕, y el foco en «Cancelar» (161). */
.w-dlg .d-tx { grid-column: 1 / -1; margin: 0; font-size: 14px; line-height: 1.5; color: var(--t2); }
:root .df .v169-foco { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--marca) !important; }
"""
CSS_BOT_TEL = """/* 162 · Cambiar lo que hace una opción pregunta antes de quitar el texto o el equipo, con el foco en «Cancelar» (161). */
:root .ap-hoja .hp .v169-foco { box-shadow: 0 0 0 3px oklch(0.48 0.115 140 / 0.25) !important; border-color: var(--marca) !important; }
"""


def con_estados(t):
    """Los dos estados en el Tweak y en `renderVals` (las líneas nuevas van después de la de «Sin equipos · elegir»)."""
    t = cambiar(t, TWEAK, TWEAK_NUEVO, 1)
    if JS_NUEVO not in t:
        t = cambiar(t, JS, JS_NUEVO, 1)
    return t


def bot_compu():
    nombre = "WA-Admin-Editar"
    t = con_estados(leer(nombre))
    if JS_PAGINA not in t:
        t = cambiar(t, JS_NUEVO, JS_NUEVO + JS_PAGINA, 1)
    t = cambiar(t, PAGINA, PAGINA_NUEVA, 1)
    t = sin_estados(t, [v for v, _, _, _ in CAMBIOS])
    # Los diálogos van al final, después del de «Sin equipos · elegir».
    _, fin = bloque_si(t, "e2", t.index('<sc-if value="{{e0}}" hint-placeholder-val="{{si}}"><div class="w-oscuro">'))
    nuevos = "".join(confirmar_compu(v, a, quita) for v, _, a, quita in CAMBIOS)
    t = t[:fin] + nuevos + t[fin:]
    assert t.count('class="w-dlg chico" role="alertdialog"') == 2
    escribir(nombre, con_css(t, CSS_BOT))


def bot_tel():
    nombre = "M-WA-Editar"
    t = sin_estados(con_estados(leer(nombre)), [v for v, _, _, _ in CAMBIOS])
    # Cada estado del teléfono dibuja la pantalla entera: la de atrás es la de «Editar opción», sin su hoja.
    ini, fin = bloque_si(t, "e0")
    abre = '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">'
    assert t[ini:ini + len(abre)] == abre
    pantalla = t[ini + len(abre):t.index('<div class="ap-velo"></div>', ini)]
    _, fin2 = bloque_si(t, "e2")
    nuevos = "".join(f'<sc-if value="{{{{{v}}}}}" hint-placeholder-val="{{{{no}}}}">' + pantalla + confirmar_tel(a, quita) + "</sc-if>"
                     for v, _, a, quita in CAMBIOS)
    t = t[:fin2] + nuevos + t[fin2:]
    assert t.count('<div class="ap-hoja" role="alertdialog"') == 2
    escribir(nombre, con_css(t, CSS_BOT_TEL))


# ================================================================================================ el permiso de la biblioteca (78)
PERMISO = "Administrar la biblioteca de formularios"
PERMISO_D = "Armar, publicar y retirar las plantillas de formularios y sus categorías."
FILAS_PERMISO = {
    "Cuenta-Plat": [
        (f'<div class="o-fila"><span class="dos"><span class="c1">{PERMISO}</span><span class="n2">{PERMISO_D}</span></span>'
         '<span class="o-perm no">—</span></div>', 2),
        (f'<label class="op2"><input type="checkbox"><span><span class="opn">{PERMISO}</span><span class="opd">{PERMISO_D}</span>'
         '</span></label>', 1),
    ],
    "M-Cuenta-Plat": [
        (f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">{PERMISO}</span><span class="ap-perm no">—</span>'
         f'</span><span class="l2">{PERMISO_D}</span></div></div>', 13),
    ],
}


def sin_permiso():
    for nombre, filas in FILAS_PERMISO.items():
        t = leer(nombre)
        for fila, veces in filas:
            k = t.count(fila)
            assert k in (0, veces), (nombre, k, veces)
            t = t.replace(fila, "")
        assert PERMISO not in t and PERMISO_D not in t, nombre
        escribir(nombre, t)


# ============================================================================================================= los catálogos
MAS_200 = "Con estos filtros hay 215 opciones, y WhatsApp muestra hasta 200."
I_COMPU = f'<span class="f-i" tabindex="0" role="img" aria-label="{MAS_200}" title="{MAS_200}">{INFO}</span>'
I_TEL = f'<button type="button" class="ap-i v169-i" aria-label="Qué significa" title="{MAS_200}">{INFO_TEL}</button>'
MAS = {  # cuántas quedan afuera de la vista previa (215 con las que se ven)
    "FRM-Catalogo-Filtros": ("k-mas", 212, I_COMPU),
    "FRM-Catalogo-Contactos": ("k-mas", 211, I_COMPU),
    "M-FRM-Catalogo-Filtros": ("ap-mas", 212, I_TEL),
    "M-FRM-Catalogo-Contactos": ("ap-mas", 211, I_TEL),
}
CSS_MAS_TEL = """/* 12 y 22 · «y N opciones más» con su ⓘ, que informa: va en gris, no en el ámbar de un motivo. */
:root .ap-mas .v169-i { color: var(--t3); }
"""
NOMBRE_CORTO = ("Florencia Fernández de la Fu…", "Florencia Fernández de la Fue…")  # el corte, en 29 caracteres
assert len(NOMBRE_CORTO[1].removesuffix("…")) == 29
PLANTILLA = ("</svg> Bajar la plantilla</a>", "</svg> Descargar la plantilla</a>")
# «Se borra al guardar»: ↑ ↓ apagados, con su motivo (el 🗑 apagado de «Movimientos pendientes» ya lleva el suyo).
MOTIVO_MOVER = "Guardá o descartá el borrado pendiente para mover opciones."
FLECHA_APAGADA = re.compile(r'(<button type="button" class="ib" aria-label="(?:Subir|Bajar) [^"]*" aria-disabled="true")>')
FLECHA_TEL = re.compile(r'(<button type="button" class="ap-ib" aria-label="(?:Subir|Bajar) [^"]*") aria-disabled="(?:true|false)">')
# El 🗑 de una opción guardada, en el teléfono: el botón con el tacho (un campo de «Elegir qué muestra» se quita, con su ✕).
TACHO_TEL = re.compile(r'(<button type="button" class="ap-ib" aria-label=")Quitar ([^"]*)("><svg[^>]*><path d="M4\.5 7h15"/>)')
TACHOS = {"M-FRM-Catalogo": 31, "M-FRM-Catalogo-13": 24, "M-FRM-Catalogo-14": 6}


def catalogos():
    for nombre, (clase, n, icono) in MAS.items():
        t = leer(nombre)
        texto = f'<div class="{clase}">y {n} opciones más'
        t = cambiar(t, texto + "</div>", texto + icono + "</div>", 1)
        if nombre in ("FRM-Catalogo-Filtros", "M-FRM-Catalogo-Filtros"):
            t = cambiar(t, *NOMBRE_CORTO, 6 if nombre == "FRM-Catalogo-Filtros" else 2)
        if clase == "ap-mas":
            t = con_css(t, CSS_MAS_TEL)
        escribir(nombre, t)

    t = leer("FRM-Catalogo-Importar")
    escribir("FRM-Catalogo-Importar", cambiar(t, *PLANTILLA, 19))

    t = leer("FRM-Catalogo")
    ini, fin = bloque_si(t, "s7", t.index('<sc-if value="{{s7}}" hint-placeholder-val="{{no}}"><div class="w-body">'))
    tabla = FLECHA_APAGADA.sub(lambda m: m.group(1) + f' title="{MOTIVO_MOVER}">', t[ini:fin])
    assert tabla.count(f'aria-disabled="true" title="{MOTIVO_MOVER}"') == 6
    escribir("FRM-Catalogo", t[:ini] + tabla + t[fin:])

    for nombre, veces in TACHOS.items():
        t = leer(nombre)
        t = TACHO_TEL.sub(lambda m: m.group(1) + "Borrar " + m.group(2) + m.group(3), t)
        hechos = len(re.findall(r'<button type="button" class="ap-ib" aria-label="Borrar [^"]*"><svg[^>]*><path d="M4\.5 7h15"/>', t))
        assert hechos == veces, (nombre, hechos, veces)
        if nombre == "M-FRM-Catalogo":  # «Se borra al guardar»: las flechas, apagadas con su motivo, como en la compu
            ini, fin = bloque_si(t, "s3")
            assert ">Se borra al guardar<" in t[ini:fin]
            pantalla = FLECHA_TEL.sub(lambda m: m.group(1) + f' aria-disabled="true" title="{MOTIVO_MOVER}">', t[ini:fin])
            assert pantalla.count(f'aria-disabled="true" title="{MOTIVO_MOVER}"') == 6
            t = t[:ini] + pantalla + t[fin:]
        escribir(nombre, t)


TOCADOS = (["WA-Admin-Editar", "M-WA-Editar"] + list(FILAS_PERMISO) + list(MAS) + ["FRM-Catalogo-Importar", "FRM-Catalogo"]
           + list(TACHOS))


if __name__ == "__main__":
    bot_compu()
    bot_tel()
    sin_permiso()
    catalogos()
    print("listo:", len(TOCADOS), "tableros")
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(TOCADOS))
