"""La etapa 21, segunda parte (21-reglas-y-aprobacion.md del back): la planilla con «Estado» y quien solo aprueba (100), el tablero con «Por estado»,
corregir y anular (91 a 93), lo propio con el estado, el PDF y el motivo del rechazo (85), la pregunta «Correo» en el editor y en la carga desde la web,
y lo que se conserva al dar de baja. Usa la planilla, la vista rápida y los datos de `formularios_21_reglas_1004.py`, y la carga de la 20. Corregir y
anular todavía no existen en ArquitecturaBase: se dibujan con la spec y nuestras piezas (108). La campana de la 21 la arma `campana_1004.py`.

Corre después de `formularios_21_reglas_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
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
import formularios_19_logica_1004 as X  # noqa: E402
import formularios_20_carga_1004 as W  # noqa: E402
import formularios_21_reglas_1004 as K  # noqa: E402

PROJ = F.PROJ
CHEV, MAS, TILDE, CERRAR, CHECK = F.CHEV, A.MAS, A.TILDE, F.X, K.CHECK
FORM, SUP = K.FORM, K.SUP
info = F.info
TOMAS, LUCIA, MARTIN = "Tomás Acosta", "Lucía Fernández", "Martín Paz"
ANULADA = ("VIS-000119", "11/10/2026 16:12", TOMAS, "", "WhatsApp", "Ferretería Rosales", "125.500,00", "Venta nueva")
MOTIVO_ANULAR = "Se cargó dos veces."
FILA_127 = next(r for r in K.FILAS if r[0] == "VIS-000127")
POR_APROBAR = [r for r in K.FILAS if K.ESTADO[r[0]] == "Por aprobar"]
HACE = {"VIS-000130": "hace 2 horas", "VIS-000127": "hace 1 día", "VIS-000123": "hace 2 días"}
KEBAB = A.KEBAB

CSS_R21 = """.d2-h .e-kw { position: relative; }
.d2-h .f-menu { position: absolute; top: calc(100% + 6px); right: 0; left: auto; z-index: 30; min-width: 240px; }
.d2-h .f-mi.pel { color: var(--peligro); }
.d2-h .f-mi.off { color: var(--t3); }
.d2-solo { display: flex; flex-direction: column; gap: 8px; padding: 6px 0; font-size: 14px; color: var(--t2); }
.co-ant { font-size: 12.5px; color: var(--t3); }
.co-ant b { font-weight: 600; color: var(--t2); text-decoration: line-through; }
.cg-q .q-ch { display: flex; flex-wrap: wrap; gap: 8px 16px; min-height: 36px; align-items: center; font-size: 14px; }
.w-dlg.anu { width: 520px; }
.w-dlg.anu .ct.area { min-height: 80px; }
.w-dlg.exa { width: 560px; }
.w-dlg.exa .d-tx { margin-bottom: 4px; }
.w-dlg .q-chk { font-size: 14px; }
.rc-ban { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; border: 1px solid oklch(0.85 0.08 85); background: oklch(0.97 0.04 85); font-size: 14px; color: oklch(0.36 0.08 70); }
.rc-ban a { margin-left: auto; font-weight: 600; color: var(--marca-tx); text-decoration: none; white-space: nowrap; }
.rc-moms { margin: 0; }
.w-body > .d2-moms { margin: 0; background: #fff; }
.w-bnd .ac .e-kw { position: relative; }
.w-bnd .ac .f-menu { position: absolute; top: calc(100% + 6px); right: 0; left: auto; z-index: 30; min-width: 240px; }
"""


# ================================================================ Lo común: el ⋮ de una respuesta (Corregir, el PDF y, al final, Anular)
def menu_respuesta(num, corregir="", anular="", pdf=False):
    """Corregir y Anular, con su motivo si están apagados (43); Anular va al final (92)."""
    def item(texto, motivo, clase=""):
        if motivo:
            return f'<span class="f-mi off" role="menuitem" aria-disabled="true" title="{motivo}">{texto}<small class="ab-sub" style="display: block;">{motivo}</small></span>'
        return f'<span class="f-mi{" " + clase if clase else ""}" role="menuitem">{texto}</span>'
    d = f'<span class="f-mi" role="menuitem">{K.DESCARGAR} Descargar el PDF</span>' if pdf else ""
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de {num}">{item("Corregir", corregir)}{d}<span class="sep" role="separator"></span>'
            f'{item("Anular", anular, "pel")}</div>')


def con_kebab(vista, num, menu=""):
    """La vista rápida suma ⋮ antes de ↑ ↓."""
    k = (f'<span class="e-kw"><button type="button" class="ib" aria-label="Acciones de {num}" aria-haspopup="menu" aria-expanded="{"true" if menu else "false"}">{KEBAB}</button>{menu}</span>')
    marca = '<button type="button" class="nv" aria-label="Respuesta anterior"'
    assert marca in vista
    return vista.replace(marca, k + marca, 1)


def sin_botones(momentos):
    return momentos.replace(K.botones(), "")


CSS = K.CSS_PL + CSS_R21


def planilla(estados, bnd, cu, capas, titulo):
    t = R.pagina(titulo, A.con_estados([(e, bnd[e]) for e in estados]), A.con_estados([(e, cu[e]) for e in estados]), estados, css=CSS)
    if capas:
        k = t.rindex("</div>\n</x-dc>")
        t = t[:k] + A.con_estados([(e, capas.get(e, "")) for e in estados]) + t[k:]
    return t


def quien_mira(t, regla):
    """El usuario según el estado: `regla` es una expresión de JS sobre `e`, el estado, que dice cuándo mira otra persona."""
    otra, ini, correo = regla[1], regla[1][0], regla[2]
    t = t.replace('<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>',
                  '<div class="w-us"><span class="w-av">{{yoIni}}</span><span class="tx"><b>{{yo}}</b><span>{{yoCorreo}}</span></span></div>')
    t = re.sub(r'(<summary class="um"[^>]*>)<span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b>', r'\1<span class="w-av">{{yoIni}}</span><span class="tx"><b>{{yo}}</b>', t, count=1)
    gancho = "      si: true, no: false,\n"
    assert gancho in t
    js = (f"      yo: ({regla[0]}) ? '{otra}' : 'Lucía Fernández', yoIni: ({regla[0]}) ? '{ini}' : 'L', "
          f"yoCorreo: ({regla[0]}) ? '{correo}' : 'lucia.fernandez@delta.ejemplo.com',\n")
    return t.replace(gancho, gancho + js, 1)


# ================================================================ FRM-Respuestas-21: «Estado», la cola y quien solo aprueba (100)
E_PL = ["Planilla", "Estado: menú", "Estado: Por aprobar", "Estado: Anulada", "Desde la campana", "Quien solo aprueba", "Quien solo aprueba: la decisión", "Quien solo aprueba: confirmar"]
COLS_COLA = [("num", "N°", 120, ""), ("rec", "Recibida", 150, ""), ("esp", "Por aprobar desde", 170, "")]


def cola(sel=None):
    """La cola de quien solo aprueba: el número y la fecha, sin los valores ni quién la cargó (100)."""
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}"><span><a class="pl-num" href="FRM-Respuestas-21.dc.html">{r[0]}</a></span><span>{r[1]}</span><span>{HACE[r[0]]}</span></div>'
                for r in sorted(POR_APROBAR, key=lambda r: r[0]))
    return (f'<div class="w-body sin-tabs"><div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(COLS_COLA)};"><div class="pl-scroll">{R.cabecera(COLS_COLA)}{h}</div>'
            '<div class="w-pie"><span>1–3 de 3</span><span>10 por página · Página 1 de 1</span></div></div></div>')


def vista_sola(num="VIS-000123"):
    r = next(x for x in K.FILAS if x[0] == num)
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)" disabled>{K.SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{K.BAJA}</button>')
    momentos = K.mom("", CHECK, "Recibida", r[1]) + K.mom("esp", K.RELOJ, "Por aprobar", HACE[num], f"Lo aprueba alguien con el rol {SUP}", K.botones(), "esp")
    return (f'<aside class="d2" role="region" aria-label="Detalle de la respuesta"><div class="d2-h"><b>{num}</b>{K.CHIP["Por aprobar"]}{nav}'
            f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{CERRAR}</button></div><div class="d2-sub"><span>{FORM} · versión 4</span></div>'
            f'<div class="d2-moms">{momentos}</div><div class="d2-b"><div class="d2-solo">No tenés permiso para ver las respuestas de este formulario: decidís con el número y la fecha.</div></div>'
            '<div class="d2-pie">1 de 3 por aprobar</div></aside>')


def respuestas():
    sel_p = POR_APROBAR
    vieja = next(r for r in K.FILAS if r[0] == "VIS-000123")
    desde = con_kebab(K.vista("VIS-000123", K.CHIP["Por aprobar"], K.moms("pend", quien=TOMAS, hora=vieja[1], hace=HACE["VIS-000123"]), K.con_fotos(R.VALORES_123, 0, False),
                              fotos=0, pos="1 de 3 por aprobar"), "VIS-000123")
    cu = {"Planilla": K.fondo(), "Estado: menú": K.fondo(estado="menu"),
          "Estado: Por aprobar": K.fondo(sel_p, estado="Por aprobar", pie="1–3 de 3", pag="Página 1 de 1"),
          "Estado: Anulada": K.fondo([ANULADA], estado="Anulada", pie="1 de 1", pag="Página 1 de 1", estados={ANULADA[0]: "Anulada"}),
          "Desde la campana": K.fondo(sel="VIS-000123"), "Quien solo aprueba": cola(), "Quien solo aprueba: la decisión": cola("VIS-000123"), "Quien solo aprueba: confirmar": cola("VIS-000123")}
    solo = R.banda(FORM, "Por aprobar · 3", "").replace('href="FRM-Formularios.dc.html"', 'href="FRM-Formularios-21.dc.html"')
    bnd = {e: (solo if e.startswith("Quien solo aprueba") else K.banda_p()) for e in E_PL}
    capas = {"Desde la campana": desde, "Quien solo aprueba: la decisión": vista_sola(), "Quien solo aprueba: confirmar": vista_sola() + K.sobre(K.dlg_aprobar("VIS-000123", hora=vieja[1], solo=True))}
    t = planilla(E_PL, bnd, cu, capas, "Respuestas · /org/formularios/:id/respuestas · etapa 21")
    return quien_mira(t, ("e.startsWith('Quien solo aprueba')", MARTIN, "martin.paz@delta.ejemplo.com"))


# ================================================================ FRM-Tablero-21: «Por estado», sin las anuladas
POR_ESTADO = ("Por estado", "Cuántas hay en cada estado · sin las anuladas", [("Aprobada", 15, 62), ("Recibida", 4, 17), ("Por aprobar", 3, 13), ("Rechazada", 2, 8)])


def con_estado(t):
    venta = '<div class="tb-card"><div class="tb-cab"><span><b>¿Se concretó la venta?</b>'
    assert venta in t, "la tarjeta de «¿Se concretó la venta?»"
    return t.replace(venta, L.tarjeta(POR_ESTADO[0], POR_ESTADO[1], L.horizontales(POR_ESTADO[2])) + venta, 1)


def tablero():
    t = con_estado((PROJ / "FRM-Tablero.dc.html").read_text(encoding="utf-8"))
    return re.sub(r'<div class="f-tabs" role="tablist"[^>]*>.*?</div>', K.tabs("tablero"), t, flags=re.S)


def tel_tablero():
    t = con_estado((PROJ / "M-FRM-Tablero.dc.html").read_text(encoding="utf-8"))
    t = re.sub(r'<div class="f-ptabs" role="tablist"[^>]*>.*?</div>', K.tabs("tablero", True), t, flags=re.S)
    return L.con_css(t, "ptabs", L.CSS_PTABS + ".f-ptabs { grid-template-columns: repeat(4, 1fr); }\n.f-ptabs a { font-size: 14px; }\n")


# ================================================================ La carga de «Visita a cliente» (la de la 20), para corregir y para la pregunta «Correo»
q, txt, seg, radios, zona, area = W.q, W.txt, W.seg, W.radios, W.zona, W.area
VAL_126 = {"Cliente": "Ferretería Rosales", "Fecha": "13/10/2026", "Venta": "Sí", "Monto": "125.500,00", "Motivo": "Venta nueva", "Fallas": ["Frío", "Ruido"],
           "Observaciones": "Cerramos el pedido de octubre.", "Fotos": 2}


def fallas(elegidas, des=False):
    return '<div class="q-ch">' + "".join(f'<span class="q-chk{" des" if des else ""}">{"<i>" + TILDE + "</i>" if f in elegidas else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}{f}</span>'
                                          for f in ["Frío", "Ruido", "Puerta", "Luz"]) + "</div>"


def antes(texto):
    return f'<span class="co-ant">Antes: <b>{texto}</b></span>'


def form_visita(v=None, e=None, des=False, cambios=None, correo=None, antes_html="", ple=()):
    """Las zonas de «Visita a cliente», con la grilla de la 20: hasta tres por renglón, y lo que cambió dice lo de antes."""
    v, e, cambios = v or {}, e or {}, cambios or {}
    datos = [q("Cliente", txt(v.get("Cliente", ""), des=des), 2, True, e.get("Cliente")), q("Fecha de la visita", txt(v.get("Fecha", ""), ang=True, des=des), 1, True)]
    if correo is not None:
        datos.append(q("Correo del cliente", txt(correo or '<span class="ph">nombre@ejemplo.com</span>', mal="Correo" in e, des=des), 2, False, e.get("Correo")))
    monto = q("Monto estimado", txt(v.get("Monto", ""), ang=True, des=des) + (antes(cambios["Monto"]) if "Monto" in cambios else ""), 1)
    resultado = [q("¿Se concretó la venta?", seg(v.get("Venta"), des), 1, True)] + ([monto] if v.get("Venta") == "Sí" else []) + [
        q("Motivo", radios(["Venta nueva", "Reclamo", "Seguimiento"], v.get("Motivo"), des), 2), q("Fallas", fallas(v.get("Fallas", []), des), 2, extra=' <span class="cg-hasta">hasta 3</span>'),
        q("Observaciones", area(v.get("Observaciones", ""), des=des), 3)]
    archivos = [q("Fotos de la visita", W.fotos(v.get("Fotos", 0), des=des), 2, extra=' <span class="cg-hasta">hasta 3</span>'),
                q("Remito firmado", A.doc_chip() if v.get("Fotos") else '<div class="cg-drop">Arrastrá el documento acá o <button type="button" class="cb cb-sec">Elegir archivo</button></div>', 1)]
    return ('<div class="w-body">' + antes_html + zona("La visita", datos, "La visita" in ple) + zona("El resultado", resultado, "El resultado" in ple)
            + zona("Fotos y documentos", archivos, "Fotos y documentos" in ple) + "</div>")


# ================================================================ FRM-Respuesta-Corregir: la corrección, con lo de antes a la vista (91)
E_CO = ["Respuesta", "Más acciones: menú", "Corregir", "Con el motivo", "Guardando", "Corregida", "La versión anterior"]
MOTIVO_CO = "El monto era 130.000,00: faltaba la segunda cámara."
CORREGIDA = "15/10/2026 18:30"
ACT_126 = [(K.HORA_A, "La respondió Tomás Acosta por WhatsApp"), ("13/10/2026 11:20", "Se la mandó Lucía Fernández"), (K.DEC_A, "La aprobó Lucía Fernández")]


def banda_rc(titulo, res, chip, menu="", pos="5 de 10", acciones=None):
    nav = (f'<span class="rc-pos">{pos}</span><button type="button" class="nv" aria-label="Respuesta anterior">{K.SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente">{K.BAJA}</button>')
    k = (f'<span class="e-kw"><button type="button" class="ib o-borde" aria-label="Acciones de {titulo}" aria-haspopup="menu" aria-expanded="{"true" if menu else "false"}">{KEBAB}</button>{menu}</span>')
    ac = acciones if acciones is not None else nav + '<a class="cb cb-sec" href="WA-Chats-Avisos.dc.html">Abrir conversación</a>' + k
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="FRM-Respuestas-21.dc.html" aria-label="Volver a las respuestas">{L.VOLVER}</a>'
            f'<div><h1>{titulo} {chip}</h1><p class="res">{res}</p></div></div><div class="ac">{ac}</div></div>')


def completa(momentos, valores, act, antes_html=""):
    return R.CUERPO.format(antes_html + f'<div class="d2-moms rc-moms">{momentos}</div>' + R.rc_seccion("Respuesta", F.grilla(valores), "", True)
                           + R.rc_seccion("Actividad", R.actividad(act), "", True))


def corregir():
    ok = K.moms("ok", quien=K.QUIEN_A, hora=K.HORA_A, cuando=K.DEC_A)
    v_nuevo = [(k, ("130.000,00" if k == "Monto estimado" else v)) for k, v in K.VAL_A]
    corregida_m = (K.recibida(K.QUIEN_A, K.HORA_A) + K.mom("", CHECK, "Corregida", CORREGIDA, f"{LUCIA} · {MOTIVO_CO}") + K.mom("", CHECK, "Al recibirla", "2 de 2 hechas")
                   + K.mom("esp", K.RELOJ, "Por aprobar", "hace un momento", f"Lo aprueba alguien con el rol {SUP}",
                           K.botones("La corregiste vos: la aprueba otra persona con el rol Supervisor."), "esp"))
    act_c = [(CORREGIDA, f"La corrigió Lucía Fernández: «{MOTIVO_CO}» · <a class=\"d2-ln\" href=\"FRM-Respuesta-Corregir.dc.html\">Ver la versión anterior</a>")] + ACT_126
    menu = menu_respuesta(K.NUM_A, pdf=True)
    zona_co = lambda m: W.zona("La corrección", [q("Motivo", area(m), 3, True, ayuda="Queda en la respuesta. Si estaba aprobada, vuelve a «Por aprobar».")])
    sub_co = f"{FORM} · versión 4 · la cargó {K.QUIEN_A} el {K.HORA_A}"
    acciones = lambda g: f'<button type="button" class="cb cb-sec"{" disabled" if g else ""}>Cancelar</button>' + (E.trabaja("Guardando…") if g else '<button type="button" class="cb cb-pri">Guardar la corrección</button>')
    v_monto = {**VAL_126, "Monto": "130.000,00"}
    ban_ant = (f'<div class="rc-ban" role="status">{F.ALERTA}<span>Es la versión anterior de {K.NUM_A}: {LUCIA} la corrigió el {CORREGIDA}.</span>'
               '<a href="FRM-Respuesta-Corregir.dc.html">Ver la vigente</a></div>')
    bnd = {"Respuesta": banda_rc(K.NUM_A, f"{FORM} · versión 4 · recibida el {K.HORA_A}", K.CHIP["Aprobada"]),
           "Más acciones: menú": banda_rc(K.NUM_A, f"{FORM} · versión 4 · recibida el {K.HORA_A}", K.CHIP["Aprobada"], menu),
           "Corregir": banda_rc(f"Corregir {K.NUM_A}", sub_co, "", acciones=acciones(False)), "Con el motivo": banda_rc(f"Corregir {K.NUM_A}", sub_co, "", acciones=acciones(False)),
           "Guardando": banda_rc(f"Corregir {K.NUM_A}", sub_co, "", acciones=acciones(True)),
           "Corregida": banda_rc(K.NUM_A, f"{FORM} · versión 4 · recibida el {K.HORA_A} · corregida el {CORREGIDA}", K.CHIP["Por aprobar"] + ' <span class="ab-chip">Corregida</span>'),
           "La versión anterior": banda_rc(f"{K.NUM_A} · versión anterior", f"{FORM} · versión 4 · recibida el {K.HORA_A}", '<span class="ab-chip">Reemplazada</span>', acciones="")}
    cu = {"Respuesta": completa(ok, K.VAL_A, ACT_126), "Más acciones: menú": completa(ok, K.VAL_A, ACT_126),
          "Corregir": form_visita(VAL_126, antes_html=zona_co("")), "Con el motivo": form_visita(v_monto, cambios={"Monto": "125.500,00"}, antes_html=zona_co(MOTIVO_CO)),
          "Guardando": form_visita(v_monto, cambios={"Monto": "125.500,00"}, des=True, antes_html=zona_co(MOTIVO_CO)),
          "Corregida": completa(corregida_m, v_nuevo, act_c), "La versión anterior": completa(ok, K.VAL_A, ACT_126, ban_ant)}
    capas = {"Corregida": A.toast(f"Se guardó la corrección. {K.NUM_A} vuelve a «Por aprobar».")}
    css = CSS + W.CSS_20 + R.CSS_RC + ".w-bnd h1 .w-est, .w-bnd h1 .ab-chip { margin-left: 8px; vertical-align: 3px; font-size: 12.5px; }\n"
    t = R.pagina("Corregir una respuesta · /org/formularios/:id/respuestas/:recordId", A.con_estados([(e, bnd[e]) for e in E_CO]), A.con_estados([(e, cu[e]) for e in E_CO]), E_CO, css=css)
    k = t.rindex("</div>\n</x-dc>")
    return t[:k] + A.con_estados([(e, capas.get(e, "")) for e in E_CO]) + t[k:]


# ================================================================ FRM-Respuesta-Anular: al final del ⋮, con motivo (92)
E_AN = ["Más acciones: menú", "Anular", "Anulando", "Anulada", "Estado: Anulada", "Exportar con las anuladas"]


def dlg_anular(trabajando=False):
    cuerpo = ('<div class="w-cmp"><span class="rt">Motivo <span class="req">*</span></span><div class="ct area">' + MOTIVO_ANULAR + "</div></div>"
              '<p class="d-tx">Sale de la planilla, de los conteos y del Excel, y cierra lo que espera aprobación. Se ve con el filtro «Anulada». No se puede deshacer.</p>')
    pie = (f'<button type="button" class="cb cb-sec"{" disabled" if trabajando else ""}>Cancelar</button>' + (E.trabaja("Anulando…", "cb-pel lleno") if trabajando else '<button type="button" class="cb cb-pel lleno">Anular</button>'))
    return F.dialogo("Anular VIS-000127", cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg anu"', 1)


def dlg_exportar():
    cuerpo = ('<p class="d-tx">Se exportan las 24 respuestas de la planilla, con sus filtros y sus columnas.</p>'
              f'<span class="q-chk"><i>{TILDE}</i>Incluir las anuladas (1)</span>')
    return F.dialogo("Exportar a Excel", cuerpo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Exportar 25 respuestas</button>').replace('class="w-dlg"', 'class="w-dlg exa"', 1)


def anular():
    v127 = K.con_fotos([("Cliente", "Ferretería Sur"), ("Fecha de la visita", "14/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", "0,00"), ("Motivo", "Reclamo"),
                        ("Fallas", "Puerta"), ("Observaciones", "Reclamo por demora en la entrega.")], 2, False)
    pend = K.moms("pend", quien="Marta Gil", hora=FILA_127[1], hace=HACE["VIS-000127"]).replace("La respondió Marta Gil por WhatsApp · se la mandó Lucía Fernández", "La respondió Marta Gil, cliente, por WhatsApp")
    vista_p = K.vista("VIS-000127", K.CHIP["Por aprobar"], pend, v127, pos="4 de 10", primera=False)
    anulada_m = (K.recibida("Marta Gil", FILA_127[1]).replace(" · se la mandó Lucía Fernández", "")
                 + K.mom("no", CERRAR, "Anulada", "15/10/2026 18:40", f'{LUCIA} · <span class="mot">{MOTIVO_ANULAR}</span>'))
    vista_a = K.vista("VIS-000127", '<span class="w-est off">Anulada</span>', anulada_m, v127, pos="1 de 2", primera=True)
    sin = [r for r in K.FILAS if r[0] != "VIS-000127"] + [("VIS-000120", "11/10/2026 18:05", "Florencia Fernández de la Fuente", "", "WhatsApp", "Obra Centro", "22.000,00", "Seguimiento")]
    anuladas = [FILA_127, ANULADA]
    cu = {"Más acciones: menú": K.fondo(sel="VIS-000127"), "Anular": K.fondo(sel="VIS-000127"), "Anulando": K.fondo(sel="VIS-000127"),
          "Anulada": K.fondo(sin, pie="1–10 de 23", estados={"VIS-000120": "Aprobada"}),
          "Estado: Anulada": K.fondo(anuladas, estado="Anulada", sel="VIS-000127", pie="1–2 de 2", pag="Página 1 de 1", estados={"VIS-000127": "Anulada", ANULADA[0]: "Anulada"}),
          "Exportar con las anuladas": K.fondo()}
    capas = {"Más acciones: menú": con_kebab(vista_p, "VIS-000127", menu_respuesta("VIS-000127")), "Anular": con_kebab(vista_p, "VIS-000127") + K.sobre(dlg_anular()),
             "Anulando": con_kebab(vista_p, "VIS-000127") + K.sobre(dlg_anular(True)), "Anulada": A.toast("Se anuló VIS-000127."),
             "Estado: Anulada": vista_a, "Exportar con las anuladas": dlg_exportar()}
    bnd = {e: K.banda_p().replace('"Respuestas · versión 4 publicada"', '"Respuestas · versión 4 publicada"') for e in E_AN}
    return planilla(E_AN, bnd, cu, capas, "Anular una respuesta · /org/formularios/:id/respuestas")


# ================================================================ FRM-Respuestas-Propias-21: lo suyo, con el estado, el PDF y el motivo del rechazo (85)
E_PR = ["Lo suyo", "Una rechazada", "Su PDF", "Corregir la suya", "Ya aprobada"]
MOTIVO_117 = "Falta la foto del frente del local."
PROPIAS = [("VIS-000126", K.HORA_A, TOMAS, "", "WhatsApp", "Ferretería Rosales", "125.500,00", "Venta nueva"),
           ("VIS-000123", "13/10/2026 11:04", TOMAS, "", "WhatsApp", "Ferretería Rosales", "0,00", "Seguimiento"),
           ("VIS-000117", "10/10/2026 17:20", TOMAS, "", "App", "Obra Centro", None, "Seguimiento"),
           ("VIS-000114", "09/10/2026 12:05", TOMAS, "", "WhatsApp", "Corralón El Puente", "38.400,00", "Venta nueva"),
           ("VIS-000111", "07/10/2026 15:48", TOMAS, "", "WhatsApp", "Distribuidora Norte", "0,00", "Reclamo"),
           ("VIS-000108", "02/10/2026 10:30", TOMAS, "", "WhatsApp", "Ferretería Sur", "12.000,00", "Venta nueva")]
EST_PR = {"VIS-000126": "Aprobada", "VIS-000123": "Por aprobar", "VIS-000117": "Rechazada", "VIS-000114": "Aprobada", "VIS-000111": "Aprobada", "VIS-000108": "Recibida"}
COLS_PR = [("num", "N°", 112, ""), ("est", "Estado", 116, ""), ("rec", "Recibida", 136, ""), ("can", "Canal", 96, ""), ("cli", "Cliente", 160, ""), ("mon", "Monto estimado", 128, "r"),
           ("rch", "Motivo del rechazo", 250, ""), ("pdf", "PDF", 56, "")]


def tabla_propia(sel=None):
    def celda(k, r):
        if k == "rch":
            return f'<span title="{MOTIVO_117}">{MOTIVO_117}</span>' if EST_PR[r[0]] == "Rechazada" else f"<span>{R.gris('—')}</span>"
        return K.celda(k, r, "FRM-Respuestas-Propias-21.dc.html", EST_PR[r[0]])
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(celda(k, r) for k, *_ in COLS_PR) + "</div>" for r in PROPIAS)
    return (f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(COLS_PR)};"><div class="pl-scroll">{R.cabecera(COLS_PR)}{h}</div>'
            '<div class="w-pie"><span>1–6 de 6</span><span>10 por página · Página 1 de 1</span></div></div>')


def como_tomas(t):
    t = L.G.PANEL_RE.sub(lambda m: L.ET.panel(21, "formularios"), t)
    t = t.replace('<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div>',
                  '<div class="w-us"><span class="w-av">T</span><span class="tx"><b>Tomás Acosta</b><span>tomas.acosta@delta.ejemplo.com</span></span></div>')
    t = re.sub(r'(<summary class="um"[^>]*>)<span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b>', r'\1<span class="w-av">T</span><span class="tx"><b>Tomás Acosta</b>', t, count=1)
    t = re.sub(r'<div class="w-abajo"><a class="w-ln" href="WA-Admin\.dc\.html">.*?</a>', '<div class="w-abajo">', t, count=1, flags=re.S)
    t = re.sub(r'<a class="w-ln" href="WA-Chats\.dc\.html">.*?</a>', "", t, count=1, flags=re.S)
    return re.sub(r'<a class="w-ln[^"]*" href="FRM-Catalogos\.dc\.html">.*?</a>', "", t, count=1, flags=re.S)


def propias():
    fondo = lambda sel=None: '<div class="w-body sin-tabs">' + W.barra(propia=True) + tabla_propia(sel) + "</div>"
    r117 = K.con_fotos([("Cliente", "Obra Centro"), ("Fecha de la visita", "10/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", None), ("Motivo", "Seguimiento"),
                        ("Fallas", R.gris("—")), ("Observaciones", "Avance de obra, segunda etapa.")], 0, False)
    rch = (K.recibida(TOMAS, "10/10/2026 17:20", "App") + K.mom("", CHECK, "Al recibirla", "2 de 2 hechas")
           + K.mom("no", CERRAR, "Rechazada", "11/10/2026 09:15", f'{LUCIA} · <span class="mot">{MOTIVO_117}</span>'))
    pend = sin_botones(K.moms("pend", quien=TOMAS, hora="13/10/2026 11:04", hace=HACE["VIS-000123"])).replace("La respondió Tomás Acosta por WhatsApp · se la mandó Lucía Fernández", "La respondiste por WhatsApp")
    ok = K.moms("ok", quien=TOMAS, hora=K.HORA_A, cuando=K.DEC_A).replace("La respondió Tomás Acosta por WhatsApp · se la mandó Lucía Fernández", "La respondiste por WhatsApp")
    v123 = K.con_fotos(R.VALORES_123, 0, False)
    ya = "Ya está aprobada: la corrige alguien con permiso para corregir respuestas."
    capas = {"Una rechazada": K.vista("VIS-000117", K.CHIP["Rechazada"], rch, r117, fotos=0, pos="3 de 6", primera=False),
             "Su PDF": K.vista(K.NUM_A, K.CHIP["Aprobada"], ok, K.VAL_A, "PDF", K.pestana_pdf(), pdf=True, pos="1 de 6"),
             "Corregir la suya": con_kebab(K.vista("VIS-000123", K.CHIP["Por aprobar"], pend, v123, fotos=0, pos="2 de 6", primera=False), "VIS-000123", menu_respuesta("VIS-000123")),
             "Ya aprobada": con_kebab(K.vista(K.NUM_A, K.CHIP["Aprobada"], ok, K.VAL_A, pdf=True, pos="1 de 6"), K.NUM_A, menu_respuesta(K.NUM_A, ya, ya, pdf=True))}
    sel = {"Una rechazada": "VIS-000117", "Su PDF": K.NUM_A, "Corregir la suya": "VIS-000123", "Ya aprobada": K.NUM_A}
    agregar = '<a class="cb cb-pri" href="FRM-Cargar-Respuesta-21.dc.html">Agregar respuesta</a>'
    bnd = {e: K.banda_p(agregar) for e in E_PR}
    cu = {e: fondo(sel.get(e)) for e in E_PR}
    t = planilla(E_PR, bnd, cu, capas, "Lo propio · /org/formularios/:id/respuestas · etapa 21")
    return t.replace('<a class="d2-ln" href="WA-Chats-Avisos.dc.html">Abrir conversación</a>', "")  # quien solo carga no ve WhatsApp; el panel y quién mira, después del marco


# ================================================================ FRM-Editor-21 y FRM-Cargar-Respuesta-21: la pregunta «Correo»
PREG = [("Cliente", "Texto corto · Obligatoria"), ("Fecha de la visita", "Fecha · Obligatoria"), ("Correo del cliente", "Correo · Opcional"), ("¿Se concretó la venta?", "Sí o no · Obligatoria"),
        ("Monto estimado", "Número · 2 decimales · 1 condición · Opcional"), ("Motivo", "Elegir una · 3 opciones · Opcional"), ("Fallas", "Elegir varias · 4 opciones · Opcional"),
        ("Observaciones", "Texto largo · Opcional"), ("Fotos de la visita", "Foto · hasta 3 · Opcional"), ("Remito firmado", "Documento · Opcional")]
TIPOS = ["Texto corto", "Texto largo", "Número", "Fecha", "Sí o no", "Correo", "Elegir una", "Elegir varias", "De un catálogo", "Foto", "Documento", "Cálculo", "Grupo de líneas"]
AY_CORREO = "Se valida que sea un correo. En WhatsApp va como un texto con teclado de correo."
PV_CORREO = ('<div class="pv-c">Cliente<div class="pv-in"></div></div><div class="pv-c">Fecha de la visita<div class="pv-in"></div></div>'
             '<div class="pv-c">Correo del cliente (opcional)<div class="pv-in">nombre@ejemplo.com</div></div>')


def con_visita(fn):
    def envuelta(*a, **k):
        viejo = (A.PREGUNTAS, X.PREG, X.FORM, X.PREFIJO)
        A.PREGUNTAS, X.PREG, X.FORM, X.PREFIJO = [(n, d, False, None) for n, d in PREG], PREG, FORM, "VIS"
        try:
            return fn(*a, **k)
        finally:
            A.PREGUNTAS, X.PREG, X.FORM, X.PREFIJO = viejo
    return envuelta


@con_visita
def editor():
    menu = ('<div class="rg2-menu" role="listbox" aria-label="Tipo de respuesta" style="top: 64px; left: calc(50% + 6px); right: auto; width: 280px;">'
            + "".join(f'<span role="option" class="{"on" if t == "Correo" else ""}">{t}{"<small>Nuevo</small>" if t == "Correo" else ""}</span>' for t in TIPOS) + "</div>")
    abierta = X.abierta(3, "Correo", f'<div class="w-cmp ancho"><span class="ab-sub">{AY_CORREO}</span></div>')
    V ={"El tipo «Correo»": X.cuerpo(3, abierta, PV_CORREO), "Tipos de respuesta: menú": X.cuerpo(3, abierta.replace('<div class="q-ed">', '<div class="q-ed" style="position: relative;">' + menu, 1), PV_CORREO)}
    est = list(V)
    banda = E.banda(FORM, E.EST_PUB4, E.acc("cambios"), "FRM-Formularios-21.dc.html")
    return A.pagina_editor({e: (banda, V[e]) for e in est}, {}, est, "Editor · la pregunta «Correo» · etapa 21", E.CSS_E12 + E.CSS_CA4 + E.CSS_TITULOS + X.CSS_19 + K.CSS_RG + K.CSS_21)


E_CA = ["Nueva respuesta", "Un correo mal escrito"]


def cargar():
    v = {"Cliente": "Ferretería Rosales", "Fecha": "15/10/2026"}
    bnd = W.banda(titulo="Nueva respuesta", sub=f"{FORM} · versión 4", volver="FRM-Formularios-21.dc.html")
    V = {"Nueva respuesta": (bnd, form_visita(v, correo="")), "Un correo mal escrito": (bnd, form_visita(v, {"Correo": "Escribí un correo válido, como nombre@ejemplo.com."}, correo="compras@ferreteriarosales"))}
    return W.editor(V, {}, E_CA, "Nueva respuesta · la pregunta «Correo» · etapa 21", ".cg-q .ph { color: var(--t3); }\n")


# ================================================================ FRM-Dar-De-Baja-21 y FRM-Editor-Baja-21: lo que se conserva suma el PDF y las aprobaciones
def dar_de_baja():
    t = (PROJ / "FRM-Dar-De-Baja-18.dc.html").read_text(encoding="utf-8")
    m = re.search(r'(<div class="[^"]*">)(<svg(?:(?!</svg>).)*</svg>)<div class="tx"><b>Se conservan las 24 respuestas, con sus fotos y documentos</b><span>Siguen en la planilla y en el Excel\.</span></div></div>', t, re.S)
    assert m, "lo que se conserva"
    nuevo = (f'{m.group(1)}{m.group(2)}<div class="tx"><b>Se conservan las 24 respuestas, con sus fotos, documentos, PDF y aprobaciones</b><span>Siguen en la planilla y en el Excel.</span></div></div>'
             f'{m.group(1)}{m.group(2)}<div class="tx"><b>3 respuestas esperan aprobación</b><span>Se pueden seguir aprobando o rechazando.</span></div></div>')
    t = t.replace(m.group(0), nuevo, 1).replace("Publicado · versión 3", "Publicado · versión 4")
    return re.sub(r"<title>[^<]*</title>", "<title>Dar de baja · etapa 21</title>", t)


def editor_baja():
    t = (PROJ / "FRM-Editor-Baja.dc.html").read_text(encoding="utf-8")
    viejo = '<span class="k">En WhatsApp</span><span>Se deprecan cuando venzan los 2 envíos abiertos. El último vence el 10/10/2026 a las 18:40.</span>'
    assert viejo in t, "el detalle de la baja"
    t = t.replace(viejo, viejo + '<span class="k">Por aprobar</span><span>2 respuestas: se pueden seguir aprobando o rechazando.</span>'
                  '<span class="k">Lo que se conserva</span><span>Las 12 respuestas, con sus fotos, documentos, PDF y aprobaciones.</span>')
    t = re.sub(r'<div class="f-tabs" role="tablist"[^>]*>.*?</div>', "", t, flags=re.S)
    return re.sub(r"<title>[^<]*</title>", "<title>Un formulario dado de baja · etapa 21</title>", t)


# ================================================================ Los teléfonos
def t_bar_r(num, sub, volver="M-FRM-Respuestas-21.dc.html", der=""):
    return C.t_bar(num, sub, volver, der)


def tel_respuestas():
    est = ["Respuestas", "Quien solo aprueba"]
    der = f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'
    fab = f'<a class="ap-fab" aria-label="Agregar respuesta" href="M-FRM-Cargar-Respuesta-21.dc.html">{F.TFAB}</a>'

    def fila(r):
        e = K.ESTADO[r[0]]
        return (f'<a class="ap-fila" href="M-FRM-Respuesta-Aprobacion.dc.html"><div class="tx"><span class="l1">{r[0]}<span class="hr">{r[1]}</span></span>'
                f'<span class="l2"><span class="w-est {K.CLASE[e]}">{e}</span> · {r[5]}</span><span class="l3">{r[2]} · {r[4]}</span></div></a>')
    lista = K.t_bar_f().replace("Publicado · versión 4", "24 respuestas") + '<div class="ap-cuerpo">' + "".join(fila(r) for r in K.FILAS) + "</div>" + fab
    cola_t = (C.t_bar(FORM, "Por aprobar · 3", "M-FRM-Formularios-21.dc.html") + '<div class="ap-cuerpo">'
              + "".join(f'<a class="ap-fila" href="M-FRM-Respuesta-Aprobacion.dc.html"><div class="tx"><span class="l1">{r[0]}</span><span class="l2">Recibida el {r[1]}</span><span class="l3">Por aprobar {HACE[r[0]]}</span></div></a>'
                        for r in sorted(POR_APROBAR, key=lambda r: r[0])) + "</div>")
    t = C.tel_pagina({"Respuestas": lista, "Quien solo aprueba": cola_t}, est, {}, "Respuestas · teléfono · etapa 21", W.CSS_TP + K.CSS_21)
    return K.con_tabs_tel(t, "respuestas")


def t_grilla(vals):
    return "".join(f'<div class="f"><span class="k">{k}</span><span>{R.valor(v)}</span></div>' for k, v in vals)


def tel_corregir():
    est = ["Más acciones", "Corregir", "Corregida"]
    base = (t_bar_r(K.NUM_A, f"{FORM} · versión 4", der=f'<button type="button" class="ap-ib" aria-label="Acciones de {K.NUM_A}">{F.TKEBAB}</button>')
            + f'<div class="tr-scroll"><div class="tr-sec"><button type="button" class="h" aria-expanded="true">Respuesta<span class="fl ab">{CHEV}</span></button><div class="tr-gr">{t_grilla(K.VAL_A)}</div></div></div>')
    menu = F.thoja(K.NUM_A, '<span class="t-lin">Corregir</span><span class="t-lin">Descargar el PDF</span><span class="t-lin" style="color: var(--peligro);">Anular</span>', '<button type="button" class="cb cb-sec">Cancelar</button>')
    form = (C.t_bar(f"Corregir {K.NUM_A}", f"La cargó {K.QUIEN_A}", "M-FRM-Respuesta-Corregir.dc.html") + '<div class="ap-cuerpo">'
            + W.t_zona("La corrección", F.tcampo("Motivo", MOTIVO_CO, req=True)) + W.t_zona("El resultado", W.t_txt("Monto estimado", "130.000,00") + f'<span class="co-ant">Antes: <b>125.500,00</b></span>')
            + W.t_zona("La visita", "", True) + "</div>" + '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Guardar la corrección</button></div>')
    corregida = (t_bar_r(K.NUM_A, f"{FORM} · corregida el {CORREGIDA}") + '<div class="cg-tban" role="status" style="margin: 12px 16px 0;">Se guardó la corrección. Vuelve a «Por aprobar».</div>'
                 + f'<div class="tr-scroll"><div class="tr-sec"><button type="button" class="h" aria-expanded="true">Respuesta<span class="fl ab">{CHEV}</span></button><div class="tr-gr">'
                 + t_grilla([(k, ("130.000,00" if k == "Monto estimado" else v)) for k, v in K.VAL_A]) + "</div></div></div>")
    return C.tel_pagina({"Más acciones": base, "Corregir": form, "Corregida": corregida}, est, {"Más acciones": menu}, "Corregir · teléfono · etapa 21", W.CSS_TP + CSS_R21)


def tel_anular():
    est = ["Más acciones", "Anular", "Anulada"]
    v127 = [("Cliente", "Ferretería Sur"), ("¿Se concretó la venta?", "No"), ("Motivo", "Reclamo"), ("Observaciones", "Reclamo por demora en la entrega.")]
    base = (t_bar_r("VIS-000127", f"{FORM} · versión 4", der=f'<button type="button" class="ap-ib" aria-label="Acciones de VIS-000127">{F.TKEBAB}</button>')
            + f'<div class="tr-scroll"><div class="tr-sec"><button type="button" class="h" aria-expanded="true">Respuesta<span class="fl ab">{CHEV}</span></button><div class="tr-gr">{t_grilla(v127)}</div></div></div>')
    menu = F.thoja("VIS-000127", '<span class="t-lin">Corregir</span><span class="t-lin" style="color: var(--peligro);">Anular</span>', '<button type="button" class="cb cb-sec">Cancelar</button>')
    hoja = F.thoja("Anular VIS-000127", F.tcampo("Motivo", "Se cargó dos veces.", req=True) + '<p class="d-tx">Sale de la planilla, de los conteos y del Excel. No se puede deshacer.</p>',
                   '<button type="button" class="cb cb-pel lleno">Anular</button><button type="button" class="cb cb-sec">Cancelar</button>')
    sin = [r for r in K.FILAS if r[0] != "VIS-000127"]
    lista = (K.t_bar_f().replace("Publicado · versión 4", "23 respuestas") + '<div class="cg-tban" role="status" style="margin: 12px 16px 0;">Se anuló VIS-000127.</div><div class="ap-cuerpo">'
             + "".join(f'<a class="ap-fila" href="#"><div class="tx"><span class="l1">{r[0]}<span class="hr">{r[1]}</span></span><span class="l2">{K.ESTADO[r[0]]} · {r[5]}</span></div></a>' for r in sin) + "</div>")
    return C.tel_pagina({"Más acciones": base, "Anular": base, "Anulada": lista}, est, {"Más acciones": menu, "Anular": hoja}, "Anular · teléfono · etapa 21", W.CSS_TP + K.CSS_21)


def tel_propias():
    est = ["Lo suyo", "Una rechazada"]
    der = f'<button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'
    fab = f'<a class="ap-fab" aria-label="Agregar respuesta" href="M-FRM-Cargar-Respuesta-21.dc.html">{F.TFAB}</a>'
    filas = "".join(f'<a class="ap-fila" href="#"><div class="tx"><span class="l1">{r[0]}<span class="hr">{r[1]}</span></span><span class="l2"><span class="w-est {K.CLASE[EST_PR[r[0]]]}">{EST_PR[r[0]]}</span> · {r[5]}</span>'
                    + (f'<span class="l3">{MOTIVO_117}</span>' if EST_PR[r[0]] == "Rechazada" else "") + "</div></a>" for r in PROPIAS)
    lista = C.t_bar(FORM, "6 respuestas", "M-FRM-Formularios-21.dc.html", der) + '<div class="ap-cuerpo">' + filas + "</div>" + fab
    rch = (t_bar_r("VIS-000117", f"{FORM} · versión 4", "M-FRM-Respuestas-Propias-21.dc.html") + '<div class="tr-scroll"><div class="tr-moms">'
           + K.t_moms("no", TOMAS, "10/10/2026 17:20", MOTIVO_117).replace(K.DEC_R, "11/10/2026 09:15") + "</div></div>")
    return C.tel_pagina({"Lo suyo": lista, "Una rechazada": rch}, est, {}, "Lo propio · teléfono · etapa 21", W.CSS_TP + K.CSS_TRG + K.CSS_21)


def tel_editor():
    est = ["El tipo «Correo»"]
    t = (C.t_bar("Correo del cliente", "Pregunta", "M-FRM-Editor-21.dc.html") + '<div class="ap-cuerpo"><div class="rg-hb">' + F.tcampo("Pregunta", "Correo del cliente", req=True)
         + F.tcampo("Tipo de respuesta", "Correo") + f'<span class="ab-sub">{AY_CORREO}</span>' + F.tcampo("Ayuda para quien lo recibe", "Opcional", vacio=True)
         + '<span class="q-chk"><i class="no"></i>Obligatoria</span></div></div><div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    return C.tel_pagina({"El tipo «Correo»": t}, est, {}, "La pregunta «Correo» · teléfono · etapa 21", E.CSS_E12 + E.CSS_TED_E12 + W.CSS_TP + K.CSS_TRG)


def tel_cargar():
    est = ["Nueva respuesta", "Un correo mal escrito"]

    def pag(correo, mal=None):
        datos = W.t_txt("Cliente", "Ferretería Rosales", True) + W.t_txt("Fecha de la visita", "15/10/2026", True) + W.t_txt("Correo del cliente", correo, mal=mal, ph="nombre@ejemplo.com")
        return (C.t_bar("Nueva respuesta", f"{FORM} · versión 4", "M-FRM-Formularios-21.dc.html") + '<div class="ap-cuerpo">' + W.t_zona("La visita", datos) + W.t_zona("El resultado", "", True)
                + W.t_zona("Fotos y documentos", "", True) + "</div>" + f'<div class="ap-fijo"><button type="button" class="cb cb-pri full">{W.ENVIAR}</button></div>')
    return C.tel_pagina({"Nueva respuesta": pag(""), "Un correo mal escrito": pag("compras@ferreteriarosales", "Escribí un correo válido, como nombre@ejemplo.com.")}, est, {},
                        "Nueva respuesta · la pregunta «Correo» · teléfono · etapa 21", W.CSS_TP)


# ================================================================ Traspasos 5, 9 y 10 (2026-11-07): la 21 con las piezas nuevas
# Lo de arriba queda para la 23, que usa `con_visita` y `PV_CORREO`. Desde acá: la planilla con «Por aprobar (N) | Todas» (148) y un solo «Filtros»
# (144); corregir y anular como en ArquitecturaBase (166: «Corregir» con su lápiz en la fila del título, el ⋮ con solo «Anular», el motivo al final,
# «Guardar corrección», «Ya cargado · 86 KB» y «¿Anular VIS-…?» con «Anular respuesta»); lo propio con el motivo del rechazo en los momentos; la carga
# en dos anchos (141) con «Mantener las respuestas para la siguiente» (147); el editor sin «Grupo de líneas» y con «Agregar bloque» (177), y la
# tarjeta del chat que dice qué pasó después (WA-Chats-Respuesta-21, nuevo).
CSS_FCAB = "".join(linea + "\n" for linea in F.CSS_FICHA.splitlines() if linea.startswith(".f-cab"))  # la banda de las zonas, fuera del editor
CSS_R5 = CSS_FCAB + """.w-body > .w-caja, .w-body > .rc-ban, .w-body > .co-pg, .w-body > .pa-vis { flex-shrink: 0; }
.co-ant { display: block; margin-top: 4px; font-size: 12.5px; color: var(--t2); }
.co-ch { columns: 3; column-gap: 16px; }
.cg-q .co-ch .q-chk { display: flex; margin-bottom: 10px; font-size: 14px; break-inside: avoid; }
.cg-panel .co-ch { columns: 2; }
.co-ya { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--borde); border-radius: 8px; background: #fff; }
.co-ya + .co-ya { margin-top: 6px; }
.co-ya .im { width: 36px; height: 36px; flex: none; border-radius: 6px; background: linear-gradient(135deg, oklch(0.84 0.03 170), oklch(0.66 0.05 170)); }
.co-ya .pdf { width: 30px; height: 36px; flex: none; border-radius: 4px; background: oklch(0.55 0.18 25); color: #fff; font-size: 9px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.co-ya .t { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 13.5px; }
.co-ya .t small { font-size: 12.5px; color: var(--t2); }
.co-ya .cb { height: 30px; font-size: 13px; }
.co-mas { margin-top: 8px; }
.co-mas .cg-drop { min-height: 48px; }
.co-mot { display: flex; flex-direction: column; gap: 6px; padding-top: 16px; border-top: 1px solid var(--borde2); }
.co-mot .rt { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.co-mot .ct { min-height: 64px; height: auto; white-space: normal; line-height: 1.45; padding-top: 8px; padding-bottom: 8px; }
.co-mot .ct.mal { border-color: var(--peligro); box-shadow: 0 0 0 3px oklch(0.57 0.2 25 / 0.12); }
.co-mot .err2 { font-size: 13px; color: var(--peligro); }
.co-pz { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px 18px; }
.co-pz .co-mot { padding-top: 14px; }
.co-pg { display: flex; flex-direction: column; gap: 16px; }
.dc-moms { padding: 2px 0; }
.dc-moms .d3-moms { padding: 4px 20px; }
.w-bnd h1 .w-est, .w-bnd h1 .d4-marca { margin-left: 8px; vertical-align: 3px; font-size: 13px; font-weight: 500; }
.w-bnd .ac { align-items: center; }
.rc-ban { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px; border: 1px solid oklch(0.85 0.08 85); background: oklch(0.97 0.04 85); font-size: 14px; color: oklch(0.36 0.08 70); }
.rc-ban a { margin-left: auto; font-weight: 600; color: var(--marca-tx); text-decoration: none; white-space: nowrap; }
.pa-cola .w-tr .cb { height: 30px; font-size: 13px; justify-self: start; }
.pa-cola .w-tr > span { display: flex; align-items: center; }
.w-dlg .ex-anu { display: flex; margin-top: 4px; }
"""
VAL_CO = {"Cliente": "Ferretería Rosales", "Fecha": "13/10/2026", "Venta": "Sí", "Monto": "125.500,00", "Motivo": "Venta nueva", "Fallas": ["Frío", "Ruido"],
          "Observaciones": "Cerramos el pedido de octubre."}
V_NUEVO = [(k, ("130.000,00" if k == "Monto estimado" else v)) for k, v in K.VAL_A]


def antes5(texto):
    """Debajo de lo que cambió, en gris: «Antes: 125.500,00» («Antes: sin respuesta» si no tenía), sin tachar (166)."""
    return f'<span class="co-ant">Antes: {texto}</span>'


def casillas(elegidas, des=False):
    """Elegir varias: sus casillas en columnas, de arriba abajo (AR1-A)."""
    return '<div class="co-ch">' + "".join(f'<span class="q-chk{" des" if des else ""}">{"<i>" + TILDE + "</i>" if f in elegidas else "<i class=" + chr(34) + "no" + chr(34) + "></i>"}{f}</span>'
                                          for f in ["Frío", "Ruido", "Puerta", "Luz"]) + "</div>"


def ya(nombre, peso, foto=True, des=False):
    """Un archivo que ya estaba: «Ya cargado · 86 KB», con «Quitar» (166)."""
    ic = '<span class="im" role="img" aria-label="' + nombre + '"></span>' if foto else '<span class="pdf">PDF</span>'
    return (f'<div class="co-ya">{ic}<span class="t"><b>{nombre}</b><small>Ya cargado · {peso}</small></span>'
            f'<button type="button" class="cb cb-sec"{" disabled" if des else ""}>Quitar</button></div>')


def fotos_ya(des=False):
    mas = f'<div class="co-mas"><div class="cg-drop">Arrastrá las fotos acá o <button type="button" class="cb cb-sec"{" disabled" if des else ""}>Elegir fotos</button></div></div>'
    return ya("IMG_2231.jpg", "86 KB", des=des) + ya("IMG_2232.jpg", "92 KB", des=des) + mas + '<span class="cg-cnt">2 de 3</span>'


def zonas_visita(v, cambios=None, des=False, columnas=3, correo=None, archivos=True, err=None):
    """«Visita a cliente» en dos anchos (AR1-A): lo de un valor ocupa una columna; texto largo, elegir varias, fotos y documentos, el renglón entero."""
    cambios, err = cambios or {}, err or {}
    datos = [q("Cliente", txt(v.get("Cliente", ""), des=des), 1, True), q("Fecha de la visita", txt(v.get("Fecha", ""), des=des), 1, True)]
    if correo is not None:
        datos.append(q("Correo del cliente", txt(correo or '<span class="ph">nombre@ejemplo.com</span>', mal="Correo" in err, des=des), 1, False, err.get("Correo")))
    res = [q("¿Se concretó la venta?", seg(v.get("Venta"), des), 1, True)]
    if v.get("Venta") == "Sí":
        res.append(q("Monto estimado", txt(v.get("Monto", ""), des=des) + (antes5(cambios["Monto"]) if "Monto" in cambios else ""), 1))
    res += [q("Motivo", radios(["Venta nueva", "Reclamo", "Seguimiento"], v.get("Motivo"), des), 1),
            q("Fallas", casillas(v.get("Fallas", []), des), 3, extra=' <span class="cg-hasta">hasta 3</span>'),
            q("Observaciones", area(v.get("Observaciones", ""), des=des), 3)]
    if archivos == "ya":
        arch = [q("Fotos de la visita", fotos_ya(des), 3, extra=' <span class="cg-hasta">hasta 3</span>'), q("Remito firmado", ya("remito-0810.pdf", "1,2 MB", False, des), 3)]
    else:
        arch = [q("Fotos de la visita", W.fotos(0, des=des), 3, extra=' <span class="cg-hasta">hasta 3</span>'),
                q("Remito firmado", '<div class="cg-drop">Arrastrá el documento acá o <button type="button" class="cb cb-sec">Elegir archivo</button></div>', 3)]
    return zona("La visita", datos, columnas=columnas) + zona("El resultado", res, columnas=columnas) + zona("Fotos y documentos", arch, columnas=columnas)


def motivo_co(texto="", error="", des=False):
    """Al final, después de una línea: «Motivo de la corrección *», de hasta 500 caracteres (166)."""
    t = texto or ""
    e = f'<span class="err2" role="alert">{error}</span>' if error else ""
    return (f'<div class="co-mot"><div class="w-cmp cg-q"><span class="rt">Motivo de la corrección <span class="req">*</span></span>'
            f'<div class="ct cg-area{" ph" if not texto else ""}{" mal" if error else ""}{" des" if des else ""}">{t}</div>{e}</div></div>')


def pagina_co(motivo="", cambios=None, error="", des=False):
    v = {**VAL_CO, "Monto": "130.000,00"} if cambios else VAL_CO
    return f'<div class="w-body"><div class="co-pg">{zonas_visita(v, cambios, des, archivos="ya")}{motivo_co(motivo, error, des)}</div></div>'


def panel_co(motivo="", cambios=None):
    """En la compu, «Corregir VIS-000126» se abre donde estaba la vista rápida, del ancho del panel de carga, con sus zonas en una columna."""
    v = {**VAL_CO, "Monto": "130.000,00"} if cambios else VAL_CO
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar">{F.X}</button>'
    pie = '<div class="cg-ppie"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar corrección</button></div>'
    return (f'<aside class="d2 cg-panel" role="region" aria-label="Corregir {K.NUM_A}"><div class="d2-h"><b>Corregir {K.NUM_A}</b><a href="FRM-Respuesta-Corregir.dc.html">Pantalla completa</a>{cerrar}</div>'
            f'<div class="d2-b"><div class="co-pz">{zonas_visita(v, cambios, columnas=1, archivos="ya")}{motivo_co(motivo)}</div></div>{pie}</aside>')


def banda5(num, estado, res, acciones, marca="", volver="FRM-Respuestas-21.dc.html"):
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="{volver}" aria-label="Volver a las respuestas">{L.VOLVER}</a>'
            f'<div><h1>{num}{K.est(estado, marca) if estado else ""}</h1><p class="res">{res}</p></div></div><div class="ac">{acciones}</div></div>')


def acciones_dc(num, menu=False, pos="5 de 10", corregir=True, chat="WA-Chats-Respuesta-21.dc.html"):
    """En la pantalla completa, la navegación y «Abrir conversación» siguen en la banda, con «Corregir» y el ⋮ (166)."""
    a = (f'<span class="rc-pos">{pos}</span><button type="button" class="nv" aria-label="Respuesta anterior">{K.SUBE}</button>'
         f'<button type="button" class="nv" aria-label="Respuesta siguiente">{K.BAJA}</button>')
    a += f'<a class="cb cb-sec" href="{chat}">Abrir conversación</a>' if chat else ""
    return a + (K.corregir_btn() + K.kebab_anular(num, menu) if corregir else "")


def completa5(moms, valores, bandas, aviso="", resumen="9 preguntas · 9 respondidas"):
    return R.CUERPO.format(aviso + f'<div class="w-caja dc-moms"><div class="d3-moms">{moms}</div></div>' + R.rc_seccion("Respuesta", F.grilla(valores), resumen, True)
                           + R.rc_seccion("Actividad", K.act5(bandas), "", True))


def moms_126_dc(corregida=False):
    m = K.mo_mandada("13/10/2026 11:20") + K.mo_recibida(K.HORA_A, K.QUIEN_A)
    if not corregida:
        return m + K.mo_efectos("Al recibirla", 2, 2, K.A_REC) + K.mo_decidida("Aprobada", K.DEC_A, LUCIA) + K.mo_efectos("Al aprobarla", 4, 4, K.A_APR)
    co = K.m4("Corregida", CORREGIDA, f"{LUCIA} · «{MOTIVO_CO}»", '<a class="ln" href="FRM-Respuesta-Corregir.dc.html">Ver la versión anterior y su PDF</a>')
    return (m + K.mo_decidida("Aprobada", K.DEC_A, LUCIA, pdf=K.DEC_A) + co + K.mo_efectos("Al recibirla", 2, 2, K.A_REC)
            + K.mo_por_aprobar("hace un momento", CORREGIDA, K.decidir("La corregiste vos: la aprueba otra persona con el rol Supervisor."), otra=True))


BANDAS_CORREGIDA = [("Al recibirla", [K.fila5(CORREGIDA, "Se corrigió la respuesta", f"{LUCIA} · «{MOTIVO_CO}»"),
                                      K.fila5("18:30", "Mandarle un mensaje a quien la cargó", K.QUIEN_A, "Entregado", msj="Recibimos VIS-000126. Te avisamos cuando la aprueben."),
                                      K.fila5("18:30", "Se pidió aprobación", f"Rol {SUP}")]),
                    ("Aprobación", [K.fila5("", "Espera aprobación", f"Rol {SUP}", "Por aprobar", "esp")])]
E_CO5 = ["Respuesta", "Más acciones: menú", "Corregir: el panel", "Corregir", "Con el motivo", "Sin el motivo", "Guardando", "¿Descartar la corrección?", "Corregida",
         "Ya no se puede corregir", "La versión anterior"]


def corregir5():
    sub_co = f"{FORM} · versión 4 · la cargó {K.QUIEN_A} el {K.HORA_A}"
    botones = lambda g: (f'<button type="button" class="cb cb-sec"{" disabled" if g else ""}>Cancelar</button>'
                         + (E.trabaja("Guardando…") if g else '<button type="button" class="cb cb-pri">Guardar corrección</button>'))
    res = f"{FORM} · versión 4 · recibida el {K.HORA_A}"
    ban_ant = (f'<div class="rc-ban" role="status">{F.ALERTA}<span>Versión anterior de {K.NUM_A}: la reemplazó la corrección del {CORREGIDA}.</span>'
               '<a href="FRM-Respuesta-Corregir.dc.html">Ver la actual</a></div>')
    no_se = (f'<div class="w-body"><div class="rc-msj"><b>Esta respuesta ya no se puede corregir.</b><a class="cb cb-sec" href="FRM-Respuesta-Corregir.dc.html">Ver la actual</a></div></div>')
    bnd = {"Respuesta": banda5(K.NUM_A, "Aprobada", res, acciones_dc(K.NUM_A)), "Más acciones: menú": banda5(K.NUM_A, "Aprobada", res, acciones_dc(K.NUM_A, True)),
           "Corregir: el panel": K.banda_p(), "Corregir": banda5(f"Corregir {K.NUM_A}", "", sub_co, botones(False)),
           "Con el motivo": banda5(f"Corregir {K.NUM_A}", "", sub_co, botones(False)), "Sin el motivo": banda5(f"Corregir {K.NUM_A}", "", sub_co, botones(False)),
           "Guardando": banda5(f"Corregir {K.NUM_A}", "", sub_co, botones(True)), "¿Descartar la corrección?": banda5(f"Corregir {K.NUM_A}", "", sub_co, botones(False)),
           "Corregida": banda5(K.NUM_A, "Por aprobar", f"{res} · corregida el {CORREGIDA}", acciones_dc(K.NUM_A), "Corregida"),
           "Ya no se puede corregir": banda5(f"Corregir {K.NUM_A}", "", sub_co, ""),
           "La versión anterior": banda5(K.NUM_A, "Reemplazada", res, "")}
    cu = {"Respuesta": completa5(moms_126_dc(), K.VAL_A, K.bandas_126()), "Más acciones: menú": completa5(moms_126_dc(), K.VAL_A, K.bandas_126()),
          "Corregir: el panel": K.fondo5(vista="Todas", sel=K.NUM_A).replace('<div class="w-body">', '<div class="w-body">' + K.tabs("respuestas"), 1),
          "Corregir": pagina_co(), "Con el motivo": pagina_co(MOTIVO_CO, {"Monto": "125.500,00"}),
          "Sin el motivo": pagina_co("", {"Monto": "125.500,00"}, "Escribí el motivo."), "Guardando": pagina_co(MOTIVO_CO, {"Monto": "125.500,00"}, des=True),
          "¿Descartar la corrección?": pagina_co("", {"Monto": "125.500,00"}),
          "Corregida": completa5(moms_126_dc(True), V_NUEVO, BANDAS_CORREGIDA), "Ya no se puede corregir": no_se,
          "La versión anterior": completa5(moms_126_dc(), K.VAL_A, K.bandas_126(), ban_ant)}
    descartar = A.confirmar("¿Descartar la corrección?", "Lo que cambiaste no se guarda.", "Descartar", cancelar="Seguir corrigiendo").replace('class="w-dlg"', 'class="w-dlg dec"', 1)
    capas = {"Corregir: el panel": panel_co(), "¿Descartar la corrección?": descartar, "Corregida": A.toast(f"Se corrigió {K.NUM_A}")}
    css = CSS + K.CSS_PL5 + W.CSS_20 + R.CSS_RC + CSS_R5
    t = R.pagina("Corregir una respuesta · /org/formularios/:id/respuestas/:recordId/corregir", A.con_estados([(e, bnd[e]) for e in E_CO5]),
                 A.con_estados([(e, cu[e]) for e in E_CO5]), E_CO5, css=css)
    k = t.rindex("</div>\n</x-dc>")
    t = t[:k] + A.con_estados([(e, capas.get(e, "")) for e in E_CO5]) + t[k:]
    # Las migas de la versión anterior terminan en «Versión anterior», y las de corregir en «Corregir VIS-000126»
    migas = ["Inicio / Gestión de formularios / Formularios / " + FORM + ("" if e in ("Respuesta", "Más acciones: menú", "Corregir: el panel", "Corregida") else
                                                                    " / Versión anterior" if e == "La versión anterior" else f" / Corregir {K.NUM_A}") for e in E_CO5]
    t = re.sub(r'miga: (\[[^\]]*\])\[k\]', lambda m: "miga: " + json.dumps(migas, ensure_ascii=False) + "[k]", t, count=1)
    return L.con_css(t, "pestanas", L.CSS_PESTANAS)


# ================================================================ FRM-Respuesta-Anular: el ⋮ con solo «Anular» (166) y «¿Anular VIS-000127?»
def dlg_anular5(trabajando=False):
    """Sin ✕, como toda confirmación de algo que no se deshace: dice qué pasa, pide el motivo y el botón repite la acción, en rojo."""
    cuerpo = ('<p class="d-tx">VIS-000127 queda en la planilla como anulada, con su número; deja de contar y no sale en el Excel.</p>'
              f'<div class="w-cmp"><span class="rt">Motivo <span class="req">*</span></span><div class="ct area{" des" if trabajando else ""}">{MOTIVO_ANULAR}</div></div>')
    pie = (f'<button type="button" class="cb cb-sec"{" disabled" if trabajando else ""}>Cancelar</button>'
           + (E.trabaja("Anulando…", "cb-pel lleno") if trabajando else '<button type="button" class="cb cb-pel lleno">Anular respuesta</button>'))
    return F.dialogo("¿Anular VIS-000127?", cuerpo, pie).replace('class="w-dlg"', 'class="w-dlg dec anu"', 1)


def dlg_exportar5():
    """El Excel de la 15 suma «Incluir las anuladas», sin marcar, debajo de las columnas; acá, marcada."""
    t = R.dlg_exportar().replace("4 respuestas", "24 respuestas").replace("3 filtros aplicados", "0 filtros aplicados")
    chk = f'<span class="q-chk ex-anu"><i>{TILDE}</i>Incluir las anuladas</span>'
    marca = '<span class="ex-arch">'
    return t.replace(marca, chk + marca, 1) if marca in t else t.replace('</div><div class="df">', chk + '</div><div class="df">', 1)


E_AN5 = ["Más acciones: menú", "Anular", "Anulando", "Anulada", "Estado: Anulada", "Exportar con las anuladas"]


def anular5():
    v127 = K.con_fotos([("Cliente", "Ferretería Sur"), ("Fecha de la visita", "14/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", "0,00"), ("Motivo", "Reclamo"),
                        ("Fallas", "Puerta"), ("Observaciones", "Reclamo por demora en la entrega.")], 2, False)
    pend = (K.mo_recibida(FILA_127[1], "Marta Gil, cliente") + K.mo_efectos("Al recibirla", 2, 2, K.A_REC)
            + K.mo_por_aprobar(HACE["VIS-000127"], FILA_127[1], K.decidir()))
    vista_p = lambda menu=False: K.d4("VIS-000127", "Por aprobar", pend, F.grilla(v127), K.tabs_v(2), acciones=K.acciones_vr("VIS-000127", menu=menu), pos="4 de 10")
    anulada_m = (K.mo_recibida(FILA_127[1], "Marta Gil, cliente") + K.mo_efectos("Al recibirla", 2, 2, K.A_REC)
                 + K.m4("Anulada", "15/10/2026 18:40", f"{LUCIA} · «{MOTIVO_ANULAR}»"))
    vista_a = K.d4("VIS-000127", "Anulada", anulada_m, F.grilla(v127), K.tabs_v(2), acciones=K.iconos(), pos="1 de 2", primera=True)
    sin = [r for r in K.FILAS if r[0] != "VIS-000127"] + [("VIS-000120", "11/10/2026 18:05", "Florencia Fernández de la Fuente", "", "WhatsApp", "Obra Centro", "22.000,00", "Seguimiento")]
    anuladas = [FILA_127, ANULADA]
    todas = dict(vista="Todas")
    cu = {"Más acciones: menú": K.fondo5(sel="VIS-000127", **todas), "Anular": K.fondo5(sel="VIS-000127", **todas), "Anulando": K.fondo5(sel="VIS-000127", **todas),
          "Anulada": K.fondo5(sin, pie="1–10 de 23", estados={"VIS-000120": "Aprobada"}, **todas),
          "Estado: Anulada": K.fondo5(anuladas, estado="Anulada", sel="VIS-000127", pie="1–2 de 2", pag="Página 1 de 1", estados={"VIS-000127": "Anulada", ANULADA[0]: "Anulada"}, **todas),
          "Exportar con las anuladas": K.fondo5(**todas)}
    capas = {"Más acciones: menú": vista_p(True), "Anular": vista_p() + K.sobre(dlg_anular5()), "Anulando": vista_p() + K.sobre(dlg_anular5(True)), "Anulada": A.toast("Se anuló VIS-000127"),
             "Estado: Anulada": vista_a, "Exportar con las anuladas": dlg_exportar5()}
    bnd = {e: K.banda_p() for e in E_AN5}
    return K.planilla5(E_AN5, bnd, cu, capas, "Anular una respuesta · /org/formularios/:id/respuestas", P.CSS_EX + R.CSS_EX2 + CSS_R5)


# ================================================================ FRM-Respuestas-21: «Por aprobar (3) | Todas» arriba de la planilla (148)
COLS_COLA5 = [("num", "N°", 120, ""), ("quien", "Cargó", 220, ""), ("rec", "Recibida", 150, ""), ("rol", "Rol", 150, ""), ("rev", "", 110, "")]
COLS_COLA_SOLO = [c for c in COLS_COLA5 if c[0] != "quien"]
E_PL5 = ["Por aprobar", "Desde la campana", "Todas", "Estado: menú", "Estado: Anulada", "Quien solo ve respuestas", "Quien solo aprueba", "Quien solo aprueba: la decisión",
         "Quien solo aprueba: confirmar"]


def cola5(cols=COLS_COLA5, sel=None):
    """«Por aprobar»: una tabla corta, de la más vieja a la más nueva y sin filtros ni valores; «Revisar» abre la vista rápida (148)."""
    def c(k, r):
        if k == "num":
            return f'<span><a class="pl-num" href="FRM-Respuesta-Aprobacion.dc.html">{r[0]}</a></span>'
        if k == "quien":
            return R.quien(r[2], r[3])
        if k == "rec":
            return f"<span>{r[1]}</span>"
        if k == "rol":
            return f"<span>{SUP}</span>"
        return '<span><a class="cb cb-sec" href="FRM-Respuesta-Aprobacion.dc.html">Revisar</a></span>'
    filas = sorted(POR_APROBAR, key=lambda r: r[0])
    h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(c(k, r) for k, *_ in cols) + "</div>" for r in filas)
    return (f'<div class="w-caja pl-caja pa-cola" style="--pl-cols: {R.plantilla(cols)};"><div class="pl-scroll">{R.cabecera(cols)}{h}</div>'
            '<div class="w-pie"><span>1–3 de 3</span><span>10 por página · Página 1 de 1</span></div></div>')


def respuestas5():
    vieja = next(r for r in K.FILAS if r[0] == "VIS-000123")
    m123 = (K.mo_mandada("13/10/2026 09:40") + K.mo_recibida(vieja[1], TOMAS) + K.mo_efectos("Al recibirla", 2, 2, K.A_REC)
            + K.mo_por_aprobar(HACE["VIS-000123"], vieja[1], K.decidir()))
    desde = K.d4("VIS-000123", "Por aprobar", m123, F.grilla(K.con_fotos(R.VALORES_123, 0, False)), K.tabs_v(0), acciones=K.acciones_vr("VIS-000123"), pos="1 de 3 por aprobar", primera=True)
    solo_m = K.mo_recibida(vieja[1]) + K.mo_por_aprobar(HACE["VIS-000123"], vieja[1], K.decidir())
    solo = K.d4("VIS-000123", "Por aprobar", solo_m, "", (), pos="1 de 3 por aprobar", primera=True).replace('<div class="d2-b"></div>', "", 1)
    cola_v = lambda sel=None: R.CUERPO.format(K.vistas("Por aprobar") + cola5(sel=sel))
    cu = {"Por aprobar": cola_v(), "Desde la campana": cola_v("VIS-000123"), "Todas": K.fondo5(vista="Todas"), "Estado: menú": K.fondo5(vista="Todas", menu_estado=True),
          "Estado: Anulada": K.fondo5([ANULADA], vista="Todas", estado="Anulada", pie="1 de 1", pag="Página 1 de 1", estados={ANULADA[0]: "Anulada"}),
          "Quien solo ve respuestas": K.fondo5(), "Quien solo aprueba": R.CUERPO.format(cola5(COLS_COLA_SOLO)),
          "Quien solo aprueba: la decisión": R.CUERPO.format(cola5(COLS_COLA_SOLO, "VIS-000123")), "Quien solo aprueba: confirmar": R.CUERPO.format(cola5(COLS_COLA_SOLO, "VIS-000123"))}
    sin_acciones = R.banda(FORM, "Respuestas · versión 4 publicada", "").replace('href="FRM-Formularios.dc.html"', 'href="FRM-Formularios-21.dc.html"')
    bnd = {e: (sin_acciones if e.startswith("Quien solo aprueba") else K.banda_p(K.EXPORTAR) if e == "Quien solo ve respuestas" else K.banda_p()) for e in E_PL5}
    capas = {"Desde la campana": desde, "Quien solo aprueba: la decisión": solo,
             "Quien solo aprueba: confirmar": solo + K.sobre(K.dlg_aprobar5("VIS-000123", vieja[1]))}
    t = K.planilla5(E_PL5, bnd, cu, capas, "Respuestas · /org/formularios/:id/respuestas · etapa 21", CSS_R5)
    return K.quien_mira(t, ("e.startsWith('Quien solo aprueba')", MARTIN, "martin.paz@delta.ejemplo.com"), ("e === 'Quien solo ve respuestas'", "Ana Gómez", "ana.gomez@delta.ejemplo.com"))


# ================================================================ FRM-Respuestas-Propias-21: lo propio, con el motivo del rechazo en los momentos (166)
COLS_PR5 = [c for c in COLS_PR if c[0] != "rch"]
E_PR5 = ["Lo suyo", "Una rechazada", "Una por aprobar", "Ya aprobada", "Su PDF"]


def propias5():
    def tabla5(sel=None):
        h = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(K.celda(k, r, "FRM-Respuestas-Propias-21.dc.html", EST_PR[r[0]]) for k, *_ in COLS_PR5) + "</div>"
                    for r in PROPIAS)
        return (f'<div class="w-caja pl-caja" style="--pl-cols: {R.plantilla(COLS_PR5)};"><div class="pl-scroll">{R.cabecera(COLS_PR5)}{h}</div>'
                '<div class="w-pie"><span>1–6 de 6</span><span>10 por página · Página 1 de 1</span></div></div>')
    fondo = lambda sel=None: R.CUERPO.format(K.barra21(empresa=False) + tabla5(sel))
    r117 = K.con_fotos([("Cliente", "Obra Centro"), ("Fecha de la visita", "10/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", None), ("Motivo", "Seguimiento"),
                        ("Fallas", R.gris("—")), ("Observaciones", "Avance de obra, segunda etapa.")], 0, False)
    propio = lambda n, **k: K.acciones_vr(n, completa="FRM-Respuestas-Propias-21.dc.html", chat=None, **k)
    # Quien solo carga ve en qué quedó, sin su nombre, sin el rol ni quién decidió, y sin la actividad (85 y 166)
    rch = K.mo_recibida("10/10/2026 17:20", canal="App", propio=True) + K.mo_decidida("Rechazada", "11/10/2026 09:15", motivo=MOTIVO_117)
    pend = K.mo_recibida("13/10/2026 11:04", propio=True) + K.mo_por_aprobar(HACE["VIS-000123"], "13/10/2026 11:04", solo=True)
    ok = K.mo_recibida(K.HORA_A, propio=True) + K.mo_decidida("Aprobada", K.DEC_A)
    v123 = K.con_fotos(R.VALORES_123, 0, False)
    sin_act = lambda fotos=0, pdf=False: K.tabs_v(fotos, actividad=False, pdf=pdf)
    capas = {"Una rechazada": K.d4("VIS-000117", "Rechazada", rch, F.grilla(r117), sin_act(), acciones=propio("VIS-000117"), pos="3 de 6"),
             "Una por aprobar": K.d4("VIS-000123", "Por aprobar", pend, F.grilla(v123), sin_act(), acciones=propio("VIS-000123"), pos="2 de 6"),
             "Ya aprobada": K.d4(K.NUM_A, "Aprobada", ok, F.grilla(K.VAL_A), sin_act(2, True), acciones=propio(K.NUM_A, corregir=False, pdf=True), pos="1 de 6", primera=True),
             "Su PDF": K.d4(K.NUM_A, "Aprobada", ok, K.pestana_pdf5(), sin_act(2, True), "PDF", propio(K.NUM_A, corregir=False, pdf=True), pos="1 de 6", primera=True)}
    sel = {"Una rechazada": "VIS-000117", "Una por aprobar": "VIS-000123", "Ya aprobada": K.NUM_A, "Su PDF": K.NUM_A}
    agregar = '<a class="cb cb-pri" href="FRM-Cargar-Respuesta-21.dc.html">Agregar respuesta</a>'
    bnd = {e: K.banda_p(agregar) for e in E_PR5}
    cu = {e: fondo(sel.get(e)) for e in E_PR5}
    return K.planilla5(E_PR5, bnd, cu, capas, "Lo propio · /org/formularios/:id/respuestas · etapa 21", CSS_R5)


# ================================================================ FRM-Editor-21: «Correo», con «Agregar bloque» y sin «Grupo de líneas» (177)
TIPOS5 = ["Texto corto", "Texto largo", "Número", "Fecha", "Sí o no", "Correo", "Elegir una", "Elegir varias", "De un catálogo", "Foto", "Documento", "Cálculo"]
AGREGAR_BLOQUE = f'<button type="button" class="cb cb-sec">{MAS} Agregar bloque</button>'


def con_bloque(t):
    """La caja de preguntas con «Agregar título», «Agregar bloque» y «Agregar pregunta», en ese orden, como en todas las etapas (RG10-D); si la
    caja ya trae «Agregar bloque» después de «Agregar pregunta», lo pasa adelante."""
    marca = f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button>'
    assert marca in t, "«Agregar pregunta» en la caja de preguntas"
    if "Agregar bloque" not in t:
        return t.replace(marca, AGREGAR_BLOQUE + marca)
    return t.replace(marca + AGREGAR_BLOQUE, AGREGAR_BLOQUE + marca)


@con_visita
def editor5():
    menu = ('<div class="rg2-menu" role="listbox" aria-label="Tipo de respuesta" style="top: 64px; left: calc(50% + 6px); right: auto; width: 280px;">'
            + "".join(f'<span role="option" class="{"on" if t == "Correo" else ""}">{t}</span>' for t in TIPOS5) + "</div>")
    abierta = X.abierta(3, "Correo", "").replace('<span class="rt">Tipo de respuesta</span>', f'<span class="rt">Tipo de respuesta{info(AY_CORREO)}</span>', 1)
    V = {"El tipo «Correo»": X.cuerpo(3, abierta, PV_CORREO), "Tipos de respuesta: menú": X.cuerpo(3, abierta.replace('<div class="q-ed">', '<div class="q-ed" style="position: relative;">' + menu, 1), PV_CORREO)}
    V = {e: con_bloque(v) for e, v in V.items()}
    est = list(V)
    banda = E.banda(FORM, E.EST_PUB4, E.acc("cambios"), "FRM-Formularios-21.dc.html")
    return A.pagina_editor({e: (banda, V[e]) for e in est}, {}, est, "Editor · la pregunta «Correo» · etapa 21",
                           E.CSS_E12 + E.CSS_CA4 + E.CSS_TITULOS + X.CSS_19 + K.CSS_RG + K.CSS_21 + ".q-ed .rt { display: inline-flex; align-items: center; gap: 4px; }\n")


# ================================================================ FRM-Cargar-Respuesta-21: «Correo» en dos anchos (141) y «Mantener las respuestas para la siguiente» (147)
MANTENER = f'<span class="q-chk cg-mant"><i class="no"></i>Mantener las respuestas para la siguiente</span>'


def con_mantener(bnd):
    """AR2-A: la misma casilla que el panel, en la banda de «Nueva respuesta», antes de Cancelar y Enviar; si la banda de la 20 ya la trae, no se repite."""
    if "Mantener las respuestas" in bnd:
        return bnd
    return bnd.replace('<div class="ac"><button type="button" class="cb cb-sec">Cancelar</button>', '<div class="ac">' + MANTENER + '<button type="button" class="cb cb-sec">Cancelar</button>', 1)


E_CA5 = ["Nueva respuesta", "Un correo mal escrito"]


def cargar5():
    v = {"Cliente": "Ferretería Rosales", "Fecha": "15/10/2026"}
    try:  # la banda de la 20 trae la casilla desde su tanda (AR2-A); si todavía no, va la de acá
        bnd = W.banda(titulo="Nueva respuesta", sub=f"{FORM} · versión 4", volver="FRM-Formularios-21.dc.html", con_mantener=True)
    except TypeError:
        bnd = W.banda(titulo="Nueva respuesta", sub=f"{FORM} · versión 4", volver="FRM-Formularios-21.dc.html")
    bnd = con_mantener(bnd)
    cuerpo = lambda correo, err=None: f'<div class="w-body">{zonas_visita(v, correo=correo, archivos=False, err=err)}</div>'
    V = {"Nueva respuesta": (bnd, cuerpo("")), "Un correo mal escrito": (bnd, cuerpo("compras@ferreteriarosales", {"Correo": "Escribí un correo válido, como nombre@ejemplo.com."}))}
    css = ".cg-q .ph, .co-mot .ph { color: var(--t3); }\n.w-bnd .ac .cg-mant { margin-right: 8px; font-size: 13.5px; }\n" + CSS_R5 + K.CSS_21
    return W.editor(V, {}, E_CA5, "Nueva respuesta · la pregunta «Correo» · etapa 21", css)


# ================================================================ WA-Chats-Respuesta-21: la tarjeta que dice qué pasó después (166), nuevo
# La tarjeta conserva lo que llegó y suma al pie, en gris y con el ícono de información, «Después se corrigió: …» o «Después se anuló …». La copia de
# «Mis mensajes» no cambia: es lo que mandó la persona. Por el chat de Tomás Acosta llegaron VIS-000126, que Lucía corrigió, y VIS-000127, que se
# anuló; para comparar, VIS-000123 no cambió (texto para Diseño de la 21). El número de la tarjeta abre la respuesta: la corregida en su versión
# anterior, con «Ver la actual» (FRM-Respuesta-Corregir), y la anulada con su estado (FRM-Respuesta-Anular).
CSS_CH5 = """.r-st.desp { align-items: flex-start; line-height: 1.4; }
.r-st.desp svg { margin-top: 2px; }
.r-ok .r-num { color: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; }
"""
VAL_CHAT_126 = [("Cliente", "Ferretería Rosales"), ("¿Se concretó la venta?", "Sí"), ("Monto estimado", "125.500,00"), ("Motivo", "Venta nueva")]
VAL_CHAT_127 = [("Cliente", "Ferretería Sur"), ("¿Se concretó la venta?", "No"), ("Monto estimado", "0,00"), ("Motivo", "Reclamo")]
VAL_CHAT_123 = [("Cliente", "Ferretería Rosales"), ("¿Se concretó la venta?", "No"), ("Monto estimado", "0,00"), ("Motivo", "Seguimiento")]
E_CH5 = ["Después se corrigió", "Después se anuló", "Sin cambios"]


def despues(texto):
    """Al pie de la tarjeta, en gris y con el ícono de información: la pieza de los estados de la tarjeta (r_st)."""
    return A.r_st(texto, F.INFO, "desp")


def r_num(num, destino):
    """«Guardada como VIS-…», con el número como enlace a la respuesta."""
    return A.r_ok(num).replace(f"<b>{num}</b>", f'<a class="r-num" href="{destino}">{num}</a>', 1)


def msgs_ch5(burbuja, tarjeta, m=""):
    env = burbuja("Lucía Fernández · 10:51 · Leído")
    co = tarjeta(A.grilla_r(VAL_CHAT_126) + r_num(K.NUM_A, f"{m}FRM-Respuesta-Corregir.dc.html")
                 + despues(f"Después se corrigió: {K.NUM_A} quedó reemplazada por su corrección."))
    an = tarjeta(A.grilla_r(VAL_CHAT_127) + r_num("VIS-000127", f"{m}FRM-Respuesta-Anular.dc.html") + despues("Después se anuló VIS-000127."))
    igual = tarjeta(A.grilla_r(VAL_CHAT_123) + r_num("VIS-000123", f"{m}FRM-Respuestas-21.dc.html"))
    return {"Después se corrigió": env + co, "Después se anuló": env + an, "Sin cambios": env + igual}


def chat_respuesta5():
    vp = {"Después se corrigió": f"Respuesta: {K.NUM_A}", "Después se anuló": "Respuesta: VIS-000127", "Sin cambios": "Respuesta: VIS-000123"}
    hora = {e: "11:04" for e in E_CH5}
    t = A.pagina_chat(E_CH5, {e: A.escr() for e in E_CH5}, msgs_ch5(A.burbuja, A.tarjeta), {}, vp, hora, "WhatsApp · Internos · una respuesta que después se corrigió o se anuló · etapa 21")
    return L.con_css(t, "e21", CSS_CH5)


def tel_chat_respuesta5():
    m = msgs_ch5(A.t_burbuja, A.t_tarjeta, "M-")
    return A.pagina_tchat(E_CH5, {e: A.t_escr() for e in E_CH5}, m, {}, "Una respuesta que después se corrigió o se anuló · teléfono · etapa 21",
                          A.CSS_AB + A.CSS_TRESP_AB + A.CSS_ARCH + CSS_CH5)


# ================================================================ Los teléfonos, con las piezas de la 15
def tel_respuestas5():
    est = ["Por aprobar", "Todas", "Quien solo aprueba"]
    fab = f'<a class="ap-fab" aria-label="Agregar respuesta" href="M-FRM-Cargar-Respuesta-21.dc.html">{F.TFAB}</a>'
    seg = lambda sel: f'<div class="t-vis">{K.vistas(sel)}</div>'

    def fila(r):
        e = K.ESTADO[r[0]]
        return (f'<a class="ap-fila" href="M-FRM-Respuesta-Aprobacion.dc.html"><div class="tx"><span class="l1">{r[0]}<span class="hr">{r[1]}</span></span>'
                f'<span class="l2"><span class="w-est {K.CLASE[e]}">{e}</span> · {r[5]}</span><span class="l3">{r[2]} · {r[4]}</span></div></a>')

    def fila_cola(r, quien=True):
        return (f'<a class="ap-fila" href="M-FRM-Respuesta-Aprobacion.dc.html"><div class="tx"><span class="l1">{r[0]}<span class="hr">{r[1]}</span></span>'
                + (f'<span class="l2">{r[2]}</span>' if quien else "") + f'<span class="l3">Rol {SUP}</span></div></a>')
    cola = sorted(POR_APROBAR, key=lambda r: r[0])
    bar = K.t_bar_f().replace("Publicado · versión 4", "24 respuestas")
    cu = {"Por aprobar": bar + seg("Por aprobar") + '<div class="ap-cuerpo">' + "".join(fila_cola(r) for r in cola) + "</div>",
          "Todas": bar + seg("Todas") + '<div class="ap-cuerpo">' + "".join(fila(r) for r in K.FILAS) + "</div>" + fab,
          "Quien solo aprueba": C.t_bar(FORM, "Por aprobar · 3", "M-FRM-Formularios-21.dc.html") + '<div class="ap-cuerpo">' + "".join(fila_cola(r, False) for r in cola) + "</div>"}
    css = W.CSS_TP + K.CSS_21 + K.CSS_V5 + ".t-vis { padding: 10px 16px; border-bottom: 1px solid var(--borde); background: #fff; }\n.t-vis .pa-vis, .t-vis .ab-seg { width: 100%; }\n.t-vis .ab-seg > span { flex: 1; text-align: center; padding: 8px 10px; font-size: 14px; }\n"
    t = C.tel_pagina(cu, est, {}, "Respuestas · teléfono · etapa 21", css)
    return K.con_tabs_tel(t, "respuestas")


def tel_corregir5():
    est = ["Respuesta", "Más acciones", "Corregir", "Corregida"]
    m126 = ('<div class="tr-moms">' + K.t_m4("Recibida", K.HORA_A, f"Por WhatsApp · {K.QUIEN_A}") + K.t_m4("Aprobada", K.DEC_A, f"{LUCIA} · rol {SUP}") + "</div>")
    base = (K.t_bar_v(K.NUM_A, "Aprobada") + K.t_nav("5 de 10") + '<div class="tr-scroll">' + m126 + K.t_sec("Respuesta", K.t_grilla(K.VAL_A)) + "</div>")
    menu = F.thoja("Más acciones", '<div class="ap-acciones2"><span role="menuitem" style="color: var(--peligro);">Anular</span></div>', "")
    zona_t = W.t_zona
    form = (C.t_bar(f"Corregir {K.NUM_A}", f"La cargó {K.QUIEN_A}", "M-FRM-Respuesta-Corregir.dc.html") + '<div class="ap-cuerpo">'
            + zona_t("La visita", "", True) + zona_t("El resultado", W.t_txt("Monto estimado", "130.000,00") + '<span class="co-ant t">Antes: 125.500,00</span>')
            + zona_t("Fotos y documentos", ya("IMG_2231.jpg", "86 KB") + ya("IMG_2232.jpg", "92 KB") + ya("remito-0810.pdf", "1,2 MB", False))
            + '<div class="t-mot">' + F.tcampo("Motivo de la corrección", MOTIVO_CO, req=True) + "</div></div>"
            + '<div class="ap-fijo"><button type="button" class="cb cb-pri full">Guardar corrección</button></div>')
    mco = ('<div class="tr-moms">' + K.t_m4("Recibida", K.HORA_A, f"Por WhatsApp · {K.QUIEN_A}") + K.t_m4("Aprobada", K.DEC_A, f"{LUCIA} · PDF del {K.DEC_A}")
           + K.t_m4("Corregida", CORREGIDA, f"{LUCIA} · «{MOTIVO_CO}»", '<a class="ln" href="#">Ver la versión anterior y su PDF</a>')
           + K.t_m4("Por aprobar otra vez", "hace un momento", "el PDF nuevo sale al aprobarla", clase="esp") + "</div>")
    corregida = (K.t_bar_v(K.NUM_A, "Por aprobar").replace("</h1>", "</h1>", 1) + K.t_nav("5 de 10") + '<div class="tr-scroll">' + mco
                 + K.t_sec("Respuesta", K.t_grilla(V_NUEVO)) + "</div>")
    toast = f'<div class="t-toast" role="status"><span class="ok">{F.OK}</span><span>Se corrigió {K.NUM_A}</span></div>'
    css = W.CSS_TP + CSS_R21 + K.CSS_21 + R.CSS_T5_TEL + P.CSS_TPL + R.CSS_T15 + K.CSS_TV5 + CSS_R5 + A.CSS_ARCH + """.co-ant.t { margin: -4px 0 0; font-size: 13.5px; }
.ap-cuerpo .co-ya { margin: 0; }
.t-mot { margin: 16px 16px 90px; padding-top: 14px; border-top: 1px solid var(--borde2); }
"""
    return C.tel_pagina({"Respuesta": base, "Más acciones": base, "Corregir": form, "Corregida": corregida}, est, {"Más acciones": menu, "Corregida": toast}, "Corregir · teléfono · etapa 21", css)


def tel_anular5():
    est = ["Más acciones", "Anular", "Anulada"]
    v127 = [("Cliente", "Ferretería Sur"), ("¿Se concretó la venta?", "No"), ("Motivo", "Reclamo"), ("Observaciones", "Reclamo por demora en la entrega.")]
    m127 = '<div class="tr-moms">' + K.t_m4("Recibida", FILA_127[1], "Por WhatsApp · Marta Gil, cliente") + K.t_m4("Por aprobar", HACE["VIS-000127"], f"Rol {SUP}", clase="esp") + "</div>"
    base = K.t_bar_v("VIS-000127", "Por aprobar") + K.t_nav("4 de 10") + '<div class="tr-scroll">' + m127 + K.t_sec("Respuesta", K.t_grilla(v127)) + "</div>"
    menu = F.thoja("Más acciones", '<div class="ap-acciones2"><span role="menuitem" style="color: var(--peligro);">Anular</span></div>', "")
    hoja = K.t_hoja_dec("¿Anular VIS-000127?", "VIS-000127 queda en la planilla como anulada, con su número; deja de contar y no sale en el Excel.",
                        '<button type="button" class="cb cb-pel lleno">Anular respuesta</button><button type="button" class="cb cb-sec">Cancelar</button>')
    hoja = hoja.replace('</p></div><div class="hp">', '</p>' + F.tcampo("Motivo", MOTIVO_ANULAR, req=True) + '</div><div class="hp">', 1)
    sin = [r for r in K.FILAS if r[0] != "VIS-000127"]
    lista = (K.t_bar_f().replace("Publicado · versión 4", "23 respuestas") + '<div class="ap-cuerpo">'
             + "".join(f'<a class="ap-fila" href="#"><div class="tx"><span class="l1">{r[0]}<span class="hr">{r[1]}</span></span><span class="l2">{K.est(K.ESTADO[r[0]])} · {r[5]}</span></div></a>' for r in sin) + "</div>")
    toast = '<div class="t-toast" role="status"><span class="ok">' + F.OK + '</span><span>Se anuló VIS-000127</span></div>'
    css = W.CSS_TP + K.CSS_21 + R.CSS_T5_TEL + P.CSS_TPL + R.CSS_T15 + K.CSS_TV5
    return C.tel_pagina({"Más acciones": base, "Anular": base, "Anulada": lista}, est, {"Más acciones": menu, "Anular": hoja, "Anulada": toast}, "Anular · teléfono · etapa 21", css)


def tel_propias5():
    est = ["Lo suyo", "Una rechazada"]
    der = f'<button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'
    fab = f'<a class="ap-fab" aria-label="Agregar respuesta" href="M-FRM-Cargar-Respuesta-21.dc.html">{F.TFAB}</a>'
    filas = "".join(f'<a class="ap-fila" href="M-FRM-Respuestas-Propias-21.dc.html"><div class="tx"><span class="l1">{r[0]}<span class="hr">{r[1]}</span></span>'
                    f'<span class="l2"><span class="w-est {K.CLASE[EST_PR[r[0]]]}">{EST_PR[r[0]]}</span> · {r[5]}</span></div></a>' for r in PROPIAS)
    lista = C.t_bar(FORM, "6 respuestas", "M-FRM-Formularios-21.dc.html", der) + '<div class="ap-cuerpo">' + filas + "</div>" + fab
    m = ('<div class="tr-moms">' + K.t_m4("Recibida", "10/10/2026 17:20", "En la app") + K.t_m4("Rechazada", "11/10/2026 09:15", "", f'<span class="mot">{MOTIVO_117}</span>') + "</div>")
    v117 = [("Cliente", "Obra Centro"), ("¿Se concretó la venta?", "No"), ("Motivo", "Seguimiento"), ("Observaciones", "Avance de obra, segunda etapa.")]
    rch = (K.t_bar_v("VIS-000117", "Rechazada", "M-FRM-Respuestas-Propias-21.dc.html") + K.t_nav("3 de 6", chat=False) + '<div class="tr-scroll">' + m
           + K.t_sec("Respuesta", K.t_grilla(v117)) + "</div>")
    css = W.CSS_TP + K.CSS_TRG + K.CSS_21 + R.CSS_T5_TEL + P.CSS_TPL + R.CSS_T15 + K.CSS_TV5
    return C.tel_pagina({"Lo suyo": lista, "Una rechazada": rch}, est, {}, "Lo propio · teléfono · etapa 21", css)


def tel_editor5():
    est = ["El tipo «Correo»"]
    t = (C.t_bar("Correo del cliente", "Pregunta", "M-FRM-Editor-21.dc.html") + '<div class="ap-cuerpo"><div class="rg-hb">' + F.tcampo("Pregunta", "Correo del cliente", req=True)
         + F.tcampo("Tipo de respuesta", "Correo", extra=A.t_info(AY_CORREO)) + F.tcampo("Ayuda para quien lo recibe", "Opcional", vacio=True)
         + '<span class="q-chk"><i class="no"></i>Obligatoria</span></div></div><div class="ap-fijo"><button type="button" class="cb cb-pri full">Listo</button></div>')
    return C.tel_pagina({"El tipo «Correo»": t}, est, {}, "La pregunta «Correo» · teléfono · etapa 21", E.CSS_E12 + E.CSS_TED_E12 + W.CSS_TP + K.CSS_TRG)


def tel_cargar5():
    est = ["Nueva respuesta", "Un correo mal escrito"]

    def pag(correo, mal=None):
        datos = W.t_txt("Cliente", "Ferretería Rosales", True) + W.t_txt("Fecha de la visita", "15/10/2026", True) + W.t_txt("Correo del cliente", correo, mal=mal, ph="nombre@ejemplo.com")
        fijo = (f'<div class="ap-fijo t-mant">{MANTENER}<button type="button" class="cb cb-pri full">{W.ENVIAR}</button></div>')
        return (C.t_bar("Nueva respuesta", f"{FORM} · versión 4", "M-FRM-Formularios-21.dc.html") + '<div class="ap-cuerpo">' + W.t_zona("La visita", datos) + W.t_zona("El resultado", "", True)
                + W.t_zona("Fotos y documentos", "", True) + "</div>" + fijo)
    css = W.CSS_TP + K.CSS_21 + ".ap-fijo.t-mant { flex-direction: column; align-items: stretch; gap: 10px; }\n.ap-fijo.t-mant .q-chk { font-size: 15px; display: inline-flex; align-items: center; gap: 8px; }\n"
    return C.tel_pagina({"Nueva respuesta": pag(""), "Un correo mal escrito": pag("compras@ferreteriarosales", "Escribí un correo válido, como nombre@ejemplo.com.")}, est, {},
                        "Nueva respuesta · la pregunta «Correo» · teléfono · etapa 21", css)


# ================================================================ canvas.json (la fila de cada uno la pone formularios_etapas_1004.py)
TITULOS = {"FRM-Respuestas-21": ("Formularios · la planilla con «Estado» · etapa 21", 1440, 900), "M-FRM-Respuestas-21": ("La planilla · teléfono · etapa 21", 390, 844),
           "FRM-Tablero-21": ("Formularios · el tablero con «Por estado» · etapa 21", 1440, 1500), "M-FRM-Tablero-21": ("El tablero · teléfono · etapa 21", 390, 844),
           "FRM-Respuesta-Corregir": ("Formularios · corregir una respuesta · etapa 21", 1440, 1400), "M-FRM-Respuesta-Corregir": ("Corregir · teléfono · etapa 21", 390, 844),
           "FRM-Respuesta-Anular": ("Formularios · anular una respuesta · etapa 21", 1440, 900), "M-FRM-Respuesta-Anular": ("Anular · teléfono · etapa 21", 390, 844),
           "FRM-Respuestas-Propias-21": ("Formularios · lo propio · etapa 21", 1440, 900), "M-FRM-Respuestas-Propias-21": ("Lo propio · teléfono · etapa 21", 390, 844),
           "FRM-Editor-21": ("Formularios · la pregunta «Correo» · etapa 21", 1440, 1400), "M-FRM-Editor-21": ("La pregunta «Correo» · teléfono · etapa 21", 390, 844),
           "FRM-Cargar-Respuesta-21": ("Nueva respuesta · la pregunta «Correo» · etapa 21", 1440, 1100), "M-FRM-Cargar-Respuesta-21": ("Nueva respuesta · «Correo» · teléfono · etapa 21", 390, 844),
           "FRM-Dar-De-Baja-21": ("Formularios · dar de baja · etapa 21", 1440, 900), "FRM-Editor-Baja-21": ("Formularios · un dado de baja · etapa 21", 1440, 900),
           "WA-Chats-Respuesta-21": ("WhatsApp · una respuesta que después se corrigió o se anuló · etapa 21", 1440, 900),
           "M-WA-Conversacion-Respuesta-21": ("Corregida o anulada en el chat · teléfono · etapa 21", 390, 844)}


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
    lista = K.solo()  # «--solo A,B»: solo esos tableros, sin tocar canvas.json
    hechos = []
    quiere = lambda n: lista is None or n in lista

    def escribir(n, t):
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
        hechos.append(n)
    for n, f, alto, pestana in [("FRM-Respuestas-21", respuestas5, None, "respuestas"), ("FRM-Respuesta-Corregir", corregir5, 1400, None),
                                ("FRM-Respuesta-Anular", anular5, None, "respuestas"), ("FRM-Respuestas-Propias-21", propias5, None, None), ("FRM-Editor-21", editor5, 1400, "diseno"),
                                ("FRM-Cargar-Respuesta-21", cargar5, 1100, None)]:
        if not quiere(n):
            continue
        t = L.sin_disenar(n, E.post(n, f(), alto))
        t = W.css_y_alto(t, alto)
        if pestana:
            t = K.con_tabs(t, pestana)
        if n == "FRM-Cargar-Respuesta-21":
            t = t.replace(f"Formularios / {FORM}</span>", f"Formularios / {FORM} / Nueva respuesta</span>", 1)
        if n == "FRM-Respuestas-Propias-21":
            t = como_tomas(t)
        escribir(n, K.enlaces(K.migas(t)))
    for n, f in [("FRM-Tablero-21", tablero), ("M-FRM-Tablero-21", tel_tablero), ("FRM-Dar-De-Baja-21", dar_de_baja), ("FRM-Editor-Baja-21", editor_baja)]:
        if quiere(n):
            escribir(n, K.enlaces(f()))
    if quiere("WA-Chats-Respuesta-21"):
        escribir("WA-Chats-Respuesta-21", K.enlaces(E.post("WA-Chats-Respuesta-21", chat_respuesta5())))
    for n, f in [("M-FRM-Respuestas-21", tel_respuestas5), ("M-FRM-Respuesta-Corregir", tel_corregir5), ("M-FRM-Respuesta-Anular", tel_anular5), ("M-FRM-Respuestas-Propias-21", tel_propias5),
                 ("M-FRM-Editor-21", tel_editor5), ("M-FRM-Cargar-Respuesta-21", tel_cargar5), ("M-WA-Conversacion-Respuesta-21", tel_chat_respuesta5)]:
        if quiere(n):
            escribir(n, K.enlaces(E.post(n, f())))
    if lista is None:
        registrar()
    print("tableros", len(hechos), hechos)
