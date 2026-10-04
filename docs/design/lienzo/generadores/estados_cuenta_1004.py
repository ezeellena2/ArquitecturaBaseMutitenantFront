"""Mi cuenta: los estados del flujo que la app tiene y el lienzo no dibujaba (relevamiento E1-E6, «No relevado»; tanda aprobada por
el usuario el 2026-10-04). Cada estado se clona de uno que ya existe (`estados_util.clonar`) y copia lo que hace la app; los textos
salen de `account.json` y de Errors.resx.
- Cuenta-Agregar y M-: «Correo: correo inválido» («Ingresá un correo electrónico válido.»). No se dibuja «ese correo ya lo usa otra
  cuenta»: la ADR 0041 no revela si un correo tiene cuenta, así que el flujo sigue a «Verificar» igual.
- Cuenta-Verificar y M-: «Correo: código incorrecto» («El código no es válido.»), como el del WhatsApp.
- Cuenta-Metodo y M-: «Vincular Google» (el código de confirmación antes de ir a Google) y «Desvincular Google» (confirmación con
  código y botón rojo; detrás, Google ya vinculado).
- Cuenta-Baja y M-: pasan a tener estados: «Dar de baja», «Falta el motivo» («Escribí el motivo.») y «Código incorrecto».
- Sesion y M-Sesion: «Cerramos tu sesión por la baja», con «Tu cuenta se elimina el 27/10/2026.» e «Ir al inicio».
- Cuenta: Tweak «aviso» con lo que la app avisa después de cada acción, y la lista como queda: «Agregamos lu…», «Quitamos…»,
  «Desde ahora te avisamos a…», «Vinculamos tu cuenta de Google.» y «Desvinculamos tu cuenta de Google.».
- M-Cuenta: el Tweak pasa a llamarse «estado» y suma «Cambios sin guardar» (subtítulo ámbar y «Guardar cambios» activo) y los mismos
  avisos, en la franja oscura de abajo del teléfono.
Lleva `data-vuelta="1004-estados-cuenta"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import clonar, marcar, ordenar_opciones, rango_bloque, rep  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-estados-cuenta"'
OTP_PC = '<div class="p-otp" role="group" aria-label="Código"><span>4</span><span>8</span><span class="foco"></span><span></span><span></span><span></span></div>'
OTP_PC_MAL = '<div class="p-otp mal" role="group" aria-label="Código"><span>4</span><span>8</span><span>2</span><span>9</span><span>1</span><span>0</span></div>'
OTP_TEL = '<div class="ap-cod6"><span>4</span><span>8</span><span class="on"></span><span></span><span></span><span></span></div>'
OTP_TEL_MAL = '<div class="ap-cod6 mal"><span>4</span><span>8</span><span>2</span><span>9</span><span>1</span><span>0</span></div>'
CSS_PC = ".w-cmp .ct.mal { border-color: var(--peligro); }\n.p-otp.mal span { border-color: var(--peligro); }\n"
CSS_TEL = (".ap-cmp .ct.mal { border-color: var(--peligro); box-shadow: 0 0 0 3px oklch(0.57 0.2 25 / 0.12); }\n"
           ".ap-cod6.mal span { border-color: var(--peligro); }\n.ap-err { font-size: 13.5px; color: var(--peligro); margin: -2px 0 0; }\n")
OK = ('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
      'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg>')
SALIR = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l4-4-4-4"/><path d="M14 12H4"/></svg>')
AVISOS = {
    "Agregamos un correo": "Agregamos lucia.trabajo@gmail.com. Ya podés entrar con ese correo.",
    "Quitamos un correo": "Quitamos lucia.fernandez@delta.ejemplo.com.",
    "Cambió el principal": "Desde ahora te avisamos a lucia.fernandez@delta.ejemplo.com.",
    "Vinculamos Google": "Vinculamos tu cuenta de Google.",
    "Desvinculamos Google": "Desvinculamos tu cuenta de Google.",
}


def leer(nombre):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    return ruta, (None if MARCA in t else t)


def fin_div(t, i):
    """Índice donde cierra el <div> que abre en `i`."""
    prof = 0
    for m in re.finditer(r"<div\b|</div>", t[i:]):
        prof += 1 if m.group(0).startswith("<div") else -1
        if prof == 0:
            return i + m.end()
    raise AssertionError("div sin cerrar")


def con_estados(t, inicio, fin_marca, nombre, ancho, alto):
    """Envuelve el diálogo en `e0` y le suma el Tweak «estado» al tablero, que no tenía estados."""
    cab, cuerpo = t.split("</helmet>", 1)
    i = cuerpo.index(inicio)
    j = fin_div(cuerpo, cuerpo.index(fin_marca, i))
    cuerpo = cuerpo[:i] + '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">' + cuerpo[i:j] + "</sc-if>" + cuerpo[j:]
    t = cab + "</helmet>" + cuerpo
    props = json.dumps({"estado": {"editor": "enum", "options": [nombre], "default": nombre, "section": "Estado"},
                        "$preview": {"width": ancho, "height": alto}}, ensure_ascii=False, separators=(",", ":"))
    t = rep(t, "data-props='{\"$preview\":{\"width\":%d,\"height\":%d}}'" % (ancho, alto), f"data-props='{props}'")
    return rep(t, "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}",
               "class Component extends DCLogic {\n  renderVals() {\n"
               f"    const e = this.props.estado ?? {json.dumps(nombre, ensure_ascii=False)};\n\n"
               f"    return {{\n      si: true,\n      no: false,\n      e0: e === {json.dumps(nombre, ensure_ascii=False)},\n    }};\n  }}\n}}")


def kebab(t):
    return re.search(r'<button type="button" class="(?:ib|ap-ib)" aria-label="Acciones de [^"]+">(<svg.*?</svg>)</button>', t, re.S).group(1)


# 1. Agregar: correo inválido.
ruta, t = leer("Cuenta-Agregar")
if t:
    t = clonar(t, "e0", "eInv", "Correo: correo inválido",
               [('<div class="ct">lucia.trabajo@gmail.com </div>', '<div class="ct mal">lucia.trabajo@gmail </div><span class="err2" role="alert">Ingresá un correo electrónico válido.</span>')])
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok Cuenta-Agregar")
ruta, t = leer("M-Cuenta-Agregar")
if t:
    t = clonar(t, "e0", "eInv", "Correo: correo inválido",
               [('<div class="ct">lucia.trabajo@gmail.com</div></div>', '<div class="ct mal">lucia.trabajo@gmail</div></div><p class="ap-err" role="alert">Ingresá un correo electrónico válido.</p>')])
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok M-Cuenta-Agregar")

# 2. Verificar el correo: código incorrecto.
ruta, t = leer("Cuenta-Verificar")
if t:
    t = clonar(t, "e0", "eCod", "Correo: código incorrecto", [(OTP_PC, OTP_PC_MAL + '<span class="err2" role="alert">El código no es válido.</span>')])
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok Cuenta-Verificar")
ruta, t = leer("M-Cuenta-Verificar")
if t:
    t = clonar(t, "e0", "eCod", "Correo: código incorrecto", [(OTP_TEL, OTP_TEL_MAL + '<p class="ap-err" role="alert">El código no es válido.</p>')])
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok M-Cuenta-Verificar")

# 3. Vincular y desvincular Google.
QUITAR_TX = "Ya no vas a poder entrar con 011 15-5555-4521. Para confirmar, escribí el código que te mandamos a lu•••@gmail.com."
REAUTH_TX = "Para confirmar, escribí el código que te mandamos a lu•••@gmail.com."
DESV_TX = "Ya no vas a poder entrar con lucia.fer@gmail.com. Para confirmar, escribí el código que te mandamos a lu•••@gmail.com."
ruta, t = leer("Cuenta-Metodo")
if t:
    k = kebab(t)
    t = clonar(t, "e1", "eVinG", "Vincular Google",
               [('aria-label="¿Quitar este WhatsApp?"', 'aria-label="Vincular Google"'), ("<span>¿Quitar este WhatsApp?</span>", "<span>Vincular Google</span>"),
                (QUITAR_TX, REAUTH_TX), ('<a class="cb cb-pel lleno" href="Cuenta.dc.html">Quitar</a>', '<a class="cb cb-pri" href="Cuenta.dc.html">Verificar</a>')])
    t = clonar(t, "eVinG", "eDesG", "Desvincular Google",
               [('aria-label="Vincular Google"', 'aria-label="¿Desvincular tu cuenta de Google?"'), ("<span>Vincular Google</span>", "<span>¿Desvincular tu cuenta de Google?</span>"),
                (REAUTH_TX, DESV_TX), ('<a class="cb cb-pri" href="Cuenta.dc.html">Verificar</a>', '<a class="cb cb-pel lleno" href="Cuenta.dc.html">Desvincular</a>')])
    m = re.search(r'<div class="w-it"><span class="p-ic">(<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4".*?</svg>)</span><span class="dato"><b>Google</b><span>Sin vincular</span></span><button type="button" class="cb cb-sec ch">Vincular</button></div>', t, re.S)
    assert m
    con = (f'<div class="w-it"><span class="p-ic">{m.group(1)}</span><span class="dato"><b>Google</b><span>lucia.fer@gmail.com</span></span>'
           f'<button type="button" class="ib" aria-label="Acciones de Google">{k}</button></div>')
    t = t[:m.start()] + '<sc-if value="{{googleSin}}" hint-placeholder-val="{{si}}">' + m.group(0) + "</sc-if>" + f'<sc-if value="{{{{googleCon}}}}" hint-placeholder-val="{{{{no}}}}">{con}</sc-if>' + t[m.end():]
    t = rep(t, '      eDesG: e === "Desvincular Google",\n', '      eDesG: e === "Desvincular Google",\n      googleCon: e === "Desvincular Google",\n      googleSin: e !== "Desvincular Google",\n')
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok Cuenta-Metodo")
ruta, t = leer("M-Cuenta-Metodo")
if t:
    k = kebab(t)
    peligro = '<button type="button" class="cb cb-pri" style="background: var(--peligro); border-color: var(--peligro);">'
    t = clonar(t, "e1", "eVinG", "Vincular Google",
               [('aria-label="¿Quitar este WhatsApp?"', 'aria-label="Vincular Google"'), ("<h2>¿Quitar este WhatsApp?</h2>", "<h2>Vincular Google</h2>"),
                (QUITAR_TX, REAUTH_TX), (peligro + "Quitar</button>", '<button type="button" class="cb cb-pri">Verificar</button>'),
                ('role="alertdialog" aria-label="Vincular Google"', 'role="dialog" aria-label="Vincular Google"')])
    sin = '<div class="ap-it "><span class="tx"><b>Google</b><span>Sin vincular</span></span><span class="acc-t">Vincular</span></div>'
    con = f'<div class="ap-it "><span class="tx"><b>Google</b><span>lucia.fer@gmail.com</span></span><button type="button" class="ap-ib" aria-label="Acciones de Google">{k}</button></div>'
    t = clonar(t, "e1", "eDesG", "Desvincular Google",
               [('aria-label="¿Quitar este WhatsApp?"', 'aria-label="¿Desvincular tu cuenta de Google?"'), ("<h2>¿Quitar este WhatsApp?</h2>", "<h2>¿Desvincular tu cuenta de Google?</h2>"),
                (QUITAR_TX, DESV_TX), (peligro + "Quitar</button>", peligro + "Desvincular</button>"), (sin, con)])
    t = ordenar_opciones(t, ["Menú del WhatsApp", "Quitar el WhatsApp", "Hacer principal el WhatsApp", "Quitar un correo: el código llega por WhatsApp",
                             "Vincular Google", "Desvincular Google"])
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok M-Cuenta-Metodo")

# 4. Dar de baja: falta el motivo y código incorrecto.
ruta, t = leer("Cuenta-Baja")
if t:
    t = con_estados(t, '<div class="w-oscuro"', '<div class="p-dlg', "Dar de baja", 1440, 900)
    t = clonar(t, "e0", "eMot", "Falta el motivo", [('<div class="ct area">Ya no la uso.</div>', '<div class="ct area mal"></div><span class="err2" role="alert">Escribí el motivo.</span>')])
    t = clonar(t, "eMot", "eCod", "Código incorrecto", [('<div class="ct area mal"></div><span class="err2" role="alert">Escribí el motivo.</span>', '<div class="ct area">Ya no la uso.</div>'),
                                                       (OTP_PC, OTP_PC_MAL + '<span class="err2" role="alert">El código no es válido.</span>')])
    ruta.write_text(marcar(t, MARCA, CSS_PC), encoding="utf-8"); print("ok Cuenta-Baja")
ruta, t = leer("M-Cuenta-Baja")
if t:
    t = con_estados(t, '<div class="ap-velo">', '<div class="ap-hoja"', "Dar de baja", 390, 844)
    t = clonar(t, "e0", "eMot", "Falta el motivo", [('<div class="ct">Ya no la uso.</div></div>', '<div class="ct mal"></div></div><p class="ap-err" role="alert">Escribí el motivo.</p>')])
    t = clonar(t, "e0", "eCod", "Código incorrecto", [(OTP_TEL + "</div>", OTP_TEL_MAL + '</div><p class="ap-err" role="alert">El código no es válido.</p>')])
    ruta.write_text(marcar(t, MARCA, CSS_TEL), encoding="utf-8"); print("ok M-Cuenta-Baja")

# 5. La sesión cerrada por la baja.
ruta, t = leer("Sesion")
if t:
    t = rep(t, '"No pudimos iniciar tu sesión"],"default"', '"No pudimos iniciar tu sesión","Cerramos tu sesión por la baja"],"default"')
    t = rep(t, "  'No pudimos iniciar tu sesión': ['No pudimos iniciar tu sesión', 'Volvé a ingresar. Si vuelve a pasar, probá en otra ventana.'],\n",
            "  'No pudimos iniciar tu sesión': ['No pudimos iniciar tu sesión', 'Volvé a ingresar. Si vuelve a pasar, probá en otra ventana.'],\n"
            "  // Después de pedir la baja (account.json, closedSession y deletionDate).\n"
            "  'Cerramos tu sesión por la baja': ['Cerramos tu sesión', 'Tu cuenta se elimina el 27/10/2026.'],\n")
    t = rep(t, "      cargando: est !== 'No pudimos iniciar tu sesión',",
            "      cargando: est !== 'No pudimos iniciar tu sesión' && est !== 'Cerramos tu sesión por la baja',\n      baja: est === 'Cerramos tu sesión por la baja',")
    t = rep(t, '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><span class="circulo mal">',
            f'<sc-if value="{{{{baja}}}}" hint-placeholder-val="{{{{no}}}}"><span class="circulo gris">{SALIR}</span></sc-if><sc-if value="{{{{error}}}}" hint-placeholder-val="{{{{no}}}}"><span class="circulo mal">')
    t = rep(t, '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><a class="b b-pri lg" href="Ingreso.dc.html" style="width: 280px;">Volver a ingresar</a></sc-if>',
            '<sc-if value="{{error}}" hint-placeholder-val="{{no}}"><a class="b b-pri lg" href="Ingreso.dc.html" style="width: 280px;">Volver a ingresar</a></sc-if>'
            '<sc-if value="{{baja}}" hint-placeholder-val="{{no}}"><a class="b b-sec lg" href="Landing.dc.html" style="width: 280px;">Ir al inicio</a></sc-if>')
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok Sesion")
ruta, t = leer("M-Sesion")
if t:
    i, j = rango_bloque(t, "e4")
    circ = re.search(r'<span class="f-circ mal">.*?</svg></span>', t[i:j], re.S).group(0)
    t = clonar(t, "e4", "e5", "Cerramos tu sesión por la baja",
               [(circ, f'<span class="f-circ">{SALIR}</span>'), ("<h1>No pudimos iniciar tu sesión</h1>", "<h1>Cerramos tu sesión</h1>"),
                ("<p>Volvé a ingresar. Si vuelve a pasar, probá en otra ventana.</p>", "<p>Tu cuenta se elimina el 27/10/2026.</p>"),
                ('<a class="cb cb-pri full" href="M-Ingreso.dc.html">Volver a ingresar</a>', '<a class="cb cb-sec full" href="Landing-Movil.dc.html">Ir al inicio</a>')])
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok M-Sesion")

# 6. Mi cuenta en la compu: los avisos de cada acción.
ruta, t = leer("Cuenta")
if t:
    k = kebab(t)
    opciones = ["Sin aviso"] + list(AVISOS)
    t = rep(t, '"baja":{"editor":"enum"', '"aviso":{"editor":"enum","options":' + json.dumps(opciones, ensure_ascii=False, separators=(",", ":"))
            + ',"default":"Sin aviso","section":"Estado"},"baja":{"editor":"enum"')
    cab, cuerpo = t.split("</helmet>", 1)
    m1 = re.search(r'<div class="w-it"><span class="p-ic">(<svg(?:(?!</svg>).)*</svg>)</span><span class="dato"><b>lucia\.fer@gmail\.com</b><span>Principal</span></span></div>', cuerpo, re.S)
    m2 = re.search(r'<div class="w-it"><span class="p-ic">(<svg(?:(?!</svg>).)*</svg>)</span><span class="dato"><b>lucia\.fernandez@delta\.ejemplo\.com</b><span>Administrado por Grupo Delta</span></span><button type="button" class="ib" aria-label="Acciones de lucia\.fernandez@delta\.ejemplo\.com">(<svg(?:(?!</svg>).)*</svg>)</button></div>', cuerpo, re.S)
    mg = re.search(r'<div class="w-it"><span class="p-ic">(<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4"(?:(?!</svg>).)*</svg>)</span><span class="dato"><b>Google</b><span>Sin vincular</span></span><button type="button" class="cb cb-sec ch">Vincular</button></div>', cuerpo, re.S)
    assert m1 and m2 and mg and m1.end() == m2.start()
    sobre = m1.group(1)
    personal_cambiado = (f'<div class="w-it"><span class="p-ic">{sobre}</span><span class="dato"><b>lucia.fer@gmail.com</b></span>'
                         f'<button type="button" class="ib" aria-label="Acciones de lucia.fer@gmail.com">{k}</button></div>')
    empresa_principal = m2.group(0).replace("<span>Administrado por Grupo Delta</span>", "<span>Principal · Administrado por Grupo Delta</span>")
    trabajo = (f'<div class="w-it"><span class="p-ic">{sobre}</span><span class="dato"><b>lucia.trabajo@gmail.com</b></span>'
               f'<button type="button" class="ib" aria-label="Acciones de lucia.trabajo@gmail.com">{k}</button></div>')
    google_con = (f'<div class="w-it"><span class="p-ic">{mg.group(1)}</span><span class="dato"><b>Google</b><span>lucia.fer@gmail.com</span></span>'
                  f'<button type="button" class="ib" aria-label="Acciones de Google">{k}</button></div>')
    filas = ('<sc-if value="{{principalPersonal}}" hint-placeholder-val="{{si}}">' + m1.group(0)
             + '<sc-if value="{{conTrabajo}}" hint-placeholder-val="{{no}}">' + trabajo + "</sc-if>"
             + '<sc-if value="{{conEmpresa}}" hint-placeholder-val="{{si}}">' + m2.group(0) + "</sc-if></sc-if>"
             + '<sc-if value="{{principalEmpresa}}" hint-placeholder-val="{{no}}">' + personal_cambiado + empresa_principal + "</sc-if>")
    cuerpo = cuerpo[:m1.start()] + filas + cuerpo[m2.end():]
    cuerpo = rep(cuerpo, mg.group(0), '<sc-if value="{{googleSin}}" hint-placeholder-val="{{si}}">' + mg.group(0) + "</sc-if>"
                 + '<sc-if value="{{googleCon}}" hint-placeholder-val="{{no}}">' + google_con + "</sc-if>")
    t = cab + "</helmet>" + cuerpo
    t = rep(t, "      aviso: s.aviso,", "      aviso: s.aviso || AVISOS[this.props.aviso] || '',\n"
            "      principalPersonal: this.props.aviso !== 'Cambió el principal',\n      principalEmpresa: this.props.aviso === 'Cambió el principal',\n"
            "      conTrabajo: this.props.aviso === 'Agregamos un correo',\n      conEmpresa: this.props.aviso !== 'Quitamos un correo',\n"
            "      googleCon: this.props.aviso === 'Vinculamos Google',\n      googleSin: this.props.aviso !== 'Vinculamos Google',")
    t = rep(t, "class Component extends DCLogic {", "// Lo que avisa la app después de cada acción (account.json).\nconst AVISOS = "
            + json.dumps(AVISOS, ensure_ascii=False, indent=2).replace('\n}', ',\n}') + ";\n\nclass Component extends DCLogic {")
    ruta.write_text(marcar(t, MARCA), encoding="utf-8"); print("ok Cuenta")

# 7. Mi cuenta en el teléfono: cambios sin guardar y los avisos.
ruta, t = leer("M-Cuenta")
if t:
    t = rep(t, '{"whatsapp":{"editor":"enum"', '{"estado":{"editor":"enum"')
    t = rep(t, 'const e = this.props.whatsapp ?? "Con el módulo de WhatsApp";', 'const e = this.props.estado ?? "Con el módulo de WhatsApp";')
    k = kebab(t)
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>'
    principal = '<div class="ap-it "><span class="tx"><b>lucia.fer@gmail.com</b><span>Principal</span></span></div>'
    empresa = ('<div class="ap-it "><span class="tx"><b>lucia.fernandez@delta.ejemplo.com</b><span>Administrado por Grupo Delta</span></span>'
               '<button type="button" class="ap-ib" aria-label="Acciones de lucia.fernandez@delta.ejemplo.com">')
    google_sin = '<div class="ap-it "><span class="tx"><b>Google</b><span>Sin vincular</span></span><span class="acc-t">Vincular</span></div>'

    def snack(texto):
        return fijo + f'<div class="f-snack" role="status"><span class="ok">{OK}</span><span class="tx">{texto}</span></div>'

    t = clonar(t, "e0", "eSuc", "Cambios sin guardar",
               [('<span class="sub">Personal</span>', '<span class="sub amb"><span>Cambios sin guardar</span></span>'),
                ('<div class="ct">Lucía Fernández</div>', '<div class="ct">Lucía B. Fernández</div>'),
                (fijo, fijo.replace(" apag", ""))])
    for n, (nombre, texto) in enumerate(AVISOS.items()):
        cambios = [(fijo, snack(texto))]
        if nombre == "Agregamos un correo":
            cambios.append((principal, principal + f'<div class="ap-it "><span class="tx"><b>lucia.trabajo@gmail.com</b></span><button type="button" class="ap-ib" aria-label="Acciones de lucia.trabajo@gmail.com">{k}</button></div>'))
        if nombre == "Cambió el principal":
            cambios.append((principal, f'<div class="ap-it "><span class="tx"><b>lucia.fer@gmail.com</b></span><button type="button" class="ap-ib" aria-label="Acciones de lucia.fer@gmail.com">{k}</button></div>'))
            cambios.append(("<span>Administrado por Grupo Delta</span>", "<span>Principal · Administrado por Grupo Delta</span>"))
        if nombre == "Vinculamos Google":
            cambios.append((google_sin, f'<div class="ap-it "><span class="tx"><b>Google</b><span>lucia.fer@gmail.com</span></span><button type="button" class="ap-ib" aria-label="Acciones de Google">{k}</button></div>'))
        var = f"eAv{n}"
        t = clonar(t, "e0", var, nombre, cambios)
        if nombre == "Quitamos un correo":
            i, j = rango_bloque(t, var)
            b = t[i:j]
            a = b.index(empresa)
            z = b.index("</div>", b.index("</button>", a)) + len("</div>")
            t = t[:i] + b[:a] + b[z:] + t[j:]
    t = ordenar_opciones(t, ["Con el módulo de WhatsApp", "Cambios sin guardar", *AVISOS, "Sin el módulo de WhatsApp"])
    css = (".ap-bar .sub.amb { color: oklch(0.55 0.13 70); }\n"
           ".f-snack { position: absolute; z-index: 5; left: 12px; right: 12px; bottom: 110px; display: flex; align-items: center; gap: 10px; padding: 13px 14px 13px 16px; border-radius: 14px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14.5px; line-height: 1.4; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.3); }\n"
           ".f-snack .tx { flex: 1; min-width: 0; }\n.f-snack .ok { color: oklch(0.78 0.14 155); display: inline-flex; }\n")
    ruta.write_text(marcar(t, MARCA, css), encoding="utf-8"); print("ok M-Cuenta")
