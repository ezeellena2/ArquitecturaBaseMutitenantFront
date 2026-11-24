"""Las personas y los operadores en la segunda parte de la base: la entrega de una invitación (F10, 0066 §4), lo que no se puede
dar (F5, 269 y 0061), los permisos de un operador en áreas plegables (F5, 260), el orden de las tablas (264) y las filas del
teléfono como tarjetas (263). Escribe `Usuarios-Base2`, `Usuario-Base2`, `Empresa-Base2`, `Cuentas-Base2`, `Cuenta-Plat-Base2` y sus
teléfonos, desde la copia de `base2_1004/`.

La entrega de una invitación es su columna, «Entrega», con el punto y la palabra: Pendiente, Enviada, Sin confirmar y No se pudo
enviar, con su motivo en la (i). En una ficha, la caja «Invitación» la lee con el correo o el teléfono y el vencimiento, y lleva
«Reenviar invitación». Si quedó «Sin confirmar», reenviar pide revisar con la persona antes, en una confirmación.
"""
import re

import acciones_asistente_1004 as acc
from base2_comun import (AD, ORG, PLAT, SVG_FLECHA, SVG_REENVIAR, areas, areas_lectura, avatar, boton_ordenar, caja_lectura, campo,
                         con_dialogo_ab, con_dialogo_w, con_hoja, con_orden, confirmar_ab, confirmar_w, copia, css, entrega, escribir,
                         est, fin_div, filas_tel, grupo_tel, hijos, hoja_tel, lista, op, pk_tel, por_estado, reemplazar_div, sumar_col,
                         tablero, tarjeta, una_vez)

NADA = '<span style="color: var(--t3);">—</span>'


def reenviar_texto(a_quien, canal):
    origen = "el servidor de correo" if canal == "correo" else "WhatsApp"
    return (f"No sabemos si le llegó la anterior: {origen} no confirmó el envío. Revisá con {a_quien} antes de reenviarla, así no le "
            "llegan dos.")


def poner_ordenar(t, texto):
    """«Ordenar por», último en la barra y separado de los filtros (264)."""
    i = t.index('<div class="fb"')
    j = fin_div(t, i)
    return t[:j - len("</div>")] + boton_ordenar(texto) + t[j - len("</div>"):]


# Los roles que ve quien invita, con lo que no puede dar apagado (0061): Valeria no es Dueña.
ROLES_ORG = acc.ROLES_ORG
ROLES_EMP = [("Administrador", "Administra la empresa: sus miembros y sus roles.", "Tiene permisos que no tenés en Delta S.A."),
             ("Solo lectura", "Ve los miembros de la empresa. No cambia nada.", None),
             ("Supervisión", "Suma y quita a las personas de la empresa.", None)]


def lista_roles(roles, elegidos, tip_en):
    return lista([op(n, d, elegida=n in elegidos, multiple=True, apagada=m, tip_abierto=n == tip_en) for n, d, m in roles], multiple=True)


# ---------------------------------------------------------------------------------------------------------------- Usuarios
U_ESTADOS = ["Lista", "Entrega: por qué", "Reenviar una invitación sin confirmar", "Invitar usuario: lo que no podés dar"]
ENTREGAS_U = {"011 15-5555-8812": "Uncertain", "011 15-5555-9934": "Sent", "011 15-5555-1200": "Failed"}


def usuarios_tabla(abierto=None, base="usuarios"):
    t = copia(base)

    def valor(fila):
        for tel, cod in ENTREGAS_U.items():
            if f">{tel}<" in fila:
                return entrega(cod, "whatsapp", abierto == tel)
        return NADA
    t = sumar_col(t, "Entrega", 4, "190px", valor)
    t = t.replace("minmax(0px, 1.2fr) 160px minmax(0px, 1fr) 150px 190px 90px 28px", "minmax(0px, 1.2fr) 130px minmax(0px, 1fr) 150px 190px 90px 28px")
    t = con_orden(t)
    return poner_ordenar(t, "Usuario, de la A a la Z")


def usuarios_base2():
    lista_t = usuarios_tabla()
    porque = usuarios_tabla("011 15-5555-8812")
    reenviar = con_dialogo_ab(lista_t, confirmar_ab("¿Reenviar la invitación a 011 15-5555-8812?",
                                                     reenviar_texto("la persona", "whatsapp"), "Reenviar"))
    inv = acc.marco(usuarios_tabla(base="usuarios_invitar"))
    inv = una_vez(inv, 'placeholder="nombre@empresa.com" value=""', 'placeholder="nombre@empresa.com" value="ana.lopez@delta.ejemplo.com"')
    boton = re.search(r'<button type="button" class="in2" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="et-RolesOrg">.*?</button>',
                      inv, re.S).group(0)
    inv = inv.replace(boton, campo("Ventas", abierto=True, aria="Roles de la organización",
                                   extra=lista_roles(ROLES_ORG, {"Ventas"}, "Auditor")))
    return tablero("Usuarios", "Usuarios · la entrega de una invitación y lo que no podés dar · /org/usuarios", css(),
                   por_estado([lista_t, porque, reenviar, inv]), U_ESTADOS, 1440, 900)


M_U_ESTADOS = ["Lista", "Reenviar una invitación sin confirmar", "Invitar usuario: lo que no podés dar"]
M_U_FILAS = [
    ("Lucía Fernández", [("Estado", est("ok", "Activo")), ("Rol", "Dueño"), ("Empresa", "Delta S.A.")]),
    ("Tomás Acosta", [("Estado", est("ok", "Activo")), ("Rol", "—"), ("Empresa", "Delta S.A.")]),
    ("Julieta Sosa", [("Estado", est("ok", "Activo")), ("Rol", "Auditor"), ("Empresa", "—")]),
    ("Diego Ríos", [("Estado", est("aten", "Por borrar")), ("Rol", "—"), ("Empresa", "Delta S.A.")]),
    ("Paula Méndez", [("Estado", est("ok", "Activo")), ("Rol", "—"), ("Empresa", "Delta S.A. y 1 más")]),
    ("011 15-5555-8812", [("Estado", est("pend", "Invitación pendiente")), ("Entrega", entrega("Uncertain", "whatsapp")),
                          ("Empresa", "Delta S.A."), ("Vence", "20/10/2026, 18:00")]),
    ("011 15-5555-9934", [("Estado", est("pend", "Invitación pendiente")), ("Entrega", entrega("Sent", "whatsapp")),
                          ("Empresa", "Delta S.A."), ("Vence", "20/10/2026, 18:00")]),
]


def tarjetas_de(t, filas):
    """Las tarjetas con el avatar de la misma persona en la copia (por su nombre)."""
    avs = {}
    for m in re.finditer(r'<div class="w-conv"', t):
        fila = t[m.start():fin_div(t, m.start())]
        n = re.search(r"<b>(.*?)</b>", fila)
        if n:
            avs[n.group(1)] = avatar(fila)
    return [tarjeta(n, d, acciones=n, av=avs.get(n, f'<span class="w-av">{n[0]}</span>')) for n, d in filas]


def m_usuarios_base2():
    t = copia("m_usuarios")
    t = filas_tel(t, tarjetas_de(t, M_U_FILAS))
    reenviar = con_hoja(t, hoja_tel("¿Reenviar la invitación a 011 15-5555-8812?", reenviar_texto("la persona", "whatsapp"), "Reenviar"))
    inv = acc.marco(copia("m_invitar"))
    inv = inv.replace('<div class="ct" style="color: var(--t3);">Ninguno', '<div class="ct">Ventas', 1)
    inv = con_hoja(inv, pk_tel("Roles de la organización", [(n, d, n == "Ventas", m) for n, d, m in ROLES_ORG], multiple=True,
                               tip_en="Auditor", listo="Listo (1)"))
    return tablero("M-Usuarios", "Usuarios · la entrega de una invitación · teléfono", css(True), por_estado([t, reenviar, inv]),
                   M_U_ESTADOS, 390, 844)


# ---------------------------------------------------------------------------------------------------------------- Usuario
UF_ESTADOS = ["Invitación: pendiente", "Invitación: enviada", "Invitación: sin confirmar", "Reenviar una invitación sin confirmar",
              "Invitación: no se pudo enviar", "Invitación por teléfono: sin confirmar", "Roles: lo que no podés dar"]


def con_invitacion(t, filas):
    """La caja «Invitación» primera en el cuerpo de la ficha, con «Reenviar invitación» en su encabezado."""
    boton = f'<button type="button" class="cb cb-sec ch">{SVG_REENVIAR} Reenviar invitación</button>'
    k = t.index('<div class="w-body">') + len('<div class="w-body">')
    return t[:k] + caja_lectura("Invitación", filas, boton) + t[k:]


def usuario_base2():
    sofia = copia("usuario_sofia")
    tel = copia("usuario_tel")
    caja = lambda cod, abierto=False: [("Por", "Correo"), ("Correo", "sofia.herrera@delta.ejemplo.com"), ("Vence", "02/10/2026, 18:00"),
                                       ("Entrega", entrega(cod, "correo", abierto))]
    cuerpos = [con_invitacion(sofia, caja("Pending")), con_invitacion(sofia, caja("Sent")),
               con_invitacion(sofia, caja("Uncertain", True))]
    cuerpos.append(con_dialogo_w(cuerpos[2], confirmar_w("¿Reenviar la invitación a Sofía Herrera?",
                                                         reenviar_texto("Sofía Herrera", "correo"), "Reenviar")))
    cuerpos.append(con_invitacion(sofia, caja("Failed", True)))
    cuerpos.append(con_invitacion(tel, [("Por", "WhatsApp"), ("Teléfono", "011 15-5555-8812"), ("Vence", "20/10/2026, 18:00"),
                                        ("Entrega", entrega("Uncertain", "whatsapp", True))]))
    # Valeria edita a Tomás: los roles que no puede dar, apagados con su motivo (269).
    tomas = acc.marco(copia("usuario_tomas"))
    boton = re.search(r'<div class="o-dd"><button type="button" class="ct" aria-haspopup="listbox" aria-expanded="false" '
                      r'aria-label="Roles de la organización">.*?</button></div>', tomas, re.S).group(0)
    tomas = tomas.replace(boton, campo("Ventas", abierto=True, aria="Roles de la organización",
                                       extra=lista_roles(ROLES_ORG, {"Ventas"}, "Dueño")))
    cuerpos.append(tomas)
    return tablero("Usuario", "Editar usuario · la entrega de su invitación y lo que no podés dar · /org/usuarios/:id", css(),
                   por_estado(cuerpos), UF_ESTADOS, 1440, 900)


M_UF_ESTADOS = ["Invitación: sin confirmar", "Reenviar una invitación sin confirmar", "Invitación: no se pudo enviar",
                "Elegir los roles: lo que no podés dar"]


def m_usuario_base2():
    tel = copia("m_usuario_tel")
    k = tel.index('<div class="ap-cuerpo ap-gris">') + len('<div class="ap-cuerpo ap-gris">')
    reen = '<a href="#">Reenviar invitación</a>'
    grupo = lambda cod: grupo_tel("Invitación", [("Por", "WhatsApp"), ("Teléfono", "011 15-5555-8812"), ("Vence", "20/10/2026, 18:00"),
                                                 ("Entrega", entrega(cod, "whatsapp", True, "b2-tip-abajo"))], reen)
    sin = tel[:k] + grupo("Uncertain") + tel[k:]
    reenviar = con_hoja(sin, hoja_tel("¿Reenviar la invitación a 011 15-5555-8812?", reenviar_texto("la persona", "whatsapp"), "Reenviar"))
    fallo = tel[:k] + grupo("Failed") + tel[k:]
    roles = acc.marco(copia("m_usuario"))
    roles = con_hoja(roles, pk_tel("Roles de la organización", [(n, d, n == "Ventas", m) for n, d, m in ROLES_ORG], multiple=True,
                                   tip_en="Dueño", listo="Listo (1)"))
    return tablero("M-Usuario", "Editar usuario · la entrega de su invitación · teléfono", css(True),
                   por_estado([sin, reenviar, fallo, roles]), M_UF_ESTADOS, 390, 844)


# ---------------------------------------------------------------------------------------------------------------- Empresa
E_ESTADOS = ["Miembros", "Entrega: por qué", "Reenviar una invitación sin confirmar", "Agregar miembro: lo que no podés dar"]


def empresa_tabla(abierto=False, base="empresa"):
    t = copia(base)
    t = sumar_col(t, "Entrega", 3, "160px", lambda f: entrega("Uncertain", "correo", abierto) if ">Sofía Herrera<" in f else NADA)
    t = con_orden(t)
    return poner_ordenar(t, "Miembro, de la A a la Z")


def empresa_base2():
    base = empresa_tabla()
    porque = empresa_tabla(True)
    reenviar = con_dialogo_ab(base, confirmar_ab("¿Reenviar la invitación a Sofía Herrera?", reenviar_texto("Sofía Herrera", "correo"),
                                                 "Reenviar"))
    ag = acc.marco(empresa_tabla(base="empresa_agregar"))
    ag = una_vez(ag, '<span class="val vacio2">Elegí un usuario de la organización</span>', '<span class="val ">Tomás Acosta</span>')
    boton = re.search(r'<button type="button" class="in2" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="et-RolesA">.*?</button>',
                      ag, re.S).group(0)
    ag = ag.replace(boton, campo("Solo lectura", abierto=True, aria="Roles en la empresa",
                                 extra=lista_roles(ROLES_EMP, {"Solo lectura"}, "Administrador")))
    return tablero("Empresa", "Ficha de empresa · la entrega de una invitación y lo que no podés dar · /org/empresas/:id", css(),
                   por_estado([base, porque, reenviar, ag]), E_ESTADOS, 1440, 900)


M_E_ESTADOS = ["Miembros", "Reenviar una invitación sin confirmar", "Roles de un miembro: lo que no podés dar"]
M_E_FILAS = [
    ("Lucía Fernández", [("Roles", "Administrador"), ("Estado", est("ok", "Activo"))]),
    ("Tomás Acosta", [("Roles", "Solo lectura"), ("Estado", est("ok", "Activo"))]),
    ("Diego Ríos", [("Roles", "Solo lectura"), ("Estado", est("aten", "Por borrar"))]),
    ("Paula Méndez", [("Roles", "Solo lectura"), ("Estado", est("ok", "Activo"))]),
    ("Martín Paz", [("Roles", "Solo lectura"), ("Estado", est("ok", "Activo"))]),
    ("Marcos Giménez", [("Roles", "—"), ("Estado", est("", "De baja"))]),
    ("Sofía Herrera", [("Estado", est("pend", "Invitación pendiente")), ("Entrega", entrega("Uncertain")), ("Roles", "Solo lectura"),
                       ("Vence", "02/10/2026, 18:00")]),
]


def m_empresa_base2():
    t = copia("m_empresa")
    t = filas_tel(t, tarjetas_de(t, M_E_FILAS))
    reenviar = con_hoja(t, hoja_tel("¿Reenviar la invitación a Sofía Herrera?", reenviar_texto("Sofía Herrera", "correo"), "Reenviar"))
    roles = acc.marco(t)
    roles = con_hoja(roles, pk_tel("Roles en la empresa", [(n, d, n == "Solo lectura", m) for n, d, m in ROLES_EMP], multiple=True,
                                   tip_en="Administrador", listo="Listo (1)"))
    return tablero("M-Empresa", "Ficha de empresa · la entrega de una invitación · teléfono", css(True),
                   por_estado([t, reenviar, roles]), M_E_ESTADOS, 390, 844)


# ---------------------------------------------------------------------------------------------------------------- Cuentas
C_ESTADOS = ["Lista", "Entrega: por qué", "Reenviar una invitación sin confirmar", "Invitar operador", "Invitar operador: lo incluido",
             "Invitar operador: lo que no podés dar"]
JULIETA = "julieta.molina@arquitecturabase.ejemplo.com"
# Martín Sosa invita: no tiene «Administrar el WhatsApp de Plataforma» ni «Configurar el asistente de Plataforma».
NO_TIENE_MARTIN = {"Administrar el WhatsApp de Plataforma", "Configurar el asistente de Plataforma"}


def cuentas_tabla(abierto=False):
    t = copia("cuentas")
    k = t.index('<a class="c1 " href="Cuenta-Plat.dc.html">Laura Díaz</a>')
    der_laura = hijos(t[t.rindex('<div class="tt-f', 0, k):fin_div(t, t.rindex('<div class="tt-f', 0, k))])[1][-1]
    i = t.index('<a class="c1 " href="Cuenta-Plat.dc.html">Cuenta borrada</a>')
    i = t.rindex('<div class="tt-f', 0, i)
    j = fin_div(t, i)
    ab, hs, ci = hijos(t[i:j])
    hs = [f'<a class="c1 " href="Cuenta-Plat.dc.html">{JULIETA}</a>', f'<span class="c2b">{JULIETA}</span>', '<span class="c1 n">Operador</span>',
          '<span class="c1 n nada">—</span>', '<span><span class="pill pend">Invitación pendiente</span></span>',
          der_laura.replace("Acciones de Laura Díaz", f"Acciones de {JULIETA}")]
    t = t[:i] + ab + "".join(hs) + ci + t[j:]
    t = sumar_col(t, "Entrega", 4, "160px", lambda f: entrega("Uncertain", "correo", abierto) if JULIETA + "</a>" in f else NADA)
    t = t.replace("190px 140px 175px 160px 28px", "170px 130px 160px 150px 28px")
    t = con_orden(t)
    return poner_ordenar(t, "Cuenta, de la A a la Z")


def con_areas_dialogo(t, nuevo):
    return reemplazar_div(t, '<div class="r212-marco">', f'<div class="b2-marco">{nuevo}</div>')


def cuentas_base2():
    base = cuentas_tabla()
    porque = cuentas_tabla(True)
    reenviar = con_dialogo_ab(base, confirmar_ab(f"¿Reenviar la invitación a {JULIETA}?", reenviar_texto("la persona", "correo"), "Reenviar"))
    inv = copia("cuentas_invitar")
    inv = una_vez(inv, 'id="f-Correo" type="email" autocomplete="off" placeholder="" value=""',
                  'id="f-Correo" type="email" autocomplete="off" placeholder="" value="nicolas.rey@arquitecturabase.ejemplo.com"')
    nuevo = con_areas_dialogo(inv, areas(PLAT, set(), set(), no_tiene=NO_TIENE_MARTIN, aria="Permisos de plataforma"))
    incl = con_areas_dialogo(inv, areas(PLAT, {"Administrar cuentas", "Ver organizaciones"}, {"Organizaciones", "Cuentas"},
                                        no_tiene=NO_TIENE_MARTIN, tip_en="Ver cuentas", aria="Permisos de plataforma"))
    no_da = con_areas_dialogo(inv, areas(PLAT, {"Administrar cuentas"}, {"Cuentas", "Asistente"}, no_tiene=NO_TIENE_MARTIN,
                                         tip_en="Configurar el asistente de Plataforma", aria="Permisos de plataforma"))
    return tablero("Cuentas", "Cuentas y operadores · la entrega de una invitación y los permisos en áreas · /plataforma/cuentas",
                   css() + ".b2-marco { max-height: 470px; overflow: auto; }\n",
                   por_estado([base, porque, reenviar, nuevo, incl, no_da]), C_ESTADOS, 1440, 900)


M_C_ESTADOS = ["Lista", "Reenviar una invitación sin confirmar"]
M_C_FILAS = [
    ("Lucía Fernández", [("Perfiles", "Personal + 2 organizaciones"), ("Estado", est("ok", "Activa")), ("Último ingreso", "27/09/2026, 09:50", True)]),
    ("Beto Ramírez", [("Perfiles", "Personal + 1 organización"), ("Estado", est("ok", "Activa")), ("Último ingreso", "26/09/2026, 18:20", True)]),
    ("Ana Gómez", [("Perfiles", "Personal"), ("Estado", est("aten", "Suspendida")), ("Último ingreso", "18/09/2026, 11:20", True)]),
    ("mariana.lopez@gmail.com", [("Perfiles", "Personal"), ("Estado", est("ok", "Activa")), ("Último ingreso", "27/09/2026, 02:45", True)]),
    ("Pablo Ortiz", [("Perfiles", "Personal"), ("Estado", est("mal", "Necesita recuperación")), ("Último ingreso", "19/09/2026, 08:40", True)]),
    ("Diego Ríos", [("Perfiles", "Personal + 1 organización"), ("Estado", est("aten", "Por borrar")), ("Último ingreso", "27/09/2026, 08:15", True)]),
    ("Martín Sosa", [("Perfiles", "Operador"), ("Estado", est("ok", "Activa")), ("Último ingreso", "27/09/2026, 10:05", True)]),
    (JULIETA, [("Perfiles", "Operador"), ("Estado", est("pend", "Invitación pendiente")), ("Entrega", entrega("Uncertain")),
               ("Vence", "04/10/2026, 18:00")]),
]


def m_cuentas_base2():
    t = copia("m_cuentas")
    t = filas_tel(t, tarjetas_de(t, M_C_FILAS))
    reenviar = con_hoja(t, hoja_tel(f"¿Reenviar la invitación a {JULIETA}?", reenviar_texto("la persona", "correo"), "Reenviar"))
    return tablero("M-Cuentas", "Cuentas · la entrega de una invitación · teléfono", css(True), por_estado([t, reenviar]), M_C_ESTADOS,
                   390, 844)


# ---------------------------------------------------------------------------------------------------------------- Cuenta-Plat
CP_ESTADOS = ["Operador: sus permisos", "Cambiar permisos", "Cambiar permisos: lo incluido", "Cambiar permisos: lo que no podés dar",
              "Invitación: pendiente", "Invitación: enviada", "Invitación: sin confirmar", "Reenviar una invitación sin confirmar",
              "Invitación: no se pudo enviar"]
LAURA = {"Ver organizaciones", "Recuperaciones"}
JULIETA_TIENE = {"Ver organizaciones", "Ver cuentas", "Ver la auditoría"}


def con_lectura_permisos(t, tiene):
    return reemplazar_div(t, '<div class="tarjeta r212-caja"', f'<div class="tarjeta" style="margin-top: 11.5px; padding: 0; border: 0;">'
                                                                f'{areas_lectura(PLAT, tiene)}</div>')


def cuenta_plat_base2():
    op_t = con_lectura_permisos(copia("cplat_op"), LAURA)
    perm = copia("cplat_perm")
    perm = con_lectura_permisos(perm, LAURA)
    cambiar = lambda m, ab, **k: con_areas_dialogo(perm, areas(PLAT, m, ab, aria="Permisos de plataforma", **k))
    inv = con_lectura_permisos(copia("cplat_inv"), JULIETA_TIENE)

    def caja(cod, abierto=False):
        filas = [("Correo", JULIETA), ("Vence", "04/10/2026, 18:00"), ("Entrega", entrega(cod, "correo", abierto))]
        k = inv.index('<div class="pagina">') + len('<div class="pagina">')
        return inv[:k] + f'<div style="margin-bottom: 16px;">{caja_lectura("Invitación", filas)}</div>' + inv[k:]
    sin = caja("Uncertain", True)
    cuerpos = [op_t, cambiar(LAURA, {"Organizaciones", "Recuperaciones"}),
               cambiar(LAURA | {"Administrar cuentas"}, {"Organizaciones", "Cuentas", "Recuperaciones"}, tip_en="Ver cuentas"),
               cambiar(LAURA, {"Organizaciones", "Recuperaciones", "Asistente"}, no_tiene=NO_TIENE_MARTIN,
                       tip_en="Configurar el asistente de Plataforma"),
               caja("Pending"), caja("Sent"), sin,
               con_dialogo_ab(caja("Uncertain"), confirmar_ab(f"¿Reenviar la invitación a {JULIETA}?", reenviar_texto("la persona", "correo"),
                                                              "Reenviar")),
               caja("Failed", True)]
    return tablero("Cuenta-Plat", "Ficha de una cuenta · los permisos de un operador en áreas y la entrega de su invitación", css()
                   + ".b2-marco { max-height: 470px; overflow: auto; }\n", por_estado(cuerpos), CP_ESTADOS, 1440, 900)


M_CP_ESTADOS = ["Operador: sus permisos", "Cambiar permisos: lo incluido", "Invitación: sin confirmar", "Reenviar una invitación sin confirmar"]


def m_cuenta_plat_base2():
    op_t = reemplazar_div(copia("m_cplat_op"), '<div class="r212t"', areas_lectura(PLAT, LAURA))
    perm = reemplazar_div(copia("m_cplat_perm"), '<div class="r212t"', areas_lectura(PLAT, LAURA))
    perm = reemplazar_div(perm, '<div class="r212t marco"', areas(PLAT, LAURA | {"Administrar cuentas"},
                                                                  {"Organizaciones", "Cuentas"}, tip_en="Ver cuentas"))
    inv = reemplazar_div(copia("m_cplat_inv"), '<div class="r212t"', areas_lectura(PLAT, JULIETA_TIENE))
    k = inv.index('<div class="ap-cuerpo">') + len('<div class="ap-cuerpo">')
    con = lambda abierto: inv[:k] + grupo_tel("Invitación", [("Correo", JULIETA), ("Vence", "04/10/2026, 18:00"),
                                                             ("Entrega", entrega("Uncertain", "correo", abierto, "b2-tip-abajo"))],
                                              '<a href="#">Reenviar invitación</a>') + inv[k:]
    sin = con(True)
    reenviar = con_hoja(con(False), hoja_tel(f"¿Reenviar la invitación a {JULIETA}?", reenviar_texto("la persona", "correo"), "Reenviar"))
    return tablero("M-Cuenta-Plat", "Ficha de una cuenta · operador · teléfono", css(True), por_estado([op_t, perm, sin, reenviar]),
                   M_CP_ESTADOS, 390, 844)


TABLEROS = [("Usuarios-Base2", usuarios_base2), ("M-Usuarios-Base2", m_usuarios_base2), ("Usuario-Base2", usuario_base2),
            ("M-Usuario-Base2", m_usuario_base2), ("Empresa-Base2", empresa_base2), ("M-Empresa-Base2", m_empresa_base2),
            ("Cuentas-Base2", cuentas_base2), ("M-Cuentas-Base2", m_cuentas_base2), ("Cuenta-Plat-Base2", cuenta_plat_base2),
            ("M-Cuenta-Plat-Base2", m_cuenta_plat_base2)]


def main(solo=None):
    hechos = []
    for nombre, hacer in TABLEROS:
        if solo and nombre not in solo:
            continue
        escribir(nombre, hacer())
        hechos.append(nombre)
    return hechos


if __name__ == "__main__":
    import sys
    main(sys.argv[1:] or None)
