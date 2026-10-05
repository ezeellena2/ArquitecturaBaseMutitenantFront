"""Quien administra una empresa sin roles de la organización, y «Guardar cambios» en las ediciones (decisiones del usuario del
2026-10-05, que trajo la Guía: A en las tres; «el mismo criterio que en el resto del sistema»; y los textos de espera).
- Empresa (compu): la invitación de Sofía Herrera en Miembros, con su ⋮ («Reenviar invitación» y «Revocar invitación»). Tweak
  «quien»: «Administra solo la empresa» es Valentina Ruiz en Delta Norte S.A., sin Administración ni WhatsApp en el menú, sin pestañas
  (un solo grupo), sin «Editar empresa» ni ⋮ en la banda, con la invitación vencida de Martín Paz que le aparece en su Inicio y, al
  agregar un miembro, las personas de la organización con el correo tapado.
- Empresa y Empresas: «Guardar cambios» de «Editar empresa» apagado si no hay cambios; el de los roles de un miembro, también.
  El diálogo de roles sin bajada (Criterio · Diálogos).
- M-Empresa: la invitación de Sofía en Miembros; los estados «Invitación: acciones» (la hoja con Reenviar y Revocar) y
  «Administra solo la empresa»; «Editar empresa» con «Guardar cambios» apagado sin cambios.
- Criterio · Botones: los textos de espera de la app y «Quitando…», «Desvinculando…» y «Dando de baja…»; «Guardar cambios» apagado
  sin cambios en todas las ediciones.
Lleva `data-vuelta="1004-empresa-admin"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import clonar, rango_bloque, rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-empresa-admin"'
SVG = r"<svg(?:(?!</svg>).)*</svg>"
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


def svg(d, w=16):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


# El ícono de «Reenviar invitación», el mismo del ⋮ de Usuarios.
REENVIAR = re.search(r"(<svg(?:(?!</svg>).)*</svg>)\s*Reenviar invitación", (PROJ / "Usuarios.dc.html").read_text(encoding="utf-8"), re.S).group(1)


def guardar_sin_cambios(t):
    """«Guardar cambios» de «Editar empresa» apagado si nada cambió (Crear empresa, nunca)."""
    t = rep(t, "  valsDialogo(empresas, id) {\n    const s = this.state;\n\n    return {\n",
            "  valsDialogo(empresas, id) {\n    const s = this.state;\n    const orig = id ? empresas.find((x) => x.id === id) : null;\n"
            "    const sinCambios = !!orig && s.nombre.trim() === orig.n && s.cuit.replace(/\\D/g, '') === orig.cuit.replace(/\\D/g, '') && s.zona === orig.zona;\n\n"
            "    return {\n      noGuardarEmpresa: !!s.guardando || sinCambios,\n")
    return rep(t, 'onClick="{{guardarEmpresa}}" disabled="{{guardando}}"', 'onClick="{{guardarEmpresa}}" disabled="{{noGuardarEmpresa}}"')


# Empresas: solo «Guardar cambios» sin cambios.
t = tocar("Empresas")
if t:
    poner("Empresas", guardar_sin_cambios(t))

# Empresa (compu).
t = tocar("Empresa")
if t:
    t = guardar_sin_cambios(t)
    # El Tweak «quien».
    m = re.search(r"data-props='(\{[^']*\})'", t)
    props = json.loads(m.group(1))
    props = {"pestana": props["pestana"],
             "quien": {"editor": "enum", "options": ["Administra la organización", "Administra solo la empresa"], "default": "Administra la organización", "section": "Estado"},
             "$preview": props["$preview"]}
    t = t[:m.start(1)] + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + t[m.end(1):]
    # Los datos: la invitación de Sofía en Delta S.A. y Delta Norte S.A. como la ve Valentina.
    t = rep(t, "  { id: 'u8', email: 'marcos.gimenez@delta.ejemplo.com', nombre: 'Marcos Giménez', roles: [], estado: 'inactivo' },\n];\n",
            "  { id: 'u8', email: 'marcos.gimenez@delta.ejemplo.com', nombre: 'Marcos Giménez', roles: [], estado: 'inactivo' },\n"
            "  // Invitación pendiente con un rol en la empresa: la reenvía o la revoca quien administra la empresa (decisión del 05/10).\n"
            "  { id: 'u6', email: 'sofia.herrera@delta.ejemplo.com', nombre: 'Sofía Herrera', roles: ['Solo lectura'], estado: 'invitado', vence: '02/10/2026' },\n];\n"
            "// Delta Norte S.A. como la ve Valentina Ruiz, que la administra sin roles de la organización (Inicio-Miembro).\n"
            "const MIEMBROS_DN = [\n"
            "  { id: 'u7', email: 'valentina.ruiz@gmail.com', nombre: 'Valentina Ruiz', roles: ['Administrador'], estado: 'activo' },\n"
            "  { id: 'u5', email: 'paula.mendez@delta.ejemplo.com', nombre: 'Paula Méndez', roles: ['Solo lectura'], estado: 'activo' },\n"
            "  { id: 'u10', email: 'carolina.vega@delta.ejemplo.com', nombre: 'Carolina Vega', roles: ['Solo lectura'], estado: 'activo' },\n"
            "  { id: 'u9', email: 'martin.paz@delta.ejemplo.com', nombre: 'Martín Paz', roles: ['Solo lectura'], estado: 'vencida', vence: '29/09/2026' },\n];\n")
    t = rep(t, "  { id: 'u6', email: 'sofia.herrera@delta.ejemplo.com', nombre: 'Sofía Herrera', pendiente: true },\n", "")
    t = rep(t, "const PESTANAS = ",
            "const CANDIDATOS_DN = [\n"
            "  { id: 'u1', email: 'lucia.fernandez@delta.ejemplo.com', nombre: 'Lucía Fernández' },\n"
            "  { id: 'u2', email: 'tomas.acosta@delta.ejemplo.com', nombre: 'Tomás Acosta' },\n"
            "  { id: 'u3', email: 'julieta.sosa@delta.ejemplo.com', nombre: 'Julieta Sosa' },\n];\n"
            "// Sin roles de la organización no ve la lista de Usuarios: el correo va tapado.\n"
            "const tapar = (m) => m.slice(0, 2) + '•••@' + m.split('@')[1];\n"
            "const PESTANAS = ")
    t = rep(t, "empresa: EMPRESAS[0], miembros: MIEMBROS,", "...this.deQuien(props.quien),")
    t = rep(t, "  componentDidUpdate() {\n",
            "  deQuien(q) {\n    const solo = q === 'Administra solo la empresa';\n\n"
            "    return { claveQuien: q, solo, empresa: solo ? EMPRESAS[2] : EMPRESAS[0], miembros: solo ? MIEMBROS_DN : MIEMBROS };\n  }\n\n"
            "  componentDidUpdate() {\n    if (this.props.quien !== this.state.claveQuien) this.setState({ ...this.deQuien(this.props.quien), dialogo: null, abierto: null });\n")
    t = rep(t, "const candidatos = CANDIDATOS.filter(", "const candidatos = (s.solo ? CANDIDATOS_DN : CANDIDATOS).filter(")
    t = rep(t, "d: c.email + (c.pendiente ? ' · invitación pendiente' : '')", "d: (s.solo ? tapar(c.email) : c.email) + (c.pendiente ? ' · invitación pendiente' : '')")
    # El desplegable de «Agregar miembro» se llamaba «Usuario», igual que el menú de arriba: al abrirlo se abrían los dos.
    t = rep(t, "...this.uno('Usuario', 'usuario', candidatos", "...this.uno('Candidato', 'usuario', candidatos")
    # Quién mira: Lucía o Valentina.
    t = rep(t, "      nombre: e.n,\n",
            "      nombre: e.n,\n      claseSolo: s.solo ? 'solo-emp' : '', noSolo: !s.solo,\n"
            "      yoNombre: s.solo ? 'Valentina Ruiz' : 'Lucía Fernández', yoCorreo: s.solo ? 'valentina.ruiz@gmail.com' : 'lucia.fernandez@delta.ejemplo.com', yoInicial: s.solo ? 'V' : 'L',\n"
            "      yoRol: s.solo ? 'Administrador en Delta Norte S.A.' : 'Dueño',\n")
    cab, cuerpo = t.split("</helmet>", 1)
    k = cuerpo.index('<div class="pagina">')
    marco = cuerpo[:k]
    marco = rep(marco, '<div class="ab-root ab-app-shell {{admClase}} {{waClase}}"', '<div class="ab-root ab-app-shell {{admClase}} {{waClase}} {{claseSolo}}"')
    marco = re.sub(r'(<span class="avatar" aria-hidden="true"[^>]*>)L(</span>)', r"\g<1>{{yoInicial}}\g<2>", marco)
    assert marco.count("Lucía Fernández") >= 3
    marco = marco.replace("Lucía Fernández", "{{yoNombre}}").replace("lucia.fernandez@delta.ejemplo.com", "{{yoCorreo}}")
    marco = rep(marco, '<span class="n1">Grupo Delta</span><span class="n2">Dueño</span>', '<span class="n1">Grupo Delta</span><span class="n2">{{yoRol}}</span>')
    pagina = cuerpo[k:]
    i = pagina.index('<sc-if value="{{dlgAgregar}}"')
    j = pagina.index('<sc-if value="{{dlgRoles}}"', i)
    dlg = pagina[i:j]
    for clave in ["abierto", "alternar", "bloq", "claseVal", "err", "exp", "mal", "opciones", "texto"]:
        dlg = dlg.replace("{{" + clave + "Usuario}}", "{{" + clave + "Candidato}}")
    assert "Usuario}}" not in dlg
    pagina = pagina[:i] + dlg + pagina[j:]
    # Banda: sin ⋮ ni «Editar empresa» para quien solo administra la empresa.
    marco, n = re.subn(r'(<span class="envoltura">\s*<button type="button" class="mas" aria-label="Más acciones".*?Editar empresa</button>)',
                       r'<sc-if value="{{noSolo}}" hint-placeholder-val="{{si}}">\1</sc-if>', marco, count=1, flags=re.S)
    assert n == 1
    # Un solo grupo: sin la barra de pestañas.
    pagina, n = re.subn(r'(<div class="tabs2" role="tablist" aria-label="Secciones de la empresa">.*?</sc-for>\s*</div>)',
                        r'<sc-if value="{{noSolo}}" hint-placeholder-val="{{si}}">\1</sc-if>', pagina, count=1, flags=re.S)
    assert n == 1
    # La fila: el estado de una invitación con su vencimiento debajo de la palabra.
    pagina = rep(pagina, '<span><span class="pill {{m.pill}}">{{m.textoEstado}}</span></span>',
                 '<span class="dos"><span><span class="pill {{m.pill}}">{{m.textoEstado}}</span></span>'
                 '<sc-if value="{{m.invitado}}" hint-placeholder-val="{{no}}"><span class="n2 sang">Vence {{m.vence}}</span></sc-if></span>')
    # El ⋮ de una invitación: Reenviar y Revocar.
    pagina, n = re.subn(r'(<a class="menu-it" role="menuitem" href="Usuario\.dc\.html">' + SVG + r' Ver usuario</a>\s*<div class="menu-sep" role="separator"></div>)',
                        '<sc-if value="{{m.invitado}}" hint-placeholder-val="{{no}}"><button type="button" class="menu-it" role="menuitem" onClick="{{m.reenviar}}">'
                        + REENVIAR + r' Reenviar invitación</button></sc-if><sc-if value="{{m.noInvitado}}" hint-placeholder-val="{{si}}">\1</sc-if>',
                        pagina, count=1, flags=re.S)
    assert n == 1
    # Roles de un miembro: sin bajada y «Guardar cambios» apagado sin cambios.
    pagina = rep(pagina, '<h2 id="dlg-dlgRoles">Roles de {{miembroDialogo}}</h2><p>{{nombre}}</p>', '<h2 id="dlg-dlgRoles">Roles de {{miembroDialogo}}</h2>')
    pagina = rep(pagina, 'onClick="{{guardarRoles}}">Guardar cambios', 'onClick="{{guardarRoles}}" disabled="{{rolesSinCambios}}">Guardar cambios')
    t = cab + "</helmet>" + marco + pagina
    # La conducta de la fila.
    t = rep(t, "        const baja = m.estado === 'bajaPedida';\n",
            "        const baja = m.estado === 'bajaPedida';\n        const inv = m.estado === 'invitado' || m.estado === 'vencida';\n")
    t = rep(t, "pill: act ? 'ok' : baja ? 'alerta' : 'off',", "pill: act ? 'ok' : baja || m.estado === 'vencida' ? 'alerta' : inv ? 'pend' : 'off',")
    t = rep(t, "textoEstado: act ? 'Activo' : baja ? 'Baja pedida' : 'Inactivo',",
            "textoEstado: act ? 'Activo' : baja ? 'Baja pedida' : m.estado === 'invitado' ? 'Invitación pendiente' : m.estado === 'vencida' ? 'Invitación vencida' : 'Inactivo',\n"
            "          invitado: inv, noInvitado: !inv, vence: m.vence || '',\n"
            "          // POST /api/companies/{id}/invitations/{invitationId}/resend con company.members.manage (decisión del 05/10).\n"
            "          reenviar: () => {\n"
            "            this.setState({ abierto: null, miembros: s.miembros.map((x) => (x.id === m.id ? { ...x, estado: 'invitado', vence: '12/10/2026' } : x)) });\n"
            "            this.avisar('Reenviamos la invitación a ' + m.email + '.');\n          },")
    t = rep(t, "accion: act || baja ? 'Quitar de la empresa' : 'Volver a sumar',", "accion: inv ? 'Revocar invitación' : act || baja ? 'Quitar de la empresa' : 'Volver a sumar',")
    t = rep(t, "claseAccion: act || baja ? 'pel' : '',", "claseAccion: inv || act || baja ? 'pel' : '',")
    t = rep(t, "          cambiarEstado: () => {\n            if (!act && !baja) {",
            "          cambiarEstado: () => {\n            if (inv) {\n              this.pedirConfirmacion({\n"
            "                titulo: '¿Revocar la invitación a ' + m.email + '?',\n"
            "                texto: 'El enlace deja de funcionar. Podés volver a invitar a esta persona cuando quieras.',\n"
            "                boton: 'Revocar',\n                accion: () => {\n"
            "                  this.setState({ miembros: this.state.miembros.filter((x) => x.id !== m.id) });\n"
            "                  this.avisar('Revocamos la invitación a ' + m.email + '.');\n                },\n              });\n\n              return;\n            }\n\n"
            "            if (!act && !baja) {")
    t = rep(t, "      miembroDialogo: dlgM ? dlgM.nombre : '',\n",
            "      miembroDialogo: dlgM ? dlgM.nombre : '',\n      rolesSinCambios: !dlgM || [...s.borrador].sort().join('|') === [...dlgM.roles].sort().join('|'),\n")
    poner("Empresa", t, ".solo-emp li:has(> .wa-btn), .solo-emp .admin-grupo, .solo-emp .adm-panel { display: none !important; }\n"
          ".dos .n2.sang { padding-left: 13px; }\n")

# M-Empresa (teléfono).
t = tocar("M-Empresa")
if t:
    fila_martin = re.compile(r'<div class="w-conv"(?:(?!<div class="w-conv").)*?<b>Martín Paz</b>(?:(?!</button>).)*</button></div>', re.S)
    filas = fila_martin.findall(t)
    assert len(filas) == 3, len(filas)
    base = filas[0]

    def fila(inicial, nombre, correo, l3):
        f = base.replace('<span class="w-av">M</span>', f'<span class="w-av">{inicial}</span>').replace("Martín Paz", nombre)
        f = f.replace("martin.paz@delta.ejemplo.com", correo)
        return rep(f, 'Solo lectura · <span class="w-est ">Activo</span>', l3)

    sofia = fila("S", "Sofía Herrera", "sofia.herrera@delta.ejemplo.com", 'Solo lectura · <span class="w-est azul">Invitación pendiente</span> · vence 02/10')
    t = fila_martin.sub(lambda m: m.group(0) + sofia, t)
    t = rep(t, 'Miembros <span class="c">6</span>', 'Miembros <span class="c">7</span>', 4)
    # «Editar empresa»: «Guardar cambios» apagado sin cambios.
    i, j = rango_bloque(t, "e2")
    t = t[:i] + rep(t[i:j], '<button type="button" class="cb cb-pri">Guardar cambios</button>', '<button type="button" class="cb cb-pri apag">Guardar cambios</button>') + t[j:]
    # «Invitación: acciones».
    t = clonar(t, "e0", "e4", "Invitación: acciones", [])
    _, j = rango_bloque(t, "e4")
    hoja_acc = ('<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de Sofía Herrera"><span class="asa"></span>'
                '<div class="hc" style="padding-right: 20px;"><h2>Sofía Herrera</h2></div><div class="hb" style="padding-bottom: 34px;"><div class="ap-acciones">'
                '<span role="menuitem">Reenviar invitación</span><span class="sep" role="separator"></span><span class="pel" role="menuitem">Revocar invitación</span>'
                '</div></div></div>')
    t = t[:j - len("</sc-if>")] + hoja_acc + t[j - len("</sc-if>"):]
    # «Administra solo la empresa»: Valentina en Delta Norte S.A., sin pestañas ni ⋮, con el menú de abajo del miembro.
    nav_miembro = re.search(r'<nav class="ap-nav" aria-label="Secciones" style="grid-template-columns: repeat\(2, 1fr\);">.*?</nav>',
                            (PROJ / "M-Inicio-Miembro.dc.html").read_text(encoding="utf-8"), re.S).group(0)
    t = clonar(t, "e4", "e5", "Administra solo la empresa", [])
    i, j = rango_bloque(t, "e5")
    b = t[i:j]
    b = b[:b.index('<div class="ap-velo">')] + "</sc-if>"
    b = rep(b, '<a class="ap-ib" aria-label="Volver" href="M-Empresas.dc.html">', '<a class="ap-ib" aria-label="Volver" href="M-Inicio-Miembro.dc.html">')
    b = rep(b, "<h1>Delta S.A.</h1><span class=\"sub\">CUIT 30-71234567-1 · Buenos Aires (GMT−3)</span>", '<h1>Delta Norte S.A.</h1><span class="sub">Buenos Aires (GMT−3)</span>')
    b, n = re.subn(r'<button type="button" class="ap-ib" aria-label="Acciones de Delta S\.A\.">' + SVG + "</button>", "", b, flags=re.S)
    assert n == 1
    b, n = re.subn(r'<div class="ap-tabs" role="tablist">.*?</div>', "", b, count=1, flags=re.S)
    assert n == 1
    a, z = b.index('<div class="ap-cuerpo">'), b.index('<a class="ap-fab"')
    miembros_dn = (fila("V", "Valentina Ruiz", "valentina.ruiz@gmail.com", 'Administrador · <span class="w-est ">Activo</span>')
                   + fila("P", "Paula Méndez", "paula.mendez@delta.ejemplo.com", 'Solo lectura · <span class="w-est ">Activo</span>')
                   + fila("C", "Carolina Vega", "carolina.vega@delta.ejemplo.com", 'Solo lectura · <span class="w-est ">Activo</span>')
                   + fila("M", "Martín Paz", "martin.paz@delta.ejemplo.com", 'Solo lectura · <span class="w-est amb">Invitación vencida</span> · venció 29/09'))
    b = b[:a] + f'<div class="ap-cuerpo">{miembros_dn}</div>' + b[z:]
    b, n = re.subn(r'<nav class="ap-nav" aria-label="Secciones">.*?</nav>', lambda _: nav_miembro, b, count=1, flags=re.S)
    assert n == 1
    t = t[:i] + b + t[j:]
    poner("M-Empresa", t, ".ap-acciones { display: flex; flex-direction: column; margin: -8px -20px 0; }\n"
          ".ap-acciones span { display: flex; align-items: center; min-height: 54px; padding: 0 20px; font-size: 16.5px; border-top: 1px solid var(--borde); }\n"
          ".ap-acciones span:first-child { border-top: 0; }\n.ap-acciones .sep { min-height: 8px; padding: 0; background: var(--s2); }\n"
          ".ap-acciones .pel { color: var(--peligro); }\n")

# Criterio · Botones: los textos de espera y «Guardar cambios» sin cambios.
t = tocar("Criterio-Botones")
if t:
    t = rep(t, "<strong>Guardando</strong><p>Dice qué está haciendo y no se puede volver a tocar.</p>",
            "<strong>Guardando</strong><p>Dice qué está haciendo y no se puede volver a tocar: «Guardando…», «Enviando…», «Verificando…», "
            "«Aceptando…», «Comprobando…», «Creando…», «Invitando…», «Agregando…», «Quitando…», «Desvinculando…», «Dando de baja…».</p>")
    t = rep(t, "<strong>Deshabilitado</strong><p>Solo «Guardar cambios» cuando no hay cambios. Lo demás, siempre habilitado.</p>",
            "<strong>Deshabilitado</strong><p>Solo «Guardar cambios» cuando no hay cambios, en todas las ediciones, también en los diálogos. "
            "Lo demás, siempre habilitado: si falta un dato, al tocarlo se marca el campo.</p>")
    poner("Criterio-Botones", t)

escritos = 0
for nombre, t in textos.items():
    if t is None:
        continue
    assert t.count("</helmet>") == 1, nombre
    t = t.replace("</helmet>", f"<style {MARCA}>\n{''.join(css[nombre])}</style>\n</helmet>")
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    escritos += 1
print("tableros", escritos)
