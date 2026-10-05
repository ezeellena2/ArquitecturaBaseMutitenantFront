"""Lo que les faltaba a los tableros de Plataforma para programar la E5 (el usuario lo pidió el 2026-10-05; detalle en el plan del back
`docs/plans/2026-10-05-etapa-5-pantallas.md`, «Para decidir» 1, 2, 6, 7 y 8 y §12):
- Cuenta-Plat y M-Cuenta-Plat: la variante de un operador (Tweak «cuenta»): la pestaña «Permisos» con las nueve claves y su
  explicación, «Cambiar permisos» (el desplegable de «Invitar operador» y el motivo), «Quitar operador» en el ⋮ (con motivo y el 409
  `Platform.Operator.LastManager` en la franja) y la ficha de una invitación de operador, pendiente o vencida, con «Reenviar
  invitación» y «Revocar invitación».
- Organizacion y M-Organizacion: «Falló el alta» con «Reintentar el alta», y Dueños sin Dueño todavía (la invitación) o con el Dueño
  suspendido.
- Legales y M-Legales: una versión publicada que todavía no rige.
- Recuperar y M-Recuperar: sin WhatsApp (Tweak «whatsapp»), con «Decinos un correo nuevo donde podamos escribirte.».
- Los tonos de los M-* como los de la compu (§12): «Espera aprobación» y «Pendiente» en petróleo, «Suspendida» en ámbar y
  «Necesita recuperación» en rojo.
- «Mi cuenta» en tu menú de la compu, arriba de «Salir», en los tableros de Plataforma.
Lleva `data-vuelta="1004-plataforma-v111"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import CSS_TEL, campo, clonar, con_estados_pantalla, hoja, rango_bloque, rep, sumar_opcion  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-plataforma-v111"'
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


def con_prop(t, nombre, opciones, defecto):
    """Suma un Tweak `nombre` al data-props del tablero."""
    m = re.search(r"data-props='(\{[^']*\})'", t)
    props = json.loads(m.group(1))
    previo = props.pop("$preview")
    props[nombre] = {"editor": "enum", "options": opciones, "default": defecto, "section": "Estado"}
    props["$preview"] = previo
    return t[:m.start(1)] + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + t[m.end(1):]


def en_render(t, lineas):
    """Suma `lineas` al principio del objeto que devuelve renderVals."""
    i = t.index("  renderVals() {")
    j = t.index("\n    return {\n", i) + len("\n    return {\n")
    return t[:j] + lineas + t[j:]


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2")
X16 = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>')
CHEV = svg('<path d="m7 10 5 5 5-5"/>')
REENVIAR = re.search(r"(<svg(?:(?!</svg>).)*</svg>)\s*Reenviar invitación", (PROJ / "Usuarios.dc.html").read_text(encoding="utf-8"), re.S).group(1)
MI_CUENTA = re.search(r'<a class="menu-it" role="menuitem" href="Cuenta\.dc\.html"><svg(?:(?!</svg>).)*</svg> Mi cuenta</a>',
                      (PROJ / "Usuarios.dc.html").read_text(encoding="utf-8"), re.S).group(0)

# El catálogo de «Invitar operador» (Cuentas).
PERMISOS = [(m.group(1), m.group(2)) for m in re.finditer(r"\{ v: 'platform\.[a-z.]+', n: '([^']+)', d: '([^']+)' \}", (PROJ / "Cuentas.dc.html").read_text(encoding="utf-8"))]
assert len(PERMISOS) == 9, len(PERMISOS)
LAURA = {"Ver organizaciones", "Recuperaciones"}
LAURA_NUEVOS = LAURA | {"Ver la auditoría"}
JULIETA = {"Ver organizaciones", "Ver cuentas", "Ver la auditoría"}
CORREO_INV = "julieta.molina@arquitecturabase.ejemplo.com"
LAST_MANAGER = "Tiene que quedar al menos un operador activo que pueda administrar operadores."


def filas_pc(tiene):
    return "".join(f'<div class="o-fila"><span class="dos"><span class="c1">{n}</span><span class="n2">{d}</span></span>'
                   f'<span class="o-perm {"si" if n in tiene else "no"}">{TILDE if n in tiene else "—"}</span></div>' for n, d in PERMISOS)


def filas_tel(tiene):
    return "".join(f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">{n}</span><span class="ap-perm {"si" if n in tiene else "no"}">'
                   f'{TILDE if n in tiene else "—"}</span></span><span class="l2">{d}</span></div></div>' for n, d in PERMISOS)


# 1. Cuenta-Plat (compu).
OPC_CUENTA = ["Persona", "Operador", "Operador: acciones", "Operador: cambiar permisos", "Operador: quitar operador",
              "Invitación de operador pendiente", "Invitación de operador vencida"]
t = tocar("Cuenta-Plat")
if t:
    t = con_prop(t, "cuenta", OPC_CUENTA, "Persona")
    t = en_render(t, "      esPersona: (this.props.cuenta || 'Persona') === 'Persona',\n"
                     "      esOperador: (this.props.cuenta || 'Persona') !== 'Persona',\n"
                     "      opActivo: (this.props.cuenta || '').startsWith('Operador'),\n"
                     "      opInv: (this.props.cuenta || '').startsWith('Invitación'),\n"
                     "      opPendiente: this.props.cuenta === 'Invitación de operador pendiente',\n"
                     "      opVencida: this.props.cuenta === 'Invitación de operador vencida',\n"
                     "      opMenu: this.props.cuenta === 'Operador: acciones',\n"
                     "      dlgPermisos: this.props.cuenta === 'Operador: cambiar permisos',\n"
                     "      dlgQuitar: this.props.cuenta === 'Operador: quitar operador',\n"
                     f"      migaNombre: (this.props.cuenta || 'Persona') === 'Persona' ? c.n : (this.props.cuenta.startsWith('Invitación') ? '{CORREO_INV}' : 'Laura Díaz'),\n")
    t = rep(t, 'aria-current="page">{{nombre}}</li>', 'aria-current="page">{{migaNombre}}</li>')
    atras = re.search(r'<a class="atras" href="Cuentas\.dc\.html" aria-label="Volver a Cuentas">' + SVG + "</a>", t, re.S).group(0)
    kebab = re.search(r'<button type="button" class="mas" aria-label="Más acciones"[^>]*>(' + SVG + ")</button>", t, re.S).group(1)
    i = t.index('<main class="ab-app-shell__main">')
    j = t.index("</main>", i) + len("</main>")

    def si(var, html, d="no"):
        return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{{d}}}}}">{html}</sc-if>'

    banda = ('<div class="banda-pag"><div class="izq">' + atras + '<div style="min-width: 0;">'
             + si("opActivo", '<div class="tit"><h1>Laura Díaz</h1></div><p class="res"><span class="pill ok">Activa</span><span>Operador · 2 permisos · último ingreso hace 5 días</span></p>')
             + si("opPendiente", f'<div class="tit"><h1>{CORREO_INV}</h1></div><p class="res"><span class="pill pend">Invitación pendiente</span><span>Operador · Último ingreso: nunca · vence el 04/10/2026</span></p>')
             + si("opVencida", f'<div class="tit"><h1>{CORREO_INV}</h1></div><p class="res"><span class="pill alerta">Invitación vencida</span><span>Operador · Último ingreso: nunca · venció el 04/10/2026</span></p>')
             + '</div></div><div class="acciones">'
             + si("opActivo", '<span class="envoltura"><button type="button" class="mas" aria-label="Más acciones" aria-haspopup="menu" aria-expanded="{{opMenu}}">' + kebab + "</button>"
                  + si("opMenu", f'<div class="menu der" role="menu"><button type="button" class="menu-it pel" role="menuitem">{X16} Quitar operador</button></div>') + "</span>"
                  + '<button type="button" class="b b-sec">Cambiar permisos</button>')
             + si("opInv", '<span class="envoltura"><button type="button" class="mas" aria-label="Más acciones" aria-haspopup="menu">' + kebab + "</button></span>"
                  + '<button type="button" class="b b-sec">Reenviar invitación</button>')
             + "</div></div>")
    pagina = ('<div class="pagina"><div style="display: flex; flex-direction: column;"><div class="tabs2" role="tablist" aria-label="Secciones de la cuenta">'
              + si("opActivo", '<button type="button" role="tab" class="tab2" aria-selected="true">Permisos<span class="cnt">2</span></button>'
                   '<button type="button" role="tab" class="tab2" aria-selected="false">Historial de seguridad<span class="cnt">3</span></button>')
              + si("opInv", '<button type="button" role="tab" class="tab2" aria-selected="true">Permisos<span class="cnt">3</span></button>')
              + '</div><div class="tarjeta" role="tabpanel" aria-label="Permisos" style="margin-top: 16px;">'
              + si("opActivo", filas_pc(LAURA)) + si("opInv", filas_pc(JULIETA)) + "</div></div></div>")
    operador = si("esOperador", '<main class="ab-app-shell__main">' + banda + pagina + "</main>")
    t = t[:i] + si("esPersona", t[i:j], "si") + operador + t[j:]
    # Los diálogos del operador, con las piezas de Cuentas.
    opciones = "".join(f'<label class="op2"><input type="checkbox"{" checked" if n in LAURA_NUEVOS else ""}><span><span class="opn">{n}</span><span class="opd">{d}</span></span></label>'
                       for n, d in PERMISOS)
    dlg_permisos = si("dlgPermisos", '<div class="velo"><div class="dlg" role="dialog" aria-modal="true" aria-label="Cambiar permisos de Laura Díaz">'
                      f'<div class="dlg-h"><div><h2>Cambiar permisos de Laura Díaz</h2></div><button type="button" class="dlg-x" aria-label="Cerrar">{X16}</button></div>'
                      '<div class="dlg-b una"><div class="campo2 envoltura ancho"><span class="et">Permisos de plataforma</span>'
                      f'<button type="button" class="in2" aria-haspopup="listbox" aria-expanded="true"><span class="val">Ver organizaciones, Recuperaciones y Ver la auditoría</span>{CHEV}</button>'
                      f'<div class="menu lista" role="listbox" aria-multiselectable="true" style="top: 60px;">{opciones}</div></div>'
                      '<div class="campo2 ancho"><label class="et">Motivo<span class="req" aria-hidden="true">*</span></label><textarea class="in2"></textarea></div></div>'
                      '<div class="dlg-f"><button type="button" class="b b-sec">Cancelar</button><button type="button" class="b b-pri">Guardar cambios</button></div></div></div>')
    alerta = re.search(r'<div class="aviso-linea mal" role="alert">(' + SVG + ")", (PROJ / "Cuentas.dc.html").read_text(encoding="utf-8"), re.S).group(1)
    dlg_quitar = si("dlgQuitar", '<div class="velo"><div class="dlg chico" role="alertdialog" aria-modal="true" aria-label="¿Quitar a Laura Díaz como operador?">'
                    '<div class="dlg-h"><h2>¿Quitar a Laura Díaz como operador?</h2></div><div class="dlg-t">Deja de entrar a la plataforma.</div>'
                    f'<div class="dlg-b una" style="padding-top: 0;"><div class="aviso-linea mal" role="alert">{alerta}<span>{LAST_MANAGER}</span></div></div>'
                    '<div class="dlg-b una" style="padding-top: 0;"><div class="campo2"><label class="et">Motivo<span class="req" aria-hidden="true">*</span></label>'
                    '<textarea class="in2">Dejó el equipo de soporte.</textarea></div></div>'
                    '<div class="dlg-f"><button type="button" class="b b-sec">Cancelar</button><button type="button" class="b b-pel">Quitar</button></div></div></div>')
    k = t.index('<sc-if value="{{confirmacion}}"')
    t = t[:k] + dlg_permisos + dlg_quitar + t[k:]
    poner("Cuenta-Plat", t, ".o-perm { display: inline-flex; justify-content: flex-end; min-width: 28px; font-size: 13px; }\n.o-perm.si { color: var(--marca); }\n"
          ".o-perm.no { color: var(--t3); }\n.o-fila .o-perm { margin-left: auto; }\n")

# 1. M-Cuenta-Plat (teléfono).
t = tocar("M-Cuenta-Plat")
if t:
    t = con_estados_pantalla(t, "Persona")
    tabs_persona = re.search(r'<div class="ap-tabs desliza" role="tablist">.*?</div>', t, re.S).group(0)
    i0, j0 = rango_bloque(t, "e0")
    b0 = t[i0:j0]
    a, z = b0.index('<div class="ap-cuerpo">'), b0.index('<nav class="ap-nav"')
    cuerpo_persona = b0[a:z]
    t = clonar(t, "e0", "e1", "Operador", [
        ("<h1>Lucía Fernández</h1><span class=\"sub\">Activa · último ingreso hace 55 minutos</span>",
         '<h1>Laura Díaz</h1><span class="sub"><span class="w-est ">Activa</span> · operador · 2 permisos</span>'),
        ('aria-label="Acciones de Lucía Fernández"', 'aria-label="Acciones de Laura Díaz"'),
        (tabs_persona, '<div class="ap-tabs" role="tablist"><span class="on" role="tab">Permisos <span class="c">2</span></span><span role="tab">Historial de seguridad <span class="c">3</span></span></div>'),
        (cuerpo_persona, f'<div class="ap-cuerpo">{filas_tel(LAURA)}</div>'),
    ])

    def con_hoja(t, base, var, nombre, html):
        """Clona `base` sin la hoja que tuviera y le suma `html` al final."""
        t = clonar(t, base, var, nombre, [])
        i, j = rango_bloque(t, var)
        b = t[i:j]
        if '<div class="ap-velo">' in b:
            b = b[:b.index('<div class="ap-velo">')] + "</sc-if>"
        b = b[:-len("</sc-if>")] + html + "</sc-if>"
        return t[:i] + b + t[j:]

    acciones = ('<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de Laura Díaz"><span class="asa"></span>'
                '<div class="hc" style="padding-right: 20px;"><h2>Laura Díaz</h2></div><div class="hb" style="padding-bottom: 34px;"><div class="ap-acciones">'
                '<span role="menuitem">Cambiar permisos</span><span class="sep" role="separator"></span><span class="pel" role="menuitem">Quitar operador</span></div></div></div>')
    t = con_hoja(t, "e1", "e2", "Operador: acciones", acciones)
    permisos = hoja("Cambiar permisos de Laura Díaz",
                    campo("Permisos de plataforma", "Ver organizaciones, Recuperaciones y Ver la auditoría", select=True)
                    + '<div class="ap-cmp"><span class="rt"><span>Motivo <span class="rq">*</span></span></span><div class="ct area"></div></div>',
                    '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar cambios</button>')
    t = con_hoja(t, "e2", "e3", "Operador: cambiar permisos", permisos)
    quitar = hoja("¿Quitar a Laura Díaz como operador?",
                  '<p class="ap-txt-l">Deja de entrar a la plataforma.</p>'
                  + f'<div class="aviso-mal" role="alert">{svg(chr(60) + "circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 8v4.5\"/><path d=\"M12 15.8h.01\"/>", 16, "2")}<span>{LAST_MANAGER}</span></div>'
                  + '<div class="ap-cmp"><span class="rt"><span>Motivo <span class="rq">*</span></span></span><div class="ct area">Dejó el equipo de soporte.</div></div>',
                  '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">Quitar</button>')
    t = con_hoja(t, "e3", "e4", "Operador: quitar operador", quitar)
    t = clonar(t, "e1", "e5", "Invitación de operador pendiente", [
        ('<h1>Laura Díaz</h1><span class="sub"><span class="w-est ">Activa</span> · operador · 2 permisos</span>',
         f'<h1>{CORREO_INV}</h1><span class="sub"><span class="w-est azul">Invitación pendiente</span> · vence el 04/10</span>'),
        ('aria-label="Acciones de Laura Díaz"', f'aria-label="Acciones de {CORREO_INV}"'),
        ('<span class="on" role="tab">Permisos <span class="c">2</span></span><span role="tab">Historial de seguridad <span class="c">3</span></span>',
         '<span class="on" role="tab">Permisos <span class="c">3</span></span>'),
        (filas_tel(LAURA), filas_tel(JULIETA)),
    ])
    t = clonar(t, "e5", "e6", "Invitación de operador vencida", [
        ('<span class="w-est azul">Invitación pendiente</span> · vence el 04/10', '<span class="w-est amb">Invitación vencida</span> · venció el 04/10'),
    ])
    poner("M-Cuenta-Plat", t, CSS_TEL + ".ap-perm { display: inline-flex; }\n.ap-perm.si { color: var(--marca); }\n.ap-perm.no { color: var(--t3); }\n"
          ".ap-acciones { display: flex; flex-direction: column; margin: -8px -20px 0; }\n"
          ".ap-acciones span { display: flex; align-items: center; min-height: 54px; padding: 0 20px; font-size: 16.5px; border-top: 1px solid var(--borde); }\n"
          ".ap-acciones span:first-child { border-top: 0; }\n.ap-acciones .sep { min-height: 8px; padding: 0; background: var(--s2); }\n"
          ".ap-acciones .pel { color: var(--peligro); }\n.ap-cmp .ct.area { min-height: 88px; }\n.ap-txt-l { margin: 0; font-size: 14.5px; color: var(--t2); line-height: 1.45; }\n"
          ".w-est.azul::before { background: var(--marca); }\n.cb-pel.lleno { background: oklch(0.55 0.2 25); border-color: oklch(0.55 0.2 25); color: #fff; }\n")

# 2. Organizacion (compu).
t = tocar("Organizacion")
if t:
    t = sumar_opcion(t, "Espera aprobación", "Falló el alta")
    t = con_prop(t, "duenos", ["Con su Dueño", "Sin Dueño todavía", "Con el Dueño suspendido"], "Con su Dueño")
    t = rep(t, "const ESTADOS = { 'Activa': 'activa', 'Espera aprobación': 'pendiente',", "const ESTADOS = { 'Activa': 'activa', 'Espera aprobación': 'pendiente', 'Falló el alta': 'fallo',")
    t = rep(t, "const HISTORIAL_ESTADO = {\n  activa: HISTORIAL,\n",
            "const HISTORIAL_ESTADO = {\n  activa: HISTORIAL,\n"
            "  fallo: [{ fecha: '12/01/2026 08:40', que: 'Pidió crear la organización', quien: 'Lucía Fernández', motivo: '—' }],\n")
    t = rep(t, "pill: { pendiente: 'pend', activa: 'ok', suspendida: 'alerta', cerrada: 'off' }[s.estadoOrg],",
            "pill: { pendiente: 'pend', fallo: 'mal', activa: 'ok', suspendida: 'alerta', cerrada: 'off' }[s.estadoOrg],")
    t = rep(t, "textoEstado: { pendiente: 'Espera aprobación', activa: 'Activa', suspendida: 'Suspendida', cerrada: 'Cerrada' }[s.estadoOrg],",
            "textoEstado: { pendiente: 'Espera aprobación', fallo: 'Falló el alta', activa: 'Activa', suspendida: 'Suspendida', cerrada: 'Cerrada' }[s.estadoOrg],")
    t = rep(t, "resumen: s.estadoOrg === 'pendiente' ? 'Pidió el alta el 12/01/2026 por autoservicio · 1 empresa · 1 miembro' :",
            "resumen: s.estadoOrg === 'fallo' ? 'Pidió el alta el 12/01/2026 por autoservicio · sin empresas' : s.estadoOrg === 'pendiente' ? 'Pidió el alta el 12/01/2026 por autoservicio · 1 empresa · 1 miembro' :")
    t = rep(t, "      pendiente: s.estadoOrg === 'pendiente',\n",
            "      pendiente: s.estadoOrg === 'pendiente',\n      fallo: s.estadoOrg === 'fallo',\n"
            "      reintentar: () => { this.setState({ estadoOrg: 'activa' }); this.avisar('Terminamos el alta de Grupo Delta.'); },\n")
    t = rep(t, '<div class="acciones"><sc-if value="{{pendiente}}"',
            '<div class="acciones"><sc-if value="{{fallo}}" hint-placeholder-val="{{no}}"><button type="button" class="b b-pri" onClick="{{reintentar}}">Reintentar el alta</button></sc-if><sc-if value="{{pendiente}}"')
    t = en_render(t, "      duenoNombre: this.props.duenos === 'Sin Dueño todavía' ? '—' : 'Lucía Fernández',\n"
                     "      duenoIngreso: this.props.duenos === 'Sin Dueño todavía' ? 'Nunca' : this.props.duenos === 'Con el Dueño suspendido' ? 'hace 3 días' : 'hace 55 minutos',\n"
                     "      duenoPill: { 'Sin Dueño todavía': 'pend', 'Con el Dueño suspendido': 'alerta' }[this.props.duenos] || 'ok',\n"
                     "      duenoEstado: { 'Sin Dueño todavía': 'Invitación pendiente', 'Con el Dueño suspendido': 'Suspendido' }[this.props.duenos] || 'Activo',\n")
    t, n = re.subn(r'<span class="dos"><span class="c1">Lucía Fernández</span><span class="n2">lucia\.fernandez@delta\.ejemplo\.com</span></span>\s*<span class="c1 n">hace 55 minutos</span>\s*<span><span class="pill ok">Activo</span></span>',
                   '<span class="dos"><span class="c1">{{duenoNombre}}</span><span class="n2">lucia.fernandez@delta.ejemplo.com</span></span> <span class="c1 n">{{duenoIngreso}}</span> '
                   '<span><span class="pill {{duenoPill}}">{{duenoEstado}}</span></span>', t)
    assert n == 1
    poner("Organizacion", t)

# 2. M-Organizacion (teléfono).
t = tocar("M-Organizacion")
if t:
    t = con_estados_pantalla(t, "Historial")
    i0, j0 = rango_bloque(t, "e0")
    b0 = t[i0:j0]
    a, z = b0.index('<div class="ap-cuerpo">'), b0.index('<nav class="ap-nav"')
    historial = b0[a:z]
    TABS_H = '<span class="on" role="tab">Historial <span class="c">4</span></span><span role="tab">Dueños <span class="c">1</span></span>'
    TABS_D = '<span role="tab">Historial <span class="c">4</span></span><span class="on" role="tab">Dueños <span class="c">1</span></span>'

    def dueno(nombre, ingreso, est):
        return (f'<div class="ap-cuerpo"><div class="ap-fila"><div class="tx"><span class="l1"><span class="q">{nombre}</span><span>{ingreso}</span></span>'
                f'<span class="l2">lucia.fernandez@delta.ejemplo.com</span><span class="l3">{est}</span></div></div></div>')

    t = clonar(t, "e0", "e1", "Falló el alta", [
        ('<span class="sub">Activa · 3 empresas · 11 miembros</span>', '<span class="sub"><span class="w-est mal">Falló el alta</span> · sin empresas</span>'),
        (historial, '<div class="ap-cuerpo"><div class="ap-fila"><div class="tx"><span class="l1"><span class="q">Pidió crear la organización</span><span>12/01 08:40</span></span>'
                    '<span class="l2">Lucía Fernández</span></div></div></div>'),
    ])
    _, j = rango_bloque(t, "e1")
    t = t[:j - len("</sc-if>")] + ('<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de Grupo Delta"><span class="asa"></span>'
                                    '<div class="hc" style="padding-right: 20px;"><h2>Grupo Delta</h2></div><div class="hb" style="padding-bottom: 34px;"><div class="ap-acciones">'
                                    '<span role="menuitem">Reintentar el alta</span></div></div></div>') + t[j - len("</sc-if>"):]
    for var, nombre, contenido in [("e2", "Dueños", dueno("Lucía Fernández", "hace 55 min", '<span class="w-est ">Activo</span>')),
                                   ("e3", "Dueños: sin Dueño todavía", dueno("—", "Último ingreso: nunca", '<span class="w-est azul">Invitación pendiente</span>')),
                                   ("e4", "Dueños: Dueño suspendido", dueno("Lucía Fernández", "hace 3 días", '<span class="w-est amb">Suspendido</span>'))]:
        t = clonar(t, "e0" if var == "e2" else f"e{int(var[1:]) - 1}", var, nombre, [])
        i, j = rango_bloque(t, var)
        b = t[i:j]
        b = rep(b, TABS_H, TABS_D) if TABS_H in b else b
        a, z = b.index('<div class="ap-cuerpo">'), b.index('<nav class="ap-nav"')
        b = b[:a] + contenido + b[z:]
        t = t[:i] + b + t[j:]
    poner("M-Organizacion", t, ".ap-acciones { display: flex; flex-direction: column; margin: -8px -20px 0; }\n"
          ".ap-acciones span { display: flex; align-items: center; min-height: 54px; padding: 0 20px; font-size: 16.5px; border-top: 1px solid var(--borde); }\n"
          ".ap-acciones span:first-child { border-top: 0; }\n.w-est.azul::before { background: var(--marca); }\n")

# 3. Legales y M-Legales: la versión 2 de privacidad, publicada y todavía sin regir.
t = tocar("Legales")
if t:
    t = rep(t, "{ id: 'Privacy', n: 'Política de privacidad', version: 1, desde: '12/01/2026', versiones: 1 },",
            "{ id: 'Privacy', n: 'Política de privacidad', version: 1, desde: '12/01/2026', versiones: 2, proxima: { version: 2, desde: '01/11/2026' } },")
    t = rep(t, "        clase: x.nueva ? 'nueva' : '',\n",
            "        clase: x.nueva ? 'nueva' : '',\n        conProxima: !!x.proxima,\n"
            "        textoProxima: x.proxima ? 'Versión ' + x.proxima.version + ' desde ' + x.proxima.desde : '',\n")
    t, n = re.subn(r'(<span class="n2">Versión \{\{d\.version\}\} · vigente desde \{\{d\.desde\}\}</span>)(</span>)',
                   r'\1<sc-if value="{{d.conProxima}}" hint-placeholder-val="{{no}}"><span class="o-prox"><span class="pill pend">{{d.textoProxima}}</span></span></sc-if>\2', t)
    assert n == 1
    poner("Legales", t, ".o-prox { display: block; margin-top: 4px; }\n")
t = tocar("M-Legales")
if t:
    t = rep(t, '<span class="l2">Vigente desde 12/01/2026</span><span class="l3">1 versión</span>',
            '<span class="l2">Vigente desde 12/01/2026</span><span class="l3">2 versiones · <span class="w-est azul">Versión 2 desde 01/11/2026</span></span>')
    poner("M-Legales", t, ".w-est.azul::before { background: var(--marca); }\n")

# 4. Recuperar y M-Recuperar: sin WhatsApp hasta la Etapa 8.
for nombre in ["Recuperar", "M-Recuperar"]:
    t = tocar(nombre)
    if not t:
        continue
    t = con_prop(t, "whatsapp", ["Sin WhatsApp (hasta la Etapa 8)", "Con WhatsApp"], "Sin WhatsApp (hasta la Etapa 8)")
    for aria in ["Entrabas con", "Escribinos a"]:
        t, n = re.subn(r'(<div class="seg2" role="group" aria-label="' + aria + r'">.*?</div>)', r'<sc-if value="{{conWa}}" hint-placeholder-val="{{no}}">\1</sc-if>', t, count=1, flags=re.S)
        assert n == 1, (nombre, aria)
    t = rep(t, '<p class="sub">Escribí el correo o el teléfono con el que entrabas.</p>', '<p class="sub">{{subViejo}}</p>')
    t = rep(t, '<p class="sub">Decinos un correo o un WhatsApp nuevo donde podamos escribirte.</p>', '<p class="sub">{{subNuevo}}</p>')
    t = en_render(t, "      conWa: this.props.whatsapp === 'Con WhatsApp',\n"
                     "      subViejo: this.props.whatsapp === 'Con WhatsApp' ? 'Escribí el correo o el teléfono con el que entrabas.' : 'Escribí el correo con el que entrabas.',\n"
                     "      subNuevo: this.props.whatsapp === 'Con WhatsApp' ? 'Decinos un correo o un WhatsApp nuevo donde podamos escribirte.' : 'Decinos un correo nuevo donde podamos escribirte.',\n")
    poner(nombre, t)

# 5. Los tonos de los teléfonos, como la compu (§12).
for nombre, cambios in [("M-Organizaciones", [('<span class="w-est amb">Espera aprobación</span>', '<span class="w-est azul">Espera aprobación</span>', 2),
                                               ('<span class="w-est mal">Suspendida</span>', '<span class="w-est amb">Suspendida</span>', 1)]),
                        ("M-Cuentas", [('<span class="w-est amb">Necesita recuperación</span>', '<span class="w-est mal">Necesita recuperación</span>', 1),
                                        ('<span class="w-est mal">Suspendida</span>', '<span class="w-est amb">Suspendida</span>', 1)]),
                        ("M-Recuperaciones", [('<span class="w-est amb">Pendiente</span>', '<span class="w-est azul">Pendiente</span>', 2)])]:
    t = tocar(nombre)
    if t:
        for viejo, nuevo, veces in cambios:
            t = rep(t, viejo, nuevo, veces)
        poner(nombre, t, ".w-est.azul::before { background: var(--marca); }\n")

# 6. «Mi cuenta» en tu menú de la compu, arriba de «Salir».
for nombre in ["Organizaciones", "Organizacion", "Cuentas", "Cuenta-Plat", "Recuperaciones", "Legales", "Auditoria-Plat", "Config-Plat"]:
    t = tocar(nombre)
    if not t:
        continue
    t, n = re.subn(r'(<a class="menu-it" role="menuitem" href="Ingreso\.dc\.html">' + SVG + r' Salir</a>)',
                   lambda m: MI_CUENTA + '<div class="menu-sep" role="separator"></div>' + m.group(1), t, count=1, flags=re.S)
    assert n == 1, nombre
    poner(nombre, t)

escritos = 0
for nombre, t in textos.items():
    if t is None:
        continue
    assert t.count("</helmet>") == 1, nombre
    t = t.replace("</helmet>", f"<style {MARCA}>\n{''.join(css[nombre])}</style>\n</helmet>")
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
    escritos += 1
print("tableros", escritos)
