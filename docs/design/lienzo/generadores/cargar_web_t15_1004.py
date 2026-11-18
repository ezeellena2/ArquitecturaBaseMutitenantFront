"""La E20 · Cargar desde la web con las decisiones del traspaso 15 que el usuario tomó el 2026-11-18 (la 229, la 230, la 233, la 234 y
la 235 de la §5 de la hoja de ruta del back), con lo que ArquitecturaBase eligió en SA1-A a SA5 (`formularios-solo-en-la-app.md`),
UB1-A a UB4-A y W1-A (`ubicacion-en-formularios.md`) y CA1-A (`motor-para-documentos.md`):

- **«Dónde se completa»** (229 y 235): un segmentado en «El formulario», al lado del prefijo, con «En la app y por WhatsApp» y «Solo
  en la app»; solo con un número conectado. En uno solo para clientes, «Solo en la app» queda apagada con «Los clientes responden
  solo por WhatsApp.». Debajo de una condición que WhatsApp no puede mostrar, el editor avisa («WhatsApp no muestra una condición con
  números.») con «Pasar a «Solo en la app»». Nuevo `FRM-Editor-20` (y `M-FRM-Editor-20`), a partir de `FRM-Editor-Condiciones` (y su
  teléfono), el editor de la E19.
- **«Formularios»** (`FRM-Formularios-20` y su teléfono): la columna «En WhatsApp» pasa a «Estado» y se suma «Dónde se completa», con
  «App» o «App y WhatsApp» (en un borrador, dónde se va a publicar); «Solo en la app · versión 4» y su (i) pasan a «Publicado · versión
  4». La baja de uno de la app dice solo «App · No se carga más», sin el aviso de WhatsApp.
- **Publicar** (`FRM-Publicar-20` y su teléfono): con «En la app y por WhatsApp», lo que WhatsApp no puede mostrar frena en «Problemas»
  con «Ir a la pregunta» y «Pasar a «Solo en la app»» (en uno solo para clientes, solo «Ir a la pregunta»), y «Publicar» queda apagado;
  ya no se publica solo para la app. «Qué se publica» cambia «En WhatsApp» por «Dónde se completa». Con «Solo en la app», publicar es al
  instante: «Publicamos la versión 4.» y «Publicado · versión 4». Sin número conectado no hay ajuste ni esa fila, como hasta ahora.
- **Enviar un formulario desde el chat** (`WA-Chats-Formulario-20` y su teléfono): uno de la app aparece apagado con «Se completa solo en
  la app.» (184), en lugar del motivo de cada pregunta; y «Visita a cliente», que pide la ubicación, muestra en el chat el pedido antes
  del Flow («Para completar «Visita a cliente», mandanos tu ubicación.», con «Seguir sin ubicación» si es opcional), la ubicación que
  llega y la tarjeta del formulario que sale después (230 y W1-A).
- **La pregunta «Ubicación»** (230): el tipo, último en «Tipo de respuesta», solo con «Obligatoria» (nuevos `FRM-Editor-Ubicacion` y
  `M-FRM-Editor-Ubicacion`, a partir de `FRM-Editor-18` y su teléfono, que ya dibujan un tipo con pocos ajustes); «Usar mi ubicación» en
  la carga (`FRM-Cargar-Respuesta`, su teléfono y `FRM-Cargar-Panel`) con sus estados: pidiendo, sin permiso, sin señal, el punto con la
  precisión, más de 100 m en ámbar con su (i), la ✕, «Ver en el mapa» y «Volver a pedirla»; el punto como enlace al mapa en la planilla
  y con la precisión en gris en el detalle (`FRM-Respuestas-20`, `FRM-Respuesta-20` y sus teléfonos). La pregunta es «Lugar de entrega»,
  opcional, en la zona «Entrega» de «Pedido de materiales», versión 4: las respuestas de antes dicen «—».
- **El cálculo en gris** (234 y 233): en la carga, «Importe» (Cantidad × Precio) es una columna del bloque, alineada a la derecha, y una
  línea de cada recuadro; «Total» (la suma de los importes), un campo de una columna. Se ven en gris, sin poder escribirse, y cambian al
  escribir; su (i) dice cómo se calculan.

`WA-Chats-Respuesta` es de la E14 y no se toca (78): la ubicación que llega va en `WA-Chats-Formulario-20`.

Lista de chequeo (213), por tablero tocado; lo que no pasaba se corrigió acá:
- 1 y 10: cada estado nuevo es la pantalla entera (se clona uno que ya existe y se cambia solo lo suyo); la carga suma los ocho estados de
  la ubicación, y publicar, el problema de cada caso, el «Solo en la app» y lo publicado.
- 4: la baja de uno de la app y lo que se publica van en la grilla de lectura (`.t15-dg` en la compu, `.ap-det` en el teléfono).
- 5: «Estado» y «Dónde se completa» van en dos columnas; «Importe» es su columna en la tabla del bloque.
- 6: la precisión baja y cómo se calcula cada cálculo van en la (i), sin leyendas.
- 7: «Solo en la app» se dice una vez, en su columna, y no en el estado; los motivos de WhatsApp, solo en «Problemas».
- 8: lo apagado («Solo en la app» en uno para clientes, «Publicar» con problemas, el formulario de la app en el chat) da su motivo sobre el
  control.
- 9 y 11: «Buscando tu ubicación…» con el aro en el mismo botón; el recuadro del punto es el de un archivo y el cálculo usa el campo de
  solo lectura de la carga.
- 12: en el teléfono, «Usar mi ubicación», «Ver en el mapa» y «Volver a pedirla» van a lo ancho, con 44 de alto.

Corre después de los de la v175 (`traspaso15_textos_1004.py`, `roles_matriz_1004.py`, `formularios_t15_1004.py`,
`dialogos_t15_1004.py`, `reglas_t15_1004.py`, `avisos_iconos_1004.py`) y antes de la pasada de las piezas; al terminar imprime los
tableros para esa pasada. Un tablero nuevo se crea una sola vez, copiando su base; después solo se le aplican los cambios. No toca
`canvas.json` (los tableros nuevos los suma la sesión principal). Lee y escribe sin cambiar los finales de línea, y se puede volver a
correr sin cambiar nada: lo que ya está hecho no vuelve a encontrar lo que busca, y un estado sumado no se suma otra vez.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from formularios_t15_1004 import PROJ, cambiar, cierre, escribir, leer, sumar_estado  # noqa: E402


def existe(nombre):
    return (PROJ / f"{nombre}.dc.html").exists()


def nl(t):
    return "\r\n" if "\r\n" in t else "\n"


def estilo(t, marca, css):
    """Un bloque `<style data-t15e="marca">` antes de `</helmet>`, una sola vez."""
    if f'data-t15e="{marca}"' in t:
        return t
    n = nl(t)
    bloque = f'<style data-t15e="{marca}">{n}' + css.strip().replace("\n", n) + f"{n}</style>{n}"
    return t.replace("</helmet>", bloque + "</helmet>", 1)


def bloques(t, estado, val=None):
    """Los `(inicio, fin)` de cada `<sc-if value="{{estado}}" …>`."""
    v = r'(?:si|no)' if val is None else val
    pat = re.compile(r'<sc-if value="\{\{' + re.escape(estado) + r'\}\}" hint-placeholder-val="\{\{' + v + r'\}\}">')
    return [(m.start(), cierre(t, m.start(), "sc-if")) for m in pat.finditer(t)]


def por_estado(t, estado, f):
    """Aplica `f(numero, bloque)` a cada bloque del estado `estado` (de atrás para adelante, así los índices no se mueven)."""
    bs = bloques(t, estado)
    assert bs, estado
    for numero in range(len(bs) - 1, -1, -1):
        a, b = bs[numero]
        t = t[:a] + f(numero, t[a:b]) + t[b:]
    return t


def opciones(t):
    m = re.search(r'"estado":\{"editor":"enum","options":\[([^\]]*)\]', t)
    return json.loads("[" + m.group(1) + "]")


def indice(t, nombre):
    mk = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    return json.loads(mk.group(1)).index(nombre)


def sumar(t, base, nombre, despues_de, cambio):
    """`sumar_estado` con la base por su nombre."""
    if nombre in opciones(t):
        return t
    return sumar_estado(t, indice(t, base), nombre, despues_de, cambio)


def svg(trazos, tam=16, clase=""):
    c = f' class="{clase}"' if clase else ""
    return (f'<svg{c} width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{trazos}</svg>')


I_INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5h.01"/>', 14)
I_PIN = svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>')
I_EXT = svg('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', 14)
I_TRI = svg('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>', 14)
I_X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 14)


def info(texto):
    return f'<span class="f-i" tabindex="0" role="img" aria-label="{texto}" title="{texto}">{I_INFO}</span>'


# ======================================================================================================== 1 · «Formularios»
APP, AMBOS = "App", "App y WhatsApp"
SOLO_APP_FILA = ('<span class="w-est ">Solo en la app · versión 4</span><span class="f-i" tabindex="0" role="img" '
                 'aria-label="Usa una lista dependiente." title="Usa una lista dependiente.">')


def sin_solo_app(t):
    """«Solo en la app · versión 4» con su (i) pasa a «Publicado · versión 4»: dónde se completa va en su columna (175 y 206)."""
    while SOLO_APP_FILA in t:
        i = t.index(SOLO_APP_FILA)
        j = cierre(t, i + len('<span class="w-est ">Solo en la app · versión 4</span>'), "span")
        t = t[:i] + '<span class="w-est ">Publicado · versión 4</span>' + t[j:]
    return t


def con_donde(t, clase_fila):
    """Después de la celda del estado (`est2`) de cada fila `clase_fila`, la celda «Dónde se completa»."""
    partes, i = [], 0
    for m in re.finditer(r'<div class="w-tr ' + clase_fila + r'"><span class="fx-n"><a href="[^"]*">([^<]+)</a></span>', t):
        if m.start() < i:
            continue
        e = t.index('<span class="est2">', m.end())
        f = cierre(t, e, "span")
        if t.startswith('<span class="fx-donde">', f):
            continue
        valor = APP if m.group(1) == "Pedido de materiales" else AMBOS
        partes += [t[i:f], f'<span class="fx-donde">{valor}</span>']
        i = f
    partes.append(t[i:])
    return "".join(partes)


DLG_BAJA_APP = (
    '<sc-if value="{{bajaApp}}" hint-placeholder-val="{{no}}"><div class="w-oscuro"><div class="w-dlg pub" role="dialog" aria-modal="true" '
    'aria-label="Dar de baja «Pedido de materiales»"><div class="dc"><span>Dar de baja «Pedido de materiales»</span><button type="button" '
    'class="ib" aria-label="Cerrar">' + svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>') + '</button></div><div class="db una">'
    '<div class="w-cmp" role="group" aria-label="Deja de pasar"><span class="rt">Deja de pasar</span><div class="t15-dg"><span>App</span>'
    '<span>No se carga más</span></div></div><div class="w-cmp" role="group" aria-label="Se conserva"><span class="rt">Se conserva</span>'
    '<div class="t15-dg"><span>Respuestas</span><span>46</span></div></div></div><div class="df"><button type="button" class="cb cb-sec">'
    'Cancelar</button><button type="button" class="cb cb-pri">Dar de baja</button></div></div></div></sc-if>')

I_EDITAR = svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>', clase="mi-ic")
I_COPIAR = svg('<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', clase="mi-ic")
I_BAJA = svg('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>', clase="mi-ic")
I_BORRAR = svg('<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/>', clase="mi-ic")
MENU_PED = (
    '<sc-if value="{{mPed}}" hint-placeholder-val="{{no}}"><div class="f-menu" role="menu" aria-label="Acciones de Pedido de materiales">'
    f'<a class="f-mi" role="menuitem" href="FRM-Editor-20.dc.html">{I_EDITAR} Editar</a><a class="f-mi" role="menuitem" '
    f'href="FRM-Copiar.dc.html">{I_COPIAR} Copiar</a><span class="f-mi" role="menuitem">{I_BAJA} Dar de baja</span>'
    '<span class="f-sep" role="separator"></span><span class="f-mi off" role="menuitem" aria-disabled="true" title="Tiene respuestas y no '
    f'se puede borrar.">{I_BORRAR} Borrar<span class="e-tip" role="tooltip">Tiene respuestas y no se puede borrar.</span></span></div></sc-if>')
CSS_FORMULARIOS = """
/* 229 · «Estado» y «Dónde se completa» en dos columnas; la baja de uno de la app, en la grilla de lectura (213). */
.w-th.fx20, .w-tr.fx20 { grid-template-columns: minmax(150px, 1fr) minmax(170px, 1fr) 104px 80px 104px 124px 72px 40px !important; }
.w-th.fx14, .w-tr.fx14 { grid-template-columns: minmax(200px, 1.4fr) 100px minmax(180px, 1.1fr) 120px minmax(200px, 1.1fr) !important; }
.w-dlg.pub .db { display: flex; flex-direction: column; gap: 10.1px/*14px*/; padding: 11.5px/*16px*/ 14.4px/*20px*/; }
.w-dlg.pub { width: 640px; }
.db.una { grid-template-columns: minmax(0, 1fr); }
.t15-dg { display: grid; grid-template-columns: 150px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 3px/*10px*/; overflow: hidden; font-size: 10.7px/*13px*/; background: #fff; }
.t15-dg > span { padding: 6.5px/*9px*/ 8.6px/*12px*/; border-top: 1px solid var(--borde); line-height: 1.4; }
.t15-dg > span:nth-child(-n+2) { border-top: 0; }
.t15-dg > span:nth-child(odd) { background: oklch(0.975 0.012 95); color: var(--t2); }
"""


def formularios(t):
    t = sin_solo_app(t)
    t = cambiar(t, '<span aria-sort="ascending">Formulario<span class="ord" aria-hidden="true">▲</span></span><span>En WhatsApp</span><span>Respuestas</span>',
                '<span aria-sort="ascending">Formulario<span class="ord" aria-hidden="true">▲</span></span><span>Estado</span><span>Dónde se completa</span>'
                '<span>Respuestas</span>', 1)
    t = cambiar(t, '<span>Preguntas</span><span>En WhatsApp</span><span>Último cambio</span>',
                '<span>Preguntas</span><span>Estado</span><span>Dónde se completa</span><span>Último cambio</span>', 1)
    t = con_donde(t, "fx20")
    t = con_donde(t, "fx14")
    t = estilo(t, "formularios", CSS_FORMULARIOS)
    # El ⋮ de «Pedido de materiales», abierto, y la baja de uno de la app.
    fila = '<a class="cb cb-sec cb-ch" href="FRM-Cargar-Respuesta.dc.html" aria-label="Cargar Pedido de materiales">Cargar</a><span><button type="button" class="ib" aria-label="Acciones de Pedido de materiales" aria-haspopup="menu">'
    i = t.index(fila)
    j = cierre(t, t.index("<span>", i + len('<a class="cb cb-sec cb-ch" href="FRM-Cargar-Respuesta.dc.html" aria-label="Cargar Pedido de materiales">Cargar</a>')), "span")
    if not t.startswith('<sc-if value="{{mPed}}"', j):
        t = t[:j] + MENU_PED + t[j:]
    if "{{bajaApp}}" not in t:
        k = t.rindex("</div>", 0, t.index("</x-dc>"))
        t = t[:k] + DLG_BAJA_APP + t[k:]
    viejo = '"Acciones de un publicado","Acciones de un borrador"'
    t = cambiar(t, viejo, '"Acciones de un publicado","Acciones de uno de la app","Dar de baja uno de la app","Acciones de un borrador"', 1)
    if "mPed:" not in t:
        t = cambiar(t, "      sinPermiso: v === 'Sin permiso',", "      mPed: v === 'Acciones de uno de la app', bajaApp: v === 'Dar de "
                    "baja uno de la app'," + nl(t) + "      sinPermiso: v === 'Sin permiso',", 1)
    return t


HOJA_BAJA_VIS = '<div class="ap-hoja" role="dialog" aria-label="Dar de baja «Visita a cliente»">'
HOJA_BAJA_APP = (
    '<div class="ap-hoja" role="dialog" aria-label="Dar de baja «Pedido de materiales»"><span class="asa"></span><div class="hc"><div>'
    '<h2>Dar de baja «Pedido de materiales»</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">'
    + svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 20) + '</button></div><div class="hb"><div class="p-tit2">Deja de pasar</div>'
    '<div class="ap-dets"><div class="ap-det"><span>App</span><b>No se carga más</b></div></div><div class="p-tit2">Se conserva</div>'
    '<div class="ap-dets"><div class="ap-det"><span>Respuestas</span><b>46</b></div></div></div><div class="hp"><button type="button" '
    'class="cb cb-pri">Dar de baja</button><button type="button" class="cb cb-sec">Cancelar</button></div></div>')


def formularios_tel(t):
    t = t.replace('<span class="l2">Solo en la app · versión 4</span>', '<span class="l2">Publicado · versión 4</span>')

    def fila(m):
        valor = APP if m.group(1) == "Pedido de materiales" else AMBOS
        return f'{m.group(0)[:-len(m.group(2))]}{valor} · {m.group(2)}'
    t = re.sub(r'<span class="l1">([^<]+)</span><span class="l2">[^<]*</span><span class="l3">(\d+ respuestas)', fila, t)

    def baja(numero, c):
        if HOJA_BAJA_VIS not in c:
            return c
        i = c.index(HOJA_BAJA_VIS)
        return c[:i] + HOJA_BAJA_APP + c[cierre(c, i, "div"):]
    return sumar(t, "Dar de baja", "Dar de baja uno de la app", "Dar de baja", baja)


# ======================================================================================================== 2 · la lista de la versión 4
def fila_q(t, i, clase):
    """La fila de pregunta (`q-it` o `q-row`) que empieza en `i`: (fin, número, nombre)."""
    fin = cierre(t, i, "div")
    m = re.match(r'<div class="' + clase + r'"><span class="num">([\d.]+)</span><span class="(?:dato|tx)"><b>([^<]+)</b>', t[i:fin])
    return fin, m.group(1), m.group(2)


def clonar_fila(fila, viejo, nuevo, desc_vieja, desc_nueva, num_viejo, num_nuevo):
    fila = fila.replace(f'<span class="num">{num_viejo}</span>', f'<span class="num">{num_nuevo}</span>', 1)
    fila = fila.replace(f"<b>{viejo}</b><span>{desc_vieja}</span>", f"<b>{nuevo}</b><span>{desc_nueva}</span>", 1)
    for accion in ("Subir", "Bajar", "Editar", "Quitar"):
        fila = fila.replace(f'aria-label="{accion} {viejo}"', f'aria-label="{accion} {nuevo}"')
    return fila


def lista_v4(t, clase):
    """La lista de «Pedido de materiales», versión 4: «Lugar de entrega» (Ubicación, 230) después de «Fecha de entrega», con las que
    siguen renumeradas, e «Importe» (Cálculo, 233) en el bloque, después de «Cantidad»."""
    dato = "dato" if clase == "q-it" else "tx"
    inicio = f'<div class="{clase}"><span class="num">6</span><span class="{dato}"><b>Fecha de entrega</b>'
    partes, i = [], 0
    while True:
        a = t.find(inicio, i)
        if a < 0:
            break
        fin, _, _ = fila_q(t, a, clase)
        if "<b>Lugar de entrega</b>" in t[fin:fin + 200]:
            partes.append(t[i:fin])
            i = fin
            continue
        lugar = clonar_fila(t[a:fin], "Fecha de entrega", "Lugar de entrega", "Fecha · Obligatoria", "Ubicación · Opcional", "6", "7")
        # Las que siguen, hasta el fin de la lista (la caja o el grupo que la contiene), con un número más.
        caja = t.rfind('<div class="w-caja">' if clase == "q-it" else '<div class="ap-grupo">', 0, a)
        fin_caja = cierre(t, caja, "div")
        resto = t[fin:fin_caja]

        def mas_uno(m):
            n = int(m.group(1))
            return f'<span class="num">{n + 1 if n >= 7 else n}{m.group(2) or ""}</span>'
        resto = re.sub(r'<span class="num">(\d+)(\.\d+)?</span>', mas_uno, resto)
        # «Importe» en el bloque, después de «Cantidad» (que ya no es la última: se puede bajar).
        cant = resto.index("<b>Cantidad</b>")
        ca = resto.rfind(f'<div class="{clase}">', 0, cant)
        cf, cnum, _ = fila_q(resto, ca, clase)
        cantidad = resto[ca:cf]
        importe = clonar_fila(cantidad, "Cantidad", "Importe", "Número · Obligatoria", "Cálculo · Pesos", cnum, cnum[:-1] + "3")
        cantidad = cantidad.replace('aria-label="Bajar Cantidad" aria-disabled="true"', 'aria-label="Bajar Cantidad" aria-disabled="false"', 1)
        resto = resto[:ca] + cantidad + importe + resto[cf:]
        resto = resto.replace("<b>Productos</b><span>Bloque · de 1 a 10 ítems · 2 preguntas</span>",
                              "<b>Productos</b><span>Bloque · de 1 a 10 ítems · 3 preguntas</span>", 1)
        partes += [t[i:fin], lugar, resto]
        i = fin_caja
    partes.append(t[i:])
    return "".join(partes)


# ======================================================================================================== 3 · «Dónde se completa»
INFO_DONDE = "Con «Solo en la app» no va por WhatsApp: se carga desde la app."
TIP_CLIENTES = "Los clientes responden solo por WhatsApp."


def donde(elegido, clientes=False, tel=False, tip=False):
    """El segmentado «Dónde se completa» (SA1-A): con «Solo en la app» apagada en uno solo para clientes, con su motivo encima."""
    on_wa, on_app = ("on", "") if elegido == "wa" else ("", "on")
    if clientes:
        app = f'<span class="off" role="radio" aria-checked="false" aria-disabled="true" title="{TIP_CLIENTES}">Solo en la app</span>'
        tip = f'<span class="e-tip" role="tooltip">{TIP_CLIENTES}</span>' if tip else ""
    else:
        app, tip = f'<span class="{on_app}" role="radio" aria-checked="{"true" if on_app else "false"}">Solo en la app</span>', ""
    seg = (f'<span class="e-tipw t15e-seg"><span class="ab-seg" role="radiogroup" aria-label="Dónde se completa"><span class="{on_wa}" '
           f'role="radio" aria-checked="{"true" if on_wa else "false"}">En la app y por WhatsApp</span>{app}</span>{tip}</span>')
    if tel:
        return (f'<div class="ap-cmp t15e-donde"><span class="rt"><span>Dónde se completa <span class="rq">*</span></span>{info(INFO_DONDE)}'
                f'</span>{seg}</div>')
    return f'<div class="w-cmp t15e-donde"><span class="rt">Dónde se completa <span class="req">*</span>{info(INFO_DONDE)}</span>{seg}</div>'


CSS_DONDE = """
/* 229 · «Dónde se completa», al lado del prefijo: lo apagado da su motivo encima (211). */
.t15e-seg { display: flex; }
.t15e-seg .ab-seg > span { padding: 5.8px/*8px*/ 10.1px/*14px*/; }
.t15e-seg .ab-seg > span.off { color: var(--t3); background: var(--s3); cursor: not-allowed; }
.t15e-seg .e-tip { left: auto; right: 0; }
"""
CSS_DONDE_TEL = """
/* 229 · «Dónde se completa»: en el teléfono, las opciones a lo ancho, con 44 de alto. */
.t15e-seg { display: flex; position: relative; }
.t15e-seg .ab-seg { display: flex; width: 100%; border: 1px solid var(--borde2); border-radius: 3px; overflow: hidden; background: #fff; }
.t15e-seg .ab-seg > span { flex: 1; min-height: 44px; display: flex; align-items: center; justify-content: center; text-align: center; padding: 4px 8px; font-size: 14px; color: var(--t2); border-left: 1px solid var(--borde2); line-height: 1.25; }
.t15e-seg .ab-seg > span:first-child { border-left: 0; }
.t15e-seg .ab-seg > span.on { background: var(--marca); color: #fff; font-weight: 600; }
.t15e-seg .ab-seg > span.off { color: var(--t3); background: var(--s3); }
.t15e-seg .e-tip { position: absolute; z-index: 30; top: calc(100% + 8px); right: 0; padding: 6px 10px; border-radius: 6px; background: oklch(0.27 0.012 78); color: #fff; font-size: 13px; font-weight: 500; white-space: nowrap; }
"""
PREFIJO = '<div class="w-cmp"><span class="rt">Prefijo de numeración <span class="req">*</span>'
PREFIJO_TEL = '<div class="ap-cmp"><span class="rt"><span>Prefijo de numeración <span class="rq">*</span></span></span>'


def con_donde_campo(bloque, elegido, clientes=False, tel=False, tip=False):
    """«Dónde se completa» después del prefijo, en el bloque de un estado; si ya estaba, lo cambia por el que se pide."""
    pre = PREFIJO_TEL if tel else PREFIJO
    if pre not in bloque:
        return bloque
    ya = bloque.find('t15e-donde">')
    if ya >= 0:
        a = bloque.rfind("<div ", 0, ya)
        bloque = bloque[:a] + bloque[cierre(bloque, a, "div"):]
    i = bloque.index(pre)
    j = cierre(bloque, i, "div")
    return bloque[:j] + donde(elegido, clientes, tel, tip) + bloque[j:]


CHEV = svg('<path d="m7 10 5 5 5-5"/>', 14)


def pv_app(campos):
    """La vista previa de la app (SA2-A): el panel de «Nueva respuesta», en una columna, con «Enviar» apagado."""
    cuerpo = "".join(campos)
    return ('<div class="pv"><div class="w-caja t15e-pva" role="region" aria-label="Vista previa en la app"><div class="f-cab"><span>Nueva '
            f'respuesta</span></div><div class="t15e-pvb">{cuerpo}</div><div class="t15e-pvp"><button type="button" class="cb cb-pri" disabled '
            'title="Es una vista previa: no se envía.">Enviar</button></div></div></div>')


def campo_pv(rotulo, control, req=False):
    r = ' <span class="req">*</span>' if req else ""
    return f'<div class="w-cmp"><span class="rt">{rotulo}{r}</span>{control}</div>'


PV_SINO = '<span class="ab-seg" role="radiogroup" aria-label="Sí o no"><span>Sí</span><span>No</span></span>'
PV_UBIC = f'<button type="button" class="cb cb-sec t15e-ubtn">{svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', 14)} Usar mi ubicación</button>'
CSS_PV = """
/* SA2-A · Con «Solo en la app», la vista previa es la de la app: el panel de «Nueva respuesta». */
.t15e-pva .t15e-pvb { display: flex; flex-direction: column; gap: 10.1px/*14px*/; padding: 11.5px/*16px*/ 14.4px/*20px*/; }
.t15e-pva .t15e-pvp { display: flex; justify-content: flex-end; padding: 8.6px/*12px*/ 14.4px/*20px*/; border-top: 1px solid var(--borde); }
.t15e-pva .ct.sel { display: flex; align-items: center; justify-content: space-between; color: var(--t3); }
.t15e-pva .ab-seg { align-self: flex-start; }
.t15e-ubtn { align-self: flex-start; display: inline-flex; align-items: center; gap: 5.8px/*8px*/; }
"""


def con_pv_app(c, campos):
    if "t15e-pva" in c or '<div class="pv">' not in c:
        return c
    i = c.index('<div class="pv">')
    return c[:i] + pv_app(campos) + c[cierre(c, i, "div"):]


PV_PEDIDO = [campo_pv("Cliente", '<div class="ct"></div>', True), campo_pv("¿Se concretó la venta?", PV_SINO, True),
             campo_pv("Zona", f'<div class="ct sel">Buscar en Zona {CHEV}</div>', True), campo_pv("Lugar de entrega", PV_UBIC)]


# ======================================================================================================== 4 · publicar
TOAST = ('<div class="f-toast" role="status"><span class="ok"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
         'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 '
         '12.2 2.4 2.4 4.6-4.8"/></svg></span><span>{}</span><button type="button" class="ib" aria-label="Cerrar"><svg width="16" height="16" '
         'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden='
         '"true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg></button></div>')


def ic_problema(t):
    """El ícono de una fila de «Problemas», como lo dibuja el tablero."""
    i = t.index('<div class="z-f"><span class="ic">') + len('<div class="z-f">')
    return t[i:cierre(t, i, "span")]


def problema(t, nombre, motivo, ir, pasar=True):
    salida = '<button type="button" class="cb cb-sec">Pasar a «Solo en la app»</button>' if pasar else ""
    return (f'<div class="z-f">{ic_problema(t)}<span class="tx"><b>{nombre}</b><span>{motivo}</span></span><span class="t15e-acc">'
            f'<a class="cb cb-sec" href="{ir}">Ir a la pregunta</a>{salida}</span></div>')


def caja_problemas(t, filas):
    return '<div class="z-caja"><div class="z-cab">Problemas' + info("Hay que resolverlos para publicar.") + "</div>" + "".join(filas) + "</div>"


DONDE_WA_FILA = '<div class="z-d"><span class="k">Dónde se completa</span><span>En la app y por WhatsApp</span></div>'
DONDE_APP_FILA = '<div class="z-d"><span class="k">Dónde se completa</span><span>Solo en la app</span></div>'
EN_WA_NO = '<div class="z-d"><span class="k">En WhatsApp</span><span>No</span></div>'
PUB_ON = '<button type="button" class="cb cb-pri">Publicar versión 4</button>'
PUB_OFF = '<button type="button" class="cb cb-pri" disabled title="Resolvé los problemas para publicar.">Publicar versión 4</button>'
BANDA_PUB = '<a class="cb cb-pri" href="FRM-Publicar-20.dc.html">Publicar</a>'
BANDA_PUB_WA = ('<a class="cb cb-pri" href="FRM-Publicar-20.dc.html">Publicar en WhatsApp</a><a class="cb cb-sec" '
                'href="FRM-Vista-Oficial.dc.html">Ver vista oficial</a>')
CAMBIADAS = '<span class="k">Cambiadas</span><span>Zona, Proveedor y Lugar de entrega</span></div>'
CASOS_WA = {  # estado: (pregunta, motivo, a dónde lleva «Ir a la pregunta»)
    "Con una lista dependiente": ("Proveedor", "Usa una lista dependiente, y WhatsApp no las muestra.", "FRM-Editor-Listas.dc.html"),
    "Con un catálogo grande": ("Repuesto", "Tiene 240 opciones, y WhatsApp admite hasta 200 al elegir una.", "FRM-Editor-Listas.dc.html"),
    "Con un mínimo de más de 10": ("Productos", "En WhatsApp se cargan hasta 10 ítems; el mínimo es 15.", "FRM-Editor-Lineas.dc.html"),
    "Con una condición con números": ("Observaciones", "WhatsApp no muestra una condición con números.", "FRM-Editor-20.dc.html"),
}
CSS_PUBLICAR = """
/* 229 · «Ir a la pregunta» y «Pasar a «Solo en la app»», juntos al final de su problema. */
.z-f .t15e-acc { display: inline-flex; gap: 5.8px/*8px*/; flex: none; margin-left: auto; }
"""


def publicar(t):
    t = lista_v4(t, "q-it")
    t = t.replace('<span class="k">Preguntas</span><span>11</span>', '<span class="k">Preguntas</span><span>13</span>')
    t = t.replace('<span class="k">Cambiadas</span><span>Zona y Proveedor</span></div>', CAMBIADAS)
    t = estilo(t, "donde", CSS_DONDE)
    t = estilo(t, "publicar", CSS_PUBLICAR)
    t = estilo(t, "vista-app", CSS_PV)

    def caso_wa(pregunta, motivo, ir):
        def f(numero, c):
            c = con_donde_campo(c, "wa").replace(BANDA_PUB, BANDA_PUB_WA, 1)
            if '<div class="w-oscuro">' in c and "Problemas" not in c:
                a = c.index('<div class="z-caja"><div class="z-cab">Avisos')
                c = c[:a] + caja_problemas(t, [problema(t, pregunta, motivo, ir)]) + c[cierre(c, a, "div"):]
                c = c.replace(EN_WA_NO, DONDE_WA_FILA, 1).replace(PUB_ON, PUB_OFF, 1)
            return c
        return f

    # La condición con números (235): un estado nuevo, con «Observaciones» que se muestra según «Monto», como en `FRM-Editor-20`.
    t = sumar(t, "Con un mínimo de más de 10", "Con una condición con números", "Con un mínimo de más de 10",
              lambda n, c: c.replace("<b>Observaciones</b><span>Texto largo · Opcional</span>",
                                     "<b>Observaciones</b><span>Texto largo · 1 condición · Opcional</span>", 1))
    # «Solo en la app»: sin problemas de WhatsApp, «Dónde se completa» en lo que se publica y publicar al instante.
    def solo_app(numero, c):
        c = con_pv_app(con_donde_campo(c, "app").replace(BANDA_PUB_WA, BANDA_PUB, 1), PV_PEDIDO)
        for zona in ("Avisos", "Problemas"):
            if f'<div class="z-caja"><div class="z-cab">{zona}' in c:
                a = c.index(f'<div class="z-caja"><div class="z-cab">{zona}')
                c = c[:a] + c[cierre(c, a, "div"):]
        return c.replace(EN_WA_NO, DONDE_APP_FILA, 1).replace(DONDE_WA_FILA, DONDE_APP_FILA, 1).replace(PUB_OFF, PUB_ON, 1)
    t = sumar(t, "Con una lista dependiente", "Solo en la app", "Con una condición con números", solo_app)

    def publicada(numero, c):
        c = con_donde_campo(c, "app").replace('<span class="w-est">Publicado · versión 3</span>', '<span class="w-est">Publicado · versión 4</span>', 1)
        c = con_pv_app(c.replace(BANDA_PUB_WA, BANDA_PUB, 1), PV_PEDIDO)
        if '<div class="w-oscuro">' in c:
            a = c.index('<div class="w-oscuro">')
            c = c[:a] + TOAST.format("Publicamos la versión 4.") + c[cierre(c, a, "div"):]
        return c
    t = sumar(t, "Con una lista dependiente", "Solo en la app: publicada", "Solo en la app", publicada)
    for nombre, (pregunta, motivo, ir) in CASOS_WA.items():
        t = por_estado(t, f"s{indice(t, nombre)}", caso_wa(pregunta, motivo, ir))

    # Uno solo para clientes con número: el ajuste, con «Solo en la app» apagada, y lo que se publica.
    def clientes(numero, c):
        c = con_donde_campo(c, "wa", clientes=True).replace('<div class="ct sel">Empleados', '<div class="ct sel">Clientes', 1)
        c = c.replace(BANDA_PUB, BANDA_PUB_WA, 1)
        if '<div class="w-oscuro">' in c and DONDE_WA_FILA not in c:
            c = c.replace(CAMBIADAS, CAMBIADAS + DONDE_WA_FILA, 1)
        return c
    t = por_estado(t, f's{indice(t, "Solo para clientes: un mínimo de más de 10")}', clientes)
    # Sin número: no hay ajuste ni «En WhatsApp» (todo es de la app, 98).
    t = por_estado(t, f's{indice(t, "Sin número conectado")}', lambda n, c: c.replace(EN_WA_NO, "", 1))
    t = por_estado(t, f's{indice(t, "Solo para clientes")}', lambda n, c: c.replace('<div class="ct sel">Empleados', '<div class="ct sel">Clientes', 1))
    return t


SNACK = ('<div class="f-snack" role="status"><span class="ok"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
         'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 '
         '12.2 2.4 2.4 4.6-4.8"/></svg></span><span class="tx">{}</span></div>')
CSS_DETS_TEL = """
/* 213 · Lo que se publica, en la grilla de lectura del teléfono (el rótulo encima del valor), como en M-Auditoria-Org. */
.ap-dets { display: flex; flex-direction: column; }
.ap-det { display: flex; flex-direction: column; gap: 2px; padding: 10px 0; border-top: 1px solid var(--borde); }
.ap-det:first-child { border-top: 0; }
.ap-det span { font-size: 13px; color: var(--t3); }
.ap-det b { font-size: 15.5px; font-weight: 500; }
.t15e-pacc { display: flex; flex-direction: column; gap: 8px; }
.t15e-pacc .cb { min-height: 44px; width: 100%; justify-content: center; }
"""
CASOS_WA_TEL = {
    "Con una lista dependiente": ("Proveedor", "usa una lista dependiente, y WhatsApp no las muestra.", "M-FRM-Editor-Listas.dc.html"),
    "Con un catálogo grande": ("Repuesto", "tiene 240 opciones, y WhatsApp admite hasta 200 al elegir una.", "M-FRM-Editor-Listas.dc.html"),
    "Con un mínimo de más de 10": ("Productos", "en WhatsApp se cargan hasta 10 ítems; el mínimo es 15.", "M-FRM-Editor-Lineas.dc.html"),
    "Con una condición con números": ("Observaciones", "WhatsApp no muestra una condición con números.", "M-FRM-Editor-20.dc.html"),
}
EN_WA_TEL = '<span class="t-lin">11 preguntas</span><span class="t-lin">En WhatsApp: no</span>'


def dets_tel(donde_txt):
    fila = f'<div class="ap-det"><span>Dónde se completa</span><b>{donde_txt}</b></div>' if donde_txt else ""
    return f'<div class="ap-dets"><div class="ap-det"><span>Preguntas</span><b>13</b></div>{fila}</div>'


def hoja_zona(c, nuevo_cuerpo):
    """Cambia lo que hay entre el primer «Avisos» o «Problemas» de la hoja y «Qué se publica»."""
    a = c.index('<div class="p-tit2">', c.index('<div class="hb">'))
    b = c.index('<div class="p-tit2" style="margin-top: 12px;">Qué se publica</div>')
    return c[:a] + nuevo_cuerpo + c[b:]


def publicar_tel(t):
    t = lista_v4(t, "q-row")
    t = estilo(t, "donde", CSS_DONDE_TEL)
    t = estilo(t, "dets", CSS_DETS_TEL)

    def caso_wa(pregunta, motivo, ir):
        def f(numero, c):
            c = con_donde_campo(c, "wa", tel=True)
            if '<div class="ap-hoja"' in c and EN_WA_TEL in c:
                cuerpo = (f'<div class="p-tit2">Problemas</div><div class="cg-tban mal" style="margin: 0;">«{pregunta}»: {motivo}</div>'
                          f'<div class="t15e-pacc"><a class="cb cb-sec" href="{ir}">Ir a la pregunta</a><button type="button" class="cb cb-sec">'
                          'Pasar a «Solo en la app»</button></div>')
                c = hoja_zona(c, cuerpo).replace(EN_WA_TEL, dets_tel("En la app y por WhatsApp"), 1)
                c = c.replace('<button type="button" class="cb cb-pri">Publicar versión 4</button>',
                              '<button type="button" class="cb cb-pri" disabled title="Resolvé los problemas para publicar.">Publicar versión 4</button>', 1)
            return c
        return f

    t = sumar(t, "Con un mínimo de más de 10", "Con una condición con números", "Con un mínimo de más de 10",
              lambda n, c: c.replace("<b>Observaciones</b><span>Texto largo · Opcional</span>",
                                     "<b>Observaciones</b><span>Texto largo · 1 condición · Opcional</span>", 1))

    def solo_app(numero, c):
        c = con_donde_campo(c, "app", tel=True)
        if '<div class="ap-hoja"' in c and EN_WA_TEL in c:
            c = hoja_zona(c, "").replace(EN_WA_TEL, dets_tel("Solo en la app"), 1)
        return c
    t = sumar(t, "Con una lista dependiente", "Solo en la app", "Con una condición con números", solo_app)

    def publicada(numero, c):
        c = con_donde_campo(c, "app", tel=True)
        if '<div class="ap-hoja"' in c:
            a = c.index("<div ", c.index(">") + 1)
            return c[:a] + SNACK.format("Publicamos la versión 4.") + "</sc-if>"
        return c.replace('<span class="sub">Publicado · versión 3</span>', '<span class="sub">Publicado · versión 4</span>', 1)
    t = sumar(t, "Con una lista dependiente", "Solo en la app: publicada", "Solo en la app", publicada)
    for nombre, (pregunta, motivo, ir) in CASOS_WA_TEL.items():
        t = por_estado(t, f"s{indice(t, nombre)}", caso_wa(pregunta, motivo, ir))
    # Sin número (y uno solo para clientes sin número): sin ajuste; lo que se publica, en su grilla.
    for nombre in ("Sin número conectado", "Solo para clientes"):
        t = por_estado(t, f"s{indice(t, nombre)}", lambda n, c: c.replace(EN_WA_TEL, dets_tel(""), 1))
    t = por_estado(t, f's{indice(t, "Solo para clientes")}', lambda n, c: c.replace('<div class="ct sel">Empleados', '<div class="ct sel">Clientes', 1))
    return t


# ======================================================================================================== 5 · el chat
MOTIVO_APP = "<small>Se completa solo en la app.</small>"
I_PIN18 = svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', 18)
I_DOC18 = svg('<path d="M14.5 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V7.5z"/><path d="M14 3.5V8h4.5"/>'
              '<path d="M9 12.5h6"/><path d="M9 16h4"/>', 18)
I_RELOJ = svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', 14)
I_TILDE = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" '
           'stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>')
PUNTO = "-34.603722, -58.381592"
MAPA = "https://www.google.com/maps?q=-34.603722,-58.381592"
ESTADO_PEDIDO = {
    "esperando": f'<span class="t15e-st">{I_RELOJ} Esperando la ubicación</span>',
    "recibida": f'<span class="t15e-st ok">{I_TILDE} Ubicación recibida</span>',
    "siguio": f'<span class="t15e-st">{I_INFO} Siguió sin la ubicación</span>',
    "vencio": f'<span class="t15e-st">{I_TRI} Venció sin la ubicación</span>',
}


def msj(lado, cuerpo, pie, tel, clase_gl=""):
    m = "ap-m" if tel else "w-m"
    gl = f' class="gl {clase_gl}"' if clase_gl else ' class="gl"'
    return f'<div class="{m} {lado}"><span{gl}>{cuerpo}</span><span class="pie">{pie}</span></div>'


def pedido(estado, tel):
    """El pedido de ubicación antes del Flow (W1-A): el texto de Meta y, en la app, la tarjeta con su estado en un renglón."""
    cuerpo = ('Para completar «Visita a cliente», mandanos tu ubicación.<span class="c-card"><span class="ic">' + I_PIN18 + '</span><span '
              'class="t"><b>Pedido de ubicación</b><small>Visita a cliente</small></span></span>' + ESTADO_PEDIDO[estado])
    return msj("sal", cuerpo, "Lucía Fernández · 10:51 · Leído", tel)


def ubicacion_llega(tel):
    cuerpo = (f'<span class="ic">{I_PIN}</span><span class="pt">{PUNTO}</span><a href="{MAPA}" target="_blank" rel="noopener noreferrer">'
              f'Ver en el mapa {I_EXT}</a>')
    return msj("ent", cuerpo, "10:52", tel, "t15e-ubic")


def flow(tel):
    cuerpo = ('Completá el formulario «Visita a cliente».<span class="c-card"><span class="ic">' + I_DOC18 + '</span><span class="t"><b>Visita a '
              'cliente</b><small>Formulario · versión 4 · botón «Abrir formulario»</small></span></span>')
    return msj("sal", cuerpo, "Lucía Fernández · 10:52 · Entregado", tel)


def recorrido_ubicacion(caso, tel):
    if caso == "Pide la ubicación":
        return pedido("esperando", tel)
    if caso == "Llega la ubicación":
        return pedido("recibida", tel) + ubicacion_llega(tel) + flow(tel)
    if caso == "Sigue sin la ubicación":
        return (pedido("siguio", tel) + msj("sal", 'La ubicación es opcional.<span class="bt">Seguir sin ubicación</span>',
                                            "Lucía Fernández · 10:51 · Leído", tel)
                + msj("ent", "Seguir sin ubicación", "10:52", tel) + flow(tel))
    assert caso == "Vence sin la ubicación", caso
    dia = '<span class="ap-dia">14/10/2026</span>' if tel else '<span class="w-dia">14/10/2026</span>'
    return pedido("vencio", tel) + dia + '<span class="{}">El pedido de ubicación venció.</span>'.format("ap-sis" if tel else "o-sis")


CASOS_UBIC = ("Pide la ubicación", "Llega la ubicación", "Sigue sin la ubicación", "Vence sin la ubicación")
VISTA_PREVIA = {"Pide la ubicación": "Para completar «Visita a cliente», mandanos tu ubicación.", "Llega la ubicación": "Completá el formulario «Visita a cliente».",
                "Sigue sin la ubicación": "Completá el formulario «Visita a cliente».", "Vence sin la ubicación": "Para completar «Visita a cliente», mandanos tu ubicación."}
CSS_CHAT = """
/* 230 y W1-A · El pedido de ubicación con su estado en un renglón, y la ubicación que llega, con «Ver en el mapa». */
.t15e-st { display: flex; align-items: center; gap: 4.3px/*6px*/; margin-top: 5.8px/*8px*/; font-size: 10.5px/*12px*/; color: var(--t2); }
.t15e-st.ok { color: oklch(0.45 0.12 155); font-weight: 600; }
.t15e-ubic { display: inline-flex !important; align-items: center; gap: 5.8px/*8px*/; flex-wrap: wrap; }
.t15e-ubic .ic { color: var(--marca-tx); display: inline-flex; }
.t15e-ubic a { display: inline-flex; align-items: center; gap: 2.9px/*4px*/; color: var(--marca-tx); font-weight: 600; }
"""
CSS_CHAT_TEL = """
/* 230 y W1-A · El pedido de ubicación con su estado en un renglón, y la ubicación que llega, con «Ver en el mapa». */
.t15e-st { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 13px; color: var(--t2); }
.t15e-st.ok { color: oklch(0.45 0.12 155); font-weight: 600; }
.t15e-ubic { display: inline-flex !important; align-items: center; gap: 8px; flex-wrap: wrap; }
.t15e-ubic .ic { color: var(--marca-tx); display: inline-flex; }
.t15e-ubic a { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; color: var(--marca-tx); font-weight: 600; }
"""


def chat(t, tel=False):
    # 184 y 229: uno de la app sale apagado con «Se completa solo en la app.», en lugar del motivo de cada pregunta.
    t = re.sub(r'(<div class="c-op off" role="radio" aria-checked="false" aria-disabled="true"><span class="rd"></span><span class="tx"><b>'
               r'[^<]+</b>)<small>[^<]*</small>', lambda m: m.group(1) + MOTIVO_APP, t)
    t = t.replace('"Los tres motivos"', '"Tres de la app"')
    t = t.replace("<b>Visita a cliente</b><small>Versión 3 · 7 preguntas</small>", "<b>Visita a cliente</b><small>Versión 4 · 10 preguntas</small>")
    t = estilo(t, "chat", CSS_CHAT_TEL if tel else CSS_CHAT)
    anterior = "Uno elegido y otro apagado debajo"
    for caso in CASOS_UBIC:
        def cambio(numero, c, caso=caso):
            if numero == 0:  # lo que suma la conversación
                a = c.index(">") + 1
                return c[:a] + recorrido_ubicacion(caso, tel) + c[a:]
            if numero == 2:  # sin el diálogo
                return c[:c.index(">") + 1] + "</sc-if>"
            return c
        t = sumar(t, "Uno apagado", caso, anterior, cambio)
        anterior = caso
        # La vista previa y la hora de la conversación en la lista, como los demás estados.
        for clave, valor in (("vistaPrevia", VISTA_PREVIA[caso]), ("hora", "13/10/2026, 10:52")):
            m = re.search(clave + r": \{(.*?)\}\[e\]", t)
            if m and f'"{caso}"' not in m.group(1):
                t = t[:m.end(1)] + f', "{caso}": {json.dumps(valor, ensure_ascii=False)}' + t[m.end(1):]
    return t


# ======================================================================================================== 6 · la planilla y el detalle
FILA_PL = re.compile(r'(<div class="w-tr pl(?: sel)?"><span><a class="pl-num" href="[^"]*">(PED-\d+)</a></span>(?:<span>[^<]*</span>){4})'
                     r'(?!<span class="t15e-lug">)')
CSS_PUNTO = """
/* 230 · El punto: en la planilla, el enlace al mapa (UB4-A); en el detalle, con «Ver en el mapa» y la precisión en gris debajo. */
.t15e-mapa { display: inline-flex; align-items: center; gap: 2.9px/*4px*/; color: var(--marca-tx); text-decoration: underline; text-underline-offset: 2px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.t15e-pto { display: flex; flex-direction: column; gap: 1.4px/*2px*/; }
.t15e-pto .v { display: flex; flex-wrap: wrap; align-items: center; gap: 2.9px/*4px*/ 8.6px/*12px*/; font-variant-numeric: tabular-nums; }
.t15e-pto a { display: inline-flex; align-items: center; gap: 2.9px/*4px*/; color: var(--marca-tx); font-weight: 600; }
.t15e-pto small { color: var(--t3); font-size: 10.5px/*12px*/; }
"""
CSS_PUNTO_TEL = """
/* 230 · El punto en el detalle, con «Ver en el mapa» y la precisión en gris debajo. */
.t15e-pto { display: flex; flex-direction: column; gap: 2px; }
.t15e-pto .v { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 12px; font-variant-numeric: tabular-nums; }
.t15e-pto a { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; color: var(--marca-tx); font-weight: 600; }
.t15e-pto small { color: var(--t3); font-size: 13px; }
"""


def planilla(t):
    """La columna «Lugar de entrega» después de «Cliente»: el punto es el enlace al mapa; antes de la versión 4, «—»."""
    t = t.replace("<span>Cliente</span><span>Productos</span>", "<span>Cliente</span><span>Lugar de entrega</span><span>Productos</span>")
    t = t.replace("--pl-cols: 112px 136px 118px 88px 132px 110px 108px", "--pl-cols: 112px 136px 118px 88px 132px 176px 110px 108px")

    def celda(m):
        if m.group(2) == "PED-000046":
            v = (f'<a class="t15e-mapa" href="{MAPA}" target="_blank" rel="noopener noreferrer" aria-label="{PUNTO} · Ver en el mapa">{PUNTO} '
                 f'{I_EXT}</a>')
        else:
            v = '<span class="pl-g">—</span>'
        return m.group(1) + f'<span class="t15e-lug">{v}</span>'
    t = FILA_PL.sub(celda, t)
    return estilo(t, "punto", CSS_PUNTO)


def punto_detalle(tel):
    return (f'<span class="t15e-pto"><span class="v">{PUNTO}<a href="{MAPA}" target="_blank" rel="noopener noreferrer">Ver en el mapa {I_EXT}</a>'
            '</span><small>± 15 m</small></span>')


IMPORTES = {"Caño de 1/2 pulgada": "$ 21.000,00", "Codo de 90°": "$ 17.000,00"}


def detalle(t, tel=False):
    """El detalle de PED-000046: «Lugar de entrega» con el punto y la precisión, e «Importe» en cada ítem del bloque (233)."""
    if tel:
        t = t.replace('<div class="f"><span class="k">Fecha de entrega</span><span>22/10/2026</span></div><div class="f"><span class="k">Proveedor',
                      '<div class="f"><span class="k">Fecha de entrega</span><span>22/10/2026</span></div><div class="f"><span class="k">Lugar de '
                      f'entrega</span>{punto_detalle(True)}</div><div class="f"><span class="k">Proveedor')
        t = estilo(t, "punto", CSS_PUNTO_TEL)
    else:
        t = t.replace('<span class="k">Fecha de entrega</span><span>22/10/2026</span><span class="k">Proveedor',
                      f'<span class="k">Fecha de entrega</span><span>22/10/2026</span><span class="k">Lugar de entrega</span>{punto_detalle(False)}'
                      '<span class="k">Proveedor')
        # La tabla del bloque en la pantalla completa: «Importe», alineado a la derecha.
        t = t.replace('<span class="h r">Precio</span><span class="h r">Cantidad</span><span class="r n">1</span>',
                      '<span class="h r">Precio</span><span class="h r">Cantidad</span><span class="h r">Importe</span><span class="r n">1</span>')
        for producto, importe in IMPORTES.items():
            t = re.sub(r'(<span>' + re.escape(producto) + r'</span><span class="r">[^<]*</span><span class="r">\d+</span>)(?!<span class="r t15e-imp">)',
                       lambda m: m.group(1) + f'<span class="r t15e-imp">{importe}</span>', t)
        t = estilo(t, "importe", ".it-t { grid-template-columns: 40px minmax(180px, 1fr) 110px 90px 110px !important; min-width: 530px !important; }")
    for producto, importe in IMPORTES.items():
        t = re.sub(r'(' + re.escape(producto) + r'<span class="d-sub"><span class="k">Precio</span><span>[^<]*</span><span class="k">Cantidad</span>'
                   r'<span>\d+</span>)(?!<span class="k">Importe)', lambda m: m.group(1) + f'<span class="k">Importe</span><span>{importe}</span>', t)
    return t


# ======================================================================================================== 7 · la carga
PRECIOS = {  # el campo «Precio» del catálogo «Productos»: los dos primeros, como en el detalle de PED-000046
    "Caño de 1/2 pulgada": 4200, "Codo de 90°": 850, "Cinta de teflón": 600, "Llave de paso": 9500, "Tee de 1/2 pulgada": 1100,
    "Cupla de 1/2 pulgada": 700, "Caño de 3/4 pulgada": 6300, "Niple de 1/2 pulgada": 450, "Unión doble de 1/2 pulgada": 2800,
    "Tapón de 1/2 pulgada": 380,
}
INFO_IMPORTE = "Cantidad × Producto · Precio."  # las fórmulas de la E19 (`FRM-Editor-Calculo`)
INFO_TOTAL = "Suma de Productos · Importe + Monto."
INFO_APROX = ("Es una ubicación aproximada: sin GPS, el navegador la calcula por la red y puede errar por kilómetros. Desde un celular "
              "sale más precisa.")
ERR_PERMISO = ("No hay permiso para usar tu ubicación. Permitilo en la configuración del sitio, en el navegador, y volvé a tocar «Usar mi "
               "ubicación».")
ERR_SENAL = "No se pudo obtener tu ubicación. Revisá que la ubicación del dispositivo esté activada y volvé a tocar «Usar mi ubicación»."
ESTADOS_UBIC = (("Ubicación: pidiendo", "pidiendo"), ("Ubicación: con el punto", "punto"), ("Ubicación: aproximada", "aproximada"),
                ("Ubicación: sin permiso", "sin_permiso"), ("Ubicación: sin señal", "sin_senal"))


def pesos(n):
    entero, dec = f"{n:,.2f}".split(".")
    return "$ " + entero.replace(",", ".") + "," + dec


def control_ubicacion(estado, tel):
    """«Usar mi ubicación» (UB3-A): el botón, el aro mientras la busca, el recuadro del punto con la precisión y la ✕, «Ver en el mapa» y
    «Volver a pedirla», y el renglón rojo si el navegador no la da."""
    boton = f'<button type="button" class="cb cb-sec t15e-ubtn">{I_PIN} Usar mi ubicación</button>'
    if estado == "pidiendo":
        boton = ('<button type="button" class="cb cb-sec t15e-ubtn k-trabaja" aria-disabled="true" aria-busy="true"><span class="girar2" '
                 'aria-hidden="true"></span>Buscando tu ubicación…</button>')
    if estado in ("punto", "aproximada"):
        if estado == "punto":
            pr = '<span class="pr">± 15 m</span>'
        else:
            pr = f'<span class="pr baja">{I_TRI} ± 2.400 m{info(INFO_APROX)}</span>'
        cruz = (f'<button type="button" class="{"ap-ib" if tel else "ib"} pel" aria-label="Quitar la ubicación">'
                + svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 20 if tel else 16) + '</button>')
        caja = f'<div class="t15e-ubox"><span class="ic">{I_PIN}</span><span class="tx"><span class="pt">{PUNTO}</span>{pr}</span>{cruz}</div>'
        if tel:
            enlaces = (f'<div class="cg-tacc"><a class="cb cb-sec" href="{MAPA}" target="_blank" rel="noopener noreferrer">Ver en el mapa {I_EXT}</a>'
                       '<button type="button" class="cb cb-sec">Volver a pedirla</button></div>')
        else:
            enlaces = (f'<div class="t15e-ulinks"><a href="{MAPA}" target="_blank" rel="noopener noreferrer">Ver en el mapa {I_EXT}</a>'
                       '<button type="button" class="cb cb-enl">Volver a pedirla</button></div>')
        cuerpo = caja + enlaces
    else:
        cuerpo = f'<div class="cg-tacc">{boton}</div>' if tel else boton
        if estado in ("sin_permiso", "sin_senal"):
            cuerpo += f'<span class="err2" role="status">{ERR_PERMISO if estado == "sin_permiso" else ERR_SENAL}</span>'
    return f'<div class="t15e-ub" aria-live="polite">{cuerpo}</div>'


def lugar(c, modo, estado=None):
    """«Lugar de entrega», después de «Proveedor» (una columna en la página, como una fecha)."""
    tel = modo == "tel"
    rt = ('<span class="rt"><span>Proveedor <span class="rq">*</span></span></span>' if tel
          else '<span class="rt">Proveedor <span class="req">*</span></span>')
    if "Lugar de entrega" in c or rt not in c:
        return c
    if estado is None:
        estado = "punto" if "Aceros Rosario" in c else "boton"
    i = c.index(rt)
    if tel:
        a = c.rfind('<div class="ap-cmp"', 0, i)
        nuevo = f'<div class="cg-tc"><span class="rt">Lugar de entrega</span>{control_ubicacion(estado, True)}</div>'
    else:
        a = c.rfind('<div class="cg-fila"', 0, i)
        nuevo = (f'<div class="cg-fila" data-entry-row><div class="w-cmp cg-q s1"><span class="rt">Lugar de entrega</span>'
                 f'{control_ubicacion(estado, False)}</div></div>')
    b = cierre(c, a, "div")
    return c[:b] + nuevo + c[b:]


def monto(c):
    m = re.search(r'Monto(?:</span>)+<div class="ct[^"]*">([^<]*)</div>', c)
    if m:
        return float(m.group(1).replace(".", "").replace(",", ".")) if m.group(1) else 0.0
    return 30000.0 if "4 de 4 respondidas" in c else 0.0


def importe(producto, cantidad):
    if producto not in PRECIOS or not cantidad.strip().isdigit():
        return None
    return PRECIOS[producto] * int(cantidad)


def campo_calc(rotulo, ayuda, valor, tel):
    if tel:
        return (f'<div class="ap-cmp"><span class="rt"><span>{rotulo}</span>{info(ayuda)}</span><div class="t15e-calc" aria-readonly="true">'
                f'{valor}</div></div>')
    return (f'<div class="w-cmp cg-q s1"><span class="rt">{rotulo}{info(ayuda)}</span><div class="t15e-calc" aria-readonly="true">{valor}'
            '</div></div>')


def calculos(c, modo):
    """El cálculo en gris (234 y 233): «Importe» de cada ítem y «Total», que cambian al escribir y no se editan."""
    tel = modo == "tel"
    if "t15e-calc" in c or "Productos" not in c:
        return c
    valores = []
    if modo == "pagina":
        a = c.find('<div class="cg-blq-t"')
        if a < 0:
            return c
        b = cierre(c, a, "div")
        tabla = c[a:b].replace('<span class="h"><span class="sr">Acciones</span></span>',
                               f'<span class="h r">Importe{info(INFO_IMPORTE)}</span><span class="h"><span class="sr">Acciones</span></span>', 1)
        partes, i = [], 0
        for m in re.finditer(r'<span class="ac">', tabla):
            fila = tabla[tabla.rfind('<span class="n">', 0, m.start()):m.start()]
            p = re.search(r'<span class="v">([^<]+)</span>', fila)
            q = re.findall(r'<div class="ct(?! cg-cat)[^"]*">([^<]*)</div>', fila)
            v = importe(p.group(1) if p else "", q[-1] if q else "")
            valores.append(v)
            partes += [tabla[i:m.start()], f'<span class="r t15e-calc">{pesos(v) if v is not None else ""}</span>']
            i = m.start()
        partes.append(tabla[i:])
        c = c[:a] + "".join(partes) + c[b:]
        ancla = c.rfind('<div class="cg-fila"', 0, a)
    else:
        item_cls = '<div class="cg-tit">' if tel else '<div class="cg-it">'
        partes, i = [], 0
        for m in re.finditer(re.escape(item_cls), c):
            fin = cierre(c, m.start(), "div")
            item = c[m.start():fin]
            if tel:
                p = re.search(r'Producto <span class="rq">\*</span></span></span><div class="ct">([^<]*)</div>', item)
                q = re.search(r'Cantidad <span class="rq">\*</span></span></span><div class="ct[^"]*">([^<]*)</div>', item)
            else:
                p = re.search(r'Producto <span class="req">\*</span></span><div class="ct cg-cat[^"]*"><span class="v">([^<]+)</span>', item)
                q = re.search(r'Cantidad <span class="req">\*</span></span><div class="ct[^"]*">([^<]*)</div>', item)
            v = importe(p.group(1) if p else "", q.group(1) if q else "")
            valores.append(v)
            ci = item.index('<div class="c">')
            cf = cierre(item, ci, "div") - len("</div>")
            item = item[:cf] + campo_calc("Importe", INFO_IMPORTE, pesos(v) if v is not None else "", tel) + item[cf:]
            partes += [c[i:m.start()], item]
            i = fin
        partes.append(c[i:])
        c = "".join(partes)
        if tel:
            k = c.find('<span class="rt">Productos</span>')
            ancla = c.rfind('<div class="cg-tc">', 0, k) if k >= 0 else -1
        else:
            k = c.find('<div class="cg-its">')
            ancla = c.rfind('<div class="cg-fila"', 0, k) if k >= 0 else -1
    if ancla < 0:
        return c
    total = "" if not valores or None in valores else pesos(sum(valores) + monto(c))
    fin = cierre(c, ancla, "div")
    nuevo = campo_calc("Total", INFO_TOTAL, total, tel)
    if not tel:
        nuevo = f'<div class="cg-fila" data-entry-row>{nuevo}</div>'
    return c[:fin] + nuevo + c[fin:]


CSS_CARGA = """
/* 230 · «Usar mi ubicación» (UB3-A): el recuadro del punto, como el de un archivo; la precisión baja, en ámbar con su (i). */
.t15e-ub { display: flex; flex-direction: column; gap: 5.8px/*8px*/; align-items: flex-start; }
.t15e-ubtn { display: inline-flex; align-items: center; gap: 5.8px/*8px*/; }
.t15e-ubox { align-self: stretch; display: flex; align-items: center; gap: 7.2px/*10px*/; padding: 4.3px/*6px*/ 4.3px/*6px*/ 4.3px/*6px*/ 8.6px/*12px*/; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; }
.t15e-ubox .ic { color: var(--marca-tx); display: inline-flex; }
.t15e-ubox .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }
.t15e-ubox .pt { font-variant-numeric: tabular-nums; }
.t15e-ubox .pr { display: inline-flex; align-items: center; gap: 2.9px/*4px*/; color: var(--t3); font-size: 10.5px/*12px*/; }
.t15e-ubox .pr.baja { color: oklch(0.5 0.12 70); font-weight: 500; }
.t15e-ubox .ib.pel { color: var(--peligro); }
.t15e-ulinks { display: flex; flex-wrap: wrap; align-items: center; gap: 4.3px/*6px*/ 11.5px/*16px*/; }
.t15e-ulinks a { display: inline-flex; align-items: center; gap: 2.9px/*4px*/; color: var(--marca-tx); font-weight: 600; }
/* 234 · El cálculo, en gris y sin poder escribirse: una columna del bloque, una línea del recuadro y, afuera, un campo de una columna. */
.t15e-calc { color: var(--t3); font-variant-numeric: tabular-nums; }
div.t15e-calc { min-height: 25.2px/*34px*/; display: flex; align-items: center; }
.cg-blq-t > span.t15e-calc { justify-content: flex-end; }
.cg-blq-t > .h.r { justify-content: flex-end; }
.cg-blq-t { grid-template-columns: 40px minmax(200px, 1.4fr) minmax(120px, 1fr) 120px 112px !important; min-width: 640px !important; }
"""
CSS_CARGA_TEL = """
/* 230 · «Usar mi ubicación» (UB3-A): los botones a lo ancho, con 44 de alto; el recuadro del punto, como el de un archivo. */
.t15e-ub { display: flex; flex-direction: column; gap: 8px; }
.t15e-ub .cb { min-height: 44px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.t15e-ubox { display: flex; align-items: center; gap: 10px; padding: 6px 2px 6px 12px; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; font-size: 15px; }
.t15e-ubox .ic { color: var(--marca-tx); display: inline-flex; }
.t15e-ubox .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }
.t15e-ubox .pt { font-variant-numeric: tabular-nums; }
.t15e-ubox .pr { display: inline-flex; align-items: center; gap: 4px; color: var(--t3); font-size: 13px; }
.t15e-ubox .pr.baja { color: oklch(0.5 0.12 70); font-weight: 500; }
.t15e-ubox .ap-ib.pel { color: var(--peligro); width: 44px; height: 44px; }
/* 234 · El cálculo, en gris y sin poder escribirse: una línea del recuadro de cada ítem y, afuera, un campo. */
.t15e-calc { color: var(--t3); font-variant-numeric: tabular-nums; }
div.t15e-calc { min-height: 44px; display: flex; align-items: center; font-size: 15.5px; }
"""


def carga(t, modo):
    t = t.replace("3 de 5 respondidas", "3 de 6 respondidas")
    t = estilo(t, "carga", CSS_CARGA_TEL if modo == "tel" else CSS_CARGA)
    # En el teléfono, la base es «Con dos ítems», con «Datos» plegada: así «Lugar de entrega» se ve sin desplazar.
    base = {"panel": "Panel", "tel": "Con dos ítems"}.get(modo, "Nueva respuesta")
    anterior = base
    for nombre, estado in ESTADOS_UBIC:
        t = sumar(t, base, nombre, anterior, lambda n, c, estado=estado: lugar(c, modo, estado))
        anterior = nombre
    for n in range(len(opciones(t)) - 1, -1, -1):
        if bloques(t, f"s{n}"):
            t = por_estado(t, f"s{n}", lambda numero, c: calculos(lugar(c, modo), modo))
    return t


# ======================================================================================================== el pase
PASES = {
    "FRM-Formularios-20": formularios,
    "M-FRM-Formularios-20": formularios_tel,
    "FRM-Publicar-20": publicar,
    "M-FRM-Publicar-20": publicar_tel,
    "WA-Chats-Formulario-20": chat,
    "M-WA-Chats-Formulario-20": lambda t: chat(t, tel=True),
    "FRM-Respuestas-20": lambda t: planilla(t),
    "FRM-Respuesta-20": lambda t: detalle(planilla(t)),
    "M-FRM-Respuesta-20": lambda t: detalle(t, tel=True),
    "FRM-Cargar-Respuesta": lambda t: carga(t, "pagina"),
    "FRM-Cargar-Panel": lambda t: carga(t, "panel"),
    "M-FRM-Cargar-Respuesta": lambda t: carga(t, "tel"),
}


# ======================================================================================================== 8 · los tableros nuevos
def podar(t, conservar, renombres):
    """Deja solo los estados `conservar` (por nombre), con sus nombres nuevos: saca los bloques de los demás y la lista del Tweak queda
    con los que siguen. La lista de la lógica conserva todos los nombres, así cada estado guarda su número (como `FRM-Editor-18`)."""
    lista = json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))
    for i, nombre in enumerate(lista):
        if nombre in conservar:
            continue
        for a, b in reversed(bloques(t, f"s{i}")):
            t = t[:a] + t[b:]
    m = re.search(r'"estado":\{"editor":"enum","options":\[([^\]]*)\],"default":"([^"]*)"', t)
    nuevos = [renombres.get(n, n) for n in conservar]
    t = t[:m.start(1)] + ",".join(json.dumps(n, ensure_ascii=False) for n in nuevos) + t[m.end(1):]
    m = re.search(r'"estado":\{"editor":"enum","options":\[[^\]]*\],"default":"([^"]*)"', t)
    t = t[:m.start(1)] + nuevos[0] + t[m.end(1):]
    mk = re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t)
    t = t[:mk.start(1)] + json.dumps([renombres.get(n, n) for n in lista], ensure_ascii=False) + t[mk.end(1):]
    return re.sub(r'const e = this\.props\.estado \?\? "[^"]*";', f'const e = this.props.estado ?? "{nuevos[0]}";', t, count=1)


def titulo(t, nuevo):
    return re.sub(r"<title>[^<]*</title>", f"<title>{nuevo}</title>", t, count=1)


def armar_editor_20(t):
    """`FRM-Editor-20` sale de `FRM-Editor-Condiciones` (la E19): «Sí o no» y «Número y fecha», con los enlaces de la E20."""
    t = podar(t, ["Sí o no", "Número y fecha"], {"Sí o no": "En la app y por WhatsApp", "Número y fecha": "Una condición con números"})
    for viejo, nuevo in (("FRM-Editor-Condiciones.dc.html", "FRM-Editor-20.dc.html"), ("FRM-Publicar-19.dc.html", "FRM-Publicar-20.dc.html"),
                         ("FRM-Respuestas-19.dc.html", "FRM-Respuestas-20.dc.html"), ('href="FRM-Formularios.dc.html"', 'href="FRM-Formularios-20.dc.html"')):
        t = t.replace(viejo, nuevo)
    return titulo(t, "Editor · dónde se completa · etapa 20")


def armar_editor_20_tel(t):
    t = podar(t, ["Mostrar si", "Una condición con números"], {"Mostrar si": "En la app y por WhatsApp"})
    t = t.replace('href="M-FRM-Formularios.dc.html"', 'href="M-FRM-Formularios-20.dc.html"')
    return titulo(t, "Dónde se completa · teléfono · etapa 20")


INFO_TIPO_UBIC = "El punto que da el dispositivo al completar. Por WhatsApp se pide antes del formulario."
INFO_TIPO_CORREO = "Se valida que sea un correo. En WhatsApp va como un texto con teclado de correo."


def armar_ubicacion(t, tel=False):
    """`FRM-Editor-Ubicacion` sale de `FRM-Editor-21` («Correo», que es de la E21): la tercera pregunta de «Visita a cliente» pasa a
    «Ubicación de la visita», de tipo «Ubicación», el último de «Tipo de respuesta», solo con «Obligatoria» (230). Sin «Reglas» ni
    «Correo», que son de la E21 (78). La vista previa de WhatsApp no la muestra: se pide antes del Flow (W1-A)."""
    t = t.replace("Correo del cliente", "Ubicación de la visita").replace("<span>Correo · Opcional</span>", "<span>Ubicación · Opcional</span>")
    t = t.replace(INFO_TIPO_CORREO, INFO_TIPO_UBIC).replace("El tipo «Correo»", "El tipo «Ubicación»")
    t = t.replace('<div class="ct sel">Correo<svg', '<div class="ct sel">Ubicación<svg').replace('<div class="ct">Correo</div>', '<div class="ct">Ubicación</div>')
    t = t.replace('<span role="option" class="on">Correo</span>', "")
    t = t.replace('<span role="option" class="">Cálculo</span></div>', '<span role="option" class="">Cálculo</span><span role="option" class="on">Ubicación</span></div>')
    t = re.sub(r'<div class="pv-c">Ubicación de la visita \(opcional\)<div class="pv-in">[^<]*</div></div>', "", t)
    t = t.replace('<a class="" role="tab" aria-selected="false" href="FRM-Editor-Reglas.dc.html">Reglas</a>', "")
    t = re.sub(r'( Formularios) <span class="cnt">\d+</span>', r"\1", t)
    for viejo, nuevo in (("FRM-Editor-21.dc.html", "FRM-Editor-Ubicacion.dc.html"), ("M-FRM-Editor-21.dc.html", "M-FRM-Editor-Ubicacion.dc.html"),
                         ("FRM-Formularios-21.dc.html", "FRM-Formularios-20.dc.html"), ("FRM-Respuestas-21.dc.html", "FRM-Respuestas.dc.html"),
                         ("FRM-Tablero-21.dc.html", "FRM-Tablero.dc.html"), ("Campana-21.dc.html", "Campana.dc.html")):
        t = t.replace(viejo, nuevo)
    if tel:
        return titulo(t, "La pregunta «Ubicación» · teléfono · etapa 20")
    return titulo(t, "Editor · la pregunta «Ubicación» · etapa 20")


NUEVOS = {  # tablero nuevo: (base, función que lo arma la primera vez)
    "FRM-Editor-20": ("FRM-Editor-Condiciones", armar_editor_20),
    "M-FRM-Editor-20": ("M-FRM-Editor-Condiciones", armar_editor_20_tel),
    "FRM-Editor-Ubicacion": ("FRM-Editor-21", armar_ubicacion),
    "M-FRM-Editor-Ubicacion": ("M-FRM-Editor-21", lambda t: armar_ubicacion(t, tel=True)),
}

AVISO_COND = '<span class="err2 adv" role="status">WhatsApp no muestra una condición con números.</span>'
AVISO_COND_SALIDA = ('<span class="err2 adv t15e-adv" role="status"><span>WhatsApp no muestra una condición con números.</span><button '
                     'type="button" class="cb cb-enl">Pasar a «Solo en la app»</button></span>')
BANDA_WA_19 = ('<button type="button" class="cb cb-pri" aria-disabled="true" title="Primero guardá los cambios.">Publicar en WhatsApp</button>'
               '<a class="cb cb-sec" href="FRM-Publicar-20.dc.html">Ver vista oficial</a>')
BANDA_APP_19 = '<button type="button" class="cb cb-pri" aria-disabled="true" title="Primero guardá los cambios.">Publicar</button>'
PV_V3 = [campo_pv("Cliente", '<div class="ct"></div>', True), campo_pv("¿Se concretó la venta?", PV_SINO, True),
         campo_pv("Fecha de entrega", '<div class="ct"></div>')]
CSS_ADV = """
/* 235 · El aviso de la condición que WhatsApp no muestra, con su salida al lado (229). */
.t15e-adv { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2.9px/*4px*/ 8.6px/*12px*/; }
.t15e-adv .cb-enl { font-size: inherit; font-weight: 600; }
"""
CSS_ADV_TEL = """
/* 235 · El aviso de la condición que WhatsApp no muestra, con su salida debajo (229), con 44 para tocar. */
.t15e-adv { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.t15e-adv .cb-enl { min-height: 44px; padding: 0; font-weight: 600; }
"""


def editor_20(t, tel=False):
    t = estilo(t, "donde", CSS_DONDE_TEL if tel else CSS_DONDE)
    t = estilo(t, "adv", CSS_ADV_TEL if tel else CSS_ADV)
    if not tel:
        t = estilo(t, "vista-app", CSS_PV)
    cond = "Una condición con números"

    def solo_app(numero, c):
        c = con_donde_campo(c, "app", tel=tel).replace(BANDA_WA_19, BANDA_APP_19, 1)
        return c if tel else con_pv_app(c, PV_V3)
    if not tel:
        t = sumar(t, "En la app y por WhatsApp", "Solo en la app", "En la app y por WhatsApp", solo_app)

    def clientes(numero, c):
        c = con_donde_campo(c, "wa", clientes=True, tel=tel, tip=True)
        return c.replace('<div class="ct sel">Empleados', '<div class="ct sel">Clientes', 1)
    t = sumar(t, "En la app y por WhatsApp", "Uno solo para clientes", "Solo en la app" if not tel else "En la app y por WhatsApp", clientes)

    # «Pasar a «Solo en la app»» debajo de la condición solo cambia el ajuste: se guarda con lo demás.
    def paso(numero, c):
        c = con_donde_campo(c, "app", tel=tel).replace(AVISO_COND, "", 1).replace(AVISO_COND_SALIDA, "", 1)
        c = c.replace('<button type="button" class="cb cb-sec" disabled>Descartar</button><button type="button" class="cb cb-sec" disabled>Guardar cambios</button>',
                      '<button type="button" class="cb cb-sec">Descartar</button><button type="button" class="cb cb-pri">Guardar cambios</button>', 1)
        c = c.replace(BANDA_WA_19, BANDA_APP_19, 1)
        return c if tel else con_pv_app(c, PV_V3)
    t = sumar(t, cond, "Pasó a «Solo en la app»", cond, paso)
    t = por_estado(t, f"s{indice(t, cond)}", lambda n, c: c.replace(AVISO_COND, AVISO_COND_SALIDA, 1))
    for n in range(len(json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1)))):
        if bloques(t, f"s{n}"):
            t = por_estado(t, f"s{n}", lambda numero, c: con_donde_campo(c, "wa", tel=tel) if "t15e-donde" not in c else c)
    return t


def editor_ubicacion(t, tel=False):
    t = estilo(t, "donde", CSS_DONDE_TEL if tel else CSS_DONDE)
    for n in range(len(opciones(t)) + 2):
        if bloques(t, f"s{n}"):
            t = por_estado(t, f"s{n}", lambda numero, c: con_donde_campo(c, "wa", tel=tel) if "t15e-donde" not in c else c)
    return t


PASES.update({
    "FRM-Editor-20": editor_20,
    "M-FRM-Editor-20": lambda t: editor_20(t, tel=True),
    "FRM-Editor-Ubicacion": editor_ubicacion,
    "M-FRM-Editor-Ubicacion": lambda t: editor_ubicacion(t, tel=True),
})

if __name__ == "__main__":
    solo = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    cambiados = []
    for nombre, (base, armar) in NUEVOS.items():
        if solo and nombre not in solo:
            continue
        if not existe(nombre):
            escribir(nombre, armar(leer(base)))
            cambiados.append(nombre)
    for nombre, pase in PASES.items():
        if solo and nombre not in solo:
            continue
        assert canvas["boards"].get(f"{nombre}.dc.html", {}).get("page", "formularios") != "archivo", nombre
        t = leer(nombre)
        nuevo = pase(t)
        if nuevo != t:
            escribir(nombre, nuevo)
            if nombre not in cambiados:
                cambiados.append(nombre)
    print("ok", len(PASES), "tableros,", len(cambiados), "cambiados")
    if cambiados:
        print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(cambiados))
