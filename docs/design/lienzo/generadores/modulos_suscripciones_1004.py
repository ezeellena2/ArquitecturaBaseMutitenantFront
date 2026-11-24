"""La etapa «Módulos y suscripciones» (ADR 0069 del back; spec `docs/plans/formularios/modulos-y-suscripciones.md`), que va
después de la E25: la organización pide, prueba, se suscribe, cambia la tarjeta, da de baja y exporta sus módulos, y Plataforma
ofrece cada módulo con sus precios, resuelve los pedidos, ve las suscripciones con sus cobros, fija los topes de una organización
y carga los plazos y las claves de Mercado Pago.

Escribe, en la página «Módulos y suscripciones» de un lienzo aparte (su índice es `canvas-modulos.json`, porque el principal
llegó a los 512 archivos que admite una versión con la v180), los tableros que el usuario aprobó el 2026-11-24:
- en la organización: `MOD-Modulos`, `MOD-Suscribir`, `MOD-Pedir` (con la propuesta del asistente, ADR 0068), `MOD-Confirmar`
  y `MOD-Exportar`;
- en Plataforma: `Plat-MOD-Catalogo`, `Plat-MOD-Modulo`, `Plat-MOD-Precio`, `Plat-MOD-Pedidos`, `Plat-MOD-Suscripciones`,
  `Plat-Org-Modulos` (la pestaña «Módulos» de una organización, redibujada) y `Config-Plat-Modulos`;
- los ocho avisos, en `Mensajes-Modulos`;
- cada uno con su teléfono (`M-`), salvo `Mensajes-Modulos`.

Cada tablero muestra solo lo que existe hasta acá (78): la etapa va después de la E25. Todos llevan cargando, vacío, error con
«Reintentar», sin permiso y un módulo suspendido; los de Plataforma que muestran una organización, además, la organización
suspendida y la cerrada. Las acciones de una fila van en su ⋮ (261), lo que se elige en la pieza (262), nada debajo de otro dato
(263), lo apagado con su motivo en un tooltip (211) y los avisos blancos con su filo (210).

Parte de la copia de los tableros de siempre en la v179, ya dibujados, de `modulos_suscripciones_1004/` (la arma `capturar.mjs` de
esa carpeta), y escribe las medidas de antes de la escala: después va `traspaso10_piezas_1004.py --tableros <los de acá>`, que pone
las piezas y la escala de la compu (180). Se puede volver a correr.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
COPIA = pathlib.Path(__file__).resolve().parent / "modulos_suscripciones_1004"
# El id de la página es el de la propuesta, para que sigan andando los enlaces de antes (aprobada el 2026-11-24).
PAGINA = {"id": "propuesta-modulos", "name": "Módulos y suscripciones"}
MARCA = 'data-mod="modulos"'


def copia(nombre):
    t = (COPIA / f"{nombre}.html").read_text(encoding="utf-8").strip()
    return t.replace("​", "")


def una_vez(t, viejo, nuevo):
    assert t.count(viejo) == 1, (t.count(viejo), viejo[:140])
    return t.replace(viejo, nuevo)


def svgs(t, desde, hasta):
    """Los `<svg>` de `t` entre `desde` y el primer `hasta` después."""
    i = t.index(desde)
    j = t.index(hasta, i)
    return re.findall(r"<svg\b.*?</svg>", t[i:j], re.S)


# ---------------------------------------------------------------------------------------------------------------- el tablero
def cabeza(base, titulo, otra=None):
    """Todo lo de `base` hasta `</helmet>`, con su título, y los estilos que la base tiene fuera del helmet. Con `otra`, suma los
    estilos de esa otra base que `base` no tiene (como `acciones_asistente_1004.py`)."""
    t = (PROJ / f"{base}.dc.html").read_text(encoding="utf-8")
    i = t.index("</helmet>")
    j = t.index("</x-dc>")
    afuera = "".join(re.findall(r"<style\b[^>]*>.*?</style>", t[i:j], re.S))
    cab = re.sub(r"<title>.*?</title>", f"<title>{titulo}</title>", t[:i], count=1)
    cab = re.sub(r"<style " + re.escape(MARCA) + r">.*?</style>\n?", "", cab, flags=re.S)
    if otra:
        o = (PROJ / f"{otra}.dc.html").read_text(encoding="utf-8")
        k = o.index("</helmet>")
        propios = re.findall(r"<style\b[^>]*>.*?</style>", cab, re.S)
        suma = [b for b in re.findall(r"<style\b[^>]*>.*?</style>", o[:k], re.S)
                if b not in propios and 'data-t10="piezas"' not in b and MARCA not in b]
        cab += "\n".join(suma) + "\n"
        afuera += "".join(b for b in re.findall(r"<style\b[^>]*>.*?</style>", o[k:o.index("</x-dc>")], re.S) if b not in afuera)
    return cab, afuera


def sc_if(i, cuerpo):
    return '<sc-if value="{{e%d}}" hint-placeholder-val="{{%s}}">%s</sc-if>' % (i, "si" if i == 0 else "no", cuerpo)


def por_estado(cuerpos):
    if all(c == cuerpos[0] for c in cuerpos):
        return cuerpos[0]
    return "".join(sc_if(i, c) for i, c in enumerate(cuerpos) if c)


def tablero(base, titulo, css, marco, rellenos, estados, ancho, alto, otra=None):
    """`marco` lleva `@X@` en cada lugar que cambia según el estado; `rellenos` da, por cada uno, una lista con lo de cada estado."""
    cab, afuera = cabeza(base, titulo, otra)
    for clave, lista in rellenos.items():
        assert len(lista) == len(estados), (titulo, clave, len(lista), len(estados))
        assert clave in marco, (titulo, clave)
        marco = marco.replace(clave, por_estado(lista))
    assert not re.search(r"@[A-Z_]+@", marco), re.findall(r"@[A-Z_]+@", marco)[:5]
    props = {"estado": {"editor": "enum", "options": estados, "default": estados[0], "section": "Estado"},
             "$preview": {"width": ancho, "height": alto}}
    texto_props = json.dumps(props, ensure_ascii=False, separators=(",", ":"))
    assert "'" not in texto_props
    lista = json.dumps(estados, ensure_ascii=False)
    vals = ", ".join(f"e{i}: k === {i}" for i in range(len(estados)))
    guion = (f"<script type=\"text/x-dc\" data-dc-script data-props='{texto_props}'>\n"
             "class Component extends DCLogic {\n"
             "  renderVals() {\n"
             f"    const k = {lista}.indexOf(this.props.estado ?? {json.dumps(estados[0], ensure_ascii=False)});\n"
             f"    return {{ si: true, no: false, {vals} }};\n"
             "  }\n"
             "}\n"
             "</script>\n</body>\n</html>\n")
    assert "{{" not in re.sub(r"\{\{(e\d+|si|no)\}\}", "", marco), "una variable sin valor"
    return f"{cab}<style {MARCA}>\n{css}</style>\n</helmet>\n{afuera}\n{marco}\n</x-dc>\n{guion}"


# ---------------------------------------------------------------------------------------------------------------- íconos
def icono(d, tam=16, ancho="1.75"):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{ancho}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>')


I_GRILLA = icono('<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/>'
                 '<rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>')
I_TARJETA = icono('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/><path d="M6.5 15h4"/>')
I_RELOJ = icono('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')
I_ENVIAR = icono('<path d="M21 3 10 14"/><path d="m21 3-6.5 18-4.5-7-7-4.5Z"/>')
I_CANCELAR = icono('<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>')
I_BAJA = icono('<path d="M12 3v9"/><path d="M6.6 6.6a8 8 0 1 0 10.8 0"/>')
I_BAJAR = icono('<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>')
I_PRECIO = icono('<path d="M3.5 12.5 11 5h8.5v8.5L12 21Z"/><circle cx="15.5" cy="8.5" r="1.2"/>')
I_MARCAS = icono('<rect x="2.5" y="7" width="19" height="10" rx="5"/><circle cx="16.5" cy="12" r="2.5"/>')
I_APROBAR = icono('<path d="m5 12.5 4.5 4.5L19 7.5"/>')
I_RECHAZAR = icono('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>')
I_OJO = icono('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>')
I_LAPIZ = icono('<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>')
I_TACHO = icono('<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/>')
I_REEMPLAZAR = icono('<path d="M20 11a8 8 0 0 0-14.5-4.5L3.5 9"/><path d="M3.5 4v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.5l2-2.5"/><path d="M20.5 20v-5h-5"/>')
I_COPIAR = icono('<rect x="8.5" y="8.5" width="12" height="12" rx="1.5"/><path d="M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5"/>')
I_PRENDER = icono('<rect x="2.5" y="7" width="19" height="10" rx="5"/><circle cx="16.5" cy="12" r="2.5"/>')
I_APAGAR = icono('<rect x="2.5" y="7" width="19" height="10" rx="5"/><circle cx="7.5" cy="12" r="2.5"/>')
I_CANDADO = icono('<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>', 22)
I_INFO = icono('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>', 14)
I_INFO16 = icono('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.4"/>')
I_OK = icono('<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/>', 16, "2")
I_ATEN = icono('<path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4"/><path d="M12 17h.01"/>', 16, "2")
I_ERROR = icono('<path d="M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2Z"/><path d="M12 8v4.5"/><path d="M12 16h.01"/>', 16, "2")
I_X = icono('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 18, "2")
I_FLECHA = icono('<path d="m7 10 5 5 5-5"/>', 14, "2")
I_ATRAS = icono('<path d="m15 6-6 6 6 6"/>', 16, "2")
I_KEB = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/>'
         '<circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>')
I_KEB_T = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.5" r="1.7"/>'
           '<circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18.5" r="1.7"/></svg>')
I_ATRAS_T = icono('<path d="m15 6-6 6 6 6"/>', 24, "2")
I_X_T = icono('<path d="M7 7l10 10"/><path d="M17 7 7 17"/>', 22, "2")
I_CHEV_T = icono('<path d="m9 6 6 6-6 6"/>', 18, "2")
I_FLECHA_T = icono('<path d="m7 10 5 5 5-5"/>', 18, "2")
I_TILDE = icono('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 12, "3")
I_TILDE_T = icono('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 18, "2.4")
I_FECHA = icono('<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>', 14)
I_MAS = icono('<path d="M12 5v14M5 12h14"/>', 14, "2")
ARO = '<span class="mod-aro" aria-hidden="true"></span>'


# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala: la pasada de las piezas las achica en la compu.
CSS_COMUN = """
/* Módulos y suscripciones (ADR 0069). La (i) y su tooltip; abierta, para verla en el tablero (211). */
.mod-i { position: relative; display: inline-flex; align-items: center; margin-left: 4px; color: var(--t3); cursor: help; vertical-align: -2px; }
.mod-tip { position: absolute; z-index: 60; left: -12px; top: calc(100% + 8px); width: max-content; max-width: 300px; padding: 7px 10px; border-radius: 6px; background: oklch(0.27 0.012 60); color: #fff; font-size: @LETRAT@; font-weight: 400; line-height: 1.4; white-space: normal; text-align: left; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); }
.mod-tip::before { content: ""; position: absolute; left: 14px; bottom: 100%; border: 6px solid transparent; border-bottom-color: oklch(0.27 0.012 60); }
.mod-tip.arriba { top: auto; bottom: calc(100% + 8px); }
.mod-tip.arriba::before { bottom: auto; top: 100%; border-bottom-color: transparent; border-top-color: oklch(0.27 0.012 60); }
.mod-tip.der { left: auto; right: -12px; }
.mod-tip.der::before { left: auto; right: 14px; }
.mod-apag { position: relative; display: inline-flex; }

/* Los avisos según su tipo (210): blancos, con el filo de 3 px y el ícono del color de su tipo. */
.mod-av { --mod-tipo: var(--t2); display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid var(--borde2); border-left: 3px solid var(--mod-tipo); border-radius: 3px; background: #fff; color: var(--t1); font-size: @LETRA@; line-height: 1.45; }
.mod-av > svg { flex: none; margin-top: 1px; color: var(--mod-tipo); }
.mod-av .tx { flex: 1; min-width: 0; }
.mod-av.aten { --mod-tipo: oklch(0.7 0.15 70); }
.mod-av.ok { --mod-tipo: oklch(0.55 0.13 155); }
.mod-av.mal { --mod-tipo: oklch(0.55 0.2 25); }
.mod-av .acc { flex: none; display: flex; gap: 8px; align-items: center; }

/* El aro: lo que carga y el botón que trabaja (115 y 160). */
.mod-aro { display: inline-block; width: 14px; height: 14px; box-sizing: border-box; margin-right: 6px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; vertical-align: -2px; animation: mod-girar 0.8s linear infinite; }
.mod-aro.grande { width: 22px; height: 22px; margin: 0; border-width: 2.5px; border-color: oklch(0.89 0.031 95); border-top-color: var(--marca); }
@keyframes mod-girar { to { transform: rotate(360deg); } }
"""

CSS_COMPU = CSS_COMUN.replace("@LETRA@", "13px").replace("@LETRAT@", "12.5px") + """
/* La compu. La primera carga de un listado: el encabezado y el aro en el alto de ocho filas, sin filas esqueleto (160). */
.mod-carga { height: 320px; display: flex; align-items: center; justify-content: center; }
.mod-bloque { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 16px; text-align: center; font-size: 14px; }
.mod-bloque strong { font-weight: 600; color: var(--t1); }
.mod-centro { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
.mod-centro .circ { display: inline-flex; width: 52px; height: 52px; align-items: center; justify-content: center; border-radius: 3px; background: var(--s2, oklch(0.965 0.012 95)); color: var(--t2); }
.mod-centro h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--t1); }
.mod-pagina { position: relative; }
.mod-espera { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 72px 16px; text-align: center; }
.mod-espera h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--t1); }

/* Las tablas de la etapa: un dato por columna (206), con la columna ordenada marcada (264). */
.tt-h .ord { margin-left: 4px; font-size: 10px; }
.tt-f .mod-c { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tt-f .mod-c.t2 { color: var(--t2); }
.tt-f .mod-c.t3 { color: var(--t3); }
.tt-f.mod-grupo { background: oklch(0.975 0.006 95) !important; font-weight: 600; }
.tt-f.mod-sub > span:first-child { padding-left: 28px; }
.tt-f .mod-nombre { color: var(--t1); font-weight: 600; text-decoration: none; }
.tt-f.mod-marcada { box-shadow: inset 3px 0 0 var(--marca); }
.tarjeta .envoltura { position: relative; }
.mod-menu { position: absolute; z-index: 50; top: calc(100% + 4px); right: 0; min-width: 220px; }
.mod-menu .menu-it { display: flex; align-items: center; gap: 8px; width: 100%; }
.mod-menu .menu-it svg { color: var(--t3); flex: none; }
.mod-menu .menu-it.pel svg { color: inherit; }
.mod-menu .menu-it.apagado { position: relative; color: var(--t3); cursor: default; }
.mod-menu .menu-it .mod-tip { left: 8px; }

/* Las zonas de una página: el encabezado con su título y, a la derecha, solo su acción (145). */
.mod-zonas { display: flex; flex-direction: column; gap: 16px; }
.mod-zona { background: #fff; border: 1px solid var(--borde); border-radius: 3px; }
.mod-zona > .cab { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 16px; border-bottom: 1px solid var(--borde); background: oklch(0.945 0.027 95); border-radius: 3px 3px 0 0; }
.mod-zona > .cab h2 { margin: 0 auto 0 0; font-size: 14px; font-weight: 600; color: var(--t1); }
.mod-zona > .cuerpo { padding: 16px; }
.mod-zona > .cuerpo.sin { padding: 0; }
.mod-zona > .cuerpo.sin .tarjeta { border: 0; border-radius: 0; }
.mod-zona > .campos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 20px; padding: 16px; }
.mod-zona .ancho { grid-column: 1 / -1; }

/* Lo que se lee, en su grilla (138): el rótulo y el valor, cada uno en su columna. */
.mod-dl { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 10px 16px; font-size: 14px; }
.mod-dl.dos { grid-template-columns: 200px minmax(0, 1fr) 200px minmax(0, 1fr); }
.mod-dl .k { color: var(--t2); }
.mod-dl .v { color: var(--t1); min-width: 0; overflow-wrap: anywhere; }
.velo .mod-dl { grid-template-columns: 170px minmax(0, 1fr); font-size: 13.5px; }

/* La tarjeta de Mercado Pago: sus campos los dibuja MercadoPago.js, con la forma de los nuestros. */
.mod-mp { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 20px; }
.mod-mp .in2 { display: flex; align-items: center; justify-content: space-between; text-align: left; color: var(--t1); }
.mod-mp .in2.vacio { color: var(--t3); }
.mod-mp .in2.mal { border-color: oklch(0.57 0.2 25 / 0.7); }
.mod-mp .err { display: block; margin-top: 5px; color: oklch(0.52 0.19 25); font-size: 12.5px; }
.mod-acepto { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.45; color: var(--t1); }
.mod-acepto input { width: 16px; height: 16px; margin: 2px 0 0; flex: none; accent-color: var(--marca); }
.mod-clave { display: flex; align-items: center; gap: 12px; }
.mod-clave .val { flex: 1; font-family: ui-monospace, Consolas, monospace; letter-spacing: 0.02em; }
.mod-clave .val.vacio { font-family: inherit; color: var(--t3); }
.mod-url { display: flex; align-items: center; gap: 8px; }
.mod-url code { flex: 1; min-width: 0; padding: 0 10px; height: 36px; display: inline-flex; align-items: center; border: 1px solid var(--borde); border-radius: 3px; background: var(--s3); font-size: 13px; color: var(--t1); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* Los plazos (270): cada uno con su (i), su mínimo y su máximo. */
.mod-plazos { font-size: 14px; }
.mod-plazos .f { display: grid; grid-template-columns: minmax(0, 1fr) 150px 110px 110px; align-items: center; gap: 0 16px; min-height: 52px; padding: 0 16px; border-top: 1px solid var(--borde); }
.mod-plazos .f.h { min-height: 40px; border-top: 0; background: oklch(0.945 0.027 95); color: var(--t2); font-weight: 600; font-size: 13px; }
.mod-plazos .num { text-align: right; }
.mod-plazos .in2 { width: 100%; }
.mod-plazos .err { grid-column: 2 / -1; padding-bottom: 8px; color: oklch(0.52 0.19 25); font-size: 12.5px; }
.mod-plazos .in2.mal { border-color: oklch(0.57 0.2 25 / 0.7); }

/* Los diálogos de la etapa. */
.velo .dlg .dlg-b .mod-av, .velo .dlg .dlg-b .mod-dl, .velo .dlg .dlg-b .mod-acepto { grid-column: 1 / -1; }
.velo .dlg.medio { width: 560px; }
.velo .b[aria-disabled="true"] { opacity: 0.55; cursor: default; }
.mod-btn-apag { position: relative; display: inline-flex; }
.mod-btn-apag .b { opacity: 0.55; cursor: default; }
.mod-btn-apag .mod-tip { left: auto; right: 0; }
.mod-btn-apag .mod-tip::before { left: auto; right: 18px; }
.mod-campo-err { display: block; margin-top: 5px; color: oklch(0.52 0.19 25); font-size: 12.5px; }
.in2.mal { border-color: oklch(0.57 0.2 25 / 0.7) !important; }
.mod-pre { display: flex; align-items: center; }
.mod-pre .pf { padding: 0 0 0 10px; color: var(--t2); }
.mod-pre .in2 { border: 0 !important; box-shadow: none !important; flex: 1; }
.mod-prebox { display: flex; align-items: center; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; }
.mod-prebox .uni { padding: 0 10px; color: var(--t2); white-space: nowrap; }
.mod-prebox .in2 { border: 0 !important; flex: 1; min-width: 0; }
.mod-lista { position: absolute; z-index: 60; left: 0; right: 0; top: calc(100% + 4px); padding: 4px 0; border: 1px solid var(--borde2); border-radius: 3px; background: #fff; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); }
.mod-lista .op { position: relative; display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 0 12px; font-size: 14px; color: var(--t1); border-top: 1px solid var(--borde); }
.mod-lista .op:first-child { border-top: 0; }
.mod-lista .op .tl { margin-left: auto; color: var(--marca-tx); display: inline-flex; }
.mod-lista .op.sel { font-weight: 600; box-shadow: inset 2px 0 0 var(--marca); }
.mod-lista .op.apag { color: var(--t3); cursor: default; }
.mod-lista .op .mod-tip { left: 40px; }
.campo2.envoltura { position: relative; }
.velo .mod-lista { position: static; margin-top: 4px; box-shadow: none; }

/* «Confirmá que sos vos», como en Configuración de Plataforma. */
.ra .otp { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.ra .otp input { height: 44px; width: 100%; box-sizing: border-box; padding: 0; border: 1px solid var(--borde2); border-radius: 3px; text-align: center; font-size: 20px; font-weight: 600; color: var(--t1); background: #fff; }
.ra .ra-rec { justify-self: start; font-size: 13.5px; margin-top: 4px; }

/* «Propuesta del asistente» junto al título (regla 9 de la 0068), como en los tableros `*-Propuesta`. */
.mod-dh { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; }
.mod-prop { display: inline-flex; align-items: center; gap: 5px; color: var(--marca-tx); font-size: 13px; font-weight: 500; white-space: nowrap; }
.mod-prop svg { width: 14px; height: 14px; flex: none; }

/* El aviso de abajo: lo que salió bien, abajo a la derecha (210). */
.mod-toast { position: absolute; z-index: 45; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 10px; max-width: 460px; padding: 10px 14px; border: 1px solid var(--borde2); border-left: 3px solid oklch(0.55 0.13 155); border-radius: 3px; background: #fff; color: var(--t1); font-size: 13px; box-shadow: 0 12px 32px oklch(0.24 0.014 78 / 0.14); }
.mod-toast > svg:first-child { color: oklch(0.55 0.13 155); flex: none; }
.mod-toast .x { display: inline-flex; margin-left: 6px; color: var(--t3); }

/* Las pestañas de la ficha de una organización, sin cantidades (145). */
.tabs2 .tab2 .cnt { display: none; }
.mod-tabpanel { margin-top: 16px; display: flex; flex-direction: column; gap: 16px; }

/* Los correos de los avisos. */
.mod-mail-dl { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 6px 14px; margin: 14px 0; padding: 12px 14px; border: 1px solid var(--borde); border-radius: 3px; font-size: 14px; }
.mod-mail-dl .k { color: var(--t2); }
"""

CSS_TEL = CSS_COMUN.replace("@LETRA@", "14px").replace("@LETRAT@", "14px") + """
/* El teléfono. Una fila no junta datos debajo del nombre: es una tarjeta con cada dato nombrado (263). */
.mod-cards { display: flex; flex-direction: column; gap: 12px; padding: 12px 16px 24px; }
.mod-card { border: 1px solid var(--borde); border-radius: 12px; background: #fff; overflow: visible; }
.mod-card .cab { display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 4px 0 16px; border-bottom: 1px solid var(--borde); }
.mod-card .cab b { flex: 1; min-width: 0; font-size: 16px; font-weight: 600; color: var(--t1); }
.mod-card.marcada { border-color: var(--marca); box-shadow: inset 0 0 0 1px var(--marca); }
.mod-kv { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px 12px; padding: 12px 16px 14px; font-size: 14px; line-height: 1.4; }
.mod-kv .k { color: var(--t2); }
.mod-kv .v { color: var(--t1); min-width: 0; overflow-wrap: anywhere; }
.mod-kv .v .w-est { font-size: 14px; }
.mod-tsec { display: block; padding: 18px 20px 8px; font-size: 13px; font-weight: 600; color: var(--t2); }
.mod-ttarj { margin: 0 16px; border: 1px solid var(--borde); border-radius: 12px; background: #fff; }
.mod-ttarj .mod-kv { padding: 14px 16px; }
.mod-ttarj .ap-cmp { padding: 12px 16px; border-top: 1px solid var(--borde); }
.mod-ttarj .ap-cmp:first-child { border-top: 0; }
.mod-ttarj .pad { padding: 14px 16px; }
.mod-tcuerpo { flex: 1; overflow: hidden; display: flex; flex-direction: column; padding-bottom: 16px; }
.mod-tvacio { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 72px 24px; text-align: center; font-size: 16px; color: var(--t1); }
.mod-tcarga { display: flex; align-items: center; justify-content: center; padding: 120px 0; }
.mod-tcentro { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 0 32px; text-align: center; }
.mod-tcentro .circ { display: inline-flex; width: 64px; height: 64px; align-items: center; justify-content: center; border-radius: 50%; background: var(--s3); color: var(--t2); }
.mod-tcentro h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--t1); }
.mod-tcentro .cb { min-width: 180px; }
.mod-ops { display: flex; flex-direction: column; padding: 0 20px 34px; }
.mod-ops .op { position: relative; display: flex; align-items: center; gap: 14px; min-height: 52px; border-top: 1px solid var(--borde); font-size: 16px; color: var(--t1); }
.mod-ops .op:first-child { border-top: 0; }
.mod-ops .op svg { color: var(--t3); flex: none; width: 20px; height: 20px; }
.mod-ops .op.pel { color: oklch(0.52 0.19 25); }
.mod-ops .op.pel svg { color: inherit; }
.mod-ops .op.apag { color: var(--t3); }
.mod-ops .op .mod-tip { left: 32px; top: auto; bottom: calc(100% - 4px); }
.mod-ops .op .mod-tip::before { bottom: auto; top: 100%; border-bottom-color: transparent; border-top-color: oklch(0.27 0.012 60); }
.ap-hoja .hb .mod-av { margin-bottom: 12px; }
.ap-hoja .hb .mod-kv { padding: 0 0 12px; }
.mod-tav { margin: 12px 16px 0; }
.mod-mp-t .ct.vacio { color: var(--t3); }
.mod-mp-t .ct.mal { border-color: oklch(0.57 0.2 25 / 0.7); }
.mod-mp-t .err, .mod-terr { display: block; margin-top: 6px; color: oklch(0.52 0.19 25); font-size: 14px; }
.mod-acepto { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; font-size: 15px; line-height: 1.45; color: var(--t1); }
.mod-acepto .caja { display: inline-flex; flex: none; width: 22px; height: 22px; margin-top: 1px; box-sizing: border-box; align-items: center; justify-content: center; border: 1.5px solid var(--borde2); border-radius: 4px; background: #fff; color: #fff; }
.mod-acepto .caja.on { border-color: var(--marca); background: var(--marca); }
.ap-fijo .mod-apag { flex: 1; display: flex; }
.ap-fijo .mod-apag .cb { flex: 1; opacity: 0.5; }
.ap-fijo .mod-apag .mod-tip { left: auto; right: 0; top: auto; bottom: calc(100% + 8px); }
.ap-fijo .mod-apag .mod-tip::before { left: auto; right: 24px; bottom: auto; top: 100%; border-bottom-color: transparent; border-top-color: oklch(0.27 0.012 60); }
.ap-hoja .hp .mod-apag { flex: 1; display: flex; }
.ap-hoja .hp .mod-apag .cb { flex: 1; opacity: 0.5; }
.ap-hoja .hp .mod-apag .mod-tip { left: auto; right: 0; top: auto; bottom: calc(100% + 8px); }
.ap-hoja .hp .mod-apag .mod-tip::before { left: auto; right: 24px; bottom: auto; top: 100%; border-bottom-color: transparent; border-top-color: oklch(0.27 0.012 60); }
.mod-snack { position: absolute; z-index: 45; left: 12px; right: 12px; bottom: 96px; display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 12px; border-left: 3px solid oklch(0.78 0.14 155); background: oklch(0.27 0.012 60); color: #fff; font-size: 15px; }
.mod-snack > svg { color: oklch(0.78 0.14 155); flex: none; }
.mod-dh { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px; }
.mod-prop { display: inline-flex; align-items: center; gap: 5px; color: var(--marca-tx); font-size: 13px; font-weight: 500; white-space: nowrap; }
.mod-prop svg { width: 14px; height: 14px; flex: none; }
.mod-pk { position: absolute; z-index: 70; top: 44px; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; background: #fff; }
.mod-pk .bar { display: flex; align-items: center; gap: 8px; min-height: 56px; padding: 0 8px 0 20px; border-bottom: 1px solid var(--borde); }
.mod-pk .bar h2 { flex: 1; margin: 0; font-size: 18px; font-weight: 700; color: var(--t1); }
.mod-pk .bar button { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--t1); }
.mod-pk .op { position: relative; display: flex; align-items: center; gap: 14px; min-height: 56px; padding: 0 20px; border-bottom: 1px solid var(--borde); font-size: 16px; color: var(--t1); }
.mod-pk .op .tl { margin-left: auto; color: var(--marca-tx); display: inline-flex; }
.mod-pk .op.apag { color: var(--t3); }
.mod-pk .op .mod-tip { left: 20px; top: auto; bottom: calc(100% - 4px); }
.mod-pk .op .mod-tip::before { bottom: auto; top: 100%; border-bottom-color: transparent; border-top-color: oklch(0.27 0.012 60); }
.mod-tmail { padding: 12px 16px; }
/* En el teléfono, el tooltip va centrado sobre la (i), para que no se salga de la pantalla. */
.mod-tip { left: 50%; transform: translateX(-50%); width: 230px; max-width: none; }
.mod-tip::before { left: calc(50% - 6px); }
.mod-tip.der { left: auto; right: -12px; transform: none; }
.mod-tip.der::before { left: auto; right: 14px; }
.mod-ops .op .mod-tip, .mod-pk .op .mod-tip, .ap-fijo .mod-apag .mod-tip, .ap-hoja .hp .mod-apag .mod-tip { transform: none; width: max-content; max-width: 300px; }
.mod-ops .op .mod-tip::before, .mod-pk .op .mod-tip::before { left: 14px; }
.mod-plazo-t { display: grid; grid-template-columns: minmax(0, 1fr) 96px; align-items: center; gap: 4px 12px; padding: 12px 16px; border-top: 1px solid var(--borde); font-size: 15px; }
.mod-plazo-t:first-child { border-top: 0; }
.mod-plazo-t .nm { color: var(--t1); }
.mod-plazo-t .rg { grid-column: 1 / -1; display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 4px 12px; font-size: 14px; }
.mod-plazo-t .rg .k { color: var(--t2); }
.mod-plazo-t .ct { text-align: right; justify-content: flex-end; }
"""


# ---------------------------------------------------------------------------------------------------------------- piezas: la compu
def tip(texto, clase=""):
    return f'<span class="mod-tip {clase}" role="tooltip">{texto}</span>'


def info(texto, abierta=False, clase=""):
    """La (i) con su texto; abierta, con el tooltip a la vista (en el lienzo no hay mouse)."""
    return (f'<span class="mod-i" tabindex="0" role="img" aria-label="{texto}">{I_INFO}'
            f'{tip(texto, clase) if abierta else ""}</span>')


def pill(texto, clase="", i=None, abierta=False):
    return f'<span class="pill {clase}">{texto}</span>' + (info(i, abierta) if i else "")


def b(texto, clase="b-sec", href=None, apagado=None, trabaja=False, abierta=True):
    if trabaja:
        return f'<button type="button" class="b {clase}" aria-disabled="true">{ARO}{texto}</button>'
    if apagado:
        return (f'<span class="mod-btn-apag"><button type="button" class="b {clase}" aria-disabled="true">{texto}</button>'
                f'{tip(apagado, "arriba der") if abierta else ""}</span>')
    if href:
        return f'<a class="b {clase}" href="{href}" style="text-decoration: none;">{texto}</a>'
    return f'<button type="button" class="b {clase}">{texto}</button>'


def banda(titulo, res="", acciones="", atras=None, icono_=I_GRILLA, prop=False):
    izq = (f'<a class="atras" href="{atras}" aria-label="Volver">{I_ATRAS}</a>' if atras
           else f'<span class="ico" aria-hidden="true">{icono_}</span>')
    h1 = f"<h1>{titulo}</h1>"
    if prop:
        h1 = f'<div class="mod-dh">{h1}<span class="mod-prop">{SPARK}Propuesta del asistente</span></div>'
    return (f'<div class="banda-pag"><div class="izq">{izq}<div style="min-width: 0px;"><div class="tit">{h1}</div>'
            f'<p class="res">{res}</p></div></div><div class="acciones">{acciones}</div></div>')


def menu(opciones):
    """Un ⋮ abierto: (ícono, texto, clase, motivo). Clase «pel» para lo destructivo, al final (209); «sep» separa."""
    partes = []
    for op in opciones:
        if op == "sep":
            partes.append('<div class="menu-sep" role="separator"></div>')
            continue
        ic, texto, clase, motivo = (op + (None, None))[:4] if len(op) < 4 else op
        clase = clase or ""
        if motivo:
            partes.append(f'<button type="button" class="menu-it apagado" role="menuitem" aria-disabled="true">{ic} {texto}{tip(motivo, "arriba")}</button>')
        else:
            partes.append(f'<button type="button" class="menu-it {clase}" role="menuitem">{ic} {texto}</button>')
    return f'<div class="menu der mod-menu" role="menu">{"".join(partes)}</div>'


def kebab(nombre, abierto=None):
    m = menu(abierto) if abierto else ""
    return (f'<span class="der envoltura"><button type="button" class="kebab" aria-haspopup="menu" '
            f'aria-expanded="{"true" if abierto else "false"}" aria-label="Acciones de {nombre}">{I_KEB}</button>{m}</span>')


def tabla(cols, plantilla, filas, pie=True, carga=False, vacio=None, error=None, ordenada=0, extra="", desc=False):
    """`cols`: (rótulo, clase); `filas`: (celdas, clase de la fila). La columna ordenada lleva ▲ (264)."""
    cab = []
    for k, (rot, clase) in enumerate(cols):
        marca = f'<span class="ord" aria-hidden="true">{"▼" if desc else "▲"}</span>' if k == ordenada and rot else ""
        sort = f' aria-sort="{"descending" if desc else "ascending"}"' if k == ordenada and rot else ""
        cab.append(f'<span class="{clase}"{sort}>{rot}{marca}</span>' if rot else '<span class="sr">Acciones</span>')
    estilo = f' style="grid-template-columns: {plantilla};"'
    html = f'<div class="tarjeta">{extra}<div class="tt-h"{estilo}>{"".join(cab)}</div>'
    if carga:
        return html + f'<div class="mod-carga" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div></div>'
    if error:
        return html + f'<div class="mod-bloque"><strong>{error}</strong>{b("Reintentar")}</div></div>'
    if vacio:
        return html + f'<div class="mod-bloque"><strong>{vacio}</strong></div></div>'
    for celdas, clase in filas:
        html += f'<div class="tt-f {clase}"{estilo}>{"".join(celdas)}</div>'
    if pie:
        n = len(filas)
        html += (f'<div class="pie"><span>1–{n} de {n}</span><span class="pag"><span class="envoltura"><button type="button" '
                 f'class="pill-sel" aria-haspopup="listbox" aria-expanded="false">10 por página {I_FLECHA}</button></span>'
                 '<span>Página 1 de 1</span>'
                 f'<button type="button" class="ico-btn" aria-label="Página anterior" disabled="">{icono("<path d=\'m15 6-6 6 6 6\'/>", 16, "2")}</button>'
                 f'<button type="button" class="ico-btn" aria-label="Página siguiente" disabled="">{icono("<path d=\'m9 6 6 6-6 6\'/>", 16, "2")}</button>'
                 "</span></div>")
    return html + "</div>"


def c(texto, clase=""):
    return f'<span class="mod-c {clase}">{texto}</span>'


def num(texto):
    return f'<span class="num">{texto}</span>'


def filtros(buscar, pildoras, abierta=None):
    """La caja de filtros: el buscador y los filtros, cada uno con su pieza (262); `abierta`: (índice, opciones, elegida)."""
    ps = []
    for k, p in enumerate(pildoras):
        lista = ""
        if abierta and abierta[0] == k:
            ops = "".join(f'<div class="op{" sel" if o == abierta[2] else ""}" role="option" aria-selected="{"true" if o == abierta[2] else "false"}">'
                          f'{o}{"<span class=tl>" + I_TILDE + "</span>" if o == abierta[2] else ""}</div>' for o in abierta[1])
            lista = f'<div class="mod-lista" role="listbox" style="min-width: 220px; right: auto;">{ops}</div>'
        con = " con" if ":" in p and not p.endswith("todos") and not p.endswith("todas") else ""
        ps.append(f'<span class="envoltura" style="position: relative;"><button type="button" class="pill-sel{con}" aria-haspopup="listbox" '
                  f'aria-expanded="{"true" if lista else "false"}">{p} {I_FLECHA}</button>{lista}</span>')
    lupa = icono('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', 14, "2")
    return (f'<div class="fb" role="search"><span class="fb-bus">{lupa}<input type="search" aria-label="{buscar}" '
            f'placeholder="{buscar}" value=""></span>{"".join(ps)}</div>')


def zona(titulo, cuerpo, accion="", clase_cuerpo="cuerpo"):
    return (f'<section class="mod-zona" aria-label="{titulo}"><div class="cab"><h2>{titulo}</h2>{accion}</div>'
            f'<div class="{clase_cuerpo}">{cuerpo}</div></section>')


def dl(pares, clase=""):
    return f'<div class="mod-dl {clase}">' + "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in pares) + "</div>"


def aviso(texto, tipo="", acc=""):
    ic = {"aten": I_ATEN, "ok": I_OK, "mal": I_ERROR}.get(tipo, I_INFO16)
    rol = ' role="alert"' if tipo == "mal" else ' role="status"'
    return f'<div class="mod-av {tipo}"{rol}>{ic}<span class="tx">{texto}</span>{f"<span class=acc>{acc}</span>" if acc else ""}</div>'


def toast(texto):
    return f'<div class="mod-toast" role="status">{I_OK}<span>{texto}</span><span class="x" aria-hidden="true">{icono("<path d=\'M7 7l10 10\'/><path d=\'M17 7 7 17\'/>", 14, "2")}</span></div>'


def dialogo(titulo, cuerpo, pie, chico=False, medio=False, alerta=False, sub=None, x=True, prop=False, texto=None):
    clase = "dlg" + (" chico" if chico else "") + (" medio" if medio else "")
    rol = "alertdialog" if alerta else "dialog"
    h = f"<h2>{titulo}</h2>"
    if prop:
        h = f'<div class="mod-dh"><h2>{titulo}</h2><span class="mod-prop">{SPARK}Propuesta del asistente</span></div>'
    elif sub:
        h = f"<div><h2>{titulo}</h2><p>{sub}</p></div>"
    cerrar = f'<button type="button" class="dlg-x" aria-label="Cerrar">{I_X}</button>' if x and not alerta else ""
    t = f'<div class="dlg-t">{texto}</div>' if texto else ""
    cuerpo_html = f'<div class="dlg-b una" style="padding-top: 0px;">{cuerpo}</div>' if (texto and cuerpo) else (f'<div class="dlg-b una">{cuerpo}</div>' if cuerpo else "")
    return (f'<div class="velo"><div class="{clase}" role="{rol}" aria-modal="true" aria-label="{titulo}">'
            f'<div class="dlg-h">{h}{cerrar}</div>{t}{cuerpo_html}<div class="dlg-f">{pie}</div></div></div>')


def campo(et, valor="", req=False, area=False, error=None, tipo="text", id_=None, mal=False, ancho=False):
    id_ = id_ or "f-" + re.sub(r"\W+", "-", et.lower())[:24]
    r = '<span class="req" aria-hidden="true">*</span>' if req else ""
    clase = "in2" + (" mal" if (error or mal) else "")
    ctrl = (f'<textarea class="{clase}" id="{id_}">{valor}</textarea>' if area
            else f'<input class="{clase}" id="{id_}" type="{tipo}" autocomplete="off" value="{valor}">')
    err = f'<span class="mod-campo-err">{error}</span>' if error else ""
    return f'<div class="campo2{" ancho" if ancho else ""}"><label class="et" for="{id_}">{et}{r}</label>{ctrl}{err}</div>'


def elegir(et, valor, req=False, lista=None, ancho=False, info_=None, placeholder=False):
    """La pieza para elegir (262), cerrada o abierta con sus opciones: (texto, elegida, motivo si va apagada)."""
    r = '<span class="req" aria-hidden="true">*</span>' if req else ""
    i = info(info_) if info_ else ""
    html = (f'<div class="campo2 envoltura{" ancho" if ancho else ""}"><span class="et">{et}{r}{i}</span>'
            f'<button type="button" class="in2" aria-haspopup="listbox" aria-expanded="{"true" if lista else "false"}">'
            f'<span class="val"{" style=\"color: var(--t3);\"" if placeholder else ""}>{valor}</span>{I_FLECHA}</button>')
    if lista:
        ops = []
        abierto = False
        for texto, sel, motivo in lista:
            ver = bool(motivo) and not abierto
            abierto = abierto or ver
            ops.append(f'<div class="op{" sel" if sel else ""}{" apag" if motivo else ""}" role="option" aria-selected="{"true" if sel else "false"}"'
                       f'{" aria-disabled=\"true\"" if motivo else ""}>{texto}{"<span class=tl>" + I_TILDE + "</span>" if sel else ""}'
                       f'{tip(motivo, "arriba") if ver else ""}</div>')
        html += f'<div class="mod-lista" role="listbox">{"".join(ops)}</div>'
    return html + "</div>"


def con_unidad(et, valor, unidad, req=False, info_=None, error=None, prefijo=False, id_=None):
    r = '<span class="req" aria-hidden="true">*</span>' if req else ""
    i = info(info_) if info_ else ""
    id_ = id_ or "f-" + re.sub(r"\W+", "-", et.lower())[:24]
    inp = f'<input class="in2" id="{id_}" type="text" inputmode="decimal" autocomplete="off" value="{valor}">'
    caja = f'<span class="uni">{unidad}</span>{inp}' if prefijo else f'{inp}<span class="uni">{unidad}</span>'
    err = f'<span class="mod-campo-err">{error}</span>' if error else ""
    return (f'<div class="campo2"><label class="et" for="{id_}">{et}{r}{i}</label>'
            f'<div class="mod-prebox{" in2 mal" if error else ""}" style="padding: 0;">{caja}</div>{err}</div>')


def sin_permiso_compu(volver="Inicio-Org.dc.html", texto="Ir al inicio"):
    return (f'<div class="mod-centro" role="alert"><span class="circ">{I_CANDADO}</span><h2>No tenés permiso para ver esta página.</h2>'
            f'{b(texto, href=volver)}</div>')


# ---------------------------------------------------------------------------------------------------------------- piezas: el teléfono
def barra_t(titulo, sub=None, atras="#", acciones=""):
    s = f'<span class="sub">{sub}</span>' if sub else ""
    return (f'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="{atras}">{I_ATRAS_T}</a>'
            f'<div class="tit"><h1>{titulo}</h1>{s}</div>{acciones}</div>')


def keb_t(nombre):
    return f'<button type="button" class="ap-ib" aria-label="Acciones de {nombre}">{I_KEB_T}</button>'


def est_t(texto, clase="", i=None, abierta=False):
    return f'<span class="w-est {clase}">{texto}</span>' + (info(i, abierta) if i else "")


def card_t(nombre, pares, keb=True, marcada=False, href=None):
    t = f'<a href="{href}" style="color: inherit; text-decoration: none;">{nombre}</a>' if href else nombre
    kv = "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in pares)
    return (f'<div class="mod-card{" marcada" if marcada else ""}" role="group" aria-label="{nombre}"><div class="cab"><b>{t}</b>'
            f'{keb_t(nombre) if keb else ""}</div><div class="mod-kv">{kv}</div></div>')


def hoja_ops(titulo, opciones):
    """El ⋮ de una fila en el teléfono: una hoja desde abajo con el nombre (Criterio · Menús)."""
    ops = []
    for op in opciones:
        ic, texto, clase, motivo = (op + (None, None))[:4] if len(op) < 4 else op
        if motivo:
            ops.append(f'<span role="menuitem" class="op apag" aria-disabled="true">{ic}{texto}{tip(motivo)}</span>')
        else:
            ops.append(f'<span role="menuitem" class="op {clase or ""}">{ic}{texto}</span>')
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="menu" aria-label="Acciones de ' + titulo + '"><span class="asa"></span>'
            f'<div class="hc" style="padding-right: 20px;"><h2>{titulo}</h2></div><div class="mod-ops">{"".join(ops)}</div></div>')


def hoja_t(titulo, cuerpo, pie, alerta=False, prop=False, x=True):
    rol = "alertdialog" if alerta else "dialog"
    h = f"<h2>{titulo}</h2>"
    if prop:
        h = f'<div class="mod-dh"><h2>{titulo}</h2><span class="mod-prop">{SPARK}Propuesta del asistente</span></div>'
    cerrar = f'<button type="button" class="ap-ib" aria-label="Cerrar">{I_X_T}</button>' if x and not alerta else ""
    return (f'<div class="ap-velo"></div><div class="ap-hoja" role="{rol}" aria-label="{titulo}"><span class="asa"></span>'
            f'<div class="hc"><div>{h}</div>{cerrar}</div><div class="hb">{cuerpo}</div><div class="hp">{pie}</div></div>')


def cb(texto, clase="cb-sec", apagado=None, trabaja=False, href=None, abierta=True):
    if trabaja:
        return f'<button type="button" class="cb {clase}" aria-disabled="true">{ARO}{texto}</button>'
    if apagado:
        return f'<span class="mod-apag"><button type="button" class="cb {clase}" aria-disabled="true">{texto}</button>{tip(apagado) if abierta else ""}</span>'
    if href:
        return f'<a class="cb {clase}" href="{href}">{texto}</a>'
    return f'<button type="button" class="cb {clase}">{texto}</button>'


def cmp_t(et, valor, req=False, area=False, elegir_=False, error=None, vacio=False, info_=None):
    r = ' <span class="rq">*</span>' if req else ""
    i = info(info_) if info_ else ""
    clase = "ct" + (" area" if area else "") + (" mal" if error else "")
    estilo = ' style="color: var(--t3);"' if vacio else ""
    err = f'<span class="mod-terr">{error}</span>' if error else ""
    return (f'<div class="ap-cmp"><span class="rt"><span>{et}{r}</span>{i}</span><div class="{clase}"{estilo}>{valor}'
            f'{I_FLECHA_T if elegir_ else ""}</div>{err}</div>')


def kv_t(pares):
    return '<div class="mod-kv">' + "".join(f'<span class="k">{k}</span><span class="v">{v}</span>' for k, v in pares) + "</div>"


def aviso_t(texto, tipo="", clase="mod-tav"):
    return aviso(texto, tipo).replace('class="mod-av', f'class="mod-av {clase}', 1)


def snack(texto):
    return f'<div class="mod-snack" role="status">{I_OK}<span>{texto}</span></div>'


def carga_t():
    return f'<div class="mod-tcarga" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div>'


def error_t(texto):
    return f'<div class="mod-tvacio"><span>{texto}</span>{cb("Reintentar")}</div>'


def vacio_t(texto):
    return f'<div class="mod-tvacio"><span>{texto}</span></div>'


def sin_permiso_t(volver="M-Inicio-Org.dc.html"):
    return (f'<div class="mod-tcentro" role="alert"><span class="circ">{I_CANDADO}</span><h2>No tenés permiso para ver esta página</h2>'
            f'{cb("Ir al inicio", "cb-pri", href=volver)}</div>')


# ---------------------------------------------------------------------------------------------------------------- los marcos
LUCIA = ("Lucía Fernández", "lucia.fernandez@delta.ejemplo.com", "L", "Grupo Delta")
TOMAS = ("Tomás Acosta", "tomas.acosta@delta.ejemplo.com", "T", "Grupo Delta")
MARTIN = ("Martín Sosa", "martin.sosa@arquitecturabase.ejemplo.com", "M", "Plataforma")
SOFIA = ("Sofía Medina", "sofia.medina@arquitecturabase.ejemplo.com", "S", "Plataforma")


def con_persona(t, p):
    """El nombre, el correo y la inicial de quien mira, como `@PN@`, `@PE@` y `@PI@`."""
    nombre, correo, ini, _ = p
    t = t.replace(nombre, "@PN@").replace(correo, "@PE@")
    t = re.sub(r'(<span class="avatar"[^>]*>)' + ini + r"(</span>)", r"\1@PI@\2", t)
    return t


def personas(estados_quien):
    return {"@PN@": [q[0] for q in estados_quien], "@PE@": [q[1] for q in estados_quien], "@PI@": [q[2] for q in estados_quien]}


def migas(items):
    partes = []
    for k, (texto, href) in enumerate(items):
        if k:
            partes.append('<li class="ab-breadcrumbs__separator" aria-hidden="true">/</li>')
        if k == len(items) - 1:
            partes.append(f'<li class="ab-breadcrumbs__item ab-breadcrumbs__item--current" aria-current="page">{texto}</li>')
        elif href:
            partes.append(f'<li class="ab-breadcrumbs__item"><a class="ab-breadcrumbs__link" href="{href}">{texto}</a></li>')
        else:
            partes.append(f'<li class="ab-breadcrumbs__item ab-breadcrumbs__item--muted">{texto}</li>')
    return '<ol class="ab-breadcrumbs__list">' + "".join(partes) + "</ol>"


def con_main(t, items_migas):
    t = re.sub(r'<ol class="ab-breadcrumbs__list">.*?</ol>', lambda m: migas(items_migas), t, count=1, flags=re.S)
    t, n = re.subn(r'<main class="ab-app-shell__main">.*?</main>', '<main class="ab-app-shell__main mod-pagina">@MAIN@</main>', t, count=1, flags=re.S)
    assert n == 1
    k = t.rindex("</div>")
    return t[:k] + "@VELO@" + t[k:]


def marco_org(migas_=None):
    """El marco de la organización, de Roles: Administración abierta con «Módulos» después de Configuración."""
    t = copia("roles")
    rama = svgs(t, 'aria-controls="menu-usuarios"', "</button>")
    cerrado = svgs(t, 'href="WA-Admin.dc.html"', "</a>")
    a = t.index('<button type="button" class="ab-sidebar__branch" aria-expanded="true" aria-controls="menu-usuarios">')
    li0 = t.rindex("<li>", 0, a)
    li1 = t.index("</li>", t.index("</ul>", a)) + len("</li>")
    t = (t[:li0] + f'<li><a class="ab-sidebar__branch ab-cerrado" href="Usuarios.dc.html">{rama[0]}'
         f'<span class="ab-sidebar__branch-label">Gestión de usuarios</span>{cerrado[1]}</a></li>' + t[li1:])
    t, n = re.subn(r'(<li>\s*<a class="ab-sidebar__link" href="Configuracion\.dc\.html">.*?</a>\s*</li>)', r"\1@MENU_MOD@", t, count=1, flags=re.S)
    assert n == 1
    t = con_persona(t, LUCIA)
    return con_main(t, migas_ or [("Inicio", "Inicio-Org.dc.html"), ("Módulos", None)])


MENU_MOD_ORG = (f'<li><a class="ab-sidebar__link ab-sidebar__link--active" href="MOD-Modulos.dc.html" aria-current="page">{I_GRILLA}'
                '<span class="ab-sidebar__link-label">Módulos</span></a></li>')


def marco_plat(migas_, activo="Catálogo"):
    """El marco de Plataforma, de Organizaciones: Gestión abierta, con la rama «Módulos» (Catálogo, Pedidos y Suscripciones)."""
    t = copia("organizaciones")
    t = una_vez(t, 'class="ab-sidebar__link ab-sidebar__link--active" href="Organizaciones.dc.html" aria-current="page"',
                'class="ab-sidebar__link" href="Organizaciones.dc.html"')
    t, n = re.subn(r'(<li>\s*<a class="ab-sidebar__link" href="Recuperaciones\.dc\.html">.*?</a>\s*</li>)', r"\1@MENU_MOD@", t, count=1, flags=re.S)
    assert n == 1
    t = con_persona(t, MARTIN)
    return con_main(t, migas_)


def menu_mod_plat(activo):
    abajo = svgs(copia("roles"), 'aria-controls="menu-usuarios"', "</button>")[1]
    hijos = "".join(
        f'<li><a class="ab-sidebar__link{" ab-sidebar__link--active" if n == activo else ""}" href="{h}"'
        f'{" aria-current=\"page\"" if n == activo else ""}><span class="ab-sidebar__link-label">{n}</span></a></li>'
        for n, h in (("Catálogo", "Plat-MOD-Catalogo.dc.html"), ("Pedidos", "Plat-MOD-Pedidos.dc.html"),
                     ("Suscripciones", "Plat-MOD-Suscripciones.dc.html")))
    return (f'<li><button type="button" class="ab-sidebar__branch" aria-expanded="true" aria-controls="menu-modulos">{I_GRILLA}'
            f'<span class="ab-sidebar__branch-label">Módulos</span>{abajo}</button><ul class="ab-sidebar__children" id="menu-modulos">{hijos}</ul></li>')


def menu_mod_plat_cerrado():
    t = copia("roles")
    cerrado = svgs(t, 'href="WA-Admin.dc.html"', "</a>")
    return (f'<li><a class="ab-sidebar__branch ab-cerrado" href="Plat-MOD-Catalogo.dc.html">{I_GRILLA}'
            f'<span class="ab-sidebar__branch-label">Módulos</span>{cerrado[1]}</a></li>')


def marco_ficha_org():
    """La ficha de una organización, de Organizacion › Módulos: la banda, las pestañas y el panel cambian según el estado."""
    t = copia("organizacion")
    t, n = re.subn(r'(<li>\s*<a class="ab-sidebar__link" href="Recuperaciones\.dc\.html">.*?</a>\s*</li>)', r"\1@MENU_MOD@", t, count=1, flags=re.S)
    assert n == 1
    t = con_persona(t, MARTIN)
    t, n = re.subn(r'<main class="ab-app-shell__main">.*?</main>', '<main class="ab-app-shell__main mod-pagina">@MAIN@</main>', t, count=1, flags=re.S)
    assert n == 1
    k = t.rindex("</div>")
    return t[:k] + "@VELO@" + t[k:]


def marco_config_plat():
    t = copia("config_plat")
    t = con_persona(t, MARTIN)
    t, n = re.subn(r'<main class="ab-app-shell__main">.*?</main>', '<main class="ab-app-shell__main mod-pagina">@MAIN@</main>', t, count=1, flags=re.S)
    assert n == 1
    k = t.rindex("</div>")
    return t[:k] + "@VELO@" + t[k:]


def marco_tel(base, sin_nav=False):
    """El marco del teléfono: la barra de arriba, el cuerpo y lo que se abre encima cambian según el estado. Con `sin_nav`, una
    pantalla con su acción fija abajo, sin la barra de abajo (como Configuración)."""
    t = copia(base)
    if sin_nav:
        t = re.sub(r'<nav class="ap-nav".*?</nav>', "", t, count=1, flags=re.S)
    a = t.index('<div class="ap-bar')
    z = t.index('<nav class="ap-nav"') if '<nav class="ap-nav"' in t else t.index('<span class="ap-raya">')
    t = t[:a] + "@TBAR@@TCUERPO@" + t[z:]
    t = una_vez(t, '<span class="ap-raya"></span>', '@THOJA@<span class="ap-raya"></span>')
    return t


def nav_mas_plat(t):
    """En Plataforma, «Módulos» va en Más: la barra de abajo marca «Más»."""
    t = re.sub(r'<a class="on" aria-current="page" href="M-Organizaciones\.dc\.html">', '<a href="M-Organizaciones.dc.html">', t, count=1)
    return una_vez(t, '<a href="M-Mas-Plat.dc.html">', '<a class="on" aria-current="page" href="M-Mas-Plat.dc.html">')


# ---------------------------------------------------------------------------------------------------------------- los datos
HOY = "23/11/2026"
PRECIO = {"WhatsApp": "$ 45.000,00", "Asistente": "$ 30.000,00", "Formularios": "$ 25.000,00"}
DESC = {
    "WhatsApp": "Atendé a tus clientes y a tu equipo por WhatsApp, con chats, contactos, difusiones y un asistente.",
    "Asistente": "Consultá a la IA sobre el sistema, con tus permisos, y dejá que te prepare tareas.",
    "Formularios": "Armá formularios, mandalos por WhatsApp o cargalos desde la web, y revisá las respuestas.",
}
NUEVO = {"Formularios": ("$ 28.000,00", "01/01/2027")}
FIN_PRUEBA = "07/12/2026"
PROX_COBRO = "05/12/2026"
FIN_GRACIA = "03/12/2026"
BORRA = "21/02/2027"
VENCE_APROB = "31/12/2026"
MOTIVO_RECHAZO = "Por ahora Formularios se ofrece solo a organizaciones con más de un mes de uso."
TOPES_PLAN = [("Tamaño máximo de un archivo", "10 MB"), ("Formularios por planilla", "3"), ("Relecturas por persona y día", "5")]
CONSENT = ("Acepto que se cobre {m} por mes con esta tarjeta hasta que dé de baja el módulo. La baja rige al fin del período pagado, "
           "sin reembolso.")

# Los estados de un módulo para la organización: (estado, pill, clase, texto de su (i), opciones del ⋮).
OPS = {
    "suscribir": (I_TARJETA, "Suscribirme"),
    "probar": (I_RELOJ, "Probar gratis 14 días"),
    "pedir": (I_ENVIAR, "Pedir"),
    "cancelar": (I_CANCELAR, "Cancelar pedido", "pel"),
    "tarjeta": (I_TARJETA, "Cambiar tarjeta"),
    "baja": (I_BAJA, "Dar de baja", "pel"),
    "exportar": (I_BAJAR, "Exportar datos"),
}
PROBO = (I_RELOJ, "Probar gratis 14 días", None, "Ya usaste la prueba gratis de Formularios.")
ESTADOS_MOD = [
    ("Apagado", ("Apagado", "off", None), [OPS["suscribir"], OPS["probar"], OPS["pedir"]]),
    ("Apagado: ya lo probó", ("Apagado", "off", None), [OPS["suscribir"], PROBO, OPS["pedir"]]),
    ("En prueba", (f"En prueba hasta el {FIN_PRUEBA}", "pend", None), [OPS["suscribir"]]),
    ("Pedido enviado", ("Pedido enviado", "pend", None), [OPS["suscribir"], "sep", OPS["cancelar"]]),
    ("Pedido rechazado", ("Apagado", "off", f"Plataforma rechazó tu pedido el 20/11/2026. Motivo: {MOTIVO_RECHAZO}"),
     [OPS["suscribir"], PROBO, OPS["pedir"]]),
    ("Prendido por Plataforma", ("Prendido por Plataforma", "ok", f"Vence el {VENCE_APROB}."), [OPS["suscribir"]]),
    ("Suscripto", ("Suscripto", "ok", f"El próximo cobro es el {PROX_COBRO}."), [OPS["tarjeta"], "sep", OPS["baja"]]),
    ("Cobro rechazado", ("Cobro rechazado", "mal", f"Cambiá la tarjeta antes del {FIN_GRACIA}."), [OPS["tarjeta"], "sep", OPS["baja"]]),
    ("Baja pedida", ("Baja pedida", "alerta", f"Funciona hasta el {PROX_COBRO}."), []),
    ("Suspendido", ("Suspendido", "alerta", f"Tus datos se guardan hasta el {BORRA}."), [OPS["suscribir"], OPS["exportar"]]),
]


def fila_modulo(nombre, estado, abierto=False, tip_abierta=False, ops=None, sin_kebab=False, marcada=False):
    texto, clase, i = estado
    nuevo = NUEVO.get(nombre)
    celdas = [f'<span class="c1"><b class="mod-nombre">{nombre}</b></span>', c(DESC[nombre], "t2"),
              f'<span>{pill(texto, clase, i, tip_abierta)}</span>', num(PRECIO[nombre]),
              num(nuevo[0] if nuevo else "—"), c(nuevo[1] if nuevo else "—")]
    celdas.append('<span></span>' if sin_kebab or not ops else kebab(nombre, ops if abierto else None))
    return celdas, ("mod-marcada" if marcada else "")


COLS_MOD = [("Módulo", ""), ("Descripción", ""), ("Estado", ""), ("Precio por mes", "num"), ("Precio nuevo", "num"), ("Rige desde", ""), ("", "")]
PLANT_MOD = "minmax(0, 0.9fr) minmax(0, 2.2fr) minmax(0, 1.5fr) 120px 110px 100px 28px"
BASE_WA = ("Suscripto", "ok", f"El próximo cobro es el {PROX_COBRO}.")
BASE_AS = ("Apagado", "off", None)


def tabla_modulos(estado_form, ops=None, abierto=True, tip_abierta=True, sin_kebab=False, marcada=False):
    filas = [fila_modulo("Asistente", BASE_AS, ops=[OPS["suscribir"], OPS["probar"], OPS["pedir"]]),
             fila_modulo("Formularios", estado_form, abierto=abierto, tip_abierta=tip_abierta, ops=ops, sin_kebab=sin_kebab, marcada=marcada),
             fila_modulo("WhatsApp", BASE_WA, ops=[OPS["tarjeta"], "sep", OPS["baja"]])]
    return tabla(COLS_MOD, PLANT_MOD, filas, pie=False)


def pagina_modulos(estado_form, ops, abierto=True, tip_abierta=True, arriba="", extra="", marcada=False):
    return (banda("Módulos") + '<div class="pagina">' + arriba
            + tabla_modulos(estado_form, ops, abierto=abierto, tip_abierta=tip_abierta, marcada=marcada) + "</div>" + extra)


AVISO_COBRO = aviso(f"No pudimos cobrar Formularios. Cambiá la tarjeta antes del {FIN_GRACIA} para que siga funcionando.", "aten",
                    b("Cambiar tarjeta", href="MOD-Suscribir.dc.html"))


# ================================================================================================================ MOD-Modulos
def mod_modulos():
    estados, mains = [], []
    for nombre, est, ops in ESTADOS_MOD:
        estados.append(nombre)
        arriba = f'<div style="margin-bottom: 16px;">{AVISO_COBRO}</div>' if nombre == "Cobro rechazado" else ""
        abierto = bool(ops)
        mains.append(pagina_modulos(est, ops, abierto=abierto, tip_abierta=not abierto, arriba=arriba))
    estados += ["Cargando", "Vacía", "Error", "Sin permiso"]
    mains.append(banda("Módulos") + '<div class="pagina">' + tabla(COLS_MOD, PLANT_MOD, [], carga=True) + "</div>")
    mains.append(banda("Módulos") + '<div class="pagina">' + tabla(COLS_MOD, PLANT_MOD, [], vacio="Todavía no hay módulos para sumar.") + "</div>")
    mains.append(banda("Módulos") + '<div class="pagina">' + tabla(COLS_MOD, PLANT_MOD, [], error="No pudimos cargar los módulos.") + "</div>")
    mains.append(sin_permiso_compu())
    n = len(estados)
    quien = [LUCIA] * (n - 1) + [TOMAS]
    rell = {"@MAIN@": mains, "@VELO@": [""] * n, "@MENU_MOD@": [MENU_MOD_ORG] * (n - 1) + [""], **personas(quien)}
    return tablero("Roles", "Módulos · /org/modulos", CSS_COMPU, marco_org(), rell, estados, 1440, 900)


def m_mod_modulos():
    estados, cuerpos, hojas = [], [], []
    for nombre, (texto, clase, i), ops in ESTADOS_MOD:
        estados.append(nombre)
        clase_t = {"ok": "", "pend": "azul", "off": "off", "mal": "mal", "alerta": "amb"}[clase]
        arriba = aviso_t(f"No pudimos cobrar Formularios. Cambiá la tarjeta antes del {FIN_GRACIA}.", "aten") if nombre == "Cobro rechazado" else ""
        cuerpos.append(arriba + '<div class="mod-cards">' + cards_modulos((texto, clase_t, i), tip_abierta=not ops,
                                                                          keb=bool(ops)) + "</div>")
        hojas.append(hoja_ops("Formularios", [o for o in ops if o != "sep"]) if ops else "")
    estados += ["Cargando", "Vacía", "Error", "Sin permiso"]
    cuerpos += [carga_t(), vacio_t("Todavía no hay módulos para sumar."), error_t("No pudimos cargar los módulos."), sin_permiso_t()]
    hojas += ["", "", "", ""]
    n = len(estados)
    marco = marco_tel("m_roles")
    rell = {"@TBAR@": [barra_t("Módulos", "Administración", "M-WA-Menu.dc.html")] * n,
            "@TCUERPO@": [f'<div class="ap-cuerpo">{x}</div>' if k < n - 1 else x for k, x in enumerate(cuerpos)],
            "@THOJA@": hojas}
    return tablero("M-Roles", "Módulos · teléfono", CSS_TEL, marco, rell, estados, 390, 844)


def cards_modulos(est_form, tip_abierta=False, keb=True, marcada=False):
    def card(nombre, est, keb_=True, marc=False, abierta=False):
        texto, clase, i = est
        pares = [("Descripción", DESC[nombre]), ("Estado", est_t(texto, clase, i, abierta)), ("Precio por mes", PRECIO[nombre])]
        if nombre in NUEVO:
            pares += [("Precio nuevo", NUEVO[nombre][0]), ("Rige desde", NUEVO[nombre][1])]
        return card_t(nombre, pares, keb=keb_, marcada=marc)
    return (card("Asistente", ("Apagado", "off", None)) + card("Formularios", est_form, keb_=keb, marc=marcada, abierta=tip_abierta)
            + card("WhatsApp", ("Suscripto", "", f"El próximo cobro es el {PROX_COBRO}.")))


# ================================================================================================================ MOD-Suscribir
def tarjeta_mp(estado="vacia", compu=True):
    """Los campos de MercadoPago.js. `estado`: vacia, llena, rechazada, no_carga."""
    if estado == "no_carga":
        if compu:
            return f'<div class="mod-bloque" style="padding: 20px 0;"><strong>No pudimos cargar el formulario de Mercado Pago.</strong>{b("Reintentar")}</div>'
        return f'<div class="pad">{error_t("No pudimos cargar el formulario de Mercado Pago.")}</div>'
    lleno = estado in ("llena", "rechazada")
    datos = [("Número de tarjeta", "4509 •••• •••• 3704" if lleno else "1234 1234 1234 1234"),
             ("Vencimiento", "11/28" if lleno else "MM/AA"), ("Código de seguridad", "•••" if lleno else "123"),
             ("Nombre como figura en la tarjeta", "LUCIA FERNANDEZ" if lleno else "Como figura en la tarjeta"),
             ("Tipo de documento", "DNI"), ("Número de documento", "27.345.678" if lleno else "Sin puntos")]
    if compu:
        campos = []
        for k, (et, v) in enumerate(datos):
            vacio = not lleno and k not in (4,)
            elegir_ = k == 4
            campos.append(f'<div class="campo2"><span class="et">{et}<span class="req" aria-hidden="true">*</span></span>'
                          f'<div class="in2{" vacio" if vacio else ""}" role="textbox">{v}{I_FLECHA if elegir_ else ""}</div></div>')
        return f'<div class="mod-mp">{"".join(campos)}</div>'
    campos = "".join(cmp_t(et, v, req=True, vacio=(not lleno and k != 4), elegir_=(k == 4)) for k, (et, v) in enumerate(datos))
    return f'<div class="mod-mp-t">{campos}</div>'


MOTIVOS_TARJETA = "Mercado Pago rechazó la tarjeta: no tiene fondos suficientes. Probá con otra."


def mod_suscribir():
    def pagina(titulo, estado_tarjeta="vacia", acepto=False, primer=HOY, arriba="", boton="Suscribirme", trabajando=False,
               incluido=True, aviso_tarjeta="", precio_cambio=False, res="", cambiar=False, monto=PRECIO["Formularios"], apag_mp=False):
        precio = [("Precio por mes", monto), ("Precio nuevo", NUEVO["Formularios"][0]), ("Rige desde", NUEVO["Formularios"][1])]
        if cambiar:
            precio = [("Precio por mes", monto), ("Próximo cobro", PROX_COBRO), ("Tarjeta actual", "Visa terminada en 4521")]
        else:
            precio.insert(1, ("Primer cobro", primer))
        zonas = [zona("Suscripción" if cambiar else "Precio", dl(precio))]
        if incluido:
            zonas.append(zona("Lo que incluye", dl(TOPES_PLAN)))
        else:
            zonas.append(zona("Lo que incluye", '<span style="color: var(--t2);">Sin topes.</span>'))
        zonas.append(zona("Tarjeta nueva" if cambiar else "Tarjeta", aviso_tarjeta + tarjeta_mp(estado_tarjeta)))
        zonas.append(f'<label class="mod-acepto"><input type="checkbox"{" checked" if acepto else ""}{" disabled" if apag_mp else ""}>'
                     f'<span>{CONSENT.format(m=monto)}</span></label>')
        if trabajando:
            acc = b("Cancelar") + b("Cambiando…" if cambiar else "Suscribiendo…", "b-pri", trabaja=True)
        elif apag_mp:
            acc = b("Cancelar", href="MOD-Modulos.dc.html") + b(boton, "b-pri", apagado="Mercado Pago no está disponible. Probá de nuevo en unos minutos.")
        elif not acepto:
            acc = b("Cancelar", href="MOD-Modulos.dc.html") + b(boton, "b-pri", apagado="Aceptá el cobro para seguir.")
        else:
            acc = b("Cancelar", href="MOD-Modulos.dc.html") + b(boton, "b-pri")
        return (banda(titulo, res, acc, atras="MOD-Modulos.dc.html") + '<div class="pagina">' + arriba
                + f'<div class="mod-zonas">{"".join(zonas)}</div></div>')

    T = "Suscribirme a Formularios"
    TC = "Cambiar la tarjeta de Formularios"
    rechazo = aviso(MOTIVOS_TARJETA, "mal").replace('class="mod-av', 'style="margin-bottom: 16px;" class="mod-av', 1)
    espera = (banda(T, "", "", atras="MOD-Modulos.dc.html") + '<div class="pagina"><div class="mod-espera" role="status">'
              f'{ARO.replace("mod-aro", "mod-aro grande")}<h2>Estamos confirmando el pago</h2>{b("Ir a Módulos", href="MOD-Modulos.dc.html")}</div></div>')
    listo = (pagina(T, "llena", True) + toast("Te suscribiste a Formularios. El próximo cobro es el 23/12/2026."))
    estados = [
        ("Sin aceptar", pagina(T)),
        ("Listo para suscribirse", pagina(T, "llena", True)),
        ("En prueba: el primer cobro al terminarla", pagina(T, "llena", True, primer=FIN_PRUEBA,
                                                             res=pill(f"En prueba hasta el {FIN_PRUEBA}", "pend"))),
        ("Suscribiendo", pagina(T, "llena", True, trabajando=True)),
        ("Estamos confirmando el pago", espera),
        ("Suscripto", listo),
        ("Tarjeta rechazada", pagina(T, "rechazada", False, aviso_tarjeta=rechazo)),
        ("El precio cambió", pagina(T, "llena", False, monto="$ 28.000,00",
                                    arriba=f'<div style="margin-bottom: 16px;">{aviso("El precio cambió a $ 28.000,00 por mes. Revisalo y aceptá de nuevo.", "aten")}</div>')),
        ("Mercado Pago no disponible", pagina(T, "no_carga", False, apag_mp=True)),
        ("Sin topes en el plan", pagina(T, "vacia", incluido=False)),
        ("Módulo suspendido", pagina(T, "llena", True, res=pill("Suspendido", "alerta", f"Tus datos se guardan hasta el {BORRA}.", True))),
        ("Cambiar tarjeta", pagina(TC, "llena", True, boton="Cambiar tarjeta", cambiar=True, res=pill("Suscripto", "ok"))),
        ("Cambiar tarjeta: cobro rechazado", pagina(TC, "vacia", False, boton="Cambiar tarjeta", cambiar=True,
                                                    res=pill("Cobro rechazado", "mal", f"Cambiá la tarjeta antes del {FIN_GRACIA}."))),
        ("Cambiando la tarjeta", pagina(TC, "llena", True, boton="Cambiar tarjeta", cambiar=True, trabajando=True, res=pill("Suscripto", "ok"))),
        ("Cargando", banda(T, "", "", atras="MOD-Modulos.dc.html") + '<div class="pagina"><div class="tarjeta">'
                     f'<div class="mod-carga" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div></div></div>'),
        ("Error", banda(T, "", "", atras="MOD-Modulos.dc.html") + '<div class="pagina"><div class="tarjeta">'
                  f'<div class="mod-bloque"><strong>No pudimos cargar la suscripción.</strong>{b("Reintentar")}</div></div></div>'),
        ("Sin permiso", sin_permiso_compu()),
    ]
    n = len(estados)
    quien = [LUCIA] * (n - 1) + [TOMAS]
    rell = {"@MAIN@": [e[1] for e in estados], "@VELO@": [""] * n, "@MENU_MOD@": [MENU_MOD_ORG] * (n - 1) + [""], **personas(quien)}
    return tablero("Roles", "Suscribirme a un módulo · /org/modulos/formularios/suscripcion", CSS_COMPU,
                   marco_org([("Inicio", "Inicio-Org.dc.html"), ("Módulos", "MOD-Modulos.dc.html"), ("Formularios", None)]),
                   rell, [e[0] for e in estados], 1440, 900)


def m_mod_suscribir():
    def pagina(estado_tarjeta="vacia", acepto=False, primer=HOY, boton="Suscribirme", trabajando=False, incluido=True,
               av="", cambiar=False, monto=PRECIO["Formularios"], apag_mp=False, estado_mod=None):
        precio = [("Precio por mes", monto), ("Precio nuevo", NUEVO["Formularios"][0]), ("Rige desde", NUEVO["Formularios"][1])]
        if cambiar:
            precio = [("Precio por mes", monto), ("Próximo cobro", PROX_COBRO), ("Tarjeta actual", "Visa terminada en 4521")]
        else:
            precio.insert(1, ("Primer cobro", primer))
        if estado_mod:
            precio.insert(0, ("Estado", estado_mod))
        s = av
        s += f'<span class="mod-tsec">{"Suscripción" if cambiar else "Precio"}</span><div class="mod-ttarj">{kv_t(precio)}</div>'
        s += '<span class="mod-tsec">Lo que incluye</span>'
        s += f'<div class="mod-ttarj">{kv_t(TOPES_PLAN) if incluido else "<div class=pad>Sin topes.</div>"}</div>'
        s += f'<span class="mod-tsec">{"Tarjeta nueva" if cambiar else "Tarjeta"}</span><div class="mod-ttarj">{tarjeta_mp(estado_tarjeta, False)}</div>'
        caja = f'<span class="caja{" on" if acepto else ""}">{I_TILDE_T if acepto else ""}</span>'
        s += f'<div class="mod-ttarj" style="margin-top: 12px;"><div class="mod-acepto" role="checkbox" aria-checked="{"true" if acepto else "false"}">{caja}<span>{CONSENT.format(m=monto)}</span></div></div>'
        cuerpo = f'<div class="ap-cuerpo" style="padding-bottom: 16px;">{s}</div>'
        if trabajando:
            pie = cb("Cambiando…" if cambiar else "Suscribiendo…", "cb-pri full", trabaja=True)
        elif apag_mp:
            pie = cb(boton, "cb-pri full", apagado="Mercado Pago no está disponible. Probá de nuevo en unos minutos.")
        elif not acepto:
            pie = cb(boton, "cb-pri full", apagado="Aceptá el cobro para seguir.")
        else:
            pie = cb(boton, "cb-pri full")
        return cuerpo + f'<div class="ap-fijo">{pie}</div>'

    espera = (f'<div class="mod-tcentro" role="status">{ARO.replace("mod-aro", "mod-aro grande")}<h2>Estamos confirmando el pago</h2>'
              f'{cb("Ir a Módulos", href="M-MOD-Modulos.dc.html")}</div>')
    est = [
        ("Sin aceptar", "Suscribirme", pagina(), ""),
        ("Listo para suscribirse", "Suscribirme", pagina("llena", True), ""),
        ("En prueba: el primer cobro al terminarla", "Suscribirme",
         pagina("llena", True, primer=FIN_PRUEBA, estado_mod=est_t(f"En prueba hasta el {FIN_PRUEBA}", "azul")), ""),
        ("Suscribiendo", "Suscribirme", pagina("llena", True, trabajando=True), ""),
        ("Estamos confirmando el pago", "Suscribirme", espera, ""),
        ("Tarjeta rechazada", "Suscribirme", pagina("rechazada", av=aviso_t(MOTIVOS_TARJETA, "mal")), ""),
        ("El precio cambió", "Suscribirme", pagina("llena", monto="$ 28.000,00",
                                                  av=aviso_t("El precio cambió a $ 28.000,00 por mes. Revisalo y aceptá de nuevo.", "aten")), ""),
        ("Mercado Pago no disponible", "Suscribirme", pagina("no_carga", apag_mp=True), ""),
        ("Sin topes en el plan", "Suscribirme", pagina(incluido=False), ""),
        ("Módulo suspendido", "Suscribirme",
         pagina("llena", True, estado_mod=est_t("Suspendido", "amb", f"Tus datos se guardan hasta el {BORRA}.", True)), ""),
        ("Cambiar tarjeta", "Cambiar tarjeta", pagina("llena", True, boton="Cambiar tarjeta", cambiar=True), ""),
        ("Cambiar tarjeta: cobro rechazado", "Cambiar tarjeta",
         pagina(boton="Cambiar tarjeta", cambiar=True, estado_mod=est_t("Cobro rechazado", "mal", f"Cambiá la tarjeta antes del {FIN_GRACIA}.", True)), ""),
        ("Cargando", "Suscribirme", f'<div class="ap-cuerpo">{carga_t()}</div>', ""),
        ("Error", "Suscribirme", f'<div class="ap-cuerpo">{error_t("No pudimos cargar la suscripción.")}</div>', ""),
        ("Sin permiso", "Módulos", sin_permiso_t(), ""),
    ]
    n = len(est)
    rell = {"@TBAR@": [barra_t(e[1], "Formularios" if e[1] != "Módulos" else "Administración", "M-MOD-Modulos.dc.html") for e in est],
            "@TCUERPO@": [e[2] for e in est], "@THOJA@": [e[3] for e in est]}
    return tablero("M-Roles", "Suscribirme a un módulo · teléfono", CSS_TEL, marco_tel("m_roles", sin_nav=True), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ MOD-Pedir
TEXTO_PEDIR = "Le mandamos el pedido a la plataforma. Te avisamos por correo cuando lo resuelva."
MODULOS_PEDIR = [("Asistente", False, None), ("Formularios", True, None), ("WhatsApp", False, "Ya está prendido.")]


def dialogo_pedir(estado):
    if estado == "Pedir":
        return dialogo("¿Pedir Formularios?", "", b("Cancelar") + b("Pedir", "b-pri"), chico=True, alerta=True, texto=TEXTO_PEDIR)
    if estado == "Pidiendo":
        return dialogo("¿Pedir Formularios?", "", b("Cancelar") + b("Pidiendo…", "b-pri", trabaja=True), chico=True, alerta=True, texto=TEXTO_PEDIR)
    if estado == "Otra persona ya lo pidió":
        return dialogo("¿Pedir Formularios?", aviso("Ya hay un pedido de Formularios esperando. Lo hizo Ana López el 23/11/2026, 09:12.", "mal"),
                       b("Cerrar", "b-pri"), chico=True, alerta=True, texto=TEXTO_PEDIR)
    if estado == "Pedir un módulo suspendido":
        return dialogo("¿Pedir Formularios?", "", b("Cancelar") + b("Pedir", "b-pri"), chico=True, alerta=True,
                       texto=f"{TEXTO_PEDIR} Tus datos se guardan hasta el {BORRA}: si te lo prenden antes, siguen ahí.")
    if estado == "Cancelar el pedido":
        return dialogo("¿Cancelar el pedido de Formularios?", "", b("Volver") + b("Cancelar pedido", "b-pri"), chico=True, alerta=True,
                       texto="La plataforma deja de verlo. Lo podés volver a pedir.")
    if estado == "No se pudo pedir":
        return dialogo("¿Pedir Formularios?", aviso("No pudimos mandar el pedido. Probá de nuevo.", "mal"), b("Cancelar") + b("Pedir", "b-pri"),
                       chico=True, alerta=True, texto=TEXTO_PEDIR)
    # La propuesta del asistente (ADR 0068): el diálogo de pedir con el módulo como pieza para elegir (262).
    guardo = estado == "Propuesta: ya se guardó"
    lista = MODULOS_PEDIR if estado == "Propuesta: el módulo, abierto" else None
    if estado == "Propuesta: cargando los módulos":
        campo_mod = (f'<div class="campo2"><span class="et">Módulo<span class="req" aria-hidden="true">*</span></span>'
                     f'<button type="button" class="in2" aria-busy="true"><span class="val" style="color: var(--t3);">{ARO}Cargando…</span></button></div>')
    elif estado == "Propuesta: ningún módulo para pedir":
        campo_mod = elegir("Módulo", "Elegí un módulo", req=True, placeholder=True,
                           lista=[("Asistente", False, "Plataforma no lo deja pedir."), ("Formularios", False, "Ya tiene un pedido esperando."),
                                  ("WhatsApp", False, "Ya está prendido.")])
    elif estado == "Propuesta: sin el permiso":
        campo_mod = elegir("Módulo", "Formularios", req=True)
    else:
        campo_mod = elegir("Módulo", "Formularios", req=True, lista=lista)
    arriba = aviso("Ya se guardó.", "ok") if guardo else ""
    texto = aviso(TEXTO_PEDIR) if not guardo else ""
    error = aviso("Ya no tenés permiso para administrar los módulos.", "mal") if estado == "Propuesta: sin el permiso" else ""
    cuerpo = arriba + error + campo_mod + texto
    if guardo:
        pie = b("Cerrar") + b("Ver en Módulos", "b-pri", href="MOD-Modulos.dc.html")
    elif estado == "Propuesta: pidiendo":
        pie = '<button type="button" class="b b-sec" disabled>Cancelar</button>' + b("Pidiendo…", "b-pri", trabaja=True)
    elif estado == "Propuesta: ningún módulo para pedir":
        pie = b("Cancelar") + b("Pedir", "b-pri", apagado="Elegí un módulo.", abierta=False)
    elif estado == "Propuesta: sin el permiso":
        pie = b("Cerrar", "b-pri")
    else:
        pie = b("Cancelar") + b("Pedir", "b-pri")
    return dialogo("Pedir un módulo", cuerpo, pie, chico=False, medio=True, prop=True)


PEDIR_DIALOGOS = ["Pedir", "Pidiendo", "Otra persona ya lo pidió", "No se pudo pedir", "Pedir un módulo suspendido", "Cancelar el pedido",
                  "Propuesta del asistente", "Propuesta: el módulo, abierto", "Propuesta: cargando los módulos",
                  "Propuesta: ningún módulo para pedir", "Propuesta: pidiendo", "Propuesta: ya se guardó", "Propuesta: sin el permiso"]


def mod_pedir():
    apagado = ESTADOS_MOD[0][1]
    estados, mains, velos = [], [], []
    for d in PEDIR_DIALOGOS:
        est = apagado
        if d == "Cancelar el pedido":
            est = ESTADOS_MOD[3][1]
        if d == "Pedir un módulo suspendido":
            est = ESTADOS_MOD[9][1]
        if d == "Propuesta: ya se guardó":
            est = ESTADOS_MOD[3][1]
        estados.append(d)
        mains.append(pagina_modulos(est, None, abierto=False, tip_abierta=False, marcada=False))
        velos.append(dialogo_pedir(d))
    # Lo que queda en la página: el pedido enviado, con «Cancelar pedido», y el rechazo con su motivo.
    estados += ["Pedido enviado", "Pedido rechazado: el motivo"]
    mains.append(pagina_modulos(ESTADOS_MOD[3][1], ESTADOS_MOD[3][2], extra=toast("Pediste Formularios. Te avisamos cuando lo resuelvan.")))
    mains.append(pagina_modulos(ESTADOS_MOD[4][1], None, abierto=False, tip_abierta=True))
    velos += ["", ""]
    n = len(estados)
    rell = {"@MAIN@": mains, "@VELO@": velos, "@MENU_MOD@": [MENU_MOD_ORG] * n, **personas([LUCIA] * n)}
    return tablero("Roles", "Pedir un módulo, también con la propuesta del asistente", CSS_COMPU, marco_org(), rell, estados, 1440, 900)


def hoja_pedir(estado):
    if estado == "Pedir":
        return hoja_t("¿Pedir Formularios?", f'<p class="ap-txt-l" style="margin: 0;">{TEXTO_PEDIR}</p>', cb("Cancelar") + cb("Pedir", "cb-pri"), alerta=True)
    if estado == "Pidiendo":
        return hoja_t("¿Pedir Formularios?", f'<p class="ap-txt-l" style="margin: 0;">{TEXTO_PEDIR}</p>',
                      cb("Cancelar") + cb("Pidiendo…", "cb-pri", trabaja=True), alerta=True)
    if estado == "Cancelar el pedido":
        return hoja_t("¿Cancelar el pedido de Formularios?", '<p class="ap-txt-l" style="margin: 0;">La plataforma deja de verlo. Lo podés volver a pedir.</p>',
                      cb("Volver") + cb("Cancelar pedido", "cb-pri"), alerta=True)
    if estado == "Otra persona ya lo pidió":
        return hoja_t("¿Pedir Formularios?", aviso("Ya hay un pedido de Formularios esperando. Lo hizo Ana López el 23/11/2026, 09:12.", "mal"),
                      cb("Cerrar", "cb-pri"), alerta=True)
    guardo = estado == "Propuesta: ya se guardó"
    arriba = aviso("Ya se guardó.", "ok") if guardo else ""
    texto = "" if guardo else aviso(TEXTO_PEDIR)
    cuerpo = arriba + cmp_t("Módulo", "Formularios", req=True, elegir_=True) + texto
    if guardo:
        pie = cb("Cerrar") + cb("Ver en Módulos", "cb-pri", href="M-MOD-Modulos.dc.html")
    elif estado == "Propuesta: pidiendo":
        pie = cb("Cancelar") + cb("Pidiendo…", "cb-pri", trabaja=True)
    else:
        pie = cb("Cancelar") + cb("Pedir", "cb-pri")
    h = hoja_t("Pedir un módulo", cuerpo, pie, prop=True)
    if estado == "Propuesta: el módulo, abierto":
        ops = "".join(f'<div class="op{" apag" if m else ""}" role="option" aria-selected="{"true" if s else "false"}"{" aria-disabled=\"true\"" if m else ""}>'
                      f'{n}{"<span class=tl>" + I_TILDE_T + "</span>" if s else ""}{tip(m, "arriba") if m else ""}</div>' for n, s, m in MODULOS_PEDIR)
        h += (f'<div class="mod-pk" role="dialog" aria-label="Módulo"><div class="bar"><h2>Módulo</h2><button type="button" aria-label="Cerrar">{I_X_T}</button></div>'
              f'<div role="listbox">{ops}</div></div>')
    return h


def m_mod_pedir():
    dialogos = ["Pedir", "Pidiendo", "Otra persona ya lo pidió", "Cancelar el pedido", "Propuesta del asistente", "Propuesta: el módulo, abierto",
                "Propuesta: pidiendo", "Propuesta: ya se guardó"]
    estados, cuerpos, hojas = [], [], []
    for d in dialogos:
        est = ("Pedido enviado", "azul", None) if d in ("Cancelar el pedido", "Propuesta: ya se guardó") else ("Apagado", "off", None)
        estados.append(d)
        cuerpos.append(f'<div class="ap-cuerpo"><div class="mod-cards">{cards_modulos(est, keb=True)}</div></div>')
        hojas.append(hoja_pedir(d))
    estados += ["Pedido enviado", "Pedido rechazado: el motivo"]
    cuerpos.append(f'<div class="ap-cuerpo"><div class="mod-cards">{cards_modulos(("Pedido enviado", "azul", None))}</div></div>'
                   + snack("Pediste Formularios. Te avisamos cuando lo resuelvan."))
    cuerpos.append(f'<div class="ap-cuerpo"><div class="mod-cards">'
                   f'{cards_modulos(("Apagado", "off", f"Plataforma rechazó tu pedido el 20/11/2026. Motivo: {MOTIVO_RECHAZO}"), tip_abierta=True)}</div></div>')
    hojas += ["", ""]
    n = len(estados)
    rell = {"@TBAR@": [barra_t("Módulos", "Administración", "M-WA-Menu.dc.html")] * n, "@TCUERPO@": cuerpos, "@THOJA@": hojas}
    return tablero("M-Roles", "Pedir un módulo · teléfono", CSS_TEL, marco_tel("m_roles"), rell, estados, 390, 844)


# ================================================================================================================ MOD-Confirmar
TEXTO_PROBAR = f"Funciona hasta el {FIN_PRUEBA}, sin tarjeta. La prueba gratis se usa una sola vez."
BAJA_DL = [("Funciona hasta", PROX_COBRO), ("Reembolso", "Sin reembolso"), ("Tus datos se guardan", "90 días, hasta el 05/03/2027")]
TEXTO_BAJA = "La baja no se deshace. Cuando termine el período te podés volver a suscribir."


def confirmaciones():
    """(estado, estado del módulo en la página, ⋮ abierto, diálogo o '', aviso de abajo)."""
    apagado, prueba, susc, baja = ESTADOS_MOD[0][1], ESTADOS_MOD[2][1], ESTADOS_MOD[6][1], ESTADOS_MOD[8][1]
    D = lambda titulo, cuerpo, pie, texto=None: dialogo(titulo, cuerpo, pie, chico=True, alerta=True, texto=texto)
    return [
        ("Probar gratis", apagado, D("¿Probar Formularios gratis 14 días?", "", b("Cancelar") + b("Probar gratis", "b-pri"), TEXTO_PROBAR), ""),
        ("Probando", apagado, D("¿Probar Formularios gratis 14 días?", "", b("Cancelar") + b("Prendiendo…", "b-pri", trabaja=True), TEXTO_PROBAR), ""),
        ("Prueba empezada", prueba, "", toast(f"Formularios está en prueba hasta el {FIN_PRUEBA}.")),
        ("Probar: ya la usó", apagado, D("¿Probar Formularios gratis 14 días?", aviso("Ya usaste la prueba gratis de Formularios.", "mal"),
                                         b("Cerrar", "b-pri"), TEXTO_PROBAR), ""),
        ("Dar de baja", susc, D("¿Dar de baja Formularios?", dl(BAJA_DL), b("Cancelar") + b("Dar de baja", "b-pel"), TEXTO_BAJA), ""),
        ("Dar de baja: cargando", susc, D("¿Dar de baja Formularios?", f'<div class="mod-carga" style="height: 96px;" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div>',
                                          b("Cancelar") + b("Dar de baja", "b-pel", apagado="Esperá a que carguen los datos de la baja."), TEXTO_BAJA), ""),
        ("Dar de baja: error al cargar", susc, D("¿Dar de baja Formularios?", f'<div class="mod-bloque" style="padding: 12px 0;"><strong>No pudimos cargar los datos de la baja.</strong>{b("Reintentar")}</div>',
                                                 b("Cancelar") + b("Dar de baja", "b-pel", apagado="Faltan los datos de la baja."), TEXTO_BAJA), ""),
        ("Dando de baja", susc, D("¿Dar de baja Formularios?", dl(BAJA_DL), '<button type="button" class="b b-sec" disabled>Cancelar</button>'
                                  + b("Dando de baja…", "b-pel", trabaja=True), TEXTO_BAJA), ""),
        ("Dar de baja: no se pudo", susc, D("¿Dar de baja Formularios?", aviso("Mercado Pago no respondió y la baja no se hizo. Probá de nuevo en unos minutos.", "mal") + dl(BAJA_DL),
                                            b("Cancelar") + b("Dar de baja", "b-pel"), TEXTO_BAJA), ""),
        ("Baja pedida", baja, "", toast(f"Diste de baja Formularios. Funciona hasta el {PROX_COBRO}.")),
        ("Sin permiso", susc, D("¿Dar de baja Formularios?", aviso("Ya no tenés permiso para administrar los módulos.", "mal"), b("Cerrar", "b-pri"), TEXTO_BAJA), ""),
    ]


def mod_confirmar():
    est = confirmaciones()
    mains = [pagina_modulos(e[1], None, abierto=False, tip_abierta=bool(e[3]) and not e[2], marcada=False) + e[3] for e in est]
    n = len(est)
    rell = {"@MAIN@": mains, "@VELO@": [e[2] for e in est], "@MENU_MOD@": [MENU_MOD_ORG] * n, **personas([LUCIA] * n)}
    return tablero("Roles", "Probar gratis y dar de baja un módulo", CSS_COMPU, marco_org(), rell, [e[0] for e in est], 1440, 900)


def m_mod_confirmar():
    txt = lambda s: f'<p class="ap-txt-l" style="margin: 0 0 12px;">{s}</p>'
    H = lambda t, cuerpo, pie: hoja_t(t, cuerpo, pie, alerta=True)
    def cuerpo(estado):
        return f'<div class="ap-cuerpo"><div class="mod-cards">{cards_modulos(estado)}</div></div>'
    est = [
        ("Probar gratis", cuerpo(("Apagado", "off", None)), H("¿Probar Formularios gratis 14 días?", txt(TEXTO_PROBAR), cb("Cancelar") + cb("Probar gratis", "cb-pri"))),
        ("Probando", cuerpo(("Apagado", "off", None)), H("¿Probar Formularios gratis 14 días?", txt(TEXTO_PROBAR), cb("Cancelar") + cb("Prendiendo…", "cb-pri", trabaja=True))),
        ("Prueba empezada", cuerpo((f"En prueba hasta el {FIN_PRUEBA}", "azul", None)) + snack(f"Formularios está en prueba hasta el {FIN_PRUEBA}."), ""),
        ("Probar: ya la usó", cuerpo(("Apagado", "off", None)), H("¿Probar Formularios gratis 14 días?", aviso("Ya usaste la prueba gratis de Formularios.", "mal"), cb("Cerrar", "cb-pri"))),
        ("Dar de baja", cuerpo(("Suscripto", "", None)), H("¿Dar de baja Formularios?", txt(TEXTO_BAJA) + kv_t(BAJA_DL), cb("Cancelar") + cb("Dar de baja", "cb-pel lleno"))),
        ("Dar de baja: cargando", cuerpo(("Suscripto", "", None)), H("¿Dar de baja Formularios?", txt(TEXTO_BAJA) + carga_t().replace("120px 0", "24px 0"),
                                                                    cb("Cancelar") + cb("Dar de baja", "cb-pel lleno", apagado="Esperá a que carguen los datos de la baja."))),
        ("Dando de baja", cuerpo(("Suscripto", "", None)), H("¿Dar de baja Formularios?", txt(TEXTO_BAJA) + kv_t(BAJA_DL), cb("Cancelar") + cb("Dando de baja…", "cb-pel lleno", trabaja=True))),
        ("Dar de baja: no se pudo", cuerpo(("Suscripto", "", None)), H("¿Dar de baja Formularios?", aviso("Mercado Pago no respondió y la baja no se hizo. Probá de nuevo en unos minutos.", "mal") + kv_t(BAJA_DL),
                                                                        cb("Cancelar") + cb("Dar de baja", "cb-pel lleno"))),
        ("Baja pedida", cuerpo(("Baja pedida", "amb", f"Funciona hasta el {PROX_COBRO}.")) + snack(f"Diste de baja Formularios. Funciona hasta el {PROX_COBRO}."), ""),
        ("Sin permiso", cuerpo(("Suscripto", "", None)), H("¿Dar de baja Formularios?", aviso("Ya no tenés permiso para administrar los módulos.", "mal"), cb("Cerrar", "cb-pri"))),
    ]
    n = len(est)
    rell = {"@TBAR@": [barra_t("Módulos", "Administración", "M-WA-Menu.dc.html")] * n, "@TCUERPO@": [e[1] for e in est], "@THOJA@": [e[2] for e in est]}
    return tablero("M-Roles", "Probar gratis y dar de baja un módulo · teléfono", CSS_TEL, marco_tel("m_roles"), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ MOD-Exportar
EXP_ANTES = [("Datos de", "Formularios"), ("Se guardan hasta", BORRA), ("Exportación anterior", "10/11/2026, 09:15")]
TEXTO_EXP = "Armamos el archivo y te avisamos por correo cuando esté listo. Reemplaza a la exportación anterior."
TEXTO_EXP0 = "Armamos el archivo y te avisamos por correo cuando esté listo."


def exportaciones():
    D = lambda cuerpo, pie: dialogo("Exportar los datos de Formularios", cuerpo, pie, medio=True)
    lista = [("Datos de", "Formularios"), ("Pedida", "23/11/2026, 10:20"), ("Lista", "23/11/2026, 10:24"), ("Tamaño", "12,4 MB"),
             ("Se puede descargar hasta", BORRA)]
    return [
        ("Sin exportaciones", D(dl(EXP_ANTES[:2] + [("Exportación anterior", "—")]) + aviso(TEXTO_EXP0), b("Cancelar") + b("Exportar", "b-pri"))),
        ("Con una exportación anterior", D(dl(EXP_ANTES) + aviso(TEXTO_EXP), b("Cancelar") + b("Exportar", "b-pri"))),
        ("Pidiendo", D(dl(EXP_ANTES) + aviso(TEXTO_EXP), '<button type="button" class="b b-sec" disabled>Cancelar</button>' + b("Pidiendo…", "b-pri", trabaja=True))),
        ("Preparando", D(dl([("Datos de", "Formularios"), ("Pedida", "23/11/2026, 10:20"), ("Estado", f'<span class="pill pend">{ARO}Preparando</span>')])
                         + aviso("Te avisamos por correo cuando esté listo. Podés cerrar esta ventana."), b("Cerrar", "b-pri"))),
        ("Lista para descargar", D(dl(lista), b("Exportar de nuevo") + b("Descargar", "b-pri"))),
        ("Falló", D(dl([("Datos de", "Formularios"), ("Pedida", "23/11/2026, 10:20")]) + aviso("No pudimos armar el archivo.", "mal"),
                    b("Cerrar") + b("Reintentar", "b-pri"))),
        ("Los datos ya se borraron", D(dl([("Datos de", "Formularios"), ("Se borraron", BORRA)]) + aviso("Ya no hay datos para exportar.", "aten"),
                                      b("Cerrar", "b-pri"))),
        ("Cargando", D(f'<div class="mod-carga" style="height: 120px;" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div>',
                       b("Cancelar") + b("Exportar", "b-pri", apagado="Esperá a que carguen los datos."))),
        ("Error al cargar", D(f'<div class="mod-bloque" style="padding: 12px 0;"><strong>No pudimos cargar la exportación.</strong>{b("Reintentar")}</div>',
                              b("Cancelar") + b("Exportar", "b-pri", apagado="Faltan los datos de la exportación."))),
        ("Sin permiso", D(aviso("Ya no tenés permiso para administrar los módulos.", "mal"), b("Cerrar", "b-pri"))),
    ]


def mod_exportar():
    est = exportaciones()
    susp = ESTADOS_MOD[9]
    mains = [pagina_modulos(susp[1], None, abierto=False, tip_abierta=False, marcada=False) for _ in est]
    # Desde el ⋮ del módulo suspendido: la opción que abre el diálogo.
    est = [("Exportar datos, en el ⋮", "")] + est
    mains = [pagina_modulos(susp[1], susp[2], abierto=True, tip_abierta=False)] + mains
    n = len(est)
    rell = {"@MAIN@": mains, "@VELO@": [e[1] for e in est], "@MENU_MOD@": [MENU_MOD_ORG] * n, **personas([LUCIA] * n)}
    return tablero("Roles", "Exportar los datos de un módulo", CSS_COMPU, marco_org(), rell, [e[0] for e in est], 1440, 900)


def m_mod_exportar():
    T = "Exportar los datos de Formularios"
    lista = [("Datos de", "Formularios"), ("Pedida", "23/11/2026, 10:20"), ("Lista", "23/11/2026, 10:24"), ("Tamaño", "12,4 MB"),
             ("Se puede descargar hasta", BORRA)]
    H = lambda cuerpo, pie: hoja_t(T, cuerpo, pie)
    est = [
        ("Exportar datos, en el ⋮", hoja_ops("Formularios", [OPS["suscribir"], OPS["exportar"]])),
        ("Con una exportación anterior", H(kv_t(EXP_ANTES) + aviso(TEXTO_EXP), cb("Cancelar") + cb("Exportar", "cb-pri"))),
        ("Preparando", H(kv_t([("Datos de", "Formularios"), ("Pedida", "23/11/2026, 10:20"), ("Estado", est_t("Preparando", "azul"))])
                         + aviso("Te avisamos por correo cuando esté listo."), cb("Cerrar", "cb-pri"))),
        ("Lista para descargar", H(kv_t(lista), cb("Exportar de nuevo") + cb("Descargar", "cb-pri"))),
        ("Falló", H(kv_t([("Datos de", "Formularios"), ("Pedida", "23/11/2026, 10:20")]) + aviso("No pudimos armar el archivo.", "mal"),
                    cb("Cerrar") + cb("Reintentar", "cb-pri"))),
        ("Los datos ya se borraron", H(kv_t([("Datos de", "Formularios"), ("Se borraron", BORRA)]) + aviso("Ya no hay datos para exportar.", "aten"),
                                      cb("Cerrar", "cb-pri"))),
        ("Cargando", H(carga_t().replace("120px 0", "32px 0"), cb("Cancelar") + cb("Exportar", "cb-pri", apagado="Esperá a que carguen los datos."))),
        ("Error al cargar", H(error_t("No pudimos cargar la exportación.").replace("72px 24px", "16px 0"),
                              cb("Cancelar") + cb("Exportar", "cb-pri", apagado="Faltan los datos de la exportación."))),
        ("Sin permiso", H(aviso("Ya no tenés permiso para administrar los módulos.", "mal"), cb("Cerrar", "cb-pri"))),
    ]
    n = len(est)
    cuerpo = f'<div class="ap-cuerpo"><div class="mod-cards">{cards_modulos(("Suspendido", "amb", f"Tus datos se guardan hasta el {BORRA}."))}</div></div>'
    rell = {"@TBAR@": [barra_t("Módulos", "Administración", "M-WA-Menu.dc.html")] * n, "@TCUERPO@": [cuerpo] * n, "@THOJA@": [e[1] for e in est]}
    return tablero("M-Roles", "Exportar los datos de un módulo · teléfono", CSS_TEL, marco_tel("m_roles"), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ Plataforma: datos
CATALOGO = [
    # módulo, se ofrece, pedir, probar, suscribirse, precio, nuevo, desde, vivas
    ("Asistente", "Sí", "Sí", "Sí", "Sí", "$ 30.000,00", "—", "—", "8"),
    ("Formularios", "Sí", "No", "Sí", "Sí", "$ 25.000,00", "$ 28.000,00", "01/01/2027", "5"),
    ("WhatsApp", "Sí", "Sí", "No", "Sí", "$ 45.000,00", "—", "—", "12"),
]
COLS_CAT = [("Módulo", ""), ("Se ofrece", ""), ("Pedir", ""), ("Probar", ""), ("Suscribirse", ""),
            ("Precio por mes", "num"), ("Precio nuevo", "num"), ("Rige desde", ""), ("Suscripciones vivas", "num"), ("", "")]
PLANT_CAT = "minmax(0, 1fr) 78px 62px 64px 92px 112px 104px 90px 136px 28px"
OPS_CAT = [(I_PRECIO, "Nuevo precio"), (I_MARCAS, "Cambiar lo que se ofrece")]
MOTIVO_MARCAS = "Pedir queda cerrado hasta que termine la prueba con las primeras organizaciones."


def tabla_catalogo(abierto=None, filas=CATALOGO, carga=False, vacio=None, error=None, sin_ops=False):
    fs = []
    for f in filas:
        nombre = f[0]
        celdas = [f'<span class="c1"><a class="mod-nombre" href="Plat-MOD-Modulo.dc.html">{nombre}</a></span>'] + [c(x) for x in f[1:5]]
        celdas += [num(f[5]), num(f[6]), c(f[7]), num(f[8])]
        celdas.append('<span></span>' if sin_ops else kebab(nombre, OPS_CAT if abierto == nombre else None))
        fs.append((celdas, ""))
    return tabla(COLS_CAT, PLANT_CAT, fs, carga=carga, vacio=vacio, error=error)


def dialogo_marcas(estado="Cambiar"):
    casilla = lambda t, on: f'<label class="mod-acepto"><input type="checkbox"{" checked" if on else ""}><span>{t}</span></label>'
    cuerpo = (casilla("Se ofrece", True) + casilla("Se puede pedir", False) + casilla("Se puede probar", True) + casilla("Se puede suscribir", True)
              + campo("Motivo", MOTIVO_MARCAS if estado != "Sin motivo" else "", req=True, area=True, ancho=True,
                      error="Escribí el motivo." if estado == "Sin motivo" else None))
    if estado == "Guardando":
        pie = '<button type="button" class="b b-sec" disabled>Cancelar</button>' + b("Guardando…", "b-pri", trabaja=True)
    else:
        pie = b("Cancelar") + b("Guardar", "b-pri")
    return dialogo("Lo que se ofrece de Formularios", cuerpo, pie, chico=True)


def reauth(texto, error=False):
    otp = "".join(f'<input type="text" inputmode="numeric" maxlength="1" aria-label="Código {k}" value="{d}">' for k, d in enumerate("482913", 1))
    err = '<span class="mod-campo-err">El código no es correcto.</span>' if error else ""
    return (f'<div class="velo"><div class="dlg chico" role="dialog" aria-modal="true" aria-label="Confirmá que sos vos"><div class="dlg-h"><h2>Confirmá que sos vos</h2></div>'
            f'<div class="dlg-t">{texto}</div><div class="dlg-b una ra" style="padding-top: 0px;"><div class="otp" role="group" aria-label="Código">{otp}</div>{err}'
            '<button type="button" class="lnk ra-rec">Usar un código de recuperación</button></div>'
            f'<div class="dlg-f">{b("Cancelar")}{b("Confirmar", "b-pri")}</div></div></div>')


AVISO_SIN_MP = aviso("Mercado Pago no está conectado: nadie se puede suscribir.", "aten", b("Ir a Configuración", href="Config-Plat-Modulos.dc.html"))


def plat_mod_catalogo():
    T = banda("Módulos", "", "")
    pag = lambda cuerpo, arriba="": T + f'<div class="pagina">{arriba}{cuerpo}</div>'
    est = [
        ("Catálogo", pag(tabla_catalogo()), ""),
        ("Acciones de un módulo", pag(tabla_catalogo("Formularios")), ""),
        ("Cambiar lo que se ofrece", pag(tabla_catalogo()), dialogo_marcas()),
        ("Cambiar lo que se ofrece: sin motivo", pag(tabla_catalogo()), dialogo_marcas("Sin motivo")),
        ("Cambiar lo que se ofrece: confirmá que sos vos", pag(tabla_catalogo()), reauth("Para cambiar lo que se ofrece, escribí el código de tu app de autenticación.")),
        ("Cambiado", pag(tabla_catalogo()) + toast("Cambiaste lo que se ofrece de Formularios."), ""),
        ("Un módulo que no se ofrece", pag(tabla_catalogo(filas=[CATALOGO[0], ("Formularios", "No", "No", "No", "No", "$ 25.000,00", "—", "—", "0"), CATALOGO[2]])), ""),
        ("Mercado Pago sin conectar", pag(tabla_catalogo(), f'<div style="margin-bottom: 16px;">{AVISO_SIN_MP}</div>'), ""),
        ("Solo lectura", pag(tabla_catalogo(sin_ops=True)), ""),
        ("Cargando", pag(tabla_catalogo(carga=True)), ""),
        ("Vacío", pag(tabla_catalogo(vacio="Todavía no hay módulos en el catálogo.")), ""),
        ("Error", pag(tabla_catalogo(error="No pudimos cargar el catálogo.")), ""),
        ("Sin permiso", sin_permiso_compu("Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    quien = [MARTIN] * (n - 1) + [SOFIA]
    marco = marco_plat([("Plataforma", "Organizaciones.dc.html"), ("Módulos", None)])
    rell = {"@MAIN@": [e[1] for e in est], "@VELO@": [e[2] for e in est],
            "@MENU_MOD@": [menu_mod_plat("Catálogo")] * (n - 1) + [""], **personas(quien)}
    return tablero("Organizaciones", "Catálogo de módulos · /plataforma/modulos", CSS_COMPU, marco, rell, [e[0] for e in est], 1440, 900)


def marco_tel_plat(mas=True, base="m_organizaciones"):
    t = marco_tel(base)
    return nav_mas_plat(t) if mas else t


def m_plat_mod_catalogo():
    def card(f, keb=True):
        pares = [("Se ofrece", f[1]), ("Se puede pedir", f[2]), ("Se puede probar", f[3]), ("Se puede suscribir", f[4]),
                 ("Precio por mes", f[5])]
        if f[6] != "—":
            pares += [("Precio nuevo", f[6]), ("Rige desde", f[7])]
        pares.append(("Suscripciones vivas", f[8]))
        return card_t(f[0], pares, keb=keb, href="M-Plat-MOD-Modulo.dc.html")
    lista = lambda filas=CATALOGO, keb=True: '<div class="ap-cuerpo"><div class="mod-cards">' + "".join(card(f, keb) for f in filas) + "</div></div>"
    marcas = hoja_t("Lo que se ofrece de Formularios",
                    "".join(f'<div class="mod-acepto" role="checkbox" aria-checked="{"true" if on else "false"}" style="padding: 10px 0;"><span class="caja{" on" if on else ""}">{I_TILDE_T if on else ""}</span><span>{t}</span></div>'
                            for t, on in (("Se ofrece", True), ("Se puede pedir", False), ("Se puede probar", True), ("Se puede suscribir", True)))
                    + cmp_t("Motivo", MOTIVO_MARCAS, req=True, area=True), cb("Cancelar") + cb("Guardar", "cb-pri"))
    est = [
        ("Catálogo", lista(), ""),
        ("Acciones de un módulo", lista(), hoja_ops("Formularios", OPS_CAT)),
        ("Cambiar lo que se ofrece", lista(), marcas),
        ("Mercado Pago sin conectar", aviso_t("Mercado Pago no está conectado: nadie se puede suscribir.", "aten") + lista(), ""),
        ("Solo lectura", lista(keb=False), ""),
        ("Cargando", f'<div class="ap-cuerpo">{carga_t()}</div>', ""),
        ("Vacío", f'<div class="ap-cuerpo">{vacio_t("Todavía no hay módulos en el catálogo.")}</div>', ""),
        ("Error", f'<div class="ap-cuerpo">{error_t("No pudimos cargar el catálogo.")}</div>', ""),
        ("Sin permiso", sin_permiso_t("M-Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    rell = {"@TBAR@": [barra_t("Módulos", "Plataforma", "M-Mas-Plat.dc.html")] * n, "@TCUERPO@": [e[1] for e in est], "@THOJA@": [e[2] for e in est]}
    return tablero("M-Organizaciones", "Catálogo de módulos · teléfono", CSS_TEL, marco_tel_plat(), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ Plat-MOD-Modulo
PRECIOS = [
    ("$ 28.000,00", "01/01/2027", "—", ("Por regir", "pend"), "Martín Sosa", "20/11/2026, 15:02"),
    ("$ 25.000,00", "01/09/2026", "31/12/2026", ("Vigente", "ok"), "Martín Sosa", "01/08/2026, 10:30"),
    ("$ 20.000,00", "01/03/2026", "31/08/2026", ("Anterior", "off"), "Sofía Medina", "30/01/2026, 11:45"),
]
COLS_PRE = [("Precio por mes", "num"), ("Rige desde", ""), ("Hasta", ""), ("Estado", ""), ("Lo cargó", ""), ("Cargado", ""), ("", "")]
PLANT_PRE = "130px 110px 110px minmax(0, 1fr) minmax(0, 1.2fr) 150px 28px"
DETALLE_PRECIO = [("Precio por mes", "$ 28.000,00"), ("Rige desde", "01/01/2027"), ("Tamaño máximo de un archivo", "10 MB"),
                  ("Formularios por planilla", "3"), ("Relecturas por persona y día", "5"), ("Motivo", "Ajuste por la suba de los costos de almacenamiento."),
                  ("Lo cargó", "Martín Sosa"), ("Cargado", "20/11/2026, 15:02"), ("Avisamos a", "5 organizaciones")]


def ficha_modulo(estado="Ficha", abierto=False, solo_lectura=False, ofrece=True, precios=PRECIOS, carga=False, error=False):
    if carga:
        return (banda("Formularios", "", "", atras="Plat-MOD-Catalogo.dc.html") + '<div class="pagina"><div class="tarjeta">'
                f'<div class="mod-carga" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div></div></div>')
    if error:
        return (banda("Formularios", "", "", atras="Plat-MOD-Catalogo.dc.html") + '<div class="pagina"><div class="tarjeta">'
                f'<div class="mod-bloque"><strong>No pudimos cargar el módulo.</strong>{b("Reintentar")}</div></div></div>')
    res = pill("Se ofrece", "ok") if ofrece else pill("No se ofrece", "off")
    marcas = [("Se ofrece", "Sí" if ofrece else "No"), ("Se puede pedir", "No"), ("Se puede probar", "Sí" if ofrece else "No"),
              ("Se puede suscribir", "Sí" if ofrece else "No"), ("Lo cambió", "Martín Sosa"), ("Cambiado", "20/11/2026, 14:55"),
              ("Motivo", MOTIVO_MARCAS)]
    acc_m = "" if solo_lectura else b("Cambiar")
    acc_p = "" if solo_lectura else b(f"{I_MAS} Nuevo precio", "b-sec")
    fs = []
    for p in precios:
        celdas = [num(p[0]), c(p[1]), c(p[2]), f'<span>{pill(p[3][0], p[3][1])}</span>', c(p[4]), c(p[5])]
        celdas.append('<span></span>' if solo_lectura and False else kebab("el precio del " + p[1], [(I_OJO, "Ver el detalle")] if (abierto and p is precios[0]) else None))
        fs.append((celdas, ""))
    t = tabla(COLS_PRE, PLANT_PRE, fs, pie=False, ordenada=1, desc=True, vacio="Todavía no tiene precios." if not precios else None)
    zonas = zona("Lo que se ofrece", dl(marcas), acc_m) + zona("Precios", t, acc_p, "cuerpo sin")
    return banda("Formularios", res, "", atras="Plat-MOD-Catalogo.dc.html") + f'<div class="pagina"><div class="mod-zonas">{zonas}</div></div>'


def plat_mod_modulo():
    est = [
        ("Ficha", ficha_modulo(), ""),
        ("Acciones de un precio", ficha_modulo(abierto=True), ""),
        ("Detalle de un precio", ficha_modulo(), dialogo("El precio del 01/01/2027", dl(DETALLE_PRECIO), b("Cerrar", "b-pri"), medio=True)),
        ("Cambiar lo que se ofrece", ficha_modulo(), dialogo_marcas()),
        ("Cambiar lo que se ofrece: guardando", ficha_modulo(), dialogo_marcas("Guardando")),
        ("No se ofrece", ficha_modulo(ofrece=False), ""),
        ("Sin precios", ficha_modulo(precios=[]), ""),
        ("Solo lectura", ficha_modulo(solo_lectura=True), ""),
        ("Cargando", ficha_modulo(carga=True), ""),
        ("Error", ficha_modulo(error=True), ""),
        ("Sin permiso", sin_permiso_compu("Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    quien = [MARTIN] * (n - 1) + [SOFIA]
    marco = marco_plat([("Plataforma", "Organizaciones.dc.html"), ("Módulos", "Plat-MOD-Catalogo.dc.html"), ("Formularios", None)])
    rell = {"@MAIN@": [e[1] for e in est], "@VELO@": [e[2] for e in est], "@MENU_MOD@": [menu_mod_plat("Catálogo")] * (n - 1) + [""], **personas(quien)}
    return tablero("Organizaciones", "Un módulo · /plataforma/modulos/formularios", CSS_COMPU, marco, rell, [e[0] for e in est], 1440, 900)


def m_plat_mod_modulo():
    def ficha(ofrece=True, precios=PRECIOS, ro=False):
        marcas = [("Se ofrece", "Sí" if ofrece else "No"), ("Se puede pedir", "No"), ("Se puede probar", "Sí" if ofrece else "No"),
                  ("Se puede suscribir", "Sí" if ofrece else "No"), ("Lo cambió", "Martín Sosa"), ("Cambiado", "20/11/2026, 14:55"), ("Motivo", MOTIVO_MARCAS)]
        s = f'<span class="mod-tsec">Lo que se ofrece</span><div class="mod-ttarj">{kv_t(marcas)}</div><span class="mod-tsec">Precios</span>'
        if precios:
            s += '<div class="mod-cards" style="padding-top: 0;">' + "".join(
                card_t(p[0], [("Rige desde", p[1]), ("Hasta", p[2]), ("Estado", est_t(p[3][0], {"ok": "", "pend": "azul", "off": "off"}[p[3][1]])),
                              ("Lo cargó", p[4]), ("Cargado", p[5])]) for p in precios) + "</div>"
        else:
            s += f'<div class="mod-ttarj">{vacio_t("Todavía no tiene precios.").replace("72px 24px", "24px")}</div>'
        fab = "" if ro else f'<a class="ap-fab" aria-label="Nuevo precio" href="M-Plat-MOD-Precio.dc.html">{icono("<path d=\'M12 5v14M5 12h14\'/>", 24, "2")}</a>'
        return f'<div class="ap-cuerpo">{s}</div>{fab}'
    bar = lambda est: barra_t("Formularios", est, "M-Plat-MOD-Catalogo.dc.html", keb_t("Formularios"))
    est = [
        ("Ficha", bar("Se ofrece"), ficha(), ""),
        ("Acciones del módulo", bar("Se ofrece"), ficha(), hoja_ops("Formularios", [(I_MARCAS, "Cambiar lo que se ofrece")])),
        ("Detalle de un precio", bar("Se ofrece"), ficha(), hoja_t("El precio del 01/01/2027", kv_t(DETALLE_PRECIO), cb("Cerrar", "cb-pri"))),
        ("No se ofrece", bar("No se ofrece"), ficha(ofrece=False), ""),
        ("Sin precios", bar("Se ofrece"), ficha(precios=[]), ""),
        ("Solo lectura", barra_t("Formularios", "Se ofrece", "M-Plat-MOD-Catalogo.dc.html"), ficha(ro=True), ""),
        ("Cargando", bar(""), f'<div class="ap-cuerpo">{carga_t()}</div>', ""),
        ("Error", bar(""), f'<div class="ap-cuerpo">{error_t("No pudimos cargar el módulo.")}</div>', ""),
        ("Sin permiso", barra_t("Módulos", "Plataforma", "M-Mas-Plat.dc.html"), sin_permiso_t("M-Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    rell = {"@TBAR@": [e[1] for e in est], "@TCUERPO@": [e[2] for e in est], "@THOJA@": [e[3] for e in est]}
    return tablero("M-Organizaciones", "Un módulo · teléfono", CSS_TEL, marco_tel_plat(), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ Plat-MOD-Precio
AVISO_PRECIO = "Al guardarlo, les avisamos a las 5 organizaciones con una suscripción viva. Un precio no se edita ni se borra."
TOPES_DECL = [("Tamaño máximo de un archivo", "10", "MB", "Entre 1 y 25 MB: el mínimo de Formularios y el máximo de la plataforma."),
              ("Formularios por planilla", "3", "", "Entre 1 y 10: el mínimo de Formularios y el máximo de la plataforma."),
              ("Relecturas por persona y día", "5", "", "Entre 0 y 20: el mínimo de Formularios y el máximo de la plataforma.")]


def dialogo_precio(estado):
    vacio = estado == "Nuevo precio"
    monto = "" if vacio else "28.000,00"
    desde = "" if vacio else "01/01/2027"
    err_desde = "Como pronto, el 23/12/2026: 30 días de aviso." if estado == "Desde muy pronto" else None
    if estado == "Desde muy pronto":
        desde = "01/12/2026"
    campos = [con_unidad("Precio por mes", monto, "$", req=True, prefijo=True, id_="np-monto"),
              f'<div class="campo2"><label class="et" for="np-desde">Rige desde<span class="req" aria-hidden="true">*</span>'
              f'{info("Como pronto, 30 días después de hoy: los días de aviso de un precio nuevo.")}</label>'
              f'<div class="mod-prebox{" in2 mal" if err_desde else ""}" style="padding: 0;"><input class="in2" id="np-desde" type="text" value="{desde}" placeholder="DD/MM/AAAA">'
              f'<span class="uni">{I_FECHA}</span></div>{f"<span class=mod-campo-err>{err_desde}</span>" if err_desde else ""}</div>']
    topes = []
    for k, (et, v, uni, i) in enumerate(TOPES_DECL):
        err = "Entre 1 y 25 MB." if (estado == "Un tope fuera de rango" and k == 0) else None
        val = "40" if err else ("" if vacio else v)
        topes.append(con_unidad(et, val, uni or "—", req=True, info_=i, error=err, id_=f"np-t{k}").replace('<span class="uni">—</span>', ""))
    cuerpo = ('<div class="mod-dl" style="grid-template-columns: 1fr;"></div>' if False else "") + "".join(campos)
    cuerpo += '<span class="et" style="grid-column: 1 / -1; margin: 6px 0 -4px; font-weight: 600; color: var(--t1);">Lo que incluye</span>'
    cuerpo += "".join(topes)
    cuerpo += campo("Motivo", "" if vacio else "Ajuste por la suba de los costos de almacenamiento.", req=True, area=True, ancho=True,
                    error="Escribí el motivo." if estado == "Sin motivo" else None)
    cuerpo += aviso(AVISO_PRECIO, "aten")
    if estado == "No se pudo guardar":
        cuerpo = aviso("No pudimos guardar el precio. Probá de nuevo.", "mal") + cuerpo
    if estado == "Sin permiso":
        cuerpo = aviso("No tenés permiso para cargar precios.", "mal") + cuerpo
    if estado == "Guardando":
        pie = '<button type="button" class="b b-sec" disabled>Cancelar</button>' + b("Guardando…", "b-pri", trabaja=True)
    elif estado == "Cargando":
        cuerpo = f'<div class="mod-carga" style="height: 260px; grid-column: 1 / -1;" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div>'
        pie = b("Cancelar") + b("Guardar precio", "b-pri", apagado="Esperá a que carguen los topes del módulo.")
    elif estado == "Error al cargar":
        cuerpo = f'<div class="mod-bloque" style="grid-column: 1 / -1;"><strong>No pudimos cargar los topes del módulo.</strong>{b("Reintentar")}</div>'
        pie = b("Cancelar") + b("Guardar precio", "b-pri", apagado="Faltan los topes del módulo.")
    elif vacio:
        pie = b("Cancelar") + b("Guardar precio", "b-pri", apagado="Completá el precio, desde cuándo rige, los topes y el motivo.")
    else:
        pie = b("Cancelar") + b("Guardar precio", "b-pri")
    return dialogo("Nuevo precio de Formularios", cuerpo, pie, medio=True)


def plat_mod_precio():
    nombres = ["Nuevo precio", "Completo", "Desde muy pronto", "Un tope fuera de rango", "Sin motivo", "Guardar: confirmá que sos vos",
               "Guardando", "No se pudo guardar", "Cargando", "Error al cargar", "Sin permiso"]
    est = []
    for nm in nombres:
        if nm == "Guardar: confirmá que sos vos":
            est.append((nm, ficha_modulo(), reauth("Para guardar el precio nuevo, escribí el código de tu app de autenticación.")))
        else:
            est.append((nm, ficha_modulo(), dialogo_precio(nm)))
    est.append(("Guardado", ficha_modulo() + toast("Guardaste el precio nuevo. Les avisamos a 5 organizaciones."), ""))
    n = len(est)
    marco = marco_plat([("Plataforma", "Organizaciones.dc.html"), ("Módulos", "Plat-MOD-Catalogo.dc.html"), ("Formularios", None)])
    rell = {"@MAIN@": [e[1] for e in est], "@VELO@": [e[2] for e in est], "@MENU_MOD@": [menu_mod_plat("Catálogo")] * n, **personas([MARTIN] * n)}
    return tablero("Organizaciones", "Nuevo precio de un módulo", CSS_COMPU, marco, rell, [e[0] for e in est], 1440, 900)


def m_plat_mod_precio():
    def form(estado):
        vacio = estado == "Nuevo precio"
        campos = (cmp_t("Precio por mes", "$" if vacio else "$ 28.000,00", req=True, vacio=vacio)
                  + cmp_t("Rige desde", "DD/MM/AAAA" if vacio else ("01/12/2026" if estado == "Desde muy pronto" else "01/01/2027"), req=True, vacio=vacio,
                          info_="Como pronto, 30 días después de hoy: los días de aviso de un precio nuevo.",
                          error="Como pronto, el 23/12/2026: 30 días de aviso." if estado == "Desde muy pronto" else None))
        topes = "".join(cmp_t(et + (f" ({u})" if u else ""), "" if vacio else ("40" if (estado == "Un tope fuera de rango" and k == 0) else v), req=True, vacio=vacio,
                              info_=i, error="Entre 1 y 25 MB." if (estado == "Un tope fuera de rango" and k == 0) else None)
                        for k, (et, v, u, i) in enumerate(TOPES_DECL))
        motivo = cmp_t("Motivo", "" if vacio else "Ajuste por la suba de los costos de almacenamiento.", req=True, area=True)
        s = (f'<div class="mod-ttarj" style="margin-top: 12px;">{campos}</div><span class="mod-tsec">Lo que incluye</span><div class="mod-ttarj">{topes}</div>'
             f'<div class="mod-ttarj" style="margin-top: 12px;">{motivo}</div>' + aviso_t(AVISO_PRECIO, "aten"))
        if estado == "No se pudo guardar":
            s = aviso_t("No pudimos guardar el precio. Probá de nuevo.", "mal") + s
        if estado == "Guardando":
            pie = cb("Guardando…", "cb-pri full", trabaja=True)
        elif vacio:
            pie = cb("Guardar precio", "cb-pri full", apagado="Completá el precio, desde cuándo rige, los topes y el motivo.")
        else:
            pie = cb("Guardar precio", "cb-pri full")
        return f'<div class="ap-cuerpo" style="padding-bottom: 16px;">{s}</div><div class="ap-fijo">{pie}</div>'
    bar = barra_t("Nuevo precio", "Formularios", "M-Plat-MOD-Modulo.dc.html")
    otp = "".join(f'<div class="ct" style="width: 44px; justify-content: center;">{d}</div>' for d in "482913")
    reauth_t = hoja_t("Confirmá que sos vos", '<p class="ap-txt-l" style="margin: 0 0 12px;">Para guardar el precio nuevo, escribí el código de tu app de autenticación.</p>'
                      f'<div style="display: flex; gap: 8px;">{otp}</div>', cb("Cancelar") + cb("Confirmar", "cb-pri"), alerta=True)
    est = [(nm, form(nm), "") for nm in ["Nuevo precio", "Completo", "Desde muy pronto", "Un tope fuera de rango", "Guardando", "No se pudo guardar"]]
    est.insert(4, ("Guardar: confirmá que sos vos", form("Completo"), reauth_t))
    est += [("Cargando", f'<div class="ap-cuerpo">{carga_t()}</div>', ""), ("Error al cargar", f'<div class="ap-cuerpo">{error_t("No pudimos cargar los topes del módulo.")}</div>', ""),
            ("Sin permiso", sin_permiso_t("M-Organizaciones.dc.html"), "")]
    n = len(est)
    rell = {"@TBAR@": [bar] * n, "@TCUERPO@": [e[1] for e in est], "@THOJA@": [e[2] for e in est]}
    return tablero("M-Organizaciones", "Nuevo precio de un módulo · teléfono", CSS_TEL, marco_tel("m_organizaciones", sin_nav=True), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ Plat-MOD-Pedidos
PEDIDOS = [
    # organización, módulo, pedido, pidió, estado
    ("Grupo Delta", "Formularios", "23/11/2026, 09:12", "Ana López", ("Pendiente", "pend")),
    ("Beta S.R.L.", "Asistente", "22/11/2026, 18:40", "Beto Ramírez", ("Pendiente", "pend")),
    ("Omega S.A.", "WhatsApp", "21/11/2026, 11:05", "Carla Núñez", ("Pendiente", "pend")),
    ("Kappa S.R.L.", "Formularios", "10/11/2026, 16:20", "Pablo Ortiz", ("Pendiente", "pend")),
    ("Grupo Delta", "Asistente", "02/11/2026, 10:30", "Lucía Fernández", ("Aprobado", "ok")),
    ("Omega S.A.", "Formularios", "28/10/2026, 14:15", "Carla Núñez", ("Rechazado", "mal")),
    ("Grupo Delta", "WhatsApp", "15/10/2026, 09:00", "Lucía Fernández", ("Cancelado", "off")),
]
COLS_PED = [("Organización", ""), ("Módulo", ""), ("Pedido", ""), ("Pidió", ""), ("Estado", ""), ("", "")]
PLANT_PED = "minmax(0, 1.3fr) minmax(0, 1fr) 170px minmax(0, 1.2fr) minmax(0, 1fr) 28px"
OPS_PED = [(I_APROBAR, "Aprobar"), (I_RECHAZAR, "Rechazar")]
CERRADA = "Kappa S.R.L. está cerrada."


def tabla_pedidos(abierto=None, filas=PEDIDOS, carga=False, vacio=None, error=None, ro=False):
    fs = []
    for k, f in enumerate(filas):
        celdas = [f'<span class="c1"><a class="mod-nombre" href="Plat-Org-Modulos.dc.html">{f[0]}</a></span>', c(f[1]), c(f[2]), c(f[3]),
                  f'<span>{pill(*f[4])}</span>']
        pendiente = f[4][0] == "Pendiente"
        if not pendiente or ro:
            celdas.append("<span></span>")
        else:
            ops = None
            if abierto == k:
                ops = OPS_PED if f[0] != "Kappa S.R.L." else [(I_APROBAR, "Aprobar", None, CERRADA), (I_RECHAZAR, "Rechazar", None, CERRADA)]
            celdas.append(kebab(f"el pedido de {f[0]}", ops))
        fs.append((celdas, ""))
    return tabla(COLS_PED, PLANT_PED, fs, carga=carga, vacio=vacio, error=error, ordenada=2, desc=True)


def dialogo_aprobar(org="Grupo Delta", modulo="Formularios", estado="", extra_dl=None):
    datos = [("Organización", org), ("Módulo", modulo), ("Pedido", "23/11/2026, 09:12"), ("Pidió", "Ana López")] + (extra_dl or [])
    venc = (f'<div class="campo2"><label class="et" for="ap-vence">Vence{info("Sin fecha, queda prendido hasta que lo apagues.")}</label>'
            f'<div class="mod-prebox" style="padding: 0;"><input class="in2" id="ap-vence" type="text" value="{VENCE_APROB if estado != "vacio" else ""}" placeholder="Sin vencimiento">'
            f'<span class="uni">{I_FECHA}</span></div></div>')
    av = ""
    if org == "Beta S.R.L.":
        av = aviso("Beta S.R.L. está suspendida: el módulo queda prendido, y lo usan cuando se reactive.", "aten")
    cuerpo = dl(datos) + av + venc + campo("Motivo", "" if estado == "sin motivo" else "Pidió probarlo con su equipo de ventas antes de suscribirse.",
                                          req=True, area=True, ancho=True, error="Escribí el motivo." if estado == "sin motivo" else None)
    pie = b("Cancelar") + (b("Aprobando…", "b-pri", trabaja=True) if estado == "aprobando" else b("Aprobar", "b-pri"))
    return dialogo(f"Aprobar el pedido de {org}", cuerpo, pie, medio=True)


def dialogo_rechazar(estado=""):
    datos = [("Organización", "Grupo Delta"), ("Módulo", "Formularios"), ("Pedido", "23/11/2026, 09:12"), ("Pidió", "Ana López")]
    cuerpo = dl(datos) + campo("Motivo", MOTIVO_RECHAZO, req=True, area=True, ancho=True) + aviso("Grupo Delta ve el motivo.")
    return dialogo("Rechazar el pedido de Grupo Delta", cuerpo, b("Cancelar") + b("Rechazar", "b-pri"), medio=True)


def plat_mod_pedidos():
    T = banda("Pedidos de módulos", "", "")
    F = filtros("Buscar por organización", ["Estado: todos", "Módulo: todos"])
    pag = lambda cuerpo, f=F: T + f'<div class="pagina">{f}{cuerpo}</div>'
    est = [
        ("Pedidos", pag(tabla_pedidos()), ""),
        ("Estado: menú", pag(tabla_pedidos(), filtros("Buscar por organización", ["Estado: todos", "Módulo: todos"],
                                                       (0, ["Todos", "Pendientes", "Aprobados", "Rechazados", "Cancelados"], "Todos"))), ""),
        ("Solo los pendientes", pag(tabla_pedidos(filas=PEDIDOS[:4]), filtros("Buscar por organización", ["Estado: pendientes", "Módulo: todos"])), ""),
        ("Acciones de un pedido", pag(tabla_pedidos(0)), ""),
        ("Aprobar", pag(tabla_pedidos()), dialogo_aprobar()),
        ("Aprobar: sin motivo", pag(tabla_pedidos()), dialogo_aprobar(estado="sin motivo")),
        ("Aprobar: confirmá que sos vos", pag(tabla_pedidos()), reauth("Para aprobar el pedido, escribí el código de tu app de autenticación.")),
        ("Aprobando", pag(tabla_pedidos()), dialogo_aprobar(estado="aprobando")),
        ("Aprobado", pag(tabla_pedidos(filas=[PEDIDOS[0][:4] + (("Aprobado", "ok"),)] + PEDIDOS[1:])) + toast("Aprobaste Formularios para Grupo Delta."), ""),
        ("Rechazar", pag(tabla_pedidos()), dialogo_rechazar()),
        ("Módulo suspendido", pag(tabla_pedidos()), dialogo_aprobar(extra_dl=[("Estado del módulo", pill("Suspendido", "alerta", f"Los datos se guardan hasta el {BORRA}.", True))])),
        ("Organización suspendida", pag(tabla_pedidos()), dialogo_aprobar("Beta S.R.L.", "Asistente").replace("23/11/2026, 09:12", "22/11/2026, 18:40").replace("Ana López", "Beto Ramírez")),
        ("Organización cerrada", pag(tabla_pedidos(3)), ""),
        ("Solo lectura", pag(tabla_pedidos(ro=True)), ""),
        ("Cargando", pag(tabla_pedidos(carga=True)), ""),
        ("Vacía", pag(tabla_pedidos(vacio="Todavía no hay pedidos.")), ""),
        ("Error", pag(tabla_pedidos(error="No pudimos cargar los pedidos.")), ""),
        ("Sin permiso", sin_permiso_compu("Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    quien = [MARTIN] * (n - 1) + [SOFIA]
    marco = marco_plat([("Plataforma", "Organizaciones.dc.html"), ("Módulos", "Plat-MOD-Catalogo.dc.html"), ("Pedidos", None)])
    rell = {"@MAIN@": [e[1] for e in est], "@VELO@": [e[2] for e in est], "@MENU_MOD@": [menu_mod_plat("Pedidos")] * (n - 1) + [""], **personas(quien)}
    return tablero("Organizaciones", "Pedidos de módulos · /plataforma/modulos/pedidos", CSS_COMPU, marco, rell, [e[0] for e in est], 1440, 900)


def m_plat_mod_pedidos():
    def lista(filas=PEDIDOS[:4], ro=False):
        cs = "".join(card_t(f[0], [("Módulo", f[1]), ("Pedido", f[2]), ("Pidió", f[3]), ("Estado", est_t(f[4][0], {"pend": "azul", "ok": "", "mal": "mal", "off": "off"}[f[4][1]]))],
                            keb=not ro and f[4][0] == "Pendiente") for f in filas)
        return f'<div class="ap-cuerpo"><div class="mod-cards">{cs}</div></div>'
    aprobar = hoja_t("Aprobar el pedido de Grupo Delta", kv_t([("Módulo", "Formularios"), ("Pedido", "23/11/2026, 09:12"), ("Pidió", "Ana López")])
                     + cmp_t("Vence", VENCE_APROB, info_="Sin fecha, queda prendido hasta que lo apagues.")
                     + cmp_t("Motivo", "Pidió probarlo con su equipo de ventas antes de suscribirse.", req=True, area=True), cb("Cancelar") + cb("Aprobar", "cb-pri"))
    rechazar = hoja_t("Rechazar el pedido de Grupo Delta", kv_t([("Módulo", "Formularios"), ("Pedido", "23/11/2026, 09:12")])
                      + cmp_t("Motivo", MOTIVO_RECHAZO, req=True, area=True) + aviso("Grupo Delta ve el motivo."), cb("Cancelar") + cb("Rechazar", "cb-pri"))
    susp = hoja_t("Aprobar el pedido de Beta S.R.L.", kv_t([("Módulo", "Asistente"), ("Pedido", "22/11/2026, 18:40"), ("Pidió", "Beto Ramírez")])
                  + aviso("Beta S.R.L. está suspendida: el módulo queda prendido, y lo usan cuando se reactive.", "aten")
                  + cmp_t("Motivo", "", req=True, area=True, vacio=True), cb("Cancelar") + cb("Aprobar", "cb-pri"))
    est = [
        ("Pedidos", lista(), ""),
        ("Acciones de un pedido", lista(), hoja_ops("El pedido de Grupo Delta", OPS_PED)),
        ("Aprobar", lista(), aprobar),
        ("Rechazar", lista(), rechazar),
        ("Módulo suspendido", lista(), hoja_t("Aprobar el pedido de Grupo Delta", kv_t([("Módulo", "Formularios"), ("Estado del módulo", est_t("Suspendido", "amb", f"Los datos se guardan hasta el {BORRA}.", True))])
                                               + cmp_t("Motivo", "", req=True, area=True, vacio=True), cb("Cancelar") + cb("Aprobar", "cb-pri"))),
        ("Organización suspendida", lista(), susp),
        ("Organización cerrada", lista(), hoja_ops("El pedido de Kappa S.R.L.", [(I_APROBAR, "Aprobar", None, CERRADA), (I_RECHAZAR, "Rechazar", None, CERRADA)])),
        ("Aprobado", lista([PEDIDOS[0][:4] + (("Aprobado", "ok"),)] + PEDIDOS[1:4]) + snack("Aprobaste Formularios para Grupo Delta."), ""),
        ("Cargando", f'<div class="ap-cuerpo">{carga_t()}</div>', ""),
        ("Vacía", f'<div class="ap-cuerpo">{vacio_t("Todavía no hay pedidos.")}</div>', ""),
        ("Error", f'<div class="ap-cuerpo">{error_t("No pudimos cargar los pedidos.")}</div>', ""),
        ("Sin permiso", sin_permiso_t("M-Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    filtro = f'<button type="button" class="ap-ib" aria-label="Filtros">{icono("<path d=\'M4 6h16M7 12h10M10 18h4\'/>", 22, "2")}</button>'
    rell = {"@TBAR@": [barra_t("Pedidos de módulos", "Plataforma", "M-Mas-Plat.dc.html", filtro)] * (n - 1) + [barra_t("Pedidos de módulos", "Plataforma", "M-Mas-Plat.dc.html")],
            "@TCUERPO@": [e[1] for e in est], "@THOJA@": [e[2] for e in est]}
    return tablero("M-Organizaciones", "Pedidos de módulos · teléfono", CSS_TEL, marco_tel_plat(), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ Plat-MOD-Suscripciones
SUSCRIPCIONES = [
    ("Grupo Delta", "Formularios", ("Activa", "ok"), "$ 25.000,00", PROX_COBRO),
    ("Grupo Delta", "WhatsApp", ("Activa", "ok"), "$ 45.000,00", "12/12/2026"),
    ("Omega S.A.", "Formularios", ("Cobro rechazado", "mal"), "$ 25.000,00", "—"),
    ("Beta S.R.L.", "Asistente", ("Activa", "ok"), "$ 30.000,00", "28/11/2026"),
    ("Omega S.A.", "Asistente", ("En prueba", "pend"), "$ 30.000,00", FIN_PRUEBA),
    ("Gamma S.A.", "WhatsApp", ("Baja pedida", "alerta"), "$ 45.000,00", "—"),
    ("Kappa S.R.L.", "Formularios", ("Cancelada", "off"), "$ 25.000,00", "—"),
]
COLS_SUS = [("Organización", ""), ("Módulo", ""), ("Estado", ""), ("Precio por mes", "num"), ("Próximo cobro", ""), ("", "")]
PLANT_SUS = "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) 140px 130px 28px"
COBROS = [
    ("05/11/2026, 03:12", "05/11/2026 – 04/12/2026", "$ 25.000,00", ("Aprobado", "ok"), "98765432101", "", ("Pendiente", "pend")),
    ("05/11/2026, 03:14", "05/11/2026 – 04/12/2026", "$ 25.000,00", ("Aprobado", "ok"), "98765432188", "Sí", ("Pendiente", "pend")),
    ("05/10/2026, 03:10", "05/10/2026 – 04/11/2026", "$ 25.000,00", ("Aprobado", "ok"), "98765431950", "", ("Pendiente", "pend")),
    ("05/09/2026, 03:11", "05/09/2026 – 04/10/2026", "$ 25.000,00", ("Rechazado", "mal"), "98765431702", "", ("—", "")),
]
COLS_COB = [("Fecha", ""), ("Período", ""), ("Monto", "num"), ("Estado", ""), ("Id de Mercado Pago", ""), ("Repetido", ""), ("Factura", "")]
PLANT_COB = "140px minmax(0, 1fr) 110px 110px 140px 90px 100px"
REPETIDO = "Segundo cobro aprobado del mismo período. Devolvelo a mano en Mercado Pago."


def tabla_suscripciones(carga=False, vacio=None, error=None, filas=SUSCRIPCIONES):
    fs = []
    for f in filas:
        celdas = [f'<span class="c1"><a class="mod-nombre" href="#">{f[0]}</a></span>', c(f[1]), f'<span>{pill(*f[2])}</span>', num(f[3]), c(f[4]),
                  kebab(f"la suscripción de {f[0]}")]
        fs.append((celdas, ""))
    return tabla(COLS_SUS, PLANT_SUS, fs, carga=carga, vacio=vacio, error=error)


def ficha_suscripcion(org="Grupo Delta", estado=("Activa", "ok"), datos_extra=None, cobros=COBROS, tip_rep=True, i_estado=None, carga=False, error=False):
    titulo = f"{org} · Formularios"
    if carga or error:
        cuerpo = (f'<div class="mod-carga" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div>' if carga
                  else f'<div class="mod-bloque"><strong>No pudimos cargar la suscripción.</strong>{b("Reintentar")}</div>')
        return banda(titulo, "", "", atras="Plat-MOD-Suscripciones.dc.html") + f'<div class="pagina"><div class="tarjeta">{cuerpo}</div></div>'
    datos = [("Organización", org), ("Módulo", "Formularios"), ("Precio por mes", "$ 25.000,00"), ("Próximo cobro", PROX_COBRO if estado[0] == "Activa" else "—"),
             ("Desde", "05/09/2026, 10:41"), ("Tarjeta", "Visa terminada en 4521"), ("Id de Mercado Pago", "2c9380848f3e1a7b018f4c2d")] + (datos_extra or [])
    fs = []
    for f in cobros:
        rep = f[5]
        celda_rep = (f'<span>{rep}{info(REPETIDO, tip_rep, "der")}</span>' if rep else c("—", "t3"))
        fs.append(([c(f[0]), c(f[1]), num(f[2]), f'<span>{pill(*f[3])}</span>', c(f[4]), celda_rep,
                    f'<span>{pill(*f[6])}</span>' if f[6][1] else c("—", "t3")], ""))
    t = tabla(COLS_COB, PLANT_COB, fs, pie=False, vacio="Todavía no hay cobros." if not cobros else None, desc=True)
    zonas = zona("Suscripción", dl(datos, "dos")) + zona("Cobros", t, "", "cuerpo sin")
    return (banda(titulo, pill(estado[0], estado[1], i_estado, bool(i_estado)), "", atras="Plat-MOD-Suscripciones.dc.html")
            + f'<div class="pagina"><div class="mod-zonas">{zonas}</div></div>')


def plat_mod_suscripciones():
    T = banda("Suscripciones", "", "")
    F = filtros("Buscar por organización", ["Estado: todas", "Módulo: todos"])
    pag = lambda cuerpo, f=F: T + f'<div class="pagina">{f}{cuerpo}</div>'
    est = [
        ("Suscripciones", pag(tabla_suscripciones())),
        ("Estado: menú", pag(tabla_suscripciones(), filtros("Buscar por organización", ["Estado: todas", "Módulo: todos"],
                                                             (0, ["Todas", "Pendientes", "En prueba", "Activas", "Cobro rechazado", "Baja pedida", "Pausadas", "Canceladas"], "Todas")))),
        ("Ficha, con un cobro repetido", ficha_suscripcion()),
        ("Ficha: módulo suspendido", ficha_suscripcion("Omega S.A.", ("Suspendida", "alerta"), [("Motivo", "Venció la gracia del cobro rechazado.")],
                                                       COBROS[3:], tip_rep=False, i_estado=f"Los datos se borran el {BORRA}.")),
        ("Ficha: organización suspendida", ficha_suscripcion("Beta S.R.L.", datos_extra=[("Estado de la organización", pill("Suspendida", "alerta", "Suspenderla no toca la suscripción: se sigue cobrando.", True))],
                                                             cobros=[COBROS[0], COBROS[2]])),
        ("Ficha: organización cerrada", ficha_suscripcion("Kappa S.R.L.", ("Cancelada", "off"), [("Estado de la organización", pill("Cerrada", "off")),
                                                                                                ("Motivo de la baja", "La organización se cerró: se dio de baja en Mercado Pago, sin reembolso.")],
                                                          cobros=[COBROS[2]])),
        ("Ficha: sin cobros", ficha_suscripcion("Omega S.A.", ("En prueba", "pend"), cobros=[])),
        ("Ficha: cargando", ficha_suscripcion(carga=True)),
        ("Cargando", pag(tabla_suscripciones(carga=True))),
        ("Vacía", pag(tabla_suscripciones(vacio="Todavía no hay suscripciones."))),
        ("Sin coincidencias", pag(tabla_suscripciones(vacio="Ninguna suscripción coincide con los filtros."),
                                  filtros("Buscar por organización", ["Estado: canceladas", "Módulo: WhatsApp"]))),
        ("Error", pag(tabla_suscripciones(error="No pudimos cargar las suscripciones."))),
        ("Sin permiso", sin_permiso_compu("Organizaciones.dc.html")),
    ]
    n = len(est)
    quien = [MARTIN] * (n - 1) + [SOFIA]
    marco = marco_plat([("Plataforma", "Organizaciones.dc.html"), ("Módulos", "Plat-MOD-Catalogo.dc.html"), ("Suscripciones", None)])
    rell = {"@MAIN@": [e[1] for e in est], "@VELO@": [""] * n, "@MENU_MOD@": [menu_mod_plat("Suscripciones")] * (n - 1) + [""], **personas(quien)}
    return tablero("Organizaciones", "Suscripciones · /plataforma/modulos/suscripciones", CSS_COMPU, marco, rell, [e[0] for e in est], 1440, 900)


def m_plat_mod_suscripciones():
    cls = {"ok": "", "pend": "azul", "mal": "mal", "off": "off", "alerta": "amb"}
    lista = '<div class="ap-cuerpo"><div class="mod-cards">' + "".join(
        card_t(f[0], [("Módulo", f[1]), ("Estado", est_t(f[2][0], cls[f[2][1]])), ("Precio por mes", f[3]), ("Próximo cobro", f[4])], keb=False)
        for f in SUSCRIPCIONES) + "</div></div>"
    def ficha(org="Grupo Delta", estado=("Activa", ""), extra=None, cobros=COBROS):
        datos = [("Estado", est_t(*estado)), ("Precio por mes", "$ 25.000,00"), ("Próximo cobro", PROX_COBRO if estado[0] == "Activa" else "—"),
                 ("Desde", "05/09/2026, 10:41"), ("Tarjeta", "Visa terminada en 4521"), ("Id de Mercado Pago", "2c9380848f3e1a7b018f4c2d")] + (extra or [])
        cs = "".join(card_t(f[0], [("Período", f[1]), ("Monto", f[2]), ("Estado", est_t(f[3][0], cls[f[3][1]])), ("Id de Mercado Pago", f[4])]
                            + ([("Repetido", "Sí" + info(REPETIDO, True))] if f[5] else []) + ([("Factura", est_t("Pendiente", "azul"))] if f[6][1] else []),
                            keb=False) for f in cobros)
        return (f'<div class="ap-cuerpo"><span class="mod-tsec">Suscripción</span><div class="mod-ttarj">{kv_t(datos)}</div>'
                f'<span class="mod-tsec">Cobros</span><div class="mod-cards" style="padding-top: 0;">{cs or vacio_t("Todavía no hay cobros.")}</div></div>')
    bar_l = barra_t("Suscripciones", "Plataforma", "M-Mas-Plat.dc.html")
    bar_f = lambda org: barra_t(f"{org}", "Formularios", "M-Plat-MOD-Suscripciones.dc.html")
    est = [
        ("Suscripciones", bar_l, lista),
        ("Ficha, con un cobro repetido", bar_f("Grupo Delta"), ficha(cobros=COBROS[:2])),
        ("Ficha: módulo suspendido", bar_f("Omega S.A."), ficha("Omega S.A.", ("Suspendida", "amb"), [("Se borran los datos", BORRA)], COBROS[3:])),
        ("Ficha: organización suspendida", bar_f("Beta S.R.L."), ficha("Beta S.R.L.", extra=[("Estado de la organización", est_t("Suspendida", "amb"))], cobros=[COBROS[0]])),
        ("Ficha: organización cerrada", bar_f("Kappa S.R.L."), ficha("Kappa S.R.L.", ("Cancelada", "off"), [("Estado de la organización", est_t("Cerrada", "off")),
                                                                                                        ("Motivo de la baja", "La organización se cerró.")], [COBROS[2]])),
        ("Cargando", bar_l, f'<div class="ap-cuerpo">{carga_t()}</div>'),
        ("Vacía", bar_l, f'<div class="ap-cuerpo">{vacio_t("Todavía no hay suscripciones.")}</div>'),
        ("Error", bar_l, f'<div class="ap-cuerpo">{error_t("No pudimos cargar las suscripciones.")}</div>'),
        ("Sin permiso", bar_l, sin_permiso_t("M-Organizaciones.dc.html")),
    ]
    n = len(est)
    rell = {"@TBAR@": [e[1] for e in est], "@TCUERPO@": [e[2] for e in est], "@THOJA@": [""] * n}
    return tablero("M-Organizaciones", "Suscripciones · teléfono", CSS_TEL, marco_tel_plat(), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ Plat-Org-Modulos
# Cada módulo con sus filas por origen (0069 §1): (módulo, estado del módulo, [(origen, estado de la fila, desde, vence)]).
MODULOS_ORG = [
    ("Asistente", ("Prendido", "ok"), [("Manual", ("Prendido", "ok"), "12/01/2026", "—"), ("Prueba", ("Terminada", "off"), "01/10/2026", "15/10/2026")]),
    ("Formularios", ("Prendido", "ok"), [("Aprobado", ("Vigente", "ok"), "20/11/2026", VENCE_APROB), ("Prueba", ("Terminada", "off"), "01/10/2026", "15/10/2026")]),
    ("WhatsApp", ("Prendido", "ok"), [("Suscripción", ("Activa", "ok"), "05/09/2026", "—"), ("Manual", ("Apagado", "off"), "12/01/2026", "—")]),
]
MODULOS_ORG_SUSP = [
    MODULOS_ORG[0],
    ("Formularios", ("Suspendido", "alerta"), [("Suscripción", ("Suspendida", "alerta"), "05/09/2026", "—"), ("Prueba", ("Terminada", "off"), "01/10/2026", "15/10/2026")]),
    MODULOS_ORG[2],
]
MODULOS_ORG_CERR = [
    ("Asistente", ("Apagado", "off"), [("Manual", ("Apagado", "off"), "12/01/2026", "26/09/2026")]),
    ("Formularios", ("Apagado", "off"), [("Aprobado", ("Terminada", "off"), "20/08/2026", "26/09/2026")]),
    ("WhatsApp", ("Apagado", "off"), [("Suscripción", ("Terminada", "off"), "05/09/2026", "26/09/2026"), ("Manual", ("Apagado", "off"), "12/01/2026", "—")]),
]
COLS_OM = [("Módulo y origen", ""), ("Estado", ""), ("Desde", ""), ("Vence", ""), ("", "")]
PLANT_OM = "minmax(0, 1.6fr) minmax(0, 1.2fr) 130px 130px 28px"
TOPES_ORG = [
    # tope, módulo, máximo de la plataforma, del plan, de esta organización (valor, motivo), vence, rige
    ("Consultas por persona por día", "Asistente", "100", "40", None, "—", "40"),
    ("Días que se guardan los chats", "WhatsApp", "365", "180", None, "—", "180"),
    ("Presupuesto del mes", "Asistente", "US$ 200,00", "US$ 50,00", ("US$ 80,00", "Campaña de fin de año."), VENCE_APROB, "US$ 80,00"),
    ("Tamaño máximo de un archivo", "Formularios", "25 MB", "10 MB", ("25 MB", "Carga planos de obra pesados."), "—", "25 MB"),
]
COLS_TOP = [("Tope", ""), ("Módulo", ""), ("Máximo de la plataforma", "num"), ("Del plan", "num"), ("De esta organización", "num"), ("Vence", ""), ("Rige", "num"), ("", "")]
PLANT_TOP = "minmax(0, 2fr) minmax(0, 0.9fr) 150px 90px 150px 100px 90px 28px"
OPS_TOPE = [(I_LAPIZ, "Cambiar el de esta organización"), "sep", (I_TACHO, "Quitar el de esta organización", "pel")]


def tabla_modulos_org(modulos=MODULOS_ORG, abierto=None, ro=False, tip=None):
    fs = []
    for nombre, est, filas in modulos:
        ops = [(I_PRENDER, "Prender a mano")] if est[0] != "Prendido" else [(I_APAGAR, "Apagar a mano")]
        i = tip if (tip and nombre == "Formularios") else None
        fs.append(([f'<span class="c1">{nombre}</span>', f'<span>{pill(est[0], est[1], i, bool(i))}</span>', "<span></span>", "<span></span>",
                    "<span></span>" if ro else kebab(nombre, ops if abierto == nombre else None)], "mod-grupo"))
        for origen, e, desde, vence in filas:
            fs.append(([c(origen, "t2"), f'<span>{pill(e[0], e[1])}</span>', c(desde), c(vence), "<span></span>"], "mod-sub"))
    return tabla(COLS_OM, PLANT_OM, fs, pie=False, ordenada=-1)


def tabla_topes(abierto=None, ro=False, tip_abierta=True):
    fs = []
    for t in TOPES_ORG:
        org = (f'<span class="num">{t[4][0]}{info("Motivo: " + t[4][1], tip_abierta and t[0] == "Presupuesto del mes", "der")}</span>' if t[4] else num("—"))
        fs.append(([c(t[0]), c(t[1], "t2"), num(t[2]), num(t[3]), org, c(t[5]), num(t[6]),
                    "<span></span>" if ro else kebab(t[0], OPS_TOPE if abierto == t[0] else None)], ""))
    return tabla(COLS_TOP, PLANT_TOP, fs, pie=False)


def banda_org(estado="Activa"):
    """La banda de la ficha de una organización, como en `Organizacion`, con su estado y sus acciones."""
    t = {"Activa": copia("organizacion"), "Suspendida": copia("organizacion_suspendida"), "Cerrada": copia("organizacion_cerrada")}[estado]
    a = t.index('<div class="banda-pag">')
    z = t.index('<div class="pagina">', a)
    return t[a:z]


def pestanas():
    t = copia("organizacion")
    a = t.index('<div class="tabs2"')
    z = t.index("</div>", a) + len("</div>")
    return t[a:z]


def ficha_org(estado="Activa", cuerpo=""):
    return banda_org(estado) + f'<div class="pagina"><div style="display: flex; flex-direction: column;">{pestanas()}<div class="mod-tabpanel" role="tabpanel" aria-label="Módulos">{cuerpo}</div></div></div>'


def dialogo_tope(estado=""):
    err = "Entre 0 y US$ 200,00: el máximo de la plataforma." if estado == "fuera" else None
    cuerpo = (dl([("Tope", "Presupuesto del mes"), ("Módulo", "Asistente"), ("Máximo de la plataforma", "US$ 200,00"), ("Del plan", "US$ 50,00")])
              + con_unidad("De esta organización", "250,00" if err else "80,00", "US$", req=True, prefijo=True, error=err, id_="to-valor")
              + f'<div class="campo2"><label class="et" for="to-vence">Vence{info("Sin fecha, rige hasta que lo quites.")}</label>'
              f'<div class="mod-prebox" style="padding: 0;"><input class="in2" id="to-vence" type="text" value="{VENCE_APROB}"><span class="uni">{I_FECHA}</span></div></div>'
              + campo("Motivo", "Campaña de fin de año.", req=True, area=True, ancho=True))
    return dialogo("El presupuesto del mes de Grupo Delta", cuerpo, b("Cancelar") + b("Guardar", "b-pri"), medio=True)


def plat_org_modulos():
    Z = lambda modulos=MODULOS_ORG, ab=None, abt=None, ro=False, tip=None, tip_top=True: (
        zona("Módulos", tabla_modulos_org(modulos, ab, ro, tip), "", "cuerpo sin") + zona("Topes", tabla_topes(abt, ro, tip_top), "", "cuerpo sin"))
    est = [
        ("Módulos y topes", ficha_org("Activa", Z()), ""),
        ("Acciones de un módulo", ficha_org("Activa", Z(ab="WhatsApp", tip_top=False)), ""),
        ("Acciones de un tope", ficha_org("Activa", Z(abt="Presupuesto del mes", tip_top=False)), ""),
        ("Cambiar el tope de esta organización", ficha_org("Activa", Z(tip_top=False)), dialogo_tope()),
        ("El tope fuera de rango", ficha_org("Activa", Z(tip_top=False)), dialogo_tope("fuera")),
        ("Módulo suspendido", ficha_org("Activa", Z(MODULOS_ORG_SUSP, tip=f"Los datos se guardan hasta el {BORRA}.", tip_top=False)), ""),
        ("Organización suspendida", ficha_org("Suspendida", Z(tip_top=False)), ""),
        ("Organización cerrada", ficha_org("Cerrada", Z(MODULOS_ORG_CERR, ro=True, tip_top=False)), ""),
        ("Solo lectura", ficha_org("Activa", Z(ro=True, tip_top=False)), ""),
        ("Cargando", ficha_org("Activa", zona("Módulos", f'<div class="tarjeta"><div class="mod-carga" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div></div>', "", "cuerpo sin")), ""),
        ("Vacío", ficha_org("Activa", zona("Módulos", tabla(COLS_OM, PLANT_OM, [], vacio="Todavía no hay módulos en el catálogo."), "", "cuerpo sin")), ""),
        ("Error", ficha_org("Activa", zona("Módulos", tabla(COLS_OM, PLANT_OM, [], error="No pudimos cargar los módulos."), "", "cuerpo sin")), ""),
        ("Sin permiso", sin_permiso_compu("Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    quien = [MARTIN] * (n - 1) + [SOFIA]
    rell = {"@MAIN@": [e[1] for e in est], "@VELO@": [e[2] for e in est], "@MENU_MOD@": [menu_mod_plat_cerrado()] * (n - 1) + [""], **personas(quien)}
    return tablero("Organizacion", "Ficha de una organización · Módulos, con sus filas y sus topes", CSS_COMPU, marco_ficha_org(), rell,
                   [e[0] for e in est], 1440, 900)


def m_plat_org_modulos():
    cls = {"ok": "", "pend": "azul", "mal": "mal", "off": "off", "alerta": "amb"}
    def mods(modulos=MODULOS_ORG, ro=False):
        cs = ""
        for nombre, est, filas in modulos:
            pares = [("Estado", est_t(est[0], cls[est[1]]))]
            for origen, e, desde, vence in filas:
                pares.append((origen, est_t(e[0], cls[e[1]]) + (f" · vence {vence}" if False else "")))
            cs += card_t(nombre, pares, keb=not ro)
        return cs
    def tops(ro=False):
        return "".join(card_t(t[0], [("Módulo", t[1]), ("Máximo de la plataforma", t[2]), ("Del plan", t[3]),
                                     ("De esta organización", (t[4][0] + info("Motivo: " + t[4][1])) if t[4] else "—"), ("Vence", t[5]), ("Rige", t[6])], keb=not ro)
                       for t in TOPES_ORG)
    def cuerpo(modulos=MODULOS_ORG, ro=False):
        return (f'<div class="ap-cuerpo"><span class="mod-tsec">Módulos</span><div class="mod-cards" style="padding-top: 0;">{mods(modulos, ro)}</div>'
                f'<span class="mod-tsec">Topes</span><div class="mod-cards" style="padding-top: 0;">{tops(ro)}</div></div>')
    tabs = re.search(r'<div class="ap-tabs.*?</div>', copia("m_organizacion"), re.S).group(0)
    tabs = re.sub(r' <span class="c">\d+</span>', "", tabs)
    bar = lambda sub: barra_t("Grupo Delta", sub, "M-Organizaciones.dc.html", keb_t("Grupo Delta")) + tabs
    tope = hoja_t("El presupuesto del mes de Grupo Delta", kv_t([("Máximo de la plataforma", "US$ 200,00"), ("Del plan", "US$ 50,00")])
                  + cmp_t("De esta organización", "US$ 80,00", req=True) + cmp_t("Vence", VENCE_APROB, info_="Sin fecha, rige hasta que lo quites.")
                  + cmp_t("Motivo", "Campaña de fin de año.", req=True, area=True), cb("Cancelar") + cb("Guardar", "cb-pri"))
    est = [
        ("Módulos y topes", bar("Activa · 3 empresas · 11 miembros"), cuerpo(), ""),
        ("Acciones de un módulo", bar("Activa · 3 empresas · 11 miembros"), cuerpo(), hoja_ops("WhatsApp", [(I_APAGAR, "Apagar a mano")])),
        ("Acciones de un tope", bar("Activa · 3 empresas · 11 miembros"), cuerpo(), hoja_ops("Presupuesto del mes", [o for o in OPS_TOPE if o != "sep"])),
        ("Cambiar el tope de esta organización", bar("Activa · 3 empresas · 11 miembros"), cuerpo(), tope),
        ("Módulo suspendido", bar("Activa · 3 empresas · 11 miembros"), cuerpo(MODULOS_ORG_SUSP), ""),
        ("Organización suspendida", bar("Suspendida · 3 empresas · 11 miembros"), cuerpo(), ""),
        ("Organización cerrada", bar("Cerrada · 3 empresas · 11 miembros"), cuerpo(MODULOS_ORG_CERR, ro=True), ""),
        ("Cargando", bar("Activa · 3 empresas · 11 miembros"), f'<div class="ap-cuerpo">{carga_t()}</div>', ""),
        ("Vacío", bar("Activa · 3 empresas · 11 miembros"), f'<div class="ap-cuerpo">{vacio_t("Todavía no hay módulos en el catálogo.")}</div>', ""),
        ("Error", bar("Activa · 3 empresas · 11 miembros"), f'<div class="ap-cuerpo">{error_t("No pudimos cargar los módulos.")}</div>', ""),
        ("Sin permiso", barra_t("Organizaciones", None, "M-Organizaciones.dc.html"), sin_permiso_t("M-Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    rell = {"@TBAR@": [e[1] for e in est], "@TCUERPO@": [e[2] for e in est], "@THOJA@": [e[3] for e in est]}
    return tablero("M-Organizacion", "Ficha de una organización · Módulos · teléfono", CSS_TEL, marco_tel("m_organizacion"), rell,
                   [e[0] for e in est], 390, 844)


# ================================================================================================================ Config-Plat-Modulos
PLAZOS = [
    ("Días de prueba gratis", "14", "1", "90", "Cuántos días dura la prueba gratis de un módulo. Vale para las pruebas que empiezan después del cambio."),
    ("Días de gracia después de un cobro rechazado", "10", "1", "30", "Cuántos días sigue funcionando un módulo después del primer cobro rechazado, para cambiar la tarjeta."),
    ("Días que se guardan los datos de un módulo apagado", "90", "30", "365", "Mientras se guardan, la organización los exporta y, si lo vuelve a prender, no pierde nada."),
    ("Días de aviso antes de borrar esos datos", "7", "1", "30", "Cuántos días antes de borrar los datos se le avisa a la organización."),
    ("Días de aviso de un precio nuevo", "30", "1", "90", "Un precio nuevo rige como pronto estos días después de cargarlo, y se avisa a las organizaciones con una suscripción viva."),
]
URL_WEBHOOK = "https://api.arquitecturabase.ejemplo.com/webhooks/mercadopago"
CLAVES = [("Clave pública", "APP_USR-•••• 7c2e"), ("Token de acceso", "APP_USR-•••• 4f9a"), ("Secreto del webhook", "•••• 9b1e")]


def zonas_config(estado="Sin cambios", modo_lista=False, sin_conectar=False, ro=False, tips=False):
    filas = ['<div class="f h"><span>Plazo</span><span>Días</span><span class="num">Mínimo</span><span class="num">Máximo</span></div>']
    for k, (nm, v, mn, mx, i) in enumerate(PLAZOS):
        valor = v
        mal = estado == "Un plazo fuera de rango" and k == 1
        if estado in ("Con cambios", "Un plazo fuera de rango", "Guardar: motivo", "Guardar: confirmá que sos vos", "Otra persona cambió la configuración") and k == 1:
            valor = "45" if mal else "15"
        ctrl = (f'<span>{valor}</span>' if ro else f'<input class="in2{" mal" if mal else ""}" type="number" inputmode="numeric" aria-label="{nm}" value="{valor}">')
        filas.append(f'<div class="f"><span>{nm}{info(i, k == 0 and tips)}</span>{ctrl}<span class="num">{mn}</span><span class="num">{mx}</span>'
                     + ('<span class="err" style="grid-column: 2 / -1;">Entre 1 y 30.</span>' if mal else "") + "</div>")
    plazos = zona("Módulos y cobros", f'<div class="mod-plazos" role="group" aria-label="Módulos y cobros">{"".join(filas)}</div>', "", "cuerpo sin")
    if modo_lista:
        modo = elegir("Modo", "Prueba", lista=[("Prueba", True, None), ("Real", False, "Se puede usar cuando la plataforma emita las facturas de ARCA.")])
    else:
        modo = elegir("Modo", "Prueba", info_="En «Prueba», Mercado Pago no cobra de verdad: sirve con sus usuarios de prueba.")
    claves = ""
    for nm, v in CLAVES:
        if sin_conectar:
            val, acc = '<span class="val vacio">Sin cargar</span>', b("Cargar")
        else:
            val, acc = f'<span class="val">{v}</span>', ("" if ro else b("Reemplazar") + b("Quitar"))
        claves += f'<div class="campo2"><span class="et">{nm}</span><div class="mod-clave">{val}{acc}</div></div>'
    url = (f'<div class="campo2 ancho"><span class="et">URL del webhook{info("Pegala en Mercado Pago, en Tus integraciones › Webhooks.")}</span>'
           f'<div class="mod-url"><code>{URL_WEBHOOK}</code>{b(I_COPIAR + " Copiar")}</div></div>')
    mp = f'<section class="mod-zona" aria-label="Mercado Pago"><div class="cab"><h2>Mercado Pago</h2></div><div class="campos">{modo}<span></span>{claves}{url}</div></section>'
    return plazos + mp


def config_plat_modulos():
    def pagina(estado="Sin cambios", acc=None, arriba="", tips=False, **kw):
        if acc is None:
            con = estado != "Sin cambios"
            acc = b("Descartar cambios") + (b("Guardar cambios", "b-pri") if con else b("Guardar cambios", "b-pri", apagado="No hay cambios para guardar.", abierta=tips))
        return banda("Configuración", "", acc, icono_=svgs(copia("config_plat"), '<span class="ico"', "</span>")[0]) + f'<div class="pagina">{arriba}<div class="mod-zonas">{zonas_config(estado, tips=tips, **kw)}</div></div>'
    motivo = dialogo("¿Guardar la configuración?", campo("Motivo", "Más días de gracia para las organizaciones que pagan con débito.", req=True, area=True),
                     b("Cancelar") + b("Guardar", "b-pri"), chico=True, alerta=True,
                     texto="Cambia los plazos de los módulos y los cobros. Lo que ya se le prometió a una organización se cumple.")
    otra = aviso("Otra persona cambió la configuración mientras la editabas. Revisá sus cambios y volvé a guardar.", "mal",
                 b("Ver los cambios"))
    reemplazar = dialogo("Reemplazar el token de acceso", campo("Token de acceso nuevo", "APP_USR-8821••••••••••", req=True, tipo="password")
                         + campo("Motivo", "Se rotó el token en Mercado Pago.", req=True, area=True), b("Cancelar") + b("Reemplazar", "b-pri"), chico=True)
    quitar = dialogo("¿Quitar el token de acceso?", "", b("Cancelar") + b("Quitar", "b-pel"), chico=True, alerta=True,
                     texto="Sin el token, nadie se puede suscribir ni cambiar la tarjeta, y los cobros no se concilian hasta que cargues otro.")
    sin_mp = aviso("Mercado Pago no está conectado: «Suscribirme» no aparece en ninguna organización.", "aten")
    est = [
        ("Sin cambios", pagina(tips=True), ""),
        ("Con cambios", pagina("Con cambios"), ""),
        ("Un plazo fuera de rango", pagina("Un plazo fuera de rango", acc=b("Descartar cambios") + b("Guardar cambios", "b-pri", apagado="Corregí los plazos marcados.")), ""),
        ("Guardar: motivo", pagina("Guardar: motivo"), motivo),
        ("Guardar: confirmá que sos vos", pagina("Guardar: confirmá que sos vos"), reauth("Para guardar la configuración, escribí el código de tu app de autenticación.")),
        ("Otra persona cambió la configuración", pagina("Otra persona cambió la configuración", arriba=f'<div style="margin-bottom: 16px;">{otra}</div>'), ""),
        ("Modo: «Real» apagado", pagina(modo_lista=True), ""),
        ("Reemplazar una clave", pagina(), reemplazar),
        ("Quitar una clave", pagina(), quitar),
        ("Mercado Pago sin conectar", pagina(sin_conectar=True, arriba=f'<div style="margin-bottom: 16px;">{sin_mp}</div>'), ""),
        ("Solo lectura", pagina(acc="", ro=True), ""),
        ("Cargando", banda("Configuración", "", "") + '<div class="pagina"><div class="mod-zonas">'
                     + zona("Módulos y cobros", f'<div class="mod-carga" style="height: 200px;" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div>', "", "cuerpo sin")
                     + zona("Mercado Pago", f'<div class="mod-carga" style="height: 160px;" role="status" aria-label="Cargando">{ARO.replace("mod-aro", "mod-aro grande")}</div>', "", "cuerpo sin") + "</div></div>", ""),
        ("Error", banda("Configuración", "", "") + '<div class="pagina"><div class="tarjeta">'
                  f'<div class="mod-bloque"><strong>No pudimos cargar la configuración.</strong>{b("Reintentar")}</div></div></div>', ""),
        ("Sin permiso", sin_permiso_compu("Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    quien = [MARTIN] * (n - 1) + [SOFIA]
    rell = {"@MAIN@": [e[1] for e in est], "@VELO@": [e[2] for e in est], **personas(quien)}
    return tablero("Config-Plat", "Configuración de la plataforma · Módulos y cobros, y Mercado Pago", CSS_COMPU, marco_config_plat(), rell,
                   [e[0] for e in est], 1440, 900)


def m_config_plat_modulos():
    def cuerpo(estado="Sin cambios", sin_conectar=False, ro=False, tips=False):
        filas = ""
        for k, (nm, v, mn, mx, i) in enumerate(PLAZOS):
            mal = estado == "Un plazo fuera de rango" and k == 1
            valor = ("45" if mal else ("15" if estado != "Sin cambios" and k == 1 else v))
            filas += (f'<div class="mod-plazo-t"><span class="nm">{nm}{info(i, k == 0 and tips)}</span>'
                      f'<div class="ct{" mal" if mal else ""}">{valor}</div><div class="rg"><span class="k">Mínimo</span><span>{mn}</span><span class="k">Máximo</span><span>{mx}</span></div>'
                      + ('<span class="mod-terr" style="grid-column: 1 / -1;">Entre 1 y 30.</span>' if mal else "") + "</div>")
        claves = "".join(cmp_t(nm, "Sin cargar" if sin_conectar else v, vacio=sin_conectar) for nm, v in CLAVES)
        s = (f'<span class="mod-tsec">Módulos y cobros</span><div class="mod-ttarj">{filas}</div>'
             f'<span class="mod-tsec">Mercado Pago</span><div class="mod-ttarj">{cmp_t("Modo", "Prueba", elegir_=not ro)}{claves}'
             f'{cmp_t("URL del webhook", URL_WEBHOOK)}</div>')
        pie = "" if ro else (f'<div class="ap-fijo">{cb("Descartar cambios", "cb-sec full")}'
                             f'{cb("Guardar cambios", "cb-pri full", apagado=("No hay cambios para guardar." if estado == "Sin cambios" else ("Corregí los plazos marcados." if estado == "Un plazo fuera de rango" else None)), abierta=tips or estado == "Un plazo fuera de rango")}</div>')
        return f'<div class="ap-cuerpo" style="padding-bottom: 16px;">{s}</div>{pie}'
    modo = ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Modo"><span class="asa"></span><div class="hc"><h2>Modo</h2>'
            f'<button type="button" class="ap-ib" aria-label="Cerrar">{I_X_T}</button></div><div class="mod-ops">'
            f'<span role="option" class="op" aria-selected="true">Prueba<span style="margin-left: auto; color: var(--marca-tx); display: inline-flex;">{I_TILDE_T}</span></span>'
            f'<span role="option" class="op apag" aria-disabled="true">Real{tip("Se puede usar cuando la plataforma emita las facturas de ARCA.")}</span></div></div>')
    motivo = hoja_t("¿Guardar la configuración?", '<p class="ap-txt-l" style="margin: 0 0 12px;">Cambia los plazos de los módulos y los cobros. Lo que ya se le prometió a una organización se cumple.</p>'
                    + cmp_t("Motivo", "Más días de gracia para las organizaciones que pagan con débito.", req=True, area=True), cb("Cancelar") + cb("Guardar", "cb-pri"), alerta=True)
    est = [
        ("Sin cambios", cuerpo(tips=True), ""),
        ("Con cambios", cuerpo("Con cambios"), ""),
        ("Un plazo fuera de rango", cuerpo("Un plazo fuera de rango"), ""),
        ("Guardar: motivo", cuerpo("Con cambios"), motivo),
        ("Modo: «Real» apagado", cuerpo(), modo),
        ("Una clave", cuerpo(), hoja_ops("Token de acceso", [(I_REEMPLAZAR, "Reemplazar"), (I_TACHO, "Quitar", "pel")])),
        ("Mercado Pago sin conectar", aviso_t("Mercado Pago no está conectado: «Suscribirme» no aparece en ninguna organización.", "aten") + cuerpo(sin_conectar=True), ""),
        ("Solo lectura", cuerpo(ro=True), ""),
        ("Cargando", f'<div class="ap-cuerpo">{carga_t()}</div>', ""),
        ("Error", f'<div class="ap-cuerpo">{error_t("No pudimos cargar la configuración.")}</div>', ""),
        ("Sin permiso", sin_permiso_t("M-Organizaciones.dc.html"), ""),
    ]
    n = len(est)
    rell = {"@TBAR@": [barra_t("Configuración", "Administración", "M-Mas-Plat.dc.html")] * n, "@TCUERPO@": [e[1] for e in est], "@THOJA@": [e[2] for e in est]}
    return tablero("M-Config-Plat", "Configuración de la plataforma · Módulos y cobros, y Mercado Pago · teléfono", CSS_TEL,
                   marco_tel("m_config_plat"), rell, [e[0] for e in est], 390, 844)


# ================================================================================================================ Mensajes-Modulos
# Los ocho avisos de la tabla de la spec: (nombre, canal, asunto, título, texto, datos, botón, nota, plantilla, texto de WhatsApp).
AVISOS = [
    ("Pedido de un módulo: aprobado", "ModuleRequestDecided", "Aprobamos tu pedido de Formularios", "Formularios ya está prendido",
     "Hola, Lucía. Aprobamos el pedido de Formularios para Grupo Delta.",
     [("Módulo", "Formularios"), ("Vence", VENCE_APROB), ("Motivo", "Pidió probarlo con su equipo de ventas antes de suscribirse.")], "Ver Módulos",
     "Te llega porque administrás los módulos de Grupo Delta.", "modulo_pedido_resuelto",
     f"Aprobamos el pedido de *Formularios* para *Grupo Delta*. Vence el {VENCE_APROB}. Motivo: Pidió probarlo con su equipo de ventas antes de suscribirse."),
    ("Pedido de un módulo: rechazado", "ModuleRequestDecided", "No aprobamos tu pedido de Formularios", "No aprobamos tu pedido",
     "Hola, Lucía. No aprobamos el pedido de Formularios para Grupo Delta.",
     [("Módulo", "Formularios"), ("Motivo", MOTIVO_RECHAZO)], "Ver Módulos", "Te llega porque administrás los módulos de Grupo Delta.", "modulo_pedido_resuelto",
     f"No aprobamos el pedido de *Formularios* para *Grupo Delta*. Motivo: {MOTIVO_RECHAZO}"),
    ("La prueba terminó", "ModuleTrialEnded", "Terminó la prueba de Formularios", "Terminó la prueba gratis",
     "Hola, Lucía. Terminó la prueba gratis de Formularios en Grupo Delta y el módulo se apagó. Tus datos se guardan; si te suscribís, siguen ahí.",
     [("Módulo", "Formularios"), ("Terminó", FIN_PRUEBA), ("Tus datos se guardan hasta", "07/03/2027")], "Suscribirme",
     "Te llega porque administrás los módulos de Grupo Delta.", "modulo_prueba_terminada",
     f"Terminó la prueba gratis de *Formularios* en *Grupo Delta* y el módulo se apagó. Tus datos se guardan hasta el 07/03/2027."),
    ("Cobro rechazado", "ModuleChargeRejected", "No pudimos cobrar Formularios", "No pudimos cobrar Formularios",
     "Hola, Lucía. Mercado Pago rechazó el cobro de Formularios de Grupo Delta. El módulo sigue funcionando hasta que se cumpla el plazo.",
     [("Módulo", "Formularios"), ("Monto", "$ 25.000,00"), ("Cambiá la tarjeta antes del", FIN_GRACIA)], "Cambiar tarjeta",
     "Te llega porque administrás los módulos de Grupo Delta.", "modulo_cobro_rechazado",
     f"Mercado Pago rechazó el cobro de *Formularios* de *Grupo Delta* ($ 25.000,00). Cambiá la tarjeta antes del {FIN_GRACIA} para que siga funcionando."),
    ("Módulo suspendido", "ModuleSuspended", "Formularios se suspendió", "Formularios se suspendió",
     "Hola, Lucía. Formularios se suspendió en Grupo Delta porque venció el plazo para cambiar la tarjeta. Tus datos se guardan y los podés exportar.",
     [("Módulo", "Formularios"), ("Se suspendió", FIN_GRACIA), ("Se borran los datos el", BORRA)], "Ver Módulos",
     "Te llega porque administrás los módulos de Grupo Delta.", "modulo_suspendido",
     f"*Formularios* se suspendió en *Grupo Delta*. Tus datos se guardan hasta el {BORRA}: los podés exportar o volver a suscribirte."),
    ("Datos por borrar", "ModuleDataPurgeScheduled", "Los datos de Formularios se borran en 7 días", "Se borran los datos de Formularios",
     "Hola, Lucía. Formularios está apagado en Grupo Delta y sus datos se borran en 7 días. Si los querés, exportalos antes.",
     [("Módulo", "Formularios"), ("Se borran el", BORRA)], "Exportar datos", "Te llega porque administrás los módulos de Grupo Delta.", "modulo_datos_por_borrar",
     f"Los datos de *Formularios* de *Grupo Delta* se borran el {BORRA}. Si los querés, exportalos antes desde Módulos."),
    ("Precio nuevo", "ModulePriceChanging", "Formularios cambia de precio", "Formularios cambia de precio",
     "Hola, Lucía. El precio de Formularios cambia. Desde esa fecha, tu suscripción cobra el precio nuevo en el próximo cobro.",
     [("Módulo", "Formularios"), ("Precio de ahora", "$ 25.000,00 por mes"), ("Precio nuevo", "$ 28.000,00 por mes"), ("Desde", "01/01/2027")], "Ver Módulos",
     "Te llega porque administrás los módulos de Grupo Delta.", "modulo_precio_nuevo",
     "El precio de *Formularios* para *Grupo Delta* pasa a $ 28.000,00 por mes desde el 01/01/2027, en el próximo cobro."),
    ("Baja de una suscripción", "ModuleSubscriptionCanceled", "Diste de baja Formularios", "Diste de baja Formularios",
     "Hola, Lucía. Grupo Delta dio de baja Formularios. No sale otro cobro y el módulo funciona hasta el fin del período pagado, sin reembolso.",
     [("Módulo", "Formularios"), ("Funciona hasta", PROX_COBRO), ("Tus datos se guardan hasta", "05/03/2027")], "Ver Módulos",
     "Te llega porque administrás los módulos de Grupo Delta.", None, None),
    ("Exportación lista", "ModuleExportReady", "Los datos de Formularios están listos", "Tus datos están listos",
     "Hola, Lucía. Preparamos el archivo con los datos de Formularios de Grupo Delta. Se descarga desde Módulos.",
     [("Módulo", "Formularios"), ("Se puede descargar hasta", BORRA)], "Ir a Módulos", "Te llega porque pediste esta exportación.", None, None),
]


def mensajes_modulos():
    t = copia("mensajes")
    wa = copia("mensajes_wa")
    lado_a = t.index('<ul class="msg-lista">')
    lado_z = t.index("</ul>", lado_a) + len("</ul>")
    der_a = t.index('<section class="msg-der">')
    der_z = t.index("</section>", der_a) + len("</section>")
    marco = t[:lado_a] + "@LISTA@" + t[lado_z:der_a] + "@DER@" + t[der_z:]
    estados, listas, ders = [], [], []
    def item(nombre, canales, on):
        return (f'<li><button type="button" class="msg-it {"on" if on else ""}" aria-current="{"true" if on else "false"}">'
                f'<span class="n1">{nombre}</span><span class="n2">{canales}</span></button></li>')
    def lista(on):
        return '<ul class="msg-lista">' + "".join(item(a[0], "Correo · WhatsApp" if a[8] else "Correo", a[0] == on) for a in AVISOS) + "</ul>"
    mail0 = re.search(r'<article class="mail".*?</article>', t, re.S).group(0)
    wa0 = re.search(r'<article class="wa".*?</article>', wa, re.S).group(0)
    for a in AVISOS:
        nombre, _, asunto, titulo, texto, datos, boton, nota, plantilla, wa_texto = a
        dls = '<div class="mod-mail-dl">' + "".join(f'<span class="k">{k}</span><span>{v}</span>' for k, v in datos) + "</div>"
        cont = f'<h2>{titulo}</h2><p>{texto}</p>{dls}<a class="pl-boton" href="#">{boton}</a><p class="pl-nota">{nota}</p>'
        mail = re.sub(r'<h2 class="mail-asunto">.*?</h2>', f'<h2 class="mail-asunto">{asunto}</h2>', mail0, count=1, flags=re.S)
        mail = mail.replace("lucia.fer@gmail.com", "lucia.fernandez@delta.ejemplo.com").replace("27/09/2026, 14:35", "23/11/2026, 09:30")
        mail = re.sub(r'<div class="pl-cont">.*?</div>\s*<div class="pl-pie">', f'<div class="pl-cont">{cont}</div><div class="pl-pie">', mail, count=1, flags=re.S)
        seg = (f'<div class="seg3" role="group" aria-label="Canal"><button type="button" aria-pressed="@C@">Correo</button>'
               f'<button type="button" aria-pressed="@W@"{"" if plantilla else " disabled"}>WhatsApp</button></div>')
        barra = lambda c_, w_: f'<div class="msg-barra"><h1>{nombre}</h1>{seg.replace("@C@", c_).replace("@W@", w_)}</div>'
        estados.append(nombre)
        listas.append(lista(nombre))
        ders.append(f'<section class="msg-der">{barra("true", "false")}<div class="msg-vista">{mail}</div></section>')
        if plantilla:
            w = re.sub(r"<code>.*?</code>", f"<code>{plantilla}</code>", wa0, count=1)
            negrita = re.sub(r"\*([^*]+)\*", r"<b>\1</b>", wa_texto)
            w = re.sub(r'<div class="wa-burbuja">.*?<span class="wa-hora">', lambda m: f'<div class="wa-burbuja">{negrita}<span class="wa-hora">', w, count=1, flags=re.S)
            w = w.replace("14:35", "09:30").replace('<span class="wa-dia">Hoy</span>', '<span class="wa-dia">23/11/2026</span>')
            w = w.replace("</div>\n              \n            </div>", f'</div><div class="wa-boton">{icono("<path d=\'M14 4h6v6\'/><path d=\'M20 4 10 14\'/><path d=\'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5\'/>", 16, "2")}{boton}</div>\n            </div>', 1)
            estados.append(nombre + " · WhatsApp")
            listas.append(lista(nombre))
            ders.append(f'<section class="msg-der">{barra("false", "true")}<div class="msg-vista">{w}</div></section>')
    rell = {"@LISTA@": listas, "@DER@": ders}
    return tablero("Mensajes", "Los avisos de los módulos", CSS_COMPU, marco, rell, estados, 1440, 900)


# ---------------------------------------------------------------------------------------------------------------- canvas.json
TABLEROS = [
    ("MOD-Modulos", mod_modulos), ("MOD-Suscribir", mod_suscribir), ("MOD-Pedir", mod_pedir), ("MOD-Confirmar", mod_confirmar),
    ("MOD-Exportar", mod_exportar),
    ("Plat-MOD-Catalogo", plat_mod_catalogo), ("Plat-MOD-Modulo", plat_mod_modulo), ("Plat-MOD-Precio", plat_mod_precio),
    ("Plat-MOD-Pedidos", plat_mod_pedidos), ("Plat-MOD-Suscripciones", plat_mod_suscripciones), ("Plat-Org-Modulos", plat_org_modulos),
    ("Config-Plat-Modulos", config_plat_modulos), ("Mensajes-Modulos", mensajes_modulos),
]
TELEFONOS = [
    ("M-MOD-Modulos", m_mod_modulos), ("M-MOD-Suscribir", m_mod_suscribir), ("M-MOD-Pedir", m_mod_pedir), ("M-MOD-Confirmar", m_mod_confirmar),
    ("M-MOD-Exportar", m_mod_exportar),
    ("M-Plat-MOD-Catalogo", m_plat_mod_catalogo), ("M-Plat-MOD-Modulo", m_plat_mod_modulo), ("M-Plat-MOD-Precio", m_plat_mod_precio),
    ("M-Plat-MOD-Pedidos", m_plat_mod_pedidos), ("M-Plat-MOD-Suscripciones", m_plat_mod_suscripciones), ("M-Plat-Org-Modulos", m_plat_org_modulos),
    ("M-Config-Plat-Modulos", m_config_plat_modulos),
]
NOTA = ("Módulos y suscripciones (ADR 0069 del back; spec `docs/plans/formularios/modulos-y-suscripciones.md`), aprobada por el usuario "
        "el 2026-11-24. Va después de la E25: "
        "cada tablero muestra solo lo que existe hasta acá (78).\n\n"
        "En la organización, «Módulos» va en Administración, después de Configuración, con `modules.manage` (de entrada, solo el Dueño). "
        "Cada módulo con su descripción, su estado, su precio y el que viene; las acciones van en su ⋮ (261) y el servidor dice cuáles. "
        "El detalle de un estado (hasta cuándo, el motivo de un rechazo) va en la (i) del estado. Suscribirme es una página: el precio, "
        "lo que incluye, la tarjeta de MercadoPago.js y el consentimiento sin tildar.\n\n"
        "Pedir es la única acción del asistente (0068): el diálogo de pedir sobre «Módulos», con «Propuesta del asistente» y el módulo "
        "en la pieza para elegir (262).\n\n"
        "En Plataforma, «Módulos» es una rama de Gestión (Catálogo, Pedidos y Suscripciones). La ficha de una organización redibuja "
        "la pestaña «Módulos»: cada módulo con sus filas por origen y la zona «Topes». Configuración suma «Módulos y cobros» y "
        "«Mercado Pago» después de «Límites de uso». Aprobar un pedido, cambiar lo que se ofrece, un precio nuevo y guardar la "
        "configuración piden «Confirmá que sos vos» (la prueba reciente).\n\n"
        "Los correos van en `Mensajes-Modulos`: seis también por WhatsApp, con su plantilla, y dos solo por correo.\n\n"
        "Es un lienzo aparte porque el principal llegó a los 512 archivos que admite una versión, y el usuario eligió que quede acá. "
        "Su índice, `Indice-modulos`, es el capítulo «Contrata módulos» de la guía; el índice general del principal lleva a este lienzo. "
        "Los enlaces a pantallas que están en el principal (Inicio, Usuarios, Organizaciones) no llevan a ningún lado acá.")


# El lienzo aparte (pedido del usuario del 2026-11-23): el principal llegó a los 512 archivos que admite una versión con la v180,
# así que la etapa va en su propio artefacto Design, con su índice; aprobada, se queda ahí (2026-11-24). Arriba a la izquierda va
# `Indice-modulos`, que escribe `indices_1004.py`; esta corrida lo conserva.
INDICE = PROJ / "canvas-modulos.json"
TITULO = "Módulos y suscripciones"
CREADO = "2026-11-23T21:30:00Z"


def registrar():
    principal = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    titulos = {}
    for nombre, _ in TABLEROS + TELEFONOS:
        t = (PROJ / f"{nombre}.dc.html").read_text(encoding="utf-8")
        titulos[nombre] = re.search(r"<title>(.*?)</title>", t).group(1)
    antes = json.loads(INDICE.read_text(encoding="utf-8")) if INDICE.exists() else {"boards": {}}
    indices = {k: v for k, v in antes["boards"].items() if k.startswith("Indice-")}
    c_ = {"v": 3, "createdOnFiles": {"v": 1, "at": CREADO}, "title": TITULO, "launch": {"view": "canvas", "page": PAGINA["id"]},
          "pages": [dict(PAGINA)], "boards": dict(indices), "order": [], "notes": {}, "designSystems": principal["designSystems"]}
    # Dos filas: la organización y Plataforma, cada pantalla con su teléfono abajo.
    org = [n for n, _ in TABLEROS if n.startswith("MOD-")]
    plat = [n for n, _ in TABLEROS if not n.startswith("MOD-")]
    x0, paso = 2260, 1540  # a la izquierda, el índice (1440) y la nota (620)
    for fila, nombres in enumerate((org, plat)):
        y = fila * 2100
        for k, nombre in enumerate(nombres):
            c_["boards"][f"{nombre}.dc.html"] = {"h": 900, "is_interactive": True, "page": PAGINA["id"], "title": titulos[nombre], "w": 1440,
                                                 "x": x0 + k * paso, "y": y}
            tel = f"M-{nombre}"
            if tel in titulos:
                c_["boards"][f"{tel}.dc.html"] = {"h": 844, "is_interactive": True, "page": PAGINA["id"], "title": titulos[tel], "w": 390,
                                                  "x": x0 + k * paso, "y": y + 1000}
    c_["notes"]["propuesta-modulos"] = {"color": "blue", "page": PAGINA["id"], "text": NOTA, "w": 620, "x": 1540, "y": 0}
    c_["order"] = list(indices) + [f"{n}.dc.html" for n, _ in TABLEROS + TELEFONOS]
    INDICE.write_text(json.dumps(c_, ensure_ascii=False, indent=2), encoding="utf-8")


SPARK = ""


def main():
    global SPARK
    inicio = (PROJ / "generadores" / "acciones_asistente_1004" / "inicio.html").read_text(encoding="utf-8")
    av = re.search(r'<span class="as-av">.*?</span>', inicio, re.S).group(0)
    SPARK = re.search(r"<svg.*?</svg>", av, re.S).group(0)
    solo = sys.argv[sys.argv.index("--solo") + 1].split(",") if "--solo" in sys.argv else None
    for nombre, hacer in TABLEROS + TELEFONOS:
        if solo and nombre not in solo:
            continue
        t = hacer()
        (PROJ / f"{nombre}.dc.html").write_text(t, encoding="utf-8")
        print("ok", nombre, len(t))
    registrar()


if __name__ == "__main__":
    main()
