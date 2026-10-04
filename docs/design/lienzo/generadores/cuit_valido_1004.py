"""Los CUIT de ejemplo pasan el dígito verificador (pesos 5, 4, 3, 2, 7, 6, 5, 4, 3, 2; 11 menos el resto). Ninguno de los tres
lo pasaba: 30-71234567-8, 30-71555444-2 y 30-12345678-9 terminan en 1. Lo encontró el relevamiento E1-E6 y entra en la tanda que
aprobó el usuario el 2026-10-04. No se tocan Archivo ni Criterio-Decisiones (la arma `criterio_decisiones.py`). Lleva
`data-vuelta="1004-cuit-valido"`; si ya la tiene, no se toca."""
import json
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-cuit-valido"'
CAMBIOS = {"30-71234567-8": "30-71234567-1", "30-71555444-2": "30-71555444-1", "30-12345678-9": "30-12345678-1"}


def digito(cuit):
    base = cuit.replace("-", "")[:10]
    resto = sum(int(d) * p for d, p in zip(base, (5, 4, 3, 2, 7, 6, 5, 4, 3, 2))) % 11
    return {0: 0, 1: None}.get(resto, 11 - resto)


assert all(digito(b) == int(b[-1]) for b in CAMBIOS.values())
paginas = {k: v.get("page") for k, v in json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))["boards"].items()}
for ruta in sorted(PROJ.glob("*.dc.html")):
    if paginas.get(ruta.name) == "archivo" or ruta.name == "Criterio-Decisiones.dc.html":
        continue
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t or not any(v in t for v in CAMBIOS):
        continue
    cab, cuerpo = t.split("</helmet>", 1)
    for viejo, bueno in CAMBIOS.items():
        cuerpo = cuerpo.replace(viejo, bueno)
    ruta.write_text(cab + f"<style {MARCA}>\n</style>\n</helmet>" + cuerpo, encoding="utf-8")
    print("ok", ruta.name[:-len(".dc.html")])
