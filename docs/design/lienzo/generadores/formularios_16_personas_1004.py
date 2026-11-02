"""La etapa 16, datos de las personas y filtros por destinatario, con su texto para Diseño (docs/plans/formularios/16-texto-diseno.md del back).
Todos los tableros son nuevos y salen de los aprobados: `FRM-Usuario-Datos`, de `Usuario`; `FRM-Catalogo-16`, de los campos de la 13; `FRM-Editor-16`,
`FRM-Publicar-16` y `WA-Chats-Formulario-16`, de la 14, y `FRM-Respuestas-16`, de la 15. `FRM-Datos-Personas` va en Administración.
Muestran solo lo que existe hasta la 16 (78): sin fotos, documentos, aprobación ni «Cargar».

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

# Seis personas, dos sin zona
PERSONAS = [("Juan Gómez", "Técnico", "Centro", "Casa central"), ("Lucía Fernández", "Dueña", "Centro", "Casa central"), ("Martín Paz", "Supervisor", "Sur", "Casa central"),
            ("Paula Méndez", "Supervisora", "Norte", "Planta Norte"), ("Sofía Herrera", "Técnica", "—", "—"), ("Tomás Acosta", "Técnico", "—", "Planta Norte")]
DATOS = [("Sucursal", "Texto", "—", "5 de 6", True), ("Zona", "De un catálogo: Zonas", FORMULARIO, "4 de 6", True)]
DATO_BAJA = ("Legajo", "Texto", "—", "0 de 6", False)

CSS_DP = """.dp-d { grid-template-columns: minmax(150px, 1fr) minmax(190px, 1.3fr) minmax(150px, 1fr) 110px 100px 36px; gap: 12px; }
.dp-p { grid-template-columns: minmax(170px, 1.3fr) minmax(130px, 1fr) 150px minmax(150px, 1fr) 36px; gap: 12px; }
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
.dp-fb { padding: 12px 16px; border-bottom: 1px solid var(--borde); display: flex; align-items: center; gap: 8px; }
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
CSS_FILTROS = """.q-fil { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1px solid var(--borde); border-radius: 10px; background: oklch(0.985 0.005 78); }
.q-fil .c { font-size: 13.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
.q-fil .f { display: grid; grid-template-columns: 170px 24px minmax(0, 1fr) 32px; gap: 8px; align-items: center; font-size: 13.5px; }
.q-fil .f .ct { background: #fff; }
.q-fil .f.ro .ct { background: var(--s2); color: var(--t3); }
.q-fil .acs { display: flex; flex-wrap: wrap; gap: 4px 16px; }
.q-fil .como { display: grid; grid-template-columns: 170px minmax(0, 220px) auto; gap: 10px; align-items: center; font-size: 13.5px; }
.q-fil .como .rt { font-size: 13px; font-weight: 600; color: var(--t2); }
.q-fil .como .res { color: var(--marca-tx); font-weight: 600; }
.q-fil .como .res.mal { color: var(--peligro); }
.q-fil .dat { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; color: var(--t2); }
.q-fil .dat a { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
"""
CSS_AVISOS = """.z-f.av .ic { color: oklch(0.55 0.11 75); }
"""


def miga(t, texto):
    return t.replace("Inicio / Formularios / ", texto, 1) if "Inicio / Formularios / " in t else t


# ================================================================ FRM-Datos-Personas: en Administración
ESTADOS_DP = ["Los datos", "Filtro de estado", "Nuevo dato", "De un catálogo", "Elegir el catálogo", "Guardando", "Cambiar el tipo con valores", "Acciones de un dato", "Un dato en uso", "Dados de baja",
              "20 datos", "Sin ver usuarios", "Sin editar los valores", "Vuelve a leer", "Cargando", "Todavía no hay datos", "No se pudo cargar"]


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


def fila_dato(d, menu=False, en_uso=False):
    n, tipo, usa, cant, activo = d
    est = '<span class="dp-e">Activo</span>' if activo else '<span class="dp-e baja">De baja</span>'
    usa_h = f'<span class="dp-g">{usa}</span>' if usa == "—" else f'<a href="FRM-Editor-16.dc.html" class="dp-l">{usa}</a>'
    m = ""
    if menu:
        if activo and en_uso:
            baja = (f'<span class="f-mi off" role="menuitem" aria-disabled="true" title="{EN_USO}">{F.QUITAR} Dar de baja<span class="e-tip" role="tooltip">{EN_USO}</span></span>')
        elif activo:
            baja = f'<span class="f-mi pel" role="menuitem">{F.QUITAR} Dar de baja</span>'
        else:
            baja = '<span class="f-mi" role="menuitem">Reactivar</span>'
        m = f'<div class="f-menu" role="menu" aria-label="Acciones de {n}"><span class="f-mi" role="menuitem">Editar</span><span class="f-sep" role="separator"></span>{baja}</div>'
    return (f'<div class="w-tr dp-d"><span>{n}</span><span>{tipo}</span><span>{usa_h}</span><span>{cant}</span><span>{est}</span>'
            f'<span><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button>{m}</span></div>')


def fila_persona(p, editar=True, aten=False):
    n, rol, zona, suc = p
    v = lambda x: f'<span class="dp-g">{x}</span>' if x == "—" else f"<span>{x}</span>"
    lapiz = f'<a class="ib" href="FRM-Usuario-Datos.dc.html" aria-label="Editar los datos de {n}">{LAPIZ}</a>' if editar else ""
    return f'<div class="w-tr dp-p{" aten" if aten else ""}"><span>{n}</span><span>{rol}</span>{v(zona)}{v(suc)}<span>{lapiz}</span></div>'


def caja_datos(filas, estado="", aten=False):
    menu = ""
    if estado == "menu":
        menu = '<span class="f-mn" role="listbox" aria-label="Estado"><span role="option" class="on">Activos<span class="cnt">2</span></span><span role="option">Dados de baja<span class="cnt">1</span></span></span>'
    pil = f'<span class="f-env"><span class="w-pil{" con" if estado == "baja" else ""}" role="button" aria-haspopup="listbox">{"Estado: Dados de baja" if estado == "baja" else "Estado"} {CHEV}</span>{menu}</span>'
    th = '<div class="w-th dp-d"><span>Nombre</span><span>Tipo</span><span>Lo usa</span><span>Tienen valor</span><span>Estado</span><span><span class="sr">Acciones</span></span></div>'
    linea = '<div class="dp-linea" aria-hidden="true"></div>' if aten else ""
    return f'<div class="w-caja"><div class="f-cab"><span>Los datos</span></div><div class="dp-fb">{pil}</div>{th}{linea}{filas}</div>'


def caja_personas(editar=True, aten=False):
    th = '<div class="w-th dp-p"><span>Nombre</span><span>Roles</span><span>Zona</span><span>Sucursal</span><span><span class="sr">Acciones</span></span></div>'
    pie = '<div class="w-pie"><span>1–6 de 6</span><span>10 por página · Página 1 de 1</span></div>'
    return f'<div class="w-caja"><div class="f-cab"><span>Las personas</span></div>{th}' + "".join(fila_persona(p, editar, aten) for p in PERSONAS) + pie + "</div>"


def dlg_dato(tipo="Texto", combo="", nombre="", guardando=False):
    seg = ('<span class="dp-seg" role="radiogroup" aria-label="Tipo">' + "".join(f'<span role="radio" class="{"on" if x == tipo else ""}">{x}</span>' for x in ("Texto", "De un catálogo")) + "</span>")
    nom = f'<div class="ct">{nombre}</div>' if nombre else '<div class="ct" style="color: var(--t3);">Nombre del dato</div>'
    catalogo = ""
    if tipo == "De un catálogo":
        catalogo = f'<div class="w-cmp"><span class="rt">Catálogo <span class="req">*</span></span><span class="k-tab">{M13.combo_catalogo("Zonas · 6 opciones", combo)}</span></div>'
    cuerpo = (f'<div class="dp-form"><div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span>{nom}</div>'
              f'<div class="w-cmp"><span class="rt">Tipo</span>{seg}</div>{catalogo}</div>')
    boton = trabaja("Guardando…") if guardando else '<button type="button" class="cb cb-pri">Guardar</button>'
    return F.dialogo("Nuevo dato", cuerpo, f'<button type="button" class="cb cb-sec">Cancelar</button>{boton}')


def datos_personas():
    nuevo = f'<button type="button" class="cb cb-pri">{MAS} Nuevo dato</button>'
    nuevo_off = K.tip(f'<button type="button" class="cb cb-pri" disabled>{MAS} Nuevo dato</button>', MOTIVO_TOPE)

    def bnd(ac=nuevo, res="2 datos · 6 personas"):
        return f'<div class="w-bnd"><div class="iz"><span class="ic">{F.ICONO}</span><div><h1>Datos de las personas</h1><p class="res">{res}</p></div></div><div class="ac">{ac}</div></div>'
    filas = "".join(fila_dato(d) for d in DATOS)
    con_menu = fila_dato(DATOS[0]) + fila_dato(DATOS[1], menu=True, en_uso=True)
    cuerpo = lambda *p: '<div class="w-body">' + "".join(p) + "</div>"
    normal = cuerpo(caja_datos(filas), caja_personas())
    vacio = '<div class="w-caja"><div class="f-cuerpo"><b>Todavía no hay datos.</b></div></div>'
    error = '<div class="w-caja"><div class="f-cuerpo"><b>No pudimos cargar los datos.</b><button type="button" class="cb cb-sec">Reintentar</button></div></div>'
    V = {
        "Los datos": normal, "Filtro de estado": cuerpo(caja_datos(filas, "menu"), caja_personas()), "Nuevo dato": normal, "De un catálogo": normal, "Elegir el catálogo": normal, "Guardando": normal,
        "Cambiar el tipo con valores": normal, "Acciones de un dato": cuerpo(caja_datos(fila_dato(DATOS[0], menu=True) + fila_dato(DATOS[1])), caja_personas()),
        "Un dato en uso": cuerpo(caja_datos(con_menu), caja_personas()), "Dados de baja": cuerpo(caja_datos(fila_dato(DATO_BAJA, menu=True), "baja"), caja_personas()),
        "20 datos": normal, "Sin ver usuarios": cuerpo(caja_datos(filas)), "Sin editar los valores": cuerpo(caja_datos(filas), caja_personas(editar=False)),
        "Vuelve a leer": cuerpo(caja_datos(filas.replace('class="w-tr dp-d"', 'class="w-tr dp-d aten"'), aten=True), caja_personas(aten=True)),
        "Cargando": cuerpo(f'<div class="w-caja">{R.P.ESQ}</div>'), "Todavía no hay datos": cuerpo(vacio), "No se pudo cargar": cuerpo(error),
    }
    bandas = {e: bnd() for e in ESTADOS_DP}
    bandas["20 datos"] = bnd(nuevo_off, "20 datos · 6 personas")
    bandas["Sin editar los valores"] = bnd(nuevo)
    bandas["Dados de baja"] = bnd(res="1 dado de baja · 6 personas")
    bandas["Cargando"] = bnd(res="")
    bandas["No se pudo cargar"] = bnd(res="")
    bandas["Todavía no hay datos"] = bnd(res="Sin datos")
    capas = {"Nuevo dato": dlg_dato(), "De un catálogo": dlg_dato("De un catálogo", nombre="Zona"), "Elegir el catálogo": dlg_dato("De un catálogo", "abierto", "Zona"),
             "Guardando": dlg_dato("De un catálogo", nombre="Zona", guardando=True),
             "Cambiar el tipo con valores": A.confirmar("¿Cambiar el tipo de «Zona»?", "Se borran los valores de 4 personas.", "Cambiar el tipo", peligro=False)}
    t = pagina_admin("Datos de las personas · /org/datos-de-las-personas", A.con_estados([(e, bandas[e]) for e in ESTADOS_DP]), A.con_estados([(e, V[e]) for e in ESTADOS_DP]), ESTADOS_DP)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_DP.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, K.CSS_OPCIONES)


ESTADOS_TDP = ["Los datos", "Las personas", "Nuevo dato", "Cargando", "No se pudo cargar"]


def tel_datos_personas():
    barra = C.t_bar("Datos de las personas", "Administración", "M-WA-Menu.dc.html", f'<button type="button" class="ap-ib" aria-label="Nuevo dato">{F.svg(chr(60) + "path d=" + chr(34) + "M12 5v14M5 12h14" + chr(34) + "/>", 22)}</button>')
    tabs = lambda on: ('<div class="ap-tabs" role="tablist">' + "".join(f'<span class="{"on" if k == on else ""}" role="tab">{k}</span>' for k in ("Los datos", "Las personas")) + "</div>")
    filas_d = "".join(f'<div class="ap-fila"><div class="tx"><span class="l1">{n}</span><span class="l2">{t}</span><span class="l3">{c} · Activo</span></div>'
                      f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>' for n, t, _u, c, _a in DATOS)
    filas_p = "".join(f'<a class="ap-fila" href="M-FRM-Usuario-Datos.dc.html"><div class="tx"><span class="l1">{n}</span><span class="l2">{r}</span><span class="l3">Zona: {z} · Sucursal: {s}</span></div></a>'
                      for n, r, z, s in PERSONAS)
    esq = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div>'
    cuerpo = {"Los datos": barra + tabs("Los datos") + f'<div class="ap-cuerpo">{filas_d}</div>', "Las personas": barra + tabs("Las personas") + f'<div class="ap-cuerpo">{filas_p}</div>',
              "Nuevo dato": barra + tabs("Los datos") + f'<div class="ap-cuerpo">{filas_d}</div>', "Cargando": barra + tabs("Los datos") + esq,
              "No se pudo cargar": barra + '<div class="ap-cuerpo"><div class="ap-vacio">No pudimos cargar los datos.<button type="button" class="cb cb-sec">Reintentar</button></div></div>'}
    hoja = F.thoja("Nuevo dato", F.tcampo("Nombre", "Nombre del dato", req=True, vacio=True) + F.tcampo("Tipo", "De un catálogo", select=True) + F.tcampo("Catálogo", "Zonas · 6 opciones", req=True, select=True),
                   '<button type="button" class="cb cb-pri">Guardar</button><button type="button" class="cb cb-sec">Cancelar</button>')
    return C.tel_pagina(cuerpo, ESTADOS_TDP, {"Nuevo dato": hoja}, "Datos de las personas · teléfono", F.CSS_TFILTRO)


# ================================================================ FRM-Usuario-Datos: la ficha con las pestañas «Acceso» y «Datos»
ESTADOS_UD = ["Acceso", "Datos", "Datos: con cambios", "Datos: guardando", "Datos: no se guardó", "Datos: una opción dada de baja"]


def usuario_datos():
    t = (PROJ / "Usuario.dc.html").read_text(encoding="utf-8")
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


ESTADOS_TUD = ["Datos", "Con cambios", "Guardando", "Una opción dada de baja"]


def tel_usuario_datos():
    barra = C.t_bar("Tomás Acosta", "Activo", "M-FRM-Datos-Personas.dc.html")
    tabs = '<div class="ap-tabs" role="tablist"><a role="tab" href="M-Usuario.dc.html">Acceso</a><span class="on" role="tab">Datos</span></div>'
    campos = lambda z: '<div class="ap-cuerpo"><div class="f-campos">' + F.tcampo("Zona", z, select=True) + F.tcampo("Sucursal", "Planta Norte") + "</div></div>"
    fijo = lambda b, on=True: f'<div class="ap-fijo"><button type="button" class="cb cb-sec full"{"" if on else " disabled"}>Descartar</button>{b}</div>'
    guardar = '<button type="button" class="cb cb-pri full">Guardar cambios</button>'
    cuerpo = {"Datos": barra + tabs + campos("Centro") + fijo('<button type="button" class="cb cb-pri full" disabled>Guardar cambios</button>', False),
              "Con cambios": barra + tabs + campos("Norte") + fijo(guardar), "Guardando": barra + tabs + campos("Norte") + fijo(trabaja("Guardando…").replace('class="cb cb-pri', 'class="cb cb-pri full')),
              "Una opción dada de baja": barra + tabs + campos("Cuyo · De baja") + fijo('<button type="button" class="cb cb-pri full" disabled>Guardar cambios</button>', False)}
    return C.tel_pagina(cuerpo, ESTADOS_TUD, {}, "Ficha del usuario · teléfono · etapa 16", E.CSS_E12)


# ================================================================ FRM-Catalogo-16: la columna «Filtro» en «Campos»
ESTADOS_C16 = ["Campos", "Un campo en uso", "Solo lectura"]
CSS_C16 = """.w-th.kc, .w-tr.kc { grid-template-columns: minmax(92px, 1fr) 146px 84px 52px 62px 186px 36px; gap: 10px; }
.w-th.kcl, .w-tr.kcl { grid-template-columns: 120px 150px 84px 52px 62px 190px; gap: 10px; }
.w-tr.kc:has(.e-tip), .w-tr.kc > .e-tipw { overflow: visible; }
.w-tr.kc .e-tipw { position: relative; display: inline-flex; }
.w-tr.kc .e-tip { position: absolute; z-index: 30; top: auto; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); padding: 6px 10px; border-radius: 8px; background: oklch(0.25 0.012 78); color: #fff; font-size: 12.5px; white-space: nowrap; width: max-content; max-width: none; }
.w-body .k-desp:has(.e-tip), .w-body .w-caja:has(.e-tip) { overflow: visible; }
.w-tr:has(.e-tip) { z-index: 8; }
"""


def con_filtro(html, filtros, en_uso=False, lectura=False):
    """Suma la casilla «Filtro» en cada fila, después de «Único», y su encabezado con la ayuda en la (i)."""
    for n, tipo, _ob, _un, lim in M13.CAMPOS:
        lim_h = M13.limite(tipo, lim, ro=lectura)
        ini = html.index(f">{n}<") if lectura else html.index(f'value="{n}"') if f'value="{n}"' in html else html.index(n)
        k = html.index(lim_h, ini)
        c = M13.chk(n in filtros, ro=lectura)
        if en_uso and n == "Zona":
            c = K.tip(M13.chk(True, ro=True), EN_USO_CAMPO, abierto=True)
        html = html[:k] + c + html[k:]
    return html.replace("<span>Único</span>", f'<span>Único</span><span>Filtro{F.info(AYUDA_FILTRO)}</span>')


def catalogo_16():
    tit = CATALOGO
    items = [(n, f'{d.replace("CUIT ", "")} · {M13.ZONAS_EJ[k % len(M13.ZONAS_EJ)]}') for k, (n, _c, d, a) in enumerate(K.PROVEEDORES[:6]) if a]
    cat = K.caja_catalogo(tit, "A quiénes se les compra.")

    def cuerpo(modo="normal", en_uso=False):
        catalogo = K.caja_catalogo(tit, "A quiénes se les compra.", lectura=True) if modo == "lectura" else cat
        return (f'<div class="w-body"><div class="k-cab2">{catalogo}{K.vista_previa(items, "Proveedor")}</div>{con_filtro(M13.caja_campos(modo), {"Zona"}, en_uso, modo == "lectura")}'
                f'{M13.caja_whatsapp("", ro=modo == "lectura")}{M13.caja_valores("normal" if modo != "lectura" else "lectura")}</div>')
    b = lambda **k: C.banda_k(tit, K.ACTIVO + K.ORIGEN_MANO, K.acc_editor(**k))
    V = {"Campos": (b(), cuerpo()), "Un campo en uso": (b(), cuerpo(en_uso=True)), "Solo lectura": (b(lectura=True), cuerpo("lectura"))}
    js = A.js_estados(ESTADOS_C16, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Campos de un catálogo · etapa 16", "Inicio / Formularios / Catálogos / Proveedores", A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + M13.CSS + CSS_C16, ESTADOS_C16, js, alto=1560)
    return t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)


def tel_catalogo_16():
    t = (PROJ / "M-FRM-Catalogo-13.dc.html").read_text(encoding="utf-8")
    fila = '<span class="t-chk"><i class="no"></i>Filtro</span>'
    t = t.replace('Único</span>' + F.tcampo("Límite", "hasta 13 caracteres"), 'Único</span>' + fila + F.tcampo("Límite", "hasta 13 caracteres"))
    return t.replace("<span>De Zonas · Obligatorio</span>", "<span>De Zonas · Obligatorio · Filtro</span>")


# ================================================================ FRM-Editor-16: «Qué opciones ve cada persona»
ESTADOS_E16 = ["Qué opciones ve cada persona", "Con un filtro fijo", "Le falta el dato", "El filtro no funciona", "Más opciones que el tope", "Solo lectura", "Sin campos de filtro"]


def seccion_filtros(modo="normal"):
    ro = modo == "lectura"
    menos = "" if ro else f'<button type="button" class="ib" aria-label="Quitar el filtro">{X}</button>'
    f = lambda c, v, chev=True: f'<div class="f{" ro" if ro else ""}"><div class="ct sel">{c}{CHEV if not ro else ""}</div><span>es</span><div class="ct sel">{v}{CHEV if chev and not ro else ""}</div>{menos}</div>'
    filas = f("Zona", "La zona de quien lo recibe")
    if modo == "fijo":
        filas += f("Rubro", "Frío")
    acs = "" if ro else '<div class="acs"><button type="button" class="cb cb-enl">Agregar un filtro según quien lo recibe</button><button type="button" class="cb cb-enl">Agregar un filtro fijo</button></div>'
    persona, res, clase = {"falta": ("Sofía Herrera", "Le falta «Zona»", "mal"), "roto": ("Juan Gómez", "El filtro no funciona", "mal"), "tope": ("Juan Gómez", "→ 240 opciones", "mal")}.get(modo, ("Juan Gómez", "→ 14 opciones", ""))
    maximo = "Como mucho 240 opciones por persona: el tope es 200" if modo == "tope" else "Como mucho 18 opciones por persona"
    cargar = "" if ro else ' · <a href="FRM-Datos-Personas.dc.html">Cargar los datos</a>'
    return (f'<div class="w-cmp ancho q-fil"><span class="c">Qué opciones ve cada persona{F.info(AYUDA_QUE_VE)}</span>{filas}{acs}'
            f'<div class="como"><span class="rt">Como si lo recibiera</span><div class="ct sel">{persona}{CHEV}</div><span class="res {clase}">{res}</span></div>'
            f'<div class="dat"><span>{maximo}</span><span>2 personas sin Zona{cargar}</span></div></div>')


def editor_16():
    A_preg = A.pregunta_catalogo

    def pregunta(modo="elegido", filtros=None):
        h = A_preg(modo).replace("Motivos de visita", CATALOGO)
        h = h.replace('<div class="ct">Motivo</div>', f'<div class="ct">{PREGUNTA}</div>').replace(">Motivo<", f">{PREGUNTA}<")
        if filtros:
            k = h.index('<div class="w-cmp"><span class="rt">Ayuda para el empleado')
            h = h[:k] + seccion_filtros(filtros) + h[k:]
        return h

    def cuerpo(filtros):
        A.pregunta_catalogo = lambda modo="elegido": pregunta(modo, filtros)
        try:
            return E.cuerpo_editor(modo="fijo", catalogo="elegido").replace("Motivo (opcional)", f"{PREGUNTA} (opcional)")
        finally:
            A.pregunta_catalogo = A_preg
    pub = lambda c, modo="cambios": (E.banda(FORMULARIO, E.EST_PUB, E.acc(modo), E.VOL), c)
    V = {"Qué opciones ve cada persona": pub(cuerpo("normal")), "Con un filtro fijo": pub(cuerpo("fijo")), "Le falta el dato": pub(cuerpo("falta")), "El filtro no funciona": pub(cuerpo("roto")),
         "Más opciones que el tope": pub(cuerpo("tope")), "Solo lectura": pub(cuerpo("lectura"), "solo"), "Sin campos de filtro": pub(cuerpo(None))}
    return A.pagina_editor(V, {}, ESTADOS_E16, "Editor del formulario · etapa 16", E.CSS_E12 + E.CSS_CA4 + E.css_titulos() + CSS_FILTROS)


ESTADOS_TE16 = ["Qué opciones ve cada persona", "Le falta el dato", "Solo lectura"]


def tel_editor_16():
    barra = C.t_bar(PREGUNTA, "Pregunta", "M-FRM-Editor.dc.html")

    def fila(c, v):
        return f'<div class="q-row"><span class="tx"><b>{c} es</b><span>{v}</span></span><button type="button" class="ap-ib" aria-label="Quitar el filtro">{F.svg(chr(60) + "path d=" + chr(34) + "M6 6l12 12M18 6 6 18" + chr(34) + "/>", 20)}</button></div>'

    def pant(persona="Juan Gómez", res="→ 14 opciones", ro=False):
        tit = f'<div class="ap-gtit">Qué opciones ve cada persona{"" if ro else "<a href=" + chr(34) + "#" + chr(34) + ">Agregar un filtro</a>"}</div>'
        filas = fila("Zona", "La zona de quien lo recibe").replace('<button type="button" class="ap-ib" aria-label="Quitar el filtro">', '<button type="button" class="ap-ib" aria-label="Quitar el filtro" hidden>') if ro else fila("Zona", "La zona de quien lo recibe")
        return (barra + f'<div class="ap-cuerpo">{tit}<div class="ap-grupo">{filas}</div><div class="f-campos">' + F.tcampo("Como si lo recibiera", persona, select=True) + "</div>"
                f'<div class="ap-txt-l" style="padding: 0 16px;"><b>{res}</b><br>Como mucho 18 opciones por persona<br>2 personas sin Zona</div></div>')
    cuerpo = {"Qué opciones ve cada persona": pant(), "Le falta el dato": pant("Sofía Herrera", "Le falta «Zona»"), "Solo lectura": pant(ro=True)}
    return C.tel_pagina(cuerpo, ESTADOS_TE16, {}, "Pregunta · teléfono · etapa 16", E.CSS_E12)


# ================================================================ FRM-Publicar-16: la zona «Avisos», entre «Problemas» y «Qué se publica» (112)
ESTADOS_P16 = ["Solo avisos", "Problemas y avisos", "Para los dos: un cliente"]


def z_aviso(que, detalle):
    return f'<div class="z-f av"><span class="ic">{F.INFO}</span><span class="tx"><b>{que}</b><span>{detalle}</span></span><a href="FRM-Editor-16.dc.html">Ir a la pregunta</a></div>'


def publicar_16():
    base = (E.banda(FORMULARIO, E.EST_PUB, E.acc("limpio"), E.VOL), E.cuerpo_editor(abierta=None, modo="fijo"))
    avisos = E.z_cab("Avisos") + z_aviso("Como mucho 18 opciones por persona", f"{PREGUNTA}: entra en lo que muestra WhatsApp.") + z_aviso("2 personas sin Zona", "No se les va a poder mandar hasta que tengan el dato.")
    problema = E.z_cab("Problemas") + E.z_problema(PREGUNTA, "El filtro «Rubro es Frío» deja 240 opciones, y WhatsApp muestra hasta 200.")
    cliente = z_aviso("No se le va a poder mandar a un cliente", f"{PREGUNTA} depende de un dato de la persona.")
    tit = "Publicar la versión 4 en WhatsApp"
    dlg = A.dlg_publicar
    capas = {"Solo avisos": dlg(tit, avisos + E.que_se_publica(), E.pie_pub()), "Problemas y avisos": dlg(tit, problema + avisos + E.que_se_publica(), E.pie_pub(activo=False)),
             "Para los dos: un cliente": dlg(tit, avisos + cliente + E.que_se_publica(), E.pie_pub())}
    return A.pagina_editor({e: base for e in ESTADOS_P16}, capas, ESTADOS_P16, "Publicar en WhatsApp · etapa 16", E.CSS_E12 + E.css_titulos() + E.CSS_ZONAS + CSS_AVISOS)


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
    return re.sub(r"<title>[^<]*</title>", f"<title>{destino}</title>", t)


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
    barra = R.barra("repuesto-columnas")
    cuerpos = {"Columnas": barra.replace(plazo, plazo + apagada) + R.tabla_r(), "Prendida": barra.replace(plazo, plazo + prendida) + tabla_zona()}
    bnd = R.banda(R.REPUESTO, "Respuestas · versión 2 publicada", R.EXPORTAR)
    estados = ["Elegir varias: " + e for e in ESTADOS_R16]  # el prefijo pone sus migas
    t = R.pagina("Respuestas · etapa 16", A.con_estados([(e, bnd) for e in estados]), A.con_estados([(e, R.CUERPO.format(cuerpos[e.split(": ")[1]])) for e in estados]), estados)
    return t.replace("Elegir varias: Columnas", "Columnas").replace("Elegir varias: Prendida", "Prendida")


def tel_respuestas_16():
    t = (PROJ / "M-FRM-Respuestas.dc.html").read_text(encoding="utf-8")
    t = t.replace(f"{A.DESCARGAR} Exportar a Excel</span>", f'{A.DESCARGAR} Exportar a Excel</span><span role="menuitem">Columnas</span>')
    return re.sub(r"<title>[^<]*</title>", "<title>Respuestas · teléfono · etapa 16</title>", t)


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Datos-Personas": ("Administración · Datos de las personas · etapa 16", 1440, 1000), "M-FRM-Datos-Personas": ("Datos de las personas · teléfono", 390, 844),
           "FRM-Usuario-Datos": ("Administración · la ficha, con «Datos» · etapa 16", 1440, 900), "M-FRM-Usuario-Datos": ("La ficha, con «Datos» · teléfono", 390, 844),
           "FRM-Catalogo-16": ("Formularios · la columna «Filtro» · etapa 16", 1280, 1560), "M-FRM-Catalogo-16": ("La columna «Filtro» · teléfono", 390, 844),
           "FRM-Editor-16": ("Formularios · qué opciones ve cada persona · etapa 16", 1440, 1400), "M-FRM-Editor-16": ("Qué opciones ve cada persona · teléfono", 390, 844),
           "FRM-Publicar-16": ("Formularios · publicar con avisos · etapa 16", 1440, 1400),
           "WA-Chats-Formulario-16": ("WhatsApp · un formulario que no se puede mandar · etapa 16", 1440, 900), "M-WA-Chats-Formulario-16": ("Un formulario que no se puede mandar · teléfono", 390, 844),
           "FRM-Respuestas-16": ("Formularios · la subcolumna de un filtro · etapa 16", 1440, 900), "M-FRM-Respuestas-16": ("La subcolumna de un filtro · teléfono", 390, 844)}


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
    con_marco = {"FRM-Catalogo-16": (catalogo_16, 1560), "FRM-Editor-16": (editor_16, 1400), "FRM-Publicar-16": (publicar_16, 1400), "FRM-Respuestas-16": (respuestas_16, None)}
    for n, (f, alto) in con_marco.items():
        t = L.sin_disenar(n, E.post(n, f(), alto))
        if n == "FRM-Respuestas-16":
            t = L.con_pestanas(t, "respuestas")
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    sueltos = {"FRM-Datos-Personas": datos_personas, "M-FRM-Datos-Personas": tel_datos_personas, "FRM-Usuario-Datos": usuario_datos, "M-FRM-Usuario-Datos": tel_usuario_datos,
               "M-FRM-Catalogo-16": tel_catalogo_16, "M-FRM-Editor-16": tel_editor_16, "M-FRM-Respuestas-16": tel_respuestas_16}
    for n, f in sueltos.items():
        (PROJ / f"{n}.dc.html").write_text(f(), encoding="utf-8")
    (PROJ / "WA-Chats-Formulario-16.dc.html").write_text(chat_16("WA-Chats-Formulario", "WhatsApp · Internos · etapa 16"), encoding="utf-8")
    (PROJ / "M-WA-Chats-Formulario-16.dc.html").write_text(chat_16("M-WA-Chats-Formulario", "WhatsApp · teléfono · etapa 16"), encoding="utf-8")
    registrar()
    print("tableros", list(TITULOS))
