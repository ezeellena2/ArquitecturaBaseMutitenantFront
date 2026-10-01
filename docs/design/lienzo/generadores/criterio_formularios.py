"""Tablero «Criterio · Formularios y campos» en la página «Criterio de diseño»."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 2440
ARCHIVO = "Criterio-Formularios.dc.html"
TITULO = "Criterio · Formularios y campos"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head = botones.split("</helmet>", 1)[0].replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)

CSS = """  <style data-criterio="formularios">
.reglas2 { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; color: var(--t2); font-size: 14px; }
.reglas2 strong { color: var(--t1); font-weight: 600; }
.medidas .fil { box-sizing: border-box; }
.hoja2 { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 20px; }
.cmp { display: flex; flex-direction: column; gap: 6px; min-width: 0; font-size: 13px; }
.cmp .rot { font-size: 12.5px; font-weight: 600; color: var(--t2); display: flex; align-items: center; gap: 8px; }
.cmp .rot .req { color: var(--peligro); margin-left: -4px; }
.cmp .rot .todos { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-weight: 500; }
.ctl { height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; font-size: 13px; color: var(--t1); white-space: nowrap; overflow: hidden; }
.ctl.gris { color: var(--t3); }
.ctl.foco { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.15); }
.ctl.mal { border-color: var(--peligro); }
.ctl.bus { background: var(--s2); border-color: var(--borde); color: var(--t3); justify-content: flex-start; }
.ctl.area { height: 84px; align-items: flex-start; padding-top: 9px; white-space: normal; }
.err3 { font-size: 12.5px; color: oklch(0.5 0.19 25); }
.fila-c { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
.g3c { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.ctrl { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.ctrl .dib { min-height: 64px; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.ctrl strong { font-size: 15px; }
.ctrl p { margin: 0; color: var(--t2); font-size: 13.5px; }
.lst { border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); padding: 4px; background: #fff; }
.lst .op { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 36px; padding: 4px 10px; border-radius: 6px; font-size: 13px; }
.lst .op.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 500; }
.lst .op .d { display: block; font-size: 12px; color: var(--t3); font-weight: 400; }
.cas { width: 16px; height: 16px; box-sizing: border-box; border-radius: 4px; border: 1.5px solid var(--borde2); background: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cas.si { background: var(--marca); border-color: var(--marca); color: #fff; }
.chk { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.seg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.otp { display: flex; gap: 8px; }
.otp span { width: 40px; height: 44px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; }
.otp span.foco { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.15); }
.tel { display: flex; gap: 8px; }
.sw { width: 36px; height: 20px; border-radius: 999px; background: var(--marca); position: relative; flex-shrink: 0; }
.sw::after { content: ""; position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; }
.aviso-mal { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: var(--peligro-t); color: oklch(0.45 0.17 25); font-size: 13px; }
.dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
  </style>"""

ABAJO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color: var(--t3); flex-shrink: 0;"><path d="m7 10 5 5 5-5"/></svg>'
TILDE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
TILDE_B = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
LUPA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/></svg>'
ALERTA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>'


def fila_medida(pieza, medida, como):
    return (f'<div class="fil" style="grid-template-columns: 240px 170px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;">'
            f'<strong>{pieza}</strong><span>{medida}</span><span>{como}</span></div>')


BODY = f"""<div class="crit">
  <div>
    <h1>Formularios y campos</h1>
    <p class="sub">Rótulo arriba, el control más simple para cada dato y cada campo con el ancho de lo que lleva.</p>
  </div>

  <section>
    <h2>Un campo y sus estados</h2>
    <div class="hoja2">
      <div class="fila-c">
        <div class="cmp" style="width: 300px;"><span class="rot">Correo <span class="req">*</span></span><div class="ctl">sofia.herrera@delta.ejemplo.com</div><span class="err3" style="color: var(--t3);">Normal</span></div>
        <div class="cmp" style="width: 300px;"><span class="rot">Correo <span class="req">*</span></span><div class="ctl foco">sofia.herrera@</div><span class="err3" style="color: var(--t3);">Escribiendo: borde petróleo</span></div>
        <div class="cmp" style="width: 300px;"><span class="rot">Correo <span class="req">*</span></span><div class="ctl mal">sofia.herrera@</div><span class="err3">Revisá el correo: no parece válido.</span></div>
        <div class="cmp" style="width: 300px;"><span class="rot">Correo <span class="req">*</span></span><div class="ctl mal"></div><span class="err3">Escribí el correo.</span></div>
      </div>
    </div>
    <ul class="reglas2" style="margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 40px;">
      <li><strong>El rótulo va arriba</strong>, siempre visible. Si el dato es obligatorio, lleva un asterisco rojo.</li>
      <li><strong>Sin ayudas debajo</strong> ni textos de ejemplo adentro. Solo el buscador lleva texto adentro.</li>
      <li><strong>El error va debajo del campo</strong>, en rojo, y dice qué hacer.</li>
      <li><strong>Se revisa al tocar Guardar.</strong> Después del primer error, se corrige mientras escribís.</li>
    </ul>
  </section>

  <section>
    <h2>Qué control para cada dato</h2>
    <div class="g3c">
      <div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">Nombre y apellido</span><div class="ctl">Lucía Fernández</div></div></div><strong>Texto</strong><p>Un dato corto que se escribe.</p></div>
      <div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">Motivo <span class="req">*</span></span><div class="ctl area">Ya no uso la cuenta.</div></div></div><strong>Texto largo</strong><p>Un motivo o una descripción. De entrada, tres líneas.</p></div>
      <div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">Buscar</span><div class="ctl bus">{LUPA} Buscar por nombre o correo</div></div></div><strong>Buscador</strong><p>Solo en la barra de filtros. El único con texto adentro.</p></div>
      <div class="ctrl">
        <div class="dib"><div class="cmp"><span class="rot">Idioma y región</span><div class="ctl foco">Español (Argentina) {ABAJO}</div></div>
          <div class="lst"><div class="op on"><span>Español (Argentina)<span class="d">27/09/2026 14:35 · 1.234,50</span></span>{TILDE}</div><div class="op"><span>English (United States)<span class="d">09/27/2026 2:35 PM · 1,234.50</span></span></div></div></div>
        <strong>Desplegable</strong><p>Elegir una opción de una lista. Con más de 10 opciones, suma un buscador arriba.</p>
      </div>
      <div class="ctrl">
        <div class="dib"><div class="cmp"><span class="rot">Roles de la organización <span class="todos"><span class="cas">&nbsp;</span> Todos</span></span><div class="ctl foco">Administrador, Auditor {ABAJO}</div></div>
          <div class="lst"><div class="op"><span class="chk"><span class="cas si">{TILDE_B}</span> Administrador</span></div><div class="op"><span class="chk"><span class="cas si">{TILDE_B}</span> Auditor</span></div><div class="op"><span class="chk"><span class="cas">&nbsp;</span> Solo lectura</span></div></div></div>
        <strong>Varios a la vez</strong><p>Un desplegable con casillas. Si son muchos, muestra «3 elegidos». Nunca una lista de casillas suelta.</p>
      </div>
      <div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">Qué querés agregar</span><div class="seg"><span class="on">Correo</span><span>WhatsApp</span></div></div></div><strong>Segmentado</strong><p>Dos o tres opciones fijas que cambian lo que se pide abajo.</p></div>
      <div class="ctrl"><div class="dib"><span class="chk"><span class="cas si">{TILDE_B}</span> Acepto los términos y la política de privacidad</span></div><strong>Casilla</strong><p>Un sí o no, dentro de un formulario que se guarda.</p></div>
      <div class="ctrl"><div class="dib"><span class="chk" style="justify-content: space-between;"><span>WhatsApp</span><span class="sw" aria-hidden="true"></span></span></div><strong>Interruptor</strong><p>Prender o apagar algo que se aplica en el momento, sin Guardar.</p></div>
      <div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">Código</span><div class="otp"><span>4</span><span>8</span><span class="foco"></span><span></span><span></span><span></span></div></div></div><strong>Código</strong><p>Seis casillas. Se puede pegar el código entero.</p></div>
    </div>
  </section>

  <section>
    <h2>Cada campo, del ancho de su dato</h2>
    <div class="hoja2">
      <div class="fila-c">
        <div class="cmp" style="width: 360px;"><span class="rot">Nombre y apellido</span><div class="ctl">Lucía Fernández</div></div>
        <div class="cmp" style="width: 260px;"><span class="rot">Idioma y región</span><div class="ctl">Español (Argentina) {ABAJO}</div></div>
        <div class="cmp" style="width: 260px;"><span class="rot">Zona horaria</span><div class="ctl">Buenos Aires (GMT−3) {ABAJO}</div></div>
      </div>
      <div class="fila-c" style="margin-top: 16px;">
        <div class="cmp" style="width: 360px;"><span class="rot">Correo</span><div class="ctl">lucia.fer@gmail.com</div></div>
        <div class="cmp" style="width: 280px;"><span class="rot">WhatsApp</span><div class="tel"><div class="ctl" style="width: 84px;">+54 {ABAJO}</div><div class="ctl" style="flex: 1;">11 5555-4521</div></div></div>
        <div class="cmp" style="width: 200px;"><span class="rot">CUIT</span><div class="ctl">30-71234567-8</div></div>
      </div>
    </div>
    <div class="medidas" style="margin-top: 16px;">
      <div class="cab" style="grid-template-columns: 240px 170px minmax(0, 1fr);"><span>Dato</span><span>Ancho</span><span>Ejemplos</span></div>
      {fila_medida("Nombre, correo", "360 px", "Nombre y apellido, correo, nombre de una empresa.")}
      {fila_medida("Teléfono", "280 px", "Prefijo del país y número.")}
      {fila_medida("Desplegable", "260 px", "Idioma, zona horaria, empresa, roles.")}
      {fila_medida("Número o documento", "200 px", "CUIT, DNI, código postal, un monto.")}
      {fila_medida("Texto largo", "Todo el ancho", "Motivo, descripción. Hasta 720 px.")}
      {fila_medida("Alto de todo campo", "36 px", "Igual que un botón normal. El código, 44 px.")}
    </div>
  </section>

  <section>
    <h2>Errores</h2>
    <div class="dos">
      <div class="hoja2" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="cmp" style="width: 360px;"><span class="rot">Nombre y apellido</span><div class="ctl mal">Lucía Fernández de la Santísima Trinidad y…</div><span class="err3">El nombre es demasiado largo.</span></div>
        <div class="cmp"><span class="rot">Motivo <span class="req">*</span></span><div class="ctl area mal"></div><span class="err3">Escribí el motivo.</span></div>
      </div>
      <div class="hoja2" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="cmp" style="width: 360px;"><span class="rot">Nombre y apellido</span><div class="ctl">Lucía Fernández</div></div>
        <div class="aviso-mal" role="alert">{ALERTA} No pudimos conectarnos. Revisá tu conexión.</div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button></div>
      </div>
    </div>
    <ul class="reglas2" style="margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 40px;">
      <li><strong>Error de un campo:</strong> borde rojo y el mensaje debajo, en el mismo lugar, sin mover lo demás.</li>
      <li><strong>Error general:</strong> una franja roja clara arriba de los botones. Nunca un aviso que se va solo.</li>
    </ul>
  </section>

  <section>
    <h2>Prohibido</h2>
    <ul class="prohibido">
      <li>Rótulos adentro del campo en vez de arriba.</li>
      <li>Ayudas o ejemplos debajo de cada campo.</li>
      <li>Campos estirados a todo el ancho de la pantalla.</li>
      <li>Listas de casillas sueltas: van en un desplegable.</li>
      <li>Campos grises de solo lectura: lo que no se edita se muestra como texto.</li>
      <li>Avisar un error con un aviso que desaparece.</li>
      <li>Otros altos, bordes o esquinas.</li>
      <li>Un interruptor en un formulario que se guarda: ahí va una casilla.</li>
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
c["boards"][ARCHIVO] = {"x": 4560, "y": 260, "w": 1440, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 1440 * 4 + 80 * 3
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
