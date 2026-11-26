"""La carga desde la web de la E20 y la E21 con el traspaso 18, tanda 3B (2026-11-26), en sus once tableros: la página, el panel,
«Enviada», las listas de catálogo, las fotos y la pregunta «Correo», con sus teléfonos.

- **Todo lo que se elige, en la pieza (262):** el Sí o No (que sigue arrancando vacío), elegir una y elegir varias, y la lista de un
  catálogo, en la pieza cerrada y en una columna (262 «La carga», que cambia la 141): se van el segmentado, los radios en fila y las
  casillas en columnas. Sin nada elegido, la pieza dice en gris «Elegí una opción», como allá; una lista dependiente espera apagada
  con «Elegí primero «Zona»» en su campo (166). La lista de un catálogo ya no se busca escribiendo en el campo: el buscador va adentro
  de la lista, con la cantidad («58 opciones de Centro»), «Buscando…», «Ninguna opción coincide…» y «Mostrar 50 más»; elegir varias
  dice «Hasta 3» y el campo dice las elegidas por su nombre, sin chips. La ✕ de la opción elegida se va: lo que no es obligatorio
  ofrece «Sin respuesta» primero, separada por una línea. En el teléfono, la pieza a pantalla completa, con renglones de 56 px, el
  buscador si son más de diez y «Listo (N)» en varias (`pk_tel`). Estados nuevos: «Elegir el motivo» en `FRM-Cargar-Respuesta` y su
  teléfono, y «Elegir las fallas» (varias, «Hasta 3») en `FRM-Cargar-Respuesta-21` y su teléfono.
- **La forma del formulario, editable (266 y 141):** las zonas, la grilla de hasta tres por renglón y el ancho de cada tipo. En
  «Visita a cliente», «Fallas» pasa a una columna y entra en el renglón de «¿Se concretó la venta?» y «Motivo»; su (i) «Elegí hasta
  3.» se va, porque lo dice la lista. «Pedido de materiales», versión 4, es el mismo en todos los tableros: las listas y «Enviada»
  suman «Lugar de entrega», la columna «Importe» del bloque y «Total», que solo tenía la página (230 y 234), y una zona plegada de
  «Entrega» dice «6 de 6 respondidas» (166). El panel sigue en una columna, como allá: es una zona angosta, y por eso el bloque va en
  recuadros.
- **«Enviada» se lee con la forma de la E20 (266):** lo que se mandó, en sus zonas y su grilla, cada pregunta en su recuadro gris claro
  con el valor en negro, sin flecha ni asterisco; el cálculo en gris con su (i); la ubicación en un renglón con su precisión y «Ver en
  el mapa»; el bloque en su tabla sin acciones (en el teléfono, en recuadros), y las fotos sin la ✕. Reemplaza la lista de «Rótulo:
  valor». En el teléfono igual, con los mismos tres botones al pie.
- **Cada ítem del bloque con ↑ ↓ y 🗑 en su banda (261):** en el panel y en el teléfono, el tacho en rojo reemplaza al botón
  «Quitar». Con el mínimo queda apagado con su motivo en el tooltip: el estado nuevo «El tacho apagado» del teléfono lo muestra
  abierto (211).
- **Nada debajo de otro dato (263):** el punto y su precisión van en un renglón, en la carga y en la lectura.
- **Lo apagado dice por qué (211):** «Enviar» apagado deja `disabled` por `aria-disabled`, con su motivo en el tooltip, también en el
  teléfono; la lista que no se puede usar sin el dato de la persona lleva «Te falta el dato «Sucursal».» en el suyo.
- **El panel «Gestión de formularios» en dos grupos (275):** «Formularios» arriba y, tras una línea sin título, «Catálogos», en los
  seis tableros de la compu.

Por tablero:
- `FRM-Cargar-Respuesta`: las piezas (Sí o No, «Motivo», «Zona», «Proveedor» y «Producto» en la tabla del bloque), la ubicación en un
  renglón y el estado «Elegir el motivo», con «Sin respuesta» primero.
- `M-FRM-Cargar-Respuesta`: lo mismo, el tacho en la banda de cada ítem y los estados «Elegir el motivo» (a pantalla completa) y «El
  tacho apagado».
- `FRM-Cargar-Panel`: las piezas y el tacho en la banda de cada ítem; mientras envía, las piezas apagadas como los demás controles.
- `FRM-Cargar-Enviada` y `M-FRM-Cargar-Enviada`: «Enviada» con la forma de la E20, de solo lectura; en los demás estados, las piezas,
  «Enviar» apagado con su motivo y «6 de 6 respondidas»; «Una opción dada de baja» suma la ubicación, «Importe» y «Total».
- `FRM-Cargar-Lista` y `M-FRM-Cargar-Lista`: la lista de un catálogo en la pieza (abierta, buscando, sin coincidencias y varias), y
  la zona «Entrega» de la versión 4 entera; en el teléfono, la lista a pantalla completa con «Listo (2)» en varias.
- `FRM-Cargar-Archivos` y `M-FRM-Cargar-Archivos`: ya seguían la carga redibujada (sin piezas ni bloque a la vista); solo «Entrega»
  cuenta «6 de 6 respondidas».
- `FRM-Cargar-Respuesta-21` y `M-FRM-Cargar-Respuesta-21`: las piezas, «Fallas» en una columna y el estado «Elegir las fallas»; en el
  teléfono, las zonas plegadas dicen cuántas se respondieron.

La planilla de atrás del panel es de `FRM-Respuestas-20` y no se toca acá.

Corre una vez sobre los tableros de la v187: cada uno suma el bloque `<style data-t3b="e20-carga">` y « · para aprobar» en su título, y
si ya lo tiene no cambia. Después pasa `traspaso10_piezas_1004.py --tableros <los once>` (la escala de la compu) y parte el panel
(275), que se pueden volver a correr. Lee y escribe sin cambiar los finales de línea.

Uso: `python e20_carga_1004.py`
"""
import io
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e14_panel_1004 as e14p  # noqa: E402
from e14_editor_1004 import cierre, renombrar, s_de, sc_ifs, sumar_estados, una  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
MARCA = 'data-t3b="e20-carga"'
SUFIJO = " · para aprobar"
SVG = r"<svg\b[^>]*>.*?</svg>"

COMPU = ["FRM-Cargar-Respuesta", "FRM-Cargar-Panel", "FRM-Cargar-Enviada", "FRM-Cargar-Lista", "FRM-Cargar-Archivos",
         "FRM-Cargar-Respuesta-21"]
TELEFONO = ["M-FRM-Cargar-Respuesta", "M-FRM-Cargar-Enviada", "M-FRM-Cargar-Lista", "M-FRM-Cargar-Archivos",
            "M-FRM-Cargar-Respuesta-21"]

ELEGI = "Elegí una opción"
# Las preguntas de catálogo de «Pedido de materiales»: en el teléfono se reconocen por su nombre.
CATALOGO = {"Zona", "Proveedor", "Producto", "Rubros"}
MOTIVOS = ["Venta nueva", "Reclamo", "Seguimiento"]
FALLAS = ["Frío", "Ruido", "Puerta", "Luz"]
PROVEEDORES = [("Aceros Rosario", "CUIT 30-70988123-4"), ("Bulonera del Centro", "CUIT 30-71244551-8"),
               ("Caños del Litoral", "CUIT 30-70551882-3"), ("Distribuidora Centro", "CUIT 30-71009127-9"),
               ("Ferretería Industrial", "CUIT 30-70811234-1"), ("Hierros del Sur", "CUIT 30-71500231-6")]
RUBROS = ["Adhesivos", "Aislantes", "Bulonería", "Caños", "Conexiones", "Electricidad", "Grifería", "Herramientas", "Iluminación",
          "Pinturas", "Seguridad", "Selladores"]
RUBROS_ELEGIDOS = ("Caños", "Conexiones")
CANTIDAD_PROVEEDOR = "58 opciones de Centro"
MAS = '<button type="button" class="mas">Mostrar 50 más</button>'
SIN_DATO = "Te falta el dato «Sucursal»."
TACHO_MIN = "Al menos 1 ítem."
MOTIVO_ENVIAR = {"Versión nueva": "Pasá a la versión nueva para enviar.", "Se dio de baja": "Este formulario se dio de baja."}
PUNTO = "-34.603722, -58.381592"
MAPA = "https://www.google.com/maps?q=-34.603722,-58.381592"

# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala: la pasada de las piezas las achica en la compu.
CSS_COMPU = b2.css(False) + """
/* E20 · tanda 3B (262): la pieza en la carga, del ancho de su columna; en la tabla del bloque, del alto de la celda; mientras se
   envía, apagada como los demás controles. */
.cg-q .b2-env { width: 100%; }
.cg-blq-t > span > .b2-env { flex: 1; min-width: 0; }
.cg-blq-t .b2-pkc { height: 34px; }
.b2-pkc.des { opacity: 0.6; cursor: default; }
.cg-q .b2-pkl { min-width: 280px; }
.b2-op .cb { padding: 0; }
/* 263 · El punto y su precisión, en un renglón. */
.t15e-ubox .tx { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 8px; }
/* 261 · El tacho de cada ítem, en rojo en la banda del recuadro, en lugar de «Quitar». */
.cg-it .b .ib.pel { color: var(--peligro); }
/* 266 · Lo enviado se lee con la forma del formulario: cada pregunta en su recuadro gris claro, con el valor en negro. */
.ct.t3b-lee { background: var(--s2); border-color: var(--borde); color: var(--t1); }
.ct.t3b-lee.t3b-ub { justify-content: flex-start; gap: 8px; }
.t3b-ub .pt { font-variant-numeric: tabular-nums; }
.t3b-ub .pr { color: var(--t3); white-space: nowrap; }
.t3b-ub a { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; color: var(--marca-tx); font-weight: 600; text-decoration: none; white-space: nowrap; }
.cg-blq-t.t3b-lee { grid-template-columns: 40px minmax(200px, 1.4fr) minmax(120px, 1fr) 120px !important; min-width: 520px !important; }
.cg-blq-t.t3b-lee > span { min-height: 34px; }
"""
# Lo de la ubicación y los cálculos de `cargar_web_t15_1004.py` (CSS_CARGA), para los tableros que todavía no lo tenían.
CSS_CARGA = """
/* 230 y 234 · La ubicación y los cálculos, como en la página (los tableros que no los tenían). */
.t15e-ub { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.t15e-ubtn { display: inline-flex; align-items: center; gap: 8px; }
.t15e-ubox { align-self: stretch; display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; }
.t15e-ubox .ic { color: var(--marca-tx); display: inline-flex; }
.t15e-ubox .tx { flex: 1; min-width: 0; display: flex; line-height: 1.35; }
.t15e-ubox .pt { font-variant-numeric: tabular-nums; }
.t15e-ubox .pr { display: inline-flex; align-items: center; gap: 4px; color: var(--t3); font-size: 12px; }
.t15e-ubox .ib.pel { color: var(--peligro); }
.t15e-ulinks { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; }
.t15e-ulinks a { display: inline-flex; align-items: center; gap: 4px; color: var(--marca-tx); font-weight: 600; }
.t15e-calc { color: var(--t3); font-variant-numeric: tabular-nums; }
div.t15e-calc { min-height: 34px; display: flex; align-items: center; }
.cg-blq-t > span.t15e-calc { justify-content: flex-end; }
.cg-blq-t > .h.r { justify-content: flex-end; }
.cg-blq-t { grid-template-columns: 40px minmax(200px, 1.4fr) minmax(120px, 1fr) 120px 112px !important; min-width: 640px !important; }
"""
CSS_TEL = b2.css(True) + """
/* E20 · tanda 3B (262): la pieza en la carga, a lo ancho; mientras se envía, apagada como los demás controles. */
.ap-cmp .b2-env, .cg-tc .b2-env { width: 100%; }
.b2-pkc.des { opacity: 0.6; }
/* 263 · El punto y su precisión, en un renglón. */
.t15e-ubox .tx { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 8px; }
/* 261 · El tacho de cada ítem, en rojo en la banda del recuadro, en lugar de «Quitar»; con el mínimo, su motivo en el tooltip (211). */
.cg-tit .b .ap-ib.pel { color: var(--peligro); }
.t3b-tipw { position: relative; display: inline-flex; }
.t3b-tipw .acc-tip { left: auto; right: 0; }
.t3b-tipw .acc-tip::after { left: auto; right: 14px; }
.cg-tz:has(.acc-tip), .cg-tit:has(.acc-tip), .cg-tc:has(.acc-tip) { overflow: visible; }
.ap-fijo .cb[aria-disabled="true"] { opacity: 0.55; }
/* 266 · Lo enviado se lee con la forma del formulario: cada pregunta en su recuadro gris claro, con el valor en negro. */
.ap-cmp .ct.t3b-lee { background: var(--s2); border-color: var(--borde); color: var(--t1); }
.ap-cmp .ct.t3b-lee.t3b-ub { justify-content: flex-start; gap: 8px; }
.t3b-ub .pt { font-variant-numeric: tabular-nums; }
.t3b-ub .pr { color: var(--t3); font-size: 14px; white-space: nowrap; }
.ap-cmp .t3b-mapa { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--marca-tx); font-size: 15px; font-weight: 600; text-decoration: none; }
"""
CSS_CARGA_TEL = """
/* 230 y 234 · La ubicación y los cálculos, como en la página (los tableros que no los tenían). */
.t15e-ub { display: flex; flex-direction: column; gap: 8px; }
.t15e-ub .cb { min-height: 44px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.t15e-calc { color: var(--t3); font-variant-numeric: tabular-nums; }
div.t15e-calc { min-height: 44px; display: flex; align-items: center; font-size: 15.5px; }
"""


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    t = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in t else "\n"
    return t.replace("\r\n", "\n"), nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def con_css(t, css):
    assert MARCA not in t
    t = re.sub(r"<title>(.*?)</title>", lambda m: m.group(0) if m.group(1).endswith(SUFIJO)
               else f"<title>{m.group(1)}{SUFIJO}</title>", t, count=1)
    return t.replace("</helmet>", f"<style {MARCA}>\n{css.strip()}\n</style>\n</helmet>", 1)


def cuerpo_de(t):
    """La cabeza (hasta `</helmet>`), el cuerpo y el guion: solo se cambia el cuerpo."""
    i, j = t.index("</helmet>"), t.index('<script type="text/x-dc"')
    return t[:i], t[i:j], t[j:]


def sin_estilos(t):
    """El cuerpo del tablero sin sus `<style>`, para comprobar que no quedó una pieza vieja."""
    return re.sub(r"<style.*?</style>", "", cuerpo_de(t)[1], flags=re.S)


def por_bloque(t, f):
    """Aplica `f(nombre_del_estado, bloque)` a cada `sc-if` de primer nivel de cada estado."""
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    out, pos = [], 0
    for m in re.finditer(r'<sc-if value="\{\{s(\d+)\}\}"', t):
        if m.start() < pos:
            continue
        fin = cierre(t, m.start(), "sc-if")
        out.append(t[pos:m.start()] + f(lista[int(m.group(1))], t[m.start():fin]))
        pos = fin
    return "".join(out) + t[pos:]


def elementos(c, abre):
    """Los inicios de cada `abre` (por ejemplo `<div class="w-cmp cg-q`), de atrás para adelante: los de adentro primero."""
    return [m.start() for m in reversed(list(re.finditer(re.escape(abre), c)))]


def cada(c, abre, f):
    """Cambia cada elemento que empieza con `abre` por `f(html)`, de adentro hacia afuera."""
    for i in elementos(c, abre):
        j = cierre(c, i, "div")
        c = c[:i] + f(c[i:j]) + c[j:]
    return c


def rotulo(h):
    i = h.index('<span class="rt">')
    j = cierre(h, i, "span")
    return re.sub(r"<[^>]+>", "", re.sub(SVG, "", h[i:j], flags=re.S)).replace("*", "").strip()


def pieza(valor, aria, error=False, des=False, apagado=None, vacio=ELEGI, abierto=False, extra="", tip_abierto=False):
    """La pieza cerrada (262) de la carga: lo elegido por su nombre o, sin nada, «Elegí una opción» en gris."""
    nada = valor is None
    h = b2.campo(vacio if nada else valor, vacio=nada, abierto=abierto, apagado=apagado, error=error, aria=aria, extra=extra,
                 tip_abierto=tip_abierto)
    if des:
        h = una(h, 'class="b2-pkc"', 'class="b2-pkc des" aria-disabled="true"')
    if apagado and not tip_abierto and apagado != (vacio if nada else valor):
        # El motivo que no es obvio va en el tooltip, cerrado (211): como en los demás tableros, en el `title` del control.
        h = h.replace(' aria-disabled="true">', f' aria-disabled="true" title="{apagado}">', 1)
    return h


def lista_motivo(elegida, tel=False):
    if tel:
        return b2.pk_tel("Motivo", [("Sin respuesta", None, elegida is None, None)]
                         + [(m, None, m == elegida, None, k == 0) for k, m in enumerate(MOTIVOS)])
    return b2.lista([b2.op("Sin respuesta", elegida=elegida is None)]
                    + [b2.op(m, elegida=m == elegida, activa=m == elegida, sep=k == 0) for k, m in enumerate(MOTIVOS)])


def lista_fallas(elegidas, tel=False):
    tope = "Hasta 3"
    if tel:
        return b2.pk_tel("Fallas", [(f, None, f in elegidas, None) for f in FALLAS], multiple=True, tope=tope,
                         listo=f"Listo ({len(elegidas)})")
    return b2.lista([b2.op(f, multiple=True, elegida=f in elegidas) for f in FALLAS], multiple=True, tope=tope)


def lista_proveedor(como):
    if como == "lista":
        return b2.lista([b2.op(n, d) for n, d in PROVEEDORES], buscar="", cantidad=CANTIDAD_PROVEEDOR, pie=MAS)
    if como == "buscando":
        return b2.lista([], buscar="ace", msj="Buscando…")
    return b2.lista([], buscar="ombú", msj="Ninguna opción coincide con «ombú».")


def lista_rubros():
    return b2.lista([b2.op(r, multiple=True, elegida=r in RUBROS_ELEGIDOS) for r in RUBROS], multiple=True, buscar="",
                    cantidad=f"{len(RUBROS)} opciones", tope="Hasta 3")


def enviar_alcanzable(c, motivo=None):
    """«Enviar» apagado (211): `aria-disabled` en lugar de `disabled`, con su motivo, para que se alcance con Tab y diga por qué."""
    c = re.sub(r'(<button type="button" class="cb [^"]*") disabled( title="[^"]*")', r'\1 aria-disabled="true"\2', c)
    if motivo:
        c = c.replace('<button type="button" class="cb cb-pri full" disabled>',
                      f'<button type="button" class="cb cb-pri full" aria-disabled="true" title="{motivo}">')
    return c


# ---------------------------------------------------------------------------------------------------------------- piezas de la página
def html_de(nombre):
    return leer(nombre)[0]


def fragmentos():
    """Lo que se copia de la página y de su teléfono (que ya tienen la ubicación y los cálculos de la v175)."""
    t = html_de("FRM-Cargar-Respuesta")
    s0 = sc_ifs(t, s_de(t, "Nueva respuesta"))[1]
    s3 = sc_ifs(t, s_de(t, "Con dos ítems"))[1]
    vacio, lleno = t[s0[0]:s0[1]], t[s3[0]:s3[1]]

    def fila_de(c, rot):
        i = c.index(f'<span class="rt">{rot}')
        f = c.rindex('<div class="cg-fila"', 0, i)
        return c[f:cierre(c, f, "div")]

    total = fila_de(vacio, "Total")
    assert '<div class="t15e-calc" aria-readonly="true"></div>' in total
    importe_h = re.search(r'<span class="h r">Importe<span class="f-i".*?</span></span>', vacio, re.S).group(0)
    tacho = re.search(r'aria-label="Quitar el ítem 1"[^>]*>(' + SVG + ")", vacio, re.S).group(1)
    plegar = re.search(r'aria-label="Plegar Datos">(' + SVG + ")", vacio, re.S).group(1)
    externo = re.search(r"Ver en el mapa (" + SVG + ")", lleno, re.S).group(1)
    info_total = re.search(r'<span class="rt">Total(<span class="f-i".*?</span>)</span>', vacio, re.S).group(1)
    info_importe = re.search(r'<span class="h r">Importe(<span class="f-i".*?</span>)</span>', vacio, re.S).group(1)
    tt = html_de("M-FRM-Cargar-Respuesta")
    m0 = sc_ifs(tt, s_de(tt, "Nueva respuesta"))[0]
    tel = tt[m0[0]:m0[1]]
    i = tel.index('<div class="cg-tc"><span class="rt">Lugar de entrega</span>')
    lugar_tel = tel[i:cierre(tel, i, "div")]
    i = tel.index('<div class="ap-cmp"><span class="rt"><span>Importe</span>')
    importe_tel = tel[i:cierre(tel, i, "div")]
    i = tel.index('<div class="ap-cmp"><span class="rt"><span>Total</span>')
    total_tel = tel[i:cierre(tel, i, "div")]
    i = tel.index('<div class="t15e-ub"')
    ub_vacio_tel = tel[i:cierre(tel, i, "div")]
    fl_tel = re.search(r'<span class="fl ab">(' + SVG + ")</span>", tel, re.S).group(1)
    return {"lugar": fila_de(vacio, "Lugar de entrega"), "lugar_punto": fila_de(lleno, "Lugar de entrega"), "total": total,
            "importe_h": importe_h, "tacho": tacho, "plegar": plegar, "externo": externo, "info_total": info_total,
            "info_importe": info_importe, "lugar_tel": lugar_tel, "importe_tel": importe_tel, "total_tel": total_tel,
            "ub_vacio_tel": ub_vacio_tel, "fl_tel": fl_tel}


F = {}


def pregunta_compu(h):
    """Una pregunta de la compu (`w-cmp cg-q`): el Sí o No, los radios, las casillas y la lista de catálogo pasan a la pieza."""
    if '<span class="rt">' not in h:
        return h
    rot = rotulo(h)
    err = 'role="alert"' in h
    m = re.search(r'<span class="ab-seg( des)?" role="radiogroup" aria-label="Sí o no"><span class="(on)?">Sí</span>'
                  r'<span class="(on)?">No</span></span>', h)
    if m:
        valor = "Sí" if m.group(2) else "No" if m.group(3) else None
        h = h[:m.start()] + pieza(valor, rot, error=err, des=bool(m.group(1))) + h[m.end():]
    m = re.search(r'<div class="cg-rd( des)?" role="radiogroup">(.*?)</div>', h, re.S)
    if m:
        on = re.search(r'<span class="on"><i></i>([^<]*)</span>', m.group(2))
        h = h[:m.start()] + pieza(on.group(1) if on else None, rot, error=err, des=bool(m.group(1))) + h[m.end():]
    m = re.search(r'<div class="co-ch">(.*?)</div>', h, re.S)
    if m:
        elegidas = re.findall(r'<span class="q-chk"><i>' + SVG + r"</i>([^<]*)</span>", m.group(1), re.S)
        h = h[:m.start()] + pieza(", ".join(elegidas) or None, rot, error=err) + h[m.end():]
        h = una(h, '<div class="w-cmp cg-q s3">', '<div class="w-cmp cg-q s1">')
        h = re.sub(r'<span class="f-i" tabindex="0" role="img" aria-label="Elegí hasta \d+\."[^>]*>' + SVG + "</span>", "", h,
                   flags=re.S)
    m = re.search(r'<div class="ct cg-cat([^"]*)"( aria-disabled="true")?>(.*?)</div>', h, re.S)
    if m:
        h = h[:m.start()] + catalogo(m.group(1).split(), m.group(3), rot, err) + h[m.end():]
    return h


def catalogo(clases, adentro, rot, err=False):
    texto = re.search(r'<span class="v">([^<]*)</span>', adentro).group(1)
    if "vac" in clases and "des" in clases:
        # Apagada: el texto de siempre en su campo; el motivo, en su tooltip si no es obvio (166 y 211).
        motivo = SIN_DATO if texto.startswith("Esta lista") else texto
        return pieza(None, rot, apagado=motivo, vacio=texto)
    if "vac" in clases:
        return pieza(None, rot, error=err or "mal" in clases)
    return pieza(texto, rot, error=err or "mal" in clases, des="des" in clases)


def celdas_bloque(c):
    """Las celdas de catálogo de la tabla del bloque: la pieza, con el nombre «Ítem 2 · Producto» (allá, «Ítem 2 · Artículo»)."""
    for i in elementos(c, '<div class="cg-blq-t"'):
        j = cierre(c, i, "div")
        n = [0]

        def celda(m):
            if m.group(1):
                n[0] = int(m.group(1))
                return m.group(0)
            dentro = m.group(3)
            nombre = re.search(r'aria-label="Quitar ([^"]+)"|Buscar en ([^<]+)<', dentro)
            col = (nombre.group(1) or nombre.group(2)).strip() if nombre else "Producto"
            return catalogo(m.group(2).split(), dentro, f"Ítem {n[0]} · {col}")

        tabla = re.sub(r'<span class="n">(\d+)</span>|<div class="ct cg-cat([^"]*)"[^>]*>(.*?)</div>', celda, c[i:j], flags=re.S)
        c = c[:i] + tabla + c[j:]
    return c


def tacho_compu(c):
    """261 · En el panel, cada ítem con ↑ ↓ y 🗑 en su banda: el tacho rojo en lugar de «Quitar»."""
    return re.sub(r'(<div class="b"><span class="t">Ítem (\d+)</span>(?:(?!</div>).)*?)<button type="button" class="cb cb-sec"'
                  r'([^>]*)>Quitar</button>',
                  lambda m: f'{m.group(1)}<button type="button" class="ib pel" aria-label="Quitar el ítem {m.group(2)}"{m.group(3)}>'
                            f'{F["tacho"]}</button>', c, flags=re.S)


def piezas_compu(c):
    return tacho_compu(cada(celdas_bloque(c), '<div class="w-cmp cg-q', pregunta_compu))


def con_lugar_y_total(c, punto=False, importes=None, total=""):
    """La zona «Entrega» de «Pedido de materiales», versión 4, como en la página: «Lugar de entrega», «Importe» y «Total»."""
    i = c.find("<span>Entrega</span>")
    if i < 0 or "Lugar de entrega" in c or 'class="cg-fila"' not in c[i:]:
        return c
    z = c.rindex('<div class="w-caja cg-z', 0, i)
    ze = cierre(c, z, "div")
    zona = c[z:ze]
    f = zona.index('<div class="cg-fila"')
    fe = cierre(zona, f, "div")
    zona = zona[:fe] + (F["lugar_punto"] if punto else F["lugar"]) + zona[fe:]
    if "cg-blq-t" in zona:
        zona = una(zona, '<span class="h"><span class="sr">Acciones</span></span>',
                   F["importe_h"] + '<span class="h"><span class="sr">Acciones</span></span>')
        k = [0]

        def importe(m):
            v = importes[k[0]] if importes else ""
            k[0] += 1
            return f'<span class="r t15e-calc">{v}</span>' + m.group(0)

        zona = re.sub(r'<span class="ac">', importe, zona)
        b = zona.index('<div class="cg-blq"')
        fila = zona.rindex('<div class="cg-fila"', 0, b)
        fe = cierre(zona, fila, "div")
        zona = zona[:fe] + F["total"].replace('aria-readonly="true"></div>', f'aria-readonly="true">{total}</div>') + zona[fe:]
    return c[:z] + zona + c[ze:]


def reemplazar_pregunta(c, rot, nuevo):
    for i in elementos(c, '<div class="w-cmp cg-q'):
        j = cierre(c, i, "div")
        if rotulo(c[i:j]) == rot:
            return c[:i] + nuevo + c[j:]
    raise AssertionError(f"sin la pregunta {rot}")


def pregunta_abierta(rot, valor, lista, clase="s1", req=True):
    """Una pregunta con la pieza abierta: su rótulo arriba y la lista de los menús debajo del campo."""
    r = ' <span class="req">*</span>' if req else ""
    return (f'<div class="w-cmp cg-q {clase}"><span class="rt">{rot}{r}</span>'
            + pieza(valor, rot, abierto=True, extra=lista) + "</div>")


# ---------------------------------------------------------------------------------------------------------------- la lectura (266)
def lee(rot, valor, clase="s1", extra=""):
    return f'<div class="w-cmp cg-q {clase}"><span class="rt">{rot}</span><div class="ct t3b-lee{extra}">{valor}</div></div>'


def zona_lee(titulo, filas):
    return (f'<div class="w-caja cg-z"><div class="f-cab"><span>{titulo}</span><button type="button" class="ib" aria-expanded="true" '
            f'aria-label="Plegar {titulo}">{F["plegar"]}</button></div>'
            + "".join(f'<div class="cg-fila" data-entry-row>{f}</div>' for f in filas) + "</div>")


ITEMS = [("Caño de 1/2 pulgada", "5", "$ 21.000,00"), ("Codo de 90°", "20", "$ 17.000,00")]


def enviada_compu():
    """«Enviada» con la forma de la E20 (266): las zonas, la grilla, el ancho de cada tipo, y lo enviado sin poder tocarlo."""
    datos = zona_lee("Datos", [lee("Cliente", "Ferretería Sur") + lee("¿Se concretó la venta?", "Sí") + lee("Motivo", "Venta nueva"),
                               lee("Monto", "30.000,00", extra=" ang")])
    lugar = (f'<div class="w-cmp cg-q s1"><span class="rt">Lugar de entrega</span><div class="ct t3b-lee t3b-ub">'
             f'<span class="pt">{PUNTO}</span><span class="pr">± 15 m</span><a href="{MAPA}" target="_blank" '
             f'rel="noopener noreferrer">Ver en el mapa {F["externo"]}</a></div></div>')
    celdas = "".join(f'<span class="n">{k}</span><span>{p}</span><span>{q}</span><span class="r t15e-calc">{v}</span>'
                     for k, (p, q, v) in enumerate(ITEMS, 1))
    bloque = (f'<div class="w-cmp cg-q s3"><span class="rt">Productos</span><div class="cg-blq"><div class="cg-blq-t t3b-lee" '
              f'role="table" aria-label="Productos"><span class="h n"></span><span class="h">Producto</span><span class="h">Cantidad</span>'
              f'<span class="h r">Importe{F["info_importe"]}</span>{celdas}</div></div></div>')
    total = (f'<div class="w-cmp cg-q s1"><span class="rt">Total{F["info_total"]}</span>'
             f'<div class="t15e-calc" aria-readonly="true">$ 68.000,00</div></div>')
    entrega = zona_lee("Entrega", [lee("Zona", "Centro") + lee("Fecha de entrega", "22/10/2026", extra=" ang")
                                   + lee("Proveedor", "Aceros Rosario"), lugar, bloque, total,
                                   lee("Observaciones", "Retira el cliente.", "s3", " cg-area")])
    fotos = "".join(f'<div class="cg-fot"><span class="im" role="img" aria-label="{n}"></span><span class="nm">{n}</span></div>'
                    for n in ("IMG_2231.jpg", "IMG_2232.jpg"))
    archivos = zona_lee("Fotos y documentos", [f'<div class="w-cmp cg-q s3"><span class="rt">Foto del remito</span>'
                                               f'<div class="cg-fotos">{fotos}</div></div>'])
    return datos + entrega + archivos


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def pregunta_tel(h):
    """Una pregunta del teléfono: el Sí o No, los radios y la lista de catálogo pasan a la pieza."""
    if '<span class="rt">' not in h:
        return h
    rot = rotulo(h)
    if h.startswith('<div class="cg-tc">'):
        err = 'class="cg-terr"' in h
        m = re.search(r'<div class="cg-tseg"><span class="(on)?">Sí</span><span class="(on)?">No</span></div>', h)
        if m:
            valor = "Sí" if m.group(1) else "No" if m.group(2) else None
            h = h[:m.start()] + pieza(valor, rot, error=err) + h[m.end():]
        m = re.search(r'<div class="cg-trd">(.*?)</div>', h, re.S)
        if m:
            on = re.search(r'<span class="on"><i></i>([^<]*)</span>', m.group(1))
            h = h[:m.start()] + pieza(on.group(1) if on else None, rot, error=err) + h[m.end():]
        return h
    if rot not in CATALOGO:
        return h
    m = re.search(r'<div class="ct([^"]*)">([^<]*)</div>', h)
    if not m:
        return h
    clases, texto = m.group(1).split(), m.group(2).strip()
    if texto.startswith("Elegí primero"):
        nuevo = pieza(None, rot, apagado=texto, vacio=texto)
    elif not texto or texto.startswith("Buscar en"):
        nuevo = pieza(None, rot, error="mal" in clases)
    else:
        nuevo = pieza(texto, rot, error="mal" in clases)
    return h[:m.start()] + nuevo + h[m.end():]


def tacho_tel(c):
    """261 · En el teléfono, cada ítem con ↑ ↓ y 🗑 en su banda: el tacho rojo en lugar de «Quitar»."""
    return re.sub(r'(<div class="b"><span class="t">Ítem (\d+)</span>(?:(?!</div>).)*?)<button type="button" class="cb"([^>]*)>'
                  r'Quitar</button>',
                  lambda m: f'{m.group(1)}<button type="button" class="ap-ib pel" aria-label="Quitar el ítem {m.group(2)}"{m.group(3)}>'
                            f'{F["tacho"]}</button>', c, flags=re.S)


def piezas_tel(c):
    c = cada(c, '<div class="ap-cmp">', pregunta_tel)
    return tacho_tel(cada(c, '<div class="cg-tc">', pregunta_tel))


def con_lugar_y_total_tel(c):
    """La zona «Entrega» del teléfono, como en la página: «Lugar de entrega», «Importe» en cada ítem y «Total»."""
    if "Lugar de entrega" in c or ">Entrega<" not in c:
        return c
    i = c.index('<div class="ap-cmp"><span class="rt"><span>Proveedor')
    j = cierre(c, i, "div")
    c = c[:j] + F["lugar_tel"] + c[j:]
    for i in elementos(c, '<div class="cg-tit">'):
        k = c.index('<div class="c">', i)
        fin = cierre(c, k, "div") - len("</div>")
        c = c[:fin] + F["importe_tel"] + c[fin:]
    i = c.index('<div class="cg-tc"><span class="rt">Productos</span>')
    j = cierre(c, i, "div")
    return c[:j] + F["total_tel"] + c[j:]


def lee_tel(rot, valor, extra=""):
    return f'<div class="ap-cmp"><span class="rt"><span>{rot}</span></span><div class="ct t3b-lee{extra}">{valor}</div></div>'


def zona_tel(titulo, cuerpo):
    return (f'<div class="cg-tz"><button type="button" class="h" aria-expanded="true">{titulo}<span class="fl ab">{F["fl_tel"]}'
            f'</span></button><div class="cg-tb">{cuerpo}</div></div>')


def enviada_tel():
    datos = zona_tel("Datos", lee_tel("Cliente", "Ferretería Sur") + lee_tel("¿Se concretó la venta?", "Sí")
                     + lee_tel("Motivo", "Venta nueva") + lee_tel("Monto", "30.000,00"))
    lugar = (f'<div class="ap-cmp"><span class="rt"><span>Lugar de entrega</span></span><div class="ct t3b-lee t3b-ub">'
             f'<span class="pt">{PUNTO}</span><span class="pr">± 15 m</span></div><a class="t3b-mapa" href="{MAPA}" '
             f'target="_blank" rel="noopener noreferrer">Ver en el mapa {F["externo"]}</a></div>')
    importe = F["importe_tel"]
    items = "".join(f'<div class="cg-tit"><div class="b"><span class="t">Ítem {k}</span></div><div class="c">'
                    + lee_tel("Producto", p) + lee_tel("Cantidad", q)
                    + importe.replace('aria-readonly="true"></div>', f'aria-readonly="true">{v}</div>') + "</div></div>"
                    for k, (p, q, v) in enumerate(ITEMS, 1))
    bloque = f'<div class="cg-tc"><span class="rt">Productos</span>{items}</div>'
    total = F["total_tel"].replace('aria-readonly="true"></div>', 'aria-readonly="true">$ 68.000,00</div>')
    entrega = zona_tel("Entrega", lee_tel("Zona", "Centro") + lee_tel("Fecha de entrega", "22/10/2026")
                       + lee_tel("Proveedor", "Aceros Rosario") + lugar + bloque + total
                       + lee_tel("Observaciones", "Retira el cliente."))
    fotos = "".join(f'<span class="im" role="img" aria-label="{n}"></span>' for n in ("IMG_2231.jpg", "IMG_2232.jpg"))
    archivos = zona_tel("Fotos y documentos", f'<div class="cg-tc"><span class="rt">Foto del remito</span>'
                                              f'<div class="cg-tfot">{fotos}</div></div>')
    return datos + entrega + archivos


def capa(c, html):
    """Lo que se abre sobre la pantalla del teléfono (la pieza a pantalla completa), al final del estado."""
    assert c.endswith("</sc-if>")
    return c[:-len("</sc-if>")] + html + "</sc-if>"


# ---------------------------------------------------------------------------------------------------------------- los estados nuevos
def clonar(t, fuente, nuevo, ancla, cambiar):
    """Un estado nuevo, copia de `fuente` (cada `sc-if` suyo, renombrado, va después del original); `cambiar(i, bloque)` lo ajusta."""
    s = s_de(t, fuente)
    t, sv = sumar_estados(t, [(ancla, nuevo)])
    bloques = sc_ifs(t, s)
    copias = [cambiar(k, renombrar(t[a:b], s, sv[nuevo])) for k, (a, b) in enumerate(bloques)]
    for (a, b), c in reversed(list(zip(bloques, copias))):
        t = t[:b] + c + t[b:]
    return t


# ---------------------------------------------------------------------------------------------------------------- cada tablero
def respuesta():
    t, nl = leer("FRM-Cargar-Respuesta")
    if MARCA in t:
        return print("FRM-Cargar-Respuesta ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_COMPU)
    cab, c, guion = cuerpo_de(t)
    t = cab + piezas_compu(c) + guion

    def motivo(k, c):
        if k == 0:
            return c
        return una(c, pieza("Venta nueva", "Motivo"), pieza("Venta nueva", "Motivo", abierto=True, extra=lista_motivo("Venta nueva")))
    t = clonar(t, "Aparece una pregunta", "Elegir el motivo", "Aparece una pregunta", motivo)
    escribir("FRM-Cargar-Respuesta", t, nl)


def panel():
    t, nl = leer("FRM-Cargar-Panel")
    if MARCA in t:
        return print("FRM-Cargar-Panel ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_COMPU)
    cab, c, guion = cuerpo_de(t)
    c = piezas_compu(c)
    assert ">Quitar</button>" not in c and "ab-seg" not in c and "cg-rd" not in c and "cg-cat" not in c
    escribir("FRM-Cargar-Panel", cab + c + guion, nl)


def enviada():
    t, nl = leer("FRM-Cargar-Enviada")
    if MARCA in t:
        return print("FRM-Cargar-Enviada ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_COMPU + ("" if 'data-t15e="carga"' in t else CSS_CARGA))
    cab, c, guion = cuerpo_de(t)
    t = cab + enviar_alcanzable(piezas_compu(c)).replace("5 de 5 respondidas", "6 de 6 respondidas") + guion

    def lectura(estado, c):
        if estado == "Enviada" and 'class="g-det"' in c:
            i = c.index('<div class="g-det">')
            c = c[:i] + c[cierre(c, i, "div"):]
            j = cierre(c, c.index('<div class="w-caja cg-z">'), "div")
            return c[:j] + enviada_compu() + c[j:]
        if estado == "Una opción dada de baja":
            return con_lugar_y_total(c, punto=True, importes=[v for _, _, v in ITEMS], total="$ 68.000,00")
        return c
    t = por_bloque(t, lectura)
    escribir("FRM-Cargar-Enviada", t, nl)


def listas():
    t, nl = leer("FRM-Cargar-Lista")
    if MARCA in t:
        return print("FRM-Cargar-Lista ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_COMPU + ("" if 'data-t15e="carga"' in t else CSS_CARGA))
    abiertas = {"La lista": "lista", "Buscando": "buscando", "Sin coincidencias": "sin"}

    def estado(nombre, c):
        if "w-body" not in c:
            return c
        if nombre in abiertas:
            c = reemplazar_pregunta(c, "Proveedor", pregunta_abierta("Proveedor", None, lista_proveedor(abiertas[nombre])))
        elif nombre == "Elegir varias":
            c = reemplazar_pregunta(c, "Rubros", pregunta_abierta("Rubros", ", ".join(RUBROS_ELEGIDOS), lista_rubros(), req=False))
        return con_lugar_y_total(piezas_compu(c))
    t = por_bloque(t, estado)
    assert "cg-lista" not in sin_estilos(t) and "cg-chips" not in sin_estilos(t)
    escribir("FRM-Cargar-Lista", t, nl)


def archivos():
    for nombre in ("FRM-Cargar-Archivos", "M-FRM-Cargar-Archivos"):
        t, nl = leer(nombre)
        if MARCA in t:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        assert "5 de 5 respondidas" in t
        # Solo el conteo de «Entrega», que ahora tiene «Lugar de entrega» (230): lo demás ya sigue a la carga redibujada.
        t = con_css(t, "/* E20 · tanda 3B: «Entrega» cuenta seis preguntas, con «Lugar de entrega» (166 y 230). */")
        escribir(nombre, t.replace("5 de 5 respondidas", "6 de 6 respondidas"), nl)


def respuesta_21():
    t, nl = leer("FRM-Cargar-Respuesta-21")
    if MARCA in t:
        return print("FRM-Cargar-Respuesta-21 ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_COMPU)
    cab, c, guion = cuerpo_de(t)
    c = piezas_compu(c)
    # «Fallas», ya en una columna, entra en el renglón de «¿Se concretó la venta?» y «Motivo» (la grilla de hasta tres, 87 y 266).
    for i in elementos(c, '<div class="w-cmp cg-q s1"><span class="rt">Fallas'):
        j = cierre(c, i, "div")
        fallas = c[i:j]
        fila = c.rindex('<div class="cg-fila"', 0, i)
        fin = cierre(c, fila, "div")
        assert c[fila:fin].count('<div class="w-cmp') == 1
        c = c[:fila] + c[fin:]
        antes = c.rindex('<div class="cg-fila"', 0, fila)
        fin_antes = cierre(c, antes, "div")
        c = c[:fin_antes - len("</div>")] + fallas + c[fin_antes - len("</div>"):]
    t = cab + c + guion

    def fallas(k, c):
        if k == 0:
            return c
        return una(c, pieza(None, "Fallas"), pieza("Frío, Ruido", "Fallas", abierto=True, extra=lista_fallas(("Frío", "Ruido"))))
    t = clonar(t, "Nueva respuesta", "Elegir las fallas", "Nueva respuesta", fallas)
    escribir("FRM-Cargar-Respuesta-21", t, nl)


def respuesta_tel():
    t, nl = leer("M-FRM-Cargar-Respuesta")
    if MARCA in t:
        return print("M-FRM-Cargar-Respuesta ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_TEL)
    cab, c, guion = cuerpo_de(t)
    c = piezas_tel(c)
    assert "cg-tseg" not in c and "cg-trd" not in c and ">Quitar</button>" not in c
    t = cab + c + guion
    t = clonar(t, "Aparece una pregunta", "Elegir el motivo", "Aparece una pregunta",
               lambda k, c: capa(c, lista_motivo("Venta nueva", tel=True)) if k == 0 else c)

    def tacho(k, c):
        # Un solo ítem: el tacho queda apagado, con su motivo abierto en el tooltip (211). «Lugar de entrega» sin pedir, así la banda
        # del ítem entra en la pantalla.
        if k != 0:
            return c
        i = c.index('<div class="cg-tit">', c.index('<div class="cg-tit">') + 1)
        c = c[:i] + c[cierre(c, i, "div"):]
        c = una(c, 'aria-label="Bajar el ítem 1" aria-disabled="false"', 'aria-label="Bajar el ítem 1" aria-disabled="true"')
        boton = f'<button type="button" class="ap-ib pel" aria-label="Quitar el ítem 1">{F["tacho"]}</button>'
        c = una(c, boton, f'<span class="t3b-tipw"><button type="button" class="ap-ib pel" aria-label="Quitar el ítem 1" '
                          f'aria-disabled="true" title="{TACHO_MIN}">{F["tacho"]}</button>{b2.tip(TACHO_MIN)}</span>')
        c = una(c, "$ 68.000,00", "$ 51.000,00")
        i = c.index('<div class="t15e-ub"')
        return c[:i] + F["ub_vacio_tel"] + c[cierre(c, i, "div"):]
    t = clonar(t, "Con dos ítems", "El tacho apagado", "Con dos ítems", tacho)
    escribir("M-FRM-Cargar-Respuesta", t, nl)


def enviada_tel_tablero():
    t, nl = leer("M-FRM-Cargar-Enviada")
    if MARCA in t:
        return print("M-FRM-Cargar-Enviada ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_TEL)
    cab, c, guion = cuerpo_de(t)
    t = cab + piezas_tel(c).replace("5 de 5 respondidas", "6 de 6 respondidas") + guion

    def estado(nombre, c):
        if nombre == "Enviada":
            i = c.index('<div class="tr-gr">')
            c = c[:i] + c[cierre(c, i, "div"):]
            j = cierre(c, c.index('<div class="tr-sec">'), "div")
            return c[:j] + enviada_tel() + c[j:]
        return enviar_alcanzable(c, MOTIVO_ENVIAR.get(nombre))
    t = por_bloque(t, estado)
    assert "cg-tseg" not in sin_estilos(t) and 'class="tr-gr"' not in sin_estilos(t)
    escribir("M-FRM-Cargar-Enviada", t, nl)


def listas_tel():
    t, nl = leer("M-FRM-Cargar-Lista")
    if MARCA in t:
        return print("M-FRM-Cargar-Lista ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_TEL + ("" if 'data-t15e="carga"' in t else CSS_CARGA_TEL))
    capas = {
        "La lista": b2.pk_tel("Proveedor", [(n, d, False, None) for n, d in PROVEEDORES], buscar="", cantidad=CANTIDAD_PROVEEDOR,
                              pie_extra=MAS),
        "Sin coincidencias": b2.pk_tel("Proveedor", [], buscar="ombú", msj="Ninguna opción coincide con «ombú»."),
        "Elegir varias": b2.pk_tel("Rubros", [(r, None, r in RUBROS_ELEGIDOS, None) for r in RUBROS], multiple=True, buscar="",
                                   cantidad=f"{len(RUBROS)} opciones", tope="Hasta 3", listo=f"Listo ({len(RUBROS_ELEGIDOS)})"),
    }

    def estado(nombre, c):
        if nombre in capas:
            # La pieza a pantalla completa (262), con su nombre, la ✕, el buscador y renglones de 56 px; tapa la carga.
            return re.match(r"<sc-if[^>]*>", c).group(0) + capas[nombre] + "</sc-if>"
        return con_lugar_y_total_tel(piezas_tel(c))
    t = por_bloque(t, estado)
    assert "cg-tbus" not in sin_estilos(t)
    escribir("M-FRM-Cargar-Lista", t, nl)


def respuesta_21_tel():
    t, nl = leer("M-FRM-Cargar-Respuesta-21")
    if MARCA in t:
        return print("M-FRM-Cargar-Respuesta-21 ya tiene el bloque: no hace nada")
    t = con_css(t, CSS_TEL)
    # Una zona plegada dice cuántas se respondieron (166): «El resultado» tiene cuatro preguntas y «Fotos y documentos», dos.
    for zona, n in (("El resultado", 4), ("Fotos y documentos", 2)):
        t = t.replace(f'aria-expanded="false">{zona}<span class="fl">',
                      f'aria-expanded="false">{zona}<span class="res">0 de {n} respondidas</span><span class="fl">')
    t = clonar(t, "Nueva respuesta", "Elegir las fallas", "Nueva respuesta",
               lambda k, c: capa(c, lista_fallas(("Frío", "Ruido"), tel=True)) if k == 0 else c)
    escribir("M-FRM-Cargar-Respuesta-21", t, nl)


# ---------------------------------------------------------------------------------------------------------------- el panel (275)
def partir_panel(panel):
    """`partir` de la E14; si «Formularios» lleva su número («Formularios 4», en la E21), la línea va igual antes de «Catálogos»."""
    if "Formularios</a>" in panel or e14p.SEP in panel:
        return e14p.partir(panel)
    i = panel.find('href="FRM-Formularios')
    m = e14p.CATALOGOS.search(panel)
    assert i >= 0 and m and m.start() > i, "el panel no tiene «Formularios» antes de «Catálogos»"
    return panel[:m.start()] + e14p.SEP + panel[m.start():]


def panel_en_dos():
    for nombre in COMPU:
        ruta = PROJ / f"{nombre}.dc.html"
        t = io.open(ruta, encoding="utf-8", newline="").read()
        nl = "\r\n" if "\r\n" in t else "\n"
        nuevo, n = e14p.PANEL.subn(lambda m: partir_panel(m.group(0)), t)
        assert n, f"{nombre} no tiene el panel"
        if e14p.BLOQUE not in nuevo:
            nuevo = nuevo.replace("</helmet>", e14p.CSS.replace("\n", nl) + "</helmet>", 1)
        if nuevo != t:
            io.open(ruta, "w", encoding="utf-8", newline="").write(nuevo)
        print("panel en dos grupos:", nombre, "(sin cambios)" if nuevo == t else "")


def main():
    F.update(fragmentos())
    respuesta()
    panel()
    enviada()
    listas()
    archivos()
    respuesta_21()
    respuesta_tel()
    enviada_tel_tablero()
    listas_tel()
    respuesta_21_tel()
    subprocess.run([sys.executable, str(GEN / "traspaso10_piezas_1004.py"), "--tableros", ",".join(COMPU + TELEFONO)], check=True)
    panel_en_dos()


if __name__ == "__main__":
    main()
