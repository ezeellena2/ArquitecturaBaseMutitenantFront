"""Panel de Administración de la organización con la pieza del criterio (decisión del usuario del 2026-10-04, opción A): un grupo
arranca abierto solo si estás en una de sus pantallas. Seis tableros seguían con la pieza vieja (`ab-sidebar`), con «Gestión de
usuarios» siempre abierto, WhatsApp como opción suelta y filas de 39: Usuarios, Roles, Empresas, Empresa, Auditoria-Org e Inicio-Org.
Quedan como Usuario, Rol, Configuración y WhatsApp › Números:
- filas de 32, relleno 0 y 10, 2 px entre filas con la línea fina en el medio, la letra de 13 en 400 y la elegida en 600;
- el grupo en 600 y en el color del texto, con la flechita de 14 a la derecha (abajo si está abierto; a la derecha si está cerrado);
- los hijos con 18 de sangría, 10 de relleno y la línea a la izquierda;
- «Gestión de usuarios» abierto en Usuarios y Roles, y cerrado (un enlace a Usuarios) en Empresas, Empresa, Auditoría e Inicio;
- WhatsApp como grupo cerrado que lleva a Números (WA-Admin);
- el título del panel con 14 de relleno y la lista con 10 y 8.
Las medidas salen de Usuario.dc.html (`.w-ln`, `.w-hijos`, `.w-panel`). Lleva `data-vuelta="1004-panel-admin"`; si ya la tiene, no
se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-panel-admin"'
ABIERTO = ["Usuarios", "Roles"]
CERRADO = ["Empresas", "Empresa", "Auditoria-Org", "Inicio-Org"]
CSS = f"""<style {MARCA}>
.adm-cab {{ padding: 0 14px; }}
.adm-panel .ab-sidebar__nav {{ padding: 10px 8px; }}
.adm-panel .ab-sidebar__list, .adm-panel .ab-sidebar__children {{ display: flex; flex-direction: column; gap: 2px; }}
.adm-panel .ab-sidebar__list > li, .adm-panel .ab-sidebar__children > li {{ position: relative; margin: 0; border-top: 0 !important; padding-top: 0 !important; }}
.adm-panel .ab-sidebar__list > li + li::before, .adm-panel .ab-sidebar__children > li + li::before {{ content: ""; position: absolute; left: 0; right: 0; top: -2px; height: 1px; background: oklch(0.87 0.022 75); }}
.adm-panel .ab-sidebar__link, .adm-panel .ab-sidebar__branch {{ display: flex; align-items: center; gap: 10px; width: 100%; height: 32px; box-sizing: border-box; padding: 0 10px !important; font-size: 13px; font-weight: 400 !important; text-decoration: none; }}
.adm-panel .ab-sidebar__link--active {{ font-weight: 600 !important; }}
.adm-panel .ab-sidebar__list > li > .ab-sidebar__branch {{ font-weight: 600 !important; color: var(--t1) !important; }}
.adm-panel .ab-sidebar__chevron {{ margin-left: auto; width: 14px; height: 14px; color: var(--t3); flex-shrink: 0; }}
.adm-panel .ab-cerrado .ab-sidebar__chevron {{ transform: rotate(-90deg); }}
.adm-panel .ab-sidebar__children {{ margin: 2px 0 0 18px !important; padding-left: 10px !important; border-left: 1px solid oklch(0.82 0.03 75) !important; }}
</style>"""
WA = re.compile(r'<li><a class="ab-sidebar__link" href="WA-Admin\.dc\.html">(<svg.*?</svg>)<span class="ab-sidebar__link-label">WhatsApp</span></a></li>', re.S)
BOTON = '<button type="button" class="ab-sidebar__branch" aria-expanded="true" aria-controls="menu-usuarios">'

for nombre in ABIERTO + CERRADO:
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    if MARCA in t:
        continue
    assert t.count(BOTON) == 1, nombre
    i = t.index(BOTON)
    j = t.index("</button>", i)
    chevron = re.findall(r"<svg.*?</svg>", t[i:j], re.S)[1]
    assert "ab-sidebar__chevron" in chevron, nombre
    # WhatsApp pasa a ser un grupo cerrado que lleva a Números.
    t, n = WA.subn(lambda m: f'<li><a class="ab-sidebar__branch ab-cerrado" href="WA-Admin.dc.html">{m.group(1)}'
                             f'<span class="ab-sidebar__branch-label">WhatsApp</span>{chevron}</a></li>', t)
    assert n == 1, (nombre, "wa", n)
    if nombre in CERRADO:
        i = t.index(BOTON)
        j = t.index("</button>", i)
        interior = t[i + len(BOTON):j]
        k = t.index('<ul class="ab-sidebar__children" id="menu-usuarios">', j)
        fin = t.index("</ul>", k) + len("</ul>")
        assert t[j + len("</button>"):k].strip() == "", nombre
        t = t[:i] + f'<a class="ab-sidebar__branch ab-cerrado" href="Usuarios.dc.html">{interior}</a>' + t[fin:]
    assert t.count("</helmet>") == 1
    t = t.replace("</helmet>", CSS + "\n</helmet>")
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre)
