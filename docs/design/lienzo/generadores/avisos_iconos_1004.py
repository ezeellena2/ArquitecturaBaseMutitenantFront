"""El ícono del error en los avisos (lienzo v175, 2026-11-18), con la decisión 210 de la hoja de ruta del back (AV1-A de
ArquitecturaBase): cada tipo de aviso tiene su ícono, del color de su filo: la tilde para lo que salió bien, la (i) para la
información, el triángulo para la atención y **el octógono con una cruz para el error**. Los tableros dibujaban el error con un
círculo y un «!», el mismo de la ⓘ del aviso importante.

Cambia ese círculo por el octógono solo adentro de un aviso de error: el ícono de `<span class="mal">` y `<span class="ic-mal">`
(los avisos de abajo y la franja del teléfono), el del aviso de abajo que dibujan los tableros con `{{avisoError}}`, y el de la franja
de error de un formulario (`aviso-mal`) y de un aviso de error de una página (`p-aviso mal`). El aviso de atención de una página o
de un diálogo (`p-aviso` sin `mal`, como el de WhatsApp de la baja) lleva el triángulo. La ⓘ y los demás círculos no cambian.
El filo de cada tipo lo pone `traspaso10_piezas_1004.py` (`CSS_AVISOS`).

Corre al final de todo, después de `reglas_t15_1004.py` y antes de la pasada de las piezas, sobre los tableros vivos; al terminar
imprime los que cambió. Se puede volver a correr: lo que ya tiene el octógono no vuelve a encontrar el círculo.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
CIRCULO = '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>'
OCTOGONO = '<path d="M8.7 3h6.6L21 8.7v6.6L15.3 21H8.7L3 15.3V8.7z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/>'
# Lo que abre un aviso de error, hasta su primer `<svg …>`: el ícono que sigue es el del tipo.
ERROR = re.compile(
    r'(<span class="(?:mal|ic-mal)"[^>]*>\s*<svg\b[^>]*>'
    r'|value="\{\{avisoError\}\}"[^>]*>\s*<svg\b[^>]*>'
    r'|class="aviso-mal[^"]*"[^>]*>\s*<svg\b[^>]*>'
    r'|class="p-aviso mal"[^>]*>\s*(?:<span[^>]*>\s*)?<svg\b[^>]*>)' + re.escape(CIRCULO))
# El aviso de atención de una página o de un diálogo (`p-aviso` sin `mal`) lleva el triángulo, como el cartel de atención.
TRIANGULO = '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'
ATENCION = re.compile(r'(class="p-aviso\s*"[^>]*>\s*(?:<span[^>]*>\s*)?<svg\b[^>]*>)' + re.escape(CIRCULO))


def leer(nombre):
    with open(PROJ / nombre, encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / nombre, "w", encoding="utf-8", newline="") as f:
        f.write(t)


if __name__ == "__main__":
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    vivos = sorted(n for n, b in canvas["boards"].items() if b.get("page") != "archivo")
    cambiados, total = [], 0
    for nombre in vivos:
        t = leer(nombre)
        nuevo, n = ERROR.subn(lambda m: m.group(1) + OCTOGONO, t)
        nuevo, k = ATENCION.subn(lambda m: m.group(1) + TRIANGULO, nuevo)
        n += k
        if n:
            escribir(nombre, nuevo)
            cambiados.append(nombre.removesuffix(".dc.html"))
            total += n
    print("ok", len(vivos), "tableros vivos,", total, "íconos en", len(cambiados), "tableros")
    if cambiados:
        print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(cambiados))
