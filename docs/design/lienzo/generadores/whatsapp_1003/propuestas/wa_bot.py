"""Administración › WhatsApp › Bot con lo decidido (respuestas, menú que deriva a equipos, preguntas del bot, internos):
en cajas para editar, o como recorrido dibujado."""
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent / "salida"  # lo que arma cada propuesta
LIENZO = pathlib.Path(__file__).resolve().parent.parent / "base"  # tableros de partida, copiados antes de la vuelta
base = (LIENZO / "WA-Respuestas.dc.html").read_text(encoding="utf-8")


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


BOT = svg('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4.5V8"/><circle cx="9.5" cy="13.5" r="1"/><circle cx="14.5" cy="13.5" r="1"/>', 18)
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 14, "2.25")
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')

ESTILO = """<style data-propuesta="wa-bot">
.o-fb { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
.w-it .num { width: 28px; height: 28px; border-radius: 50%; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 600; flex-shrink: 0; }
.w-cab .cb { margin-right: 4px; }
.o-flujo { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 24px; }
.o-nodo { width: 200px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; padding: 10px 14px; display: flex; flex-direction: column; gap: 2px; font-size: 13px; text-align: center; }
.o-nodo b { font-weight: 600; }
.o-nodo span { font-size: 12px; color: var(--t3); }
.o-nodo.ini { background: var(--s3); border-color: var(--borde); }
.o-nodo.preg { border-style: dashed; }
.o-nodo.eq { background: var(--marca-t); border-color: oklch(0.51 0.099 195 / 0.35); }
.o-lin { width: 2px; height: 22px; background: var(--borde2); }
.o-ramas { display: flex; gap: 14px; align-items: flex-start; position: relative; padding-top: 22px; }
.o-ramas::before { content: ""; position: absolute; top: 0; left: 80px; right: 80px; height: 2px; background: var(--borde2); }
.o-rama { display: flex; flex-direction: column; align-items: center; position: relative; }
.o-rama::before { content: ""; position: absolute; top: -22px; left: 50%; width: 2px; height: 22px; background: var(--borde2); }
.o-rot { font-size: 12px; color: var(--t3); margin: 4px 0; }
.o-dos { display: flex; gap: 40px; align-items: flex-start; }
.o-ramas .o-nodo { width: 160px; }
.o-nodo.preg { width: 300px; }
.o-col { display: flex; flex-direction: column; align-items: center; }
</style>"""


def kb(n):
    return f'<button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button>'


def fila(uno, dos, sw=None, num=None):
    izq = f'<span class="num">{num}</span>' if num else ""
    interruptor = f'<span class="w-sw{"" if sw else " off"}" role="switch" aria-checked="{"true" if sw else "false"}" aria-label="{uno}"></span>' if sw is not None else ""
    return f'<div class="w-it">{izq}<span class="dato"><b>{uno}</b><span>{dos}</span></span>{interruptor}{kb(uno)}</div>'


NUMERO = f'<div class="w-caja o-fb"><span class="w-pil">Número: +54 9 11 5555-0100 · Toda la organización {ABAJO}</span></div>'
A = (NUMERO
     + '<div class="w-caja"><div class="w-cab"><span>Respuestas automáticas</span></div>'
     + fila("Bienvenida", "La primera vez que alguien escribe", True) + fila("Fuera de horario", "Lunes a viernes, de 9 a 18", True) + "</div>"
     + f'<div class="w-caja"><div class="w-cab"><span>Menú</span><button type="button" class="cb cb-sec ch">{MAS} Agregar opción</button></div>'
     + fila("Hacer un pedido", "Pasa a Ventas", num="1") + fila("Consultar un pedido", "Pasa a Soporte", num="2")
     + fila("Horarios y dirección", "Contesta: «Estamos en Av. Corrientes 1234, de 9 a 18»", num="3") + fila("Hablar con alguien", "Pasa a Atención general", num="4") + "</div>"
     + '<div class="w-caja"><div class="w-cab"><span>Además</span></div>'
     + fila("Preguntar por promociones", "Al terminar la primera conversación", True) + fila("Ofrecer vincular su cuenta", "Si el número es de una persona registrada", True)
     + fila("Mensajes de empleados", "Pasan a Carga de pedidos, sin menú") + "</div>")


def nodo(b, s="", clase=""):
    return f'<div class="o-nodo {clase}"><b>{b}</b>{f"<span>{s}</span>" if s else ""}</div>'


LIN = '<div class="o-lin"></div>'
RAMAS = ('<div class="o-ramas">'
         + "".join(f'<div class="o-rama"><span class="o-rot">{r}</span>{nodo(b, s, c)}</div>' for r, b, s, c in [
             ("1", "Ventas", "Equipo", "eq"), ("2", "Soporte", "Equipo", "eq"), ("3", "Contesta", "Horarios y dirección", ""), ("4", "Atención general", "Equipo", "eq")])
         + "</div>")
B = (NUMERO + '<div class="w-caja"><div class="w-cab"><span>Recorrido</span></div><div class="o-flujo">'
     + nodo("Llega un mensaje", "", "ini") + LIN + nodo("¿Es un empleado?", "Su número está en una cuenta de la organización", "preg") + LIN
     + '<div class="o-dos"><div class="o-col"><span class="o-rot">Sí</span>' + nodo("Carga de pedidos", "Equipo · bandeja Internos", "eq") + '</div>'
     + '<div class="o-col"><span class="o-rot">No</span>' + nodo("Bienvenida", "o «Fuera de horario»") + LIN + nodo("Menú", "4 opciones") + RAMAS + "</div></div>"
     + "</div></div>")

ini = base.index('<div class="w-bnd">')
fin = base.index("</div></div>\n</x-dc>")
hijos_viejos = re.search(r'<aside class="w-panel".*?<div class="w-hijos">.*?</div>', base, flags=re.S).group(0)
hijos_nuevos = re.sub(r'<div class="w-hijos">.*?</div>$', '<div class="w-hijos"><a class="w-ln" href="WA-Admin.dc.html">Números</a>'
                      '<a class="w-ln on" href="WA-Respuestas.dc.html">Bot</a><a class="w-ln" href="WA-Respuestas.dc.html">Equipos</a>'
                      '<a class="w-ln" href="WA-Plantillas.dc.html">Plantillas</a></div>', hijos_viejos, flags=re.S)


def armar(nombre, cuerpo, acciones=""):
    banda = (f'<div class="w-bnd"><div class="iz"><span class="ic">{BOT}</span><div><h1>Bot</h1><p class="res">Activo · 4 opciones en el menú</p></div></div>'
             f'<div class="ac">{acciones}</div></div>')
    t = base[:ini] + banda + f'<div class="w-body" style="overflow: auto;">{cuerpo}</div>' + base[fin:]
    t = t.replace(hijos_viejos, hijos_nuevos, 1).replace("Inicio / WhatsApp / Respuestas automáticas", "Inicio / WhatsApp / Bot")
    t = t.replace("</helmet>", ESTILO + "\n</helmet>", 1)
    (AQUI / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


TABS_CSS = """<style data-propuesta="wa-bot-tabs">
.o-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--borde); flex-shrink: 0; }
.o-tabs span { padding: 10px 14px; font-size: 13.5px; font-weight: 600; color: var(--t2); border-bottom: 2px solid transparent; margin-bottom: -1px; }
.o-tabs span.on { color: var(--marca-tx); border-bottom-color: var(--marca); }
.o-nodo.sel { box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.25); border-color: var(--marca); }
</style>"""


def tabs(cual):
    return ('<div class="o-tabs" role="tablist"><span class="' + ("on" if cual == "conf" else "") + '" role="tab">Configuración</span>'
            '<span class="' + ("on" if cual == "rec" else "") + '" role="tab">Recorrido</span></div>')


armar("V-WA-Bot-A", A)
armar("V-WA-Bot-B", B, '<button type="button" class="cb cb-sec">Editar recorrido</button>')

armar("V-WA-Bot-C1", tabs("conf") + A)
armar("V-WA-Bot-C2", tabs("rec") + B.replace('<div class="o-nodo "><b>Menú</b>', '<div class="o-nodo sel"><b>Menú</b>'))
for n in ("V-WA-Bot-C1", "V-WA-Bot-C2"):
    f = AQUI / f"{n}.dc.html"
    f.write_text(f.read_text(encoding="utf-8").replace("</helmet>", TABS_CSS + "\n</helmet>", 1), encoding="utf-8")
print("ok")
