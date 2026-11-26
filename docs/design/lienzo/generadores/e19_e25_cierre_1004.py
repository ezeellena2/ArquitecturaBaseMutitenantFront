"""El cierre de la tanda 3B (v189, 2026-11-26): la E19 a la E25 y las diferencias de la base 2 aprobadas por el usuario (decisión 287
de la hoja de ruta de formularios), con la opción recomendada en cada pregunta.

Los tableros de la E19 a la E25 y los de la base 2 que tocó la 3B (`ETAPAS` de `e19_e25_registrar_1004.py`) pierden « · para
aprobar» en su `<title>` y en `canvas.json`. Lo demás que decidió la 287 lo dibujan `orden_filas_1004.py` (las filas debajo de una
flecha de orden, ordenadas de verdad) y `v189_formularios_1004.py`, `v189_version4_1004.py` y `v189_whatsapp_1004.py` (lo que quedó para alinear).

`--canvas <ruta>` escribe en otro `canvas.json` (el publicado, traído al scratchpad). Se puede volver a correr: lo ya cambiado no
cambia.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from e19_e25_registrar_1004 import ETAPAS  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
SUFIJO = " · para aprobar"
TABLEROS = [n for etapa in ("19", "20", "21", "22", "23", "24", "25", "base2") for n in ETAPAS[etapa]]


def titulos():
    cambiados = 0
    for n in TABLEROS:
        ruta = PROJ / f"{n}.dc.html"
        if not ruta.exists():
            continue
        t = ruta.read_text(encoding="utf-8")
        nuevo = re.sub(r"(<title>[^<]*?)" + re.escape(SUFIJO) + "</title>", r"\1</title>", t, count=1)
        assert SUFIJO not in re.search(r"<title>[^<]*</title>", nuevo).group(0), n
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8", newline="")
            cambiados += 1
    print("ok títulos", cambiados, "de", len(TABLEROS))


def canvas(ruta):
    texto = ruta.read_text(encoding="utf-8", newline="")
    c = json.loads(texto)
    k = 0
    for n in TABLEROS:
        b = c["boards"].get(f"{n}.dc.html")
        if b and b.get("title", "").endswith(SUFIJO):
            b["title"] = b["title"].removesuffix(SUFIJO)
            k += 1
    nl = "\r\n" if "\r\n" in texto else "\n"
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2).replace("\n", nl) + ("" if texto.endswith("}") else nl),
                    encoding="utf-8", newline="")
    print("ok", ruta, k, "títulos")


if __name__ == "__main__":
    titulos()
    canvas(pathlib.Path(sys.argv[sys.argv.index("--canvas") + 1]) if "--canvas" in sys.argv else PROJ / "canvas.json")
