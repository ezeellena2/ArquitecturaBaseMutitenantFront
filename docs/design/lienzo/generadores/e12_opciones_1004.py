"""La E12, tanda 2 del traspaso 18 (v184, 2026-11-26): las opciones de un catálogo, su orden e importarlas, con la pieza para elegir
(262) y cada dato en su columna (263), sobre los tableros de siempre (se redibujan en su lugar, con su nombre):
- `FRM-Catalogo-Opciones` y su teléfono: el Estado de una opción guardada («Activa», «De baja») va en la pieza, cerrada, y en el
  estado nuevo «Elegir el estado», abierta. En la lista del modal, el número o «—», el texto, «Nueva» (o «Se borra al guardar») y el
  código o «Sin código», cada uno en su columna; el triángulo del error queda junto al texto. En el teléfono, cada opción es una
  tarjeta con el texto y sus datos nombrados (Código, Detalle), sin el código pegado al texto ni el detalle debajo;
- `FRM-Catalogo-Ordenar` y su teléfono: la columna (Texto o Código) y el orden («De la A a la Z», «De la Z a la A») van en la pieza,
  en lugar del combo y los radios; «Elegir la columna» la muestra abierta, y el teléfono suma ese estado a pantalla completa;
- `FRM-Catalogo-Importar`: «Desde» va en la pieza («Subir un archivo», «Pegar desde Excel»), apagada mientras se revisa o se aplica
  como hasta ahora, y el estado nuevo «Elegir desde dónde» la muestra abierta.

Las piezas son las de la segunda parte de la base (`base2_comun.py`). El CSS va en un bloque `<style data-e12="t2">` con las medidas
de antes de la escala; después corre `traspaso10_piezas_1004.py --tableros` con estos cinco, que pone la escala de la compu.
No se puede volver a correr sobre un tablero ya pasado: frena si encuentra el bloque.
"""
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import acciones_asistente_1004 as acc  # noqa: E402
import base2_comun as b  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
BLOQUE = 'data-e12="t2"'

CSS_PK_TEL = "\n".join(l for l in acc.CSS_TEL.splitlines() if l.startswith(".acc-pk"))

CSS_COMPU = b.CSS_B2 + """
/* E12 · La lista del modal de opciones: cada dato en su columna (263); el triángulo del error, junto al texto. */
.w-dlg.md .db { grid-template-columns: 350px minmax(0, 1fr); }
.md-it.e12c { display: grid; grid-template-columns: 20px minmax(0, 1fr) 72px 64px; align-items: center; column-gap: 10px; }
.md-it.e12c .tx { flex-direction: row; align-items: center; gap: 6px; }
.md-it.e12c .mc { font-size: 12.5px; line-height: 1.3; color: var(--t2); }
.md-it.e12c .mc .md-nueva { margin-left: 0; }
.md-it.e12c .mc.borrar { color: var(--peligro); }
.md-it.e12c .cod { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; color: var(--t2); overflow-wrap: anywhere; }
.md-it.e12c .cod.sin { font-family: inherit; color: var(--t3); }
.md-it.e12c.baja .cod { color: var(--t3); }
"""

CSS_TEL = b.CSS_B2 + b.CSS_B2_TEL + CSS_PK_TEL + """
/* E12 · El teléfono: la pieza con el radio de los campos del tablero; cada opción, una tarjeta con sus datos nombrados (263). */
.ap .b2-pkc { border-radius: 12px; }
.b2-tj .num { flex: none; width: 26px; height: 26px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; }
.b2-tj .nm { font-weight: 500; }
.b2-tj .v.mono { font-family: ui-monospace, Consolas, monospace; }
.b2-tj .tri { position: absolute; top: 14px; right: 16px; display: inline-flex; color: var(--peligro); }
"""


def leer(nombre):
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    assert "\r\n" not in t, nombre
    assert BLOQUE not in t, f"{nombre} ya tiene el bloque de la E12"
    return t


def escribir(nombre, t):
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8", newline="")
    print("ok", nombre, len(t))


def con_css(t, css):
    return t.replace("</helmet>", f"<style {BLOQUE}>\n{css}</style>\n</helmet>", 1)


def bloque_sc(t, var, contiene=None):
    """(inicio, fin) del `sc-if` de `var` (el que tiene `contiene`, si hay varios); `fin` incluye `</sc-if>`."""
    for m in re.finditer(r'<sc-if value="\{\{' + var + r'\}\}"[^>]*>', t):
        e = t.index("</sc-if>", m.end()) + len("</sc-if>")
        if contiene is None or contiene in t[m.end():e]:
            assert "<sc-if" not in t[m.end():e - 8], f"{var} tiene otro sc-if adentro"
            return m.start(), e
    raise AssertionError(f"sin el sc-if de {var}")


def sumar_estado(t, nombre_nuevo, despues_de, var_nueva):
    """Suma un estado al enum después de `despues_de`, con su `sc-if` en `var_nueva`; los demás conservan su variable."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    viejos = props["estado"]["options"]
    assert nombre_nuevo not in viejos
    nuevos = list(viejos)
    nuevos.insert(viejos.index(despues_de) + 1, nombre_nuevo)
    props["estado"]["options"] = nuevos
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    t = t[:m.start(1)] + texto + t[m.end(1):]
    lista_vieja = "[" + ", ".join(json.dumps(v, ensure_ascii=False) for v in viejos) + "]"
    assert lista_vieja in t, "sin la lista de estados en renderVals"
    t = t.replace(lista_vieja, "[" + ", ".join(json.dumps(v, ensure_ascii=False) for v in nuevos) + "]", 1)
    for i, v in enumerate(viejos):
        viejo = f"      s{i}: k === {i},\n"
        assert viejo in t, viejo
        t = t.replace(viejo, f"      s{i}: k === {nuevos.index(v)},\n", 1)
    ultimo = f"      s{len(viejos) - 1}: k === {nuevos.index(viejos[-1])},\n"
    t = t.replace(ultimo, ultimo + f"      {var_nueva}: k === {nuevos.index(nombre_nuevo)},\n", 1)
    return t


def copiar_estado(t, var, var_nueva, cambio, contiene=None, poner_despues_de=None, contiene_despues=None):
    """Copia el `sc-if` de `var` en `var_nueva` (oculto de entrada), con `cambio` aplicado, después del de `poner_despues_de`."""
    i, e = bloque_sc(t, var, contiene)
    nuevo = t[i:e].replace("{{" + var + "}}", "{{" + var_nueva + "}}", 1).replace('hint-placeholder-val="{{si}}"', 'hint-placeholder-val="{{no}}"', 1)
    nuevo2 = cambio(nuevo)
    assert nuevo2 != nuevo, f"el cambio no encontró nada en {var_nueva}"
    _, d = bloque_sc(t, poner_despues_de or var, contiene_despues)
    return t[:d] + nuevo2 + t[d:]


# ---------------------------------------------------------------------------------------------------------------- opciones
CODIGOS = {"Seguimiento": "SEG", "Venta nueva": "VEN", "Reclamo": "REC", "Cobranza": "COB"}
FILA_MD = re.compile(r'<div class="md-it(?P<cls>[^"]*)" role="option" aria-selected="(?P<sel>\w+)"><span class="num">(?P<num>[^<]*)</span>'
                     r'<span class="tx"><b>(?P<txt>.*?)</b><small(?P<sc>[^>]*)>(?P<small>[^<]*)</small></span>'
                     r'(?P<tri><span class="tri"[^>]*><svg.*?</svg></span>)?</div>', re.S)
SEG_ESTADO = re.compile(r'<span class="md-seg" role="radiogroup" aria-label="Estado"><span class="(on)?" role="radio">Activa</span>'
                        r'<span class="(on)?" role="radio">De baja</span></span>')


def fila_md(m):
    txt = m.group("txt")
    marca, clase_marca = "", ""
    if '<span class="md-nueva">Nueva</span>' in txt:
        txt = txt.replace('<span class="md-nueva">Nueva</span>', "")
        marca = '<span class="md-nueva">Nueva</span>'
    chico = m.group("small")
    if 'class="borrar"' in m.group("sc"):
        marca, clase_marca = chico, " borrar"
        chico = CODIGOS[txt]
    cod = f'<span class="cod{" sin" if chico == "Sin código" else ""}">{chico}</span>'
    return (f'<div class="md-it e12c{m.group("cls")}" role="option" aria-selected="{m.group("sel")}"><span class="num">{m.group("num")}</span>'
            f'<span class="tx"><b>{txt}</b>{m.group("tri") or ""}</span><span class="mc{clase_marca}">{marca}</span>{cod}</div>')


def estado_cerrado(m):
    valor = "Activa" if m.group(1) else "De baja"
    return f'<div class="e12-pk" style="max-width: 240px;">{b.campo(valor, aria="Estado")}</div>'


def opciones():
    t = leer("FRM-Catalogo-Opciones")
    t, n = FILA_MD.subn(fila_md, t)
    assert n == 33, n
    t, n = SEG_ESTADO.subn(estado_cerrado, t)
    assert n == 6, n
    cerrado = b.campo("Activa", aria="Estado")
    abierto = b.campo("Activa", abierto=True, aria="Estado",
                      extra=b.lista([b.op("Activa", elegida=True, activa=True), b.op("De baja")]))
    t = copiar_estado(t, "s2", "s9", lambda x: x.replace(cerrado, abierto, 1), poner_despues_de="s3")
    t = sumar_estado(t, "Elegir el estado", "Una opción dada de baja", "s9")
    escribir("FRM-Catalogo-Opciones", con_css(t, CSS_COMPU))


FILA_TEL = re.compile(r'<div class="q-row"><span class="num">(?P<num>\d+)</span><span class="tx"><b>(?P<txt>[^<]*)<span class="cod">(?P<cod>[^<]*)</span></b>'
                      r'<span>(?P<det>[^<]*)</span></span>(?P<tri><span class="tri"[^>]*><svg.*?</svg></span>)?</div>', re.S)
SEL_ESTADO_TEL = re.compile(r'<div class="ct sel">(Activa|De baja)<svg.*?</svg></div>', re.S)


def fila_tel(m):
    datos = [("Código", f'<span class="mono">{m.group("cod")}</span>'), ("Detalle", m.group("det"), True)]
    t = b.tarjeta(m.group("txt"), datos, av=f'<span class="num">{m.group("num")}</span>')
    t = t.replace('<span class="v"><span class="mono">', '<span class="v mono"><span>')
    if m.group("tri"):
        t = t[:-len("</div>")] + m.group("tri") + "</div>"
    return t


def opciones_tel():
    t = leer("M-FRM-Catalogo-Opciones")
    t, n = FILA_TEL.subn(fila_tel, t)
    assert n == 8, n
    t, n = SEL_ESTADO_TEL.subn(lambda m: b.campo(m.group(1), aria="Estado"), t)
    assert n == 2, n
    hoja = b.pk_tel("Estado", [("Activa", None, True, None), ("De baja", None, False, None)])
    t = copiar_estado(t, "s3", "s5", lambda x: x[:-len("</sc-if>")] + hoja + "</sc-if>")
    t = sumar_estado(t, "Elegir el estado", "Una opción guardada", "s5")
    escribir("M-FRM-Catalogo-Opciones", con_css(t, CSS_TEL))


# ---------------------------------------------------------------------------------------------------------------- ordenar
COLUMNA = re.compile(r'<span class="t2-env"><span class="t2-sel(?P<ab> t2-abierto)?" role="combobox" aria-label="Columna" aria-expanded="\w+">'
                     r'<span>(?P<v>Texto|Código)</span><svg.*?</svg></span>(?P<lista><div class="t2-lista".*?</div>)?</span>', re.S)
ORDEN = re.compile(r'<div class="t2-campo" role="radiogroup" aria-label="Orden">(?P<rt><span class="t2-rt">Orden<span class="f-i".*?</svg></span></span>)'
                   r'<span class="t2-rds">(?P<rds>(?:<span class="t2-rd[^"]*" role="radio" aria-checked="\w+"><span class="rd"></span>[^<]*</span>)+)</span></div>', re.S)
COLUMNA_TEL = re.compile(r'<span class="t2-hsel" role="combobox" aria-label="Columna" aria-expanded="\w+"><span>(Texto|Código)</span><svg.*?</svg></span>', re.S)
ORDEN_TEL = re.compile(r'<div class="t2-hcampo" role="radiogroup" aria-label="Orden">(?P<rt><span class="t2-hrt">Orden<span class="f-i".*?</svg></span></span>)'
                       r'<div class="t2-hrds">(?P<rds>(?:<span class="t2-hrd[^"]*" role="radio" aria-checked="\w+"><span class="rd"></span>[^<]*</span>)+)</div></div>', re.S)


def elegido(rds):
    return re.search(r'<span class="t2-h?rd on" role="radio" aria-checked="true"><span class="rd"></span>([^<]*)</span>', rds).group(1)


def columna(m):
    v = m.group("v")
    if m.group("ab"):
        lst = b.lista([b.op(c, elegida=c == v, activa=c == v) for c in ("Texto", "Código")])
        return b.campo(v, abierto=True, aria="Columna", extra=lst)
    return b.campo(v, aria="Columna")


def ordenar():
    t = leer("FRM-Catalogo-Ordenar")
    t, n = COLUMNA.subn(columna, t)
    assert n == 4, n
    t, n = ORDEN.subn(lambda m: f'<div class="t2-campo">{m.group("rt")}{b.campo(elegido(m.group("rds")), aria="Orden")}</div>', t)
    assert n == 4, n
    escribir("FRM-Catalogo-Ordenar", con_css(t, CSS_COMPU))


def ordenar_tel():
    t = leer("M-FRM-Catalogo-Ordenar")
    t, n = COLUMNA_TEL.subn(lambda m: b.campo(m.group(1), aria="Columna"), t)
    assert n == 2, n
    t, n = ORDEN_TEL.subn(lambda m: f'<div class="t2-hcampo">{m.group("rt")}{b.campo(elegido(m.group("rds")), aria="Orden")}</div>', t)
    assert n == 2, n
    hoja = b.pk_tel("Columna", [("Texto", None, True, None), ("Código", None, False, None)])
    t = copiar_estado(t, "s0", "s4", lambda x: x[:-len("</sc-if>")] + hoja + "</sc-if>", contiene='data-t15t2="ordenar"',
                      contiene_despues='data-t15t2="ordenar"')
    t = sumar_estado(t, "Elegir la columna", "Ordenar las opciones", "s4")
    escribir("M-FRM-Catalogo-Ordenar", con_css(t, CSS_TEL))


# ---------------------------------------------------------------------------------------------------------------- importar
DESDE = re.compile(r'<div class="imp-seg(?P<off> off)?" role="radiogroup" aria-label="Desde"><span(?P<a> class="on")? role="radio">Subir un archivo</span>'
                   r'<span(?: class="on")? role="radio">Pegar desde Excel</span></div>')


def desde(m, abierto=False):
    v = "Subir un archivo" if m.group("a") else "Pegar desde Excel"
    extra = b.lista([b.op(o, elegida=o == v, activa=o == v) for o in ("Subir un archivo", "Pegar desde Excel")]) if abierto else ""
    c = b.campo(v, abierto=abierto, apagado=bool(m.group("off")), tip_abierto=False, aria="Desde", extra=extra)
    return f'<div class="e12-pk" style="max-width: 340px;">{c}</div>'


def importar():
    t = leer("FRM-Catalogo-Importar")
    i, e = bloque_sc(t, "s0")
    abierto = DESDE.sub(lambda m: desde(m, abierto=True), t[i:e], count=1)
    t, n = DESDE.subn(desde, t)
    assert n == 19, n
    # el estado nuevo parte del primero ya con la pieza abierta
    abierto = abierto.replace("{{s0}}", "{{s19}}", 1).replace('hint-placeholder-val="{{si}}"', 'hint-placeholder-val="{{no}}"', 1)
    _, d = bloque_sc(t, "s0")
    t = t[:d] + abierto + t[d:]
    t = sumar_estado(t, "Elegir desde dónde", "Elegir un archivo", "s19")
    escribir("FRM-Catalogo-Importar", con_css(t, CSS_COMPU))


if __name__ == "__main__":
    opciones()
    opciones_tel()
    ordenar()
    ordenar_tel()
    importar()
    tableros = "FRM-Catalogo-Opciones,M-FRM-Catalogo-Opciones,FRM-Catalogo-Ordenar,M-FRM-Catalogo-Ordenar,FRM-Catalogo-Importar"
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", tableros], check=True)
