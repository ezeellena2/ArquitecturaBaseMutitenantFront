"""Etapa 14 · Formularios (orden nuevo, decisión 78), con `14-texto-diseno.md` y la §9 de `14-formularios.md` del back.

Los tableros de la E14 los arma `formularios_e12_sin_idioma_1004.py`, que ya suma CA4 (la pregunta de catálogo con «Permitir
elegir varias», más de 20 en varias y la presentación propia), «Un catálogo demasiado grande» al publicar y, al mandar,
menos que el mínimo y una opción que no entra. Acá se separan por etapa (decisión del usuario del 25/10, un tablero por
etapa): la versión de la 14 queda sin lo que llega después, y lo de la 18 pasa a su tablero, con la etapa en el nombre.
- FRM-Editor, FRM-Publicar y FRM-Publicando, sin el ⋮ de la banda (Copiar y Dar de baja son de la 17). FRM-Editor, sin fotos
  ni documentos (FRM-Editor-18); FRM-Publicar, sin «Más de 10 archivos» (FRM-Publicar-18).
- M-FRM-Editor, sin el ⋮, sin las reglas (21) ni la pregunta de foto (M-FRM-Editor-18).
- WA-Chats-Respuesta y M-WA-Conversacion-Respuesta, sin los archivos (sus -18).
- «Mis mensajes» (T16): WA-Mensajes-14 y M-WA-Mensaje-14, con la tarjeta de una respuesta propia de quien vinculó su cuenta.
- Desde la v142, las fechas completas, con año y hora, en la zona de quien mira (formatos.md, decisión del usuario del 25/10):
  nunca «Hoy», «Ayer», «hace 2 minutos» ni «mañana»; y en Chats, nunca un teléfono como nombre (81).
- Desde la v147 (14-texto-diseno.md y la §9 de la spec), los títulos de sección (88) en FRM-Editor, M-FRM-Editor y, de fondo, en
  FRM-Publicar y FRM-Publicando; las versiones de la 18 quedan como estaban. Y FRM-Catalogo-14 y M-FRM-Catalogo-14, nuevos, sobre
  FRM-Catalogo-13: el catálogo «Productos» con la sección «Lo usan», «Quitar» apagado en un campo en uso y la advertencia al darlo de baja.
- Desde la v150 (125 a 129), con el armado real de ArquitecturaBase: «Usado en 2 formularios» va en la banda; un campo en uso no se quita y el diálogo dice dónde está; una
  opción que usa un formulario no se borra y se puede dar de baja.

Corre después de `formularios_12_catalogos_1004.py` y antes de `formularios_etapas_1004.py`. Se puede volver a correr.
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
import formularios_12_catalogos_1004 as K  # noqa: E402
import formularios_13_campos_1004 as T13  # noqa: E402
import formularios_lista_y_ficha_1004 as L  # noqa: E402

PROJ = A.PROJ
APROBADO = True  # el usuario la aprobó el 25/10 («publicalo y commitea», versión 141)
PARA_APROBAR = " · para aprobar"

EDITOR_18 = ["Pregunta de foto", "Pregunta de documento", "Sin almacenamiento"]
EDITOR_17 = ["Acciones del formulario"]
TEL_18 = ["Pregunta de foto"]
PUBLICAR_18 = ["Más de 10 archivos"]
RESPUESTA_18 = ["Bajando los archivos", "Con fotos y un documento", "Muchas fotos", "Reintentando", "No se pudo bajar un archivo", "Un archivo no es lo que dice"]
KEBAB_BANDA = re.compile(r'<span class="e-kw"><button type="button" class="ib o-borde" aria-label="Acciones de [^"]*" aria-haspopup="menu" aria-expanded="false">.*?</button></span>', re.S)
KEBAB_BARRA = re.compile(r'<button type="button" class="ap-ib" aria-label="Acciones de Visita a cliente">.*?</button>', re.S)


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")
def escribir(n, t):
    (PROJ / f"{n}.dc.html").write_text(L.sin_disenar(n, fechas(t)), encoding="utf-8")


def solo(t, estados):
    """Deja solo esos estados (el tablero de una etapa posterior)."""
    return L.sin_estados(t, [e for e in L.opciones_de(t) if e not in estados], estados[0])


def sin(t, estados):
    viejas = L.opciones_de(t)
    defecto = next(e for e in viejas if e not in estados)
    return L.sin_estados(t, estados, defecto if viejas[0] in estados else None)


def sin_kebab(t):
    return KEBAB_BARRA.sub("", KEBAB_BANDA.sub("", t))


def comprobar(n, t, prohibidos):
    html = t[:t.index('<script type="text/x-dc"')]  # sin el JS del tablero (el primer <script> es el de support.js)
    html = re.sub(r'\s(?:title|aria-label)="[^"]*"', "", html)  # lo que va en un ⓘ o en un tooltip no cuenta
    for p in prohibidos:
        assert p not in html, (n, p)


# ================================================================ Las fechas, completas (formatos.md, 25/10)
HOY, AYER = "25/10/2026", "24/10/2026"
FECHAS = [
    ('<span class="w-dia">Hoy</span>', f'<span class="w-dia">{HOY}</span>'), ('<span class="ap-dia">Hoy</span>', f'<span class="ap-dia">{HOY}</span>'),
    ("Se puede mandar hasta mañana a las 10:48.", "Se puede mandar hasta el 26/10/2026 10:48."), (" · hoy, 11:04", f" · {HOY} 11:04"),
    ("<b>Martín Paz</b><span>Ayer</span>", f"<b>Martín Paz</b><span>{AYER} 18:30</span>"),
    ("<b>Federico Díaz</b><span>Ayer</span>", f"<b>Federico Díaz</b><span>{AYER} 17:20</span>"),
    ("<b>Javier Pereyra</b><span>Ayer</span>", f"<b>Javier Pereyra</b><span>{AYER} 09:45</span>"),
    ("<b>Carla Ruiz</b><span>05/10</span>", "<b>Carla Ruiz</b><span>05/10/2026 12:10</span>"),
    # 81: un contacto sin nombre toma el de su perfil de WhatsApp; nunca un teléfono como nombre
    ("<b>0351 15-555-0192</b><span>10:15</span>", f"<b>Sergio Molina</b><span>{HOY} 10:15</span>"),
    ("<b>La Clementina</b><span>17:12</span>", f"<b>La Clementina</b><span>{HOY} 17:12</span>"),
    ("<b>Grupo Delta</b><span>Ayer</span>", f"<b>Grupo Delta</b><span>{AYER} 19:05</span>"),
    ("<b>Ferretería Rosales</b><span>28/09</span>", "<b>Ferretería Rosales</b><span>28/09/2026 11:20</span>"),
]


def fechas(t):
    for a, b in FECHAS:
        t = t.replace(a, b)
    # la hora del chat elegido en la lista, que arma el JS del tablero
    return re.sub(r"(hora: \{[^}]*\}\[e\] \?\? '[^']*')", lambda m: re.sub(r"([\"'])(\d\d:\d\d)([\"'])", rf"\g<1>{HOY} \2\3", m.group(1)), t)


RELATIVAS = ["Hoy<", "Ayer<", "hace 2 minutos", "mañana a las", "hoy, ", "0351 15-555-0192"]


# ================================================================ «Mis mensajes» (T16): la tarjeta de la respuesta propia
CSS_MM = """.w-msjs, .ap-chat { justify-content: flex-end; }
.w-m .gl .c-card, .ap-m .gl .c-card { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 9px 10px; border-radius: 8px; background: #fff; border: 1px solid oklch(0.86 0.04 170); }
.c-card .ic { color: var(--marca-tx); display: inline-flex; }
.c-card .t { display: flex; flex-direction: column; line-height: 1.3; }
.c-card .t b { font-weight: 600; }
.c-card .t small { font-size: 12px; color: var(--t3); }
.w-m:has(.r-gl), .ap-m:has(.r-gl) { width: 72%; max-width: 72%; }
.ap-m:has(.r-gl) { width: 88%; max-width: 88%; }
.w-m .gl.r-gl, .ap-m .gl.r-gl { max-width: none; width: 100%; box-sizing: border-box; padding: 0; overflow: hidden; background: #fff; border: 1px solid var(--borde); color: var(--t1); }
.r-cab { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: oklch(0.975 0.006 78); }
.r-cab svg { color: var(--t2); flex-shrink: 0; }
.r-cab b { font-weight: 600; }
.r-cab small { font-size: 12.5px; color: var(--t3); }
.r-gr { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); font-size: 13.5px; border-top: 1px solid var(--borde); }
.r-gr > span { padding: 8px 12px; border-top: 1px solid var(--borde); }
.r-gr > span:nth-child(-n+2) { border-top: 0; }
.r-gr .k { color: var(--t2); }
.r-ok { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-top: 1px solid var(--borde); background: oklch(0.97 0.03 155); color: oklch(0.4 0.1 155); font-size: 13px; }
.r-ok b { font-weight: 700; }
"""
VALORES_MM = [("¿Retiraste el pedido?", "Sí"), ("Cantidad", "12"), ("¿Cómo estuvo?", "Muy bien")]
ULTIMO = "Gracias, paso a las 17.</span><span class=\"pie\">10:42</span></div>"


def mis_mensajes(t, clase):
    """Después de «Gracias, paso a las 17.»: La Clementina le manda un formulario y la persona ve su respuesta."""
    card = f'<span class="c-card"><span class="ic">{F.ICONO}</span><span class="t"><b>Retiro de pedido</b><small>Formulario</small></span></span>'
    grilla = '<div class="r-gr">' + "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in VALORES_MM) + "</div>"
    nuevo = (f'<div class="{clase} ent"><span class="gl">Completá este formulario, por favor.{card}</span><span class="pie">La Clementina · 17:10</span></div>'
             f'<div class="{clase} sal"><span class="gl r-gl"><span class="r-cab">{F.ICONO}<b>Retiro de pedido</b><small>Tu respuesta</small></span>{grilla}'
             f'<div class="r-ok">{A.TILDE} Guardada como <b>RET-000018</b></div></span><span class="pie">17:12</span></div>')
    assert ULTIMO in t
    t = t.replace(ULTIMO, ULTIMO + nuevo)
    t = t.replace("Vos: Gracias, paso a las 17.", "Vos: Respondiste Retiro de pedido")
    t = re.sub(r'(<b>La Clementina</b><span>)10:42(</span>)', r"\g<1>17:12\2", t)
    return t.replace("</helmet>", f'<style data-e14="mis-mensajes">\n{CSS_MM}</style>\n</helmet>', 1)


# ================================================================ FRM-Catalogo-14 y M-FRM-Catalogo-14: «Productos», con lo que suma la 14
# Sobre FRM-Catalogo-13, con las piezas de formularios_13_campos_1004.py y los datos de la maqueta (demo/seed/forms-catalogs.ts). «Lo usan» es
# la lista de `GET …/catalogs/{id}/used-by`: solo el nombre del formulario, paginada, sin la cantidad en el encabezado y sin la pregunta,
# que el contrato no trae. Un campo que usa la presentación propia de una pregunta no se quita (T22): «Quitar» queda grisado, con el motivo.
CAMPOS_P = [("Precio", "Número con decimales", True, False, None, "precio"), ("Unidad", "Texto", False, False, None, "unidad")]
COLUMNAS_P = ["Texto", "Código", "Detalle"] + [c[0] for c in CAMPOS_P]
DESCRIPCION_P = ["Unidad"]
PRODUCTOS = [("Arena fina", "ARE1", "32.000,00", "m³"), ("Cal hidratada x 25 kg", "CAL25", "5.200,00", "bolsa"), ("Caño PVC 110 x 4 m", "PVC110", "15.800,00", "unidad"),
             ("Cemento x 50 kg", "CEM50", "9.800,00", "bolsa"), ("Hierro del 8 x 12 m", "HIE8", "8.900,00", "barra"), ("Ladrillo hueco", "LAD12", "690,50", "unidad"),
             ("Membrana 4 mm", "MEM4", "61.500,00", "rollo"), ("Pintura látex 20 l", "PIN20", "48.900,00", "balde"), ("Tarugos del 8 x 100", "TAR8", "3.500,00", "caja"),
             ("Tornillos 6x40 x 100", "TOR640", "4.100,00", "caja")]
USAN = ["Entrega de pedido", "Visita a cliente"]
EN_USO = "El campo está en uso. Sacá esos usos para poder quitarlo."
USO_CAMPO = "«Producto» en Entrega de pedido, en la versión activa"
BAJA_TITULO, BAJA_TEXTO = "¿Dar de baja «Productos»?", "Los formularios publicados que lo usan no se van a poder mandar, y no se va a poder elegir en preguntas nuevas. Se puede reactivar desde acá."
DESC_P = "Lo que vende Grupo Delta, con su precio de lista."
ESTADOS_CAT = ["Lo usan", "Ningún formulario lo usa", "Un campo en uso", "Una opción en uso", "Dar de baja el catálogo"]
ESTADOS_TCAT = ["El catálogo", "Lo usan", "Ningún formulario lo usa", "Un campo en uso", "Dar de baja el catálogo"]
CSS_USAN = """.w-th.ku, .w-tr.ku { grid-template-columns: minmax(0, 1fr); }
.w-th .ord { margin-left: 4px; font-size: 10px; color: var(--t2); }
.w-tr.ku { min-height: 40px; }
.w-tr.ku a { color: var(--t1); font-weight: 500; text-decoration: none; }
"""
CSS_TUSAN = """.ap-acciones2 span.off { color: var(--t3); }
.ap-fila.ku { min-height: 52px; }
"""


def opciones_p(uso=False):
    filas = ""
    for k, (n, cod, precio, unidad) in enumerate(PRODUCTOS, 1):
        kw = dict(borrar=True, aviso_f="No se puede borrar: la usa un formulario. Podés darla de baja.") if uso and k == 4 else {}
        filas += K.fila_editable(k, n, cod, "", True, tabla="kf", total=len(PRODUCTOS), campos=f'<span class="k-tab">{K.entrada(precio)}</span><span class="k-tab">{K.entrada(unidad)}</span>', **kw)
    pie = '<div class="w-pie"><span>1–10 de 10</span><span>10 por página · Página 1 de 1</span></div>'
    return K.caja_opciones(filas, "", pie, modo="cambios" if uso else "normal", tabla="kf", cab=["", "#", "Texto", "Código", "Precio", "Unidad", "Detalle", "Estado", "Acciones"], ancho=T13.ANCHO_OPCIONES,
                           boton_campos=T13.boton_campos(2), columnas=True)


def caja_usan(vacia=False):
    """«Lo usan»: una fila por formulario, que lleva al formulario."""
    if vacia:
        cuerpo = '<div class="k-vacio3">Ningún formulario lo usa.</div>'
    else:
        filas = "".join(f'<div class="w-tr ku"><a href="FRM-Editor.dc.html">{n}</a></div>' for n in USAN)
        cuerpo = ('<div class="w-th ku"><span aria-sort="ascending">Formulario<span class="ord" aria-hidden="true">▲</span></span></div>' + filas
                  + f'<div class="w-pie"><span>1–{len(USAN)} de {len(USAN)}</span><span>10 por página · Página 1 de 1</span></div>')
    return f'<div class="w-caja"><div class="f-cab"><span>Lo usan</span></div>{cuerpo}</div>'


def catalogo():
    items = [(n, u) for n, _c, _p, u in PRODUCTOS[:6]]
    ejemplo = (PRODUCTOS[0][0], PRODUCTOS[0][3])

    def cuerpo(vacia=False, uso=False):
        wa = T13.caja_whatsapp(descripcion=DESCRIPCION_P, columnas=COLUMNAS_P, ejemplo=ejemplo)
        return K.cuerpo_editor(opciones_p(uso) + caja_usan(vacia), K.caja_catalogo("Productos", DESC_P), items, "Producto", debajo=wa)
    usado = '<span class="k-us">Usado en 2 formularios ·</span>'
    b = C.banda_k("Productos", usado + K.ACTIVO, K.acc_editor(), "FRM-Catalogos-14.dc.html")
    b2 = C.banda_k("Productos", usado + K.ACTIVO, K.acc_editor(cambios=True), "FRM-Catalogos-14.dc.html")
    V = {"Lo usan": (b, cuerpo()), "Ningún formulario lo usa": (C.banda_k("Productos", K.ACTIVO, K.acc_editor(), "FRM-Catalogos-14.dc.html"), cuerpo(vacia=True)),
         "Un campo en uso": (b, cuerpo()), "Una opción en uso": (b2, cuerpo(uso=True)), "Dar de baja el catálogo": (b, cuerpo())}
    assert list(V) == ESTADOS_CAT
    js = A.js_estados(ESTADOS_CAT, extra="      menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', busqueda: 'Buscar opción', busClase: '',\n")
    t = C.pagina_k("Un catálogo que usan formularios · /org/formularios/catalogos/:id", "Inicio / Formularios / Catálogos / Productos",
                   A.con_estados([(k, v[0]) for k, v in V.items()]), A.con_estados([(k, v[1]) for k, v in V.items()]),
                   F.CSS_FICHA + F.CSS_ESTADOS + F.CSS_LISTADO + F.CSS_FILTRO + A.CSS_AB + E.CSS_E12 + K.CSS_EDITOR + T13.CSS + CSS_USAN, ESTADOS_CAT, js, alto=ALTO_CATALOGO)
    t = t.replace('"$preview":{"width":1440,', '"$preview":{"width":1280,', 1)
    uso = (f'<p class="d-tx">{EN_USO}</p><div class="md-usos"><span>{USO_CAMPO}</span><a href="FRM-Editor.dc.html">Ir a la pregunta</a></div>')
    capas = {"Un campo en uso": F.dialogo("Quitar «Precio»", uso, '<button type="button" class="cb cb-sec">Cerrar</button>'),
             "Dar de baja el catálogo": A.confirmar(BAJA_TITULO, BAJA_TEXTO, "Dar de baja")}
    over = "".join(f'<sc-if value="{{{{s{ESTADOS_CAT.index(k)}}}}}" hint-placeholder-val="{{{{no}}}}">{h}</sc-if>' for k, h in capas.items())
    return F.con_dialogo(t, over, T13.CSS_CAMPOS)


def tel_catalogo():
    der = (f'<button type="button" class="ap-ib" aria-label="Así lo ve quien lo recibe">{F.OJO}</button>'
           f'<button type="button" class="ap-ib" aria-label="Más acciones">{F.TKEBAB}</button>')
    volver = "M-FRM-Catalogos-14.dc.html"
    botones = f'<div class="k-ops-b"><a class="cb cb-sec" href="#">Agregar opción</a><a class="cb cb-sec" href="{T13.DESTINO_T}">Agregar campos<span class="k-cont">2</span></a></div>'
    arriba = (C.t_bar("Productos", "Usado en 2 formularios · Activo", volver, der) + '<div class="ap-cuerpo"><div class="ap-gtit">El catálogo</div><div class="f-campos">'
              + K.tel_de() + F.tcampo("Nombre", "Productos", req=True) + F.tcampo("Descripción", DESC_P) + "</div>"
              + T13.tel_wa(T13.TITULO_WA, DESCRIPCION_P, (PRODUCTOS[0][0], PRODUCTOS[0][3])) + '<div style="height: 20px;"></div></div>')

    def usan(vacia=False):
        """La pantalla ya bajada hasta «Lo usan», la última sección, como en M-FRM-Editor."""
        filas = ('<div class="t-vacia">Ningún formulario lo usa.</div>' if vacia else
                 "".join(f'<a class="ap-fila ku" href="M-FRM-Editor.dc.html"><div class="tx"><span class="l1">{n}</span></div></a>' for n in USAN))
        opciones = "".join(K.q_opcion(k, n, cod, "", True, len(PRODUCTOS)) for k, (n, cod, _p, _u) in enumerate(PRODUCTOS[:3], 1))
        return (C.t_bar("Productos", "Activo" if vacia else "Usado en 2 formularios · Activo", volver, der) + f'<div class="ap-cuerpo"><div class="ap-gtit">Opciones</div>{botones}<div class="ap-grupo">{opciones}</div>'
                + f'<div class="ap-gtit">Lo usan</div><div class="ap-grupo">{filas}</div><div style="height: 20px;"></div></div>')
    Cu = {"El catálogo": arriba, "Lo usan": usan(), "Ningún formulario lo usa": usan(True), "Un campo en uso": arriba, "Dar de baja el catálogo": arriba}
    capas = {
        "Un campo en uso": F.thoja("Quitar «Precio»", f'<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">{EN_USO} {USO_CAMPO}.</p>',
                                   '<a class="cb cb-pri" href="M-FRM-Editor.dc.html">Ir a la pregunta</a><button type="button" class="cb cb-sec">Cerrar</button>'),
        "Dar de baja el catálogo": F.thoja(BAJA_TITULO, f'<p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">{BAJA_TEXTO}</p>',
                                           '<button type="button" class="cb cb-pel lleno">Dar de baja</button><button type="button" class="cb cb-sec">Cancelar</button>'),
    }
    return C.tel_pagina(Cu, ESTADOS_TCAT, capas, "Un catálogo que usan formularios · teléfono", E.CSS_E12 + K.CSS_T12 + T13.CSS_TWA + CSS_TUSAN)


# ================================================================ canvas.json
ALTO_CATALOGO = 1700
NUEVOS = {"FRM-Editor-18": (1440, 1400, "Formularios · un formulario · Diseño · etapa 18"),
          "M-FRM-Editor-18": (390, 844, "Formularios · un formulario · Diseño · teléfono · etapa 18"),
          "FRM-Publicar-18": (1440, 1400, "Formularios · publicar · etapa 18"),
          "WA-Chats-Respuesta-18": (1440, 900, "WhatsApp · Internos · la respuesta · etapa 18"),
          "M-WA-Conversacion-Respuesta-18": (390, 844, "WhatsApp · Internos · la respuesta · teléfono · etapa 18"),
          "WA-Mensajes-14": (1440, 900, "Perfil personal · Mensajes · una respuesta propia · etapa 14"),
          "M-WA-Mensaje-14": (390, 844, "Mensajes · conversación · teléfono · etapa 14"),
          "FRM-Catalogo-14": (1280, ALTO_CATALOGO, "Formularios · catálogo escrito a mano · lo usan · a 1280 · etapa 14"),
          "M-FRM-Catalogo-14": (390, 844, "Catálogo escrito a mano · lo usan · teléfono · etapa 14"),
          # Los arma campana_1004.py; se registran acá para que formularios_etapas_1004.py los ubique en su fila
          "Campana-14": (1440, 900, "Avisos · la campana · etapa 14"),
          "M-Campana-14": (390, 844, "Avisos · la campana · teléfono · etapa 14")}
TOCADOS = ["FRM-Editor", "M-FRM-Editor", "FRM-Publicar", "FRM-Publicando", "WA-Chats-Formulario", "WA-Chats-Respuesta", "M-WA-Conversacion-Respuesta",
           "M-WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente"]


def registrar():
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    b = c["boards"]
    for n, (w, h, titulo) in NUEVOS.items():
        v = b.setdefault(f"{n}.dc.html", {"x": 0, "y": 0, "is_interactive": True})
        v.update(w=w, h=h, page="formularios", title=titulo)
    for n in TOCADOS + list(NUEVOS):
        v = b[f"{n}.dc.html"]
        v["title"] = v["title"].replace(PARA_APROBAR, "") + ("" if APROBADO else PARA_APROBAR)
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    panel_e16 = re.search(r'<style data-e16="panel">\n(.*?)</style>', leer("FRM-Catalogos"), re.S)
    E.R.CSS_PANEL_E16 = panel_e16.group(1) if panel_e16 else ""
    escribir("FRM-Editor-18", solo(E.post("FRM-Editor", E.editor(), 1400), EDITOR_18))
    # El teléfono, sin las reglas que le suma formularios_ab_reglas_1004.py (son de la 21)
    escribir("M-FRM-Editor-18", solo(E.post("M-FRM-Editor", E.tel_editor()), TEL_18))
    escribir("FRM-Publicar-18", solo(E.post("FRM-Publicar", E.publicar(), 1400), PUBLICAR_18))
    E.CON_TITULOS = True  # 88: desde acá, los tableros de la 14
    escribir("FRM-Editor", sin_kebab(sin(E.post("FRM-Editor", E.editor(), 1400), EDITOR_17 + EDITOR_18)))
    escribir("M-FRM-Editor", sin_kebab(sin(E.post("M-FRM-Editor", E.tel_editor()), EDITOR_17 + TEL_18)))
    escribir("FRM-Publicar", sin_kebab(sin(E.post("FRM-Publicar", E.publicar(), 1400), PUBLICAR_18)))
    escribir("FRM-Publicando", sin_kebab(E.post("FRM-Publicando", E.publicando(), 1400)))
    E.CON_TITULOS = False
    for n, t in (("WA-Chats-Respuesta", E.chat_respuesta()), ("M-WA-Conversacion-Respuesta", E.tel_respuesta())):
        t = E.post(n, t)
        escribir(f"{n}-18", solo(t, RESPUESTA_18))
        escribir(n, sin(t, RESPUESTA_18))
    escribir("WA-Mensajes-14", mis_mensajes(F.leer_antes_del_bloque0("WA-Mensajes"), "w-m"))
    escribir("M-WA-Mensaje-14", mis_mensajes(F.leer_antes_del_bloque0("M-WA-Mensaje"), "ap-m"))
    # E.post acorta «Número con decimales» en las preguntas; un campo de catálogo conserva su tipo (13-campos.md)
    escribir("FRM-Catalogo-14", E.post("FRM-Catalogo-14", catalogo()).replace('<span class="k-in sel"><span>Número</span>', '<span class="k-in sel"><span>Número con decimales</span>'))
    escribir("M-FRM-Catalogo-14", E.post("M-FRM-Catalogo-14", tel_catalogo()))
    # Los chats de la 14 que arma formularios_e12_sin_idioma_1004.py: solo las fechas (se puede volver a correr)
    for n in ("WA-Chats-Formulario", "M-WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente"):
        escribir(n, leer(n))
    for n in ("FRM-Editor", "M-FRM-Editor", "FRM-Publicar", "FRM-Publicando"):
        comprobar(n, leer(n), ["Dar de baja", "Fotos de la visita", "Remito firmado", "Cuando llega una respuesta", "Más de 10 archivos"] + RELATIVAS)
    for n in ("WA-Chats-Formulario", "M-WA-Chats-Formulario", "WA-Chats-Formulario-Cliente", "M-WA-Chats-Formulario-Cliente", "WA-Chats-Respuesta",
              "M-WA-Conversacion-Respuesta", "WA-Mensajes-14", "M-WA-Mensaje-14"):
        comprobar(n, leer(n), RELATIVAS)
    registrar()
    print("listo", list(NUEVOS))
