"""La E15 (Respuestas) con el traspaso 18, tanda 3A (2026-11-26): la respuesta, su actividad y el tablero, redibujados en su lugar
(spec `docs/plans/formularios/15-respuestas.md`, «El detalle» y «El tablero», y su parte de datos, «Cómo se lee una respuesta»).
Las etapas que siguen (E16, E18, E20 y E21) leen y corrigen la respuesta con esta misma forma: las piezas de la lectura y de la
actividad están acá, en funciones (`lectura`, `linea_gris`, `actividad_tabla`, `actividad_recuadros` y `CSS_LECTURA_*`), para
importarlas.

- `FRM-Respuesta` (la vista rápida, al costado de la planilla): **la respuesta con la forma de su formulario (266)**, en la versión
  con que se cargó: «Datos» con lo que va antes del primer título y una zona por título, que se pliega; la grilla de dos columnas,
  que sale del ancho de la zona; cada pregunta es su control de solo lectura (el recuadro gris claro con el valor en negro), el
  número y la fecha angostos, el sí o no y elegir en la pieza cerrada (262) y el texto largo entero, en el renglón entero. Cada dato
  de una opción de catálogo es su campo, en el mismo renglón que su pregunta, «Proveedor · CUIT», con el valor en gris (263); sin
  la tabla chica debajo del valor (la 266 reemplaza a la 139). «Elegir varias» se lee entera, separada por coma y sin «y N más»: el
  campo baja de renglón (174). Una pregunta sin respuesta deja su control vacío. Arriba, sin los momentos: el número con su versión
  («Versión 4») y, debajo, solo la línea gris de quién y cuándo (263). Las pestañas «Respuesta» y «Actividad», con la actividad en
  recuadros: «Qué pasó» arriba y los demás datos con su nombre, de a dos, bajo la banda «Al recibirla» (267). Estados nuevos:
  «Actividad» y «Una zona plegada» («4 de 5 respondidas»). La planilla de atrás suma la flecha de su orden en «Recibida» (264).
- `FRM-Respuesta-Completa`: las zonas del formulario a todo el ancho, en tres columnas, en lugar de la columna fija de preguntas;
  la versión en la banda («Versión 4») y la línea gris debajo del número; «Actividad», abierta y sin plegar (163), en ocho columnas
  (Fecha, Hora, Qué pasó, Quién, Canal, Detalle, Estado y Acciones), con la banda «Al recibirla» como renglón que separa y «—» donde
  no aplica (267). Estados nuevos: «Elegir varias y campos» y «Una zona plegada». La compu llena sus 1000 de alto.
- `M-FRM-Respuesta`: la misma forma en una columna, y la actividad en recuadros (266, 267 y 263); el número con su versión en la
  barra y la línea gris debajo. Estados nuevos: «La actividad» (la pantalla bajada hasta ella) y «Una zona plegada». Mientras
  carga, la barra dice solo el número.
- `FRM-Tablero` y `M-FRM-Tablero`: arriba, «Respuestas» y, de cada pregunta de número (las tres primeras), su caja con el total, el
  promedio, el mínimo y el máximo, cada uno con su nombre y ninguno debajo de otro (263), en lugar de «promedio … · de … a …» en
  gris debajo del total. «Ver como tabla» deja la tarjeta como una tabla que ordena por sus columnas, con la flecha en el color de la
  marca después del título (antes, en las de números, que van a la derecha) y ↕ al pasar, con «Otras» siempre al final (264).
  «Día | Semana | Mes» sigue en el segmentado: son dos vistas de lo mismo y la 262 las deja afuera. Estados nuevos: «Una tarjeta
  como tabla» (Quién cargó, por respuestas, de mayor a menor) y, en la compu, «La tabla, ordenada por persona» (de la A a la Z).
  Sin respuestas, la pestaña dice 0 y la barra del teléfono «Sin respuestas», como `M-FRM-Respuestas`, en lugar de 24 (269).

Cambia los tableros en su lugar, con las medidas de antes de la escala en un bloque `<style data-e15="t3">`, que lo frena si ya
está, y al final corre `traspaso10_piezas_1004.py --tableros` con los cinco, que pone la escala de la compu. Para volver a correrlo,
primero se restauran los cinco (`git show HEAD:docs/design/lienzo/<Nombre>.dc.html`). No toca `canvas.json`.
"""
import io
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = '<style data-e15="t3">'
SUFIJO = " · para aprobar"
TABLEROS = ["FRM-Respuesta", "FRM-Respuesta-Completa", "M-FRM-Respuesta", "FRM-Tablero", "M-FRM-Tablero"]
NADA = "—"


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    return s.replace("\r\n", "\n"), nl


def escribir(nombre, s, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(s.replace("\n", nl))
    print("ok", nombre, len(s))


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (viejo[:140], t.count(viejo))
    return t.replace(viejo, nuevo)


def todas(t, viejo, nuevo, n):
    assert t.count(viejo) == n, (viejo[:140], t.count(viejo), n)
    return t.replace(viejo, nuevo)


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def para_aprobar(t):
    m = re.search(r"<title>([^<]*)</title>", t)
    assert m and not m.group(1).endswith(SUFIJO), m and m.group(1)
    return t[:m.end(1)] + SUFIJO + t[m.end(1):]


def fin_sc_if(t, i):
    prof = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        prof += 1 if m.group(0) == "<sc-if" else -1
        if prof == 0:
            return i + m.end()
    raise AssertionError("sc-if sin cerrar")


def bloques(t, var):
    """Los `sc-if` de la variable `var` (`s0`, `s3`…), en orden: [(inicio, fin)]."""
    return [(m.start(), fin_sc_if(t, m.start())) for m in re.finditer(rf'<sc-if value="\{{\{{{var}\}}\}}"', t)]


def renombrar(bloque, nuevo):
    assert bloque.startswith("<sc-if value=")
    return f'<sc-if value="{{{{{nuevo}}}}}" hint-placeholder-val="{{{{no}}}}">' + bloque[bloque.index(">") + 1:]


def clonar(t, fuente, nuevo):
    """Cada `sc-if` del estado `fuente` suma, a continuación, su copia para el estado `nuevo`."""
    for i, j in reversed(bloques(t, fuente)):
        t = t[:j] + renombrar(t[i:j], nuevo) + t[j:]
    return t


def sumar_estados(t, despues, nuevos):
    """Suma estados al enum del `data-props` (después de `despues`) y a `renderVals`, con su `sN`: {nombre: "sN"}."""
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
    if m:  # la miga de cada estado nuevo, la del primero
        migas = json.loads(m.group(1))
        migas += [migas[0]] * len(nuevos)
        t = t[:m.start(1)] + json.dumps(migas, ensure_ascii=False) + t[m.end(1):]
    assert sorted(ops) == sorted(lista), set(ops) ^ set(lista)
    return t, {n: f"s{base + i}" for i, n in enumerate(nuevos)}


def estados(t):
    return json.loads(re.search(r"data-props='(\{.*?\})'", t).group(1))["estado"]["options"]


def k_de(t):
    """{nombre del estado: "sN"}, según la lista de `renderVals`."""
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    return {n: f"s{i}" for i, n in enumerate(lista)}


def en_bloques(t, var, patron, hacer):
    """En cada `sc-if` de `var` que empieza con `patron` (después de la apertura), `hacer(bloque)` devuelve el bloque nuevo."""
    for i, j in reversed(bloques(t, var)):
        b = t[i:j]
        if b[b.index(">") + 1:].startswith(patron):
            t = t[:i] + hacer(b) + t[j:]
    return t


# ---------------------------------------------------------------------------------------------------------------- los datos (269)
# La forma de cada versión (266): las preguntas en el orden del autor, con su tipo; («#», título) abre una zona. Una pregunta de
# catálogo lleva sus datos sellados, en su orden (`catalogFields`).
VISITA_V4 = [("Cliente", "texto"), ("Fecha de la visita", "fecha"), ("#", "Resultado de la visita"),
             ("¿Se concretó la venta?", "sino"), ("Monto estimado", "numero"), ("Motivo", "una"), ("Fallas", "varias"),
             ("Observaciones", "largo")]
# La versión 3 todavía no tenía el título ni «Fallas»: todo va en «Datos».
VISITA_V3 = [("Cliente", "texto"), ("Fecha de la visita", "fecha"), ("¿Se concretó la venta?", "sino"),
             ("Monto estimado", "numero"), ("Motivo", "una"), ("Observaciones", "largo")]
REPUESTO_V2 = [("Fallas", "varias"), ("Proveedor", "catalogo", ["CUIT", "Plazo de pago"]), ("Observaciones", "largo")]

# Cada respuesta: su forma, versión, quién la respondió y cuándo, quién se la mandó y cuándo, y sus valores (None: sin respuesta).
RESP = {
    "VIS-000126": dict(forma=VISITA_V4, version=4, quien="Tomás Acosta", fecha="13/10/2026", hora="15:30",
                       mando=("Lucía Fernández", "13/10/2026", "11:20"),
                       valores={"Cliente": "Ferretería Rosales", "Fecha de la visita": "13/10/2026", "¿Se concretó la venta?": "Sí",
                                "Monto estimado": "125.500,00", "Motivo": "Venta nueva", "Fallas": ["Frío", "Ruido"],
                                "Observaciones": "Cerramos el pedido de octubre."}),
    "VIS-000130": dict(forma=VISITA_V4, version=4, quien="Paula Méndez", fecha="15/10/2026", hora="16:20",
                       mando=("Lucía Fernández", "15/10/2026", "09:10"),
                       valores={"Cliente": "Corralón El Puente", "Fecha de la visita": "15/10/2026", "¿Se concretó la venta?": "No",
                                "Monto estimado": None, "Motivo": "Seguimiento", "Fallas": ["Frío"],
                                "Observaciones": "Pidieron presupuesto para la ampliación."}),
    "VIS-000123": dict(forma=VISITA_V3, version=3, quien="Tomás Acosta", fecha="13/10/2026", hora="11:04",
                       mando=("Lucía Fernández", "13/10/2026", "09:40"),
                       valores={"Cliente": "Ferretería Rosales", "Fecha de la visita": "13/10/2026", "¿Se concretó la venta?": "No",
                                "Monto estimado": "0,00", "Motivo": "Seguimiento", "Observaciones": None}),
    "REP-000018": dict(forma=REPUESTO_V2, version=2, quien="Tomás Acosta", fecha="15/10/2026", hora="10:12",
                       mando=("Lucía Fernández", "15/10/2026", "08:45"),
                       valores={"Fallas": ["Frío", "Ruido"],
                                "Proveedor": (["Aceros Rosario"], {"CUIT": "30-70988123-4", "Plazo de pago": "30 días"}),
                                "Observaciones": "Cambiar el compresor."}),
}


def linea_gris(r, canal="WhatsApp"):
    """La línea gris de quién y cuándo, debajo del número (263): lo único que va debajo del título."""
    return f"La respondió {r['quien']} por {canal} el {r['fecha']}, {r['hora']}"


def renglones_actividad(r):
    """La actividad de la E15 (267): en «Al recibirla», la mandó y la respondió, por WhatsApp y «Hecho», sin acciones."""
    filas = []
    if r.get("mando"):
        quien, fecha, hora = r["mando"]
        filas.append(dict(fecha=fecha, hora=hora, que="La mandó", quien=quien, canal="WhatsApp", detalle=None, estado=("ok", "Hecho")))
    filas.append(dict(fecha=r["fecha"], hora=r["hora"], que="La respondió", quien=r["quien"], canal="WhatsApp", detalle=None,
                      estado=("ok", "Hecho")))
    return [("Al recibirla", filas)]


# ---------------------------------------------------------------------------------------------------------------- la lectura (266)
FLECHA = b2.SVG_FLECHA
CHEV = b2.SVG_CHEV
ANCHO_RENGLON = {"largo"}  # ocupan el renglón entero; lo demás, una columna (la tabla de la parte de datos)


def control(tipo, valor, gris=False):
    """Una pregunta es su control, sin poder tocarlo: el recuadro gris claro con lo respondido en negro; vacío, sin respuesta."""
    if valor is None:
        v = ""
    elif isinstance(valor, list):
        v = ", ".join(valor)  # elegir varias, en el orden en que se eligieron y enteras (174)
    else:
        v = valor
    clase = "e15-c" + {"numero": " ang num", "fecha": " ang num", "sino": " pk", "una": " pk", "varias": " pk",
                       "catalogo": " pk", "largo": " area"}.get(tipo, "") + (" cat" if gris else "")
    fl = FLECHA if tipo in ("sino", "una", "varias", "catalogo") else ""
    return f'<div class="{clase}" aria-readonly="true"><span class="v">{v}</span>{fl}</div>'


def celdas_pregunta(item, valores):
    """La pregunta y, en el mismo renglón, cada dato de su opción de catálogo con su nombre «Pregunta · Dato», en gris (263).
    Un dato que ninguna opción elegida selló no va (lo que no aporta). Devuelve ([celdas], ocupa el renglón entero)."""
    etiqueta, tipo = item[0], item[1]
    valor = valores.get(etiqueta)
    if tipo == "catalogo":
        opciones, datos = (valor or ([], {}))
        celdas = [(etiqueta, control(tipo, opciones or None))]
        for d in item[2]:
            if datos.get(d) is not None:
                celdas.append((f"{etiqueta} · {d}", control("texto", datos[d], gris=True)))
        return celdas, False
    return [(etiqueta, control(tipo, valor))], tipo in ANCHO_RENGLON


def celda(etiqueta, ctrl, todo=False):
    return f'<div class="e15-q{" todo" if todo else ""}"><span class="e15-et">{etiqueta}</span>{ctrl}</div>'


def renglones(grupos, cols):
    """La grilla (87): hasta `cols` por renglón, en el orden del autor y sin reordenar; lo que no entra baja de renglón. Una
    pregunta va en el renglón de sus datos: si no entran juntos, empieza otro."""
    filas, actual = [], []
    for celdas, todo in grupos:
        if todo:
            if actual:
                filas.append(actual)
            filas.append([celda(*celdas[0], todo=True)])
            actual = []
            continue
        if actual and len(actual) + len(celdas) > cols:
            filas.append(actual)
            actual = []
        for c in celdas:
            if len(actual) == cols:
                filas.append(actual)
                actual = []
            actual.append(celda(*c))
    if actual:
        filas.append(actual)
    return filas


def zonas(forma):
    """«Datos», con lo que va antes del primer título (si hay algo), y una zona por cada título (88)."""
    out, nombre, items = [], "Datos", []
    for it in forma:
        if it[0] == "#":
            if items:
                out.append((nombre, items))
            nombre, items = it[1], []
        else:
            items.append(it)
    if items:
        out.append((nombre, items))
    return out


def respondidas(items, valores):
    hechas = sum(1 for it in items if valores.get(it[0]) not in (None, [], ([], {})))
    return f"{hechas} de {len(items)} respondidas"


def lectura(r, cols, plegadas=()):
    """La respuesta con la forma de su formulario, en la versión con que se cargó: cada zona con su banda, que se pliega y arranca
    abierta; plegada, dice cuántas se respondieron. `cols` sale del ancho de la zona: 3 desde 46 rem, 2 desde 30 y 1 debajo."""
    out = []
    for nombre, items in zonas(r["forma"]):
        plegada = nombre in plegadas
        res = f'<span class="res">{respondidas(items, r["valores"])}</span>' if plegada else ""
        boton = (f'<button type="button" class="ib" aria-expanded="{"false" if plegada else "true"}" '
                 f'aria-label="{"Expandir" if plegada else "Plegar"} {nombre}">{CHEV}</button>')
        cab = f'<div class="e15-zc"><span class="t">{nombre}</span>{res}{boton}</div>'
        cuerpo = ""
        if not plegada:
            grupos = [celdas_pregunta(it, r["valores"]) for it in items]
            cuerpo = "".join(f'<div class="e15-f c{cols}">{"".join(f)}</div>' for f in renglones(grupos, cols))
        out.append(f'<section class="e15-z{" pl" if plegada else ""}" aria-label="{nombre}">{cab}{cuerpo}</section>')
    return f'<div class="e15-zs">{"".join(out)}</div>'


# ---------------------------------------------------------------------------------------------------------------- la actividad (267)
COLS_ACT = ["Fecha", "Hora", "Qué pasó", "Quién", "Canal", "Detalle", "Estado", "Acciones"]


def _v(x):
    return x if x else f'<span class="nada">{NADA}</span>'


def _estado(e):
    return b2.est(*e) if e else _v(None)


def actividad_tabla(bandas):
    """Renglón por renglón, en ocho columnas: lo que no aplica dice «—», y cada banda por momento es un renglón que separa. Las
    acciones de un renglón van en su ⋮ (261); sin acciones, la celda queda vacía."""
    celdas = [f'<span class="h{" p" if i == 0 else ""}" role="columnheader">{c}</span>' for i, c in enumerate(COLS_ACT)]
    for banda, filas in bandas:
        celdas.append(f'<span class="bd" role="rowheader">{banda}</span>')
        for f in filas:
            celdas += [f'<span class="p n">{f["fecha"]}</span>', f'<span class="n">{f["hora"]}</span>', f'<span class="q">{f["que"]}</span>',
                       f'<span>{_v(f["quien"])}</span>', f'<span>{_v(f["canal"])}</span>', f'<span class="det">{_v(f["detalle"])}</span>',
                       f'<span>{_estado(f["estado"])}</span>', f'<span class="ac">{f.get("acciones", "")}</span>']
    return f'<div class="e15-act" role="table" aria-label="Actividad">{"".join(celdas)}</div>'


def actividad_recuadros(bandas):
    """Donde no entran ocho columnas (la vista rápida y el teléfono): un recuadro por renglón, con «Qué pasó» arriba y los demás
    datos con su nombre, de a dos; el ⋮ del renglón, en su esquina."""
    out = []
    for banda, filas in bandas:
        out.append(f'<span class="e15-bd">{banda}</span>')
        for f in filas:
            datos = [("Fecha", f["fecha"]), ("Hora", f["hora"]), ("Quién", _v(f["quien"])), ("Canal", _v(f["canal"])),
                     ("Detalle", _v(f["detalle"])), ("Estado", _estado(f["estado"]))]
            dl = "".join(f'<span class="c"><span class="k">{k}</span><span class="v">{v}</span></span>' for k, v in datos)
            out.append(f'<div class="e15-rec"><span class="q">{f["que"]}</span>{f.get("acciones", "")}<span class="dl">{dl}</span></div>')
    return f'<div class="e15-recs">{"".join(out)}</div>'


# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala: la pasada de las piezas las achica en la compu.
CSS_LECTURA_COMPU = """
/* E15 · La respuesta con la forma de su formulario (266): las zonas con su banda, la grilla y cada pregunta en su control de solo
   lectura, el recuadro gris claro con el valor en negro; cada dato de una opción de catálogo, su campo, con el valor en gris (263). */
.e15-ver { margin-left: 10px; font-size: 13px; font-weight: 500; letter-spacing: 0; color: var(--t2); }
.e15-zs { display: flex; flex-direction: column; gap: 12px; }
.e15-z { border: 1px solid var(--borde); border-radius: 3px; background: #fff; }
.e15-zc { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 8px 0 16px; border-bottom: 1px solid oklch(0.89 0.031 95); border-radius: 3px 3px 0 0; background: oklch(0.945 0.027 95); font-size: 13px; font-weight: 600; color: var(--t1); }
.e15-zc .t { flex: 1; min-width: 0; }
.e15-zc .res { font-weight: 400; color: var(--t2); white-space: nowrap; }
.e15-zc .ib { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--t2); }
.e15-z:not(.pl) .e15-zc .ib svg { transform: rotate(180deg); }
.e15-z.pl .e15-zc { border-bottom: 0; border-radius: 3px; }
.e15-f { display: grid; gap: 16px; padding: 12px 16px; border-top: 1px solid var(--borde); align-items: start; }
.e15-zc + .e15-f { border-top: 0; }
.e15-f.c3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.e15-f.c2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.e15-f.c1 { grid-template-columns: minmax(0, 1fr); }
.e15-q { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.e15-q.todo { grid-column: 1 / -1; }
.e15-et { font-size: 12.5px; font-weight: 600; color: var(--t2); }
.e15-c { display: flex; align-items: center; gap: 8px; box-sizing: border-box; min-height: 36px; padding: 7px 12px; border: 1px solid var(--borde); border-radius: 3px; background: oklch(0.972 0.006 95); color: var(--t1); font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; white-space: normal; }
.e15-c .v { flex: 1; min-width: 0; }
.e15-c.ang { width: 168px; max-width: 100%; }
.e15-c.num .v { font-variant-numeric: tabular-nums; }
.e15-c > svg { flex: none; color: var(--t3); }
.e15-c.area { align-items: flex-start; min-height: 72px; }
.e15-c.cat .v { color: var(--t2); }
.e15-c .v:empty::before { content: "\\00a0"; }

/* E15 · La actividad, renglón por renglón (267): ocho columnas con una línea fina entre ellas (137), la banda por momento como
   renglón que separa y «—» donde no aplica. */
.e15-act { display: grid; grid-template-columns: 92px 60px minmax(120px, 1fr) minmax(130px, 1fr) 88px minmax(140px, 1.3fr) 100px 72px; font-size: 14px; }
.e15-act > span { min-width: 0; padding: 10px 12px; border-top: 1px solid var(--borde); line-height: 1.4; overflow-wrap: anywhere; }
.e15-act > span:not(.p):not(.bd) { box-shadow: inset 1px 0 0 var(--borde); }
.e15-act > .h { border-top: 0; background: oklch(0.945 0.027 95); color: var(--t2); font-size: 13px; font-weight: 600; white-space: nowrap; }
.e15-act > .bd { grid-column: 1 / -1; padding: 7px 12px; background: oklch(0.975 0.01 95); color: var(--t2); font-size: 13px; font-weight: 600; }
.e15-act > .n { font-variant-numeric: tabular-nums; }
.e15-act > .q { font-weight: 500; }
.e15-act .nada { color: var(--t3); }
.e15-act > .ac { display: flex; justify-content: flex-end; }
.e15-actc { overflow: hidden; }
.e15-actc > .e15-zc { border-radius: 0; }

/* La vista rápida y lo que no entra en ocho columnas: un recuadro por renglón, «Qué pasó» arriba y los demás datos de a dos. */
.e15-recs { display: flex; flex-direction: column; gap: 8px; }
.e15-bd { margin-top: 2px; font-size: 12.5px; font-weight: 600; color: var(--t2); }
.e15-rec { position: relative; padding: 10px 12px 12px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; }
.e15-rec .q { display: block; padding-right: 32px; font-size: 14px; font-weight: 600; color: var(--t1); }
.e15-rec .dl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px 14px; margin-top: 8px; }
.e15-rec .c { display: block; min-width: 0; }
.e15-rec .k { display: block; font-size: 12.5px; color: var(--t2); }
.e15-rec .v { display: block; font-size: 14px; color: var(--t1); overflow-wrap: anywhere; }
.e15-rec .nada { color: var(--t3); }
"""

CSS_LECTURA_TEL = """
/* E15 · La respuesta con la forma de su formulario, en una columna (266); cada dato de una opción de catálogo, su campo (263). */
.ap-bar .e15-ver { margin-left: 8px; font-size: 13.5px; font-weight: 500; letter-spacing: 0; color: var(--t2); }
.e15-quien { flex-shrink: 0; margin: 0; padding: 0 16px 10px 52px; background: #fff; font-size: 13.5px; line-height: 1.4; color: var(--t2); }
.e15-zs { display: flex; flex-direction: column; gap: 12px; padding: 12px 16px 0; }
.e15-z { border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: #fff; }
.e15-zc { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 2px 0 14px; background: oklch(0.945 0.027 95); font-size: 15px; font-weight: 600; color: var(--t1); }
.e15-zc .t { flex: 1; min-width: 0; }
.e15-zc .res { font-size: 13.5px; font-weight: 400; color: var(--t2); white-space: nowrap; }
.e15-zc .ib { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--t2); }
.e15-z:not(.pl) .e15-zc .ib svg { transform: rotate(180deg); }
.e15-f { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding: 12px 14px; border-top: 1px solid var(--borde); }
.e15-zc + .e15-f { border-top: 0; }
.e15-q { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.e15-et { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.e15-c { display: flex; align-items: center; gap: 8px; box-sizing: border-box; min-height: 44px; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 10px; background: oklch(0.972 0.006 95); color: var(--t1); font-size: 16px; line-height: 1.4; overflow-wrap: anywhere; white-space: normal; }
.e15-c .v { flex: 1; min-width: 0; }
.e15-c.ang { width: 180px; max-width: 100%; }
.e15-c.num .v { font-variant-numeric: tabular-nums; }
.e15-c > svg { flex: none; color: var(--t3); }
.e15-c.area { align-items: flex-start; min-height: 88px; }
.e15-c.cat .v { color: var(--t2); }
.e15-c .v:empty::before { content: "\\00a0"; }

/* E15 · La actividad en recuadros (267): «Qué pasó» arriba y los demás datos con su nombre, de a dos. */
.e15-act-tel { padding: 20px 16px 24px; }
.e15-act-tel h2 { margin: 0 0 10px; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
.e15-recs { display: flex; flex-direction: column; gap: 10px; }
.e15-bd { font-size: 13.5px; font-weight: 600; color: var(--t2); }
.e15-rec { position: relative; padding: 12px 14px 14px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; }
.e15-rec .q { display: block; padding-right: 40px; font-size: 16px; font-weight: 600; color: var(--t1); }
.e15-rec .dl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px 14px; margin-top: 10px; }
.e15-rec .c { display: block; min-width: 0; }
.e15-rec .k { display: block; font-size: 12.5px; color: var(--t2); }
.e15-rec .v { display: block; font-size: 15px; color: var(--t1); overflow-wrap: anywhere; }
.e15-rec .nada { color: var(--t3); }
.e15-desliz { display: flex; flex-direction: column; }
"""

CSS_PANEL = """
/* E15 · La vista rápida (266 y 267): debajo del número con su versión, solo la línea gris de quién y cuándo; las pestañas
   «Respuesta» y «Actividad». */
.e15-quien { margin: 0; padding: 12px 20px 0; font-size: 13.5px; line-height: 1.4; color: var(--t2); }
.d2-h .e15-ver { font-size: 13px; }
.d2 .o-tabs { margin-top: 10px; }
.d2-b .e15-zs { gap: 10px; }
"""

CSS_COMPLETA = """
/* E15 · La pantalla completa (266 y 267): la versión en la banda y la línea gris debajo del número; las zonas a todo el ancho y,
   debajo, «Actividad», abierta y sin plegar (163). La compu llena sus 1000 de alto. */
.w-app { height: 1000px !important; }
.w-bnd h1 .e15-ver { font-size: 13px; }
.e15-pag { gap: 12px; overflow: auto; }
"""

CSS_TEL = """
/* E15 · El número con su versión en la barra y, debajo, solo la línea gris de quién y cuándo (263). */
.tr-scroll .e15-zs:last-child { padding-bottom: 16px; }
"""


# ---------------------------------------------------------------------------------------------------------------- FRM-Respuesta
def cabeza_panel(d2h, numero, version, primera):
    """El renglón del título que ya estaba (los íconos con su tooltip, ↑ ↓ y ✕), con el número y su versión."""
    d2h = re.sub(r"<b>[^<]*</b>", f'<b>{numero}<span class="e15-ver">Versión {version}</span></b>', d2h, count=1)
    ant = re.search(r'<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior \(↑\)"( disabled)?>', d2h)
    nuevo = '<button type="button" class="nv" aria-label="Respuesta anterior" title="Anterior (↑)"' + (" disabled" if primera else "") + ">"
    return d2h[:ant.start()] + nuevo + d2h[ant.end():]


def panel(viejo, numero, pos, pestana="Respuesta", primera=False, plegadas=()):
    r = RESP[numero]
    d2h = re.search(r'<div class="d2-h">.*?</div>', viejo, re.S).group(0)
    tabs = "".join(f'<span role="tab" class="{"on" if p == pestana else ""}" aria-selected="{"true" if p == pestana else "false"}">{p}</span>'
                   for p in ("Respuesta", "Actividad"))
    cuerpo = lectura(r, 2, plegadas) if pestana == "Respuesta" else actividad_recuadros(renglones_actividad(r))
    return (f'<aside class="d2" role="dialog" aria-label="Respuesta {numero}">{cabeza_panel(d2h, numero, r["version"], primera)}'
            f'<p class="e15-quien">{linea_gris(r)}</p><div class="o-tabs" role="tablist">{tabs}</div>'
            f'<div class="d2-b">{cuerpo}</div><div class="d2-pie">{pos}</div></aside>')


def frm_respuesta():
    t, nl = leer("FRM-Respuesta")
    t = para_aprobar(con_css(t, b2.CSS_B2 + CSS_LECTURA_COMPU + CSS_PANEL))
    assert estados(t) == ["Respuesta", "La primera de la lista", "De una versión anterior", "Elegir varias y campos", "Cargando",
                          "No encontramos esa respuesta"], estados(t)
    t, nuevos = sumar_estados(t, "Respuesta", ["Actividad"])
    t = clonar(t, "s0", nuevos["Actividad"])
    t, nuevos2 = sumar_estados(t, "Elegir varias y campos", ["Una zona plegada"])
    t = clonar(t, "s1", nuevos2["Una zona plegada"])
    k = k_de(t)
    # (número, al pie, pestaña, la primera, zonas plegadas)
    cada = {"Respuesta": ("VIS-000126", "2 de 4", "Respuesta", False, ()),
            "Actividad": ("VIS-000126", "2 de 4", "Actividad", False, ()),
            "La primera de la lista": ("VIS-000130", "1 de 4", "Respuesta", True, ()),
            "De una versión anterior": ("VIS-000123", "8 de 24", "Respuesta", False, ()),
            "Elegir varias y campos": ("REP-000018", "1 de 18", "Respuesta", True, ()),
            "Una zona plegada": ("VIS-000130", "1 de 4", "Respuesta", True, ("Resultado de la visita",))}
    for nombre, (numero, pos, pestana, primera, plegadas) in cada.items():
        t = en_bloques(t, k[nombre], '<aside class="d2"',
                       lambda b, a=(numero, pos, pestana, primera, plegadas): b[:b.index(">") + 1]
                       + panel(b, a[0], a[1], a[2], a[3], a[4]) + "</sc-if>")
    # La planilla de atrás: la flecha de su orden, Recibida de la más reciente a la más vieja (264).
    n = t.count('<div class="w-th pl"><span>N°</span><span>Recibida</span>')
    assert n == len(estados(t)), n
    t = t.replace('<div class="w-th pl"><span>N°</span><span>Recibida</span>',
                  '<div class="w-th pl"><span>N°</span><span aria-sort="descending">Recibida<span class="b2-fl" aria-hidden="true">↓</span></span>')
    assert "d3-moms" not in t.split("</helmet>")[1] and "d-sub" not in t.split("</helmet>")[1] and 'class="g-det"' not in t
    assert t.count('<span class="e15-et">Proveedor · CUIT</span>') == 1 and t.count('class="e15-act"') == 0
    assert t.count('<span class="e15-bd">Al recibirla</span>') == 1
    escribir("FRM-Respuesta", t, nl)


# ---------------------------------------------------------------------------------------------------------------- FRM-Respuesta-Completa
def banda_completa(viejo, numero, pos, primera=False):
    r = RESP[numero]
    b = re.sub(r"<h1>[^<]*</h1><p class=\"res\">[^<]*</p>",
               f'<h1>{numero}<span class="e15-ver">Versión {r["version"]}</span></h1><p class="res">{linea_gris(r)}</p>', viejo, count=1)
    b = re.sub(r'<span class="rc-pos">[^<]*</span>', f'<span class="rc-pos">{pos}</span>', b, count=1)
    b = b.replace('<button type="button" class="nv" aria-label="Respuesta anterior" disabled>', '<button type="button" class="nv" aria-label="Respuesta anterior">')
    if primera:
        b = b.replace('<button type="button" class="nv" aria-label="Respuesta anterior">', '<button type="button" class="nv" aria-label="Respuesta anterior" disabled>')
    assert "Versión " in b and linea_gris(r) in b, b[:300]
    return b


def cuerpo_completa(numero, plegadas=()):
    r = RESP[numero]
    act = (f'<section class="w-caja e15-actc" aria-label="Actividad"><div class="e15-zc"><span class="t">Actividad</span></div>'
           f'{actividad_tabla(renglones_actividad(r))}</section>')
    return f'<div class="w-body e15-pag">{lectura(r, 3, plegadas)}{act}</div>'


def frm_respuesta_completa():
    t, nl = leer("FRM-Respuesta-Completa")
    t = para_aprobar(con_css(t, b2.CSS_B2 + CSS_LECTURA_COMPU + CSS_COMPLETA))
    assert estados(t) == ["Respuesta", "De una versión anterior", "Abierta desde un enlace", "Cargando", "No encontramos esa respuesta"], estados(t)
    t, nuevos = sumar_estados(t, "Abierta desde un enlace", ["Elegir varias y campos", "Una zona plegada"])
    for n in nuevos.values():
        t = clonar(t, "s0", n)
    k = k_de(t)
    cada = {"Respuesta": ("VIS-000126", "2 de 4", False, ()),
            "De una versión anterior": ("VIS-000123", "8 de 24", False, ()),
            "Abierta desde un enlace": ("VIS-000126", "5 de 24", False, ()),
            "Elegir varias y campos": ("REP-000018", "1 de 18", True, ()),
            "Una zona plegada": ("VIS-000130", "1 de 4", True, ("Resultado de la visita",))}
    for nombre, (numero, pos, primera, plegadas) in cada.items():
        t = en_bloques(t, k[nombre], '<div class="w-bnd">', lambda b, a=(numero, pos, primera): banda_completa(b, *a))
        t = en_bloques(t, k[nombre], '<div class="w-body">',
                       lambda b, a=(numero, plegadas): b[:b.index(">") + 1] + cuerpo_completa(*a) + "</sc-if>")
    if "Elegir varias y campos" in cada:  # el formulario de la miga, el de esa respuesta
        m = re.search(r"miga: (\[.*?\])\[k\]", t)
        migas = json.loads(m.group(1))
        migas[int(k["Elegir varias y campos"][1:])] = "Inicio / Gestión de formularios / Formularios / Pedir repuesto"
        t = t[:m.start(1)] + json.dumps(migas, ensure_ascii=False) + t[m.end(1):]
    cuerpo = t.split("</helmet>")[1]
    assert 'class="g-det"' not in cuerpo and 'class="ac4"' not in cuerpo
    assert cuerpo.count('class="e15-act"') == 5 and cuerpo.count('<span class="e15-et">Proveedor · Plazo de pago</span>') == 1
    escribir("FRM-Respuesta-Completa", t, nl)


# ---------------------------------------------------------------------------------------------------------------- M-FRM-Respuesta
def pantalla_tel(viejo, numero, pos, primera=False, plegadas=(), deslizar=0):
    """La pantalla del teléfono: la barra con el número y su versión, la línea gris, la navegación y, en una columna, las zonas y
    la actividad en recuadros."""
    r = RESP[numero]
    apertura = viejo[:viejo.index(">") + 1]
    i = viejo.index('<div class="ap-bar int">')
    j = viejo.index('<div class="tr-nav">')
    k = viejo.index('<div class="tr-scroll">')
    barra = re.sub(r'<div class="tit">.*?</span></div>',
                   f'<div class="tit"><h1>{numero}<span class="e15-ver">Versión {r["version"]}</span></h1></div>', viejo[i:j], count=1, flags=re.S)
    nav = re.sub(r'<div class="tr-nav"><span>[^<]*</span>', f'<div class="tr-nav"><span>{pos}</span>', viejo[j:k], count=1)
    nav = nav.replace('aria-label="Respuesta anterior" disabled>', 'aria-label="Respuesta anterior">')
    if primera:
        nav = nav.replace('aria-label="Respuesta anterior">', 'aria-label="Respuesta anterior" disabled>')
    act = f'<div class="e15-act-tel"><h2>Actividad</h2>{actividad_recuadros(renglones_actividad(r))}</div>'
    adentro = lectura(r, 1, plegadas) + act
    if deslizar:  # la pantalla bajada: lo de arriba quedó fuera de la vista
        adentro = f'<div class="e15-desliz" style="margin-top: -{deslizar}px;">{adentro}</div>'
    return (f'{apertura}{barra}<p class="e15-quien">{linea_gris(r)}</p>{nav}'
            f'<div class="tr-scroll">{adentro}</div></sc-if>')


def m_frm_respuesta():
    t, nl = leer("M-FRM-Respuesta")
    t = para_aprobar(con_css(t, b2.CSS_B2 + b2.CSS_B2_TEL + CSS_LECTURA_TEL + CSS_TEL))
    assert estados(t) == ["Respuesta", "La primera de la lista", "De una versión anterior", "Elegir varias y campos", "Cargando",
                          "No encontramos esa respuesta"], estados(t)
    t, nuevos = sumar_estados(t, "Respuesta", ["La actividad"])
    t = clonar(t, "s0", nuevos["La actividad"])
    t, nuevos2 = sumar_estados(t, "Elegir varias y campos", ["Una zona plegada"])
    t = clonar(t, "s1", nuevos2["Una zona plegada"])
    k = k_de(t)
    cada = {"Respuesta": ("VIS-000126", "5 de 24", False, (), 0),
            "La actividad": ("VIS-000126", "5 de 24", False, (), 660),
            "La primera de la lista": ("VIS-000130", "1 de 24", True, (), 0),
            "De una versión anterior": ("VIS-000123", "8 de 24", False, (), 0),
            "Elegir varias y campos": ("REP-000018", "1 de 18", True, (), 0),
            "Una zona plegada": ("VIS-000130", "1 de 24", True, ("Resultado de la visita",), 0)}
    for nombre, args in cada.items():
        t = en_bloques(t, k[nombre], '<div class="ap-bar int">', lambda b, a=args: pantalla_tel(b, *a))
    # Mientras carga, la barra dice solo el número: la versión llega con la respuesta.
    t = en_bloques(t, k["Cargando"], '<div class="ap-bar int">',
                   lambda b: una(b, '<span class="sub">Visita a cliente · versión 4</span>', ""))
    cuerpo = t.split("</helmet>")[1]
    assert "· versión " not in cuerpo and "tr-moms" not in cuerpo and 'class="tr-gr"' not in cuerpo and "tr-act" not in cuerpo
    assert cuerpo.count('<p class="e15-quien">') == 6 and cuerpo.count('<span class="e15-et">Proveedor · CUIT</span>') == 1
    escribir("M-FRM-Respuesta", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el tablero
# Los números de arriba (263): «Respuestas» y, de cada pregunta de número (las tres primeras), su caja con el total, el promedio, el
# mínimo y el máximo, cada uno con su nombre.
MONTO = [("Total", "1.217.381,00"), ("Promedio", "50.724,21"), ("Mínimo", "0,00"), ("Máximo", "212.000,00")]
KPIS_VIEJO = ('<div class="tb-kpis"><div class="tb-kpi"><span>Respuestas</span><b>24</b></div><div class="tb-kpi"><span>Total de Monto '
              'estimado</span><b>1.217.381,00</b><small>promedio 50.724,21 · de 0,00 a 212.000,00</small></div></div>')
KPIS_VIEJO_TEL = ('<div class="tb-kpis t2"><div class="tb-kpi"><span>Respuestas</span><b>24</b></div><div class="tb-kpi"><span>Total de '
                  'Monto estimado</span><b>1.217.381</b><small>promedio 50.724,21</small></div></div>')


def numeros(tel=False, preguntas=(("Monto estimado", MONTO),)):
    grupos = "".join(f'<div class="tb-kpi e15-g" role="group" aria-label="{q}"><span class="gt">{q}</span><div class="cel">'
                     + "".join(f'<div class="c"><span>{n}</span><b>{v}</b></div>' for n, v in vals) + "</div></div>"
                     for q, vals in preguntas)
    return (f'<div class="tb-kpis{" t2" if tel else ""} e15-kpis"><div class="tb-kpi e15-resp"><span>Respuestas</span><b>24</b></div>'
            f'{grupos}</div>')


# Quién cargó: las cinco primeras y «Otras» (spec: hasta seis filas), con su parte del total.
QUIEN = [("Paula Méndez", "7", "29%"), ("Tomás Acosta", "6", "25%"), ("Florencia Fernández de la Fuente", "4", "17%"),
         ("Lucía Fernández", "3", "13%"), ("Martín Paz", "2", "8%")]
OTRAS = ("Otras", "2", "8%")


def tabla_tarjeta(nombre, primera, filas, por, sentido, hover=None):
    """La tarjeta vista como tabla (264): toda columna ordena desde su encabezado, con la flecha en el color de la marca después
    del título (antes, en las de números, que van a la derecha) y ↕ al pasar; «Otras» queda siempre al final."""
    fl = "↑" if sentido == "ascending" else "↓"
    cols = [(primera, False), ("Respuestas", True), ("%", True)]
    cab = []
    for c, num in cols:
        clase = "h" + (" r" if num else "") + (" b2-hov" if c == hover else "")
        if c == por:
            flecha = f'<span class="b2-fl" aria-hidden="true">{fl}</span>'
            txt = (f'<span class="b2-fl" aria-hidden="true" style="margin: 0 5px 0 0;">{fl}</span>{c}' if num else f"{c}{flecha}")
            cab.append(f'<span class="{clase}" role="columnheader" aria-sort="{sentido}">{txt}</span>')
        elif c == hover:
            cab.append(f'<span class="{clase}" role="columnheader">{c}<span class="b2-fl hov" aria-hidden="true">↕</span></span>')
        else:
            cab.append(f'<span class="{clase}" role="columnheader">{c}</span>')
    cuerpo = "".join(f'<span role="cell"{" class=\"otras\"" if f is OTRAS else ""}>{f[0]}</span><span class="r" role="cell">{f[1]}</span>'
                     f'<span class="r" role="cell">{f[2]}</span>' for f in filas + [OTRAS])
    return f'<div class="e15-tt" role="table" aria-label="{nombre}">{"".join(cab)}{cuerpo}</div>'


POR_RESPUESTAS = sorted(QUIEN, key=lambda f: -int(f[1]))
POR_NOMBRE = sorted(QUIEN, key=lambda f: f[0])

CSS_TABLERO = """
/* E15 · Los números de arriba (263): «Respuestas» y la caja de cada pregunta de número con el total, el promedio, el mínimo y el
   máximo, cada uno con su nombre y ninguno debajo de otro. */
.tb-kpis.e15-kpis { display: flex; flex-wrap: wrap; gap: 16px; }
.e15-kpis .e15-resp { flex: 0 0 200px; box-sizing: border-box; }
.e15-kpis .e15-g { flex: 1 1 560px; min-width: 0; }
.tb-kpi.e15-g .gt { font-size: 13px; font-weight: 600; color: var(--t1); }
.e15-g .cel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 4px; }
.e15-g .c { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 0 16px; box-shadow: inset 1px 0 0 var(--borde); }
.e15-g .c:first-child { padding-left: 0; box-shadow: none; }

/* E15 · Una tarjeta como tabla (264): ordena por sus columnas; los números a la derecha y una línea fina entre columnas (137). */
.e15-tt { display: grid; grid-template-columns: minmax(0, 1fr) 112px 64px; border: 1px solid var(--borde); border-radius: 3px; font-size: 13px; }
.e15-tt > span { min-width: 0; padding: 8px 12px; border-top: 1px solid var(--borde); line-height: 1.4; overflow-wrap: anywhere; }
.e15-tt > span:not(:nth-child(3n+1)) { box-shadow: inset 1px 0 0 var(--borde); }
.e15-tt > .h { border-top: 0; background: oklch(0.945 0.027 95); color: var(--t2); font-weight: 600; white-space: nowrap; cursor: pointer; }
.e15-tt > .h.b2-hov { background: oklch(0.92 0.03 95); }
.e15-tt > .r { text-align: right; font-variant-numeric: tabular-nums; }
.e15-tt > .otras { color: var(--t2); }
"""

CSS_TABLERO_TEL = """
/* E15 · Los números de arriba (263), en el teléfono: la caja de cada pregunta de número con cada dato nombrado, de a dos. */
.tb-kpis.t2.e15-kpis { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
.tb-kpi.e15-g .gt { font-size: 14px; font-weight: 600; color: var(--t1); }
.e15-g .cel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px 14px; margin-top: 6px; }
.e15-g .c { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tb-tel .e15-g .c b { font-size: 20px; }

/* E15 · Una tarjeta como tabla (264). */
.e15-tt { display: grid; grid-template-columns: minmax(0, 1fr) 104px 56px; border: 1px solid var(--borde); border-radius: 10px; font-size: 14px; }
.e15-tt > span { min-width: 0; padding: 10px 10px; border-top: 1px solid var(--borde); line-height: 1.35; overflow-wrap: anywhere; }
.e15-tt > span:not(:nth-child(3n+1)) { box-shadow: inset 1px 0 0 var(--borde); }
.e15-tt > .h { border-top: 0; background: oklch(0.945 0.027 95); color: var(--t2); font-size: 13px; font-weight: 600; white-space: nowrap; }
.e15-tt > .r { text-align: right; font-variant-numeric: tabular-nums; }
.e15-tt > .otras { color: var(--t2); }
"""


def frm_tablero():
    t, nl = leer("FRM-Tablero")
    t = para_aprobar(con_css(t, b2.CSS_B2 + CSS_TABLERO))
    t = una(t, KPIS_VIEJO, numeros())
    # Los estados nuevos: Quién cargó como tabla, por respuestas y por persona.
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    ops = props["estado"]["options"]
    assert ops == ["Por día", "Una barra: su cartel", "Por semana", "Una tarjeta: menú", "Agregar gráfico: menú", "Sin respuestas",
                   "Ninguna coincide", "Cargando"], ops
    TABLA, NOMBRE = "Una tarjeta como tabla", "La tabla, ordenada por persona"
    ops[4:4] = [TABLA, NOMBRE]
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    t = t[:m.start(1)] + texto + t[m.end(1):]
    t = una(t, "conDatos: ['Por día', 'Una barra: su cartel', 'Por semana', 'Una tarjeta: menú', 'Agregar gráfico: menú'].includes(e),",
            f"conDatos: ['Por día', 'Una barra: su cartel', 'Por semana', 'Una tarjeta: menú', 'Agregar gráfico: menú', '{TABLA}', '{NOMBRE}'].includes(e),\n"
            f"      tablaCant: e === '{TABLA}', tablaNom: e === '{NOMBRE}', grafQuien: e !== '{TABLA}' && e !== '{NOMBRE}',\n"
            "      nResp: e === 'Sin respuestas' ? '0' : '24',")
    # Sin respuestas, la pestaña dice 0, no 24 (269: datos de verdad).
    t = una(t, 'href="FRM-Respuestas.dc.html">Respuestas <span class="c">24</span></a>',
            'href="FRM-Respuestas.dc.html">Respuestas <span class="c">{{nResp}}</span></a>')
    i = t.index('<div class="tb-cab"><span><b>Quién cargó</b>')
    a = t.index('<div class="tb-cuerpo"><div class="tb-hor">', i)
    b = b2.fin_div(t, a + len('<div class="tb-cuerpo">'))
    graf = t[a + len('<div class="tb-cuerpo">'):b]
    nuevo = (f'<sc-if value="{{{{grafQuien}}}}" hint-placeholder-val="{{{{si}}}}">{graf}</sc-if>'
             f'<sc-if value="{{{{tablaCant}}}}" hint-placeholder-val="{{{{no}}}}">'
             f'{tabla_tarjeta("Quién cargó", "Persona", POR_RESPUESTAS, "Respuestas", "descending", hover="Persona")}</sc-if>'
             f'<sc-if value="{{{{tablaNom}}}}" hint-placeholder-val="{{{{no}}}}">'
             f'{tabla_tarjeta("Quién cargó", "Persona", POR_NOMBRE, "Persona", "ascending")}</sc-if>')
    t = t[:a + len('<div class="tb-cuerpo">')] + nuevo + t[b:]
    cuerpo = t.split("</helmet>")[1]
    assert "promedio 50.724,21" not in cuerpo and cuerpo.count('class="e15-tt"') == 2
    assert cuerpo.count('<div class="tb-seg" role="radiogroup" aria-label="Agrupar por">') == 1  # «Día | Semana | Mes» sigue (262)
    escribir("FRM-Tablero", t, nl)


def m_frm_tablero():
    t, nl = leer("M-FRM-Tablero")
    t = para_aprobar(con_css(t, b2.CSS_B2 + b2.CSS_B2_TEL + CSS_TABLERO_TEL))
    t = todas(t, KPIS_VIEJO_TEL, numeros(tel=True), 3)
    assert estados(t) == ["Por día", "Una barra: su cartel", "Una tarjeta: menú", "Sin respuestas"], estados(t)
    t, nuevos = sumar_estados(t, "Una tarjeta: menú", ["Una tarjeta como tabla"])
    s = nuevos["Una tarjeta como tabla"]
    t = clonar(t, "s0", s)
    keb = re.search(r'aria-label="Acciones de Motivo" aria-haspopup="menu">(<svg.*?</svg>)', t, re.S).group(1)
    quien = (f'<div class="tb-card"><div class="tb-cab"><span><b>Quién cargó</b><small>Cantidad por persona</small></span>'
             f'<button type="button" class="ib" aria-label="Acciones de Quién cargó" aria-haspopup="menu">{keb}</button></div>'
             f'<div class="tb-cuerpo">{tabla_tarjeta("Quién cargó", "Persona", POR_RESPUESTAS, "Respuestas", "descending")}</div></div>')

    def bajada(bloque):
        """La pantalla bajada hasta el final del tablero: «Motivo» y «Quién cargó», vista como tabla."""
        i = bloque.index('<div class="ap-cuerpo ap-gris tb-tel">')
        j = b2.fin_div(bloque, i)
        motivo = bloque.index('<div class="tb-card"><div class="tb-cab"><span><b>Motivo</b>', i)
        fin_motivo = b2.fin_div(bloque, motivo)
        return bloque[:i] + '<div class="ap-cuerpo ap-gris tb-tel">' + bloque[motivo:fin_motivo] + quien + "</div>" + bloque[j:]

    t = en_bloques(t, s, '<div class="ap-bar int">', bajada)
    # Sin respuestas, la barra y la pestaña no dicen 24 (269), como `M-FRM-Respuestas` («Sin respuestas»).
    t = en_bloques(t, k_de(t)["Sin respuestas"], '<div class="ap-bar int">',
                   lambda b: una(una(b, '<span class="sub">24 respuestas</span>', '<span class="sub">Sin respuestas</span>'),
                                 'Respuestas <span class="c">24</span>', 'Respuestas <span class="c">0</span>'))
    cuerpo = t.split("</helmet>")[1]
    assert "promedio 50.724,21" not in cuerpo and cuerpo.count('class="e15-tt"') == 1
    escribir("M-FRM-Tablero", t, nl)


HACER = [("FRM-Respuesta", frm_respuesta), ("FRM-Respuesta-Completa", frm_respuesta_completa), ("M-FRM-Respuesta", m_frm_respuesta),
         ("FRM-Tablero", frm_tablero), ("M-FRM-Tablero", m_frm_tablero)]

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
