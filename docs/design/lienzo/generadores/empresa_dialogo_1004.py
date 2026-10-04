"""Ficha de Empresa, diálogo de roles de un miembro: el error general («Tiene que quedar al menos un administrador en la empresa.»)
va como franja roja clara arriba de los botones, como pide Criterio · Formularios, y no como texto rojo suelto (lo marcó la Guía
al aprobar F7, 2026-10-04). Lleva `data-vuelta="1004-empresa-dialogo"`; si ya la tiene, no se toca."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-empresa-dialogo"'
ALERTA = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/></svg>')
CSS = """<style data-vuelta="1004-empresa-dialogo">
.aviso-mal { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: var(--peligro-t); color: oklch(0.45 0.17 25); font-size: 13px; }
.aviso-mal svg { flex-shrink: 0; }
</style>"""

ruta = PROJ / "Empresa.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    viejo = '<sc-if value="{{errRoles}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{errRoles}}</span></sc-if>'
    assert t.count(viejo) == 1
    t = t.replace(viejo, f'<sc-if value="{{{{errRoles}}}}" hint-placeholder-val="{{{{no}}}}"><div class="aviso-mal" role="alert">{ALERTA} {{{{errRoles}}}}</div></sc-if>')
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", CSS + "\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok Empresa")
