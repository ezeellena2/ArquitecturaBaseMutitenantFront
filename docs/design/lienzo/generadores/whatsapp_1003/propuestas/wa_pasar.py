"""«Pasar» un chat: A, un diálogo con persona o equipo y una nota interna; B, un desplegable directo."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
base = (AQUI / "V-WA-Chats-A.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
ESTILO = """<style data-propuesta="wa-pasar">
.w-oscuro { position: absolute; inset: 0; z-index: 5; background: oklch(0.3 0.014 78 / 0.5); display: flex; align-items: center; justify-content: center; }
.w-dlg.chico { width: 420px; }
.w-dlg .db.una { grid-template-columns: minmax(0, 1fr); }
.o-seg2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.o-seg2 span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.o-seg2 span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.o-menu { position: absolute; z-index: 6; right: 52px; top: 166px; width: 260px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 4px; display: flex; flex-direction: column; }
.o-menu .tit { padding: 8px 10px 4px; font-size: 12px; font-weight: 600; color: var(--t3); }
.o-menu .it { display: flex; flex-direction: column; padding: 7px 10px; border-radius: 6px; font-size: 13.5px; line-height: 1.35; }
.o-menu .it span { font-size: 12px; color: var(--t3); }
.o-menu .it.h { background: var(--marca-t); }
.o-menu .sep { height: 1px; background: var(--borde); margin: 4px 0; }
.w-app { position: relative; }
</style>"""

DIALOGO = (f'<div class="w-oscuro"><div class="w-dlg chico" role="dialog" aria-label="Pasar el chat">'
           f'<div class="dc"><span>Pasar el chat de Martina López</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
           '<div class="db una">'
           '<div class="w-cmp"><span class="rt">A quién</span><div class="o-seg2"><span class="on">A un equipo</span><span>A una persona</span></div></div>'
           f'<div class="w-cmp"><span class="rt">Equipo <span style="color: var(--peligro);">*</span></span><div class="ct">Soporte {ABAJO}</div></div>'
           '<div class="w-cmp"><span class="rt">Nota para quien lo recibe</span><div class="ct area">Pregunta por una factura de septiembre.</div></div>'
           '</div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Pasar</button></div></div></div>')
MENU = ('<div class="o-menu" role="menu" aria-label="Pasar a"><span class="tit">Equipos</span>'
        '<span class="it h" role="menuitem">Soporte<span>2 personas</span></span><span class="it" role="menuitem">Atención general<span>3 personas</span></span>'
        '<div class="sep"></div><span class="tit">Personas de Ventas</span>'
        '<span class="it" role="menuitem">Carolina Vega<span>3 chats tomados</span></span></div>')

cierre = base.rindex("</div>", 0, base.index("</x-dc>"))
A = base[:cierre] + DIALOGO + base[cierre:]
B = base[:cierre] + MENU + base[cierre:]
for n, t in (("V-WA-Pasar-A", A), ("V-WA-Pasar-B", B)):
    (AQUI / f"{n}.dc.html").write_text(t.replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
print("ok")
