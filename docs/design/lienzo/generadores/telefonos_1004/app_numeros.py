"""App · Administración › WhatsApp › Números (A: lista de tres líneas con ⋮) y el aviso «Falta medio de pago» como hoja."""
from app_marco import I, barra, estado, fab, hoja, nav, pagina

ESTILO = """<style data-propuesta="app-numeros">
.ap-mot { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 14px; background: var(--peligro-t); color: oklch(0.42 0.16 25); }
.ap-mot svg { flex-shrink: 0; margin-top: 1px; }
.ap-mot b { display: block; font-size: 15.5px; font-weight: 600; color: oklch(0.38 0.15 25); }
.ap-mot span { font-size: 13.5px; }
.ap-sub { font-size: 13px; font-weight: 600; color: var(--t3); margin-bottom: -2px; }
.ap-pasos { display: flex; flex-direction: column; gap: 14px; margin: 0; padding: 0; list-style: none; }
.ap-pasos li { display: flex; gap: 12px; align-items: center; font-size: 15px; }
.ap-pasos .n { width: 28px; height: 28px; border-radius: 50%; background: var(--s3); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style>"""

N = [("+54 9 11 5555-0100", "Grupo Delta · también en la app", "Toda la organización", "", "Conectado", "640 de 1.000 gratis"),
     ("+54 9 351 555-0200", "Delta Sur", "Delta Sur S.R.L.", "mal", "Falta medio de pago", "")]


def fila(num, nombre, atiende, cl, e, mes):
    i = f'<button type="button" class="ap-i" aria-label="Qué hacer">{I["info"]}</button>' if cl == "mal" else ""
    derecha = f"<span>{mes}</span>" if mes else ""
    return (f'<div class="ap-fila"><div class="tx"><span class="l1">{num}{derecha}</span><span class="l2">{nombre}</span>'
            f'<span class="l3">{atiende} · <span class="w-est {cl}">{e}</span>{i}</span></div>'
            f'<button type="button" class="ap-ib" aria-label="Acciones de {num}">{I["kebab"]}</button></div>')


LISTA = (estado() + barra("Números", "Administración · WhatsApp", volver="T-App-Mas.dc.html")
         + '<div class="ap-cuerpo">' + "".join(fila(*n) for n in N) + "</div>"
         + fab("Conectar número") + nav("mas"))
pagina("T-App-Numeros", LISTA, ESTILO, "Números · teléfono")

AVISO = hoja("+54 9 351 555-0200 no puede responder",
             f'<div class="ap-mot">{I["alerta"]}<div><b>Falta medio de pago en Meta</b><span>Sin medio de pago, Meta no deja mandar mensajes</span></div></div>'
             '<span class="ap-sub">Qué podés hacer</span><ol class="ap-pasos"><li><span class="n">1</span>Entrá a tu WhatsApp Manager de Meta</li>'
             '<li><span class="n">2</span>Agregá un medio de pago a la cuenta</li><li><span class="n">3</span>Volvé acá y tocá «Comprobar»</li></ol>',
             '<button type="button" class="cb cb-sec">Comprobar</button><button type="button" class="cb cb-pri">Ir a Meta</button>')
pagina("T-App-Pago", LISTA + AVISO, ESTILO, "Falta medio de pago · teléfono")
print("ok")
