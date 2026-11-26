"""La E12 aprobada por el usuario (v186, 2026-11-26), con las respuestas recomendadas de la tanda 1:
- los quince tableros de la E12 pierden « · para aprobar» en su `<title>` y en `canvas.json`;
- `FRM-Catalogo-Importar`, durante la revisión: «Desde» y «Cambiar» apagados dicen «Para cambiar el origen, cancelá y volvé a
  importar.» (115 y 211): en el `title` de los dos en cada estado de la revisión, y abierto en un tooltip sobre «Desde» en
  «Revisión: altas» y sobre «Cambiar» en «Revisión: cambios». «Cambiar» pasa de `disabled` a `aria-disabled`, para que se alcance
  con Tab y diga su motivo;
- `FRM-Catalogos`: el resumen dice solo «7 catálogos», sin «6 activos».
El campo de ejemplo de la E13 en la propuesta sigue siendo «Área»: la spec de la E13 nombra campos de «Proveedores» (CUIT, Zona,
Plazo de pago) y «Rubro», ninguno de «Motivos de visita». Se puede volver a correr: lo ya cambiado no cambia.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
SUFIJO = " · para aprobar"
E12 = ["FRM-Catalogos", "FRM-Catalogo", "FRM-Catalogo-Opciones", "FRM-Catalogo-Ordenar", "FRM-Catalogo-Importar",
       "FRM-Catalogo-Filtros", "FRM-Catalogo-Contactos", "FRM-Catalogo-Opciones-Propuesta"]
E12 += [f"M-{n}" for n in E12 if n != "FRM-Catalogo-Importar"]
MOTIVO = "Para cambiar el origen, cancelá y volvé a importar."
# Revisando, Revisión: errores, altas, cambios y bajas, Muchas bajas, Muchas filas con error, Un valor ambiguo, Otra persona guardó.
REVISION = ["s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15", "s17"]
ABRE_DESDE, ABRE_CAMBIAR = "s10", "s11"


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def escribir(n, t, antes):
    if t != antes:
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8", newline="")
    print("ok", n, "(sin cambios)" if t == antes else "")


def titulos():
    for n in E12:
        t = leer(n)
        nuevo = re.sub(r"(<title>[^<]*?)" + re.escape(SUFIJO) + "</title>", r"\1</title>", t, count=1)
        assert SUFIJO not in nuevo, n
        escribir(n, nuevo, t)
    ruta = PROJ / "canvas.json"
    texto = ruta.read_text(encoding="utf-8", newline="")
    c = json.loads(texto)
    for n in E12:
        b = c["boards"][f"{n}.dc.html"]
        b["title"] = b["title"].removesuffix(SUFIJO)
    # con el salto de línea que ya tenía (git lo normaliza al commitear)
    nl = "\r\n" if "\r\n" in texto else "\n"
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2).replace("\n", nl) + ("" if texto.endswith("}") else nl),
                    encoding="utf-8", newline="")


def bloque(t, var):
    m = re.search(r'<sc-if value="\{\{' + var + r'\}\}"[^>]*>', t)
    return m.end(), t.index("</sc-if>", m.end())


def importar():
    n = "FRM-Catalogo-Importar"
    t = antes = leer(n)
    if MOTIVO in t:
        return escribir(n, t, antes)
    tip = f'<span class="acc-tip" role="tooltip">{MOTIVO}</span>'
    for var in REVISION:
        i, e = bloque(t, var)
        b = t[i:e]
        desde = '<button type="button" class="b2-pkc apag" aria-haspopup="listbox" aria-expanded="false" aria-label="Desde" aria-disabled="true">'
        assert b.count(desde) == 1, (var, "desde")
        b = b.replace(desde, desde[:-1] + f' title="{MOTIVO}">')
        if var == ABRE_DESDE:
            j = b.index(desde[:-1])
            k = b.index("</button>", j) + len("</button>")
            b = b[:k] + tip + b[k:]
        cambiar = '<button type="button" class="cb cb-sec" disabled>Cambiar</button>'
        assert b.count(cambiar) == 1, (var, "cambiar")
        nuevo = f'<button type="button" class="cb cb-sec" aria-disabled="true" title="{MOTIVO}">Cambiar</button>'
        if var == ABRE_CAMBIAR:
            nuevo = f'<span class="b2-env" style="display: inline-flex;">{nuevo}{tip}</span>'
        b = b.replace(cambiar, nuevo)
        t = t[:i] + b + t[e:]
    escribir(n, t, antes)


def catalogos():
    n = "FRM-Catalogos"
    t = antes = leer(n)
    t = t.replace("'7 catálogos · 6 activos'", "'7 catálogos'")
    assert "6 activos" not in t
    escribir(n, t, antes)


if __name__ == "__main__":
    titulos()
    importar()
    catalogos()
