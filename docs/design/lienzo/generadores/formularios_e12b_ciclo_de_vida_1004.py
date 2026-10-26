"""La Etapa 12b, ciclo de vida: dar de baja, reactivar, eliminar y copiar (resumen 17-ciclo-de-vida.md del back y anexo D
del traspaso 2: BA1-A a BA5, más FRM-Copiar de la decisión 74). Con nuestras piezas y la decisión 43:
- «Diseñar formularios» (FRM-Listado, rehecho): «Activos | Dados de baja» como en Formularios (MF1), «Estado ▾» dentro de
  Activos, la columna Respuestas y un ⋮ por fila (no los íconos de allá: Criterio · Menús) con Copiar, Dar de baja,
  Reactivar y Eliminar según el estado y el permiso. Con respuestas, Eliminar no aparece; lo que no se puede usar queda
  grisado, con el motivo en su tooltip; sin el permiso, no se dibuja.
- FRM-Editor-Baja: el editor de un dado de baja, con «Reactivar» en el lugar de publicar (BA2). Con la regla de avisos del
  25/10, sin cartel: el estado va en la banda (y lo que falló en WhatsApp, a su lado), y quién, cuándo, qué deja de pasar
  y qué pasa en WhatsApp, en el aviso importante de su ⓘ; en el teléfono, en la hoja del ⓘ de la barra.
- FRM-Dar-De-Baja: el diálogo, con qué deja de pasar, los envíos abiertos y WhatsApp, y lo que se conserva (BA3).
- FRM-Reactivar-Eliminar: los dos diálogos (BA4).
- FRM-Copiar: copiar un formulario, con el nombre y el prefijo propuesto; copia solo el borrador (74).
- Los teléfonos: M-FRM-Listado (rehecho) y M-FRM-Editor-Baja. El circuito (BA5) va como recorrido de la guía.

BA6 (una sugerencia hacia un dado de baja) se dibuja con la E18, que redibuja el editor de sugerencias.
Corre al final de todo, después de `formularios_e12_sin_idioma_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_catalogos_1004 as C  # noqa: E402
import formularios_e12_sin_idioma_1004 as E  # noqa: E402
import gestion_formularios_1004 as G  # noqa: E402
import menus_y_solo_lectura_1004 as M  # noqa: E402

PROJ = A.PROJ
APROBADO = True  # el usuario la aprobó el 25/10 («publica y commitea», versión 140)
PARA_APROBAR = " · para aprobar"
svg, MAS, CHEV, ALERTA, TILDE, RELOJ, DOC = A.svg, A.MAS, A.CHEV, A.ALERTA, A.TILDE, A.RELOJ, A.DOC
IC = M.IC
GIRA = E.GIRA
CHAT = svg('<path d="M4 19.5 5.3 16A8 8 0 1 1 8.2 19z"/>', 16)
ASIST = svg('<path d="M12 3.5 13.6 8l4.4 1.6-4.4 1.6L12 15.7l-1.6-4.5L6 9.6 10.4 8z"/><path d="M18.5 15.5 19 17l1.5.5-1.5.5-.5 1.5-.5-1.5L16.5 17l1.5-.5z"/>', 16)
SUGIERE = svg('<path d="M5 12h11"/><path d="m12 7 5 5-5 5"/>', 16)
NO_PUBLICA = "Se está publicando la versión 4."

CSS_E12B = """.fm-seg { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); align-self: flex-start; width: 320px; flex-shrink: 0; }
.fm-seg button { height: 30px; border: 0; border-radius: 8px; background: transparent; font: inherit; font-size: 13px; font-weight: 600; color: var(--t2); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.fm-seg button.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.fm-seg .c { font-weight: 500; color: var(--t3); }
.w-th.cv, .w-tr.cv { grid-template-columns: minmax(170px, 1.3fr) 84px minmax(190px, 1.2fr) 96px 200px 40px; }
.w-tr.cv { position: relative; min-height: 52px; }
.w-tr.cv a.n { color: var(--t1); text-decoration: none; font-weight: 500; }
.w-tr.cv .est2 { display: flex; align-items: center; gap: 2px; }
.w-tr.cv .num { font-variant-numeric: tabular-nums; text-align: left; justify-self: start; }
.w-tr.cv .f-menu { position: absolute; right: 12px; top: calc(100% - 8px); left: auto; z-index: 25; min-width: 220px; }
.w-body .w-caja:has(.f-menu) { overflow: visible; }
.w-est.baja { color: var(--t2); }
.w-est.baja::before { background: var(--t3); }
.w-est.pend::before { background: oklch(0.72 0.15 70); }
.e-sup .lin2 { font-size: 13px; }
.p-sec2 { display: flex; flex-direction: column; gap: 8px; }
.cp-campos { display: grid; grid-template-columns: minmax(0, 1fr) 180px; gap: 14px 16px; }
.cp-campos .err2 { font-size: 12.5px; color: var(--peligro); }
.cp-campos .ct.mal { border-color: var(--peligro); }
"""


def r(t, a, b, n=1):
    assert t.count(a) == n, (a[:120], t.count(a))
    return t.replace(a, b)


def mi(icono, texto, href=None, peligro=False, off=None, tip=False):
    """Una opción de un ⋮ de la compu, con su ícono; apagada, solo grisada y con el motivo en su tooltip (43)."""
    clase = "f-mi" + (" pel" if peligro else "") + (" off" if off else "")
    cuerpo = f"{IC[icono]} {texto}" + (f'<span class="e-tip" role="tooltip">{off}</span>' if off and tip else "")
    if off:
        return f'<span class="{clase}" role="menuitem" aria-disabled="true" title="{off}">{cuerpo}</span>'
    if href:
        return f'<a class="{clase}" role="menuitem" href="{href}">{cuerpo}</a>'
    return f'<span class="{clase}" role="menuitem">{cuerpo}</span>'


SEP = '<span class="f-sep" role="separator"></span>'


# ================================================================ Diseñar formularios (BA1-A)
# (nombre, preguntas, clase, estado, ⓘ, respuestas, último cambio, grupo, clave)
FORMS = [
    ("Visita a cliente", 7, "{{estVisClase}}", "{{estVis}}", "", "24", "08/10/2026 · Lucía Fernández", "pub", "Vis"),
    ("Entrega de pedido", 5, "", "Publicado · versión 1", "", "48", "02/10/2026 · Tomás Acosta", "pub", "Ent"),
    ("Control de vehículo", 7, "mal", "No se pudo publicar", "La versión 2 publicada sigue activa.", "31", "12/10/2026 · Lucía Fernández", "pub", "Con"),
    ("Reclamo", 4, "off", "Borrador", "", "0", "14/10/2026 · —", "bor", "Rec"),
    ("Relevamiento de obra", 6, "baja", "Dado de baja · versión 2", "Se deprecan en WhatsApp cuando venzan los 2 envíos abiertos.", "12",
     "09/10/2026 · Lucía Fernández", "baja", "Rel"),
]
MENUS = {
    "Vis": mi("duplicar", "Copiar", "FRM-Copiar.dc.html") + mi("cancelar", "Dar de baja", "FRM-Dar-De-Baja.dc.html"),
    "VisPub": mi("duplicar", "Copiar", "FRM-Copiar.dc.html") + mi("cancelar", "Dar de baja", off=NO_PUBLICA, tip=True),
    "VisSoloPublica": mi("cancelar", "Dar de baja", "FRM-Dar-De-Baja.dc.html"),
    "Rec": mi("duplicar", "Copiar", "FRM-Copiar.dc.html") + SEP + mi("borrar", "Eliminar", "FRM-Reactivar-Eliminar.dc.html", peligro=True),
    "Rel": mi("reenviar", "Reactivar", "FRM-Reactivar-Eliminar.dc.html") + mi("duplicar", "Copiar", "FRM-Copiar.dc.html"),
}
ESTADOS_LISTADO = ["Activos", "Estado: menú", "Publicados", "Borradores", "Dados de baja", "Acciones de un publicado", "Acciones de un borrador",
                   "Acciones de un dado de baja", "Acciones mientras se publica", "Solo puede publicar", "Solo lectura", "Nuevo formulario: menú",
                   "Sin coincidencias", "Cargando", "Vacío", "No se pudo cargar"]


def fila(n, preg, clase, estado, info, resp, cambio, grupo, k):
    i = F.info(info) if info else ""
    menus = "".join(f'<sc-if value="{{{{m{clave}}}}}" hint-placeholder-val="{{{{no}}}}"><div class="f-menu" role="menu" aria-label="Acciones de {n}">{MENUS[clave]}</div></sc-if>'
                    for clave in MENUS if clave.startswith(k))
    boton = (f'<sc-if value="{{{{acc{k}}}}}" hint-placeholder-val="{{{{si}}}}"><button type="button" class="ib" aria-label="Acciones de {n}" '
             f'aria-haspopup="menu">{A.KEBAB}</button></sc-if>')
    return (f'<sc-if value="{{{{r{k}}}}}" hint-placeholder-val="{{{{{"no" if grupo == "baja" else "si"}}}}}"><div class="w-tr cv">'
            f'<span><a class="n" href="{"FRM-Editor-Baja.dc.html" if grupo == "baja" else "FRM-Editor.dc.html"}">{n}</a></span><span>{preg}</span>'
            f'<span class="est2"><span class="w-est {clase}">{estado}</span>{i}</span><span class="num">{resp}</span><span>{cambio}</span>'
            f'<span>{boton}</span>{menus}</div></sc-if>')


def cuerpo_listado():
    seg = ('<sc-if value="{{conSeg}}" hint-placeholder-val="{{si}}"><div class="fm-seg" role="radiogroup" aria-label="Ver">'
           '<button type="button" role="radio" aria-checked="{{selAct}}" class="{{segAct}}">Activos <span class="c">4</span></button>'
           '<button type="button" role="radio" aria-checked="{{selBaja}}" class="{{segBaja}}">Dados de baja <span class="c">1</span></button></div></sc-if>')
    caja = ('<sc-if value="{{conFiltros}}" hint-placeholder-val="{{si}}"><div class="w-caja o-fb">'
            f'<span class="w-bus {{{{busClase}}}}">{F.BUSCAR} {{{{busqueda}}}}</span>'
            '<sc-if value="{{conEstado}}" hint-placeholder-val="{{si}}">'
            + F.filtro("Estado", [("t", "Todos los estados", 4), ("p", "Publicados", 3), ("b", "Borradores", 1)], "est") + "</sc-if>"
            '<sc-if value="{{hayFiltro}}" hint-placeholder-val="{{no}}"><button type="button" class="cb cb-enl">Limpiar filtros</button></sc-if>'
            '<span class="tot">{{total}}</span></div></sc-if>')
    tabla = ('<div class="w-caja"><div class="w-th cv"><span>Formulario</span><span>Preguntas</span><span>En WhatsApp</span><span>Respuestas</span>'
             '<span>Último cambio</span><span class="sr">Acciones</span></div>'
             '<sc-if value="{{conFilas}}" hint-placeholder-val="{{si}}">' + "".join(fila(*f) for f in FORMS)
             + '<div class="w-pie"><span>{{rango}}</span><span>10 por página · Página 1 de 1</span></div></sc-if>'
             '<sc-if value="{{cargando}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo izq"><div class="esq"><span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span></div></div></sc-if>'
             '<sc-if value="{{vacio}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Todavía no hay formularios.</b></div></sc-if>'
             '<sc-if value="{{sinCoincidencias}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>Ningún formulario coincide con los filtros.</b>'
             '<button type="button" class="cb cb-enl">Limpiar filtros</button></div></sc-if>'
             '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><div class="f-cuerpo"><b>No pudimos cargar los formularios.</b><button type="button" class="cb cb-sec">Reintentar</button></div></sc-if></div>')
    return '<div class="w-body">' + seg + caja + tabla + "</div>"


def acciones_listado():
    menu = ('<sc-if value="{{menuNuevo}}" hint-placeholder-val="{{no}}"><div class="f-menu" role="menu" aria-label="Nuevo formulario">'
            f'<a class="f-mi" role="menuitem" href="FRM-Editor.dc.html">{F.ICONO} Desde cero</a>'
            f'<a class="f-mi" role="menuitem" href="FRM-Biblioteca.dc.html">{F.LISTA} Desde una plantilla</a></div></sc-if>')
    return ('<sc-if value="{{conNuevo}}" hint-placeholder-val="{{si}}">'
            f'<a class="cb cb-pri" href="#" aria-haspopup="menu" aria-expanded="{{{{expNuevo}}}}">{MAS} Nuevo formulario {CHEV}</a>' + menu + "</sc-if>")


def js_listado(vista):
    """vista: el estado de la lista que se ve (en FRM-Listado es el mismo; en los diálogos, el de abajo)."""
    return f"""    const v = {vista};
    const baja = v === 'Dados de baja' || v === 'Acciones de un dado de baja';
    const pub = v === 'Publicados', bor = v === 'Borradores', soloPub = v === 'Solo puede publicar', lectura = v === 'Solo lectura';
    const lista = ['Activos', 'Estado: menú', 'Publicados', 'Borradores', 'Dados de baja', 'Acciones de un publicado', 'Acciones de un borrador',
      'Acciones de un dado de baja', 'Acciones mientras se publica', 'Solo puede publicar', 'Solo lectura', 'Nuevo formulario: menú'].includes(v);
    const filas = baja ? 1 : pub ? 3 : bor ? 1 : 4;
    return {{
      si: true, no: false,
      resumen: v === 'Vacío' ? 'Sin formularios' : v === 'Cargando' || v === 'No se pudo cargar' ? '' : '4 activos · 1 dado de baja',
      conNuevo: !soloPub && !lectura, menuNuevo: v === 'Nuevo formulario: menú', expNuevo: v === 'Nuevo formulario: menú' ? 'true' : 'false',
      conSeg: lista || v === 'Sin coincidencias', selAct: baja ? 'false' : 'true', selBaja: baja ? 'true' : 'false', segAct: baja ? '' : 'on', segBaja: baja ? 'on' : '',
      conFiltros: v !== 'Vacío', conEstado: !baja, busqueda: v === 'Sin coincidencias' ? 'inspección' : 'Buscar por nombre', busClase: v === 'Sin coincidencias' ? 'lleno' : '',
      estTexto: pub ? 'Estado: Publicados' : bor ? 'Estado: Borradores' : 'Estado', estClase: pub || bor ? 'con' : '', estMenu: v === 'Estado: menú', estAlternar: () => {{}},
      estOn_t: pub || bor ? '' : 'on', estOn_p: pub ? 'on' : '', estOn_b: bor ? 'on' : '', estC_t: '4', estC_p: '3', estC_b: '1',
      estElegir_t: () => {{}}, estElegir_p: () => {{}}, estElegir_b: () => {{}},
      hayFiltro: pub || bor || v === 'Sin coincidencias', total: v === 'Sin coincidencias' ? '0 formularios' : filas === 1 ? '1 formulario' : filas + ' formularios',
      conFilas: lista, rango: filas === 1 ? '1 de 1' : '1–' + filas + ' de ' + filas,
      rVis: lista && !baja && !bor, rEnt: lista && !baja && !bor, rCon: lista && !baja && !bor, rRec: lista && !baja && !pub, rRel: baja,
      estVis: v === 'Acciones mientras se publica' ? 'Publicando la versión 4' : 'Publicado · versión 3', estVisClase: v === 'Acciones mientras se publica' ? 'pend' : '',
      accVis: !lectura, accEnt: !lectura, accCon: !lectura, accRec: !lectura && !soloPub, accRel: !lectura,
      mVis: v === 'Acciones de un publicado', mVisPub: v === 'Acciones mientras se publica', mVisSoloPublica: soloPub,
      mRec: v === 'Acciones de un borrador', mRel: v === 'Acciones de un dado de baja',
      cargando: v === 'Cargando', vacio: v === 'Vacío', sinCoincidencias: v === 'Sin coincidencias', error: v === 'No se pudo cargar',
    }};"""


def pagina_listado(nombre, estados, vista, capas=None, css=""):
    t = A.pagina_ab(nombre, "Inicio / Formularios / Diseñar formularios", F.banda("Diseñar formularios", "{{resumen}}", acciones_listado()), cuerpo_listado(),
                    css=F.CSS_LISTADO + F.CSS_FILTRO + F.CSS_ESTADOS + A.CSS_AB + A.CSS_LISTADO + E.CSS_E12 + CSS_E12B + css, estados=("estado", estados), js=js_listado(vista))
    if capas:
        over = "".join(f'<sc-if value="{{{{c{estados.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
        t = F.con_dialogo(t, over, F.CSS_PUBLICAR + F.CSS_GRILLA + A.CSS_PUB)
        flags = "".join(f"      c{i}: e === {json.dumps(k, ensure_ascii=False)},\n" for i, k in enumerate(estados))
        t = r(t, "      si: true, no: false,\n      resumen:", "      si: true, no: false,\n" + flags + "      resumen:")
    return t


def listado():
    return pagina_listado("Diseñar formularios · /org/formularios", ESTADOS_LISTADO, "e")


# ================================================================ FRM-Copiar (74)
ESTADOS_COPIAR = ["Copiar", "Falta el nombre", "Prefijo ocupado", "Copiando"]


def dlg_copiar(modo="normal"):
    nombre = ('<div class="ct mal ph"></div><span class="err2" role="alert">Completá este dato.</span>' if modo == "sin_nombre"
              else '<div class="ct">Visita a cliente (copia)</div>')
    pref = ('<div class="ct mal">VIS</div><span class="err2" role="alert">Ya hay un formulario con ese prefijo. Elegí otro.</span>' if modo == "ocupado"
            else '<div class="ct">VIS2</div>')
    cuerpo = ('<div class="cp-campos">'
              f'<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span>{nombre}</div>'
              f'<div class="w-cmp"><span class="rt">Prefijo de numeración <span class="req">*</span>{F.info("Las respuestas se numeran VIS2-000001. Se puede cambiar hasta publicar por primera vez.")}</span>{pref}</div>'
              "</div>")
    g = modo == "copiando"
    d = " disabled" if g else ""
    pie = f'<button type="button" class="cb cb-sec"{d}>Cancelar</button><button type="button" class="cb cb-pri"{d}>{GIRA if g else ""}Copiar</button>'
    t = F.dialogo("Copiar «Visita a cliente»", cuerpo, pie)
    t = t.replace('class="w-dlg"', 'class="w-dlg" style="width: 560px;"', 1)
    return t.replace("<span>Copiar «Visita a cliente»</span>",
                     "<span>Copiar «Visita a cliente» " + F.info("Se copia el borrador, con sus preguntas, y queda en borrador. No se copian versiones ni respuestas.") + "</span>", 1)


def copiar():
    capas = {"Copiar": dlg_copiar(), "Falta el nombre": dlg_copiar("sin_nombre"), "Prefijo ocupado": dlg_copiar("ocupado"), "Copiando": dlg_copiar("copiando")}
    return pagina_listado("Copiar un formulario", ESTADOS_COPIAR, "'Activos'", capas)


# ================================================================ FRM-Reactivar-Eliminar (BA4)
ESTADOS_RE = ["Reactivar", "Reactivar con cambios", "Reactivar con algo que corregir", "Reactivando", "Eliminar un borrador", "Eliminando"]


def dlg_reactivar(modo="normal"):
    card = A.card
    if modo == "corregir":
        cuerpo = ('<span class="p-cap">Antes hay que resolver</span><div class="p-prob"><span class="mal">' + ALERTA + '</span><span class="tx">'
                  '<b>Motivo de la demora · opción «Falta de materiales en el depósito central»</b><span>Es demasiado larga para WhatsApp.</span></span>'
                  '<a href="FRM-Editor-Baja.dc.html">Ir a la pregunta</a></div>')
    else:
        cambia = (card(DOC, "Cambiada: Motivo de la demora", "Suma la opción «Lluvia».") if modo == "cambios"
                  else card(DOC, "Sin cambios respecto de la versión 2", "6 preguntas: Obra, Fecha del relevamiento, ¿Hay demoras?, Avance de la obra, Motivo de la demora y Observaciones"))
        cuerpo = ('<span class="p-cap">Qué se publica: la versión 3</span>' + cambia + '<span class="p-cap">Qué va a pasar</span>'
                  + card(TILDE, "Vuelve a mandarse desde el chat", "Cuando WhatsApp apruebe la versión 3; el asistente también lo vuelve a ofrecer.")
                  + card(TILDE, "La numeración sigue", "La próxima respuesta es REL-000013."))
    g = modo == "trabajando"
    d = " disabled" if g or modo == "corregir" else ""
    pie = (f'<button type="button" class="cb cb-sec"{" disabled" if g else ""}>Cancelar</button>'
           f'<button type="button" class="cb cb-pri"{d}>{GIRA if g else ""}Reactivar</button>')
    return A.dlg_publicar("Reactivar «Relevamiento de obra»", cuerpo, pie)


def dlg_eliminar(trabajando=False):
    d = " disabled" if trabajando else ""
    pie = (f'<button type="button" class="cb cb-sec"{d}>Cancelar</button>'
           f'<button type="button" class="cb cb-pel lleno"{d}>{GIRA if trabajando else ""}Eliminar</button>')
    return F.dialogo("¿Eliminar «Reclamo»?", '<p class="d-tx">Desaparece de Diseñar formularios. El prefijo REC queda reservado.</p>', pie)


def reactivar_eliminar():
    capas = {"Reactivar": dlg_reactivar(), "Reactivar con cambios": dlg_reactivar("cambios"), "Reactivar con algo que corregir": dlg_reactivar("corregir"),
             "Reactivando": dlg_reactivar("trabajando"), "Eliminar un borrador": dlg_eliminar(), "Eliminando": dlg_eliminar(True)}
    vista = "(['Eliminar un borrador', 'Eliminando'].includes(e) ? 'Activos' : 'Dados de baja')"
    return pagina_listado("Reactivar y eliminar", ESTADOS_RE, vista, capas)


# ================================================================ FRM-Dar-De-Baja (BA3)
ESTADOS_BAJA = ["Con envíos abiertos", "Sin envíos abiertos", "Mientras se da de baja", "No se pudo"]


def dlg_baja(envios=True, trabajando=False, error=False):
    card = A.card
    deja = (card(CHAT, "No se manda más desde el chat", "Sale de «Enviar formulario».")
            + card(ASIST, "El asistente no lo ofrece", "Si alguien lo pide, se anota en «Formularios que faltan».")
            + (card(SUGIERE, "Deja de ofrecerse 1 sugerencia", "«Control de vehículo» ya no sugiere Visita a cliente.") if envios else ""))
    wa = ((card(RELOJ, "2 envíos abiertos", "Se pueden responder hasta que vencen. El último vence el 25/10/2026 a las 18:40.")
           + A.aviso("En WhatsApp no se deshace: cuando venzan, se deprecan los Flows de sus 3 versiones."))
          if envios else A.aviso("En WhatsApp no se deshace: se deprecan ahora los Flows de sus 3 versiones."))
    conserva = (card(TILDE, "Las 24 respuestas, con sus fotos y documentos", "Siguen en la planilla y en el Excel.")
                + card(TILDE, "Los PDF y las aprobaciones", "Las 3 que esperan decisión se pueden aprobar o rechazar."))
    err = A.aviso("No pudimos darlo de baja. No cambió nada.", "mal") if error else ""
    cuerpo = (err + '<span class="p-cap">Qué deja de pasar</span>' + deja + '<span class="p-cap">Envíos abiertos y WhatsApp</span>' + wa
              + '<span class="p-cap">Lo que se conserva</span>' + conserva)
    d = " disabled" if trabajando else ""
    pie = f'<button type="button" class="cb cb-sec"{d}>Cancelar</button><button type="button" class="cb cb-pri"{d}>{GIRA if trabajando else ""}Dar de baja</button>'
    return A.dlg_publicar("Dar de baja «Visita a cliente»", cuerpo, pie)


def dar_de_baja():
    base = (E.banda("Visita a cliente", E.EST_PUB, E.acc("limpio"), E.VOL), E.cuerpo_editor(abierta=None, modo="fijo"))
    V = {e: base for e in ESTADOS_BAJA}
    capas = {"Con envíos abiertos": dlg_baja(), "Sin envíos abiertos": dlg_baja(envios=False), "Mientras se da de baja": dlg_baja(trabajando=True),
             "No se pudo": dlg_baja(error=True)}
    return A.pagina_editor(V, capas, ESTADOS_BAJA, "Dar de baja un formulario", E.CSS_E12 + CSS_E12B)


# ================================================================ FRM-Editor-Baja (BA2)
PREG_REL = [("Obra", "Texto corto", True, None), ("Fecha del relevamiento", "Fecha", False, None), ("¿Hay demoras?", "Sí o no", False, None),
            ("Avance de la obra", "Número · 0 decimales", False, None), ("Motivo de la demora", "Elegir una · 4 opciones", False, None),
            ("Observaciones", "Texto largo, hasta 600 caracteres", False, None)]
ESTADOS_EB = ["Dado de baja", "Ya deprecado", "Sin confirmar en WhatsApp", "No se pudo deprecar", "El detalle", "Acciones del formulario", "Con cambios"]
QUIEN = "Dado de baja por Lucía Fernández el 09/10/2026 a las 10:12."
QUE_PASA = "No se manda desde el chat ni lo ofrece el asistente. Las respuestas, los PDF y las aprobaciones se conservan."


def vista_rel():
    pv = F.vista_previa()
    pv = re.sub(r'<div class="pv-tit">.*?</div>', '<div class="pv-tit"><span class="pv-tit2">Así lo ve quien lo recibe</span></div>', pv, count=1, flags=re.S)
    for a, b in [(">Visita a cliente<", ">Relevamiento de obra<"), (">Cliente<", ">Obra<"), ("Fecha de la visita (opcional)", "Fecha del relevamiento (opcional)"),
                 ("¿Se concretó la venta? (opcional)", "¿Hay demoras? (opcional)"), ("Monto estimado (opcional)", "Avance de la obra (opcional)"),
                 ('<span class="pv-ay">Usá punto para los decimales</span>', ""), ("Motivo (opcional)", "Motivo de la demora (opcional)")]:
        assert a in pv, a
        pv = pv.replace(a, b, 1)
    return pv


def cuerpo_rel(sup):
    viejas = A.PREGUNTAS
    A.PREGUNTAS = PREG_REL
    try:
        preguntas = E.caja_preguntas(abierta=None)
    finally:
        A.PREGUNTAS = viejas
    return ('<div class="w-body">' + sup + '<div class="f-cols"><div class="f-pila">'
            + E.caja_formulario(nombre="Relevamiento de obra", prefijo="REL", modo="fijo") + preguntas + "</div>" + vista_rel() + "</div></div>")


ABIERTOS = "Se deprecan cuando venzan los 2 envíos abiertos. El último vence el 10/10/2026 a las 18:40."


def detalle(whatsapp=ABIERTOS):
    """Lo que antes iba en el cartel (regla de avisos del 25/10): quién, cuándo, qué deja de pasar y WhatsApp, en el aviso importante del ⓘ."""
    filas = [("Lo dio de baja", "Lucía Fernández"), ("Cuándo", "09/10/2026, 10:12"), ("Deja de", "Mandarse desde el chat y ofrecerse en el asistente"),
             ("Se conserva", "Las respuestas, los PDF y las aprobaciones"), ("En WhatsApp", whatsapp)]
    return "".join(f'<span class="k">{k}</span><span>{v}</span>' for k, v in filas)


def dlg_detalle():
    return F.dialogo("Relevamiento de obra · dado de baja", f'<div class="g-det">{detalle()}</div>', '<button type="button" class="cb cb-sec">Cerrar</button>')


def acc_baja(cambios=False, menu=False):
    d = "" if cambios else " disabled"
    a = f'<button type="button" class="cb cb-sec"{d}>Descartar</button><button type="button" class="cb cb-sec"{d}>Guardar cambios</button>'
    if cambios:
        a += f'<button type="button" class="cb cb-pri" aria-disabled="true" title="{E.MOTIVO_GUARDAR}">Reactivar</button>'
    else:
        a += '<a class="cb cb-pri" href="FRM-Reactivar-Eliminar.dc.html">Reactivar</a>'
    return a + E.kebab(menu, "Relevamiento de obra", mi("duplicar", "Copiar", "FRM-Copiar.dc.html"))


def editor_baja():
    base = '<span class="w-est baja">Dado de baja · versión 2</span>'
    ver = E.info_btn("Quién lo dio de baja, cuándo y qué pasa en WhatsApp")
    sin_conf = base + '<span class="w-est pend">Sin confirmar en WhatsApp</span>' + F.info("Lo seguimos consultando, sin pedirlo de nuevo.")
    fallo = base + '<span class="w-est mal">No se pudo deprecar en WhatsApp</span>' + F.info("WhatsApp lo rechazó después de cuatro intentos. No frena nada del formulario.")
    b = lambda est=base + ver, **k: E.banda("Relevamiento de obra", est, acc_baja(**k), E.VOL)
    cuerpo = cuerpo_rel("")
    V = {
        "Dado de baja": (b(), cuerpo),
        "Ya deprecado": (b(), cuerpo),
        "Sin confirmar en WhatsApp": (b(sin_conf), cuerpo),
        "No se pudo deprecar": (b(fallo), cuerpo),
        "El detalle": (b(), cuerpo),
        "Acciones del formulario": (b(menu=True), cuerpo),
        "Con cambios": (b(cambios=True), cuerpo),
    }
    t = A.pagina_editor(V, {"El detalle": dlg_detalle()}, ESTADOS_EB, "Editor de un formulario dado de baja", E.CSS_E12 + CSS_E12B
                        + ".f-bnd-est .w-est + .w-est { margin-left: 14px; }\n")
    return r(t, "Diseñar formularios / Visita a cliente", "Diseñar formularios / Relevamiento de obra")


# ================================================================ Los teléfonos
E_TLIST = ["Activos", "Filtros", "Dados de baja", "Acciones de un publicado", "Acciones de un borrador", "Acciones de un dado de baja",
           "Copiar", "Dar de baja", "Reactivar", "Eliminar", "Nuevo formulario: elegir", "Cargando", "No se pudo cargar"]
T_FORMS = [("Visita a cliente", "08/10/2026", "7 preguntas · 24 respuestas", "", "Publicado · versión 3", ""),
           ("Entrega de pedido", "02/10/2026", "5 preguntas · 48 respuestas", "", "Publicado · versión 1", ""),
           ("Control de vehículo", "12/10/2026", "7 preguntas · 31 respuestas", "mal", "No se pudo publicar", "La versión 2 publicada sigue activa."),
           ("Reclamo", "14/10/2026", "4 preguntas · sin respuestas", "off", "Borrador", "")]
T_BAJA = [("Relevamiento de obra", "09/10/2026", "6 preguntas · 12 respuestas", "baja", "Dado de baja · versión 2", "Se deprecan en WhatsApp cuando venzan los 2 envíos abiertos.")]


def t_fila(n, fecha, l2, clase, estado, info):
    i = f'<button type="button" class="ap-i" aria-label="Más información" title="{info}">{F.TINFO}</button>' if info else ""
    return (f'<div class="ap-fila"><div class="tx"><span class="l1">{n}<span>{fecha}</span></span><span class="l2">{l2}</span>'
            f'<span class="l3"><span class="w-est {clase}">{estado}</span>{i}</span></div>'
            f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>')


def tel_listado():
    bar = C.t_bar("Diseñar formularios", "Gestión de formularios", "M-WA-Menu.dc.html",
                  f'<button type="button" class="ap-ib" aria-label="Buscar">{F.TLUPA}</button><button type="button" class="ap-ib" aria-label="Filtros">{F.TFILTROS}</button>')
    fab = f'<a class="ap-fab" aria-label="Nuevo formulario" href="#">{F.TFAB}</a>'

    def seg(baja):
        a, b = ("", "on") if baja else ("on", "")
        return (f'<div class="ap-seg" role="radiogroup" aria-label="Ver"><span class="{a}" role="radio" aria-checked="{"false" if baja else "true"}">Activos <span class="c">4</span></span>'
                f'<span class="{b}" role="radio" aria-checked="{"true" if baja else "false"}">Dados de baja <span class="c">1</span></span></div>')
    activos = bar + seg(False) + '<div class="ap-cuerpo">' + "".join(t_fila(*f) for f in T_FORMS) + "</div>" + fab
    bajas = bar + seg(True) + '<div class="ap-cuerpo">' + "".join(t_fila(*f) for f in T_BAJA) + "</div>" + fab
    esq = bar + seg(False) + '<div class="ap-cuerpo"><div class="ap-esq"><span style="width: 80%;"></span><span style="width: 60%;"></span><span style="width: 72%;"></span></div></div>'
    error = bar + seg(False) + '<div class="ap-cuerpo"><div class="ap-vacio">No pudimos cargar los formularios.<button type="button" class="cb cb-sec">Reintentar</button></div></div>'
    cuerpo = {e: (bajas if e in ("Dados de baja", "Acciones de un dado de baja", "Reactivar") else esq if e == "Cargando" else error if e == "No se pudo cargar" else activos)
              for e in E_TLIST}
    filtros = ('<div class="ap-acciones"><span role="menuitemradio" aria-checked="true">Todos los estados <span class="c">4</span></span>'
               '<span role="menuitemradio" aria-checked="false">Publicados <span class="c">3</span></span>'
               '<span role="menuitemradio" aria-checked="false">Borradores <span class="c">1</span></span></div>')
    copiar_h = (F.tcampo("Nombre", "Visita a cliente (copia)", req=True) + F.tcampo("Prefijo de numeración", "VIS2", req=True))
    baja_h = ('<div class="p-tit2">Qué deja de pasar</div><span class="t-lin">' + CHAT + ' No se manda más desde el chat.</span>'
              '<span class="t-lin">' + ASIST + ' El asistente no lo ofrece.</span><span class="t-lin">' + SUGIERE + ' «Control de vehículo» ya no lo sugiere.</span>'
              '<div class="p-tit2">Envíos abiertos y WhatsApp</div><span class="t-lin">' + RELOJ + ' 2 envíos abiertos: el último vence el 25/10/2026 a las 18:40.</span>'
              '<div class="t-aviso">' + ALERTA + '<span>En WhatsApp no se deshace: cuando venzan, se deprecan los Flows de sus 3 versiones.</span></div>'
              '<div class="p-tit2">Lo que se conserva</div><span class="t-lin">' + TILDE + ' Las 24 respuestas, con sus fotos y documentos.</span>'
              '<span class="t-lin">' + TILDE + ' Los PDF y las aprobaciones.</span>')
    reactivar_h = ('<div class="p-tit2">Qué se publica: la versión 3</div><span class="t-lin">' + DOC + ' Sin cambios respecto de la versión 2.</span>'
                   '<span class="t-lin">' + TILDE + ' Vuelve a mandarse desde el chat cuando WhatsApp la apruebe.</span>'
                   '<span class="t-lin">' + TILDE + ' La próxima respuesta es REL-000013.</span>')
    pie2 = lambda b, cls="cb-pri": f'<button type="button" class="cb {cls}">{b}</button><button type="button" class="cb cb-sec">Cancelar</button>'
    capas = {
        "Filtros": F.thoja("Estado", filtros, ""),
        "Acciones de un publicado": M.hoja("Visita a cliente", '<span role="menuitem">Copiar</span><span role="menuitem">Dar de baja</span>'),
        "Acciones de un borrador": M.hoja("Reclamo", '<span role="menuitem">Copiar</span><span class="sep" role="separator"></span><span role="menuitem" class="pel">Eliminar</span>'),
        "Acciones de un dado de baja": M.hoja("Relevamiento de obra", '<span role="menuitem">Reactivar</span><span role="menuitem">Copiar</span>'),
        "Copiar": F.thoja("Copiar «Visita a cliente»", copiar_h, pie2("Copiar")),
        "Dar de baja": F.thoja("Dar de baja «Visita a cliente»", baja_h, pie2("Dar de baja")),
        "Reactivar": F.thoja("Reactivar «Relevamiento de obra»", reactivar_h, pie2("Reactivar")),
        "Eliminar": F.thoja("¿Eliminar «Reclamo»?", '<p class="d-tx">Desaparece de Diseñar formularios. El prefijo REC queda reservado.</p>', pie2("Eliminar", "cb-pel lleno")),
        "Nuevo formulario: elegir": M.hoja("Nuevo formulario", '<a role="menuitem" href="M-FRM-Editor.dc.html">Desde cero</a><a role="menuitem" href="M-FRM-Biblioteca.dc.html">Desde una plantilla</a>'),
    }
    t = C.tel_pagina(cuerpo, E_TLIST, capas, "Diseñar formularios · teléfono", A.CSS_TCHAT_AB + E.CSS_E12 + CSS_E12B + E.CSS_TED_E12)
    return M.css(t, M.CSS_HOJA, "hoja")


E_TEB = ["Dado de baja", "Ya deprecado", "El detalle", "Acciones del formulario", "Reactivar"]


def tel_editor_baja():
    bar = (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Listado.dc.html">{F.TVOLVER}</a>'
           '<div class="tit"><h1>Relevamiento de obra</h1><span class="sub">Dado de baja · versión 2</span></div>'
           f'<button type="button" class="ap-ib" aria-label="Quién lo dio de baja, cuándo y qué pasa en WhatsApp">{F.TINFO}</button>'
           f'<button type="button" class="ap-ib" aria-label="Acciones de Relevamiento de obra">{F.TKEBAB}</button></div>')
    viejas = E.T_PREG
    E.T_PREG = [(n, d.replace("Texto corto", "Texto corto · Obligatoria") if n == "Obra" else d + " · Opcional") for n, d, _o, _x in PREG_REL]
    try:
        base = E.t_cuerpo(nombre="Relevamiento de obra", prefijo="REL")
    finally:
        E.T_PREG = viejas
    fijo = '<div class="ap-fijo"><a class="cb cb-pri full" href="#">Reactivar</a></div>'
    cuerpo = {e: bar + base + fijo for e in E_TEB}
    datos = "".join(f'<div class="ap-det"><span>{k}</span><b>{v}</b></div>'
                    for k, v in [("Lo dio de baja", "Lucía Fernández"), ("Cuándo", "09/10/2026, 10:12"), ("Deja de", "Mandarse desde el chat y ofrecerse en el asistente"),
                                 ("Se conserva", "Las respuestas, los PDF y las aprobaciones"), ("En WhatsApp", "Se deprecan cuando venzan los 2 envíos abiertos.")])
    reactivar_h = ('<div class="p-tit2">Qué se publica: la versión 3</div><span class="t-lin">' + DOC + ' Sin cambios respecto de la versión 2.</span>'
                   '<span class="t-lin">' + TILDE + ' Vuelve a mandarse desde el chat cuando WhatsApp la apruebe.</span>'
                   '<span class="t-lin">' + TILDE + ' La próxima respuesta es REL-000013.</span>')
    capas = {"El detalle": F.thoja("Dado de baja", f'<div class="ap-dets">{datos}</div>', "", sub="Relevamiento de obra · versión 2"),
             "Acciones del formulario": M.hoja("Relevamiento de obra", '<span role="menuitem">Reactivar</span><span role="menuitem">Copiar</span>'),
             "Reactivar": F.thoja("Reactivar «Relevamiento de obra»", reactivar_h, '<button type="button" class="cb cb-pri">Reactivar</button><button type="button" class="cb cb-sec">Cancelar</button>')}
    t = C.tel_pagina(cuerpo, E_TEB, capas, "Editor de un formulario dado de baja · teléfono", A.CSS_TED + A.CSS_TCHAT_AB + E.CSS_E12 + CSS_E12B + E.CSS_TED_E12
                     # el detalle en el teléfono: el rótulo encima del valor (pantallas-y-ui.md), como M-Auditoria-Org
                     + ".ap-det { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-top: 1px solid var(--borde); }\n"
                     ".ap-det:first-child { border-top: 0; }\n.ap-det span { font-size: 13px; color: var(--t3); }\n.ap-det b { font-size: 15.5px; font-weight: 500; }\n")
    return M.css(t, M.CSS_HOJA, "hoja")


# ================================================================ Escritura
NUEVOS = {"FRM-Editor-Baja": (6080, 260, 1440, 1400, "Formularios · editor de un dado de baja"),
          "FRM-Dar-De-Baja": (7600, 260, 1440, 1400, "Formularios · dar de baja"),
          "FRM-Reactivar-Eliminar": (6080, 1780, 1440, 900, "Formularios · reactivar y eliminar"),
          "FRM-Copiar": (7600, 1780, 1440, 900, "Formularios · copiar un formulario"),
          "M-FRM-Editor-Baja": (2820, 2800, 390, 844, "Formularios · editor de un dado de baja · teléfono")}
TABLEROS = ["FRM-Editor", "M-FRM-Editor"] + list(NUEVOS)


def escribir(n, t, alto=None):
    if alto:
        t = t.replace('"$preview":{"width":1440,"height":900}', f'"$preview":{{"width":1440,"height":{alto}}}')
    t = E.post(n, t)
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    for n, (x, y, w, h, titulo) in NUEVOS.items():
        c["boards"].setdefault(f"{n}.dc.html", {"h": h, "is_interactive": True, "page": "formularios", "title": titulo, "w": w, "x": x, "y": y})
    for n in TABLEROS:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Catalogos.dc.html").read_text(encoding="utf-8"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    # la lista y su teléfono, desde la 79: FRM-Formularios y M-FRM-Formularios (formularios_lista_y_ficha_1004.py)
    escribir("FRM-Copiar", copiar())
    escribir("FRM-Reactivar-Eliminar", reactivar_eliminar())
    escribir("FRM-Dar-De-Baja", dar_de_baja(), 1400)
    escribir("FRM-Editor-Baja", editor_baja(), 1400)
    escribir("M-FRM-Editor-Baja", tel_editor_baja())
    registrar()
    print("listo", TABLEROS)
