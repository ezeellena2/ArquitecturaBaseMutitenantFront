"""Aplica el criterio a tableros existentes sin tocar sus recorridos: un bloque de estilo que pisa las medidas
del tema y, donde hace falta, arreglos puntuales del marcado. Uso: python aplicar_criterio.py Tablero1 Tablero2 ..."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json

ARENA_CAB = "oklch(0.945 0.018 76)"
ARENA_CAB_B = "oklch(0.89 0.02 76)"

BLOQUE = f"""  <style data-criterio="aplicado">
/* Botones: 4 tipos y 2 tamaños (36 y 32); 44 solo en ingreso y registro. Esquinas de 8 (10 en los grandes). */
.b {{ height: 36px !important; padding: 0 14px !important; border-radius: 8px !important; font-size: 14px !important; font-weight: 600 !important; gap: 6px !important; }}
.b-sm {{ height: 32px !important; padding: 0 12px !important; font-size: 13px !important; border-radius: 8px !important; }}
.b-lg, .b.lg {{ height: 44px !important; padding: 0 18px !important; font-size: 15px !important; border-radius: 10px !important; }}
.b-sec {{ border-color: var(--borde2) !important; }}
.b-pel {{ background: #fff !important; border: 1px solid oklch(0.57 0.2 25 / 0.4) !important; color: oklch(0.52 0.19 25) !important; }}
.dlg-f .b-pel, .velo .b-pel {{ background: oklch(0.55 0.2 25) !important; border-color: oklch(0.55 0.2 25) !important; color: #fff !important; }}
.b-google {{ height: 44px !important; border-radius: 10px !important; border-color: var(--borde2) !important; }}
.kebab, .ico-btn {{ width: 32px !important; height: 32px !important; border-radius: 8px !important; }}
/* Campos: 36 en la app; en ingreso y registro, a la altura de sus botones (44). El código, 44. */
.in2 {{ height: 36px; border-radius: 8px !important; border-color: var(--borde2) !important; font-size: 13.5px !important; }}
.in2.lg {{ height: 44px !important; font-size: 15px !important; border-radius: 10px !important; }}
textarea.in2 {{ height: auto; min-height: 84px; }}
.otp input {{ height: 44px !important; border-radius: 8px !important; }}
.et {{ font-size: 12.5px !important; font-weight: 600 !important; color: var(--t2) !important; }}
.err2 {{ font-size: 12.5px !important; }}
/* Encabezados con color: arena, sin mayúsculas, 40 de alto en tablas y 48 en diálogos. */
.tt-h, .tt-h.gris {{ background: {ARENA_CAB} !important; border-bottom-color: {ARENA_CAB_B} !important; text-transform: none !important; letter-spacing: 0 !important; min-height: 40px !important; height: 40px !important; font-size: 13px !important; }}
.tt-f {{ min-height: 40px !important; font-size: 13px !important; box-sizing: border-box !important; padding-top: 4px !important; padding-bottom: 4px !important; }}
.tt-h {{ box-sizing: border-box !important; }}
.dlg-h {{ background: {ARENA_CAB} !important; border-bottom-color: {ARENA_CAB_B} !important; padding-top: 12px !important; padding-bottom: 12px !important; }}
.dlg-h h2 {{ font-size: 15px !important; font-weight: 600 !important; }}
.dlg-h p {{ display: none !important; }}
/* Estados: punto de color y palabra, sin fondo ni etiqueta. */
.pill {{ background: transparent !important; padding: 0 !important; color: var(--t1) !important; font-size: 13px !important; font-weight: 400 !important; }}
.pill::before {{ width: 8px !important; height: 8px !important; }}
.pill.ok::before {{ background: oklch(0.6 0.13 155) !important; }}
.pill.pend::before {{ background: var(--marca) !important; }}
.pill.alerta::before {{ background: oklch(0.72 0.15 70) !important; }}
.pill.mal::before {{ background: oklch(0.57 0.2 25) !important; }}
.pill.off {{ color: var(--t2) !important; }}
.pill.off::before {{ background: oklch(0.75 0.01 78) !important; }}
.rol, .rol.sis {{ background: transparent !important; padding: 0 !important; font-weight: 400 !important; color: var(--t1) !important; font-size: 13px !important; }}
.roles {{ gap: 0 !important; }}
.roles .rol + .rol::before {{ content: ", "; }}
/* Sin etiquetas con fondo: el rótulo chico del panel de la marca queda como texto. */
.kicker {{ background: transparent !important; padding: 0 !important; border: 0 !important; font-size: 13px !important; font-weight: 600 !important; }}
/* Banda: al lado del título no va nada; estado, «De sistema» y «Cambios sin guardar» van en la segunda línea, separados por un punto medio. */
.banda-pag .res {{ display: flex !important; align-items: center; flex-wrap: wrap; gap: 6px; }}
.banda-pag .res > :empty {{ display: none !important; }}
.banda-pag .res > * + *::before {{ content: "·"; color: var(--t3); margin-right: 6px; }}
.banda-pag .res .rol {{ color: var(--t2) !important; }}
.banda-pag .res .sucio {{ color: oklch(0.5 0.12 70) !important; font-weight: 500 !important; }}
/* La cantidad de una pestaña, en gris y sin fondo. */
.cnt {{ background: transparent !important; padding: 0 !important; color: var(--t3) !important; font-weight: 500 !important; }}
/* El error de una acción directa: borde rojo y ✕; no se va solo. */
.toast2.mal {{ border-color: oklch(0.57 0.2 25 / 0.45) !important; }}
/* Formularios: cada título de sección es un encabezado arena a lo ancho de la caja (el «colorcito»), sin líneas sueltas. */
.hoja {{ overflow: hidden; }}
.hoja:has(> h2:first-child) {{ padding-top: 0 !important; }}
.hoja .campo2.ancho > input.in2 {{ max-width: 420px; }}
.hoja h2 {{ grid-column: 1 / -1; margin: 0 -20px !important; padding: 10px 20px !important; background: {ARENA_CAB}; border-bottom: 1px solid {ARENA_CAB_B}; font-size: 13.5px !important; font-weight: 600 !important; }}
.hoja h2:not(:first-child) {{ border-top: 1px solid {ARENA_CAB_B}; margin-top: 6px !important; }}
.hoja .linea {{ display: none !important; }}
  </style>"""


def aplicar(nombre):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    t = re.sub(r'\n  <style data-criterio="aplicado">.*?</style>', "", t, flags=re.S)
    ini = t.index("</helmet>")
    t = t[:ini] + BLOQUE + "\n" + t[ini:]
    # Sin ayudas debajo de los campos (criterio de formularios).
    t, n_ayudas = re.subn(r'<span class="ayuda">[^<]*</span>', "", t)
    ruta.write_text(t, encoding="utf-8")
    return n_ayudas


if __name__ == "__main__":
    for nombre in sys.argv[1:]:
        print(nombre, "ayudas quitadas:", aplicar(nombre))
