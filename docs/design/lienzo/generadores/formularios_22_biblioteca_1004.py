"""La etapa 22, la biblioteca de plantillas (22-biblioteca.md y 22-texto-diseno.md del back). En ArquitecturaBase no hay biblioteca:
lo que se copia de allá son las piezas de este lienzo que ya están alineadas, el editor de la 14 con ↑ ↓ ✎ 🗑 a la vista, las reglas y
el diseño del PDF de la 21 y las listas con su caja de filtros. Plataforma arma, publica y retira plantillas; la organización las ve por
categoría, con dónde ya usó cada una, y al usar una le llegan las reglas de ejemplo para completar.

Con las decisiones del 24 y 25/10, cada texto es uno solo (35), la lista y la banda dicen solo Borrador, Publicada o Retirada, y la
versión va en el historial de «Publicación» (43 y el ajuste de la Guía). Lo que es de cada organización (el rol, la persona, la
dirección, la plantilla de WhatsApp, el logo y el color) va con candado: «Lo elige cada organización» (61, 62 y 82). Las reglas de
ejemplo siguen debajo de las preguntas (33), sin botón propio ni historial: se guardan con el borrador.

Con los traspasos 5 y 10 (2026-11-07): las reglas se leen en pasos (138), con las piezas nuevas de la 21 (`K.pasos`, `K.regla5`,
`K.msj5` con «Agregar dato» y `K.CSS_RG5`); en la organización, «Historial» va primero en la cabecera, apagado hasta que se guardan
(140). La pestaña «Publicación» ya no repite el estado de la banda (175), y las preguntas suman «Agregar bloque» (177).

Corre después de `formularios_21_reglas_1004.py` y `formularios_21_respuestas_1004.py`, y antes de los bloques; la fila de la etapa la
pone `formularios_etapas_1004.py`. Se puede volver a correr; con `--sin-canvas` no escribe `canvas.json`.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_biblioteca_1004 as B17  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import formularios_19_logica_1004 as X  # noqa: E402
import formularios_20_carga_1004 as W  # noqa: E402
import formularios_21_reglas_1004 as K  # noqa: E402

PROJ = F.PROJ
CHEV, MAS, CAND = F.CHEV, A.MAS, A.CANDADO
info = F.info
FORM, SUP, GER = "Visita a cliente", "Supervisor", "Gerente"
ELIGE = "Lo elige cada organización"
OPERADOR, OTRO_OP = "Martín Sosa", "Laura Díaz"
DESC = "Lo que pasó en la visita a un cliente: si se concretó la venta, el monto y el motivo."
DESC_TRF = "Los datos de una transferencia que manda un cliente: el banco, el monto y la fecha, con el comprobante."

# ================================================================ Los datos de ejemplo (22-texto-diseno.md)
# nombre, categoría, estado, la usaron, última publicación
PLANTILLAS = [("Comprobante de transferencia", "Ventas", "Publicada", 5, "20/10/2026 10:15"), ("Control de vehículo", "Logística", "Borrador", 0, None),
              ("Orden de trabajo", "Mantenimiento", "Retirada", 3, "01/10/2026 15:30"), ("Visita a cliente", "Ventas", "Publicada", 12, "05/10/2026 11:20")]
EST = {"Publicada": '<span class="w-est">Publicada</span>', "Borrador": '<span class="w-est off">Borrador</span>', "Retirada": '<span class="w-est off">Retirada</span>'}
# Las preguntas de «Visita a cliente»: el cliente sale de los contactos y el motivo de un catálogo a mano (64)
PREG = [("Cliente", "Elegir de un catálogo · Clientes · Obligatoria"), ("Fecha de la visita", "Fecha · Obligatoria"), ("¿Se concretó la venta?", "Sí o no · Obligatoria"),
        ("Monto estimado", "Número · 2 decimales · 1 condición · Opcional"), ("Motivo", "Elegir de un catálogo · Motivos de visita · Opcional"),
        ("Observaciones", "Texto largo · Opcional"), ("Fotos de la visita", "Foto · hasta 3 · Opcional"), ("Remito firmado", "Documento · Opcional")]
CATS = [("Clientes", "De los contactos de WhatsApp", None, "Pregunta 1 · Cliente"), ("Motivos de visita", "Escritas a mano", 3, "Pregunta 5 · Motivo")]
OPS_MOT = [("Seguimiento", "SEG"), ("Venta nueva", "VEN"), ("Reclamo", "REC")]
CATEGORIAS = [("Ventas", 2), ("Logística", 1), ("Mantenimiento", 1), ("Calidad", 0)]
ROLES = ["Administrador", "Dueño", "Supervisor", "Vendedor"]
DIRECCION = K.DIRECCION
GUARDADO = "02/11/2026 18:20"

CSS_22 = """.e-g2 .ancho, .w-dlg .ancho { grid-column: 1 / -1; }
.e-g2 .ct.area, .w-dlg .ct.area { height: auto; min-height: 56px; white-space: normal; line-height: 1.45; padding-top: 8px; padding-bottom: 8px; display: block; }
.ct.ro.bloq { display: flex; align-items: center; justify-content: flex-start; gap: 6px; background: var(--s2); color: var(--t2); border-color: var(--borde); }
.ct.ro.bloq svg { flex: none; color: var(--t3); }
.o-fb { display: flex; flex-wrap: nowrap; align-items: center; gap: 8px; }
.o-fb .w-bus { width: 360px; flex: none; }
.o-fb .tot { margin-left: auto; font-size: 13px; color: var(--t3); }
.w-th.pb, .w-tr.pb { grid-template-columns: minmax(220px, 1.4fr) 150px 140px 110px 170px; }
.w-th.ct2, .w-tr.ct2 { grid-template-columns: minmax(160px, 1fr) 220px 100px minmax(170px, 1fr) 72px; }
.w-th.cg, .w-tr.cg { grid-template-columns: 64px minmax(0, 1fr) 160px 132px; }
.w-th.vr, .w-tr.vr { grid-template-columns: 90px 170px 170px minmax(0, 1fr); }
.w-tr.pb, .w-tr.ct2, .w-tr.cg, .w-tr.vr { position: relative; min-height: 40px; }
.w-tr.pb a, .w-tr.ct2 a { color: var(--t1); font-weight: 500; text-decoration: none; }
.w-tr .gris { color: var(--t3); }
.w-tr.pb .num, .w-tr.ct2 .num { justify-self: start; text-align: left; }
.rg2-ab .ct.area { display: block; }
.w-dlg.pub .db { max-height: 720px; }
.w-tr.cg .num { display: inline-flex; width: 26px; height: 26px; align-items: center; justify-content: center; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12.5px; font-weight: 600; }
.w-tr .q-acc2 { justify-self: end; }
.w-tr > .q-acc2 { overflow: visible; }
.w-caja:has(.e-tip:not([hidden])) { overflow: visible; }
.w-tr .e-tipw .e-tip { right: 0; left: auto; top: calc(100% + 6px); z-index: 40; }
.pb-vacio { padding: 16px; font-size: 14px; color: var(--t3); }
.pb-in { padding: 4px 0; }
.rg2-r.mal { background: var(--peligro-t); }
.ab-chip.mal { border-color: oklch(0.82 0.08 25); background: #fff; color: var(--peligro); }
.rg2-r .ad b { color: var(--t2); }
.tok-mal { color: var(--peligro); background: var(--peligro-t); border-radius: 4px; padding: 0 3px; font-weight: 600; }
.rg-sel { position: relative; }
.rg-sel .dato2 { font-size: 12.5px; color: var(--t3); }
.rg-sel .rg2-menu { top: 64px; left: 0; right: auto; width: 280px; }
.rg-sel .ct.sel.ph { color: var(--t3); }
.rg-sel .ct.sel.mal { border-color: var(--peligro); }
.rg-sel .err2 { font-size: 12.5px; color: var(--peligro); }
.rg2-hi .vac b { display: block; margin-top: 4px; font-weight: 500; color: var(--t2); }
.pd-enc .lg.ph, .pdf-hd .lg.ph { background: var(--s2); color: var(--t3); border: 1px dashed var(--borde2); font: 600 10px Inter, sans-serif; }
.pdf-hd .lg.ph { background: #f1f1ef; color: #888; border: 0.75px dashed #aaa; font-size: 6.5px; }
.pt-d { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.pt-d p { margin: 0; font-size: 14px; line-height: 1.5; color: var(--t2); }
.pt-it { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; border-top: 1px solid var(--borde); font-size: 14px; }
.f-cab + .pt-it { border-top: 0; }
.pt-it b { font-weight: 600; }
.pt-it span { font-size: 13px; color: var(--t2); }
.f-cab .tt { display: inline-flex; align-items: center; gap: 6px; }
.bt-grupo { display: flex; flex-direction: column; gap: 10px; }
.bt-grupo h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--t1); }
.bt-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.bt-card { display: flex; flex-direction: column; gap: 6px; padding: 16px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; color: inherit; text-decoration: none; }
.bt-card:hover { border-color: var(--borde2); box-shadow: 0 6px 16px oklch(0.24 0.014 78 / 0.08); }
.bt-card b { font-size: 15px; font-weight: 600; color: var(--t1); }
.bt-card .d { font-size: 13.5px; line-height: 1.45; color: var(--t2); }
.bt-card .p { margin-top: 4px; font-size: 12.5px; color: var(--t3); }
.bt-card .u { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--marca-tx); }
.bt-card .u svg { width: 14px; height: 14px; }
.bt-esq { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.bt-esq span { height: 132px; border-radius: 12px; background: oklch(0.95 0.008 78); }
.w-dlg.cat { width: 640px; }
.w-dlg .w-th.op2, .w-dlg .w-tr.op2 { grid-template-columns: 40px minmax(0, 1fr) 90px 132px; }
.w-dlg .k-ops { border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
.w-dlg .k-ops .w-tr.op2 .num { color: var(--t3); font-variant-numeric: tabular-nums; }
.w-dlg .k-ops .w-tr.op2 .cod { font: 600 12.5px 'JetBrains Mono', monospace; color: var(--t2); }
.w-dlg.usar { width: 560px; }
.w-dlg.motivo { width: 560px; }
"""


def svg(cuerpo, n=16, grosor="1.75"):
    return F.svg(cuerpo, n, grosor)


def bloqueado(rot, ayuda=""):
    """Lo que la plantilla no trae: cada organización lo elige al usarla (61, 62 y 82)."""
    return f'<div class="w-cmp"><span class="rt">{rot}{info(ayuda) if ayuda else ""}</span><div class="ct ro bloq">{CAND}{ELIGE}</div></div>'


def pildora(nombre, ops, sel=0, abierta=False):
    """El filtro de F.filtro, sin variables: «Nombre ▾», y con algo elegido «Nombre: valor» en petróleo."""
    con = sel > 0
    texto = f"{nombre}: {ops[sel][0]}" if con else nombre
    items = "".join(f'<span role="option" class="{"on" if k == sel else ""}">{x}<span class="cnt">{c}</span></span>' for k, (x, c) in enumerate(ops))
    menu = f'<span class="f-mn" role="listbox" aria-label="Filtrar por {nombre.lower()}">{items}</span>' if abierta else ""
    return f'<span class="f-env"><span class="w-pil{" con" if con else ""}" role="button" aria-haspopup="listbox">{texto} {CHEV}</span>{menu}</span>'


def area(rot, texto, req=True, mal="", ph=False):
    r = ' <span class="req">*</span>' if req else ""
    e = f'<span class="err2" role="alert">{mal}</span>' if mal else ""
    return f'<div class="w-cmp ancho"><span class="rt">{rot}{r}</span><div class="ct area{" ph" if ph else ""}{" mal" if mal else ""}">{texto}</div>{e}</div>'


def campo(rot, valor, req=True, mal="", ph=False, ayuda=""):
    r = ' <span class="req">*</span>' if req else ""
    e = f'<span class="err2" role="alert">{mal}</span>' if mal else ""
    return f'<div class="w-cmp"><span class="rt">{rot}{r}{info(ayuda) if ayuda else ""}</span><div class="ct{" ph" if ph else ""}{" mal" if mal else ""}">{valor}</div>{e}</div>'


def selc(rot, valor, req=True, mal="", ph=False):
    r = ' <span class="req">*</span>' if req else ""
    e = f'<span class="err2" role="alert">{mal}</span>' if mal else ""
    return (f'<div class="w-cmp"><span class="rt">{rot}{r}</span><div class="ct sel{" ph" if ph else ""}{" mal" if mal else ""}" style="display: flex; justify-content: space-between;">'
            f'{valor}{CHEV}</div>{e}</div>')


def toast(texto):
    return A.toast(texto)


# ================================================================ El marco de Plataforma: el de la biblioteca, con un estado por variante
CSS_PLAT = (F.CSS_FICHA + F.CSS_ESTADOS + A.CSS_AB + A.CSS_EDITOR + A.CSS_K6 + A.CSS_E14 + E.CSS_E12 + E.CSS_CA4 + X.CSS_19 + K.CSS_RG + K.CSS_21 + K.CSS_RG5
            + L.CSS_PESTANAS + K.CSS_PDF + K.CSS_HOJA + F.CSS_PUBLICACION + F.CSS_GRILLA)


def pagina_plat(V, capas, estados, nombre, miga, css="", activo="biblioteca", alto=900, extra=""):
    """Como A.pagina_editor, en el marco de Plataforma: V = {estado: (banda, cuerpo)}; capas = {estado: diálogo o aviso encima}."""
    assert list(V) == estados, (list(V), estados)
    bandas = A.con_estados([(k, v[0]) for k, v in V.items()])
    cuerpos = A.con_estados([(k, v[1]) for k, v in V.items()])
    t = B17.pagina_plat(nombre, miga, bandas, cuerpos, activo=activo, css=CSS_PLAT + CSS_22 + CSS_PASOS_22 + css, estados=("estado", estados), js=A.js_estados(estados, extra))
    over = "".join(f'<sc-if value="{{{{s{estados.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = F.con_dialogo(t, over, A.CSS_PUB + E.CSS_ZONAS)
    t = t.replace('"$preview":{"width":1440,"height":900}', f'"$preview":{{"width":1440,"height":{alto}}}', 1)
    return L.con_css(t, "alto", f".w-app {{ height: {alto}px !important; }}\n")


def banda_pl(titulo, estado, acciones, volver="Plat-FRM-Biblioteca.dc.html", texto_volver="Volver a la biblioteca"):
    return A.banda(titulo, estado, acciones, volver).replace("Volver a Diseñar formularios", texto_volver)


# ================================================================ Plat-FRM-Biblioteca: la lista, con la caja de filtros de las listas
OPS_EST = [("Todas las plantillas", 4), ("Publicadas", 2), ("Borradores", 1), ("Retiradas", 1)]
OPS_CAT = [("Todas las categorías", 4), ("Ventas", 2), ("Logística", 1), ("Mantenimiento", 1)]
E_BIB = ["Todas", "Estado: menú", "Borradores", "Sin resultados", "Cargando", "Vacía", "Error"]


def fila_plantilla(n, cat, est, uso, ult):
    u = str(uso) if uso else '<span class="gris">—</span>'
    f = ult or '<span class="gris">—</span>'
    return (f'<div class="w-tr pb"><span><a href="Plat-FRM-Plantilla.dc.html">{n}</a></span><span>{cat}</span><span>{EST[est]}</span>'
            f'<span class="num">{u}</span><span>{f}</span></div>')


def caja_filtros(est=0, abierta=False, busqueda="", total="4 plantillas"):
    bus = f'<span class="w-bus{" lleno" if busqueda else ""}">{F.BUSCAR} {busqueda or "Buscar plantilla"}</span>'
    limpiar = '<button type="button" class="cb cb-enl">Limpiar filtros</button>' if (est or busqueda) else ""
    return (f'<div class="w-caja o-fb">{bus}{pildora("Estado", OPS_EST, est, abierta)}{pildora("Categoría", OPS_CAT)}{limpiar}'
            f'<span class="tot">{total}</span></div>')


def tabla_plantillas(filas, pie):
    cab = ('<div class="w-th pb"><span>Plantilla <span class="ord">▲</span></span><span>Categoría</span><span>Estado</span><span>La usaron</span>'
           '<span>Última publicación</span></div>')
    return f'<div class="w-caja">{cab}{filas}<div class="w-pie"><span>{pie}</span><span>10 por página · Página 1 de 1</span></div></div>'


def cuerpo_biblioteca(modo="todas"):
    if modo in ("todas", "menu"):
        return '<div class="w-body">' + caja_filtros(abierta=modo == "menu") + tabla_plantillas("".join(fila_plantilla(*p) for p in PLANTILLAS), "1–4 de 4") + "</div>"
    if modo == "borradores":
        return '<div class="w-body">' + caja_filtros(2, total="1 plantilla") + tabla_plantillas(fila_plantilla(*PLANTILLAS[1]), "1 de 1") + "</div>"
    vacio = {"sin": ('<b>Ninguna plantilla coincide con los filtros.</b><button type="button" class="cb cb-enl">Limpiar filtros</button>'),
             "vacia": "<b>Todavía no hay plantillas.</b>",
             "error": '<b>No pudimos cargar las plantillas.</b><button type="button" class="cb cb-sec">Reintentar</button>'}
    if modo == "cargando":
        caja = ('<div class="w-caja"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span>'
                '<span style="width: 72%;"></span></div></div></div>')
    else:
        caja = f'<div class="w-caja"><div class="f-cuerpo">{vacio[modo]}</div></div>'
    filtros = "" if modo == "vacia" else caja_filtros(busqueda="inspección" if modo == "sin" else "", total="0 plantillas" if modo == "sin" else "")
    return '<div class="w-body">' + filtros + caja + "</div>"


NUEVA = f'<a class="cb cb-pri" href="Plat-FRM-Plantilla-Nueva.dc.html">{MAS} Nueva plantilla</a>'


def biblioteca(estados=E_BIB, capas=None):
    res = {"Vacía": "Sin plantillas", "Cargando": "", "Error": ""}
    modos = {"Todas": "todas", "Estado: menú": "menu", "Borradores": "borradores", "Sin resultados": "sin", "Cargando": "cargando", "Vacía": "vacia", "Error": "error"}
    V = {e: (F.banda("Biblioteca de formularios", res.get(e, "4 plantillas · 2 publicadas"), NUEVA), cuerpo_biblioteca(modos.get(e, "todas"))) for e in estados}
    return V


def plat_biblioteca():
    return pagina_plat(biblioteca(), {}, E_BIB, "Biblioteca de formularios · /plataforma/formularios", "Plataforma / Administración / Formularios / Biblioteca")


# ================================================================ Plat-FRM-Plantilla-Nueva: el nombre y la categoría, sobre la lista
E_NUEVA = ["Con los datos", "Vacío", "Faltan los datos", "Creando"]


def plantilla_nueva():
    def dlg(modo):
        vacio, falta = modo in ("vacio", "falta"), modo == "falta"
        cuerpo = (campo("Nombre", "Por ejemplo, Visita a cliente" if vacio else "Inspección de obra", ph=vacio, mal="Escribí un nombre." if falta else "")
                  + selc("Categoría", "Elegí una categoría" if vacio else "Mantenimiento", ph=vacio, mal="Elegí una categoría." if falta else ""))
        creando = modo == "creando"
        pie = (f'<button type="button" class="cb cb-sec"{" disabled" if creando else ""}>Cancelar</button>'
               + (E.trabaja("Creando…") if creando else '<button type="button" class="cb cb-pri">Crear plantilla</button>'))
        return F.dialogo("Nueva plantilla", cuerpo, pie)
    base = biblioteca(["Todas"])["Todas"]
    V = {e: base for e in E_NUEVA}
    capas = {"Con los datos": dlg("datos"), "Vacío": dlg("vacio"), "Faltan los datos": dlg("falta"), "Creando": dlg("creando")}
    return pagina_plat(V, capas, E_NUEVA, "Nueva plantilla de formulario", "Plataforma / Administración / Formularios / Biblioteca")


# ================================================================ La ficha de una plantilla: Plantilla, Catálogos y Publicación
RETIRAR = B17.RETIRAR
AY_PREFIJO = "Cada organización lo puede cambiar al usarla. Las respuestas se numeran VIS-000001."
AY_REGLAS_PL = "Se guardan con el borrador y se publican con la plantilla. Lo que tiene candado lo elige cada organización al usarla."


def kebab_pl(abierto=False, nombre=FORM):
    menu = (f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}"><a class="f-mi pel" role="menuitem" href="Plat-FRM-Retirar.dc.html">{RETIRAR} Retirar</a></div>'
            if abierto else "")
    return (f'<span class="e-kw"><button type="button" class="ib o-borde" aria-label="Acciones de {nombre}" aria-haspopup="menu" '
            f'aria-expanded="{"true" if abierto else "false"}">{A.KEBAB}</button>{menu}</span>')


def acc_pl(modo="limpio", menu=False, publicar="Publicar", kebab=True):
    """La banda (43): sin cambios, Descartar y Guardar borrador grisados y «Publicar» habilitado, porque lo guardado difiere de lo
    publicado; con cambios, «Publicar» espera el guardado; guardando, el aro con su gerundio (116)."""
    limpio, g = modo == "limpio", modo == "guardando"
    d = " disabled" if (limpio or g) else ""
    a = f'<button type="button" class="cb cb-sec"{d}>Descartar</button>'
    a += E.trabaja("Guardando…", "cb-sec") if g else f'<button type="button" class="cb cb-sec"{d}>Guardar borrador</button>'
    if limpio:
        a += f'<a class="cb cb-pri" href="Plat-FRM-Publicar.dc.html">{publicar}</a>'
    else:
        a += f'<button type="button" class="cb cb-pri" aria-disabled="true" title="{E.MOTIVO_GUARDAR}">{publicar}</button>'
    return a + (kebab_pl(menu) if kebab else "")


def tabs_pl(sel, catalogos="2"):
    items = [("plantilla", "Plantilla", ""), ("catalogos", "Catálogos", f' <span class="c">{catalogos}</span>' if catalogos != "0" else ""), ("publicacion", "Publicación", "")]
    a = "".join(f'<a class="{"on" if k == sel else ""}" role="tab" aria-selected="{"true" if k == sel else "false"}" href="Plat-FRM-Plantilla.dc.html">{t}{c}</a>'
                for k, t, c in items)
    return f'<div class="f-tabs" role="tablist" aria-label="Partes de la plantilla">{a}</div>'


def caja_plantilla(quien=False):
    """«La plantilla»: el formulario de la 14 con la categoría, el prefijo sugerido y la descripción (35 y 50)."""
    return ('<div class="w-caja"><div class="f-cab"><span>La plantilla</span></div><div class="e-g2">'
            + campo("Nombre", FORM) + selc("Categoría", "Ventas") + campo("Prefijo sugerido", "VIS", ayuda=AY_PREFIJO) + E.para_quien(quien)
            + campo("Texto del botón final", "Enviar") + "<span></span>" + area("Descripción", DESC, req=False) + "</div></div>")


def fila_q(k, n, d, solo_ver=False):
    acc = '<span class="ib" aria-hidden="true"></span>' if solo_ver else E.acciones_q(n, k == 1, k == len(PREG))
    return f'<div class="q-it"><span class="num">{k}</span><span class="dato"><b>{n}</b><span>{d}</span></span><span class="chips"></span>{acc}</div>'


def motivo_abierta():
    """La pregunta 5, abierta en el lugar: elige del catálogo «Motivos de visita» de la plantilla."""
    t = E.pregunta_catalogo("elegido")
    return re.sub(r'<div class="q-it">.*?</div>(?=<div class="q-ed">)', lambda m: fila_q(5, "Motivo", "Elegir de un catálogo · Motivos de visita · Opcional"), t, count=1, flags=re.S)


def caja_preguntas(abierta=False, solo_ver=False):
    """Las preguntas con ↑ ↓ ✎ 🗑; en la franja, «Agregar título · Agregar bloque · Agregar pregunta», como los editores de la 19 a la 21 (177):
    la plantilla no tiene bloque, así que «Agregar bloque» va habilitado."""
    filas = "".join(motivo_abierta() if (abierta and k == 5) else fila_q(k, n, d, solo_ver) for k, (n, d) in enumerate(PREG, 1))
    botones = "" if solo_ver else (f'<button type="button" class="cb cb-sec">{MAS} Agregar título</button>'
                                   f'<button type="button" class="cb cb-sec">{MAS} Agregar bloque</button>'
                                   f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button>')
    return f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der">{botones or "8 preguntas"}</span></div>{filas}</div>'


PV_PL = (f'<div class="pv-c">Cliente<div class="pv-in">Elegí una opción {CHEV}</div></div>'
         f'<div class="pv-c">Fecha de la visita<div class="pv-in">Elegí una fecha {F.CAL}</div></div>'
         '<div class="pv-c">¿Se concretó la venta?<div class="pv-rd"><span><i></i>Sí</span><span><i></i>No</span></div></div>'
         '<div class="pv-c">Monto estimado (opcional)<div class="pv-in"></div></div>'
         f'<div class="pv-c">Motivo (opcional)<div class="pv-in">Elegí una opción {CHEV}</div></div>'
         '<div class="pv-c">Observaciones (opcional)<div class="pv-in area"></div></div>')


def vista_pl():
    """El teléfono: la primera pantalla; las fotos y el remito abren la suya (18), por eso dice «Continuar»."""
    pv = E.vista()
    pv = re.sub(r'<div class="pv-hb">.*?</div><div class="pv-pie">', lambda m: f'<div class="pv-hb">{PV_PL}</div><div class="pv-pie">', pv, count=1, flags=re.S)
    return pv.replace(">Enviar<", ">Continuar<", 1)


# ---------------------------------------------------------------- Las reglas de ejemplo (E21), en pasos (138), con candado en lo de cada organización
SUGERIDO = lambda rol: f' <span class="ad">(sugerido: <b>{rol}</b>)</span>'  # noqa: E731
VER_PDF = '<a class="lnk" href="Plat-FRM-Pdf.dc.html">Ver el diseño</a>'
COND_MONTO = '<b>Monto estimado</b> <span class="g">desde</span> <b>100.000</b>'
CSS_PASOS_22 = """.ab-chip.bloq { display: inline-flex; align-items: center; gap: 4px; color: var(--t2); }
.ab-chip.bloq svg { flex: none; width: 13px; height: 13px; color: var(--t3); }
.rg5-p .sug { color: var(--t2); }
"""


def eligen(sug=""):
    """Lo que elige cada organización al usar la plantilla, en una etiqueta con candado (61 y 62); el rol sugerido, en gris al lado."""
    s = f'<span class="sug">sugerido: {sug}</span>' if sug else ""
    return f'<span class="ab-chip bloq">{CAND}{ELIGE}</span>{s}'


# Las reglas de ejemplo de «Visita a cliente», como las lee la 21 (`K.pasos`): (cuándo, condiciones, [(acción, etiquetas, mensaje, lo demás)])
REGLAS_PL = [
    ("Se recibe una respuesta", [], [("Mandarle un mensaje a quien la cargó", [], K.M_REC, ""), ("Pedir aprobación a un rol", [], None, eligen(SUP))]),
    ("Se aprueba una respuesta", [], [("Armar el PDF", ["Comprobante de visita"], None, VER_PDF), ("Mandarle un mensaje a quien la cargó", ["con el PDF"], K.M_APR, ""),
                                      ("Mandar por correo", [], K.M_CORREO, eligen() + K.chip5("con el PDF"))]),
    ("Se aprueba una respuesta", [COND_MONTO], [("Avisar a un rol", [], K.M_DUENO, eligen(GER))]),
    ("Se rechaza una respuesta", [], [("Mandarle un mensaje a quien la cargó", [], K.M_RCH, "")]),
]
AY_SUG = "Un texto que cada organización ve como sugerencia: el rol lo elige ella al usar la plantilla."
AY_P24 = K.AY_PLANTILLA + " Cada organización elige la suya."


def p24_pl():
    return bloqueado("Fuera de las 24 horas, con la plantilla", AY_P24)


def sugerido_pl(rol):
    return campo("Rol sugerido (opcional)", rol, req=False, ayuda=AY_SUG)


def a_msj_pl(k, texto=K.M_APR, adj=None, **kw):
    return K.accion(k, "Mandarle un mensaje a quien la cargó", K.msj5(texto) + (adj if adj is not None else K.adjuntar()) + p24_pl(), **kw)


def a_aprobar_pl(k, **kw):
    return K.accion(k, "Pedir aprobación a un rol", '<div class="dos">' + bloqueado("Rol", K.AY_ROL) + sugerido_pl(SUP) + "</div>", **kw)


def a_pdf_pl(k, **kw):
    return K.accion(k, "Armar el PDF", f'<span>«Comprobante de visita» · {VER_PDF}</span>', **kw)


def a_correo_pl(k, **kw):
    cuerpo = ('<div class="dos">' + K.sel_("A quién", "Una dirección fija") + bloqueado("Dirección") + "</div>" + K.msj5(K.M_CORREO) + K.adjuntar())
    return K.accion(k, "Mandar por correo", cuerpo, **kw)


def a_rol_pl(k, **kw):
    cuerpo = ('<div class="dos">' + bloqueado("Rol") + sugerido_pl(GER) + "</div>" + K.msj5(K.M_DUENO) + K.adjuntar(False) + p24_pl())
    return K.accion(k, "Avisar a un rol", cuerpo, **kw)


def a_persona_pl(k, **kw):
    cuerpo = bloqueado("Persona") + K.msj5("Se aprobó [Número]: pasá a retirar el pedido.") + K.adjuntar(False) + p24_pl()
    return K.accion(k, "Avisar a una persona", cuerpo, **kw)


def caja_reglas_pl(abierta=None, n_abierta=1, vacia=False):
    """«Cuando llega una respuesta» de la 21, debajo de las preguntas (33), con cada regla en pasos (138): sin «Guardar reglas» ni «Historial»,
    porque las reglas de ejemplo se guardan con el borrador y su historia es la de las versiones."""
    cab = (f'<div class="f-cab"><span class="tt">Cuando llega una respuesta{info(AY_REGLAS_PL)}</span><span class="der">'
           f'<button type="button" class="cb cb-sec">{MAS} Agregar regla</button></span></div>')
    if vacia:
        return f'<div class="w-caja rg2 rg5">{cab}<div class="vac">Todavía no hay reglas de ejemplo.</div></div>'
    filas = "".join(abierta if (abierta and n == n_abierta) else K.regla5(n, ev, c, a) for n, (ev, c, a) in enumerate(REGLAS_PL, 1))
    return f'<div class="w-caja rg2 rg5">{cab}{filas}</div>'


def cuerpo_plantilla(abierta=False, quien=False, reglas=None, sup="", desde_reglas=False):
    """La pestaña «Plantilla»: el formulario, las preguntas y las reglas de ejemplo, con el teléfono al costado.
    desde_reglas: la página corrida hasta las reglas, con las pestañas a la vista; sin un corrimiento en píxeles, que la escala (180) no acompaña."""
    pila = ("" if desde_reglas else caja_plantilla(quien) + caja_preguntas(abierta)) + (reglas if reglas is not None else caja_reglas_pl())
    cols = f'<div class="f-cols"><div class="f-pila">{pila}</div>{vista_pl()}</div>'
    return f'<div class="w-body">{sup}{tabs_pl("plantilla")}{cols}</div>'


# ---------------------------------------------------------------- Catálogos: una fila por catálogo, con su origen (64); cada uno se abre aparte
def catalogos_pl():
    filas = ""
    for n, origen, ops, usa in CATS:
        o = str(ops) if ops else '<span class="gris">—</span>'
        tip = f"La usa la {usa.split(' · ')[0].lower()}. Cambiá la pregunta primero."
        filas += (f'<div class="w-tr ct2"><span><a href="#">{n}</a></span><span>{origen}</span><span class="num">{o}</span><span>{usa}</span>'
                  f'<span class="q-acc2"><button type="button" class="ib" aria-label="Editar {n}">{A.LAPIZ}</button>'
                  f'<button type="button" class="ib" aria-label="Quitar {n}" aria-disabled="true" title="{tip}">{A.QUITAR}</button></span></div>')
    return ('<div class="w-caja"><div class="f-cab"><span>Catálogos de la plantilla</span><span class="der">'
            f'<button type="button" class="cb cb-sec">{MAS} Agregar catálogo</button></span></div>'
            '<div class="w-th ct2"><span>Catálogo</span><span>De dónde salen las opciones</span><span>Opciones</span><span>La usa</span><span class="sr">Acciones</span></div>'
            + filas + "</div>")


def dlg_catalogo_mano():
    filas = "".join(f'<div class="w-tr op2"><span class="num">{k}</span><span>{t}</span><span class="cod">{c}</span>{E.acciones_q(f"la opción {t}", k == 1, k == len(OPS_MOT))}</div>'
                    for k, (t, c) in enumerate(OPS_MOT, 1))
    cuerpo = (campo("Nombre", "Motivos de visita")
              + f'<div class="w-cmp"><span class="rt">De dónde salen las opciones</span><div class="ct ro bloq">{CAND}Escritas a mano</div></div>'
              + '<div class="w-cmp ancho"><span class="rt">Opciones</span><div class="k-ops"><div class="w-th op2"><span>#</span><span>Texto</span><span>Código</span>'
              '<span class="sr">Acciones</span></div>' + filas + "</div>"
              f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar opción</button></div>')
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Listo</button>'
    return F.dialogo("Motivos de visita", cuerpo, pie, una=False).replace('class="w-dlg"', 'class="w-dlg cat"', 1)


def dlg_catalogo_contactos():
    cuerpo = (campo("Nombre", "Clientes")
              + f'<div class="w-cmp"><span class="rt">De dónde salen las opciones</span><div class="ct ro bloq">{CAND}De los contactos de WhatsApp</div></div>'
              + '<div class="w-cmp ancho">' + bloqueado("A quiénes ofrece", "Llega sin filtros: cada organización elige, por etiqueta, qué contactos ofrece.").split('<div class="w-cmp">', 1)[1])
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Listo</button>'
    return F.dialogo("Clientes", cuerpo, pie, una=False).replace('class="w-dlg"', 'class="w-dlg cat"', 1)


# ---------------------------------------------------------------- Publicación: el uso en grilla y las versiones con su motivo
def publicacion(tipo="publicada"):
    """Sin el renglón «Estado», que ya dice la banda (175): la grilla dice cuántas organizaciones la usaron y la última publicación, o quién la
    retiró y por qué. La caja se llama «Publicación», porque ya no muestra el estado."""
    if tipo == "publicada":
        est = F.grilla([("La usaron", "12 organizaciones"), ("Última publicación", f"05/10/2026 11:20 · {OTRO_OP}")])
        vers = [("2", "05/10/2026 11:20", OTRO_OP, "Agrega el monto estimado."), ("1", "28/09/2026 16:05", OPERADOR, "Primera versión.")]
    elif tipo == "retirada":
        est = F.grilla([("La usaron", "3 organizaciones"), ("Retirada", f"10/10/2026 09:40 · {OPERADOR}"), ("Motivo", "Se reemplaza por una más corta.")])
        vers = [("1", "01/10/2026 15:30", OTRO_OP, "Primera versión.")]
    else:
        est = F.grilla([("La usaron", '<span class="gris">—</span>')])
        vers = []
    filas = "".join(f'<div class="w-tr vr"><span>{n}</span><span>{f}</span><span>{p}</span><span>{m}</span></div>' for n, f, p, m in vers)
    tabla = ('<div class="w-th vr"><span>Versión</span><span>Publicada</span><span>Por</span><span>Motivo</span></div>' + filas) if vers \
        else '<div class="pb-vacio">Todavía no se publicó.</div>'
    return (f'<div class="w-caja"><div class="f-cab"><span>Publicación</span></div><div class="pb-in">{est}</div></div>'
            f'<div class="w-caja"><div class="f-cab"><span>Versiones</span></div>{tabla}</div>')


E_PL = ["Plantilla", "Con cambios", "Para quién es", "Guardando", "Borrador guardado", "Otra persona guardó", "Descartar cambios", "Catálogos",
        "Un catálogo a mano", "Un catálogo de los contactos", "Publicación", "Publicación: menú", "Publicación: borrador", "Publicación: retirada"]
NOMBRES = {"Publicación: borrador": "Control de vehículo", "Publicación: retirada": "Orden de trabajo"}


def ficha(estados=E_PL):
    pub = lambda modo="limpio", **k: banda_pl(FORM, EST["Publicada"], acc_pl(modo, **k))  # noqa: E731
    otra = lambda cuerpo: f'<div class="w-body">{tabs_pl("publicacion")}<div class="f-pila" style="max-width: 880px;">{cuerpo}</div></div>'  # noqa: E731
    cat = f'<div class="w-body">{tabs_pl("catalogos")}{catalogos_pl()}</div>'
    V = {"Plantilla": (pub(), cuerpo_plantilla()), "Con cambios": (pub("cambios"), cuerpo_plantilla(abierta=True)),
         "Para quién es": (pub("cambios"), cuerpo_plantilla(quien=True)), "Guardando": (pub("guardando"), cuerpo_plantilla(abierta=True)),
         "Borrador guardado": (pub(), cuerpo_plantilla()), "Otra persona guardó": (pub("cambios"), cuerpo_plantilla(abierta=True, sup=E.CONFLICTO)),
         "Descartar cambios": (pub("cambios"), cuerpo_plantilla(abierta=True)), "Catálogos": (pub(), cat), "Un catálogo a mano": (pub(), cat),
         "Un catálogo de los contactos": (pub(), cat), "Publicación": (pub(), otra(publicacion())), "Publicación: menú": (pub(menu=True), otra(publicacion())),
         "Publicación: borrador": (banda_pl("Control de vehículo", EST["Borrador"], acc_pl(kebab=False)), otra(publicacion("borrador")).replace('<span class="c">2</span>', '<span class="c">1</span>')),
         "Publicación: retirada": (banda_pl("Orden de trabajo", EST["Retirada"], acc_pl(publicar="Volver a publicar", kebab=False)),
                                   otra(publicacion("retirada")).replace('<span class="c">2</span>', '<span class="c">3</span>'))}
    return {e: V[e] for e in estados}


def plat_ficha():
    capas = {"Borrador guardado": toast(f"Guardamos el borrador de {FORM}."), "Un catálogo a mano": dlg_catalogo_mano(), "Un catálogo de los contactos": dlg_catalogo_contactos(),
             "Descartar cambios": A.confirmar("¿Descartar los cambios?", "Vas a perder lo que cambiaste sin guardar.", "Descartar", cancelar="Seguir editando")}
    extra = "      nombre: " + json.dumps(NOMBRES, ensure_ascii=False) + "[e] ?? " + json.dumps(FORM, ensure_ascii=False) + ",\n"
    return pagina_plat(ficha(), capas, E_PL, "Plantilla de formulario · /plataforma/formularios/:id", "Plataforma / Administración / Formularios / Biblioteca / {{nombre}}",
                       alto=1960, extra=extra)


# ================================================================ Plat-FRM-Plantilla-Reglas: las reglas de ejemplo, debajo de las preguntas
E_RG = ["Reglas", "Editar una regla", "Mandar por correo", "Avisar a un rol y a una persona", "Una regla con errores", "Guardando", "Borrador guardado", "Sin reglas"]


def plat_reglas():
    n1 = lambda acciones: K.regla_abierta(1, "Se recibe una respuesta", acciones)  # noqa: E731
    n2 = lambda acciones: K.regla_abierta(2, "Se aprueba una respuesta", acciones)  # noqa: E731
    cond = K.cond5("Monto estimado", "Es mayor o igual a", "100.000") + K.AGREGAR_COND
    n3 = lambda acciones: K.regla_abierta(3, "Se aprueba una respuesta", acciones, si=cond)  # noqa: E731
    uno = a_msj_pl(1, K.M_REC, adj=K.adjuntar(False), primera=True) + a_aprobar_pl(2, ultima=True)
    dos = a_pdf_pl(1, primera=True) + a_msj_pl(2) + a_correo_pl(3, ultima=True)
    tres = a_rol_pl(1, primera=True) + a_persona_pl(2, ultima=True)
    mal = a_msj_pl(1, adj=K.adjuntar(motivo=K.MOT_FALTA, arreglo=K.SUBIR), primera=True) + a_pdf_pl(2) + a_correo_pl(3, ultima=True)
    cu = lambda **k: cuerpo_plantilla(reglas=caja_reglas_pl(**k), desde_reglas=True)  # noqa: E731
    pub = lambda modo="cambios": banda_pl(FORM, EST["Publicada"], acc_pl(modo))  # noqa: E731
    V = {"Reglas": (pub("limpio"), cu()), "Editar una regla": (pub(), cu(abierta=n1(uno), n_abierta=1)), "Mandar por correo": (pub(), cu(abierta=n2(dos), n_abierta=2)),
         "Avisar a un rol y a una persona": (pub(), cu(abierta=n3(tres), n_abierta=3)), "Una regla con errores": (pub(), cu(abierta=n2(mal), n_abierta=2)),
         "Guardando": (pub("guardando"), cu(abierta=n1(uno), n_abierta=1)), "Borrador guardado": (pub("limpio"), cu()), "Sin reglas": (pub("limpio"), cu(vacia=True))}
    capas = {"Borrador guardado": toast(f"Guardamos el borrador de {FORM}.")}
    return pagina_plat(V, capas, E_RG, "Plantilla de formulario · reglas de ejemplo", "Plataforma / Administración / Formularios / Biblioteca / Visita a cliente", alto=1500)


# ================================================================ Plat-FRM-Pdf: el diseño del PDF de la 21, sin el logo ni el color (59 y 82)
SECS_PL = [("La visita", [("Cliente", True), ("Fecha de la visita", True)]),
           ("El resultado", [("¿Se concretó la venta?", True), ("Monto estimado", True), ("Motivo", True), ("Observaciones", True)]),
           ("Archivos", [("Fotos de la visita", True), ("Remito firmado", True)])]
AY_COMP_PL = "Se guarda con el borrador de la plantilla y se publica con ella. Al usarla, cada organización recibe una copia."
AY_ENC_PL = "El logo y los datos salen de la página pública de cada organización."
AY_COLOR = "Cada organización elige el color al usar la plantilla."
E_PDF = ["Diseño", "Estilo moderno", "Armando la vista previa", "Guardando", "Borrador guardado", "Salir sin guardar"]


def con_secciones(fn):
    def envuelta(*a, **k):
        viejo = K.SECCIONES
        K.SECCIONES = SECS_PL
        try:
            return fn(*a, **k)
        finally:
            K.SECCIONES = viejo
    return envuelta


@con_secciones
def hoja_pl(estilo="clasico"):
    """La hoja con marcadores: la plataforma no ve los datos de ninguna organización."""
    h = K.hoja(estilo, num="VIS-000001", hora="13/10/2026 15:30", aprobo="Aprobada por Nombre Apellido el 13/10/2026 16:05")
    org = '<span class="org"><b>Grupo Delta</b><small>Av. Corrientes 1234, CABA · ventas@delta.ejemplo.com · 011 4321-0000</small></span>'
    assert h.count(org) == 1 and h.count('<span class="lg">D</span>') == 1
    h = h.replace('<span class="lg">D</span>', '<span class="lg ph">Logo</span>', 1)
    return h.replace(org, '<span class="org"><b>Nombre de la organización</b><small>Dirección · correo · teléfono</small></span>', 1)


@con_secciones
def caja_pdf_pl(estilo="clasico", guardar="limpio"):
    t = K.caja_pdf(estilo, True, True, guardar)
    t = t.replace("Guardar diseño", "Guardar borrador").replace(info(K.AY_COMPROBANTE), info(AY_COMP_PL))
    t = re.sub(r'<div class="w-cmp"><span class="rt">Color</span>.*?</small></div></div>', lambda m: bloqueado("Color", AY_COLOR), t, count=1, flags=re.S)
    enc = ('<div class="pd-enc"><span class="lg ph">Logo</span><span class="tx"><b>Nombre de la organización</b><small>Dirección · correo · teléfono, de su página pública</small></span></div>')
    t = re.sub(r'<div class="pd-enc">.*?</a></div>', lambda m: enc, t, count=1, flags=re.S)
    return t.replace(info(K.AY_ENC), info(AY_ENC_PL))


def plat_pdf():
    def cu(estilo="clasico", guardar="sucio", armando=False):
        if armando:
            v = K.caja_vista(f'<div class="pv-esp">{E.GIRA} Armando la vista previa…</div>', armando=True)
        else:
            v = K.caja_vista(hoja_pl(estilo))
        v = v.replace(f"Con {K.NUM_A} de ejemplo · Español", "Con datos de ejemplo")
        return f'<div class="w-body"><div class="pd-cols">{caja_pdf_pl(estilo, guardar)}{v}</div></div>'
    descartar = lambda on: f'<button type="button" class="cb cb-sec"{"" if on else " disabled"}>Descartar</button>'  # noqa: E731
    banda = lambda on: banda_pl("Comprobante de visita", f"Diseño del PDF · {FORM}", descartar(on), "Plat-FRM-Plantilla-Reglas.dc.html", "Volver a la plantilla")  # noqa: E731
    V = {"Diseño": (banda(False), cu(guardar="limpio")), "Estilo moderno": (banda(True), cu("moderno")), "Armando la vista previa": (banda(True), cu("moderno", armando=True)),
         "Guardando": (banda(False), cu("moderno", "guardando")), "Borrador guardado": (banda(False), cu("moderno", "limpio")), "Salir sin guardar": (banda(True), cu("moderno"))}
    capas = {"Borrador guardado": toast(f"Guardamos el borrador de {FORM}."),
             "Salir sin guardar": A.confirmar("¿Salir sin guardar el diseño?", "Los cambios en el diseño del PDF se pierden.", "Salir sin guardar", cancelar="Seguir editando")}
    return pagina_plat(V, capas, E_PDF, "Plantilla de formulario · diseño del PDF", "Plataforma / Administración / Formularios / Biblioteca / Visita a cliente / Diseño del PDF", alto=1500)


# ================================================================ Plat-FRM-Publicar: el motivo y la comprobación, por pregunta, catálogo o regla
E_PUB = ["Sin problemas", "Con problemas", "Falta el motivo", "Primera publicación", "Volver a publicar", "Comprobando", "Publicando", "Otra persona guardó"]
MOTIVO_PUB = "Suma el remito firmado y la opción «Cobranza»."


def que_se_publica(v="3"):
    return E.z_zona("Qué se publica", E.z_dato("Borrador", f"Guardado el {GUARDADO}") + E.z_dato("Versión", v) + E.z_dato("Agregadas", "Remito firmado")
                    + E.z_dato("Cambiadas", "Observaciones y el catálogo Motivos de visita") + E.z_dato("Reglas", "Cambió la regla 3"))


def problemas():
    filas = (E.z_problema("Pregunta 5 · Motivo", "Elegí el catálogo.", "Ir a la pregunta").replace("FRM-Editor.dc.html", "Plat-FRM-Plantilla.dc.html")
             + E.z_problema("Catálogo · Motivos de visita", "La opción «Cobranza» no tiene código.", "Ir al catálogo").replace("FRM-Editor.dc.html", "Plat-FRM-Plantilla.dc.html")
             + E.z_problema("Regla 2 · Acción 1", K.MOT_FALTA, "Ir a la regla").replace("FRM-Editor.dc.html", "Plat-FRM-Plantilla-Reglas.dc.html"))
    return E.z_zona("Problemas", filas, E.AYUDA_PROBLEMAS)


def motivo_pub(valor=MOTIVO_PUB, mal=False):
    if mal:
        return area("Motivo", "Contá qué cambia", ph=True, mal="Escribí el motivo.")
    return area("Motivo", valor)


def pie_pub(texto="Publicar versión 3", activo=True, trabajando=""):
    cancelar = f'<button type="button" class="cb cb-sec"{" disabled" if trabajando else ""}>Cancelar</button>'
    if trabajando:
        return cancelar + E.trabaja(trabajando)
    d = "" if activo else f' disabled title="{E.MOTIVO_PROBLEMAS}"'
    return cancelar + f'<button type="button" class="cb cb-pri"{d}>{texto}</button>'


def dlg_pub(titulo, cuerpo, pie):
    return A.dlg_publicar(titulo, cuerpo, pie)


def plat_publicar():
    base = ficha(["Plantilla"])["Plantilla"]
    nueva = ficha(["Publicación: borrador"])["Publicación: borrador"]
    retirada = ficha(["Publicación: retirada"])["Publicación: retirada"]
    V = {e: (nueva if e == "Primera publicación" else retirada if e == "Volver a publicar" else base) for e in E_PUB}
    tit = f"Publicar «{FORM}»"
    esq = E.z_zona("Qué se publica", '<div class="z-esq"><span style="width: 85%;"></span><span style="width: 60%;"></span><span style="width: 75%;"></span></div>')
    primera = E.z_zona("Qué se publica", E.z_dato("Borrador", "Guardado el 30/10/2026 12:05") + E.z_dato("Versión", "1") + E.z_dato("Preguntas", "7") + E.z_dato("Reglas", "2"))
    misma = E.z_zona("Qué se publica", E.z_dato("Versión", "1, la misma que estaba publicada") + E.z_dato("La usaron", "3 organizaciones"))
    capas = {
        "Sin problemas": dlg_pub(tit, que_se_publica() + motivo_pub(), pie_pub()),
        "Con problemas": dlg_pub(tit, problemas() + que_se_publica() + motivo_pub(), pie_pub(activo=False)),
        "Falta el motivo": dlg_pub(tit, que_se_publica() + motivo_pub(mal=True), pie_pub()),
        "Primera publicación": dlg_pub("Publicar «Control de vehículo»", primera + motivo_pub("Primera versión."), pie_pub("Publicar versión 1")),
        "Volver a publicar": dlg_pub("Volver a publicar «Orden de trabajo»", misma + motivo_pub("Se vuelve a ofrecer, sin cambios."), pie_pub("Volver a publicar")),
        "Comprobando": dlg_pub(tit, esq, pie_pub(trabajando="Comprobando…")),
        "Publicando": dlg_pub(tit, que_se_publica() + motivo_pub(), pie_pub(trabajando="Publicando…")),
        "Otra persona guardó": dlg_pub(tit, '<div class="z-pad">' + A.aviso(f"{OTRO_OP} guardó cambios en esta plantilla el 03/11/2026 10:43.") + "</div>",
                                       '<button type="button" class="cb cb-sec">Cerrar</button><button type="button" class="cb cb-pri">Revisar cambios</button>'),
    }
    extra = "      nombre: " + json.dumps({"Primera publicación": "Control de vehículo", "Volver a publicar": "Orden de trabajo"}, ensure_ascii=False) + "[e] ?? " + json.dumps(FORM, ensure_ascii=False) + ",\n"
    return pagina_plat(V, capas, E_PUB, "Publicar una plantilla de formulario", "Plataforma / Administración / Formularios / Biblioteca / {{nombre}}", alto=1100, extra=extra)


# ================================================================ Plat-FRM-Retirar: desde el ⋮ de la banda, en rojo; las copias ya hechas no cambian
E_RET = ["Con el motivo", "Falta el motivo", "Retirando", "Otra persona guardó"]


def plat_retirar():
    base = ficha(["Publicación"])["Publicación"]
    V = {e: base for e in E_RET}
    texto = '<p class="d-tx">Deja de aparecer en la biblioteca de las organizaciones. Las copias que ya hicieron no cambian.</p>'

    def dlg(cuerpo, pie):
        return F.dialogo(f"Retirar «{FORM}»", cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg motivo"', 1)
    cancelar = lambda d=False: f'<button type="button" class="cb cb-sec"{" disabled" if d else ""}>Cancelar</button>'  # noqa: E731
    retirar = '<button type="button" class="cb cb-pel lleno">Retirar</button>'
    capas = {"Con el motivo": dlg(texto + area("Motivo", "Se reemplaza por «Visita comercial»."), cancelar() + retirar),
             "Falta el motivo": dlg(texto + area("Motivo", "Contá por qué se retira", ph=True, mal="Escribí el motivo."), cancelar() + retirar),
             "Retirando": dlg(texto + area("Motivo", "Se reemplaza por «Visita comercial»."), cancelar(True) + E.trabaja("Retirando…", "cb-pel lleno")),
             "Otra persona guardó": dlg('<div class="z-pad">' + A.aviso(f"{OTRO_OP} cambió esta plantilla el 03/11/2026 10:43.") + "</div>",
                                        '<button type="button" class="cb cb-sec">Cerrar</button><button type="button" class="cb cb-pri">Ver lo nuevo</button>')}
    return pagina_plat(V, capas, E_RET, "Retirar una plantilla de formulario", "Plataforma / Administración / Formularios / Biblioteca / Visita a cliente", alto=1000)


# ================================================================ Plat-FRM-Categorias: la lista corta, con orden y ↑ ↓ ✎ 🗑 a la vista; todo pide motivo
E_CAT = ["Lista", "Una en uso", "Nueva categoría", "Faltan los datos", "Creando", "Editar", "Subir", "Borrar", "Vacía"]


def mot_uso(usos):
    return f"La usa {usos} plantilla. Cambiale la categoría primero." if usos == 1 else f"La usan {usos} plantillas. Cambiales la categoría primero."


def fila_cat(k, n, usos, tip_abierto=False):
    acc = E.acciones_q(n, k == 1, k == len(CATEGORIAS))
    if usos:
        quitar = f'<button type="button" class="ib" aria-label="Quitar {n}">{A.QUITAR}</button>'
        assert quitar in acc
        acc = acc.replace(quitar, f'<span class="e-tipw"><button type="button" class="ib" aria-label="Quitar {n}" aria-disabled="true">{A.QUITAR}</button>'
                                  f'<span class="e-tip" role="tooltip"{"" if tip_abierto else " hidden"}>{mot_uso(usos)}</span></span>')
    uso = f"{usos} plantilla" if usos == 1 else f"{usos} plantillas" if usos else '<span class="gris">—</span>'
    return f'<div class="w-tr cg"><span><span class="num">{k}</span></span><span>{n}</span><span>{uso}</span>{acc}</div>'


def lista_cat(tip=False, vacia=False):
    cab = '<div class="w-th cg"><span>Orden</span><span>Categoría</span><span>Plantillas</span><span class="sr">Acciones</span></div>'
    if vacia:
        return '<div class="w-body"><div class="w-caja"><div class="f-cuerpo"><b>Todavía no hay categorías.</b></div></div></div>'
    filas = "".join(fila_cat(k, n, u, tip and n == "Logística") for k, (n, u) in enumerate(CATEGORIAS, 1))
    return f'<div class="w-body"><div class="w-caja">{cab}{filas}<div class="w-pie"><span>1–4 de 4</span><span>10 por página · Página 1 de 1</span></div></div></div>'


def plat_categorias():
    banda = lambda res="4 categorías": F.banda("Categorías", res, f'<button type="button" class="cb cb-pri">{MAS} Nueva categoría</button>')  # noqa: E731
    V = {e: (banda("Sin categorías" if e == "Vacía" else "4 categorías"), lista_cat(tip=e == "Una en uso", vacia=e == "Vacía")) for e in E_CAT}
    cancelar = lambda d=False: f'<button type="button" class="cb cb-sec"{" disabled" if d else ""}>Cancelar</button>'  # noqa: E731
    pri = lambda t, cl="cb-pri": f'<button type="button" class="cb {cl}">{t}</button>'  # noqa: E731

    def dlg(titulo, cuerpo, pie):
        return F.dialogo(titulo, cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg motivo"', 1)
    capas = {"Nueva categoría": dlg("Nueva categoría", campo("Nombre", "Recursos humanos") + area("Motivo", "Plantillas para el personal."), cancelar() + pri("Crear categoría")),
             "Faltan los datos": dlg("Nueva categoría", campo("Nombre", "Por ejemplo, Recursos humanos", ph=True, mal="Escribí un nombre.")
                                     + area("Motivo", "Contá por qué", ph=True, mal="Escribí el motivo."), cancelar() + pri("Crear categoría")),
             "Creando": dlg("Nueva categoría", campo("Nombre", "Recursos humanos") + area("Motivo", "Plantillas para el personal."), cancelar(True) + E.trabaja("Creando…")),
             "Editar": dlg("Editar «Logística»", campo("Nombre", "Logística y flota") + area("Motivo", "Suma las plantillas de la flota."), cancelar() + pri("Guardar cambios")),
             "Subir": dlg("Subir «Logística»", '<p class="d-tx">Pasa al lugar 1, antes de «Ventas».</p>' + area("Motivo", "Es la que más se usa."), cancelar() + pri("Subir")),
             "Borrar": dlg("¿Borrar «Calidad»?", '<p class="d-tx">Ninguna plantilla la usa.</p>' + area("Motivo", "No se usó nunca."), cancelar() + pri("Borrar", "cb-pel lleno"))}
    return pagina_plat(V, capas, E_CAT, "Categorías de formularios · /plataforma/formularios/categorias", "Plataforma / Administración / Formularios / Categorías", activo="categorias")


# ================================================================ M-Plat-FRM-Biblioteca: en el teléfono, la biblioteca es solo para ver
E_TBIB_PLAT = ["Todas", "Filtros", "Sin resultados", "Vacía", "Cargando", "Error"]


def tel_biblioteca_plat():
    viejo = B17.PLANTILLAS
    B17.PLANTILLAS = [(n, cat, "" if est == "Publicada" else "off", est, "", f"La usaron {uso}" if uso else "—") for n, cat, est, uso, _ in PLANTILLAS]
    try:
        t = B17.tel_biblioteca_plat()
    finally:
        B17.PLANTILLAS = viejo
    for a, b in [('Todos los estados<span class="d">3', 'Todas las plantillas<span class="d">4'), ('Publicadas<span class="d">1', 'Publicadas<span class="d">2')]:
        t = t.replace(a, b)
    return t


# ================================================================ La organización: la biblioteca, una plantilla y usarla (40 y 79)
CSS_ORG = (E.CSS_E12 + E.CSS_CA4 + X.CSS_19 + K.CSS_RG + K.CSS_21 + L.CSS_PESTANAS + F.CSS_GRILLA + CSS_22)
VER_PDF_ORG = '<a class="lnk" href="FRM-Pdf.dc.html">Ver el diseño</a>'


def pagina_org(V, capas, estados, nombre, css=""):
    return A.pagina_editor(V, capas, estados, nombre, CSS_ORG + css)


def tarjeta(n, desc, meta, usada=""):
    u = f'<span class="u">{K.CHECK} La usaste en {usada}</span>' if usada else ""
    return f'<a class="bt-card" href="FRM-Plantilla.dc.html"><b>{n}</b><span class="d">{desc}</span><span class="p">{meta}</span>{u}</a>'


# Dónde se usó: el primer formulario y cuántos más (198); «Visita a cliente» se usó en dos formularios de la organización
USADA_VIS = f"«{FORM}» y 1 más"
TARJETAS = [("Comprobante de transferencia", DESC_TRF, "5 preguntas · Para clientes", ""), (FORM, DESC, "8 preguntas · 2 catálogos · Para empleados", USADA_VIS)]
E_BIB_ORG = ["Con plantillas", "Sin resultados", "Sin plantillas", "Cargando", "Error"]


def biblioteca_org():
    bus = lambda q="": f'<div class="w-caja o-fb"><span class="w-bus{" lleno" if q else ""}">{F.BUSCAR} {q or "Buscar plantilla"}</span><span class="tot">{"0 plantillas" if q else "2 plantillas"}</span></div>'  # noqa: E731
    grupo = '<div class="bt-grupo"><h2>Ventas</h2><div class="bt-grid">' + "".join(tarjeta(*x) for x in TARJETAS) + "</div></div>"
    caja = lambda tx: f'<div class="w-caja"><div class="f-cuerpo">{tx}</div></div>'  # noqa: E731
    cu = {"Con plantillas": bus() + grupo, "Sin resultados": bus("inspección") + caja('<b>Ninguna plantilla coincide con «inspección».</b><button type="button" class="cb cb-enl">Limpiar la búsqueda</button>'),
          "Sin plantillas": caja("<b>Todavía no hay plantillas.</b>"), "Cargando": bus() + '<div class="bt-esq"><span></span><span></span><span></span></div>',
          "Error": bus() + caja('<b>No pudimos cargar las plantillas.</b><button type="button" class="cb cb-sec">Reintentar</button>')}
    res = {"Sin plantillas": "Sin plantillas", "Cargando": "", "Error": ""}
    V = {e: (E.banda("Biblioteca de formularios", res.get(e, "2 plantillas"), "", "FRM-Formularios-22.dc.html"), f'<div class="w-body">{cu[e]}</div>') for e in E_BIB_ORG}
    return pagina_org(V, {}, E_BIB_ORG, "Biblioteca de formularios · /org/formularios/biblioteca")


# ---------------------------------------------------------------- FRM-Plantilla: la vista de una plantilla, con sus reglas en palabras
QUE_ELEGIS = lambda que: f'{que} que elegís al usarla'  # noqa: E731
REGLAS_VISTA = [
    (1, "se recibe una respuesta", None, [f"Mandarle un mensaje a quien la cargó: «{K.MENSAJE_REC}»", f"Pedir aprobación a alguien con el rol que elegís al usarla{SUGERIDO(SUP)}"]),
    (2, "se aprueba una respuesta", None, ["Armar el PDF «Comprobante de visita»", f"Mandarle un mensaje a quien la cargó: «{K.MENSAJE_APR}»{K.CON_PDF}",
                                          "Mandar por correo a la dirección que elegís al usarla: «Se aprobó {número}.»" + K.CON_PDF]),
    (3, "se aprueba una respuesta", "Monto estimado es mayor o igual a 100.000", [f"Avisar a las personas con el rol que elegís al usarla{SUGERIDO(GER)}: «{K.MENSAJE_DUENO}»"]),
    (4, "se rechaza una respuesta", None, [f"Mandarle un mensaje a quien la cargó: «{K.MENSAJE_RCH}»"]),
]
AY_CATS_ORG = "Al usarla, se suman a tus catálogos y los podés cambiar. Los de los contactos llegan sin filtros."
AY_REGLAS_ORG = "Llegan al formulario sin guardar: elegís el rol, la dirección y la plantilla de WhatsApp, y las guardás."


def resumen_ro(n, cuando, si, acciones):
    s = f'<div class="l"><span class="ab-chip">Si</span><span>{si}</span></div>' if si else ""
    ol = "".join(f"<li>{a}</li>" for a in acciones)
    return (f'<div class="rg2-r"><span class="n">{n}</span><div class="tx"><div class="l"><span class="ab-chip">Cuando</span><span>{cuando}</span></div>{s}'
            f'<div class="l"><span class="ab-chip">Hacer</span><ol>{ol}</ol></div></div><span></span></div>')


def cuerpo_vista_org():
    datos = F.grilla([("Categoría", "Ventas"), ("Para quién es", "Empleados"), ("Preguntas", "8"), ("La usaste en", FORM)])
    caja_d = f'<div class="w-caja"><div class="f-cab"><span>La plantilla</span></div><div class="pt-d"><p>{DESC}</p>{datos}</div></div>'
    cats = ('<div class="pt-it"><b>Clientes</b><span>De los contactos de WhatsApp, sin filtros</span></div>'
            '<div class="pt-it"><b>Motivos de visita</b><span>3 opciones: Seguimiento, Venta nueva y Reclamo</span></div>')
    caja_c = f'<div class="w-caja"><div class="f-cab"><span class="tt">Catálogos que trae{info(AY_CATS_ORG)}</span></div>{cats}</div>'
    caja_r = (f'<div class="w-caja rg2"><div class="f-cab"><span class="tt">Reglas de ejemplo{info(AY_REGLAS_ORG)}</span></div>'
              + "".join(resumen_ro(*r) for r in REGLAS_VISTA) + "</div>")
    return f'<div class="w-body"><div class="f-cols"><div class="f-pila">{caja_d}{caja_preguntas(solo_ver=True)}{caja_c}{caja_r}</div>{vista_pl()}</div></div>'


USAR = '<a class="cb cb-pri" href="FRM-Plantilla-Usar.dc.html">Usar esta plantilla</a>'
SIN_PERMISO = "Trae catálogos: para usarla necesitás el permiso «Administrar catálogos»."
E_PLO = ["Con permiso", "Sin permiso de catálogos", "Cargando", "Ya no está"]


def vista_org(estados=E_PLO):
    apagado = (f'<span class="e-tipw"><button type="button" class="cb cb-pri" aria-disabled="true">Usar esta plantilla</button>'
               f'<span class="e-tip" role="tooltip">{SIN_PERMISO}</span></span>')
    cargando = ('<div class="w-body"><div class="f-cuerpo izq"><div class="esq"><span style="width: 60%;"></span><span style="width: 80%;"></span>'
                '<span style="width: 70%;"></span></div></div></div>')
    no_esta = ('<div class="w-body"><div class="w-caja"><div class="f-cuerpo"><b>Esta plantilla ya no está en la biblioteca.</b>'
               '<a class="cb cb-sec" href="FRM-Biblioteca.dc.html">Volver a la biblioteca</a></div></div></div>')
    vol = "FRM-Biblioteca.dc.html"
    V = {"Con permiso": (E.banda(FORM, "Ventas", USAR, vol), cuerpo_vista_org()), "Sin permiso de catálogos": (E.banda(FORM, "Ventas", apagado, vol), cuerpo_vista_org()),
         "Cargando": (E.banda(FORM, "", "", vol), cargando), "Ya no está": (E.banda("Plantilla", "", "", vol), no_esta)}
    return {e: V[e] for e in estados}


def plantilla_org():
    return pagina_org(vista_org(), {}, E_PLO, "Plantilla de formulario · /org/formularios/biblioteca/:id")


# ---------------------------------------------------------------- FRM-Plantilla-Usar: el nombre y el prefijo propuesto; abre el formulario nuevo
E_USAR = ["Prefijo tomado", "Falta el nombre", "Creando", "Se retiró"]
AY_PREF_USAR = "VIS ya lo usa «Visita a cliente». Las respuestas se numeran VIS2-000001. Se puede cambiar hasta la primera publicación."


def plantilla_usar():
    base = vista_org(["Con permiso"])["Con permiso"]
    V = {e: base for e in E_USAR}
    texto = '<p class="d-tx">Se crea un borrador con sus 8 preguntas, sus 2 catálogos y sus reglas de ejemplo para completar.</p>'

    def dlg(cuerpo, pie):
        return F.dialogo(f"Usar «{FORM}»", cuerpo, pie, una=False).replace('class="w-dlg"', 'class="w-dlg usar"', 1)
    cancelar = lambda d=False: f'<button type="button" class="cb cb-sec"{" disabled" if d else ""}>Cancelar</button>'  # noqa: E731
    crear = '<a class="cb cb-pri" href="FRM-Editor-Reglas-Plantilla.dc.html">Crear el formulario</a>'
    pref = campo("Prefijo de numeración", "VIS2", ayuda=AY_PREF_USAR)
    capas = {"Prefijo tomado": dlg(texto + campo("Nombre", FORM) + pref, cancelar() + crear),
             "Falta el nombre": dlg(texto + campo("Nombre", "Escribí un nombre", ph=True, mal="Escribí un nombre.") + pref, cancelar() + crear),
             "Creando": dlg(texto + campo("Nombre", FORM) + pref, cancelar(True) + E.trabaja("Creando…")),
             "Se retiró": dlg('<div class="z-pad" style="grid-column: 1 / -1;">' + A.aviso("Esta plantilla ya no está en la biblioteca.", "mal") + "</div>",
                              '<a class="cb cb-pri" href="FRM-Biblioteca.dc.html">Volver a la biblioteca</a>')}
    return pagina_org(V, capas, E_USAR, "Usar una plantilla de formulario")


# ================================================================ FRM-Editor-Reglas-Plantilla: el formulario nuevo y sus reglas precargadas (B9)
# Las reglas se leen en pasos, como las de la 21 (138), y «Historial» va primero en la cabecera: apagado hasta que se guardan, con el motivo
# en su tooltip (140). Lo que elige cada organización dice «Elegí…», y en rojo después de tocar «Guardar reglas» (43).
ELEGI = lambda que, mal=False: f'<span class="ab-chip {"mal" if mal else "falta"}">{que}</span>'  # noqa: E731
P24_ORG = lambda mal=False: f'<span class="g">fuera de las 24 horas, con</span>{ELEGI("Elegí la plantilla", mal)}'  # noqa: E731
SUG_ORG = lambda rol: f'<span class="sug">sugerido: {rol}</span>'  # noqa: E731
HIST_PLANTILLA = "Todavía no se guardaron: vienen de la plantilla."
NO_DISPONIBLE = K.datos5("[!Monto estimado]")  # la etiqueta en rojo de la 21 (149), con su clase
CSS_ERP = """.rg5-r.mal { background: var(--peligro-t); }
.rg5-cond .ct.sel.mal { border-color: var(--peligro); color: var(--peligro); }
.rg5 > .f-cab .e-tipw .e-tip { left: auto; right: 0; top: calc(100% + 6px); width: 260px; white-space: normal; z-index: 40; }
.w-caja.rg5:has(.e-tip:not([hidden])) { overflow: visible; }
"""


def reglas_org(mal=False, borrada=False, elegidas=False):
    """Las reglas de ejemplo, precargadas y sin guardar, como las lee la 21: (cuándo, condiciones, [(acción, etiquetas, mensaje, lo demás)])."""
    if elegidas:
        return [("Se recibe una respuesta", [], [("Mandarle un mensaje a quien la cargó", [], K.M_REC, ""), ("Pedir aprobación a un rol", [SUP], None, "")]),
                ("Se aprueba una respuesta", [], [("Armar el PDF", ["Comprobante de visita"], None, VER_PDF_ORG), ("Mandarle un mensaje a quien la cargó", ["con el PDF"], K.M_APR, ""),
                                                  ("Mandar por correo", [DIRECCION, "con el PDF"], K.M_CORREO, "")]),
                ("Se aprueba una respuesta", [COND_MONTO], [("Avisar a un rol", ["Dueño"], K.M_DUENO, "")]),
                ("Se rechaza una respuesta", [], [("Mandarle un mensaje a quien la cargó", [], K.M_RCH, "")])]
    cond3 = f'{NO_DISPONIBLE} <span class="g">desde</span> <b>100.000</b>' if borrada else COND_MONTO
    duenio = K.M_DUENO.replace("[Monto estimado]", "[!Monto estimado]") if borrada else K.M_DUENO
    return [("Se recibe una respuesta", [], [("Mandarle un mensaje a quien la cargó", [], K.M_REC, P24_ORG(mal)),
                                             ("Pedir aprobación a un rol", [], None, ELEGI("Elegí el rol", mal) + SUG_ORG(SUP))]),
            ("Se aprueba una respuesta", [], [("Armar el PDF", ["Comprobante de visita"], None, VER_PDF_ORG), ("Mandarle un mensaje a quien la cargó", ["con el PDF"], K.M_APR, P24_ORG(mal)),
                                              ("Mandar por correo", [], K.M_CORREO, ELEGI("Elegí la dirección", mal) + K.chip5("con el PDF"))]),
            ("Se aprueba una respuesta", [cond3], [("Avisar a un rol", [], duenio, ELEGI("Elegí el rol", mal) + SUG_ORG(GER) + P24_ORG(mal))]),
            ("Se rechaza una respuesta", [], [("Mandarle un mensaje a quien la cargó", [], K.M_RCH, P24_ORG(mal))])]


def sel_org(rot, ph, ayuda="", menu="", dato="", mal=""):
    r = f'<span class="rt">{rot}{info(ayuda) if ayuda else ""}</span>'
    c = f'<div class="ct sel ph{" mal" if mal else ""}"><span class="v">{ph}</span>{CHEV}</div>'
    abajo = f'<span class="err2" role="alert">{mal}</span>' if mal else (f'<span class="dato2">{dato}</span>' if dato else "")
    return f'<div class="w-cmp rg-sel">{r}{c}{menu}{abajo}</div>'


def menu_roles(sug):
    o = "".join(f'<span role="option">{r}{"<small>Sugerido</small>" if r == sug else ""}</span>' for r in ROLES)
    return f'<div class="rg2-menu" role="listbox" aria-label="Rol">{o}</div>'


def p24_org(mal=False):
    return sel_org("Fuera de las 24 horas, con la plantilla", "Elegí la plantilla", K.AY_PLANTILLA, mal="Elegí la plantilla." if mal else "")


def b_historial(on, tip=False):
    """«Historial», primero en la cabecera (140), como en la 21; sin revisiones, apagado y con el motivo en su tooltip."""
    if on:
        return '<button type="button" class="cb cb-sec">Historial</button>'
    return (f'<span class="e-tipw"><button type="button" class="cb cb-sec" disabled>Historial</button>'
            f'<span class="e-tip" role="tooltip"{"" if tip else " hidden"}>{HIST_PLANTILLA}</span></span>')


def caja_reglas_org(filas, guardar="sucio", historial=False, tip=False):
    g = (E.trabaja("Guardando…") if guardar == "guardando" else
         '<button type="button" class="cb cb-pri" disabled>Guardar reglas</button>' if guardar == "limpio" else
         '<button type="button" class="cb cb-pri">Guardar reglas</button>')
    cab = (f'<div class="f-cab"><span class="tt">Cuando llega una respuesta{info(K.AY_REGLAS)}</span><span class="der">{b_historial(historial, tip)}'
           f'<button type="button" class="cb cb-sec">{MAS} Agregar regla</button>{g}</span></div>')
    return f'<div class="w-caja rg2 rg5">{cab}{filas}</div>'


def panel_hist_org():
    """El historial, al costado, como el de la 21: la primera revisión, recién guardada."""
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{F.CERRAR}</button>'
    it = ('<a class="it nueva" href="#"><b>Revisión 1 <span class="w-est">Vigente</span></b><small>03/11/2026 10:20 · Lucía Fernández</small>'
          '<small>4 reglas agregadas</small></a>')
    return f'<aside class="rg5-hist" role="dialog" aria-label="Historial de las reglas"><div class="hh"><b>Historial de las reglas</b>{cerrar}</div><div class="cu">{it}</div></aside>'


def tabs_nuevo(sel):
    items = [("respuestas", "Respuestas", "#"), ("tablero", "Tablero", "#"), ("diseno", "Diseño", "FRM-Editor-Reglas-Plantilla.dc.html"), ("reglas", "Reglas", "FRM-Editor-Reglas-Plantilla.dc.html")]
    a = "".join(f'<a class="{"on" if k == sel else ""}" role="tab" aria-selected="{"true" if k == sel else "false"}" href="{h}">{t}</a>' for k, t, h in items)
    return f'<div class="f-tabs" role="tablist" aria-label="Vistas del formulario">{a}</div>'


def diseno_nuevo():
    """El formulario recién creado: borrador, con el prefijo propuesto y las preguntas de la plantilla."""
    cols = (f'<div class="f-cols"><div class="f-pila">{E.caja_formulario(nombre=FORM, prefijo="VIS2")}{caja_preguntas()}</div>{vista_pl()}</div>')
    return f'<div class="w-body">{tabs_nuevo("diseno")}{cols}</div>'


E_ERP = ["El formulario nuevo", "Las reglas de la plantilla", "Elegir el rol", "Guardar sin elegir", "Una pregunta borrada", "Guardando", "Reglas guardadas", "Historial"]


def leer_reglas(reglas, marcar=()):
    """Cada regla en pasos, con ✎ 🗑 (la de la 21); las que tienen algo por elegir después de tocar «Guardar reglas», marcadas."""
    filas = ""
    for n, (ev, c, a) in enumerate(reglas, 1):
        r = K.regla5(n, ev, c, a)
        filas += r.replace('<div class="rg5-r">', '<div class="rg5-r mal">', 1) if n in marcar else r
    return filas


def editor_reglas_plantilla():
    def cu(filas, guardar="sucio", historial=False, tip=False):
        return f'<div class="w-body">{tabs_nuevo("reglas")}{caja_reglas_org(filas, guardar, historial, tip)}</div>'
    base = reglas_org()
    # «Elegir el rol»: la regla 1 abierta, con la plantilla de WhatsApp y el rol por elegir, y el menú de roles con el sugerido
    msj = K.accion(1, "Mandarle un mensaje a quien la cargó", K.msj5(K.M_REC) + K.adjuntar(False) + p24_org(), primera=True)
    rol = K.accion(2, "Pedir aprobación a un rol", sel_org("Rol", "Elegí el rol", K.AY_ROL, menu_roles(SUP), f"Rol sugerido: {SUP}"), ultima=True)
    abierta1 = K.regla_abierta5(1, "Se recibe una respuesta", msj + rol)
    # «Una pregunta borrada»: «Monto estimado» se borró en Diseño; la condición la marca y el mensaje la muestra «Pregunta no disponible», en rojo (149)
    mal_q = "«Monto estimado» se borró del formulario."
    cond = (K.cond5("Pregunta no disponible", "Es mayor o igual a", "100.000").replace('<div class="ct sel">', '<div class="ct sel mal">', 1)
            + f'<span class="err2" role="alert">{mal_q}</span>' + K.AGREGAR_COND)
    aviso = K.accion(1, "Avisar a un rol", sel_org("Rol", "Elegí el rol", "", "", f"Rol sugerido: {GER}")
                     + K.msj5(K.M_DUENO.replace("[Monto estimado]", "[!Monto estimado]"), error="Quitá el dato que ya no está en el formulario.")
                     + K.adjuntar(False) + p24_org(), primera=True, ultima=True)
    abierta3 = K.regla_abierta5(3, "Se aprueba una respuesta", aviso, si=cond)
    borrada = reglas_org(borrada=True)
    filas_borrada = "".join(abierta3 if n == 3 else K.regla5(n, ev, c, a) for n, (ev, c, a) in enumerate(borrada, 1))
    filas_elegir = "".join(abierta1 if n == 1 else K.regla5(n, ev, c, a) for n, (ev, c, a) in enumerate(base, 1))
    banda_r = E.banda(FORM, E.EST_BOR, E.kebab(False), "FRM-Formularios-22.dc.html")
    guardadas = leer_reglas(reglas_org(elegidas=True))
    V = {"El formulario nuevo": (E.banda(FORM, E.EST_BOR, E.acc("limpio", publicado=False), "FRM-Formularios-22.dc.html"), diseno_nuevo()),
         "Las reglas de la plantilla": (banda_r, cu(leer_reglas(base), tip=True)), "Elegir el rol": (banda_r, cu(filas_elegir)),
         "Guardar sin elegir": (banda_r, cu(leer_reglas(reglas_org(mal=True), (1, 2, 3, 4)))), "Una pregunta borrada": (banda_r, cu(filas_borrada)),
         "Guardando": (banda_r, cu(guardadas, "guardando")), "Reglas guardadas": (banda_r, cu(guardadas, "limpio", True)),
         "Historial": (banda_r, cu(guardadas, "limpio", True))}
    capas = {"El formulario nuevo": toast(f"Creamos «{FORM}» desde la plantilla."), "Reglas guardadas": toast("Reglas guardadas."), "Historial": panel_hist_org()}
    return pagina_org(V, capas, E_ERP, "Las reglas que trae una plantilla · /org/formularios/:id/reglas", K.CSS_RG5 + CSS_PASOS_22 + CSS_ERP)


# ================================================================ Los teléfonos de la organización
CSS_TEL = """.bt-gm { margin: 18px 20px 6px; font-size: 13.5px; font-weight: 600; color: var(--t2); }
.ap-fila .l2.d { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ap-fila .l3.u { color: var(--marca-tx); font-weight: 600; }
.ap-fijo.col { flex-direction: column; align-items: stretch; gap: 6px; }
.ap-fijo.col .cb.full { flex: none; height: 50px; display: flex; align-items: center; justify-content: center; }
.ap-fijo .mot { font-size: 13px; color: var(--t3); text-align: center; }
.ap-fijo .cb.full[disabled] { opacity: 0.55; }
.q-row.ro { padding-right: 14px; }
.rg-t .r.mal { background: var(--peligro-t); }
.rg-t .ab-chip { vertical-align: 1px; }
.t-dato { display: flex; flex-direction: column; gap: 6px; padding: 12px 16px; font-size: 15px; line-height: 1.45; }
.t-dato small { font-size: 13.5px; color: var(--t3); }
.ap-i.neu { color: var(--t3); }
.rg-t .ab-chip { height: 20px; font-size: 12px; }
.rg-t .ab-chip.mal { border-color: oklch(0.82 0.08 25); background: #fff; color: var(--peligro); }
"""


def tel_biblioteca_org():
    est = ["Con plantillas", "Sin resultados", "Sin plantillas", "Cargando", "Error"]
    der = f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button>'
    bar = C.t_bar("Biblioteca", "Gestión de formularios", "M-FRM-Formularios-22.dc.html", der)
    filas = "".join(f'<a class="ap-fila" href="M-FRM-Plantilla.dc.html"><div class="tx"><span class="l1">{n}</span><span class="l2 d">{d}</span><span class="l3">{m}</span>'
                    + (f'<span class="l3 u">La usaste en {u}</span>' if u else "") + "</div></a>" for n, d, m, u in TARJETAS)
    vacio = lambda tx: f'<div class="ap-cuerpo"><div class="ap-vacio">{tx}</div></div>'  # noqa: E731
    cu = {"Con plantillas": bar + '<div class="ap-cuerpo"><div class="bt-gm">Ventas</div>' + filas + "</div>",
          "Sin resultados": bar + vacio('Ninguna plantilla coincide con «inspección».<button type="button" class="cb cb-sec">Limpiar la búsqueda</button>'),
          "Sin plantillas": bar + vacio("Todavía no hay plantillas."),
          "Cargando": bar + '<div class="ap-cuerpo"><div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div></div>',
          "Error": bar + vacio('No pudimos cargar las plantillas.<button type="button" class="cb cb-sec">Reintentar</button>')}
    return C.tel_pagina(cu, est, {}, "Biblioteca de formularios · teléfono", CSS_TEL)


def t_regla_ro(n, cuando, si, acciones, mal=False):
    s = f"<small>Si {si}</small>" if si else ""
    ac = "".join(f"<span>{k}. {a}</span>" for k, a in enumerate(acciones, 1))
    return f'<div class="r{" mal" if mal else ""}"><span class="n">{n}</span><span class="tx"><b>Cuando {cuando}</b>{s}{ac}</span></div>'


def tel_plantilla_org():
    est = ["Con permiso", "Sin permiso de catálogos", "Usar: prefijo tomado", "Usar: se retiró"]
    der = f'<button type="button" class="ap-ib" aria-label="Vista previa">{F.OJO}</button>'
    bar = C.t_bar(FORM, "Ventas · 8 preguntas", "M-FRM-Biblioteca.dc.html", der)
    preg = "".join(f'<div class="q-row ro"><span class="num">{k}</span><span class="tx"><b>{n}</b><span>{d}</span></span></div>' for k, (n, d) in enumerate(PREG, 1))
    cats = ('<div class="q-row ro"><span class="tx"><b>Clientes</b><span>De los contactos de WhatsApp, sin filtros</span></span></div>'
            '<div class="q-row ro"><span class="tx"><b>Motivos de visita</b><span>3 opciones: Seguimiento, Venta nueva y Reclamo</span></span></div>')
    reglas = "".join(t_regla_ro(*r) for r in REGLAS_VISTA)
    cuerpo = (bar + f'<div class="ap-cuerpo"><div class="ap-gtit">La plantilla</div><div class="ap-grupo"><div class="t-dato">{DESC}<small>Para empleados · la usaste en «{FORM}»</small></div></div>'
              f'<div class="ap-gtit">Preguntas</div><div class="ap-grupo">{preg}</div><div class="ap-gtit">Catálogos que trae</div><div class="ap-grupo">{cats}</div>'
              f'<div class="rg-gtit">Reglas de ejemplo</div><div class="rg-t">{reglas}</div><div style="height: 96px; flex-shrink: 0;"></div></div>')
    fijo = '<div class="ap-fijo"><a class="cb cb-pri full" href="#">Usar esta plantilla</a></div>'
    fijo_no = f'<div class="ap-fijo col"><button type="button" class="cb cb-pri full" disabled>Usar esta plantilla</button><span class="mot">{SIN_PERMISO}</span></div>'
    usar = F.thoja(f"Usar «{FORM}»", F.tcampo("Nombre", FORM, req=True) + '<div class="ap-cmp"><span class="rt"><span>Prefijo de numeración <span class="rq">*</span></span>'
                   f'<button type="button" class="ap-i neu" aria-label="Qué significa" title="{AY_PREF_USAR}">{F.TINFO}</button></span><div class="ct">VIS2</div></div>',
                   '<a class="cb cb-pri lleno" href="M-FRM-Reglas-Plantilla.dc.html">Crear el formulario</a><button type="button" class="cb cb-sec">Cancelar</button>')
    retiro = F.thoja(f"Usar «{FORM}»", '<div class="t-banda mal" style="border-radius: 12px;">' + F.ALERTA + '<span class="tx">Esta plantilla ya no está en la biblioteca.</span></div>',
                     '<a class="cb cb-pri lleno" href="M-FRM-Biblioteca.dc.html">Volver a la biblioteca</a>')
    cu = {"Con permiso": cuerpo + fijo, "Sin permiso de catálogos": cuerpo + fijo_no, "Usar: prefijo tomado": cuerpo + fijo, "Usar: se retiró": cuerpo + fijo}
    return C.tel_pagina(cu, est, {"Usar: prefijo tomado": usar, "Usar: se retiró": retiro}, "Plantilla de formulario · teléfono", A.CSS_AB + CSS_TEL + K.CSS_TRG)


def tel_reglas_org():
    est = ["Las reglas de la plantilla", "Elegir el rol", "Guardar sin elegir"]
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Formularios-22.dc.html">{F.TVOLVER}</a><div class="tit"><h1>{FORM}</h1>'
           f'<span class="sub">Borrador</span></div><button type="button" class="ap-ib" aria-label="Acciones de {FORM}">{F.TKEBAB}</button></div>')
    tabs = ('<div class="f-ptabs" role="tablist" aria-label="Vistas del formulario">' + "".join(f'<a class="{"on" if t == "Reglas" else ""}" role="tab" href="#">{t}</a>'
                                                                                              for t in ["Respuestas", "Tablero", "Diseño", "Reglas"]) + "</div>")
    # Cada regla en pasos, como la lista de la 21 en el teléfono (138); «Historial», apagado, con su motivo debajo, como se dice en el teléfono (132 y 140)
    fila = lambda n, r, mal: (f'<div class="r{" mal" if mal else ""}"><span class="n">{n}</span>{K.pasos(*r)}'  # noqa: E731
                              f'<button type="button" class="ap-ib" aria-label="Editar la regla {n}">{A.LAPIZ}</button></div>')
    cab = ('<div class="rg-gtit">Cuando llega una respuesta</div><div class="rg-acc"><span class="off" aria-disabled="true">Historial</span><a href="#">Agregar regla</a></div>'
           f'<p class="rg-mot">{HIST_PLANTILLA}</p>')
    lista = lambda mal: (f'<div class="ap-cuerpo">{cab}<div class="rg-t5">'  # noqa: E731
                         + "".join(fila(n, r, mal) for n, r in enumerate(reglas_org(mal=mal), 1)) + '</div><div style="height: 96px; flex-shrink: 0;"></div></div>')
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Guardar reglas</button></div>'
    edit = (C.t_bar("Regla 1", FORM, "M-FRM-Reglas-Plantilla.dc.html") + '<div class="ap-cuerpo"><div class="rg-hb">' + F.tcampo("Cuándo", "Se recibe una respuesta")
            + '<div class="acc"><b>Acción 2 · Pedir aprobación a un rol</b>' + F.tcampo("Rol", "Elegí el rol", vacio=True, select=True) + f'<span class="ab-sub">Rol sugerido: {SUP}</span></div>'
            + "</div></div>" + '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    roles = F.thoja("Rol", '<div class="ap-acciones2">' + "".join(f'<span role="option">{r}{" · sugerido" if r == SUP else ""}</span>' for r in ROLES) + "</div>", "")
    cu = {"Las reglas de la plantilla": bar + tabs + lista(False) + fijo, "Elegir el rol": edit, "Guardar sin elegir": bar + tabs + lista(True) + fijo}
    css = L.CSS_PTABS + ".f-ptabs { grid-template-columns: repeat(4, 1fr); }\n.f-ptabs a { font-size: 14px; }\n.ap-acciones2 { display: flex; flex-direction: column; }\n" \
        ".ap-acciones2 span { padding: 14px 4px; font-size: 16px; border-top: 1px solid var(--borde); }\n.ap-acciones2 span:first-child { border-top: 0; }\n" \
        ".rg-acc { display: flex; align-items: center; gap: 20px; margin: -2px 16px 0; font-size: 15px; font-weight: 500; }\n" \
        ".rg-acc a { color: var(--marca-tx); text-decoration: none; }\n.rg-acc .off { color: var(--t3); }\n" \
        ".rg-mot { margin: 4px 16px 0; font-size: 13px; color: var(--t3); }\n.rg-t5 .r.mal { background: var(--peligro-t); }\n" \
        ".rg-t5 .ab-chip.mal { border-color: oklch(0.82 0.08 25); background: #fff; color: var(--peligro); }\n"
    return C.tel_pagina(cu, est, {"Elegir el rol": roles}, "Las reglas que trae una plantilla · teléfono",
                        A.CSS_AB + A.CSS_TED + E.CSS_E12 + E.CSS_TED_E12 + W.CSS_TP + K.CSS_TRG + K.CSS_RG5 + K.CSS_TRG5 + CSS_TEL + CSS_PASOS_22 + css)


# ================================================================ canvas.json: Plataforma acá; la fila de la organización, en formularios_etapas_1004.py
PAG_PLAT = "plat-formularios"
LUGAR_PLAT = {  # x, y, w, h, título
    "Plat-FRM-Biblioteca": (0, 260, 1440, 900, "Plataforma · Biblioteca de formularios"), "Plat-FRM-Plantilla-Nueva": (1520, 260, 1440, 900, "Plataforma · nueva plantilla"),
    "Plat-FRM-Categorias": (3040, 260, 1440, 900, "Plataforma · categorías de formularios"),
    "M-Plat-FRM-Biblioteca": (4560, 260, 390, 844, "Plataforma · biblioteca de formularios · teléfono"),
    "Plat-FRM-Plantilla": (0, 1280, 1440, 1960, "Plataforma · plantilla de formulario"), "Plat-FRM-Plantilla-Reglas": (1520, 1280, 1440, 1500, "Plataforma · plantilla · reglas de ejemplo"),
    "Plat-FRM-Pdf": (3040, 1280, 1440, 1500, "Plataforma · plantilla · diseño del PDF"), "Plat-FRM-Publicar": (4560, 1280, 1440, 1100, "Plataforma · publicar una plantilla"),
    "Plat-FRM-Retirar": (6080, 1280, 1440, 1000, "Plataforma · retirar una plantilla"),
}
TITULOS_ORG = {"FRM-Biblioteca": ("Formularios · biblioteca · etapa 22", 1440, 900), "FRM-Plantilla": ("Formularios · una plantilla · etapa 22", 1440, 1960),
               "FRM-Plantilla-Usar": ("Formularios · usar una plantilla · etapa 22", 1440, 1000),
               "FRM-Editor-Reglas-Plantilla": ("Formularios · las reglas que trae una plantilla · etapa 22", 1440, 1600),
               "M-FRM-Biblioteca": ("Formularios · biblioteca · teléfono · etapa 22", 390, 844), "M-FRM-Plantilla": ("Formularios · una plantilla · teléfono · etapa 22", 390, 844),
               "M-FRM-Reglas-Plantilla": ("Formularios · las reglas que trae una plantilla · teléfono · etapa 22", 390, 844)}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (x, y, w, h, titulo) in LUGAR_PLAT.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"is_interactive": True})
        v.update(x=x, y=y, w=w, h=h, title=titulo, page=PAG_PLAT)
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    for n, (titulo, w, h) in TITULOS_ORG.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def enlaces(t):
    """Lo de la organización abre lo de la 21 y la lista de la 22."""
    t = K.enlaces(t)
    return t.replace('"FRM-Formularios-21.dc.html"', '"FRM-Formularios-22.dc.html"').replace('"M-FRM-Formularios-21.dc.html"', '"M-FRM-Formularios-22.dc.html"')


def miga(t, hoja):
    t = re.sub(r"(Inicio / Gestión de formularios / Formularios)(?: / [^<\"]*)?(</span>)", lambda m: f"{m.group(1)} / {hoja}{m.group(2)}", t, count=1)
    return t


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    for n, f in [("Plat-FRM-Biblioteca", plat_biblioteca), ("Plat-FRM-Plantilla-Nueva", plantilla_nueva), ("Plat-FRM-Plantilla", plat_ficha), ("Plat-FRM-Plantilla-Reglas", plat_reglas),
                 ("Plat-FRM-Pdf", plat_pdf), ("Plat-FRM-Publicar", plat_publicar), ("Plat-FRM-Retirar", plat_retirar), ("Plat-FRM-Categorias", plat_categorias),
                 ("M-Plat-FRM-Biblioteca", tel_biblioteca_plat)]:
        (PROJ / f"{n}.dc.html").write_text(E.post(n, f()), encoding="utf-8")
    for n, f, alto, hoja in [("FRM-Biblioteca", biblioteca_org, None, "Biblioteca"), ("FRM-Plantilla", plantilla_org, 1960, f"Biblioteca / {FORM}"),
                             ("FRM-Plantilla-Usar", plantilla_usar, 1000, f"Biblioteca / {FORM}"), ("FRM-Editor-Reglas-Plantilla", editor_reglas_plantilla, 1600, FORM)]:
        t = L.sin_disenar(n, E.post(n, f(), alto))
        t = W.css_y_alto(t, alto)
        (PROJ / f"{n}.dc.html").write_text(enlaces(miga(t, hoja)), encoding="utf-8")
    for n, f in [("M-FRM-Biblioteca", tel_biblioteca_org), ("M-FRM-Plantilla", tel_plantilla_org), ("M-FRM-Reglas-Plantilla", tel_reglas_org)]:
        (PROJ / f"{n}.dc.html").write_text(enlaces(E.post(n, f())), encoding="utf-8")
    if "--sin-canvas" not in sys.argv:
        registrar()
    print("tableros", len(LUGAR_PLAT) + len(TITULOS_ORG))
