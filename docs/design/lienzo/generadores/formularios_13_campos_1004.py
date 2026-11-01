"""Etapa 13 · Campos de los catálogos, CE1: definir los campos de un catálogo escrito a mano (`13-campos.md` del back y la forma «B»
que eligió el usuario el 25/10, por la Guía).

Una tabla de campos que se edita ahí mismo, sin el diálogo «Nuevo campo»: Campo, Tipo, Obligatorio, Único, Límite y ⋮. El tipo
va en un solo desplegable, que incluye «De un catálogo: Zonas»; «Agregar campo» suma una fila; sin «Clave» ni «Dato / Filtro».
Hasta 20 campos (42). En el teléfono, una fila por campo que se edita en una hoja. Los valores de cada opción van en una columna por
campo (CE2), y «En WhatsApp» (CE3), con desplegables por renglón (la opción C del usuario, 26/10).

- FRM-Catalogo-13: el catálogo «Proveedores» con CUIT y Zona (de «Zonas»), y la tabla de opciones con una columna por campo (CE2); la
  versión de la 13 de FRM-Catalogo. Se dibuja a 1280 con el panel abierto: las dos tablas se desplazan a lo ancho, con «Campo», o la
  casilla, el número y «Texto», fijos a la izquierda y el ⋮ fijo a la derecha (maqueta a1303a5 y af5eceb, por la Guía, 25/10).
- M-FRM-Catalogo-13: su teléfono.

Desde la v147 (13-texto-diseno.md), tres estados más, que la spec pide:
- un valor de una opción dada de baja: se ve con su texto, en la lista dice «De baja» y se puede guardar;
- solo `formcatalogs.read`: los mismos controles grisados y la tabla de lectura, sin el ⋮ ni «Agregar»;
- un título que no entra: en la opción y en el teléfono, en rojo, y se puede guardar. En el teléfono, en la lista de opciones y en la
  hoja del ojo.
Sus piezas tienen parámetros porque `FRM-Catalogo-14` (formularios_14_formularios_1004.py) las usa con «Productos».

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

# (campo, tipo, obligatorio, único, límite)
CAMPOS = [("CUIT", "Texto", True, True, ("13", "caracteres")), ("Zona", "De un catálogo: Zonas", True, False, None)]
ZONA_BAJA = "Cuyo"
LARGO = "Aceros y perfiles laminados para estructuras"  # como Detalle, en el título de WhatsApp no entran sus 44 caracteres
MAL_TITULO = "No entra en el título de WhatsApp."
RUBROS = ["Abrasivos", "Aceros", "Aislantes", "Alambres", "Aluminio", "Andamios", "Áridos", "Bulones", "Sanitarios", "Cemento"]
ZONAS_EJ = ["Capital", "Gran Buenos Aires", "Interior", "Patagonia", "Litoral"]
MOTIVO_GUARDAR = "Guardá el catálogo para cargar los valores de este campo."
ANCHO_CAMPOS, ANCHO_OPCIONES, ANCHO_LECTURA = 876, 1044, 960
TIPOS = ["Texto", "Número entero", "Número con decimales", "Fecha", "Sí/No", "De un catálogo: Motivos de visita", "De un catálogo: Recargo por zona",
         "De un catálogo: Zonas"]
CSS = """.w-app { width: 1280px !important; }
.w-th.kc, .w-tr.kc { grid-template-columns: minmax(160px, 1.1fr) minmax(200px, 1.35fr) 104px 72px minmax(220px, 1fr) 36px; gap: 12px; }
.w-th.kf, .w-tr.kf { grid-template-columns: 28px 30px minmax(192px, 1.25fr) 96px minmax(192px, 1.35fr) 128px 128px 110px 36px; gap: 10px; }
.w-th.kf3, .w-tr.kf3 { grid-template-columns: 28px 30px minmax(192px, 1.25fr) 96px minmax(192px, 1.35fr) 128px 128px 128px 110px 36px; gap: 10px; }
.w-tr.kf, .w-tr.kf3 { position: relative; min-height: 50px; }
.k-in.off { background: var(--s2); border-color: var(--borde); }
.w-th .k-gr { color: var(--t3); }
.w-th .e-tipw .e-tip { top: calc(100% + 8px); left: auto; right: 0; white-space: nowrap; }
/* Dibujada corrida hasta el final, como si se hubiera desplazado: lo que no es fijo pasa por debajo de lo fijo */
.k-desp.corrida .w-th > :not(.fx), .k-desp.corrida .w-tr > :not(.fx) { transform: translateX(-418px); }
.w-tr.kc { position: relative; min-height: 52px; }
.w-tr.kc > .k-tab { overflow: visible; }
.w-body .w-caja:has(.f-mn) .w-tr.kc { overflow: visible; }
.w-tr.kc .k-in.sel { justify-content: space-between; }
.w-tr.kc .k-chk { margin-left: 2px; }
.kc-lim { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--t2); }
.kc-lim .k-in { width: 64px; flex: none; }
.kc-lim .gris { color: var(--t3); }
.k-wa { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 12px 16px; align-items: center; padding: 16px; }
.k-wa .rt2 { font-size: 13px; font-weight: 600; color: var(--t2); }
.k-wa .sels { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.k-wa .sel2 { position: relative; display: inline-flex; align-items: center; gap: 2px; }
.k-wa .sel2 > .k-in { width: 200px; justify-content: space-between; cursor: pointer; }
.k-wa .sel2 .f-mn { top: 36px; left: 0; width: 200px; }
.k-wa .ib.o-borde { width: 32px; height: 32px; border: 1px solid var(--borde2); border-radius: 8px; box-sizing: border-box; background: #fff; }
.k-tab { display: flex; flex-direction: column; gap: 3px; min-width: 0; position: relative; }
.k-tab .f-mn { top: 36px; left: 0; width: 280px; }
.w-body .w-caja:has(.f-mn) { overflow: visible; }
.k-vacio3 { padding: 28px 16px; text-align: center; font-size: 14px; color: var(--t2); }
.w-tr .f-menu { position: absolute; right: 12px; top: calc(100% - 6px); z-index: 20; min-width: 190px; }
.f-cab .der .e-tipw .e-tip { top: calc(100% + 8px); right: 0; }
/* Solo lectura: los mismos controles, grisados (Criterio · Formularios), sin el ⋮ */
.k-in.ro { background: var(--s2); border-color: var(--borde); color: var(--t3); }
.k-chk.ro { background: var(--s2); border-color: var(--borde2); }
.k-chk.ro.on { background: var(--t3); border-color: var(--t3); }
.k-wa .k-in.ro { cursor: default; }
.w-th.kcl, .w-tr.kcl { grid-template-columns: 150px 190px 96px 64px 180px; gap: 12px; }
.w-tr.kcl { position: relative; min-height: 52px; }
.w-th.kl2, .w-tr.kl2 { grid-template-columns: 30px minmax(192px, 1.2fr) 96px minmax(192px, 1.4fr) 128px 128px 110px; gap: 10px; }
.w-tr.kl2 { position: relative; min-height: 50px; }
/* Corrida hasta la última columna, sin el campo nuevo: se ve «Zona» */
.k-desp.corrida2 .w-th > :not(.fx), .k-desp.corrida2 .w-tr > :not(.fx) { transform: translateX(-280px); }
.k-desp.corrida3 .w-th > :not(.fx), .k-desp.corrida3 .w-tr > :not(.fx) { transform: translateX(-194px); }
.w-tr:has(.f-mn) { z-index: 8; }
.w-tr.kf > .k-tab:has(.f-mn) { overflow: visible; }
.k-tab .f-mn > span .baja2 { margin-left: auto; padding-left: 12px; font-size: 12px; font-weight: 400; color: var(--t3); }
/* El título que no entra, en rojo en el teléfono de al lado */
.tel .k-li .t .k-largo { color: var(--peligro); }
"""


def chk(on, ro=False):
    apagado = ' aria-disabled="true"' if ro else ""
    return (f'<span><span class="k-chk{" on" if on else ""}{" ro" if ro else ""}" role="checkbox" aria-checked="{"true" if on else "false"}"{apagado}>'
            f'{TILDE if on else ""}</span></span>')


def gris(valor, sel=False):
    """El mismo control, grisado: lo que no se edita nunca es un rótulo y un texto sueltos."""
    return f'<span class="k-in{" sel" if sel else ""} ro" aria-disabled="true"><span>{valor}</span>{CHEV if sel else ""}</span>'


def limite(tipo, lim, mal=False, ro=False):
    if tipo.startswith("De un catálogo") or tipo in ("Sí/No", "Fecha") or lim is None:
        return '<span class="kc-lim"><span class="gris">—</span></span>'
    if tipo == "Texto":
        return f'<span class="kc-lim">hasta {gris(lim[0]) if ro else K.entrada(lim[0], ph="N")} {lim[1]}</span>'
    if ro:
        return f'<span class="kc-lim">{gris(lim[0] or "Mínimo")} {gris(lim[1] or "Máximo")}</span>'
    return f'<span class="kc-lim">{K.entrada(lim[0], ph="Mínimo")} {K.entrada(lim[1], ph="Máximo")}</span>'


def menu_campo(n, en_uso=""):
    """El ⋮ de un campo. En uso, «Quitar» queda grisado con el motivo en su tooltip (43 y T22 de la 14)."""
    quitar = f'<span class="f-mi pel" role="menuitem">{F.QUITAR} Quitar</span>'
    if en_uso:
        quitar = (f'<span class="f-mi off" role="menuitem" aria-disabled="true" title="{en_uso}">{F.QUITAR} Quitar'
                  f'<span class="e-tip" role="tooltip">{en_uso}</span></span>')
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de {n}"><span class="f-mi" role="menuitem">{F.ARRIBA} Subir</span>'
            f'<span class="f-mi" role="menuitem">{F.ABAJO} Bajar</span><span class="f-sep" role="separator"></span>{quitar}</div>')


def fila(n, tipo, ob, un, lim, foco=None, menu=False, abierto=False, err="", en_uso=""):
    nombre = K.entrada(n, ph="Nombre del campo", foco=foco == "campo")
    t = f'<span class="k-in sel{" foco" if abierto else ""}{" mal" if err else ""}"><span>{tipo}</span>{CHEV}</span>'
    if abierto:
        t += ('<span class="f-mn" role="listbox" aria-label="Tipo">' + "".join(f'<span role="option" class="{"on" if x == tipo else ""}">{x}</span>' for x in TIPOS) + "</span>")
    if err:
        t += f'<span class="err2" role="alert">{err}</span>'
    m = menu_campo(n, en_uso) if menu else ""
    return (f'<div class="w-tr kc"><span class="k-tab fx fx-campo">{nombre}</span><span class="k-tab">{t}</span>{chk(ob)}{chk(un)}{limite(tipo, lim)}'
            f'<span class="fx fx-d2"><button type="button" class="ib" aria-label="Acciones de {n or "el campo nuevo"}">{KEBAB}</button>{m}</span></div>')


def fila_lectura(n, tipo, ob, un, lim):
    return (f'<div class="w-tr kcl"><span class="k-tab">{gris(n)}</span><span class="k-tab">{gris(tipo, sel=True)}</span>{chk(ob, ro=True)}{chk(un, ro=True)}'
            f"{limite(tipo, lim, ro=True)}</div>")


def caja_campos(modo="normal", campos=None, fila_menu=1, en_uso=""):
    campos = CAMPOS if campos is None else campos
    if modo == "lectura":
        th = '<div class="w-th kcl"><span>Campo</span><span>Tipo</span><span>Obligatorio</span><span>Único</span><span>Límite</span></div>'
        cuerpo = '<div class="k-desp"><div class="k-tabla">' + th + "".join(fila_lectura(*c) for c in campos) + "</div></div>"
        return f'<div class="w-caja"><div class="f-cab"><span>Campos</span></div>{cuerpo}</div>'
    filas = ""
    for k, (n, tipo, ob, un, lim) in enumerate(campos):
        kw = {}
        if modo == "menu" and k == fila_menu:
            kw = dict(menu=True, en_uso=en_uso)
        if modo == "error" and k == 0:
            tipo, kw = "Número entero", dict(err="1.097 opciones tienen un valor que no es un número entero.")
        filas += fila(n, tipo, ob, un, lim, **kw)
    agregar = f'<button type="button" class="cb cb-sec">{MAS} Agregar campo</button>'
    if modo in ("agregar", "tipo"):
        filas += fila("Plazo de pago", "Texto", False, False, ("", "caracteres"), foco="campo" if modo == "agregar" else None, abierto=modo == "tipo")
    if modo == "tope":
        filas += '<div class="w-tr kc"><span class="gris">…</span></div>'
        agregar = K.tip(agregar, MOTIVO_TOPE, abierto=True)
    if modo == "vacia":
        cuerpo = '<div class="k-vacio3">Todavía no hay campos.</div>'
    else:
        th = ('<div class="w-th kc"><span class="fx fx-campo">Campo</span><span>Tipo</span><span>Obligatorio</span><span>Único</span><span>Límite</span>'
              '<span class="fx fx-d2"><span class="sr">Acciones</span></span></div>')
        cuerpo = f'<div class="k-desp"><div class="k-tabla" style="min-width: {ANCHO_CAMPOS}px;">{th}{filas}</div></div>'
    return (f'<div class="w-caja"><div class="f-cab"><span>Campos</span><span class="der">{agregar}</span></div>'
            f"{cuerpo}</div>")


def menu_zonas():
    """La fuente de «Zona»: las opciones activas y, entre ellas, la guardada que se dio de baja (FieldValueInput de la maqueta)."""
    activas = "".join(f'<span role="option">{z}</span>' for z in sorted(ZONAS_EJ))
    return (f'<span class="f-mn" role="listbox" aria-label="Zona">{activas}'
            f'<span role="option" class="on" aria-selected="true">{ZONA_BAJA}<span class="baja2">De baja</span></span></span>')


def valores_lectura():
    """Solo `formcatalogs.read`: la tabla de lectura, sin casillas ni ⋮, con una columna por campo."""
    filas = "".join(K.fila_lectura(k, n, cod, RUBROS[k - 1], a, tabla="kl2",
                                   campos=f'<span class="k-lee mono">{det.replace("CUIT ", "")}</span><span class="k-lee">{ZONAS_EJ[(k - 1) % len(ZONAS_EJ)]}</span>')
                    for k, (n, cod, det, a) in enumerate(K.PROVEEDORES, 1))
    pie = '<div class="w-pie"><span>1–10 de 1.097</span><span>10 por página · Página 1 de 110</span></div>'
    caja = K.caja_opciones(filas, "", pie, modo="lectura", tabla="kl2", cab=["#", "Texto", "Código", "Detalle", "CUIT", "Zona", "Estado"], ancho=ANCHO_LECTURA)
    return caja.replace('<div class="k-desp">', '<div class="k-desp corrida3">', 1)  # sin el ⋮ fijo, corrida hasta el final: se ven los campos y el estado


def caja_valores(modo="normal"):
    """La tabla de opciones con una columna por campo (CE2). Con un campo nuevo, su columna queda grisada hasta guardar (43)."""
    if modo == "lectura":
        return valores_lectura()
    nuevo = modo in ("agregar", "tipo")
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
        filas += K.fila_editable(k, n, cod, LARGO if kw else RUBROS[k - 1], a, campos=celdas, tabla="kf3" if nuevo else "kf", **kw)
    gris = f'<span class="k-gr" title="{MOTIVO_GUARDAR}">Plazo de pago</span>'
    if modo == "agregar":
        gris = K.tip(gris, MOTIVO_GUARDAR, abierto=True)
    cab = ["", "#", "Texto", "Código", "Detalle", "CUIT", "Zona"] + ([f"<span>{gris}</span>"] if nuevo else []) + ["Estado", ""]
    pie = '<div class="w-pie"><span>1–10 de 1.097</span><span>10 por página · Página 1 de 110</span></div>'
    caja = K.caja_opciones(filas, "1.097 opciones · 1.090 activas", pie, modo="cambios" if modo in ("agregar", "tipo", "error", "baja", "titulo") else "normal",
                           tabla="kf3" if nuevo else "kf", cab=cab, ancho=ANCHO_OPCIONES + (138 if nuevo else 0))
    # Al agregar un campo, corrida hasta el final: se ve la columna nueva, grisada, con su motivo. Con la opción de baja, hasta «Zona»
    if modo == "baja":
        return caja.replace('<div class="k-desp">', '<div class="k-desp corrida2">', 1)
    return caja.replace('<div class="k-desp">', '<div class="k-desp corrida">', 1) if modo == "agregar" else caja


# ================================================================ En WhatsApp (CE3): la opción C del usuario, 26/10
# Dos renglones, Título y Descripción, con el rótulo a la izquierda y los desplegables a la derecha. El título lleva uno, que arranca en
# «Texto»; la descripción, uno por lugar, con ✕ para quitarlo y un «+» que suma otro. Cada desplegable lista lo que todavía no está en su
# renglón (Texto, Código, el valor, Detalle y los campos) más su propio valor; ninguno va apagado. Sin «Por ejemplo», sin la nota
# «No salen del sistema» y sin los largos: el teléfono de al lado muestra cómo queda. En un catálogo nuevo todavía no va.
COLUMNAS = ["Texto", "Código", "Detalle"] + [c[0] for c in CAMPOS]
TITULO_WA, DESCRIPCION_WA = ["Texto"], ["CUIT", "Zona"]
X = A.X


def opciones_wa(renglon, propio, columnas=None):
    """Lo que puede elegir un desplegable: lo que no está en su renglón, más su propio valor."""
    return [c for c in (COLUMNAS if columnas is None else columnas) if c == propio or c not in renglon]


def desplegable_wa(valor, renglon, abierto=False, quitar=True, ro=False, columnas=None):
    menu = ""
    if abierto:
        menu = ('<span class="f-mn" role="listbox" aria-label="Qué muestra">' + "".join(
            f'<span role="option" class="{"on" if c == valor else ""}">{c}</span>' for c in opciones_wa(renglon, valor, columnas)) + "</span>")
    if ro:
        return f'<span class="sel2">{gris(valor, sel=True)}</span>'
    x = f'<button type="button" class="ib" aria-label="Quitar {valor}">{X}</button>' if quitar else ""
    return (f'<span class="sel2"><span class="k-in sel{" foco" if abierto else ""}" role="combobox" aria-expanded="{"true" if abierto else "false"}">'
            f"<span>{valor}</span>{CHEV}</span>{menu}{x}</span>")


def caja_whatsapp(abierto="", titulo_wa=None, descripcion=None, columnas=None, ro=False):
    tit = (titulo_wa or TITULO_WA)[0]
    descripcion = DESCRIPCION_WA if descripcion is None else descripcion
    titulo = desplegable_wa(tit, [tit], abierto == tit, quitar=False, ro=ro, columnas=columnas)
    desc = "".join(desplegable_wa(v, descripcion, abierto == v, ro=ro, columnas=columnas) for v in descripcion)
    mas = "" if ro else f'<button type="button" class="ib o-borde" aria-label="Agregar un lugar a la descripción">{MAS}</button>'
    return ('<div class="w-caja"><div class="f-cab"><span>En WhatsApp</span></div><div class="k-wa">'
            f'<span class="rt2">Título</span><span class="sels">{titulo}</span>'
            f'<span class="rt2">Descripción</span><span class="sels">{desc}{mas}</span></div></div>')


ESTADOS = ["Campos", "Agregar un campo", "Elegir el tipo", "Acciones de un campo", "Quitar un campo", "Cambiar el tipo con errores", "20 campos",
           "En WhatsApp", "Elegir qué muestra", "Nuevo catálogo", "Guardado", "Valor de una opción dada de baja", "Solo lectura", "Un título que no entra"]


def editor():
    tit = "Proveedores"
    items = [(n, f'{d.replace("CUIT ", "")} · {ZONAS_EJ[k % len(ZONAS_EJ)]}') for k, (n, _c, d, a) in enumerate(K.PROVEEDORES[:6]) if a]
    cat = K.caja_catalogo("Proveedores", "A quiénes se les compra.")
    # Con «Detalle» en el título, las opciones se ven así: la que no entra, en rojo y entera, como en la maqueta (CatalogPreviewPhone)
    largos = [(f'<span class="k-largo">{LARGO}</span>' if k == 1 else RUBROS[k], f'{d.replace("CUIT ", "")} · {ZONAS_EJ[k % len(ZONAS_EJ)]}')
              for k, (_n, _c, d, a) in enumerate(K.PROVEEDORES[:6]) if a]

    def cuerpo(modo, catalogo=cat, it=items, abierto=""):
        valores = (K.caja_opciones("", "0 opciones", "", modo="nuevo", vacia=True) if modo == "vacia" else
                   caja_valores("normal" if modo in ("menu", "tope") else modo))
        wa = ("" if modo == "vacia" else caja_whatsapp(abierto, ro=modo == "lectura", titulo_wa=["Detalle"] if modo == "titulo" else None))
        return f'<div class="w-body"><div class="k-cab2">{catalogo}{K.vista_previa(it, "Proveedor")}</div>{caja_campos(modo)}{wa}{valores}</div>'
    b = lambda **k: C.banda_k(tit, K.ACTIVO + K.ORIGEN_MANO, K.acc_editor(**k))
    V = {
        "Campos": (b(), cuerpo("normal")),
        "Agregar un campo": (b(cambios=True), cuerpo("agregar")),
        "Elegir el tipo": (b(cambios=True), cuerpo("tipo")),
        "Acciones de un campo": (b(), cuerpo("menu")),
        "Quitar un campo": (b(), cuerpo("normal")),
        "Cambiar el tipo con errores": (b(cambios=True), cuerpo("error")),
        "20 campos": (b(), cuerpo("tope")),
        "En WhatsApp": (b(), cuerpo("normal")),
        "Elegir qué muestra": (b(cambios=True), cuerpo("normal", abierto="CUIT")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", K.NUEVO_MANO, K.acc_editor(nuevo=True)), cuerpo("vacia", K.caja_catalogo("", ""), [])),
        "Guardado": (b(), cuerpo("normal")),
        "Valor de una opción dada de baja": (b(cambios=True), cuerpo("baja")),
        "Solo lectura": (C.banda_k(tit, K.ACTIVO + K.ORIGEN_MANO, K.acc_editor(lectura=True)),
                         cuerpo("lectura", K.caja_catalogo("Proveedores", "A quiénes se les compra.", lectura=True))),
        "Un título que no entra": (b(cambios=True), cuerpo("titulo", it=largos)),
    }
    assert list(V) == ESTADOS
    capas = {
        "Quitar un campo": A.confirmar("¿Quitar el campo «Zona»?", "Deja de mostrarse en la tabla.", "Quitar"),
        "Guardado": A.toast("Guardamos el catálogo."),
    }
    js = A.js_estados(ESTADOS, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: ![7, 8, 13].includes(k), pvAbierto: [7, 8, 13].includes(k), "
                                      "busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Campos de un catálogo · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Proveedores",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + CSS, ESTADOS, js, alto=1560)
    t = t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over)


ESTADOS_T = ["Campos", "Editar un campo", "Agregar un campo", "Elegir el tipo", "Acciones de un campo", "Elegir qué muestra", "Un título que no entra",
             "Un título que no entra: cómo se ve"]
CSS_TWA = """.k-wa-t { display: flex; flex-direction: column; gap: 8px; }
.k-wa-f { display: flex; align-items: center; gap: 6px; }
.k-wa-f .ct { flex: 1; }
.k-wa-mas { align-self: flex-start; border: 1px solid var(--borde2) !important; border-radius: 10px; }
.q-row.mal .tx > span:last-child { color: var(--peligro); }
.k-prev .li .k-largo { color: var(--peligro); }
"""


def tel_editor():
    der = (f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{F.OJO}</button>'
           f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>')

    def detalle(tipo, ob, un, lim):
        partes = [tipo] + (["Obligatorio"] if ob else []) + (["Único"] if un else [])
        if lim and tipo == "Texto":
            partes.append(f"hasta {lim[0]} caracteres")
        elif lim:
            partes.append(f"de {lim[0]} a {lim[1]}")
        return " · ".join(partes)
    filas = "".join(f'<div class="q-row"><span class="tx"><b>{n}</b><span>{detalle(tipo, ob, un, lim)}</span></span>'
                    f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>' for n, tipo, ob, un, lim in CAMPOS)
    # Un título que no entra: la pantalla ya bajada hasta Opciones, con la opción marcada en su lugar, como en M-FRM-Editor
    opciones = "".join(f'<div class="q-row{" mal" if k == 2 else ""}"><span class="num">{k}</span><span class="tx"><b>{n}<span class="cod">{cod}</span></b>'
                       f'<span>{MAL_TITULO if k == 2 else RUBROS[k - 1]}</span></span><button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>'
                       for k, (n, cod, _d, _a) in enumerate(K.PROVEEDORES[:6], 1))
    bajada = (C.t_bar("Proveedores", "Activo", derecha=der) + '<div class="ap-cuerpo"><div class="ap-gtit">Opciones<a href="#">Agregar opción</a></div>'
              f'<div class="ap-grupo">{opciones}</div><div style="height: 20px;"></div></div>')
    cuerpo = (C.t_bar("Proveedores", "Activo", derecha=der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">'
              + F.tcampo("Nombre", "Proveedores", req=True) + K.tel_ro("Tipo de valor", "Texto") + F.tcampo("Descripción", "A quiénes se les compra.") + "</div>"
              + f'<div class="ap-gtit">Campos<a href="#">Agregar campo</a></div><div class="ap-grupo">{filas}</div>'
              + '<div class="ap-gtit">En WhatsApp</div><div class="f-campos">' + F.tcampo("Título", "Texto", select=True)
              + '<div class="ap-cmp"><span class="rt"><span>Descripción</span></span><div class="k-wa-t">'
              + "".join(f'<div class="k-wa-f"><div class="ct sel">{v}{EU.CHEV_CAMPO}</div>'
                        f'<button type="button" class="ap-ib" aria-label="Quitar {v}">{F.svg(chr(60) + "path d=" + chr(34) + "M6 6l12 12M18 6 6 18" + chr(34) + "/>", 20)}</button></div>'
                        for v in DESCRIPCION_WA)
              + f'<button type="button" class="ap-ib k-wa-mas" aria-label="Agregar un lugar a la descripción">{F.svg(chr(60) + "path d=" + chr(34) + "M12 5v14M5 12h14" + chr(34) + "/>", 20)}</button>'
              + '</div></div></div><div style="height: 20px;"></div></div>')
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    Cu = {"Campos": cuerpo, "Editar un campo": cuerpo + fijo, "Agregar un campo": cuerpo + fijo, "Elegir el tipo": cuerpo + fijo, "Acciones de un campo": cuerpo,
          "Elegir qué muestra": cuerpo + fijo, "Un título que no entra": bajada + fijo, "Un título que no entra: cómo se ve": bajada + fijo}
    vista = ('<div class="ap-grupo k-prev" style="margin: 0;">' + "".join(
        f'<div class="li">{f"""<span class="k-largo">{LARGO}</span>""" if k == 1 else RUBROS[k]}<small>{d.replace("CUIT ", "")} · {ZONAS_EJ[k % len(ZONAS_EJ)]}</small></div>'
        for k, (_n, _c, d, _a) in enumerate(K.PROVEEDORES[:4])) + "</div>")
    tilde = F.svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")

    def hoja(n="CUIT", tipo="Texto", ob=True, un=True, lim="13"):
        c = lambda on, txt: f'<span class="t-chk"><i class="{"on" if on else "no"}">{tilde if on else ""}</i>{txt}</span>'
        return (F.tcampo("Campo", n or "Nombre del campo", req=True, vacio=not n) + F.tcampo("Tipo", tipo, select=True)
                + c(ob, "Obligatorio") + c(un, "Único") + F.tcampo("Límite", f"hasta {lim} caracteres" if lim else "hasta N caracteres", vacio=not lim))
    pie = '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'
    tipos = "".join(f'<span class="t-opc {"on" if k == 0 else ""}">{x}<span class="d">{K.TILDE18 if k == 0 else ""}</span></span>' for k, x in enumerate(TIPOS))
    capas = {
        "Editar un campo": F.thoja("Editar campo", hoja(), pie),
        "Agregar un campo": F.thoja("Nuevo campo", hoja("", "Texto", False, False, ""), pie),
        "Elegir el tipo": F.thoja("Tipo", tipos, "").replace('<div class="hb">', '<div class="hb lst">', 1),
        "Elegir qué muestra": F.thoja("Descripción", "".join(
            f'<span class="t-opc {"on" if c == "CUIT" else ""}">{c}<span class="d">{K.TILDE18 if c == "CUIT" else ""}</span></span>'
            for c in opciones_wa(DESCRIPCION_WA, "CUIT")), "").replace('<div class="hb">', '<div class="hb lst">', 1),
        "Acciones de un campo": F.thoja("Zona", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span role="menuitem">Subir</span>'
                                        '<span role="menuitem">Bajar</span><span class="pel" role="menuitem">Quitar</span></div>', ""),
        "Un título que no entra: cómo se ve": F.thoja("Así lo ve quien lo recibe", vista, ""),
    }
    return C.tel_pagina(Cu, ESTADOS_T, capas, "Campos de un catálogo · teléfono", F.CSS_TFILTRO + K.CSS_T12 + CSS_TWA)


NUEVOS = {"FRM-Catalogo-13": (1280, 1560, "Formularios · catálogo escrito a mano · campos · a 1280 · etapa 13"),
          "M-FRM-Catalogo-13": (390, 844, "Catálogo escrito a mano · campos · teléfono · etapa 13")}


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (w, h, titulo) in NUEVOS.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo + ("" if APROBADO else PARA_APROBAR))
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    for n, t in (("FRM-Catalogo-13", editor()), ("M-FRM-Catalogo-13", tel_editor())):
        (PROJ / f"{n}.dc.html").write_text(L.sin_disenar(n, E.post(n, t)), encoding="utf-8")
    registrar()
    print("listo", list(NUEVOS))
