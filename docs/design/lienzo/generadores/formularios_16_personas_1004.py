"""La etapa 16, datos de las personas y filtros por destinatario, con su texto para Diseño (docs/plans/formularios/16-texto-diseno.md del back).
Todos los tableros son nuevos y salen de los aprobados: `FRM-Usuario-Datos`, de `Usuario`; `FRM-Catalogo-16`, de los campos de la 13; `FRM-Editor-16`,
`FRM-Publicar-16` y `WA-Chats-Formulario-16`, de la 14, y `FRM-Respuestas-16`, de la 15. `FRM-Datos-Personas` va en Administración.
Muestran solo lo que existe hasta la 16 (78): sin fotos, documentos, aprobación ni «Cargar».
Desde la v150 (125 a 129), con el armado real de ArquitecturaBaseFront: `FRM-Datos-Personas` con «Datos» (Dato, Clave, Tipo, Lo usan y ✎, y «Agregar dato» en su encabezado) y «Personas»
(el resumen «6 personas · 2 sin Zona», «Buscar personas», un dato por columna y ✎); el diálogo con Clave; `FRM-Catalogo-16`, el modal de campos con «Papel»; y en una pregunta,
«Qué opciones ve cada persona» en su caja, con una condición por filtro.

Con el traspaso 10: publicar avisa el máximo por persona solo cuando no entra o da cero (157); el editor tiene «Agregar título» y su título (88) y un
solo «Agregar filtro ▾» (134), con la opción apagada y su motivo; la ficha del usuario dice «Agregar empresa», como las demás altas.

Corre después de `formularios_14_formularios_1004.py`, porque toma `M-WA-Chats-Formulario` y `Usuario` como están.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_12_catalogos_1004 as K  # noqa: E402
import formularios_13_campos_1004 as M13  # noqa: E402
import formularios_15_respuestas_1004 as R  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import menus_y_solo_lectura_1004 as MS  # noqa: E402

PROJ = F.PROJ
X, CHEV, KEBAB, MAS, TILDE = F.X, F.CHEV, A.KEBAB, M13.MAS, A.TILDE
LAPIZ = F.svg('<path d="M4 20h4l10.5-10.5-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>', 16)
trabaja = E.trabaja
FORMULARIO, PREGUNTA, CATALOGO = "Visita a cliente", "Proveedores a consultar", "Proveedores"
MOTIVO_TOPE = "Llegó a 20 datos, el máximo de una organización."
EN_USO = f"Lo usa «{PREGUNTA}», de {FORMULARIO}. Sacá el filtro para darlo de baja."
EN_USO_CAMPO = f"Lo usa un filtro de «{PREGUNTA}», de {FORMULARIO}."
AYUDA_FILTRO = "Un campo de filtro decide qué opciones ve cada persona. En la planilla sale apagado."
AYUDA_QUE_VE = "Cada persona recibe solo las opciones que cumplen todos estos filtros."
SIN_DATO_ZONAS = "Ningún dato de las personas elige de «Zonas»."

# Seis personas, dos sin zona
PERSONAS = [("Juan Gómez", "Técnico", "Centro", "Casa central"), ("Lucía Fernández", "Dueña", "Centro", "Casa central"), ("Martín Paz", "Supervisor", "Sur", "Casa central"),
            ("Paula Méndez", "Supervisora", "Norte", "Planta Norte"), ("Sofía Herrera", "Técnica", "—", "—"), ("Tomás Acosta", "Técnico", "—", "Planta Norte")]
DATOS = [("Zona", "zona", "De un catálogo · Zonas", FORMULARIO, True), ("Sucursal", "sucursal", "Texto", "—", True)]
DATO_BAJA = ("Legajo", "legajo", "Texto", "—", False)
AYUDA_DATOS = "Los datos que tiene cada persona eligen de un catálogo o son un texto. Los valores se cargan en la ficha del usuario."
EN_USO_DATO = "Se usa en estos formularios. Mientras se use, no se puede cambiar su tipo o catálogo ni darlo de baja."
# 130 (v169): la clave de un dato no la usan una plantilla ni una importación, como la de un campo; queda solo lo que importa
AYUDA_CLAVE = "No cambia después de guardar."
# v169: la (i) de «Papel» del modal de campos (solo la usa FRM-Catalogo-16): los dos papeles se guardan con la respuesta
M13.AYUDA_PAPEL = ("Filtro: decide qué opciones ve cada persona, o arma un filtro fijo de una pregunta. Dato: se muestra con la opción elegida. "
                   "Los dos se guardan con la respuesta.")

CSS_DP = """.dp-d { grid-template-columns: minmax(150px, 1fr) 150px minmax(190px, 1.4fr) minmax(150px, 1fr) 72px; gap: 12px; }
.dp-p { grid-template-columns: minmax(200px, 1.6fr) 170px minmax(170px, 1fr) 72px; gap: 12px; }
.w-tr.dp-d .sub { display: block; font-size: 12.5px; color: var(--t3); }
.w-tr.dp-d .mono { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; color: var(--t2); }
.dp-ac { display: inline-flex; justify-content: flex-end; }
.dp-res { font-weight: 500; font-size: 13px; color: var(--t3); }
.dp-fb .w-bus { flex: 1; max-width: none; }
.dp-nota { margin: 0; font-size: 13.5px; color: var(--t3); }
.dp-usos { font-size: 13.5px; color: var(--t2); }
.dp-usos ul { margin: 4px 0 0; padding-left: 18px; }
.dp-chk { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--t1); }
.dp-chk .k-chk { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--borde2); box-sizing: border-box; background: #fff; display: inline-flex; align-items: center; justify-content: center; color: #fff; flex: none; }
.dp-chk .k-chk.on { background: var(--marca); border-color: var(--marca); }
.dp-chk .k-chk.ro { background: var(--t3); border-color: var(--t3); }
.w-tr.dp-d, .w-tr.dp-p { position: relative; min-height: 44px; }
.w-tr.dp-d .f-menu { position: absolute; right: 12px; top: calc(100% - 6px); z-index: 20; min-width: 190px; }
.w-tr:has(.f-menu) { z-index: 8; }
.w-caja:has(.f-menu) { overflow: visible; }
.dp-e { display: inline-flex; align-items: center; gap: 6px; }
.dp-e::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.55 0.13 155); }
.dp-e.baja::before { background: var(--t3); }
.dp-g { color: var(--t3); }
.w-tr.aten { opacity: 0.5; pointer-events: none; }
.dp-linea { height: 2px; background: var(--marca); }
.dp-fb { padding: 12px 16px; display: flex; align-items: center; gap: 8px; }
.dp-form { display: flex; flex-direction: column; gap: 14px; }
.dp-form .w-cmp { position: relative; display: flex; flex-direction: column; gap: 6px; }
.dp-form .rt, .dp-ficha .rt { font-size: 13px; font-weight: 600; color: var(--t2); }
.dp-form .ct, .dp-ficha .ct { min-height: 36px; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 14px; background: #fff; }
.dp-form .k-tab .f-mn { top: 40px; width: 100%; box-sizing: border-box; }
.dp-form .k-in { min-height: 36px; }
.dp-ficha { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px; padding: 16px; }
.dp-ficha .w-cmp { display: flex; flex-direction: column; gap: 6px; }
.dp-ficha .ct.baja small { margin-left: 8px; color: var(--t3); font-size: 12.5px; }
.dp-pie { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--borde); }
.w-caja > .f-cab { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 16px; background: oklch(0.945 0.018 76); font-size: 14px; font-weight: 600; border-radius: 12px 12px 0 0; }
.w-dlg:has(.dp-form), .w-dlg:has(.dp-form) .db { overflow: visible; }
.dp-seg { display: inline-flex; align-self: flex-start; gap: 2px; padding: 3px; border-radius: 10px; background: var(--s2); }
.dp-seg span { padding: 6px 14px; border-radius: 8px; font-size: 13.5px; color: var(--t2); }
.dp-seg span.on { background: #fff; color: var(--t1); font-weight: 600; }
.dp-form .k-in { display: flex; align-items: center; justify-content: space-between; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 8px; font-size: 14px; background: #fff; }
.dp-form .k-in.foco { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }
"""
CSS_FILTROS = """.q-cond { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 34px; gap: 8px 10px; align-items: end; margin: 0; padding: 8px 12px 12px; border: 1px solid var(--borde); border-radius: 8px; min-width: 0; }
.q-cond legend { padding: 0 4px; font-size: 12.5px; color: var(--t3); }
.q-cond .ct { background: #fff; }
.q-cond.ro .ct { background: var(--s2); color: var(--t3); }
.q-cond .ib { width: 34px; height: 36px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; }
.q-res { display: flex; flex-direction: column; gap: 3px; font-size: 13.5px; }
.q-res b { font-weight: 600; color: var(--t1); }
.q-res b.mal { color: var(--peligro); }
.q-res small { font-size: 12.5px; color: var(--t3); }
.q-max { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: var(--marca-tx); }
.q-max.mal { color: var(--peligro); }
.q-max svg { width: 15px; height: 15px; flex: none; margin-top: 1px; }
.q-sin { font-size: 13px; color: var(--t2); }
.q-sin a { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.q-zona .zc .e-tipw .e-tip { top: calc(100% + 8px); right: 0; }
.q-zona .zc { flex-wrap: wrap; padding: 6px 12px; }
.q-zona .zc > span:first-child { white-space: nowrap; }
.q-zona .zc .der2 { flex-wrap: wrap; }
.q-zona:has(.e-tip) { overflow: visible; }
"""
CSS_AVISOS = """.z-f.av .ic { color: oklch(0.55 0.11 75); }
"""


def miga(t, texto):
    return t.replace("Inicio / Formularios / ", texto, 1) if "Inicio / Formularios / " in t else t


# ================================================================ FRM-Datos-Personas: en Administración
ESTADOS_DP = ["Los datos", "Agregar un dato", "Un dato de texto", "Elegir el catálogo", "Guardando", "Editar un dato", "Cambiar el tipo con valores", "Un dato en uso", "Un dato dado de baja",
              "20 datos", "Buscar personas", "Ninguna persona coincide", "Sin ver usuarios", "Sin editar los valores", "Vuelve a leer", "Cargando", "Todavía no hay datos", "No se pudo cargar"]


def pagina_admin(nombre, bnd, cuerpo, estados, css=""):
    """Sobre el marco de las pantallas de Administración, con «Datos de las personas» en «Gestión de usuarios»."""
    t = A.pagina_ab(nombre, "Inicio / Administración / Gestión de usuarios / Datos de las personas", bnd, cuerpo,
                    css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + E.CSS_E12 + CSS_DP + css, estados=("estado", estados), js=A.js_estados(estados))
    u = (PROJ / "Usuario.dc.html").read_text(encoding="utf-8")
    sb = re.search(r'<aside class="w-sb".*?</aside>', u, re.S).group(0)
    panel = re.search(r'<aside class="w-panel".*?</aside>', u, re.S).group(0)
    panel = panel.replace('<a class="w-ln on" href="Usuarios.dc.html">', '<a class="w-ln" href="Usuarios.dc.html">')
    panel = panel.replace('Roles y permisos</a></div>', 'Roles y permisos</a><a class="w-ln on" href="FRM-Datos-Personas.dc.html">Datos de las personas</a></div>')
    t = re.sub(r'<aside class="w-sb".*?</aside>', lambda _m: sb, t, count=1, flags=re.S)
    return re.sub(r'<aside class="w-panel".*?</aside>', lambda _m: panel, t, count=1, flags=re.S)


def fila_dato(d):
    """Como ArquitecturaBase: un dato por celda, ✎ a la vista, y si está dado de baja lo dice debajo del nombre."""
    n, clave, tipo, usa, activo = d
    baja = "" if activo else '<span class="sub">Dado de baja</span>'
    usa_h = f'<span class="dp-g">{usa}</span>' if usa == "—" else f'<a href="FRM-Editor-16.dc.html" class="dp-l">{usa}</a>'
    return (f'<div class="w-tr dp-d"><span>{n}{baja}</span><span class="mono">{clave}</span><span>{tipo}</span><span>{usa_h}</span>'
            f'<span class="dp-ac"><button type="button" class="ib" aria-label="Editar {n}">{LAPIZ}</button></span></div>')


def fila_persona(p, editar=True, aten=False):
    n, _rol, zona, suc = p
    v = lambda x: f'<span class="dp-g">{x}</span>' if x == "—" else f"<span>{x}</span>"
    lapiz = f'<a class="ib" href="FRM-Usuario-Datos.dc.html" aria-label="Editar a {n}">{LAPIZ}</a>' if editar else ""
    return f'<div class="w-tr dp-p{" aten" if aten else ""}"><span>{n}</span>{v(zona)}{v(suc)}<span class="dp-ac">{lapiz}</span></div>'


def caja_datos(filas, tope=False, aten=False, vacio=False):
    agregar = f'<button type="button" class="cb cb-sec">{MAS} Agregar dato</button>'
    if tope:
        agregar = K.tip(agregar, MOTIVO_TOPE, abierto=True)
    th = '<div class="w-th dp-d"><span>Dato</span><span>Clave</span><span>Tipo</span><span>Lo usan</span><span class="dp-ac">Acciones</span></div>'
    linea = '<div class="dp-linea" aria-hidden="true"></div>' if aten else ""
    cuerpo = '<div class="f-cuerpo"><b>Todavía no hay datos.</b></div>' if vacio else f"{th}{linea}{filas}"
    return f'<div class="w-caja"><div class="f-cab"><span>Datos{F.info(AYUDA_DATOS)}</span><span class="der">{agregar}</span></div>{cuerpo}</div>'


def caja_personas(editar=True, aten=False, personas=PERSONAS, busqueda=""):
    """El resumen cuenta todas y dice a cuántas les falta un dato que usa un filtro. Una columna por dato activo."""
    acc = '<span class="dp-ac">Acciones</span>' if editar else "<span></span>"
    th = f'<div class="w-th dp-p"><span>Persona</span><span>Zona</span><span>Sucursal</span>{acc}</div>'
    bus = f'<span class="w-bus{" lleno" if busqueda else ""}">{F.BUSCAR} {busqueda or "Buscar personas"}</span>'
    if personas:
        cuerpo = th + "".join(fila_persona(q, editar, aten) for q in personas) + f'<div class="w-pie"><span>1–{len(personas)} de {len(personas)}</span><span>10 por página · Página 1 de 1</span></div>'
    else:
        cuerpo = '<div class="f-cuerpo"><b>No hay personas para mostrar.</b></div>'
    res = f'{len(personas)} personas · 2 sin Zona' if personas is PERSONAS else f"{len(personas)} personas"
    return f'<div class="w-caja"><div class="f-cab"><span>Personas</span><span class="dp-res">{res}</span></div><div class="dp-fb">{bus}</div>{cuerpo}</div>'


def dlg_dato(tipo="De un catálogo", combo="", nombre="", clave="", guardando=False, editar=False, en_uso=False, confirmar=0):
    """«Agregar dato» o «Editar dato», como ArquitecturaBase: Nombre, Clave, Tipo y, si elige de un catálogo, Catálogo. Una clave guardada no cambia. Editando va «Dato activo»."""
    nom = f'<div class="ct">{nombre}</div>' if nombre else '<div class="ct" style="color: var(--t3);">Nombre del dato</div>'
    llave = (f'<div class="ct" style="background: var(--s2); color: var(--t3);">{clave}</div>' if editar else
             f'<div class="ct">{clave}</div>' if clave else '<div class="ct" style="color: var(--t3);">clave</div>')
    gris = ' style="background: var(--s2); color: var(--t3);"' if en_uso else ""
    catalogo = ""
    if tipo == "De un catálogo":
        control = f'<div class="ct"{gris}>Zonas · 6 opciones</div>' if en_uso else f'<span class="k-tab">{M13.combo_catalogo("Zonas · 6 opciones", combo)}</span>'
        catalogo = f'<div class="w-cmp"><span class="rt">Catálogo <span class="req">*</span></span>{control}</div>'
    extra = ""
    if confirmar:
        extra += f'<span class="dp-chk"><span class="k-chk" role="checkbox" aria-checked="false"></span>Sí, cambiar el dato y borrar los valores de {confirmar} personas</span>'
    if editar:
        ro = " ro" if en_uso else ""
        extra += f'<span class="dp-chk"><span class="k-chk on{ro}" role="checkbox" aria-checked="true"{" aria-disabled=" + chr(34) + "true" + chr(34) if en_uso else ""}>{TILDE}</span>Dato activo</span>'
    if en_uso:
        extra += f'<div class="dp-usos">{EN_USO_DATO}<ul><li>{FORMULARIO}</li></ul></div>'
    cuerpo = (f'<div class="dp-form"><div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span>{nom}</div>'
              f'<div class="w-cmp"><span class="rt">Clave <span class="req">*</span>{F.info(AYUDA_CLAVE)}</span>{llave}</div>'
              f'<div class="w-cmp"><span class="rt">Tipo <span class="req">*</span></span><div class="ct sel"{gris}>{tipo}{"" if en_uso else CHEV}</div></div>{catalogo}{extra}</div>')
    boton = trabaja("Guardando…") if guardando else '<button type="button" class="cb cb-pri">Guardar</button>'
    return F.dialogo("Editar dato" if editar else "Agregar dato", cuerpo, f'<button type="button" class="cb cb-sec">Cancelar</button>{boton}')


def datos_personas():
    bnd = f'<div class="w-bnd"><div class="iz"><span class="ic">{F.ICONO}</span><div><h1>Datos de las personas</h1></div></div><div class="ac"></div></div>'
    filas = "".join(fila_dato(d) for d in DATOS)
    cuerpo = lambda *q: '<div class="w-body">' + "".join(q) + "</div>"
    normal = cuerpo(caja_datos(filas), caja_personas())
    error = '<div class="w-caja"><div class="f-cuerpo"><b>No pudimos cargar los datos.</b><button type="button" class="cb cb-sec">Reintentar</button></div></div>'
    nota = '<p class="dp-nota">Para ver las personas necesitás «Ver usuarios».</p>'
    V = {
        "Los datos": normal, "Agregar un dato": normal, "Un dato de texto": normal, "Elegir el catálogo": normal, "Guardando": normal, "Editar un dato": normal, "Cambiar el tipo con valores": normal, "Un dato en uso": normal,
        "Un dato dado de baja": cuerpo(caja_datos(filas + fila_dato(DATO_BAJA)), caja_personas()), "20 datos": cuerpo(caja_datos(filas, tope=True), caja_personas()),
        "Buscar personas": cuerpo(caja_datos(filas), caja_personas(personas=[PERSONAS[1]], busqueda="lucía")), "Ninguna persona coincide": cuerpo(caja_datos(filas), caja_personas(personas=[], busqueda="zzz")),
        "Sin ver usuarios": cuerpo(caja_datos(filas), nota), "Sin editar los valores": cuerpo(caja_datos(filas), caja_personas(editar=False)),
        "Vuelve a leer": cuerpo(caja_datos(filas.replace('class="w-tr dp-d"', 'class="w-tr dp-d aten"'), aten=True), caja_personas(aten=True)),
        "Cargando": cuerpo(f'<div class="w-caja">{R.P.ESQ}</div>'), "Todavía no hay datos": cuerpo(caja_datos("", vacio=True), caja_personas()), "No se pudo cargar": cuerpo(error),
    }
    assert list(V) == ESTADOS_DP
    capas = {"Agregar un dato": dlg_dato(), "Un dato de texto": dlg_dato("Texto", nombre="Sucursal", clave="sucursal"), "Elegir el catálogo": dlg_dato(combo="abierto", nombre="Zona", clave="zona"),
             "Guardando": dlg_dato(nombre="Zona", clave="zona", guardando=True), "Editar un dato": dlg_dato("Texto", nombre="Sucursal", clave="sucursal", editar=True),
             "Cambiar el tipo con valores": dlg_dato("Texto", nombre="Zona", clave="zona", editar=True, confirmar=4), "Un dato en uso": dlg_dato(nombre="Zona", clave="zona", editar=True, en_uso=True)}
    t = pagina_admin("Datos de las personas · /org/datos-de-las-personas", bnd, A.con_estados([(e, V[e]) for e in ESTADOS_DP]), ESTADOS_DP)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_DP.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, K.CSS_OPCIONES)


ESTADOS_TDP = ["Datos", "Personas", "Agregar un dato", "Cargando", "No se pudo cargar"]


def tel_datos_personas():
    barra = C.t_bar("Datos de las personas", "Administración", "M-WA-Menu.dc.html", f'<button type="button" class="ap-ib" aria-label="Agregar dato">{F.svg(chr(60) + "path d=" + chr(34) + "M12 5v14M5 12h14" + chr(34) + "/>", 22)}</button>')
    tabs = lambda on: ('<div class="ap-tabs" role="tablist">' + "".join(f'<span class="{"on" if k == on else ""}" role="tab">{k}</span>' for k in ("Datos", "Personas")) + "</div>")
    filas_d = "".join(f'<div class="ap-fila"><div class="tx"><span class="l1">{n}</span><span class="l2">{tipo}</span><span class="l3">{clave}</span></div>'
                      f'<button type="button" class="ap-ib" aria-label="Editar {n}">{F.svg(chr(60) + "path d=" + chr(34) + "M4 20h4L19 9l-4-4L4 16z" + chr(34) + "/>", 20)}</button></div>' for n, clave, tipo, _u, _a in DATOS)
    # 138 (v169): los valores sin rótulos, en el orden de las columnas de la compu (Zona y Sucursal); «—» si no tiene
    filas_p = "".join(f'<a class="ap-fila" href="M-FRM-Usuario-Datos.dc.html"><div class="tx"><span class="l1">{n}</span><span class="l2">{z} · {s}</span></div></a>'
                      for n, _r, z, s in PERSONAS)
    bus = f'<div style="padding: 12px 0 4px;"><span class="w-bus" style="width: auto;">{F.BUSCAR} Buscar personas</span></div>'
    esq = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div>'
    cuerpo = {"Datos": barra + tabs("Datos") + f'<div class="ap-cuerpo">{filas_d}</div>', "Personas": barra + tabs("Personas") + f'<div class="ap-cuerpo">{bus}{filas_p}</div>',
              "Agregar un dato": barra + tabs("Datos") + f'<div class="ap-cuerpo">{filas_d}</div>', "Cargando": barra + tabs("Datos") + esq,
              "No se pudo cargar": barra + '<div class="ap-cuerpo"><div class="ap-vacio">No pudimos cargar los datos.<button type="button" class="cb cb-sec">Reintentar</button></div></div>'}
    hoja = F.thoja("Agregar dato", F.tcampo("Nombre", "Nombre del dato", req=True, vacio=True) + F.tcampo("Clave", "clave", req=True, vacio=True) + F.tcampo("Tipo", "De un catálogo", req=True, select=True)
                   + F.tcampo("Catálogo", "Zonas · 6 opciones", req=True, select=True), '<button type="button" class="cb cb-pri">Guardar</button><button type="button" class="cb cb-sec">Cancelar</button>')
    return C.tel_pagina(cuerpo, ESTADOS_TDP, {"Agregar un dato": hoja}, "Datos de las personas · teléfono", F.CSS_TFILTRO)


# ================================================================ FRM-Usuario-Datos: la ficha con las pestañas «Acceso» y «Datos»
ESTADOS_UD = ["Acceso", "Datos", "Datos: con cambios", "Datos: guardando", "Datos: no se guardó", "Datos: una opción dada de baja"]


AGREGAR_EMPRESA = [("Sumar empresa", "Agregar empresa"), ("? 'Sumar' : 'Guardar'", "? 'Agregar' : 'Guardar'"), ("'Sumamos a '", "'Agregamos a '")]


def usuario_datos():
    t = (PROJ / "Usuario.dc.html").read_text(encoding="utf-8")
    # Las altas dicen «Agregar …», como en ArquitecturaBase (§3.2 del traspaso 10): el botón, el diálogo, su botón y el aviso
    for a, b in AGREGAR_EMPRESA:
        t = t.replace(a, b)
    # El Tweak de la pestaña, al lado de los de la ficha
    props = json.loads(re.search(r"data-props='([^']*)'", t).group(1))
    nuevos = {"estado": {"editor": "enum", "options": ESTADOS_UD, "default": "Datos", "section": "Estado"}, **props}
    t = re.sub(r"data-props='[^']*'", lambda _m: "data-props='" + json.dumps(nuevos, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    i = t.index('<div class="w-body">') + len('<div class="w-body">')
    j = t.rindex("</div>", 0, t.index("</div>\n</x-dc>"))
    # Hasta dónde llega el cuerpo: cuento los <div> para no comerme el cierre del marco
    prof, k = 1, i
    for m in re.finditer(r"<div\b|</div>", t[i:]):
        prof += 1 if m.group(0) != "</div>" else -1
        if prof == 0:
            k = i + m.start()
            break
    acceso = t[i:k]
    pest = lambda sel: ('<div class="f-tabs" role="tablist" aria-label="Vistas del usuario">' + "".join(
        f'<a class="{"on" if x == sel else ""}" role="tab" aria-selected="{"true" if x == sel else "false"}" href="#">{x}</a>' for x in ("Acceso", "Datos")) + "</div>")

    def campo(rot, valor, baja=False, sel=False):
        extra = '<small>De baja</small>' if baja else ""
        return f'<div class="w-cmp"><span class="rt">{rot}</span><div class="ct{" baja" if baja else ""}"><span>{valor}{extra}</span>{CHEV if sel else ""}</div></div>'

    def ficha(zona="Centro", suc="Casa central", baja=False, boton=None, descartar=False):
        desc = f'<button type="button" class="cb cb-sec"{"" if descartar else " disabled"}>Descartar cambios</button>'
        return (f'<div class="w-caja"><div class="f-cab"><span>Datos</span></div><div class="dp-ficha">{campo("Zona", zona, baja, True)}{campo("Sucursal", suc)}</div>'
                f'<div class="dp-pie">{desc}{boton or chr(60) + "button type=" + chr(34) + "button" + chr(34) + " class=" + chr(34) + "cb cb-pri" + chr(34) + " disabled>Guardar cambios</button>"}</div></div>')
    guardar = '<button type="button" class="cb cb-pri">Guardar cambios</button>'
    datos = {"Datos": ficha(), "Datos: con cambios": ficha(zona="Norte", boton=guardar, descartar=True), "Datos: guardando": ficha(zona="Norte", boton=trabaja("Guardando…"), descartar=True),
             "Datos: no se guardó": ficha(zona="Norte", boton=guardar, descartar=True) + A.toast("No pudimos guardar los datos. Lo escrito se conserva.", "mal"),
             "Datos: una opción dada de baja": ficha(zona="Cuyo", baja=True)}
    cuerpo = f'<sc-if value="{{{{tabAcceso}}}}" hint-placeholder-val="{{{{no}}}}">{pest("Acceso")}{acceso}</sc-if>'
    cuerpo += "".join(f'<sc-if value="{{{{d{n}}}}}" hint-placeholder-val="{{{{{"si" if n == 0 else "no"}}}}}">{pest("Datos")}<style>.w-bnd .ac .cb {{ display: none; }}</style>{h}</sc-if>' for n, h in enumerate(datos.values()))
    t = t[:i] + cuerpo + t[k:]
    flags = ("      tabAcceso: (this.props.estado ?? 'Datos') === 'Acceso',\n"
             + "".join(f"      d{n}: (this.props.estado ?? 'Datos') === {json.dumps(e, ensure_ascii=False)},\n" for n, e in enumerate(datos)))
    assert t.count("    return {\n      ...this.comunes(),") >= 1
    t = t.replace("    return {\n      ...this.comunes(),", "    return {\n" + flags + "      ...this.comunes(),")
    t = t.replace("</helmet>", f'<style data-e16="datos">\n{L.CSS_PESTANAS}{CSS_DP}{E.CSS_E12}</style>\n</helmet>', 1)
    return re.sub(r"<title>[^<]*</title>", "<title>Ficha del usuario · /org/usuarios/:id · etapa 16</title>", t)


ESTADOS_TUD = ["Datos", "Con cambios", "Guardando", "Una opción dada de baja", "Acceso"]
CHEV_T = F.svg('<path d="m9 6 6 6-6 6"/>', 18, "2")


def t_acceso():
    """La pestaña «Acceso», como la de M-Usuario: el estado, los roles y sus empresas, con «Agregar empresa» (las altas dicen «Agregar …»).
    Los datos son los de Tomás en `Usuario`: sin roles en la organización y «Solo lectura» en Delta S.A."""
    it = lambda b, s, der: f'<div class="ap-it"><span class="tx"><b>{b}</b><span>{s}</span></span>{der}</div>'  # noqa: E731
    chev = f'<span class="chev">{CHEV_T}</span>'
    kebab = f'<button type="button" class="ap-ib" aria-label="Acciones de Delta S.A.">{F.TKEBAB}</button>'
    return ('<div class="ap-cuerpo ap-gris"><span class="ap-gtit">Acceso a la organización</span><div class="ap-grupo">'
            + it("Estado", '<span class="w-est">Activo</span>', chev) + it("Roles de la organización", "Ninguno", chev) + "</div>"
            + '<span class="ap-gtit">Empresas<a href="M-Usuario-Empresa.dc.html">Agregar empresa</a></span><div class="ap-grupo">'
            + it("Delta S.A.", "Solo lectura", kebab) + "</div></div>")


def tel_usuario_datos():
    barra = C.t_bar("Tomás Acosta", "Activo", "M-FRM-Datos-Personas.dc.html")
    tabs = '<div class="ap-tabs" role="tablist"><a role="tab" href="M-Usuario.dc.html">Acceso</a><span class="on" role="tab">Datos</span></div>'
    campos = lambda z: '<div class="ap-cuerpo"><div class="f-campos">' + F.tcampo("Zona", z, select=True) + F.tcampo("Sucursal", "Planta Norte") + "</div></div>"
    fijo = lambda b, on=True: f'<div class="ap-fijo"><button type="button" class="cb cb-sec full"{"" if on else " disabled"}>Descartar</button>{b}</div>'
    guardar = '<button type="button" class="cb cb-pri full">Guardar cambios</button>'
    cuerpo = {"Datos": barra + tabs + campos("Centro") + fijo('<button type="button" class="cb cb-pri full" disabled>Guardar cambios</button>', False),
              "Con cambios": barra + tabs + campos("Norte") + fijo(guardar), "Guardando": barra + tabs + campos("Norte") + fijo(trabaja("Guardando…").replace('class="cb cb-pri', 'class="cb cb-pri full')),
              "Una opción dada de baja": barra + tabs + campos("Cuyo · De baja") + fijo('<button type="button" class="cb cb-pri full" disabled>Guardar cambios</button>', False),
              "Acceso": barra + '<div class="ap-tabs" role="tablist"><span class="on" role="tab">Acceso</span><a role="tab" href="#">Datos</a></div>' + t_acceso()
              + fijo('<button type="button" class="cb cb-pri full" disabled>Guardar cambios</button>', False)}
    return C.tel_pagina(cuerpo, ESTADOS_TUD, {}, "Ficha del usuario · teléfono · etapa 16", E.CSS_E12)


# ================================================================ FRM-Catalogo-16: el modal de campos de la 13, con «Papel»
ESTADOS_C16 = ["Un campo de filtro", "Un campo de dato", "Un campo en uso", "Solo lectura"]
PAPELES = {"CUIT": "Dato", "Zona": "Filtro"}


def catalogo_16():
    c1, z = M13.CAMPOS
    lista = lambda sel=2, lectura=False: M13.lista_campos(sel, lectura=lectura, papeles=PAPELES)
    capas = {
        "Un campo de filtro": M13.dlg_campos(lista(), M13.panel_campo("Campo 2 de 2", *z, papel="Filtro"), "2 de 20"),
        "Un campo de dato": M13.dlg_campos(lista(1), M13.panel_campo("Campo 1 de 2", *c1, papel="Dato"), "2 de 20"),
        "Un campo en uso": M13.dlg_campos(lista(), M13.panel_campo("Campo 2 de 2", *z, papel="Dato", err_papel=EN_USO_CAMPO), "2 de 20"),
        "Solo lectura": M13.dlg_campos(lista(lectura=True), M13.panel_lectura("Campo 2 de 2", *z, papel="Filtro"), "", lectura=True),
    }
    assert list(capas) == ESTADOS_C16
    b, c = M13.fondo_catalogo()
    js = A.js_estados(ESTADOS_C16, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Los campos de un catálogo · etapa 16", "Inicio / Formularios / Catálogos / Proveedores", b, c,
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + M13.CSS, ESTADOS_C16, js, alto=1200)
    t = t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_C16.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA + K.CSS_OPCIONES + M13.CSS_CAMPOS)


def tel_catalogo_16():
    return M13.tel_campos(papeles=PAPELES, destino="M-FRM-Catalogo-16.dc.html")


# ================================================================ FRM-Editor-16: «Qué opciones ve cada persona»
ESTADOS_E16 = ["Zonas plegadas", "Qué opciones ve cada persona", "Agregar filtro", "Con un filtro fijo", "Le falta el dato", "El filtro no funciona", "Más opciones que el tope",
               "Solo lectura", "Sin campos de filtro", "Una opción apagada"]
CSS_MENU_FILTRO = """.q-zona.con-menu { overflow: visible; }
.q-zona .e-kw .f-menu { top: calc(100% + 6px); right: 0; min-width: 220px; font-weight: 400; }
.q-zona .zc .e-tipw .e-tip { z-index: 31; }
"""
# 145: plegada, la banda dice los filtros en orden; abierta, los dos «Agregar» vuelven a la banda. Una zona con un error o un aviso se abre sola.
RESUMEN_FILTROS = "Zona según quien lo recibe"
RESUMEN_WA16 = "Como en el catálogo · Texto · CUIT · Zona"
CSS_FILTROS_T5 = """.q-dg { display: grid; grid-template-columns: 160px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 8px; overflow: hidden; font-size: 13px; }
.q-dg > .k { background: oklch(0.975 0.008 78); color: var(--t2); padding: 7px 12px; }
.q-dg > .v { padding: 7px 12px; }
.q-dg .g { color: var(--t3); }
"""


def seccion_filtros(modo="normal"):
    """«Qué opciones ve cada persona», como ArquitecturaBase: una zona plegada con sus filtros en la banda (modo «plegada»); abierta, los dos
    «Agregar» en la banda y una condición por filtro. Debajo, a quién se prueba, lo que tiene en dos columnas (138), cuántas opciones le
    quedan y el máximo."""
    if modo == "plegada":
        return E.zona_plegada("Qué opciones ve cada persona", RESUMEN_FILTROS, AYUDA_QUE_VE, "fil")
    ro = modo == "lectura"
    sin = modo == "sin"

    def cond(leyenda, rot, valor, rot2, valor2):
        x = "" if ro else f'<button type="button" class="ib" aria-label="Quitar el filtro">{X}</button>'
        ct = lambda v: f'<div class="ct sel">{v}{CHEV if not ro else ""}</div>'
        return (f'<fieldset class="q-cond{" ro" if ro else ""}"><legend>{leyenda}</legend><div class="w-cmp"><span class="rt">{rot}</span>{ct(valor)}</div>'
                f'<div class="w-cmp"><span class="rt">{rot2}</span>{ct(valor2)}</div>{x if not ro else "<span></span>"}</fieldset>')
    conds = "" if sin else cond("Según quien lo recibe", "Campo", "Zona", "Dato de la persona", "Zona")
    if modo == "fijo":
        conds += cond("Filtro fijo", "Campo", "Rubro", "Valor fijo", "Frío")
    persona = {"falta": "Sofía Herrera", "roto": "Juan Gómez · Centro", "tope": "Juan Gómez · Centro"}.get(modo, "Juan Gómez · Centro")
    res = {"falta": ("mal", "La persona no tiene el dato necesario; no se le puede mandar el formulario."), "roto": ("mal", "El filtro no está disponible; no se puede preparar el formulario."),
           "tope": ("mal", "Supera el límite de 200 opciones de esta pregunta.")}.get(modo, ("", "14 opciones"))
    detalle = f'<div class="q-dg"><span class="k">Zona</span><span class="v">{"<span class=" + chr(34) + "g" + chr(34) + ">—</span>" if modo == "falta" else "Centro"}</span></div>'
    maximo = (f'<span class="q-max mal">{F.ALERTA}Como mucho 240 por persona (Centro, la más grande): no entra en el desplegable (200).</span>' if modo == "tope" else
              f'<span class="q-max">{TILDE}Como mucho 18 por persona (Centro, la más grande): entra en el desplegable (200).</span>')
    cargar = "" if ro else ' · <a href="FRM-Datos-Personas.dc.html">Cargar los datos</a>'
    # 134 (la spec 16): un solo «Agregar filtro ▾», con «Según quien lo recibe» y «Filtro fijo»; sin campos de filtro, apagado con su motivo
    menu = modo in ("menu", "opcion_off")
    boton = (f'<button type="button" class="cb cb-sec" aria-haspopup="menu" aria-expanded="{"true" if menu else "false"}">{MAS} Agregar filtro {CHEV}</button>')
    if sin:
        agregar = K.tip(boton, "Este catálogo no tiene campos de filtro.", abierto=True)
    elif menu:
        segun = (f'<span class="f-mi off" role="menuitem" aria-disabled="true">Según quien lo recibe<span class="e-tip" role="tooltip">{SIN_DATO_ZONAS}</span></span>'
                 if modo == "opcion_off" else '<a class="f-mi" role="menuitem" href="#">Según quien lo recibe</a>')
        agregar = f'<span class="e-kw">{boton}<div class="f-menu" role="menu" aria-label="Agregar filtro">{segun}<a class="f-mi" role="menuitem" href="#">Filtro fijo</a></div></span>'
    else:
        agregar = boton
    botones = "" if ro else agregar
    if modo == "opcion_off":  # todavía sin filtros: ningún dato de las personas elige de «Zonas»
        return '<div class="w-cmp ancho q-zona fil con-menu">' + E.zona_cab("Qué opciones ve cada persona", AYUDA_QUE_VE, botones, abierta=True) + "</div>"
    prueba = "" if sin else (f'<div class="w-cmp"><span class="rt">Como si lo recibiera</span><div class="ct sel">{persona}{CHEV}</div></div>'
                             f'<div class="q-res"><b class="{res[0]}">{res[1]}</b></div>{detalle}{maximo}<div class="q-sin">2 personas sin Zona{cargar}</div>')
    cuerpo = f'<div class="zb">{conds}{prueba}</div>' if conds or prueba else ""
    return (f'<div class="w-cmp ancho q-zona fil{" con-menu" if menu or sin else ""}">' + E.zona_cab("Qué opciones ve cada persona", AYUDA_QUE_VE, botones, abierta=True)
            + cuerpo + "</div>")


def editor_16():
    A_preg = A.pregunta_catalogo

    def pregunta(modo="elegido", filtros=None):
        h = A_preg(modo).replace("Motivos de visita", CATALOGO).replace(E.RESUMEN_WA["elegido"], RESUMEN_WA16)
        h = h.replace('<div class="ct">Motivo</div>', f'<div class="ct">{PREGUNTA}</div>').replace(">Motivo<", f">{PREGUNTA}<").replace(' Motivo"', f' {PREGUNTA}"')
        if filtros:  # antes de «En WhatsApp», como allá
            wa = '<div class="w-cmp ancho q-zona pleg wa">'
            k = h.index(wa) if wa in h else h.index('<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe')
            h = h[:k] + seccion_filtros(filtros) + h[k:]
        return h

    def cuerpo(filtros):
        A.pregunta_catalogo = lambda modo="elegido": pregunta(modo, filtros)
        try:
            return E.cuerpo_editor(modo="fijo", catalogo="elegido").replace("Motivo (opcional)", f"{PREGUNTA} (opcional)")
        finally:
            A.pregunta_catalogo = A_preg
    pub = lambda c, modo="cambios": (E.banda(FORMULARIO, E.EST_PUB, E.acc(modo), E.VOL), c)
    V = {"Zonas plegadas": pub(cuerpo("plegada")), "Qué opciones ve cada persona": pub(cuerpo("normal")), "Agregar filtro": pub(cuerpo("menu")),
         "Con un filtro fijo": pub(cuerpo("fijo")), "Le falta el dato": pub(cuerpo("falta")), "El filtro no funciona": pub(cuerpo("roto")),
         "Más opciones que el tope": pub(cuerpo("tope")), "Solo lectura": pub(cuerpo("lectura"), "solo"), "Sin campos de filtro": pub(cuerpo("sin")),
         "Una opción apagada": pub(cuerpo("opcion_off"))}
    # El tablero mide 1660: la app también, para que la pregunta abierta entre entera
    return A.pagina_editor(V, {}, ESTADOS_E16, "Editor del formulario · etapa 16", E.CSS_E12 + E.CSS_CA4 + E.css_titulos() + CSS_FILTROS + CSS_FILTROS_T5
                           + CSS_MENU_FILTRO + ".w-app { height: 1660px !important; }\n")


ESTADOS_TE16 = ["Zonas plegadas", "Qué opciones ve cada persona", "Agregar filtro", "Le falta el dato", "Solo lectura", "Las preguntas"]
# 134: «Agregar filtro» abre una hoja con los dos tipos, como el ▾ de la compu
HOJA_FILTRO = ('<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Agregar filtro"><span class="asa"></span>'
               '<div class="hc" style="padding-right: 20px;"><h2>Agregar filtro</h2></div><div class="hb" style="padding-bottom: 34px;">'
               '<div class="ap-acciones"><span role="menuitem">Según quien lo recibe</span><span role="menuitem">Filtro fijo</span></div></div></div>')
CSS_TE16 = """.t16 { display: flex; flex-direction: column; gap: 12px; padding: 12px 16px 24px; }
.t16 .ap-grupo { margin: 0; }
.t16 .q-res { font-size: 15px; }
.t16 .q-res b { font-weight: 600; }
.t16 .q-res b.mal { color: var(--peligro); }
.t16 .t-lin2 { font-size: 14px; color: var(--t2); }
"""


def tel_editor_16():
    barra = C.t_bar(PREGUNTA, "Pregunta", "M-FRM-Editor.dc.html")

    def fila(c, v, ro=False):
        x = F.svg(chr(60) + "path d=" + chr(34) + "M6 6l12 12M18 6 6 18" + chr(34) + "/>", 20)
        return f'<div class="q-row"><span class="tx"><b>{c}</b><span>{v}</span></span><button type="button" class="ap-ib" aria-label="Quitar el filtro"{" hidden" if ro else ""}>{x}</button></div>'

    def pant(abierta=True, persona="Juan Gómez · Centro", res="14 opciones", ro=False, falta=False):
        """Las dos zonas de la pregunta, como en la compu (145): plegadas, cada una con lo configurado debajo de su título."""
        wa = E.t_zona_plegada("En WhatsApp", RESUMEN_WA16)
        if not abierta:
            return barra + f'<div class="t16">{E.t_zona_plegada("Qué opciones ve cada persona", RESUMEN_FILTROS, AYUDA_QUE_VE)}{wa}</div>'
        agregar = "" if ro else '<a href="#">Agregar filtro</a>'
        dato = '<span class="g">—</span>' if falta else "Centro"
        cuerpo = (f'<div class="ap-grupo">{fila("Zona", "Según quien lo recibe · Zona", ro)}</div>' + F.tcampo("Como si lo recibiera", persona, select=True)
                  + f'<div class="q-res"><b{" class=" + chr(34) + "mal" + chr(34) if falta else ""}>{res}</b></div>'
                  + f'<div class="q-dg"><span class="k">Zona</span><span class="v">{dato}</span></div>'
                  + '<span class="t-lin2">Como mucho 18 por persona</span><span class="t-lin2">2 personas sin Zona</span>')
        zona = '<div class="t-zona fil">' + E.t_zona_cab("Qué opciones ve cada persona", AYUDA_QUE_VE, agregar, abierta=True) + f'<div class="tzb">{cuerpo}</div></div>'
        return barra + f'<div class="t16">{zona}{wa}</div>'
    def preguntas():
        """El formulario, bajado hasta sus preguntas: la de catálogo es «Proveedores a consultar», y el título de sección va entre las preguntas (88)."""
        viejas = E.T_PREG
        E.T_PREG = [(PREGUNTA, "De un catálogo · Proveedores · Opcional") if n == "Motivo" else (n, d) for n, d in viejas]
        try:
            lista = E.t_cuerpo(desde_preguntas=True)
        finally:
            E.T_PREG = viejas
        return C.t_bar(FORMULARIO, "Publicado · versión 3", "M-FRM-Formularios.dc.html") + lista + E.t_fijo("limpio")
    cuerpo = {"Zonas plegadas": pant(False), "Qué opciones ve cada persona": pant(), "Agregar filtro": pant(),
              "Le falta el dato": pant(persona="Sofía Herrera", res="La persona no tiene el dato necesario", falta=True), "Solo lectura": pant(ro=True),
              "Las preguntas": preguntas()}
    t = C.tel_pagina(cuerpo, ESTADOS_TE16, {"Agregar filtro": HOJA_FILTRO}, "Pregunta · teléfono · etapa 16",
                     E.CSS_E12 + E.CSS_TZONA + CSS_FILTROS_T5 + CSS_TE16 + E.CSS_TED_E12 + E.CSS_TTITULOS)
    return MS.css(t, MS.CSS_HOJA, "hoja")


# ================================================================ FRM-Publicar-16: la zona «Avisos», entre «Problemas» y «Qué se publica» (112)
ESTADOS_P16 = ["Solo avisos", "Problemas y avisos", "Para los dos: un cliente", "El máximo no entra", "Nadie ve ninguna opción"]


AYUDA_AVISOS = "No frenan la publicación, pero conviene revisarlos."


def z_aviso(que, detalle, ayuda=""):
    return f'<div class="z-f av"><span class="ic">{F.INFO}</span><span class="tx"><b>{que}</b><span>{detalle}{F.info(ayuda) if ayuda else ""}</span></span></div>'


def cuerpo_16(**k):
    """v169: el editor de atrás es el de la 16, con «Proveedores a consultar» de 5.ª pregunta, que es la de los avisos (como FRM-Editor-16)."""
    viejas = A.PREGUNTAS
    A.PREGUNTAS = [(PREGUNTA, f"Elegir de un catálogo · {CATALOGO}", ob, en) if n == "Motivo" else (n, tipo, ob, en) for n, tipo, ob, en in viejas]
    try:
        return E.cuerpo_editor(**k).replace("Motivo (opcional)", f"{PREGUNTA} (opcional)")
    finally:
        A.PREGUNTAS = viejas


def publicar_16():
    cuerpo = cuerpo_16(abierta=None, modo="fijo")
    base = (E.banda(FORMULARIO, E.EST_PUB, E.acc("limpio"), E.VOL), cuerpo)
    # «Para los dos: un cliente»: el formulario es para empleados y clientes, y el aviso dice por qué no le llega a un cliente
    assert cuerpo.count(E.para_quien()) == 1
    para_los_dos = (base[0], cuerpo.replace(E.para_quien(), E.para_quien(valor="Empleados y clientes")))
    # 157 (NI3-B): el máximo por persona se avisa solo cuando no entra en WhatsApp (200 en una elección) o da cero; si entra, no dice nada
    sin_zona = z_aviso(PREGUNTA, "2 personas sin Zona. No se les va a poder mandar hasta que tengan el dato.")
    no_entra = z_aviso(PREGUNTA, "Como mucho 240 opciones por persona (Centro), de un límite de 200.", "Es lo que puede llegar a recibir la persona con más opciones.")
    cero = z_aviso(PREGUNTA, "Con estos filtros nadie ve ninguna opción.")
    cliente = z_aviso(PREGUNTA, "No se le va a poder mandar a un cliente: depende de un dato de la persona.")
    avisos = lambda filas: E.z_zona("Avisos", filas, AYUDA_AVISOS)  # noqa: E731
    problema = E.z_zona("Problemas", E.z_problema(PREGUNTA, "El filtro «Rubro es Frío» deja 240 opciones, y WhatsApp muestra hasta 200."), E.AYUDA_PROBLEMAS)
    tit = "Publicar la versión 4 en WhatsApp"
    dlg = A.dlg_publicar
    # «Qué se publica», con las preguntas de este editor: la que cambió es «Proveedores a consultar», que acá ocupa el lugar de «Motivo»
    cambiadas = E.z_dato("Cambiadas", "Motivo y Fallas")
    que = E.que_se_publica()
    assert que.count(cambiadas) == 1
    que = que.replace(cambiadas, E.z_dato("Cambiadas", f"{PREGUNTA} y Fallas"))
    capas = {"Solo avisos": dlg(tit, avisos(sin_zona) + que, E.pie_pub()),
             "Problemas y avisos": dlg(tit, problema + avisos(sin_zona) + que, E.pie_pub(activo=False)),
             "Para los dos: un cliente": dlg(tit, avisos(sin_zona + cliente) + que, E.pie_pub()),
             "El máximo no entra": dlg(tit, avisos(no_entra + sin_zona) + que, E.pie_pub()),
             "Nadie ve ninguna opción": dlg(tit, avisos(cero) + que, E.pie_pub())}
    V = {e: para_los_dos if e == "Para los dos: un cliente" else base for e in ESTADOS_P16}
    return A.pagina_editor(V, capas, ESTADOS_P16, "Publicar en WhatsApp · etapa 16", E.CSS_E12 + E.css_titulos() + E.CSS_ZONAS + CSS_AVISOS)


# ================================================================ WA-Chats-Formulario-16: lo que no se puede mandar, con el motivo
MOTIVOS = {"Le falta el dato": (f"{PREGUNTA}: a Tomás le falta «Zona». Cargala en Datos de las personas.", "Más de 200 opciones"),
           "El filtro no funciona": (f"{PREGUNTA}: el filtro dejó de funcionar. Avisale a quien administra los formularios.", "Ninguna opción"),
           "A un cliente": (f"{FORMULARIO} no se le puede mandar a un cliente: una pregunta depende de un dato de la persona.", "Catálogo que no se puede usar")}


def chat_16(nombre, destino):
    """Sale del tablero de la 14: sus estados de una pregunta que no se puede mandar pasan a ser los de la 16, con su motivo."""
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    opciones = L.opciones_de(t)
    for nuevo, (texto, viejo) in MOTIVOS.items():
        if viejo not in opciones:
            viejo = "Una opción que no entra" if viejo == "Catálogo que no se puede usar" else viejo
        k = opciones.index(viejo)
        bloque = re.search(rf'<sc-if value="\{{\{{s{k}\}}\}}"[^>]*>(?:(?!<sc-if value="\{{\{{s\d+\}}\}}").)*', t, re.S) or None
        t = t.replace(f'"{viejo}"', f'"{nuevo}"')
        for frase in re.findall(r'[^<>]*(?:supera las 200 opciones que admite WhatsApp[^<]*|no tiene opciones y la pregunta es obligatoria\.|el catálogo no se puede usar\.[^<]*|una opción es más larga[^<]*)', t):
            if {"Más de 200 opciones": "supera", "Ninguna opción": "no tiene opciones", "Catálogo que no se puede usar": "no se puede usar", "Una opción que no entra": "más larga"}[viejo] in frase:
                t = t.replace(frase, texto)
        opciones = L.opciones_de(t)
    quedan = ["Le falta el dato", "El filtro no funciona", "A un cliente"]
    quitar = [e for e in opciones if e not in quedan]
    t = L.sin_estados(t, quitar, "Le falta el dato")
    t = en_clientes(t, movil=nombre.startswith("M-"))
    return re.sub(r"<title>[^<]*</title>", f"<title>{destino}</title>", t)


# v169: «A un cliente» pasa en la bandeja Clientes, con Martina López (la clienta de WA-Chats-Formulario-Cliente), y no en Internos con Tomás,
# que es empleado. Lo que cambia del fondo va en dos bloques: el de Internos en los otros estados y el de Clientes solo en este.
CLIENTE = "A un cliente"
VP_CLIENTE = "Vos: ¡Qué bueno, Martina! Te mando el formulario para confirmar la entrega."


def bloque_sc(t, inicio):
    """Dónde empieza y termina el <sc-if> que arranca con `inicio`, con lo que tenga adentro."""
    i = t.index(inicio)
    nivel = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        nivel += 1 if m.group(0) == "<sc-if" else -1
        if nivel == 0:
            return i, i + m.end()
    raise ValueError(inicio)


def segun_cliente(t, a, b):
    assert t.count(a) == 1, (t.count(a), a[:90])
    return t.replace(a, f'<sc-if value="{{{{noCli}}}}" hint-placeholder-val="{{{{si}}}}">{a}</sc-if>'
                        f'<sc-if value="{{{{cli}}}}" hint-placeholder-val="{{{{no}}}}">{b}</sc-if>')


def en_clientes(t, movil=False):
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    s = lista.index(CLIENTE)
    # La lógica: dos banderas más, y la vista previa de Martina en la lista de chats
    si_no = "      si: true, no: false,\n"
    assert t.count(si_no) == 1
    t = t.replace(si_no, si_no + f"      cli: e === {json.dumps(CLIENTE)}, noCli: e !== {json.dumps(CLIENTE)},\n")
    if not movil:
        vp = f'"{CLIENTE}": "Vos: Genial, Tomás. Te mando el formulario de la visita."'
        assert t.count(vp) == 1
        t = t.replace(vp, f'"{CLIENTE}": {json.dumps(VP_CLIENTE, ensure_ascii=False)}')
        # La bandeja, la lista de chats (Martina y los otros cuatro de Clientes, como en WA-Chats) y el encabezado del chat
        seg = '<span role="radio" aria-checked="false">Clientes <span class="c">5</span></span><span class="on" role="radio" aria-checked="true">Internos <span class="c">2</span></span>'
        t = segun_cliente(t, seg, '<span class="on" role="radio" aria-checked="true">Clientes <span class="c">5</span></span><span role="radio" aria-checked="false">Internos <span class="c">2</span></span>')
        i = t.index('<div class="w-conv on">')
        j = t.index('</div><div class="w-hilo">', i)
        convs = t[i:j]
        k = convs.index('<div class="w-conv ', 1)
        martina = (convs[:k].replace('<span class="w-av">TA</span>', '<span class="w-av">ML</span>').replace("<b>Tomás Acosta</b>", "<b>Martina López</b>")
                   .replace("Carga de pedidos · Lucía Fernández", "Ventas · Lucía Fernández"))
        t = segun_cliente(t, convs, martina + E.otros_clientes())
        i = t.index('<div class="hc">', t.index('<div class="w-hilo">'))
        j = t.index('<div class="w-msjs">', i)
        hc = t[i:j]
        t = segun_cliente(t, hc, hc.replace('<span class="w-av">TA</span>', '<span class="w-av">ML</span>').replace("<b>Tomás Acosta</b>", "<b>Martina López</b>")
                          .replace("011 15-5555-4521 · Empleado · Delta S.A.", "011 15-5555-6203 · Vinculada a su cuenta · Mayorista")
                          .replace("Acciones de Tomás Acosta", "Acciones de Martina López"))
        t = segun_cliente(t, E.CLIENTE_ANTES, E.CLIENTE_DESPUES)
        inicio = f'<sc-if value="{{{{s{s}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="w-oscuro">'
    else:
        i = t.index('<span class="w-av">TA</span>', t.index('<div class="ap-cbar">'))
        j = t.index("</button>", i) + len("</button>")
        cab = t[i:j]
        t = segun_cliente(t, cab, cab.replace('<span class="w-av">TA</span>', '<span class="w-av">ML</span>').replace("<b>Tomás Acosta</b>", "<b>Martina López</b>")
                          .replace("<span>Empleado · Delta S.A.</span>", "<span>Vinculada a su cuenta · Mayorista</span>").replace("Acciones de Tomás Acosta", "Acciones de Martina López"))
        tel = lambda h: h.replace("w-m", "ap-m").replace("o-sis", "ap-sis")  # noqa: E731
        t = segun_cliente(t, tel(E.CLIENTE_ANTES), tel(E.CLIENTE_DESPUES))
        inicio = f'<sc-if value="{{{{s{s}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="ap-velo"></div><div class="ap-hoja"'
    # El diálogo del estado: a Martina, con los formularios para clientes; «Visita a cliente», que desde la 16 es para los dos, elegido y con su motivo
    i, j = bloque_sc(t, inicio)
    d = t[i:j]
    ops = re.search(r'<div class="c-ops" role="radiogroup" aria-label="Formulario">(?:<div class="c-op[^"]*"[^>]*>.*?</div>)*</div>', d, re.S).group(0)
    version = re.search(r"<b>Visita a cliente</b><small>([^<]*)</small>", ops).group(1)
    d = (d.replace(ops, A.cards([("Entrega de pedido", "Versión 1 · 5 preguntas"), ("Visita a cliente", version)], 1))
         .replace("Enviar un formulario a Tomás Acosta", "Enviar un formulario a Martina López").replace('<span class="h-sub">A Tomás Acosta</span>', '<span class="h-sub">A Martina López</span>'))
    assert "Tomás" not in d, d[:200]
    return t[:i] + d + t[j:]


# ================================================================ FRM-Respuestas-16: los campos de papel «Filtro» salen apagados
ESTADOS_R16 = ["Columnas", "Prendida"]
COL_ZONA = ("zona", "Proveedor · Zona", 150, "")
ZONAS_R = {"REP-000018": "Centro", "REP-000017": "Norte", "REP-000016": "Sur", "REP-000015": "—", "REP-000014": "—"}


def tabla_zona():
    cols = R.COLS_R[:9] + [COL_ZONA] + R.COLS_R[9:]
    filas = ""
    for r in R.RESP_R:
        celdas = [(R.celda_r(k, r) if k != "zona" else f"<span>{R.valor(ZONAS_R[r[0]])}</span>") for k, *_ in cols]
        filas += '<div class="w-tr pl">' + "".join(celdas) + "</div>"
    pie = '<div class="w-pie"><span>1–10 de 18</span><span>10 por página · Página 1 de 2</span></div>'
    return f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(cols)};"><div class="pl-scroll">{R.cabecera(cols)}{filas}</div>{pie}</div>'


def respuestas_16():
    apagada = R.casilla("Proveedor · Zona", False)
    prendida = R.casilla("Proveedor · Zona", True)
    plazo = R.casilla("Proveedor · Plazo de pago")
    barra = R.barra5("repuesto-columnas")  # 144: el buscador, «Empresa» y un solo «Filtros»; las líneas entre columnas van con CSS_T5 (137)
    cuerpos = {"Columnas": barra.replace(plazo, plazo + apagada) + R.tabla_r(), "Prendida": barra.replace(plazo, plazo + prendida) + tabla_zona()}
    bnd = R.banda(R.REPUESTO, "Respuestas · versión 2 publicada", R.EXPORTAR)
    estados = ["Elegir varias: " + e for e in ESTADOS_R16]  # el prefijo pone sus migas
    t = R.pagina("Respuestas · etapa 16", A.con_estados([(e, bnd) for e in estados]), A.con_estados([(e, R.CUERPO.format(cuerpos[e.split(": ")[1]])) for e in estados]), estados,
                 css=R.CSS_T5)
    return t.replace("Elegir varias: Columnas", "Columnas").replace("Elegir varias: Prendida", "Prendida")


def tel_respuestas_16():
    """La planilla del teléfono, como la de la 15: sin «Columnas» en «Más acciones», porque el teléfono no tiene columnas (v169, `responsive.md`),
    y con el nombre entero (174), que ya trae M-FRM-Respuestas."""
    t = (PROJ / "M-FRM-Respuestas.dc.html").read_text(encoding="utf-8")
    assert '<span role="menuitem">Columnas</span>' not in t
    return re.sub(r"<title>[^<]*</title>", "<title>Respuestas · teléfono · etapa 16</title>", t)


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Datos-Personas": ("Administración · Datos de las personas · etapa 16", 1440, 1000), "M-FRM-Datos-Personas": ("Datos de las personas · teléfono", 390, 844),
           "FRM-Usuario-Datos": ("Administración · la ficha, con «Datos» · etapa 16", 1440, 900), "M-FRM-Usuario-Datos": ("La ficha, con «Datos» · teléfono", 390, 844),
           "FRM-Catalogo-16": ("Formularios · el papel «Filtro» · etapa 16", 1280, 1560), "M-FRM-Catalogo-16": ("El papel «Filtro» · teléfono", 390, 844),
           "FRM-Editor-16": ("Formularios · qué opciones ve cada persona · etapa 16", 1440, 1660), "M-FRM-Editor-16": ("Qué opciones ve cada persona · teléfono", 390, 844),
           "FRM-Publicar-16": ("Formularios · publicar con avisos · etapa 16", 1440, 1400),
           "WA-Chats-Formulario-16": ("WhatsApp · un formulario que no se puede mandar · etapa 16", 1440, 900), "M-WA-Chats-Formulario-16": ("Un formulario que no se puede mandar · teléfono", 390, 844),
           "FRM-Respuestas-16": ("Formularios · la subcolumna de un filtro · etapa 16", 1440, 900), "M-FRM-Respuestas-16": ("Respuestas · teléfono · etapa 16", 390, 844)}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (titulo, w, h) in TITULOS.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    E.CON_TITULOS = True  # 88: los títulos de sección existen desde la 14 (traspaso 10)
    con_marco = {"FRM-Catalogo-16": (catalogo_16, 1200), "FRM-Editor-16": (editor_16, 1660), "FRM-Publicar-16": (publicar_16, 1400), "FRM-Respuestas-16": (respuestas_16, None)}
    for n, (f, alto) in con_marco.items():
        t = L.sin_disenar(n, E.post(n, f(), alto))
        # 176: «Ver vista oficial» abre su diálogo (FRM-Vista-Oficial)
        t = t.replace('href="FRM-Publicando.dc.html">Ver vista oficial', 'href="FRM-Vista-Oficial.dc.html">Ver vista oficial')
        if n == "FRM-Respuestas-16":
            t = L.con_pestanas(t, "respuestas")
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    sueltos = {"FRM-Datos-Personas": datos_personas, "M-FRM-Datos-Personas": tel_datos_personas, "FRM-Usuario-Datos": usuario_datos, "M-FRM-Usuario-Datos": tel_usuario_datos,
               "M-FRM-Catalogo-16": tel_catalogo_16, "M-FRM-Editor-16": tel_editor_16, "M-FRM-Respuestas-16": tel_respuestas_16}
    for n, f in sueltos.items():
        (PROJ / f"{n}.dc.html").write_text(f(), encoding="utf-8")
    (PROJ / "WA-Chats-Formulario-16.dc.html").write_text(chat_16("WA-Chats-Formulario", "WhatsApp · Internos · etapa 16"), encoding="utf-8")
    (PROJ / "M-WA-Chats-Formulario-16.dc.html").write_text(chat_16("M-WA-Chats-Formulario", "WhatsApp · teléfono · etapa 16"), encoding="utf-8")
    if "--sin-canvas" not in sys.argv:  # para correrlo sobre el lienzo sin tocar canvas.json
        registrar()
    print("tableros", list(TITULOS))
