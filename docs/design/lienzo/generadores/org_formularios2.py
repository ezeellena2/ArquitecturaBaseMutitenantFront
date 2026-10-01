"""Usuario, Rol y Avisos (y Usuario y Rol en el teléfono) con el formato de formularios aprobado en Mi cuenta.
Rehace el dibujo y conserva la lógica que ya tenían (sus estados, sus Tweaks y sus recorridos), con cambios mínimos.
Uso: python org_formularios2.py"""
import json
import pathlib
import re
import shutil
import sys

sys.stdout.reconfigure(encoding="utf-8")
SCR = pathlib.Path(__file__).parent
fuente = (SCR / "whatsapp_tableros.py").read_text(encoding="utf-8")
g = {"__file__": __file__}  # el mismo directorio: las rutas de whatsapp_tableros.py se resuelven igual
exec(fuente[:fuente.index("TABLEROS = {}")], g)
CSS, I, KEBAB, MAS, svg, HEAD_BASE, PROJ = (g[k] for k in ("CSS", "I", "KEBAB", "MAS", "svg", "HEAD_BASE", "PROJ"))
perfil = (SCR / "perfil_tableros.py").read_text(encoding="utf-8")
CSS_P = perfil[perfil.index('CSS_P = """') + len('CSS_P = """'):perfil.index('</style>"""', perfil.index('CSS_P = """')) + len("</style>")]
org = (SCR / "org_formularios.py").read_text(encoding="utf-8")
CSS_O = org[org.index('CSS_O = """') + len('CSS_O = """'):org.index('</style>"""', org.index('CSS_O = """')) + len("</style>")]
sys.path.insert(0, str(SCR))
import conectar_paginas as cp  # noqa: E402  (menú de usuario y su estilo)

MARCA = " · para aprobar"
ORIG = SCR / "originales_conectar"

OK = '<span style="color: oklch(0.55 0.13 155); display: inline-flex;">' + svg('<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 18, "2") + '</span>'
MAL = '<span style="color: oklch(0.55 0.2 25); display: inline-flex;">' + svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5"/><path d="M12 16.2h.01"/>', 18, "2") + '</span>'
TRI = svg('<path d="M12 4 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>', 18, "2")
INFO = I["info"]
NUBE = svg('<path d="M3 3l18 18"/><path d="M8.5 8.5A5 5 0 0 0 7 18h10"/><path d="M12 6a5 5 0 0 1 5 5 4 4 0 0 1 3 6"/>', 18, "2")
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "2.5")
TACHO = svg('<path d="M5 7h14"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6.5 7l1 12.5h9l1-12.5"/><path d="M9.5 7V4.5h5V7"/>', 16)
GLOBO = I["mundo"].replace('width="18" height="18"', 'width="16" height="16"')
PERSONAS = svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5A5.5 5.5 0 0 1 20.5 19"/>', 20)
NO_ENCONTRADA = svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 3.5 3.5"/><path d="M9 9l4 4"/><path d="M13 9l-4 4"/>', 26)

CSS_F = """<style data-propuesta="org-formularios-2">
/* Desplegables del criterio: el control se ve como un campo y la lista se abre debajo. */
.w-caja.o-abre { overflow: visible; }
.w-caja.o-abre > .w-cab { border-radius: 11px 11px 0 0; }
.o-dd { position: relative; min-width: 0; }
.o-dd > button.ct, input.ct, textarea.ct { height: 36px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; }
textarea.ct.area { height: 84px; padding-top: 9px; line-height: 1.45; }
.p-mov .w-cmp textarea.ct.area { height: 96px; }
.o-dd > button.ct { width: 100%; font: inherit; font-size: 13px; color: var(--t1); cursor: pointer; text-align: left; }
.o-dd > button.ct .val { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.o-dd > button.ct .val.vacio2 { color: var(--t3); }
.o-dd > button.ct svg { color: var(--t3); flex-shrink: 0; }
.o-dd > button.ct[aria-expanded="true"], input.ct:focus, textarea.ct:focus { outline: none; border-color: var(--marca); box-shadow: 0 0 0 3px oklch(0.51 0.099 195 / 0.15); }
.o-dd > button.ct:disabled { color: var(--t3); background: var(--s2); border-color: var(--borde); cursor: default; }
.ct.mal { border-color: var(--peligro) !important; }
.o-err { font-size: 12.5px; color: oklch(0.5 0.19 25); }
.o-lst { position: absolute; z-index: 20; left: 0; top: calc(100% + 4px); min-width: 100%; width: max-content; max-width: 380px; box-sizing: border-box; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); padding: 4px; display: flex; flex-direction: column; }
.o-lst.der { left: auto; right: 0; min-width: 220px; }
.o-lst .op { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 36px; box-sizing: border-box; padding: 4px 10px; border-radius: 6px; font: inherit; font-size: 13px; color: var(--t1); background: none; border: 0; text-align: left; cursor: pointer; white-space: nowrap; }
.o-lst .op:hover { background: var(--s2); }
.o-lst .op.on { background: var(--marca-t); color: var(--marca-tx); font-weight: 500; }
.o-lst .op:disabled { color: var(--t3); cursor: default; background: none; }
.o-lst .op.pel { color: oklch(0.52 0.19 25); }
.o-lst .op.pel svg { color: oklch(0.52 0.19 25); }
.o-lst .op .n2 { display: flex; flex-direction: column; line-height: 1.35; }
.o-lst .op .d { font-size: 12px; color: var(--t3); font-weight: 400; white-space: normal; max-width: 300px; }
.o-lst .op .tilde { display: none; }
.o-lst .op.on .tilde { display: inline-flex; }
.o-lst label.op { justify-content: flex-start; }
.o-lst label.op.on { background: none; color: var(--t1); font-weight: 400; }
:where(.w-app, .w-tel) input[type="checkbox"] { accent-color: var(--marca); width: 16px; height: 16px; margin: 0; flex-shrink: 0; cursor: pointer; }
:where(.w-app, .w-tel) input[type="checkbox"]:disabled { cursor: default; }
input.ct, textarea.ct { font: inherit; font-size: 13px; color: var(--t1); width: 100%; }
textarea.ct.area { resize: none; display: block; }
.w-cmp .rt { display: flex; align-items: center; gap: 8px; }
.w-cmp .rt .o-todos { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-weight: 500; color: var(--t2); cursor: pointer; }
/* Lo que no se edita se muestra como texto, sin campo gris. */
.o-txt { min-height: 36px; display: flex; align-items: center; font-size: 13px; color: var(--t1); }
.o-txt.largo { min-height: 0; padding-top: 2px; line-height: 1.5; }
.o-capa { position: absolute; inset: 0; z-index: 4; background: transparent; border: 0; padding: 0; cursor: default; }
/* La banda: estado, detalle y «Cambios sin guardar» en la segunda línea, separados por un punto medio. */
.o-res { display: flex !important; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; }
.o-res > :empty { display: none; }
.o-res > * + *::before { content: "·"; color: var(--t3); margin-right: 6px; }
.o-res .o-corta { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.o-res .sucio { color: oklch(0.5 0.12 70); font-weight: 500; }
.w-est.ok::before { background: oklch(0.6 0.13 155); }
.w-est.pend::before { background: var(--marca); }
.w-est.alerta::before { background: oklch(0.72 0.15 70); }
.w-est.mal::before { background: oklch(0.57 0.2 25); }
.w-est.off::before { background: oklch(0.75 0.01 78); }
.w-bnd .ac .ib.o-borde { border: 1px solid var(--borde2); box-sizing: border-box; }
/* Carteles debajo de la banda (criterio de avisos). */
.w-cartel.o-prob { background: var(--peligro-t); color: oklch(0.45 0.17 25); }
.w-cartel.o-info { background: var(--marca-t); color: var(--marca-tx); }
.w-cartel .cb-enl { font-size: 13px; }
/* Filas de una lista dentro de una caja. */
.o-ets { margin-bottom: -10px; }
.o-ets .rt { font-size: 12.5px; font-weight: 600; color: var(--t2); }
.o-vacio { padding: 16px; color: var(--t3); font-size: 13px; }
.o-grupo { display: flex; align-items: center; gap: 12px; min-height: 40px; box-sizing: border-box; padding: 0 16px; background: oklch(0.975 0.008 78); border-bottom: 1px solid var(--borde); font-weight: 600; cursor: pointer; }
.o-grupo .cnt { margin-left: auto; font-weight: 500; color: var(--t3); font-variant-numeric: tabular-nums; }
.o-perm { cursor: pointer; padding-left: 16px; min-height: 48px !important; }
.o-perm .dato b { color: var(--t1); font-weight: 500; }
.o-perm .dato { gap: 1px; }
.w-caja > :last-child.o-perm, .w-caja .o-ult { border-bottom: 0; }
/* Avisos que se quedan: borde rojo y ✕. El de un 5xx lleva el código de seguimiento. */
.p-aviso.mal { border-color: oklch(0.57 0.2 25 / 0.45); align-items: flex-start; }
.p-aviso .o-tt { flex: 1; display: flex; flex-direction: column; gap: 6px; padding-top: 1px; }
.p-aviso .ib { margin: -6px -6px -6px 0; }
.o-traza { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--t2); }
.o-traza .f { display: flex; align-items: center; gap: 8px; }
.o-traza code { word-break: break-all; font-family: ui-monospace, Consolas, monospace; font-size: 12px; background: var(--s2); border-radius: 6px; padding: 4px 6px; color: var(--t1); }
.o-lnk { height: auto !important; padding: 0 !important; font-size: 13px; }
/* La pantalla que no se puede mostrar. */
.o-404 { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 24px; }
.o-404 .circ { width: 56px; height: 56px; border-radius: 50%; background: var(--s3); color: var(--t2); display: inline-flex; align-items: center; justify-content: center; }
.o-404 h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.015em; }
.o-404 p { margin: 0; font-size: 14px; color: var(--t2); }
/* Teléfono: cuerpo con scroll, botones fijos abajo, diálogos y avisos a lo ancho. */
.w-tel .w-body.o-scroll { overflow: auto; }
.w-tel .o-dd > button.ct, .w-tel input.ct { height: 44px; }
.w-tel .p-dlg { width: calc(100% - 32px); }
.w-tel .p-aviso { left: 16px; right: 16px; width: auto; bottom: 88px; }
.w-tel .o-fila-tel { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--borde); }
.w-tel .o-fila-tel:last-child { border-bottom: 0; }
.w-tel .o-fila-tel .arr { display: flex; gap: 8px; align-items: flex-end; }
.w-tel .o-fila-tel .arr .o-dd { flex: 1; }
.w-tel .w-bnd .res { white-space: normal; }
</style>"""


# ---------- Piezas ----------
def sidebar(movil=False):
    return (f'<aside class="w-sb" aria-label="Menú principal"><div class="w-mk"><span class="brand" style="width: 28px; height: 28px; border-radius: 8px;"></span>ArquitecturaBase</div>'
            f'<div class="w-cx"><b>Grupo Delta</b><span>Organización</span></div>'
            f'<nav class="w-nav"><a class="w-ln" href="Inicio-Org.dc.html">{I["casa"]} Inicio</a>'
            f'<a class="w-ln grupo" href="WA-Chats.dc.html">{I["wa"]} WhatsApp <span class="fl">{I["der"]}</span></a></nav><div class="w-esp"></div>'
            f'<div class="w-abajo"><span class="w-ln on">{I["engr"]} Administración <span class="fl">{I["der"]}</span></span></div>'
            f'<div class="w-us"><span class="w-av">L</span><span class="tx"><b>Lucía Fernández</b><span>lucia.fernandez@delta.ejemplo.com</span></span></div></aside>')


def panel(activo):
    """Administración. En Usuario y Rol, «Gestión de usuarios» abierto con su hijo activo."""
    def ln(clave, href, icono, texto):
        return f'<a class="w-ln{" on" if activo == clave else ""}" href="{href}">{icono} {texto}</a>'

    if activo in ("usuarios", "roles"):
        usuarios = (f'<span class="w-ln grupo">{I["gente"]} Gestión de usuarios <span class="fl">{I["abajo"]}</span></span>'
                    f'<div class="w-hijos"><a class="w-ln{" on" if activo == "usuarios" else ""}" href="Usuarios.dc.html">Usuarios</a>'
                    f'<a class="w-ln{" on" if activo == "roles" else ""}" href="Roles.dc.html">Roles y permisos</a></div>')
    else:
        usuarios = f'<a class="w-ln grupo" href="Usuarios.dc.html">{I["gente"]} Gestión de usuarios <span class="fl">{I["der"]}</span></a>'
    return (f'<aside class="w-panel" aria-label="Administración"><div class="pc">Administración</div><nav class="w-nav">{usuarios}'
            + ln("empresas", "Empresas.dc.html", I["edif"], "Empresas")
            + ln("config", "Configuracion.dc.html", I["engr"], "Configuración")
            + ln("pagina", "Pagina-Org.dc.html", I["mundo"], "Página pública")
            + f'<a class="w-ln grupo" href="WA-Admin.dc.html">{I["wa"]} WhatsApp <span class="fl">{I["der"]}</span></a>'
            + ln("auditoria", "Auditoria-Org.dc.html", I["lista"], "Auditoría")
            + '</nav></aside>')


def topbar(migas):
    return (f'<header class="w-tb"><span>{migas}</span><details class="w-umd"><summary class="um" aria-label="Abrir tu menú"><span class="w-av">L</span>'
            f'<span class="tx"><b>Lucía Fernández</b><span>Grupo Delta</span></span>{I["abajo"]}</summary>{cp.menu("delta", False)}</details></header>')


def tel_tb():
    return (f'<header class="w-tb"><span style="display: inline-flex;">{I["menu"]}</span><b style="font-size: 14px;">ArquitecturaBase</b>'
            f'<details class="w-umd"><summary class="av-tel" aria-label="Abrir tu menú"><span class="w-av chico">L</span></summary>{cp.menu("delta", True)}</details></header>')


def web(cuerpo, activo, migas, extra=""):
    return f'<div class="w-app">{sidebar()}{panel(activo)}<div class="w-co">{topbar(migas)}{cuerpo}</div>{extra}</div>'


def caja(titulo, cuerpo, accion="", abre=True):
    return f'<div class="w-caja{" o-abre" if abre else ""}"><div class="w-cab"><span>{titulo}</span>{accion}</div>{cuerpo}</div>'


def ancho_css(ancho):
    return f' style="width: {ancho}px;"' if ancho else ' style="width: 100%;"'


def campo(rotulo, control, ancho, requerido=False, extra_rotulo=""):
    req = ' <span class="req" style="margin-left: -4px;">*</span>' if requerido else ""
    return f'<div class="w-cmp"{ancho_css(ancho)}><span class="rt">{rotulo}{req}{extra_rotulo}</span>{control}</div>'


def sif(valor, cuerpo, ph="no"):
    return f'<sc-if value="{{{{{valor}}}}}" hint-placeholder-val="{{{{{ph}}}}}">{cuerpo}</sc-if>'


UNO = ('<div class="o-dd"><button type="button" class="ct {{mal@K@}}" aria-haspopup="listbox" aria-expanded="{{exp@K@}}" aria-label="@ROT@" onClick="{{alternar@K@}}">'
       '<span class="val {{claseVal@K@}}">{{texto@K@}}</span>@ABAJO@</button>'
       '<sc-if value="{{abierto@K@}}" hint-placeholder-val="{{no}}"><div class="o-lst" role="listbox" aria-label="@ROT@">'
       '<sc-for list="{{opciones@K@}}" as="o" hint-placeholder-count="3"><button type="button" role="option" aria-selected="{{o.sel}}" class="op {{o.clase}}" onClick="{{o.elegir}}"@DIS@>'
       '<span class="n2"><span>{{o.n}}</span><sc-if value="{{o.d}}" hint-placeholder-val="{{no}}"><span class="d">{{o.d}}</span></sc-if></span><span class="tilde">@TILDE@</span></button></sc-for>'
       '</div></sc-if></div>')
VARIOS = ('<div class="o-dd"><button type="button" class="ct" aria-haspopup="listbox" aria-expanded="{{exp@K@}}" aria-label="@ROT@" onClick="{{alternar@K@}}"@DISBTN@>'
          '<span class="val {{claseVal@K@}}">{{texto@K@}}</span>@ABAJO@</button>'
          '<sc-if value="{{abierto@K@}}" hint-placeholder-val="{{no}}"><div class="o-lst" role="listbox" aria-multiselectable="true" aria-label="@ROT@">'
          '<sc-for list="{{opciones@K@}}" as="o" hint-placeholder-count="3"><label class="op"><input type="checkbox" checked="{{o.on}}" onChange="{{o.alternar}}">'
          '<span class="n2"><span>{{o.n}}</span><sc-if value="{{o.d}}" hint-placeholder-val="{{no}}"><span class="d">{{o.d}}</span></sc-if></span></label></sc-for>'
          '</div></sc-if></div>')


def uno(k, rotulo, mal=True, deshabilitar_usadas=False):
    t = UNO.replace("@K@", k).replace("@ROT@", rotulo).replace("@ABAJO@", I["abajo"]).replace("@TILDE@", TILDE)
    t = t.replace("@DIS@", ' disabled="{{o.usada}}"' if deshabilitar_usadas else "")
    return t if mal else t.replace(" {{mal" + k + "}}", "")


def varios(k, rotulo, disabled=None):
    t = VARIOS.replace("@K@", k).replace("@ROT@", rotulo).replace("@ABAJO@", I["abajo"])
    return t.replace("@DISBTN@", f' disabled="{{{{{disabled}}}}}"' if disabled else "")


def err(k):
    return sif("err" + k, f'<span class="o-err" role="alert">{{{{err{k}}}}}</span>')


CAPA = sif("hayAbierto", '<button type="button" class="o-capa" tabindex="-1" aria-hidden="true" onClick="{{cerrarMenus}}"></button>')
CONFIRMACION = sif("confirmacion",
                   '<div class="w-oscuro" style="z-index: 6;"></div><div class="p-dlg" role="alertdialog" aria-modal="true" aria-label="{{tituloConfirmacion}}">'
                   '<div class="dc"><span>{{tituloConfirmacion}}</span></div><div class="tx" style="padding-bottom: 16px;">{{textoConfirmacion}}</div>'
                   '@MOTIVO@'
                   '<div class="df"><button type="button" class="cb cb-sec" onClick="{{cancelarConfirmacion}}">@CANCELAR@</button>'
                   '<button type="button" class="cb {{claseConfirmar}}" onClick="{{confirmar}}">{{botonConfirmacion}}</button></div></div>')
MOTIVO = sif("hayMotivo", '<div class="db" style="padding-top: 0;"><div class="w-cmp"><span class="rt">Motivo <span class="req" style="margin-left: -4px;">*</span></span>'
             '<textarea class="ct area {{malMotivo}}" aria-label="Motivo" value="{{motivo}}" onChange="{{onMotivo}}"></textarea>' + err("Motivo") + '</div></div>')


def confirmacion(con_motivo=True, cancelar="Cancelar"):
    return CONFIRMACION.replace("@MOTIVO@", MOTIVO if con_motivo else "").replace("@CANCELAR@", cancelar)


def aviso(extra_texto="", extra_derecha=""):
    return sif("aviso", '<div class="p-aviso {{claseAviso}}" role="status">' + sif("avisoOk", OK, "si") + sif("avisoError", MAL)
               + '<span class="o-tt"><span>{{aviso}}</span>' + extra_texto + '</span>' + extra_derecha
               + sif("avisoError", f'<button type="button" class="ib" aria-label="Cerrar" onClick="{{{{cerrarAviso}}}}">{I["x"]}</button>') + '</div>')


SUCIO = sif("sucio", '<span class="sucio">Cambios sin guardar</span>')


def banda(titulo, res, acciones, volver=None, icono=None, linea=""):
    izq = (f'<a class="vol" href="{volver}" aria-label="Volver">{I["volver"]}</a>' if volver else f'<span class="ic">{icono}</span>')
    otra = f'<p class="res">{linea}</p>' if linea else ""
    return (f'<div class="w-bnd"><div class="iz">{izq}<div style="min-width: 0;"><h1>{titulo}</h1><p class="res o-res">{res}</p>{otra}</div></div>'
            f'<div class="ac">{acciones}</div></div>')


# ---------- Usuario ----------
def usuario(movil):
    mas = sif("conMas", '<span class="o-dd"><button type="button" class="ib o-borde" aria-label="Más acciones" aria-haspopup="menu" aria-expanded="{{expMas}}" onClick="{{alternarMas}}">' + KEBAB + '</button>'
              + sif("abiertoMas", '<div class="o-lst der" role="menu">'
                    + sif("esInvitacion", '<button type="button" class="op" role="menuitem" onClick="{{reenviar}}">Reenviar invitación</button>')
                    + sif("esInvitacion", '<button type="button" class="op pel" role="menuitem" onClick="{{revocar}}">Revocar invitación</button>')
                    + sif("esMiembro", '<button type="button" class="op pel" role="menuitem" onClick="{{quitarDeOrg}}">Quitar de la organización</button>', "si")
                    + '</div>') + '</span>', "si")
    quitar_baja = sif("bajaPedida", '<button type="button" class="cb cb-pel" onClick="{{quitarDeOrg}}">Quitar de la organización</button>')
    if movil:
        acciones = quitar_baja + mas
    else:
        acciones = (quitar_baja + mas
                    + sif("editable", '<button type="button" class="cb cb-sec" onClick="{{descartar}}">Descartar cambios</button>'
                          '<button type="button" class="cb cb-pri" onClick="{{guardar}}" disabled="{{noGuardable}}">{{textoGuardar}}</button>', "si"))
    res = '<span class="w-est {{pill}}">{{textoEstado}}</span>' + SUCIO + ("" if movil else sif("detalle", '<span class="o-corta">{{detalle}}</span>'))
    carteles = (sif("error", f'<div class="w-cartel o-prob" role="alert">{MAL.replace("oklch(0.55 0.2 25)", "currentColor")}<span class="tx">{{{{error}}}}</span></div>')
                + sif("bajaPedida", f'<div class="w-cartel" role="status">{TRI}<span class="tx">Pidió la baja de su cuenta. Se elimina el {{{{seElimina}}}}.</span></div>'))
    a = None if movil else 260
    estado = campo("Estado", sif("bloqEstado", '<div class="o-txt">{{textoEstado}}</div>') + sif("editEstado", uno("Estado", "Estado"), "si") + err("Estado"), a)
    todos = sif("editRolesOrg", '<label class="o-todos"><input type="checkbox" checked="{{todosRolesOrg}}" onChange="{{alternarTodosRolesOrg}}"> Todos</label>', "si")
    roles = campo("Roles de la organización", sif("bloqRolesOrg", '<div class="o-txt">{{textoRolesOrg}}</div>') + sif("editRolesOrg", varios("RolesOrg", "Roles de la organización"), "si"), a, extra_rotulo=todos)
    acceso = caja("Acceso a la organización", f'<div class="p-hoja">{estado}{roles}</div>')

    def dd_emp():
        return (sif("e.bloq", '<div class="o-txt">{{e.textoEmp}}</div>')
                + sif("e.edit", '<div class="o-dd"><button type="button" class="ct" aria-haspopup="listbox" aria-expanded="{{e.expEmp}}" aria-label="{{e.ariaEmpresa}}" onClick="{{e.alternarEmp}}">'
                      '<span class="val {{e.claseEmp}}">{{e.textoEmp}}</span>' + I["abajo"] + '</button>'
                      + sif("e.abiertoEmp", '<div class="o-lst" role="listbox"><sc-for list="{{e.opcionesEmp}}" as="o" hint-placeholder-count="3">'
                            '<button type="button" role="option" aria-selected="{{o.sel}}" class="op {{o.clase}}" onClick="{{o.elegir}}" disabled="{{o.usada}}"><span class="n2"><span>{{o.n}}</span></span><span class="tilde">' + TILDE + '</span></button></sc-for></div>')
                      + '</div>', "si"))

    def dd_roles():
        return (sif("e.bloq", '<div class="o-txt">{{e.textoRoles}}</div>')
                + sif("e.edit", '<div class="o-dd"><button type="button" class="ct" aria-haspopup="listbox" aria-expanded="{{e.expRoles}}" aria-label="{{e.ariaRoles}}" onClick="{{e.alternarRoles}}" disabled="{{e.sinEmpresa}}">'
                      '<span class="val {{e.claseRoles}}">{{e.textoRoles}}</span>' + I["abajo"] + '</button>'
                      + sif("e.abiertoRoles", '<div class="o-lst" role="listbox" aria-multiselectable="true"><sc-for list="{{e.opcionesRoles}}" as="o" hint-placeholder-count="3">'
                            '<label class="op"><input type="checkbox" checked="{{o.on}}" onChange="{{o.alternar}}"><span class="n2"><span>{{o.n}}</span><span class="d">{{o.d}}</span></span></label></sc-for></div>')
                      + '</div>', "si"))

    quitar_emp = sif("e.edit", f'<button type="button" class="ib" aria-label="{{{{e.ariaQuitar}}}}" onClick="{{{{e.quitar}}}}">{TACHO}</button>', "si")
    if movil:
        filas = ('<sc-for list="{{filasEmpresa}}" as="e" hint-placeholder-count="1"><div class="o-fila-tel">'
                 f'<div class="arr"><div class="w-cmp" style="flex: 1;"><span class="rt">Empresa</span>{dd_emp()}</div>{quitar_emp}</div>'
                 f'<div class="w-cmp"><span class="rt">Roles en la empresa</span>{dd_roles()}</div></div></sc-for>')
    else:
        filas = ('<div class="p-hoja o-col"><div class="o-fila o-ets"><span class="rt" style="width: 260px;">Empresa</span><span class="rt" style="width: 260px;">Roles en la empresa</span></div>'
                 '<sc-for list="{{filasEmpresa}}" as="e" hint-placeholder-count="1"><div class="o-fila" style="align-items: center;">'
                 f'<div style="width: 260px;">{dd_emp()}</div><div style="width: 260px;">{dd_roles()}</div>{quitar_emp}</div></sc-for></div>')
    sumar = f'<button type="button" class="cb cb-sec ch" onClick="{{{{sumar}}}}" disabled="{{{{noHayMas}}}}">{MAS} {"Sumar" if movil else "Sumar empresa"}</button>'
    empresas = caja("Empresas", sif("sinEmpresas", '<div class="o-vacio">No está en ninguna empresa.</div>') + sif("conEmpresas", filas, "si"), sif("editable", sumar, "si"))
    cuerpo_body = f'{carteles}{acceso}{empresas}'
    if movil:
        pie = sif("editable", '<div class="w-escr" style="padding: 12px 16px 20px;"><button type="button" class="cb cb-sec" style="flex: 1; height: 44px;" onClick="{{descartar}}">Descartar</button>'
                  '<button type="button" class="cb cb-pri" style="flex: 1; height: 44px;" onClick="{{guardar}}" disabled="{{noGuardable}}">Guardar</button></div>', "si")
        return (f'<div class="w-tel p-mov">{tel_tb()}{banda("{{titulo}}", res, acciones, volver="M-Usuarios.dc.html", linea=sif("detalle", "{{detalle}}"))}'
                f'<div class="w-body o-scroll">{cuerpo_body}</div>{pie}{CAPA}{confirmacion()}{aviso()}</div>')
    return web(banda("{{titulo}}", res, acciones, volver="Usuarios.dc.html") + f'<div class="w-body">{cuerpo_body}</div>', "usuarios",
               'Inicio / Gestión de usuarios / Usuarios / {{titulo}}', CAPA + confirmacion() + aviso())


# ---------- Rol ----------
def rol(movil):
    a_nombre, a_vale, a_desc = (None, None, None) if movil else (360, 260, 720)
    nombre = campo("Nombre", sif("editable", '<input class="ct {{malNombre}}" type="text" autocomplete="off" aria-label="Nombre" value="{{Nombre}}" onChange="{{onNombre}}">', "si")
                   + sif("sistema", '<div class="o-txt">{{Nombre}}</div>') + err("Nombre"), a_nombre,
                   extra_rotulo=sif("editable", ' <span class="req" style="margin-left: -4px;">*</span>', "si"))
    vale = campo("Vale en", sif("bloqVale", '<div class="o-txt">{{textoVale}}</div>') + sif("editVale", uno("Vale", "Vale en"), "si") + err("Vale"), a_vale)
    desc = campo("Descripción", sif("editable", '<textarea class="ct area" aria-label="Descripción" value="{{descripcion}}" onChange="{{onDescripcion}}"></textarea>', "si")
                 + sif("sistema", '<div class="o-txt largo">{{descripcion}}</div>'), a_desc)
    datos = caja("Datos del rol", (f'<div class="p-hoja">{nombre}{vale}{desc}</div>' if movil
                                   else f'<div class="p-hoja o-col"><div class="o-fila">{nombre}{vale}</div><div class="o-fila">{desc}</div></div>'))
    permisos_cuerpo = (sif("errPermisos", f'<div class="w-cartel o-prob" role="alert" style="margin: 12px 16px;">{MAL.replace("oklch(0.55 0.2 25)", "currentColor")}<span class="tx">{{{{errPermisos}}}}</span></div>')
                       + sif("sinVale", '<div class="o-vacio">Elegí dónde vale el rol para ver sus permisos.</div>')
                       + sif("conVale", '<sc-for list="{{areas}}" as="a" hint-placeholder-count="2">'
                             '<label class="o-grupo"><input type="checkbox" checked="{{a.todos}}" onChange="{{a.alternarTodos}}" disabled="{{a.bloq}}" aria-label="{{a.ariaTodos}}"><span>{{a.n}}</span><span class="cnt">{{a.cuenta}}</span></label>'
                             '<sc-for list="{{a.opciones}}" as="o" hint-placeholder-count="2"><label class="w-it o-perm {{o.clase}}"><input type="checkbox" checked="{{o.on}}" onChange="{{o.alternar}}" disabled="{{o.bloq}}">'
                             '<span class="dato"><b>{{o.n}}</b><span>{{o.d}}</span></span></label></sc-for></sc-for>', "si"))
    permisos = caja("Permisos", permisos_cuerpo, '<span style="font-weight: 500; color: var(--t3); padding-right: 12px;">{{conteo}}</span>', abre=False)
    res = sif("sistema", "<span>De sistema</span>") + SUCIO + ("" if movil else sif("detalle", '<span class="o-corta">{{detalle}}</span>'))
    acciones = "" if movil else sif("editable", '<a class="cb cb-sec" href="Roles.dc.html">Cancelar</a><button type="button" class="cb cb-pri" onClick="{{guardar}}" disabled="{{noGuardable}}">{{textoGuardar}}</button>', "si")
    cuerpo_body = f'{datos}{permisos}'
    if movil:
        pie = sif("editable", '<div class="w-escr" style="padding: 12px 16px 20px;"><a class="cb cb-sec" style="flex: 1; height: 44px;" href="M-Roles.dc.html">Cancelar</a>'
                  '<button type="button" class="cb cb-pri" style="flex: 1; height: 44px;" onClick="{{guardar}}" disabled="{{noGuardable}}">{{textoGuardar}}</button></div>', "si")
        return (f'<div class="w-tel p-mov">{tel_tb()}{banda("{{titulo}}", res, acciones, volver="M-Roles.dc.html", linea=sif("detalle", "{{detalle}}"))}'
                f'<div class="w-body o-scroll">{cuerpo_body}</div>{pie}{CAPA}{confirmacion()}{aviso()}</div>')
    return web(banda("{{titulo}}", res, acciones, volver="Roles.dc.html") + f'<div class="w-body" style="overflow: auto;">{cuerpo_body}</div>', "roles",
               'Inicio / Gestión de usuarios / Roles y permisos / {{titulo}}', CAPA + confirmacion() + aviso())


# ---------- Avisos (sobre Configuración) ----------
def avisos():
    nombre = campo("Nombre de la organización", '<input class="ct {{malNombre}}" type="text" autocomplete="off" aria-label="Nombre de la organización" value="{{Nombre}}" onChange="{{onNombre}}">' + err("Nombre"), 360, requerido=True)
    datos = caja("Datos de la organización", '<div class="p-hoja o-col"><div class="o-fila">' + nombre + '</div><div class="o-fila">'
                 + campo("Idioma y región predeterminados", uno("Cultura", "Idioma y región predeterminados", mal=False), 260)
                 + campo("Zona horaria predeterminada", uno("Zona", "Zona horaria predeterminada", mal=False), 260)
                 + campo("Moneda predeterminada", uno("Moneda", "Moneda predeterminada", mal=False), 260) + '</div></div>')
    dominio = caja("Dominio de correo",
                   f'<div class="w-it"><span class="p-ic">{GLOBO}</span><span class="dato"><b>delta.ejemplo.com</b><span>Verificado · 10 correos administrados por Grupo Delta</span></span>'
                   f'<button type="button" class="ib" aria-label="Acciones de delta.ejemplo.com">{KEBAB}</button></div>',
                   f'<button type="button" class="cb cb-sec ch">{MAS} Agregar dominio</button>', abre=False)
    carteles = (sif("sinConexion", f'<div class="w-cartel o-prob" role="status">{NUBE}<span class="tx">Sin conexión</span></div>')
                + sif("versionNueva", f'<div class="w-cartel o-info" role="status">{INFO}<span class="tx">Hay una versión nueva</span><button type="button" class="cb cb-sec ch" onClick="{{{{actualizar}}}}">Actualizar</button></div>')
                + sif("conflicto", f'<div class="w-cartel" role="alert">{TRI}<span class="tx">Otra persona cambió esto mientras lo editabas.</span>'
                      '<button type="button" class="cb cb-enl" onClick="{{seguirEditando}}">Seguir editando</button><button type="button" class="cb cb-sec ch" onClick="{{verLoNuevo}}">Ver lo nuevo</button></div>'))
    acciones = ('<button type="button" class="cb cb-sec" onClick="{{descartar}}">Descartar cambios</button>'
                '<button type="button" class="cb cb-pri" onClick="{{guardar}}" disabled="{{noGuardable}}">{{textoGuardar}}</button>')
    form = sif("esForm", banda("Configuración", SUCIO, acciones, icono=I["engr"]) + f'<div class="w-body">{carteles}{datos}{dominio}</div>', "si")
    no_esta = sif("es404", f'<div class="o-404"><span class="circ">{NO_ENCONTRADA}</span><h1>No encontramos esta página</h1>'
                  '<p>Puede que la hayan borrado o que la dirección esté mal.</p><a class="cb cb-pri" href="Inicio-Org.dc.html">Ir al inicio</a></div>')
    traza = sif("traza", '<span class="o-traza"><span class="f">Código de seguimiento <button type="button" class="cb cb-enl o-lnk" onClick="{{copiarTraza}}" aria-label="Copiar el código de seguimiento">{{textoCopiar}}</button></span><code>{{traza}}</code></span>')
    reintentar = sif("hayReintentar", '<button type="button" class="cb cb-enl o-lnk" style="margin-top: 1px;" onClick="{{reintentar}}">Reintentar</button>')
    return web(form + no_esta, "config", 'Inicio' + sif("miga", " / {{miga}}", "si"),
               CAPA + confirmacion(con_motivo=False, cancelar="{{botonCancelar}}") + aviso(traza, reintentar))


# ---------- Lógica: la de antes, con los cambios mínimos para el dibujo nuevo ----------
def cambiar(t, viejo, nuevo, veces=1, nombre=""):
    if nuevo in t:
        return t
    n = t.count(viejo)
    assert n == veces, (nombre, viejo[:60], n)
    return t.replace(viejo, nuevo)


def logica(nombre):
    viejo = (ORIG / f"{nombre}.dc.html") if (ORIG / f"{nombre}.dc.html").exists() else (PROJ / f"{nombre}.dc.html")
    t = viejo.read_text(encoding="utf-8")
    k = t.index("data-dc-script")
    abre = t.rindex("<script", 0, k)
    etiqueta = t[abre:t.index(">", k) + 1]
    js = t[t.index(">", k) + 1:t.index("</script>", k)]
    base = nombre.removeprefix("M-")
    if base in ("Usuario", "Rol"):
        js = cambiar(js, "['bloq' + clave]: !!extra.bloqueado,", "['bloq' + clave]: !!extra.bloqueado,\n      ['edit' + clave]: !extra.bloqueado,", 2, nombre)
        js = cambiar(js, "claseConfirmar: c && c.peligro === false ? 'b-pri' : 'b-pel',", "claseConfirmar: c && c.peligro === false ? 'cb-pri' : 'cb-pel lleno',", 1, nombre)
    if base == "Usuario":
        js = cambiar(js, "detalle: invitacion ? 'Invitado a ' + u.email + (u.estado === 'vencida' ? ' · la invitación venció el ' : ' · la invitación vence el ') + u.vence : u.email + ' · en la organización desde el ' + u.desde,",
                     "detalle: invitacion ? u.email + (u.estado === 'vencida' ? ' · venció el ' : ' · vence el ') + u.vence : u.email + ' · desde el ' + u.desde,", 1, nombre)
        if "reenviar: () => this.avisar(" in js:
            js = cambiar(js, "reenviar: () => this.avisar('Reenviamos la invitación a ' + u.email + '.'),",
                         "reenviar: () => { this.setState({ abierto: null }); this.avisar('Reenviamos la invitación a ' + u.email + '.'); },", 1, nombre)
        js = cambiar(js, "          bloq: baja,", "          bloq: baja,\n          edit: !baja,", 1, nombre)
        js = cambiar(js, "      sinEmpresas: s.empresas.length === 0,", "      sinEmpresas: s.empresas.length === 0,\n      conEmpresas: s.empresas.length > 0,", 1, nombre)
    if base == "Avisos":
        js = cambiar(js, "claseConfirmar: 'b-pel',", "claseConfirmar: 'cb-pel lleno',", 1, nombre)
    return etiqueta, js


def archivo(nombre, titulo, cuerpo):
    etiqueta, js = logica(nombre)
    head = HEAD_BASE.replace("<title>Criterio · Botones</title>", f"<title>{titulo}</title>")
    return "\n".join([head, CSS, CSS_P, CSS_O, CSS_F, cp.CSS, "</helmet>", "", cuerpo, "</x-dc>", "", etiqueta + js + "</script>", "</body>", "</html>", ""])


TABLEROS = {
    "Usuario": ("Editar usuario · /org/usuarios/:id", usuario(False)),
    "Rol": ("Editar un rol · /org/roles/:id", rol(False)),
    "Avisos": ("Avisos del sistema", avisos()),
    "M-Usuario": ("Editar usuario · teléfono", usuario(True)),
    "M-Rol": ("Editar un rol · teléfono", rol(True)),
}

if __name__ == "__main__":
    ruta = PROJ / "canvas.json"
    c = json.loads(ruta.read_text(encoding="utf-8"))
    B = c["boards"]
    # Las versiones anteriores, al Archivo (con el menú ya conectado).
    x = max(b["x"] + b["w"] for b in B.values() if b.get("page") == "archivo") + 80
    for clave in TABLEROS:
        anterior = f"{clave}-Anterior.dc.html"
        if anterior not in B:
            shutil.copyfile(PROJ / f"{clave}.dc.html", PROJ / anterior)
            w, h = B[f"{clave}.dc.html"]["w"], B[f"{clave}.dc.html"]["h"]
            titulo = B[f"{clave}.dc.html"]["title"].replace(" · para aprobar", "")
            B[anterior] = {"x": x, "y": 260, "w": w, "h": h, "title": f"{titulo} (antes del criterio)", "page": "archivo", "is_interactive": True}
            c["order"].append(anterior)
            x += w + 80
    for clave, (titulo, cuerpo) in TABLEROS.items():
        (PROJ / f"{clave}.dc.html").write_text(archivo(clave, titulo, cuerpo), encoding="utf-8")
        B[f"{clave}.dc.html"]["title"] = titulo + MARCA
        B[f"{clave}.dc.html"]["is_interactive"] = True
    ruta.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ok", list(TABLEROS))
