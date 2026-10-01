"""Tablero «Criterio · Diálogos» en la página «Criterio de diseño»."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 2200
ARCHIVO = "Criterio-Dialogos.dc.html"
TITULO = "Criterio · Diálogos"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head = botones.split("</helmet>", 1)[0].replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)

CSS = """  <style data-criterio="dialogos">
.fondo-osc { background: oklch(0.3 0.014 78 / 0.55); border-radius: 12px; padding: 40px; display: flex; align-items: flex-start; justify-content: center; gap: 48px; }
.cd { background: #fff; border-radius: 12px; box-shadow: 0 24px 48px oklch(0.2 0.014 78 / 0.28); overflow: hidden; display: flex; flex-direction: column; font-size: 13px; color: var(--t1); }
.cd.normal { width: 560px; }
.cd.chico { width: 420px; }
.cd .cab { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; box-sizing: border-box; padding: 0 8px 0 20px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); }
.cd .cab h3 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.cd .cuerpo { padding: 20px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
.cd.normal .cuerpo { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cd .cuerpo .ancho { grid-column: 1 / -1; }
.cd .texto { padding: 20px; font-size: 13.5px; line-height: 1.55; color: var(--t2); }
.cd .pie { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--borde); }
.cmp { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cmp label, .cmp .rotulo { font-size: 12.5px; font-weight: 600; color: var(--t2); }
.cmp .req { color: var(--peligro); }
.ctl { height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; font-size: 13px; color: var(--t1); }
.ctl.vacio2 { color: var(--t3); }
.ctl.foco { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.15); }
.seg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.pie-rot { margin-top: 10px; font-size: 13px; font-weight: 600; color: #fff; text-align: center; }
.dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.tarj { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
.tarj strong { font-size: 15px; }
.tarj ul { margin: 0; padding-left: 18px; color: var(--t2); display: flex; flex-direction: column; gap: 4px; }
.medidas .fil { box-sizing: border-box; }
  </style>"""

X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>'
ABAJO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color: var(--t3);"><path d="m7 10 5 5 5-5"/></svg>'
CERRAR = f'<button type="button" class="ib" aria-label="Cerrar">{X}</button>'


def fila_medida(pieza, medida, como):
    return (f'<div class="fil" style="grid-template-columns: 220px 170px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;">'
            f'<strong>{pieza}</strong><span>{medida}</span><span>{como}</span></div>')


BODY = f"""<div class="crit">
  <div>
    <h1>Diálogos</h1>
    <p class="sub">Para algo corto que se hace sin salir de la pantalla. Si no es corto, es una pantalla propia.</p>
  </div>

  <section>
    <h2>Los dos anchos</h2>
    <div class="fondo-osc">
      <div>
        <div class="cd normal" role="dialog" aria-label="Invitar usuario">
          <div class="cab"><h3>Invitar usuario</h3>{CERRAR}</div>
          <div class="cuerpo">
            <div class="cmp ancho"><label>Correo <span class="req">*</span></label><div class="ctl foco">sofia.herrera@delta.ejemplo.com</div></div>
            <div class="cmp ancho"><span class="rotulo">Roles de la organización</span><div class="ctl vacio2">Ninguno {ABAJO}</div></div>
            <div class="cmp"><span class="rotulo">Empresa</span><div class="ctl">Delta S.A. {ABAJO}</div></div>
            <div class="cmp"><span class="rotulo">Roles en la empresa</span><div class="ctl">Solo lectura {ABAJO}</div></div>
          </div>
          <div class="pie"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Invitar</button></div>
        </div>
        <p class="pie-rot">Normal · 560 px · hasta 6 campos, en dos columnas</p>
      </div>
      <div>
        <div class="cd chico" role="dialog" aria-label="Agregar correo o teléfono">
          <div class="cab"><h3>Agregar correo o teléfono</h3>{CERRAR}</div>
          <div class="cuerpo">
            <div class="seg" role="group" aria-label="Qué querés agregar"><span class="on">Correo</span><span>WhatsApp</span></div>
            <div class="cmp"><label>Correo</label><div class="ctl foco">lucia.fer@gmail.com</div></div>
          </div>
          <div class="pie"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Enviar código</button></div>
        </div>
        <p class="pie-rot">Chico · 420 px · uno o dos campos, en una columna</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Confirmar algo que no se deshace</h2>
    <div class="fondo-osc">
      <div>
        <div class="cd chico" role="alertdialog" aria-label="Revocar la invitación">
          <div class="cab"><h3>¿Revocar la invitación a Sofía Herrera?</h3></div>
          <div class="texto">El enlace deja de funcionar. Podés volver a invitarla cuando quieras.</div>
          <div class="pie"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Revocar</button></div>
        </div>
        <p class="pie-rot">Confirmación · 420 px · sin ✕</p>
      </div>
      <div>
        <div class="cd chico" role="dialog" aria-label="Agregar correo o teléfono, guardando">
          <div class="cab"><h3>Agregar correo o teléfono</h3>{CERRAR}</div>
          <div class="cuerpo">
            <div class="seg" role="group" aria-label="Qué querés agregar"><span class="on">Correo</span><span>WhatsApp</span></div>
            <div class="cmp"><label>Correo</label><div class="ctl">lucia.fer@gmail.com</div></div>
          </div>
          <div class="pie"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri" disabled="{{{{si}}}}" style="opacity: 0.85;"><span class="girar2" aria-hidden="true"></span> Enviando…</button></div>
        </div>
        <p class="pie-rot">Mientras guarda · el botón dice qué hace</p>
      </div>
    </div>
    <ul class="reglas2" style="margin-top: 16px;">
      <li><strong>El título es la pregunta</strong>, con el nombre de lo que se toca.</li>
      <li><strong>El texto dice qué se pierde</strong> y si se puede volver atrás. Nada de «¿Estás seguro?».</li>
      <li><strong>El botón repite la acción</strong>, en rojo relleno. Es el único lugar con rojo relleno.</li>
    </ul>
  </section>

  <section>
    <h2>Medidas</h2>
    <div class="medidas">
      <div class="cab" style="grid-template-columns: 220px 170px minmax(0, 1fr);"><span>Pieza</span><span>Medida</span><span>Cómo es</span></div>
      {fila_medida("Ancho", "420 o 560 px", "Chico para uno o dos campos y confirmaciones; normal para hasta 6 campos en dos columnas.")}
      {fila_medida("Encabezado", "48 px", "Fondo arena, como los encabezados de tabla. Título de 15 en semibold y ✕ a la derecha. Sin bajada.")}
      {fila_medida("Cuerpo", "20 px de margen", "Campos de 36 px, con 14 px entre uno y otro. El rótulo arriba de cada campo.")}
      {fila_medida("Pie", "60 px", "Línea arriba. A la derecha, Cancelar y la acción principal, última.")}
      {fila_medida("Esquinas y fondo", "12 px", "Sombra suave. Atrás, la pantalla oscurecida.")}
    </div>
  </section>

  <section>
    <h2>¿Diálogo o pantalla?</h2>
    <div class="dos">
      <div class="tarj"><strong>Diálogo</strong><ul><li>Agregar o editar algo corto: hasta 6 campos.</li><li>Confirmar algo que no se deshace.</li><li>Escribir un código.</li></ul></div>
      <div class="tarj"><strong>Pantalla propia</strong><ul><li>Más de 6 campos, o campos en secciones.</li><li>Algo que lleva una tabla o una lista adentro.</li><li>Algo que se comparte con un enlace.</li></ul></div>
    </div>
  </section>

  <section>
    <h2>Cómo se comporta</h2>
    <ul class="reglas2" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 40px;">
      <li><strong>Se abre centrado</strong>, con la pantalla de atrás oscurecida.</li>
      <li><strong>El cursor arranca en el primer campo.</strong></li>
      <li><strong>Se cierra con ✕, Cancelar o Escape.</strong> Un clic afuera no lo cierra, para no perder lo escrito.</li>
      <li><strong>Al terminar, se cierra</strong> y un aviso abajo a la derecha confirma lo que pasó.</li>
      <li><strong>Un error de un campo</strong> va debajo de ese campo; un error general, arriba de los botones.</li>
      <li><strong>En el teléfono</strong> sube desde abajo, a todo el ancho, y los botones ocupan todo el ancho.</li>
    </ul>
  </section>

  <section>
    <h2>Prohibido</h2>
    <ul class="prohibido">
      <li>Un diálogo arriba de otro.</li>
      <li>Una tabla dentro de un diálogo.</li>
      <li>Bajadas o ayudas debajo del título.</li>
      <li>Scroll adentro: si no entra, es una pantalla.</li>
      <li>Más de dos botones en el pie.</li>
      <li>Un diálogo para avisar que algo salió bien: eso es un aviso.</li>
      <li>Paneles que se despliegan o filas que se expanden en vez de un diálogo.</li>
      <li>Otros anchos que no sean 420 o 560.</li>
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

# .reglas2 viene del tablero de Tablas: la agrego acá también.
EXTRA = """  <style data-criterio="dialogos-reglas">
.reglas2 { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; color: var(--t2); font-size: 14px; }
.reglas2 strong { color: var(--t1); font-weight: 600; }
  </style>"""

html = "\n".join([head, CSS, EXTRA, "</helmet>", "", BODY, "</x-dc>", "", SCRIPT, "</body>", "</html>", ""])
(PROJ / ARCHIVO).write_text(html, encoding="utf-8")

ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
c["boards"][ARCHIVO] = {"x": 3040, "y": 260, "w": 1440, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 1440 * 3 + 80 * 2
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
