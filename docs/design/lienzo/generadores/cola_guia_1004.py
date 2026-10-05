"""Lo que mandó la Guía después de v107 y solo alinea el lienzo con sus reglas o con la app (R3e, R3f, R3c, 6a y 6d-1, 2026-10-05):
- Criterio · Botones: con el mouse encima, el principal se aclara y el de peligro se oscurece, como la app.
- Criterio · Diálogos: la excepción de 640 para la vista previa de la página pública.
- M-Pagina-Org: la vista previa con la misma tarjeta que M-Pagina-Publica (logo de 72, título de 26, filas de 12).
- Configuracion-Quitar y M-Configuracion-Quitar: el Tweak «estado» con 10, 1 o ningún correo administrado; con uno, «El que ya lo
  está sigue igual.»; sin ninguno, sin la frase y sin la cantidad junto a «Verificado».
- Auditoria-Org: «Quién» con las personas por nombre y después «Sistema» y «Plataforma» (decisión 77 del back).
- M-Auditoria-Org: el estado «Detalle de un cambio», con la hoja de M-Auditoria-Plat-Detalle; el correo va en su propia línea.
- M-Rol: «Vale en» sin asterisco y las casillas fijas de un rol de sistema en gris, como Rol.
- Rol: «Crear rol» activo con el formulario vacío; al tocarlo, el campo dice qué falta.
- M-Roles: el estado «Sin coincidencias», con el recuadro punteado de la app y «Limpiar filtros».
- Empresas y M-Empresas: el CUIT repetido, debajo del campo CUIT con el texto del back, no en la franja.
- M-Cuenta-Baja y M-Cuenta-Metodo: «Dar de baja», «Quitar» y «Desvincular» con el botón de peligro (`.cb-pel.lleno`), como en la compu.
Lleva `data-vuelta="1004-cola-guia"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import clonar, con_estados_pantalla, hoja, rango_bloque, rep  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-cola-guia"'
SVG = r"<svg(?:(?!</svg>).)*</svg>"
RENDER_FIJO = "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}"
CSS_ERR_TEL = (".ap-cmp .ct.mal { border-color: var(--peligro); box-shadow: 0 0 0 3px oklch(0.57 0.2 25 / 0.12); }\n"
               ".ap-err { font-size: 13.5px; color: var(--peligro); margin: -2px 0 0; }\n")

textos, css = {}, {}


def tocar(nombre):
    if nombre not in textos:
        t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
        textos[nombre] = None if MARCA in t else t
        css[nombre] = []
    return textos[nombre]


def poner(nombre, t, regla=""):
    textos[nombre] = t
    if regla:
        css[nombre].append(regla)


def con_estados(t, opciones, ancho, alto):
    props = json.dumps({"estado": {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"},
                        "$preview": {"width": ancho, "height": alto}}, ensure_ascii=False, separators=(",", ":"))
    t = rep(t, "data-props='{\"$preview\":{\"width\":%d,\"height\":%d}}'" % (ancho, alto), f"data-props='{props}'")
    lineas = "".join(f"      e{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(opciones))
    return rep(t, RENDER_FIJO, "class Component extends DCLogic {\n  renderVals() {\n"
               f"    const e = this.props.estado ?? {json.dumps(opciones[0], ensure_ascii=False)};\n\n"
               f"    return {{\n      si: true,\n      no: false,\n{lineas}    }};\n  }}\n}}")


def si(var, html, defecto="no"):
    return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{{defecto}}}}}">{html}</sc-if>'


# Criterio · Botones y Criterio · Diálogos.
t = tocar("Criterio-Botones")
if t:
    poner("Criterio-Botones", rep(t, "<strong>Mouse encima</strong><p>Un tono más oscuro.</p>",
                                  "<strong>Mouse encima</strong><p>Un poco más claro. El de peligro, un poco más oscuro.</p>"))
t = tocar("Criterio-Dialogos")
if t:
    poner("Criterio-Dialogos", rep(t, "<span>420 o 560 px</span><span>Chico para uno o dos campos y confirmaciones; normal para hasta 6 campos en dos columnas.</span>",
                                   "<span>420, 560 o 640 px</span><span>Chico para uno o dos campos y confirmaciones; normal para hasta 6 campos en dos columnas. "
                                   "640 solo para la vista previa de la página pública, para que la tarjeta del público entre tal cual.</span>"))

# M-Pagina-Org: la tarjeta de M-Pagina-Publica, con sus medidas.
t = tocar("M-Pagina-Org")
if t:
    for viejo, nuevo in [
        (".vp.m .pp-tarjeta { padding: 22px 18px 18px;", ".vp.m .pp-tarjeta { padding: 24px 18px 20px;"),
        (".vp.m .pp-logo { width: 64px; height: 64px; border-radius: 16px; font-size: 22px; margin-bottom: 6px; }",
         ".vp.m .pp-logo { width: 72px; height: 72px; border-radius: 18px; font-size: 24px; margin-bottom: 8px; }"),
        (".vp.m h1 { font-size: 24px; line-height: 1.4; }", ".vp.m h1 { font-size: 26px; }"),
        (".vp.m .pp-desc { margin-bottom: 10px; font-size: 15px; line-height: 1.45; }", ".vp.m .pp-desc { margin-bottom: 12px; font-size: 15px; }"),
        (".vp.m .pp-dato { padding: 10px 14px; }", ".vp.m .pp-dato { padding: 12px 14px; }"),
        (".vp.m .pp-dato .tx { line-height: 1.45; }\n", ""),
        (".vp.m .pp-cta { height: 48px; border-radius: 12px; margin-top: 14px; }", ".vp.m .pp-cta { height: 48px; border-radius: 12px; margin-top: 18px; }"),
    ]:
        t = rep(t, viejo, nuevo)
    # Con la tarjeta del público la hoja no entra entera: arranca debajo de la barra de estado y el cuerpo se corta, como en la app.
    poner("M-Pagina-Org", t, '.ap-hoja[aria-label="Vista previa"] { top: 52px; }\n'
          '.ap-hoja[aria-label="Vista previa"] .hb { flex: 1; min-height: 0; overflow: hidden; }\n')

# Quitar dominio: 10, 1 o ningún correo administrado.
OPC_QUITAR = ["10 correos administrados", "1 correo administrado", "Ningún correo administrado"]
CANT = si("e0", " · 10 correos administrados por Grupo Delta") + si("e1", " · 1 correo administrado por Grupo Delta")
FRASE = si("e0", " Los 10 que ya lo están siguen igual.") + si("e1", " El que ya lo está sigue igual.")
t = tocar("Configuracion-Quitar")
if t:
    t = rep(t, "<span>Verificado · 10 correos administrados por Grupo Delta</span>", f"<span>Verificado{CANT}</span>")
    t = rep(t, "ya no quedan administrados por Grupo Delta. Los 10 que ya lo están siguen igual.</div>",
            f"ya no quedan administrados por Grupo Delta.{FRASE}</div>")
    poner("Configuracion-Quitar", con_estados(t, OPC_QUITAR, 1440, 900))
t = tocar("M-Configuracion-Quitar")
if t:
    t = rep(t, '<span class="w-est ">Verificado</span> · 10 correos administrados por Grupo Delta</span>',
            f'<span class="w-est ">Verificado</span>{CANT}</span>')
    t = rep(t, "ya no quedan administrados por Grupo Delta. Los 10 que ya lo están siguen igual.</p>",
            f"ya no quedan administrados por Grupo Delta.{FRASE}</p>")
    poner("M-Configuracion-Quitar", con_estados(t, OPC_QUITAR, 390, 844))

# Auditoría: «Quién» por nombre, después «Sistema» y «Plataforma».
t = tocar("Auditoria-Org")
if t:
    poner("Auditoria-Org", rep(t, "const personas = [...new Set(EVENTOS.map((a) => a.quien))];",
                               "const actores = [...new Set(EVENTOS.map((a) => a.quien))];\n"
                               "const personas = [...actores.filter((p) => p !== 'Sistema' && p !== 'Plataforma').sort((a, b) => a.localeCompare(b, 'es')), "
                               "...['Sistema', 'Plataforma'].filter((p) => actores.includes(p))];"))

t = tocar("M-Auditoria-Org")
if t:
    t = con_estados_pantalla(t, "Lista")
    t = clonar(t, "e0", "e1", "Detalle de un cambio", [])
    _, j = rango_bloque(t, "e1")
    det = ('<div style="display: flex; flex-direction: column;">'
           '<div class="ap-det"><span>Fecha y hora</span><b>27/09/2026 10:42</b></div>'
           '<div class="ap-det"><span>Quién</span><b>Lucía Fernández<em class="mail">lucia.fernandez@delta.ejemplo.com</em></b></div>'
           '<div class="ap-det"><span>Dónde</span><b>Delta S.A.</b></div>'
           '<div class="ap-det"><span>Roles en la empresa</span><b><s>Sin roles</s> → Solo lectura</b></div></div>')
    t = t[:j - len("</sc-if>")] + hoja("Cambió los roles de Tomás Acosta", det, '<button type="button" class="cb cb-sec">Cerrar</button>') + t[j - len("</sc-if>"):]
    poner("M-Auditoria-Org", t, ".ap-det { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-top: 1px solid var(--borde); }\n"
          ".ap-det:first-child { border-top: 0; }\n.ap-det span { font-size: 13px; color: var(--t3); }\n"
          ".ap-det b { font-size: 15.5px; font-weight: 500; }\n.ap-det em.mail { display: block; font-style: normal; font-size: 14px; font-weight: 400; color: var(--t2); }\n"
          ".ap-det s { color: var(--t3); }\n")

# Roles.
t = tocar("M-Rol")
if t:
    poner("M-Rol", rep(t, 'Vale en <span class="rq">*</span>', "Vale en"),
          ".ap-chk.fijo { opacity: 1; }\n.ap-chk.on.fijo { background: oklch(0.78 0.006 78); border-color: oklch(0.78 0.006 78); }\n")
t = tocar("Rol")
if t:
    poner("Rol", rep(t, "noGuardable: !sucio || s.guardando,", "noGuardable: (!m.nuevo && !sucio) || s.guardando,"))
t = tocar("M-Roles")
if t:
    t = con_estados_pantalla(t, "Lista")
    t = clonar(t, "e0", "e1", "Sin coincidencias", [])
    i, j = rango_bloque(t, "e1")
    b = t[i:j]
    a, z = b.index('<div class="ap-cuerpo">'), b.index('<a class="ap-fab"')
    b = (b[:a] + '<div class="ap-cuerpo"><div class="ap-vacio"><strong>Ningún rol coincide con los filtros</strong>'
         '<button type="button" class="cb cb-sec">Limpiar filtros</button></div></div>' + b[z:])
    poner("M-Roles", t[:i] + b + t[j:],
          ".ap-vacio { margin: 12px 16px; padding: 28px 16px; border: 1px dashed var(--borde2); border-radius: 14px; display: flex; "
          "flex-direction: column; align-items: center; gap: 14px; text-align: center; }\n.ap-vacio strong { font-size: 15px; font-weight: 600; }\n")

# Empresas: el CUIT repetido, debajo del campo.
t = tocar("Empresas")
if t:
    poner("Empresas", rep(t, "cuit: '30-71234567-1', errServidor: 'Ya hay una empresa con esa identificación fiscal.' });",
                          "cuit: '30-71234567-1', errCuit: 'Ya hay una empresa con esa identificación fiscal.' });"))
t = tocar("M-Empresas")
if t:
    t = rep(t, '<span>CUIT</span></span><div class="ct">30-71234567-1</div></div>',
            '<span>CUIT</span></span><div class="ct mal">30-71234567-1</div></div><p class="ap-err" role="alert">Ya hay una empresa con esa identificación fiscal.</p>')
    t, n = re.subn(r'<div class="aviso-mal tel" role="alert">' + SVG + r'<span>Ya hay una empresa con esa identificación fiscal\.</span></div>', "", t, flags=re.S)
    assert n == 1
    poner("M-Empresas", t, CSS_ERR_TEL)

# «Dar de baja», «Quitar» y «Desvincular» en el teléfono: el rojo iba a mano sobre `.cb-pri` y el degradé de v107 lo tapó.
ROJO_A_MANO = '<button type="button" class="cb cb-pri" style="background: var(--peligro); border-color: var(--peligro);">'
for nombre, veces in [("M-Cuenta-Baja", 3), ("M-Cuenta-Metodo", 3)]:
    t = tocar(nombre)
    if t:
        poner(nombre, rep(t, ROJO_A_MANO, '<button type="button" class="cb cb-pel lleno">', veces))

escritos = 0
for nombre, t in textos.items():
    if t is None:
        continue
    if css[nombre]:
        assert t.count("</helmet>") == 1, nombre
        t = t.replace("</helmet>", f"<style {MARCA}>\n{''.join(css[nombre])}</style>\n</helmet>")
    else:
        t = t.replace("</helmet>", f"<style {MARCA}></style>\n</helmet>", 1)
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    escritos += 1
print("tableros", escritos)
