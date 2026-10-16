"""Vacía la página «Archivo» del lienzo (pedido del usuario, 2026-10-13): saca sus 14 tableros descartados, sus notas y la página.
Ningún otro tablero enlaza a ellos. Borra los archivos de la carpeta; en la publicación van como `null`. Se puede volver a correr."""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
tableros = [k for k, v in c["boards"].items() if v.get("page") == "archivo"]
for k in tableros:
    del c["boards"][k]
    if k in c["order"]:
        c["order"].remove(k)
    (PROJ / k).unlink(missing_ok=True)
for k in [k for k, v in c["notes"].items() if v.get("page") == "archivo"]:
    del c["notes"][k]
c["pages"] = [p for p in c["pages"] if p["id"] != "archivo"]
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("sin Archivo:", tableros)
