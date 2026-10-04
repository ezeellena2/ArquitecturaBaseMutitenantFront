"""Inicios: los estados que la app tiene y el lienzo no dibujaba (relevamiento E1-E6, N3; tanda aprobada por el usuario el
2026-10-04).
- Inicio-Personal y M-Inicio-Personal: «Sin el aviso», para la persona que ya tiene un método propio. Queda solo el título, como en
  la app: el inicio personal no tiene contenido propio hasta que lleguen los módulos. Tweak «estado».
- M-Inicio-Org: «Nada para resolver», como en la compu: «Para resolver» con 0, el texto en negrita y los atajos sin globitos.
  Tweak «pendientes».
- M-Inicio-Miembro (nuevo): el inicio en el teléfono de alguien con roles solo en una empresa. Sigue la billetera de M-Inicio-Org
  (decisión del 2026-10-03: el inicio del teléfono es una billetera), así que tiene la cabecera de color con «Hola, Valentina» y la
  organización. No lleva atajos porque no tiene áreas de la organización. Después va «Tus empresas» en filas (su rol y cuántos
  miembros) y, si administra su empresa, su «Para resolver». La barra de abajo tiene Inicio y Más. Tweak «rol», como Inicio-Miembro.
  La app hoy muestra una pantalla simple sin la cabecera: la Guía la alinea a este tablero.
Lleva `data-vuelta="1004-estados-inicios"`; si ya la tiene, no se toca. M-Inicio-Miembro se arma a partir de M-Inicio-Org."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-estados-inicios"'


def rep(t, a, b, n=1):
    assert t.count(a) == n, (a[:80], t.count(a))
    return t.replace(a, b)


def props(clave, opciones, ancho, alto):
    p = json.dumps({clave: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"},
                    "$preview": {"width": ancho, "height": alto}}, ensure_ascii=False, separators=(",", ":"))
    return f"data-props='{p}'"


def script(t, ancho, alto, clave, opciones, vals):
    viejo = "data-props='{\"$preview\":{\"width\":%d,\"height\":%d}}'" % (ancho, alto)
    t = rep(t, viejo, props(clave, opciones, ancho, alto), 2) if t.count(viejo) == 2 else rep(t, viejo, props(clave, opciones, ancho, alto))
    cuerpo = "".join(f"      {k}: {v},\n" for k, v in vals.items())
    return rep(t, "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}",
               "class Component extends DCLogic {\n  renderVals() {\n"
               f"    const e = this.props.{clave} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n\n"
               "    return {\n      si: true,\n      no: false,\n" + cuerpo + "    };\n  }\n}")


def marcar(t, css=""):
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


# Inicio personal, en la compu y en el teléfono.
for nombre, pieza, ancho, alto in (("Inicio-Personal", '<div class="w-cartel">', 1440, 900), ("M-Inicio-Personal", '<div class="ap-sug">', 390, 844)):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    cab, cuerpo = t.split("</helmet>", 1)
    i = cuerpo.index(pieza)
    j, prof = i, 0
    for m in re.finditer(r"<div\b|</div>", cuerpo[i:]):
        prof += 1 if m.group(0).startswith("<div") else -1
        if prof == 0:
            j = i + m.end()
            break
    cuerpo = cuerpo[:i] + '<sc-if value="{{conAviso}}" hint-placeholder-val="{{si}}">' + cuerpo[i:j] + "</sc-if>" + cuerpo[j:]
    t = script(cab + "</helmet>" + cuerpo, ancho, alto, "estado", ["Con el aviso", "Sin el aviso"], {"conAviso": 'e === "Con el aviso"'})
    ruta.write_text(marcar(t), encoding="utf-8")
    print("ok", nombre)

# Inicio de la organización en el teléfono, sin pendientes.
ruta = PROJ / "M-Inicio-Org.dc.html"
org = ruta.read_text(encoding="utf-8")
t = org
if MARCA not in t:
    t = re.sub(r"<span class=c-bad>(\d+)</span>", r'<sc-if value="{{conPend}}" hint-placeholder-val="{{si}}"><span class=c-bad>\1</span></sc-if>', t)
    t = rep(t, '<div class="c-tit">Para resolver<span>4</span></div>', '<div class="c-tit">Para resolver<span>{{cantPend}}</span></div>')
    i = t.index('<div class="c-p">')
    j = t.index('<nav class="ap-nav"')
    fin = t.rindex("</div>", i, j)  # cierra .c-hoja
    t = (t[:i] + '<sc-if value="{{conPend}}" hint-placeholder-val="{{si}}">' + t[i:fin] + "</sc-if>"
         + '<sc-if value="{{sinPend}}" hint-placeholder-val="{{no}}"><div class="c-vacio"><b>Nada para resolver</b></div></sc-if>' + t[fin:])
    t = script(t, 390, 844, "pendientes", ["Con pendientes", "Nada para resolver"],
               {"conPend": 'e === "Con pendientes"', "sinPend": 'e === "Nada para resolver"', "cantPend": 'e === "Con pendientes" ? "4" : "0"'})
    ruta.write_text(marcar(t, ".c-vacio { padding: 10px 20px; font-size: 15px; }\n.c-vacio b { font-weight: 600; }\n"), encoding="utf-8")
    print("ok M-Inicio-Org")

# Inicio de un miembro en el teléfono (tablero nuevo).
ruta = PROJ / "M-Inicio-Miembro.dc.html"
if not ruta.exists():
    t = org
    t = rep(t, "<span>Hola, Lucía</span>", "<span>Hola, Valentina</span>")
    i = t.index('<div class="c-atajos">')
    j = t.index('<nav class="ap-nav"')
    fin = t.rindex("</div>", i, j)
    chevron = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
               'stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>')
    invit = re.search(r'<span class="c-ic alerta">(<svg.*?</svg>)</span>', t, re.S).group(1)
    contenido = ('<div class="c-tit">Tus empresas</div>'
                 f'<a class="c-p c-emp" href="M-Empresa.dc.html"><span class="c-ic emp">DN</span><span class="tx"><b>Delta Norte S.A.</b><span>{{{{rolEmpresa}}}} · 3 miembros</span></span><span class="c-fl">{chevron}</span></a>'
                 '<sc-if value="{{administra}}" hint-placeholder-val="{{no}}"><div class="c-raya" style="margin-top: 8px;"></div><div class="c-tit">Para resolver<span>1</span></div>'
                 f'<div class="c-p"><span class="c-ic alerta">{invit}</span><span class="tx"><b>martin.paz@delta.ejemplo.com</b><span><span class="e alerta">Invitación vencida</span> · Delta Norte S.A.</span></span><a class="c-btn" href="M-Empresa.dc.html">Reenviar</a></div></sc-if>')
    t = t[:i] + contenido + t[fin:]
    k = t.index('<nav class="ap-nav"')
    fin_nav = t.index("</nav>", k) + len("</nav>")
    casa = re.search(r'<a class="on" aria-current="page" href="M-Inicio-Org\.dc\.html"><span class="i">(<svg.*?</svg>)</span>Inicio</a>', t, re.S).group(1)
    t = (t[:k] + '<nav class="ap-nav" aria-label="Secciones" style="grid-template-columns: repeat(2, 1fr);">'
         f'<a class="on" aria-current="page" href="M-Inicio-Miembro.dc.html"><span class="i">{casa}</span>Inicio</a>'
         '<a href="M-Mas-Personal.dc.html"><span class="i"><span class="yo">V</span></span>Más</a></nav>' + t[fin_nav:])
    t = script(t, 390, 844, "rol", ["Solo lectura", "Administra su empresa"],
               {"administra": 'e === "Administra su empresa"', "rolEmpresa": 'e === "Administra su empresa" ? "Administrador" : "Solo lectura"'})
    css = (".c-emp { text-decoration: none; color: inherit; }\n"
           ".c-ic.emp { border-radius: 10px; background: var(--marca-t); color: var(--marca-tx); font-size: 14px; font-weight: 700; }\n"
           ".c-fl { display: inline-flex; color: var(--t3); flex-shrink: 0; }\n")
    t = re.sub(r"<title>[^<]*</title>", "<title>Inicio de un miembro · teléfono</title>", t, count=1)
    ruta.write_text(marcar(t, css), encoding="utf-8")
    print("ok M-Inicio-Miembro")

lienzo = PROJ / "canvas.json"
c = json.loads(lienzo.read_text(encoding="utf-8"))
if "M-Inicio-Miembro.dc.html" not in c["boards"]:
    c["boards"]["M-Inicio-Miembro.dc.html"] = {"x": 5640, "y": 3320, "w": 390, "h": 844, "title": "Inicio de alguien con roles en una empresa · teléfono",
                                               "page": "org", "is_interactive": True}
    lienzo.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ok canvas")
