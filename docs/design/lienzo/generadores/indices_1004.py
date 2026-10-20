"""Índices del lienzo (pedido de la Guía, elegido por el usuario el 2026-10-17), como los `Indice-*` del lienzo de
ArquitecturaBase pero con nuestras piezas: un índice general con un área por capítulo de la guía y, por área, una tarjeta
por pantalla con enlaces a su compu, su teléfono y lo que se abre desde ahí. Con Play, tocar un enlace lleva a ese tablero.

Sale de `docs/design/guia/recorrido.py`, así el lienzo y la guía cuentan lo mismo. Un tablero que está en el Archivo no
aparece. Toda pantalla nueva se suma a `recorrido.py` y vuelve a correr este generador (README del lienzo).
"""
import html
import json
import math
import pathlib
import re
import sys

PROJ = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJ.parent / "guia"))
import recorrido as R  # noqa: E402

CANVAS = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
B = CANVAS["boards"]
PAGINA = "mapa"
NOMBRE_PAGINA = "Índice y mapas"
ANCHO = 1440

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
HEAD = botones.split("</helmet>", 1)[0]

COMPU = ('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8.5 20h7M12 16.5V20"/></svg>')
TEL = ('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
       '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17.5h2"/></svg>')
FLECHA = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
          '<path d="M4.5 12h15M14 6.5l5.5 5.5-5.5 5.5"/></svg>')
VOLVER = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
          '<path d="M19.5 12h-15M10 6.5 4.5 12l5.5 5.5"/></svg>')
OJO = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
       '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>')

CSS = """  <style data-indice="1004">
.ix-hint { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 14px; font-weight: 600; color: var(--marca-tx); }
.ix-volver { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; height: 32px; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 8px;
  background: #fff; color: var(--t1); font-size: 13px; font-weight: 600; text-decoration: none; }
.ix-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
.ix-card { display: flex; flex-direction: column; gap: 10px; padding: 16px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; }
.ix-card .cab { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ix-card h3 { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; }
.ix-card .ruta { display: block; margin-top: 2px; font-family: ui-monospace, Consolas, monospace; font-size: 12px; color: var(--t3); }
.ix-est { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; font-size: 12px; color: var(--t2); white-space: nowrap; }
.ix-est::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: oklch(0.75 0.01 78); }
.ix-est.ok::before { background: oklch(0.6 0.13 155); }
.ix-est.parte::before { background: oklch(0.72 0.15 70); }
.ix-links { display: flex; flex-wrap: wrap; gap: 6px; }
.ix-links a { display: inline-flex; align-items: center; gap: 6px; height: 30px; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--borde2); border-radius: 8px;
  background: #fff; color: var(--t1); font-size: 13px; font-weight: 500; text-decoration: none; white-space: nowrap; }
.ix-links a svg { color: var(--t3); flex-shrink: 0; }
.ix-links a.pri { border-color: oklch(0.51 0.099 195 / 0.35); background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.ix-links a.pri svg { color: var(--marca-tx); }
.ix-area { display: flex; flex-direction: column; gap: 8px; min-height: 150px; box-sizing: border-box; padding: 18px; border: 1px solid var(--borde); border-radius: 12px; background: #fff;
  color: var(--t1); text-decoration: none; }
.ix-area .t { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 17px; font-weight: 700; }
.ix-area .t svg { color: var(--marca-tx); flex-shrink: 0; }
.ix-area .d { font-size: 13.5px; line-height: 1.45; color: var(--t2); }
.ix-area .n { margin-top: auto; font-size: 13px; font-weight: 600; color: var(--marca-tx); }
.ix-ref { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.ix-ref a { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 52px; box-sizing: border-box; padding: 10px 14px; border: 1px solid var(--borde);
  border-radius: 10px; background: #fff; color: var(--t1); font-size: 14px; font-weight: 600; text-decoration: none; }
.ix-ref a svg { color: var(--t3); }
  </style>"""


def vigente(n):
    b = B.get(f"{n}.dc.html")
    return bool(b) and b.get("page") != "archivo"


def etiqueta(n):
    """Lo corto de su título: «Mi cuenta · agregar correo o teléfono · teléfono» → «Agregar correo o teléfono»."""
    t = B[f"{n}.dc.html"]["title"].replace(" · para aprobar", "").replace(" · por refinar", "")
    t = re.sub(r" · teléfono$", "", t)
    partes = [p.strip() for p in re.split(r" · | › ", t) if p.strip() and not p.strip().startswith("/")]
    e = partes[-1] if partes else n
    return e[:1].upper() + e[1:]


def lado(n):
    """Cuando una pantalla tiene un tablero por perfil (el asistente), el enlace dice de quién es."""
    if "Plat" in n:
        return "Plataforma"
    if "Personal" in n:
        return "Personal"
    if "Org" in n:
        return "Organización"
    return etiqueta(n)


def enlace(n, texto, tel, pri=False):
    return f'<a class="{"pri" if pri else ""}" href="{n}.dc.html">{TEL if tel else COMPU}{html.escape(texto)}</a>'


def tarjeta(p):
    pid, nombre, ruta, codigo, etapa, compu, tel, mas = p[:8]
    compu, tel, mas = [x for x in compu if vigente(x)], [x for x in tel if vigente(x)], [x for x in mas if vigente(x)]
    links = []
    for x in compu:
        links.append(enlace(x, "Compu" if len(compu) == 1 else lado(x), False, pri=True))
    for x in tel:
        links.append(enlace(x, "Teléfono" if len(tel) == 1 else lado(x), True, pri=True))
    es_tel = lambda x: x.startswith("M-") or x == "Landing-Movil"
    for x in sorted(mas, key=es_tel):  # primero lo de la compu, después lo del teléfono
        links.append(enlace(x, etiqueta(x), es_tel(x)))
    texto_est, clase = R.CODIGO[codigo]
    est = f'<span class="ix-est {clase}">{texto_est}{" · Etapa " + etapa if etapa and etapa != "—" else ""}</span>'
    r = f'<span class="ruta">{html.escape(ruta)}</span>' if ruta and ruta != "—" else ""
    return (f'<div class="ix-card"><div class="cab"><div><h3>{html.escape(nombre)}</h3>{r}</div>{est}</div>'
            f'<div class="ix-links">{"".join(links)}</div></div>'), len(links), sum(len(etiqueta(x)) for x in mas)


def alto_area(pantallas):
    """Estimación del alto: tarjetas en tres columnas; cada fila de enlaces suma 36."""
    filas_de_tarjetas = math.ceil(len(pantallas) / 3)
    alto = 40 + 120 + 36  # márgenes, encabezado y separación
    for f in range(filas_de_tarjetas):
        fila = pantallas[f * 3:f * 3 + 3]
        mayor = 0
        for p in fila:
            _, n_links, largo = tarjeta(p)
            ancho_util = 390
            usado, renglones = 0, 1
            for k in range(n_links):
                w = 110 if k < 2 else 50 + 7.4 * 14
                if usado + w > ancho_util:
                    renglones, usado = renglones + 1, 0
                usado += w + 6
            mayor = max(mayor, 32 + 46 + 10 + renglones * 36)
        alto += mayor + 16
    return int(alto + 56)


# Altos medidos con Playwright (fondo del contenido + 56); si falta uno, se usa la estimación.
ALTOS = {'Indice': 1195, 'Indice-administra': 786, 'Indice-asistente': 488, 'Indice-empresa': 416, 'Indice-entra': 547, 'Indice-equipo': 547, 'Indice-formularios': 1419, 'Indice-llega': 547, 'Indice-manda': 437, 'Indice-persona': 560, 'Indice-plataforma': 1140, 'Indice-whatsapp': 1002}


def pagina(titulo, cuerpo, alto):
    head = HEAD.replace("<title>Criterio · Botones</title>", f"<title>{titulo}</title>")
    head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{alto}px", head)
    script = (f"""<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{ANCHO},"height":{alto}}}}}'>\n"""
              "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}\n</script>")
    return "\n".join([head, CSS, "</helmet>", "", f'<div class="crit">{cuerpo}</div>', "</x-dc>", "", script, "</body>", "</html>", ""])


def indice_area(cid, titulo, texto, pantallas):
    pantallas = [p for p in pantallas if any(vigente(x) for x in p[5] + p[6] + p[7])]
    tarjetas = "".join(tarjeta(p)[0] for p in pantallas)
    cuerpo = (f'<a class="ix-volver" href="Indice.dc.html">{VOLVER} Índice general</a>'
              f'<div><h1>{html.escape(titulo)}</h1><p class="sub">{html.escape(texto)}</p>'
              f'<span class="ix-hint">{OJO} Con Play, tocá una pantalla y vas a su tablero.</span></div>'
              f'<div class="ix-grid">{tarjetas}</div>')
    return pagina(f"Índice · {titulo}", cuerpo, ALTOS.get(f"Indice-{cid}", alto_area(pantallas))), len(pantallas)


REFERENCIA = [("Criterio-Marco", "Marco y pantallas"), ("Criterio-Botones", "Botones"), ("Criterio-Tablas", "Tablas y listas"),
              ("Criterio-Formularios", "Formularios y campos"), ("Criterio-Dialogos", "Diálogos"), ("Criterio-Avisos", "Avisos y errores"),
              ("Criterio-Menus", "Menús y desplegables"), ("Criterio-Decisiones", "Decisiones por pantalla")]


def indice_general(areas):
    tarjetas = ""
    for cid, titulo, texto, n_pant, n_tab in areas:
        tarjetas += (f'<a class="ix-area" href="Indice-{cid}.dc.html"><span class="t">{html.escape(titulo)}{FLECHA}</span>'
                     f'<span class="d">{html.escape(texto)}</span><span class="n">{n_pant} pantallas · {n_tab} tableros</span></a>')
    ref = "".join(f'<a href="{n}.dc.html">{html.escape(t)}{FLECHA}</a>' for n, t in REFERENCIA if vigente(n) or n.startswith("Criterio"))
    cuerpo = (f'<div><h1>Índice general</h1><p class="sub">Todas las pantallas del sistema, en el orden en que una persona lo usa: el mismo de la guía.</p>'
              f'<span class="ix-hint">{OJO} Con Play, tocá un área y después una pantalla.</span></div>'
              f'<section><h2>Las áreas</h2><div class="ix-grid">{tarjetas}</div></section>'
              f'<section><h2>El criterio de diseño</h2><div class="ix-ref">{ref}</div></section>')
    filas = math.ceil(len(areas) / 3)
    return pagina("Índice general", cuerpo, ALTOS.get("Indice", 40 + 120 + 36 + 60 + filas * 166 + 60 + 2 * 64 + 56))


def generar():
    salida, areas = {}, []
    for cid, titulo, texto, pantallas in R.CAPITULOS:
        t, n = indice_area(cid, titulo, texto, pantallas)
        tableros = sum(1 for p in pantallas for x in p[5] + p[6] + p[7] if vigente(x))
        salida[f"Indice-{cid}"] = t
        areas.append((cid, titulo, texto, n, tableros))
    salida["Indice"] = indice_general(areas)
    return salida


def registrar(tableros):
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    for pg in c["pages"]:
        if pg["id"] == PAGINA:
            pg["name"] = NOMBRE_PAGINA
    if "titulo" in c["notes"] and c["notes"]["titulo"].get("page") == PAGINA:
        c["notes"]["titulo"]["text"] = NOMBRE_PAGINA
    altos = {n: int(re.search(r'"height":(\d+)', t).group(1)) for n, t in tableros.items()}
    # El índice general arriba a la izquierda; al lado, los dos mapas; debajo, una fila de índices por área.
    c["boards"]["Indice.dc.html"] = {"x": 0, "y": 260, "w": ANCHO, "h": altos["Indice"], "title": "Índice general · tocá Play y elegí un área", "page": PAGINA, "is_interactive": True}
    c["boards"]["Recorridos.dc.html"].update({"x": 1520, "y": 260})
    c["boards"]["Mapa-Ingreso.dc.html"].update({"x": 3200, "y": 260})
    if "guia" in c["notes"] and c["notes"]["guia"].get("page") == PAGINA:
        c["notes"]["guia"].update({"x": 4880, "y": 260})
    y = 260 + max(altos["Indice"], c["boards"]["Recorridos.dc.html"]["h"], c["boards"]["Mapa-Ingreso.dc.html"]["h"]) + 200
    areas = [n for n in tableros if n != "Indice"]
    por_fila = 6
    for k, n in enumerate(areas):
        fila = k // por_fila
        y_fila = y + sum(max(altos[m] for m in areas[f * por_fila:(f + 1) * por_fila]) + 200 for f in range(fila))
        titulo = next(t for cid, t, _, _ in R.CAPITULOS if f"Indice-{cid}" == n)
        c["boards"][f"{n}.dc.html"] = {"x": (k % por_fila) * 1520, "y": y_fila, "w": ANCHO, "h": altos[n], "title": f"Índice · {titulo} · tocá Play y elegí una pantalla",
                                       "page": PAGINA, "is_interactive": True}
    for n in tableros:
        if f"{n}.dc.html" not in c["order"]:
            c["order"].append(f"{n}.dc.html")
    (PROJ / "canvas.json").write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    tableros = generar()
    for n, t in tableros.items():
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    registrar(tableros)
    print("índices", list(tableros))
