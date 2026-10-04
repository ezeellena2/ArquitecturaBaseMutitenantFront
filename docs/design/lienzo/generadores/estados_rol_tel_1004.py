"""M-Rol: los modos que la compu ya tiene (Rol) y el teléfono no dibujaba (relevamiento E1-E6, N3; tanda aprobada por el usuario
el 2026-10-04). Se arman con las piezas de M-Rol y los datos de Rol (AREAS_ORG):
- «Crear un rol»: el subtítulo con el camino («Administración»), los campos vacíos, «Vale en» obligatorio y la nota «Elegí dónde vale
  el rol para ver sus permisos.» en lugar de los permisos. Abajo, «Cancelar» y «Crear rol».
- «Editar el rol Recursos humanos»: un rol de toda la organización con los grupos de permisos. Abierto el que tiene algo marcado
  (Usuarios, 3 de 3) y cerrados los demás. 3 de 16 elegidos, con WhatsApp.
- «Ver el rol Dueño»: el rol de sistema, solo para leer. Los datos como texto, todos los permisos marcados y apagados. Sin botones
  fijos, así que va la barra de abajo de la organización.
Lleva `data-vuelta="1004-estados-rol-tel"`; si ya la tiene, no se toca."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import clonar, marcar, rep  # noqa: E402

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-estados-rol-tel"'
AREAS = [("Usuarios", ["Ver usuarios", "Invitar usuarios", "Administrar usuarios"]), ("Roles", ["Ver roles", "Administrar roles", "Asignar roles"]),
         ("Empresas", ["Ver empresas", "Administrar empresas"]), ("Configuración", ["Ver la configuración", "Cambiar la configuración"]),
         ("Auditoría", ["Ver la auditoría"]), ("Página pública", ["Administrar la página pública"]),
         ("WhatsApp", ["Atender clientes", "Atender internos", "Mandar difusiones", "Administrar WhatsApp"])]

ruta = PROJ / "M-Rol.dc.html"
t = ruta.read_text(encoding="utf-8")
if MARCA not in t:
    roles = (PROJ / "M-Roles.dc.html").read_text(encoding="utf-8")
    i = roles.index('<nav class="ap-nav"')
    nav = roles[i:roles.index("</nav>", i) + len("</nav>")]
    chev = re.search(r'<div class="ap-area"><span style="color: var\(--t3\); display: inline-flex;">(<svg.*?</svg>)</span>', t, re.S).group(1)
    tilde = re.search(r'<span class="ap-chk on">(<svg.*?</svg>)</span>', t, re.S).group(1)
    lista_vieja = re.search(r'<div class="ap-grupo" style="margin: 0;">.*?</div></div>(?=</div><div class="ap-fijo">)', t, re.S).group(0)

    def area(nombre, permisos, marcados, abierta, fijo=False):
        clase = " on" if marcados == len(permisos) else ""
        extra = " fijo" if fijo else ""
        rot = "" if abierta else " transform: rotate(-90deg);"
        cab = (f'<div class="ap-area"><span style="color: var(--t3); display: inline-flex;{rot}">{chev}</span>'
               f'<span class="ap-chk{clase}{extra}">{tilde if clase else ""}</span><span class="n">{nombre}</span><span class="c">{marcados} de {len(permisos)}</span></div>')
        if not abierta:
            return cab
        filas = "".join(f'<div class="ap-perm"><span class="ap-chk{" on" if k < marcados else ""}{extra}">{tilde if k < marcados else ""}</span>{p}</div>'
                        for k, p in enumerate(permisos))
        return cab + filas

    def grupo(contenido):
        return f'<div class="ap-grupo" style="margin: 0;">{contenido}</div>'

    # Envolver el modo de siempre en e0.
    cab, cuerpo = t.split("</helmet>", 1)
    i = cuerpo.index('<div class="ap-est">')
    j = cuerpo.index('<span class="ap-raya">')
    cuerpo = cuerpo[:i] + '<sc-if value="{{e0}}" hint-placeholder-val="{{si}}">' + cuerpo[i:j] + "</sc-if>" + cuerpo[j:]
    t = cab + "</helmet>" + cuerpo
    opciones = ["Editar el rol Solo lectura"]
    props = json.dumps({"estado": {"editor": "enum", "options": opciones, "default": opciones[0], "section": "Estado"},
                        "$preview": {"width": 390, "height": 844}}, ensure_ascii=False, separators=(",", ":"))
    t = rep(t, "data-props='{\"$preview\":{\"width\":390,\"height\":844}}'", f"data-props='{props}'")
    t = rep(t, "class Component extends DCLogic {\n  renderVals() {\n    return { si: true, no: false };\n  }\n}",
            "class Component extends DCLogic {\n  renderVals() {\n    const e = this.props.estado ?? \"Editar el rol Solo lectura\";\n\n"
            "    return {\n      si: true,\n      no: false,\n      e0: e === \"Editar el rol Solo lectura\",\n    };\n  }\n}")

    sub = '<span class="sub">Vale en Delta S.A. · 4 usuarios lo tienen</span>'
    nombre = '<div class="ct">Solo lectura</div>'
    vale = '<span style="font-size: 16px;">Delta S.A.</span>'
    desc = '<div class="ct area">Ve los miembros de la empresa. No cambia nada.</div>'
    conteo = '<span style="font-weight: 500; color: var(--t3);">1 de 2 elegidos</span>'
    fijo = '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button><button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>'
    chev_campo = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
                  'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>')

    t = clonar(t, "e0", "e1", "Crear un rol",
               [("<h1>Solo lectura</h1>", "<h1>Crear un rol</h1>"), (sub, '<span class="sub">Administración</span>'),
                (nombre, '<div class="ct"></div>'),
                ('<span class="rt"><span>Vale en</span></span>' + vale, f'<span class="rt"><span>Vale en <span class="rq">*</span></span></span><div class="ct ph sel">Elegí dónde vale{chev_campo}</div>'),
                (desc, '<div class="ct area"></div>'), (conteo, ""),
                (lista_vieja, '<div class="ap-grupo ap-sin-vale" style="margin: 0;">Elegí dónde vale el rol para ver sus permisos.</div>'),
                (fijo, '<div class="ap-fijo"><button type="button" class="cb cb-sec full">Cancelar</button><button type="button" class="cb cb-pri full">Crear rol</button></div>')])
    rrhh = grupo("".join(area(n, ps, 3 if n == "Usuarios" else 0, n == "Usuarios") for n, ps in AREAS))
    t = clonar(t, "e0", "e2", "Editar el rol Recursos humanos",
               [("<h1>Solo lectura</h1>", "<h1>Recursos humanos</h1>"), (sub, '<span class="sub">Vale en toda la organización · 0 usuarios lo tienen</span>'),
                (nombre, '<div class="ct">Recursos humanos</div>'), (vale, '<span style="font-size: 16px;">Toda la organización</span>'),
                (desc, '<div class="ct area">Invita, edita y deshabilita usuarios.</div>'),
                (conteo, '<span style="font-weight: 500; color: var(--t3);">3 de 16 elegidos</span>'), (lista_vieja, rrhh)])
    dueno = grupo("".join(area(n, ps, len(ps), True, fijo=True) for n, ps in AREAS))
    t = clonar(t, "e0", "e3", "Ver el rol Dueño",
               [("<h1>Solo lectura</h1>", "<h1>Dueño</h1>"), (sub, '<span class="sub">Vale en toda la organización · 1 usuario lo tiene</span>'),
                ('<span class="rt"><span>Nombre <span class="rq">*</span></span></span>' + nombre, '<span class="rt"><span>Nombre</span></span><span style="font-size: 16px;">Dueño</span>'),
                (vale, '<span style="font-size: 16px;">Toda la organización</span>'),
                (desc, '<span style="font-size: 16px;">Tiene todos los permisos de la organización.</span>'),
                (conteo, '<span style="font-weight: 500; color: var(--t3);">16 de 16 elegidos</span>'), (lista_vieja, dueno), (fijo, nav)])
    css = (".ap-cmp .ct.sel { display: flex; align-items: center; justify-content: space-between; text-align: left; }\n"
           ".ap-cmp .ct.sel svg { color: var(--t3); flex-shrink: 0; }\n.ap-cmp .ct.ph { color: var(--t3); }\n"
           ".ap-sin-vale { padding: 14px 16px; font-size: 14.5px; color: var(--t2); }\n"
           ".ap-chk.fijo { opacity: 0.55; }\n")
    ruta.write_text(marcar(t, MARCA, css), encoding="utf-8")
    print("ok M-Rol")
