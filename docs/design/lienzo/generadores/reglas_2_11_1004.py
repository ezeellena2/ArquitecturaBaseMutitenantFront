"""Las reglas del 2026-11-02 que valen para todo el lienzo (decisiones 109, 110, 115, 116 y 122 de la hoja de ruta), en los tableros
«Criterio», que mandan sobre todos:
- sin leyendas: el renglón de abajo es solo para el error o para un dato, y la ayuda que sirve va en una (i) con tooltip;
- toda acción que tarda muestra que trabaja: el botón con el aro y su gerundio, con su color; la confirmación abierta hasta la respuesta,
  y la tabla que vuelve a leer, con las filas atenuadas y una línea que corre;
- lo apagado dice por qué, en su tooltip;
- en el teléfono, sin mouse, tocar la (i) abre una hoja chica, y tocar algo apagado muestra el motivo en la franja oscura de abajo.

Los tableros de las etapas que se redibujan lo aplican en su generador (la pieza es `trabaja` de `formularios_e12_sin_idioma_1004.py`);
los de las etapas cerradas cambian en la base de la 12: hasta entonces manda «Criterio · Botones». Corre antes de `criterio_decisiones.py`,
que toma el encabezado de `Criterio-Botones`. Se puede volver a correr: cada cambio se salta si ya está.
"""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
ARO = '<span class="girar2" aria-hidden="true"></span>'

BOTONES = [
    ('<button type="button" class="cb cb-pri" disabled="{si}">' + ARO + ' Guardar cambios</button></div><strong>Mientras trabaja</strong><p>Grisado, con el aro y su mismo texto, y no se puede volver a tocar. Nunca «Guardando…», «Invitando…» ni otro texto de espera.</p>',
     '<button type="button" class="cb cb-pri" aria-busy="true">' + ARO + ' Guardando…</button></div><strong>Mientras trabaja</strong><p>Con su color, el aro y lo que está haciendo, en su lugar y sin aceptar otro clic. Nunca alcanza con apagarlo.</p>'),
    ("sin textos al lado ni debajo. Si el motivo no es obvio, va en su tooltip.</li>",
     "sin textos al lado ni debajo. Si el motivo no es obvio, va en su tooltip; en el teléfono, tocarlo lo muestra en la franja oscura de abajo.</li>"),
    ("o un botón que cambia su texto mientras trabaja.", "o una acción que tarda sin mostrar que trabaja."),
]

FORMULARIOS = [
    ('<div class="g4c">\n', '<div class="g4c">\n'),  # sin cambios: el marcador de abajo suma la muestra
    ("<li><strong>Sin ayudas debajo</strong> ni textos de ejemplo adentro. Solo el buscador lleva texto adentro.</li>",
     "<li><strong>Sin leyendas debajo</strong> ni textos de ejemplo adentro: el renglón de abajo es solo para el error o para un dato. Solo el buscador lleva texto adentro.</li>"
     "<li><strong>La ayuda que sirve va en una (i)</strong> junto a la etiqueta, al título o al final de una opción, con tooltip. En el teléfono, tocarla abre una hoja chica. Lo que no ayuda a decidir no va, ni ahí.</li>"
     "<li><strong>Un select toma el ancho de su opción más larga:</strong> sin anchos fijos que corten el texto.</li>"),
]

TABLAS_SECCION = """  <section data-reglas="2-11">
    <h2>Cuando vuelve a leer</h2>
    <div class="g4">
      <div class="mini"><div class="th"><span>Usuario</span><span>Estado</span></div><div class="linea" aria-hidden="true"></div><div class="filas" aria-busy="true"><span>Sofía Herrera · Activo</span><span>Martín Paz · Activo</span><span>Laura Ríos · De baja</span></div><div class="rot2">Vuelve a leer · las filas atenuadas y una línea que corre</div></div>
    </div>
    <ul class="reglas2" style="margin-top: 14px;">
      <li><strong>Lo que estaba queda a la vista,</strong> atenuado y sin poder tocarse, hasta que llega lo nuevo. La primera carga conserva su esqueleto.</li>
    </ul>
  </section>

  <section>
    <h2>Prohibido</h2>"""
TABLAS_CSS = """<style data-r211="tablas">
.mini .linea { height: 2px; background: var(--marca); }
.mini .filas { display: flex; flex-direction: column; gap: 14px; min-height: 140px; padding: 16px; font-size: 14px; color: var(--t2); opacity: 0.5; }
</style>
</helmet>"""

DIALOGOS = [
    ('<button type="button" class="cb cb-pri" disabled="{{si}}" style="opacity: 0.85;">' + ARO + ' Enviando…</button>', '<button type="button" class="cb cb-pri" aria-busy="true">' + ARO + ' Enviando…</button>'),
    ('<p class="pie-rot">Mientras guarda · el botón dice qué hace</p>', '<p class="pie-rot">Mientras trabaja · queda abierto hasta la respuesta</p>'),
    ("<li><strong>Al terminar, se cierra</strong> y un aviso abajo a la derecha confirma lo que pasó.</li>",
     "<li><strong>Queda abierto hasta la respuesta.</strong> Al terminar, se cierra y un aviso abajo a la derecha confirma lo que pasó.</li>"
     "<li><strong>Si lo que corre no se puede cortar,</strong> Cancelar y la ✕ quedan apagados, con el motivo en su tooltip.</li>"),
    ("<li>Una tabla dentro de un diálogo.</li>", "<li>Una tabla dentro de un diálogo, salvo la revisión y la grilla de importar opciones.</li>"),
    ("<li>Scroll adentro: si no entra, es una pantalla.</li>", "<li>Scroll adentro: si no entra, es una pantalla. La excepción es importar opciones.</li>"),
    ("<li>Otros anchos que no sean 420 o 560.</li>", "<li>Otros anchos que no sean 420 o 560, salvo importar opciones (760) y las opciones de un catálogo (880).</li>"),
]

AVISOS = [
    ("<li><strong>Ningún párrafo que explique</strong> en la pantalla: lo que hay que saber va en ese aviso.</li>",
     "<li><strong>Ningún párrafo que explique</strong> en la pantalla: lo que no se puede hacer va en ese aviso, y la ayuda de un campo o una sección, en una (i) con tooltip, que no abre nada.</li>"
     "<li><strong>En el teléfono,</strong> tocar la (i) abre una hoja chica, y tocar algo apagado muestra el motivo en la franja oscura de abajo.</li>"),
    ("<li>Párrafos o líneas que explican en la pantalla: van detrás de un ⓘ.</li>", "<li>Párrafos o líneas que explican en la pantalla: la ayuda que sirve va en la (i).</li>"),
]


def aplicar(nombre, cambios):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    for viejo, nuevo in cambios:
        if viejo == nuevo or nuevo in t:
            continue
        assert t.count(viejo) == 1, (nombre, viejo[:80], t.count(viejo))
        t = t.replace(viejo, nuevo)
    return ruta, t


def muestra_ayuda(t):
    """La (i) junto a una etiqueta, con su tooltip a la vista, al lado de los estados de un campo."""
    if 'data-reglas="2-11"' in t:
        return t
    ic = ('<span class="i-ay" aria-label="Va adelante del número de cada respuesta."><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
          'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg></span>')
    pieza = (f'<div class="cmp" data-reglas="2-11"><span class="rot">Prefijo de numeración <span class="req">*</span>{ic}</span><div class="ctl">VIS</div>'
             '<span class="err3" style="color: var(--t3);">Con su ayuda: la (i) y su tooltip</span></div>\n')
    marca = '<div class="g4c">\n'
    assert t.count(marca) >= 1
    t = t.replace(marca, marca + "        " + pieza, 1)
    css = '<style data-r211="formularios">\n.i-ay { display: inline-flex; color: var(--t3); margin-left: -2px; }\n.g4c { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }\n</style>\n</helmet>'
    return t.replace("</helmet>", css, 1)


if __name__ == "__main__":
    for nombre, cambios in (("Criterio-Botones", BOTONES), ("Criterio-Dialogos", DIALOGOS), ("Criterio-Avisos", AVISOS)):
        ruta, t = aplicar(nombre, cambios)
        ruta.write_text(t, encoding="utf-8")
    ruta, t = aplicar("Criterio-Formularios", FORMULARIOS)
    ruta.write_text(muestra_ayuda(t), encoding="utf-8")
    ruta = PROJ / "Criterio-Tablas.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if 'data-reglas="2-11"' not in t:
        viejo = "  <section>\n    <h2>Prohibido</h2>"
        assert t.count(viejo) == 1
        t = t.replace(viejo, TABLAS_SECCION)
    if "data-r211" not in t:  # reglas_25_10_1004.py rehace los estilos de este tablero
        t = t.replace("</helmet>", TABLAS_CSS, 1)
    ruta.write_text(t, encoding="utf-8")
    print("listo")
