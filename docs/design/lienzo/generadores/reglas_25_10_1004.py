"""Las reglas del usuario del 2026-10-25 que valen para todo el lienzo (pedidos que pasó la Guía, maqueta cde670e):
- el teléfono de la vista previa va sin rótulo: sale «Así lo ve quien lo recibe» de arriba del teléfono, en todos los
  tableros vigentes (el editor del formulario, las plantillas y los catálogos); en el teléfono queda el ojo con su hoja;
- «Criterio · Tablas y listas»: un dato por celda, en un renglón (front 4fdcab2b), y las fechas completas, con año y hora,
  en la zona de quien mira (formatos.md, d7644064). Lo que aclaraba una celda va en su propia columna o no va.

Desde la v143 (el usuario, 25/10, por la Guía): la columna por la que está ordenada una tabla muestra ▲ o ▼; las listas cortas
de la compu también llevan un renglón por fila (lo que aclaraba va a la derecha, como su estado con punto), en el criterio y en
«Cómo entrás» de Mi cuenta; la versión nueva del sistema se avisa en la campana (campana_1004.py), así que sale de Avisos; y un
solo verbo para dejar de usar algo sin borrarlo, «Dar de baja» y «Reactivar», con el estado «De baja», en todos los tableros vigentes.
Desde la v144 (el usuario, 26/10): borrar la cuenta propia es «Borrar mi cuenta», con el estado «Por borrar», y borrar para
siempre es «Borrar», nunca «Eliminar».

Los tableros de las etapas que se redibujan (12, 13 y 14 primero) lo aplican en su generador; los de las etapas cerradas
cambian en la base de la 12. Corre después de `formularios_14_formularios_1004.py` y antes de `formularios_etapas_1004.py`.
Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
ROTULO = re.compile(r'<div class="pv-tit"><span class="pv-tit2">Así lo ve quien lo recibe</span>(?:<span class="pv-pant">· ([^<]*)</span>)?</div>')


def sin_rotulo(t):
    # Con más de una pantalla queda cuál es, sin el rótulo
    return ROTULO.sub(lambda m: f'<div class="pv-tit"><span class="pv-pant">{m.group(1)[0].upper() + m.group(1)[1:]}</span></div>' if m.group(1) else "", t)


# ================================================================ Criterio · Tablas y listas
MARCA = 'data-reglas="25-10"'
CSS = """<style data-reglas="25-10">
.tb .th, .tb .tr { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 1fr) 140px 48px; }
.tb .tr .num { font-variant-numeric: tabular-nums; }
.tb .th .ord, .w-th .ord { margin-left: 4px; font-size: 10px; color: var(--t2); }
.lista .it .dato { flex-direction: row; align-items: center; gap: 16px; }
.lista .it .dato > .l2 { margin-left: auto; width: 230px; flex: none; font-size: 13px; color: var(--t2); display: inline-flex; align-items: center; gap: 6px; }
.lista .it .dato > .l2::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }
.lista .it .dato > .l2.off::before { background: oklch(0.75 0.01 78); }
.lista .it .dato > .l2.pend::before { background: oklch(0.72 0.15 70); }
</style>
</helmet>"""
GUION = '<span class="nada">—</span>'
FILAS = [  # usuario, correo, rol en la organización, empresa, estado, vencimiento, ⋮ abierto
    ("Lucía Fernández", "lucia.fernandez@delta.ejemplo.com", "Dueño", "Delta S.A.", '<span class="est ok">Activo</span>', GUION, False),
    ("Tomás Acosta", "tomas.acosta@delta.ejemplo.com", GUION, "Delta S.A.", '<span class="est ok">Activo</span>', GUION, True),
    ("Julieta Sosa", "julieta.sosa@delta.ejemplo.com", "Auditor", GUION, '<span class="est ok">Activo</span>', GUION, False),
    ("Diego Ríos", "diego.rios@delta.ejemplo.com", GUION, "Delta S.A.", '<span class="est alerta">Baja pedida</span>', GUION, False),
    ("Martín Paz", "martin.paz@delta.ejemplo.com", GUION, "Delta S.A.", '<span class="est ok">Activo</span>', GUION, False),
    ("Marcos Giménez", "marcos.gimenez@delta.ejemplo.com", GUION, GUION, '<span class="est off">Deshabilitado</span>', GUION, False),
    ("Sofía Herrera", "sofia.herrera@delta.ejemplo.com", GUION, "Delta S.A.", '<span class="est pend">Invitación pendiente</span>', "02/10/2026 18:00", False),
]
TEXTOS = [
    ('<span class="l2">Administrado por Grupo Delta</span>', '<span class="l2 off">Administrado por Grupo Delta</span>'),
    ('<span class="l2">Sin verificar</span>', '<span class="l2 pend">Sin verificar</span>'),
    ("<li><strong>Sin encabezado de columnas.</strong> Filas de 44 px; con segunda línea, 56 px.</li>",
     "<li><strong>Sin encabezado de columnas.</strong> Filas de 44 px, de un renglón.</li>"),
    ("<li><strong>Lo que aclara cada fila</strong> («Principal», «Sin verificar») va en la segunda línea, en gris. Nunca como etiqueta ni como texto suelto a la derecha.</li>",
     "<li><strong>Lo que aclara cada fila</strong> («Principal», «Sin verificar») va a la derecha, en la misma fila, como su estado con punto. Nunca en una segunda línea ni como etiqueta.</li>"),
    ("<strong>Fila de lista</strong><span>44 o 56 px</span><span>Letra de 13. Lo que aclara la fila, en una segunda línea gris de 12.</span>",
     "<strong>Fila de lista</strong><span>44 px</span><span>Un renglón con letra de 13: el dato, su estado a la derecha y el ⋮.</span>"),
    ("<li><strong>Filas de 40 px</strong>; si alguna tiene segunda línea, todas las de la tabla son de 52. Letra de hoy (13), alternadas. Al pasar el mouse, petróleo claro.</li>",
     "<li><strong>Filas de 40 px</strong>, alternadas, con letra de 13. Al pasar el mouse, petróleo claro.</li>"),
    ("<li><strong>Un tema por columna.</strong> Debajo, en gris, lo que lo aclara: el correo, el rol en la empresa, cuándo vence. Sin dato, una sola raya.</li>",
     "<li><strong>Un dato por celda, en un renglón.</strong> Lo que lo aclara va en su propia columna si la persona lo necesita (Correo, Vencimiento), o no va. Sin dato, una sola raya.</li>"
     "\n        <li><strong>Las fechas, completas:</strong> 25/10/2026 18:07, con año y hora, en la zona de quien mira. Nunca «hoy», «ayer» ni «hace 2 horas».</li>"),
    ("<strong>Fila de tabla</strong><span>40 o 52 px</span><span>52 en toda la tabla si alguna fila tiene segunda línea. Letra de 13, la de hoy; la segunda línea, gris de 12. Una fila sí y otra no, arena muy suave. Al pasar el mouse, petróleo claro.</span>",
     "<strong>Fila de tabla</strong><span>40 px</span><span>Un dato por celda, en un renglón, con letra de 13. Una fila sí y otra no, arena muy suave. Al pasar el mouse, petróleo claro.</span>"),
    ("<li>Dos datos sin relación en la misma celda: la segunda línea solo aclara la primera.</li>",
     "<li>Dos datos en la misma celda, también en una segunda línea gris: el correo debajo del nombre, «Vence…» debajo del estado.</li>"),
    ("<li>Una columna aparte para algo que aclara otra: el correo va debajo del nombre.</li>",
     "<li>Fechas sin año, «hoy», «ayer» o «hace 2 horas».</li>"),
]


def criterio_tablas(t):
    """Idempotente: rehace el bloque de estilo y la tabla de ejemplo, y cambia los textos que todavía no cambió."""
    if MARCA in t:
        k = t.index('<style data-reglas="25-10">')
        t = t[:k] + CSS + t[t.index("</helmet>", k) + len("</helmet>"):]
    else:
        t = t.replace("</helmet>", CSS, 1)
    i = t.index('<div class="th"><span', t.index('<div class="tb">'))
    j = t.index('<div class="pie">', i)
    filas = ""
    for n, correo, rol, empresa, estado, vence, menu in FILAS:
        filas += (f'<div class="tr{" h" if menu else ""}"><span class="n">{n}</span><span>{correo}</span><span>{rol}</span><span>{empresa}</span><span>{estado}</span>'
                  f'<span class="num">{vence}</span><span class="der"><button type="button" class="ib{" h" if menu else ""}" aria-label="Acciones de {n}">{KEBAB}</button>'
                  + (MENU if menu else "") + "</span></div>\n        ")
    th = ('<div class="th"><span aria-sort="ascending">Usuario<span class="ord" aria-hidden="true">▲</span></span><span>Correo</span><span>Rol en la organización</span><span>Empresa</span><span>Estado</span>'
          '<span>Vencimiento</span><span class="sr">Acciones</span></div>\n        ')
    t = t[:i] + th + filas + t[j:]
    for a, b in TEXTOS:
        assert t.count(a) == 1 or b.splitlines()[0] in t, a[:60]
        t = t.replace(a, b)
    ordenada = "<li><strong>La columna ordenada</strong> muestra ▲ o ▼ en su encabezado; tocarla invierte el orden. Las demás, sin flecha.</li>"
    if ordenada not in t:
        a = "<li><strong>Las fechas, completas:</strong>"
        assert t.count(a) == 1
        t = t.replace(a, ordenada + "\n        " + a)
    return t


KEBAB = MENU = ""


# ================================================================ «Cómo entrás» de Mi cuenta: un renglón por fila, con el estado a la derecha
CSS_CUENTA = """<style data-reglas="25-10">
.w-it .dato { flex-direction: row; align-items: center; gap: 16px; }
.w-it .dato > b { flex: none; width: 380px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.w-it .dato > .w-est { flex: none; width: 260px; font-size: 13px; color: var(--t2); }
</style>
</helmet>"""
ESTADOS_CUENTA = [("Principal · Administrado por Grupo Delta", ""), ("Principal", ""), ("Administrado por Grupo Delta", " off"), ("Sin verificar", " pend"),
                  ("Sin vincular", " off")]


def cuenta(t):
    if MARCA in t:
        k = t.index('<style data-reglas="25-10">')
        return t[:k] + CSS_CUENTA + t[t.index("</helmet>", k) + len("</helmet>"):]
    t = t.replace("</helmet>", CSS_CUENTA, 1)
    for texto, clase in ESTADOS_CUENTA:
        t = t.replace(f"</b><span>{texto}</span></span>", f'</b><span class="w-est{clase}">{texto}</span></span>')
    return t


def sin_version(t):
    """La versión nueva va en la campana (campana_1004.py): sale el caso de Avisos y su franja."""
    import json as _json
    m = re.search(r"data-props='([^']*)'", t)
    props = _json.loads(m.group(1))
    if "Versión nueva" not in props["caso"]["options"]:
        return t
    props["caso"]["options"].remove("Versión nueva")
    t = t[:m.start()] + "data-props='" + _json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'" + t[m.end():]
    for inicio in ('<sc-if value="{{versionNueva}}"', '<sc-if value="{{e7}}"'):
        while inicio in t:
            i = t.index(inicio)
            nivel = 0
            for x in re.finditer(r"<sc-if\b|</sc-if>", t[i:]):
                nivel += 1 if x.group(0) == "<sc-if" else -1
                if nivel == 0:
                    t = t[:i] + t[i + x.end():]
                    break
    return t


# ================================================================ «Dar de baja» y «Reactivar» (v143)
# Un solo verbo para dejar de usar algo sin borrarlo, en todo el sistema (el usuario, 25/10, front 744e3931): «Dar de baja» y
# «Reactivar»; el estado es «De baja» y la opción del filtro, «Dados de baja». Salen «Deshabilitar/Habilitar» (usuarios),
# «Inactivar/Activar» (roles y empresas) e «Inactivo». No cambian «Baja pedida» ni «Revocar invitación», ni «Activar» la app de
# autenticación del operador, ni «deshabilitado» cuando es un campo o un botón grisado. Las palabras van enteras: los nombres del
# código del tablero (esDeshabilitado, puedeInactivar) quedan como están.
_LETRA = "A-Za-zÁÉÍÓÚáéíóúÑñ"
BAJA_PALABRAS = [("Deshabilitamos", "Dimos de baja"), ("Deshabilitados", "Dados de baja"), ("Deshabilitadas", "Dadas de baja"),
                 ("Deshabilitado", "De baja"), ("Deshabilitada", "De baja"), ("Deshabilitar", "Dar de baja"), ("Deshabilitó", "Dio de baja"),
                 ("Habilitamos", "Reactivamos"), ("Habilitar", "Reactivar"), ("Habilitó", "Reactivó"),
                 ("Inactivamos", "Dimos de baja"), ("Inactivar", "Dar de baja"), ("Inactivos", "Dados de baja"), ("Inactivas", "Dadas de baja"),
                 ("Inactivo", "De baja"), ("Inactiva", "De baja"), ("Dado de baja", "De baja"), ("Dada de baja", "De baja")]
BAJA_FRASES = [("No podés deshabilitarte a vos misma.", "No podés darte de baja a vos misma."), ("y deshabilita usuarios", "y da de baja usuarios"),
               ("antes de deshabilitarte", "antes de darte de baja"), ("(deshabilitado)", "(de baja)"), ("Empresa: acceso deshabilitado", "Empresa: de baja"),
               ("Cuenta inactiva", "Cuenta de baja"), ("está inactiva:", "está de baja:"), ("'Dar de baja' : 'Activar'", "'Dar de baja' : 'Reactivar'"), ("this.avisar('Activamos '", "this.avisar('Reactivamos '"),
               ("Dar de baja · Quitar · Desactivar · Eliminar", "Dar de baja · Quitar · Eliminar"), ("Usuario deshabilitado", "Usuario de baja"),
               ("está deshabilitado</h1>", "está de baja</h1>"), ("que te vuelva a habilitar.", "que te reactive."),
               ("Editar, deshabilitar y activar usuarios.", "Editar, dar de baja y reactivar usuarios."), ("Los deshabilitados no se ofrecen.", "Los dados de baja no se ofrecen."),
               ('<span class="est">De baja</span>', '<span class="est off">De baja</span>')]
# El punto del estado «De baja» va gris, como en las demás listas (Criterio · Menús lo tenía verde)
EST_PUNTO = '.est::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }'
EST_OFF = "\n.est.off::before { background: oklch(0.72 0.01 78); }"


def dar_de_baja(t):
    for viejo, nuevo in BAJA_PALABRAS:
        t = re.sub(rf"(?<![{_LETRA}]){viejo}(?![{_LETRA}])", nuevo, t)
    for viejo, nuevo in BAJA_FRASES:
        t = t.replace(viejo, nuevo)
    if '<span class="est off">De baja</span>' in t and EST_OFF.strip() not in t:
        t = t.replace(EST_PUNTO, EST_PUNTO + EST_OFF, 1)
    return t


# ================================================================ «Borrar mi cuenta» y «Por borrar» (v144)
# Borrar la cuenta propia nunca dice «dar de baja», que es reversible (el usuario, 26/10, front 87609fd0): «Borrar mi cuenta», el
# estado «Por borrar» y, donde se ve el detalle, «Se borra el …» con fecha y hora; en Plataforma, «¿Borrar la cuenta de …?». El
# sustantivo pasa a «el borrado». Los nombres de las plantillas de WhatsApp (baja_cuenta_pedida y las demás) no cambian. Los miembros
# de una empresa: «Dar de baja» y «Reactivar» en vez de «Quitar de la empresa» y «Volver a sumar».
BORRAR_FRASES = [("Dar de baja mi cuenta", "Borrar mi cuenta"), ("¿Dar de baja tu cuenta?", "¿Borrar tu cuenta?"),
                 ("No podés dar de baja tu cuenta", "No podés borrar tu cuenta"), ('aria-label="Dar de baja tu cuenta"', 'aria-label="Borrar tu cuenta"'),
                 ("'¿Dar de baja la cuenta de '", "'¿Borrar la cuenta de '"),
                 ("Tu cuenta tiene la baja pedida", "Tu cuenta está por borrarse"), ("Cancelar la baja y entrar", "Cancelar el borrado y entrar"),
                 ("Cuenta con la baja pedida", "Cuenta por borrar"), ("Diego (baja pedida)", "Diego (por borrar)"), ("Baja pedida", "Por borrar"),
                 ("Cerramos tu sesión por la baja", "Cerramos tu sesión por el borrado"),
                 ("podés cancelar la baja; después eliminamos tu cuenta", "podés cancelar el borrado; después borramos tu cuenta"),
                 ("Tiene 30 días para cancelar la baja ingresando; después se elimina la cuenta. La plataforma no puede cancelarla.",
                  "Tiene 30 días para cancelar el borrado ingresando; después se borra la cuenta. La plataforma no puede cancelarlo."),
                 ("Pidió la baja de su cuenta. Se elimina el {{seElimina}}.", "Pidió borrar su cuenta. Se borra el {{seElimina}}."),
                 ("Se elimina el {{seElimina}}.", "Se borra el {{seElimina}}."), ("'Pidió la baja de su cuenta'", "'Pidió borrar su cuenta'"),
                 ("'Inició la baja de la cuenta'", "'Pidió borrar la cuenta'"),
                 ("'La plataforma inició la baja el' : 'Pidió la baja el'", "'La plataforma pidió borrarla el' : 'Pidió borrarla el'"),
                 ("seElimina: '27/10/2026'", "seElimina: '27/10/2026 09:15'"), ("bajaPedidaEl: '27/09/2026'", "bajaPedidaEl: '27/09/2026 09:15'"),
                 ("Pediste la baja de tu cuenta", "Pediste borrar tu cuenta"), ("pediste la baja de tu cuenta", "pediste borrar tu cuenta"),
                 ("Cancelaste la baja de tu cuenta", "Cancelaste el borrado de tu cuenta"), ("cancelaste la baja de tu cuenta", "cancelaste el borrado de tu cuenta"),
                 ("La plataforma inició la baja de tu cuenta", "La plataforma pidió borrar tu cuenta"),
                 ("la plataforma inició la baja de tu cuenta", "la plataforma pidió borrar tu cuenta"), ("no podés cancelar la baja", "no podés cancelar el borrado"),
                 ("antes de esa fecha para cancelarla.", "antes de esa fecha para cancelar el borrado."),
                 # los miembros de una empresa
                 ("act || baja ? 'Quitar de la empresa' : 'Volver a sumar'", "act || baja ? 'Dar de baja' : 'Reactivar'"),
                 ("'Volvimos a sumar a ' + m.nombre + '. Dale los roles de nuevo.'", "'Reactivamos a ' + m.nombre + '. Dale los roles de nuevo.'"),
                 ("No podés quitar al último administrador de la empresa.", "No podés dar de baja al último administrador de la empresa."),
                 ("titulo: '¿Quitar a ' + m.nombre + ' de la empresa?'", "titulo: '¿Dar de baja a ' + m.nombre + ' en la empresa?'"),
                 ("boton: 'Quitar', accion: () => { this.setState({ miembros:", "boton: 'Dar de baja', accion: () => { this.setState({ miembros:"),
                 ("'Quitamos a ' + m.nombre + ' de la empresa.'", "'Dimos de baja a ' + m.nombre + ' en la empresa.'"),
                 ("Conserva sus roles por si lo volvés a habilitar.", "Conserva sus roles por si lo reactivás.")]
# El aviso de la plataforma, con la fecha y la hora en que se borra: la de Diego; en Mensajes, la de sus correos (14:35)
BORRAR_TOAST = re.compile(r"'Dimos de baja la cuenta de ' \+ ([\w.]+) \+ '\. Se elimina el 27/10/2026\.'")
BORRAR_FECHA = re.compile(r"([Ss]e) elimina el 27/10/2026(?! \d)")


# Los botones que borran la cuenta dicen «Borrar»: el de Mi cuenta, el de su diálogo y el de Plataforma
BORRAR_BOTONES = [('href="Cuenta-Baja.dc.html">Dar de baja</a>', 'href="Cuenta-Baja.dc.html">Borrar</a>'),
                  ('href="M-Cuenta-Baja.dc.html" style="text-decoration: none;">Dar de baja</a>', 'href="M-Cuenta-Baja.dc.html" style="text-decoration: none;">Borrar</a>'),
                  ('onClick="{{verInfo}}">Dar de baja</button>', 'onClick="{{verInfo}}">Borrar</button>'),
                  ("La plataforma no puede cancelarlo.', boton: 'Dar de baja'", "La plataforma no puede cancelarlo.', boton: 'Borrar'")]
BORRAR_MENU = re.compile(r'(onClick="\{\{(?:c\.)?darDeBaja\}\}">(?:<svg(?:(?!</svg>).)*</svg>)?) Dar de baja</button>', re.S)  # el ⋮ de una cuenta, en Plataforma
BORRAR_CRITERIO = re.compile(r'(¿Borrar tu cuenta\?</strong>(?:(?!</div></div>).)*?<button type="button" class="cb cb-pel lleno">)Dar de baja(</button>)', re.S)


def borrar_cuenta(n, t):
    for viejo, nuevo in BORRAR_FRASES + BORRAR_BOTONES:
        t = t.replace(viejo, nuevo)
    if n in ("Cuenta-Baja", "M-Cuenta-Baja"):  # el diálogo de borrar la cuenta: su botón y el nombre del estado
        t = t.replace("Dar de baja", "Borrar")
    t = BORRAR_CRITERIO.sub(r"\1Borrar\2", t)
    t = BORRAR_MENU.sub(r"\1 Borrar</button>", t)
    t = BORRAR_TOAST.sub(lambda m: f"'La cuenta de ' + {m.group(1)} + ' se borra el 27/10/2026 09:15.'", t)
    return BORRAR_FECHA.sub(lambda m: f"{m.group(1)} borra el 27/10/2026 {'14:35' if n == 'Mensajes' else '09:15'}", t)


# ================================================================ «Borrar», nunca «Eliminar» (v144)
# Borrar para siempre es «Borrar» y «Borrado», nunca «Eliminar» (el usuario, 26/10, front 75663922): el ⋮ de un formulario y su
# diálogo, y una cuenta ya borrada («Borrada», «Borrada el …»). Los nombres de archivo (FRM-Reactivar-Eliminar) y de las plantillas
# de WhatsApp (cuenta_eliminada) no cambian: van pegados a un guion o a un guion bajo.
ELIMINAR_PALABRAS = [("Eliminando", "Borrando"), ("Eliminadas", "Borradas"), ("Eliminados", "Borrados"), ("Eliminada", "Borrada"), ("Eliminado", "Borrado"),
                     ("Eliminamos", "Borramos"), ("Eliminar", "Borrar")]
ELIMINAR_FRASES = [("Cuenta eliminada", "Cuenta borrada"), ("fue eliminada", "fue borrada"), ("Se eliminó la cuenta", "Se borró la cuenta"),
                   ("Reactivar y eliminar", "Reactivar y borrar"), ("reactivar, eliminar y copiar", "reactivar, borrar y copiar"),
                   ("eliminadaEl: '11/09/2026'", "eliminadaEl: '11/09/2026 03:00'")]  # «Borrada el …», con la hora, como su historial


def sin_eliminar(t):
    for viejo, nuevo in ELIMINAR_PALABRAS:
        t = re.sub(rf"(?<![{_LETRA}_-]){viejo}(?![{_LETRA}_-])", nuevo, t)
    for viejo, nuevo in ELIMINAR_FRASES:
        t = t.replace(viejo, nuevo)
    return t


if __name__ == "__main__":
    c = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    archivo = {k[:-8] for k, v in c["boards"].items() if v.get("page") == "archivo"}
    tocados = []
    for f in sorted(PROJ.glob("*.dc.html")):
        n = f.name[:-8]
        if n in archivo or n == "Criterio-Decisiones":
            continue
        t = f.read_text(encoding="utf-8")
        nuevo = sin_rotulo(t)
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
            tocados.append(n)
    print("sin el rótulo de la vista previa:", len(tocados), tocados)
    ruta = PROJ / "Criterio-Tablas.dc.html"
    t = ruta.read_text(encoding="utf-8")
    KEBAB = re.search(r'aria-label="Acciones de Lucía Fernández">(<svg.*?</svg>)</button>', t, re.S).group(1)
    MENU = re.search(r'<div class="menu2" role="menu">.*?(?:Deshabilitar|Dar de baja)</span></div>', t, re.S).group(0)
    ruta.write_text(criterio_tablas(t), encoding="utf-8")
    ruta = PROJ / "Cuenta.dc.html"
    ruta.write_text(cuenta(ruta.read_text(encoding="utf-8")), encoding="utf-8")
    for n in ("Avisos", "M-Avisos"):
        ruta = PROJ / f"{n}.dc.html"
        ruta.write_text(sin_version(ruta.read_text(encoding="utf-8")), encoding="utf-8")
    print("Mi cuenta: «Cómo entrás» en un renglón; Avisos sin la franja de versión nueva")
    print("Criterio · Tablas y listas: un dato por celda y fechas completas")
    tocados = []
    for f in sorted(PROJ.glob("*.dc.html")):
        n = f.name[:-8]
        if n in archivo or n == "Criterio-Decisiones":
            continue
        t = f.read_text(encoding="utf-8")
        nuevo = sin_eliminar(borrar_cuenta(n, dar_de_baja(t)))
        if nuevo != t:
            f.write_text(nuevo, encoding="utf-8")
            tocados.append(n)
    print("«Dar de baja», «Reactivar» y «Borrar mi cuenta»:", len(tocados), tocados)
