"""Usuarios › «Cargar teléfonos de empleados»: pantalla propia que muestra qué pasa con cada número antes de confirmar,
o un diálogo que carga y avisa el resultado."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Respuestas.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
VOLVER = svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")
GENTE = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>', 18)
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 16, "2.25")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
GUION = '<span style="color: var(--t3);">—</span>'

ESTILO = """<style data-propuesta="wa-telefonos">
.o-g2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 16px 20px 20px; }
.w-th.p, .w-tr.p { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.6fr) 48px; }
.w-tr.p { min-height: 52px; }
.w-tr .dos { display: flex; flex-direction: column; line-height: 1.35; min-width: 0; }
.w-tr .dos span { font-size: 12px; color: var(--t3); }
.w-est.inv::before { background: var(--marca); }
.w-est.mal::before { background: oklch(0.57 0.2 25); }
.w-est.mal { color: oklch(0.5 0.19 25); }
.w-dlg .db .ct.area { height: 120px; display: block; line-height: 1.6; }
.o-arch { font-size: 13px; color: var(--marca-tx); font-weight: 600; grid-column: 1 / -1; margin-top: -6px; }
</style>"""


def kebab(n):
    return f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>'


FILAS = [("+54 9 11 5555-4521", "Tomás Acosta", ("", "Ya es miembro", "Queda vinculado")),
         ("+54 9 11 5555-7310", "Martín Paz", ("", "Ya es miembro", "Queda vinculado")),
         ("+54 9 11 5555-8812", "Gabriel Ortiz", ("inv", "Tiene cuenta", "Le llega una invitación a Grupo Delta")),
         ("+54 9 11 5555-9934", None, ("inv", "Sin cuenta", "Le llega una invitación por WhatsApp")),
         ("+54 9 11 5555-1200", None, ("inv", "Sin cuenta", "Le llega una invitación por WhatsApp")),
         ("11 4444", None, ("mal", "Número inválido", "No se carga"))]
TABLA = ('<div class="w-th p"><span>Teléfono</span><span>Persona</span><span>Qué va a pasar</span><span class="sr">Acciones</span></div>'
         + "".join(f'<div class="w-tr p"><span>{t}</span><span>{p or GUION}</span><span class="dos"><span class="w-est {c}" style="font-size: 13px; color: var(--t1);">{e}</span><span>{q}</span></span>{kebab(t)}</div>'
                   for t, p, (c, e, q) in FILAS))


def campo(rot, valor, req=False, ancho=False):
    estilo = ' style="grid-column: 1 / -1;"' if ancho else ""
    asterisco = ' <span style="color: var(--peligro);">*</span>' if req else ""
    return f'<div class="w-cmp"{estilo}><span class="rt">{rot}{asterisco}</span>{valor}</div>'


INVITA = campo("Empresa", f'<div class="ct">Delta S.A. {ABAJO}</div>') + campo("Roles en la empresa", f'<div class="ct">Solo lectura {ABAJO}</div>')
A = (f'<div class="w-bnd"><div class="iz"><span class="vol">{VOLVER}</span><div><h1>Cargar teléfonos de empleados</h1>'
     '<p class="res">6 teléfonos · 2 ya son miembros · 3 invitaciones · 1 inválido</p></div></div>'
     '<div class="ac"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Vincular y mandar 3 invitaciones</button></div></div>'
     f'<div class="w-body" style="overflow: auto;"><div class="w-caja"><div class="w-cab"><span>A los que se invitan</span></div><div class="o-g2">{INVITA}</div></div>'
     f'<div class="w-caja">{TABLA}</div></div>')
DIALOGO = (f'<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Cargar teléfonos de empleados">'
           f'<div class="dc"><span>Cargar teléfonos de empleados</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
           '<div class="db">'
           + campo("Teléfonos", '<div class="ct area">+54 9 11 5555-4521<br>+54 9 11 5555-7310<br>+54 9 11 5555-8812<br>+54 9 11 5555-9934</div>', True, True)
           + '<span class="o-arch">O subí un archivo</span>' + INVITA
           + '</div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Cargar</button></div></div></div>')

# Lista de usuarios de fondo para el diálogo (resumida).
USU = [("Lucía Fernández", "lucia.fernandez@delta.ejemplo.com", "Dueño", "Activo"), ("Tomás Acosta", "tomas.acosta@delta.ejemplo.com", "—", "Activo"),
       ("Martín Paz", "martin.paz@delta.ejemplo.com", "—", "Activo"), ("Sofía Herrera", "sofia.herrera@delta.ejemplo.com", "—", "Invitación pendiente")]
LISTA = ('<div class="w-body"><div class="w-caja"><div class="w-th p"><span>Usuario</span><span>Rol en la organización</span><span>Estado</span><span class="sr">Acciones</span></div>'
         + "".join(f'<div class="w-tr p"><span class="dos">{n}<span>{c}</span></span><span>{r}</span><span><span class="w-est{" inv" if "Invit" in e else ""}">{e}</span></span>{kebab(n)}</div>' for n, c, r, e in USU)
         + "</div></div>")
B = (f'<div class="w-bnd"><div class="iz"><span class="ic">{GENTE}</span><div><h1>Usuarios</h1><p class="res">11 usuarios · 6 activos · 3 invitaciones</p></div></div>'
     f'<div class="ac"><button type="button" class="ib" aria-label="Más acciones">{KEBAB}</button><button type="button" class="cb cb-pri">{MAS} Invitar usuario</button></div></div>' + LISTA)

ini = base.index('<div class="w-bnd">')
fin = base.index("</div></div>\n</x-dc>")
panel_viejo = re.search(r'<aside class="w-panel".*?</aside>', base, flags=re.S).group(0)
# Panel de Administración con Gestión de usuarios abierta y Usuarios elegido.
grupo = re.search(r'<a class="w-ln grupo" href="Usuarios\.dc\.html">(.*?)</a>', panel_viejo, flags=re.S)
panel = panel_viejo.replace(grupo.group(0), f'<span class="w-ln grupo">{grupo.group(1)}</span><div class="w-hijos"><a class="w-ln on" href="Usuarios.dc.html">Usuarios</a>'
                            '<a class="w-ln" href="Roles.dc.html">Roles y permisos</a></div>', 1)
panel = re.sub(r'(<span class="w-ln grupo">(?:(?!</span>).)*WhatsApp.*?</span></span>)<div class="w-hijos">.*?</div>', r'\1', panel, count=1, flags=re.S)


def armar(nombre, cuerpo, migas, dialogo=""):
    t = base[:ini] + cuerpo + base[fin:]
    t = t.replace(panel_viejo, panel, 1).replace("Inicio / WhatsApp / Respuestas automáticas", migas)
    if dialogo:
        cierre = t.rindex("</div>", 0, t.index("</x-dc>"))
        t = t[:cierre] + dialogo + t[cierre:]
    t = t.replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


armar("V-Telefonos-A", A, "Inicio / Gestión de usuarios / Usuarios / Cargar teléfonos")
armar("V-Telefonos-B", B, "Inicio / Gestión de usuarios / Usuarios", DIALOGO)
print("ok")
