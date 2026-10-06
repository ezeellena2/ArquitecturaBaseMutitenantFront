"""Las pantallas dicen si un correo tiene cuenta (ADR 0043 del back, que reemplaza la 0041; arreglos A1 y A2, 2026-10-06):
- Ingreso y M-Ingreso, «Correo sin cuenta»: el error debajo del campo, «No hay una cuenta con ese correo.», y debajo el enlace para
  crearla con el correo ya escrito: «Crear mi cuenta» como persona y «Registrá tu empresa» como empresa (Tweak «puerta»). No sale el
  código.
- Ingreso y M-Ingreso, «Operador: la cuenta entra por Plataforma»: la pantalla privada del operador, como «Sin empresa», con el texto
  del back, «Ir a Plataforma» y «Salir». Solo después del código o con su sesión ya abierta.
- Registro y M-Registro, «Correo con cuenta»: «Ya tenés una cuenta con ese correo.» y el enlace «Ingresar».
- Recuperar y M-Recuperar: «No hay una cuenta con ese correo.» en el paso 1 y «Ese correo ya es de otra cuenta.» en el paso 2.
- Cuenta-Agregar y M-Cuenta-Agregar, «Correo: ya es de otra cuenta»: «Ese correo ya está asociado a otra cuenta.».
Un dato del campo va debajo del campo (`formularios.md`); el enlace, debajo del error, como la acción que resuelve el caso.
Lleva `data-vuelta="1004-cuenta-existe"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import clonar, rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-cuenta-existe"'
ERR = '<sc-if value="{{errCampo}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{errCampo}}</span></sc-if>'
ENLACE = '<sc-if value="{{conEnlace}}" hint-placeholder-val="{{no}}"><a class="lnk err-acc" href="{{hrefEnlace}}">{{textoEnlace}}</a></sc-if>'
CSS = ".err-acc { align-self: flex-start; font-size: 14px; font-weight: 600; }\n"
textos = {}


def tocar(nombre):
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    return None if MARCA in t else t


def en_render(t, lineas):
    i = t.index("  renderVals() {")
    j = t.index("\n    return {\n", i) + len("\n    return {\n")
    return t[:j] + lineas + t[j:]


def con_enlace(t):
    """El enlace debajo del error del correo (el primer campo con `errCampo`, el del correo)."""
    k = t.index(ERR)
    return t[:k + len(ERR)] + ENLACE + t[k + len(ERR):]


for nombre in ["Ingreso", "M-Ingreso"]:
    t = tocar(nombre)
    if not t:
        continue
    m_ = "M-" if nombre.startswith("M-") else ""
    t = rep(t, "errCampo: e.errCampo ?? '', msj: e.msj ?? null,", "errCampo: e.errCampo ?? '', errAccion: e.errAccion ?? '', msj: e.msj ?? null,")
    t = rep(t, "  'Correo inválido': { correo: 'lucia.fernandez@', errCampo: 'Ingresá un correo electrónico válido.' },\n",
            "  'Correo inválido': { correo: 'lucia.fernandez@', errCampo: 'Ingresá un correo electrónico válido.' },\n"
            "  // ADR 0043: sin cuenta no se manda código; el enlace lleva al registro con el correo ya escrito.\n"
            "  'Correo sin cuenta': { correo: 'mariana.lopez@gmail.com', errCampo: 'No hay una cuenta con ese correo.', errAccion: 'crear' },\n")
    t = rep(t, "  'Empresa: acceso deshabilitado':",
            "  // A1: Tenancy.Access.PlatformOnly, después del código o con la sesión del operador abierta. Antes del código nada lo menciona.\n"
            "  'Operador: la cuenta entra por Plataforma': { cuenta: 'Martín (operador de la plataforma)', paso: 'operador' },\n"
            "  'Empresa: acceso deshabilitado':")
    t = sumar_opcion(t, "Correo inválido", "Correo sin cuenta")
    t = sumar_opcion(t, "Operador: guardar los códigos", "Operador: la cuenta entra por Plataforma")
    t = en_render(t, "      conEnlace: s.errAccion === 'crear' && !!s.errCampo && s.paso === 'correo',\n"
                     "      textoEnlace: s.puerta === 'Empresa' ? 'Registrá tu empresa' : 'Crear mi cuenta',\n"
                     f"      hrefEnlace: s.puerta === 'Empresa' ? '{m_}Registro-Empresa.dc.html' : '{m_}Registro.dc.html',\n"
                     "      enOperador: s.paso === 'operador',\n")
    t = con_enlace(t)
    m = re.search(r'<sc-if value="\{\{enSinEmpresa\}\}" hint-placeholder-val="\{\{no\}\}">.*?</sc-if>', t, re.S)
    bloque = m.group(0)
    nuevo = bloque.replace("{{enSinEmpresa}}", "{{enOperador}}")
    nuevo = re.sub(r"<h1>Tu cuenta no está en ninguna empresa todavía</h1>", "<h1>Esta cuenta es de un operador: solo entra a Plataforma</h1>", nuevo)
    nuevo = rep(nuevo, f'<a class="b b-pri lg" href="{m_}Registro-Empresa.dc.html">Registrá tu empresa</a>', f'<a class="b b-pri lg" href="{m_}Organizaciones.dc.html">Ir a Plataforma</a>')
    nuevo = rep(nuevo, f'<a class="b b-sec lg" href="{m_}Inicio-Personal.dc.html">Ingresá como persona</a>', f'<a class="b b-sec lg" href="{m_}Ingreso.dc.html">Salir</a>')
    t = t[:m.end()] + nuevo + t[m.end():]
    textos[nombre] = t

for nombre in ["Registro", "M-Registro"]:
    t = tocar(nombre)
    if not t:
        continue
    t = rep(t, "  // 403 Auth.Signup.Closed",
            "  // ADR 0043: el correo ya tiene cuenta (también el de un operador); el enlace lleva al ingreso con el correo ya escrito.\n"
            "  'Correo con cuenta': { acepta: true, correo: 'lucia.fernandez@delta.ejemplo.com', errCampo: 'Ya tenés una cuenta con ese correo.', errAccion: 'ingresar' },\n"
            "  // 403 Auth.Signup.Closed")
    t = sumar_opcion(t, "Correo inválido", "Correo con cuenta")
    t = rep(t, "errCampo: e.errCampo ?? '', cod:", "errCampo: e.errCampo ?? '', errAccion: e.errAccion ?? '', cod:")
    t = en_render(t, "      conEnlace: s.errAccion === 'ingresar' && !!s.errCampo,\n      textoEnlace: 'Ingresar',\n"
                     f"      hrefEnlace: '{'M-Ingreso' if nombre.startswith('M-') else 'Ingreso'}.dc.html',\n")
    t = con_enlace(t)
    textos[nombre] = t

for nombre in ["Recuperar", "M-Recuperar"]:
    t = tocar(nombre)
    if not t:
        continue
    t = rep(t, "  '1. El correo o teléfono de antes': { paso: 'cuenta', viejo: '' },\n",
            "  '1. El correo o teléfono de antes': { paso: 'cuenta', viejo: '' },\n"
            "  '1. Sin cuenta con ese correo': { paso: 'cuenta', viejo: 'mariana.lopez@gmail.com', errViejo: 'No hay una cuenta con ese correo.' },\n")
    t = rep(t, "  '2. Un correo o WhatsApp nuevo': { paso: 'nuevo', viejo: 'lucia.fernandez@delta.ejemplo.com', nuevo: '' },\n",
            "  '2. Un correo o WhatsApp nuevo': { paso: 'nuevo', viejo: 'lucia.fernandez@delta.ejemplo.com', nuevo: '' },\n"
            "  '2. El correo nuevo ya es de otra cuenta': { paso: 'nuevo', viejo: 'lucia.fernandez@delta.ejemplo.com', nuevo: 'beto.ramirez@beta.ejemplo.com', errNuevo: 'Ese correo ya es de otra cuenta.' },\n")
    t, n = re.subn(r"// Si el correo o el WhatsApp nuevo ya es de otra cuenta[^\n]*\n", "// ADR 0043: si el correo nuevo ya es de otra cuenta, lo dice y no manda código.\n", t)
    assert n == 1, nombre
    t = sumar_opcion(t, "1. El correo o teléfono de antes", "1. Sin cuenta con ese correo", prop="paso")
    t = sumar_opcion(t, "2. Un correo o WhatsApp nuevo", "2. El correo nuevo ya es de otra cuenta", prop="paso")
    textos[nombre] = t

for nombre, valor in [("Cuenta-Agregar", "lucia.trabajo@gmail "), ("M-Cuenta-Agregar", "lucia.trabajo@gmail")]:
    t = tocar(nombre)
    if not t:
        continue
    t = clonar(t, "eInv", "eOtra", "Correo: ya es de otra cuenta", [
        (valor, "beto.ramirez@beta.ejemplo.com"),
        ("Ingresá un correo electrónico válido.", "Ese correo ya está asociado a otra cuenta."),
    ])
    textos[nombre] = t

for nombre, t in textos.items():
    assert t.count("</helmet>") == 1, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t.replace("</helmet>", f"<style {MARCA}>\n{CSS}</style>\n</helmet>"), encoding="utf-8")
print("tableros", len(textos))
