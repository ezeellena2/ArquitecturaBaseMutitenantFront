"""«Elegir plantilla» en un chat: A, un diálogo con la plantilla, sus datos y la vista previa; B, un desplegable y se completa abajo."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
base = (AQUI / "V-WA-24h-B.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
ESTILO = """<style data-propuesta="wa-elegir">
.w-oscuro { position: absolute; inset: 0; z-index: 5; background: oklch(0.3 0.014 78 / 0.5); display: flex; align-items: center; justify-content: center; }
.w-app { position: relative; }
.o-burb { background: var(--marca-t); color: oklch(0.3 0.05 195); border-radius: 12px; border-top-right-radius: 4px; padding: 10px 14px; font-size: 13.5px; line-height: 1.5; grid-column: 1 / -1; justify-self: end; max-width: 90%; }
.o-burb b { font-weight: 700; }
.o-costo { grid-column: 1 / -1; font-size: 12.5px; color: var(--t3); text-align: right; margin-top: -6px; }
.o-menu { position: absolute; z-index: 6; right: 16px; bottom: 64px; width: 300px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 4px; display: flex; flex-direction: column; }
.o-menu .it { display: flex; flex-direction: column; padding: 8px 10px; border-radius: 6px; font-size: 13.5px; line-height: 1.35; }
.o-menu .it span { font-size: 12px; color: var(--t3); }
.o-menu .it.h { background: var(--marca-t); }
</style>"""


def campo(rot, valor, req=False, ancho=False):
    estilo = ' style="grid-column: 1 / -1;"' if ancho else ""
    asterisco = ' <span style="color: var(--peligro);">*</span>' if req else ""
    return f'<div class="w-cmp"{estilo}><span class="rt">{rot}{asterisco}</span>{valor}</div>'


DIALOGO = (f'<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Elegir plantilla">'
           f'<div class="dc"><span>Mandar plantilla a Martina López</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
           '<div class="db">'
           + campo("Plantilla", f'<div class="ct">Pedido listo · Utilidad {ABAJO}</div>', True, True)
           + campo("Nombre", '<div class="ct">Martina</div>', True)
           + campo("Número de pedido", '<div class="ct">1043</div>', True)
           + '<div class="o-burb">Hola <b>Martina</b>, tu pedido <b>1043</b> está listo. Podés retirarlo en el local de 9 a 18.</div>'
           + '<span class="o-costo">Costo estimado: US$ 0,02</span>'
           + '</div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Mandar</button></div></div></div>')
MENU = ('<div class="o-menu" role="menu" aria-label="Plantillas aprobadas">'
        '<span class="it h" role="menuitem">Pedido listo<span>Utilidad · «Hola nombre, tu pedido número está listo…»</span></span>'
        '<span class="it" role="menuitem">Recordatorio de turno<span>Utilidad · «Hola nombre, te recordamos tu turno…»</span></span></div>')

cierre = base.rindex("</div>", 0, base.index("</x-dc>"))
A = base[:cierre] + DIALOGO + base[cierre:]
B = base[:cierre] + MENU + base[cierre:]
for n, t in (("V-WA-Elegir-A", A), ("V-WA-Elegir-B", B)):
    (AQUI / f"{n}.dc.html").write_text(t.replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
print("ok")
