"""v115 (2026-10-08): el lienzo al día con las ADR 0043, 0045 y 0049 antes de programar las etapas 8 y 8b
(`docs/design/alineamiento-etapas-8-y-8b.md`).
- 0043 en los teléfonos: Ingreso y M-Ingreso «WhatsApp: número sin cuenta» (error debajo del campo y «Crear mi cuenta» o
  «Registrá tu empresa»); Registro y M-Registro «WhatsApp: número con cuenta» («Ingresar»); Recuperar y M-Recuperar con el número
  sin cuenta y el WhatsApp nuevo que ya es de otra cuenta; Cuenta-Agregar y M-Cuenta-Agregar «WhatsApp: ya es de otra cuenta».
- 0045: Mi cuenta no pide códigos. Cuenta-Metodo y M-Cuenta-Metodo sin el código al quitar o hacer principal («Quitar un correo»
  reemplaza al estado del código por WhatsApp); Cuenta-Baja y M-Cuenta-Baja sin el código ni «Código incorrecto».
- 0049 en Mensajes: el bot a un número sin cuenta (registro personal en la web) y con el registro cerrado, la respuesta neutra al
  operador, y los avisos de la organización por correo y WhatsApp (aprobada, rechazada, página despublicada y permitido volver a
  publicar). Salen los ejemplos que derogó la 0043 (método o recuperación con un número que ya es de una cuenta).
- Módulos: vuelve «Módulo B» (la prueba) junto al Asistente; el Asistente se suma, no reemplaza.
Lleva `data-vuelta="1004-v115"`; si ya la tiene, no se toca."""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import clonar, rango_bloque, rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-v115"'
ERR = '<sc-if value="{{errCampo}}" hint-placeholder-val="{{no}}"><span class="err2" role="alert">{{errCampo}}</span></sc-if>'
ENLACE = '<sc-if value="{{conEnlace}}" hint-placeholder-val="{{no}}"><a class="lnk err-acc" href="{{hrefEnlace}}">{{textoEnlace}}</a></sc-if>'
textos = {}


def tocar(nombre):
    t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
    return None if MARCA in t else t


def enlace_bajo_telefono(t):
    """El enlace del error va también debajo del campo de WhatsApp: el segundo error del campo (el primero es el del correo)."""
    s = t.index('<script type="text/x-dc"')
    assert t[:s].count(ERR) == 2
    k = t.rindex(ERR, 0, s) + len(ERR)
    assert not t[k:].startswith(ENLACE)
    return t[:k] + ENLACE + t[k:]


# ---- Ingreso: número sin cuenta (0043 en los teléfonos).
for nombre in ["Ingreso", "M-Ingreso"]:
    t = tocar(nombre)
    if not t:
        continue
    t = rep(t, "  'WhatsApp': { medio: 'whatsapp' },\n",
            "  'WhatsApp': { medio: 'whatsapp' },\n"
            "  // ADR 0043 y 0049: el número sin cuenta lo dice debajo del campo, no manda código y ofrece crearla.\n"
            "  'WhatsApp: número sin cuenta': { medio: 'whatsapp', tel: '11 5555-0199', errCampo: 'No hay una cuenta con ese número.', errAccion: 'crear' },\n")
    t = sumar_opcion(t, "WhatsApp", "WhatsApp: número sin cuenta")
    t = rep(t, "tel: e.medio === 'whatsapp' && e.paso ? c.tel : '',", "tel: e.tel ?? (e.medio === 'whatsapp' && e.paso ? c.tel : ''),")
    t = enlace_bajo_telefono(t)
    textos[nombre] = t

# ---- Registro: número con cuenta.
for nombre in ["Registro", "M-Registro"]:
    t = tocar(nombre)
    if not t:
        continue
    t = rep(t, "  'WhatsApp': { medio: 'whatsapp' },\n",
            "  'WhatsApp': { medio: 'whatsapp' },\n"
            "  // ADR 0043: el número ya tiene cuenta; el enlace lleva al ingreso.\n"
            "  'WhatsApp: número con cuenta': { medio: 'whatsapp', acepta: true, tel: '11 5555-4521', errCampo: 'Ya tenés una cuenta con ese número.', errAccion: 'ingresar' },\n")
    t = sumar_opcion(t, "WhatsApp", "WhatsApp: número con cuenta")
    t = rep(t, "correo: e.correo ?? '', tel: '',", "correo: e.correo ?? '', tel: e.tel ?? '',")
    t = enlace_bajo_telefono(t)
    textos[nombre] = t

# ---- Recuperar: el número de antes sin cuenta y el WhatsApp nuevo de otra cuenta.
for nombre in ["Recuperar", "M-Recuperar"]:
    t = tocar(nombre)
    if not t:
        continue
    t = rep(t, "  '1. Sin cuenta con ese correo': { paso: 'cuenta', viejo: 'mariana.lopez@gmail.com', errViejo: 'No hay una cuenta con ese correo.' },\n",
            "  '1. Sin cuenta con ese correo': { paso: 'cuenta', viejo: 'mariana.lopez@gmail.com', errViejo: 'No hay una cuenta con ese correo.' },\n"
            "  '1. Sin cuenta con ese número': { paso: 'cuenta', wa: true, viejoTipo: 'tel', viejo: '11 5555-0199', errViejo: 'No hay una cuenta con ese número.' },\n")
    t = rep(t, "  '2. El correo nuevo ya es de otra cuenta':",
            "  '2. El WhatsApp nuevo ya es de otra cuenta': { paso: 'nuevo', wa: true, viejo: 'lucia.fernandez@delta.ejemplo.com', nuevoTipo: 'tel', nuevo: '351 555-0142', errNuevo: 'Ese número ya es de otra cuenta.' },\n"
            "  '2. El correo nuevo ya es de otra cuenta':")
    t = sumar_opcion(t, "1. Sin cuenta con ese correo", "1. Sin cuenta con ese número", prop="paso")
    t = sumar_opcion(t, "2. El correo nuevo ya es de otra cuenta", "2. El WhatsApp nuevo ya es de otra cuenta", prop="paso")
    # Los estados con número muestran el WhatsApp aunque el Tweak diga «Sin WhatsApp».
    s = t.index('<script type="text/x-dc"')
    t = t[:s] + t[s:].replace("this.props.whatsapp === 'Con WhatsApp'", "(this.props.whatsapp === 'Con WhatsApp' || !!this.state.wa)")
    textos[nombre] = t

# ---- Mi cuenta: agregar un WhatsApp que ya es de otra cuenta.
for nombre, viejo, nuevo in [
    ("Cuenta-Agregar", '<div class="ct">11 5555-4521</div></div></div>',
     '<div class="ct mal">351 555-0142</div></div><span class="err2" role="alert">Ese número ya está asociado a otra cuenta.</span></div>'),
    ("M-Cuenta-Agregar", '<div class="ct">11 5555-4521</div></div></div>',
     '<div class="ct mal">351 555-0142</div></div></div><p class="ap-err" role="alert">Ese número ya está asociado a otra cuenta.</p>'),
]:
    t = tocar(nombre)
    if not t:
        continue
    t = clonar(t, "e1", "eTelOtra", "WhatsApp: ya es de otra cuenta", [(viejo, nuevo)])
    textos[nombre] = t

# ---- Mi cuenta sin códigos (0045).
SIN_CODIGO = [
    (r' ?Para confirmar, escribí el código que te mandamos a (?:<b>[^<]*</b>|[^<])*?\.(?=</(?:div|p)>)', ""),
    (r'<div class="tx"></div>|<p class="ap-txt-l"></p>', ""),
    (r'<div class="db"><div class="p-otp[^"]*"[^>]*>(?:<span[^>]*>[^<]*</span>)*</div>(?:<span class="o-nota">[^<]*</span>)?</div>', ""),
    (r'<div class="ap-cod6[^"]*">(?:<span[^>]*>[^<]*</span>)*</div>(?:<p class="ap-nwa">[^<]*</p>)?', ""),
]
for nombre in ["Cuenta-Metodo", "M-Cuenta-Metodo"]:
    t = tocar(nombre)
    if not t:
        continue
    s = t.index('<script type="text/x-dc"')
    mk = t[:s]
    for a, b in SIN_CODIGO:
        mk, n = re.subn(a, b, mk)
    assert "Para confirmar" not in mk and "p-otp" not in mk.split("</helmet>", 1)[1] and "ap-cod6\"" not in mk, nombre
    t = mk + t[s:]
    t = t.replace("Quitar un correo: el código llega por WhatsApp", "Quitar un correo")
    textos[nombre] = t

for nombre in ["Cuenta-Baja", "M-Cuenta-Baja"]:
    t = tocar(nombre)
    if not t:
        continue
    i, j = rango_bloque(t, "eCod")
    t = t[:i] + t[j:]
    t = rep(t, '      eCod: e === "Código incorrecto",\n', "")
    t = t.replace('"Código incorrecto",', "").replace(',"Código incorrecto"', "")
    s = t.index('<script type="text/x-dc"')
    mk = t[:s]
    mk, n1 = re.subn(r'<div class="w-cmp"><span class="rt">Código que te mandamos a [^<]*</span><div class="p-otp[^"]*"[^>]*>(?:<span[^>]*>[^<]*</span>)*</div>(?:<span class="err2"[^>]*>[^<]*</span>)?</div>', "", mk)
    mk, n2 = re.subn(r'<div class="ap-cmp"><span class="rt"><span>Código que te mandamos a [^<]*</span></span><div class="ap-cod6[^"]*">(?:<span[^>]*>[^<]*</span>)*</div></div>', "", mk)
    assert "Código que te mandamos" not in mk, (nombre, n1, n2)
    t = mk + t[s:]
    textos[nombre] = t


# ---- Mensajes (0049).
def wa_libre(texto, botones=(), pie=""):
    b = ", ".join(f"{{ t: '{x}', url: true }}" for x in botones)
    p = f", pie: '{pie}'" if pie else ""
    return f"wa: {{ mio: 'Hola', texto: [N('{texto}')]{p}, botones: [{b}] }}"


def entrada(n, comentarios, cuerpo):
    c = "".join(f"    // {x}\n" for x in comentarios)
    return f"  {{\n    n: '{n}',\n{c}{cuerpo}\n  }},\n"


def correo(asunto, para, titulo, parrafos):
    p = ", ".join(f"P('{x}')" for x in parrafos)
    return f"    correo: {{\n      asunto: '{asunto}',\n      para: '{para}',\n      titulo: '{titulo}',\n      parrafos: [{p}],\n    }},"


def quitar_entrada(t, n):
    i = t.index(f"  {{\n    n: '{n}',")
    j = t.index("\n  },\n", i) + len("\n  },\n")
    return t[:i] + t[j:]


t = tocar("Mensajes")
if t:
    for n in ["Método de ingreso: ya es de una cuenta", "Recuperación: ya tiene una cuenta"]:
        t = quitar_entrada(t, n)
        t = t.replace(f'"{n}",', "")
    bot = (
        entrada("Bot: número sin cuenta", ["ADR 0049: ofrece el registro personal por WhatsApp en la web, sin el número en el enlace. No crea la cuenta ni acepta términos desde el chat.",
                                           "Mensaje libre dentro de la ventana de 24 horas: no hace falta plantilla."],
                "    " + wa_libre("Hola. Este número no tiene una cuenta de ArquitecturaBase. Para crear la tuya, tocá Crear mi cuenta: vas a aceptar los términos y confirmar el número con un código.",
                             ["Crear mi cuenta"], "Por ahora este chat solo sirve para entrar.") + ",")
        + entrada("Bot: número sin cuenta y registro cerrado", ["ADR 0049: con el registro de personas cerrado, ofrece ingresar o recuperar la cuenta."],
                  "    " + wa_libre("Hola. Este número no tiene una cuenta de ArquitecturaBase y por ahora no se pueden crear cuentas nuevas. Si tenés una cuenta con otro correo o número, ingresá con ese método o recuperá tu cuenta.",
                               ["Ingresar", "Recuperar mi cuenta"], "Por ahora este chat solo sirve para entrar.") + ",")
        + entrada("Bot: cuenta de operador", ["ADR 0049: nunca un enlace para un operador; sin botones y sin mencionar Plataforma ni al operador. Entra por /plataforma con su código."],
                  "    " + wa_libre("Para entrar, usá la web.") + ",")
    )
    i = t.index("  {\n    n: 'Enlace para entrar (bot)',")
    j = t.index("\n  },\n", i) + len("\n  },\n")
    t = t[:j] + bot + t[j:]
    PLANT = "texto: [N('{0}')], botones: [] }},"
    org = (
        entrada("Organización aprobada", ["Plantilla `organizacion_aprobada` (ADR 0049): el mismo contenido que el correo, sin botones nuevos."],
                correo("Aprobamos Gamma S.A.", "julio@gamma.ejemplo.com", "Aprobamos Gamma S.A.",
                       ["Hola, Julio. Aprobamos Gamma S.A. y terminamos el alta. Ya podés entrar como Dueño de tu organización.",
                        "Ingresá con los métodos de tu cuenta y elegí tu organización."])
                + "\n    wa: { plantilla: 'organizacion_aprobada', " + PLANT.format("Aprobamos Gamma S.A. y terminamos el alta. Ya podés entrar como Dueño de tu organización. Ingresá con los métodos de tu cuenta y elegí tu organización."))
        + entrada("Organización rechazada", ["Plantilla `organizacion_rechazada` (ADR 0049)."],
                  correo("No aprobamos el alta de Gamma S.A.", "julio@gamma.ejemplo.com", "No aprobamos el alta de Gamma S.A.",
                         ["Hola, Julio. No aprobamos la solicitud de alta de Gamma S.A.", "Tu cuenta y tu espacio personal siguen funcionando."])
                  + "\n    wa: { plantilla: 'organizacion_rechazada', " + PLANT.format("No aprobamos la solicitud de alta de Gamma S.A. Tu cuenta y tu espacio personal siguen funcionando."))
        + entrada("Página pública: la despublicó la plataforma", ["Plantilla `pagina_publica_moderada` (ADR 0049), con la página bloqueada."],
                  correo("La plataforma despublicó la página de Grupo Delta", "lucia.fernandez@delta.ejemplo.com", "La plataforma despublicó tu página pública",
                         ["Hola, Lucía. La plataforma despublicó la página pública de Grupo Delta. Quedó en borrador y no se puede publicar hasta que la plataforma lo permita.",
                          "Tu organización y sus accesos siguen funcionando."])
                  + "\n    wa: { plantilla: 'pagina_publica_moderada', " + PLANT.format("La página pública de Grupo Delta: la plataforma la despublicó; quedó en borrador y no se puede publicar hasta que la plataforma lo permita. Tu organización y sus accesos siguen funcionando."))
        + entrada("Página pública: se puede volver a publicar", ["Plantilla `pagina_publica_moderada` (ADR 0049), con la página permitida. No la vuelve a publicar sola."],
                  correo("Ya podés volver a publicar la página de Grupo Delta", "lucia.fernandez@delta.ejemplo.com", "Ya podés volver a publicar tu página",
                         ["Hola, Lucía. La plataforma permitió volver a publicar la página pública de Grupo Delta. Podés revisarla y publicarla desde tu organización.",
                          "Tu organización y sus accesos siguen funcionando."])
                  + "\n    wa: { plantilla: 'pagina_publica_moderada', " + PLANT.format("La página pública de Grupo Delta: la plataforma permitió volver a publicarla; podés revisarla y publicarla desde tu organización. Tu organización y sus accesos siguen funcionando."))
    )
    i = t.index("  {\n    n: 'Asistente: 80 % del tope (su clave)',")
    t = t[:i] + org + t[i:]
    anterior = "Enlace para entrar (bot)"
    for e in ["Bot: número sin cuenta", "Bot: número sin cuenta y registro cerrado", "Bot: cuenta de operador"]:
        t = sumar_opcion(t, anterior, e, prop="mensaje")
        anterior = e
    anterior = "Recuperación: rechazada"
    for e in ["Organización aprobada", "Organización rechazada", "Página pública: la despublicó la plataforma", "Página pública: se puede volver a publicar"]:
        t = sumar_opcion(t, anterior, e, prop="mensaje")
        anterior = e
    assert "metodo_ingreso_en_uso" not in t and "recuperacion_metodo_en_uso" not in t
    textos["Mensajes"] = t

# ---- Módulos: el Asistente se suma; vuelve la fila de prueba.
t = tocar("Organizacion")
if t:
    t = rep(t, "  { id: 'b', n: 'Asistente', estado: 'prendido', origen: 'Manual', hasta: '', clave: false },\n",
            "  { id: 'b', n: 'Asistente', estado: 'prendido', origen: 'Manual', hasta: '', clave: false },\n"
            "  { id: 'c', n: 'Módulo B', estado: 'prueba', origen: 'Prueba', hasta: '27/10/2026' },\n")
    textos["Organizacion"] = t
t = tocar("M-Organizacion")
if t:
    fila_b = ('<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">Módulo B</span><span class="w-est pend">Prueba hasta 27/10/2026</span></span>'
              '<span class="l2">Prueba</span></div><button type="button" class="ap-ib" aria-label="Acciones de Módulo B">')
    k = t.index('aria-label="Acciones de Asistente">')
    fin = t.index("</button></div>", k) + len("</button></div>")
    kebab = t[k + len('aria-label="Acciones de Asistente">'):t.index("</button>", k)]
    t = t[:fin] + fila_b + kebab + "</button></div>" + t[fin:]
    t = t.replace('Módulos <span class="c">2</span>', 'Módulos <span class="c">3</span>')
    textos["M-Organizacion"] = t

for nombre, t in textos.items():
    assert t.count("</helmet>") == 1, nombre
    (PROJ / f"{nombre}.dc.html").write_text(t.replace("</helmet>", f"<style {MARCA}>\n.err-acc {{ align-self: flex-start; font-size: 14px; font-weight: 600; }}\n</style>\n</helmet>"), encoding="utf-8")
print("tableros", list(textos))
