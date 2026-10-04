"""Marco del criterio en los 16 tableros que seguían con el marco viejo (`ab-sidebar`). Lo marcó la Guía al comparar la app (R1,
2026-10-04), y el usuario aprobó la tanda. Son 8 de Organización (Inicio-Org, Usuarios, Roles, Empresas, Empresa, Auditoria-Org,
Error-Org e Inicio-Miembro) y 8 de Plataforma (Organizaciones, Organizacion, Cuentas, Cuenta-Plat, Recuperaciones, Auditoria-Plat,
Legales y Config-Plat).
- Medidas de Usuario.dc.html (`.w-mk`, `.w-cx`, `.w-nav`, `.w-us`, `.w-tb`). El perfil va en 14/700 con la línea de 12,5 debajo,
  12 y 14 de relleno. Las opciones, de 32 en 400, con 2 px entre filas y la línea fina en el medio. El pie, con avatar de 32, el
  nombre en 13/700 y el correo en 12. Las migas, en 13 y en el gris del texto, sin el azulado.
- Sin el ☰ de la barra de arriba (decisión del usuario): para achicar el menú queda la flecha redonda del borde (Criterio · Menús).
- Plataforma › Administración: WhatsApp deja de ser un subtítulo con sus cuatro opciones siempre a la vista y pasa a ser un grupo
  cerrado que lleva a Número (Plat-WA-Numero), como manda la regla del panel de la v102. Esos tableros suman además el CSS del
  panel de `panel_admin_1004.py`.
Corre después de panel_admin_1004.py. Lleva `data-vuelta="1004-marco-criterio"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-marco-criterio"'
ORG = ["Inicio-Org", "Usuarios", "Roles", "Empresas", "Empresa", "Auditoria-Org", "Error-Org", "Inicio-Miembro"]
PLAT = ["Organizaciones", "Organizacion", "Cuentas", "Cuenta-Plat", "Recuperaciones", "Auditoria-Plat", "Legales", "Config-Plat"]
CSS = f"""<style {MARCA}>
.ab-sidebar__head {{ height: 53px; box-sizing: border-box; padding: 0 14px !important; }}
.scope {{ padding: 12px 14px !important; border-bottom: 0 !important; }}
.scope-name {{ font-size: 14px !important; font-weight: 700 !important; line-height: 18.9px !important; color: var(--t1) !important; }}
.scope-detail {{ margin: 0 !important; font-size: 12.5px !important; line-height: 18.9px !important; color: var(--t3) !important; }}
.ab-sidebar > .ab-sidebar__nav {{ padding: 4px 8px 0 !important; }}
.ab-sidebar .admin-grupo {{ margin: auto -8px 0 !important; padding: 8px !important; border-top: 1px solid oklch(0.87 0.022 75) !important; }}
.ab-sidebar .ab-sidebar__list {{ display: flex; flex-direction: column; gap: 2px; }}
.ab-sidebar .ab-sidebar__list > li {{ position: relative; margin: 0; border-top: 0 !important; padding-top: 0 !important; }}
.ab-sidebar .ab-sidebar__list > li + li::before {{ content: ""; position: absolute; left: 0; right: 0; top: -2px; height: 1px; background: oklch(0.87 0.022 75); }}
.ab-sidebar .ab-sidebar__link {{ height: 32px; box-sizing: border-box; padding: 0 10px !important; font-size: 13px; font-weight: 400 !important; }}
.ab-sidebar .ab-sidebar__link-label {{ font-weight: inherit !important; }}
.ab-sidebar .ab-sidebar__link--active, .ab-root.adm-abierto .adm-btn, .ab-root.wa-abierto .wa-btn {{ font-weight: 600 !important; }}
.ab-sidebar__footer {{ padding: 10px 14px !important; }}
.ab-sidebar__user {{ gap: 10px !important; }}
.ab-sidebar__user .avatar {{ width: 32px; height: 32px; font-size: 13px; }}
.ab-sidebar__name {{ font-size: 13px !important; font-weight: 700 !important; line-height: 1.3 !important; }}
.ab-sidebar__email {{ font-size: 12px !important; line-height: 1.3 !important; color: var(--t3) !important; }}
.ab-breadcrumbs__list, .ab-breadcrumbs__item, .ab-breadcrumbs__link, .ab-breadcrumbs__separator {{ font-size: 13px !important; font-weight: 400 !important; color: var(--t2) !important; }}
.ab-topbar .um-btn .avatar {{ width: 32px; height: 32px; font-size: 12px; }}
</style>"""
# El mismo CSS del panel que suma panel_admin_1004.py a los tableros de Organización.
CSS_PANEL = """<style data-vuelta="1004-panel-admin">
.adm-cab { padding: 0 14px; }
.adm-panel .ab-sidebar__nav { padding: 10px 8px; }
.adm-panel .ab-sidebar__list, .adm-panel .ab-sidebar__children { display: flex; flex-direction: column; gap: 2px; }
.adm-panel .ab-sidebar__list > li, .adm-panel .ab-sidebar__children > li { position: relative; margin: 0; border-top: 0 !important; padding-top: 0 !important; }
.adm-panel .ab-sidebar__list > li + li::before, .adm-panel .ab-sidebar__children > li + li::before { content: ""; position: absolute; left: 0; right: 0; top: -2px; height: 1px; background: oklch(0.87 0.022 75); }
.adm-panel .ab-sidebar__link, .adm-panel .ab-sidebar__branch { display: flex; align-items: center; gap: 10px; width: 100%; height: 32px; box-sizing: border-box; padding: 0 10px !important; font-size: 13px; font-weight: 400 !important; text-decoration: none; }
.adm-panel .ab-sidebar__link--active { font-weight: 600 !important; }
.adm-panel .ab-sidebar__list > li > .ab-sidebar__branch { font-weight: 600 !important; color: var(--t1) !important; }
.adm-panel .ab-sidebar__chevron { margin-left: auto; width: 14px; height: 14px; color: var(--t3); flex-shrink: 0; }
.adm-panel .ab-cerrado .ab-sidebar__chevron { transform: rotate(-90deg); }
.adm-panel .ab-sidebar__children { margin: 2px 0 0 18px !important; padding-left: 10px !important; border-left: 1px solid oklch(0.82 0.03 75) !important; }
</style>"""
CHEVRON = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
           'stroke-linejoin="round" aria-hidden="true" class="ab-sidebar__chevron"><path d="m6 9 6 6 6-6"></path></svg>')
HAMBURGUESA = re.compile(r'\s*<button type="button" class="icon-btn" aria-label="Abrir o contraer navegación"><svg.*?</svg></button>', re.S)
SUB_WA = re.compile(r'</ul><span class="adm-sub">WhatsApp</span><ul class="ab-sidebar__list">.*?</ul>', re.S)
ICONO_WA = re.compile(r'<a class="ab-sidebar__link[^"]*" href="Plat-WA-Chats\.dc\.html">(<svg.*?</svg>)', re.S)

for nombre in ORG + PLAT:
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    t, n = HAMBURGUESA.subn("", t)
    assert n == 1, (nombre, "☰", n)
    if nombre in PLAT:
        icono = ICONO_WA.search(t)
        assert icono, (nombre, "ícono de WhatsApp")
        grupo = (f'<li><a class="ab-sidebar__branch ab-cerrado" href="Plat-WA-Numero.dc.html">{icono.group(1)}'
                 f'<span class="ab-sidebar__branch-label">WhatsApp</span>{CHEVRON}</a></li></ul>')
        t, n = SUB_WA.subn(lambda m: grupo, t)
        assert n == 1, (nombre, "WhatsApp", n)
        if 'data-vuelta="1004-panel-admin"' not in t:
            t = t.replace("</helmet>", CSS_PANEL + "\n</helmet>")
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", CSS + "\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre)
