"""v120 (2026-10-12): «Para resolver» con un tope (aprobado por el usuario el 12/10, pedido de la Guía).
Cada tipo de pendiente va en su grupo, con su área y su total, y muestra hasta 10 filas; si hay más, «Ver todos» lleva al listado
ya filtrado (Usuarios con «Vencidas» o «Baja pedida», Organizaciones con «Pendiente de aprobación», Recuperaciones con «Pendientes»).
Con 10 o menos no hay «Ver todos».
- Inicio-Org, Asistente-Org y M-Inicio-Org: los grupos y el estado «Más de 10 en un área» (14 invitaciones vencidas).
- Asistente-Plat: los grupos y el mismo estado (23 organizaciones por aprobar).
- Inicio-Miembro: el pendiente de su empresa, en su grupo.
- Criterio-Tablas: la regla, en «Para resolver».
Lleva `data-vuelta="1004-v120"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-v120"'
TOPE = 10
MUCHOS = "Más de 10 en un área"
FLECHA = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>')
CSS = """.pr-g { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--s2); border-bottom: 1px solid var(--borde); font-size: 13.5px; }
.pr-g b { font-weight: 600; color: var(--t1); }
.pr-g .pr-a { color: var(--t3); }
.pr-todos { display: flex; padding: 12px 20px; border-bottom: 1px solid var(--borde); font-size: 14px; }
.pr-todos .lnk { display: inline-flex; align-items: center; gap: 6px; }
.tarjeta.pr > :last-child { border-bottom: 0; }
"""
CSS_TEL = """.c-g { display: flex; align-items: baseline; gap: 6px; padding: 14px 20px 2px; font-size: 13px; color: var(--t3); }
.c-g b { font-weight: 600; color: var(--t2); }
.c-g .n { margin-left: auto; font-weight: 600; }
.c-todos { display: inline-flex; align-items: center; gap: 6px; margin: 2px 0 6px 72px; padding: 8px 0; font-size: 15px; font-weight: 600; color: var(--marca-tx); text-decoration: none; }
"""
textos = {}
css = {}


def tocar(nombre):
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    return None if MARCA in t else t


def fila(cols, pendiente, sub, pill, clase, desde, accion, href, dos=False):
    s = f'<span class={"n2" if dos else "c2"}>{sub}</span>' if sub else ""
    p = f'<span style="min-width: 0;" class="dos">' if dos else '<span style="min-width: 0;">'
    return (f'<div class="tt-f" style="grid-template-columns: {cols};">{p}<span class="c1">{pendiente}</span>{s}</span>'
            f'<span><span class="pill {clase}">{pill}</span></span><span class="c1 n">{desde}</span><a class="lnk" href="{href}">{accion}</a></div>')


def tarjeta(cols, grupos):
    """grupos: [(título, área, total, filas, href de «Ver todos»)]."""
    total = sum(g[2] for g in grupos)
    h = (f'<div class="tarjeta t52 pr"><div class="t-cab"><h2>Para resolver <span class="cnt">{total}</span></h2></div>'
         f'<div class="tt-h" style="grid-template-columns: {cols};"><span>Pendiente</span><span>Estado</span><span>Desde</span><span class="sr">Acción</span></div>')
    for titulo, area, n, filas, todos in grupos:
        assert len(filas) == min(n, TOPE), titulo
        h += f'<div class="pr-g"><b>{titulo}</b><span class="pr-a">{area}</span><span class="cnt">{n}</span></div>' + "".join(filas)
        if n > TOPE:
            h += f'<div class="pr-todos"><a class="lnk" href="{todos}">Ver todos {FLECHA}</a></div>'
    return h + "</div>"


# ---------------------------------------------------------------- La organización (Inicio-Org y Asistente-Org)
CO = "minmax(0, 1.6fr) minmax(0, 1fr) 110px 96px"
WA = ("Números sin medio de pago", "WhatsApp", 1, [fila(CO, "+54 9 351 555-0200", "", "Falta medio de pago", "mal", "02/10/2026", "Cargar", "WA-Admin-Pago.dc.html")], "WA-Admin.dc.html")
BAJAS = ("Bajas pedidas", "Usuarios", 1, [fila(CO, "Diego Ríos", "Se elimina el 27/10/2026", "Baja pedida", "alerta", "27/09/2026", "Ver", "Usuario.dc.html")], "Usuarios.dc.html")
DOMINIO = ("Dominios por verificar", "Configuración", 1, [fila(CO, "Dominio de correo", "delta.ejemplo.com", "Pendiente", "alerta", "01/10/2026", "Verificar", "Configuracion-Verificar.dc.html")],
           "Configuracion-Dominio.dc.html")
INVITADOS = ["carla.bianchi", "julian.mendez", "sofia.ibarra", "nicolas.vera", "paula.gimenez", "ramiro.sosa", "lucas.ferreyra", "valeria.luna",
             "ignacio.rey", "camila.ortiz"]
INV1 = ("Invitaciones vencidas", "Usuarios", 1, [fila(CO, "carla.bianchi@delta.ejemplo.com", "Invitación", "Vencida", "alerta", "25/09/2026", "Reenviar", "Usuarios.dc.html")],
        "Usuarios.dc.html")
INV14 = ("Invitaciones vencidas", "Usuarios", 14,
         [fila(CO, f"{u}@delta.ejemplo.com", "Invitación", "Vencida", "alerta", f"{25 - k:02d}/09/2026", "Reenviar", "Usuarios.dc.html") for k, u in enumerate(INVITADOS)],
         "Usuarios.dc.html")
ORG_POCOS = tarjeta(CO, [WA, INV1, BAJAS, DOMINIO])
ORG_MUCHOS = tarjeta(CO, [WA, INV14, BAJAS, DOMINIO])

for nombre in ["Inicio-Org", "Asistente-Org"]:
    t = tocar(nombre)
    if not t:
        continue
    m = re.search(r'<sc-if value="\{\{conPendientes\}\}" hint-placeholder-val="\{\{si\}\}"><div class="tarjeta t52"><div class="t-cab"><h2>Para resolver .*?</sc-if>', t, re.S)
    # Asistente-Org lo tiene dos veces: en la bienvenida y debajo de «Sin configurar».
    assert m and t.count(m.group(0)) == (2 if nombre == "Asistente-Org" else 1), nombre
    t = t.replace(m.group(0), '<sc-if value="{{conPendientes}}" hint-placeholder-val="{{si}}">' + ORG_POCOS + '</sc-if>'
                  '<sc-if value="{{muchosPendientes}}" hint-placeholder-val="{{no}}">' + ORG_MUCHOS + '</sc-if>')
    t = rep(t, "      sinPendientes: this.props.pendientes === 'Nada para resolver',\n",
            "      sinPendientes: this.props.pendientes === 'Nada para resolver',\n"
            f"      muchosPendientes: this.props.pendientes === '{MUCHOS}',\n")
    if nombre == "Inicio-Org":
        t = sumar_opcion(t, "Con pendientes", MUCHOS, prop="pendientes")
    else:
        t = rep(t, ',"$preview":', ',"pendientes":{"editor":"enum","options":["Con pendientes","' + MUCHOS + '","Nada para resolver"],"default":"Con pendientes","section":"Para resolver"},"$preview":')
    textos[nombre] = t
    css[nombre] = CSS

# ---------------------------------------------------------------- La plataforma (Asistente-Plat)
CP = "minmax(0, 1.4fr) minmax(0, 1.25fr) 104px 80px"
ORGS = [("Gamma S.A.", "Julio Pérez"), ("Épsilon S.R.L.", "Morena Paz"), ("Zeta Servicios", "Ana Ruiz"), ("Theta Logística", "Bruno Díaz"),
        ("Iota Consultores", "Carla Mena"), ("Lambda Alimentos", "Diego Sanz"), ("Mu Diseño", "Elena Rosas"), ("Nu Transporte", "Fabián Gil"),
        ("Xi Salud", "Gala Romero"), ("Pi Seguros", "Hugo Lara")]


def org(n, quien, dia):
    return fila(CP, n, quien, "Espera aprobación", "alerta", f"{dia:02d}/09/2026", "Revisar", "Organizacion.dc.html", dos=True)


RECS = ("Recuperaciones pendientes", "Recuperaciones", 2,
        [fila(CP, "pa•••@kappa.ejemplo.com", "Pablo Ortiz", "Pendiente", "alerta", "27/09/2026", "Revisar", "Recuperaciones.dc.html", dos=True),
         fila(CP, "ma•••@omega.ejemplo.com", "", "Pendiente", "alerta", "26/09/2026", "Revisar", "Recuperaciones.dc.html", dos=True)], "Recuperaciones.dc.html")
PLAT_POCOS = tarjeta(CP, [("Organizaciones por aprobar", "Organizaciones", 2, [org(n, q, 27 - k) for k, (n, q) in enumerate(ORGS[:2])], "Organizaciones.dc.html"), RECS])
PLAT_MUCHOS = tarjeta(CP, [("Organizaciones por aprobar", "Organizaciones", 23, [org(n, q, 27 - k) for k, (n, q) in enumerate(ORGS)], "Organizaciones.dc.html"), RECS])

t = tocar("Asistente-Plat")
if t:
    k = t.index('<div class="tarjeta t52"><div class="t-cab"><h2>Para resolver')
    fin = t.index('<a class="lnk" href="Recuperaciones.dc.html">Revisar</a></div></div>', t.index("ma•••@omega.ejemplo.com", k))
    fin += len('<a class="lnk" href="Recuperaciones.dc.html">Revisar</a></div></div>')
    t = (t[:k] + '<sc-if value="{{conPendientes}}" hint-placeholder-val="{{si}}">' + PLAT_POCOS + '</sc-if>'
         '<sc-if value="{{muchosPendientes}}" hint-placeholder-val="{{no}}">' + PLAT_MUCHOS + '</sc-if>' + t[fin:])
    t = rep(t, "      asZonaClase: pleg ? 'plegado' : '',\n",
            "      asZonaClase: pleg ? 'plegado' : '',\n"
            f"      conPendientes: (this.props.pendientes ?? 'Con pendientes') === 'Con pendientes',\n"
            f"      muchosPendientes: this.props.pendientes === '{MUCHOS}',\n")
    t = rep(t, ',"$preview":', ',"pendientes":{"editor":"enum","options":["Con pendientes","' + MUCHOS + '"],"default":"Con pendientes","section":"Para resolver"},"$preview":')
    textos["Asistente-Plat"] = t
    css["Asistente-Plat"] = CSS

# ---------------------------------------------------------------- Inicio-Miembro: el pendiente de su empresa
t = tocar("Inicio-Miembro")
if t:
    m = re.search(r'<sc-if value="\{\{administra\}\}" hint-placeholder-val="\{\{no\}\}"><div class="tarjeta"><div class="t-cab"><h2>Para resolver .*?</sc-if>', t, re.S)
    assert m
    tj = tarjeta(CO, [("Invitaciones vencidas", "Delta Norte S.A.", 1,
                       [fila(CO, "martin.paz@delta.ejemplo.com", "Invitación", "Vencida", "alerta", "29/09/2026", "Reenviar", "Empresa.dc.html")], "Empresa.dc.html")])
    t = t.replace(m.group(0), '<sc-if value="{{administra}}" hint-placeholder-val="{{no}}">' + tj.replace('class="tarjeta t52 pr"', 'class="tarjeta pr"') + "</sc-if>")
    textos["Inicio-Miembro"] = t
    css["Inicio-Miembro"] = CSS

# ---------------------------------------------------------------- M-Inicio-Org
t = tocar("M-Inicio-Org")
if t:
    m = re.search(r'<sc-if value="\{\{conPend\}\}" hint-placeholder-val="\{\{si\}\}"><div class="c-p">.*?</sc-if>', t, re.S)
    assert m
    viejo = m.group(0)
    ps = re.findall(r'<div class="c-p">.*?</a></div>', viejo, re.S)
    assert len(ps) == 4
    ic_wa = re.search(r'<span class="c-ic mal">.*?</span>', ps[0], re.S).group(0)
    ic_us = re.search(r'<span class="c-ic alerta">.*?</span>', ps[1], re.S).group(0)
    ic_cf = re.search(r'<span class="c-ic alerta">.*?</span>', ps[3], re.S).group(0)

    def cp(ic, titulo, estado, clase, area, accion, href):
        return (f'<div class="c-p">{ic}<span class="tx"><b>{titulo}</b><span><span class="e {clase}">{estado}</span> · {area}</span></span>'
                f'<a class="c-btn" href="{href}">{accion}</a></div>')

    def grupo(titulo, area, n, filas, todos):
        # El área ya está en el título del grupo: cada fila deja solo su estado.
        filas = [re.sub(r'(<span class="e [a-z]+">[^<]*</span>) · [^<]+</span>', lambda m: m.group(1) + '</span>', f) for f in filas]
        h = f'<div class="c-g"><b>{titulo}</b>· {area}<span class="n">{n}</span></div>' + "".join(filas)
        return h + (f'<a class="c-todos" href="{todos}">Ver todos {FLECHA}</a>' if n > TOPE else "")

    g_wa = grupo("Números sin medio de pago", "WhatsApp", 1, [ps[0]], "M-WA-Admin.dc.html")
    g_baja = grupo("Bajas pedidas", "Usuarios", 1, [ps[2]], "M-Usuarios.dc.html")
    g_dom = grupo("Dominios por verificar", "Configuración", 1, [ps[3]], "M-Configuracion.dc.html")
    g_inv1 = grupo("Invitaciones vencidas", "Usuarios", 1, [ps[1]], "M-Usuarios.dc.html")
    g_inv14 = grupo("Invitaciones vencidas", "Usuarios", 14,
                    [cp(ic_us, f"{u}@delta.ejemplo.com", "Invitación vencida", "alerta", "Usuarios", "Reenviar", "M-Usuarios.dc.html") for u in INVITADOS],
                    "M-Usuarios.dc.html")
    nuevo = ('<sc-if value="{{conPend}}" hint-placeholder-val="{{si}}">' + g_wa + g_inv1 + g_baja + g_dom + '</sc-if>'
             '<sc-if value="{{muchosPend}}" hint-placeholder-val="{{no}}">' + g_wa + g_inv14 + g_baja + g_dom + '</sc-if>')
    t = t.replace(viejo, nuevo)
    t = sumar_opcion(t, "Con pendientes", MUCHOS, prop="pendientes")
    t = rep(t, '      sinPend: e === "Nada para resolver",\n      cantPend: e === "Con pendientes" ? "4" : "0",\n',
            '      sinPend: e === "Nada para resolver",\n'
            f'      muchosPend: e === "{MUCHOS}",\n'
            f'      cantPend: e === "Con pendientes" ? "4" : e === "{MUCHOS}" ? "17" : "0",\n')
    # Los globitos siguen con muchos pendientes; el de Usuarios cuenta los suyos: 2, o 15 con las 14 invitaciones.
    t = rep(t, '<sc-if value="{{conPend}}" hint-placeholder-val="{{si}}"><span class=c-bad>1</span></sc-if>',
            '<sc-if value="{{hayPend}}" hint-placeholder-val="{{si}}"><span class=c-bad>1</span></sc-if>', 2)
    t = rep(t, '<sc-if value="{{conPend}}" hint-placeholder-val="{{si}}"><span class=c-bad>2</span></sc-if>',
            '<sc-if value="{{hayPend}}" hint-placeholder-val="{{si}}"><span class=c-bad>{{badUsuarios}}</span></sc-if>')
    t = rep(t, f'      muchosPend: e === "{MUCHOS}",\n',
            f'      muchosPend: e === "{MUCHOS}",\n'
            f'      hayPend: e !== "Nada para resolver",\n'
            f'      badUsuarios: e === "{MUCHOS}" ? "15" : "2",\n')
    textos["M-Inicio-Org"] = t
    css["M-Inicio-Org"] = CSS_TEL

# ---------------------------------------------------------------- Criterio-Tablas: la regla
t = tocar("Criterio-Tablas")
if t:
    t = rep(t, "Se calcula, no se guarda, y se va solo cuando se resuelve (ADR 0040).</li>",
            "Se calcula, no se guarda, y se va solo cuando se resuelve (ADR 0040). Cada tipo de pendiente va en su grupo, con su área y su total, "
            "y muestra hasta 10 filas; si hay más, «Ver todos» lleva al listado ya filtrado.</li>")
    textos["Criterio-Tablas"] = t

for nombre, t in textos.items():
    assert t.count("</helmet>") == 1, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t.replace("</helmet>", f"<style {MARCA}>\n{css.get(nombre, '')}</style>\n</helmet>"), encoding="utf-8")
print("tableros", list(textos))
