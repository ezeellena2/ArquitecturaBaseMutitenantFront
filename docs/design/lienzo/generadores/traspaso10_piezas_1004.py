"""Las piezas compartidas del lienzo con las reglas del traspaso 10 (tanda «a» de la §4.3 de su evaluación, 2026-11-07), en los
410 tableros vivos (el Archivo no se toca):
- que no parezca plantilla (173): la marca es el nombre, sin cuadrado ni degradé; la banda, sin ícono; el avatar, un cuadrado chico
  con la inicial; el activo del menú, una barra de 2 px; los filtros y las etiquetas, con el radio de un control, y los contadores,
  como texto; el principal, sólido, y sin sombras salvo en menús, desplegables y tooltips;
- la línea fina entre columnas (137), en las tablas de las piezas comunes (`tt-*` y `w-t*`) que no la tenían;
- los filtros (143 y 144): las opciones sin su cantidad, la barra sin el total y «Filtros» en lugar de «Más filtros»;
- la primera carga de un listado (160): el encabezado y el aro en el alto de ocho filas, en lugar de las filas esqueleto;
- el texto largo entero (174): las celdas, las filas del teléfono y las opciones del menú bajan de renglón en lugar de cortar con «…»;
- la escala de ArquitecturaBase (180), en los tableros de la compu: la letra × 0,82 (sin bajar de 10,5 px), los altos y el interlineado
  de 18 a 72 px × 0,74 (y el ancho de lo que es cuadrado), los rellenos, márgenes y separaciones de 4 px o más × 0,72, y las esquinas
  de 3 px como mucho. Los factores están en `ESCALA`, en un solo lugar. Cada px que cambia guarda el de antes al lado
  (`29.6px/*40px*/`), así otra corrida, o una escala distinta, parte siempre del original. Los teléfonos (los tableros de menos de
  768 de ancho) y lo que dibuja un teléfono adentro de un tablero de la compu conservan sus medidas táctiles.

Uso: `python traspaso10_piezas_1004.py` pasa por todos los tableros vivos; `python traspaso10_piezas_1004.py --tableros FRM-Editor,M-FRM-Editor`
pasa solo por esos (con o sin `.dc.html`), por ejemplo después de que el generador de una etapa los rehace.

Cada tablero lleva un bloque `<style data-t10="piezas">` antes de `</helmet>`. Sus reglas van con `:root` delante, para pisar las de
las piezas aunque vengan después o con `!important`. Las sombras se calculan por tablero: cada regla con una sombra desenfocada que no
es de un menú, un desplegable o un tooltip se pisa con lo que no es sombra (un anillo de foco, un borde de 1 px o una línea `inset`),
o con `none`. No se tocan lo que no es nuestro (Meta, WhatsApp y la vista previa del teléfono de quien recibe un formulario) ni la
hoja del PDF.

Lo propio de cada etapa queda para su tanda (§4.3): este pase cambia solo las piezas comunes. Los `Criterio-*` dicen las reglas en
`reglas_7_11_1004.py` y `criterio_decisiones.py`; acá solo toman el bloque, como todos.

Corre al final de todo, después de `paleta_pradera_1004.py`. Se puede volver a correr: el bloque se rehace y los cambios de texto ya
hechos no vuelven a encontrar lo que buscan.
"""
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA_BLOQUE = 'data-t10="piezas"'
BLOQUE = re.compile(r'<style data-t10="piezas">.*?</style>\n?', re.S)

# ---------------------------------------------------------------------------------------------------------------- las piezas
PIEZAS = """
/* 173 · La marca es el nombre, sin cuadrado ni degradé; la banda, sin ícono de la sección. */
:root .brand, :root .w-br, :root .app .sb .br, :root .lat .sb .brand2 { display: none !important; }
:root .ab-sidebar__head { gap: 0 !important; }
:root .banda-pag .ico, :root .w-bnd .ic, :root .bnd .ic, :root .carril .quien .ico { display: none !important; }
:root .ini-ico, :root .lp-ico { background: transparent !important; width: auto !important; height: auto !important; }

/* 173 · El avatar, un cuadrado con la inicial, sin degradé: chico (24) en la barra de arriba y en el pie del menú. */
:root .avatar, :root .w-av, :root .ap-nav .yo, :root .av, :root .org-av, :root .mail-de .logo { background: var(--marca) !important; color: #fff; border-radius: 6px !important; }
:root .avatar.gris { background: var(--s3) !important; color: var(--t2) !important; }
:root .w-av.g { background: oklch(0.9 0.015 95) !important; color: var(--t2) !important; }
:root .ab-topbar .um-btn .avatar, :root .ab-sidebar__user .avatar, :root .ab-sidebar__footer .avatar, :root .w-us .w-av, :root .w-umd .um .w-av { width: 24px !important; height: 24px !important; font-size: 12px !important; border-radius: 5px !important; }
:root .menu-cab .avatar, :root .w-mn-cab .w-av, :root .ap .w-av, :root .ap-cbar .w-av { border-radius: 8px !important; }
:root .ap-yo .w-av, :root .ap-perfil .w-av, :root .org-av { border-radius: 12px !important; }

/* 173 · El activo del menú: una barra de 2 px de la marca, sin pastilla blanca ni sombra. */
:root .ab-sidebar__link--active, :root .ab-sidebar__link--active:hover, :root .ab-root.adm-abierto .adm-btn, :root .ab-root.wa-abierto .wa-btn, :root .w-ln.on, :root .app .sb .ln.on, :root .lat .sb .ln.on {
  background: var(--lado-hover) !important; color: var(--marca-tx) !important; font-weight: 600 !important; box-shadow: inset 2px 0 0 var(--marca) !important; border-radius: 0 8px 8px 0 !important; }
:root .adm-panel .ab-sidebar__link--active, :root .adm-panel .ab-sidebar__link--active:hover, :root .w-panel .w-ln.on, :root .lat .panel .ln.on {
  background: oklch(0.872 0.043 95) !important; color: var(--marca-tx) !important; font-weight: 600 !important; box-shadow: inset 2px 0 0 var(--marca) !important; border-radius: 0 8px 8px 0 !important; }

/* 173 · El principal, sólido: sin degradé ni sombra. */
:root .b-pri, :root .cb-pri { background: var(--marca) !important; box-shadow: none !important; filter: none !important; }
:root .b-pri:hover, :root .cb-pri:hover, :root .cb-pri.h { background: var(--marca-h) !important; filter: none !important; }
:root .ab-btn.ab-btn--outline:not(:focus-visible) { box-shadow: none !important; }

/* 173 · Los filtros y las etiquetas, con el radio de un control; los contadores, como texto. */
:root .pill-sel, :root .filtros .pil, :root .w-pil, :root .caja.fil .pi, :root .flt .pil, :root .fb2 .pil, :root .tb .pie .pil, :root .tel .pills span, :root .ap-chips2 span, :root .ap-flt .ch, :root .pl-chip, :root .flt.r311 .chip, :root .as-chip, :root .ap-pill { border-radius: 8px !important; }
:root .pill, :root .rol, :root .pl-marca, :root .ap-fila .pl-marca, :root .auth-marca .kicker, :root .lp-kicker { border-radius: 6px !important; }
:root .tab2 .cnt, :root .ini .t-cab .cnt { background: transparent !important; padding: 0 !important; border-radius: 0 !important; color: var(--t3) !important; }
:root .w-panel .w-ln .cnt, :root .fm-cnt, :root .ap-fila .fm-cnt, :root .ap-it .ap-cnt { background: transparent !important; padding: 0 !important; min-width: 0 !important; height: auto !important; border-radius: 0 !important; color: var(--marca-tx) !important; font-weight: 600 !important; }
:root .w-campana .n, :root .ap-campana .n, :root .c-campana .n, :root .cmp .n, :root .c-bad, :root .pl-fil .n, :root .flt.r311 .pil .n { border-radius: 5px !important; }

/* 143 y 144 · Las opciones de un filtro no dicen cuántas filas traen, y la barra no lleva el total: va al pie. */
:root .menu-cnt, :root .f-mn .cnt, :root .mf-ck small, :root .mf .esq-n, :root .tot { display: none !important; }

/* 137 · Una línea fina entre columnas, del tono de la que separa las filas, en el encabezado y en el cuerpo. */
:root .tt-h, :root .tt-f, :root .w-th@PL@:not(.k-desp *), :root .w-tr@PL@:not(.k-desp *) { position: relative; }
:root .tt-f > * + *@SIN@::after, :root .w-tr@PL@:not(.k-desp *) > * + *@SIN@::after { content: ""; display: block; position: absolute; top: 0; bottom: 0; width: 1px; margin-left: @TT@; background: oklch(0.915 0.013 95 / 0.8); pointer-events: none; }
:root .tt-h > * + *@SIN@::after, :root .w-th@PL@:not(.k-desp *) > * + *@SIN@::after { content: ""; display: block; position: absolute; top: 0; bottom: 0; width: 1px; margin-left: @TT@; background: oklch(0.89 0.031 95); pointer-events: none; }
:root .w-tr@PL@:not(.k-desp *) > * + *@SIN@::after, :root .w-th@PL@:not(.k-desp *) > * + *@SIN@::after { margin-left: -8.5px; }
@FIJA@

/* 174 · El texto largo se ve entero: la celda baja de renglón en lugar de cortar con «…». */
:root .tt-f > *, :root .tt-f .dos > *, :root .tt-f > .c2b, :root .c1, :root .c2, :root .w-tr > span, :root .w-tr .dos span, :root .w-tr .k-tc small, :root .w-tr.pl > span, :root .w-th.pl > span,
:root .tb .tr > *, :root .tb .tr .dos > *, :root .ap-fila .l2, :root .q-it .dato b, :root .q-it .dato > span, :root .w-it .dato > b, :root .w-it .dato > span, :root .fx-n a, :root .tb-hor .h .l, :root .k-lee, :root .pl-quien .tx, :root .tr-sec .h .r, :root .ini-t .d, :root .c-p b, :root .c-p .tx > span, :root .w-tr.t .dos span, :root .lista .it .dato, :root .cg-fot .nm, :root .as-adj .n, :root .md-it .tx b, :root .md-it .tx small, :root .o-fila .dos > *, :root .o-res .dos > *, :root .dir-desc, :root .dir-emp a {
  white-space: normal !important; overflow: visible !important; text-overflow: clip !important; overflow-wrap: break-word; }
/* Las celdas que se centraban con un interlineado del alto de la fila (la planilla, la tabla de los Criterio): al bajar de renglón,
   cada renglón ocupaba una fila entera. Se centran con su relleno, que da el mismo alto con un renglón. */
:root .w-tr.pl > span, :root .tb .tr > * { line-height: 1.35 !important; padding-top: 13.2px !important; padding-bottom: 13.2px !important; }
:root .w-th.pl > span, :root .tb .th > * { line-height: 1.35 !important; padding-top: 11.2px !important; padding-bottom: 11.2px !important; }
:root .ab-sidebar__link-label, :root .w-ln { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
:root .ab-sidebar .ab-sidebar__link, :root .ab-sidebar__link, :root .w-ln { height: auto !important; min-height: 32px; box-sizing: border-box; padding-top: 6px !important; padding-bottom: 6px !important; line-height: 20px; }

/* 160 · La primera carga de un listado: el encabezado y el aro en el alto de ocho filas, sin filas esqueleto. */
.t10-carga { height: @CARGA@px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--borde); }
.t10-carga-tel { flex: 1; min-height: 360px; display: flex; align-items: center; justify-content: center; }
.t10-aro { width: 22px; height: 22px; box-sizing: border-box; border-radius: 50%; border: 2.5px solid oklch(0.89 0.031 95); border-top-color: var(--marca); animation: t10-gira 0.9s linear infinite; }
@keyframes t10-gira { to { transform: rotate(360deg); } }
"""

# ---------------------------------------------------------------------------------------------------------------- las sombras
ESTILO = re.compile(r"<style\b[^>]*>(.*?)</style>", re.S)
COMENTARIO = re.compile(r"/\*.*?\*/", re.S)
REGLA = re.compile(r"([^{}]*)\{([^{}]*)\}")
SOMBRA = re.compile(r"box-shadow\s*:\s*([^;}]+?)\s*(!important)?\s*(?:;|$)", re.I)
# Lo que flota y se abre (un menú, un desplegable, una lista, un tooltip) conserva su sombra.
FLOTA = re.compile(r"(menu|\bmn\b|-mn\b|\bmn-|\.\w*mn\b|lista\b|lst\b|-ops\b|\.ops\b|pop\b|tip\b|colmn|paises|catmn|tipomn|desp\b)", re.I)
# Lo que no es nuestro: Meta, WhatsApp, la vista previa del teléfono de quien recibe, la hoja del PDF, el visor.
AJENO = re.compile(r"(\.mw\b|\.mw-|\.wa-|\.tel \.pv|\.pv-|\.pdf-a4|\.vz-|\.tv-|\.k-desp|\.bandera)", re.I)
COLOR = re.compile(r"(?:oklch|rgba?|hsla?|color-mix|var)\((?:[^()]|\([^()]*\))*\)|#[0-9a-f]{3,8}\b|\b(?:transparent|currentcolor|white|black)\b", re.I)
NUMERO = re.compile(r"-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)?")


def partes(valor):
    """Las sombras de un valor, separadas por las comas de afuera de los paréntesis."""
    salida, nivel, actual = [], 0, ""
    for ch in valor:
        if ch == "(":
            nivel += 1
        elif ch == ")":
            nivel -= 1
        if ch == "," and nivel == 0:
            salida.append(actual.strip())
            actual = ""
        else:
            actual += ch
    if actual.strip():
        salida.append(actual.strip())
    return salida


def es_sombra(parte):
    """Una sombra desenfocada; no lo son un anillo (`0 0 0 2px`), una línea (`inset 1px 0 0`) ni un corrimiento sin desenfoque."""
    p = parte.strip()
    if not p or p.lower() == "none" or "inset" in p.lower():
        return False
    if p.lower().startswith("var("):
        return True  # `var(--sombra)`, `var(--sombra-dialogo)`…
    numeros = NUMERO.findall(COLOR.sub(" ", p))
    return len(numeros) >= 3 and float(re.match(r"-?(?:\d+\.?\d*|\.\d+)", numeros[2]).group(0)) > 0


def con_root(selector):
    """`:root` delante de cada selector de la lista, para ganarle a la regla de la pieza."""
    salida, nivel, actual = [], 0, ""
    for ch in selector:
        if ch == "(":
            nivel += 1
        elif ch == ")":
            nivel -= 1
        if ch == "," and nivel == 0:
            salida.append(actual.strip())
            actual = ""
        else:
            actual += ch
    salida.append(actual.strip())
    return ", ".join(s if s.startswith((":root", "html")) else ":root " + s for s in salida if s)


def sombras(t):
    """Las reglas que pisan las sombras desenfocadas de un tablero, fuera de lo que flota y de lo ajeno."""
    vistas, salida = set(), []
    for css in ESTILO.findall(BLOQUE.sub("", t)):
        for m in REGLA.finditer(COMENTARIO.sub("", css)):
            selector, cuerpo = re.sub(r"\s+", " ", m.group(1)).strip(), m.group(2)
            selector = re.sub(r"^.*@[a-z-]+[^{]*$", "", selector).strip()
            s = SOMBRA.search(cuerpo)
            if not selector or not s or selector.startswith("@") or "keyframes" in selector:
                continue
            if FLOTA.search(selector.split(" ")[-1]) or AJENO.search(selector) or re.search(r"position:\s*absolute", cuerpo) and re.search(r"top:\s*calc\(100%", cuerpo):
                continue
            todas = partes(s.group(1))
            if not any(es_sombra(p) for p in todas):
                continue
            queda = ", ".join(p for p in todas if not es_sombra(p)) or "none"
            clave = (selector, queda)
            if clave in vistas:
                continue
            vistas.add(clave)
            salida.append(f"{con_root(selector)} {{ box-shadow: {queda} !important; }}")
    return salida


# ---------------------------------------------------------------------------------------------------------------- las líneas
DESPUES = re.compile(r"\.([a-zA-Z][\w-]*)::?after\b")
ULTIMA_CLASE = re.compile(r"\.([a-zA-Z][\w-]*)(?:\[[^\]]*\]|:[\w-]+(?:\([^)]*\))?)*$")
CORRIDO = re.compile(r"justify-content:\s*(center|flex-end|end|right|space-around|space-evenly)|justify-self:\s*(end|right|center|flex-end)"
                     r"|margin-left:\s*auto")


def sin_after(t):
    """Las celdas que no llevan la línea: las que ya dibujan algo con `::after`, para no taparles su dibujo, y las que acomodan su
    contenido al centro o a la derecha con flex, porque ahí la línea quedaría corrida (va donde empezaría su contenido)."""
    clases = set()
    for css in ESTILO.findall(BLOQUE.sub("", t)):
        for m in REGLA.finditer(COMENTARIO.sub("", css)):
            for parte in m.group(1).split(","):
                ultimo = parte.strip().split(" ")[-1]
                d = DESPUES.search(ultimo)
                if d and "content" in m.group(2):
                    clases.add(d.group(1))
                c = ULTIMA_CLASE.search(ultimo)
                if c and CORRIDO.search(m.group(2)) and "::" not in ultimo:
                    clases.add(c.group(1))
    return "".join(f":not(.{c})" for c in sorted(clases))


# ---------------------------------------------------------------------------------------------------------------- los textos
MAS_FILTROS = "Más filtros"
VER_N = re.compile(r'<button type="button" class="[^"]*">Ver [\d.]+ respuestas?</button>')
# La primera carga de un listado de la compu: la caja de la lista mostraba tres barras grises.
ESQ_LISTA = re.compile(r'<div class="f-cuerpo izq"><div class="esq">(?:<span style="width: \d+%;"></span>)+</div></div>')
ENCABEZADO = re.compile(r'<div class="w-th(?: [^"]*)?"(?: [^>]*)?>(?:(?!</?div\b).)*</div>', re.S)
ESQ_TEL = re.compile(r'<div class="ap-cuerpo"><div class="ap-esq">(?:<span style="width: \d+%;"></span>)+</div></div>')
TEL_LISTAS = {"M-FRM-Biblioteca", "M-FRM-Catalogos-14", "M-FRM-Catalogos", "M-FRM-Formularios-15", "M-FRM-Formularios-17",
              "M-FRM-Formularios-20", "M-FRM-Formularios-21", "M-FRM-Formularios-22", "M-FRM-Formularios", "M-FRM-Respuestas-16",
              "M-FRM-Respuestas"}
ARO = '<span class="t10-aro" aria-hidden="true"></span>'
# Lo que dejó una corrida anterior vuelve a las barras de antes, para que este pase lo rehaga con su lógica de hoy: el encabezado
# pegado al aro es siempre una copia de este script, porque antes de él iba la caja de la lista.
PREVIA = re.compile(r'(?:<div class="w-th(?: [^"]*)?"(?: [^>]*)?>(?:(?!</?div\b).)*</div>)?<div class="t10-carga" role="status" '
                    r'aria-label="Cargando">' + re.escape(ARO) + "</div>", re.S)
PREVIA_TEL = f'<div class="ap-cuerpo t10-carga-tel" role="status" aria-label="Cargando">{ARO}</div>'
BARRAS = '<span style="width: 80%;"></span><span style="width: 65%;"></span><span style="width: 72%;"></span>'


def primera_carga(t, nombre, cuenta):
    t = PREVIA.sub(f'<div class="f-cuerpo izq"><div class="esq">{BARRAS}</div></div>', t)
    t = t.replace(PREVIA_TEL, f'<div class="ap-cuerpo"><div class="ap-esq">{BARRAS}</div></div>')
    def lista(m):
        antes = t[:m.start()]
        caja = antes.rfind('class="w-caja')
        encabezados = [e for e in ENCABEZADO.finditer(antes) if e.start() > caja]
        if not encabezados:
            return m.group(0)  # no es la caja de una lista: es una página que espera, con sus tres barras (ES2)
        cuenta["listas"] = cuenta.get("listas", 0) + 1
        carga = f'<div class="t10-carga" role="status" aria-label="Cargando">{ARO}</div>'
        # Si el encabezado quedó adentro de otro estado (se cerró un `sc-if` desde entonces), no se ve mientras carga: va una copia.
        entre = antes[encabezados[-1].end():]
        adentro = entre.count("</sc-if>") > entre.count("<sc-if")
        return (encabezados[-1].group(0) if adentro else "") + carga

    t = ESQ_LISTA.sub(lista, t)
    if nombre in TEL_LISTAS:
        t, n = ESQ_TEL.subn(f'<div class="ap-cuerpo t10-carga-tel" role="status" aria-label="Cargando">{ARO}</div>', t)
        cuenta["teléfonos"] = cuenta.get("teléfonos", 0) + n
    return t


def textos(t, nombre, cuenta):
    if nombre.startswith("Criterio-"):
        return t  # Criterio-Decisiones cuenta lo que se decidió en su momento; los demás Criterio, en reglas_7_11_1004.py
    cuenta["filtros"] = cuenta.get("filtros", 0) + t.count(MAS_FILTROS)
    t = t.replace(MAS_FILTROS, "Filtros")
    t, n = VER_N.subn("", t)
    cuenta["ver n"] = cuenta.get("ver n", 0) + n
    return primera_carga(t, nombre, cuenta)


# ---------------------------------------------------------------------------------------------------------------- la escala (180)
# La de ArquitecturaBase, que el usuario eligió el 2026-11-07 viendo la misma planilla en tres escalas. Para cambiarla, se cambia acá
# y se vuelve a correr: cada px guarda su original.
ESCALA = {
    "letra": 0.82, "letra_min": 10.5,            # font-size
    "alto": 0.74, "alto_de": 18, "alto_a": 72,   # height, min-height, max-height y line-height de 18 a 72 px, y el ancho igual de lo cuadrado
    "espacio": 0.72, "espacio_min": 4,           # padding, margin, gap, row-gap y column-gap de 4 px o más
    "radio": 3,                                  # border-radius de 3 px como mucho; un círculo (50 %) sigue siendo un círculo
}
TELEFONO = 768  # un tablero más angosto es un teléfono: conserva sus medidas táctiles (44 × 44) y la escala no lo toca
# Lo que dibuja un teléfono adentro de un tablero de la compu (la app del teléfono en los Criterio, la vista previa de WhatsApp).
DE_TELEFONO = re.compile(r"(^|[\s,>+~(])\.(ap|tel)\b|\.ap-|\.pv-|\.tel-|\.f-snack|\.t-toast")
PX = re.compile(r"(\d+(?:\.\d+)?)px(?:/\*(\d+(?:\.\d+)?)px\*/)?")
DECLARACION = re.compile(r"([a-z-]+)(\s*:\s*)([^;{}]+)")
ALTOS = {"height", "min-height", "max-height", "line-height"}
ESPACIOS = re.compile(r"^(?:padding|margin)(?:-[a-z-]+)?$|^(?:gap|row-gap|column-gap)$")
SCRIPT = re.compile(r"(<script\b.*?</script>)", re.S)
ESTILO_EN_LINEA = re.compile(r'(\sstyle=")([^"]*)(")')


def numero(n):
    return f"{n:.2f}".rstrip("0").rstrip(".")


def original(m):
    return float(m.group(2) or m.group(1))


def con_regla(valor, regla):
    """Los px de un valor según la regla (del original al nuevo); el original queda al lado. Sin regla, vuelve el original."""
    def uno(m):
        antes = original(m)
        nuevo = regla(antes)
        if nuevo is None or abs(nuevo - antes) < 0.01:
            return f"{numero(antes)}px"
        return f"{numero(nuevo)}px/*{numero(antes)}px*/"
    return PX.sub(uno, valor)


def letra(n):
    return max(ESCALA["letra_min"], round(n * ESCALA["letra"], 1))


def alto(n):
    return round(n * ESCALA["alto"], 1) if ESCALA["alto_de"] <= n <= ESCALA["alto_a"] else None


def espacio(n):
    return round(n * ESCALA["espacio"], 1) if n >= ESCALA["espacio_min"] else None


def radio(n):
    return min(n, ESCALA["radio"])


def escalar_cuerpo(cuerpo):
    """Las declaraciones de una regla (o de un `style=`): letra, altos, espacios, esquinas y el ancho de lo cuadrado."""
    altos = {original(m) for d in DECLARACION.finditer(cuerpo) if d.group(1) in ("height", "min-height") for m in PX.finditer(d.group(3))}

    def declaracion(d):
        prop, sep, valor = d.group(1), d.group(2), d.group(3)
        if prop == "font-size":
            valor = con_regla(valor, letra)
        elif prop in ALTOS:
            valor = con_regla(valor, alto)
        elif prop in ("width", "min-width"):
            valor = con_regla(valor, lambda n: alto(n) if n in altos else None)
        elif ESPACIOS.match(prop):
            valor = con_regla(valor, espacio)
        elif prop == "border-radius":
            valor = con_regla(valor, radio)
        elif prop in ("top", "bottom"):
            # Lo que se apoya en algo que se achicó (la flecha del menú sobre la banda, un menú abierto) baja con los altos.
            valor = con_regla(valor, lambda n: round(n * ESCALA["alto"], 1) if n >= ESCALA["espacio_min"] else None)
        elif prop in ("left", "right"):
            # El ícono adentro de un campo se corre con su relleno; lo que va lejos queda, porque los anchos no cambian.
            valor = con_regla(valor, lambda n: espacio(n) if n <= 48 else None)
        return prop + sep + valor

    return DECLARACION.sub(declaracion, cuerpo)


def escalar(t):
    """La escala en el CSS del tablero y en sus `style=` (afuera de los scripts), salvo en lo que dibuja un teléfono."""
    def bloque_css(m):
        def regla(r):
            # Se salta solo si todos sus selectores son de un teléfono; una lista mezclada es de la compu.
            selectores = [s for s in con_root(r.group(1)).split(", ") if s.strip()]
            if selectores and all(DE_TELEFONO.search(s.removeprefix(":root ")) for s in selectores):
                return r.group(0)
            return r.group(1) + "{" + escalar_cuerpo(r.group(2)) + "}"
        return m.group(1) + REGLA.sub(regla, m.group(2)) + m.group(3)

    partes = SCRIPT.split(t)
    for i in range(0, len(partes), 2):  # las impares son scripts: no se tocan
        p = re.sub(r"(<style\b[^>]*>)(.*?)(</style>)", bloque_css, partes[i], flags=re.S)
        partes[i] = ESTILO_EN_LINEA.sub(lambda m: m.group(1) + escalar_cuerpo(m.group(2)) + m.group(3), p)
    return "".join(partes)


# ---------------------------------------------------------------------------------------------------------------- el pase
def pasar(t, nombre, cuenta, telefono=False):
    t = poner_piezas(t, nombre, cuenta)
    return t if telefono else escalar(t)


def poner_piezas(t, nombre, cuenta):
    t = textos(BLOQUE.sub("", t), nombre, cuenta)
    # Ni lo que se abre adentro de una fila (un menú, un tooltip), que también es su hijo.
    excluir = sin_after(t) + ':not([class*="menu"]):not([class*="-mn"]):not([class*="tip"])'
    # La planilla de la 15 en adelante ya dibuja sus líneas (`.w-th.pl > span:nth-child(n+3)`); la de antes las toma acá.
    pl = ":not(.pl)" if ".w-th.pl > span:nth-child(n+3)" in t else ""
    # Y su columna fija pierde la raya corta que la separaba: la línea entre columnas ya lo hace.
    fija = "" if pl else ":root .w-th.pl > :first-child, :root .w-tr.pl:not(.sel) > :first-child { box-shadow: none !important; }"
    css = PIEZAS.replace("@SIN@", excluir).replace("@TT@", "-6.5px").replace("@PL@", pl).replace("@FIJA@", fija)
    css = css.replace("@CARGA@", numero(8 * 40 * ESCALA["alto"]))  # ocho filas de 40, con la escala de la compu
    propias = sombras(t)
    cuenta["sombras"] = cuenta.get("sombras", 0) + len(propias)
    bloque = (f'<style {MARCA_BLOQUE}>{css}/* 173 · Sin sombras, salvo en menús, desplegables y tooltips: las de este tablero. */\n'
              + "\n".join(propias) + "\n</style>\n")
    assert "</helmet>" in t, nombre
    return t.replace("</helmet>", bloque + "</helmet>", 1)


def es_telefono(nombre, canvas):
    """Por su ancho en el lienzo; un tablero que todavía no está en `canvas.json`, por su nombre (`M-…`)."""
    b = canvas["boards"].get(nombre)
    return b["w"] < TELEFONO if b else nombre.startswith("M-")


def tableros(canvas, argumentos):
    """Todos los vivos, o los de `--tableros A,B` (con o sin `.dc.html`, también uno que todavía no está en `canvas.json`)."""
    if "--tableros" not in argumentos:
        return sorted(n for n, b in canvas["boards"].items() if b.get("page") != "archivo")
    pedidos = argumentos[argumentos.index("--tableros") + 1].split(",")
    lista = [n.strip() if n.strip().endswith(".dc.html") else n.strip() + ".dc.html" for n in pedidos if n.strip()]
    faltan = [n for n in lista if not (PROJ / n).exists()]
    assert not faltan, f"no están en el lienzo: {faltan}"
    archivo = [n for n in lista if canvas["boards"].get(n, {}).get("page") == "archivo"]
    assert not archivo, f"son del Archivo, que no se pasa: {archivo}"
    return lista


if __name__ == "__main__":
    canvas = json.loads((PROJ / "canvas.json").read_text(encoding="utf-8"))
    lista = tableros(canvas, sys.argv[1:])
    cuenta, cambiados = {}, 0
    for nombre in lista:
        ruta = PROJ / nombre
        t = ruta.read_text(encoding="utf-8")
        nuevo = pasar(t, nombre.removesuffix(".dc.html"), cuenta, es_telefono(nombre, canvas))
        if nuevo != t:
            ruta.write_text(nuevo, encoding="utf-8")
            cambiados += 1
    print("ok", len(lista), "tableros,", cambiados, "cambiados;", cuenta)
