"""Etapa 17 · Las reglas de ejemplo y el diseño del PDF de una plantilla (decisiones 30 a 33 de la hoja de ruta, 18/10).

Spec: §3 («Reglas de ejemplo y diseño del PDF») y §8 de `docs/plans/formularios/e17-biblioteca.md` del back. Copia las piezas de la E16
(`formularios_ab_reglas_1004.py`): la sección «Cuando llega una respuesta» y el diseño del PDF. Lo que cambia:
- en Plataforma, las reglas y el PDF van en la pestaña «Plantilla», debajo de las preguntas, y se guardan con el borrador de la plantilla:
  sin «Guardar reglas» ni historial. Una acción que pide un rol dice «Lo elige cada organización» y lleva un «Rol sugerido» que solo se
  muestra (decisiones 32 y 33);
- en la organización, al usar una plantilla, las reglas llegan precargadas y sin guardar, con «Elegí el rol» en cada acción que lo pide.
  Lo que apunta a una pregunta que ya no está queda marcado. Al guardarlas nace la revisión 1 (decisión 30);
- en la vista de una plantilla, las reglas de ejemplo en palabras.

Tableros nuevos: Plat-FRM-Plantilla-Reglas, Plat-FRM-Pdf, FRM-Editor-Reglas-Plantilla y M-FRM-Reglas-Plantilla. Además suma las reglas de
ejemplo a FRM-Plantilla, FRM-Plantilla-Usar y M-FRM-Plantilla, y una regla con problemas a la comprobación de Plat-FRM-Publicar. Corre
después de `formularios_ab_asistente_1004.py`.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_asistente_1004 as AS  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_ab_planilla_1004 as P  # noqa: E402
import formularios_ab_reglas_1004 as R  # noqa: E402
import formularios_biblioteca_1004 as B  # noqa: E402

PROJ = F.PROJ
X, CHEV, ALERTA, MAS, KEBAB = F.X, F.CHEV, F.ALERTA, F.MAS, F.KEBAB
TRI = P.TRI
info = F.info
EJEMPLOS_APROBADOS = True

# ================================================================ Las reglas de ejemplo de «Visita a cliente»
SUGERIDO = {1: "Supervisor", 3: "Gerente"}
ROLES_ORG = ["Administrador", "Auditor", "Dueño", "Recursos humanos", "Supervisor"]  # los de Roles y el de los catálogos con filtros


def rol(n, modo):
    """modo: plat (Plataforma), ver (la vista de la plantilla), falta (al usarla) o el nombre del rol elegido."""
    if modo == "plat":
        return "un rol que elige cada organización"
    if modo == "ver":
        return "un rol que elegís al usarla"
    if modo == "falta":
        return 'el rol <span class="rg-falta">Elegí el rol</span>'
    return f"el rol <b>{modo}</b>"


def sug(n, modo):
    """El rol sugerido va al final de la acción, mientras no haya un rol elegido."""
    return f' <span class="rg-sug">Rol sugerido: {SUGERIDO[n]}</span>' if modo in ("plat", "ver", "falta") else ""


def reglas_ej(m1="plat", m3="plat", pdf="Plat-FRM-Pdf.dc.html", monto_mal=False):
    ver = f' · <a class="lnk" href="{pdf}">Ver el diseño</a>' if pdf else ""
    si3 = '<span class="rg-mal">Monto estimado</span> es mayor o igual a 100.000' if monto_mal else "Monto estimado es mayor o igual a 100.000"
    return [
        (1, "se recibe una respuesta", None, ["Mandarle un mensaje a quien la cargó: «Recibimos {número}. Te avisamos cuando la aprueben.»",
                                              "Pedir aprobación a una persona con " + rol(1, m1) + sug(1, m1)]),
        (2, "se aprueba una respuesta", None, ["Armar el PDF «Comprobante de visita»" + ver,
                                              "Mandarle el PDF a quien la cargó: «Aprobaron {número}. Te mandamos el comprobante.»"]),
        (3, "se aprueba una respuesta", si3, ["Avisar a las personas con " + rol(3, m3) + ": «Se aprobó {número}, de {Cliente}, por {Monto estimado}.»" + sug(3, m3)]),
        (4, "se rechaza una respuesta", None, ["Mandarle a quien la cargó el motivo del rechazo"]),
    ]


CSS_EJ = """.rg-sug { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 6px; background: var(--s2); border: 1px dashed var(--borde2); font-size: 12px; color: var(--t2); white-space: nowrap; vertical-align: 1px; }
.rg-falta { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 6px; background: oklch(0.97 0.04 85); border: 1px solid oklch(0.85 0.08 85); font-size: 12px; font-weight: 600; color: oklch(0.45 0.1 70); white-space: nowrap; vertical-align: 1px; }
.rg-mal { color: oklch(0.5 0.19 25); text-decoration: line-through; }
.rg .f-cab .f-apag { display: inline-flex; align-items: center; gap: 6px; }
.rg-acc .ct.ro { display: flex; justify-content: space-between; align-items: center; background: var(--s2); color: var(--t2); }
.rg-acc .w-cmp .ay { font-size: 12.5px; color: var(--t3); }
.rg-acc .q-cat .ct.sel.ph { color: var(--t3); }
.rg-acc .q-cat .ct.sel.falta { border-color: oklch(0.75 0.12 75); box-shadow: 0 0 0 1px oklch(0.75 0.12 75); }
.rg-acc .q-catmn > span { flex-direction: row; justify-content: space-between; }
.k-err { font-size: 12.5px; color: oklch(0.5 0.19 25); display: flex; gap: 6px; align-items: flex-start; }
.k-err svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; }
.rg-sec .k-cond .ct.mal { text-decoration: line-through; }
.rg .w-caja:has(.q-catmn), .rg:has(.q-catmn) { overflow: visible; }
"""


def campo_ro(rot, valor):
    return f'<div class="w-cmp"><span class="rt">{rot}</span><div class="ct ro">{valor}{A.CANDADO}</div></div>'


def campo_rol(estado, sugerido, abierto=False):
    """El selector de rol de una acción, en la organización: «Elegí el rol» hasta que se elige; debajo, el rol sugerido."""
    if estado == "falta":
        sel = f'<div class="ct sel ph falta{" abierto" if abierto else ""}">Elegí el rol{CHEV}</div>'
    else:
        sel = f'<div class="ct sel">{estado}{CHEV}</div>'
    menu = ""
    if abierto:
        items = "".join(f'<span role="option">{n}</span>' for n in ROLES_ORG)
        menu = f'<div class="q-catmn" role="listbox" aria-label="Rol">{items}</div>'
    return (f'<div class="w-cmp q-cat"><span class="rt">Rol <span class="req">*</span></span>{sel}{menu}'
            f'<span class="ay">Rol sugerido: {sugerido}</span></div>')


def rg_editar(n, cuando, si, acciones, agregar_ok=True):
    agregar = (f'<button type="button" class="cb cb-sec">{MAS} Agregar acción</button>' if agregar_ok else
               f'<button type="button" class="cb cb-sec" disabled title="Después de pedir aprobación no se agregan más acciones">{MAS} Agregar acción</button>')
    s = (f'<div class="rg-sec"><span class="rt">Si (opcional) {info("Sin condición, la regla corre siempre. Las condiciones usan las preguntas del formulario.")}</span>'
         f'{si}<button type="button" class="cb cb-enl">{MAS} Agregar condición</button></div>')
    hacer = f'<div class="rg-sec"><span class="rt">Hacer, en este orden</span>{acciones}{agregar}</div>'
    ed = (f'<div class="rg-ed">{R.campo("Cuándo", cuando, sel=True, clase="cuando")}{s}{hacer}'
          '<div class="rg-listo"><button type="button" class="cb cb-sec">Listo</button></div></div>')
    return f'<div class="rg-fila abierta"><span class="n">{n}</span>{ed}<span></span></div>'


SIN_COND = '<span class="ab-sub">Sin condición.</span>'
MSJ_1 = "Recibimos {número}. Te avisamos cuando la aprueben."
MSJ_3 = "Se aprobó {número}, de {Cliente}, por {Monto estimado}."
AYUDA_SUG = info("Solo se muestra como ayuda: no elige ningún rol. Cada organización elige el suyo al usar la plantilla.")


# ================================================================ Plataforma: la sección en la pestaña «Plantilla» (decisión 33)
def plat_abierta(modo="editar"):
    sug = R.campo("Rol sugerido", "Supervisor", extra_rt=" " + AYUDA_SUG)
    pedir = R.campo("Acción {k}", "Pedir aprobación a una persona con un rol", sel=True, ancho=True) + campo_ro("Rol", "Lo elige cada organización") + sug
    mandar = R.campo("Acción {k}", "Mandarle un mensaje a quien la cargó", sel=True, ancho=True) + R.area("Mensaje", MSJ_1, extra_rt=R.AYUDA_MSJ)
    if modo == "error":
        acciones = (R.rg_accion(1, pedir.replace("{k}", "1"))
                    + R.rg_accion(2, mandar.replace("{k}", "2"), mal="Pedir aprobación tiene que ser la última acción. Lo que sigue va en «Se aprueba» o «Se rechaza»."))
    else:
        acciones = R.rg_accion(1, mandar.replace("{k}", "1")) + R.rg_accion(2, pedir.replace("{k}", "2"))
    return rg_editar(1, "Se recibe una respuesta", SIN_COND, acciones, agregar_ok=False)


def caja_plat(modo="normal"):
    """modo: normal, editar, error o vacio. Se guarda con el borrador de la plantilla: sin botón propio ni historial."""
    tit = (f'<span class="rg-tit">Cuando llega una respuesta '
           f'{info("Reglas de ejemplo: se guardan con el borrador y se publican con la plantilla. Cada organización elige los roles y las guarda para usarlas.")}</span>')
    if modo == "vacio":
        filas = '<div class="rg-vacio"><b>Todavía no hay reglas de ejemplo.</b></div>'
    else:
        filas = "".join(plat_abierta(modo) if (modo in ("editar", "error") and r[0] == 1) else R.rg_fila(r) for r in reglas_ej())
    pie = f'<div class="rg-pie"><button type="button" class="cb cb-sec">{MAS} Agregar regla</button></div>'
    return f'<div class="w-caja rg"><div class="f-cab">{tit}</div>{filas}{pie}</div>'


SUBIR_PLAT = 640  # cuánto de la pestaña queda arriba, fuera de la vista: el tablero muestra la página más abajo, en las reglas
ESTADOS_PRG = ["Reglas de ejemplo", "Editar una regla", "Una regla con errores", "Sin reglas", "Borrador guardado"]
MODO_PRG = {"Reglas de ejemplo": "normal", "Editar una regla": "editar", "Una regla con errores": "error", "Sin reglas": "vacio", "Borrador guardado": "normal"}


def plat_reglas():
    pub = '<a class="cb cb-pri" href="Plat-FRM-Publicar.dc.html">Publicar</a>'
    kebab = f'<button type="button" class="ib o-borde" aria-label="Acciones de la plantilla" aria-haspopup="menu">{KEBAB}</button>'
    sucio_acc = ('<button type="button" class="cb cb-sec">Descartar</button><button type="button" class="cb cb-pri">Guardar borrador</button>'
                 '<button type="button" class="cb cb-sec">Publicar</button>')
    est = B.ESTADO_PLANTILLA
    est_sucio = est.replace('<span class="f-sucio">Cambios sin publicar</span>', '<span class="f-sucio">Cambios sin guardar</span>')
    partes = []
    for e, m in MODO_PRG.items():
        sucio = m in ("editar", "error")
        cuerpo = B.preguntas_plantilla()
        k = cuerpo.rindex("</div>" + A.vista())
        cuerpo = cuerpo[:k] + caja_plat(m) + cuerpo[k:]
        banda, body = B.plat_partes("Plantilla", cuerpo, sucio_acc if sucio else pub + kebab, est_sucio if sucio else est)
        body = body.replace('<div class="w-body"><div class="o-tabs ficha"', '<div class="w-body rg-body"><div class="o-tabs ficha" style="margin-top: -%dpx;"' % SUBIR_PLAT, 1)
        partes.append((banda, body))
    banda = A.con_estados([(e, b) for (e, (b, _)) in zip(ESTADOS_PRG, partes)])
    cuerpo = A.con_estados([(e, c) for (e, (_, c)) in zip(ESTADOS_PRG, partes)])
    miga = "Plataforma / Administración / Formularios / Biblioteca / Visita a cliente"
    t = B.pagina_plat("Plantilla de formulario · reglas de ejemplo · /plataforma/formularios/:id", miga, banda, cuerpo,
                      css=F.CSS_FICHA + F.CSS_DATOS + F.CSS_ESTADOS + F.CSS_INGLES + F.CSS_GRILLA + K_CSS() + B.CSS_PFICHA + B.CSS_PFICHA2
                      + B.CSS_EDITOR_PLAT.replace(".w-app { height: 1100px !important; }", ".w-app { height: 1400px !important; }") + A.CSS_AB + C.CSS_K4 + R.CSS_RG + CSS_EJ,
                      estados=("estado", ESTADOS_PRG), js=A.js_estados(ESTADOS_PRG))
    t = t.replace('"$preview":{"width":1440,"height":900}', '"$preview":{"width":1440,"height":1400}', 1)
    return F.con_dialogo(t, f'<sc-if value="{{{{s{ESTADOS_PRG.index("Borrador guardado")}}}}}" hint-placeholder-val="{{{{no}}}}">{A.toast("Borrador guardado.")}</sc-if>')


def K_CSS():
    import formularios_catalogos_1004 as K
    return K.CSS_FICHA_CAT + K.CSS_FICHA_CAT2


# ================================================================ Plataforma: el diseño del PDF de la plantilla (decisiones 31 y 33)
PREGS_PLANT = ["Cliente", "Fecha de la visita", "¿Se concretó la venta?", "Monto estimado", "Motivo", "Observaciones"]
CSS_PDF_PLAT = """.pd-hoja .cab .org .lg.ph { background: transparent; border: 1px dashed var(--borde2); color: var(--t3); font-weight: 500; width: auto; padding: 0 6px; }
.pd-hoja .cab .org.ph { color: var(--t3); font-weight: 600; }
"""


def hoja_plat(ingles=False):
    t = (lambda es, en: en if ingles else es)
    vals = [(t("Cliente", "Customer"), "Ferretería Rosales"), (t("Fecha de la visita", "Visit date"), "13/10/2026"),
            (t("¿Se concretó la venta?", "Was the sale closed?"), t("Sí", "Yes")), (t("Monto estimado", "Estimated amount"), "125.500,00"),
            (t("Motivo", "Reason"), t("Venta nueva", "New sale")), (t("Observaciones", "Notes"), t("Pidió la lista de precios nueva.", "Asked for the new price list."))]
    gr = "".join(f'<span class="k">{k}</span><span>{v}</span>' for k, v in vals)
    return (f'<div class="pd-hoja"><div class="cab"><span class="org ph"><span class="lg ph">Logo</span>{t("Nombre de la organización", "Organization name")}</span>'
            f'<small>{t("Comprobante de visita", "Visit receipt")}</small></div>'
            f'<h3>{t("Visita", "Visit")} VIS-000001</h3><span class="sub">13/10/2026 · {t("Cargó", "Submitted by")} Tomás Acosta</span>'
            f'<div class="gr">{gr}</div><div class="apr"><b>{t("Aprobada por", "Approved by")}</b>{t("Se completa al aprobarla", "Filled in when approved")}</div>'
            f'<span>{t("Este comprobante no reemplaza la factura.", "This receipt does not replace the invoice.")}</span>'
            f'<span class="fin"><span>{t("Versión 1 del formulario", "Form version 1")}</span><span>{t("Página 1 de 1", "Page 1 of 1")}</span></span></div>')


def cuerpo_pdf_plat(modo="normal"):
    sin_nombre = modo == "sin_nombre"
    nombre = (f'<div class="w-cmp"><span class="rt">Nombre del PDF <span class="req">*</span></span><div class="ct mal ph"></div>'
              '<span class="err2" role="alert">Completá el idioma original.</span></div>') if sin_nombre else R.campo("Nombre del PDF", "Comprobante de visita", req=True)
    en = R.campo("En inglés", "Visit receipt", extra_rt=" " + info("Opcional. Si falta una traducción, el PDF sale entero en el idioma original."))
    lista = '<div class="pd-lista ancho"><span class="rt">Qué preguntas incluye</span>' + "".join(R.ck(p) for p in PREGS_PLANT) + "</div>"
    opciones = ('<div class="pd-lista ancho">'
                + R.ck("Incluir las fotos", True, " " + info("Las de las preguntas elegidas, chicas y debajo de su pregunta. Sin marcar, solo dice cuántas hay. Los documentos se nombran, no se adjuntan."))
                + R.ck("Quién la aprobó y cuándo", True, " " + info("Se completa al aprobarla.")) + "</div>")
    pie = R.campo("Texto al pie", "Este comprobante no reemplaza la factura.") + R.campo("En inglés", "This receipt does not replace the invoice.")
    form = f'<div class="w-caja"><div class="f-cab"><span>El comprobante</span></div><div class="pd-form">{nombre}{en}{lista}{opciones}{pie}</div></div>'
    ingles = modo == "ingles"
    seg = (f'<span class="ab-seg" role="radiogroup" aria-label="Idioma de la vista previa"><span class="{"" if ingles else "on"}" role="radio">Español</span>'
           f'<span class="{"on" if ingles else ""}" role="radio">English</span></span>')
    prev = (f'<div class="w-caja"><div class="f-cab"><span class="rg-tit">Vista previa {info("Con una respuesta de ejemplo. Cada organización lo ve con su logo y su nombre.")}</span>'
            f'<span class="der">{seg}</span></div><div class="pd-prev">{hoja_plat(ingles)}</div></div>')
    return f'<div class="w-body"><div class="pd-cols">{form}{prev}</div></div>'


ESTADOS_PPDF = ["Diseño", "Cambios sin guardar", "Vista previa en inglés", "Falta el nombre", "Borrador guardado"]
MODO_PPDF = {"Diseño": "normal", "Cambios sin guardar": "normal", "Vista previa en inglés": "ingles", "Falta el nombre": "sin_nombre", "Borrador guardado": "normal"}


def banda_pdf_plat(e):
    sucio = e in ("Cambios sin guardar", "Falta el nombre")
    est = "Visita a cliente · diseño del PDF" + ('<span class="f-sucio">Cambios sin guardar</span>' if sucio else "")
    acc = (f'<button type="button" class="cb cb-sec"{"" if sucio else " disabled"}>Descartar</button>'
           f'<button type="button" class="cb cb-pri"{"" if sucio and e != "Falta el nombre" else " disabled"}>Guardar borrador</button>')
    titulo = "Diseño del PDF" if e == "Falta el nombre" else "Comprobante de visita"
    return A.banda(titulo, est, acc, "Plat-FRM-Plantilla-Reglas.dc.html").replace('aria-label="Volver a Diseñar formularios"', 'aria-label="Volver a la plantilla"', 1)


def plat_pdf():
    banda = A.con_estados([(e, banda_pdf_plat(e)) for e in ESTADOS_PPDF])
    cuerpo = A.con_estados([(e, cuerpo_pdf_plat(m)) for e, m in MODO_PPDF.items()])
    miga = "Plataforma / Administración / Formularios / Biblioteca / Visita a cliente / Diseño del PDF"
    t = B.pagina_plat("Plantilla de formulario · diseño del PDF · /plataforma/formularios/:id/pdf", miga, banda, cuerpo,
                      css=F.CSS_FICHA + F.CSS_ESTADOS + A.CSS_AB + A.CSS_EDITOR.replace(".w-app { height: 1400px !important; }", "") + R.CSS_RG + R.CSS_PDF + CSS_PDF_PLAT,
                      estados=("estado", ESTADOS_PPDF), js=A.js_estados(ESTADOS_PPDF))
    return F.con_dialogo(t, f'<sc-if value="{{{{s{ESTADOS_PPDF.index("Borrador guardado")}}}}}" hint-placeholder-val="{{{{no}}}}">{A.toast("Borrador guardado.")}</sc-if>')


# ================================================================ Organización: las reglas que trae la plantilla, sin guardar (decisión 30)
def org_abierta(modo):
    """modo: rol (elegir el rol de la regla 1, con la lista abierta) o pregunta (la regla 3 apunta a una pregunta que ya no está)."""
    if modo == "rol":
        mandar = R.campo("Acción 1", "Mandarle un mensaje a quien la cargó", sel=True, ancho=True) + R.area("Mensaje", MSJ_1, extra_rt=R.AYUDA_MSJ)
        pedir = R.campo("Acción 2", "Pedir aprobación a una persona con un rol", sel=True, ancho=True) + campo_rol("falta", SUGERIDO[1], abierto=True)
        return rg_editar(1, "Se recibe una respuesta", SIN_COND, R.rg_accion(1, mandar) + R.rg_accion(2, pedir), agregar_ok=False)
    cond = C.f_cond("Si", "Monto estimado", "Es mayor o igual a", "100.000").replace('<div class="ct">Monto estimado', '<div class="ct mal">Monto estimado', 1)
    cond += f'<span class="k-err" role="alert">{ALERTA}Esa pregunta ya no está en el formulario. Elegí otra o quitá la condición.</span>'
    avisar = (R.campo("Acción 1", "Avisar a las personas con un rol", sel=True, ancho=True) + campo_rol("falta", SUGERIDO[3])
              + R.area("Mensaje", MSJ_3, extra_rt=R.AYUDA_MSJ))
    acc = R.rg_accion(1, avisar, mal="{Monto estimado} ya no está en el formulario. Quitalo del mensaje.")
    return rg_editar(3, "Se aprueba una respuesta", cond, acc)


def caja_org(modo="ejemplo"):
    """modo: ejemplo, rol, pregunta, elegidos o guardadas."""
    texto = ("Se guardan aparte: cambiarlas no crea otra versión ni toca WhatsApp. Lo que ya pasó con cada respuesta no cambia." if modo == "guardadas" else
             "Las trae la plantilla «Visita a cliente». No se usan hasta que elijas los roles y las guardes. Mientras tanto, el formulario se puede publicar sin reglas.")
    tit = f'<span class="rg-tit">Cuando llega una respuesta {info(texto)}</span>'
    if modo == "guardadas":
        insignia = '<span class="ab-chip">Revisión 1</span>'
        boton = '<button type="button" class="cb cb-pri" disabled>Guardar reglas</button>'
    else:
        insignia = '<span class="ab-chip">De la plantilla</span><span class="f-sucio">Sin guardar</span>'
        if modo == "elegidos":
            boton = '<button type="button" class="cb cb-pri">Guardar reglas</button>'
        else:
            motivo = "Corregí las reglas marcadas." if modo == "pregunta" else "Elegí el rol en las reglas 1 y 3."
            boton = f'<span class="f-apag"><button type="button" class="cb cb-pri" disabled>Guardar reglas</button>{info(motivo)}</span>'
    if modo in ("elegidos", "guardadas"):
        regs = reglas_ej("Supervisor", "Dueño", pdf="FRM-Pdf.dc.html")
    else:
        regs = reglas_ej("falta", "falta", pdf="FRM-Pdf.dc.html", monto_mal=(modo == "pregunta"))
    filas = ""
    for r in regs:
        if modo == "rol" and r[0] == 1:
            filas += org_abierta("rol")
        elif modo == "pregunta" and r[0] == 3:
            filas += org_abierta("pregunta")
        else:
            filas += R.rg_fila(r)
    pie = f'<div class="rg-pie"><button type="button" class="cb cb-sec">{MAS} Agregar regla</button></div>'
    return f'<div class="w-caja rg"><div class="f-cab">{tit}<span class="der">{insignia}{boton}</span></div>{filas}{pie}</div>'


def historial_org(modo):
    if modo != "guardadas":
        return R.caja_historial("vacio")
    tit = f'<span class="rg-tit">Historial de las reglas {info("Cada respuesta recuerda con qué revisión se procesó. Los cambios se aplican a las respuestas nuevas.")}</span>'
    return (f'<div class="w-caja rg-hist"><div class="f-cab">{tit}</div><div class="h"><a href="#">Revisión 1 <span class="w-est">Vigente</span></a>'
            "<small>18/10/2026 · Lucía Fernández</small></div></div>")


def sin_monto(html):
    """La pregunta «Monto estimado» borrada del borrador: fuera de la lista y de la vista del empleado, y las demás renumeradas."""
    m = re.search(r'<div class="q-it"><span class="num">4</span><span class="dato"><b>Monto estimado</b>.*?</div>', html, re.S)
    assert m, "sin la fila de Monto estimado"
    html = html.replace(m.group(0), "", 1)
    html = html.replace('<span class="num">5</span>', '<span class="num">4</span>', 1).replace('<span class="num">6</span>', '<span class="num">5</span>', 1)
    html = html.replace("6 preguntas", "5 preguntas")
    return html


def cuerpo_org(modo):
    arriba = A.cuerpo_editor(abierta=False, prefijo="VIS2")
    arriba = arriba[len('<div class="w-body">'):-len("</div>")]
    if modo == "pregunta":
        arriba = sin_monto(arriba)
    return (f'<div class="w-body rg-body"><div class="rg-arriba">{arriba}</div>'
            f'<div class="rg-cols">{caja_org(modo)}{historial_org(modo)}</div></div>')


ESTADOS_ORG = ["Reglas de la plantilla", "Elegir el rol", "Una pregunta que ya no está", "Roles elegidos", "Reglas guardadas"]
MODO_ORG = {"Reglas de la plantilla": "ejemplo", "Elegir el rol": "rol", "Una pregunta que ya no está": "pregunta", "Roles elegidos": "elegidos", "Reglas guardadas": "guardadas"}


def org_reglas():
    vol = "FRM-Listado.dc.html"
    V = {}
    for e, m in MODO_ORG.items():
        V[e] = (A.banda("Visita a cliente", A.EST_BOR, A.acc_editor(), vol), cuerpo_org(m))
    capas = {"Reglas guardadas": A.toast("Reglas guardadas.")}
    css = C.CSS_K4 + R.CSS_RG + CSS_EJ + f".rg-arriba {{ margin-top: -{R.SUBIR_EDITOR}px; }}\n"
    return A.pagina_editor(V, capas, ESTADOS_ORG, "Editor del formulario · reglas de la plantilla · /org/formularios/:id", css)


# ================================================================ El teléfono: las reglas que trae la plantilla
ESTADOS_TRP = ["Reglas de la plantilla", "Elegir el rol", "Reglas guardadas"]
CSS_TRP = """.rg-t .r .tx small .rg-falta { height: 18px; font-size: 11.5px; }
.ap-fijo.col { flex-direction: column; align-items: stretch; gap: 0; }
.ap-fijo.col .cb.full { flex: none; height: 50px; display: flex; align-items: center; justify-content: center; }
.ap-fijo .mot { display: block; margin-top: 6px; font-size: 13px; color: var(--t3); text-align: center; }
"""


def texto_tel(a):
    """Una acción en una línea del teléfono: sin el sugerido (va debajo) y sin marcas, salvo «Elegí el rol»."""
    a = re.sub(r' ?<span class="rg-sug">[^<]*</span>', "", a).replace('<span class="rg-falta">Elegí el rol</span>', "\x00")
    return re.sub("<[^>]+>", "", a).strip().replace("\x00", '<span class="rg-falta">Elegí el rol</span>')


def tel_reglas_plantilla():
    E = ESTADOS_TRP

    def lista(elegidos=False):
        filas = ""
        for n, cuando, si, acciones in reglas_ej("Supervisor" if elegidos else "falta", "Dueño" if elegidos else "falta", pdf=None):
            s = f"<small>Si {si}</small>" if si else ""
            acc = ""
            for k, a in enumerate(acciones, 1):
                acc += f"<small>{k}. {texto_tel(a)}</small>" + (f"<small>Rol sugerido: {SUGERIDO[n]}</small>" if 'class="rg-sug"' in a else "")
            filas += (f'<div class="r"><span class="n">{n}</span><span class="tx"><b>Cuando {cuando}</b>{s}{acc}</span>'
                      f'<button type="button" class="ap-ib" aria-label="Acciones de la regla {n}">{F.TKEBAB}</button></div>')
        return f'<div class="rg-t">{filas}</div>'

    bar_ej = C.t_bar("Cuando llega una respuesta", "x", "M-FRM-Editor.dc.html").replace('<span class="sub">x</span>', '<span class="sub amb">De la plantilla · sin guardar</span>')
    bar_ok = C.t_bar("Cuando llega una respuesta", "Visita a cliente · revisión 1", "M-FRM-Editor.dc.html")
    agregar = f'<div style="padding: 12px 16px;"><button type="button" class="cb cb-sec">{MAS} Agregar regla</button></div>'
    fijo_off = ('<div class="ap-fijo col"><button type="button" class="cb cb-pri full" disabled>Guardar reglas</button>'
                '<span class="mot">Elegí el rol en las reglas 1 y 3.</span></div>')
    fijo_ok = '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Guardar reglas</button></div>'
    cuerpo = {
        "Reglas de la plantilla": bar_ej + f'<div class="tr-scroll">{lista()}{agregar}</div>' + fijo_off,
        "Elegir el rol": bar_ej + f'<div class="tr-scroll">{lista()}{agregar}</div>' + fijo_off,
        "Reglas guardadas": bar_ok + f'<div class="tr-scroll">{lista(True)}{agregar}</div>' + fijo_ok,
    }
    opc = "".join(f'<span class="t-opc">{n}</span>' for n in ROLES_ORG)
    hoja = F.thoja("Rol de la acción 2", opc, "", sub=f"Regla 1 · Rol sugerido: {SUGERIDO[1]}").replace('<div class="hb">', '<div class="hb lst">', 1)
    return C.tel_pagina(cuerpo, E, {"Elegir el rol": hoja}, "Reglas de la plantilla · teléfono", P.CSS_TPL + R.CSS_T16 + CSS_EJ + CSS_TRP)


# ================================================================ La vista de una plantilla: las reglas de ejemplo en palabras
CAJA_VER_MARCA = 'data-e17="reglas-de-ejemplo"'


def caja_ver():
    regs = reglas_ej("ver", "ver", pdf=None)
    filas = "".join(R.rg_fila(r, kebab=False) for r in regs)
    tit = f'<span class="rg-tit">Reglas de ejemplo {info("Llegan sin guardar al formulario: elegís los roles y las guardás para usarlas. El diseño del PDF llega listo.")}</span>'
    return f'<div class="w-caja" {CAJA_VER_MARCA}><div class="f-cab">{tit}</div><div class="rg-res ver">{filas}</div></div>'


CSS_VER = """.rg-res.ver { border: 0; border-radius: 0; }
.rg-res.ver .rg-fila { padding: 12px 16px; }
.rg-res.ver .rg-fila:first-child { border-top: 0; }
"""


def poner_en_la_vista(nombre, alto):
    f = PROJ / f"{nombre}.dc.html"
    t = f.read_text(encoding="utf-8")
    if CAJA_VER_MARCA in t:
        return False
    a = "<span>3 opciones · Seguimiento, Venta nueva y Reclamo</span></span></div></div>"
    assert t.count(a) == 1, nombre
    t = t.replace(a, a + caja_ver(), 1)
    css = R.CSS_RG.replace(".rg-body { overflow: hidden !important; }\n", "") + CSS_EJ + CSS_VER + f".w-app {{ height: {alto}px !important; }}\n"
    t = t.replace("</helmet>", f'<style data-e17="reglas-de-ejemplo">\n{css}</style>\n</helmet>', 1)
    t = t.replace('"$preview":{"width":1440,"height":900}', f'"$preview":{{"width":1440,"height":{alto}}}', 1)
    f.write_text(t, encoding="utf-8")
    return True


ESTADO_TEL_REGLAS = "Más abajo: reglas de ejemplo"
SUBIR_TEL = 680


def poner_en_el_telefono():
    f = PROJ / "M-FRM-Plantilla.dc.html"
    t = f.read_text(encoding="utf-8")
    if CAJA_VER_MARCA in t:
        return False
    filas = ""
    for n, cuando, si, acciones in reglas_ej("ver", "ver", pdf=None):
        s = f"<small>Si {si}</small>" if si else ""
        acc = ""
        for k, a in enumerate(acciones, 1):
            acc += f"<small>{k}. {texto_tel(a)}</small>" + (f"<small>Rol sugerido: {SUGERIDO[n]}</small>" if 'class="rg-sug"' in a else "")
        filas += f'<div class="r"><span class="n">{n}</span><span class="tx"><b>Cuando {cuando}</b>{s}{acc}</span></div>'
    grupo = f'<div class="ap-gtit" {CAJA_VER_MARCA}>Reglas de ejemplo</div><div class="rg-t ver">{filas}</div>'
    a = '<span>3 opciones · Seguimiento, Venta nueva y Reclamo</span></span></div></div>'
    assert t.count(a) == 1
    t = t.replace(a, a + grupo, 1)
    # Un estado más, con la página corrida hacia abajo: el teléfono no tiene lugar para todo.
    a = '<div class="ap-cuerpo"><div class="ap-gtit">Descripción</div>'
    assert t.count(a) == 1
    t = t.replace(a, a.replace('class="ap-cuerpo"', 'class="ap-cuerpo {{cuerpoClase}}"'), 1)
    viejo = json.dumps(B.ESTADOS_TPLANT_ORG, ensure_ascii=False, separators=(",", ":"))
    nuevo = json.dumps(B.ESTADOS_TPLANT_ORG[:1] + [ESTADO_TEL_REGLAS] + B.ESTADOS_TPLANT_ORG[1:], ensure_ascii=False, separators=(",", ":"))
    assert t.count(viejo) == 1
    t = t.replace(viejo, nuevo, 1)
    a = "    return { si: true, no: false, conPermiso:"
    assert t.count(a) == 1
    t = t.replace(a, f"    return {{ si: true, no: false, cuerpoClase: e === '{ESTADO_TEL_REGLAS}' ? 'abajo' : '', conPermiso:", 1)
    css = (".rg-t.ver { margin: 0 16px; }\n" + R.CSS_T16[R.CSS_T16.index(".rg-t {"):R.CSS_T16.index(".rg-t .r .ap-ib")]
           + f".ap-cuerpo.abajo > :first-child {{ margin-top: -{SUBIR_TEL}px; }}\n")
    t = t.replace("</helmet>", f'<style data-e17="reglas-de-ejemplo">\n{css}</style>\n</helmet>', 1)
    f.write_text(t, encoding="utf-8")
    return True


# ================================================================ La comprobación al publicar una plantilla: una regla con problemas
def regla_al_publicar():
    f = PROJ / "Plat-FRM-Publicar.dc.html"
    t = f.read_text(encoding="utf-8")
    if "Regla 1 · Cuando se recibe una respuesta" in t:
        return False
    a = '<a href="Plat-FRM-Plantilla.dc.html">Ver el catálogo</a></div>'
    assert t.count(a) == 1
    prob = (f'<div class="p-prob"><span class="mal">{ALERTA}</span><span class="tx"><b>Regla 1 · Cuando se recibe una respuesta</b>'
            '<span>Pedir aprobación tiene que ser la última acción.</span></span><a href="Plat-FRM-Plantilla-Reglas.dc.html">Editar</a></div>')
    f.write_text(t.replace(a, a + prob, 1), encoding="utf-8")
    return True


# ================================================================ canvas.json
TITULOS = {"Plat-FRM-Plantilla-Reglas": "Plataforma · plantilla · reglas de ejemplo", "Plat-FRM-Pdf": "Plataforma · plantilla · diseño del PDF",
           "FRM-Editor-Reglas-Plantilla": "Formularios · editor · las reglas que trae una plantilla",
           "M-FRM-Reglas-Plantilla": "Formularios · las reglas que trae una plantilla · teléfono"}
LUGAR = {"Plat-FRM-Plantilla-Reglas": (1520, 1480, 1440, 1400, "plat-formularios"), "Plat-FRM-Pdf": (3040, 1480, 1440, 900, "plat-formularios"),
         "FRM-Editor-Reglas-Plantilla": (4560, 6160, 1440, 1400, "formularios"), "M-FRM-Reglas-Plantilla": (940, 7180, 390, 844, "formularios")}
ALTO_VISTA = 1480
CON_ESTADOS_NUEVOS = ["FRM-Plantilla", "FRM-Plantilla-Usar", "M-FRM-Plantilla", "Plat-FRM-Publicar"]


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    marca = "" if EJEMPLOS_APROBADOS else A.PARA_APROBAR
    for n, (x, y, w, h, pagina) in LUGAR.items():
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": y, "w": w, "h": h, "title": TITULOS[n] + marca, "page": pagina, "is_interactive": True}
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    for n in ("FRM-Plantilla", "FRM-Plantilla-Usar"):
        c["boards"][f"{n}.dc.html"]["h"] = ALTO_VISTA
    for n in CON_ESTADOS_NUEVOS:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(A.PARA_APROBAR, "") + marca
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    return c


if __name__ == "__main__":
    tableros = {"Plat-FRM-Plantilla-Reglas": plat_reglas(), "Plat-FRM-Pdf": plat_pdf(), "FRM-Editor-Reglas-Plantilla": org_reglas(),
                "M-FRM-Reglas-Plantilla": tel_reglas_plantilla()}
    for nombre, t in tableros.items():
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    c = registrar()
    print("tableros", list(tableros))
    print("respuestas en el panel", P.panel_en_los_demas(c))
    print("por aprobar en el panel", R.panel_en_los_demas(c))
    print("faltan en el panel", AS.panel_en_los_demas(c))
    print("vista de la plantilla", poner_en_la_vista("FRM-Plantilla", ALTO_VISTA), poner_en_la_vista("FRM-Plantilla-Usar", ALTO_VISTA))
    print("teléfono", poner_en_el_telefono())
    print("al publicar", regla_al_publicar())
