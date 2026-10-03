"""Administración › WhatsApp › Equipos (nueva): tabla con diálogo para crear y editar, o tabla con ficha de equipo."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Respuestas.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


GENTE = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>', 18)
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 16, "2.25")
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
VOLVER = svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')

ESTILO = """<style data-propuesta="wa-equipos">
.w-th.e, .w-tr.e { grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr) 48px; }
.w-tr.e { min-height: 52px; }
.w-tr .dos { display: flex; flex-direction: column; line-height: 1.35; min-width: 0; }
.w-tr .dos b { font-weight: 500; }
.w-tr .dos span { font-size: 12px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.o-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.o-seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.o-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.o-g2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.o-g2 .w-it:nth-last-child(-n+2) { border-bottom: 0; }
.w-it .av { width: 32px; height: 32px; border-radius: 50%; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.w-cab .cb { margin-right: 4px; }
</style>"""


def kebab(n):
    return f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>'


EQUIPOS = [("Ventas", "Clientes", "Lucía Fernández, Carolina Vega", "2 personas", "A los 10 minutos"),
           ("Soporte", "Clientes", "Tomás Acosta, Paula Méndez", "2 personas", "A los 15 minutos"),
           ("Atención general", "Clientes", "Lucía Fernández, Tomás Acosta, Martín Paz", "3 personas", "A los 10 minutos"),
           ("Carga de pedidos", "Internos", "Martín Paz", "1 persona", "A los 30 minutos")]
TABLA = ('<div class="w-body"><div class="w-caja"><div class="w-th e"><span>Equipo</span><span>Personas</span><span>Aviso por correo</span><span class="sr">Acciones</span></div>'
         + "".join(f'<div class="w-tr e"><span class="dos"><b>{n}</b><span>Bandeja {b}</span></span><span class="dos"><b style="font-weight: 400;">{p}</b><span>{c}</span></span>'
                   f'<span>{a}</span>{kebab(n)}</div>' for n, b, p, c, a in EQUIPOS)
         + "</div></div>")


def campo(rot, valor, req=False, ancho=False):
    estilo = ' style="grid-column: 1 / -1;"' if ancho else ""
    asterisco = ' <span style="color: var(--peligro);">*</span>' if req else ""
    return f'<div class="w-cmp"{estilo}><span class="rt">{rot}{asterisco}</span>{valor}</div>'


DIALOGO = (f'<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Crear equipo">'
           f'<div class="dc"><span>Crear equipo</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
           '<div class="db">'
           + campo("Nombre", '<div class="ct">Soporte · Delta Sur</div>', True)
           + campo("Bandeja", '<div class="o-seg"><span class="on">Clientes</span><span>Internos</span></div>', True)
           + campo("Personas", f'<div class="ct">Carolina Vega, Paula Méndez {ABAJO}</div>', True, True)
           + campo("Aviso por correo si nadie lo toma", f'<div class="ct">A los 10 minutos {ABAJO}</div>', ancho=True)
           + '</div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Crear equipo</button></div></div></div>')

FICHA = ('<div class="w-body"><div class="w-caja"><div class="w-cab"><span>Datos del equipo</span></div><div class="o-g2">'
         '<div class="w-it"><span class="dato"><b>Clientes</b><span>Bandeja</span></span></div>'
         '<div class="w-it"><span class="dato"><b>A los 10 minutos</b><span>Aviso por correo si nadie lo toma</span></span></div>'
         '</div></div>'
         f'<div class="w-caja"><div class="w-cab"><span>Personas</span><button type="button" class="cb cb-sec ch">{MAS} Sumar persona</button></div>'
         + "".join(f'<div class="w-it"><span class="av">{i}</span><span class="dato"><b>{n}</b><span>{c}</span></span>'
                   f'<button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></div>'
                   for i, n, c in [("L", "Lucía Fernández", "lucia.fernandez@delta.ejemplo.com"), ("C", "Carolina Vega", "carolina.vega@delta.ejemplo.com")])
         + '</div></div>')

ini = base.index('<div class="w-bnd">')
fin = base.index("</div></div>\n</x-dc>")
hijos_viejos = re.search(r'<aside class="w-panel".*?<div class="w-hijos">.*?</div>', base, flags=re.S).group(0)
hijos_nuevos = re.sub(r'<div class="w-hijos">.*?</div>$', '<div class="w-hijos"><a class="w-ln" href="WA-Admin.dc.html">Números</a>'
                      '<a class="w-ln" href="WA-Respuestas.dc.html">Bot</a><a class="w-ln on" href="WA-Respuestas.dc.html">Equipos</a>'
                      '<a class="w-ln" href="WA-Plantillas.dc.html">Plantillas</a></div>', hijos_viejos, flags=re.S)
BANDA_LISTA = (f'<div class="w-bnd"><div class="iz"><span class="ic">{GENTE}</span><div><h1>Equipos</h1><p class="res">4 equipos</p></div></div>'
               f'<div class="ac"><button type="button" class="cb cb-pri">{MAS} Crear equipo</button></div></div>')
BANDA_FICHA = (f'<div class="w-bnd"><div class="iz"><span class="vol">{VOLVER}</span><div><h1>Ventas</h1><p class="res">2 personas · bandeja Clientes</p></div></div>'
               f'<div class="ac"><button type="button" class="ib" aria-label="Acciones de Ventas">{KEBAB}</button><button type="button" class="cb cb-sec">Editar equipo</button></div></div>')


def armar(nombre, cuerpo, migas, dialogo=""):
    t = base[:ini] + cuerpo + base[fin:]
    t = t.replace(hijos_viejos, hijos_nuevos, 1).replace("Inicio / WhatsApp / Respuestas automáticas", migas)
    if dialogo:
        cierre = t.rindex("</div>", 0, t.index("</x-dc>"))
        t = t[:cierre] + dialogo + t[cierre:]
    t = t.replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


armar("V-WA-Equipos-A", BANDA_LISTA + TABLA, "Inicio / WhatsApp / Equipos")
armar("V-WA-Equipos-A2", BANDA_LISTA + TABLA, "Inicio / WhatsApp / Equipos", DIALOGO)
armar("V-WA-Equipos-B", BANDA_FICHA + FICHA, "Inicio / WhatsApp / Equipos / Ventas")
print("ok")
