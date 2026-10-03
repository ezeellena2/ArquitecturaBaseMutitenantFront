"""Resultados de una difusión: A, los números y la lista de cada contacto; B, solo los números."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
base = (AQUI / "V-WA-Difusiones.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


VOLVER = svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")
LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>')
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
INFO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 16, "2")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
ESTILO = """<style data-propuesta="wa-resultados">
.o-g5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
.o-g5 .w-it { border-bottom: 0; border-right: 1px solid var(--borde); }
.o-g5 .w-it:last-child { border-right: 0; }
.o-g5 .w-it .dato b { font-size: 18px; font-weight: 600; }
.w-th.r, .w-tr.r { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.2fr) 160px 48px; }
.w-tr.r { min-height: 52px; }
.w-est.mal::before { background: oklch(0.57 0.2 25); }
.w-est.mal { color: oklch(0.5 0.19 25); }
.w-est.baja::before { background: oklch(0.72 0.15 70); }
.o-i { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: 0; background: none; color: oklch(0.52 0.19 25); border-radius: 50%; margin-left: 4px; vertical-align: middle; }
.o-fb { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.o-fb .w-bus { flex: 0 0 360px; }
</style>"""


def kebab(n):
    return f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>'


NUMS = [("124", "Mandados"), ("118", "Entregados"), ("86", "Leídos"), ("12", "Respondieron"), ("2", "Se dieron de baja")]
RESUMEN = ('<div class="w-caja"><div class="w-cab"><span>Resultados</span></div><div class="o-g5">'
           + "".join(f'<div class="w-it"><span class="dato"><b>{n}</b><span>{r}</span></span></div>' for n, r in NUMS) + "</div></div>")
FILAS = [("Laura Méndez", "+54 9 11 5555-3378", ("", "Respondió"), "25/09 10:12"), ("Federico Díaz", "+54 9 11 5555-2087", ("", "Leído"), "25/09 09:48"),
         ("Carla Ruiz", "+54 9 11 5555-1146", ("baja", "Se dio de baja"), "25/09 09:40"), ("Sergio Gómez", "+54 9 11 5555-9021", ("off", "Entregado"), "25/09 09:31"),
         ("+54 9 11 5555-6650", "", ("mal", "No llegó", True), "25/09 09:30")]


def est(e):
    clase, texto = e[0], e[1]
    return f'<span class="w-est {clase}">{texto}</span>' + (f'<button type="button" class="o-i" aria-label="Por qué no llegó">{INFO}</button>' if len(e) > 2 else "")


TABLA = (f'<div class="w-caja o-fb"><span class="w-bus">{LUPA} Buscar por nombre o número</span><span class="w-pil">Estado: todos {ABAJO}</span></div>'
         '<div class="w-caja"><div class="w-th r"><span>Contacto</span><span>Estado</span><span>Último cambio</span><span class="sr">Acciones</span></div>'
         + "".join(f'<div class="w-tr r"><span class="dos" style="display: flex; flex-direction: column; line-height: 1.35;"><b style="font-weight: 500;">{n}</b>'
                   f'<span style="font-size: 12px; color: var(--t3);">{t}</span></span><span>{est(e)}</span><span>{f}</span>{kebab(n)}</div>' for n, t, e, f in FILAS)
         + '<div class="w-pie"><span>1–5 de 124</span><span>10 por página · Página 1 de 25</span></div></div>')
BANDA = (f'<div class="w-bnd"><div class="iz"><span class="vol">{VOLVER}</span><div><h1>20 % en empanadas</h1>'
         '<p class="res">Enviada el 25/09/2026 · Plantilla «Promo semanal» · Minorista</p></div></div>'
         f'<div class="ac"><button type="button" class="ib" aria-label="Más acciones">{KEBAB}</button><button type="button" class="cb cb-sec">Duplicar</button></div></div>')

ini = base.index('<div class="w-bnd">')
fin = base.index('<div class="w-pie">', ini)
fin = base.index("</div></div></div>", fin) + len("</div></div></div>")
for clave, cuerpo in (("A", RESUMEN + TABLA), ("B", RESUMEN)):
    t = base[:ini] + BANDA + f'<div class="w-body" style="overflow: auto;">{cuerpo}</div>' + base[fin:]
    t = t.replace("Inicio / WhatsApp / Difusiones", "Inicio / WhatsApp / Difusiones / 20 % en empanadas").replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"V-WA-Resultados-{clave}.dc.html").write_text(t, encoding="utf-8")
print("ok")
