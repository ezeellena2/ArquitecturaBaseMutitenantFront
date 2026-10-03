"""Contactos de WhatsApp con lo decidido (etiquetas, promociones, vinculado a su cuenta): con y sin «Importar contactos»."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Contactos.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>')
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
GENTE = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>', 18)
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 11, "3.5")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
GUION = '<span style="color: var(--t3);">—</span>'

ESTILO = """<style data-propuesta="wa-contactos">
.o-fb { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.o-fb .w-bus { flex: 0 0 360px; }
.w-th.k, .w-tr.k { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) 170px 170px 48px; }
.w-tr.k { min-height: 52px; }
.w-tr .dos { display: flex; flex-direction: column; line-height: 1.35; }
.w-tr .dos b { font-weight: 500; }
.w-tr .dos a { font-weight: 500; color: var(--t1); }
.w-tr .dos span { font-size: 12px; color: var(--t3); }
.w-est.baja::before { background: oklch(0.72 0.15 70); }
.o-chk { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.45; grid-column: 1 / -1; }
.o-cas { width: 16px; height: 16px; box-sizing: border-box; border-radius: 4px; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
</style>"""

CONTACTOS = [
    ("Martina López", "+54 9 11 5555-4521 · Vinculada a su cuenta", "Mayorista", ("", "Acepta"), "Hoy"),
    (None, "+54 9 351 555-0192", GUION, ("off", "Sin respuesta"), "Hoy"),
    ("Federico Díaz", "+54 9 11 5555-2087", "Minorista", ("off", "No acepta"), "Ayer"),
    ("Javier Pereyra", "+54 9 11 5555-7310 · Vinculado a su cuenta", "Mayorista", ("", "Acepta"), "Ayer"),
    ("Carla Ruiz", "+54 9 11 5555-1146", GUION, ("baja", "Se dio de baja"), "29/09/2026"),
    ("Laura Méndez", "+54 9 11 5555-3378", "Minorista", ("", "Acepta"), "28/09/2026"),
    ("Sergio Gómez", "+54 9 11 5555-9021", GUION, ("off", "No acepta"), "25/09/2026"),
]


def fila(nombre, l2, etiqueta, promo, ultima):
    uno = f'<a href="WA-Contacto.dc.html">{nombre}</a>' if nombre == "Martina López" else (f"<b>{nombre}</b>" if nombre else f"<b>{l2}</b>")
    dos = f"<span>{l2}</span>" if nombre else ""
    clase, texto = promo
    return (f'<div class="w-tr k"><span class="dos">{uno}{dos}</span><span>{etiqueta}</span><span><span class="w-est {clase}">{texto}</span></span>'
            f'<span>{ultima}</span><span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {nombre or l2}">{KEBAB}</button></span></div>')


TABLA = (f'<div class="w-body"><div class="w-caja o-fb"><span class="w-bus">{LUPA} Buscar por nombre o número</span>'
         f'<span class="w-pil">Etiqueta: todas {ABAJO}</span><span class="w-pil">Promociones: todas {ABAJO}</span></div>'
         '<div class="w-caja"><div class="w-th k"><span>Contacto</span><span>Etiquetas</span><span>Promociones</span><span>Última conversación</span><span class="sr">Acciones</span></div>'
         + "".join(fila(*c) for c in CONTACTOS)
         + '<div class="w-pie"><span>1–7 de 7</span><span>10 por página · Página 1 de 1</span></div></div></div>')

DIALOGO = (f'<div class="w-oscuro"><div class="w-dlg" role="dialog" aria-label="Importar contactos">'
           f'<div class="dc"><span>Importar contactos</span><button type="button" class="ib" aria-label="Cerrar">{X}</button></div>'
           '<div class="db">'
           '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Archivo <span style="color: var(--peligro);">*</span></span><div class="ct">clientes-mayoristas.xlsx<span style="color: var(--marca-tx); font-weight: 600;">Cambiar</span></div></div>'
           f'<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Etiqueta para todos</span><div class="ct">Mayorista {ABAJO}</div></div>'
           f'<label class="o-chk"><span class="o-cas">{TILDE}</span>Estas personas aceptaron recibir mensajes de Grupo Delta por WhatsApp.</label>'
           '</div><div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Importar 48 contactos</button></div></div></div>')

ini = base.index('<div class="w-bnd">')
fin = base.index('<div class="w-pie">', ini)
fin = base.index("</div></div></div>", fin) + len("</div></div></div>")


def armar(nombre, importar, dialogo):
    acciones = '<button type="button" class="cb cb-pri">Importar contactos</button>' if importar else ""
    banda = (f'<div class="w-bnd"><div class="iz"><span class="ic">{GENTE}</span><div><h1>Contactos</h1><p class="res">7 contactos · 3 aceptan promociones</p></div></div>'
             f'<div class="ac">{acciones}</div></div>')
    t = base[:ini] + banda + TABLA + base[fin:]
    if dialogo:
        cierre = t.rindex("</div>", 0, t.index("</x-dc>"))
        t = t[:cierre] + DIALOGO + t[cierre:]
    t = t.replace('<span class="cnt">3</span>', '<span class="cnt">2</span>').replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


armar("V-WA-Contactos-A", True, False)
armar("V-WA-Contactos-A2", True, True)
armar("V-WA-Contactos-B", False, False)
print("ok")
