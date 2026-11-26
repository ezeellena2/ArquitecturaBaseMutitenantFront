"""Lo que quedó para alinear de la tanda 3B de Diseño (decisión 287, 2026-11-26), sin decisión nueva: lo dibujado es lo que vale, y
los títulos no suman « · para aprobar».

1. **«Visita a cliente», versión 4, de una sola manera.** La respuesta (F1, `e21_respuesta_1004.py`, y lo que la muestra de F2,
   `e21_corregir_1004.py`) tenía «Datos» y «Resultado de la visita», con «Ubicación de la visita» y «Monto estimado» y sin «Correo
   del cliente»; la carga de la E21 (D, `e20_carga_1004.py`) tenía «La visita» y «El resultado», con «Correo del cliente» y sin la
   ubicación ni el monto. Queda la forma que fija la spec y, donde no la fija, la de la respuesta:
   - **«Datos»** es la zona de lo que va antes del primer título (spec de la E15, «Zonas»), y la ubicación de «Visita a cliente» va
     «en «Datos», en una columna» al cargar (spec de la E20, «La pregunta «Ubicación»»); `FRM-Cargar-Respuesta-21` va «sobre la forma
     de la E20» (spec de la E21, «Pantallas»);
   - **«Correo del cliente»** es de la versión 4: `FRM-Cargar-Respuesta-21` existe para mostrar la pregunta «Correo» de «Visita a
     cliente · versión 4», que en la carga «ocupa una columna» (spec de la E21, «La pregunta «Correo»», 141), y la respuesta se lee
     como el formulario (266). En la respuesta va en el lugar libre del primer renglón de «Datos», después de «Fecha de la visita»,
     como al cargar; en la vista rápida (dos columnas) y en el teléfono, en su renglón. Con valor en VIS-000126 y VIS-000131; vacía,
     como cualquier pregunta sin respuesta, en las demás;
   - **«Resultado de la visita»** es el título del autor de la respuesta (la spec no nombra el título), con «Monto estimado» después
     de «¿Se concretó la venta?»: al cargar, el renglón queda «¿Se concretó la venta?», «Monto estimado» y «Motivo», y «Fallas» pasa
     al siguiente. En el teléfono, la zona plegada dice «0 de 5 respondidas».
   Cambian `FRM-Cargar-Respuesta-21` y su teléfono (zonas, «Ubicación de la visita» con «Usar mi ubicación» y «Monto estimado»), y
   `FRM-Respuesta-Aprobacion`, `FRM-Respuesta-Corregir` y `FRM-Respuesta-Anular`, con sus teléfonos («Correo del cliente», también
   para corregir). Una respuesta de la versión 3 (sin título ni ubicación) no la suma: la versión no la tenía (E19).
2. **`FRM-Editor-20`: «El tipo en el bloque».** La spec de la E20 dice que «Ubicación» «no entra en el bloque, donde aparece apagada
   como Foto y Documento». Estado nuevo, copia de «En la app y por WhatsApp»: «Cantidad», del bloque «Productos», abierta, con «Tipo
   de respuesta» abierto en la pieza (262): los doce tipos con el buscador y la cantidad, «Elegir varias» apagada («En un bloque se
   elige una sola opción.»), y «Foto», «Documento» y «Ubicación» apagadas («No se carga varias veces.», los textos de la E19), con el
   tooltip de «Ubicación» abierto (211, como `Criterio-Elegir` y el «El tipo en el bloque» de `FRM-Editor-21`). «Monto» se cierra.
   Solo la compu.
3. **«3.650» con su separador de miles** en lo que se lee: el rango de la (i), su tooltip y «el máximo de la plataforma (3.650
   días)», en `Config-Plat-Base2`, `M-Config-Plat-Base2`, `FRM-Config-Org`, `M-FRM-Config-Org` y `FRM-Config-Plat`. El valor de un
   campo numérico (`value` o el `ct` que lo dibuja) sigue sin separador, como lo muestra el navegador; `data-props` y el guion no se
   tocan.
4. **«Elegir el modelo» de `Asistente-Config-Org`** (el único tablero con esa lista abierta): la lista de la pieza (262), con la
   tilde del elegido a la izquierda y la descripción en gris debajo, el marcado de `Criterio-Elegir` (`b2-pkl` y `b2-op`, como «Qué
   clave usa» del mismo tablero). Se va la tilde a la derecha (`as-op-t`).

Sin altos nuevos: la respuesta suma la pregunta en el lugar libre de la pantalla completa, y la vista rápida y el teléfono se
desplazan; la carga de la compu suma un renglón por zona y le sobra lugar en 1100 (la de la E20, con más renglones y el bloque,
entra en 1200).

Corre una vez: cada tablero suma `<style data-t3b="v189-formularios">` y, si ya lo tiene, no cambia. Lee y escribe sin cambiar los
finales de línea.

Uso: `python v189_formularios_1004.py`
"""
import io
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
from e14_editor_1004 import cierre, renombrar, s_de, sc_ifs, sumar_estados  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
GEN = pathlib.Path(__file__).resolve().parent
PROJ = GEN.parent
MARCA = 'data-t3b="v189-formularios"'
SVG = r"<svg\b[^>]*>.*?</svg>"


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    t = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in t else "\n"
    return t.replace("\r\n", "\n"), nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def una(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:140])
    return t.replace(viejo, nuevo)


def con_marca(t, css):
    assert MARCA not in t
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def cuerpo_de(t):
    """(inicio, fin) de lo que se ve: entre `</helmet>` y el guion."""
    return t.index("</helmet>"), t.index('<script type="text/x-dc"')


def tablero(nombre, css, cambiar):
    t, nl = leer(nombre)
    if MARCA in t:
        print(nombre, "ya tiene el bloque: no hace nada")
        return
    print(nombre)
    t = cambiar(con_marca(t, css))
    escribir(nombre, t, nl)


def svg_antes(t, despues):
    """El `<svg>` que termina justo antes de `despues`."""
    j = t.index(despues)
    i = t.rindex("<svg", 0, j)
    assert t[i:j].endswith("</svg>"), t[i:j][-40:]
    return t[i:j]


# ---------------------------------------------------------------------------------------------------------------- 1 · la carga
def usar_ubicacion_compu():
    u, _ = leer("FRM-Cargar-Respuesta")
    svg = svg_antes(u, " Usar mi ubicación</button>")
    return ('<div class="cg-fila" data-entry-row><div class="w-cmp cg-q s1"><span class="rt">Ubicación de la visita</span>'
            f'<div class="t15e-ub" aria-live="polite"><button type="button" class="cb cb-sec t15e-ubtn">{svg} Usar mi ubicación</button>'
            '</div></div></div>')


def usar_ubicacion_tel(t):
    u, _ = leer("M-FRM-Cargar-Respuesta")
    svg = svg_antes(u, " Usar mi ubicación</button>")
    boton = f'<button type="button" class="cb cb-sec t15e-ubtn">{svg} Usar mi ubicación</button>'
    if ".cg-tacc" in t:
        boton = f'<div class="cg-tacc">{boton}</div>'
    return ('<div class="ap-cmp"><span class="rt"><span>Ubicación de la visita</span></span>'
            f'<div class="t15e-ub" aria-live="polite">{boton}</div></div>')


MONTO_COMPU = '<div class="w-cmp cg-q s1"><span class="rt">Monto estimado</span><div class="ct ang"></div></div>'
CSS_CARGA = """/* v189 · «Visita a cliente», versión 4, como la respuesta: «Datos» con «Ubicación de la visita» (spec de la E20) y «Resultado de
   la visita» con «Monto estimado»; «Correo del cliente» sigue en «Datos» (spec de la E21). */
"""


def zonas_carga_compu(t):
    a, b = cuerpo_de(t)
    c = t[a:b]
    ubic = usar_ubicacion_compu()
    # «Datos»: el renglón de «Ubicación de la visita» después del de Cliente, Fecha y Correo.
    partes, pos, n = [], 0, 0
    for m in re.finditer(r'<div class="w-caja cg-z"><div class="f-cab"><span>La visita</span>', c):
        z0 = m.start()
        z1 = cierre(c, z0, "div")
        zona = c[z0:z1]
        f0 = zona.index('<div class="cg-fila"')
        f1 = cierre(zona, f0, "div")
        assert "Correo del cliente" in zona[f0:f1] and "Ubicación" not in zona
        zona = zona[:f1] + ubic + zona[f1:]
        zona = una(zona, "<span>La visita</span>", "<span>Datos</span>")
        zona = una(zona, 'aria-label="Plegar La visita"', 'aria-label="Plegar Datos"')
        partes += [c[pos:z0], zona]
        pos, n = z1, n + 1
    c = "".join(partes) + c[pos:]
    print("  «Datos» con la ubicación:", n)
    # «Resultado de la visita»: «Monto estimado» después de «¿Se concretó la venta?», y «Fallas» a su renglón.
    partes, pos, k = [], 0, 0
    for m in re.finditer(r'<div class="w-caja cg-z"><div class="f-cab"><span>El resultado</span>', c):
        z0 = m.start()
        z1 = cierre(c, z0, "div")
        zona = c[z0:z1]
        f0 = zona.index('<div class="cg-fila"')
        f1 = cierre(zona, f0, "div")
        fila = zona[f0:f1]
        s0 = fila.index('<div class="w-cmp cg-q s1"><span class="rt">¿Se concretó la venta?')
        s1 = cierre(fila, s0, "div")
        fila = fila[:s1] + MONTO_COMPU + fila[s1:]
        g0 = fila.index('<div class="w-cmp cg-q s1"><span class="rt">Fallas')
        g1 = cierre(fila, g0, "div")
        fallas = fila[g0:g1]
        fila = fila[:g0] + fila[g1:]
        assert fila.count('class="w-cmp cg-q s1"') == 3, fila.count('class="w-cmp cg-q s1"')
        fila += f'<div class="cg-fila" data-entry-row>{fallas}</div>'
        zona = zona[:f0] + fila + zona[f1:]
        zona = una(zona, "<span>El resultado</span>", "<span>Resultado de la visita</span>")
        zona = una(zona, 'aria-label="Plegar El resultado"', 'aria-label="Plegar Resultado de la visita"')
        partes += [c[pos:z0], zona]
        pos, k = z1, k + 1
    c = "".join(partes) + c[pos:]
    print("  «Resultado de la visita» con el monto:", k)
    assert n == k == 3 and "La visita" not in c and "El resultado" not in c, (n, k)
    return t[:a] + c + t[b:]


def zonas_carga_tel(t):
    a, b = cuerpo_de(t)
    c = t[a:b]
    ubic = usar_ubicacion_tel(t)
    partes, pos, n = [], 0, 0
    for m in re.finditer(r'<button type="button" class="h" aria-expanded="true">La visita<', c):
        z0 = c.rindex('<div class="cg-tz">', 0, m.start())
        z1 = cierre(c, z0, "div")
        zona = c[z0:z1]
        b0 = zona.index('<div class="cg-tb">')
        b1 = cierre(zona, b0, "div")
        assert "Correo del cliente" in zona[b0:b1] and "Ubicación" not in zona
        zona = zona[:b1 - len("</div>")] + ubic + zona[b1 - len("</div>"):]
        zona = una(zona, ">La visita<", ">Datos<")
        partes += [c[pos:z0], zona]
        pos, n = z1, n + 1
    c = "".join(partes) + c[pos:]
    c, k = re.subn(r'>El resultado<span class="res">(\d) de 4 respondidas</span>',
                   lambda m: f'>Resultado de la visita<span class="res">{m.group(1)} de 5 respondidas</span>', c)
    print("  «Datos» con la ubicación:", n, "· «Resultado de la visita» plegada, de 5:", k)
    assert n == k == 3 and "La visita" not in c and "El resultado" not in c, (n, k)
    return t[:a] + c + t[b:]


# ---------------------------------------------------------------------------------------------------------------- 1 · la respuesta
CORREOS = {"Ferretería Rosales": "compras@ferreteriarosales.com.ar", "Distribuidora Norte": "pedidos@distribuidoranorte.com.ar"}
ET_EXTRA = r'(?:<span class="rf-req"[^>]*>[^<]*</span>)?'
DESPUES = r'(?:<span class="rf-(?:antes|error)"[^>]*>[^<]*</span>)*'
FECHA = re.compile(r'<div class="rf-q s1"><span class="rf-et">Fecha de la visita' + ET_EXTRA + r'</span><div class="rf-v ang num(?P<ed> ed)?'
                   r'(?: err)?" role="textbox"(?: aria-readonly="true")? aria-label="Fecha de la visita">[^<]*</div>' + DESPUES +
                   r'</div></div>(?=<div class="rf-f c[123]"><div class="rf-q s\d"><span class="rf-et">Ubicación de la visita)')
CLIENTE = re.compile(r'aria-label="Cliente">([^<]*)</div>')
CSS_RESPUESTA = """/* v189 · «Correo del cliente» en «Datos», como al cargar la versión 4 (spec de la E21 y 266): el control de siempre. */
"""


def correo(valor, editable):
    ro = "" if editable else ' aria-readonly="true"'
    return (f'<div class="rf-q s1"><span class="rf-et">Correo del cliente</span><div class="rf-v{" ed" if editable else ""}" role="textbox"'
            f'{ro} aria-label="Correo del cliente">{valor}</div></div>')


def correo_en_respuestas(t):
    a, b = cuerpo_de(t)
    c = t[a:b]
    partes, pos, cuenta = [], 0, {}
    for m in FECHA.finditer(c):
        f0 = c.rindex('<div class="rf-f c', 0, m.start())
        cols = int(c[f0 + len('<div class="rf-f c')])
        z0 = c.rindex('<section class="rf-z"', 0, m.start())
        cli = CLIENTE.findall(c, z0, m.start())
        assert cli, c[z0:z0 + 200]
        valor = CORREOS.get(cli[-1], "")
        caja = correo(valor, bool(m.group("ed")))
        fin = m.end() - len("</div>")  # el cierre del renglón
        if cols == 3:
            assert c[f0:fin].count('<div class="rf-q s') == 2, c[f0:fin][:300]
            partes += [c[pos:fin], caja]
            pos = fin
        else:
            partes += [c[pos:m.end()], f'<div class="rf-f c{cols}">{caja}</div>']
            pos = m.end()
        clave = f'c{cols}{" ed" if m.group("ed") else ""} · {cli[-1]}'
        cuenta[clave] = cuenta.get(clave, 0) + 1
    c = "".join(partes) + c[pos:]
    assert cuenta, "sin respuestas de la versión 4"
    print("  «Correo del cliente»:", sum(cuenta.values()), cuenta)
    return t[:a] + c + t[b:]


# ---------------------------------------------------------------------------------------------------------------- 2 · FRM-Editor-20
TIPOS = ["Texto corto", "Texto largo", "Número", "Fecha", "Sí o no", "Elegir una", "Elegir varias", "Elegir de un catálogo", "Foto",
         "Documento", "Cálculo", "Ubicación"]
# En una pregunta del bloque (E19, con los textos de su parte de contrato; la E20 suma «Ubicación» «como Foto y Documento»).
NO_VARIAS = "No se carga varias veces."
UNA_SOLA = "En un bloque se elige una sola opción."
EN_BLOQUE = {"Elegir varias": UNA_SOLA, "Foto": NO_VARIAS, "Documento": NO_VARIAS, "Ubicación": NO_VARIAS}
EL_TIPO = "El tipo en el bloque"
CSS_EDITOR = """/* v189 · «El tipo en el bloque» (spec de la E20 y 262): el tipo de una pregunta del bloque, abierto en la pieza, con
   «Ubicación» apagada como «Foto» y «Documento», y su motivo en el tooltip (211). */
.q-ed .w-cmp .b2-pkl { min-width: 340px; }
.q-ab:has(.b2-pkl), .q-blq:has(.b2-pkl) { overflow: visible; }
"""


def lista_tipos_bloque():
    ops = [b2.op(n, elegida=n == "Número", activa=n == "Número", apagada=EN_BLOQUE.get(n), tip_abierto=n == "Ubicación") for n in TIPOS]
    html = b2.lista(ops, buscar="", cantidad=f"{len(TIPOS)} tipos")
    # Los doce entran enteros, como en «Tipos de respuesta: menú» de `FRM-Editor-Ubicacion`.
    return html.replace('<div class="ops">', '<div class="ops" style="max-height: none;">', 1)


def editor_cantidad(t):
    """El editor de «Cantidad», del bloque, como el de `FRM-Editor-21` (`e21_reglas_1004.py`), con el tipo abierto."""
    f_i = re.search(r'<span class="f-i" tabindex="0" role="img" aria-label="[^"]*" title="[^"]*">(' + SVG + ')', t, re.S).group(1)
    tilde = f"<i>{b2.SVG_TILDE}</i>"
    return ('<div class="q-ed"><div class="w-cmp"><span class="rt">Pregunta <span class="req">*</span></span><div class="ct">Cantidad</div></div>'
            '<div class="w-cmp"><span class="rt">Tipo de respuesta</span>'
            f'{b2.campo("Número", abierto=True, aria="Tipo de respuesta", extra=lista_tipos_bloque())}</div>'
            '<div class="w-cmp"><span class="rt">Ayuda para quien lo recibe</span><div class="ct ph">Opcional</div></div>'
            f'<div class="w-cmp" style="justify-content: flex-end;"><span class="q-chk">{tilde}Obligatoria</span></div>'
            f'<div class="w-cmp lg-varias"><span class="q-chk">{tilde}Se carga varias veces</span><span class="f-i" tabindex="0" role="img" '
            f'aria-label="Se carga una vez por ítem." title="Se carga una vez por ítem.">{f_i}</span></div>'
            '<div class="q-pie ancho"><button type="button" class="cb cb-sec">Listo</button></div></div>')


def tipo_en_bloque(t):
    s = s_de(t, "En la app y por WhatsApp")
    t, sv = sumar_estados(t, [("Pasó a «Solo en la app»", EL_TIPO)])
    nuevo = sv[EL_TIPO]
    ed = editor_cantidad(t)

    def cuerpo(b):
        # «Monto» se cierra: queda su fila.
        i = b.index('<div class="q-ab">')
        j = cierre(b, i, "div")
        fila = b[i + len('<div class="q-ab">'):cierre(b, i + len('<div class="q-ab">'), "div")]
        assert fila.startswith('<div class="q-it"><span class="num">4</span><span class="dato"><b>Monto</b>'), fila[:120]
        b = b[:i] + fila + b[j:]
        # «Cantidad», del bloque, abierta.
        assert b.count('<div class="q-blq">') == 1
        i = b.index('<div class="q-it"><span class="num">6.2</span><span class="dato"><b>Cantidad</b>')
        j = cierre(b, i, "div")
        return b[:i] + f'<div class="q-ab">{b[i:j]}{ed}</div>' + b[j:]

    bloques = sc_ifs(t, s)
    assert len(bloques) == 2, len(bloques)
    for k, (a, b) in reversed(list(enumerate(bloques))):
        copia = renombrar(t[a:b], s, nuevo)
        t = t[:b] + (cuerpo(copia) if k == 1 else copia) + t[b:]
    print("  estado nuevo:", EL_TIPO, nuevo)
    return t


# ---------------------------------------------------------------------------------------------------------------- 3 · 3.650
CSS_MILES = """/* v189 · «3.650 días» con su separador de miles en lo que se lee (el rango, su tooltip y el máximo de la plataforma); el valor
   de un campo numérico sigue sin separador, como lo muestra el navegador. */
"""


def miles(t):
    a, b = cuerpo_de(t)
    c, n = re.subn(r"(?<![\d.])3650(?= días)", "3.650", t[a:b])
    assert n, "sin «3650 días»"
    print("  «3.650 días»:", n, "· quedan sin separador (valores de campo):", c.count("3650"))
    return t[:a] + c + t[b:]


# ---------------------------------------------------------------------------------------------------------------- 4 · el modelo
MODELOS = [("opus", "Claude Opus 5.5"), ("sonnet", "Claude Sonnet 5.5"), ("haiku", "Claude Haiku 5.5")]
CSS_MODELO = """/* v189 · «Modelo» abierto en la pieza (262), con la tilde del elegido a la izquierda, como en `Criterio-Elegir`. */
"""
JS_MODELO = """
  // v189 (262): la lista de «Modelo» es la de la pieza, con la tilde del elegido a la izquierda, como «Qué clave usa».
  v189Modelo(w) {
    const r = {};
    for (const m of ['opus', 'sonnet', 'haiku']) {
      const on = w['m_' + m] === 'on';
      const n = m[0].toUpperCase() + m.slice(1);
      r['v189' + n] = on; r['v189Sel' + n] = on ? 'true' : 'false'; r['v189Act' + n] = on ? 'act' : '';
    }
    return r;
  }
"""


def op_modelo(clave, nombre, desc):
    n = clave.capitalize()
    pista = "si" if clave == "sonnet" else "no"
    tilde = f'<sc-if value="{{{{v189{n}}}}}" hint-placeholder-val="{{{{{pista}}}}}">{b2.SVG_TILDE}</sc-if>'
    return (f'<button type="button" class="b2-op {{{{v189Act{n}}}}}" role="option" aria-selected="{{{{v189Sel{n}}}}}">'
            f'<span class="mk" aria-hidden="true">{tilde}</span><span class="tx"><span>{nombre}</span><span class="d">{desc}</span></span></button>')


def modelo(t):
    a, b = cuerpo_de(t)
    c = t[a:b]
    i = c.index('<div class="w-cmp as-env"><span class="rt">Modelo</span>')
    j = cierre(c, i, "div")
    campo = c[i:j]
    k0 = campo.index('<button type="button" class="ct sel as-btn')
    k1 = cierre(campo, k0, "button")
    boton = campo[k0:k1]
    e0 = campo.index('<sc-if value="{{t4ErrModelo}}"')
    error = campo[e0:cierre(campo, e0, "sc-if")]
    listas = []
    for var in ("abiertoModeloPlat", "abiertoModeloTodos"):
        l0 = campo.index(f'<sc-if value="{{{{{var}}}}}"')
        lista = campo[l0:cierre(campo, l0, "sc-if")]
        ops = re.findall(r'<button type="button" role="option" class="as-op \{\{m_(\w+)\}\}"><span class="n2"><span>([^<]*)</span>'
                         r'<span class="d">([^<]*)</span></span><span class="as-op-t">' + SVG + r'</span></button>', lista, re.S)
        assert ops and len(ops) == lista.count('role="option"'), (var, len(ops))
        abierta = lista[:lista.index(">") + 1]
        listas.append(f'{abierta}<div class="b2-pkl" role="listbox" aria-label="Modelo"><div class="ops">'
                      f'{"".join(op_modelo(*o) for o in ops)}</div></div></sc-if>')
    nuevo = ('<div class="w-cmp as-env"><span class="rt">Modelo</span>'
             f'<div class="b2-env">{boton}{"".join(listas)}</div>{error}</div>')
    assert campo.replace(boton, "").count("as-op-t") == campo.count("as-op-t")
    c = c[:i] + nuevo + c[j:]
    assert "as-op-t" not in c and "as-lista" not in c
    t = t[:a] + c + t[b:]
    viejo = "    return { ...v, ...this.t3bClave(v) };\n  }\n"
    t = una(t, viejo, "    const w = { ...v, ...this.t3bClave(v) };\n    return { ...w, ...this.v189Modelo(w) };\n  }\n" + JS_MODELO)
    print("  «Modelo»: dos listas en la pieza")
    return t


# ---------------------------------------------------------------------------------------------------------------- correr
if __name__ == "__main__":
    tablero("FRM-Cargar-Respuesta-21", CSS_CARGA, zonas_carga_compu)
    tablero("M-FRM-Cargar-Respuesta-21", CSS_CARGA, zonas_carga_tel)
    for nombre in ["FRM-Respuesta-Aprobacion", "M-FRM-Respuesta-Aprobacion", "FRM-Respuesta-Corregir", "M-FRM-Respuesta-Corregir",
                   "FRM-Respuesta-Anular", "M-FRM-Respuesta-Anular"]:
        tablero(nombre, CSS_RESPUESTA, correo_en_respuestas)
    tablero("FRM-Editor-20", CSS_EDITOR, tipo_en_bloque)
    for nombre in ["Config-Plat-Base2", "M-Config-Plat-Base2", "FRM-Config-Org", "M-FRM-Config-Org", "FRM-Config-Plat"]:
        tablero(nombre, CSS_MILES, miles)
    tablero("Asistente-Config-Org", CSS_MODELO, modelo)
