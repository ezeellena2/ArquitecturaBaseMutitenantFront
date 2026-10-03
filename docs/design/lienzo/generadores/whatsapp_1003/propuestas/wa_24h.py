"""Pasaron 24 horas desde el último mensaje del cliente: A, cartel ámbar arriba y «Elegir plantilla» abajo; B, todo donde se escribe."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
base = (AQUI / "V-WA-Chats-A.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


RELOJ = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 18, "2")
INFO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 16, "2")
ESTILO = """<style data-propuesta="wa-24h">
.o-cartel { display: flex; align-items: center; gap: 10px; min-height: 44px; box-sizing: border-box; padding: 6px 12px 6px 14px; background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); font-size: 13px; border-bottom: 1px solid oklch(0.9 0.06 85); flex-shrink: 0; }
.o-cartel .tx { flex: 1; }
.o-i { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: 0; background: none; color: oklch(0.45 0.1 70); border-radius: 50%; }
.o-24 { display: flex; align-items: center; gap: 8px; flex: 1; color: oklch(0.45 0.1 70); font-size: 13px; }
</style>"""

# El chat de Martina, pero con su último mensaje de ayer.
t = base.replace('<span class="w-dia">Hoy</span>', '<span class="w-dia">Ayer</span>', 1)
ESC = '<div class="w-escr"><span class="area">Escribí un mensaje</span><button type="button" class="cb cb-pri">Enviar</button></div>'
assert t.count(ESC) == 1
CARTEL = f'<div class="o-cartel">{RELOJ}<span class="tx">Pasaron 24 horas desde su último mensaje</span><button type="button" class="o-i" aria-label="Qué significa">{INFO}</button></div>'
A = t.replace('<div class="w-msjs">', CARTEL + '<div class="w-msjs">', 1).replace(
    ESC, '<div class="w-escr" style="justify-content: center;"><button type="button" class="cb cb-pri">Elegir plantilla</button></div>', 1)
B = t.replace(ESC, f'<div class="w-escr"><span class="o-24">{RELOJ} Pasaron 24 horas<button type="button" class="o-i" aria-label="Qué significa">{INFO}</button></span>'
                   '<button type="button" class="cb cb-pri">Elegir plantilla</button></div>', 1)
for n, x in (("V-WA-24h-A", A), ("V-WA-24h-B", B)):
    (AQUI / f"{n}.dc.html").write_text(x.replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
print("ok")
