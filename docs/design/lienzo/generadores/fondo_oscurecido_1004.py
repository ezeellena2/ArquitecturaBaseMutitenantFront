"""Atrás de un diálogo, la pantalla solo oscurecida, sin difuminar (lo eligió el usuario el 2026-10-04, opción A). Es lo que dice y
dibuja Criterio · Diálogos. El estilo `.velo` de 172 tableros llevaba además `backdrop-filter: blur(4px)`; se saca en los tableros
vivos y en las copias de los generadores (bases, salidas y originales), para que no vuelva al regenerar. No se tocan los tableros de
Archivo ni la copia congelada `lienzo-v35`. Se puede volver a correr: solo saca lo que quede."""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
BLUR = " backdrop-filter: blur(4px);"

c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
archivos = [PROJ / k for k, v in sorted(c["boards"].items()) if v.get("page") != "archivo"]
archivos += sorted((PROJ / "generadores").rglob("*.dc.html"))
cambiados = 0
for ruta in archivos:
    t = ruta.read_text(encoding="utf-8")
    if ".velo {" not in t or BLUR not in t:
        continue
    nuevo = []
    for linea in t.split("\n"):
        if ".velo {" in linea:
            linea = linea.replace(BLUR, "")
        nuevo.append(linea)
    nuevo = "\n".join(nuevo)
    if nuevo != t:
        ruta.write_text(nuevo, encoding="utf-8")
        cambiados += 1
print("ok", cambiados, "archivos")
