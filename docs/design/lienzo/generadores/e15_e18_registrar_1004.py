"""La E15 a la E18 con el traspaso 18 (tanda 3A del 2026-11-26, lienzo v187): el panel en dos grupos y el registro en `canvas.json`.

- `--panel <etapa>`: el panel de «Gestión de formularios» en dos grupos (275), arriba «Formularios» y, tras una línea sin título,
  «Catálogos», en los tableros de esa etapa que lo muestran en la compu (los teléfonos no tienen panel). Usa la pieza de
  `e14_panel_1004.py`. Un tablero que ya tiene la línea no cambia. Si el tablero no tenía « · para aprobar», no se lo suma: la línea
  sola alinea con la 275, ya aprobada.
- `--registrar <etapa> [--canvas <ruta>]`: pone en `canvas.json` (o en el publicado, traído al scratchpad) el título del lienzo de
  cada tablero de la etapa con « · para aprobar» si su `<title>` lo tiene, el alto nuevo de los que crecieron (`ALTOS`) y los
  tableros nuevos (`NUEVOS`).

Los tableros los redibujan `e15_listados_1004.py`, `e15_respuesta_1004.py`, `e16_*_1004.py`, `e17_*_1004.py` y `e18_*_1004.py`.
Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import e14_panel_1004 as e14p  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
SUFIJO = " · para aprobar"

ETAPAS = {
    "15": ["FRM-Formularios-15", "M-FRM-Formularios-15", "FRM-Respuestas", "M-FRM-Respuestas", "FRM-Respuestas-Filtros",
           "FRM-Respuestas-Exportar", "FRM-Respuesta", "FRM-Respuesta-Completa", "M-FRM-Respuesta", "FRM-Tablero",
           "M-FRM-Tablero"],
    "16": ["FRM-Editor-16", "M-FRM-Editor-16", "FRM-Catalogo-16", "M-FRM-Catalogo-16", "FRM-Publicar-16",
           "WA-Chats-Formulario-16", "M-WA-Chats-Formulario-16", "FRM-Datos-Personas", "M-FRM-Datos-Personas",
           "FRM-Usuario-Datos", "M-FRM-Usuario-Datos", "FRM-Respuestas-16", "M-FRM-Respuestas-16"],
    "17": ["FRM-Formularios-17", "M-FRM-Formularios-17", "FRM-Editor-Baja", "M-FRM-Editor-Baja", "FRM-Dar-De-Baja",
           "FRM-Reactivar-Eliminar", "FRM-Copiar"],
    "18": ["FRM-Respuesta-18", "M-FRM-Respuesta-18", "FRM-Respuesta-Completa-18", "FRM-Respuestas-18", "M-FRM-Respuestas-18",
           "FRM-Editor-18", "M-FRM-Editor-18", "WA-Chats-Visor", "M-WA-Chats-Visor", "WA-Chats-Adjuntos", "M-WA-Chats-Adjuntos",
           "FRM-Publicar-18", "FRM-Dar-De-Baja-18", "WA-Chats-Respuesta-18", "M-WA-Conversacion-Respuesta-18",
           "FRM-Config-Org", "M-FRM-Config-Org", "FRM-Config-Plat"],
}
# El alto nuevo de los tableros que crecieron al redibujarlos (lo dicen los reportes de cada grupo).
ALTOS = {}
# Los tableros nuevos: su entrada entera en `canvas.json`. La Configuración de Formularios (E18, 270) va en la página de Formularios,
# al final de la fila de la E18 (la compu, y el teléfono debajo, como los demás de la etapa); la de Plataforma, al lado.
NUEVOS = {
    "FRM-Config-Org.dc.html": {"h": 900, "is_interactive": True, "page": "formularios", "w": 1440, "x": 13680, "y": 18334,
                               "title": "Administración · Formularios · Configuración (nueva) · el tamaño máximo de un archivo"},
    "FRM-Config-Plat.dc.html": {"h": 900, "is_interactive": True, "page": "formularios", "w": 1440, "x": 15200, "y": 18334,
                                "title": "Plataforma · Administración · Formularios · Configuración (nueva) · el máximo de un archivo"},
    "M-FRM-Config-Org.dc.html": {"h": 844, "is_interactive": True, "page": "formularios", "w": 390, "x": 2820, "y": 19854,
                                 "title": "Formularios · Configuración · teléfono (nueva)"},
}


def solapa(c, clave):
    """El tablero nuevo no pisa a otro de su página."""
    b = c["boards"][clave]
    for k, o in c["boards"].items():
        if k != clave and o.get("page") == b.get("page") and o["x"] < b["x"] + b["w"] and b["x"] < o["x"] + o["w"]                 and o["y"] < b["y"] + b["h"] and b["y"] < o["y"] + o["h"]:
            return k
    return None


def panel(etapa):
    for nombre in ETAPAS[etapa]:
        ruta = PROJ / f"{nombre}.dc.html"
        if not ruta.exists():
            continue
        t = ruta.read_text(encoding="utf-8")
        if 'aria-label="Gestión de formularios"' not in t:
            continue
        nuevo, n = e14p.PANEL.subn(lambda m: e14p.partir(m.group(0)), t)
        if e14p.BLOQUE not in nuevo:
            nuevo = nuevo.replace("</helmet>", e14p.CSS + "</helmet>", 1)
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
        print("ok panel", nombre, n, "(sin cambios)" if nuevo == t else "")


def registrar(etapa, ruta):
    texto = ruta.read_text(encoding="utf-8", newline="")
    c = json.loads(texto)
    for nombre in ETAPAS[etapa]:
        clave = f"{nombre}.dc.html"
        if clave in NUEVOS and clave not in c["boards"]:
            c["boards"][clave] = dict(NUEVOS[clave])
            c["order"].append(clave)
            assert not solapa(c, clave), (clave, solapa(c, clave))
        if clave not in c["boards"]:
            continue
        b = c["boards"][clave]
        t = (PROJ / clave).read_text(encoding="utf-8")
        html = re.search(r"<title>([^<]*)</title>", t).group(1)
        b["title"] = b["title"].removesuffix(SUFIJO) + (SUFIJO if html.endswith(SUFIJO) else "")
        if nombre in ALTOS:
            b["h"] = ALTOS[nombre]
    nl = "\r\n" if "\r\n" in texto else "\n"
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2).replace("\n", nl) + ("" if texto.endswith("}") else nl),
                    encoding="utf-8", newline="")
    print("ok", ruta, "etapa", etapa)


if __name__ == "__main__":
    if "--panel" in sys.argv:
        panel(sys.argv[sys.argv.index("--panel") + 1])
    if "--registrar" in sys.argv:
        destino = pathlib.Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else PROJ / "canvas.json"
        registrar(sys.argv[sys.argv.index("--registrar") + 1], destino)
