"""Notas internas en un chat: A, el cuadro de escribir cambia entre «Mensaje» y «Nota interna» y la nota se ve solo en el equipo."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
base = (AQUI / "V-WA-Chats-A.dc.html").read_text(encoding="utf-8")
ESTILO = """<style data-propuesta="wa-nota">
.o-nota { align-self: center; max-width: 70%; background: oklch(0.97 0.05 90); border: 1px solid oklch(0.88 0.08 85); color: oklch(0.38 0.07 70); border-radius: 10px; padding: 8px 12px; font-size: 13px; line-height: 1.45; display: flex; flex-direction: column; gap: 2px; }
.o-nota .q { font-size: 11.5px; font-weight: 600; }
.w-escr .o-modo { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); flex-shrink: 0; width: 220px; }
.w-escr .o-modo span { height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.w-escr .o-modo span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.w-escr .area.nota { background: oklch(0.985 0.03 90); border-color: oklch(0.88 0.08 85); }
</style>"""

ANCLA = '<div class="w-m ent"><span class="gl">2 cajas de tornillos. ¿Atienden hasta las 18?</span><span class="pie">10:42</span></div>'
assert base.count(ANCLA) == 1
NOTA = ('<div class="o-nota"><span class="q">Nota interna · Lucía Fernández · 10:43</span>'
        'Es mayorista: confirmar precio con Carolina antes de responder.</div>')
t = base.replace(ANCLA, ANCLA + "\n" + NOTA, 1)
ESC = '<div class="w-escr"><span class="area">Escribí un mensaje</span><button type="button" class="cb cb-pri">Enviar</button></div>'
assert t.count(ESC) == 1
t = t.replace(ESC, '<div class="w-escr"><span class="o-modo"><span>Mensaje</span><span class="on">Nota interna</span></span>'
                   '<span class="area nota">Escribí una nota para el equipo</span><button type="button" class="cb cb-pri">Guardar nota</button></div>', 1)
(AQUI / "V-WA-Nota-A.dc.html").write_text(t.replace("</helmet>", ESTILO + "\n</helmet>", 1), encoding="utf-8")
print("ok")
