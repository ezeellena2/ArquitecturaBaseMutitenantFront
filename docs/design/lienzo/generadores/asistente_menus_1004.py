"""El asistente en los menús de todo el lienzo (v114, 2026-10-07; decisiones del usuario sobre la tanda del asistente):
- Administración de la organización y de Plataforma: el grupo «Asistente» (Configuración y Uso), después de WhatsApp.
- Plataforma: «Inicio» arriba del menú (el asistente es el inicio; Organizaciones sigue en Gestión).
- Teléfonos con sesión: la pestaña «Asistente» en el segundo lugar; lo que no entra pasa a «Más»: Difusiones en la organización y
  Recuperaciones en Plataforma (M-WA-Menu y M-Mas-Plat las suman, junto con el grupo «Asistente»).
- Inicio-Org e Inicio-Personal quedan como el inicio sin el módulo: no suman el grupo.
Cada cambio se hace solo si el tablero todavía no lo tiene."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def svg(d, w=18, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


CHISPA_D = ('<path d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9z"/>'
            '<path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>')
CHISPA18 = svg(CHISPA_D)
CHISPA_NAV = svg(CHISPA_D, 24)
CASA = svg('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>')
FL_CERRADO = ('<span class="fl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg></span>')
SALTAR = {"Inicio-Org.dc.html", "Inicio-Personal.dc.html"}

c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
PLAT_PC = {k for k, v in c["boards"].items() if v["page"] == "plataforma" and v["w"] == 1440}
inicio_plat = (PROJ / "Asistente-Plat.dc.html").read_text(encoding="utf-8")
LI_INICIO = re.search(r'<li><a class="ab-sidebar__link ab-sidebar__link--active" href="Asistente-Plat\.dc\.html" aria-current="page">.*?</li>', inicio_plat, re.S).group(0)
LI_INICIO = LI_INICIO.replace(' ab-sidebar__link--active', '', 1).replace(' aria-current="page"', '', 1)


def ab_rama(t, href_wa, href_asis):
    m = re.search(r'<li><a class="ab-sidebar__branch ab-cerrado" href="' + re.escape(href_wa) + r'">.*?</li>', t, re.S)
    if not m:
        return t
    li = m.group(0)
    ico = re.search(r"<svg.*?</svg>", li, re.S).group(0)
    nuevo = li.replace(href_wa, href_asis).replace(">WhatsApp<", ">Asistente<").replace(ico, CHISPA18, 1)
    return t[:m.end()] + nuevo + t[m.end():]


def w_grupo(t, prefijo_wa, href_asis):
    """El grupo de WhatsApp de la w-panel, abierto o cerrado; el de Asistente va después, cerrado."""
    asis = f'<a class="w-ln grupo" href="{href_asis}">{CHISPA18} Asistente {FL_CERRADO}</a>'
    m = re.search(r'<span class="w-ln grupo"><svg.*?</svg>\s*WhatsApp\s*<span class="fl">.*?</span></span><div class="w-hijos">.*?</div>', t, re.S)
    if m and prefijo_wa in m.group(0):
        return t[:m.end()] + asis + t[m.end():]
    m = re.search(r'<a class="w-ln grupo" ' + re.escape(prefijo_wa) + r'[^"]*">.*?</a>', t, re.S)
    if m and "WhatsApp" in m.group(0):
        return t[:m.end()] + asis + t[m.end():]
    return t


def nav_links(nav):
    return [(m.group(2), m.group(3), bool(m.group(1)))
            for m in re.finditer(r'<a( class="on" aria-current="page")? href="([^"]+)">(.*?)</a>', nav, re.S)]


def armar_nav(links):
    n = len(links)
    estilo = "" if n == 5 else f' style="grid-template-columns: repeat({n}, 1fr);"'
    return (f'<nav class="ap-nav" aria-label="Secciones"{estilo}>'
            + "".join(f'<a{" class=\"on\" aria-current=\"page\"" if on else ""} href="{h}">{b}</a>' for h, b, on in links) + "</nav>")


def nav_tel(t):
    """Todas las barras de abajo del tablero (una por estado), de atrás para adelante."""
    for m in reversed(list(re.finditer(r'<nav class="ap-nav"[^>]*>.*?</nav>', t, re.S))):
        t = t[:m.start()] + una_nav(m.group(0)) + t[m.end():]
    return t


def una_nav(nav):
    t = nav
    m = re.search(r'<nav class="ap-nav"[^>]*>.*?</nav>', t, re.S)
    if not m or "Asistente</a>" in m.group(0):
        return t
    links = nav_links(m.group(0))
    hrefs = [h for h, _, _ in links]
    if not links or m.group(0).count("<a ") != len(links):
        print("barra sin tocar:", re.findall(r'href="([^"]+)"', m.group(0)))
        return t
    if any("M-Inicio-Miembro" in h for h in hrefs):
        destino, quitar = "M-Asistente-Org.dc.html", None
    elif any(h in ("M-Inicio-Org.dc.html", "M-WA-Chats.dc.html", "M-WA-Menu.dc.html") for h in hrefs):
        destino, quitar = "M-Asistente-Org.dc.html", "M-WA-Difusiones.dc.html"
    elif any(h in ("M-Organizaciones.dc.html", "M-Mas-Plat.dc.html") for h in hrefs):
        destino, quitar = "M-Asistente-Plat.dc.html", "M-Recuperaciones.dc.html"
    elif any(h in ("M-Inicio-Personal.dc.html", "M-Mas-Personal.dc.html") for h in hrefs):
        destino, quitar = "M-Asistente-Personal.dc.html", None
    else:
        return t
    activo_quitado = any(h == quitar and on for h, _, on in links)
    links = [l for l in links if l[0] != quitar]
    if activo_quitado:
        links[-1] = (links[-1][0], links[-1][1], True)
    links.insert(1, (destino, f'<span class="i">{CHISPA_NAV}</span>Asistente', False))
    return t[:m.start()] + armar_nav(links) + t[m.end():]


def item_mas(href, texto):
    return (f'<a class="ap-it " href="{href}"><span class="tx"><b>{texto}</b></span><span class="chev">'
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg></span></a>')


def tiene_grupo(t, href):
    """El grupo «Asistente» ya está en el panel (cerrado como enlace o abierto); «Revisar configuración» no cuenta."""
    return f'ab-cerrado" href="{href}"' in t or f'grupo" href="{href}"' in t or ' Asistente <span class="fl">' in t


hechos = []
for k in c["boards"]:
    ruta = PROJ / k
    t = ruta.read_text(encoding="utf-8")
    orig = t
    if k not in SALTAR and not tiene_grupo(t, "Asistente-Config-Org.dc.html"):
        t2 = ab_rama(t, "WA-Admin.dc.html", "Asistente-Config-Org.dc.html")
        t = t2 if t2 != t else w_grupo(t, 'href="WA-', "Asistente-Config-Org.dc.html")
    if not tiene_grupo(t, "Plat-Asistente-Config.dc.html"):
        t2 = ab_rama(t, "Plat-WA-Numero.dc.html", "Plat-Asistente-Config.dc.html")
        t = t2 if t2 != t else w_grupo(t, 'href="Plat-WA-', "Plat-Asistente-Config.dc.html")
    if k in PLAT_PC and 'href="Asistente-Plat.dc.html"' not in t:
        a = '<nav class="ab-sidebar__nav" aria-label="Secciones"><ul class="ab-sidebar__list">'
        if a in t:
            t = t.replace(a, a + LI_INICIO, 1)
        else:
            t = re.sub(r'(<aside class="w-sb"[^>]*>.*?<nav class="w-nav">)', lambda m: m.group(1) + f'<a class="w-ln" href="Asistente-Plat.dc.html">{CASA} Inicio</a>', t, count=1, flags=re.S)
    t = nav_tel(t)
    if k == "M-WA-Menu.dc.html" and "M-Asistente-Config-Org.dc.html" not in t:
        t = t.replace('<span class="ap-gtit">WhatsApp</span><div class="ap-grupo">',
                      '<span class="ap-gtit">WhatsApp</span><div class="ap-grupo">' + item_mas("M-WA-Difusiones.dc.html", "Difusiones"), 1)
        i = t.index('<span class="ap-gtit">WhatsApp</span>')
        j = t.index("</div>", i) + len("</div>")
        t = t[:j] + '<span class="ap-gtit">Asistente</span><div class="ap-grupo">' + item_mas("M-Asistente-Config-Org.dc.html", "Configuración") \
            + item_mas("M-Asistente-Uso-Org.dc.html", "Uso") + "</div>" + t[j:]
    if k == "M-Mas-Plat.dc.html" and "M-Plat-Asistente-Config.dc.html" not in t:
        t = t.replace('<span class="ap-gtit">Administración</span>',
                      '<span class="ap-gtit">Gestión</span><div class="ap-grupo">' + item_mas("M-Recuperaciones.dc.html", "Recuperaciones") + "</div>"
                      '<span class="ap-gtit">Administración</span>', 1)
        i = t.index('<span class="ap-gtit">WhatsApp</span>')
        j = t.index("</div>", i) + len("</div>")
        t = t[:j] + '<span class="ap-gtit">Asistente</span><div class="ap-grupo">' + item_mas("M-Plat-Asistente-Config.dc.html", "Configuración") \
            + item_mas("M-Plat-Asistente-Uso.dc.html", "Uso") + "</div>" + t[j:]
    if t != orig:
        ruta.write_text(t, encoding="utf-8")
        hechos.append(k.replace(".dc.html", ""))

# Los inicios sin el módulo y Organizaciones, con su nombre en el lienzo.
TITULOS = {"Inicio-Org.dc.html": "Inicio · /org (sin el asistente)", "Inicio-Personal.dc.html": "Inicio personal · / (sin el asistente)",
           "Organizaciones.dc.html": "Organizaciones · /plataforma/organizaciones"}
cambio = False
for k, tt in TITULOS.items():
    if c["boards"][k]["title"] != tt:
        c["boards"][k]["title"] = tt
        cambio = True
if cambio:
    (PROJ / "canvas.json").write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print(len(hechos), "tableros:", ", ".join(hechos))
