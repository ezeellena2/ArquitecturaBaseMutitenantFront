"""Las diferencias de los tableros que encontró la galería de la puerta de la base 2 (tanda 3B de Diseño, 2026-11-26; `ide.md` de
la puerta, «El tablero»). Manda la decisión que se cita y el tablero se corrige, en su lugar:

1. **La pieza para elegir (262)** en `Asistente-Config-Org` y `M-Asistente-Config-Org`: «Qué clave usa» deja el segmentado. Cerrada,
   es un campo con su flecha, como «Modelo» al lado; abierta, la lista de la pieza con la tilde a la izquierda (en el teléfono, a
   pantalla completa). Elegir sigue cambiando la clave, como hacía el segmentado. Estado nuevo: «Elegir qué clave usa». Lo mismo con
   «Esfuerzo» (Bajo, Medio y Alto) en `Plat-Asistente-Config` y `M-Plat-Asistente-Config`; estado nuevo: «Elegir el esfuerzo». No
   hay versiones `-Base2` de estos tableros. `Plat-Asistente-Config` pierde además un `</sc-if></div>` suelto que traía al final.
2. **«Ordenar por» arriba de cada lista del teléfono (264)**, a todo el ancho, como en `M-FRM-Formularios`: las doce listas de
   `M-Filas-Base2` (cada una con el orden con que abre en la app; estado nuevo «Ordenar por», su pantalla con «Columna» y «Orden»),
   `M-Usuarios-Base2`, `M-Cuentas-Base2`, los miembros de `M-Empresa-Base2`, `M-Auditoria-Plat-Base2` y
   `M-WA-Difusion-Resultados-Base2`. Las filas de ejemplo conservan su orden, como en los tableros aprobados.
3. **Los roles vienen del servidor (262):** la lista abierta lleva el buscador adentro, arriba, y la cantidad debajo, en
   `Usuarios-Base2`, `Usuario-Base2` y `Empresa-Base2`, y también en sus teléfonos (la pieza a pantalla completa de
   `M-Usuarios-Base2`, `M-Usuario-Base2` y `M-Empresa-Base2`).
4. **«Cancelar» junto a la principal, que va última** (README, lista de chequeo, 8): en la hoja «¿Reenviar la invitación…?» de
   `M-Usuarios-Base2`, `M-Usuario-Base2`, `M-Empresa-Base2`, `M-Cuentas-Base2` y `M-Cuenta-Plat-Base2`, «Reenviar» pasa al final.
5. **Con un solo grupo no va la barra de pestañas** (decisión del 2026-10-05): la invitación de un operador en `Cuenta-Plat-Base2`
   y `M-Cuenta-Plat-Base2` pierde la pestaña «Permisos 3»; queda la tabla de permisos.
6. **`Config-Plat-Base2` · «Sin permiso»:** sin `platform.settings.manage` no se lee la configuración, y la app muestra el 403. La
   página es la falta de permiso de Plataforma de `Config-Plat-Modulos` («No tenés permiso para ver esta página.» e «Ir al inicio»),
   con Sofía Medina, la operadora sin el permiso, en lugar de Martín Sosa, que lo tiene en los demás estados.
7. **`Rol-Base2` · «Crear un rol»:** sin «Vale en» no hay permisos, así que las áreas no se dibujan: la tabla dice «Elegí dónde vale
   el rol para ver sus permisos.», el aviso de `M-Rol-Base2`. `M-Rol-Base2` lo tenía, pero debajo de las áreas y con «Permisos» dos
   veces: quedan el título y el aviso.
8. **`WA-Config-Base2`:** las migas sin «Administración», como las demás pantallas de WhatsApp (`Inicio / WhatsApp / …`); «Otra
   persona cambió la configuración» con el valor que la persona cambió (120 días) y «Guardar cambios» prendido, porque apagado no
   hay qué guardar y el 409 no llega; y «3.650» con el separador de miles (`formatos.md`), también en `M-WA-Config-Base2`. Lo que
   sumó la E14 (la caja «Formularios») queda como está.

Cada tablero suma « · para aprobar» a su `<title>`. Cambia los tableros en su lugar; no corre dos veces (el bloque
`<style data-t3b="base2-dif">` lo frena). Al final corre `traspaso10_piezas_1004.py --tableros …` sobre los veintiún tableros,
que escala el CSS nuevo de la compu. Uso: `python base2_diferencias_1004.py`.
"""
import io
import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import base2_comun as b2  # noqa: E402
import e12_listado_1004 as e12l  # noqa: E402
import e14_listados_1004 as e14l  # noqa: E402
from e14_respuesta_config_1004 import bloque_e, en_cada_estado, estados_e, sumar_estados_e  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = '<style data-t3b="base2-dif">'
PARA_APROBAR = " · para aprobar"


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    s = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    return s.replace("\r\n", "\n"), nl


def escribir(nombre, s, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(s.replace("\n", nl))
    print("ok", nombre, len(s))


def una(t, viejo, nuevo, veces=1):
    assert t.count(viejo) == veces, (viejo[:140], t.count(viejo), veces)
    return t.replace(viejo, nuevo)


def con_css(t, css):
    assert MARCA not in t
    return una(t, "</helmet>", f"{MARCA}\n{css}</style>\n</helmet>")


def titulo(t):
    m = re.search(r"<title>(.*?)</title>", t)
    assert m and not m.group(1).endswith(PARA_APROBAR), m and m.group(1)
    return t[:m.end(1)] + PARA_APROBAR + t[m.end(1):]


def sumar_opcion(t, despues, nombre):
    """Suma un estado al enum del `data-props` de un tablero con lógica propia (los del asistente, v176), después de `despues`."""
    m = re.search(r"data-props='(\{.*?\})'", t)
    props = json.loads(m.group(1))
    ops = props["estado"]["options"]
    assert nombre not in ops
    ops.insert(ops.index(despues) + 1, nombre)
    texto = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto
    return t[:m.start(1)] + texto + t[m.end(1):]


def nombres_k(t):
    """Los nombres de los estados de un tablero de la base 2 en el orden de sus `eN` (la lista de `const k`)."""
    return json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(this\.props\.estado", t).group(1))


def en_estado(t, nombre, cambiar):
    """`cambiar(cuerpo)` en el `sc-if` del estado `nombre` de un tablero de la base 2."""
    k = nombres_k(t).index(nombre)
    i, j = estados_e(t)[k]
    assert t[i:].startswith(f'<sc-if value="{{{{e{k}}}}}"'), (nombre, t[i:i + 40])
    return t[:i] + cambiar(t[i:j]) + t[j:]


def svg_en(t, antes):
    """El primer `<svg>` que sigue a `antes`."""
    i = t.index(antes) + len(antes)
    assert t.startswith("<svg", i), t[i:i + 40]
    return t[i:t.index("</svg>", i) + 6]


# ---------------------------------------------------------------------------------------------------------------- 1 · la pieza en el asistente
# La lista abierta de la compu, de `base2_comun` (262): la de los menús, con la tilde a la izquierda.
CSS_LISTA_COMPU = "\n".join(l for l in b2.CSS_B2.splitlines()
                            if re.match(r"\.(b2-pkl|b2-op|b2-env)\b", l) or l.startswith(".w-caja:has(.b2-pkl)")) + "\n"
CSS_PIEZA_COMPU = """
/* Tanda 3B · la pieza para elegir (262) en lugar del segmentado: cerrada, el campo con su flecha, como «Modelo»; abierta, la lista
   de los menús, con la tilde a la izquierda. Las opciones son botones, para que elegir cambie lo elegido. */
""" + CSS_LISTA_COMPU + """button.b2-op { width: 100%; margin: 0; border: 0; border-top: 1px solid var(--borde); background: transparent; font: inherit; color: var(--t1); text-align: left; cursor: pointer; }
.w-cmp > .b2-env { width: 100%; }
.w-cmp > .b2-env > .as-btn { width: 100%; }
"""
CSS_PIEZA_TEL = """
/* Tanda 3B · la pieza para elegir (262) en lugar del segmentado: cerrada, el campo con su flecha, como «Modelo»; abierta, a
   pantalla completa, con el nombre del campo, la ✕ y renglones de 56 px. Elegir cierra y cambia lo elegido. */
.ap-cmp button.t3b-ct { width: 100%; background: #fff; font: inherit; font-size: 16px; color: var(--t1); text-align: left; cursor: pointer; }
.acc-pk { position: absolute; z-index: 70; top: 44px; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; background: #fff; }
.acc-pk .bar { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 0 8px 0 20px; border-bottom: 1px solid var(--borde); }
.acc-pk .bar h2 { flex: 1; margin: 0; font-size: 18px; font-weight: 700; color: var(--t1); }
.acc-pk .bar button { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--t1); }
.acc-pk .lst { flex: 1; overflow: hidden; }
.acc-pk .op { position: relative; display: flex; align-items: center; gap: 14px; min-height: 56px; padding: 8px 20px; border-bottom: 1px solid var(--borde); font-size: 16px; color: var(--t1); }
.acc-pk button.op { width: 100%; margin: 0; border: 0; border-bottom: 1px solid var(--borde); background: #fff; font: inherit; font-size: 16px; color: var(--t1); text-align: left; cursor: pointer; }
.acc-pk .op .n2 { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.acc-pk .op .mk { flex: none; display: inline-flex; width: 22px; justify-content: center; color: var(--marca-tx); }
.acc-pk .op .mk svg { width: 18px; height: 18px; }
"""


def op_compu(nombre, sel, act, elegir, tilde):
    """Una opción de la lista de la compu, con sus valores de la lógica del tablero; `tilde` es la variable que la marca elegida."""
    return (f'<button type="button" class="b2-op {act}" role="option" aria-selected="{sel}" onClick="{elegir}">'
            f'<span class="mk" aria-hidden="true">{tilde}</span><span class="tx"><span>{nombre}</span></span></button>')


def op_tel(nombre, sel, elegir, tilde):
    return (f'<button type="button" class="op" role="option" aria-selected="{sel}" onClick="{elegir}">'
            f'<span class="mk" aria-hidden="true">{tilde}</span><span class="n2"><span>{nombre}</span></span></button>')


def tilde_si(var, defecto):
    return f'<sc-if value="{{{{{var}}}}}" hint-placeholder-val="{{{{{defecto}}}}}">{b2.SVG_TILDE}</sc-if>'


def hoja_pieza(titulo_campo, cerrar, opciones):
    """La pieza abierta en el teléfono, a pantalla completa (262)."""
    return (f'<div class="acc-pk" role="dialog" aria-label="{titulo_campo}"><div class="bar"><h2>{titulo_campo}</h2>'
            f'<button type="button" aria-label="Cerrar" onClick="{cerrar}">{b2.SVG_X}</button></div>'
            f'<div class="lst" role="listbox" aria-label="{titulo_campo}">{"".join(opciones)}</div></div>')


SEG_CLAVE = ('<div class="as-seg" role="radiogroup" aria-label="Qué clave usa"><button type="button" role="radio" class="{{segPlat}}" '
             'onClick="{{usarPlat}}">La de la plataforma</button><button type="button" role="radio" class="{{segPropia}}" '
             'onClick="{{usarPropia}}">La nuestra</button></div>')
SEG_ESFUERZO = ('<div class="as-seg" role="radiogroup" aria-label="Esfuerzo"><button type="button" role="radio" class="{{efBajo}}" '
                'onClick="{{nada}}">Bajo</button><button type="button" role="radio" class="{{efMedio}}" onClick="{{nada}}">Medio</button>'
                '<button type="button" role="radio" class="{{efAlto}}" onClick="{{nada}}">Alto</button></div>')
ELEGIR_CLAVE = "Elegir qué clave usa"
ELEGIR_ESFUERZO = "Elegir el esfuerzo"

JS_CLAVE = """
  // Tanda 3B (262): «Qué clave usa» va en la pieza para elegir, cerrada o abierta, y no en un segmentado. Elegir cierra la lista y
  // cambia la clave, como hacía el segmentado.
  t3bClave(v) {
    const e = this.state.e ?? (this.props.estado ?? "Con la clave de la plataforma");
    const abierto = this.state.t3bClave ?? (e === '%s');
    const elegir = (usar) => () => { this.setState({ t3bClave: false }); usar(); };
    return {
      t3bAbiertoClave: abierto, t3bExpClave: abierto ? 'true' : 'false',
      t3bAlternarClave: () => this.setState({ t3bClave: !abierto }),
      t3bTextoClave: v.propia ? 'La nuestra' : 'La de la plataforma', t3bMalClave: v.sinDueno ? 'mal' : '',
      t3bSelPlat: v.propia ? 'false' : 'true', t3bSelPropia: v.propia ? 'true' : 'false',
      t3bActPlat: v.propia ? '' : 'act', t3bActPropia: v.propia ? 'act' : '',
      t3bElegirPlat: elegir(v.usarPlat), t3bElegirPropia: elegir(v.usarPropia),
    };
  }
""" % ELEGIR_CLAVE

JS_ESFUERZO = """
  // Tanda 3B (262): «Esfuerzo» va en la pieza para elegir, cerrada o abierta, y no en un segmentado.
  t3bEsfuerzo() {
    const e = this.state.e ?? (this.props.estado ?? "Configurada");
    const abierto = this.state.t3bEsf ?? (e === '%s');
    return {
      t3bAbiertoEsf: abierto, t3bExpEsf: abierto ? 'true' : 'false',
      t3bAlternarEsf: () => this.setState({ t3bEsf: !abierto }), t3bCerrarEsf: () => this.setState({ t3bEsf: false }),
    };
  }
""" % ELEGIR_ESFUERZO


def con_js_clave(t):
    viejo = "    return { ...a, ...this.tanda4(a) };\n  }\n"
    nuevo = ("    const v = { ...a, ...this.tanda4(a) };\n    return { ...v, ...this.t3bClave(v) };\n  }\n" + JS_CLAVE)
    return una(t, viejo, nuevo)


def con_js_esfuerzo(t):
    viejo = "    return { ...a, ...this.tanda4(a), ...this.pasos(a) };\n  }\n"
    nuevo = "    return { ...a, ...this.tanda4(a), ...this.pasos(a), ...this.t3bEsfuerzo() };\n  }\n" + JS_ESFUERZO
    return una(t, viejo, nuevo)


OPS_CLAVE_COMPU = [op_compu("La de la plataforma", "{{t3bSelPlat}}", "{{t3bActPlat}}", "{{t3bElegirPlat}}", tilde_si("noPropia", "si")),
                   op_compu("La nuestra", "{{t3bSelPropia}}", "{{t3bActPropia}}", "{{t3bElegirPropia}}", tilde_si("propia", "no"))]
OPS_CLAVE_TEL = [op_tel("La de la plataforma", "{{t3bSelPlat}}", "{{t3bElegirPlat}}", tilde_si("noPropia", "si")),
                 op_tel("La nuestra", "{{t3bSelPropia}}", "{{t3bElegirPropia}}", tilde_si("propia", "no"))]
ESFUERZOS = ["Bajo", "Medio", "Alto"]  # el de la plataforma es «Bajo», como dibujaba el segmentado
OPS_ESF_COMPU = [op_compu(n, "true" if n == "Bajo" else "false", "act" if n == "Bajo" else "", "{{t3bCerrarEsf}}",
                          b2.SVG_TILDE if n == "Bajo" else "") for n in ESFUERZOS]
OPS_ESF_TEL = [op_tel(n, "true" if n == "Bajo" else "false", "{{t3bCerrarEsf}}", b2.SVG_TILDE if n == "Bajo" else "") for n in ESFUERZOS]


def asistente_config_org():
    t, nl = leer("Asistente-Config-Org")
    t = titulo(con_css(t, CSS_PIEZA_COMPU))
    flecha = svg_en(t, "<span class=\"{{t4PhModelo}}\">{{textoModelo}}</span>")
    campo = ('<div class="b2-env"><button type="button" class="ct sel as-btn {{t3bMalClave}}" aria-haspopup="listbox" '
             'aria-expanded="{{t3bExpClave}}" aria-label="Qué clave usa" onClick="{{t3bAlternarClave}}"><span>{{t3bTextoClave}}</span>'
             f'{flecha}</button><sc-if value="{{{{t3bAbiertoClave}}}}" hint-placeholder-val="{{{{no}}}}"><div class="b2-pkl" role="listbox" '
             f'aria-label="Qué clave usa"><div class="ops">{"".join(OPS_CLAVE_COMPU)}</div></div></sc-if></div>')
    t = una(t, SEG_CLAVE, campo)
    t = con_js_clave(t)
    t = sumar_opcion(t, "Con la clave de la plataforma", ELEGIR_CLAVE)
    escribir("Asistente-Config-Org", t, nl)


def m_asistente_config_org():
    t, nl = leer("M-Asistente-Config-Org")
    t = titulo(con_css(t, CSS_PIEZA_TEL))
    flecha = svg_en(t, '<div class="ct sel">Claude Sonnet 5.5')
    campo = ('<button type="button" class="ct sel t3b-ct {{t3bMalClave}}" aria-haspopup="listbox" aria-expanded="{{t3bExpClave}}" '
             f'aria-label="Qué clave usa" onClick="{{{{t3bAlternarClave}}}}"><span>{{{{t3bTextoClave}}}}</span>{flecha}</button>')
    t = una(t, SEG_CLAVE, campo)
    hoja = hoja_pieza("Qué clave usa", "{{t3bAlternarClave}}", OPS_CLAVE_TEL)
    t = una(t, '<span class="ap-raya"></span>', f'<sc-if value="{{{{t3bAbiertoClave}}}}" hint-placeholder-val="{{{{no}}}}">{hoja}</sc-if>'
            '<span class="ap-raya"></span>')
    t = con_js_clave(t)
    t = sumar_opcion(t, "Con la clave de la plataforma", ELEGIR_CLAVE)
    escribir("M-Asistente-Config-Org", t, nl)


def plat_asistente_config():
    t, nl = leer("Plat-Asistente-Config")
    t = titulo(con_css(t, CSS_PIEZA_COMPU))
    flecha = svg_en(t, "<span>Claude Sonnet 5.5, Claude Haiku 5.5</span>")
    campo = ('<div class="b2-env"><button type="button" class="ct sel as-btn" aria-haspopup="listbox" aria-expanded="{{t3bExpEsf}}" '
             f'aria-label="Esfuerzo" onClick="{{{{t3bAlternarEsf}}}}"><span>Bajo</span>{flecha}</button>'
             '<sc-if value="{{t3bAbiertoEsf}}" hint-placeholder-val="{{no}}"><div class="b2-pkl" role="listbox" aria-label="Esfuerzo">'
             f'<div class="ops">{"".join(OPS_ESF_COMPU)}</div></div></sc-if></div>')
    t = una(t, SEG_ESFUERZO, campo)
    t = con_js_esfuerzo(t)
    t = sumar_opcion(t, "Elegir los modelos permitidos", ELEGIR_ESFUERZO)
    # El tablero publicado traía un `</sc-if></div>` de más al final del cuerpo, que no cierra nada (lo marca el chequeo de forma):
    # se va, sin cambiar lo que se ve.
    t = una(t, "</div></div></sc-if></div>\n</x-dc>", "</div></div>\n</x-dc>")
    escribir("Plat-Asistente-Config", t, nl)


def m_plat_asistente_config():
    t, nl = leer("M-Plat-Asistente-Config")
    t = titulo(con_css(t, CSS_PIEZA_TEL))
    flecha = svg_en(t, '<div class="ct sel">Claude Sonnet 5.5, Claude Haiku 5.5')
    campo = ('<button type="button" class="ct sel t3b-ct" aria-haspopup="listbox" aria-expanded="{{t3bExpEsf}}" aria-label="Esfuerzo" '
             f'onClick="{{{{t3bAlternarEsf}}}}"><span>Bajo</span>{flecha}</button>')
    t = una(t, SEG_ESFUERZO, campo)
    hoja = hoja_pieza("Esfuerzo", "{{t3bAlternarEsf}}", OPS_ESF_TEL)
    t = una(t, '<span class="ap-raya"></span>', f'<sc-if value="{{{{t3bAbiertoEsf}}}}" hint-placeholder-val="{{{{no}}}}">{hoja}</sc-if>'
            '<span class="ap-raya"></span>')
    t = con_js_esfuerzo(t)
    t = sumar_opcion(t, "Configurada", ELEGIR_ESFUERZO)
    escribir("M-Plat-Asistente-Config", t, nl)


# ---------------------------------------------------------------------------------------------------------------- 2 · «Ordenar por» en el teléfono
CSS_ORDEN_TEL = """
/* Tanda 3B · «Ordenar por» arriba de la lista, a todo el ancho, que abre su pantalla con «Columna» y «Orden» (264), como en
   M-FRM-Formularios. */
.b2-ordtel { flex-shrink: 0; padding: 4px 16px 8px; background: #fff; }
.b2-ordtel button { display: flex; width: 100%; height: 44px; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; padding: 0 14px; border: 1px solid var(--borde2); border-radius: 10px; background: #fff; color: var(--t1); font: inherit; font-size: 14px; text-align: left; }
.b2-ordtel button > svg { flex: none; color: var(--t2); }
.t10-fl .b2-ffc { padding: 0 16px; }
"""
# El orden con que abre cada lista en la app (`defaultSort` de su página; 264): la columna y el sentido con palabras.
ORDEN_FILAS = {
    "Roles": "Rol, de la A a la Z", "Empresas": "Empresa, de la A a la Z", "Organizaciones": "Organización, de la A a la Z",
    "Recuperaciones": "Fecha y hora, más reciente primero", "Auditoría de la organización": "Fecha y hora, más reciente primero",
    "Auditoría de Plataforma": "Fecha y hora, más reciente primero", "Contactos": "Contacto, de la A a la Z",
    "Difusiones": "Fecha, más reciente primero", "Equipos": "Equipo, de la A a la Z", "Plantillas": "Plantilla, de la A a la Z",
    "Documentos legales": "Documento, de la A a la Z", "Números de WhatsApp": "Número, de menor a mayor",
}


def con_ordenar(cuerpo, texto):
    """El botón «Ordenar por» antes de la lista (`ap-cuerpo`), si el cuerpo tiene una lista de tarjetas."""
    if 'class="b2-tj"' not in cuerpo:
        return cuerpo
    assert cuerpo.count('<div class="ap-cuerpo') == 1, cuerpo.count('<div class="ap-cuerpo')
    boton = f'<div class="b2-ordtel"><button type="button" aria-haspopup="dialog">Ordenar por: {texto} {b2.SVG_FLECHA}</button></div>'
    return cuerpo.replace('<div class="ap-cuerpo', boton + '<div class="ap-cuerpo', 1)


def m_filas():
    t, nl = leer("M-Filas-Base2")
    t = titulo(con_css(t, CSS_ORDEN_TEL))
    nombres = nombres_k(t)
    assert sorted(nombres) == sorted(ORDEN_FILAS), set(nombres) ^ set(ORDEN_FILAS)
    t = en_cada_estado(t, lambda k, cuerpo: con_ordenar(cuerpo, ORDEN_FILAS[nombres[k]]))
    assert t.count('class="b2-ordtel"') == 12
    # La pantalla «Ordenar por» de la primera lista, Roles (como el estado «Ordenar por» de M-FRM-Formularios).
    base = bloque_e(t, 0)
    a = base.index('<div class="ap-bar')
    z = base.rindex('<span class="ap-raya"></span>')
    volver = svg_en(base, 'aria-label="Volver" href="M-WA-Menu.dc.html">')
    pantalla = e14l.pantalla_ordenar(volver, "M-Filas-Base2", "Rol", "De la A a la Z")
    t = sumar_estados_e(t, "Roles", [("Ordenar por", base[:a] + pantalla + base[z:])])
    escribir("M-Filas-Base2", t, nl)


# ---------------------------------------------------------------------------------------------------------------- 3 y 4 · los roles y «Reenviar»
BUS_COMPU = f'<div class="bus">{b2.SVG_LUPA}<span class="ph">Buscar</span></div>'
BUS_TEL = f'<div class="bus">{b2.SVG_LUPA}Buscar</div>'


def cantidad(n):
    return f'<div class="cant" role="status">{n} opciones</div>'


def con_buscador_compu(t, n):
    """La lista de roles abierta de la compu, con el buscador y la cantidad (262: vienen del servidor)."""
    assert ".b2-pkl .bus {" in t and ".b2-pkl .cant {" in t
    viejo = '<div class="b2-pkl" role="listbox" aria-multiselectable="true"><div class="ops">'
    return una(t, viejo, '<div class="b2-pkl" role="listbox" aria-multiselectable="true">' + BUS_COMPU + cantidad(n) + '<div class="ops">')


def con_buscador_tel(t, campo, n):
    """La pieza a pantalla completa del teléfono, con el buscador y la cantidad debajo del nombre del campo (262)."""
    assert ".acc-pk .bus {" in t and ".acc-pk .cant {" in t
    ab = f'<div class="acc-pk" role="dialog" aria-label="{campo}"><div class="bar">'
    assert t.count(ab) == 1, (campo, t.count(ab))
    i = t.index(ab) + len(ab) - len('<div class="bar">')
    j = b2.fin_div(t, i)
    return t[:j] + BUS_TEL + cantidad(n) + t[j:]


HOJA_VIEJA = ('<div class="hp"><button type="button" class="cb cb-pri lleno">Reenviar</button>'
              '<button type="button" class="cb cb-sec">Cancelar</button></div>')
HOJA_NUEVA = ('<div class="hp"><button type="button" class="cb cb-sec">Cancelar</button>'
              '<button type="button" class="cb cb-pri lleno">Reenviar</button></div>')

COMENTARIO_ROLES = """
/* Tanda 3B · los roles vienen del servidor: la lista abierta lleva el buscador y la cantidad (262). */
"""
COMENTARIO_REENVIAR = """
/* Tanda 3B · «Cancelar» junto a la principal, que va última (lista de chequeo, 8). */
"""


def roles_compu(nombre, n):
    t, nl = leer(nombre)
    t = titulo(con_css(t, COMENTARIO_ROLES))
    escribir(nombre, con_buscador_compu(t, n), nl)


def lista_tel(nombre, orden, campo=None, n=None, reenviar=True):
    """Un teléfono con su lista: «Ordenar por» (264), el buscador de los roles (262) y «Reenviar» última."""
    t, nl = leer(nombre)
    css = (CSS_ORDEN_TEL if orden else "") + (COMENTARIO_ROLES if campo else "") + (COMENTARIO_REENVIAR if reenviar else "")
    t = titulo(con_css(t, css))
    if orden:
        if estados_e(t):
            t = en_cada_estado(t, lambda k, cuerpo: con_ordenar(cuerpo, orden))
        else:
            t = con_ordenar(t, orden)
        assert 'class="b2-ordtel"' in t
    if campo:
        t = con_buscador_tel(t, campo, n)
    if reenviar:
        t = una(t, HOJA_VIEJA, HOJA_NUEVA)
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- 5 · un solo grupo
def cuenta_plat():
    t, nl = leer("Cuenta-Plat-Base2")
    t = titulo(con_css(t, "\n/* Tanda 3B · con un solo grupo no va la barra de pestañas (decisión del 2026-10-05). */\n"))
    viejo = ('<div class="tabs2" role="tablist" aria-label="Secciones de la cuenta"><button type="button" role="tab" class="tab2" '
             'aria-selected="true">Permisos<span class="cnt">3</span></button></div>'
             '<div class="tarjeta" style="margin-top: 8.3px/*11.5px*/; padding: 0; border: 0;">')
    t = una(t, viejo, '<div class="tarjeta" style="padding: 0; border: 0;">', 5)
    escribir("Cuenta-Plat-Base2", t, nl)


def m_cuenta_plat():
    t, nl = leer("M-Cuenta-Plat-Base2")
    t = titulo(con_css(t, "\n/* Tanda 3B · con un solo grupo no va la barra de pestañas (decisión del 2026-10-05); «Cancelar» junto a la "
                          "principal, que va última. */\n"))
    t = una(t, '<div class="ap-tabs" role="tablist"><span class="on" role="tab">Permisos <span class="c">3</span></span></div>', "", 2)
    t = una(t, HOJA_VIEJA, HOJA_NUEVA)
    escribir("M-Cuenta-Plat-Base2", t, nl)


# ---------------------------------------------------------------------------------------------------------------- 6 · sin permiso
CANDADO = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
           'stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/>'
           '<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>')
CSS_403 = """
/* Tanda 3B · sin `platform.settings.manage` no se lee la configuración: la página es la falta de permiso de Plataforma, como en
   Config-Plat-Modulos, centrada en el alto de una pantalla. */
.ab-app-shell__main:has(> .t3b-403) { position: relative; }
.mod-centro { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
.mod-centro.t3b-403 { bottom: auto; height: 806px; }
.mod-centro .circ { display: inline-flex; width: 52px; height: 52px; align-items: center; justify-content: center; border-radius: 3px; background: var(--s2, oklch(0.965 0.012 95)); color: var(--t2); }
.mod-centro h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--t1); }
"""


def config_plat():
    t, nl = leer("Config-Plat-Base2")
    t = titulo(con_css(t, CSS_403))

    def sin_permiso(cuerpo):
        i = cuerpo.index('<main class="ab-app-shell__main">') + len('<main class="ab-app-shell__main">')
        j = cuerpo.index("</main>", i)
        centro = (f'\n      <div class="mod-centro t3b-403" role="alert"><span class="circ">{CANDADO}</span>'
                  '<h2>No tenés permiso para ver esta página.</h2><a class="b b-sec" href="Organizaciones.dc.html" '
                  'style="text-decoration: none;">Ir al inicio</a></div>\n    ')
        cuerpo = cuerpo[:i] + centro + cuerpo[j:]
        # Quien entra es Sofía Medina, la operadora sin el permiso (como en Config-Plat-Modulos).
        cuerpo = una(cuerpo, '<span class="avatar" aria-hidden="true">M</span>', '<span class="avatar" aria-hidden="true">S</span>', 2)
        cuerpo = una(cuerpo, "Martín Sosa", "Sofía Medina", 2)
        return una(cuerpo, "martin.sosa@arquitecturabase.ejemplo.com", "sofia.medina@arquitecturabase.ejemplo.com")

    t = en_estado(t, "Sin permiso", sin_permiso)
    assert t.count('id="f-Flow"') == 9, t.count('id="f-Flow"')  # la E14 en los demás estados
    escribir("Config-Plat-Base2", t, nl)


# ---------------------------------------------------------------------------------------------------------------- 7 · crear un rol
SIN_VALE = "Elegí dónde vale el rol para ver sus permisos."


def rol():
    t, nl = leer("Rol-Base2")
    t = titulo(con_css(t, "\n/* Tanda 3B · sin «Vale en» no hay permisos: la tabla lo dice, sin las áreas. */\n"))

    def crear(cuerpo):
        i = cuerpo.index('<div class="acc-perm" role="table" aria-label="Permisos">')
        j = b2.fin_div(cuerpo, i)
        assert 'aria-checked="true"' not in cuerpo[i:j]
        nuevo = ('<div class="acc-perm" role="table" aria-label="Permisos"><div class="ph" role="row"><span role="columnheader">Permiso</span>'
                 f'</div><div class="r212-vacio" role="row"><span role="cell">{SIN_VALE}</span></div></div>')
        return cuerpo[:i] + nuevo + cuerpo[j:]

    t = en_estado(t, "Crear un rol", crear)
    escribir("Rol-Base2", t, nl)


def m_rol():
    t, nl = leer("M-Rol-Base2")
    t = titulo(con_css(t, "\n/* Tanda 3B · sin «Vale en» no hay permisos: queda el aviso, sin las áreas. */\n"))
    titulo_permisos = '<span class="ap-gtit" style="margin: 6px 0px -6px;">Permisos</span>'

    def crear(cuerpo):
        assert cuerpo.count(titulo_permisos) == 2 and SIN_VALE in cuerpo
        i = cuerpo.index(titulo_permisos)
        k = i + len(titulo_permisos)
        assert cuerpo.startswith('<div class="acc-perm"', k)
        j = b2.fin_div(cuerpo, k)
        assert cuerpo.startswith(titulo_permisos + '<div class="ap-grupo ap-sin-vale"', j)
        return cuerpo[:i] + cuerpo[j:]

    t = en_estado(t, "Crear un rol", crear)
    escribir("M-Rol-Base2", t, nl)


# ---------------------------------------------------------------------------------------------------------------- 8 · la configuración de WhatsApp
MILES = [("De 1 a 3650 días, y hasta el máximo de la plataforma (3650).", "De 1 a 3.650 días, y hasta el máximo de la plataforma (3.650)."),
         ("Tiene que ser de 1 a 3650.", "Tiene que ser de 1 a 3.650."),
         ("Tiene que ser de 1 a 3650: es el máximo de la plataforma.", "Tiene que ser de 1 a 3.650: es el máximo de la plataforma.")]


def con_miles(t):
    for viejo, nuevo in MILES:
        t = t.replace(viejo, nuevo)
    cuerpo = t[t.index("</helmet>"):t.index("<script")]
    assert not re.search(r"(?<![\d.])3650(?!\d)", re.sub(r'value="\d+"', "", cuerpo)), "queda un 3650 sin separador"
    return t


def wa_config():
    t, nl = leer("WA-Config-Base2")
    t = titulo(con_css(t, "\n/* Tanda 3B · las migas de WhatsApp, el 409 con el cambio de la persona y los miles con separador. */\n"))
    t = una(t, "<span>Inicio / Administración / WhatsApp / Configuración</span>", "<span>Inicio / WhatsApp / Configuración</span>", 9)

    def conflicto(cuerpo):
        cuerpo = una(cuerpo, '<button type="button" class="cb cb-pri" disabled>Guardar cambios</button>',
                     '<button type="button" class="cb cb-pri">Guardar cambios</button>')
        return una(cuerpo, 'aria-label="Guardar los mensajes de los chats" value="90"', 'aria-label="Guardar los mensajes de los chats" value="120"')

    t = en_estado(t, "Otra persona cambió la configuración", conflicto)
    t = con_miles(t)
    assert t.count('aria-label="Tiempo para contestar un formulario"') == 9  # la E14
    escribir("WA-Config-Base2", t, nl)


def m_wa_config():
    t, nl = leer("M-WA-Config-Base2")
    t = titulo(con_css(t, "\n/* Tanda 3B · los miles con separador (formatos.md). */\n"))
    t = con_miles(t)
    escribir("M-WA-Config-Base2", t, nl)


# ---------------------------------------------------------------------------------------------------------------- todo
TABLEROS = [
    ("Asistente-Config-Org", asistente_config_org), ("M-Asistente-Config-Org", m_asistente_config_org),
    ("Plat-Asistente-Config", plat_asistente_config), ("M-Plat-Asistente-Config", m_plat_asistente_config),
    ("M-Filas-Base2", m_filas),
    ("M-Usuarios-Base2", lambda: lista_tel("M-Usuarios-Base2", "Usuario, de la A a la Z", "Roles de la organización", 6)),
    ("M-Cuentas-Base2", lambda: lista_tel("M-Cuentas-Base2", "Cuenta, de la A a la Z")),
    ("M-Empresa-Base2", lambda: lista_tel("M-Empresa-Base2", "Miembro, de la A a la Z", "Roles en la empresa", 3)),
    ("M-Usuario-Base2", lambda: lista_tel("M-Usuario-Base2", None, "Roles de la organización", 6)),
    ("M-Auditoria-Plat-Base2", lambda: lista_tel("M-Auditoria-Plat-Base2", "Fecha y hora, más reciente primero", reenviar=False)),
    ("M-WA-Difusion-Resultados-Base2",
     lambda: lista_tel("M-WA-Difusion-Resultados-Base2", "Último cambio, más reciente primero", reenviar=False)),
    ("Usuarios-Base2", lambda: roles_compu("Usuarios-Base2", 6)), ("Usuario-Base2", lambda: roles_compu("Usuario-Base2", 6)),
    ("Empresa-Base2", lambda: roles_compu("Empresa-Base2", 3)),
    ("Cuenta-Plat-Base2", cuenta_plat), ("M-Cuenta-Plat-Base2", m_cuenta_plat),
    ("Config-Plat-Base2", config_plat),
    ("Rol-Base2", rol), ("M-Rol-Base2", m_rol),
    ("WA-Config-Base2", wa_config), ("M-WA-Config-Base2", m_wa_config),
]

if __name__ == "__main__":
    hechos = []
    for nombre, hacer in TABLEROS:
        t, _ = leer(nombre)
        if MARCA in t:
            print(nombre, "ya tiene el bloque: no hace nada")
            continue
        hacer()
        hechos.append(nombre)
    if hechos:
        piezas = pathlib.Path(__file__).resolve().parent / "traspaso10_piezas_1004.py"
        subprocess.run([sys.executable, str(piezas), "--tableros", ",".join(hechos)], check=True)
