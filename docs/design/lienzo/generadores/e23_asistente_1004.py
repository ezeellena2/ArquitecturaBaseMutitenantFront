"""La configuración del asistente de la E23 a la E25 con el traspaso 18, tanda 3B (2026-11-26, grupo J1), redibujada en su lugar
(specs `docs/plans/formularios/23-asistente.md`, «Pantallas» y «Se redibujan con el traspaso 18, tanda 4»; `23-parte-datos-y-contrato.md`,
«Los límites»; `24-varios-asistentes.md` y `25-parte-pantallas-y-verificar.md`):

- **Los casos, en columnas (263)**, en `WA-Asistente` (su estado «Casos»), `WA-Asistente-Casos` y `WA-Asistente-Casos-25`: cada fila
  dice «Cuándo», «Para quién», «Qué hacer» y «Activo» en su columna, con su encabezado, y ya no «Clientes · Responder con…» debajo.
  «De baja» deja de ser una etiqueta al lado del dato (206): es «No» en «Activo», como «Obligatoria» en el editor de un formulario
  (285). Los formularios del bloque y «Cualquier otra cosa» van con las mismas columnas: «Cuándo» es «Cuándo lo ofrece» del
  formulario y «Qué hacer», «Mandar «Pedido de service»», como en el front de ArquitecturaBase; «Abrir» pasa a ser el lápiz de la
  fila, un enlace al formulario (261). ↑ ↓ ✎ 🗑 siguen a la vista (127) y las columnas no ordenan, porque el orden de los casos es
  un dato (264). Lo que tenía la fila de una pregunta con botones (la pregunta y cuántos botones) se ve al abrir el caso. En la E25
  la tabla suma «Entrada» (Texto o audio, Documento), y el bloque fijo «Armar formularios y catálogos», las mismas columnas.
- **Lo que se elige, en la pieza (262):** la bandeja de Probar, de Límites y de Atención; al editar un caso, «Para quién», «Tipo de
  entrada», «Qué hacer» (con la descripción de cada acción, abierta en «Qué hacer: menú») y el formulario; en el perfil, el tono y
  «Cuando no sabe»; en el conocimiento, «Dónde atendés», la atención de cada día y las horas de cada franja; en Límites, «Acciones
  que puede usar», que deja las casillas y va en la pieza múltiple, con «Derivar» marcado y apagado con su motivo («Siempre puede
  derivar.»); en Atención, quién atiende y cuándo vuelve un chat, que dejan los radios. Estados nuevos con la lista abierta:
  «Elegir el tono» (`WA-Asistente`), «Elegir el formulario» (`WA-Asistente-Casos`), «Elegir la bandeja» (`WA-Asistente-Probar`),
  «Acciones que puede usar: la lista», «Volver a ofrecer: la lista» y «El estado de un día: la lista» (`WA-Asistente-Limites`),
  «Quién atiende: la lista» y «Cuándo vuelve: la lista» (`WA-Modo-Atencion`), y «Qué hacer: la lista» (`M-WA-Asistente`).
- **Probar se apaga con el cupo del día agotado (271 y 283):** el estado nuevo «Cupo del día agotado» (`WA-Asistente-Probar`) y
  «Probar: cupo del día agotado» (`M-WA-Asistente`) dicen en el tooltip del botón que fue el cupo y cuándo vuelve, en la zona de la
  organización («Usaste tus 50 consultas de hoy en Grupo Delta. Vuelven el 24/11/2026, a las 00:00, hora de Grupo Delta.», el texto
  de `Asistente-Org-Base2`), distinto del tope del mes. El motivo de lo apagado va en un tooltip arriba del botón (211), también el
  del tope del mes, el de los cambios sin guardar y el de los seis mensajes, que antes iba abajo. La (i) de Probar suma el cupo.
- **Límites (270 y 278):** el tope de ofrecimientos va de 1 a 50 y ningún texto nombra «dos»; el mínimo, el máximo y el máximo de la
  plataforma de cada tope van en su (i), como en `WA-Config-Base2`, y no debajo del número (263); suma «Volver a ofrecer un formulario
  rechazado», con «Nunca» (el de entrada) o «A los N días», que trae al lado los días (7 al elegirlo, de 1 a 365), como en
  ArquitecturaBase. Estados nuevos: «La (i) del tope de ofrecimientos» y «Volver a ofrecer a los 7 días».
- **El conocimiento (263 y 261):** una fecha especial dice la fecha, la atención y el horario en su columna, sin «Abierto · 09:00–
  13:00», y «Editar» y «Quitar» pasan a su ⋮; una pregunta frecuente lleva la respuesta en su columna, no debajo de la pregunta.
- **Atención en el teléfono:** `M-WA-Modo-Atencion` suma la pestaña Atención de la bandeja, con quién atiende y cuándo vuelve en la
  pieza y los minutos con su (i): «Atención de la bandeja» y «Cuándo vuelve: la lista», a pantalla completa.
- **El teléfono, en tarjetas (263):** en `M-WA-Asistente` cada caso, cada formulario del bloque y «Cualquier otra cosa» son una
  tarjeta con cada dato nombrado, sin «Clientes · …» debajo; una fecha especial, también, con su ⋮.
- **Los máximos de la plataforma (278):** en `Plat-Asistente-Config-23` y su teléfono, «Formularios que ofrece por conversación y
  día» dice 50 (antes 3), y los tres máximos llevan su (i) con el mínimo y el máximo.
- **La E24 en la E25 (78):** en `WA-Asistente-Casos-25` el panel de WhatsApp dice «Asistentes», con el enlace a la lista, y el camino
  y el título son los de un asistente de la lista (Inicio / WhatsApp / Asistentes / Delta).
- **Probar, sin «·»:** en lo que haría, «1. Pregunta por envíos…», «El formulario «Pedido de service»» y «Pedido de service, versión 2». Y en el caso «Derivar»,
  que lo que manda sale del perfil va en la (i) de «Manda», no en gris debajo del campo (263).
- **Los altos:** las columnas suman renglones, así que `WA-Asistente-Casos` y `WA-Asistente-Limites` pasan de 1300 a 1400 (el
  `$preview` y el `.w-app`); el título del lienzo y el alto en `canvas.json` los pone quien lanzó el grupo.

Cambia los tableros en su lugar, con el bloque `<style data-t3b="e23-asistente">` antes de `</helmet>`, que lo frena si ya corrió, y
« · para aprobar» en el título. Al final corre `traspaso10_piezas_1004.py --tableros` con los diez, que pone la escala de la compu.
No toca el panel «Gestión de formularios» (ninguno de estos lo muestra) ni `canvas.json`. Para volver a correrlo, primero se
restauran los diez tableros.
"""
import io
import pathlib
import re
import subprocess
import sys

G = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(G))
import base2_comun as b2  # noqa: E402
from e14_editor_1004 import renombrar, s_de, sc_ifs, sumar_estados, una  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
PROJ = G.parent
MARCA = 'data-t3b="e23-asistente"'
SUFIJO = " · para aprobar"
SVG = r"<svg\b[^>]*>(?:(?!</svg>).)*</svg>"  # un solo ícono: nunca cruza su `</svg>`
TABLEROS = ["WA-Asistente", "WA-Asistente-Casos", "WA-Asistente-Probar", "M-WA-Asistente", "WA-Asistente-Limites", "WA-Modo-Atencion",
            "M-WA-Modo-Atencion", "Plat-Asistente-Config-23", "M-Plat-Asistente-Config-23", "WA-Asistente-Casos-25"]

# ---------------------------------------------------------------------------------------------------------------- los datos
PARA_QUIEN = ["Clientes", "Empleados", "Clientes y empleados"]
ENTRADAS = [("Texto o audio", "Un mensaje escrito, o un audio ya pasado a texto."),
            ("Documento", "Una foto, un PDF o un archivo que manda la persona.")]
# Las seis acciones (spec E23, «Seis acciones»), con su descripción, como en el front de ArquitecturaBase.
ACCIONES = [("Mandar un formulario", "El que elijas, prellenado con lo que diga el mensaje."),
            ("Responder con un texto exacto", "Lo escribe el negocio y sale tal cual."),
            ("Responder con el conocimiento", "La IA redacta, solo con lo cargado y con los límites."),
            ("Preguntar con botones", "Hasta 3 botones, como permite WhatsApp."),
            ("Derivar", "Manda el mensaje al derivar y pasa el chat a una persona."),
            ("No responder", "No manda nada.")]
SIEMPRE_DERIVA = "Siempre puede derivar."
TONOS = [("Cercano", "Escribe con vos."), ("Formal", "Escribe con usted.")]
BANDEJAS = [("Clientes", "Como si escribiera un cliente."), ("Internos", "Como si escribiera un empleado.")]
FORMS_CLIENTES = ["Entrega de pedido", "Pedido de repuesto", "Pedido de service", "Reclamo de cliente"]
DIA = [("Sin definir", "El asistente no dice nada de este día."), ("Abierto", "Atiende en las franjas que cargues."),
       ("Cerrado", "No atiende en todo el día."), ("24 horas", "Atiende todo el día.")]
QUIEN = [("El asistente", "Responde con los casos y deriva a una persona cuando hace falta."),
         ("Una persona", "Los atiende el equipo. En Clientes, primero responde el bot del menú.")]
VUELVE = [("Pasado un tiempo sin mensajes", "Vuelve al asistente si nadie escribe en ese tiempo."),
          ("Al marcarlo «Resuelto»", "Vuelve cuando una persona lo marca «Resuelto»."),
          ("Nunca", "Queda con la persona hasta que alguien lo cambie a mano.")]
REOFERTA = [("Nunca", "No se lo vuelve a ofrecer en esa conversación."), ("A los N días", "Se lo vuelve a ofrecer pasado el plazo.")]

CUPO_ORG = "Usaste tus 50 consultas de hoy en Grupo Delta. Vuelven el 24/11/2026, a las 00:00, hora de Grupo Delta."  # 271 y 283
AYUDA_LARGO = ("De 100 a 1000 caracteres, y hasta el máximo de la plataforma (600). Si una respuesta redactada se pasa, no sale: "
               "deriva a una persona.")
AYUDA_RESP = ("De 1 a 50 por conversación y día, y hasta el máximo de la plataforma (30). Aparte del tope de ofrecimientos. Al llegar, "
              "deriva con el motivo «Llegó al tope de respuestas del día».")
AYUDA_OFERTAS = ("De 1 a 50 por conversación y día, y hasta el máximo de la plataforma (50). Cuántas veces por día ofrece un formulario "
                 "por su cuenta en una conversación: una pregunta con botones y el formulario que se elige cuentan como uno. Al llegar, "
                 "el formulario no sale: deriva con el motivo «Llegó al tope de ofrecimientos del día».")
AYUDA_REOFERTA = ("Cuando la persona rechaza un formulario, el asistente no se lo vuelve a ofrecer en esa conversación. Con «A los N "
                  "días», de 1 a 365, puede volver a ofrecérselo pasado ese plazo.")
AYUDA_ACCIONES = "Lo que se apaga no aparece al editar un caso. Derivar va siempre."
AYUDA_MINUTOS = "De 5 a 1440 minutos."
AYUDA_MANDA = "Es el mensaje al derivar, del perfil: se cambia en Perfil."
ERR_LARGO = "Tiene que ser de 100 a 600: 600 es el máximo de la plataforma."
PROBAR_I_VIEJO = "Cuenta en el tope de IA del mes."
PROBAR_I_NUEVO = "Cuenta en el tope de IA del mes y en tu cupo de consultas del día."
PLAT_I = {
    "Largo máximo de la respuesta": "De 100 a 1000 caracteres. Ninguna organización puede pasarlo: si lo bajás, en cada una vale el menor "
                                    "de los dos, sin cambiar lo que guardó.",
    "Respuestas por conversación y día": "De 1 a 50. Ninguna organización puede pasarlo: si lo bajás, en cada una vale el menor de los dos, "
                                         "sin cambiar lo que guardó.",
    "Formularios que ofrece por conversación y día": "De 1 a 50. Ninguna organización puede pasarlo: si lo bajás, en cada una vale el "
                                                     "menor de los dos, sin cambiar lo que guardó.",
}

# ---------------------------------------------------------------------------------------------------------------- estilos
# Medidas de antes de la escala; los anchos de las columnas ya van con la escala de la compu (el número de 19,2 px y cuatro íconos
# de 22,2 px), porque la pasada no toca `grid-template-columns`.
CSS_E23 = """
/* E23 · Los casos en columnas (263): «Cuándo», «Para quién», «Qué hacer» y «Activo», cada uno en su columna, con ↑ ↓ ✎ 🗑 a la vista
   (127); los formularios del bloque y «Cualquier otra cosa», con las mismas columnas. En la E25 suma «Entrada». */
.q-th.e23-c, .q-it.e23-c { display: grid; grid-template-columns: 19.2px minmax(0, 1fr) 70px 100px 40px 88.8px; column-gap: 12px; align-items: center; }
.q-th.e23-c.e25, .q-it.e23-c.e25 { grid-template-columns: 19.2px minmax(0, 1fr) 66px 60px 96px 40px 88.8px; }
/* E23 · Una pregunta frecuente: la pregunta y la respuesta, cada una en su columna (263). */
.q-th.e23-f, .q-it.e23-f { display: grid; grid-template-columns: 19.2px minmax(0, 1fr) minmax(0, 1.3fr) 88.8px; column-gap: 12px; align-items: center; }
.q-th.e23-c, .q-th.e23-f { position: relative; min-height: 40px; padding: 0 8px 0 16px; border-bottom: 1px solid oklch(0.89 0.031 95); background: oklch(0.975 0.006 95); color: var(--t2); font-size: 13px; font-weight: 600; }
.q-th.e23-c > span, .q-th.e23-f > span { min-width: 0; }
.q-th.e23-c .der, .q-th.e23-f .der { text-align: right; }
.q-it.e23-c .e23-v, .q-it.e23-f .e23-v { min-width: 0; color: var(--t1); font-size: 13px; line-height: 1.35; overflow-wrap: anywhere; }
.q-it.e23-c.off .e23-v { color: var(--t3); }
.q-it.e23-c .q-acc2, .q-it.e23-f .q-acc2 { justify-self: stretch; }
.q-it.e23-c .q-acc2 > :first-child, .q-it.e23-f .q-acc2 > :first-child { margin-left: auto; }
.q-acc2 a.ib { display: inline-flex; align-items: center; justify-content: center; color: var(--t2); }
/* 137 · La línea fina entre columnas, en el encabezado y en las filas. */
.e23-c > * + *::after, .e23-f > * + *::after { content: ""; position: absolute; top: 0; bottom: 0; width: 1px; margin-left: -6px; background: oklch(0.915 0.013 95 / 0.8); pointer-events: none; }
.q-th.e23-c > * + *::after, .q-th.e23-f > * + *::after { background: oklch(0.89 0.031 95); }
/* E23 · La pieza para elegir (262): la bandeja de Probar, de Límites y de Atención, y lo que se elige al editar un caso. */
.pr-in .w-cmp .b2-env, .as23-ed .w-cmp .b2-env, .as23-g .w-cmp .b2-env { width: 100%; }
.as23-bandeja .b2-env { width: 220px; }
/* E23 · Probar apagado: el motivo en un tooltip arriba del botón (211). */
.pr-in .acc-apagado { position: relative; align-self: flex-start; display: inline-flex; }
.pr-in .acc-apagado .acc-tip { left: 0; }
/* E23 · El horario, en la pieza (262): la atención de cada día y las horas de cada franja, con las medidas de antes. */
.hz .b2-pkc, .hz-dlg .b2-pkc { height: 32px; padding: 0 10px; font-size: 13.5px; }
.hz-f > .b2-env { width: 92px; flex: none; }
/* E23 · Una fecha especial: la fecha, la atención y el horario, cada uno en su columna (263), y el ⋮ (261). */
.hz-fe.e23-fe { grid-template-columns: 96px 96px minmax(0, 1fr) auto; }
.hz-fe .e23-keb { display: inline-flex; width: 32px; height: 32px; align-items: center; justify-content: center; border: 0; border-radius: 3px; background: transparent; color: var(--t2); }
/* E23 · «Volver a ofrecer» y «Cuándo vuelve»: la pieza y, al lado, el número (como en ArquitecturaBase). */
.e23-reo { display: flex; align-items: center; gap: 8px; }
.e23-reo > .b2-env { flex: 1; min-width: 0; }
.e23-reo .as23-num .ct { width: 72px; }
.e23-reo .as23-num span { display: inline-flex; align-items: center; }
.e23-reo.e23-at > .b2-env { flex: none; width: 260px; }
/* E23 · Una (i) abierta. */
.f-i { position: relative; }
.f-i .acc-tip { left: -12px; }
.w-caja:has(.acc-tip), .w-caja:has(.b2-pkl) { overflow: visible !important; }
"""

CSS_E23_TEL = """
/* E23 · La pieza para elegir (262) en el teléfono, con el radio de los campos de la app; abierta, ocupa la pantalla. */
.ap .b2-pkc { border-radius: 12px; }
.ap-cmp .b2-env { width: 100%; }
/* E23 · El horario: la atención de cada día y las horas, en la pieza, con las medidas de antes. */
.t23-hz .b2-pkc, .ap-hoja .t23-dia .b2-pkc { height: 40px; padding: 0 12px; border-radius: 10px; font-size: 15px; }
.t23-dia .h .b2-env { width: 150px; flex: none; }
.t23-fr > .b2-env { flex: 1; min-width: 0; }
/* E23 · Cada caso, formulario o fecha especial, una tarjeta con cada dato nombrado (263). */
.ap-cuerpo > .b2-tj:last-of-type { border-bottom: 0; }
.ap-cuerpo:has(.acc-tip) { overflow: visible !important; }
/* E23 · Un número con su unidad y su (i). */
.b2-num { display: flex; align-items: center; gap: 8px; }
.b2-num .ct { width: 120px; flex: none; }
.b2-num .u { color: var(--t2); font-size: 16px; }
.ap-cmp .rt .b2-i { margin-left: 6px; }
"""

CSS_PLAT = """
/* E23 · Los máximos del asistente de WhatsApp (278): el de ofrecimientos, 50 de entrada; cada uno con su (i), su mínimo y su máximo. */
.as-g2 .w-cmp .rt .as-i { margin-left: 4px; }
"""


# ---------------------------------------------------------------------------------------------------------------- utilidades
def leer(nombre):
    t = io.open(PROJ / f"{nombre}.dc.html", encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in t else "\n"
    return t.replace("\r\n", "\n"), nl


def escribir(nombre, t, nl):
    io.open(PROJ / f"{nombre}.dc.html", "w", encoding="utf-8", newline="").write(t.replace("\n", nl))
    print("ok", nombre, len(t))


def con_css(t, css, alto=None):
    """El bloque de este grupo y « · para aprobar»; con `alto`, el tablero crece (el `$preview` y el `.w-app`)."""
    assert MARCA not in t
    t = re.sub(r"<title>(.*?)</title>", lambda m: f"<title>{m.group(1).removesuffix(SUFIJO)}{SUFIJO}</title>", t, count=1)
    if alto:
        t, n = re.subn(r'("\$preview":\{"width":1440,"height":)\d+\}', lambda m: f"{m.group(1)}{alto}}}", t)
        assert n == 1, n
        css += f"/* E23 · Las columnas suman renglones: el tablero crece a {alto}. */\n.w-app {{ height: {alto}px !important; }}\n"
    return t.replace("</helmet>", f"<style {MARCA}>\n{css}</style>\n</helmet>", 1)


def cuerpo_de(t):
    """(cabeza, cuerpo, guion): solo se cambia el cuerpo, entre `</helmet>` y el guion."""
    i, j = t.index("</helmet>"), t.index('<script type="text/x-dc"')
    return t[:i], t[i:j], t[j:]


def en_cuerpo(t, f):
    cab, cu, gu = cuerpo_de(t)
    return cab + f(cu) + gu


def copiar(t, despues, desde, nuevo, cambio=lambda b: b):
    """Un estado nuevo `nuevo` (en el Tweak, después de `despues`) con los mismos bloques que `desde`, cada uno pasado por `cambio`;
    cada copia va al lado de su bloque."""
    s_desde = s_de(t, desde)
    t, vs = sumar_estados(t, [(despues, nuevo)])
    v = vs[nuevo]
    for a, b in reversed(sc_ifs(t, s_desde)):
        t = t[:b] + cambio(renombrar(t[a:b], s_desde, v)) + t[b:]
    return t


def svg_de(t, patron):
    m = re.search(patron, t, re.S)
    assert m, patron
    return m.group(1)


def fi(svg, texto, abierto=False):
    """La (i) de las pantallas del asistente; abierta, con su tooltip dibujado."""
    if abierto:
        return (f'<span class="f-i" tabindex="0" role="img" aria-label="{texto}">{svg}'
                f'<span class="acc-tip" role="tooltip">{texto}</span></span>')
    return f'<span class="f-i" tabindex="0" role="img" aria-label="{texto}" title="{texto}">{svg}</span>'


def ops(lista, elegida, multiple=False, apagadas=None, tip_en=None):
    apagadas = apagadas or {}
    elegidas = elegida if multiple else {elegida}
    return [b2.op(n, d, elegida=n in elegidas, multiple=multiple, apagada=apagadas.get(n), tip_abierto=n == tip_en,
                  activa=not multiple and n == elegida) for n, d in lista]


def abierta(valor, aria, lista_html, vacio=False):
    return b2.campo(valor, vacio=vacio, abierto=True, aria=aria, extra=lista_html)


def apagado(boton, motivo):
    """Un botón apagado con su motivo en el tooltip, arriba del control (211)."""
    boton = boton.replace(' aria-disabled="true"', "").replace('<button type="button" class="',
                                                                '<button type="button" aria-disabled="true" class="', 1)
    return f'<span class="acc-apagado">{boton}<span class="acc-tip" role="tooltip">{motivo}</span></span>'


def resumen(nombres, tope=62):
    """Varias, por su nombre (DS2-A): las que entran, separadas por coma, y «y N más»."""
    if len(", ".join(nombres)) <= tope:
        return ", ".join(nombres[:-1]) + " y " + nombres[-1] if len(nombres) > 1 else nombres[0]
    entran = []
    for n in nombres:
        if len(", ".join(entran + [n])) + len(f" y {len(nombres) - len(entran) - 1} más") > tope:
            break
        entran.append(n)
    return ", ".join(entran) + f" y {len(nombres) - len(entran)} más"


# ---------------------------------------------------------------------------------------------------------------- las piezas
def bandeja_seg(cu):
    """La bandeja (de Probar, de Límites o de Atención): el segmentado pasa a la pieza (262)."""
    def cambiar(m):
        return b2.campo("Clientes" if m.group(1) else "Internos", aria="Bandeja")
    cu, n = re.subn(r'<span class="ab-seg"><span class="(on)?">Clientes</span><span class="(?:on)?">Internos</span></span>', cambiar, cu)
    print("  bandejas en la pieza:", n)
    return cu


RT = r'(<span class="rt">([^<]+?)(?:\s*<span class="req">\*</span>)?(?:<span class="f-i"[^>]*>' + SVG + r"</span>)?</span>)"


def selects_compu(cu):
    """Los `ct sel` de un campo con su rótulo, a la pieza cerrada; el que tenía su lista abierta (`rg2-menu`), a la pieza abierta."""
    def menu(m):
        rotulo, valor, aria, opciones = m.group(1), m.group(3), m.group(4), m.group(5)
        nombres = re.findall(r'<span role="option" class="(?:on)?">([^<]*)</span>', opciones)
        desc = dict(ACCIONES + ENTRADAS)
        lista = b2.lista([b2.op(n, desc.get(n), elegida=n == valor, activa=n == valor) for n in nombres])
        return rotulo + abierta(valor, aria, lista)
    cu, n1 = re.subn(RT + r'<div class="ct sel" style="display: flex; justify-content: space-between;">([^<]*)' + SVG
                     + r'</div><div class="rg2-menu" role="listbox" aria-label="([^"]*)"[^>]*>(.*?)</div>', menu, cu, flags=re.S)

    def cerrado(m):
        rotulo, nombre, ph, valor = m.group(1), m.group(2).strip(), m.group(3), m.group(4)
        return rotulo + b2.campo(valor, vacio=bool(ph), aria=nombre)
    cu, n2 = re.subn(RT + r'<div class="ct sel( ph)?" style="display: flex; justify-content: space-between;">([^<]*)' + SVG + r"</div>",
                     cerrado, cu, flags=re.S)
    print("  piezas abiertas:", n1, "· cerradas:", n2)
    return cu


def selects_tel(cu):
    """Los `ct sel` del teléfono, con su rótulo, a la pieza cerrada."""
    def cerrado(m):
        return m.group(1) + b2.campo(m.group(4), vacio=bool(m.group(3)), aria=m.group(2).strip())
    cu, n = re.subn(r'(<span class="rt"><span>([^<]+?)(?:\s*<span class="rq">\*</span>)?</span></span>)<div class="ct sel( ph)?">([^<]*)'
                    + SVG + r"</div>", cerrado, cu, flags=re.S)
    print("  piezas cerradas del teléfono:", n)
    return cu


def probar_motivos(cu):
    """Probar apagado: el motivo en el tooltip arriba del botón (211), en lugar del de abajo."""
    def cambiar(m):
        return apagado(re.sub(r' title="[^"]*"', "", m.group(1)), m.group(2))
    cu, n = re.subn(r'<span class="e-tipw">(<button type="button" class="cb cb-pri" aria-disabled="true" title="[^"]*">Probar</button>)'
                    r'<span class="e-tip" role="tooltip">([^<]*)</span></span>', cambiar, cu)
    print("  motivos de Probar arriba:", n)
    return cu


def probar_sin_punto(cu):
    """Lo que haría, sin datos juntos con «·»."""
    def cambiar(m):
        v = m.group(2)
        v = v.replace(" · versión ", ", versión ").replace(" · sin la ", ", sin la ")
        v = re.sub(r"^Caso (\d+) · ", r"\1. ", v)  # como el número de la fila: «1. Pregunta por envíos…»
        v = re.sub(r"^Formularios · (.*)$", r"El formulario «\1»", v)
        return f"{m.group(1)}<span>{v}</span>"
    return re.sub(r'(<span class="k">(?:Caso|Usó)</span>)<span>([^<]*)</span>', cambiar, cu)


# ---------------------------------------------------------------------------------------------------------------- los casos
def encabezado(e25, faq=False):
    if faq:
        cols = ["#", "Pregunta", "Respuesta"]
        clase = "e23-f"
    else:
        cols = ["#", "Cuándo", "Para quién"] + (["Entrada"] if e25 else []) + ["Qué hacer", "Activo"]
        clase = "e23-c" + (" e25" if e25 else "")
    celdas = "".join(f'<span role="columnheader">{c}</span>' for c in cols)
    return f'<div class="q-th {clase}" role="row">{celdas}<span class="der" role="columnheader">Acciones</span></div>'


def filas_casos(cu, lapiz, e25=False):
    """Cada fila de un caso, de un formulario del bloque, de «Cualquier otra cosa» o de «Armar», en columnas (263)."""
    cuenta = {"casos": 0, "formularios": 0, "armar": 0}
    clase = "e23-c" + (" e25" if e25 else "")
    entradas = [e for e, _ in ENTRADAS]

    def celdas(cuando, para, entrada, que, activo):
        v = [para] + ([entrada] if e25 else []) + [que, activo]
        return f'<span class="dato"><b>{cuando}</b></span>' + "".join(f'<span class="e23-v">{x}</span>' for x in v)

    def caso(m):
        extra, num, nombre, desc, chips, acc = m.groups()
        partes = desc.split(" · ")
        para = partes[0]
        if len(partes) > 1 and partes[1] in entradas:
            entrada, que = partes[1], partes[2]
        else:
            entrada, que = "Texto o audio", partes[1]
        assert que in dict(ACCIONES), desc
        activo = "No" if "De baja" in chips or (extra or "") == " off" else "Sí"
        cuenta["casos"] += 1
        return f'<div class="q-it {clase}{extra or ""}"><span class="num">{num}</span>{celdas(nombre, para, entrada, que, activo)}{acc}</div>'
    cu = re.sub(r'<div class="q-it( off)?"><span class="num">(\d+)</span><span class="dato"><b>([^<]*)</b><span>([^<]*)</span></span>'
                r'<span class="chips">((?:<span class="ab-chip">[^<]*</span>)?)</span>(<span class="q-acc2">(?:(?!</span>).)*</span>)</div>', caso, cu, flags=re.S)

    def formulario(m):
        num, nombre, desc, href = m.groups()
        para, cuando = desc.split(" · ", 1)
        assert para in PARA_QUIEN, desc
        cuenta["formularios"] += 1
        acc = (f'<span class="q-acc2"><a class="ib" href="{href}" aria-label="Editar en el formulario {nombre}">{lapiz}</a></span>')
        return (f'<div class="q-it {clase} fijo"><span class="num">{num}</span>'
                f'{celdas(cuando, para, "Texto o audio", f"Mandar «{nombre}»", "Sí")}{acc}</div>')
    cu = re.sub(r'<div class="q-it fijo"><span class="num">(' + SVG + r')</span><span class="dato"><b>([^<]*)</b><span>([^<]*)</span></span>'
                r'<span class="chips"></span><a class="fin lnk" href="([^"]*)">Abrir</a></div>', formulario, cu, flags=re.S)

    def armar(m):
        num, nombre, desc = m.groups()
        para, que = desc.split(" · ")
        cuenta["armar"] += 1
        return (f'<div class="q-it {clase} fijo"><span class="num">{num}</span>{celdas(nombre, para, "Texto o audio", que, "Sí")}'
                f'<span class="q-acc2"></span></div>')
    cu = re.sub(r'<div class="q-it fijo"><span class="num">(' + SVG + r')</span><span class="dato"><b>([^<]*)</b><span>([^<]*)</span></span>'
                r'<span class="chips"></span><span></span></div>', armar, cu, flags=re.S)

    # Los encabezados, arriba de la primera fila de cada caja.
    cajas = "Casos|Formularios|Cualquier otra cosa|Armar formularios y catálogos"
    cu, n = re.subn(r'(<div class="f-cab"><span class="tt">(?:%s)<(?:(?!</div>).)*?</div>)(?=<div class="q-(?:it|ab)\b)' % cajas,
                    lambda m: m.group(1) + encabezado(e25), cu, flags=re.S)
    print("  filas en columnas:", cuenta, "· encabezados:", n)
    return cu


def filas_faq(cu):
    """Una pregunta frecuente: la pregunta y la respuesta, cada una en su columna (263), con ↑ ↓ ✎ 🗑."""
    def fila(m):
        num, preg, resp, acc = m.groups()
        return f'<div class="q-it e23-f"><span class="num">{num}</span><span class="dato"><b>{preg}</b></span><span class="e23-v">{resp}</span>{acc}</div>'

    def caja(m):
        bloque = re.sub(r'<div class="q-it"><span class="num">(\d+)</span><span class="dato"><b>([^<]*)</b><span>([^<]*)</span></span>'
                        r'<span class="chips"></span>(<span class="q-acc2">(?:(?!</span>).)*</span>)</div>', fila, m.group(0), flags=re.S)
        return re.sub(r'(<div class="f-cab"><span class="tt">Preguntas frecuentes</span>(?:(?!</div>).)*?</div>)',
                      lambda k: k.group(1) + encabezado(False, faq=True), bloque, count=1, flags=re.S)
    cu, n = re.subn(r'<div class="as23-faq">.*?(?=<aside class="w-caja pr-caja")', caja, cu, flags=re.S)
    print("  preguntas frecuentes en columnas:", n)
    return cu


# ---------------------------------------------------------------------------------------------------------------- el conocimiento
def horario_compu(cu):
    """La atención de cada día y las horas de cada franja, en la pieza (262); una fecha especial, en columnas con su ⋮ (263 y 261)."""
    def dia(m):
        nombre, mal, valor = m.groups()
        return f'<span class="dia">{nombre}</span>' + b2.campo(valor, error=bool(mal), aria=f"Atención del {nombre.lower()}")
    cu, n1 = re.subn(r'<span class="dia">([^<]+)</span><div class="ct sel hz-e( mal)?">([^<]*)' + SVG + r"</div>", dia, cu, flags=re.S)
    cu, n1b = re.subn(r'(<span class="rt">Atención</span>)<div class="ct sel hz-e">([^<]*)' + SVG + r"</div>",
                      lambda m: m.group(1) + b2.campo(m.group(2), aria="Atención"), cu, flags=re.S)

    def franja(m):
        m1, desde, m2, hasta = m.groups()
        return (f'<div class="hz-f">{b2.campo(desde, error=bool(m1), aria="Desde")}<span class="a">–</span>'
                f'{b2.campo(hasta, error=bool(m2), aria="Hasta")}')
    cu, n2 = re.subn(r'<div class="hz-f"><div class="ct sel hz-h( mal)?">([^<]*)' + SVG + r'</div><span class="a">–</span>'
                     r'<div class="ct sel hz-h( mal)?">([^<]*)' + SVG + r"</div>", franja, cu, flags=re.S)
    assert 'class="ct sel hz-' not in cu

    def especial(m):
        fecha, atencion, desde, hasta = m.groups()
        return (f'<div class="hz-fe e23-fe"><span class="fe">{fecha}</span><span>{atencion}</span><span>{desde} a {hasta}</span>'
                f'<button type="button" class="e23-keb" aria-label="Acciones del {fecha}">{b2.SVG_KEB}</button></div>')
    cu, n3 = re.subn(r'<div class="hz-fe"><span class="fe">([^<]*)</span><span>([^<·]*) · (\d\d:\d\d)–(\d\d:\d\d)</span><span class="ac">'
                     r'<button type="button" class="cb cb-enl">Editar</button><button type="button" class="ib" aria-label="Quitar el [^"]*">'
                     + SVG + r"</button></span></div>", especial, cu, flags=re.S)
    print("  días:", n1 + n1b, "· franjas:", n2, "· fechas especiales:", n3)
    return cu


def horario_tel(cu):
    def dia(m):
        nombre, valor = m.groups()
        return f'<div class="h"><span>{nombre}</span>' + b2.campo(valor, aria=f"Atención del {nombre.lower()}")
    cu, n1 = re.subn(r'<div class="h"><span>([^<]+)</span><div class="t23-sel">([^<]*)' + SVG + r"</div>", dia, cu, flags=re.S)

    def franja(m):
        desde, hasta = m.groups()
        return f'<div class="t23-fr">{b2.campo(desde, aria="Desde")}<span class="a">–</span>{b2.campo(hasta, aria="Hasta")}'
    cu, n2 = re.subn(r'<div class="t23-fr"><div class="t23-sel">([^<]*)' + SVG + r'</div><span class="a">–</span><div class="t23-sel">([^<]*)'
                     + SVG + r"</div>", franja, cu, flags=re.S)
    assert "t23-sel" not in re.sub(r"<style\b.*?</style>", "", cu, flags=re.S)

    def especial(m):
        fecha, atencion, desde, hasta = m.groups()
        return tarjeta(fecha, [("Atención", atencion), ("Horario", f"{desde} a {hasta}")], f"del {fecha}")
    cu, n3 = re.subn(r'<div class="t23-fe"><span class="fe">([^<]*)</span><span>([^<·]*) · (\d\d:\d\d)–(\d\d:\d\d)</span>'
                     r'<button type="button" class="ap-ib" aria-label="Quitar el [^"]*">' + SVG + r"</button></div>", especial, cu, flags=re.S)
    print("  días:", n1, "· franjas:", n2, "· fechas especiales:", n3)
    return cu


def tarjeta(nombre, datos, acciones=None, href="#"):
    """Una fila del teléfono como tarjeta (263), como `base2_comun.tarjeta`, con el nombre de su ⋮ dicho entero."""
    celdas = "".join(f'<span class="c"><span class="k">{k}</span><span class="v">{v}</span></span>' for k, v in datos)
    keb = f'<button type="button" class="keb" aria-label="Acciones {acciones}">{b2.SVG_KEB}</button>' if acciones else ""
    return (f'<div class="b2-tj"><a class="b2-tj-a" href="{href}"><span class="cu"><span class="nm">{nombre}</span>'
            f'<span class="dl">{celdas}</span></span></a>{keb}</div>')


# ---------------------------------------------------------------------------------------------------------------- los tableros
def comun_compu(cu, lapiz, e25=False):
    cu = filas_casos(cu, lapiz, e25)
    cu = selects_compu(cu)
    cu = bandeja_seg(cu)
    cu = probar_motivos(cu)
    cu = probar_sin_punto(cu)
    return cu.replace(PROBAR_I_VIEJO, PROBAR_I_NUEVO)


def svgs(t):
    """El lápiz de ✎ (si el tablero tiene filas con acciones) y el ícono de la (i)."""
    m = re.search(r'<button type="button" class="ib" aria-label="Editar[^"]*">(' + SVG + r")</button>", t, re.S)
    info = svg_de(t, r'<span class="f-i"[^>]*>(' + SVG + r")</span>")
    return (m.group(1) if m else None), info


def wa_asistente():
    nombre = "WA-Asistente"
    t, nl = leer(nombre)
    lapiz, _ = svgs(t)
    t = con_css(t, b2.css(False) + CSS_E23)
    t = en_cuerpo(t, lambda cu: comun_compu(cu, lapiz))
    cerrado = b2.campo("Cercano", aria="Tono")
    t = copiar(t, "Perfil", "Perfil", "Elegir el tono",
               lambda b: b.replace(cerrado, abierta("Cercano", "Tono", b2.lista(ops(TONOS, "Cercano"))), 1))
    escribir(nombre, t, nl)


def wa_asistente_casos():
    nombre = "WA-Asistente-Casos"
    t, nl = leer(nombre)
    lapiz, info = svgs(t)
    t = con_css(t, b2.css(False) + CSS_E23, alto=1400)

    def cu_casos(cu):
        # «Derivar»: de dónde sale lo que manda va en la (i) del rótulo, no en gris debajo del campo (263).
        cu, n = re.subn(r'<span class="rt">Manda</span>(<div class="ct ro">[^<]*</div>)<span class="dato2">El mensaje al derivar, del perfil</span>',
                        lambda m: f'<span class="rt">Manda{fi(info, AYUDA_MANDA)}</span>{m.group(1)}', cu)
        assert n == 1, n
        return comun_compu(cu, lapiz)
    t = en_cuerpo(t, cu_casos)
    cerrado = b2.campo("Pedido de service", aria="Formulario")
    lista = b2.lista([b2.op(n, elegida=n == "Pedido de service", activa=n == "Pedido de service") for n in FORMS_CLIENTES],
                     buscar="", cantidad=f"{len(FORMS_CLIENTES)} formularios")
    t = copiar(t, "Mandar un formulario", "Mandar un formulario", "Elegir el formulario",
               lambda b: b.replace(cerrado, abierta("Pedido de service", "Formulario", lista), 1))
    escribir(nombre, t, nl)


def wa_asistente_probar():
    nombre = "WA-Asistente-Probar"
    t, nl = leer(nombre)
    lapiz, _ = svgs(t)
    t = con_css(t, b2.css(False) + CSS_E23)

    def cu_probar(cu):
        cu = comun_compu(cu, lapiz)
        # Con cambios sin guardar: el motivo, arriba del botón (211).
        viejo = '<button type="button" class="cb cb-pri" aria-disabled="true" title="Primero guardá los cambios.">Probar</button>'
        return una(cu, viejo, apagado('<button type="button" class="cb cb-pri">Probar</button>', "Primero guardá los cambios: la prueba usa lo guardado."))
    t = en_cuerpo(t, cu_probar)
    t = copiar(t, "Tope de IA agotado", "Tope de IA agotado", "Cupo del día agotado",
               lambda b: b.replace('<span class="acc-tip" role="tooltip">Se agotó el tope de IA del mes.</span>',
                                   f'<span class="acc-tip" role="tooltip">{CUPO_ORG}</span>'))
    cerrado = b2.campo("Clientes", aria="Bandeja")
    t = copiar(t, "Seis mensajes", "¿Hacen envíos a Córdoba?", "Elegir la bandeja",
               lambda b: b.replace(cerrado, abierta("Clientes", "Bandeja", b2.lista(ops(BANDEJAS, "Clientes"))), 1))
    assert CUPO_ORG in t
    escribir(nombre, t, nl)


def limites_topes(cu, info):
    """Los topes: el mínimo, el máximo y el de la plataforma en su (i), no debajo (263 y 270); suma «Volver a ofrecer» (278)."""
    def tope(rotulo, ayuda):
        nonlocal cu
        patron = (r'(<span class="rt">%s <span class="req">\*</span>)(?:<span class="f-i"[^>]*>' % re.escape(rotulo) + SVG
                  + r'</span>)?(</span><div class="as23-num"><div class="ct(?: mal)?">\d+</div><span>[^<]*</span></div>)'
                  r'(?:<span class="dato2">Máximo de la plataforma: \d+</span>)?')
        cu, n = re.subn(patron, lambda m: m.group(1) + fi(info, ayuda) + m.group(2), cu, flags=re.S)
        return n
    n = tope("Largo máximo de la respuesta", AYUDA_LARGO) + tope("Respuestas por conversación y día", AYUDA_RESP)
    n += tope("Formularios que ofrece por conversación y día", AYUDA_OFERTAS)
    cu = cu.replace('<span class="err2" role="alert">Hasta 600, el máximo de la plataforma.</span>',
                    f'<span class="err2" role="alert">{ERR_LARGO}</span>')
    assert "Máximo de la plataforma:" not in cu
    # «Volver a ofrecer un formulario rechazado», después del tope de ofrecimientos.
    reo = (f'<div class="w-cmp e23-reofrecer"><span class="rt">Volver a ofrecer un formulario rechazado{fi(info, AYUDA_REOFERTA)}</span>'
           f'<div class="e23-reo">{b2.campo("Nunca", aria="Volver a ofrecer un formulario rechazado")}</div></div>')
    cu, k = re.subn(r'(<span class="rt">Formularios que ofrece por conversación y día .*?</div></div>)(?=</div></div>)',
                    lambda m: m.group(1) + reo, cu, flags=re.S)
    print("  topes con su (i):", n, "· volver a ofrecer:", k)
    return cu


def limites_acciones(cu, info):
    """«Acciones que puede usar»: las casillas pasan a la pieza múltiple (262), con «Derivar» siempre."""
    def caja(m):
        elegidas = [n for clase, n in re.findall(r'<span class="q-chk"[^>]*><i( class="no")?>(?:' + SVG + r')?</i>([^<]*)</span>',
                                                  m.group(0), re.S) if not clase]
        return (f'<div class="as23-g"><div class="w-cmp ancho">{b2.campo(resumen(elegidas), aria="Acciones que puede usar")}</div></div>')
    cu, n = re.subn(r'<div class="as23-chk">.*?</div>', caja, cu, flags=re.S)
    cu = cu.replace('<span class="tt">Acciones que puede usar</span>', f'<span class="tt">Acciones que puede usar{fi(info, AYUDA_ACCIONES)}</span>')
    print("  acciones en la pieza múltiple:", n)
    return cu


def wa_asistente_limites():
    nombre = "WA-Asistente-Limites"
    t, nl = leer(nombre)
    _, info = svgs(t)
    t = con_css(t, b2.css(False) + CSS_E23, alto=1400)

    def cu_lim(cu):
        cu = limites_topes(cu, info)
        cu = limites_acciones(cu, info)
        cu = horario_compu(cu)
        cu = filas_faq(cu)
        return comun_compu(cu, None)
    t = en_cuerpo(t, cu_lim)

    nombres = [n for n, _ in ACCIONES]
    todas = b2.campo(resumen(nombres), aria="Acciones que puede usar")
    lista_acc = b2.lista(ops(ACCIONES, set(nombres), multiple=True, apagadas={"Derivar": SIEMPRE_DERIVA}, tip_en="Derivar"), multiple=True)
    t = copiar(t, "Sobre el máximo", "Límites: Clientes", "Acciones que puede usar: la lista",
               lambda b: b.replace(todas, abierta(resumen(nombres), "Acciones que puede usar", lista_acc), 1))
    nunca = b2.campo("Nunca", aria="Volver a ofrecer un formulario rechazado")
    t = copiar(t, "Acciones que puede usar: la lista", "Límites: Clientes", "Volver a ofrecer: la lista",
               lambda b: b.replace(nunca, abierta("Nunca", "Volver a ofrecer un formulario rechazado", b2.lista(ops(REOFERTA, "Nunca"))), 1))

    def a_los_7(b):
        b = b.replace(' disabled>Descartar</button>', '>Descartar</button>').replace(' disabled>Guardar cambios</button>', '>Guardar cambios</button>')
        dias = '<div class="as23-num"><div class="ct">7</div><span>días</span></div>'
        return b.replace(nunca, b2.campo("A los N días", aria="Volver a ofrecer un formulario rechazado") + dias, 1)
    t = copiar(t, "Volver a ofrecer: la lista", "Límites: Clientes", "Volver a ofrecer a los 7 días", a_los_7)
    t = copiar(t, "Volver a ofrecer a los 7 días", "Límites: Clientes", "La (i) del tope de ofrecimientos",
               lambda b: b.replace(fi(info, AYUDA_OFERTAS), fi(info, AYUDA_OFERTAS, abierto=True), 1))
    lunes = b2.campo("Abierto", aria="Atención del lunes")
    t = copiar(t, "Conocimiento", "Conocimiento", "El estado de un día: la lista",
               lambda b: b.replace(lunes, abierta("Abierto", "Atención del lunes", b2.lista(ops(DIA, "Abierto"))), 1))
    escribir(nombre, t, nl)


def atencion_compu(cu):
    """Quién atiende y cuándo vuelve un chat: los radios pasan a la pieza (262); «Pasado un tiempo» trae al lado los minutos."""
    def quien(m):
        elegida = re.search(r'<span class="op on"[^>]*><span class="rd"></span>([^<]*)</span>', m.group(0)).group(1)
        return f'<div class="as23-g"><div class="w-cmp">{b2.campo(elegida, aria="Quién atiende los chats nuevos")}</div></div>'
    cu, n1 = re.subn(r'<div class="r23" role="radiogroup"><span class="op[^"]*"[^>]*><span class="rd"></span>El asistente</span>'
                     r'<span class="op[^"]*"[^>]*><span class="rd"></span>Una persona</span></div>', quien, cu)

    def vuelve(m):
        texto = m.group(0)
        if '<span class="op on" role="radio" aria-checked="true"><span class="rd"></span>Pasado un tiempo' in texto:
            elegida, extra = VUELVE[0][0], minutos()
        elif 'aria-checked="true"><span class="rd"></span>Al marcarlo' in texto:
            elegida, extra = VUELVE[1][0], ""
        else:
            elegida, extra = VUELVE[2][0], ""
        return (f'<div class="as23-g"><div class="w-cmp ancho"><div class="e23-reo e23-at">'
                f'{b2.campo(elegida, aria="Cuándo vuelve un chat al asistente")}{extra}</div></div></div>')
    cu, n2 = re.subn(r'<div class="r23" role="radiogroup"><span class="op[^"]*"[^>]*><span class="rd"></span>Pasado un tiempo: '
                     r'<div class="ct">30</div><span class="ad">minutos sin mensajes</span></span>.*?Nunca</span></div>', vuelve, cu, flags=re.S)
    assert 'role="radio"' not in cu
    print("  quién atiende:", n1, "· cuándo vuelve:", n2)
    return cu


INFO_ATENCION = None


def minutos():
    return f'<div class="as23-num"><div class="ct">30</div><span>minutos{fi(INFO_ATENCION, AYUDA_MINUTOS)}</span></div>'


def wa_modo_atencion():
    global INFO_ATENCION
    nombre = "WA-Modo-Atencion"
    t, nl = leer(nombre)
    _, INFO_ATENCION = svgs(t)
    t = con_css(t, b2.css(False) + CSS_E23)
    t = en_cuerpo(t, lambda cu: comun_compu(atencion_compu(cu), None))
    quien = b2.campo("El asistente", aria="Quién atiende los chats nuevos")
    t = copiar(t, "Guardado", "Clientes", "Quién atiende: la lista",
               lambda b: b.replace(quien, abierta("El asistente", "Quién atiende los chats nuevos", b2.lista(ops(QUIEN, "El asistente"))), 1))
    vuelve = b2.campo(VUELVE[0][0], aria="Cuándo vuelve un chat al asistente")
    t = copiar(t, "Quién atiende: la lista", "Clientes", "Cuándo vuelve: la lista",
               lambda b: b.replace(vuelve, abierta(VUELVE[0][0], "Cuándo vuelve un chat al asistente", b2.lista(ops(VUELVE, VUELVE[0][0]))), 1))
    escribir(nombre, t, nl)


def wa_asistente_casos_25():
    nombre = "WA-Asistente-Casos-25"
    t, nl = leer(nombre)
    lapiz, _ = svgs(t)
    t = con_css(t, b2.css(False) + CSS_E23)

    def cu25(cu):
        # Desde la E24 el panel dice «Asistentes» y los casos son los de un asistente de la lista (78).
        cu = re.sub(r'<a class="w-ln on" href="WA-Asistente.dc.html">(' + SVG + r') Asistente</a>',
                    lambda m: f'<a class="w-ln on" href="WA-Asistentes.dc.html">{m.group(1)} Asistentes</a>', cu, count=1, flags=re.S)
        cu = una(cu, "<span>Inicio / WhatsApp / Asistente</span>", "<span>Inicio / WhatsApp / Asistentes / Delta</span>")
        cu = cu.replace("<h1>Asistente</h1>", "<h1>Delta</h1>")
        # «Cualquier otra cosa» va después del caso 6: es la séptima.
        cu = cu.replace('<span class="num">6</span><span class="dato"><b>Cualquier otra cosa</b>', '<span class="num">7</span><span class="dato"><b>Cualquier otra cosa</b>')
        return comun_compu(cu, lapiz, e25=True)
    t = en_cuerpo(t, cu25)
    assert "Asistentes / Delta" in t and ">Asistente</a>" not in t
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- los teléfonos
def tarjetas_m_asistente(cu):
    """Cada caso, cada formulario del bloque y «Cualquier otra cosa», una tarjeta con cada dato nombrado (263)."""
    def caso(m):
        num, nombre, desc = m.groups()
        partes = desc.split(" · ")
        para, que = partes[0], partes[1]
        activo = "No" if "De baja" in partes[2:] else "Sí"
        return tarjeta(f"{num}. {nombre}", [("Para quién", para), ("Qué hacer", que), ("Activo", activo)], f"del caso {num}")
    cu, n1 = re.subn(r'<div class="ap-fila"><div class="tx"><span class="l1">(\d+)\. ([^<]*)</span><span class="l2">([^<]*)</span></div>'
                     r'<button type="button" class="ap-ib" aria-label="Acciones del caso \d+">' + SVG + r"</button></div>", caso, cu, flags=re.S)

    def otra(m):
        que, para = m.groups()
        return tarjeta("Cualquier otra cosa", [("Para quién", para), ("Qué hacer", que)])
    cu, n3 = re.subn(r'(?<=<div class="t23-gtit">Cualquier otra cosa</div>)<div class="ap-fila"><div class="tx"><span class="l1">([^<]*)</span>'
                     r'<span class="l2">([^<]*)</span></div></div>', otra, cu)

    def formulario(m):
        nombre, desc = m.groups()
        para, cuando = desc.split(" · ", 1)
        return tarjeta(cuando, [("Para quién", para), ("Qué hacer", f"Mandar «{nombre}»")])
    cu, n2 = re.subn(r'<div class="ap-fila"><div class="tx"><span class="l1">([^<]*)</span><span class="l2">((?:Clientes|Empleados)[^<]*)</span>'
                     r'</div></div>', formulario, cu)
    assert 'class="ap-fila"' not in cu
    print("  tarjetas: casos", n1, "· formularios", n2, "· cualquier otra cosa", n3)
    return cu


def m_wa_asistente():
    nombre = "M-WA-Asistente"
    t, nl = leer(nombre)
    t = con_css(t, b2.css(True) + CSS_E23_TEL)

    def cu_tel(cu):
        cu = tarjetas_m_asistente(cu)
        cu = horario_tel(cu)
        cu = selects_tel(cu)
        return probar_sin_punto(cu)
    t = en_cuerpo(t, cu_tel)
    pieza = b2.pk_tel("Qué hacer", [(n, d, n == "Responder con el conocimiento", None) for n, d in ACCIONES])
    t = copiar(t, "Editar un caso", "Editar un caso", "Qué hacer: la lista",
               lambda b: b[:b.rindex("</sc-if>")] + pieza + "</sc-if>")
    boton = '<button type="button" class="cb cb-pri full">Probar</button>'
    fijo = f'<div class="ap-fijo">{boton}</div>'
    t = copiar(t, "Probar: lo que haría", "Probar", "Probar: cupo del día agotado",
               lambda b: b.replace(fijo, f'<div class="ap-fijo">{apagado(boton, CUPO_ORG)}</div>', 1))
    assert CUPO_ORG in t
    escribir(nombre, t, nl)


def m_wa_modo_atencion():
    """La pestaña Atención en el teléfono, con quién atiende y cuándo vuelve en la pieza (262): dos estados nuevos; el chat de
    siempre queda en los demás."""
    nombre = "M-WA-Modo-Atencion"
    t, nl = leer(nombre)
    asis, _ = leer("M-WA-Asistente")
    # Las pestañas del asistente, de `M-WA-Asistente`.
    t23 = "\n".join(re.findall(r"[^{}]*\.t23-(?:tabs|hb)\b[^{}]*\{[^}]*\}", asis[:asis.index("</helmet>")]))
    t = con_css(t, b2.css(True) + CSS_E23_TEL + "/* E23 · Las pestañas del asistente, como en `M-WA-Asistente`. */\n" + t23.strip() + "\n")
    barra = re.search(r'<div class="ap-bar int"><a class="ap-ib" aria-label="Volver" href="M-WA-Menu.dc.html">' + SVG
                      + r'</a><div class="tit"><h1>Asistente</h1><span class="sub">WhatsApp</span></div>', asis, re.S).group(0) + "</div>"
    pestanas = ('<div class="t23-tabs" role="tablist">' + "".join(
        f'<span class="{"on" if p == "Atención" else ""}" role="tab">{p}</span>' for p in ("Perfil", "Conocimiento", "Casos", "Límites", "Atención"))
        + "</div>")
    t, vs = sumar_estados(t, [("Resuelta", "Atención de la bandeja"), ("Atención de la bandeja", "Cuándo vuelve: la lista")])
    pantalla = (barra + pestanas + '<div class="ap-cuerpo"><div class="t23-hb">'
                f'<div class="ap-cmp"><span class="rt"><span>Bandeja</span></span>{b2.campo("Clientes", aria="Bandeja")}</div>'
                f'<div class="ap-cmp"><span class="rt"><span>Quién atiende los chats nuevos</span></span>'
                f'{b2.campo("El asistente", aria="Quién atiende los chats nuevos")}</div>'
                f'<div class="ap-cmp"><span class="rt"><span>Cuándo vuelve un chat al asistente</span></span>'
                f'{b2.campo(VUELVE[0][0], aria="Cuándo vuelve un chat al asistente")}</div>'
                f'<div class="ap-cmp"><span class="rt"><span>Minutos sin mensajes{b2.info(AYUDA_MINUTOS)}</span></span>'
                '<div class="b2-num"><div class="ct">30</div><span class="u">minutos</span></div></div>'
                '</div></div><div class="ap-fijo"><button type="button" class="cb cb-pri full" disabled>Guardar cambios</button></div>')
    pieza = b2.pk_tel("Cuándo vuelve un chat al asistente", [(n, d, n == VUELVE[0][0], None) for n, d in VUELVE])
    nuevos = (f'<sc-if value="{{{{{vs["Atención de la bandeja"]}}}}}" hint-placeholder-val="{{{{no}}}}">{pantalla}</sc-if>'
              f'<sc-if value="{{{{{vs["Cuándo vuelve: la lista"]}}}}}" hint-placeholder-val="{{{{no}}}}">{pantalla}{pieza}</sc-if>')
    # El chat de siempre (la barra, los mensajes, lo de abajo y la hoja del ⋮) queda en los demás estados.
    i = t.index('<div class="ap-cbar">')
    j = t.rindex('<span class="ap-raya"></span></div>')
    t = t[:i] + '<sc-if value="{{enChat}}" hint-placeholder-val="{{si}}">' + t[i:j] + "</sc-if>" + nuevos + t[j:]
    t = una(t, "      si: true, no: false, fijada: e === 'Fijada',\n",
            "      si: true, no: false, fijada: e === 'Fijada',\n"
            "      enChat: ![\"Atención de la bandeja\", \"Cuándo vuelve: la lista\"].includes(e),\n")
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- Plataforma
def plat(nombre, tel):
    t, nl = leer(nombre)
    i_svg = svg_de(t, r'<span class="as-i"[^>]*>(' + SVG + r")</span>")
    t = con_css(t, CSS_PLAT)

    def as_i(texto):
        return f'<span class="as-i" tabindex="0" role="img" aria-label="{texto}" title="{texto}">{i_svg}</span>'

    def cu_plat(cu):
        for rotulo, ayuda in PLAT_I.items():
            if tel:
                viejo = f'<span class="rt"><span>{rotulo} <span class="rq">*</span></span></span>'
                nuevo = f'<span class="rt"><span>{rotulo} <span class="rq">*</span>{as_i(ayuda)}</span></span>'
            else:
                viejo = f'<span class="rt">{rotulo} <span class="req">*</span></span>'
                nuevo = f'<span class="rt">{rotulo} <span class="req">*</span>{as_i(ayuda)}</span>'
            cu = una(cu, viejo, nuevo)
        if tel:
            return una(cu, '<div class="ct">3 ofrecimientos</div>', '<div class="ct">50 ofrecimientos</div>')
        return una(cu, '<div class="ct as-din"><span>3</span><span class="as-pre" style="margin-left: auto;">ofrecimientos</span></div>',
                   '<div class="ct as-din"><span>50</span><span class="as-pre" style="margin-left: auto;">ofrecimientos</span></div>')
    t = en_cuerpo(t, cu_plat)
    escribir(nombre, t, nl)


# ---------------------------------------------------------------------------------------------------------------- todo
if __name__ == "__main__":
    ya = [n for n in TABLEROS if MARCA in leer(n)[0]]
    if ya:
        print("ya corrió (tienen el bloque):", ", ".join(ya), "· restauralos antes de volver a correrlo")
        sys.exit(0)
    print("WA-Asistente"); wa_asistente()
    print("WA-Asistente-Casos"); wa_asistente_casos()
    print("WA-Asistente-Probar"); wa_asistente_probar()
    print("WA-Asistente-Limites"); wa_asistente_limites()
    print("WA-Modo-Atencion"); wa_modo_atencion()
    print("WA-Asistente-Casos-25"); wa_asistente_casos_25()
    print("M-WA-Modo-Atencion"); m_wa_modo_atencion()
    print("M-WA-Asistente"); m_wa_asistente()
    print("Plataforma"); plat("Plat-Asistente-Config-23", False); plat("M-Plat-Asistente-Config-23", True)
    subprocess.run([sys.executable, str(G / "traspaso10_piezas_1004.py"), "--tableros", ",".join(TABLEROS)], check=True)
