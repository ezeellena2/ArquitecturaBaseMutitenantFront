"""La E13 y la E14 aprobadas por el usuario (v187, 2026-11-26; decisión 285 de la hoja de ruta de formularios), con la opción
recomendada en todas las preguntas: los treinta tableros que la v186 redibujó o tocó para la E13 y la E14 pierden « · para aprobar»
en su `<title>` y en `canvas.json` (la lista es `TANDA2` de `e14_panel_1004.py`: los de la E13 y la E14 con sus teléfonos,
`WA-Chats-Respuesta`, `M-WA-Conversacion-Respuesta`, los cuatro de la configuración de la base 2 que suman «Tiempo para contestar
un formulario», `FRM-Publicar`, `FRM-Publicando`, `FRM-Vista-Oficial` y `Campana-14`).

`--canvas <ruta>` escribe en otro `canvas.json` (el publicado, traído al scratchpad). Se puede volver a correr: lo ya cambiado no
cambia.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from e14_panel_1004 import TANDA2  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
SUFIJO = " · para aprobar"


def titulos():
    for n in TANDA2:
        ruta = PROJ / f"{n}.dc.html"
        t = ruta.read_text(encoding="utf-8")
        nuevo = re.sub(r"(<title>[^<]*?)" + re.escape(SUFIJO) + "</title>", r"\1</title>", t, count=1)
        assert SUFIJO not in re.search(r"<title>[^<]*</title>", nuevo).group(0), n
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
        print("ok", n, "(sin cambios)" if nuevo == t else "")


def canvas(ruta):
    texto = ruta.read_text(encoding="utf-8", newline="")
    c = json.loads(texto)
    for n in TANDA2:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].removesuffix(SUFIJO)
    nl = "\r\n" if "\r\n" in texto else "\n"
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2).replace("\n", nl) + ("" if texto.endswith("}") else nl),
                    encoding="utf-8", newline="")
    print("ok", ruta, len(TANDA2), "títulos")


if __name__ == "__main__":
    titulos()
    destino = pathlib.Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else PROJ / "canvas.json"
    canvas(destino)
