"""Organización: los estados que la app tiene y el lienzo no dibujaba (relevamiento E1-E6, N3; tanda aprobada por el usuario el
2026-10-04). Se copian de la app con las piezas del criterio: en el teléfono, hojas desde abajo (no a pantalla completa, como la
app hoy), la franja roja debajo de la barra y «Cambios sin guardar» en ámbar en el subtítulo; en la compu, la franja `.aviso-mal`.
- Usuario: «Sumar empresa» con el 409 («Otra persona cambió esto. Revisá la versión más reciente antes de guardar.»), Tweak «diálogo».
- M-Usuario: la hoja «Roles en Delta S.A.» y «Error al guardar» (franja debajo de la barra).
- M-Usuario-Empresa: el mismo 409 de la compu, en la hoja.
- Empresas: «Crear empresa» con «Ya hay una empresa con esa identificación fiscal.», Tweak «diálogo».
- M-Empresas: la hoja «Crear empresa» y la misma con ese error.
- M-Empresa: la pestaña Roles, la hoja «Editar empresa» y la hoja de roles de un miembro con «Tiene que quedar al menos una persona
  administradora activa en la empresa.».
- M-Configuracion: «Dominio pendiente» (con «Verificar») y «Cambios sin guardar».
- M-Pagina-Org: «Borrador», «Despublicada por la plataforma» (con la hoja «Página despublicada»), «Cambios sin guardar» y «Error al
  guardar» («La página cambió desde que la abriste. Actualizala antes de guardar.»).
- Pagina-Org: «Publicada: error al guardar», con la franja arriba del contenido.
Lleva `data-vuelta="1004-estados-org"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import (ALERTA, CSS_TEL, campo, clonar, con_estados_pantalla, franja_hoja, hoja, marcar, nombre_de, rango_bloque,  # noqa: E402
                          rep, sumar_opcion)

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-estados-org"'
TODOS = '<label class="ap-todos"><span class="ap-chk"></span>Todos</label>'
CSS_PC = (".aviso-mal { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; background: var(--peligro-t); "
          "color: oklch(0.45 0.17 25); font-size: 13px; grid-column: 1 / -1; }\n.aviso-mal svg { flex-shrink: 0; margin-top: 1px; }\n")
CSS_MOT = (".t-mot { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; background: var(--peligro-t); color: oklch(0.45 0.17 25); }\n"
           ".t-mot svg { flex-shrink: 0; margin-top: 3px; }\n.t-mot b { display: block; font-size: 15px; font-weight: 600; }\n.t-mot span { font-size: 13.5px; }\n"
           ".t-sub { font-size: 13.5px; font-weight: 600; color: var(--t2); }\n.t-pasos { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }\n"
           ".t-pasos li { display: flex; align-items: center; gap: 10px; font-size: 15px; }\n"
           ".t-pasos .n { width: 24px; height: 24px; border-radius: 50%; background: var(--s2); color: var(--t2); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }\n"
           ".ap-sw.apag { opacity: 0.5; }\n")


def leer(nombre):
    ruta = PROJ / f"{nombre}.dc.html"
    t = ruta.read_text(encoding="utf-8")
    return ruta, (None if MARCA in t else t)


def botones(sec, pri, pri_apagado=False):
    a = " apag" if pri_apagado else ""
    return f'<button type="button" class="cb cb-sec">{sec}</button><button type="button" class="cb cb-pri{a}">{pri}</button>'


def bloque_nuevo(t, var_prev, var, nombre, html):
    """Suma un estado nuevo (no clonado) después del bloque `var_prev`."""
    _, j = rango_bloque(t, var_prev)
    t = t[:j] + f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{no}}}}">{html}</sc-if>' + t[j:]
    base = nombre_de(t, var_prev)
    t = sumar_opcion(t, base, nombre)
    linea = f'      {var_prev}: e === "{base}",\n'
    return rep(t, linea, linea + f'      {var}: e === "{nombre}",\n')


def fin_div(t, i):
    prof = 0
    for m in re.finditer(r"<div\b|</div>", t[i:]):
        prof += 1 if m.group(0).startswith("<div") else -1
        if prof == 0:
            return i + m.end()
    raise AssertionError("div sin cerrar")


def tweak_dialogo(t, opciones, ancho=1440, alto=900):
    props = json.dumps({"dialogo": {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"},
                        "$preview": {"width": ancho, "height": alto}}, ensure_ascii=False, separators=(",", ":"))
    return rep(t, "data-props='{\"$preview\":{\"width\":%d,\"height\":%d}}'" % (ancho, alto), f"data-props='{props}'")


# ── Usuario (compu): el 409 de «Sumar empresa».
ruta, t = leer("Usuario")
if t:
    opciones = ["Sin diálogo", "Sumar empresa: otra persona cambió esto"]
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    props = {"dialogo": {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"}, **props}
    t = t[:m.start(1)] + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + t[m.end(1):]
    t = rep(t, "...this.inicial(props.usuario) };\n",
            "...this.inicial(props.usuario) };\n"
            "    // Tweak «diálogo»: «Sumar empresa» abierto con el 409 de la app (otra persona guardó antes).\n"
            "    if (props.dialogo === 'Sumar empresa: otra persona cambió esto') Object.assign(this.state, { dlgEmp: { modo: 'sumar' }, dlgEmpresa: 'c2', dlgRoles: [], err409Emp: true });\n")
    t = rep(t, "cerrarDlgEmp: () => this.setState({ dlgEmp: null, abierto: null, errDlgEmp: false })",
            "cerrarDlgEmp: () => this.setState({ dlgEmp: null, abierto: null, errDlgEmp: false, err409Emp: false })")
    t = rep(t, "      noAceptaDlgEmp: false,", "      noAceptaDlgEmp: false,\n      err409Emp: !!s.err409Emp,")
    pie = '<div class="df"><button type="button" class="cb cb-sec" onClick="{{cerrarDlgEmp}}">Cancelar</button>'
    i = t.index(pie)
    k = t.rindex("</div>", 0, i)  # cierra .db
    t = (t[:k] + '<sc-if value="{{err409Emp}}" hint-placeholder-val="{{no}}"><div class="aviso-mal" role="alert">' + ALERTA
         + "<span>Otra persona cambió esto. Revisá la versión más reciente antes de guardar.</span></div></sc-if>" + t[k:])
    ruta.write_text(marcar(t, MARCA, CSS_PC), encoding="utf-8"); print("ok Usuario")

# ── M-Usuario: la hoja de roles de una empresa y el error al guardar.
ruta, t = leer("M-Usuario")
if t:
    t = bloque_nuevo(t, "e2", "e3", "Roles en una empresa",
                     hoja("Roles en Delta S.A.", campo("Roles en la empresa", "Solo lectura", select=True, extra=TODOS), botones("Cancelar", "Guardar")))
    t = sumar_opcion(t, "Roles en una empresa", "Error al guardar")
    t = rep(t, '      e3: e === "Roles en una empresa",\n', '      e3: e === "Roles en una empresa",\n      conErr: e === "Error al guardar",\n'
            '      noErr: e !== "Error al guardar",\n      claseGuardar: e === "Error al guardar" ? "" : "apag",\n')
    t = rep(t, '<span class="sub">tomas.acosta@delta.ejemplo.com</span>',
            '<sc-if value="{{noErr}}" hint-placeholder-val="{{si}}"><span class="sub">tomas.acosta@delta.ejemplo.com</span></sc-if>'
            '<sc-if value="{{conErr}}" hint-placeholder-val="{{no}}"><span class="sub amb"><span>Cambios sin guardar</span></span></sc-if>')
    t = rep(t, '<div class="ap-cuerpo ap-gris">', '<sc-if value="{{conErr}}" hint-placeholder-val="{{no}}"><div class="f-banda mal" role="alert">' + ALERTA
            + '<span class="tx">Algo salió mal. Probá de nuevo en un rato.</span></div></sc-if><div class="ap-cuerpo ap-gris">')
    t = rep(t, '<button type="button" class="cb cb-pri full apag">Guardar cambios</button>', '<button type="button" class="cb cb-pri full {{claseGuardar}}">Guardar cambios</button>')
    ruta.write_text(marcar(t, MARCA, CSS_TEL), encoding="utf-8"); print("ok M-Usuario")

# ── M-Usuario-Empresa: el 409 en la hoja.
ruta, t = leer("M-Usuario-Empresa")
if t:
    t = con_estados_pantalla(t, "Sumar empresa")
    t = clonar(t, "e0", "e1", "Otra persona cambió esto",
               [("</div><div class=\"hp\">", franja_hoja("Otra persona cambió esto. Revisá la versión más reciente antes de guardar.") + "</div><div class=\"hp\">")])
    ruta.write_text(marcar(t, MARCA, CSS_TEL), encoding="utf-8"); print("ok M-Usuario-Empresa")

# ── Empresas (compu): «Crear empresa» con el CUIT repetido.
ruta, t = leer("Empresas")
if t:
    t = tweak_dialogo(t, ["Sin diálogo", "Crear empresa: ya hay una con ese CUIT"])
    t = rep(t, "errNombre: '', errCuit: '', guardando: false };\n",
            "errNombre: '', errCuit: '', guardando: false };\n"
            "    // Tweak «diálogo»: «Crear empresa» con el error que devuelve el back (otra empresa de la organización ya tiene ese CUIT).\n"
            "    if (props.dialogo === 'Crear empresa: ya hay una con ese CUIT') Object.assign(this.state, { dialogo: 'nueva', nombre: 'Delta Oeste S.A.', cuit: '30-71234567-1', errServidor: 'Ya hay una empresa con esa identificación fiscal.' });\n")
    t = rep(t, "cerrarDialogo: () => this.setState({ dialogo: null, guardando: false, abierto: null })",
            "cerrarDialogo: () => this.setState({ dialogo: null, guardando: false, abierto: null, errServidor: '' })")
    t = rep(t, "\n  dlgEmpresa: s.dialogo !== null,", "\n  dlgEmpresa: s.dialogo !== null,\n  errServidor: s.errServidor || '',")
    pie = '\n        <div class="dlg-f">\n          <button type="button" class="b b-sec" onClick="{{cerrarDialogo}}">Cancelar</button>\n          <button type="button" class="b b-pri" onClick="{{guardarEmpresa}}"'
    i = t.index(pie)
    k = t.rindex("</div>", 0, i)  # cierra .dlg-b
    t = (t[:k] + '<sc-if value="{{errServidor}}" hint-placeholder-val="{{no}}"><div class="aviso-mal" role="alert">' + ALERTA
         + "<span>{{errServidor}}</span></div></sc-if>" + t[k:])
    ruta.write_text(marcar(t, MARCA, CSS_PC), encoding="utf-8"); print("ok Empresas")

# ── M-Empresas: crear empresa.
ruta, t = leer("M-Empresas")
if t:
    t = con_estados_pantalla(t, "Lista")
    zona = campo("Zona de negocio", "La de la organización", select=True)
    crear = hoja("Crear empresa", campo("Nombre", "", req=True) + campo("CUIT", "30-12345678-1", vacio=True) + zona, botones("Cancelar", "Crear empresa"))
    t = clonar(t, "e0", "e1", "Crear empresa", [("</nav>", "</nav>" + crear)])
    error = hoja("Crear empresa", campo("Nombre", "Delta Oeste S.A.", req=True) + campo("CUIT", "30-71234567-1") + zona
                 + franja_hoja("Ya hay una empresa con esa identificación fiscal."), botones("Cancelar", "Crear empresa"))
    t = clonar(t, "e0", "e2", "Crear empresa: ya hay una con ese CUIT", [("</nav>", "</nav>" + error)])
    ruta.write_text(marcar(t, MARCA, CSS_TEL), encoding="utf-8"); print("ok M-Empresas")

# ── M-Empresa: pestaña Roles, editar y roles de un miembro con error.
ruta, t = leer("M-Empresa")
if t:
    t = con_estados_pantalla(t, "Miembros")
    i, j = rango_bloque(t, "e0")
    b = t[i:j]
    a = b.index('<div class="ap-cuerpo">')
    cuerpo_viejo = b[a:fin_div(b, a)]
    kebab = re.search(r'<button type="button" class="ap-ib" aria-label="Acciones de Lucía Fernández">(<svg.*?</svg>)</button>', b, re.S).group(1)
    fila = (f'<div class="ap-fila"><a class="tx" href="M-Rol.dc.html" style="color: inherit; text-decoration: none;"><span class="l1">Solo lectura<span>4 usuarios</span></span>'
            f'<span class="l2">1 permiso</span></a><button type="button" class="ap-ib" aria-label="Acciones de Solo lectura">{kebab}</button></div>')
    t = clonar(t, "e0", "e1", "Roles",
               [('<span class="on" role="tab">Miembros <span class="c">6</span></span><span role="tab">Roles <span class="c">1</span></span>',
                 '<span role="tab">Miembros <span class="c">6</span></span><span class="on" role="tab">Roles <span class="c">1</span></span>'),
                (cuerpo_viejo, f'<div class="ap-cuerpo">{fila}</div>'), ('class="ap-fab" aria-label="Agregar miembro"', 'class="ap-fab" aria-label="Crear rol"')])
    editar = hoja("Editar empresa", campo("Nombre", "Delta S.A.", req=True) + campo("CUIT", "30-71234567-1") + campo("Zona de negocio", "Buenos Aires (GMT−3)", select=True),
                  botones("Cancelar", "Guardar cambios", pri_apagado=True))
    t = clonar(t, "e1", "e2", "Editar empresa", [("</nav>", "</nav>" + editar),
                                                ('<span role="tab">Miembros <span class="c">6</span></span><span class="on" role="tab">Roles <span class="c">1</span></span>',
                                                 '<span class="on" role="tab">Miembros <span class="c">6</span></span><span role="tab">Roles <span class="c">1</span></span>'),
                                                (f'<div class="ap-cuerpo">{fila}</div>', cuerpo_viejo), ('class="ap-fab" aria-label="Crear rol"', 'class="ap-fab" aria-label="Agregar miembro"')])
    roles = hoja("Roles de Lucía Fernández", campo("Roles en la empresa", "Elegí uno o más roles", select=True, vacio=True, extra=TODOS)
                 + franja_hoja("Tiene que quedar al menos una persona administradora activa en la empresa."), botones("Cancelar", "Guardar cambios"), sub="Delta S.A.")
    t = clonar(t, "e0", "e3", "Roles de un miembro: error", [("</nav>", "</nav>" + roles)])
    ruta.write_text(marcar(t, MARCA, CSS_TEL), encoding="utf-8"); print("ok M-Empresa")

# ── M-Configuracion: dominio pendiente y cambios sin guardar.
FIJO = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>'
ruta, t = leer("M-Configuracion")
if t:
    t = con_estados_pantalla(t, "Dominio verificado")
    t = clonar(t, "e0", "e1", "Dominio pendiente",
               [('<span><span class="w-est ">Verificado</span> · 10 correos administrados por Grupo Delta</span></span>',
                 '<span><span class="w-est amb">Pendiente</span></span></span><a class="acc-t" href="M-Configuracion-Verificar.dc.html">Verificar</a>')])
    t = clonar(t, "e1", "e2", "Cambios sin guardar",
               [('<span><span class="w-est amb">Pendiente</span></span></span><a class="acc-t" href="M-Configuracion-Verificar.dc.html">Verificar</a>',
                 '<span><span class="w-est ">Verificado</span> · 10 correos administrados por Grupo Delta</span></span>'),
                ('<span class="sub">Administración</span>', '<span class="sub amb"><span>Cambios sin guardar</span></span>'),
                ('<div class="ct">Grupo Delta</div>', '<div class="ct">Grupo Delta Sur</div>'), (FIJO, FIJO.replace(" apag", ""))])
    ruta.write_text(marcar(t, MARCA, CSS_TEL), encoding="utf-8"); print("ok M-Configuracion")

# ── M-Pagina-Org: borrador, despublicada, cambios sin guardar y error al guardar.
ruta, t = leer("M-Pagina-Org")
if t:
    t = con_estados_pantalla(t, "Publicada")
    sub = '<span class="sub"><span class="w-est ">Publicada</span></span>'
    sw = '<span class="ap-sw" role="switch" aria-checked="true"></span>'
    ver = '<button type="button" class="ap-txt">Ver página</button>'
    t = clonar(t, "e0", "e1", "Borrador", [(sub, '<span class="sub"><span class="w-est off">Borrador</span></span>'), (ver, '<button type="button" class="ap-txt">Vista previa</button>'),
                                          (sw, '<span class="ap-sw off" role="switch" aria-checked="false"></span>')])
    motivo = (f'<div class="t-mot">{ALERTA}<div><b>Datos de contacto falsos</b><span>Despublicada por la plataforma el 26/09/2026</span></div></div>'
              '<span class="t-sub">Qué podés hacer</span><ol class="t-pasos"><li><span class="n">1</span>Corregí los datos de la página</li>'
              '<li><span class="n">2</span>Pedí a la plataforma que la habilite</li></ol>')
    desp = hoja("Página despublicada", motivo, '<button type="button" class="cb cb-pri">Entendido</button>')
    t = clonar(t, "e0", "e2", "Despublicada por la plataforma",
               [(sub, '<span class="sub"><span class="w-est mal">Despublicada por la plataforma</span></span>'), (ver, '<button type="button" class="ap-txt">Vista previa</button>'),
                (sw, '<span class="ap-sw off apag" role="switch" aria-checked="false" aria-disabled="true"></span>'), (FIJO, FIJO + desp)])
    sucio = [(sub, '<span class="sub"><span class="w-est ">Publicada</span> · <span class="amb-t">Cambios sin guardar</span></span>'),
             ('<div class="ct">Grupo Delta</div>', '<div class="ct">Grupo Delta Sur</div>'), (FIJO, FIJO.replace(" apag", ""))]
    t = clonar(t, "e0", "e3", "Cambios sin guardar", sucio)
    t = clonar(t, "e0", "e4", "Error al guardar", sucio + [('<div class="ap-cuerpo ap-gris">', '<div class="f-banda mal" role="alert">' + ALERTA
                                                            + '<span class="tx">La página cambió desde que la abriste. Actualizala antes de guardar.</span></div><div class="ap-cuerpo ap-gris">')])
    ruta.write_text(marcar(t, MARCA, CSS_TEL + CSS_MOT), encoding="utf-8"); print("ok M-Pagina-Org")

# ── Pagina-Org (compu): error al guardar.
ruta, t = leer("Pagina-Org")
if t:
    t = rep(t, '"options":["Publicada","Borrador","Despublicada por la plataforma"]', '"options":["Publicada","Publicada: error al guardar","Borrador","Despublicada por la plataforma"]')
    t = rep(t, "this.state = { nombre: 'Grupo Delta', guardado: 'Grupo Delta', aviso: '', estado: props.estado || 'Publicada', clave: props.estado, info: false };",
            "this.state = { ...this.desde(props.estado), aviso: '', clave: props.estado, info: false };")
    t = rep(t, "this.setState({ clave: this.props.estado, estado: this.props.estado || 'Publicada', info: false });",
            "this.setState({ clave: this.props.estado, ...this.desde(this.props.estado), info: false });")
    t = rep(t, "  componentDidUpdate() {",
            "  // «Publicada: error al guardar»: el 409 de la app al guardar una página que otra persona cambió (con el nombre ya tocado).\n"
            "  desde(e) {\n    const error = e === 'Publicada: error al guardar';\n"
            "    return { nombre: error ? 'Grupo Delta Sur' : 'Grupo Delta', guardado: 'Grupo Delta', estado: error ? 'Publicada' : (e || 'Publicada'), errGuardar: error };\n  }\n\n"
            "  componentDidUpdate() {")
    t = rep(t, "descartar: () => this.setState({ nombre: s.guardado }),", "descartar: () => this.setState({ nombre: s.guardado, errGuardar: false }),")
    t = rep(t, "      aviso: s.aviso,", "      aviso: s.aviso,\n      errGuardar: !!s.errGuardar,")
    t = rep(t, '<div class="w-body">', '<div class="w-body"><sc-if value="{{errGuardar}}" hint-placeholder-val="{{no}}"><div class="aviso-mal" role="alert">' + ALERTA
            + "<span>La página cambió desde que la abriste. Actualizala antes de guardar.</span></div></sc-if>")
    ruta.write_text(marcar(t, MARCA, CSS_PC), encoding="utf-8"); print("ok Pagina-Org")
