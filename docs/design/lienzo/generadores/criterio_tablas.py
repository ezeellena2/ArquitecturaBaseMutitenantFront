"""Tablero «Criterio · Tablas y listas» en la página «Criterio de diseño»."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 2130
ARCHIVO = "Criterio-Tablas.dc.html"
TITULO = "Criterio · Tablas y listas"

# Mismo encabezado y mismo CSS de criterio que el tablero de Botones (aprobado).
botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head, resto = botones.split("</helmet>", 1)
head = head.replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)

CSS = """  <style data-criterio="tablas">
.fb2 { background: #fff; border: 1px solid var(--borde); border-radius: 12px; display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.fb2 .bus { width: 360px; height: 36px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 8px; background: var(--s2); display: flex; align-items: center; gap: 8px; padding: 0 12px; color: var(--t3); font-size: 14px; }
.fb2 .pil { height: 36px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 999px; padding: 0 14px; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--t2); background: #fff; }
.tb { background: #fff; border: 1px solid var(--borde); border-radius: 12px; }
.tb .th, .tb .tr { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.75fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) 190px 110px 48px; gap: 16px; align-items: center; padding: 0 8px 0 16px; }
.tb .th { min-height: 40px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); border-radius: 11px 11px 0 0; font-size: 13px; font-weight: 600; color: var(--t2); }
.tb .tr { min-height: 40px; border-bottom: 1px solid var(--borde); font-size: 13px; position: relative; }
.tb .tr:nth-child(odd) { background: oklch(0.975 0.008 78); }
.tb .tr:hover, .tb .tr.h { background: oklch(0.955 0.025 185); }
.tb .tr > * { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tb .tr .n { font-weight: 500; }
.tb .tr .nada { color: var(--t3); }
.tb .tr .der { overflow: visible; display: flex; justify-content: flex-end; }
.tb .pie { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 12px 0 16px; font-size: 13px; color: var(--t2); }
.tb .pie .pag { display: flex; align-items: center; gap: 8px; }
.tb .pie .pil { height: 32px; box-sizing: border-box; border: 1px solid var(--borde); border-radius: 999px; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--t2); background: #fff; }
.menu2 { position: absolute; z-index: 5; right: 8px; top: 40px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); padding: 4px; min-width: 200px; display: flex; flex-direction: column; }
.menu2 .it { display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 0 10px; border-radius: 6px; font-size: 14px; color: var(--t1); }
.menu2 .it svg { color: var(--t3); }
.menu2 .it.pel, .menu2 .it.pel svg { color: oklch(0.52 0.19 25); }
.menu2 .sep { height: 1px; background: var(--borde); margin: 4px 0; }
.lista { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.lista .cab { display: flex; align-items: center; justify-content: space-between; min-height: 40px; padding: 0 4px 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; }
.lista .it { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 8px 0 16px; border-bottom: 1px solid var(--borde); font-size: 13px; }
.lista .it:last-child { border-bottom: 0; }
.lista .it .dato { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; flex-direction: column; line-height: 1.35; }
.lista .it .l2 { font-size: 12px; color: var(--t3); }
.lista .it { min-height: 56px; }
.lista .it .ic { color: var(--t3); display: inline-flex; }
.lista .it .det { width: 220px; flex-shrink: 0; font-size: 13px; color: var(--t3); }
.lista .it .acc { width: 72px; flex-shrink: 0; display: flex; justify-content: flex-end; }
.est { display: inline-flex; align-items: center; gap: 8px; color: var(--t1); }
.est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--t3); flex-shrink: 0; }
.est.ok::before { background: oklch(0.6 0.13 155); }
.est.pend::before { background: var(--marca); }
.est.alerta::before { background: oklch(0.72 0.15 70); }
.est.off::before { background: oklch(0.75 0.01 78); }
.est.off { color: var(--t2); }
.reglas2 { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; color: var(--t2); font-size: 14px; }
.reglas2 strong { color: var(--t1); font-weight: 600; }
.lado { display: grid; grid-template-columns: 860px minmax(0, 1fr); gap: 32px; align-items: start; }
.mini { background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
.mini .th { min-height: 40px; display: flex; align-items: center; gap: 40px; padding: 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.mini .cuerpo { min-height: 176px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 16px; text-align: center; font-size: 14px; color: var(--t2); }
.mini .cuerpo strong { color: var(--t1); font-weight: 600; }
.mini .esq { align-self: stretch; display: flex; flex-direction: column; gap: 14px; padding: 4px 0; }
.mini .esq span { height: 12px; border-radius: 6px; background: oklch(0.93 0.01 78); }
.medidas .fil { box-sizing: border-box; }
.mini .rot2 { padding: 10px 16px; border-top: 1px solid var(--borde); font-size: 13px; font-weight: 600; color: var(--t2); }
  </style>"""

KEBAB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>'
BAJA = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>'
LUPA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/></svg>'
IZQ = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>'
DER = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg>'
LAPIZ = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.5 5.5 18.5 8.5 9 18H6v-3z"/></svg>'
PROHIBIR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m6.5 6.5 11 11"/></svg>'
MAIL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></svg>'
WA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/></svg>'
MAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>'

GUION = '<span class="nada">—</span>'
FILAS = [
    ("Lucía Fernández", "lucia.fernandez@delta.ejemplo.com", 'Dueño', "Delta S.A.", 'Administrador', '<span class="est ok">Activo</span>', GUION, False),
    ("Tomás Acosta", "tomas.acosta@delta.ejemplo.com", GUION, "Delta S.A.", 'Solo lectura', '<span class="est ok">Activo</span>', GUION, True),
    ("Julieta Sosa", "julieta.sosa@delta.ejemplo.com", 'Auditor', GUION, GUION, '<span class="est ok">Activo</span>', GUION, False),
    ("Diego Ríos", "diego.rios@delta.ejemplo.com", GUION, "Delta S.A.", 'Solo lectura', '<span class="est alerta">Baja pedida</span>', "27/10/2026", False),
    ("Martín Paz", "martin.paz@delta.ejemplo.com", GUION, "Delta S.A.", 'Solo lectura', '<span class="est ok">Activo</span>', GUION, False),
    ("Marcos Giménez", "marcos.gimenez@delta.ejemplo.com", GUION, GUION, GUION, '<span class="est off">Deshabilitado</span>', GUION, False),
    ("Sofía Herrera", "sofia.herrera@delta.ejemplo.com", GUION, "Delta S.A.", 'Solo lectura', '<span class="est pend">Invitación pendiente</span>', "02/10/2026", False),
]


def fila(n, correo, rolesOrg, empresa, rolesEmp, estado, vence, menu):
    menu_html = ""
    if menu:
        menu_html = (f'<div class="menu2" role="menu"><span class="it" role="menuitem">{LAPIZ} Editar</span>'
                     f'<div class="sep" role="separator"></div><span class="it pel" role="menuitem">{PROHIBIR} Deshabilitar</span></div>')
    clase = "tr h" if menu else "tr"
    return (f'<div class="{clase}"><span class="n">{n}</span><span>{correo}</span><span>{rolesOrg}</span><span>{empresa}</span>'
            f'<span>{rolesEmp}</span><span>{estado}</span><span>{vence}</span>'
            f'<span class="der"><button type="button" class="ib{" h" if menu else ""}" aria-label="Acciones de {n}">{KEBAB}</button>{menu_html}</span></div>')


filas_html = "\n        ".join(fila(*f) for f in FILAS)

BODY = f"""<div class="crit">
  <div>
    <h1>Tablas y listas</h1>
    <p class="sub">Dos formas: la tabla, para un listado largo que se filtra; la lista, para algo corto dentro de una pantalla.</p>
  </div>

  <section>
    <h2>Tabla</h2>
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="fb2" role="search" aria-label="Filtrar usuarios"><span class="bus">{LUPA} Buscar por nombre o correo</span><span class="pil">Estado {BAJA}</span><span class="pil">Empresa {BAJA}</span></div>
      <div class="tb">
        <div class="th"><span>Nombre</span><span>Correo</span><span>Roles de la organización</span><span>Empresa</span><span>Roles en la empresa</span><span>Estado</span><span>Vence</span><span class="sr">Acciones</span></div>
        {filas_html}
        <div class="pie"><span>1–7 de 7</span><span class="pag"><span class="pil">10 por página {BAJA}</span><span>Página 1 de 1</span><button type="button" class="ib" aria-label="Página anterior" disabled="{{{{si}}}}" style="opacity: 0.4;">{IZQ}</button><button type="button" class="ib" aria-label="Página siguiente" disabled="{{{{si}}}}" style="opacity: 0.4;">{DER}</button></span></div>
      </div>
      <ul class="reglas2" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 40px;">
        <li><strong>Filtros en su propia tarjeta</strong>, arriba de la tabla. Sin botones.</li>
        <li><strong>Encabezado con color:</strong> 40 px, fondo arena, sin mayúsculas.</li>
        <li><strong>Filas de 40 px</strong>, con la letra de hoy (13), alternadas. Al pasar el mouse, petróleo claro.</li>
        <li><strong>Un dato por columna</strong> y en una sola línea. Sin dato, una raya.</li>
        <li><strong>El estado es un punto de color y la palabra</strong>, sin fondo. Números y montos, a la derecha.</li>
        <li><strong>Las acciones van en ⋮:</strong> las comunes arriba; las de peligro abajo, en rojo y separadas.</li>
        <li><strong>Más de 10 filas, paginado:</strong> al pie, adentro de la misma caja. De entrada, 10 por página.</li>
        <li><strong>A ancho completo.</strong> Si no entra, se saca una columna; no se achica la letra.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Lista</h2>
    <div class="lado">
      <div class="lista">
        <div class="cab"><span>Cómo entrás</span><button type="button" class="cb cb-sec ch">{MAS} Agregar correo o teléfono</button></div>
        <div class="it"><span class="ic">{MAIL}</span><span class="dato">lucia.fer@gmail.com<span class="l2">Principal</span></span><span class="acc"></span><button type="button" class="ib" aria-label="Acciones de lucia.fer@gmail.com">{KEBAB}</button></div>
        <div class="it"><span class="ic">{MAIL}</span><span class="dato">lucia.fernandez@delta.ejemplo.com<span class="l2">Administrado por Grupo Delta</span></span><span class="acc"></span><button type="button" class="ib" aria-label="Acciones de lucia.fernandez@delta.ejemplo.com">{KEBAB}</button></div>
        <div class="it"><span class="ic">{WA}</span><span class="dato">011 15-5555-4521<span class="l2">Sin verificar</span></span><span class="acc"><button type="button" class="cb cb-enl" style="font-size: 13px;">Verificar</button></span><button type="button" class="ib" aria-label="Acciones de 011 15-5555-4521">{KEBAB}</button></div>
      </div>
      <ul class="reglas2">
        <li><strong>Para lo corto</strong> que vive dentro de una pantalla: hasta 10 elementos, sin filtros ni paginado. Si pueden ser más, es una tabla.</li>
        <li><strong>El encabezado lleva el título</strong>, con el mismo color que el de la tabla, y a lo sumo una acción chica a la derecha.</li>
        <li><strong>Sin encabezado de columnas.</strong> Filas de 44 px; con segunda línea, 56 px.</li>
        <li><strong>Lo que aclara cada fila</strong> («Principal», «Sin verificar») va en la segunda línea, en gris. Nunca como etiqueta ni como texto suelto a la derecha.</li>
      </ul>
    </div>
  </section>

  <section>
    <h2>Medidas</h2>
    <div class="medidas">
      <div class="cab" style="grid-template-columns: 220px 150px minmax(0, 1fr);"><span>Pieza</span><span>Medida</span><span>Cómo es</span></div>
      <div class="fil" style="grid-template-columns: 220px 150px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;"><strong>Encabezado</strong><span>40 px</span><span>Fondo arena, letra de 13 en semibold, gris oscuro, sin mayúsculas. Igual en tablas, listas y cajas.</span></div>
      <div class="fil" style="grid-template-columns: 220px 150px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;"><strong>Fila de tabla</strong><span>40 px</span><span>Letra de 13, la de hoy. Una fila sí y otra no, arena muy suave. Al pasar el mouse, petróleo claro.</span></div>
      <div class="fil" style="grid-template-columns: 220px 150px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;"><strong>Fila de lista</strong><span>44 o 56 px</span><span>Letra de 13. Lo que aclara la fila, en una segunda línea gris de 12.</span></div>
      <div class="fil" style="grid-template-columns: 220px 150px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;"><strong>Estado</strong><span>Punto de 8 px</span><span>Punto de color y la palabra, sin fondo: verde activo, petróleo pendiente, ámbar atención, gris apagado.</span></div>
      <div class="fil" style="grid-template-columns: 220px 150px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;"><strong>Columna de acciones</strong><span>48 px</span><span>Solo el ⋮, botón de ícono de 32 × 32.</span></div>
      <div class="fil" style="grid-template-columns: 220px 150px minmax(0, 1fr); min-height: 40px; padding-top: 0; padding-bottom: 0; font-size: 13px;"><strong>Pie con paginado</strong><span>48 px</span><span>Letra de 13: rango a la izquierda; tamaño de página, página y flechas a la derecha.</span></div>
    </div>
  </section>

  <section>
    <h2>Cuando no hay filas</h2>
    <div class="g4">
      <div class="mini"><div class="th"><span>Nombre</span><span>Correo</span></div><div class="cuerpo"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span><span style="width: 55%;"></span></div></div><div class="rot2">Cargando</div></div>
      <div class="mini"><div class="th"><span>Nombre</span><span>Correo</span></div><div class="cuerpo"><strong>Todavía no hay usuarios.</strong></div><div class="rot2">Todavía no hay nada · se crea desde la banda</div></div>
      <div class="mini"><div class="th"><span>Nombre</span><span>Correo</span></div><div class="cuerpo"><strong>Ningún usuario coincide con los filtros.</strong><button type="button" class="cb cb-enl" style="font-size: 14px;">Limpiar filtros</button></div><div class="rot2">Ninguno coincide</div></div>
      <div class="mini"><div class="th"><span>Nombre</span><span>Correo</span></div><div class="cuerpo"><strong>No pudimos cargar los usuarios.</strong><button type="button" class="cb cb-sec ch">Reintentar</button></div><div class="rot2">Error</div></div>
    </div>
  </section>

  <section>
    <h2>Prohibido</h2>
    <ul class="prohibido">
      <li>Encabezados en mayúsculas o sin color.</li>
      <li>Etiquetas o textos sueltos que cuentan un estado al lado de un dato: «Principal», «Suspendida», roles.</li>
      <li>Celdas de dos líneas, como nombre y correo juntos.</li>
      <li>Botones sueltos en la fila, salvo un enlace que pide el estado.</li>
      <li>Filtros y tabla en la misma tarjeta.</li>
      <li>Una tabla dentro de un diálogo.</li>
      <li>Una tabla a medio ancho con el resto vacío.</li>
      <li>Achicar la letra para que entre todo.</li>
      <li>Una tabla con encabezado de columnas para dos o tres datos: eso es una lista.</li>
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
c["boards"][ARCHIVO] = {"x": 1520, "y": 260, "w": 1440, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 1440 * 2 + 80
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
