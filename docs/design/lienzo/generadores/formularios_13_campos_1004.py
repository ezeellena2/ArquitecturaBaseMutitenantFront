"""Etapa 13 · Campos de los catálogos, CE1: definir los campos de un catálogo escrito a mano (`13-campos.md` del back).

Desde la v150 (decisiones 125 a 129), como ArquitecturaBaseFront, con nuestras piezas. Ya no hay sección «Campos» en la página, y reemplaza a la forma «B» del
25/10 y a la 118:
- «Agregar campos · N», en el encabezado de Opciones, abre el modal «Campos de …»: la lista a la izquierda y el campo a la derecha, igual al de opciones (117). Escribe en
  una copia: «Listo» la deja en el catálogo, que se guarda con «Guardar cambios», y «Cancelar» la descarta.
- Cada campo: Nombre, Clave, Tipo con su largo, rango o catálogo, y Reglas. El papel (Filtro o Dato) llega con la 16. Hasta 20 campos (42).
- Los valores de cada opción van en una columna por campo, antes de «Detalle», con «Columnas» para ocultarlas. Un campo nuevo espera grisado a que se guarde (43).
- «En WhatsApp» va debajo de «El catálogo», con el teléfono al costado de las dos cajas: «Título» y «Descripción» con un chip por dato, «Agregar campo» y «Por ejemplo».
- En el teléfono, el modal ocupa la pantalla: primero la lista y después el campo, con «Volver a la lista».

- FRM-Catalogo-13 y M-FRM-Catalogo-13: el catálogo «Proveedores» con CUIT y Zona (de «Zonas»); la versión de la 13 de FRM-Catalogo.
- FRM-Catalogo-Campos y M-FRM-Catalogo-Campos: el modal de campos.
- FRM-Catalogo-Opciones-13 y M-FRM-Catalogo-Opciones-13: el modal de opciones de la 12, con una fila por campo.

Sus piezas tienen parámetros porque `FRM-Catalogo-14` (formularios_14_formularios_1004.py) y `FRM-Catalogo-16` (formularios_16_personas_1004.py) las usan.

Corre después de `formularios_12_catalogos_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_12_catalogos_1004 as K  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import estados_util as EU  # noqa: E402

PROJ = A.PROJ
APROBADO = True  # el usuario los aprobó el 27/10
PARA_APROBAR = " · para aprobar"
CHEV, MAS, KEBAB, TILDE = F.CHEV, F.MAS, F.KEBAB, A.TILDE
MOTIVO_TOPE = "Llegó a 20 campos, el máximo de un catálogo."

# (campo, tipo, obligatorio, único, límite, clave)
CAMPOS = [("CUIT", "Texto", True, True, ("13", "caracteres"), "cuit"), ("Zona", "De un catálogo", True, False, "Zonas · 6 opciones", "zona")]
ZONA_BAJA = "Cuyo"
LARGO = "Aceros y perfiles laminados para estructuras"  # como Detalle, en el título de WhatsApp no entran sus 44 caracteres
MAL_TITULO = "No entra en el título de WhatsApp."
RUBROS = ["Abrasivos", "Aceros", "Aislantes", "Alambres", "Aluminio", "Andamios", "Áridos", "Bulones", "Sanitarios", "Cemento"]
ZONAS_EJ = ["Capital", "Gran Buenos Aires", "Interior", "Patagonia", "Litoral"]
MOTIVO_GUARDAR = "Guardá el catálogo para cargar los valores de este campo."
MOTIVO_NUEVO = "Un campo nuevo nace opcional: para hacerlo obligatorio, todas las opciones activas necesitan un valor."
CLAVE = "La usan la plantilla, la importación y lo guardado. No cambia después de guardar."
ANCHO_OPCIONES, ANCHO_LECTURA = 1126, 960
TIPOS = ["Texto", "Número entero", "Número con decimales", "Fecha", "Sí/No", "De un catálogo"]
CATALOGOS = ["Motivos de visita · 3 opciones", "Productos · 10 opciones", "Recargo por zona · 6 opciones", "Tipos de producto · 12 opciones", "Zonas · 6 opciones"]
CSS = """.w-app { width: 1280px !important; }
.w-th.kf, .w-tr.kf { grid-template-columns: 28px 30px minmax(192px, 1.25fr) 96px 128px 128px minmax(192px, 1.35fr) 56px 172px; gap: 10px; }
.w-th.kf3, .w-tr.kf3 { grid-template-columns: 28px 30px minmax(192px, 1.25fr) 96px 128px 128px 128px minmax(192px, 1.35fr) 56px 172px; gap: 10px; }
.w-tr.kf, .w-tr.kf3 { position: relative; min-height: 50px; }
.k-in.off { background: var(--s2); border-color: var(--borde); }
.w-th .k-gr { color: var(--t3); }
.w-th .e-tipw .e-tip { top: calc(100% + 8px); left: auto; right: 0; white-space: nowrap; }
/* Dibujada corrida, como si se hubiera desplazado: lo que no es fijo pasa por debajo de lo fijo */
.k-desp.corrida .w-th > :not(.fx), .k-desp.corrida .w-tr > :not(.fx) { transform: translateX(-240px); }
.k-wa2 { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
.k-wa2 .rt2 { font-size: 13px; font-weight: 600; color: var(--t2); }
.k-wa2 .parte { display: flex; flex-direction: column; gap: 6px; }
.k-wa2 .sels { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.k-wa2 .sel2 { position: relative; flex: 1; min-width: 180px; }
.k-wa2 .sel2 > .k-in { justify-content: space-between; cursor: pointer; }
.k-wa2 .sel2 .f-mn { top: 36px; left: 0; width: 240px; }
.k-wa2 .aviso3 { display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: oklch(0.45 0.1 70); }
.k-wa2 .aviso3 ul { margin: 0; padding-left: 18px; color: var(--t2); }
.k-chip2 { display: inline-flex; align-items: center; gap: 2px; height: 26px; padding: 0 2px 0 8px; border: 1px solid var(--borde2); border-radius: 7px; background: #fff; font-size: 12.5px; font-weight: 500; color: var(--t1); }
.k-chip2 .ib { width: 22px; height: 22px; color: var(--t3); }
.k-chip2 .ib svg { width: 12px; height: 12px; }
.k-chip2 .ib[aria-disabled="true"] { color: var(--borde2); }
.k-chip2.ro { padding-right: 8px; background: var(--s2); color: var(--t3); }
.k-ej { display: flex; flex-direction: column; gap: 6px; }
.k-ej .t { font-size: 12px; font-weight: 600; color: var(--t3); }
.k-ej .box { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 8px; font-size: 13.5px; color: var(--t1); }
.k-ej .box small { font-size: 12.5px; color: var(--t3); }
.k-ej .box .k-largo { color: var(--peligro); }
.k-tab { display: flex; flex-direction: column; gap: 3px; min-width: 0; position: relative; }
.k-tab .f-mn { top: 36px; left: 0; width: 280px; }
.w-body .w-caja:has(.f-mn) { overflow: visible; }
.w-tr .f-menu { position: absolute; right: 12px; top: calc(100% - 6px); z-index: 20; min-width: 190px; }
.f-cab .der .e-tipw .e-tip { top: calc(100% + 8px); right: 0; }
.k-cont { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; margin-left: 4px; padding: 0 6px; box-sizing: border-box; border-radius: 10px; background: var(--s3); font-size: 12px; font-weight: 600; color: var(--t2); }
.k-cont.mal { background: var(--peligro-t); color: var(--peligro); }
.k-fb .w-pil { position: relative; }
.k-fb .f-menu { position: absolute; left: 0; top: calc(100% + 6px); z-index: 30; min-width: 200px; }
.k-rev { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--borde); }
.k-rev .ls { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 13.5px; color: var(--peligro); }
.k-rev .ls span { display: flex; align-items: flex-start; gap: 6px; }
.k-rev .ls svg { width: 15px; height: 15px; flex: none; margin-top: 2px; }
.k-rev .cb { flex: none; }
/* Solo lectura: los mismos controles, grisados (Criterio · Formularios) */
.k-in.ro { background: var(--s2); border-color: var(--borde); color: var(--t3); }
.w-th.kl2, .w-tr.kl2 { grid-template-columns: 30px minmax(192px, 1.2fr) 96px 128px 128px minmax(192px, 1.4fr) 110px; gap: 10px; }
.w-tr.kl2 { position: relative; min-height: 50px; }
.k-desp.corrida2 .w-th > :not(.fx), .k-desp.corrida2 .w-tr > :not(.fx) { transform: translateX(-60px); }
.k-desp.corrida3 .w-th > :not(.fx), .k-desp.corrida3 .w-tr > :not(.fx) { transform: translateX(-120px); }
.w-tr:has(.f-mn) { z-index: 8; }
.w-tr.kf > .k-tab:has(.f-mn) { overflow: visible; }
.k-tab .f-mn > span .baja2 { margin-left: auto; padding-left: 12px; font-size: 12px; font-weight: 400; color: var(--t3); }
/* El título que no entra, en rojo en el teléfono de al lado */
.tel .k-li .t .k-largo { color: var(--peligro); }
"""
# El modal de campos (125): las mismas cajas que el de opciones
CSS_CAMPOS = """.md-f.junto { border-top: 0; padding-top: 0; }
.md-f .k-in.sel { justify-content: space-between; cursor: pointer; }
.md-f .ctl { position: relative; }
.md-f .f-mn { top: 36px; left: 0; width: 100%; z-index: 30; }
.md-f .f-mn .vacio { padding: 8px 10px; font-size: 13px; color: var(--t2); }
.md-f .lim { display: flex; align-items: center; gap: 8px; min-height: 34px; font-size: 13px; color: var(--t2); }
.md-f .lim .k-in { width: 72px; flex: none; }
.md-f .lim .k-in.fecha { width: 130px; }
.md-f .regs { display: flex; align-items: center; gap: 22px; min-height: 34px; font-size: 13.5px; color: var(--t1); }
.md-f .regs label { display: inline-flex; align-items: center; gap: 8px; }
.md-f .lee { display: flex; align-items: center; min-height: 34px; font-size: 13.5px; color: var(--t1); }
.md-f .lee small { margin-left: 8px; font-size: 12.5px; color: var(--t3); }
.md-f .cand { display: inline-flex; align-items: center; gap: 6px; }
.md-f .cand svg { width: 14px; height: 14px; color: var(--t3); flex: none; }
.w-dlg.md .db { height: 470px; }
.w-dlg.md { overflow: visible; }
.md-usos { display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; color: var(--t2); }
.md-usos a { color: var(--marca-tx); font-weight: 600; text-decoration: none; }
.md-conf { display: flex; align-items: flex-start; gap: 10px; margin-top: 12px; font-size: 13.5px; color: var(--t1); }
"""
BUSCA_LLAVE = '<path d="M7 11V8a5 5 0 0 1 10 0v3"/><rect x="5" y="11" width="14" height="9" rx="2"/>'
CANDADO = F.svg(BUSCA_LLAVE, 14)


def chk(on, ro=False):
    apagado = ' aria-disabled="true"' if ro else ""
    return (f'<span><span class="k-chk{" on" if on else ""}{" ro" if ro else ""}" role="checkbox" aria-checked="{"true" if on else "false"}"{apagado}>'
            f'{TILDE if on else ""}</span></span>')


def gris(valor, sel=False):
    """El mismo control, grisado: lo que no se edita nunca es un rótulo y un texto sueltos."""
    return f'<span class="k-in{" sel" if sel else ""} ro" aria-disabled="true"><span>{valor}</span>{CHEV if sel else ""}</span>'


def combo_catalogo(valor, modo=""):
    """El catálogo de un campo (111). modo: abierto, con los primeros | buscar, filtrando lo escrito | nada, sin coincidencias."""
    if not modo:
        return f'<span class="k-in sel" role="combobox" aria-expanded="false" aria-label="Catálogo"><span>{valor}</span>{CHEV}</span>'
    escrito = {"abierto": valor, "buscar": "zo", "nada": "zorro"}[modo]
    lista = {"abierto": CATALOGOS, "buscar": ["Zonas · 6 opciones"], "nada": []}[modo]
    filas = "".join(f'<span role="option" class="{"on" if x == valor else ""}">{x}</span>' for x in lista) or '<span class="vacio">Ningún catálogo coincide.</span>'
    return (f'<span class="k-in sel foco" role="combobox" aria-expanded="true" aria-label="Catálogo"><span>{escrito}</span>{CHEV}</span>'
            f'<span class="f-mn" role="listbox" aria-label="Catálogo">{filas}</span>')


def tipo_campo(tipo, abierto=False, err=""):
    c = f'<span class="k-in sel{" foco" if abierto else ""}{" mal" if err else ""}" role="combobox" aria-label="Tipo" aria-expanded="{"true" if abierto else "false"}"><span>{tipo}</span>{CHEV}</span>'
    if abierto:
        c += '<span class="f-mn" role="listbox" aria-label="Tipo">' + "".join(f'<span role="option" class="{"on" if x == tipo else ""}">{x}</span>' for x in TIPOS) + "</span>"
    return c


def detalle_tipo(tipo, lim, combo=""):
    """Lo que acompaña al tipo, en su misma zona: el largo, el rango o el catálogo. Sí/No no lleva nada."""
    if tipo == "De un catálogo":
        return K.md_fila("Catálogo", combo_catalogo(lim, combo), req=True).replace('class="md-f"', 'class="md-f junto"', 1)
    if tipo == "Sí/No" or lim is None:
        return ""
    if tipo == "Texto":
        control = f'<span class="lim">Hasta {K.entrada(lim[0], ph="N")} {lim[1]}</span>'
        return K.md_fila("Largo", control).replace('class="md-f"', 'class="md-f junto"', 1)
    clase = " fecha" if tipo == "Fecha" else ""
    control = f'<span class="lim">De {K.entrada(lim[0], ph="Mínimo").replace("k-in", "k-in" + clase, 1)} a {K.entrada(lim[1], ph="Máximo").replace("k-in", "k-in" + clase, 1)}</span>'
    return K.md_fila("Rango", control).replace('class="md-f"', 'class="md-f junto"', 1)


def regla(on, texto, motivo=""):
    apagada = f' aria-disabled="true" title="{motivo}"' if motivo else ""
    gris_ = " ro" if motivo else ""
    return (f'<label><span class="k-chk{" on" if on else ""}{gris_}" role="checkbox" aria-checked="{"true" if on else "false"}"{apagada}>{TILDE if on else ""}</span>{texto}</label>')


def seg_papel(papel):
    return ('<span class="md-seg" role="radiogroup" aria-label="Papel">' + "".join(
        f'<span class="{"on" if x == papel else ""}" role="radio">{x}</span>' for x in ("Filtro", "Dato")) + "</span>")


AYUDA_PAPEL = "Filtro: para mostrarle a cada persona lo suyo, o para un filtro fijo de una pregunta. Dato: se guarda con la opción y viaja con la respuesta."


def panel_campo(posicion, n, tipo, ob, un, lim, clave, nuevo=False, foco=False, abierto=False, combo="", err_clave="", err_nombre="", papel=None, quitar=True, err_papel=""):
    """El campo elegido. La clave nace del nombre y se puede escribir; una vez guardada, queda con su candado. Uno nuevo nace opcional, y el motivo va en su tooltip (43)."""
    nombre = K.md_fila("Nombre", K.entrada(n, ph="Nombre del campo", foco=foco, mal=bool(err_nombre)), req=True, err=err_nombre)
    llave = K.entrada(clave, mono=True, ph="clave", mal=bool(err_clave)) if nuevo else f'<span class="k-in ro mono" aria-readonly="true"><span class="cand">{CANDADO}{clave}</span></span>'
    filas = nombre + K.md_fila("Clave", llave, req=True, ayuda=CLAVE, err=err_clave)
    filas += K.md_fila("Tipo", tipo_campo(tipo, abierto), req=True) + detalle_tipo(tipo, lim, combo)
    filas += K.md_fila("Reglas", '<span class="regs">' + regla(ob, "Obligatorio", MOTIVO_NUEVO if nuevo else "") + regla(un, "Único") + "</span>")
    if papel:
        filas += K.md_fila("Papel", seg_papel(papel), ayuda=AYUDA_PAPEL, err=err_papel)
    cab = K.md_cab(posicion, "Quitar campo") if quitar else f'<div class="md-cab"><span>{posicion}</span></div>'
    return f'<div class="md-op">{cab}{filas}</div>'


def panel_lectura(posicion, n, tipo, ob, un, lim, clave, papel=None):
    """Solo `formcatalogs.read`: el campo como texto, sin controles."""
    det = lim if tipo == "De un catálogo" else (f"hasta {lim[0]} {lim[1]}" if tipo == "Texto" and lim else "")
    reglas = " · ".join(x for x, on in (("Obligatorio", ob), ("Único", un)) if on) or "—"
    filas = K.md_fila("Nombre", f'<span class="lee">{n}</span>') + K.md_fila("Clave", f'<span class="lee mono">{clave}</span>')
    filas += K.md_fila("Tipo", f'<span class="lee">{tipo}<small>{det}</small></span>') + K.md_fila("Reglas", f'<span class="lee">{reglas}</span>')
    if papel:
        filas += K.md_fila("Papel", f'<span class="lee">{papel}</span>')
    return f'<div class="md-op"><div class="md-cab"><span>{posicion}</span></div>{filas}</div>'


def flechas_campo(n, primero=False, ultimo=False):
    return (f'<span class="md-fle"><button type="button" class="ib" aria-label="Subir {n}" aria-disabled="{"true" if primero else "false"}">{F.ARRIBA}</button>'
            f'<button type="button" class="ib" aria-label="Bajar {n}" aria-disabled="{"true" if ultimo else "false"}">{F.ABAJO}</button></span>')


def item_campo(k, c, total, sel=False, lectura=False, papel=None, mal=False):
    n, tipo = c[0], c[1]
    sub = f"{tipo} · {papel}" if papel else tipo
    return K.md_item(k, n, sub, on=sel, mal=mal, flechas_md=flechas_campo(n, k == 1, k == total) if sel and not lectura and total > 1 else "")


def dlg_campos(items, panel, cuenta, catalogo="Proveedores", tope=False, lectura=False):
    """«Campos de …», como el modal de opciones: la lista en su caja, con «Agregar campo» al pie, y el campo elegido en la suya."""
    agregar = f'<button type="button" class="cb cb-sec">{MAS} Agregar campo</button>'
    if tope:
        agregar = K.tip(agregar, MOTIVO_TOPE, abierto=True)
    mas = "" if lectura else f'<div class="md-mas">{agregar}</div>'
    cab = f'<div class="md-tit"><span>Campos</span><small>{"" if lectura else cuenta}</small></div>'
    cuerpo = f'<div class="md-lista" role="listbox" aria-label="Campos">{cab}{items}{mas}</div>{panel}'
    pie = ('<button type="button" class="cb cb-sec">Cerrar</button>' if lectura else
           '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Listo</button>')
    return F.dialogo(f"Campos de «{catalogo}»", cuerpo, pie, una=False).replace('class="w-dlg"', 'class="w-dlg md"', 1)


def boton_campos(cantidad=2, mal=False, lectura=False):
    """«Agregar campos · N», al lado de «Agregar opción». Quien solo lee ve «Campos» si hay."""
    n = f'<span class="k-cont{" mal" if mal else ""}">{cantidad}</span>' if cantidad else ""
    if lectura:
        return f'<button type="button" class="cb cb-sec">Campos{n}</button>' if cantidad else ""
    return f'<button type="button" class="cb cb-sec" aria-label="Agregar campos · {cantidad}">{MAS} Agregar campos{n}</button>'


def aviso_campos(lineas, revisar=True):
    """Arriba de la tabla, lo que dijo el servidor de los campos al guardar. «Revisar» abre el modal en el primero con error."""
    ls = "".join(f"<span>{K.ALERTA}{x}</span>" for x in lineas)
    b = '<button type="button" class="cb cb-sec">Revisar</button>' if revisar else ""
    return f'<div class="k-rev" role="alert"><div class="ls">{ls}</div>{b}</div>'


def menu_zonas():
    """La fuente de «Zona»: las opciones activas y, entre ellas, la guardada que se dio de baja (FieldValueInput de la maqueta)."""
    activas = "".join(f'<span role="option">{z}</span>' for z in sorted(ZONAS_EJ))
    return (f'<span class="f-mn" role="listbox" aria-label="Zona">{activas}'
            f'<span role="option" class="on" aria-selected="true">{ZONA_BAJA}<span class="baja2">De baja</span></span></span>')


def menu_columnas(columnas=("CUIT", "Zona")):
    """«Columnas»: qué campos se ven en la tabla. Lo oculto se sigue guardando."""
    items = "".join(f'<span class="f-mi" role="menuitemcheckbox" aria-checked="true"><span class="k-chk on">{TILDE}</span> {c}</span>' for c in columnas)
    return f'<div class="f-menu" role="menu" aria-label="Columnas">{items}</div>'


def valores_lectura():
    """Solo `formcatalogs.read`: la tabla de lectura, sin casillas ni acciones, con una columna por campo."""
    filas = "".join(K.fila_lectura(k, n, cod, RUBROS[k - 1], a, tabla="kl2",
                                   campos=f'<span class="k-lee mono">{det.replace("CUIT ", "")}</span><span class="k-lee">{ZONAS_EJ[(k - 1) % len(ZONAS_EJ)]}</span>')
                    for k, (n, cod, det, a) in enumerate(K.PROVEEDORES, 1))
    pie = '<div class="w-pie"><span>1–10 de 1.097</span><span>10 por página · Página 1 de 110</span></div>'
    caja = K.caja_opciones(filas, "", pie, modo="lectura", tabla="kl2", cab=["#", "Texto", "Código", "CUIT", "Zona", "Detalle", "Estado"], ancho=ANCHO_LECTURA,
                           boton_campos=boton_campos(2, lectura=True), columnas=True)
    return caja.replace('<div class="k-desp">', '<div class="k-desp corrida3">', 1)  # sin las acciones fijas, corrida hasta el final: se ve el estado


def caja_valores(modo="normal"):
    """La tabla de opciones con una columna por campo (CE2), antes de «Detalle». Con un campo nuevo, su columna queda grisada hasta guardar (43).
    Sin los campos, el «Detalle» de «Proveedores» es el rubro."""
    if modo == "lectura":
        return valores_lectura()
    nuevo = modo == "agregar"
    filas = ""
    for k, (n, cod, det, a) in enumerate(K.PROVEEDORES, 1):
        zona = ZONAS_EJ[(k - 1) % len(ZONAS_EJ)]
        control = f'<span class="k-in sel"><span>{zona}</span>{CHEV}</span>'
        if modo == "baja" and k == 3:
            control = f'<span class="k-in sel foco" role="combobox" aria-expanded="true"><span>{ZONA_BAJA}</span>{CHEV}</span>' + menu_zonas()
        celdas = f'<span class="k-tab">{K.entrada(det.replace("CUIT ", ""), mono=True)}</span><span class="k-tab">{control}</span>'
        if nuevo:
            celdas += f'<span class="k-tab"><span class="k-in off" aria-disabled="true" title="{MOTIVO_GUARDAR}"><span></span></span></span>'
        kw = dict(err={"detalle": MAL_TITULO}) if modo == "titulo" and k == 2 else {}
        if modo == "uso" and k == 2:
            kw = dict(borrar=True, aviso_f="No se puede borrar: la usa otra opción. Podés darla de baja.")
        filas += K.fila_editable(k, n, cod, LARGO if "err" in kw else RUBROS[k - 1], a, campos=celdas, tabla="kf3" if nuevo else "kf", total=len(K.PROVEEDORES) if k < 10 else 0, **kw)
    gris_ = f'<span class="k-gr" title="{MOTIVO_GUARDAR}">Plazo de pago</span>'
    if modo == "agregar":
        gris_ = K.tip(gris_, MOTIVO_GUARDAR, abierto=True)
    cab = ["", "#", "Texto", "Código", "CUIT", "Zona"] + ([f"<span>{gris_}</span>"] if nuevo else []) + ["Detalle", "Estado", "Acciones"]
    pie = '<div class="w-pie"><span>1–10 de 1.097</span><span>10 por página · Página 1 de 110</span></div>'
    aviso = aviso_campos(["«Zona» · Tipo: 1.097 opciones tienen un valor que no es un número entero."]) if modo == "error" else ""
    cambios = modo in ("agregar", "error", "baja", "titulo", "uso")
    caja = K.caja_opciones(filas, "1.097 opciones · 1.090 activas", pie, modo="cambios" if cambios else "normal", tabla="kf3" if nuevo else "kf", cab=cab, ancho=ANCHO_OPCIONES + (138 if nuevo else 0),
                           boton_campos=boton_campos(3 if nuevo else 2, mal=modo == "error"), columnas=True, aviso=aviso)
    if modo == "columnas":
        caja = caja.replace(f'<span class="w-pil">Columnas {CHEV}</span>', f'<span class="w-pil">Columnas {CHEV}{menu_columnas()}</span>', 1)
    # Al agregar un campo, corrida: se ve la columna nueva, grisada, con su motivo. Con la opción de baja, hasta «Zona»
    if modo == "baja":
        return caja.replace('<div class="k-desp">', '<div class="k-desp corrida2">', 1)
    return caja.replace('<div class="k-desp">', '<div class="k-desp corrida">', 1) if modo == "agregar" else caja


# ================================================================ En WhatsApp (CE3), como ArquitecturaBase (126)
# Dos partes, Título y Descripción, una debajo de la otra: un chip por dato, con ✕ para quitarlo, y un desplegable «Agregar campo» con lo que falta. El título no se queda
# sin nada: con un solo chip, su ✕ va apagado. «Por ejemplo» muestra la primera opción activa. Reemplaza a la opción C del 26/10.
COLUMNAS = ["Texto", "Código", "Detalle"] + [c[0] for c in CAMPOS]
TITULO_WA, DESCRIPCION_WA = ["Texto"], ["CUIT", "Zona"]
X = A.X


def chip_wa(valor, parte, solo=False, ro=False):
    if ro:
        return f'<span class="k-chip2 ro">{valor}</span>'
    apagado = ' aria-disabled="true"' if solo else ""
    return f'<span class="k-chip2">{valor}<button type="button" class="ib" aria-label="Quitar {valor} de {parte}"{apagado}>{X}</button></span>'


def agregar_wa(parte, renglon, abierto=False, ro=False, columnas=None):
    disponibles = [c for c in (COLUMNAS if columnas is None else columnas) if c not in renglon]
    if ro:
        return f'<span class="sel2">{gris("Agregar campo", sel=True)}</span>'
    menu = ""
    if abierto:
        menu = '<span class="f-mn" role="listbox" aria-label="Qué muestra">' + "".join(f'<span role="option">{c}</span>' for c in disponibles) + "</span>"
    return (f'<span class="sel2"><span class="k-in sel{" foco" if abierto else ""}" role="combobox" aria-label="Agregar campo a {parte}" aria-expanded="{"true" if abierto else "false"}">'
            f"<span>Agregar campo</span>{CHEV}</span>{menu}</span>")


def caja_whatsapp(abierto="", titulo_wa=None, descripcion=None, columnas=None, ro=False, ejemplo=None, aviso=""):
    """abierto: «Título» o «Descripción», con su desplegable abierto. ejemplo: (título, descripción) de la primera opción activa. aviso: lo que no entra."""
    tit = titulo_wa or TITULO_WA
    descripcion = DESCRIPCION_WA if descripcion is None else descripcion
    chips_t = "".join(chip_wa(v, "Título", solo=len(tit) == 1, ro=ro) for v in tit)
    chips_d = "".join(chip_wa(v, "Descripción", ro=ro) for v in descripcion)
    ej = ""
    if ejemplo:
        ej = f'<div class="k-ej"><span class="t">Por ejemplo</span><div class="box"><span>{ejemplo[0]}</span><small>{ejemplo[1]}</small></div></div>'
    return ('<div class="w-caja"><div class="f-cab"><span>En WhatsApp</span></div><div class="k-wa2">'
            f'<div class="parte"><span class="rt2">Título · hasta 30 caracteres</span><span class="sels">{chips_t}{agregar_wa("Título", tit, abierto == "Título", ro, columnas)}</span></div>'
            f'<div class="parte"><span class="rt2">Descripción · hasta 300</span><span class="sels">{chips_d}{agregar_wa("Descripción", descripcion, abierto == "Descripción", ro, columnas)}</span></div>'
            f"{ej}{aviso}</div></div>")


ESTADOS = ["Campos", "Un campo recién agregado", "Cambiar el tipo con errores", "Una opción en uso", "En WhatsApp", "Elegir qué muestra", "Columnas", "Nuevo catálogo", "Guardado",
           "Valor de una opción dada de baja", "Solo lectura", "Un título que no entra"]
EJEMPLO = (K.PROVEEDORES[0][0], f'{K.PROVEEDORES[0][2].replace("CUIT ", "")} · {ZONAS_EJ[0]}')
ALTO = 1510


def editor():
    tit = "Proveedores"
    items = [(n, f'{d.replace("CUIT ", "")} · {ZONAS_EJ[k % len(ZONAS_EJ)]}') for k, (n, _c, d, a) in enumerate(K.PROVEEDORES[:6]) if a]
    cat = K.caja_catalogo("Proveedores", "A quiénes se les compra.")
    # Con «Detalle» en el título, las opciones se ven así: la que no entra, en rojo y entera, como en la maqueta (CatalogPreviewPhone)
    largos = [(f'<span class="k-largo">{LARGO}</span>' if k == 1 else RUBROS[k], f'{d.replace("CUIT ", "")} · {ZONAS_EJ[k % len(ZONAS_EJ)]}')
              for k, (_n, _c, d, a) in enumerate(K.PROVEEDORES[:6]) if a]
    no_entra = f'<div class="aviso3" role="status"><span>1 opción supera los 30 caracteres del título.</span><ul><li>{LARGO}</li></ul></div>'

    def cuerpo(modo, catalogo=cat, it=items, abierto=""):
        nuevo = modo == "vacia"
        valores = (K.caja_opciones("", "0 opciones", "", modo="nuevo", vacia=True, boton_campos=boton_campos(0)) if nuevo else caja_valores(modo))
        titulo = ["Detalle"] if modo == "titulo" else None
        ejemplo = None if nuevo else (RUBROS[0], EJEMPLO[1]) if modo == "titulo" else EJEMPLO
        wa = caja_whatsapp(abierto, ro=modo == "lectura", titulo_wa=titulo, descripcion=["Detalle"] if nuevo else None, ejemplo=ejemplo, aviso=no_entra if modo == "titulo" else "")
        return K.cuerpo_editor(valores, catalogo, it, "Proveedor", debajo=wa)
    b = lambda **k: C.banda_k(tit, K.ACTIVO, K.acc_editor(**k))
    V = {
        "Campos": (b(), cuerpo("normal")),
        "Un campo recién agregado": (b(cambios=True), cuerpo("agregar")),
        "Cambiar el tipo con errores": (b(cambios=True), cuerpo("error")),
        "Una opción en uso": (b(cambios=True), cuerpo("uso")),
        "En WhatsApp": (b(), cuerpo("normal")),
        "Elegir qué muestra": (b(cambios=True), cuerpo("normal", abierto="Descripción")),
        "Columnas": (b(), cuerpo("columnas")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", "", K.acc_editor(nuevo=True)), cuerpo("vacia", K.caja_catalogo("", ""), [])),
        "Guardado": (b(), cuerpo("normal")),
        "Valor de una opción dada de baja": (b(cambios=True), cuerpo("baja")),
        "Solo lectura": (C.banda_k(tit, K.ACTIVO, K.acc_editor(lectura=True)),
                         cuerpo("lectura", K.caja_catalogo("Proveedores", "A quiénes se les compra.", lectura=True))),
        "Un título que no entra": (b(cambios=True), cuerpo("titulo", it=largos)),
    }
    assert list(V) == ESTADOS
    capas = {
        "Un campo recién agregado": A.toast("Guardá el catálogo para cargar los valores de los campos nuevos.", "mal"),
        "Guardado": A.toast("Guardamos el catálogo."),
    }
    js = A.js_estados(ESTADOS, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: ![4, 5, 11].includes(k), pvAbierto: [4, 5, 11].includes(k), pvMuchas: false, pvUna: 'on', pvVarias: '', "
                                      "busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Campos de un catálogo · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Proveedores",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + CSS, ESTADOS, js, alto=ALTO)
    t = t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over)


# ================================================================ FRM-Catalogo-Campos: el modal (125)
ESTADOS_CAMPOS = ["Los campos", "Un campo de un catálogo", "Elegir el catálogo", "Buscar un catálogo", "Ningún catálogo coincide", "Agregar un campo", "Elegir el tipo", "Un número", "Clave repetida",
                  "Quitar un campo", "Quitar un campo con valores", "20 campos", "Sin campos todavía", "Solo lectura"]
CAMPO_NUEVO = ("Plazo de pago", "Número entero", False, False, ("0", "365"), "plazo_de_pago")
AYUDA_QUITAR = "Se quita de la tabla, de la plantilla y del Excel."
EN_WA = "También se saca de «En WhatsApp» de este catálogo."


def lista_campos(sel=0, nuevo=None, mal=0, lectura=False, papeles=None):
    papeles = papeles or {}
    h = "".join(item_campo(k, c, len(CAMPOS), sel=k == sel, lectura=lectura, papel=papeles.get(c[0]), mal=k == mal) for k, c in enumerate(CAMPOS, 1))
    if nuevo is not None:
        h += K.md_item("—", nuevo, "Texto", on=True, nueva="Nuevo")
    return h


def fondo_catalogo():
    """Lo que queda detrás de un modal: la página del catálogo, sin cambios."""
    items = [(n, f'{d.replace("CUIT ", "")} · {ZONAS_EJ[k % len(ZONAS_EJ)]}') for k, (n, _c, d, a) in enumerate(K.PROVEEDORES[:6]) if a]
    wa = caja_whatsapp(ejemplo=EJEMPLO)
    return C.banda_k("Proveedores", K.ACTIVO, K.acc_editor(cambios=True)), K.cuerpo_editor(caja_valores("normal"), K.caja_catalogo("Proveedores", "A quiénes se les compra."), items, "Proveedor", debajo=wa)


def campos_modal():
    z, c1 = CAMPOS[1], CAMPOS[0]
    p1 = panel_campo("Campo 1 de 2", *c1)
    pz = lambda combo="": panel_campo("Campo 2 de 2", *z, combo=combo)
    vacio = panel_campo("Nuevo campo", "", "Texto", False, False, ("", "caracteres"), "", nuevo=True, foco=True)
    capas = {
        "Los campos": dlg_campos(lista_campos(1), p1, "2 de 20"),
        "Un campo de un catálogo": dlg_campos(lista_campos(2), pz(), "2 de 20"),
        "Elegir el catálogo": dlg_campos(lista_campos(2), pz("abierto"), "2 de 20"),
        "Buscar un catálogo": dlg_campos(lista_campos(2), pz("buscar"), "2 de 20"),
        "Ningún catálogo coincide": dlg_campos(lista_campos(2), pz("nada"), "2 de 20"),
        "Agregar un campo": dlg_campos(lista_campos(0, "Plazo de pago"), panel_campo("Nuevo campo", "Plazo de pago", "Texto", False, False, ("", "caracteres"), "plazo_de_pago", nuevo=True, foco=True), "3 de 20"),
        "Elegir el tipo": dlg_campos(lista_campos(0, "Plazo de pago"), panel_campo("Nuevo campo", "Plazo de pago", "Texto", False, False, None, "plazo_de_pago", nuevo=True, abierto=True), "3 de 20"),
        "Un número": dlg_campos(lista_campos(0, "Plazo de pago").replace("<small>Texto</small></span></div>", "<small>Número entero</small></span></div>"),
                                panel_campo("Nuevo campo", *CAMPO_NUEVO, nuevo=True), "3 de 20"),
        "Clave repetida": dlg_campos(lista_campos(0, "Cuit", mal=0), panel_campo("Nuevo campo", "Cuit", "Texto", False, False, ("", "caracteres"), "cuit", nuevo=True, err_clave="Ya la usa «CUIT»."), "3 de 20"),
        "Quitar un campo": A.confirmar("Quitar «Zona»", f"{AYUDA_QUITAR} {EN_WA}", "Quitar el campo"),
        "Quitar un campo con valores": F.dialogo("Quitar «CUIT»", f'<p class="d-tx">{AYUDA_QUITAR}</p><div class="md-conf"><span class="k-chk" role="checkbox" aria-checked="false"></span><span>Sí, quitar el campo y sus 1.097 valores</span></div>',
                                                 '<button type="button" class="cb cb-sec">Cerrar</button>' + K.tip('<button type="button" class="cb cb-pel lleno">Quitar el campo</button>', "Marcá la confirmación para quitarlo.")),
        "20 campos": dlg_campos(lista_campos(1), p1, "20 de 20", tope=True),
        "Sin campos todavía": dlg_campos(K.md_item("—", "", "Texto", on=True, nueva="Nuevo"), vacio, "1 de 20"),
        "Solo lectura": dlg_campos(lista_campos(1, lectura=True), panel_lectura("Campo 1 de 2", *c1), "", lectura=True),
    }
    assert list(capas) == ESTADOS_CAMPOS
    b, c = fondo_catalogo()
    js = A.js_estados(ESTADOS_CAMPOS, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Los campos de un catálogo · modal", "Inicio / Formularios / Catálogos / Proveedores", b, c,
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + CSS, ESTADOS_CAMPOS, js, alto=1200)
    t = t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_CAMPOS.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA + K.CSS_OPCIONES + CSS_CAMPOS)


ESTADOS_T = ["Campos", "Elegir qué muestra", "Un título que no entra", "Un título que no entra: cómo se ve"]
CSS_TWA = """.k-wa-t { display: flex; flex-direction: column; gap: 8px; }
.k-wa-t .chips { display: flex; flex-wrap: wrap; gap: 8px; }
.k-chip3 { display: inline-flex; align-items: center; gap: 2px; height: 34px; padding: 0 2px 0 10px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 14px; }
.k-chip3 .ap-ib { width: 30px; height: 30px; color: var(--t3); }
.k-chip3 .ap-ib[aria-disabled="true"] { color: var(--borde2); }
.k-ej3 { display: flex; flex-direction: column; gap: 2px; padding: 12px; border: 1px solid var(--borde); border-radius: 10px; font-size: 15px; background: #fff; }
.k-ej3 small { font-size: 13px; color: var(--t3); }
.k-ops-b { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 10px; }
.q-row.mal .tx > span:last-child { color: var(--peligro); }
.k-prev .li .k-largo { color: var(--peligro); }
"""
X20 = F.svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 18)
DESTINO_T = "M-FRM-Catalogo-Campos.dc.html"


def tel_wa(titulo, descripcion, ejemplo):
    """«En WhatsApp» en el teléfono: un chip por dato y «Agregar campo», como en la compu."""
    def parte(rotulo, vs):
        solo = rotulo.startswith("Título") and len(vs) == 1
        chips = "".join(f'<span class="k-chip3">{v}<button type="button" class="ap-ib" aria-label="Quitar {v}"{" aria-disabled=" + chr(34) + "true" + chr(34) if solo else ""}>{X20}</button></span>' for v in vs)
        return (f'<div class="ap-cmp"><span class="rt"><span>{rotulo}</span></span><div class="k-wa-t"><div class="chips">{chips}</div>'
                f'<div class="ct sel">Agregar campo{EU.CHEV_CAMPO}</div></div></div>')
    ej = f'<div class="ap-cmp"><span class="rt"><span>Por ejemplo</span></span><div class="k-ej3">{ejemplo[0]}<small>{ejemplo[1]}</small></div></div>'
    return '<div class="ap-gtit">En WhatsApp</div><div class="f-campos">' + parte("Título · hasta 30 caracteres", titulo) + parte("Descripción · hasta 300", descripcion) + ej + "</div>"


def tel_editor():
    der = (f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{F.OJO}</button>'
           f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>')
    ops = K.PROVEEDORES[:6]
    filas = "".join(K.q_opcion(k, n, cod, RUBROS[k - 1], a, 10) for k, (n, cod, _d, a) in enumerate(ops, 1))
    # Un título que no entra: la pantalla ya bajada hasta Opciones, con la opción marcada en su lugar, como en M-FRM-Editor
    marcadas = "".join(K.q_opcion(k, n, cod, RUBROS[k - 1], a, 10, abajo=MAL_TITULO if k == 2 else "").replace('class="q-row"', 'class="q-row mal"' if k == 2 else 'class="q-row"', 1)
                       for k, (n, cod, _d, a) in enumerate(ops, 1))
    botones = f'<div class="k-ops-b"><a class="cb cb-sec" href="#">Agregar opción</a><a class="cb cb-sec" href="{DESTINO_T}">Agregar campos<span class="k-cont">2</span></a></div>'
    opciones = lambda h: f'<div class="ap-gtit">Opciones</div>{botones}<div class="ap-grupo">{h}</div><div style="height: 20px;"></div>'
    bajada = C.t_bar("Proveedores", "Activo", derecha=der) + '<div class="ap-cuerpo">' + opciones(marcadas) + "</div>"
    cuerpo = (C.t_bar("Proveedores", "Activo", derecha=der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">'
              + K.tel_de() + F.tcampo("Nombre", "Proveedores", req=True) + F.tcampo("Descripción", "A quiénes se les compra.") + "</div>"
              + tel_wa(TITULO_WA, DESCRIPCION_WA, EJEMPLO) + opciones(filas) + "</div>")
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    Cu = {"Campos": cuerpo, "Elegir qué muestra": cuerpo + fijo, "Un título que no entra": bajada + fijo, "Un título que no entra: cómo se ve": bajada + fijo}
    vista = ('<div class="ap-grupo k-prev" style="margin: 0;">' + "".join(
        f'<div class="li">{f"""<span class="k-largo">{LARGO}</span>""" if k == 1 else RUBROS[k]}<small>{d.replace("CUIT ", "")} · {ZONAS_EJ[k % len(ZONAS_EJ)]}</small></div>'
        for k, (_n, _c, d, _a) in enumerate(K.PROVEEDORES[:4])) + "</div>")
    capas = {
        "Elegir qué muestra": F.thoja("Descripción", "".join(f'<span class="t-opc">{c}<span class="d"></span></span>' for c in COLUMNAS if c not in DESCRIPCION_WA), "").replace('<div class="hb">', '<div class="hb lst">', 1),
        "Un título que no entra: cómo se ve": F.thoja("Así lo ve quien lo recibe", vista, ""),
    }
    return C.tel_pagina(Cu, ESTADOS_T, capas, "Campos de un catálogo · teléfono", F.CSS_TFILTRO + K.CSS_T12 + CSS_TWA)


# ================================================================ M-FRM-Catalogo-Campos: el modal ocupa la pantalla
ESTADOS_TC = ["La lista", "Un campo", "Un campo de un catálogo", "Elegir el catálogo", "Un campo nuevo", "Elegir el tipo", "Quitar un campo"]
CSS_TC = """.q-row .q-fle { display: inline-flex; flex: none; margin-right: -6px; }
.t-reg { display: flex; flex-wrap: wrap; gap: 8px 20px; }
.t-cand { display: inline-flex; align-items: center; gap: 6px; }
.t-cand svg { width: 16px; height: 16px; flex: none; }
.ap-cuerpo > .f-campos:first-child { margin-top: 14px; }
.t-quitar { align-self: flex-start; padding: 4px 0; font-size: 15px; font-weight: 600; color: var(--peligro); text-decoration: none; }
"""


def tel_campos(catalogo="Proveedores", campos=None, volver="M-FRM-Catalogo-13.dc.html", papeles=None, destino="M-FRM-Catalogo-Campos.dc.html"):
    """Primero la lista y, al tocar un campo, el campo, con «Volver a la lista». «Cancelar» y «Listo» van en la lista, como en el modal de opciones."""
    campos = campos or CAMPOS
    papeles = papeles or {}
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Cancelar</button><button type="button" class="cb cb-pri full">Listo</button></div>'
    tilde = F.svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")
    c_tel = lambda on, txt: f'<span class="t-chk"><i class="{"on" if on else "no"}">{tilde if on else ""}</i>{txt}</span>'

    def lista():
        filas = "".join(f'<div class="q-row"><span class="num">{k}</span><span class="tx"><b>{c[0]}</b><span>{c[1]}{" · " + papeles[c[0]] if c[0] in papeles else ""}</span></span></div>' for k, c in enumerate(campos, 1))
        return (C.t_bar("Campos", f"{catalogo} · {len(campos)} de 20", volver) + '<div class="ap-cuerpo"><div class="ap-gtit">Campos<a href="#">Agregar campo</a></div>'
                f'<div class="ap-grupo">{filas}</div><div style="height: 20px;"></div></div>' + fijo)

    def form(pos, n, tipo, ob, un, lim, clave, nuevo=False):
        det = ""
        if tipo == "De un catálogo":
            det = F.tcampo("Catálogo", lim, req=True, select=True)
        elif tipo == "Texto":
            det = F.tcampo("Largo", f"Hasta {lim[0]} {lim[1]}" if lim and lim[0] else "Hasta N caracteres", vacio=not (lim and lim[0]))
        llave = F.tcampo("Clave", clave or "clave", req=True, vacio=not clave) if nuevo else K.tel_ro("Clave", f'<span class="t-cand">{CANDADO}{clave}</span>')
        papel = F.tcampo("Papel", papeles[n], select=True) if n in papeles else ""
        cuerpo = (F.tcampo("Nombre", n or "Nombre del campo", req=True, vacio=not n) + llave + F.tcampo("Tipo", tipo, req=True, select=True) + det
                  + f'<div class="t-reg">{c_tel(ob, "Obligatorio")}{c_tel(un, "Único")}</div>{papel}<a class="t-quitar" href="#">Quitar campo</a>')
        return (C.t_bar(pos, catalogo, destino).replace('aria-label="Volver"', 'aria-label="Volver a la lista"', 1)
                + f'<div class="ap-cuerpo"><div class="f-campos">{cuerpo}</div><div style="height: 20px;"></div></div>')
    uno = form(f"Campo 1 de {len(campos)}", *campos[0])
    otro = form(f"Campo 2 de {len(campos)}", *campos[1])
    nuevo = form("Nuevo campo", "", "Texto", False, False, None, "", nuevo=True)
    tipos = "".join(f'<span class="t-opc {"on" if k == 0 else ""}">{x}<span class="d">{K.TILDE18 if k == 0 else ""}</span></span>' for k, x in enumerate(TIPOS))
    cats = "".join(f'<span class="t-opc {"on" if x.startswith("Zonas") else ""}">{x}<span class="d">{K.TILDE18 if x.startswith("Zonas") else ""}</span></span>' for x in CATALOGOS)
    Cu = {"La lista": lista(), "Un campo": uno, "Un campo de un catálogo": otro, "Elegir el catálogo": otro, "Un campo nuevo": nuevo, "Elegir el tipo": nuevo, "Quitar un campo": otro}
    capas = {
        "Elegir el catálogo": F.thoja("Catálogo", cats, "").replace('<div class="hb">', '<div class="hb lst">', 1),
        "Elegir el tipo": F.thoja("Tipo", tipos, "").replace('<div class="hb">', '<div class="hb lst">', 1),
        "Quitar un campo": F.thoja("Quitar «Zona»", f'<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">{AYUDA_QUITAR} {EN_WA}</p>',
                                   '<button type="button" class="cb cb-pel lleno">Quitar el campo</button><button type="button" class="cb cb-sec">Cancelar</button>'),
    }
    return C.tel_pagina(Cu, ESTADOS_TC, capas, "Los campos de un catálogo · teléfono", E.CSS_E12 + F.CSS_TFILTRO + K.CSS_T12 + K.CSS_TO + CSS_TC)


# ================================================================ El modal de opciones de la 12, con una fila por campo
ESTADOS_OPCIONES = ["Editar una opción", "Agregar una opción", "Un campo nuevo", "Un valor de una opción dada de baja"]


def campos_opcion(cuit="", zona="", nuevo=False, ayuda_baja=False):
    zona_c = K.entrada(zona, ph="Elegí una zona") if not ayuda_baja else f'<span class="k-in sel"><span>{ZONA_BAJA}</span>{CHEV}</span>'
    h = K.md_fila("CUIT", K.entrada(cuit, mono=True, ph="CUIT"), req=True) + K.md_fila("Zona", zona_c if ayuda_baja else f'<span class="k-in sel{"" if zona else " ph"}"><span>{zona or "Elegí una zona"}</span>{CHEV}</span>', req=True)
    if nuevo:
        h += K.md_fila("Plazo de pago", f'<span class="k-in off" aria-disabled="true" title="{MOTIVO_GUARDAR}"><span></span></span>')
    return h


def opciones_modal():
    tit = "Proveedores"
    nuevas, todas = K.TITULO_NUEVAS.format(tit), K.TITULO_OPCIONES.format(tit)
    uno = K.md_item("—", "", "Sin código", on=True, nueva="Nueva")
    prov = K.PROVEEDORES[:5]

    def lista(sel):
        return "".join(K.md_item(k, n, cod, on=k == sel, baja=not a) for k, (n, cod, _d, a) in enumerate(prov, 1))
    n2, c2, d2, _a = prov[1]
    cuit = d2.replace("CUIT ", "")
    capas = {
        "Editar una opción": K.dlg_opciones(todas, lista(2), K.md_opcion("Opción 2 de 5", n2, c2, RUBROS[1], estado="Activa", campos=campos_opcion(cuit, ZONAS_EJ[1])), "1–5 de 1.097"),
        "Agregar una opción": K.dlg_opciones(nuevas, uno, K.md_opcion("Nueva opción", campos=campos_opcion()), "1", "Opciones nuevas"),
        "Un campo nuevo": K.dlg_opciones(todas, lista(2), K.md_opcion("Opción 2 de 5", n2, c2, RUBROS[1], estado="Activa", campos=campos_opcion(cuit, ZONAS_EJ[1], nuevo=True)), "1–5 de 1.097"),
        "Un valor de una opción dada de baja": K.dlg_opciones(todas, lista(2), K.md_opcion("Opción 2 de 5", n2, c2, RUBROS[1], estado="Activa", campos=campos_opcion(cuit, ayuda_baja=True)), "1–5 de 1.097"),
    }
    assert list(capas) == ESTADOS_OPCIONES
    fondo = fondo_catalogo()
    js = A.js_estados(ESTADOS_OPCIONES, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Las opciones de un catálogo, con sus campos · modal", "Inicio / Formularios / Catálogos / Proveedores", fondo[0], fondo[1],
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + CSS, ESTADOS_OPCIONES, js, alto=1200)
    t = t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_OPCIONES.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, F.CSS_GRILLA + K.CSS_OPCIONES)


def tel_opciones():
    ops = [(n, cod, RUBROS[k], a) for k, (n, cod, _d, a) in enumerate(K.PROVEEDORES[:5])]
    nueva = F.tcampo("CUIT", "CUIT", req=True, vacio=True) + F.tcampo("Zona", "Elegí una zona", req=True, select=True, vacio=True)
    guardada = F.tcampo("CUIT", K.PROVEEDORES[1][2].replace("CUIT ", ""), req=True) + F.tcampo("Zona", ZONAS_EJ[1], req=True, select=True)
    return K.tel_opciones("Proveedores", ops, nueva, guardada, "M-FRM-Catalogo-13.dc.html", "M-FRM-Catalogo-Opciones-13.dc.html")


NUEVOS = {"FRM-Catalogo-13": (1280, ALTO, "Formularios · catálogo escrito a mano · campos · a 1280 · etapa 13"),
          "M-FRM-Catalogo-13": (390, 844, "Catálogo escrito a mano · campos · teléfono · etapa 13"),
          "FRM-Catalogo-Campos": (1280, 1200, "Formularios · los campos de un catálogo · a 1280 · etapa 13"),
          "M-FRM-Catalogo-Campos": (390, 844, "Los campos de un catálogo · teléfono · etapa 13"),
          "FRM-Catalogo-Opciones-13": (1280, 1200, "Formularios · las opciones, con sus campos · a 1280 · etapa 13"),
          "M-FRM-Catalogo-Opciones-13": (390, 844, "Las opciones, con sus campos · teléfono · etapa 13")}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (w, h, titulo) in NUEVOS.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo + ("" if APROBADO else PARA_APROBAR))
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    for n, t in (("FRM-Catalogo-13", editor()), ("M-FRM-Catalogo-13", tel_editor()), ("FRM-Catalogo-Campos", campos_modal()), ("M-FRM-Catalogo-Campos", tel_campos()),
                 ("FRM-Catalogo-Opciones-13", opciones_modal()), ("M-FRM-Catalogo-Opciones-13", tel_opciones())):
        (PROJ / f"{n}.dc.html").write_text(L.sin_disenar(n, E.post(n, t)), encoding="utf-8")
    registrar()
    print("listo", list(NUEVOS))
