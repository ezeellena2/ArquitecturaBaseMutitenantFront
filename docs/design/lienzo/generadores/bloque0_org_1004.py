"""Bloque 0 · Organización (el plan de diseño del 27/10): los tableros cerrados de la organización pasan a las reglas del 25 y 26/10,
copiando la maqueta (3b9c967 y 8ba7f7f, por la Guía).

- Un dato por celda, en un renglón, y la columna ordenada con ▲:
  - Usuarios: Usuario, Correo, Rol en la organización, Empresa, Estado y Vence;
  - Empresas: Empresa, CUIT, Zona horaria, Miembros y Estado;
  - los miembros de una empresa: Miembro, Correo, Roles en la empresa, Estado y Vence;
  - Roles: Rol, Tipo («De sistema» o «Personalizado»), Vale en, Usuarios y Permisos;
  - «Para resolver» del Inicio y del asistente: una línea por pendiente; un dominio se nombra a sí mismo.
- Fechas completas: la tarjeta de Auditoría del Inicio deja «hoy».
El teléfono sigue con el nombre y una línea de datos. Se puede volver a correr.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
CSS = ('<style data-b0="org">\n.tt-h .ord { margin-left: 4px; font-size: 10px; color: var(--t2); }\n'
       '.tt-f > .c2b { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--t2); }\n</style>\n')


def ord_(texto):
    return f'<span aria-sort="ascending">{texto}<span class="ord" aria-hidden="true">▲</span></span>'


def cambiar(n, reps):
    p = PROJ / f"{n}.dc.html"
    t = p.read_text(encoding="utf-8")
    if 'data-b0="org"' in t:
        return False
    for a, b in reps:
        k = t.count(a)
        assert k >= 1, (n, a[:100])
        t = t.replace(a, b)
    t = t.replace("</helmet>", CSS + "</helmet>", 1)
    p.write_text(t, encoding="utf-8")
    return True


G_U_VIEJA = "minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1.3fr) 190px 28px"
G_U = "minmax(0, 1.1fr) minmax(0, 1.2fr) 160px minmax(0, 1fr) 150px 90px 28px"
USUARIOS = [
    (f'<div class="tt-h {{{{claseEncabezado}}}}" style="grid-template-columns: {G_U_VIEJA};"><span>Usuario</span><span>Rol en la organización</span><span>Empresa</span><span>Estado</span>',
     f'<div class="tt-h {{{{claseEncabezado}}}}" style="grid-template-columns: {G_U};">{ord_("Usuario")}<span>Correo</span><span>Rol en la organización</span><span>Empresa</span><span>Estado</span><span>Vence</span>'),
    (f'<div class="tt-f {{{{u.clase}}}} o-alto" style="grid-template-columns: {G_U_VIEJA};"><span class="dos">',
     f'<div class="tt-f {{{{u.clase}}}}" style="grid-template-columns: {G_U};"><span class="dos">'),
    ('<sc-if value="{{u.conNombre}}" hint-placeholder-val="{{si}}"><span class="n2">{{u.email}}</span></sc-if></span>',
     '</span><span class="c2b">{{u.correo}}</span>'),
    # una invitación por teléfono no tiene correo
    ("email: u.email,", "email: u.email,\n          correo: u.email.includes('@') ? u.email : '—',"),
    ('<span class="dos"><sc-if value="{{u.conEmpresa}}" hint-placeholder-val="{{si}}"><span>{{u.empresa}}</span><span class="n2">{{u.rolesEmpresa}}</span></sc-if>',
     '<span class="dos"><sc-if value="{{u.conEmpresa}}" hint-placeholder-val="{{si}}"><span>{{u.empresa}}</span></sc-if>'),
    ('<span class="dos"><span><span class="pill {{u.pill}}">{{u.estado}}</span></span><sc-if value="{{u.esInvitacion}}" hint-placeholder-val="{{no}}"><span class="n2 sang">{{u.textoVence}}</span></sc-if></span>',
     '<span><span class="pill {{u.pill}}">{{u.estado}}</span></span><span class="c1 n {{u.claseVence}}">{{u.vence}}</span>'),
]
G_E_VIEJA = "minmax(0, 1.6fr) minmax(0, 1.4fr) 100px 150px 28px"
G_E = "minmax(0, 1.3fr) 150px minmax(0, 1.2fr) 100px 150px 28px"
EMPRESAS = [
    (f'<div class="tt-h" style="grid-template-columns: {G_E_VIEJA};"><span>Empresa</span><span>Zona horaria</span>',
     f'<div class="tt-h" style="grid-template-columns: {G_E};">{ord_("Empresa")}<span>CUIT</span><span>Zona horaria</span>'),
    (f'<div class="tt-f {{{{e.clase}}}} o-alto" style="grid-template-columns: {G_E_VIEJA};">', f'<div class="tt-f {{{{e.clase}}}}" style="grid-template-columns: {G_E};">'),
    ('<span class="dos"><a class="c1" href="Empresa.dc.html">{{e.n}}</a><span class="n2 {{e.claseCuit}}">{{e.cuit}}</span></span>',
     '<a class="c1" href="Empresa.dc.html">{{e.n}}</a><span class="c1 n {{e.claseCuit}}">{{e.cuit}}</span>'),
    ("cuit: e.cuit ? 'CUIT ' + e.cuit : 'Sin CUIT',", "cuit: e.cuit || '—',"),
]
G_M_VIEJA = "minmax(0, 1.6fr) minmax(0, 1.4fr) 150px 28px"
G_M = "minmax(0, 1.1fr) minmax(0, 1.4fr) minmax(0, 1.1fr) 150px 100px 28px"
EMPRESA = [
    (f'<div class="tt-h" style="grid-template-columns: {G_M_VIEJA};"><span>Miembro</span><span>Roles en la empresa</span><span>Estado</span>',
     f'<div class="tt-h" style="grid-template-columns: {G_M};">{ord_("Miembro")}<span>Correo</span><span>Roles en la empresa</span><span>Estado</span><span>Vence</span>'),
    (f'<div class="tt-f {{{{m.clase}}}} o-alto" style="grid-template-columns: {G_M_VIEJA};">', f'<div class="tt-f {{{{m.clase}}}}" style="grid-template-columns: {G_M};">'),
    ('<span class="dos"><a class="c1" href="Usuario.dc.html">{{m.nombre}}</a><span class="n2">{{m.email}}</span></span>',
     '<a class="c1" href="Usuario.dc.html">{{m.nombre}}</a><span class="c2b">{{m.email}}</span>'),
    ('<span class="dos"><span><span class="pill {{m.pill}}">{{m.textoEstado}}</span></span><sc-if value="{{m.invitado}}" hint-placeholder-val="{{no}}"><span class="n2 sang">{{m.textoVence}}</span></sc-if></span>',
     '<span><span class="pill {{m.pill}}">{{m.textoEstado}}</span></span><span class="c1 n">{{m.venceCol}}</span>'),
    ("textoVence: (m.estado === 'vencida' ? 'Venció ' : 'Vence ') + (m.vence || ''),",
     "textoVence: (m.estado === 'vencida' ? 'Venció ' : 'Vence ') + (m.vence || ''),\n      venceCol: inv ? (m.vence || '—') : '—',"),
]
G_R_VIEJA = "minmax(0, 1.6fr) minmax(0, 1.3fr) 100px 100px 28px"
G_R = "minmax(0, 1.3fr) 140px minmax(0, 1.2fr) 100px 100px 28px"
ROLES = [
    (f'<div class="tt-h" style="grid-template-columns: {G_R_VIEJA};"><span>Rol</span><span>Vale en</span>',
     f'<div class="tt-h" style="grid-template-columns: {G_R};">{ord_("Rol")}<span>Tipo</span><span>Vale en</span>'),
    (f'<div class="tt-f o-alto" style="grid-template-columns: {G_R_VIEJA};"><span class="dos"><a class="c1" href="Rol.dc.html">{{{{r.n}}}}</a>'
     '<sc-if value="{{r.sistema}}" hint-placeholder-val="{{no}}"><span class="n2">De sistema</span></sc-if></span>',
     f'<div class="tt-f" style="grid-template-columns: {G_R};"><a class="c1" href="Rol.dc.html">{{{{r.n}}}}</a><span class="c1 n">{{{{r.tipo}}}}</span>'),
    ("sistema: !!r.sistema,", "sistema: !!r.sistema,\n        tipo: r.sistema ? 'De sistema' : 'Personalizado',"),
]
# «Para resolver»: una línea por pendiente (la segunda sale); el dominio se nombra a sí mismo
PARA_RESOLVER = [
    ('<span class="c1">Dominio de correo</span><span class=c2>delta.ejemplo.com</span>', '<span class="c1">delta.ejemplo.com</span>'),
    ('<span class="c1">ENT-000031</span><span class=c2>Entrega de pedido · Martín Paz</span>', '<span class="c1">ENT-000031</span>'),
    ('<span class="c1">carla.bianchi@delta.ejemplo.com</span><span class=c2>Invitación</span>', '<span class="c1">carla.bianchi@delta.ejemplo.com</span>'),
    ('<span class="c1">Diego Ríos</span><span class=c2>Se borra el 27/10/2026 09:15</span>', '<span class="c1">Diego Ríos</span>'),
]


# En el teléfono, la fecha corta («vence 20/10», «27/09 11:05») pasa a la completa: el vencimiento de una invitación con la
# fecha sola, como la columna Vence de la compu (con la hora, la línea no entraba en un renglón), la auditoría con su hora
# y el uso del asistente por día, la fecha sola.
FECHA_CORTA = (
    (re.compile(r"(· (?:vence|venció) )(\d{2}/\d{2})(?=</span>)"), r"\g<1>\g<2>/2026"),
    (re.compile(r"(<span>)(\d{2}/\d{2})( \d{2}:\d{2}</span>)"), r"\g<1>\g<2>/2026\g<3>"),
    (re.compile(r"(<b>)(\d{2}/\d{2})(</b>)"), r"\g<1>\g<2>/2026\g<3>"),
)
TELEFONOS = ("M-Usuarios", "M-Usuarios-Invitar", "M-Empresa", "M-Auditoria-Org", "M-Asistente-Uso-Org")


# Las listas cortas de la compu, en un renglón (maqueta 8b2ebca): lo que iba debajo va en la misma fila, como una columna; el
# estado de un dominio, con su punto, como «Cómo entrás» de Mi cuenta. En el teléfono no cambia.
CSS_LISTA = """<style data-b0="lista">
.w-it .dato { flex-direction: row; align-items: center; gap: 16px; }
.w-it .dato > b { flex: none; width: 380px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w-it .dato > span { flex: 1; min-width: 0; font-size: 13px; color: var(--t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w-it .dato > .w-est { display: inline-flex; align-items: center; gap: 6px; }
.w-it .dato > .w-est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); flex: none; }
.w-it .dato > .w-est.pend::before { background: oklch(0.72 0.15 70); }
</style>
"""
LISTAS = ("Configuracion", "Configuracion-Verificar", "Avisos", "Usuario")
ESTADOS_DOMINIO = (("<b>delta.ejemplo.com</b><span>Pendiente</span>", '<b>delta.ejemplo.com</b><span class="w-est pend">Pendiente</span>'),
                   ("<span>Verificado · 10 correos administrados por Grupo Delta</span>",
                    '<span class="w-est">Verificado · 10 correos administrados por Grupo Delta</span>'))


if __name__ == "__main__":
    for n in LISTAS:
        p = PROJ / f"{n}.dc.html"
        t = p.read_text(encoding="utf-8")
        if 'data-b0="lista"' in t:
            continue
        for a, b in ESTADOS_DOMINIO:
            t = t.replace(a, b)
        p.write_text(t.replace("</helmet>", CSS_LISTA + "</helmet>", 1), encoding="utf-8")
        print(n, "lista en un renglón")
    for n in TELEFONOS:
        p = PROJ / f"{n}.dc.html"
        t = p.read_text(encoding="utf-8")
        nuevo = t
        for patron, por in FECHA_CORTA:
            nuevo = patron.sub(por, nuevo)
        if n == "M-Empresa":
            # un miembro invitado: el estado y el vencimiento en un renglón; el rol se ve al abrirlo
            nuevo = re.sub(r'(<span class="l3">)[^<]* · (<span class="w-est (?:azul|amb)">Invitación)', r"\g<1>\g<2>", nuevo)
        if nuevo != t:
            p.write_text(nuevo, encoding="utf-8")
            print(n, "fechas completas")
    hechos = []
    for n, reps in (("Usuarios", USUARIOS), ("Empresas", EMPRESAS), ("Empresa", EMPRESA), ("Roles", ROLES)):
        if cambiar(n, reps):
            hechos.append(n)
    for n in ("Inicio-Org", "Asistente-Org"):
        p = PROJ / f"{n}.dc.html"
        t = p.read_text(encoding="utf-8")
        nuevo = t
        for a, b in PARA_RESOLVER:
            nuevo = nuevo.replace(a, b)
        nuevo = nuevo.replace('</span><span class=c2>Invitación</span>', '</span>')
        # la fecha y la hora completas no entran después de «Último cambio»: va la fecha sola, como «Desde» en las tablas
        nuevo = nuevo.replace("Último cambio 27/09/2026 10:42", "27/09/2026 10:42").replace("Último cambio hoy, 10:42", "27/09/2026 10:42")
        nuevo = nuevo.replace('<span class="pr-a">Formularios</span>', '<span class="pr-a">Gestión de formularios</span>')
        if nuevo != t:
            p.write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    print("bloque 0 · organización:", hechos)
