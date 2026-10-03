"""Administración › WhatsApp › Plantillas: la lista con «Rechazada» y su ⓘ, y dos formas de crear una
(pantalla propia con vista previa, o diálogo con lo mínimo)."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Plantillas.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>', 18)
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 16, "2.25")
MAS_CH = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 14, "2.25")
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
VOLVER = svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")
INFO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 16, "2")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')

ESTILO = """<style data-propuesta="wa-plantillas">
.w-th.t, .w-tr.t { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) 160px 48px; }
.w-tr.t { min-height: 52px; }
.w-tr .dos { display: flex; flex-direction: column; line-height: 1.35; min-width: 0; }
.w-tr .dos b { font-weight: 500; }
.w-tr .dos span { font-size: 12px; color: var(--t3); }
.w-est.mal::before { background: oklch(0.57 0.2 25); }
.w-est.mal { color: oklch(0.5 0.19 25); }
.w-est.rev::before { background: oklch(0.72 0.15 70); }
.o-i { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: 0; background: none; color: oklch(0.52 0.19 25); border-radius: 50%; margin-left: 4px; vertical-align: middle; }
.o-g2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 16px 20px 20px; }
.o-g2 .ancho { grid-column: 1 / -1; }
.o-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.o-seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.o-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.o-var { display: inline-flex; padding: 0 6px; border-radius: 6px; background: var(--marca-t); color: var(--marca-tx); font-weight: 600; }
.o-datos { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
.o-datos .cb { height: 28px; font-size: 12.5px; padding: 0 10px; }
.o-prev { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 16px 20px 20px; align-items: start; }
.o-burb { justify-self: start; width: 380px; background: #fff; border: 1px solid var(--borde); border-radius: 12px; border-top-left-radius: 4px; overflow: hidden; font-size: 13.5px; line-height: 1.5; }
.o-burb .h { padding: 10px 14px 0; font-weight: 700; }
.o-burb .tx { padding: 6px 14px 4px; }
.o-burb .pie { padding: 0 14px 10px; font-size: 12px; color: var(--t3); }
.o-burb .bt { display: block; border-top: 1px solid var(--borde); padding: 9px; text-align: center; font-weight: 600; color: var(--marca-tx); }
.o-nota { display: flex; flex-direction: column; gap: 10px; }
.o-nota .it { display: flex; flex-direction: column; line-height: 1.35; }
.o-nota .it b { font-weight: 600; }
.o-nota .it span { font-size: 12px; color: var(--t3); }
.w-dlg .db .ct.area { height: 104px; }
.w-cmp .ct.area { display: block; line-height: 1.7; }
.o-lado { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 16px; align-items: start; }
.o-prev1 { display: flex; justify-content: center; padding: 24px 20px; background: oklch(0.975 0.008 78); }
.o-prev1 .o-burb { width: 100%; max-width: 380px; }
</style>"""


def kebab(n):
    return f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>'


PLANTS = [("Pedido listo", "Español (Argentina)", "Utilidad", ("", "Aprobada", False), "20/09/2026"),
          ("Recordatorio de turno", "Español (Argentina)", "Utilidad", ("", "Aprobada", False), "18/09/2026"),
          ("Novedades", "Español (Argentina)", "Marketing", ("rev", "En revisión", False), "30/09/2026"),
          ("Promo semanal", "Español (Argentina)", "Marketing", ("mal", "Rechazada", True), "29/09/2026")]


def est(e):
    clase, texto, info = e
    return f'<span class="w-est {clase}">{texto}</span>' + (f'<button type="button" class="o-i" aria-label="Por qué la rechazó Meta">{INFO}</button>' if info else "")


LISTA = ('<div class="w-body"><div class="w-caja"><div class="w-th t"><span>Plantilla</span><span>Tipo</span><span>Estado en Meta</span><span>Última modificación</span><span class="sr">Acciones</span></div>'
         + "".join(f'<div class="w-tr t"><span class="dos"><b>{n}</b><span>{i}</span></span><span>{c}</span><span>{est(e)}</span><span>{f}</span>{kebab(n)}</div>' for n, i, c, e, f in PLANTS)
         + "</div></div>")


def campo(rot, valor, req=False, ancho=False):
    clase = ' class="w-cmp ancho"' if ancho else ' class="w-cmp"'
    asterisco = ' <span style="color: var(--peligro);">*</span>' if req else ""
    return f'<div{clase}><span class="rt">{rot}{asterisco}</span>{valor}</div>'


TEXTO = ('<div class="ct area">Hola <span class="o-var">nombre</span>, tu pedido <span class="o-var">número de pedido</span> está listo. '
         'Podés retirarlo en el local de 9 a 18.</div><div class="o-datos"><button type="button" class="cb cb-sec">'
         + MAS_CH + ' Nombre del contacto</button><button type="button" class="cb cb-sec">' + MAS_CH + ' Otro dato</button></div>')
FORM = (campo("Nombre", '<div class="ct">Pedido listo</div>', True)
        + campo("Tipo", '<div class="o-seg"><span class="on">Utilidad</span><span>Marketing</span></div>', True)
        + campo("Idioma", f'<div class="ct">Español (Argentina) {ABAJO}</div>', True)
        + campo("Encabezado", '<div class="ct">Tu pedido está listo</div>')
        + campo("Texto", TEXTO, True, True)
        + campo("Pie", '<div class="ct">Grupo Delta</div>')
        + campo("Botones", f'<div class="ct">Respuesta rápida: «Gracias» {ABAJO}</div>'))
PREV = ('<div class="o-burb"><div class="h">Tu pedido está listo</div><div class="tx">Hola Martina, tu pedido 1043 está listo. Podés retirarlo en el local de 9 a 18.</div>'
        '<div class="pie">Grupo Delta</div><span class="bt">Gracias</span></div>'
        )
NUEVA_A = (f'<div class="w-bnd"><div class="iz"><span class="vol">{VOLVER}</span><div><h1>Nueva plantilla</h1><p class="res">Borrador</p></div></div>'
           '<div class="ac"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Mandar a Meta</button></div></div>'
           f'<div class="w-body" style="overflow: auto;"><div class="o-lado"><div class="w-caja"><div class="w-cab"><span>Plantilla</span></div><div class="o-g2">{FORM}</div></div>'
           f'<div class="w-caja"><div class="w-cab"><span>Vista previa</span></div><div class="o-prev1">{PREV}</div></div></div></div>')
DIALOGO_B = (f'<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Nueva plantilla">'
             f'<div class="dc"><span>Nueva plantilla</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
             '<div class="db">'
             + campo("Nombre", '<div class="ct">Pedido listo</div>', True)
             + campo("Tipo", '<div class="o-seg"><span class="on">Utilidad</span><span>Marketing</span></div>', True)
             + campo("Texto", TEXTO, True, True).replace('class="w-cmp ancho"', 'class="w-cmp" style="grid-column: 1 / -1;"')
             + '</div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Mandar a Meta</button></div></div></div>')

ini = base.index('<div class="w-bnd">')
fin = base.index("</div></div>\n</x-dc>")
hijos_viejos = re.search(r'<aside class="w-panel".*?<div class="w-hijos">.*?</div>', base, flags=re.S).group(0)
hijos_nuevos = re.sub(r'<div class="w-hijos">.*?</div>$', '<div class="w-hijos"><a class="w-ln" href="WA-Admin.dc.html">Números</a>'
                      '<a class="w-ln" href="WA-Respuestas.dc.html">Bot</a><a class="w-ln" href="WA-Respuestas.dc.html">Equipos</a>'
                      '<a class="w-ln on" href="WA-Plantillas.dc.html">Plantillas</a></div>', hijos_viejos, flags=re.S)
BANDA = (f'<div class="w-bnd"><div class="iz"><span class="ic">{WA}</span><div><h1>Plantillas</h1><p class="res">4 plantillas · 2 aprobadas</p></div></div>'
         f'<div class="ac"><button type="button" class="cb cb-pri">{MAS} Nueva plantilla</button></div></div>')


def armar(nombre, cuerpo, dialogo=""):
    t = base[:ini] + cuerpo + base[fin:]
    t = t.replace(hijos_viejos, hijos_nuevos, 1)
    if dialogo:
        cierre = t.rindex("</div>", 0, t.index("</x-dc>"))
        t = t[:cierre] + dialogo + t[cierre:]
    t = t.replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


armar("V-WA-Plantillas", BANDA + LISTA)
armar("V-WA-Plantilla-Nueva-A", NUEVA_A)
armar("V-WA-Plantilla-Nueva-B", BANDA + LISTA, DIALOGO_B)
print("ok")
