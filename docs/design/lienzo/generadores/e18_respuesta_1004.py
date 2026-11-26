"""La E18 (Fotos y documentos) con el traspaso 18, tanda 3A (2026-11-26): la respuesta, la planilla y la respuesta en el chat,
redibujadas en su lugar (spec `docs/plans/formularios/18-fotos-y-documentos.md`, «Lo que suma a las pantallas que ya existen» y «Se
redibujan con el traspaso 18, tanda 3»). La E18 parte de la forma que la E15 acaba de dejar (`e15_respuesta_1004.py` y
`e15_listados_1004.py`) y de lo que la E14 dejó aprobado en `WA-Chats-Respuesta` (`e14_restos_1004.py`): sus piezas se importan, sin
cambiarlas.

- `FRM-Respuesta-18` (la vista rápida): **la respuesta con la forma de su formulario (266)**, como `FRM-Respuesta`: el número con su
  versión, la línea gris de quién y cuándo (263), las zonas del autor con su grilla y cada pregunta en su control; y, **al final, la
  zona «Fotos y documentos», sin la pestaña «Fotos»**: cada pregunta de archivo es su control de solo lectura, a todo el renglón y con
  su etiqueta arriba; las miniaturas abren el visor, y cada documento lleva su nombre, que lo descarga, y su tamaño al lado, nunca
  debajo (263 y 266). La actividad, como la E15: la pestaña «Actividad», en recuadros (267), sin renglones nuevos (los archivos llegan
  con la respuesta). El visor dice al pie el nombre, el tamaño y la fecha de la foto, la de la respuesta en Formularios, cada uno en
  su lugar (O21, 194 y 263), como `WA-Chats-Visor`. El estado «Fotos» pasa a «Actividad», y suma «Fotos y documentos plegada»
  (VIS-000129: «1 de 2 respondidas», porque no mandó el remito). La planilla de atrás suma la flecha de su orden en «Recibida» (264),
  y la posición al pie sale de ella (VIS-000126 es la 5 de 24; antes decía «2 de 4», 269).
- `FRM-Respuesta-Completa-18`: la misma forma en tres columnas, con «Fotos y documentos» al final y «Actividad» en ocho columnas
  (267), como `FRM-Respuesta-Completa`; la versión en la banda y la línea gris debajo del número. «Descargar ▾» sigue, con cada
  documento y su tamaño al lado. Suma «Fotos y documentos plegada» («2 de 2 respondidas»).
- `M-FRM-Respuesta-18`: la misma forma en una columna y la actividad en recuadros, como `M-FRM-Respuesta`; el número con su versión
  en la barra. Suma «La actividad» (la pantalla bajada hasta ella, con «Fotos y documentos» arriba) y «Fotos y documentos plegada»
  (VIS-000129, bajada hasta la zona).
- `FRM-Respuestas-18`: la planilla como `FRM-Respuestas`: «Empresa» con su botón y la pieza (262), «Columnas» en la pieza múltiple,
  «Ordenar por» último y separado de los filtros, y ↓ después de «Recibida» (264). **La columna de cada pregunta de archivo no
  ordena** (264: tiene varios valores): no lleva flecha, y la pieza de «Ordenar por» no la ofrece (el estado nuevo «Ordenar por
  abierto», con las columnas de la planilla que ordenan: sin Cargó ni las de archivo). En «Filtros», lo que se elige va en la pieza (262), y las fotos y los documentos siguen sin
  filtro (143). En «Exportar», «Columnas» pasa de los dos radios a la pieza, con su (i) abierta, que suma a la de la E15 lo de los
  archivos. El visor, con el pie de la vista rápida.
- `M-FRM-Respuestas-18`: **cada fila es la tarjeta de `M-FRM-Respuestas`** (Recibida, Cargó, Empresas o «Es cliente» y Cliente, cada
  dato con su nombre): las fotos y los documentos ya no van en la tercera línea, unidos con «·» (263); se ven al abrir la respuesta.
  «Ordenar por», a todo el ancho arriba de la lista, y «Filtros» con cada filtro en la pieza, como la E15. La hoja de exportar pierde
  «Columnas» (en el teléfono exporta todas las preguntas, E15), y la (i) de los archivos pasa a «Archivo». Estados nuevos: «Ordenar
  por», «Ordenar por: la columna» (la pieza a pantalla completa, sin las columnas de archivos) y «Exportar: su (i)» (abierta, como
  con un toque, 211).
- `WA-Chats-Respuesta-18` y `M-WA-Conversacion-Respuesta-18`: la tarjeta del formulario, como la E14 aprobada: «Versión» y «Botón»
  en renglones con rótulo, sin «Formulario · versión 3 · botón «…»» (206 y 263); la versión es la 4, la que tiene las preguntas de
  archivo (269, como `FRM-Publicar-18`), y «Muchas fotos» se guarda como VIS-000131, la siguiente a la última de la planilla (la
  VIS-000127 es la de Marta Gil, con 2 fotos). En la respuesta, cada miniatura es su control, que abre el visor, y «+4», el que abre las
  ocho; el documento, su control con el nombre, que lo descarga, y el tamaño al lado, sin «Descargar» ni el tamaño debajo (263). En
  el teléfono, cada pregunta de archivo ocupa el renglón, con su etiqueta arriba, para que el nombre no se corte. Los estados siguen.

Cambia los tableros en su lugar, con las medidas de antes de la escala en un bloque `<style data-e18="t3r">`, que lo frena si ya
está, y al final corre `traspaso10_piezas_1004.py --tableros` con los siete, que pone la escala de la compu. Para volver a correrlo,
primero se restauran los siete (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`: ningún tablero cambia
de alto.
"""
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402
import e14_restos_1004 as e14r  # noqa: E402
import e15_listados_1004 as e15l  # noqa: E402
import e15_respuesta_1004 as e15  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
MARCA = '<style data-e18="t3r">'
SUFIJO = " · para aprobar"
TABLEROS = ["FRM-Respuesta-18", "FRM-Respuesta-Completa-18", "M-FRM-Respuesta-18", "FRM-Respuestas-18", "M-FRM-Respuestas-18",
            "WA-Chats-Respuesta-18", "M-WA-Conversacion-Respuesta-18"]
leer, escribir, una, bloques, clonar, k_de, estados = e15.leer, e15.escribir, e15.una, e15.bloques, e15.clonar, e15.k_de, e15.estados
ZONA = "Fotos y documentos"


# ---------------------------------------------------------------------------------------------------------------- utilidades
def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def para_aprobar(t):
    m = re.search(r"<title>([^<]*)</title>", t)
    assert m and SUFIJO not in m.group(1), m and m.group(1)
    return t[:m.end(1)] + SUFIJO + t[m.end(1):]


def sumar(t, despues, nuevos):
    """Como `e15.sumar_estados`, para los tableros `-18`, cuyo enum muestra solo una parte de la lista de `renderVals`: suma los
    estados al enum (después de `despues`) y al final de la lista, con su `sN`; la miga de cada uno, la del primero."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    ops = props["estado"]["options"]
    k = ops.index(despues) + 1
    ops[k:k] = nuevos
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    m = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    lista = json.loads(m.group(1))
    base = len(lista)
    lista += nuevos
    t = t[:m.start(1)] + json.dumps(lista, ensure_ascii=False) + t[m.end(1):]
    ult = f"      s{base - 1}: k === {base - 1},\n"
    t = una(t, ult, ult + "".join(f"      s{base + i}: k === {base + i},\n" for i in range(len(nuevos))))
    m = re.search(r"miga: (\[.*?\])\[k\]", t)
    if m:
        migas = json.loads(m.group(1))
        migas += [migas[0]] * len(nuevos)
        t = t[:m.start(1)] + json.dumps(migas, ensure_ascii=False) + t[m.end(1):]
    assert set(ops) <= set(lista), set(ops) - set(lista)
    return t, {n: f"s{base + i}" for i, n in enumerate(nuevos)}


def renombrar_estado(t, viejo, nuevo):
    """El estado `viejo` pasa a llamarse `nuevo` en el enum y en la lista de `renderVals` (conserva su `sN`)."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    ops = props["estado"]["options"]
    ops[ops.index(viejo)] = nuevo
    t = t[:m.start(1)] + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + t[m.end(1):]
    m = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    lista = json.loads(m.group(1))
    lista[lista.index(viejo)] = nuevo
    return t[:m.start(1)] + json.dumps(lista, ensure_ascii=False) + t[m.end(1):]


def en_bloque(t, var, n, hacer):
    """El `n`-ésimo `sc-if` de `var`: `hacer(bloque)` devuelve el nuevo."""
    i, j = bloques(t, var)[n]
    return t[:i] + hacer(t[i:j]) + t[j:]


def adentro(bloque, nuevo):
    """El `sc-if` con otro contenido."""
    return bloque[:bloque.index(">") + 1] + nuevo + "</sc-if>"


def cuerpo(t):
    return t[t.index("</helmet>"):]


# ---------------------------------------------------------------------------------------------------------------- los datos (269)
# «Visita a cliente», versión 4: la de la E15 con las dos preguntas de archivo que publicó la E18 (`FRM-Publicar-18`), en el orden
# del autor. La zona «Fotos y documentos» las junta al final (266).
VISITA_V4 = [("Cliente", "texto"), ("Fecha de la visita", "fecha"), ("#", "Resultado de la visita"),
             ("¿Se concretó la venta?", "sino"), ("Monto estimado", "numero"), ("Motivo", "una"), ("Fotos de la visita", "fotos"),
             ("Remito firmado", "documento"), ("Fallas", "varias"), ("Observaciones", "largo")]
ARCHIVOS = ("fotos", "documento")
# Un archivo: (nombre, tamaño, la variante de la miniatura o el tipo del documento).
RESP = {
    "VIS-000126": dict(forma=VISITA_V4, version=4, quien="Tomás Acosta", fecha="13/10/2026", hora="15:30",
                       mando=("Lucía Fernández", "13/10/2026", "11:20"),
                       valores={"Cliente": "Ferretería Rosales", "Fecha de la visita": "13/10/2026", "¿Se concretó la venta?": "Sí",
                                "Monto estimado": "125.500,00", "Motivo": "Venta nueva",
                                "Fotos de la visita": [("frente-local.jpg", "3,4 MB", ""), ("gondola.jpg", "2,8 MB", "b")],
                                "Remito firmado": [("remito-0810.pdf", "1,2 MB", "PDF")],
                                "Fallas": ["Frío", "Ruido"], "Observaciones": "Cerramos el pedido de octubre."}),
    "VIS-000129": dict(forma=VISITA_V4, version=4, quien="Florencia Fernández de la Fuente", fecha="15/10/2026", hora="11:47",
                       mando=("Lucía Fernández", "15/10/2026", "09:30"),
                       valores={"Cliente": "Obra Centro", "Fecha de la visita": "15/10/2026", "¿Se concretó la venta?": "Sí",
                                "Monto estimado": "48.000,00", "Motivo": "Venta nueva",
                                "Fotos de la visita": [("acopio-planta.jpg", "2,1 MB", ""), ("segunda-etapa.jpg", "3,8 MB", "b"),
                                                       ("remito-proveedor.jpg", "1,9 MB", "c")],
                                "Remito firmado": None,
                                "Fallas": ["Frío", "Ruido"], "Observaciones": "Falta material en planta para la segunda etapa."}),
}
FECHA_FOTO = "13/10/2026, 15:30"  # la de la respuesta VIS-000126 en Formularios (O21)
# Las columnas que ordenan, las que se ven en esta planilla (264): sin Cargó, que Formularios no guarda, ni las de archivo, que tienen
# varios valores.
COLS_ORDENAN = ["N°", "Recibida", "Es cliente", "Cliente", "Motivo", "Observaciones"]


# ---------------------------------------------------------------------------------------------------------------- la lectura (266)
def control_archivos(tipo, archivos):
    """Una pregunta de archivo es su control de solo lectura: las miniaturas, que abren el visor, o cada documento con su nombre, que
    lo descarga, y su tamaño al lado (263). Sin respuesta, el control vacío de la E15."""
    if not archivos:
        return e15.control("texto", None)
    if tipo == "fotos":
        hay = "".join(f'<button type="button" class="r-th {v}" aria-label="Ver {n}"></button>' for n, _, v in archivos)
        return f'<div class="e15-c e18-ar" aria-readonly="true"><span class="e18-ths">{hay}</span></div>'
    docs = "".join(f'<span class="e18-doc"><span class="pdf">{v}</span><a class="nm" href="#" download="{n}">{n}</a>'
                   f'<span class="tam">{tam}</span></span>' for n, tam, v in archivos)
    return f'<div class="e15-c e18-ar" aria-readonly="true"><span class="e18-docs">{docs}</span></div>'


def zona_archivos(items, valores, cols, plegada):
    """La zona «Fotos y documentos», con la banda de las del autor: plegada, dice cuántas se respondieron; abierta, cada pregunta de
    archivo a todo el renglón, con su etiqueta arriba."""
    res = f'<span class="res">{e15.respondidas(items, valores)}</span>' if plegada else ""
    boton = (f'<button type="button" class="ib" aria-expanded="{"false" if plegada else "true"}" '
             f'aria-label="{"Expandir" if plegada else "Plegar"} {ZONA}">{e15.CHEV}</button>')
    cab = f'<div class="e15-zc"><span class="t">{ZONA}</span>{res}{boton}</div>'
    cuerpo_z = ""
    if not plegada:
        grupos = [([(et, control_archivos(tipo, valores.get(et)))], True) for et, tipo in items]
        cuerpo_z = "".join(f'<div class="e15-f c{cols}">{"".join(f)}</div>' for f in e15.renglones(grupos, cols))
    return f'<section class="e15-z e18-zf{" pl" if plegada else ""}" aria-label="{ZONA}">{cab}{cuerpo_z}</section>'


def lectura(r, cols, plegadas=()):
    """La lectura de la E15 (`e15.lectura`) con las zonas del autor y, al final, «Fotos y documentos» (266)."""
    autor = [it for it in r["forma"] if it[1] not in ARCHIVOS]
    archivos = [it for it in r["forma"] if it[1] in ARCHIVOS]
    base = e15.lectura(dict(r, forma=autor), cols, plegadas)
    assert base.startswith('<div class="e15-zs">') and base.endswith("</div>")
    return base[:-len("</div>")] + zona_archivos(archivos, r["valores"], cols, ZONA in plegadas) + "</div>"


def pie_visor(t, fecha=FECHA_FOTO):
    """Al pie del visor, el nombre, el tamaño y la fecha de la foto, cada uno en su lugar (O21, 194 y 263), como `WA-Chats-Visor`;
    en Formularios, la fecha es la de la respuesta."""
    t, n = re.subn(r'<div class="vz-pie"><span class="t">([^<]+)<small>([^<]+)</small></span>',
                   lambda m: f'<div class="vz-pie"><span class="vz-dat"><b>{m.group(1)}</b><span>{m.group(2)}</span>'
                             f'<span title="Fecha de la respuesta">{fecha}</span></span>', t)
    assert n == 1, n
    return t


# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala: la pasada de las piezas las achica en la compu.
CSS_ARCHIVOS = """
/* E18 · La zona «Fotos y documentos», al final (266): cada pregunta de archivo es su control de solo lectura, a todo el renglón y con
   su etiqueta arriba; las miniaturas abren el visor, y cada documento lleva su nombre, que lo descarga, y su tamaño al lado, nunca
   debajo (263). */
.e15-c.e18-ar { padding: 8px 10px; }
.e18-ths { display: flex; flex-wrap: wrap; gap: 8px; }
button.r-th { box-sizing: border-box; padding: 0; border: 0; font: inherit; cursor: zoom-in; }
.e18-docs { display: flex; flex: 1; flex-direction: column; gap: 6px; min-width: 0; }
.e18-doc { display: flex; align-items: center; gap: 10px; min-width: 0; }
.e18-doc .pdf { flex: none; display: inline-flex; width: 28px; height: 32px; align-items: center; justify-content: center; border-radius: 4px; background: oklch(0.55 0.18 25); color: #fff; font-size: 9px; font-weight: 700; }
.e18-doc .nm { min-width: 0; color: var(--marca-tx); font-weight: 600; text-decoration: none; overflow-wrap: anywhere; }
.e18-doc .nm:hover { text-decoration: underline; }
.e18-doc .tam { flex: none; padding-left: 10px; border-left: 1px solid var(--borde); color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }
"""
CSS_ARCHIVOS_TEL = CSS_ARCHIVOS + """
.e15-c.e18-ar { padding: 10px 12px; }
.e18-ths { gap: 8px; }
.e18-ths .r-th { width: 64px; height: 64px; border-radius: 8px; }
.e18-doc .pdf { width: 30px; height: 36px; font-size: 10px; }
"""
CSS_VISOR = """
/* E18 · Al pie del visor, el nombre, el tamaño y la fecha de la foto, cada uno en su lugar (O21, 194 y 263), como `WA-Chats-Visor`. */
.vz-dat { display: flex; align-items: center; gap: 12px; min-width: 0; font-size: 14px; color: var(--t2); }
.vz-dat b { color: var(--t1); font-weight: 600; overflow-wrap: anywhere; }
.vz-dat > * + * { padding-left: 12px; border-left: 1px solid var(--borde); white-space: nowrap; }
"""
CSS_COMPLETA = """
/* E18 · La pantalla completa (266 y 267): la versión en la banda y la línea gris debajo del número; las zonas a todo el ancho, con
   «Fotos y documentos» al final, y «Actividad» en ocho columnas, abierta y sin plegar (163). «Descargar ▾», cada documento con su
   tamaño al lado. */
.w-bnd h1 .e15-ver { font-size: 13px; }
.e15-pag { gap: 12px; overflow: auto; }
.f-mi.e18-mi { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.f-mi.e18-mi .tam { color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }
"""
TIP_TEL = "\n".join(l for l in b2.acc.CSS_TEL.splitlines() if l.startswith((".acc-tip {", ".acc-tip::after"))) + "\n"
assert TIP_TEL.count("\n") == 2


# ---------------------------------------------------------------------------------------------------------------- la vista rápida
def panel(viejo, numero, pos, pestana="Respuesta", plegadas=()):
    """La vista rápida de la E15 (`e15.panel`), con la lectura de esta etapa."""
    r = RESP[numero]
    d2h = re.search(r'<div class="d2-h">.*?</div>', viejo, re.S).group(0)
    tabs = "".join(f'<span role="tab" class="{"on" if p == pestana else ""}" aria-selected="{"true" if p == pestana else "false"}">{p}</span>'
                   for p in ("Respuesta", "Actividad"))
    cuerpo_p = lectura(r, 2, plegadas) if pestana == "Respuesta" else e15.actividad_recuadros(e15.renglones_actividad(r))
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {numero}">{e15.cabeza_panel(d2h, numero, r["version"], False)}'
            f'<p class="e15-quien">{e15.linea_gris(r)}</p><div class="o-tabs" role="tablist">{tabs}</div>'
            f'<div class="d2-b">{cuerpo_p}</div><div class="d2-pie">{pos}</div></aside>')


def con_panel(bloque, *args, **kw):
    """Cambia el `<aside class="d2">` del bloque por la vista rápida nueva; lo que sigue (el visor) queda."""
    i = bloque.index('<aside class="d2"')
    j = bloque.index("</aside>", i) + len("</aside>")
    return bloque[:i] + panel(bloque[i:j], *args, **kw) + bloque[j:]


def frm_respuesta():
    t, nl = leer("FRM-Respuesta-18")
    t = para_aprobar(con_css(t, b2.CSS_B2 + e15.CSS_LECTURA_COMPU + e15.CSS_PANEL + CSS_ARCHIVOS + CSS_VISOR))
    assert estados(t) == ["Respuesta", "Fotos", "Ver una foto"], estados(t)
    t = renombrar_estado(t, "Fotos", "Actividad")  # sin la pestaña «Fotos» (266): su lugar, la actividad (267)
    t, nuevos = sumar(t, "Actividad", ["Fotos y documentos plegada"])
    t = clonar(t, "s0", nuevos["Fotos y documentos plegada"])
    k = k_de(t)
    cada = {"Respuesta": ("VIS-000126", "5 de 24", "Respuesta", ()),
            "Actividad": ("VIS-000126", "5 de 24", "Actividad", ()),
            "Ver una foto": ("VIS-000126", "5 de 24", "Respuesta", ()),
            "Fotos y documentos plegada": ("VIS-000129", "2 de 24", "Respuesta", (ZONA,))}
    for nombre, args in cada.items():
        assert len(bloques(t, k[nombre])) == 3, nombre
        t = en_bloque(t, k[nombre], 2, lambda b, a=args: con_panel(b, *a))
    t = en_bloque(t, k["Ver una foto"], 2, pie_visor)
    # La planilla de atrás: la flecha de su orden, Recibida de la más reciente a la más vieja (264); con VIS-000129 abierta, su fila.
    viejo = '<div class="w-th pl"><span>N°</span><span>Recibida</span>'
    assert t.count(viejo) == 4, t.count(viejo)
    t = t.replace(viejo, '<div class="w-th pl"><span>N°</span><span aria-sort="descending">Recibida<span class="b2-fl" aria-hidden="true">↓</span></span>')

    def fila_129(b):
        b = una(b, '<div class="w-tr pl sel">', '<div class="w-tr pl">')
        return una(b, '<div class="w-tr pl"><span><a class="pl-num" href="FRM-Respuesta-18.dc.html">VIS-000129</a>',
                   '<div class="w-tr pl sel"><span><a class="pl-num" href="FRM-Respuesta-18.dc.html">VIS-000129</a>')
    t = en_bloque(t, k["Fotos y documentos plegada"], 1, fila_129)
    c = cuerpo(t)
    assert "d3-moms" not in c and 'class="d2-sub"' not in c and 'class="g-det"' not in c and "d2-fotos" not in c and "Fotos <span" not in c
    assert c.count('aria-label="Fotos y documentos"') == 3 and c.count('<span class="e15-bd">Al recibirla</span>') == 1
    assert c.count('<span class="res">1 de 2 respondidas</span>') == 1 and c.count('class="vz-dat"') == 1
    escribir("FRM-Respuesta-18", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la pantalla completa
def cuerpo_completa(numero, plegadas=()):
    """El cuerpo de la E15 (`e15.cuerpo_completa`), con la lectura de esta etapa."""
    r = RESP[numero]
    act = (f'<section class="w-caja e15-actc" aria-label="Actividad"><div class="e15-zc"><span class="t">Actividad</span></div>'
           f'{e15.actividad_tabla(e15.renglones_actividad(r))}</section>')
    return f'<div class="w-body e15-pag">{lectura(r, 3, plegadas)}{act}</div>'


def banda_completa(b):
    """La banda de la E15 (`e15.banda_completa`: VIS-000126 tiene ahí los mismos datos) y, en «Descargar ▾», cada documento con su
    tamaño al lado."""
    b = e15.banda_completa(b, "VIS-000126", "5 de 24")
    if '<div class="f-menu" role="menu" aria-label="Descargar">' in b:
        b = una(b, '<span class="f-mi" role="menuitem">remito-0810.pdf</span>',
                '<a class="f-mi e18-mi" role="menuitem" href="#" download="remito-0810.pdf"><span class="nm">remito-0810.pdf</span>'
                '<span class="tam">1,2 MB</span></a>')
    return b


def frm_respuesta_completa():
    t, nl = leer("FRM-Respuesta-Completa-18")
    t = para_aprobar(con_css(t, b2.CSS_B2 + e15.CSS_LECTURA_COMPU + CSS_COMPLETA + CSS_ARCHIVOS))
    assert estados(t) == ["Respuesta", "Descargar: menú"], estados(t)
    t, nuevos = sumar(t, "Descargar: menú", ["Fotos y documentos plegada"])
    t = clonar(t, "s0", nuevos["Fotos y documentos plegada"])
    k = k_de(t)
    for nombre, plegadas in (("Respuesta", ()), ("Descargar: menú", ()), ("Fotos y documentos plegada", (ZONA,))):
        assert len(bloques(t, k[nombre])) == 2, nombre
        t = en_bloque(t, k[nombre], 0, banda_completa)
        t = en_bloque(t, k[nombre], 1, lambda b, p=plegadas: adentro(b, cuerpo_completa("VIS-000126", p)))
    c = cuerpo(t)
    assert 'class="g-det"' not in c and 'class="ac4"' not in c and c.count('class="e15-act"') == 3
    assert c.count('aria-label="Fotos y documentos"') == 3 and c.count('<span class="res">2 de 2 respondidas</span>') == 1
    assert c.count("Descargar <svg") == 3 and c.count('class="f-mi e18-mi"') == 1
    escribir("FRM-Respuesta-Completa-18", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def pantalla_tel(viejo, numero, pos, plegadas=(), deslizar=0):
    """La pantalla de la E15 (`e15.pantalla_tel`), con la lectura de esta etapa."""
    r = RESP[numero]
    apertura = viejo[:viejo.index(">") + 1]
    i = viejo.index('<div class="ap-bar int">')
    j = viejo.index('<div class="tr-nav">')
    k = viejo.index('<div class="tr-scroll">')
    barra = re.sub(r'<div class="tit">.*?</span></div>',
                   f'<div class="tit"><h1>{numero}<span class="e15-ver">Versión {r["version"]}</span></h1></div>', viejo[i:j], count=1, flags=re.S)
    nav = re.sub(r'<div class="tr-nav"><span>[^<]*</span>', f'<div class="tr-nav"><span>{pos}</span>', viejo[j:k], count=1)
    act = f'<div class="e15-act-tel"><h2>Actividad</h2>{e15.actividad_recuadros(e15.renglones_actividad(r))}</div>'
    dentro = lectura(r, 1, plegadas) + act
    if deslizar:  # la pantalla bajada: lo de arriba quedó fuera de la vista
        dentro = f'<div class="e15-desliz" style="margin-top: -{deslizar}px;">{dentro}</div>'
    return (f'{apertura}{barra}<p class="e15-quien">{e15.linea_gris(r)}</p>{nav}'
            f'<div class="tr-scroll">{dentro}</div></sc-if>')


def m_frm_respuesta():
    t, nl = leer("M-FRM-Respuesta-18")
    t = para_aprobar(con_css(t, b2.CSS_B2 + b2.CSS_B2_TEL + e15.CSS_LECTURA_TEL + e15.CSS_TEL + CSS_ARCHIVOS_TEL))
    assert estados(t) == ["Respuesta"], estados(t)
    t, nuevos = sumar(t, "Respuesta", ["La actividad", "Fotos y documentos plegada"])
    for s in nuevos.values():
        t = clonar(t, "s0", s)
    k = k_de(t)
    # (número, posición, zonas plegadas, cuánto se bajó la pantalla)
    cada = {"Respuesta": ("VIS-000126", "5 de 24", (), 0),
            "La actividad": ("VIS-000126", "5 de 24", (), 800),
            "Fotos y documentos plegada": ("VIS-000129", "2 de 24", (ZONA,), 520)}
    for nombre, args in cada.items():
        assert len(bloques(t, k[nombre])) == 1, nombre
        t = en_bloque(t, k[nombre], 0, lambda b, a=args: pantalla_tel(b, *a))
    t = e15.todas(t, 'aria-label="Volver" href="M-FRM-Respuestas.dc.html"', 'aria-label="Volver" href="M-FRM-Respuestas-18.dc.html"', 3)
    c = cuerpo(t)
    assert "· versión " not in c and "tr-moms" not in c and 'class="tr-gr"' not in c and "tr-act" not in c
    assert c.count('<p class="e15-quien">') == 3 and c.count('aria-label="Fotos y documentos"') == 3
    escribir("M-FRM-Respuesta-18", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la planilla
TIP_COLUMNAS = ("N°, recibida, quién la cargó, canal, empresas y las preguntas de todas las versiones, con todos los campos. De las "
                "fotos y los documentos van la cantidad y los nombres, sin los archivos.")
TIP_ARCHIVO = "De las fotos y los documentos van la cantidad y los nombres, sin los archivos."
GRUPO_COLUMNAS = re.compile(r'<div class="t2-grupo" role="radiogroup" aria-label="Columnas"><span class="ex-tit">Columnas'
                            r'<span class="f-i"[^>]*>(?:<svg.*?</svg>)</span><span class="e-tip ex-tip" role="tooltip">[^<]*</span></span>'
                            r'<div class="ex-rds">.*?</div></div></div>', re.S)


def columnas_exportar(b):
    """«Columnas»: los dos radios pasan a la pieza, como en `FRM-Respuestas-Exportar` (262), con su (i) abierta: la de la E15 y lo
    de los archivos."""
    b, n = GRUPO_COLUMNAS.subn(f'<div class="t2-grupo ex-col"><span class="ex-tit">Columnas{b2.info(TIP_COLUMNAS, abierto=True)}</span>'
                              + b2.campo("Todas las preguntas", aria="Columnas") + "</div>", b)
    assert n == 1, n
    return b


CSS_PLANILLA = e15l.CSS_EXPORTAR + e15l.CSS_FILTROS[len(e15l.CSS_PLANILLA):] + CSS_VISOR + """
/* E18 · La (i) de «Columnas», abierta, se ve entera sobre el diálogo. */
.w-dlg.ex:has(.acc-tip), .w-dlg.ex .db:has(.acc-tip) { overflow: visible; }
"""


def frm_respuestas():
    t, nl = leer("FRM-Respuestas-18")
    t = para_aprobar(con_css(t, CSS_PLANILLA))
    assert estados(t) == ["Planilla", "Ver las fotos", "Filtros", "Exportar"], estados(t)
    # La barra y el encabezado de `FRM-Respuestas` (262 y 264): las columnas de archivos quedan sin flecha, porque no ordenan.
    t = e15l.encabezados(e15l.barras(t))
    t, nuevos = sumar(t, "Planilla", ["Ordenar por abierto"])
    t = e15l.copiar_estado(t, "s0", nuevos["Ordenar por abierto"],
                           e15l.con_orden_abierto(COLS_ORDENAN, "Recibida", "Más reciente primero"))
    k = k_de(t)
    t = en_bloque(t, k["Ver las fotos"], 2, pie_visor)
    t = en_bloque(t, k["Filtros"], 1, e15l.pieza_fd)  # lo que se elige, en la pieza (262); sin las preguntas de archivo (143)
    t = en_bloque(t, k["Exportar"], 2, columnas_exportar)
    c = cuerpo(t)
    assert c.count('class="b2-pop"') == 1 and 'role="combobox"' not in c and "ex-rd" not in c and "e-tip" not in c
    for col in ("Fotos de la visita", "Remito firmado"):
        assert col not in COLS_ORDENAN and f"{col}<span" not in c, col  # no ordenan (264)
    assert c.count('<span aria-sort="descending">Recibida<span class="b2-fl" aria-hidden="true">↓</span></span>') == 5
    escribir("FRM-Respuestas-18", t, nl)


FILA_TEL = re.compile(r'<a class="ap-fila" href="(M-FRM-Respuesta-18\.dc\.html)"><div class="tx"><span class="l1">([^<]+)<span class="hr">'
                      r'([^<]+)</span></span><span class="l2">([^<]*)</span><span class="l3">([^<]*)</span></div></a>')
CSS_PLANILLA_TEL = e15l.CSS_TEL_RESPUESTAS + TIP_TEL + """
/* E18 · La (i) de «Archivo», en la hoja de exportar: se abre con un toque, como tooltip sobre el control (211). */
.ap-hoja .hb:has(.acc-tip), .ap-hoja .ap-grupo:has(.acc-tip), .ap-hoja .ap-dato:has(.acc-tip) { overflow: visible; }
.ap-dato .k .b2-i { margin-left: 4px; }
"""


def sin_archivos_l3(m):
    """La tercera línea dejaba las fotos y los documentos unidos con «·» al cliente: queda el cliente solo (263)."""
    return m.group(1) + "</span>"


def m_frm_respuestas():
    t, nl = leer("M-FRM-Respuestas-18")
    t = para_aprobar(con_css(t, CSS_PLANILLA_TEL))
    assert estados(t) == ["Respuestas", "Filtros", "Exportar"], estados(t)
    # Las filas como la tarjeta de `M-FRM-Respuestas` (263), sin las fotos ni los documentos.
    t, n = re.subn(r'(<span class="l3">[^<]*?)(?: · \d+ (?:fotos?|documentos?))+</span>', sin_archivos_l3, t)
    assert n == 10, n
    t, n = FILA_TEL.subn(e15l.tarjeta_resp, t)
    assert n == 20, n
    # «Filtros»: cada filtro con su nombre y la pieza (262), sin las preguntas de archivo (143).
    k = k_de(t)

    def filtros(b):
        barra = re.search(r'<div class="ap-bar int">.*?</div></div>', b, re.S).group(0)
        pie = re.search(r'<div class="t-pie">.*?</div>', b, re.S).group(0)
        assert "<h1>Filtros</h1>" in barra and b.count('<div class="t-fl">') == 1
        return adentro(b, e15l.filtros_tel(barra, pie))
    t = en_bloque(t, k["Filtros"], 0, filtros)
    # «Ordenar por», a todo el ancho arriba de la lista (264).
    t = e14l.boton_ordenar_tel(t, (k["Respuestas"], k["Exportar"]), e15l.ORDEN_RECIBIDA)
    # La hoja de exportar: sin «Columnas» (en el teléfono exporta todas las preguntas, E15); la (i) de los archivos, en «Archivo».
    t, n = re.subn(r'<div class="ap-dato"><span class="k">Columnas<span class="f-i"[^>]*>(?:<svg.*?</svg>)</span></span>'
                   r'<span class="v">Todas las preguntas</span></div>', "", t, flags=re.S)
    assert n == 1, n
    t = una(t, '<div class="ap-dato"><span class="k">Archivo</span>', f'<div class="ap-dato"><span class="k">Archivo{b2.info(TIP_ARCHIVO)}</span>')
    # Los estados nuevos: «Ordenar por», con la columna en la pieza a pantalla completa, y la (i) abierta.
    t, nuevos = sumar(t, "Filtros", ["Ordenar por", "Ordenar por: la columna"])
    t, nuevos2 = sumar(t, "Exportar", ["Exportar: su (i)"])
    t = clonar(t, k["Exportar"], nuevos2["Exportar: su (i)"])
    t = en_bloque(t, nuevos2["Exportar: su (i)"], 1, lambda b: una(b, b2.info(TIP_ARCHIVO), b2.info(TIP_ARCHIVO, abierto=True)))
    volver = re.search(r'<a class="ap-ib" aria-label="Volver" href="M-FRM-Respuestas.dc.html">(<svg.*?</svg>)</a>', t, re.S).group(1)
    ordenar = e14l.pantalla_ordenar(volver, "M-FRM-Respuestas-18", "Recibida", "Más reciente primero")
    columna = b2.pk_tel("Columna", [(c, None, c == "Recibida", None) for c in COLS_ORDENAN])
    t = una(t, '<span class="ap-raya"></span>',
            f'<sc-if value="{{{{{nuevos["Ordenar por"]}}}}}" hint-placeholder-val="{{{{no}}}}">{ordenar}</sc-if>'
            f'<sc-if value="{{{{{nuevos["Ordenar por: la columna"]}}}}}" hint-placeholder-val="{{{{no}}}}">{ordenar}{columna}</sc-if>'
            '<span class="ap-raya"></span>')
    t = una(t, 'aria-label="Volver" href="M-FRM-Respuestas.dc.html"', 'aria-label="Volver" href="M-FRM-Respuestas-18.dc.html"')
    c = cuerpo(t)
    assert " · " not in "".join(re.findall(r'<span class="l[23]">([^<]*)</span>', c)) and "fotos" not in c.split('class="ap-hoja"')[0]
    assert 'class="t-fl"' not in c and c.count('class="acc-tip') == 1 and c.count('class="b2-ordtel"') == 3
    escribir("M-FRM-Respuestas-18", t, nl)


# ---------------------------------------------------------------------------------------------------------------- la respuesta en el chat
DOC_VIEJO = ('<span class="r-doc"><span class="pdf">PDF</span><span class="t">remito-0810.pdf<small>1,2 MB</small></span><button type="button" '
             'class="cb cb-sec" aria-label="Descargar remito-0810.pdf">Descargar</button></span>')
DOC_NUEVO = ('<span class="r-doc e18-doc"><span class="pdf">PDF</span><a class="nm" href="#" download="remito-0810.pdf">remito-0810.pdf</a>'
             '<span class="tam">1,2 MB</span></span>')
FOTOS_126 = ["frente-local.jpg", "gondola.jpg"]  # las de VIS-000126, como en la respuesta y en el visor
CSS_CHAT = """
/* E18 · En la respuesta del chat, cada miniatura es su control, que abre el visor (y «+4», el que abre todas), y el documento, su
   control con el nombre, que lo descarga, y el tamaño al lado (263). */
button.r-th { box-sizing: border-box; padding: 0; border: 0; font: inherit; cursor: zoom-in; }
.r-doc.e18-doc { gap: 10px; }
.e18-doc .nm { min-width: 0; color: var(--marca-tx); font-weight: 600; text-decoration: none; overflow-wrap: anywhere; }
.e18-doc .nm:hover { text-decoration: underline; }
.e18-doc .tam { flex: none; padding-left: 10px; border-left: 1px solid var(--borde); color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }
"""
CSS_CHAT_TEL = CSS_CHAT + """
/* En el teléfono, cada pregunta de archivo ocupa el renglón, con su etiqueta arriba, para que el nombre no se corte. */
.r-gr > .e18-todo { grid-column: 1 / -1; }
.r-gr > .k.e18-todo { padding-bottom: 0; }
.r-gr > .v.e18-todo { padding-top: 6px; border-top: 0; }
.r-gr .r-th { width: 52px; height: 52px; }
"""


def miniaturas(t):
    """Cada miniatura, un botón que abre el visor, con el nombre de la foto (las dos de VIS-000126) o en qué foto va (las ocho de
    «Muchas fotos»); «+4», el que abre las ocho."""
    partes, pos = [], 0
    # El grupo termina en el cierre de su última miniatura y el suyo: `</span></span>`.
    for m in re.finditer(r'<span class="r-ths">(.*?</span>)</span>', t, re.S):
        grupo = m.group(1)
        muchas = '<span class="r-th mas">' in grupo
        nombres = iter(FOTOS_126)

        def foto(x, muchas=muchas, nombres=nombres):
            nombre = f"la foto {x.group(2)} de 8" if muchas else next(nombres)
            return f'<button type="button" class="r-th {x.group(1)}" aria-label="Ver {nombre}"></button>'
        grupo = re.sub(r'<span class="r-th ?([a-z]*) ?" role="img" aria-label="Foto (\d+)"></span>', foto, grupo)
        grupo = grupo.replace('<span class="r-th mas">+4</span>', '<button type="button" class="r-th mas" aria-label="Ver las 8 fotos">+4</button>')
        assert '<span class="r-th' not in grupo, grupo
        partes.append(t[pos:m.start()] + f'<span class="r-ths">{grupo}</span>')
        pos = m.end()
    assert len(partes) == 2, len(partes)  # «Con fotos y un documento» y «Muchas fotos»
    return "".join(partes) + t[pos:]


def chat(nombre, tel):
    t, nl = leer(nombre)
    t = para_aprobar(con_css(t, (e14r.CSS_CARD_TEL if tel else e14r.CSS_CARD_COMPU) + (CSS_CHAT_TEL if tel else CSS_CHAT)))
    assert estados(t) == ["Bajando los archivos", "Con fotos y un documento", "Muchas fotos", "Reintentando",
                          "No se pudo bajar un archivo", "Un archivo no es lo que dice"], estados(t)
    # La tarjeta del formulario, como la E14 aprobada (206 y 263): «Versión» y «Botón» en renglones con rótulo; la versión 4, la que
    # tiene las preguntas de archivo (269).
    t, n = re.subn(e14r.CARD, lambda m: e14r.card(re.match(e14r.CARD, m.group(0).replace("versión 3 ·", "versión 4 ·"))), t)
    assert n == 6, n
    t = una(t, DOC_VIEJO, DOC_NUEVO)
    t = miniaturas(t)
    # «Muchas fotos» se guardaba como VIS-000127, que en la planilla es la de Marta Gil con 2 fotos: es la siguiente a la última (269).
    t = una(t, "Guardada como <b>VIS-000127</b>", "Guardada como <b>VIS-000131</b>")
    if tel:  # cada pregunta de archivo a todo el renglón, con su etiqueta arriba
        for preg in ("Fotos de la visita", "Remito firmado"):
            t, n = re.subn(rf'<span class="k">{preg}</span><span class="v">', f'<span class="k e18-todo">{preg}</span><span class="v e18-todo">', t)
            assert n == (2 if preg == "Fotos de la visita" else 1), (preg, n)
    c = cuerpo(t)
    assert "Formulario · versión" not in c and "<small>1,2 MB</small>" not in c and ">Descargar</button>" not in c
    assert 'role="img" aria-label="Foto' not in c and c.count('<button type="button" class="r-th') == 7
    escribir(nombre, t, nl)


def wa_chats_respuesta():
    chat("WA-Chats-Respuesta-18", False)


def m_wa_conversacion_respuesta():
    chat("M-WA-Conversacion-Respuesta-18", True)


HACER = [("FRM-Respuesta-18", frm_respuesta), ("FRM-Respuesta-Completa-18", frm_respuesta_completa), ("M-FRM-Respuesta-18", m_frm_respuesta),
         ("FRM-Respuestas-18", frm_respuestas), ("M-FRM-Respuestas-18", m_frm_respuestas),
         ("WA-Chats-Respuesta-18", wa_chats_respuesta), ("M-WA-Conversacion-Respuesta-18", m_wa_conversacion_respuesta)]

if __name__ == "__main__":
    hechos = []
    for nombre, hacer in HACER:
        t, _ = leer(nombre)
        if MARCA in t:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        hacer()
        hechos.append(nombre)
    if hechos:
        subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(hechos)], check=True)
