"""Las reglas del traspaso 15 (decisiones 205 a 213 de la hoja de ruta del back, del 2026-11-18) en los tableros «Criterio»,
que mandan sobre todos (lienzo v175):
- Tablas: un dato por columna (206), con lo que cuenta como un dato y sus dos excepciones, y las fechas y los números (205 y 208);
- Botones: qué va a la vista y qué en el ⋮ (209) y lo apagado, con su motivo sobre el control (211);
- Menús: el ⋮ de una banda (209), el motivo de una opción apagada en el teléfono (211) y el chip de solo lectura (213);
- Diálogos: lo que un diálogo va a hacer, en la grilla, y la confirmación en una frase (213); sin grupos plegables (212);
- Formularios: una cosa, una zona (213), la (i) que se abre con un toque (211) y el número ambiguo (207);
- Avisos: avisos según el tipo (210), con su duración y la franja del teléfono.

La lista de chequeo de diseño (213) vive en el `README.md` del lienzo; `Criterio-Decisiones` anota estas decisiones en su sección
«Traspaso 15 · 18/11» (`criterio_decisiones.py`). El filo de los avisos en todos los tableros lo pone `traspaso10_piezas_1004.py`
(`CSS_AVISOS`), y el octógono del error, `avisos_iconos_1004.py`.

Corre al final de todo, después de `traspaso15_textos_1004.py` y antes de la pasada de las piezas, que escala lo que esta suma (las
medidas de acá son nominales, como en los demás generadores). Se puede volver a correr: las secciones y los renglones de «Prohibido»
de una corrida anterior se rehacen, y un cambio de texto ya hecho se salta.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = "t15"


def leer(nombre):
    """Como `reglas_7_11_1004.py` y la pasada de las piezas: con los finales de línea del sistema, así las secciones se buscan con «\\n»."""
    return (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")


def escribir(nombre, t):
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


def cambiar(t, viejo, nuevo):
    """Cambia la única aparición de `viejo`; si ya está el texto nuevo, no hace nada."""
    if nuevo in t:
        return t
    k = t.count(viejo)
    assert k == 1, (viejo[:100], k)
    return t.replace(viejo, nuevo)


SECCIONES = re.compile(r'  <section data-reglas="t15[^"]*">.*?\n  </section>\n\n', re.S)


def antes_de_prohibido(t, secciones):
    """Pone las secciones antes de la última «Prohibido»; las de una corrida anterior se rehacen."""
    t = SECCIONES.sub("", t)
    i = t.rfind("  <section>\n    <h2>Prohibido</h2>")
    assert i >= 0
    return t[:i] + secciones + t[i:]


def prohibir(t, items):
    """Suma renglones al principio de la última lista «Prohibido»; los de una corrida anterior se rehacen."""
    t = re.sub(r"\n      <li data-t15>.*?</li>", "", t)
    i = t.rfind("<h2>Prohibido</h2>")
    j = t.index('<ul class="prohibido">', i) + len('<ul class="prohibido">')
    return t[:j] + "".join(f"\n      <li data-t15>{x}</li>" for x in items) + t[j:]


def quitar(t, renglones):
    """Saca renglones de «Prohibido» que la regla nueva deja sin efecto."""
    for x in renglones:
        t = t.replace(f"\n      <li>{x}</li>", "")
    return t


def css(t, bloque):
    t = re.sub(r'<style data-t15="reglas">.*?</style>\n', "", t, flags=re.S)
    return t.replace("</helmet>", f'<style data-t15="reglas">{bloque}</style>\n</helmet>', 1)


# ---------------------------------------------------------------------------------------------------------------- piezas
ICONO = {
    "ok": '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>',
    "info": '<circle cx="12" cy="12" r="8.5"/><path d="M12 16v-4.5"/><path d="M12 8.2h.01"/>',
    "aten": '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    "mal": ('<path d="M8.7 3h6.6L21 8.7v6.6L15.3 21H8.7L3 15.3V8.7z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/>'),
    "x": '<path d="M7 7l10 10"/><path d="M17 7 7 17"/>',
    "mas": '<circle cx="12" cy="5.5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18.5" r="1.7"/>',
    "full": '<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>',
    "chat": '<path d="M5 18.5 6.2 15A7.5 7.5 0 1 1 9 17.8z"/>',
    "pdf": '<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
    "arr": '<path d="m6 15 6-6 6 6"/>',
    "aba": '<path d="m6 9 6 6 6-6"/>',
    "lapiz": '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    "tacho": '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/>',
    "baja": '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',  # el de las pantallas (`FRM-Catalogo`, `FRM-Editor`)
}


def svg(nombre, tam=16, relleno=False):
    if relleno:
        return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
                f"{ICONO[nombre]}</svg>")
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONO[nombre]}</svg>')


CSS_COMUN = """
.t15-reglas { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; color: var(--t2); font-size: 14px; }
.t15-reglas strong { color: var(--t1); font-weight: 600; }
.t15-dos { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 28px; align-items: start; }
.t15-caso { display: flex; flex-direction: column; gap: 8px; }
.t15-rot { font-size: 12px; font-weight: 600; color: var(--t2); }
.t15-caja { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: visible; }
.t15-ib { width: 32px; height: 32px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; color: var(--t2); }
.t15-bt { height: 36px; box-sizing: border-box; display: inline-flex; align-items: center; padding: 0 14px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; color: var(--t1); font-size: 14px; font-weight: 500; white-space: nowrap; }
.t15-bt.pri { background: var(--marca); border-color: var(--marca); color: #fff; }
.t15-bt.off { color: var(--t3); background: var(--s2); border-color: var(--borde); }
.t15-menu { position: absolute; z-index: 3; min-width: 210px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); padding: 4px 0; font-size: 13px; }
.t15-menu .op { display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 0 14px; color: var(--t1); border-top: 1px solid var(--borde); }
.t15-menu .op:first-child { border-top: 0; }
.t15-menu .op svg { color: var(--t3); }
.t15-menu .op.pel { color: var(--peligro); border-top: 4px solid var(--s2); }
.t15-menu .op.pel svg { color: var(--peligro); }
.t15-tip { position: absolute; z-index: 4; max-width: 380px; white-space: nowrap; padding: 7px 10px; border-radius: 6px; background: oklch(0.27 0.012 60); color: #fff; font-size: 12px; line-height: 1.4; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); }
.t15-tip::after { content: ""; position: absolute; left: 18px; bottom: -5px; width: 10px; height: 10px; background: oklch(0.27 0.012 60); transform: rotate(45deg); }
.t15-dg { display: grid; grid-template-columns: 150px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 13px; background: #fff; }
.t15-dg > span { padding: 9px 12px; border-top: 1px solid var(--borde); line-height: 1.4; }
.t15-dg > span:nth-child(-n+2) { border-top: 0; }
.t15-dg > span:nth-child(odd) { background: oklch(0.975 0.012 95); color: var(--t2); }
.t15-chip { display: inline-flex; align-items: center; height: 26px; padding: 0 9px; margin: 0 6px 4px 0; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 12.5px; color: var(--t1); }
.t15-tel { width: 360px; background: var(--fondo); border: 1px solid var(--borde); border-radius: 22px; padding: 18px 14px; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; position: relative; }
"""

# ---------------------------------------------------------------------------------------------------------------- Tablas
TABLAS_CSS = CSS_COMUN + """
.t15-tb { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; font-size: 13px; }
.t15-tb .th, .t15-tb .tr { display: grid; }
.t15-tb .th { min-height: 40px; background: oklch(0.945 0.027 95); border-bottom: 1px solid oklch(0.89 0.031 95); font-weight: 600; color: var(--t2); }
.t15-tb .tr { min-height: 40px; border-bottom: 1px solid var(--borde); }
.t15-tb .tr:last-child { border-bottom: 0; }
.t15-tb .tr:nth-child(odd) { background: oklch(0.968 0.015 95); }
.t15-tb .th > span, .t15-tb .tr > span { display: flex; flex-direction: column; justify-content: center; padding: 9px 12px; line-height: 1.4; min-width: 0; overflow-wrap: break-word; }
.t15-tb .th > span + span, .t15-tb .tr > span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.013 95 / 0.8); }
.t15-tb .th > span + span { box-shadow: inset 1px 0 0 oklch(0.89 0.031 95); }
.t15-tb .n { align-items: flex-end; text-align: right; font-variant-numeric: tabular-nums; }
.t15-tb .sec { color: var(--t2); font-size: 12px; }
.t15-tb .tr > span.est { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 8px; }
.t15-tb .est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); flex: none; }
.t15-tb .est.pend::before { background: oklch(0.62 0.12 240); }
.t15-tb .vac { color: var(--t3); }
.t15-cols1 { grid-template-columns: 110px 140px 120px 95px 90px minmax(110px, 1fr); }
.t15-cols2 { grid-template-columns: minmax(0, 1fr) 90px 150px; }
.t15-mx .th, .t15-mx .tr { grid-template-columns: 44px 170px 70px 100px minmax(0, 1fr); }
.t15-mx .tr > span { flex-direction: row; justify-content: flex-start; align-items: center; gap: 8px; flex-wrap: wrap; }
.t15-cas { width: 16px; height: 16px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid var(--borde2); border-radius: 4px; background: #fff; color: #fff; flex: none; }
.t15-cas.si { background: var(--marca); border-color: var(--marca); }
.t15-cas.parte { background: var(--marca); border-color: var(--marca); }
.t15-cas.parte::after { content: ""; width: 8px; height: 2px; background: #fff; border-radius: 1px; }
.t15-otro { display: inline-flex; align-items: center; gap: 6px; margin-right: 10px; }
.t15-mx .ii { color: var(--t3); display: inline-flex; }
"""
TABLAS_SECCION = f"""  <section data-reglas="t15">
    <h2>Un dato por columna</h2>
    <div class="t15-dos">
      <div class="t15-caso">
        <div class="t15-tb">
          <div class="th t15-cols1"><span>N°</span><span>Recibida</span><span>Estado</span><span>Corregida</span><span>Artículos</span><span>Documentos</span></div>
          <div class="tr t15-cols1"><span>VIS-000126</span><span>15/10/2026, 16:20</span><span class="est">Aprobada</span><span>Sí</span><span>3 ítems</span><span>2 documentos</span></div>
          <div class="tr t15-cols1"><span>VIS-000125</span><span>14/10/2026, 09:30</span><span class="est pend">Por aprobar</span><span class="vac">—</span><span>1 ítem</span><span class="vac">—</span></div>
        </div>
        <span class="t15-rot">La planilla · «Corregida» en su columna; el bloque y los documentos, con su cantidad</span>
        <div class="t15-tb">
          <div class="th t15-cols2"><span>Tema</span><span class="n">Pedidos</span><span>Último pedido</span></div>
          <div class="tr t15-cols2"><span>Reclamos de clientes<span class="sec">Dejar asentado el reclamo de un cliente: qué pasó y qué pide.</span></span><span class="n">5</span><span>15/10/2026, 10:42</span></div>
          <div class="tr t15-cols2"><span>Pedidos de materiales<span class="sec">Pedir materiales para una obra, con cantidades.</span></span><span class="n">3</span><span>14/10/2026, 17:05</span></div>
        </div>
        <span class="t15-rot">Formularios que faltan · la descripción, en gris debajo del tema</span>
      </div>
      <ul class="t15-reglas">
        <li><strong>Cada columna muestra un dato,</strong> y su encabezado lo nombra (206). Cuentan como uno la fecha y la hora de un momento, un valor con su unidad y varios valores del mismo dato.</li>
        <li><strong>No van juntos</strong> un número con su fecha o su estado, «fecha · persona», una etiqueta al lado del dato («Corregida» va en su columna, con «Sí» o «—», y solo si alguna fila lo está) ni el resumen de otra tabla: el bloque dice «3 ítems», y los documentos, «2 documentos».</li>
        <li><strong>Dos excepciones.</strong> Un texto secundario en gris debajo del dato, que no se ordena ni se filtra y nunca es un estado, una fecha ni una persona, como la descripción de un tema. Y las listas que no son tablas (el chat, las opciones de un diálogo, la actividad) siguen las lecturas.</li>
        <li><strong>Las filas con acciones a la vista</strong> llevan dos líneas, el nombre y su detalle (130).</li>
      </ul>
    </div>
  </section>

  <section data-reglas="t15-formatos">
    <h2>Fechas y números</h2>
    <ul class="t15-reglas">
      <li><strong>Una fecha, solo con números</strong> y completa (205): «27/09/2026»; con hora, después de una coma, «27/09/2026, 14:35» (en inglés, «09/27/2026, 2:35 PM»). Nunca el mes en letras ni una fecha larga.</li>
      <li><strong>Un mes se escribe como su rango:</strong> «01/10/2026 – 31/10/2026»; dentro de una frase, «del 01/10/2026 al 31/10/2026».</li>
      <li><strong>Un número, con la región de su idioma:</strong> «1.234,5» en español y «1,234.5» en inglés. El porcentaje va pegado: «64%», «12,5%» (208).</li>
      <li>Vale también para los correos, WhatsApp, el PDF y el Excel. Ver <code>formatos.md</code> del front.</li>
    </ul>
  </section>

"""
TABLAS_CAMBIOS = [
    ("<li><strong>Un dato por celda.</strong> Lo que lo aclara va en su propia columna si la persona lo necesita (Correo, Vencimiento), o no va. Sin dato, una sola raya. Un texto largo baja de renglón, sin «…» (174).</li>",
     "<li><strong>Un dato por columna</strong> (206). Lo que lo aclara va en su propia columna si la persona lo necesita (Correo, Vencimiento), o no va; solo un texto secundario va en gris debajo. Sin dato, una sola raya. Un texto largo baja de renglón, sin «…» (174).</li>"),
    ("<span>Un dato por celda, con letra de 11;", "<span>Un dato por columna, con letra de 11;"),
    ("<li><strong>Un dato por celda</strong> sigue valiendo: lo que baja de renglón es el mismo dato.</li>",
     "<li><strong>Un dato por columna</strong> sigue valiendo: lo que baja de renglón es el mismo dato.</li>"),
]
def casilla(estado=""):
    tilde = svg("ok", 11).replace(ICONO["ok"], '<path d="m5 12.5 4.5 4.5L19 7.5"/>') if estado == "si" else ""
    return f'<span class="t15-cas {estado}">{tilde}</span>'


def otro(nombre, estado=""):
    return f'<span class="t15-otro">{casilla(estado)}{nombre}</span>'


I_AREA = svg("info", 14)
TABLAS_ROLES = f"""  <section data-t15-roles>
    <h2>Los permisos de un rol, en una matriz</h2>
    <div class="t15-dos">
      <div class="t15-caso">
        <div class="t15-tb t15-mx">
          <div class="th"><span></span><span>Área</span><span>Ver</span><span>Administrar</span><span>Otros permisos</span></div>
          <div class="tr"><span>{casilla("parte")}</span><span>Usuarios <span class="ii">{I_AREA}</span></span><span>{casilla("si")}</span><span>{casilla()}</span><span>{otro("Invitar usuarios", "si")}</span></div>
          <div class="tr"><span>{casilla("si")}</span><span>Roles <span class="ii">{I_AREA}</span></span><span>{casilla("si")}</span><span>{casilla("si")}</span><span>{otro("Asignar roles", "si")}</span></div>
          <div class="tr"><span>{casilla()}</span><span>Empresas <span class="ii">{I_AREA}</span></span><span>{casilla()}</span><span>{casilla()}</span><span class="vac">—</span></div>
          <div class="tr"><span>{casilla()}</span><span>WhatsApp <span class="ii">{I_AREA}</span></span><span class="vac">—</span><span>{casilla()}</span><span>{otro("Responder chats")}{otro("Difusiones")}</span></div>
        </div>
        <span class="t15-rot">Editar el rol Soporte · una fila por área; la casilla del principio marca la fila entera</span>
      </div>
      <ul class="t15-reglas">
        <li><strong>Una fila por área</strong> (212), con Ver, Administrar y «Otros permisos», cada uno con su nombre. Donde el área no tiene ese permiso va «—»; sin otros permisos, esa columna no aparece.</li>
        <li><strong>La casilla del principio</strong> marca o quita el área entera, y queda vacía, parcial o completa. Un área de un solo permiso no la lleva.</li>
        <li><strong>Qué permite cada permiso</strong> va en la (i) del área, un permiso por renglón. Sin buscador, «Todos · Elegidos», «Expandir todo» ni áreas que se pliegan.</li>
        <li><strong>Un rol de sistema que no se cambia</strong> se lee con tildes, sin casillas. Igual en los roles de la organización, en los de una empresa y en los permisos de un operador de Plataforma.</li>
        <li><strong>En el teléfono,</strong> una banda por área, con la casilla del área a la derecha y sus permisos debajo, con el nombre entero.</li>
      </ul>
    </div>
  </section>
"""
GRUPOS = re.compile(r"  <section>\n    <h2>Lista con grupos que se abren</h2>.*?\n  </section>\n", re.S)


def roles(t):
    """La matriz (212) en lugar de la lista con grupos que se abren; si ya está, se rehace."""
    t = re.sub(r"  <section data-t15-roles>.*?\n  </section>\n", lambda m: "@@ROLES@@", t, count=1, flags=re.S)
    if "@@ROLES@@" not in t:
        t, n = GRUPOS.subn(lambda m: "@@ROLES@@", t)
        assert n == 1, "no encuentro la lista con grupos"
    return t.replace("@@ROLES@@", TABLAS_ROLES)


TABLAS_PROHIBIDO = ["Una lista de permisos que se abre y se cierra: los permisos de un rol son una matriz (212).",
                    "Una etiqueta al lado del dato, «fecha · persona» o el resumen de otra tabla en una celda: cada dato en su columna (206).",
                    "Una fecha con el mes en letras o sin la coma antes de la hora; un porcentaje con espacio (205 y 208)."]

# ---------------------------------------------------------------------------------------------------------------- Botones
BOTONES_CSS = CSS_COMUN + """
.t15-enc { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; padding: 0 14px 0 18px; }
.t15-enc .tit { display: flex; flex-direction: column; }
.t15-enc .tit b { font-size: 16px; }
.t15-enc .tit span { font-size: 12.5px; color: var(--t2); display: flex; align-items: center; gap: 6px; }
.t15-enc .tit span::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }
.t15-enc .ac { display: flex; align-items: center; gap: 6px; }
.t15-enc .ac .sep { width: 1px; height: 22px; background: var(--borde); margin: 0 4px; }
.t15-enc .ab { position: relative; }
.t15-enc .t15-menu { top: 40px; right: 0; }
.t15-apag { position: relative; display: flex; flex-direction: column; gap: 14px; padding: 50px 18px 16px; }
.t15-casilla { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--t3); }
.t15-casilla i { width: 16px; height: 16px; box-sizing: border-box; border: 1.5px solid var(--borde2); border-radius: 4px; background: var(--s2); }
"""
BOTONES_SECCION = f"""  <section data-reglas="t15">
    <h2>Qué va a la vista y qué en el ⋮</h2>
    <div class="t15-dos">
      <div class="t15-caso">
        <div class="t15-caja" style="height: 160px;">
          <div class="t15-enc"><div class="tit"><b>VIS-000126</b><span>Recibida</span></div>
            <div class="ac"><span class="t15-ib" title="Pantalla completa">{svg("full")}</span><span class="t15-ib" title="Abrir conversación">{svg("chat")}</span><span class="t15-ib" title="Descargar el PDF">{svg("pdf")}</span>
              <span class="ab"><span class="t15-ib" style="border-color: var(--marca);">{svg("mas", relleno=True)}</span>
                <span class="t15-menu"><span class="op">{svg("lapiz")}Corregir</span><span class="op pel">{svg("tacho")}Anular</span></span></span>
              <span class="sep"></span><span class="t15-ib">{svg("arr")}</span><span class="t15-ib">{svg("aba")}</span><span class="t15-ib">{svg("x")}</span></div></div>
        </div>
        <span class="t15-rot">La vista rápida de una respuesta · ir y bajar a la vista; corregir y anular, en el ⋮</span>
        <div class="t15-caja" style="height: 110px;">
          <div class="t15-enc"><div class="tit"><b>Proveedores</b><span>Activo</span></div>
            <div class="ac"><span class="t15-bt">Descartar</span><span class="t15-bt pri">Guardar cambios</span>
              <span class="ab"><span class="t15-ib" style="border-color: var(--marca);">{svg("mas", relleno=True)}</span>
                <span class="t15-menu" style="min-width: 190px;"><span class="op">{svg("baja")}Dar de baja</span></span></span></div></div>
        </div>
        <span class="t15-rot">El editor de un catálogo · la tarea a la vista; dar de baja, en el ⋮</span>
      </div>
      <ul class="t15-reglas">
        <li><strong>A la vista, con texto, la tarea de la pantalla</strong> (209): guardar, publicar, crear, exportar, o aprobar y rechazar lo que espera una decisión. La principal, al final.</li>
        <li><strong>Ir a otro lado o bajar algo</strong> (pantalla completa, la conversación, el PDF): íconos con su nombre en un panel, texto en la banda de una pantalla.</li>
        <li><strong>En el ⋮, lo demás que se hace con el objeto:</strong> corregir, anular, dar de baja, reactivar, eliminar, descargar la plantilla, ordenar. Lo destructivo al final, en rojo y después de una línea.</li>
        <li><strong>El orden:</strong> la tarea, ir y bajar, el ⋮ y al final ↑ ↓ ×. Hasta tres a la vista. Las filas de una tabla y el pie de un diálogo siguen como están.</li>
        <li>Lo que espera una decisión es la tarea: «Aprobar» y «Rechazar» van a la vista, primeros, y «Quitar de la organización» a la vista cuando la persona pidió borrar su cuenta.</li>
      </ul>
    </div>
  </section>

  <section data-reglas="t15-apagado">
    <h2>Lo apagado, con su motivo sobre el control</h2>
    <div class="t15-dos">
      <div class="t15-caso">
        <div class="t15-caja t15-apag">
          <span class="t15-tip" style="top: 8px; left: 18px;">Una pregunta con condiciones no se carga varias veces.</span>
          <span class="t15-casilla"><i></i>Permitir elegir varias</span>
        </div>
        <span class="t15-rot">Una casilla · responde entera, el cuadradito y su texto</span>
        <div class="t15-caja t15-apag" style="align-items: flex-start;">
          <span class="t15-tip" style="top: 8px; left: 18px;">Guardá los cambios antes de publicar.</span>
          <span class="t15-bt off">Publicar en WhatsApp</span>
        </div>
        <span class="t15-rot">Un botón · con el mouse, el foco, un clic o un toque; igual en el teléfono</span>
      </div>
      <ul class="t15-reglas">
        <li><strong>El motivo va en un tooltip arriba del control apagado</strong> (211), solo si no es obvio: «Guardar» sin cambios no lleva motivo. Al lado o debajo no va nada: ni texto, ni ícono, ni candado.</li>
        <li><strong>Se abre al pasar el mouse, con el foco, con un clic o con un toque.</strong> El clic, el toque, Enter o Espacio muestran el motivo y no hacen la acción; lo cierran Escape, salir, perder el foco o tocar afuera.</li>
        <li><strong>Responde el control entero:</strong> la casilla con su texto, el renglón de una opción, la opción de un menú.</li>
        <li><strong>No cambia de lugar ni de forma</strong> al apagarse o encenderse; una espera de segundos es solo su motivo.</li>
        <li><strong>En el teléfono, igual:</strong> tocar algo apagado o una (i) abre su texto sobre el control, hasta tocar afuera. Ya no van en la franja oscura ni en una hoja.</li>
        <li>Se alcanza con Tab, y el lector dice su nombre, «no disponible» y el motivo.</li>
      </ul>
    </div>
  </section>

"""
BOTONES_CAMBIOS = [
    ("<li><strong>Un botón está habilitado o grisado,</strong> sin textos al lado ni debajo. Si el motivo no es obvio, va en su tooltip; en el teléfono, tocarlo lo muestra en la franja oscura de abajo.</li>",
     "<li><strong>Un botón está habilitado o grisado,</strong> sin textos al lado ni debajo. Si el motivo no es obvio, va en un tooltip sobre el control, que se abre también con un clic o un toque, igual en el teléfono (211).</li>"),
    ("<li><strong>Lo que salió bien,</strong> en el aviso verde de abajo. <strong>Los errores,</strong> con sus estilos de siempre: debajo del campo o en el aviso rojo. Nunca va en rojo una fila recién agregada.</li>",
     "<li><strong>Lo que salió bien y lo que falló,</strong> en el aviso de abajo, con el filo de su tipo (210); <strong>el error de un dato,</strong> debajo de su campo. Nunca va en rojo una fila recién agregada.</li>"),
]
BOTONES_PROHIBIDO = ["Un ícono, un candado o un texto al lado de lo apagado: el motivo va en un tooltip sobre el control (211).",
                     "Corregir, anular, dar de baja, reactivar o eliminar a la vista en una banda: van en el ⋮, salvo lo que espera una decisión (209)."]

# ---------------------------------------------------------------------------------------------------------------- Menús
MENUS_SECCION = """  <section data-reglas="t15">
    <h2>El ⋮ de una banda o de un encabezado</h2>
    <ul class="t15-reglas">
      <li><strong>Lleva lo que se hace con el objeto y no es la tarea de la pantalla</strong> (209): corregir, anular, dar de baja, reactivar, eliminar, descargar la plantilla, ordenar. La tarea va a la vista («Criterio · Botones»).</li>
      <li><strong>Lo destructivo, al final,</strong> en rojo y después de una franja, como en el ⋮ de una fila. Una opción apagada dice su motivo en su tooltip, que en el teléfono se abre al tocarla (211).</li>
      <li><strong>Va después de la tarea y de ir y bajar,</strong> y antes de ↑ ↓ ×.</li>
      <li><strong>Un chip de solo lectura,</strong> como los filtros que repite un diálogo, va sin × (213).</li>
      <li><strong>En el teléfono,</strong> un desplegable mide 48, nunca menos de 44, y las teclas que mueven la pantalla mueven el contenido aunque el foco esté en el menú.</li>
    </ul>
  </section>

"""
MENUS_CAMBIOS = [
    ("<li><strong>Lo aplicado va en chips,</strong> cada uno con su ×, y «Limpiar todo». Sin «18 respuestas»: el total va al pie.</li>",
     "<li><strong>Lo aplicado va en chips,</strong> cada uno con su ×, y «Limpiar todo». Sin «18 respuestas»: el total va al pie. Un chip de solo lectura va sin × (213).</li>"),
]
MENUS_PROHIBIDO = ["Una acción que no es la tarea a la vista en la banda: va en el ⋮ (209)."]

# ---------------------------------------------------------------------------------------------------------------- Diálogos
DIALOGOS_CSS = CSS_COMUN + """
.t15-dlg { width: 560px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.t15-dlg .cab { padding: 14px 20px; background: oklch(0.945 0.027 95); border-bottom: 1px solid oklch(0.89 0.031 95); font-weight: 600; font-size: 15px; }
.t15-dlg .cue { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; font-size: 13.5px; }
.t15-dlg .pie { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--borde); }
.t15-dlg.chico { width: 420px; }
.t15-dlg .t15-bt.pel { background: var(--peligro); border-color: var(--peligro); color: #fff; }
"""
DIALOGOS_SECCION = """  <section data-reglas="t15">
    <h2>Lo que va a hacer, en la grilla; la confirmación, en una frase</h2>
    <div class="t15-dos">
      <div class="t15-caso">
        <div class="t15-dlg">
          <div class="cab">Exportar respuestas a Excel</div>
          <div class="cue"><div class="t15-dg"><span>Respuestas</span><span>12</span><span>Filtros</span><span><span class="t15-chip">Empresa: Delta Sur</span><span class="t15-chip">Estado: Aprobada</span></span><span>Archivo</span><span>visita-a-cliente-2026-10-15.xlsx</span></div></div>
          <div class="pie"><span class="t15-bt">Cancelar</span><span class="t15-bt pri">Exportar a Excel</span></div>
        </div>
        <span class="t15-rot">Lo que va a hacer · cuántas, con qué filtros y a qué archivo, en la grilla; los filtros, con sus chips sin ×</span>
        <div class="t15-dlg chico">
          <div class="cab">¿Quitar a Sofía Herrera de Grupo Delta?</div>
          <div class="cue">Deja de ver la organización y sus empresas.</div>
          <div class="pie"><span class="t15-bt">Cancelar</span><span class="t15-bt pel">Quitar de la organización</span></div>
        </div>
        <span class="t15-rot">Una confirmación · una frase con lo que se afecta, sin instrucciones</span>
      </div>
      <ul class="t15-reglas">
        <li><strong>Lo que un diálogo dice que va a hacer</strong> (cuántas, con qué filtros, a quién, a qué archivo) va en la grilla de lectura, como los datos de un registro (213). Nunca en párrafos sueltos, viñetas ni «Rótulo: valor» corrido.</li>
        <li><strong>Una confirmación dice en una frase lo que se afecta,</strong> sin instrucciones ni «¿Estás seguro?». El título es la pregunta, con el nombre de lo que se toca.</li>
        <li><strong>Una sola forma de diálogo,</strong> la pieza común, en todas las pantallas.</li>
        <li><strong>Antes de mostrarlo y antes de programarlo,</strong> el diálogo entero pasa la lista de chequeo de diseño (README del lienzo). Sumarle algo lo redibuja entero.</li>
      </ul>
    </div>
  </section>

"""
DIALOGOS_CAMBIOS = [
    ("<li><strong>El texto dice qué se pierde</strong> y si se puede volver atrás. Nada de «¿Estás seguro?».</li>",
     "<li><strong>El texto dice en una frase lo que se afecta,</strong> sin instrucciones: qué se pierde y si se puede volver atrás. Nada de «¿Estás seguro?» (213).</li>"),
    ("<li>Paneles que se despliegan o filas que se expanden en vez de un diálogo. La única excepción son los grupos de permisos de un rol.</li>",
     "<li>Paneles que se despliegan o filas que se expanden en vez de un diálogo. Los permisos de un rol son una matriz, sin plegar (212).</li>"),
]
DIALOGOS_PROHIBIDO = ["Párrafos o viñetas con lo que va a hacer un diálogo: va en la grilla de lectura (213).",
                      "Instrucciones en una confirmación: una frase con lo que se afecta (213)."]

# ---------------------------------------------------------------------------------------------------------------- Formularios
FORM_CSS = CSS_COMUN + """
.t15-zona { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.t15-zona .cab { display: flex; align-items: center; justify-content: space-between; min-height: 40px; padding: 0 4px 0 16px; background: oklch(0.945 0.027 95); border-bottom: 1px solid oklch(0.89 0.031 95); font-weight: 600; font-size: 13.5px; }
.t15-zona .ren { display: flex; flex-direction: column; gap: 6px; padding: 12px 16px; border-top: 1px solid var(--borde); font-size: 13px; }
.t15-zona .ren:first-of-type { border-top: 0; }
.t15-zona .rot { color: var(--t2); font-size: 12.5px; }
.t15-zona .lin { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.t15-campo { height: 36px; box-sizing: border-box; display: inline-flex; align-items: center; padding: 0 12px; min-width: 260px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; color: var(--t1); }
.t15-campo.mal { border-color: var(--peligro); }
.t15-err { color: oklch(0.45 0.17 25); font-size: 12.5px; }
.t15-zona .t15-bt.pel { color: var(--peligro); }
.t15-zona .est { display: inline-flex; align-items: center; gap: 6px; }
.t15-zona .est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }
"""
FORM_SECCION = """  <section data-reglas="t15">
    <h2>Una cosa, una zona</h2>
    <div class="t15-dos">
      <div class="t15-caso">
        <div class="t15-zona">
          <div class="cab">Conexión con el proveedor<span class="t15-bt" style="height: 32px; font-size: 13px;">Probar conexión</span></div>
          <div class="ren"><span class="rot">Proveedor</span><span class="t15-campo">Anthropic</span></div>
          <div class="ren"><span class="rot">Clave de API</span><span class="lin"><span class="est">Configurada</span><span class="t15-bt" style="height: 32px; font-size: 13px;">Reemplazar clave</span><span class="t15-bt pel" style="height: 32px; font-size: 13px;">Quitar clave</span></span></div>
          <div class="ren"><span class="rot">Modelo</span><span class="lin"><span class="t15-campo">Claude Sonnet</span><span class="t15-bt" style="height: 32px; font-size: 13px;">Actualizar modelos</span></span></div>
          <div class="ren"><span class="rot">Disponibilidad</span><span class="lin">◉ Disponible &nbsp; ○ Pausada</span></div>
        </div>
        <span class="t15-rot">Una conexión · una zona, los campos en el orden en que se completan y cada botón al lado de su dato</span>
      </div>
      <ul class="t15-reglas">
        <li><strong>Lo que se configura y se guarda junto va en una zona</strong> (213), como una conexión o un registro: los campos en el orden en que se completan, cada botón al lado del dato que toca, y lo que actúa sobre todo, en su encabezado.</li>
        <li><strong>Se parte en zonas solo si son cosas distintas o pasos,</strong> como las de un formulario o el alta de ARCA (152); nunca por tipo de control.</li>
        <li><strong>El título de un grupo de opciones lleva su (i),</strong> como un campo.</li>
        <li><strong>La (i) se abre también con un clic o un toque,</strong> igual en la compu y en el teléfono, y respeta los saltos de renglón (211).</li>
      </ul>
    </div>
  </section>

  <section data-reglas="t15-numero">
    <h2>Un número que se puede leer de dos maneras</h2>
    <div class="t15-dos">
      <div class="t15-caso">
        <div class="t15-zona"><div class="ren"><span class="rot">Peso (kg)</span><span class="t15-campo mal">1.500</span><span class="t15-err">Se puede leer de dos maneras: escribilo sin separador de miles, como 1500 o 1500,5.</span></div></div>
        <span class="t15-rot">El error, debajo del campo, al intentar guardar</span>
      </div>
      <ul class="t15-reglas">
        <li><strong>Un número se lee con la región del idioma de quien carga</strong> (207): en español, coma decimal y punto de miles.</li>
        <li><strong>Lo que se lee distinto con y sin los miles,</strong> como «1.500» en español, es un error del campo, que pide escribirlo sin separador de miles. Igual por WhatsApp, donde la ayuda pide coma en español.</li>
      </ul>
    </div>
  </section>

"""
FORM_CAMBIOS = [
    ("junto a la etiqueta, al título o al final de una opción, con tooltip. En el teléfono, tocarla abre una hoja chica. Lo que no ayuda a decidir no va, ni ahí.</li>",
     "junto a la etiqueta, al título o al final de una opción, con tooltip, que se abre también con un clic o un toque, igual en el teléfono (211). Lo que no ayuda a decidir no va, ni ahí.</li>"),
]
FORM_PROHIBIDO = ["Partir en zonas lo que se guarda junto, o partir una zona por tipo de control (213)."]

# ---------------------------------------------------------------------------------------------------------------- Avisos
AVISOS_CSS = CSS_COMUN + """
.t15-avisos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.t15-aviso { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 10px 12px 10px 14px; box-sizing: border-box; background: #fff; border: 1px solid var(--borde2); border-left: 3px solid var(--t15-c); border-radius: 10px; font-size: 13px; color: var(--t1); }
.t15-aviso > svg { color: var(--t15-c); flex: none; }
.t15-aviso .tx { flex: 1; line-height: 1.4; }
.t15-aviso .ac { font-weight: 600; color: var(--marca-tx); white-space: nowrap; }
.t15-aviso .x { color: var(--t3); display: inline-flex; }
.t15-aviso.ok { --t15-c: oklch(0.55 0.13 155); }
.t15-aviso.info { --t15-c: var(--t2); }
.t15-aviso.aten { --t15-c: var(--alerta); }
.t15-aviso.mal { --t15-c: var(--peligro); }
.t15-franja { display: flex; align-items: center; gap: 10px; padding: 13px 14px 13px 14px; border-radius: 14px; background: oklch(0.27 0.012 60); border-left: 3px solid var(--t15-c); color: #fff; font-size: 14.5px; line-height: 1.4; }
.t15-franja > svg { color: var(--t15-c); flex: none; }
.t15-franja .ac { font-weight: 600; color: oklch(0.84 0.12 130); white-space: nowrap; }
.t15-franja.ok { --t15-c: oklch(0.78 0.14 155); }
.t15-franja.mal { --t15-c: oklch(0.75 0.15 25); }
"""


def aviso(tipo, texto, accion=None, cruz=True):
    ac = f'<span class="ac">{accion}</span>' if accion else ""
    x = f'<span class="x">{svg("x")}</span>' if cruz else ""
    return f'<div class="t15-aviso {tipo}">{svg(tipo, 18)}<span class="tx">{texto}</span>{ac}{x}</div>'


AVISOS_SECCION = f"""  <section data-reglas="t15">
    <h2>Avisos según el tipo</h2>
    <div class="t15-avisos">
      <div class="t15-caso">{aviso("ok", "Guardamos los cambios.")}<span class="t15-rot">Salió bien · filo y tilde verdes · se va solo</span></div>
      <div class="t15-caso">{aviso("info", "Te mandamos tus datos por correo cuando estén listos.")}<span class="t15-rot">Información · filo e (i) grises</span></div>
      <div class="t15-caso">{aviso("aten", "Todavía no sabemos si WhatsApp recibió la versión 4.")}<span class="t15-rot">Atención · filo y triángulo ámbar</span></div>
      <div class="t15-caso">{aviso("mal", "Algo salió mal. Probá de nuevo en un rato.", "Copiar código")}<span class="t15-rot">Error · filo y octógono rojos · con una acción, queda</span></div>
    </div>
    <div class="t15-dos" style="margin-top: 18px;">
      <div class="t15-caso" style="flex-direction: row; gap: 16px;">
        <div class="t15-tel" style="width: 340px;"><div class="t15-franja ok">{svg("ok", 22)}<span class="tx">Guardamos la configuración.</span></div><div class="t15-franja mal">{svg("mal", 22)}<span class="tx">No pudimos guardar los cambios.</span><span class="ac">Reintentar</span></div></div>
      </div>
      <ul class="t15-reglas">
        <li><strong>El fondo nunca dice el tipo</strong> (210): todo aviso es blanco, con la tinta de siempre, y el tipo va en un filo de 3 px a la izquierda y en el ícono, del mismo color. La ✕ va adentro, a la derecha.</li>
        <li><strong>Igual el aviso de abajo, la franja de error de un formulario y el cartel que bloquea</strong> una pantalla. En el teléfono, la franja oscura de siempre, con el mismo filo y el mismo ícono.</li>
        <li><strong>Todo aviso pasajero se va solo:</strong> el que salió bien, a los 4 segundos; el de error, a los 10. El que trae una acción, sea del tipo que sea, como «Copiar código» o «Reintentar», queda hasta cerrarlo.</li>
        <li>Es una regla para toda la app: un aviso nuevo usa una de estas cuatro formas, nunca una propia.</li>
      </ul>
    </div>
  </section>

"""
AVISOS_CAMBIOS = [
    ("<span>Aviso abajo a la derecha, con tilde verde</span>", "<span>Aviso abajo a la derecha, blanco, con el filo y la tilde verdes</span>"),
    ("<span>Aviso abajo a la derecha, rojo, con ✕</span><span>No se va solo: lo cerrás vos</span>",
     "<span>Aviso abajo a la derecha, blanco, con el filo y el ícono rojos y ✕</span><span>Se va a los 10 segundos; si trae una acción, queda hasta que lo cerrás</span>"),
    ("<span>Cartel arriba del contenido: el único cartel en el cuerpo</span>",
     "<span>Cartel blanco con el filo de su tipo, arriba del contenido: el único cartel en el cuerpo</span>"),
    ("<p>Tilde verde. Se va solo. No lleva botones.</p>", "<p>Filo y tilde verdes. Se va solo. No lleva botones.</p>"),
    ("<p>Ícono rojo y ✕. Queda hasta que lo cerrás.</p>", "<p>Filo y ícono rojos, y la ✕ adentro. Se va a los 10 segundos; con una acción, queda.</p>"),
    ("<p>Solo si la pantalla entera no se puede usar.</p>", "<p>Solo si la pantalla entera no se puede usar. Blanco, con el filo de su tipo.</p>"),
    ("lo pasajero, en la franja oscura de abajo.</li>", "lo pasajero, en la franja oscura de abajo, con el filo de su tipo.</li>"),
    ("<li><strong>En el teléfono,</strong> tocar la (i) abre una hoja chica, y tocar algo apagado muestra el motivo en la franja oscura de abajo.</li>",
     "<li><strong>En el teléfono,</strong> igual que en la compu: tocar la (i) o algo apagado abre su texto sobre el control, hasta tocar afuera (211).</li>"),
]
AVISOS_QUITAR = ["Un error en un aviso que se va solo."]
AVISOS_PROHIBIDO = ["Un fondo de color que dice el tipo de un aviso: va en el filo y en el ícono (210).",
                    "Un aviso de error sin una acción que no se va: se va a los 10 segundos (210)."]


TABLEROS = {
    "Criterio-Tablas": (TABLAS_CAMBIOS, TABLAS_SECCION, TABLAS_PROHIBIDO, (), TABLAS_CSS),
    "Criterio-Botones": (BOTONES_CAMBIOS, BOTONES_SECCION, BOTONES_PROHIBIDO, (), BOTONES_CSS),
    "Criterio-Menus": (MENUS_CAMBIOS, MENUS_SECCION, MENUS_PROHIBIDO, (), CSS_COMUN),
    "Criterio-Dialogos": (DIALOGOS_CAMBIOS, DIALOGOS_SECCION, DIALOGOS_PROHIBIDO, (), DIALOGOS_CSS),
    "Criterio-Formularios": (FORM_CAMBIOS, FORM_SECCION, FORM_PROHIBIDO, (), FORM_CSS),
    "Criterio-Avisos": (AVISOS_CAMBIOS, AVISOS_SECCION, AVISOS_PROHIBIDO, AVISOS_QUITAR, AVISOS_CSS),
}

# El alto de cada tablero con lo que suma esta pasada (medido el 18/11 con la escala de la 180): el lienzo muestra solo ese alto.
ALTOS = {"Criterio-Tablas": 4420, "Criterio-Botones": 2610, "Criterio-Menus": 3390, "Criterio-Dialogos": 2910,
         "Criterio-Formularios": 4320, "Criterio-Avisos": 3020}


def altos():
    if not ALTOS:
        return
    ruta = PROJ / "canvas.json"
    canvas = json.loads(ruta.read_text(encoding="utf-8"))
    for nombre, h in ALTOS.items():
        t = leer(nombre)
        t = re.sub(r'("\$preview":\{"width":1440,"height":)\d+', lambda m: m.group(1) + str(h), t)
        t = re.sub(r"(\.crit \{[^}]*min-height: )\d+(?:\.\d+)?px(/\*\d+px\*/)?", lambda m: m.group(1) + f"{h}px", t, count=1)
        escribir(nombre, t)
        canvas["boards"][f"{nombre}.dc.html"]["h"] = h
    ruta.write_text(json.dumps(canvas, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    for nombre, (cambios, secciones, prohibido, sacar, estilo) in TABLEROS.items():
        t = leer(nombre)
        for viejo, nuevo in cambios:
            t = cambiar(t, viejo, nuevo)
        if nombre == "Criterio-Tablas":
            t = roles(t)
        t = antes_de_prohibido(t, secciones)
        t = prohibir(quitar(t, sacar), prohibido)
        t = css(t, estilo)
        escribir(nombre, t)
    altos()
    print("ok", len(TABLEROS), "tableros")
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(TABLEROS))
