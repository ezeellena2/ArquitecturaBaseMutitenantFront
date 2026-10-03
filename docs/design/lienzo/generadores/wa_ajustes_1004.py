"""Ajustes de escritorio que salieron de los teléfonos de WhatsApp (2026-10-03):
- la nota interna se prende con un botón a la izquierda de donde se escribe (reemplaza «Mensaje | Nota interna»);
- «Importar contactos» sin la casilla de consentimiento y con «Descargar ejemplo»: el consentimiento va por contacto,
  en la columna «Acepta promociones» del archivo.
Marca cada tablero con `data-vuelta="1004-<tablero>"`; no se repite. Corre después de wa_vuelta_1003.py."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

NOTA = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/><path d="M8.5 12h7"/><path d="M8.5 16h5"/></svg>')
BAJAR = ('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5v10"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/></svg>')
CSS_NOTA = """<style data-vuelta="1004-nota">
.w-escr .o-nt { width: 40px; height: 40px; flex-shrink: 0; box-sizing: border-box; border-radius: 10px; border: 1px solid var(--borde2); background: #fff; color: var(--t2); display: inline-flex; align-items: center; justify-content: center; padding: 0; }
.w-escr .o-nt.on { background: oklch(0.95 0.06 88); border-color: oklch(0.85 0.09 85); color: oklch(0.45 0.1 70); }
</style>"""


def boton(on=False):
    return (f'<button type="button" class="o-nt{" on" if on else ""}" aria-label="Nota interna" aria-pressed="{"true" if on else "false"}" '
            f'title="Nota interna">{NOTA}</button>')


def marcar(nombre, cambio):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    marca = f'data-vuelta="1004-{nombre}"'
    if marca in t:
        return
    t = cambio(t).replace("</helmet>", f"<style {marca}></style>\n</helmet>", 1)
    ruta.write_text(t, encoding="utf-8")
    print("ok", nombre)


def nota_apagada(t):
    assert t.count('<div class="w-escr">') == 1
    return t.replace('<div class="w-escr">', '<div class="w-escr">' + boton(), 1).replace("</helmet>", CSS_NOTA + "\n</helmet>", 1)


def nota_prendida(t):
    viejo = '<div class="w-escr"><span class="o-modo"><span>Mensaje</span><span class="on">Nota interna</span></span>'
    assert t.count(viejo) == 1
    return t.replace(viejo, '<div class="w-escr">' + boton(True), 1).replace("</helmet>", CSS_NOTA + "\n</helmet>", 1)


def importar(t):
    ini = t.index('<label class="o-chk">')
    t = t[:ini] + t[t.index("</label>", ini) + len("</label>"):]
    viejo = '<span class="rt">Archivo <span style="color: var(--peligro);">*</span></span>'
    assert t.count(viejo) == 1
    nuevo = ('<span class="rt" style="display: flex; align-items: center; justify-content: space-between;"><span>Archivo <span style="color: var(--peligro);">*</span></span>'
             f'<a href="#" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--marca-tx); text-decoration: none;">{BAJAR} Descargar ejemplo</a></span>')
    return t.replace(viejo, nuevo, 1)


for n in ("WA-Chats", "WA-Chats-SinTomar", "WA-Chats-Pasar", "WA-Chats-24h", "WA-Chats-Plantilla"):
    marcar(n, nota_apagada)
marcar("WA-Chats-Nota", nota_prendida)
marcar("WA-Contactos-Importar", importar)
