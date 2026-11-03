"""La etapa 19, condiciones, cálculos y líneas (19-condiciones-calculos-y-lineas.md del back). No tiene equivalente en ArquitecturaBaseFront, salvo el editor de condiciones
de las reglas (`FormConditionsEditor`), del que sale «Mostrar si»: Pregunta, Condición, Valor, el tacho y «Agregar condición». Muestran solo lo que existe hasta la 19 (78):
sin «Cargar», aprobación, PDF ni asistente. Todo sale de los tableros aprobados de la 14 y la 15, con el formulario de ejemplo «Pedido de materiales».

Corre después de `formularios_18_archivos_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
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
import menus_y_solo_lectura_1004 as M  # noqa: E402

PROJ = F.PROJ
CHEV, MAS, TACHO = F.CHEV, A.MAS, M.IC["borrar"]
FORM, PREFIJO = "Pedido de materiales", "PED"
ARRIBA = "<svg"  # las flechas de una columna salen de E.acciones_q
TILDE = A.TILDE

# ================================================================ El formulario de ejemplo
PREG = [("Cliente", "Texto corto · Obligatoria"), ("¿Se concretó la venta?", "Sí o no · Obligatoria"), ("Motivo", "Elegir una · 3 opciones · Opcional"),
        ("Monto", "Número · 2 decimales · 1 condición · Opcional"), ("Fecha de entrega", "Fecha · Opcional"), ("Productos", "Grupo de líneas · 2 columnas · hasta 10 renglones · Obligatoria"),
        ("Total", "Cálculo · Pesos"), ("Observaciones", "Texto largo · Opcional")]
REC_PREV = "Las preguntas de archivo y de líneas, y un cálculo, no sirven para una condición."
AY_MOSTRAR = "La pregunta aparece si se cumplen todas las condiciones, hasta 10. Solo se usan las preguntas de arriba."
AY_FORMULA = "Se calcula al llegar la respuesta, con los valores que quedaron guardados. No se ve en WhatsApp."
AY_COLS = "Hasta 6 columnas. WhatsApp muestra un renglón debajo del otro, y los que sobran quedan vacíos."
AY_REN = "De 1 a 10. Cada celda cuenta en el tope de 50 componentes de WhatsApp."
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


def fila(k, mal=None):
    n, d = PREG[k - 1]
    t = A.fila_pregunta(k, n, d, False, None).replace(f"{d} · Opcional", d)
    if mal:
        t = t.replace('<div class="q-it">', '<div class="q-it mal">', 1).replace('<span class="chips">', '<span class="chips"><span class="ab-chip mal">Corregir</span>' + F.info(mal), 1)
    return t


def abierta(k, tipo, campos, oblig=False, mal=None):
    n = PREG[k - 1][0]
    return ('<div class="q-ab">' + fila(k, mal) + '<div class="q-ed">'
            f'<div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">{n}</div></div>'
            f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span><div class="ct sel">{tipo}{CHEV}</div></div>'
            + campos + '<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>'
            f'<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk">{"<i>" + TILDE + "</i>" if oblig else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}Obligatoria</span></div>'
            '<div class="q-pie ancho"><button type="button" class="cb cb-sec">Listo</button></div></div></div>')


def caja_preguntas(k_abierta=None, html="", mal=None, mal_k=None):
    filas = "".join(html if k == k_abierta else fila(k, mal if k == mal_k else None) for k in range(1, len(PREG) + 1))
    return (f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der"><button type="button" class="cb cb-sec">{MAS} Agregar título</button>'
            f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button></span></div>{filas}</div>')


def vista(cuerpo, ayuda=""):
    pv = E.vista()
    pv = re.sub(r'<div class="pv-hb">.*?</div><div class="pv-pie">', lambda m: f'<div class="pv-hb">{cuerpo}</div><div class="pv-pie">', pv, count=1, flags=re.S)
    pv = pv.replace(">Visita a cliente<", f">{FORM}<")
    if ayuda:
        pv = pv.replace('<span class="pv-tit2">Así lo ve el empleado</span>', '<span class="pv-tit2">Así lo ve el empleado' + F.info(ayuda) + "</span>", 1)
    return pv


PV_BASE = '<div class="pv-c">Cliente<div class="pv-in"></div></div><div class="pv-c">¿Se concretó la venta?<div class="pv-rd"><span class="on"><i></i>Sí</span><span><i></i>No</span></div></div>'
PV_MONTO = PV_BASE + '<div class="pv-c">Monto (opcional)<div class="pv-in"></div></div>'


def pv_renglon(n):
    return (f'<div class="pv-ren">Renglón {n}</div><div class="pv-c">Producto<div class="pv-in">Elegí una opción {CHEV}</div></div>'
            '<div class="pv-c">Cantidad<div class="pv-in"></div></div>')


PV_LINEAS = pv_renglon(1) + pv_renglon(2).replace("Producto<", "Producto (opcional)<").replace("Cantidad<", "Cantidad (opcional)<")


def cuerpo(k_abierta=None, html="", pv=PV_MONTO, ayuda="", mal=None, mal_k=None):
    return ('<div class="w-body"><div class="f-cols"><div class="f-pila">' + E.caja_formulario(nombre=FORM, prefijo=PREFIJO, modo="fijo")
            + caja_preguntas(k_abierta, html, mal, mal_k) + "</div>" + vista(pv, ayuda) + "</div></div>")


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
        return cuerpo(4, abierta(4, "Número", mostrar_si(filas, err)), mal=mal)
    V = {
        "Sí o no": monto(cond("¿Se concretó la venta?", "es", "Sí")),
        "Elegir una": monto(cond("Motivo", "es alguna de", chips=["Venta nueva", "Reclamo"])),
        "Número y fecha": cuerpo(8, abierta(8, "Texto largo", mostrar_si(cond("Monto", "es mayor o igual a", "100.000,00", numero=True) + cond("Fecha de entrega", "es igual o anterior a", "31/10/2026", numero=True)))),
        "Respondida o no": monto(cond("Cliente", "tiene respuesta")),
        "Una referencia rota": cuerpo(4, abierta(4, "Número", mostrar_si(cond("Pregunta quitada", "es", "Sí", mal=True), '<span class="err2" role="alert">Esa pregunta ya no está en el formulario. Elegí otra.</span>'), mal="La condición usa una pregunta que ya no está."), pv=PV_BASE),
        "Sin preguntas que sirvan": cuerpo(1, abierta(1, "Texto corto", mostrar_si("", apagado="No hay preguntas anteriores que sirvan."), oblig=True), pv=PV_BASE),
    }
    return A.pagina_editor({e: (BANDA(), V[e]) for e in E_COND}, {}, E_COND, "Editor · mostrar si", E.CSS_E12 + E.CSS_CA4 + CSS_19)


# ================================================================ FRM-Editor-Calculo
E_CALC = ["La fórmula", "Agregar un dato", "La suma de una columna", "Fórmula incompleta", "Un dato que ya no está"]
SUMA = "Suma de Productos · Cantidad × Precio"


def pieza(t, clase=""):
    return f'<span class="lg-p {clase}">{t}<span class="x" aria-hidden="true">×</span></span>'


def op(t):
    return f'<span class="lg-p op">{t}</span>'


def formula(piezas, err="", menu=False, mal=False):
    ops = "".join(f'<button type="button" class="cb cb-sec op" aria-label="{n}">{s}</button>' for s, n in [("+", "Sumar"), ("−", "Restar"), ("×", "Multiplicar"), ("÷", "Dividir"), ("(", "Abrir paréntesis"), (")", "Cerrar paréntesis")])
    m = ""
    if menu:
        m = ('<div class="f-menu" role="menu" aria-label="Agregar dato">' + "".join(f'<span class="f-mi" role="menuitem">{x}</span>' for x in ["Un número", "Una pregunta", "Un campo del catálogo", "La suma de una columna"]) + "</div>")
    return ('<div class="w-cmp ancho q-zona"><div class="zc"><span>Fórmula' + F.info(AY_FORMULA) + '</span></div><div class="zb lg-zb lg-z">'
            f'<div class="lg-form{" mal" if mal else ""}">{piezas}</div>{err}<div class="lg-bar"><button type="button" class="cb cb-sec" aria-haspopup="menu">{MAS} Agregar dato {CHEV}</button>{m}{ops}</div></div></div>')


def moneda():
    return ('<div class="w-cmp ancho"><span class="q-chk"><i>' + TILDE + '</i>Es un monto</span></div>'
            f'<div class="w-cmp"><span class="rt">Moneda</span><div class="ct sel">Pesos (ARS){CHEV}</div></div>'
            '<div class="w-cmp"><span class="rt">Decimales' + F.info("Los de la moneda.") + '</span><div class="ct ro">2</div></div>')


def calculo():
    def total(piezas, **k):
        return cuerpo(7, abierta(7, "Cálculo", formula(piezas, **k) + moneda()).replace('<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>', "").replace('<span class="q-chk"><i class="no"></i>Obligatoria</span>', ""),
                      pv=PV_MONTO + PV_LINEAS, ayuda="El cálculo no se ve en WhatsApp.")
    base = pieza(SUMA) + op("+") + pieza("Monto")
    dlg = F.dialogo("La suma de una columna", '<div class="lg-sub">' + sel("Grupo de líneas", "Productos") + sel("Columna", "Cantidad")
                    + sel("Multiplicar por", "Un campo del catálogo") + sel("Campo de «Productos»", "Precio") + "</div>",
                    '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Agregar</button>')
    V = {"La fórmula": total(base), "Agregar un dato": total(base, menu=True), "La suma de una columna": total(base),
         "Fórmula incompleta": total(pieza(SUMA) + op("+"), mal=True, err='<span class="err2" role="alert">Falta un dato después de «+».</span>'),
         "Un dato que ya no está": total(pieza(SUMA) + op("+") + pieza("Flete", "mal"), mal=True, err='<span class="err2" role="alert">«Flete» ya no está en el formulario. Quitalo o elegí otro.</span>')}
    return A.pagina_editor({e: (BANDA(), V[e]) for e in E_CALC}, {"La suma de una columna": dlg}, E_CALC, "Editor · cálculo", E.CSS_E12 + E.CSS_CA4 + CSS_19)


# ================================================================ FRM-Editor-Lineas
E_LIN = ["Las columnas", "Una columna de catálogo", "Seis columnas", "Cerca del tope de componentes"]


def col(n, tipo, ob, k, total, sub=""):
    chk = f'<span class="q-chk"><i>{TILDE}</i></span>' if ob else '<span class="q-chk"><i class="no"></i></span>'
    return (f'<div class="lg-col"><div class="ct">{n}</div><div class="ct">{tipo}{CHEV}</div>{chk}<span class="acc">{E.acciones_q(n, k == 1, k == total, editar=False)}</span>{sub}</div>')


def lineas():
    def grupo(cols, tope="10", cuenta="", apagado=False):
        filas = "".join(cols)
        boton = f'<button type="button" class="cb cb-sec"{" disabled title=" + chr(34) + "Hasta 6 columnas." + chr(34) if apagado else ""}>{MAS} Agregar columna</button>'
        return ('<div class="w-cmp ancho q-zona"><div class="zc"><span>Columnas' + F.info(AY_COLS) + '</span></div><div class="zb lg-zb lg-z"><div class="lg-cols"><div class="lg-colh"><span>Nombre</span><span>Tipo</span><span>Obligatoria</span><span class="sr">Acciones</span></div>'
                + filas + "</div>" + boton + "</div></div>"
                f'<div class="w-cmp ancho"><span class="rt">Hasta cuántos renglones{F.info(AY_REN)}</span><div class="lg-ren"><div class="ct">{tope}</div>{cuenta}</div></div>')

    def prod(sub=""):
        return col("Producto", "Elegir de un catálogo", True, 1, 2, sub)
    cant = col("Cantidad", "Número", True, 2, 2)
    seis = [col("Producto", "Elegir de un catálogo", True, 1, 6), col("Cantidad", "Número", True, 2, 6), col("Unidad", "Elegir una", False, 3, 6), col("Fecha pedida", "Fecha", False, 4, 6),
            col("Urgente", "Sí o no", False, 5, 6), col("Aclaración", "Texto", False, 6, 6)]
    sub = '<div class="lg-sub">' + sel("Catálogo", "Productos") + "</div>"

    def g(html, ):
        return cuerpo(6, abierta(6, "Grupo de líneas", html, oblig=True).replace('<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>', '<div class="w-cmp ancho"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>'), pv=PV_LINEAS)
    V = {"Las columnas": g(grupo([prod(), cant])), "Una columna de catálogo": g(grupo([prod(sub), cant])), "Seis columnas": g(grupo(seis, "3", apagado=True)),
         "Cerca del tope de componentes": g(grupo([prod(), cant], "10", '<span class="lg-cnt am">46 de 50 componentes</span>'))}
    return A.pagina_editor({e: (BANDA(), V[e]) for e in E_LIN}, {}, E_LIN, "Editor · grupo de líneas", E.CSS_E12 + E.CSS_CA4 + CSS_19)


# ================================================================ FRM-Publicar-19
E_PUB = ["Una condición que WhatsApp no puede mostrar", "Más de 50 componentes"]


def publicar():
    tit = "Publicar la versión 4 en WhatsApp"

    def dlg(problema):
        cuerpo = E.con_problemas(problema)
        for a, b in [(E.z_dato("Preguntas", "7"), E.z_dato("Preguntas", "8")), (E.z_dato("Agregadas", "Observaciones"), E.z_dato("Agregadas", "Productos y Total")), (E.z_dato("Cambiadas", "Motivo y Fallas"), E.z_dato("Cambiadas", "Monto"))]:
            assert a in cuerpo, a
            cuerpo = cuerpo.replace(a, b)
        return A.dlg_publicar(tit, cuerpo, E.pie_pub(activo=False))
    capas = {E_PUB[0]: dlg(E.z_problema("Observaciones", "WhatsApp no puede mostrar la condición «Monto es mayor o igual a 100.000,00».")),
             E_PUB[1]: dlg(E.z_problema("Productos", "El formulario usa 58 componentes, y WhatsApp admite 50. Bajá los renglones o las columnas."))}
    base = (E.banda(FORM, E.EST_PUB, E.acc("limpio"), E.VOL), cuerpo())
    return A.pagina_editor({e: base for e in E_PUB}, capas, E_PUB, "Publicar · etapa 19", E.CSS_E12 + E.CSS_CA4 + E.CSS_ZONAS + CSS_19)


# ================================================================ FRM-Respuestas-19
NS = R.gris("No se mostró")
COLS = [("num", "N°", 112, ""), ("cli", "Cliente", 160, ""), ("ven", "¿Se concretó la venta?", 170, ""), ("mon", "Monto", 110, "r"), ("pro", "Productos", 110, ""), ("tot", "Total", 130, "r"), ("obs", "Observaciones", 240, "")]
# n°, recibida, cliente, venta, monto, renglones, total, observaciones, versión. El total usa «Monto»: si no se mostró, queda «Sin respuesta».
RESP = [("PED-000045", "15/10/2026 11:47", "Corralón El Puente", "Sí", "48.000,00", "3 renglones", "$ 143.000,00", "Pidieron entrega el lunes.", 3),
        ("PED-000044", "15/10/2026 11:04", "Obra Centro", "No", NS, "2 renglones", None, "Falta confirmar el flete.", 3),
        ("PED-000043", "14/10/2026 17:02", "Distribuidora Norte", "Sí", "212.000,00", "5 renglones", "$ 624.900,00", "Firmaron el pedido de noviembre.", 3),
        ("PED-000042", "14/10/2026 09:30", "Ferretería Sur", "No", NS, "1 renglón", None, None, 3),
        ("PED-000041", "13/10/2026 15:30", "Ferretería Rosales", "Sí", "125.500,00", "4 renglones", "$ 298.750,00", "Cerramos el pedido de octubre.", 3),
        ("PED-000040", "13/10/2026 14:10", "Obra Centro", "No", NS, "1 renglón", None, None, 3),
        ("PED-000039", "13/10/2026 12:20", "Corralón El Puente", "Sí", "96.300,00", "—", "—", "Entrega parcial.", 2),
        ("PED-000038", "13/10/2026 11:04", "Ferretería Rosales", "No", None, "—", "—", None, 2),
        ("PED-000037", "12/10/2026 17:40", "Distribuidora Norte", "Sí", "54.200,00", "—", "—", "Falta un pallet.", 2),
        ("PED-000036", "12/10/2026 10:02", "Obra Centro", "No", None, "—", "—", "Visita de rutina.", 2)]


def celda(k, r):
    n, rec, cli, ven, mon, pro, tot, obs, _v = r
    if k == "num":
        return f'<span><a class="pl-num" href="FRM-Respuesta-19.dc.html">{n}</a></span>'
    v = {"rec": rec, "cli": cli, "ven": ven, "mon": mon, "pro": pro, "tot": tot, "obs": obs}[k]
    clase = ' class="r"' if k in ("mon", "tot") else ""
    return f"<span{clase}>{R.valor(v)}</span>"


def tabla(sel_=None):
    filas = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel_ else ""}">' + "".join(celda(k, r) for k, *_ in COLS) + "</div>" for r in RESP)
    return (f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(COLS)};"><div class="pl-scroll">{R.cabecera(COLS)}{filas}</div>'
            '<div class="w-pie"><span>1–10 de 45</span><span>10 por página · Página 1 de 5</span></div></div>')


def barra():
    return R.barra().replace("24 respuestas", "45 respuestas")


def fondo(sel_=None):
    return R.CUERPO.format(barra() + tabla(sel_))


def banda(ac=None):
    return R.banda(FORM, "Respuestas · versión 3 publicada", R.EXPORTAR if ac is None else ac)


def migas(t):
    return t.replace("Formularios / Visita a cliente", f"Formularios / {FORM}")


def mas_filtros():
    ops = ('<span class="mf-ops" role="listbox" aria-label="Respuesta"><span class="on" role="option">Todas</span><span role="option">Con respuesta<span class="cnt">27</span></span>'
           '<span role="option">Sin respuesta<span class="cnt">7</span></span><span role="option">No se mostró<span class="cnt">3</span></span><span role="option">La pregunta no existía<span class="cnt">8</span></span></span>')
    sec = f'<div class="mf-s"><span class="t">Monto</span><div class="mf-c"><span class="r">Respuesta</span><span class="mf-in sel">Todas {CHEV}</span>{ops}</div></div>'
    t = R.mas_filtros().replace("24 respuestas", "45 respuestas")
    t = re.sub(r'<div class="mf-s"><span class="t">Monto estimado</span>.*?(?=<div class="mf-s">)', "", t, count=1, flags=re.S)
    marca = '<div class="mf-s"><span class="t">Fallas</span>'
    assert t.count(marca) == 1
    t = re.sub(r'<div class="mf-s"><span class="t">Fallas</span>.*?(?=<div class="mf-s">)', "", t, count=1, flags=re.S)
    marca = '<div class="mf-s"><span class="t">¿Se concretó la venta?</span>'
    assert t.count(marca) == 1
    t = t.replace(marca, sec + marca).replace('<span class="t">Fecha de la visita</span>', '<span class="t">Fecha de entrega</span>')
    t, n = re.subn(r'<span class="mf-ck dos" role="checkbox" aria-checked="false"><span class="bx"></span><span class="tx"><span>Visita técnica.*?</small></span></span>', "", t, count=1)
    assert n == 1
    # Las versiones de abajo para arriba, para no pisarlas
    for texto, antes, nuevo, ahora in [("Seguimiento", 9, "Seguimiento", 6), ("Venta nueva", 11, "Venta nueva", 25), ("Reclamo", 4, "Reclamo", 7), ("Sí", 12, "Sí", 32), ("No", 10, "No", 13),
                                       ("Paula Méndez", 7, "Paula Méndez", 13), ("Tomás Acosta", 6, "Tomás Acosta", 11), ("Florencia Fernández de la Fu…", 4, "Florencia Fernández de la Fu…", 8),
                                       ("Lucía Fernández", 3, "Lucía Fernández", 6), ("Martín Paz", 2, "Martín Paz", 4), ("Marta Gil", 1, "Marta Gil", 2),
                                       ("Versión 2", 4, "Versión 1", 8), ("Versión 3", 8, "Versión 2", 31), ("Versión 4", 12, "Versión 3", 6)]:
        a = f'<span>{texto}</span><small>{antes} {"respuesta" if antes == 1 else "respuestas"}</small>'
        assert a in t, a
        t = t.replace(a, f'<span>{nuevo}</span><small>{ahora} respuestas</small>')
    return t


CSS_MF = """.mf-ops { display: flex; flex-direction: column; margin-top: 4px; padding: 4px; border: 1px solid var(--borde); border-radius: 8px; background: #fff; }
.mf-ops > span { display: flex; justify-content: space-between; gap: 12px; padding: 7px 10px; border-radius: 6px; font-size: 13.5px; }
.mf-ops > span.on { background: var(--s2); font-weight: 600; }
.mf-ops .cnt { color: var(--t3); font-weight: 400; font-variant-numeric: tabular-nums; }
"""
E_PL = ["Planilla", "Más filtros"]


def respuestas():
    capas = A.con_estados([("Planilla", ""), ("Más filtros", mas_filtros())])
    t = R.pagina("Respuestas · /org/formularios/:id/respuestas · etapa 19", A.con_estados([(e, banda()) for e in E_PL]), A.con_estados([(e, fondo()) for e in E_PL]), E_PL,
                 css=P.CSS_MF + R.CSS_MF2 + CSS_MF + CSS_19)
    return migas(F.con_dialogo(t, capas))


def enlaces(t):
    for a, b in [("FRM-Respuesta.dc.html", "FRM-Respuesta-19.dc.html"), ("FRM-Respuesta-Completa.dc.html", "FRM-Respuesta-19.dc.html"), ("FRM-Respuestas-Filtros.dc.html", "FRM-Respuestas-19.dc.html"),
                 ("FRM-Respuestas.dc.html", "FRM-Respuestas-19.dc.html"), ("WA-Chats-Respuesta.dc.html", "WA-Chats-Respuesta-19.dc.html"), ("FRM-Tablero.dc.html", "FRM-Tablero-19.dc.html"),
                 ("FRM-Editor.dc.html", "FRM-Editor-Condiciones.dc.html"), ("FRM-Publicar.dc.html", "FRM-Publicar-19.dc.html"), ("FRM-Publicando.dc.html", "FRM-Publicar-19.dc.html"),
                 ("M-FRM-Respuesta.dc.html", "M-FRM-Respuesta-19.dc.html"), ("M-WA-Conversacion-Respuesta.dc.html", "M-WA-Conversacion-Respuesta-19.dc.html"),
                 ("M-FRM-Respuestas.dc.html", "M-FRM-Respuestas-19.dc.html"), ("M-FRM-Tablero.dc.html", "M-FRM-Tablero-19.dc.html"), ("M-FRM-Editor.dc.html", "M-FRM-Editor-Condiciones.dc.html")]:
        t = t.replace(f'"{a}"', f'"{b}"')
    return t


# ================================================================ FRM-Respuesta-19: la vista rápida y la pantalla completa
RENGLONES = [("Caño de 1/2 pulgada", "$ 4.200,00", "10"), ("Codo de 90°", "$ 850,00", "40"), ("Cinta de teflón", "$ 950,00", "20")]
E_D = ["Respuesta", "Un cálculo sin respuesta", "Pantalla completa"]


def ln_tabla(renglones):
    return ('<div class="ln-t"><span class="ln-h">Producto</span><span class="ln-h r">Cantidad</span>'
            + "".join(f'<span>{p}<small>Precio: {c}</small></span><span class="r">{q}</span>' for p, c, q in renglones) + "</div>")


def valores_si():
    """10 × 4.200 + 40 × 850 + 20 × 950 = 95.000, más los 48.000 de «Monto»."""
    return [("Cliente", "Corralón El Puente"), ("¿Se concretó la venta?", "Sí"), ("Motivo", "Venta nueva"), ("Monto", "48.000,00"), ("Fecha de entrega", "20/10/2026"), ("Productos", ln_tabla(RENGLONES)),
            ("Total", "$ 143.000,00"), ("Observaciones", "Pidieron entrega el lunes.")]


def valores_no():
    return [("Cliente", "Obra Centro"), ("¿Se concretó la venta?", "No"), ("Motivo", "Seguimiento"), ("Monto", '<span class="vac">No se mostró</span>'), ("Fecha de entrega", "22/10/2026"), ("Productos", ln_tabla(RENGLONES[:2])), ("Total", None), ("Observaciones", "Falta confirmar el flete.")]


def detalle():
    aside = R.d2("PED-000045", FORM, 3, valores_si(), "Tomás Acosta", "15/10/2026 11:47", primera=True, pos="1 de 10")
    sin = R.d2("PED-000044", FORM, 3, valores_no(), "Tomás Acosta", "15/10/2026 11:04", pos="2 de 10")
    capas = A.con_estados([("Respuesta", aside), ("Un cálculo sin respuesta", sin), ("Pantalla completa", "")])
    rc = R.rc_cuerpo(valores_si(), [("15/10/2026 11:47", "La respondió Tomás Acosta por WhatsApp"), ("15/10/2026 10:51", "Se la mandó Lucía Fernández")], resumen="8 preguntas · 8 respondidas")
    bnd = {"Pantalla completa": R.rc_banda("PED-000045", "Versión 3 · recibida el 15/10/2026 11:47", "1 de 10", primera=True)}
    cu = {"Respuesta": fondo("PED-000045"), "Un cálculo sin respuesta": fondo("PED-000044"), "Pantalla completa": rc}
    t = R.pagina("Respuesta · etapa 19", A.con_estados([(e, bnd.get(e, banda())) for e in E_D]), A.con_estados([(e, cu[e]) for e in E_D]), E_D,
                 css=F.CSS_GRILLA + P.CSS_D2 + R.CSS_DET + R.CSS_RC + ".d2-h a.nv { text-decoration: none; }\n" + CSS_19)
    k = t.rindex("</div>\n</x-dc>")
    return migas(t[:k] + capas + t[k:])


# ================================================================ Los teléfonos de la planilla y la respuesta
def tel_respuestas():
    def fila_t(r):
        n, rec, cli, ven, mon, pro, tot, *_x = r
        mon_t = "No se mostró" if mon == NS else (mon or "Sin respuesta")
        l3 = " · ".join(x for x in [None if pro == "—" else pro, None if tot == "—" else (tot or "Sin respuesta")] if x)
        return (f'<a class="ap-fila" href="M-FRM-Respuesta-19.dc.html"><div class="tx"><span class="l1">{n}<span class="hr">{rec}</span></span>'
                f'<span class="l2">{cli} · Monto: {mon_t}</span><span class="l3">{l3 or "—"}</span></div></a>')
    cuerpo_t = {"Respuestas": C.t_bar(FORM, "45 respuestas", "M-FRM-Formularios.dc.html", f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>')
                + '<div class="ap-cuerpo">' + "".join(fila_t(r) for r in RESP) + "</div>"}
    return C.tel_pagina(cuerpo_t, ["Respuestas"], {}, "Respuestas · teléfono · etapa 19", P.CSS_TPL + R.CSS_T15)


def tel_respuesta():
    def uno(num, vals):
        grilla = "".join(f'<div class="f"><span class="k">{k}</span>' + (f"<span>{v}</span>" if v is not None else '<span class="vac">Sin respuesta</span>') + "</div>" for k, v in vals)
        return (C.t_bar(num, f"{FORM} · versión 3", "M-FRM-Respuestas-19.dc.html")
                + '<div class="tr-scroll"><div class="tr-sec"><button type="button" class="h" aria-expanded="true">Respuesta<span class="fl ab">' + CHEV + f'</span></button><div class="tr-gr">{grilla}</div></div></div>')
    estados = ["Respuesta", "Un cálculo sin respuesta"]
    cu = {estados[0]: uno("PED-000045", valores_si()), estados[1]: uno("PED-000044", valores_no())}
    return C.tel_pagina(cu, estados, {}, "Respuesta · teléfono · etapa 19", P.CSS_TPL + R.CSS_T15 + CSS_19 + ".tr-gr .ln-t { font-size: 14.5px; }\n")


# ================================================================ WA-Chats-Respuesta-19: la tarjeta, con los renglones y el total
E_CH = ["Con renglones y el total", "Una pregunta que no se mostró"]


def lista_chat(renglones):
    return ('<div class="ln-t"><span class="ln-h">Producto</span><span class="ln-h r">Cantidad</span>' + "".join(f'<span>{p}</span><span class="r">{q}</span>' for p, _c, q in renglones) + "</div>")


VAL_CH = [("Cliente", "Corralón El Puente"), ("¿Se concretó la venta?", "Sí"), ("Motivo", "Venta nueva"), ("Monto", "48.000,00"), ("Fecha de entrega", "20/10/2026"), ("Productos", lista_chat(RENGLONES)), ("Total", "$ 143.000,00"),
          ("Observaciones", "Pidieron entrega el lunes.")]
VAL_NS = [("Cliente", "Obra Centro"), ("¿Se concretó la venta?", "No"), ("Motivo", "Seguimiento"), ("Monto", '<span class="vac">No se mostró</span>'), ("Fecha de entrega", "22/10/2026"), ("Productos", lista_chat(RENGLONES[:2])),
          ("Total", '<span class="vac">Sin respuesta</span>'), ("Observaciones", "Falta confirmar el flete.")]
HORAS = {E_CH[0]: "11:47", E_CH[1]: "11:04"}


def tarjetas(fn_t, burbuja):
    env = burbuja("Lucía Fernández · 10:51 · Leído").replace("Visita a cliente", FORM)

    def tarjeta(e, vals, num):
        return env + fn_t(A.grilla_r(vals) + A.r_ok(num), titulo=FORM).replace('<span class="pie">11:04</span>', f'<span class="pie">{HORAS[e]}</span>')
    return {E_CH[0]: tarjeta(E_CH[0], VAL_CH, "PED-000045"), E_CH[1]: tarjeta(E_CH[1], VAL_NS, "PED-000044")}


def chat():
    t = A.pagina_chat(E_CH, {e: A.escr() for e in E_CH}, tarjetas(A.tarjeta, A.burbuja), {}, {e: f"Respondió {FORM}" for e in E_CH}, HORAS, "WhatsApp · la respuesta · etapa 19")
    return L.con_css(t.replace("el formulario de la visita", "el pedido de materiales"), "e19", CSS_19)


def tel_chat():
    t = A.pagina_tchat(E_CH, {e: A.t_escr() for e in E_CH}, tarjetas(A.t_tarjeta, A.t_burbuja), {}, "WhatsApp · la respuesta · teléfono · etapa 19", A.CSS_AB + A.CSS_TRESP_AB + A.CSS_ARCH + CSS_19)
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
    B, H, O = L.barras, L.horizontales, L.OPCIONES
    # «Fallas» no es de este formulario: «Motivo» toma su lugar en el estado de agregar un gráfico
    motivo, fallas = L.tarjeta(*O["motivo"][:2], H(O["motivo"][2])), L.tarjeta(*O["fallas"][:2], H(O["fallas"][2]))
    sc = '<sc-if value="{{conFallas}}" hint-placeholder-val="{{si}}">'
    t = t.replace(motivo + sc + fallas + "</sc-if>", sc + motivo + "</sc-if>").replace(" Fallas</span>", " Motivo</span>")
    viejas = L.SEMANAS[3:] + L.SEMANAS[:3]
    for a, b in [(B(L.DIAS, L.LLEGARON), B(L.DIAS, LLEGARON)), (B(L.DIAS[-10:], L.LLEGARON[-10:], alto=110), B(L.DIAS[-10:], LLEGARON[-10:], alto=110)),
                 (B([s for s, _ in viejas], [n for _, n in viejas]), B([s for s, _ in SEMANAS], [n for _, n in SEMANAS])),
                 (B(L.DIAS, [round(x * 10) for x in L.MONTO], [L.plata(x) if x >= 150 else "" for x in L.MONTO]), B(L.DIAS, [round(x * 10) for x in TOTALES], [f"{round(x)} mil" if x else "" for x in TOTALES])),
                 (H(O["venta"][2]), H(VENTA)), (H(O["motivo"][2]), H(MOTIVO)), (H(O["quien"][2]), H(QUIEN)), ("Del catálogo Motivos de visita · cuántas veces salió cada opción", "Cuántas veces salió cada opción"),
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


def t_base():
    viejas = E.T_PREG
    E.T_PREG = list(PREG)
    try:
        return t_bar() + E.t_cuerpo(nombre=FORM, prefijo=PREFIJO) + E.t_fijo("cambios")
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
"""


def tel_condiciones():
    h = (F.tcampo("Pregunta", "Monto", req=True) + F.tcampo("Tipo de respuesta", "Número", select=True) + '<div class="p-tit2">Mostrar si</div><div class="t-cond">' + F.tcampo("Pregunta", "¿Se concretó la venta?", select=True)
         + F.tcampo("Condición", "es", select=True) + F.tcampo("Valor", "Sí", select=True) + f'</div><span class="t-mas">{MAS} Agregar condición</span>')
    return C.tel_pagina({"Mostrar si": t_base()}, ["Mostrar si"], {"Mostrar si": F.thoja("Monto", h, LISTO)}, "Mostrar si · teléfono", A.CSS_TED + A.CSS_TCHAT_AB + E.CSS_E12 + E.CSS_TED_E12 + CSS_T19)


def tel_calculo():
    piezas = pieza(SUMA) + op("+") + pieza("Monto")
    barra_ops = '<div class="lg-tb">' + "".join(f'<button type="button" class="cb cb-sec">{s}</button>' for s in ["+", "−", "×", "÷", "(", ")"]) + "</div>"
    h = (F.tcampo("Pregunta", "Total", req=True) + '<div class="p-tit2">Fórmula</div>' + f'<div class="lg-form">{piezas}</div>' + f'<span class="t-mas">{MAS} Agregar dato</span>' + barra_ops
         + F.tcampo("Moneda", "Pesos (ARS)", select=True))
    return C.tel_pagina({"La fórmula": t_base()}, ["La fórmula"], {"La fórmula": F.thoja("Total", h, LISTO)}, "Cálculo · teléfono", A.CSS_TED + A.CSS_TCHAT_AB + E.CSS_E12 + E.CSS_TED_E12 + CSS_T19)


def tel_lineas():
    cols = '<div class="lg-tcol">Producto<small>Elegir de un catálogo · Obligatoria</small></div><div class="lg-tcol">Cantidad<small>Número · Obligatoria</small></div>'
    h = (F.tcampo("Pregunta", "Productos", req=True) + '<div class="p-tit2">Columnas</div>' + cols + f'<span class="t-mas">{MAS} Agregar columna</span>' + F.tcampo("Hasta cuántos renglones", "10"))
    return C.tel_pagina({"Las columnas": t_base()}, ["Las columnas"], {"Las columnas": F.thoja("Productos", h, LISTO)}, "Grupo de líneas · teléfono", A.CSS_TED + A.CSS_TCHAT_AB + E.CSS_E12 + E.CSS_TED_E12 + CSS_T19)


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Editor-Condiciones": ("Formularios · mostrar si · etapa 19", 1440, 1500), "M-FRM-Editor-Condiciones": ("Mostrar si · teléfono · etapa 19", 390, 844),
           "FRM-Editor-Calculo": ("Formularios · la pregunta Cálculo · etapa 19", 1440, 1500), "M-FRM-Editor-Calculo": ("La pregunta Cálculo · teléfono · etapa 19", 390, 844),
           "FRM-Editor-Lineas": ("Formularios · el grupo de líneas · etapa 19", 1440, 1840), "M-FRM-Editor-Lineas": ("El grupo de líneas · teléfono · etapa 19", 390, 844),
           "FRM-Respuestas-19": ("Formularios · la planilla · etapa 19", 1440, 900), "M-FRM-Respuestas-19": ("La planilla · teléfono · etapa 19", 390, 844),
           "FRM-Respuesta-19": ("Formularios · una respuesta · etapa 19", 1440, 900), "M-FRM-Respuesta-19": ("Una respuesta · teléfono · etapa 19", 390, 844),
           "WA-Chats-Respuesta-19": ("WhatsApp · la respuesta · etapa 19", 1440, 900), "M-WA-Conversacion-Respuesta-19": ("WhatsApp · la respuesta · teléfono · etapa 19", 390, 844),
           "FRM-Tablero-19": ("Formularios · el tablero con un monto · etapa 19", 1440, 1500), "M-FRM-Tablero-19": ("El tablero con un monto · teléfono · etapa 19", 390, 844),
           "FRM-Publicar-19": ("Formularios · publicar · etapa 19", 1440, 1200)}


def registrar():
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
    for n, f in [("M-FRM-Editor-Condiciones", tel_condiciones), ("M-FRM-Editor-Calculo", tel_calculo), ("M-FRM-Editor-Lineas", tel_lineas), ("M-FRM-Respuestas-19", tel_respuestas), ("M-FRM-Respuesta-19", tel_respuesta),
                 ("WA-Chats-Respuesta-19", chat), ("M-WA-Conversacion-Respuesta-19", tel_chat)]:
        (PROJ / f"{n}.dc.html").write_text(enlaces(E.post(n, f())), encoding="utf-8")
    (PROJ / "FRM-Tablero-19.dc.html").write_text(enlaces(tablero(L.leer("FRM-Tablero"))), encoding="utf-8")
    (PROJ / "M-FRM-Tablero-19.dc.html").write_text(enlaces(tablero(L.leer("M-FRM-Tablero"))), encoding="utf-8")
    registrar()
    print("tableros", list(TITULOS))
