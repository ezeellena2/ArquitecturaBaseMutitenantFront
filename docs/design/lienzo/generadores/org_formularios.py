"""Formularios de la organización con el formato aprobado en Mi cuenta: Configuración y Página pública (+ diálogos y celular)."""
import json
import pathlib
import shutil

fuente = (pathlib.Path(__file__).resolve().parent / "whatsapp_tableros.py").read_text(encoding="utf-8")
g = {"__file__": __file__}  # el mismo directorio: las rutas de whatsapp_tableros.py se resuelven igual
exec(fuente[:fuente.index("TABLEROS = {}")], g)
CSS, I, KEBAB, MAS, kebab, banda, svg, HEAD_BASE, PROJ = (g[k] for k in ("CSS", "I", "KEBAB", "MAS", "kebab", "banda", "svg", "HEAD_BASE", "PROJ"))
perfil = (pathlib.Path(__file__).resolve().parent / "perfil_tableros.py").read_text(encoding="utf-8")
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
/* Dentro de una caja, las filas comparten las mismas columnas y ocupan todo el ancho (2026-10-02). */
.o-g2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 16px 20px 20px; align-items: start; }
.o-g2 .o-ancho { grid-column: 1 / -1; }
.o-g2 .w-cmp { width: auto !important; }
.o-dom-vacio { padding: 14px 16px; color: var(--t3); font-size: 13px; }
.o-logo-chico { width: 40px; height: 40px; border-radius: 10px; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
/* Publicación: un interruptor que se aplica al momento; trabado si la plataforma la despublicó. */
.o-sw { display: inline-flex; padding: 0 10px 0 0; border: 0; background: none; cursor: pointer; }
.w-sw.o-bloq { opacity: 0.4; cursor: not-allowed; }
.w-est.o-mal { color: oklch(0.5 0.19 25); }
.w-est.o-mal::before { background: oklch(0.57 0.2 25); }
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


INFO = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8h.01"/>', 16, "2")
ALERTA = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5"/><path d="M12 16.2h.01"/>', 18, "2")


def sif(valor, cuerpo, ph="no"):
    return f'<sc-if value="{{{{{valor}}}}}" hint-placeholder-val="{{{{{ph}}}}}">{cuerpo}</sc-if>'


# ---------- Configuración ----------
def configuracion(interactivo, dominio="verificado"):
    """dominio: «sin», «pendiente» o «verificado». Con Play, se elige con el Tweak «Dominio»."""
    datos = caja("Datos de la organización", '<div class="o-g2">'
                 + campo("Nombre de la organización", "Grupo Delta", None, hueco="nombre" if interactivo else None, requerido=True)
                 + campo("Idioma y región predeterminados", "Español (Argentina)", None, True)
                 + campo("Zona horaria predeterminada", "Buenos Aires (GMT−3)", None, True)
                 + campo("Moneda predeterminada", "Peso argentino (ARS)", None, True) + "</div>")
    quitar = f'<a class="ib" aria-label="Quitar delta.ejemplo.com" href="Configuracion-Quitar.dc.html">{KEBAB}</a>'

    def fila(segunda, derecha):
        return (f'<div class="w-it"><span class="p-ic">{GLOBO}</span><span class="dato"><b>delta.ejemplo.com</b>'
                f'<span>{segunda}</span></span>{derecha}</div>')

    estados = {
        "sin": '<div class="o-dom-vacio">Sin dominio</div>',
        "pendiente": fila("Pendiente", '<a class="cb cb-sec ch" href="Configuracion-Verificar.dc.html">Verificar</a>' + quitar),
        "verificado": fila("Verificado · 10 correos administrados por Grupo Delta", quitar),
    }
    cuerpo = (sif("sinDominio", estados["sin"]) + sif("pendiente", estados["pendiente"]) + sif("verificado", estados["verificado"], "si")
              if interactivo else estados[dominio])
    dom = caja("Dominio de correo", cuerpo, f'<a class="cb cb-sec ch" href="Configuracion-Dominio.dc.html">{MAS} Agregar dominio</a>')
    res = SUCIO if interactivo else ""
    return banda("Configuración", res, acciones=acciones_edicion(interactivo), icono=I["engr"]) + f'<div class="w-body">{datos}{dom}</div>'


# ---------- Página pública ----------
def pagina(interactivo, estado="publicada"):
    """estado: «publicada», «borrador» o «despublicada» (por la plataforma). Con Play, se elige con el Tweak «Estado»."""
    res = {"publicada": '<span class="w-est">Publicada</span> · delta.plataforma.com',
           "borrador": '<span class="w-est off">Borrador</span>',
           "despublicada": '<span class="w-est o-mal">Despublicada por la plataforma</span>'}
    ver = {"publicada": '<button type="button" class="cb cb-sec">Ver página</button>', "otro": '<button type="button" class="cb cb-sec">Vista previa</button>'}
    sw = {"publicada": '<a class="o-sw" href="Pagina-Org-Despublicar.dc.html" aria-label="Despublicar la página"><span class="w-sw" role="switch" aria-checked="true"></span></a>',
          "borrador": '<button type="button" class="o-sw" onClick="{{publicar}}" aria-label="Publicar la página"><span class="w-sw off" role="switch" aria-checked="false"></span></button>',
          "despublicada": ('<span class="o-sw"><span class="w-sw off o-bloq" role="switch" aria-checked="false" aria-disabled="true" '
                           'aria-label="Publicar la página: bloqueado por la plataforma"></span></span>')}
    tit = {"normal": "<b>Visible en delta.plataforma.com</b>",
           "despublicada": (f'<b class="o-fila-tit">Visible en delta.plataforma.com<button type="button" class="o-i" aria-label="Por qué está despublicada" '
                            f'onClick="{{{{verInfo}}}}">{INFO}</button></b>')}

    def fila_pub(e):
        return (f'<div class="w-it"><span class="p-ic">{GLOBO}</span><span class="dato">{tit["despublicada" if e == "despublicada" else "normal"]}</span>'
                f'{sw[e]}</div>')

    if interactivo:
        res_b = sif("publicada", res["publicada"], "si") + sif("borrador", res["borrador"]) + sif("despublicada", res["despublicada"])
        res_b += " " + SUCIO.replace("<span style", "· <span style")
        extra = sif("publicada", ver["publicada"], "si") + sif("noPublicada", ver["otro"])
        pub = sif("publicada", fila_pub("publicada"), "si") + sif("borrador", fila_pub("borrador")) + sif("despublicada", fila_pub("despublicada"))
    else:
        res_b = res[estado]
        extra = ver["publicada" if estado == "publicada" else "otro"]
        pub = fila_pub(estado)
    publicacion = caja("Publicación", pub)

    logo = ('<div class="w-it"><span class="o-logo-chico">GD</span><span class="dato"><b>Logo</b></span>'
            '<button type="button" class="cb cb-sec ch">Subir imagen</button></div>')
    direccion = campo("Dirección de la página", None, None, requerido=True,
                      control='<div class="o-pre"><span style="flex: 1;">delta</span><span>.plataforma.com</span></div>')
    nombre = campo("Nombre visible", "Grupo Delta", None, hueco="nombre" if interactivo else None, requerido=True)
    descripcion = campo("Descripción", None, None, control='<div class="ct area">Grupo Delta y sus empresas, en un solo lugar.</div>').replace(
        '<div class="w-cmp"', '<div class="w-cmp o-ancho"', 1)
    pag = caja("Página", logo + '<div class="o-g2">' + direccion + nombre + descripcion + "</div>")
    tel = campo("Teléfono", None, None, control=f'<div style="display: flex; gap: 8px;"><div class="ct" style="width: 112px; white-space: nowrap;">AR +54 {I["abajo"]}</div><div class="ct" style="flex: 1;">011 4321-5678</div></div>')
    contacto = caja("Contacto", '<div class="o-g2">' + campo("Correo de contacto", "contacto@delta.ejemplo.com", None) + tel
                    + campo("Dirección", "Av. Corrientes 1234, piso 5, Buenos Aires", None) + campo("Sitio web", "https://delta.ejemplo.com", None) + "</div>")
    return (banda("Página pública", res_b, acciones=acciones_edicion(interactivo, extra), icono=I["mundo"])
            + f'<div class="w-body">{publicacion}{pag}{contacto}</div>')


# El ⓘ de «Despublicada por la plataforma» abre este aviso (diálogo de aviso importante).
AVISO_DESPUBLICADA = sif("info", '<div class="w-oscuro" style="z-index: 6;"></div><div class="p-dlg" role="dialog" aria-label="Página despublicada">'
                         f'<div class="dc"><span>Página despublicada</span><button type="button" class="ib" aria-label="Cerrar" onClick="{{{{cerrarInfo}}}}">{I["x"]}</button></div>'
                         f'<div class="db"><div class="o-mot">{ALERTA}<div><b>Datos de contacto falsos</b><span>Despublicada por la plataforma el 26/09/2026</span></div></div>'
                         '<span class="o-sub">Qué podés hacer</span><ol class="o-pasos"><li><span class="n">1</span>Corregí los datos de la página</li>'
                         '<li><span class="n">2</span>Pedí a la plataforma que la habilite</li></ol></div>'
                         '<div class="df"><button type="button" class="cb cb-pri" onClick="{{cerrarInfo}}">Entendido</button></div></div>')


CANCELAR_CONF = '<a class="cb cb-sec" href="Configuracion.dc.html">Cancelar</a>'
TABLEROS = {
    "Configuracion": ("Configuración · /org/configuracion", 1440, 900, web(configuracion(True), "config", "Inicio / Configuración", TOAST), "Guardamos la configuración."),
    "Configuracion-Dominio": ("Configuración · agregar dominio", 1440, 900, web(configuracion(False, "sin"), "config", "Inicio / Configuración", dialogo(
        "Agregar dominio", campo("Dominio", "delta.ejemplo.com", None),
        CANCELAR_CONF + '<a class="cb cb-pri" href="Configuracion-Verificar.dc.html">Siguiente</a>', "Configuracion.dc.html")), None),
    "Configuracion-Verificar": ("Configuración · verificar dominio", 1440, 900, web(configuracion(False, "pendiente"), "config", "Inicio / Configuración", dialogo(
        "Verificar delta.ejemplo.com",
        '<div class="w-cmp"><span class="rt">Registro TXT a cargar en el DNS de delta.ejemplo.com</span><div class="o-codigo"><span>ab-verificacion=7f3c9a2e41b8d605</span><button type="button" class="cb cb-sec ch">Copiar</button></div></div>',
        CANCELAR_CONF + '<a class="cb cb-pri" href="Configuracion.dc.html">Comprobar</a>', "Configuracion.dc.html", "normal",
        "Cargá este registro en el DNS de tu dominio y después tocá Comprobar. Puede tardar un rato en aparecer.")), None),
    "Configuracion-Quitar": ("Configuración · quitar dominio", 1440, 900, web(configuracion(False), "config", "Inicio / Configuración", dialogo(
        "¿Quitar delta.ejemplo.com?", "", CANCELAR_CONF + '<a class="cb cb-pel lleno" href="Configuracion.dc.html">Quitar</a>', "Configuracion.dc.html",
        texto="Los 10 correos de delta.ejemplo.com dejan de estar administrados por Grupo Delta.", con_x=False)), None),
    "Pagina-Org": ("Página pública · /org/pagina", 1440, 900, web(pagina(True), "pagina", "Inicio / Página pública", TOAST + AVISO_DESPUBLICADA), "Guardamos la página."),
    "Pagina-Org-Despublicar": ("Página pública · despublicar", 1440, 900, web(pagina(False, "publicada"), "pagina", "Inicio / Página pública", dialogo(
        "¿Despublicar la página?", "", '<a class="cb cb-sec" href="Pagina-Org.dc.html">Cancelar</a><a class="cb cb-pri" href="Pagina-Org.dc.html">Despublicar</a>',
        "Pagina-Org.dc.html", texto="Deja de verse en delta.plataforma.com. La podés volver a publicar cuando quieras.", con_x=False)), None),
    "M-Configuracion": ("Configuración · teléfono", 390, 844, f"""<div class="w-tel p-mov"><header class="w-tb"><span style="display: inline-flex;">{I["menu"]}</span><b style="font-size: 14px;">ArquitecturaBase</b><span class="w-av chico">L</span></header>
      {banda("Configuración", '<span style="color: oklch(0.5 0.12 70); font-weight: 500;">Cambios sin guardar</span>', icono=I["engr"])}
      <div class="w-body" style="overflow: hidden;">{caja("Datos de la organización", hoja(campo("Nombre de la organización", "Grupo Delta", None, requerido=True), campo("Idioma y región predeterminados", "Español (Argentina)", None, True), campo("Zona horaria predeterminada", "Buenos Aires (GMT−3)", None, True), campo("Moneda predeterminada", "Peso argentino (ARS)", None, True)))}
      {caja("Dominio de correo", f'<div class="w-it"><span class="p-ic">{GLOBO}</span><span class="dato"><b>delta.ejemplo.com</b><span>Verificado · 10 correos administrados</span></span>{kebab("delta.ejemplo.com")}</div>', f'<button type="button" class="cb cb-sec ch">{MAS} Agregar</button>')}</div>
      <div class="w-escr" style="padding: 12px 16px 20px;"><button type="button" class="cb cb-sec" style="flex: 1; height: 44px;">Descartar</button><button type="button" class="cb cb-pri" style="flex: 1; height: 44px;">Guardar</button></div></div>""", None),
}


def script(aviso_ok, clave=""):
    if not aviso_ok:
        return "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}"
    extra_estado, extra_vals = "", ""
    if clave == "Configuracion":
        extra_vals = """
      sinDominio: this.props.dominio === 'Sin dominio',
      pendiente: this.props.dominio === 'Pendiente',
      verificado: (this.props.dominio || 'Verificado') === 'Verificado',"""
    if clave == "Pagina-Org":
        extra_estado = ", estado: props.estado || 'Publicada', clave: props.estado, info: false"
        extra_vals = """
      publicada: s.estado === 'Publicada',
      borrador: s.estado === 'Borrador',
      despublicada: s.estado === 'Despublicada por la plataforma',
      noPublicada: s.estado !== 'Publicada',
      publicar: () => {
        this.setState({ estado: 'Publicada', aviso: 'Publicamos tu página.' });
        clearTimeout(this.t);
        this.t = setTimeout(() => this.setState({ aviso: '' }), 3000);
      },
      info: s.info,
      verInfo: () => this.setState({ info: true }),
      cerrarInfo: () => this.setState({ info: false }),"""
    actualizar = ("""
  componentDidUpdate() {
    if (this.props.estado !== this.state.clave) this.setState({ clave: this.props.estado, estado: this.props.estado || 'Publicada', info: false });
  }""" if clave == "Pagina-Org" else "")
    return f"""class Component extends DCLogic {{
  constructor(props) {{
    super(props);
    this.state = {{ nombre: 'Grupo Delta', guardado: 'Grupo Delta', aviso: ''{extra_estado} }};
  }}{actualizar}
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
      aviso: s.aviso,{extra_vals}
    }};
  }}
}}"""


PROPS = {
    "Configuracion": '"dominio":{"editor":"enum","options":["Verificado","Pendiente","Sin dominio"],"default":"Verificado","section":"Estado"},',
    "Pagina-Org": '"estado":{"editor":"enum","options":["Publicada","Borrador","Despublicada por la plataforma"],"default":"Publicada","section":"Estado"},',
}


def archivo(titulo, w, h, cuerpo, aviso_ok, clave=""):
    head = HEAD_BASE.replace("<title>Criterio · Botones</title>", f"<title>{titulo}</title>")
    tag = f"<script type=\"text/x-dc\" data-dc-script data-props='{{{PROPS.get(clave, '')}\"$preview\":{{\"width\":{w},\"height\":{h}}}}}'>\n{script(aviso_ok, clave)}\n</script>"
    return "\n".join([head, CSS, CSS_P, CSS_O, "</helmet>", "", cuerpo, "</x-dc>", "", tag, "</body>", "</html>", ""])


if __name__ == "__main__":
    ORIG = pathlib.Path(__file__).resolve().parent / "originales"
    for viejo in ("Configuracion", "Pagina-Org", "M-Configuracion"):
        destino = PROJ / f"{viejo}-Anterior.dc.html"
        if not destino.exists():
            shutil.copyfile(ORIG / f"{viejo}.dc.html", destino)
    for clave, (titulo, w, h, cuerpo, aviso) in TABLEROS.items():
        (PROJ / f"{clave}.dc.html").write_text(archivo(titulo, w, h, cuerpo, aviso, clave), encoding="utf-8")

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
