"""Administración › WhatsApp › Números con lo decidido: uno o más números, a quién atiende cada uno, estado
(sin medio de pago, en rojo con ⓘ) y mensajes del mes. Tabla o lista, y el aviso importante del medio de pago."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Admin.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>', 18)
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 16, "2.25")
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
INFO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 16, "2")
ALERTA = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5"/><path d="M12 15.8h.01"/>', 18, "2")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
GUION = '<span style="color: var(--t3);">—</span>'

ESTILO = """<style data-propuesta="wa-numeros">
.w-th.n, .w-tr.n { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1fr) 48px; }
.w-tr.n { min-height: 56px; }
.w-tr .dos { display: flex; flex-direction: column; line-height: 1.35; }
.w-tr .dos b { font-weight: 500; }
.w-tr .dos span, .w-it .dato .gris { font-size: 12px; color: var(--t3); }
.w-est.mal::before { background: oklch(0.57 0.2 25); }
.w-est.mal { color: oklch(0.5 0.19 25); }
.o-i { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: 0; background: none; color: oklch(0.52 0.19 25); border-radius: 50%; margin-left: 4px; vertical-align: middle; }
.w-it .estado { width: 220px; flex-shrink: 0; }
.w-it .mes { width: 200px; flex-shrink: 0; font-size: 13px; }
.o-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 10px; background: var(--peligro-t); color: oklch(0.42 0.16 25); grid-column: 1 / -1; }
.o-mot b { display: block; font-size: 15px; font-weight: 600; color: oklch(0.38 0.15 25); }
.o-mot span { font-size: 12.5px; }
.o-sub { font-size: 12.5px; font-weight: 600; color: var(--t3); grid-column: 1 / -1; }
.o-pasos { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; grid-column: 1 / -1; }
.o-pasos li { display: flex; gap: 10px; align-items: center; font-size: 13.5px; }
.o-pasos .n { width: 22px; height: 22px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.w-dlg.chico { width: 420px; }
.w-dlg .db.una { grid-template-columns: minmax(0, 1fr); }
</style>"""

NUMS = [("+54 9 11 5555-0100", "Grupo Delta · también en la app", "Toda la organización", ("", "Conectado", False), "640 de 1.000 gratis"),
        ("+54 9 351 555-0200", "Delta Sur", "Delta Sur S.R.L.", ("mal", "Falta medio de pago", True), GUION)]


def estado(e):
    clase, texto, info = e
    boton = f'<button type="button" class="o-i" aria-label="Por qué no puede responder">{INFO}</button>' if info else ""
    return f'<span class="w-est {clase}">{texto}</span>{boton}'


def kebab(n):
    return f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>'


TABLA = ('<div class="w-body"><div class="w-caja"><div class="w-th n"><span>Número</span><span>Atiende a</span><span>Estado</span><span>Este mes</span><span class="sr">Acciones</span></div>'
         + "".join(f'<div class="w-tr n"><span class="dos"><b>{n}</b><span>{d}</span></span><span>{a}</span><span>{estado(e)}</span><span>{m}</span>{kebab(n)}</div>' for n, d, a, e, m in NUMS)
         + "</div></div>")
LISTA = ('<div class="w-body"><div class="w-caja"><div class="w-cab"><span>Números</span></div>'
         + "".join(f'<div class="w-it"><span class="dato"><b>{n}</b><span>{a} · {d}</span></span><span class="estado">{estado(e)}</span>'
                   f'<span class="mes">{m if m != GUION else ""}</span><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></div>' for n, d, a, e, m in NUMS)
         + "</div></div>")
AVISO = (f'<div class="w-oscuro"><div class="w-dlg chico" role="dialog" aria-label="Falta medio de pago">'
         f'<div class="dc"><span>+54 9 351 555-0200 no puede responder</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
         f'<div class="db una"><div class="o-mot">{ALERTA}<div><b>Falta medio de pago en Meta</b><span>Sin medio de pago, Meta no deja mandar mensajes</span></div></div>'
         '<span class="o-sub">Qué podés hacer</span><ol class="o-pasos"><li><span class="n">1</span>Entrá a tu WhatsApp Manager de Meta</li>'
         '<li><span class="n">2</span>Agregá un medio de pago a la cuenta</li><li><span class="n">3</span>Volvé acá y tocá «Comprobar»</li></ol></div>'
         '<div class="df"><button type="button" class="cb cb-sec">Comprobar</button><button type="button" class="cb cb-pri">Ir a Meta</button></div></div></div>')

ini = base.index('<div class="w-bnd">')
fin = base.index("</div></div>\n</x-dc>")
hijos_viejos = re.search(r'<aside class="w-panel".*?<div class="w-hijos">.*?</div>', base, flags=re.S).group(0)
hijos_nuevos = re.sub(r'<div class="w-hijos">.*?</div>$', '<div class="w-hijos"><a class="w-ln on" href="WA-Admin.dc.html">Números</a>'
                      '<a class="w-ln" href="WA-Respuestas.dc.html">Bot</a><a class="w-ln" href="WA-Respuestas.dc.html">Equipos</a>'
                      '<a class="w-ln" href="WA-Plantillas.dc.html">Plantillas</a></div>', hijos_viejos, flags=re.S)
BANDA = (f'<div class="w-bnd"><div class="iz"><span class="ic">{WA}</span><div><h1>Números</h1><p class="res">2 números · 1 sin medio de pago</p></div></div>'
         f'<div class="ac"><button type="button" class="cb cb-pri">{MAS} Conectar número</button></div></div>')


def armar(nombre, cuerpo, dialogo=""):
    t = base[:ini] + BANDA + cuerpo + base[fin:]
    t = t.replace(hijos_viejos, hijos_nuevos, 1).replace("Inicio / WhatsApp / Número", "Inicio / WhatsApp / Números")
    if dialogo:
        cierre = t.rindex("</div>", 0, t.index("</x-dc>"))
        t = t[:cierre] + dialogo + t[cierre:]
    t = t.replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


armar("V-WA-Numeros-A", TABLA)
armar("V-WA-Numeros-A2", TABLA, AVISO)
armar("V-WA-Numeros-B", LISTA)
print("ok")
