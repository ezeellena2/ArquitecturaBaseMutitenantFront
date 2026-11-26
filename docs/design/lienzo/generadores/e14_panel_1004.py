"""La E14, tanda 2 del traspaso 18 (v186, 2026-11-26): el panel de «Gestión de formularios» en dos grupos (275).

Arriba «Formularios» y, después de una línea sin título, «Catálogos». Va en los tableros de la E14 que muestran el panel en la
compu; los teléfonos no tienen panel (el menú es otra pantalla) y la E12 y la E13, que solo tienen «Catálogos», no cambian.
Corre después de los otros `e14_*_1004.py` y de su pasada de las piezas: el CSS ya va con la escala de la compu.
Se puede volver a correr: un tablero que ya tiene la línea no cambia.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
BLOQUE = 'data-e14="panel"'
CSS = (f"<style {BLOQUE}>/* 275 · el panel en dos grupos: una línea sin título entre «Formularios» y «Catálogos». */\n"
       ".w-nav-sep { height: 1px; margin: 4.3px/*6px*/ 7.2px/*10px*/; background: var(--borde); }\n</style>\n")
SEP = '<div class="w-nav-sep" role="separator"></div>'
TABLEROS = ["FRM-Formularios", "FRM-Catalogos-14", "FRM-Catalogo-14", "FRM-Editor", "FRM-Publicar", "FRM-Publicando",
            "FRM-Vista-Oficial", "Campana-14"]
PANEL = re.compile(r'<aside class="w-panel" aria-label="Gestión de formularios">.*?</aside>', re.S)
# el enlace a Catálogos, solo o envuelto en su sc-if
CATALOGOS = re.compile(r'(?:<sc-if value="\{\{\w+\}\}"[^>]*>)?<a class="w-ln[^"]*" href="FRM-Catalogos[^"]*">(?:(?!</a>).)*?Catálogos</a>(?:</sc-if>)?', re.S)


def partir(panel):
    if SEP in panel:
        return panel
    i = panel.find("Formularios</a>")
    m = CATALOGOS.search(panel)
    assert i >= 0 and m and m.start() > i, "el panel no tiene «Formularios» antes de «Catálogos»"
    return panel[:m.start()] + SEP + panel[m.start():]


def main():
    for nombre in TABLEROS:
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        nuevo, n = PANEL.subn(lambda m: partir(m.group(0)), t)
        assert n, f"{nombre} no tiene el panel"
        if BLOQUE not in nuevo:
            nuevo = nuevo.replace("</helmet>", CSS + "</helmet>", 1)
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
        print("ok", nombre, n, "paneles", "(sin cambios)" if nuevo == t else "")


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------------------------------------------- canvas.json
# Los tableros de la tanda 2 (E13 y E14, v186) van « · para aprobar» en su título del lienzo, como su `<title>`, hasta que el
# usuario los apruebe; los cuatro que solo suman la línea del panel también. `Config-Plat-Base2` crece a 1820 de alto.
SUFIJO = " · para aprobar"
TANDA2 = ["FRM-Catalogo-13", "FRM-Catalogo-Opciones-13", "FRM-Catalogo-Ordenar-13", "FRM-Catalogo-Campos", "FRM-Formularios",
          "FRM-Catalogos-14", "FRM-Catalogo-14", "FRM-Editor", "WA-Chats-Formulario", "WA-Chats-Formulario-Cliente"]
TANDA2 += [f"M-{n}" for n in TANDA2]
TANDA2 += ["WA-Chats-Respuesta", "M-WA-Conversacion-Respuesta", "Config-Plat-Base2", "M-Config-Plat-Base2", "WA-Config-Base2",
           "M-WA-Config-Base2", "FRM-Publicar", "FRM-Publicando", "FRM-Vista-Oficial", "Campana-14"]
TITULOS = {"WA-Config-Base2": "Administración · WhatsApp · Configuración (nueva) · el plazo de los chats y el tiempo para "
                              "contestar un formulario"}
ALTOS = {"Config-Plat-Base2": 1820}


def registrar():
    import json
    for nombre in TANDA2:
        ruta = PROJ / f"{nombre}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        nuevo = re.sub(r"<title>([^<]*?)</title>", lambda m: f"<title>{m.group(1).removesuffix(SUFIJO)}{SUFIJO}</title>", t, count=1)
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
    ruta = PROJ / "canvas.json"
    texto = ruta.read_text(encoding="utf-8", newline="")
    c = json.loads(texto)
    for nombre in TANDA2:
        b = c["boards"][f"{nombre}.dc.html"]
        b["title"] = TITULOS.get(nombre, b["title"]).removesuffix(SUFIJO) + SUFIJO
        if nombre in ALTOS:
            b["h"] = ALTOS[nombre]
    nl = "\r\n" if "\r\n" in texto else "\n"
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2).replace("\n", nl) + ("" if texto.endswith("}") else nl),
                    encoding="utf-8", newline="")
    print("ok canvas.json", len(TANDA2), "títulos")


if __name__ == "__main__" and "--registrar" in sys.argv:
    registrar()
