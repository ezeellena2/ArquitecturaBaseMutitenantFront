"""La etapa 19, condiciones, cálculos y el bloque (19-condiciones-calculos-y-lineas.md del back). Las condiciones y los cálculos no tienen equivalente en
ArquitecturaBaseFront, salvo el editor de condiciones de las reglas (`FormConditionsEditor`), del que sale «Mostrar si»: Pregunta, Condición, Valor, el tacho y
«Agregar condición». Muestran solo lo que existe hasta la 19 (78): sin «Cargar», aprobación, PDF ni asistente. Todo sale de los tableros aprobados de la 14 y la 15,
con el formulario de ejemplo «Pedido de materiales».

Desde el traspaso 10 (2026-11-07), el bloque es el de ArquitecturaBase (`docs/design/renglones-en-formularios.md` de allá, RG10-D y RG12-A, y las decisiones 168,
177 y 178): «Agregar bloque» al lado de «Agregar pregunta», apagado con «Ya hay un bloque.»; en la lista, «Bloque · de 1 a 10 ítems · 2 preguntas» y el recuadro
«Preguntas de cada ítem»; «Se carga varias veces» en cada pregunta; en WhatsApp, «Productos · ítem 1» y «¿Agregás otro ítem?», o «¿Agregás un ítem?» con mínimo 0;
publicar frena con un mínimo de más de 10; un catálogo del bloque filtra por quien lo recibe, y la planilla, el detalle y el chat muestran los ítems con «Filtros»
(144) y el detalle alineado (139). Sale el «Grupo de líneas», también del cálculo y de las condiciones.

Corre después de `formularios_18_archivos_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr. No escribe `canvas.json`: los títulos de
`TITULOS` los pone quien coordina el lienzo. La 21, la 22 y la 23 usan `cuerpo`, `abierta`, `cond`, `PREG` y `CSS_19`: sin bloque en `PREG`, no hay recuadro.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_planilla_1004 as P  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402
import formularios_15_respuestas_1004 as R  # noqa: E402
import formularios_16_personas_1004 as H  # noqa: E402
import menus_y_solo_lectura_1004 as M  # noqa: E402

PROJ = F.PROJ
CHEV, MAS, TACHO = F.CHEV, A.MAS, M.IC["borrar"]
FORM, PREFIJO = "Pedido de materiales", "PED"
ARRIBA = "<svg"  # las flechas de una columna salen de E.acciones_q
TILDE = A.TILDE

# ================================================================ El formulario de ejemplo, con el bloque «Productos» (177)
BLOQUE, K_BLOQUE = "Productos", 6
AY_MOSTRAR = "La pregunta aparece si se cumplen todas las condiciones, hasta 10. Solo se usan las preguntas de arriba."
AY_FORMULA = "Se calcula al llegar la respuesta, con los valores que quedaron guardados. No se ve en WhatsApp."
AY_MAX = "En WhatsApp se cargan hasta 10 ítems."
AY_VARIAS = "Se carga una vez por ítem."
YA_HAY = "Ya hay un bloque."
UNA_SOLA = "En un bloque se elige una sola opción."
NO_VARIAS = "No se carga varias veces"


def resumen_bloque(minimo=1, maximo=10, preguntas=2):
    """La línea del bloque en la lista (RG12-A): iguales, la cantidad; con mínimo 0, «hasta N»; si no, «de N a M». El plural sigue al último número."""
    items = "ítem" if maximo == 1 else "ítems"
    cuantos = f"{maximo} {items}" if minimo == maximo else f"hasta {maximo} {items}" if minimo == 0 else f"de {minimo} a {maximo} {items}"
    return f"Bloque · {cuantos} · {preguntas} {'pregunta' if preguntas == 1 else 'preguntas'}"


PREG = [("Cliente", "Texto corto · Obligatoria"), ("¿Se concretó la venta?", "Sí o no · Obligatoria"), ("Motivo", "Elegir una · 3 opciones · Opcional"),
        ("Monto", "Número · 2 decimales · 1 condición · Opcional"), ("Fecha de entrega", "Fecha · Opcional"), (BLOQUE, resumen_bloque()),
        ("Total", "Cálculo · Pesos"), ("Observaciones", "Texto largo · Opcional")]
HIJAS = [("Producto", "Elegir de un catálogo · Productos · Obligatoria"), ("Cantidad", "Número · Obligatoria")]
CSS_19 = """.lg-zb { display: flex; flex-direction: column; gap: 10px; }
.lg-cond { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.2fr) minmax(0, 0.9fr) 36px; gap: 8px; align-items: end; }
.lg-cond .ib { height: 40px; }
.q-zona:has(.f-menu), .q-zona:has(.e-tip) { overflow: visible; }
.q-zona:has(.f-menu) .zc, .q-zona:has(.e-tip) .zc { border-radius: 10px 10px 0 0; }
.lg-zb .e-tip { left: 0; right: auto; }
.lg-zb .e-tip::before { left: 18px; right: auto; }
.lg-sub .ct.sel, .lg-cond .ct.sel { display: flex !important; align-items: center; justify-content: space-between; gap: 4px; min-width: 0; }
.ct.sel .v { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ct.sel svg { flex: none; }
.q-ed .ct.ro { background: var(--s2); color: var(--t3); border-color: var(--borde); }
.q-ab:has(.q-it.mal) .q-ed { padding-top: 14px; }
.lg-chips { display: flex; flex-wrap: wrap; gap: 6px; min-height: 40px; align-items: center; padding: 4px 8px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; }
.lg-z .cb, .lg-zb > .cb { align-self: flex-start; }
.q-it.mal { background: var(--peligro-t); }
.lg-form { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 48px; padding: 8px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; }
.lg-form.mal { border-color: var(--peligro); }
.lg-p { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 6px; background: var(--s2); font-size: 13.5px; color: var(--t1); }
.lg-p.op { justify-content: center; min-width: 30px; padding: 0 6px; background: none; font-size: 16px; font-weight: 600; color: var(--t2); }
.lg-p.mal { background: var(--peligro-t); color: var(--peligro); }
.lg-p .x { color: var(--t3); font-size: 14px; }
.lg-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; position: relative; }
.lg-bar .cb.op { width: 36px; min-width: 36px; padding: 0; justify-content: center; font-size: 15px; }
.lg-bar .f-menu { left: 0; right: auto; top: calc(100% + 4px); }
.lg-mon { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 12px; }
.lg-cols { border: 1px solid var(--borde); border-radius: 8px; overflow: hidden; background: #fff; }
.lg-col, .lg-colh { display: grid; grid-template-columns: minmax(0, 1fr) 168px 76px 92px; gap: 6px; align-items: center; padding: 6px 8px; border-top: 1px solid var(--borde); font-size: 13.5px; }
.lg-colh { border-top: 0; background: oklch(0.945 0.018 76); font-size: 13px; font-weight: 600; color: var(--t2); }
.lg-col .ct { height: 34px; min-width: 0; white-space: nowrap; gap: 4px; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; padding: 0 8px; font-size: 13px; }
.lg-col .acc { display: flex; justify-content: flex-end; gap: 2px; }
.lg-sub { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; padding: 2px 0 4px; }
.lg-ren { display: flex; align-items: center; gap: 12px; }
.lg-ren .ct { width: 72px; }
.lg-cnt { font-size: 13px; color: var(--t2); font-variant-numeric: tabular-nums; }
.lg-cnt.am { color: oklch(0.45 0.1 70); font-weight: 600; }
.pv-ren { padding: 8px 0 2px; font-size: 12.5px; font-weight: 600; color: var(--t2); }
.pv-rd span.on i { box-sizing: border-box; border: 5px solid var(--marca); }
.pv-nueva { position: relative; }
.ln-t { display: grid; grid-template-columns: minmax(0, 1fr) 76px; font-size: 13.5px; }
.ln-t > span { padding: 5px 0; border-top: 1px solid var(--borde); }
.ln-t > span.ln-h { padding-top: 0; border-top: 0; font-size: 12.5px; font-weight: 600; color: var(--t2); }
.ln-t .r { text-align: right; font-variant-numeric: tabular-nums; }
.ln-t small { display: block; font-size: 12.5px; color: var(--t3); }
.g-det .ln-t, .r-gr .ln-t { width: 100%; }
.q-blq { margin: 0 16px 12px 54px; border: 1px solid var(--borde); border-radius: 8px; overflow: visible; background: #fff; }
.q-blq-cab { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 4px 8px 4px 14px; box-sizing: border-box;
  background: oklch(0.945 0.018 76); border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 600; color: var(--t2); }
.q-blq-cab:last-child { border-radius: 8px; }
.q-blq .q-it { border-top: 1px solid var(--borde); border-bottom: 0; }
.q-blq .q-it .num { width: auto; min-width: 26px; padding: 0 6px; box-sizing: border-box; border-radius: 13px; }
.q-blq .q-ab { border-bottom: 0; }
.q-blq .q-ed { padding-left: 54px; }
.q-ed .lg-varias { grid-column: 2; display: flex; flex-direction: row; align-items: center; justify-content: flex-end; gap: 4px; }
.q-ed .lg-varias .e-tipw { position: relative; display: inline-flex; }
.q-ed .lg-varias .e-tip { left: auto; right: -8px; top: calc(100% + 8px); width: max-content; max-width: 260px; }
.q-ed .lg-varias .e-tip::before { left: auto; right: 12px; }
.q-ed .q-rango .f-i { margin-left: -6px; }
.q-ed .q-chk.off { color: var(--t3); }
.q-ed .q-chk.off i.no { background: var(--s2); }
.q-ed .lg-off { position: relative; display: inline-flex; align-self: flex-start; }
.q-ed .lg-off .e-tip { left: calc(100% + 10px); right: auto; top: 50%; transform: translateY(-50%); width: max-content; }
.q-ed .lg-off .e-tip::before { left: -4px; right: auto; top: calc(50% - 4px); }
.q-tipomn > span.off { flex-direction: row; }
.q-blq .q-tipomn { right: auto; min-width: 340px; }
.w-caja:has(.q-blq .q-tipomn), .q-blq:has(.q-tipomn) { overflow: visible; }
.f-cab .der .e-tipw { position: relative; display: inline-flex; }
.f-cab .der .e-tip { left: auto; right: 0; top: calc(100% + 8px); width: max-content; font-weight: 400; }
.f-cab .der .e-tip::before { left: auto; right: 22px; }
.pv-sub2 { font-size: 11.5px; color: oklch(0.5 0.01 150); }
.g-det .pl-g, .tr-gr .pl-g, .r-gr .pl-g { color: var(--t3); }
"""


def con_preguntas(fn):
    """Las piezas de la 14 cuentan la última pregunta por A.PREGUNTAS."""
    def envuelta(*a, **k):
        viejas = A.PREGUNTAS
        A.PREGUNTAS = [(n, d, False, None) for n, d in PREG]
        try:
            return fn(*a, **k)
        finally:
            A.PREGUNTAS = viejas
    return envuelta


def con_lista(preg, hijas, fn):
    """Otro formulario por un rato: el de recién agregado, sin bloque ni total, o el bloque con mínimo 0."""
    global PREG, HIJAS
    viejas = (PREG, HIJAS, A.PREGUNTAS)
    PREG, HIJAS = preg, hijas
    A.PREGUNTAS = [(n, d, False, None) for n, d in preg]
    try:
        return fn()
    finally:
        PREG, HIJAS, A.PREGUNTAS = viejas


def es_bloque(k):
    return PREG[k - 1][1].startswith("Bloque ·")


def fila(k, mal=None):
    n, d = PREG[k - 1]
    t = A.fila_pregunta(k, n, d, False, None).replace(f"{d} · Opcional", d)
    if mal:
        t = t.replace('<div class="q-it">', '<div class="q-it mal">', 1).replace('<span class="chips">', '<span class="chips"><span class="ab-chip mal">Corregir</span>' + F.info(mal), 1)
    return t


def fila_hija(j, k=K_BLOQUE):
    """Una pregunta del bloque: 6.1, 6.2…, con ↑ ↓ ✎ 🗑 dentro del bloque."""
    n, d = HIJAS[j - 1]
    return (f'<div class="q-it"><span class="num">{k}.{j}</span><span class="dato"><b>{n}</b><span>{d}</span></span>'
            f'<span class="chips"></span>{E.acciones_q(n, j == 1, j == len(HIJAS))}</div>')


def caja_bloque(cuerpo):
    """El recuadro del bloque, debajo de su fila, con su propio «Agregar pregunta» (RG1-A)."""
    return (f'<div class="q-blq"><div class="q-blq-cab"><span>Preguntas de cada ítem</span><button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button></div>'
            f'{cuerpo}</div>')


def boton_bloque(estado="activo"):
    """«Agregar bloque», al lado de «Agregar pregunta» (RG10-D); con un bloque armado se apaga, con su motivo en el tooltip."""
    if estado == "activo":
        return f'<button type="button" class="cb cb-sec">{MAS} Agregar bloque</button>'
    tip = f'<span class="e-tip" role="tooltip">{YA_HAY}</span>' if estado == "tip" else ""
    return f'<span class="e-tipw"><button type="button" class="cb cb-sec" aria-disabled="true" title="{YA_HAY}">{MAS} Agregar bloque</button>{tip}</span>'


def casilla_varias(modo):
    """«Se carga varias veces», debajo de «Obligatoria», con su (i) (RG6-A). modo: no, si o tip (sin marcar y con el tooltip a la vista)."""
    if not modo:
        return ""
    i = f"<i>{TILDE}</i>" if modo == "si" else '<i class="no"></i>'
    ayuda = F.info(AY_VARIAS)
    if modo == "tip":
        ayuda = f'<span class="e-tipw">{ayuda}<span class="e-tip" role="tooltip">{AY_VARIAS}</span></span>'
    return f'<div class="w-cmp lg-varias"><span class="q-chk">{i}Se carga varias veces</span>{ayuda}</div>'


def abierta(k, tipo, campos, oblig=False, mal=None, varias=None):
    n = PREG[k - 1][0]
    return ('<div class="q-ab">' + fila(k, mal) + '<div class="q-ed">'
            f'<div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">{n}</div></div>'
            f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span><div class="ct sel">{tipo}{CHEV}</div></div>'
            + campos + '<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>'
            f'<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk">{"<i>" + TILDE + "</i>" if oblig else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}Obligatoria</span></div>'
            + casilla_varias(varias) + '<div class="q-pie ancho"><button type="button" class="cb cb-sec">Listo</button></div></div></div>')


def bloque_abierto(k=K_BLOQUE, nombre=BLOQUE, minimo=1, maximo=10, preguntas=2, cuenta=""):
    """El ✎ del bloque: el nombre, la ayuda y, bajo «Ítems», el mínimo y el máximo, con la (i) del máximo (RG1-A y RG7-A)."""
    resumen = resumen_bloque(minimo, maximo, preguntas)
    cab = A.fila_pregunta(k, nombre, resumen, False, None).replace(f"{resumen} · Opcional", resumen)
    rango = f'<div class="q-rango">Mínimo <div class="ct">{minimo}</div> Máximo{F.info(AY_MAX)} <div class="ct">{maximo}</div>{cuenta}</div>'
    return ('<div class="q-ab">' + cab + '<div class="q-ed">'
            f'<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">{nombre}</div></div>'
            '<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>'
            f'<div class="w-cmp ancho"><span class="rt">Ítems</span>{rango}</div>'
            '<div class="q-pie ancho"><button type="button" class="cb cb-sec">Listo</button></div></div></div>')


def caja_preguntas(k_abierta=None, html="", mal=None, mal_k=None, hija=None, hija_html="", boton=None):
    filas, hay = "", False
    for k in range(1, len(PREG) + 1):
        filas += html if k == k_abierta else fila(k, mal if k == mal_k else None)
        if es_bloque(k):
            hay = True
            filas += caja_bloque("".join(hija_html if j == hija else fila_hija(j, k) for j in range(1, len(HIJAS) + 1)))
    boton = boton or ("apagado" if hay else "activo")
    # El orden lo fija la coordinadora: «Agregar título», «Agregar bloque» y «Agregar pregunta» (FRM-Editor-21 hereda esta caja)
    return (f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der"><button type="button" class="cb cb-sec">{MAS} Agregar título</button>'
            f'{boton_bloque(boton)}<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button></span></div>{filas}</div>')


def vista(cuerpo, ayuda="", titulo=None, boton="Enviar"):
    titulo = titulo or FORM  # al llamar: la 21 cambia FORM por un rato
    pv = E.vista()
    pv = re.sub(r'<div class="pv-hb">.*?</div><div class="pv-pie">', lambda m: f'<div class="pv-hb">{cuerpo}</div><div class="pv-pie">', pv, count=1, flags=re.S)
    pv = pv.replace(">Visita a cliente<", f">{titulo}<").replace('<div class="pv-bt">Enviar</div>', f'<div class="pv-bt">{boton}</div>')
    if ayuda:
        pv = pv.replace('<span class="pv-tit2">Así lo ve el empleado</span>', '<span class="pv-tit2">Así lo ve el empleado' + F.info(ayuda) + "</span>", 1)
    return pv


PV_BASE = '<div class="pv-c">Cliente<div class="pv-in"></div></div><div class="pv-c">¿Se concretó la venta?<div class="pv-rd"><span class="on"><i></i>Sí</span><span><i></i>No</span></div></div>'
PV_MONTO = PV_BASE + '<div class="pv-c">Monto (opcional)<div class="pv-in"></div></div>'
SI_NO = '<div class="pv-rd"><span><i></i>Sí</span><span><i></i>No</span></div>'
PV_CERO = f'<div class="pv-c">¿Agregás un ítem?{SI_NO}</div>'  # con mínimo 0, antes del primero (RG8-A)
PV_FIN = '<div class="pv-c">Observaciones (opcional)<div class="pv-in area"></div></div>'


def pv_item(con_preguntas_=True, otro=True):
    """La pantalla de un ítem en WhatsApp: sus preguntas y, desde el mínimo, «¿Agregás otro ítem?» (RG3-A)."""
    h = (f'<div class="pv-c">Producto<div class="pv-in">Elegí una opción {CHEV}</div></div><div class="pv-c">Cantidad<div class="pv-in"></div></div>') if con_preguntas_ else ""
    return h + (f'<div class="pv-c">¿Agregás otro ítem?{SI_NO}</div>' if otro else "")


ITEM1 = dict(pv=pv_item(), titulo=f"{BLOQUE} · ítem 1", boton_pv="Continuar")
ITEM2 = dict(pv=pv_item(), titulo=f"{BLOQUE} · ítem 2", boton_pv="Continuar")  # cada pantalla lleva el número del ítem en el título


def cuerpo(k_abierta=None, html="", pv=PV_MONTO, ayuda="", mal=None, mal_k=None, titulo=None, boton_pv="Enviar", **lista):
    return ('<div class="w-body"><div class="f-cols"><div class="f-pila">' + E.caja_formulario(nombre=FORM, prefijo=PREFIJO, modo="fijo")
            + caja_preguntas(k_abierta, html, mal, mal_k, **lista) + "</div>" + vista(pv, ayuda, titulo, boton_pv) + "</div></div>")


BANDA = lambda: E.banda(FORM, E.EST_PUB, E.acc("cambios"), E.VOL)


# ================================================================ FRM-Editor-Condiciones
E_COND = ["Sí o no", "Elegir una", "Número y fecha", "Respondida o no", "Una referencia rota", "Sin preguntas que sirvan"]


def sel(rot, valor, mal=False):
    return f'<div class="w-cmp"><span class="rt">{rot}</span><div class="ct sel{" mal" if mal else ""}"><span class="v">{valor}</span>{CHEV}</div></div>'


def cond(pregunta, op, valor=None, mal=False, numero=False, chips=None):
    if chips:
        v = '<div class="w-cmp"><span class="rt">Valor</span><div class="lg-chips">' + "".join(f'<span class="ab-chip">{c}<span aria-hidden="true">×</span></span>' for c in chips) + "</div></div>"
    elif valor is None:
        v = "<span></span>"
    elif numero:
        v = f'<div class="w-cmp"><span class="rt">Valor</span><div class="ct">{valor}</div></div>'
    else:
        v = sel("Valor", valor)
    return f'<div class="lg-cond">{sel("Pregunta", pregunta, mal)}{sel("Condición", op)}{v}<button type="button" class="ib" aria-label="Quitar condición">{TACHO}</button></div>'


def mostrar_si(filas, err="", apagado=None):
    motivo = f' disabled title="{apagado}"' if apagado else ""
    tip = f'<span class="e-tip" role="tooltip">{apagado}</span>' if apagado else ""
    boton = f'<span class="e-tipw" style="align-self: flex-start;"><button type="button" class="cb cb-sec"{motivo}>{MAS} Agregar condición</button>{tip}</span>'
    return ('<div class="w-cmp ancho q-zona"><div class="zc"><span>Mostrar si' + F.info(AY_MOSTRAR) + f'</span></div><div class="zb lg-zb">{filas}{err}{boton}</div></div>')


def condiciones():
    def monto(filas, err="", mal=None):
        return cuerpo(4, abierta(4, "Número", mostrar_si(filas, err), varias="no"), mal=mal)
    V = {
        "Sí o no": monto(cond("¿Se concretó la venta?", "es", "Sí")),
        "Elegir una": monto(cond("Motivo", "es alguna de", chips=["Venta nueva", "Reclamo"])),
        "Número y fecha": cuerpo(8, abierta(8, "Texto largo", mostrar_si(cond("Monto", "es mayor o igual a", "100.000,00", numero=True) + cond("Fecha de entrega", "es igual o anterior a", "31/10/2026", numero=True)), varias="no"), pv=PV_FIN),
        "Respondida o no": monto(cond("Cliente", "tiene respuesta")),
        "Una referencia rota": cuerpo(4, abierta(4, "Número", mostrar_si(cond("Pregunta quitada", "es", "Sí", mal=True), '<span class="err2" role="alert">Esa pregunta ya no está en el formulario. Elegí otra.</span>'), mal="La condición usa una pregunta que ya no está.", varias="no"), pv=PV_BASE),
        "Sin preguntas que sirvan": cuerpo(1, abierta(1, "Texto corto", mostrar_si("", apagado="No hay preguntas anteriores que sirvan."), oblig=True, varias="no"), pv=PV_BASE),
    }
    return A.pagina_editor({e: (BANDA(), V[e]) for e in E_COND}, {}, E_COND, "Editor · mostrar si", E.CSS_E12 + E.CSS_CA4 + CSS_19)


# ================================================================ FRM-Editor-Calculo
SUMA_BLOQUE = "La suma de una pregunta del bloque"
E_CALC = ["La fórmula", "Agregar un dato", SUMA_BLOQUE, "Fórmula incompleta", "Un dato que ya no está"]
SUMA = f"Suma de {BLOQUE} · Cantidad × Precio"


def pieza(t, clase=""):
    return f'<span class="lg-p {clase}">{t}<span class="x" aria-hidden="true">×</span></span>'


def op(t):
    return f'<span class="lg-p op">{t}</span>'


def formula(piezas, err="", menu=False, mal=False):
    ops = "".join(f'<button type="button" class="cb cb-sec op" aria-label="{n}">{s}</button>' for s, n in [("+", "Sumar"), ("−", "Restar"), ("×", "Multiplicar"), ("÷", "Dividir"), ("(", "Abrir paréntesis"), (")", "Cerrar paréntesis")])
    m = ""
    if menu:
        m = ('<div class="f-menu" role="menu" aria-label="Agregar dato">' + "".join(f'<span class="f-mi" role="menuitem">{x}</span>' for x in ["Un número", "Una pregunta", "Un campo del catálogo", SUMA_BLOQUE]) + "</div>")
    return ('<div class="w-cmp ancho q-zona"><div class="zc"><span>Fórmula' + F.info(AY_FORMULA) + '</span></div><div class="zb lg-zb lg-z">'
            f'<div class="lg-form{" mal" if mal else ""}">{piezas}</div>{err}<div class="lg-bar"><button type="button" class="cb cb-sec" aria-haspopup="menu">{MAS} Agregar dato {CHEV}</button>{m}{ops}</div></div></div>')


def moneda():
    return ('<div class="w-cmp ancho"><span class="q-chk"><i>' + TILDE + '</i>Es un monto</span></div>'
            f'<div class="w-cmp"><span class="rt">Moneda</span><div class="ct sel">Pesos (ARS){CHEV}</div></div>'
            '<div class="w-cmp"><span class="rt">Decimales' + F.info("Los de la moneda.") + '</span><div class="ct ro">2</div></div>')


def calculo():
    def total(piezas, **k):
        return cuerpo(7, abierta(7, "Cálculo", formula(piezas, **k) + moneda()).replace('<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>', "").replace('<span class="q-chk"><i class="no"></i>Obligatoria</span>', ""),
                      pv=PV_FIN, ayuda="El cálculo no se ve en WhatsApp.")
    base = pieza(SUMA) + op("+") + pieza("Monto")
    # La suma: una pregunta del bloque, que se puede multiplicar ítem por ítem por otra del bloque o por un campo del catálogo elegido en ese ítem
    dlg = F.dialogo(SUMA_BLOQUE, '<div class="lg-sub">' + sel("Pregunta del bloque", "Cantidad") + sel("Multiplicar por", "Un campo del catálogo")
                    + sel("Campo de «Producto»", "Precio") + "</div>",
                    '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Agregar</button>')
    V = {"La fórmula": total(base), "Agregar un dato": total(base, menu=True), SUMA_BLOQUE: total(base),
         "Fórmula incompleta": total(pieza(SUMA) + op("+"), mal=True, err='<span class="err2" role="alert">Falta un dato después de «+».</span>'),
         "Un dato que ya no está": total(pieza(SUMA) + op("+") + pieza("Flete", "mal"), mal=True, err='<span class="err2" role="alert">«Flete» ya no está en el formulario. Quitalo o elegí otro.</span>')}
    return A.pagina_editor({e: (BANDA(), V[e]) for e in E_CALC}, {SUMA_BLOQUE: dlg}, E_CALC, "Editor · cálculo", E.CSS_E12 + E.CSS_CA4 + CSS_19)


# ================================================================ FRM-Editor-Lineas: el bloque (146, 168, 177 y 178)
E_LIN = ["El bloque", "Recién agregado", "Agregar bloque apagado", "Con mínimo 0", "Un catálogo del bloque", "Tipos de respuesta en el bloque", "Se carga varias veces",
         "Cerca del tope de componentes", "Quitar el bloque"]


def hija_abierta(j, tipo_html, campos):
    """Una pregunta del bloque abierta en su recuadro, con «Se carga varias veces» marcada."""
    n = HIJAS[j - 1][0]
    return ('<div class="q-ab">' + fila_hija(j) + '<div class="q-ed">'
            f'<div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">{n}</div></div>' + tipo_html + campos
            + '<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>'
            f'<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk"><i>{TILDE}</i>Obligatoria</span></div>'
            + casilla_varias("si") + '<div class="q-pie ancho"><button type="button" class="cb cb-sec">Listo</button></div></div></div>')


def hija_catalogo():
    """Producto, del catálogo «Productos»: filtra por quien lo recibe, como una suelta (168), con las zonas plegadas al abrirla (145);
    «Permitir elegir varias» se apaga con su motivo."""
    filtros = H.seccion_filtros("plegada").replace("Zona", "Sucursal")
    varias = (f'<div class="w-cmp ancho"><span class="e-tipw lg-off"><span class="q-chk off" aria-disabled="true" title="{UNA_SOLA}"><i class="no"></i>Permitir elegir varias</span>'
              f'<span class="e-tip" role="tooltip">{UNA_SOLA}</span></span></div>')
    campos = (f'<div class="w-cmp ancho q-cat"><span class="rt">Catálogo <span class="req">*</span>{F.info("Las opciones se preparan al mandar el formulario.")}</span>'
              f'<div class="ct sel">Productos{CHEV}</div></div>' + varias + filtros + E.zona_plegada("En WhatsApp", E.RESUMEN_WA["elegido"], clase="wa"))
    return hija_abierta(1, f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span><div class="ct sel">Elegir de un catálogo{CHEV}</div></div>', campos)


def hija_tipos():
    """Cantidad, con «Tipo de respuesta» abierto: lo que no entra en un bloque se apaga, con su motivo después de «·» (RG9-A)."""
    off = lambda t, m=NO_VARIAS: f'<span class="off" aria-disabled="true">{t} · {m}</span>'
    items = ("<span>Texto corto</span><span>Texto largo</span><span class=\"on\">Número</span><span>Fecha</span><span>Sí o no</span><span>Elegir una</span>"
             + off("Elegir varias", UNA_SOLA.rstrip(".")) + "<span>Elegir de un catálogo</span>" + off("Foto") + off("Documento") + off("Cálculo"))
    tipo = (f'<div class="w-cmp q-cat"><span class="rt">Tipo de respuesta</span><div class="ct sel abierto">Número{CHEV}</div>'
            f'<div class="q-tipomn" role="listbox" aria-label="Tipo de respuesta">{items}</div></div>')
    return hija_abierta(2, tipo, "")


def recien_agregado():
    """«Agregar bloque» suma el bloque al final, abierto y con «Bloque» de nombre, de 1 a 20 (RG10-D); el botón se apaga."""
    preg = [p for p in PREG if p[0] not in (BLOQUE, "Total")] + [("Bloque", resumen_bloque(1, 20, 0))]
    k = len(preg)
    return con_lista(preg, [], lambda: cuerpo(k, bloque_abierto(k, "Bloque", 1, 20, 0), pv=pv_item(False), titulo="Bloque · ítem 1", boton_pv="Continuar"))


def minimo_cero():
    preg = [(n, resumen_bloque(0, 10, 2) if n == BLOQUE else d) for n, d in PREG]
    return con_lista(preg, HIJAS, lambda: cuerpo(K_BLOQUE, bloque_abierto(minimo=0), pv=PV_CERO, titulo=BLOQUE, boton_pv="Continuar"))


def lineas():
    cuenta = '<span class="lg-cnt am">46 de 50 componentes</span>'
    V = {"El bloque": cuerpo(K_BLOQUE, bloque_abierto(), **ITEM1),
         "Recién agregado": recien_agregado(),
         "Agregar bloque apagado": cuerpo(boton="tip"),
         "Con mínimo 0": minimo_cero(),
         "Un catálogo del bloque": cuerpo(hija=1, hija_html=hija_catalogo(), **ITEM1),
         "Tipos de respuesta en el bloque": cuerpo(hija=2, hija_html=hija_tipos(), **ITEM2),
         "Se carga varias veces": cuerpo(8, abierta(8, "Texto largo", "", varias="tip"), pv=PV_FIN),
         "Cerca del tope de componentes": cuerpo(K_BLOQUE, bloque_abierto(cuenta=cuenta), **ITEM2),
         "Quitar el bloque": cuerpo()}
    capas = {"Quitar el bloque": A.confirmar("¿Quitar el bloque?", f"Se quitan el bloque «{BLOQUE}» y sus 2 preguntas.", "Quitar el bloque")}
    return A.pagina_editor({e: (BANDA(), V[e]) for e in E_LIN}, capas, E_LIN, "Editor · el bloque",
                           E.CSS_E12 + E.CSS_CA4 + H.CSS_FILTROS + H.CSS_FILTROS_T5 + CSS_19)


# ================================================================ FRM-Publicar-19
E_PUB = ["Una condición que WhatsApp no puede mostrar", "Más de 50 componentes", "Pasan al bloque", "Un bloque sin preguntas", "Un máximo de más de 10",
         "Un mínimo de más de 10"]
AYUDA_AVISOS = "No frenan la publicación, pero conviene revisarlos."


AVISO = "z-f aviso"  # no «z-f av»: la tanda «a» pinta todo `.av` como un avatar
CSS_AVISO = ".z-f.aviso .ic { color: oklch(0.55 0.11 75); }\n"


def sin_av(t):
    """Las filas de «Avisos» de la 16 (`H.z_aviso`) con la clase de acá."""
    return t.replace('class="z-f av"', f'class="{AVISO}"')


def z_bloque(detalle, aviso=False):
    """Lo del bloque, en su pregunta, con «Ir a la pregunta», que abre el bloque."""
    ic = F.INFO if aviso else A.ALERTA
    return (f'<div class="{AVISO if aviso else "z-f"}"><span class="ic">{ic}</span><span class="tx"><b>{BLOQUE}</b><span>{detalle}</span></span>'
            '<a class="cb cb-sec" href="FRM-Editor-Lineas.dc.html">Ir a la pregunta</a></div>')


def que_se_publica(pasan=False):
    filas = E.z_dato("Borrador", f"Guardado el {E.GUARDADO}") + E.z_dato("Preguntas", "8")
    if pasan:  # Producto y Cantidad ya existían: pasan como preguntas nuevas, y lo cargado antes conserva su columna (RG6-A)
        filas += E.z_dato("Agregadas", BLOQUE) + E.z_dato("Pasan al bloque", "Producto y Cantidad")
    else:
        filas += E.z_dato("Cambiadas", f"{BLOQUE} y Observaciones")
    return E.z_zona("Qué se publica", filas)


def publicar():
    tit = "Publicar la versión 4 en WhatsApp"

    def dlg(problemas="", avisos="", pasan=False):
        cuerpo_ = ((E.z_zona("Problemas", problemas, E.AYUDA_PROBLEMAS) if problemas else "") + (E.z_zona("Avisos", avisos, AYUDA_AVISOS) if avisos else "")
                   + que_se_publica(pasan))
        return A.dlg_publicar(tit, cuerpo_, E.pie_pub(activo=not problemas))
    capas = {E_PUB[0]: dlg(E.z_problema("Observaciones", "WhatsApp no puede mostrar la condición «Monto es mayor o igual a 100.000,00».")),
             E_PUB[1]: dlg(z_bloque("Cada ítem usa 52 componentes en su pantalla, y WhatsApp admite 50. Quitá preguntas del bloque.")),
             E_PUB[2]: dlg(pasan=True),
             E_PUB[3]: dlg(z_bloque("Agregá al menos una pregunta al bloque.")),
             E_PUB[4]: dlg(avisos=z_bloque("En WhatsApp se cargan hasta 10 ítems; el máximo es 20.", aviso=True)),
             E_PUB[5]: dlg(z_bloque("En WhatsApp se cargan hasta 10 ítems; el mínimo es 15."))}
    base = (E.banda(FORM, E.EST_PUB, E.acc("limpio"), E.VOL), cuerpo())
    return A.pagina_editor({e: base for e in E_PUB}, capas, E_PUB, "Publicar · etapa 19", E.CSS_E12 + E.CSS_CA4 + E.CSS_ZONAS + H.CSS_AVISOS + CSS_AVISO + CSS_19)


# ================================================================ Los ítems de cada respuesta: (producto, precio del catálogo, cantidad)
NS = R.gris("No se mostró")
ITEMS = {"PED-000045": [("Caño de 1/2 pulgada", "$ 4.200,00", "10"), ("Codo de 90°", "$ 850,00", "40"), ("Cinta de teflón", "$ 950,00", "20")],
         "PED-000044": [("Caño de 1/2 pulgada", "$ 4.200,00", "6"), ("Codo de 90°", "$ 850,00", "12")],
         "PED-000043": [("Caño de 3/4 pulgada", "$ 6.300,00", "40"), ("Llave de paso", "$ 12.500,00", "6"), ("Codo de 90°", "$ 850,00", "60"),
                        ("Cupla de 1/2 pulgada", "$ 590,00", "35"), ("Cinta de teflón", "$ 950,00", "15")],
         "PED-000042": [("Llave de paso", "$ 12.500,00", "2")],
         "PED-000041": [("Caño de 1/2 pulgada", "$ 4.200,00", "25"), ("Tee de 1/2 pulgada", "$ 1.250,00", "16"), ("Codo de 90°", "$ 850,00", "40"),
                        ("Cinta de teflón", "$ 950,00", "15")],
         "PED-000040": [("Codo de 90°", "$ 850,00", "8")]}
RENGLONES = ITEMS["PED-000045"]  # la 20 y la 21 la usaban con este nombre


def en_linea(items):
    """La columna del bloque: la cantidad, en gris, y los valores de su primera pregunta, enteros (RG4-A y 174)."""
    return R.gris(f"{len(items)} ·") + " " + ", ".join(p for p, _c, _q in items)


def items_d(items):
    """El detalle (139): cada ítem con su número y el valor de su primera pregunta en negro, y los demás datos alineados debajo."""
    return '<div class="d-its">' + "".join(
        f'<div class="d-it"><span class="n">{k}</span><span class="v">{p}<span class="d-sub"><span class="k">Precio</span><span>{c}</span>'
        f'<span class="k">Cantidad</span><span>{q}</span></span></span></div>' for k, (p, c, q) in enumerate(items, 1)) + "</div>"


def items_tabla(items):
    """La pantalla completa: una tabla, con el número sin encabezado, que se desplaza de costado en su caja."""
    filas = "".join(f'<span class="r n">{k}</span><span>{p}</span><span class="r">{c}</span><span class="r">{q}</span>' for k, (p, c, q) in enumerate(items, 1))
    return ('<div class="it-caja"><div class="it-t" role="table" aria-label="Productos"><span class="h n"></span><span class="h">Producto</span>'
            f'<span class="h r">Precio</span><span class="h r">Cantidad</span>{filas}</div></div>')


def items_chat(items):
    """En la tarjeta del chat, un ítem por línea, numerado, con sus valores separados por « · » en el orden de las preguntas."""
    return '<span class="it-ln">' + "".join(f"<span>{k}. {p} · {q}</span>" for k, (p, _c, q) in enumerate(items, 1)) + "</span>"


def ln_tabla(renglones):
    """La de antes, para quien todavía la usa (la 20 y la 21 hasta su tanda)."""
    return ('<div class="ln-t"><span class="ln-h">Producto</span><span class="ln-h r">Cantidad</span>'
            + "".join(f'<span>{p}<small>Precio: {c}</small></span><span class="r">{q}</span>' for p, c, q in renglones) + "</div>")


CSS_ITEMS = """.d-its { display: flex; flex-direction: column; gap: 8px; }
.d-it { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 6px; align-items: start; }
.d-it .n { color: var(--t2); font-variant-numeric: tabular-nums; text-align: right; }
.d-it .v { min-width: 0; color: var(--t1); }
.d-it .d-sub { margin-top: 4px; }
.it-caja { overflow-x: auto; border: 1px solid var(--borde); border-radius: 8px; background: #fff; }
.it-t { display: grid; grid-template-columns: 40px minmax(180px, 1fr) 110px 90px; font-size: 13.5px; min-width: 420px; }
.it-t > span { padding: 7px 10px; border-top: 1px solid var(--borde); }
.it-t > span:not(.n) { box-shadow: inset 1px 0 0 oklch(0.915 0.01 80 / 0.8); }
.it-t > .h { border-top: 0; background: oklch(0.945 0.018 76); font-size: 12.5px; font-weight: 600; color: var(--t2); }
.it-t .r { text-align: right; font-variant-numeric: tabular-nums; }
.it-t .n { color: var(--t2); }
.it-ln { display: flex; flex-direction: column; gap: 2px; }
.w-tr.pl > span.pl-blq { white-space: normal; line-height: 1.4; padding-top: 12px; padding-bottom: 12px; overflow: visible; text-overflow: clip; }
.pl-fmn .fi > span.g19 { min-height: 32px; font-size: 12.5px; font-weight: 600; color: var(--t2); background: oklch(0.975 0.008 78); }
.pl-fmn .fi > span.sub { padding-left: 28px; }
.pl-fmn .fd .blq { margin-top: -6px; font-size: 12.5px; color: var(--t3); }
"""


# ================================================================ FRM-Respuestas-19: la planilla, con «Filtros» (144) y la columna del bloque
COLS = [("num", "N°", 112, ""), ("rec", "Recibida", 136, ""), ("cli", "Cliente", 150, ""), ("ven", "¿Se concretó la venta?", 150, ""), ("mon", "Monto", 110, "r"),
        ("pro", BLOQUE, 300, ""), ("tot", "Total", 120, "r"), ("obs", "Observaciones", 220, "")]
# n°, recibida, cliente, venta, monto, total, observaciones, versión. El total usa «Monto»: si no se mostró, queda «Sin respuesta».
RESP = [("PED-000045", "15/10/2026 11:47", "Corralón El Puente", "Sí", "48.000,00", "$ 143.000,00", "Pidieron entrega el lunes.", 3),
        ("PED-000044", "15/10/2026 11:04", "Obra Centro", "No", NS, None, "Falta confirmar el flete.", 3),
        ("PED-000043", "14/10/2026 17:02", "Distribuidora Norte", "Sí", "212.000,00", "$ 624.900,00", "Firmaron el pedido de noviembre.", 3),
        ("PED-000042", "14/10/2026 09:30", "Ferretería Sur", "No", NS, None, None, 3),
        ("PED-000041", "13/10/2026 15:30", "Ferretería Rosales", "Sí", "125.500,00", "$ 298.750,00", "Cerramos el pedido de octubre.", 3),
        ("PED-000040", "13/10/2026 14:10", "Obra Centro", "No", NS, None, None, 3),
        ("PED-000039", "13/10/2026 12:20", "Corralón El Puente", "Sí", "96.300,00", "—", "Entrega parcial.", 2),
        ("PED-000038", "13/10/2026 11:04", "Ferretería Rosales", "No", None, "—", None, 2),
        ("PED-000037", "12/10/2026 17:40", "Distribuidora Norte", "Sí", "54.200,00", "—", "Falta un pallet.", 2),
        ("PED-000036", "12/10/2026 10:02", "Obra Centro", "No", None, "—", "Visita de rutina.", 2)]
# «Producto: Caño de 1/2 pulgada» y «Cantidad: desde 10» buscan un mismo ítem que cumpla las dos: PED-000044 tiene el caño, pero 6
FILTRADAS = ["PED-000045", "PED-000041"]
CHIPS = ["Producto: Caño de 1/2 pulgada", "Cantidad: desde 10"]


def celda(k, r):
    n, rec, cli, ven, mon, tot, obs, _v = r
    if k == "num":
        return f'<span><a class="pl-num" href="FRM-Respuesta-19.dc.html">{n}</a></span>'
    if k == "pro":  # una respuesta de antes del bloque dice «—»
        return f'<span class="pl-blq">{en_linea(ITEMS[n]) if n in ITEMS else R.gris("—")}</span>'
    v = {"rec": rec, "cli": cli, "ven": ven, "mon": mon, "tot": tot, "obs": obs}[k]
    clase = ' class="r"' if k in ("mon", "tot") else ""
    return f"<span{clase}>{R.valor(v)}</span>"


def tabla(sel_=None, filas=None):
    lista = [r for r in RESP if filas is None or r[0] in filas]
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel_ else ""}">' + "".join(celda(k, r) for k, *_ in COLS) + "</div>" for r in lista)
    pie = "<span>1–10 de 45</span><span>10 por página · Página 1 de 5</span>" if filas is None else f"<span>1–{len(lista)} de {len(lista)}</span><span>10 por página · Página 1 de 1</span>"
    return f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(COLS)};"><div class="pl-scroll">{R.cabecera(COLS)}{h}</div><div class="w-pie">{pie}</div></div>'


F19 = [("rec", "Recibida"), ("cli", "Cliente"), ("ven", "¿Se concretó la venta?"), ("mot", "Motivo"), ("mon", "Monto"), ("fec", "Fecha de entrega"), ("blq", BLOQUE),
       ("pro", "Producto"), ("can", "Cantidad"), ("tot", "Total"), ("obs", "Observaciones"), ("quien", "Cargó"), ("ver", "Versión del formulario")]
EN_ALGUN = f"En algún ítem de {BLOQUE}"


def menu_filtros(marcados=()):
    """«Filtros» (144): el nombre del bloque encabeza sus preguntas, que van debajo, con sangría; la elegida dice «En algún ítem de Productos»."""
    izq = ""
    for k, n in F19:
        if k == "blq":
            izq += f'<span class="g19">{n}</span>'
            continue
        clase = " ".join(c for c in ("on" if k == "pro" else "", "sub" if k in ("pro", "can") else "") if c)
        izq += f'<span{" class=" + chr(34) + clase + chr(34) if clase else ""}>{n}{"<span class=" + chr(34) + "pt" + chr(34) + "></span>" if k in marcados else ""}</span>'
    der = f'<b>Producto</b><span class="blq">{EN_ALGUN}</span><span class="cmb" role="combobox" aria-expanded="false">Todas {CHEV}</span>'
    return f'<span class="pl-fmn" role="dialog" aria-label="Filtros"><span class="fi">{izq}</span><span class="fd">{der}</span></span>'


def barra(modo="normal"):
    """El buscador, «Empresa» y un solo «Filtros», con lo aplicado en chips debajo, como la 15 (143 y 144). modo: normal, filtros o filtrado."""
    chips = CHIPS if modo == "filtrado" else []
    menu = menu_filtros() if modo == "filtros" else ""
    n = f' <span class="n">{len(chips)}</span>' if chips else ""
    h = (f'<span class="w-bus">{F.BUSCAR} Buscar en textos largos</span><span class="f-env"><span class="w-pil" role="button" aria-haspopup="listbox">Empresa {CHEV}</span></span>'
         f'<span class="pl-env"><span class="w-pil pl-fil" role="button" aria-haspopup="dialog" aria-expanded="{"true" if menu else "false"}">{R.FILTROS} Filtros{n}</span>{menu}</span>'
         f'<span class="pl-der"><span class="pl-env"><span class="w-pil" role="button" aria-haspopup="menu" aria-expanded="false">Columnas {CHEV}</span></span></span>')
    return f'<div class="w-caja o-fb pl-fb">{h}{R.chips5(chips)}</div>'


def fondo(sel_=None, modo="normal"):
    return R.CUERPO.format(barra(modo) + tabla(sel_, FILTRADAS if modo == "filtrado" else None))


def banda(ac=None):
    return R.banda(FORM, "Respuestas · versión 3 publicada", R.EXPORTAR if ac is None else ac)


def migas(t):
    return t.replace("Formularios / Visita a cliente", f"Formularios / {FORM}")


E_PL = ["Planilla", "Filtros", "Con filtros"]


def respuestas():
    modos = {"Planilla": "normal", "Filtros": "filtros", "Con filtros": "filtrado"}
    t = R.pagina("Respuestas · /org/formularios/:id/respuestas · etapa 19", A.con_estados([(e, banda()) for e in E_PL]), A.con_estados([(e, fondo(modo=modos[e])) for e in E_PL]), E_PL,
                 css=R.CSS_T5 + CSS_ITEMS + CSS_19)
    return migas(t)


def enlaces(t):
    for a, b in [("FRM-Respuesta.dc.html", "FRM-Respuesta-19.dc.html"), ("FRM-Respuesta-Completa.dc.html", "FRM-Respuesta-19.dc.html"), ("FRM-Respuestas-Filtros.dc.html", "FRM-Respuestas-19.dc.html"),
                 ("FRM-Respuestas.dc.html", "FRM-Respuestas-19.dc.html"), ("WA-Chats-Respuesta.dc.html", "WA-Chats-Respuesta-19.dc.html"), ("FRM-Tablero.dc.html", "FRM-Tablero-19.dc.html"),
                 ("FRM-Editor.dc.html", "FRM-Editor-Condiciones.dc.html"), ("FRM-Publicar.dc.html", "FRM-Publicar-19.dc.html"), ("FRM-Publicando.dc.html", "FRM-Publicar-19.dc.html"),
                 ("M-FRM-Respuesta.dc.html", "M-FRM-Respuesta-19.dc.html"), ("M-WA-Conversacion-Respuesta.dc.html", "M-WA-Conversacion-Respuesta-19.dc.html"),
                 ("M-FRM-Respuestas.dc.html", "M-FRM-Respuestas-19.dc.html"), ("M-FRM-Tablero.dc.html", "M-FRM-Tablero-19.dc.html"), ("M-FRM-Editor.dc.html", "M-FRM-Editor-Condiciones.dc.html")]:
        t = t.replace(f'"{a}"', f'"{b}"')
    return t


# ================================================================ FRM-Respuesta-19: la vista rápida alineada (139) y la pantalla completa
E_D = ["Respuesta", "Un cálculo sin respuesta", "Pantalla completa"]


def valores_si(items=items_d):
    """10 × 4.200 + 40 × 850 + 20 × 950 = 95.000, más los 48.000 de «Monto»."""
    return [("Cliente", "Corralón El Puente"), ("¿Se concretó la venta?", "Sí"), ("Motivo", "Venta nueva"), ("Monto", "48.000,00"), ("Fecha de entrega", "20/10/2026"),
            (BLOQUE, items(ITEMS["PED-000045"])), ("Total", "$ 143.000,00"), ("Observaciones", "Pidieron entrega el lunes.")]


def valores_no(items=items_d):
    return [("Cliente", "Obra Centro"), ("¿Se concretó la venta?", "No"), ("Motivo", "Seguimiento"), ("Monto", '<span class="vac">No se mostró</span>'), ("Fecha de entrega", "22/10/2026"),
            (BLOQUE, items(ITEMS["PED-000044"])), ("Total", None), ("Observaciones", "Falta confirmar el flete.")]


ACT_45 = [("15/10/2026 10:51", "Se la mandó", "Lucía Fernández, desde el chat", "Hecho"), ("11:47", "La respondió", "Tomás Acosta, por WhatsApp", "Hecho")]
ACT_44 = [("15/10/2026 10:20", "Se la mandó", "Lucía Fernández, desde el chat", "Hecho"), ("11:04", "La respondió", "Tomás Acosta, por WhatsApp", "Hecho")]


def detalle():
    aside = R.d3("PED-000045", FORM, 3, valores_si(), "Tomás Acosta", "15/10/2026 11:47", "15/10/2026 10:51", primera=True, pos="1 de 10")
    sin = R.d3("PED-000044", FORM, 3, valores_no(), "Tomás Acosta", "15/10/2026 11:04", "15/10/2026 10:20", pos="2 de 10")
    capas = A.con_estados([("Respuesta", aside), ("Un cálculo sin respuesta", sin), ("Pantalla completa", "")])
    rc = R.CUERPO.format(R.rc_seccion("Respuesta", F.grilla(valores_si(items_tabla)), "8 preguntas · 8 respondidas", True)
                         + R.rc_seccion("Actividad", R.actividad4(ACT_45), "Recibida el 15/10/2026 11:47", True))
    bnd = {"Pantalla completa": R.rc_banda("PED-000045", "Versión 3 · recibida el 15/10/2026 11:47", "1 de 10", primera=True)}
    cu = {"Respuesta": fondo("PED-000045"), "Un cálculo sin respuesta": fondo("PED-000044"), "Pantalla completa": rc}
    t = R.pagina("Respuesta · etapa 19", A.con_estados([(e, bnd.get(e, banda())) for e in E_D]), A.con_estados([(e, cu[e]) for e in E_D]), E_D,
                 css=F.CSS_GRILLA + P.CSS_D2 + R.CSS_DET + R.CSS_D3 + R.CSS_RC + R.CSS_T5 + ".d2-h a.nv { text-decoration: none; }\n" + CSS_ITEMS + CSS_19)
    k = t.rindex("</div>\n</x-dc>")
    return migas(t[:k] + capas + t[k:])


# ================================================================ Los teléfonos de la planilla y la respuesta
CSS_TITEMS = """.d-its { display: flex; flex-direction: column; gap: 8px; }
.d-it { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 6px; }
.d-it .n { color: var(--t2); text-align: right; font-variant-numeric: tabular-nums; }
.t-fl > span.g19 { min-height: 40px; font-size: 13.5px; font-weight: 600; color: var(--t2); background: oklch(0.975 0.008 78); }
.t-fl > span.sub { padding-left: 32px; }
.t-blq { padding: 8px 16px 0; font-size: 13.5px; color: var(--t3); background: #fff; }
"""


def tel_respuestas():
    der = f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'

    def fila_t(r):
        n, rec, cli, _ven, mon, tot, *_x = r
        mon_t = "No se mostró" if mon == NS else (mon or "Sin respuesta")
        items = ITEMS.get(n)
        l3 = " · ".join(x for x in [f"{len(items)} {'ítem' if len(items) == 1 else 'ítems'}" if items else None, None if tot == "—" else (tot or "Sin respuesta")] if x)
        return (f'<a class="ap-fila" href="M-FRM-Respuesta-19.dc.html"><div class="tx"><span class="l1">{n}<span class="hr">{rec}</span></span>'
                f'<span class="l2">{cli} · Monto: {mon_t}</span><span class="l3">{l3 or "—"}</span></div></a>')
    ir = F.svg('<path d="m9 6 6 6-6 6"/>', 18, "2")
    lista = [("Empresa", ""), ("Recibida", ""), ("Cliente", ""), ("¿Se concretó la venta?", ""), ("Motivo", ""), ("Monto", ""), ("Fecha de entrega", ""), (BLOQUE, "g19"),
             ("Producto", "sub"), ("Cantidad", "sub"), ("Total", ""), ("Cargó", ""), ("Versión del formulario", "")]
    filtros = (C.t_bar("Filtros", FORM, "M-FRM-Respuestas-19.dc.html") + '<div class="ap-cuerpo"><div class="t-fl">'
               + "".join(f'<span class="g19">{n}</span>' if c == "g19" else f'<span{" class=" + chr(34) + c + chr(34) if c else ""}>{n}<span class="v">Todas{ir}</span></span>' for n, c in lista)
               + '</div></div><div class="t-pie"><button type="button" class="cb cb-sec">Limpiar todo</button><button type="button" class="cb cb-pri">Listo</button></div>')
    ops = ["Todas", "Caño de 1/2 pulgada", "Caño de 3/4 pulgada", "Cinta de teflón", "Codo de 90°", "Cupla de 1/2 pulgada", "Llave de paso", "Tee de 1/2 pulgada"]
    una = (C.t_bar("Producto", "Filtros", "M-FRM-Respuestas-19.dc.html") + f'<div class="t-blq">{EN_ALGUN}</div><div class="ap-cuerpo"><div class="t-fl">'
           + "".join(f'<span class="op{" sel" if o == "Todas" else ""}"><span class="tl">{R.CHECK if o == "Todas" else ""}</span>{o}</span>' for o in ops)
           + '</div></div><div class="t-pie"><button type="button" class="cb cb-pri">Listo</button></div>')
    est = ["Respuestas", "Filtros", "Filtros: una pregunta del bloque"]
    cuerpo_t = {"Respuestas": C.t_bar(FORM, "45 respuestas", "M-FRM-Formularios.dc.html", der) + '<div class="ap-cuerpo">' + "".join(fila_t(r) for r in RESP) + "</div>",
                "Filtros": filtros, "Filtros: una pregunta del bloque": una}
    return C.tel_pagina(cuerpo_t, est, {}, "Respuestas · teléfono · etapa 19", F.CSS_TFILTRO + P.CSS_TPL + R.CSS_T15 + R.CSS_T5 + R.CSS_T5_TEL + CSS_TITEMS)


def tel_respuesta():
    def pantalla(num, vals, act, pos, primera=False):
        nav = (f'<div class="tr-nav"><span>{pos}</span><button type="button" class="ap-ib" aria-label="Respuesta anterior"{" disabled" if primera else ""}>{P.SUBE}</button>'
               f'<button type="button" class="ap-ib" aria-label="Respuesta siguiente">{P.BAJA}</button><a class="cb cb-sec" href="M-WA-Conversacion-Respuesta-19.dc.html">Abrir conversación</a></div>')
        dia = act[0][0][:10]
        moms = '<div class="tr-moms">' + "".join(f'<div class="m"><span><b>{"Mandada" if q == "Se la mandó" else "Recibida"}</b><small>{quien}</small></span>'
                                                 f'<span class="h">{h if len(h) > 5 else dia + " " + h}</span></div>' for h, q, quien, _e in act) + "</div>"
        grilla = "".join(f'<div class="f"><span class="k">{k}</span>' + (f"<span>{v}</span>" if v is not None else '<span class="vac">Sin respuesta</span>') + "</div>" for k, v in vals)
        actv = '<div class="tr-act">' + "".join(f"<span><b>{q}</b><small>{quien}</small><small>{h} · {e}</small></span>" for h, q, quien, e in act) + "</div>"
        return (C.t_bar(num, f"{FORM} · versión 3", "M-FRM-Respuestas-19.dc.html") + nav + '<div class="tr-scroll">' + moms
                + f'<div class="tr-sec"><button type="button" class="h" aria-expanded="true">Respuesta<span class="fl ab">{CHEV}</span></button><div class="tr-gr">{grilla}</div></div>'
                + f'<div class="tr-sec"><button type="button" class="h" aria-expanded="true">Actividad<span class="fl ab">{CHEV}</span></button>{actv}</div></div>')
    estados = ["Respuesta", "Un cálculo sin respuesta"]
    cu = {estados[0]: pantalla("PED-000045", valores_si(), ACT_45, "1 de 45", True), estados[1]: pantalla("PED-000044", valores_no(), ACT_44, "2 de 45")}
    return C.tel_pagina(cu, estados, {}, "Respuesta · teléfono · etapa 19", P.CSS_TPL + R.CSS_T15 + R.CSS_T5_TEL + CSS_19 + CSS_TITEMS)


# ================================================================ WA-Chats-Respuesta-19: la tarjeta, con un ítem por línea y el total
E_CH = ["Con ítems y el total", "Una pregunta que no se mostró"]
VAL_CH = [("Cliente", "Corralón El Puente"), ("¿Se concretó la venta?", "Sí"), ("Motivo", "Venta nueva"), ("Monto", "48.000,00"), ("Fecha de entrega", "20/10/2026"),
          (BLOQUE, items_chat(ITEMS["PED-000045"])), ("Total", "$ 143.000,00"), ("Observaciones", "Pidieron entrega el lunes.")]
VAL_NS = [("Cliente", "Obra Centro"), ("¿Se concretó la venta?", "No"), ("Motivo", "Seguimiento"), ("Monto", '<span class="vac">No se mostró</span>'), ("Fecha de entrega", "22/10/2026"),
          (BLOQUE, items_chat(ITEMS["PED-000044"])), ("Total", '<span class="vac">Sin respuesta</span>'), ("Observaciones", "Falta confirmar el flete.")]
HORAS = {E_CH[0]: "11:47", E_CH[1]: "11:04"}


def lista_chat(renglones):
    """La de antes, para quien todavía la usa."""
    return ('<div class="ln-t"><span class="ln-h">Producto</span><span class="ln-h r">Cantidad</span>' + "".join(f'<span>{p}</span><span class="r">{q}</span>' for p, _c, q in renglones) + "</div>")


def tarjetas(fn_t, burbuja):
    env = burbuja("Lucía Fernández · 10:51 · Leído").replace("Visita a cliente", FORM)

    def tarjeta(e, vals, num):
        return env + fn_t(A.grilla_r(vals) + A.r_ok(num), titulo=FORM).replace('<span class="pie">11:04</span>', f'<span class="pie">{HORAS[e]}</span>')
    return {E_CH[0]: tarjeta(E_CH[0], VAL_CH, "PED-000045"), E_CH[1]: tarjeta(E_CH[1], VAL_NS, "PED-000044")}


def chat():
    t = A.pagina_chat(E_CH, {e: A.escr() for e in E_CH}, tarjetas(A.tarjeta, A.burbuja), {}, {e: f"Respondió {FORM}" for e in E_CH}, HORAS, "WhatsApp · la respuesta · etapa 19")
    return L.con_css(t.replace("el formulario de la visita", "el pedido de materiales"), "e19", CSS_19 + CSS_ITEMS)


def tel_chat():
    t = A.pagina_tchat(E_CH, {e: A.t_escr() for e in E_CH}, tarjetas(A.t_tarjeta, A.t_burbuja), {}, "WhatsApp · la respuesta · teléfono · etapa 19",
                       A.CSS_AB + A.CSS_TRESP_AB + A.CSS_ARCH + CSS_19 + CSS_ITEMS)
    return t.replace("el formulario de la visita", "el pedido de materiales")


# ================================================================ FRM-Tablero-19: un monto, con su moneda
# Cierra con la planilla: 45 respuestas, y tres con total, las de la versión 3 que dijeron que sí (PED-000045, 43 y 41).
LLEGARON = [3, 0, 3, 2, 2, 2, 4, 1, 0, 3, 4, 2, 3, 4, 1, 0, 3, 4, 2, 2]
TOTALES = [0] * 17 + [298.75, 624.9, 143.0]
SEMANAS = [("21/09 al 27/09", 3), ("28/09 al 04/10", 14), ("05/10 al 11/10", 17), ("12/10 al 15/10", 11)]
VENTA = [("Sí", 32, 71), ("No", 13, 29)]
MOTIVO = [("Venta nueva", 25, 66), ("Reclamo", 7, 18), ("Seguimiento", 6, 16)]
QUIEN = [("Paula Méndez", 13, 29), ("Tomás Acosta", 11, 24), ("Florencia Fernández de la Fuente", 8, 18), ("Lucía Fernández", 6, 13), ("Martín Paz", 4, 9), ("Otras", 3, 7)]


def tablero(t):
    B, H_, O = L.barras, L.horizontales, L.OPCIONES
    # «Fallas» no es de este formulario: «Motivo» toma su lugar en el estado de agregar un gráfico
    motivo, fallas = L.tarjeta(*O["motivo"][:2], H_(O["motivo"][2])), L.tarjeta(*O["fallas"][:2], H_(O["fallas"][2]))
    sc = '<sc-if value="{{conFallas}}" hint-placeholder-val="{{si}}">'
    t = t.replace(motivo + sc + fallas + "</sc-if>", sc + motivo + "</sc-if>").replace(" Fallas</span>", " Motivo</span>")
    viejas = L.SEMANAS[3:] + L.SEMANAS[:3]
    for a, b in [(B(L.DIAS, L.LLEGARON), B(L.DIAS, LLEGARON)), (B(L.DIAS[-10:], L.LLEGARON[-10:], alto=110), B(L.DIAS[-10:], LLEGARON[-10:], alto=110)),
                 (B([s for s, _ in viejas], [n for _, n in viejas]), B([s for s, _ in SEMANAS], [n for _, n in SEMANAS])),
                 (B(L.DIAS, [round(x * 10) for x in L.MONTO], [L.plata(x) if x >= 150 else "" for x in L.MONTO]), B(L.DIAS, [round(x * 10) for x in TOTALES], [f"{round(x)} mil" if x else "" for x in TOTALES])),
                 (H_(O["venta"][2]), H_(VENTA)), (H_(O["motivo"][2]), H_(MOTIVO)), (H_(O["quien"][2]), H_(QUIEN)), ("Del catálogo Motivos de visita · cuántas veces salió cada opción", "Cuántas veces salió cada opción"),
                 ("Contar: total de Monto estimado", "Contar: suma de Total"), ("Total de Monto estimado", "Total"), ("Monto estimado, por día", "Total, por día"), ("De la pregunta Monto estimado · total", "De la pregunta Total · en pesos"),
                 ("<b>1.217.381,00</b>", "<b>$ 1.066.650,00</b>"), ("<b>1.217.381</b>", "<b>$ 1.066.650,00</b>"), ("promedio 50.724,21 · de 0,00 a 212.000,00", "promedio $ 355.550,00 · de $ 143.000,00 a $ 624.900,00"), ("promedio 50.724,21", "promedio $ 355.550,00"),
                 ("Visita a cliente", FORM), ("24 respuestas", "45 respuestas"), ("<b>24</b>", "<b>45</b>"), ('<span class="c">24</span>', '<span class="c">45</span>'), ("versión 4 publicada", "versión 3 publicada")]:
        t = t.replace(a, b)
    for x in ["Monto estimado", ">Fallas<", " Fallas<", "Motivos de visita", "1.217.381", "50.724"]:
        assert x not in t, x
    return L.con_css(t, "e19", ".tb-kpis { grid-template-columns: 220px minmax(0, 420px); }\n.tb-kpis.t2 { grid-template-columns: 104px minmax(0, 1fr); }\n.tb-kpi b { white-space: nowrap; }\n")


# ================================================================ Los teléfonos del editor
def t_bar():
    return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Formularios.dc.html">{F.TVOLVER}</a><div class="tit"><h1>{FORM}</h1><span class="sub">Publicado · versión 3</span></div>'
            f'<button type="button" class="ap-ib" aria-label="Acciones de {FORM}">{F.TKEBAB}</button></div>')


def t_bloque(t):
    """En la lista del teléfono, el recuadro «Preguntas de cada ítem» va debajo de la fila del bloque, a lo ancho, con las mismas acciones;
    «Agregar bloque» va al lado de «Agregar pregunta», apagado porque ya hay uno."""
    hijas = "".join(f'<div class="q-row"><span class="num">{K_BLOQUE}.{j}</span><span class="tx"><b>{n}</b><span>{d}</span></span>{E.q_acciones(n, j, len(HIJAS))}</div>'
                    for j, (n, d) in enumerate(HIJAS, 1))
    caja = f'<div class="t-blq-caja"><div class="t-blq-cab">Preguntas de cada ítem<a href="#">Agregar pregunta</a></div>{hijas}</div>'
    m = re.search(rf'<div class="q-row"><span class="num">{K_BLOQUE}</span>.*?</span></span>(?:<span class="q-acc">.*?</span>)</div>', t, re.S)
    assert m, "la fila del bloque"
    t = t[:m.end()] + caja + t[m.end():]
    t, n = re.subn(r'<div class="ap-gtit">Preguntas · \d+ preguntas<a href="#">Agregar</a>',
                   f'<div class="ap-gtit">Preguntas<span class="off" aria-disabled="true" title="{YA_HAY}">Agregar bloque</span><a href="#">Agregar pregunta</a>', t, count=1)
    assert n == 1, "la banda de preguntas"
    return t


def t_base():
    viejas = E.T_PREG
    E.T_PREG = list(PREG)
    try:
        return t_bloque(t_bar() + E.t_cuerpo(nombre=FORM, prefijo=PREFIJO) + E.t_fijo("cambios"))
    finally:
        E.T_PREG = viejas


LISTO = '<button type="button" class="cb cb-pri">Listo</button>'
CSS_T19 = """.t-cond { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--borde); border-radius: 12px; }
.lg-form { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 10px; border: 1px solid var(--borde2); border-radius: 12px; background: #fff; }
.lg-p { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 4px 10px; border-radius: 8px; background: var(--s2); font-size: 14.5px; }
.lg-p.op { padding: 0 4px; background: none; font-size: 18px; font-weight: 600; color: var(--t2); }
.lg-p .x { color: var(--t3); }
.lg-tb { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.lg-tb .cb { padding: 0; height: 44px; font-size: 17px; }
.lg-tcol { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-top: 1px solid var(--borde); font-size: 15.5px; }
.lg-tcol:first-of-type { border-top: 0; }
.lg-tcol small { font-size: 13.5px; color: var(--t3); }
.ap-gtit .off { margin-left: auto; margin-right: 16px; font-weight: 600; color: var(--t3); }
.ap-gtit .off + a { margin-left: 0; }
.t-blq-caja { margin: 0 12px 10px; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.t-blq-cab { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; background: oklch(0.945 0.018 76); font-size: 13.5px; font-weight: 600; color: var(--t2); }
.t-blq-cab a { color: var(--marca-tx); text-decoration: none; }
.t-blq-caja .q-row { border-top: 1px solid var(--borde); }
.t-blq-caja .q-row .num { width: auto; min-width: 26px; padding: 0 5px; box-sizing: border-box; }
.t-rango { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.t-rango .ap-i { color: var(--t3); }
.t-sub { font-size: 14px; font-weight: 600; color: var(--t2); }
"""
CSS_TEDITOR = A.CSS_TED + A.CSS_TCHAT_AB + E.CSS_E12 + E.CSS_TED_E12 + CSS_T19


def tel_condiciones():
    h = (F.tcampo("Pregunta", "Monto", req=True) + F.tcampo("Tipo de respuesta", "Número", select=True) + '<div class="p-tit2">Mostrar si</div><div class="t-cond">' + F.tcampo("Pregunta", "¿Se concretó la venta?", select=True)
         + F.tcampo("Condición", "es", select=True) + F.tcampo("Valor", "Sí", select=True) + f'</div><span class="t-mas">{MAS} Agregar condición</span>')
    return C.tel_pagina({"Mostrar si": t_base()}, ["Mostrar si"], {"Mostrar si": F.thoja("Monto", h, LISTO)}, "Mostrar si · teléfono", CSS_TEDITOR)


def tel_calculo():
    piezas = pieza(SUMA) + op("+") + pieza("Monto")
    barra_ops = '<div class="lg-tb">' + "".join(f'<button type="button" class="cb cb-sec">{s}</button>' for s in ["+", "−", "×", "÷", "(", ")"]) + "</div>"
    h = (F.tcampo("Pregunta", "Total", req=True) + '<div class="p-tit2">Fórmula</div>' + f'<div class="lg-form">{piezas}</div>' + f'<span class="t-mas">{MAS} Agregar dato</span>' + barra_ops
         + F.tcampo("Moneda", "Pesos (ARS)", select=True))
    return C.tel_pagina({"La fórmula": t_base()}, ["La fórmula"], {"La fórmula": F.thoja("Total", h, LISTO)}, "Cálculo · teléfono", CSS_TEDITOR)


def tel_lineas():
    """El bloque en el teléfono: la lista con su recuadro, el ✎ del bloque en una hoja y quitarlo, que pide confirmar."""
    est = ["El bloque", "Editar el bloque", "Quitar el bloque"]
    preguntas = '<div class="t-sub">Preguntas de cada ítem</div>' + "".join(f'<div class="lg-tcol">{n}<small>{d}</small></div>' for n, d in HIJAS) + f'<span class="t-mas">{MAS} Agregar pregunta</span>'
    h = (F.tcampo("Nombre", BLOQUE, req=True) + F.tcampo("Ayuda para quien lo recibe", "Opcional", vacio=True) + '<div class="t-sub">Ítems</div>'
         + '<div class="t-rango">' + F.tcampo("Mínimo", "1") + F.tcampo("Máximo", "10", extra=A.t_info(AY_MAX)) + "</div>" + preguntas)
    quitar = F.thoja("¿Quitar el bloque?", f'<p class="d-tx">Se quitan el bloque «{BLOQUE}» y sus 2 preguntas.</p>',
                     '<button type="button" class="cb cb-pel lleno">Quitar el bloque</button><button type="button" class="cb cb-sec">Cancelar</button>')
    capas = {"Editar el bloque": F.thoja(BLOQUE, h, LISTO), "Quitar el bloque": quitar}
    t = t_base()
    # El bloque, a la vista: sin el formulario de arriba
    t = re.sub(r'<div class="ap-gtit">El formulario</div><div class="f-campos">.*?</div>(?=<div class="ap-gtit">Preguntas)', "", t, count=1, flags=re.S)
    return C.tel_pagina({e: t for e in est}, est, capas, "El bloque · teléfono", CSS_TEDITOR)


# ================================================================ canvas.json: lo pone quien coordina el lienzo (la fila de cada uno, formularios_etapas_1004.py)
TITULOS = {"FRM-Editor-Condiciones": ("Formularios · mostrar si · etapa 19", 1440, 1500), "M-FRM-Editor-Condiciones": ("Mostrar si · teléfono · etapa 19", 390, 844),
           "FRM-Editor-Calculo": ("Formularios · la pregunta Cálculo · etapa 19", 1440, 1500), "M-FRM-Editor-Calculo": ("La pregunta Cálculo · teléfono · etapa 19", 390, 844),
           "FRM-Editor-Lineas": ("Formularios · el bloque · etapa 19", 1440, 1840), "M-FRM-Editor-Lineas": ("El bloque · teléfono · etapa 19", 390, 844),
           "FRM-Respuestas-19": ("Formularios · la planilla · etapa 19", 1440, 900), "M-FRM-Respuestas-19": ("La planilla · teléfono · etapa 19", 390, 844),
           "FRM-Respuesta-19": ("Formularios · una respuesta · etapa 19", 1440, 900), "M-FRM-Respuesta-19": ("Una respuesta · teléfono · etapa 19", 390, 844),
           "WA-Chats-Respuesta-19": ("WhatsApp · la respuesta · etapa 19", 1440, 900), "M-WA-Conversacion-Respuesta-19": ("WhatsApp · la respuesta · teléfono · etapa 19", 390, 844),
           "FRM-Tablero-19": ("Formularios · el tablero con un monto · etapa 19", 1440, 1500), "M-FRM-Tablero-19": ("El tablero con un monto · teléfono · etapa 19", 390, 844),
           "FRM-Publicar-19": ("Formularios · publicar · etapa 19", 1440, 1200)}


def registrar():
    """Solo a pedido (`--registrar`): canvas.json es de quien coordina el lienzo."""
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (titulo, w, h) in TITULOS.items():
        v = c["boards"].setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    fp = con_preguntas
    for n, f, alto, pestana in [("FRM-Editor-Condiciones", fp(condiciones), 1500, "diseno"), ("FRM-Editor-Calculo", fp(calculo), 1500, "diseno"), ("FRM-Editor-Lineas", fp(lineas), 1840, "diseno"),
                                ("FRM-Publicar-19", fp(publicar), 1200, "diseno"), ("FRM-Respuestas-19", respuestas, None, "respuestas"), ("FRM-Respuesta-19", detalle, None, "respuestas")]:
        t = enlaces(migas(L.sin_disenar(n, E.post(n, f(), alto))))
        if alto:
            t = L.con_css(t, "alto", f".w-app {{ height: {alto}px !important; }}\n")
        if pestana:
            L.FICHAS.setdefault(FORM, ("45", "FRM-Editor-Condiciones.dc.html", "M-FRM-Editor-Condiciones.dc.html"))
            t = enlaces(L.con_pestanas(t, pestana))
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    for n, f in [("M-FRM-Editor-Condiciones", tel_condiciones), ("M-FRM-Editor-Calculo", tel_calculo), ("M-FRM-Editor-Lineas", tel_lineas), ("M-FRM-Respuestas-19", tel_respuestas),
                 ("M-FRM-Respuesta-19", tel_respuesta), ("WA-Chats-Respuesta-19", chat), ("M-WA-Conversacion-Respuesta-19", tel_chat)]:
        (PROJ / f"{n}.dc.html").write_text(enlaces(E.post(n, f())), encoding="utf-8")
    (PROJ / "FRM-Tablero-19.dc.html").write_text(enlaces(tablero(L.leer("FRM-Tablero"))), encoding="utf-8")
    (PROJ / "M-FRM-Tablero-19.dc.html").write_text(enlaces(tablero(L.leer("M-FRM-Tablero"))), encoding="utf-8")
    if "--registrar" in sys.argv:
        registrar()
    print("tableros", list(TITULOS))
