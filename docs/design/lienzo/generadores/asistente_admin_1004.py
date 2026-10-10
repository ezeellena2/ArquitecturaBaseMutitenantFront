"""Configuración, Uso y Módulos del asistente (ADR 0048 del back y la propuesta del asistente, §7 puntos 3 a 5; v114, 2026-10-07).
- Administración › Asistente, con «Configuración» y «Uso», como el grupo de WhatsApp:
  - Asistente-Config-Org: qué clave usa (segmentado «La de la plataforma» / «La nuestra», solo si la plataforma lo habilitó; si no,
    el campo deshabilitado con ⓘ), proveedor, la clave tapada con «Cambiar», el modelo con su precio y los topes (deshabilitados con
    la clave de la plataforma, que los fija ella).
  - Asistente-Uso-Org: el tope del mes con su barra y, en pestañas, el uso por día y por persona, sin texto de las conversaciones.
  - Plat-Asistente-Config: proveedor, clave, modelo por defecto, esfuerzo, los modelos que pueden elegir las organizaciones, los topes,
    las personas y los días para borrar una conversación.
  - Plat-Asistente-Uso: el costo del mes y el uso por organización, con su clave y su tope.
  - Sus teléfonos: M-Asistente-Config-Org, M-Asistente-Uso-Org, M-Plat-Asistente-Config y M-Plat-Asistente-Uso.
- Organizacion y M-Organizacion › Módulos: «Asistente», con «Con la clave de la plataforma» o «Puede usar su clave» y, en el ⋮,
  «Permitir su propia clave» / «Solo con la clave de la plataforma».
Los tableros nuevos copian el marco de su base (WA-Admin, Plat-WA-Numero y M-Config-Plat); si ya existen, no se tocan."""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from estados_util import CHEV_CAMPO, rango_bloque, rep, sumar_opcion  # noqa: E402


def svg(d, w=16, sw="1.75"):
    return (f'<svg width="{w}" height="{w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


CHISPA_D = ('<path d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9z"/>'
            '<path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>')
INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 14)
CERRAR = svg('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', 22, "2")
APAGAR = svg('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>', 20)
KEBAB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')

PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-vuelta="1004-asistente-admin"'
CHISPA18 = svg(CHISPA_D, 18)
TILDE = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 14, "2.4")
LLAVE = svg('<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7"/><path d="m16 7 3 3"/>')
INFO_I = lambda t: f'<span class="as-i" tabindex="0" role="img" aria-label="{t}" title="{t}">{INFO}</span>'  # noqa: E731

CATALOGO = [("Claude Fable 5.1", "claude-fable-5-1", "10,00", "50,00", False),
            ("Claude Opus 5.5", "claude-opus-5-5", "4,00", "20,00", True),
            ("Claude Sonnet 5.5", "claude-sonnet-5-5", "2,00", "10,00", True),
            ("Claude Haiku 5.5", "claude-haiku-5-5", "0,10", "0,50", True)]
COLS_CAT = "minmax(0, 1.1fr) minmax(0, 0.8fr) minmax(0, 1.1fr) 150px 150px 120px 40px"
MAS = svg('<path d="M12 5v14"/><path d="M5 12h14"/>', 16, "2")
FLECHA_AV = svg('<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>', 16, "2")
MODELOS = [("opus", "Claude Opus 5.5", "Entrada USD 4 · salida USD 20 por millón de tokens"),
           ("sonnet", "Claude Sonnet 5.5", "Entrada USD 2 · salida USD 10 por millón de tokens"),
           ("haiku", "Claude Haiku 5.5", "Entrada USD 0,10 · salida USD 0,50 por millón de tokens")]


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def marcar(t, css):
    assert t.count("</helmet>") == 1
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>")


def script(estados, ancho, alto, cuerpo):
    props = json.dumps({"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"},
                        "$preview": {"width": ancho, "height": alto}}, ensure_ascii=False, separators=(",", ":"))
    return (f"<script type=\"text/x-dc\" data-dc-script data-props='{props}'>\nclass Component extends DCLogic {{\n"
            f"  renderVals() {{\n    const e = this.state.e ?? (this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)});\n"
            f"    const ir = (x) => this.setState({{ e: x }});\n{cuerpo}\n  }}\n}}\n</script>")


def poner_script(t, s):
    i = t.index('<script type="text/x-dc"')
    j = t.index("</script>", i) + len("</script>")
    return t[:i] + s + t[j:]


def campo(rot, valor, ro=False, sel=False, ph=False, req=False, info="", clase="", extra=""):
    r = ' <span class="req">*</span>' if req else ""
    c = "ct" + (" ro" if ro else "") + (" sel" if sel else "") + (" ph" if ph else "") + (" " + clase if clase else "")
    return (f'<div class="w-cmp"><span class="rt">{rot}{r}{" " + INFO_I(info) if info else ""}</span>'
            f'<div class="{c}">{valor}{CHEV_CAMPO if sel else ""}</div>{extra}</div>')


def dinero(rot, monto, ro=False, info=""):
    return (f'<div class="w-cmp"><span class="rt">{rot}{" " + INFO_I(info) if info else ""}</span>'
            f'<div class="ct as-din{" ro" if ro else ""}"><span class="as-pre">USD</span><span>{monto}</span></div></div>')


def lista_modelos(ids, actual_var):
    """El desplegable de modelos abierto, debajo del campo y del mismo ancho, con el precio como segunda línea."""
    ops = "".join(
        f'<button type="button" role="option" class="as-op {{{{{actual_var}_{i}}}}}"><span class="n2"><span>{n}</span><span class="d">{d}</span></span>'
        f'<span class="as-op-t">{TILDE}</span></button>'
        for i, n, d in MODELOS if i in ids)
    return f'<div class="as-lista" role="listbox" aria-label="Modelo">{ops}</div>'


def seg(etiqueta, opciones):
    """Segmentado: [(texto, clase_var, accion)]."""
    b = "".join(f'<button type="button" role="radio" class="{{{{{c}}}}}" onClick="{{{{{a}}}}}">{tx}</button>' for tx, c, a in opciones)
    return f'<div class="as-seg" role="radiogroup" aria-label="{etiqueta}">{b}</div>'


def banda(titulo, res, acciones):
    return (f'<div class="w-bnd"><div class="iz"><span class="ic">{CHISPA18}</span><div><h1>{titulo}</h1><p class="res">{res}</p></div></div>'
            f'<div class="ac">{acciones}</div></div>')


BOTONES = ('<button type="button" class="cb cb-sec" onClick="{{descartar}}">Descartar cambios</button>'
           '<button type="button" class="cb cb-pri" onClick="{{guardar}}" disabled="{{limpio}}">Guardar cambios</button>')
SUCIO = '<sc-if value="{{sucio}}" hint-placeholder-val="{{no}}"><span class="as-sucio">Cambios sin guardar</span></sc-if>'
MES = f'<button type="button" class="cb cb-sec as-mes" aria-haspopup="listbox">Octubre de 2026{CHEV_CAMPO}</button>'

# ---------------------------------------------------------------- Organización: Configuración
CONFIG_ORG = (
    banda("Configuración", SUCIO, BOTONES)
    + '<div class="w-body"><div class="w-caja"><div class="w-cab"><span>Clave y modelo</span></div><div class="as-g2">'
    + '<sc-if value="{{puedeElegir}}" hint-placeholder-val="{{si}}"><div class="w-cmp"><span class="rt">Qué clave usa</span>'
    + seg("Qué clave usa", [("La de la plataforma", "segPlat", "usarPlat"), ("La nuestra", "segPropia", "usarPropia")])
    + '<sc-if value="{{sinDueno}}" hint-placeholder-val="{{no}}"><span class="as-err" role="alert">Para usar la clave de Grupo Delta, algún Dueño tiene que tener un correo verificado.</span><a class="as-lnk as-err-l" href="Cuenta-Agregar.dc.html">Agregar un correo</a></sc-if></div></sc-if>'
    + '<sc-if value="{{noPuedeElegir}}" hint-placeholder-val="{{no}}">'
    + campo("Qué clave usa", "La de la plataforma", ro=True, info="La plataforma no habilitó una clave propia para Grupo Delta.") + '</sc-if>'
    + campo("Proveedor", "Anthropic", ro=True)
    + '<sc-if value="{{propia}}" hint-placeholder-val="{{no}}"><div class="w-cmp"><span class="rt">Clave de Anthropic <span class="req">*</span></span>'
    + '<sc-if value="{{claveGuardada}}" hint-placeholder-val="{{si}}"><div class="ct ro as-clave"><span>•••• 4F2a</span>'
    + '<button type="button" class="as-lnk" onClick="{{cambiarClave}}">Cambiar</button></div></sc-if>'
    + '<sc-if value="{{claveNueva}}" hint-placeholder-val="{{no}}"><input class="ct {{malClave}}" type="password" aria-label="Clave de Anthropic" '
      'placeholder="Pegá la clave de Anthropic" value="{{clave}}"></sc-if>'
    + '<sc-if value="{{errClave}}" hint-placeholder-val="{{no}}"><span class="as-err" role="alert">{{errClave}}</span></sc-if></div></sc-if>'
    + '<div class="w-cmp as-env"><span class="rt">Modelo</span><button type="button" class="ct sel as-btn" aria-haspopup="listbox" '
      f'aria-expanded="{{{{expModelo}}}}" onClick="{{{{alternarModelo}}}}"><span>{{{{textoModelo}}}}</span>{CHEV_CAMPO}</button>'
    + '<sc-if value="{{abiertoModeloPlat}}" hint-placeholder-val="{{no}}">' + lista_modelos(["sonnet", "haiku"], "m") + '</sc-if>'
    + '<sc-if value="{{abiertoModeloTodos}}" hint-placeholder-val="{{no}}">' + lista_modelos(["opus", "sonnet", "haiku"], "m") + '</sc-if></div>'
    + '</div></div>'
    + '<div class="w-caja"><div class="w-cab"><span>Topes</span></div><div class="as-g2">'
    + '<sc-if value="{{propia}}" hint-placeholder-val="{{no}}"><div class="w-cmp"><span class="rt">Consultas por persona por día <span class="req">*</span></span>'
      '<input class="ct" type="number" aria-label="Consultas por persona por día" value="50"></div>'
    + dinero("Tope del mes", "200") + '</sc-if>'
    + '<sc-if value="{{noPropia}}" hint-placeholder-val="{{si}}">'
    + campo("Consultas por persona por día", "50", ro=True, info="Los fija la plataforma.")
    + dinero("Tope del mes", "100", ro=True, info="Lo fija la plataforma.") + '</sc-if>'
    + '</div></div></div>')

JS_CONFIG_ORG = """    const propia = ['Con su clave', 'Cambiar la clave', 'Clave rechazada', 'La nuestra: ningún Dueño con correo verificado'].includes(e);
    const abierto = this.state.abierto ?? (e === 'Elegir el modelo');
    const modelo = this.state.modelo ?? (e === 'Cambios sin guardar' ? 'haiku' : propia ? 'opus' : 'sonnet');
    const NOMBRES = { opus: 'Claude Opus 5.5', sonnet: 'Claude Sonnet 5.5', haiku: 'Claude Haiku 5.5' };
    const sucio = e === 'Cambios sin guardar' || (this.state.modelo !== undefined && this.state.modelo !== (propia ? 'opus' : 'sonnet'));

    return {
      si: true, no: false,
      puedeElegir: e !== 'La plataforma no habilitó su clave',
      noPuedeElegir: e === 'La plataforma no habilitó su clave',
      segPlat: propia ? '' : 'on',
      segPropia: propia ? 'on' : '',
      usarPlat: () => this.setState({ e: 'Con la clave de la plataforma', modelo: undefined, abierto: false }),
      usarPropia: () => this.setState({ e: 'Con su clave', modelo: undefined, abierto: false }),
      propia, noPropia: !propia,
      claveGuardada: e === 'Con su clave',
      claveNueva: e === 'Cambiar la clave' || e === 'Clave rechazada' || e === 'La nuestra: ningún Dueño con correo verificado',
      sinDueno: e === 'La nuestra: ningún Dueño con correo verificado',
      clave: e === 'Clave rechazada' ? 'sk-ant-api03-xxxxxxxx' : '',
      malClave: e === 'Clave rechazada' ? 'mal' : '',
      errClave: e === 'Clave rechazada' ? 'Anthropic rechazó la clave.' : '',
      cambiarClave: () => ir('Cambiar la clave'),
      textoModelo: NOMBRES[modelo],
      expModelo: abierto ? 'true' : 'false',
      alternarModelo: () => this.setState({ abierto: !abierto }),
      abiertoModeloPlat: abierto && !propia,
      abiertoModeloTodos: abierto && propia,
      m_opus: modelo === 'opus' ? 'on' : '', m_sonnet: modelo === 'sonnet' ? 'on' : '', m_haiku: modelo === 'haiku' ? 'on' : '',
      sucio, limpio: !sucio,
      descartar: () => this.setState({ e: propia ? 'Con su clave' : 'Con la clave de la plataforma', modelo: undefined, abierto: false }),
      guardar: () => this.setState({ modelo: undefined, abierto: false, e: propia ? 'Con su clave' : 'Con la clave de la plataforma' }),
    };"""
ESTADOS_CONFIG_ORG = ["Con la clave de la plataforma", "Elegir el modelo", "Cambios sin guardar", "Con su clave", "Cambiar la clave",
                      "Clave rechazada", "La nuestra: ningún Dueño con correo verificado", "La plataforma no habilitó su clave"]

# ---------------------------------------------------------------- Organización: Uso
DIAS = [("07/10/2026", "212", "8", "6,10"), ("06/10/2026", "248", "9", "7,30"), ("05/10/2026", "31", "2", "0,90"),
        ("04/10/2026", "44", "3", "1,20"), ("03/10/2026", "236", "9", "7,00"), ("02/10/2026", "261", "9", "7,60"),
        ("01/10/2026", "252", "8", "7,30")]
PERSONAS = [("Lucía Fernández", "50", "310", "9,03"), ("Carolina Vega", "38", "228", "6,64"), ("Marcos Giménez", "31", "196", "5,71"),
            ("Paula Méndez", "29", "171", "4,98"), ("Sofía Herrera", "24", "142", "4,14"), ("Tomás Acosta", "19", "98", "2,85"),
            ("Martín Paz", "14", "74", "2,16"), ("Julieta Sosa", "7", "41", "1,19"), ("Diego Ríos", "0", "24", "0,70")]
COLS_DIA = "minmax(0, 1fr) 160px 160px 160px"
COLS_PER = "minmax(0, 1.4fr) minmax(0, 1fr) 160px 160px"


def num(x):
    return f'<span class="as-num">{x}</span>'


TABLA_DIA = ('<div class="w-caja as-tabla">'
             f'<div class="w-tr w-th" style="grid-template-columns: {COLS_DIA};"><span>Día</span>{num("Consultas")}{num("Personas")}{num("Costo")}</div>'
             + "".join(f'<div class="w-tr" style="grid-template-columns: {COLS_DIA};"><span>{d}</span>{num(c)}{num(p)}{num("USD " + u)}</div>' for d, c, p, u in DIAS)
             + '</div>')
TABLA_PER = ('<div class="w-caja as-tabla">'
             f'<div class="w-tr w-th" style="grid-template-columns: {COLS_PER};"><span>Persona</span><span>Consultas hoy</span>{num("Consultas del mes")}{num("Costo del mes")}</div>'
             + "".join(f'<div class="w-tr" style="grid-template-columns: {COLS_PER};"><span>{n}</span>'
                       + (f'<span class="as-hoy"><span>{h} de 50</span><span class="pill alerta">Llegó al tope</span></span>' if h == "50" else f'<span>{h} de 50</span>')
                       + f'{num(m)}{num("USD " + u)}</div>' for n, h, m, u in PERSONAS)
             + '</div>')


def medidor(titulo, extra_cab=""):
    return (f'<div class="w-caja"><div class="w-cab"><span>{titulo}</span>{extra_cab}</div><div class="as-med">'
            '<div class="as-cifra"><b>{{gasto}}</b><span>de {{tope}}</span><sc-if value="{{conPill}}" hint-placeholder-val="{{no}}"><span class="pill {{clasePill}}">{{textoPill}}</span></sc-if></div>'
            '<div class="as-barra"><span class="{{claseBarra}}"></span></div>'
            '<div class="as-res"><span><b>{{consultas}}</b> consultas</span><span><b>{{personas}}</b> personas</span><span><b>50</b> consultas por persona por día</span></div>'
            '</div></div>')


USO_ORG = (
    banda("Uso", "Octubre de 2026", MES)
    + '<div class="w-body">' + medidor("Tope del mes", f'<span class="as-cab-d">Con la clave de la plataforma {INFO_I("El tope lo fija la plataforma.")}</span>')
    + '<sc-if value="{{conUso}}" hint-placeholder-val="{{si}}"><div class="as-tabs" role="tablist">'
      '<button type="button" role="tab" aria-selected="{{selDia}}" class="{{tabDia}}" onClick="{{verDia}}">Por día</button>'
      '<button type="button" role="tab" aria-selected="{{selPer}}" class="{{tabPer}}" onClick="{{verPer}}">Por persona</button></div>'
    + '<sc-if value="{{porDia}}" hint-placeholder-val="{{si}}">' + TABLA_DIA + '</sc-if>'
    + '<sc-if value="{{porPer}}" hint-placeholder-val="{{no}}">' + TABLA_PER + '</sc-if></sc-if>'
    + '<sc-if value="{{sinUso}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="vacio as-vacio2"><strong>Sin uso este mes</strong></div></div></sc-if>'
    + '</div>')

JS_USO_ORG = """    const tab = this.state.tab ?? (e === 'Por persona' ? 'per' : 'dia');
    const cerca = e === 'Cerca del tope';
    const lleno = e === 'Llegó al tope';
    const nada = e === 'Sin uso este mes';

    return {
      si: true, no: false,
      gasto: nada ? 'USD 0' : cerca ? 'USD 92,10' : lleno ? 'USD 100' : 'USD 37,40',
      tope: 'USD 100',
      consultas: nada ? '0' : cerca ? '3.162' : lleno ? '3.440' : '1.284',
      personas: nada ? '0' : '9',
      conPill: cerca || lleno,
      clasePill: lleno ? 'mal' : 'alerta',
      textoPill: lleno ? 'Llegó al tope' : 'Cerca del tope',
      claseBarra: nada ? 'p0' : cerca ? 'p92 alerta' : lleno ? 'p100 mal' : 'p37',
      conUso: !nada, sinUso: nada,
      porDia: tab === 'dia', porPer: tab === 'per',
      tabDia: tab === 'dia' ? 'on' : '', tabPer: tab === 'per' ? 'on' : '',
      selDia: tab === 'dia' ? 'true' : 'false', selPer: tab === 'per' ? 'true' : 'false',
      verDia: () => this.setState({ tab: 'dia' }), verPer: () => this.setState({ tab: 'per' }),
    };"""
ESTADOS_USO_ORG = ["Por día", "Por persona", "Cerca del tope", "Llegó al tope", "Sin uso este mes"]

# El diálogo de agregar o editar un modelo del catálogo, con «Avanzado: datos técnicos» (v116, D26).
def entrada(rot, var, ph, req=False, din=False, err="", clase=""):
    """Un campo del diálogo del modelo: el valor sale de `var` y el error, de `err` (debajo del campo)."""
    q = ' <span class="req">*</span>' if req else ""
    mal = f" {{{{{err}Clase}}}}" if err else ""
    if din:
        c = f'<div class="ct as-din{mal}"><span class="as-pre">USD</span><input type="text" aria-label="{rot}" placeholder="{ph}" value="{{{{{var}}}}}"></div>'
    else:
        c = f'<input class="ct{mal}" type="text" aria-label="{rot}" placeholder="{ph}" value="{{{{{var}}}}}">'
    e = f'<sc-if value="{{{{{err}}}}}" hint-placeholder-val="{{{{no}}}}"><span class="as-err" role="alert">{{{{{err}}}}}</span></sc-if>' if err else ""
    return f'<div class="w-cmp {clase}"><span class="rt">{rot}{q}</span>{c}{e}</div>'


def casilla(texto, var):
    return f'<label class="as-casilla"><span class="as-chk {{{{{var}}}}}">{TILDE}</span>{texto}</label>'


AVANZADO = ('<div class="as-av-sec as-ancho">'
            '<span class="as-sub">Capacidades</span><div class="as-casillas">'
            + casilla("Imágenes en los adjuntos", "cImg") + casilla("PDF en los adjuntos", "cPdf") + casilla("Herramientas", "cHer") + '</div>'
            '<span class="as-sub">Límites</span><div class="as-g2b">'
            + entrada("Contexto (tokens)", "mCtx", "", req=True) + entrada("Salida máxima (tokens)", "mOut", "", req=True, err="errOut") + '</div>'
            '<span class="as-sub">Tarifas especiales · por millón de tokens</span><div class="as-g2b">'
            + entrada("Lectura de caché", "mCacheL", "", din=True) + entrada("Escritura de caché", "mCacheE", "", din=True) + '</div>'
            '<span class="as-sub">Contexto largo</span><div class="as-g3b">'
            + entrada("Desde (tokens)", "mLargoDesde", "") + entrada("Entrada por millón", "mLargoEnt", "", din=True)
            + entrada("Salida por millón", "mLargoSal", "", din=True) + '</div></div>')
DLG_MODELO = (
    '<sc-if value="{{dlgModelo}}" hint-placeholder-val="{{no}}"><div class="velo"><div class="dlg as-dlg-mod" role="dialog" aria-modal="true" aria-labelledby="as-mt">'
    + f'<div class="dlg-h"><h2 id="as-mt">{{{{tituloModelo}}}}</h2><button type="button" class="dlg-x" aria-label="Cerrar" onClick="{{{{cerrarModelo}}}}">{CERRAR}</button></div>'
    + '<div class="dlg-b as-g2 as-dlg">'
    + entrada("Nombre", "mNombre", "Claude Opus 5.5", req=True)
    + campo("Proveedor", "Anthropic", sel=True)
    + entrada("ID", "mId", "claude-opus-5-5", req=True, clase="as-ancho")
    + entrada("Precio de entrada por millón", "mEnt", "", req=True, din=True)
    + entrada("Precio de salida por millón", "mSal", "", req=True, din=True)
    + casilla("Activo", "cAct")
    + f'<button type="button" class="as-avz as-ancho" aria-expanded="{{{{avExp}}}}" onClick="{{{{alternarAv}}}}"><span class="as-avz-f">{FLECHA_AV}</span>Avanzado: datos técnicos</button>'
    + '<sc-if value="{{avAbierto}}" hint-placeholder-val="{{no}}">' + AVANZADO + '</sc-if>'
    + '</div><div class="dlg-f"><button type="button" class="cb cb-sec" onClick="{{cerrarModelo}}">Cancelar</button>'
      '<button type="button" class="cb cb-pri" onClick="{{cerrarModelo}}">{{botonModelo}}</button></div></div></div></sc-if>')

# ---------------------------------------------------------------- Plataforma: Configuración
CONFIG_PLAT = (
    banda("Configuración", '<sc-if value="{{sinClave}}" hint-placeholder-val="{{no}}"><span class="as-sucio">Sin configurar</span></sc-if>' + SUCIO,
          '<sc-if value="{{enGeneral}}" hint-placeholder-val="{{si}}">' + BOTONES + '</sc-if>'
          f'<sc-if value="{{{{enCatalogo}}}}" hint-placeholder-val="{{{{no}}}}"><button type="button" class="cb cb-pri" onClick="{{{{agregarModelo}}}}">{MAS} Agregar modelo</button></sc-if>')
    + '<div class="w-body"><div class="as-tabs" role="tablist">'
      '<button type="button" role="tab" aria-selected="{{selGen}}" class="{{tabGen}}" onClick="{{verGen}}">General</button>'
      '<button type="button" role="tab" aria-selected="{{selCat}}" class="{{tabCat}}" onClick="{{verCat}}">Catálogo de modelos <span class="as-cnt">4</span></button></div>'
    + '<sc-if value="{{enGeneral}}" hint-placeholder-val="{{si}}"><div class="as-pila">'
    + '<div class="w-caja"><div class="w-cab"><span>Clave y modelo</span></div><div class="as-g2">'
    + campo("Proveedor", "Anthropic", ro=True)
    + '<div class="w-cmp"><span class="rt">Clave de la plataforma <span class="req">*</span></span>'
      '<sc-if value="{{claveGuardada}}" hint-placeholder-val="{{si}}"><div class="ct ro as-clave"><span>•••• 9xQe</span><button type="button" class="as-lnk" onClick="{{cambiarClave}}">Cambiar</button></div></sc-if>'
      '<sc-if value="{{claveNueva}}" hint-placeholder-val="{{no}}"><input class="ct {{malClave}}" type="password" aria-label="Clave de la plataforma" placeholder="Pegá la clave de Anthropic" value="{{clave}}"></sc-if>'
      '<sc-if value="{{errClave}}" hint-placeholder-val="{{no}}"><span class="as-err" role="alert">{{errClave}}</span></sc-if></div>'
    + campo("Modelo por defecto", "Claude Sonnet 5.5", sel=True)
    + '<div class="w-cmp"><span class="rt">Esfuerzo</span>' + seg("Esfuerzo", [("Bajo", "efBajo", "nada"), ("Medio", "efMedio", "nada"), ("Alto", "efAlto", "nada")]) + '</div>'
    + '<div class="w-cmp as-ancho as-env"><span class="rt">Modelos que pueden elegir las organizaciones</span>'
      f'<button type="button" class="ct sel as-btn" aria-haspopup="listbox" aria-expanded="{{{{expPermitidos}}}}" onClick="{{{{alternarPermitidos}}}}"><span>Claude Sonnet 5.5, Claude Haiku 5.5</span>{CHEV_CAMPO}</button>'
    + '<sc-if value="{{abiertoPermitidos}}" hint-placeholder-val="{{no}}"><div class="as-lista" role="listbox" aria-multiselectable="true" aria-label="Modelos que pueden elegir las organizaciones">'
    + "".join(f'<button type="button" role="option" aria-selected="{"true" if i != "opus" else "false"}" class="as-op multi"><span class="as-chk {"on" if i != "opus" else ""}">{TILDE}</span>'
              f'<span class="n2"><span>{n}</span><span class="d">{d}</span></span></button>' for i, n, d in MODELOS)
    + '</div></sc-if></div>'
    + '</div></div>'
    + '<div class="w-caja"><div class="w-cab"><span>Topes</span></div><div class="as-g2">'
      '<div class="w-cmp"><span class="rt">Consultas por persona por día <span class="req">*</span></span><input class="ct" type="number" aria-label="Consultas por persona por día" value="50"></div>'
    + dinero("Tope del mes por organización", "100") + '</div></div>'
    + '<div class="w-caja"><div class="w-cab"><span>Personas y conversaciones</span></div><div class="as-g2">'
      f'<label class="as-casilla"><span class="as-chk on">{TILDE}</span>Las personas pueden usar el asistente</label>'
      '<div class="w-cmp"><span class="rt">Días sin actividad para borrar una conversación <span class="req">*</span></span>'
      '<input class="ct" type="number" aria-label="Días sin actividad para borrar una conversación" value="30"></div>'
    + '</div></div></div></sc-if>'
    + '<sc-if value="{{enCatalogo}}" hint-placeholder-val="{{no}}"><div class="w-caja as-tabla">'
    + f'<div class="w-tr w-th" style="grid-template-columns: {COLS_CAT};"><span>Modelo</span><span>Proveedor</span><span>ID</span>{num("Entrada por millón")}{num("Salida por millón")}<span>Estado</span><span class="sr">Acciones</span></div>'
    + "".join(f'<div class="w-tr" style="grid-template-columns: {COLS_CAT};"><span>{n}</span><span>Anthropic</span><span class="as-gris">{i}</span>{num("USD " + e)}{num("USD " + s)}'
              f'<span><span class="w-est{"" if a else " off"}">{"Activo" if a else "Inactivo"}</span></span>'
              f'<span style="display: flex; justify-content: flex-end;"><button type="button" class="ib" aria-label="Acciones de {n}">{KEBAB}</button></span></div>'
              for n, i, e, s, a in CATALOGO)
    + '</div></sc-if></div>'
    + DLG_MODELO)

# Los datos de ejemplo del diálogo: vacío al agregar y Claude Sonnet 5.5 al editar; el error es un cero de más en la salida máxima.
MODELO_JS = """    const MODOS = { 'Agregar un modelo': 'nuevo', 'Agregar un modelo: avanzado': 'nuevo-av', 'Editar un modelo': 'editar', 'Editar un modelo: error en un dato técnico': 'error' };
    const modo = this.state.modo !== undefined ? this.state.modo : (MODOS[e] || null);
    const av = this.state.av ?? (modo === 'nuevo-av' || modo === 'error' || modo === 'editar');
    const DATOS = {
      editar: { n: 'Claude Sonnet 5.5', id: 'claude-sonnet-5-5', ent: '2,00', sal: '10,00', ctx: '1.000.000', out: '128.000', cl: '0,20', ce: '2,50', img: 1, pdf: 1, her: 1 },
      error: { n: 'Claude Sonnet 5.5', id: 'claude-sonnet-5-5', ent: '2,00', sal: '10,00', ctx: '1.000.000', out: '1.280.000', cl: '0,20', ce: '2,50', img: 1, pdf: 1, her: 1 },
    };
    const M = DATOS[modo] || {};
    const edita = modo === 'editar' || modo === 'error';
    const tab = this.state.tab ?? (e === 'Catálogo de modelos' || MODOS[e] ? 'cat' : 'gen');
"""
JS_CONFIG_PLAT = """    const abierto = this.state.abierto ?? (e === 'Elegir los modelos permitidos');
    const sucio = e === 'Cambios sin guardar';
""" + MODELO_JS + """    const dlg = !!modo;

    return {
      si: true, no: false,
      enGeneral: tab === 'gen', enCatalogo: tab === 'cat',
      tabGen: tab === 'gen' ? 'on' : '', tabCat: tab === 'cat' ? 'on' : '',
      selGen: tab === 'gen' ? 'true' : 'false', selCat: tab === 'cat' ? 'true' : 'false',
      verGen: () => this.setState({ tab: 'gen' }), verCat: () => this.setState({ tab: 'cat' }),
      dlgModelo: dlg,
      tituloModelo: edita ? 'Editar modelo' : 'Agregar modelo',
      botonModelo: edita ? 'Guardar cambios' : 'Agregar modelo',
      mNombre: M.n || '', mId: M.id || '', mEnt: M.ent || '', mSal: M.sal || '', mCtx: M.ctx || '', mOut: M.out || '',
      mCacheL: M.cl || '', mCacheE: M.ce || '', mLargoDesde: '', mLargoEnt: '', mLargoSal: '',
      cImg: M.img ? 'on' : '', cPdf: M.pdf ? 'on' : '', cHer: M.her ? 'on' : '', cAct: 'on',
      errOut: modo === 'error' ? 'No puede superar el contexto.' : '', errOutClase: modo === 'error' ? 'mal' : '',
      avAbierto: av, avExp: av ? 'true' : 'false', alternarAv: () => this.setState({ av: !av }),
      agregarModelo: () => this.setState({ modo: 'nuevo', av: false }), cerrarModelo: () => this.setState({ modo: null, av: undefined }),
      sinClave: e === 'Sin clave',
      claveGuardada: !['Sin clave', 'Clave rechazada'].includes(e),
      claveNueva: ['Sin clave', 'Clave rechazada'].includes(e),
      clave: e === 'Clave rechazada' ? 'sk-ant-api03-xxxxxxxx' : '',
      malClave: e === 'Clave rechazada' ? 'mal' : '',
      errClave: e === 'Clave rechazada' ? 'Anthropic rechazó la clave.' : '',
      cambiarClave: () => ir('Sin clave'),
      efBajo: 'on', efMedio: '', efAlto: '', nada: () => {},
      expPermitidos: abierto ? 'true' : 'false',
      alternarPermitidos: () => this.setState({ abierto: !abierto }),
      abiertoPermitidos: abierto,
      sucio, limpio: !sucio,
      descartar: () => this.setState({ e: 'Configurada', abierto: false }),
      guardar: () => this.setState({ e: 'Configurada', abierto: false }),
    };"""
ESTADOS_CONFIG_PLAT = ["Configurada", "Elegir los modelos permitidos", "Cambios sin guardar", "Sin clave", "Clave rechazada",
                       "Catálogo de modelos", "Agregar un modelo", "Agregar un modelo: avanzado", "Editar un modelo",
                       "Editar un modelo: error en un dato técnico"]

# ---------------------------------------------------------------- Plataforma: Uso
ORGS = [("Grupo Delta", "La de la plataforma", "1.284", "37,40", "p37", "de USD 100"),
        ("Sigma S.A.", "La de la plataforma", "720", "21,10", "p21", "de USD 100"),
        ("Kappa S.A.", "La suya", "2.140", "44,20", "", "Su tope, USD 300"),
        ("Personas", "La de la plataforma", "566", "8,30", "", "—"),
        ("Operadores", "La de la plataforma", "210", "1,40", "", "—")]
COLS_ORG = "minmax(0, 1.2fr) minmax(0, 1fr) 120px 130px minmax(0, 1.3fr)"
TABLA_ORG = ('<div class="w-caja as-tabla">'
             f'<div class="w-tr w-th" style="grid-template-columns: {COLS_ORG};"><span>Organización</span><span>Clave</span>{num("Consultas")}{num("Costo")}<span>Tope del mes</span></div>'
             + "".join(
                 f'<div class="w-tr" style="grid-template-columns: {COLS_ORG};"><span>{o}</span><span>{k}</span>{num(c)}'
                 + (f'<span class="as-num as-gris">USD {u} {INFO_I("La paga Kappa S.A. con su clave.")}</span>' if k == "La suya" else num("USD " + u))
                 + (f'<span class="as-mini"><span class="as-barra"><span class="{b}"></span></span><span>{tt}</span></span>' if b else f'<span class="as-gris">{tt}</span>')
                 + '</div>' for o, k, c, u, b, tt in ORGS)
             + '</div>')
USO_PLAT = (
    banda("Uso", "Octubre de 2026", MES)
    + '<div class="w-body"><sc-if value="{{conUso}}" hint-placeholder-val="{{si}}">'
      '<div class="as-tres"><div class="w-caja as-kpi"><span>Costo con la clave de la plataforma</span><b>USD 68,20</b></div>'
      '<div class="w-caja as-kpi"><span>Consultas</span><b>4.920</b></div><div class="w-caja as-kpi"><span>Organizaciones que lo usan</span><b>3</b></div></div>'
    + TABLA_ORG + '</sc-if>'
    + '<sc-if value="{{sinUso}}" hint-placeholder-val="{{no}}"><div class="w-caja"><div class="vacio as-vacio2"><strong>Sin uso este mes</strong></div></div></sc-if>'
    + '</div>')
JS_USO_PLAT = """    return { si: true, no: false, conUso: e !== 'Sin uso este mes', sinUso: e === 'Sin uso este mes' };"""
ESTADOS_USO_PLAT = ["Por organización", "Sin uso este mes"]

CSS = """.as-g2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px 20px; padding: 16px 20px 20px; align-items: start; }
.as-g2 .w-cmp .ct { height: 44px; font: inherit; font-size: 14px; color: var(--t1); }
.as-ancho { grid-column: 1 / -1; }
.w-cmp .ct.ro { background: var(--s2) !important; color: var(--t2) !important; border-color: var(--borde) !important; }
.w-cmp .ct.sel svg { color: var(--t3); flex-shrink: 0; }
.w-cmp .ct.mal { border-color: oklch(0.6 0.19 25) !important; }
.w-cmp input.ct { width: 100%; padding: 0 12px; outline: 0; }
.w-cmp .rt .req { color: oklch(0.55 0.2 25); }
.as-i { display: inline-flex; vertical-align: -2px; color: var(--t3); cursor: help; margin-left: 2px; }
.as-btn { width: 100%; cursor: pointer; text-align: left; }
.as-env { position: relative; }
.w-caja:has(.as-lista) { overflow: visible; }
.w-caja:has(.as-lista) > .w-cab { border-radius: 12px 12px 0 0; }
.as-lista { position: absolute; z-index: 20; left: 0; right: 0; top: calc(100% + 4px); background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); padding: 4px; display: flex; flex-direction: column; }
.as-op { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 52px; box-sizing: border-box; padding: 6px 12px; border: 0; border-radius: 8px; background: transparent; font: inherit; text-align: left; cursor: pointer; color: var(--t1); }
.as-op:hover { background: var(--s2); }
.as-op.on { background: var(--marca-t); }
.as-op .n2 { display: flex; flex-direction: column; gap: 2px; font-size: 14px; flex: 1; min-width: 0; }
.as-op .d { font-size: 12.5px; color: var(--t3); }
.as-op-t { display: none; color: var(--marca-tx); }
.as-op.on .as-op-t { display: inline-flex; }
.as-op.multi { justify-content: flex-start; }
.as-chk { width: 18px; height: 18px; box-sizing: border-box; border: 1.5px solid var(--borde2); border-radius: 5px; background: #fff; display: inline-flex; align-items: center; justify-content: center; color: transparent; flex-shrink: 0; }
.as-chk.on { background: var(--marca); border-color: var(--marca); color: #fff; }
.as-casilla { display: flex; align-items: center; gap: 10px; min-height: 44px; font-size: 14px; color: var(--t1); align-self: end; }
.as-seg { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--s2); border: 1px solid var(--borde); height: 44px; box-sizing: border-box; }
.as-seg button { flex: 1; border: 0; border-radius: 7px; background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: var(--t2); cursor: pointer; }
.as-seg button.on { background: #fff; color: var(--t1); box-shadow: 0 1px 3px oklch(0.24 0.014 78 / 0.14); }
.as-clave { justify-content: space-between; }
.as-lnk { border: 0; background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: var(--marca-tx); cursor: pointer; padding: 0; }
.as-din { justify-content: flex-start !important; gap: 8px !important; }
.as-pre { color: var(--t3); font-weight: 500; }
.as-err { font-size: 13px; color: oklch(0.5 0.19 25); }
.as-err-l { align-self: flex-start; font-size: 14px; }
.as-sucio { color: oklch(0.5 0.12 70); font-weight: 500; }
.w-body { display: flex; flex-direction: column; gap: 16px; }
.as-cab-d { display: inline-flex; align-items: center; gap: 4px; padding-right: 12px; font-weight: 500; color: var(--t2); }
.as-med { display: flex; flex-direction: column; gap: 10px; padding: 18px 20px 20px; }
.as-cifra { display: flex; align-items: baseline; gap: 8px; font-size: 14px; color: var(--t2); }
.as-cifra b { font-size: 26px; font-weight: 600; color: var(--t1); font-variant-numeric: tabular-nums; }
.as-cifra .pill { margin-left: 6px; }
.as-barra { position: relative; height: 8px; border-radius: 999px; background: var(--s2); overflow: hidden; }
.as-barra > span { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 999px; background: var(--marca); }
.as-barra > span.alerta { background: oklch(0.72 0.15 70); }
.as-barra > span.mal { background: oklch(0.58 0.2 25); }
.as-barra .p0 { width: 0; } .as-barra .p21 { width: 21%; } .as-barra .p37 { width: 37%; } .as-barra .p92 { width: 92%; } .as-barra .p100 { width: 100%; }
.as-res { display: flex; gap: 24px; font-size: 13.5px; color: var(--t2); }
.as-res b { color: var(--t1); font-weight: 600; }
.as-tabs { display: flex; gap: 24px; border-bottom: 1px solid var(--borde); }
.as-tabs button { position: relative; height: 40px; padding: 0; border: 0; background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: var(--t2); cursor: pointer; }
.as-tabs button.on { color: var(--t1); }
.as-tabs button.on::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; border-radius: 2px; background: var(--marca); }
.as-tabla .w-tr { font-size: 14px; min-height: 40px; gap: 16px; }
.as-tabla .w-tr:nth-child(odd):not(.w-th) { background: oklch(0.985 0.006 78); }
.as-num { text-align: right; font-variant-numeric: tabular-nums; justify-self: end; display: inline-flex; align-items: center; gap: 4px; }
.as-gris { color: var(--t3); }
.as-hoy { display: inline-flex; align-items: center; gap: 8px; }
.as-mini { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--t2); }
.as-mini .as-barra { width: 90px; flex-shrink: 0; height: 6px; }
.as-tres { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.as-kpi { display: flex; flex-direction: column; gap: 6px; padding: 16px 20px; }
.as-kpi span { font-size: 13px; font-weight: 600; color: var(--t2); }
.as-kpi b { font-size: 26px; font-weight: 600; color: var(--t1); font-variant-numeric: tabular-nums; }
.as-mes { gap: 8px !important; }
.as-mes svg { color: var(--t3); }
.as-vacio2 { padding: 28px 16px; text-align: center; }
.as-pila { display: flex; flex-direction: column; gap: 16px; }
.as-cnt { margin-left: 4px; font-weight: 500; color: var(--t3); }
.as-dlg { padding: 20px 24px !important; }
.as-dlg .w-cmp .ct { height: 44px; }
.as-din input { border: 0; outline: 0; font: inherit; font-size: 14px; color: var(--t1); background: transparent; width: 100%; padding: 0; }
.dlg .as-casilla { align-self: center; }
.as-dlg-mod { max-height: calc(100% - 48px); display: flex; flex-direction: column; }
.as-dlg-mod .dlg-b { overflow: auto; min-height: 0; }
.as-avz { display: flex; align-items: center; gap: 8px; min-height: 44px; margin-top: 4px; padding: 0; border: 0; border-top: 1px solid var(--borde); background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: var(--t1); cursor: pointer; text-align: left; }
.as-avz-f { display: inline-flex; color: var(--t2); transition: transform 0.15s; }
.as-avz[aria-expanded="true"] .as-avz-f { transform: rotate(90deg); }
.as-av-sec { display: flex; flex-direction: column; gap: 12px; }
.as-sub { font-size: 14px; font-weight: 600; color: var(--t1); margin-top: 6px; }
.as-casillas { display: flex; flex-wrap: wrap; gap: 4px 24px; }
.as-casillas .as-casilla { min-height: 36px; }
.as-g2b { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px 20px; }
.as-g3b { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 20px; }
.w-cmp .as-din.mal { border-color: oklch(0.6 0.19 25) !important; }
"""


def panel(t, href_config, href_uso, actual, grupo_wa_href):
    """Administración con el grupo «Asistente» abierto (Configuración y Uso); el de WhatsApp queda cerrado."""
    t = re.sub(r'<a class="w-ln grupo" href="' + re.escape(href_config) + r'">.*?</a>', "", t, flags=re.S)  # si la base ya lo tenía cerrado
    i = t.index('<span class="w-ln grupo">')
    j = t.index("</div>", t.index('<div class="w-hijos">', i)) + len("</div>")
    abierto = t[i:j]
    ico_wa = re.search(r"<svg.*?</svg>", abierto, re.S).group(0)
    fl_abierto = re.search(r'<span class="fl">.*?</span>', abierto, re.S).group(0)
    fl_cerrado = ('<span class="fl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
                  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg></span>')
    wa = f'<a class="w-ln grupo" href="{grupo_wa_href}">{ico_wa} WhatsApp {fl_cerrado}</a>'
    hijos = (f'<a class="w-ln{" on" if actual == "config" else ""}" href="{href_config}">Configuración</a>'
             f'<a class="w-ln{" on" if actual == "uso" else ""}" href="{href_uso}">Uso</a>')
    asis = f'<span class="w-ln grupo">{CHISPA18} Asistente {fl_abierto}</span><div class="w-hijos">{hijos}</div>'
    return t[:i] + wa + asis + t[j:]


def pagina_pc(base, nuevo, titulo_doc, miga, contenido, estados, js, actual, cfg, uso, wa_href):
    ruta = PROJ / f"{nuevo}.dc.html"
    if ruta.exists():
        return False
    t = leer(base)
    t = panel(t, cfg, uso, actual, wa_href)
    t = re.sub(r'(<header class="w-tb"><span>)[^<]*(</span>)', lambda m: m.group(1) + miga + m.group(2), t, count=1)
    a = t.index("</header>", t.index('<header class="w-tb">')) + len("</header>")
    xdc = t.index("</x-dc>")
    b = t.rindex("</div></div>", 0, xdc)
    t = t[:a] + contenido + t[b:]
    t = re.sub(r"<title>[^<]*</title>", f"<title>{titulo_doc}</title>", t, count=1)
    t = poner_script(t, script(estados, 1440, 900, js))
    ruta.write_text(marcar(t, CSS), encoding="utf-8")
    return True


hechos = []
if pagina_pc("WA-Admin", "Asistente-Config-Org", "Administración › Asistente › Configuración", "Inicio / Asistente / Configuración", CONFIG_ORG,
             ESTADOS_CONFIG_ORG, JS_CONFIG_ORG, "config", "Asistente-Config-Org.dc.html", "Asistente-Uso-Org.dc.html", "WA-Admin.dc.html"):
    hechos.append("Asistente-Config-Org")
if pagina_pc("WA-Admin", "Asistente-Uso-Org", "Administración › Asistente › Uso", "Inicio / Asistente / Uso", USO_ORG,
             ESTADOS_USO_ORG, JS_USO_ORG, "uso", "Asistente-Config-Org.dc.html", "Asistente-Uso-Org.dc.html", "WA-Admin.dc.html"):
    hechos.append("Asistente-Uso-Org")
if pagina_pc("Plat-WA-Numero", "Plat-Asistente-Config", "Plataforma › Administración › Asistente › Configuración", "Plataforma / Asistente / Configuración",
             CONFIG_PLAT, ESTADOS_CONFIG_PLAT, JS_CONFIG_PLAT, "config", "Plat-Asistente-Config.dc.html", "Plat-Asistente-Uso.dc.html", "Plat-WA-Numero.dc.html"):
    hechos.append("Plat-Asistente-Config")
if pagina_pc("Plat-WA-Numero", "Plat-Asistente-Uso", "Plataforma › Administración › Asistente › Uso", "Plataforma / Asistente / Uso",
             USO_PLAT, ESTADOS_USO_PLAT, JS_USO_PLAT, "uso", "Plat-Asistente-Config.dc.html", "Plat-Asistente-Uso.dc.html", "Plat-WA-Numero.dc.html"):
    hechos.append("Plat-Asistente-Uso")


# ---------------------------------------------------------------- Teléfonos (sobre M-Config-Plat)
def tcampo(rot, valor, ro=False, sel=False, ph=False, req=False, info=""):
    r = ' <span class="rq">*</span>' if req else ""
    c = "ct" + (" ro" if ro else "") + (" sel" if sel else "") + (" ph" if ph else "")
    return (f'<div class="ap-cmp"><span class="rt"><span>{rot}{r}</span>{INFO_I(info) if info else ""}</span>'
            f'<div class="{c}">{valor}{CHEV_CAMPO if sel else ""}</div></div>')


def tit(texto, primero=False):
    return f'<span class="ap-gtit" style="margin: {"4px" if primero else "14px"} 0 -2px; font-size: 16px; font-weight: 700; color: var(--t1);">{texto}</span>'


T_CONFIG_ORG = (
    tit("Clave y modelo", True)
    + '<sc-if value="{{puedeElegir}}" hint-placeholder-val="{{si}}"><div class="ap-cmp"><span class="rt"><span>Qué clave usa</span></span>'
    + seg("Qué clave usa", [("La de la plataforma", "segPlat", "usarPlat"), ("La nuestra", "segPropia", "usarPropia")])
    + '<sc-if value="{{sinDueno}}" hint-placeholder-val="{{no}}"><span class="as-err" role="alert">Para usar la clave de Grupo Delta, algún Dueño tiene que tener un correo verificado.</span><a class="as-lnk as-err-l" href="M-Cuenta-Agregar.dc.html">Agregar un correo</a></sc-if></div></sc-if>'
    + '<sc-if value="{{noPuedeElegir}}" hint-placeholder-val="{{no}}">' + tcampo("Qué clave usa", "La de la plataforma", ro=True, info="La plataforma no habilitó una clave propia para Grupo Delta.") + '</sc-if>'
    + tcampo("Proveedor", "Anthropic", ro=True)
    + '<sc-if value="{{claveGuardada}}" hint-placeholder-val="{{no}}"><div class="ap-cmp"><span class="rt"><span>Clave de Anthropic <span class="rq">*</span></span></span>'
      '<div class="ct ro as-clave"><span>•••• 4F2a</span><button type="button" class="as-lnk">Cambiar</button></div></div></sc-if>'
    + '<sc-if value="{{sinDueno}}" hint-placeholder-val="{{no}}">' + tcampo("Clave de Anthropic", "Pegá la clave de Anthropic", ph=True, req=True) + '</sc-if>'
    + '<sc-if value="{{propia}}" hint-placeholder-val="{{no}}">' + tcampo("Modelo", "Claude Opus 5.5", sel=True) + '</sc-if>'
    + '<sc-if value="{{noPropia}}" hint-placeholder-val="{{si}}">' + tcampo("Modelo", "Claude Sonnet 5.5", sel=True) + '</sc-if>'
    + tit("Topes")
    + '<sc-if value="{{propia}}" hint-placeholder-val="{{no}}">' + tcampo("Consultas por persona por día", "50", req=True)
    + '<div class="ap-cmp"><span class="rt"><span>Tope del mes</span></span><div class="ct as-din"><span class="as-pre">USD</span><span>200</span></div></div></sc-if>'
    + '<sc-if value="{{noPropia}}" hint-placeholder-val="{{si}}">' + tcampo("Consultas por persona por día", "50", ro=True, info="Los fija la plataforma.")
    + f'<div class="ap-cmp"><span class="rt"><span>Tope del mes</span>{INFO_I("Lo fija la plataforma.")}</span><div class="ct ro as-din"><span class="as-pre">USD</span><span>100</span></div></div></sc-if>')
JS_T_CONFIG_ORG = """    const propia = e === 'Con su clave' || e === 'La nuestra: ningún Dueño con correo verificado';
    return {
      si: true, no: false,
      puedeElegir: e !== 'La plataforma no habilitó su clave', noPuedeElegir: e === 'La plataforma no habilitó su clave',
      segPlat: propia ? '' : 'on', segPropia: propia ? 'on' : '',
      usarPlat: () => ir('Con la clave de la plataforma'), usarPropia: () => ir('Con su clave'),
      propia, noPropia: !propia, sinDueno: e === 'La nuestra: ningún Dueño con correo verificado', claveGuardada: e === 'Con su clave',
    };"""


def tlista(filas):
    return '<div class="as-tlista">' + "".join(
        f'<div class="as-tf"><span class="tx"><b>{a}</b><span>{b}</span></span><span class="as-tf-d">{c}</span></div>' for a, b, c in filas) + '</div>'


def tmedidor():
    return ('<div class="as-tmed"><div class="as-cifra"><b>{{gasto}}</b><span>de USD 100</span><sc-if value="{{conPill}}" hint-placeholder-val="{{no}}">'
            '<span class="pill alerta">Cerca del tope</span></sc-if></div><div class="as-barra"><span class="{{claseBarra}}"></span></div>'
            '<div class="as-res"><span><b>{{consultas}}</b> consultas</span><span><b>9</b> personas</span></div></div>')


T_USO_ORG = (
    tmedidor()
    + '<div class="as-tabs as-ttabs" role="tablist"><button type="button" role="tab" class="{{tabDia}}" onClick="{{verDia}}">Por día</button>'
      '<button type="button" role="tab" class="{{tabPer}}" onClick="{{verPer}}">Por persona</button></div>'
    + '<sc-if value="{{porDia}}" hint-placeholder-val="{{si}}">' + tlista([(d[:5], f"{c} consultas · {p} personas", "USD " + u) for d, c, p, u in DIAS]) + '</sc-if>'
    + '<sc-if value="{{porPer}}" hint-placeholder-val="{{no}}">'
    + tlista([(n, f"Hoy {h} de 50 · {m} en el mes" + (" · <span class=as-tope>Llegó al tope</span>" if h == "50" else ""), "USD " + u) for n, h, m, u in PERSONAS]) + '</sc-if>')
JS_T_USO_ORG = """    const tab = this.state.tab ?? (e === 'Por persona' ? 'per' : 'dia');
    const cerca = e === 'Cerca del tope';
    return {
      si: true, no: false,
      gasto: cerca ? 'USD 92,10' : 'USD 37,40', consultas: cerca ? '3.162' : '1.284', conPill: cerca, claseBarra: cerca ? 'p92 alerta' : 'p37',
      porDia: tab === 'dia', porPer: tab === 'per', tabDia: tab === 'dia' ? 'on' : '', tabPer: tab === 'per' ? 'on' : '',
      verDia: () => this.setState({ tab: 'dia' }), verPer: () => this.setState({ tab: 'per' }),
    };"""


def tentrada(rot, var, ph, req=False, din=False, err=""):
    q = ' <span class="rq">*</span>' if req else ""
    mal = f" {{{{{err}Clase}}}}" if err else ""
    if din:
        c = f'<div class="ct as-din{mal}"><span class="as-pre">USD</span><span class="as-v">{{{{{var}}}}}</span></div>'
    else:
        c = f'<div class="ct{mal}"><span class="as-v">{{{{{var}}}}}</span></div>'
    e = f'<sc-if value="{{{{{err}}}}}" hint-placeholder-val="{{{{no}}}}"><span class="as-err" role="alert">{{{{{err}}}}}</span></sc-if>' if err else ""
    return f'<div class="ap-cmp"><span class="rt"><span>{rot}{q}</span></span>{c}{e}</div>'


T_HOJA_MODELO = (
    '<sc-if value="{{dlgModelo}}" hint-placeholder-val="{{no}}"><div class="as-tvelo"></div><div class="as-thoja" role="dialog" aria-label="{{tituloModelo}}">'
    '<span class="as-tasa"></span>'
    + f'<div class="as-thc"><h2>{{{{tituloModelo}}}}</h2><button type="button" class="ap-ib" aria-label="Cerrar" onClick="{{{{cerrarModelo}}}}">{CERRAR}</button></div>'
    + '<div class="as-thb">'
    + tentrada("Nombre", "mNombre", "", req=True) + tcampo("Proveedor", "Anthropic", sel=True) + tentrada("ID", "mId", "", req=True)
    + tentrada("Precio de entrada por millón", "mEnt", "", req=True, din=True) + tentrada("Precio de salida por millón", "mSal", "", req=True, din=True)
    + casilla("Activo", "cAct")
    + f'<button type="button" class="as-avz" aria-expanded="{{{{avExp}}}}" onClick="{{{{alternarAv}}}}"><span class="as-avz-f">{FLECHA_AV}</span>Avanzado: datos técnicos</button>'
    + '<sc-if value="{{avAbierto}}" hint-placeholder-val="{{no}}"><div class="as-av-sec">'
    + '<span class="as-sub">Capacidades</span><div class="as-casillas">' + casilla("Imágenes en los adjuntos", "cImg") + casilla("PDF en los adjuntos", "cPdf") + casilla("Herramientas", "cHer") + '</div>'
    + '<span class="as-sub">Límites</span>' + tentrada("Contexto (tokens)", "mCtx", "", req=True) + tentrada("Salida máxima (tokens)", "mOut", "", req=True, err="errOut")
    + '<span class="as-sub">Tarifas especiales · por millón de tokens</span>' + tentrada("Lectura de caché", "mCacheL", "", din=True) + tentrada("Escritura de caché", "mCacheE", "", din=True)
    + '<span class="as-sub">Contexto largo</span>'
    + tentrada("Desde (tokens)", "mLargoDesde", "") + tentrada("Entrada por millón", "mLargoEnt", "", din=True) + tentrada("Salida por millón", "mLargoSal", "", din=True)
    + '</div></sc-if></div>'
    '<div class="as-thp"><button type="button" class="cb cb-pri" onClick="{{cerrarModelo}}">{{botonModelo}}</button>'
    '<button type="button" class="cb cb-sec" onClick="{{cerrarModelo}}">Cancelar</button></div></div></sc-if>')

T_CONFIG_PLAT = (
    '<div class="as-tabs as-ttabs" role="tablist"><button type="button" role="tab" class="{{tabGen}}" onClick="{{verGen}}">General</button>'
    '<button type="button" role="tab" class="{{tabCat}}" onClick="{{verCat}}">Catálogo de modelos</button></div>'
    + '<sc-if value="{{enCatalogo}}" hint-placeholder-val="{{no}}">'
    + tlista([(n, f"Anthropic · {i}<br>USD {e} / USD {s} por millón", f'<span class="w-est{"" if a else " off"}">{"Activo" if a else "Inactivo"}</span>') for n, i, e, s, a in CATALOGO])
    + f'<button type="button" class="cb cb-sec as-tagregar" onClick="{{{{agregarModelo}}}}">{MAS} Agregar modelo</button></sc-if>'
    + '<sc-if value="{{enGeneral}}" hint-placeholder-val="{{si}}">'
    + tit("Clave y modelo", True) + tcampo("Proveedor", "Anthropic", ro=True)
    + '<sc-if value="{{conClave}}" hint-placeholder-val="{{si}}"><div class="ap-cmp"><span class="rt"><span>Clave de la plataforma <span class="rq">*</span></span></span>'
      '<div class="ct ro as-clave"><span>•••• 9xQe</span><button type="button" class="as-lnk">Cambiar</button></div></div></sc-if>'
    + '<sc-if value="{{sinClave}}" hint-placeholder-val="{{no}}">' + tcampo("Clave de la plataforma", "Pegá la clave de Anthropic", ph=True, req=True) + '</sc-if>'
    + tcampo("Modelo por defecto", "Claude Sonnet 5.5", sel=True)
    + '<div class="ap-cmp"><span class="rt"><span>Esfuerzo</span></span>' + seg("Esfuerzo", [("Bajo", "efBajo", "nada"), ("Medio", "efMedio", "nada"), ("Alto", "efAlto", "nada")]) + '</div>'
    + tcampo("Modelos que pueden elegir las organizaciones", "Claude Sonnet 5.5, Claude Haiku 5.5", sel=True)
    + tit("Topes") + tcampo("Consultas por persona por día", "50", req=True)
    + '<div class="ap-cmp"><span class="rt"><span>Tope del mes por organización</span></span><div class="ct as-din"><span class="as-pre">USD</span><span>100</span></div></div>'
    + tit("Personas y conversaciones")
    + f'<label class="as-casilla"><span class="as-chk on">{TILDE}</span>Las personas pueden usar el asistente</label>'
    + tcampo("Días sin actividad para borrar una conversación", "30", req=True) + '</sc-if>'
    + T_HOJA_MODELO)
JS_T_CONFIG_PLAT = MODELO_JS + """    return {
      dlgModelo: !!modo,
      tituloModelo: edita ? 'Editar modelo' : 'Agregar modelo',
      botonModelo: edita ? 'Guardar cambios' : 'Agregar modelo',
      mNombre: M.n || '', mId: M.id || '', mEnt: M.ent || '', mSal: M.sal || '', mCtx: M.ctx || '', mOut: M.out || '',
      mCacheL: M.cl || '', mCacheE: M.ce || '', mLargoDesde: '', mLargoEnt: '', mLargoSal: '',
      cImg: M.img ? 'on' : '', cPdf: M.pdf ? 'on' : '', cHer: M.her ? 'on' : '', cAct: 'on',
      errOut: modo === 'error' ? 'No puede superar el contexto.' : '', errOutClase: modo === 'error' ? 'mal' : '',
      avAbierto: av, avExp: av ? 'true' : 'false', alternarAv: () => this.setState({ av: !av }),
      agregarModelo: () => this.setState({ modo: 'nuevo', av: false }), cerrarModelo: () => this.setState({ modo: null, av: undefined }),
      si: true, no: false, conClave: e !== 'Sin clave', sinClave: e === 'Sin clave', efBajo: 'on', efMedio: '', efAlto: '', nada: () => {},
      enGeneral: tab === 'gen', enCatalogo: tab === 'cat', tabGen: tab === 'gen' ? 'on' : '', tabCat: tab === 'cat' ? 'on' : '',
      verGen: () => this.setState({ tab: 'gen' }), verCat: () => this.setState({ tab: 'cat' }),
    };"""

T_USO_PLAT = (
    '<div class="as-tkpis"><div><span>Costo con la clave de la plataforma</span><b>USD 68,20</b></div><div><span>Consultas</span><b>4.920</b></div></div>'
    + tlista([(o, f"{c} consultas · {k}" + (f" · {tt}" if tt.startswith("Su") else ""), ("USD " + u)) for o, k, c, u, b, tt in ORGS]))
JS_T_USO_PLAT = """    return { si: true, no: false };"""

CSS_TEL = CSS + """.ap-cmp .ct.ro { background: var(--s2) !important; color: var(--t2) !important; border-color: var(--borde) !important; }
.ap-cmp .ct.sel { display: flex; align-items: center; justify-content: space-between; }
.ap-cmp .ct.sel svg { color: var(--t3); flex-shrink: 0; }
.ap-cmp .ct.ph { color: var(--t3); }
.ap-cmp .rt { display: flex; align-items: center; justify-content: flex-start !important; gap: 4px; }
.ap-cmp .as-seg { height: 48px; }
.ap-cmp .as-seg button { font-size: 15px; }
.ap-cmp .as-clave { display: flex; align-items: center; justify-content: space-between; }
.ap-cmp .as-din { display: flex; align-items: center; }
.ap .as-casilla { font-size: 16px; min-height: 48px; }
.ap .as-chk { width: 22px; height: 22px; }
.as-tmed { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border: 1px solid var(--borde); border-radius: 14px; }
.as-tmed .as-res { font-size: 14px; }
.as-ttabs { gap: 20px; margin-top: 4px; }
.as-ttabs button { height: 44px; font-size: 15px; }
.as-tlista { display: flex; flex-direction: column; }
.as-tf { display: flex; align-items: center; gap: 12px; min-height: 60px; border-bottom: 1px solid var(--borde); }
.as-tf .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.as-tf .tx b { font-size: 16px; font-weight: 600; }
.as-tf .tx span { font-size: 14px; color: var(--t2); }
.as-tf-d { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
.as-tope { color: oklch(0.55 0.13 70) !important; font-weight: 600; }
.as-tkpis { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.as-tkpis > div { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border: 1px solid var(--borde); border-radius: 14px; }
.as-tkpis span { font-size: 13px; font-weight: 600; color: var(--t2); }
.as-tkpis b { font-size: 22px; font-weight: 600; }
.as-tf .as-tf-d .w-est { font-size: 14px; font-weight: 500; }
.as-tagregar { margin-top: 12px; width: 100%; height: 48px !important; font-size: 16px !important; }
.as-tvelo { position: absolute; inset: 0; z-index: 30; background: oklch(0.2 0.014 78 / 0.42); }
.as-thoja { position: absolute; left: 0; right: 0; bottom: 0; z-index: 31; max-height: 88%; display: flex; flex-direction: column; background: #fff; border-radius: 16px 16px 0 0; padding: 6px 0 28px; box-shadow: 0 -8px 24px oklch(0.2 0.014 78 / 0.12); }
.as-tasa { width: 36px; height: 4px; border-radius: 2px; background: var(--borde2); align-self: center; margin: 4px 0 6px; flex-shrink: 0; }
.as-thc { display: flex; align-items: center; justify-content: space-between; padding: 2px 8px 8px 20px; }
.as-thc h2 { margin: 0; font-size: 18px; font-weight: 600; }
.as-thb { overflow: auto; min-height: 0; padding: 4px 20px 12px; display: flex; flex-direction: column; gap: 14px; }
.as-thb .as-casilla { align-self: flex-start; }
.as-thb .as-casillas { flex-direction: column; gap: 0; }
.as-thb .as-casillas .as-casilla { min-height: 44px; }
.as-thb .as-avz { font-size: 16px; min-height: 52px; }
.as-thp { display: flex; flex-direction: column; gap: 10px; padding: 12px 20px 0; border-top: 1px solid var(--borde); }
.as-thp .cb { width: 100%; height: 48px; font-size: 16px; }
.ap-cmp .ct.mal { border-color: oklch(0.6 0.19 25) !important; }
"""


def pagina_tel(nuevo, titulo, sub, volver, contenido, estados, js, botones=True, pie_si=""):
    ruta = PROJ / f"{nuevo}.dc.html"
    if ruta.exists():
        return False
    t = leer("M-Config-Plat")
    t = rep(t, 'href="M-Mas-Plat.dc.html"', f'href="{volver}"')
    t = rep(t, "<h1>Configuración</h1><span class=\"sub\">Administración</span>", f'<h1>{titulo}</h1><span class="sub">{sub}</span>')
    a = t.index('<div class="ap-cuerpo"')
    b = t.index('<span class="ap-raya">')
    pie = ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar cambios</button>'
           '<button type="button" class="cb cb-pri full apag">Guardar cambios</button></div>') if botones else ""
    if pie and pie_si:
        pie = '<sc-if value="{{' + pie_si + '}}" hint-placeholder-val="{{si}}">' + pie + '</sc-if>'
    t = t[:a] + f'<div class="ap-cuerpo" style="padding: 4px 20px 16px; gap: 14px; overflow: auto;">{contenido}</div>{pie}' + t[b:]
    t = re.sub(r"<title>[^<]*</title>", f"<title>{titulo} del asistente · teléfono</title>", t, count=1)
    t = poner_script(t, script(estados, 390, 844, js))
    ruta.write_text(marcar(t, CSS_TEL), encoding="utf-8")
    return True


if pagina_tel("M-Asistente-Config-Org", "Configuración", "Asistente", "M-WA-Menu.dc.html", T_CONFIG_ORG,
              ["Con la clave de la plataforma", "Con su clave", "La nuestra: ningún Dueño con correo verificado", "La plataforma no habilitó su clave"], JS_T_CONFIG_ORG):
    hechos.append("M-Asistente-Config-Org")
if pagina_tel("M-Asistente-Uso-Org", "Uso", "Asistente · octubre de 2026", "M-WA-Menu.dc.html", T_USO_ORG,
              ["Por día", "Por persona", "Cerca del tope"], JS_T_USO_ORG, botones=False):
    hechos.append("M-Asistente-Uso-Org")
if pagina_tel("M-Plat-Asistente-Config", "Configuración", "Asistente", "M-Mas-Plat.dc.html", T_CONFIG_PLAT,
              ["Configurada", "Sin clave", "Catálogo de modelos", "Agregar un modelo", "Agregar un modelo: avanzado",
               "Editar un modelo", "Editar un modelo: error en un dato técnico"], JS_T_CONFIG_PLAT, pie_si="enGeneral"):
    hechos.append("M-Plat-Asistente-Config")
if pagina_tel("M-Plat-Asistente-Uso", "Uso", "Asistente · octubre de 2026", "M-Mas-Plat.dc.html", T_USO_PLAT,
              ["Por organización"], JS_T_USO_PLAT, botones=False):
    hechos.append("M-Plat-Asistente-Uso")

# ---------------------------------------------------------------- Organizacion › Módulos (compu)
t = leer("Organizacion")
if MARCA not in t:
    t = rep(t, "  { id: 'b', n: 'Módulo B', estado: 'prueba', origen: 'Prueba', hasta: '27/10/2026' },",
            "  { id: 'b', n: 'Asistente', estado: 'prendido', origen: 'Manual', hasta: '', clave: false },")
    t = rep(t, '<span class="c1">{{m.n}}</span>',
            '<span class="dos"><span class="c1">{{m.n}}</span><sc-if value="{{m.conClave}}" hint-placeholder-val="{{no}}"><span class="n2">{{m.textoClave}}</span></sc-if></span>')
    t = rep(t, '<sc-if value="{{m.sepApagar}}" hint-placeholder-val="{{no}}">',
            f'<sc-if value="{{{{m.puedeClave}}}}" hint-placeholder-val="{{{{no}}}}"><button type="button" class="menu-it" role="menuitem" onClick="{{{{m.alternarClave}}}}">{LLAVE} {{{{m.textoBotonClave}}}}</button></sc-if>'
            '<sc-if value="{{m.sepApagar}}" hint-placeholder-val="{{no}}">')
    t = rep(t, "      sepApagar: prueba,\n",
            "      sepApagar: prueba || (m.id === 'b' && m.estado !== 'apagado'),\n"
            "      conClave: m.id === 'b',\n"
            "      textoClave: m.clave ? 'Puede usar su clave' : 'Con la clave de la plataforma',\n"
            "      puedeClave: m.id === 'b' && m.estado !== 'apagado' && this.state.estadoOrg !== 'cerrada',\n"
            "      textoBotonClave: m.clave ? 'Solo con la clave de la plataforma' : 'Permitir su propia clave',\n"
            "      alternarClave: () => this.pedirConfirmacion({ titulo: m.clave ? '¿Dejar a Grupo Delta solo con la clave de la plataforma?' : '¿Permitir que Grupo Delta use su propia clave?', "
            "texto: m.clave ? 'El asistente vuelve a usar la clave y los topes de la plataforma.' : 'Grupo Delta puede cargar su clave de Anthropic y fijar sus topes.', "
            "boton: m.clave ? 'Solo la de la plataforma' : 'Permitir', peligro: false, motivo: true, "
            "accion: (x) => this.cambiarModulo(m.id, { clave: !m.clave }, m.clave ? 'Quitó la clave propia del Asistente' : 'Permitió la clave propia del Asistente', "
            "m.clave ? 'Grupo Delta vuelve a la clave de la plataforma.' : 'Grupo Delta puede usar su propia clave.', x) }),\n")
    (PROJ / "Organizacion.dc.html").write_text(marcar(t, ".tt-f .dos { display: flex; flex-direction: column; min-width: 0; }\n.tt-f .dos .n2 { font-size: 12.5px; color: var(--t3); }\n"), encoding="utf-8")
    hechos.append("Organizacion")

# ---------------------------------------------------------------- M-Organizacion › Módulos (teléfono, estado nuevo)
t = leer("M-Organizacion")
if MARCA not in t:
    i, j = rango_bloque(t, "e0")
    b = t[i:j]
    b = re.sub(r'^<sc-if value="\{\{e0\}\}" hint-placeholder-val="\{\{(si|no)\}\}">', '<sc-if value="{{eMod}}" hint-placeholder-val="{{no}}">', b, count=1)
    b = rep(b, '<span class="on" role="tab">Historial', '<span role="tab">Historial')
    b = rep(b, '<span role="tab">Módulos', '<span class="on" role="tab">Módulos')
    cuerpo = re.search(r'<div class="ap-cuerpo">.*?</div>(?=\s*<nav class="ap-nav")', b, re.S)
    filas = (f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">WhatsApp</span><span class="w-est">Prendido</span></span>'
             f'<span class="l2">Plan</span></div><button type="button" class="ap-ib" aria-label="Acciones de WhatsApp">{KEBAB}</button></div>'
             f'<div class="ap-fila"><div class="tx"><span class="l1"><span class="q">Asistente</span><span class="w-est">Prendido</span></span>'
             f'<span class="l2">Manual · Con la clave de la plataforma</span></div><button type="button" class="ap-ib" aria-label="Acciones de Asistente">{KEBAB}</button></div>')
    b = b[:cuerpo.start()] + f'<div class="ap-cuerpo">{filas}</div>' + b[cuerpo.end():]
    hoja = ('<div class="as-velo"></div><div class="as-hoja" role="dialog" aria-label="Asistente"><span class="as-asa"></span>'
            f'<div class="as-hc"><h2>Asistente</h2><button type="button" class="ap-ib" aria-label="Cerrar">{CERRAR}</button></div>'
            f'<div class="as-hacc"><button type="button" class="as-ha">{LLAVE}<span>Permitir su propia clave</span></button>'
            f'<button type="button" class="as-ha pel">{APAGAR}<span>Apagar</span></button></div></div>')
    b2 = b.replace('<sc-if value="{{eMod}}"', '<sc-if value="{{eModAcc}}"', 1)
    b2 = b2[:b2.rindex("</sc-if>")] + hoja + "</sc-if>"
    t = t[:j] + b + b2 + t[j:]
    t = sumar_opcion(t, "Historial", "Módulos")
    t = sumar_opcion(t, "Módulos", "Módulos: acciones del Asistente")
    linea = '      e0: e === "Historial",\n'
    t = rep(t, linea, linea + '      eMod: e === "Módulos",\n      eModAcc: e === "Módulos: acciones del Asistente",\n')
    css_hoja = re.search(r"\.as-velo \{.*?\n\.as-pel", open(pathlib.Path(__file__).resolve().parent / "asistente_inicio_1004.py", encoding="utf-8").read(), re.S).group(0)
    css_hoja = css_hoja[:css_hoja.rindex("\n")] + "\n"
    (PROJ / "M-Organizacion.dc.html").write_text(marcar(t, css_hoja + ".ap-fila .ap-ib { flex-shrink: 0; }\n"), encoding="utf-8")
    hechos.append("M-Organizacion")

# ---------------------------------------------------------------- canvas.json
lienzo = PROJ / "canvas.json"
c = json.loads(lienzo.read_text(encoding="utf-8"))
NUEVOS = [("org", "Asistente-Config-Org", 1440, 900, "Administración › Asistente › Configuración"),
          ("org", "Asistente-Uso-Org", 1440, 900, "Administración › Asistente › Uso"),
          ("org", "M-Asistente-Config-Org", 390, 844, "Asistente › Configuración · teléfono"),
          ("org", "M-Asistente-Uso-Org", 390, 844, "Asistente › Uso · teléfono"),
          ("plataforma", "Plat-Asistente-Config", 1440, 900, "Administración › Asistente › Configuración"),
          ("plataforma", "Plat-Asistente-Uso", 1440, 900, "Administración › Asistente › Uso"),
          ("plataforma", "M-Plat-Asistente-Config", 390, 844, "Asistente › Configuración · teléfono"),
          ("plataforma", "M-Plat-Asistente-Uso", 390, 844, "Asistente › Uso · teléfono")]
cambio = False
for pag in ["org", "plataforma"]:
    nuevos = [n for n in NUEVOS if n[0] == pag and f"{n[1]}.dc.html" not in c["boards"]]
    if not nuevos:
        continue
    # A la derecha de la fila del asistente en el inicio.
    ref = c["boards"]["Asistente-Org.dc.html" if pag == "org" else "Asistente-Plat.dc.html"]
    x = 1990
    for _, n, w, h, tt in nuevos:
        c["boards"][f"{n}.dc.html"] = {"x": x, "y": ref["y"], "w": w, "h": h, "title": tt, "page": pag, "is_interactive": True}
        c["order"].append(f"{n}.dc.html")
        x += w + 80
    cambio = True
if cambio:
    lienzo.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
print("tableros", hechos)
