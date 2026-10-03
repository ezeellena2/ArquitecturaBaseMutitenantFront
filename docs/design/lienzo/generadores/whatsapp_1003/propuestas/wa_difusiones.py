"""Difusiones (nueva): la lista y dos formas de crear una (pantalla propia con vista previa, o diálogo)."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Contactos.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>')
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
MEGA = svg('<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>', 18)
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
VOLVER = svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 16, "2.25")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
GUION = '<span style="color: var(--t3);">—</span>'

ESTILO = """<style data-propuesta="wa-difusiones">
.o-fb { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.o-fb .w-bus { flex: 0 0 360px; }
.w-th.f, .w-tr.f { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.1fr) 140px minmax(0, 1fr) 150px 48px; }
.w-tr.f { min-height: 52px; }
.w-tr .dos { display: flex; flex-direction: column; line-height: 1.35; }
.w-tr .dos b { font-weight: 500; }
.w-tr .dos span { font-size: 12px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w-est.prog::before { background: var(--marca); }
.o-g2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 16px 20px 20px; }
.o-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.o-seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.o-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.o-prev { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 16px 20px 20px; align-items: start; }
.o-burb { justify-self: start; max-width: 420px; background: var(--marca-t); color: oklch(0.3 0.05 195); border-radius: 12px; border-top-left-radius: 4px; padding: 10px 14px; font-size: 13.5px; line-height: 1.5; }
.o-burb .b { display: block; margin-top: 8px; padding-top: 8px; border-top: 1px solid oklch(0.51 0.099 195 / 0.2); text-align: center; font-weight: 600; color: var(--marca-tx); }
.o-costo { display: flex; flex-direction: column; gap: 10px; }
.o-costo .it { display: flex; flex-direction: column; line-height: 1.35; }
.o-costo .it b { font-weight: 600; font-size: 15px; }
.o-costo .it span { font-size: 12px; color: var(--t3); }
.w-dlg .db .o-costo2 { grid-column: 1 / -1; display: flex; justify-content: space-between; font-size: 13px; color: var(--t2); padding-top: 4px; }
.w-dlg .db .o-costo2 b { color: var(--t1); }
</style>"""


def kebab(n):
    return f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>'


DIFS = [("20 % en empanadas", "Plantilla «Promo semanal»", "Minorista", "124 contactos", ("", "Enviada"), "118 entregados · 86 leídos", "25/09/2026"),
        ("Horario de fiestas", "Plantilla «Aviso de horario»", "Todos los que aceptan", "312 contactos", ("prog", "Programada"), GUION, "20/12/2026 09:00"),
        ("Nuevos productos", "Plantilla «Novedades»", "Mayorista", "48 contactos", ("", "Enviada"), "47 entregados · 40 leídos", "02/09/2026")]
filas = "".join(f'<div class="w-tr f"><span class="dos"><b>{n}</b><span>{p}</span></span><span class="dos"><b style="font-weight: 400;">{d}</b><span>{c}</span></span>'
                f'<span><span class="w-est {e[0]}">{e[1]}</span></span><span>{r}</span><span>{f}</span>{kebab(n)}</div>' for n, p, d, c, e, r, f in DIFS)
LISTA = (f'<div class="w-body"><div class="w-caja o-fb"><span class="w-bus">{LUPA} Buscar por nombre</span><span class="w-pil">Estado: todos {ABAJO}</span></div>'
         '<div class="w-caja"><div class="w-th f"><span>Difusión</span><span>Destinatarios</span><span>Estado</span><span>Resultados</span><span>Fecha</span><span class="sr">Acciones</span></div>'
         + filas + '<div class="w-pie"><span>1–3 de 3</span><span>10 por página · Página 1 de 1</span></div></div></div>')


def banda(titulo, resumen, acciones, volver=False):
    izq = f'<a class="vol" href="V-WA-Difusiones.dc.html" aria-label="Volver">{VOLVER}</a>' if volver else f'<span class="ic">{MEGA}</span>'
    return f'<div class="w-bnd"><div class="iz">{izq}<div><h1>{titulo}</h1><p class="res">{resumen}</p></div></div><div class="ac">{acciones}</div></div>'


def campo(rot, valor, req=False, ancho=False):
    estilo = ' style="grid-column: 1 / -1;"' if ancho else ""
    asterisco = ' <span style="color: var(--peligro);">*</span>' if req else ""
    return f'<div class="w-cmp"{estilo}><span class="rt">{rot}{asterisco}</span>{valor}</div>'


FORM = (campo("Nombre", '<div class="ct">Horario de fiestas</div>', True)
        + campo("Plantilla", f'<div class="ct">Aviso de horario · Marketing {ABAJO}</div>', True)
        + campo("Destinatarios", '<div class="o-seg"><span>Todos los que aceptan</span><span class="on">Una etiqueta</span></div>', True)
        + campo("Etiqueta", f'<div class="ct">Mayorista {ABAJO}</div>', True)
        + campo("Cuándo", '<div class="o-seg"><span>Ahora</span><span class="on">Programar</span></div>')
        + campo("Fecha y hora", f'<div class="ct">20/12/2026 09:00 {ABAJO}</div>'))
PREVIEW = ('<div class="o-burb">Hola Martina, te contamos el horario de fiestas de Grupo Delta: el 24 y el 31 atendemos de 9 a 13. Te esperamos.'
           '<span class="b">No recibir más</span></div>'
           '<div class="o-costo"><div class="it"><b>48 contactos</b><span>Tienen la etiqueta «Mayorista» y aceptan promociones</span></div>'
           '<div class="it"><b>US$ 2,97</b><span>Costo estimado, según los precios de Meta para Argentina</span></div></div>')
NUEVA_A = (banda("Nueva difusión", "Borrador", '<a class="cb cb-sec" href="V-WA-Difusiones.dc.html">Cancelar</a><button type="button" class="cb cb-pri">Programar</button>', True)
           + f'<div class="w-body"><div class="w-caja"><div class="w-cab"><span>Difusión</span></div><div class="o-g2">{FORM}</div></div>'
           f'<div class="w-caja"><div class="w-cab"><span>Vista previa</span></div><div class="o-prev">{PREVIEW}</div></div></div>')
DIALOGO_B = (f'<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Nueva difusión">'
             f'<div class="dc"><span>Nueva difusión</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
             f'<div class="db">{FORM}<div class="o-costo2"><span>48 contactos</span><span>Costo estimado <b>US$ 2,97</b></span></div></div>'
             '<div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Programar</button></div></div></div>')

ini = base.index('<div class="w-bnd">')
fin = base.index('<div class="w-pie">', ini)
fin = base.index("</div></div></div>", fin) + len("</div></div></div>")
hijos_viejos = re.search(r'<div class="w-hijos">.*?</div>', base[:ini], flags=re.S).group(0)
HIJOS = ('<div class="w-hijos"><a class="w-ln" href="WA-Chats.dc.html">Chats<span class="cnt">2</span></a>'
         '<a class="w-ln" href="WA-Contactos.dc.html">Contactos</a><a class="w-ln on" href="V-WA-Difusiones.dc.html">Difusiones</a></div>')
LISTA_BANDA = banda("Difusiones", "3 difusiones · 1 programada", f'<a class="cb cb-pri" href="V-WA-Difusion-Nueva-A.dc.html">{MAS} Nueva difusión</a>')


def armar(nombre, cuerpo, dialogo=""):
    t = base[:ini] + cuerpo + base[fin:]
    t = t.replace(hijos_viejos, HIJOS, 1).replace("Inicio / WhatsApp / Contactos", "Inicio / WhatsApp / Difusiones")
    if dialogo:
        cierre = t.rindex("</div>", 0, t.index("</x-dc>"))
        t = t[:cierre] + dialogo + t[cierre:]
    t = t.replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


armar("V-WA-Difusiones", LISTA_BANDA + LISTA)
armar("V-WA-Difusion-Nueva-A", NUEVA_A)
armar("V-WA-Difusion-Nueva-B", LISTA_BANDA + LISTA, DIALOGO_B)
print("ok")
