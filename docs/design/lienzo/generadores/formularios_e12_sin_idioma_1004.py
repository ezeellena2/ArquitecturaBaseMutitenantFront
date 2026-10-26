"""La Etapa 12 redibujada con las decisiones del 2026-10-24 (texto para Diseño de la E12 y §9 de su spec, en el back).

- 35: el contenido no tiene idioma. Sin «Textos en», sin pares en inglés, sin vista previa en dos idiomas ni avisos de
  traducción; el diálogo de enviar no dice en qué idioma le llega.
- 38: «elegir varias» es un tipo de pregunta de la E12 («Fallas», de 1 a 3), con Mínimo y Máximo; la vista previa muestra
  las casillas con «Elegí hasta 3». «Elegir de una lista» pasa a «Elegir una».
- 43: «Guardar cambios» se habilita cuando hay cambios y, mientras trabaja, queda grisado con su mismo texto; «Publicar en
  WhatsApp» queda grisado con cambios sin guardar, con el motivo en su tooltip. Sin «Cambios sin guardar», sin textos al
  lado de los botones, sin «Guardado sin confirmar», «Consultar guardado», «Consultar envío» ni «La comprobación venció».
  El prefijo ya publicado va como la A11. La opción de menú apagada del chat queda solo grisada, con el motivo en su tooltip.
- Avisos (25/10, pantallas-y-ui.md): sin carteles en el cuerpo. El estado de la publicación va en la banda con su ⓘ (los
  pasos de «Publicando» y «Consultar ahora» de «Sin confirmar», en el diálogo que abre); la pregunta que rechazó WhatsApp
  se marca en su lugar; en el teléfono, el estado en la barra y «Publicamos la versión 4» en la franja oscura de abajo.
- 80 (25/10): sin «Envío sin confirmar», «Ya lo revisé» ni «Resolver el envío» en el chat; lo que no se sabe si salió se
  reintenta solo.
- E14 con el orden nuevo (78): CA4, la pregunta de catálogo con «Permitir elegir varias» (mínimo y máximo, «varias, hasta N»
  y las casillas en la vista previa), más de 20 en varias y la presentación propia, con los catálogos de la E12; «Un
  catálogo demasiado grande» al publicar; al mandar, menos que el mínimo y una opción que no entra. Lo que es de otra
  etapa lo separa `formularios_14_formularios_1004.py`.

Rehace FRM-Editor, M-FRM-Editor, FRM-Publicar, FRM-Publicando y los cuatro tableros del chat con las piezas de
`formularios_ab_1004.py`, cambiadas acá, y les vuelve a pasar lo que les suman los generadores de después (el panel de
la E16, las reglas del teléfono, la hoja del ⋮ y el marco de Gestión de formularios). Corre al final de todo, después de
`gestion_formularios_1004.py`. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_ab_reglas_1004 as R  # noqa: E402
import gestion_formularios_1004 as G  # noqa: E402
import menus_y_solo_lectura_1004 as M  # noqa: E402

PROJ = A.PROJ
APROBADO = True  # el usuario la aprobó el 24/10 («Publica y continúa», versión 139)
PARA_APROBAR = " · para aprobar"
svg, MAS, X, CHEV, ALERTA, OK, TILDE, RELOJ, RELOJ14, DOC = A.svg, A.MAS, A.X, A.CHEV, A.ALERTA, A.OK, A.TILDE, A.RELOJ, A.RELOJ14, A.DOC
GIRA = '<span class="girar2" aria-hidden="true"></span>'
ARRIBA = svg('<path d="m6 15 6-6 6 6"/>', 14, "2")
FALLAS = ["Frío", "Ruido", "Puerta", "Luz"]
MOTIVO_GUARDAR = "Primero guardá los cambios."

CSS_E12 = """.cb[aria-disabled="true"] { opacity: 0.55; cursor: default; }
.cb .girar2 { width: 14px; height: 14px; box-sizing: border-box; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; display: inline-block; animation: girar2 0.8s linear infinite; flex-shrink: 0; }
@keyframes girar2 { to { transform: rotate(360deg); } }
.e-tipw { position: relative; display: inline-flex; }
.e-tip { position: absolute; z-index: 30; top: calc(100% + 8px); right: 0; padding: 6px 10px; border-radius: 6px; background: oklch(0.27 0.012 78); color: #fff; font-size: 12.5px; font-weight: 500; white-space: nowrap; box-shadow: 0 6px 18px oklch(0.24 0.014 78 / 0.2); }
.e-tip::before { content: ""; position: absolute; top: -4px; right: 18px; width: 8px; height: 8px; background: inherit; transform: rotate(45deg); }
.pv .tel { height: 700px; }
.tel .pv-ck { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
.tel .pv-ck span { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: oklch(0.3 0.01 150); }
.tel .pv-ck i { width: 14px; height: 14px; box-sizing: border-box; border-radius: 3px; border: 1.5px solid oklch(0.55 0.01 150); }
.q-ed .q-rango { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--t2); }
.q-ed .q-rango .ct { width: 64px; text-align: center; }
.rt .f-i { margin-left: 4px; }
.e-kw { position: relative; display: inline-flex; }
.w-bnd .ac .ib.o-borde { width: 40px; height: 40px; border: 1px solid var(--borde2); border-radius: 10px; box-sizing: border-box; background: #fff; }
.e-kw .f-menu { position: absolute; top: calc(100% + 6px); right: 0; left: auto; z-index: 30; min-width: 220px; }
.f-mi.off { color: var(--t3); cursor: default; }
.f-mi.off svg { color: var(--t3); }
.f-mi { position: relative; }
.f-mi .e-tip { top: 50%; right: calc(100% + 12px); transform: translateY(-50%); }
.f-mi .e-tip::before { top: calc(50% - 4px); right: -4px; }
.e-dif .no .f-i { margin-left: 4px; }
.f-bnd-est { white-space: nowrap; }
.f-bnd-est .f-i { margin-left: 6px; vertical-align: -3px; }
.f-bnd-est .f-i.btn { cursor: pointer; }
.q-it.mal { background: oklch(0.985 0.012 25); }
.ab-chip.mal { border-color: oklch(0.85 0.06 25); background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.q-it.mal .chips .f-i { color: oklch(0.52 0.19 25); display: inline-flex; align-items: center; }
.e-pasos.vert { flex-direction: column; gap: 14px; }
.e-pasos.vert .e-paso { flex: none; }
.f-snack { position: absolute; z-index: 5; left: 12px; right: 12px; bottom: 110px; display: flex; align-items: center; gap: 10px; padding: 13px 14px 13px 16px; border-radius: 14px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14.5px; line-height: 1.4; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.3); }
.f-snack .tx { flex: 1; min-width: 0; }
.f-snack .ok { color: oklch(0.8 0.13 155); display: inline-flex; }
"""
MAL_OBS = "La ayuda es más larga de lo que admite WhatsApp."


def info_btn(texto):
    """El ⓘ que abre el aviso importante (ImportantNotice): el detalle va en el diálogo."""
    return F.info(texto).replace('class="f-i"', 'class="f-i btn"', 1).replace('role="img"', 'role="button"', 1)


# ================================================================ Las piezas del editor, sin idioma
A.caja_textos = lambda ingles=False: ""
A.PREGUNTAS = [
    ("Cliente", "Texto corto", True, None),
    ("Fecha de la visita", "Fecha", False, None),
    ("¿Se concretó la venta?", "Sí o no", False, None),
    ("Monto estimado", "Número · 2 decimales", False, None),
    ("Motivo", "Elegir una · 3 opciones", False, None),
    ("Fallas", "Elegir varias · 4 opciones · de 1 a 3", True, None),
    ("Observaciones", "Texto largo, hasta 600 caracteres", False, None),
]
A.PREGUNTAS_ARCHIVOS = A.PREGUNTAS[:5] + [
    ("Fotos de la visita", "Foto · solo cámara · de 1 a 4", True, None),
    ("Remito firmado", "Documento · PDF, Excel, Word o imagen · hasta 1", False, None),
] + A.PREGUNTAS[5:]


# ================================================================ CA4 · Elegir de un catálogo, con los catálogos de la E12 (78)
A.CATALOGOS_K6 = [
    ("Clientes", "De los contactos de WhatsApp", ""),
    ("Depósitos", "Dado de baja", "off"),
    ("Motivos de visita", "Escritas a mano · 3 opciones activas", "on"),
    ("Proveedores", "Escritas a mano · 1.097 opciones", ""),
    ("Recargo por zona", "Escritas a mano · 6 opciones", ""),
    ("Responsables de obra", "No se puede usar", "off"),
    ("Supervisores", "De los miembros", ""),
]
CSS_CA4 = """.q-cat .rt .q-ver { margin-left: auto; font-weight: 600; color: var(--marca-tx); text-decoration: none; }
.q-cat .rt { display: flex; align-items: center; gap: 4px; }
.q-varias { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.q-varias .q-rango { gap: 8px; }
.q-pres { display: flex; flex-direction: column; gap: 10px; }
.q-pres .ab-seg { align-self: flex-start; }
.q-pres .q-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; }
.q-ed .err2 { font-size: 12.5px; color: var(--peligro); }
"""
CA4 = {  # modo: (pregunta, catálogo, varias (mín, máx) o None, presentación propia, error en el catálogo)
    "elegido": ("Motivo", "Motivos de visita", None, False, ""),
    "abierto": ("Motivo", "Motivos de visita", None, False, ""),
    "varias": ("Motivo", "Motivos de visita", (1, 2), False, ""),
    "mas20": ("Proveedor", "Proveedores", (1, 3), False, "Tiene 1.097 opciones. Con varias, WhatsApp muestra hasta 20."),
    "propia": ("Supervisor", "Supervisores", None, True, ""),
}


def pregunta_catalogo(modo="elegido"):
    """CA4: la pregunta «Elegir de un catálogo», abierta en el lugar, con «Permitir elegir varias» y su mínimo y máximo, y la
    presentación de cada opción (la del catálogo o la suya) en los catálogos de los miembros o de los contactos."""
    if modo == "sin":
        sel = f'<div class="ct sel abierto ph">Elegí un catálogo{CHEV}</div>'
        menu = ('<div class="q-catmn" role="listbox" aria-label="Catálogo"><span class="vacio">Todavía no hay catálogos disponibles.</span>'
                '<a class="cb cb-enl" href="FRM-Catalogos.dc.html" style="align-self: flex-start;">Ir a Catálogos</a></div>')
        n, cat, varias, propia, err = "Motivo", "", None, False, ""
    else:
        n, cat, varias, propia, err = CA4[modo]
        sel = f'<div class="ct sel{" abierto" if modo == "abierto" else ""}{" mal" if err else ""}">{cat}{CHEV}</div>'
        menu = ""
        if modo == "abierto":
            items = "".join(f'<span class="{c}" role="option"{" aria-disabled=" + chr(34) + "true" + chr(34) if c == "off" else ""}>{x}<small>{d}</small></span>'
                            for x, d, c in A.CATALOGOS_K6)
            menu = f'<div class="q-catmn" role="listbox" aria-label="Catálogo"><span class="w-bus bus">{F.BUSCAR} Buscar catálogo</span>{items}</div>'
    destino = "FRM-Catalogo-Filtros.dc.html" if propia else "FRM-Catalogo.dc.html"
    ver = f'<a class="q-ver" href="{destino}">Ver el catálogo</a>' if cat else ""
    tipo_fila = "Elegir de un catálogo" + (f" · {cat}" if cat else "") + (f" · varias, hasta {varias[1]}" if varias else "")
    if varias:
        cuantas = ('<div class="w-cmp ancho"><div class="q-varias"><span class="q-chk"><i>' + TILDE + '</i>Permitir elegir varias</span>'
                   f'<div class="q-rango">Mínimo <div class="ct">{varias[0]}</div> Máximo <div class="ct">{varias[1]}</div></div>'
                   + F.info("WhatsApp muestra hasta 20 opciones en una pregunta de varias. Con un mínimo de 1 o más, es obligatoria.") + "</div></div>")
    else:
        cuantas = '<div class="w-cmp ancho"><span class="q-chk"><i class="no"></i>Permitir elegir varias</span></div>'
    pres = ""
    if propia:
        pres = ('<div class="w-cmp ancho q-pres"><span class="rt">Cómo se muestra cada opción</span>'
                '<span class="ab-seg" role="radiogroup" aria-label="Cómo se muestra cada opción"><span role="radio">Como el catálogo</span><span class="on" role="radio">Propia</span></span>'
                f'<div class="q-g2"><div class="w-cmp"><span class="rt">Texto</span><div class="ct sel">Nombre{CHEV}</div></div>'
                f'<div class="w-cmp"><span class="rt">Detalle</span><div class="ct sel">Rol{CHEV}</div></div></div></div>')
    e = f'<span class="err2" role="alert">{err}</span>' if err else ""
    return ('<div class="q-ab">' + A.fila_pregunta(5, n, tipo_fila, False, None)
            + '<div class="q-ed">'
            f'<div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">{n}</div></div>'
            f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span><div class="ct sel">Elegir de un catálogo{CHEV}</div></div>'
            f'<div class="w-cmp ancho q-cat"><span class="rt">Catálogo <span class="req">*</span>{ver}</span>{sel}{menu}{e}</div>'
            + cuantas + pres
            + '<div class="w-cmp"><span class="rt">Ayuda para el empleado</span><div class="ct ph">Opcional</div></div>'
            '<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk"><i class="no"></i>Obligatoria</span></div>'
            f'<div class="q-pie ancho"><button type="button" class="cb cb-sec">{ARRIBA} Listo</button></div>'
            "</div></div>")


A.pregunta_catalogo = pregunta_catalogo


def vista_catalogo(t_cuerpo, modo):
    """La vista previa de la pregunta de catálogo: casillas con «Elegí hasta N» si permite varias; el rótulo de la pregunta."""
    n, cat, varias, _p, _e = CA4[modo]
    if n != "Motivo":
        t_cuerpo = t_cuerpo.replace(">Motivo (opcional)", f">{n} (opcional)", 1)
    if varias:
        ops = ["Seguimiento", "Venta nueva", "Reclamo"] if cat == "Motivos de visita" else ["Abrasivos del Sur", "Aceros Rosario", "Aislantes Norte", "…"]
        m = re.search(rf'<div class="pv-c">{n} \(opcional\)(?:(?!<div class="pv-c">).)*', t_cuerpo, re.S)
        assert m, modo
        nuevo = (f'<div class="pv-c">{n} (opcional)<span class="pv-ay">Elegí hasta {varias[1]}</span><div class="pv-ck">'
                 + "".join(f"<span><i></i>{o}</span>" for o in ops) + "</div></div>")
        t_cuerpo = t_cuerpo[:m.start()] + nuevo + t_cuerpo[m.end():]
    return t_cuerpo


PARA_QUIEN = ["Empleados", "Clientes", "Empleados y clientes"]


def para_quien(abierto=False, valor="Empleados"):
    """50 · Para quién es el formulario: el envío, el asistente y las sugerencias ofrecen solo los que corresponden."""
    if not abierto:
        return f'<div class="w-cmp"><span class="rt">Para quién es <span class="req">*</span></span><div class="ct sel">{valor}{CHEV}</div></div>'
    items = "".join(f'<span class="{"on" if o == valor else ""}" role="option">{o}</span>' for o in PARA_QUIEN)
    return (f'<div class="w-cmp q-cat"><span class="rt">Para quién es <span class="req">*</span></span><div class="ct sel abierto">{valor}{CHEV}</div>'
            f'<div class="q-catmn" role="listbox" aria-label="Para quién es">{items}</div></div>')


def caja_formulario(nombre="Visita a cliente", boton="Enviar", prefijo="VIS", modo="normal", ingles=False, quien=False):
    """Nombre, texto del botón final, prefijo y para quién es, sin ayudas debajo; el prefijo publicado va como la A11."""
    if modo == "fijo":
        pref, i = f'<div class="ct ro">{prefijo}</div>', F.info(f"Las respuestas se numeran {prefijo}-000001.")
    elif modo == "ocupado":
        pref = f'<div class="ct mal">{prefijo}</div><span class="err2" role="alert">Ya hay un formulario con ese prefijo. Elegí otro.</span>'
        i = F.info(f"Las respuestas se numeran {prefijo}-000001. Se puede cambiar hasta publicar por primera vez.")
    else:
        pref = f'<div class="ct">{prefijo}</div>'
        i = F.info(f"Las respuestas se numeran {prefijo}-000001. Se puede cambiar hasta publicar por primera vez.")
    return ('<div class="w-caja"><div class="f-cab"><span>El formulario</span></div><div class="e-g2">'
            f'<div class="w-cmp"><span class="rt">Nombre <span class="req">*</span></span><div class="ct">{nombre}</div></div>'
            f'<div class="w-cmp"><span class="rt">Texto del botón final <span class="req">*</span></span><div class="ct">{boton}</div></div>'
            f'<div class="w-cmp"><span class="rt">Prefijo de numeración <span class="req">*</span>{i}</span>{pref}</div>'
            + para_quien(quien) + "</div></div>")


def pregunta_motivo():
    ops = "".join(f'<div class="q-op"><div class="ct">{o}</div><button type="button" class="ib" aria-label="Quitar opción {o}">{X}</button></div>'
                  for o in ["Seguimiento", "Venta nueva", "Reclamo"])
    return ('<div class="q-ab">' + A.fila_pregunta(5, "Motivo", "Elegir una · 3 opciones", False, None) + '<div class="q-ed">'
            '<div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">Motivo</div></div>'
            f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span><div class="ct sel">Elegir una{CHEV}</div></div>'
            '<div class="w-cmp ancho"><span class="rt">Opciones</span><div class="q-ops">' + ops
            + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar opción</button></div></div>'
            '<div class="w-cmp"><span class="rt">Ayuda para el empleado</span><div class="ct ph">Opcional</div></div>'
            '<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk"><i class="no"></i>Obligatoria</span></div>'
            f'<div class="q-pie ancho"><button type="button" class="cb cb-sec">{ARRIBA} Listo</button></div>'
            "</div></div>")


def pregunta_fallas():
    """38 · «Elegir varias»: las opciones, el mínimo y el máximo; obligatoria si el mínimo es mayor que cero (T13)."""
    ops = "".join(f'<div class="q-op"><div class="ct">{o}</div><button type="button" class="ib" aria-label="Quitar opción {o}">{X}</button></div>' for o in FALLAS)
    return ('<div class="q-ab">' + A.fila_pregunta(6, "Fallas", "Elegir varias · 4 opciones · de 1 a 3", True, None) + '<div class="q-ed">'
            '<div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">Fallas</div></div>'
            f'<div class="w-cmp"><span class="rt">Tipo de respuesta</span><div class="ct sel">Elegir varias{CHEV}</div></div>'
            '<div class="w-cmp ancho"><span class="rt">Opciones</span><div class="q-ops">' + ops
            + f'<button type="button" class="cb cb-sec" style="align-self: flex-start;">{MAS} Agregar opción</button></div></div>'
            '<div class="w-cmp ancho"><span class="rt">Cuántas puede elegir'
            + F.info("Con un mínimo de 1 o más, es obligatoria. WhatsApp muestra hasta 20 opciones.")
            + '</span><div class="q-rango">Mínimo <div class="ct">1</div> Máximo <div class="ct">3</div></div></div>'
            '<div class="w-cmp ancho"><span class="rt">Ayuda para el empleado</span><div class="ct ph">Opcional</div></div>'
            f'<div class="q-pie ancho"><button type="button" class="cb cb-sec">{ARRIBA} Listo</button></div>'
            "</div></div>")


def caja_preguntas(abierta="motivo", vacia=False, menu=False, solo_ver=False, catalogo=None, mal=None, **_):
    if vacia:
        filas, cuenta = '<div class="e-vacio">Todavía no agregaste preguntas.</div>', "0 preguntas"
    else:
        filas = ""
        for k, (n, tipo, ob, _en) in enumerate(A.PREGUNTAS, 1):
            if k == 5 and catalogo:
                filas += A.pregunta_catalogo(catalogo)
            elif k == 5 and abierta == "motivo":
                filas += pregunta_motivo()
            elif k == 6 and abierta == "fallas":
                filas += pregunta_fallas()
            elif k == mal:
                filas += (A.fila_pregunta(k, n, tipo, ob, None).replace('<div class="q-it">', '<div class="q-it mal">', 1)
                          .replace('<span class="chips">', '<span class="chips"><span class="ab-chip mal">Corregir</span>' + F.info(MAL_OBS), 1))
            else:
                filas += A.fila_pregunta(k, n, tipo, ob, None, menu=(menu and k == 4), solo_ver=solo_ver)
        cuenta = f"{len(A.PREGUNTAS)} preguntas"
    boton = "" if solo_ver else f'<button type="button" class="cb cb-sec">{MAS} Agregar pregunta</button>'
    return f'<div class="w-caja"><div class="f-cab"><span>Preguntas</span><span class="der">{cuenta}{boton}</span></div>{filas}</div>'


def vista(ingles=False, vacia=False, nombre="Visita a cliente"):
    pv = F.vista_previa()
    pv = re.sub(r'<div class="pv-tit">.*?</div>', '<div class="pv-tit"><span class="pv-tit2">Así lo ve el empleado</span></div>', pv, count=1, flags=re.S)
    pv = pv.replace("Elegí una opción", "Elegí una opción", 1)
    fallas = ('<div class="pv-c">Fallas<span class="pv-ay">Elegí hasta 3</span><div class="pv-ck">'
              + "".join(f"<span><i></i>{o}</span>" for o in FALLAS) + "</div></div>")
    pv = pv.replace('<div class="pv-c">Observaciones (opcional)', fallas + '<div class="pv-c">Observaciones (opcional)', 1)
    if vacia:
        pv = re.sub(r'<div class="pv-hb">.*?</div><div class="pv-pie">', '<div class="pv-hb"></div><div class="pv-pie">', pv, count=1, flags=re.S)
        pv = pv.replace(">Visita a cliente<", f">{nombre}<")
    return pv


def cuerpo_editor(sup="", abierta="motivo", vacia=False, nombre="Visita a cliente", prefijo="VIS", modo="normal", menu=False, solo_ver=False, catalogo=None, quien=False, mal=None, **_):
    if abierta is True:
        abierta = "motivo"
    return ('<div class="w-body">' + sup + '<div class="f-cols"><div class="f-pila">'
            + caja_formulario(nombre=nombre, prefijo=prefijo, modo=modo, quien=quien)
            + caja_preguntas(abierta=None if vacia else abierta, vacia=vacia, menu=menu, solo_ver=solo_ver, catalogo=catalogo, mal=mal)
            + "</div>" + vista(vacia=vacia, nombre=nombre) + "</div></div>")


A.caja_formulario, A.caja_preguntas, A.vista, A.cuerpo_editor = caja_formulario, caja_preguntas, vista, cuerpo_editor


def menu_formulario(nombre="Visita a cliente", items=None):
    """El ⋮ de la banda (E12b): Copiar y Dar de baja; con respuestas, Eliminar no aparece."""
    items = items if items is not None else (f'<a class="f-mi" role="menuitem" href="FRM-Copiar.dc.html">{M.IC["duplicar"]} Copiar</a>'
                                             f'<a class="f-mi" role="menuitem" href="FRM-Dar-De-Baja.dc.html">{M.IC["cancelar"]} Dar de baja</a>')
    return f'<div class="f-menu" role="menu" aria-label="Acciones de {nombre}">{items}</div>'


def kebab(abierto=False, nombre="Visita a cliente", items=None):
    menu = menu_formulario(nombre, items) if abierto else ""
    return (f'<span class="e-kw"><button type="button" class="ib o-borde" aria-label="Acciones de {nombre}" aria-haspopup="menu" '
            f'aria-expanded="{"true" if abierto else "false"}">{A.KEBAB}</button>{menu}</span>')


def acc(modo="limpio", publicado=True, tip=False, menu=False):
    """Las acciones de la banda (43): limpio | cambios | guardando | nuevo | nuevo-guardando | solo; y el ⋮ de la E12b."""
    oficial = '<a class="cb cb-sec" href="FRM-Publicando.dc.html">Ver vista oficial</a>' if publicado else ""
    if modo == "solo":
        return oficial
    if modo.startswith("nuevo"):
        g = modo.endswith("guardando")
        d = " disabled" if g else ""
        return (f'<button type="button" class="cb cb-sec"{d}>Cancelar</button>'
                f'<button type="button" class="cb cb-pri"{d}>{GIRA if g else ""}Guardar borrador</button>')
    limpio, g = modo == "limpio", modo == "guardando"
    d = " disabled" if (limpio or g) else ""
    a = f'<button type="button" class="cb cb-sec"{d}>Descartar</button>'
    a += f'<button type="button" class="cb cb-sec"{d}>{GIRA if g else ""}Guardar cambios</button>'
    if limpio:
        a += '<a class="cb cb-pri" href="FRM-Publicar.dc.html">Publicar en WhatsApp</a>'
    else:
        b = f'<button type="button" class="cb cb-pri" aria-disabled="true" title="{MOTIVO_GUARDAR}">Publicar en WhatsApp</button>'
        a += f'<span class="e-tipw">{b}<span class="e-tip" role="tooltip">{MOTIVO_GUARDAR}</span></span>' if tip else b
    return a + oficial + (kebab(menu) if publicado else "")


EST_BOR = '<span class="w-est off">Borrador</span>'
EST_PUB = '<span class="w-est">Publicado · versión 3</span>'
EST_PUB4 = '<span class="w-est">Publicado · versión 4</span>'
VOL = "FRM-Listado.dc.html"
banda = A.banda
toast, confirmar = A.toast, A.confirmar


# ================================================================ FRM-Editor
ESTADOS_EDITOR = ["Sin cambios", "Con cambios", "Guardando", "Guardado", "No se guardó", "Otra persona guardó", "Comparar los cambios",
                  "Nuevo formulario", "Prefijo ocupado", "Para quién es", "Acciones del formulario", "Acciones de una pregunta", "Quitar una pregunta", "Cambiar el tipo", "Elegir varias",
                  "Elegir de un catálogo", "Elegir el catálogo", "Varias de un catálogo", "Más de 20 en varias", "Presentación propia", "Sin catálogos", "Pregunta de foto", "Pregunta de documento", "Sin almacenamiento",
                  "Descartar cambios", "Solo lectura", "Cargando", "No existe"]
CONFLICTO = ('<div class="e-sup alerta" role="alert"><div class="fila">' + ALERTA
             + '<span class="tx">Otra persona cambió esto mientras lo editabas.</span><button type="button" class="cb cb-sec">Revisar</button></div></div>')


def archivos(modo, total="5"):
    """Las preguntas de la E14 con «Fallas» en la lista: cuentan una más."""
    c = A.cuerpo_archivos(modo, total)
    return c.replace(" · 8 preguntas", " · 9 preguntas").replace(">7 preguntas<", ">8 preguntas<")


def editor():
    cargando = ('<div class="w-body"><div class="f-cuerpo izq"><div class="esq"><span style="width: 60%;"></span><span style="width: 80%;"></span>'
                '<span style="width: 70%;"></span><span style="width: 75%;"></span></div></div></div>')
    no_existe = ('<div class="w-body"><div class="w-caja"><div class="f-cuerpo"><b>No encontramos este formulario.</b>'
                 '<button type="button" class="cb cb-sec">Reintentar</button></div></div></div>')
    pub = lambda modo, cuerpo: (banda("Visita a cliente", EST_PUB, acc(modo), VOL), cuerpo)
    nuevo = lambda modo, cuerpo: (banda("Nuevo formulario", EST_BOR, acc(modo, publicado=False), VOL), cuerpo)
    V = {
        "Sin cambios": pub("limpio", cuerpo_editor(abierta=None, modo="fijo")),
        "Con cambios": pub("cambios", cuerpo_editor(modo="fijo")),
        "Guardando": pub("guardando", cuerpo_editor(modo="fijo")),
        "Guardado": pub("limpio", cuerpo_editor(abierta=None, modo="fijo")),
        "No se guardó": pub("cambios", cuerpo_editor(modo="fijo")),
        "Otra persona guardó": pub("cambios", cuerpo_editor(sup=CONFLICTO, modo="fijo")),
        "Comparar los cambios": pub("cambios", cuerpo_editor(sup=CONFLICTO, modo="fijo")),
        "Nuevo formulario": nuevo("nuevo", cuerpo_editor(vacia=True, nombre="Inspección de obra", prefijo="OBR")),
        "Prefijo ocupado": nuevo("nuevo", cuerpo_editor(abierta=None, nombre="Registro de visita", prefijo="VIS", modo="ocupado")),
        "Para quién es": pub("cambios", cuerpo_editor(abierta=None, modo="fijo", quien=True)),
        "Acciones del formulario": (banda("Visita a cliente", EST_PUB, acc("limpio", menu=True), VOL), cuerpo_editor(abierta=None, modo="fijo")),
        "Acciones de una pregunta": pub("limpio", cuerpo_editor(abierta=None, menu=True, modo="fijo")),
        "Quitar una pregunta": pub("limpio", cuerpo_editor(abierta=None, modo="fijo")),
        "Cambiar el tipo": pub("cambios", cuerpo_editor(modo="fijo")),
        "Elegir varias": pub("cambios", cuerpo_editor(abierta="fallas", modo="fijo")),
        "Elegir de un catálogo": pub("cambios", cuerpo_editor(modo="fijo", catalogo="elegido")),
        "Elegir el catálogo": pub("cambios", cuerpo_editor(modo="fijo", catalogo="abierto")),
        "Varias de un catálogo": pub("cambios", vista_catalogo(cuerpo_editor(modo="fijo", catalogo="varias"), "varias")),
        "Más de 20 en varias": pub("cambios", vista_catalogo(cuerpo_editor(modo="fijo", catalogo="mas20"), "mas20")),
        "Presentación propia": pub("cambios", vista_catalogo(cuerpo_editor(modo="fijo", catalogo="propia"), "propia")),
        "Sin catálogos": pub("cambios", cuerpo_editor(modo="fijo", catalogo="sin")),
        "Pregunta de foto": pub("cambios", archivos("foto")),
        "Pregunta de documento": pub("cambios", archivos("documento")),
        "Sin almacenamiento": pub("cambios", archivos("sin", "1")),
        "Descartar cambios": pub("cambios", cuerpo_editor(modo="fijo")),
        "Solo lectura": (banda("Visita a cliente", EST_PUB, acc("solo"), VOL), cuerpo_editor(abierta=None, modo="fijo", solo_ver=True)),
        "Cargando": (banda("Visita a cliente", "", "", VOL), cargando),
        "No existe": (banda("Formulario", "", "", VOL), no_existe),
    }
    assert list(V) == ESTADOS_EDITOR
    dif = ('<div class="e-dif"><span>Qué cambió</span><span>Guardado actualmente</span><span>Mis cambios</span>'
           '<span class="k">Texto del botón final</span><span>Confirmar visita</span><span>Enviar</span>'
           '<span class="k">Observaciones</span><span>Hasta 300 caracteres</span><span>Hasta 600 caracteres</span>'
           '<span class="k">Fallas</span><span>De 1 a 2</span><span>De 1 a 3</span>'
           '<span class="k no">Motivo · opciones</span><span class="no">Quitó «Reclamo»</span><span class="no">Le cambiaste el texto'
           + F.info("No se puede conservar: la opción ya no está en lo guardado.") + "</span></div>")
    capas = {
        "Guardado": toast("Guardamos los cambios de Visita a cliente."),
        "No se guardó": toast("No pudimos guardar los cambios. Lo escrito se conserva.", "mal"),
        "Comparar los cambios": F.dialogo("Revisar los cambios", '<p class="d-tx">Laura Ríos guardó este formulario hace 2 minutos.</p>' + dif,
                                          '<button type="button" class="cb cb-sec">Usar lo guardado</button><button type="button" class="cb cb-pri">Conservar mis cambios</button>', una=False)
        .replace('class="w-dlg"', 'class="w-dlg" style="width: 760px;"', 1),
        "Quitar una pregunta": confirmar("¿Quitar la pregunta?", "Dejará de pedirse en el borrador. Las respuestas anteriores se conservan.", "Quitar pregunta"),
        "Cambiar el tipo": confirmar("¿Cambiar el tipo de respuesta?", "Esta será una pregunta nueva. Las respuestas anteriores conservan el tipo original.", "Cambiar tipo", peligro=False),
        "Descartar cambios": confirmar("¿Descartar los cambios?", "Vas a perder lo que cambiaste sin guardar.", "Descartar", cancelar="Seguir editando"),
    }
    return A.pagina_editor(V, capas, ESTADOS_EDITOR, "Editor del formulario · /org/formularios/:id", CSS_E12 + CSS_CA4)


# ================================================================ FRM-Publicar
ESTADOS_PUBLICAR = ["Versión nueva", "Primera publicación", "Comprobando", "Con cambios sin guardar", "Una pregunta no se puede mostrar", "Un catálogo demasiado grande",
                    "Más de 10 archivos", "Cambió después de comprobar", "Ya se está publicando"]
SIETE = "Cliente, Fecha de la visita, ¿Se concretó la venta?, Monto estimado, Motivo, Fallas y Observaciones"


def p_ok(v="4", primera=False):
    card = A.card
    if primera:
        incluye = '<span class="p-cap">Qué incluye</span>' + card(DOC, "7 preguntas", SIETE)
        fijo = (card(TILDE, "Las preguntas de la versión 1", "Ya no se editan. Lo que cambies después se publica como versión 2.")
                + card(TILDE, "El prefijo VIS", "Las respuestas se numeran VIS-000001, VIS-000002…"))
    else:
        incluye = ('<span class="p-cap">Qué cambia respecto de la versión 3</span>'
                   + card(DOC, "Cambiadas: Motivo y Fallas", "Motivo suma «Reclamo»; Fallas deja elegir hasta 3.") + card(DOC, "7 preguntas", SIETE))
        fijo = card(TILDE, f"Las preguntas de la versión {v}", f"Ya no se editan. Lo que cambies después se publica como versión {int(v) + 1}.")
    return incluye + '<span class="p-cap">Qué queda fijo</span>' + fijo + '<span class="p-cap">Qué va a pasar</span>' + A.pasos()


def pie_pub(v="4", activo=True, trabajando=False):
    d = "" if activo and not trabajando else " disabled"
    return (f'<button type="button" class="cb cb-sec">Cancelar</button>'
            f'<button type="button" class="cb cb-pri"{d}>{GIRA if trabajando else ""}Publicar versión {v}</button>')


def publicar():
    base = (banda("Visita a cliente", EST_PUB, acc("limpio"), VOL), cuerpo_editor(abierta=None, modo="fijo"))
    cambios = (banda("Visita a cliente", EST_PUB, acc("cambios", tip=True), VOL), cuerpo_editor(modo="fijo"))
    primera = (banda("Visita a cliente", EST_BOR, acc("limpio", publicado=False), VOL), cuerpo_editor(abierta=None))
    V = {e: (primera if e == "Primera publicación" else cambios if e == "Con cambios sin guardar" else base) for e in ESTADOS_PUBLICAR}
    dlg = A.dlg_publicar
    prob = ('<div class="p-prob"><span class="mal">' + ALERTA + '</span><span class="tx"><b>Motivo · opción «Seguimiento comercial con visita programada»</b>'
            '<span>Es demasiado larga para WhatsApp.</span></span><a href="FRM-Editor.dc.html">Ir a la pregunta</a></div>')
    esq = ('<div class="p-sec"><div class="p-esq"><span style="width: 85%;"></span><span style="width: 60%;"></span>'
           '<span style="width: 75%;"></span></div></div>')
    capas = {
        "Versión nueva": dlg("Publicar la versión 4 en WhatsApp", p_ok(), pie_pub()),
        "Primera publicación": dlg("Publicar la versión 1 en WhatsApp", p_ok("1", primera=True), pie_pub("1")),
        "Comprobando": dlg("Publicar la versión 4 en WhatsApp", esq, pie_pub(trabajando=True)),
        "Una pregunta no se puede mostrar": dlg("Publicar la versión 4 en WhatsApp", '<span class="p-cap">Antes hay que resolver</span>' + prob, pie_pub(activo=False)),
        "Un catálogo demasiado grande": dlg("Publicar la versión 4 en WhatsApp", '<span class="p-cap">Antes hay que resolver</span>'
                                            '<div class="p-prob"><span class="mal">' + ALERTA + '</span><span class="tx"><b>Proveedor · catálogo «Proveedores»</b>'
                                            '<span>Tiene 1.097 opciones y WhatsApp muestra hasta 200.</span></span><a href="FRM-Editor.dc.html">Ir a la pregunta</a></div>',
                                            pie_pub(activo=False)),
        "Más de 10 archivos": dlg("Publicar la versión 4 en WhatsApp", '<span class="p-cap">Antes hay que resolver</span>'
                                  '<div class="p-prob"><span class="mal">' + ALERTA + '</span><span class="tx"><b>Archivos: hasta 12 de 10</b>'
                                  '<span>WhatsApp acepta 10 archivos por respuesta.</span></span><a href="FRM-Editor.dc.html">Ir a las preguntas</a></div>',
                                  pie_pub(activo=False)),
        "Cambió después de comprobar": dlg("Publicar la versión 4 en WhatsApp", A.aviso("Laura Ríos guardó cambios en este formulario hace un momento."),
                                           '<button type="button" class="cb cb-sec">Cerrar</button><button type="button" class="cb cb-pri">Revisar cambios</button>'),
        "Ya se está publicando": dlg("Publicar la versión 4 en WhatsApp", A.aviso("Tomás Acosta está publicando la versión 4.", icono=RELOJ),
                                     '<button type="button" class="cb cb-sec">Cerrar</button>'),
    }
    return A.pagina_editor(V, capas, ESTADOS_PUBLICAR, "Publicar en WhatsApp", CSS_E12)


# ================================================================ FRM-Publicando
ESTADOS_PUBLICANDO = ["Publicando", "Publicando: los pasos", "Publicado", "WhatsApp rechazó una pregunta", "Sin confirmar", "Sin confirmar: el detalle",
                      "Necesita revisión", "Vista oficial", "Vista oficial cargando", "Vista oficial vencida"]


def dlg_pasos():
    """El ⓘ de «Publicando la versión 4»: los pasos, en el aviso importante."""
    p = [("hecho", "Aceptada", "Hoy, 15:20"), ("hecho", "Enviada a WhatsApp", "15:21"), ("ahora", "WhatsApp la revisa", ""), ("", "Lista para mandar", "")]
    pasos = "".join(f'<div class="e-paso {c}"><span class="bo">{TILDE if c == "hecho" else ""}</span><span class="tx">{a}<small>{b}</small></span></div>' for c, a, b in p)
    return F.dialogo("Publicando la versión 4", f'<div class="e-pasos vert">{pasos}</div>'
                     '<p class="d-tx">La versión 3 sigue andando. Lo que guardes ahora va a la versión 5.</p>',
                     '<button type="button" class="cb cb-sec">Cerrar</button>')


def dlg_sin_confirmar():
    return F.dialogo("La versión 4 en WhatsApp", '<p class="d-tx">Todavía no sabemos si WhatsApp recibió la versión 4. La seguimos consultando: no la mandamos de nuevo.</p>',
                     '<button type="button" class="cb cb-sec">Cerrar</button><button type="button" class="cb cb-pri">Consultar ahora</button>')


def publicando():
    acc_off = acc("limpio", publicado=False).replace('<a class="cb cb-pri" href="FRM-Publicar.dc.html">Publicar en WhatsApp</a>',
                                                      '<button type="button" class="cb cb-pri" aria-disabled="true" title="Se está publicando la versión 4.">Publicar en WhatsApp</button>')
    publicando_e = '<span class="w-est pend">Publicando la versión 4</span>' + info_btn("Ver los pasos")
    rechazo_e = '<span class="w-est mal">No se pudo publicar la versión 4</span>' + F.info("WhatsApp rechazó la versión 4. La versión 3 sigue andando.")
    sin_conf_e = '<span class="w-est pend">Sin confirmar</span>' + info_btn("Todavía no sabemos si WhatsApp recibió la versión 4.")
    revision_e = ('<span class="w-est mal">Necesita revisión</span>'
                  + F.info("No pudimos confirmar qué pasó con la versión 4 en WhatsApp. Quien publica formularios la revisa en Meta y la resuelve antes de publicar otra."))

    def cuerpo(sup, pv=None, mal=None):
        c = cuerpo_editor(sup=sup, abierta=None, modo="fijo", mal=mal)
        return c.replace(vista(), A.vista_oficial(pv), 1) if pv else c
    ok = acc("limpio")
    V = {
        "Publicando": (banda("Visita a cliente", publicando_e, acc_off, VOL), cuerpo("")),
        "Publicando: los pasos": (banda("Visita a cliente", publicando_e, acc_off, VOL), cuerpo("")),
        "Publicado": (banda("Visita a cliente", EST_PUB4, ok, VOL), cuerpo("")),
        "WhatsApp rechazó una pregunta": (banda("Visita a cliente", rechazo_e, ok, VOL), cuerpo("", mal=7)),
        "Sin confirmar": (banda("Visita a cliente", sin_conf_e, acc_off, VOL), cuerpo("")),
        "Sin confirmar: el detalle": (banda("Visita a cliente", sin_conf_e, acc_off, VOL), cuerpo("")),
        "Necesita revisión": (banda("Visita a cliente", revision_e, acc_off, VOL), cuerpo("")),
        "Vista oficial": (banda("Visita a cliente", EST_PUB4, ok, VOL), cuerpo("", "vista")),
        "Vista oficial cargando": (banda("Visita a cliente", EST_PUB4, ok, VOL), cuerpo("", "cargando")),
        "Vista oficial vencida": (banda("Visita a cliente", EST_PUB4, ok, VOL), cuerpo("", "vencida")),
    }
    capas = {"Publicando: los pasos": dlg_pasos(), "Publicado": toast("Publicamos la versión 4. Ya la podés mandar desde el chat."),
             "Sin confirmar: el detalle": dlg_sin_confirmar()}
    return A.pagina_editor(V, capas, ESTADOS_PUBLICANDO, "Publicar en WhatsApp · cómo termina", CSS_E12)


# ================================================================ M-FRM-Editor
T_PREG = [("Cliente", "Texto corto · Obligatoria"), ("Fecha de la visita", "Fecha · Opcional"), ("¿Se concretó la venta?", "Sí o no · Opcional"),
          ("Monto estimado", "Número · 2 decimales · Opcional"), ("Motivo", "Elegir una · 3 opciones · Opcional"),
          ("Fallas", "Elegir varias · de 1 a 3 · Obligatoria"), ("Observaciones", "Texto largo · Opcional")]
ESTADOS_TED = ["Sin cambios", "Con cambios", "Guardando", "Acciones del formulario", "Acciones de una pregunta", "Editar una pregunta", "Elegir varias", "Pregunta con catálogo",
               "Pregunta de foto", "Así lo ve el empleado", "Publicar", "Publicando", "Publicado", "WhatsApp rechazó una pregunta", "Nuevo formulario"]
CSS_TED_E12 = """.ap-fijo .cb .girar2 { width: 16px; height: 16px; }
.t-cks { display: flex; flex-wrap: wrap; gap: 0 20px; }
.t-cks .t-chk { min-height: 36px; }
.t-chk i.no { background: #fff; border: 1.5px solid var(--borde2); box-sizing: border-box; }
.ap-hoja { max-height: calc(100% - 56px); }
.ap-hoja .hb { overflow-y: auto; min-height: 0; }
"""


def t_preguntas(vacia=False, mal=None):
    if vacia:
        return '<div class="t-vacia">Todavía no agregaste preguntas.</div>'
    h = ""
    for k, (n, d) in enumerate(T_PREG, 1):
        chip = '<span class="t-chip mal">Corregir</span>' if mal == k else ""
        d = MAL_OBS if mal == k else d
        h += (f'<div class="q-row{" mal" if mal == k else ""}"><span class="num">{k}</span><span class="tx"><b>{n}{chip}</b><span>{d}</span></span>'
              f'<button type="button" class="ap-ib" aria-label="Acciones de {n}">{F.TKEBAB}</button></div>')
    return h


def t_cuerpo(vacia=False, fijo=True, banda_html="", mal=None, nombre="Visita a cliente", prefijo="VIS", desde_preguntas=False):
    campos = F.tcampo("Nombre", nombre, req=True) + F.tcampo("Texto del botón final", "Enviar", req=True)
    ct = f'<div class="ct ro">{prefijo}</div>' if fijo else f'<div class="ct">{prefijo}</div>'
    campos += f'<div class="ap-cmp"><span class="rt"><span>Prefijo de numeración <span class="rq">*</span></span></span>{ct}</div>'
    campos += F.tcampo("Para quién es", "Empleados", req=True, select=True)
    cant = "0 preguntas" if vacia else f"{len(T_PREG)} preguntas"
    formulario = "" if desde_preguntas else '<div class="ap-gtit">El formulario</div><div class="f-campos">' + campos + "</div>"
    return (banda_html + '<div class="ap-cuerpo">' + formulario
            + f'<div class="ap-gtit">Preguntas · {cant}<a href="#">Agregar</a></div><div class="ap-grupo">' + t_preguntas(vacia, mal) + "</div>"
            + '<div style="height: 20px;"></div></div>')


def t_fijo(modo):
    if modo == "cambios":
        return '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button><button type="button" class="cb cb-pri full">Guardar cambios</button></div>'
    if modo == "guardando":
        return ('<div class="ap-fijo"><button type="button" class="cb cb-sec full" disabled>Descartar</button>'
                f'<button type="button" class="cb cb-pri full" disabled>{GIRA}Guardar cambios</button></div>')
    if modo == "nuevo":
        return '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Cancelar</button><button type="button" class="cb cb-pri full">Guardar borrador</button></div>'
    if modo == "off":
        return '<div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Publicar en WhatsApp</button></div>'
    return '<div class="ap-fijo"><a class="cb cb-pri full" href="#">Publicar en WhatsApp</a></div>'


def tel_editor():
    E = ESTADOS_TED

    def bar(titulo, sub):
        return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-FRM-Listado.dc.html">{F.TVOLVER}</a>'
                f'<div class="tit"><h1>{titulo}</h1><span class="sub">{sub}</span></div><button type="button" class="ap-ib" aria-label="Así lo ve el empleado">{F.OJO}</button>'
                + ("" if titulo == "Nuevo formulario" else f'<button type="button" class="ap-ib" aria-label="Acciones de {titulo}">{F.TKEBAB}</button>') + "</div>")
    pub = "Publicado · versión 3"
    snack = f'<div class="f-snack" role="status"><span class="ok">{OK}</span><span class="tx">Publicamos la versión 4.</span></div>'
    V = {
        "Sin cambios": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("limpio")),
        "Con cambios": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("cambios")),
        "Guardando": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("guardando")),
        "Acciones del formulario": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("limpio")),
        "Acciones de una pregunta": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("limpio")),
        "Editar una pregunta": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("cambios")),
        "Elegir varias": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("cambios")),
        "Pregunta con catálogo": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("cambios")),
        "Pregunta de foto": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("cambios")),
        "Así lo ve el empleado": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("limpio")),
        "Publicar": (bar("Visita a cliente", pub), t_cuerpo(), t_fijo("limpio")),
        "Publicando": (bar("Visita a cliente", "Publicando la versión 4"), t_cuerpo(), t_fijo("off")),
        "Publicado": (bar("Visita a cliente", "Publicado · versión 4"), t_cuerpo(), t_fijo("limpio") + snack),
        # la lista ya bajada hasta las preguntas: la que rechazó WhatsApp, marcada en su lugar
        "WhatsApp rechazó una pregunta": (bar("Visita a cliente", "No se pudo publicar la versión 4"), t_cuerpo(mal=7, desde_preguntas=True), t_fijo("limpio")),
        "Nuevo formulario": (bar("Nuevo formulario", "Borrador"), t_cuerpo(vacia=True, fijo=False, nombre="Inspección de obra", prefijo="OBR"), t_fijo("nuevo")),
    }
    assert list(V) == E
    cuerpo = A.con_estados([(e, v[0] + v[1] + v[2]) for e, v in V.items()])
    tilde = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")
    listo = '<button type="button" class="cb cb-pri">Listo</button><button type="button" class="cb cb-sec">Cancelar</button>'

    def ops(lista):
        return "".join(f'<div class="t-op"><div class="ap-cmp" style="flex: 1;"><div class="ct">{o}</div></div>'
                       f'<button type="button" class="ap-ib" aria-label="Quitar opción {o}">{X}</button></div>' for o in lista)
    editar = (F.tcampo("Pregunta", "Motivo", req=True) + F.tcampo("Tipo de respuesta", "Elegir una", select=True)
              + '<div class="ap-cmp"><span class="rt"><span>Opciones</span></span></div>' + ops(["Seguimiento", "Venta nueva", "Reclamo"])
              + f'<span class="t-mas">{MAS} Agregar opción</span>' + F.tcampo("Ayuda para el empleado", "Opcional", vacio=True)
              + '<span class="t-chk"><i class="no"></i>Obligatoria</span>')
    varias = (F.tcampo("Pregunta", "Fallas", req=True) + F.tcampo("Tipo de respuesta", "Elegir varias", select=True)
              + '<div class="ap-cmp"><span class="rt"><span>Opciones</span></span></div>' + ops(FALLAS) + f'<span class="t-mas">{MAS} Agregar opción</span>'
              + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' + F.tcampo("Mínimo", "1") + F.tcampo("Máximo", "3") + "</div>"
              + F.tcampo("Ayuda para el empleado", "Opcional", vacio=True))
    vp = '<div class="t-vp">'
    for k, (n, _d) in enumerate(T_PREG):
        if n == "Fallas":
            vp += ('<div class="ap-cmp"><span class="rt"><span>Fallas</span></span><span class="ay">Elegí hasta 3</span><div class="t-cks">'
                   + "".join(f'<span class="t-chk"><i class="no"></i>{o}</span>' for o in FALLAS) + "</div></div>")
            continue
        opcional = "" if n == "Cliente" else " (opcional)"
        ph = "Elegí una opción" if n == "Motivo" else "Elegí una fecha" if n == "Fecha de la visita" else ""
        vp += f'<div class="ap-cmp"><span class="rt"><span>{n}{opcional}</span></span><div class="ct ph{" area" if n == "Observaciones" else ""}">{ph}</div></div>'
    vp += "</div>"
    publicar_h = ('<div class="p-tit2">Qué cambia respecto de la versión 3</div><div class="ap-grupo" style="margin: 0;">'
                  '<div class="ap-dato"><span class="k">Cambiada</span><span class="v">Motivo (las opciones)</span></div>'
                  '<div class="ap-dato"><span class="k">Cambiada</span><span class="v">Fallas (hasta 3)</span></div></div>'
                  f'<span class="t-lin">{TILDE} Las preguntas de la versión 4 ya no se editan; lo que cambies después va a la versión 5.</span>'
                  f'<span class="t-lin">{RELOJ} WhatsApp la revisa unos minutos. Recién ahí se puede mandar desde el chat.</span>')
    origen = ('<div class="ap-cmp"><span class="rt"><span>De dónde sale la foto</span></span></div>'
              '<span class="t-opc">Cámara o galería<span class="d"></span></span>'
              f'<span class="t-opc on">Solo cámara<span class="d">{svg("<path d=" + chr(34) + "m5 12.5 4.5 4.5L19 7.5" + chr(34) + "/>", 18, "2.25")}</span></span>')
    cuantas = ('<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' + F.tcampo("Mínimo", "1") + F.tcampo("Máximo", "4") + "</div>"
               '<span class="t-lin">' + A.CLIP + ' Archivos: hasta 5 de 10 en el formulario.</span>')
    capas = {
        "Acciones del formulario": M.hoja("Visita a cliente", '<a role="menuitem" href="M-FRM-Listado.dc.html">Copiar</a><a role="menuitem" href="M-FRM-Listado.dc.html">Dar de baja</a>'),
        "Acciones de una pregunta": F.thoja("Monto estimado", '<div class="ap-acciones2"><span role="menuitem">Editar</span><span role="menuitem">Subir</span><span role="menuitem">Bajar</span>'
                                            '<span class="pel" role="menuitem">Quitar</span></div>', ""),
        "Editar una pregunta": F.thoja("Editar pregunta", editar, listo),
        "Elegir varias": F.thoja("Editar pregunta", varias, listo),
        "Pregunta con catálogo": F.thoja("Editar pregunta", F.tcampo("Pregunta", "Motivo", req=True) + F.tcampo("Tipo de respuesta", "Elegir de un catálogo", select=True)
                                         + F.tcampo("Catálogo", "Motivos de visita", req=True, select=True)
                                         + '<a class="t-mas" href="M-FRM-Catalogo.dc.html" style="text-decoration: none;">Ver el catálogo</a>'
                                         + f'<span class="t-chk"><i class="on">{tilde}</i>Permitir elegir varias</span>'
                                         + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">' + F.tcampo("Mínimo", "1") + F.tcampo("Máximo", "2") + "</div>"
                                         + F.tcampo("Ayuda para el empleado", "Opcional", vacio=True) + f'<span class="t-chk"><i>{tilde}</i>Obligatoria</span>', listo),
        "Pregunta de foto": F.thoja("Editar pregunta", F.tcampo("Pregunta", "Fotos de la visita", req=True) + F.tcampo("Tipo de respuesta", "Foto", select=True)
                                    + F.tcampo("Ayuda para el empleado", "Sacá una foto del frente del local y otra de la góndola.") + origen + cuantas, listo),
        "Así lo ve el empleado": F.thoja("Así lo ve el empleado", vp, '<button type="button" class="cb cb-pri" disabled>Enviar</button>', sub="Visita a cliente · borrador"),
        "Publicar": F.thoja("Publicar la versión 4", publicar_h, '<button type="button" class="cb cb-pri">Publicar versión 4</button><button type="button" class="cb cb-sec">Cancelar</button>'),
    }
    hojas = "".join(f'<sc-if value="{{{{s{E.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    t = F.pagina_tel(None, None, cuerpo, css=F.CSS_TFICHA + F.CSS_TPREGUNTA + F.CSS_TFORM + A.CSS_TED + F.CSS_TFILTRO + CSS_E12 + CSS_TED_E12)
    i = t.index('<nav class="ap-nav"')
    j = t.index("</nav>", i) + len("</nav>")
    t = t[:i] + t[j:]
    k = t.index('<span class="ap-raya"></span>') + len('<span class="ap-raya"></span>')
    t = t[:k] + hojas + t[k:]
    props = {"estado": {"editor": "enum", "options": E, "default": E[0], "section": "Estado"}, "$preview": {"width": 390, "height": 844}}
    t = t.replace("""data-props='{"$preview":{"width":390,"height":844}}'""", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'")
    t = t.replace("    return { si: true, no: false };", f"    const e = this.props.estado ?? {json.dumps(E[0], ensure_ascii=False)};\n" + A.js_estados(E))
    return M.css(re.sub(r"<title>[^<]*</title>", "<title>Editor del formulario · teléfono</title>", t), M.CSS_HOJA, "hoja")


# ================================================================ El chat: enviar y la respuesta
def dlg_enviar(*a, **k):
    """El diálogo de enviar sin el idioma en que le llega, sin la ayuda debajo del mensaje y sin «Enviando…»."""
    d = A._dlg_enviar_original(*a, **k)
    d = d.replace(f'<span class="c-lin">{A.GLOBO} Le llega en español, el idioma de su cuenta.</span>', "")
    d = d.replace("<span>Es lo que lee arriba del botón «Abrir formulario».</span>", "<span></span>")
    return d.replace('<button type="button" class="cb cb-pri" disabled>Enviando…</button>', f'<button type="button" class="cb cb-pri" disabled>{GIRA}Enviar formulario</button>')


if not hasattr(A, "_dlg_enviar_original"):
    A._dlg_enviar_original = A.dlg_enviar
A.dlg_enviar = dlg_enviar


# Decisión 80 (25/10): sin «Envío sin confirmar», «Ya lo revisé» ni «Resolver el envío»; lo que no se sabe si salió se reintenta solo.
SIN_CONFIRMAR = ("No se sabe si se guardó", "Envío sin confirmar", "Confirmar la revisión", "Resolver el envío")
ESTADOS_CHAT = [e for e in A.ESTADOS_CHAT_AB if e not in SIN_CONFIRMAR]
# E14 (§9): también menos que el mínimo y una opción que no entra
ESTADOS_CHAT[ESTADOS_CHAT.index("Ninguna opción") + 1:ESTADOS_CHAT.index("Ninguna opción") + 1] = ["Menos que el mínimo", "Una opción que no entra"]


def chat_enviar():
    E = ESTADOS_CHAT
    esc = {e: A.escr() for e in E}
    esc["En cola"] = A.escr("off", "Hay un envío pendiente en esta conversación.", enviar=False)
    esc["Ventana cerrada"] = A.escr("off", "Pasaron 24 horas desde su último mensaje.", "Pasaron 24 horas", cerrada=True)
    esc["Cuenta inactiva"] = A.escr("off", "La cuenta de Tomás está inactiva: no puede completar formularios.")
    esc["Sin formularios para Tomás"] = A.escr("off", "Tomás no tiene formularios publicados que pueda completar.")
    burbuja = A.burbuja
    msgs = {
        "En cola": burbuja("En cola · 10:51", icono=f'<span class="rel">{RELOJ14}</span>'),
        "Leído": burbuja("Lucía Fernández · 10:51 · Leído"),
        "No se pudo mandar": burbuja("No se pudo mandar", "mal", F.info("El formulario no le llegó. Podés mandarlo de nuevo con «Enviar formulario».")),
    }
    ventana = A.c_aviso("Pasaron 24 horas desde su último mensaje.", RELOJ14)
    capas = {
        "Elegir el formulario": dlg_enviar(),
        "Muchos formularios": dlg_enviar("muchos", buscar=""),
        "Sin coincidencias": dlg_enviar("vacia", buscar="Inspección de planta", pie="off"),
        "Cargando formularios": dlg_enviar("cargando", pie="off"),
        "La lista no carga": dlg_enviar("error", pie="off"),
        "Falta el mensaje": dlg_enviar(err="vacio"),
        "Mensaje muy largo": dlg_enviar(err="largo", mensaje="Tomás, te paso el formulario de la visita. Acordate de anotar todo lo que revisaste en el local, si quedaron pedidos pendientes, qué productos faltaban en la góndola y cuándo conviene volver a pasar…"),
        "Enviando": dlg_enviar(pie="enviando"),
        "Se cerró la ventana": dlg_enviar(aviso=ventana, pie="off", hasta=False),
        "El formulario ya no está": dlg_enviar("baja", aviso=A.c_aviso("Visita a cliente ya no está disponible para Tomás. Elegí otro."), pie="off"),
        "Con catálogos": dlg_enviar(prob=A.prep_catalogo()),
        "Preparando las opciones": dlg_enviar(prob=A.prep_catalogo("preparando"), pie="off"),
        "Más de 200 opciones": dlg_enviar(prob=A.prob_catalogo("Supervisor a cargo: supera las 200 opciones que admite WhatsApp. Ajustá el catálogo antes de mandar."), pie="off"),
        "Ninguna opción": dlg_enviar(prob=A.prob_catalogo("Supervisor a cargo: no tiene opciones y la pregunta es obligatoria."), pie="off"),
        "Menos que el mínimo": dlg_enviar(prob=A.prob_catalogo("Motivo: tiene 1 opción y se piden al menos 2."), pie="off"),
        "Una opción que no entra": dlg_enviar(prob=A.prob_catalogo("Supervisor a cargo: una opción es más larga de lo que admite WhatsApp."), pie="off"),
        "Catálogo que no se puede usar": dlg_enviar(prob=A.prob_catalogo("Supervisor a cargo: el catálogo no se puede usar. Avisale a quien lo administra."), pie="off"),
    }
    enviado = {"En cola": "Vos: Formulario · Visita a cliente", "Leído": "Vos: Formulario · Visita a cliente", "No se pudo mandar": "No se pudo mandar un formulario"}
    vp = {e: enviado.get(e, "Vos: Genial, Tomás. Te mando el formulario de la visita.") for e in E}
    hora = {e: "10:51" for e in enviado}
    t = A.pagina_chat(E, esc, msgs, capas, vp, hora, "WhatsApp · Internos · enviar un formulario")
    return t.replace("</helmet>", f'<style data-e12="resolver">\n{CSS_E12}</style>\n</helmet>', 1)


def t_hoja_enviar(*a, **k):
    h = A._t_hoja_enviar_original(*a, **k)
    h = h.replace(f'<span class="t-lin">{A.GLOBO} Le llega en español, el idioma de su cuenta.</span>', "")
    h = h.replace("<span>Es lo que lee arriba del botón «Abrir formulario».</span>", "<span></span>")
    return h.replace('<button type="button" class="cb cb-pri" disabled>Enviando…</button>', f'<button type="button" class="cb cb-pri" disabled>{GIRA}Enviar formulario</button>')


if not hasattr(A, "_t_hoja_enviar_original"):
    A._t_hoja_enviar_original = A.t_hoja_enviar
A.t_hoja_enviar = t_hoja_enviar


def t_menu(motivo=""):
    """El ⋮ del chat como hoja (Coordinador 9); «Enviar formulario» apagado queda solo grisado, con el motivo en su tooltip (43)."""
    item = ('<span role="menuitem">Enviar formulario</span>' if not motivo else
            f'<span role="menuitem" class="off" aria-disabled="true" title="{motivo}">Enviar formulario</span>')
    return M.hoja("Tomás Acosta", '<span role="menuitem">Pasar</span><span role="menuitem">Ver ficha del contacto</span>' + item)


A.t_menu = t_menu
ESTADOS_TCHAT = [e for e in A.ESTADOS_TCHAT_AB if e not in SIN_CONFIRMAR]


def tel_chat_enviar():
    E = ESTADOS_TCHAT
    esc = {e: A.t_escr() for e in E}
    esc["Ventana cerrada"] = A.t_escr(cerrada=True)
    tb = A.t_burbuja
    msgs = {
        "En cola": tb("En cola · 10:51", icono=f'<span class="rel">{F.TRELOJ}</span>'),
        "Leído": tb("Lucía Fernández · 10:51 · Leído"),
        "No se pudo mandar": tb("No se pudo mandar", "mal", A.t_info("El formulario no le llegó. Podés mandarlo de nuevo con «Enviar formulario».")),
    }
    ventana = f'<div class="t-aviso">{RELOJ14}<span>Pasaron 24 horas desde su último mensaje.</span></div>'

    def prob(texto):
        return f'<div class="t-prob2">{ALERTA}<span>{texto}</span></div>'
    capas = {
        "Menú abierto": t_menu(),
        "Elegir el formulario": t_hoja_enviar(),
        "Cargando formularios": t_hoja_enviar("cargando", pie="off"),
        "Falta el mensaje": t_hoja_enviar(err="vacio"),
        "Enviando": t_hoja_enviar(pie="enviando"),
        "Se cerró la ventana": t_hoja_enviar(aviso=ventana, pie="off", hasta=False),
        "El formulario ya no está": t_hoja_enviar("baja", aviso='<div class="t-aviso">' + ALERTA + '<span>Visita a cliente ya no está disponible para Tomás. Elegí otro.</span></div>', pie="off"),
        "Ventana cerrada": t_menu("Pasaron 24 horas desde su último mensaje."),
        "Cuenta inactiva": t_menu("La cuenta de Tomás está inactiva: no puede completar formularios."),
        "Sin formularios para Tomás": t_menu("Tomás no tiene formularios publicados que pueda completar."),
        "Con catálogos": t_hoja_enviar(prob=f'<span class="t-lin">{F.LISTA} Motivo: 3 opciones</span><span class="t-lin">{F.LISTA} Supervisor a cargo: 7 opciones</span>'),
        "Más de 200 opciones": t_hoja_enviar(prob=prob("Supervisor a cargo: supera las 200 opciones que admite WhatsApp. Ajustá el catálogo antes de mandar."), pie="off"),
        "Ninguna opción": t_hoja_enviar(prob=prob("Supervisor a cargo: no tiene opciones y la pregunta es obligatoria."), pie="off"),
        "Catálogo que no se puede usar": t_hoja_enviar(prob=prob("Supervisor a cargo: el catálogo no se puede usar. Avisale a quien lo administra."), pie="off"),
    }
    t = A.pagina_tchat(E, esc, msgs, capas, "WhatsApp · Internos · enviar un formulario · teléfono", CSS_E12)
    return M.css(t, M.CSS_HOJA, "hoja")


VARIAS = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("Fallas", "Frío, Ruido")]
VARIAS_TODAS = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "No"), ("Monto estimado", "0"),
                ("Motivo", "Seguimiento"), ("Fallas", "Frío, Ruido"), ("Observaciones", None)]


def respuestas(E):
    """Sin «Respondió en inglés»; suma la respuesta de «elegir varias», con las opciones en el orden en que las eligió."""
    E = [e for e in E if e != "Respondió en inglés"]
    E.insert(E.index("El mensaje ya no está"), "Con elegir varias")
    return E


def chat_respuesta():
    E0 = A.ESTADOS_RESP_AB
    A.ESTADOS_RESP_AB = respuestas(E0)
    try:
        t = A.chat_respuesta()
    finally:
        A.ESTADOS_RESP_AB = E0
    return con_varias(t, respuestas(E0))


A.VALORES_AB = [("Cliente", "Ferretería Rosales"), ("Fecha de la visita", "13/10/2026"), ("¿Se concretó la venta?", "No"),
                ("Monto estimado", "0"), ("Motivo", "Seguimiento"), ("Fallas", "Frío"), ("Observaciones", None)]
A.FORMS_CHAT = [("Visita a cliente", "Versión 3 · 7 preguntas"), ("Entrega de pedido", "Versión 1 · 5 preguntas"), ("Control de vehículo", "Versión 2 · 7 preguntas")]


def con_varias(t, E, movil=False):
    """Pone la tarjeta de «elegir varias» en su estado: las opciones elegidas, en el orden en que las eligió."""
    k = E.index("Con elegir varias")
    vacio = f'<sc-if value="{{{{s{k}}}}}" hint-placeholder-val="{{{{no}}}}"></sc-if>'
    if movil:
        tarjeta = (A.t_burbuja("Lucía Fernández · 10:51 · Leído")
                   + A.t_tarjeta(A.grilla_r(VARIAS) + '<span class="r-mas">Ver las 7 respuestas</span>' + A.r_ok("VIS-000128")))
    else:
        tarjeta = (A.burbuja("Lucía Fernández · 10:51 · Leído")
                   + A.tarjeta(A.grilla_r(VARIAS) + '<div class="r-mas"><button type="button" class="cb cb-sec">Ver las 7 respuestas</button></div>' + A.r_ok("VIS-000128")))
    assert t.count(vacio) == 1, (vacio, t.count(vacio))
    t = t.replace(vacio, vacio.replace("></sc-if>", ">" + tarjeta + "</sc-if>"))
    return t.replace("Ver las 6 respuestas", "Ver las 7 respuestas")


def tel_respuesta():
    E0 = A.ESTADOS_RESP_AB
    A.ESTADOS_RESP_AB = respuestas(E0)
    try:
        t = A.tel_respuesta_ab()
    finally:
        A.ESTADOS_RESP_AB = E0
    t = t.replace('<span class="r-mas">Ver las 7 respuestas</span>' + A.r_ok("VIS-000125"), '<span class="r-mas">Ver las 8 respuestas</span>' + A.r_ok("VIS-000125"))
    return con_varias(t, respuestas(E0), movil=True)


# ================================================================ 49 · Enviar un formulario a un cliente (bandeja Clientes)
FORMS_CLIENTE = [("Entrega de pedido", "Versión 1 · 5 preguntas")]  # el único publicado para empleados y clientes
CLIENTE_ANTES = ('<div class="w-m ent"><span class="gl">Hola, Lucía. Ya terminé la visita en Ferretería Rosales.</span><span class="pie">10:48</span></div>'
                 '<span class="o-sis">Lucía Fernández tomó la conversación</span>'
                 '<div class="w-m sal"><span class="gl">Genial, Tomás. Te mando el formulario de la visita.</span><span class="pie">Lucía Fernández · 10:50</span></div>')
CLIENTE_DESPUES = ('<div class="w-m ent"><span class="gl">Hola, ya me llegó el pedido.</span><span class="pie">10:48</span></div>'
                   '<span class="o-sis">Lucía Fernández tomó la conversación</span>'
                   '<div class="w-m sal"><span class="gl">¡Qué bueno, Martina! Te mando el formulario para confirmar la entrega.</span><span class="pie">Lucía Fernández · 10:50</span></div>')
E_CLIENTE = ["Con el botón", "Elegir el formulario", "Enviando", "En cola", "Leído", "Sin formularios para clientes"]
E_TCLIENTE = ["Menú abierto", "Elegir el formulario", "En cola", "Sin formularios para clientes"]
SIN_CLIENTES = "No hay formularios publicados para clientes."


def con_forms_cliente(fn, *a, **k):
    viejo = A.FORMS_CHAT
    A.FORMS_CHAT = FORMS_CLIENTE
    try:
        return fn(*a, **k)
    finally:
        A.FORMS_CHAT = viejo


def card_cliente():
    return (f'<span class="c-card"><span class="ic">{F.ICONO}</span><span class="t"><b>Entrega de pedido</b>'
            '<small>Formulario · versión 1 · botón «Abrir formulario»</small></span></span>')


def otros_clientes():
    """Los demás chats de la bandeja Clientes, tal como están en WA-Chats (5 en total con el de Martina)."""
    t = (PROJ / "WA-Chats.dc.html").read_text(encoding="utf-8")
    i = t.index('<div class="w-bandeja">')
    j = t.index('<div class="w-hilo">', i)
    items = re.findall(r'<div class="w-conv[^"]*">.*?</span></span></div>', t[i:j], re.S)
    assert len(items) == 5 and "Martina López" in items[0], len(items)
    return "".join(items[1:])


def a_cliente(t):
    """El chat de Internos con Tomás pasa a ser el de Clientes con Martina López (WA-Chats)."""
    for a, b in [
        ('<span role="radio" aria-checked="false">Clientes <span class="c">5</span></span><span class="on" role="radio" aria-checked="true">Internos <span class="c">2</span></span>',
         '<span class="on" role="radio" aria-checked="true">Clientes <span class="c">5</span></span><span role="radio" aria-checked="false">Internos <span class="c">2</span></span>'),
        ('<span class="w-av">TA</span><span class="tx"><span class="l1"><b>Tomás Acosta</b>', '<span class="w-av">ML</span><span class="tx"><span class="l1"><b>Martina López</b>'),
        ('<span class="l3">Carga de pedidos · Lucía Fernández</span></span></div><div class="w-conv "><span class="w-av">MP</span><span class="tx"><span class="l1"><b>Martín Paz</b><span>Ayer</span></span>'
         '<span class="l2"><span>Mañana paso por el depósito.</span></span><span class="l3">Carga de pedidos · Lucía Fernández</span></span></div>',
         '<span class="l3">Ventas · Lucía Fernández</span></span></div>' + otros_clientes()),
        ('<span class="w-av">TA</span><span class="tx"><b>Tomás Acosta</b><span>011 15-5555-4521 · Empleado · Delta S.A.</span></span>',
         '<span class="w-av">ML</span><span class="tx"><b>Martina López</b><span>011 15-5555-6203 · Vinculada a su cuenta · Mayorista</span></span>'),
        ('aria-label="Acciones de Tomás Acosta"', 'aria-label="Acciones de Martina López"'),
        (CLIENTE_ANTES, CLIENTE_DESPUES),
    ]:
        assert a in t, a[:90]
        t = t.replace(a, b)
    return t.replace("Enviar un formulario a Tomás Acosta", "Enviar un formulario a Martina López")


def chat_cliente():
    E = E_CLIENTE
    esc = {e: A.escr() for e in E}
    esc["En cola"] = A.escr("off", "Hay un envío pendiente en esta conversación.", enviar=False)
    esc["Sin formularios para clientes"] = A.escr("off", SIN_CLIENTES)

    def burbuja(pie, icono=""):
        return (f'<div class="w-m sal"><span class="gl">{A.MENSAJE_AB}{card_cliente()}</span><span class="pie">{icono}{pie}</span></div>')
    msgs = {"En cola": burbuja("En cola · 10:51", f'<span class="rel">{RELOJ14}</span>'), "Leído": burbuja("Lucía Fernández · 10:51 · Leído")}
    capas = {"Elegir el formulario": con_forms_cliente(dlg_enviar), "Enviando": con_forms_cliente(dlg_enviar, pie="enviando")}
    vp = {e: "Vos: ¡Qué bueno, Martina! Te mando el formulario para confirmar la entrega." for e in E}
    vp.update({"En cola": "Vos: Formulario · Entrega de pedido", "Leído": "Vos: Formulario · Entrega de pedido"})
    hora = {"En cola": "10:51", "Leído": "10:51"}
    t = A.pagina_chat(E, esc, msgs, capas, vp, hora, "WhatsApp · Clientes · enviar un formulario")
    t = t.replace("</helmet>", f'<style data-e12="cliente">\n{CSS_E12}</style>\n</helmet>', 1)
    return a_cliente(t)


def tel_chat_cliente():
    E = E_TCLIENTE
    esc = {e: A.t_escr() for e in E}

    def menu(motivo=""):
        item = ('<span role="menuitem">Enviar formulario</span>' if not motivo else
                f'<span role="menuitem" class="off" aria-disabled="true" title="{motivo}">Enviar formulario</span>')
        return M.hoja("Martina López", '<span role="menuitem">Pasar</span><span role="menuitem">Ver ficha del contacto</span>' + item)
    burbuja = (f'<div class="ap-m sal"><span class="gl">{A.MENSAJE_AB}{card_cliente()}</span>'
               f'<span class="pie"><span class="rel">{F.TRELOJ}</span>En cola · 10:51</span></div>')
    capas = {"Menú abierto": menu(), "Elegir el formulario": con_forms_cliente(t_hoja_enviar).replace("A Tomás Acosta", "A Martina López"),
             "Sin formularios para clientes": menu(SIN_CLIENTES)}
    t = A.pagina_tchat(E, esc, {"En cola": burbuja}, capas, "WhatsApp · Clientes · enviar un formulario · teléfono", CSS_E12)
    t = M.css(t, M.CSS_HOJA, "hoja")
    for a, b in [('<span class="w-av">TA</span><span class="tx"><b>Tomás Acosta</b><span>Empleado · Delta S.A.</span></span>',
                  '<span class="w-av">ML</span><span class="tx"><b>Martina López</b><span>Vinculada a su cuenta · Mayorista</span></span>'),
                 ('aria-label="Acciones de Tomás Acosta"', 'aria-label="Acciones de Martina López"'),
                 (CLIENTE_ANTES.replace("w-m", "ap-m").replace("o-sis", "ap-sis"), CLIENTE_DESPUES.replace("w-m", "ap-m").replace("o-sis", "ap-sis"))]:
        assert a in t, a[:90]
        t = t.replace(a, b)
    return t


NUEVOS = {"WA-Chats-Formulario-Cliente": (4560, 1780, 1440, 900, "WhatsApp · Clientes · enviar un formulario"),
          "M-WA-Chats-Formulario-Cliente": (2350, 2800, 390, 844, "WhatsApp · Clientes · enviar un formulario · teléfono")}


# ================================================================ Escritura y post-procesos
def post(n, t, alto=None):
    # La vista previa es de quien lo recibe (revisión del bloque, 24/10); las piezas de A la siguen llamando «Así lo ve el empleado»
    t = t.replace("Así lo ve el empleado", "Así lo ve quien lo recibe")
    # Los tipos de respuesta de la E12 (38): «Elegir una» y «Elegir varias», y «Número» con sus decimales aparte
    t = t.replace("<span>Número con decimales</span>", "<span>Número</span>").replace("<span>Elegir de una lista</span>", "<span>Elegir una</span><span>Elegir varias</span>")
    if alto:
        t = t.replace('"$preview":{"width":1440,"height":900}', f'"$preview":{{"width":1440,"height":{alto}}}')
    if n.startswith("FRM-") and 'data-e16="panel"' not in t:
        t = t.replace("</helmet>", '<style data-e16="panel">\n' + R.CSS_PANEL_E16 + "</style>\n</helmet>", 1) if hasattr(R, "CSS_PANEL_E16") else t
    return G.marco(n, t)


def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")


TABLEROS = ["FRM-Editor", "FRM-Publicar", "FRM-Publicando", "M-FRM-Editor", "WA-Chats-Formulario", "M-WA-Chats-Formulario",
            "WA-Chats-Respuesta", "M-WA-Conversacion-Respuesta"] + list(NUEVOS)


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
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', (PROJ / "FRM-Listado.dc.html").read_text(encoding="utf-8"), re.S)
    R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    escribir("FRM-Editor", post("FRM-Editor", editor(), 1400))
    escribir("FRM-Publicar", post("FRM-Publicar", publicar(), 1400))
    escribir("FRM-Publicando", post("FRM-Publicando", publicando(), 1400))
    escribir("M-FRM-Editor", post("M-FRM-Editor", tel_editor()))
    print("reglas en el teléfono", R.editor_telefono())
    # Un formulario nuevo todavía no tiene reglas
    t = (PROJ / "M-FRM-Editor.dc.html").read_text(encoding="utf-8")
    k = t.index(f'<sc-if value="{{{{s{ESTADOS_TED.index("Nuevo formulario")}}}}}"')
    t = t[:k] + re.sub(r'<div class="ap-gtit">Cuando llega una respuesta</div><div class="ap-grupo"><a class="q-row" href="M-FRM-Reglas\.dc\.html".*?</a></div>', "", t[k:], count=1, flags=re.S)
    escribir("M-FRM-Editor", t)
    escribir("WA-Chats-Formulario", post("WA-Chats-Formulario", chat_enviar()))
    escribir("M-WA-Chats-Formulario", post("M-WA-Chats-Formulario", tel_chat_enviar()))
    escribir("WA-Chats-Respuesta", post("WA-Chats-Respuesta", chat_respuesta()))
    escribir("M-WA-Conversacion-Respuesta", post("M-WA-Conversacion-Respuesta", tel_respuesta()))
    escribir("WA-Chats-Formulario-Cliente", post("WA-Chats-Formulario-Cliente", chat_cliente()))
    escribir("M-WA-Chats-Formulario-Cliente", post("M-WA-Chats-Formulario-Cliente", tel_chat_cliente()))
    # La vista previa es de quien lo recibe: empleados o clientes (revisión del bloque, 24/10)
    archivo = {k[:-8] for k, v in json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))["boards"].items() if v.get("page") == "archivo"}
    renombrados = []
    for f in sorted(PROJ.glob("*.dc.html")):
        n = f.name[:-8]
        if n in archivo or n == "Criterio-Decisiones":
            continue
        t = f.read_text(encoding="utf-8")
        if "Así lo ve el empleado" in t:
            f.write_text(t.replace("Así lo ve el empleado", "Así lo ve quien lo recibe"), encoding="utf-8")
            renombrados.append(n)
    print("vista previa renombrada en", renombrados)
    registrar()
    print("listo", TABLEROS)
