"""El cierre de la tanda 3A (v187, 2026-11-26): la E15 a la E18 aprobadas por el usuario (decisión 286 de la hoja de ruta de
formularios), con la opción recomendada en las 14 preguntas.

- Los 49 tableros de la E15 a la E18 (`ETAPAS` de `e15_e18_registrar_1004.py`, también `FRM-Config-Org`, `M-FRM-Config-Org` y
  `FRM-Config-Plat`) pierden « · para aprobar» en su `<title>` y en `canvas.json`.
- Lo que la 286 decidió y no estaba dibujado:
  - `M-FRM-Formularios-17`: la tarjeta abre «Diseño» y el número de respuestas, la planilla, con su propia zona de 44 px (275),
    como `M-FRM-Formularios-15`;
  - `FRM-Editor` (E14), en «Solo lectura»: «Para quién es» apagada, como en `FRM-Editor-16`;
  - `FRM-Datos-Personas`: el estado nuevo «20 datos: la tabla a lo ancho», con «Persona» y el ⋮ fijos, como la tabla de un catálogo
    (`k-desp`);
  - `FRM-Config-Org` y su teléfono: «Sin permiso» pasa a «Solo lectura», como `WA-Config-Base2`: la lee quien tiene `forms.read` y
    la cambia quien tiene `forms.manage`.
- Lo que la 3A dejó sin dibujar:
  - `M-WA-Menu`: «Formularios › Configuración», después de «Asistente», como el panel de Administración de la compu;
  - `WA-Chats-Adjuntos` y su teléfono: el tamaño del documento al lado del nombre, como la E18, y «Descargar» como ícono con su nombre;
  - `FRM-Formularios`, `M-FRM-Formularios`, `FRM-Formularios-15` y `M-FRM-Formularios-15`: las filas por nombre, como dice su
    «Ordenar por: Formulario, de la A a la Z»;
  - `FRM-Reactivar-Eliminar`: al borrar un borrador («Borrar un borrador», «Borrando» y «No se pudo borrar»), el editor de atrás sin
    la barra de pestañas, porque un borrador solo tiene «Diseño» (193).

`--canvas <ruta>` escribe en otro `canvas.json` (el publicado, traído al scratchpad). Se puede volver a correr: lo ya cambiado no
cambia.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from e15_e18_registrar_1004 import ETAPAS  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
SUFIJO = " · para aprobar"
TABLEROS = [n for etapa in ("15", "16", "17", "18") for n in ETAPAS[etapa]]
MARCA = '<style data-c3a="cierre">'


def leer(nombre):
    return (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")


def escribir(nombre, viejo, nuevo, que):
    if nuevo != viejo:
        (PROJ / f"{nombre}.dc.html").write_text(nuevo, encoding="utf-8", newline="")
    print("ok", nombre, que, "(sin cambios)" if nuevo == viejo else "")


def con_css(t, css):
    """Suma el bloque de este cierre antes de `</helmet>`, una sola vez."""
    if MARCA in t:
        return t
    return t.replace("</helmet>", MARCA + "\n" + css.strip() + "\n</style>\n</helmet>", 1)


def fin_scif(t, i):
    """El final del `<sc-if>` que empieza en `i`, contando los anidados."""
    prof = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        prof += -1 if m.group(0) == "</sc-if>" else 1
        if prof == 0:
            return i + m.end()
    raise ValueError("sc-if sin cerrar")


def fin_div(t, i):
    prof = 0
    for m in re.finditer(r"<div\b|</div>", t[i:]):
        prof += -1 if m.group(0) == "</div>" else 1
        if prof == 0:
            return i + m.end()
    raise ValueError("div sin cerrar")


def bloque(t, clave, ocurrencia=0):
    """Dónde empieza y termina el `<sc-if value="{{clave}}">` pedido."""
    inicios = [m.start() for m in re.finditer(r'<sc-if value="\{\{' + clave + r'\}\}"', t)]
    i = inicios[ocurrencia]
    return i, fin_scif(t, i)


# ── Los títulos ────────────────────────────────────────────────────────────────────────────────────────────────────────────

def titulos():
    for n in TABLEROS:
        t = leer(n)
        nuevo = re.sub(r"(<title>[^<]*?)" + re.escape(SUFIJO) + "</title>", r"\1</title>", t, count=1)
        assert SUFIJO not in re.search(r"<title>[^<]*</title>", nuevo).group(0), n
        escribir(n, t, nuevo, "título")


def canvas(ruta):
    texto = ruta.read_text(encoding="utf-8", newline="")
    c = json.loads(texto)
    for n in TABLEROS:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].removesuffix(SUFIJO)
    nl = "\r\n" if "\r\n" in texto else "\n"
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2).replace("\n", nl) + ("" if texto.endswith("}") else nl),
                    encoding="utf-8", newline="")
    print("ok", ruta, len(TABLEROS), "títulos")


# ── M-FRM-Formularios-17: la lista del teléfono como la de la E15 ─────────────────────────────────────────────────────────

CSS_E15_TJ = """
/* 286 · Como la E15 (275): la tarjeta abre «Diseño»; el número de respuestas, la planilla, con su propia zona de toque de 44 px. */
.e15-tj .b2-tj-a::after { content: ""; position: absolute; inset: 0; }
.e15-tj .dl { position: relative; pointer-events: none; }
.e15-tj .dl .b2-i { pointer-events: auto; }
.e15-tj .e15-cnt { position: relative; z-index: 1; display: inline-flex; align-items: center; min-height: 44px; margin: -12px 0; padding-right: 24px; color: var(--marca-tx); font-weight: 600; text-decoration: none; pointer-events: auto; }
"""

TARJETA = re.compile(r'<div class="b2-tj"><a class="b2-tj-a" href="(M-FRM-Editor(?:-Baja)?\.dc\.html)"><span class="cu">'
                     r'<span class="nm">([^<]*)</span><span class="dl">(.*?)</span></span></a>', re.S)


def lista_17():
    n = "M-FRM-Formularios-17"
    t = leer(n)

    def tarjeta(m):
        dl = re.sub(r'(<span class="k">Respuestas</span><span class="v">)([1-9]\d*)(</span>)',
                    r'\1<a class="e15-cnt" href="M-FRM-Respuestas.dc.html">\2</a>\3', m.group(3), count=1)
        return (f'<div class="b2-tj e15-tj"><a class="b2-tj-a" href="{m.group(1)}"><span class="cu"><span class="nm">{m.group(2)}'
                f'</span></span></a><span class="dl">{dl}</span>')

    nuevo, k = TARJETA.subn(tarjeta, t)
    nuevo = con_css(nuevo, CSS_E15_TJ)
    escribir(n, t, nuevo, f"{k} tarjetas")


# ── FRM-Editor: «Para quién es» apagada en solo lectura ───────────────────────────────────────────────────────────────────

def editor_lectura():
    n = "FRM-Editor"
    t = leer(n)
    i, j = bloque(t, "s24", 1)
    viejo = '<button type="button" class="b2-pkc" aria-haspopup="listbox" aria-expanded="false" aria-label="Para quién es">'
    nuevo_b = ('<button type="button" class="b2-pkc apag" aria-haspopup="listbox" aria-expanded="false" aria-label="Para quién es" '
               'aria-disabled="true">')
    b = t[i:j]
    assert viejo in b or nuevo_b in b, "no está «Para quién es» en solo lectura"
    nuevo = t[:i] + b.replace(viejo, nuevo_b) + t[j:]
    escribir(n, t, nuevo, "solo lectura")


# ── FRM-Datos-Personas: con 20 datos, la tabla a lo ancho ─────────────────────────────────────────────────────────────────

ESTADO_ANCHO = "20 datos: la tabla a lo ancho"
DATOS = ["Zona", "Sucursal", "Área", "Cargo", "Turno", "Centro de costo", "Región", "Canal", "Equipo", "Supervisor", "Categoría",
         "Nivel", "Idioma", "Vehículo", "Depósito", "Línea de producto", "Ruta", "Planta", "Legajo", "Proyecto"]
G = None  # «—» en gris
PERSONAS = [
    ("Juan Gómez", ["Centro", "Casa central", "Ventas", "Vendedor", "Mañana", "CC-101", "AMBA", "Mayorista", "Equipo A",
                    "Paula Méndez", "B", "Senior", "Español", G, "Central", "Frío", "R-12", G, "1042", G]),
    ("Lucía Fernández", ["Centro", "Casa central", "Administración", "Gerenta", "Mañana", "CC-100", "AMBA", G, "Dirección", G,
                         "A", "Senior", "Español", G, "Central", G, G, G, "1001", "Expansión 2026"]),
    ("Martín Paz", ["Sur", "Casa central", "Ventas", "Vendedor", "Tarde", "CC-101", "AMBA", "Minorista", "Equipo B",
                    "Paula Méndez", "B", "Junior", "Español", G, "Sur", "Frío", "R-07", G, "1077", G]),
    ("Paula Méndez", ["Norte", "Planta Norte", "Logística", "Supervisora", "Mañana", "CC-204", "Litoral", "Mayorista", "Equipo C",
                      "Lucía Fernández", "A", "Senior", "Español", G, "Norte", "Lavado", "R-21", "Planta Norte", "1015", G]),
    ("Sofía Herrera", [G, G, "Ventas", "Vendedora", "Tarde", "CC-101", G, "Minorista", "Equipo A", "Paula Méndez", "C", "Junior",
                       "Inglés", G, G, "Climatización", "R-12", G, "1103", G]),
    ("Tomás Acosta", [G, "Planta Norte", "Logística", "Chofer", "Noche", "CC-204", "Litoral", G, "Flota", "Paula Méndez", "C",
                      "Semi senior", "Español", "AE 123 CD", "Norte", G, "R-21", "Planta Norte", "1120", G]),
]
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/>'
         '<circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>')
ANCHO_TABLA = 16 + 180 + 20 * 120 + 48 + 21 * 12 + 8

CSS_ANCHO = """
/* 286 · Con 20 datos, «Personas» se desplaza a lo ancho dentro de su caja, con «Persona» y el ⋮ fijos, con el fondo de su fila y una
   línea, como la tabla de un catálogo (`k-desp` de `FRM-Catalogo`). */
.k-desp { overflow-x: auto; scrollbar-width: thin; scrollbar-color: var(--borde2) transparent; }
.k-desp .w-th, .k-desp .w-tr { overflow: visible; --fxbg: #fff; }
.k-desp .w-tr:nth-child(odd) { --fxbg: oklch(0.975 0.01 95); }
.k-desp .w-th { --fxbg: oklch(0.945 0.027 95); }
.k-desp .w-th > .fx, .k-desp .w-tr > .fx { position: sticky; z-index: 2; align-self: stretch; display: flex; align-items: center; background: var(--fxbg); }
.k-desp .w-th > .fx { z-index: 3; }
.k-desp .fx-campo { left: 16px; box-shadow: -16px 0 0 var(--fxbg), 6px 0 0 var(--fxbg), 7px 0 0 var(--borde); }
.k-desp .fx-d { right: 8px; box-shadow: 8px 0 0 var(--fxbg), -5px 0 0 var(--fxbg), -6px 0 0 var(--borde); }
.k-desp .w-th.dp-p20, .k-desp .w-tr.dp-p20 { grid-template-columns: 180px repeat(20, 120px) 48px; gap: 12px; }
.k-desp .w-tr.dp-p20 { min-height: 32.6px; }
"""


def celda(v):
    return '<span class="dp-g">—</span>' if v is None else f"<span>{v}</span>"


def tabla_ancha():
    cab = ('<div class="w-th dp-p20"><span class="fx fx-campo" aria-sort="ascending">Persona<span class="b2-fl" aria-hidden="true">↑'
           '</span></span>' + "".join(f"<span>{d}</span>" for d in DATOS) + '<span class="dp-ac fx fx-d">Acciones</span></div>')
    filas = "".join(
        f'<div class="w-tr dp-p20"><span class="fx fx-campo">{p}</span>' + "".join(celda(v) for v in vals)
        + f'<span class="dp-ac fx fx-d"><button type="button" class="ib" aria-label="Acciones de {p}" aria-haspopup="menu" '
          f'aria-expanded="false">{KEBAB}</button></span></div>'
        for p, vals in PERSONAS)
    return f'<div class="k-desp"><div class="k-tabla" style="min-width: {ANCHO_TABLA}px;">{cab}{filas}</div></div>'


def datos_personas():
    n = "FRM-Datos-Personas"
    t = leer(n)
    if ESTADO_ANCHO in t:
        escribir(n, t, t, "20 datos a lo ancho")
        return
    i, j = bloque(t, "s9")
    b = t[i:j]
    # El mismo estado que «20 datos», con la tabla «Personas» de los veinte datos.
    a = b.index('<div class="w-th dp-p">')
    z = b.index('<div class="w-pie">', a)
    b2 = b[:a] + tabla_ancha() + b[z:]
    b2 = b2.replace('<sc-if value="{{s9}}"', '<sc-if value="{{s23}}"', 1)
    nuevo = t[:j] + b2 + t[j:]
    # El estado en la lista de la propiedad, después de «20 datos», y en la cuenta.
    nuevo = nuevo.replace('"20 datos",', f'"20 datos","{ESTADO_ANCHO}",', 1)
    nuevo = nuevo.replace('"Elegir el tipo"].indexOf(e)', f'"Elegir el tipo", "{ESTADO_ANCHO}"].indexOf(e)', 1)
    nuevo = nuevo.replace("      s22: k === 22,\n", "      s22: k === 22,\n      s23: k === 23,\n", 1)
    assert nuevo.count(ESTADO_ANCHO) == 2 and "s23: k === 23" in nuevo, "no se pudo sumar el estado"
    nuevo = con_css(nuevo, CSS_ANCHO)
    escribir(n, t, nuevo, "20 datos a lo ancho")


# ── FRM-Config-Org y su teléfono: «Sin permiso» pasa a «Solo lectura» ─────────────────────────────────────────────────────

def config_lectura():
    for n in ("FRM-Config-Org", "M-FRM-Config-Org"):
        t = leer(n)
        nuevo = t.replace('"Sin permiso"', '"Solo lectura"')
        assert '"Sin permiso"' not in nuevo
        escribir(n, t, nuevo, "solo lectura")


# ── M-WA-Menu: «Formularios › Configuración» ─────────────────────────────────────────────────────────────────────────────

def menu_mas():
    n = "M-WA-Menu"
    t = leer(n)
    if 'href="M-FRM-Config-Org.dc.html"' in t:
        escribir(n, t, t, "Formularios › Configuración")
        return
    m = re.search(r'(<a class="ap-it " href="M-Asistente-Uso-Org\.dc\.html"><span class="tx"><b>Uso</b></span>'
                  r'(<span class="chev">.*?</span>)</a></div>)', t, re.S)
    grupo = ('<span class="ap-gtit">Formularios</span><div class="ap-grupo"><a class="ap-it " href="M-FRM-Config-Org.dc.html">'
             f'<span class="tx"><b>Configuración</b></span>{m.group(2)}</a></div>')
    nuevo = t[:m.end()] + grupo + t[m.end():]
    escribir(n, t, nuevo, "Formularios › Configuración")


# ── WA-Chats-Adjuntos y su teléfono: el tamaño al lado y «Descargar» como ícono ──────────────────────────────────────────

DESCARGAR = ('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5"/>'
             '<path d="M5 19.5h14"/></svg>')
DOC = re.compile(r'<span class="r-doc"><span class="pdf">PDF</span><span class="t">([^<]+)<small>([^<]+)</small></span>'
                 r'(?:<button type="button" class="cb cb-sec" aria-label="Descargar ([^"]+)">Descargar</button>)?</span>')
CSS_DOC = """
/* Como la E18: el nombre del documento y su tamaño al lado, con una línea; «Descargar», un ícono con su nombre. */
.r-doc.c3a-doc .t { flex-direction: row; align-items: center; gap: 7.2px/*10px*/; }
.c3a-doc .t .nm { min-width: 0; overflow-wrap: anywhere; }
.c3a-doc .t .tam { flex: none; padding-left: 7.2px/*10px*/; border-left: 1px solid var(--borde); color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }
.c3a-doc .ib { flex: none; }
"""
CSS_DOC_TEL = """
/* Como la E18: el nombre del documento y su tamaño al lado, con una línea; «Descargar», un ícono con su nombre y su zona de 44 px. */
.r-doc.c3a-doc .t { flex-direction: row; align-items: center; gap: 10px; }
.c3a-doc .t .nm { min-width: 0; overflow-wrap: anywhere; }
.c3a-doc .t .tam { flex: none; padding-left: 10px; border-left: 1px solid var(--borde); color: var(--t2); font-variant-numeric: tabular-nums; white-space: nowrap; }
.c3a-doc .ib { flex: none; width: 44px; height: 44px; margin: -6px -6px -6px 0; }
"""


def adjuntos():
    for n, css in (("WA-Chats-Adjuntos", CSS_DOC), ("M-WA-Chats-Adjuntos", CSS_DOC_TEL)):
        t = leer(n)

        def doc(m):
            nombre, tam = m.group(1), m.group(2)
            boton = (f'<button type="button" class="ib" aria-label="Descargar {nombre}" title="Descargar {nombre}">{DESCARGAR}</button>'
                     if m.group(3) else "")
            return (f'<span class="r-doc c3a-doc"><span class="pdf">PDF</span><span class="t"><span class="nm">{nombre}</span>'
                    f'<span class="tam">{tam}</span></span>{boton}</span>')

        nuevo, k = DOC.subn(doc, t)
        assert ">Descargar</button>" not in nuevo, n
        nuevo = con_css(nuevo, css)
        escribir(n, t, nuevo, f"{k} documentos")


# ── Las listas de formularios, por nombre ────────────────────────────────────────────────────────────────────────────────

ORDEN = ["Con", "Ent", "Ins", "Rec", "Rel", "Vis"]


def ordenar_grupos(t, bloques):
    """`bloques`: (inicio, fin, clave). Ordena cada tanda de bloques pegados por su clave, de atrás para adelante."""
    grupos, actual = [], []
    for b in bloques:
        if actual and actual[-1][1] != b[0]:
            grupos.append(actual)
            actual = []
        actual.append(b)
    if actual:
        grupos.append(actual)
    for g in reversed(grupos):
        if len(g) < 2:
            continue
        partes = sorted(g, key=lambda b: b[2])
        t = t[:g[0][0]] + "".join(t[b[0]:b[1]] for b in partes) + t[g[-1][1]:]
    return t


def listas_por_nombre():
    for n in ("FRM-Formularios", "FRM-Formularios-15"):
        t = leer(n)
        bloques = [(m.start(), fin_scif(t, m.start()), ORDEN.index(m.group(1)))
                   for m in re.finditer(r'<sc-if value="\{\{r(Con|Ent|Ins|Rec|Rel|Vis)\}\}"', t)]
        nuevo = ordenar_grupos(t, bloques)
        escribir(n, t, nuevo, "por nombre")
    for n in ("M-FRM-Formularios", "M-FRM-Formularios-15"):
        t = leer(n)
        i, j = bloque(t, "s0")
        bloques = []
        for m in re.finditer(r'<div class="b2-tj[^"]*">', t[i:j]):
            a = i + m.start()
            z = fin_div(t, a)
            nombre = re.search(r'<span class="nm">([^<]*)</span>', t[a:z]).group(1)
            bloques.append((a, z, nombre))
        nuevo = ordenar_grupos(t, bloques)
        escribir(n, t, nuevo, "por nombre")


# ── FRM-Reactivar-Eliminar: borrar un borrador, sin pestañas ─────────────────────────────────────────────────────────────

def borrar_sin_pestanas():
    n = "FRM-Reactivar-Eliminar"
    t = leer(n)
    nuevo = t
    quitadas = 0
    for clave in ("s8", "s7", "s5"):  # «No se pudo borrar», «Borrando» y «Borrar un borrador»: «Reclamo», un borrador
        for k in reversed(range(len(re.findall(r'<sc-if value="\{\{' + clave + r'\}\}"', nuevo)))):
            i, j = bloque(nuevo, clave, k)
            b = nuevo[i:j]
            m = re.search(r'<div class="f-tabs" role="tablist" aria-label="Vistas del formulario">.*?</div>', b, re.S)
            if m:
                assert "Reclamo" in b, clave
                b = b[:m.start()] + b[m.end():]
                quitadas += 1
            nuevo = nuevo[:i] + b + nuevo[j:]
    print("  pestañas quitadas:", quitadas)
    escribir(n, t, nuevo, "borrar un borrador sin pestañas")


if __name__ == "__main__":
    titulos()
    lista_17()
    editor_lectura()
    datos_personas()
    config_lectura()
    menu_mas()
    adjuntos()
    listas_por_nombre()
    borrar_sin_pestanas()
    destino = pathlib.Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else PROJ / "canvas.json"
    canvas(destino)
