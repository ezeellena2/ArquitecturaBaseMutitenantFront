"""La tanda «b» del traspaso 10 (§4.3 de su evaluación, 2026-11-07): los tableros del núcleo ya programado, con las reglas que la base
de la 12 trae a la app (decisiones 143, 144, 161, 164, 174, 175 y 179 de la hoja de ruta), y el tablero nuevo de la E21 (159 y 170).

- Los filtros (143 y 144): la opción de un filtro sin su cantidad, también en el dibujo (la pasada de las piezas solo la escondía), en
  Usuarios, Roles, Cuentas, Organizaciones, Empresas, Empresa, Recuperaciones y las dos campanas, que se abren sobre Usuarios y
  Organizaciones. Con `TILDE`, la elegida lleva su tilde a la izquierda (142).
- Las altas dicen «Agregar …»: «Agregar empresa» y, en su diálogo, «Agregar», en Usuario, M-Usuario y M-Usuario-Empresa.
- El estado, una vez (175 y 190): en Usuario sale el cartel de «Por borrar», y cuándo se borra va en una frase en la ⓘ de la
  etiqueta; el campo «Estado» que no se edita (una invitación, «Por borrar») sale, porque la banda ya lo dice, también el renglón
  del teléfono, cuyo encabezado pasa a decirlo, y una invitación sin nombre no repite su número debajo del título. En la Cuenta y la
  Organización de Plataforma, cuándo y por qué («El 25/09/2026 10:15. Motivo: Dos meses sin pago.») van en la ⓘ de la etiqueta.
- Decidir a propósito (161): el rojo lleno queda para borrar, quitar, revocar y cerrar; dar de baja, suspender, rechazar y cerrar
  sesiones van con la principal, y el foco arranca en «Cancelar». En Empresa, dar de baja a un miembro dice «Dar de baja».
- El texto entero (174): un correo de una tabla baja de renglón después de la «@», nunca a mitad de palabra.
- `Cuenta-21` y `M-Cuenta-21`, nuevos (E21, 159 y 170): «Mi cuenta» con la zona «Chat de WhatsApp» debajo de «Cómo entrás»: cada
  organización de la persona, si su chat está vinculado, «Vincular» o «Abrir el chat», y hasta cuándo le llegan los avisos,
  «Llegan hasta el …» y, pasadas las 24 horas, «Solo con plantilla», con su (i). Beta S.R.L., suspendida como en el resto del
  lienzo, no recibe avisos. Salen de `Cuenta` y `M-Cuenta`, que no cambian.
- El WhatsApp de la cuenta (179): el bot de Plataforma ya no manda un enlace para entrar, sino el botón «Entrar a mi cuenta», que
  lleva al ingreso (Plat-WA-Bot, Plat-WA-Bot-Recorrido, M-Plat-WA-Bot y su mensaje en Mensajes), y «Cargar teléfonos» pide marcar
  «La persona aceptó recibir mensajes por WhatsApp» para invitar, con los estados «Revisar: falta la casilla» y «Revisar: con la
  casilla» (WA-Telefonos y M-WA-Telefonos). Enlace y M-Enlace se retiran (los pasa al Archivo quien publica): ya no los nombran
  Mapa-Ingreso, Indice-entra ni Palabras.

Corre después de `traspaso10_piezas_1004.py`; al terminar imprime la lista de tableros para volver a pasarles la pasada
(`python traspaso10_piezas_1004.py --tableros …`), que les rehace su bloque y les pone la escala a lo que suma este script. No toca
`canvas.json`: los dos tableros nuevos los suma quien publica. Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
AQUI = pathlib.Path(__file__).resolve().parent
PROJ = AQUI.parent
sys.path.insert(0, str(AQUI))
import estados_util as U  # noqa: E402

MARCA = 'data-t10="nucleo"'
BLOQUE = re.compile(r'<style data-t10="nucleo">.*?</style>\n', re.S)
# La elegida de un filtro con su tilde a la izquierda (142 y 143). Se prende si la pasada de las piezas no la pone en todos.
TILDE = False


def svg(cuerpo, tam=18, grosor="1.75"):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{grosor}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{cuerpo}</svg>')


INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 14)
INFO_TEL = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 20)
# El ícono de Empresas del menú: la organización de cada chat.
ORG = svg('<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 9h4a1 1 0 0 1 1 1v11"/><path d="M3 21h18"/>'
          '<path d="M8 8h3"/><path d="M8 12h3"/><path d="M8 16h3"/>', 18)
TILDE_SVG = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "2.25")


def leer(nombre):
    return (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")


def escribir(nombre, t):
    (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")


def cambiar(t, viejo, nuevo, veces=None):
    """`viejo` por `nuevo`. Si `viejo` ya no está, tiene que estar `nuevo`: es una corrida anterior."""
    k = t.count(viejo)
    if k == 0:
        assert nuevo in t, ("no encuentro", viejo[:160])
        return t
    assert veces is None or k == veces, (viejo[:160], k, veces)
    return t.replace(viejo, nuevo)


def con_css(t, css):
    t = BLOQUE.sub("", t)
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def tooltip_css(lado="left: -10px;"):
    """La (i) con su frase al pasar el mouse o con el foco; `abierta` la deja a la vista en un estado del tablero."""
    return f""".t10n-i {{ position: relative; display: inline-flex; align-items: center; color: var(--t3); cursor: help; outline: none; }}
.t10n-i:focus-visible {{ border-radius: 50%; box-shadow: 0 0 0 2px var(--marca); }}
.t10n-tip {{ display: none; position: absolute; z-index: 40; top: calc(100% + 8px); {lado} width: 280px; padding: 8px 10px; border-radius: 6px; background: oklch(0.27 0.012 60); color: #fff; font-size: 12.5px; font-weight: 400; line-height: 1.4; white-space: normal; text-align: left; }}
.t10n-tip::before {{ content: ""; position: absolute; left: 14px; top: -4px; width: 8px; height: 8px; background: inherit; transform: rotate(45deg); }}
.t10n-i:hover .t10n-tip, .t10n-i:focus .t10n-tip, .t10n-i.abierta .t10n-tip {{ display: block; }}
"""


def info(texto, abierta=False):
    clase = "t10n-i abierta" if abierta else "t10n-i"
    return (f'<span class="{clase}" tabindex="0" role="img" aria-label="{texto}">{INFO}'
            f'<span class="t10n-tip" role="tooltip">{texto}</span></span>')


# ================================================================================================================ las listas
LISTAS = {"Usuarios": 2, "Roles": 1, "Cuentas": 2, "Organizaciones": 2, "Empresas": 1, "Empresa": 2, "Recuperaciones": 1, "Campana": 2,
          "Campana-Plat": 2}  # cuántos filtros de opciones tiene cada una
_BOTON = '<button type="button" role="option" aria-selected="{{o.sel}}" class="menu-it'
_ACCION = ' {{o.clase}}" onClick="{{o.elegir}}">'
OPCION = _BOTON + _ACCION + '{{o.n}}<span class="menu-cnt">{{o.c}}</span></button>'
# La opción de un filtro lleva `t10n-op`, para distinguirla de otros desplegables (como «por página») al volver a correr.
OPCION_SIN = _BOTON + " t10n-op" + _ACCION + "{{o.n}}</button>"
OPCION_TILDE = _BOTON + " t10n-op" + _ACCION + f'<span class="t10n-tilde">{TILDE_SVG}</span>' + "{{o.n}}</button>"


def opciones(t, veces):
    """143 y 144: la opción de un filtro dice solo su nombre; con `TILDE`, la elegida suma su tilde (142)."""
    destino = OPCION_TILDE if TILDE else OPCION_SIN
    hay = sum(t.count(o) for o in (OPCION, OPCION_SIN, OPCION_TILDE))
    assert hay == veces, ("filtros", hay, veces)
    for viejo in (OPCION, OPCION_SIN, OPCION_TILDE):
        if viejo != destino:
            t = t.replace(viejo, destino)
    return t


# 174: un correo baja de renglón después de la «@», y no a mitad de palabra. El dato no cambia: solo lo que se muestra en la celda.
# Un corte también después de cada punto dejaba «com» solo en el segundo renglón.
CORREO_JS = ("\n// 174: un correo baja de renglón después de la «@», nunca a mitad de palabra (traspaso10_nucleo_1004.py).\n"
             "const t10nCorreo = (s) => (typeof s === 'string' ? s.replace('@', '@\\u200b') : s);\n")
CORREOS = {
    "Usuarios": [("correo: u.email.includes('@') ? u.email : '—',", "correo: u.email.includes('@') ? t10nCorreo(u.email) : '—',")],
    "Cuentas": [("nombre: c.n || c.email || '—',", "nombre: c.n || t10nCorreo(c.email) || '—',"),
                ("contacto: c.email || c.tel || '—',", "contacto: t10nCorreo(c.email) || c.tel || '—',")],
    "Organizaciones": [("dueno: o.admin !== '—' ? o.admin : o.email,", "dueno: o.admin !== '—' ? o.admin : t10nCorreo(o.email),")],
    "Empresa": [("email: m.email, nombre: m.nombre,", "email: t10nCorreo(m.email), nombre: m.nombre,")],
}
CORREOS["Campana"] = CORREOS["Usuarios"]
CORREOS["Campana-Plat"] = CORREOS["Organizaciones"]


def correos(t, nombre):
    if nombre not in CORREOS:
        return t
    if "const t10nCorreo = " not in t:
        m = re.search(r"<script type=\"text/x-dc\" data-dc-script data-props='[^']*'>", t)
        assert m, nombre
        t = t[:m.end()] + CORREO_JS + t[m.end():]
    else:  # la de una corrida anterior, por la de hoy
        t = re.sub(r"\n// 174: un correo baja de renglón[^\n]*\nconst t10nCorreo = [^\n]*\n", lambda _: CORREO_JS, t, count=1)
    for viejo, nuevo in CORREOS[nombre]:
        t = cambiar(t, viejo, nuevo, 1)
    return t


# 161: lo que no destruye va con la principal; el rojo lleno queda para borrar, quitar, revocar y cerrar.
PRINCIPAL = {"Usuarios": ["Dar de baja"], "Campana": ["Dar de baja"], "Roles": ["Dar de baja"], "Empresas": ["Dar de baja"],
             "Empresa": ["Dar de baja"], "Cuentas": ["Suspender", "Cerrar sesiones"]}  # Usuario, en _usuario_decidir
ORG_PRINCIPAL = [("'Rechazamos ' + o.n + '.'),", "'Rechazamos ' + o.n + '.', false),"),
                 ("'Suspendimos ' + o.n + '.'),", "'Suspendimos ' + o.n + '.', false),")]
CANCELAR = '<button type="button" class="b b-sec" onClick="{{cancelarConfirmacion}}">Cancelar</button>'
CANCELAR_FOCO = '<button type="button" class="b b-sec t10n-foco" onClick="{{cancelarConfirmacion}}">Cancelar</button>'
CSS_FOCO = """/* 161 · El foco arranca en «Cancelar», para que un Enter apurado no confirme lo que no se leyó. */
:root .dlg-f .t10n-foco, :root .df .t10n-foco { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--marca) !important; }
"""
CSS_TILDE = """/* 142 y 143 · La elegida de un filtro lleva su tilde a la izquierda. */
.menu-it.t10n-op { display: flex; align-items: center; gap: 8px; }
.t10n-op .t10n-tilde { display: inline-flex; width: 14px; flex: none; visibility: hidden; color: var(--marca-tx); }
.t10n-op[aria-selected="true"] .t10n-tilde { visibility: visible; }
"""


def decidir(t, nombre):
    if nombre == "Empresa":
        # Dar de baja a un miembro de la empresa dice «Dar de baja», no «Quitar» (base de la 12, «Las palabras»).
        t = cambiar(t, "boton: 'Quitar',", "boton: 'Dar de baja',", 1)
    for boton in PRINCIPAL.get(nombre, []):
        t = re.sub(r"boton: '" + re.escape(boton) + r"',(?! peligro: false,)", f"boton: '{boton}', peligro: false,", t)
        assert f"boton: '{boton}', peligro: false," in t, (nombre, boton)
    if nombre in ("Organizaciones", "Campana-Plat"):
        for viejo, nuevo in ORG_PRINCIPAL:
            t = cambiar(t, viejo, nuevo, 1)
    if nombre == "Recuperaciones":
        t, k = re.subn(r'<button type="button" class="b b-sec" onClick="\{\{cerrarDialogo\}\}">Cancelar</button>(\s*)'
                       r'<button type="button" class="b b-pel" onClick="\{\{rechazar\}\}">Rechazar</button>',
                       r'<button type="button" class="b b-sec t10n-foco" onClick="{{cerrarDialogo}}">Cancelar</button>\1'
                       r'<button type="button" class="b b-sec" onClick="{{rechazar}}">Rechazar</button>', t)
        assert k == 1 or 'class="b b-sec" onClick="{{rechazar}}">Rechazar</button>' in t
        # El título nombra lo que se decide: la cuenta o, sin cuenta, el método de antes (base de la 12, F13).
        t = cambiar(t, "tituloRevisar: r && r.estado === 'pendiente' ? 'Revisar el pedido' : 'Pedido de recuperación',",
                    "tituloRevisar: !r ? '' : (r.estado === 'pendiente' ? 'Revisar el pedido de ' : 'Pedido de ') + (r.cuenta || r.antes),", 1)
    return cambiar(t, CANCELAR, CANCELAR_FOCO, 1)


def listas():
    for nombre, veces in LISTAS.items():
        t = leer(nombre)
        t = opciones(t, veces)
        t = correos(t, nombre)
        t = decidir(t, nombre)
        escribir(nombre, con_css(t, CSS_FOCO + (CSS_TILDE if TILDE else "")))


# ================================================================================================================ Usuario
FRASE_BAJA = "Pidió borrar su cuenta. Se borra el {{seElimina}}."
ESTADO_BANDA = '<span class="w-est {{pill}}">{{textoEstado}}</span>'
I_BAJA = ('<sc-if value="{{bajaPedida}}" hint-placeholder-val="{{no}}"><span class="t10n-i" tabindex="0" role="img" '
          f'aria-label="{FRASE_BAJA}">{INFO}<span class="t10n-tip" role="tooltip">{FRASE_BAJA}</span></span></sc-if>')
CARTEL_BAJA = re.compile(r'<sc-if value="\{\{bajaPedida\}\}" hint-placeholder-val="\{\{no\}\}"><div class="w-cartel" role="status">'
                         r'(?:(?!</sc-if>).)*?Pidió borrar su cuenta\.(?:(?!</sc-if>).)*?</div></sc-if>', re.S)
INI_ESTADO = '<div class="w-cmp" style="width: 260px;"><span class="rt">Estado</span>'
SI_EDITA = '<sc-if value="{{editEstado}}" hint-placeholder-val="{{si}}">'
DETALLE = ("detalle: invitacion ? u.email + (u.estado === 'vencida' ? ' · venció el ' : ' · vence el ') + u.vence : "
           "u.email + ' · desde el ' + u.desde,")
DETALLE_NUEVO = ("// 175: un contacto que ya es el título (una invitación sin nombre) no se repite debajo.\n"
                 "      detalle: (u.n ? u.email + ' · ' : '') + (invitacion ? (u.estado === 'vencida' ? 'venció el ' : 'vence el ') + u.vence : "
                 "'desde el ' + u.desde),")
CSS_USUARIO = """/* 175 · El estado, una vez: la etiqueta lo dice, y cuándo se borra va en la frase de su ⓘ. */
:root .o-res { overflow: visible !important; }
.w-bnd .w-est .t10n-i { margin-left: 2px; }
""" + tooltip_css() + """/* 161 · El foco arranca en «Cancelar». */
:root .df .t10n-foco, :root .dlg-f .t10n-foco { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--marca) !important; }
"""


def sin_estado_fijo(t):
    """El campo «Estado» queda solo cuando se edita: si no, lo dice la banda (175)."""
    assert t.count(INI_ESTADO) == 1
    i = t.index(INI_ESTADO)
    if t[i - len(SI_EDITA):i] == SI_EDITA:
        return t
    prof = 0
    for m in re.finditer(r"<div\b|</div>", t[i:]):
        prof += 1 if m.group(0) == "<div" else -1
        if prof == 0:
            j = i + m.end()
            break
    return t[:i] + SI_EDITA + t[i:j] + "</sc-if>" + t[j:]


def usuario():
    t = leer("Usuario")
    t = cambiar(t, "Sumar empresa", "Agregar empresa")  # el botón, el título del diálogo, el Tweak y sus comentarios
    t = cambiar(t, "s.dlgEmp.modo === 'sumar' ? 'Sumar' : 'Guardar'", "s.dlgEmp.modo === 'sumar' ? 'Agregar' : 'Guardar'", 1)
    t = cambiar(t, "no se apaga «Sumar»", "no se apaga «Agregar»")
    t, k = CARTEL_BAJA.subn("", t)
    assert k == 1 or "t10n-i" in t, ("el cartel de la baja", k)
    if "t10n-i" not in t:
        t = cambiar(t, ESTADO_BANDA, ESTADO_BANDA.replace("</span>", I_BAJA + "</span>"), 1)
    t = sin_estado_fijo(t)
    t = cambiar(t, DETALLE, DETALLE_NUEVO, 1)
    t = _usuario_decidir(t)
    escribir("Usuario", con_css(t, CSS_USUARIO))


def _usuario_decidir(t):
    """161 en Usuario: dar de baja va con la principal (quitar y revocar siguen en rojo) y el foco arranca en «Cancelar»."""
    boton = "Dar de baja y guardar"
    t = re.sub(r"boton: '" + re.escape(boton) + r"',(?! peligro: false,)", f"boton: '{boton}', peligro: false,", t)
    assert f"boton: '{boton}', peligro: false," in t
    return cambiar(t, '<button type="button" class="cb cb-sec" onClick="{{cancelarConfirmacion}}">Cancelar</button>',
                   '<button type="button" class="cb cb-sec t10n-foco" onClick="{{cancelarConfirmacion}}">Cancelar</button>', 1)


EST_TEL_INV = ('<div class="ap-it "><span class="tx"><b>Estado</b><span><span class="w-est e11b-pet">Invitación pendiente</span></span>'
               '</span></div>')
CAB_TEL_INV = ('<h1>011 15-5555-8812</h1><span class="sub"><span class="w-est e11b-pet">Invitación pendiente</span> · vence el 20/10/2026'
               '</span>')


def m_usuario():
    t = leer("M-Usuario")
    t = cambiar(t, "Sumar empresa", "Agregar empresa")
    # 175: la invitación por teléfono se nombra por su número; debajo del título no se repite.
    t = cambiar(t, '<h1>011 15-5555-8812</h1><span class="sub">011 15-5555-8812</span>', "<h1>011 15-5555-8812</h1>", 1)
    # 190: sale el renglón gris «Estado», que no se edita. Lo dice el encabezado, como la banda de la compu y M-Cuenta-Plat.
    t = cambiar(t, EST_TEL_INV, "", 1)
    assert EST_TEL_INV not in t
    t = cambiar(t, "<h1>011 15-5555-8812</h1></div>", CAB_TEL_INV + "</div>", 1)
    escribir("M-Usuario", t)


def m_usuario_empresa():
    t = leer("M-Usuario-Empresa")
    t = cambiar(t, "Sumar empresa", "Agregar empresa")  # el título, la hoja, el enlace y el Tweak
    t = cambiar(t, '<button type="button" class="cb cb-pri">Sumar</button>', '<button type="button" class="cb cb-pri">Agregar</button>', 2)
    escribir("M-Usuario-Empresa", t)


# ================================================================================================================ Cuenta-21
CHAT = ["Con el chat vinculado", "Pasadas las 24 horas", "Sin vincular", "Sin chat todavía", "Sin el módulo de WhatsApp"]
LLEGAN = "Llegan hasta el 16/10/2026 09:40"
TIP_LLEGAN = "Te llegan hasta 24 horas después de tu último mensaje a Grupo Delta."
TIP_PLANTILLA = ("Pasaron 24 horas desde tu último mensaje a Grupo Delta: te llegan solo los avisos con una plantilla aprobada. "
                 "Si le escribís, vuelven a llegar todos.")
VINCULAR = '<button type="button" class="cb cb-sec ch">Vincular</button>'
ABRIR = '<button type="button" class="cb cb-sec ch">Abrir el chat</button>'
PRIVACIDAD = '<div class="w-caja"><div class="w-cab"><span>Privacidad</span>'
CSS_CUENTA = """/* 159 y 170 · «Chat de WhatsApp»: cada organización, si su chat está vinculado y hasta cuándo le llegan los avisos. */
.w-caja.t10n-chat { overflow: visible; }
.w-caja.t10n-chat > .w-cab { border-radius: 11px 11px 0 0; }
.w-it .dato .t10n-av { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-size: 13px; color: var(--t1); }
.w-it .dato .t10n-et { font-size: 13px; color: var(--t3); }
.w-it .dato .t10n-tip { font-size: 12.5px; color: #fff; }
""" + tooltip_css() + """/* La frase va arriba de la (i), sobre la banda de la zona, para no tapar «Vincular» de la fila de abajo. */
.t10n-chat .t10n-tip { top: auto; bottom: calc(100% + 8px); }
.t10n-chat .t10n-tip::before { top: auto; bottom: -4px; }
"""


def fila_chat(org, clase, estado, avisos, accion=""):
    return (f'<div class="w-it"><span class="p-ic">{ORG}</span><span class="dato"><b>{org}</b><span class="w-est{clase}">{estado}</span>'
            f'<span class="t10n-av"><span class="t10n-et">Avisos</span>{avisos}</span></span>{accion}</div>')


def zona_chat():
    """Beta S.R.L. está suspendida en todo el lienzo (el menú de perfiles, Organizaciones): su fila lo dice y no le llegan avisos.
    Los casos sin vincular y sin chat todavía los muestra Grupo Delta, cada uno en su estado."""
    def si(var, html, por_defecto):
        return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{{"si" if por_defecto else "no"}}}}}">{html}</sc-if>'
    return ('<sc-if value="{{conModulo}}" hint-placeholder-val="{{si}}"><div class="w-caja t10n-chat"><div class="w-cab"><span>Chat de WhatsApp</span></div>'
            + si("chatLlegan", fila_chat("Grupo Delta", "", "Vinculado", LLEGAN + info(TIP_LLEGAN)), True)
            + si("chatPlantilla", fila_chat("Grupo Delta", "", "Vinculado", "Solo con plantilla" + info(TIP_PLANTILLA, True)), False)
            + si("chatSinVincular", fila_chat("Grupo Delta", " off", "Sin vincular", "No llegan", VINCULAR), False)
            + si("chatSinChat", fila_chat("Grupo Delta", " off", "Sin chat todavía", "No llegan", ABRIR), False)
            + fila_chat("Beta S.R.L.", " pend", "Suspendida", "No llegan")
            + "</div></sc-if>")


def cuenta_21():
    t = leer("Cuenta")
    # El número de WhatsApp de la cuenta ya está verificado: entrar con él no es lo mismo que tener el chat vinculado (159).
    t = cambiar(t, '<span class="w-est pend">Sin verificar</span>', "", 1)
    t, k = re.subn(r'<a class="cb cb-enl" style="[^"]*" href="Cuenta-Verificar\.dc\.html">Verificar</a>', "", t)
    assert k == 1, k
    t = cambiar(t, PRIVACIDAD, zona_chat() + PRIVACIDAD, 1)
    props = {"chat": {"editor": "enum", "options": CHAT, "default": CHAT[0], "section": "Estado"}, "$preview": {"width": 1440, "height": 900}}
    t, k = re.subn(r"data-props='[^']*'", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    assert k == 1
    assert t.count("this.props.whatsapp") == 3
    t = t.replace("this.props.whatsapp", "this.props.chat")
    t = cambiar(t, "      si: true, no: false,\n      conModulo:",
                "      si: true, no: false,\n"
                "      // Tweak «chat»: Grupo Delta, vinculado, sin vincular o sin chat todavía; Beta S.R.L., suspendida (GET /api/me/whatsapp-chats).\n"
                "      chatLlegan: !['Pasadas las 24 horas', 'Sin vincular', 'Sin chat todavía'].includes(this.props.chat),\n"
                "      chatPlantilla: this.props.chat === 'Pasadas las 24 horas',\n"
                "      chatSinVincular: this.props.chat === 'Sin vincular',\n"
                "      chatSinChat: this.props.chat === 'Sin chat todavía',\n"
                "      conModulo:", 1)
    t = re.sub(r"<title>[^<]*</title>", "<title>Mi cuenta · el chat de WhatsApp · etapa 21</title>", t, count=1)
    escribir("Cuenta-21", con_css(t, CSS_CUENTA))


# ---------------------------------------------------------------------------------------------------------------- M-Cuenta-21
ESTADOS_TEL = ["Con el chat vinculado", "Pasadas las 24 horas", "La (i) de «Solo con plantilla»", "Sin vincular", "Sin chat todavía"]
ESTADOS_M_CUENTA = ["e0", "eX0", "eX1", "eX2", "eX3", "eX4", "eX5", "eX6", "eX7", "eX8", "eX9", "eX10", "eAv4", "eAv3", "eAv2", "eAv1",
                    "eAv0", "eSuc", "e1"]
TEL_SIN_VERIFICAR = ('<span class="tx"><b>011 15-5555-4521</b><span><span class="w-est amb">Sin verificar</span></span></span>'
                     '<a class="acc-t" href="M-Cuenta-Verificar.dc.html" style="text-decoration: none;">Verificar</a>')
CSS_TEL = """/* 159 y 170 · «Chat de WhatsApp» en el teléfono; la (i) abre una hoja chica con el texto. */
.ap-it .tx .t10n-av { color: var(--t2); }
.ap-it .tx .t10n-av .t10n-et { color: var(--t3); }
.t10n-hoja { margin: 0; font-size: 15px; line-height: 1.45; color: var(--t1); }
"""


def it_tel(org, clase, estado, avisos, derecha=""):
    return (f'<div class="ap-it "><span class="tx"><b>{org}</b><span><span class="w-est{clase}">{estado}</span></span>'
            f'<span class="t10n-av"><span class="t10n-et">Avisos</span> {avisos}</span></span>{derecha}</div>')


def i_tel(aria):
    return f'<button type="button" class="ap-ib" aria-label="{aria}">{INFO_TEL}</button>'


def grupo_tel(caso):
    """Como en la compu: Grupo Delta en cada caso y Beta S.R.L., suspendida, sin avisos."""
    delta = {
        "llegan": it_tel("Grupo Delta", "", "Vinculado", LLEGAN, i_tel("Hasta cuándo llegan los avisos")),
        "plantilla": it_tel("Grupo Delta", "", "Vinculado", "Solo con plantilla", i_tel("Por qué llegan solo con plantilla")),
        "sin_vincular": it_tel("Grupo Delta", " off", "Sin vincular", "No llegan", '<span class="acc-t">Vincular</span>'),
        "sin_chat": it_tel("Grupo Delta", " off", "Sin chat todavía", "No llegan", '<span class="acc-t">Abrir el chat</span>'),
    }[caso]
    beta = it_tel("Beta S.R.L.", " amb", "Suspendida", "No llegan")
    return f'<span class="ap-gtit">Chat de WhatsApp</span><div class="ap-grupo">{delta}{beta}</div>'


def m_cuenta_21():
    t = leer("M-Cuenta")
    rangos = [U.rango_bloque(t, v) for v in ESTADOS_M_CUENTA]
    ini, fin = min(a for a, _ in rangos), max(b for _, b in rangos)
    base = t[slice(*U.rango_bloque(t, "e0"))]
    base = cambiar(base, TEL_SIN_VERIFICAR, '<span class="tx"><b>011 15-5555-4521</b></span>', 1)
    # Se ve desde «Cómo entrás», como los estados de Exportar: la pantalla corrida hacia arriba.
    base = cambiar(base, '<div class="ap-cuerpo ap-gris"><span class="ap-gtit">Tus datos</span>',
                   '<div class="ap-cuerpo ap-gris"><span class="ap-gtit" style="margin-top: -380px;">Tus datos</span>', 1)
    assert base.count('<span class="ap-gtit">Privacidad</span>') == 1 and base.count('<div class="ap-fijo">') == 1
    hoja = U.hoja("Solo con plantilla", f'<p class="t10n-hoja">{TIP_PLANTILLA}</p>', "")

    def estado(k, caso, con_hoja=False):
        b = base.replace('<span class="ap-gtit">Privacidad</span>', grupo_tel(caso) + '<span class="ap-gtit">Privacidad</span>')
        if con_hoja:
            i = b.index("</div>", b.index('<div class="ap-fijo">')) + len("</div>")
            b = b[:i] + hoja + b[i:]
        return re.sub(r'^<sc-if value="\{\{e0\}\}" hint-placeholder-val="\{\{si\}\}">',
                      f'<sc-if value="{{{{c{k}}}}}" hint-placeholder-val="{{{{{"si" if k == 0 else "no"}}}}}">', b, count=1)

    bloques = (estado(0, "llegan") + estado(1, "plantilla") + estado(2, "plantilla", con_hoja=True) + estado(3, "sin_vincular")
               + estado(4, "sin_chat"))
    t = t[:ini] + bloques + t[fin:]
    props = {"estado": {"editor": "enum", "options": ESTADOS_TEL, "default": ESTADOS_TEL[0], "section": "Estado"},
             "$preview": {"width": 390, "height": 844}}
    t, k = re.subn(r"data-props='[^']*'", "data-props='" + json.dumps(props, ensure_ascii=False, separators=(",", ":")) + "'", t, count=1)
    assert k == 1
    js = "".join(f"      c{k}: e === {json.dumps(n, ensure_ascii=False)},\n" for k, n in enumerate(ESTADOS_TEL))
    t, k = re.subn(r'const e = this\.props\.estado \?\? "[^"]*";\n\n    return \{\n.*?\n    \};',
                   f'const e = this.props.estado ?? {json.dumps(ESTADOS_TEL[0], ensure_ascii=False)};\n\n    return {{\n'
                   f"      si: true,\n      no: false,\n{js}    }};", t, count=1, flags=re.S)
    assert k == 1
    t = re.sub(r"<title>[^<]*</title>", "<title>Mi cuenta · el chat de WhatsApp · teléfono · etapa 21</title>", t, count=1)
    escribir("M-Cuenta-21", con_css(t, CSS_TEL))


# ================================================================================================================ el WhatsApp de la cuenta (179)
# El bot de Plataforma ya no manda un enlace para entrar: «Entrar a mi cuenta» es un botón que lleva al ingreso, donde el código se
# pide desde la web. Enlace y M-Enlace se retiran (los pasa al Archivo quien publica).
BOT = {
    "Plat-WA-Bot": [("<span>Manda el enlace para entrar o registrarse</span>", "<span>Manda el botón para ir al ingreso</span>")],
    "M-Plat-WA-Bot": [("<span>Manda el enlace para entrar o registrarse</span>", "<span>Manda el botón para ir al ingreso</span>"),
                      ('<span class="et">1</span>Enlace para entrar<span class="d">', '<span class="et">1</span>Botón al ingreso<span class="d">')],
    "Plat-WA-Bot-Recorrido": [("<b>Enlace para entrar o registrarse</b>", "<b>Botón para ir al ingreso</b>")],
}


def bot():
    for nombre, cambios in BOT.items():
        t = leer(nombre)
        for viejo, nuevo in cambios:
            t = cambiar(t, viejo, nuevo, 1)
        escribir(nombre, t)


# «Cargar teléfonos» pide marcar el consentimiento para invitar: sin la casilla, «Vincular y mandar…» marca el campo y no sale nada.
CONS = "La persona aceptó recibir mensajes por WhatsApp"
ERR_CONS = "Confirmá que la persona aceptó recibir mensajes por WhatsApp."
REVISAR = ["Revisar: falta la casilla", "Revisar: con la casilla"]
CAMPO = f'<div class="w-cmp" style="grid-column: 1 / -1;"><label class="t10n-cons"><input type="checkbox"> {CONS}</label></div>'
CAMPO_TEL = f'<label class="ap-it t10n-cons-t"><input type="checkbox"><span class="tx"><b>{CONS}</b></span></label>'
CSS_CONS = """/* 179 · «Cargar teléfonos» pide confirmar que la persona aceptó recibir mensajes por WhatsApp. */
.t10n-cons { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--t1); cursor: pointer; }
.t10n-cons input { width: 16px; height: 16px; margin: 0; flex: none; accent-color: var(--marca); }
.t10n-cons.mal input { outline: 2px solid var(--peligro); outline-offset: 1px; }
"""
CSS_CONS_TEL = """/* 179 · «Cargar teléfonos» pide confirmar que la persona aceptó recibir mensajes por WhatsApp. */
.t10n-cons-t { cursor: pointer; }
.t10n-cons-t input { width: 22px; height: 22px; margin: 0; flex: none; accent-color: var(--marca); }
.t10n-cons-t.mal input { outline: 2px solid var(--peligro); outline-offset: 1px; }
.t10n-err-t { display: block; margin: -2px 20px 10px; font-size: 13.5px; line-height: 1.4; color: var(--peligro); }
"""


def consentimiento(nombre, telefono):
    t = leer(nombre)
    if REVISAR[0] not in t:
        i, j = U.rango_bloque(t, "e0")
        b = t[i:j]
        if telefono:
            k = b.index("<b>Roles en la empresa</b>")
            p = b.index("</div></div>", k) + len("</div>")  # después de la fila de los roles, adentro del grupo
            b = b[:p] + CAMPO_TEL + b[p:]
        else:
            k = b.index('<span class="rt">Roles en la empresa</span>', b.index("A los que se invitan"))
            p = b.index("</div></div>", k) + len("</div></div>")  # después del campo de los roles, adentro de su grilla
            b = b[:p] + CAMPO + b[p:]
        t = t[:i] + b + t[j:]
        campo = CAMPO_TEL if telefono else CAMPO
        con = campo.replace('<input type="checkbox">', '<input type="checkbox" checked>')
        if telefono:
            mal = campo.replace("ap-it t10n-cons-t", "ap-it t10n-cons-t mal")
            t = U.clonar(t, "e0", "e7", REVISAR[1], [(campo, con)])
            # el error va debajo del grupo «A los que se invitan»
            t = U.clonar(t, "e0", "e6", REVISAR[0], [(campo + "</div>", mal + f'</div><span class="t10n-err-t" role="alert">{ERR_CONS}</span>')])
        else:
            mal = campo.replace('<label class="t10n-cons">', '<label class="t10n-cons mal">').replace(
                "</label></div>", f'</label><span class="e11b-err" role="alert">{ERR_CONS}</span></div>')
            t = U.clonar(t, "e0", "e7", REVISAR[1], [(campo, con)])
            t = U.clonar(t, "e0", "e6", REVISAR[0], [(campo, mal)])
    escribir(nombre, con_css(t, CSS_CONS_TEL if telefono else CSS_CONS))


# ================================================================================================================ sin enlace para entrar (179)
# Ningún mensaje lleva un enlace secreto: el bot manda «Entrar a mi cuenta», que abre el ingreso (/login), y el código se pide desde
# la web. La página /login/enlace se retira, y Enlace y M-Enlace pasan al Archivo: no la nombran Mensajes, el mapa ni el índice del
# ingreso, ni Palabras.
MENSAJE_BOT = [
    ("Enlace para entrar (bot)", "Entrar a mi cuenta (bot)", 2),  # la opción del Tweak y su `n`
    ("    // backend.md §15: un mensaje entrante nunca abre una sesión; solo produce un enlace de un solo uso.\n",
     "    // 179: un mensaje entrante nunca abre una sesión ni lleva un enlace secreto. El botón abre el ingreso (/login), y el código\n"
     "    // se pide desde la web.\n", 1),
    ("texto: [N('Hola, Lucía. Para entrar a ArquitecturaBase, tocá Entrar. El enlace sirve una vez y vence en 10 minutos.')], "
     "botones: [{ t: 'Entrar', url: true }]",
     "texto: [N('Hola, Lucía. Para entrar a ArquitecturaBase, tocá «Entrar a mi cuenta» y pedí el código en la página.')], "
     "botones: [{ t: 'Entrar a mi cuenta', url: true }]", 1),
]
NODO_ENLACE = ('<a class="nodo " href="Enlace.dc.html"><span class="t">Enlace del bot de WhatsApp</span><span class="d">Sirve una vez y '
               'vence a los 10 minutos.</span><span class="r">/login/enlace</span></a>')
NODO_BOT = ('<a class="nodo " href="Ingreso.dc.html"><span class="t">Desde el bot de WhatsApp</span><span class="d">«Entrar a mi cuenta» '
            'abre el ingreso, y el código se pide desde la web.</span><span class="r">/login</span></a>')
# Los dos casos que abrían Enlace: el límite por red de su canje y el enlace vencido o usado.
CASO_ENLACE = re.compile(r'<a class="caso" href="Enlace\.dc\.html">(?:(?!</a>).)*</a>\s*', re.S)
TARJETA_ENLACE = re.compile(r'<div class="ix-card"><div class="cab"><div><h3>Enlace del bot de WhatsApp</h3>(?:(?!<div class="ix-card">).)*?'
                            r'href="M-Enlace\.dc\.html">(?:(?!</a>).)*</a></div></div>', re.S)
PALABRA_ENLACE = re.compile(r'\s*<div class="tt-f"[^>]*><span class="c1 n"[^>]*>LoginLink</span>(?:(?!</div>).)*</div>')
SIN_ENLACE = ["Mensajes", "Mapa-Ingreso", "Indice-entra", "Palabras"]


def sin_enlace():
    t = leer("Mensajes")
    for viejo, nuevo, veces in MENSAJE_BOT:
        t = cambiar(t, viejo, nuevo, veces)
    escribir("Mensajes", t)

    t = cambiar(leer("Mapa-Ingreso"), NODO_ENLACE, NODO_BOT, 1)
    t, k = CASO_ENLACE.subn("", t)
    assert k in (0, 2), ("los casos del enlace", k)
    escribir("Mapa-Ingreso", t)

    t, k = TARJETA_ENLACE.subn("", leer("Indice-entra"))
    assert k in (0, 1), ("la tarjeta del enlace", k)
    escribir("Indice-entra", t)

    t, k = PALABRA_ENLACE.subn("", leer("Palabras"))
    assert k in (0, 1), ("LoginLink en Palabras", k)
    escribir("Palabras", t)

    for nombre in SIN_ENLACE:
        t = leer(nombre)
        for resto in ("Enlace.dc.html", "/login/enlace", "LoginLink", "un solo uso", "El enlace sirve una vez"):
            assert resto not in t, (nombre, resto)


# ================================================================================================================ Plataforma (175)
# La etiqueta del encabezado dice el estado una vez, y cuándo y por qué van en una frase en su ⓘ («El 25/09/2026 10:15. Motivo: Dos
# meses sin pago.»). Los carteles que lo repetían ya los había sacado bloque0_plat_1004.py, pero con ellos se habían ido la fecha y
# el motivo. La frase sale de la última vez que pasó en el historial del tablero: dice lo mismo que la pestaña «Historial».
PILL_BANDA = '<span class="pill {{pill}}">{{textoEstado}}</span>'
I_PORQUE = ('<sc-if value="{{t10nPorQue}}" hint-placeholder-val="{{no}}"><span class="t10n-i" tabindex="0" role="img" '
            f'aria-label="{{{{t10nPorQue}}}}">{INFO}<span class="t10n-tip" role="tooltip">{{{{t10nPorQue}}}}</span></span></sc-if>')
# La fecha y la hora van juntas (un espacio duro): al bajar de renglón, «27/09/2026» no queda separada de su «10:30».
POR_QUE_JS = ("\n// 175: cuándo y por qué de un estado, en la frase de su ⓘ: la última vez que pasó en el historial (traspaso10_nucleo_1004.py).\n"
              "const t10nPunto = (x) => (/[.!?]$/.test(x) ? x : x + '.');\n"
              "const t10nFecha = (f) => f.replace(' ', '\\u00a0');\n"
              "const t10nPorQue = (historial, frases) => {\n"
              "  const h = frases ? historial.find((x) => frases[x.que]) : null;\n"
              "  return h ? frases[h.que](h) : '';\n"
              "};\n")
POR_QUE_PREVIO = re.compile(r"\n// 175: cuándo y por qué de un estado[^\n]*\n.*?\n\};\n", re.S)
FRASES = {
    "Cuenta-Plat": ("s.estado", """{
        suspendida: { 'Suspendió la cuenta': (h) => 'El ' + t10nFecha(h.fecha) + '. Motivo: ' + t10nPunto(h.motivo) },
        baja: {
          'Pidió borrar su cuenta': (h) => 'Pidió borrar su cuenta el ' + t10nFecha(h.fecha) + '.',
          'Pidió borrar la cuenta': (h) => 'La plataforma pidió borrar la cuenta el ' + t10nFecha(h.fecha) + '. Motivo: ' + t10nPunto(h.motivo),
        },
        recuperacion: {
          'Terminó la membresía en Kappa S.R.L.': (h) => 'El ' + t10nFecha(h.fecha) + ' terminó su membresía en Kappa S.R.L., que administraba su único método de ingreso.',
        },
      }"""),
    "Organizacion": ("s.estadoOrg", """{
        suspendida: { 'Suspendió la organización': (h) => 'El ' + t10nFecha(h.fecha) + '. Motivo: ' + t10nPunto(h.motivo) },
        cerrada: { 'Cerró la organización': (h) => 'El ' + t10nFecha(h.fecha) + '. Motivo: ' + t10nPunto(h.motivo) + ' Queda de solo lectura.' },
      }"""),
}
INICIO_FRASE = "      // 175: la etiqueta dice el estado; cuándo y por qué, en la frase de su ⓘ.\n"
FRASE_PREVIA = re.compile(re.escape(INICIO_FRASE) + r".*?\]\),\n", re.S)
# La fecha en que se borra una cuenta coincide con la del pedido que dice la ⓘ (30 días después), también si lo pidió la plataforma.
FECHAS_CUENTA = [
    ("bajaPedidaEl: '27/09/2026 09:15', seElimina: '27/10/2026 09:15',\n",
     "bajaPedidaEl: '27/09/2026 09:15', seElimina: props.estado === 'Baja iniciada por la plataforma' ? '27/10/2026 10:30' : '27/10/2026 09:15',\n"),
    ("seElimina: '27/10/2026 09:15' }); this.anotar('Pidió borrar la cuenta', m); this.avisar('La cuenta de ' + c.n + ' se borra el 27/10/2026 09:15.');",
     "seElimina: '27/10/2026 17:35' }); this.anotar('Pidió borrar la cuenta', m); this.avisar('La cuenta de ' + c.n + ' se borra el 27/10/2026 17:35.');"),
]
CSS_PLAT = """/* 175 · El estado, una vez: la etiqueta lo dice, y cuándo y por qué van en la frase de su ⓘ. */
:root .banda-pag .res { overflow: visible !important; }
.banda-pag .res .pill .t10n-i { margin-left: 2px; }
""" + tooltip_css()
PLATAFORMA = list(FRASES)


def plataforma():
    for nombre, (clave, frases) in FRASES.items():
        t = leer(nombre)
        if "t10n-i" not in t:
            t = cambiar(t, PILL_BANDA, PILL_BANDA.replace("</span>", I_PORQUE + "</span>"), 1)
        m = re.search(r"<script type=\"text/x-dc\" data-dc-script data-props='[^']*'>", t)
        assert m, nombre
        t = POR_QUE_PREVIO.sub("", t)
        t = t[:m.end()] + POR_QUE_JS + t[m.end():]
        t = FRASE_PREVIA.sub("", t)
        t, k = re.subn(r"(\n *textoEstado: \{[^\n]*\}\[" + re.escape(clave) + r"\],\n)",
                       lambda x: x.group(1) + INICIO_FRASE + f"      t10nPorQue: t10nPorQue(s.historial, {frases}[{clave}]),\n", t, count=1)
        assert k == 1, nombre
        if nombre == "Cuenta-Plat":
            for viejo, nuevo in FECHAS_CUENTA:
                t = cambiar(t, viejo, nuevo, 1)
        escribir(nombre, con_css(t, CSS_PLAT))


NUEVOS = {  # para canvas.json, lo suma quien publica: al lado de la campana de la 21, en la fila de la E21
    "Cuenta-21": {"page": "formularios", "title": "Mi cuenta · el chat de WhatsApp · etapa 21", "w": 1440, "h": 900,
                  "al lado de": "Campana-21"},
    "M-Cuenta-21": {"page": "formularios", "title": "Mi cuenta · el chat de WhatsApp · teléfono · etapa 21", "w": 390, "h": 844,
                    "al lado de": "M-Campana-21"},
}
TOCADOS = (list(LISTAS) + ["Usuario", "M-Usuario", "M-Usuario-Empresa"] + list(NUEVOS) + list(BOT)
           + ["WA-Telefonos", "M-WA-Telefonos"] + PLATAFORMA + SIN_ENLACE)


if __name__ == "__main__":
    listas()
    usuario()
    m_usuario()
    m_usuario_empresa()
    cuenta_21()
    m_cuenta_21()
    bot()
    consentimiento("WA-Telefonos", telefono=False)
    consentimiento("M-WA-Telefonos", telefono=True)
    sin_enlace()
    plataforma()
    print("listo:", len(TOCADOS), "tableros")
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(TOCADOS))
