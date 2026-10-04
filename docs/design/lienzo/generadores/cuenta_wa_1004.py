"""Mi cuenta › WhatsApp (Etapa 8, ADR 0033), sobre los tableros aprobados de Mi cuenta. Copia los estados de WhatsApp de
Ingreso y los textos reales del front (common.phone, common.code, auth.login):
- Cuenta-Agregar: «WhatsApp» con el campo de país y número (solo los países que habilita WhatsApp; hoy, Argentina) y sus
  error del país que WhatsApp no habilita (solo para un número nuevo). Un correo o número de otra cuenta no da error: la pantalla
  sigue igual y a su dueño le llega un aviso en lugar del código (ADR 0041, 2026-10-03).
- Cuenta-Verificar: el código por WhatsApp, con «Reenviar», y sus errores: incorrecto y vencido.
- Cuenta y Cuenta-Agregar: sin el módulo de WhatsApp, la fila del teléfono y la opción no aparecen.
Cada tablero lleva `data-vuelta="1004-<tablero>"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
LUPA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/>', 14)
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 16, "2.25")
TEL = "011 15-•••••-4521"
ESTILO = """.o-tel { display: grid; grid-template-columns: 104px minmax(0, 1fr); gap: 8px; position: relative; }
.w-cmp .ct.mal { border-color: var(--peligro); }
.p-otp.mal span { border-color: var(--peligro); }
.o-nota { font-size: 12.5px; color: var(--t3); }
.o-paises { position: absolute; z-index: 3; top: calc(100% + 6px); left: 0; width: 280px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); overflow: hidden; }
.o-paises .bus { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; border-bottom: 1px solid var(--borde); color: var(--t3); font-size: 13px; }
.o-paises .op { display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 12px; font-size: 13.5px; background: var(--marca-t); color: var(--marca-tx); font-weight: 500; }
.o-paises .op .c { margin-left: auto; color: var(--t2); font-weight: 400; }
.p-dlg .df .izq { margin-right: auto; }
.p-dlg:has(.o-paises) { overflow: visible; }
.p-dlg:has(.o-paises) .dc { border-radius: 12px 12px 0 0; }
.cb.o-apagado2 { color: var(--t3); cursor: default; }"""


class Tablero:
    def __init__(self, nombre):
        self.nombre = nombre
        self.ruta = PROJ / f"{nombre}.dc.html"
        self.t = self.ruta.read_text(encoding="utf-8")
        self.marca = f'data-vuelta="1004-{nombre}"'

    @property
    def hecho(self):
        return self.marca in self.t

    def rep(self, a, b):
        assert self.t.count(a) == 1, (self.nombre, a[:90], self.t.count(a))
        self.t = self.t.replace(a, b)

    def guardar(self, css=ESTILO):
        self.rep("</helmet>", f"<style {self.marca}>\n{css}\n</style>\n</helmet>")
        self.ruta.write_text(self.t, encoding="utf-8")
        print("ok", self.nombre)

    def dialogo(self):
        ini = self.t.index('<div class="w-oscuro" style="z-index: 6;"></div><div class="p-dlg')
        fin = self.t.index("</div>\n</x-dc>")
        return ini, fin


def estados(pantallas):
    return "".join(f'<sc-if value="{{{{e{i}}}}}" hint-placeholder-val="{{{{{"si" if i == 0 else "no"}}}}}">{p}</sc-if>' for i, p in enumerate(pantallas))


def tweak(b, prop, opciones, extra=""):
    props = json.dumps({prop: {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}}, ensure_ascii=False, separators=(",", ":"))
    vals = "".join(f"      e{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(opciones))
    b.rep("data-props='{\"$preview\"", "data-props='" + props[:-1] + ",\"$preview\"")
    b.rep("class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}",
          "class Component extends DCLogic {\n  renderVals() {\n"
          f"    const e = this.props.{prop} ?? {json.dumps(opciones[0], ensure_ascii=False)};\n\n    return {{\n      si: true,\n      no: false,\n{vals}{extra}    }};\n  }}\n}}")


def dialogo(titulo, cuerpo, botones, texto=""):
    tx = f'<div class="tx">{texto}</div>' if texto else ""
    return (f'<div class="w-oscuro" style="z-index: 6;"></div><div class="p-dlg" role="dialog" aria-label="{titulo}">'
            f'<div class="dc"><span>{titulo}</span><a class="ib" aria-label="Cerrar" href="Cuenta.dc.html">{X}</a></div>{tx}'
            f'<div class="db">{cuerpo}</div><div class="df">{botones}</div></div>')


SEG_WA = '<div class="p-seg" role="group" aria-label="Qué querés agregar"><span>Correo</span><span class="on">WhatsApp</span></div>'
CANCELAR = '<a class="cb cb-sec" href="Cuenta.dc.html">Cancelar</a>'
ENVIAR = CANCELAR + '<a class="cb cb-pri" href="Cuenta-Verificar.dc.html">Enviar código</a>'


def telefono(numero="11 5555-4521", error="", paises=False):
    mal = " mal" if error else ""
    lista = (f'<div class="o-paises" role="listbox" aria-label="País"><div class="bus">{LUPA} Buscar país</div>'
             f'<div class="op" role="option" aria-selected="true">Argentina<span class="c">+54</span>{TILDE}</div></div>') if paises else ""
    err = f'<span class="err2" role="alert">{error}</span>' if error else ""
    return (f'<div class="w-cmp"><span class="rt">Número de WhatsApp</span><div class="o-tel">'
            f'<div class="ct" aria-label="País: Argentina">AR +54 {ABAJO}</div><div class="ct{mal}">{numero}</div>{lista}</div>{err}</div>')


def agregar():
    b = Tablero("Cuenta-Agregar")
    if b.hecho:
        return
    ini, fin = b.dialogo()
    correo = b.t[ini:fin]
    sin_modulo = (correo.replace("Agregar correo o teléfono</span>", "Agregar correo</span>").replace('aria-label="Agregar correo o teléfono"', 'aria-label="Agregar correo"')
                  .replace('<div class="p-seg" role="group" aria-label="Qué querés agregar"><span class="on">Correo</span><span>WhatsApp</span></div>', ""))
    titulo = "Agregar correo o teléfono"
    b.t = b.t[:ini] + estados([
        correo,
        dialogo(titulo, SEG_WA + telefono(), ENVIAR),
        dialogo(titulo, SEG_WA + telefono(paises=True), ENVIAR),
        dialogo(titulo, SEG_WA + telefono("+1 415 555-0134", "Todavía no mandamos códigos a números de ese país."), ENVIAR),
        sin_modulo,
    ]) + b.t[fin:]
    sin_whatsapp(b)
    tweak(b, "estado", ["Correo", "WhatsApp", "WhatsApp: elegir el país", "WhatsApp: país que WhatsApp no habilita",
                        "Sin el módulo de WhatsApp"],
          "      conModulo: e !== 'Sin el módulo de WhatsApp',\n      sinModulo: e === 'Sin el módulo de WhatsApp',\n")
    b.guardar()


def sin_whatsapp(b):
    """Sin el módulo de WhatsApp: ni la fila del teléfono ni «teléfono» en la acción de la caja."""
    i = b.t.index('<div class="w-it"><span class="p-ic"><svg', b.t.index("lucia.fernandez@delta.ejemplo.com"))
    j = b.t.index('<div class="w-it">', i + 10)  # la fila siguiente, la de Google
    fila = b.t[i:j]
    assert "Verificar" in fila and fila.count('<div class="w-it">') == 1, fila[:200]
    b.t = b.t[:i] + f'<sc-if value="{{{{conModulo}}}}" hint-placeholder-val="{{{{si}}}}">{fila}</sc-if>' + b.t[j:]
    m = re.search(r'(<a class="cb cb-sec ch" href="Cuenta-Agregar\.dc\.html">)(<svg.*?</svg>) Agregar correo o teléfono</a>', b.t, flags=re.S)
    assert m
    b.t = b.t.replace(m.group(0), f'<sc-if value="{{{{conModulo}}}}" hint-placeholder-val="{{{{si}}}}">{m.group(0)}</sc-if>'
                      f'<sc-if value="{{{{sinModulo}}}}" hint-placeholder-val="{{{{no}}}}">{m.group(1)}{m.group(2)} Agregar correo</a></sc-if>', 1)


def verificar():
    b = Tablero("Cuenta-Verificar")
    if b.hecho:
        return
    ini, fin = b.dialogo()
    correo = b.t[ini:fin]
    texto = f"Te mandamos un código a <b>{TEL}</b>. Vence en 10 minutos."
    nota = '<span class="o-nota">Llega al WhatsApp de tu celular. En WhatsApp Web no se muestra.</span>'
    otp = '<div class="p-otp" role="group" aria-label="Código"><span>4</span><span>8</span><span class="foco"></span><span></span><span></span><span></span></div>'
    otp_mal = '<div class="p-otp mal" role="group" aria-label="Código"><span>4</span><span>8</span><span>2</span><span>9</span><span>1</span><span>0</span></div>'
    verificar_ = '<a class="cb cb-pri" href="Cuenta.dc.html">Verificar</a>'
    espera = '<span class="cb cb-enl izq o-apagado2" aria-disabled="true">Reenviar en 51 s</span>'
    reenviar = '<button type="button" class="cb cb-enl izq">Reenviar código</button>'
    titulo = "Verificar tu WhatsApp"
    b.t = b.t[:ini] + estados([
        correo,
        dialogo(titulo, otp + nota, espera + CANCELAR + verificar_, texto),
        dialogo(titulo, otp_mal + '<span class="err2" role="alert">El código no es válido.</span>' + nota, espera + CANCELAR + verificar_, texto),
        dialogo(titulo, otp_mal + '<span class="err2" role="alert">El código venció. Pedí uno nuevo.</span>' + nota, reenviar + CANCELAR + verificar_, texto),
    ]) + b.t[fin:]
    tweak(b, "estado", ["Correo", "WhatsApp", "WhatsApp: código incorrecto", "WhatsApp: código vencido"])
    b.guardar()


def cuenta():
    b = Tablero("Cuenta")
    if b.hecho:
        return
    sin_whatsapp(b)
    b.rep('"baja":{"editor":"enum"', '"whatsapp":{"editor":"enum","options":["Con el módulo de WhatsApp","Sin el módulo de WhatsApp"],'
          '"default":"Con el módulo de WhatsApp","section":"Estado"},"baja":{"editor":"enum"')
    b.rep("      si: true, no: false,\n", "      si: true, no: false,\n"
          "      conModulo: this.props.whatsapp !== 'Sin el módulo de WhatsApp',\n      sinModulo: this.props.whatsapp === 'Sin el módulo de WhatsApp',\n")
    b.guardar()


MENU = """.o-mn { position: absolute; z-index: 7; right: 44px; top: 0; width: 220px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); overflow: hidden; }
.o-mn .it { display: flex; align-items: center; min-height: 42px; padding: 0 14px; font-size: 13.5px; color: var(--t1); }
.o-mn .it + .it { border-top: 1px solid var(--borde); }
.o-mn .sep { height: 6px; background: var(--s2); border-top: 1px solid var(--borde); }
.o-mn .sep + .it { border-top: 1px solid var(--borde); }
.o-mn .it.pel { color: var(--peligro); }
.o-fila-menu { position: relative; }
.w-caja:has(.o-mn) { overflow: visible; }
.w-caja:has(.o-mn) > .w-cab { border-radius: 11px 11px 0 0; }"""


def metodo():
    """Cuenta-Metodo (nuevo): el ⋮ del WhatsApp ya verificado («Hacer principal» y «Quitar») y la confirmación con el código
    que llega a otro método; el WhatsApp también es ese otro método para quitar un correo. Para cambiar el número se agrega
    el nuevo y se quita el viejo (decidido el 2026-10-03)."""
    destino = PROJ / "Cuenta-Metodo.dc.html"
    if destino.exists() and 'data-vuelta="1004-Cuenta-Metodo"' in destino.read_text(encoding="utf-8"):
        return
    b = Tablero("Cuenta-Baja")
    b.nombre, b.ruta, b.marca = "Cuenta-Metodo", destino, 'data-vuelta="1004-Cuenta-Metodo"'
    b.t = re.sub(r"<title>.*?</title>", "<title>Mi cuenta · quitar o hacer principal</title>", b.t, count=1, flags=re.S)
    # El WhatsApp ya está verificado (sin segunda línea ni «Verificar») y hay un segundo correo personal.
    i = b.t.index('<div class="w-it"><span class="p-ic"><svg', b.t.index("lucia.fernandez@delta.ejemplo.com"))
    j = b.t.index('<div class="w-it">', i + 10)
    fila_tel = b.t[i:j]
    tel = re.sub(r'<a class="cb cb-enl"[^>]*>Verificar</a>', "", fila_tel.replace("<span>Sin verificar</span>", ""))
    tel = tel.replace('<div class="w-it">', '<div class="w-it o-fila-menu">', 1)
    k = b.t.index('<div class="w-it">', b.t.index("Cómo entrás"))
    fila_correo = b.t[k:b.t.index('<div class="w-it">', k + 10)]
    trabajo = fila_correo.replace("lucia.fer@gmail.com", "lucia.trabajo@gmail.com").replace("<span>Principal</span>", "")
    menu = ('<sc-if value="{{e0}}" hint-placeholder-val="{{si}}"><div class="o-mn" role="menu" aria-label="Acciones de 011 15-5555-4521" style="top: 46px;">'
            '<span class="it" role="menuitem">Hacer principal</span><div class="sep" role="separator"></div><span class="it pel" role="menuitem">Quitar</span></div></sc-if>')
    tel = tel[:-len("</div>")] + menu + "</div>"
    b.t = b.t[:i] + trabajo + tel + b.t[j:]
    ini, fin = b.dialogo()
    otp = '<div class="p-otp" role="group" aria-label="Código"><span>4</span><span>8</span><span class="foco"></span><span></span><span></span><span></span></div>'
    quitar = '<a class="cb cb-pel lleno" href="Cuenta.dc.html">Quitar</a>'
    b.t = b.t[:ini] + estados([
        "",
        dialogo("¿Quitar este WhatsApp?", otp, CANCELAR + quitar,
                "Ya no vas a poder entrar con 011 15-5555-4521. Para confirmar, escribí el código que te mandamos a lu•••@gmail.com."),
        dialogo("¿Hacer principal este WhatsApp?", otp, CANCELAR + '<a class="cb cb-pri" href="Cuenta.dc.html">Hacer principal</a>',
                "Desde ahora te avisamos a 011 15-5555-4521. Para confirmar, escribí el código que te mandamos a lu•••@gmail.com."),
        dialogo("¿Quitar este correo?", otp + '<span class="o-nota">Llega al WhatsApp de tu celular. En WhatsApp Web no se muestra.</span>', CANCELAR + quitar,
                f"Ya no vas a poder entrar con lucia.trabajo@gmail.com. Para confirmar, escribí el código que te mandamos a <b>{TEL}</b>."),
    ]) + b.t[fin:]
    tweak(b, "estado", ["Menú del WhatsApp", "Quitar el WhatsApp", "Hacer principal el WhatsApp", "Quitar un correo: el código llega por WhatsApp"])
    b.guardar(ESTILO + "\n" + MENU)
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    c["boards"]["Cuenta-Metodo.dc.html"] = {"x": 3290, "y": 1280, "w": 1440, "h": 900, "title": "Mi cuenta · quitar o hacer principal",
                                            "page": "personal", "is_interactive": True}
    if "Cuenta-Metodo.dc.html" not in c["order"]:
        c["order"].append("Cuenta-Metodo.dc.html")
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8", newline="")


if __name__ == "__main__":
    cuenta()
    agregar()
    verificar()
    metodo()
