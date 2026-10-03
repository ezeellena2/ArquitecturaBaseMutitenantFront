"""Perfil personal › Mensajes (nueva): las conversaciones que la persona vinculó a su cuenta.
A: para leer, y se sigue en WhatsApp. B: también se escribe desde la plataforma."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "Inicio-Personal.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


CHAT = svg('<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/>', 18)
LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>')
WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>')
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')

ESTILO = """<style data-propuesta="wa-mensajes">
.w-conv .l3 { font-size: 12px; color: var(--t3); }
.o-av { width: 32px; height: 32px; border-radius: 8px; background: oklch(0.93 0.02 76); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.w-hilo .hc .acc { display: flex; align-items: center; gap: 8px; }
.o-seguir { flex-shrink: 0; display: flex; justify-content: center; padding: 12px 16px; border-top: 1px solid var(--borde); background: #fff; }
</style>"""

ORGS = [("LC", "La Clementina", "Vos: Gracias, paso a las 17.", "10:42", "on"),
        ("GD", "Grupo Delta", "Tu pedido 1043 está listo.", "Ayer", ""),
        ("FR", "Ferretería Rosales", "Te esperamos.", "28/09", "")]
LISTA = ('<div class="w-bandeja"><div class="filtro"><span class="w-bus">' + LUPA + ' Buscar por organización</span></div>'
         + "".join(f'<div class="w-conv {c}"><span class="o-av">{i}</span><span class="tx"><span class="l1"><b>{n}</b><span>{h}</span></span>'
                   f'<span class="l2"><span>{p}</span></span></span></div>' for i, n, p, h, c in ORGS)
         + "</div>")
MENSAJES = """<span class="w-dia">Hoy</span>
<div class="w-m sal"><span class="gl">Hola, ¿tienen empanadas de humita para hoy?</span><span class="pie">10:30</span></div>
<div class="w-m ent"><span class="gl">Hola Lucía, sí. ¿Cuántas querés?</span><span class="pie">La Clementina · 10:35</span></div>
<div class="w-m sal"><span class="gl">Una docena. Paso a las 17.</span><span class="pie">10:40</span></div>
<div class="w-m ent"><span class="gl">Perfecto, te las dejamos listas.</span><span class="pie">La Clementina · 10:41</span></div>
<div class="w-m sal"><span class="gl">Gracias, paso a las 17.</span><span class="pie">10:42</span></div>"""
CABEZA = (f'<div class="hc"><span class="o-av">LC</span><span class="tx"><b>La Clementina</b><span>+54 9 11 5555-0300 · Vinculada desde el 20/09/2026</span></span>'
          f'<span class="acc"><button type="button" class="ib" aria-label="Acciones de La Clementina">{KEBAB}</button></span></div>')
PIE_A = f'<div class="o-seguir"><button type="button" class="cb cb-pri">{WA} Seguir en WhatsApp</button></div>'
PIE_B = '<div class="w-escr"><span class="area">Escribí un mensaje</span><button type="button" class="cb cb-pri">Enviar</button></div>'


def cuerpo(pie):
    return (f'<div class="w-bnd"><div class="iz"><span class="ic">{CHAT}</span><div><h1>Mensajes</h1><p class="res">3 organizaciones</p></div></div><div class="ac"></div></div>'
            f'<div class="w-chat">{LISTA}<div class="w-hilo">{CABEZA}<div class="w-msjs">{MENSAJES}</div>{pie}</div></div>')


ini = base.index('<div class="w-bnd">')
fin = base.index("</div></div>\n</x-dc>")
nav_viejo = re.search(r'<nav class="w-nav">.*?</nav>', base, flags=re.S).group(0)
links = re.findall(r'<a class="w-ln[^"]*" href="[^"]+">.*?</a>', nav_viejo, flags=re.S)
nav_nuevo = ('<nav class="w-nav">' + links[0].replace('w-ln on', 'w-ln') + f'<a class="w-ln on" href="#">{CHAT.replace("18", "18")} Mensajes</a>' + links[1] + "</nav>")


def armar(nombre, pie):
    t = base[:ini] + cuerpo(pie) + base[fin:]
    t = t.replace(nav_viejo, nav_nuevo, 1).replace('<header class="w-tb"><span>Inicio</span>', '<header class="w-tb"><span>Mensajes</span>', 1)
    t = t.replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


armar("V-Mensajes-A", PIE_A)
armar("V-Mensajes-B", PIE_B)
print("ok", len(links))
