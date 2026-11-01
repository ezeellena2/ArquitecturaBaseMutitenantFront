"""Bloque 0 · Plataforma (el plan de diseño del 27/10): los tableros cerrados de Plataforma pasan a las reglas del 25/10, copiando
la maqueta (3b9c967, 8ba7f7f, 43dee56, 499b799 y 8b2ebca, por la Guía).

- Un dato por celda, en un renglón, y la columna ordenada con ▲:
  - Organizaciones: Organización, Alta, Dueño (o su correo, si no tiene nombre), Empresas, Miembros y Estado; el origen queda en
    su filtro;
  - Cuentas: Cuenta, Correo o teléfono, Perfiles, Último ingreso y Estado; el método del último ingreso sale;
  - Recuperaciones: Cuenta, Fecha y hora, Método de antes, Método nuevo y Estado;
  - en la ficha de una organización, Dueños con su Correo y Módulos con su Detalle;
  - «Para resolver» del Inicio: una línea por pendiente.
- Las listas cortas en un renglón: los métodos de ingreso y los permisos de una cuenta, y los documentos legales.
- Sin carteles en el cuerpo: «Suspendida», «Cerrada», «Necesita recuperación» y «Por borrar» son el estado y van en la banda (el
  motivo y las fechas, en el Historial; la baja pedida suma «Se borra el …» en la banda); el editor de un documento legal sin
  el aviso de arriba (lo dice la confirmación de publicar); en «Revisar el pedido», el texto va como el del diálogo, sin caja.
- Fechas completas: el último ingreso con su fecha y hora, y en el teléfono, la fecha con el año.
- «Suspender, cerrar sesiones y borrar.», como la maqueta.
El teléfono sigue con el nombre y una línea de datos. Se puede volver a correr.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROJ = pathlib.Path(__file__).resolve().parent.parent
MARCA = 'data-b0="plat"'
CSS = """<style data-b0="plat">
.tt-h .ord { margin-left: 4px; font-size: 10px; color: var(--t2); }
.tt-f > .c2b { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--t2); }
.o-fila .dos { flex-direction: row; align-items: center; gap: 16px; }
.o-fila .dos > .c1 { flex: 1 1 auto; min-width: 120px; }
.o-fila .dos > .n2 { flex: 0 1 auto; font-size: 13px; color: var(--t2); text-align: right; }
.rev-tx { margin: 0; font-size: 13.5px; color: var(--t2); line-height: 1.55; }
</style>
"""
# El último ingreso, con su fecha y hora (las relativas, contadas desde el 27/09/2026 10:45 de los tableros)
ULTIMO = {"hace 55 minutos": "27/09/2026 09:50", "ayer": "26/09/2026 18:20", "18/09/2026": "18/09/2026 11:20", "hace 8 horas": "27/09/2026 02:45",
          "hace 9 horas": "27/09/2026 01:45", "19/09/2026": "19/09/2026 08:40", "27/09/2026": "27/09/2026 08:15", "12/08/2026": "12/08/2026 16:05",
          "hace 40 minutos": "27/09/2026 10:05", "hace 5 días": "22/09/2026 15:30"}
TEL_ULTIMO = {"hace 55 min": "27/09/2026 09:50", "ayer": "26/09/2026 18:20", "18/09": "18/09/2026 11:20", "hace 8 h": "27/09/2026 02:45",
              "19/09": "19/09/2026 08:40", "27/09": "27/09/2026 08:15", "hace 40 min": "27/09/2026 10:05"}
AVISO = re.compile(r'<sc-if value="\{\{(?:suspendida|bajaPedida|recuperacion|hayBanner)\}\}" hint-placeholder-val="\{\{no\}\}">\s*'
                   r'<div class="aviso-linea[^"]*" role="status">.*?</div>\s*</sc-if>\s*', re.S)
PERMISO_VIEJO = ("Suspender, cerrar sesiones y dar de baja.", "Suspender, cerrar sesiones y borrar.")


def ord_(texto):
    return f'<span aria-sort="ascending">{texto}<span class="ord" aria-hidden="true">▲</span></span>'


def leer(n):
    return (PROJ / f"{n}.dc.html").read_text(encoding="utf-8")


def cambiar(t, reps, n):
    for a, b in reps:
        assert a in t, (n, a[:110])
        t = t.replace(a, b)
    return t


def con_css(t):
    return t if MARCA in t else t.replace("</helmet>", CSS + "</helmet>", 1)


def ultimos(t):
    return re.sub(r"ultimo: '([^']*)'", lambda m: f"ultimo: '{ULTIMO.get(m.group(1), m.group(1))}'", t)


G_O0, G_O = "minmax(0, 1.5fr) minmax(0, 1.6fr) 90px 90px 180px 28px", "minmax(0, 1.4fr) 120px minmax(0, 1.4fr) 90px 90px 180px 28px"
ORGANIZACIONES = [
    (f'<div class="tt-h" style="grid-template-columns: {G_O0};"><span>Organización</span><span>Dueño</span>',
     f'<div class="tt-h" style="grid-template-columns: {G_O};">{ord_("Organización")}<span>Alta</span><span>Dueño</span>'),
    (f'<div class="tt-f {{{{o.clase}}}} o-alto" style="grid-template-columns: {G_O0};">', f'<div class="tt-f {{{{o.clase}}}}" style="grid-template-columns: {G_O};">'),
    ('<span class="dos"><a class="c1" href="Organizacion.dc.html">{{o.n}}</a><span class="n2">Alta {{o.alta}} · {{o.origen}}</span></span>'
     '<span class="dos"><span>{{o.admin}}</span><span class="n2">{{o.email}}</span></span>',
     '<a class="c1" href="Organizacion.dc.html">{{o.n}}</a><span class="c1 n">{{o.alta}}</span><span class="c1">{{o.dueno}}</span>'),
    ("empresasN: String(o.empresas),", "empresasN: String(o.empresas),\n          dueno: o.admin !== '—' ? o.admin : o.email,"),
]
G_C0, G_C = "minmax(0, 1.8fr) minmax(0, 1.5fr) minmax(0, 1.2fr) 190px 28px", "minmax(0, 1fr) minmax(0, 1.1fr) 190px 140px 175px 28px"
CUENTAS = [
    (f'<div class="tt-h" style="grid-template-columns: {G_C0};"><span>Cuenta</span><span>Perfiles</span>',
     f'<div class="tt-h" style="grid-template-columns: {G_C};">{ord_("Cuenta")}<span>Correo o teléfono</span><span>Perfiles</span>'),
    (f'<div class="tt-f {{{{c.clase}}}} o-alto" style="grid-template-columns: {G_C0};">', f'<div class="tt-f {{{{c.clase}}}}" style="grid-template-columns: {G_C};">'),
    ('<span class="dos"><a class="c1 {{c.claseNombre}}" href="Cuenta-Plat.dc.html">{{c.nombre}}</a><span class="n2">{{c.email2}}</span></span>',
     '<a class="c1 {{c.claseNombre}}" href="Cuenta-Plat.dc.html">{{c.nombre}}</a><span class="c2b">{{c.contacto}}</span>'),
    ('<span class="dos"><span>{{c.ultimo}}</span><span class="n2">{{c.metodo}}</span></span>', '<span class="c1 n">{{c.ultimo}}</span>'),
    ("email2: c.n ? (c.email || '') : '',", "email2: c.n ? (c.email || '') : '',\n          contacto: c.email || c.tel || '—',"),
]
G_R0, G_R = "minmax(0, 1.3fr) minmax(0, 1.5fr) minmax(0, 1.5fr) 140px 28px", "minmax(0, 1.2fr) 150px minmax(0, 1.4fr) minmax(0, 1.4fr) 140px 28px"
TEXTO_SIN_CUENTA = "No hay ninguna cuenta con el método de antes. Solo se puede rechazar."
TEXTO_APROBAR = "Si lo aprobás, el método nuevo pasa a ser el principal de la cuenta y le avisamos a la persona."
RECUPERACIONES = [
    (f'<div class="tt-h" style="grid-template-columns: {G_R0};"><span>Cuenta</span><span>Método de antes</span>',
     f'<div class="tt-h" style="grid-template-columns: {G_R};"><span>Cuenta</span><span>Fecha y hora</span><span>Método de antes</span>'),
    (f'<div class="tt-f o-alto" style="grid-template-columns: {G_R0};">', f'<div class="tt-f" style="grid-template-columns: {G_R};">'),
    ('<span class="dos"><sc-if value="{{r.hayCuenta}}"', '<span style="min-width: 0;"><sc-if value="{{r.hayCuenta}}"'),
    ('Sin cuenta</span></sc-if><span class="n2">{{r.fecha}}</span></span>', 'Sin cuenta</span></sc-if></span><span class="c1 n">{{r.fecha}}</span>'),
]
G_D0, G_D = "minmax(0, 2fr) minmax(0, 1.2fr) 160px", "minmax(0, 1.2fr) minmax(0, 1.6fr) minmax(0, 1.2fr) 160px"
G_M0, G_M = "minmax(0, 2fr) minmax(0, 1.4fr) minmax(0, 1fr) 28px", "minmax(0, 1.3fr) minmax(0, 1.6fr) minmax(0, 1.2fr) minmax(0, 1fr) 28px"
ORGANIZACION = [
    (f'<div class="tt-h" style="grid-template-columns: {G_D0};"><span>Dueño</span><span>Último ingreso</span>',
     f'<div class="tt-h" style="grid-template-columns: {G_D};"><span>Dueño</span><span>Correo</span><span>Último ingreso</span>'),
    (f'<div class="tt-f o-alto" style="grid-template-columns: {G_D0};">', f'<div class="tt-f" style="grid-template-columns: {G_D};">'),
    ('<span class="dos"><span class="c1">{{duenoNombre}}</span><span class="n2">lucia.fernandez@delta.ejemplo.com</span></span>',
     '<span class="c1">{{duenoNombre}}</span><span class="c2b">lucia.fernandez@delta.ejemplo.com</span>'),
    (f'<div class="tt-h" style="grid-template-columns: {G_M0};"><span>Módulo</span><span>Estado</span>',
     f'<div class="tt-h" style="grid-template-columns: {G_M};"><span>Módulo</span><span>Detalle</span><span>Estado</span>'),
    (f'<div class="tt-f" style="grid-template-columns: {G_M0};">', f'<div class="tt-f" style="grid-template-columns: {G_M};">'),
    ('<span class="dos"><span class="c1">{{m.n}}</span><sc-if value="{{m.conClave}}" hint-placeholder-val="{{no}}"><span class="n2">{{m.textoClave}}</span></sc-if></span>',
     '<span class="c1">{{m.n}}</span><span class="c2b">{{m.detalle}}</span>'),
    ("textoClave: m.clave ? 'Puede usar su clave' : 'Con la clave de la plataforma',",
     "textoClave: m.clave ? 'Puede usar su clave' : 'Con la clave de la plataforma',\n          detalle: m.id === 'b' ? (m.clave ? 'Puede usar su clave' : 'Con la clave de la plataforma') : '—',"),
    ("'hace 3 días' : 'hace 55 minutos'", "'24/09/2026 14:20' : '27/09/2026 09:50'"),
]
PARA_RESOLVER = re.compile(r'(<span style="min-width: 0;") class="dos">(<span class="c1">[^<]*</span>)<span class=n2>[^<]*</span>')
FECHA_TEL = re.compile(r"(<span>)(\d{2}/\d{2})( \d{2}:\d{2}</span>)")


def plataforma():
    hechos = []
    for n, reps, extra in (("Organizaciones", ORGANIZACIONES, None), ("Cuentas", CUENTAS, ultimos), ("Recuperaciones", RECUPERACIONES, None),
                           ("Organizacion", ORGANIZACION, None)):
        t = leer(n)
        if MARCA in t:
            continue
        t = cambiar(t, reps, n)
        t = extra(t) if extra else t
        hechos.append((n, con_css(AVISO.sub("", t).replace(*PERMISO_VIEJO))))
    for n, t in hechos:
        if n == "Recuperaciones":
            for texto in (TEXTO_SIN_CUENTA, TEXTO_APROBAR):
                t, k = re.subn(r'<div class="aviso-linea (?:alerta|info)"><svg[^>]*>(?:(?!</svg>).)*</svg><span>' + re.escape(texto) + "</span></div>",
                               f'<p class="rev-tx">{texto}</p>', t, flags=re.S)
                assert k == 1, (n, texto)
        (PROJ / f"{n}.dc.html").write_text(t, encoding="utf-8")
    # La ficha de una cuenta y Documentos legales: sin carteles, las listas cortas en un renglón y la fecha completa
    t = leer("Cuenta-Plat")
    if MARCA not in t:
        t = AVISO.sub("", ultimos(t)).replace(*PERMISO_VIEJO).replace("último ingreso hace 5 días", "último ingreso 22/09/2026 15:30")
        t = cambiar(t, [("(s.estado === 'eliminada' ? ' · Borrada el ' + c.eliminadaEl : ' · Último ingreso ' + c.ultimo)",
                         "(s.estado === 'eliminada' ? ' · Borrada el ' + c.eliminadaEl : s.estado === 'baja' ? ' · Se borra el ' + s.seElimina : ' · Último ingreso ' + c.ultimo)")], "Cuenta-Plat")
        (PROJ / "Cuenta-Plat.dc.html").write_text(con_css(t), encoding="utf-8")
        hechos.append(("Cuenta-Plat", ""))
    t = leer("Legales")
    if MARCA not in t:
        t, k = re.subn(r'\s*<div class="aviso-linea alerta"><svg[^>]*>.*?</svg><span>Al publicarla, [^<]*</span></div>', "", t, flags=re.S)
        assert k == 1
        (PROJ / "Legales.dc.html").write_text(con_css(t), encoding="utf-8")
        hechos.append(("Legales", ""))
    t = leer("Asistente-Plat")
    nuevo = PARA_RESOLVER.sub(r"\1>\2", t)
    if nuevo != t:
        (PROJ / "Asistente-Plat.dc.html").write_text(nuevo, encoding="utf-8")
        hechos.append(("Asistente-Plat", ""))
    return [n for n, _ in hechos]


def telefonos():
    hechos = []
    for n in ("M-Cuentas", "M-Cuenta-Plat", "M-Organizacion", "M-Recuperaciones", "M-Auditoria-Plat", "M-Auditoria-Plat-Detalle"):
        t = leer(n)
        nuevo = FECHA_TEL.sub(r"\g<1>\g<2>/2026\g<3>", t)
        nuevo = re.sub(r'(class="l1"><span[^>]*>|class="l1">)([^<]*)(<span>)(\d{2}/\d{2})( \d{2}:\d{2}</span>)', r"\1\2\3\4/2026\5", nuevo)
        if n == "M-Cuentas":
            nuevo = re.sub(r'(class="l1"><b>[^<]*</b><span>)([^<]*)(</span>)', lambda m: m.group(1) + TEL_ULTIMO.get(m.group(2), m.group(2)) + m.group(3), nuevo)
            nuevo = re.sub(r"(· vence )(\d{2}/\d{2})(</span>)", r"\1\2/2026\3", nuevo)
            # con la fecha completa no entraba en un renglón: el vencimiento va con «Operador» y el estado queda solo
            nuevo = re.sub(r'<span class="l2"><span>Operador</span></span><span class="l3">(<span class="w-est [a-z]+">Invitación [a-z]+</span>) · '
                           r'((?:vence|venció) \d{2}/\d{2}/2026)</span>', r'<span class="l2"><span>Operador · \2</span></span><span class="l3">\1</span>', nuevo)
        if n == "M-Cuenta-Plat":
            nuevo = nuevo.replace("último ingreso hace 55 minutos", "último ingreso 27/09/2026 09:50")
            nuevo = re.sub(r"(· venci?ó? el )(\d{2}/\d{2})(</span>)", r"\1\2/2026\3", nuevo)
            nuevo = re.sub(r"(· (?:vence|venció) el )(\d{2}/\d{2})(</span>)", r"\1\2/2026\3", nuevo)
        if n == "M-Organizacion":
            nuevo = nuevo.replace("<span>hace 55 min</span>", "<span>27/09/2026 09:50</span>").replace("<span>hace 3 días</span>", "<span>24/09/2026 14:20</span>")
        nuevo = nuevo.replace(*PERMISO_VIEJO)
        if nuevo != t:
            (PROJ / f"{n}.dc.html").write_text(nuevo, encoding="utf-8")
            hechos.append(n)
    return hechos


if __name__ == "__main__":
    print("bloque 0 · plataforma:", plataforma())
    print("teléfonos:", telefonos())
