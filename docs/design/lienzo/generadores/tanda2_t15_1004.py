"""Los tableros de la E12 a la E17 con las decisiones 224, 225, 226 y 228 de la hoja de ruta del back (§5), que el usuario tomó el
2026-11-18 (tanda 2 del traspaso 15):

- **«Ordenar por…»** (224, OR1-A de ArquitecturaBase): en el ⋮ de «Opciones», «Ordenar por…» reemplaza «Ordenar de la A a la Z», con
  un ícono de ↑↓ y no el de «A Z», en todos los tableros vivos de catálogos (E12, E13, E14 y E16; el Archivo no se toca). Habilitado,
  lleva al diálogo (`FRM-Catalogo-Ordenar` en la E12, `FRM-Catalogo-Ordenar-13` desde la E13); apagado, da su motivo: «Guardá el
  catálogo antes.» en un catálogo sin guardar y «Primero descartá los cambios de posición.» con movimientos pendientes. El orden
  pendiente de `FRM-Catalogo` dice «Se ordenará por «Texto», de la A a la Z, al guardar.» con «Cancelar orden», arriba de las
  opciones, y ↑ ↓ y borrar quedan apagados con su motivo (211).
  - `FRM-Catalogo-Ordenar` y `M-FRM-Catalogo-Ordenar` (nuevos, E12): el diálogo «Ordenar las opciones», con «Columna» (Texto o
    Código) en un selector y «Orden» en dos radios que dicen el sentido con palabras, con su (i); el orden pendiente por «Código», el
    diálogo que vuelve a abrir con él, lo guardado ya ordenado (también la dada de baja) y los dos apagados.
  - `FRM-Catalogo-Ordenar-13` y `M-FRM-Catalogo-Ordenar-13` (nuevos, E13): «Proveedores» con seis campos guardados (CUIT, Zona, Rubro, Plazo de pago, Alta y Retiene
    IVA); el selector abierto con cada campo, el sentido de cada tipo («De la A a la Z», «De menor a mayor», «De la más antigua a la
    más reciente», «Primero «No»», y un campo de otro catálogo por el texto de su opción) y el orden pendiente por «Rubro».
- **Descartar una publicación trabada** (225): con «Sin confirmar · versión 4», la banda de `FRM-Publicando` suma «Descartar esta
  publicación», después de «Consultar publicación»; pide confirmar con «¿Descartar la publicación de la versión 4?», con el foco en
  «Cancelar» (161) y sin ✕ (no se deshace), y deja «Publicado · versión 3» con «Publicar en WhatsApp». El «Descartar» de la banda sigue
  siendo el de los cambios del borrador; para que no haya dos «Descartar» juntos (y la banda entre sin bajar de renglón), sin cambios
  sin guardar «Descartar esta publicación» va en lugar del «Descartar» apagado, y con cambios sin guardar vuelve «Descartar» y la de la
  publicación no va a la vista (primero se guarda o se descarta). En el teléfono (`M-FRM-Editor`), una fila más en el pie, donde
  «Descartar» ya va solo con cambios. En la E17 (`FRM-Editor-Baja`, `M-FRM-Editor-Baja`), al reactivar con «Sin confirmar ·
  versión 3», y el descarte también retira sus Flows de WhatsApp: el formulario sigue de baja.
- **Exportar dice qué exporta** (226, EX1-A): `FRM-Respuestas-Exportar` lleva arriba «Respuestas» y «Filtros» en un `DetailGrid`
  (`g-det`), con los chips de la planilla sin la ✕ («Ninguno» sin filtros); «Columnas» es el título del grupo con su (i), sin «(13
  columnas)»; sin columnas ocultas, «Solo las visibles» queda apagada con «Se ven todas las columnas.»; al pie, «Archivo». Con la lista
  de chequeo (213): el tope de 10.000 es el motivo del botón apagado y no un cartel, y lo que falló al exportar va en el aviso de abajo
  (210). En el teléfono, la hoja de `M-FRM-Respuestas`, `M-FRM-Respuestas-16` y `M-FRM-Respuestas-18`, en una lista de datos que termina
  en «Archivo». La 18 (`FRM-Respuestas-18`) conserva su (i) de las fotos y los documentos, y la 21 (`FRM-Respuesta-Anular`) suma
  «Incluir las anuladas» debajo de las columnas, con su (i) («Suma la columna «Anulada».»): marcada, «Respuestas» dice «24 y las
  anuladas». Los de la E19 a la E21 con «Filas» o «Por resolver» son de su tanda.
- **`Criterio-Decisiones`**: el ⋮ de «Opciones» con «Ordenar por…», y «Por aprobar (N) | Todas» suma «Por resolver (N)» (228).

Corre después de los de la v175 (`avisos_iconos_1004.py` el último) y antes de la pasada de las piezas; al terminar imprime los
tableros para `python traspaso10_piezas_1004.py --tableros …`. Usa las piezas que los tableros ya tienen (`f-menu`, `f-mi`, `e-tip`,
`w-dlg`, `g-det`, `ex-rd`, `pl-chip`, `ap-hoja`, `f-toast`, `f-snack`); lo nuevo va en un bloque `<style data-t15t2="…">` por tablero,
con los px de antes de la escala, que pone la pasada. No toca `canvas.json`: los tableros nuevos se suman a mano. Lee y escribe sin
cambiar los finales de línea, y se puede volver a correr sin cambiar nada: lo hecho no vuelve a encontrar lo que busca, un estado
sumado no se suma otra vez y un tablero nuevo que ya existe no se rehace (para rehacerlo, se borra y se corre de nuevo).
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import formularios_t15_1004 as F  # noqa: E402  (sus piezas: leer, escribir, cambiar, cierre, svg, sumar_estado)

sys.stdout.reconfigure(encoding="utf-8")
PROJ = F.PROJ
leer, escribir, cambiar, cierre, svg, sumar_estado, hijos = F.leer, F.escribir, F.cambiar, F.cierre, F.svg, F.sumar_estado, F.hijos


def nl(t):
    return "\r\n" if "\r\n" in t else "\n"


# ---------------------------------------------------------------------------------------------------------------- los estados
def lista_k(t):
    return json.loads(re.search(r"const k = (\[.*?\])\.indexOf\(e\);", t).group(1))


def idx(t, nombre):
    return lista_k(t).index(nombre)


def bloques(t, k):
    """Los bloques de primer nivel del estado `k`: (inicio, fin)."""
    apertura = re.compile(r'<sc-if value="\{\{s' + str(k) + r'\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">')
    return [(m.start(), cierre(t, m.start(), "sc-if")) for m in apertura.finditer(t)]


def adentro(bloque):
    """Lo de adentro de un `<sc-if>`."""
    return bloque[bloque.index(">") + 1:-len("</sc-if>")]


def en_estado(t, k, cambio):
    """`cambio(numero, bloque)` sobre cada bloque del estado `k`."""
    partes, i = [], 0
    for numero, (a, b) in enumerate(bloques(t, k)):
        partes += [t[i:a], cambio(numero, t[a:b])]
        i = b
    partes.append(t[i:])
    return "".join(partes)


def sumar_capa(t, k, html, marca):
    """Un bloque más del estado `k` (un diálogo o un aviso que se abre encima), después del último suyo, si ningún bloque del estado
    tiene todavía `marca` (la pasada de las piezas puede retocar lo ya puesto, así que no se compara el html entero)."""
    if any(marca in t[a:b] for a, b in bloques(t, k)):
        return t
    b = bloques(t, k)[-1][1]
    return t[:b] + f'<sc-if value="{{{{s{k}}}}}" hint-placeholder-val="{{{{no}}}}">{html}</sc-if>' + t[b:]


def con_css(t, clave, css):
    """El bloque `<style data-t15t2="clave">` antes de `</helmet>`, si todavía no está."""
    if f'<style data-t15t2="{clave}">' in t:
        return t
    n = nl(t)
    bloque = f'<style data-t15t2="{clave}">{n}' + css.strip("\n").replace("\n", n) + f"{n}</style>{n}"
    return t.replace("</helmet>", bloque + "</helmet>", 1)


def solo(patron, t, veces=1):
    """La única (o las `veces`) coincidencias de `patron`."""
    ms = list(re.finditer(patron, t, re.S))
    assert len(ms) == veces, (patron[:120], len(ms), veces)
    return ms


# ---------------------------------------------------------------------------------------------------------------- las piezas
X16 = ('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
       'stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>')
X22 = X16.replace('width="16" height="16"', 'width="22" height="22"')
FLECHA = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
          'stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>')
TILDE = ('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>')
INFO = F.I_INFO
AZ = svg('<path d="M4 17 7 7l3 10"/><path d="M5 14h4"/><path d="M14 7h5l-5 10h5"/>')
ORDENAR = svg('<path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/>')

# Los textos de «Ordenar las opciones», como los de ArquitecturaBase (`forms.json`, `catalogs.sort`).
SENTIDOS = {
    "texto": ("De la A a la Z", "De la Z a la A"),
    "numero": ("De menor a mayor", "De mayor a menor"),
    "fecha": ("De la más antigua a la más reciente", "De la más reciente a la más antigua"),
    "sino": ("Primero «No»", "Primero «Sí»"),
}
AYUDA_ORDEN = "Las opciones con el mismo valor quedan en el orden de ahora, y las que no tienen valor van al final."
SIN_GUARDAR = "Guardá el catálogo antes."
CON_MOVIMIENTOS = "Primero descartá los cambios de posición."
MOVER = "Guardá o descartá el orden pendiente para mover opciones."
BORRAR = "Guardá o descartá el orden pendiente para borrar opciones."


def pendiente(columna, sentido):
    return f"Se ordenará por «{columna}», {sentido[0].lower() + sentido[1:]}, al guardar."


def aviso_orden(columna, sentido):
    return (f'<div class="w-caja k-aviso-f" role="status"><span>{pendiente(columna, sentido)}</span>'
            '<button type="button" class="cb cb-sec">Cancelar orden</button></div>')


def radios(tipo, desc, clase="t2-rd"):
    a, d = SENTIDOS[tipo]
    return "".join(f'<span class="{clase}{" on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><span class="rd"></span>{x}</span>'
                   for x, on in ((a, not desc), (d, desc)))


def dialogo_ordenar(columna, tipo, desc, columnas=None):
    """«Ordenar las opciones» en la compu; con `columnas`, el selector abierto con ellas."""
    abierta = columnas is not None
    lista = ""
    if abierta:
        lista = ('<div class="t2-lista" role="listbox" aria-label="Columna">'
                 + "".join(f'<span class="t2-op{" on" if c == columna else ""}" role="option" aria-selected="{"true" if c == columna else "false"}">'
                           f'<span>{c}</span>{TILDE if c == columna else ""}</span>' for c in columnas) + "</div>")
    return ('<div class="w-oscuro"><div class="w-dlg t2-ord" role="dialog" aria-modal="true" aria-label="Ordenar las opciones" data-t15t2="ordenar">'
            f'<div class="dc"><span>Ordenar las opciones</span><button type="button" class="ib" aria-label="Cerrar">{X16}</button></div>'
            '<div class="db una"><div class="t2-campo"><span class="t2-rt">Columna</span><span class="t2-env">'
            f'<span class="t2-sel{" t2-abierto" if abierta else ""}" role="combobox" aria-label="Columna" aria-expanded="{"true" if abierta else "false"}">'
            f'<span>{columna}</span>{FLECHA}</span>{lista}</span></div>'
            f'<div class="t2-campo" role="radiogroup" aria-label="Orden"><span class="t2-rt">Orden<span class="f-i" tabindex="0" role="img" '
            f'aria-label="{AYUDA_ORDEN}" title="{AYUDA_ORDEN}">{INFO}</span></span><span class="t2-rds">{radios(tipo, desc)}</span></div></div>'
            '<div class="df"><button type="button" class="cb cb-sec">Cancelar</button><button type="button" class="cb cb-pri">Ordenar</button></div>'
            "</div></div>")


def hoja_ordenar(columna, tipo, desc):
    """«Ordenar las opciones» en el teléfono: una hoja desde abajo, con lo principal primero, como las demás hojas."""
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Ordenar las opciones" data-t15t2="ordenar"><span class="asa"></span>'
            f'<div class="hc"><div><h2>Ordenar las opciones</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{X22}</button></div>'
            '<div class="hb"><div class="t2-hcampo"><span class="t2-hrt">Columna</span>'
            f'<span class="t2-hsel" role="combobox" aria-label="Columna" aria-expanded="false"><span>{columna}</span>{FLECHA}</span></div>'
            f'<div class="t2-hcampo" role="radiogroup" aria-label="Orden"><span class="t2-hrt">Orden<span class="f-i" tabindex="0" role="img" '
            f'aria-label="{AYUDA_ORDEN}" title="{AYUDA_ORDEN}">{INFO}</span></span><div class="t2-hrds">{radios(tipo, desc, "t2-hrd")}</div></div></div>'
            '<div class="hp"><button type="button" class="cb cb-pri">Ordenar</button><button type="button" class="cb cb-sec">Cancelar</button></div></div>')


CSS_ORDENAR = """
/* 224 · «Ordenar las opciones»: la columna en un selector y el sentido en dos radios con palabras (tanda2_t15_1004.py). */
.w-dlg.t2-ord { width: 440px; overflow: visible; }
.t2-campo { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.t2-rt { display: flex; align-items: center; font-size: 12.5px; font-weight: 600; color: var(--t2); }
.t2-env { position: relative; display: block; }
.t2-sel { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 36px; box-sizing: border-box; padding: 0 12px; border: 1px solid var(--borde2); border-radius: 8px; background: #fff; font-size: 14px; color: var(--t1); cursor: pointer; }
.t2-sel.t2-abierto { border-color: var(--marca); box-shadow: 0 0 0 3px var(--marca-t); }
.t2-sel svg { color: var(--t3); flex: none; }
.t2-lista { position: absolute; z-index: 30; left: 0; right: 0; top: calc(100% + 4px); padding: 6px; background: #fff; border: 1px solid var(--borde); border-radius: 10px; box-shadow: 0 12px 28px oklch(0.24 0.014 78 / 0.14); display: flex; flex-direction: column; }
.t2-op { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-radius: 6px; font-size: 13.5px; color: var(--t1); }
.t2-op + .t2-op { border-top: 1px solid var(--borde); }
.t2-op.on { font-weight: 600; background: var(--s2); }
.t2-op.on svg { color: var(--marca); flex: none; }
.t2-rds { display: flex; flex-direction: column; gap: 10px; }
.t2-rd { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--t1); }
.t2-rd .rd { width: 16px; height: 16px; flex: none; box-sizing: border-box; border-radius: 50%; border: 1.5px solid var(--borde2); background: #fff; }
.t2-rd.on .rd { border: 5px solid var(--marca); }
"""
CSS_ORDENAR_TEL = """
/* 224 · «Ordenar las opciones» en una hoja y el orden pendiente arriba de las opciones (tanda2_t15_1004.py). */
.t2-hcampo { display: flex; flex-direction: column; gap: 6px; }
.t2-hrt { display: flex; align-items: center; gap: 4px; font-size: 13.5px; font-weight: 600; color: var(--t2); }
.t2-hsel { min-height: 48px; box-sizing: border-box; border: 1px solid var(--borde2); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 14px; font-size: 16px; background: #fff; color: var(--t1); }
.t2-hsel svg { color: var(--t3); flex: none; }
.t2-hrds { display: flex; flex-direction: column; border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
.t2-hrd { display: flex; align-items: center; gap: 12px; min-height: 50px; padding: 0 14px; font-size: 16px; color: var(--t1); border-top: 1px solid var(--borde); }
.t2-hrd:first-child { border-top: 0; }
.t2-hrd .rd { width: 22px; height: 22px; flex: none; box-sizing: border-box; border-radius: 50%; border: 1.5px solid var(--borde2); background: #fff; }
.t2-hrd.on .rd { border: 7px solid var(--marca); }
.t2-aviso { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 16px 16px 0; padding: 10px 10px 10px 14px; border: 1px solid var(--borde2); border-radius: 12px; background: #fff; font-size: 14.5px; line-height: 1.4; color: var(--t1); }
.t2-aviso .cb { flex: none; height: 40px; border-radius: 10px; font-size: 14.5px; padding: 0 14px; }
.ap-acciones2 span.t2-off { color: var(--t3); }
.t2-tip { display: block; width: fit-content; margin-top: 8px; padding: 6px 10px; border-radius: 6px; background: oklch(0.27 0.012 78); color: #fff; font-size: 12.5px; font-style: normal; font-weight: 500; line-height: 1.35; }
"""


# ---------------------------------------------------------------------------------------------------------------- 1 · el ⋮ de «Opciones»
ITEM = re.compile(r'<span class="f-mi( off)?" role="menuitem"( aria-disabled="true" title="[^"]*")?>' + re.escape(AZ) + r" Ordenar de la A a la Z</span>")


def item_ordenar(destino, motivo=None, tip=False):
    if motivo:
        globo = f'<span class="e-tip" role="tooltip">{motivo}</span>' if tip else ""
        return f'<span class="f-mi off" role="menuitem" aria-disabled="true" title="{motivo}">{ORDENAR} Ordenar por…{globo}</span>'
    return f'<a class="f-mi" role="menuitem" href="{destino}" style="text-decoration: none;">{ORDENAR} Ordenar por…</a>'


def menu_ordenar(t, nombre, destino):
    def uno(m):
        if m.group(1):
            motivo = re.search(r'title="([^"]*)"', m.group(2)).group(1)
            return item_ordenar(destino, motivo)
        return item_ordenar(destino)
    t = ITEM.sub(uno, t)
    assert "Ordenar de la A a la Z" not in t, (nombre, "queda «Ordenar de la A a la Z»")
    assert "Ordenar por…" in t, nombre
    return t


E12 = {"FRM-Catalogo": "FRM-Catalogo-Ordenar", "FRM-Catalogo-Tipo": "FRM-Catalogo-Ordenar", "FRM-Catalogo-Importar": "FRM-Catalogo-Ordenar",
       "FRM-Catalogo-Opciones": "FRM-Catalogo-Ordenar"}
E13 = {n: "FRM-Catalogo-Ordenar-13" for n in ("FRM-Catalogo-13", "FRM-Catalogo-Campos", "FRM-Catalogo-Opciones-13", "FRM-Catalogo-14",
                                              "FRM-Catalogo-16")}


def item_activo(destino):
    return item_ordenar(f"{destino}.dc.html")


def catalogo(t):
    """`FRM-Catalogo`: el apagado con movimientos pendientes y el orden pendiente con sus palabras, «Cancelar orden» y el motivo de ↑ ↓."""
    activo = item_activo("FRM-Catalogo-Ordenar")
    t = en_estado(t, idx(t, "Movimientos pendientes"), lambda n, b: b.replace(activo, item_ordenar("", CON_MOVIMIENTOS)))
    assert item_ordenar("", CON_MOVIMIENTOS) in "".join(t[a:b] for a, b in bloques(t, idx(t, "Movimientos pendientes")))

    def orden(n, b):
        b = b.replace("<span>Se ordena de la A a la Z al guardar.</span><button type=\"button\" class=\"cb cb-sec\">Cancelar el orden</button>",
                      f'<span>{pendiente("Texto", SENTIDOS["texto"][0])}</span><button type="button" class="cb cb-sec">Cancelar orden</button>')
        return re.sub(r'(aria-label="(?:Subir|Bajar) [^"]*" aria-disabled="true")(?! title)', rf'\1 title="{MOVER}"', b)
    t = en_estado(t, idx(t, "Orden pendiente"), orden)
    cuerpo = t.__getitem__(slice(*bloques(t, idx(t, "Orden pendiente"))[1]))
    assert pendiente("Texto", SENTIDOS["texto"][0]) in cuerpo and "Cancelar el orden" not in t, "el orden pendiente"
    assert cuerpo.count(f'title="{MOVER}"') == 8, cuerpo.count(f'title="{MOVER}"')
    return t


def catalogo_tel(t):
    return cambiar(t, '<span role="menuitem">Ordenar de la A a la Z</span>', '<span role="menuitem">Ordenar por…</span>', 1)


# ---------------------------------------------------------------------------------------------------------------- 2 · tableros nuevos
def logica(t, estados, extra, defecto=None):
    """El Tweak y la lógica de un tablero nuevo: los estados, `sN` y lo fijo de `extra`."""
    n = nl(t)
    defecto = defecto or estados[0]
    m = re.search(r'"estado":\{"editor":"enum","options":\[[^\]]*\],"default":"[^"]*"', t)
    t = t[:m.start()] + '"estado":{"editor":"enum","options":' + json.dumps(estados, ensure_ascii=False, separators=(",", ":")) + ',"default":' + json.dumps(defecto, ensure_ascii=False) + t[m.end():]
    a = t.index("class Component extends DCLogic {")
    b = t.index("</script>", a)
    lineas = ["class Component extends DCLogic {", "  renderVals() {", f"    const e = this.props.estado ?? {json.dumps(defecto, ensure_ascii=False)};",
              f"    const k = {json.dumps(estados, ensure_ascii=False)}.indexOf(e);", "    return {", "      si: true, no: false,"]
    lineas += [f"      s{i}: k === {i}," for i in range(len(estados))]
    if extra:
        lineas.append("      " + extra)
    lineas += ["    };", "  }", "}", ""]
    return t[:a] + n.join(lineas) + t[b:]


def nuevo_tablero(base, titulo, estados, extra="", css=None, clave="ordenar"):
    """Un tablero con el marco de `base` y `estados`: [(nombre, [pantallas], [capas])], cada una el html de adentro de su `<sc-if>`.
    Las pantallas van donde estaban las de `base`; las capas, después (en el teléfono, después de `ap-raya`)."""
    t = leer(base)
    partes, i, primero = [], 0, None
    for m in re.finditer(r'<sc-if value="\{\{s\d+\}\}" hint-placeholder-val="\{\{(?:si|no)\}\}">', t):
        if m.start() < i:
            continue
        primero = len("".join(partes)) + (m.start() - i) if primero is None else primero
        partes.append(t[i:m.start()])
        i = cierre(t, m.start(), "sc-if")
    partes.append(t[i:])
    t = "".join(partes)

    def envolver(k, html):
        return f'<sc-if value="{{{{s{k}}}}}" hint-placeholder-val="{{{{{"si" if k == 0 else "no"}}}}}">{html}</sc-if>'
    pantallas = "".join(envolver(k, h) for k, (_, ps, _) in enumerate(estados) for h in ps)
    capas = "".join(envolver(k, h) for k, (_, _, cs) in enumerate(estados) for h in cs)
    raya = '<span class="ap-raya"></span>'
    if raya in t:
        r = t.index(raya, primero) + len(raya)
        t = t[:primero] + pantallas + t[primero:r] + capas + t[r:]
    else:
        t = t[:primero] + pantallas + capas + t[primero:]
    t = re.sub(r"<title>[^<]*</title>", f"<title>{titulo}</title>", t, count=1)
    t = logica(t, [e[0] for e in estados], extra)
    if css:
        t = con_css(t, clave, css)
    # Todo lo que la página pide a la lógica tiene que estar.
    variables = set(re.findall(r"\{\{(\w+)\}\}", t))
    script = t[t.index("class Component extends DCLogic {"):]
    faltan = [v for v in variables if not re.search(rf"\b{v}:", script)]
    assert not faltan, (titulo, faltan)
    return t


def de(t, nombre):
    """Lo de adentro de cada bloque del estado `nombre`, en orden."""
    return [adentro(t[a:b]) for a, b in bloques(t, idx(t, nombre))]


def abrir_menu(cuerpo, item_viejo=None, item_nuevo=None):
    """El ⋮ de «Opciones» abierto en una pantalla dibujada (y, si se pide, un ítem cambiado)."""
    cuerpo = cambiar(cuerpo, '<sc-if value="{{menuMas}}" hint-placeholder-val="{{no}}">', '<sc-if value="{{si}}" hint-placeholder-val="{{si}}">', 1)
    cuerpo = cambiar(cuerpo, 'aria-label="Más acciones de las opciones" aria-haspopup="menu" aria-expanded="{{expMas}}"',
                     'aria-label="Más acciones de las opciones" aria-haspopup="menu" aria-expanded="true"', 1)
    if item_viejo:
        cuerpo = cambiar(cuerpo, item_viejo, item_nuevo, 1)
    return cuerpo


FLECHAS = re.compile(r'(aria-label="(Subir|Bajar) [^"]*")(?: aria-disabled="(?:true|false)")?')


def filas_en_orden(cuerpo, clase_fila, orden, numero):
    """Las filas de la tabla en el orden `orden` (índices de las de ahora), con su número de nuevo y ↑ apagada en la primera y ↓ en la
    última. `numero(fila, n)` pone el número."""
    a = cuerpo.index(f'<div class="{clase_fila}')
    filas, i = [], a
    while cuerpo.startswith(f'<div class="{clase_fila}', i):
        b = cierre(cuerpo, i, "div")
        filas.append(cuerpo[i:b])
        i = b
    assert len(filas) == len(orden), (len(filas), orden)
    nuevas = []
    for n, k in enumerate(orden):
        fila = numero(filas[k], n + 1)
        ultima = n == len(orden) - 1
        fila = FLECHAS.sub(lambda m: f'{m.group(1)} aria-disabled="{"true" if (m.group(2) == "Subir" and n == 0) or (m.group(2) == "Bajar" and ultima) else "false"}"', fila)
        nuevas.append(fila)
    return cuerpo[:a] + "".join(nuevas) + cuerpo[i:]


def ordenar_e12():
    base = leer("FRM-Catalogo")
    banda0, cuerpo0 = de(base, "Sin cambios")
    banda9, cuerpo9 = de(base, "Orden pendiente")
    banda15, cuerpo15, toast15 = de(base, "Guardado")
    banda23, cuerpo23 = de(base, "Nuevo catálogo")
    banda8, cuerpo8 = de(base, "Movimientos pendientes")[:2]
    texto_az = pendiente("Texto", SENTIDOS["texto"][0])
    codigo_za = pendiente("Código", SENTIDOS["texto"][1])
    cuerpo_codigo = cambiar(cuerpo9, texto_az, codigo_za, 1)
    # Lo guardado, ordenado por «Código», de la Z a la A: VEN, SEG, REC y COB (la dada de baja también se ordena).
    guardado = filas_en_orden(cuerpo0, "w-tr ke", [1, 0, 2, 3],
                              lambda f, n: re.sub(r'<span class="gris fx fx-b">\d+</span>', f'<span class="gris fx fx-b">{n}</span>', f, count=1))
    sin_guardar = abrir_menu(cuerpo23, item_ordenar("", SIN_GUARDAR), item_ordenar("", SIN_GUARDAR, tip=True))
    con_mov = abrir_menu(cuerpo8, item_ordenar("", CON_MOVIMIENTOS), item_ordenar("", CON_MOVIMIENTOS, tip=True))
    estados = [
        ("Ordenar las opciones", [banda0, cuerpo0], [dialogo_ordenar("Texto", "texto", False)]),
        ("Elegir la columna", [banda0, cuerpo0], [dialogo_ordenar("Texto", "texto", False, ["Texto", "Código"])]),
        ("Por código, de la Z a la A", [banda0, cuerpo0], [dialogo_ordenar("Código", "texto", True)]),
        ("Orden pendiente", [banda9, cuerpo_codigo], []),
        ("Cambiar el orden pendiente", [banda9, cuerpo_codigo], [dialogo_ordenar("Código", "texto", True)]),
        ("Guardado: ordenadas", [banda15, guardado], [toast15]),
        ("Sin guardar: apagado", [banda23, sin_guardar], []),
        ("Con movimientos: apagado", [banda8, con_mov], []),
    ]
    extra = ("menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', "
             "busqueda: 'Buscar opción', busClase: '',")
    return nuevo_tablero("FRM-Catalogo", "Ordenar las opciones · /org/formularios/catalogos/:id", estados, extra, CSS_ORDENAR)


def ordenar_e12_tel():
    base = leer("M-FRM-Catalogo")
    pantalla0 = de(base, "Sin cambios")[0]
    hoja_mas = de(base, "Más acciones")[-1]
    fijo = ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button>'
            '<button type="button" class="cb cb-pri full">Guardar cambios</button></div>')
    opciones = '<div class="ap-gtit">Opciones<a href="#">Agregar opción</a></div>'
    aviso = (f'<div class="t2-aviso" role="status"><span>{pendiente("Código", SENTIDOS["texto"][1])}</span>'
             '<button type="button" class="cb cb-sec">Cancelar orden</button></div>')
    pendiente_tel = cambiar(pantalla0, opciones, aviso + opciones, 1)
    pendiente_tel = FLECHAS.sub(lambda m: f'{m.group(1)} aria-disabled="true" title="{MOVER}"', pendiente_tel)
    pendiente_tel = re.sub(r'(aria-label="Borrar [^"]*")>', rf'\1 aria-disabled="true" title="{BORRAR}">', pendiente_tel)
    pendiente_tel = pendiente_tel + fijo
    # Con movimientos: «Venta nueva» subió un lugar y todavía no se guardó.
    movida = filas_en_orden(pantalla0, "q-row", [1, 0, 2, 3],
                            lambda f, n: re.sub(r'<span class="num">\d+</span>', f'<span class="num">{n}</span>', f, count=1)) + fijo
    hoja_apagada = cambiar(hoja_mas, '<span role="menuitem">Ordenar por…</span>',
                           f'<span role="menuitem" class="t2-off" aria-disabled="true" title="{CON_MOVIMIENTOS}">Ordenar por…'
                           f'<em class="t2-tip" role="tooltip">{CON_MOVIMIENTOS}</em></span>', 1)
    estados = [
        ("Ordenar las opciones", [pantalla0], [hoja_ordenar("Texto", "texto", False)]),
        ("Por código, de la Z a la A", [pantalla0], [hoja_ordenar("Código", "texto", True)]),
        ("Orden pendiente", [pendiente_tel], []),
        ("Con movimientos: apagado", [movida], [hoja_apagada]),
    ]
    return nuevo_tablero("M-FRM-Catalogo", "Ordenar las opciones · teléfono", estados, css=CSS_ORDENAR_TEL)


# La E13: «Proveedores» con seis campos guardados. CUIT y Zona son los de las demás pantallas de la etapa; Rubro, Plazo de pago, Alta y
# Retiene IVA muestran el sentido de cada tipo. Plazo de pago vacío en la dada de baja: lo vacío va al final.
CAMPOS_13 = ["Texto", "Código", "CUIT", "Zona", "Rubro", "Plazo de pago", "Alta", "Retiene IVA"]
VALORES_13 = [("Ferretería", "30", "12/03/2021", False), ("Siderurgia", "60", "05/08/2019", True), ("Construcción", "30", "21/11/2022", False),
              ("Siderurgia", "90", "14/02/2020", True), ("Construcción", "", "30/06/2018", False), ("Construcción", "45", "09/09/2023", False),
              ("Construcción", "30", "17/01/2024", True), ("Ferretería", "15", "02/05/2017", False), ("Sanitarios", "60", "28/10/2021", True),
              ("Construcción", "30", "11/04/2016", True)]
CSS_ORDENAR_13 = CSS_ORDENAR + """
/* La tabla de «Proveedores» con seis campos: se desplaza a lo ancho, con lo de los costados fijo, como las de dos y tres. */
.w-th.kf6, .w-tr.kf6 { grid-template-columns: 28px 30px minmax(192px, 1.25fr) 96px 128px 128px 128px 96px 104px 88px minmax(160px, 1.35fr) 56px 172px; gap: 10px; }
.w-tr.kf6 { position: relative; min-height: 50px; }
.k-desp.t2-corrida .w-th > :not(.fx), .k-desp.t2-corrida .w-tr > :not(.fx) { transform: translateX(-360px); }
"""


def celda(texto):
    return f'<span class="k-tab"><span class="k-in"><span>{texto}</span></span></span>' if texto else '<span class="k-tab"><span class="k-in ph"><span></span></span></span>'


def tabla_13(cuerpo):
    """La tabla de `FRM-Catalogo-13` con Rubro, Plazo de pago, Alta y Retiene IVA después de Zona."""
    cuerpo = cambiar(cuerpo, '<div class="w-th kf">', '<div class="w-th kf6">', 1)
    cuerpo = cambiar(cuerpo, "<span>CUIT</span><span>Zona</span>", "<span>CUIT</span><span>Zona</span><span>Rubro</span><span>Plazo de pago</span>"
                     "<span>Alta</span><span>Retiene IVA</span>", 1)
    cuerpo = cambiar(cuerpo, 'class="k-tabla" style="min-width: 1126px;"', 'class="k-tabla" style="min-width: 1640px;"', 1)
    partes, i, n = [], 0, 0
    for m in re.finditer(r'<div class="w-tr kf( baja)?">', cuerpo):
        fin = cierre(cuerpo, m.start(), "div")
        fila = cuerpo[m.end():fin - len("</div>")]
        cs = hijos(fila)
        assert len(cs) == 9, len(cs)
        nombre = re.sub(r"<[^>]+>", "", fila[cs[2][0]:cs[2][1]]).split("/")[0].rstrip("0123456789")
        rubro, plazo, alta, retiene = VALORES_13[n]
        chk = (f'<span><span class="k-chk on" role="checkbox" aria-checked="true" aria-label="Retiene IVA: {nombre}">{TILDE}</span></span>' if retiene
               else f'<span><span class="k-chk" role="checkbox" aria-checked="false" aria-label="Retiene IVA: {nombre}"></span></span>')
        nuevas = celda(rubro) + celda(plazo) + celda(alta) + chk
        fila = fila[:cs[5][1]] + nuevas + fila[cs[5][1]:]
        partes += [cuerpo[i:m.start()], m.group(0).replace("kf", "kf6"), fila, "</div>"]
        i = fin
        n += 1
    partes.append(cuerpo[i:])
    assert n == 10, n
    return "".join(partes)


def ordenar_e13():
    base = leer("FRM-Catalogo-13")
    banda, cuerpo = de(base, "Campos")
    cuerpo = tabla_13(cuerpo)
    # El orden pendiente por «Rubro»: «Descartar» y «Guardar cambios» se habilitan, e importar, ↑ ↓ y borrar esperan.
    banda_p = cambiar(banda, '<button type="button" class="cb cb-sec" disabled>Descartar</button><button type="button" class="cb cb-pri" disabled>Guardar cambios</button>',
                      '<button type="button" class="cb cb-sec">Descartar</button><button type="button" class="cb cb-pri">Guardar cambios</button>', 1)
    cuerpo_p = cambiar(cuerpo, '<div class="w-caja"><div class="f-cab"><span>Opciones</span>',
                       aviso_orden("Rubro", SENTIDOS["texto"][0]) + '<div class="w-caja"><div class="f-cab"><span>Opciones</span>', 1)
    cuerpo_p = cambiar(cuerpo_p, '<button type="button" class="cb cb-sec">Importar</button>',
                       '<button type="button" class="cb cb-sec" aria-disabled="true" title="Guardá o descartá los cambios antes de importar.">Importar</button>', 1)
    cuerpo_p = FLECHAS.sub(lambda m: f'{m.group(1)} aria-disabled="true" title="{MOVER}"', cuerpo_p)
    cuerpo_p = re.sub(r'(aria-label="Borrar [^"]*")>', rf'\1 aria-disabled="true" title="{BORRAR}">', cuerpo_p)
    # Dibujada corrida hasta «Rubro», como si se hubiera desplazado: así se ve la columna del orden pendiente.
    cuerpo_p = cambiar(cuerpo_p, '<div class="k-desp">', '<div class="k-desp t2-corrida">', 1)
    fondo = [banda, cuerpo]
    estados = [
        ("Elegir la columna", fondo, [dialogo_ordenar("Texto", "texto", False, CAMPOS_13)]),
        ("Por «Rubro»", fondo, [dialogo_ordenar("Rubro", "texto", False)]),
        ("Por un número", fondo, [dialogo_ordenar("Plazo de pago", "numero", False)]),
        ("Por una fecha", fondo, [dialogo_ordenar("Alta", "fecha", False)]),
        ("Por sí o no", fondo, [dialogo_ordenar("Retiene IVA", "sino", False)]),
        ("Por un campo de otro catálogo", fondo, [dialogo_ordenar("Zona", "texto", False)]),
        ("Orden pendiente por «Rubro»", [banda_p, cuerpo_p], []),
    ]
    extra = ("menuMas: false, expMas: 'false', chkTodas: '', pvCerrado: true, pvAbierto: false, pvMuchas: false, pvUna: 'on', pvVarias: '', "
             "busqueda: 'Buscar opción', busClase: '',")
    return nuevo_tablero("FRM-Catalogo-13", "Ordenar las opciones, por un campo · /org/formularios/catalogos/:id", estados, extra, CSS_ORDENAR_13)


CSS_ORDENAR_TEL_13 = CSS_ORDENAR_TEL + """
/* La columna se elige en la lista del teléfono, con la elegida tildada. */
.ap-acciones2 span.t2-hop { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ap-acciones2 span.t2-hop.on { color: var(--marca-tx); font-weight: 600; }
"""


def hoja_columna(columna, columnas):
    """La lista con que el teléfono elige la columna (el selector abierto)."""
    opciones = "".join(f'<span class="t2-hop{" on" if c == columna else ""}" role="option" aria-selected="{"true" if c == columna else "false"}">{c}'
                       f'{TILDE if c == columna else ""}</span>' for c in columnas)
    return ('<div class="ap-velo"></div><div class="ap-hoja" role="dialog" aria-label="Columna" data-t15t2="ordenar"><span class="asa"></span>'
            f'<div class="hc"><div><h2>Columna</h2></div><button type="button" class="ap-ib" aria-label="Cerrar">{X22}</button></div>'
            f'<div class="hb"><div class="ap-acciones2" role="listbox" aria-label="Columna">{opciones}</div></div><div class="hp"></div></div>')


def ordenar_e13_tel():
    """El teléfono de `FRM-Catalogo-Ordenar-13`: la columna en su lista, el sentido de cada tipo y el orden pendiente por «Rubro»."""
    base = leer("M-FRM-Catalogo-13")
    pantalla = de(base, "Campos")[0]
    fijo = ('<div class="ap-fijo"><button type="button" class="cb cb-sec full">Descartar</button>'
            '<button type="button" class="cb cb-pri full">Guardar cambios</button></div>')
    opciones = '<div class="ap-gtit">Opciones</div>'
    aviso = (f'<div class="t2-aviso" role="status"><span>{pendiente("Rubro", SENTIDOS["texto"][0])}</span>'
             '<button type="button" class="cb cb-sec">Cancelar orden</button></div>')
    # Dibujada desplazada hasta «Opciones», como si se hubiera bajado: «El catálogo» y «En WhatsApp» quedan arriba, fuera de la vista.
    i = pantalla.index('<div class="ap-cuerpo">') + len('<div class="ap-cuerpo">')
    j = pantalla.index(opciones)
    assert pantalla.count(opciones) == 1 and i < j
    pend = pantalla[:i] + aviso + pantalla[j:]
    pend = FLECHAS.sub(lambda m: f'{m.group(1)} aria-disabled="true" title="{MOVER}"', pend)
    pend = re.sub(r'(aria-label="Borrar [^"]*")>', rf'\1 aria-disabled="true" title="{BORRAR}">', pend) + fijo
    estados = [
        ("Elegir la columna", [pantalla], [hoja_columna("Texto", CAMPOS_13)]),
        ("Por «Rubro»", [pantalla], [hoja_ordenar("Rubro", "texto", False)]),
        ("Por un número", [pantalla], [hoja_ordenar("Plazo de pago", "numero", False)]),
        ("Por una fecha", [pantalla], [hoja_ordenar("Alta", "fecha", False)]),
        ("Por sí o no", [pantalla], [hoja_ordenar("Retiene IVA", "sino", False)]),
        ("Por un campo de otro catálogo", [pantalla], [hoja_ordenar("Zona", "texto", False)]),
        ("Orden pendiente por «Rubro»", [pend], []),
    ]
    return nuevo_tablero("M-FRM-Catalogo-13", "Ordenar las opciones, por un campo · teléfono", estados, css=CSS_ORDENAR_TEL_13)


# ---------------------------------------------------------------------------------------------------------------- 3 · descartar una publicación
DESCARTAR_PUB = "Descartar esta publicación"
CSS_DEC = """
/* 225 · La confirmación de descartar una publicación: sin ✕ y con el foco en «Cancelar» (161; tanda2_t15_1004.py). */
.w-dlg.dec { width: 420px; }
.w-dlg .cb-sec.foco { box-shadow: 0 0 0 3px oklch(0.48 0.115 140 / 0.25); border-color: var(--marca); }
"""
CSS_DEC_TEL = """
/* 225 · Descartar una publicación: una fila más en el pie y la hoja de confirmar, con el foco en «Cancelar» (tanda2_t15_1004.py). */
.ap-fijo.filas { flex-direction: column; align-items: stretch; gap: 10px; }
.ap-fijo.filas .fila { display: flex; gap: 12px; }
.ap-hoja.dec .cb-sec.foco { box-shadow: 0 0 0 3px oklch(0.48 0.115 140 / 0.25); border-color: var(--marca); }
"""


def confirmar(version, frase):
    titulo = f"¿Descartar la publicación de la versión {version}?"
    return (f'<div class="w-oscuro"><div class="w-dlg dec" role="dialog" aria-modal="true" aria-label="{titulo}" data-t15t2="descartar">'
            f'<div class="dc"><span>{titulo}</span></div><div class="db una"><p class="d-tx">{frase}</p></div>'
            '<div class="df"><button type="button" class="cb cb-sec foco">Cancelar</button>'
            '<button type="button" class="cb cb-pel lleno">Descartar publicación</button></div></div></div>')


def confirmar_tel(version, frase):
    titulo = f"¿Descartar la publicación de la versión {version}?"
    return (f'<div class="ap-velo"></div><div class="ap-hoja dec" role="dialog" aria-label="{titulo}" data-t15t2="descartar"><span class="asa"></span>'
            f'<div class="hc"><div><h2>{titulo}</h2></div></div><div class="hb"><p style="margin: 0; font-size: 15px; line-height: 1.45; color: var(--t2);">{frase}</p></div>'
            '<div class="hp"><button type="button" class="cb cb-pel lleno">Descartar publicación</button><button type="button" class="cb cb-sec foco">Cancelar</button></div></div>')


def toast_ok(t, texto):
    """El aviso de abajo que salió bien, con el ícono y la ✕ que ya usa el tablero."""
    m = re.search(r'<div class="f-toast" role="status"><span class="ok">(<svg.*?</svg>)</span><span>[^<]*</span>'
                  r'<button type="button" class="ib" aria-label="Cerrar">(<svg.*?</svg>)</button></div>', t, re.S)
    return (f'<div class="f-toast" role="status"><span class="ok">{m.group(1)}</span><span>{texto}</span>'
            f'<button type="button" class="ib" aria-label="Cerrar">{m.group(2)}</button></div>')


CONSULTAR = '<button type="button" class="cb cb-sec">Consultar publicación</button>'
DESCARTAR_BTN = f'<button type="button" class="cb cb-sec">{DESCARTAR_PUB}</button>'
DESCARTAR_APAGADO = '<button type="button" class="cb cb-sec" disabled>Descartar</button>'


def sin_dos_descartar(b, despues, nuevo):
    """La banda de una publicación trabada sin cambios sin guardar: «Descartar esta publicación» después de `despues`, y sin el
    «Descartar» apagado de los cambios del borrador, así no hay dos «Descartar» juntos y la banda entra sin bajar de renglón."""
    if nuevo in b:
        return b
    assert b.count(DESCARTAR_APAGADO) == 1 and b.count(despues) == 1, b[:300]
    return b.replace(DESCARTAR_APAGADO, "", 1).replace(despues, despues + nuevo, 1)


def publicando(t):
    # Sin confirmar: la salida a mano, después de «Consultar publicación»; mientras consulta, apagada con su motivo.
    t = en_estado(t, idx(t, "Sin confirmar"), lambda n, b: b if n else sin_dos_descartar(b, CONSULTAR, DESCARTAR_BTN))
    consultando = ('<button type="button" class="cb cb-sec k-trabaja" aria-disabled="true" aria-busy="true"><span class="girar2" aria-hidden="true"></span>'
                   'Consultando…</button>')
    apagado = f'<button type="button" class="cb cb-sec" aria-disabled="true" title="Esperá a que termine la consulta.">{DESCARTAR_PUB}</button>'
    t = en_estado(t, idx(t, "Consultando"), lambda n, b: b if n else sin_dos_descartar(b, consultando, apagado))
    t = sumar_estado(t, idx(t, "Sin confirmar"), "Descartar esta publicación", "Consultando", lambda n, c: c)
    t = sumar_capa(t, idx(t, "Descartar esta publicación"), confirmar(4, "Queda como no publicada y en WhatsApp sigue la versión 3."), "¿Descartar la publicación")

    def descartada(n, c):
        if n:
            return c
        c = cambiar(c, '<button type="button" class="cb cb-sec">Repetir el mismo intento</button>', "", 1)
        return re.sub(r'<span class="e-tipw"><button type="button" class="cb cb-pri" aria-disabled="true" title="[^"]*">Publicar en WhatsApp</button>'
                      r'<span class="e-tip" role="tooltip">[^<]*</span></span>', '<a class="cb cb-pri" href="FRM-Publicar.dc.html">Publicar en WhatsApp</a>', c, count=1)
    t = sumar_estado(t, idx(t, "El pedido no tuvo respuesta"), "Publicación descartada", "Descartar esta publicación", descartada)
    t = sumar_capa(t, idx(t, "Publicación descartada"), toast_ok(t, "Descartamos la publicación de la versión 4."), "Descartamos la publicación")
    return con_css(t, "descartar", CSS_DEC)


FILA_CONSULTAR = '<div class="fila"><button type="button" class="cb cb-sec full">Consultar publicación</button></div>'
FILA_DESCARTAR = f'<div class="fila"><button type="button" class="cb cb-sec full">{DESCARTAR_PUB}</button></div>'


def snack_ok(t, texto):
    m = re.search(r'<div class="f-snack" role="status"><span class="ok">(<svg.*?</svg>)</span>', t, re.S)
    return f'<div class="f-snack" role="status"><span class="ok">{m.group(1)}</span><span class="tx">{texto}</span></div>'


def editor_tel(t):
    for estado in ("Sin confirmar", "El motivo de Publicar apagado"):
        t = en_estado(t, idx(t, estado), lambda n, b: b if n or FILA_DESCARTAR in b else cambiar(b, FILA_CONSULTAR, FILA_CONSULTAR + FILA_DESCARTAR, 1))
    trabaja = ('<div class="fila"><button type="button" class="cb cb-sec full k-trabaja" aria-disabled="true" aria-busy="true">'
               '<span class="girar2" aria-hidden="true"></span>Consultando…</button></div>')
    apagada = (f'<div class="fila"><button type="button" class="cb cb-sec full" aria-disabled="true" title="Esperá a que termine la consulta.">'
               f'{DESCARTAR_PUB}</button></div>')
    t = en_estado(t, idx(t, "Consultando"), lambda n, b: b if n or apagada in b else cambiar(b, trabaja, trabaja + apagada, 1))
    t = sumar_estado(t, idx(t, "Sin confirmar"), "Descartar esta publicación", "Consultando", lambda n, c: c)
    t = sumar_capa(t, idx(t, "Descartar esta publicación"), confirmar_tel(4, "Queda como no publicada y en WhatsApp sigue la versión 3."), "¿Descartar la publicación")
    snack = snack_ok(t, "Descartamos la publicación de la versión 4.")

    def descartada(n, c):
        c = cambiar(c, '<div class="ap-fijo filas"><div class="fila"><button type="button" class="cb cb-sec full">Repetir el mismo intento</button></div>'
                       '<div class="fila"><button type="button" class="cb cb-pri full" aria-disabled="true">Publicar en WhatsApp</button></div></div>',
                    '<div class="ap-fijo"><a class="cb cb-pri full" href="#">Publicar en WhatsApp</a></div>', 1)
        return c[:-len("</sc-if>")] + snack + "</sc-if>"
    t = sumar_estado(t, idx(t, "El pedido no tuvo respuesta"), "Publicación descartada", "Descartar esta publicación", descartada)
    return con_css(t, "descartar", CSS_DEC_TEL)


FRASE_17 = "El formulario sigue de baja y se retiran sus Flows de WhatsApp."


def baja(t, ok):
    t = en_estado(t, idx(t, "Reactivando: sin confirmar"), lambda n, b: b if n else sin_dos_descartar(b, CONSULTAR, DESCARTAR_BTN))
    t = sumar_estado(t, idx(t, "Reactivando: sin confirmar"), "Reactivando: descartar la publicación", "Reactivando: sin confirmar", lambda n, c: c)
    t = sumar_capa(t, idx(t, "Reactivando: descartar la publicación"), confirmar(3, FRASE_17), "¿Descartar la publicación")
    t = sumar_estado(t, idx(t, "De baja"), "Reactivando: descartada", "Reactivando: descartar la publicación", lambda n, c: c)
    t = sumar_capa(t, idx(t, "Reactivando: descartada"), ok, "Descartamos la publicación")
    return con_css(t, "descartar", CSS_DEC)


def baja_tel(t, ok_svg):
    fijo_viejo = '<div class="ap-fijo"><button type="button" class="cb cb-pri full" aria-disabled="true">Reactivar</button></div>'
    fijo_nuevo = (f'<div class="ap-fijo filas">{FILA_CONSULTAR}{FILA_DESCARTAR}'
                  '<div class="fila"><button type="button" class="cb cb-pri full" aria-disabled="true">Reactivar</button></div></div>')

    def sin_confirmar(n, c):
        c = cambiar(c, '<span class="sub">Publicando la versión 3</span>', '<span class="sub">Sin confirmar · versión 3</span>', 1)
        return cambiar(c, fijo_viejo, fijo_nuevo, 1)
    t = sumar_estado(t, idx(t, "Reactivando"), "Reactivando: sin confirmar", "Reactivando", sin_confirmar)
    t = sumar_estado(t, idx(t, "Reactivando: sin confirmar"), "Reactivando: descartar la publicación", "Reactivando: sin confirmar", lambda n, c: c)
    t = sumar_capa(t, idx(t, "Reactivando: descartar la publicación"), confirmar_tel(3, FRASE_17), "¿Descartar la publicación")
    snack = (f'<div class="f-snack" role="status"><span class="ok">{ok_svg}</span><span class="tx">Descartamos la publicación de la versión 3.</span></div>')
    t = sumar_estado(t, idx(t, "De baja"), "Reactivando: descartada", "Reactivando: descartar la publicación", lambda n, c: c[:-len("</sc-if>")] + snack + "</sc-if>")
    return con_css(t, "descartar", CSS_DEC_TEL)


# ---------------------------------------------------------------------------------------------------------------- 4 · exportar
INFO_COLUMNAS = "N°, recibida, quién la cargó, canal, empresas y las preguntas de todas las versiones, con todos los campos."
INFO_ARCHIVOS = "De las fotos y los documentos va la cantidad y los nombres, sin los archivos."
INFO_ANULADAS = "Suma la columna «Anulada»."
TOPE = "El máximo es 10.000 respuestas. Acotá los filtros de la planilla."
CHIPS_0 = ["Empresa: Delta S.A.", "Recibida: últimos 7 días", "Motivo: Venta nueva"]
CSS_EXPORTAR = """
/* 226 · Exportar dice qué exporta (EX1-A): «Respuestas» y «Filtros» en una grilla, con los chips de la planilla sin la ✕; «Columnas»
   con su (i), «Solo las visibles» apagada sin columnas ocultas; al pie, «Archivo» (tanda2_t15_1004.py). */
.g-det { display: grid; grid-template-columns: 120px minmax(0, 1fr); border: 1px solid var(--borde); border-radius: 10px; overflow: hidden; background: #fff; }
.g-det > span { padding: 9px 12px; border-top: 1px solid var(--borde); font-size: 13.5px; line-height: 1.45; color: var(--t1); min-width: 0; }
.g-det > span:nth-child(-n+2) { border-top: 0; }
.g-det > .k { background: oklch(0.975 0.01 95); color: var(--t2); font-weight: 500; border-right: 1px solid var(--borde); }
.g-det .g-vacio { color: var(--t3); }
.t2-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.t2-chip { height: 28px; box-sizing: border-box; display: inline-flex; align-items: center; padding: 0 12px; border-radius: 999px; background: var(--s2); border: 1px solid var(--borde); font-size: 13px; color: var(--t1); }
.t2-grupo { display: flex; flex-direction: column; gap: 8px; }
.ex-rd { position: relative; }
.ex-rd.off { color: var(--t3); cursor: default; }
.ex-rd.off .rd { background: var(--s2); }
.ex-rd .e-tip { left: 0; right: auto; top: calc(100% + 6px); }
.ex-rd .e-tip::before { left: 18px; right: auto; }
.w-dlg .df .e-tip { top: auto; bottom: calc(100% + 8px); }
.w-dlg .df .e-tip::before { top: auto; bottom: -4px; }
.w-dlg .df .cb[aria-disabled="true"] { opacity: 0.55; cursor: default; }
"""


def exportar_dialogo(t, respuestas, chips, visibles_on, eleccion, archivo, modo="", info=None, info_abierta=False, anuladas=None):
    """El diálogo de exportar de EX1-A. `visibles_on`: True, «Solo las visibles» habilitada; "tip", apagada con el motivo a la vista.
    `info`: lo que dice la (i) de «Columnas» (con `info_abierta`, su globo a la vista, como lo dibuja la 18). `anuladas`: None sin la
    casilla; False o True, «Incluir las anuladas» (E21) debajo de las columnas, con su (i), y marcada «Respuestas» lo dice."""
    info = info or INFO_COLUMNAS
    globo_info = f'<span class="e-tip ex-tip" role="tooltip">{info}</span>' if info_abierta else ""
    casilla = ""
    if anuladas is not None:
        caja = f"<i>{TILDE}</i>" if anuladas else '<i class="no"></i>'  # la tilde de la casilla, la misma del tablero
        casilla = (f'<span class="q-chk ex-anu" role="checkbox" aria-checked="{"true" if anuladas else "false"}">{caja}Incluir las anuladas'
                   f'<span class="f-i" tabindex="0" role="img" aria-label="{INFO_ANULADAS}" title="{INFO_ANULADAS}">{INFO}</span></span>')
        if anuladas:
            respuestas = f"{respuestas} y las anuladas"
    chips_html = ('<span class="t2-chips">' + "".join(f'<span class="t2-chip">{c}</span>' for c in chips) + "</span>") if chips else '<span class="g-vacio">Ninguno</span>'
    cerrar = re.search(r'<div class="dc"><span>Exportar respuestas a Excel</span><button type="button" class="ib" aria-label="Cerrar">(<svg.*?</svg>)</button>', t, re.S).group(1)
    todas = f'<div class="ex-rd{" on" if eleccion == "todas" else ""}" role="radio" aria-checked="{"true" if eleccion == "todas" else "false"}"><span class="rd"></span>Todas las preguntas</div>'
    if visibles_on is True:
        visibles = f'<div class="ex-rd{" on" if eleccion == "visibles" else ""}" role="radio" aria-checked="{"true" if eleccion == "visibles" else "false"}"><span class="rd"></span>Solo las visibles</div>'
    else:
        globo = '<span class="e-tip" role="tooltip">Se ven todas las columnas.</span>' if visibles_on == "tip" else ""
        visibles = (f'<div class="ex-rd off" role="radio" aria-checked="false" aria-disabled="true" title="Se ven todas las columnas.">'
                    f'<span class="rd"></span>Solo las visibles{globo}</div>')
    x = f'<button type="button" class="ib" aria-label="Cerrar">{cerrar}</button>'
    cancelar = '<button type="button" class="cb cb-sec">Cancelar</button>'
    principal = '<button type="button" class="cb cb-pri">Exportar a Excel</button>'
    if modo == "exportando":
        x = f'<button type="button" class="ib" aria-label="Cerrar" disabled title="Esperá a que termine de exportar.">{cerrar}</button>'
        cancelar = '<button type="button" class="cb cb-sec" disabled title="Esperá a que termine de exportar.">Cancelar</button>'
        principal = ('<button type="button" class="cb cb-pri k-trabaja" aria-disabled="true" aria-busy="true"><span class="girar2" aria-hidden="true"></span>'
                     "Exportando…</button>")
    elif modo == "tope":
        principal = (f'<span class="e-tipw"><button type="button" class="cb cb-pri" aria-disabled="true" title="{TOPE}">Exportar a Excel</button>'
                     f'<span class="e-tip" role="tooltip">{TOPE}</span></span>')
    return ('<div class="w-oscuro"><div class="w-dlg ex" role="dialog" aria-modal="true" aria-label="Exportar respuestas a Excel" data-t15t2="exportar">'
            f'<div class="dc"><span>Exportar respuestas a Excel</span>{x}</div><div class="db una">'
            f'<div class="g-det"><span class="k">Respuestas</span><span>{respuestas}</span><span class="k">Filtros</span><span>{chips_html}</span></div>'
            f'<div class="t2-grupo" role="radiogroup" aria-label="Columnas"><span class="ex-tit">Columnas<span class="f-i" tabindex="0" role="img" '
            f'aria-label="{info}" title="{info}">{INFO}</span>{globo_info}</span><div class="ex-rds">{todas}{visibles}</div></div>'
            f'{casilla}<div class="g-det"><span class="k">Archivo</span><span>{archivo}</span></div></div>'
            f'<div class="df">{cancelar}{principal}</div></div></div>')


def toast_mal(t, texto):
    """El aviso de abajo de una acción que falló, con el ícono de error y la ✕ que ya usa el lienzo."""
    pub = leer("FRM-Publicando")
    m = re.search(r'<div class="f-toast" role="status"><span class="mal">(<svg.*?</svg>)</span><span>[^<]*</span>'
                  r'<button type="button" class="ib" aria-label="Cerrar">(<svg.*?</svg>)</button></div>', pub, re.S)
    return (f'<div class="f-toast" role="status"><span class="mal">{m.group(1)}</span><span>{texto}</span>'
            f'<button type="button" class="ib" aria-label="Cerrar">{m.group(2)}</button></div>')


def exportar(t):
    archivo = "Visita a cliente-2026-10-15.xlsx"
    dialogos = {
        "Exportar": exportar_dialogo(t, "4", CHIPS_0, True, "todas", archivo),
        "Solo las columnas visibles": exportar_dialogo(t, "4", CHIPS_0, True, "visibles", archivo),
        "Más de 10.000": exportar_dialogo(t, "12.430", [], False, "todas", archivo, "tope"),
        "Exportando": exportar_dialogo(t, "4", CHIPS_0, True, "todas", archivo, "exportando"),
        "Ya hay una exportación en curso": exportar_dialogo(t, "4", CHIPS_0, True, "todas", archivo)
        + toast_mal(t, "Ya tenés una exportación en curso. Esperá a que termine."),
        "No se pudo exportar": exportar_dialogo(t, "4", CHIPS_0, True, "todas", archivo) + toast_mal(t, "No pudimos armar el archivo. Probá de nuevo."),
        "Elegir varias y campos": exportar_dialogo(t, "18", [], "tip", "todas", "Pedir repuesto-2026-10-15.xlsx"),
    }
    for estado, html in dialogos.items():
        k = idx(t, estado)
        a, b = bloques(t, k)[-1]
        viejo = t[a:b]
        if 'data-t15t2="exportar"' in viejo:
            continue
        assert '<div class="w-oscuro"><div class="w-dlg ex"' in viejo, estado
        apertura = viejo[:viejo.index(">") + 1]
        t = t[:a] + apertura + html + "</sc-if>" + t[b:]
    assert "(13 columnas)" not in t and "filtros aplicados" not in t
    return con_css(t, "exportar", CSS_EXPORTAR)


def exportar_un_estado(t, estado, html):
    """El diálogo de exportar del estado `estado` (su último bloque) pasa a `html`."""
    a, b = bloques(t, idx(t, estado))[-1]
    viejo = t[a:b]
    if 'data-t15t2="exportar"' not in viejo:
        assert '<div class="w-oscuro"><div class="w-dlg ex"' in viejo, estado
        t = t[:a] + viejo[:viejo.index(">") + 1] + html + "</sc-if>" + t[b:]
    assert "(13 columnas)" not in t and "filtros aplicados" not in t
    return con_css(t, "exportar", CSS_EXPORTAR)


def exportar_18(t):
    """La 18: la (i) de «Columnas» dice qué va de las fotos y los documentos, con su globo a la vista, como antes."""
    html = exportar_dialogo(t, "24", [], True, "todas", "Visita a cliente-2026-10-15.xlsx", info=INFO_ARCHIVOS, info_abierta=True)
    return exportar_un_estado(t, "Exportar", html)


def exportar_anular(t):
    """La 21: «Incluir las anuladas», marcada, debajo de las columnas (spec 21), y «Respuestas» dice «24 y las anuladas»."""
    html = exportar_dialogo(t, "24", [], True, "todas", "Visita a cliente-2026-10-15.xlsx", anuladas=True)
    return exportar_un_estado(t, "Exportar con las anuladas", html)


# En el teléfono (la hoja de `M-FRM-Respuestas` y la de la 16), lo mismo en una lista de datos: Respuestas, Filtros, Columnas (que
# en el teléfono son siempre todas, sin elegir) con su (i), y al pie Archivo. Sin filtros, «Ninguno».
HOJA_VIEJA = re.compile(r'<div class="hb"><div style="display: flex; flex-direction: column; gap: 6px;"><span class="t-lin">24 respuestas</span>'
                        r'<span class="t-lin">0 filtros aplicados</span><span class="t-lin">Todas las preguntas \(13 columnas\)</span></div>'
                        r'<span class="ex-arch"><svg.*?</svg> Visita a cliente-2026-10-15\.xlsx</span></div>', re.S)


HOJA_VIEJA_18 = re.compile(r'<div class="hb"><div style="display: flex; flex-direction: column; gap: 6px;"><span class="t-lin">24 respuestas</span>'
                           r'<span class="t-lin">0 filtros aplicados</span><span class="t-lin">Todas las preguntas \(13 columnas\)<button type="button" class="ap-i" '
                           r'aria-label="Qué significa" title="[^"]*"><svg.*?</svg></button></span></div>'
                           r'<span class="ex-arch"><svg.*?</svg> Visita a cliente-2026-10-15\.xlsx</span></div>', re.S)


def exportar_tel(t, info=INFO_COLUMNAS, vieja=HOJA_VIEJA):
    nuevo = ('<div class="hb"><div class="ap-grupo" style="margin: 0;" data-t15t2="exportar">'
             '<div class="ap-dato"><span class="k">Respuestas</span><span class="v">24</span></div>'
             '<div class="ap-dato"><span class="k">Filtros</span><span class="v" style="color: var(--t3);">Ninguno</span></div>'
             f'<div class="ap-dato"><span class="k">Columnas<span class="f-i" style="margin-left: 4px;" tabindex="0" role="img" aria-label="{info}" title="{info}">{INFO}</span></span>'
             '<span class="v">Todas las preguntas</span></div>'
             '<div class="ap-dato"><span class="k">Archivo</span><span class="v">Visita a cliente-2026-10-15.xlsx</span></div></div></div>')
    if 'data-t15t2="exportar"' in t:
        return t
    solo(vieja.pattern, t)
    t = vieja.sub(lambda m: nuevo, t)
    assert "(13 columnas)" not in t and "filtros aplicados" not in t
    return t


# ---------------------------------------------------------------------------------------------------------------- 5 · Criterio-Decisiones
CRITERIO = [
    ("Descargar la plantilla, Ordenar de la A a la Z y Generar los códigos que faltan", "Descargar la plantilla, «Ordenar por…» y Generar los códigos que faltan"),
    ("«Por aprobar (N) | Todas» arriba de la planilla, con el segmentado y no con pestañas (148).",
     "«Por aprobar (N) | Todas» arriba de la planilla, con el segmentado y no con pestañas (148); la 228 suma «Por resolver (N)» en el medio: «Por aprobar (N) | Por resolver (N) | Todas»."),
]


# ---------------------------------------------------------------------------------------------------------------- el pase
NUEVOS = {"FRM-Catalogo-Ordenar": ordenar_e12, "M-FRM-Catalogo-Ordenar": ordenar_e12_tel, "FRM-Catalogo-Ordenar-13": ordenar_e13,
          "M-FRM-Catalogo-Ordenar-13": ordenar_e13_tel}


def pasar(nombre, t):
    if nombre in E12 or nombre in E13:
        t = menu_ordenar(t, nombre, (E12 | E13)[nombre] + ".dc.html")
    if nombre == "FRM-Catalogo":
        t = catalogo(t)
    if nombre == "M-FRM-Catalogo":
        t = catalogo_tel(t)
    if nombre == "FRM-Publicando":
        t = publicando(t)
    if nombre == "M-FRM-Editor":
        t = editor_tel(t)
    if nombre == "FRM-Editor-Baja":
        t = baja(t, toast_ok(leer("FRM-Publicando"), "Descartamos la publicación de la versión 3."))
    if nombre == "M-FRM-Editor-Baja":
        m = re.search(r'<div class="f-snack" role="status"><span class="ok">(<svg.*?</svg>)</span>', leer("M-FRM-Editor"), re.S)
        t = baja_tel(t, m.group(1))
    if nombre == "FRM-Respuestas-Exportar":
        t = exportar(t)
    if nombre in ("M-FRM-Respuestas", "M-FRM-Respuestas-16"):
        t = exportar_tel(t)
    if nombre == "M-FRM-Respuestas-18":
        t = exportar_tel(t, INFO_ARCHIVOS, HOJA_VIEJA_18)
    if nombre == "FRM-Respuestas-18":
        t = exportar_18(t)
    if nombre == "FRM-Respuesta-Anular":
        t = exportar_anular(t)
    if nombre == "Criterio-Decisiones":
        for viejo, nuevo in CRITERIO:
            t = cambiar(t, viejo, nuevo, 1)
    return t


TABLEROS = sorted(set(E12) | set(E13) | {"M-FRM-Catalogo", "FRM-Publicando", "M-FRM-Editor", "FRM-Editor-Baja", "M-FRM-Editor-Baja",
                                          "FRM-Respuestas-Exportar", "M-FRM-Respuestas", "M-FRM-Respuestas-16", "Criterio-Decisiones",
                                          "FRM-Respuestas-18", "M-FRM-Respuestas-18", "FRM-Respuesta-Anular"})

if __name__ == "__main__":
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    archivo = [n for n in TABLEROS if canvas["boards"].get(f"{n}.dc.html", {}).get("page") in (None, "archivo")]
    assert not archivo, f"no están vivos: {archivo}"
    cambiados = []
    for nombre in TABLEROS:
        t = leer(nombre)
        nuevo = pasar(nombre, t)
        if nuevo != t:
            escribir(nombre, nuevo)
            cambiados.append(nombre)
    for nombre, armar in NUEVOS.items():
        if (PROJ / f"{nombre}.dc.html").exists():
            continue
        escribir(nombre, armar())
        cambiados.append(nombre)
    print("ok", len(TABLEROS) + len(NUEVOS), "tableros,", len(cambiados), "cambiados")
    if cambiados:
        print("después: python traspaso10_piezas_1004.py --tableros " + ",".join(cambiados))
