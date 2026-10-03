"""Alinea el detalle de Auditoría de Plataforma con Criterio-Dialogos.

Solicitud del usuario del 2026-10-03. Conserva el contenido y la lógica del
tablero; en teléfono usa el diálogo inferior de ancho completo.
"""
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent


def alinear(nombre, movil):
    ruta = PROJ / f"{nombre}.dc.html"
    html = ruta.read_text(encoding="utf-8")
    radio = "12px 12px 0 0" if movil else "12px"
    ancho = "100%" if movil else "560px"
    maximo = "100%" if movil else "calc(100% - 32px)"
    reglas = {
        ".dlg": f"width: {ancho}; max-width: {maximo}; background: #fff; border-radius: {radio}; box-shadow: 0 24px 48px oklch(0.2 0.014 78 / 0.28); overflow: hidden; display: flex; flex-direction: column; font-size: 13px; line-height: 1.5; color: var(--t1);",
        ".dlg-h": "display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 48px; box-sizing: border-box; padding: 0 8px 0 20px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76);",
        ".dlg-h h2": "margin: 0; padding: 10px 0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.4; color: var(--t1); overflow-wrap: anywhere;",
        ".dlg-x": "width: 32px; height: 32px; flex-shrink: 0; border: 0; border-radius: 8px; background: transparent; color: var(--t3); display: inline-flex; align-items: center; justify-content: center; cursor: pointer;",
        ".dlg-t": "padding: 20px; font-size: 13px; color: var(--t2); line-height: 1.55;",
        ".dlg-f": "display: flex; justify-content: flex-end; gap: 8px; min-height: 60px; box-sizing: border-box; padding: 12px 20px; border-top: 1px solid var(--borde);",
        ".cambios": "display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 10px 14px; font-size: 13px; overflow-wrap: anywhere;",
    }
    for selector, cuerpo in reglas.items():
        patron = re.escape(selector) + r" \{[^}]*\}"
        html, cantidad = re.subn(patron, lambda _: f"{selector} {{ {cuerpo} }}", html)
        assert cantidad >= 2, (nombre, selector, cantidad)
    if movil:
        html = re.sub(r"(\.velo \{[^}]*align-items: )center", r"\1flex-end", html)
    titulo_viejo = '<div><h2 id="dlg-det">{{detQue}}</h2><p>{{detCuando}}</p></div>'
    html = html.replace(titulo_viejo, '<h2 id="dlg-det">{{detQue}}</h2>')
    fecha = '<span class="k">Fecha y hora</span><span>{{detCuando}}</span>'
    if fecha not in html:
        html = html.replace('<div class="cambios">', '<div class="cambios">\n            ' + fecha, 1)
    boton = '<div class="dlg-f"><button type="button" class="b b-sec" onClick="{{cerrarDialogo}}">Cerrar</button></div>'
    clase = 'class="dlg-cerrar"'
    html = html.replace(boton, boton.replace('class="b b-sec"', clase))
    if ".dlg-cerrar {" not in html:
        estilo = '.dlg-cerrar { height: 36px; padding: 0 14px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; color: var(--t1); font-size: 13px; font-weight: 600; cursor: pointer;'
        estilo += ' width: 100%;' if movil else ''
        estilo += ' }\n    .dlg-cerrar:hover { background: var(--s2); }\n    .dlg-cerrar:focus-visible { outline: 3px solid var(--marca); outline-offset: 2px; }'
        html = html.replace('    .dlg-f {', '    ' + estilo + '\n    .dlg-f {', 1)
    assert titulo_viejo not in html and fecha in html and clase in html
    ruta.write_text(html, encoding="utf-8")
    print(nombre, "ok")


if __name__ == "__main__":
    alinear("Auditoria-Plat", False)
    # El teléfono (M-Auditoria-Plat) es app desde el 2026-10-03: lo arma plat_personal_telefonos_1004.py.
