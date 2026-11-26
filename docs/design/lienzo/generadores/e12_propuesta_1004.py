"""La propuesta del asistente en el editor de un catálogo a mano (E12, §10 «Se dibujan antes del front» y §17; decisión 268 y ADR
0068): `catalogoptions.edit@1`, «Cambiar las opciones de un catálogo». La IA prepara y la persona confirma en la pantalla de siempre:
el editor abre con lo propuesto cargado sin guardar, se guarda con «Guardar cambios» y se descarta con «Descartar».

Escribe dos tableros nuevos:
- `FRM-Catalogo-Opciones-Propuesta` (compu): «Propuesta del asistente» junto al título; «Lo que cambia» con lo que se suma, cambia
  y quita (0068 §9, «editar»), arriba de todo, como en `Usuario-Propuesta` y `Rol-Propuesta`; en la tabla, las opciones nuevas sin
  número («—»), como las marca el editor, y la que se quita con «Se borra al guardar» y su ⋮ (261); «Revisá» en una opción dudosa,
  como el rol dudoso de `Usuarios-Invitar-Propuesta`; el aviso de que el catálogo cambió desde la propuesta, con lo que cambia
  contado sobre lo de ahora, como en `Usuario-Propuesta`; y, para la E13, la misma propuesta con la columna de un campo.
- `M-FRM-Catalogo-Opciones-Propuesta` (teléfono): los tres primeros estados, con «Lo que cambia» como en `M-Usuario-Propuesta`.

Parte del `FRM-Catalogo` y del `M-FRM-Catalogo` del commit `BASE` del front (la v184, antes del redibujo de la tanda 2), así otra
corrida da lo mismo aunque esos tableros cambien. Escribe las medidas de antes de la escala; después va
`traspaso10_piezas_1004.py --tableros FRM-Catalogo-Opciones-Propuesta,M-FRM-Catalogo-Opciones-Propuesta`. Se puede volver a correr.
No toca `canvas.json`.
"""
import json
import pathlib
import re
import subprocess
import sys

import acciones_asistente_1004 as acc

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
REPO = PROJ.parent.parent.parent
BASE = "6f55de5f"
MARCA = 'data-e12p="propuesta"'


def de_base(nombre):
    return subprocess.run(["git", "-C", str(REPO), "show", f"{BASE}:docs/design/lienzo/{nombre}.dc.html"],
                          capture_output=True, check=True).stdout.decode("utf-8").replace("\r\n", "\n")


# ---------------------------------------------------------------------------------------------------------------- sc-if
def fin_sc(t, i):
    prof = 0
    for m in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
        prof += 1 if m.group(0) == "<sc-if" else -1
        if prof == 0:
            return i + m.end()
    raise AssertionError("sc-if sin cerrar")


def bloques(t, var):
    out = []
    for m in re.finditer(r'<sc-if value="\{\{%s\}\}"[^>]*>' % re.escape(var), t):
        a = m.start()
        b = fin_sc(t, a)
        out.append(t[m.end():b - len("</sc-if>")])
    return out


def resolver(t, vals):
    while True:
        m = re.search(r'<sc-if value="\{\{(\w+)\}\}"[^>]*>', t)
        if not m:
            break
        a = m.start()
        b = fin_sc(t, a)
        t = t[:a] + (t[m.end():b - len("</sc-if>")] if vals[m.group(1)] else "") + t[b:]
    return re.sub(r"\{\{(\w+)\}\}", lambda mm: vals[mm.group(1)] if isinstance(vals[mm.group(1)], str) else "", t)


def partes(t):
    """La cabeza hasta `</helmet>`, el marco de antes y de después de los estados, y los estados enteros."""
    h = t.index("</helmet>")
    i = t.index('<script type="text/x-dc"')
    cuerpo = t[h + len("</helmet>"):i]
    tramos = []
    for m in re.finditer(r'<sc-if value="\{\{s\d+\}\}"[^>]*>', cuerpo):
        if tramos and m.start() < tramos[-1][1]:
            continue
        tramos.append((m.start(), fin_sc(cuerpo, m.start())))
    return t[:h], cuerpo[:tramos[0][0]], cuerpo[tramos[-1][1]:], cuerpo, tramos


def una_vez(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:140])
    return t.replace(viejo, nuevo)


def svg_tras(t, etiqueta):
    a = t.index(f'aria-label="{etiqueta}"')
    x = t.index("<svg", a)
    return t[x:t.index("</svg>", x) + len("</svg>")]


def sc_if(i, cuerpo):
    return '<sc-if value="{{e%d}}" hint-placeholder-val="{{%s}}">%s</sc-if>' % (i, "si" if i == 0 else "no", cuerpo)


def tablero(cab, titulo, css, plantilla, estados, ancho, alto):
    cab = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", cab, count=1)
    cab = re.sub(r'<style data-t10="piezas">.*?</style>\n?', "", cab, flags=re.S)
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"},
             "$preview": {"width": ancho, "height": alto}}
    texto_props = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto_props
    vals = ", ".join(f"e{i}: k === {i}" for i in range(len(estados)))
    guion = (f"<script type=\"text/x-dc\" data-dc-script data-props='{texto_props}'>\n"
             "class Component extends DCLogic {\n"
             "  renderVals() {\n"
             f"    const k = {json.dumps(estados, ensure_ascii=False)}.indexOf(this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)});\n"
             f"    return {{ si: true, no: false, {vals} }};\n"
             "  }\n"
             "}\n"
             "</script>\n</body>\n</html>\n")
    assert "{{" not in re.sub(r"\{\{(e\d+|si|no)\}\}", "", plantilla), "una variable sin valor en la plantilla"
    return f"{cab}<style {MARCA}>\n{css}</style>\n</helmet>{plantilla}\n{guion}"


# ---------------------------------------------------------------------------------------------------------------- los datos
NOMBRE = "Motivos de visita"
# Lo guardado al abrir: texto, código, detalle y, para la E13, el campo «Área».
GUARDADAS = [("Seguimiento", "SEG", "Visita programada a un cliente actual", "Comercial"),
             ("Venta nueva", "VEN", "Primera visita a un cliente", "Comercial"),
             ("Venta mayorista", "VMA", "Visita a un cliente que compra por mayor", "Comercial"),
             ("Reclamo", "REC", "Hay un problema para resolver", "Técnica")]
# Lo que propone el asistente: suma dos, cambia el detalle de una y quita otra.
SUMA = [("Garantía", "GAR", "Revisar un equipo en garantía", "Técnica"),
        ("Instalación", "INS", "Instalar un equipo vendido", "Técnica")]
CAMBIA = {"Venta nueva": "Primera visita a un cliente nuevo"}
QUITA = {"Reclamo"}
DUDA = "Hay dos opciones parecidas: Venta nueva y Venta mayorista."
AVISO_CAMBIO = f"El catálogo {NOMBRE} cambió desde la propuesta."  # otra persona ya quitó «Reclamo»

ESTADOS = ["Propuesta cargada", "Una opción para revisar", "El catálogo cambió desde la propuesta", "Con la columna de un campo"]
M_ESTADOS = ESTADOS[:3]

CSS_PROPIO = """
/* La propuesta en el editor de un catálogo (268): «Lo que cambia» arriba de todo, «Revisá» en la celda dudosa, con su motivo
   debajo como el error de una celda, y la columna de un campo de la E13. */
.w-body > .acc-av, .w-body > .acc-cambia { margin-bottom: 16px; }
.acc-cambia .acc-tabla .f > span { overflow-wrap: anywhere; }
.acc-cambia .acc-rev { margin-left: 8px; vertical-align: 1px; }
.k-in.acc-duda { border-color: oklch(0.72 0.15 70); box-shadow: inset 0 0 0 1px oklch(0.72 0.15 70); }
.k-in.acc-duda .acc-rev { margin-left: auto; margin-right: 8px; }
.k-tab .acc-dudam { white-space: normal; }
.w-th.ke.acc-kz, .w-tr.ke.acc-kz { grid-template-columns: 28px 30px minmax(192px, 1.25fr) 96px 128px minmax(192px, 1.35fr) 56px 172px; }
.w-app { height: 1320px !important; }
"""

CSS_PROPIO_TEL = """
/* La propuesta en el editor de un catálogo, en el teléfono (268): «Lo que cambia» arriba, como en la ficha de una persona. */
.ap-cuerpo > .acc-av { margin: 12px 16px 0; }
.q-row .tx .acc-dudam { display: block; margin-top: 4px; color: var(--alerta); font-size: 14px; line-height: 1.4; }
.q-row .tx .acc-dudam .acc-rev { margin-right: 6px; color: var(--alerta); font-size: 11.5px; }
.q-row .tx > .q-el { color: var(--peligro); }
"""


# ---------------------------------------------------------------------------------------------------------------- la compu
def compu():
    t = de_base("FRM-Catalogo")
    cab, antes, despues, cuerpo, _ = partes(t)
    vals = {"si": True, "no": False, "menuMas": False, "expMas": "false", "chkTodas": "", "pvCerrado": True, "pvAbierto": False,
            "pvMuchas": False, "pvUna": "on", "pvVarias": "", "busqueda": "Buscar opción", "busClase": ""}
    for n in range(30):
        vals[f"s{n}"] = n == 7  # «Se borra al guardar»: con cambios e Importar apagado con su motivo
    banda, cuerpo7 = [resolver(b, vals) for b in bloques(cuerpo, "s7")[:2]]
    antes, despues = resolver(antes, vals), resolver(despues, vals)
    rol = leer_tablero("Rol-Propuesta")
    spark = acc.spark(rol[rol.index('<span class="acc-prop">'):])
    banda = una_vez(banda, f"<h1>{NOMBRE}</h1>",
                    f'<div class="acc-tit"><h1>{NOMBRE}</h1><span class="acc-prop">{spark}Propuesta del asistente</span></div>')
    keb = svg_tras(banda, f"Acciones de {NOMBRE}")
    sv = {k: svg_tras(cuerpo7, f"{k} Seguimiento") for k in ("Subir", "Bajar", "Editar", "Borrar")}
    tilde = svg_tras(cuerpo7, "Activa: Seguimiento")

    def boton(accion, texto, motivo=None):
        extra = f' aria-disabled="true" title="{motivo}"' if motivo else ""
        return f'<button type="button" class="ib" aria-label="{accion} {texto}"{extra}>{sv[accion]}</button>'

    def fila(num, texto, cod, det, area, campo, nueva=False, borrar=False, duda=False):
        clase = "w-tr ke" + (" acc-kz" if campo else "") + (" borrar" if borrar else "")
        chip = f'<span class="acc-rev">{acc.SVG_REV}Revisá</span>' if duda else ""
        dudam = f'<span class="acc-dudam" role="status">{DUDA}</span>' if duda else ""
        celda_txt = (f'<span class="k-tab fx fx-c"><span class="k-in{" acc-duda" if duda else ""}"><span>{texto}</span>{chip}'
                     f'<small>{len(texto)}/30</small></span>{dudam}</span>')
        celda_area = f'<span class="k-tab"><span class="k-in"><span>{area}</span></span></span>' if campo else ""
        mover = "Guardá la opción para poder moverla." if nueva else "Guardá o descartá el borrado pendiente para mover opciones."
        if borrar:
            acciones = (f'<span class="k-el">Se borra al guardar</span><button type="button" class="ib" aria-label="Más acciones de {texto}" '
                        f'aria-haspopup="menu" aria-expanded="false">{keb}</button>')
            activa = (f'<span class="k-chk on ro" role="checkbox" aria-checked="true" aria-label="Activa: {texto}" aria-disabled="true">'
                      f'{tilde}</span>')
        else:
            quitar = "Quitar" if nueva else "Borrar"
            acciones = (boton("Subir", texto, mover) + boton("Bajar", texto, mover) + boton("Editar", texto)
                        + f'<button type="button" class="ib" aria-label="{quitar} {texto}">{sv["Borrar"]}</button>')
            activa = f'<span class="k-chk on" role="checkbox" aria-checked="true" aria-label="Activa: {texto}">{tilde}</span>'
        return (f'<div class="{clase}"><span class="fx fx-a"><span class="k-chk" role="checkbox" aria-checked="false"></span></span>'
                f'<span class="gris fx fx-b">{num}</span>{celda_txt}'
                f'<span class="k-tab"><span class="k-in mono"><span>{cod}</span></span></span>{celda_area}'
                f'<span class="k-tab"><span class="k-in"><span>{det}</span></span></span><span>{activa}</span>'
                f'<span class="fx fx-d der"><span class="k-acc">{acciones}</span></span></div>')

    def tabla(cambio_ajeno=False, duda=False, campo=False):
        filas, n = [], 0
        for texto, cod, det, area in GUARDADAS:
            if cambio_ajeno and texto in QUITA:
                continue  # otra persona ya la quitó
            n += 1
            filas.append(fila(n, texto, cod, CAMBIA.get(texto, det), area, campo, borrar=texto in QUITA,
                              duda=duda and texto in CAMBIA))
        for texto, cod, det, area in SUMA:
            filas.append(fila("—", texto, cod, det, area, campo, nueva=True))
        return filas

    i = cuerpo7.index('<div class="w-th ke">')
    j = cuerpo7.index("</div>", i) + len("</div>")
    k = cuerpo7.index('</div></div><div class="w-pie">')
    cab_tabla = cuerpo7[i:j]
    cab_campo = una_vez(cab_tabla, '<div class="w-th ke">', '<div class="w-th ke acc-kz">')
    cab_campo = una_vez(cab_campo, "<span>Código</span>", "<span>Código</span><span>Área</span>")

    def cambia_caja(cambio_ajeno=False, duda=False):
        rev = f'<span class="acc-rev">{acc.SVG_REV}Revisá</span>' if duda else ""
        suma = ", ".join(s[0] for s in SUMA)
        cambia = ", ".join(f"Detalle de {c}" for c in CAMBIA) + rev
        quita = "—" if cambio_ajeno else ", ".join(sorted(QUITA))
        caja = acc.tabla_cambia(["Se suma", "Cambia", "Se quita"], [[suma, cambia, quita]],
                                "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)")
        return una_vez(caja, '<div class="w-caja o-abre acc-cambia"><div class="w-cab"><span>Lo que cambia</span></div>',
                       '<div class="w-caja acc-cambia"><div class="f-cab"><span>Lo que cambia</span></div>')

    def cuerpo_estado(cambio_ajeno=False, duda=False, campo=False):
        filas = tabla(cambio_ajeno, duda, campo)
        c = cuerpo7[:i] + (cab_campo if campo else cab_tabla) + "".join(filas) + cuerpo7[k:]
        total = len(filas)
        c = una_vez(c, "<span>1–4 de 4</span>", f"<span>1–{total} de {total}</span>")
        if campo:
            c = una_vez(c, 'style="min-width: 852px;"', 'style="min-width: 990px;"')
        franja = f'<div class="acc-av aten" role="status">{acc.SVG_ATEN}<span>{AVISO_CAMBIO}</span></div>' if cambio_ajeno else ""
        return una_vez(c, '<div class="w-body">', '<div class="w-body">' + franja + cambia_caja(cambio_ajeno, duda))

    cuerpos = [cuerpo_estado(), cuerpo_estado(duda=True), cuerpo_estado(cambio_ajeno=True), cuerpo_estado(campo=True)]
    plantilla = antes + "".join(sc_if(n, banda + c) for n, c in enumerate(cuerpos)) + despues
    return tablero(cab, "Formularios · cambiar las opciones de un catálogo · propuesta del asistente",
                   acc.CSS_COMPU + CSS_PROPIO, plantilla, ESTADOS, 1440, 1320)


# ---------------------------------------------------------------------------------------------------------------- el teléfono
def telefono():
    t = de_base("M-FRM-Catalogo")
    cab, antes, despues, cuerpo, tramos = partes(t)
    vals = {"si": True, "no": False}
    for n in range(10):
        vals[f"s{n}"] = n == 1  # «Con cambios»: «Guardar cambios» prendido
    estado1 = resolver(bloques(cuerpo, "s1")[0], vals)
    # Entre los estados de la pantalla y sus hojas va la raya de abajo: se conserva, sin las hojas.
    raya = '<span class="ap-raya"></span>'
    assert cuerpo.count(raya) == 1
    m_rol = leer_tablero("M-Rol-Propuesta")
    spark = acc.spark(m_rol[m_rol.index('<span class="sub acc-prop">'):])
    estado1 = una_vez(estado1, '<span class="sub">Activo</span>', f'<span class="sub acc-prop">{spark}Propuesta del asistente</span>')
    keb = svg_tras(estado1, "Más acciones")
    sv = {k: svg_tras(estado1, f"{k} Venta nueva") for k in ("Subir", "Bajar", "Editar", "Borrar")}
    g0 = estado1.index('<div class="ap-gtit">Opciones')
    g1 = estado1.index('<div class="ap-grupo">', g0) + len('<div class="ap-grupo">')
    g2 = estado1.index('</div><div style="height: 20px;"></div></div><div class="ap-fijo">')

    def boton(accion, texto, motivo=None):
        extra = f' aria-disabled="true" title="{motivo}"' if motivo else ""
        return f'<button type="button" class="ap-ib" aria-label="{accion} {texto}"{extra}>{sv[accion]}</button>'

    def fila(num, texto, nueva=False, borrar=False, duda=False):
        # Sin el código debajo del nombre (263: en el teléfono, menos datos); el código se ve al tocar ✎.
        if borrar:
            return (f'<div class="q-row borrar"><span class="num">{num}</span><span class="tx"><b>{texto}</b>'
                    f'<span class="q-el">Se borra al guardar</span></span><span class="q-acc"><button type="button" class="ap-ib" '
                    f'aria-label="Más acciones de {texto}" aria-haspopup="menu" aria-expanded="false">{keb}</button></span></div>')
        dudam = f'<span class="acc-dudam" role="status"><span class="acc-rev">{acc.SVG_REV}Revisá</span>{DUDA}</span>' if duda else ""
        mover = "Guardá la opción para poder moverla." if nueva else "Guardá o descartá el borrado pendiente para mover opciones."
        quitar = "Quitar" if nueva else "Borrar"
        return (f'<div class="q-row"><span class="num">{num}</span><span class="tx"><b>{texto}</b>{dudam}</span><span class="q-acc">'
                + boton("Subir", texto, mover) + boton("Bajar", texto, mover) + boton("Editar", texto)
                + f'<button type="button" class="ap-ib" aria-label="{quitar} {texto}">{sv["Borrar"]}</button></span></div>')

    def it(k, v):
        return f'<div class="ap-it "><span class="tx"><b>{k}</b><span>{v}</span></span></div>'

    def estado(cambio_ajeno=False, duda=False):
        filas, n = [], 0
        for texto, _, _, _ in GUARDADAS:
            if cambio_ajeno and texto in QUITA:
                continue
            n += 1
            filas.append(fila(n, texto, borrar=texto in QUITA, duda=duda and texto in CAMBIA))
        filas += [fila("—", s[0], nueva=True) for s in SUMA]
        c = estado1[:g1] + "".join(filas) + estado1[g2:]
        rev = f'<span class="acc-rev">{acc.SVG_REV}Revisá</span>' if duda else ""
        grupo = [it("Se suma", ", ".join(s[0] for s in SUMA)), it("Cambia", ", ".join(f"Detalle de {x}" for x in CAMBIA) + rev)]
        if not cambio_ajeno:
            grupo.append(it("Se quita", ", ".join(sorted(QUITA))))
        cambia = '<div class="ap-gtit">Lo que cambia</div><div class="ap-grupo">' + "".join(grupo) + "</div>"
        franja = (f'<div class="acc-av aten acc-tel-av" role="status">{acc.SVG_ATEN}<span>{AVISO_CAMBIO}</span></div>'
                  if cambio_ajeno else "")
        return una_vez(c, '<div class="ap-cuerpo">', '<div class="ap-cuerpo">' + franja + cambia)

    cuerpos = [estado(), estado(duda=True), estado(cambio_ajeno=True)]
    plantilla = antes + "".join(sc_if(n, c) for n, c in enumerate(cuerpos)) + raya + despues
    return tablero(cab, "Cambiar las opciones de un catálogo · propuesta del asistente · teléfono",
                   acc.CSS_TEL + CSS_PROPIO_TEL, plantilla, M_ESTADOS, 390, 844)


def leer_tablero(nombre):
    return (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")


def main():
    for nombre, hacer in (("FRM-Catalogo-Opciones-Propuesta", compu), ("M-FRM-Catalogo-Opciones-Propuesta", telefono)):
        t = hacer()
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8", newline="\n")
        print("ok", nombre, len(t))


if __name__ == "__main__":
    main()
