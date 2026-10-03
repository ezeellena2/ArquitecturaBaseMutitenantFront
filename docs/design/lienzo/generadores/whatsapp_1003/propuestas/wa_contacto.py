"""Ficha del contacto con lo decidido: datos para leer (cuenta vinculada, etiquetas, promociones), conversaciones y difusiones."""
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Contacto.dc.html").read_text(encoding="utf-8")

KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
VOLVER = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>')

ESTILO = """<style data-propuesta="wa-contacto">
.o-g2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.o-g2 .w-it:nth-last-child(-n+2) { border-bottom: 0; }
.w-th.h, .w-tr.h { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) 110px 48px; }
.w-th.d, .w-tr.d { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) 160px 48px; }
.w-tr.h, .w-tr.d { min-height: 52px; }
.w-tr .dos { display: flex; flex-direction: column; line-height: 1.35; }
.w-tr .dos span { font-size: 12px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.o-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--borde); }
.o-tabs span { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; }
.o-tabs span.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.o-tabs .c { font-weight: 500; color: var(--t3); margin-left: 4px; }
.w-it .dato b .w-est { font-size: inherit; color: var(--t1); }
</style>"""


def kebab(n):
    return f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span>'


DATOS = ('<div class="w-caja"><div class="w-cab"><span>Datos del contacto</span></div><div class="o-g2">'
         '<div class="w-it"><span class="dato"><b>+54 9 11 5555-4521</b><span>Número</span></span></div>'
         '<div class="w-it"><span class="dato"><b>Vinculada a su cuenta</b><span>Desde el 20/09/2026 · nombre verificado</span></span></div>'
         '<div class="w-it"><span class="dato"><b>Mayorista</b><span>Etiquetas</span></span></div>'
         '<div class="w-it"><span class="dato"><b><span class="w-est">Acepta promociones</span></b><span>Respondió al bot el 12/09/2026</span></span></div>'
         '</div></div>')
CONVS = [("Hoy", "Quiero hacer un pedido.", "Ventas", "Lucía Fernández", "8"),
         ("12/09/2026", "Hola, ¿cómo hago para pedir una factura?", "Soporte", "Tomás Acosta", "9")]
TABLA_CONV = ('<div class="w-th h"><span>Conversación</span><span>Equipo</span><span>La atendió</span><span style="text-align: right;">Mensajes</span><span class="sr">Acciones</span></div>'
              + "".join(f'<div class="w-tr h"><span class="dos">{f}<span>{m}</span></span><span>{e}</span><span>{a}</span><span class="r">{n}</span>{kebab(f)}</div>' for f, m, e, a, n in CONVS))
DIFS = [("20 % en empanadas", "Leída", "25/09/2026"), ("Horario de fiestas", "Entregada", "15/09/2026"), ("Nuevos productos", "Leída", "02/09/2026")]
TABLA_DIF = ('<div class="w-th d"><span>Difusión</span><span>Estado</span><span>Fecha</span><span class="sr">Acciones</span></div>'
             + "".join(f'<div class="w-tr d"><span>{n}</span><span><span class="w-est{" off" if e == "Entregada" else ""}">{e}</span></span><span>{f}</span>{kebab(n)}</div>' for n, e, f in DIFS))

ini = base.index('<div class="w-bnd">')
fin = base.index("</div></div>\n</x-dc>")


def banda(resumen):
    return (f'<div class="w-bnd"><div class="iz"><a class="vol" href="WA-Contactos.dc.html" aria-label="Volver">{VOLVER}</a><div><h1>Martina López</h1>'
            f'<p class="res">{resumen}</p></div></div><div class="ac"><button type="button" class="ib" aria-label="Acciones de Martina López">{KEBAB}</button>'
            '<button type="button" class="cb cb-sec">Editar contacto</button><a class="cb cb-pri" href="WA-Chats.dc.html">Abrir chat</a></div></div>')


A = (banda("Cliente desde el 12/09/2026") + f'<div class="w-body">{DATOS}'
     f'<div class="w-caja"><div class="w-cab"><span>Conversaciones</span></div>{TABLA_CONV}</div>'
     f'<div class="w-caja"><div class="w-cab"><span>Difusiones recibidas</span></div>{TABLA_DIF}</div></div>')
B = (banda("+54 9 11 5555-4521 · Vinculada a su cuenta · Mayorista · Acepta promociones") + '<div class="w-body">'
     '<div class="o-tabs" role="tablist"><span class="on" role="tab">Conversaciones<span class="c">2</span></span><span role="tab">Difusiones<span class="c">3</span></span></div>'
     f'<div class="w-caja">{TABLA_CONV}</div></div>')

for clave, cuerpo in (("A", A), ("B", B)):
    t = base[:ini] + cuerpo + base[fin:]
    t = t.replace('<span class="cnt">3</span>', '<span class="cnt">2</span>').replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"V-WA-Contacto-{clave}.dc.html").write_text(t, encoding="utf-8")
print("ok")
