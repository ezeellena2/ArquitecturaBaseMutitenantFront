"""E11 · «Editar contacto» como la app (pedido del Coordinador de la 11, 2026-10-16; front 485db5d8): el nombre es opcional,
porque un contacto que llega por WhatsApp puede no tenerlo, y «Guardar cambios» va apagado hasta que se cambia algo.
En WA-Contacto y M-WA-Contacto; corre después de `etapa11_tanda_b_1004.py`. Se puede volver a correr."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def cierre(t, i):
    """Índice de inicio y fin del <sc-if> que empieza en i, con los anidados."""
    d = 0
    k = i
    while True:
        a = t.find("<sc-if", k)
        c = t.find("</sc-if>", k)
        if a != -1 and a < c:
            d += 1
            k = a + 6
        else:
            d -= 1
            k = c + 8
            if d == 0:
                return i, k


def apagar(t, estado, viejo, nuevo):
    """Reemplaza `viejo` por `nuevo` en el bloque del estado que lo contiene (un estado puede tener varios bloques)."""
    i = -1
    while True:
        i = t.index('<sc-if value="{{%s}}"' % estado, i + 1)
        a, z = cierre(t, i)
        b = t[a:z]
        if viejo in b:
            assert b.count(viejo) == 1, estado
            return t[:a] + b.replace(viejo, nuevo) + t[z:]


def escritorio():
    ruta = PROJ / "WA-Contacto.dc.html"
    t = ruta.read_text(encoding="utf-8")
    viejo = 'Nombre <span style="color: var(--peligro);">*</span>'
    if viejo not in t:
        print("WA-Contacto ya está")
        return
    assert t.count(viejo) == 3, t.count(viejo)
    t = t.replace(viejo, "Nombre")
    # Recién abierto (e1) y escribiendo una etiqueta nueva (e5) no hay cambios: «Guardar cambios» apagado.
    boton = '<button type="button" class="cb cb-pri">Guardar cambios</button>'
    for n in ("e1", "e5"):
        t = apagar(t, n, boton, '<button type="button" class="cb cb-pri" disabled>Guardar cambios</button>')
    t = t.replace("</helmet>", '<style data-e11="contacto">\n.w-dlg .df .cb[disabled] { opacity: 0.55; cursor: default; }\n</style>\n</helmet>', 1)
    ruta.write_text(t, encoding="utf-8")
    print("WA-Contacto: nombre opcional y guardar apagado sin cambios")


def telefono():
    ruta = PROJ / "M-WA-Contacto.dc.html"
    t = ruta.read_text(encoding="utf-8")
    viejo = '<span>Nombre <span class="rq">*</span></span>'
    if viejo not in t:
        print("M-WA-Contacto ya está")
        return
    assert t.count(viejo) == 4, t.count(viejo)
    t = t.replace(viejo, "<span>Nombre</span>")
    # «Editar contacto» (e1) y «Crear «VIP»» (e6), sin cambios todavía.
    boton = '<button type="button" class="cb cb-pri">Guardar</button>'
    for n in ("e1", "e6"):
        t = apagar(t, n, boton, '<button type="button" class="cb cb-pri e11b-apag" aria-disabled="true">Guardar</button>')
    ruta.write_text(t, encoding="utf-8")
    print("M-WA-Contacto: nombre opcional y guardar apagado sin cambios")


if __name__ == "__main__":
    escritorio()
    telefono()
