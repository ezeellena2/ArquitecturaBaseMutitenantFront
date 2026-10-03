"""Chat sin tomar: A, se puede responder y al responder se toma; B, primero hay que tocar «Tomar»."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
base = (AQUI / "V-WA-Chats-A.dc.html").read_text(encoding="utf-8")

KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')

# La fila elegida pasa a ser el chat sin tomar.
t = base.replace('<div class="w-conv on">', '<div class="w-conv">', 1)
t = t.replace('<div class="w-conv nuevo"><span class="w-av g">', '<div class="w-conv nuevo on"><span class="w-av g">', 1)
hc_ini = t.index('<div class="hc">')
hc_fin = t.index('<div class="w-msjs">', hc_ini)
msj_fin = t.index('<div class="w-escr">', hc_fin)
esc_fin = t.index("</div>", t.index("</button>", msj_fin)) + len("</div>")
MENSAJES = """<div class="w-msjs"><span class="w-dia">Hoy</span>
<div class="w-m ent"><span class="gl">Hola, quiero hacer un pedido.</span><span class="pie">10:14</span></div>
<div class="w-m sal"><span class="gl">Hola, gracias por escribir a Grupo Delta. ¿En qué te ayudamos?<span class="bt">Ver opciones</span></span><span class="pie">Respuesta automática · 10:14</span></div>
<div class="w-m ent"><span class="gl">Hacer un pedido</span><span class="pie">10:15</span></div>
<span class="o-sis">Eligió «Hacer un pedido» · pasó a Ventas</span></div>"""


def cabeza(tomar):
    accion = '<button type="button" class="cb cb-pri ch">Tomar</button>' if tomar else ""
    return (f'<div class="hc"><span class="w-av g">+</span><span class="tx"><b>+54 9 351 555-0192</b><span>Sin tomar · Ventas</span></span>'
            f'<span class="acc">{accion}<button type="button" class="ib" aria-label="Acciones del chat">{KEBAB}</button></span></div>')


ESCRIBIR = '<div class="w-escr"><span class="area">Escribí un mensaje</span><button type="button" class="cb cb-pri">Enviar</button></div>'
TOMAR = '<div class="w-escr" style="justify-content: center;"><button type="button" class="cb cb-pri">Tomar para responder</button></div>'

A = t[:hc_ini] + cabeza(True) + MENSAJES + ESCRIBIR + t[esc_fin:]
B = t[:hc_ini] + cabeza(False) + MENSAJES + TOMAR + t[esc_fin:]
A = A.replace('Quiero consultar un pedido.', 'Quiero hacer un pedido.')
B = B.replace('Quiero consultar un pedido.', 'Quiero hacer un pedido.')
(AQUI / "V-WA-Tomar-A.dc.html").write_text(A, encoding="utf-8")
(AQUI / "V-WA-Tomar-B.dc.html").write_text(B, encoding="utf-8")
print("ok")
