"""Tablero «Criterio · Botones» y la página «Criterio de diseño» del lienzo."""
import json
import pathlib

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 2080

base = (PROJ / "Botones.dc.html").read_text(encoding="utf-8").split("\n")
fin_helmet = next(i for i, l in enumerate(base) if l.strip() == "</helmet>")
head = "\n".join(base[:fin_helmet]).replace("<title>Botones de la página</title>", "<title>Criterio · Botones</title>")
if "<title>Criterio · Botones</title>" not in head:
    head = head.replace("<title>", "<title>Criterio · Botones", 1).split("</title>")[0] + "</title>" + head.split("</title>", 1)[1]

CSS = """  <style data-criterio="botones">
.crit { width: 1440px; min-height: """ + str(ALTO) + """px; box-sizing: border-box; padding: 40px 48px 56px; background: var(--fondo); color: var(--t1); font-size: 14px; line-height: 1.5; display: flex; flex-direction: column; gap: 36px; }
.crit h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
.crit .sub { margin: 4px 0 0; font-size: 15px; color: var(--t2); }
.crit h2 { margin: 0 0 14px; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; padding-bottom: 10px; border-bottom: 1px solid var(--borde); }
.g4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.pieza { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.pieza .muestra { display: flex; align-items: center; gap: 10px; min-height: 44px; flex-wrap: wrap; }
.pieza strong { font-size: 15px; }
.pieza p { margin: 0; color: var(--t2); font-size: 13.5px; }
.pieza .ej { font-size: 12.5px; color: var(--t3); }
.cb { height: 36px; box-sizing: border-box; padding: 0 14px; border-radius: 8px; border: 1px solid transparent; font-family: inherit; font-size: 14px; font-weight: 600; line-height: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; white-space: nowrap; text-decoration: none; }
.cb svg { width: 16px; height: 16px; flex-shrink: 0; }
.cb.ch { height: 32px; padding: 0 12px; font-size: 13px; }
.cb.ch svg { width: 14px; height: 14px; }
.cb.gr { height: 44px; padding: 0 18px; font-size: 15px; border-radius: 10px; }
.cb-pri { background: var(--marca); color: #fff; }
.cb-pri:hover, .cb-pri.h { background: var(--marca-h); }
.cb-sec { background: #fff; border-color: var(--borde2); color: var(--t1); }
.cb-sec:hover, .cb-sec.h { background: var(--s2); border-color: oklch(0.78 0.014 78); }
.cb-pel { background: #fff; border-color: oklch(0.57 0.2 25 / 0.4); color: oklch(0.52 0.19 25); }
.cb-pel:hover, .cb-pel.h { background: var(--peligro-t); }
.cb-pel.lleno { background: oklch(0.55 0.2 25); border-color: oklch(0.55 0.2 25); color: #fff; }
.cb-enl { height: auto; padding: 0; background: transparent; color: var(--marca-tx); }
.cb-enl:hover, .cb-enl.h { text-decoration: underline; text-underline-offset: 3px; }
.cb:disabled { opacity: 0.5; cursor: default; }
.ib { width: 32px; height: 32px; box-sizing: border-box; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.ib:hover, .ib.h { background: #fff; border-color: var(--borde); color: var(--t1); }
.medidas { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.medidas .cab { display: grid; grid-template-columns: 200px 150px minmax(0, 1fr) 420px; gap: 16px; align-items: center; min-height: 44px; padding: 0 18px; background: oklch(0.945 0.018 76); font-size: 13px; font-weight: 600; color: var(--t2); border-bottom: 1px solid oklch(0.89 0.02 76); }
.medidas .fil { display: grid; grid-template-columns: 200px 150px minmax(0, 1fr) 420px; gap: 16px; align-items: center; min-height: 64px; padding: 10px 18px; border-bottom: 1px solid var(--borde); }
.medidas .fil:last-child { border-bottom: 0; }
.medidas .fil .muestra { display: flex; align-items: center; gap: 10px; }
.caso { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.caso .rot { font-size: 13px; font-weight: 600; color: var(--t2); }
.caso .nota { font-size: 12.5px; color: var(--t3); }
.cuadro { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.cuadro .banda { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 60px; padding: 0 18px; }
.cuadro .banda h3 { margin: 0; font-size: 16px; font-weight: 700; white-space: nowrap; }
.cuadro .cab-caja { display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 0 8px 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 14px; font-weight: 600; }
.cuadro .fila { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 8px 0 16px; font-size: 14px; }
.cuadro .fila .dato { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }
.cuadro .pie { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--borde); }
.cuadro .cuerpo { padding: 16px; color: var(--t2); font-size: 13.5px; }
.cuadro .cuerpo strong { display: block; color: var(--t1); font-size: 16px; margin-bottom: 4px; }
.filtros { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.filtros .bus { flex: 1; height: 36px; border: 1px solid var(--borde); border-radius: 8px; background: var(--s2); display: flex; align-items: center; padding: 0 12px; color: var(--t3); font-size: 13.5px; }
.filtros .pil { height: 36px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 999px; padding: 0 14px; display: inline-flex; align-items: center; font-size: 13.5px; color: var(--t2); background: #fff; }
.si-no { display: flex; flex-direction: column; gap: 12px; }
.si-no .t { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; }
.si-no .t.si { color: var(--ok); }
.si-no .t.no { color: oklch(0.52 0.19 25); }
.si-no .muestra { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.tachado { position: relative; opacity: 0.55; }
.tachado::after { content: ""; position: absolute; left: -4px; right: -4px; top: 50%; border-top: 2px solid oklch(0.52 0.19 25); transform: rotate(-8deg); }
.prohibido { margin: 0; padding-left: 20px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 32px; color: var(--t2); font-size: 14px; }
.girar2 { width: 14px; height: 14px; box-sizing: border-box; border-radius: 50%; border: 2px solid oklch(1 0 0 / 0.4); border-top-color: #fff; }
  </style>"""

MAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>'
KEBAB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>'
CRUZ = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>'
MENU = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>'
ATRAS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>'
DISCO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><path d="M8 20v-6h8v6"/></svg>'
TILDE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
EQUIS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>'
WA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color: var(--t3);"><path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/></svg>'

BODY = f"""<div class="crit">
  <div>
    <h1>Botones</h1>
    <p class="sub">Cuatro tipos y dos tamaños. Igual en todas las pantallas y en todos los proyectos.</p>
  </div>

  <section>
    <h2>Los cuatro tipos</h2>
    <div class="g4">
      <div class="pieza">
        <div class="muestra"><button type="button" class="cb cb-pri">Guardar cambios</button></div>
        <strong>Principal</strong>
        <p>La acción que hace avanzar. Una sola por pantalla y por diálogo, siempre la última a la derecha.</p>
        <span class="ej">Guardar cambios · Invitar usuario · Crear rol</span>
      </div>
      <div class="pieza">
        <div class="muestra"><button type="button" class="cb cb-sec">Cancelar</button></div>
        <strong>Secundario</strong>
        <p>Todas las demás acciones.</p>
        <span class="ej">Cancelar · Descartar cambios · Exportar · Vincular</span>
      </div>
      <div class="pieza">
        <div class="muestra"><button type="button" class="cb cb-pel">Dar de baja</button><button type="button" class="cb cb-pel lleno">Dar de baja</button></div>
        <strong>Peligro</strong>
        <p>Lo que no se deshace. En la pantalla va con borde; relleno, solo en el diálogo que lo confirma.</p>
        <span class="ej">Dar de baja · Quitar · Desactivar · Eliminar</span>
      </div>
      <div class="pieza">
        <div class="muestra"><button type="button" class="cb cb-enl">Verificar</button></div>
        <strong>Enlace</strong>
        <p>Una acción chica dentro de una fila o de un texto. Nunca es la principal.</p>
        <span class="ej">Verificar · Reenviar código · Limpiar filtros</span>
      </div>
    </div>
  </section>

  <section>
    <h2>Tamaños</h2>
    <div class="medidas">
      <div class="cab"><span>Tamaño</span><span>Medida</span><span>Dónde</span><span>Cómo se ve</span></div>
      <div class="fil"><strong>Normal</strong><span>36 px · texto 14</span><span>Banda de la página, diálogos y formularios.</span><span class="muestra"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel">Quitar</button><button type="button" class="cb cb-pri">Guardar cambios</button></span></div>
      <div class="fil"><strong>Chico</strong><span>32 px · texto 13</span><span>Encabezado de una caja o de una tabla, y dentro de una fila.</span><span class="muestra"><button type="button" class="cb cb-sec ch">{MAS} Agregar correo</button><button type="button" class="cb cb-sec ch">Vincular</button></span></div>
      <div class="fil"><strong>Grande</strong><span>44 px · texto 15</span><span>Solo en las pantallas de ingreso y registro, a todo el ancho.</span><span class="muestra"><button type="button" class="cb cb-pri gr" style="width: 300px;">Continuar</button></span></div>
      <div class="fil"><strong>De ícono</strong><span>32 × 32</span><span>Solo ⋮ (más acciones), ✕ (cerrar), ☰ (menú) y ‹ (volver). Siempre con nombre para el lector de pantalla.</span><span class="muestra"><button type="button" class="ib" aria-label="Más acciones">{KEBAB}</button><button type="button" class="ib" aria-label="Cerrar">{CRUZ}</button><button type="button" class="ib" aria-label="Abrir el menú">{MENU}</button><button type="button" class="ib h" aria-label="Volver">{ATRAS}</button></span></div>
    </div>
  </section>

  <section>
    <h2>Dónde van</h2>
    <div class="g3">
      <div class="caso">
        <span class="rot">Banda de la página</span>
        <div class="cuadro"><div class="banda"><h3>Mi cuenta</h3><span style="display: flex; gap: 8px;"><button type="button" class="cb cb-sec">Descartar cambios</button><button type="button" class="cb cb-pri">Guardar cambios</button></span></div></div>
        <span class="nota">Hasta tres a la vista; las demás, en ⋮. La principal, al final.</span>
      </div>
      <div class="caso">
        <span class="rot">Encabezado de una caja o tabla</span>
        <div class="cuadro"><div class="cab-caja"><span>Cómo entrás</span><button type="button" class="cb cb-sec ch">{MAS} Agregar correo o teléfono</button></div><div class="fila"><span class="dato">lucia.fer@gmail.com</span></div></div>
        <span class="nota">Una sola acción, chica y secundaria, a la derecha.</span>
      </div>
      <div class="caso">
        <span class="rot">Fila</span>
        <div class="cuadro"><div class="fila">{WA}<span class="dato" style="display: flex; flex-direction: column; line-height: 1.35;">011 15-5555-4521<span style="color: var(--t3); font-size: 12px;">Sin verificar</span></span><button type="button" class="cb cb-enl" style="font-size: 13.5px;">Verificar</button><button type="button" class="ib" aria-label="Acciones de 011 15-5555-4521">{KEBAB}</button></div></div>
        <span class="nota">Todo va en el ⋮. A la vista, a lo sumo un enlace, si el estado lo pide.</span>
      </div>
      <div class="caso">
        <span class="rot">Pie de un diálogo</span>
        <div class="cuadro"><div class="cuerpo"><strong>Tus datos</strong>Nombre, idioma y zona horaria.</div><div class="pie"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button></div></div>
        <span class="nota">Abajo a la derecha: Cancelar y la principal, última.</span>
      </div>
      <div class="caso">
        <span class="rot">Confirmación de algo que no se deshace</span>
        <div class="cuadro"><div class="cuerpo"><strong>¿Dar de baja tu cuenta?</strong>Cerramos todas tus sesiones.</div><div class="pie"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Dar de baja</button></div></div>
        <span class="nota">El único lugar con rojo relleno. El botón repite la acción.</span>
      </div>
      <div class="caso">
        <span class="rot">Barra de filtros</span>
        <div class="cuadro"><div class="filtros"><span class="bus">Buscar por nombre o correo</span><span class="pil">Estado</span><button type="button" class="cb cb-enl" style="font-size: 13.5px;">Limpiar filtros</button></div></div>
        <span class="nota">Sin botones. Solo «Limpiar filtros», como enlace.</span>
      </div>
    </div>
  </section>

  <section>
    <h2>Íconos y textos</h2>
    <div class="g2">
      <div class="pieza si-no">
        <span class="t si">{TILDE} Así</span>
        <div class="muestra"><button type="button" class="cb cb-pri">{MAS} Invitar usuario</button><button type="button" class="cb cb-sec">Descartar cambios</button><button type="button" class="cb cb-pel lleno">Dar de baja</button></div>
        <p>El único ícono es el «+» de agregar, crear o invitar. El texto es un verbo y qué cosa, de una a tres palabras. La confirmación repite la acción.</p>
      </div>
      <div class="pieza si-no">
        <span class="t no">{EQUIS} Así no</span>
        <div class="muestra"><span class="tachado"><button type="button" class="cb cb-pri">{DISCO} Guardar</button></span><span class="tachado"><button type="button" class="cb cb-pri">Aceptar</button></span><span class="tachado"><button type="button" class="cb cb-sec">OK</button></span><span class="tachado"><button type="button" class="cb cb-sec">Hacé clic acá</button></span></div>
        <p>Nada de íconos de adorno ni de textos genéricos: «Aceptar», «OK», «Sí» o «Enviar» no dicen qué pasa.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Estados</h2>
    <div class="g4">
      <div class="pieza"><div class="muestra"><button type="button" class="cb cb-pri">Guardar cambios</button></div><strong>Normal</strong></div>
      <div class="pieza"><div class="muestra"><button type="button" class="cb cb-pri h">Guardar cambios</button></div><strong>Mouse encima</strong><p>Un tono más oscuro.</p></div>
      <div class="pieza"><div class="muestra"><button type="button" class="cb cb-pri" disabled="{{si}}" style="opacity: 0.85;"><span class="girar2" aria-hidden="true"></span> Guardando…</button></div><strong>Guardando</strong><p>Dice qué está haciendo y no se puede volver a tocar.</p></div>
      <div class="pieza"><div class="muestra"><button type="button" class="cb cb-pri" disabled="{{si}}">Guardar cambios</button></div><strong>Deshabilitado</strong><p>Solo «Guardar cambios» cuando no hay cambios. Lo demás, siempre habilitado.</p></div>
    </div>
  </section>

  <section>
    <h2>Prohibido</h2>
    <ul class="prohibido">
      <li>Dos principales en la misma pantalla o diálogo.</li>
      <li>Otros tamaños, colores, radios o sombras.</li>
      <li>Rojo relleno fuera del diálogo que confirma.</li>
      <li>Íconos de adorno dentro de un botón.</li>
      <li>Botones en la barra de filtros.</li>
      <li>Un enlace como acción principal.</li>
      <li>Textos genéricos: Aceptar, OK, Sí, Enviar.</li>
      <li>Deshabilitar un botón en vez de explicar qué falta.</li>
    </ul>
  </section>
</div>"""

SCRIPT = f"""<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{ALTO}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{ si: true, no: false }};
  }}
}}
</script>"""

html = "\n".join([head, CSS, "</helmet>", "", BODY, "</x-dc>", "", SCRIPT, "</body>", "</html>", ""])
(PROJ / "Criterio-Botones.dc.html").write_text(html, encoding="utf-8")

# Índice: página «Criterio de diseño», primera de la lista, y el lienzo abre ahí.
ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
if not any(p["id"] == "criterio" for p in c["pages"]):
    c["pages"].insert(0, {"id": "criterio", "name": "Criterio de diseño"})
c["boards"]["Criterio-Botones.dc.html"] = {"x": 0, "y": 260, "w": 1440, "h": ALTO, "title": "Criterio · Botones", "page": "criterio"}
if "Criterio-Botones.dc.html" not in c["order"]:
    c["order"].append("Criterio-Botones.dc.html")
c["notes"]["t-criterio"] = {"kind": "title1", "x": 0, "y": 0, "w": 600, "maxW": 1440, "text": "Criterio de diseño", "page": "criterio"}
c["launch"] = {"view": "canvas", "page": "criterio"}
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
