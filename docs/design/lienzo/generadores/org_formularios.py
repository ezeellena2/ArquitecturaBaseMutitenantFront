"""Formularios de la organización con el formato aprobado en Mi cuenta: Configuración y Página pública (+ diálogos y celular)."""
import json
import pathlib
import shutil

fuente = pathlib.Path(__file__).resolve().parent / "whatsapp_tableros.py".read_text(encoding="utf-8")
g = {"__file__": __file__}  # el mismo directorio: las rutas de whatsapp_tableros.py se resuelven igual
exec(fuente[:fuente.index("TABLEROS = {}")], g)
CSS, I, KEBAB, MAS, kebab, banda, svg, HEAD_BASE, PROJ = (g[k] for k in ("CSS", "I", "KEBAB", "MAS", "kebab", "banda", "svg", "HEAD_BASE", "PROJ"))
perfil = pathlib.Path(__file__).resolve().parent / "perfil_tableros.py".read_text(encoding="utf-8")
CSS_P = perfil[perfil.index('CSS_P = """') + len('CSS_P = """'):perfil.index('</style>"""', perfil.index('CSS_P = """')) + len("</style>")]

PAGINA = "org"
MARCA = " · para aprobar"
OK_AVISO = '<span style="color: oklch(0.55 0.13 155); display: inline-flex;">' + svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 18, "2") + '</span>'
CSS_O = """<style data-propuesta="org-formularios">
.o-col { flex-direction: column; }
.o-fila { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
.o-codigo .cb { font-family: Inter, system-ui, sans-serif; }
.o-pre { display: flex; height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; overflow: hidden; background: #fff; }
.o-pre span { display: flex; align-items: center; padding: 0 12px; font-size: 13px; }
.o-pre span + span { background: var(--s2); color: var(--t2); border-left: 1px solid var(--borde); }
.o-logo { display: flex; align-items: center; gap: 12px; }
.o-logo .av { width: 56px; height: 56px; border-radius: 12px; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
.o-codigo { font-family: ui-monospace, Consolas, monospace; font-size: 13px; background: var(--s2); border: 1px solid var(--borde); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.w-tel .o-pre, .w-tel .w-cmp .ct { height: 44px; }
.req { color: var(--peligro); }
</style>"""


def ln(activo, clave, href, icono, texto):
    return f'<a class="w-ln{" on" if activo == clave else ""}" href="{href}">{icono} {texto}</a>' if href else f'<span class="w-ln{" on" if activo == clave else ""}">{icono} {texto}</span>'


def sidebar():
    return (f'<aside class="w-sb" aria-label="Menú principal"><div class="w-mk"><span class="brand" style="width: 28px; height: 28px; border-radius: 8px;"></span>ArquitecturaBase</div>'
            f'<div class="w-cx"><b>Grupo Delta</b><span>Organización</span></div>'
            f'<nav class="w-nav"><a class="w-ln" href="Inicio-Org.dc.html">{I["casa"]} Inicio</a></nav><div class="w-esp"></div>'
            f'<div class="w-abajo"><span class="w-ln on">{I["engr"]} Administración <span class="fl">{I["der"]}</span></span></div>'
            f'<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div></aside>')


def panel(activo):
    return (f'<aside class="w-panel" aria-label="Administración"><div class="pc">Administración</div><nav class="w-nav">'
            f'<a class="w-ln grupo" href="Usuarios.dc.html">{I["gente"]} Gestión de usuarios <span class="fl">{I["der"]}</span></a>'
            + ln(activo, "empresas", "Empresas.dc.html", I["edif"], "Empresas")
            + ln(activo, "config", "Configuracion.dc.html", I["engr"], "Configuración")
            + ln(activo, "pagina", "Pagina-Org.dc.html", I["mundo"], "Página pública")
            + ln(activo, "auditoria", "Auditoria-Org.dc.html", I["lista"], "Auditoría")
            + '</nav></aside>')


def topbar(migas):
    return (f'<header class="w-tb"><span>{migas}</span><span class="um"><span class="w-av">L</span>'
            f'<span class="tx"><b>Lucía Fernández</b><span>Grupo Delta</span></span>{I["abajo"]}</span></header>')


def web(cuerpo, activo, migas, extra=""):
    return f'<div class="w-app">{sidebar()}{panel(activo)}<div class="w-co">{topbar(migas)}{cuerpo}</div>{extra}</div>'


def campo(rotulo, valor, ancho, desplegable=False, hueco=None, requerido=False, control=None):
    req = ' <span class="req">*</span>' if requerido else ""
    if control is None:
        if hueco:
            control = f'<input class="ct" style="font: inherit; color: var(--t1);" type="text" aria-label="{rotulo}" value="{{{{{hueco}}}}}" onChange="{{{{on_{hueco}}}}}">'
        else:
            control = f'<div class="ct">{valor} {I["abajo"] if desplegable else ""}</div>'
    estilo = f' style="width: {ancho}px;"' if ancho else ""
    return f'<div class="w-cmp"{estilo}><span class="rt">{rotulo}{req}</span>{control}</div>'


def caja(titulo, cuerpo, accion=""):
    return f'<div class="w-caja"><div class="w-cab"><span>{titulo}</span>{accion}</div>{cuerpo}</div>'


SALTO = '<div class="o-salto"></div>'


def hoja(*piezas):
    """Campos en filas: SALTO corta la fila. Cada fila es su propio renglón, con 16 de separación entre filas."""
    filas, actual = [], []
    for pieza in piezas:
        if pieza == SALTO:
            filas.append(actual); actual = []
        else:
            actual.append(pieza)
    filas.append(actual)
    return '<div class="p-hoja o-col">' + "".join('<div class="o-fila">' + "".join(f) + "</div>" for f in filas if f) + "</div>"


GLOBO = I["mundo"].replace('width="18" height="18"', 'width="16" height="16"')


def dialogo(titulo, cuerpo, botones, cerrar, ancho="", texto="", con_x=True):
    tx = f'<div class="tx" style="padding-bottom: {16 if not cuerpo else 0}px;">{texto}</div>' if texto else ""
    db = f'<div class="db">{cuerpo}</div>' if cuerpo else ""
    return (f'<div class="w-oscuro" style="z-index: 6;"></div><div class="p-dlg {ancho}" role="dialog" aria-label="{titulo}">'
            f'<div class="dc"><span>{titulo}</span>' + (f'<a class="ib" aria-label="Cerrar" href="{cerrar}">{I["x"]}</a>' if con_x else '') + f'</div>{tx}'
            f'{db}<div class="df">{botones}</div></div>')


def acciones_edicion(interactivo, extra=""):
    if interactivo:
        return (extra + '<button type="button" class="cb cb-sec" onClick="{{descartar}}">Descartar cambios</button>'
                '<button type="button" class="cb cb-pri" onClick="{{guardar}}" disabled="{{limpio}}">Guardar cambios</button>')
    return extra + '<button type="button" class="cb cb-sec">Descartar cambios</button><button type="button" class="cb cb-pri" disabled="{{si}}">Guardar cambios</button>'


SUCIO = '<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><span style="color: oklch(0.5 0.12 70); font-weight: 500;">Cambios sin guardar</span></sc-if>'
TOAST = ('<sc-if value="{{aviso}}" hint-placeholder-val="{{no}}"><div class="p-aviso" role="status">' + OK_AVISO + '<span>{{aviso}}</span></div></sc-if>')


# ---------- Configuración ----------
def configuracion(interactivo):
    datos = caja("Datos de la organización", hoja(
        campo("Nombre de la organización", "Grupo Delta", 360, hueco="nombre" if interactivo else None, requerido=True), SALTO,
        campo("Idioma y región predeterminados", "Español (Argentina)", 260, True),
        campo("Zona horaria predeterminada", "Buenos Aires (GMT−3)", 260, True),
        campo("Moneda predeterminada", "Peso argentino (ARS)", 260, True)))
    dominio = caja("Dominio de correo",
                   f'<div class="w-it"><span class="p-ic">{GLOBO}</span><span class="dato"><b>delta.ejemplo.com</b>'
                   f'<span>Verificado · 10 correos administrados por Grupo Delta</span></span>'
                   f'<a class="ib" aria-label="Quitar delta.ejemplo.com" href="Configuracion-Quitar.dc.html">{KEBAB}</a></div>',
                   f'<a class="cb cb-sec ch" href="Configuracion-Dominio.dc.html">{MAS} Agregar dominio</a>')
    res = SUCIO if interactivo else ""
    return banda("Configuración", res, acciones=acciones_edicion(interactivo), icono=I["engr"]) + f'<div class="w-body">{datos}{dominio}</div>'


# ---------- Página pública ----------
def pagina(interactivo):
    direccion = campo("Dirección de la página", None, 360, requerido=True,
                      control='<div class="o-pre"><span style="flex: 1;">delta</span><span>.plataforma.com</span></div>')
    logo = campo("Logo", None, None, control='<div class="o-logo"><span class="av">GD</span><button type="button" class="cb cb-sec ch">Subir imagen</button></div>')
    descripcion = campo("Descripción", None, 720, control='<div class="ct area">Grupo Delta y sus empresas, en un solo lugar.</div>')
    pag = caja("Página", hoja(direccion, campo("Nombre visible", "Grupo Delta", 360, hueco="nombre" if interactivo else None, requerido=True),
                              SALTO, logo, SALTO, descripcion))
    tel = campo("Teléfono", None, 300, control=f'<div style="display: flex; gap: 8px;"><div class="ct" style="width: 112px; white-space: nowrap;">AR +54 {I["abajo"]}</div><div class="ct" style="flex: 1;">011 4321-5678</div></div>')
    contacto = caja("Contacto", hoja(campo("Correo de contacto", "contacto@delta.ejemplo.com", 360), tel, SALTO,
                                     campo("Dirección", "Av. Corrientes 1234, piso 5, Buenos Aires", 480), campo("Sitio web", "https://delta.ejemplo.com", 360)))
    extra = (f'<a class="ib" aria-label="Más acciones" href="Pagina-Org-Despublicar.dc.html" style="border-color: var(--borde);">{KEBAB}</a>'
             '<button type="button" class="cb cb-sec">Ver página</button>')
    res = '<span class="w-est">Publicada</span> · delta.plataforma.com' + (f" {SUCIO.replace('<span style', '· <span style')}" if interactivo else "")
    return banda("Página pública", res, acciones=acciones_edicion(interactivo, extra), icono=I["mundo"]) + f'<div class="w-body">{pag}{contacto}</div>'


CANCELAR_CONF = '<a class="cb cb-sec" href="Configuracion.dc.html">Cancelar</a>'
TABLEROS = {
    "Configuracion": ("Configuración · /org/configuracion", 1440, 900, web(configuracion(True), "config", "Inicio / Configuración", TOAST), "Guardamos la configuración."),
    "Configuracion-Dominio": ("Configuración · agregar dominio", 1440, 900, web(configuracion(False), "config", "Inicio / Configuración", dialogo(
        "Agregar dominio", campo("Dominio", "delta.ejemplo.com", None),
        CANCELAR_CONF + '<a class="cb cb-pri" href="Configuracion-Verificar.dc.html">Siguiente</a>', "Configuracion.dc.html")), None),
    "Configuracion-Verificar": ("Configuración · verificar dominio", 1440, 900, web(configuracion(False), "config", "Inicio / Configuración", dialogo(
        "Verificar delta.ejemplo.com",
        '<div class="w-cmp"><span class="rt">Registro TXT a cargar en el DNS de delta.ejemplo.com</span><div class="o-codigo"><span>ab-verificacion=7f3c9a2e41b8d605</span><button type="button" class="cb cb-sec ch">Copiar</button></div></div>',
        CANCELAR_CONF + '<a class="cb cb-pri" href="Configuracion.dc.html">Comprobar</a>', "Configuracion.dc.html", "normal",
        "Cargá este registro en el DNS de tu dominio y después tocá Comprobar. Puede tardar un rato en aparecer.")), None),
    "Configuracion-Quitar": ("Configuración · quitar dominio", 1440, 900, web(configuracion(False), "config", "Inicio / Configuración", dialogo(
        "¿Quitar delta.ejemplo.com?", "", CANCELAR_CONF + '<a class="cb cb-pel lleno" href="Configuracion.dc.html">Quitar</a>', "Configuracion.dc.html",
        texto="Los 10 correos de delta.ejemplo.com dejan de estar administrados por Grupo Delta.", con_x=False)), None),
    "Pagina-Org": ("Página pública · /org/pagina", 1440, 900, web(pagina(True), "pagina", "Inicio / Página pública", TOAST), "Guardamos la página."),
    "Pagina-Org-Despublicar": ("Página pública · despublicar", 1440, 900, web(pagina(False), "pagina", "Inicio / Página pública", dialogo(
        "¿Despublicar la página?", "", '<a class="cb cb-sec" href="Pagina-Org.dc.html">Cancelar</a><a class="cb cb-pri" href="Pagina-Org.dc.html">Despublicar</a>',
        "Pagina-Org.dc.html", texto="Deja de verse en delta.plataforma.com. La podés volver a publicar cuando quieras.", con_x=False)), None),
    "M-Configuracion": ("Configuración · teléfono", 390, 844, f"""<div class="w-tel p-mov"><header class="w-tb"><span style="display: inline-flex;">{I["menu"]}</span><b style="font-size: 14px;">ArquitecturaBase</b><span class="w-av chico">L</span></header>
      {banda("Configuración", '<span style="color: oklch(0.5 0.12 70); font-weight: 500;">Cambios sin guardar</span>', icono=I["engr"])}
      <div class="w-body" style="overflow: hidden;">{caja("Datos de la organización", hoja(campo("Nombre de la organización", "Grupo Delta", None, requerido=True), campo("Idioma y región predeterminados", "Español (Argentina)", None, True), campo("Zona horaria predeterminada", "Buenos Aires (GMT−3)", None, True), campo("Moneda predeterminada", "Peso argentino (ARS)", None, True)))}
      {caja("Dominio de correo", f'<div class="w-it"><span class="p-ic">{GLOBO}</span><span class="dato"><b>delta.ejemplo.com</b><span>Verificado · 10 correos administrados</span></span>{kebab("delta.ejemplo.com")}</div>', f'<button type="button" class="cb cb-sec ch">{MAS} Agregar</button>')}</div>
      <div class="w-escr" style="padding: 12px 16px 20px;"><button type="button" class="cb cb-sec" style="flex: 1; height: 44px;">Descartar</button><button type="button" class="cb cb-pri" style="flex: 1; height: 44px;">Guardar</button></div></div>""", None),
}


def script(aviso_ok):
    if not aviso_ok:
        return "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}"
    return f"""class Component extends DCLogic {{
  constructor(props) {{
    super(props);
    this.state = {{ nombre: 'Grupo Delta', guardado: 'Grupo Delta', aviso: '' }};
  }}
  renderVals() {{
    const s = this.state;
    return {{
      si: true, no: false,
      nombre: s.nombre,
      on_nombre: (e) => this.setState({{ nombre: e.target.value }}),
      sucio: s.nombre !== s.guardado,
      limpio: s.nombre === s.guardado,
      descartar: () => this.setState({{ nombre: s.guardado }}),
      guardar: () => {{
        this.setState({{ guardado: s.nombre, aviso: '{aviso_ok}' }});
        clearTimeout(this.t);
        this.t = setTimeout(() => this.setState({{ aviso: '' }}), 3000);
      }},
      aviso: s.aviso,
    }};
  }}
}}"""


def archivo(titulo, w, h, cuerpo, aviso_ok):
    head = HEAD_BASE.replace("<title>Criterio · Botones</title>", f"<title>{titulo}</title>")
    tag = f"<script type=\"text/x-dc\" data-dc-script data-props='{{\"$preview\":{{\"width\":{w},\"height\":{h}}}}}'>\n{script(aviso_ok)}\n</script>"
    return "\n".join([head, CSS, CSS_P, CSS_O, "</helmet>", "", cuerpo, "</x-dc>", "", tag, "</body>", "</html>", ""])


if __name__ == "__main__":
    ORIG = pathlib.Path(__file__).resolve().parent / "originales"
    for viejo in ("Configuracion", "Pagina-Org", "M-Configuracion"):
        destino = PROJ / f"{viejo}-Anterior.dc.html"
        if not destino.exists():
            shutil.copyfile(ORIG / f"{viejo}.dc.html", destino)
    for clave, (titulo, w, h, cuerpo, aviso) in TABLEROS.items():
        (PROJ / f"{clave}.dc.html").write_text(archivo(titulo, w, h, cuerpo, aviso), encoding="utf-8")

    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    B = c["boards"]
    for clave in ("Configuracion", "Pagina-Org", "M-Configuracion"):
        b = B[f"{clave}.dc.html"]
        b["title"] = TABLEROS[clave][0] + MARCA
        if clave != "M-Configuracion":
            b["is_interactive"] = True
    # Los diálogos, en una fila nueva debajo de todo lo de la página.
    y = max(b["y"] + b["h"] for b in B.values() if b.get("page") == PAGINA) + 120
    for n, clave in enumerate(["Configuracion-Dominio", "Configuracion-Verificar", "Configuracion-Quitar", "Pagina-Org-Despublicar"]):
        if f"{clave}.dc.html" not in B:
            B[f"{clave}.dc.html"] = {"x": n * 1520, "y": y, "w": 1440, "h": 900, "title": TABLEROS[clave][0] + MARCA, "page": PAGINA, "is_interactive": True}
            c["order"].append(f"{clave}.dc.html")
    # Las versiones anteriores, al Archivo.
    x = max(b["x"] + b["w"] for b in B.values() if b.get("page") == "archivo") + 80
    for clave, titulo, w, h in (("Configuracion-Anterior", "Configuración (antes del criterio)", 1440, 900),
                                ("Pagina-Org-Anterior", "Página pública (antes del criterio)", 1440, 900),
                                ("M-Configuracion-Anterior", "Configuración · teléfono (antes del criterio)", 390, 844)):
        if f"{clave}.dc.html" not in B:
            B[f"{clave}.dc.html"] = {"x": x, "y": 260, "w": w, "h": h, "title": titulo, "page": "archivo", "is_interactive": True}
            c["order"].append(f"{clave}.dc.html")
            x += w + 80
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ok", len(TABLEROS))
