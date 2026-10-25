"""Tablero «Criterio · Avisos y errores» en la página «Criterio de diseño»."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 2920
ARCHIVO = "Criterio-Avisos.dc.html"
TITULO = "Criterio · Avisos y errores"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head = botones.split("</helmet>", 1)[0].replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)

CSS = """  <style data-criterio="avisos">
.reglas2 { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; color: var(--t2); font-size: 14px; }
.reglas2 strong { color: var(--t1); font-weight: 600; }
.medidas .fil { box-sizing: border-box; }
.donde { display: flex; flex-direction: column; background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; font-size: 13px; }
.donde .c, .donde .f { display: grid; grid-template-columns: 300px 330px 220px minmax(0, 1fr); gap: 16px; align-items: center; padding: 0 18px; }
.donde .c { min-height: 40px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-weight: 600; color: var(--t2); }
.donde .f { min-height: 48px; border-bottom: 1px solid var(--borde); }
.donde .f:last-child { border-bottom: 0; }
.donde .f:nth-child(odd) { background: oklch(0.975 0.008 78); }
.donde .f strong { font-weight: 600; }
.donde .f .ej { color: var(--t2); }
.pant { position: relative; height: 430px; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: var(--fondo); display: flex; }
.pant .lado { width: 200px; background: oklch(0.925 0.02 75); border-right: 1px solid oklch(0.87 0.022 75); }
.pant .col { flex: 1; display: flex; flex-direction: column; }
.pant .barra { height: 44px; background: oklch(0.925 0.02 75); border-bottom: 1px solid oklch(0.87 0.022 75); }
.pant .banda { height: 56px; background: #fff; border-bottom: 1px solid var(--borde); display: flex; align-items: center; padding: 0 24px; font-size: 17px; font-weight: 700; }
.pant .cont { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.pant .bloque { height: 120px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; }
.marca-num { position: absolute; width: 26px; height: 26px; border-radius: 50%; background: var(--t1); color: #fff; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.toast3 { width: 360px; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 12px 10px 12px 14px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); font-size: 13px; color: var(--t1); }
.toast3 .tx { flex: 1; }
.toast3.mal { border-color: oklch(0.57 0.2 25 / 0.45); }
.ic-ok { color: oklch(0.55 0.13 155); display: inline-flex; }
.ic-mal { color: oklch(0.55 0.2 25); display: inline-flex; }
.cartel { display: flex; align-items: center; gap: 10px; min-height: 44px; box-sizing: border-box; padding: 6px 8px 6px 14px; border-radius: 10px; font-size: 13px; }
.cartel .tx { flex: 1; }
.cartel.info { background: var(--marca-t); color: var(--marca-tx); }
.cartel.aten { background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.cartel.prob { background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.g3c { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.pieza2 { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.pieza2 strong { font-size: 15px; }
.pieza2 p { margin: 0; color: var(--t2); font-size: 13.5px; }
.pieza2 .dib { min-height: 56px; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.err-pant { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px; text-align: center; font-size: 13px; color: var(--t2); }
.err-pant .circ { width: 40px; height: 40px; border-radius: 50%; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.err-pant strong { color: var(--t1); font-size: 14px; }
.campo-err { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.campo-err .rot { font-size: 12.5px; font-weight: 600; color: var(--t2); }
.campo-err .ctl { height: 36px; box-sizing: border-box; border: 1px solid var(--peligro); border-radius: 8px; background: #fff; display: flex; align-items: center; padding: 0 12px; }
.campo-err .e { font-size: 12.5px; color: oklch(0.5 0.19 25); }
.esc { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.esc .tarj { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 8px; }
.esc .tarj strong { font-size: 15px; }
.esc .tarj .f { color: var(--t2); font-size: 13.5px; }
.expl { display: grid; grid-template-columns: 720px minmax(0, 1fr); gap: 32px; align-items: start; }
.pant2 { background: var(--fondo); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.banda2 { display: flex; flex-direction: column; gap: 2px; padding: 12px 20px; background: #fff; border-bottom: 1px solid var(--borde); }
.banda2 strong { font-size: 17px; }
.est2 { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: oklch(0.5 0.19 25); }
.est2::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.57 0.2 25); }
.caja3 { margin: 20px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.cab3 { display: flex; align-items: center; min-height: 40px; padding: 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; }
.fila3 { display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 16px; font-size: 13px; }
.fila3 .tx { flex: 1; color: var(--t3); }
.i3 { display: inline-flex; color: oklch(0.52 0.19 25); }
.sw3 { width: 36px; height: 20px; border-radius: 999px; background: oklch(0.88 0.01 78); position: relative; margin-left: 8px; }
.sw3::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; }
.esc .tarj .ej { font-size: 13.5px; color: var(--t1); background: var(--s2); border-radius: 8px; padding: 8px 10px; }
.pant .barra { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 0 14px; }
.pant .barra .yo { width: 120px; height: 14px; border-radius: 7px; background: oklch(0.87 0.022 75); }
.pant .banda { flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; height: 64px; }
.cmp { position: relative; width: 34px; height: 34px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; color: var(--t2); }
.cmp.on { background: oklch(0.24 0.014 78 / 0.06); color: var(--t1); }
.cmp .n { position: absolute; top: 0; right: -2px; min-width: 18px; height: 18px; padding: 0 5px; box-sizing: border-box; border-radius: 9px; background: var(--marca); color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; border: 2px solid oklch(0.925 0.02 75); }
.cmp-l { position: absolute; right: 150px; top: 46px; width: 330px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; box-shadow: 0 16px 40px oklch(0.24 0.014 78 / 0.16); overflow: hidden; font-size: 13px; }
.cmp-l .it { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; }
.cmp-l .it + .it { border-top: 1px solid var(--borde); }
.cmp-l .it small { font-size: 12px; color: var(--t3); }
.cmp-l .cab { padding: 10px 14px; border-bottom: 1px solid var(--borde); font-weight: 700; }
.mini-cmp { display: flex; flex-direction: column; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 13px; }
.mini-cmp .it { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; }
.mini-cmp .it + .it { border-top: 1px solid var(--borde); }
.mini-cmp .it small { font-size: 12px; color: var(--t3); }
.banda-mini { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; border: 1px solid var(--borde); border-radius: 10px; }
.banda-mini strong { font-size: 15px; }
  </style>"""

OK = '<span class="ic-ok"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg></span>'
MAL = '<span class="ic-mal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg></span>'
X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>'
INFO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/></svg>'
TRI = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>'
NUBE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M8.5 8.5A5 5 0 0 0 7 18h10"/><path d="M12 6a5 5 0 0 1 5 5 4 4 0 0 1 3 6"/></svg>'
CAMPANA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>'
CERRAR = f'<button type="button" class="ib" aria-label="Cerrar">{X}</button>'


def fila(que, donde, dura, ej):
    return f'<div class="f"><strong>{que}</strong><span>{donde}</span><span>{dura}</span><span class="ej">{ej}</span></div>'


BODY = f"""<div class="crit">
  <div>
    <h1>Avisos y errores</h1>
    <p class="sub">Cada aviso tiene un solo lugar: lo que acabás de hacer, abajo; el estado de lo que mirás, en la banda; todo lo demás, en la campana.</p>
  </div>

  <section>
    <h2>¿Dónde se muestra?</h2>
    <div class="donde">
      <div class="c"><span>Qué pasó</span><span>Dónde se ve</span><span>Cuánto dura</span><span>Ejemplo</span></div>
      {fila("Hiciste algo y salió bien", "Aviso abajo a la derecha, con tilde verde", "Se va solo a los 4 segundos", "«Guardamos tus datos.»")}
      {fila("Hiciste algo y falló (un botón, un ⋮)", "Aviso abajo a la derecha, rojo, con ✕", "No se va solo: lo cerrás vos", "«No pudimos conectarnos. Revisá tu conexión.»")}
      {fila("Un formulario tiene algo mal", "En su franja; el de un dato, debajo del campo, al intentar guardar", "Hasta que lo corregís", "«Escribí el correo.»")}
      {fila("El estado de lo que mirás", "En la banda, con punto y palabra; lo que falló, marcado en su lugar", "Mientras siga así", "«● No se pudo publicar»")}
      {fila("Llegó algo, falló algo en segundo plano o algo espera a alguien", "En la campana del encabezado, con su número; cada aviso lleva a donde se resuelve", "Hasta que se resuelve", "«4 respuestas por aprobar»")}
      {fila("Algo bloquea la pantalla entera", "Cartel arriba del contenido: el único cartel en el cuerpo", "Mientras siga pasando", "«Grupo Delta está suspendida»")}
      {fila("La pantalla no se puede mostrar", "La pantalla entera", "Hasta que reintentás o te vas", "«No pudimos abrir esta pantalla»")}
      {fila("Vas a hacer algo que no se deshace", "Diálogo de confirmación, antes de hacerlo", "Hasta que decidís", "«¿Revocar la invitación a Sofía Herrera?»")}
    </div>
  </section>

  <section>
    <h2>Dónde queda cada uno en la pantalla</h2>
    <div class="pant" aria-label="Pantalla de ejemplo con la campana, la banda y un aviso">
      <div class="lado"></div>
      <div class="col">
        <div class="barra"><span class="cmp on">{CAMPANA}<span class="n">4</span></span><span class="yo"></span></div>
        <div class="banda">Control de vehículo<span class="est2">No se pudo publicar</span></div>
        <div class="cont">
          <div class="bloque"></div>
          <div class="bloque" style="height: 80px;"></div>
        </div>
      </div>
      <div class="cmp-l"><div class="cab">Avisos</div><div class="it">Llegaron 5 tickets de combustible que no encajan en ningún formulario<small>hace 10 min</small></div><div class="it">4 respuestas por aprobar<small>hoy, 09:12</small></div></div>
      <div style="position: absolute; right: 20px; bottom: 20px;"><div class="toast3">{OK}<span class="tx">Guardamos los cambios.</span></div></div>
      <span class="marca-num" style="right: 196px; top: 9px;">1</span>
      <span class="marca-num" style="left: 440px; top: 78px;">2</span>
      <span class="marca-num" style="right: 386px; bottom: 32px;">3</span>
    </div>
    <ul class="reglas2" style="margin-top: 14px;">
      <li><strong>1 · Campana:</strong> en el encabezado, al lado del nombre, con su número. Abre la lista: cada aviso es una línea y cuándo, y lleva a donde se resuelve.</li>
      <li><strong>2 · Banda:</strong> el estado de lo que mirás, con punto y palabra. Lo que falló se marca en su lugar, con un ⓘ.</li>
      <li><strong>3 · Aviso:</strong> abajo a la derecha, encima de todo, solo para lo que acabás de hacer. Si hay varios, se apilan; como mucho, tres.</li>
      <li><strong>En el teléfono,</strong> la campana va en la barra de arriba de las pantallas principales y abre su pantalla; lo pasajero, en la franja oscura de abajo.</li>
    </ul>
  </section>

  <section>
    <h2>Cómo se ve cada uno</h2>
    <div class="g3c">
      <div class="pieza2"><div class="dib"><div class="toast3">{OK}<span class="tx">Guardamos tus datos.</span></div></div><strong>Salió bien</strong><p>Tilde verde. Se va solo. No lleva botones.</p></div>
      <div class="pieza2"><div class="dib"><div class="toast3 mal">{MAL}<span class="tx">No pudimos conectarnos. Revisá tu conexión.</span>{CERRAR}</div></div><strong>Falló una acción directa</strong><p>Ícono rojo y ✕. Queda hasta que lo cerrás.</p></div>
      <div class="pieza2"><div class="dib"><div class="campo-err"><span class="rot">Correo</span><div class="ctl">sofia.herrera@</div><span class="e">Revisá el correo: no parece válido.</span></div></div><strong>Error en un formulario</strong><p>En el lugar, nunca en un aviso. Ver «Formularios y campos».</p></div>
      <div class="pieza2"><div class="dib"><div class="mini-cmp"><div class="it">WhatsApp rechazó la versión 3 de Control de vehículo<small>hace 1 hora</small></div><div class="it">4 respuestas por aprobar<small>hoy, 09:12</small></div></div></div><strong>La campana</strong><p>Lo que llegó, lo que falló en segundo plano y lo que espera a alguien.</p></div>
      <div class="pieza2"><div class="dib"><div class="banda-mini"><strong>Control de vehículo</strong><span class="est2">No se pudo publicar</span></div></div><strong>El estado, en la banda</strong><p>Punto y palabra; el motivo, en el ⓘ de donde falló.</p></div>
      <div class="pieza2"><div class="dib"><div class="cartel prob">{NUBE}<span class="tx">Sin conexión</span></div></div><strong>Cartel que bloquea</strong><p>Solo si la pantalla entera no se puede usar.</p></div>
    </div>
    <div class="g3c" style="margin-top: 16px;">
      <div class="pieza2"><div class="dib"><div class="err-pant"><span class="circ">{MAL}</span><strong>No pudimos abrir esta pantalla</strong><button type="button" class="cb cb-sec ch">Reintentar</button></div></div><strong>Pantalla de error</strong><p>Cuando no se puede mostrar nada de la pantalla.</p></div>
    </div>
  </section>

  <section>
    <h2>Cómo se escribe</h2>
    <div class="esc">
      <div class="tarj"><strong>Salió bien</strong><span class="f">En pasado y en plural: lo que hicimos.</span><span class="ej">Guardamos tus datos.</span><span class="ej">Quitamos lucia.fer@gmail.com.</span></div>
      <div class="tarj"><strong>Salió mal</strong><span class="f">«No pudimos» y qué, y después qué hacer.</span><span class="ej">No pudimos conectarnos. Revisá tu conexión.</span><span class="ej">No pudimos completar el ingreso con Google.</span></div>
      <div class="tarj"><strong>En la campana</strong><span class="f">Qué pasó y con qué, en una línea.</span><span class="ej">Llegaron 5 tickets de combustible que no encajan en ningún formulario</span><span class="ej">No se pudo mandar el aviso de VIS-000126</span></div>
    </div>
  </section>

  <section>
    <h2>Sin textos que explican</h2>
    <div class="expl">
      <div class="pant2">
        <div class="banda2"><strong>Página pública</strong><span class="est2">Despublicada por la plataforma</span></div>
        <div class="caja3">
          <div class="cab3">Publicación</div>
          <div class="fila3"><span class="tx">Visible en delta.plataforma.com</span><span class="i3" aria-label="Por qué está despublicada">{INFO}</span><span class="sw3" aria-hidden="true"></span></div>
        </div>
      </div>
      <ul class="reglas2">
        <li><strong>El estado se dice una vez</strong>, arriba, en la segunda línea de la banda: un punto de color y pocas palabras.</li>
        <li><strong>Donde está la acción, solo un ⓘ.</strong> Lo que no se puede usar queda apagado y abre lo mismo que el ⓘ.</li>
        <li><strong>El ⓘ abre el aviso importante</strong>, con el motivo y qué podés hacer. Ver «Diálogos».</li>
        <li><strong>Ningún párrafo que explique</strong> en la pantalla: lo que hay que saber va en ese aviso.</li>
        <li><strong>Nada revela si un correo o un teléfono tiene cuenta</strong> (ADR 0041): la pantalla sigue igual y a ese correo o número le llega un aviso en lugar del código. Excepción: «Invitar operador», porque quien tiene ese permiso ya ve las cuentas.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Prohibido</h2>
    <ul class="prohibido">
      <li>Un error en un aviso que se va solo.</li>
      <li>El mismo error en dos lugares: en el formulario y abajo.</li>
      <li>Un diálogo para contar que algo salió bien.</li>
      <li>Un cartel en el cuerpo de una pantalla para algo que no la bloquea: va en la campana.</li>
      <li>Lo que llegó o falló en segundo plano en un aviso de abajo: va en la campana.</li>
      <li>Cerrar el cartel que bloquea mientras sigue pasando.</li>
      <li>Textos como «Error», «Ups», «Operación exitosa» o con signos de exclamación.</li>
      <li>Códigos técnicos o textos en inglés.</li>
      <li>Párrafos o líneas que explican en la pantalla: van detrás de un ⓘ.</li>
      <li>El mismo estado en dos lugares: arriba y otra vez en la fila.</li>
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
(PROJ / ARCHIVO).write_text(html, encoding="utf-8")

ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
c["boards"][ARCHIVO] = {"x": 6080, "y": 260, "w": 1440, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 1440 * 5 + 80 * 4
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
