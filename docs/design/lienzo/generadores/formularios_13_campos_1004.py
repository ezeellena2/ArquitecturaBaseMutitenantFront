"""Etapa 13 · Campos de los catálogos, CE1: definir los campos de un catálogo escrito a mano (`13-campos.md` del back y la forma «B»
que eligió el usuario el 25/10, por la Guía).

Una tabla de campos que se edita ahí mismo, sin el diálogo «Nuevo campo»: Campo, Tipo, Obligatorio, Único, Límite y ⋮. El tipo
va en un solo desplegable, que incluye «De un catálogo: Zonas»; «Agregar campo» suma una fila; sin «Clave» ni «Dato / Filtro».
Hasta 20 campos (42). En el teléfono, una fila por campo que se edita en una hoja. Los valores de cada opción (CE2) y lo que se
ve en WhatsApp (CE3-B) se dibujan después.

- FRM-Catalogo-13: el catálogo «Proveedores» con CUIT y Zona (de «Zonas»), y la tabla de opciones con una columna por campo (CE2); la
  versión de la 13 de FRM-Catalogo. Se dibuja a 1280 con el panel abierto: las dos tablas se desplazan a lo ancho, con «Campo», o la
  casilla, el número y «Texto», fijos a la izquierda y el ⋮ fijo a la derecha (maqueta a1303a5 y af5eceb, por la Guía, 25/10).
- M-FRM-Catalogo-13: su teléfono.

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

PROJ = A.PROJ
APROBADO = False
PARA_APROBAR = " · para aprobar"
CHEV, MAS, KEBAB, TILDE = F.CHEV, F.MAS, F.KEBAB, A.TILDE
MOTIVO_TOPE = "Llegó a 20 campos, el máximo de un catálogo."

# (campo, tipo, obligatorio, único, límite)
CAMPOS = [("CUIT", "Texto", True, True, ("13", "caracteres")), ("Zona", "De un catálogo: Zonas", True, False, None)]
RUBROS = ["Abrasivos", "Aceros", "Aislantes", "Alambres", "Aluminio", "Andamios", "Áridos", "Bulones", "Sanitarios", "Cemento"]
ZONAS_EJ = ["Capital", "Gran Buenos Aires", "Interior", "Patagonia", "Litoral"]
MOTIVO_GUARDAR = "Guardá el catálogo para cargar los valores de este campo."
ANCHO_CAMPOS, ANCHO_OPCIONES = 876, 1044
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
/* A 1280 la barra de Opciones no entra en un renglón: la cuenta arriba y los botones debajo */
.f-cab:has([aria-label="Más acciones de las opciones"]) { align-items: flex-start; padding-top: 10px; padding-bottom: 10px; }
.f-cab:has([aria-label="Más acciones de las opciones"]) > span:first-child { line-height: 20px; }
.f-cab:has([aria-label="Más acciones de las opciones"]) .der { flex: 1; flex-wrap: wrap; justify-content: flex-end; row-gap: 8px; }
.f-cab:has([aria-label="Más acciones de las opciones"]) .der .cuenta { flex-basis: 100%; text-align: right; margin-right: 0; line-height: 20px; }
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
.k-tab { display: flex; flex-direction: column; gap: 3px; min-width: 0; position: relative; }
.k-tab .f-mn { top: 36px; left: 0; width: 280px; }
.w-body .w-caja:has(.f-mn) { overflow: visible; }
.k-vacio3 { padding: 28px 16px; text-align: center; font-size: 14px; color: var(--t2); }
.w-tr .f-menu { position: absolute; right: 12px; top: calc(100% - 6px); z-index: 20; min-width: 190px; }
.f-cab .der .e-tipw .e-tip { top: calc(100% + 8px); right: 0; }
"""


def chk(on):
    return f'<span><span class="k-chk{" on" if on else ""}" role="checkbox" aria-checked="{"true" if on else "false"}">{TILDE if on else ""}</span></span>'


def limite(tipo, lim, mal=False):
    if tipo.startswith("De un catálogo") or tipo in ("Sí/No", "Fecha") or lim is None:
        return '<span class="kc-lim"><span class="gris">—</span></span>'
    if tipo == "Texto":
        return f'<span class="kc-lim">hasta {K.entrada(lim[0], ph="N")} {lim[1]}</span>'
    return f'<span class="kc-lim">{K.entrada(lim[0], ph="Mínimo")} {K.entrada(lim[1], ph="Máximo")}</span>'


def fila(n, tipo, ob, un, lim, foco=None, menu=False, abierto=False, err=""):
    nombre = K.entrada(n, ph="Nombre del campo", foco=foco == "campo")
    t = f'<span class="k-in sel{" foco" if abierto else ""}{" mal" if err else ""}"><span>{tipo}</span>{CHEV}</span>'
    if abierto:
        t += ('<span class="f-mn" role="listbox" aria-label="Tipo">' + "".join(f'<span role="option" class="{"on" if x == tipo else ""}">{x}</span>' for x in TIPOS) + "</span>")
    if err:
        t += f'<span class="err2" role="alert">{err}</span>'
    m = ""
    if menu:
        m = (f'<div class="f-menu" role="menu" aria-label="Acciones de {n}"><span class="f-mi" role="menuitem">{F.ARRIBA} Subir</span>'
             f'<span class="f-mi" role="menuitem">{F.ABAJO} Bajar</span><span class="f-sep" role="separator"></span>'
             f'<span class="f-mi pel" role="menuitem">{F.QUITAR} Quitar</span></div>')
    return (f'<div class="w-tr kc"><span class="k-tab fx fx-campo">{nombre}</span><span class="k-tab">{t}</span>{chk(ob)}{chk(un)}{limite(tipo, lim)}'
            f'<span class="fx fx-d2"><button type="button" class="ib" aria-label="Acciones de {n or "el campo nuevo"}">{KEBAB}</button>{m}</span></div>')


def caja_campos(modo="normal"):
    filas = ""
    for k, (n, tipo, ob, un, lim) in enumerate(CAMPOS):
        kw = {}
        if modo == "menu" and k == 1:
            kw = dict(menu=True)
        if modo == "error" and k == 0:
            tipo, kw = "Número entero", dict(err="1.097 opciones tienen un valor que no es un número entero.")
        filas += fila(n, tipo, ob, un, lim, **kw)
    cuenta = "2 campos"
    agregar = f'<button type="button" class="cb cb-sec">{MAS} Agregar campo</button>'
    if modo in ("agregar", "tipo"):
        filas += fila("Plazo de pago", "Texto", False, False, ("", "caracteres"), foco="campo" if modo == "agregar" else None, abierto=modo == "tipo")
        cuenta = "3 campos"
    if modo == "tope":
        filas += '<div class="w-tr kc"><span class="gris">…</span></div>'
        cuenta = "20 campos"
        agregar = K.tip(agregar, MOTIVO_TOPE, abierto=True)
    if modo == "vacia":
        cuerpo = '<div class="k-vacio3">Todavía no hay campos.</div>'
        cuenta = "0 campos"
    else:
        th = ('<div class="w-th kc"><span class="fx fx-campo">Campo</span><span>Tipo</span><span>Obligatorio</span><span>Único</span><span>Límite</span>'
              '<span class="fx fx-d2"><span class="sr">Acciones</span></span></div>')
        cuerpo = f'<div class="k-desp"><div class="k-tabla" style="min-width: {ANCHO_CAMPOS}px;">{th}{filas}</div></div>'
    return (f'<div class="w-caja"><div class="f-cab"><span>Campos</span><span class="der"><span class="cuenta">{cuenta}</span>{agregar}</span></div>'
            f"{cuerpo}</div>")


def caja_valores(modo="normal"):
    """La tabla de opciones con una columna por campo (CE2). Con un campo nuevo, su columna queda grisada hasta guardar (43)."""
    nuevo = modo in ("agregar", "tipo")
    filas = ""
    for k, (n, cod, det, a) in enumerate(K.PROVEEDORES, 1):
        celdas = (f'<span class="k-tab">{K.entrada(det.replace("CUIT ", ""), mono=True)}</span>'
                  f'<span class="k-tab"><span class="k-in sel"><span>{ZONAS_EJ[(k - 1) % len(ZONAS_EJ)]}</span>{CHEV}</span></span>')
        if nuevo:
            celdas += f'<span class="k-tab"><span class="k-in off" aria-disabled="true" title="{MOTIVO_GUARDAR}"><span></span></span></span>'
        filas += K.fila_editable(k, n, cod, RUBROS[k - 1], a, campos=celdas, tabla="kf3" if nuevo else "kf")
    gris = f'<span class="k-gr" title="{MOTIVO_GUARDAR}">Plazo de pago</span>'
    if modo == "agregar":
        gris = K.tip(gris, MOTIVO_GUARDAR, abierto=True)
    cab = ["", "#", "Texto", "Código", "Detalle", "CUIT", "Zona"] + ([f"<span>{gris}</span>"] if nuevo else []) + ["Estado", ""]
    pie = '<div class="w-pie"><span>1–10 de 1.097</span><span>10 por página · Página 1 de 110</span></div>'
    caja = K.caja_opciones(filas, "1.097 opciones · 1.090 activas", pie, modo="cambios" if modo in ("agregar", "tipo", "error") else "normal",
                           tabla="kf3" if nuevo else "kf", cab=cab, ancho=ANCHO_OPCIONES + (138 if nuevo else 0))
    # Al agregar un campo, corrida hasta el final: se ve la columna nueva, grisada, con su motivo
    return caja.replace('<div class="k-desp">', '<div class="k-desp corrida">', 1) if modo == "agregar" else caja


ESTADOS = ["Campos", "Agregar un campo", "Elegir el tipo", "Acciones de un campo", "Quitar un campo", "Cambiar el tipo con errores", "20 campos",
           "Nuevo catálogo", "Guardado"]


def editor():
    tit = "Proveedores"
    items = [(n, d) for n, _c, d, a in K.PROVEEDORES[:6] if a]
    cat = K.caja_catalogo("Proveedores", "A quiénes se les compra.")

    def cuerpo(modo, catalogo=cat, it=items):
        valores = (K.caja_opciones("", "0 opciones", "", modo="nuevo", vacia=True) if modo == "vacia" else
                   caja_valores("normal" if modo in ("menu", "tope") else modo))
        return f'<div class="w-body"><div class="k-cab2">{catalogo}{K.vista_previa(it, "Proveedor")}</div>{caja_campos(modo)}{valores}</div>'
    b = lambda **k: C.banda_k(tit, K.ACTIVO + K.ORIGEN_MANO, K.acc_editor(**k))
    V = {
        "Campos": (b(), cuerpo("normal")),
        "Agregar un campo": (b(cambios=True), cuerpo("agregar")),
        "Elegir el tipo": (b(cambios=True), cuerpo("tipo")),
        "Acciones de un campo": (b(), cuerpo("menu")),
        "Quitar un campo": (b(), cuerpo("normal")),
        "Cambiar el tipo con errores": (b(cambios=True), cuerpo("error")),
        "20 campos": (b(), cuerpo("tope")),
        "Nuevo catálogo": (C.banda_k("Nuevo catálogo", K.NUEVO_MANO, K.acc_editor(nuevo=True)), cuerpo("vacia", K.caja_catalogo("", ""), [])),
        "Guardado": (b(), cuerpo("normal")),
    }
    assert list(V) == ESTADOS
    capas = {
        "Quitar un campo": A.confirmar("¿Quitar el campo «Zona»?", "Deja de mostrarse en la tabla.", "Quitar"),
        "Guardado": A.toast("Guardamos el catálogo."),
    }
    js = A.js_estados(ESTADOS, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Campos de un catálogo · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Proveedores",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + CSS, ESTADOS, js, alto=1400)
    t = t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)
    over = "".join(f'<sc-if value="{{{{s{ESTADOS.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over)


ESTADOS_T = ["Campos", "Editar un campo", "Agregar un campo", "Elegir el tipo", "Acciones de un campo"]


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
    cuerpo = (C.t_bar("Proveedores", "Activo", derecha=der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">'
              + F.tcampo("Nombre", "Proveedores", req=True) + K.tel_ro("Tipo de valor", "Texto") + F.tcampo("Descripción", "A quiénes se les compra.") + "</div>"
              + f'<div class="ap-gtit">Campos · 2<a href="#">Agregar</a></div><div class="ap-grupo">{filas}</div><div style="height: 20px;"></div></div>')
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    Cu = {"Campos": cuerpo, "Editar un campo": cuerpo + fijo, "Agregar un campo": cuerpo + fijo, "Elegir el tipo": cuerpo + fijo, "Acciones de un campo": cuerpo}
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
        "Acciones de un campo": F.thoja("Zona", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span role="menuitem">Subir</span>'
                                        '<span role="menuitem">Bajar</span><span class="pel" role="menuitem">Quitar</span></div>', ""),
    }
    return C.tel_pagina(Cu, ESTADOS_T, capas, "Campos de un catálogo · teléfono", F.CSS_TFILTRO + K.CSS_T12)


NUEVOS = {"FRM-Catalogo-13": (1280, 1400, "Formularios · catálogo escrito a mano · campos · a 1280 · etapa 13"),
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
