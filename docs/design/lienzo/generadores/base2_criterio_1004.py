"""Los «Criterio» de la segunda parte de la base: `Criterio-Tablas-Base2` (F4, F5 y F12) y `Criterio-Elegir`, nuevo (F11).

- `Criterio-Tablas-Base2`: el encabezado que ordena con ↑ o ↓ en el color de la marca y ↕ al pasar el mouse, y «Ordenar por» al final
  de la barra (264); ninguna fila con un botón con texto (261); nada debajo de otro dato, ni el texto en gris (263); los permisos de
  un rol en áreas plegables, con un área abierta y lo incluido apagado con su motivo (260); y el teléfono, con cada fila como una
  tarjeta y «Ordenar por» a todo el ancho.
- `Criterio-Elegir`: la pieza para elegir (262, DS1-A y DS2-A de ArquitecturaBase), cerrada y abierta en cada caso, con los tres
  detalles de la revisión del 2026-11-23 (IM3-A): la lista abre con la elegida a la vista, una del servidor no dice «0 opciones» si ya
  dice que no hay, y la de un botón de la barra toma el ancho de sus nombres.

Parte de la copia de `base2_1004/crit_tablas.html` y de la cabeza de `Criterio-Tablas`. Lo del teléfono va con selectores `.tel-…`,
que la pasada de las piezas no escala.
"""
import re

from base2_comun import (ORG, SVG_FLECHA, SVG_LUPA, SVG_TILDE, SVG_KEB, areas, campo, copia, css, escribir, est, lista, op,
                         tablero, una_vez)

RH = {"Invitar usuarios", "Administrar usuarios", "Asignar roles", "Ver empresas"}


def reemplazar_li(t, empieza, nuevo):
    i = t.index(empieza)
    i = t.rindex("<li", 0, i)
    j = t.index("</li>", i) + len("</li>")
    return t[:i] + nuevo + t[j:]


def li(texto):
    return f"<li>{texto}</li>"


# ---------------------------------------------------------------------------------------------------------------- el teléfono
CSS_TEL_FIG = """
/* Las figuras del teléfono: a su medida (390), sin la escala de la compu. */
.tel-fig { width: 360px; flex: none; border: 1px solid var(--borde2); border-radius: 22px; background: #fff; overflow: hidden; font-size: 15px; color: var(--t1); }
.tel-fig .tel-bar { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 0 8px 0 18px; border-bottom: 1px solid var(--borde); }
.tel-fig .tel-bar h3 { flex: 1; margin: 0; font-size: 18px; font-weight: 700; }
.tel-fig .tel-x { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; color: var(--t1); }
.tel-fig .tel-bus { display: flex; align-items: center; gap: 10px; margin: 10px 14px 4px; height: 44px; padding: 0 12px; border: 1px solid var(--marca); border-radius: 10px; box-shadow: 0 0 0 1px var(--marca); color: var(--t3); }
.tel-fig .tel-cant { padding: 2px 18px 8px; color: var(--t2); font-size: 13px; border-bottom: 1px solid var(--borde); }
.tel-fig .tel-op { display: flex; align-items: center; gap: 14px; min-height: 56px; padding: 6px 18px; border-bottom: 1px solid var(--borde); }
.tel-fig .tel-op .d { display: block; color: var(--t2); font-size: 13px; }
.tel-fig .tel-op.apag, .tel-fig .tel-op.apag .d { color: var(--t3); }
.tel-fig .tel-cb { display: inline-flex; flex: none; width: 22px; height: 22px; box-sizing: border-box; align-items: center; justify-content: center; border: 1.5px solid var(--borde2); border-radius: 4px; color: #fff; }
.tel-fig .tel-cb.on { border-color: var(--marca); background: var(--marca); }
.tel-fig .tel-cb.apag { border-color: var(--borde); background: var(--s3); }
.tel-fig .tel-pie { padding: 12px 18px 22px; border-top: 1px solid var(--borde); }
.tel-fig .tel-listo { display: flex; height: 48px; align-items: center; justify-content: center; border-radius: 10px; background: var(--marca); color: #fff; font-weight: 600; }
.tel-fig .tel-ord { display: flex; align-items: center; justify-content: space-between; margin: 10px 14px; height: 44px; padding: 0 14px; border: 1px solid var(--borde2); border-radius: 10px; color: var(--t1); }
.tel-fig .tel-tj { position: relative; padding: 12px 52px 12px 16px; border-bottom: 1px solid var(--borde); }
.tel-fig .tel-tj .nm { display: block; font-size: 16px; font-weight: 600; }
.tel-fig .tel-tj .dl { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; margin-top: 8px; }
.tel-fig .tel-tj .k { display: block; color: var(--t2); font-size: 12.5px; }
.tel-fig .tel-tj .keb { position: absolute; top: 6px; right: 4px; display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; color: var(--t2); }
.tel-fig .tel-tj .b2-est { color: var(--t1); }
.tel-rot { display: block; margin-top: 8px; color: var(--t2); font-size: 12px; font-weight: 600; }
"""


def tel_tarjeta(n, datos):
    dl = "".join(f'<span><span class="k">{k}</span>{v}</span>' for k, v in datos)
    return f'<div class="tel-tj"><span class="nm">{n}</span><span class="dl">{dl}</span><span class="keb">{SVG_KEB}</span></div>'


def tel_lista():
    filas = [("Lucía Fernández", [("Estado", est("ok", "Activo")), ("Rol", "Dueño")]),
             ("Tomás Acosta", [("Estado", est("ok", "Activo")), ("Rol", "—")]),
             ("Sofía Herrera", [("Estado", est("pend", "Invitación pendiente")), ("Entrega", est("aten", "Sin confirmar"))])]
    return (f'<div class="tel-fig"><div class="tel-bar"><h3>Usuarios</h3></div><div class="tel-ord"><span>Ordenar por: Usuario, de la A a la Z</span>{SVG_FLECHA}</div>'
            + "".join(tel_tarjeta(n, d) for n, d in filas) + "</div>")


def tel_pieza():
    ops = [("Dueño", "Tiene todos los permisos de la organización.", False, True), ("Administración de personas", "Invita y edita personas y roles.", False, False),
           ("Auditor", "Ve los usuarios y la auditoría.", False, True), ("Recursos humanos", "Invita, edita y da de baja usuarios.", True, False),
           ("Ventas", "Atiende a los clientes por WhatsApp.", True, False), ("Ventas mayoristas", "Atiende a los clientes mayoristas.", False, False)]
    filas = "".join(f'<div class="tel-op{" apag" if ap else ""}"><span class="tel-cb{" on" if on else ""}{" apag" if ap else ""}">{SVG_TILDE if on else ""}</span>'
                    f'<span><span>{n}</span><span class="d">{d}</span></span></div>' for n, d, on, ap in ops)
    return (f'<div class="tel-fig"><div class="tel-bar"><h3>Roles de la organización</h3><span class="tel-x">✕</span></div>{filas}'
            '<div class="tel-pie"><span class="tel-listo">Listo (2)</span></div></div>')


def tel_buscador():
    ops = [("Buenos Aires", "hora de Argentina · GMT−3", True), ("Córdoba", "hora de Argentina · GMT−3", False), ("Asunción", "hora de Paraguay · GMT−3", False),
           ("Montevideo", "hora de Uruguay · GMT−3", False), ("Santiago", "hora de Chile · GMT−3", False)]
    filas = "".join(f'<div class="tel-op"><span style="width: 22px; color: var(--marca-tx);">{SVG_TILDE if on else ""}</span>'
                    f'<span><span>{n}</span><span class="d">{d}</span></span></div>' for n, d, on in ops)
    return (f'<div class="tel-fig"><div class="tel-bar"><h3>Zona horaria</h3><span class="tel-x">✕</span></div><div class="tel-bus">{SVG_LUPA}Buscar</div>'
            f'<div class="tel-cant">418 zonas</div>{filas}</div>')


# ---------------------------------------------------------------------------------------------------------------- Criterio-Tablas
def criterio_tablas_base2():
    t = copia("crit_tablas")
    # La tabla: la flecha de la que ordena, ↕ al pasar el mouse por otra y «Ordenar por» al final de la barra (264).
    t = una_vez(t, '<span aria-sort="ascending">Usuario<span class="ord" aria-hidden="true">▲</span></span>',
                '<span aria-sort="ascending">Usuario<span class="b2-fl" aria-hidden="true">↑</span></span>')
    t = una_vez(t, '<span>Empresa</span><span>Estado</span><span>Vencimiento</span>',
                '<span class="b2-hov">Empresa<span class="b2-fl hov" aria-hidden="true">↕</span></span><span>Estado</span><span>Vencimiento</span>')
    t = una_vez(t, '<span class="pil">Empresa <svg', '<span class="pil">Empresa <svg')
    i = t.index('<div class="fb2"')
    j = t.index("</div>", i)
    t = t[:j] + f'<span class="b2-sep" aria-hidden="true"></span><span class="pil b2-ordenar">Ordenar por: Usuario, de la A a la Z {SVG_FLECHA}</span>' + t[j:]
    t = reemplazar_li(t, "<strong>Un dato por columna</strong> (206). Lo que lo aclara",
                      li("<strong>Un dato por columna</strong> (206). Lo que lo aclara va en su propia columna si la persona lo necesita (Correo, "
                         "Vencimiento), o no va. <strong>Nada debajo de otro dato</strong> (263), tampoco un texto en gris. Sin dato, una sola raya. "
                         "Un texto largo baja de renglón, sin «…» (174)."))
    t = reemplazar_li(t, "<strong>La columna ordenada</strong>",
                      li("<strong>Toda columna con un dato ordena</strong> (264): su encabezado es un botón. La que ordena muestra ↑ o ↓ en el color "
                         "de la marca, después del título (antes, en una de números); las demás, ↕ al pasar el mouse o con el foco. El primer toque "
                         "ordena en el sentido útil (de la A a la Z, lo más reciente, el número mayor) y el segundo lo invierte. Lo vacío va al final. "
                         "No ordenan Acciones, las de un ícono ni las de varios valores.")
                      + li("<strong>«Ordenar por»</strong>, último en la barra y separado de los filtros, porque no saca filas: dice el orden con "
                           "palabras y abre la pieza con «Columna» y «Orden». Mueve el mismo orden que el encabezado, y «Limpiar todo» lo conserva."))
    t = reemplazar_li(t, "<strong>Las acciones van en ⋮:</strong>",
                      li("<strong>Las acciones de una fila van en su ⋮</strong> (261), nunca un botón con texto: las comunes arriba; las de peligro "
                         "abajo, en rojo y separadas. Ir a otro lado sigue siendo un enlace."))
    # La lista: «Verificar» pasa a su ⋮ (261).
    t = re.sub(r'<span class="acc"><button type="button" class="cb cb-enl"[^>]*>Verificar</button></span>', '<span class="acc"></span>', t)
    t = reemplazar_li(t, "<strong>Se lee, no se edita adentro.</strong>",
                      li("<strong>Se lee, no se edita adentro.</strong> Cambiar una fila o sumar otra abre un diálogo chico, desde el ⋮ o desde la "
                         "acción del encabezado. <strong>Ninguna fila lleva un botón con texto</strong> (261): «Verificar» va primero en su ⋮."))
    # Los permisos de un rol: en áreas plegables (260).
    t = una_vez(t, "<h2>Los permisos de un rol, en una matriz</h2>", "<h2>Los permisos de un rol, en áreas plegables</h2>")
    i = t.index('<div class="t15-caso">', t.index("<h2>Los permisos de un rol"))
    j = t.index('<ul class="t15-reglas">', i)
    figura = (f'<div class="t15-caso" style="position: relative;">{areas(ORG, RH, {"Usuarios", "Roles"}, tip_en="Ver usuarios")}'
              '<span class="t15-rot">Editar el rol Recursos humanos · un área por banda; lo incluido, apagado con su motivo</span></div> ')
    t = t[:i] + figura + t[j:]
    i = t.index('<ul class="t15-reglas">', i)
    j = t.index("</ul>", i) + len("</ul>")
    reglas = ('<ul class="t15-reglas">'
              + li("<strong>Una banda por área</strong> (260), con la flecha, su casilla (vacía, parcial o completa), su nombre y su (i). Toda "
                   "área lleva su casilla, también la de un solo permiso. Abierta, un permiso por fila con su casilla y su nombre entero.")
              + li("<strong>Al entrar se abren las áreas que tienen algo;</strong> un rol nuevo arranca con todas cerradas. Sin cuentas, "
                   "buscador, filtros ni descripciones a la vista: qué permite cada permiso va en la (i) del área, uno por renglón.")
              + li("<strong>Un permiso incluye a otro:</strong> marcar «Administrar usuarios» marca «Ver usuarios» y lo deja apagado con su "
                   "motivo, «Lo incluye «Administrar usuarios».»; si lo incluyen dos, el motivo nombra a los dos.")
              + li("<strong>Lo que quien edita no puede dar</strong> va apagado con su motivo (269 y 0061), en lugar de esperar el error al guardar.")
              + li("<strong>El Dueño, y todo rol que no se cambia,</strong> se lee con tildes, sin casillas y con sus áreas cerradas. Igual en "
                   "los roles de la organización, en los de una empresa y en los permisos de un operador de Plataforma.")
              + li("<strong>En el teléfono,</strong> la misma lista con filas de 44 px, y la flecha y la casilla del área con su zona de 44 px "
                   "cada una, sin pisarse; a 320 los nombres largos bajan de renglón.") + "</ul>")
    t = t[:i] + reglas + t[j:]
    # Un dato por columna: la descripción del tema en su columna (263).
    cols = ' style="grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) 90px 160px;"'
    t = una_vez(t, '<div class="th t15-cols2"><span>Tema</span><span class="n">Pedidos</span>',
                f'<div class="th t15-cols2"{cols}><span>Tema</span><span>Descripción</span><span class="n">Pedidos</span>')
    for tema, desc in (("Reclamos de clientes", "Dejar asentado el reclamo de un cliente: qué pasó y qué pide."),
                       ("Pedidos de materiales", "Pedir materiales para una obra, con cantidades.")):
        t = una_vez(t, f'<div class="tr t15-cols2"><span>{tema}<span class="sec">{desc}</span></span>',
                    f'<div class="tr t15-cols2"{cols}><span>{tema}</span><span>{desc}</span>')
    t = una_vez(t, "Formularios que faltan · la descripción, en gris debajo del tema", "Formularios que faltan · la descripción, en su columna")
    t = reemplazar_li(t, "<strong>Dos excepciones.</strong>",
                      li("<strong>Nada debajo de otro dato</strong> (263): ni un texto en gris, que pasa a su columna o no va. Debajo queda solo lo "
                         "que no es un dato del registro: «Antes: …» al corregir, el error de un campo y la línea gris de quién y cuándo. Las listas "
                         "que no son tablas (el chat, las opciones de un diálogo) siguen las lecturas."))
    t = reemplazar_li(t, "<strong>Las filas con acciones a la vista</strong>",
                      li("<strong>Las filas con ↑ ↓ ✎ 🗑</strong> llevan cada dato en su columna: el tipo y si es obligatoria, o el tipo y el papel "
                         "de un campo (263)."))
    # Lecturas: los datos de la opción elegida, cada uno en su renglón «Pregunta · Dato», en gris (263 y 266).
    viejo = re.search(r'<div class="f"><span class="k">Proveedor</span><span class="v"><span>Aceros Rosario</span><span class="sub2">.*?</span></span></div>',
                      t, re.S).group(0)
    t = t.replace(viejo, '<div class="f"><span class="k">Proveedor</span><span class="v">Aceros Rosario</span></div>'
                         '<div class="f"><span class="k">Proveedor · CUIT</span><span class="v" style="color: var(--t2);">30-70988123-4</span></div>'
                         '<div class="f"><span class="k">Proveedor · Plazo de pago</span><span class="v" style="color: var(--t2);">30 días</span></div>')
    t = re.sub(r"Lo que depende de un valor, como los campos de la opción elegida, va alineado debajo, con una línea a la izquierda\.",
               "Los datos de la opción elegida van cada uno en su renglón, «Proveedor · CUIT», en gris porque salen del catálogo; nunca debajo del valor (263).", t)
    # Prohibido
    t = una_vez(t, "Una lista de permisos que se abre y se cierra: los permisos de un rol son una matriz (212).",
                "Una matriz de permisos: los permisos de un rol van en áreas plegables (260).")
    t = una_vez(t, "<li>Botones sueltos en la fila, salvo un enlace que pide el estado.</li>",
                "<li>Un botón con texto en una fila: lo que se hace con ella va en su ⋮ (261).</li>"
                "<li>Un dato debajo de otro, también un texto en gris (263).</li>"
                "<li>Una columna con un dato que no ordena, o la que ordena sin su flecha (264).</li>"
                "<li>En el teléfono, datos unidos con «·» debajo del nombre (263).</li>")
    # Dos secciones nuevas, antes de «Medidas»: el orden y el teléfono.
    orden = ('<section data-b2=""><h2>Ordenar por las columnas</h2><div class="b2-lado"><div class="b2-figs">'
             '<div class="tb b2-mini"><div class="th"><span aria-sort="descending">Recibida<span class="b2-fl" aria-hidden="true">↓</span></span>'
             '<span class="b2-hov">Cliente<span class="b2-fl hov" aria-hidden="true">↕</span></span><span class="num">Cantidad</span></div>'
             '<div class="tr"><span>15/10/2026, 16:20</span><span>Ferretería Rosales</span><span class="num">1.250</span></div>'
             '<div class="tr"><span>14/10/2026, 09:30</span><span>Obra Centro</span><span class="num">500</span></div>'
             '<div class="tr"><span>12/10/2026, 11:05</span><span><span class="nada">—</span></span><span class="num">75,5</span></div></div>'
             '<span class="t15-rot">Ordena por Recibida, la más reciente primero; ↕ con el mouse sobre Cliente</span>'
             '<div class="tb b2-mini"><div class="th"><span>Cliente</span><span class="num" aria-sort="descending"><span class="b2-fl" style="margin: 0 5px 0 0;">↓</span>Cantidad</span></div>'
             '<div class="tr"><span>Ferretería Rosales</span><span class="num">1.250</span></div><div class="tr"><span>Obra Centro</span><span class="num">500</span></div></div>'
             '<span class="t15-rot">En una columna de números, la flecha va antes del título</span>'
             '<div class="b2-ordpan"><div class="fb2" style="margin: 0;"><span class="bus">Buscar</span><span class="pil">Estado</span>'
             f'<span class="b2-sep" aria-hidden="true"></span><span class="pil b2-ordenar" style="border-color: var(--marca);">Ordenar por: Recibida, más reciente primero {SVG_FLECHA}</span></div>'
             '<div class="b2-pop"><div class="b2-pop-c"><span class="et">Columna</span>' + campo("Recibida", aria="Columna") + '</div>'
             '<div class="b2-pop-c"><span class="et">Orden</span>' + campo("Más reciente primero", abierto=True, aria="Orden",
                                                                          extra=lista([op("Más reciente primero", elegida=True), op("Más vieja primero")])) + '</div></div></div>'
             '<span class="t15-rot" style="margin-top: 96px;">«Ordenar por» abre la pieza con «Columna» y «Orden»</span></div>'
             '<ul class="t15-reglas">'
             + li("<strong>Dos lugares, el mismo orden:</strong> el encabezado y «Ordenar por». Cambiar el orden vuelve a la página 1 y va en la dirección.")
             + li("<strong>Un estado o un tipo ordena por su circuito</strong> (Recibida, Por aprobar, Aprobada, Rechazada, Anulada), igual en los dos idiomas.")
             + li("<strong>Sin orden elegido,</strong> la lista abre como siempre: si es una columna se ve su flecha; si es compuesto, no hay flecha y el botón dice «Ordenar por».")
             + li("<strong>No cambian las tablas cuyo orden es un dato:</strong> las opciones de un catálogo, las preguntas con ↑ ↓, los ítems de una respuesta. Tampoco «Por aprobar», que es una cola.")
             + "</ul></div></section>")
    telefono = ('<section data-b2=""><h2>En el teléfono</h2><div class="b2-lado"><div class="b2-tels"><div>' + tel_lista()
                + '<span class="tel-rot">Cada fila, una tarjeta con sus datos nombrados; «Ordenar por» a todo el ancho</span></div></div>'
                '<ul class="t15-reglas">'
                + li("<strong>Una fila no junta datos con «·» debajo del nombre</strong> (263): lleva menos datos, o es una tarjeta con cada dato "
                     "nombrado, de a dos. Un dato largo ocupa las dos columnas.")
                + li("<strong>«Ordenar por»</strong> ocupa el ancho, arriba de la lista, y abre la pieza a pantalla completa.")
                + li("<strong>El ⋮ de la fila</strong> va arriba a la derecha de la tarjeta, con 44 px para tocar.")
                + "</ul></div></section>")
    i = t.index("<section", t.index("<h2>Los permisos de un rol"))
    i = t.index("<section", i + 10)
    t = t[:i] + orden + telefono + t[i:]
    extra = """
.b2-lado { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 28px; align-items: start; }
.b2-figs { display: flex; flex-direction: column; gap: 6px; }
.b2-mini { max-width: 560px; }
.b2-mini .th, .b2-mini .tr { grid-template-columns: 200px minmax(0, 1fr) 120px !important; }
.b2-mini .th > span, .b2-mini .tr > span { display: flex; align-items: center; }
.b2-mini .num { justify-content: flex-end; }
.b2-ordpan { position: relative; margin-top: 14px; max-width: 620px; }
.b2-pop { position: absolute; z-index: 30; right: 0; top: calc(100% + 4px); display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 420px; padding: 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); }
.b2-pop .et { display: block; margin-bottom: 5px; color: var(--t2); font-size: 13px; font-weight: 600; }
.b2-tels { display: flex; gap: 24px; }
"""
    return tablero("Criterio-Tablas", "Criterio · Tablas y listas · base 2: el orden, nada debajo, el ⋮ y las áreas", css() + CSS_TEL_FIG + extra,
                   t, None, 1440, 5600)


# ---------------------------------------------------------------------------------------------------------------- Criterio-Elegir
ROLES = [("Dueño", "Tiene todos los permisos de la organización.", "Tiene permisos que no tenés."),
         ("Administración de personas", "Invita y edita personas y roles.", None),
         ("Auditor", "Ve los usuarios y la auditoría. No cambia nada.", "Tiene permisos que no tenés."),
         ("Recursos humanos", "Invita, edita y da de baja usuarios.", None), ("Ventas", "Atiende a los clientes por WhatsApp.", None),
         ("Ventas mayoristas", "Atiende a los clientes mayoristas.", None)]
CAMPOS = ["Campo La Esperanza", "Campo El Ombú", "Campo San José", "Campo Los Álamos", "Campo Santa Rosa", "Campo La Paloma", "Campo El Trébol"]


def fig(titulo, cuerpo, alto_=None):
    h = f" style=\"min-height: {alto_}px;\"" if alto_ else ""
    return f'<div class="b2-fig"><div class="b2-fig-c"{h}>{cuerpo}</div><span class="t15-rot">{titulo}</span></div>'


def et(texto):
    return f'<span class="b2-et2">{texto}</span>'


def criterio_elegir():
    cerradas = ('<div class="b2-figs3">'
                + fig("Una: lo elegido", et("Zona horaria") + campo('Buenos Aires <span class="g">· hora de Argentina · GMT−3</span>'))
                + fig("Varias, por su nombre, y «y N más» si no entran", et("Roles de la organización") + campo("Recursos humanos, Ventas y 2 más"))
                + fig("Sin nada: lo dice en gris", et("Campo asignado") + campo("Sin campo asignado", vacio=True))
                + fig("Apagada: el motivo en un tooltip (211)", '<div style="padding-top: 30px;">' + et("Roles en la empresa")
                      + campo("Elegí una empresa primero", vacio=True, apagado="Elegí una empresa primero.") + "</div>")
                + fig("Con un error: debajo del campo", et("Países que reciben códigos") + campo("Sin países", vacio=True, error=True)
                      + '<span class="b2-err">Elegí al menos un país.</span>')
                + fig("En la barra de un listado, el filtro conserva su botón", f'<span class="pil b2-pil">Estado: todos {SVG_FLECHA}</span>'
                      f'<span class="pil b2-pil">Rol: Ventas {SVG_FLECHA}</span>')
                + "</div>")
    una = fig("Una: «Todas» primero y separada; la elegida con su tilde a la izquierda; la descripción en gris debajo",
              et("Rol") + campo("Ventas", abierto=True, extra=lista([op("Todos los roles")] + [op(n, d, elegida=n == "Ventas", sep=k == 0)
                                                                       for k, (n, d, _) in enumerate(ROLES[3:])])), 300)
    varias = fig("Varias: una casilla; marcar no cierra; lo que no podés dar, apagado con su motivo",
                 et("Roles de la organización") + campo("Recursos humanos, Ventas", abierto=True,
                                                        extra=lista([op(n, d, elegida=n in ("Recursos humanos", "Ventas"), multiple=True, apagada=m,
                                                                        tip_abierto=n == "Auditor") for n, d, m in ROLES], multiple=True)), 420)
    buscador = fig("Más de diez: el buscador adentro, con el foco, y la cantidad; abre con la elegida a la vista",
                   et("Campo asignado") + campo("Campo San José", abierto=True, extra=lista(
                       [op("Sin campo asignado")] + [op(c, elegida=c == "Campo San José", sep=k == 0, activa=c == "Campo San José") for k, c in enumerate(CAMPOS)],
                       buscar="", cantidad="38 opciones")), 420)
    servidor = ('<div class="b2-figs3">'
                + fig("Del servidor: mientras busca", et("Persona") + campo("Sin persona", vacio=True, abierto=True, extra=lista([], buscar="tom", msj="Buscando…")), 150)
                + fig("Del servidor: no hay ninguna (sin «0 opciones»)", et("Persona") + campo("Sin persona", vacio=True, abierto=True,
                                                                                              extra=lista([], buscar="zzz", msj="Ninguna opción coincide con «zzz».")), 150)
                + fig("Del servidor: si falla", et("Persona") + campo("Sin persona", vacio=True, abierto=True,
                                                                     extra=lista([], buscar="", msj='No pudimos traer las opciones. <span class="rein">Reintentar</span>')), 150)
                + fig("Del servidor: las elegidas de otra página primero, y «Mostrar 50 más»", et("Clientes") + campo("Ferretería Rosales, Obra Centro", abierto=True,
                      extra=lista([op("Ferretería Rosales", "Página 3", elegida=True, multiple=True), op("Obra Centro", "Página 5", elegida=True, multiple=True),
                                   op("Aceros Rosario", multiple=True, sep=True), op("Agroinsumos del Litoral S.A.", multiple=True), op("Frío Sur", multiple=True)],
                                  multiple=True, buscar="", cantidad="1.240 opciones", pie='<button type="button" class="mas">Mostrar 50 más</button>')), 380)
                + fig("Con un tope: «Hasta 5»", et("Zonas") + campo("Norte, Sur", abierto=True, extra=lista(
                    [op(z, elegida=z in ("Norte", "Sur"), multiple=True) for z in ("Norte", "Sur", "Este", "Oeste", "Centro")], multiple=True, tope="Hasta 5")), 300)
                + fig("Al llegar: «Elegiste 5 de 5», y las demás se apagan", et("Zonas") + campo("Norte, Sur, Este, Oeste y 1 más", abierto=True, extra=lista(
                    [op(z, elegida=z != "Litoral", multiple=True, apagada="Elegiste 5 de 5." if z == "Litoral" else None) for z in ("Norte", "Sur", "Este", "Oeste", "Centro", "Litoral")],
                    multiple=True, tope="Elegiste 5 de 5")), 340)
                + "</div>")
    barra = fig("La lista de un botón de la barra toma el ancho de sus nombres; «Todos» primero; sin cantidades",
                '<span class="b2-env" style="display: inline-block;">' + f'<span class="pil b2-pil" style="border-color: var(--marca);">Estado: activos {SVG_FLECHA}</span>'
                + lista([op("Todos"), op("Activos", elegida=True, sep=True), op("Dados de baja")], barra=True) + "</span>", 200)
    antes = fig("Antes, un segmentado con cantidad; ahora, un filtro con su botón (262)",
                '<span class="b2-seg"><s>Activos (8)</s><s>Dados de baja (2)</s></span> <span style="margin: 0 10px; color: var(--t3);">→</span>'
                f'<span class="pil b2-pil">Estado: activos {SVG_FLECHA}</span>', 120)
    fijas = fig("De dos a cuatro fijas y el Sí o No, también en la pieza; una casilla solo para un sí o no suelto",
                et("Registro de personas") + campo("Solo por invitación") + '<div style="height: 12px;"></div>' + et("¿Llegó en buen estado?")
                + campo("Sí") + '<label class="b2-cas"><span class="cb on">' + SVG_TILDE + "</span>Incluir las fotos</label>", 200)
    zona = fig("La zona horaria: la ciudad y, en gris, la hora de su país y el desfase; se busca por ciudad, país o identificador",
               et("Zona horaria") + campo('Montevideo <span class="g">· hora de Uruguay · GMT−3</span>', abierto=True,
                                          extra=lista([op("Montevideo", "hora de Uruguay · GMT−3", elegida=True, activa=True)], buscar="urug", cantidad="1 zona")), 220)
    teles = ('<div class="b2-tels">' + '<div>' + tel_pieza() + '<span class="tel-rot">Varias: a pantalla completa, renglones de 56 px y «Listo (N)»</span></div>'
             + '<div>' + tel_buscador() + '<span class="tel-rot">Más de diez: el buscador y la cantidad</span></div></div>')
    reglas = ('<ul class="t15-reglas">'
              + li("<strong>Todo lo que se elige va en la pieza</strong> (262): una o varias, de dos a cuatro fijas, el Sí o No, los filtros y la carga de un formulario. Sin radios, segmentados ni listas de casillas, ni un diálogo que solo sirve para elegir.")
              + li("<strong>Cerrada,</strong> un campo con su flecha fina que dice lo elegido, igual para una y para varias; sin nada, lo dice en gris. Nunca crece: varias, por su nombre y «y N más».")
              + li("<strong>Abierta,</strong> la lista de los menús: la descripción en gris debajo del nombre; «Todas» o «Sin …» primero y separada; la elegida con su tilde a la izquierda y, en varias, una casilla; marcar no cierra.")
              + li("<strong>Abre con la elegida a la vista</strong>, aunque esté más abajo en la lista.")
              + li("<strong>Con más de diez, o del servidor,</strong> el buscador va adentro, arriba, con el foco y la cantidad debajo. Del servidor: «Buscando…», «Ninguna opción coincide…» (sin «0 opciones»), «Mostrar N más» y «Reintentar».")
              + li("<strong>Un botón de la barra</strong> abre la misma lista, del ancho de sus nombres, sin cantidades.")
              + li("<strong>Con el teclado,</strong> las flechas recorren, Enter elige (en varias marca sin cerrar), Escape cierra y devuelve el foco al campo, y Tab cierra y sigue.")
              + li("<strong>Quedan afuera</strong> la vista previa que imita WhatsApp, las dos vistas de lo mismo («Clientes | Internos», «Por aprobar | Todas») y los menús de acciones.")
              + "</ul>")
    prohibido = ('<ul class="prohibido">' + "".join(f"<li>{x}</li>" for x in (
        "Radios, un segmentado o una lista de casillas para elegir (262).", "Un diálogo que solo sirve para elegir.",
        "Escribir en el campo para buscar: el buscador va adentro de la lista.", "Cantidades en las opciones de un filtro.",
        "La tilde a la derecha, o la elegida solo con un tinte.", "Un campo que crece con chips cuando se eligen varias.",
        "Una lista del servidor que dice «0 opciones» y además «Ninguna opción coincide…».")) + "</ul>")
    cuerpo = ('<div class="crit"><div><h1>Elegir de una lista</h1><p class="sub">Una sola pieza para elegir una o varias opciones, en toda la app (262).</p></div>'
              f'<section><h2>Cerrada</h2>{cerradas}</section>'
              f'<section><h2>Abierta</h2><div class="b2-figs3">{una}{varias}{buscador}</div></section>'
              f'<section><h2>Del servidor y con tope</h2>{servidor}</section>'
              f'<section><h2>Filtros, fijas y la zona horaria</h2><div class="b2-figs3">{barra}{antes}{fijas}{zona}</div></section>'
              f'<section><h2>En el teléfono</h2>{teles}</section>'
              f'<section><h2>La regla</h2>{reglas}</section>'
              f'<section><h2>Prohibido</h2>{prohibido}</section></div>')
    extra = """
.b2-figs3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px 28px; align-items: start; }
.b2-fig { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.b2-fig-c { position: relative; padding: 16px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; }
.b2-et2 { display: block; margin-bottom: 5px; color: var(--t1); font-size: 13px; font-weight: 600; }
.b2-pil { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; margin-right: 8px; border: 1px solid var(--borde); border-radius: 3px; background: #fff; color: var(--t2); font-size: 13px; }
.b2-seg { display: inline-flex; border: 1px solid var(--borde); border-radius: 3px; overflow: hidden; color: var(--t3); font-size: 13px; }
.b2-seg s { padding: 6px 10px; }
.b2-seg s + s { border-left: 1px solid var(--borde); }
.b2-cas { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 14px; }
.b2-cas .cb { display: inline-flex; width: 16px; height: 16px; align-items: center; justify-content: center; border-radius: 3px; background: var(--marca); color: #fff; }
.b2-cas .cb svg { width: 12px; height: 12px; }
.b2-tels { display: flex; gap: 40px; align-items: flex-start; }
.b2-fig .b2-pkl .ops { max-height: none; }
"""
    return tablero("Criterio-Tablas", "Criterio · Elegir de una lista (nuevo): la pieza para elegir", css() + CSS_TEL_FIG + extra, cuerpo, None,
                   1440, 3300)


TABLEROS = [("Criterio-Tablas-Base2", criterio_tablas_base2), ("Criterio-Elegir", criterio_elegir)]


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
