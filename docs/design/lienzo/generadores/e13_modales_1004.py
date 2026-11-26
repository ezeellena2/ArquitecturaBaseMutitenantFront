"""La E13, tanda 2 del traspaso 18 (2026-11-26): los modales de los campos de un catálogo, con la pieza para elegir (262) y cada dato
en su columna (263), sobre los tableros de siempre (se redibujan en su lugar, con su nombre), como `e12_opciones_1004.py` en la E12:
- `FRM-Catalogo-Opciones-13` y su teléfono: como la E12, el Estado de una opción guardada («Activa», «De baja») va en la pieza,
  cerrada, y en el estado nuevo «Elegir el estado», abierta; en la lista del modal, el número o «—», el texto, «Nueva» y el código,
  cada uno en su columna, y en el teléfono cada opción es una tarjeta con sus datos nombrados (Código, Detalle). Lo propio de la E13:
  la fila de un campo «De un catálogo» («Zona») se elige con la pieza, no con un combo; en «Un valor de una opción dada de baja», la
  pieza abierta muestra la guardada («Cuyo», «De baja») primero, con su tilde, y después las activas de la fuente, con el buscador
  adentro porque vienen del servidor;
- `FRM-Catalogo-Ordenar-13` y su teléfono: la columna (Texto, Código o un campo, como «Rubro») y el orden van en la pieza, en lugar
  del combo y los radios, con los textos del orden que ya tenía cada tipo; «Elegir la columna» la muestra abierta, y en el teléfono,
  a pantalla completa sobre «Ordenar las opciones» (antes era una hoja que solo servía para elegir);
- `FRM-Catalogo-Campos` y su teléfono: en la lista «Campos · N de 20», el número, el nombre, «Nuevo» y el tipo, cada uno en su
  columna, con ↑ ↓ en el elegido; el Tipo y el Catálogo de un campo van en la pieza: cerrada dice «Zonas»; abierta, cada catálogo con
  sus opciones en gris debajo del nombre, el buscador adentro con la cantidad, y este mismo catálogo apagado con su motivo en el
  tooltip (211). En el teléfono, cada campo es una tarjeta con su Tipo nombrado, la cantidad pasa al título de la lista, y elegir el
  tipo o el catálogo va a pantalla completa en lugar de la hoja, y «Obligatorio» de un campo nuevo va apagado con su motivo en el
  tooltip, como en la compu. En «Solo lectura», el largo va en su renglón.

Las piezas son las de la segunda parte de la base (`base2_comun.py`) y la forma, la de `e12_opciones_1004.py`. El CSS va en un bloque
`<style data-e13="t2">` con las medidas de antes de la escala; después corre `traspaso10_piezas_1004.py --tableros` con estos seis,
que pone la escala de la compu. No se puede volver a correr sobre un tablero ya pasado: frena si encuentra el bloque.
"""
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import acciones_asistente_1004 as acc  # noqa: E402
import base2_comun as b  # noqa: E402
import e12_opciones_1004 as e12  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
BLOQUE = 'data-e13="t2"'
PARA_APROBAR = " · para aprobar"
TABLEROS = ["FRM-Catalogo-Opciones-13", "M-FRM-Catalogo-Opciones-13", "FRM-Catalogo-Ordenar-13", "M-FRM-Catalogo-Ordenar-13",
            "FRM-Catalogo-Campos", "M-FRM-Catalogo-Campos"]


def lineas_tip(css):
    return "\n".join(l for l in css.splitlines() if l.startswith((".acc-tip {", ".acc-tip::after")))


ABIERTA = """
/* E13 · Con la pieza abierta, el modal deja ver su lista entera. */
.w-dlg.md:has(.b2-pkl), .w-dlg.md:has(.b2-pkl) .md-op { overflow: visible; }
"""

CSS_OPCIONES = e12.CSS_COMPU + ABIERTA

CSS_CAMPOS = b.CSS_B2 + lineas_tip(acc.CSS_COMPU) + ABIERTA + """
/* E13 · La lista del modal de campos: el número, el nombre, «Nuevo» y el tipo, cada uno en su columna (263); ↑ ↓ en el elegido. */
.w-dlg.md .db { grid-template-columns: 380px minmax(0, 1fr); }
.md-it.e13c { display: grid; grid-template-columns: 20px minmax(0, 1fr) 44px 116px 42px; align-items: center; column-gap: 10px; }
.md-it.e13c .tx { flex-direction: row; align-items: center; }
.md-it.e13c .mc .md-nueva { margin-left: 0; }
.md-it.e13c .tp { font-size: 12.5px; line-height: 1.3; color: var(--t2); }
.md-it.e13c .md-fle { justify-self: end; }
"""

CSS_ORDENAR = b.CSS_B2

CSS_TEL = e12.CSS_TEL + lineas_tip(acc.CSS_TEL) + "\n"

CSS_CAMPOS_TEL = CSS_TEL + """
/* E13 · «Obligatorio» de un campo nuevo, apagado con su motivo en un tooltip que se abre con un toque, como en la compu (211). */
.t-chk.apag { position: relative; color: var(--t3); }
.t-chk.apag i { border-color: var(--borde); background: var(--s3); }
.t-chk.apag .acc-tip { left: -3px; }
"""


# ---------------------------------------------------------------------------------------------------------------- comunes
def leer(nombre):
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    assert "\r\n" not in t, nombre
    assert BLOQUE not in t, f"{nombre} ya tiene el bloque de la E13"
    return t


def escribir(nombre, t, css):
    t = t.replace("</helmet>", f"<style {BLOQUE}>\n{css}</style>\n</helmet>", 1)
    t, n = re.subn(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1)}{PARA_APROBAR}</title>", t, count=1)
    assert n == 1 and PARA_APROBAR + PARA_APROBAR not in t, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8", newline="")
    print("ok", nombre, len(t))


def sc_if(t, var, contiene=None):
    """(inicio del cuerpo, fin del cuerpo) del `sc-if` de `var` que tiene `contiene`, aunque tenga otros adentro."""
    for m in re.finditer(r'<sc-if value="\{\{' + var + r'\}\}"[^>]*>', t):
        prof = 1
        for mm in re.finditer(r"<sc-if\b|</sc-if>", t[m.end():]):
            prof += -1 if mm.group(0) == "</sc-if>" else 1
            if prof == 0:
                fin = m.end() + mm.start()
                break
        if contiene is None or contiene in t[m.end():fin]:
            return m.end(), fin
    raise AssertionError(f"sin el sc-if de {var} con {contiene!r}")


def en_estado(t, var, cambio, contiene=None):
    i, e = sc_if(t, var, contiene)
    nuevo = cambio(t[i:e])
    assert nuevo != t[i:e], f"el cambio no encontró nada en {var}"
    return t[:i] + nuevo + t[e:]


def subn(rx, fn, t, esperadas):
    t, n = rx.subn(fn, t)
    assert n == esperadas, (rx.pattern[:60], n, esperadas)
    return t


# ---------------------------------------------------------------------------------------------------------------- opciones
ZONAS = ["Capital", "Gran Buenos Aires", "Interior", "Litoral", "Patagonia"]
ZONA = re.compile(r'(<div class="md-f"><span class="rt">Zona <span class="req">\*</span></span><span class="ctl">)'
                  r'<span class="k-in sel(?P<ph> ph)?"><span>(?P<v>[^<]*)</span><svg.*?</svg></span>', re.S)
ESTADO_CERRADO = f'<div class="e12-pk" style="max-width: 240px;">{b.campo("Activa", aria="Estado")}</div>'
ESTADO_ABIERTO = ('<div class="e12-pk" style="max-width: 240px;">'
                  + b.campo("Activa", abierto=True, aria="Estado", extra=b.lista([b.op("Activa", elegida=True, activa=True), b.op("De baja")]))
                  + "</div>")


def zona_baja(m):
    """La guardada, dada de baja, primero y con su tilde (como las elegidas de otra página, Criterio-Elegir); después, las activas."""
    ops = [b.op("Cuyo", "De baja", elegida=True, activa=True)] + [b.op(z, sep=k == 0) for k, z in enumerate(ZONAS)]
    lst = b.lista(ops, buscar="", cantidad=f"{len(ZONAS)} opciones")
    return m.group(1) + b.campo(m.group("v"), abierto=True, aria="Zona", extra=lst)


def zona(m):
    return m.group(1) + b.campo(m.group("v"), vacio=bool(m.group("ph")), aria="Zona")


def opciones():
    t = leer("FRM-Catalogo-Opciones-13")
    t = subn(e12.FILA_MD, e12.fila_md, t, 16)
    t = subn(e12.SEG_ESTADO, e12.estado_cerrado, t, 3)
    t = en_estado(t, "s3", lambda x: ZONA.sub(zona_baja, x, count=1))
    t = subn(ZONA, zona, t, 3)
    t = e12.copiar_estado(t, "s0", "s4", lambda x: x.replace(ESTADO_CERRADO, ESTADO_ABIERTO, 1))
    t = e12.sumar_estado(t, "Elegir el estado", "Editar una opción", "s4")
    escribir("FRM-Catalogo-Opciones-13", t, CSS_OPCIONES)


ZONA_TEL = re.compile(r'<div class="ct (?P<ph>ph )?sel">(?P<v>Gran Buenos Aires|Elegí una zona)<svg.*?</svg></div>', re.S)


def opciones_tel():
    t = leer("M-FRM-Catalogo-Opciones-13")
    t = subn(e12.FILA_TEL, e12.fila_tel, t, 10)
    t = subn(e12.SEL_ESTADO_TEL, lambda m: b.campo(m.group(1), aria="Estado"), t, 2)
    t = subn(ZONA_TEL, lambda m: b.campo(m.group("v"), vacio=bool(m.group("ph")), aria="Zona"), t, 3)
    hoja = b.pk_tel("Estado", [("Activa", None, True, None), ("De baja", None, False, None)])
    t = e12.copiar_estado(t, "s3", "s5", lambda x: x[:-len("</sc-if>")] + hoja + "</sc-if>")
    t = e12.sumar_estado(t, "Elegir el estado", "Una opción guardada", "s5")
    escribir("M-FRM-Catalogo-Opciones-13", t, CSS_TEL)


# ---------------------------------------------------------------------------------------------------------------- ordenar
COLUMNA = re.compile(r'<span class="t2-env"><span class="t2-sel(?P<ab> t2-abierto)?" role="combobox" aria-label="Columna" aria-expanded="\w+">'
                     r'<span>(?P<v>[^<]*)</span><svg.*?</svg></span>(?P<lista><div class="t2-lista".*?</div>)?</span>', re.S)
COLUMNA_TEL = re.compile(r'<span class="t2-hsel" role="combobox" aria-label="Columna" aria-expanded="\w+"><span>([^<]*)</span><svg.*?</svg></span>', re.S)
OP_LISTA = re.compile(r'<span class="t2-h?op[^"]*" role="option" aria-selected="\w+">(?:<span>)?([^<]*)')


def columna(m):
    v = m.group("v")
    if m.group("ab"):
        lst = b.lista([b.op(c, elegida=c == v, activa=c == v) for c in OP_LISTA.findall(m.group("lista"))])
        return b.campo(v, abierto=True, aria="Columna", extra=lst)
    return b.campo(v, aria="Columna")


def orden(m, clase):
    return f'<div class="{clase}">{m.group("rt")}{b.campo(e12.elegido(m.group("rds")), aria="Orden")}</div>'


def ordenar():
    t = leer("FRM-Catalogo-Ordenar-13")
    t = subn(COLUMNA, columna, t, 6)
    t = subn(e12.ORDEN, lambda m: orden(m, "t2-campo"), t, 6)
    escribir("FRM-Catalogo-Ordenar-13", t, CSS_ORDENAR)


def ordenar_tel():
    t = leer("M-FRM-Catalogo-Ordenar-13")
    t = subn(COLUMNA_TEL, lambda m: b.campo(m.group(1), aria="Columna"), t, 5)
    t = subn(e12.ORDEN_TEL, lambda m: orden(m, "t2-hcampo"), t, 5)
    # «Elegir la columna»: la hoja que solo servía para elegir pasa a ser «Ordenar las opciones» con la pieza a pantalla completa.
    i, e = sc_if(t, "s0", 'aria-label="Columna" data-t15t2="ordenar"')
    columnas = OP_LISTA.findall(t[i:e])
    assert columnas[:2] == ["Texto", "Código"] and len(columnas) == 8, columnas
    i1, e1 = sc_if(t, "s1", 'aria-label="Ordenar las opciones" data-t15t2="ordenar"')
    rubro = b.campo("Rubro", aria="Columna")
    assert t[i1:e1].count(rubro) == 1
    hoja = t[i1:e1].replace(rubro, b.campo("Texto", aria="Columna"), 1)
    pk = b.pk_tel("Columna", [(c, None, c == "Texto", None) for c in columnas])
    t = t[:i] + hoja + pk + t[e:]
    escribir("M-FRM-Catalogo-Ordenar-13", t, CSS_TEL)


# ---------------------------------------------------------------------------------------------------------------- campos
TIPOS = ["Texto", "Número entero", "Número con decimales", "Fecha", "Sí/No", "De un catálogo"]
CATALOGOS = [("Motivos de visita", "3 opciones"), ("Productos", "10 opciones"), ("Proveedores", "1.097 opciones"),
             ("Recargo por zona", "6 opciones"), ("Tipos de producto", "12 opciones"), ("Zonas", "6 opciones")]
ESTE = "Es este catálogo: un campo toma los valores de otro."
OPCIONAL = "Un campo nuevo nace opcional: para hacerlo obligatorio, todas las opciones activas necesitan un valor."

FILA_CAMPO = re.compile(r'<div class="md-it(?P<cls>[^"]*)" role="option" aria-selected="(?P<sel>\w+)"><span class="num">(?P<num>[^<]*)</span>'
                        r'<span class="tx"><b>(?P<txt>.*?)</b><small>(?P<tipo>[^<]*)</small></span>(?P<fle><span class="md-fle">.*?</span>)?</div>', re.S)
MN = r'(?P<mn><span class="f-mn" role="listbox" aria-label="[^"]*">(?:<span[^>]*>[^<]*</span>)*</span>)?'
TIPO = re.compile(r'<span class="k-in sel(?: foco)?" role="combobox" aria-label="Tipo" aria-expanded="\w+"><span>(?P<v>[^<]*)</span><svg.*?</svg></span>' + MN, re.S)
CATALOGO = re.compile(r'<span class="k-in sel(?: foco)?" role="combobox" aria-expanded="\w+" aria-label="Catálogo"><span>(?P<v>[^<]*)</span>'
                      r'<svg.*?</svg></span>' + MN, re.S)
LEE_TIPO = ('<div class="md-f"><span class="rt">Tipo</span><span class="ctl"><span class="lee">Texto<small>hasta 13 caracteres</small></span></span></div>')
LEE_TIPO_NUEVO = ('<div class="md-f"><span class="rt">Tipo</span><span class="ctl"><span class="lee">Texto</span></span></div>'
                  '<div class="md-f junto"><span class="rt">Largo</span><span class="ctl"><span class="lee">Hasta 13 caracteres</span></span></div>')


def fila_campo(m):
    txt, marca = m.group("txt"), ""
    if '<span class="md-nueva">Nuevo</span>' in txt:
        txt, marca = txt.replace('<span class="md-nueva">Nuevo</span>', ""), '<span class="md-nueva">Nuevo</span>'
    # «CUIT» es un texto en todos los estados: en «Un número» decía «Número entero» por un reemplazo de más.
    tipo = "Texto" if txt == "CUIT" else m.group("tipo")
    return (f'<div class="md-it e13c{m.group("cls")}" role="option" aria-selected="{m.group("sel")}"><span class="num">{m.group("num")}</span>'
            f'<span class="tx"><b>{txt}</b></span><span class="mc">{marca}</span><span class="tp">{tipo}</span>{m.group("fle") or ""}</div>')


def tipo(m):
    v = m.group("v")
    if m.group("mn"):
        return b.campo(v, abierto=True, aria="Tipo", extra=b.lista([b.op(x, elegida=x == v, activa=x == v) for x in TIPOS]))
    return b.campo(v, aria="Tipo")


def catalogo(m):
    """Cerrada, el catálogo elegido; abierta, la lista del servidor con el buscador adentro y la cantidad (Criterio-Elegir)."""
    v = m.group("v")
    if not m.group("mn"):
        return b.campo("Zonas", aria="Catálogo")
    if v == "zorro":
        lst = b.lista([], buscar="zorro", msj="Ningún catálogo coincide con «zorro».")
    else:
        buscar = "" if v.startswith("Zonas") else v
        cats = [(n, d) for n, d in CATALOGOS if buscar.lower() in n.lower()]
        ops = [b.op(n, d, elegida=n == "Zonas", activa=n == "Zonas", apagada=ESTE if n == "Proveedores" else None, tip_abierto=True)
               for n, d in cats]
        lst = b.lista(ops, buscar=buscar, cantidad=f"{len(cats)} catálogo{'s' if len(cats) > 1 else ''}")
    return b.campo("Zonas", abierto=True, aria="Catálogo", extra=lst)


def campos():
    t = leer("FRM-Catalogo-Campos")
    t = subn(FILA_CAMPO, fila_campo, t, 27)
    t = subn(TIPO, tipo, t, 11)
    t = subn(CATALOGO, catalogo, t, 4)
    assert t.count(LEE_TIPO) == 1
    t = t.replace(LEE_TIPO, LEE_TIPO_NUEVO, 1)
    escribir("FRM-Catalogo-Campos", t, CSS_CAMPOS)


FILA_CAMPO_TEL = re.compile(r'<div class="q-row"><span class="num">(?P<num>\d+)</span><span class="tx"><b>(?P<txt>[^<]*)</b><span>(?P<tipo>[^<]*)</span></span></div>')
TIPO_TEL = re.compile(r'(<div class="ap-cmp"><span class="rt"><span>Tipo <span class="rq">\*</span></span></span>)<div class="ct sel">([^<]*)<svg.*?</svg></div>', re.S)
CATALOGO_TEL = re.compile(r'<div class="ct sel">Zonas · 6 opciones<svg.*?</svg></div>', re.S)


def campos_tel():
    t = leer("M-FRM-Catalogo-Campos")
    t = subn(FILA_CAMPO_TEL, lambda m: b.tarjeta(m.group("txt"), [("Tipo", m.group("tipo"))], av=f'<span class="num">{m.group("num")}</span>'), t, 2)
    # La cantidad va en el título de la lista, «Campos · 2 de 20», y no debajo del título de la pantalla (263).
    viejo = '<span class="sub">Proveedores · 2 de 20</span></div></div><div class="ap-cuerpo"><div class="ap-gtit">Campos<a href="#">'
    assert t.count(viejo) == 1
    t = t.replace(viejo, '<span class="sub">Proveedores</span></div></div><div class="ap-cuerpo"><div class="ap-gtit">Campos · 2 de 20<a href="#">', 1)
    t = subn(TIPO_TEL, lambda m: m.group(1) + b.campo(m.group(2), aria="Tipo"), t, 6)
    t = subn(CATALOGO_TEL, lambda m: b.campo("Zonas", aria="Catálogo"), t, 3)
    # Elegir el catálogo y el tipo: la pieza a pantalla completa, en lugar de la hoja que solo servía para elegir (262).
    pk_cat = b.pk_tel("Catálogo", [(n, d, n == "Zonas", ESTE if n == "Proveedores" else None) for n, d in CATALOGOS], buscar="",
                      cantidad=f"{len(CATALOGOS)} catálogos", tip_en="Proveedores")
    pk_tipo = b.pk_tel("Tipo", [(x, None, x == "Texto", None) for x in TIPOS])
    for var, aria, pk in (("s3", 'aria-label="Catálogo"', pk_cat), ("s5", 'aria-label="Tipo"', pk_tipo)):
        i, e = sc_if(t, var, f'<div class="ap-hoja" role="dialog" {aria}>')
        t = t[:i] + pk + t[e:]
    # Un campo nuevo nace opcional (13-campos.md): «Obligatorio» apagado con su motivo, abierto en «Un campo nuevo» (en «Elegir el
    # tipo» lo tapa la pieza a pantalla completa).
    obligatorio = '<span class="t-chk"><i class="no"></i>Obligatorio</span>'
    for var, abierto in (("s4", True), ("s5", False)):
        apagado = (f'<span class="t-chk apag" role="checkbox" aria-checked="false"{acc.AD}><i class="no"></i>Obligatorio'
                   f'{b.tip(OPCIONAL) if abierto else ""}</span>')
        t = en_estado(t, var, lambda x: x.replace(obligatorio, apagado, 1), contiene="Nuevo campo")
    escribir("M-FRM-Catalogo-Campos", t, CSS_CAMPOS_TEL)


PASOS = dict(zip(TABLEROS, (opciones, opciones_tel, ordenar, ordenar_tel, campos, campos_tel)))

if __name__ == "__main__":
    # `--solo A,B` rehace solo esos tableros (restaurados antes desde HEAD) y pasa las piezas solo sobre ellos.
    elegidos = sys.argv[sys.argv.index("--solo") + 1].split(",") if "--solo" in sys.argv else TABLEROS
    assert all(n in PASOS for n in elegidos), elegidos
    for nombre in elegidos:
        PASOS[nombre]()
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(elegidos)], check=True)
