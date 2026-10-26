"""Etapa 12 · Catálogos (orden nuevo, decisión 78), con `12-texto-diseno.md` y la §10 de `12-catalogos.md` del back.

La E12 es la primera de formularios y llega antes que ellos: en el panel solo está «Catálogos», y nada nombra preguntas,
formularios, «Lo usan» ni respuestas. Con la 35 (un solo texto, sin «Textos en»), la 43 (botones habilitados o grisados,
sin «Cambios sin guardar»; lo que necesita algo antes, grisado con el motivo en su tooltip), el tipo de valor como la A11
(en su campo, apagado y gris), la 55 (los contactos de WhatsApp como origen) y la 81 (un contacto sin nombre toma el de su
perfil; el teléfono nunca se ve). La disposición se copia de ArquitecturaBase (anexo D del traspaso 2: CA1-A, CA2 y CA3),
con nuestras piezas. Desde la v142, los pedidos del usuario del 25/10, como la maqueta (52505a0 y cde670e): el nombre y el
tipo en una fila y la descripción debajo; de dónde salen, en la banda al lado del estado; el teléfono sin rótulo ni «Una
opción | Varias»; un dato por celda en la lista y las fechas con su año. Desde la v143, ▲ en la columna ordenada, y los catálogos
de los miembros y de los contactos con el teléfono al costado y solo el desplegable «Persona» arriba: la lista se actualiza sola.

- FRM-Catalogos (la 12, sin «Lo usan») y FRM-Catalogos-14 (lo suma la 14), con sus teléfonos.
- FRM-Catalogo-Nuevo: tres orígenes y el tipo de valor de los escritos a mano.
- FRM-Catalogo (CA1-A, todo a la vista): la barra de Opciones (Agregar opción, Pegar desde Excel, Importar, Exportar y
  «⋯»), la búsqueda, la tabla que se edita en el lugar, elegir filas y, al costado, el teléfono de quien lo recibe.
- FRM-Catalogo-Importar (CA2): archivo o filas pegadas, revisar y aplicar.
- FRM-Catalogo-Tipo (CA3): un catálogo decimal, con la columna «Valor».
- FRM-Catalogo-Contactos: un catálogo de los contactos de WhatsApp, con filtros por etiqueta.
- FRM-Catalogo-Filtros: el de los miembros, redibujado.

Corre después de los generadores de catálogos y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402

PROJ = A.PROJ
APROBADO = True  # el usuario la aprobó el 25/10 («publicalo y commitea», versión 141)
PARA_APROBAR = " · para aprobar"
svg = F.svg
MAS, X, CHEV, KEBAB, ALERTA, TILDE = F.MAS, F.X, F.CHEV, F.KEBAB, F.ALERTA, A.TILDE
LAPIZ, ARRIBA, ABAJO, QUITAR, REACTIVAR = F.LAPIZ, F.ARRIBA, F.ABAJO, F.QUITAR, C.REACTIVAR
GIRA = E.GIRA
PEGAR = svg('<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9.5 4V3h5v1"/><path d="M9 10h6M9 13.5h6M9 17h3.5"/>', 16)
IMPORTAR = svg('<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>', 16)
EXPORTAR = svg('<path d="M12 15V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M5 19.5h14"/>', 16)
PLANTILLA = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/><path d="M9 13h6M9 16.5h4"/>', 16)
AZ = svg('<path d="M4 17 7 7l3 10"/><path d="M5 14h4"/><path d="M14 7h5l-5 10h5"/>', 16)
CODIGOS = svg('<path d="M8 7 3.5 12 8 17"/><path d="M16 7l4.5 5-4.5 5"/><path d="M13.5 5 10.5 19"/>', 16)
CONTACTOS = svg('<path d="M4 19.5 5.3 16A8 8 0 1 1 8.2 19z"/><circle cx="12" cy="10" r="2.4"/><path d="M8.5 15a3.6 3.6 0 0 1 7 0"/>', 20)
GENTE, LAPIZ20 = C.GENTE, C.LAPIZ20
OJO_TACHADO = svg('<path d="M3 3l18 18"/><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c5 0 8.5 4.4 9.5 6-.5.8-1.6 2.2-3.1 3.5"/><path d="M6.6 7.6C4.6 8.9 3.2 10.8 2.5 12c1 1.6 4.5 6 9.5 6 1.6 0 3-.4 4.3-1"/>', 16)

MOTIVO_NUEVO = "Guardá el catálogo para pegar o importar."
MOTIVO_CAMBIOS = "Guardá o descartá los cambios para pegar o importar."
MOTIVO_TOPE = "Llegó a 10.000 opciones, el máximo de un catálogo."


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:100], t.count(a))
    return t.replace(a, b)


def con_css(t, marca, bloque):
    t = re.sub(rf'<style data-e12c="{marca}">.*?</style>\n', "", t, flags=re.S)
    return t.replace("</helmet>", f'<style data-e12c="{marca}">\n{bloque}</style>\n</helmet>', 1)


def tip(boton, motivo, abierto=False):
    """Un botón grisado con el motivo en su tooltip (43); abierto, para mostrarlo en el tablero."""
    b = boton.replace(">", f' aria-disabled="true" title="{motivo}">', 1)
    return f'<span class="e-tipw">{b}<span class="e-tip" role="tooltip">{motivo}</span></span>' if abierto else b


# ================================================================ FRM-Catalogos (la 12) y FRM-Catalogos-14
CATS = [  # nombre, descripción, origen, sub, opciones, lo usan (14), clase, estado, motivo, destino
    ("Clientes", "A quiénes se les entrega o se visita.", "De los contactos de WhatsApp", "por etiqueta", "—", "1 formulario", "", "Activo", "", "FRM-Catalogo-Contactos"),
    ("Depósitos", "De dónde sale la mercadería.", "Escritas a mano", "Texto", "4", "—", "off", "Dado de baja", "", "FRM-Catalogo"),
    ("Motivos de visita", "Por qué se visita a un cliente.", "Escritas a mano", "Texto", "4", "1 formulario", "", "Activo", "", "FRM-Catalogo"),
    ("Proveedores", "", "Escritas a mano", "Texto", "1.097", "1 formulario", "", "Activo", "", "FRM-Catalogo"),
    ("Recargo por zona", "Cuánto se suma según la zona de entrega.", "Escritas a mano", "Decimal", "6", "—", "", "Activo", "", "FRM-Catalogo-Tipo"),
    ("Responsables de obra", "Supervisores y jefes de obra.", "De los miembros", "con filtros", "—", "—", "mal", "No se puede usar",
     "Un rol de los filtros ya no existe.", "FRM-Catalogo-Filtros"),
    ("Supervisores", "Quienes pueden aprobar una visita.", "De los miembros", "con filtros", "7", "1 formulario", "", "Activo", "", "FRM-Catalogo-Filtros"),
]
ESTADOS_LISTA = ["Todos", "Filtro abierto", "Escritas a mano", "De los miembros", "De los contactos", "Sin coincidencias", "Cargando", "Vacío", "Error"]
CSS_LISTA = """.w-th.k12, .w-tr.k12 { grid-template-columns: minmax(200px, 1.3fr) minmax(220px, 1.3fr) 130px 100px minmax(170px, 1fr); }
.w-th.k14, .w-tr.k14 { grid-template-columns: minmax(180px, 1.2fr) minmax(210px, 1.2fr) 120px 90px 120px minmax(160px, 1fr); }
.w-tr.k12, .w-tr.k14 { min-height: 40px; }
.w-th .ord { margin-left: 4px; font-size: 10px; color: var(--t2); }
.w-tr .k-tc { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.w-tr .k-tc a { color: var(--t1); text-decoration: none; font-weight: 500; }
.w-tr .k-tc small { font-size: 12px; color: var(--t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-tr .gris { color: var(--t3); }
.w-tr .est2 { display: flex; align-items: center; gap: 2px; }
.w-tr .usan { color: var(--marca-tx); font-weight: 500; text-decoration: none; }
.o-fb { display: flex; align-items: center; gap: 8px; }
.o-fb .w-bus { width: 320px; flex: none; }
.o-fb .tot { margin-left: auto; font-size: 13px; color: var(--t3); }
"""


def fila_cat(c, con_usan):
    """Un dato por celda, en un renglón (decisión del usuario del 25/10): la descripción no va en la lista y el tipo de valor tiene su columna."""
    n, desc, origen, sub, ops, usan, clase, estado, motivo, destino = c
    o = f"<span>{origen}</span>"
    tipo = f"<span>{sub}</span>" if origen == "Escritas a mano" else '<span class="gris">—</span>'
    op = f'<span class="gris">{ops}</span>' if ops == "—" else f"<span>{ops}</span>"
    u = ""
    if con_usan:
        u = ('<span class="gris">—</span>' if usan == "—" else
             f'<a class="usan" href="FRM-Editor.dc.html" aria-label="Ver los formularios que usan {n}">{usan}</a>')
    e = f'<span class="est2"><span class="w-est {clase}">{estado}</span>{F.info(motivo) if motivo else ""}</span>'
    grupo = {"Escritas a mano": "verMano", "De los miembros": "verMiembros"}.get(origen, "verContactos")
    return (f'<sc-if value="{{{{{grupo}}}}}" hint-placeholder-val="{{{{si}}}}"><div class="w-tr {"k14" if con_usan else "k12"}">'
            f'<span class="k-tc"><a href="{destino}.dc.html">{n}</a></span>{o}{tipo}{op}{u}{e}</div></sc-if>')


def lista_catalogos(con_usan=False):
    clase = "k14" if con_usan else "k12"
    cab = ["Catálogo", "De dónde salen", "Tipo de valor", "Opciones"] + (["Lo usan"] if con_usan else []) + ["Estado"]
    filas = "".join(fila_cat(c, con_usan) for c in CATS)
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            + F.filtro("Origen", [("t", "Todos los orígenes", 7), ("m", "Escritas a mano", 4), ("b", "De los miembros", 2), ("c", "De los contactos de WhatsApp", 1)], "ori")
            + F.filtro("Estado", [("t", "Todos los estados", 7), ("a", "Activo", 5), ("n", "No se puede usar", 1), ("d", "Dado de baja", 1)], "est")
            + '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl">Limpiar filtros</button></sc-if>'
            '<span class="tot">{{total}}</span></div></sc-if>')
    # La columna por la que está ordenada muestra ▲ (el usuario, 25/10)
    tabla = (f'<div class="w-caja"><div class="w-th {clase}">' + "".join(
        f'<span aria-sort="ascending">{c}<span class="ord" aria-hidden="true">▲</span></span>' if c == "Catálogo" else f"<span>{c}</span>" for c in cab) + "</div>"
             '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + filas
             + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
             '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
             '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay catálogos.</b></div></sc-if>'
             '<sc-if value="{{sinCoincidencias}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ningún catálogo coincide con los filtros.</b>'
             '<button type="button" class="cb cb-enl">Limpiar filtros</button></div></sc-if>'
             '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar los catálogos.</b><button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div>')
    banda = F.banda("Catálogos", "{{resumen}}", f'<a class="cb cb-pri" href="FRM-Catalogo-Nuevo.dc.html">{MAS} Nuevo catálogo</a>').replace(
        f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{F.LISTA}</span>', 1)
    return banda, '<div class="w-body">' + caja + tabla + "</div>"


def js_lista(vista):
    return f"""    const f = {vista};
    const mano = f === 'Escritas a mano', miembros = f === 'De los miembros', contactos = f === 'De los contactos', elegido = mano || miembros || contactos;
    const lista = ['Todos', 'Filtro abierto', 'Escritas a mano', 'De los miembros', 'De los contactos'].includes(f);
    return {{
      si: true, no: false,
      resumen: f === 'Vacío' ? 'Sin catálogos' : f === 'Cargando' || f === 'Error' ? '' : '7 catálogos · 5 activos',
      conFiltros: f !== 'Vacío', busqueda: f === 'Sin coincidencias' ? 'herramientas' : 'Buscar por nombre', busClase: f === 'Sin coincidencias' ? 'lleno' : '',
      oriTexto: mano ? 'Origen: Escritas a mano' : miembros ? 'Origen: De los miembros' : contactos ? 'Origen: De los contactos de WhatsApp' : 'Origen',
      oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriAlternar: () => {{}},
      oriOn_t: elegido ? '' : 'on', oriOn_m: mano ? 'on' : '', oriOn_b: miembros ? 'on' : '', oriOn_c: contactos ? 'on' : '',
      oriC_t: '7', oriC_m: '4', oriC_b: '2', oriC_c: '1', oriElegir_t: () => {{}}, oriElegir_m: () => {{}}, oriElegir_b: () => {{}}, oriElegir_c: () => {{}},
      estTexto: 'Estado', estClase: '', estMenu: false, estAlternar: () => {{}}, estOn_t: 'on', estOn_a: '', estOn_n: '', estOn_d: '',
      estC_t: '7', estC_a: '5', estC_n: '1', estC_d: '1', estElegir_t: () => {{}}, estElegir_a: () => {{}}, estElegir_n: () => {{}}, estElegir_d: () => {{}},
      hayFiltro: elegido || f === 'Sin coincidencias',
      total: mano ? '4 catálogos' : miembros ? '2 catálogos' : contactos ? '1 catálogo' : f === 'Sin coincidencias' ? '0 catálogos' : '7 catálogos',
      conFilas: lista, verMano: !miembros && !contactos, verMiembros: !mano && !contactos, verContactos: !mano && !miembros,
      rango: mano ? '1–4 de 4' : miembros ? '1–2 de 2' : contactos ? '1 de 1' : '1–7 de 7',
      cargando: f === 'Cargando', vacio: f === 'Vacío', sinCoincidencias: f === 'Sin coincidencias', error: f === 'Error',
"""


def pagina_lista(nombre, estados, vista, capas=None, con_usan=False, css=""):
    banda, cuerpo = lista_catalogos(con_usan)
    flags = "".join(f"      c{i}: e === {json.dumps(k, ensure_ascii=False)},\n" for i, k in enumerate(estados)) if capas else ""
    t = C.pagina_k(nombre, "Inicio / Formularios / Catálogos", banda, cuerpo,
                   F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + E.CSS_E12 + CSS_LISTA + css, estados, js_lista(vista) + flags + "    };")
    if capas:
        over = "".join(f'<sc-if value="{{{{c{estados.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
        t = F.con_dialogo(t, over, C.CSS_K2 + CSS_NUEVO)
    return t


# ================================================================ FRM-Catalogo-Nuevo: tres orígenes y el tipo de valor
CSS_NUEVO = """.w-dlg.k2 { width: 620px; }
.k-tipo { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; position: relative; }
.k-tipo .rt { font-size: 13px; font-weight: 600; color: var(--t2); }
.k-tipo .ct { display: flex; justify-content: space-between; align-items: center; max-width: 260px; height: 40px; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; box-sizing: border-box; font-size: 14px; }
.k-tipo .f-mn { position: absolute; top: auto; bottom: 46px; left: 0; width: 260px; z-index: 30; }
"""
ESTADOS_NUEVO = ["Escribirlas a mano", "Tipo de valor: menú", "Tomarlas de los miembros", "Tomarlas de los contactos", "Sin el módulo de WhatsApp"]
TIPOS = ["Texto", "Número entero", "Número decimal", "Fecha"]


def dlg_nuevo(sel, menu=False, con_wa=True):
    def op(on, icono, titulo, texto):
        return (f'<div class="k-op{" on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><span class="rd"></span><span class="ic">{icono}</span>'
                f'<span class="tx"><b>{titulo}</b><span>{texto}</span></span></div>')
    tipo = ""
    if sel == "mano":
        mn = ('<span class="f-mn" role="listbox" aria-label="Tipo de valor">' + "".join(f'<span role="option" class="{"on" if k == 0 else ""}">{n}</span>' for k, n in enumerate(TIPOS))
              + "</span>") if menu else ""
        tipo = (f'<div class="k-tipo"><span class="rt">Tipo de valor{F.info("No se cambia después. En WhatsApp se ve el texto de la opción.")}</span>'
                f'<div class="ct">Texto{CHEV}</div>{mn}</div>')
    cuerpo = ('<span class="k-rt">De dónde salen las opciones' + F.info("No se cambia después: para otro origen se arma otro catálogo.") + "</span>"
              '<div class="k-ops" role="radiogroup" aria-label="De dónde salen las opciones">'
              + op(sel == "mano", LAPIZ20, "Escribirlas a mano", "Para listas que mantiene una persona: motivos, proveedores, zonas.")
              + op(sel == "miembros", GENTE, "Tomarlas de los miembros, con filtros", "Se arma sola con los miembros de la organización que cumplen los filtros.")
              + (op(sel == "contactos", CONTACTOS, "Tomarlas de los contactos de WhatsApp", "Se arma sola con los contactos de Clientes, por etiqueta.") if con_wa else "")
              + "</div>" + tipo)
    destino = {"mano": "FRM-Catalogo.dc.html", "miembros": "FRM-Catalogo-Filtros.dc.html", "contactos": "FRM-Catalogo-Contactos.dc.html"}[sel]
    pie = f'<button type="button" class="cb cb-sec">Cancelar</button><a class="cb cb-pri" href="{destino}">Continuar</a>'
    return F.dialogo("Nuevo catálogo", cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg k2"', 1)


def nuevo():
    capas = {"Escribirlas a mano": dlg_nuevo("mano"), "Tipo de valor: menú": dlg_nuevo("mano", menu=True), "Tomarlas de los miembros": dlg_nuevo("miembros"),
             "Tomarlas de los contactos": dlg_nuevo("contactos"), "Sin el módulo de WhatsApp": dlg_nuevo("mano", con_wa=False)}
    t = pagina_lista("Nuevo catálogo · de dónde salen las opciones", ESTADOS_NUEVO, "'Todos'", capas)
    return t


# ================================================================ El editor de un catálogo escrito a mano (CA1-A)
OPS = [("Seguimiento", "SEG", "Visita programada a un cliente actual", True),
       ("Venta nueva", "VEN", "Primera visita a un cliente", True),
       ("Reclamo", "REC", "Hay un problema para resolver", True),
       ("Cobranza", "COB", "Cobrar un pago pendiente", False)]
PROVEEDORES = [("Abrasivos del Sur", "PRV-0001", "CUIT 30-71234567-1", True), ("Aceros Rosario", "PRV-0002", "CUIT 30-70988123-4", True),
               ("Aislantes Norte", "PRV-0003", "CUIT 33-71011223-9", True), ("Alambres Patagónicos", "PRV-0004", "CUIT 30-69877654-2", True),
               ("Aluminios Cuyo", "PRV-0005", "CUIT 30-71455890-7", False), ("Andamios Litoral", "PRV-0006", "CUIT 30-70233456-1", True),
               ("Arenas del Paraná", "PRV-0007", "CUIT 30-71899001-5", True), ("Bulonera Central", "PRV-0008", "CUIT 30-70345678-9", True),
               ("Caños y Conexiones", "PRV-0009", "CUIT 30-71123987-3", True), ("Cementos del Plata", "PRV-0010", "CUIT 30-69001234-8", True)]
ZONAS = [("Capital", "CAP", "", "0,00", True), ("Gran Buenos Aires", "GBA", "", "2.500,00", True), ("Interior", "INT", "Más de 100 km", "4.800,50", True),
         ("Patagonia", "PAT", "", "9.200,00", True), ("Litoral", "LIT", "", "3.100,00", True), ("Retiro en depósito", "RET", "Sin envío", "0,00", True)]
CSS_EDITOR = """.k-cab2 { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 24px; align-items: stretch; }
.k-g2.t2 { grid-template-columns: minmax(0, 1fr) 192px; }
.k-g2.t1 { grid-template-columns: minmax(0, 1fr); }
.f-bnd-est .k-orig { color: var(--t3); margin-left: 6px; }
.k-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; padding: 16px; }
.k-g2 .ancho { grid-column: 1 / -1; }
.k-g2 .ct.ro, .k-g3 .ct.ro { background: var(--s2); color: var(--t3); }
.k-g2 .ct.ph { color: var(--t3); }
.k-g2 .ct.mal { border-color: var(--peligro); }
.k-g2 .err2, .k-tab .err2 { font-size: 12px; color: var(--peligro); }
.f-cab .der { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; color: var(--t3); }
.f-cab .der .cb { height: 32px; font-size: 13px; }
.f-cab .der .ib { width: 32px; height: 32px; border: 1px solid var(--borde2); border-radius: 8px; box-sizing: border-box; background: #fff; }
.f-cab .der .cuenta { margin-right: 6px; }
.k-fb { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--borde); position: relative; z-index: 5; }
.k-fb .w-bus { width: 280px; flex: none; }
.k-sel { display: flex; align-items: center; gap: 10px; padding: 8px 16px; background: var(--marca-t); color: var(--marca-tx); font-size: 13.5px; font-weight: 600; border-bottom: 1px solid var(--borde); }
.k-sel .cb { height: 30px; font-size: 13px; }
.k-sel .cb-enl { margin-left: auto; }
.w-th.ke, .w-tr.ke { grid-template-columns: 28px 30px minmax(192px, 1.25fr) 96px minmax(192px, 1.35fr) 110px 36px; gap: 10px; }
.w-th.kv, .w-tr.kv { grid-template-columns: 28px 30px minmax(192px, 1.1fr) 96px 128px minmax(192px, 1fr) 110px 36px; gap: 10px; }
.w-th.kl, .w-tr.kl { grid-template-columns: 30px minmax(192px, 1.2fr) 96px minmax(192px, 1.4fr) 110px; gap: 10px; }
.w-tr.ke, .w-tr.kv, .w-tr.kl { position: relative; min-height: 50px; }
.w-tr.baja .k-in { color: var(--t3); }
.k-chk { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--borde2); box-sizing: border-box; background: #fff; display: inline-flex; align-items: center; justify-content: center; color: #fff; }
.k-chk.on { background: var(--marca); border-color: var(--marca); }
.k-chk.medio { background: var(--marca); border-color: var(--marca); }
.k-chk.medio::after { content: ""; width: 8px; height: 2px; background: #fff; border-radius: 1px; }
.k-in { display: flex; align-items: center; gap: 6px; height: 32px; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--borde); border-radius: 7px; background: #fff; font-size: 13px; color: var(--t1); min-width: 0; }
.k-in span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.k-in small { font-size: 11.5px; color: var(--t3); flex-shrink: 0; font-variant-numeric: tabular-nums; }
.k-in.ph span { color: var(--t3); }
.k-in.mal { border-color: var(--peligro); }
.k-in.mal small { color: var(--peligro); }
.k-in.foco { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }
.k-in.mono span { font-family: ui-monospace, Consolas, monospace; font-size: 13px; }
.k-tab { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.k-tab .aviso2 { font-size: 12px; color: oklch(0.45 0.1 70); }
.k-lee { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.k-lee.mono { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; color: var(--t2); }
.w-tr .f-menu { position: absolute; right: 12px; top: calc(100% - 6px); z-index: 20; min-width: 200px; }
.f-cab .der .f-menu { position: absolute; right: 12px; top: calc(100% + 4px); z-index: 30; min-width: 260px; font-weight: 400; }
.f-cab { position: relative; }
.w-body .w-caja:has(.f-menu) { overflow: visible; }
.k-ab { background: oklch(0.985 0.004 78); border-top: 1px solid var(--borde); }
.k-ed { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; padding: 4px 16px 14px 84px; }
.k-ed .ancho { grid-column: 1 / -1; }
.k-ed .cnt { align-self: flex-end; font-size: 12px; color: var(--t3); }
.k-pie { display: flex; justify-content: space-between; align-items: center; }
.k-act { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; }
.k-act i { width: 16px; height: 16px; border-radius: 4px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.k-pv { display: flex; flex-direction: column; }
.k-pv .pv-tit { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 600; color: var(--t2); }
.k-pv .seg2 { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 2px; border-radius: 8px; background: var(--s3); font-size: 12px; }
.k-pv .seg2 span { padding: 3px 10px; border-radius: 6px; color: var(--t2); text-align: center; }
.k-pv .seg2 span.on { background: #fff; color: var(--t1); font-weight: 600; box-shadow: 0 1px 2px oklch(0.24 0.014 78 / 0.12); }
.k-pv .tel { flex: 1; height: auto; min-height: 236px; width: 100%; box-sizing: border-box; }
.tel .k-campo { margin: 4px 14px; display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; color: oklch(0.3 0.01 150); }
.tel .k-campo .sel { display: flex; justify-content: space-between; align-items: center; height: 34px; box-sizing: border-box; padding: 0 10px; border: 1px solid oklch(0.85 0.006 150); border-radius: 8px; color: oklch(0.5 0.01 150); }
.tel .k-li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 14px; border-bottom: 1px solid oklch(0.94 0.004 150); }
.tel .k-li .t { display: flex; flex-direction: column; line-height: 1.3; font-size: 12.5px; color: oklch(0.25 0.01 150); }
.tel .k-li .t small { font-size: 11px; color: oklch(0.5 0.01 150); }
.tel .k-li i { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid oklch(0.55 0.01 150); flex-shrink: 0; }
.tel .k-li i.cua { border-radius: 3px; }
.tel .k-ay { padding: 8px 14px 2px; font-size: 11.5px; color: oklch(0.5 0.01 150); }
.tel .k-vol { padding: 10px 14px; font-size: 12.5px; color: oklch(0.45 0.12 160); font-weight: 600; }
.k-dif { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; grid-column: 1 / -1; }
.k-dif > div { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
.k-dif .c { padding: 8px 12px; background: oklch(0.945 0.018 76); font-size: 12.5px; font-weight: 600; color: var(--t2); }
.k-dif .g-det { border: 0; border-radius: 0; }
.w-bnd .ac { position: relative; }
.w-bnd .ac .f-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; min-width: 200px; }
.k-vacio { padding: 36px 16px; text-align: center; font-size: 14px; color: var(--t2); }
/* Las tablas de un catálogo no se aplastan (maqueta a1303a5 y af5eceb, el usuario, 25/10): cada columna con su ancho mínimo y, si
   no entran, se desplazan a lo ancho dentro de su caja, con lo de la izquierda y el ⋮ fijos, con el fondo de su fila y una línea. */
.k-desp { overflow-x: auto; scrollbar-width: thin; scrollbar-color: var(--borde2) transparent; }
.k-desp:has(.f-menu), .k-desp:has(.f-mn) { padding-bottom: 340px; margin-bottom: -340px; scrollbar-width: none; }
.k-desp .w-th, .k-desp .w-tr { overflow: visible; --fxbg: #fff; }
.k-desp .w-tr:nth-child(odd) { --fxbg: oklch(0.975 0.008 78); }
.k-desp .w-th { --fxbg: oklch(0.945 0.018 76); }
.k-desp .w-th > .fx, .k-desp .w-tr > .fx { position: sticky; z-index: 2; align-self: stretch; display: flex; align-items: center; background: var(--fxbg); }
.k-desp .w-th > .fx { z-index: 3; }
.k-desp .w-tr > .fx.k-tab { flex-direction: column; align-items: stretch; justify-content: center; }
.k-desp .w-tr > .fx-d, .k-desp .w-tr > .fx-d2 { overflow: visible; }
.k-desp .fx-a { left: 16px; box-shadow: -16px 0 0 var(--fxbg); }
.k-desp .fx-b { left: 54px; box-shadow: -10px 0 0 var(--fxbg); }
.k-desp .fx-c { left: 94px; box-shadow: -10px 0 0 var(--fxbg), 5px 0 0 var(--fxbg), 6px 0 0 var(--borde); }
.k-desp .fx-c2 { left: 56px; box-shadow: -10px 0 0 var(--fxbg), 5px 0 0 var(--fxbg), 6px 0 0 var(--borde); }
.k-desp .fx-campo { left: 16px; box-shadow: -16px 0 0 var(--fxbg), 6px 0 0 var(--fxbg), 7px 0 0 var(--borde); }
.k-desp .fx-d { right: 8px; box-shadow: 8px 0 0 var(--fxbg), -5px 0 0 var(--fxbg), -6px 0 0 var(--borde); }
.k-desp .fx-d2 { right: 8px; box-shadow: 8px 0 0 var(--fxbg), -6px 0 0 var(--fxbg), -7px 0 0 var(--borde); }
.k-desp .fx-d .f-menu, .k-desp .fx-d2 .f-menu { right: 0; top: calc(100% - 6px); }
.k-desp .w-tr > .fx:has(.f-menu), .k-desp .w-tr > .fx:has(.f-mn) { z-index: 6; }
.k-desp .w-th > span:has(.e-tipw) { position: relative; z-index: 6; overflow: visible; }
.tel .k-mas { padding: 10px 14px; font-size: 11.5px; color: oklch(0.5 0.01 150); }
"""
# El ancho mínimo de cada tabla: las columnas, los espacios entre ellas y los 24 px de los costados
ANCHOS = {"ke": 768, "kv": 906, "kl": 684}


def campo(rotulo, valor, req=False, ro=False, ph=False, err="", info=""):
    clase = "ct" + (" ro" if ro else "") + (" ph" if ph else "") + (" mal" if err else "")
    rq = ' <span class="req">*</span>' if req else ""
    e = f'<span class="err2" role="alert">{err}</span>' if err else ""
    return f'<div class="w-cmp"><span class="rt">{rotulo}{rq}{F.info(info) if info else ""}</span><div class="{clase}">{valor}</div>{e}</div>'


def caja_catalogo(nombre, desc, origen="Escritas a mano", tipo="Texto", err_nombre=False, lectura=False):
    """El nombre y el tipo de valor en una fila y la descripción debajo; de dónde salen va en la banda (pedido del usuario, 25/10)."""
    n = campo("Nombre", nombre or "Nombre del catálogo", req=not lectura, ro=lectura, ph=not nombre, err="Escribí el nombre del catálogo." if err_nombre else "")
    d = campo("Descripción", desc or "Opcional", ro=lectura, ph=not desc).replace('class="w-cmp"', 'class="w-cmp ancho"', 1)
    cuerpo = n + (campo("Tipo de valor", tipo, ro=True) if tipo else "") + d
    return f'<div class="w-caja"><div class="f-cab"><span>El catálogo</span></div><div class="k-g2 {"t2" if tipo else "t1"}">{cuerpo}</div></div>'


def k_menu_fila(n, baja=False):
    ultimo = (f'<span class="f-mi" role="menuitem">{REACTIVAR} Reactivar</span>' if baja else
              f'<span class="f-sep" role="separator"></span><span class="f-mi pel" role="menuitem">{QUITAR} Dar de baja</span>')
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de {n}"><span class="f-mi" role="menuitem">{LAPIZ} Editar</span>'
            f'<span class="f-mi" role="menuitem">{ARRIBA} Subir</span><span class="f-mi" role="menuitem">{ABAJO} Bajar</span>{ultimo}</div>')


def entrada(valor, mono=False, contar=False, ph="", mal=False, foco=False):
    clases = "k-in" + (" mono" if mono else "") + (" ph" if not valor else "") + (" mal" if mal else "") + (" foco" if foco else "")
    c = f"<small>{len(valor)}/30</small>" if contar else ""
    return f'<span class="{clases}"><span>{valor or ph}</span>{c}</span>'


def fila_editable(k, n, cod, det, activa, valor=None, elegida=False, menu=False, err=None, aviso=None, foco=None, campos="", tabla=""):
    """Una fila de la tabla que se edita en el lugar. err/aviso: {columna: texto}; campos, las celdas de los campos (la 13)."""
    err = err or {}
    t = entrada(n, contar=True, ph="Texto", mal="texto" in err, foco=foco == "texto")
    t_extra = (f'<span class="err2" role="alert">{err["texto"]}</span>' if "texto" in err else
               f'<span class="aviso2">{aviso}</span>' if aviso else "")
    c = entrada(cod, mono=True, ph="Código", mal="codigo" in err, foco=foco == "codigo")
    c_extra = f'<span class="err2" role="alert">{err["codigo"]}</span>' if "codigo" in err else ""
    celdas = (f'<span class="fx fx-a"><span class="k-chk{" on" if elegida else ""}" role="checkbox" aria-checked="{"true" if elegida else "false"}">{TILDE if elegida else ""}</span></span>'
              f'<span class="gris fx fx-b">{k}</span><span class="k-tab fx fx-c">{t}{t_extra}</span><span class="k-tab">{c}{c_extra}</span>')
    if valor is not None:
        v = entrada(valor, ph="Valor", mal="valor" in err, foco=foco == "valor")
        v_extra = f'<span class="err2" role="alert">{err["valor"]}</span>' if "valor" in err else ""
        celdas += f'<span class="k-tab">{v}{v_extra}</span>'
    celdas += f'<span class="k-tab">{entrada(det, ph="Opcional")}</span>{campos}'
    est = '<span class="w-est">Activa</span>' if activa else '<span class="w-est off">Dada de baja</span>'
    celdas += (f'{est}<span class="fx fx-d"><button type="button" class="ib" aria-label="Acciones de {n or "la opción nueva"}">{KEBAB}</button>'
               f'{k_menu_fila(n, not activa) if menu else ""}</span>')
    return f'<div class="w-tr {tabla or ("kv" if valor is not None else "ke")}{"" if activa else " baja"}">{celdas}</div>'


def fila_lectura(k, n, cod, det, activa):
    est = '<span class="w-est">Activa</span>' if activa else '<span class="w-est off">Dada de baja</span>'
    return (f'<div class="w-tr kl{"" if activa else " baja"}"><span class="gris fx fx-a">{k}</span><span class="k-lee fx fx-c2">{n}</span><span class="k-lee mono">{cod}</span>'
            f'<span class="k-lee">{det}</span>{est}</div>')


def opcion_abierta(n="Venta nueva", cod="VEN", det="Primera visita a un cliente"):
    """«Editar» del ⋮ abre la opción entera debajo de su fila (el lápiz de CA1-A)."""
    return ('<div class="k-ab"><div class="k-ed">'
            f'<div class="w-cmp"><span class="rt">Texto <span class="req">*</span></span><div class="ct">{n}</div><span class="cnt">{len(n)}/30</span></div>'
            f'<div class="w-cmp"><span class="rt">Código <span class="req">*</span>{F.info("No se muestra en WhatsApp.")}</span><div class="ct">{cod}</div></div>'
            f'<div class="w-cmp ancho"><span class="rt">Detalle</span><div class="ct">{det}</div></div>'
            f'<div class="k-pie ancho"><span class="k-act"><i>{TILDE}</i>Activa</span><button type="button" class="cb cb-sec">Listo</button></div></div></div>')


def barra(modo):
    """El encabezado de Opciones: solo «+ Agregar opción» y un ⋮ con lo demás, sin cantidades (el usuario, 26/10, front 29451ed6).
    modo: normal | cambios | nuevo | tope | lectura."""
    agregar = f'<button type="button" class="cb cb-sec">{MAS} Agregar opción</button>'
    mas = f'<button type="button" class="ib" aria-label="Más acciones de las opciones" aria-haspopup="menu" aria-expanded="{{{{expMas}}}}">{KEBAB}</button>'
    if modo == "lectura":
        return mas
    if modo == "tope":
        return tip(agregar, MOTIVO_TOPE, abierto=True) + mas
    return agregar + mas


def menu_mas(modo="normal"):
    """El ⋮ de Opciones. Lo que no se puede todavía va apagado, con el motivo en su tooltip (43)."""
    motivo = {"nuevo": MOTIVO_NUEVO, "cambios": MOTIVO_CAMBIOS, "tope": MOTIVO_TOPE}.get(modo, "")

    def mi(icono, texto, apagado=""):
        if apagado:
            return f'<span class="f-mi off" role="menuitem" aria-disabled="true" title="{apagado}">{icono} {texto}</span>'
        return f'<span class="f-mi" role="menuitem">{icono} {texto}</span>'
    exportar = mi(EXPORTAR, "Exportar", MOTIVO_NUEVO if modo == "nuevo" else "")
    plantilla = mi(PLANTILLA, "Descargar la plantilla")
    if modo == "lectura":
        items = exportar + plantilla
    else:
        items = (mi(PEGAR, "Pegar desde Excel", motivo) + mi(IMPORTAR, "Importar", motivo if modo != "tope" else "") + exportar
                 + '<span class="f-sep" role="separator"></span>' + plantilla
                 + mi(AZ, "Ordenar de la A a la Z") + mi(CODIGOS, "Generar los códigos que faltan"))
    return f'<sc-if value="{{{{menuMas}}}}" hint-placeholder-val="{{{{no}}}}"><div class="f-menu" role="menu" aria-label="Más acciones de las opciones">{items}</div></sc-if>'


def caja_opciones(filas, cuenta, pie, modo="normal", seleccion="", tabla="ke", vacia=False, cab=None, ancho=None):
    """cuenta ya no se muestra: el encabezado de una sección no lleva cantidades (29451ed6); lo que hay, en la tabla y el paginado."""
    cab_tabla = cab or {"ke": ["", "#", "Texto", "Código", "Detalle", "Estado", ""],
                        "kv": ["", "#", "Texto", "Código", "Valor", "Detalle", "Estado", ""],
                        "kl": ["#", "Texto", "Código", "Detalle", "Estado"]}[tabla]
    todas = '<span class="k-chk{{chkTodas}}" role="checkbox" aria-label="Elegir las de esta página"></span>'
    fijas = ({0: "fx fx-a", 1: "fx fx-c2"} if tabla == "kl" else {0: "fx fx-a", 1: "fx fx-b", 2: "fx fx-c", len(cab_tabla) - 1: "fx fx-d"})

    def celda(k, c):
        if c.startswith("<span"):
            return c
        clase = fijas.get(k, "")
        if k == len(cab_tabla) - 1 and tabla != "kl":
            return f'<span class="{clase}"><span class="sr">Acciones</span></span>'
        dentro = todas if (k == 0 and tabla != "kl") else c
        return f'<span class="{clase}">{dentro}</span>' if clase else f"<span>{c}</span>"
    th = f'<div class="w-th {tabla}">' + "".join(celda(k, c) for k, c in enumerate(cab_tabla)) + "</div>"
    tabla_html = f'<div class="k-desp"><div class="k-tabla" style="min-width: {ancho or ANCHOS[tabla]}px;">{th}{filas}</div></div>'
    fb = '' if vacia else f'<div class="k-fb"><span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span><span class="w-pil">Estado {CHEV}</span></div>'
    cuerpo = (f'<div class="k-vacio">Todavía no hay opciones.</div>' if vacia else seleccion + tabla_html + pie)
    return (f'<div class="w-caja"><div class="f-cab"><span>Opciones</span><span class="der">{barra(modo)}{menu_mas(modo)}</span></div>'
            f"{fb}{cuerpo}</div>")


def vista_previa(items, titulo="Motivo"):
    """El teléfono, sin rótulo: por defecto el campo cerrado; tocado, la lista. Si se elige una o varias lo decide la pregunta del formulario."""
    lista = "".join(f'<div class="k-li"><span class="t">{n}<small>{d}</small></span><i></i></div>' for n, d in items)
    return ('<div class="k-pv">'
            '<div class="tel" aria-label="Así lo ve quien lo recibe"><div class="pv-hoja">'
            f'<sc-if value="{{{{pvCerrado}}}}" hint-placeholder-val="{{{{si}}}}"><div class="pv-hc"><span class="pv-x">×</span>Formulario</div>'
            f'<div class="k-campo">{titulo}<span class="sel">Elegí una opción{CHEV}</span></div></sc-if>'
            f'<sc-if value="{{{{pvAbierto}}}}" hint-placeholder-val="{{{{no}}}}"><div class="pv-hc"><span class="pv-x">‹</span>{titulo}</div><div class="pv-hb lst">{lista}</div></sc-if>'
            "</div></div></div>")


def acc_editor(cambios=False, guardando=False, nuevo=False, baja=False, lectura=False, menu=False, motivo="", abierto=False):
    """motivo: «Crear catálogo» grisado con el motivo en su tooltip (43); abierto, el tooltip a la vista."""
    if lectura:
        return ""
    if baja:
        return '<button type="button" class="cb cb-pri">Reactivar</button>'
    d = "" if (cambios and not guardando) else " disabled"
    g = f'{GIRA if guardando else ""}{"Crear catálogo" if nuevo else "Guardar cambios"}'
    desc = "Cancelar" if nuevo else "Descartar"
    primero = f'<button type="button" class="cb cb-sec"{"" if nuevo or (cambios and not guardando) else " disabled"}>{desc}</button>'
    segundo = f'<button type="button" class="cb cb-pri"{"" if nuevo else d}>{g}</button>'
    if motivo:
        segundo = tip(f'<button type="button" class="cb cb-pri">{g}</button>', motivo, abierto)
    kebab = "" if nuevo else (f'<button type="button" class="ib o-borde" aria-label="Más acciones del catálogo" aria-haspopup="menu" aria-expanded="{"true" if menu else "false"}">{KEBAB}</button>'
                             + (f'<div class="f-menu" role="menu" aria-label="Más acciones del catálogo"><span class="f-mi pel" role="menuitem">{QUITAR} Dar de baja</span></div>' if menu else ""))
    return primero + segundo + kebab


ACTIVO = '<span class="w-est">Activo</span>'
# De dónde salen las opciones va en la banda, al lado del estado (pedido del usuario, 25/10); en uno nuevo, con el punto neutro
ORIGEN_MANO, ORIGEN_MIEMBROS, ORIGEN_CONTACTOS = ('<span class="k-orig">· Escritas a mano</span>', '<span class="k-orig">· De los miembros</span>',
                                                 '<span class="k-orig">· De los contactos de WhatsApp</span>')
NUEVO_MANO, NUEVO_MIEMBROS, NUEVO_CONTACTOS = ('<span class="w-est off">Escritas a mano</span>', '<span class="w-est off">De los miembros</span>',
                                              '<span class="w-est off">De los contactos de WhatsApp</span>')
ESTADOS_EDITOR = ["Sin cambios", "Con cambios", "Agregar una opción", "Editar una opción", "Opción sin completar", "Código repetido", "Texto repetido",
                  "Texto de más de 30", "Acciones de una opción", "Más acciones", "Varias elegidas", "Vista previa abierta",
                  "Guardando", "Guardado", "No se guardó", "Otra persona guardó", "Más acciones del catálogo", "Dar de baja el catálogo", "Dado de baja",
                  "Sin opciones", "1.097 opciones", "10.000 opciones", "Nuevo catálogo", "Falta el nombre", "Solo lectura", "Cargando", "No existe"]


def filas_motivos(modo=""):
    h = ""
    for k, (n, cod, det, activa) in enumerate(OPS, 1):
        kw = {}
        if modo == "cambios" and k == 1:
            kw = dict(foco="texto")
            n = "Seguimiento programado"
        if modo == "codigo" and k == 2:
            kw = dict(err={"codigo": "Ya está en la opción 1."}, foco="codigo")
            cod = "SEG"
        if modo == "repetido" and k == 3:
            kw = dict(aviso="Otra opción tiene el mismo texto.", foco="texto")
            n = "Venta nueva"
        if modo == "largo" and k == 2:
            kw = dict(err={"texto": "Puede tener hasta 30 caracteres."}, foco="texto")
            n = "Venta nueva para clientes del interior"
        if modo == "elegidas" and k in (2, 3):
            kw = dict(elegida=True)
        if modo == "menu" and k == 3:
            kw = dict(menu=True)
        h += fila_editable(k, n, cod, det, activa, **kw)
        if modo == "editar" and k == 2:
            h += opcion_abierta()
    if modo == "agregar":
        h += fila_editable(5, "", "", "", True, foco="texto")
    if modo == "sin_completar":
        h += fila_editable(5, "", "", "", True, err={"texto": "Escribí el texto de la opción.", "codigo": "Escribí el código."})
    return h


PIE4 = '<div class="w-pie"><span>1–4 de 4</span><span>10 por página · Página 1 de 1</span></div>'
ITEMS_MOTIVOS = [(n, d) for n, _c, d, a in OPS if a]


def cuerpo_editor(opciones, catalogo=None, items=ITEMS_MOTIVOS, titulo="Motivo"):
    catalogo = catalogo or caja_catalogo("Motivos de visita", "Por qué se visita a un cliente.")
    return f'<div class="w-body"><div class="k-cab2">{catalogo}{vista_previa(items, titulo)}</div>{opciones}</div>'


def editor():
    tit = "Motivos de visita"
    b = lambda est=ACTIVO, **k: C.banda_k(tit, est + ORIGEN_MANO, acc_editor(**k))
    norm = caja_opciones(filas_motivos(), "4 opciones · 3 activas", PIE4)
    sucio = lambda modo: caja_opciones(filas_motivos(modo), "4 opciones · 3 activas", PIE4, modo="cambios")
    seleccion = ('<div class="k-sel">2 elegidas<button type="button" class="cb cb-sec">Dar de baja</button>'
                 '<button type="button" class="cb cb-sec" disabled>Reactivar</button><button type="button" class="cb cb-enl">Quitar la selección</button></div>')
    prov = "".join(fila_editable(k, n, cod, det, a) for k, (n, cod, det, a) in enumerate(PROVEEDORES, 1))
    pie_prov = '<div class="w-pie"><span>1–10 de 1.097</span><span>10 por página · Página 1 de 110</span></div>'
    cat_prov = caja_catalogo("Proveedores", "")
    items_prov = [(n, d) for n, _c, d, a in PROVEEDORES[:6] if a]
    pie_tope = '<div class="w-pie"><span>1–10 de 10.000</span><span>10 por página · Página 1 de 1.000</span></div>'
    lectura = caja_opciones("".join(fila_lectura(k, n, cod, det, a) for k, (n, cod, det, a) in enumerate(OPS, 1)), "4 opciones · 3 activas", PIE4, modo="lectura", tabla="kl")
    cargando = '<div class="w-body"><div class="f-cuerpo izq"><div class="esq"><span style="width: 60%;"></span><span style="width: 80%;"></span><span style="width: 70%;"></span></div></div></div>'
    no_existe = '<div class="w-body"><div class="w-caja"><div class="f-cuerpo"><b>No encontramos este catálogo.</b><a class="cb cb-sec" href="FRM-Catalogos.dc.html">Volver a Catálogos</a></div></div></div>'
    nuevo_op = caja_opciones("", "0 opciones", "", modo="nuevo", vacia=True)
    no_se_puede = '<span class="w-est mal">No se puede usar</span>' + F.info("No tiene opciones activas.")
    V = {
        "Sin cambios": (b(), cuerpo_editor(norm)),
        "Con cambios": (b(cambios=True), cuerpo_editor(sucio("cambios"))),
        "Agregar una opción": (b(cambios=True), cuerpo_editor(caja_opciones(filas_motivos("agregar"), "5 opciones · 4 activas", PIE4, modo="cambios"))),
        "Editar una opción": (b(cambios=True), cuerpo_editor(sucio("editar"))),
        "Opción sin completar": (b(cambios=True), cuerpo_editor(caja_opciones(filas_motivos("sin_completar"), "5 opciones · 4 activas", PIE4, modo="cambios"))),
        "Código repetido": (b(cambios=True), cuerpo_editor(sucio("codigo"))),
        "Texto repetido": (b(cambios=True), cuerpo_editor(sucio("repetido"))),
        "Texto de más de 30": (b(cambios=True), cuerpo_editor(sucio("largo"))),
        "Acciones de una opción": (b(), cuerpo_editor(caja_opciones(filas_motivos("menu"), "4 opciones · 3 activas", PIE4))),
        "Más acciones": (b(), cuerpo_editor(norm)),
        "Varias elegidas": (b(), cuerpo_editor(caja_opciones(filas_motivos("elegidas"), "4 opciones · 3 activas", PIE4, seleccion=seleccion))),
        "Vista previa abierta": (b(), cuerpo_editor(norm)),
        "Guardando": (b(cambios=True, guardando=True), cuerpo_editor(sucio("cambios"))),
        "Guardado": (b(), cuerpo_editor(norm)),
        "No se guardó": (b(cambios=True), cuerpo_editor(sucio("cambios"))),
        "Otra persona guardó": (b(cambios=True), cuerpo_editor(sucio("cambios"))),
        "Más acciones del catálogo": (b(menu=True), cuerpo_editor(norm)),
        "Dar de baja el catálogo": (b(), cuerpo_editor(norm)),
        "Dado de baja": (C.banda_k(tit, '<span class="w-est off">Dado de baja</span>' + ORIGEN_MANO, acc_editor(baja=True)),
                         cuerpo_editor(caja_opciones("".join(fila_lectura(k, n, cod, det, a) for k, (n, cod, det, a) in enumerate(OPS, 1)), "4 opciones · 3 activas", PIE4, modo="lectura", tabla="kl"),
                                       caja_catalogo("Motivos de visita", "Por qué se visita a un cliente.", lectura=True))),
        "Sin opciones": (b(no_se_puede), cuerpo_editor(caja_opciones("", "0 opciones", "", vacia=True), items=[])),
        "1.097 opciones": (C.banda_k("Proveedores", ACTIVO + ORIGEN_MANO, acc_editor()), cuerpo_editor(caja_opciones(prov, "1.097 opciones · 1.090 activas", pie_prov), cat_prov, items_prov, "Proveedor")),
        "10.000 opciones": (C.banda_k("Proveedores", ACTIVO + ORIGEN_MANO, acc_editor()), cuerpo_editor(caja_opciones(prov, "10.000 opciones · 9.912 activas", pie_tope, modo="tope"), cat_prov, items_prov, "Proveedor")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", NUEVO_MANO, acc_editor(nuevo=True)), cuerpo_editor(nuevo_op, caja_catalogo("", ""), items=[], titulo="Pregunta")),
        "Falta el nombre": (C.banda_k("Nuevo catálogo", NUEVO_MANO, acc_editor(nuevo=True)), cuerpo_editor(nuevo_op, caja_catalogo("", "", err_nombre=True), items=[], titulo="Pregunta")),
        "Solo lectura": (C.banda_k(tit, ACTIVO + ORIGEN_MANO, acc_editor(lectura=True)), cuerpo_editor(lectura, caja_catalogo("Motivos de visita", "Por qué se visita a un cliente.", lectura=True))),
        "Cargando": (C.banda_k(tit, "", ""), cargando),
        "No existe": (C.banda_k("Catálogo", "", ""), no_existe),
    }
    assert list(V) == ESTADOS_EDITOR
    dif = ('<div class="k-dif"><div><div class="c">Tus cambios</div><div class="g-det"><span class="k">Opción 1</span><span>Seguimiento programado</span>'
           '<span class="k">Opciones</span><span>4 · 3 activas</span></div></div>'
           '<div><div class="c">Lo guardado ahora</div><div class="g-det"><span class="k">Opción 1</span><span>Seguimiento</span>'
           '<span class="k">Opciones</span><span>5 · 4 activas</span></div></div></div>')
    capas = {
        "Guardado": A.toast("Guardamos el catálogo."),
        "No se guardó": A.toast("No pudimos guardar el catálogo. Lo que escribiste se conserva.", "mal"),
        "Otra persona guardó": F.dialogo("Otra persona guardó el catálogo", '<p class="d-tx">Laura Ríos lo guardó mientras lo editabas. Tus cambios se conservan hasta que elijas.</p>' + dif,
                                         '<button type="button" class="cb cb-sec">Seguir editando</button><button type="button" class="cb cb-pri">Ver lo nuevo</button>', una=False
                                         ).replace('class="w-dlg"', 'class="w-dlg" style="width: 720px;"', 1),
        "Dar de baja el catálogo": A.confirmar("¿Dar de baja «Motivos de visita»?", "Sus opciones dejan de poder elegirse. Se puede reactivar desde acá.", "Dar de baja"),
    }
    js = A.js_estados(ESTADOS_EDITOR, extra=(
        "      menuMas: k === 9, expMas: k === 9 ? 'true' : 'false', chkTodas: k === 10 ? ' medio' : '',\n"
        "      pvCerrado: k !== 11, pvAbierto: k === 11,\n"
        "      busqueda: 'Buscar opción', busClase: '',\n"))
    t = C.pagina_k("Catálogo escrito a mano · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Motivos de visita",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + A.CSS_AB + E.CSS_E12 + CSS_EDITOR, ESTADOS_EDITOR, js, alto=1200)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_EDITOR.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA)


# ================================================================ CA2 · Importar (y pegar)
ESTADOS_IMPORTAR = ["Archivo", "Pegar", "Archivo que no sirve", "Revisar: errores", "Revisar: altas", "Revisar: cambios", "Revisar: bajas",
                    "Muchas bajas", "Muchas filas con error", "Un valor ambiguo", "Aplicando", "Otra persona guardó", "Otra importación en curso"]
CSS_IMPORTAR = """.w-dlg.imp { width: 760px; }
.imp-pasos { display: flex; gap: 6px; grid-column: 1 / -1; }
.imp-pasos span { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border-radius: 999px; background: var(--s2); color: var(--t3); font-size: 12.5px; font-weight: 600; }
.imp-pasos span.on { background: var(--marca-t); color: var(--marca-tx); }
.imp-pasos span.hecho { color: var(--t2); }
.imp-seg { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); width: 280px; grid-column: 1 / -1; }
.imp-seg span { height: 30px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.imp-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.imp-zona { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 28px 16px; border: 1.5px dashed var(--borde2); border-radius: 12px; background: var(--s2); text-align: center; font-size: 13.5px; color: var(--t2); }
.imp-zona.mal { border-color: var(--peligro); }
.imp-zona b { color: var(--t1); font-size: 14px; }
.imp-pega { grid-column: 1 / -1; min-height: 150px; padding: 10px 12px; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; line-height: 1.7; color: var(--t1); white-space: pre; }
.imp-lin { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; color: var(--t2); }
.imp-lin a { color: var(--marca-tx); font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
.imp-chips { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px; }
.imp-chips span { height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--borde); font-size: 12.5px; color: var(--t2); display: inline-flex; align-items: center; }
.imp-chips span.mal { border-color: oklch(0.85 0.06 25); background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.imp-tabs { grid-column: 1 / -1; display: flex; gap: 4px; border-bottom: 1px solid var(--borde); }
.imp-tabs span { padding: 8px 12px; font-size: 13px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; }
.imp-tabs span.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.imp-tabs .c { margin-left: 5px; font-size: 12px; color: var(--t3); }
.imp-tabla { grid-column: 1 / -1; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 13px; }
.imp-tabla .c, .imp-tabla .f { display: grid; gap: 12px; padding: 0 12px; align-items: center; }
.imp-tabla .c { min-height: 34px; background: oklch(0.945 0.018 76); font-weight: 600; color: var(--t2); font-size: 12.5px; }
.imp-tabla .f { min-height: 38px; border-top: 1px solid var(--borde); }
.imp-tabla .f:nth-child(odd) { background: oklch(0.975 0.008 78); }
.imp-tabla .mono { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; color: var(--t2); }
.imp-tabla .tach { color: var(--t3); text-decoration: line-through; }
.imp-conf { grid-column: 1 / -1; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border: 1px solid var(--borde); border-radius: 10px; font-size: 13.5px; }
.imp-conf i { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--borde2); box-sizing: border-box; flex-shrink: 0; margin-top: 2px; background: #fff; }
.imp-conf b { font-weight: 600; }
.imp-franja { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: var(--peligro-t); color: oklch(0.45 0.17 25); font-size: 13.5px; }
.imp-franja span { flex: 1; }
.w-dlg.imp .db { max-height: 560px; overflow: auto; }
"""


def pasos_imp(n):
    nombres = ["1 · Archivo", "2 · Revisar", "3 · Aplicar"]
    return '<div class="imp-pasos">' + "".join(f'<span class="{"on" if k == n else "hecho" if k < n else ""}">{t}</span>' for k, t in enumerate(nombres)) + "</div>"


def tabla_imp(cols, plantilla, filas):
    c = f'<div class="c" style="grid-template-columns: {plantilla};">' + "".join(f"<span>{x}</span>" for x in cols) + "</div>"
    return '<div class="imp-tabla">' + c + "".join(f'<div class="f" style="grid-template-columns: {plantilla};">' + "".join(f"<span>{x}</span>" for x in f) + "</div>" for f in filas) + "</div>"


ERRORES = [("37", "Código", "Está repetido en la fila 52."), ("88", "Texto", "Tiene más de 30 caracteres.")]
ALTAS = [('<span class="mono">PRV-1098</span>', "Bulones Mar del Plata", "CUIT 30-71567890-2"), ('<span class="mono">PRV-1099</span>', "Cerámicos Neuquén", "CUIT 30-70412345-6"),
         ('<span class="mono">PRV-1100</span>', "Clavos del Oeste", "")]
CAMBIOS = [('<span class="mono">PRV-0002</span>', "Detalle", '<span class="tach">CUIT 30-70988123-4</span>', "CUIT 30-70988123-5"),
           ('<span class="mono">PRV-0010</span>', "Texto", '<span class="tach">Cementos del Plata</span>', "Cementos del Plata S.A.")]
BAJAS = [('<span class="mono">PRV-0005</span>', "Aluminios Cuyo"), ('<span class="mono">PRV-0331</span>', "Ferretería Lomas"), ('<span class="mono">PRV-0790</span>', "Pinturas Oeste")]


def dlg_importar(paso, pestana="errores", extra="", pie_modo="normal"):
    tit = "Importar opciones a «Proveedores»"
    if paso == "archivo":
        zona_mal = pie_modo == "mal"
        cuerpo = (pasos_imp(0) + '<div class="imp-seg" role="radiogroup"><span class="on" role="radio">Archivo</span><span role="radio">Pegar</span></div>'
                  f'<div class="imp-zona{" mal" if zona_mal else ""}">{IMPORTAR}<b>Elegí un archivo XLSX o CSV</b><button type="button" class="cb cb-sec">Elegir archivo</button></div>'
                  + ('<span class="err2" role="alert" style="grid-column: 1 / -1; font-size: 12.5px; color: var(--peligro);">El archivo no es un XLSX ni un CSV en UTF-8.</span>' if zona_mal else "")
                  + f'<div class="imp-lin"><span></span><a href="#">{PLANTILLA} Bajar la plantilla</a></div>')
        pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Revisar</button>'
    elif paso == "pegar":
        cuerpo = (pasos_imp(0) + '<div class="imp-seg" role="radiogroup"><span role="radio">Archivo</span><span class="on" role="radio">Pegar</span></div>'
                  '<div class="imp-pega">PRV-1098\tBulones Mar del Plata\tCUIT 30-71567890-2\nPRV-1099\tCerámicos Neuquén\tCUIT 30-70412345-6\nPRV-1100\tClavos del Oeste\t</div>'
                  f'<div class="imp-lin"><span>3 filas pegadas</span><a href="#">{PLANTILLA} Bajar la plantilla</a></div>')
        pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Revisar</button>'
    else:
        chips = ('<div class="imp-chips"><span>12 altas</span><span>5 cambios</span><span>3 bajas</span><span class="mal">2 filas con errores</span></div>')
        tabs = ('<div class="imp-tabs" role="tablist">' + "".join(f'<span class="{"on" if k == pestana else ""}" role="tab">{n}<span class="c">{c}</span></span>'
                                                            for k, n, c in [("errores", "Errores", 2), ("altas", "Altas", 12), ("cambios", "Cambios", 5), ("bajas", "Bajas", 3)]) + "</div>")
        if pestana == "errores":
            errores = ERRORES if pie_modo != "ambiguo" else [("3", "Valor", "«1.500» se lee de dos formas. Escribí 1500 o 1,5.")] + ERRORES
            tabla = tabla_imp(["Fila", "Columna", "Qué pasa"], "70px 120px minmax(0, 1fr)", errores)
        elif pestana == "altas":
            tabla = tabla_imp(["Código", "Texto", "Detalle"], "120px minmax(0, 1fr) minmax(0, 1fr)", ALTAS)
        elif pestana == "cambios":
            tabla = tabla_imp(["Código", "Columna", "Antes", "Ahora"], "110px 90px minmax(0, 1fr) minmax(0, 1fr)", CAMBIOS)
        else:
            tabla = tabla_imp(["Código", "Texto"], "120px minmax(0, 1fr)", BAJAS)
        archivo = '<div class="imp-lin"><span><b style="color: var(--t1);">proveedores.xlsx</b> · 1.106 filas leídas</span></div>'
        if pie_modo == "ambiguo":
            archivo = '<div class="imp-lin"><span><b style="color: var(--t1);">recargos.xlsx</b> · 7 filas leídas</span></div>'
            tit = "Importar opciones a «Recargo por zona»"
        # La franja de un 409 o de otra importación va arriba; la casilla que confirma, al pie, junto a «Aplicar»
        cuerpo = pasos_imp(1) + (extra if "imp-franja" in extra else "") + archivo + chips + tabs + tabla + (extra if "imp-conf" in extra else "")
        aplicar = "Aplicar sin las 2 filas con errores"
        if pie_modo == "bajas":
            pie = (f'<button type="button" class="cb cb-sec">Cancelar</button>'
                   + tip(f'<button type="button" class="cb cb-pri">{aplicar}</button>', "Confirmá las bajas para aplicar."))
        elif pie_modo == "errores10":
            pie = (f'<button type="button" class="cb cb-sec">Cancelar</button>'
                   + tip('<button type="button" class="cb cb-pri">Aplicar sin las 140 filas con errores</button>', "Confirmá que se aplica sin esas filas."))
        elif pie_modo == "aplicando":
            pie = f'<button type="button" class="cb cb-sec" disabled>Cancelar</button><button type="button" class="cb cb-pri" disabled>{GIRA}{aplicar}</button>'
        elif pie_modo == "409":
            pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Revisar de nuevo</button>'
        elif pie_modo == "ocupado":
            pie = '<button type="button" class="cb cb-sec">Cerrar</button>'
        else:
            pie = f'<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">{aplicar}</button>'
    return F.dialogo(tit, cuerpo, pie, una=False).replace('class="w-dlg"', 'class="w-dlg imp"', 1)


def importar():
    conf_bajas = ('<div class="imp-conf"><i></i><span><b>Dar de baja 412 opciones</b> (el 38 %). Lo que no viene en el archivo se da de baja, no se borra.</span></div>')
    conf_err = '<div class="imp-conf"><i></i><span><b>Aplicar sin las 140 filas con errores</b> (el 13 %).</span></div>'
    franja409 = f'<div class="imp-franja" role="alert">{ALERTA}<span>Otra persona guardó el catálogo. Revisá el archivo de nuevo.</span></div>'
    franja_ocupado = f'<div class="imp-franja" role="alert">{ALERTA}<span>Ya tenés una importación o una exportación en curso. Probá en un momento.</span></div>'
    capas = {
        "Archivo": dlg_importar("archivo"), "Pegar": dlg_importar("pegar"), "Archivo que no sirve": dlg_importar("archivo", pie_modo="mal"),
        "Revisar: errores": dlg_importar("revisar"), "Revisar: altas": dlg_importar("revisar", "altas"), "Revisar: cambios": dlg_importar("revisar", "cambios"),
        "Revisar: bajas": dlg_importar("revisar", "bajas"),
        "Muchas bajas": dlg_importar("revisar", "bajas", conf_bajas, "bajas"), "Muchas filas con error": dlg_importar("revisar", "errores", conf_err, "errores10"),
        "Un valor ambiguo": dlg_importar("revisar", "errores", "", "ambiguo"), "Aplicando": dlg_importar("revisar", "errores", "", "aplicando"),
        "Otra persona guardó": dlg_importar("revisar", "errores", franja409, "409"), "Otra importación en curso": dlg_importar("revisar", "errores", franja_ocupado, "ocupado"),
    }
    prov = "".join(fila_editable(k, n, cod, det, a) for k, (n, cod, det, a) in enumerate(PROVEEDORES, 1))
    pie_prov = '<div class="w-pie"><span>1–10 de 1.097</span><span>10 por página · Página 1 de 110</span></div>'
    fondo = (C.banda_k("Proveedores", ACTIVO + ORIGEN_MANO, acc_editor()),
             cuerpo_editor(caja_opciones(prov, "1.097 opciones · 1.090 activas", pie_prov), caja_catalogo("Proveedores", ""), [(n, d) for n, _c, d, a in PROVEEDORES[:6] if a], "Proveedor"))
    js = A.js_estados(ESTADOS_IMPORTAR, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Importar y pegar opciones", "Inicio / Formularios / Catálogos / Proveedores", fondo[0], fondo[1],
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + A.CSS_AB + E.CSS_E12 + CSS_EDITOR, ESTADOS_IMPORTAR, js, alto=1200)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_IMPORTAR.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA + CSS_IMPORTAR)


# ================================================================ CA3 · Tipo de valor
ESTADOS_TIPO = ["Con valores", "Valor de otro tipo", "Agregar una opción", "Falta el valor"]


def tipo_valor():
    tit = "Recargo por zona"

    def filas(modo=""):
        h = ""
        for k, (n, cod, det, val, a) in enumerate(ZONAS, 1):
            kw = {}
            if modo == "otro" and k == 3:
                kw = dict(err={"valor": "Escribí un número."}, foco="valor")
                val = "mil"
            h += fila_editable(k, n, cod, det, a, valor=val, **kw)
        if modo == "agregar":
            h += fila_editable(7, "", "", "", True, valor="", foco="texto")
        if modo == "falta":
            h += fila_editable(7, "Mendoza", "MZA", "", True, valor="", err={"valor": "Escribí el valor."})
        return h
    pie = '<div class="w-pie"><span>1–6 de 6</span><span>10 por página · Página 1 de 1</span></div>'
    cat = caja_catalogo(tit, "Cuánto se suma según la zona de entrega.", tipo="Decimal")
    items = [(n, d) for n, _c, d, _v, a in ZONAS if a]
    b = lambda **k: C.banda_k(tit, ACTIVO + ORIGEN_MANO, acc_editor(**k))
    V = {
        "Con valores": (b(), cuerpo_editor(caja_opciones(filas(), "6 opciones · 6 activas", pie, tabla="kv"), cat, items, "Zona")),
        "Valor de otro tipo": (b(cambios=True), cuerpo_editor(caja_opciones(filas("otro"), "6 opciones · 6 activas", pie, modo="cambios", tabla="kv"), cat, items, "Zona")),
        "Agregar una opción": (b(cambios=True), cuerpo_editor(caja_opciones(filas("agregar"), "7 opciones · 7 activas", pie, modo="cambios", tabla="kv"), cat, items, "Zona")),
        "Falta el valor": (b(cambios=True), cuerpo_editor(caja_opciones(filas("falta"), "7 opciones · 7 activas", pie, modo="cambios", tabla="kv"), cat, items, "Zona")),
    }
    js = A.js_estados(ESTADOS_TIPO, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Catálogo con tipo de valor · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Recargo por zona",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + A.CSS_AB + E.CSS_E12 + CSS_EDITOR, ESTADOS_TIPO, js, alto=1000)
    return t


# ================================================================ Con filtros: los miembros (redibujado) y los contactos de WhatsApp (55)
CSS_FILTROS = """.f-cols.k4 { grid-template-columns: minmax(0, 1fr) 300px; }
.k-pv2 { gap: 10px; }
.k-pv2 .tel { min-height: 560px; }
.k-persona { position: relative; }
.k-persona .ct { display: flex; justify-content: space-between; align-items: center; height: 40px; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 14px; box-sizing: border-box; }
.k-persona .ph { color: var(--t3); }
.k-persona .f-mn.k-pers { top: 70px; left: 0; right: 0; width: auto; }
.k-persona .ct.mal { border-color: var(--peligro); }
.k-persona .err2 { font-size: 12.5px; color: var(--peligro); }
.f-mn.k-pers > span { flex-direction: column; align-items: flex-start; justify-content: center; gap: 1px; min-height: 48px; }
.f-mn.k-pers small { font-size: 12px; color: var(--t3); font-weight: 400; }
.k-aviso { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: oklch(0.5 0.19 25); }
.tel .k-vacio2 { padding: 40px 14px; text-align: center; font-size: 12.5px; color: oklch(0.5 0.01 150); }
.tel .k-esq { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.tel .k-esq span { height: 10px; border-radius: 5px; background: oklch(0.93 0.01 150); }
.k-g2 .ct.sel, .k-g3 .ct.sel { display: flex; justify-content: space-between; align-items: center; }
.k-prev .q .ct { height: 40px; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 14px; box-sizing: border-box; }
.k-pie2 { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 12.5px; color: var(--t3); background: var(--s2); }
.k-pie2.mal { color: oklch(0.5 0.19 25); }
.k-cond .f-mn.k-tags { left: auto; right: 40px; top: 44px; width: 240px; }
.k-cond { position: relative; }
.k-cond .ct { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.w-body .w-caja:has(.k-tags) { overflow: visible; }
"""
MIEMBROS = C.MIEMBROS
# 81: Carla Ruiz escribió sin nombre y aparece con el de su perfil; el teléfono nunca se ve
CONTACTOS_EJ = [("Carla Ruiz", "Minorista"), ("Corralón El Puente", "Mayorista"), ("Ferretería Rosales", "Mayorista"), ("Juan Pérez", "Minorista")]


def cond(si, col, op, val, mal=False, menu=""):
    return (f'<div class="k-cond"><span class="si">{si}</span><div class="ct">{col}{CHEV}</div><div class="ct">{op}{CHEV}</div>'
            f'<div class="ct{" mal" if mal else ""}">{val}{CHEV}</div><button type="button" class="ib" aria-label="Quitar condición">{X}</button>{menu}</div>')


def seccion_miembros(rol_borrado=False):
    val_rol = "Rol no disponible" if rol_borrado else '<span class="k-chip">Supervisor ×</span>'
    conds = (cond("Si", "Rol", "tiene alguno de", val_rol, mal=rol_borrado) + cond("Y", "Activo", "es", "Sí")
             + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar condición</button>')
    err = '<span class="err2" role="alert" style="font-size: 12.5px; color: var(--peligro);">Ese rol ya no existe. Elegí otro.</span>' if rol_borrado else ""
    return ('<div class="w-caja"><div class="f-cab"><span>Qué miembros entran</span></div><div class="k-sec">'
            '<div class="k-g3">'
            f'<div class="w-cmp"><span class="rt">Texto de cada opción</span><div class="ct sel">Nombre{CHEV}</div></div>'
            f'<div class="w-cmp"><span class="rt">Detalle</span><div class="ct sel">Empresa{CHEV}</div></div>'
            f'<div class="w-cmp"><span class="rt">Orden</span><div class="ct sel">Nombre, A → Z{CHEV}</div></div></div>'
            f'<div class="k-conds">{conds}</div>{err}'
            f'<span class="k-chk2"><i>{TILDE}</i><span>Sin incluir a quien lo recibe{F.info("Nadie se elige a sí mismo.")}</span></span>'
            "</div></div>")


def seccion_contactos(menu=False):
    tags = ""
    if menu:
        tags = ('<span class="f-mn k-tags" role="listbox" aria-label="Etiquetas"><span role="option" class="on">Mayorista<span class="cnt">12</span></span>'
                '<span role="option" class="on">Minorista<span class="cnt">30</span></span><span role="option">Obra<span class="cnt">8</span></span>'
                '<span role="option">VIP<span class="cnt">4</span></span></span>')
    conds = (cond("Si", "Etiqueta", "tiene alguna de", "Mayorista, Minorista", menu=tags)
             + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar condición</button>')
    return ('<div class="w-caja"><div class="f-cab"><span>Qué contactos entran</span></div><div class="k-sec">'
            '<div class="k-g3">'
            '<div class="w-cmp"><span class="rt">Texto de cada opción</span><div class="ct ro">Nombre</div></div>'
            f'<div class="w-cmp"><span class="rt">Detalle</span><div class="ct sel">Etiquetas{CHEV}</div></div>'
            f'<div class="w-cmp"><span class="rt">Orden</span><div class="ct sel">Nombre, A → Z{CHEV}</div></div></div>'
            f'<div class="k-conds">{conds}</div></div></div>')


def prev(modo, items=MIEMBROS, titulo="Supervisor", contactos=False):
    """El teléfono al costado, como en el catálogo escrito a mano, con la lista tal como la ve quien la recibe. Arriba, solo el
    desplegable «Persona», porque la lista depende de quién recibe, y se actualiza sola: sin «Vista previa», «Como si lo
    recibiera», «Probar» ni la cuenta de opciones (el usuario, 25/10, v143). Con más de 200, el teléfono termina con «y N opciones
    más», sin texto debajo: lo frena publicar el formulario (22 y 37, maqueta c131368)."""
    sin = modo in ("sin_persona", "falta")
    if contactos:
        persona = "Ninguna"
        opciones = '<span role="option" class="on">Ninguna</span>' + "".join(f'<span role="option">{n}</span>' for n, _d in CONTACTOS_EJ)
    else:
        persona = '<span class="ph">Elegí a quién</span>' if sin else "Tomás Acosta · Delta S.A."
        opciones = ('<span role="option" class="on">Tomás Acosta<small>Delta S.A. · Vendedor</small></span>'
                    '<span role="option">Lucía Fernández<small>Delta S.A. · Dueña</small></span><span role="option">Martín Paz<small>Delta S.A. · Supervisor</small></span>')
    menu = f'<span class="f-mn k-pers" role="listbox" aria-label="Persona">{opciones}</span>' if modo == "elegir" else ""
    err = '<span class="err2" role="alert">Elegí una persona.</span>' if modo == "falta" else ""
    req = "" if contactos else ' <span class="req">*</span>'
    sel = (f'<div class="w-cmp k-persona"><span class="rt">Persona{req}</span><div class="ct sel{" mal" if err else ""}" role="combobox">{persona}{CHEV}</div>'
           f"{menu}{err}</div>")

    def filas(xs):
        return "".join(f'<div class="k-li"><span class="t">{n}' + (f"<small>{d}</small>" if d else "") + "</span><i></i></div>" for n, d in xs)
    if modo == "probando":
        hb = '<div class="k-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 70%;"></span></div>'
    elif modo == "ninguna":
        hb = '<div class="k-vacio2">Ninguna opción</div>'
    elif sin:
        hb = ""
    elif modo == "mas200":
        hb = filas(items) + f'<div class="k-mas">y {215 - len(items)} opciones más</div>'
    else:
        hb = filas(items)
    tel = (f'<div class="tel" aria-label="Así lo ve quien lo recibe"><div class="pv-hoja"><div class="pv-hc"><span class="pv-x">‹</span>{titulo}</div>'
           f'<div class="pv-hb lst">{hb}</div></div></div>')
    return f'<div class="k-pv k-pv2">{sel}{tel}</div>'


ESTADOS_MIEMBROS = ["Sin cambios", "Con cambios", "Elegir a quién", "Actualizando", "Ninguna opción", "Más de 200", "Rol que ya no existe", "Nuevo catálogo",
                    "Crear sin persona", "Guardado"]


def miembros():
    tit = "Supervisores"

    def cuerpo(p, rol_borrado=False, nombre="Supervisores", desc="Quienes pueden aprobar una visita."):
        return ('<div class="w-body"><div class="f-cols k4"><div class="f-pila">' + caja_catalogo(nombre, desc, origen="De los miembros", tipo="")
                + seccion_miembros(rol_borrado) + "</div>" + prev(p) + "</div></div>")
    nomas = '<span class="w-est mal">No se puede usar</span>' + F.info("Un rol de los filtros ya no existe.")
    b = lambda **k: C.banda_k(tit, ACTIVO + ORIGEN_MIEMBROS, acc_editor(**k))
    V = {
        "Sin cambios": (b(), cuerpo("lista")),
        "Con cambios": (b(cambios=True), cuerpo("sucio")),
        "Elegir a quién": (b(cambios=True), cuerpo("elegir")),
        "Actualizando": (b(cambios=True), cuerpo("probando")),
        "Ninguna opción": (b(cambios=True), cuerpo("ninguna")),
        "Más de 200": (b(cambios=True), cuerpo("mas200")),
        "Rol que ya no existe": (C.banda_k("Responsables de obra", nomas + ORIGEN_MIEMBROS, acc_editor()), cuerpo("lista", True, "Responsables de obra", "Supervisores y jefes de obra.")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", NUEVO_MIEMBROS, acc_editor(nuevo=True)), cuerpo("sin_persona", nombre="", desc="")),
        "Crear sin persona": (C.banda_k("Nuevo catálogo", NUEVO_MIEMBROS, acc_editor(nuevo=True)),
                                   cuerpo("falta", nombre="Responsables de depósito", desc="")),
        "Guardado": (b(), cuerpo("lista")),
    }
    assert list(V) == ESTADOS_MIEMBROS
    capas = {"Guardado": A.toast("Guardamos el catálogo.")}
    t = C.pagina_k("Catálogo de los miembros · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Supervisores",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + C.CSS_K4 + CSS_EDITOR + CSS_FILTROS, ESTADOS_MIEMBROS, A.js_estados(ESTADOS_MIEMBROS), alto=1000)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_MIEMBROS.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over)


ESTADOS_CONTACTOS = ["Sin cambios", "Con cambios", "Elegir etiquetas", "Elegir a quién", "Actualizando", "Ninguna opción", "Más de 200", "Sin WhatsApp", "Nuevo catálogo", "Guardado"]


def contactos():
    tit = "Clientes"

    def cuerpo(p, menu=False, nombre="Clientes", desc="A quiénes se les entrega o se visita."):
        return ('<div class="w-body"><div class="f-cols k4"><div class="f-pila">' + caja_catalogo(nombre, desc, origen="De los contactos de WhatsApp", tipo="")
                + seccion_contactos(menu) + "</div>" + prev(p, items=CONTACTOS_EJ, titulo="Cliente", contactos=True) + "</div></div>")
    sin_wa = '<span class="w-est mal">No se puede usar</span>' + F.info("La organización no tiene WhatsApp.")
    b = lambda **k: C.banda_k(tit, ACTIVO + ORIGEN_CONTACTOS, acc_editor(**k))
    V = {
        "Sin cambios": (b(), cuerpo("lista")),
        "Con cambios": (b(cambios=True), cuerpo("sucio")),
        "Elegir etiquetas": (b(cambios=True), cuerpo("sucio", menu=True)),
        "Elegir a quién": (b(cambios=True), cuerpo("elegir")),
        "Actualizando": (b(cambios=True), cuerpo("probando")),
        "Ninguna opción": (b(cambios=True), cuerpo("ninguna")),
        "Más de 200": (b(cambios=True), cuerpo("mas200")),
        "Sin WhatsApp": (C.banda_k(tit, sin_wa + ORIGEN_CONTACTOS, acc_editor()), cuerpo("sucio")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", NUEVO_CONTACTOS, acc_editor(nuevo=True)), cuerpo("sucio", nombre="", desc="")),
        "Guardado": (b(), cuerpo("lista")),
    }
    assert list(V) == ESTADOS_CONTACTOS
    capas = {"Guardado": A.toast("Guardamos el catálogo.")}
    t = C.pagina_k("Catálogo de los contactos · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Clientes",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + C.CSS_K4 + CSS_EDITOR + CSS_FILTROS, ESTADOS_CONTACTOS,
                   A.js_estados(ESTADOS_CONTACTOS), alto=1000)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_CONTACTOS.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over)


# ================================================================ Teléfono: una app; el editor, por opción (§10)
CSS_T12 = """.ap-fila .l2 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ap-cmp .ay.aviso2 { color: oklch(0.45 0.1 70); }
.k-prev .pie .ap-i, .q-row .tx .ap-i { vertical-align: -4px; }
.ap-mas { padding: 8px 4px 0; font-size: 13px; color: var(--t3); }
"""
TEL_DESTINO = {"FRM-Catalogo": "M-FRM-Catalogo", "FRM-Catalogo-Tipo": "M-FRM-Catalogo", "FRM-Catalogo-Filtros": "M-FRM-Catalogo-Filtros",
               "FRM-Catalogo-Contactos": "M-FRM-Catalogo-Filtros"}
ESTADOS_TL = ["Todos", "Filtros", "Sin coincidencias", "Cargando", "Vacío", "Error", "Nuevo catálogo"]
TILDE18 = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")
TILDE14 = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")


def t_info(motivo):
    return f'<button type="button" class="ap-i" aria-label="Por qué" title="{motivo}">{F.TINFO}</button>'


def tel_lista(con_usan=False):
    filas = ""
    for n, desc, origen, sub, ops, usan, clase, estado, motivo, destino in CATS:
        o = origen + ("" if ops == "—" else f" · {ops} opciones") + (f" · {usan}" if con_usan and usan != "—" else "")
        filas += (f'<a class="ap-fila" href="{TEL_DESTINO[destino]}.dc.html"><div class="tx"><span class="l1">{n}</span><span class="l2">{o}</span>'
                  f'<span class="l3"><span class="w-est {clase}">{estado}</span>{t_info(motivo) if motivo else ""}</span></div></a>')
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-WA-Menu.dc.html">{F.TVOLVER}</a><div class="tit"><h1>Catálogos</h1><span class="sub">Formularios</span></div>'
           f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button></div>')
    fab = f'<a class="ap-fab" aria-label="Nuevo catálogo" href="#">{F.TFAB}</a>'

    def lista(cuerpo):
        return bar + f'<div class="ap-cuerpo">{cuerpo}</div>' + fab
    esq = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div>'
    cuerpo = {"Todos": lista(filas), "Filtros": lista(filas),
              "Sin coincidencias": lista('<div class="ap-vacio">Ningún catálogo coincide con los filtros.<button type="button" class="cb cb-sec">Limpiar filtros</button></div>'),
              "Cargando": lista(esq), "Vacío": lista('<div class="ap-vacio">Todavía no hay catálogos.</div>'),
              "Error": lista('<div class="ap-vacio">No pudimos cargar los catálogos.<button type="button" class="cb cb-sec">Reintentar</button></div>'),
              "Nuevo catálogo": lista(filas)}

    def grupo(tit, ops):
        return f'<div class="p-tit2">{tit}</div>' + "".join(f'<span class="t-opc {"on" if k == 0 else ""}">{n}<span class="d">{c}{TILDE18 if k == 0 else ""}</span></span>'
                                                         for k, (n, c) in enumerate(ops))
    filtros_h = (grupo("Origen", [("Todos los orígenes", 7), ("Escritas a mano", 4), ("De los miembros", 2), ("De los contactos de WhatsApp", 1)])
                 + grupo("Estado", [("Todos los estados", 7), ("Activo", 5), ("No se puede usar", 1), ("Dado de baja", 1)]))

    def op(on, titulo, texto):
        return (f'<div class="k-op{" on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><span class="rd"></span>'
                f'<span class="tx"><b>{titulo}</b><span>{texto}</span></span></div>')
    nuevo_h = ('<div class="p-tit2">De dónde salen las opciones</div>'
               + op(True, "Escribirlas a mano", "Para listas que mantiene una persona.")
               + op(False, "Tomarlas de los miembros, con filtros", "Se arma sola con los miembros que cumplen los filtros.")
               + op(False, "Tomarlas de los contactos de WhatsApp", "Se arma sola con los contactos de Clientes, por etiqueta.")
               + F.tcampo("Tipo de valor", "Texto", select=True))
    capas = {"Filtros": F.thoja("Filtros", filtros_h, '<button type="button" class="cb cb-pri">Ver 7 catálogos</button>').replace('<div class="hb">', '<div class="hb lst">', 1),
             "Nuevo catálogo": F.thoja("Nuevo catálogo", nuevo_h, '<button type="button" class="cb cb-sec">Cancelar</button><a class="cb cb-pri" href="M-FRM-Catalogo.dc.html">Continuar</a>')}
    return C.tel_pagina(cuerpo, ESTADOS_TL, capas, "Catálogos · teléfono", F.CSS_TFILTRO + CSS_T12)


ESTADOS_TE = ["Sin cambios", "Con cambios", "Acciones de una opción", "Editar una opción", "Agregar una opción", "Código repetido", "Texto repetido",
              "Más acciones", "Así lo ve quien lo recibe", "Dar de baja el catálogo", "Guardado", "Sin opciones", "Solo lectura"]


def tel_ro(rotulo, valor):
    """La A11 en el teléfono: el mismo campo, apagado."""
    return f'<div class="ap-cmp"><span class="rt"><span>{rotulo}</span></span><div class="ct ro">{valor}</div></div>'


def tel_editor():
    der = (f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{F.OJO}</button>'
           f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>')

    def campos(lectura=False):
        if lectura:
            return (tel_ro("Nombre", "Motivos de visita") + tel_ro("Tipo de valor", "Texto")
                    + tel_ro("Descripción", "Por qué se visita a un cliente."))
        return (F.tcampo("Nombre", "Motivos de visita", req=True) + tel_ro("Tipo de valor", "Texto")
                + F.tcampo("Descripción", "Por qué se visita a un cliente."))

    def opciones(vacia=False, lectura=False, cambio=False):
        if vacia:
            return '<div class="t-vacia">Todavía no hay opciones.</div>'
        h = ""
        for k, (n, cod, det, activa) in enumerate(OPS, 1):
            n = "Seguimiento programado" if cambio and k == 1 else n
            chip = "" if activa else '<span class="t-chip" style="border-color: var(--borde); background: var(--s2); color: var(--t3);">Dada de baja</span>'
            kebab = "" if lectura else f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button>'
            h += (f'<div class="q-row{"" if activa else " baja"}"><span class="num">{k}</span><span class="tx"><b>{n}<span class="cod">{cod}</span>{chip}</b><span>{det}</span></span>'
                  f"{kebab}</div>")
        return h

    def cuerpo(sub="Activo", vacia=False, lectura=False, cambio=False, fijo=""):
        agregar = "" if lectura else '<a href="#">Agregar opción</a>'  # la acción entera, como en la compu (la Guía, 26/10)
        return (C.t_bar("Motivos de visita", sub, derecha=der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">' + campos(lectura) + "</div>"
                + f'<div class="ap-gtit">Opciones{agregar}</div><div class="ap-grupo">' + opciones(vacia, lectura, cambio) + '</div><div style="height: 20px;"></div></div>' + fijo)
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    snack = f'<div class="f-snack" role="status"><span class="ok">{F.OK}</span><span class="tx">Guardamos el catálogo.</span></div>'
    Cu = {"Sin cambios": cuerpo(), "Con cambios": cuerpo(cambio=True, fijo=fijo), "Acciones de una opción": cuerpo(), "Editar una opción": cuerpo(fijo=fijo),
          "Agregar una opción": cuerpo(fijo=fijo), "Código repetido": cuerpo(fijo=fijo), "Texto repetido": cuerpo(fijo=fijo), "Más acciones": cuerpo(),
          "Así lo ve quien lo recibe": cuerpo(), "Dar de baja el catálogo": cuerpo(), "Guardado": cuerpo() + snack, "Sin opciones": cuerpo("No se puede usar", vacia=True),
          "Solo lectura": cuerpo(lectura=True)}

    def editar(n="Venta nueva", cod="VEN", det="Primera visita a un cliente", err=False, aviso=False):
        c = F.tcampo("Código", cod or "Código", req=True, vacio=not cod)
        if err:
            c = c.replace('<div class="ct">', '<div class="ct mal">', 1).replace("</div></div>", '</div><span class="t-err" role="alert">Ya está en la opción 1.</span></div>', 1)
        extra = f'<span class="ay" style="align-self: flex-end;">{len(n)}/30</span>'
        if aviso:
            extra = '<span class="ay aviso2">Otra opción tiene el mismo texto.</span>' + extra
        texto = F.tcampo("Texto", n or "Texto", req=True, vacio=not n).replace("</div></div>", f"</div>{extra}</div>", 1)
        return texto + c + F.tcampo("Detalle", det or "Opcional", vacio=not det) + f'<span class="t-chk"><i class="on">{TILDE14}</i>Activa</span>'
    pie = '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'
    items = [(n, d) for n, _c, d, a in OPS if a]
    vista = ('<div class="ap-grupo k-prev" style="margin: 0;">' + "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in items) + "</div>")
    mas = ('<div class="ap-acciones2"><span role="menuitem">Exportar</span><span role="menuitem">Descargar la plantilla</span><span role="menuitem">Ordenar de la A a la Z</span>'
           '<span role="menuitem">Generar los códigos que faltan</span><span class="pel" role="menuitem">Dar de baja el catálogo</span></div>')
    capas = {
        "Acciones de una opción": F.thoja("Reclamo", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span role="menuitem">Subir</span><span role="menuitem">Bajar</span>'
                                          '<span class="pel" role="menuitem">Dar de baja</span></div>', ""),
        "Editar una opción": F.thoja("Editar opción", editar(), pie),
        "Agregar una opción": F.thoja("Nueva opción", editar("", "", ""), pie),
        "Código repetido": F.thoja("Editar opción", editar("Venta nueva", "SEG", err=True), pie),
        "Texto repetido": F.thoja("Editar opción", editar("Venta nueva", "REC", "Hay un problema para resolver", aviso=True), pie),
        "Más acciones": F.thoja("Motivos de visita", mas, ""),
        "Así lo ve quien lo recibe": F.thoja("Así lo ve quien lo recibe", vista, ""),
        "Dar de baja el catálogo": F.thoja("¿Dar de baja «Motivos de visita»?", '<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">Sus opciones dejan de poder '
                                           'elegirse. Se puede reactivar desde acá.</p>',
                                           '<button type="button" class="cb cb-pel lleno">Dar de baja</button><button type="button" class="cb cb-sec">Cancelar</button>'),
    }
    return C.tel_pagina(Cu, ESTADOS_TE, capas, "Catálogo escrito a mano · teléfono", E.CSS_E12 + CSS_T12)


ESTADOS_TF = ["Sin cambios", "Con cambios", "Acciones de una condición", "Editar una condición", "Así lo ve quien lo recibe", "Elegir a quién", "Actualizando",
              "Ninguna opción", "Más de 200", "Rol que ya no existe"]


def tel_filtros():
    """Como el escrito a mano: la lista va en la hoja del ojo, con el desplegable «Persona» arriba, y se actualiza sola (v143)."""
    der = f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{F.OJO}</button>'

    def cuerpo(rol_borrado=False, titulo="Supervisores", sub="Activo"):
        conds = [("Si · Rol", "tiene alguno de Supervisor"), ("Y · Activo", "es Sí")]
        if rol_borrado:
            conds[0] = ("Si · Rol", '<span class="mal">Rol no disponible</span>' + t_info("Ese rol ya no existe. Elegí otro."))
        filas = "".join(f'<div class="q-row"><span class="tx"><b>{a}</b><span>{b}</span></span><button type="button" class="ap-ib" aria-label="Acciones de la condición">{F.TKEBAB}</button></div>'
                        for a, b in conds)
        otras = ('<div class="ap-dato"><span class="k">Texto de cada opción</span><span class="v">Nombre</span></div>'
                 '<div class="ap-dato"><span class="k">Detalle</span><span class="v">Empresa</span></div>'
                 '<div class="ap-dato"><span class="k">Orden</span><span class="v">Nombre, A → Z</span></div>'
                 '<div class="ap-dato"><span class="k">Sin incluir a quien lo recibe</span><span class="v">Sí</span></div>')
        desc = "Quienes pueden aprobar una visita." if titulo == "Supervisores" else "Supervisores y jefes de obra."
        return (C.t_bar(titulo, sub, derecha=der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">'
                + F.tcampo("Nombre", titulo, req=True) + F.tcampo("Descripción", desc) + "</div>"
                + f'<div class="ap-gtit">Qué miembros entran<a href="#">Agregar condición</a></div><div class="ap-grupo">{filas}</div>'
                + f'<div class="ap-gtit">Otras opciones</div><div class="ap-grupo">{otras}</div><div style="height: 20px;"></div></div>')
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    Cu = {"Sin cambios": cuerpo(), "Con cambios": cuerpo() + fijo, "Acciones de una condición": cuerpo(), "Editar una condición": cuerpo() + fijo,
          "Así lo ve quien lo recibe": cuerpo(), "Elegir a quién": cuerpo(), "Actualizando": cuerpo() + fijo, "Ninguna opción": cuerpo() + fijo,
          "Más de 200": cuerpo() + fijo, "Rol que ya no existe": cuerpo(rol_borrado=True, titulo="Responsables de obra", sub="No se puede usar")}
    pie = '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'

    def vista(modo):
        persona = F.tcampo("Persona", "Tomás Acosta · Delta S.A.", req=True, select=True)
        if modo == "probando":
            lista = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span></div>'
        elif modo == "ninguna":
            lista = '<div class="ap-grupo k-prev" style="margin: 0;"><div class="vacio2">Ninguna opción</div></div>'
        else:
            lista = '<div class="ap-grupo k-prev" style="margin: 0;">' + "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in MIEMBROS) + "</div>"
        if modo == "mas200":
            lista += f'<div class="ap-mas">y {215 - len(MIEMBROS)} opciones más</div>'
        return persona + lista
    personas = "".join(f'<span class="t-opc {"on" if k == 0 else ""}">{n}<span class="d">{d}{TILDE18 if k == 0 else ""}</span></span>'
                       for k, (n, d) in enumerate([("Tomás Acosta", "Vendedor"), ("Lucía Fernández", "Dueña"), ("Martín Paz", "Supervisor")]))
    capas = {
        "Acciones de una condición": F.thoja("Si · Rol", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span class="pel" role="menuitem">Quitar</span></div>', ""),
        "Editar una condición": F.thoja("Editar condición", F.tcampo("Columna", "Rol", select=True) + F.tcampo("Comparación", "tiene alguno de", select=True)
                                        + F.tcampo("Valor", "Supervisor", select=True), pie),
        "Así lo ve quien lo recibe": F.thoja("Así lo ve quien lo recibe", vista("lista"), ""),
        "Elegir a quién": F.thoja("Persona", '<span class="w-bus" style="width: auto;">' + F.BUSCAR + " Buscar persona</span>" + personas, "").replace(
            '<div class="hb">', '<div class="hb lst">', 1),
        "Actualizando": F.thoja("Así lo ve quien lo recibe", vista("probando"), ""),
        "Ninguna opción": F.thoja("Así lo ve quien lo recibe", vista("ninguna"), ""),
        "Más de 200": F.thoja("Así lo ve quien lo recibe", vista("mas200"), ""),
    }
    return C.tel_pagina(Cu, ESTADOS_TF, capas, "Catálogo de los miembros · teléfono", F.CSS_TFILTRO + CSS_T12)


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Catalogos": ("Formularios · Catálogos", 900), "FRM-Catalogos-14": ("Formularios · Catálogos · etapa 14", 900),
           "FRM-Catalogo-Nuevo": ("Formularios · nuevo catálogo", 900), "FRM-Catalogo": ("Formularios · catálogo escrito a mano", 1200),
           "FRM-Catalogo-Importar": ("Formularios · importar y pegar opciones", 1200), "FRM-Catalogo-Tipo": ("Formularios · catálogo con tipo de valor", 1000),
           "FRM-Catalogo-Filtros": ("Formularios · catálogo de los miembros", 1000), "FRM-Catalogo-Contactos": ("Formularios · catálogo de los contactos", 1000),
           "M-FRM-Catalogos": ("Catálogos · teléfono", 844), "M-FRM-Catalogos-14": ("Catálogos · teléfono · etapa 14", 844),
           "M-FRM-Catalogo": ("Catálogo escrito a mano · teléfono", 844), "M-FRM-Catalogo-Filtros": ("Catálogo de los miembros · teléfono", 844)}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    b = c["boards"]
    for n, (titulo, alto) in TITULOS.items():
        v = b.setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=390 if n.startswith("M-") else 1440, h=alto, page="formularios", title=titulo + ("" if APROBADO else PARA_APROBAR))
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def comprobar(n, t):
    html = t[:t.index('<script type="text/x-dc"')]  # sin el JS del tablero (el primer <script> es el de support.js)
    html = re.sub(r'\s(?:title|aria-label)="[^"]*"', "", html)  # lo que va en un ⓘ o en un tooltip no cuenta
    for prohibido in ("Textos en", "Cambios sin guardar", "No se cambia", "Guardando…", "Diseñar formularios", "FRM-Listado", "English", "probado hoy",
                      "Una opción</span>", "De dónde salen</span></span>", "Como si lo recibiera", "probado el", ">Probar<", ">Vista previa<",
                      "Más de 200 opciones"):
        assert prohibido not in html, (n, prohibido)
    if n in ("FRM-Catalogos", "M-FRM-Catalogos"):
        assert "Lo usan" not in html and " formulario<" not in html, n


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    tableros = {
        "FRM-Catalogos": pagina_lista("Catálogos · /org/formularios/catalogos", ESTADOS_LISTA, "e"),
        "FRM-Catalogos-14": pagina_lista("Catálogos · /org/formularios/catalogos", ESTADOS_LISTA, "e", con_usan=True),
        "FRM-Catalogo-Nuevo": nuevo(), "FRM-Catalogo": editor(), "FRM-Catalogo-Importar": importar(), "FRM-Catalogo-Tipo": tipo_valor(),
        "FRM-Catalogo-Filtros": miembros(), "FRM-Catalogo-Contactos": contactos(),
        "M-FRM-Catalogos": tel_lista(), "M-FRM-Catalogos-14": tel_lista(con_usan=True), "M-FRM-Catalogo": tel_editor(), "M-FRM-Catalogo-Filtros": tel_filtros(),
    }
    for n, t in tableros.items():
        t = L.sin_disenar(n, E.post(n, t))
        comprobar(n, t)
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    registrar()
    print("tableros", list(tableros))
