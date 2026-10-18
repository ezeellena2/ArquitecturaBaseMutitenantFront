"""Etapa 16 · Reglas, aprobación, PDF y avisos con la disposición de ArquitecturaBase (G1 a G6 del lienzo «Formularios por WhatsApp»).

Sigue a `formularios_ab_planilla_1004.py` (E15), con las mismas piezas. Spec: `docs/plans/formularios/e16-reglas-y-aprobacion.md` del back y el
anexo B del traspaso (E4.1 a E4.7). Donde la disposición de allá choca con una regla escrita del lienzo, manda la nuestra: ⋮ en las filas de
reglas y de acciones en lugar de botones sueltos; «Ver: para mí ▾» en lugar del segmentado; las explicaciones van en ⓘ; las acciones de la
página del PDF van en la banda («Descartar» y «Guardar diseño»). Decisiones del usuario: 25 (quién aprueba) y 26 (fuera de las 24 horas, «No se pudo»).

Tableros: FRM-Editor-Reglas (G1, el editor más abajo), FRM-Pdf (G2), FRM-Por-Aprobar (G3), FRM-Respuesta-Aprobacion (G4 y G5 en el D2),
WA-Chats-Avisos (G6) y los teléfonos M-FRM-Reglas, M-FRM-Por-Aprobar, M-FRM-Respuesta-Aprobacion y M-WA-Conversacion-Avisos. Además suma
«Por aprobar» al panel de Formularios y a Más › Formularios, el grupo «Por aprobar» a «Para resolver» del inicio y el enlace a las reglas en
el editor del teléfono. Corre después de `formularios_ab_planilla_1004.py`.
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

PROJ = F.PROJ
svg = F.svg
X, CHEV, INFO, ALERTA, OK, MAS, KEBAB = F.X, F.CHEV, F.INFO, F.ALERTA, F.OK, F.MAS, F.KEBAB
LAPIZ, ARRIBA, ABAJO, QUITAR = F.LAPIZ, F.ARRIBA, F.ABAJO, F.QUITAR
CHECK, CHAT, PERSONA, SUBE, BAJA, ARCHIVO, TRI, DESCARGAR = P.CHECK, P.CHAT, P.PERSONA, P.SUBE, P.BAJA, P.ARCHIVO, P.TRI, A.DESCARGAR
APROBAR = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18)
RELOJ = A.RELOJ
E16_APROBADA = True
info = F.info


# ================================================================ G1 · «Cuando llega una respuesta», debajo de las preguntas del editor
REGLAS = [
    (1, "se recibe una respuesta", None, ["Mandarle un mensaje a quien la cargó: «Recibimos {número}. Te avisamos cuando la aprueben.»",
                                          "Pedir aprobación a una persona con el rol <b>Administrador</b>"]),
    (2, "se aprueba una respuesta", None, ["Armar el PDF «Comprobante de visita» · <a class=\"lnk\" href=\"FRM-Pdf.dc.html\">Ver el diseño</a>", "Mandarle el PDF a quien la cargó: «Aprobaron {número}. Te mandamos el comprobante.»"]),
    (3, "se aprueba una respuesta", "Monto estimado es mayor o igual a 100.000",
     ["Avisar a las personas con el rol <b>Dueño</b>: «Se aprobó {número}, de {Cliente}, por {Monto estimado}.»"]),
    (4, "se rechaza una respuesta", None, ["Mandarle a quien la cargó el motivo del rechazo"]),
]
CSS_RG = """.rg-body { overflow: hidden !important; }
.rg-arriba { flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
.rg-cols { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; flex-shrink: 0; }
.rg .f-cab .der, .rg-hist .f-cab .der { display: flex; align-items: center; gap: 10px; }
.rg .f-cab .cb { height: 32px; font-size: 13px; }
.rg .f-cab .cb[disabled] { opacity: 0.55; cursor: default; }
.rg-tit { display: inline-flex; align-items: center; gap: 4px; }
.rg-fila { position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr) 32px; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--borde); align-items: start; }
.rg-fila .n { font-size: 13px; color: var(--t3); font-weight: 600; padding-top: 2px; }
.rg-fila.abierta { background: oklch(0.985 0.006 78); }
.rg-fila .f-menu { top: 40px; right: 16px; }
.rg-tx { display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; line-height: 1.45; min-width: 0; }
.rg-tx .ln { display: flex; align-items: baseline; gap: 8px; }
.rg-tx .lnk { color: var(--marca-tx); font-weight: 500; text-decoration: none; }
.rg-tx ol { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 2px; }
.rg-et { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 6px; background: var(--s2); border: 1px solid var(--borde); font-size: 12px; font-weight: 600; color: var(--t2); flex-shrink: 0; }
.rg-ed { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.rg-ed .w-cmp.cuando { max-width: 320px; }
.rg-sec { display: flex; flex-direction: column; gap: 8px; }
.rg-sec > .rt { font-size: 13px; font-weight: 600; color: var(--t2); display: inline-flex; align-items: center; gap: 4px; }
.rg-sec > .cb { align-self: flex-start; height: 32px; font-size: 13px; }
.rg-acc { position: relative; display: grid; grid-template-columns: 20px minmax(0, 1fr) 32px; gap: 10px; padding: 12px; border: 1px solid var(--borde); border-radius: 10px; background: #fff; }
.rg-acc.mal { border-color: oklch(0.8 0.1 25); }
.rg-acc .n { font-size: 13px; color: var(--t3); padding-top: 28px; }
.rg-acc .cuerpo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; align-items: start; }
.rg-acc .cuerpo .ancho { grid-column: 1 / -1; }
.rg-acc .ib { margin-top: 22px; }
.rg-acc .lnk { color: var(--marca-tx); font-weight: 500; text-decoration: none; font-size: 13px; }
.rg-acc .txt { align-self: end; font-size: 13px; color: var(--t2); padding-bottom: 9px; }
.rg-ck { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--t1); }
.rg-ck .bx { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--borde2); display: inline-flex; align-items: center; justify-content: center; background: #fff; box-sizing: border-box; }
.rg-ck.on .bx { background: var(--marca); border-color: var(--marca); color: #fff; }
.rg-err { font-size: 12.5px; color: oklch(0.5 0.19 25); display: flex; gap: 6px; align-items: flex-start; grid-column: 2 / 3; }
.rg-err svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; }
.rg-listo { display: flex; justify-content: flex-end; }
.rg-pie { padding: 12px 16px; border-top: 1px solid var(--borde); }
.rg-pie .cb { height: 32px; font-size: 13px; }
.rg-vacio { padding: 28px 16px; text-align: center; color: var(--t2); border-top: 1px solid var(--borde); display: flex; flex-direction: column; align-items: center; gap: 10px; }
.rg-vacio b { color: var(--t1); }
.rg-cartel { margin: 0 16px 12px; }
.rg-hist .h { display: flex; flex-direction: column; gap: 2px; padding: 10px 16px; border-top: 1px solid var(--borde); font-size: 13.5px; }
.rg-hist .h a { color: var(--t1); font-weight: 600; text-decoration: none; display: inline-flex; gap: 8px; align-items: center; }
.rg-hist .h small { font-size: 12.5px; color: var(--t3); }
.rg-hist .w-est { font-size: 12px; }
.rg-hist .w-pie { font-size: 12.5px; }
.rg-res { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
.rg-res .rg-fila:first-child { border-top: 0; }
.rg-res .rg-fila { grid-template-columns: 24px minmax(0, 1fr); }
"""


def rg_menu(n):
    return (f'<div class="f-menu" role="menu" aria-label="Acciones de la regla {n}"><span class="f-mi" role="menuitem">{LAPIZ} Editar</span>'
            f'<span class="f-mi" role="menuitem">{ARRIBA} Subir</span><span class="f-mi" role="menuitem">{ABAJO} Bajar</span>'
            f'<span class="f-sep" role="separator"></span><span class="f-mi pel" role="menuitem">{QUITAR} Quitar regla</span></div>')


def rg_resumen(n, cuando, si, acciones):
    s = f'<span class="ln"><span class="rg-et">Si</span><span>{si}</span></span>' if si else ""
    ol = "".join(f"<li>{a}</li>" for a in acciones)
    return (f'<div class="rg-tx"><span class="ln"><span class="rg-et">Cuando</span><span>{cuando}</span></span>{s}'
            f'<span class="ln"><span class="rg-et">Hacer</span><ol>{ol}</ol></span></div>')


def rg_fila(regla, menu=False, kebab=True):
    n, cuando, si, acciones = regla
    k = f'<button type="button" class="ib" aria-label="Acciones de la regla {n}">{KEBAB}</button>' if kebab else ""
    return f'<div class="rg-fila"><span class="n">{n}</span>{rg_resumen(n, cuando, si, acciones)}{k}{rg_menu(n) if menu else ""}</div>'


def campo(rot, valor, sel=False, ancho=False, req=False, extra_rt="", clase=""):
    r = ' <span class="req">*</span>' if req else ""
    v = valor + (CHEV if sel else "")
    return (f'<div class="w-cmp{" ancho" if ancho else ""}{" " + clase if clase else ""}"><span class="rt">{rot}{r}{extra_rt}</span>'
            f'<div class="ct{" sel" if sel else ""}">{v}</div></div>')


def area(rot, valor, req=True, extra_rt=""):
    r = ' <span class="req">*</span>' if req else ""
    return f'<div class="w-cmp ancho"><span class="rt">{rot}{r}{extra_rt}</span><div class="ct area">{valor}</div></div>'


AYUDA_MSJ = info("Solo el español es obligatorio. Usá {número} y el nombre de una pregunta entre llaves para completar con la respuesta.")


def rg_accion(k, cuerpo, mal=""):
    err = f'<span class="rg-err">{ALERTA}{mal}</span>' if mal else ""
    return (f'<div class="rg-acc{" mal" if mal else ""}"><span class="n">{k}.</span><div class="cuerpo">{cuerpo}</div>'
            f'<button type="button" class="ib" aria-label="Acciones de la acción {k}">{KEBAB}</button>{err}</div>')


def rg_abierta(modo="editar"):
    if modo == "error":
        n, cuando = 1, "Se recibe una respuesta"
        conds = '<span class="ab-sub">Sin condición.</span>'
        acciones = (rg_accion(1, campo("Acción 1", "Pedir aprobación a una persona con un rol", sel=True) + campo("Rol", "Administrador", sel=True))
                    + rg_accion(2, campo("Acción 2", "Mandarle un mensaje a quien la cargó", sel=True)
                                + area("Mensaje", "Recibimos {número}. Te avisamos cuando la aprueben.", extra_rt=AYUDA_MSJ),
                                mal="Pedir aprobación tiene que ser la última acción. Lo que sigue va en «Se aprueba» o «Se rechaza»."))
        agregar = f'<button type="button" class="cb cb-sec" disabled title="Después de pedir aprobación no se agregan más acciones">{MAS} Agregar acción</button>'
    else:
        n, cuando = 3, "Se aprueba una respuesta"
        conds = C.f_cond("Si", "Monto estimado", "Es mayor o igual a", "100.000")
        acciones = rg_accion(1, campo("Acción 1", "Avisar a las personas con un rol", sel=True) + campo("Rol", "Dueño", sel=True)
                             + area("Mensaje", "Se aprobó {número}, de {Cliente}, por {Monto estimado}.", extra_rt=AYUDA_MSJ))
        agregar = f'<button type="button" class="cb cb-sec">{MAS} Agregar acción</button>'
    si = (f'<div class="rg-sec"><span class="rt">Si (opcional) {info("Sin condición, la regla corre siempre. Las condiciones usan las preguntas del formulario.")}</span>'
          f'{conds}<button type="button" class="cb cb-enl">{MAS} Agregar condición</button></div>')
    hacer = f'<div class="rg-sec"><span class="rt">Hacer, en este orden</span>{acciones}{agregar}</div>'
    ed = (f'<div class="rg-ed">{campo("Cuándo", cuando, sel=True, clase="cuando")}{si}{hacer}'
          '<div class="rg-listo"><button type="button" class="cb cb-sec">Listo</button></div></div>')
    return f'<div class="rg-fila abierta"><span class="n">{n}</span>{ed}<span></span></div>'


def caja_reglas(modo="normal"):
    """modo: normal, menu, editar, sucio, guardando, guardadas, error, conflicto, vacio, sin_permiso."""
    tit = f'<span class="rg-tit">Cuando llega una respuesta {info("Se guardan aparte: cambiarlas no crea otra versión ni toca WhatsApp. Lo que ya pasó con cada respuesta no cambia.")}</span>'
    if modo == "sin_permiso":
        return (f'<div class="w-caja rg"><div class="f-cab">{tit}</div><div class="rg-vacio"><b>Ya no tenés permiso para administrar las reglas.</b></div></div>')
    sucio = modo in ("editar", "sucio", "guardando", "error", "conflicto")
    if modo == "guardadas":
        insignia = '<span class="ab-chip">Revisión 4</span>'
    elif sucio:
        insignia = '<span class="f-sucio">Cambios sin guardar</span>'
    elif modo == "vacio":
        insignia = ""
    else:
        insignia = '<span class="ab-chip">Revisión 3</span>'
    apagado = (not sucio) or modo in ("guardando", "error", "conflicto")
    boton = f'<button type="button" class="cb cb-pri"{" disabled" if apagado else ""}>{"Guardando reglas…" if modo == "guardando" else "Guardar reglas"}</button>'
    cartel = ""
    if modo == "conflicto":
        cartel = (f'<div class="w-cartel rg-cartel" role="alert">{TRI}<span class="tx">Las reglas cambiaron mientras las editabas. Releé la revisión actual.</span>'
                  '<button type="button" class="cb cb-sec">Releer reglas</button></div>')
    if modo == "vacio":
        filas = f'<div class="rg-vacio"><b>Todavía no hay reglas.</b></div>'
    else:
        filas = ""
        for r in REGLAS:
            if (modo == "editar" and r[0] == 3) or (modo == "error" and r[0] == 1):
                filas += rg_abierta("error" if modo == "error" else "editar")
            else:
                filas += rg_fila(r, menu=(modo == "menu" and r[0] == 2))
    pie = f'<div class="rg-pie"><button type="button" class="cb cb-sec">{MAS} Agregar regla</button></div>'
    return f'<div class="w-caja rg"><div class="f-cab">{tit}<span class="der">{insignia}{boton}</span></div>{cartel}{filas}{pie}</div>'


def caja_historial(modo="normal"):
    tit = f'<span class="rg-tit">Historial de las reglas {info("Cada respuesta recuerda con qué revisión se procesó. Los cambios se aplican a las respuestas nuevas.")}</span>'
    if modo == "sin_permiso":
        return ""
    if modo == "vacio":
        return f'<div class="w-caja rg-hist"><div class="f-cab">{tit}</div><div class="rg-vacio">Todavía no se guardaron reglas.</div></div>'
    revs = [("Revisión 3", "15/10/2026 · Lucía Fernández", True), ("Revisión 2", "10/10/2026 · Lucía Fernández", False), ("Revisión 1", "02/10/2026 · Lucía Fernández", False)]
    if modo == "guardadas":
        revs = [("Revisión 4", "18/10/2026 · Lucía Fernández", True)] + [(a, b, False) for a, b, _ in revs]
    filas = "".join(f'<div class="h"><a href="#">{n}{" <span class=" + chr(34) + "w-est" + chr(34) + ">Vigente</span>" if v else ""}</a><small>{d}</small></div>'
                    for n, d, v in revs)
    return f'<div class="w-caja rg-hist"><div class="f-cab">{tit}</div>{filas}</div>'


def cuerpo_reglas(modo="normal"):
    arriba = A.cuerpo_editor(abierta=False, modo="fijo")
    arriba = arriba[len('<div class="w-body">'):-len("</div>")]
    return (f'<div class="w-body rg-body"><div class="rg-arriba">{arriba}</div>'
            f'<div class="rg-cols">{caja_reglas(modo)}{caja_historial(modo)}</div></div>')


ESTADOS_RG = ["Reglas", "Acciones de una regla", "Editar una regla", "Cambios sin guardar", "Guardando reglas", "Reglas guardadas",
              "Una regla con errores", "Las reglas cambiaron", "Ver una revisión", "Sin reglas", "Sin permiso para las reglas"]
MODO_RG = {"Reglas": "normal", "Acciones de una regla": "menu", "Editar una regla": "editar", "Cambios sin guardar": "sucio", "Guardando reglas": "guardando",
           "Reglas guardadas": "guardadas", "Una regla con errores": "error", "Las reglas cambiaron": "conflicto", "Ver una revisión": "normal",
           "Sin reglas": "vacio", "Sin permiso para las reglas": "sin_permiso"}
SUBIR_EDITOR = 640  # cuánto del editor queda arriba, fuera de la vista: el tablero muestra la página más abajo, en las reglas


def reglas():
    vol = "FRM-Listado.dc.html"
    V = {e: (A.banda("Visita a cliente", A.EST_PUB, A.acc_editor(publicado=True), vol), cuerpo_reglas(m)) for e, m in MODO_RG.items()}
    rev2 = [(1, "se recibe una respuesta", None, ["Pedir aprobación a una persona con el rol <b>Administrador</b>"]),
            (2, "se aprueba una respuesta", None, ["Armar el PDF «Comprobante de visita»", "Mandarle el PDF a quien la cargó: «Aprobaron {número}. Te mandamos el comprobante.»"])]
    dlg = F.dialogo("Revisión 2 · 10/10/2026 · Lucía Fernández", '<div class="rg-res">' + "".join(rg_fila(r, kebab=False) for r in rev2) + "</div>",
                    '<button type="button" class="cb cb-sec">Cerrar</button>').replace('class="w-dlg"', 'class="w-dlg" style="width: 640px;"', 1)
    capas = {"Reglas guardadas": A.toast("Reglas guardadas."), "Ver una revisión": dlg}
    css = C.CSS_K4 + CSS_RG + f".rg-arriba {{ margin-top: -{SUBIR_EDITOR}px; }}\n"
    return A.pagina_editor(V, capas, ESTADOS_RG, "Editor del formulario · reglas · /org/formularios/:id", css)


# ================================================================ G2 · FRM-Pdf: el diseño del PDF
PREGS_PDF = ["Cliente", "Fecha de la visita", "¿Se concretó la venta?", "Monto estimado", "Motivo", "Supervisor a cargo", "Fotos de la visita", "Remito firmado", "Observaciones"]
CSS_PDF = """.pd-cols { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 24px; align-items: start; }
.pd-form { padding: 16px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
.pd-form .ancho { grid-column: 1 / -1; }
.pd-lista { display: flex; flex-direction: column; gap: 4px; }
.pd-lista .rt, .pd-sec > .rt { font-size: 13px; font-weight: 600; color: var(--t2); display: inline-flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.pd-pie { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--t3); border-top: 1px solid var(--borde); padding-top: 12px; }
.pd-prev { padding: 14px; background: var(--s2); display: flex; flex-direction: column; gap: 10px; }
.pd-hoja { background: #fff; border: 1px solid var(--borde); border-radius: 4px; box-shadow: 0 6px 16px oklch(0.24 0.014 78 / 0.08); padding: 22px 22px 16px; display: flex; flex-direction: column; gap: 12px; font-size: 12px; }
.pd-hoja .cab { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 2px solid var(--marca); }
.pd-hoja .cab .org { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; }
.pd-hoja .cab .org .lg { width: 22px; height: 22px; border-radius: 5px; background: var(--marca); color: #fff; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; }
.pd-hoja .cab small { color: var(--marca-tx); font-size: 11.5px; }
.pd-hoja h3 { margin: 0; font-size: 17px; }
.pd-hoja .sub { color: var(--t3); font-size: 11.5px; margin-top: -8px; }
.pd-hoja .gr { display: grid; grid-template-columns: 120px minmax(0, 1fr); }
.pd-hoja .gr > span { padding: 6px 0; border-top: 1px solid var(--borde); }
.pd-hoja .gr .k { color: var(--t2); }
.pd-hoja .gr .r-th { width: 40px; height: 40px; }
.pd-hoja .apr { border: 1px dashed var(--borde2); border-radius: 6px; padding: 8px 10px; color: var(--t3); }
.pd-hoja .apr b { display: block; color: var(--t2); font-weight: 500; }
.pd-hoja .fin { color: var(--t3); font-size: 11px; display: flex; justify-content: space-between; }
.w-caja .f-cab .ab-seg > span { padding: 4px 12px; font-size: 13px; }
.pd-av { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; border-radius: 8px; font-size: 12.5px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.pd-av svg { flex-shrink: 0; }
.w-cmp .ct.mal { border-color: var(--peligro); }
.w-cmp .err2 { font-size: 12.5px; color: oklch(0.5 0.19 25); }
"""


def ck(texto, on=True, extra=""):
    return f'<span class="rg-ck{" on" if on else ""}" role="checkbox" aria-checked="{"true" if on else "false"}"><span class="bx">{CHECK if on else ""}</span>{texto}{extra}</span>'


def hoja_pdf(ingles=False, fotos=True, aprobada=False):
    t = (lambda es, en: en if ingles else es)
    vals = [(t("Cliente", "Customer"), "Ferretería Rosales"), (t("Fecha de la visita", "Visit date"), "13/10/2026"),
            (t("¿Se concretó la venta?", "Was the sale closed?"), t("Sí", "Yes")), (t("Monto estimado", "Estimated amount"), "125.500,00"),
            (t("Motivo", "Reason"), t("Venta nueva", "New sale")), (t("Supervisor a cargo", "Supervisor in charge"), "Martín Paz"),
            (t("Fotos de la visita", "Visit photos"), A.thumbs(2) if fotos else t("2 fotos", "2 photos")),
            (t("Remito firmado", "Signed delivery note"), "remito-0810.pdf · 1,2 MB")]
    gr = "".join(f'<span class="k">{k}</span><span>{v}</span>' for k, v in vals)
    apr = (f'<div class="apr"><b>{t("Aprobada por", "Approved by")}</b>Lucía Fernández · 13/10/2026 16:05</div>' if aprobada
           else f'<div class="apr"><b>{t("Aprobada por", "Approved by")}</b>{t("Se completa al aprobarla", "Filled in when approved")}</div>')
    return (f'<div class="pd-hoja"><div class="cab"><span class="org"><span class="lg">GD</span>Grupo Delta</span><small>{t("Comprobante de visita", "Visit receipt")}</small></div>'
            f'<h3>{t("Visita", "Visit")} VIS-000126</h3><span class="sub">13/10/2026 · {t("Cargó", "Submitted by")} Tomás Acosta</span>'
            f'<div class="gr">{gr}</div>{apr}<span>{t("Este comprobante no reemplaza la factura.", "This receipt does not replace the invoice.")}</span>'
            f'<span class="fin"><span>{t("Versión 4 del formulario", "Form version 4")}</span><span>{t("Página 1 de 1", "Page 1 of 1")}</span></span></div>')


def cuerpo_pdf(modo="normal"):
    sin_nombre = modo == "sin_nombre"
    nombre = (f'<div class="w-cmp"><span class="rt">Nombre del PDF <span class="req">*</span></span><div class="ct mal ph"></div>'
              '<span class="err2" role="alert">Completá el idioma original.</span></div>') if sin_nombre else campo("Nombre del PDF", "Comprobante de visita", req=True)
    en = campo("En inglés", "Visit receipt", extra_rt=" " + info("Opcional. Si falta una traducción, el PDF sale entero en el idioma original."))
    fotos_on = modo != "sin_fotos"
    lista = ('<div class="pd-lista ancho"><span class="rt">Qué preguntas incluye</span>' + "".join(ck(p) for p in PREGS_PDF) + "</div>")
    opciones = ('<div class="pd-lista ancho">'
                + ck("Incluir las fotos", fotos_on, " " + info("Las de las preguntas elegidas, chicas y debajo de su pregunta. Sin marcar, solo dice cuántas hay. Los documentos se nombran, no se adjuntan."))
                + ck("Quién la aprobó y cuándo", True, " " + info("Se completa al aprobarla.")) + "</div>")
    pie_en = "" if modo == "falta_ingles" else "This receipt does not replace the invoice."
    pie = campo("Texto al pie", "Este comprobante no reemplaza la factura.") + campo("En inglés", pie_en or '<span style="color: var(--t3);">Opcional</span>')
    rev = f'<span class="pd-pie">{"Revisión 3 · 18/10/2026" if modo == "guardado" else "Revisión 2 · 15/10/2026"} {info("Los PDF ya armados no cambian: son una copia fija del momento.")}</span>'
    form = f'<div class="w-caja"><div class="f-cab"><span>El comprobante</span></div><div class="pd-form">{nombre}{en}{lista}{opciones}{pie}{rev}</div></div>'
    ingles = modo in ("ingles", "falta_ingles")
    seg = (f'<span class="ab-seg" role="radiogroup" aria-label="Idioma de la vista previa"><span class="{"" if ingles else "on"}" role="radio">Español</span>'
           f'<span class="{"on" if ingles else ""}" role="radio">English</span></span>')
    aviso = ""
    if modo == "falta_ingles":
        aviso = f'<div class="pd-av" role="status">{TRI}<span>Falta el inglés del texto al pie. La vista previa sale entera en español.</span></div>'
    hoja = hoja_pdf(ingles=(modo == "ingles"), fotos=fotos_on)
    prev = (f'<div class="w-caja"><div class="f-cab"><span class="rg-tit">Vista previa {info("Con una respuesta de ejemplo. El PDF real se arma con los datos y el idioma de cada respuesta.")}</span>'
            f'<span class="der">{seg}</span></div><div class="pd-prev">{aviso}{hoja}</div></div>')
    cartel = ""
    if modo == "conflicto":
        cartel = (f'<div class="w-cartel" role="alert">{TRI}<span class="tx">El diseño cambió mientras lo editabas. Conservamos tus cambios.</span>'
                  '<button type="button" class="cb cb-sec">Releer</button></div>')
    return f'<div class="w-body">{cartel}<div class="pd-cols">{form}{prev}</div></div>'


ESTADOS_PDF = ["Diseño", "Cambios sin guardar", "Vista previa en inglés", "Falta el inglés", "Sin las fotos", "Falta el nombre", "El diseño cambió",
               "Diseño guardado", "Descartar cambios"]
MODO_PDF = {"Diseño": "normal", "Cambios sin guardar": "normal", "Vista previa en inglés": "ingles", "Falta el inglés": "falta_ingles", "Sin las fotos": "sin_fotos",
            "Falta el nombre": "sin_nombre", "El diseño cambió": "conflicto", "Diseño guardado": "guardado", "Descartar cambios": "sin_fotos"}


def banda_pdf(e):
    sucio = e in ("Cambios sin guardar", "Falta el inglés", "Sin las fotos", "Falta el nombre", "El diseño cambió", "Descartar cambios")
    est = "Visita a cliente · diseño del PDF" + ('<span class="f-sucio">Cambios sin guardar</span>' if sucio else "")
    apag = (not sucio) or e == "Falta el nombre"
    acc = (f'<button type="button" class="cb cb-sec"{"" if sucio else " disabled"}>Descartar</button>'
           f'<button type="button" class="cb cb-pri"{" disabled" if apag else ""}>Guardar diseño</button>')
    titulo = "Diseño del PDF" if e == "Falta el nombre" else "Comprobante de visita"
    return A.banda(titulo, est, acc, "FRM-Editor-Reglas.dc.html").replace('aria-label="Volver a Diseñar formularios"', 'aria-label="Volver al formulario"', 1)


def pdf():
    V = {e: (banda_pdf(e), cuerpo_pdf(m)) for e, m in MODO_PDF.items()}
    capas = {"Diseño guardado": A.toast("Diseño guardado."),
             "Descartar cambios": A.confirmar("¿Descartar los cambios?", "Vas a perder lo que cambiaste sin guardar.", "Descartar", cancelar="Seguir editando")}
    t = A.pagina_editor(V, capas, ESTADOS_PDF, "Diseño del PDF · /org/formularios/:id/pdf", A.CSS_ARCH + CSS_RG + CSS_PDF + ".w-app { height: 900px !important; }\n")
    t = t.replace('"$preview":{"width":1440,"height":1400}', '"$preview":{"width":1440,"height":900}', 1)
    return t.replace("Inicio / Formularios / Diseñar formularios / Visita a cliente", "Inicio / Formularios / Diseñar formularios / Visita a cliente / Diseño del PDF", 1)


# ================================================================ G3 · FRM-Por-Aprobar
POR_APROBAR = [  # n°, formulario, cargó, recibida, esperando, rol, propia
    ("ENT-000031", "Entrega de pedido", "Martín Paz", "13/10/2026 18:40", "hace 2 días", "Administrador", False),
    ("VIS-000127", "Visita a cliente", "Tomás Acosta", "14/10/2026 09:30", "hace 1 día", "Administrador", False),
    ("VIS-000129", "Visita a cliente", "Florencia Fernández de la Fuente", "15/10/2026 11:47", "hace 7 horas", "Administrador", False),
    ("VIS-000130", "Visita a cliente", "Paula Méndez", "15/10/2026 16:20", "hace 2 horas", "Administrador", False),
]
OTRAS = [("ENT-000032", "Entrega de pedido", "Paula Méndez", "14/10/2026 12:05", "hace 1 día", "Recursos humanos", False),
         ("VIS-000131", "Visita a cliente", "Lucía Fernández", "15/10/2026 17:10", "hace 1 hora", "Administrador", True)]
CSS_PA = """.w-th.pa, .w-tr.pa { grid-template-columns: 120px minmax(160px, 1fr) minmax(180px, 1.2fr) 140px 120px minmax(150px, 1fr); }
.w-tr.pa .pl-quien { max-width: 100%; }
.w-tr.pa .rol { display: inline-flex; align-items: center; gap: 4px; }
.w-tr.pa .gris { color: var(--t3); }
.o-fb .tot { margin-left: auto; font-size: 13px; color: var(--t3); }
.pa-dlg .d2-mom { margin: 0; }
.pa-mom { display: flex; flex-direction: column; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
"""


def fila_pa(r):
    n, form, quien, rec, esp, rol, propia = r
    num = (f'<span class="gris" style="font-weight: 600;">{n}</span>' if propia else f'<a class="pl-num" href="FRM-Respuesta-Aprobacion.dc.html">{n}</a>')
    motivo = " " + info("No podés aprobar ni rechazar tu propia respuesta.") if propia else ""
    return (f'<div class="w-tr pa"><span>{num}</span><span>{form}</span><span class="pl-quien" title="{quien}"><span class="ic">{CHAT}</span><span class="tx">{quien}</span></span>'
            f'<span>{rec}</span><span>{esp}</span><span class="rol">{rol}{motivo}</span></div>')


def tabla_pa(filas, total):
    cab = '<div class="w-th pa"><span>N°</span><span>Formulario</span><span>Cargó</span><span>Recibida</span><span>Esperando</span><span>La aprueba</span></div>'
    return (f'<div class="w-caja">{cab}{"".join(fila_pa(r) for r in filas)}'
            f'<div class="w-pie"><span>1–{total} de {total}</span><span>10 por página · Página 1 de 1</span></div></div>')


def barra_pa(modo="mi"):
    todas = modo == "todas"
    ver_items = [("m", "Para mí", "4"), ("t", "Todas las abiertas", "6")]
    menu = ""
    if modo == "menu":
        menu = ('<span class="f-mn" role="listbox" aria-label="Ver">' + "".join(f'<span role="option" class="{"on" if k == "m" else ""}">{n}<span class="cnt">{c}</span></span>'
                                                                              for k, n, c in ver_items) + "</span>")
    ver = f'<span class="f-env"><span class="w-pil con" role="button" aria-haspopup="listbox">Ver: {"todas las abiertas" if todas else "para mí"} {CHEV}</span>{menu}</span>'
    form = f'<span class="f-env"><span class="w-pil" role="button" aria-haspopup="listbox">Formulario {CHEV}</span></span>'
    return f'<div class="w-caja o-fb">{ver}{form}<span class="tot">{"6 abiertas" if todas else "4 para vos"}</span></div>'


def dlg_decidir():
    mom = (f'<div class="pa-mom">{d2_moms("por_aprobar", "Paula Méndez", "15/10/2026 16:20")}</div>')
    cuerpo = '<p class="d-tx">Visita a cliente · Paula Méndez</p>' + mom
    t = F.dialogo("VIS-000130", cuerpo, '<button type="button" class="cb cb-sec">Cerrar</button>')
    return t.replace('class="w-dlg"', 'class="w-dlg pa-dlg" style="width: 600px;"', 1)


ESTADOS_PA = ["Para mí", "Ver: menú", "Todas las abiertas", "Decidir sin ver la respuesta", "Vacío", "Cargando", "No se pudo cargar", "Sin permiso"]


def por_aprobar():
    E = ESTADOS_PA
    def cuerpo(*p):
        return '<div class="w-body">' + "".join(p) + "</div>"
    vacio = '<div class="w-caja"><div class="pl-vacio"><b>No hay respuestas por aprobar.</b></div></div>'
    variantes = [
        ("Para mí", cuerpo(barra_pa(), tabla_pa(POR_APROBAR, 4))),
        ("Ver: menú", cuerpo(barra_pa("menu"), tabla_pa(POR_APROBAR, 4))),
        ("Todas las abiertas", cuerpo(barra_pa("todas"), tabla_pa([POR_APROBAR[0], OTRAS[0]] + POR_APROBAR[1:] + [OTRAS[1]], 6))),
        ("Decidir sin ver la respuesta", cuerpo(barra_pa(), tabla_pa(POR_APROBAR, 4))),
        ("Vacío", cuerpo(barra_pa(), vacio)),
        ("Cargando", cuerpo(barra_pa(), '<div class="w-caja">' + P.ESQ + "</div>")),
        ("No se pudo cargar", cuerpo(barra_pa(), '<div class="w-caja"><div class="pl-vacio"><b>No pudimos cargar las respuestas por aprobar.</b>'
                                     '<button type="button" class="cb cb-sec">Reintentar</button></div></div>')),
        ("Sin permiso", f'<div class="w-body"><div class="pl-pagina"><span class="ic">{P.ESCUDO}</span><b>No tenés permiso para ver esta página.</b>'
                        '<a class="cb cb-sec" href="Inicio-Org.dc.html">Ir al inicio</a></div></div>'),
    ]
    banda = ('<sc-if value="{{conBanda}}" hint-placeholder-val="{{si}}">'
             + F.banda("Por aprobar", "Las respuestas que esperan una decisión", "").replace(f'<span class="ic">{F.ICONO}</span>', f'<span class="ic">{APROBAR}</span>', 1)
             + "</sc-if>")
    extra = "      conBanda: e !== 'Sin permiso', panelPocos: true, panelMuchos: false,\n"
    t = A.pagina_ab("Por aprobar · /org/formularios/por-aprobar", "Inicio / Formularios / Por aprobar", banda, A.con_estados(variantes),
                    css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + P.CSS_PANEL + P.CSS_PL + P.CSS_D2 + CSS_PA + CSS_D2A,
                    estados=("estado", E), js=A.js_estados(E, extra))
    t = P.poner_panel(t)
    t = poner_por_aprobar(t, activo=True)
    return F.con_dialogo(t, f'<sc-if value="{{{{s{E.index("Decidir sin ver la respuesta")}}}}}" hint-placeholder-val="{{{{no}}}}">{dlg_decidir()}</sc-if>')


# ================================================================ G4 y G5 · la respuesta con aprobación: decidir, Actividad y PDF en el D2
CSS_D2A = """.w-dlg .db.una { grid-template-columns: minmax(0, 1fr); }
.d2-moms { margin: 12px 20px 0; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
.d2-moms .d2-mom { margin: 0; border: 0; border-radius: 0; border-top: 1px solid var(--borde); }
.d2-moms .d2-mom:first-child { border-top: 0; }
.d2-mom.esp { background: oklch(0.975 0.04 85); }
.d2-mom .ck.esp { background: #fff; color: oklch(0.55 0.13 70); border: 1.5px solid oklch(0.75 0.12 75); box-sizing: border-box; }
.d2-mom .ck.no { background: oklch(0.57 0.2 25); }
.d2-mom .acc { display: flex; gap: 8px; margin-top: 8px; align-items: center; }
.d2-mom .acc .cb { height: 32px; font-size: 13px; }
.d2-mom .acc .cb[disabled] { opacity: 0.5; cursor: default; }
.d2-mom .mot { font-size: 13px; color: var(--t2); }
.d2-h .w-est { font-size: 12.5px; }
.d2-aviso { margin: 12px 20px 0; display: flex; gap: 8px; align-items: flex-start; padding: 10px 12px; border-radius: 8px; font-size: 13px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.d2-aviso svg { flex-shrink: 0; }
.ac-g { display: flex; flex-direction: column; border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; }
.ac-cab { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: oklch(0.975 0.008 78); border-bottom: 1px solid var(--borde); font-size: 12.5px; font-weight: 600; color: var(--t2); }
.ac-cab span:last-child { font-weight: 400; color: var(--t3); }
.ac-mo { padding: 10px 12px 4px; display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; border-top: 1px solid var(--borde); }
.ac-mo:first-of-type { border-top: 0; }
.ac-mo small { font-weight: 400; color: var(--t3); }
.ac-it { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; gap: 10px; padding: 6px 12px 8px; font-size: 13px; line-height: 1.45; align-items: start; }
.ac-it .h { color: var(--t3); font-variant-numeric: tabular-nums; }
.ac-it .tx { display: flex; flex-direction: column; gap: 4px; }
.ac-it .tx small { font-size: 12.5px; color: var(--t3); }
.ac-it .tx a { color: var(--marca-tx); font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.ac-it .tx .cb { align-self: flex-start; height: 28px; font-size: 12.5px; }
.ac-est { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap; border: 1px solid; }
.ac-est.ok { color: oklch(0.42 0.1 155); background: oklch(0.97 0.03 155); border-color: oklch(0.85 0.06 155); }
.ac-est.mal { color: oklch(0.5 0.19 25); background: var(--peligro-t); border-color: oklch(0.85 0.08 25); }
.ac-est.amb { color: oklch(0.45 0.1 70); background: oklch(0.97 0.04 85); border-color: oklch(0.85 0.08 85); }
.ac-est.gris { color: var(--t2); background: var(--s2); border-color: var(--borde); }
.pdf-c { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--borde); border-radius: 10px; }
.pdf-c .pdf { width: 32px; height: 38px; border-radius: 4px; background: oklch(0.55 0.18 25); color: #fff; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pdf-c .t { flex: 1; display: flex; flex-direction: column; font-size: 13.5px; gap: 2px; }
.pdf-c .t small { font-size: 12.5px; color: var(--t3); }
.pdf-c .cb { height: 32px; font-size: 13px; }
.pdf-tit { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--t2); margin-bottom: 8px; }
.w-dlg.rch textarea, .w-dlg.rch .ct.area { min-height: 90px; }
.w-dlg.rch .cont { font-size: 12.5px; color: var(--t3); text-align: right; }
.w-dlg.rch .err2 { font-size: 12.5px; color: oklch(0.5 0.19 25); }
.w-dlg.pdfv { width: 720px; }
.w-dlg.pdfv .db { background: var(--s2); }
.res-r { display: flex; flex-direction: column; gap: 10px; }
.res-r .k-op .tx b { font-size: 14px; }
"""


def mom(clase_ck, icono, titulo, hora, linea="", acc="", extra_clase=""):
    l = f"<small>{linea}</small>" if linea else ""
    return (f'<div class="d2-mom{" " + extra_clase if extra_clase else ""}"><span class="ck{" " + clase_ck if clase_ck else ""}">{icono}</span>'
            f'<span class="t"><span><b>{titulo}</b><span class="h">{hora}</span></span>{l}{acc}</span></div>')


def d2_moms(estado, quien, hora, decidio="Lucía Fernández", hora_dec="13/10/2026 16:05", motivo="", propia=False, otra=False):
    rec = mom("", CHECK, "Recibida", hora, f"{PERSONA} La respondió {quien} por WhatsApp · se la mandó Lucía Fernández")
    al_rec = mom("", CHECK, "Al recibirla", "1 de 1 hecha")
    if estado == "por_aprobar":
        if propia:
            botones = (f'<span class="acc"><button type="button" class="cb cb-sec" disabled>Rechazar</button><button type="button" class="cb cb-pri" disabled>{APROBAR} Aprobar</button>'
                       f'{info("No podés aprobar ni rechazar tu propia respuesta.")}</span>')
        else:
            botones = f'<span class="acc"><a class="cb cb-sec" href="#">Rechazar</a><button type="button" class="cb cb-pri">{APROBAR} Aprobar</button></span>'
        return rec + al_rec + mom("esp", RELOJ, "Por aprobar", "hace 2 horas", "Lo aprueba alguien con el rol Administrador", botones, "esp")
    if estado == "aprobada":
        quien_dec = "Martín Paz" if otra else decidio
        cuando = "hace un momento" if otra else hora_dec
        return (rec + al_rec + mom("", CHECK, "Aprobada", cuando, f"{quien_dec} · rol Administrador")
                + mom("", CHECK, "Al aprobarla", "0 de 3 hechas" if otra else "3 de 3 hechas"))
    return (rec + al_rec + mom("no", X, "Rechazada", hora_dec, f"{decidio} · {motivo}")
            + mom("", CHECK, "Al rechazarla", "1 de 1 hecha"))


def d2a(num, estado, chip, valores, quien, hora, fotos, tab="Respuesta", cuerpo_tab=None, aviso="", **kw):
    nav = (f'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)">{SUBE}</button>'
           f'<button type="button" class="nv" aria-label="Respuesta siguiente" title="Siguiente (↓)">{BAJA}</button>')
    cerrar = f'<button type="button" class="ib" aria-label="Cerrar" title="Cerrar (Esc)">{X}</button>'
    sub = (f'<div class="d2-sub"><span>Visita a cliente · versión 4</span>'
           f'<a class="cb cb-sec" href="WA-Chats-Avisos.dc.html">{CHAT} Abrir conversación</a></div>')
    av = f'<div class="d2-aviso" role="status">{TRI}<span>{aviso}</span></div>' if aviso else ""
    tabs = ["Respuesta"] + ([f"Fotos <span class=\"c\">{fotos}</span>"] if fotos else []) + ["Actividad"] + (["PDF"] if estado == "aprobada" else [])
    pest = '<div class="o-tabs" role="tablist">' + "".join(f'<span role="tab" class="{"on" if t.split(" ")[0] == tab else ""}">{t}</span>' for t in tabs) + "</div>"
    cuerpo = cuerpo_tab if cuerpo_tab is not None else F.grilla(valores)
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {num}"><div class="d2-h"><b>{num}</b>{chip}{nav}{cerrar}</div>'
            f'{sub}{av}<div class="d2-moms">{d2_moms(estado, quien, hora, **kw)}</div>{pest}<div class="d2-b">{cuerpo}</div></aside>')


CHIP_PEND = '<span class="w-est pend">Por aprobar</span>'
CHIP_OK = '<span class="w-est">Aprobada</span>'
CHIP_NO = '<span class="w-est mal">Rechazada</span>'


def ac_it(h, texto, est, clase, extra=""):
    return f'<div class="ac-it"><span class="h">{h}</span><span class="tx"><span>{texto}</span>{extra}</span><span class="ac-est {clase}">{est}</span></div>'


def actividad(modo="normal"):
    abrir = f'<a href="WA-Chats-Avisos.dc.html">{CHAT} Abrir conversación</a>'
    rec = (f'<div class="ac-mo">{CHECK} Recibida <small>13/10/2026</small></div>'
           + ac_it("15:30", "Lucía Fernández le mandó el formulario desde el chat.", "Hecho", "ok", abrir)
           + ac_it("15:30", "Tomás Acosta lo respondió. Se guardó como VIS-000126, con 3 archivos.", "Hecho", "ok"))
    if modo == "sin_confirmar":
        aviso_rec = ac_it("15:30", "Se le mandó a Tomás: «Recibimos VIS-000126. Te avisamos cuando la aprueben.»", "Sin confirmar", "amb",
                          '<small>No sabemos si salió.</small><button type="button" class="cb cb-sec">Consultar</button>')
    else:
        aviso_rec = ac_it("15:30", "Se le mandó a Tomás: «Recibimos VIS-000126. Te avisamos cuando la aprueben.»", "Leído", "ok")
    al_rec = (f'<div class="ac-mo">{CHECK} Al recibirla <small>1 de 1 hecha</small></div>' + aviso_rec
              + ac_it("15:30", "Se pidió aprobación a alguien con el rol Administrador.", "Hecho", "ok"))
    apr = (f'<div class="ac-mo">{CHECK} Aprobada <small>Lucía Fernández · esperó 35 minutos</small></div>')
    if modo == "no_se_pudo":
        envio = ac_it("16:05", "No se le pudo mandar el PDF a Tomás: pasaron más de 24 horas desde su último mensaje.", "No se pudo", "mal",
                      '<small>El PDF quedó guardado.</small><button type="button" class="cb cb-sec">Reintentar</button>')
        hechas = "2 de 3 hechas"
    else:
        envio = ac_it("16:05", "Se le mandó el PDF a Tomás: «Aprobaron VIS-000126. Te mandamos el comprobante.»", "Entregado", "ok")
        hechas = "3 de 3 hechas"
    al_apr = (f'<div class="ac-mo">{CHECK} Al aprobarla <small>{hechas}</small></div>'
              + ac_it("16:05", "Se armó el PDF «Comprobante de visita».", "Hecho", "ok", f'<a href="#">{DESCARGAR} VIS-000126.pdf</a>')
              + envio + ac_it("16:05", "Se avisó a las personas con el rol Dueño.", "Hecho", "ok"))
    return (f'<div class="ac-g"><div class="ac-cab"><span>Qué pasó después</span><span>Reglas de la revisión 3</span></div>{rec}{al_rec}{apr}{al_apr}</div>')


def pestana_pdf():
    return (f'<div class="pdf-tit">PDF de la respuesta {info("Los PDF ya armados no cambian: son una copia fija del momento.")}</div>'
            '<div class="pdf-c"><span class="pdf">PDF</span><span class="t">VIS-000126.pdf<small>13/10/2026 16:05 · Español · 1 página</small></span>'
            f'<button type="button" class="cb cb-sec">Ver PDF</button><button type="button" class="cb cb-sec">{DESCARGAR} Descargar</button></div>')


def dlg_rechazar(vacio=False):
    if vacio:
        motivo = '<div class="w-cmp"><span class="rt">Motivo <span class="req">*</span></span><div class="ct area mal ph"></div><span class="err2" role="alert">Completá este dato.</span></div>'
        cont = "0 / 500"
    else:
        motivo = '<div class="w-cmp"><span class="rt">Motivo <span class="req">*</span></span><div class="ct area">Falta la firma del cliente en el remito.</div></div>'
        cont = "39 / 500"
    cuerpo = motivo + f'<span class="cont">{cont}</span>'
    t = F.dialogo(f"Rechazar VIS-000130", cuerpo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Rechazar</button>')
    t = t.replace('class="w-dlg"', 'class="w-dlg rch"', 1)
    return t.replace("<span>Rechazar VIS-000130</span>", f'<span class="rg-tit">Rechazar VIS-000130 {info("El motivo queda en el historial de la respuesta y, si una regla lo pide, se le manda a quien la cargó.")}</span>', 1)


def dlg_resolver():
    cuerpo = ('<p class="d-tx">Destinatario: Tomás Acosta</p><div class="k-ops res-r">'
              '<div class="k-op on" role="radio" aria-checked="true"><span class="rd"></span><span class="tx"><b>Salió</b><span>La regla sigue sin volver a mandar este aviso.</span></span></div>'
              '<div class="k-op" role="radio" aria-checked="false"><span class="rd"></span><span class="tx"><b>No salió</b><span>El aviso queda para reintentar.</span></span></div></div>')
    t = F.dialogo("Resolver el envío", cuerpo, '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Confirmar que salió</button>')
    t = t.replace('class="w-dlg"', 'class="w-dlg" style="width: 560px;"', 1)
    return t.replace("<span>Resolver el envío</span>", f'<span class="rg-tit">Resolver el envío {info("Consultá el estado antes de elegir. Tu revisión deja seguir la regla; no confirma que WhatsApp lo entregó.")}</span>', 1)


def dlg_pdf():
    t = F.dialogo("Copia fija · VIS-000126.pdf", hoja_pdf(fotos=True, aprobada=True),
                  f'<button type="button" class="cb cb-sec">{DESCARGAR} Descargar</button><button type="button" class="cb cb-sec">Cerrar</button>')
    return t.replace('class="w-dlg"', 'class="w-dlg pdfv"', 1)


ESTADOS_D2A = ["Por aprobar", "Rechazar", "Rechazar sin motivo", "Aprobada", "Rechazada", "Otra persona decidió", "La cargaste vos", "Actividad",
               "Actividad: no se pudo", "Actividad: sin confirmar", "Resolver el envío", "PDF", "Ver el PDF"]
EST_FILA = {"VIS-000130": "Por aprobar", "VIS-000129": "Por aprobar", "VIS-000128": "Aprobada", "VIS-000127": "Por aprobar", "VIS-000126": "Aprobada",
            "VIS-000125": "Rechazada", "VIS-000124": "Aprobada", "VIS-000123": "Aprobada", "VIS-000122": "Recibida", "VIS-000121": "Recibida"}


def planilla_con_estado(sel):
    """La planilla de un formulario que pide aprobación: suma la columna Estado después del N° y el filtro «Estado ▾»."""
    clase = {"Por aprobar": "pend", "Aprobada": "", "Rechazada": "mal", "Recibida": "off"}
    cols = P.cols_visibles()
    def celda(k, r):
        if k == "est":
            e = EST_FILA[r[0]]
            return f'<span><span class="w-est {clase[e]}">{e}</span></span>'
        return P.celda(k, r, r[0])
    claves = [cols[0][0], "est"] + [c[0] for c in cols[1:]]
    cab = ('<div class="w-th pl"><span>N°</span><span>Estado</span>' + "".join(f'<span{" class=" + chr(34) + "r" + chr(34) if c == "r" else ""}>{t}</span>'
                                                                              for _, t, _, c in cols[1:]) + "</div>")
    filas = "".join(f'<div class="w-tr pl{" sel" if r[0] == sel else ""}">' + "".join(celda(k, r) for k in claves) + "</div>" for r in P.RESP)
    pie = '<div class="w-pie"><span>1–10 de 24</span><span>10 por página · Página 1 de 3</span></div>'
    barra = P.barra().replace('<a class="w-pil" href="FRM-Respuestas-Filtros.dc.html">',
                              f'<span class="f-env"><span class="w-pil" role="button" aria-haspopup="listbox">Estado {CHEV}</span></span><a class="w-pil" href="FRM-Respuestas-Filtros.dc.html">', 1)
    return f'<div class="w-body">{barra}<div class="w-caja pl-caja"><div class="pl-scroll">{cab}{filas}</div>{pie}</div></div>'


def respuesta_aprobacion():
    E = ESTADOS_D2A
    v126, v130 = P.VALORES_126, P.VALORES_130
    pend = dict(estado="por_aprobar", chip=CHIP_PEND, valores=v130, quien="Paula Méndez", hora="15/10/2026 16:20", fotos=3)
    ok = dict(estado="aprobada", chip=CHIP_OK, valores=v126, quien="Tomás Acosta", hora="13/10/2026 15:30", fotos=2)
    paneles = {
        "Por aprobar": d2a("VIS-000130", **pend),
        "Rechazar": d2a("VIS-000130", **pend), "Rechazar sin motivo": d2a("VIS-000130", **pend),
        "Aprobada": d2a("VIS-000126", **ok),
        "Rechazada": d2a("VIS-000125", "rechazada", CHIP_NO, [("Cliente", "Obra Centro"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "No"),
                                                              ("Monto estimado", None), ("Motivo", "Seguimiento"), ("Supervisor a cargo", "Paula Méndez"),
                                                              ("Observaciones", "Revisión del avance de obra.")],
                         "Florencia Fernández de la Fuente", "13/10/2026 14:10", 0, hora_dec="14/10/2026 09:10", motivo="Falta la foto del frente de la obra."),
        "Otra persona decidió": d2a("VIS-000130", "aprobada", CHIP_OK, v130, "Paula Méndez", "15/10/2026 16:20", 3, otra=True,
                                    aviso="La aprobación cambió: Martín Paz ya la aprobó. Se actualizó con la decisión vigente."),
        "La cargaste vos": d2a("VIS-000131", "por_aprobar", CHIP_PEND, [("Cliente", "Distribuidora Norte"), ("Fecha de la visita", "15/10/2026"), ("¿Se concretó la venta?", "Sí"),
                                                                        ("Monto estimado", "64.000,00"), ("Motivo", "Venta nueva"), ("Supervisor a cargo", "Martín Paz"),
                                                                        ("Fotos de la visita", A.thumbs(1)), ("Remito firmado", None), ("Observaciones", None)],
                               "Lucía Fernández", "15/10/2026 17:10", 1, propia=True),
        "Actividad": d2a("VIS-000126", tab="Actividad", cuerpo_tab=actividad(), **ok),
        "Actividad: no se pudo": d2a("VIS-000126", tab="Actividad", cuerpo_tab=actividad("no_se_pudo"), **ok),
        "Actividad: sin confirmar": d2a("VIS-000126", tab="Actividad", cuerpo_tab=actividad("sin_confirmar"), **ok),
        "Resolver el envío": d2a("VIS-000126", tab="Actividad", cuerpo_tab=actividad("sin_confirmar"), **ok),
        "PDF": d2a("VIS-000126", tab="PDF", cuerpo_tab=pestana_pdf(), **ok),
        "Ver el PDF": d2a("VIS-000126", tab="PDF", cuerpo_tab=pestana_pdf(), **ok),
    }
    dialogos = {"Rechazar": dlg_rechazar(), "Rechazar sin motivo": dlg_rechazar(True), "Resolver el envío": dlg_resolver(), "Ver el PDF": dlg_pdf(),
                "Aprobada": "", "Otra persona decidió": ""}
    capas = A.con_estados([(e, paneles[e] + dialogos.get(e, "").replace('class="w-oscuro"', 'class="w-oscuro" style="z-index: 8;"', 1)) for e in E])
    sel = {"Por aprobar": "VIS-000130", "Rechazar": "VIS-000130", "Rechazar sin motivo": "VIS-000130", "Rechazada": "VIS-000125", "Otra persona decidió": "VIS-000130",
           "La cargaste vos": None}
    fondo = A.con_estados([(e, planilla_con_estado(sel.get(e, "VIS-000126"))) for e in E])
    cols = P.cols_visibles()
    css_cols = ".w-app { --pl-cols: " + " ".join([f"{cols[0][2]}px", "120px"] + [f"{c[2]}px" for c in cols[1:]]) + "; }\n"
    t = A.pagina_ab("Respuesta con aprobación · /org/formularios/:id/respuestas?respuesta=VIS-000130",
                    "Inicio / Formularios / Respuestas / Visita a cliente", P.banda_pl(), fondo,
                    css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + A.CSS_ARCH + P.CSS_PANEL + P.CSS_PL + F.CSS_GRILLA + P.CSS_D2
                    + C.CSS_K2 + CSS_PDF + CSS_D2A + css_cols, estados=("estado", E), js=A.js_estados(E, "      panelPocos: true, panelMuchos: false,\n"))
    t = P.poner_panel(t)
    k = t.rindex("</div>\n</x-dc>")
    return t[:k] + capas + t[k:]


# ================================================================ G6 · WA-Chats-Avisos: los mensajes automáticos en el chat
CSS_AV = """.w-m.sal.auto .aut { display: flex !important; }
.w-m.sal.auto .gl { background: oklch(0.97 0.012 200); border: 1px dashed oklch(0.8 0.04 200); }
.w-m.sal.auto .aut { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: var(--marca-tx); margin-bottom: 4px; }
.av-card { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: #fff; border: 1px solid var(--borde); }
.av-card .pdf { width: 26px; height: 30px; border-radius: 4px; background: oklch(0.55 0.18 25); color: #fff; font-size: 9px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.av-card .t { display: flex; flex-direction: column; line-height: 1.3; font-size: 13px; }
.av-card .t small { font-size: 12px; color: var(--t3); }
.w-m .pie.mal { color: oklch(0.5 0.19 25); }
"""
BOT = svg('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4.5V8"/><circle cx="9.5" cy="13.5" r="1"/><circle cx="14.5" cy="13.5" r="1"/>', 13)


def automatico(texto, pie, card="", clase_pie=""):
    return (f'<div class="w-m sal auto"><span class="gl"><span class="aut">{BOT} Automático</span><span>{texto}</span>{card}</span>'
            f'<span class="pie {clase_pie}">{pie}</span></div>')


def card_aviso():
    return '<span class="av-card"><span class="t"><b>Acción del formulario</b><small>Aviso automático · Visita a cliente</small></span></span>'


def card_pdf():
    return '<span class="av-card"><span class="pdf">PDF</span><span class="t">VIS-000126.pdf<small>Acción del formulario · Documento · 1 página</small></span></span>'


ESTADOS_AV = ["Al recibirla", "Al aprobarla", "Al rechazarla", "Fuera de las 24 horas", "Sin permiso para ver"]


def chat_avisos():
    E = ESTADOS_AV
    env = A.burbuja("Lucía Fernández · 15:22 · Leído")
    resp = A.tarjeta(A.grilla_r(A.VALORES_ARCH) + A.r_ok("VIS-000126"))
    recibida = automatico("Recibimos VIS-000126. Te avisamos cuando la aprueben.", "15:30 · Leído", card_aviso())
    msgs = {
        "Al recibirla": env + resp + recibida,
        "Al aprobarla": env + resp + recibida + automatico("Aprobaron VIS-000126. Te mandamos el comprobante.", "16:05 · Entregado", card_pdf()),
        "Al rechazarla": env + resp + recibida + automatico("Rechazaron VIS-000126: falta la firma del cliente en el remito. Podés mandarla de nuevo.", "16:05 · Entregado", card_aviso()),
        "Fuera de las 24 horas": env + resp + recibida + automatico("Aprobaron VIS-000126. Te mandamos el comprobante.", "No se pudo: pasaron más de 24 horas", card_pdf(), "mal"),
        "Sin permiso para ver": env + A.tarjeta(A.r_st("No tenés permiso para ver las respuestas de este formulario.", A.CANDADO) + A.r_ok("VIS-000126"))
        + '<div class="w-m sal auto"><span class="gl"><span class="aut">' + BOT + ' Automático</span><span>Mensaje automático de un formulario.</span></span><span class="pie">15:30</span></div>',
    }
    esc = {e: A.escr() for e in E}
    vp = {"Al recibirla": "Automático: Recibimos VIS-000126…", "Al aprobarla": "Automático: VIS-000126.pdf", "Al rechazarla": "Automático: Rechazaron VIS-000126…",
          "Fuera de las 24 horas": "Automático: no se pudo mandar", "Sin permiso para ver": "Mensaje automático de un formulario"}
    hora = {"Al recibirla": "15:30", "Al aprobarla": "16:05", "Al rechazarla": "16:05", "Fuera de las 24 horas": "16:05", "Sin permiso para ver": "15:30"}
    t = A.pagina_chat(E, esc, msgs, {}, vp, hora, "WhatsApp · Internos · avisos automáticos de un formulario")
    return t.replace("</helmet>", f'<style data-e16="avisos">\n{CSS_AV}</style>\n</helmet>', 1)


# ================================================================ Teléfono
CSS_T16 = """.ap-bar .tit .sub.amb { color: oklch(0.55 0.13 70); }
.tr-moms { margin: 12px 16px 0; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.tr-moms .tr-mom { margin: 0; border: 0; border-radius: 0; border-top: 1px solid var(--borde); }
.tr-moms .tr-mom:first-child { border-top: 0; }
.tr-mom.esp { background: oklch(0.975 0.04 85); }
.tr-mom .ck.esp { background: #fff; color: oklch(0.55 0.13 70); border: 1.5px solid oklch(0.75 0.12 75); box-sizing: border-box; }
.tr-mom .ck.no { background: oklch(0.57 0.2 25); }
.ap-bar .w-est { margin-left: 6px; font-size: 12px; }
.tr-acts { margin: 12px 16px; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.tr-acts .mo { padding: 10px 14px 4px; font-size: 15px; font-weight: 600; border-top: 1px solid var(--borde); }
.tr-acts .mo:first-child { border-top: 0; }
.tr-acts .mo small { font-weight: 400; color: var(--t3); margin-left: 6px; font-size: 13px; }
.tr-acts .it { display: flex; flex-direction: column; gap: 4px; padding: 6px 14px 10px; font-size: 14.5px; line-height: 1.4; }
.tr-acts .it .h { font-size: 13px; color: var(--t3); }
.tr-acts .it .ac-est { align-self: flex-start; }
.ac-est { display: inline-flex; align-items: center; height: 24px; padding: 0 8px; border-radius: 6px; font-size: 13px; font-weight: 600; white-space: nowrap; border: 1px solid; }
.ac-est.ok { color: oklch(0.42 0.1 155); background: oklch(0.97 0.03 155); border-color: oklch(0.85 0.06 155); }
.ac-est.mal { color: oklch(0.5 0.19 25); background: var(--peligro-t); border-color: oklch(0.85 0.08 25); }
.tr-pdf { margin: 12px 16px; display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; }
.tr-pdf .pdf { width: 34px; height: 40px; border-radius: 5px; background: oklch(0.55 0.18 25); color: #fff; font-size: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
.tr-pdf .t { flex: 1; display: flex; flex-direction: column; font-size: 15px; } .tr-pdf .t small { font-size: 13px; color: var(--t3); }
.ap-fijo .cb[disabled] { opacity: 0.5; }
.ap-fijo .motivo { font-size: 13px; color: var(--t3); text-align: center; width: 100%; }
.rg-t { margin: 12px 16px 0; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.rg-t .r { display: flex; gap: 10px; padding: 12px 14px; border-top: 1px solid var(--borde); font-size: 14.5px; line-height: 1.4; }
.rg-t .r:first-child { border-top: 0; }
.rg-t .r .n { color: var(--t3); font-weight: 600; width: 16px; flex-shrink: 0; }
.rg-t .r .tx { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.rg-t .r .tx small { color: var(--t3); font-size: 13px; }
.rg-t .r .ap-ib { margin: -8px -8px 0 0; }
.rg-hb .ap-cmp { margin: 0; }
.rg-hb .cond { padding: 10px 12px; border: 1px solid var(--borde); border-radius: 12px; font-size: 15px; display: flex; justify-content: space-between; align-items: center; background: #fff; }
.rg-hb .acc { padding: 12px; border: 1px solid var(--borde); border-radius: 12px; display: flex; flex-direction: column; gap: 10px; background: #fff; }
.rg-hb .acc b { font-size: 14px; color: var(--t2); font-weight: 600; }
"""


def t_moms(estado, quien, hora, motivo="", propia=False):
    def m(clase, icono, tit, h, linea="", extra=""):
        return (f'<div class="tr-mom{" " + extra if extra else ""}"><span class="ck{" " + clase if clase else ""}">{icono}</span><span class="t"><span><b>{tit}</b><span class="h">{h}</span></span>'
                + (f"<small>{linea}</small>" if linea else "") + "</span></div>")
    rec = m("", CHECK, "Recibida", hora, f"La respondió {quien} · se la mandó Lucía Fernández")
    al = m("", CHECK, "Al recibirla", "1 de 1 hecha")
    if estado == "por_aprobar":
        return rec + al + m("esp", RELOJ, "Por aprobar", "hace 2 horas", "Lo aprueba alguien con el rol Administrador", "esp")
    if estado == "aprobada":
        return rec + al + m("", CHECK, "Aprobada", "13/10/2026 16:05", "Lucía Fernández") + m("", CHECK, "Al aprobarla", "3 de 3 hechas")
    return rec + al + m("no", X, "Rechazada", "14/10/2026 09:10", f"Lucía Fernández · {motivo}") + m("", CHECK, "Al rechazarla", "1 de 1 hecha")


ESTADOS_TD = ["Por aprobar", "Rechazar", "Aprobada", "Rechazada", "La cargaste vos", "Actividad", "PDF"]


def tel_respuesta_aprobacion():
    E = ESTADOS_TD

    def bar(num, chip):
        return C.t_bar(num + chip, "Visita a cliente · versión 4", "M-FRM-Por-Aprobar.dc.html")

    def nav(pos):
        return (f'<div class="tr-nav"><span>{pos}</span><button type="button" class="ap-ib" aria-label="Respuesta anterior">{SUBE}</button>'
                f'<button type="button" class="ap-ib" aria-label="Respuesta siguiente">{BAJA}</button>'
                f'<a class="cb cb-sec" href="M-WA-Conversacion-Avisos.dc.html">Abrir conversación</a></div>')

    def pest(tab, fotos, pdf=False):
        tabs = ["Respuesta"] + ([f'Fotos <span class="c">{fotos}</span>'] if fotos else []) + ["Actividad"] + (["PDF"] if pdf else [])
        return '<div class="ap-tabs tr-tabs" role="tablist">' + "".join(f'<span class="{"on" if t.split(" ")[0] == tab else ""}" role="tab">{t}</span>' for t in tabs) + "</div>"

    def grilla(valores):
        return '<div class="tr-gr">' + "".join(f'<div class="f"><span class="k">{k}</span>' + (f"<span>{v}</span>" if v is not None else '<span class="vac">Sin respuesta</span>') + "</div>"
                                               for k, v in valores) + "</div>"
    fijo_dec = (f'<div class="ap-fijo"><button type="button" class="cb cb-sec full">Rechazar</button><button type="button" class="cb cb-pri full">Aprobar</button></div>')
    fijo_propia = ('<div class="ap-fijo" style="flex-wrap: wrap;"><span class="motivo">No podés aprobar ni rechazar tu propia respuesta.</span>'
                   '<button type="button" class="cb cb-sec full" disabled>Rechazar</button><button type="button" class="cb cb-pri full" disabled>Aprobar</button></div>')
    acts = ('<div class="tr-acts"><div class="mo">Al recibirla<small>1 de 1 hecha</small></div>'
            '<div class="it"><span class="h">13/10 15:30</span><span>Se le mandó a Tomás: «Recibimos VIS-000126. Te avisamos cuando la aprueben.»</span><span class="ac-est ok">Leído</span></div>'
            '<div class="it"><span class="h">13/10 15:30</span><span>Se pidió aprobación a alguien con el rol Administrador.</span><span class="ac-est ok">Hecho</span></div>'
            '<div class="mo">Aprobada<small>Lucía Fernández · esperó 35 minutos</small></div>'
            '<div class="mo">Al aprobarla<small>2 de 3 hechas</small></div>'
            '<div class="it"><span class="h">13/10 16:05</span><span>Se armó el PDF «Comprobante de visita».</span><span class="ac-est ok">Hecho</span></div>'
            '<div class="it"><span class="h">13/10 16:05</span><span>No se le pudo mandar el PDF a Tomás: pasaron más de 24 horas desde su último mensaje.</span><span class="ac-est mal">No se pudo</span>'
            '<button type="button" class="cb cb-sec" style="align-self: flex-start; height: 36px;">Reintentar</button></div>'
            '<div class="it"><span class="h">13/10 16:05</span><span>Se avisó a las personas con el rol Dueño.</span><span class="ac-est ok">Hecho</span></div></div>')
    pdf_t = (f'<div class="tr-pdf"><span class="pdf">PDF</span><span class="t">VIS-000126.pdf<small>13/10/2026 16:05 · Español · 1 página</small></span>'
             f'<button type="button" class="ap-ib" aria-label="Descargar VIS-000126.pdf">{DESCARGAR}</button></div>')

    def pantalla(num, chip, estado, valores, quien, hora, fotos, pos, tab="Respuesta", cuerpo=None, fijo="", motivo="", pdf=False):
        c = cuerpo if cuerpo is not None else grilla(valores)
        return (bar(num, chip) + nav(pos) + f'<div class="tr-scroll"><div class="tr-moms">{t_moms(estado, quien, hora, motivo)}</div>{pest(tab, fotos, pdf)}{c}</div>' + fijo)
    pend = ("VIS-000130", CHIP_PEND, "por_aprobar", P.VALORES_130, "Paula Méndez", "15/10/2026 16:20", 3, "4 de 4")
    ok = ("VIS-000126", CHIP_OK, "aprobada", P.VALORES_126, "Tomás Acosta", "13/10/2026 15:30", 2, "5 de 24")
    cuerpo = {
        "Por aprobar": pantalla(*pend, fijo=fijo_dec), "Rechazar": pantalla(*pend, fijo=fijo_dec),
        "Aprobada": pantalla(*ok, pdf=True),
        "Rechazada": pantalla("VIS-000125", CHIP_NO, "rechazada", [("Cliente", "Obra Centro"), ("Fecha de la visita", "13/10/2026"), ("Motivo", "Seguimiento"), ("Observaciones", "Revisión del avance de obra.")],
                              "Florencia Fernández de la Fuente", "13/10/2026 14:10", 0, "6 de 24", motivo="Falta la foto del frente de la obra."),
        "La cargaste vos": pantalla("VIS-000131", CHIP_PEND, "por_aprobar", [("Cliente", "Distribuidora Norte"), ("Fecha de la visita", "15/10/2026"), ("Monto estimado", "64.000,00")],
                                    "Lucía Fernández", "15/10/2026 17:10", 1, "1 de 24", fijo=fijo_propia),
        "Actividad": pantalla(*ok, tab="Actividad", cuerpo=acts, pdf=True),
        "PDF": pantalla(*ok, tab="PDF", cuerpo=pdf_t, pdf=True),
    }
    hoja = F.thoja("Rechazar VIS-000130", F.tcampo("Motivo", "Falta la firma del cliente en el remito.", req=True) + '<span class="ay" style="text-align: right;">39 / 500</span>',
                   '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Rechazar</button>')
    return C.tel_pagina(cuerpo, E, {"Rechazar": hoja}, "Respuesta con aprobación · teléfono", A.CSS_ARCH + P.CSS_TPL + CSS_T16)


ESTADOS_TPA = ["Para mí", "Todas las abiertas", "Filtros", "Vacío", "Cargando", "Sin permiso"]


def tel_por_aprobar():
    E = ESTADOS_TPA
    def fila(r):
        n, form, quien, rec, esp, rol, propia = r
        corto = quien if len(quien) < 26 else quien[:24] + "…"
        extra = '<span class="l3">No podés decidir la tuya</span>' if propia else f'<span class="l3">Lo aprueba: {rol}</span>'
        return (f'<a class="ap-fila" href="M-FRM-Respuesta-Aprobacion.dc.html"><div class="tx"><span class="l1">{n}<span class="hr">{esp}</span></span>'
                f'<span class="l2">{form} · {corto}</span>{extra}</div></a>')
    der = f'<button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>'
    def lista(cuerpo, sub="4 para vos"):
        return C.t_bar("Por aprobar", sub, "M-WA-Menu.dc.html", der) + f'<div class="ap-cuerpo">{cuerpo}</div>'
    mis = "".join(fila(r) for r in POR_APROBAR)
    todas = "".join(fila(r) for r in [POR_APROBAR[0], OTRAS[0]] + POR_APROBAR[1:] + [OTRAS[1]])
    esq = '<div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div>'
    cuerpo = {"Para mí": lista(mis), "Todas las abiertas": lista(todas, "6 abiertas"), "Filtros": lista(mis),
              "Vacío": lista('<div class="ap-vacio">No hay respuestas por aprobar.</div>', "0 para vos"), "Cargando": lista(esq, ""),
              "Sin permiso": C.t_bar("Por aprobar", "Formularios", "M-WA-Menu.dc.html") + '<div class="ap-cuerpo"><div class="ap-vacio">No tenés permiso para ver esta página.'
              '<a class="cb cb-sec" href="M-Inicio-Org.dc.html">Ir al inicio</a></div></div>'}
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.25")
    def grupo(tit, ops):
        return f'<div class="p-tit2">{tit}</div>' + "".join(f'<span class="t-opc {"on" if k == 0 else ""}">{n}<span class="d">{c}{tilde if k == 0 else ""}</span></span>' for k, (n, c) in enumerate(ops))
    filtros = grupo("Ver", [("Para mí", 4), ("Todas las abiertas", 6)]) + grupo("Formulario", [("Todos los formularios", 4), ("Visita a cliente", 3), ("Entrega de pedido", 1)])
    capas = {"Filtros": F.thoja("Filtros", filtros, '<button type="button" class="cb cb-pri">Ver 4 respuestas</button>').replace('<div class="hb">', '<div class="hb lst">', 1)}
    return C.tel_pagina(cuerpo, E, capas, "Por aprobar · teléfono", F.CSS_TFILTRO + P.CSS_TPL + CSS_T16)


ESTADOS_TRG = ["Reglas", "Editar una regla", "Cambios sin guardar", "Sin reglas", "Sin permiso para las reglas"]


def tel_reglas():
    E = ESTADOS_TRG
    def lista(sucio=False):
        filas = ""
        for n, cuando, si, acciones in REGLAS:
            s = f"<small>Si {si}</small>" if si else ""
            acc = "".join(f"<small>{k}. {re.sub('<[^>]+>', '', a)}</small>" for k, a in enumerate(acciones, 1))
            filas += (f'<div class="r"><span class="n">{n}</span><span class="tx"><b>Cuando {cuando}</b>{s}{acc}</span>'
                      f'<button type="button" class="ap-ib" aria-label="Acciones de la regla {n}">{F.TKEBAB}</button></div>')
        return f'<div class="rg-t">{filas}</div>'
    bar = C.t_bar("Cuando llega una respuesta", "Visita a cliente · revisión 3", "M-FRM-Editor.dc.html")
    bar_sucio = C.t_bar("Cuando llega una respuesta", '<span class="sub amb">Cambios sin guardar</span>', "M-FRM-Editor.dc.html").replace(
        '<span class="sub"><span class="sub amb">Cambios sin guardar</span></span>', '<span class="sub amb">Cambios sin guardar</span>')
    agregar = f'<div style="padding: 12px 16px;"><button type="button" class="cb cb-sec">{MAS} Agregar regla</button></div>'
    fijo_off = '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Guardar reglas</button></div>'
    fijo_on = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar reglas</button></div>'
    cuerpo = {
        "Reglas": bar + f'<div class="tr-scroll">{lista()}{agregar}</div>' + fijo_off,
        "Editar una regla": bar_sucio + f'<div class="tr-scroll">{lista()}{agregar}</div>' + fijo_on,
        "Cambios sin guardar": bar_sucio + f'<div class="tr-scroll">{lista()}{agregar}</div>' + fijo_on,
        "Sin reglas": bar + '<div class="ap-cuerpo"><div class="ap-vacio">Todavía no hay reglas.' + f'<button type="button" class="cb cb-sec">{MAS} Agregar regla</button></div></div>',
        "Sin permiso para las reglas": bar + '<div class="ap-cuerpo"><div class="ap-vacio">Ya no tenés permiso para administrar las reglas.</div></div>',
    }
    hb = (F.tcampo("Cuándo", "Se aprueba una respuesta", select=True)
          + '<div class="p-tit2">Si (opcional)</div><div class="cond">Monto estimado es mayor o igual a 100.000' + f'<button type="button" class="ap-ib" aria-label="Quitar condición">{X}</button></div>'
          + '<div class="p-tit2">Hacer, en este orden</div><div class="acc"><b>Acción 1</b>' + F.tcampo("Qué hace", "Avisar a las personas con un rol", select=True)
          + F.tcampo("Rol", "Dueño", select=True) + F.tcampo("Mensaje", "Se aprobó {número}, de {Cliente}, por {Monto estimado}.", req=True) + "</div>"
          + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar acción</button>')
    hoja = F.thoja("Regla 3", f'<div class="rg-hb" style="display: flex; flex-direction: column; gap: 12px;">{hb}</div>', '<button type="button" class="cb cb-pri">Listo</button>')
    return C.tel_pagina(cuerpo, E, {"Editar una regla": hoja}, "Reglas · teléfono", P.CSS_TPL + CSS_T16)


ESTADOS_TAV = ["Al aprobarla", "Fuera de las 24 horas"]


def tel_avisos():
    E = ESTADOS_TAV
    env = A.t_burbuja("Lucía Fernández · 15:22 · Leído")
    resp = A.t_tarjeta(A.grilla_r(A.VALORES_ARCH) + A.r_ok("VIS-000126"))
    def auto(texto, pie, card, clase=""):
        return (f'<div class="ap-m sal auto"><span class="gl"><span class="aut">{BOT} Automático</span><span>{texto}</span>{card}</span>'
                f'<span class="pie {clase}">{pie}</span></div>')
    rec = auto("Recibimos VIS-000126. Te avisamos cuando la aprueben.", "15:30 · Leído", card_aviso())
    msgs = {"Al aprobarla": env + resp + rec + auto("Aprobaron VIS-000126. Te mandamos el comprobante.", "16:05 · Entregado", card_pdf()),
            "Fuera de las 24 horas": env + resp + rec + auto("Aprobaron VIS-000126. Te mandamos el comprobante.", "No se pudo: pasaron más de 24 horas", card_pdf(), "mal")}
    esc = {e: A.t_escr() for e in E}
    css = (A.CSS_AB + A.CSS_TRESP_AB + A.CSS_ARCH + CSS_AV.replace(".w-m", ".ap-m")
           + ".ap-m.sal.auto { max-width: 82%; }\n.ap-m .pie.mal { color: oklch(0.5 0.19 25); }\n")
    return A.pagina_tchat(E, esc, msgs, {}, "WhatsApp · Internos · avisos automáticos · teléfono", css)


# ================================================================ Los demás: «Por aprobar» en el panel, en Más › Formularios, en el inicio y el enlace a las reglas
def poner_por_aprobar(t, activo=False):
    if 'href="FRM-Por-Aprobar.dc.html"' in t:
        return t
    i = t.index('<aside class="w-panel" aria-label="Formularios">')
    k = t.index('<nav class="w-nav">', i) + len('<nav class="w-nav">')
    link = f'<a class="w-ln{" on" if activo else ""}" href="FRM-Por-Aprobar.dc.html">{APROBAR} Por aprobar <span class="cnt">4</span></a>'
    t = t[:k] + link + t[k:]
    if ".w-panel .w-ln .cnt" not in t:
        t = t.replace("</helmet>", '<style data-e16="panel">\n.w-panel .w-ln .cnt { margin-left: auto; font-size: 12px; font-weight: 600; min-width: 20px; height: 20px; padding: 0 6px; box-sizing: border-box; border-radius: 999px; background: oklch(0.95 0.06 85); color: oklch(0.45 0.1 70); display: inline-flex; align-items: center; justify-content: center; }\n</style>\n</helmet>', 1)
    return t


def panel_en_los_demas(c):
    hechos = []
    for f in sorted(PROJ.glob("*.dc.html")):
        nombre = f.name[:-8]
        if re.search(r"-v1\d\d$", nombre) or c["boards"].get(f.name, {}).get("page") == "archivo":
            continue
        t = f.read_text(encoding="utf-8")
        if '<aside class="w-panel" aria-label="Formularios">' not in t or 'href="FRM-Por-Aprobar.dc.html"' in t:
            continue
        f.write_text(poner_por_aprobar(t), encoding="utf-8")
        hechos.append(nombre)
    return hechos


def menu_telefono():
    f = PROJ / "M-WA-Menu.dc.html"
    t = f.read_text(encoding="utf-8")
    if 'href="M-FRM-Por-Aprobar.dc.html"' in t:
        return False
    m = re.search(r'<a class="ap-it " href="M-FRM-Respuestas\.dc\.html"><span class="tx"><b>Respuestas</b></span><span class="chev">(<svg.*?</svg>)</span></a>', t, re.S)
    assert m, "Más › Formularios sin Respuestas"
    nuevo = f'<a class="ap-it " href="M-FRM-Por-Aprobar.dc.html"><span class="tx"><b>Por aprobar</b></span><span class="chev">{m.group(1)}</span></a>' + m.group(0)
    f.write_text(t.replace(m.group(0), nuevo, 1), encoding="utf-8")
    return True


def editor_telefono():
    f = PROJ / "M-FRM-Editor.dc.html"
    t = f.read_text(encoding="utf-8")
    if 'href="M-FRM-Reglas.dc.html"' in t:
        return 0
    chev = svg('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>', 18, "2")
    fila = ('<div class="ap-gtit">Cuando llega una respuesta</div><div class="ap-grupo">'
            f'<a class="q-row" href="M-FRM-Reglas.dc.html" style="text-decoration: none; color: inherit;"><span class="tx"><b>4 reglas</b><span>Revisión 3 · 15/10/2026</span></span>{chev}</a></div>')
    viejo = '<div style="height: 20px;"></div></div>'
    n = t.count(viejo)
    f.write_text(t.replace(viejo, fila + viejo), encoding="utf-8")
    return n


def para_resolver():
    """«Por aprobar» dentro de «Para resolver» del inicio (IPendingItemSource del módulo, ADR 0040)."""
    hechos = []
    f = PROJ / "Inicio-Org.dc.html"
    t = f.read_text(encoding="utf-8")
    if "Por aprobar</b>" not in t:
        cols = 'style="grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) 110px 96px;"'
        grupo = (f'<div class="pr-g"><b>Por aprobar</b><span class="pr-a">Formularios</span><span class="cnt">4</span></div>'
                 f'<div class="tt-f" {cols}><span style="min-width: 0;"><span class="c1">ENT-000031</span><span class=c2>Entrega de pedido · Martín Paz</span></span>'
                 '<span><span class="pill alerta">Por aprobar</span></span><span class="c1 n">13/10/2026</span><a class="lnk" href="FRM-Respuesta-Aprobacion.dc.html">Ver</a></div>')
        ancla = '<div class="pr-g"><b>Invitaciones vencidas</b>'
        t = t.replace(ancla, grupo + ancla)
        t = t.replace('Para resolver <span class="cnt">4</span>', 'Para resolver <span class="cnt">5</span>').replace('Para resolver <span class="cnt">17</span>', 'Para resolver <span class="cnt">18</span>')
        f.write_text(t, encoding="utf-8")
        hechos.append("Inicio-Org")
    f = PROJ / "M-Inicio-Org.dc.html"
    t = f.read_text(encoding="utf-8")
    if "<b>Por aprobar</b>" not in t:
        m = re.search(r'<div class="c-p"><span class="c-ic alerta">(<svg.*?</svg>)</span><span class="tx"><b>carla\.bianchi', t, re.S)
        ic = m.group(1)
        grupo = ('<div class="c-g"><b>Por aprobar</b>· Formularios<span class="n">4</span></div>'
                 f'<div class="c-p"><span class="c-ic alerta">{ic}</span><span class="tx"><b>ENT-000031</b><span><span class="e alerta">Por aprobar · Entrega de pedido</span></span></span>'
                 '<a class="c-btn" href="M-FRM-Respuesta-Aprobacion.dc.html">Ver</a></div>')
        ancla = '<div class="c-g"><b>Invitaciones vencidas</b>'
        t = t.replace(ancla, grupo + ancla)
        t = t.replace('cantPend: e === "Con pendientes" ? "4" : e === "Más de 10 en un área" ? "17"', 'cantPend: e === "Con pendientes" ? "5" : e === "Más de 10 en un área" ? "18"')
        f.write_text(t, encoding="utf-8")
        hechos.append("M-Inicio-Org")
    return hechos


# ================================================================ canvas.json
TITULOS = {"FRM-Editor-Reglas": "Formularios · editor · cuando llega una respuesta", "FRM-Pdf": "Formularios · diseño del PDF",
           "FRM-Por-Aprobar": "Formularios · por aprobar", "FRM-Respuesta-Aprobacion": "Formularios · una respuesta con aprobación, actividad y PDF",
           "WA-Chats-Avisos": "WhatsApp · Internos · avisos automáticos de un formulario",
           "M-FRM-Reglas": "Formularios · reglas · teléfono", "M-FRM-Por-Aprobar": "Formularios · por aprobar · teléfono",
           "M-FRM-Respuesta-Aprobacion": "Formularios · una respuesta con aprobación · teléfono", "M-WA-Conversacion-Avisos": "WhatsApp · avisos automáticos · teléfono"}
LUGAR = {"FRM-Editor-Reglas": (0, 10240, 1440, 1400), "FRM-Pdf": (1520, 10240, 1440, 900), "FRM-Por-Aprobar": (3040, 10240, 1440, 900),
         "FRM-Respuesta-Aprobacion": (4560, 10240, 1440, 900), "WA-Chats-Avisos": (1520, 11220, 1440, 900),
         "M-FRM-Reglas": (0, 11760, 390, 844), "M-FRM-Por-Aprobar": (3040, 11220, 390, 844), "M-FRM-Respuesta-Aprobacion": (3510, 11220, 390, 844),
         "M-WA-Conversacion-Avisos": (470, 11760, 390, 844)}
CON_ESTADOS_NUEVOS = ["Inicio-Org", "M-Inicio-Org", "M-FRM-Editor"]


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    marca = "" if E16_APROBADA else A.PARA_APROBAR
    for n, (x, y, w, h) in LUGAR.items():
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n] + marca, "page": "formularios", "is_interactive": True}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    for n in CON_ESTADOS_NUEVOS:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(A.PARA_APROBAR, "") + marca
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    return c


if __name__ == "__main__":
    tableros = {"FRM-Editor-Reglas": reglas(), "FRM-Pdf": pdf(), "FRM-Por-Aprobar": por_aprobar(), "FRM-Respuesta-Aprobacion": respuesta_aprobacion(),
                "WA-Chats-Avisos": chat_avisos(), "M-FRM-Reglas": tel_reglas(), "M-FRM-Por-Aprobar": tel_por_aprobar(),
                "M-FRM-Respuesta-Aprobacion": tel_respuesta_aprobacion(), "M-WA-Conversacion-Avisos": tel_avisos()}
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    c = registrar()
    print("tableros", list(tableros))
    print("respuestas en el panel", P.panel_en_los_demas(c))
    print("panel", panel_en_los_demas(c))
    print("menú del teléfono", menu_telefono())
    print("editor del teléfono", editor_telefono())
    print("para resolver", para_resolver())
