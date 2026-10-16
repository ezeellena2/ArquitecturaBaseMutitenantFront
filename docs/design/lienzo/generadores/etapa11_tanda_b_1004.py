"""Etapa 11, tanda B: suma a los tableros de Plantillas, Contactos, Difusiones, Cargar teléfonos, Usuarios e Invitación los
estados que el front ya programó y al lienzo le faltaban, copiados de la app (el lienzo sigue a la app): «Nueva plantilla»
con sus datos y errores, «Pausada», el ⋮ y «Borrar», la lista vacía, las del sistema sin ⋮; el ⋮ de Contactos, la pestaña
«Difusiones» de la ficha, el origen del consentimiento, crear una etiqueta (D10) y la baja apagada; las variables, «Mandar»
y «Duplicar» de una difusión; los dos pasos de Cargar teléfonos y su error; y la invitación por teléfono en Usuarios,
Usuario e Invitación. Los teléfonos van en el formato nacional de PhoneText (libphonenumber: «011 15-5555-6203»).

Corre después de `etapa11_1004.py` (usa sus ayudas sin correr su main). Cada tablero que toca lleva la marca `data-e11tb`
y, si ya la tiene, no se vuelve a tocar; el formato de los teléfonos se aplica siempre y es idempotente. Para rehacer un
tablero, se restaura desde git y se vuelve a correr."""
import json
import re
import sys

import etapa11_1004 as e11
from etapa11_1004 import (ALERTA, CERRAR, CERRAR_TEL, CHEV, CHEV_TEL, CSS_COMPU, CSS_FICHA, CSS_FICHA_TEL, CSS_TEL, OK, TILDE,
                          bloques, campo, campo_tel, cierre_div, dg, dg_tel, div_en, dlg, escribir, estados_compu, hoja, leer,
                          seg, sumar_estado, sumar_estado_tel, _svg)
from estados_util import con_estados_pantalla, marcar, rep, sumar_opcion

sys.stdout.reconfigure(encoding="utf-8")
MARCA = "data-e11tb"

# ---------------------------------------------------------------- piezas

def _ico(d, w=16):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{d}</svg>')


# Los íconos de los ⋮ de la app: Copy y Trash2 (lucide) en Plantillas; EyeIcon y PencilIcon (src/shared/ui/icons) en Contactos.
COPIAR = _ico('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>')
BORRAR = _ico('<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/>'
              '<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>')
OJO = _ico('<path d="M2.75 12S6.25 5.75 12 5.75 21.25 12 21.25 12 17.75 18.25 12 18.25 2.75 12 2.75 12Z"/><circle cx="12" cy="12" r="2.75"/>')
LAPIZ = _ico('<path d="M15.5 5.5 18.5 8.5 9 18H6v-3z"/><path d="m13.75 7.25 3 3"/>')
LUPA = _ico('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>')
LUPA_TEL = _ico('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', 20)
# El teléfono de PhoneIcon (src/shared/ui/icons): en el círculo de una invitación por teléfono, en lugar de «@».
TELEFONO = _ico('<path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6a2 2 0 0 1 2-2Z"/>', 20)
SEP = None
RQ = ' <span style="color: var(--peligro);">*</span>'


def var(n):
    """«{{n}}» tal cual: la llave de adelante va en su propio span para que el motor del lienzo no lo tome como un valor."""
    return '<span>{</span>{' + str(n) + '}}'


def tel_nacional(t):
    """PhoneText (formatPhone de src/shared/format): un número del país de la cultura, en formato nacional."""
    return re.sub(r"\+54 9 (\d{2,4}) (\d{3,4})-(\d{4})", lambda m: f"0{m.group(1)} 15-{m.group(2)}-{m.group(3)}", t)


def menu(etiqueta, items, estilo):
    """El ⋮ de una fila en la compu (RowActions; «Criterio · Menús»): ícono y texto, las de peligro al final tras una franja."""
    h = "".join('<div class="sep" role="separator"></div>' if i is SEP else
                f'<span class="it{" pel" if i[2] else ""}" role="menuitem">{i[0]} {i[1]}</span>' for i in items)
    return f'<div class="e11b-mn" role="menu" aria-label="{etiqueta}" style="{estilo}">{h}</div>'


def acciones_tel(titulo, comunes, peligro=()):
    """El ⋮ de una fila en el teléfono (PhoneActionsSheet; M-Empresa): hoja con el dato de la fila de título y sin ✕."""
    ops = "".join(f'<span role="menuitem">{o}</span>' for o in comunes)
    if comunes and peligro:
        ops += '<span class="sep" role="separator"></span>'
    ops += "".join(f'<span class="pel" role="menuitem">{o}</span>' for o in peligro)
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de {titulo}"><span class="asa"></span>'
            f'<div class="hc" style="padding-right: 20px;"><h2>{titulo}</h2></div><div class="hb" style="padding-bottom: 34px;">'
            f'<div class="ap-acciones">{ops}</div></div></div>')


def confirmar(titulo, boton):
    """ConfirmDialog rojo sin descripción ni ✕: el título y «Cancelar» / la acción."""
    return (f'<div class="w-oscuro"><div class="w-dlg chico" role="alertdialog" aria-label="{titulo}"><div class="dc"><span>{titulo}</span></div>'
            f'<div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">{boton}</button></div></div></div>')


def confirmar_tel(titulo, boton):
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="alertdialog" aria-label="{titulo}"><span class="asa"></span>'
            f'<div class="hc" style="padding-right: 20px;"><h2>{titulo}</h2></div>'
            f'<div class="hp"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pel lleno">{boton}</button></div></div>')


def cmp(rotulo, valor, req=True, err="", vacio=False, ancho=False, select=False, abre=""):
    """Un campo de la compu (FormField): rótulo, control y, debajo, su error."""
    s = ' style="grid-column: 1 / -1;"' if ancho else ""
    clase = "ct" + (" e11b-mal" if err else "") + (" e11b-ph" if vacio else "")
    e = f'<span class="e11b-err" role="alert">{err}</span>' if err else ""
    return (f'<div class="w-cmp{" e11b-abre" if abre else ""}"{s}><span class="rt">{rotulo}{RQ if req else ""}</span>'
            f'<div class="{clase}">{valor}{(" " + CHEV) if select else ""}</div>{e}{abre}</div>')


def cmp_tel(rotulo, valor, req=True, err="", vacio=False, select=False, abre=""):
    clase = "ct" + (" sel" if select else "") + (" e11b-mal" if err else "") + (" e11b-ph" if vacio else "")
    r = ' <span class="rq">*</span>' if req else ""
    e = f'<span class="e11b-err" role="alert">{err}</span>' if err else ""
    return (f'<div class="ap-cmp{" e11b-abre" if abre else ""}"><span class="rt"><span>{rotulo}{r}</span></span>'
            f'<div class="{clase}">{valor}{CHEV_TEL if select else ""}</div>{e}{abre}</div>')


def aviso_mal(texto, tel=False):
    """FormError (.aviso-mal): la franja roja de un error que no es de un campo."""
    return f'<div class="e11b-aviso-mal{" tel" if tel else ""}" role="alert">{ALERTA}<span>{texto}</span></div>'


def toast_ok(texto):
    return f'<div class="e11b-toast" role="status"><span class="ok">{OK}</span><span>{texto}</span></div>'


def snack_ok(texto):
    return f'<div class="e11b-snack" role="status"><span class="ok">{OK}</span><span class="tx">{texto}</span></div>'


def lista_multi(buscado, ops):
    """MultiSelect abierto (compu y teléfono): el buscador y, arriba de las opciones, «Crear «X»»."""
    return ('<div class="e11b-lista" role="menu"><span class="bus" role="searchbox" aria-label="Buscar">' + buscado + "</span>"
            + "".join(f'<span class="op{" h" if h else ""}" role="menuitem">{o}</span>' for o, h in ops) + "</div>")


def lista_busca(buscado, ops):
    """SearchSelect abierto en la compu: el buscador con la lupa arriba y las opciones; «Crear «X»» al final."""
    return ('<div class="e11b-lista e11b-ss" role="listbox"><span class="bus" role="searchbox" aria-label="Buscar">' + LUPA + buscado + "</span>"
            + "".join(f'<span class="op{" on" if on else ""}" role="option" aria-selected="{"true" if on else "false"}">{o}'
                      + (f'<span class="tilde">{TILDE}</span>' if on else "") + "</span>" for o, on in ops) + "</div>")


def hoja_busca(titulo, buscado, ops):
    """SearchSelect en el teléfono: una hoja con el rótulo del campo de título, el buscador y filas de 52."""
    filas = "".join(f'<div class="ap-op" role="option" aria-selected="{"true" if on else "false"}">{o}' + (f'<span class="tilde">{TILDE}</span>' if on else "")
                    + "</div>" for o, on in ops)
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="{titulo}"><span class="asa"></span><div class="hc"><h2>{titulo}</h2>'
            f'<button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR_TEL}</button></div>'
            f'<div class="e11b-bus-tel" role="searchbox" aria-label="Buscar">{LUPA_TEL}{buscado}</div><div class="hb">{filas}</div></div>')


def encima_de(t, var_):
    """Lo que se abre encima en el estado `var_` (el segundo bloque, el de los diálogos)."""
    a, b = bloques(t, var_)[1]
    return t[a:b][t[a:b].index(">") + 1:-len("</sc-if>")]


def contenido_de(t, var_):
    a, b = bloques(t, var_)[0]
    return t[a:b]


def ya(t):
    return MARCA in t


def tocar(nombre, cambiar, css):
    """Aplica el formato de los teléfonos siempre y, si el tablero no tiene la marca, `cambiar` y la marca con su estilo."""
    t = leer(nombre)
    n = tel_nacional(t)
    if not ya(n):
        n = marcar(cambiar(n), MARCA, css)
    if n != t:
        escribir(nombre, n)


# ---------------------------------------------------------------- estilos

CSS_B = """.e11b-mn { position: absolute; z-index: 6; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); overflow: hidden; min-width: 210px; display: flex; flex-direction: column; font-size: 13px; color: var(--t1); }
.e11b-mn .it { display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 0 14px; white-space: nowrap; }
.e11b-mn .it svg { color: var(--t3); flex-shrink: 0; }
.e11b-mn .it.pel, .e11b-mn .it.pel svg { color: oklch(0.52 0.19 25); }
.e11b-mn .it + .it { border-top: 1px solid var(--borde); }
.e11b-mn .sep { height: 6px; background: var(--s2); border-top: 1px solid var(--borde); }
.ib.e11b-on { background: var(--s2); color: var(--t1); box-shadow: inset 0 0 0 1px var(--borde); }
.e11b-err { font-size: 13px; color: var(--peligro); }
.w-cmp .ct.e11b-mal { border-color: var(--peligro); }
.w-cmp .ct.e11b-ph { color: var(--t3); }
.w-cmp .ct.e11b-gris { background: var(--s2); color: var(--t3); }
.e11b-vacio { padding: 32px 16px; text-align: center; font-size: 14px; font-weight: 600; color: var(--t1); }
.e11b-toast { position: absolute; z-index: 41; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 10px; padding: 12px 16px 12px 14px; max-width: 460px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); font-size: 13px; color: var(--t1); }
.e11b-toast .ok { color: oklch(0.55 0.13 155); display: inline-flex; }
.e11b-aviso-mal { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 8px; background: var(--peligro-t); color: oklch(0.45 0.17 25); font-size: 13px; line-height: 1.5; }
.e11b-aviso-mal svg { flex-shrink: 0; margin-top: 2px; width: 16px; height: 16px; }
.w-dlg:has(.e11b-abre) { overflow: visible; }
.w-dlg:has(.e11b-abre) .dc { border-radius: 12px 12px 0 0; }
.w-cmp.e11b-abre { position: relative; }
.w-cmp.e11b-abre .ct { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }
.e11b-lista { position: absolute; z-index: 3; left: 0; right: 0; top: calc(100% + 4px); background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.16); padding: 4px; display: flex; flex-direction: column; gap: 2px; }
.e11b-lista .bus { display: flex; align-items: center; gap: 8px; margin: 4px 4px 6px; height: 34px; box-sizing: border-box; border: 1px solid var(--marca); border-radius: 8px; background: #fff; padding: 0 10px; font-size: 13px; color: var(--t1); }
.e11b-lista.e11b-ss .bus { height: 32px; background: var(--s2); border-color: var(--borde2); }
.e11b-lista .bus svg { color: var(--t3); flex-shrink: 0; }
.e11b-lista .op { display: flex; align-items: center; gap: 10px; box-sizing: border-box; min-height: 34px; padding: 6px 10px; border-radius: 6px; font-size: 13px; color: var(--t1); }
.e11b-lista .op.h { background: var(--s2); }
.e11b-lista .op.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 500; }
.e11b-lista .op .tilde { margin-left: auto; display: inline-flex; }
.e11b-lista .op .tilde svg { width: 16px; height: 16px; }
.cb.e11b-apag { opacity: 0.5; cursor: default; }
.e11-seg span.e11b-off { opacity: 0.5; }
"""
CSS_B_TEL = """.ap-acciones { display: flex; flex-direction: column; margin: -8px -20px 0; }
.ap-acciones span { display: flex; align-items: center; min-height: 54px; padding: 0 20px; font-size: 16.5px; border-top: 1px solid var(--borde); }
.ap-acciones span:first-child { border-top: 0; }
.ap-acciones .sep { min-height: 8px; padding: 0; background: var(--s2); }
.ap-acciones .pel { color: var(--peligro); }
.ap-cmp .e11b-err { font-size: 13.5px; color: var(--peligro); }
.ap-cmp .ct.e11b-mal { border-color: var(--peligro); }
.ap-cmp .ct.e11b-ph { color: var(--t3); }
.e11b-vacio { margin: 16px; padding: 32px 16px; border: 1px dashed var(--borde2); border-radius: 12px; text-align: center; font-size: 15px; font-weight: 600; color: var(--t1); }
.e11b-snack { position: absolute; z-index: 5; left: 12px; right: 12px; bottom: 96px; display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 14px; background: oklch(0.27 0.012 60); color: #fff; font-size: 14.5px; line-height: 1.4; box-shadow: 0 8px 24px oklch(0.2 0.01 60 / 0.3); }
.e11b-snack .tx { flex: 1; min-width: 0; }
.e11b-snack .ok { color: oklch(0.78 0.14 155); display: inline-flex; }
.e11b-aviso-mal { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px; background: var(--peligro-t); color: oklch(0.45 0.17 25); font-size: 14.5px; line-height: 1.4; }
.e11b-aviso-mal svg { flex-shrink: 0; margin-top: 1px; width: 16px; height: 16px; }
.ap-hoja.e11b-alta { top: 44px; }
.ap-hoja.e11b-alta .hb { flex: 1; min-height: 0; overflow: hidden; }
.ap-hoja.e11b-alta .hb.e11b-abajo { justify-content: flex-end; }
.ap-cmp.e11b-abre { position: relative; }
.ap-cmp.e11b-abre .ct { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }
.e11b-lista { position: absolute; z-index: 3; left: 0; right: 0; top: calc(100% + 4px); background: #fff; border: 1px solid var(--borde); border-radius: 12px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.18); padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.e11b-lista .bus { display: flex; align-items: center; margin: 2px 2px 6px; height: 44px; box-sizing: border-box; border: 1px solid var(--marca); border-radius: 10px; padding: 0 12px; font-size: 16px; color: var(--t1); }
.e11b-lista .op { display: flex; align-items: center; box-sizing: border-box; min-height: 48px; padding: 0 12px; border-radius: 8px; font-size: 16px; color: var(--t1); }
.e11b-lista .op.h { background: var(--s2); }
.e11b-bus-tel { display: flex; align-items: center; gap: 10px; margin: 4px 20px 2px; height: 44px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 12px; background: var(--s2); padding: 0 14px; font-size: 16px; color: var(--t1); }
.e11b-bus-tel svg { color: var(--t3); flex-shrink: 0; }
.ap-hoja .hb:has(> .ap-op) { gap: 0; padding-bottom: 34px; }
.ap-op { display: flex; align-items: center; gap: 12px; min-height: 52px; font-size: 16px; color: var(--t1); border-bottom: 1px solid var(--borde); }
.ap-op:last-child { border-bottom: 0; }
.ap-op[aria-selected="true"] { color: var(--marca-tx); font-weight: 500; }
.ap-op .tilde { margin-left: auto; display: inline-flex; color: var(--marca-tx); }
.cb.e11b-apag { opacity: 0.5; }
.e11-seg span.e11b-off { opacity: 0.5; }
.e11-seg.e11b-cuatro span { line-height: 1.15; text-align: center; padding: 0 4px; font-size: 13.5px; }
.ap-it.e11b-apag b, .ap-it.e11b-apag .tx > span { color: var(--t3); }
"""


# ---------------------------------------------------------------- Plantillas

PEDIDO = "Hola {}, tu pedido {} está listo. Podés retirarlo en el local de 9 a 18."
CHIPS_ORIG = 'Hola <span class="o-var">nombre</span>, tu pedido <span class="o-var">número de pedido</span> está listo. Podés retirarlo en el local de 9 a 18.'
CHIPS_ORIG_TEL = CHIPS_ORIG.replace("o-var", "ap-var")


def datos_plantilla(filas, tel=False):
    """«Dato n» y «Ejemplo del dato n» por cada {{n}} del texto: [(n, nombre, ejemplo, error_nombre, error_ejemplo)]."""
    h = ""
    for n, nombre, ejemplo, err_n, err_e in filas:
        if tel:
            h += cmp_tel(f"Dato {n}", nombre, err=err_n) + cmp_tel(f"Ejemplo del dato {n}", ejemplo, err=err_e)
        else:
            h += cmp(f"Dato {n}", nombre, err=err_n) + cmp(f"Ejemplo del dato {n}", ejemplo, err=err_e)
    return h


SIN_NOMBRE_DATO = "Escribí cómo se llama este dato."
SIN_EJEMPLO = "Escribí un ejemplo: Meta lo pide para revisarla."
NUMERAR = "Numerá los datos desde el 1 y sin saltear ninguno."
BASE_DATOS = [(1, "nombre", "", "", ""), (2, "número de pedido", "", "", "")]


def plantilla_nueva_compu(t):
    t = estados_compu(t, "Nueva plantilla")
    # La app: el texto con {{1}}, {{2}} como los numera Meta y, por cada dato, cómo se llama y un ejemplo (galería: «Nueva plantilla»).
    t = rep(t, CHIPS_ORIG, PEDIDO.format(var(1), var(2)))
    datos = div_en(t, '<div class="o-datos">')
    texto = '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Texto' + RQ + '</span>'
    i = t.index(texto)
    fin = cierre_div(t, i)
    t = t[:fin] + datos_plantilla(BASE_DATOS) + t[fin:]
    enc = encima_de(t, "e0")
    nombre = '<div class="w-cmp"><span class="rt">Nombre' + RQ + '</span><div class="ct">Pedido listo</div></div>'
    bloque_datos = datos_plantilla(BASE_DATOS)
    faltan = [(1, "nombre", "", "", SIN_EJEMPLO), (2, "", "", SIN_NOMBRE_DATO, SIN_EJEMPLO)]
    t = sumar_estado(t, "Faltan datos", encima=enc.replace(bloque_datos, datos_plantilla(faltan)))
    salteados = (enc.replace(PEDIDO.format(var(1), var(2)), PEDIDO.format(var(1), var(3)))
                 .replace('<div class="ct area">', '<div class="ct area e11b-mal">', 1)
                 .replace(datos, f'<span class="e11b-err" role="alert">{NUMERAR}</span>' + datos)
                 .replace(bloque_datos, datos_plantilla([(1, "nombre", "Martina", "", ""), (3, "número de pedido", "1038", "", "")])))
    t = sumar_estado(t, "Datos salteados", encima=salteados)
    texto_vacio = (enc.replace(nombre, cmp("Nombre", "", err="Escribí el nombre de la plantilla."))
                   .replace('<div class="ct area">' + PEDIDO.format(var(1), var(2)) + "</div>",
                            '<div class="ct area e11b-mal"></div><span class="e11b-err" role="alert">Escribí el texto de la plantilla.</span>')
                   .replace(bloque_datos, ""))
    t = sumar_estado(t, "Sin nombre ni texto", encima=texto_vacio)
    # Duplicar (decisión del 14/10): el formulario nuevo con lo de la original, el nombre con «_2» y los ejemplos copiados.
    duplicada = (enc.replace(nombre, nombre.replace("Pedido listo", "Pedido listo_2"))
                 .replace(bloque_datos, datos_plantilla([(1, "nombre", "Martina", "", ""), (2, "número de pedido", "1038", "", "")])))
    return sumar_estado(t, "Duplicada: «Pedido listo_2»", encima=duplicada)


def plantilla_nueva_tel(t):
    t = con_estados_pantalla(t, "Nueva plantilla")
    t = rep(t, CHIPS_ORIG_TEL, PEDIDO.format(var(1), var(2)))
    chips = div_en(t, '<div class="ap-chips2">')
    t = rep(t, chips, chips + datos_plantilla(BASE_DATOS, tel=True))
    t = rep(t, '<div class="ap-hoja" role="dialog" aria-label="Nueva plantilla">', '<div class="ap-hoja e11b-alta" role="dialog" aria-label="Nueva plantilla">')
    bloque = datos_plantilla(BASE_DATOS, tel=True)
    nombre = '<div class="ap-cmp"><span class="rt"><span>Nombre <span class="rq">*</span></span></span><div class="ct">Pedido listo</div></div>'
    abajo = ('<div class="hb">', '<div class="hb e11b-abajo">')
    faltan = [(1, "nombre", "", "", SIN_EJEMPLO), (2, "", "", SIN_NOMBRE_DATO, SIN_EJEMPLO)]
    t = sumar_estado_tel(t, "Faltan datos", [(bloque, datos_plantilla(faltan, tel=True)), abajo])
    area = '<div class="ct area">' + PEDIDO.format(var(1), var(2)) + "</div>"
    t = sumar_estado_tel(t, "Datos salteados", [
        (area, '<div class="ct area e11b-mal">' + PEDIDO.format(var(1), var(3)) + "</div>"),
        (chips, f'<span class="e11b-err" role="alert" style="font-size: 13.5px; color: var(--peligro); margin-top: -6px;">{NUMERAR}</span>' + chips),
        (bloque, datos_plantilla([(1, "nombre", "Martina", "", ""), (3, "número de pedido", "1038", "", "")], tel=True))])
    t = sumar_estado_tel(t, "Sin nombre ni texto", [
        # Sin datos, la hoja vuelve a su alto justo.
        ('<div class="ap-hoja e11b-alta"', '<div class="ap-hoja"'),
        (nombre, cmp_tel("Nombre", "", err="Escribí el nombre de la plantilla.")),
        (area, '<div class="ct area e11b-mal"></div><span class="e11b-err" role="alert" style="font-size: 13.5px; color: var(--peligro); margin-top: -6px;">'
               "Escribí el texto de la plantilla.</span>"), (bloque, "")])
    return sumar_estado_tel(t, "Duplicada: «Pedido listo_2»", [
        (nombre, nombre.replace("Pedido listo", "Pedido listo_2")),
        (bloque, datos_plantilla([(1, "nombre", "Martina", "", ""), (2, "número de pedido", "1038", "", "")], tel=True))])


def plantillas_compu(t):
    boton = '<button type="button" class="ib" aria-label="Acciones de Pedido listo">'
    m = menu("Acciones de Pedido listo", [(COPIAR, "Duplicar", False), SEP, (BORRAR, "Borrar", True)], "top: 222px; right: 36px;")
    t = sumar_estado(t, "Menú de una plantilla", [(boton, boton.replace('class="ib"', 'class="ib e11b-on"'))], encima=m, tras="Lista")
    t = sumar_estado(t, "Borrar", encima=confirmar("¿Borrar «Pedido listo»?", "Borrar"), tras="Menú de una plantilla")
    pausada = [('<b>Recordatorio de turno</b><span>Español (Argentina)</span></span><span>Utilidad</span><span><span class="w-est ">Aprobada</span>',
                '<b>Recordatorio de turno</b><span>Español (Argentina)</span></span><span>Utilidad</span><span><span class="w-est off">Pausada</span>'),
               ("4 plantillas · 2 aprobadas", "4 plantillas · 1 aprobada")]
    t = sumar_estado(t, "Pausada", pausada, encima="", tras="Borrar")
    base = contenido_de(t, "e0")
    caja = div_en(base, '<div class="w-caja"><div class="w-th t">')
    cab = div_en(caja, '<div class="w-th t">')
    return sumar_estado(t, "Vacía", [(caja, '<div class="w-caja">' + cab + '<div class="e11b-vacio">Todavía no hay plantillas</div></div>'),
                                     ("4 plantillas · 2 aprobadas", "0 plantillas · 0 aprobadas")], encima="", tras="Pausada")


def plantillas_tel(t):
    # La app nombra el ⓘ como en la compu: «Por qué la rechazó Meta».
    t = t.replace('aria-label="Por qué la rechazaron"', 'aria-label="Por qué la rechazó Meta"')
    t = sumar_estado_tel(t, "Acciones de una plantilla", al_final=acciones_tel("Pedido listo", ["Duplicar"], ["Borrar"]), tras="Lista")
    t = sumar_estado_tel(t, "Borrar", al_final=confirmar_tel("¿Borrar «Pedido listo»?", "Borrar"), tras="Acciones de una plantilla")
    t = sumar_estado_tel(t, "Pausada", [('<span class="l2">Utilidad · Español (Argentina)</span><span class="l3"><span class="w-est ">Aprobada</span></span></div>'
                                         '<button type="button" class="ap-ib" aria-label="Acciones de Recordatorio de turno">',
                                         '<span class="l2">Utilidad · Español (Argentina)</span><span class="l3"><span class="w-est off">Pausada</span></span></div>'
                                         '<button type="button" class="ap-ib" aria-label="Acciones de Recordatorio de turno">')], tras="Borrar")
    cuerpo = div_en(contenido_de(t, "e0"), '<div class="ap-cuerpo">')
    return sumar_estado_tel(t, "Vacía", [(cuerpo, '<div class="ap-cuerpo"><div class="e11b-vacio">Todavía no hay plantillas</div></div>')], tras="Pausada")


def plataforma(t, tel):
    """Las del sistema son de solo lectura, sin ⋮; un idioma con otra categoría, con el nombre del catálogo (decisión del 14/10)."""
    for a, b in reversed(bloques(t, "e1")):
        trozo = t[a:b]
        if tel:
            trozo = re.sub(r'<button type="button" class="ap-ib" aria-label="Acciones de [^"]*">.*?</button>', "", trozo, flags=re.S)
        else:
            trozo = re.sub(r'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de [^"]*">.*?</button></span>',
                           "", trozo, flags=re.S)
        t = t[:a] + trozo + t[b:]
    assert "Utilidad en inglés" in t
    return t.replace("Utilidad en inglés", "Utilidad en Inglés (Estados Unidos)")


def elegir_plantilla(t):
    """Al elegir una plantilla solo aparecen las aprobadas (decisión del 14/10): las de la organización, «Pedido listo» y
    «Recordatorio de turno»."""
    t = re.sub(r'<div class="op apag"[^>]*>.*?</div>', "", t, flags=re.S)
    t = re.sub(r'<div class="ap-op apag"[^>]*>.*?</div>', "", t, flags=re.S)
    assert "Aviso de turno" not in t and "Oferta de octubre" not in t
    return t.replace("Seguimos tu pedido", "Recordatorio de turno")


def plantillas():
    tocar("WA-Plantillas", plantillas_compu, CSS_COMPU + CSS_B)
    tocar("M-WA-Plantillas", plantillas_tel, CSS_TEL + CSS_B_TEL)
    tocar("WA-Plantilla-Nueva", plantilla_nueva_compu, CSS_B)
    tocar("M-WA-Plantilla-Nueva", plantilla_nueva_tel, CSS_B_TEL)
    # «Utilidad en Inglés (Estados Unidos)» entra en una línea debajo de «Marketing»: la columna Tipo, un poco más ancha.
    tocar("Plat-WA-Plantillas", lambda t: plataforma(t, False), CSS_B + ".w-th.t, .w-tr.t { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.1fr) "
                                                                      "minmax(0, 0.9fr) 140px 48px; }\n.w-tr.t .dos span { white-space: nowrap; overflow: hidden; "
                                                                      "text-overflow: ellipsis; }\n")
    tocar("M-Plat-WA-Plantillas", lambda t: plataforma(t, True), CSS_B_TEL)
    tocar("WA-Chats-Plantilla", elegir_plantilla, CSS_B)
    tocar("M-WA-Chats-Plantilla", elegir_plantilla, CSS_B_TEL)


# ---------------------------------------------------------------- Contactos

# El origen y la fecha del consentimiento (galería de contactos: todos lo dijeron en el bot; Carla, con el botón de la difusión).
ORIGENES = {"Martina López": "Por el bot · 20/08/2026", "Federico Díaz": "Por el bot · 03/09/2026", "Javier Pereyra": "Por el bot · 11/07/2026",
            "Carla Ruiz": "Por la baja · 29/09/2026", "Laura Méndez": "Por el bot · 02/06/2026", "Sergio Gómez": "Por el bot · 25/09/2026",
            "Lucas Benítez": "Por el bot · 19/05/2026", "Valeria Sosa": "Por el bot · 30/05/2026"}
# Las tres difusiones que le llegaron a Martina López (galería: «Nuevos productos», «Precios de agosto» y «Bienvenida a mayoristas»).
DIFUSIONES_DE = [("Nuevos productos", "02/09/2026", "02/09", "", "Leído"), ("Precios de agosto", "04/08/2026", "04/08", "off", "Entregado"),
                 ("Bienvenida a mayoristas", "14/07/2026", "14/07", "", "Leído")]
PROMOS = ["Acepta", "No acepta", "Sin respuesta"]
CREAR_VIP = "Crear «VIP»"


def vinculado(t):
    # Contactos dice «Vinculado a su cuenta» y, en el teléfono, «Vinculado» (locales es/contacts.json).
    return t.replace("Vinculada a su cuenta", "Vinculado a su cuenta").replace(" · Vinculada<", " · Vinculado<")


def seg_baja(tel=False):
    """«Promociones» de alguien que se dio de baja: la cuarta opción, elegida y apagada (EditContactDialog)."""
    ops = "".join(f'<span role="radio" aria-checked="false">{o}</span>' for o in PROMOS)
    ops += '<span class="on e11b-off" role="radio" aria-checked="true" aria-disabled="true">Se dio de baja</span>'
    return f'<div class="e11-seg{" e11b-cuatro" if tel else ""}" role="radiogroup">{ops}</div>'


def lista_contactos(t):
    """La tabla de Contactos de la compu como la app: «Vinculado» y, en «Promociones», de dónde salió y cuándo."""
    t = vinculado(t)

    def con_origen(m):
        fila = m.group(0)
        for n, o in ORIGENES.items():
            if f">{n}<" in fila:
                return re.sub(r'<span><span class="w-est ?([^"]*)">([^<]*)</span></span>',
                              lambda k: f'<span class="dos"><span class="w-est {k.group(1)}" style="font-size: 13px; color: var(--t1);">{k.group(2)}</span>'
                                        f'<span>{o}</span></span>', fila, count=1)
        return fila

    t = re.sub(r'<div class="w-tr k">.*?</div>', con_origen, t, flags=re.S)
    n = t.count("Por el bot · ")
    assert n and n % 7 == 0, n
    return t


def sin_nombre_tel(t):
    """M-WA-Contactos: un contacto sin nombre lleva el teléfono en el círculo gris (ContactAvatar), no el logo de WhatsApp."""
    t, n = WA_AV.subn(f'<span class="w-av g">{TELEFONO}</span>', vinculado(t))
    assert n >= 1, n
    return t


def contactos_compu(t):
    t = estados_compu(lista_contactos(t), "Lista")
    boton = '<button type="button" class="ib" aria-label="Acciones de Martina López">'
    m = menu("Acciones de Martina López", [(OJO, "Ver ficha", False), (LAPIZ, "Editar contacto", False)], "top: 300px; right: 36px;")
    t = sumar_estado(t, "Menú de un contacto", [(boton, boton.replace('class="ib"', 'class="ib e11b-on"'))], encima=m)
    cuerpo = (campo("Nombre", "Carla Ruiz", select=False, ancho=False)
              + '<div class="w-cmp"><span class="rt">Teléfono</span><span class="e11-solo">011 15-5555-1146</span></div>'
              + cmp("Etiquetas", "Sin etiquetas", req=False, vacio=True, select=True, ancho=True)
              + '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Promociones</span>' + seg_baja() + "</div>")
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri e11b-apag" aria-disabled="true">Guardar cambios</button>'
    return sumar_estado(t, "Editar a quien se dio de baja", encima=dlg("Editar contacto", cuerpo, pie, chico=False, una=False))


def contacto_compu(t):
    t = vinculado(t)
    # La ficha en la compu no lleva ⋮: «Editar contacto» y «Abrir chat» van en la banda.
    t = re.sub(r'<div class="ac"><button type="button" class="ib" aria-label="Acciones de Martina López">.*?</button>', '<div class="ac">', t, flags=re.S)
    base = contenido_de(t, "e0")
    tabs = '<span class="on" role="tab">Conversaciones<span class="c">2</span></span><span role="tab">Difusiones<span class="c">3</span></span>'
    tabs_d = '<span role="tab">Conversaciones<span class="c">2</span></span><span class="on" role="tab">Difusiones<span class="c">{}</span></span>'
    caja = div_en(base, '<div class="w-caja"><div class="w-th h">')
    cab = '<div class="w-th e11b-d"><span>Difusión</span><span>Enviada</span><span>Estado</span></div>'
    filas = "".join(f'<div class="w-tr e11b-d"><span class="dos"><a href="WA-Difusion-Resultados.dc.html">{n}</a></span><span>{f}</span>'
                    f'<span><span class="w-est {c}">{e}</span></span></div>' for n, f, _, c, e in DIFUSIONES_DE)
    t = sumar_estado(t, "Difusiones", [(tabs, tabs_d.format(3)), (caja, '<div class="w-caja">' + cab + filas + "</div>")], encima="", tras="Ficha")
    t = sumar_estado(t, "Difusiones: vacía", [(tabs, tabs_d.format(0)), (caja, '<div class="w-caja">' + cab + '<div class="e11b-vacio">Todavía no le llegó ninguna difusión</div></div>')],
                     encima="", tras="Difusiones")
    # Crear «VIP» (D10, decisión del usuario): lo escrito que no existe se ofrece arriba de las opciones y queda elegido.
    enc = encima_de(t, "e1")
    etiquetas = campo("Etiquetas", "Mayorista", req=False)
    abierta = cmp("Etiquetas", "Mayorista", req=False, select=True, ancho=True, abre=lista_multi("VIP", [(CREAR_VIP, True)]))
    t = sumar_estado(t, "Crear «VIP»", encima=rep(enc, etiquetas, abierta), tras="Sin vínculo")
    return sumar_estado(t, "Etiqueta nueva elegida", encima=rep(enc, etiquetas, campo("Etiquetas", "Mayorista, VIP", req=False)), tras="Crear «VIP»")


def contacto_tel(t):
    t = vinculado(t)
    # M-WA-Contacto: la barra con el nombre de título y la línea de la ficha de subtítulo; el ⋮ con «Editar contacto».
    t, n = re.subn(r'<div class="tit"><h1></h1></div>(<button type="button" class="ap-ib" aria-label="Acciones de Martina López">.*?</button>)</div>'
                   r'<div class="ap-perfil"><span class="w-av">[^<]*</span><h2>([^<]*)</h2><p>(.*?)</p></div>',
                   lambda m: f'<div class="tit"><h1>{m.group(2)}</h1><span class="sub">{m.group(3).replace("<br>", " · ")}</span></div>{m.group(1)}</div>',
                   t, flags=re.S)
    assert n == 3, n
    t = sumar_estado_tel(t, "Menú", al_final='<div class="ap-menu" role="menu"><span role="menuitem">Editar contacto</span></div>', tras="Ficha")
    base = contenido_de(t, "e0")
    tabs = '<span class="on" role="tab">Conversaciones <span class="c">2</span></span><span role="tab">Difusiones <span class="c">3</span></span>'
    tabs_d = '<span role="tab">Conversaciones <span class="c">2</span></span><span class="on" role="tab">Difusiones <span class="c">{}</span></span>'
    cuerpo = div_en(base, '<div class="ap-cuerpo">')
    filas = "".join(f'<a class="ap-fila" href="M-WA-Difusion-Resultados.dc.html"><div class="tx"><span class="l1">{n}<span>{c}</span></span>'
                    f'<span class="l3"><span class="w-est {cl}">{e}</span></span></div></a>' for n, _, c, cl, e in DIFUSIONES_DE)
    t = sumar_estado_tel(t, "Difusiones", [(tabs, tabs_d.format(3)), (cuerpo, '<div class="ap-cuerpo">' + filas + "</div>")], tras="Menú")
    t = sumar_estado_tel(t, "Difusiones: vacía", [(tabs, tabs_d.format(0)),
                                                   (cuerpo, '<div class="ap-cuerpo"><div class="e11b-vacio">Todavía no le llegó ninguna difusión</div></div>')],
                         tras="Difusiones")
    pie = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Guardar</button>'
    fijos = (campo_tel("Nombre", "Martina López", select=False)
             + '<div class="ap-cmp"><span class="rt"><span>Teléfono</span></span><span class="e11-solo">011 15-5555-6203</span></div>')
    prom = '<div class="ap-cmp"><span class="rt"><span>Promociones</span></span>' + seg(PROMOS, "Acepta") + "</div>"
    abierta = cmp_tel("Etiquetas", "Mayorista", req=False, select=True, abre=lista_multi("VIP", [(CREAR_VIP, True)]))
    t = sumar_estado_tel(t, "Crear «VIP»", al_final=hoja("Editar contacto", fijos + abierta + prom, pie), tras="Sin vínculo")
    t = sumar_estado_tel(t, "Etiqueta nueva elegida", al_final=hoja("Editar contacto", fijos + campo_tel("Etiquetas", "Mayorista, VIP", req=False) + prom, pie),
                         tras="Crear «VIP»")
    baja = ('<div class="ap-cmp"><span class="rt"><span>Promociones</span></span>' + seg_baja(tel=True) + "</div>")
    pie_apag = '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri e11b-apag" aria-disabled="true">Guardar</button>'
    return sumar_estado_tel(t, "Editar a quien se dio de baja", [("Mayorista · Acepta promociones</span>", "Mayorista · Se dio de baja de las promociones</span>")],
                            al_final=hoja("Editar contacto", fijos + campo_tel("Etiquetas", "Mayorista", req=False) + baja, pie_apag), tras="Etiqueta nueva elegida")


ARCHIVO = '<div class="ct">clientes-mayoristas.xlsx<span style="color: var(--marca-tx); font-weight: 600;">Cambiar</span></div>'
ARCHIVO_TEL = '<div class="ct">clientes-mayoristas.xlsx<span style="color: var(--marca-tx); font-weight: 600; font-size: 15px;">Cambiar</span></div>'
SIN_ARCHIVO = "Elegí el archivo que querés importar."


def importar_compu(t):
    t = lista_contactos(t)
    enc = encima_de(t, "e0")
    sin = (rep(enc, ARCHIVO, '<div class="ct e11b-mal"><span style="color: var(--t3);">Ningún archivo elegido</span>'
                             '<span style="color: var(--marca-tx); font-weight: 600;">Elegir archivo</span></div>'
                             f'<span class="e11b-err" role="alert">{SIN_ARCHIVO}</span>')
           .replace('<span class="rt">Etiqueta para todos</span><div class="ct">Mayorista ', '<span class="rt">Etiqueta para todos</span><div class="ct">Sin etiqueta ')
           .replace(">Importar 48 contactos<", ">Importar contactos<"))
    t = sumar_estado(t, "Sin archivo", encima=sin, tras="Archivo elegido")
    etiqueta = div_en(enc, '<div class="w-cmp" style="grid-column: 1 / -1;"><span class="rt">Etiqueta para todos</span>')
    abierta = (etiqueta.replace('<div class="w-cmp" style=', '<div class="w-cmp e11b-abre" style=', 1)[:-len("</div>")]
               + lista_busca("VIP", [("Sin etiqueta", False), (CREAR_VIP, False)]) + "</div>")
    t = sumar_estado(t, "Crear «VIP»", encima=rep(enc, etiqueta, abierta), tras="Importado")
    return sumar_estado(t, "Etiqueta nueva elegida", encima=rep(enc, etiqueta, etiqueta.replace("Mayorista ", "VIP ")), tras="Crear «VIP»")


def importar_tel(t):
    t = sin_nombre_tel(t)
    h = div_en(contenido_de(t, "e0"), '<div class="ap-hoja"')
    sin = (rep(h, ARCHIVO_TEL, '<div class="ct e11b-mal"><span style="color: var(--t3);">Ningún archivo elegido</span>'
                               '<span style="color: var(--marca-tx); font-weight: 600; font-size: 15px;">Elegir archivo</span></div>'
                               f'<span class="e11b-err" role="alert">{SIN_ARCHIVO}</span>')
           .replace('<span>Etiqueta para todos</span></span><div class="ct">Mayorista<', '<span>Etiqueta para todos</span></span><div class="ct">Sin etiqueta<')
           .replace(">Importar 48 contactos<", ">Importar contactos<"))
    t = sumar_estado_tel(t, "Sin archivo", [(h, sin)], tras="Archivo elegido")
    t = sumar_estado_tel(t, "Crear «VIP»", [('<div class="ap-velo"></div>' + h,
                                                    hoja_busca("Etiqueta para todos", "VIP", [("Sin etiqueta", False), (CREAR_VIP, False)]))], tras="Importado")
    return sumar_estado_tel(t, "Etiqueta nueva elegida", [(h, h.replace('<span>Etiqueta para todos</span></span><div class="ct">Mayorista<',
                                                                          '<span>Etiqueta para todos</span></span><div class="ct">VIP<'))], tras="Crear «VIP»")


def contactos():
    tocar("WA-Contactos", contactos_compu, CSS_COMPU + CSS_FICHA + CSS_B)
    tocar("M-WA-Contactos", sin_nombre_tel, CSS_B_TEL)
    tocar("WA-Contacto", contacto_compu, CSS_B + ".w-th.e11b-d, .w-tr.e11b-d { grid-template-columns: minmax(0, 1fr) 160px 220px; }\n")
    tocar("M-WA-Contacto", contacto_tel, CSS_B_TEL)
    tocar("WA-Contactos-Importar", importar_compu, CSS_B)
    tocar("M-WA-Contactos-Importar", importar_tel, CSS_B_TEL)


# ---------------------------------------------------------------- Difusiones

VARIABLE = '<div class="w-cmp"><span class="rt">Nombre del cliente' + RQ + '</span><div class="ct">Martina</div></div>'
VARIABLE_TEL = '<div class="ap-cmp"><span class="rt"><span>Nombre del cliente <span class="rq">*</span></span></span><div class="ct">Martina</div></div>'
MANDAR = [("Plantilla", "Aviso de horario · Marketing"), ("Destinatarios", "312 contactos que aceptan promociones"), ("Cuándo", "Ahora"),
          ("Costo estimado", "US$ 19,28")]
SIN_VARIABLE = "Completá esta variable."


def nueva_difusion_compu(t):
    # La variable de la plantilla va después de «Plantilla» (galería: «Nombre del cliente», con «Martina»); «Fecha y hora» es obligatoria.
    plantilla = div_en(t, '<div class="w-cmp"><span class="rt">Plantilla')
    t = rep(t, plantilla, plantilla + VARIABLE, t.count(plantilla))
    t = t.replace('<span class="rt">Fecha y hora</span>', '<span class="rt">Fecha y hora' + RQ + "</span>")
    base = contenido_de(t, "e0")
    etiqueta = div_en(base, '<div class="w-cmp"><span class="rt">Etiqueta')
    fecha = div_en(base, '<div class="w-cmp"><span class="rt">Fecha y hora')
    ahora = [('<span class="on">Programar</span>', "<span>Programar</span>"), ("<span>Ahora</span>", '<span class="on">Ahora</span>'), (fecha, ""),
             ('<button type="button" class="cb cb-pri">Programar</button>', '<button type="button" class="cb cb-pri">Mandar</button>')]
    todos = [('<span>Todos los que aceptan</span><span class="on">Una etiqueta</span>', '<span class="on">Todos los que aceptan</span><span>Una etiqueta</span>'),
             (etiqueta, ""), ("<b>48 contactos</b>", "<b>312 contactos</b>"),
             ("Tienen la etiqueta «Mayorista» y aceptan promociones", "Aceptan promociones"), ("<b>US$ 2,97</b>", "<b>US$ 19,28</b>")]
    t = sumar_estado(t, "Mandar ahora", ahora + todos, encima="")
    t = sumar_estado(t, "Confirmar el envío", ahora + todos, encima=dlg("¿Mandar «Horario de fiestas»?", dg(MANDAR),
                     '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Mandar</button>', chico=False))
    t = sumar_estado(t, "Falta la variable", [(VARIABLE, cmp("Nombre del cliente", "", err=SIN_VARIABLE)),
                                              ("Hola Martina, te contamos", f"Hola {var(1)}, te contamos")], encima="")
    # Duplicar (decisión del 14/10): con los valores de las variables ya cargados; cuándo, se elige de nuevo.
    return sumar_estado(t, "Duplicada", ahora, encima="")


def nueva_difusion_tel(t):
    plantilla = div_en(t, '<div class="ap-cmp"><span class="rt"><span>Plantilla')
    t = rep(t, plantilla, plantilla + VARIABLE_TEL, t.count(plantilla))
    t = t.replace("<span>Fecha y hora</span>", '<span>Fecha y hora <span class="rq">*</span></span>')
    base = contenido_de(t, "e0")
    etiqueta = div_en(base, '<div class="ap-cmp"><span class="rt"><span>Etiqueta')
    fecha = div_en(base, '<div class="ap-cmp"><span class="rt"><span>Fecha y hora')
    ahora = [('<span class="on">Programar</span>', "<span>Programar</span>"), ("<span>Ahora</span>", '<span class="on">Ahora</span>'), (fecha, ""),
             ('<button type="button" class="cb cb-pri">Programar</button>', '<button type="button" class="cb cb-pri">Mandar</button>')]
    todos = [('<span>Los que aceptan</span><span class="on">Una etiqueta</span>', '<span class="on">Los que aceptan</span><span>Una etiqueta</span>'),
             (etiqueta, ""), ("<b>48 contactos · US$ 2,97</b>", "<b>312 contactos · US$ 19,28</b>")]
    t = sumar_estado_tel(t, "Mandar ahora", ahora + todos)
    t = sumar_estado_tel(t, "Confirmar el envío", ahora + todos, al_final=hoja("¿Mandar «Horario de fiestas»?", dg_tel(MANDAR),
                         '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Mandar</button>'))
    t = sumar_estado_tel(t, "Falta la variable", [(VARIABLE_TEL, cmp_tel("Nombre del cliente", "", err=SIN_VARIABLE)),
                                                  ("Hola Martina, te contamos", f"Hola {var(1)}, te contamos")])
    return sumar_estado_tel(t, "Duplicada", ahora)


def resultados_compu(t):
    # Una difusión enviada no tiene acciones en el ⋮ de la compu (Duplicar va en la banda): la app no lo dibuja.
    t, n = re.subn(r'<div class="ac"><button type="button" class="ib" aria-label="Más acciones">.*?</button>', '<div class="ac">', t, flags=re.S)
    assert n >= 1, n
    return t


def difusiones():
    tocar("WA-Difusion-Nueva", nueva_difusion_compu, CSS_B)
    tocar("M-WA-Difusion-Nueva", nueva_difusion_tel, CSS_B_TEL)
    tocar("WA-Difusion-Resultados", resultados_compu, CSS_B)
    # Las seis tarjetas se envuelven, como en la app (mínimo 84 de ancho, 58 de alto).
    tocar("M-WA-Difusion-Resultados", lambda t: t, CSS_B_TEL + ".ap-chips.e11-res { flex-wrap: wrap; }\n")


# ---------------------------------------------------------------- Cargar teléfonos

MAS_DE_200 = "\n".join(f"11 5555-{n:04d}" for n in range(4001, 4008)) + "\n…"
CANAL = "WhatsApp no puede mandar invitaciones ahora. Probá de nuevo en un rato."


def telefonos_compu(t):
    # La revisión es de solo lectura: sin ⋮ por fila (decisión 4).
    t = re.sub(r'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de [^"]*">.*?</button></span>', "", t, flags=re.S)
    t = t.replace('<span>Qué va a pasar</span><span class="sr">Acciones</span>', "<span>Qué va a pasar</span>")
    paso1 = contenido_de(t, "e1")
    empresa = div_en(paso1, '<div class="w-cmp"><span class="rt">Empresa')
    roles = div_en(paso1, '<div class="w-cmp"><span class="rt">Roles en la empresa')
    area = div_en(paso1, '<div class="ct area e11-alto">')
    sin_empresa = [(empresa, cmp("Empresa", "Ninguna", req=False, select=True)),
                   (roles, '<div class="w-cmp"><span class="rt">Roles en la empresa</span><div class="ct e11b-gris">Elegí primero la empresa ' + CHEV + "</div></div>"),
                   (area, '<div class="ct area e11-alto"></div>'), (">Revisar 6 teléfonos<", ">Revisar teléfonos<")]
    t = sumar_estado(t, "Paso 1: sin empresa", sin_empresa, base="e1", encima="", tras="Pegar o subir")
    vacio = sin_empresa[:2] + [(area, '<div class="ct area e11-alto e11b-mal"></div><span class="e11b-err" role="alert">Pegá o subí al menos un teléfono.</span>'),
                               (">Revisar 6 teléfonos<", ">Revisar teléfonos<")]
    t = sumar_estado(t, "Sin teléfonos", vacio, base="e1", encima="", tras="Paso 1: sin empresa")
    t = sumar_estado(t, "Más de 200", [(area, f'<div class="ct area e11-alto e11b-mal" style="overflow: hidden;">{MAS_DE_200}</div><span class="e11b-err" role="alert">'
                                              "Son 230 teléfonos: cargá hasta 200 por vez.</span>"), (">Revisar 6 teléfonos<", ">Revisar 230 teléfonos<")],
                     base="e1", encima="", tras="Sin teléfonos")
    cuerpo = '<div class="w-body" style="overflow: auto;">'
    return sumar_estado(t, "Canal no disponible", [(cuerpo, cuerpo + aviso_mal(CANAL))], encima="", tras="Revisar")


def telefonos_tel(t):
    paso1 = contenido_de(t, "e1")
    area = div_en(paso1, '<div class="ct area" style="white-space: pre-line; min-height: 190px;">')
    empresa = '<span class="tx"><b>Empresa</b><span>Delta S.A.</span></span>'
    roles = div_en(paso1, '<div class="ap-it "><span class="tx"><b>Roles en la empresa</b>')
    sin_empresa = [(empresa, '<span class="tx"><b>Empresa</b><span>Ninguna</span></span>'),
                   (roles, '<div class="ap-it e11b-apag" aria-disabled="true"><span class="tx"><b>Roles en la empresa</b><span>Elegí primero la empresa</span></span></div>'),
                   (area, '<div class="ct area" style="white-space: pre-line; min-height: 190px;"></div>'), (">Revisar 6 teléfonos<", ">Revisar teléfonos<")]
    t = sumar_estado_tel(t, "Paso 1: sin empresa", sin_empresa, base="e1", tras="Pegar o subir")
    err = '<span class="e11b-err" role="alert">{}</span>'
    vacio = sin_empresa[:2] + [(area, '<div class="ct area e11b-mal" style="white-space: pre-line; min-height: 190px;"></div>' + err.format("Pegá o subí al menos un teléfono.")),
                               (">Revisar 6 teléfonos<", ">Revisar teléfonos<")]
    t = sumar_estado_tel(t, "Sin teléfonos", vacio, base="e1", tras="Paso 1: sin empresa")
    t = sumar_estado_tel(t, "Más de 200", [(area, f'<div class="ct area e11b-mal" style="white-space: pre-line; min-height: 190px; max-height: 190px; overflow: hidden;">{MAS_DE_200}</div>'
                                                  + err.format("Son 230 teléfonos: cargá hasta 200 por vez.")), (">Revisar 6 teléfonos<", ">Revisar 230 teléfonos<")],
                         base="e1", tras="Sin teléfonos")
    cuerpo = '<div class="ap-cuerpo">'
    assert contenido_de(t, "e0").count(cuerpo) == 1
    return sumar_estado_tel(t, "Canal no disponible", [(cuerpo, cuerpo + '<div style="padding: 8px 16px 4px;">' + aviso_mal(CANAL, tel=True) + "</div>")], tras="Revisar")


def telefonos():
    tocar("WA-Telefonos", telefonos_compu, CSS_B + ".w-th.p, .w-tr.p { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr); }\n")
    tocar("M-WA-Telefonos", telefonos_tel, CSS_B_TEL)


# ---------------------------------------------------------------- Usuarios e invitación por teléfono

CARGADOS = "Vinculamos 2 teléfonos y mandamos 3 invitaciones."
WA_AV = re.compile(r'<span class="w-av g"><svg width="20" height="20"[^>]*><path d="M4 20l1\.3-4A8 8 0 1 1 8\.2 19z"/>.*?</svg></span>', flags=re.S)
INVITADO = "011 15-5555-8812"


def usuarios_compu(t):
    # Al confirmar «Cargar teléfonos», la app vuelve a Usuarios con el aviso (no hay pantalla de resultado).
    t = rep(t, "data-props='{\"$preview\":{\"width\":1440,\"height\":900}}'",
            "data-props='" + json.dumps({"estado": {"editor": "enum", "options": ["Lista", "Teléfonos cargados"], "default": "Lista", "section": "Estado"},
                                         "$preview": {"width": 1440, "height": 900}}, ensure_ascii=False, separators=(",", ":")) + "'")
    return rep(t, "this.state = { wa: false, adm: true, abierto: null, aviso: '',",
               f"this.state = {{ wa: false, adm: true, abierto: null, aviso: props.estado === 'Teléfonos cargados' ? '{CARGADOS}' : '',")


def usuarios_tel(t):
    # Una invitación por teléfono: en el círculo, el teléfono (la app pone «@», como a una por correo; queda anotado).
    t, n = WA_AV.subn(f'<span class="w-av g">{TELEFONO}</span>', t)
    assert n == 6, n
    return sumar_estado_tel(t, "Teléfonos cargados", al_final=snack_ok(CARGADOS))


def usuario_compu(t):
    # La ficha de una invitación por teléfono: el número de título y, en la banda, después del estado (CC25).
    t = rep(t, "  { id: 'u11', n: '', email: 'carla.bianchi@delta.ejemplo.com',",
            f"  {{ id: 'u12', n: '', email: '{INVITADO}', estado: 'invitado', vence: '20/10/2026', rolesOrg: [], empresas: [{{ c: 'c1', roles: ['Solo lectura'] }}] }},\n"
            "  { id: 'u11', n: '', email: 'carla.bianchi@delta.ejemplo.com',")
    t = rep(t, "'Sofía (invitación pendiente)': 'u6',", "'Sofía (invitación pendiente)': 'u6', 'Invitación por teléfono': 'u12',")
    return sumar_opcion(t, "Sofía (invitación pendiente)", "Invitación por teléfono", "usuario")


def usuario_tel(t):
    cab, cuerpo = t.split("</helmet>", 1)
    i = cuerpo.index('<div class="ap-est">')
    j = cuerpo.index('<sc-if value="{{e1}}"')
    pantalla = cuerpo[i:j]
    tel = rep(pantalla, "<h1>{{nombre}}</h1>", f"<h1>{INVITADO}</h1>")
    tel = rep(tel, '<span class="sub">tomas.acosta@delta.ejemplo.com</span>', f'<span class="sub">{INVITADO}</span>')
    tel = tel.replace("Acciones de {{nombre}}", f"Acciones de {INVITADO}")
    estado = div_en(tel, '<div class="ap-it "><span class="tx"><b>Estado</b>')
    tel = rep(tel, estado, '<div class="ap-it "><span class="tx"><b>Estado</b><span><span class="w-est e11b-pet">Invitación pendiente</span></span></span></div>')
    tel = tel.replace("{{rolEmpresa}}", "Solo lectura").replace("{{claseGuardar}}", "apag")
    cuerpo = (cuerpo[:i] + '<sc-if value="{{noTel}}" hint-placeholder-val="{{si}}">' + pantalla + "</sc-if>"
              + '<sc-if value="{{porTel}}" hint-placeholder-val="{{no}}">' + tel + "</sc-if>" + cuerpo[j:])
    t = cab + "</helmet>" + cuerpo
    t = sumar_opcion(t, "Roles en una empresa", "Invitación por teléfono")
    return rep(t, '      noErr: e !== "Error al guardar",\n',
               '      noErr: e !== "Error al guardar",\n      porTel: e === "Invitación por teléfono",\n      noTel: e !== "Invitación por teléfono",\n')


SIN_CODIGO = "Ahora no podemos mandarte el código por WhatsApp. Probá más tarde."


def invitacion(t, tel):
    # CC26 y ADR 0047: la invitación por teléfono nombra el número y ofrece el código por WhatsApp, que lleva a «Ingresá como
    # empresa» con ese número cargado; si el número de la plataforma no puede mandar códigos, lo dice y no ofrece el botón.
    datos = f"correo: '{INVITADO}', empresa: 'Delta S.A.', roles: 'Solo lectura'"
    t = rep(t, "  'Con la sesión de la misma persona':",
            f"  // Invitación por teléfono (CC26): igual sin cuenta o con cuenta y sin sesión.\n  'Por teléfono': {{ {datos}, modo: 'telefono' }},\n"
            f"  'Por teléfono: sin código': {{ {datos}, modo: 'telefonoSinCodigo' }},\n  'Con la sesión de la misma persona':")
    alerta = re.search(r'<div class="msj alerta" role="alert">(<svg.*?</svg>)', t, flags=re.S).group(1)
    destino = "M-Ingreso.dc.html" if tel else "Ingreso.dc.html"
    ingresar = re.search(r'<sc-if value="\{\{debeIngresar\}\}" hint-placeholder-val="\{\{no\}\}">.*?</sc-if>', t, flags=re.S).group(0)
    t = rep(t, ingresar, ingresar
            + f'\n          <sc-if value="{{{{porTelefono}}}}" hint-placeholder-val="{{{{no}}}}"><a class="b b-pri lg" href="{destino}">Entrar con código por WhatsApp</a></sc-if>'
            + f'\n          <sc-if value="{{{{sinCodigo}}}}" hint-placeholder-val="{{{{no}}}}"><div class="msj alerta" role="alert">{alerta}<span>{SIN_CODIGO}</span></div></sc-if>')
    t = rep(t, "      debeIngresar: e.modo === 'ingresar',\n",
            "      debeIngresar: e.modo === 'ingresar',\n      porTelefono: e.modo === 'telefono',\n      sinCodigo: e.modo === 'telefonoSinCodigo',\n")
    t = sumar_opcion(t, "Con cuenta y sin sesión", "Por teléfono")
    return sumar_opcion(t, "Por teléfono", "Por teléfono: sin código")


def usuarios():
    tocar("Usuarios", usuarios_compu, "")
    tocar("M-Usuarios", usuarios_tel, CSS_B_TEL)
    tocar("Usuario", usuario_compu, "")
    tocar("M-Usuario", usuario_tel, ".w-est.e11b-pet::before { background: var(--marca); }\n")
    tocar("Invitacion", lambda t: invitacion(t, False), "")
    tocar("M-Invitacion", lambda t: invitacion(t, True), "")


if __name__ == "__main__":
    plantillas()
    contactos()
    difusiones()
    telefonos()
    usuarios()
