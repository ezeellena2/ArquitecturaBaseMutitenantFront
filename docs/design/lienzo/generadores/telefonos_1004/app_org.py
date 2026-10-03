"""Teléfonos de Organización en formato app (2026-10-03), con lo aprobado en la compu el 2026-10-02 y las reglas del teléfono:
listas de borde a borde con ⋮ solo si hay acciones, «+» flotante para crear, hojas desde abajo, acción fija abajo en las pantallas de edición."""
from app_estilo import ESTILO_X
from app_marco import I, barra, estado, fab, hoja, nav, pagina, svg

ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 18, "2")
CHEV = svg('<path d="m9 6 6 6-6 6"/>', 18, "2")
CHEV_ABAJO = svg('<path d="m6 9 6 6 6-6"/>', 18, "2")
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "3")
COPIAR = svg('<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/>', 16)
ESTILO = """<style data-propuesta="app-org">
.ap .cb.apag { opacity: 0.45; }
.ap-fijo .cb.full { padding: 0 10px; min-width: 0; }
.ap-fila .l1 .q { font-size: 15px; font-weight: 500; color: var(--t1); white-space: normal; overflow-wrap: anywhere; min-width: 0; flex: 1; }
.ap-cod { word-break: break-all; font-size: 13px; }
.ap-chk { width: 22px; height: 22px; box-sizing: border-box; border-radius: 6px; border: 1.5px solid var(--borde2); background: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; }
.ap-chk.on { background: var(--marca); border-color: var(--marca); }
.ap-area { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 14px 0 12px; font-size: 15.5px; font-weight: 600; }
.ap-area .n { flex: 1; }
.ap-area .c { font-size: 13px; font-weight: 500; color: var(--t3); }
.ap-perm { display: flex; align-items: center; gap: 12px; min-height: 50px; padding: 0 14px 0 46px; font-size: 15px; border-top: 1px solid var(--borde); }
.ap-cod { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 48px; padding: 0 6px 0 14px; border-radius: 12px; background: var(--s3); font-family: ui-monospace, Consolas, monospace; font-size: 14px; }
.ap-txt-l { font-size: 14.5px; line-height: 1.5; color: var(--t2); margin: 0; }
.ap-logo { display: flex; align-items: center; gap: 14px; }
.ap-logo .lg { width: 56px; height: 56px; border-radius: 14px; background: var(--marca); color: #fff; font-weight: 700; font-size: 18px; display: inline-flex; align-items: center; justify-content: center; }
.ap-dir { display: flex; align-items: center; gap: 0; }
.ap-dir .ct { flex: 1; border-top-right-radius: 0; border-bottom-right-radius: 0; }
.ap-dir .suf { min-height: 48px; box-sizing: border-box; display: inline-flex; align-items: center; padding: 0 12px; border: 1px solid var(--borde2); border-left: 0; border-radius: 0 12px 12px 0; background: var(--s3); color: var(--t2); font-size: 15px; }
.ap-mas { display: flex; justify-content: center; padding: 14px 16px 20px; }
.ap-mas .cb { height: 44px; padding: 0 22px; border-radius: 12px; }
.ap-pie-hoja { font-size: 13.5px; color: var(--t3); margin: -4px 0 0; }
</style>"""


def acc(*claves):
    return "".join(f'<button type="button" class="ap-ib" aria-label="{e}">{I[c]}</button>' for c, e in claves)


def kebab(nombre):
    return f'<button type="button" class="ap-ib" aria-label="Acciones de {nombre}">{I["kebab"]}</button>'


def campo(rotulo, valor, req=True, flecha=False, area=False, gris=False):
    rq = ' <span class="rq">*</span>' if req else ""
    f = ABAJO if flecha else ""
    estilo = ' style="color: var(--t3);"' if gris else ""
    return (f'<div class="ap-cmp"><span class="rt"><span>{rotulo}{rq}</span></span>'
            f'<div class="ct{" area" if area else ""}"{estilo}>{valor}{f}</div></div>')


def texto(rotulo, valor):
    return f'<div class="ap-cmp"><span class="rt"><span>{rotulo}</span></span><span style="font-size: 16px;">{valor}</span></div>'


def item(tx, sub="", izq="", der="", href=None, clase=""):
    tag, attr = ("a", f' href="{href}"') if href else ("div", "")
    s = f"<span>{sub}</span>" if sub else ""
    return f'<{tag} class="ap-it {clase}"{attr}>{izq}<span class="tx"><b>{tx}</b>{s}</span>{der}</{tag}>'


def persona(ini, l1, l2, l3, href="#", con_kebab=True, nombre=None):
    av = f'<span class="w-av{"" if ini else " g"}">{ini or "@"}</span>'
    k = kebab(nombre or l1) if con_kebab else ""
    return (f'<div class="w-conv" style="align-items: center; padding-right: 6px;"><a href="{href}" style="display: flex; gap: 14px; flex: 1; min-width: 0; color: inherit; text-decoration: none;">{av}'
            f'<span class="tx"><span class="l1"><b>{l1}</b></span><span class="l2"><span>{l2}</span></span><span class="l3">{l3}</span></span></a>{k}</div>')


def fila(l1, der, l2, l3, href="#", con_kebab=True):
    d = f"<span>{der}</span>" if der else ""
    k = kebab(l1) if con_kebab else ""
    return (f'<div class="ap-fila"><a class="tx" href="{href}" style="color: inherit; text-decoration: none;"><span class="l1">{l1}{d}</span>'
            f'<span class="l2">{l2}</span><span class="l3">{l3}</span></a>{k}</div>')


def est(clase, texto_):
    return f'<span class="w-est {clase}">{texto_}</span>'


def p(nombre, contenido, titulo):
    pagina(nombre, contenido, ESTILO_X + "\n" + ESTILO, f"{titulo} · teléfono")


ADM = "Administración"
GUARDAR = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>'

# ---------- Usuarios ----------
U = [("L", "Lucía Fernández", "lucia.fernandez@delta.ejemplo.com", est("", "Activo") + " · Dueño · Delta S.A."),
     ("T", "Tomás Acosta", "tomas.acosta@delta.ejemplo.com", est("", "Activo") + " · Delta S.A. · Solo lectura"),
     ("J", "Julieta Sosa", "julieta.sosa@delta.ejemplo.com", est("", "Activo") + " · Auditor"),
     ("D", "Diego Ríos", "diego.rios@delta.ejemplo.com", est("amb", "Baja pedida") + " · Delta S.A."),
     ("P", "Paula Méndez", "paula.mendez@delta.ejemplo.com", est("", "Activo") + " · Delta S.A. y 1 más"),
     ("M", "Marcos Giménez", "marcos.gimenez@delta.ejemplo.com", est("off", "Deshabilitado")),
     ("S", "Sofía Herrera", "sofia.herrera@delta.ejemplo.com", est("azul", "Invitación pendiente") + " · vence 02/10"),
     ("", "valentina.ruiz@gmail.com", "Delta Norte S.A. · Solo lectura", est("azul", "Invitación pendiente") + " · vence 03/10")]
USUARIOS = (estado() + barra("Usuarios", ADM, acc(("lupa", "Buscar"), ("filtro", "Filtros")) + kebab("Usuarios"), volver="T-App-Mas.dc.html")
            + '<div class="ap-cuerpo">' + "".join(persona(i, a, b, c, href="T-Org-Usuario.dc.html" if a == "Tomás Acosta" else "#") for i, a, b, c in U) + "</div>"
            + fab("Invitar usuario", "T-Org-Invitar.dc.html") + nav("mas"))
p("T-Org-Usuarios", USUARIOS, "Usuarios")
p("T-Org-Invitar", USUARIOS + hoja("Invitar usuario",
                                   campo("Correo", "sofia.herrera@delta.ejemplo.com") + campo("Roles de la organización", "Ninguno", req=False, flecha=True, gris=True)
                                   + campo("Empresa", "Delta S.A.", req=False, flecha=True) + campo("Roles en la empresa", "Solo lectura", req=False, flecha=True),
                                   '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Invitar</button>'), "Invitar usuario")

# ---------- Editar usuario ----------
USUARIO = (estado() + barra("Tomás Acosta", "tomas.acosta@delta.ejemplo.com", kebab("Tomás Acosta"), volver="T-Org-Usuarios.dc.html")
           + '<div class="ap-cuerpo ap-gris">'
           + '<span class="ap-gtit">Acceso a la organización</span><div class="ap-grupo">'
           + item("Estado", est("", "Activo"), der=f'<span class="chev">{CHEV}</span>')
           + item("Roles de la organización", "Ninguno", der=f'<span class="chev">{CHEV}</span>') + "</div>"
           + '<span class="ap-gtit">Empresas<a href="T-Org-SumarEmpresa.dc.html">Sumar empresa</a></span><div class="ap-grupo">'
           + item("Delta S.A.", "Solo lectura", der=kebab("Delta S.A.")) + "</div></div>" + GUARDAR)
p("T-Org-Usuario", USUARIO, "Editar usuario")
p("T-Org-SumarEmpresa", USUARIO + hoja("Sumar empresa", campo("Empresa", "Delta Sur S.R.L.", flecha=True) + campo("Roles en la empresa", "Solo lectura", flecha=True),
                                       '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Sumar</button>'), "Sumar empresa")

# ---------- Roles ----------
R = [("Dueño", "1 usuario", "De sistema · Toda la organización", "12 permisos"),
     ("Recursos humanos", "0 usuarios", "Toda la organización", "3 permisos"),
     ("Auditor", "1 usuario", "Toda la organización", "2 permisos"),
     ("Administrador", "2 usuarios", "De sistema · Cada empresa", "2 permisos"),
     ("Solo lectura", "4 usuarios", "Delta S.A.", "1 permiso"),
     ("Solo lectura", "1 usuario", "Delta Sur S.R.L.", "1 permiso"),
     ("Solo lectura", "0 usuarios", "Delta Norte S.A.", "1 permiso")]
p("T-Org-Roles", estado() + barra("Roles y permisos", ADM, acc(("filtro", "Filtros")), volver="T-App-Mas.dc.html")
  + '<div class="ap-cuerpo">' + "".join(fila(a, b, c, d, href="T-Org-Rol.dc.html" if (a, c) == ("Solo lectura", "Delta S.A.") else "#") for a, b, c, d in R) + "</div>"
  + fab("Crear rol") + nav("mas"), "Roles y permisos")

# ---------- Editar rol ----------
p("T-Org-Rol", estado() + barra("Solo lectura", "Vale en Delta S.A. · 4 usuarios lo tienen", volver="T-Org-Roles.dc.html")
  + '<div class="ap-cuerpo" style="padding: 4px 20px 0; gap: 14px;">'
  + campo("Nombre", "Solo lectura") + texto("Vale en", "Delta S.A.")
  + campo("Descripción", "Ve los miembros de la empresa. No cambia nada.", req=False, area=True)
  + '<span class="ap-gtit" style="margin: 6px 0 -6px;">Permisos<span style="font-weight: 500; color: var(--t3);">1 de 2 elegidos</span></span>'
  + '<div class="ap-grupo" style="margin: 0;">'
  + f'<div class="ap-area"><span style="color: var(--t3); display: inline-flex;">{CHEV_ABAJO}</span><span class="ap-chk"></span><span class="n">Miembros</span><span class="c">1 de 2</span></div>'
  + f'<div class="ap-perm"><span class="ap-chk on">{TILDE}</span>Ver miembros</div>'
  + '<div class="ap-perm"><span class="ap-chk"></span>Administrar miembros</div></div>'
  + "</div>"
  + '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Cancelar</button><button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>',
  "Editar un rol")

# ---------- Empresas ----------
E = [("Delta S.A.", "6 miembros", "CUIT 30-71234567-8", est("", "Activa") + " · Buenos Aires (GMT−3)"),
     ("Delta Sur S.R.L.", "4 miembros", "CUIT 30-71555444-2", est("", "Activa") + " · Córdoba (GMT−3)"),
     ("Delta Norte S.A.", "3 miembros", "Sin CUIT", est("", "Activa") + " · Buenos Aires (GMT−3)")]
p("T-Org-Empresas", estado() + barra("Empresas", ADM, acc(("filtro", "Filtros")), volver="T-App-Mas.dc.html")
  + '<div class="ap-cuerpo">' + "".join(fila(a, b, c, d, href="T-Org-Empresa.dc.html" if a == "Delta S.A." else "#") for a, b, c, d in E) + "</div>"
  + fab("Crear empresa") + nav("mas"), "Empresas")

# ---------- Ficha de empresa ----------
M = [("L", "Lucía Fernández", "lucia.fernandez@delta.ejemplo.com", "Administrador · " + est("", "Activo")),
     ("T", "Tomás Acosta", "tomas.acosta@delta.ejemplo.com", "Solo lectura · " + est("", "Activo")),
     ("D", "Diego Ríos", "diego.rios@delta.ejemplo.com", "Solo lectura · " + est("amb", "Baja pedida")),
     ("P", "Paula Méndez", "paula.mendez@delta.ejemplo.com", "Solo lectura · " + est("", "Activo")),
     ("M", "Martín Paz", "martin.paz@delta.ejemplo.com", "Solo lectura · " + est("", "Activo")),
     ("M", "Marcos Giménez", "marcos.gimenez@delta.ejemplo.com", est("off", "Inactivo"))]
p("T-Org-Empresa", estado() + barra("Delta S.A.", "CUIT 30-71234567-8 · Buenos Aires (GMT−3)", kebab("Delta S.A."), volver="T-Org-Empresas.dc.html")
  + '<div class="ap-tabs" role="tablist"><span class="on" role="tab">Miembros <span class="c">6</span></span><span role="tab">Roles <span class="c">1</span></span></div>'
  + '<div class="ap-cuerpo">' + "".join(persona(*x) for x in M) + "</div>" + fab("Agregar miembro") + nav("mas"), "Ficha de una empresa")

# ---------- Configuración ----------
def configuracion(dominio):
    return (estado() + barra("Configuración", ADM, volver="T-App-Mas.dc.html")
            + '<div class="ap-cuerpo" style="padding: 4px 20px 0; gap: 14px;">'
            + campo("Nombre de la organización", "Grupo Delta") + campo("Idioma y región predeterminados", "Español (Argentina)", req=False, flecha=True)
            + campo("Zona horaria predeterminada", "Buenos Aires (GMT−3)", req=False, flecha=True) + campo("Moneda predeterminada", "Peso argentino (ARS)", req=False, flecha=True)
            + f'<span class="ap-gtit" style="margin: 6px 0 -6px;">Dominio de correo{"" if "Sin dominio" in dominio else ""}<a href="T-Org-Dominio.dc.html">Agregar dominio</a></span>'
            + f'<div class="ap-grupo" style="margin: 0;">{dominio}</div>'
            + "</div>" + GUARDAR)


VERIFICADO = item("delta.ejemplo.com", est("", "Verificado") + " · 10 correos administrados por Grupo Delta", der=kebab("delta.ejemplo.com"))
PENDIENTE = item("delta.ejemplo.com", est("amb", "Pendiente"), der='<a class="ap-txt" href="T-Org-Verificar.dc.html" style="text-decoration: none;">Verificar</a>' + kebab("delta.ejemplo.com"))
SIN = item("Sin dominio", clase="apag")
p("T-Org-Configuracion", configuracion(VERIFICADO), "Configuración")
p("T-Org-Dominio", configuracion(SIN) + hoja("Agregar dominio", campo("Dominio", "delta.ejemplo.com"),
                                             '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Siguiente</button>'),
  "Configuración · agregar dominio")
p("T-Org-Verificar", configuracion(PENDIENTE) + hoja("Verificar delta.ejemplo.com",
                                                     '<p class="ap-txt-l">Cargá este registro en el DNS de tu dominio y después tocá Comprobar. Puede tardar un rato en aparecer.</p>'
                                                     '<div class="ap-cmp"><span class="rt"><span>Registro TXT a cargar en el DNS de delta.ejemplo.com</span></span>'
                                                     f'<div class="ap-cod">ab-verificacion=7f3c9a2e41b8d605<button type="button" class="ap-txt" style="display: inline-flex; align-items: center; gap: 6px;">{COPIAR} Copiar</button></div></div>',
                                                     '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Comprobar</button>'),
  "Configuración · verificar dominio")
QUITAR = ('<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="Quitar delta.ejemplo.com"><span class="asa"></span>'
          '<div class="hc" style="padding-right: 20px;"><h2>¿Quitar delta.ejemplo.com?</h2></div>'
          '<div class="hb"><p class="ap-txt-l">Los correos nuevos de delta.ejemplo.com ya no quedan administrados por Grupo Delta. Los 10 que ya lo están siguen igual.</p></div>'
          '<div class="hp"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel" style="background: var(--peligro); color: #fff; border-color: var(--peligro);">Quitar</button></div></div>')
p("T-Org-Quitar", configuracion(VERIFICADO) + QUITAR, "Configuración · quitar dominio")

# ---------- Página pública ----------
SW = '<span class="ap-sw" role="switch" aria-checked="true"></span>'
p("T-Org-Pagina", estado() + barra("Página pública", est("", "Publicada"), acc() + '<button type="button" class="ap-txt">Ver página</button>', volver="T-App-Mas.dc.html")
  + '<div class="ap-cuerpo ap-gris">'
  + f'<span class="ap-gtit">Publicación</span><div class="ap-grupo">{item("Visible en delta.plataforma.com", der=SW)}</div>'
  + '<span class="ap-gtit">Página</span><div class="ap-grupo" style="padding: 14px 16px; display: flex; flex-direction: column; gap: 14px;">'
  + '<div class="ap-logo"><span class="lg">GD</span><button type="button" class="cb cb-sec" style="height: 40px; border-radius: 10px;">Subir imagen</button></div>'
  + '<div class="ap-cmp"><span class="rt"><span>Dirección de la página <span class="rq">*</span></span></span><div class="ap-dir"><div class="ct">delta</div><span class="suf">.plataforma.com</span></div></div>'
  + campo("Nombre de la página", "Grupo Delta") + campo("Descripción", "Grupo Delta y sus empresas, en un solo lugar.", req=False, area=True)
  + '</div><span class="ap-gtit">Contacto</span><div class="ap-grupo" style="padding: 14px 16px; display: flex; flex-direction: column; gap: 14px;">'
  + campo("Correo de contacto", "contacto@delta.ejemplo.com", req=False) + campo("Teléfono", "AR +54 · 011 4321-5678", req=False)
  + '</div><div style="height: 12px;"></div></div>' + GUARDAR, "Página pública")

# ---------- Auditoría ----------
A = [("Cambió los roles de Tomás Acosta", "27/09 10:42", "Delta S.A. · Lucía Fernández"),
     ("Invitó a valentina.ruiz@gmail.com", "27/09 09:15", "Delta Norte S.A. · Lucía Fernández"),
     ("Agregó a Paula Méndez", "26/09 18:03", "Delta Sur S.R.L. · Carolina Vega"),
     ("Creó el rol Recursos humanos", "26/09 11:20", "Toda la organización · Lucía Fernández"),
     ("Deshabilitó a Marcos Giménez", "24/09 16:40", "Toda la organización · Lucía Fernández"),
     ("Venció la invitación a carla.bianchi@delta.ejemplo.com", "23/09 08:00", "Delta Sur S.R.L. · Sistema"),
     ("Cambió la zona de Delta Sur S.R.L.", "22/09 12:31", "Delta Sur S.R.L. · Carolina Vega")]
p("T-Org-Auditoria", estado() + barra("Auditoría", "Últimos 30 días", acc(("filtro", "Filtros")), volver="T-App-Mas.dc.html")
  + '<div class="ap-cuerpo">' + "".join(
      f'<a class="ap-fila" href="#"><div class="tx"><span class="l1" style="align-items: flex-start;"><span class="q">{q}</span><span>{f}</span></span>'
      f'<span class="l2">{d}</span></div></a>' for q, f, d in A)
  + '<div class="ap-mas"><button type="button" class="cb cb-sec">Cargar más</button></div></div>' + nav("mas"), "Auditoría")
print("ok")
