"""Las reglas del 2026-11-03 que valen para todo el lienzo (decisiones 137, 138, 142 a 145 y 148 de la hoja de ruta, que salieron
del traspaso 5 de ArquitecturaBase), en los tableros «Criterio», que mandan sobre todos:
- toda tabla lleva una línea fina entre columnas y los números a la derecha, y cierra abajo (137);
- una lectura no deja rótulos sueltos: lo que pasa en orden, en pasos; los datos, en dos columnas, y dos versiones, lado a lado (138);
- lo elegido se distingue sin dudas: el segmentado rellena la elegida, la tarjeta suma su borde, el desplegable de un filtro la tilda
  y la fila abierta lleva una barra (142);
- un filtro de opciones es un desplegable simple, sin cantidades, y lo que no entra a la vista va en un solo «Filtros», con chips
  (143 y 144);
- las zonas de una pregunta de catálogo arrancan plegadas, con lo configurado en su banda (145).

Los tableros de las etapas lo toman cuando se redibujan con el traspaso 5 (la lista está en el índice de specs del back); los de las
etapas cerradas cambian en la base de la 12. Corre después de `reglas_2_11_1004.py` y antes de `criterio_decisiones.py`. Se puede
volver a correr: cada cambio se salta si ya está.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def ic(trazo, tam=16, grosor="1.75"):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{grosor}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{trazo}</svg>')


LUPA = ic('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>')
ABAJO = ic('<path d="m7 10 5 5 5-5"/>', 14, "2")
DERECHA = ic('<path d="m10 7 5 5-5 5"/>', 14, "2")
TILDE = ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "2.5")
FILTROS = ic('<path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/>')
CRUZ = ic('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 12, "2.25")
LLEGA = ic('<path d="M5 12h13"/><path d="m13 6 6 6-6 6"/>')
ESCUDO = ic('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/>')
HOJA = ic('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>')
GLOBO = ic('<path d="M5 5h14v10H9l-4 4z"/>')
INFO = ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>', 14, "2")


def tilde(si):
    return f'<span class="tl">{TILDE if si else ""}</span>'


# ---------------------------------------------------------------- Criterio · Tablas y listas
TABLAS_CSS = """<style data-r311="tablas">
.tb .th, .tb .tr { column-gap: 0; padding-left: 8px; padding-right: 0; }
.tb .th > *, .tb .tr > * { align-self: stretch; padding: 0 8px; box-sizing: border-box; }
.tb .th > * { display: flex; align-items: center; }
.tb .tr > * { line-height: 40px; }
.tb .tr.d2 > * { line-height: 52px; }
.tb .tr .dos { line-height: 1.35; justify-content: center; }
.tb .tr .der { align-items: center; line-height: normal; }
.tb .tr .num { text-align: left; }
.tb .th > * + *, .tb .tr > * + * { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.tb .th > * + * { box-shadow: inset 1px 0 0 oklch(0.89 0.02 76); }
.r311-tb { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.r311-tb .th, .r311-tb .tr { display: grid; grid-template-columns: 124px minmax(0, 1.4fr) 132px 100px 150px; min-height: 40px; font-size: 13px; }
.r311-tb .th { background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-weight: 600; color: var(--t2); }
.r311-tb .tr { border-bottom: 1px solid var(--borde); }
.r311-tb .tr:nth-child(even) { background: oklch(0.975 0.008 78); }
.r311-tb .th > span, .r311-tb .tr > span { display: flex; align-items: center; padding: 6px 12px; min-width: 0; line-height: 1.35; }
.r311-tb .th > span + span, .r311-tb .tr > span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.r311-tb .th > span + span { box-shadow: inset 1px 0 0 oklch(0.89 0.02 76); }
.r311-tb .num { justify-content: flex-end; text-align: right; font-variant-numeric: tabular-nums; }
.r311-tb .cod { white-space: nowrap; }
.r311-tb .tr.abierta { background: oklch(0.955 0.025 185); box-shadow: inset 3px 0 0 var(--marca); }
.r311-tb .pie { min-height: 44px; display: flex; align-items: center; padding: 0 12px; font-size: 12px; color: var(--t2); }
.r311-lec { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.r311-caja { background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.r311-caja .rot { font-size: 13px; font-weight: 600; color: var(--t2); }
.r311-caja .g { color: var(--t3); }
.r311-pasos { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; }
.r311-pasos li { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 10px; position: relative; padding-bottom: 14px; font-size: 13.5px; }
.r311-pasos li:not(:last-child)::before { content: ""; position: absolute; left: 13.5px; top: 28px; bottom: 0; width: 1px; background: var(--borde2); }
.r311-pasos .pi { width: 28px; height: 28px; border-radius: 50%; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; }
.r311-pasos .tx { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; min-width: 0; }
.r311-pasos .tag { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; margin-left: 6px; border-radius: 6px; background: var(--s3); font-size: 12px; font-weight: 600; color: var(--t2); }
.r311-pasos .msg { border: 1px solid var(--borde); border-radius: 8px; background: var(--s2); padding: 8px 10px; line-height: 1.55; }
.r311-pasos .dato { display: inline-flex; align-items: center; height: 20px; padding: 0 6px; border-radius: 5px; background: var(--marca-t); color: var(--marca-tx); font-size: 12px; font-weight: 600; }
.r311-dg { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 13px; }
.r311-dg .f { display: grid; grid-template-columns: 170px minmax(0, 1fr); border-top: 1px solid var(--borde); }
.r311-dg .f:first-child { border-top: 0; }
.r311-dg .k { background: oklch(0.975 0.008 78); color: var(--t2); padding: 9px 12px; }
.r311-dg .v { padding: 9px 12px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.r311-dg .sub2 { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 4px 12px; border-left: 2px solid var(--borde2); padding: 2px 0 2px 10px; font-size: 12.5px; }
.r311-cmp { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 13px; }
.r311-cmp .h, .r311-cmp .f { display: grid; grid-template-columns: minmax(0, 1.2fr) 120px minmax(0, 1fr) minmax(0, 1fr); }
.r311-cmp .h { background: oklch(0.945 0.018 76); font-weight: 600; color: var(--t2); border-bottom: 1px solid oklch(0.89 0.02 76); }
.r311-cmp .f { border-top: 1px solid var(--borde); }
.r311-cmp .h + .f { border-top: 0; }
.r311-cmp .h > span, .r311-cmp .f > span { padding: 9px 12px; min-width: 0; }
.r311-cmp .h > span + span, .r311-cmp .f > span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.r311-cards { display: flex; flex-direction: column; gap: 8px; }
.r311-card { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 10px; font-size: 13px; }
.r311-card .s { display: block; color: var(--t3); font-size: 12px; }
.r311-card .pt { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--borde2); box-sizing: border-box; }
.r311-card.on { border: 2px solid var(--marca); padding: 9px 11px; background: var(--marca-t); }
.r311-card.on .pt { border: 5px solid var(--marca); }
.r311-card + .r311-sep { margin-top: 4px; }
.r311-pag { font-size: 12px; color: var(--t2); }
</style>
</helmet>"""

COLUMNAS_SECCION = f"""  <section data-reglas="3-11">
    <h2>Columnas, números y la fila abierta</h2>
    <div class="lado">
      <div class="r311-tb">
        <div class="th"><span>N°</span><span>Proveedor</span><span>Proveedor · CUIT</span><span class="num">Cantidad</span><span>Recibida</span></div>
        <div class="tr"><span>REC-000041</span><span>Aceros Rosario</span><span class="cod">30-70988123-4</span><span class="num">1.250</span><span>02/11/2026 10:12</span></div>
        <div class="tr abierta"><span>REC-000040</span><span>Agroinsumos del Litoral S.A.</span><span class="cod">30-71458236-9</span><span class="num">500</span><span>01/11/2026 16:40</span></div>
        <div class="tr"><span>REC-000039</span><span>Frío Sur</span><span class="cod">30-69874512-3</span><span class="num">75,5</span><span>31/10/2026 09:05</span></div>
        <div class="pie">1–3 de 41</div>
      </div>
      <ul class="reglas2">
        <li><strong>Una línea fina entre columnas,</strong> en el encabezado y en el cuerpo, del tono de la que separa las filas. Una columna fija se la lleva al desplazar.</li>
        <li><strong>Los números, a la derecha,</strong> encabezado incluido: cantidades, medidas e importes. Una fecha, un código («REC-000041») o un texto con un número no son columnas de números.</li>
        <li><strong>La tabla cierra abajo</strong> con la línea de su última fila, sobre el paginado.</li>
        <li><strong>Un código no se parte</strong> en sus guiones: si la celda baja de renglón, baja entero.</li>
        <li><strong>La fila abierta</strong>, la de la vista rápida o la que espera una decisión, lleva el tinte de la marca y una barra de 3 px al inicio.</li>
      </ul>
    </div>
  </section>

  <section data-reglas="3-11-lecturas">
    <h2>Lecturas</h2>
    <div class="r311-lec">
      <div class="r311-caja">
        <span class="rot">En pasos · una regla guardada</span>
        <ol class="r311-pasos">
          <li><span class="pi">{LLEGA}</span><span class="tx"><span><span class="g">Cuando</span> <b>se recibe una respuesta</b></span></span></li>
          <li><span class="pi">{FILTROS}</span><span class="tx"><span><span class="g">Si</span> <b>¿Llegó en buen estado?</b> <span class="g">es</span> <b>No</b></span><span><span class="g">y</span> <b>Cantidad recibida</b> <span class="g">desde</span> <b>500</b></span></span></li>
          <li><span class="pi">{ESCUDO}</span><span class="tx"><span>Pedir aprobación<span class="tag">Supervisor</span></span></span></li>
          <li><span class="pi">{HOJA}</span><span class="tx"><span>Armar el PDF</span></span></li>
          <li><span class="pi">{GLOBO}</span><span class="tx"><span>Mandarle un mensaje a quien la cargó<span class="tag">con el PDF</span></span><span class="msg">Llegó con problemas el remito <span class="dato">N° de remito</span> de <span class="dato">Proveedor</span>. Revisá la recepción <span class="dato">Número</span>.</span></span></li>
        </ol>
      </div>
      <div class="r311-caja">
        <span class="rot">En dos columnas · los datos de un registro</span>
        <div class="r311-dg">
          <div class="f"><span class="k">Cliente</span><span class="v">Ferretería Rosales</span></div>
          <div class="f"><span class="k">Fecha de la visita</span><span class="v">26/09/2026</span></div>
          <div class="f"><span class="k">Proveedor</span><span class="v"><span>Aceros Rosario</span><span class="sub2"><span class="g">CUIT</span><span>30-70988123-4</span><span class="g">Plazo de pago</span><span>30 días</span></span></span></div>
          <div class="f"><span class="k">Observaciones</span><span class="v">Pide visita el martes.</span></div>
        </div>
        <span class="rot" style="margin-top: 6px;">Lo elegido de otra página, primero</span>
        <div class="r311-cards">
          <div class="r311-card on"><span class="pt"></span><span><b>Visita a cliente</b><span class="s">Versión 3 · 7 preguntas</span></span></div>
          <div class="r311-card"><span class="pt"></span><span><b>Pedido de materiales</b><span class="s">Versión 4 · 9 preguntas</span></span></div>
          <div class="r311-card"><span class="pt"></span><span><b>Recepción de insumos</b><span class="s">Versión 1 · 8 preguntas</span></span></div>
          <span class="r311-pag">Página 2 de 3</span>
        </div>
      </div>
      <div class="r311-caja" style="grid-column: 1 / -1;">
        <span class="rot">Lado a lado · lo que guardó otra persona y lo tuyo</span>
        <div class="r311-cmp">
          <div class="h"><span>Qué cambió</span><span>Dato</span><span>Guardado actualmente</span><span>Mis cambios</span></div>
          <div class="f"><span>Cantidad recibida</span><span class="g">Obligatoria</span><span>Sí</span><span>No</span></div>
          <div class="f"><span>Unidad · la opción «Kilos»</span><span class="g">Texto</span><span>Kilos</span><span>Kilogramos</span></div>
          <div class="f"><span>Observaciones</span><span class="g">Pregunta</span><span>Texto largo · Opcional</span><span class="g">Quitada</span></div>
          <div class="f"><span>El orden de las preguntas</span><span class="g">Orden</span><span>1. Proveedor · 2. Artículo · 3. Cantidad</span><span>1. <b>Artículo</b> · 2. Proveedor · 3. Cantidad</span></div>
        </div>
      </div>
    </div>
    <ul class="reglas2" style="margin-top: 14px;">
      <li><strong>Ningún rótulo suelto con texto al lado,</strong> ni «Rótulo: valor» corrido en un renglón («Zona: Norte · Rubro: Frío»).</li>
      <li><strong>Lo que pasa en orden, en pasos,</strong> con su ícono en una columna fija: las palabras que unen en gris y los datos en negrita; lo que va aparte de una acción, en una etiqueta, y el mensaje, entero en su recuadro.</li>
      <li><strong>Los datos de un registro, en dos columnas:</strong> el dato sobre arena clara y el valor a su derecha. Lo que depende de un valor, como los campos de la opción elegida, va alineado debajo, con una línea a la izquierda.</li>
      <li><strong>Dos versiones, lado a lado:</strong> el dato una vez y cada versión en su columna, solo lo distinto; lo que una no tiene dice «Quitada» o «—». En el teléfono, el dato arriba y las dos debajo.</li>
      <li><strong>Lo elegido en otra página va primero,</strong> marcado, en la lista para elegir; nunca un renglón «Elegido: …».</li>
    </ul>
  </section>

  <section>
    <h2>Prohibido</h2>"""

TABLAS_PROHIBIDO = ('    <ul class="prohibido">\n      <li>Encabezados en mayúsculas o sin color.</li>',
                    '    <ul class="prohibido">\n      <li>Una tabla sin líneas entre columnas, o los números a la izquierda.</li>\n'
                    '      <li>Un rótulo chico pegado a una frase, o «Rótulo: valor» corrido en un renglón.</li>\n      <li>Encabezados en mayúsculas o sin color.</li>')

# ---------------------------------------------------------------- Criterio · Menús y desplegables
MENUS_CSS = """<style data-r311="menus">
.r311-flt { display: grid; grid-template-columns: 900px minmax(0, 1fr); gap: 32px; align-items: start; min-height: 470px; }
.flt.r311 { height: auto; flex-direction: column; align-items: stretch; gap: 12px; }
.flt.r311 .fila { display: flex; align-items: center; gap: 10px; }
.flt.r311 .pil.fil { color: var(--t1); border-color: var(--borde2); position: relative; }
.flt.r311 .pil .n { min-width: 18px; height: 18px; box-sizing: border-box; border-radius: 9px; background: var(--marca); color: #fff; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px; }
.flt.r311 .chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.flt.r311 .chip { height: 28px; box-sizing: border-box; display: inline-flex; align-items: center; gap: 4px; padding: 0 4px 0 12px; border-radius: 999px; background: var(--s2); border: 1px solid var(--borde); font-size: 13px; color: var(--t1); }
.flt.r311 .chip .x { width: 22px; height: 22px; border-radius: 50%; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.r311 .tl { width: 16px; flex-shrink: 0; display: inline-flex; color: var(--marca-tx); }
.r311 .mn .it.sel { font-weight: 600; background: #fff; color: var(--t1); }
.r311-izq { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.r311-izq > .flt { align-self: stretch; }
.r311-cap { margin-top: 8px; font-size: 13px; font-weight: 600; color: var(--t2); }
.r311-panel { display: grid; margin-left: 320px; grid-template-columns: 220px 300px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); color: var(--t1); font-weight: 400; }
.r311-panel .izq { border-right: 1px solid var(--borde); display: flex; flex-direction: column; }
.r311-panel .izq > span { min-height: 40px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 14px; font-size: 13px; border-top: 1px solid var(--borde); }
.r311-panel .izq > span:first-child { border-top: 0; border-radius: 10px 0 0 0; }
.r311-panel .izq > span.on { background: var(--marca-t); color: var(--marca-tx); box-shadow: inset 3px 0 0 var(--marca); font-weight: 600; }
.r311-panel .izq .pt { width: 6px; height: 6px; border-radius: 50%; background: var(--marca); }
.r311-panel .der { padding: 14px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
.r311-panel .combo { height: 36px; box-sizing: border-box; border: 1px solid var(--marca); box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
.r311-panel .lst2 { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; }
.r311-panel .lst2 > span { min-height: 36px; display: flex; align-items: center; gap: 8px; padding: 0 12px; border-top: 1px solid var(--borde); }
.r311-panel .lst2 > span:first-child { border-top: 0; }
.r311-panel .lst2 .sep2 { min-height: 0; height: 0; padding: 0; border-top: 1px solid var(--borde2); }
.r311-panel .lst2 .mas { color: var(--marca-tx); font-weight: 600; }
.r311-dd { display: flex; flex-direction: column; gap: 18px; }
.r311-dd .flt.r311 { gap: 6px; }
.r311-dd .mn { position: static; width: 260px; }
</style>
</helmet>"""

ESTADOS_FILTRO = [("Todos", False), ("Recibida", False), ("Por aprobar", True), ("Aprobada", False), ("Rechazada", False), ("Anulada", False)]
MENUS_FILTROS = f"""<h2>Filtros</h2>
    <div class="r311-flt" data-reglas="3-11">
      <div class="r311-izq">
        <div class="flt r311">
          <div class="fila">
            <span class="bus">{LUPA} Buscar en textos largos</span>
            <span class="pil con">Empresa: Delta S.A. {ABAJO}</span>
            <span class="pil">Canal {ABAJO}</span>
            <span class="pil">Estado {ABAJO}</span>
            <span class="pil fil">{FILTROS} Filtros <span class="n">2</span></span>
          </div>
          <div class="chips"><span class="chip">Recibida: últimos 7 días <span class="x">{CRUZ}</span></span><span class="chip">Proveedor: Aceros Rosario <span class="x">{CRUZ}</span></span><button type="button" class="cb cb-enl" style="font-size: 13px;">Limpiar todo</button></div>
        </div>
        <span class="r311-cap">«Filtros», abierto</span>
        <span class="r311-panel" role="dialog" aria-label="Filtros">
          <span class="izq"><span>Recibida <span class="pt"></span></span><span>¿Llegó en buen estado?</span><span class="on">Proveedor <span class="pt"></span></span><span>Cantidad recibida</span><span>Cargó</span><span>Versión</span></span>
          <span class="der"><b>Proveedor</b><span class="combo">Aceros Rosario {ABAJO}</span>
            <span class="lst2"><span>{tilde(False)}Todas</span><span class="sep2"></span><span>{tilde(True)}Aceros Rosario</span><span>{tilde(False)}Agroinsumos del Litoral S.A.</span><span>{tilde(False)}Aislantes Norte</span><span>{tilde(False)}Frío Sur</span><span class="mas">Mostrar 16 más</span></span>
          </span>
        </span>
      </div>
      <div class="r311-dd">
        <div class="flt r311">
          <span class="pil abierto" style="align-self: flex-start;">Estado: Por aprobar {ABAJO}</span>
          <span class="mn" role="listbox">{"".join(f'<span class="it{" sel" if si else ""}">{tilde(si)}{n}</span>' for n, si in ESTADOS_FILTRO)}</span>
        </div>
        <ul class="reglas2">
          <li><strong>El buscador y hasta tres filtros a la vista,</strong> sin botón para aplicar.</li>
          <li><strong>Lo demás va en un solo «Filtros»,</strong> con la cantidad de aplicados. Se despliega como «Columnas»: a la izquierda lo que se filtra, a la derecha lo que se elige, y cada cambio se aplica enseguida.</li>
          <li><strong>Un filtro de opciones es un desplegable simple:</strong> «Todas» o la elegida, una opción por renglón, la elegida con su tilde. Sin cantidades y ninguna apagada; si son muchas, se busca escribiendo. Se elige una.</li>
          <li><strong>Lo aplicado va en chips,</strong> cada uno con su ×, y «Limpiar todo». Sin «18 respuestas»: el total va al pie.</li>
          <li><strong>Un segmentado conserva su número,</strong> como «Activos (8) · Dados de baja (2)».</li>
        </ul>
      </div>
    </div>
  </section>"""

MENUS_FILAS = [
    ("<span>Desplegables en la caja de filtros, con la cantidad de cada opción. Lo elegido va en petróleo, con «Limpiar filtros».</span><span>El botón «Filtros» de la barra abre una hoja. Con algo elegido, el botón lleva un punto.</span>",
     "<span>El buscador y hasta tres desplegables, sin cantidades; lo demás, en un solo «Filtros». Lo aplicado va en chips, con «Limpiar todo».</span><span>El botón «Filtros» de la barra abre «Filtros» a pantalla completa. Con algo aplicado, lleva un punto.</span>"),
    ("<span>Un control segmentado arriba de la lista.</span><span>Un control segmentado debajo de la barra.</span>",
     "<span>Un control segmentado arriba de la lista, con la elegida rellena y la cantidad de cada vista.</span><span>Un control segmentado debajo de la barra.</span>"),
    (" y Uso del asistente (Por día | Por persona).</span>", ", Uso del asistente (Por día | Por persona) y la planilla de un formulario con aprobación (Por aprobar | Todas).</span>"),
]
MENUS_PROHIBIDO = ('    <ul class="prohibido">\n      <li>Submenús que se abren al costado de otro menú.</li>',
                   '    <ul class="prohibido">\n      <li>La cantidad en las opciones de un desplegable de filtro, u opciones apagadas porque no traen nada.</li>\n'
                   '      <li>Un panel de filtros con «Aplicar» o «Ver N resultados».</li>\n      <li>Submenús que se abren al costado de otro menú.</li>')

# ---------------------------------------------------------------- Criterio · Formularios y campos
FORM_CSS = """<style data-r311="formularios">
.seg { background: #fff; border: 1px solid var(--borde2); padding: 2px; }
.seg span.on { background: var(--marca); color: #fff; box-shadow: none; }
.r311-cards2 { display: flex; flex-direction: column; gap: 8px; }
.r311-cards2 .card { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 10px; font-size: 13px; background: #fff; }
.r311-cards2 .pt { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--borde2); box-sizing: border-box; }
.r311-cards2 .card.on { border: 2px solid var(--marca); padding: 9px 11px; background: var(--marca-t); }
.r311-cards2 .card.on .pt { border: 5px solid var(--marca); }
.lst .op.r311t { justify-content: flex-start; }
.lst .op.r311t.sel { font-weight: 600; }
.lst .op .tl { width: 16px; display: inline-flex; color: var(--marca-tx); }
.r311-lado { display: grid; grid-template-columns: 860px minmax(0, 1fr); gap: 32px; align-items: start; }
.r311-q { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; font-size: 13px; }
.r311-q .qcab { display: flex; align-items: baseline; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--borde); }
.r311-q .qcab .s { color: var(--t3); }
.r311-q .zona { display: grid; grid-template-columns: 18px auto minmax(0, 1fr) auto; gap: 8px; align-items: center; min-height: 44px; padding: 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); }
.r311-q .zona .res { color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.r311-q .zona .i { color: var(--t3); display: inline-flex; }
.r311-q .zona .err { color: oklch(0.45 0.17 25); font-weight: 600; }
.r311-q .cuerpo { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.r311-q .cuerpo .ctl { border-color: oklch(0.57 0.2 25); }
.r311-q .cuerpo .mal { color: oklch(0.45 0.17 25); font-size: 12.5px; }
</style>
</helmet>"""

FORM_SECCIONES = f"""  <section data-reglas="3-11">
    <h2>Lo elegido, sin dudas</h2>
    <div class="g3c">
      <div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">¿Llegó en buen estado? <span class="req">*</span></span><div class="seg"><span class="on">Sí</span><span>No</span></div></div></div><strong>Segmentado</strong><p>La elegida, rellena con la marca y la letra blanca; las otras, blancas. En el teléfono, cada opción mide 44 × 44.</p></div>
      <div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">De dónde salen las opciones</span><div class="r311-cards2"><span class="card on"><span class="pt"></span><b>Escritas a mano</b></span><span class="card"><span class="pt"></span><b>De los miembros</b></span><span class="card"><span class="pt"></span><b>De los contactos de WhatsApp</b></span></div></div></div><strong>Tarjetas de opción</strong><p>La elegida suma un borde de 2 px y el tinte de la marca, además del punto, sin moverse.</p></div>
      <div class="ctrl"><div class="dib"><div class="cmp"><span class="rot">Zona</span><div class="ctl foco">Norte {ABAJO}</div></div><div class="lst"><div class="op r311t">{tilde(False)}Todas</div><div class="op r311t sel">{tilde(True)}Norte</div><div class="op r311t">{tilde(False)}Centro</div><div class="op r311t">{tilde(False)}Sur</div></div></div><strong>Desplegable de un filtro</strong><p>La elegida lleva la tilde a la izquierda, sin la cantidad ni opciones apagadas.</p></div>
    </div>
    <ul class="reglas2" style="margin-top: 14px;">
      <li><strong>Lo elegido nunca es solo un tinte:</strong> lleva un relleno, una tilde, un punto, un subrayado o una barra, y se distingue de lo demás en cualquier paleta.</li>
      <li><strong>No se arman botones sueltos</strong> que se rellenan para hacer de segmentado.</li>
    </ul>
  </section>

  <section data-reglas="3-11-zonas">
    <h2>Zonas que se pliegan</h2>
    <div class="r311-lado">
      <div class="r311-q">
        <div class="qcab"><b>3 · Proveedor</b><span class="s">De un catálogo · Proveedores · Obligatoria</span></div>
        <div class="zona"><span class="i">{DERECHA}</span><b>Qué opciones ve cada persona</b><span class="res">Rubro: Agroquímicos · Zona según quien lo recibe</span><span></span></div>
        <div class="zona"><span class="i">{ABAJO}</span><b>En WhatsApp</b><span class="i">{INFO}</span><span></span></div>
        <div class="cuerpo"><span class="rot">Título</span><div class="ctl">Nombre · Rubro</div><span class="mal">Hasta 30 caracteres; «Agroinsumos del Litoral S.A. · Herbicidas» tiene 41.</span></div>
      </div>
      <ul class="reglas2">
        <li><strong>En una pregunta de catálogo,</strong> «Qué opciones ve cada persona» y «En WhatsApp» arrancan plegadas cada vez que se abre la pregunta.</li>
        <li><strong>La banda dice lo configurado,</strong> en una línea: los filtros en orden, «sin valor» si falta uno, «Sin filtros» si no hay.</li>
        <li><strong>La que tiene un error o un aviso se abre sola;</strong> se puede volver a plegar, y solo un problema nuevo la abre otra vez.</li>
        <li><strong>Es una excepción</strong> a «sin paneles plegables», como las zonas de la carga y «Respuesta» y «Actividad» del detalle.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Prohibido</h2>"""

FORM_CAMBIOS = [
    ("<strong>Segmentado</strong><p>Dos o tres opciones fijas que cambian lo que se pide abajo.</p>",
     "<strong>Segmentado</strong><p>Dos o tres opciones fijas que cambian lo que se pide abajo. La elegida va rellena.</p>"),
    ('    <ul class="prohibido">\n      <li>Rótulos adentro del campo en vez de arriba.</li>',
     '    <ul class="prohibido">\n      <li>Lo elegido marcado solo con un tinte.</li>\n      <li>Rótulos adentro del campo en vez de arriba.</li>'),
]


def ultima_prohibido(t, seccion_nueva):
    """Pone las secciones nuevas antes de la última «Prohibido» del tablero."""
    viejo = "  <section>\n    <h2>Prohibido</h2>"
    i = t.rfind(viejo)
    assert i >= 0
    return t[:i] + seccion_nueva + t[i + len(viejo):]


def css(t, marca, bloque):
    return t if f'data-r311="{marca}"' in t else t.replace("</helmet>", bloque, 1)


def cambiar(t, viejo, nuevo):
    if nuevo in t:
        return t
    assert t.count(viejo) == 1, viejo[:80]
    return t.replace(viejo, nuevo)


if __name__ == "__main__":
    ruta = PROJ / "Criterio-Tablas.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if 'data-reglas="3-11"' not in t:
        t = ultima_prohibido(t, COLUMNAS_SECCION)
    t = cambiar(t, *TABLAS_PROHIBIDO)
    ruta.write_text(css(t, "tablas", TABLAS_CSS), encoding="utf-8")

    ruta = PROJ / "Criterio-Menus.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if 'data-reglas="3-11"' not in t:
        m = re.search(r"<h2>Filtros</h2>.*?\n  </section>", t, flags=re.S)
        t = t[:m.start()] + MENUS_FILTROS + t[m.end():]
    for viejo, nuevo in MENUS_FILAS:
        t = cambiar(t, viejo, nuevo)
    t = cambiar(t, *MENUS_PROHIBIDO)
    ruta.write_text(css(t, "menus", MENUS_CSS), encoding="utf-8")

    ruta = PROJ / "Criterio-Formularios.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if 'data-reglas="3-11"' not in t:
        t = ultima_prohibido(t, FORM_SECCIONES)
    for viejo, nuevo in FORM_CAMBIOS:
        t = cambiar(t, viejo, nuevo)
    ruta.write_text(css(t, "formularios", FORM_CSS), encoding="utf-8")
    print("listo")
