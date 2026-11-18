"""La tanda 4 del traspaso 15 en los tableros de la etapa 25, documentos por WhatsApp y la IA que arma (2026-11-18, sin publicar):
suma a los nueve tableros que dibujó `formularios_25_documentos_1004.py` los estados que salen de las decisiones 215 a 222 de la hoja
de ruta del back (`docs/plans/2026-10-12-formularios-dinamicos-hoja-de-ruta.md`, §5), con las piezas y el estilo de cada tablero, y
corrige los textos que esas decisiones cambian. Es el «Grupo B» de la lista de la tanda.

- `FRM-Documentos` y `M-FRM-Documentos`:
  - «Venció» (215): la bandeja filtrada por «Estado: Descartado», con un comprobante que nadie revisó en 90 días; su fila dice cuándo
    se borra, como el otro descartado, y el panel lo dice en la grilla de sus datos («Motivo»: «Nadie lo revisó en 90 días: venció.»),
    con «Volver a abrir» al pie, como un descartado de ArquitecturaBase (la confirmación de «Descartar» ya dice que se puede);
  - «Protegido»: un PDF con contraseña queda sin leer: el visor muestra el candado y donde va la lectura, «Protegido: tiene
    contraseña.»; «Sin leer por el tope del día» (217), igual, con «Sin leer: se llegó al tope de lecturas de hoy.». Los dos quedan
    «Sin clasificar» (sin formulario), con «Descartar» y «Pasar al formulario» apagado hasta elegir uno, y sin «Armar formulario con
    la IA», que necesita la lectura;
  - «Pasar un repetido»: «Pasar al formulario» abre «¿Pasarlo igual?», con «Ya está cargado en COB-000122 desde el 03/11/2026, 10:00.»,
    «Cancelar» con el foco y «Pasar igual» (en el teléfono, la hoja);
  - el (i) de «Formulario» en el panel, donde se puede cambiar: «Vuelve a sacar los datos de lo que ya se leyó, sin leer el documento
    otra vez.». No va en un documento sin leer, donde no sería cierto.
- `FRM-Editor-Lectura` y `M-FRM-Editor-Lectura` (216):
  - los ejemplos dejan de decir que «se suman» (sugería que iban a la IA): «Ejemplos», con su (i) «Los ve el equipo para mejorar
    «Cómo reconocerlo» y las preguntas. No se mandan a la IA.», las correcciones de los últimos 30 días y «Ver los ejemplos»;
  - «Sin Ver respuestas»: sin «Ver los ejemplos»;
  - «Lo escribió la IA»: el borrador «Remito de entrega» que deja «Armar formulario con la IA» (sus dos «Crear borrador» llevan a este
    tablero), con la marca «Lo escribió la IA» en «Cómo reconocerlo» y su (i) «Revisalo antes de publicar: así reconoce los documentos
    que llegan.»; como todavía no leyó nada, sin ejemplos ni «Cómo viene leyendo».
- `WA-Chats-Documento` y `M-WA-Chats-Documento`: el texto fijo del PDF con contraseña («Este PDF tiene contraseña. ¿Me mandás uno sin
  ella?»), la planilla con varias filas («Recibí una planilla con 7 filas de «Cobranzas».», cada carga con «1 de 3 · …» y la línea de
  que las otras 4 quedaron en «Documentos recibidos»), «El tope del día» (217) y «Una planilla de más de 50 filas»; el teléfono suma
  también el PDF con contraseña.
- `Asistente-Org-25` y `M-Asistente-Org-25`: armar desde un documento («Leyendo el documento…» y la tarjeta con «Lee documentos» y lo
  leído en cada pregunta), «El prefijo corregido» (PED26), «Importar en un catálogo que existe» (222), «La propuesta no entra» y
  «Borrar la conversación» («Se borran también sus archivos y audios.»).
- `M-WA-Armar-Con-IA`: los dos «No lo creé: …», «Una planilla con pedido» (221) e «Importar en uno que existe» (222), con el enlace
  «Revisar la importación»: por WhatsApp no se importa.

Lo que la lista no fijaba y se resolvió por lo más simple: el número del repetido sigue la numeración del ejemplo (COB-000122, no
«REC-12»); los documentos sin leer se ven en la bandeja filtrada por «Sin clasificar» y el que venció, por «Descartado», así no cambian
los totales; el aviso de un turno que falla es blanco, con el filo y el octógono del error (210).

Uso: `python tanda4_documentos_1004.py`. Corre después de `formularios_t15_1004.py` y antes de la pasada de las piezas, que imprime al
final (`python traspaso10_piezas_1004.py --tableros …`). Cada estado nuevo clona los bloques del estado más parecido y cambia solo lo
suyo, así lleva el marcado y la escala que el tablero ya tiene; el CSS nuevo va en un bloque `<style data-t4="documentos">` que se suma
una sola vez, con los px de antes de la escala (la pasada de las piezas los escala en la compu). No toca `canvas.json`. Lee y escribe
sin cambiar los finales de línea, y se puede volver a correr sin cambiar nada: un estado sumado no se suma otra vez y un texto cambiado
no vuelve a encontrar el viejo.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t)


def cambiar(t, viejo, nuevo, veces=1, hecho=None):
    """`viejo` por `nuevo`, que está `veces` veces. Si ya no está, es una corrida anterior: tiene que estar `hecho` (o `nuevo`)."""
    k = t.count(viejo)
    if k == 0:
        assert (nuevo if hecho is None else hecho) in t, ("no encuentro", viejo[:200])
        return t
    assert k == veces, (viejo[:200], k, veces)
    return t.replace(viejo, nuevo)


def cierre(t, i, etiqueta):
    """El fin del elemento `<etiqueta …>` que empieza en `i`, contando los del mismo nombre que tiene adentro."""
    prof = 0
    for m in re.compile(rf"<{etiqueta}\b|</{etiqueta}>").finditer(t, i):
        prof += 1 if m.group(0) != f"</{etiqueta}>" else -1
        if prof == 0:
            return m.end()
    raise AssertionError(f"<{etiqueta}> sin cerrar en {i}")


def elemento(t, inicio, etiqueta, desde=0):
    """(principio, fin) del elemento que empieza con el texto `inicio`, buscado desde `desde`."""
    i = t.index(inicio, desde)
    return i, cierre(t, i, etiqueta)


def reemplazar_elemento(t, inicio, etiqueta, nuevo):
    a, b = elemento(t, inicio, etiqueta)
    return t[:a] + nuevo + t[b:]


def quitar_elemento(t, inicio, etiqueta):
    return reemplazar_elemento(t, inicio, etiqueta, "")


def uno(t, viejo, nuevo):
    """En lo que se está armando (un bloque clonado): `viejo` tiene que estar una vez."""
    assert t.count(viejo) == 1, (viejo[:200], t.count(viejo))
    return t.replace(viejo, nuevo)


def todos(t, viejo, nuevo):
    assert viejo in t, viejo[:200]
    return t.replace(viejo, nuevo)


# ---------------------------------------------------------------------------------------------------------------- los estados
def apertura(s):
    return re.compile(r'<sc-if value="\{\{s' + str(s) + r'\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">')


def bloques(t, s):
    return [(m.start(), cierre(t, m.start(), "sc-if")) for m in apertura(s).finditer(t)]


def bloque(t, s, numero=0):
    a, b = bloques(t, s)[numero]
    return t[a:b]


def estados(t):
    return json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))


def indice(t, nombre):
    return estados(t).index(nombre)


def con_apertura(copia, otro):
    """El bloque `otro` (de otro estado), con la apertura del bloque clonado `copia`."""
    return copia[:copia.index(">") + 1] + otro[otro.index(">") + 1:]


def envolver(t, nombre, html):
    return f'<sc-if value="{{{{s{indice(t, nombre)}}}}}" hint-placeholder-val="{{{{no}}}}">{html}</sc-if>'


def sumar_estado(t, base, nombre, despues_de, cambio=None, valores=None):
    """Suma el estado `nombre` clonando los bloques del estado `base` (su nombre), cada uno pasado por `cambio(numero, copia)`; si
    devuelve "", ese bloque no va. En el Tweak va después de `despues_de`; en la lógica, al final, así los demás conservan su número.
    Lo que la lógica elige por estado (`[…][k]`, `[…].includes(e)` y `{…}[e]`) lleva lo de la base, salvo lo que diga `valores`."""
    m = re.search(r'"estado":\{"editor":"enum","options":\[([^\]]*)\]', t)
    opciones = json.loads("[" + m.group(1) + "]")
    if nombre in opciones:
        return t
    lista = estados(t)
    b = lista.index(base)
    nuevo = len(lista)
    opciones.insert(opciones.index(despues_de) + 1, nombre)
    t = t[:m.start(1)] + ",".join(json.dumps(o, ensure_ascii=False) for o in opciones) + t[m.end(1):]
    mk = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    t = t[:mk.start(1)] + json.dumps(lista + [nombre], ensure_ascii=False) + t[mk.end(1):]
    # `sN: k === N`: un renglón por estado, o todos en el `return { … }` de una línea.
    ml = re.search(rf"( *)s{nuevo - 1}: k === {nuevo - 1},(\r?\n)", t)
    if ml:
        t = t[:ml.end()] + f"{ml.group(1)}s{nuevo}: k === {nuevo},{ml.group(2)}" + t[ml.end():]
    else:
        mi = re.search(rf"s{nuevo - 1}: k === {nuevo - 1}(?= *\}})", t)
        assert mi, (nombre, "sN")
        t = t[:mi.end()] + f", s{nuevo}: k === {nuevo}" + t[mi.end():]
    # Lo que se elige por estado, solo en `renderVals` (el resto del script es del tablero de base).
    i = t.index("const k = ")
    j = t.index("\n  }", i)
    logica = t[i:j]
    valores = valores or {}
    for ma in list(re.finditer(r"(\w+): (\[[^\]]*\])\[k\]", logica)):
        v = json.loads(ma.group(2))
        assert len(v) == nuevo, (ma.group(1), len(v), nuevo)
        logica = logica.replace(ma.group(0), f"{ma.group(1)}: {json.dumps(v + [valores.get(ma.group(1), v[b])], ensure_ascii=False)}[k]", 1)
    for ma in list(re.finditer(r"(\w+): (\[[^\]]*\])\.includes\(e\)", logica)):
        v = json.loads(ma.group(2))
        if base in v:
            logica = logica.replace(ma.group(0), f"{ma.group(1)}: {json.dumps(v + [nombre], ensure_ascii=False)}.includes(e)", 1)
    for ma in list(re.finditer(r"(\w+): (\{[^{}]*\})\[e\]", logica)):
        d = json.loads(ma.group(2))
        d[nombre] = valores.get(ma.group(1), d.get(base))
        logica = logica.replace(ma.group(0), f"{ma.group(1)}: {json.dumps(d, ensure_ascii=False)}[e]", 1)
    t = t[:i] + logica + t[j:]
    # Cada bloque de la base, clonado justo después del suyo.
    partes, i = [], 0
    for numero, (a, z) in enumerate(bloques(t, b)):
        copia = apertura(b).sub(f'<sc-if value="{{{{s{nuevo}}}}}" hint-placeholder-val="{{{{no}}}}">', t[a:z], count=1)
        partes += [t[i:z], cambio(numero, copia) if cambio else copia]
        i = z
    assert partes, (nombre, base)
    partes.append(t[i:])
    return "".join(partes)


def insertar(t, ancla, html, marca, antes=True):
    """`html` junto a `ancla` (que está una vez), salvo que `marca` ya esté: una corrida anterior."""
    if marca in t:
        return t
    assert t.count(ancla) == 1, (ancla[:160], t.count(ancla))
    i = t.index(ancla) + (0 if antes else len(ancla))
    return t[:i] + html + t[i:]


def con_css(t, css):
    """El bloque de estilo de la tanda, una sola vez: la pasada de las piezas escala sus px y no se vuelve a escribir."""
    if 'data-t4="documentos"' in t:
        return t
    n = "\r\n" if "\r\n" in t else "\n"
    return t.replace("</helmet>", f'<style data-t4="documentos">{n}{css.replace(chr(10), n)}</style>{n}</helmet>', 1)


# ---------------------------------------------------------------------------------------------------------------- las piezas
def svg(trazos, tam=18, grosor="1.75"):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{grosor}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{trazos}</svg>')


INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 14)
CHISPA = svg('<path d="M12 3.5 13.8 9 19.5 10.5 13.8 12 12 17.5 10.2 12 4.5 10.5 10.2 9z"/><path d="M18.5 16v4M16.5 18h4"/>', 15)
CANDADO = svg('<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.5"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>', 22)
OCTOGONO = svg('<path d="M8.7 3h6.6L21 8.7v6.6L15.3 21H8.7L3 15.3V8.7z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/>', 16, "2")
ENLACE_IC = svg('<path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', 15, "2")


def info(texto):
    return f'<span class="f-i" tabindex="0" role="img" aria-label="{texto}" title="{texto}">{INFO}</span>'


def mini(tipo):
    letras = {"pdf": "PDF", "docx": "DOCX", "xlsx": "XLSX"}.get(tipo, "")
    return f'<span class="d25-mini {tipo}" aria-hidden="true">{letras}</span>'


def vista_previa(texto):
    """La vista previa de la lista de chats: como la arma `chat_documento`."""
    return "Asistente: " + re.sub(r"<[^>]+>", "", texto)[:46] + "…"


CHEV_RE = re.compile(r'Elegí una opción (<svg\b.*?</svg>)', re.S)
DESCARGAR_RE = re.compile(r'<button type="button" class="cb cb-sec">(<svg\b.*?</svg>) Descargar</button>', re.S)

# Los textos de la lista de la tanda (decisiones 215 a 222)
AY_CAMBIAR = "Vuelve a sacar los datos de lo que ya se leyó, sin leer el documento otra vez."
VENCIO = "Nadie lo revisó en 90 días: venció."
PROTEGIDO = "Protegido: tiene contraseña."
TOPE = "Sin leer: se llegó al tope de lecturas de hoy."
REPETIDO_TIT, REPETIDO = "¿Pasarlo igual?", "Ya está cargado en COB-000122 desde el 03/11/2026, 10:00."
AY_EJEMPLOS = "Los ve el equipo para mejorar «Cómo reconocerlo» y las preguntas. No se mandan a la IA."
AY_IA = "Revisalo antes de publicar: así reconoce los documentos que llegan."
CHAT_TOPE = "Por hoy llegué al tope de documentos que puedo leer. Lo dejé para que lo revise el equipo."
CHAT_PDF = "Este PDF tiene contraseña. ¿Me mandás uno sin ella?"
CHAT_50 = "Por acá cargo planillas de hasta 50 filas. Dividila y mandámela de nuevo."
CHAT_PLANILLA = "Recibí una planilla con 7 filas de «Cobranzas»."
CHAT_RESTO = "Las otras 4 filas quedaron en Documentos recibidos"
PREFIJO = "Dejé el prefijo en PED26: usa solo letras y números."
AY_IMPORTAR = "Importar reemplaza la lista, como subir un Excel. Lo confirmás vos."
NO_ENTRA = "Empezá una conversación nueva y pedila con los cambios."
BORRAR_TIT, BORRAR = "¿Borrar «Formulario de service»?", "Se borran también sus archivos y audios."
NO_CREE_AS, NO_CREE_CUENTA = "No lo creé: este chat ya no está con el asistente.", "No lo creé: tu cuenta ya no está vinculada a este número."

REMITO = "Remito de entrega"
REM_RECONOCER = ("Remito en papel de un proveedor: el número, la fecha, el proveedor con su CUIT, a quién se entrega y una tabla con la cantidad y la "
                 "descripción de cada producto.")
# Las preguntas del borrador que arma la IA desde los remitos (las de `formularios_25_documentos_1004.py`)
REM_PREGUNTAS = [("Número de remito", "Texto corto · Obligatoria"), ("Fecha de entrega", "Fecha · Obligatoria"), ("Proveedor", "Texto corto · Obligatoria"),
                 ("Zona de entrega", "Elegir de un catálogo · Zonas · Obligatoria"), ("Productos", "Bloque · de 1 a 10 ítems · 3 preguntas"),
                 ("Foto del remito", "Foto · 1 · Obligatoria")]
# Qué dato recibe cada pregunta (las del bloque no reciben datos) y su validación fija
REM_DATOS = [("Número de remito", "Texto corto", ""), ("Fecha de entrega", "Fecha", "Formato argentino: 03/11/2026"), ("Proveedor", "Texto corto", ""),
             ("Zona de entrega", "Elegir de un catálogo · Zonas", ""), ("Foto del remito", "Foto · 1", "El documento original, adjunto")]
# Lo leído en remito-0412.jpg, por pregunta (Productos es un bloque: no se lee)
REM_LEIDO = {"Número de remito": "0001-00000412", "Fecha de entrega": "03/11/2026", "Proveedor": "Corralón El Puente S.R.L.", "Zona de entrega": "Zona Oeste",
             "Foto del remito": "remito-0412.jpg"}
# «Proveedores», el catálogo de la 12 (FRM-Catalogo): Texto, Código y Detalle
PROVEEDORES = [("PRV-0001", "Abrasivos del Sur", "CUIT 30-71234567-1"), ("PRV-0002", "Aceros Rosario", "CUIT 30-70988123-4"),
               ("PRV-0003", "Aislantes Norte", "CUIT 33-71011223-9")]


# ================================================================================================ FRM-Documentos
CSS_DOCS = """/* Tanda 4 · un PDF con contraseña, en el visor */
.t4-prot { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; color: var(--t3); }
"""


def fila_doc(nombre, tipo, llego, quien, form, leido, clase, estado, borra, sel=False):
    """Una fila de la bandeja, con las columnas de una página sin clientes (como la de «Con filtros»)."""
    f = f"<span>{form}</span>" if form else '<span><span class="pl-g">—</span></span>'
    l = f"<span>{leido}</span>" if leido else '<span><span class="pl-g">—</span></span>'
    return (f'<div class="w-tr pl{" sel" if sel else ""}"><span><a class="pl-num d25-a" href="#"><span class="d25-arch">{mini(tipo)}<span class="n">{nombre}</span>'
            f'</span></a></span><span>{llego}</span><span class="pl-quien" title="{quien}"><span class="tx">{quien}</span></span>{f}{l}'
            f'<span><span class="w-est {clase}">{estado}</span></span><span></span><span>{borra}</span></div>')


def doc_galicia(h, monto, fecha_hora, operacion):
    """El comprobante del Galicia que dibuja el panel, con otro monto, otra hora y otra operación."""
    h = uno(h, '<div class="m">$ 150.000,00</div>', f'<div class="m">$ {monto}</div>')
    h = uno(h, "03/11/2026 · 10:32", fecha_hora)
    return uno(h, '<span class="k">N° de operación</span>0458 7129 08', f'<span class="k">N° de operación</span>{operacion}')


def documentos(t):
    # El (i) de «Formulario», donde se elige: Un propuesto … Pasando, Descartar, Un sin clasificar y Un remito
    if AY_CAMBIAR not in t:  # un documento sin leer no lo lleva: una corrida anterior lo deja sin el (i)
        t = cambiar(t, '<span class="rt">Formulario</span><div class="ct sel', f'<span class="rt">Formulario{info(AY_CAMBIAR)}</span><div class="ct sel', 9)
    filtrado = bloque(t, indice(t, "Con filtros"), 1)
    galicia = re.search(r'<div class="d25-doc img".*?</div>(?=</div></div><div class="d25-rev">)', bloque(t, indice(t, "Confirmado"), 2), re.S).group(0)

    def vencio(numero, copia):
        if numero == 1:  # la bandeja filtrada por los descartados
            c = con_apertura(copia, filtrado)
            c = uno(c, '<span class="w-pil con" role="button" aria-haspopup="listbox">Estado: Sin clasificar ',
                    '<span class="w-pil con" role="button" aria-haspopup="listbox">Estado: Descartado ')
            c = uno(c, '<span class="pl-chip">Estado: Sin clasificar<button type="button" class="x" aria-label="Quitar Estado: Sin clasificar">',
                    '<span class="pl-chip">Estado: Descartado<button type="button" class="x" aria-label="Quitar Estado: Descartado">')
            c = quitar_elemento(c, '<span class="pl-chip">Llegó: últimos 7 días', "span")
            c = uno(c, ' <span class="n">1</span>', "")
            filas = (fila_doc("ticket.jpg", "ticket", "01/11/2026, 20:10", "Tomás Acosta", "Rendición de gastos de viaje", "$ 52.360,00 en Estación Ruta 8",
                              "off", "Descartado", "30/01/2027")
                     + fila_doc("transferencia.jpg", "img", "04/08/2026, 15:30", "Tomás Acosta", "Cobro a cliente", "$ 94.000,00 del Banco Galicia",
                                "off", "Descartado", "31/01/2027", sel=True))
            a = c.index('<div class="w-tr pl">')
            z = c.index('<div class="w-pie">')
            c = c[:a] + filas + "</div>" + c[z:]
            return uno(c, "<span>1–3 de 3</span>", "<span>1–2 de 2</span>")
        if numero == 2:  # el panel: «Descartado», con el motivo en la grilla y «Volver a abrir»
            c = todos(copia, "comprobante.jpg", "transferencia.jpg")
            c = uno(c, '<span class="w-est ">Confirmado</span>', '<span class="w-est off">Descartado</span>')
            c = uno(c, 'title="Anterior (↑)" disabled>', 'title="Anterior (↑)">')
            c = uno(c, 'title="Siguiente (↓)">', 'title="Siguiente (↓)" disabled>')
            c = uno(c, "Tomás Acosta · por WhatsApp · 03/11/2026, 10:35", "Tomás Acosta · por WhatsApp · 04/08/2026, 15:30")
            c = doc_galicia(c, "94.000,00", "04/08/2026 · 15:28", "0391 2204 17")
            c = reemplazar_elemento(c, '<div class="d25-ro"><span class="k">Formulario</span>', "div",
                                    '<div class="d25-ro"><span class="k">Formulario</span><span>Cobro a cliente</span>'
                                    f'<span class="k">Motivo</span><span>{VENCIO}</span><span class="k">Se borra</span><span>31/01/2027</span></div>')
            for viejo, nuevo in [("Monto</span><span>150.000,00", "Monto</span><span>94.000,00"), ("Fecha</span><span>03/11/2026", "Fecha</span><span>04/08/2026"),
                                 ("Número de operación</span><span>0458 7129 08", "Número de operación</span><span>0391 2204 17"),
                                 ("Concepto</span><span>Factura 0003-00001845</span>", 'Concepto</span><span><span class="pl-g">No se leyó</span></span>'),
                                 ("Hora</span><span>10:32", "Hora</span><span>15:28")]:
                c = uno(c, viejo, nuevo)
            return uno(c, '<span class="pos">1 de 27</span>', '<span class="pos">2 de 2</span><button type="button" class="cb cb-sec">Volver a abrir</button>')
        return "" if numero == 3 else copia  # sin «Guardamos COB-000125.»

    def sin_leer(nombre, tipo, llego, quien, visor_nuevo, linea):
        def cambio(numero, copia):
            if numero == 1:
                c = con_apertura(copia, filtrado)
                a, z = elemento(c, '<div class="w-th pl">', "div")
                c = c[:z] + fila_doc(nombre, tipo, llego, quien, "", "", "amb", "Sin clasificar", "01/02/2027", sel=True) + c[z:]
                return uno(c, "<span>1–3 de 3</span>", "<span>1–4 de 4</span>")
            if numero == 2:
                c = todos(copia, "remito-0412.jpg", nombre)
                c = uno(c, 'title="Anterior (↑)">', 'title="Anterior (↑)" disabled>')
                c = uno(c, "Tomás Acosta · por WhatsApp · 03/11/2026, 09:58", f"{quien} · por WhatsApp · {llego}")
                c = uno(c, info(AY_CAMBIAR), "")  # sin leer, no hay «lo que ya se leyó»
                c = visor_nuevo(c)
                c = reemplazar_elemento(c, '<div class="d25-ir">', "div", f'<div class="d25-lee" role="status">{linea}</div>')
                return uno(c, '<span class="pos">3 de 27</span>', '<span class="pos">1 de 4</span>')
            return copia
        return cambio

    def visor_pdf(c):
        descargar = DESCARGAR_RE.search(c).group(1)
        return reemplazar_elemento(c, '<div class="d25-visor">', "div",
                                   f'<div class="d25-visor"><div class="d25-vbar"><button type="button" class="cb cb-sec">{descargar} Descargar</button></div>'
                                   f'<div class="d25-vfondo"><div class="t4-prot" role="img" aria-label="PDF con contraseña">{mini("pdf")}{CANDADO}</div></div></div>')

    def visor_foto(c):
        return reemplazar_elemento(c, '<div class="d25-doc remito papel"', "div", doc_galicia(galicia, "47.800,00", "03/11/2026 · 11:09", "0462 3381 50"))

    def repetido(numero, copia):
        if numero != 3:
            return copia
        c = todos(copia, "¿Pasar comprobante.jpg a Cobro a cliente?", REPETIDO_TIT)
        c = uno(c, "Se guarda como una respuesta de Tomás Acosta, por WhatsApp, y corren las reglas del formulario.", REPETIDO)
        return uno(c, '<button type="button" class="cb cb-pri">Pasar al formulario</button>', '<button type="button" class="cb cb-pri">Pasar igual</button>')

    t = sumar_estado(t, "Pasar al formulario", "Pasar un repetido", "Pasar al formulario", repetido)
    t = sumar_estado(t, "Confirmado", "Venció", "Descartar", vencio)
    t = sumar_estado(t, "Un sin clasificar", "Protegido", "Un sin clasificar",
                     sin_leer("comprobante-santander.pdf", "pdf", "03/11/2026, 11:05", "Martín Paz", visor_pdf, PROTEGIDO))
    t = sumar_estado(t, "Un sin clasificar", "Sin leer por el tope del día", "Protegido",
                     sin_leer("comprobante-galicia.jpg", "img", "03/11/2026, 11:12", "Paula Méndez", visor_foto, TOPE))
    return con_css(t, CSS_DOCS)


# ================================================================================================ M-FRM-Documentos
CSS_TDOCS = """/* Tanda 4 · el (i) y un PDF con contraseña, en el visor */
.f-i { display: inline-flex; vertical-align: -2px; margin-left: 4px; color: var(--t3); cursor: help; }
.t4-prot { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 100%; color: var(--t3); }
"""


def tel_documentos(t):
    if AY_CAMBIAR not in t:
        t = cambiar(t, '<span class="rt">Formulario</span><div class="ct sel', f'<span class="rt">Formulario{info(AY_CAMBIAR)}</span><div class="ct sel', 3)
    galicia = re.search(r'<div class="d25-doc img".*?</div>(?=</div></div></div><div class="t25-rev">)', bloque(t, indice(t, "Solo ver")), re.S).group(0)

    def vencio(numero, copia):
        c = uno(copia, "<h1>comprobante.jpg</h1>", "<h1>transferencia.jpg</h1>")
        c = uno(c, '<span class="w-est pend">Propuesto</span> · Tomás Acosta · 03/11/2026, 10:35', '<span class="w-est off">Descartado</span> · Tomás Acosta · 04/08/2026, 15:30')
        c = doc_galicia(c, "94.000,00", "04/08/2026 · 15:28", "0391 2204 17")
        c = uno(c, '<div class="t25-cmp"><span class="rt">Formulario</span><span>Cobro a cliente</span></div>',
                '<div class="t25-cmp"><span class="rt">Formulario</span><span>Cobro a cliente</span></div>'
                f'<div class="t25-cmp"><span class="rt">Motivo</span><span>{VENCIO}</span></div><div class="t25-cmp"><span class="rt">Se borra</span><span>31/01/2027</span></div>')
        for viejo, nuevo in [("Monto</span><span>150.000,00", "Monto</span><span>94.000,00"), ("Fecha</span><span>03/11/2026", "Fecha</span><span>04/08/2026"),
                             ("Número de operación</span><span>0458 7129 03", "Número de operación</span><span>0391 2204 17"), ("Hora</span><span>10:32", "Hora</span><span>15:28")]:
            c = uno(c, viejo, nuevo)
        return c[:-len("</sc-if>")] + '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Volver a abrir</button></div></sc-if>'

    def sin_leer(nombre, quien, llego, visor_nuevo, linea):
        def cambio(numero, copia):
            c = uno(copia, "<h1>remito-0412.jpg</h1>", f"<h1>{nombre}</h1>")
            c = uno(c, '<span class="w-est amb">Sin clasificar</span> · Tomás Acosta · 03/11/2026, 09:58', f'<span class="w-est amb">Sin clasificar</span> · {quien} · {llego}')
            c = uno(c, info(AY_CAMBIAR), "")
            c = visor_nuevo(c)
            return uno(c, '<a class="cb cb-sec full" href="M-FRM-Armar-Con-IA.dc.html">Armar formulario con la IA</a>', f'<span class="t25-rec" role="status">{linea}</span>')
        return cambio

    def visor_pdf(c):
        descargar = DESCARGAR_RE.search(c).group(1)
        return reemplazar_elemento(c, '<div class="d25-visor">', "div",
                                   f'<div class="d25-visor"><div class="d25-vbar"><button type="button" class="cb cb-sec">{descargar} Descargar</button></div>'
                                   f'<div class="d25-vfondo"><div class="t4-prot" role="img" aria-label="PDF con contraseña">{mini("pdf")}{CANDADO}</div></div></div>')

    def visor_foto(c):
        return reemplazar_elemento(c, '<div class="d25-doc remito papel"', "div", doc_galicia(galicia, "47.800,00", "03/11/2026 · 11:09", "0462 3381 50"))

    def repetido(numero, copia):
        if numero != 1:
            return copia
        c = todos(copia, "¿Descartar comprobante.jpg?", REPETIDO_TIT)
        c = uno(c, "Se borra el 01/02/2027, con su lectura. Hasta entonces lo podés volver a abrir.", REPETIDO)
        return uno(c, '<button type="button" class="cb cb-pel lleno">Descartar</button>', '<button type="button" class="cb cb-pri lleno">Pasar igual</button>')

    t = sumar_estado(t, "Descartar", "Pasar un repetido", "Un propuesto", repetido)
    t = sumar_estado(t, "Solo ver", "Venció", "Descartar", vencio)
    t = sumar_estado(t, "Un sin clasificar", "Protegido", "Un sin clasificar", sin_leer("comprobante-santander.pdf", "Martín Paz", "03/11/2026, 11:05", visor_pdf, PROTEGIDO))
    t = sumar_estado(t, "Un sin clasificar", "Sin leer por el tope del día", "Protegido",
                     sin_leer("comprobante-galicia.jpg", "Paula Méndez", "03/11/2026, 11:12", visor_foto, TOPE))
    return con_css(t, CSS_TDOCS)


# ================================================================================================ FRM-Editor-Lectura
CSS_EDITOR = """/* Tanda 4 · «Lo escribió la IA», al lado de «Cómo reconocerlo» */
.t4-ia { display: inline-flex; align-items: center; gap: 4px; margin-left: 10px; font-weight: 400; color: var(--t2); }
.t4-ia > svg { color: var(--marca-tx); }
"""
EJ_VIEJO = ('<span class="lin">Se suman como ejemplos las correcciones de la bandeja: <b>6</b> en los últimos 30 días.'
            '<button type="button" class="cb cb-sec">Ver los ejemplos</button></span>')
EJ_BOTON = '<button type="button" class="cb cb-sec">Ver los ejemplos</button>'
EJ_TEXTO = "<span>6 correcciones de la bandeja en los últimos 30 días</span>"
EJ_NUEVO = f'<span class="lin"><span><b>Ejemplos</b>{info(AY_EJEMPLOS)}</span>{EJ_TEXTO}{EJ_BOTON}</span>'
MARCA_IA = f'<span class="t4-ia">{CHISPA} Lo escribió la IA{info(AY_IA)}</span>'


def q_it(plantilla, k, nombre, detalle, total):
    """Una pregunta de la lista del editor, a partir de la primera de la lista (la de «Cliente»)."""
    h = uno(plantilla, '<span class="num">1</span>', f'<span class="num">{k}</span>')
    h = uno(h, "<b>Cliente</b><span>Elegir de un catálogo · Clientes · Obligatoria</span>", f"<b>{nombre}</b><span>{detalle}</span>")
    for accion in ("Subir", "Bajar", "Editar", "Quitar"):
        h = uno(h, f'aria-label="{accion} Cliente"', f'aria-label="{accion} {nombre}"')
    h = re.sub(r'(aria-label="Subir [^"]*" aria-disabled=")\w+', lambda m: m.group(1) + ("true" if k == 1 else "false"), h)
    return re.sub(r'(aria-label="Bajar [^"]*" aria-disabled=")\w+', lambda m: m.group(1) + ("true" if k == total else "false"), h)


def editor_ia(numero, copia):
    """«Lo escribió la IA»: el borrador «Remito de entrega» que deja «Armar formulario con la IA», sobre «Un formulario propio»."""
    if numero == 0:
        c = uno(copia, "<h1>Pago de servicios</h1>", f"<h1>{REMITO}</h1>")
        c = uno(c, '<span class="w-est">Publicado · versión 4</span>', '<span class="w-est off">Borrador</span>')
        c = uno(c, '<a class="cb cb-sec" href="FRM-Publicando.dc.html">Ver vista oficial</a>', "")
        return quitar_elemento(c, '<span class="e-kw">', "span")
    c = uno(copia, 'Respuestas <span class="c">24</span>', "Respuestas")
    c = uno(c, '<div class="ct">Pago de servicios</div>', f'<div class="ct">{REMITO}</div>')
    c = uno(c, '<div class="ct">Enviar comprobante</div>', '<div class="ct">Cargar remito</div>')
    c = todos(c, "Las respuestas se numeran SER-000001.", "Las respuestas se numeran REM-000001.")
    c = uno(c, '<div class="ct ro">SER</div>', '<div class="ct">REM</div>')
    # Las preguntas
    a = c.index('<div class="q-it">')
    plantilla = c[a:cierre(c, a, "div")]
    z = a
    while c.startswith('<div class="q-it">', z):
        z = cierre(c, z, "div")
    c = c[:a] + "".join(q_it(plantilla, k, n, d, len(REM_PREGUNTAS)) for k, (n, d) in enumerate(REM_PREGUNTAS, 1)) + c[z:]
    # Así lo ve quien lo recibe
    chev = CHEV_RE.search(c).group(1)
    c = uno(c, '<span class="pv-x">×</span>Pago de servicios</div>', f'<span class="pv-x">×</span>{REMITO}</div>')
    campos = "".join(f'<div class="pv-c">{n}<div class="pv-in">{v}</div></div>' for n, v in
                     [("Número de remito", ""), ("Fecha de entrega", f"Elegí una fecha {chev}"), ("Proveedor", ""), ("Zona de entrega", f"Elegí una opción {chev}")])
    c = reemplazar_elemento(c, '<div class="pv-hb">', "div", f'<div class="pv-hb">{campos}</div>')
    # La lectura: «Cómo reconocerlo» lo escribió la IA; sin ejemplos ni lecturas todavía
    a, z = elemento(c, '<span class="rt">Cómo reconocerlo', "span")
    c = c[:z - len("</span>")] + MARCA_IA + c[z - len("</span>"):]
    c = reemplazar_elemento(c, '<div class="ct area">', "div", f'<div class="ct area">{REM_RECONOCER}</div>')
    c = uno(c, EJ_TEXTO + EJ_BOTON, "<span>Todavía no hay correcciones</span>")
    a = c.index('<div class="d25-lt">')
    f0 = c.index('<div class="f">', a)
    fila = c[f0:cierre(c, f0, "div")]
    sel = re.search(r'<div class="ct sel">Banco o billetera de origen(<svg\b.*?</svg>)</div>', fila, re.S).group(1)
    filas = "".join(f'<div class="f"><span class="dt"><b style="font-weight: 600;">{n}</b><small>{tipo}</small></span><div class="rel"><div class="ct sel">{n}{sel}</div></div>'
                    f'<div class="ct sel{"" if v else " ph"}">{v or "Ninguna"}{sel}</div></div>' for n, tipo, v in REM_DATOS)
    z = cierre(c, a, "div")
    c = c[:f0] + filas + "</div>" + c[z:]
    a, z = elemento(c, '<div class="d25-box"><b>Cruce con catálogos</b>', "div")
    caja = c[a:z]
    cmp0 = caja.index('<div class="w-cmp">')
    dato = caja[cmp0:cierre(caja, cmp0, "div")]
    dato = re.sub(r'<div class="ct sel"( style="[^"]*")?>CUIT o CUIL de origen', r'<div class="ct sel ph"\1>Ninguno', dato)
    c = c[:a] + f"<div class=\"d25-box\"><b>Cruce con catálogos</b>{dato}</div>" + c[z:]
    c = uno(c, '<span class="d25-sw on" role="switch" aria-checked="true">', '<span class="d25-sw" role="switch" aria-checked="false">')
    c = quitar_elemento(c, '<span class="d25-num">Lleva <b>14</b>', "span")
    a, z = elemento(c, '<span class="d25-num"><b>118</b>', "span")
    z = cierre(c, c.index('<div class="d25-prec">', z), "div")
    return c[:a] + '<span class="d25-num">Todavía no leyó ningún documento.</span>' + c[z:]


def sin_ejemplos(boton):
    """«Sin Ver respuestas»: el mismo estado, sin el botón de los ejemplos (que está una vez, en el cuerpo)."""
    return lambda numero, copia: uno(copia, boton, "") if boton in copia else copia


def editor_lectura(t):
    t = cambiar(t, EJ_VIEJO, EJ_NUEVO, 5, hecho="<b>Ejemplos</b>")
    t = sumar_estado(t, "Lectura de documentos", "Sin Ver respuestas", "Ver los ejemplos", sin_ejemplos(EJ_BOTON))
    t = sumar_estado(t, "Un formulario propio", "Lo escribió la IA", "Un formulario propio", editor_ia)
    return con_css(t, CSS_EDITOR)


# ================================================================================================ M-FRM-Editor-Lectura
CSS_TEDITOR = """/* Tanda 4 · el (i) y «Lo escribió la IA» */
.f-i { display: inline-flex; vertical-align: -2px; margin-left: 4px; color: var(--t3); cursor: help; }
.t4-ia { display: inline-flex; align-items: center; gap: 4px; margin-left: 8px; font-weight: 400; color: var(--t2); }
.t4-ia > svg { color: var(--marca-tx); }
"""
TEJ_VIEJO = '<a class="lnk" href="#">Ver los 6 ejemplos</a>'
TEJ_LINK = '<a class="lnk" href="#">Ver los ejemplos</a>'
TEJ_NUEVO = f'<div class="t25-cmp"><span class="rt">Ejemplos{info(AY_EJEMPLOS)}</span>{EJ_TEXTO}{TEJ_LINK}</div>'


def tel_editor_ia(numero, copia):
    c = uno(copia, "<h1>Cobro a cliente</h1>", f"<h1>{REMITO}</h1>")
    a = c.index("Viene de «")
    a = c.rindex('<span class="t25-rec">', 0, a)
    c = c[:a] + c[cierre(c, a, "span"):]
    c = uno(c, '<span class="rt">Cómo reconocerlo</span>', f'<span class="rt">Cómo reconocerlo{MARCA_IA}</span>')
    a, z = elemento(c, '<div class="ct">Comprobante de una transferencia', "div")
    c = c[:a] + f'<div class="ct">{REM_RECONOCER}</div>' + c[z:]
    c = uno(c, EJ_TEXTO + TEJ_LINK, "<span>Todavía no hay correcciones</span>")
    a = c.index('<div class="ap-fila">')
    z = a
    while c.startswith('<div class="ap-fila">', z):
        z = cierre(c, z, "div")
    filas = "".join(f'<div class="ap-fila"><div class="tx"><span class="l1">{n}</span><span class="l2">{n} · {v or "sin validación fija"}</span></div></div>' for n, _t, v in REM_DATOS)
    c = c[:a] + filas + c[z:]
    c = uno(c, '<span class="d25-sw on" role="switch" aria-checked="true">', '<span class="d25-sw" role="switch" aria-checked="false">')
    c = quitar_elemento(c, '<span class="d25-num">Lleva <b>14</b>', "span")
    return quitar_elemento(c, '<span class="d25-num"><b>96%</b>', "span")


def tel_editor_lectura(t):
    t = cambiar(t, TEJ_VIEJO, TEJ_NUEVO, 3, hecho="Ejemplos<span")
    t = sumar_estado(t, "Lectura de documentos", "Sin Ver respuestas", "Lectura de documentos", sin_ejemplos(TEJ_LINK))
    t = sumar_estado(t, "Lectura de documentos", "Lo escribió la IA", "Cargar solo si es seguro", tel_editor_ia)
    return con_css(t, CSS_TEDITOR)


# ================================================================================================ WA-Chats-Documento y su teléfono
PDF_VIEJO = "El PDF tiene contraseña y no lo puedo abrir. Mandame uno sin contraseña o una captura del comprobante."
PLANILLA_VIEJA = "La planilla tiene 7 pagos. Te propongo los 3 primeros; los otros 4 quedan para que los revise el equipo."
CARGAS = [("Prellenado · fila 1 de la planilla: $ 21.300,00 de Pinturerías Oeste", "1 de 3 · Cobranza de $ 15.000,00 de Juan Pérez"),
          ("Prellenado · fila 2 de la planilla: $ 18.900,00 de Corralón El Puente", "2 de 3 · Cobranza de $ 18.900,00 de Corralón El Puente"),
          ("Prellenado · fila 3 de la planilla: $ 75.000,00 de Ferretería Rosales", "3 de 3 · Cobranza de $ 75.000,00 de Ferretería Rosales")]


def planilla(t, clase_sis):
    """«Un Excel con varias filas»: lo fijo de la planilla, cada carga «1 de 3 · …» y, al final, que el resto quedó en la bandeja."""
    a, z = bloques(t, indice(t, "Un Excel con varias filas"))[0]
    h = t[a:z]
    h = cambiar(h, PLANILLA_VIEJA, CHAT_PLANILLA)
    for viejo, nuevo in CARGAS:
        h = cambiar(h, viejo, nuevo)
    if CHAT_RESTO not in h:
        h = h[:-len("</sc-if>")] + f'<span class="{clase_sis}">{CHAT_RESTO}</span></sc-if>'
    return t[:a] + h + t[z:]


def chat_documento(t):
    t = cambiar(t, PDF_VIEJO, CHAT_PDF)
    t = cambiar(t, vista_previa(PDF_VIEJO), vista_previa(CHAT_PDF))  # la vista previa de la lista de chats
    t = planilla(t, "o-sis")

    def cincuenta(numero, copia):
        if numero:
            return copia
        c = uno(copia, '<span class="d25-mini xlsx" aria-hidden="true">XLSX</span>pagos.xls · 44 KB',
                '<span class="d25-mini xlsx" aria-hidden="true">XLSX</span>cobranzas-octubre.xlsx · 128 filas · 52 KB')
        return uno(c, "No puedo abrir planillas de Excel viejas (.xls). Mandame un PDF o guardala como .xlsx.", CHAT_50)

    def tope(numero, copia):
        if numero:
            return copia
        c = re.sub(r"Ese comprobante ya se cargó el [^<]*", CHAT_TOPE, copia, count=1)
        assert CHAT_TOPE in c
        return todos(c, "10:43", "18:20")

    t = sumar_estado(t, "Un formato viejo", "Una planilla de más de 50 filas", "Un Excel con varias filas", cincuenta, {"vistaPrevia": vista_previa(CHAT_50)})
    return sumar_estado(t, "Repetido", "El tope del día", "Un formato viejo", tope, {"vistaPrevia": vista_previa(CHAT_TOPE)})


def tel_chat_documento(t):
    t = planilla(t, "ap-sis")
    base = bloque(t, indice(t, "Foto movida"))
    doc = base[base.index('<div class="ap-m ent">'):cierre(base, base.index('<div class="ap-m ent">'), "div")]

    def con(mensaje_doc, texto, hora):
        def cambio(numero, copia):
            if numero:
                return copia
            c = uno(copia, doc, mensaje_doc)
            c = uno(c, "No se lee bien el número de operación ni la cuenta de origen. ¿Me mandás otra foto, con el comprobante entero y con buena luz?", texto)
            return todos(c, "10:40", hora)
        return cambio

    archivo = lambda tipo, nombre, hora: (f'<div class="ap-m ent"><span class="gl d25-gl"><span class="d25-fn">{mini(tipo)}{nombre}</span></span>'
                                          f'<span class="pie">{hora}</span></div>')
    t = sumar_estado(t, "Foto movida", "PDF con contraseña", "Foto movida", con(archivo("pdf", "comprobante.pdf · 1 página · 120 KB", "10:41"), CHAT_PDF, "10:41"))
    t = sumar_estado(t, "Foto movida", "El tope del día", "PDF con contraseña", con(doc.replace(" chico movida", " chico", 1).replace("380 KB", "412 KB", 1), CHAT_TOPE, "18:20"))
    return sumar_estado(t, "Foto movida", "Una planilla de más de 50 filas", "Un Excel con varias filas",
                        con(archivo("xlsx", "cobranzas-octubre.xlsx · 128 filas · 52 KB", "10:28"), CHAT_50, "10:28"))


# ================================================================================================ Asistente-Org-25 y su teléfono
CSS_INICIO = """/* Tanda 4 · lo leído en cada pregunta, la tarjeta de importar y el turno que falla (210) */
.d25-card .q small.t4-lei { color: var(--t3); }
.d25-card .f-i { display: inline-flex; vertical-align: middle; margin-left: 4px; color: var(--t3); cursor: help; }
.d25-card .mues.t4-imp .f { grid-template-columns: 90px minmax(0, 1fr) minmax(0, 1fr); }
.as-fallo.t4-fallo { background: #fff; color: var(--t1); border: 1px solid var(--borde2); border-left: 3px solid var(--peligro); }
.as-fallo.t4-fallo > svg { color: var(--peligro); }
"""
PEDIDO_REM = "Armame un formulario para registrar los remitos de entrega de los proveedores, con los productos que trae cada uno."
ADJ_REMITO = ('<span class="as-adj"><span class="ic"><span class="d25-mini img" aria-hidden="true"></span></span><span class="n">remito-0412.jpg</span>'
              '<span class="p">640 KB</span></span>')


def con_lectura(h):
    """La tarjeta del formulario que se armó desde un documento: «Lee documentos» y lo leído en cada pregunta."""
    h = uno(h, '<span class="s">REM · 6 preguntas</span>', '<span class="s">REM · 6 preguntas · Lee documentos</span>')
    for k, (n, d) in enumerate(REM_PREGUNTAS, 1):
        if n in REM_LEIDO:
            viejo = f"<span>{k}. {n}</span><small>{d.replace(' · Zonas ·', ' · Zonas, ya existe ·')}</small>"
            h = uno(h, viejo, viejo + f'<small class="t4-lei">Leído: {REM_LEIDO[n]}</small>')
    return h


def card_importar(card):
    """La tarjeta «Importar en «Proveedores»» (222), sobre la del catálogo: cada campo con su columna, tres filas y «Revisar la importación»."""
    cols = "".join(f'<div class="q"><span>{c}</span><small>Columna {l}</small></div>' for c, l in [("Código", "A"), ("Texto", "B"), ("Detalle", "C")])
    filas = "".join(f'<div class="f"><span>{a}</span><span>{b}</span><span>{c}</span></div>' for a, b, c in PROVEEDORES)
    return (f'<div class="d25-card"><div class="cab"><b>Importar en «Proveedores»</b><button type="button" class="cb cb-pri">Revisar la importación</button>'
            f'{info(AY_IMPORTAR)}</div><div class="cu"><span class="s">Escritas a mano · Texto · 86 filas</span>{cols}<div class="mues t4-imp">'
            f'<div class="f h"><span>Código</span><span>Texto</span><span>Detalle</span></div>{filas}<div class="mas">y 83 filas más</div></div></div></div>')


def importar(numero, copia):
    c = uno(copia, '<span class="n">proveedores-de-obra.xlsx</span>', '<span class="n">proveedores.xlsx</span>')
    c = uno(c, '<span class="as-burb">Armame un catálogo de proveedores de obra con esta planilla</span>', '<span class="as-burb">Actualizá Proveedores con esto</span>')
    c = uno(c, "<p>Te propongo este catálogo, con la planilla. El código es el CUIT y cada opción, la razón social.</p>",
            "<p>Proveedores ya existe: te propongo importar la planilla ahí. Cada columna va a un campo del catálogo.</p>")
    a, z = elemento(c, '<div class="d25-card">', "div")
    return c[:a] + card_importar(c[a:z]) + c[z:]


def plegada(card):
    return '<div class="d25-card pleg"><b>Formulario</b><span>Remito de entrega</span><span class="etq">Reemplazada</span></div>'


def prefijo(numero, copia):
    """«El prefijo corregido», sobre «Un ajuste»: Lucía pidió «ped-26» y la tarjeta nueva trae PED26, sin preguntas nuevas."""
    c = uno(copia, '<span class="as-burb">Agregá quién lo recibió.</span>', '<span class="as-burb">Usá el prefijo ped-26.</span>')
    c = uno(c, "<p>Agregué «Recibió», obligatoria.</p>", f"<p>{PREFIJO}</p>")
    c = uno(c, '<span class="s">REM · 7 preguntas</span>', '<span class="s">PED26 · 6 preguntas</span>')
    return quitar_elemento(c, '<div class="q"><span>7. Recibió<span class="nueva">', "div")


def fallo():
    return (f'<div class="as-el"><span class="as-av">{CHISPA}</span><div class="as-cont"><div class="as-fallo t4-fallo" role="alert">{OCTOGONO}'
            f'<span>{NO_ENTRA}</span></div></div></div>')


def no_entra(numero, copia):
    """«La propuesta no entra»: sobre la propuesta, otro pedido de cambios y el turno que falla."""
    a = copia.index('<div class="as-el">')
    z = cierre(copia, a, "div")
    return (copia[:z] + '<div class="as-yo"><span class="as-burb">Sumá la firma de quien recibe, la hora de entrega, el estado de cada producto y una foto de cada uno.</span></div>'
            + fallo() + copia[z:])


def inicio(t):
    t = cambiar(t, "Leyendo remito-0412.jpg…", "Leyendo el documento…")
    a, z = bloques(t, indice(t, "Pedido con la foto de un remito"))[0]
    if "Lee documentos" not in t[a:z]:
        t = t[:a] + con_lectura(t[a:z]) + t[z:]
    t = sumar_estado(t, "Un ajuste", "El prefijo corregido", "El prefijo en uso", prefijo)
    t = sumar_estado(t, "Pedido con un Excel", "Importar en un catálogo que existe", "Catálogo creado", importar)
    t = sumar_estado(t, "Pedido con un texto", "La propuesta no entra", "Ya existe", no_entra)
    t = sumar_estado(t, "Pedido con un texto", "Borrar la conversación", "Un audio que no se entendió")
    # «Formulario de service» en la lista, con su ⋮ abierto, y la confirmación, solo en ese estado
    keb = re.search(r'<button type="button" class="as-keb" aria-label="Acciones de Quién entró esta semana">(<svg\b.*?</svg>)</button>', t, re.S).group(1)
    item = ('<div class="as-it "><button type="button" class="as-it-n">Formulario de service</button><span class="envoltura"><button type="button" class="as-keb" '
            f'aria-haspopup="menu" aria-expanded="true" aria-label="Acciones de Formulario de service">{keb}</button></span></div>')
    t = insertar(t, '<div class="as-it "><button type="button" class="as-it-n" onClick="{{asAbrir}}">Quién entró esta semana</button>',
                 envolver(t, "Borrar la conversación", item), ">Formulario de service</button>")
    dialogo = (f'<div class="velo"><div class="dlg chico" role="alertdialog" aria-modal="true" aria-labelledby="t4-bt"><div class="dlg-h"><h2 id="t4-bt">{BORRAR_TIT}</h2></div>'
               f'<div class="dlg-t">{BORRAR}</div><div class="dlg-f"><button type="button" class="b b-sec" autofocus>Cancelar</button>'
               '<button type="button" class="b b-pel">Borrar</button></div></div></div>')
    a, z = elemento(t, '<sc-if value="{{asBorrar}}"', "sc-if")
    t = insertar(t, t[a:z], envolver(t, "Borrar la conversación", dialogo), 'aria-labelledby="t4-bt"', antes=False)
    return con_css(t, CSS_INICIO)


CSS_TINICIO = CSS_INICIO + ".f-i { display: inline-flex; vertical-align: -2px; color: var(--t3); cursor: help; }\n"


def tel_inicio(t):
    def documento(leyendo):
        def cambio(numero, copia):
            c = uno(copia, f'<div class="as-yo"><span class="as-burb">{PEDIDO_REM}</span></div>',
                    f'<div class="as-yo">{ADJ_REMITO}<span class="as-burb">Armame un formulario con esto</span></div>')
            if leyendo:
                a = c.index('<div class="as-el">')
                return (c[:a] + f'<div class="as-el"><span class="as-av">{CHISPA}</span><div class="as-cont"><span class="as-tool"><span class="t10-aro" aria-hidden="true">'
                        '</span> Leyendo el documento…</span></div></div>' + c[cierre(c, a, "div"):])
            return con_lectura(c)
        return cambio

    def prefijo_tel(numero, copia):
        a = copia.index('<div class="as-el">')
        z = cierre(copia, a, "div")
        el = copia[a:z]
        primera = reemplazar_elemento(el, '<div class="d25-card">', "div", plegada(el))
        segunda = uno(el, '<p>Te propongo este formulario. Lo que se repite en cada remito, los productos, va como un bloque. Usé el catálogo Zonas, que ya existe; '
                          'el proveedor quedó como texto. Si querés, armo también un catálogo de proveedores.</p>', f"<p>{PREFIJO}</p>")
        segunda = uno(segunda, '<span class="s">REM · 6 preguntas</span>', '<span class="s">PED26 · 6 preguntas</span>')
        return copia[:a] + primera + '<div class="as-yo"><span class="as-burb">Usá el prefijo ped-26.</span></div>' + segunda + copia[z:]

    t = sumar_estado(t, "Pedido con un texto", "Leyendo el documento", "Pedido con un texto", documento(True))
    t = sumar_estado(t, "Pedido con un texto", "Armar desde un documento", "Leyendo el documento", documento(False))
    t = sumar_estado(t, "Pedido con un texto", "El prefijo corregido", "Ver cómo queda", prefijo_tel)
    t = sumar_estado(t, "Pedido con un Excel", "Importar en un catálogo que existe", "Pedido con un Excel", importar)
    t = sumar_estado(t, "Pedido con un texto", "La propuesta no entra", "Borrador creado", no_entra)
    hoja = (f'<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="{BORRAR_TIT}"><span class="asa"></span><div class="hc"><div><h2>{BORRAR_TIT}</h2></div></div>'
            f'<div class="hb"><p class="ap-txt-l" style="margin: 0;">{BORRAR}</p></div><div class="hp"><button type="button" class="cb cb-pel lleno">Borrar</button>'
            '<button type="button" class="cb cb-sec" autofocus>Cancelar</button></div></div>')

    def borrar(numero, copia):
        return copia + copia[:copia.index(">") + 1] + hoja + "</sc-if>"

    t = sumar_estado(t, "Pedido con un texto", "Borrar la conversación", "Un audio que no se entendió", borrar)
    return con_css(t, CSS_TINICIO)


# ================================================================================================ M-WA-Armar-Con-IA
CSS_WA = """/* Tanda 4 · una planilla en el chat y el botón con enlace */
.wa-doc { margin-bottom: 4px; }
.wa-doc .tx { display: flex; flex-direction: column; min-width: 0; }
.wa-doc .tx small { color: #667781; font-size: 12.5px; }
.wa-bts span.t4-url { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
"""
LISTO = re.compile(r'<div class="wa-m">Listo: armé el borrador <b>Remito de entrega</b>\..*?<span class="h">(10:01)</span></div>', re.S)


def wm(texto, h, yo=False):
    return f'<div class="wa-m{" yo" if yo else ""}">{texto}<span class="h">{h}{" ✓✓" if yo else ""}</span></div>'


def planilla_wa(pie):
    return (f'<div class="wa-m yo"><span class="wa-doc">{mini("xlsx")}<span class="tx">proveedores.xlsx<small>86 filas · 24 KB</small></span></span>{pie}'
            '<span class="h">09:40 ✓✓</span></div>')


RESUMEN_CAT = ("Te propongo el catálogo <b>Proveedores de obra</b>, con las 86 filas de la planilla. El código es el CUIT (columna A), cada opción la razón social (B) "
               "y los campos Rubro (C) y Zona (D). Las primeras tres:<br>30-70912345-5 · Corralón El Puente S.R.L. · Materiales · Oeste<br>"
               "30-71122334-3 · Sanitarios del Sur S.A. · Sanitarios · Sur<br>20-23456789-7 · Electricidad Norte · Electricidad · Norte<br>¿Lo armo?")
RESUMEN_IMP = ("Te propongo importar la planilla en <b>Proveedores</b>: el código sale de la columna A, el texto de la B y el detalle de la C. Son 86 filas, como estas:<br>"
               + "<br>".join(" · ".join(f) for f in PROVEEDORES) + "<br>Importar reemplaza la lista: lo revisás y lo confirmás en la app.")


def tel_wa_armar(t):
    def no_creo(texto):
        def cambio(numero, copia):
            c, k = LISTO.subn(wm(texto, "10:01"), copia)
            assert k == 1
            return c
        return cambio

    def catalogo(pedido, resumen, botones):
        def cambio(numero, copia):
            a = copia.index('<div class="wa-hilo">') + len('<div class="wa-hilo">')
            z = copia.index('<div class="wa-pie">')
            return copia[:a] + planilla_wa(pedido) + wm(resumen, "09:40") + botones + "</div>" + copia[z:]
        return cambio

    t = sumar_estado(t, "Crear el borrador", "No lo creó: sin el asistente", "Crear el borrador", no_creo(NO_CREE_AS))
    t = sumar_estado(t, "Crear el borrador", "No lo creó: sin la cuenta vinculada", "No lo creó: sin el asistente", no_creo(NO_CREE_CUENTA))
    t = sumar_estado(t, "Un catálogo", "Una planilla con pedido", "Catálogo creado",
                     catalogo("Armame un catálogo de proveedores con esto", RESUMEN_CAT, '<div class="wa-bts"><span>Crear catálogo</span><span>Cambiar algo</span></div>'))
    t = sumar_estado(t, "Un catálogo", "Importar en uno que existe", "Una planilla con pedido",
                     catalogo("Actualizá Proveedores con esto", RESUMEN_IMP, f'<div class="wa-bts"><span class="t4-url">{ENLACE_IC} Revisar la importación</span></div>'))
    return con_css(t, CSS_WA)


# ---------------------------------------------------------------------------------------------------------------- el pase
PASES = {"FRM-Documentos": documentos, "M-FRM-Documentos": tel_documentos, "FRM-Editor-Lectura": editor_lectura, "M-FRM-Editor-Lectura": tel_editor_lectura,
         "WA-Chats-Documento": chat_documento, "M-WA-Chats-Documento": tel_chat_documento, "Asistente-Org-25": inicio, "M-Asistente-Org-25": tel_inicio,
         "M-WA-Armar-Con-IA": tel_wa_armar}

if __name__ == "__main__":
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    archivo = [n for n in PASES if canvas["boards"].get(f"{n}.dc.html", {}).get("page") in (None, "archivo")]
    assert not archivo, f"no están vivos: {archivo}"
    cambiados = []
    for nombre, pase in PASES.items():
        t = leer(nombre)
        nuevo = pase(t)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    print("ok", len(PASES), "tableros,", len(cambiados), "cambiados")
    if cambiados:
        print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(cambiados))
