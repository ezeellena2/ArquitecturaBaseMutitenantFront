"""Perfil personal refinado con el criterio: Inicio y Mi cuenta (web y celular) y los diálogos de Mi cuenta."""
import json
import pathlib
import shutil

# Reuso las piezas comunes (CSS, íconos, banda, kebab) de los tableros de WhatsApp, sin generar nada de ellos.
fuente = pathlib.Path(__file__).resolve().parent / "whatsapp_tableros.py".read_text(encoding="utf-8")
g = {"__file__": __file__}  # el mismo directorio: las rutas de whatsapp_tableros.py se resuelven igual
exec(fuente[:fuente.index("TABLEROS = {}")], g)
CSS, I, KEBAB, MAS, kebab, banda, svg, HEAD_BASE, PROJ = (g[k] for k in ("CSS", "I", "KEBAB", "MAS", "kebab", "banda", "svg", "HEAD_BASE", "PROJ"))

PAGINA = "personal"
MARCA = " · para aprobar"
PERSONA = svg('<circle cx="12" cy="8" r="3.75"/><path d="M5 20a7 7 0 0 1 14 0"/>')
MAIL = svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>', 16)
GOOGLE = ('<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"/>'
          '<path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/>'
          '<path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z"/></svg>')
TRI = svg('<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>', 18, "2")
OK_AVISO = '<span style="color: oklch(0.55 0.13 155); display: inline-flex;">' + svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 18, "2") + '</span>'

CSS_P = """<style data-propuesta="perfil">
.p-hoja { padding: 16px 20px 20px; display: flex; gap: 16px; flex-wrap: wrap; }
.p-mov .p-hoja { flex-direction: column; padding: 14px 16px 16px; }
.p-mov .w-cmp .ct { height: 44px; }
.p-ic { color: var(--t3); display: inline-flex; width: 18px; justify-content: center; }
.p-aviso { position: absolute; z-index: 8; right: 20px; bottom: 20px; width: 340px; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); font-size: 13px; }
.p-otp { display: flex; gap: 8px; }
.p-otp span { width: 40px; height: 44px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; background: #fff; }
.p-otp span.foco { border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.15); }
.p-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px; border-radius: 10px; background: var(--s3); }
.p-seg span { height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--t2); }
.p-seg span.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.12); }
.p-dlg { position: absolute; z-index: 7; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 420px; background: #fff; border-radius: 12px; box-shadow: 0 24px 48px oklch(0.2 0.014 78 / 0.28); overflow: hidden; }
.p-dlg.normal { width: 560px; }
.p-dlg .dc { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 8px 0 20px; background: oklch(0.945 0.018 76); border-bottom: 1px solid oklch(0.89 0.02 76); font-size: 15px; font-weight: 600; }
.p-dlg .tx { padding: 16px 20px 0; font-size: 13.5px; line-height: 1.55; color: var(--t2); }
.p-dlg .db { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
.p-dlg .df { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--borde); }
:where(.w-app, .w-tel) a { text-decoration: none; color: inherit; cursor: pointer; }
</style>"""


def sidebar_personal(activo):
    ln = lambda clave, href, icono, texto: f'<a class="w-ln{" on" if activo == clave else ""}" href="{href}">{icono} {texto}</a>'
    return (f'<aside class="w-sb" aria-label="Menú principal"><div class="w-mk"><span class="brand" style="width: 28px; height: 28px; border-radius: 8px;"></span>ArquitecturaBase</div>'
            f'<div class="w-cx"><b>Personal</b><span>Tu perfil personal</span></div>'
            f'<nav class="w-nav">{ln("inicio", "Inicio-Personal.dc.html", I["casa"], "Inicio")}{ln("cuenta", "Cuenta.dc.html", PERSONA, "Mi cuenta")}</nav>'
            f'<div class="w-esp"></div>'
            f'<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fer@gmail.com</span></span></div></aside>')


def topbar_personal(migas):
    return (f'<header class="w-tb"><span>{migas}</span><span class="um"><span class="w-av">L</span>'
            f'<span class="tx"><b>Lucía Fernández</b><span>Personal</span></span>{I["abajo"]}</span></header>')


def web_p(cuerpo, activo, migas, extra=""):
    return (f'<div class="w-app">{sidebar_personal(activo)}<div class="w-co">{topbar_personal(migas)}{cuerpo}</div>{extra}</div>')


def tel_tb():
    return f'<header class="w-tb"><span style="display: inline-flex;">{I["menu"]}</span><b style="font-size: 14px;">ArquitecturaBase</b><span class="w-av chico">L</span></header>'


CARTEL_PROPIO = (f'<div class="w-cartel">{TRI}<span class="tx">Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa.</span>'
                 f'<a class="cb cb-sec ch" href="Cuenta-Agregar.dc.html">Agregar</a></div>')


def campo(rotulo, valor, ancho, desplegable=False, hueco=None):
    """Un campo del criterio. Con `hueco`, el valor sale de renderVals y se puede editar en Play."""
    if hueco:
        control = f'<input class="ct" style="font: inherit; color: var(--t1);" type="text" aria-label="{rotulo}" value="{{{{{hueco}}}}}" onChange="{{{{on_{hueco}}}}}">'
    else:
        control = f'<div class="ct">{valor} {I["abajo"] if desplegable else ""}</div>'
    estilo = f' style="width: {ancho}px;"' if ancho else ""
    return f'<div class="w-cmp"{estilo}><span class="rt">{rotulo}</span>{control}</div>'


def caja(titulo, cuerpo, accion=""):
    return f'<div class="w-caja"><div class="w-cab"><span>{titulo}</span>{accion}</div>{cuerpo}</div>'


def fila(icono, valor, segunda, derecha):
    return (f'<div class="w-it"><span class="p-ic">{icono}</span><span class="dato"><b>{valor}</b><span>{segunda}</span></span>{derecha}</div>')


def metodos(movil=False):
    agregar = "Cuenta-Agregar.dc.html"
    filas = (fila(MAIL, "lucia.fer@gmail.com", "Principal", kebab("lucia.fer@gmail.com"))
             + fila(MAIL, "lucia.fernandez@delta.ejemplo.com", "Administrado por Grupo Delta", kebab("lucia.fernandez@delta.ejemplo.com"))
             + fila(I["wa"].replace('width="18" height="18"', 'width="16" height="16"'), "011 15-5555-4521", "Sin verificar",
                    f'<a class="cb cb-enl" style="font-size: 13px;" href="Cuenta-Verificar.dc.html">Verificar</a>{kebab("011 15-5555-4521")}')
             + fila(GOOGLE, "Google", "Sin vincular", '<button type="button" class="cb cb-sec ch">Vincular</button>'))
    accion = (f'<a class="cb cb-sec ch" href="{agregar}">{MAS} Agregar</a>' if movil
              else f'<a class="cb cb-sec ch" href="{agregar}">{MAS} Agregar correo o teléfono</a>')
    return caja("Cómo entrás", filas, accion)


PRIVACIDAD = caja("Privacidad",
                  fila(svg('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>', 16), "Exportar mis datos", "Te mandamos un enlace por correo para descargarlos",
                       '<button type="button" class="cb cb-sec ch">Exportar</button>')
                  + fila(svg('<path d="M5 7h14"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6.5 7l1 12.5h9l1-12.5"/><path d="M9.5 7V4.5h5V7"/>', 16),
                         "Dar de baja mi cuenta", "Tenés 30 días para arrepentirte",
                         '<a class="cb cb-pel ch" href="Cuenta-Baja.dc.html">Dar de baja</a>'))


def cuerpo_cuenta(interactivo):
    if interactivo:
        res = '<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><span style="color: oklch(0.5 0.12 70); font-weight: 500;">Cambios sin guardar</span></sc-if>'
        acciones = ('<button type="button" class="cb cb-sec" onClick="{{descartar}}">Descartar cambios</button>'
                    '<button type="button" class="cb cb-pri" onClick="{{guardar}}" disabled="{{limpio}}">Guardar cambios</button>')
        nombre = campo("Nombre y apellido", None, 360, hueco="nombre")
    else:
        res = ""
        acciones = ('<button type="button" class="cb cb-sec">Descartar cambios</button>'
                    '<button type="button" class="cb cb-pri" disabled="{{si}}">Guardar cambios</button>')
        nombre = campo("Nombre y apellido", "Lucía Fernández", 360)
    datos = caja("Tus datos", '<div class="p-hoja">' + nombre + campo("Idioma y región", "Español (Argentina)", 260, True)
                 + campo("Zona horaria", "Buenos Aires (GMT−3)", 260, True) + "</div>")
    return banda("Mi cuenta", res, acciones=acciones, icono=PERSONA) + f'<div class="w-body">{datos}{metodos()}{PRIVACIDAD}</div>'


TOAST = ('<sc-if value="{{aviso}}" hint-placeholder-val="{{no}}"><div class="p-aviso" role="status">' + OK_AVISO
         + '<span>{{aviso}}</span></div></sc-if>')


def dialogo(titulo, cuerpo, botones, ancho="", texto=""):
    tx = f'<div class="tx">{texto}</div>' if texto else ""
    return (f'<div class="w-oscuro" style="z-index: 6;"></div><div class="p-dlg {ancho}" role="dialog" aria-label="{titulo}">'
            f'<div class="dc"><span>{titulo}</span><a class="ib" aria-label="Cerrar" href="Cuenta.dc.html">{I["x"]}</a></div>{tx}'
            f'<div class="db">{cuerpo}</div><div class="df">{botones}</div></div>')


CANCELAR = '<a class="cb cb-sec" href="Cuenta.dc.html">Cancelar</a>'
OTP = '<div class="p-otp" role="group" aria-label="Código"><span>4</span><span>8</span><span class="foco"></span><span></span><span></span><span></span></div>'

TABLEROS = {
    "Inicio-Personal": ("Inicio personal · /", 1440, 900, True, web_p(
        banda("Inicio", "", icono=I["casa"]) + f'<div class="w-body">{CARTEL_PROPIO}</div>', "inicio", "Inicio")),
    "Cuenta": ("Mi cuenta · /cuenta", 1440, 900, True, web_p(cuerpo_cuenta(True), "cuenta", "Inicio / Mi cuenta", TOAST)),
    "Cuenta-Agregar": ("Mi cuenta · agregar correo o teléfono", 1440, 900, True, web_p(cuerpo_cuenta(False), "cuenta", "Inicio / Mi cuenta", dialogo(
        "Agregar correo o teléfono",
        '<div class="p-seg" role="group" aria-label="Qué querés agregar"><span class="on">Correo</span><span>WhatsApp</span></div>' + campo("Correo", "lucia.trabajo@gmail.com", None),
        CANCELAR + '<a class="cb cb-pri" href="Cuenta-Verificar.dc.html">Enviar código</a>'))),
    "Cuenta-Verificar": ("Mi cuenta · verificar", 1440, 900, True, web_p(cuerpo_cuenta(False), "cuenta", "Inicio / Mi cuenta", dialogo(
        "Verificar tu correo", OTP, CANCELAR + '<a class="cb cb-pri" href="Cuenta.dc.html">Verificar</a>',
        texto="Te mandamos un código a lu•••@gmail.com."))),
    "Cuenta-Baja": ("Mi cuenta · dar de baja", 1440, 900, True, web_p(cuerpo_cuenta(False), "cuenta", "Inicio / Mi cuenta", dialogo(
        "¿Dar de baja tu cuenta?",
        '<div class="w-cmp"><span class="rt">Motivo <span style="color: var(--peligro);">*</span></span><div class="ct area">Ya no la uso.</div></div>'
        '<div class="w-cmp"><span class="rt">Código que te mandamos a lu•••@gmail.com</span>' + OTP + '</div>',
        CANCELAR + '<a class="cb cb-pel lleno" href="Cuenta.dc.html">Dar de baja</a>', "normal",
        "Cerramos todas tus sesiones. Si ingresás en los próximos 30 días, podés cancelar la baja; después eliminamos tu cuenta, tus métodos de ingreso, tu espacio personal y tus membresías."))),
    "M-Inicio-Personal": ("Inicio personal · teléfono", 390, 844, False, f"""<div class="w-tel p-mov">{tel_tb()}
      {banda("Inicio", "", icono=I["casa"])}<div class="w-body">{CARTEL_PROPIO}</div></div>"""),
    "M-Cuenta": ("Mi cuenta · teléfono", 390, 844, False, f"""<div class="w-tel p-mov">{tel_tb()}
      {banda("Mi cuenta", '<span style="color: oklch(0.5 0.12 70); font-weight: 500;">Cambios sin guardar</span>', icono=PERSONA)}
      <div class="w-body" style="overflow: hidden;">{caja("Tus datos", '<div class="p-hoja">' + campo("Nombre y apellido", "Lucía Fernández", None) + campo("Idioma y región", "Español (Argentina)", None, True) + campo("Zona horaria", "Buenos Aires (GMT−3)", None, True) + '</div>')}
      {metodos(movil=True)}</div>
      <div class="w-escr" style="padding: 12px 16px 20px;"><button type="button" class="cb cb-sec" style="flex: 1; height: 44px;">Descartar</button><button type="button" class="cb cb-pri" style="flex: 1; height: 44px;">Guardar</button></div></div>"""),
}

SCRIPT_CUENTA = """class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { nombre: 'Lucía Fernández', guardado: 'Lucía Fernández', aviso: '' };
  }
  renderVals() {
    const s = this.state;
    return {
      si: true, no: false,
      nombre: s.nombre,
      on_nombre: (e) => this.setState({ nombre: e.target.value }),
      sucio: s.nombre !== s.guardado,
      limpio: s.nombre === s.guardado,
      descartar: () => this.setState({ nombre: s.guardado }),
      guardar: () => {
        this.setState({ guardado: s.nombre, aviso: 'Guardamos tus datos.' });
        clearTimeout(this.t);
        this.t = setTimeout(() => this.setState({ aviso: '' }), 3000);
      },
      aviso: s.aviso,
    };
  }
}"""
SCRIPT_SIMPLE = "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}"


def archivo(titulo, w, h, cuerpo, script):
    head = HEAD_BASE.replace("<title>Criterio · Botones</title>", f"<title>{titulo}</title>")
    tag = (f"<script type=\"text/x-dc\" data-dc-script data-props='{{\"$preview\":{{\"width\":{w},\"height\":{h}}}}}'>\n{script}\n</script>")
    return "\n".join([head, CSS, CSS_P, "</helmet>", "", cuerpo, "</x-dc>", "", tag, "</body>", "</html>", ""])


# Las versiones anteriores de Mi cuenta van al Archivo, con sus recorridos completos.
for viejo, nuevo in (("Cuenta.dc.html", "Cuenta-Anterior.dc.html"), ("M-Cuenta.dc.html", "M-Cuenta-Anterior.dc.html")):
    if not (PROJ / nuevo).exists():
        shutil.copyfile(PROJ / viejo, PROJ / nuevo)

for clave, (titulo, w, h, interactivo, cuerpo) in TABLEROS.items():
    script = SCRIPT_CUENTA if clave == "Cuenta" else SCRIPT_SIMPLE
    (PROJ / f"{clave}.dc.html").write_text(archivo(titulo, w, h, cuerpo, script), encoding="utf-8")

ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
B = c["boards"]
web = ["Inicio-Personal", "Cuenta", "Cuenta-Agregar", "Cuenta-Verificar", "Cuenta-Baja"]
for n, clave in enumerate(web):
    titulo, w, h, inter, _ = TABLEROS[clave]
    B[f"{clave}.dc.html"] = {"x": n * 1520, "y": 260, "w": w, "h": h, "title": titulo + MARCA, "page": PAGINA, "is_interactive": inter}
for n, clave in enumerate(["M-Inicio-Personal", "M-Cuenta"]):
    titulo, w, h, inter, _ = TABLEROS[clave]
    B[f"{clave}.dc.html"] = {"x": n * 470, "y": 260 + 900 + 120, "w": w, "h": h, "title": titulo + MARCA, "page": PAGINA}
c["notes"]["personal-nota"].update({"x": len(web) * 1520, "y": 260, "page": PAGINA})
c["notes"]["t-personal"]["maxW"] = min(len(web) * 1520 + 440, 8000)
# Archivo: las versiones anteriores, a la derecha de lo que ya hay.
x_arch = max(b["x"] + b["w"] for b in B.values() if b.get("page") == "archivo")
x_arch = max(x_arch, max(n["x"] + n.get("w", 440) for n in c["notes"].values() if n.get("page") == "archivo")) + 80
B["Cuenta-Anterior.dc.html"] = {"x": x_arch, "y": 260, "w": 1440, "h": 900, "title": "Mi cuenta (antes del criterio)", "page": "archivo", "is_interactive": True}
B["M-Cuenta-Anterior.dc.html"] = {"x": x_arch + 1520, "y": 260, "w": 390, "h": 844, "title": "Mi cuenta · teléfono (antes del criterio)", "page": "archivo", "is_interactive": True}
for clave in web + ["Cuenta-Anterior", "M-Cuenta-Anterior"]:
    if f"{clave}.dc.html" not in c["order"]:
        c["order"].append(f"{clave}.dc.html")
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(TABLEROS))
