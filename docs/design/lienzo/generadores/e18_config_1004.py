"""La Configuración de Formularios de la E18 (decisión 270), nueva, con el traspaso 18, tanda 3 (2026-11-26): `FRM-Config-Org`,
`M-FRM-Config-Org` y `FRM-Config-Plat` (spec `docs/plans/formularios/18-fotos-y-documentos.md` y su parte, «Contrato» y «Datos»).

- **Dónde:** donde está la del asistente, en «Administración › Formularios › Configuración», en la organización y en Plataforma. Se
  parte del marco de `Asistente-Config-Org`, `M-Asistente-Config-Org` y `Plat-Asistente-Config` (el menú lateral con «Administración»,
  la banda con «Descartar cambios» y «Guardar cambios», y la caja con su grilla de dos), y se dibuja un valor con su máximo de la
  plataforma como «Tiempo para contestar un formulario» de `WA-Config-Base2` y `Config-Plat-Base2`: el número, la unidad, su (i) con
  el mínimo y el máximo, el error debajo y el 409 de la página. En el menú, «Formularios» va después de «Asistente» y antes de
  «Auditoría» (en Plataforma, al final), abierto con su «Configuración»; «Asistente» queda plegado.
- **La organización** (`forms.manage`): «Tamaño máximo de un archivo», 10 MB, de 1 a 25 y nunca más que el máximo de la plataforma,
  que se ve a su lado, de solo lectura, con su (i). Si la plataforma bajó su máximo por debajo de lo guardado, vale el menor y la
  página lo dice, sin tocar lo guardado (270 y spec). El error es `Forms.Settings.Invalid` («Elegí un tamaño entre 1 y 25 MB.»).
- **Plataforma** (`platform.settings.manage`): «Tamaño máximo de un archivo», 25 MB, de 1 a 25: ninguna organización lo pasa; al bajarlo,
  la página dice qué pasa con las que guardaron más.
- **El 409:** otra persona guardó antes; la franja lo dice y ofrece «Volver a leer» (concurrencia).
- **Sin permiso** (211): el campo apagado, con el motivo en el tooltip sobre el control (en el teléfono, abierto con un toque), y sin
  los botones de guardar.

Escribe los tres tableros desde cero (con el bloque `<style data-e18="t3">` y « · para aprobar» en el título) y corre
`traspaso10_piezas_1004.py --tableros` con los tres, que pone la escala de la compu. No toca `canvas.json`: los tableros nuevos se
registran a mano (la compu, 1440 × 900; el teléfono, 390 × 844).
"""
import json
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
from base2_config_1004 import CSS_CONFIG, SIN_PERMISO, cmp_tel  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-e18="t3"'
SUFIJO = " · para aprobar"
SVG = r"<svg\b[^>]*>.*?</svg>"
TABLEROS = ["FRM-Config-Org", "M-FRM-Config-Org", "FRM-Config-Plat"]

# ---------------------------------------------------------------------------------------------------------------- los textos
CAJA = "Archivos de las respuestas"
ROTULO = "Tamaño máximo de un archivo"
ROTULO_PLAT = "Máximo de la plataforma"


def ayuda_org(maximo):
    return (f"De 1 a 25 MB, y nunca más que el máximo de la plataforma ({maximo} MB). Es el tope de cada foto y cada documento que llega "
            "en una respuesta; el editor lo dice en «Cuántas fotos» y «Cuántos documentos». Una versión ya publicada conserva el tamaño "
            "con el que se publicó.")


AYUDA_MAX = "Lo fija la plataforma. Si lo baja, vale el menor de los dos, sin cambiar lo que guardaste."
AYUDA_PLAT = ("De 1 a 25 MB. Ninguna organización puede pasarlo: si lo bajás, en cada una vale el menor de los dos, sin cambiar lo que "
              "guardó. Una versión ya publicada conserva el tamaño con el que se publicó.")


def error(maximo):
    return f"Elegí un tamaño entre 1 y {maximo} MB."  # Forms.Settings.Invalid, con el máximo como parámetro (270)


CONFLICTO = "Otra persona guardó la Configuración de Formularios mientras la editabas."
BAJO = "Hoy vale 15 MB, el máximo de la plataforma. Si la plataforma lo sube, vuelve a valer lo que guardaste."
AL_BAJAR = ("Al guardarlo, las organizaciones que guardaron más de 15 MB pasan a usar 15 MB, sin cambiar lo que guardaron. Lo ya publicado "
            "conserva el suyo.")

# (valor, máximo de la plataforma, error, aviso, con cambios, franja del 409, sin permiso, la (i) abierta)
ORG = {
    "Sin cambios": dict(v=10, m=25),
    "La (i) del tamaño": dict(v=10, m=25, i=True),
    "Con cambios": dict(v=15, m=25, cambios=True),
    "Fuera de rango": dict(v=30, m=25, err=error(25), cambios=True),
    "La plataforma bajó su máximo": dict(v=20, m=15, aviso=BAJO),
    "Otra persona cambió la configuración": dict(v=15, m=25, conflicto=True),
    "Sin permiso": dict(v=10, m=25, ro=True),
}
PLAT = {
    "Sin cambios": dict(v=25),
    "La (i) del máximo": dict(v=25, i=True),
    "Con cambios": dict(v=15, cambios=True, aviso=AL_BAJAR),
    "Fuera de rango": dict(v=30, err=error(25), cambios=True),
    "Otra persona cambió la configuración": dict(v=15, conflicto=True),
    "Sin permiso": dict(v=25, ro=True),
}
M_ORG = ["Sin cambios", "La (i) del tamaño", "Fuera de rango", "Otra persona cambió la configuración", "Sin permiso"]

CSS = """
/* E18 · La Configuración de Formularios (270): el valor con su unidad y su (i), el máximo de la plataforma a su lado, el aviso. */
.e18-cfg .b2-num .ct.ro { display: flex; align-items: center; width: 110px; }
.e18-cfg .b2-av { margin-top: 8px; }
.e18-cfg .w-cmp .rt.b2-et { display: flex; }
.w-caja:has(.acc-tip) { overflow: visible !important; }
"""
CSS_TEL = """
/* E18 · La Configuración de Formularios en el teléfono (270). */
.b2-num .ct { width: 120px; }
.b2-num .u { font-size: 16px; }
.b2-num .ct.ro { display: flex; align-items: center; }
.ap-cuerpo:has(.acc-tip) { overflow: visible !important; }
"""


# ---------------------------------------------------------------------------------------------------------------- el tablero
def tablero(base, titulo, css, cuerpos, estados, ancho, alto):
    """Como `base2_comun.tablero`, con el bloque de la E18: un Tweak «estado» y un `sc-if` por estado con su cuerpo entero."""
    cab, afuera = b2.cabeza(base, titulo + SUFIJO)
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"},
             "$preview": {"width": ancho, "height": alto}}
    texto_props = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto_props
    plantilla = b2.por_estado(cuerpos)
    assert "{{" not in re.sub(r"\{\{(e\d+|si|no)\}\}", "", plantilla), "una variable sin valor en la plantilla"
    vals = ", ".join(f"e{i}: k === {i}" for i in range(len(estados)))
    guion = (f"<script type=\"text/x-dc\" data-dc-script data-props='{texto_props}'>\n"
             "class Component extends DCLogic {\n"
             "  renderVals() {\n"
             f"    const k = {json.dumps(estados, ensure_ascii=False)}.indexOf(this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)});\n"
             f"    return {{ si: true, no: false, {vals} }};\n"
             "  }\n"
             "}\n"
             "</script>\n</body>\n</html>\n")
    return f"{cab}<style {MARCA}>\n{css}</style>\n</helmet>\n{afuera}\n{plantilla}\n</x-dc>\n{guion}"


def leer(base):
    t = (PROJ / f"{base}.dc.html").read_text(encoding="utf-8")
    return t[t.index("</helmet>") + len("</helmet>"):t.index("</x-dc>")]


def marco_compu(base, miga_vieja, miga, hijo_viejo, hijo_nuevo):
    """Lo de la compu antes de la banda (el menú, el panel de Administración y la barra) y lo de después del cuerpo."""
    cuerpo = leer(base)
    a = cuerpo.index('<div class="w-bnd">')
    antes = re.sub(r"<style\b[^>]*>.*?</style>", "", cuerpo[cuerpo.index('<div class="w-app">'):a], flags=re.S)
    antes = b2.una_vez(antes, f"<span>{miga_vieja}</span>", f"<span>{miga}</span>")
    # «Asistente» queda plegado (un enlace, con la flecha de un grupo cerrado) y «Formularios» se abre con su «Configuración».
    cerrada = re.search(r'<a class="w-ln grupo" href="[^"]*">' + SVG + r' WhatsApp <span class="fl">(' + SVG + r")</span></a>", antes, re.S).group(1)
    m = re.search(r'<span class="w-ln grupo">(' + SVG + r') Asistente <span class="fl">(' + SVG + r')</span></span><div class="w-hijos">'
                  r'<a class="w-ln on" href="%s">Configuración</a><a class="w-ln" href="[^"]*">Uso</a></div>' % re.escape(hijo_viejo), antes, re.S)
    assert m, base
    icono = re.search(r'<a class="w-ln" href="FRM-Formularios.dc.html">(' + SVG + r") Gestión de formularios", leer("Asistente-Config-Org"), re.S).group(1)
    grupos = (f'<a class="w-ln grupo" href="{hijo_viejo}">{m.group(1)} Asistente <span class="fl">{cerrada}</span></a>'
              f'<span class="w-ln grupo">{icono} Formularios <span class="fl">{m.group(2)}</span></span>'
              f'<div class="w-hijos"><a class="w-ln on" href="{hijo_nuevo}">Configuración</a></div>')
    antes = antes[:m.start()] + grupos + antes[m.end():]
    # «on» queda en «Administración» del menú principal y en la «Configuración» de Formularios del panel.
    assert antes.count('class="w-ln on"') == 2 and 'w-ln on" href="' + hijo_nuevo in antes
    # Después del cuerpo se cierran solo los que siguen abiertos (`w-co` y `w-app`): lo de abajo del marco son diálogos de su página.
    abiertos = len(re.findall(r"<div\b", antes)) - antes.count("</div>")
    assert abiertos == 2, abiertos
    return antes, "</div>" * abiertos


def banda(e):
    if e.get("ro"):
        acciones = ""
    else:
        guardar = "" if e.get("cambios") else " disabled"
        acciones = (f'<button type="button" class="cb cb-sec">Descartar cambios</button>'
                    f'<button type="button" class="cb cb-pri"{guardar}>Guardar cambios</button>')
    return (f'<div class="w-bnd"><div class="iz"><div><h1>Configuración</h1><p class="res">Formularios</p></div></div>'
            f'<div class="ac">{acciones}</div></div>')


def franja(e):
    if not e.get("conflicto"):
        return ""
    return f'<div class="b2-av mal" role="alert" style="margin: 0;">{b2.SVG_ATEN}<span>{CONFLICTO}</span><a class="acc" href="#">Volver a leer</a></div>'


def valor_compu(rotulo, e, ayuda):
    """El número con su unidad y su (i); el error y el aviso debajo; apagado sin permiso, con el motivo en su tooltip (211)."""
    i = b2.info(ayuda, e.get("i", False), "b2-tip-abajo")
    clase = "ct err" if e.get("err") else "ct"
    campo = f'<input class="{clase}" type="number" aria-label="{rotulo}" value="{e["v"]}"{" disabled" if e.get("ro") else ""}>'
    if e.get("ro"):
        campo = f'<span class="b2-env">{campo}{b2.tip(SIN_PERMISO)}</span>'
    err = f'<span class="b2-err" role="alert">{e["err"]}</span>' if e.get("err") else ""
    aviso = f'<div class="b2-av" role="status">{b2.SVG_ATEN}<span>{e["aviso"]}</span></div>' if e.get("aviso") else ""
    return (f'<div class="w-cmp"><span class="rt b2-et">{rotulo}{i}</span><div class="b2-num">{campo}<span class="u">MB</span></div>'
            f"{err}{aviso}</div>")


def solo_lectura_compu(rotulo, valor, ayuda):
    return (f'<div class="w-cmp"><span class="rt b2-et">{rotulo}{b2.info(ayuda)}</span><div class="b2-num"><div class="ct ro">{valor}</div>'
            f'<span class="u">MB</span></div></div>')


def caja(campos):
    return f'<div class="w-caja"><div class="w-cab"><span>{CAJA}</span></div><div class="as-g2">{campos}</div></div>'


# ---------------------------------------------------------------------------------------------------------------- los tableros
def frm_config_org():
    antes, despues = marco_compu("Asistente-Config-Org", "Inicio / Asistente / Configuración", "Inicio / Administración / Formularios / Configuración",
                                 "Asistente-Config-Org.dc.html", "FRM-Config-Org.dc.html")
    cuerpos = []
    for e in ORG.values():
        campos = valor_compu(ROTULO, e, ayuda_org(e["m"])) + solo_lectura_compu(ROTULO_PLAT, e["m"], AYUDA_MAX)
        cuerpos.append(antes + banda(e) + f'<div class="w-body e18-cfg">{franja(e)}{caja(campos)}</div>' + despues)
    return tablero("Asistente-Config-Org", "Administración › Formularios › Configuración", b2.css() + CSS_CONFIG + CSS, cuerpos,
                   list(ORG), 1440, 900)


def frm_config_plat():
    antes, despues = marco_compu("Plat-Asistente-Config", "Plataforma / Asistente / Configuración",
                                 "Plataforma / Administración / Formularios / Configuración", "Plat-Asistente-Config.dc.html",
                                 "FRM-Config-Plat.dc.html")
    cuerpos = [antes + banda(e) + f'<div class="w-body e18-cfg">{franja(e)}{caja(valor_compu(ROTULO, e, AYUDA_PLAT))}</div>' + despues
               for e in PLAT.values()]
    return tablero("Plat-Asistente-Config", "Plataforma · Administración · Formularios · Configuración", b2.css() + CSS_CONFIG + CSS,
                   cuerpos, list(PLAT), 1440, 900)


def m_frm_config_org():
    cuerpo = leer("M-Asistente-Config-Org")
    a = cuerpo.index('<div class="ap"')
    k = cuerpo.index('<div class="ap-cuerpo"')
    antes = b2.una_vez(cuerpo[a:k], '<span class="sub">Asistente</span>', '<span class="sub">Formularios</span>')
    titulo = ('<span class="ap-gtit" style="margin: 4px 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1);">' + CAJA + "</span>")
    cuerpos = []
    for nombre in M_ORG:
        e = ORG[nombre]
        if e.get("ro"):
            i = b2.info(ayuda_org(e["m"]), False, "b2-tip-abajo")
            valor = (f'<div class="ap-cmp"><span class="rt"><span class="b2-et">{ROTULO}{i}</span></span><div class="b2-num"><span class="b2-env">'
                     f'<div class="ct apag" aria-disabled="true">{e["v"]}</div>{b2.tip(SIN_PERMISO, "b2-tip-abajo")}</span><span class="u">MB</span></div></div>')
        else:
            valor = cmp_tel(ROTULO, str(e["v"]), ayuda_org(e["m"]), "MB", e.get("err"), abierto_i=e.get("i", False))
        maximo = (f'<div class="ap-cmp"><span class="rt"><span class="b2-et">{ROTULO_PLAT}{b2.info(AYUDA_MAX, False, "b2-tip-abajo")}</span></span>'
                  f'<div class="b2-num"><div class="ct ro">{e["m"]}</div><span class="u">MB</span></div></div>')
        fr = (f'<div class="b2-av mal" role="alert">{b2.SVG_ATEN}<span>{CONFLICTO}</span><a class="acc" href="#">Volver a leer</a></div>'
              if e.get("conflicto") else "")
        fijo = "" if e.get("ro") else ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button>'
                                       f'<button type="button" class="cb cb-pri full{"" if e.get("cambios") else " apag"}">Guardar cambios</button></div>')
        cuerpos.append(antes + f'<div class="ap-cuerpo" style="padding: 4px 20px 16px; gap: 14px; overflow: auto;">{fr}{titulo}{valor}{maximo}</div>'
                       + fijo + '<span class="ap-raya"></span></div>')
    return tablero("M-Asistente-Config-Org", "Configuración de Formularios · teléfono", b2.css(True) + CSS_CONFIG + CSS_TEL, cuerpos,
                   M_ORG, 390, 844)


if __name__ == "__main__":
    for nombre, hacer in (("FRM-Config-Org", frm_config_org), ("M-FRM-Config-Org", m_frm_config_org), ("FRM-Config-Plat", frm_config_plat)):
        ruta = PROJ / f"{nombre}.dc.html"
        if ruta.exists() and MARCA in ruta.read_text(encoding="utf-8"):
            print(nombre, "ya existe con el bloque de la E18: se rehace")
        texto = hacer()
        assert texto.count(SUFIJO) == 1 and MARCA in texto
        b2.escribir(nombre, texto)
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
