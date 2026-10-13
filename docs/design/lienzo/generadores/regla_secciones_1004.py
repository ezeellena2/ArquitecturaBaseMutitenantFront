"""Regla única para secciones, pestañas y filtros (el usuario, 2026-10-13): «tenemos que definir siempre la misma manera de trabajar
los submódulos y las pestañas, no mezclemos formas». Suma la sección a Criterio · Menús, después de «Filtros». Se puede volver a correr."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
ARCHIVO = PROJ / "Criterio-Menus.dc.html"
MARCA = 'data-regla="secciones-1004"'
ALTO = 3380

COLS = "220px minmax(0, 1fr) minmax(0, 1fr) 300px"
FILAS = [
    ("Secciones de un área", "Un segundo panel al lado del menú. El ítem del menú lleva la flechita y abre el panel, uno a la vez.",
     "Un grupo en «Más», con una fila por sección.", "WhatsApp (Chats, Contactos, Difusiones), Formularios (Formularios, Catálogos) y Administración."),
    ("Grupos de datos de una ficha", "Pestañas debajo de la banda, una por grupo de datos. La acción de la banda cambia con la pestaña.",
     "Pestañas debajo de la barra.", "Empresa (Miembros, Roles), la ficha de una organización y la de un formulario (Preguntas, Inglés, Publicación)."),
    ("Filtros de un listado", "Desplegables en la caja de filtros, con la cantidad de cada opción. Lo elegido va en petróleo, con «Limpiar filtros».",
     "El botón «Filtros» de la barra abre una hoja. Con algo elegido, el botón lleva un punto.", "Usuarios, Contactos, Formularios y Catálogos."),
    ("Dos vistas de la misma lista", "Un control segmentado arriba de la lista.", "Un control segmentado debajo de la barra.",
     "Chats (Clientes | Internos), las plantillas de Plataforma (Para consultas | Del sistema) y Uso del asistente (Por día | Por persona)."),
]


def seccion():
    cab = f'<div class="cab" style="grid-template-columns: {COLS};"><span>Qué es</span><span>En la compu</span><span>En el teléfono</span><span>Ejemplos</span></div>'
    filas = "".join(f'<div class="fil" style="grid-template-columns: {COLS}; font-size: 13px; line-height: 1.45;"><strong>{a}</strong><span>{b}</span><span>{c}</span>'
                    f'<span style="color: var(--t2);">{d}</span></div>' for a, b, c, d in FILAS)
    return f"""<section {MARCA}>
    <h2>Secciones, pestañas y filtros</h2>
    <p style="margin: 0; color: var(--t2); max-width: 900px;">Una sola forma para cada cosa, en todas las pantallas. Una pantalla nueva usa una de estas cuatro; no inventa otra.</p>
    <div class="medidas">
      {cab}
      {filas}
    </div>
    <p style="margin: 6px 0 0; font-weight: 600;">Prohibido</p>
    <ul class="prohibido">
      <li>Pestañas para filtrar un listado.</li>
      <li>Pestañas para ir a otra sección del área.</li>
      <li>Dos filas de pestañas en la misma pantalla.</li>
      <li>Una forma nueva para una pantalla nueva.</li>
    </ul>
  </section>

  """


t = ARCHIVO.read_text(encoding="utf-8")
if MARCA in t:
    # Se rehace con el texto de ahora (el 13/10 el usuario sumó «Dos vistas de la misma lista» y el punto del teléfono).
    i = t.index(f"<section {MARCA}>")
    k = t.index("<section", t.index("</section>", i))
    t = t[:i] + t[k:]
if True:
    i = t.index("<h2>Filtros</h2>")
    fin = t.index("</section>", i) + len("</section>")
    k = t.index("<section", fin)
    t = t[:k] + seccion() + t[k:]
    t = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", t, count=1)
    t = t.replace('"$preview":{"width":1440,"height":2900}', f'"$preview":{{"width":1440,"height":{ALTO}}}')
    ARCHIVO.write_text(t, encoding="utf-8")
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    c["boards"]["Criterio-Menus.dc.html"]["h"] = ALTO
    (PROJ / "canvas.json").write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Criterio-Menus con la regla")

# ---- Uso del asistente: «Por día | Por persona» son dos vistas de la misma lista, así que van con control segmentado (13/10).
# Corre después de asistente_admin_1004.py, que arma esos tableros con pestañas.
CSS_VSEG = {
    "Asistente-Uso-Org": """.as-tabs.as-vseg { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); border-bottom: 0; align-self: flex-start; width: 300px; }
.as-tabs.as-vseg button { height: 30px; border-radius: 8px; font-size: 13px; color: var(--t2); }
.as-tabs.as-vseg button.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.as-tabs.as-vseg button.on::after { display: none; }
""",
    "M-Asistente-Uso-Org": """.as-tabs.as-vseg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 12px; background: var(--s3); border-bottom: 0; margin: 4px 0 8px; }
.as-tabs.as-vseg button { height: 38px; border-radius: 9px; font-size: 14.5px; color: var(--t2); }
.as-tabs.as-vseg button.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.as-tabs.as-vseg button.on::after { display: none; }
""",
}
for nombre, css in CSS_VSEG.items():
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if "as-vseg" in t:
        continue
    t = re.sub(r'<div class="as-tabs( as-ttabs)?" role="tablist">', lambda m: f'<div class="as-tabs{m.group(1) or ""} as-vseg" role="radiogroup" aria-label="Ver">', t)
    t = t.replace('<button type="button" role="tab" aria-selected="{{selDia}}"', '<button type="button" role="radio" aria-checked="{{selDia}}"')
    t = t.replace('<button type="button" role="tab" aria-selected="{{selPer}}"', '<button type="button" role="radio" aria-checked="{{selPer}}"')
    t = t.replace('<button type="button" role="tab" class="{{tabDia}}"', '<button type="button" role="radio" class="{{tabDia}}"')
    t = t.replace('<button type="button" role="tab" class="{{tabPer}}"', '<button type="button" role="radio" class="{{tabPer}}"')
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", f'<style data-regla="vistas-1004">\n{css}</style>\n</helmet>')
    ruta.write_text(t, encoding="utf-8")
    print(nombre, "con control segmentado")
