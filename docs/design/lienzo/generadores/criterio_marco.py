"""Tablero «Criterio · Marco y pantallas» en la página «Criterio de diseño»."""
import json
import pathlib
import re

PROJ = pathlib.Path(__file__).resolve().parent.parent  # docs/design/lienzo: los tableros y canvas.json
ALTO = 3440
ARCHIVO = "Criterio-Marco.dc.html"
TITULO = "Criterio · Marco y pantallas"

botones = (PROJ / "Criterio-Botones.dc.html").read_text(encoding="utf-8")
head = botones.split("</helmet>", 1)[0].replace("<title>Criterio · Botones</title>", f"<title>{TITULO}</title>")
head = re.sub(r"(\.crit \{[^}]*min-height: )\d+px", lambda m: m.group(1) + f"{ALTO}px", head)

ARENA = "oklch(0.925 0.02 75)"
ARENA_B = "oklch(0.87 0.022 75)"
CAB = "oklch(0.945 0.018 76)"

CSS = f"""  <style data-criterio="marco">
.reglas2 {{ margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; color: var(--t2); font-size: 14px; }}
.reglas2 strong {{ color: var(--t1); font-weight: 600; }}
.reglas2.dos {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 40px; }}
.app {{ position: relative; display: flex; height: 600px; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; background: var(--fondo); font-size: 13px; }}
.app .sb {{ width: 232px; flex-shrink: 0; background: {ARENA}; border-right: 1px solid {ARENA_B}; display: flex; flex-direction: column; }}
.app .sb .mk {{ height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 14px; font-weight: 700; border-bottom: 1px solid {ARENA_B}; }}
.app .sb .br {{ width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, oklch(0.5 0.1 195), oklch(0.58 0.11 170)); }}
.app .sb .cx {{ padding: 12px 14px; line-height: 1.35; }}
.app .sb .cx b {{ display: block; }}
.app .sb .cx span {{ color: var(--t3); font-size: 12.5px; }}
.app .sb .ln {{ margin: 0 8px; height: 32px; display: flex; align-items: center; padding: 0 10px; border-radius: 8px; color: oklch(0.42 0.018 60); }}
.app .sb .ln.on {{ background: #fff; color: oklch(0.43 0.09 195); font-weight: 600; box-shadow: 0 0 0 1px var(--borde); }}
.app .sb .esp {{ flex: 1; }}
.app .sb .ab {{ border-top: 1px solid {ARENA_B}; padding: 8px 0; }}
.app .sb .us {{ border-top: 1px solid {ARENA_B}; display: flex; align-items: center; gap: 10px; padding: 10px 14px; }}
.av {{ width: 30px; height: 30px; border-radius: 50%; background: var(--marca); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }}
.app .co {{ flex: 1; display: flex; flex-direction: column; min-width: 0; }}
.app .tb {{ height: 52px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: {ARENA}; border-bottom: 1px solid {ARENA_B}; color: var(--t2); }}
.app .tb .um {{ display: inline-flex; align-items: center; gap: 8px; }}
.app .tb .um b {{ color: var(--t1); }}
.bnd {{ display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; box-sizing: border-box; padding: 10px 24px; background: #fff; border-bottom: 1px solid var(--borde); }}
.bnd .iz {{ display: flex; align-items: center; gap: 12px; min-width: 0; }}
.bnd .ic {{ width: 36px; height: 36px; border-radius: 10px; background: var(--marca-t); color: var(--marca-tx); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }}
.bnd .vol {{ width: 28px; height: 28px; box-sizing: border-box; border-radius: 7px; border: 1px solid var(--borde); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }}
.bnd h3 {{ margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.25; }}
.bnd .res {{ margin: 2px 0 0; font-size: 13px; color: var(--t2); display: flex; align-items: center; gap: 6px; }}
.bnd .res .ok::before {{ content: ""; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); margin-right: 6px; }}
.bnd .res .suc {{ color: oklch(0.5 0.12 70); font-weight: 500; }}
.bnd .ac {{ display: flex; align-items: center; gap: 8px; flex-shrink: 0; }}
.app .bd {{ padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }}
.caja {{ background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }}
.caja.fil {{ height: 60px; display: flex; align-items: center; gap: 10px; padding: 0 16px; }}
.bar {{ height: 36px; border-radius: 8px; background: var(--s2); border: 1px solid var(--borde); }}
.pi {{ height: 36px; width: 96px; border-radius: 999px; border: 1px solid var(--borde); }}
.caja .th {{ height: 40px; background: {CAB}; border-bottom: 1px solid oklch(0.89 0.02 76); }}
.caja .tr {{ height: 40px; border-bottom: 1px solid var(--borde); display: flex; align-items: center; gap: 24px; padding: 0 16px; }}
.caja .tr:nth-child(odd) {{ background: oklch(0.975 0.008 78); }}
.caja .tr span {{ height: 8px; border-radius: 4px; background: oklch(0.9 0.01 78); }}
.num {{ position: absolute; width: 26px; height: 26px; border-radius: 50%; background: var(--t1); color: #fff; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }}
.pila {{ display: flex; flex-direction: column; gap: 14px; }}
.pila .rotc {{ font-size: 13px; font-weight: 600; color: var(--t2); margin-bottom: -6px; }}
.marco1 {{ border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }}
.g3c {{ display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }}
.tipo {{ background: #fff; border: 1px solid var(--borde); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }}
.tipo strong {{ font-size: 15px; }}
.tipo p {{ margin: 0; color: var(--t2); font-size: 13.5px; }}
.mini {{ background: var(--fondo); border: 1px solid var(--borde); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; height: 230px; box-sizing: border-box; font-size: 11.5px; color: var(--t2); }}
.mini .b {{ background: #fff; border: 1px solid var(--borde); border-radius: 6px; height: 34px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; }}
.mini .b b {{ color: var(--t1); font-size: 12.5px; }}
.mini .bt {{ background: var(--marca); color: #fff; border-radius: 5px; padding: 2px 6px; font-size: 10.5px; }}
.mini .bs {{ border: 1px solid var(--borde2); border-radius: 5px; padding: 2px 6px; font-size: 10.5px; background: #fff; }}
.mini .c {{ background: #fff; border: 1px solid var(--borde); border-radius: 6px; }}
.mini .c .h {{ height: 16px; background: {CAB}; border-radius: 5px 5px 0 0; }}
.mini .c .r {{ height: 14px; border-top: 1px solid var(--borde); }}
.mini .tabs {{ display: flex; gap: 14px; border-bottom: 1px solid var(--borde); padding: 0 4px; }}
.mini .tabs span {{ padding: 4px 0; }}
.mini .tabs .on {{ color: var(--marca-tx); font-weight: 600; box-shadow: inset 0 -2px 0 var(--marca); }}
.mini .sec {{ font-weight: 600; color: var(--t1); border-bottom: 1px solid var(--borde); padding-bottom: 3px; }}
.mini .cam {{ height: 14px; border: 1px solid var(--borde2); border-radius: 4px; background: #fff; }}
.tabs2 {{ display: flex; gap: 28px; padding: 0 24px; background: #fff; border-bottom: 1px solid var(--borde); font-size: 14px; }}
.tabs2 span {{ height: 44px; display: inline-flex; align-items: center; gap: 6px; color: var(--t2); }}
.tabs2 span.on {{ color: var(--marca-tx); font-weight: 600; box-shadow: inset 0 -2px 0 var(--marca); }}
.tabs2 .n {{ color: var(--t3); font-weight: 400; }}
.tels {{ display: flex; gap: 40px; justify-content: center; }}
.tel {{ width: 390px; height: 700px; border: 1px solid var(--borde2); border-radius: 28px; overflow: hidden; background: var(--fondo); position: relative; font-size: 13px; display: flex; flex-direction: column; }}
.tel .tb {{ height: 52px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; background: {ARENA}; border-bottom: 1px solid {ARENA_B}; font-weight: 700; }}
.tel .bnd {{ padding: 10px 16px; }}
.tel .bnd h3 {{ font-size: 17px; }}
.tel .bd {{ padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }}
.tel .busq {{ height: 40px; border-radius: 8px; background: var(--s2); border: 1px solid var(--borde); display: flex; align-items: center; padding: 0 12px; color: var(--t3); }}
.tel .pills {{ display: flex; gap: 8px; }}
.tel .pills span {{ height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--borde); background: #fff; display: inline-flex; align-items: center; color: var(--t2); }}
.tel .lst {{ background: #fff; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }}
.tel .lst .h {{ height: 40px; background: {CAB}; border-bottom: 1px solid oklch(0.89 0.02 76); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-weight: 600; color: var(--t2); font-size: 13px; }}
.tel .lst .r {{ height: 48px; display: flex; align-items: center; gap: 10px; padding: 0 8px 0 16px; border-bottom: 1px solid var(--borde); }}
.tel .lst .r:nth-child(odd) {{ background: oklch(0.975 0.008 78); }}
.tel .lst .r .n {{ flex: 1; font-weight: 500; }}
.est {{ display: inline-flex; align-items: center; gap: 6px; }}
.est::before {{ content: ""; width: 8px; height: 8px; border-radius: 50%; background: oklch(0.6 0.13 155); }}
.est.pend::before {{ background: var(--marca); }}
.est.off::before {{ background: oklch(0.75 0.01 78); }}
.tel .oscuro {{ position: absolute; inset: 0; z-index: 1; background: oklch(0.3 0.014 78 / 0.5); }}
.tel .hoja {{ position: absolute; z-index: 2; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 16px 16px 0 0; display: flex; flex-direction: column; }}
.tel .hoja .hc {{ height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px 0 16px; background: {CAB}; border-bottom: 1px solid oklch(0.89 0.02 76); border-radius: 16px 16px 0 0; font-size: 15px; font-weight: 600; }}
.tel .campos {{ padding: 16px; display: flex; flex-direction: column; gap: 14px; }}
.cmp {{ display: flex; flex-direction: column; gap: 6px; }}
.cmp .rt {{ font-size: 12.5px; font-weight: 600; color: var(--t2); }}
.cmp .ct {{ height: 40px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }}
.tel .botones {{ display: flex; gap: 8px; padding: 12px 16px 20px; border-top: 1px solid var(--borde); }}
.tel .botones .cb {{ flex: 1; height: 44px; }}
.tel .fija {{ margin-top: auto; display: flex; gap: 8px; padding: 12px 16px 20px; border-top: 1px solid var(--borde); background: #fff; }}
.tel .fija .cb {{ flex: 1; height: 44px; }}
.rotel {{ text-align: center; margin-top: 10px; font-size: 13px; font-weight: 600; color: var(--t2); }}
  </style>"""


def svg(d, w=16, sw="1.75"):
    return f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'


GENTE = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>', 20)
PERSONA = svg('<circle cx="12" cy="8" r="3.75"/><path d="M5 20a7 7 0 0 1 14 0"/>', 20)
VOLVER = svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', 16, "2")
ABAJO = svg('<path d="m7 10 5 5 5-5"/>', 14, "2")
MAS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>'
KEBAB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>'
MENU = svg('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>', 20)
X = svg('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 16, "2")
MAS_KEBAB = f'<button type="button" class="ib" aria-label="Más acciones" style="border-color: var(--borde);">{KEBAB}</button>'

filas_tabla = "".join(f'<div class="tr"><span style="width: {a}px;"></span><span style="width: {b}px;"></span><span style="width: {c}px;"></span></div>'
                      for a, b, c in [(120, 220, 80), (100, 200, 70), (130, 240, 90), (110, 190, 80), (90, 230, 60), (120, 210, 90)])


# Teléfono como app (2026-10-03): las piezas salen del mismo marco que los teléfonos de WhatsApp.
import sys as _sys
_sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent / "telefonos_1004"))
from app_marco import ESTILO as AP_CSS, I as AP_I, estado as ap_estado, barra as ap_barra, nav as ap_nav, hoja as ap_hoja  # noqa: E402
from app_estilo import ESTILO_X as AP_CSS_X  # noqa: E402

_base = (pathlib.Path(__file__).resolve().parent / "telefonos_1004" / "base" / "telefono.dc.html").read_text(encoding="utf-8")
AP_BASE = "<style data-criterio=\"telefono-base\">\n" + "\n".join(re.findall(r"\.w-(?:conv|av|punto|est)[^{]*\{[^}]*\}", _base)) + """
.tel2 { width: 390px; height: 760px; border: 1px solid var(--borde2); border-radius: 28px; overflow: hidden; position: relative; background: #fff; }
.tel2 .ap { height: 760px; }
.tel2 .ap-fab { bottom: 110px; }
.tel2 h1, .tel2 h2 { border: 0 !important; padding: 0 !important; margin: 0 !important; }
</style>"""


def _acc(*claves):
    return "".join(f'<button type="button" class="ap-ib" aria-label="{e}">{AP_I[c]}</button>' for c, e in claves)


def _fila(ini, nombre, l2, l3, hora, sin=False):
    av = f'<span class="w-av{"" if ini else " g"}">{ini or AP_I["wa"]}</span>'
    return (f'<div class="w-conv">{av}<span class="tx"><span class="l1"><b>{nombre}</b><span>{hora}</span></span>'
            f'<span class="l2"><span>{l2}</span></span><span class="l3{" sin" if sin else ""}">{l3}</span></span></div>')


def _campo(rotulo, valor, flecha=False):
    f = ABAJO if flecha else ""
    return f'<div class="ap-cmp"><span class="rt"><span>{rotulo} <span class="rq">*</span></span></span><div class="ct">{valor}{f}</div></div>'


_CHATS = (_fila("ML", "Martina López", "2 cajas de tornillos. ¿Atienden hasta las 18?", "Ventas · Lucía Fernández", "10:42")
          + _fila("", "+54 9 351 555-0192", "Quiero hacer un pedido.", "Ventas · Sin tomar", "10:15", True)
          + _fila("FD", "Federico Díaz", "¿Siguen abiertos el sábado?", "Soporte · Sin tomar", "Ayer", True)
          + _fila("JP", "Javier Pereyra", "Perfecto, gracias.", "Soporte · Tomás Acosta", "Ayer"))
TEL_LISTA = (ap_estado() + ap_barra("Chats", "Grupo Delta", _acc(("lupa", "Buscar"), ("filtro", "Filtros")))
             + '<div class="ap-seg"><span class="on">Clientes <span class="c">5</span></span><span>Internos <span class="c">2</span></span></div>'
             + f'<div class="ap-cuerpo">{_CHATS}</div>' + ap_nav("chats"))
_CONT = (_fila("ML", "Martina López", "+54 9 11 5555-4521 · Vinculada", "Mayorista · Acepta", "Hoy")
         + _fila("FD", "Federico Díaz", "+54 9 11 5555-2087", "Minorista · No acepta", "Ayer")
         + _fila("CR", "Carla Ruiz", "+54 9 11 5555-1146", "Se dio de baja", "29/09"))
TEL_HOJA = (ap_estado() + ap_barra("Contactos", "Grupo Delta", _acc(("lupa", "Buscar")) + '<button type="button" class="ap-txt">Importar</button>')
            + f'<div class="ap-cuerpo">{_CONT}</div>' + ap_nav("contactos")
            + ap_hoja("Importar contactos", _campo("Archivo", "clientes-mayoristas.xlsx") + _campo("Etiqueta para todos", "Mayorista", True),
                      '<button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Importar 48 contactos</button>'))
TEL_TAREA = (ap_estado() + ap_barra("Nueva difusión", "Borrador", volver="#")
             + '<div class="ap-cuerpo" style="padding: 4px 20px 0; gap: 14px;">'
             + _campo("Nombre", "Horario de fiestas") + _campo("Plantilla", "Aviso de horario · Marketing", True)
             + '<div class="ap-cmp"><span class="rt"><span>Destinatarios <span class="rq">*</span></span></span><div class="ap-seg2"><span>Los que aceptan</span><span class="on">Una etiqueta</span></div></div>'
             + _campo("Etiqueta", "Mayorista", True) + "</div>"
             + '<div class="ap-fijo"><span class="costo"><b>48 contactos · US$ 2,97</b><span>Costo estimado</span></span><button type="button" class="cb cb-pri">Programar</button></div>')

BODY = f"""<div class="crit">
  <div>
    <h1>Marco y pantallas</h1>
    <p class="sub">Lo que es igual en todas las pantallas, los tres tipos de pantalla y cómo se ven en el teléfono.</p>
  </div>

  <section>
    <h2>El marco</h2>
    <div class="app" aria-label="Marco de la aplicación">
      <div class="sb">
        <div class="mk"><span class="br"></span>ArquitecturaBase</div>
        <div class="cx"><b>Grupo Delta</b><span>Organización</span></div>
        <span class="ln on">Inicio</span>
        <div class="esp"></div>
        <div class="ab"><span class="ln">Administración</span></div>
        <div class="us"><span class="av">L</span><span>Lucía Fernández</span></div>
      </div>
      <div class="co">
        <div class="tb"><span>Inicio / Gestión de usuarios / Usuarios</span><span class="um"><span class="av">L</span><b>Lucía Fernández</b>{ABAJO}</span></div>
        <div class="bnd"><div class="iz"><span class="ic">{GENTE}</span><div><h3>Usuarios</h3><p class="res">11 usuarios · 7 activos · 3 invitaciones</p></div></div><div class="ac"><button type="button" class="cb cb-pri">{MAS} Invitar usuario</button></div></div>
        <div class="bd">
          <div class="caja fil"><span class="bar" style="width: 320px;"></span><span class="pi"></span><span class="pi"></span></div>
          <div class="caja"><div class="th"></div>{filas_tabla}</div>
        </div>
      </div>
      <span class="num" style="left: 100px; top: 210px;">1</span>
      <span class="num" style="left: 520px; top: 13px;">2</span>
      <span class="num" style="left: 520px; top: 70px;">3</span>
      <span class="num" style="left: 760px; top: 140px;">4</span>
    </div>
    <ul class="reglas2 dos" style="margin-top: 14px;">
      <li><strong>1 · Menú lateral:</strong> arena, igual en los tres perfiles. Ver «Menús y desplegables».</li>
      <li><strong>2 · Barra de arriba:</strong> arena. Las migas a la izquierda y tu menú a la derecha. Nada más.</li>
      <li><strong>3 · Banda de la página:</strong> blanca. Ícono, título, resumen y las acciones de la página.</li>
      <li><strong>4 · Contenido:</strong> a todo el ancho, con 24 px de margen. Cada cosa en su caja: filtros por un lado, tabla por otro.</li>
    </ul>
  </section>

  <section>
    <h2>La banda de la página</h2>
    <div class="pila">
      <span class="rotc">Un listado</span>
      <div class="marco1"><div class="bnd"><div class="iz"><span class="ic">{GENTE}</span><div><h3>Usuarios</h3><p class="res">11 usuarios · 7 activos · 3 invitaciones</p></div></div><div class="ac"><button type="button" class="cb cb-pri">{MAS} Invitar usuario</button></div></div></div>
      <span class="rotc">La ficha de algo</span>
      <div class="marco1"><div class="bnd"><div class="iz"><span class="vol">{VOLVER}</span><div><h3>Delta S.A.</h3><p class="res"><span class="ok">Activa</span> · CUIT 30-71234567-8 · Buenos Aires (GMT−3)</p></div></div><div class="ac">{MAS_KEBAB}<button type="button" class="cb cb-sec">Editar empresa</button><button type="button" class="cb cb-pri">{MAS} Agregar miembro</button></div></div></div>
      <span class="rotc">Una edición</span>
      <div class="marco1"><div class="bnd"><div class="iz"><span class="ic">{PERSONA}</span><div><h3>Mi cuenta</h3><p class="res"><span class="suc">Cambios sin guardar</span></p></div></div><div class="ac"><button type="button" class="cb cb-sec">Descartar cambios</button><button type="button" class="cb cb-pri">Guardar cambios</button></div></div></div>
    </div>
    <ul class="reglas2 dos" style="margin-top: 14px;">
      <li><strong>El título solo,</strong> en negrita. Al lado del título no va nada.</li>
      <li><strong>La segunda línea</strong> lleva el resumen, el estado (punto y palabra) o «Cambios sin guardar».</li>
      <li><strong>En una ficha,</strong> el ‹ para volver va en lugar del ícono.</li>
      <li><strong>Las acciones, a la derecha:</strong> hasta tres a la vista, el resto en ⋮, y la principal al final.</li>
    </ul>
  </section>

  <section>
    <h2>Tres tipos de pantalla</h2>
    <div class="g3c">
      <div class="tipo">
        <div class="mini"><div class="b"><b>Usuarios</b><span class="bt">+ Invitar usuario</span></div><div class="c" style="height: 26px;"></div><div class="c" style="flex: 1;"><div class="h"></div><div class="r"></div><div class="r"></div><div class="r"></div><div class="r"></div><div class="r"></div></div></div>
        <strong>Listado</strong><p>Banda, filtros en su caja y la tabla con su paginado. Para ver muchas cosas y buscar.</p>
      </div>
      <div class="tipo">
        <div class="mini"><div class="b"><b>‹ Delta S.A.</b><span class="bt">+ Agregar miembro</span></div><div class="tabs"><span class="on">Miembros 6</span><span>Roles 3</span></div><div class="c" style="flex: 1;"><div class="h"></div><div class="r"></div><div class="r"></div><div class="r"></div><div class="r"></div></div></div>
        <strong>Ficha</strong><p>Una cosa con sus datos en la banda. Una pestaña por cada grupo de datos, aunque tenga una sola fila.</p>
      </div>
      <div class="tipo">
        <div class="mini"><div class="b"><b>Mi cuenta</b><span><span class="bs">Descartar</span> <span class="bt">Guardar cambios</span></span></div><div class="c" style="padding: 8px; display: flex; flex-direction: column; gap: 6px;"><span class="sec">Tus datos</span><span style="display: flex; gap: 6px;"><span class="cam" style="width: 90px;"></span><span class="cam" style="width: 64px;"></span><span class="cam" style="width: 64px;"></span></span></div><div class="c" style="flex: 1;"><div class="h"></div><div class="r"></div><div class="r"></div><div class="r"></div></div></div>
        <strong>Edición</strong><p>Un formulario con Guardar en la banda. Secciones con título, campos de su medida y listas en su caja.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Pestañas</h2>
    <div class="marco1">
      <div class="bnd"><div class="iz"><span class="vol">{VOLVER}</span><div><h3>Delta S.A.</h3><p class="res"><span class="ok">Activa</span> · CUIT 30-71234567-8 · Buenos Aires (GMT−3)</p></div></div><div class="ac">{MAS_KEBAB}<button type="button" class="cb cb-sec">Editar empresa</button><button type="button" class="cb cb-pri">{MAS} Agregar miembro</button></div></div>
      <div class="tabs2"><span class="on">Miembros <span class="n">6</span></span><span>Roles <span class="n">3</span></span></div>
    </div>
    <ul class="reglas2 dos" style="margin-top: 14px;">
      <li><strong>En una ficha, una por cada grupo de datos,</strong> aunque tenga una sola fila, como «Dominio verificado» en la ficha de una organización. También dos vistas del mismo contenido, como «Configuración» y «Recorrido» del bot.</li>
      <li><strong>La cantidad, en gris</strong> al lado del nombre. Sin etiqueta.</li>
      <li><strong>La acción de la banda cambia con la pestaña:</strong> «Agregar miembro» o «Crear rol».</li>
      <li><strong>Nunca una pestaña «Resumen»</strong> con rótulos y valores: los datos van en la banda.</li>
    </ul>
  </section>

  <section>
    <h2>En el teléfono: una app</h2>
    <div class="tels">
      <div><div class="tel2"><div class="ap">{TEL_LISTA}</div></div><p class="rotel">Lista: título en la barra, filas de borde a borde y la barra de abajo</p></div>
      <div><div class="tel2"><div class="ap">{TEL_HOJA}</div></div><p class="rotel">Diálogo: una hoja que sube desde abajo, con manija</p></div>
      <div><div class="tel2"><div class="ap">{TEL_TAREA}</div></div><p class="rotel">Tarea: ‹ arriba y la acción fija abajo, sin la barra de abajo</p></div>
    </div>
    <ul class="reglas2 dos" style="margin-top: 18px;">
      <li><strong>Arriba,</strong> la barra del teléfono y el título grande, con la organización debajo. Buscar y filtrar son íconos.</li>
      <li><strong>Abajo,</strong> hasta cuatro secciones y «Más», con tu inicial: perfiles, Administración, Mi cuenta y Salir.</li>
      <li><strong>Pantallas internas:</strong> ‹ y el título, con el camino debajo. Sin barra de abajo en un chat o si hay una acción fija abajo.</li>
      <li><strong>Listas de borde a borde,</strong> con filas de hasta tres líneas. El ⋮ va solo si la fila tiene acciones; si no, se toca la fila.</li>
      <li><strong>Lo que en la compu es un diálogo</strong> es una hoja desde abajo, con manija y botones de 48 px a lo ancho.</li>
      <li><strong>Crear algo nuevo</strong> es un «+» flotante abajo a la derecha, también con la lista vacía.</li>
      <li><strong>Los ajustes</strong> van en grupos blancos sobre fondo gris, con interruptores o una flecha.</li>
      <li><strong>Los botones del teléfono</strong> miden 44 a 50 px para tocarlos con el dedo.</li>
    </ul>
  </section>

  <section>
    <h2>Prohibido</h2>
    <ul class="prohibido">
      <li>Todo en una sola tarjeta: filtros y tabla, o varias secciones.</li>
      <li>Una caja a medio ancho con el resto vacío.</li>
      <li>Etiquetas al lado del título de la página.</li>
      <li>Textos de ayuda debajo del título.</li>
      <li>Una pestaña «Resumen».</li>
      <li>Más de tres botones a la vista en la banda.</li>
      <li>Una versión aparte de la pantalla para el teléfono, hecha a mano.</li>
      <li>La web achicada en el teléfono: la marca arriba, la banda con ícono y resumen, cajas con cabecera beige o el menú ☰. La excepción es el sitio público sin sesión, que es web: una columna y ☰.</li>
      <li>Scroll de costado en el teléfono.</li>
    </ul>
  </section>
</div>"""

SCRIPT = f"""<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":{ALTO}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{ si: true, no: false }};
  }}
}}
</script>"""

html = "\n".join([head, CSS, AP_CSS, AP_CSS_X, AP_BASE, "</helmet>", "", BODY, "</x-dc>", "", SCRIPT, "</body>", "</html>", ""])
(PROJ / ARCHIVO).write_text(html, encoding="utf-8")

ruta = PROJ / "canvas.json"
c = json.loads(ruta.read_text(encoding="utf-8"))
c["boards"][ARCHIVO] = {"x": 9120, "y": 260, "w": 1440, "h": ALTO, "title": TITULO, "page": "criterio"}
if ARCHIVO not in c["order"]:
    c["order"].append(ARCHIVO)
c["notes"]["t-criterio"]["maxW"] = 1440 * 7 + 80 * 6
ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(html))
