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
- M-FRM-Catalogo-Contactos: un catálogo de los contactos en el teléfono (14-texto-diseno.md), como el de los miembros.
Desde la v147, el filtro «Estado» de la lista dice «Activos» y «Dados de baja» (12-catalogos.md y 14-texto-diseno.md): «No se puede
usar» es un estado del catálogo, que sigue en la fila, y cuenta entre los activos. La lista de la 14 suma «Productos», su catálogo de ejemplo.
Desde la v148 (12-texto-diseno.md y la §10 de 12-catalogos.md, con las decisiones 115, 117 y 120), sobre CO1-B e IM1 a IM3 de ArquitecturaBase, adaptados:
- FRM-Catalogo-Opciones y M-FRM-Catalogo-Opciones, nuevos: las opciones en un modal, con la lista y la opción. Una guardada no se quita: se da de baja.
- FRM-Catalogo pierde la fila vacía, «Opción sin completar» y «Pegar desde Excel» del ⋮: «Agregar opción» y «Editar» abren el modal.
- FRM-Catalogo-Importar: un solo diálogo, con «Origen» y «Revisión» a la vista, sin pasos numerados, y lo pegado en una grilla con las columnas del catálogo.
- Mientras trabaja, el botón pone el aro y su gerundio, con su color (`trabaja`).
Desde la v150 (decisiones 125 a 129), el armado real de ArquitecturaBaseFront, con nuestras piezas:
- FRM-Catalogo: «El catálogo» dice de dónde salen y el tipo, con el nombre y la descripción debajo; al costado, «Así lo ve quien lo recibe», con «Una opción | Varias».
- El encabezado de Opciones trae a la vista «Agregar opción», «Importar» y «Exportar»; el ⋮, la plantilla, el orden y los códigos.
- Cada opción muestra ↑ ↓ ✎ 🗑 y su Estado es una casilla. 🗑 borra al guardar la que nada usa; una dada de baja cambia ✎ por «Reactivar».
- «Dar de baja» va a la vista en la banda, sin ⋮ propio.

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
GIRA, trabaja = E.GIRA, E.trabaja
PEGAR = svg('<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9.5 4V3h5v1"/><path d="M9 10h6M9 13.5h6M9 17h3.5"/>', 16)
IMPORTAR = svg('<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>', 16)
EXPORTAR = svg('<path d="M12 15V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M5 19.5h14"/>', 16)
PLANTILLA = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/><path d="M9 13h6M9 16.5h4"/>', 16)
AZ = svg('<path d="M4 17 7 7l3 10"/><path d="M5 14h4"/><path d="M14 7h5l-5 10h5"/>', 16)
CODIGOS = svg('<path d="M8 7 3.5 12 8 17"/><path d="M16 7l4.5 5-4.5 5"/><path d="M13.5 5 10.5 19"/>', 16)
CONTACTOS = svg('<path d="M4 19.5 5.3 16A8 8 0 1 1 8.2 19z"/><circle cx="12" cy="10" r="2.4"/><path d="M8.5 15a3.6 3.6 0 0 1 7 0"/>', 20)
GENTE, LAPIZ20 = C.GENTE, C.LAPIZ20
OJO_TACHADO = svg('<path d="M3 3l18 18"/><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c5 0 8.5 4.4 9.5 6-.5.8-1.6 2.2-3.1 3.5"/><path d="M6.6 7.6C4.6 8.9 3.2 10.8 2.5 12c1 1.6 4.5 6 9.5 6 1.6 0 3-.4 4.3-1"/>', 16)

MOTIVO_NUEVO = "Guardá el catálogo antes."
MOTIVO_CAMBIOS = "Guardá o descartá los cambios antes de importar."
MOTIVO_TOPE = "Llegó a 10.000 opciones, el máximo de un catálogo."
MOTIVO_MOVER = "Guardá la opción para poder moverla."
MOTIVO_ORDEN = "Guardá o descartá el orden pendiente para borrar opciones."


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
# El catálogo de ejemplo de la 14 (14-texto-diseno.md): está en su lista y lleva a su tablero
PRODUCTOS = ("Productos", "Lo que vende Grupo Delta, con su precio de lista.", "Escritas a mano", "Texto", "10", "2 formularios", "", "Activo", "", "FRM-Catalogo-14")


def cats_de(con_usan):
    return sorted(CATS + [PRODUCTOS], key=lambda c: c[0]) if con_usan else CATS


ESTADOS_LISTA = ["Todos", "Filtro abierto", "Escritas a mano", "De los miembros", "De los contactos", "Sin coincidencias", "Cargando", "Vacío", "Error", "Filtro de estado"]
CSS_LISTA = """.w-th.k12, .w-tr.k12 { grid-template-columns: minmax(200px, 1.3fr) minmax(220px, 1.3fr) 130px 100px minmax(170px, 1fr); }
.w-th.k14, .w-tr.k14 { grid-template-columns: minmax(150px, 1fr) 200px 96px 72px 104px 158px; }
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
    filas = "".join(fila_cat(c, con_usan) for c in cats_de(con_usan))
    n, mano = len(cats_de(con_usan)), 5 if con_usan else 4
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            + F.filtro("Origen", [("t", "Todos los orígenes", n), ("m", "Escritas a mano", mano), ("b", "De los miembros", 2), ("c", "De los contactos de WhatsApp", 1)], "ori")
            + F.filtro("Estado", [("t", "Todos los estados", n), ("a", "Activos", n - 1), ("d", "Dados de baja", 1)], "est")
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


def js_lista(vista, con_usan=False):
    n, mano = len(cats_de(con_usan)), 5 if con_usan else 4
    return f"""    const f = {vista};
    const mano = f === 'Escritas a mano', miembros = f === 'De los miembros', contactos = f === 'De los contactos', elegido = mano || miembros || contactos;
    const lista = ['Todos', 'Filtro abierto', 'Filtro de estado', 'Escritas a mano', 'De los miembros', 'De los contactos'].includes(f);
    return {{
      si: true, no: false,
      resumen: f === 'Vacío' ? 'Sin catálogos' : f === 'Cargando' || f === 'Error' ? '' : '{n} catálogos · {n - 1} activos',
      conFiltros: f !== 'Vacío', busqueda: f === 'Sin coincidencias' ? 'herramientas' : 'Buscar por nombre', busClase: f === 'Sin coincidencias' ? 'lleno' : '',
      oriTexto: mano ? 'Origen: Escritas a mano' : miembros ? 'Origen: De los miembros' : contactos ? 'Origen: De los contactos de WhatsApp' : 'Origen',
      oriClase: elegido ? 'con' : '', oriMenu: f === 'Filtro abierto', oriAlternar: () => {{}},
      oriOn_t: elegido ? '' : 'on', oriOn_m: mano ? 'on' : '', oriOn_b: miembros ? 'on' : '', oriOn_c: contactos ? 'on' : '',
      oriC_t: '{n}', oriC_m: '{mano}', oriC_b: '2', oriC_c: '1', oriElegir_t: () => {{}}, oriElegir_m: () => {{}}, oriElegir_b: () => {{}}, oriElegir_c: () => {{}},
      estTexto: 'Estado', estClase: '', estMenu: f === 'Filtro de estado', estAlternar: () => {{}}, estOn_t: 'on', estOn_a: '', estOn_d: '',
      estC_t: '{n}', estC_a: '{n - 1}', estC_d: '1', estElegir_t: () => {{}}, estElegir_a: () => {{}}, estElegir_d: () => {{}},
      hayFiltro: elegido || f === 'Sin coincidencias',
      total: mano ? '{mano} catálogos' : miembros ? '2 catálogos' : contactos ? '1 catálogo' : f === 'Sin coincidencias' ? '0 catálogos' : '{n} catálogos',
      conFilas: lista, verMano: !miembros && !contactos, verMiembros: !mano && !contactos, verContactos: !mano && !miembros,
      rango: mano ? '1–{mano} de {mano}' : miembros ? '1–2 de 2' : contactos ? '1 de 1' : '1–{n} de {n}',
      cargando: f === 'Cargando', vacio: f === 'Vacío', sinCoincidencias: f === 'Sin coincidencias', error: f === 'Error',
"""


def pagina_lista(nombre, estados, vista, capas=None, con_usan=False, css=""):
    banda, cuerpo = lista_catalogos(con_usan)
    flags = "".join(f"      c{i}: e === {json.dumps(k, ensure_ascii=False)},\n" for i, k in enumerate(estados)) if capas else ""
    t = C.pagina_k(nombre, "Inicio / Formularios / Catálogos", banda, cuerpo,
                   F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + E.CSS_E12 + CSS_LISTA + css, estados, js_lista(vista, con_usan) + flags + "    };")
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
CSS_EDITOR = """.k-cab2 { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: stretch; }
.k-izq { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.k-g1 { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
.k-g1 .k-de { margin: 0; font-size: 13.5px; color: var(--t3); }
.k-g1 .w-cmp { max-width: 640px; }
.k-g1 .ct.area { height: 72px; align-items: flex-start; padding-top: 9px; white-space: normal; }
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
.k-sel > span { margin-right: auto; }
.k-aviso-f { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; font-size: 14px; color: var(--t1); }
.k-aviso-f .cb { flex: none; }
.w-th.ke, .w-tr.ke { grid-template-columns: 28px 30px minmax(192px, 1.25fr) 96px minmax(192px, 1.35fr) 56px 172px; gap: 10px; }
.w-th.kv, .w-tr.kv { grid-template-columns: 28px 30px minmax(170px, 1.1fr) 96px 128px minmax(150px, 1fr) 56px 172px; gap: 10px; }
.w-th .der, .w-tr .der { justify-content: flex-end; text-align: right; }
.f-bnd-est .k-us { margin-right: 6px; color: var(--t3); }
.k-acc { display: inline-flex; align-items: center; justify-content: flex-end; gap: 0; width: 100%; }
.k-acc .ib { width: 30px; height: 30px; flex: none; }
.k-acc .ib[aria-disabled="true"] { color: var(--borde2); cursor: default; }
.k-acc .cb { height: 30px; padding: 0 10px; font-size: 13px; flex: none; }
.k-acc .k-el { margin-right: 6px; font-size: 12px; line-height: 1.15; color: var(--peligro); text-align: right; width: 72px; flex: none; white-space: normal; }
.w-tr.borrar .k-in, .w-tr.borrar .gris { color: var(--t3); background: var(--s2); }
.w-tr.borrar .k-chk { opacity: 0.45; }
.k-err-f { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; padding: 0 0 8px 68px; font-size: 12.5px; color: var(--peligro); }
.k-err-f svg { width: 14px; height: 14px; flex: none; }
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
.k-pv { display: flex; flex-direction: column; gap: 10px; }
.k-pv .pv-tit { font-size: 13px; font-weight: 600; color: var(--t2); }
.k-pv .seg2 { align-self: center; display: inline-grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 2px; border-radius: 8px; background: var(--s3); font-size: 12.5px; }
.k-pv .seg2 span { padding: 4px 14px; border-radius: 6px; color: var(--t2); text-align: center; }
.k-pv .seg2 span.on { background: #fff; color: var(--t1); font-weight: 600; box-shadow: 0 1px 2px oklch(0.24 0.014 78 / 0.12); }
.k-pv .tel { flex: 1; height: auto; min-height: 236px; width: 100%; box-sizing: border-box; }
.tel .pv-hoja { display: flex; flex-direction: column; }
.tel .k-env { margin: auto 14px 14px; height: 34px; border-radius: 8px; background: oklch(0.45 0.12 160 / 0.5); color: #fff; font-size: 12.5px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.tel .k-hasta { padding: 8px 14px 2px; font-size: 12px; color: oklch(0.4 0.01 150); }
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
ANCHOS = {"ke": 852, "kv": 924, "kl": 684}


def campo(rotulo, valor, req=False, ro=False, ph=False, err="", info=""):
    clase = "ct" + (" ro" if ro else "") + (" ph" if ph else "") + (" mal" if err else "")
    rq = ' <span class="req">*</span>' if req else ""
    e = f'<span class="err2" role="alert">{err}</span>' if err else ""
    return f'<div class="w-cmp"><span class="rt">{rotulo}{rq}{F.info(info) if info else ""}</span><div class="{clase}">{valor}</div>{e}</div>'


def caja_catalogo(nombre, desc, origen="Escritas a mano", tipo="Texto", err_nombre=False, lectura=False):
    """Como ArquitecturaBase (126): de dónde salen y el tipo, en una línea, y debajo el nombre y la descripción. Ninguno de los dos primeros se cambia después."""
    n = campo("Nombre", nombre or "Nombre del catálogo", req=not lectura, ro=lectura, ph=not nombre, err="Escribí el nombre del catálogo." if err_nombre else "")
    d = campo("Descripción", desc or "Opcional", ro=lectura, ph=not desc).replace('class="ct', 'class="ct area', 1)
    linea = " · ".join(x for x in (origen, tipo) if x)
    return f'<div class="w-caja"><div class="f-cab"><span>El catálogo</span></div><div class="k-g1"><p class="k-de">{linea}</p>{n}{d}</div></div>'


def casilla(on, n="", ro=False):
    """El Estado de una opción, como en ArquitecturaBase: una casilla. Sin marcar, dada de baja."""
    return (f'<span class="k-chk{" on" if on else ""}{" ro" if ro else ""}" role="checkbox" aria-checked="{"true" if on else "false"}" aria-label="Activa: {n}"'
            f'{" aria-disabled=" + chr(34) + "true" + chr(34) if ro else ""}>{TILDE if on else ""}</span>')


def flechas(n, primera=False, ultima=False, nueva=False):
    """Mover: se aplica al guardar. Una opción nueva todavía no tiene lugar, y el motivo va en su tooltip (43)."""
    subir, bajar = ("true" if primera or nueva else "false"), ("true" if ultima or nueva else "false")
    motivo = f' title="{MOTIVO_MOVER}"' if nueva else ""
    return (f'<button type="button" class="ib" aria-label="Subir {n}" aria-disabled="{subir}"{motivo}>{ARRIBA}</button>'
            f'<button type="button" class="ib" aria-label="Bajar {n}" aria-disabled="{bajar}"{motivo}>{ABAJO}</button>')


def acciones(n, activa=True, primera=False, ultima=False, nueva=False, borrar=False, motivo_borrar=""):
    """Las acciones a la vista (127). Una dada de baja cambia ✎ por «Reactivar»; 🗑 quita una nueva y borra al guardar una guardada que nada usa."""
    mover = flechas(n, primera, ultima, nueva)
    if borrar:
        return f'<span class="k-acc"><span class="k-el">Se borra al guardar</span><button type="button" class="cb cb-sec" aria-label="Restaurar {n}">Restaurar</button></span>'
    medio = (f'<button type="button" class="ib" aria-label="Editar {n}">{LAPIZ}</button>' if activa else
             f'<button type="button" class="cb cb-sec" aria-label="Reactivar {n}">Reactivar</button>')
    etiqueta = f"Quitar {n}" if nueva else f"Borrar {n}"
    off = f' aria-disabled="true" title="{motivo_borrar}"' if motivo_borrar else ""
    return f'<span class="k-acc">{mover}{medio}<button type="button" class="ib" aria-label="{etiqueta}"{off}>{QUITAR}</button></span>'


def entrada(valor, mono=False, contar=False, ph="", mal=False, foco=False):
    clases = "k-in" + (" mono" if mono else "") + (" ph" if not valor else "") + (" mal" if mal else "") + (" foco" if foco else "")
    c = f"<small>{len(valor)}/30</small>" if contar else ""
    return f'<span class="{clases}"><span>{valor or ph}</span>{c}</span>'


def fila_editable(k, n, cod, det, activa, valor=None, elegida=False, err=None, aviso=None, foco=None, campos="", tabla="", total=0, nueva=False, borrar=False, motivo_borrar="", aviso_f="", quieta=False):
    """Una fila de la tabla que se edita en el lugar. err/aviso: {columna: texto}; campos, las celdas de los campos (la 13), que van antes del detalle.
    aviso_f, el motivo del servidor debajo de la fila, a todo el ancho."""
    err = err or {}
    t = entrada(n, contar=True, ph="Texto", mal="texto" in err, foco=foco == "texto")
    t_extra = (f'<span class="err2" role="alert">{err["texto"]}</span>' if "texto" in err else
               f'<span class="aviso2">{aviso}</span>' if aviso else "")
    c = entrada(cod, mono=True, ph="Código", mal="codigo" in err, foco=foco == "codigo")
    c_extra = f'<span class="err2" role="alert">{err["codigo"]}</span>' if "codigo" in err else ""
    celdas = (f'<span class="fx fx-a"><span class="k-chk{" on" if elegida else ""}" role="checkbox" aria-checked="{"true" if elegida else "false"}">{TILDE if elegida else ""}</span></span>'
              f'<span class="gris fx fx-b">{"—" if nueva else k}</span><span class="k-tab fx fx-c">{t}{t_extra}</span><span class="k-tab">{c}{c_extra}</span>{campos}')
    if valor is not None:
        v = entrada(valor, ph="Valor", mal="valor" in err, foco=foco == "valor")
        v_extra = f'<span class="err2" role="alert">{err["valor"]}</span>' if "valor" in err else ""
        celdas += f'<span class="k-tab">{v}{v_extra}</span>'
    d_extra = f'<span class="err2" role="alert">{err["detalle"]}</span>' if "detalle" in err else ""
    celdas += f'<span class="k-tab">{entrada(det, ph="Opcional", contar="detalle" in err, mal="detalle" in err)}{d_extra}</span>'
    celdas += f"<span>{casilla(activa, n or 'la opción nueva', ro=borrar)}</span>"
    celdas += (f'<span class="fx fx-d der">{acciones(n or "la opción nueva", activa, quieta or k == 1, quieta or (bool(total) and k == total), nueva, borrar, motivo_borrar)}</span>')
    clases = f'w-tr {tabla or ("kv" if valor is not None else "ke")}{"" if activa else " baja"}{" borrar" if borrar else ""}'
    fila = f'<div class="{clases}">{celdas}</div>'
    if aviso_f:
        fila += f'<div class="w-tr k-sinfila"><span class="k-err-f" role="alert">{ALERTA}{aviso_f}</span></div>'
    return fila


def fila_lectura(k, n, cod, det, activa, campos="", tabla="kl"):
    est = '<span class="w-est">Activa</span>' if activa else '<span class="w-est off">Dada de baja</span>'
    return (f'<div class="w-tr {tabla}{"" if activa else " baja"}"><span class="gris fx fx-a">{k}</span><span class="k-lee fx fx-c2">{n}</span><span class="k-lee mono">{cod}</span>'
            f'{campos}<span class="k-lee">{det}</span>{est}</div>')


def barra(modo, campos=""):
    """El encabezado de Opciones, como en ArquitecturaBase: lo de todos los días a la vista y el resto en el ⋮. Lo que no se puede todavía va grisado, con el
    motivo en su tooltip (43). modo: normal | cambios | nuevo | tope | lectura. campos: «Agregar campos» de la 13, al lado de «Agregar opción»."""
    agregar = f'<button type="button" class="cb cb-sec">{MAS} Agregar opción</button>'
    importar_b = '<button type="button" class="cb cb-sec">Importar</button>'
    exportar_b = '<button type="button" class="cb cb-sec">Exportar</button>'
    mas = f'<button type="button" class="ib" aria-label="Más acciones de las opciones" aria-haspopup="menu" aria-expanded="{{{{expMas}}}}">{KEBAB}</button>'
    if modo == "lectura":
        return campos + exportar_b + mas
    motivo_imp = {"nuevo": MOTIVO_NUEVO, "cambios": MOTIVO_CAMBIOS}.get(modo, "")
    if modo == "tope":
        agregar = tip(agregar, MOTIVO_TOPE, abierto=True)
        motivo_imp = MOTIVO_TOPE
    if motivo_imp:
        importar_b = tip(importar_b, motivo_imp)
    if modo == "nuevo":
        exportar_b = tip(exportar_b, MOTIVO_NUEVO)
    return agregar + campos + importar_b + exportar_b + mas


def menu_mas(modo="normal"):
    """El ⋮ de Opciones: lo que se usa de vez en cuando. Lo que no se puede todavía va apagado, con el motivo en su tooltip (43)."""
    def mi(icono, texto, apagado=""):
        if apagado:
            return f'<span class="f-mi off" role="menuitem" aria-disabled="true" title="{apagado}">{icono} {texto}</span>'
        return f'<span class="f-mi" role="menuitem">{icono} {texto}</span>'
    plantilla = mi(PLANTILLA, "Descargar la plantilla")
    if modo == "lectura":
        items = plantilla
    else:
        orden = mi(AZ, "Ordenar de la A a la Z", MOTIVO_NUEVO if modo == "nuevo" else "")
        items = plantilla + '<span class="f-sep" role="separator"></span>' + orden + mi(CODIGOS, "Generar los códigos que faltan")
    return f'<sc-if value="{{{{menuMas}}}}" hint-placeholder-val="{{{{no}}}}"><div class="f-menu" role="menu" aria-label="Más acciones de las opciones">{items}</div></sc-if>'


def caja_opciones(filas, cuenta, pie, modo="normal", seleccion="", tabla="ke", vacia=False, cab=None, ancho=None, boton_campos="", columnas=False, aviso=""):
    """cuenta ya no se muestra: el encabezado de una sección no lleva cantidades (29451ed6); lo que hay, en la tabla y el paginado.
    boton_campos y columnas son de la 13; aviso, lo que dijo el servidor, arriba de la tabla."""
    cab_tabla = cab or {"ke": ["", "#", "Texto", "Código", "Detalle", "Estado", "Acciones"],
                        "kv": ["", "#", "Texto", "Código", "Valor", "Detalle", "Estado", "Acciones"],
                        "kl": ["#", "Texto", "Código", "Detalle", "Estado"]}[tabla]
    todas = '<span class="k-chk{{chkTodas}}" role="checkbox" aria-label="Elegir las de esta página"></span>'
    lectura = tabla.startswith("kl")
    fijas = ({0: "fx fx-a", 1: "fx fx-c2"} if lectura else {0: "fx fx-a", 1: "fx fx-b", 2: "fx fx-c", len(cab_tabla) - 1: "fx fx-d der"})

    def celda(k, c):
        if c.startswith("<span"):
            return c
        clase = fijas.get(k, "")
        dentro = todas if (k == 0 and not lectura) else c
        return f'<span class="{clase}">{dentro}</span>' if clase else f"<span>{c}</span>"
    th = f'<div class="w-th {tabla}">' + "".join(celda(k, c) for k, c in enumerate(cab_tabla)) + "</div>"
    tabla_html = f'<div class="k-desp"><div class="k-tabla" style="min-width: {ancho or ANCHOS[tabla]}px;">{th}{filas}</div></div>'
    col = f'<span class="w-pil">Columnas {CHEV}</span>' if columnas else ""
    fb = '' if vacia else f'<div class="k-fb"><span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>{col}</div>'
    cuerpo = (f'<div class="k-vacio">Todavía no hay opciones.</div>' if vacia else seleccion + tabla_html + pie)
    return (f'<div class="w-caja"><div class="f-cab"><span>Opciones</span><span class="der">{barra(modo, boton_campos)}{menu_mas(modo)}</span></div>'
            f"{aviso}{fb}{cuerpo}</div>")


def vista_previa(items, titulo="Motivo"):
    """Como ArquitecturaBase: el rótulo, «Una opción | Varias» y el teléfono, que acompaña a las cajas de la izquierda. Por defecto, el campo cerrado; tocado, la lista."""
    lista = "".join(f'<div class="k-li"><span class="t">{n}<small>{d}</small></span><i></i></div>' for n, d in items)
    varias = "".join(f'<div class="k-li"><span class="t">{n}<small>{d}</small></span><i class="cua"></i></div>' for n, d in items)
    return ('<div class="k-pv"><span class="pv-tit">Así lo ve quien lo recibe</span>'
            '<span class="seg2" role="group" aria-label="Cómo se elige"><span class="{{pvUna}}">Una opción</span><span class="{{pvVarias}}">Varias</span></span>'
            '<div class="tel" aria-label="Así lo ve quien lo recibe"><div class="pv-hoja">'
            f'<sc-if value="{{{{pvCerrado}}}}" hint-placeholder-val="{{{{si}}}}"><div class="pv-hc"><span class="pv-x">×</span>Formulario</div>'
            f'<div class="k-campo">{titulo}<span class="sel">Elegí una opción{CHEV}</span></div><div class="k-env">Enviar</div></sc-if>'
            f'<sc-if value="{{{{pvAbierto}}}}" hint-placeholder-val="{{{{no}}}}"><div class="pv-hc"><span class="pv-x">‹</span>{titulo}</div><div class="pv-hb lst">{lista}</div></sc-if>'
            f'<sc-if value="{{{{pvMuchas}}}}" hint-placeholder-val="{{{{no}}}}"><div class="pv-hc"><span class="pv-x">×</span>Formulario</div><div class="k-hasta">Elegí hasta 3</div>'
            f'<div class="pv-hb lst">{varias}</div></sc-if>'
            "</div></div></div>")


def acc_editor(cambios=False, guardando=False, nuevo=False, baja=False, lectura=False, motivo="", abierto=False):
    """Como ArquitecturaBase: «Dar de baja» a la vista, «Descartar» y «Guardar cambios». motivo: «Crear catálogo» grisado con el motivo en su tooltip (43); abierto, el tooltip a la vista."""
    if lectura:
        return ""
    if baja:
        return '<button type="button" class="cb cb-pri">Reactivar</button>'
    d = "" if (cambios and not guardando) else " disabled"
    g = "Crear catálogo" if nuevo else "Guardar cambios"
    desc = "Cancelar" if nuevo else "Descartar"
    primero = f'<button type="button" class="cb cb-sec"{"" if nuevo or (cambios and not guardando) else " disabled"}>{desc}</button>'
    segundo = trabaja("Creando…" if nuevo else "Guardando…") if guardando else f'<button type="button" class="cb cb-pri"{"" if nuevo else d}>{g}</button>'
    if motivo:
        segundo = tip(f'<button type="button" class="cb cb-pri">{g}</button>', motivo, abierto)
    dar_baja = "" if nuevo else '<button type="button" class="cb cb-sec">Dar de baja</button>'
    return dar_baja + primero + segundo


ACTIVO = '<span class="w-est">Activo</span>'
ESTADOS_EDITOR = ["Sin cambios", "Con cambios", "Código repetido", "Texto repetido",
                  "Texto de más de 30", "Una opción nueva", "Borrar una opción", "Se borra al guardar", "Movimientos pendientes", "Orden pendiente", "Más acciones", "Varias elegidas",
                  "Vista previa abierta", "Vista previa con varias", "Guardando", "Guardado", "No se guardó", "Otra persona guardó", "Dar de baja el catálogo", "Dado de baja",
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
        if modo == "borrar":
            kw = dict(borrar=k == 3, quieta=True)
        if modo == "mover":
            kw = dict(motivo_borrar=MOTIVO_ORDEN)
        if modo == "orden":
            kw = dict(motivo_borrar=MOTIVO_ORDEN, quieta=True)
        h += fila_editable(k, n, cod, det, activa, total=len(OPS), **kw)
    if modo == "nueva":
        h += fila_editable(0, "Garantía", "GAR", "", True, nueva=True)
    return h


PIE4 = '<div class="w-pie"><span>1–4 de 4</span><span>10 por página · Página 1 de 1</span></div>'
ITEMS_MOTIVOS = [(n, d) for n, _c, d, a in OPS if a]


def cuerpo_editor(opciones, catalogo=None, items=ITEMS_MOTIVOS, titulo="Motivo", debajo="", aviso=""):
    """Como ArquitecturaBase: las cajas a la izquierda, el teléfono al costado y, a todo el ancho, lo que quedó pendiente y las opciones. debajo: «En WhatsApp», de la 13."""
    catalogo = catalogo or caja_catalogo("Motivos de visita", "Por qué se visita a un cliente.")
    return f'<div class="w-body"><div class="k-cab2"><div class="k-izq">{catalogo}{debajo}</div>{vista_previa(items, titulo)}</div>{aviso}{opciones}</div>'


def aviso_orden(texto, boton):
    """Lo que falta guardar del orden: se ve arriba de las opciones, con cómo descartarlo."""
    return f'<div class="w-caja k-aviso-f" role="status"><span>{texto}</span><button type="button" class="cb cb-sec">{boton}</button></div>'


def editor():
    tit = "Motivos de visita"
    b = lambda est=ACTIVO, **k: C.banda_k(tit, est, acc_editor(**k))
    norm = caja_opciones(filas_motivos(), "4 opciones · 3 activas", PIE4)
    sucio = lambda modo: caja_opciones(filas_motivos(modo), "4 opciones · 3 activas", PIE4, modo="cambios")
    seleccion = ('<div class="k-sel"><span>2 elegidas</span><button type="button" class="cb cb-sec">Dar de baja</button>'
                 '<button type="button" class="cb cb-sec">Reactivar</button><button type="button" class="cb cb-enl">Quitar la selección</button></div>')
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
        "Código repetido": (b(cambios=True), cuerpo_editor(sucio("codigo"))),
        "Texto repetido": (b(cambios=True), cuerpo_editor(sucio("repetido"))),
        "Texto de más de 30": (b(cambios=True), cuerpo_editor(sucio("largo"))),
        "Una opción nueva": (b(cambios=True), cuerpo_editor(caja_opciones(filas_motivos("nueva"), "", PIE4, modo="cambios"))),
        "Borrar una opción": (b(), cuerpo_editor(norm)),
        "Se borra al guardar": (b(cambios=True), cuerpo_editor(sucio("borrar"))),
        "Movimientos pendientes": (b(cambios=True), cuerpo_editor(sucio("mover"), aviso=aviso_orden("2 movimientos pendientes. Se aplican en este orden al guardar.", "Descartar movimientos"))),
        "Orden pendiente": (b(cambios=True), cuerpo_editor(sucio("orden"), aviso=aviso_orden("Se ordena de la A a la Z al guardar.", "Cancelar el orden"))),
        "Más acciones": (b(), cuerpo_editor(norm)),
        "Varias elegidas": (b(), cuerpo_editor(caja_opciones(filas_motivos("elegidas"), "4 opciones · 3 activas", PIE4, seleccion=seleccion))),
        "Vista previa abierta": (b(), cuerpo_editor(norm)),
        "Vista previa con varias": (b(), cuerpo_editor(norm)),
        "Guardando": (b(cambios=True, guardando=True), cuerpo_editor(sucio("cambios"))),
        "Guardado": (b(), cuerpo_editor(norm)),
        "No se guardó": (b(cambios=True), cuerpo_editor(sucio("cambios"))),
        "Otra persona guardó": (b(cambios=True), cuerpo_editor(sucio("cambios"))),
        "Dar de baja el catálogo": (b(), cuerpo_editor(norm)),
        "Dado de baja": (C.banda_k(tit, '<span class="w-est off">Dado de baja</span>', acc_editor(baja=True)),
                         cuerpo_editor(caja_opciones("".join(fila_lectura(k, n, cod, det, a) for k, (n, cod, det, a) in enumerate(OPS, 1)), "4 opciones · 3 activas", PIE4, modo="lectura", tabla="kl"),
                                       caja_catalogo("Motivos de visita", "Por qué se visita a un cliente.", lectura=True))),
        "Sin opciones": (b(no_se_puede), cuerpo_editor(caja_opciones("", "0 opciones", "", vacia=True), items=[])),
        "1.097 opciones": (C.banda_k("Proveedores", ACTIVO, acc_editor()), cuerpo_editor(caja_opciones(prov, "1.097 opciones · 1.090 activas", pie_prov), cat_prov, items_prov, "Proveedor")),
        "10.000 opciones": (C.banda_k("Proveedores", ACTIVO, acc_editor()), cuerpo_editor(caja_opciones(prov, "10.000 opciones · 9.912 activas", pie_tope, modo="tope"), cat_prov, items_prov, "Proveedor")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", "", acc_editor(nuevo=True)), cuerpo_editor(nuevo_op, caja_catalogo("", ""), items=[], titulo="Pregunta")),
        "Falta el nombre": (C.banda_k("Nuevo catálogo", "", acc_editor(nuevo=True)), cuerpo_editor(nuevo_op, caja_catalogo("", "", err_nombre=True), items=[], titulo="Pregunta")),
        "Solo lectura": (C.banda_k(tit, ACTIVO, acc_editor(lectura=True)), cuerpo_editor(lectura, caja_catalogo("Motivos de visita", "Por qué se visita a un cliente.", lectura=True))),
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
        "Borrar una opción": A.confirmar("¿Borrar «Reclamo»?", "Se borra al guardar el catálogo. Hasta entonces se puede restaurar.", "Borrar opción"),
    }
    i_mas, i_varias, i_abierta, i_vista = (ESTADOS_EDITOR.index(x) for x in ("Más acciones", "Varias elegidas", "Vista previa abierta", "Vista previa con varias"))
    js = A.js_estados(ESTADOS_EDITOR, extra=(
        f"      menuMas: k === {i_mas}, expMas: k === {i_mas} ? 'true' : 'false', chkTodas: k === {i_varias} ? ' medio' : '',\n"
        f"      pvCerrado: k !== {i_abierta} && k !== {i_vista}, pvAbierto: k === {i_abierta}, pvMuchas: k === {i_vista},\n"
        f"      pvUna: k === {i_vista} ? '' : 'on', pvVarias: k === {i_vista} ? 'on' : '',\n"
        "      busqueda: 'Buscar opción', busClase: '',\n"))
    t = C.pagina_k("Catálogo escrito a mano · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Motivos de visita",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + A.CSS_AB + E.CSS_E12 + CSS_EDITOR, ESTADOS_EDITOR, js, alto=1200)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_EDITOR.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA)


# ================================================================ CA2 · Importar (y pegar)
ESTADOS_IMPORTAR = ["Elegir un archivo", "Revisar sin archivo", "Archivo elegido", "Archivo que no sirve", "Pegar: la grilla vacía", "Revisar sin filas", "Pegar: con filas", "Pegar: una columna ajena", "Revisando",
                    "Revisión: errores", "Revisión: altas", "Revisión: cambios", "Revisión: bajas", "Muchas bajas", "Muchas filas con error", "Un valor ambiguo", "Aplicando",
                    "Otra persona guardó", "Otra importación en curso"]
# 120: un solo diálogo, de arriba abajo, con sus zonas a la vista (IM1-A), las esperas (IM2-A) y la grilla de pegar (IM3-A)
CSS_IMPORTAR = """.w-dlg.imp { width: 760px; }
.w-dlg.imp .db { display: block; max-height: 600px; overflow: auto; padding: 0; }
.imp-cab { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; padding: 0 20px; background: oklch(0.945 0.018 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.imp-cab > span { display: inline-flex; align-items: center; gap: 4px; }
.imp-cab a { color: var(--marca-tx); font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
.imp-f { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 12px; align-items: center; min-height: 48px; padding: 6px 20px; border-top: 1px solid var(--borde); font-size: 13.5px; }
.imp-f .rt { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--t2); }
.imp-f .arch { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.imp-f .arch b { font-weight: 600; }
.imp-f .gris { color: var(--t3); }
.imp-f .err2 { grid-column: 2; margin-top: -2px; font-size: 12.5px; color: var(--peligro); }
.imp-seg { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); width: 340px; }
.imp-seg span { height: 30px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.imp-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.imp-seg.off { opacity: 0.6; }
.imp-z { display: flex; flex-direction: column; gap: 10px; padding: 12px 20px; border-top: 1px solid var(--borde); }
.imp-z.aten { opacity: 0.55; pointer-events: none; }
.imp-lin { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13.5px; color: var(--t2); }
.imp-lin b { color: var(--t1); font-weight: 600; }
.imp-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--borde); }
.imp-tabs span { padding: 8px 12px; font-size: 13px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; }
.imp-tabs span.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.imp-tabs .c { margin-left: 5px; font-size: 12px; color: var(--t3); }
.imp-tabla { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 13px; }
.imp-tabla .c, .imp-tabla .f { display: grid; column-gap: 0; padding: 0; align-items: stretch; }
.imp-tabla .c > span, .imp-tabla .f > span { display: flex; align-items: center; min-width: 0; padding: 0 12px; }
.imp-tabla .c > span + span, .imp-tabla .f > span + span { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.imp-tabla .c > span + span { box-shadow: inset 1px 0 0 oklch(0.89 0.02 76); }
.imp-tabla .c > .n, .imp-tabla .f > .n { justify-content: flex-end; font-variant-numeric: tabular-nums; }
.imp-cmp { display: grid; grid-template-columns: 64px 110px 100px minmax(0, 1fr) minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; font-size: 13px; }
.imp-cmp > span { padding: 9px 12px; border-top: 1px solid var(--borde); box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); min-width: 0; overflow-wrap: break-word; }
.imp-cmp > .h { display: flex; align-items: center; min-height: 34px; box-sizing: border-box; padding: 0 12px; border-top: 0; background: oklch(0.945 0.018 76); font-weight: 600; color: var(--t2); font-size: 12.5px; box-shadow: inset 1px 0 0 oklch(0.89 0.02 76); }
.imp-cmp > .n { text-align: right; justify-content: flex-end; font-variant-numeric: tabular-nums; }
.imp-cmp > .h:first-child, .imp-cmp > .p.n { box-shadow: none; }
.imp-cmp > .g { color: var(--t2); }
.imp-cmp .nw { white-space: nowrap; }
.imp-cmp .mono { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; color: var(--t2); }
.imp-tabla .c { min-height: 34px; background: oklch(0.945 0.018 76); font-weight: 600; color: var(--t2); font-size: 12.5px; }
.imp-tabla .f { min-height: 38px; border-top: 1px solid var(--borde); }
.imp-tabla .f:nth-child(odd) { background: oklch(0.975 0.008 78); }
.imp-tabla .mono { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; color: var(--t2); }
.imp-tabla .tach { color: var(--t3); text-decoration: line-through; }
.imp-tabla .ajena { color: var(--peligro); }
.imp-tabla .cursor { height: 26px; display: inline-flex; align-items: center; width: max-content; white-space: nowrap; padding: 0 8px; border: 2px solid var(--marca); border-radius: 4px; color: var(--t3); }
.imp-gp { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--t2); }
.imp-gp .err2 { font-size: 12.5px; color: var(--peligro); }
.imp-conf { display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; }
.imp-conf i { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--borde2); box-sizing: border-box; flex-shrink: 0; margin-top: 2px; background: #fff; }
.imp-conf b { font-weight: 600; }
.imp-franja { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: var(--peligro-t); color: oklch(0.45 0.17 25); font-size: 13.5px; }
.imp-franja span { flex: 1; }
.imp-esq { display: flex; flex-direction: column; gap: 8px; }
.imp-esq span { height: 14px; border-radius: 4px; background: var(--s3); }
"""
MOTIVO_APLICANDO = "Esperá a que termine de aplicar."
GRILLA = [("PRV-1098", "Bulones Mar del Plata", "CUIT 30-71567890-2"), ("PRV-1099", "Cerámicos Neuquén", "CUIT 30-70412345-6"), ("PRV-1100", "Clavos del Oeste", "")]


def tabla_imp(cols, plantilla, filas, der=()):
    """Una línea entre columnas y los números a la derecha, encabezado incluido (137): `der` son esas columnas."""
    sp = lambda k, x: f'<span class="n">{x}</span>' if k in der else f"<span>{x}</span>"  # noqa: E731
    c = f'<div class="c" style="grid-template-columns: {plantilla};">' + "".join(sp(k, x) for k, x in enumerate(cols)) + "</div>"
    return '<div class="imp-tabla">' + c + "".join(f'<div class="f" style="grid-template-columns: {plantilla};">' + "".join(sp(k, x) for k, x in enumerate(f)) + "</div>" for f in filas) + "</div>"


def nw(texto):
    """Un código con guiones no se parte (137): «CUIT 30-70988123-4» baja de renglón, si hace falta, antes del número."""
    return re.sub(r"(\d+(?:-\d+)+)", r'<span class="nw">\1</span>', texto)


# «Cambios», lado a lado (138, LR2-A): la fila y el código una vez, la columna en gris y cada versión en su columna, solo lo que cambió
CAMBIOS_LADO = [("3", "PRV-0002", [("Detalle", "CUIT 30-70988123-4", "CUIT 30-70988123-5")]),
                ("11", "PRV-0010", [("Texto", "Cementos del Plata", "Cementos del Plata S.A."), ("Detalle", "CUIT 30-69001234-8", "CUIT 30-69001234-9")]),
                ("37", "PRV-0036", [("Texto", "Hierros Sur", "Hierros del Sur")])]


def tabla_cambios(grupos=CAMBIOS_LADO):
    h = '<span class="h n">Fila</span><span class="h">Código</span><span class="h">Columna</span><span class="h">Antes</span><span class="h">Después</span>'
    for fila, cod, lineas in grupos:
        span = f' style="grid-row: span {len(lineas)};"' if len(lineas) > 1 else ""
        for k, (col, antes, despues) in enumerate(lineas):
            if k == 0:
                h += f'<span class="p n"{span}>{fila}</span><span class="p"{span}><span class="mono">{cod}</span></span>'
            h += f'<span class="g">{col}</span><span>{nw(antes)}</span><span>{nw(despues)}</span>'
    return f'<div class="imp-cmp" role="table" aria-label="Cambios">{h}</div>'


ERRORES = [("37", "Código", "Está repetido en la fila 52."), ("88", "Texto", "Tiene más de 30 caracteres.")]
ALTAS = [('<span class="mono">PRV-1098</span>', "Bulones Mar del Plata", "CUIT 30-71567890-2"), ('<span class="mono">PRV-1099</span>', "Cerámicos Neuquén", "CUIT 30-70412345-6"),
         ('<span class="mono">PRV-1100</span>', "Clavos del Oeste", "")]
BAJAS = [('<span class="mono">PRV-0005</span>', "Aluminios Cuyo"), ('<span class="mono">PRV-0331</span>', "Ferretería Lomas"), ('<span class="mono">PRV-0790</span>', "Pinturas Oeste")]


def zona_origen(modo="archivo", archivo="", mal=False, apagado=False, falta=False):
    """«Origen»: de dónde vienen las filas. La plantilla va en la banda, y qué hace cada origen, en sus (i) (109 y 116)."""
    on = lambda m: ' class="on"' if m == modo else ""
    seg = (f'<div class="imp-seg{" off" if apagado else ""}" role="radiogroup" aria-label="Desde"><span{on("archivo")} role="radio">Subir un archivo</span>'
           f'<span{on("pegar")} role="radio">Pegar desde Excel</span></div>')
    h = (f'<div class="imp-cab"><span>Origen</span><a href="#">{PLANTILLA} Bajar la plantilla</a></div>'
         f'<div class="imp-f"><span class="rt">Desde{F.info("Pegar suma filas al catálogo. Un archivo lo reemplaza: lo que no viene se da de baja, no se borra.")}</span>{seg}</div>')
    if modo == "archivo":
        nombre = f"<b>{archivo}</b>" if archivo else '<span class="gris">Ningún archivo elegido</span>'
        boton = f'<button type="button" class="cb cb-sec"{" disabled" if apagado else ""}>{"Cambiar" if archivo else "Elegir archivo"}</button>'
        motivo = "El archivo no es un XLSX ni un CSV en UTF-8." if mal else "Elegí un archivo." if falta else ""
        error = f'<span class="err2" role="alert">{motivo}</span>' if motivo else ""
        h += (f'<div class="imp-f"><span class="rt">Archivo{F.info("XLSX o CSV en UTF-8, de hasta 10 MiB y 10.000 filas.")}</span>'
              f'<span class="arch">{nombre}{boton}</span>{error}</div>')
    return h


def grilla(filas=(), ajena=False, falta=False):
    """Lo pegado, con los encabezados del catálogo en el orden de la plantilla (IM3-A). Una columna ajena queda al final, en rojo, y no se manda."""
    cols = ["Código", "Texto", "Detalle"] + (['<span class="ajena">Rubro</span>'] if ajena else [])
    plantilla = "120px minmax(0, 1fr) minmax(0, 1fr)" + (" 120px" if ajena else "")
    if filas:
        cuerpo = [(f'<span class="mono">{c}</span>', x, d) + (('<span class="ajena">Bulones</span>',) if ajena else ()) for c, x, d in filas]
    else:
        cuerpo = [('<span class="cursor">Pegá con Ctrl+V</span>', "", "")]
    pie = ""
    if filas:
        motivo = '<span class="err2">«Rubro» no es una columna del catálogo: no se manda.</span>' if ajena else f"<span>{len(filas)} filas</span>"
        pie = f'<div class="imp-gp">{motivo}<button type="button" class="cb cb-enl">Limpiar</button></div>'
    elif falta:
        pie = '<div class="imp-gp"><span class="err2" role="alert">Pegá las filas.</span></div>'
    return f'<div class="imp-z">{tabla_imp(cols, plantilla, cuerpo)}{pie}</div>'


def zona_revision(pestana="errores", archivo="proveedores.xlsx", hoja="Hoja 1", leidas="1.106", sin_cambio="1.084", errores=ERRORES, franja="", atenuada=False):
    """«Revisión», debajo: de dónde salió, qué se leyó y una pestaña por tipo de cambio, con su cantidad."""
    tabs = ('<div class="imp-tabs" role="tablist">' + "".join(f'<span class="{"on" if k == pestana else ""}" role="tab">{n}<span class="c">{c}</span></span>'
                                                         for k, n, c in [("errores", "Errores", len(errores)), ("altas", "Altas", 12), ("cambios", "Cambios", 5), ("bajas", "Bajas", 3)]) + "</div>")
    tabla = {"errores": lambda: tabla_imp(["Fila", "Columna", "Qué pasa"], "70px 120px minmax(0, 1fr)", errores, der=(0,)),
             "altas": lambda: tabla_imp(["Código", "Texto", "Detalle"], "120px minmax(0, 1fr) minmax(0, 1fr)", ALTAS),
             "cambios": tabla_cambios,
             "bajas": lambda: tabla_imp(["Código", "Texto"], "120px minmax(0, 1fr)", BAJAS)}[pestana]()
    lectura = f'<div class="imp-lin"><span><b>{archivo}</b> · {hoja} · {leidas} filas leídas · {sin_cambio} no cambian</span></div>'
    return f'<div class="imp-cab"><span>Revisión</span></div><div class="imp-z{" aten" if atenuada else ""}">{franja}{lectura}{tabs}{tabla}</div>'


def zona_antes(texto):
    return f'<div class="imp-cab"><span>Antes de aplicar</span></div><div class="imp-z"><div class="imp-conf"><i></i><span>{texto}</span></div></div>'


def dlg_importar(tit, cuerpo, pie, cerrar=True):
    d = F.dialogo(tit, cuerpo, pie, una=False).replace('class="w-dlg"', 'class="w-dlg imp"', 1)
    if not cerrar:
        d = d.replace('<button type="button" class="ib" aria-label="Cerrar">', f'<button type="button" class="ib" aria-label="Cerrar" disabled title="{MOTIVO_APLICANDO}">', 1)
    return d


def importar():
    tit = "Importar opciones a «Proveedores»"
    cancelar = '<button type="button" class="cb cb-sec">Cancelar</button>'
    revisar = cancelar + '<button type="button" class="cb cb-pri">Revisar</button>'
    aplicar = "Aplicar sin las 2 filas con errores"
    pie_aplicar = cancelar + f'<button type="button" class="cb cb-pri">{aplicar}</button>'
    origen_listo = zona_origen(archivo="proveedores.xlsx", apagado=True)
    conf_bajas = "<b>Dar de baja 412 opciones</b> (el 38 %)."
    conf_err = "<b>Aplicar sin las 140 filas con errores</b> (el 13 %)."
    franja409 = f'<div class="imp-franja" role="alert">{ALERTA}<span>Otra persona guardó el catálogo. Revisá de nuevo.</span></div>'
    franja_ocupado = f'<div class="imp-franja" role="alert">{ALERTA}<span>Ya tenés una importación o una exportación en curso. Probá en un momento.</span></div>'
    errores_amb = [("3", "Valor", "«1.500» se lee de dos formas. Escribí 1500 o 1,5.")] + ERRORES
    esqueleto = ('<div class="imp-cab"><span>Revisión</span></div><div class="imp-z"><div class="imp-esq"><span style="width: 62%;"></span><span style="width: 100%;"></span>'
                 '<span style="width: 100%;"></span><span style="width: 84%;"></span></div></div>')
    cancelar_off = f'<button type="button" class="cb cb-sec" disabled title="{MOTIVO_APLICANDO}">Cancelar</button>'
    capas = {
        "Elegir un archivo": dlg_importar(tit, zona_origen(), revisar),
        "Revisar sin archivo": dlg_importar(tit, zona_origen(falta=True), revisar),
        "Archivo elegido": dlg_importar(tit, zona_origen(archivo="proveedores.xlsx"), revisar),
        "Archivo que no sirve": dlg_importar(tit, zona_origen(archivo="fotos.zip", mal=True), revisar),
        "Pegar: la grilla vacía": dlg_importar(tit, zona_origen("pegar") + grilla(), revisar),
        "Revisar sin filas": dlg_importar(tit, zona_origen("pegar") + grilla(falta=True), revisar),
        "Pegar: con filas": dlg_importar(tit, zona_origen("pegar") + grilla(GRILLA), revisar),
        "Pegar: una columna ajena": dlg_importar(tit, zona_origen("pegar") + grilla(GRILLA, ajena=True), revisar),
        "Revisando": dlg_importar(tit, origen_listo + esqueleto, cancelar + trabaja("Revisando…")),
        "Revisión: errores": dlg_importar(tit, origen_listo + zona_revision(), pie_aplicar),
        "Revisión: altas": dlg_importar(tit, origen_listo + zona_revision("altas"), pie_aplicar),
        "Revisión: cambios": dlg_importar(tit, origen_listo + zona_revision("cambios"), pie_aplicar),
        "Revisión: bajas": dlg_importar(tit, origen_listo + zona_revision("bajas"), pie_aplicar),
        "Muchas bajas": dlg_importar(tit, origen_listo + zona_revision("bajas") + zona_antes(conf_bajas),
                                     cancelar + tip(f'<button type="button" class="cb cb-pri">{aplicar}</button>', "Confirmá las bajas para aplicar.")),
        "Muchas filas con error": dlg_importar(tit, origen_listo + zona_revision() + zona_antes(conf_err),
                                               cancelar + tip('<button type="button" class="cb cb-pri">Aplicar sin las 140 filas con errores</button>', "Confirmá que se aplica sin esas filas.")),
        "Un valor ambiguo": dlg_importar("Importar opciones a «Recargo por zona»", zona_origen(archivo="recargos.xlsx", apagado=True)
                                         + zona_revision(archivo="recargos.xlsx", leidas="7", sin_cambio="4", errores=errores_amb), pie_aplicar),
        "Aplicando": dlg_importar(tit, origen_listo + zona_revision(atenuada=True), cancelar_off + trabaja("Aplicando…"), cerrar=False),
        "Otra persona guardó": dlg_importar(tit, origen_listo + zona_revision(franja=franja409), cancelar + '<button type="button" class="cb cb-pri">Revisar de nuevo</button>'),
        "Otra importación en curso": dlg_importar(tit, origen_listo + zona_revision(franja=franja_ocupado), '<button type="button" class="cb cb-sec">Cerrar</button>'),
    }
    assert list(capas) == ESTADOS_IMPORTAR
    prov = "".join(fila_editable(k, n, cod, det, a) for k, (n, cod, det, a) in enumerate(PROVEEDORES, 1))
    pie_prov = '<div class="w-pie"><span>1–10 de 1.097</span><span>10 por página · Página 1 de 110</span></div>'
    fondo = (C.banda_k("Proveedores", ACTIVO, acc_editor()),
             cuerpo_editor(caja_opciones(prov, "1.097 opciones · 1.090 activas", pie_prov), caja_catalogo("Proveedores", ""), [(n, d) for n, _c, d, a in PROVEEDORES[:6] if a], "Proveedor"))
    js = A.js_estados(ESTADOS_IMPORTAR, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Importar opciones", "Inicio / Formularios / Catálogos / Proveedores", fondo[0], fondo[1],
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + A.CSS_AB + E.CSS_E12 + CSS_EDITOR, ESTADOS_IMPORTAR, js, alto=1200)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_IMPORTAR.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA + CSS_IMPORTAR)


# ================================================================ Las opciones en un modal (117), sobre CO1-B de ArquitecturaBase
# «Agregar opción» lo abre con las agregadas en él, y ✎, con las de la página. Escribe en el borrador: se guarda con «Guardar cambios».
# «Quitar opción» saca una nueva sin preguntar, y en una guardada pregunta y la borra al guardar (129). Las piezas tienen parámetros porque la 13
# suma una fila por campo y su modal de campos es igual (formularios_13_campos_1004.py).
ESTADOS_OPCIONES = ["Agregar una opción", "Agregar otra", "Editar una opción", "Una opción dada de baja", "Una opción por borrar", "Código repetido", "Texto repetido", "Texto de más de 30", "Con un valor"]
CSS_OPCIONES = """.w-dlg.md { width: 880px; }
.w-dlg.md .db { padding: 0; gap: 0; grid-template-columns: 270px minmax(0, 1fr); align-items: stretch; height: 450px; }
.md-lista { display: flex; flex-direction: column; min-height: 0; overflow: auto; border-right: 1px solid var(--borde); background: oklch(0.975 0.008 78); }
.md-it { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 8px 12px; border-bottom: 1px solid var(--borde); box-sizing: border-box; cursor: pointer; }
.md-it.on { background: var(--marca-t); }
.md-it .num { width: 20px; flex: none; text-align: center; font-size: 13px; color: var(--t3); }
.md-it .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.md-it .tx b { font-size: 13.5px; font-weight: 600; color: var(--t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.md-it .tx small { font-size: 12.5px; color: var(--t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.md-it.baja .tx b { color: var(--t3); }
.md-it .tri { display: inline-flex; color: var(--peligro); }
.md-lista .md-tit { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 0 12px; box-sizing: border-box; flex: none; background: oklch(0.945 0.018 76); border-bottom: 1px solid var(--borde); font-size: 13px; font-weight: 600; color: var(--t2); }
.md-lista .md-tit small { font-size: 12.5px; font-weight: 500; color: var(--t3); }
.md-it .md-nueva { margin-left: 6px; padding: 0 6px; border-radius: 6px; background: oklch(0.95 0.05 85); color: oklch(0.45 0.1 70); font-size: 11.5px; font-weight: 600; }
.md-it .md-fle { display: inline-flex; flex: none; }
.md-it .md-fle .ib { width: 28px; height: 28px; }
.md-it .md-fle .ib[aria-disabled="true"] { color: var(--borde2); }
.md-it .tx small.borrar { color: var(--peligro); }
.md-it.baja .tx small { color: var(--t3); }
.md-it.on { box-shadow: inset 3px 0 0 var(--marca); }
.md-mas { margin-top: auto; padding: 10px 12px; border-top: 1px solid var(--borde); }
.md-por { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 20px; font-size: 14px; }
.md-por .el { color: var(--peligro); font-size: 13.5px; }
.md-op { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: auto; }
.md-cab { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 0 20px; background: oklch(0.945 0.018 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.md-cab .cb-pel { height: 32px; font-size: 13px; }
.md-f { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 12px; padding: 10px 20px; border-top: 1px solid var(--borde); }
.md-f .rt { display: inline-flex; align-items: center; gap: 4px; min-height: 34px; font-size: 13px; font-weight: 600; color: var(--t2); }
.md-f .req { color: var(--peligro); }
.md-f .ctl { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.md-f .lin { display: flex; align-items: center; gap: 12px; }
.md-f .lin .k-in { flex: 1; min-width: 0; }
.md-f .err2 { font-size: 12.5px; color: var(--peligro); }
.md-f .aviso2 { font-size: 12.5px; color: oklch(0.45 0.1 70); }
.md-seg { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); width: 220px; }
.md-seg span { height: 28px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.md-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
"""
TITULO_NUEVAS, TITULO_OPCIONES = "Opciones nuevas de «{}»", "Opciones de «{}»"


def md_item(num, texto, sub, on=False, baja=False, mal=False, nueva="", flechas_md="", borrar=False):
    """Una fila de la lista de un modal. nueva: «Nueva» o «Nuevo», al lado del nombre. flechas_md: ↑ ↓ en la elegida, en el de campos."""
    tri = f'<span class="tri" title="Tiene un error">{ALERTA}</span>' if mal else ""
    marca = f'<span class="md-nueva">{nueva}</span>' if nueva else ""
    return (f'<div class="md-it{" on" if on else ""}{" baja" if baja else ""}" role="option" aria-selected="{"true" if on else "false"}"><span class="num">{num}</span>'
            f'<span class="tx"><b>{texto or "Sin texto"}{marca}</b><small{" class=" + chr(34) + "borrar" + chr(34) if borrar else ""}>{sub}</small></span>{tri}{flechas_md}</div>')


def md_fila(rotulo, control, req=False, ayuda="", err="", aviso=""):
    rq = ' <span class="req">*</span>' if req else ""
    extra = f'<span class="err2" role="alert">{err}</span>' if err else (f'<span class="aviso2">{aviso}</span>' if aviso else "")
    return f'<div class="md-f"><span class="rt">{rotulo}{rq}{F.info(ayuda) if ayuda else ""}</span><span class="ctl">{control}{extra}</span></div>'


def md_cab(titulo, boton):
    """La banda de lo elegido: dice cuál es y lleva cómo quitarlo, como en ArquitecturaBase."""
    return f'<div class="md-cab"><span>{titulo}</span><button type="button" class="cb cb-pel">{QUITAR} {boton}</button></div>'


def md_opcion(posicion, texto="", cod="", det="", valor=None, rotulo_valor="Valor", estado=None, err=None, aviso="", campos=""):
    """La opción elegida. estado: None en una nueva, porque recién una guardada se puede dar de baja. Los campos van antes del valor y del detalle, como en la tabla."""
    err = err or {}
    filas = md_fila("Texto", entrada(texto, contar=True, ph="Texto", mal="texto" in err, foco=not texto), req=True, ayuda="Es lo que se ve en WhatsApp.", err=err.get("texto", ""), aviso=aviso)
    filas += md_fila("Código", f'<span class="lin">{entrada(cod, mono=True, ph="Código", mal="codigo" in err)}<button type="button" class="cb cb-enl">Generar desde el texto</button></span>',
                     req=True, ayuda="No se ve en WhatsApp. Identifica la opción al importar.", err=err.get("codigo", ""))
    filas += campos
    if valor is not None:
        filas += md_fila(rotulo_valor, entrada(valor, ph="Valor"), req=True)
    filas += md_fila("Detalle", entrada(det, ph="Opcional"), ayuda="Se ve debajo del texto en WhatsApp.")
    if estado:
        seg = f'<span class="md-seg" role="radiogroup" aria-label="Estado"><span class="{"on" if estado == "Activa" else ""}" role="radio">Activa</span><span class="{"on" if estado == "De baja" else ""}" role="radio">De baja</span></span>'
        filas += md_fila("Estado", seg, ayuda="Dada de baja no se ofrece más, y lo ya respondido no cambia.")
    return f'<div class="md-op">{md_cab(posicion, "Quitar opción")}{filas}</div>'


def md_por_borrar(posicion, texto):
    """Una guardada que se borra al guardar: no se edita, y se puede restaurar."""
    return (f'<div class="md-op"><div class="md-cab"><span>{posicion}</span></div><div class="md-por"><b>{texto}</b><span class="el">Se borra al guardar</span>'
            '<button type="button" class="cb cb-sec">Restaurar</button></div></div>')


def dlg_opciones(titulo, items, opcion, cuenta="", lista="Opciones"):
    cab = f'<div class="md-tit"><span>{lista}</span><small>{cuenta}</small></div>'
    mas = f'<div class="md-mas"><button type="button" class="cb cb-sec">{MAS} Agregar opción</button></div>'
    cuerpo = f'<div class="md-lista" role="listbox" aria-label="{lista}">{cab}{items}{mas}</div>{opcion}'
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Listo</button>'
    return F.dialogo(titulo, cuerpo, pie, una=False).replace('class="w-dlg"', 'class="w-dlg md"', 1)


def items_motivos(sel=0, mal=0, borrar=0):
    return "".join(md_item(k, n, "Se borra al guardar" if k == borrar else cod, on=k == sel, baja=not a, mal=k == mal, borrar=k == borrar) for k, (n, cod, _d, a) in enumerate(OPS, 1))


def opciones_modal():
    tit = "Motivos de visita"
    nuevas, todas = TITULO_NUEVAS.format(tit), TITULO_OPCIONES.format(tit)
    uno = md_item("—", "", "Sin código", on=True, nueva="Nueva")
    primera = md_item("—", "Garantía", "GAR", nueva="Nueva")
    n2, c2, d2, _a = OPS[1]
    n4, c4, d4, _a = OPS[3]
    capas = {
        "Agregar una opción": dlg_opciones(nuevas, uno, md_opcion("Nueva opción"), "1", "Opciones nuevas"),
        "Agregar otra": dlg_opciones(nuevas, primera + uno, md_opcion("Nueva opción"), "2", "Opciones nuevas"),
        "Editar una opción": dlg_opciones(todas, items_motivos(2), md_opcion("Opción 2 de 4", n2, c2, d2, estado="Activa"), "1–4 de 4"),
        "Una opción dada de baja": dlg_opciones(todas, items_motivos(4), md_opcion("Opción 4 de 4", n4, c4, d4, estado="De baja"), "1–4 de 4"),
        "Una opción por borrar": dlg_opciones(todas, items_motivos(3, borrar=3), md_por_borrar("Opción 3 de 4", OPS[2][0]), "1–4 de 4"),
        "Código repetido": dlg_opciones(todas, items_motivos(2, 2), md_opcion("Opción 2 de 4", n2, "SEG", d2, estado="Activa", err={"codigo": "Ya está en la opción 1."}), "1–4 de 4"),
        "Texto repetido": dlg_opciones(todas, items_motivos(3), md_opcion("Opción 3 de 4", "Venta nueva", "REC", OPS[2][2], estado="Activa", aviso="Otra opción tiene el mismo texto."), "1–4 de 4"),
        "Texto de más de 30": dlg_opciones(todas, items_motivos(2, 2), md_opcion("Opción 2 de 4", "Venta nueva para clientes del interior", c2, d2, estado="Activa",
                                                                                 err={"texto": "Puede tener hasta 30 caracteres."}), "1–4 de 4"),
        "Con un valor": dlg_opciones(TITULO_OPCIONES.format("Recargo por zona"), "".join(md_item(k, n, cod, on=k == 2) for k, (n, cod, _d, _v, _a) in enumerate(ZONAS, 1)),
                                     md_opcion("Opción 2 de 6", ZONAS[1][0], ZONAS[1][1], ZONAS[1][2], valor=ZONAS[1][3], rotulo_valor="Valor (decimal)", estado="Activa"), "1–6 de 6"),
    }
    assert list(capas) == ESTADOS_OPCIONES
    fondo = (C.banda_k(tit, ACTIVO, acc_editor(cambios=True)), cuerpo_editor(caja_opciones(filas_motivos(), "", PIE4, modo="cambios")))
    js = A.js_estados(ESTADOS_OPCIONES, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Opciones de un catálogo · modal", "Inicio / Formularios / Catálogos / Motivos de visita", fondo[0], fondo[1],
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + A.CSS_AB + E.CSS_E12 + CSS_EDITOR, ESTADOS_OPCIONES, js, alto=1200)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_OPCIONES.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA + CSS_OPCIONES)


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
    b = lambda **k: C.banda_k(tit, ACTIVO, acc_editor(**k))
    V = {
        "Con valores": (b(), cuerpo_editor(caja_opciones(filas(), "6 opciones · 6 activas", pie, tabla="kv"), cat, items, "Zona")),
        "Valor de otro tipo": (b(cambios=True), cuerpo_editor(caja_opciones(filas("otro"), "6 opciones · 6 activas", pie, modo="cambios", tabla="kv"), cat, items, "Zona")),
        "Agregar una opción": (b(cambios=True), cuerpo_editor(caja_opciones(filas("agregar"), "7 opciones · 7 activas", pie, modo="cambios", tabla="kv"), cat, items, "Zona")),
        "Falta el valor": (b(cambios=True), cuerpo_editor(caja_opciones(filas("falta"), "7 opciones · 7 activas", pie, modo="cambios", tabla="kv"), cat, items, "Zona")),
    }
    js = A.js_estados(ESTADOS_TIPO, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', busqueda: 'Buscar opción', busClase: '',\n")
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
    b = lambda **k: C.banda_k(tit, ACTIVO, acc_editor(**k))
    V = {
        "Sin cambios": (b(), cuerpo("lista")),
        "Con cambios": (b(cambios=True), cuerpo("sucio")),
        "Elegir a quién": (b(cambios=True), cuerpo("elegir")),
        "Actualizando": (b(cambios=True), cuerpo("probando")),
        "Ninguna opción": (b(cambios=True), cuerpo("ninguna")),
        "Más de 200": (b(cambios=True), cuerpo("mas200")),
        "Rol que ya no existe": (C.banda_k("Responsables de obra", nomas, acc_editor()), cuerpo("lista", True, "Responsables de obra", "Supervisores y jefes de obra.")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", "", acc_editor(nuevo=True)), cuerpo("sin_persona", nombre="", desc="")),
        "Crear sin persona": (C.banda_k("Nuevo catálogo", "", acc_editor(nuevo=True)),
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
    b = lambda **k: C.banda_k(tit, ACTIVO, acc_editor(**k))
    V = {
        "Sin cambios": (b(), cuerpo("lista")),
        "Con cambios": (b(cambios=True), cuerpo("sucio")),
        "Elegir etiquetas": (b(cambios=True), cuerpo("sucio", menu=True)),
        "Elegir a quién": (b(cambios=True), cuerpo("elegir")),
        "Actualizando": (b(cambios=True), cuerpo("probando")),
        "Ninguna opción": (b(cambios=True), cuerpo("ninguna")),
        "Más de 200": (b(cambios=True), cuerpo("mas200")),
        "Sin WhatsApp": (C.banda_k(tit, sin_wa, acc_editor()), cuerpo("sucio")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", "", acc_editor(nuevo=True)), cuerpo("sucio", nombre="", desc="")),
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
.t-de { margin: 0; font-size: 14px; color: var(--t3); }
.q-acc { display: inline-flex; align-items: center; flex: none; margin-right: -6px; }
.q-acc .ap-ib { width: 34px; height: 40px; }
.q-acc .ap-ib[aria-disabled="true"] { color: var(--borde2); }
.q-acc .cb { height: 34px; padding: 0 10px; font-size: 13.5px; }
.q-acc:has(> .cb:only-child) { margin-right: 6px; }
.t-op .q-acc { margin-right: -4px; }
.q-row .tx > .q-el { color: var(--peligro); }
.q-row.borrar .tx b { color: var(--t3); }
.ap-cmp .ay.aviso2 { color: oklch(0.45 0.1 70); }
.k-prev .pie .ap-i, .q-row .tx .ap-i { vertical-align: -4px; }
.ap-mas { padding: 8px 4px 0; font-size: 13px; color: var(--t3); }
"""
TEL_DESTINO = {"FRM-Catalogo": "M-FRM-Catalogo", "FRM-Catalogo-Tipo": "M-FRM-Catalogo", "FRM-Catalogo-Filtros": "M-FRM-Catalogo-Filtros",
               "FRM-Catalogo-Contactos": "M-FRM-Catalogo-Contactos", "FRM-Catalogo-14": "M-FRM-Catalogo-14"}
ESTADOS_TL = ["Todos", "Filtros", "Sin coincidencias", "Cargando", "Vacío", "Error", "Nuevo catálogo"]
TILDE18 = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")
TILDE14 = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")


def t_info(motivo):
    return f'<button type="button" class="ap-i" aria-label="Por qué" title="{motivo}">{F.TINFO}</button>'


def tel_lista(con_usan=False):
    filas = ""
    total, mano = len(cats_de(con_usan)), 5 if con_usan else 4
    for n, desc, origen, sub, ops, usan, clase, estado, motivo, destino in cats_de(con_usan):
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
    filtros_h = (grupo("Origen", [("Todos los orígenes", total), ("Escritas a mano", mano), ("De los miembros", 2), ("De los contactos de WhatsApp", 1)])
                 + grupo("Estado", [("Todos los estados", total), ("Activos", total - 1), ("Dados de baja", 1)]))

    def op(on, titulo, texto):
        return (f'<div class="k-op{" on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><span class="rd"></span>'
                f'<span class="tx"><b>{titulo}</b><span>{texto}</span></span></div>')
    nuevo_h = ('<div class="p-tit2">De dónde salen las opciones</div>'
               + op(True, "Escribirlas a mano", "Para listas que mantiene una persona.")
               + op(False, "Tomarlas de los miembros, con filtros", "Se arma sola con los miembros que cumplen los filtros.")
               + op(False, "Tomarlas de los contactos de WhatsApp", "Se arma sola con los contactos de Clientes, por etiqueta.")
               + F.tcampo("Tipo de valor", "Texto", select=True))
    capas = {"Filtros": F.thoja("Filtros", filtros_h, f'<button type="button" class="cb cb-pri">Ver {total} catálogos</button>').replace('<div class="hb">', '<div class="hb lst">', 1),
             "Nuevo catálogo": F.thoja("Nuevo catálogo", nuevo_h, '<button type="button" class="cb cb-sec">Cancelar</button><a class="cb cb-pri" href="M-FRM-Catalogo.dc.html">Continuar</a>')}
    return C.tel_pagina(cuerpo, ESTADOS_TL, capas, "Catálogos · teléfono", F.CSS_TFILTRO + CSS_T12)


ESTADOS_TE = ["Sin cambios", "Con cambios", "Borrar una opción", "Se borra al guardar", "Más acciones", "Así lo ve quien lo recibe", "Dar de baja el catálogo", "Guardado", "Sin opciones", "Solo lectura"]


def q_opcion(k, n, cod, det, activa, total, lectura=False, borrar=False, abajo=""):
    """Una opción en el teléfono: el texto y el código, como en ArquitecturaBase. abajo: lo que va en lugar del código, como un título que no entra."""
    chip = "" if activa else '<span class="t-chip" style="border-color: var(--borde); background: var(--s2); color: var(--t3);">Dada de baja</span>'
    linea = '<span class="q-el">Se borra al guardar</span>' if borrar else f"<span>{abajo or cod}</span>"
    acc = "" if lectura else E.q_acciones(n, k, total, activa, borrar)
    return (f'<div class="q-row{"" if activa else " baja"}{" borrar" if borrar else ""}"><span class="num">{k}</span>'
            f'<span class="tx"><b>{n}{chip}</b>{linea}</span>{acc}</div>')


def tel_de(origen="Escritas a mano", tipo="Texto"):
    """De dónde salen y el tipo, en una línea, como en la compu."""
    return f'<p class="t-de">{origen} · {tipo}</p>'


def tel_ro(rotulo, valor):
    """La A11 en el teléfono: el mismo campo, apagado."""
    return f'<div class="ap-cmp"><span class="rt"><span>{rotulo}</span></span><div class="ct ro">{valor}</div></div>'


def tel_editor():
    der = (f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{F.OJO}</button>'
           f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>')

    def campos(lectura=False):
        if lectura:
            return tel_de() + tel_ro("Nombre", "Motivos de visita") + tel_ro("Descripción", "Por qué se visita a un cliente.")
        return tel_de() + F.tcampo("Nombre", "Motivos de visita", req=True) + F.tcampo("Descripción", "Por qué se visita a un cliente.")

    def opciones(vacia=False, lectura=False, cambio=False, borrar=0):
        if vacia:
            return '<div class="t-vacia">Todavía no hay opciones.</div>'
        return "".join(q_opcion(k, "Seguimiento programado" if cambio and k == 1 else n, cod, det, activa, len(OPS), lectura, borrar == k) for k, (n, cod, det, activa) in enumerate(OPS, 1))

    def cuerpo(sub="Activo", vacia=False, lectura=False, cambio=False, fijo="", borrar=0):
        agregar = "" if lectura else '<a href="#">Agregar opción</a>'  # la acción entera, como en la compu (la Guía, 26/10)
        return (C.t_bar("Motivos de visita", sub, derecha=der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">' + campos(lectura) + "</div>"
                + f'<div class="ap-gtit">Opciones{agregar}</div><div class="ap-grupo">' + opciones(vacia, lectura, cambio, borrar) + '</div><div style="height: 20px;"></div></div>' + fijo)
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    snack = f'<div class="f-snack" role="status"><span class="ok">{F.OK}</span><span class="tx">Guardamos el catálogo.</span></div>'
    Cu = {"Sin cambios": cuerpo(), "Con cambios": cuerpo(cambio=True, fijo=fijo), "Borrar una opción": cuerpo(), "Se borra al guardar": cuerpo(fijo=fijo, borrar=3), "Más acciones": cuerpo(),
          "Así lo ve quien lo recibe": cuerpo(), "Dar de baja el catálogo": cuerpo(), "Guardado": cuerpo() + snack, "Sin opciones": cuerpo("No se puede usar", vacia=True),
          "Solo lectura": cuerpo(lectura=True)}

    items = [(n, d) for n, _c, d, a in OPS if a]
    vista = ('<div class="ap-grupo k-prev" style="margin: 0;">' + "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in items) + "</div>")
    mas = ('<div class="ap-acciones2"><span role="menuitem">Exportar</span><span role="menuitem">Descargar la plantilla</span><span role="menuitem">Ordenar de la A a la Z</span>'
           '<span role="menuitem">Generar los códigos que faltan</span><span class="pel" role="menuitem">Dar de baja el catálogo</span></div>')
    capas = {
        "Borrar una opción": F.thoja("¿Borrar «Reclamo»?", '<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">Se borra al guardar el catálogo. Hasta entonces se puede restaurar.</p>',
                                       '<button type="button" class="cb cb-pel lleno">Borrar opción</button><button type="button" class="cb cb-sec">Cancelar</button>'),
        "Más acciones": F.thoja("Motivos de visita", mas, ""),
        "Así lo ve quien lo recibe": F.thoja("Así lo ve quien lo recibe", vista, ""),
        "Dar de baja el catálogo": F.thoja("¿Dar de baja «Motivos de visita»?", '<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">Sus opciones dejan de poder '
                                           'elegirse. Se puede reactivar desde acá.</p>',
                                           '<button type="button" class="cb cb-pel lleno">Dar de baja</button><button type="button" class="cb cb-sec">Cancelar</button>'),
    }
    return C.tel_pagina(Cu, ESTADOS_TE, capas, "Catálogo escrito a mano · teléfono", E.CSS_E12 + CSS_T12)


ESTADOS_TO = ["La lista", "La lista con errores", "Una opción nueva", "Una opción guardada", "Código repetido"]
CSS_TO = """.ap-cuerpo > .f-campos:first-child { margin-top: 14px; }
.t-quitar { align-self: flex-start; padding: 4px 0; font-size: 15px; font-weight: 600; color: var(--peligro); text-decoration: none; }
.q-row .tri { display: inline-flex; color: var(--peligro); flex: none; }
.q-row.on { background: var(--marca-t); }
"""


def tel_opcion(n, cod, det, estado=None, err=False, aviso=False, campos=""):
    """La opción, a pantalla completa. Una nueva se quita sin preguntar; una guardada se borra al guardar, si nada la usa (129)."""
    c = F.tcampo("Código", cod or "Código", req=True, vacio=not cod)
    if err:
        c = c.replace('<div class="ct">', '<div class="ct mal">', 1).replace("</div></div>", '</div><span class="t-err" role="alert">Ya está en la opción 1.</span></div>', 1)
    extra = f'<span class="ay" style="align-self: flex-end;">{len(n)}/30</span>'
    if aviso:
        extra = '<span class="ay aviso2">Otra opción tiene el mismo texto.</span>' + extra
    texto = F.tcampo("Texto", n or "Texto", req=True, vacio=not n).replace("</div></div>", f"</div>{extra}</div>", 1)
    fin = F.tcampo("Estado", estado, select=True) if estado else ""
    return f'<div class="f-campos">{texto}{c}{campos}{F.tcampo("Detalle", det or "Opcional", vacio=not det)}{fin}<a class="t-quitar" href="#">Quitar opción</a></div>'


def tel_opciones(catalogo="Motivos de visita", ops=None, campos_nueva="", campos_guardada="", volver_tel="M-FRM-Catalogo.dc.html", lista_tel="M-FRM-Catalogo-Opciones.dc.html"):
    """El modal en el teléfono ocupa la pantalla: primero la lista y, al tocar una opción, la opción con «Volver a la lista». «Cancelar» y «Listo» van en la lista."""
    ops = ops or OPS
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Cancelar</button><button type="button" class="cb cb-pri full">Listo</button></div>'

    def lista(mal=0):
        filas = "".join(f'<div class="q-row"><span class="num">{k}</span><span class="tx"><b>{n}<span class="cod">{cod}</span></b><span>{d}</span></span>'
                        + (f'<span class="tri" title="Tiene un error">{ALERTA}</span>' if k == mal else "") + "</div>" for k, (n, cod, d, _a) in enumerate(ops[:6], 1))
        return (C.t_bar("Opciones", catalogo, volver_tel) + '<div class="ap-cuerpo"><div class="ap-gtit">Opciones<a href="#">Agregar opción</a></div>'
                f'<div class="ap-grupo">{filas}</div><div style="height: 20px;"></div></div>' + fijo)

    def opcion(pos, cuerpo):
        return (C.t_bar(pos, catalogo, lista_tel).replace('aria-label="Volver"', 'aria-label="Volver a la lista"', 1)
                + f'<div class="ap-cuerpo">{cuerpo}<div style="height: 20px;"></div></div>')
    n2, c2, d2, _a = ops[1]
    total = len(ops)
    Cu = {"La lista": lista(), "La lista con errores": lista(2), "Una opción nueva": opcion("Nueva opción", tel_opcion("", "", "", campos=campos_nueva)),
          "Una opción guardada": opcion(f"Opción 2 de {total}", tel_opcion(n2, c2, d2, estado="Activa", campos=campos_guardada)),
          "Código repetido": opcion(f"Opción 2 de {total}", tel_opcion(n2, ops[0][1], d2, estado="Activa", err=True, campos=campos_guardada))}
    return C.tel_pagina(Cu, ESTADOS_TO, {}, "Opciones de un catálogo · teléfono", E.CSS_E12 + CSS_T12 + CSS_TO)


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


ESTADOS_TC = ["Sin cambios", "Con cambios", "Acciones de una condición", "Editar una condición", "Elegir etiquetas", "Así lo ve quien lo recibe", "Elegir a quién",
              "Actualizando", "Ninguna opción", "Más de 200", "Sin WhatsApp"]


def tel_contactos():
    """Un catálogo de los contactos en el teléfono: M-FRM-Catalogo-Filtros con lo de FRM-Catalogo-Contactos. Las condiciones son por
    etiqueta, la lista va en la hoja del ojo, con «Persona» opcional arriba, y sin WhatsApp no se puede usar. El teléfono de un
    contacto nunca se ve (81)."""
    der = f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{F.OJO}</button>'

    def cuerpo(sub="Activo"):
        filas = ('<div class="q-row"><span class="tx"><b>Si · Etiqueta</b><span>tiene alguna de Mayorista, Minorista</span></span>'
                 f'<button type="button" class="ap-ib" aria-label="Acciones de la condición">{F.TKEBAB}</button></div>')
        otras = ('<div class="ap-dato"><span class="k">Texto de cada opción</span><span class="v">Nombre</span></div>'
                 '<div class="ap-dato"><span class="k">Detalle</span><span class="v">Etiquetas</span></div>'
                 '<div class="ap-dato"><span class="k">Orden</span><span class="v">Nombre, A → Z</span></div>')
        return (C.t_bar("Clientes", sub, derecha=der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">'
                + F.tcampo("Nombre", "Clientes", req=True) + F.tcampo("Descripción", "A quiénes se les entrega o se visita.") + "</div>"
                + f'<div class="ap-gtit">Qué contactos entran<a href="#">Agregar condición</a></div><div class="ap-grupo">{filas}</div>'
                + f'<div class="ap-gtit">Otras opciones</div><div class="ap-grupo">{otras}</div><div style="height: 20px;"></div></div>')
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    Cu = {"Sin cambios": cuerpo(), "Con cambios": cuerpo() + fijo, "Acciones de una condición": cuerpo(), "Editar una condición": cuerpo() + fijo,
          "Elegir etiquetas": cuerpo() + fijo, "Así lo ve quien lo recibe": cuerpo(), "Elegir a quién": cuerpo(), "Actualizando": cuerpo() + fijo,
          "Ninguna opción": cuerpo() + fijo, "Más de 200": cuerpo() + fijo, "Sin WhatsApp": cuerpo("No se puede usar" + t_info("La organización no tiene WhatsApp."))}
    pie = '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'

    def vista(modo):
        persona = F.tcampo("Persona", "Ninguna", select=True)
        if modo == "probando":
            lista = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span></div>'
        elif modo == "ninguna":
            lista = '<div class="ap-grupo k-prev" style="margin: 0;"><div class="vacio2">Ninguna opción</div></div>'
        else:
            lista = '<div class="ap-grupo k-prev" style="margin: 0;">' + "".join(f'<div class="li">{n}<small>{d}</small></div>' for n, d in CONTACTOS_EJ) + "</div>"
        if modo == "mas200":
            lista += f'<div class="ap-mas">y {215 - len(CONTACTOS_EJ)} opciones más</div>'
        return persona + lista
    etiquetas = "".join(f'<span class="t-opc {"on" if on else ""}">{n}<span class="d">{c}{TILDE18 if on else ""}</span></span>'
                        for n, c, on in [("Mayorista", 12, True), ("Minorista", 30, True), ("Obra", 8, False), ("VIP", 4, False)])
    personas = "".join(f'<span class="t-opc {"on" if k == 0 else ""}">{n}<span class="d">{TILDE18 if k == 0 else ""}</span></span>'
                       for k, n in enumerate(["Ninguna"] + [c[0] for c in CONTACTOS_EJ]))
    capas = {
        "Acciones de una condición": F.thoja("Si · Etiqueta", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span class="pel" role="menuitem">Quitar</span></div>', ""),
        "Editar una condición": F.thoja("Editar condición", F.tcampo("Columna", "Etiqueta", select=True) + F.tcampo("Comparación", "tiene alguna de", select=True)
                                        + F.tcampo("Valor", "Mayorista, Minorista", select=True), pie),
        "Elegir etiquetas": F.thoja("Etiquetas", etiquetas, '<button type="button" class="cb cb-pri">Listo</button>').replace('<div class="hb">', '<div class="hb lst">', 1),
        "Así lo ve quien lo recibe": F.thoja("Así lo ve quien lo recibe", vista("lista"), ""),
        "Elegir a quién": F.thoja("Persona", '<span class="w-bus" style="width: auto;">' + F.BUSCAR + " Buscar persona</span>" + personas, "").replace(
            '<div class="hb">', '<div class="hb lst">', 1),
        "Actualizando": F.thoja("Así lo ve quien lo recibe", vista("probando"), ""),
        "Ninguna opción": F.thoja("Así lo ve quien lo recibe", vista("ninguna"), ""),
        "Más de 200": F.thoja("Así lo ve quien lo recibe", vista("mas200"), ""),
    }
    return C.tel_pagina(Cu, ESTADOS_TC, capas, "Catálogo de los contactos · teléfono", F.CSS_TFILTRO + CSS_T12)


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Catalogos": ("Formularios · Catálogos", 900), "FRM-Catalogos-14": ("Formularios · Catálogos · etapa 14", 900),
           "FRM-Catalogo-Nuevo": ("Formularios · nuevo catálogo", 900), "FRM-Catalogo": ("Formularios · catálogo escrito a mano", 1200),
           "FRM-Catalogo-Opciones": ("Formularios · las opciones de un catálogo", 1200), "FRM-Catalogo-Importar": ("Formularios · importar opciones", 1200), "FRM-Catalogo-Tipo": ("Formularios · catálogo con tipo de valor", 1000),
           "FRM-Catalogo-Filtros": ("Formularios · catálogo de los miembros", 1000), "FRM-Catalogo-Contactos": ("Formularios · catálogo de los contactos", 1000),
           "M-FRM-Catalogos": ("Catálogos · teléfono", 844), "M-FRM-Catalogos-14": ("Catálogos · teléfono · etapa 14", 844),
           "M-FRM-Catalogo": ("Catálogo escrito a mano · teléfono", 844), "M-FRM-Catalogo-Opciones": ("Las opciones de un catálogo · teléfono", 844), "M-FRM-Catalogo-Filtros": ("Catálogo de los miembros · teléfono", 844),
           "M-FRM-Catalogo-Contactos": ("Catálogo de los contactos · teléfono", 844)}


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
    for prohibido in ("Textos en", "Cambios sin guardar", "No se cambia", "Diseñar formularios", "FRM-Listado", "English", "probado hoy",
                      "De dónde salen</span></span>", "Como si lo recibiera", "probado el", ">Probar<", ">Vista previa<",
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
        "FRM-Catalogo-Nuevo": nuevo(), "FRM-Catalogo": editor(), "FRM-Catalogo-Opciones": opciones_modal(), "FRM-Catalogo-Importar": importar(), "FRM-Catalogo-Tipo": tipo_valor(),
        "FRM-Catalogo-Filtros": miembros(), "FRM-Catalogo-Contactos": contactos(),
        "M-FRM-Catalogos": tel_lista(), "M-FRM-Catalogos-14": tel_lista(con_usan=True), "M-FRM-Catalogo": tel_editor(), "M-FRM-Catalogo-Opciones": tel_opciones(), "M-FRM-Catalogo-Filtros": tel_filtros(),
        "M-FRM-Catalogo-Contactos": tel_contactos(),
    }
    for n, t in tableros.items():
        t = L.sin_disenar(n, E.post(n, t))
        comprobar(n, t)
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    registrar()
    print("tableros", list(tableros))
