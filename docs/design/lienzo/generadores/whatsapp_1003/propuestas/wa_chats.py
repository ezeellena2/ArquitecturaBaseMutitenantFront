"""Chats de WhatsApp con lo decidido el 2026-10-03 (bandejas Clientes e Internos, equipos, tomar y pasar, menú del bot):
tres formas de ordenarlo, sobre el tablero real WA-Chats."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Chats.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>')
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
WA = svg('<path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z"/><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z"/>', 18)
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')

ESTILO = """<style data-propuesta="wa-chats">
.o-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; margin: 12px 12px 0; border-radius: 10px; background: var(--s3); }
.o-seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--t2); }
.o-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.o-seg .c { font-weight: 500; color: var(--t3); }
.w-bandeja .filtro { flex-wrap: wrap; }
.w-bandeja .filtro .w-bus { flex-basis: 100%; }
.w-bandeja .filtro .w-pil { height: 32px; font-size: 13px; }
.w-conv .l3 { font-size: 12px; color: var(--t3); }
.w-conv .l3.sin { color: oklch(0.55 0.13 70); }
.o-sis { align-self: center; font-size: 12px; color: var(--t3); }
.w-hilo .hc .acc { display: flex; align-items: center; gap: 8px; }
.o-panel { width: 300px; flex-shrink: 0; border-left: 1px solid var(--borde); display: flex; flex-direction: column; background: #fff; }
.o-panel .pc { display: flex; align-items: center; min-height: 40px; padding: 0 16px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 13px; font-weight: 600; }
.o-panel .it { display: flex; flex-direction: column; gap: 2px; padding: 10px 16px; border-bottom: 1px solid var(--borde); font-size: 13px; }
.o-panel .it span { font-size: 12px; color: var(--t3); }
.o-panel .pie { padding: 12px 16px; }
.w-ln .cnt { margin-left: auto; }
.w-m .gl .bt { display: block; margin-top: 8px; padding-top: 8px; border-top: 1px solid oklch(0.51 0.099 195 / 0.2); text-align: center; font-weight: 600; color: var(--marca-tx); }
</style>"""

CLIENTES = [
    ("ML", "Martina López", "2 cajas de tornillos. ¿Atienden hasta las 18?", "10:42", "on", "Ventas · Lucía Fernández"),
    ("", "+54 9 351 555-0192", "Quiero consultar un pedido.", "10:15", "nuevo", "Ventas · Sin tomar"),
    ("FD", "Federico Díaz", "¿Siguen abiertos el sábado?", "Ayer", "nuevo", "Soporte · Sin tomar"),
    ("JP", "Javier Pereyra", "Perfecto, gracias.", "Ayer", "", "Soporte · Tomás Acosta"),
    ("CR", "Carla Ruiz", "Vos: Te esperamos.", "Lunes", "", "Ventas · Lucía Fernández"),
]


def fila(ini, nombre, prev, hora, clase, l3):
    av = f'<span class="w-av{"" if ini else " g"}">{ini or WA}</span>'
    punto = '<span class="w-punto" aria-label="Sin leer"></span>' if clase == "nuevo" else ""
    sin = " sin" if "Sin tomar" in l3 else ""
    return (f'<div class="w-conv {clase}">{av}<span class="tx"><span class="l1"><b>{nombre}</b><span>{hora}</span></span>'
            f'<span class="l2"><span>{prev}</span>{punto}</span><span class="l3{sin}">{l3}</span></span></div>')


filas = "".join(fila(*c) for c in CLIENTES)
SEG = '<div class="o-seg" role="tablist" aria-label="Bandeja"><span class="on" role="tab" aria-selected="true">Clientes <span class="c">5</span></span><span role="tab" aria-selected="false">Internos <span class="c">2</span></span></div>'
FILTRO = f'<div class="filtro"><span class="w-bus">{LUPA} Buscar por nombre o número</span><span class="w-pil">Equipo: todos {ABAJO}</span><span class="w-pil">Todos {ABAJO}</span></div>'
MENSAJES = """<span class="w-dia">Hoy</span>
<div class="w-m ent"><span class="gl">Hola, buen día. Quiero hacer un pedido.</span><span class="pie">10:39</span></div>
<div class="w-m sal"><span class="gl">Hola, gracias por escribir a Grupo Delta. ¿En qué te ayudamos?<span class="bt">Ver opciones</span></span><span class="pie">Respuesta automática · 10:39</span></div>
<div class="w-m ent"><span class="gl">Hacer un pedido</span><span class="pie">10:40</span></div>
<span class="o-sis">Eligió «Hacer un pedido» · pasó a Ventas</span>
<span class="o-sis">Lucía Fernández tomó la conversación</span>
<div class="w-m sal"><span class="gl">Hola, Martina. ¿Qué te gustaría pedir?</span><span class="pie">Lucía Fernández · 10:41</span></div>
<div class="w-m ent"><span class="gl">2 cajas de tornillos. ¿Atienden hasta las 18?</span><span class="pie">10:42</span></div>"""
CABEZA = (f'<div class="hc"><span class="w-av">ML</span><span class="tx"><b>Martina López</b><span>+54 9 11 5555-4521 · Vinculada a su cuenta · Mayorista</span></span>'
          f'<span class="acc"><button type="button" class="cb cb-sec ch">Pasar</button><button type="button" class="ib" aria-label="Acciones de Martina López">{KEBAB}</button></span></div>')
HILO = (f'<div class="w-hilo">{CABEZA}<div class="w-msjs">{MENSAJES}</div>'
        '<div class="w-escr"><span class="area">Escribí un mensaje</span><button type="button" class="cb cb-pri">Enviar</button></div></div>')
PANEL = ('<div class="o-panel"><div class="pc">Contacto</div>'
         '<div class="it"><b>Martina López</b><span>+54 9 11 5555-4521</span></div>'
         '<div class="it">Vinculada a su cuenta<span>martina.lopez@gmail.com</span></div>'
         '<div class="it">Mayorista<span>Etiquetas</span></div>'
         '<div class="it">Acepta promociones<span>Desde el 12/09/2026</span></div>'
         '<div class="it">Ventas<span>Lo atiende Lucía Fernández</span></div>'
         '<div class="pie"><a class="cb cb-sec ch" href="WA-Contacto.dc.html">Ver ficha</a></div></div>')

ini = base.index('<div class="w-bnd">')
fin = base.index("</div></div>\n</x-dc>")


def armar(nombre, bandeja_arriba, con_panel, menu_bandejas):
    t = base
    lista = f'<div class="w-bandeja">{SEG if bandeja_arriba else ""}{FILTRO}{filas}</div>'
    cuerpo = ('<div class="w-bnd"><div class="iz"><span class="ic">' + WA + '</span><div><h1>' + ("Clientes" if menu_bandejas else "Chats")
              + '</h1><p class="res">5 conversaciones · 2 sin tomar</p></div></div><div class="ac"></div></div>'
              + f'<div class="w-chat">{lista}{HILO}{PANEL if con_panel else ""}</div>')
    t = t[:ini] + cuerpo + t[fin:]
    if menu_bandejas:
        # El grupo WhatsApp del menú: Clientes e Internos como entradas propias, más Contactos y Difusiones.
        viejo = re.search(r'<div class="w-hijos">.*?</div>', t[:ini], flags=re.S).group(0)
        nuevo = ('<div class="w-hijos"><a class="w-ln on" href="WA-Chats.dc.html">Clientes<span class="cnt">2</span></a>'
                 '<a class="w-ln" href="WA-Chats.dc.html">Internos<span class="cnt">1</span></a>'
                 '<a class="w-ln" href="WA-Contactos.dc.html">Contactos</a><a class="w-ln" href="WA-Contactos.dc.html">Difusiones</a></div>')
        t = t.replace(viejo, nuevo, 1)
    t = t.replace('<span class="cnt">3</span>', '<span class="cnt">2</span>')
    t = t.replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


armar("V-WA-Chats-A", True, False, False)
armar("V-WA-Chats-B", True, True, False)
armar("V-WA-Chats-C", False, False, True)
print("ok")
