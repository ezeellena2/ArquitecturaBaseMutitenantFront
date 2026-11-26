"""El editor de un catálogo con campos de la E13 con el traspaso 18, tanda 2 (2026-11-26), en `FRM-Catalogo-13` y
`M-FRM-Catalogo-13`: los mismos cambios que `e12_editor_1004.py` hizo en `FRM-Catalogo` y su teléfono, más lo propio de la E13.

- **lo que se hace con una fila va en su ⋮ (261):** «Reactivar» de una opción dada de baja y «Restaurar» de una por borrar dejan de
  ser botones con texto. La fila dada de baja vuelve a tener ↑ ↓ ✎ 🗑 a la vista y su ⋮ con «Reactivar»; la por borrar conserva
  «Se borra al guardar» y su ⋮ con «Restaurar». Las filas sin nada en el ⋮ guardan su lugar. Un estado nuevo abre el ⋮: «Reactivar
  una opción» (en el teléfono, su hoja);
- **«Columnas» en la pieza múltiple (262):** en la compu, un botón de la barra que abre la lista con una casilla por campo, sin
  cantidades; en el teléfono, un botón a todo el ancho arriba de la lista que abre la pieza a pantalla completa con «Listo (2)»
  (estado nuevo «Columnas»);
- **todo lo que se elige, en la pieza (262):** «Agregar campo» de «En WhatsApp» (cerrado dice «Agregar campo» en gris; abierto, la
  lista con lo que falta; en el teléfono, a pantalla completa); el valor de un campo «De un catálogo» en su celda («Zona»), con la
  opción dada de baja que quedó guardada primero, elegida y con «De baja» en gris, y las activas después, separadas (como
  `FRM-Catalogo-Opciones-13`); y, en «Nuevo catálogo», «De dónde
  salen las opciones» y «Tipo de valor» antes del nombre, con «Escritas a mano» y «Texto», como en `FRM-Catalogo`. Después, un paso
  aparte (`presentacion_todos`) lleva el título y la descripción de «En WhatsApp» a la pieza múltiple, sin chips ni «Agregar campo»
  (262 y `Criterio-Elegir` mandan sobre la spec), también en `FRM-Catalogo-14` y su teléfono. La vista previa que imita WhatsApp
  («Por ejemplo», «Así lo ve quien lo recibe» y su «Una opción | Varias») no cambia;
- **en el teléfono, cada opción es una tarjeta (263):** el número, el texto y sus acciones; debajo, cada dato con su nombre
  («Código», los campos «CUIT» y «Zona», y «Detalle») y, si no está activa, «Estado» con su punto. La que no entra en el título de
  WhatsApp lleva el aviso debajo de sus datos, en rojo, como el error de un campo.

Las opciones de un catálogo a mano tienen orden manual (224): la tabla no ordena por encabezado, como `FRM-Catalogo`.

El `data-props` de `FRM-Catalogo-13` (el publicado lo escribe con `&quot;`) pasa a comillas simples, como los demás, así lo
encuentran este script y `traspaso10_piezas_1004.py`. Corre una vez: si el bloque `data-e13="t2"` ya está, no hace nada. Después va
`traspaso10_piezas_1004.py --tableros FRM-Catalogo-13,M-FRM-Catalogo-13`, que escala el bloque nuevo de la compu.
"""
import html
import io
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e12_editor_1004 as e12  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-e13="t2"'
PARA_APROBAR = " · para aprobar"
SVG = r"<svg\b[^>]*>(?:(?!</svg>).)*</svg>"  # un solo ícono: nunca cruza su `</svg>`
SOLO_LEER = "Solo podés ver este catálogo."

# Las opciones de los tableros: código, CUIT, zona y detalle (la tabla de la compu).
OPCIONES = {
    "Abrasivos del Sur": ("PRV-0001", "30-71234567-1", "Capital", "Abrasivos"),
    "Aceros Rosario": ("PRV-0002", "30-70988123-4", "Gran Buenos Aires", "Aceros"),
    "Aislantes Norte": ("PRV-0003", "33-71011223-9", "Interior", "Aislantes"),
    "Alambres Patagónicos": ("PRV-0004", "30-69877654-2", "Patagonia", "Alambres"),
    "Aluminios Cuyo": ("PRV-0005", "30-71455890-7", "Litoral", "Aluminio"),
    "Andamios Litoral": ("PRV-0006", "30-70233456-1", "Capital", "Andamios"),
}
# Con el título armado con «Detalle» (el estado «Un título que no entra»), el detalle largo de la segunda.
DETALLE_LARGO = "Aceros y perfiles laminados para estructuras"
CAMPOS = ["CUIT", "Zona"]

CSS_COMPU = b2.CSS_B2 + """
/* E13 · El ⋮ de una fila de opciones (261), como en `FRM-Catalogo`: las filas sin nada en el ⋮ guardan su lugar. */
.k-acc .k-keb0 { visibility: hidden; }
.k-acc .f-menu { right: 0; top: calc(100% - 6px); }
/* E13 · La pieza en «El catálogo» de uno nuevo (262), como en `FRM-Catalogo`. */
.k-g1 .w-cmp .b2-env { width: 100%; }
/* E13 · «Columnas», un botón de la barra que abre la pieza múltiple, sin cantidades (262). */
.k-fb .f-env { position: relative; display: inline-flex; }
button.w-pil { font: inherit; }
.w-pil[aria-expanded="true"] { border-color: var(--marca); }
.k-fb .b2-pkl.barra { min-width: 200px; }
/* La casilla de la pieza múltiple, sin el relleno de los botones (`.cb`). */
.b2-op .cb { padding: 0; gap: 0; }
/* E13 · «Agregar campo» de «En WhatsApp», en la pieza (262). */
.k-wa2 .sel2 .b2-env { width: 100%; }
/* E13 · El valor de un campo «De un catálogo» en su celda, en la pieza (262), del alto de las demás celdas. */
.k-tab .b2-pkc { height: 32px; padding: 0 8px 0 10px; font-size: 13px; }
.w-tr.baja .k-tab .b2-pkc { color: var(--t3); }
.w-tr.borrar .k-tab .b2-pkc { color: var(--t3); background: var(--s2); }
.k-tab .b2-pkl { width: 260px; }
.k-desp:has(.b2-pkl) { padding-bottom: 340px; margin-bottom: -340px; scrollbar-width: none; }
.k-desp .w-tr:has(.b2-pkl) { z-index: 8; }
.k-desp .w-tr > .k-tab:has(.b2-pkl) { overflow: visible; }
"""

CSS_TEL = b2.css(tel=True) + """
/* E13 · El ⋮ de una fila de opciones en el teléfono (261), como en `M-FRM-Catalogo`. */
.q-acc .q-keb0 { visibility: hidden; }
/* E13 · Cada opción, una tarjeta (263 y 206), como en `M-FRM-Catalogo`: el número, el texto y sus acciones a la vista; debajo,
   «Código», los campos, «Detalle» y, si no está activa, «Estado», cada dato con su nombre. */
.q-tj { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; column-gap: 12px; align-items: center; padding: 8px 6px 10px 14px; }
.ap-grupo > .q-tj:last-child { border-bottom: 0; }
.q-tj .num { grid-row: 1; grid-column: 1; width: 26px; height: 26px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.q-tj .nm { grid-row: 1; grid-column: 2; font-size: 16px; font-weight: 500; }
.q-tj .q-acc { grid-row: 1; grid-column: 3; }
.q-tj .dl { grid-row: 2; grid-column: 2 / -1; margin: 2px 0 0; padding-right: 8px; }
.q-tj .v.mono { font-family: ui-monospace, Consolas, monospace; }
.q-tj.baja .nm, .q-tj.borrar .nm { color: var(--t3); }
/* E13 · La opción que no entra en el título de WhatsApp: el aviso debajo de sus datos, en rojo, como el error de un campo (263). */
.q-tj.mal { background: oklch(0.985 0.012 25); }
.q-tj .er { grid-row: 3; grid-column: 2 / -1; margin-top: 6px; color: var(--peligro); font-size: 13.5px; line-height: 1.35; }
/* E13 · «Columnas» arriba de la lista, a todo el ancho, que abre la pieza múltiple a pantalla completa (262). */
.k-coltel { padding: 0 16px 10px; }
.k-coltel button { display: flex; width: 100%; height: 44px; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; padding: 0 14px; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; color: var(--t1); font: inherit; font-size: 14px; text-align: left; }
.k-coltel button > svg { flex: none; color: var(--t2); }
/* E13 · «Agregar campo» de «En WhatsApp», en la pieza (262). */
.k-wa-t .b2-env { width: 100%; }
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
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def para_aprobar(t):
    m = re.search(r"<title>(.*?)</title>", t)
    assert m and not m.group(1).endswith(PARA_APROBAR), m
    return t[:m.start(1)] + m.group(1) + PARA_APROBAR + t[m.end(1):]


def props_comillas(t):
    """El `data-props` escrito con `&quot;` (como lo deja el publicado) pasa a comillas simples, como en los demás tableros."""
    m = re.search(r'(<script type="text/x-dc" data-dc-script) data-props="([^"]*)">', t)
    if not m:
        return t
    texto = json.dumps(json.loads(html.unescape(m.group(2))), ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    return t[:m.start()] + f"{m.group(1)} data-props='{texto}'>" + t[m.end():]


def subn(patron, cambio, t, cuantos, flags=re.S):
    t, n = re.subn(patron, cambio, t, flags=flags)
    assert n == cuantos, (patron[:70], n, cuantos)
    return t


def pieza_agregar(abierta=None, apagada=False, aria=""):
    """«Agregar campo» de «En WhatsApp»: cerrada dice «Agregar campo» en gris; abierta, la lista con lo que falta (262)."""
    extra = b2.lista([b2.op(n) for n in abierta]) if abierta else ""
    return b2.campo("Agregar campo", vacio=True, abierto=bool(abierta), aria=aria, extra=extra,
                    apagado=SOLO_LEER if apagada else None, tip_abierto=False)


# ---------------------------------------------------------------------------------------------------------------- la compu
def columnas_compu(flecha, abierta=False):
    lst = (b2.lista([b2.op(n, elegida=True, multiple=True) for n in CAMPOS], multiple=True, barra=True) if abierta else "")
    return (f'<span class="f-env"><button type="button" class="w-pil" aria-haspopup="listbox" '
            f'aria-expanded="{"true" if abierta else "false"}">Columnas {flecha}</button>{lst}</span>')


def compu():
    nombre = "FRM-Catalogo-13"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return
    frm, _ = leer("FRM-Catalogo")
    t = props_comillas(para_aprobar(t))
    t = con_css(t, CSS_COMPU)

    # «Columnas»: un botón de la barra con la pieza múltiple; abierta en su estado (262).
    flecha = re.search(r'<span class="w-pil">Columnas (' + SVG + ')', t, re.S).group(1)
    t = subn(r'<span class="w-pil">Columnas ' + SVG + r'\s*<div class="f-menu" role="menu" aria-label="Columnas">.*?</div></span>',
             lambda m: columnas_compu(flecha, abierta=True), t, 1)
    t = subn(r'<span class="w-pil">Columnas ' + SVG + r'</span>', lambda m: columnas_compu(flecha), t, 10)

    # «Agregar campo» de «En WhatsApp», en la pieza: cerrada, abierta con lo que falta y apagada para quien solo lee (262).
    def abierta(m):
        nombres = re.findall(r'<span role="option">([^<]+)</span>', m.group(2))
        assert nombres == ["Texto", "Código", "Detalle"], nombres
        return pieza_agregar(abierta=nombres, aria=m.group(1))
    t = subn(r'<span class="k-in sel foco" role="combobox" aria-label="(Agregar campo a [^"]+)" aria-expanded="true"><span>Agregar campo</span>'
             + SVG + r'</span><span class="f-mn" role="listbox" aria-label="Qué muestra">((?:<span role="option">[^<]*</span>)+)</span>',
             abierta, t, 1)
    t = subn(r'<span class="k-in sel" role="combobox" aria-label="(Agregar campo a [^"]+)" aria-expanded="false"><span>Agregar campo</span>'
             + SVG + r'</span>', lambda m: pieza_agregar(aria=m.group(1)), t, 21)
    lado = iter(["Título", "Descripción"])
    t = subn(r'<span class="k-in sel ro" aria-disabled="true"><span>Agregar campo</span>' + SVG + r'</span>',
             lambda m: pieza_agregar(apagada=True, aria=f"Agregar campo a {next(lado)}"), t, 2)

    # El valor de «Zona» (un campo «De un catálogo») en su celda, en la pieza. Abierta, la opción dada de baja que quedó guardada va
    # primero, con su tilde y «De baja» en gris, como las elegidas de otra página en `Criterio-Elegir`; después, separadas, las
    # activas: un valor nuevo exige una activa (262). Igual que la pieza del campo en `FRM-Catalogo-Opciones-13`.
    i = t.index('<span class="k-in sel foco" role="combobox" aria-expanded="true"><span>Cuyo</span>')
    j = t.index('<span class="f-mn" role="listbox" aria-label="Zona">', i)
    k = e12.cierre(t, j, "span")
    activas = re.findall(r'<span role="option">([^<]+)</span>', t[j:k])
    assert activas == ["Capital", "Gran Buenos Aires", "Interior", "Litoral", "Patagonia"] and "Cuyo<span class=\"baja2\">De baja" in t[j:k]
    ops = [b2.op("Cuyo", "De baja", elegida=True, activa=True)] + [b2.op(n, sep=x == 0) for x, n in enumerate(activas)]
    t = t[:i] + b2.campo("Cuyo", abierto=True, aria="Zona", extra=b2.lista(ops)) + t[k:]
    t = subn(r'<span class="k-in sel"><span>([^<]+)</span>' + SVG + r'</span>', lambda m: b2.campo(m.group(1), aria="Zona"), t, 99)
    assert "k-in sel" not in t and 'class="f-mn"' not in t

    # Las filas: el ⋮ (261), con los íconos de `FRM-Catalogo`.
    t, keb = e12.filas_compu(t, de=frm)

    # «Nuevo catálogo»: el origen y el tipo en la pieza, antes del nombre (262), como en `FRM-Catalogo`.
    (ba, bb), (ca, cb) = e12.sc_ifs(t, "s7")
    cuerpo = t[ca:cb]
    de = '<p class="k-de">Escritas a mano · Texto</p>'
    assert cuerpo.count(de) == 1
    t = t[:ca] + cuerpo.replace(de, e12.campos_nuevo()) + t[cb:]

    # «Reactivar una opción»: el ⋮ de la dada de baja, abierto, con su ícono (261).
    t, sv = e12.sumar_estados(t, [("Una opción en uso", ["Reactivar una opción"])], ["Reactivar una opción"])
    s_nuevo = sv["Reactivar una opción"]
    (b0a, b0b), (c0a, c0b) = e12.sc_ifs(t, "s0")
    banda = e12.renombrar(t[b0a:b0b], "s0", s_nuevo)
    reactivar = re.search(r'<span class="f-mi" role="menuitem">(<svg class="mi-ic"[^>]*>(?:(?!</svg>).)*</svg>) Reactivar</span>',
                          frm, re.S).group(1)
    cuerpo = e12.abrir_menu(e12.renombrar(t[c0a:c0b], "s0", s_nuevo), "Aluminios Cuyo", keb, "Reactivar", reactivar)
    ultimos = e12.sc_ifs(t, "s11")
    assert len(ultimos) == 2
    fin_bandas, fin_cuerpos = ultimos[0][1], ultimos[1][1]
    t = t[:fin_bandas] + banda + t[fin_bandas:fin_cuerpos] + cuerpo + t[fin_cuerpos:]
    assert "Motivos de visita" not in t and t.count(f'<sc-if value="{{{{{s_nuevo}}}}}"') == 2
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def filas_tel(t):
    """El ⋮ de cada fila (261): «Reactivar» sale de la fila, vuelve el lápiz y el ⋮ lo ofrece; las demás guardan su lugar."""
    lapiz = re.search(r'class="ap-ib" aria-label="Editar Abrasivos del Sur">(' + SVG + ')', t, re.S).group(1)
    keb = re.search(r'class="ap-ib" aria-label="Más acciones">(' + SVG + ')', t, re.S).group(1)
    cuenta = {"baja": 0, "resto": 0}
    out, pos = [], 0
    for m in re.finditer(r'<span class="q-acc">', t):
        fin = e12.cierre(t, m.start(), "span")
        adentro = t[m.end():fin - 7]
        r = re.search(r'<button type="button" class="cb cb-sec" aria-label="Reactivar ([^"]+)">Reactivar</button>', adentro)
        assert "Restaurar" not in adentro
        if r:
            n = r.group(1)
            adentro = adentro.replace(r.group(0), f'<button type="button" class="ap-ib" aria-label="Editar {n}">{lapiz}</button>')
            adentro += f'<button type="button" class="ap-ib" aria-label="Acciones de {n}" aria-haspopup="menu" aria-expanded="false">{keb}</button>'
            cuenta["baja"] += 1
        else:
            adentro += '<span class="ap-ib q-keb0" aria-hidden="true"></span>'
            cuenta["resto"] += 1
        out.append(t[pos:m.end()] + adentro + "</span>")
        pos = fin
    out.append(t[pos:])
    print("filas del teléfono:", cuenta)
    return "".join(out)


def dato(k, v, mono=False, todo=False):
    return (f'<span class="c{" todo" if todo else ""}"><span class="k">{k}</span>'
            f'<span class="v{" mono" if mono else ""}">{v}</span></span>')


def tarjetas_tel(t):
    """Cada fila de opciones, una tarjeta (263): el número, el texto y sus acciones; debajo, «Código», los campos y «Detalle» y,
    si no está activa, «Estado». Sin la etiqueta «De baja» junto al nombre ni el código debajo del nombre."""
    cuenta = {"activa": 0, "baja": 0, "mal": 0}
    out, pos = [], 0
    for m in re.finditer(r'<div class="q-row( baja| mal)?">', t):
        fin = e12.cierre(t, m.start(), "div")
        fila = t[m.start():fin]
        tipo = (m.group(1) or "").strip()
        num = re.search(r'<span class="num">(\d+)</span>', fila).group(1)
        tx_a = fila.index('<span class="tx">')
        tx_b = e12.cierre(fila, tx_a, "span")
        tx = fila[tx_a:tx_b]
        acc = fila[tx_b:-6]
        nombre = re.search(r"<b>([^<]+)", tx).group(1)
        debajo = re.search(r"</b><span>([^<]+)</span>", tx).group(1)
        codigo, cuit, zona, detalle = OPCIONES[nombre]
        er = ""
        if tipo == "mal":
            assert debajo == "No entra en el título de WhatsApp.", debajo
            detalle = DETALLE_LARGO
            er = f'<span class="er">{debajo}</span>'
        else:
            assert debajo == codigo, (debajo, codigo)
        datos = (dato("Código", codigo, mono=True) + dato("CUIT", cuit, mono=True) + dato("Zona", zona)
                 + dato("Detalle", detalle, todo=len(detalle) > 24))
        if tipo == "baja":
            datos += dato("Estado", '<span class="b2-est">De baja</span>')
        cuenta[tipo or "activa"] += 1
        out.append(t[pos:m.start()] + f'<div class="b2-tj q-tj{" " + tipo if tipo else ""}"><span class="num">{num}</span>'
                   f'<span class="nm">{nombre}</span>{acc}<span class="dl">{datos}</span>{er}</div>')
        pos = fin
    out.append(t[pos:])
    print("tarjetas del teléfono:", cuenta)
    return "".join(out)


def hoja(x, titulo, accion):
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="{titulo}"><span class="asa"></span>'
            f'<div class="hc"><div><h2>{titulo}</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{x}</button></div>'
            f'<div class="hb"><div class="ap-acciones2"><span role="menuitem">{accion}</span></div></div><div class="hp"></div></div>')


def telefono():
    nombre = "M-FRM-Catalogo-13"
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return
    t = props_comillas(para_aprobar(t))
    t = con_css(t, CSS_TEL)
    x = re.search(r'<h2>Descripción</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">(' + SVG + ')', t, re.S).group(1)

    # «Agregar campo» de «En WhatsApp», en la pieza (262).
    lado = iter(["Título", "Descripción"] * 2)
    t = subn(r'<div class="ct sel">Agregar campo' + SVG + r'</div>', lambda m: pieza_agregar(aria=f"Agregar campo a {next(lado)}"), t, 4)

    # «Elegir qué muestra»: la pieza a pantalla completa con lo que falta, en lugar de la hoja (262).
    (c1a, c1b), (h1a, h1b) = e12.sc_ifs(t, "s1")
    capa = t[h1a:h1b]
    assert 'aria-label="Descripción"' in capa and "t-opc" in capa
    pieza = b2.pk_tel("Agregar campo a Descripción", [(n, None, False, None) for n in ("Texto", "Código", "Detalle")])
    t = t[:h1a] + f'<sc-if value="{{{{s1}}}}" hint-placeholder-val="{{{{no}}}}">{pieza}</sc-if>' + t[h1b:]

    # Las filas: el ⋮ (261) y cada opción como tarjeta (263).
    t = tarjetas_tel(filas_tel(t))
    cuerpo = t[t.index("</helmet>"):]
    assert 'class="q-row' not in cuerpo and 'class="t-chip' not in cuerpo

    # «Columnas» arriba de la lista, a todo el ancho (262).
    boton = f'<div class="k-coltel"><button type="button" aria-haspopup="dialog">Columnas {b2.SVG_FLECHA}</button></div>'
    t = subn(r'(<div class="k-ops-b">.*?</div>)', lambda m: m.group(1) + boton, t, 4)

    # Los estados nuevos: «Reactivar una opción» (la hoja del ⋮) y «Columnas» (la pieza múltiple con «Listo (2)»).
    nuevos = ["Reactivar una opción", "Columnas"]
    t, sv = e12.sumar_estados(t, [("Campos", nuevos[0:1]), ("Elegir qué muestra", nuevos[1:2])], nuevos)
    c0a, c0b = e12.sc_ifs(t, "s0")[0]
    cuerpos = [e12.renombrar(t[c0a:c0b], "s0", sv[n]) for n in nuevos]
    capas = [f'<sc-if value="{{{{{sv[nuevos[0]]}}}}}" hint-placeholder-val="{{{{no}}}}">{hoja(x, "Aluminios Cuyo", "Reactivar")}</sc-if>',
             f'<sc-if value="{{{{{sv[nuevos[1]]}}}}}" hint-placeholder-val="{{{{no}}}}">'
             + b2.pk_tel("Columnas", [(n, None, True, None) for n in CAMPOS], multiple=True, listo="Listo (2)") + "</sc-if>"]
    raya = t.index('<span class="ap-raya"></span>')
    fin_capas = t.rindex("</div>\n</x-dc>")
    t = t[:raya] + "".join(cuerpos) + t[raya:fin_capas] + "".join(capas) + t[fin_capas:]
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- la E14
MARCA_14 = 'data-e13="columnas"'
CSS_14 = """
/* E13 · «Columnas», un botón de la barra que abre la pieza múltiple, sin cantidades (262), como en `FRM-Catalogo-13`. Sin
   medidas que escalar: la pasada de las piezas no tiene nada que cambiar acá. */
.k-fb .f-env { position: relative; display: inline-flex; }
button.w-pil { font: inherit; }
.w-pil[aria-expanded="true"] { border-color: var(--marca); }
"""


def columnas_14():
    """`FRM-Catalogo-14` (el mismo catálogo en la E14, que redibuja `e14_*`): solo «Columnas», el botón de la pieza múltiple,
    como en `FRM-Catalogo-13`; nada más de ese tablero. `M-FRM-Catalogo-14` no tiene «Columnas». Corre una vez (su bloque lo frena)."""
    nombre = "FRM-Catalogo-14"
    t, nl = leer(nombre)
    if MARCA_14 in t:
        print(nombre, "ya tiene «Columnas»: no hace nada")
        return
    flecha = re.search(r'<span class="w-pil">Columnas (' + SVG + ')', t, re.S).group(1)
    t = subn(r'<span class="w-pil">Columnas ' + SVG + r'</span>', lambda m: columnas_compu(flecha), t, 7)
    t = t.replace("</helmet>", f"<style {MARCA_14}>\n{CSS_14}</style>\n</helmet>", 1)
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- «En WhatsApp»
# El título y la descripción de «En WhatsApp», en la pieza múltiple (262 y `Criterio-Elegir`, que mandan sobre la spec de la E13):
# sin chips ni «Agregar campo»; cerrada, los lugares por su nombre, separados por coma, en el orden de los campos del catálogo (el
# de las columnas de la tabla); abierta, una casilla por lugar. Como la presentación propia de `FRM-Editor` (`e14_editor_1004.py`).
# Corre sobre los tableros como están (después de los pasos de arriba y de la pasada de las piezas): no suma CSS, porque la pieza ya
# está en sus bloques, así que la pasada no hace falta. Sin chips en el tablero, no hace nada.
LUGARES = {"FRM-Catalogo-13": ["Texto", "Código", "CUIT", "Zona", "Detalle"],
           "M-FRM-Catalogo-13": ["Texto", "Código", "CUIT", "Zona", "Detalle"],
           "FRM-Catalogo-14": ["Texto", "Código", "Unidad", "Detalle"],
           "M-FRM-Catalogo-14": ["Texto", "Código", "Unidad", "Detalle"]}


def presentacion(nombre, chip, caja, cuantas):
    """Cambia cada `caja` (`<span class="sels">` o `<div class="k-wa-t">`) de «En WhatsApp» por la pieza múltiple."""
    t, nl = leer(nombre)
    i0 = t.index("</helmet>")
    if f'class="{chip}' not in t[i0:]:
        print(nombre, "ya no tiene chips en «En WhatsApp»: no hace nada")
        return None
    orden = LUGARES[nombre]
    tag = caja.split()[0].lstrip("<")
    out, pos, cuenta = [], 0, 0
    for m in re.finditer(re.escape(caja), t):
        fin = e12.cierre(t, m.start(), tag)
        bloque = t[m.start():fin]
        antes = t[:m.start()]
        parte = "Título" if antes.rfind("Título · hasta 30") > antes.rfind("Descripción · hasta 300") else "Descripción"
        nombres = re.findall(r'<span class="%s(?: ro)?">([^<]+)' % chip, bloque)
        assert nombres and all(n in orden for n in nombres), (nombre, nombres)
        nombres.sort(key=orden.index)
        ro = f'class="{chip} ro"' in bloque
        abierta = 'aria-expanded="true"' in bloque
        extra = (b2.lista([b2.op(n, elegida=n in nombres, multiple=True) for n in orden], multiple=True) if abierta else "")
        out.append(t[pos:m.start()] + b2.campo(", ".join(nombres), abierto=abierta, aria=parte, extra=extra,
                                               apagado=SOLO_LEER if ro else None, tip_abierto=False))
        pos = fin
        cuenta += 1
    out.append(t[pos:])
    t = "".join(out)
    cuerpo = t[i0:t.index('<script type="text/x-dc"')]
    assert cuenta == cuantas and f'class="{chip}' not in cuerpo, (nombre, cuenta)
    print(nombre, "«En WhatsApp» en la pieza múltiple:", cuenta)
    return t, nl


def presentacion_todos():
    for nombre, cuantas in (("FRM-Catalogo-13", 26), ("FRM-Catalogo-14", 14)):
        r = presentacion(nombre, "k-chip2", '<span class="sels">', cuantas)
        if r:
            assert not re.search("Agregar campo(?!s)", r[0][r[0].index("</helmet>"):r[0].index('<script type="text/x-dc"')]), nombre
            escribir(nombre, *r)
    for nombre, cuantas in (("M-FRM-Catalogo-13", 8), ("M-FRM-Catalogo-14", 6)):
        r = presentacion(nombre, "k-chip3", '<div class="k-wa-t">', cuantas)
        if not r:
            continue
        t, nl = r
        if nombre == "M-FRM-Catalogo-13":
            # «Elegir qué muestra»: la descripción a pantalla completa, una casilla por lugar y «Listo (2)».
            i = t.index('<div class="acc-pk" role="dialog" aria-label="Agregar campo a Descripción">')
            j = e12.cierre(t, i, "div")
            pieza = b2.pk_tel("Descripción", [(n, None, n in ("CUIT", "Zona"), None) for n in LUGARES[nombre]], multiple=True,
                              listo="Listo (2)")
            t = t[:i] + pieza + t[j:]
        assert not re.search("Agregar campo(?!s)", t[t.index("</helmet>"):t.index('<script type="text/x-dc"')]), nombre
        escribir(nombre, t, nl)


if __name__ == "__main__":
    compu()
    telefono()
    columnas_14()
    presentacion_todos()
