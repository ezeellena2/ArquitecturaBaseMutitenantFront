"""Las reglas del traspaso 10 (decisiones 160 a 164 y 173 a 175 de la hoja de ruta, del 2026-11-07) en los tableros «Criterio»,
que mandan sobre todos:
- Tablas: la primera carga con el encabezado y el aro en el alto de ocho filas, sin filas esqueleto (160), y el texto largo entero,
  que baja de renglón (174);
- Marco: la página que espera su ruta o sus permisos (ES2) y que no parezca plantilla (173); sale «campos de su medida»;
- Formularios: un ajuste y su espera (ES3), con los campos en columnas iguales (163), y ninguna elección descartada en silencio (162);
- Diálogos: decidir a propósito, con el rojo lleno solo para lo que destruye (161);
- Avisos: el estado, una vez (175), con la publicación, un guardado por revisar, una propuesta del asistente y la baja;
- Menús: el activo con una barra y los filtros con el radio de un control (173); sale la pestaña «Inglés» (35);
- Botones: un solo principal, sólido (173), y las altas con «Agregar …».

`Criterio-Decisiones` lo anota en su sección «Traspaso 10 · 07/11» (`criterio_decisiones.py`). Las formas de las piezas (la marca,
el avatar, las sombras) las pone `traspaso10_piezas_1004.py`, que corre al final de todo sobre todos los tableros, también estos.

Corre después de `reglas_3_11_1004.py` y antes de `criterio_decisiones.py`. Se puede volver a correr: cada cambio se salta si ya está.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-reglas="7-11"'


def cambiar(t, viejo, nuevo):
    """Cambia todas las apariciones; si ya está el texto nuevo, no hace nada."""
    if nuevo in t:
        return t
    assert viejo in t, viejo[:90]
    return t.replace(viejo, nuevo)


SECCIONES = re.compile(r'  <section data-reglas="7-11[^"]*">.*?\n  </section>\n\n', re.S)


def antes_de_prohibido(t, secciones):
    """Pone las secciones nuevas antes de la última «Prohibido» del tablero; las de una corrida anterior se rehacen."""
    t = SECCIONES.sub("", t)
    viejo = "  <section>\n    <h2>Prohibido</h2>"
    i = t.rfind(viejo)
    assert i >= 0
    return t[:i] + secciones + t[i:]


def prohibir(t, items):
    """Suma renglones al principio de la última lista «Prohibido»; los de una corrida anterior se rehacen."""
    t = re.sub(r"\n      <li data-r711>.*?</li>", "", t)
    for x in items:
        t = t.replace(f"\n      <li>{x}</li>", "")  # los de la primera corrida, sin marca
    i = t.rfind("<h2>Prohibido</h2>")
    j = t.index('<ul class="prohibido">', i) + len('<ul class="prohibido">')
    return t[:j] + "".join(f"\n      <li data-r711>{x}</li>" for x in items) + t[j:]


def css(t, nombre, bloque):
    marca = f'data-r711="{nombre}"'
    t = re.sub(rf"<style {re.escape(marca)}>.*?</style>\n", "", t, flags=re.S)
    return t.replace("</helmet>", f"<style {marca}>{bloque}</style>\n</helmet>", 1)


ARO_CSS = """
.r711-aro { width: 22px; height: 22px; box-sizing: border-box; border-radius: 50%; border: 2.5px solid oklch(0.89 0.031 95); border-top-color: var(--marca); }
.r711-blq { display: block; height: 12px; border-radius: 4px; background: oklch(0.24 0.012 60 / 0.08); }
"""

# ---------------------------------------------------------------------------------------------------------------- Tablas
TABLAS_CSS = ARO_CSS + """
.r711-carga { height: 160px; display: flex !important; align-items: center; justify-content: center; padding: 0 !important; }
.r711-lg { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 28px; align-items: start; }
.r711-tb { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.r711-tb .th, .r711-tb .tr { display: grid; grid-template-columns: 112px 150px 132px minmax(0, 1fr); font-size: 13px; }
.r711-tb .th { min-height: 40px; background: oklch(0.945 0.027 95); border-bottom: 1px solid oklch(0.89 0.031 95); font-weight: 600; color: var(--t2); }
.r711-tb .tr { min-height: 40px; border-bottom: 1px solid var(--borde); }
.r711-tb .tr:last-child { border-bottom: 0; }
.r711-tb .tr:nth-child(odd) { background: oklch(0.968 0.015 95); }
.r711-tb .th > span, .r711-tb .tr > span { display: flex; align-items: center; padding: 9px 12px; line-height: 1.4; min-width: 0; overflow-wrap: break-word; }
.r711-tb .th > span + span, .r711-tb .tr > span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.013 95 / 0.8); }
.r711-tb .th > span + span { box-shadow: inset 1px 0 0 oklch(0.89 0.031 95); }
.r711-tb .cod { white-space: nowrap; }
"""
TABLAS_SECCION = """  <section data-reglas="7-11">
    <h2>El texto largo, entero</h2>
    <div class="r711-lg">
      <div class="r711-tb">
        <div class="th"><span>N°</span><span>Cliente</span><span>CUIT</span><span>Observaciones</span></div>
        <div class="tr"><span>VIS-000126</span><span>Ferretería Rosales</span><span class="cod">30-71458236-9</span><span>Cerramos el pedido de octubre; la entrega queda para el lunes 9, después de las 14.</span></div>
        <div class="tr"><span>VIS-000125</span><span>Distribuidora del Litoral Norte S.A.</span><span class="cod">30-70988123-4</span><span>Pide visita el martes.</span></div>
        <div class="tr"><span>VIS-000124</span><span>Obra Centro</span><span class="cod">30-69874512-3</span><span>—</span></div>
      </div>
      <ul class="reglas2">
        <li><strong>Un texto largo baja de renglón</strong> y la fila crece: se ve entero, sin «…» ni tooltip. Vale en las celdas, en las filas del teléfono y en las opciones del menú (174).</li>
        <li><strong>Un dato por celda</strong> sigue valiendo: lo que baja de renglón es el mismo dato.</li>
        <li><strong>Un código con guiones no se parte</strong> (<span style="white-space: nowrap;">«30-71458236-9»</span>): si no entra, baja entero. Una zona horaria se corta solo en sus barras.</li>
      </ul>
    </div>
  </section>

"""
TABLAS_CAMBIOS = [
    ('<div class="mini"><div class="th"><span>Usuario</span><span>Estado</span></div><div class="cuerpo"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span><span style="width: 55%;"></span></div></div><div class="rot2">Cargando</div></div>',
     '<div class="mini"><div class="th"><span>Usuario</span><span>Estado</span></div><div class="cuerpo r711-carga" role="status" aria-label="Cargando"><span class="r711-aro"></span></div><div class="rot2">La primera carga · el encabezado y el aro en el alto de ocho filas</div></div>'),
    ("La primera carga conserva su esqueleto.</li>",
     "La primera carga dibuja el encabezado y el aro en el alto de ocho filas, sin filas esqueleto: al llegar las filas, la tabla no cambia de alto (160).</li>"),
    ("<li><strong>Un dato por celda, en un renglón.</strong> Lo que lo aclara va en su propia columna si la persona lo necesita (Correo, Vencimiento), o no va. Sin dato, una sola raya.</li>",
     "<li><strong>Un dato por celda.</strong> Lo que lo aclara va en su propia columna si la persona lo necesita (Correo, Vencimiento), o no va. Sin dato, una sola raya. Un texto largo baja de renglón, sin «…» (174).</li>"),
    ("<span>40 px</span><span>Un dato por celda, en un renglón, con letra de 13.",
     "<span>40 px como mínimo</span><span>Un dato por celda, con letra de 13; si no entra, baja de renglón y la fila crece."),
]
TABLAS_PROHIBIDO = ["Cortar un texto con «…»: baja de renglón y la fila crece (174).",
                    "Filas esqueleto en la primera carga: van el encabezado y el aro en el alto de ocho filas (160)."]

# ---------------------------------------------------------------------------------------------------------------- Marco
MARCO_CSS = ARO_CSS + """
.r711-dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; align-items: start; }
.r711-pag { background: var(--fondo); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.r711-pag .bd { height: 64px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 0 24px; background: #fff; border-bottom: 1px solid var(--borde); }
.r711-pag .cu { display: flex; flex-direction: column; gap: 14px; padding: 24px; height: 150px; box-sizing: border-box; }
.r711-pag .cu .r711-blq { height: 14px; }
.r711-lista { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 28px; font-size: 13.5px; line-height: 1.5; }
.r711-lista li { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 12px; padding: 10px 0; border-top: 1px solid var(--borde); }
.r711-lista li b { font-weight: 600; }
.r711-lista .no { color: var(--t3); text-decoration: line-through; }
"""
MARCO_SECCIONES = """  <section data-reglas="7-11">
    <h2>Que no parezca plantilla</h2>
    <ul class="r711-lista">
      <li><b>La marca</b><span>El nombre, en negrita, sin cuadrado ni degradé. <span class="no">El logo en un cuadrado</span></span></li>
      <li><b>La banda</b><span>Título, resumen y acciones, sin ícono de la sección. <span class="no">El ícono en su cuadradito</span></span></li>
      <li><b>Tu inicial</b><span>Un cuadrado chico, del color de la marca, en la barra y en el pie del menú. <span class="no">El círculo con degradé</span></span></li>
      <li><b>El activo del menú</b><span>Una barra de 2 px de la marca y la letra en negrita. <span class="no">La pastilla blanca</span></span></li>
      <li><b>Filtros y etiquetas</b><span>Con el radio de un control; un contador, como texto. <span class="no">Las pastillas</span></span></li>
      <li><b>Sombras</b><span>Solo en menús, desplegables y tooltips: lo demás va con su borde. <span class="no">Tarjetas, botones y diálogos con sombra</span></span></li>
    </ul>
    <ul class="reglas2" style="margin-top: 14px;">
      <li><strong>Quedan la paleta Pradera y la densidad:</strong> el marco paja, el verde pasto, las cajas con encabezado arena y las medidas compactas (173).</li>
      <li><strong>El principal es sólido,</strong> del color de la marca, sin degradé ni sombra. Ver «Botones».</li>
    </ul>
  </section>

  <section data-reglas="7-11-carga">
    <h2>Mientras carga una página</h2>
    <div class="r711-dos">
      <div class="r711-pag" role="status" aria-label="Cargando">
        <div class="bd"><span class="r711-blq" style="width: 180px; height: 16px;"></span><span class="r711-blq" style="width: 260px; height: 10px;"></span></div>
        <div class="cu"><span class="r711-blq" style="width: 80%;"></span><span class="r711-blq" style="width: 65%;"></span><span class="r711-blq" style="width: 72%;"></span></div>
      </div>
      <ul class="reglas2">
        <li><strong>La banda ya está,</strong> con su alto y su borde: el título es un bloque de carga y el cuerpo, tres barras (160). Así la pantalla no salta cuando llegan la ruta o los permisos.</li>
        <li><strong>Un listado</strong> dibuja su encabezado y el aro en el alto de ocho filas; <strong>un ajuste,</strong> sus zonas. Ver «Tablas y listas» y «Formularios y campos».</li>
        <li>No cambian el aro de un botón que trabaja, una tabla que vuelve a leer, el menú ni los chats.</li>
      </ul>
    </div>
  </section>

"""
MARCO_CAMBIOS = [
    ("con tu inicial en un círculo con el degradé de la marca, igual que en el pie del menú y en el teléfono.",
     "con tu inicial en un cuadrado chico del color de la marca, igual que en el pie del menú y en el teléfono."),
    ("<li><strong>3 · Banda de la página:</strong> blanca. Ícono, título, resumen y las acciones de la página.</li>",
     "<li><strong>3 · Banda de la página:</strong> blanca. Título, resumen y las acciones de la página, sin ícono.</li>"),
    ("<li><strong>En una ficha,</strong> el ‹ para volver va en lugar del ícono.</li>",
     "<li><strong>En una pantalla interna,</strong> el ‹ para volver va antes del título.</li>"),
    ("Secciones con título, campos de su medida y listas en su caja.",
     "Secciones con título, campos en columnas iguales y listas en su caja."),
]
MARCO_PROHIBIDO = ["Las formas de plantilla: el logo en un cuadrado o con degradé, el ícono de la sección en la banda, el avatar redondo, el activo del menú en una pastilla y las sombras fuera de menús, desplegables y tooltips (173).",
                   "Una página que espera en blanco o con un aro suelto: va su banda con el título como bloque de carga (160)."]

# ---------------------------------------------------------------------------------------------------------------- Formularios
FORM_CSS = ARO_CSS + """
.r711-dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; align-items: start; }
.r711-aj { background: var(--fondo); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.r711-aj .bd { height: 56px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 20px; background: #fff; border-bottom: 1px solid var(--borde); font-size: 16px; font-weight: 700; }
.r711-aj .cu { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
.r711-aj .zn { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.r711-aj .zn .t { height: 40px; display: flex; align-items: center; padding: 0 16px; background: oklch(0.945 0.027 95); border-bottom: 1px solid oklch(0.89 0.031 95); font-size: 13px; font-weight: 600; }
.r711-aj .zn .c { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; padding: 16px 20px 20px; }
.r711-aj .cmp { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.r711-aj .cmp .r { font-weight: 600; color: var(--t2); }
.r711-aj .cmp .v { height: 36px; box-sizing: border-box; display: flex; align-items: center; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; }
.r711-aj.carga .zn .t .r711-blq { width: 120px; }
.r711-aj.carga .cmp .r711-blq.b-r { width: 90px; height: 10px; }
.r711-aj.carga .cmp .r711-blq.b-v { height: 36px; border-radius: 8px; }
.r711-cf { width: 420px; background: #fff; border: 1px solid var(--borde2); border-radius: 12px; overflow: hidden; }
.r711-cf .t { padding: 16px 20px 6px; font-size: 15px; font-weight: 600; }
.r711-cf .x { padding: 4px 20px 18px; font-size: 13.5px; color: var(--t2); }
.r711-cf .p { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--borde); }
.r711-cf .foco { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--marca); }
"""
FORM_SECCIONES = """  <section data-reglas="7-11">
    <h2>Un ajuste</h2>
    <div class="r711-dos">
      <div class="r711-aj">
        <div class="bd"><span>Configuración</span><button type="button" class="cb cb-pri" disabled style="opacity: 0.45;">Guardar cambios</button></div>
        <div class="cu">
          <div class="zn"><div class="t">Datos de la organización</div><div class="c"><div class="cmp"><span class="r">Nombre</span><span class="v">Grupo Delta</span></div><div class="cmp"><span class="r">Moneda predeterminada</span><span class="v">Peso argentino (ARS)</span></div></div></div>
          <div class="zn"><div class="t">Correo</div><div class="c"><div class="cmp"><span class="r">Correo de ventas</span><span class="v">ventas@delta.ejemplo.com</span></div><div class="cmp"><span class="r">Zona horaria</span><span class="v">Buenos Aires (GMT−3)</span></div></div></div>
        </div>
      </div>
      <div class="r711-aj carga" role="status" aria-label="Cargando">
        <div class="bd"><span class="r711-blq" style="width: 150px; height: 16px;"></span></div>
        <div class="cu">
          <div class="zn"><div class="t"><span class="r711-blq"></span></div><div class="c"><div class="cmp"><span class="r711-blq b-r"></span><span class="r711-blq b-v"></span></div><div class="cmp"><span class="r711-blq b-r"></span><span class="r711-blq b-v"></span></div></div></div>
          <div class="zn"><div class="t"><span class="r711-blq"></span></div><div class="c"><div class="cmp"><span class="r711-blq b-r"></span><span class="r711-blq b-v"></span></div><div class="cmp"><span class="r711-blq b-r"></span><span class="r711-blq b-v"></span></div></div></div>
        </div>
      </div>
    </div>
    <ul class="reglas2" style="margin-top: 14px;">
      <li><strong>Un ajuste se arma como Configuración:</strong> zonas a todo el ancho, una debajo de la otra, y «Guardar cambios» en la banda, apagado sin cambios.</li>
      <li><strong>Sus campos van en columnas iguales,</strong> como en cualquier caja, no del ancho de lo que llevan (163).</li>
      <li><strong>Mientras carga,</strong> dibuja sus zonas, con el título, el rótulo y el control de cada campo, sin los botones de la banda (160).</li>
    </ul>
  </section>

  <section data-reglas="7-11-silencio">
    <h2>Ninguna elección se descarta en silencio</h2>
    <div class="r711-dos">
      <div class="r711-cf" role="dialog" aria-label="¿Cambiar a «Número»?">
        <div class="t">¿Cambiar a «Número»?</div>
        <div class="x">Se quitan las 4 opciones de «Motivo». El nombre y la ayuda quedan.</div>
        <div class="p"><button type="button" class="cb cb-sec foco">Cancelar</button><button type="button" class="cb cb-pri">Cambiar</button></div>
      </div>
      <ul class="reglas2">
        <li><strong>Cambiar un tipo, una acción o una opción</strong> conserva lo escrito que sigue sirviendo: el nombre, la ayuda, el mensaje (162).</li>
        <li><strong>Lo que se pierde se avisa antes,</strong> con lo que se va. Sin nada que perder, cambia sin preguntar.</li>
      </ul>
    </div>
  </section>

"""
FORM_CAMBIOS = [
    ("<b>Sumar empresa</b>", "<b>Agregar empresa</b>"),
    ("No pudimos sumar la empresa.", "No pudimos agregar la empresa."),
    ('<button type="button" class="cb cb-pri">Sumar</button>', '<button type="button" class="cb cb-pri">Agregar</button>'),
]
FORM_PROHIBIDO = ["Perder lo escrito al cambiar un tipo, una acción o una opción, sin avisar (162).",
                  "Los campos de un ajuste del ancho de lo que llevan: van en columnas iguales (163)."]

# ---------------------------------------------------------------------------------------------------------------- Diálogos
DIALOGOS_CSS = """
.r711-dos { display: grid; grid-template-columns: 420px minmax(0, 1fr); gap: 28px; align-items: start; }
.r711-cf { width: 420px; background: #fff; border: 1px solid var(--borde2); border-radius: 12px; overflow: hidden; }
.r711-cf .t { padding: 16px 20px 6px; font-size: 15px; font-weight: 600; }
.r711-cf .x { padding: 4px 20px 18px; font-size: 13.5px; color: var(--t2); line-height: 1.5; }
.r711-cf .p { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--borde); }
.r711-cf .foco { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--marca); }
.r711-pie { margin-top: 8px; font-size: 12.5px; color: var(--t3); }
"""
DIALOGOS_SECCION = """  <section data-reglas="7-11">
    <h2>Decidir a propósito</h2>
    <div class="r711-dos">
      <div>
        <div class="r711-cf" role="alertdialog" aria-label="¿Aprobar VIS-000003?">
          <div class="t">¿Aprobar VIS-000003?</div>
          <div class="x">Le avisamos a Paula Méndez y no se puede deshacer.</div>
          <div class="p"><button type="button" class="cb cb-sec foco">Cancelar</button><button type="button" class="cb cb-pri">Aprobar</button></div>
        </div>
        <div class="r711-pie">Confirmación · 420 px · el foco arranca en «Cancelar»</div>
      </div>
      <ul class="reglas2">
        <li><strong>Lo que no se deshace y dispara avisos,</strong> como aprobar, pide confirmar con el número en el título: «¿Aprobar VIS-000003?» (161).</li>
        <li><strong>Va con la principal,</strong> no en rojo: el rojo lleno queda para lo que destruye, como borrar, quitar o revocar.</li>
        <li><strong>El foco arranca en «Cancelar»,</strong> para que un Enter apurado no apruebe lo que no se leyó.</li>
      </ul>
    </div>
  </section>

"""
DIALOGOS_CAMBIOS = [
    ("<li><strong>El botón repite la acción</strong>, en rojo relleno. Es el único lugar con rojo relleno.</li>",
     "<li><strong>El botón repite la acción</strong>, en rojo relleno si destruye: es el único lugar con rojo relleno. Si no destruye, como aprobar, va la principal (161).</li>"),
    ("<span>Sombra suave. Atrás, la pantalla oscurecida, sin difuminar.</span>",
     "<span>Borde fino y sin sombra (173). Atrás, la pantalla oscurecida, sin difuminar.</span>"),
]
DIALOGOS_PROHIBIDO = ["Rojo relleno en lo que no destruye, como aprobar: va la principal, con el foco en «Cancelar» (161).",
                      "Sombra en el diálogo: lo separan su borde y la pantalla oscurecida (173)."]

# ---------------------------------------------------------------------------------------------------------------- Avisos
AVISOS_CSS = """
.r711-casos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 28px; }
.r711-caso { display: flex; flex-direction: column; gap: 8px; }
.r711-bd { background: #fff; border: 1px solid var(--borde); border-radius: 12px; }
.r711-bd .b { min-height: 64px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 18px; border-bottom: 1px solid var(--borde); }
.r711-bd .b h3 { margin: 0; font-size: 16px; font-weight: 700; }
.r711-bd .b .s { display: inline-flex; align-items: center; gap: 6px; margin-top: 2px; font-size: 13px; color: var(--t2); }
.r711-bd .b .s::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--punto, oklch(0.72 0.15 70)); }
.r711-bd .b .s.ok { --punto: oklch(0.6 0.13 155); }
.r711-bd .b .s.pend { --punto: oklch(0.62 0.12 240); }
.r711-bd .b .s.off { --punto: oklch(0.75 0.01 78); }
.r711-bd .b .ac { display: flex; gap: 8px; flex-shrink: 0; }
.r711-bd .cu { padding: 12px 18px; font-size: 13px; color: var(--t2); min-height: 20px; }
.r711-bd .cu .nada { color: var(--t3); }
.r711-caso .r { font-size: 12.5px; color: var(--t3); }
.r711-tip { position: relative; display: inline-flex; }
.r711-tip .tooltip { position: absolute; z-index: 2; right: 0; bottom: calc(100% + 8px); width: 240px; white-space: normal; text-align: left; font-weight: 400; padding: 8px 10px; border-radius: 8px; background: oklch(0.27 0.012 60); color: #fff; font-size: 12px; line-height: 1.4; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); }
"""
AVISOS_SECCION = """  <section data-reglas="7-11">
    <h2>El estado, una vez</h2>
    <div class="r711-casos">
      <div class="r711-caso">
        <div class="r711-bd"><div class="b"><div><h3>Visita a cliente</h3><span class="s">Sin confirmar · versión 4</span></div><div class="ac"><button type="button" class="cb cb-sec">Consultar publicación</button><span class="r711-tip"><button type="button" class="cb cb-pri" disabled style="opacity: 0.45;">Publicar en WhatsApp</button><span class="tooltip" role="tooltip">Esperá a que WhatsApp confirme la versión 4.</span></span></div></div><div class="cu"><span class="nada">Nada debajo: ni zona ni pasos.</span></div></div>
        <span class="r">La publicación · «Consultar publicación» y «Repetir el mismo intento» solo cuando hacen falta; con «Necesita revisión», «Salió» y «No salió»</span>
      </div>
      <div class="r711-caso">
        <div class="r711-bd"><div class="b"><div><h3>Información del negocio</h3><span class="s">Guardado por revisar</span></div><div class="ac"><button type="button" class="cb cb-sec">Revisar guardado</button><button type="button" class="cb cb-sec">Reintentar el mismo guardado</button></div></div><div class="cu"><span class="nada">Nada debajo: por qué «Guardar» está apagado va en su tooltip.</span></div></div>
        <span class="r">Un guardado por revisar · la acción que lo destraba, en la banda</span>
      </div>
      <div class="r711-caso">
        <div class="r711-bd"><div class="b"><div><h3>Motivos de visita</h3><span class="s pend">Propuesta del asistente</span></div><div class="ac"><button type="button" class="cb cb-sec">Descartar propuesta</button><button type="button" class="cb cb-pri">Aprobar y activar</button></div></div><div class="cu">La pidió Ana Gómez por WhatsApp el 05/11/2026 10:20.</div></div>
        <span class="r">Una propuesta del asistente · debajo, solo lo que la etiqueta no dice: quién y cuándo</span>
      </div>
      <div class="r711-caso">
        <div class="r711-bd"><div class="b"><div><h3>Control de vehículo</h3><span class="s off">De baja · versión 3</span></div><div class="ac"><button type="button" class="cb cb-pri">Reactivar</button></div></div><div class="cu">Lo dio de baja Ana Gómez el 05/11/2026 10:20.</div></div>
        <span class="r">La baja · una frase; al reactivar, la etiqueta dice el estado de la publicación</span>
      </div>
    </div>
    <ul class="reglas2" style="margin-top: 14px;">
      <li><strong>Lo que dice el encabezado no se repite debajo,</strong> ni en una zona ni en una frase: debajo va solo lo que la etiqueta no dice, como quién y cuándo (175).</li>
      <li><strong>La acción que destraba el estado va en la banda,</strong> solo cuando hace falta, y el porqué de un botón apagado, en su tooltip.</li>
      <li><strong>En la publicación no hay pasos,</strong> ni detrás de la ⓘ: la etiqueta dice el estado, y lo rechazado sigue marcado en su pregunta, sin una zona «Problemas».</li>
    </ul>
  </section>

"""
AVISOS_CAMBIOS = [
    ("<li>El mismo estado en dos lugares: arriba y otra vez en la fila.</li>",
     "<li>El mismo estado en dos lugares: arriba y otra vez en la fila, o debajo del encabezado, en una zona o una frase que lo repite (175).</li>"),
]
AVISOS_PROHIBIDO = ["Los pasos de un estado detrás de la ⓘ, o una zona que cuenta lo que ya dice la etiqueta (175)."]

# ---------------------------------------------------------------------------------------------------------------- Menús
MENUS_CAMBIOS = [
    ("<li><strong>El activo va en blanco</strong> con letra verde.</li>",
     "<li><strong>El activo lleva una barra de 2 px</strong> de la marca a la izquierda y la letra verde, en negrita; sin pastilla blanca ni sombra (173).</li>"),
    ("Preguntas, Inglés, Publicación", "Preguntas, Publicación"),
    ("<li><strong>Un segmentado conserva su número,</strong> como «Activos (8) · Dados de baja (2)».</li>",
     "<li><strong>Un segmentado conserva su número,</strong> como «Activos (8) · Dados de baja (2)».</li>\n          <li><strong>Los filtros y sus chips, con el radio de un control,</strong> como los campos: nunca en pastilla. Un contador va como texto (173).</li>"),
    ("<span>Blanco, con borde arena, sobre el borde del menú lateral.",
     "<span>Blanco, con borde arena y sin sombra, sobre el borde del menú lateral."),
]
MENUS_PROHIBIDO = ["El activo del menú en una pastilla blanca o con sombra; filtros, chips o contadores en pastilla (173)."]

# ---------------------------------------------------------------------------------------------------------------- Botones
BOTONES_CAMBIOS = [
    ("<p>La acción que hace avanzar. Una sola por pantalla y por diálogo, siempre la última a la derecha.</p>",
     "<p>La acción que hace avanzar. Una sola por pantalla y por diálogo, siempre la última a la derecha. Sólida, del color de la marca, sin degradé ni sombra (173).</p>"),
    ("<p>Un poco más claro. El de peligro, un poco más oscuro.</p>",
     "<p>Un tono más oscuro, también el de peligro.</p>"),
    ("<p>El único ícono es el «+» de agregar, crear o invitar. El texto es un verbo y qué cosa, de una a tres palabras. La confirmación repite la acción.</p>",
     "<p>El único ícono es el «+» de agregar, crear o invitar. El texto es un verbo y qué cosa, de una a tres palabras. La confirmación repite la acción. Las altas dicen «Agregar …», como «Agregar empresa» o «Agregar opción».</p>"),
]
BOTONES_PROHIBIDO = ["El principal con degradé o sombra: es sólido (173).",
                     "«Sumar …» en un alta: dice «Agregar …»."]


# El alto de cada tablero con lo que suma esta pasada (medido el 07/11 con el tablero servido): el lienzo muestra solo ese alto.
ALTOS = {"Criterio-Tablas": 4960, "Criterio-Marco": 4290, "Criterio-Formularios": 4960, "Criterio-Dialogos": 3250,
         "Criterio-Avisos": 3510, "Criterio-Menus": 4070, "Criterio-Botones": 2580}


def altos():
    canvas_ruta = PROJ / "canvas.json"
    canvas = json.loads(canvas_ruta.read_text(encoding="utf-8"))
    for nombre, h in ALTOS.items():
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        t = re.sub(r'("\$preview":\{"width":1440,"height":)\d+', lambda m: m.group(1) + str(h), t)
        t = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{h}px", t, count=1)
        ruta.write_text(t, encoding="utf-8")
        canvas["boards"][f"{nombre}.dc.html"]["h"] = h
    canvas_ruta.write_text(json.dumps(canvas, ensure_ascii=False, indent=2), encoding="utf-8")


def pasar(nombre, cambios=(), secciones=None, prohibido=(), estilo=None):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    for viejo, nuevo in cambios:
        t = cambiar(t, viejo, nuevo)
    if secciones:
        t = antes_de_prohibido(t, secciones)
    if prohibido:
        t = prohibir(t, list(prohibido))
    if estilo:
        t = css(t, nombre, estilo)
    ruta.write_text(t, encoding="utf-8")


if __name__ == "__main__":
    pasar("Criterio-Tablas", TABLAS_CAMBIOS, TABLAS_SECCION, TABLAS_PROHIBIDO, TABLAS_CSS)
    pasar("Criterio-Marco", MARCO_CAMBIOS, MARCO_SECCIONES, MARCO_PROHIBIDO, MARCO_CSS)
    pasar("Criterio-Formularios", FORM_CAMBIOS, FORM_SECCIONES, FORM_PROHIBIDO, FORM_CSS)
    pasar("Criterio-Dialogos", DIALOGOS_CAMBIOS, DIALOGOS_SECCION, DIALOGOS_PROHIBIDO, DIALOGOS_CSS)
    pasar("Criterio-Avisos", AVISOS_CAMBIOS, AVISOS_SECCION, AVISOS_PROHIBIDO, AVISOS_CSS)
    pasar("Criterio-Menus", MENUS_CAMBIOS, None, MENUS_PROHIBIDO)
    pasar("Criterio-Botones", BOTONES_CAMBIOS, None, BOTONES_PROHIBIDO)
    altos()
    print("listo")
