"""El buscador de las listas mide 36 de alto y 360 de ancho, como dicen Criterio · Tablas, Formularios y Menús y como lo dibujan
las listas de WhatsApp (`.w-bus`). Lo marcó la Guía en R1 (2026-10-04) y entra en la tanda que aprobó el usuario. Los nueve tableros
con el buscador viejo (`.fb-bus`, de 32 y 300) son Usuarios, Roles, Empresas, Empresa, Auditoria-Org, Organizaciones, Cuentas,
Recuperaciones y Auditoria-Plat. La lupa va de 16 a 12 del borde, y el texto en 13 a 36. No se tocan Directorio ni M-Directorio,
que son del sitio público. Lleva `data-vuelta="1004-buscador-36"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-buscador-36"'
TABLEROS = ["Usuarios", "Roles", "Empresas", "Empresa", "Auditoria-Org", "Organizaciones", "Cuentas", "Recuperaciones", "Auditoria-Plat"]
CSS = f"""<style {MARCA}>
.fb-bus {{ flex: 0 1 360px; max-width: 360px; }}
.fb-bus input {{ height: 36px; padding-left: 36px; border-radius: 8px; font-size: 13px; }}
.fb-bus svg {{ left: 12px; width: 16px; height: 16px; }}
</style>"""

for nombre in TABLEROS:
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    assert 'class="fb-bus"' in t and t.count("</helmet>") == 1, nombre
    ruta.write_text(t.replace("</helmet>", CSS + "\n</helmet>"), encoding="utf-8")
    print("ok", nombre)
