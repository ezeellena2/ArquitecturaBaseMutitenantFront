"""El lienzo se alinea a la app (decisión del usuario del 2026-10-04 sobre los puntos de R2c, R3a, la auditoría y R3b): en la app
cambian solo la vista previa de la página pública y el detalle de la auditoría; en todo lo demás, el lienzo queda como la app.
- Criterio · Marco: las pestañas van abajo de la banda, sobre el fondo, como en Empresa (opción B).
- Usuarios: «Vence…» debajo de la palabra del estado, no del punto.
- Criterio · Tablas: el pie del paginado con letra de 12.
- Inicio-Org: «Para resolver» con todas las filas de 52.
- Los 49 tableros con el marco nuevo (`w-sb`): la flecha redonda para achicar, en el borde del último panel («Cerrar
  Administración» si está el panel; si no, «Contraer navegación»), como Criterio · Menús y la app.
- El campo con error, con el borde rojo también en los tableros donde una regla `!important` lo dejaba gris.
- Configuracion-Dominio y M-Configuracion-Dominio: el asterisco y el estado «Sin dominio: error» con «Escribí el dominio.».
- Pagina-Org y M-Pagina-Org: el estado «Borrador: vista previa» con la misma tarjeta que ve el público (Pagina-Publica); el 409,
  con el cartel ámbar de Criterio · Avisos («Otra persona cambió esto mientras lo editabas.», «Seguir editando», «Ver lo nuevo»).
- Auditoria-Org y M-Auditoria-Org: los textos que genera el back («Cambió la invitación de …» aceptada y revocada, «Habilitó a …»,
  «Cambió el acceso de …»), el correo de la invitación vencida tapado y la zona de la empresa con su nombre real.
- M-Empresa: la hoja de roles sin bajada ni «Todos», con «Sin roles» y el texto del back; «Editar empresa» con el CUIT sin guiones
  y «Guardar cambios» activo.
- Empresas y Empresa: toda empresa tiene su zona (Delta S.A. y Delta Norte S.A. en Buenos Aires); «La de la organización», en gris;
  «Editar empresa» con el CUIT sin guiones. M-Empresas: «La de la organización», en gris.
- M-Usuario, «Error al guardar»: el caso de la app (Lucía se quita el rol de Dueña) con el texto del back en la franja.
- El botón primario `.cb-pri` con el degradé de `.b-pri` en los 73 tableros que lo tenían plano.
Lleva `data-vuelta="1004-alineacion-app"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import clonar, hoja, rango_bloque, rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-alineacion-app"'
SVG = r"<svg(?:(?!</svg>).)*</svg>"


def svg(d, w=18, sw="2"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


TRIANGULO = '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'
TEXTO_409 = "Otra persona cambió esto mientras lo editabas."
RENDER_FIJO = "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}"

textos = {}
css = {}


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
    """Tablero estático: le suma el Tweak «estado» con `opciones` y las variables e0, e1… en renderVals."""
    props = json.dumps({"estado": {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"},
                        "$preview": {"width": ancho, "height": alto}}, ensure_ascii=False, separators=(",", ":"))
    t = rep(t, "data-props='{\"$preview\":{\"width\":%d,\"height\":%d}}'" % (ancho, alto), f"data-props='{props}'")
    lineas = "".join(f"      e{i}: e === {json.dumps(o, ensure_ascii=False)},\n" for i, o in enumerate(opciones))
    return rep(t, RENDER_FIJO, "class Component extends DCLogic {\n  renderVals() {\n"
               f"    const e = this.props.estado ?? {json.dumps(opciones[0], ensure_ascii=False)};\n\n"
               f"    return {{\n      si: true,\n      no: false,\n{lineas}    }};\n  }}\n}}")


# 1. Criterio · Marco: las pestañas abajo de la banda, sobre el fondo (B).
t = tocar("Criterio-Marco")
if t:
    tabs = '<div class="tabs2"><span class="on">Miembros <span class="n">6</span></span><span>Roles <span class="n">3</span></span></div>'
    t = rep(t, tabs, f'<div class="tabs-fondo">{tabs}</div>')
    t = rep(t, "<li><strong>En una ficha, una por cada grupo de datos,</strong>",
            "<li><strong>Abajo de la banda, sobre el fondo,</strong> separadas de ella y alineadas con el contenido. La línea de abajo va "
            "a lo ancho del contenido.</li> <li><strong>En una ficha, una por cada grupo de datos,</strong>")
    poner("Criterio-Marco", t, ".tabs-fondo { padding: 20px 24px 6px; background: var(--fondo); }\n"
          ".tabs-fondo .tabs2 { padding: 0 4px; background: none; }\n")

# 2. Usuarios: «Vence…» debajo de la palabra.
t = tocar("Usuarios")
if t:
    t = rep(t, '<span class="n2">Vence {{u.vence}}</span>', '<span class="n2 sang">Vence {{u.vence}}</span>')
    poner("Usuarios", t, ".dos .n2.sang { padding-left: 13px; }\n")

# 3. Criterio · Tablas: el pie del paginado en 12.
t = tocar("Criterio-Tablas")
if t:
    t = rep(t, "Letra de 13: rango a la izquierda", "Letra de 12: rango a la izquierda")
    poner("Criterio-Tablas", t, ".tb .pie, .tb .pie .pil { font-size: 12px; }\n")

# 4. Inicio-Org: «Para resolver» con filas de 52.
t = tocar("Inicio-Org")
if t:
    viejo = '<div class="tarjeta"><div class="t-cab"><h2>Para resolver'
    assert t.count(viejo) >= 1
    t = t.replace(viejo, '<div class="tarjeta t52"><div class="t-cab"><h2>Para resolver')
    poner("Inicio-Org", t, ".t52 > .tt-f { min-height: 52px !important; }\n")

# 5. La flecha para achicar, en el borde del último panel de los tableros con el marco nuevo.
FLECHA = svg('<path d="m15 6-6 6 6 6"/>', 18, "1.75")
CSS_FLECHA = (".w-sb, .w-panel { position: relative; }\n"
              ".w-plegar { padding: 0; font-family: inherit; position: absolute; right: -14px; top: 64px; width: 28px; height: 28px; "
              "border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #fff; "
              "border: 1px solid var(--borde2); box-shadow: 0 1px 3px oklch(0.24 0.012 60 / 0.15); color: var(--t1); cursor: pointer; z-index: 4; }\n"
              ".w-plegar:hover { color: var(--marca); }\n")
for ruta in sorted(PROJ.glob("*.dc.html")):
    nombre = ruta.name[:-len(".dc.html")]
    if 'class="w-sb"' not in ruta.read_text(encoding="utf-8"):
        continue
    t = tocar(nombre)
    if not t:
        continue
    puntos = []
    for m in re.finditer(r'<aside class="w-sb"[^>]*>', t):
        fin = t.find('<div class="w-co"', m.end())
        fin = len(t) if fin < 0 else fin
        p = re.compile(r'<aside class="w-panel"[^>]*>').search(t, m.end(), fin)
        puntos.append((p.end(), "Cerrar Administración") if p else (m.end(), "Contraer navegación"))
    assert puntos, nombre
    for pos, etiqueta in reversed(puntos):
        t = t[:pos] + f'<button type="button" class="w-plegar" aria-label="{etiqueta}">{FLECHA}</button>' + t[pos:]
    poner(nombre, t, CSS_FLECHA)

# 6. El borde rojo del campo con error donde una regla `!important` lo dejaba gris.
for ruta in sorted(PROJ.glob("*.dc.html")):
    nombre = ruta.name[:-len(".dc.html")]
    if nombre.endswith("-Anterior") or not re.search(r"\.in2[^{]*\{[^}]*border[^}]*!important", ruta.read_text(encoding="utf-8")):
        continue
    t = tocar(nombre)
    if t:
        poner(nombre, t, ".in2.mal { border-color: var(--peligro) !important; }\n")

# 7. «Agregar dominio»: el asterisco y el error sin dominio.
t = tocar("Configuracion-Dominio")
if t:
    t, n = re.subn(r'<div class="w-cmp"><span class="rt">Dominio</span><div class="ct">delta\.ejemplo\.com\s*</div></div>',
                   '<div class="w-cmp"><span class="rt">Dominio <span class="rq">*</span></span>'
                   '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}"><div class="ct">delta.ejemplo.com</div></sc-if>'
                   '<sc-if value="{{e1}}" hint-placeholder-val="{{no}}"><div class="ct mal"></div><span class="err2">Escribí el dominio.</span></sc-if></div>', t)
    assert n == 1
    t = con_estados(t, ["Con dominio", "Sin dominio: error"], 1440, 900)
    poner("Configuracion-Dominio", t, ".w-cmp .rq { color: var(--peligro); }\n.w-cmp .ct.mal { border-color: var(--peligro) !important; }\n")
t = tocar("M-Configuracion-Dominio")
if t:
    t = rep(t, '<div class="ap-cmp"><span class="rt"><span>Dominio <span class="rq">*</span></span></span><div class="ct">delta.ejemplo.com</div></div>',
            '<div class="ap-cmp"><span class="rt"><span>Dominio <span class="rq">*</span></span></span>'
            '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}"><div class="ct">delta.ejemplo.com</div></sc-if>'
            '<sc-if value="{{e1}}" hint-placeholder-val="{{no}}"><div class="ct mal"></div></sc-if></div>'
            '<sc-if value="{{e1}}" hint-placeholder-val="{{no}}"><p class="ap-err" role="alert">Escribí el dominio.</p></sc-if>')
    t = con_estados(t, ["Con dominio", "Sin dominio: error"], 390, 844)
    poner("M-Configuracion-Dominio", t, ".ap-cmp .ct.mal { border-color: var(--peligro); box-shadow: 0 0 0 3px oklch(0.57 0.2 25 / 0.12); }\n"
          ".ap-err { font-size: 13.5px; color: var(--peligro); margin: -2px 0 0; }\n")

# 8. La página pública: la vista previa con la tarjeta del público y el 409 en ámbar.
pub = (PROJ / "Pagina-Publica.dc.html").read_text(encoding="utf-8")
m = re.search(r'<main class="pp-centro">(<div class="pp-tarjeta">.*?</div>)</main>', pub, re.S)
assert m
TARJETA = re.sub(r' href="[^"]*"', "", m.group(1).replace('<div class="lista">', '<div class="pp-lista">'))
TARJETA = rep(TARJETA, '<sc-if value="{{sinSesion}}" hint-placeholder-val="{{si}}"><a class="b b-pri lg pp-cta">Ingresá para continuar</a></sc-if>',
              '<span class="cb cb-pri pp-cta">Ingresá para continuar</span>')
CSS_VP = """.vp { display: flex; justify-content: center; padding: 24px 40px; background: radial-gradient(ellipse at 80% 0%, oklch(0.94 0.028 78), transparent 55%), var(--fondo); }
.vp .pp-tarjeta { width: 100%; box-sizing: border-box; background: #fff; border: 1px solid var(--borde); border-radius: 20px; box-shadow: 0 16px 40px oklch(0.24 0.014 78 / 0.08); padding: 32px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; font-size: 15px; line-height: 1.6; color: var(--t1); }
.vp .pp-logo { width: 84px; height: 84px; box-sizing: border-box; border-radius: 20px; border: 1px solid var(--borde); background: var(--marca-t); color: var(--marca-tx); font-size: 28px; font-weight: 700; letter-spacing: -0.02em; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; }
.vp h1 { margin: 0; font-size: 30px; line-height: 1.6; font-weight: 700; letter-spacing: -0.02em; }
.vp .pp-desc { margin: 2px 0 14px; font-size: 16px; color: var(--t2); }
.vp .pp-lista { width: 100%; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; text-align: left; }
.vp .pp-dato { display: flex; gap: 12px; align-items: flex-start; padding: 14px 18px; border-top: 1px solid var(--borde); }
.vp .pp-dato:first-child { border-top: 0; }
.vp .pp-dato svg { color: var(--t3); flex-shrink: 0; margin-top: 2px; }
.vp .pp-dato .tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 0; line-height: 1.6; color: var(--t1); }
.vp .pp-dato .tx span { font-size: 12.5px; color: var(--t3); }
.vp .pp-dato .tx b, .vp .pp-dato .tx a { font-size: 15px; font-weight: 500; color: var(--t1); text-decoration: none; overflow-wrap: anywhere; }
.vp .pp-dato .tx a { color: var(--marca-tx); }
.vp .pp-cta { margin-top: 18px; width: 100%; height: 44px; box-sizing: border-box; font-size: 15px; border-radius: 10px; }
"""
t = tocar("Pagina-Org")
if t:
    t, n = re.subn(r'<div class="aviso-mal" role="alert">' + SVG + r'<span>La página cambió desde que la abriste\. Actualizala antes de guardar\.</span></div>',
                   f'<div class="w-cartel" role="alert">{svg(TRIANGULO)}<span class="tx">{TEXTO_409}</span>'
                   '<button type="button" class="cb cb-enl">Seguir editando</button><button type="button" class="cb cb-sec ch">Ver lo nuevo</button></div>',
                   t, flags=re.S)
    assert n == 1
    cerrar = re.search(r'aria-label="Cerrar" onClick="\{\{cerrarInfo\}\}">(' + SVG + ')', t, re.S).group(1)
    t = rep(t, '<button type="button" class="cb cb-sec">Vista previa</button>', '<button type="button" class="cb cb-sec" onClick="{{verVista}}">Vista previa</button>')
    _, j = rango_bloque(t, "info")
    t = (t[:j] + '<sc-if value="{{vista}}" hint-placeholder-val="{{no}}"><div class="w-oscuro" style="z-index: 6;"></div>'
         '<div class="p-dlg vp-dlg" role="dialog" aria-label="Vista previa"><div class="dc"><span>Vista previa</span>'
         f'<button type="button" class="ib" aria-label="Cerrar" onClick="{{{{cerrarVista}}}}">{cerrar}</button></div>'
         f'<div class="vp">{TARJETA}</div><div class="df"><button type="button" class="cb cb-pri" onClick="{{{{cerrarVista}}}}">Cerrar</button></div></div></sc-if>'
         + t[j:])
    t = sumar_opcion(t, "Borrador", "Borrador: vista previa")
    t = rep(t, "    const error = e === 'Publicada: error al guardar';\n",
            "    const error = e === 'Publicada: error al guardar';\n    const vista = e === 'Borrador: vista previa';\n")
    t = rep(t, "estado: error ? 'Publicada' : (e || 'Publicada'), errGuardar: error };",
            "estado: error ? 'Publicada' : vista ? 'Borrador' : (e || 'Publicada'), errGuardar: error, vista };")
    t = rep(t, "      cerrarInfo: () => this.setState({ info: false }),\n",
            "      cerrarInfo: () => this.setState({ info: false }),\n      vista: !!s.vista,\n"
            "      verVista: () => this.setState({ vista: true }),\n      cerrarVista: () => this.setState({ vista: false }),\n")
    poner("Pagina-Org", t, ".vp-dlg { width: 640px; }\n" + CSS_VP)

pubm = (PROJ / "M-Pagina-Publica.dc.html").read_text(encoding="utf-8")
m = re.search(r'<main class="pp-centro">(<div class="pp-tarjeta">.*?</div>)</main>', pubm, re.S)
assert m
TARJETA_M = re.sub(r' href="[^"]*"', "", m.group(1).replace('<div class="lista">', '<div class="pp-lista">'))
TARJETA_M = rep(TARJETA_M, '<sc-if value="{{sinSesion}}" hint-placeholder-val="{{si}}"><a class="b b-pri lg pp-cta">Ingresá para continuar</a></sc-if>',
                '<span class="cb cb-pri pp-cta">Ingresá para continuar</span>')
t = tocar("M-Pagina-Org")
if t:
    t, n = re.subn(r'<div class="f-banda mal" role="alert">' + SVG + r'<span class="tx">La página cambió desde que la abriste\. Actualizala antes de guardar\.</span></div>',
                   f'<div class="f-banda amb" role="alert">{svg(TRIANGULO, 18, "1.75")}<span class="tx">{TEXTO_409}'
                   '<span class="acc"><a href="#">Seguir editando</a><a href="#">Ver lo nuevo</a></span></span></div>', t, flags=re.S)
    assert n == 1
    t = clonar(t, "e1", "e5", "Borrador: vista previa", [])
    i, j = rango_bloque(t, "e5")
    vista = hoja("Vista previa", f'<div class="vp m">{TARJETA_M}</div>', '<button type="button" class="cb cb-pri">Cerrar</button>')
    t = t[:j - len("</sc-if>")] + vista + t[j - len("</sc-if>"):]
    poner("M-Pagina-Org", t, CSS_VP + """.f-banda.amb { background: oklch(0.96 0.06 85); color: oklch(0.4 0.1 70); }
.f-banda .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.f-banda .acc { display: flex; gap: 18px; }
.f-banda .acc a { font-weight: 600; text-decoration: none; color: inherit; }
.vp.m { margin: 0 -20px; padding: 16px; }
.vp.m .pp-tarjeta { padding: 22px 18px 18px; border-radius: 18px; box-shadow: 0 10px 28px oklch(0.24 0.014 78 / 0.08); }
.vp.m .pp-logo { width: 64px; height: 64px; border-radius: 16px; font-size: 22px; margin-bottom: 6px; }
.vp.m h1 { font-size: 24px; line-height: 1.4; }
.vp.m .pp-desc { margin-bottom: 10px; font-size: 15px; line-height: 1.45; }
.vp.m .pp-dato { padding: 10px 14px; }
.vp.m .pp-dato .tx { line-height: 1.45; }
.vp.m .pp-cta { height: 48px; border-radius: 12px; margin-top: 14px; }
""")

# 9. La auditoría con los textos del back, el correo tapado y la zona real.
t = tocar("Auditoria-Org")
if t:
    t = rep(t, "que: 'Venció la invitación a carla.bianchi@delta.ejemplo.com'", "que: 'Venció la invitación a ca•••@delta.ejemplo.com'")
    t = rep(t, "[['Zona de negocio', 'La de la organización', 'Córdoba (GMT−3)']]", "[['Zona de negocio', 'Buenos Aires (GMT−3)', 'Córdoba (GMT−3)']]")
    t = rep(t, "  { id: 'a1', ",
            "  { id: 'a11', fecha: '27/09/2026 11:05', rel: 'hace 5 horas', periodo: 0, tema: 'usuarios', que: 'Cambió la invitación de ma•••@delta.ejemplo.com', "
            "donde: 'Delta S.A.', quien: 'Martín Paz', email: 'martin.paz@delta.ejemplo.com', cambios: [['Estado', 'Invitación pendiente', 'Invitación aceptada']] },\n"
            "  { id: 'a1', ")
    t = rep(t, "  { id: 'a5', ",
            "  { id: 'a12', fecha: '25/09/2026 17:20', rel: 'hace 2 días', periodo: 7, tema: 'usuarios', que: 'Habilitó a Tomás Acosta', "
            "donde: 'Toda la organización', quien: 'Lucía Fernández', email: 'lucia.fernandez@delta.ejemplo.com', cambios: [['Estado', 'Deshabilitado', 'Activo']] },\n"
            "  { id: 'a13', fecha: '25/09/2026 10:05', rel: 'hace 2 días', periodo: 7, tema: 'usuarios', que: 'Cambió la invitación de ju•••@gmail.com', "
            "donde: 'Delta Sur S.R.L.', quien: 'Carolina Vega', email: 'carolina.vega@delta.ejemplo.com', cambios: [['Estado', 'Invitación pendiente', 'Invitación revocada']] },\n"
            "  { id: 'a5', ")
    t = rep(t, "  { id: 'a8', ",
            "  { id: 'a14', fecha: '21/09/2026 16:05', rel: 'hace 6 días', periodo: 7, tema: 'empresas', que: 'Cambió el acceso de Marcos Giménez', "
            "donde: 'Delta S.A.', quien: 'Lucía Fernández', email: 'lucia.fernandez@delta.ejemplo.com', cambios: [['Estado', 'Activo', 'Inactivo']] },\n"
            "  { id: 'a8', ")
    poner("Auditoria-Org", t)


def fila_ap(que, cuando, donde):
    return (f'<a class="ap-fila" href="#"><div class="tx"><span class="l1" style="align-items: flex-start;"><span class="q">{que}</span>'
            f'<span>{cuando}</span></span><span class="l2">{donde}</span></div></a>')


t = tocar("M-Auditoria-Org")
if t:
    t = rep(t, "Venció la invitación a carla.bianchi@delta.ejemplo.com", "Venció la invitación a ca•••@delta.ejemplo.com")
    primera = fila_ap("Cambió los roles de Tomás Acosta", "27/09 10:42", "Delta S.A. · Lucía Fernández")
    t = rep(t, primera, fila_ap("Cambió la invitación de ma•••@delta.ejemplo.com", "27/09 11:05", "Delta S.A. · Martín Paz") + primera)
    quinta = fila_ap("Deshabilitó a Marcos Giménez", "24/09 16:40", "Toda la organización · Lucía Fernández")
    t = rep(t, quinta, fila_ap("Habilitó a Tomás Acosta", "25/09 17:20", "Toda la organización · Lucía Fernández")
            + fila_ap("Cambió la invitación de ju•••@gmail.com", "25/09 10:05", "Delta Sur S.R.L. · Carolina Vega") + quinta)
    zona = fila_ap("Cambió la zona de Delta Sur S.R.L.", "22/09 12:31", "Delta Sur S.R.L. · Carolina Vega")
    t = rep(t, zona, zona + fila_ap("Cambió el acceso de Marcos Giménez", "21/09 16:05", "Delta S.A. · Lucía Fernández"))
    poner("M-Auditoria-Org", t)

# 10. M-Empresa: la hoja de roles y «Editar empresa», como la app.
t = tocar("M-Empresa")
if t:
    t = rep(t, '<h2>Roles de Lucía Fernández</h2><span class="h-sub">Delta S.A.</span>', "<h2>Roles de Lucía Fernández</h2>")
    t = rep(t, '<label class="ap-todos"><span class="ap-chk"></span>Todos</label>', "")
    t = rep(t, '<div class="ct ph sel">Elegí uno o más roles', '<div class="ct ph sel">Sin roles')
    t = rep(t, "Tiene que quedar al menos una persona administradora activa en la empresa.", "Tiene que quedar al menos un administrador en la empresa.")
    i, j = rango_bloque(t, "e2")
    bloque = rep(t[i:j], '<span>CUIT</span></span><div class="ct">30-71234567-1</div>', '<span>CUIT</span></span><div class="ct">30712345671</div>')
    bloque = rep(bloque, '<button type="button" class="cb cb-pri apag">Guardar cambios</button>', '<button type="button" class="cb cb-pri">Guardar cambios</button>')
    poner("M-Empresa", t[:i] + bloque + t[j:])

# 11. Empresas y Empresa: toda empresa con su zona, «La de la organización» en gris y el CUIT sin guiones al editar.
for nombre in ["Empresas", "Empresa"]:
    t = tocar(nombre)
    if not t:
        continue
    t = rep(t, "{ id: 'c1', n: 'Delta S.A.', cuit: '30-71234567-1', zona: null,", "{ id: 'c1', n: 'Delta S.A.', cuit: '30-71234567-1', zona: 'America/Argentina/Buenos_Aires',")
    t = rep(t, "{ id: 'c3', n: 'Delta Norte S.A.', cuit: '', zona: null,", "{ id: 'c3', n: 'Delta Norte S.A.', cuit: '', zona: 'America/Argentina/Buenos_Aires',")
    t = rep(t, "  { v: null, n: 'La de la organización', d: nombreZona(ORG_ZONA) },\n",
            "  { v: null, n: 'La de la organización', d: nombreZona(ORG_ZONA) },\n  { v: ORG_ZONA, n: nombreZona(ORG_ZONA) },\n")
    t = rep(t, "['claseVal' + clave]: actual ? '' : 'vacio2',", "['claseVal' + clave]: actual && actual.v !== null ? '' : 'vacio2',")
    t = rep(t, "cuit: e.cuit, zona: e.zona", "cuit: e.cuit.replace(/\\D/g, ''), zona: e.zona")
    poner(nombre, t)
t = tocar("M-Empresas")
if t:
    viejo = '<div class="ct sel">La de la organización'
    assert t.count(viejo) == 2
    poner("M-Empresas", t.replace(viejo, '<div class="ct sel ph">La de la organización'), ".ap-cmp .ct.ph { color: var(--t3); }\n")

# 12. M-Usuario, «Error al guardar»: Lucía se quita el rol de Dueña y el back responde en la franja.
t = tocar("M-Usuario")
if t:
    assert t.count("Tomás Acosta") == 2
    t = t.replace("Tomás Acosta", "{{nombre}}")
    k = t.index("Solo lectura")
    assert k < t.index('<sc-if value="{{e1}}"')
    t = t[:k] + "{{rolEmpresa}}" + t[k + len("Solo lectura"):]
    t = rep(t, "Algo salió mal. Probá de nuevo en un rato.", "Tiene que quedar al menos un Dueño. Dale el rol a otra persona antes de quitártelo.")
    t = rep(t, '      claseGuardar: e === "Error al guardar" ? "" : "apag",\n',
            '      claseGuardar: e === "Error al guardar" ? "" : "apag",\n'
            '      nombre: e === "Error al guardar" ? "Lucía Fernández" : "Tomás Acosta",\n'
            '      rolEmpresa: e === "Error al guardar" ? "Administrador" : "Solo lectura",\n')
    poner("M-Usuario", t)

# 13. El botón primario con el degradé de `.b-pri` donde `.cb-pri` era plano.
for ruta in sorted(PROJ.glob("*.dc.html")):
    nombre = ruta.name[:-len(".dc.html")]
    if ".cb-pri { background: var(--marca); color: #fff; }" not in ruta.read_text(encoding="utf-8"):
        continue
    t = tocar(nombre)
    if t:
        poner(nombre, t, ".cb-pri { background: linear-gradient(180deg, var(--marca) 0%, var(--marca-h) 100%) !important; "
              "box-shadow: 0 1px 2px var(--marca-sombra), inset 0 1px 0 rgb(255 255 255 / 0.15); }\n"
              ".cb-pri:hover, .cb-pri.h { filter: brightness(1.05); }\n")

escritos = 0
for nombre, t in textos.items():
    if t is None:
        continue
    assert t.count("</helmet>") == 1, nombre
    t = t.replace("</helmet>", f"<style {MARCA}>\n{''.join(css[nombre])}</style>\n</helmet>")
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    escritos += 1
print("tableros", escritos)
