"""Etapa 17 ajustada al editor de formularios de una sola pantalla (decisión 18 de la hoja de ruta, 17/10).

La 17 no existe en ArquitecturaBase: sus tableros se quedan y solo se ajustan al editor nuevo. En la ficha de una plantilla
de Plataforma, la pestaña «Plantilla» pasa a ser el editor de la E12 (Textos en, la plantilla con su categoría y su
descripción, las preguntas que se abren en el lugar y «Así lo ve el empleado»); se van las pestañas «Preguntas» e
«Inglés». Catálogos y Publicación siguen como estaban. Las piezas viven en `formularios_biblioteca_1004.py`; este archivo
solo vuelve a escribir los tres tableros que usan la ficha y sus posiciones, sin tocar los demás de la 17.
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_1004 as F  # noqa: E402
import formularios_ab_1004 as A  # noqa: E402
import formularios_biblioteca_1004 as B  # noqa: E402

PROJ = F.PROJ
E17_AJUSTE_APROBADO = True
TABLEROS = {"Plat-FRM-Plantilla": B.plantilla_ficha, "Plat-FRM-Publicar": B.plantilla_publicar, "Plat-FRM-Retirar": B.plantilla_retirar}


def registrar():
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    for n in TABLEROS:
        b = c["boards"][f"{n}.dc.html"]
        b["h"] = 1100
        b["title"] = b["title"].replace(A.PARA_APROBAR, "") + ("" if E17_AJUSTE_APROBADO else A.PARA_APROBAR)
        b["is_interactive"] = True
    (PROJ / "canvas.json").write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    for n, f in TABLEROS.items():
        t = f().replace('"$preview":{"width":1440,"height":900}', '"$preview":{"width":1440,"height":1100}', 1)
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    registrar()
    print("tableros", list(TABLEROS))
