"""El chat del Inicio y la configuración del asistente con las reglas de toda la IA (tanda 4 del traspaso 15, 2026-11-18): la
ADR 0064 del back (puntos 2, 4, 5, 6, 7 y 8) y la decisión 223 de la hoja de ruta de formularios (§5), en lo que cae sobre el
Inicio ya programado (segunda parte de la base, 214). Suma estados a los diez tableros que ya existen, con sus piezas:

- **El chat del Inicio** (`Asistente-Org`, `Asistente-Personal` y `Asistente-Plat`, con sus teléfonos), cuatro estados nuevos:
  - «Se cortó» (8): la respuesta queda con «La consulta se cortó porque el servicio se reinició antes de terminarla.», en el
    mismo aviso rojo de «Falló la respuesta», con «Reintentar», y debajo, en gris, «Puede haber contado en el consumo.»: el
    estado se dibuja con la consulta que llegó a la IA, que es lo que pasa al vencer el plazo de vaciado (lo que no reservó un
    paso vuelve a pendiente y no se corta). Nunca dice «cancelada»;
  - «Conversación no disponible» (6): en la lista, una fila más con ese título, abierta, con su ⋮ y solo «Borrar»; el hilo
    dice «No pudimos abrir esta conversación. Podés borrarla.» en la tarjeta de «El asistente todavía no está configurado»,
    sin la caja para escribir. Las demás conversaciones se ven. «Borrar» abre la confirmación con su título (un estado que
    no está en el Tweak: se llega desde el ⋮). En el teléfono, que no muestra la lista y el hilo a la vez, son tres estados:
    la conversación abierta, «… en la lista» (la hoja de conversaciones con la fila) y «… acciones» (la hoja del ⋮);
  - «Subir sin cupo» (2): el clip no sube el archivo y debajo del campo va el texto del tope de hoy («Llegaste a las 50
    consultas de hoy. Se renuevan a las 21:00.»), sin la ficha del archivo;
  - «Una subida a la vez» (4): la ficha del archivo que sube, con el aro y «Subiendo…», y debajo del campo «Ya estás subiendo
    un archivo. Esperá a que termine.»;
  - «Borrar» (5): la confirmación de siempre suma «Se borran también sus archivos.». Queda «Se borra para siempre. Se borran
    también sus archivos.»: «con sus adjuntos» se va, porque los adjuntos son archivos y dirían lo mismo dos veces (213, 7).
- **La configuración del asistente** (`Asistente-Config-Org` y `Plat-Asistente-Config`, con sus teléfonos): cada falla de la
  conexión (7) en un estado, dicha una vez, donde se arregla:
  - en la zona de la clave, debajo del campo, la clave rechazada («El proveedor rechazó la clave. Reemplazala.») y la clave que
    no se puede leer («No pudimos leer la clave guardada: reemplazala.»), con «Reemplazar clave» resaltado (el principal, chico)
    en lugar de «Cambiar», como en ArquitecturaBase;
  - debajo del modelo, en rojo, «El proveedor no aceptó el modelo configurado. Elegí otro.»;
  - en la banda, con su punto, la cuenta del proveedor sin cupo, la falta de conexión y la conexión en pausa (6), que en la
    banda va en ámbar y deja el proveedor para elegir («Elegí un proveedor»), la clave vacía y el modelo sin elegir; en el
    teléfono, que no tiene banda, el mismo renglón va arriba del cuerpo.

  Quién actúa depende de quién paga: Plataforma tiene los seis, para el operador; la organización, con su clave, los seis para el
  Dueño («Su clave: …»), y con la de la plataforma, uno solo, «El asistente no está disponible por ahora. Lo está resolviendo la
  plataforma.», en la banda y sin «Reemplazar clave».

Dos arreglos del mismo día en el chat, pedidos al revisarlo:
- «Falló la respuesta» y «Se cortó» pasan a la regla de los avisos (210): blancos, con la tinta de siempre, el filo de 3 px a la
  izquierda y el octógono del error, del mismo color (`t4-fallo`, como «La propuesta no entra» de `Asistente-Org-25` y
  `CSS_AVISOS` de la pasada de las piezas). No llevan ✕; «Reintentar» queda, porque es su acción;
- la confirmación de borrar, igual en los tres lados: `Asistente-Personal` no tenía el encabezado de los diálogos de
  `Criterio-Dialogos` (arena, con su línea, de 48 y sin bajada, como `DialogHeader` en la compu), que los otros dos toman de sus
  bloques `data-criterio="aplicado"` y `data-vuelta="1004-piezas-comunes"`; copia esas reglas de `.dlg` desde `Asistente-Org`.
  Vale para los tres diálogos del tablero. Las hojas del teléfono ya eran iguales.

La lógica nueva va en un método propio, `tanda4(a)`, que recibe lo que ya calculaba el tablero y pisa solo lo de sus estados, así
los estados de antes no cambian. Las piezas se copian del mismo tablero (el aviso de «Falló la respuesta», la fila abierta de la
lista con su menú, la ficha de un adjunto, la tarjeta del asistente sin configurar, la confirmación de borrar, el estado de la
banda `w-est`, el error `as-err` y el campo `ct`); el único CSS nuevo va en un bloque `<style data-t4i>` por tablero.

Corre al final de todo y después va la pasada de las piezas solo sobre estos diez tableros (al terminar imprime el comando). No
toca `canvas.json`. Lee y escribe sin cambiar los finales de línea, y se puede volver a correr sin cambiar nada: lo que ya está
hecho no vuelve a encontrar lo que busca, y un estado sumado no se suma otra vez.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent

CHAT = {  # tablero: el título de la conversación abierta (la primera de «Recientes»)
    "Asistente-Org": "Invitaciones vencidas", "M-Asistente-Org": "Invitaciones vencidas",
    "Asistente-Personal": "Por qué no puedo entrar a Beta", "M-Asistente-Personal": "Por qué no puedo entrar a Beta",
    "Asistente-Plat": "Organizaciones por aprobar", "M-Asistente-Plat": "Organizaciones por aprobar",
}
CONFIG = ["Asistente-Config-Org", "M-Asistente-Config-Org", "Plat-Asistente-Config", "M-Plat-Asistente-Config"]

ND = "Conversación no disponible"
T_CORTO = "La consulta se cortó porque el servicio se reinició antes de terminarla."
T_CONSUMO = "Puede haber contado en el consumo."
T_ND = "No pudimos abrir esta conversación. Podés borrarla."
T_TOPE_HOY = "Llegaste a las 50 consultas de hoy. Se renuevan a las 21:00."
T_UNA_A_LA_VEZ = "Ya estás subiendo un archivo. Esperá a que termine."
T_BORRAR_ANTES = "Se borra para siempre, con sus adjuntos."
T_BORRAR = "Se borra para siempre. Se borran también sus archivos."

FALLAS = {  # 0064 §7: el texto y dónde va
    "rechazada": {"clave": "El proveedor rechazó la clave. Reemplazala."},
    "cupo": {"banda": "La cuenta del proveedor llegó a su cupo o a su límite de uso. Revisalo en el proveedor."},
    "modelo": {"modelo": "El proveedor no aceptó el modelo configurado. Elegí otro."},
    "conexion": {"banda": "No pudimos conectarnos con el proveedor. No se envió nada."},
    "ilegible": {"clave": "No pudimos leer la clave guardada: reemplazala."},
    "pausa": {"banda": "La conexión quedó en pausa: esta versión no reconoce el proveedor guardado. Guardá para elegir uno y cargar la clave.",
              "pausa": True},
}
ESTADOS_ORG = {"Su clave: rechazada": "rechazada", "Su clave: cupo del proveedor": "cupo", "Su clave: modelo no aceptado": "modelo",
               "Su clave: no se pudo conectar": "conexion", "Su clave: no se puede leer": "ilegible",
               "Su clave: proveedor desconocido": "pausa"}
ORG_PLATAFORMA = ("La de la plataforma: no disponible",
                  {"banda": "El asistente no está disponible por ahora. Lo está resolviendo la plataforma.", "plataforma": True})
ESTADOS_PLAT = {"Falla: clave rechazada": "rechazada", "Falla: cupo del proveedor": "cupo", "Falla: modelo no aceptado": "modelo",
                "Falla: no se pudo conectar": "conexion", "Falla: la clave no se puede leer": "ilegible",
                "Falla: proveedor desconocido": "pausa"}


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    with open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="") as f:
        return f.read()


def escribir(nombre, t):
    with open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="") as f:
        f.write(t)


def cambiar(t, viejo, nuevo, veces=1):
    """`viejo` por `nuevo`, que está `veces` veces. Si ya no está, es una corrida anterior (y `nuevo` tiene que estar)."""
    k = t.count(viejo)
    if k == 0:
        assert nuevo in t, ("no encuentro", viejo[:160])
        return t
    assert k == veces, (viejo[:160], k, veces)
    return t.replace(viejo, nuevo)


def cierre(t, i, etiqueta):
    """El fin del elemento `<etiqueta …>` que empieza en `i`, contando los del mismo nombre que tiene adentro."""
    prof = 0
    for m in re.compile(rf"<{etiqueta}\b|</{etiqueta}>").finditer(t, i):
        prof += 1 if m.group(0) != f"</{etiqueta}>" else -1
        if prof == 0:
            return m.end()
    raise AssertionError(f"<{etiqueta}> sin cerrar en {i}")


def bloque(t, inicio, etiqueta, desde=0):
    """El elemento que empieza con `inicio` (el primero desde `desde`): su posición y su texto."""
    i = t.index(inicio, desde)
    j = cierre(t, i, etiqueta)
    return i, j, t[i:j]


def despues(t, marca, inicio, etiqueta, nuevo):
    """Pone `nuevo` después de cada elemento que empieza con `inicio`, salvo que `marca` ya esté (una corrida anterior)."""
    if marca in t:
        return t
    partes, desde = [], 0
    while (i := t.find(inicio, desde)) >= 0:
        j = cierre(t, i, etiqueta)
        partes += [t[desde:j], nuevo]
        desde = j
    assert partes, inicio
    return "".join(partes) + t[desde:]


def sumar_opciones(t, prop, despues_de, nuevas):
    """Las opciones `nuevas` del Tweak `prop`, después de `despues_de` (las que ya están no se suman otra vez)."""
    m = re.search(r'"%s":\{"editor":"enum","options":\[([^\]]*)\]' % prop, t)
    assert m, prop
    opciones = json.loads("[" + m.group(1) + "]")
    faltan = [o for o in nuevas if o not in opciones]
    if not faltan:
        return t
    assert len(faltan) == len(nuevas), (prop, faltan)
    k = opciones.index(despues_de) + 1
    opciones[k:k] = nuevas
    return t[:m.start(1)] + ",".join(json.dumps(o, ensure_ascii=False) for o in opciones) + t[m.end(1):]


def con_estilo(t, marca, css):
    if f"<style {marca}>" in t:
        return t
    n = "\r\n" if "\r\n" in t else "\n"
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {marca}>{n}{css.replace(chr(10), n)}</style>{n}</helmet>", 1)


def js(texto, t):
    """El JavaScript con los finales de línea del tablero."""
    return texto.replace("\n", "\r\n") if "\r\n" in t else texto


def svg_de(t, inicio):
    """El primer `<svg>…</svg>` desde `inicio`."""
    i = t.index("<svg", t.index(inicio))
    return t[i:t.index("</svg>", i) + len("</svg>")]


def si(var, html, por_defecto="no"):
    return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{{por_defecto}}}}}">{html}</sc-if>'


# ---------------------------------------------------------------------------------------------------------------- el chat
JS_CHAT = """
  // Tanda 4 del traspaso 15 (ADR 0064, 2, 4, 5, 6 y 8): se cortó, la conversación no disponible, subir sin cupo y una subida
  // a la vez. Recibe lo que ya calcula el tablero y pisa solo lo de estos estados.
  tanda4(a) {
    const e = this.state.asE ?? (this.props.asistente ?? 'Bienvenida');
    const ir = (x, extra) => this.setState({ asE: x, asNombre: undefined, ...(extra || {}) });
    const ND = ['@ND@', '@ND@: en la lista', '@ND@: acciones', 'Borrar: @ND@'];
    const nd = ND.includes(e);
    const corto = e === 'Se cortó';
    const sinCupo = e === 'Subir sin cupo';
    const subiendo = e === 'Una subida a la vez';
    const menu = e === '@ND@' && (this.state.asNdM ?? true);
    const fuera = {
      asCorto: false, asNoDisp: false, asNdMenu: false, asNdExp: 'false', asNdFila: false, asNdAcciones: false, asNdBorrar: false,
      asSubiendo: false, asErrSubida: '', asConPieT4: true,
      asNdAlternar: () => this.setState({ asNdM: !menu }),
      asNdAbrir: () => ir('@ND@'),
      asNdAcc: () => ir('@ND@: acciones'),
      asNdBorrarIr: () => ir('Borrar: @ND@'),
      asNdVolver: () => ir('@ND@', { asNdM: false }),
    };
    if (!nd && !corto && !sinCupo && !subiendo) return fuera;
    return {
      ...fuera,
      asBienvenida: false, asSinConf: false, asConv: true, asPrimera: false, asAviso: false, asConHistorial: true,
      asVacio: false, asConMensajes: false, asConResultados: !nd, asActiva: nd ? '' : 'on',
      asConsultando: false, asConsultado: true, asEscribiendo: false, asDetenida: false, asFallo: false,
      asListo: sinCupo || subiendo, asCorriendo: false, asQuieto: true, asEscrito: '', asEnvBloq: false,
      asMenu: false, asExpMenu: 'false', asRenombrar: false, asBorrar: false, asAcciones: false, asQuedan: false,
      asTope: false, asTopeMes: false, asConCaja: true, asConPie: !nd, asConPieT4: !nd, asAdjuntos: false, asAdjMal: false,
      asCorto: corto, asNoDisp: nd, asSubiendo: subiendo,
      asErrSubida: sinCupo ? '@TOPE@' : subiendo ? '@UNA@' : '',
      asNdMenu: menu, asNdExp: menu ? 'true' : 'false',
      asHist: e === '@ND@: en la lista', asNdFila: e === '@ND@: en la lista',
      asNdAcciones: e === '@ND@: acciones', asNdBorrar: e === 'Borrar: @ND@',
      asAbrirHist: nd ? () => ir('@ND@: en la lista') : a.asAbrirHist,
      asCerrarHoja: nd ? () => ir('@ND@') : a.asCerrarHoja,
    };
  }

""".replace("@ND@", ND).replace("@TOPE@", T_TOPE_HOY).replace("@UNA@", T_UNA_A_LA_VEZ)

CSS_CHAT = """/* Tanda 4 (0064): la conversación que no se puede leer, en el medio del hilo; una subida en curso, con el aro en lugar del peso. */
.as-hilo .as-nd { margin: auto !important; }
.as-nc[role="alert"] strong { text-wrap: balance; }
.as-adj .as-spin { margin: 0 -2px 0 2px; }
.as-adj.t4-sube { max-width: 100%; }
"""
_SVG_ERROR = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
              'stroke-linejoin="round" aria-hidden="true">')
TRIANGULO = (_SVG_ERROR + '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/>'
             '<path d="M12 17h.01"/></svg>')
OCTOGONO = _SVG_ERROR + '<path d="M8.7 3h6.6L21 8.7v6.6L15.3 21H8.7L3 15.3V8.7z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/></svg>'
CSS_FALLO = """/* 210 · «Falló la respuesta» y «Se cortó», como aviso de error: blanco, con la tinta de siempre, el filo de 3 px y el octógono del
   mismo color, como «La propuesta no entra» de Asistente-Org-25. */
.as-fallo.t4-fallo { background: #fff; color: var(--t1); border: 1px solid var(--borde2); border-left: 3px solid var(--peligro); }
.as-fallo.t4-fallo > svg { color: var(--peligro); }
"""
ENCABEZADO_ARENA = ".dlg-h { background: oklch(0.945 0.027 95) !important"
CSS_DIALOGOS = ("/* Criterio · Diálogos: el encabezado de un diálogo, arena con su línea, de 48 y sin bajada, como en Asistente-Org y "
                "Asistente-Plat (copiado de sus bloques). */\n")


def pasar_chat(t, nombre):
    tel = nombre.startswith("M-")
    t0 = CHAT[nombre]
    # Los estados, en el Tweak.
    t = sumar_opciones(t, "asistente", "Con adjuntos" if tel else "Adjunto de más de 10 MB", ["Subir sin cupo", "Una subida a la vez"])
    t = sumar_opciones(t, "asistente", "Falló la respuesta", ["Se cortó"])
    t = sumar_opciones(t, "asistente", "Borrar", [ND] + ([f"{ND}: en la lista", f"{ND}: acciones"] if tel else []))

    # Borrar suma los archivos (antes de copiar la confirmación para la conversación no disponible).
    t = cambiar(t, T_BORRAR_ANTES, T_BORRAR)

    # Se cortó: el aviso de «Falló la respuesta», con su texto, y el consumo debajo.
    if "{{asCorto}}" not in t:
        _, _, falla = bloque(t, '<sc-if value="{{asFallo}}"', "sc-if")
        corto = falla.replace("{{asFallo}}", "{{asCorto}}", 1).replace("<span>El asistente no responde ahora.</span>", f"<span>{T_CORTO}</span>", 1)
        assert corto.count(T_CORTO) == 1 and corto.endswith("</div></sc-if>"), nombre
        corto = corto[:-len("</sc-if>")] + f'<span class="as-nota">{T_CONSUMO}</span></sc-if>'
        t = despues(t, "{{asCorto}}", '<sc-if value="{{asFallo}}"', "sc-if", corto)
    # Los dos, como aviso de error (210): blancos, con el filo y el octógono.
    t = cambiar(t, '<div class="as-fallo" role="alert">' + TRIANGULO, '<div class="as-fallo t4-fallo" role="alert">' + OCTOGONO, 2)

    # Una subida a la vez: la ficha del que sube, con el aro; y el error de la subida, debajo del campo.
    _, _, adjs = bloque(t, '<sc-if value="{{asAdjuntos}}"', "sc-if")
    _, _, ficha = bloque(adjs, '<span class="as-adj">', "span")
    assert "captura-usuarios.png" in ficha and '<span class="p">240 KB</span>' in ficha, nombre
    ficha = (ficha.replace('<span class="as-adj">', '<span class="as-adj t4-sube">', 1)
             .replace('<span class="p">240 KB</span>', '<span class="as-spin"></span><span class="p">Subiendo…</span>', 1))
    t = despues(t, "{{asSubiendo}}", '<sc-if value="{{asAdjuntos}}"', "sc-if", si("asSubiendo", f'<div class="as-adjs">{ficha}</div>'))
    t = despues(t, "{{asErrSubida}}", '<sc-if value="{{asAdjMal}}"', "sc-if",
                si("asErrSubida", '<span class="as-err" role="alert">{{asErrSubida}}</span>'))

    # La conversación no disponible: la tarjeta del asistente sin configurar, con su texto.
    _, _, sin_conf = bloque(t, '<sc-if value="{{asSinConf}}"', "sc-if")
    avatar = re.search(r'<span class="as-av gr gris">.*?</span>', sin_conf, re.S).group(0)
    tarjeta = f'<div class="tarjeta as-nc" role="alert">{avatar}<strong>{T_ND}</strong></div>'
    if tel:
        if "{{asNoDisp}}" not in t:
            t = cambiar(t, '<div class="as-tcuerpo">', '<div class="as-tcuerpo">' + si("asNoDisp", f'<div class="as-tbien">{tarjeta}</div>'))
    else:
        if "{{asNoDisp}}" not in t:
            t = cambiar(t, '<div class="as-hilo">', '<div class="as-hilo">' + si("asNoDisp", f'<div class="as-col as-nd">{tarjeta}</div>'))
        # Sin la caja para escribir: esa conversación no se sigue.
        if "{{asConPieT4}}" not in t:
            i, j, pie = bloque(t, '<div class="as-pie">', "div")
            t = t[:i] + si("asConPieT4", pie, "si") + t[j:]

    # Su fila en la lista, abierta, con su ⋮ y solo «Borrar».
    _, _, fila = bloque(t, '<div class="as-it {{asActiva}}">', "div")
    nueva = fila.replace("{{asActiva}}", "on").replace(t0, ND).replace("{{asAbrir}}", "{{asNdAbrir}}", 1)
    if tel:
        nueva = nueva.replace("{{asIrAcciones}}", "{{asNdAcc}}", 1)
        t = despues(t, "{{asNdFila}}", '<div class="as-it {{asActiva}}">', "div", si("asNdFila", nueva))
    else:
        nueva = (nueva.replace("{{asExpMenu}}", "{{asNdExp}}", 1).replace("{{asAlternarMenu}}", "{{asNdAlternar}}", 1)
                 .replace("{{asMenu}}", "{{asNdMenu}}", 1))
        a = nueva.index('<div class="menu der as-menu"')
        a = nueva.index(">", a) + 1
        b = nueva.index('<button type="button" class="menu-it pel"', a)
        nueva = (nueva[:a] + nueva[b:]).replace("{{asBorrarIr}}", "{{asNdBorrarIr}}", 1)
        assert nueva.count('class="menu-it') == 1 and ND in nueva and t0 not in nueva, nombre
        t = despues(t, "{{asNdExp}}", '<div class="as-it {{asActiva}}">', "div", si("asNoDisp", nueva))

    # Sus acciones (teléfono) y su confirmación de borrar.
    if tel and "{{asNdAcciones}}" not in t:
        _, _, acc = bloque(t, '<sc-if value="{{asAcciones}}"', "sc-if")
        acc = acc.replace("{{asAcciones}}", "{{asNdAcciones}}", 1).replace(t0, ND)
        a = acc.index('<div class="as-hacc">') + len('<div class="as-hacc">')
        b = acc.index('<button type="button" class="as-ha pel"', a)
        acc = (acc[:a] + acc[b:]).replace("{{asBorrarIr}}", "{{asNdBorrarIr}}", 1)
        assert acc.count('<button type="button" class="as-ha') == 1, nombre
        t = despues(t, "{{asNdAcciones}}", '<sc-if value="{{asAcciones}}"', "sc-if", acc)
    if "{{asNdBorrar}}" not in t:
        _, _, borrar = bloque(t, '<sc-if value="{{asBorrar}}"', "sc-if")
        assert T_BORRAR in borrar and t0 in borrar, nombre
        borrar = borrar.replace("{{asBorrar}}", "{{asNdBorrar}}", 1).replace(t0, ND)
        borrar = borrar.replace("{{asCerrarHoja}}", "{{asNdVolver}}") if tel else \
            borrar.replace("{{asCancelar}}", "{{asNdVolver}}").replace('"as-bt"', '"as-bt-nd"')
        t = despues(t, "{{asNdBorrar}}", '<sc-if value="{{asBorrar}}"', "sc-if", borrar)

    # La lógica.
    if "tanda4(a)" not in t:
        n = "\r\n" if "\r\n" in t else "\n"
        viejo = f"  renderVals() {{{n}    return {{ ...this.renderValsBase(), ...this.asistente() }};{n}  }}"
        nuevo = (js(JS_CHAT, t) + f"  renderVals() {{{n}    const a = {{ ...this.renderValsBase(), ...this.asistente() }};{n}"
                 f"    return {{ ...a, ...this.tanda4(a) }};{n}  }}")
        t = cambiar(t, viejo, nuevo)
    # Los estilos, en el orden en que se sumaron: una corrida desde cero da lo mismo que las dos tandas de este generador.
    t = con_estilo(t, 'data-t4i="inicio"', CSS_CHAT)
    # La confirmación de borrar con el encabezado de los otros dos lados (Criterio · Diálogos).
    if not tel and ENCABEZADO_ARENA not in t:
        org = leer("Asistente-Org")
        reglas = [linea.strip() for marca in ('data-criterio="aplicado"', 'data-vuelta="1004-piezas-comunes"')
                  for linea in re.search(rf"<style {marca}>(.*?)</style>", org, re.S).group(1).splitlines()
                  if linea.strip().startswith(".dlg")]
        assert len(reglas) == 8 and any(ENCABEZADO_ARENA in r for r in reglas), reglas
        t = con_estilo(t, 'data-t4i="dialogos"', CSS_DIALOGOS + "\n".join(reglas) + "\n")
    return con_estilo(t, 'data-t4i="avisos"', CSS_FALLO)


# ---------------------------------------------------------------------------------------------------------------- la configuración
def js_config(estados, tel, plat):
    fallas = {nombre: FALLAS[clave] for nombre, clave in estados.items()}
    if not plat:
        fallas[ORG_PLATAFORMA[0]] = ORG_PLATAFORMA[1]
    modelo = "Claude Sonnet 5.5" if plat else "Claude Opus 5.5"
    lineas = [
        "",
        "  // Tanda 4 del traspaso 15 (ADR 0064, 6 y 7): cada falla de la conexión con el proveedor, en la banda o en la zona de la",
        "  // clave. Quién actúa depende de quién paga" + (": acá, el operador." if plat else ": con su clave, el Dueño; con la de la plataforma, ella."),
        "  // Recibe lo que ya calcula el tablero y pisa solo lo de estos estados.",
        "  tanda4(a) {",
        f"    const e = this.state.e ?? (this.props.estado ?? {json.dumps('Configurada' if plat else 'Con la clave de la plataforma', ensure_ascii=False)});",
        f"    const f = {json.dumps(fallas, ensure_ascii=False)}[e];",
        "    const fuera = { t4Banda: '', t4BandaClase: 'mal', t4Cambiar: true, t4Reemplazar: false, t4ErrClave: '', t4ErrModelo: '', t4MalModelo: '',",
        f"      t4PhModelo: '', t4TextoModelo: '{modelo}', t4ProvConocido: true, t4ProvElegir: false, t4ClaveVacia: false }};",
        "    if (!f) return fuera;",
        "    const v = {",
        "      ...fuera,",
        "      t4Banda: f.banda || '', t4BandaClase: f.pausa ? 'pend' : 'mal',",
        "      t4Cambiar: !f.clave, t4Reemplazar: !!f.clave, t4ErrClave: f.clave || '', errClave: f.clave || '', malClave: '', clave: '',",
        "      t4ErrModelo: f.modelo || '', t4MalModelo: f.modelo ? 'mal' : '',",
        f"      t4PhModelo: f.pausa ? 't4-ph' : '', t4TextoModelo: f.pausa ? 'Elegí un modelo' : '{modelo}',",
        "      t4ProvConocido: !f.pausa, t4ProvElegir: !!f.pausa,",
        "      descartar: () => this.setState({ abierto: false }),",
        "    };",
    ]
    if plat:
        lineas += ["    return { ...v, claveGuardada: !f.pausa, claveNueva: !!f.pausa, conClave: !f.pausa, sinClave: " +
                   ("!!f.pausa" if tel else "false") + " };"]
    else:
        lineas += [
            "    const propia = !f.plataforma;",
            "    return {",
            "      ...v, propia, noPropia: !propia, segPlat: propia ? '' : 'on', segPropia: propia ? 'on' : '',",
            "      puedeElegir: true, noPuedeElegir: false, sinDueno: false,",
            "      claveGuardada: propia && !f.pausa, claveNueva: !!f.pausa, t4ClaveVacia: !!f.pausa,",
        ]
        if not tel:
            lineas += [
                "      textoModelo: f.pausa ? 'Elegí un modelo' : propia ? 'Claude Opus 5.5' : a.textoModelo,",
                "      m_opus: propia ? 'on' : '', m_sonnet: propia ? '' : a.m_sonnet,",
                "      abiertoModeloPlat: a.expModelo === 'true' && !propia, abiertoModeloTodos: a.expModelo === 'true' && propia,",
            ]
        lineas += ["    };"]
    lineas += ["  }", "", ""]
    return "\n".join(lineas)


CSS_CONFIG = """/* Tanda 4 (0064): lo que falta elegir, en gris; «Reemplazar clave» resaltado adentro del campo de la clave. */
.t4-ph { color: var(--t3); }
.as-clave .cb.ch { flex-shrink: 0; }
"""
CSS_CONFIG_TEL = CSS_CONFIG + """/* El estado de la conexión, arriba del cuerpo: el teléfono no tiene banda. */
.t4-est { display: flex !important; align-items: flex-start; gap: 8px; font-size: 14px !important; line-height: 1.45; color: var(--t1); }
.t4-est::before { margin-top: 6px; flex-shrink: 0; }
/* El modelo que el proveedor no aceptó, con el borde rojo, como un campo con error de la compu. */
.ap-cmp .ct.mal { border-color: oklch(0.6 0.19 25) !important; }
"""

BANDA = si("t4Banda", '<span class="w-est {{t4BandaClase}}" role="status">{{t4Banda}}</span>')
ERR_MODELO = si("t4ErrModelo", '<span class="as-err" role="alert">{{t4ErrModelo}}</span>')
CUERPO_TEL = '<div class="ap-cuerpo" style="padding: 4px 20px 16px; gap: 14px; overflow: auto;">'


def proveedor(t, chev):
    """El proveedor guardado que esta versión no conoce deja el campo para elegir (el primero: el de «Clave y modelo»)."""
    if "{{t4ProvElegir}}" in t:
        return t
    i = t.index('<div class="ct ro">Anthropic</div>')
    assert 0 <= i - t.rfind("Proveedor</span>", 0, i) < 40 and "Clave de" in t[i:i + 400], "proveedor"
    nuevo = (si("t4ProvConocido", '<div class="ct ro">Anthropic</div>', "si")
             + si("t4ProvElegir", f'<div class="ct sel"><span class="t4-ph">Elegí un proveedor</span>{chev}</div>'))
    return t[:i] + nuevo + t[i + len('<div class="ct ro">Anthropic</div>'):]


def reemplazar(boton):
    """«Cambiar» y, en las fallas de la clave, «Reemplazar clave» resaltado en su lugar."""
    accion = ' onClick="{{cambiarClave}}"' if "cambiarClave" in boton else ""
    return si("t4Cambiar", boton, "si") + si("t4Reemplazar", f'<button type="button" class="cb cb-pri ch"{accion}>Reemplazar clave</button>')


def modelo_tel(t, antes, valor):
    """El modelo del teléfono, con su texto en una variable, el borde rojo y el error debajo."""
    viejo_ini = f'{antes}<div class="ct sel">{valor}<svg'
    if "{{t4ErrModelo}}" in t:
        return t
    assert t.count(viejo_ini) == 1, (antes, valor)
    i = t.index(viejo_ini) + len(antes)
    j = cierre(t, i, "div")
    chev = svg_de(t[i:j], "<div")
    return t[:i] + f'<div class="ct sel {{{{t4MalModelo}}}}"><span class="{{{{t4PhModelo}}}}">{{{{t4TextoModelo}}}}</span>{chev}</div>' + ERR_MODELO + t[j:]


def pasar_config(t, nombre):
    tel = nombre.startswith("M-")
    plat = "Plat-" in nombre
    estados = ESTADOS_PLAT if plat else ESTADOS_ORG
    nuevos = list(estados) + ([] if plat else [ORG_PLATAFORMA[0]])
    despues_de = ("Sin clave" if tel else "Clave rechazada") if plat else "La plataforma no habilitó su clave"
    t = sumar_opciones(t, "estado", despues_de, nuevos)

    if tel:
        # El estado, arriba del cuerpo; la clave con «Reemplazar clave» y su error debajo.
        if "{{t4Banda}}" not in t:
            t = cambiar(t, CUERPO_TEL, CUERPO_TEL + si("t4Banda", '<span class="w-est {{t4BandaClase}} t4-est" role="status">{{t4Banda}}</span>'))
        mascara = "•••• 9xQe" if plat else "•••• 4F2a"
        boton = '<button type="button" class="as-lnk">Cambiar</button>'
        t = cambiar(t, f"<span>{mascara}</span>{boton}</div>",
                    f"<span>{mascara}</span>{reemplazar(boton)}</div>" + si("t4ErrClave", '<span class="as-err" role="alert">{{t4ErrClave}}</span>'))
        if plat:
            t = modelo_tel(t, "<span>Modelo por defecto</span></span>", "Claude Sonnet 5.5")
        else:
            t = modelo_tel(t, '<sc-if value="{{propia}}" hint-placeholder-val="{{no}}"><div class="ap-cmp"><span class="rt"><span>Modelo</span></span>',
                           "Claude Opus 5.5")
            # La clave vacía de la conexión en pausa, como la de «ningún Dueño con correo verificado».
            if "{{t4ClaveVacia}}" not in t:
                _, _, vacia = bloque(t, '<sc-if value="{{sinDueno}}" hint-placeholder-val="{{no}}"><div class="ap-cmp">', "sc-if")
                t = despues(t, "{{t4ClaveVacia}}", '<sc-if value="{{sinDueno}}" hint-placeholder-val="{{no}}"><div class="ap-cmp">', "sc-if",
                            vacia.replace("{{sinDueno}}", "{{t4ClaveVacia}}", 1))
        t = proveedor(t, svg_de(t, '{{t4TextoModelo}}</span>'))
    else:
        # El estado, en la banda.
        if plat:
            t = cambiar(t, '<span class="as-sucio">Sin configurar</span></sc-if></p>', '<span class="as-sucio">Sin configurar</span></sc-if>' + BANDA + "</p>")
        else:
            t = cambiar(t, '<p class="res"></p>', f'<p class="res">{BANDA}</p>')
        boton = '<button type="button" class="as-lnk" onClick="{{cambiarClave}}">Cambiar</button>'
        t = cambiar(t, f"</span>{boton}</div>", f"</span>{reemplazar(boton)}</div>")
        if plat:
            antes = '<span class="rt">Modelo por defecto</span>'
            t = modelo_tel(t, antes, "Claude Sonnet 5.5")
        elif "{{t4ErrModelo}}" not in t:
            t = cambiar(t, 'class="ct sel as-btn"', 'class="ct sel as-btn {{t4MalModelo}}"')
            t = cambiar(t, "<span>{{textoModelo}}</span>", '<span class="{{t4PhModelo}}">{{textoModelo}}</span>')
            i, j, _ = bloque(t, '<button type="button" class="ct sel as-btn {{t4MalModelo}}"', "button")
            t = t[:j] + ERR_MODELO + t[j:]
        t = proveedor(t, svg_de(t, "{{t4MalModelo}}"))

    # La lógica.
    if "tanda4(a)" not in t:
        n = "\r\n" if "\r\n" in t else "\n"
        viejo = f"class Component extends DCLogic {{{n}  renderVals() {{"
        nuevo = (f"class Component extends DCLogic {{{n}  renderVals() {{{n}    const a = this.renderValsPrevio();{n}"
                 f"    return {{ ...a, ...this.tanda4(a) }};{n}  }}{n}" + js(js_config(estados, tel, plat), t) + "  renderValsPrevio() {")
        t = cambiar(t, viejo, nuevo)
    return con_estilo(t, 'data-t4i="config"', CSS_CONFIG_TEL if tel else CSS_CONFIG)


# ---------------------------------------------------------------------------------------------------------------- la corrida
if __name__ == "__main__":
    tableros = {**{n: pasar_chat for n in CHAT}, **{n: pasar_config for n in CONFIG}}
    cambiados = []
    for nombre, pasar in tableros.items():
        t = leer(nombre)
        nuevo = pasar(t, nombre)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    print("ok", len(tableros), "tableros,", len(cambiados), "cambiados", cambiados)
    print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(tableros))
