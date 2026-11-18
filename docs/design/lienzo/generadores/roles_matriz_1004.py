"""Los permisos de un rol, en una matriz (decisión 212 de la hoja de ruta del back, RO1-A de ArquitecturaBase, aprobada por el
usuario el 2026-11-18). Cambia las áreas plegables de un rol, aprobadas para la base de la 12, en cada acceso:

- **en la compu (desde 768 px), una matriz:** una fila por área, con las columnas Área, Ver (`<área>.read`), Administrar
  (`<área>.manage`) y «Otros permisos» (los demás del área, en el orden del catálogo, cada uno con su casilla y su nombre). Donde
  el área no tiene ese permiso va «—», y si ningún área tiene otros permisos, esa columna no aparece (un rol de empresa, que solo
  tiene Miembros). La casilla del principio de la fila marca o quita el área entera y queda vacía, parcial (`r212-mixto`) o
  completa; un área de un solo permiso no la lleva, porque repetiría la de ese permiso;
- **en el teléfono, una banda por área:** su nombre y su (i) a la izquierda y la casilla del área a la derecha; debajo, sus
  permisos con el nombre entero y 44 px para tocar, sin desplazar de costado;
- **sin leyendas:** qué permite cada permiso va en la (i) del área, un permiso por renglón («Ver usuarios — Consultar…»). Salen el
  buscador, «Todos · Elegidos», «Expandir todo» y las áreas que se pliegan (en el lienzo solo estaban las plegables);
- **lo que no se cambia se lee:** un rol de sistema (el Dueño) y los permisos de un operador en su ficha llevan una tilde donde
  tienen el permiso, sin casillas ni la columna del área; en el teléfono, cada banda lista solo lo que tiene. El porqué del rol de
  sistema va en la (i) del título.

Pasa por los roles de la organización y de una empresa (`Rol` y `M-Rol`, con «Vale en»), por los permisos individuales de un
operador de Plataforma (ADR 0042) en su ficha y en «Cambiar permisos» (`Cuenta-Plat` y `M-Cuenta-Plat`) y por «Invitar operador»
(`Cuentas`), que también los elige. `M-Cuentas` no dibuja la invitación. Suma un estado a `Rol` y a `M-Rol`, «Editar el rol Recursos
humanos: qué permite Usuarios», con la (i) abierta.

El catálogo es el del back: un área junta los códigos con el mismo prefijo, como `RoleService.AreaOf` (el primer segmento;
`company` es Miembros), y los de Plataforma, que el back no agrupa, por el segundo (`platform.tenants` es Organizaciones). Los
nombres y las descripciones de la organización y de la empresa salen de `Permissions.resx`, y los de Plataforma, de
`platformAccounts.json` y de los módulos, en el orden de `permissionCatalog.ts` (los del núcleo, los de los módulos y, al final,
«Cambiar la configuración»). Suma el Asistente de la organización (`assistant.use` y
`assistant.configure`), que el tablero no tenía, y separa los de formularios (de la E12 a la E14, todavía sin back) en sus tres
áreas: Formularios, Respuestas y Catálogos, con los textos que ya tenía el lienzo. «Invitar operador» pasa a ofrecer también los
permisos de los módulos, como la ficha.

Cada tablero lleva su bloque `<style data-r212="matriz">` antes de `</helmet>`, con las medidas de antes de la escala: la pasada de
las piezas las achica en la compu (180) y los teléfonos las conservan. Los tableros con lógica (`Rol` y `Cuentas`) llevan la matriz
como plantilla y su cálculo entre `// t212 ·` y `// t212 · fin`; los demás, el dibujo de cada estado.

Corre después de `traspaso15_textos_1004.py`; al terminar imprime los tableros para la pasada de las piezas
(`python traspaso10_piezas_1004.py --tableros …`). No toca `canvas.json`. Lee y escribe sin cambiar los finales de línea, y se puede
volver a correr: lo que ya está hecho no vuelve a encontrar lo que busca y el bloque de estilo, igual al de antes de la escala, no se
toca.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
TABLEROS = ["Rol", "M-Rol", "Cuenta-Plat", "M-Cuenta-Plat", "Cuentas"]

# ---------------------------------------------------------------------------------------------------------------- el catálogo
# (área, nombre, [(código, nombre, qué permite)]), en el orden de `Permissions.All` y de `permissionCatalog.ts`.
ORG = [
    ("users", "Usuarios", [
        ("users.read", "Ver usuarios", "Consultar la lista y la ficha de las personas de la organización."),
        ("users.invite", "Invitar usuarios", "Enviar una invitación para sumarse a la organización."),
        ("users.manage", "Administrar usuarios", "Editar, dar de baja, reactivar y quitar personas de la organización.")]),
    ("roles", "Roles", [
        ("roles.read", "Ver roles", "Consultar los roles y los permisos que incluyen."),
        ("roles.manage", "Administrar roles", "Crear, editar y borrar roles."),
        ("roles.assign", "Asignar roles", "Asignar o quitar roles de las personas.")]),
    ("companies", "Empresas", [
        ("companies.read", "Ver empresas", "Consultar las empresas de la organización."),
        ("companies.manage", "Administrar empresas", "Crear, editar y borrar empresas.")]),
    ("settings", "Configuración", [
        ("settings.read", "Ver la configuración", "Consultar la configuración de la organización."),
        ("settings.manage", "Cambiar la configuración", "Editar la configuración de la organización.")]),
    ("audit", "Auditoría", [
        ("audit.read", "Ver la auditoría", "Consultar el registro de auditoría de la organización.")]),
    ("publicpage", "Página pública", [
        ("publicpage.manage", "Administrar la página pública", "Editar y publicar la página pública de la organización.")]),
    ("assistant", "Asistente", [
        ("assistant.use", "Usar el asistente", "Consultar el asistente con tus permisos."),
        ("assistant.configure", "Configurar el asistente", "Configurar y consultar el uso del asistente de la organización.")]),
    ("whatsapp", "WhatsApp", [
        ("whatsapp.customers", "Atender clientes", "Ver y responder la bandeja de Clientes, y ver, editar e importar los contactos."),
        ("whatsapp.internal", "Atender internos", "Ver y responder la bandeja de Internos."),
        ("whatsapp.broadcasts", "Mandar difusiones", "Crear, programar y cancelar difusiones a los contactos que aceptan promociones."),
        ("whatsapp.manage", "Administrar WhatsApp", "Conectar números y configurar el bot, los equipos y las plantillas.")]),
    ("forms", "Formularios", [
        ("forms.read", "Ver formularios", "La lista de formularios y su ficha."),
        ("forms.manage", "Diseñar formularios", "Crear formularios y editar sus preguntas y textos."),
        ("forms.publish", "Publicar formularios", "Publicarlos en WhatsApp.")]),
    ("formrecords", "Respuestas", [
        ("formrecords.create", "Responder formularios", "Recibirlos por WhatsApp y completarlos."),
        ("formrecords.read", "Ver respuestas", "Los valores de cada respuesta.")]),
    ("formcatalogs", "Catálogos", [
        ("formcatalogs.read", "Ver catálogos", "La lista de catálogos y su ficha."),
        ("formcatalogs.manage", "Administrar catálogos", "Crear catálogos y editar sus opciones y filtros.")]),
]
EMPRESA = [
    ("company.members", "Miembros", [
        ("company.members.read", "Ver miembros", "Consultar las personas que integran la empresa."),
        ("company.members.manage", "Administrar miembros", "Administrar las personas que integran la empresa.")]),
]
PLAT = [
    ("platform.tenants", "Organizaciones", [
        ("platform.tenants.read", "Ver organizaciones", "El listado y la ficha de cada organización."),
        ("platform.tenants.manage", "Administrar organizaciones", "Aprobar, suspender, reactivar y cerrar; módulos y página pública.")]),
    ("platform.accounts", "Cuentas", [
        ("platform.accounts.read", "Ver cuentas", "Buscar cuentas y ver su ficha."),
        ("platform.accounts.manage", "Administrar cuentas", "Suspender, cerrar sesiones y borrar.")]),
    ("platform.recoveries", "Recuperaciones", [
        ("platform.recoveries.manage", "Recuperaciones", "Aprobar o rechazar pedidos de «Recuperar mi cuenta».")]),
    ("platform.legal", "Documentos legales", [
        ("platform.legal.manage", "Documentos legales", "Publicar una versión nueva de términos o privacidad.")]),
    ("platform.operators", "Operadores", [
        ("platform.operators.manage", "Administrar operadores", "Invitar operadores y cambiar sus permisos.")]),
    ("platform.audit", "Auditoría", [
        ("platform.audit.read", "Ver la auditoría", "Los eventos de seguridad de todo el servicio.")]),
    ("platform.whatsapp", "WhatsApp", [
        ("platform.whatsapp.manage", "Administrar el WhatsApp de Plataforma",
         "Conectar el número y configurar el bot, los equipos y las plantillas de consultas."),
        ("platform.whatsapp.attend", "Atender consultas", "Ver y responder las consultas que llegan al número de Plataforma.")]),
    ("platform.assistant", "Asistente", [
        ("platform.assistant.use", "Usar el asistente de Plataforma", "Consultar el asistente con tus permisos de Plataforma."),
        ("platform.assistant.configure", "Configurar el asistente de Plataforma", "Configurar claves, modelos y topes del asistente."),
        ("platform.assistant.read", "Ver el uso del asistente", "Ver costos y consultas agregados sin leer conversaciones.")]),
    ("platform.settings", "Configuración", [
        ("platform.settings.manage", "Cambiar la configuración", "Registro de personas y alta de organizaciones.")]),
]
TODOS_ORG = [c for _, _, ps in ORG for c, _, _ in ps]
NOMBRES = {c: n for cat in (ORG, EMPRESA, PLAT) for _, _, ps in cat for c, n, _ in ps}
NOMBRES_PLAT = {n: c for _, _, ps in PLAT for c, n, _ in ps}
POR_QUE_DUENO = "Es el rol del sistema con todos los permisos de la organización: no se cambia."
AYUDA_ABIERTA = "Editar el rol Recursos humanos: qué permite Usuarios"
for cat in (ORG, EMPRESA, PLAT):
    for area, _, ps in cat:
        assert all(c.rsplit(".", 1)[0] == area for c, _, _ in ps), area
        assert not any("'" in x or '"' in x or "<" in x for p in ps for x in p), area


def columnas(area, ps):
    """Ver es el `.read` del área; Administrar, su `.manage`; lo demás, «Otros permisos», en el orden del catálogo."""
    ver = next((p for p in ps if p[0] == area + ".read"), None)
    adm = next((p for p in ps if p[0] == area + ".manage"), None)
    return ver, adm, [p for p in ps if p is not ver and p is not adm]


def con_otros(cat):
    return any(columnas(a, ps)[2] for a, _, ps in cat)


def ayuda(ps, sep):
    """La (i) del área: qué permite cada permiso, uno por renglón."""
    return sep.join(f"{n} — {d}" for _, n, d in ps)


# ---------------------------------------------------------------------------------------------------------------- los íconos
def svg(cuerpo, tam, grosor):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{grosor}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{cuerpo}</svg>')


I_INFO = '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>'
I_TILDE = '<path d="m5 12.5 4.5 4.5L19 7.5"/>'
INFO, INFO_TEL = svg(I_INFO, 14, "1.75"), svg(I_INFO, 20, "1.75")
TILDE, TILDE_TEL = svg(I_TILDE, 16, "2.25"), svg(I_TILDE, 18, "2.25")
CHK_ON, CHK_MIXTO = svg(I_TILDE, 14, "3"), svg('<path d="M6.5 12h11"/>', 14, "3")
GUION = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 8h8' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"


def info(texto, abierta=False):
    clase = "r212-i abierta" if abierta else "r212-i"
    return (f'<span class="{clase}" tabindex="0" role="img" aria-label="{texto}">{INFO}'
            f'<span class="r212-tip" role="tooltip">{texto}</span></span>')


def info_tel(texto, abierta=False):
    clase = "r212-i abierta" if abierta else "r212-i"
    return (f'<span class="{clase}" tabindex="0" role="img" aria-label="{texto}">{INFO_TEL}'
            f'<span class="r212-tip" role="tooltip">{texto}</span></span>')


# ---------------------------------------------------------------------------------------------------------------- los estilos
# Con las medidas de antes de la escala: en la compu las achica la pasada de las piezas (180).
CSS_COMPU = """/* 212 · Los permisos de un rol o de un operador, en una matriz: una fila por área, con Ver (`.read`), Administrar (`.manage`) y
   «Otros permisos»; «—» donde el área no tiene ese permiso. La casilla del área queda vacía, parcial o completa; lo que no se
   cambia se lee con tildes, sin la columna del área. Qué permite cada permiso va en la (i) del área (roles_matriz_1004.py). */
.r212 { display: flex; flex-direction: column; font-size: 13px; line-height: 1.35; color: var(--t1); text-align: left; }
.r212-f { display: grid; min-height: 40px; border-bottom: 1px solid var(--borde); }
.r212-f:last-child { border-bottom: 0; }
.r212.con-area.con-otros > .r212-f { grid-template-columns: 34px 180px 84px 108px minmax(0, 1fr); }
.r212.con-area.sin-otros > .r212-f { grid-template-columns: 34px 180px 84px minmax(0, 1fr); }
.r212.sin-area.con-otros > .r212-f { grid-template-columns: 180px 84px 108px minmax(0, 1fr); }
.r212.sin-area.sin-otros > .r212-f { grid-template-columns: 180px 84px minmax(0, 1fr); }
.r212-f > * { display: flex; align-items: center; gap: 6px; min-width: 0; padding: 6px 12px; box-sizing: border-box; }
.r212-f > * + * { border-left: 1px solid oklch(0.915 0.013 95 / 0.8); }
.r212-h { background: oklch(0.945 0.027 95); border-bottom-color: oklch(0.89 0.031 95); font-weight: 600; color: var(--t2); }
.r212-h > * + * { border-left-color: oklch(0.89 0.031 95); }
.r212 > .r212-h:first-child { border-radius: 3px 3px 0 0; }
.r212 > .r212-f:not(.r212-h):nth-child(odd) { background: oklch(0.968 0.015 95); }
.r212-f > .r212-c { justify-content: center; padding: 0; }
.r212-a { font-weight: 500; }
.r212-no { color: var(--t3); }
.r212-si { display: inline-flex; align-items: center; gap: 6px; color: var(--marca); }
.r212-o { flex-wrap: wrap; column-gap: 20px; row-gap: 4px; }
.r212-ot { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
span.r212-ot { cursor: default; }
.r212-ot .r212-si { color: var(--marca); }
.r212 input[type="checkbox"] { width: 16px; height: 16px; margin: 0; flex-shrink: 0; accent-color: var(--marca); cursor: pointer; }
.r212 input[type="checkbox"].r212-mixto { appearance: none; -webkit-appearance: none; border: 0; border-radius: 2px; background: var(--marca) url("@GUION@") center / 12px 12px no-repeat; }
.r212-vacio { padding: 16px; color: var(--t3); }
.r212-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.r212-i { position: relative; display: inline-flex; align-items: center; color: var(--t3); cursor: help; outline: none; }
.r212-i:focus-visible { border-radius: 50%; box-shadow: 0 0 0 2px var(--marca); }
.r212-tip { display: none; position: absolute; z-index: 40; top: calc(100% + 8px); left: -10px; width: 340px; padding: 8px 10px; border-radius: 6px; background: oklch(0.27 0.012 60); color: #fff; font-size: 12.5px; font-weight: 400; line-height: 1.45; white-space: pre-line; text-align: left; }
.r212-tip::before { content: ""; position: absolute; left: 14px; top: -4px; width: 8px; height: 8px; background: inherit; transform: rotate(45deg); }
.r212-i:hover .r212-tip, .r212-i:focus .r212-tip, .r212-i.abierta .r212-tip { display: block; }
.r212-tit { display: flex; align-items: center; gap: 6px; min-width: 0; }
.w-caja.r212-caja, .tarjeta.r212-caja { overflow: visible; }
.r212-marco { border: 1px solid var(--borde); border-radius: 3px; }
/* En un diálogo de 560, las columnas se ajustan para que «Otros permisos» entre sin cortar un nombre. */
.dlg .r212.con-area.con-otros > .r212-f { grid-template-columns: 28px 144px 44px 80px minmax(0, 1fr); }
.r212-err { flex-shrink: 0; }
""".replace("@GUION@", GUION)

# El teléfono conserva sus medidas táctiles: la casilla de 22 en un blanco de 44 y las filas de 50.
CSS_TEL = """/* 212 · En el teléfono, una banda por área: su nombre y su (i) a la izquierda y la casilla del área a la derecha; debajo, sus
   permisos con el nombre entero y 44 px para tocar. Lo que no se cambia lista solo lo que tiene, con su tilde
   (roles_matriz_1004.py). */
.r212t { display: flex; flex-direction: column; flex-shrink: 0; background: #fff; }
.r212t.marco { border: 1px solid var(--borde); border-radius: 14px; }
.r212t.marco > .r212t-b:first-child { border-radius: 13px 13px 0 0; }
.r212t-b { position: relative; display: flex; align-items: center; min-height: 48px; padding: 0 2px 0 16px; background: oklch(0.968 0.015 95); border-top: 1px solid var(--borde); font-size: 15.5px; font-weight: 600; color: var(--t1); }
.r212t > .r212t-b:first-child { border-top: 0; }
.r212t-b .n { min-width: 0; }
.r212t-b .r212-i { position: static; width: 44px; height: 44px; justify-content: center; flex-shrink: 0; }
.r212t-b .r212-tip { top: calc(100% - 4px); left: 10px; right: 10px; width: auto; }
.r212t-b .r212-tip::before { display: none; }
.r212t-c { margin-left: auto; width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.r212t-p { display: flex; align-items: center; gap: 12px; min-height: 50px; box-sizing: border-box; padding: 0 16px; border-top: 1px solid var(--borde); font-size: 15px; font-weight: 400; color: var(--t1); }
.r212t-k { width: 22px; height: 22px; box-sizing: border-box; border-radius: 6px; border: 1.5px solid var(--borde2); background: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; }
.r212t-k.on { background: var(--marca); border-color: var(--marca); }
.r212t-si { display: inline-flex; color: var(--marca); flex-shrink: 0; }
.r212-i { position: relative; display: inline-flex; align-items: center; color: var(--t3); cursor: help; outline: none; }
.r212-i:focus-visible { border-radius: 10px; box-shadow: inset 0 0 0 2px var(--marca); }
.r212-tip { display: none; position: absolute; z-index: 40; top: calc(100% + 4px); left: -10px; width: 280px; padding: 10px 12px; border-radius: 8px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14px; font-weight: 400; line-height: 1.45; white-space: pre-line; text-align: left; letter-spacing: 0; }
.r212-tip::before { content: ""; position: absolute; left: 14px; top: -4px; width: 8px; height: 8px; background: inherit; transform: rotate(45deg); }
.r212-i:hover .r212-tip, .r212-i:focus .r212-tip, .r212-i.abierta .r212-tip { display: block; }
.r212-tit { display: flex; align-items: center; min-width: 0; }
.ap-bar .r212-tit h1 { min-width: 0; }
.ap-bar .r212-tit .r212-i { width: 44px; height: 44px; justify-content: center; flex-shrink: 0; }
.ap-bar .r212-tit .r212-tip { left: -100px; width: 270px; }
.ap-bar .r212-tit .r212-tip::before { left: 118px; }
.ap-hoja.r212t-hoja { top: 52px; }
.ap-hoja.r212t-hoja .hb { flex: 1; min-height: 0; overflow-y: auto; }
"""
BLOQUE = re.compile(r'<style data-r212="matriz">\n.*?</style>\n', re.S)
ESCALADO = re.compile(r"(\d+(?:\.\d+)?)px/\*(\d+(?:\.\d+)?)px\*/")


def con_estilo(t, css):
    """El bloque, una vez: si ya está igual al de antes de la escala, no se toca (la pasada de las piezas lo achicó)."""
    estilo = f'<style data-r212="matriz">\n{css}</style>\n'
    m = BLOQUE.search(t)
    if m:
        return t if ESCALADO.sub(r"\2px", m.group(0)) == estilo else t[:m.start()] + estilo + t[m.end():]
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", estilo + "</helmet>", 1)


# ---------------------------------------------------------------------------------------------------------------- lectura y escritura
def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        t = f.read()
    crlf = "\r\n" in t
    assert not crlf or t.count("\r\n") == t.count("\n"), nombre
    return t.replace("\r\n", "\n"), crlf


def escribir(nombre, t, crlf):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t.replace("\n", "\r\n") if crlf else t)


def cambiar(t, viejo, nuevo, veces):
    """`viejo` por `nuevo`, que está `veces` veces. Si ya no está, es una corrida anterior: tiene que estar `nuevo`."""
    if viejo in nuevo and t.count(nuevo) == veces:
        return t
    k = t.count(viejo)
    if k == 0:
        assert t.count(nuevo) == veces, ("no encuentro", viejo[:160])
        return t
    assert k == veces, (viejo[:160], k, veces)
    return t.replace(viejo, nuevo)


# ---------------------------------------------------------------------------------------------------------------- la matriz dibujada
def matriz(cat, elegidos, leer=False, etiqueta='aria-label="Permisos"', clase=""):
    """La matriz de un estado (sin lógica): casillas que se marcan, o tildes si se lee."""
    otros = con_otros(cat)
    h = [f'<div class="r212 {"sin-area" if leer else "con-area"} {"con-otros" if otros else "sin-otros"}{clase}" role="table" {etiqueta}>',
         '<div class="r212-f r212-h" role="row">']
    if not leer:
        h.append('<span class="r212-c" role="columnheader"><span class="r212-sr">Toda el área</span></span>')
    h.append('<span role="columnheader">Área</span><span role="columnheader">Ver</span><span role="columnheader">Administrar</span>')
    if otros:
        h.append('<span role="columnheader">Otros permisos</span>')
    h.append("</div>")

    def casilla(p, nombre=True):
        on = " checked" if p[0] in elegidos else ""
        return f'<input type="checkbox"{on} aria-label="{p[1]}">' if nombre else f'<input type="checkbox"{on}>'

    def celda(p):
        if p is None:
            return '<span role="cell"><span class="r212-no" aria-hidden="true">—</span></span>'
        if leer:
            marca = f'<span class="r212-si">{TILDE}<span class="r212-sr">{p[1]}</span></span>' if p[0] in elegidos else ""
            return f'<span role="cell">{marca}</span>'
        return f'<span role="cell">{casilla(p)}</span>'

    for area, nombre, ps in cat:
        ver, adm, resto = columnas(area, ps)
        h.append('<div class="r212-f" role="row">')
        if not leer:
            caja = ""
            if len(ps) > 1:
                k = sum(1 for p in ps if p[0] in elegidos)
                marca = " checked" if k == len(ps) else ' class="r212-mixto"' if k else ""
                caja = f'<input type="checkbox"{marca} aria-label="Todos los permisos de {nombre}">'
            h.append(f'<span class="r212-c" role="cell">{caja}</span>')
        h.append(f'<span class="r212-a" role="rowheader"><span class="r212-n">{nombre}</span>{info(ayuda(ps, "&#10;"))}</span>')
        h.append(celda(ver) + celda(adm))
        if otros:
            if leer:
                items = "".join(f'<span class="r212-ot"><span class="r212-si">{TILDE}</span>{p[1]}</span>' for p in resto if p[0] in elegidos)
            else:
                items = "".join(f'<label class="r212-ot">{casilla(p, False)}{p[1]}</label>' for p in resto)
            h.append(f'<span class="r212-o" role="cell">{items}</span>')
        h.append("</div>")
    h.append("</div>")
    return "".join(h)


def bandas(cat, elegidos, leer=False, abierta=None, marco=True, etiqueta='aria-label="Permisos"'):
    """El teléfono: una banda por área y sus permisos debajo; si se lee, solo los que tiene, con su tilde."""
    h = [f'<div class="r212t{" marco" if marco else ""}" role="list" {etiqueta}>']
    for area, nombre, ps in cat:
        caja = ""
        if not leer and len(ps) > 1:
            k = sum(1 for p in ps if p[0] in elegidos)
            if k == len(ps):
                caja = f'<span class="r212t-c" role="checkbox" aria-checked="true" aria-label="Todos los permisos de {nombre}"><span class="r212t-k on">{CHK_ON}</span></span>'
            elif k:
                caja = f'<span class="r212t-c" role="checkbox" aria-checked="mixed" aria-label="Todos los permisos de {nombre}"><span class="r212t-k on">{CHK_MIXTO}</span></span>'
            else:
                caja = f'<span class="r212t-c" role="checkbox" aria-checked="false" aria-label="Todos los permisos de {nombre}"><span class="r212t-k"></span></span>'
        h.append(f'<div class="r212t-b" role="listitem"><span class="n">{nombre}</span>{info_tel(ayuda(ps, "&#10;"), abierta == nombre)}{caja}</div>')
        for c, n, _ in ps:
            if leer:
                if c in elegidos:
                    h.append(f'<div class="r212t-p" role="listitem"><span class="r212t-si">{TILDE_TEL}</span>{n}</div>')
            elif c in elegidos:
                h.append(f'<div class="r212t-p" role="checkbox" aria-checked="true"><span class="r212t-k on">{CHK_ON}</span>{n}</div>')
            else:
                h.append(f'<div class="r212t-p" role="checkbox" aria-checked="false"><span class="r212t-k"></span>{n}</div>')
    h.append("</div>")
    return "".join(h)


# ---------------------------------------------------------------------------------------------------------------- la matriz con lógica
def js_cat(nombre, cat):
    filas = []
    for area, n, ps in cat:
        permisos = ", ".join(f"['{c}', '{pn}', '{d}']" for c, pn, d in ps)
        filas.append(f"  {{ a: '{area}', n: '{n}', ps: [{permisos}] }},")
    return f"const {nombre} = [\n" + "\n".join(filas) + "\n];\n"


JS_MATRIZ = """// t212 · La matriz de permisos (212, roles_matriz_1004.py): una fila por área, con Ver (`<área>.read`), Administrar
// (`<área>.manage`) y «Otros permisos», en el orden del catálogo, y «—» donde el área no tiene ese permiso. La casilla del área
// queda vacía, parcial o completa, y un área de un solo permiso no la lleva. Con `leer`, tildes, sin casillas ni la columna del
// área; `abierta` deja a la vista la (i) de esa área, que dice qué permite cada permiso, uno por renglón.
const matrizConOtros = (areas) => areas.some((a) => a.ps.some((p) => p[0] !== a.a + '.read' && p[0] !== a.a + '.manage'));
const matrizClase = (areas, leer) => (leer ? 'sin-area' : 'con-area') + (matrizConOtros(areas) ? ' con-otros' : ' sin-otros');
const matrizFilas = (areas, elegidos, actuales, poner, { leer = false, abierta = null } = {}) => areas.map((a) => {
  const codigos = a.ps.map((p) => p[0]);
  const marcados = codigos.filter((c) => elegidos.includes(c));
  const alternar = (c) => { const l = actuales(); poner(l.includes(c) ? l.filter((x) => x !== c) : [...l, c]); };
  const ver = a.ps.find((p) => p[0] === a.a + '.read');
  const adm = a.ps.find((p) => p[0] === a.a + '.manage');
  const celda = (p, k) => ({
    [k + 'Falta']: !p, [k + 'Casilla']: !!p && !leer, [k + 'Tilde']: !!p && leer && elegidos.includes(p[0]),
    [k + 'On']: !!p && elegidos.includes(p[0]), [k + 'N']: p ? p[1] : '', ['alternar' + k]: () => p && alternar(p[0]),
  });

  return {
    n: a.n,
    ayuda: a.ps.map((p) => p[1] + ' — ' + p[2]).join('\\n'),
    claseI: abierta === a.n ? 'abierta' : '',
    conArea: codigos.length > 1,
    todos: marcados.length === codigos.length,
    claseArea: marcados.length > 0 && marcados.length < codigos.length ? 'r212-mixto' : '',
    ariaTodos: 'Todos los permisos de ' + a.n,
    alternarTodos: () => {
      const resto = actuales().filter((c) => !codigos.includes(c));
      poner(marcados.length === codigos.length ? resto : [...resto, ...codigos]);
    },
    ...celda(ver, 'Ver'),
    ...celda(adm, 'Adm'),
    otros: a.ps.filter((p) => p !== ver && p !== adm).map((p) => ({
      n: p[1], on: elegidos.includes(p[0]), casilla: !leer, tilde: leer && elegidos.includes(p[0]), alternar: () => alternar(p[0]),
    })),
  };
});
// t212 · fin
"""
JS_BLOQUE = re.compile(r"// t212 · La matriz.*?// t212 · fin\n", re.S)


def con_js(t):
    """El cálculo de la matriz, una vez, antes del componente."""
    m = JS_BLOQUE.search(t)
    if m:
        return t if m.group(0) == JS_MATRIZ else t[:m.start()] + JS_MATRIZ + t[m.end():]
    assert t.count("\nclass Component extends DCLogic {") == 1
    return t.replace("\nclass Component extends DCLogic {", "\n" + JS_MATRIZ + "\nclass Component extends DCLogic {", 1)


def plantilla(lista, clase, otros, editable, vacio=""):
    """La matriz como plantilla: `lista` son las filas de `matrizFilas`; `editable`, el valor que prende las casillas del área."""
    def celda(k):
        return (f'<span role="cell"><sc-if value="{{{{a.{k}Falta}}}}" hint-placeholder-val="{{{{no}}}}"><span class="r212-no" aria-hidden="true">—</span></sc-if>'
                f'<sc-if value="{{{{a.{k}Casilla}}}}" hint-placeholder-val="{{{{si}}}}"><input type="checkbox" checked="{{{{a.{k}On}}}}" onChange="{{{{a.alternar{k}}}}}" aria-label="{{{{a.{k}N}}}}"></sc-if>'
                f'<sc-if value="{{{{a.{k}Tilde}}}}" hint-placeholder-val="{{{{no}}}}"><span class="r212-si">{TILDE}<span class="r212-sr">{{{{a.{k}N}}}}</span></span></sc-if></span>')

    si = f'<sc-if value="{{{{{editable}}}}}" hint-placeholder-val="{{{{si}}}}">'
    otros_si = f'<sc-if value="{{{{{otros}}}}}" hint-placeholder-val="{{{{si}}}}">'
    return (
        f'<div class="r212 {{{{{clase}}}}}" role="table" aria-label="Permisos">'
        f'<div class="r212-f r212-h" role="row">{si}<span class="r212-c" role="columnheader"><span class="r212-sr">Toda el área</span></span></sc-if>'
        '<span role="columnheader">Área</span><span role="columnheader">Ver</span><span role="columnheader">Administrar</span>'
        f'{otros_si}<span role="columnheader">Otros permisos</span></sc-if></div>'
        f'{vacio}'
        f'<sc-for list="{{{{{lista}}}}}" as="a" hint-placeholder-count="3"><div class="r212-f" role="row">'
        f'{si}<span class="r212-c" role="cell"><sc-if value="{{{{a.conArea}}}}" hint-placeholder-val="{{{{si}}}}"><input type="checkbox" class="{{{{a.claseArea}}}}" checked="{{{{a.todos}}}}" onChange="{{{{a.alternarTodos}}}}" aria-label="{{{{a.ariaTodos}}}}"></sc-if></span></sc-if>'
        '<span class="r212-a" role="rowheader"><span class="r212-n">{{a.n}}</span>'
        f'<span class="r212-i {{{{a.claseI}}}}" tabindex="0" role="img" aria-label="{{{{a.ayuda}}}}">{INFO}<span class="r212-tip" role="tooltip">{{{{a.ayuda}}}}</span></span></span>'
        f'{celda("Ver")}{celda("Adm")}'
        f'{otros_si}<span class="r212-o" role="cell"><sc-for list="{{{{a.otros}}}}" as="o" hint-placeholder-count="1">'
        '<sc-if value="{{o.casilla}}" hint-placeholder-val="{{si}}"><label class="r212-ot"><input type="checkbox" checked="{{o.on}}" onChange="{{o.alternar}}">{{o.n}}</label></sc-if>'
        f'<sc-if value="{{{{o.tilde}}}}" hint-placeholder-val="{{{{no}}}}"><span class="r212-ot"><span class="r212-si">{TILDE}</span>{{{{o.n}}}}</span></sc-if>'
        '</sc-for></span></sc-if></div></sc-for></div>'
    )


# ---------------------------------------------------------------------------------------------------------------- Rol (compu)
ERROR = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5"/><path d="M12 16.2h.01"/></svg>')
ROL_CAJA_VIEJA = re.compile(r'<div class="w-caja"><div class="w-cab"><span>Permisos</span></div>.*?</sc-for></sc-if></sc-for></sc-if></div>', re.S)
ROL_CAJA = (
    f'<sc-if value="{{{{errPermisos}}}}" hint-placeholder-val="{{{{no}}}}"><div class="w-cartel o-prob r212-err" role="alert">'
    f'<span style="color: currentColor; display: inline-flex;">{ERROR}</span><span class="tx">{{{{errPermisos}}}}</span></div></sc-if>'
    '<div class="w-caja r212-caja">'
    + plantilla("permFilas", "permClase", "permOtros", "editable",
                vacio='<sc-if value="{{sinVale}}" hint-placeholder-val="{{no}}"><div class="r212-vacio">Elegí dónde vale el rol para ver sus permisos.</div></sc-if>')
    + "</div>"
)
ROL_TITULO = ('<h1>{{titulo}}</h1>',
              '<div class="r212-tit"><h1>{{titulo}}</h1><sc-if value="{{sistema}}" hint-placeholder-val="{{no}}">'
              f'<span class="r212-i" tabindex="0" role="img" aria-label="{{{{porQueSistema}}}}">{INFO}<span class="r212-tip" role="tooltip">{{{{porQueSistema}}}}</span></span>'
              '</sc-if></div>')
ROL_CATALOGO_VIEJO = re.compile(r"// GET /api/permissions: el catálogo agrupado por área y alcance\.\nconst AREAS_ORG = \[\n.*?\n\];\n"
                                r"// De la plantilla, en cada empresa, solo existen los permisos de miembros\. Los módulos de cada producto suman sus áreas acá\.\n"
                                r"const AREAS_EMPRESA = \[\n.*?\n\];\n", re.S)
ROL_CATALOGO = ("// GET /api/permissions: el catálogo agrupado por área (lo que va antes del último punto del código) y alcance.\n"
                + js_cat("AREAS_ORG", ORG)
                + "// De la plantilla, en cada empresa, solo existen los permisos de miembros. Los módulos de cada producto suman sus áreas acá.\n"
                + js_cat("AREAS_EMPRESA", EMPRESA))
ROL_MODO = ("MODOS['Guardar: demasiados pedidos'] = { ...MODOS['Editar el rol Solo lectura'], limite: true };\n",
            "MODOS['Guardar: demasiados pedidos'] = { ...MODOS['Editar el rol Solo lectura'], limite: true };\n"
            f"// 212: qué permite cada permiso va en la (i) de su área, un permiso por renglón.\nMODOS['{AYUDA_ABIERTA}'] = {{ ...MODOS['Editar el rol Recursos humanos'], ayuda: 'Usuarios' }};\n")
ROL_OPCIONES = ('"Ver el rol Dueño","Guardar: demasiados pedidos"]', f'"Ver el rol Dueño","Guardar: demasiados pedidos","{AYUDA_ABIERTA}"]')
ROL_AREAS_VIEJAS = re.compile(r"      areas: cat\.map\(\(a\) => \{\n.*?\n      \}\),\n    \};\n  \}\n\}\n", re.S)
ROL_AREAS = (
    "      // 212: los permisos, en una matriz; un rol de sistema se lee con tildes y su porqué va en la (i) del título.\n"
    "      permClase: matrizClase(cat, !!m.sistema),\n"
    "      permOtros: matrizConOtros(cat),\n"
    f"      porQueSistema: '{POR_QUE_DUENO}',\n"
    "      permFilas: matrizFilas(cat, s.elegidos, () => this.state.elegidos, (nueva) => this.setState({ elegidos: nueva, errPermisos: '' }), { leer: !!m.sistema, abierta: m.ayuda }),\n"
    "    };\n  }\n}\n"
)


def rol(t):
    if ROL_CAJA not in t:
        assert len(ROL_CAJA_VIEJA.findall(t)) == 1, "Rol: la caja de permisos"
        t = ROL_CAJA_VIEJA.sub(lambda m: ROL_CAJA, t)
    t = cambiar(t, *ROL_TITULO, 1)
    if ROL_CATALOGO not in t:
        assert len(ROL_CATALOGO_VIEJO.findall(t)) == 1, "Rol: el catálogo"
        t = ROL_CATALOGO_VIEJO.sub(lambda m: ROL_CATALOGO, t)
    t = cambiar(t, *ROL_MODO, 1)
    t = cambiar(t, *ROL_OPCIONES, 1)
    if ROL_AREAS not in t:
        assert len(ROL_AREAS_VIEJAS.findall(t)) == 1, "Rol: las áreas"
        t = ROL_AREAS_VIEJAS.sub(lambda m: ROL_AREAS, t)
    return con_estilo(con_js(t), CSS_COMPU)


# ---------------------------------------------------------------------------------------------------------------- M-Rol (teléfono)
MROL_GRUPO = re.compile(r'<span class="ap-gtit" style="margin: 6px 0 -6px;">Permisos</span><div class="ap-grupo" style="margin: 0;">'
                        r'((?:<div class="ap-(?:area|perm)">.*?</div>)+)</div>', re.S)
MROL_GRUPO_NUEVO = re.compile(r'<span class="ap-gtit" style="margin: 6px 0 -6px;">Permisos</span><div class="r212t marco".*?</div></div>(?=</div><(?:div class="ap-fijo"|nav ))', re.S)
# Lo que tiene cada estado, como lo dibujaba: e0 y e4, una empresa con «Ver miembros»; e2, Recursos humanos con Usuarios; e3, el Dueño.
MROL = {
    "e0": (EMPRESA, ["company.members.read"], False),
    "e4": (EMPRESA, ["company.members.read"], False),
    "e3": (ORG, TODOS_ORG, True),
    "e2": (ORG, ["users.read", "users.invite", "users.manage"], False),
}
MROL_DUENO = ('<div class="tit"><h1>Dueño</h1>', f'<div class="tit"><div class="r212-tit"><h1>Dueño</h1>{info_tel(POR_QUE_DUENO)}</div>')
MROL_ESTADO = ('      e4: e === "Guardar: demasiados pedidos",\n',
               '      e4: e === "Guardar: demasiados pedidos",\n'
               f'      // 212: qué permite cada permiso va en la (i) de su área, un permiso por renglón.\n      e5: e === "{AYUDA_ABIERTA}",\n')
MROL_OPCIONES = ('"Crear un rol","Guardar: demasiados pedidos"]', f'"Crear un rol","Guardar: demasiados pedidos","{AYUDA_ABIERTA}"]')
GTIT = '<span class="ap-gtit" style="margin: 6px 0 -6px;">Permisos</span>'


def estados_tel(t):
    """Cada `<sc-if value="{{eN}}">` de primer nivel del teléfono, con dónde empieza y termina."""
    marcas = [(m.group(1), m.start()) for m in re.finditer(r'<sc-if value="\{\{(e\d+)\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">', t)]
    fin = t.index('<span class="ap-raya"></span></div>\n</x-dc>')
    return {e: (i, marcas[k + 1][1] if k + 1 < len(marcas) else fin) for k, (e, i) in enumerate(marcas)}


def m_rol(t):
    pos = estados_tel(t)
    partes, ultimo = [], 0
    for e, (i, f) in sorted(pos.items(), key=lambda x: x[1][0]):
        bloque = t[i:f]
        if e in MROL:
            cat, elegidos, leer = MROL[e]
            nuevo = GTIT + bandas(cat, elegidos, leer)
            viejos = MROL_GRUPO.findall(bloque)
            if viejos:
                assert len(viejos) == 1, e
                tiene = set(re.findall(r'<div class="ap-perm"><span class="ap-chk on[^"]*">.*?</span>([^<]+)</div>', viejos[0]))
                assert tiene <= {NOMBRES[c] for c in elegidos}, (e, tiene)
                bloque = MROL_GRUPO.sub(lambda m: nuevo, bloque)
            elif e != "e5":
                assert bloque.count(nuevo) == 1, ("M-Rol: no encuentro los permisos de", e)
        partes.append(t[ultimo:i] + bloque)
        ultimo = f
    t = "".join(partes) + t[ultimo:]
    t = cambiar(t, *MROL_DUENO, 1)
    # El estado nuevo: Recursos humanos con la (i) de Usuarios abierta, después del de Recursos humanos.
    pos = estados_tel(t)
    if "e5" not in pos:
        i, f = pos["e2"]
        e2 = t[i:f]
        abierta = e2.replace(GTIT + bandas(ORG, MROL["e2"][1]), GTIT + bandas(ORG, MROL["e2"][1], abierta="Usuarios"))
        assert abierta != e2
        t = t[:f] + abierta.replace('<sc-if value="{{e2}}"', '<sc-if value="{{e5}}"', 1) + t[f:]
    t = cambiar(t, *MROL_ESTADO, 1)
    t = cambiar(t, *MROL_OPCIONES, 1)
    return con_estilo(t, CSS_TEL)


# ---------------------------------------------------------------------------------------------------------------- Cuenta-Plat (compu)
LAURA = ["platform.tenants.read", "platform.recoveries.manage"]
JULIETA = ["platform.tenants.read", "platform.accounts.read", "platform.audit.read"]
ELIGE = ["platform.tenants.read", "platform.recoveries.manage", "platform.audit.read"]
VUELTA = ["platform.tenants.read", "platform.accounts.manage", "platform.recoveries.manage", "platform.audit.read"]
CP_TAB = re.compile(r'(<div class="tarjeta)(" role="tabpanel" aria-label="Permisos" style="[^"]*">)'
                    r'<sc-if value="\{\{opActivo\}\}" hint-placeholder-val="\{\{no\}\}">((?:<div class="o-fila"><span class="dos">.*?</div>)+)</sc-if>'
                    r'<sc-if value="\{\{opInv\}\}" hint-placeholder-val="\{\{no\}\}">((?:<div class="o-fila"><span class="dos">.*?</div>)+)</sc-if></div>', re.S)
CP_ELIGE = re.compile(r'<div class="campo2 envoltura ancho"><span class="et">Permisos de plataforma</span><button type="button" class="in2" '
                      r'aria-haspopup="listbox" aria-expanded="true">.*?</button><div class="menu lista" role="listbox" aria-multiselectable="true"[^>]*>'
                      r'((?:<label class="op2">.*?</label>)+)</div></div>', re.S)
CP_VUELTA = re.compile(r'<div class="campo2 envoltura ancho"><span class="et">Permisos de plataforma</span><button type="button" class="in2" '
                       r'aria-haspopup="listbox" aria-expanded="false"><span class="val">([^<]+)</span><svg.*?</svg></button></div>', re.S)


def tildados(filas):
    return [m for m in re.findall(r'<span class="c1">([^<]+)</span><span class="n2">[^<]*</span></span><span class="o-perm si">', filas)]


def elegir_plat(elegidos, id_):
    return (f'<div class="campo2 ancho"><span class="et" id="{id_}">Permisos de plataforma</span><div class="r212-marco">'
            + matriz(PLAT, elegidos, etiqueta=f'aria-labelledby="{id_}"') + "</div></div>")


def nombres_a_codigos(texto):
    partes = re.split(r", | y ", texto)
    return [NOMBRES_PLAT[p] for p in partes]


def cuenta_plat(t):
    tab_activo, tab_inv = matriz(PLAT, LAURA, leer=True), matriz(PLAT, JULIETA, leer=True)
    nuevo_tab = (f'<div class="tarjeta r212-caja" role="tabpanel" aria-label="Permisos" style="margin-top: 11.5px/*16px*/;">'
                 f'<sc-if value="{{{{opActivo}}}}" hint-placeholder-val="{{{{no}}}}">{tab_activo}</sc-if>'
                 f'<sc-if value="{{{{opInv}}}}" hint-placeholder-val="{{{{no}}}}">{tab_inv}</sc-if></div>')
    m = CP_TAB.search(t)
    if m:
        assert len(CP_TAB.findall(t)) == 1
        assert [NOMBRES_PLAT[n] for n in tildados(m.group(3))] == LAURA, tildados(m.group(3))
        assert [NOMBRES_PLAT[n] for n in tildados(m.group(4))] == JULIETA, tildados(m.group(4))
        t = t[:m.start()] + nuevo_tab + t[m.end():]
    else:
        assert t.count(nuevo_tab) == 1, "Cuenta-Plat: la pestaña Permisos"
    elige = elegir_plat(ELIGE, "r212-et-perm")
    m = CP_ELIGE.search(t)
    if m:
        marcados = re.findall(r'<input type="checkbox" checked><span><span class="opn">([^<]+)</span>', m.group(1))
        assert [NOMBRES_PLAT[n] for n in marcados] == ELIGE, marcados
        t = t[:m.start()] + elige + t[m.end():]
    else:
        assert t.count(elige) == 1, "Cuenta-Plat: Cambiar permisos"
    vuelta = elegir_plat(VUELTA, "r212-et-perm2")
    m = CP_VUELTA.search(t)
    if m:
        assert nombres_a_codigos(m.group(1)) == VUELTA, m.group(1)
        t = t[:m.start()] + vuelta + t[m.end():]
    else:
        assert t.count(vuelta) == 1, "Cuenta-Plat: Cambiar permisos, de vuelta"
    return con_estilo(t, CSS_COMPU)


# ---------------------------------------------------------------------------------------------------------------- M-Cuenta-Plat (teléfono)
MCP_LISTA = re.compile(r'<div class="ap-cuerpo">((?:<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">.*?</div></div>)+)</div>', re.S)
MCP_ELIGE = re.compile(r'<div class="ap-cmp"><span class="rt"><span>Permisos de plataforma</span></span><div class="ct sel">([^<]+)<svg.*?</svg></div></div>', re.S)
MCP_HOJA = ('<div class="ap-hoja" role="dialog" aria-label="Cambiar permisos de Laura Díaz">',
            '<div class="ap-hoja r212t-hoja" role="dialog" aria-label="Cambiar permisos de Laura Díaz">')
MCP_JULIETA = {"e5", "e6"}


def m_cuenta_plat(t):
    pos = estados_tel(t)
    partes, ultimo = [], 0
    for e, (i, f) in sorted(pos.items(), key=lambda x: x[1][0]):
        bloque = t[i:f]
        if e != "e0":
            elegidos = JULIETA if e in MCP_JULIETA else LAURA
            nuevo = '<div class="ap-cuerpo">' + bandas(PLAT, elegidos, leer=True, marco=False) + "</div>"
            m = MCP_LISTA.search(bloque)
            if m:
                assert len(MCP_LISTA.findall(bloque)) == 1, e
                tiene = re.findall(r'<span class="q">([^<]+)</span><span class="ap-perm si">', m.group(1))
                assert [NOMBRES_PLAT[n] for n in tiene] == elegidos, (e, tiene)
                bloque = bloque[:m.start()] + nuevo + bloque[m.end():]
            else:
                assert bloque.count(nuevo) == 1, ("M-Cuenta-Plat: no encuentro los permisos de", e)
            m = MCP_ELIGE.search(bloque)
            if m:
                elegidos = nombres_a_codigos(m.group(1))
                assert elegidos in (ELIGE, VUELTA), (e, m.group(1))
                hoja = ('<div class="ap-cmp"><span class="rt"><span id="r212-et-perm">Permisos de plataforma</span></span>'
                        + bandas(PLAT, elegidos, etiqueta='aria-labelledby="r212-et-perm"') + "</div>")
                bloque = bloque[:m.start()] + hoja + bloque[m.end():]
        partes.append(t[ultimo:i] + bloque)
        ultimo = f
    t = "".join(partes) + t[ultimo:]
    for elegidos in (ELIGE, VUELTA):
        assert t.count(bandas(PLAT, elegidos, etiqueta='aria-labelledby="r212-et-perm"')) == 1
    t = cambiar(t, *MCP_HOJA, 2)
    return con_estilo(t, CSS_TEL)


# ---------------------------------------------------------------------------------------------------------------- Cuentas (compu)
CU_ELIGE = re.compile(r'<div class="campo2 envoltura ancho">\n\s*<span class="et"><span id="et-Permisos">Permisos de plataforma</span></span>\n'
                      r'\s*<button type="button" class="in2" aria-haspopup="listbox".*?</sc-if>\n(\s*)</div>\n', re.S)
CU_NUEVO = ('<div class="campo2 ancho">\n              <span class="et"><span id="et-Permisos">Permisos de plataforma</span></span>\n'
            '              <div class="r212-marco">'
            + plantilla("permFilas", "permClase", "permOtros", "si").replace('aria-label="Permisos"', 'aria-labelledby="et-Permisos"')
            + "</div>\n            </div>\n")
CU_CATALOGO_VIEJO = re.compile(r"const PERMISOS_PLAT = \[\n.*?\n\];\n", re.S)
CU_CATALOGO = ("// 212: los permisos de un operador, por área, como `permissionCatalog.ts`: los del núcleo, los de los módulos y, al final,\n"
               "// «Cambiar la configuración».\n" + js_cat("AREAS_PLAT", PLAT))
CU_VARIOS = ("      ...this.varios('Permisos', 'permisos', PERMISOS_PLAT, 'Ninguno'),\n",
             "      // 212: los permisos del operador, en la matriz de los roles.\n"
             "      permClase: matrizClase(AREAS_PLAT, false),\n"
             "      permOtros: matrizConOtros(AREAS_PLAT),\n"
             "      permFilas: matrizFilas(AREAS_PLAT, s.permisos, () => this.state.permisos, (nueva) => this.setState({ permisos: nueva })),\n")


def cuentas(t):
    if CU_NUEVO not in t:
        assert len(CU_ELIGE.findall(t)) == 1, "Cuentas: Permisos de plataforma"
        t = CU_ELIGE.sub(lambda m: CU_NUEVO, t)
    if CU_CATALOGO not in t:
        assert len(CU_CATALOGO_VIEJO.findall(t)) == 1, "Cuentas: el catálogo"
        t = CU_CATALOGO_VIEJO.sub(lambda m: CU_CATALOGO, t)
    t = cambiar(t, *CU_VARIOS, 1)
    assert "PERMISOS_PLAT" not in t
    return con_estilo(con_js(t), CSS_COMPU)


PASOS = {"Rol": rol, "M-Rol": m_rol, "Cuenta-Plat": cuenta_plat, "M-Cuenta-Plat": m_cuenta_plat, "Cuentas": cuentas}

if __name__ == "__main__":
    cambiados = []
    for nombre in TABLEROS:
        t, crlf = leer(nombre)
        nuevo = PASOS[nombre](t)
        # Lo que la regla saca no queda en ningún lado.
        for viejo in ("o-flecha", "alternarArea", "abiertaArea", "Expandir todo", "Permisos de plataforma</span><button"):
            assert viejo not in nuevo.split("</helmet>", 1)[1], (nombre, viejo)
        if nuevo != t:
            escribir(nombre, nuevo, crlf)
            cambiados.append(nombre)
    print("ok", len(TABLEROS), "tableros,", len(cambiados), "cambiados")
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(TABLEROS))
