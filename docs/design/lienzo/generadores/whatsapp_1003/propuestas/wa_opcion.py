"""Opción del menú del bot: A, dos acciones (pasa a un equipo o contesta un texto); B, también abre otro menú (sub-menús)."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
base = (AQUI / "V-WA-Bot-C1.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
ESTILO = """<style data-propuesta="wa-opcion">
.w-oscuro { position: absolute; inset: 0; z-index: 5; background: oklch(0.3 0.014 78 / 0.5); display: flex; align-items: center; justify-content: center; }
.w-dlg.chico { width: 420px; }
.w-dlg .db.una { grid-template-columns: minmax(0, 1fr); }
.o-seg3 { display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.o-seg3 span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 600; color: var(--t2); text-align: center; }
.o-seg3 span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.w-it.sub { padding-left: 56px; }
.w-it.sub .num { width: 36px; border-radius: 8px; }
.w-app { position: relative; }
.w-body .w-caja { flex-shrink: 0; }
</style>"""


def dialogo(n, opciones, elegida, cuerpo):
    seg = "".join(f'<span class="{"on" if o == elegida else ""}">{o}</span>' for o in opciones)
    return (f'<div class="w-oscuro"><div class="w-dlg chico" role="dialog" aria-label="Editar opción">'
            f'<div class="dc"><span>Editar opción {n}</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
            '<div class="db una">'
            '<div class="w-cmp"><span class="rt">Texto de la opción <span style="color: var(--peligro);">*</span></span><div class="ct">Hacer un pedido</div></div>'
            f'<div class="w-cmp"><span class="rt">Qué hace</span><div class="o-seg3" style="--n: {len(opciones)};">{seg}</div></div>'
            f'{cuerpo}</div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button></div></div></div>')


EQUIPO = f'<div class="w-cmp"><span class="rt">Equipo <span style="color: var(--peligro);">*</span></span><div class="ct">Ventas {ABAJO}</div></div>'
A = dialogo("1", ["Pasa a un equipo", "Contesta un texto"], "Pasa a un equipo", EQUIPO)

# B: el menú con una opción que abre otro menú, y sus sub-opciones debajo.
VIEJA = 'Consultar un pedido</b><span>Pasa a Soporte</span>'
assert base.count(VIEJA) == 1
fin_fila = base.index("</div>", base.index("</button>", base.index(VIEJA))) + len("</div>")


def sub(num, uno, dos):
    return (f'<div class="w-it sub"><span class="num">{num}</span><span class="dato"><b>{uno}</b><span>{dos}</span></span>'
            f'<button type="button" class="ib" aria-label="Acciones de {uno}">{KEBAB}</button></div>')


b = base.replace(VIEJA, 'Consultar un pedido</b><span>Abre otro menú · 2 opciones</span>', 1)
fin_fila = b.index("</div>", b.index("</button>", b.index("Abre otro menú · 2 opciones"))) + len("</div>")
b = b[:fin_fila] + sub("2.1", "Dónde está mi pedido", "Contesta: «Pasanos el número de pedido y te decimos»") + sub("2.2", "Cambios y devoluciones", "Pasa a Soporte") + b[fin_fila:]

cierre = base.rindex("</div>", 0, base.index("</x-dc>"))
(AQUI / "V-WA-Opcion-A.dc.html").write_text((base[:cierre] + A + base[cierre:]).replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
(AQUI / "V-WA-Opcion-B.dc.html").write_text(b.replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
print("ok")
